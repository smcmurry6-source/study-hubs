#!/usr/bin/env node
// Database permissions test (RELEASE_TEST_PLAN.md, "Security and RLS"). Builds a throwaway PostgreSQL from
// supabase/schema.sql with Supabase's roles and default grants, seeds made-up rows, then checks as the anonymous
// role (what every visitor's browser is) that:
//   - every table has row-level security, and the direct table access anon has is exactly rls-expectations.json;
//   - a direct read of student data (answers, names, reports, pings, check-ins, comments) returns nothing, and direct
//     writes to anything but reports and suggestions fail;
//   - every security-definer function pins its search_path; the functions the schema revokes stay revoked;
//   - every function that takes p_secret refuses a missing and a wrong secret (and writes nothing), and accepts
//     the right one (so the test means something);
//   - per-visitor reads (get_my_answers, get_personal_stats, the bootstrap, the shop, the rank) return only that
//     visitor's rows, and no function a visitor can run hands back another visitor's id;
//   - Learn and Flashcards (migration_v56): card_reviews is closed to anon, get_my_cards returns only the asking
//     visitor's rows, and record_card_v2 refuses another visitor's request id;
//   - visiting (migration_v54): the tables and helpers behind the visit keys are closed to anon (rls-expectations.json's
//     anonNone and anonNoRun), and a place opened with someone's key, like the boards, carries no visitor id.
// The migrations waiting for their release (supabase/pending-migrations.txt) are applied on top of the schema first, so
// they're checked with everything else. Nothing here touches the live database. Run it whenever a migration or supabase/schema.sql changes:
//   node tools/release/rls.js            (needs PostgreSQL 14+ server binaries: initdb, pg_ctl, psql)
// The live database is checked read-only with tools/release/rls-audit.sql instead.
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), { execFileSync, spawnSync } = require('child_process');
const { pending } = require('./pending');
const ROOT = path.resolve(__dirname, '../..');
const EXPECT = JSON.parse(fs.readFileSync(path.join(__dirname, 'rls-expectations.json'), 'utf8'));
const SECRET = 'rls-test-secret';
const problems = [], notes = [];

function pgBin(){
  if (process.env.PG_BIN) return process.env.PG_BIN;
  try { return execFileSync('pg_config', ['--bindir']).toString().trim(); } catch (e) {}
  const base = '/usr/lib/postgresql';
  if (fs.existsSync(base)) { const v = fs.readdirSync(base).sort((a, b) => Number(b) - Number(a))[0]; if (v && fs.existsSync(path.join(base, v, 'bin', 'initdb'))) return path.join(base, v, 'bin'); }
  return null;
}
const BIN = pgBin();
if (!BIN || !fs.existsSync(path.join(BIN, 'initdb'))) { console.error('✗ RLS test: no PostgreSQL server binaries (set PG_BIN, or install postgresql)'); process.exit(2); }
const asRoot = process.getuid && process.getuid() === 0;
/* initdb refuses to run as root: in a root container, run the server as the postgres user */
function run(cmd, args){ const full = asRoot ? ['-u', 'postgres', '--', path.join(BIN, cmd), ...args] : args; return execFileSync(asRoot ? 'runuser' : path.join(BIN, cmd), full, { stdio: 'pipe' }).toString(); }
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sh-rls-'));
if (asRoot) execFileSync('chown', ['postgres', dir]);
const PORT = String(56000 + Math.floor(Math.random() * 900));
let started = false;
function stop(){ if (started) { try { run('pg_ctl', ['-D', path.join(dir, 'data'), '-m', 'immediate', 'stop']); } catch (e) {} started = false; } try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {} }
process.on('exit', stop);

/* psql: returns rows as arrays; throws with the server's message on an error */
function sql(text, db){
  const r = spawnSync(path.join(BIN, 'psql'), ['-X', '-q', '-v', 'ON_ERROR_STOP=1', '-tA', '-F', '\x1f', '-h', dir, '-p', PORT, '-U', 'postgres', '-d', db || 'rls'], { input: text, encoding: 'utf8' });
  if (r.status !== 0) { const e = new Error((r.stderr || '').replace(/^psql:[^:]*:\d+: /gm, '').trim()); e.sql = text; throw e; }
  return r.stdout.split('\n').filter(l => l.length).map(l => l.split('\x1f'));
}
const q = s => "'" + String(s).replace(/'/g, "''") + "'";
function fail(msg){ problems.push(msg); }

try {
  run('initdb', ['-D', path.join(dir, 'data'), '-U', 'postgres', '-A', 'trust', '--no-sync']);
  run('pg_ctl', ['-D', path.join(dir, 'data'), '-o', `-k ${dir} -p ${PORT} -c listen_addresses='' -c fsync=off`, '-l', path.join(dir, 'log'), '-w', 'start']);
  started = true;
  sql('create database rls', 'postgres');

  /* Supabase's roles and default grants: anon and authenticated get ALL on new tables and functions, so row-level
     security and explicit revokes are what actually protect the data, exactly as on the live project */
  sql(`create role anon nologin noinherit; create role authenticated nologin noinherit; create role service_role nologin noinherit bypassrls;
       grant usage on schema public to anon, authenticated, service_role;
       alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
       alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
       alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;`);
  let schema = fs.readFileSync(path.join(ROOT, 'supabase', 'schema.sql'), 'utf8').split('<ADMIN_SECRET>').join(SECRET);
  try { sql('begin;\n' + schema + '\ncommit;'); }
  catch (e) { fail(`supabase/schema.sql doesn't load into a fresh database: ${e.message.split('\n')[0]}`); throw new Error('stop'); }
  /* the migrations waiting for their release, in order; their grants and revokes count as the schema's last word */
  const waiting = pending(SECRET);
  for (const m of waiting) {
    try { sql('begin;\n' + m.text + '\ncommit;'); }
    catch (e) { fail(`${m.file} (pending) doesn't load on top of supabase/schema.sql: ${e.message.split('\n')[0]}`); throw new Error('stop'); }
    schema += '\n' + m.text;
  }
  const tables = sql(`select c.relname, c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r' order by 1`);
  const fnCount = sql(`select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public'`)[0][0];
  notes.push(`loaded supabase/schema.sql${waiting.length ? ' and the pending ' + waiting.map(m => m.file).join(', ') : ''}: ${tables.length} tables, ${fnCount} functions`);

  /* made-up rows for two visitors, A and B */
  sql(`insert into personal_answers (visitor_id, hub, qid, correct) values ('rls-A','rls-hub','q1',true),('rls-A','rls-hub','q2',false),('rls-A','rls-hub','q3',true),('rls-B','rls-hub','q1',true),('rls-B','rls-hub','q9',false);
       insert into question_flags (hub, note, visitor_id) values ('rls-hub','made-up report','rls-A');
       insert into hub_suggestions (hub, note, visitor_id) values ('rls-hub','made-up suggestion','rls-B');
       insert into visitor_names (visitor_id, display_name) values ('rls-A','Made Up Molar');
       insert into activity_pings (visitor_id, visit_id, hub, section) values ('rls-A','v1','rls-hub','home');
       insert into exam_debriefs (hub, exam, visitor_id, answers) values ('rls-hub','Exam','rls-A','{}');
       insert into podcast_comments (hub, episode, visitor_id, name, body) values ('rls-hub','ep','rls-A','Made Up Molar','made-up comment');
       insert into changelog (hub, message) values ('rls-hub','made-up entry');`);
  const xpA = sql(`select xp, days, answers, correct from public.xp_visitors where visitor_id = 'rls-A'`)[0];
  if (!xpA || xpA.map(Number).join(',') !== '41,1,3,2') fail(`xp_visitors did not incrementally cache A's answers (got ${(xpA || []).join(',') || 'no row'})`);
  /* the game layer's tables (migration_v54), when they're in: B owns things, has XP awards, a boost, an idea, votes and
     an Inbox note, so a function that leaks them shows up below */
  const has = t => sql(`select to_regclass(${q('public.' + t)}) is not null`)[0][0] === 't';
  const game = has('xp_awards') && has('pet_inventory') && has('ideas');
  if (game) {
    sql(`insert into question_keys (hub, qid, kind, answer) values ('rls-hub','q1','one','{1}'),('rls-hub','q2','one','{0}'),('rls-hub','q3','one','{2}'),('rls-hub','q9','one','{3}');
         insert into visitor_names (visitor_id, display_name) values ('rls-B','Made Up Incisor');
         insert into xp_awards (visitor_id, key, src, hub, base, xp, at, d) values ('rls-B','rep:flag:1','report','rls-hub',100,100,now(),current_date);
         insert into xp_boosts (visitor_id, key, src, mult, starts_at, ends_at) values ('rls-B','shop:1','shop',2,now() - interval '1 minute',now() + interval '1 hour');
         insert into pet_purchases (visitor_id, item_id, kind, price, request_id, day) values ('rls-B','bow-tie','outfit',150,'rls-b-buy-0001',current_date);
         insert into pet_inventory (visitor_id, item_id) values ('rls-B','bow-tie');
         insert into pet_equipped (visitor_id, slot, item_id) values ('rls-B','outfit','bow-tie');
         insert into costume_log (visitor_id, costume, first_day) values ('rls-B','pirate',current_date);
         insert into ideas (visitor_id, name, title, hub, category, source) values ('rls-B','Made Up Incisor','A made-up idea','rls-hub','feature','board');
         insert into idea_votes (idea_id, visitor_id, val) select id, 'rls-A', 1 from ideas where visitor_id = 'rls-B';
         insert into idea_reports (idea_id, visitor_id) select id, 'rls-C' from ideas where visitor_id = 'rls-B';
         insert into idea_notes (visitor_id, idea_id, status, note) select 'rls-B', id, 'planned', 'made-up note' from ideas where visitor_id = 'rls-B';
         insert into xp_sessions (visitor_id, hub, kind, started_at) values ('rls-B','rls-hub','mock',now());`);
    /* Learn and Flashcards (migration_v56): B has ratings and a Learn step, A one rating */
    if (has('card_reviews')) sql(`insert into card_reviews (visitor_id, hub, qid, what, request_id) values ('rls-B','rls-hub','q1','good','rls-b-card-0001'),
         ('rls-B','rls-hub','q9','learn-1','rls-b-card-0002'), ('rls-A','rls-hub','q2','again','rls-a-card-0001');`);
  }

  /* 1. row-level security on, and anon's direct access is exactly the expected list */
  tables.filter(t => t[1] !== 't').forEach(t => fail(`table ${t[0]} has row-level security off (anon can read and write it directly)`));
  const pol = sql(`select tablename, cmd from pg_policies where schemaname = 'public' and (roles && array['anon','public']::name[])`);
  const allowed = { SELECT: new Set(), INSERT: new Set(), UPDATE: new Set(), DELETE: new Set() };
  pol.forEach(([t, cmd]) => (cmd === 'ALL' ? Object.keys(allowed) : [cmd]).forEach(c => allowed[c].add(t)));
  for (const [cmd, key] of [['SELECT', 'anonSelect'], ['INSERT', 'anonInsert'], ['UPDATE', 'anonUpdate'], ['DELETE', 'anonDelete']]) {
    const want = new Set(EXPECT[key]), got = [...allowed[cmd]].filter(t => sql(`select has_table_privilege('anon', ${q('public.' + t)}, ${q(cmd)})`)[0][0] === 't');
    got.filter(t => !want.has(t)).forEach(t => fail(`anon can ${cmd} table ${t} directly, which rls-expectations.json doesn't allow`));
    [...want].filter(t => !got.includes(t)).forEach(t => fail(`anon can no longer ${cmd} table ${t} directly; the site relies on it (or update rls-expectations.json in the same PR as the migration)`));
  }
  /* 2. the same, by trying it: student data stays unreadable, writes fail */
  for (const [t] of tables) {
    let n;
    try { n = Number(sql(`begin; set local role anon; select count(*) from public.${t}; rollback;`)[0][0]); } catch (e) { n = -1; }
    if (n > 0 && !EXPECT.anonSelect.includes(t)) fail(`anon read ${n} row(s) of ${t} directly`);
  }
  for (const [t, cols] of [['personal_answers', `(visitor_id, hub, qid, correct) values ('x','rls-hub','q1',true)`], ['changelog', `(message) values ('x')`], ['visitor_names', `(visitor_id, display_name) values ('x','x')`], ['achievements', `(visitor_id, kind) values ('x','x')`]]) {
    let ok = false; try { sql(`begin; set local role anon; insert into public.${t} ${cols}; rollback;`); ok = true; } catch (e) {}
    if (ok) fail(`anon inserted into ${t} directly`);
  }
  try { sql(`begin; set local role anon; insert into public.question_flags (hub, note) values ('rls-hub','x'); rollback;`); } catch (e) { fail(`anon can't file a question report any more: ${e.message.split('\n')[0]}`); }
  for (const t of ['changelog', 'personal_answers', 'question_flags', 'visitor_names']) {
    const u = sql(`begin; set local role anon; with x as (update public.${t} set ${t === 'personal_answers' ? 'correct = not correct' : t === 'visitor_names' ? "display_name = 'x'" : t === 'changelog' ? "message = 'x'" : "note = 'x'"} returning 1) select count(*) from x; rollback;`.replace(/^/, ''))[0];
    if (u && Number(u[0]) > 0) fail(`anon updated ${u[0]} row(s) of ${t} directly`);
    const d = sql(`begin; set local role anon; with x as (delete from public.${t} returning 1) select count(*) from x; rollback;`)[0];
    if (d && Number(d[0]) > 0) fail(`anon deleted ${d[0]} row(s) of ${t} directly`);
  }

  /* 3. functions: search_path pinned, revokes kept */
  sql(`select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.prosecdef
       and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')`).forEach(([f]) => fail(`security-definer function ${f} doesn't set search_path`));
  /* the schema's last word on each function for anon: "revoke ... from public, anon" then "grant execute ... to anon"
     is the usual pattern (open to visitors, closed to everyone else); only a function left revoked must stay shut */
  const last = new Map();
  for (const m of schema.matchAll(/^(revoke|grant) (?:all|execute)(?: privileges)? on function (public\.\w+)\(([^)]*)\) (?:from|to) ([^;]+);/gim)) {
    if (/\banon\b|\bpublic\b/i.test(m[4])) last.set(m[2] + '(' + m[3] + ')', m[1].toLowerCase());
  }
  const revoked = [...last].filter(([, v]) => v === 'revoke').map(([k]) => k);
  for (const sig of revoked) {
    let can = 'f'; try { can = sql(`select has_function_privilege('anon', ${q(sig)}, 'execute')`)[0][0]; } catch (e) { continue; }
    if (can === 't') fail(`${sig} is revoked in the schema but anon can still run it`);
  }
  notes.push(`${revoked.length} revoked functions checked`);

  /* 4. every function with p_secret: no secret and a wrong secret are refused and write nothing; the right one works */
  const fns = sql(`select p.oid, p.proname, array_to_string(p.proargnames, ','), array_to_string(array(select format_type(t, null) from unnest(p.proargtypes) t), ','), coalesce(array_to_string(p.proargmodes, ','), '')
                   from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and 'p_secret' = any(p.proargnames)
                   and has_function_privilege('anon', p.oid, 'execute') order by 2`);
  const VAL = { text: "'rls-x'", integer: '1', bigint: '1', smallint: '1', numeric: '1', boolean: 'true', jsonb: "'{}'::jsonb", json: "'{}'::json", date: 'current_date',
    'timestamp with time zone': 'now()', 'text[]': "'{}'::text[]", 'integer[]': "'{}'::integer[]", 'bigint[]': "'{}'::bigint[]" };
  let refusedOk = 0;
  for (const [, name, argNames, argTypes, modes] of fns) {
    const names = argNames.split(','), types = argTypes.split(','), m = modes ? modes.split(',') : [];
    const ins = names.map((n, i) => ({ n, t: types[i], mode: m[i] || 'i' })).filter(a => a.mode === 'i' || a.mode === 'b');
    const call = secret => `public.${name}(` + ins.map(a => `${a.n} => ${a.n === 'p_secret' ? secret : (a.n === 'p_visitor' ? "'rls-A'" : a.n === 'p_hub' ? "'rls-hub'" : VAL[a.t] || `null::${a.t}`)}`).join(', ') + ')';
    for (const [label, secret] of [['no secret', 'null::text'], ['a wrong secret', "'wrong-secret'"]]) {
      try {
        const out = sql(`begin; set local role anon; select 'R', (select coalesce(json_agg(x), '[]') from ${call(secret)} x); reset role;
                         select 'W', coalesce(sum(n_tup_ins + n_tup_upd + n_tup_del), 0) from pg_stat_xact_user_tables; rollback;`);
        const res = (out.find(r => r[0] === 'R') || [])[1] || '[]', writes = Number((out.find(r => r[0] === 'W') || [])[1] || 0);
        const empty = /^\[\]$|^\[\{"[^"]+":(null|false)\}\]$/.test(res.replace(/\s/g, ''));
        if (writes > 0) fail(`${name} with ${label}: wrote ${writes} row(s)`);
        else if (!empty) fail(`${name} with ${label}: answered (${res.slice(0, 80)})`);
        else refusedOk++;
      } catch (e) { refusedOk++; /* raised: refused */ }
    }
    try { sql(`begin; set local role anon; select count(*) from ${call(q(SECRET))} x; rollback;`); }
    catch (e) { if (/unauthori[sz]ed|not allowed|forbidden|28000|permission denied/i.test(e.message)) fail(`${name} refuses the right secret too (${e.message.split('\n')[0]}), so this test can't tell`); }
  }
  notes.push(`${fns.length} secret-gated functions refused no secret and a wrong one (${refusedOk} checks)`);
  sql(`select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname like 'admin\\_%'
       and not ('p_secret' = any(coalesce(p.proargnames, '{}'))) and has_function_privilege('anon', p.oid, 'execute')`).forEach(([f]) => fail(`${f} is an admin function anon can run without a secret`));

  /* 5. per-visitor reads stay per visitor */
  const mine = JSON.parse(sql(`begin; set local role anon; select public.get_my_answers('rls-A', 'rls-hub')::text; rollback;`)[0][0]);
  if (mine.length !== 3) fail(`get_my_answers for visitor A returned ${mine.length} rows, expected A's 3`);
  const stats = sql(`begin; set local role anon; select coalesce(sum(attempts), 0) from public.get_personal_stats('rls-A', 'rls-hub'); rollback;`)[0][0];
  if (Number(stats) !== 3) fail(`get_personal_stats for visitor A counted ${stats} answers, expected A's 3`);
  const none = JSON.parse(sql(`begin; set local role anon; select public.get_my_answers(null, 'rls-hub')::text; rollback;`)[0][0]);
  if (none.length) fail('get_my_answers with no visitor returned rows');
  const bootstrap = JSON.parse(sql(`begin; set local role anon; select public.get_widget_bootstrap('rls-A', 'rls-hub', null, 'ep')::text; rollback;`)[0][0]);
  if (!Array.isArray(bootstrap.answers) || bootstrap.answers.length !== 3) fail(`get_widget_bootstrap for visitor A returned ${bootstrap.answers && bootstrap.answers.length} answers, expected A's 3`);
  if (!bootstrap.rank || Number(bootstrap.rank.xp) !== 41 || Number(bootstrap.rank.answers) !== 3) fail(`get_widget_bootstrap's rank for visitor A is ${JSON.stringify(bootstrap.rank)}, expected A's 41 XP over 3 answers`);
  const bm = (bootstrap.mastery || []).filter(r => r.hub === 'rls-hub')[0];
  if (!bm || Number(bm.seen) !== 3 || Number(bm.latest_correct) !== 2) fail(`get_widget_bootstrap's mastery for visitor A is ${JSON.stringify(bootstrap.mastery)}, expected 2 of 3 in rls-hub`);
  const emptyBootstrap = JSON.parse(sql(`begin; set local role anon; select public.get_widget_bootstrap(null, 'rls-hub', null, null)::text; rollback;`)[0][0]);
  if ((emptyBootstrap.answers || []).length || (emptyBootstrap.pins || []).length || (emptyBootstrap.inbox || []).length || emptyBootstrap.rank || (emptyBootstrap.mastery || []).length) fail('get_widget_bootstrap with no visitor returned visitor data');
  notes.push('get_my_answers, get_personal_stats and get_widget_bootstrap return only the asking visitor\'s rows');

  /* 6. the game layer's per-visitor reads (migration_v54) */
  if (game) {
    const asAnon = t => JSON.parse(sql(`begin; set local role anon; select (${t})::text; rollback;`)[0][0]);
    const shopA = asAnon(`public.get_my_shop('rls-A')`), shopN = asAnon(`public.get_my_shop(null)`);
    /* gifts (Halloween's set) are everyone's and rank items come with the rank: neither is anyone else's thing */
    const bought = inv => (inv || []).filter(i => i.how !== 'gift' && i.how !== 'rank');
    if (bought(shopA.inventory).length || Object.keys(shopA.equipped).length || shopA.costumes.length || shopA.boost || !shopA.wallet || shopA.wallet.spent !== 0)
      fail(`get_my_shop for visitor A shows someone else's things: ${JSON.stringify({ inv: shopA.inventory, eq: shopA.equipped, boost: shopA.boost, wallet: shopA.wallet })}`);
    if (shopN.wallet || shopN.inventory.length || shopN.boost) fail('get_my_shop with no visitor returned visitor data');
    const rankA = asAnon(`public.get_rank_profile_v2('rls-A')`);
    if (!rankA || Number(rankA.xp) !== 41 || rankA.boost) fail(`get_rank_profile_v2 for visitor A is ${JSON.stringify(rankA)}, expected A's 41 XP and no boost`);
    const b2 = asAnon(`public.get_widget_bootstrap_v2('rls-A', 'rls-hub', null, 'ep')`), b2n = asAnon(`public.get_widget_bootstrap_v2(null, 'rls-hub', null, null)`);
    if ((b2.answers || []).length !== 3 || !b2.rank || Number(b2.rank.xp) !== 41 || bought(b2.shop.inventory).length) fail(`get_widget_bootstrap_v2 for visitor A doesn't match A's rows (${(b2.answers || []).length} answers, rank ${JSON.stringify(b2.rank && b2.rank.xp)})`);
    if ((b2n.answers || []).length || b2n.rank || (b2n.inbox || []).length || (b2n.shop && b2n.shop.wallet)) fail('get_widget_bootstrap_v2 with no visitor returned visitor data');
    const inboxA = asAnon(`(select coalesce(json_agg(x), '[]') from public.get_my_inbox_v2('rls-A') x)`);
    if (inboxA.some(r => r.kind === 'idea')) fail('get_my_inbox_v2 for visitor A shows B\'s idea notes');
    const board = asAnon(`public.get_ideas('rls-A')`);
    if (!board.ideas.length || board.ideas.some(i => i.own) || board.ideas[0].mine !== 1) fail(`get_ideas for visitor A: ${JSON.stringify(board.ideas)} (expected B's idea, not A's own, with A's up vote)`);
    notes.push('get_my_shop, get_rank_profile_v2, get_widget_bootstrap_v2, get_my_inbox_v2 and get_ideas return only the asking visitor\'s rows');
    /* Learn and Flashcards (migration_v56): your own ratings, never another visitor's, and another's request id is refused */
    if (has('card_reviews')) {
      const cardsA = asAnon(`public.get_my_cards('rls-A', 'rls-hub')`), cardsN = asAnon(`public.get_my_cards(null, 'rls-hub')`);
      if (cardsA.length !== 1 || cardsA[0][0] !== 'q2' || cardsA[0][1] !== 'again') fail(`get_my_cards for visitor A returned ${JSON.stringify(cardsA)}, expected A's one rating`);
      if (cardsN.length) fail('get_my_cards with no visitor returned rows');
      const dupB = asAnon(`public.record_card_v2('rls-A', 'rls-hub', 'q1', 'good', false, 'rls-b-card-0001', null)`);
      if (dupB.error !== 'dup' || Number(sql(`select count(*) from public.card_reviews where request_id = 'rls-b-card-0001' and visitor_id = 'rls-A'`)[0][0]))
        fail(`record_card_v2 with B's request id answered ${JSON.stringify(dupB)} for A (expected it refused, nothing written)`);
      notes.push('get_my_cards returns only the asking visitor\'s ratings; record_card_v2 refuses another visitor\'s request id');
    }

    /* 6b. visiting (migration_v54): what's behind the visit keys is closed to anon, and a place gives no id away */
    for (const t of EXPECT.anonNone || []) {
      if (!has(t)) { fail(`rls-expectations.json's anonNone lists ${t}, which isn't a table`); continue; }
      for (const p of ['select', 'insert', 'update', 'delete']) if (sql(`select has_table_privilege('anon', ${q('public.' + t)}, ${q(p)})`)[0][0] === 't') fail(`anon has ${p} on ${t}, which must be closed to anon altogether`);
      if (Number(sql(`select count(*) from pg_policies where schemaname = 'public' and tablename = ${q(t)}`)[0][0])) fail(`${t} has a row-level security policy; it must have none`);
      /* an update of the table's first ordinary column to itself (not every closed table has a visitor_id) */
      const col = (sql(`select attname from pg_attribute where attrelid = ${q('public.' + t)}::regclass and attnum > 0 and not attisdropped and attidentity = '' and attgenerated = '' order by attnum limit 1`)[0] || [])[0];
      for (const [what, stmt] of [['read', `select count(*) from public.${t}`], ['insert into', `insert into public.${t} default values`], ['update', `update public.${t} set ${col} = ${col}`], ['delete from', `delete from public.${t}`]]) {
        let done = false; try { sql(`begin; set local role anon; ${stmt}; rollback;`); done = true; } catch (e) { if (!/permission denied/i.test(e.message)) done = true; }
        if (done) fail(`anon could ${what} ${t} directly (or it failed for another reason than permission)`);
      }
    }
    for (const sig of EXPECT.anonNoRun || []) {
      let can; try { can = sql(`select has_function_privilege('anon', ${q('public.' + sig)}, 'execute')`)[0][0]; } catch (e) { fail(`rls-expectations.json's anonNoRun lists ${sig}, which isn't a function`); continue; }
      if (can === 't') fail(`anon can run ${sig}, which must be closed to anon`);
    }
    let ran = false; try { sql(`begin; set local role anon; select public.sh_visit_key('rls-B'); rollback;`); ran = true; } catch (e) {}
    if (ran) fail('anon worked out a visit key from a visitor id (sh_visit_key)');
    const keyB = sql(`select public.sh_visit_key('rls-B')`)[0][0], keyC = sql(`select public.sh_visit_key('rls-C')`)[0][0];
    const anonText = t => sql(`begin; set local role anon; select coalesce((${t})::text, 'null'); rollback;`).map(r => r.join(' ')).join(' ');
    const placeB = anonText(`public.get_place(${q(keyB)})`);
    let pB = null; try { pB = JSON.parse(placeB); } catch (e) {}
    if (!pB || pB.name !== 'Made Up Incisor' || !pB.equipped || pB.equipped.outfit !== 'bow-tie') fail(`get_place with B's key doesn't show B's place: ${placeB.slice(0, 120)}`);
    else if (Object.keys(pB).sort().join(',') !== 'equipped,flair,name,rank') fail(`get_place returns more than a place shows: ${Object.keys(pB).sort().join(',')}`);
    if (/rls-[ABC]/.test(placeB) || placeB.includes(keyB)) fail(`get_place hands back a visitor id or the key: ${placeB.slice(0, 120)}`);
    for (const bad of [`'rls-B'`, `'rls-A'`, `repeat('0', 24)`, `null::text`]) if (anonText(`public.get_place(${bad})`) !== 'null') fail(`get_place(${bad}) answered; only a visit key opens a place`);
    const boards = { get_rank_board_v2: `'rls-A', 50`, get_leaderboard_v2: '50', get_correct_streak_stats_v2: '', get_arcade_leaderboard_v2: `'rls-hub', 'board', 'rls-A', 50` };
    sql(`insert into arcade_scores (hub, game, visitor_id, score) values ('rls-hub','board','rls-B',10), ('rls-hub','board','rls-C',20);
         insert into correct_streaks (visitor_id, current_streak, best_streak) values ('rls-B', 7, 7) on conflict (visitor_id) do update set current_streak = 7, best_streak = 7;`);
    let withKey = 0, withKeyC = 0;
    for (const [f, args] of Object.entries(boards)) {
      const text = anonText(`select coalesce(json_agg(x), '[]') from public.${f}(${args}) x`);
      if (/rls-[ABC]/.test(text)) fail(`${f} hands back a visitor id: ${text.slice(0, 120)}`);
      let r = []; try { r = JSON.parse(text); } catch (e) {}
      if (r.length && !r.every(x => 'visit' in x && /^[0-9a-f]{24}$/.test(x.visit || ''))) fail(`${f}: a row without a visit key (no one can turn visiting off)`);
      if (text.includes(keyB)) withKey++;
      if (text.includes(keyC)) withKeyC++;
    }
    if (withKey < 3) fail(`B's visit key should be on the rank board, the arcade board and the answer-streak stats; found on ${withKey} board(s)`);
    /* no opt-out (Sam, 2026-11-11): C, on the arcade board only, has a key there and a place it opens */
    const placeC = anonText(`public.get_place(${q(keyC)})`);
    if (!withKeyC || placeC === 'null' || /rls-[ABC]/.test(placeC)) fail(`C (on the arcade board only) should have a key there that opens C's place, without an id: on ${withKeyC} board(s), ${placeC.slice(0, 120)}`);
    notes.push(`visiting: ${(EXPECT.anonNone || []).length} tables and ${(EXPECT.anonNoRun || []).length} helpers closed to anon; get_place and the four boards give a key, never an id`);
  }

  /* 7. no function a visitor can run hands back another visitor's id: every one (but triggers) is called as anon with A's
     id, the hub, no secret and its defaults, in a transaction that's rolled back, and B's id must never come back */
  const callable = sql(`select p.proname, array_to_string(p.proargnames, ','), array_to_string(array(select format_type(t, null) from unnest(p.proargtypes) t), ','),
                          coalesce(array_to_string(p.proargmodes, ','), ''), p.pronargs - p.pronargdefaults, p.proretset, format_type(p.prorettype, null)
                        from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.prokind = 'f'
                          and format_type(p.prorettype, null) not in ('trigger', 'event_trigger') and has_function_privilege('anon', p.oid, 'execute') order by 1`);
  let scanned = 0, raised = 0;
  for (const [name, argNames, argTypes, modes, required, retset, rettype] of callable) {
    const names = argNames ? argNames.split(',') : [], types = argTypes ? argTypes.split(',') : [], m = modes ? modes.split(',') : [];
    const ins = names.map((n, i) => ({ n, t: types[i], mode: m[i] || 'i' })).filter(a => a.mode === 'i' || a.mode === 'b').slice(0, Number(required));
    for (const visitor of ["'rls-A'", 'null::text']) {
      const args = ins.map(a => `${a.n} => ${a.n === 'p_secret' ? 'null::text' : /^p_(visitor|primary|alias|me)$/.test(a.n) ? visitor : a.n === 'p_hub' ? "'rls-hub'" : VAL[a.t] || `null::${a.t}`}`).join(', ');
      const call = `public.${name}(${args})`;
      const pick = rettype === 'void' ? `select ${call}, ''` : retset === 't' || rettype === 'record' ? `select 'R', coalesce(json_agg(x), '[]')::text from ${call} x` : `select 'R', (${call})::text`;
      let out;
      try { out = sql(`begin; set local role anon; ${pick}; rollback;`); scanned++; }
      catch (e) { raised++; continue; }
      const text = out.map(r => r.join(' ')).join(' ');
      if (/rls-B|rls-C/.test(text)) fail(`${name}(${visitor === 'null::text' ? 'no visitor' : "visitor A"}) hands back another visitor's id: ${text.slice(0, 120)}`);
      if (visitor === 'null::text' && /rls-A/.test(text)) fail(`${name}(no visitor) hands back visitor A's id: ${text.slice(0, 120)}`);
    }
  }
  notes.push(`${callable.length} functions anon can run scanned for other visitors' ids (${scanned} calls answered, ${raised} refused their made-up arguments)`);
} catch (e) {
  if (e.message !== 'stop') fail(`test run failed: ${e.message.split('\n')[0]}`);
}
stop();
notes.forEach(n => console.log('  ' + n));
if (problems.length) { console.error(`\n✗ database permissions: ${problems.length} problem(s):\n` + problems.map(p => '  - ' + p).join('\n')); process.exit(1); }
console.log('\n✓ database permissions (RLS, grants, secret-gated functions) passed');
