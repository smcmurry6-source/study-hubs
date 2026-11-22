#!/usr/bin/env node
// Retention test (migration_v52, vault/reference/analytics-retention.md): builds a throwaway PostgreSQL database from
// supabase/schema.sql, seeds made-up rows of every age, and checks that sh_retention_run():
//   - with p_apply false only counts, and changes nothing;
//   - deletes exactly the approved rows (raw pings > 3 days since migration_v74, 30 before, click reach > 30 days and feature events > 60 days
//     since migration_v95 (90 and 180 before), with their daily roll-ups, a down hub's question health (hubs_down, v95), test
//     hubs, old link attempts, an idea hidden for 90 days with its votes, reports and notes: migration_v58) and removes ids on schedule (reports, check-ins, closed surveys), and nothing else;
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
      select 'ret-A', 'visit-A-new', 'ret-hub', 'compendium/bank', now() - interval '60 hours' + g * interval '25 seconds' from generate_series(1, 120) g;
    insert into activity_pings (visitor_id, visit_id, hub, section, pinged_at)
      select 'ret-B', 'visit-B-mid', 'ret-hub', 'compendium/bank', now() - interval '10 days' + g * interval '25 seconds' from generate_series(1, 40) g;
    insert into activity_pings (visitor_id, visit_id, hub, section, pinged_at)
      select 'ret-B', 'visit-B-old', 'ret-hub', 'arcade/showdown', now() - interval '35 days' + g * interval '25 seconds' from generate_series(1, 80) g;
    insert into activity_pings (visitor_id, visit_id, hub, section, pinged_at)
      select 'ret-B', 'visit-B-new', 'ret-hub', 'compendium/notes', now() - interval '2 days' + g * interval '25 seconds' from generate_series(1, 60) g;
    insert into activity_pings (visitor_id, visit_id, hub, section, pinged_at)
      select 'ret-A', 'visit-A-test', 'zz-test', 'x', now() - interval '1 day' + g * interval '25 seconds' from generate_series(1, 10) g;
    insert into personal_answers (visitor_id, hub, qid, correct, answered_at)
      select 'ret-A', 'ret-hub', 'q' || g, g % 2 = 0, now() - interval '40 days' + g * interval '1 minute' from generate_series(1, 20) g;
    insert into ui_click_reach (day, hub, target, visitor_id) values
      (current_date - 100, 'ret-hub', 'tab=old', 'ret-A'), (current_date - 10, 'ret-hub', 'tab=new', 'ret-A'), (current_date - 1, 'zz-test', 'x', 'ret-A'),
      (current_date - 40, 'ret-hub', 'tab=mid', 'ret-A'), (current_date - 40, 'ret-hub', 'tab=mid', 'ret-B'), (current_date - 29, 'ret-hub', 'tab=edge', 'ret-B');
    insert into feature_events (day, hub, kind, visitor_id, n) values
      (current_date - 200, 'ret-hub', 'tts:play', 'ret-A', 3), (current_date - 200, 'ret-hub', 'tts:play', 'ret-B', 2),
      (current_date - 10, 'ret-hub', 'tts:play', 'ret-A', 1), (current_date - 1, 'zz-test', 'x', 'ret-A', 1),
      (current_date - 70, 'ret-hub', 'tour:start', 'ret-A', 1), (current_date - 59, 'ret-hub', 'tour:start', 'ret-B', 1);
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
  /* the idea board (migration_v54; hidden ideas kept 90 days: migration_v58): one hidden 100 days ago with a vote, a
     report and an Inbox note, one hidden today, one never hidden and older than both */
  sql(`
    insert into ideas (visitor_id, name, title, category, source, hidden, hidden_by, created_at) values
      ('ret-A', 'Made Up Molar', 'ret old hidden', 'other', 'board', true, 'reports', now() - interval '120 days'),
      ('ret-A', 'Made Up Molar', 'ret new hidden', 'other', 'board', true, 'admin', now() - interval '120 days'),
      ('ret-B', 'Made Up Incisor', 'ret shown', 'other', 'board', false, null, now() - interval '200 days');
    update ideas set hidden_at = now() - interval '100 days' where title = 'ret old hidden';
    insert into idea_votes (idea_id, visitor_id, val) select id, 'ret-B', 1 from ideas where title like 'ret %';
    insert into idea_reports (idea_id, visitor_id) select id, 'ret-B' from ideas where title = 'ret old hidden';
    insert into idea_notes (idea_id, visitor_id, status, note) select id, 'ret-A', 'considering', 'made up' from ideas where title = 'ret old hidden';
  `);
  expect('a hidden idea records when it was hidden', one(`select count(*) from ideas where title = 'ret new hidden' and hidden_at > now() - interval '1 minute'`), 1);
  expect('an idea that was never hidden has no hidden_at', one(`select count(*) from ideas where title = 'ret shown' and hidden_at is null`), 1);
  const hours = () => one(`select coalesce(sum(n), 0) || '/' || count(*) from activity_hourly where hub = 'ret-hub'`);
  const visits = () => one(`select string_agg(visit_id || ':' || visitor_id || ':' || first_at || ':' || last_at, ',' order by visit_id, visitor_id) from activity_visits where visitor_id like 'ret-%'`);
  const recap = () => one(`select (get_hub_recap('${SECRET}', 'ret-hub', null) - 'answers' - 'correct' - 'questions_seen')::text`);
  expect('seeded hours (pings/rows)', hours().split('/')[0], 600);
  const h0 = hours(), v0 = visits(), r0 = recap();

  /* v93: rows older than the school year (365 Central days) on their own hub and visitors, so the checks above don't move:
     yr-C used two sections in one hour past the 144-ping cap, another old hour and a recent one; yr-D one old hour */
  sql(`
    insert into activity_hourly (h, hub, section, visitor_id, n) values
      (date_trunc('hour', now() - interval '400 days'), 'ret-old', 'compendium/notes', 'yr-C', 100),
      (date_trunc('hour', now() - interval '400 days'), 'ret-old', 'compendium/bank', 'yr-C', 80),
      (date_trunc('hour', now() - interval '400 days') + interval '1 hour', 'ret-old', 'compendium/bank', 'yr-C', 30),
      (date_trunc('hour', now() - interval '10 days'), 'ret-old', 'compendium/bank', 'yr-C', 50),
      (date_trunc('hour', now() - interval '400 days'), 'ret-old', 'compendium/notes', 'yr-D', 20);
    insert into activity_visits (visit_id, visitor_id, first_at, last_at) values
      ('yr-v1', 'yr-C', now() - interval '400 days', now() - interval '400 days' + interval '2 hours'),
      ('yr-v2', 'yr-D', now() - interval '400 days', now() - interval '400 days' + interval '20 minutes'),
      ('yr-v3', 'yr-C', now() - interval '10 days', now() - interval '10 days' + interval '50 minutes');
    insert into question_events (at, hub, qid, v, visitor_id, visit_id, kind, try, correct, choice, ms, expl_ms) values
      (date_trunc('day', now() - interval '400 days') + interval '18 hours', 'ret-old', 'q1', 'v1', 'yr-C', 'yr-v1', 'answer', 1, true, 2, 4000, 1000),
      (date_trunc('day', now() - interval '400 days') + interval '18 hours', 'ret-old', 'q1', 'v1', 'yr-C', 'yr-v1', 'answer', 2, true, 2, 2000, 3000),
      (date_trunc('day', now() - interval '400 days') + interval '18 hours', 'ret-old', 'q1', 'v1', 'yr-D', 'yr-v2', 'answer', 1, false, 0, 6000, 5000),
      (date_trunc('day', now() - interval '400 days') + interval '18 hours', 'ret-old', 'q1', 'v1', 'yr-D', 'yr-v2', 'view', null, null, null, 3500, null),
      (now() - interval '10 days', 'ret-old', 'q1', 'v1', 'yr-C', 'yr-v3', 'answer', 3, true, 2, 1500, 500);
  `);
  /* v95: a hub whose page came down (in hubs_down) and a live one, both with recent question health and answers; dn-E
     answered on both, so its XP and crowns are read before and after */
  sql(`
    insert into hubs_down (hub, day) values ('ret-down', current_date - 2);
    insert into question_events (at, hub, qid, v, visitor_id, visit_id, kind, try, correct, choice, ms, expl_ms) values
      (now() - interval '5 days', 'ret-down', 'd1', '', 'dn-E', 'dn-v1', 'answer', 1, false, 1, 3000, 2000),
      (now() - interval '5 days', 'ret-down', 'd1', '', 'dn-E', 'dn-v1', 'answer', 2, true, 0, 1000, 1000),
      (now() - interval '5 days', 'ret-down', 'd1', '', 'dn-F', 'dn-v2', 'answer', 1, true, 0, 5000, 4000),
      (now() - interval '5 days', 'ret-down', 'd2', '', 'dn-F', 'dn-v2', 'view', null, null, null, 4000, null),
      (now() - interval '1 day', 'ret-down', 'd1', '', 'dn-F', 'dn-v3', 'answer', 2, true, 0, 2000, 500),
      (now() - interval '5 days', 'ret-live', 'l1', '', 'dn-E', 'dn-v1', 'answer', 1, true, 2, 3000, 2000),
      (now() - interval '1 day', 'ret-live', 'l1', '', 'dn-F', 'dn-v3', 'answer', 1, false, 1, 3000, 2000);
    insert into personal_answers (visitor_id, hub, qid, correct, answered_at) values
      ('dn-E', 'ret-down', 'd1', true, now() - interval '5 days'), ('dn-E', 'ret-live', 'l1', true, now() - interval '5 days');
  `);
  const wallets = () => one(`select string_agg(v || ':' || sh_wallet(v)::text, ' | ' order by v) from unnest(array['ret-A', 'ret-B', 'yr-C', 'yr-D', 'dn-E', 'dn-F']) v`);
  const wallets0 = wallets();
  const crowns = () => one(`select sh_time_crowns('yr-C') || '/' || sh_time_crowns('yr-D')`);
  const crowns0 = crowns();
  expect('time crowns before the collapse (yr-C 144+30+50 capped pings, yr-D 20; rounded)', crowns0, '156/14');

  /* dry run: counts only */
  const dry = JSON.parse(one(`select sh_retention_run()::text`));
  const testHours = Number(one(`select count(*) from activity_hourly where hub = 'zz-test'`));   /* 1 or 2: the 10 pings may cross an hour */
  const want = { activity_pings: 430, ui_click_reach: 4, feature_events: 4, activity_hourly_test: testHours, ui_clicks_test: 0, question_flags_ids: 1,
    hub_suggestions_ids: 1, exam_debriefs_ids: 1, survey_declines: 1, survey_answer_ids: 1, ideas_hidden: 1, link_attempts: 1,
    activity_hourly_year: 4, activity_visits_year: 2, question_events_year: 4, question_events_down: 5 };
  for (const k of Object.keys(want)) expect(`dry run counts ${k}`, dry.counts[k], want[k]);
  expect('dry run left the raw pings', one(`select count(*) from activity_pings`), 610);
  expect('dry run logged nothing', one(`select count(*) from retention_runs`), 0);
  expect('dry run left the ideas', one(`select count(*) from ideas where title like 'ret %'`), 3);

  /* the real run */
  const done = JSON.parse(one(`select sh_retention_run(true)::text`));
  for (const k of Object.keys(want)) expect(`run removed ${k}`, done.counts[k], want[k]);
  expect('raw pings kept (last 3 days, real hubs)', one(`select count(*) from activity_pings`), 180);
  expect('study hours unchanged after the trim', hours(), h0);
  expect('visits unchanged after the trim', visits(), v0);
  expect('test-hub hours gone', one(`select count(*) from activity_hourly where hub = 'zz-test'`), 0);
  expect('recap unchanged after the trim', recap() === r0, true);
  expect('click reach kept (the last 30 days)', one(`select string_agg(target, ',' order by target) from ui_click_reach`), 'tab=edge,tab=new');
  expect('click reach rolled up by day, page and target (people, no ids; the test hub left out)', one(`select string_agg(target || ':' || people, ',' order by target) from ui_click_reach_daily`), 'tab=mid:2,tab=old:1');
  expect('feature events kept (the last 60 days)', one(`select string_agg(kind || ':' || visitor_id, ',' order by kind, visitor_id) from feature_events`), 'tour:start:ret-B,tts:play:ret-A');
  expect('feature_daily row', one(`select people || '/' || n from feature_daily where hub = 'ret-hub' and kind = 'tts:play'`), '2/5');
  expect('feature_daily row at 70 days', one(`select people || '/' || n from feature_daily where hub = 'ret-hub' and kind = 'tour:start'`), '1/1');
  for (const t of ['hubs_down', 'ui_click_reach_daily']) {
    expect(`${t} has row-level security`, one(`select relrowsecurity from pg_class where oid = 'public.${t}'::regclass`), 't');
    expect(`anon can't read ${t}`, one(`select has_table_privilege('anon', 'public.${t}', 'select')`), 'f');
  }
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
  expect('the idea hidden 100 days ago is gone; the one hidden today and the one showing stay', one(`select string_agg(title, ',' order by title) from ideas where title like 'ret %'`), 'ret new hidden,ret shown');
  expect('its votes, reports and Inbox notes went with it', one(`select (select count(*) from idea_votes v join ideas i on i.id = v.idea_id where i.title like 'ret %') || '/' || (select count(*) from idea_votes) || '/' || (select count(*) from idea_reports) || '/' || (select count(*) from idea_notes)`), '2/2/0/0');
  sql(`update ideas set hidden = false, hidden_by = null where title = 'ret new hidden'`);
  expect('restoring an idea clears when it was hidden', one(`select count(*) from ideas where title = 'ret new hidden' and hidden_at is null`), 1);
  sql(`update ideas set hidden = true, hidden_by = 'admin' where title = 'ret new hidden'`);
  expect('hiding it again starts the 90 days over', one(`select count(*) from ideas where title = 'ret new hidden' and hidden_at > now() - interval '1 minute'`), 1);
  expect('run logged', one(`select count(*) from retention_runs`), 1);
  notes.push(`removed ${done.counts.activity_pings} raw pings with every hour kept (${h0.split('/')[0]} pings in activity_hourly before and after); recap identical`);

  /* v93: the school year's collapse */
  expect('time crowns unchanged by the collapse', crowns(), crowns0);
  expect('kept capped pings', one(`select string_agg(visitor_id || ':' || n, ',' order by visitor_id) from activity_time_kept`), 'yr-C:174,yr-D:20');
  expect('old hours gone, the recent one kept', one(`select count(*) || '/' || sum(n) from activity_hourly where hub = 'ret-old'`), '1/50');
  expect('activity_daily keeps the pings, no ids', one(`select sum(n) from activity_daily where hub = 'ret-old'`), 230);
  expect('activity_daily people (notes: C and D)', one(`select sum(people) from activity_daily where hub = 'ret-old' and section = 'compendium/notes'`), 2);
  expect('old visits gone, the recent one kept', one(`select string_agg(visit_id, ',') from activity_visits where visitor_id like 'yr-%'`), 'yr-v3');
  expect('activity_visits_daily', one(`select sum(visits) || '/' || sum(people) from activity_visits_daily`), '2/2');
  expect('old question events gone, the recent one kept', one(`select count(*) from question_events where hub = 'ret-old'`), 1);
  expect('question_events_daily totals', one(`select people || '/' || answers || '/' || correct || '/' || firsts || '/' || firsts_correct || '/' || retries || '/' || retries_correct || '/' || views || '/' || med_ms || '/' || med_expl_ms || '/' || choices::text from question_events_daily where hub = 'ret-old' and qid = 'q1' and v = 'v1'`), '2/3/2/2/1/1/1/1/4000/3000/{"0": 1, "2": 2}');
  for (const t of ['activity_daily', 'activity_visits_daily', 'question_events_daily', 'activity_time_kept']) {
    expect(`${t} has row-level security`, one(`select relrowsecurity from pg_class where oid = 'public.${t}'::regclass`), 't');
    expect(`anon can't read ${t}`, one(`select has_table_privilege('anon', 'public.${t}', 'select')`), 'f');
  }
  /* v95: the down hub's question health rolled up; the live hub's stays; nobody's XP or crowns move */
  expect('the down hub\'s question events gone', one(`select count(*) from question_events where hub = 'ret-down'`), 0);
  expect('the live hub\'s question events kept', one(`select count(*) from question_events where hub = 'ret-live'`), 2);
  expect('the down hub\'s daily totals (d1, 5 days ago)', one(`select people || '/' || answers || '/' || correct || '/' || firsts || '/' || firsts_correct || '/' || retries || '/' || retries_correct || '/' || views || '/' || med_ms || '/' || choices::text from question_events_daily where hub = 'ret-down' and qid = 'd1' and day = ((now() - interval '5 days') at time zone 'America/Chicago')::date`), '2/3/2/2/1/1/1/0/3000/{"0": 2, "1": 1}');
  expect('the down hub\'s unanswered read', one(`select views || '/' || answers || '/' || choices::text from question_events_daily where hub = 'ret-down' and qid = 'd2'`), '1/0/{}');
  expect('the down hub in all (answers, rows)', one(`select sum(answers) || '/' || count(*) from question_events_daily where hub = 'ret-down'`), '4/3');
  expect('no totals for the live hub', one(`select count(*) from question_events_daily where hub = 'ret-live'`), 0);
  expect('answers untouched on both hubs', one(`select count(*) from personal_answers where visitor_id = 'dn-E'`), 2);
  expect('XP, crowns and time crowns unchanged by the run', wallets() === wallets0, true);
  let refused = '';
  try { sql(`select sh_retention_hub_down('ret-live')`); } catch (e) { refused = e.message; }
  expect('a hub not in hubs_down is refused', /is not in hubs_down/.test(refused), true);
  expect('anon can\'t execute sh_retention_hub_down', one(`select has_function_privilege('anon', 'public.sh_retention_hub_down(text)', 'execute')`), 'f');
  /* a row a down hub's page sends later (a kept answer) is rolled up the next night, into the same day's totals */
  sql(`insert into question_events (at, hub, qid, v, visitor_id, visit_id, kind, try, correct, choice, ms, expl_ms) values
         (now() - interval '1 day', 'ret-down', 'd1', '', 'dn-E', 'dn-v4', 'answer', 3, true, 0, 1000, 800)`);
  expect('a late row is counted the next night', JSON.parse(one(`select sh_retention_run()::text`)).counts.question_events_down, 1);
  expect('the late row rolls up with its day', one(`select sh_retention_hub_down('ret-down')`), 1);
  expect('the late row joins its day (answers, people summed)', one(`select answers || '/' || people || '/' || choices::text from question_events_daily where hub = 'ret-down' and qid = 'd1' and day = ((now() - interval '1 day') at time zone 'America/Chicago')::date`), '2/2/{"0": 2}');
  notes.push(`a down hub's ${done.counts.question_events_down} question events into daily totals, the live hub's kept; ${done.counts.ui_click_reach} click-reach rows past 30 days rolled up; XP and crowns the same before and after`);
  notes.push(`the school year's collapse: ${done.counts.activity_hourly_year} hours, ${done.counts.activity_visits_year} visits, ${done.counts.question_events_year} question events into totals; time crowns ${crowns0} before and after`);

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

  /* v93: linking moves the kept crowns too */
  const code2 = one(`select create_link_code('yr-C')`);
  expect('old devices linked', one(`select redeem_link_code('${code2}', 'yr-D')`), 'yr-C');
  expect('kept pings moved with the link', one(`select string_agg(visitor_id || ':' || n, ',') from activity_time_kept`), 'yr-C:194');
  expect('time crowns after linking (194 kept + 50)', one(`select sh_time_crowns('yr-C')`), 169);

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
  notes.push('pg_cron ' + (st.schedule ? 'scheduled: ' + st.schedule : 'not in this database (the migration skips the nightly job)'));
} catch (e) {
  if (e.message !== 'stop') problems.push(`test run failed: ${e.message.split('\n')[0]}`);
}
stop();
notes.forEach(n => console.log('  ' + n));
if (problems.length) { console.error(`\n✗ retention: ${problems.length} problem(s):\n` + problems.map(p => '  - ' + p).join('\n')); process.exit(1); }
console.log('\n✓ retention schedule (deletes, kept hours, device linking, recap) passed');
