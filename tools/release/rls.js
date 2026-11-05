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
//   - per-visitor reads (get_my_answers, get_personal_stats) return only that visitor's rows.
// Nothing here touches the live database. Run it whenever a migration or supabase/schema.sql changes:
//   node tools/release/rls.js            (needs PostgreSQL 14+ server binaries: initdb, pg_ctl, psql)
// The live database is checked read-only with tools/release/rls-audit.sql instead.
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), { execFileSync, spawnSync } = require('child_process');
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
  const schema = fs.readFileSync(path.join(ROOT, 'supabase', 'schema.sql'), 'utf8').split('<ADMIN_SECRET>').join(SECRET);
  try { sql('begin;\n' + schema + '\ncommit;'); }
  catch (e) { fail(`supabase/schema.sql doesn't load into a fresh database: ${e.message.split('\n')[0]}`); throw new Error('stop'); }
  const tables = sql(`select c.relname, c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r' order by 1`);
  const fnCount = sql(`select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public'`)[0][0];
  notes.push(`loaded supabase/schema.sql: ${tables.length} tables, ${fnCount} functions`);

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
  const emptyBootstrap = JSON.parse(sql(`begin; set local role anon; select public.get_widget_bootstrap(null, 'rls-hub', null, null)::text; rollback;`)[0][0]);
  if ((emptyBootstrap.answers || []).length || (emptyBootstrap.pins || []).length || (emptyBootstrap.inbox || []).length) fail('get_widget_bootstrap with no visitor returned visitor data');
  notes.push('get_my_answers, get_personal_stats and get_widget_bootstrap return only the asking visitor\'s rows');
} catch (e) {
  if (e.message !== 'stop') fail(`test run failed: ${e.message.split('\n')[0]}`);
}
stop();
notes.forEach(n => console.log('  ' + n));
if (problems.length) { console.error(`\n✗ database permissions: ${problems.length} problem(s):\n` + problems.map(p => '  - ' + p).join('\n')); process.exit(1); }
console.log('\n✓ database permissions (RLS, grants, secret-gated functions) passed');
