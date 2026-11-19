#!/usr/bin/env node
// The answer save on two throwaway copies, before and after the migrations in supabase/pending-migrations.txt: the way the
// database optimization pass measures a change (vault/tasks/2026-11-18-database-optimization-pass.md). Never the live database.
//   A: supabase/schema.sql (the live database).  B: the same, then the pending migrations.
// Both get the same made-up class from a seeded generator: a bank of 440 (one-choice, select-all, order, self-graded), a
// heavy student (8,000 answers), a middling one (3,300), a light one (500) and 40 more (300-900 each), with mocks, arcade
// games, flashcard ratings, replayed calls, double taps and fast answers, about 37,000 calls in time order, as sh_answer,
// sh_card and the session calls run them (a commit every 50).
// Then it checks that B changes nothing a student sees or earns: the same reply to every call, the same wallet for every
// student, the same rows in every table (columns a copy sets itself left out: uuids, created_at and the like), and on B
// every running total (xp_award_totals) equal to the sum of its awards. Then it times 200 more answers by each of the
// three students on each copy, A and B taken in turn, three rounds (each answer its own transaction, as PostgREST runs one).
//   node tools/release/bench-answers.js                 (about 4 minutes; PostgreSQL server binaries, as the suites need)
//   node tools/release/bench-answers.js --statements    also the statements inside the calls that took the most time on
//                                                        each copy (needs the pg_stat_statements extension installed)
// Analyze after loading made-up rows: without it the medal check's plan read 30 times as many rows (found 2026-11-19).
'use strict';
const path = require('path'), { spawnSync } = require('child_process');
const { throwaway } = require('./pg');
const STATEMENTS = process.argv.includes('--statements');
const SECRET = 'bench-secret';
const problems = [];

function build(which){
  const db = throwaway(SECRET, { pending: false, settings: STATEMENTS ? ['-c shared_preload_libraries=pg_stat_statements', '-c pg_stat_statements.track=all'] : [] });
  const applied = which === 'B' ? db.applyPending() : [];
  const { sql, q } = db;
  if (STATEMENTS) sql('create extension if not exists pg_stat_statements');
  // the bank
  const keys = [];
  for (let i = 0; i < 400; i++) keys.push({ id: 'q' + i, kind: 'one', answer: [i % 4] });
  for (let i = 0; i < 20; i++) keys.push({ id: 's' + i, kind: 'all', answer: [0, 2] });
  for (let i = 0; i < 10; i++) keys.push({ id: 'o' + i, kind: 'order', answer: [2, 0, 1, 3] });
  for (let i = 0; i < 10; i++) keys.push({ id: 'f' + i, kind: 'self' });
  sql(`select admin_load_question_keys(${q(SECRET)}, 'hb', ${q(JSON.stringify(keys))}::jsonb)`);
  // the class
  const R = rng(20261119), pick = a => a[Math.floor(R() * a.length)];
  const T0 = Date.parse('2030-03-04T14:00:00Z') / 1000;
  const students = [['bench-H', 8000, 0.8, 24], ['bench-M', 3300, 0.7, 14], ['bench-L', 500, 0.6, 4]];
  for (let i = 0; i < 40; i++) students.push(['bench-c' + i, 300 + Math.floor(R() * 600), 0.5 + R() * 0.35, 3 + Math.floor(R() * 10)]);
  const ev = [];   // [at, op, visitor, qid, choice, picks, self, ctx (or a card's rating), request, session tag, score]
  let reqN = 0;
  const req = () => 'rq' + String(++reqN).padStart(8, '0');
  for (const [v, n, p, days] of students) {
    const per = Math.ceil(n / days); let made = 0;
    for (let d = 0; d < days && made < n; d++) {
      let t = T0 + d * 86400 + Math.floor(R() * 4 * 3600);
      const hot = Array.from({ length: 60 }, () => Math.floor(R() * 440));
      if (n >= 3000 && d % 4 === 1) {   // a mock
        const tag = v + ':m' + d; ev.push([t, 'ms', v, null, null, null, null, null, null, tag, null]); t += 5;
        for (let k = 0; k < 30; k++, made++) { const qi = Math.floor(R() * 400); ev.push([t, 'a', v, 'q' + qi, R() < p ? qi % 4 : (qi + 1) % 4, null, null, 'mock', req(), tag, null]); t += 3 + Math.floor(R() * 20); }
        ev.push([t, 'mf', v, null, null, null, null, null, null, tag, null]); t += 30;
      }
      if (n >= 3000 && d % 3 === 2) {   // an arcade game
        const tag = v + ':g' + d; ev.push([t, 'gs', v, null, null, null, null, null, null, tag, null]); t += 5;
        let sc = 0;
        for (let k = 0; k < 15; k++, made++) { const qi = Math.floor(R() * 400), ok = R() < p; if (ok) sc++; ev.push([t, 'a', v, 'q' + qi, ok ? qi % 4 : (qi + 1) % 4, null, null, 'arcade', req(), tag, null]); t += 2 + Math.floor(R() * 6); }
        ev.push([t, 'gf', v, null, null, null, null, null, null, tag, sc]); t += 30;
      }
      for (let k = 0; k < per && made < n; k++, made++) {
        const r = R(), qi = R() < 0.6 ? pick(hot) : Math.floor(R() * 440), ok = R() < p;
        const ctx = r < 0.6 ? 'bank' : r < 0.75 ? 'drill' : r < 0.85 ? 'misses' : r < 0.9 ? 'weak' : r < 0.95 ? 'learn' : 'review';
        let qid, choice = null, picks = null, self = null;
        if (qi < 400) { qid = 'q' + qi; choice = ok ? qi % 4 : (qi + 1 + Math.floor(R() * 3)) % 4; }
        else if (qi < 420) { qid = 's' + (qi - 400); picks = ok ? [0, 2] : [0]; }
        else if (qi < 430) { qid = 'o' + (qi - 420); picks = ok ? [2, 0, 1, 3] : [0, 1, 2, 3]; }
        else { qid = 'f' + (qi - 430); self = ok; }
        const e = [t, 'a', v, qid, choice, picks, self, ctx, req(), null, null];
        ev.push(e);
        const x = R();
        if (x < 0.02) ev.push(e.slice());                                                                 // a replayed call
        else if (x < 0.03) ev.push([t + 1, 'a', v, qid, choice, picks, self, ctx, req(), null, null]);    // a double tap
        else if (x < 0.06) ev.push([t + 1, 'c', v, 'q' + Math.floor(R() * 400), null, null, null, pick(['again', 'hard', 'good', 'easy']), req(), null, null]);
        t += x < 0.1 ? 1 : 4 + Math.floor(R() * 25);
        if (R() < 0.02) t += 3600 + Math.floor(R() * 7200);   // a break
      }
    }
  }
  ev.forEach((e, i) => e.push(i));
  ev.sort((a, b) => a[0] - b[0] || a[11] - b[11]);   // the class answers at the same time
  const lit = x => x == null ? 'null' : typeof x === 'string' ? q(x) : Array.isArray(x) ? `'{${x.join(',')}}'` : String(x);
  sql(`create table bench_work (i int primary key, at timestamptz, op text, v text, qid text, choice int, picks int[], self boolean, ctx text, req text, stag text, extra int);
       create table bench_out (i int primary key, r jsonb); create table bench_sess (tag text primary key, sid uuid);`);
  for (let s = 0; s < ev.length; s += 4000)
    sql('insert into bench_work values ' + ev.slice(s, s + 4000).map((e, k) => `(${s + k}, to_timestamp(${e[0]}), ${e.slice(1, 11).map(lit).join(', ')})`).join(','));
  sql(`create procedure bench_run() language plpgsql as $$
    declare w record; r jsonb; sid uuid; k int := 0;
    begin
      for w in select * from bench_work order by i loop
        sid := (select s.sid from bench_sess s where s.tag = w.stag);
        if w.op = 'a' then r := sh_answer(w.at, w.v, 'hb', w.qid, w.choice, w.picks, w.self, null, w.ctx, w.req, sid, null);
        elsif w.op = 'c' then r := sh_card(w.at, w.v, 'hb', w.qid, w.ctx, false, w.req, null);
        elsif w.op in ('ms', 'gs') then
          sid := sh_session_start(w.at, w.v, 'hb', case when w.op = 'ms' then 'mock' else 'arcade' end, case when w.op = 'gs' then 'g1' end);
          insert into bench_sess values (w.stag, sid); r := jsonb_build_object('started', sid is not null);
        else r := sh_session_finish(w.at, w.v, sid, w.extra, case when w.op = 'mf' then 30 else 15 end);
        end if;
        insert into bench_out values (w.i, r);
        k := k + 1;
        if k % 50 = 0 then commit; end if;
      end loop;
      commit;
    end $$`);
  const t0 = Date.now();
  sql('call bench_run()');
  sql('vacuum analyze');
  console.log(`  ${which}: ${ev.length} calls loaded in ${((Date.now() - t0) / 1000).toFixed(0)} s${applied.length ? ' with ' + applied.join(', ') : ''}; ` +
    sql(`select count(*) || ' answers, ' || (select count(*) from xp_awards) || ' awards (the heavy student ' || (select count(*) from xp_awards where visitor_id = 'bench-H') || ')' from personal_answers`)[0][0]);
  return { which, db, sql, q, T0 };
}

function rng(seed){ return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function snapshot(X){
  const { sql } = X, uu = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g;
  const replies = sql(`select i, r::text from bench_out order by i`).map(r => r.join('\t').replace(uu, '<uuid>'));
  const wallets = sql(`select v, sh_wallet(v)::text from (select distinct v from bench_work) z order by 1`).map(r => r.join('\t'));
  const tables = {};
  for (const [t] of sql(`select relname from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r' and relname not like 'bench_%' order by 1`)) {
    const cols = sql(`select attname, format_type(atttypid, atttypmod) from pg_attribute where attrelid = 'public.${t}'::regclass and attnum > 0 and not attisdropped order by attnum`);
    const sel = cols.filter(([n, ty]) => ty !== 'uuid' && !/^(created_at|updated_at|seen_at|bought_at|tried_at|loaded_at|v2_at|secret)$/.test(n)).map(([n]) => `t.${n}`)
      .concat(cols.filter(([, ty]) => ty === 'uuid').map(([n]) => `(t.${n} is null)`)).join(', ') || "''";
    tables[t] = sql(`select count(*) || ' ' || coalesce(md5(string_agg(x, '|' order by x)), '') from (select (${sel})::text as x from public.${t} t) z`)[0][0];
  }
  return { replies, wallets, tables };
}

function psqlScript(X, text){
  const t0 = process.hrtime.bigint();
  const r = spawnSync(path.join(X.db.bin, 'psql'), ['-X', '-q', '-v', 'ON_ERROR_STOP=1', '-tA', '-h', X.db.dir, '-p', X.db.port, '-U', 'postgres', '-d', 'ops', '-o', '/dev/null'], { input: text, encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error(r.stderr.slice(0, 2000));
  return Number(process.hrtime.bigint() - t0) / 1e6;
}

const A = build('A'), B = build('B');
try {
  const a = snapshot(A), b = snapshot(B);
  const firstDiff = (x, y) => { for (let i = 0; i < Math.max(x.length, y.length); i++) if (x[i] !== y[i]) return `${x[i]}  vs  ${y[i]}`; return null; };
  const dr = firstDiff(a.replies, b.replies); if (dr) problems.push('a reply differs: ' + dr.slice(0, 600));
  const dw = firstDiff(a.wallets, b.wallets); if (dw) problems.push('a wallet differs: ' + dw.slice(0, 600));
  for (const t of Object.keys(a.tables)) if (a.tables[t] !== b.tables[t]) problems.push(`table ${t} differs (rows and checksum: ${a.tables[t]} vs ${b.tables[t] || 'missing'})`);
  const extra = Object.keys(b.tables).filter(t => !(t in a.tables));
  if (extra.includes('xp_award_totals')) {
    const n = B.sql(`select count(*) from (select visitor_id, src, count(*)::int n, sum(base)::int b, sum(xp)::int x from xp_awards group by 1, 2) a
      full join (select * from xp_award_totals where n <> 0 or base <> 0 or xp <> 0) t using (visitor_id, src)
      where a.n is distinct from t.n or a.b is distinct from t.base or a.x is distinct from t.xp`)[0][0];
    if (n !== '0') problems.push(`${n} running totals differ from the sums of their awards`);
  }
  console.log(`  compared: ${a.replies.length} replies, ${a.wallets.length} wallets, ${Object.keys(a.tables).length} tables` + (extra.length ? ` (B adds ${extra.join(', ')})` : ''));

  // timings: A and B in turn, three rounds of 200 answers by each of the three students
  if (STATEMENTS) [A, B].forEach(X => X.sql('select pg_stat_statements_reset()'));
  const res = { A: {}, B: {} };
  for (let r = 0; r < 3; r++) for (const X of (r % 2 ? [B, A] : [A, B])) for (const v of ['bench-H', 'bench-M', 'bench-L']) {
    const RR = rng(1000 + r), lines = []; let t = X.T0 + (50 + r) * 86400;
    for (let k = 0; k < 200; k++) { const qi = Math.floor(RR() * 400); lines.push(`select sh_answer(to_timestamp(${t}), '${v}', 'hb', 'q${qi}', ${RR() < 0.75 ? qi % 4 : (qi + 1) % 4}, null, null, null, 'bank', 'tm${r}${v.slice(-1)}${String(k).padStart(5, '0')}', null, null);`); t += 6 + Math.floor(RR() * 20); }
    (res[X.which][v] = res[X.which][v] || []).push(psqlScript(X, lines.join('\n')) / 200);
  }
  const avg = l => (l.reduce((s, x) => s + x, 0) / l.length).toFixed(2);
  console.log('  an answer, ms (each its own transaction, psql included; three rounds):');
  for (const v of ['bench-H', 'bench-M', 'bench-L'])
    console.log(`    ${v.padEnd(8)} A ${res.A[v].map(x => x.toFixed(2)).join(' / ')} (${avg(res.A[v])})   B ${res.B[v].map(x => x.toFixed(2)).join(' / ')} (${avg(res.B[v])})`);
  if (STATEMENTS) for (const X of [A, B]) {
    console.log(`  ${X.which}: the statements that took the most time (calls, mean ms, write-ahead log bytes):`);
    X.sql(`select calls, round(mean_exec_time::numeric, 3), wal_bytes, left(regexp_replace(query, '\\s+', ' ', 'g'), 100) from pg_stat_statements
           where calls >= 50 and query not like '%pg_stat_statements%' order by total_exec_time desc limit 14`).forEach(r => console.log('    ' + r.join('  ')));
  }
} catch (e) {
  problems.push('the run failed: ' + e.message.split('\n').slice(0, 3).join(' | '));
}
A.db.stop(); B.db.stop();
if (problems.length) { console.error(`\n✗ the pending migrations change what an answer does: ${problems.length} problem(s):\n` + problems.map(p => '  - ' + p).join('\n')); process.exit(1); }
console.log('\n✓ the pending migrations: the same replies, wallets and rows as supabase/schema.sql');
