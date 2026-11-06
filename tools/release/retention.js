#!/usr/bin/env node
// Retention test (migration_v52, vault/reference/analytics-retention.md): builds a throwaway PostgreSQL database from
// supabase/schema.sql, seeds made-up rows of every age, and checks that sh_retention_run():
//   - with p_apply false only counts, and changes nothing;
//   - deletes exactly the approved rows (raw pings > 30 days, click reach > 90 days, feature events > 180 days, test
//     hubs, old link attempts) and removes ids on schedule (reports, check-ins, closed surveys), and nothing else;
//   - keeps every hour of study time: activity_hourly and activity_visits are the same before and after the trim,
//     and get_hub_recap gives the same answer before and after;
//   - "Link my devices" after a trim moves every hour to the kept id instead of rebuilding from what raw pings remain;
//   - collapses old feature events into feature_daily with people counts, and logs the run in retention_runs;
//   - runs twice without removing anything the second time; and that visitors can't call it.
// Nothing here touches the live database.
//   node tools/release/retention.js      (needs PostgreSQL 14+ server binaries: initdb, pg_ctl, psql)
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), { execFileSync, spawnSync } = require('child_process');
const { pending } = require('./pending');
const ROOT = path.resolve(__dirname, '../..');
const SECRET = 'retention-test-secret';
const problems = [], notes = [];

function pgBin(){
  if (process.env.PG_BIN) return process.env.PG_BIN;
  try { return execFileSync('pg_config', ['--bindir']).toString().trim(); } catch (e) {}
  const base = '/usr/lib/postgresql';
  if (fs.existsSync(base)) { const v = fs.readdirSync(base).sort((a, b) => Number(b) - Number(a))[0]; if (v && fs.existsSync(path.join(base, v, 'bin', 'initdb'))) return path.join(base, v, 'bin'); }
  return null;
}
const BIN = pgBin();
if (!BIN || !fs.existsSync(path.join(BIN, 'initdb'))) { console.error('✗ retention test: no PostgreSQL server binaries (set PG_BIN, or install postgresql)'); process.exit(2); }
const asRoot = process.getuid && process.getuid() === 0;
function run(cmd, args){ const full = asRoot ? ['-u', 'postgres', '--', path.join(BIN, cmd), ...args] : args; return execFileSync(asRoot ? 'runuser' : path.join(BIN, cmd), full, { stdio: 'pipe' }).toString(); }
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sh-ret-'));
if (asRoot) execFileSync('chown', ['postgres', dir]);
const PORT = String(57000 + Math.floor(Math.random() * 900));
let started = false;
function stop(){ if (started) { try { run('pg_ctl', ['-D', path.join(dir, 'data'), '-m', 'immediate', 'stop']); } catch (e) {} started = false; } try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {} }
process.on('exit', stop);
function sql(text, db){
  const r = spawnSync(path.join(BIN, 'psql'), ['-X', '-q', '-v', 'ON_ERROR_STOP=1', '-tA', '-F', '\x1f', '-h', dir, '-p', PORT, '-U', 'postgres', '-d', db || 'ret'], { input: text, encoding: 'utf8' });
  if (r.status !== 0) { const e = new Error((r.stderr || '').replace(/^psql:[^:]*:\d+: /gm, '').trim()); e.sql = text; throw e; }
  return r.stdout.split('\n').filter(l => l.length).map(l => l.split('\x1f'));
}
const one = text => (sql(text)[0] || [])[0];
function expect(label, got, want){ if (String(got) !== String(want)) problems.push(`${label}: got ${got}, expected ${want}`); }

try {
  run('initdb', ['-D', path.join(dir, 'data'), '-U', 'postgres', '-A', 'trust', '--no-sync']);
  run('pg_ctl', ['-D', path.join(dir, 'data'), '-o', `-k ${dir} -p ${PORT} -c listen_addresses='' -c fsync=off -c TimeZone=UTC`, '-l', path.join(dir, 'log'), '-w', 'start']);
  started = true;
  sql('create database ret', 'postgres');
  sql(`create role anon nologin noinherit; create role authenticated nologin noinherit; create role service_role nologin noinherit bypassrls;
       grant usage on schema public to anon, authenticated, service_role;
       alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
       alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
       alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;`);
  const schema = fs.readFileSync(path.join(ROOT, 'supabase', 'schema.sql'), 'utf8').split('<ADMIN_SECRET>').join(SECRET);
  try { sql('begin;\n' + schema + '\ncommit;'); }
  catch (e) { problems.push(`supabase/schema.sql doesn't load: ${e.message.split('\n')[0]}`); throw new Error('stop'); }
  /* the migrations waiting for their release (supabase/pending-migrations.txt), so the job is tested with them in place */
  for (const m of pending(SECRET)) {
    try { sql('begin;\n' + m.text + '\ncommit;'); }
    catch (e) { problems.push(`${m.file} (pending) doesn't load: ${e.message.split('\n')[0]}`); throw new Error('stop'); }
  }
  for (const f of ['sh_retention_run', 'sh_retention_status', 'feature_daily', 'retention_runs'])
    if (one(`select coalesce(to_regproc('public.${f}')::text, to_regclass('public.${f}')::text, '')`) === '') problems.push(`${f} is missing from supabase/schema.sql`);
  if (problems.length) throw new Error('stop');

  /* made-up rows: visitors A and B on hub 'ret-hub', plus a test hub; every age around each cutoff */
  sql(`
    insert into activity_pings (visitor_id, visit_id, hub, section, pinged_at)
      select 'ret-A', 'visit-A-old', 'ret-hub', 'compendium/notes', now() - interval '40 days' + g * interval '25 seconds' from generate_series(1, 300) g;
    insert into activity_pings (visitor_id, visit_id, hub, section, pinged_at)
      select 'ret-A', 'visit-A-new', 'ret-hub', 'compendium/bank', now() - interval '5 days' + g * interval '25 seconds' from generate_series(1, 120) g;
    insert into activity_pings (visitor_id, visit_id, hub, section, pinged_at)
      select 'ret-B', 'visit-B-old', 'ret-hub', 'arcade/showdown', now() - interval '35 days' + g * interval '25 seconds' from generate_series(1, 80) g;
    insert into activity_pings (visitor_id, visit_id, hub, section, pinged_at)
      select 'ret-B', 'visit-B-new', 'ret-hub', 'compendium/notes', now() - interval '2 days' + g * interval '25 seconds' from generate_series(1, 60) g;
    insert into activity_pings (visitor_id, visit_id, hub, section, pinged_at)
      select 'ret-A', 'visit-A-test', 'zz-test', 'x', now() - interval '1 day' + g * interval '25 seconds' from generate_series(1, 10) g;
    insert into personal_answers (visitor_id, hub, qid, correct, answered_at)
      select 'ret-A', 'ret-hub', 'q' || g, g % 2 = 0, now() - interval '40 days' + g * interval '1 minute' from generate_series(1, 20) g;
    insert into ui_click_reach (day, hub, target, visitor_id) values
      (current_date - 100, 'ret-hub', 'tab=old', 'ret-A'), (current_date - 10, 'ret-hub', 'tab=new', 'ret-A'), (current_date - 1, 'zz-test', 'x', 'ret-A');
    insert into feature_events (day, hub, kind, visitor_id, n) values
      (current_date - 200, 'ret-hub', 'tts:play', 'ret-A', 3), (current_date - 200, 'ret-hub', 'tts:play', 'ret-B', 2),
      (current_date - 10, 'ret-hub', 'tts:play', 'ret-A', 1), (current_date - 1, 'zz-test', 'x', 'ret-A', 1);
    insert into question_flags (hub, note, created_at, resolved, visitor_id, reply, resolved_at) values
      ('ret-hub', 'old report', now() - interval '200 days', true, 'ret-A', 'fixed', now() - interval '130 days'),
      ('ret-hub', 'recent report', now() - interval '20 days', true, 'ret-A', 'fixed', now() - interval '10 days'),
      ('ret-hub', 'open report', now() - interval '200 days', false, 'ret-B', null, null);
    insert into hub_suggestions (hub, note, resolved, created_at, visitor_id, resolved_at) values
      ('ret-hub', 'old idea', true, now() - interval '200 days', 'ret-A', now() - interval '125 days');
    insert into exam_debriefs (hub, exam, visitor_id, answers, created_at) values
      ('ret-hub', '2025-10-01', 'ret-A', '{}', now() - interval '400 days'), ('ret-hub', '2026-10-01', 'ret-B', '{}', now() - interval '30 days');
    insert into surveys (id, slug, title, questions, active, starts_at, ends_at) overriding system value values
      (9101, 'ret-closed', 'closed', '[]', false, now() - interval '200 days', now() - interval '100 days'),
      (9102, 'ret-live', 'live', '[]', true, now() - interval '5 days', null);
    insert into survey_responses (survey_id, visitor_id, answers, created_at) values
      (9101, 'ret-A', '{"q1":3}', now() - interval '150 days'), (9101, 'ret-B', null, now() - interval '150 days'),
      (9102, 'ret-A', null, now() - interval '2 days'), (9102, 'ret-B', '{"q1":4}', now() - interval '2 days');
    insert into link_attempts (visitor_id, tried_at) values ('ret-A', now() - interval '10 days'), ('ret-A', now() - interval '1 hour');
  `);
  const hours = () => one(`select coalesce(sum(n), 0) || '/' || count(*) from activity_hourly where hub = 'ret-hub'`);
  const visits = () => one(`select string_agg(visit_id || ':' || visitor_id || ':' || first_at || ':' || last_at, ',' order by visit_id, visitor_id) from activity_visits where visitor_id like 'ret-%'`);
  const recap = () => one(`select (get_hub_recap('${SECRET}', 'ret-hub', null) - 'answers' - 'correct' - 'questions_seen')::text`);
  expect('seeded hours (pings/rows)', hours().split('/')[0], 560);
  const h0 = hours(), v0 = visits(), r0 = recap();

  /* dry run: counts only */
  const dry = JSON.parse(one(`select sh_retention_run()::text`));
  const testHours = Number(one(`select count(*) from activity_hourly where hub = 'zz-test'`));   /* 1 or 2: the 10 pings may cross an hour */
  const want = { activity_pings: 390, ui_click_reach: 2, feature_events: 3, activity_hourly_test: testHours, ui_clicks_test: 0, question_flags_ids: 1,
    hub_suggestions_ids: 1, exam_debriefs_ids: 1, survey_declines: 1, survey_answer_ids: 1, link_attempts: 1 };
  for (const k of Object.keys(want)) expect(`dry run counts ${k}`, dry.counts[k], want[k]);
  expect('dry run left the raw pings', one(`select count(*) from activity_pings`), 570);
  expect('dry run logged nothing', one(`select count(*) from retention_runs`), 0);

  /* the real run */
  const done = JSON.parse(one(`select sh_retention_run(true)::text`));
  for (const k of Object.keys(want)) expect(`run removed ${k}`, done.counts[k], want[k]);
  expect('raw pings kept (last 30 days, real hubs)', one(`select count(*) from activity_pings`), 180);
  expect('study hours unchanged after the trim', hours(), h0);
  expect('visits unchanged after the trim', visits(), v0);
  expect('test-hub hours gone', one(`select count(*) from activity_hourly where hub = 'zz-test'`), 0);
  expect('recap unchanged after the trim', recap() === r0, true);
  expect('click reach kept', one(`select string_agg(target, ',' order by target) from ui_click_reach`), 'tab=new');
  expect('feature events kept', one(`select count(*) from feature_events`), 1);
  expect('feature_daily row', one(`select people || '/' || n from feature_daily where hub = 'ret-hub' and kind = 'tts:play'`), '2/5');
  expect('old resolved report id removed', one(`select count(*) from question_flags where note = 'old report' and visitor_id is null`), 1);
  expect('recent report id kept', one(`select visitor_id from question_flags where note = 'recent report'`), 'ret-A');
  expect('open report id kept', one(`select visitor_id from question_flags where note = 'open report'`), 'ret-B');
  expect('old suggestion id removed', one(`select count(*) from hub_suggestions where visitor_id is null`), 1);
  expect('year-old check-in id replaced', one(`select count(*) from exam_debriefs where visitor_id like 'anon-%'`), 1);
  expect('recent check-in id kept', one(`select visitor_id from exam_debriefs where exam = '2026-10-01'`), 'ret-B');
  expect('closed survey: decline gone, answers kept without id', one(`select string_agg(coalesce(answers::text, 'null') || ':' || (visitor_id like 'anon-%'), ',') from survey_responses where survey_id = 9101`), '{"q1": 3}:true');
  expect('live survey untouched', one(`select count(*) from survey_responses where survey_id = 9102 and visitor_id like 'ret-%'`), 2);
  expect('answers untouched', one(`select count(*) from personal_answers where visitor_id = 'ret-A'`), 20);
  expect('link attempts kept', one(`select count(*) from link_attempts`), 1);
  expect('run logged', one(`select count(*) from retention_runs`), 1);
  notes.push(`removed ${done.counts.activity_pings} raw pings with every hour kept (${h0.split('/')[0]} pings in activity_hourly before and after); recap identical`);

  /* a second run removes nothing */
  const again = JSON.parse(one(`select sh_retention_run(true)::text`));
  const left = Object.keys(want).filter(k => Number(again.counts[k]) !== 0);
  if (left.length) problems.push('a second run removed more: ' + left.map(k => `${k} ${again.counts[k]}`).join(', '));

  /* Link my devices after the trim: B's hours move to A, none are lost */
  const before = one(`select sum(n) from activity_hourly where visitor_id in ('ret-A', 'ret-B') and hub = 'ret-hub'`);
  const code = one(`select create_link_code('ret-A')`);
  expect('link redeemed', one(`select redeem_link_code('${code}', 'ret-B')`), 'ret-A');
  expect('hours after linking (all on A)', one(`select coalesce(sum(n), 0) from activity_hourly where visitor_id = 'ret-A' and hub = 'ret-hub'`), before);
  expect('no hours left on B', one(`select count(*) from activity_hourly where visitor_id = 'ret-B'`), 0);
  expect('B\'s old visit moved to A', one(`select count(*) from activity_visits where visit_id = 'visit-B-old' and visitor_id = 'ret-A'`), 1);
  expect('B\'s raw pings moved to A', one(`select count(*) from activity_pings where visitor_id = 'ret-B'`), 0);
  notes.push('linking devices after a trim kept every hour (moved, not rebuilt)');

  /* a delete that isn't a retention run still rebuilds the rollups from raw pings (the old behavior) */
  sql(`delete from activity_pings where visit_id = 'visit-A-new'`);
  expect('an ordinary delete still rebuilds', one(`select coalesce(sum(n), 0) from activity_hourly where visitor_id = 'ret-A' and section = 'compendium/bank'`), 0);

  /* visitors can't run or read it */
  for (const f of ['sh_retention_run(boolean)', 'sh_retention_status()'])
    expect(`anon can't execute ${f}`, one(`select has_function_privilege('anon', 'public.${f}', 'execute')`), 'f');
  for (const t of ['feature_daily', 'retention_runs'])
    expect(`${t} has row-level security`, one(`select relrowsecurity from pg_class where oid = 'public.${t}'::regclass`), 't');
  const st = JSON.parse(one(`select sh_retention_status()::text`));
  expect('status lists the runs', st.runs.length, 2);
  notes.push('pg_cron ' + (st.schedule ? 'scheduled: ' + st.schedule : 'not in this database (the migration skips the weekly job)'));
} catch (e) {
  if (e.message !== 'stop') problems.push(`test run failed: ${e.message.split('\n')[0]}`);
}
stop();
notes.forEach(n => console.log('  ' + n));
if (problems.length) { console.error(`\n✗ retention: ${problems.length} problem(s):\n` + problems.map(p => '  - ' + p).join('\n')); process.exit(1); }
console.log('\n✓ retention schedule (deletes, kept hours, device linking, recap) passed');
