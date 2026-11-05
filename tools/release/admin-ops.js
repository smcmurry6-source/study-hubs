#!/usr/bin/env node
// Admin operations (migration_v50) on a throwaway PostgreSQL built from supabase/schema.sql, with made-up visitors
// only. Every call is made as the anonymous role, as the admin page's browser makes it. Checks that:
//   - live presence needs the admin secret; counts people with a ping in the last 3 minutes (1-15), one per person
//     across linked devices; shows leaderboard names only (a chosen name, else the random class name); and never
//     returns a visitor id, a section or a per-person time;
//   - archive overrides: anon can't touch the tables; get_hub_overrides shows only overrides in force, without notes;
//     a change needs the secret, checks the version the page saw, ignores a repeat, refuses a bad state, hub, end time
//     or note, writes one log row per change, ends at its end time, and can be reversed back to automatic;
//   - check-ins and surveys come back newest first by created_at, with id breaking ties.
// Nothing here touches the live database.   node tools/release/admin-ops.js   (PostgreSQL 14+ server binaries)
'use strict';
const { throwaway } = require('./pg');
const SECRET = 'admin-ops-test-secret';
const problems = [], notes = [];
let checks = 0;
function ok(cond, what){ checks++; if (!cond) problems.push(what); }

const db = throwaway(SECRET), { sql, q } = db;
/* as the anonymous role (every visitor's browser, and the admin page's) */
function anon(text){ return sql(`begin; set local role anon; ${text}; commit;`); }
function anonJson(text){ const r = anon(`select (${text})::text`); try { return JSON.parse(r[0][0]); } catch (e) { throw new Error(`no JSON from ${text.slice(0, 120)}: ${JSON.stringify(r).slice(0, 200)}`); } }
function raises(fn, code, what){
  try { fn(); ok(false, `${what}: expected an error${code ? ' ' + code : ''}, got none`); }
  catch (e) { ok(!code || e.code === code, `${what}: expected ${code}, got ${e.code || e.message.split('\n')[0]}`); }
}
const S = q(SECRET);

try {
  /* ---------- made-up visitors and pings ---------- */
  sql(`insert into visitor_names (visitor_id, display_name) values ('fx-A', 'Made Up Molar'), ('fx-E', 'Tag <b>Test</b>');
       insert into visitor_links (alias_id, primary_id) values ('fx-A2', 'fx-A');
       insert into activity_pings (visitor_id, visit_id, hub, section, pinged_at) values
         ('fx-A',  'va1', 'occlusion', 'bank', now() - interval '30 seconds'),
         ('fx-A',  'va1', 'occlusion', 'notes/l6', now() - interval '100 seconds'),
         ('fx-A2', 'va2', 'perio', 'home', now() - interval '50 seconds'),
         ('fx-B',  'vb1', 'occlusion', 'mock', now() - interval '2 minutes'),
         ('fx-C',  'vc1', 'occlusion', 'home', now() - interval '10 minutes'),
         ('fx-D',  'vd1', '', 'home', now() - interval '5 seconds'),
         ('fx-E',  've1', 'pcd-implants-exam1', 'home', now() - interval '10 seconds');`);
  const ids = ['fx-A', 'fx-A2', 'fx-B', 'fx-C', 'fx-D', 'fx-E', 'va1', 'va2', 'vb1', 'vc1', 'vd1', 've1'];
  const anonB = sql(`select anon_name('fx-B')`)[0][0];

  /* ---------- 1. live presence ---------- */
  raises(() => anon(`select admin_live_presence(null)`), '28000', 'live presence with no secret');
  raises(() => anon(`select admin_live_presence('wrong')`), '28000', 'live presence with a wrong secret');
  const raw = anon(`select admin_live_presence(${S})::text`)[0][0], L = JSON.parse(raw);
  ok(L.minutes === 3, `live presence: default window is 3 minutes (got ${L.minutes})`);
  ok(L.total === 3, `live presence: 3 people now (A on two devices, B, E), got ${L.total}`);
  const by = {}; (L.hubs || []).forEach(h => { by[h.hub] = h; });
  ok(by.occlusion && by.occlusion.people === 2, 'live presence: occlusion has A and B (C is 10 minutes old)');
  ok(by.perio && by.perio.people === 1 && by.perio.names[0] === 'Made Up Molar', 'live presence: a linked device shows its person\'s chosen name');
  ok(by['pcd-implants-exam1'] && by['pcd-implants-exam1'].names[0] === 'Tag <b>Test</b>', 'live presence: names come back as typed (the page escapes them)');
  ok(!by[''], 'live presence: a ping with no hub is left out');
  ok(by.occlusion && JSON.stringify(by.occlusion.names) === JSON.stringify(['Made Up Molar', anonB].sort((a, b) => a.toLowerCase() < b.toLowerCase() ? -1 : 1)), `live presence: names A to Z, the random class name for someone without one (${by.occlusion && by.occlusion.names})`);
  ok(L.hubs[0].hub === 'occlusion', 'live presence: busiest hub first');
  ids.forEach(id => ok(raw.indexOf(id) < 0, `live presence: the response contains the id ${id}`));
  ['bank', 'notes/l6', 'mock'].forEach(sec => ok(raw.indexOf(sec) < 0, `live presence: the response contains the section ${sec}`));
  ok(JSON.stringify(Object.keys(L).sort()) === JSON.stringify(['as_of', 'hubs', 'minutes', 'total']), `live presence: top-level keys are minutes, as_of, total, hubs (${Object.keys(L)})`);
  ok(L.hubs.every(h => JSON.stringify(Object.keys(h).sort()) === JSON.stringify(['hub', 'names', 'people'])), 'live presence: each hub has only hub, people, names');
  const L1 = anonJson(`admin_live_presence(${S}, 0)`), L15 = anonJson(`admin_live_presence(${S}, 99)`);
  ok(L1.minutes === 1 && L1.total === 2, `live presence: 0 minutes clamps to 1 (A and E), got ${L1.minutes} min / ${L1.total}`);
  ok(L15.minutes === 15 && L15.total === 4, `live presence: 99 minutes clamps to 15 and includes C, got ${L15.minutes} min / ${L15.total}`);
  notes.push('live presence: secret, 3-minute window, linked devices, names, no ids or sections');

  /* ---------- 2. archive overrides ---------- */
  raises(() => anon(`select count(*) from hub_archive_overrides`), '42501', 'anon reads hub_archive_overrides directly');
  raises(() => anon(`select count(*) from hub_archive_log`), '42501', 'anon reads hub_archive_log directly');
  raises(() => anon(`insert into hub_archive_overrides (hub, state) values ('occlusion', 'hidden')`), '42501', 'anon writes hub_archive_overrides directly');
  raises(() => anon(`insert into hub_archive_log (hub, old_state, new_state) values ('occlusion', 'auto', 'hidden')`), '42501', 'anon writes hub_archive_log directly');
  raises(() => anon(`select sh_archive_version(now())`), '42501', 'anon runs the private sh_archive_version');
  ok(anonJson(`(select coalesce(json_agg(x), '[]') from get_hub_overrides() x)`).length === 0, 'no overrides at first');
  const logN = () => Number(sql(`select count(*) from hub_archive_log`)[0][0]);
  const set = (hub, st, until, note, expect) => anonJson(`admin_set_hub_archive(${S}, ${q(hub)}, ${q(st)}, ${until ? until : 'null'}, ${note == null ? 'null' : q(note)}, ${expect == null ? 'null' : q(expect)})`);
  const rows = () => anonJson(`(select coalesce(json_agg(x), '[]') from admin_hub_overrides(${S}) x)`);
  const pub = () => anonJson(`(select coalesce(json_agg(x), '[]') from get_hub_overrides() x)`);
  raises(() => anon(`select admin_set_hub_archive('wrong', 'occlusion', 'hidden')`), '28000', 'set an override with a wrong secret');
  raises(() => anon(`select admin_hub_overrides(null)`), '28000', 'read overrides with no secret');
  raises(() => anon(`select admin_hub_archive_log('wrong')`), '28000', 'read the log with a wrong secret');
  ok(logN() === 0, 'refused calls wrote nothing');

  let r = set('occlusion', 'archived', null, 'Fixture: exam moved', 'auto');
  ok(r.changed === true && r.state === 'archived', 'archive a live hub by hand');
  let p = pub();
  ok(p.length === 1 && p[0].hub === 'occlusion' && p[0].state === 'archived' && p[0].until === null, 'get_hub_overrides shows it');
  ok(JSON.stringify(Object.keys(p[0]).sort()) === JSON.stringify(['hub', 'state', 'until']), 'get_hub_overrides has no note or time set');
  ok(logN() === 1, 'one log row for one change');
  raises(() => set('occlusion', 'hidden', null, null, 'auto'), '40001', 'a change made from a stale page is refused');
  ok(logN() === 1, 'the refused change wrote nothing');
  let v = rows()[0].version;
  r = set('occlusion', 'live', `now() + interval '1 day'`, 'Fixture: reopened for a day', v);
  ok(r.changed === true && r.state === 'live' && r.until, 'reopen until an end time');
  v = rows()[0].version;
  const until = rows()[0].until;
  r = anonJson(`admin_set_hub_archive(${S}, 'occlusion', 'live', ${q(until)}::timestamptz, null, ${q(v)})`);
  ok(r.changed === false && logN() === 2, 'repeating the same state and end time changes nothing and logs nothing');
  raises(() => set('occlusion', 'gone', null, null, null), '22023', 'an unknown state');
  raises(() => set('Not A Hub', 'hidden', null, null, null), '22023', 'a bad hub id');
  raises(() => set('occlusion', 'hidden', `now() - interval '1 minute'`, null, null), '22023', 'an end time in the past');
  raises(() => set('occlusion', 'hidden', `now() + interval '401 days'`, null, null), '22023', 'an end time over 400 days away');
  raises(() => set('occlusion', 'hidden', null, 'x'.repeat(301), null), '22023', 'a note over 300 characters');
  ok(logN() === 2, 'refused changes wrote nothing');
  /* the end time passes */
  sql(`update hub_archive_overrides set until = now() - interval '1 minute' where hub = 'occlusion'`);
  ok(pub().length === 0, 'an override whose end time has passed is no longer in force');
  const ended = rows()[0];
  ok(ended.active === false && ended.version === 'auto', 'the admin page sees it as ended (version "auto")');
  r = set('occlusion', 'hidden', null, null, 'auto');
  const lastLog = anonJson(`(select row_to_json(x) from admin_hub_archive_log(${S}, 1) x)`);
  ok(r.changed === true && lastLog.old_state === 'auto' && lastLog.new_state === 'hidden', 'after an override ends, the next change starts from automatic');
  /* reverse */
  v = rows()[0].version;
  r = set('occlusion', 'auto', null, 'Fixture: back to the dates', v);
  ok(r.changed === true && r.state === 'auto' && pub().length === 0 && rows().length === 0, 'back to automatic removes the override');
  const log = anonJson(`(select coalesce(json_agg(x), '[]') from admin_hub_archive_log(${S}, 50) x)`);
  ok(log.length === 4 && log[0].new_state === 'auto' && log[0].note === 'Fixture: back to the dates' && log[3].new_state === 'archived', `the log has every change, newest first (${log.map(l => l.new_state)})`);
  sql(`insert into hub_archive_log (hub, old_state, new_state, at) values ('perio', 'auto', 'hidden', '2026-01-01 12:00+00'), ('perio', 'hidden', 'auto', '2026-01-01 12:00+00')`);
  const tie = anonJson(`(select coalesce(json_agg(x), '[]') from admin_hub_archive_log(${S}, 50) x)`).filter(l => l.hub === 'perio');
  ok(tie.length === 2 && tie[0].id > tie[1].id, 'equal log times: the later row first');
  notes.push('archive overrides: permissions, version check, repeat, validation, end time, reversal, log');

  /* ---------- 3. newest first ---------- */
  sql(`insert into exam_debriefs (hub, exam, visitor_id, answers, created_at) values
         ('perio', '2026-10-01 Midterm', 'fx-p', '{"ready":3}', '2026-10-02 10:00+00'),
         ('heme-endo-exam1', '2026-10-30 Exam', 'fx-h', '{"ready":4}', '2026-11-03 09:00+00'),
         ('occlusion', '2026-10-21 Midterm', 'fx-o', '{"ready":2}', '2026-10-22 08:00+00'),
         ('special-patient-care', '2026-11-13 Due', 'fx-s', '{"ready":5}', '2026-10-22 08:00+00'),
         ('heme-endo-exam1', '2026-10-30 Exam', 'fx-h2', '{"ready":1}', '2026-10-31 07:00+00');
       insert into surveys (slug, title, questions, created_at) values
         ('fx-old', 'Old', '[{"id":"q1","kind":"text","prompt":"?"}]', '2026-09-01 00:00+00'),
         ('fx-new', 'New', '[{"id":"q1","kind":"text","prompt":"?"}]', '2026-10-01 00:00+00'),
         ('fx-tie', 'Tie', '[{"id":"q1","kind":"text","prompt":"?"}]', '2026-10-01 00:00+00');
       insert into survey_responses (survey_id, visitor_id, answers, created_at) select id, 'fx-1', '{"q1":"first"}', '2026-10-02 00:00+00' from surveys where slug = 'fx-new';
       insert into survey_responses (survey_id, visitor_id, answers, created_at) select id, 'fx-2', '{"q1":"third"}', '2026-10-04 00:00+00' from surveys where slug = 'fx-new';
       insert into survey_responses (survey_id, visitor_id, answers, created_at) select id, 'fx-3', '{"q1":"second-a"}', '2026-10-03 00:00+00' from surveys where slug = 'fx-new';
       insert into survey_responses (survey_id, visitor_id, answers, created_at) select id, 'fx-4', '{"q1":"second-b"}', '2026-10-03 00:00+00' from surveys where slug = 'fx-new';`);
  const D = anonJson(`(select coalesce(json_agg(x), '[]') from get_exam_debriefs(${S}) x)`);
  ok(D.map(x => x.visitor_id).join(',') === 'fx-h,fx-h2,fx-s,fx-o,fx-p', `check-ins newest first, the later id first on a tie (${D.map(x => x.visitor_id)})`);
  const SV = anonJson(`(select coalesce(json_agg(x), '[]') from get_survey_results(${S}) x)`);
  ok(SV.map(x => x.slug).join(',') === 'fx-tie,fx-new,fx-old', `surveys newest first, the later id first on a tie (${SV.map(x => x.slug)})`);
  const nw = SV.find(x => x.slug === 'fx-new');
  ok(nw && nw.answers.map(a => a.q1).join(',') === 'third,second-b,second-a,first', `survey answers newest first, the later id first on a tie (${nw && nw.answers.map(a => a.q1)})`);
  notes.push('check-ins and surveys: newest first by created_at, id breaks ties');
} catch (e) {
  problems.push(`test run failed: ${e.message.split('\n')[0]}`);
}
db.stop();
notes.forEach(n => console.log('  ' + n));
if (problems.length) { console.error(`\n✗ admin operations: ${problems.length} problem(s) in ${checks} checks:\n` + problems.map(p => '  - ' + p).join('\n')); process.exit(1); }
console.log(`\n✓ admin operations (live presence, archive overrides, order): ${checks} checks passed`);
