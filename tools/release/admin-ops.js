#!/usr/bin/env node
// Admin operations (migration_v50) on a throwaway PostgreSQL built from supabase/schema.sql, with made-up visitors
// only. Every call is made as the anonymous role, as the admin page's browser makes it. Checks that:
//   - live presence needs the admin secret; counts people with a ping in the last 3 minutes (1-15), one per person
//     across linked devices; shows leaderboard names only (a chosen name, else the random class name); and never
//     returns a visitor id, a section or a per-person time;
//   - archive overrides: anon can't touch the tables; get_hub_overrides shows only overrides in force, without notes;
//     a change needs the secret, checks the version the page saw, ignores a repeat, refuses a bad state, hub, end time
//     or note, writes one log row per change, ends at its end time, and can be reversed back to automatic;
//   - check-ins and surveys come back newest first by created_at, with id breaking ties;
//   - question health's A/B versions (migration_v67): the version shown is kept on each answer, first tries are split
//     by version, and a gap of 20 points with 10+ people a version is flagged (ab_gap);
//   - the A/B versions page (migration_v70): get_ab_summary needs the secret and returns totals only;
//   - the heavy reads worked out ahead (migration_v83): each the same as its function, kept and worked out again by
//     sh_admin_cache_tick when due (sooner for new arguments or Refresh, later while the class is busy), reviews and
//     reports laid over question health at once, a failed or timed-out refresh waits, the table closed to anon;
//   - sh_surface() (the Insights tab's "Where time goes") places every section the engine sends (widget/hub.js
//     section()), Learn and Flashcards apart from the bank (migration_v59).
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

  /* ---------- 4. every section the engine sends has a surface (migration_v59) ---------- */
  const SURF = { 'home/dashboard': 'home', 'compendium/notes': 'notes', 'compendium/bank': 'bank', 'compendium/learn': 'learn',
    'compendium/cards': 'cards', 'compendium/mock': 'mock', 'compendium/weak': 'weak-spots', 'compendium/drill': 'drill',
    'compendium/misses': 'drill', 'compendium/hints': 'hints', 'compendium/cram': 'cram', 'review/side': 'review',
    'arcade/lobby': 'arcade', 'drill/daily': 'drill', 'podcast/timmy-time': 'podcast', 'more/timmy': 'podcast', 'more/menu': 'more',
    'more/stats': 'more', 'more/settings': 'more', 'more/place': 'more', 'more/shop': 'more', 'more/ideas': 'more',
    'compendium/question-bank': 'bank', 'compendium/learning': 'other', 'moreover': 'other', '': 'unknown' };
  const got = anonJson(`(select json_object_agg(s, sh_surface(s)) from unnest(array[${Object.keys(SURF).map(q).join(', ')}]) s)`);
  const wrong = Object.keys(SURF).filter(k => got[k] !== SURF[k]);
  ok(!wrong.length, `sh_surface: ${wrong.map(k => `"${k}" is ${got[k]}, expected ${SURF[k]}`).join('; ')}`);
  notes.push(`sh_surface: ${Object.keys(SURF).length} section names placed (Learn and Flashcards apart from the bank, Drill and Misses as the drill, More)`);

  /* ---------- 5. question health: A/B versions (migration_v67) ---------- */
  {
    const items = [];
    const send = (vis, its) => anon(`select record_qh('perio', ${q(vis)}, ${q(vis + '-visit')}, ${q(JSON.stringify(its))}::jsonb)`);
    /* qa: A 10 of 12, B 3 of 12 on a first try (a real gap); qb: A 8 of 12, B 7 of 12 (no gap); qc: 6 and 1 (too few) */
    for (let i = 0; i < 12; i++) {
      const a = `fx-qh-a${String(i).padStart(2, '0')}`, b = `fx-qh-b${String(i).padStart(2, '0')}`;
      send(a, [{ q: 'qa', v: 'v1', k: 'a', c: 'bank', t: 'mcq', n: 1, ok: i < 10 ? 1 : 0, ch: i < 10 ? 2 : 0, nch: 4, key: 2, w: 0 },
               { q: 'qb', v: 'v1', k: 'a', c: 'bank', t: 'mcq', n: 1, ok: i < 8 ? 1 : 0, w: 0 },
               ...(i < 6 ? [{ q: 'qc', v: 'v1', k: 'a', c: 'bank', t: 'mcq', n: 1, ok: 1, w: 0 }] : []),
               /* the second try, on the other version: not a first try, so not in the comparison */
               { q: 'qa', v: 'v1', k: 'a', c: 'drill', t: 'mcq', n: 2, p: 1, g: 60, ok: 0, w: 1 }]);
      send(b, [{ q: 'qa', v: 'v1', k: 'a', c: 'bank', t: 'mcq', n: 1, ok: i < 3 ? 1 : 0, ch: i < 3 ? 2 : 1, nch: 4, key: 2, w: 1 },
               { q: 'qb', v: 'v1', k: 'a', c: 'bank', t: 'mcq', n: 1, ok: i < 7 ? 1 : 0, w: 1 },
               ...(i < 6 ? [{ q: 'qc', v: 'v1', k: 'a', c: 'bank', t: 'mcq', n: 1, ok: i < 1 ? 1 : 0, w: 1 }] : []),
               { q: 'qb', v: 'v1', k: 'v', c: 'bank', t: 'mcq', ms: 4000, w: 1 }]);
    }
    /* a page before this change (no w) and a bad w: recorded, with no version */
    send('fx-qh-old1', [{ q: 'qa', v: 'v1', k: 'a', c: 'bank', t: 'mcq', n: 1, ok: 1 }]);
    send('fx-qh-bad1', [{ q: 'qa', v: 'v1', k: 'a', c: 'bank', t: 'mcq', n: 1, ok: 1, w: 'b' }, { q: 'qb', v: 'v1', k: 'a', c: 'bank', t: 'mcq', n: 1, ok: 1, w: 12 }]);
    const W = sql(`select coalesce(w::text, 'null'), count(*) from question_events where hub = 'perio' group by 1 order by 1`).map(r => r.join('=')).join(' ');
    ok(W === '0=30 1=54 null=3', `record_qh keeps the version shown (0 = A, 1 = B; none or out of range: null): ${W}`);
    ok(anon(`select count(*) from question_events`)[0][0] === '0', 'question_events: anon reads no rows');
    raises(() => anon(`select get_question_health('wrong', 'perio')`), '28000', 'question health with a wrong secret');
    const QH = anonJson(`get_question_health(${S}, 'perio')`), by = {};
    QH.forEach(r => { by[r.qid] = r; });
    const wa = by.qa && by.qa.wordings, codes = r => (r && r.flags || []).map(f => f.code);
    ok(wa && wa['0'] && wa['0'].n === 12 && wa['0'].c === 10 && wa['1'] && wa['1'].n === 12 && wa['1'].c === 3,
      `qh_report wordings: first tries by version, one per person, without the pages that sent none (${JSON.stringify(wa)})`);
    ok(by.qa && by.qa.n1 === 26, `first tries still count every version and the old pages (n1 ${by.qa && by.qa.n1})`);
    const gap = (by.qa && by.qa.flags || []).find(f => f.code === 'ab_gap');
    ok(gap && gap.harder === 1 && /version B gets 25% right on a first try \(12 people\), version A gets 83% \(12 people\)/.test(gap.why),
      `ab_gap flags qa, B the harder (${gap && gap.why})`);
    ok(!codes(by.qb).includes('ab_gap'), `no ab_gap for a gap of 8 points (qb: ${codes(by.qb)})`);
    ok(!codes(by.qc).includes('ab_gap'), `no ab_gap under 10 people a version (qc: ${codes(by.qc)})`);
    const fx = JSON.parse(sql(`select qh_flags('{"wordings": {"0": {"n": 30, "c": 15}, "1": {"n": 30, "c": 27}}}'::jsonb)::text`)[0][0]);
    ok(fx.flags.some(f => f.code === 'ab_gap' && f.harder === 0), 'ab_gap: A can be the harder one');
    raises(() => anon(`select qh_report('perio')`), '42501', 'qh_report: anon runs it');
    notes.push('question health A/B: the version shown kept on each answer, first tries by version, ab_gap at 20 points with 10+ people a version');

    /* ---------- 6. the admin page's A/B versions page (migration_v70), on the same answers ---------- */
    raises(() => anon(`select get_ab_summary('wrong')`), '28000', 'get_ab_summary with a wrong secret');
    raises(() => anon(`select get_ab_summary(null)`), '28000', 'get_ab_summary with no secret');
    const AB = anonJson(`get_ab_summary(${S})`), P = (AB.hubs || []).find(h => h.hub === 'perio');
    ok(AB.days === 30 && Array.isArray(AB.hubs) && AB.hubs.length === 1 && P, `get_ab_summary: one hub with versions, 30 days (${JSON.stringify(AB).slice(0, 160)})`);
    const f0 = P && P.first && P.first['0'], f1 = P && P.first && P.first['1'];
    /* A: qa 10 of 12, qb 8 of 12, qc 6 of 6; B: qa 3 of 12, qb 7 of 12, qc 1 of 6; the old page's and the bad w's answers left out */
    ok(f0 && f0.n === 30 && f0.c === 24 && f0.people === 12 && f1 && f1.n === 30 && f1.c === 11 && f1.people === 12,
      `get_ab_summary: first tries by version, one per person and question (${JSON.stringify(P && P.first)})`);
    ok(P && P.later && P.later['1'] && P.later['1'].n === 12 && P.later['1'].c === 0 && !P.later['0'],
      `get_ab_summary: later tries apart from first tries (${JSON.stringify(P && P.later)})`);
    ok(P && P.people === 24 && P.answers === 72, `get_ab_summary: people and answers with a version (${P && P.people}, ${P && P.answers})`);
    const pr = {}; (P && P.pairs || []).forEach(x => { pr[x[0]] = x.slice(1).join(','); });
    ok(pr.qa === '12,10,12,3' && pr.qb === '12,8,12,7' && pr.qc === '6,6,6,1' && Object.keys(pr).length === 3,
      `get_ab_summary: each question's pair [A n, A right, B n, B right] (${JSON.stringify(pr)})`);
    ok(P && P.kinds && P.kinds.mcq && P.kinds.mcq['0'].n === 30 && P.kinds.mcq['1'].c === 11, `get_ab_summary: first tries by kind (${JSON.stringify(P && P.kinds)})`);
    /* an edited question: its pair starts again on the new wording, the hub's totals keep both */
    send('fx-qh-new1', [{ q: 'qb', v: 'v2', k: 'a', c: 'bank', t: 'mcq', n: 1, ok: 1, w: 0 }]);
    const AB2 = anonJson(`get_ab_summary(${S})`), P2 = AB2.hubs[0], qb2 = (P2.pairs || []).find(x => x[0] === 'qb');
    ok(qb2 && qb2.slice(1).join(',') === '1,1,0,0' && P2.first['0'].n === 31, `get_ab_summary: an edited question's pair is its new wording's (${JSON.stringify(qb2)}, A n ${P2.first['0'].n})`);
    ok(JSON.stringify(AB2).indexOf('fx-qh-') < 0, 'get_ab_summary: no visitor id in the response');
    notes.push('A/B versions page: admin secret, first tries by version (one per person), later tries, kinds, pairs on the latest wording, no ids');
  }

  /* ---------- 7. the admin page's heavy reads worked out ahead (migration_v83) ---------- */
  if (sql(`select to_regclass('public.admin_cache') is not null`)[0][0] !== 't') notes.push('admin_cache: not in this schema (migration_v83 not loaded)');
  else {
    const tick = (pre) => Number(sql(`${pre || ''} select sh_admin_cache_tick();`).pop()[0]);
    const status = (ask) => anonJson(`get_admin_cache_status(${S}${ask ? `, array[${ask.map(q).join(', ')}]` : ''})`);
    const row = k => { const r = sql(`select coalesce(fails, 0), coalesce(error, ''), body is not null, computed_at is not null from admin_cache where key = ${q(k)}`)[0]; return r ? { fails: Number(r[0]), error: r[1], body: r[2] === 't', at: r[3] === 't' } : null; };
    const age = (k, mins) => sql(`update admin_cache set computed_at = now() - make_interval(mins => ${mins}) where key = ${q(k)}`);
    const byHub = () => anonJson(`(select coalesce(json_agg(x), '[]') from get_visitor_by_hub(${S}, 30) x)`);
    raises(() => anon(`select get_admin_cache_status('wrong')`), '28000', 'cache status with a wrong secret');
    raises(() => anon(`select count(*) from admin_cache`), '42501', 'admin_cache: anon reads it');
    raises(() => anon(`select sh_admin_cache_tick()`), '42501', 'the tick: anon runs it');
    raises(() => anon(`select sh_admin_cached('insights', '{}')`), '42501', 'sh_admin_cached: anon runs it');
    sql(`delete from admin_cache`);

    /* each read is what its function works out, the first time (at once) and from the copy after */
    /* key order aside (a table function's rows and a JSON object list their fields in different orders) */
    const canon = v => Array.isArray(v) ? v.map(canon) : v && typeof v === 'object' ? Object.keys(v).sort().reduce((o, k) => { o[k] = canon(v[k]); return o; }, {}) : v;
    const same = (what, a, b) => ok(JSON.stringify(canon(a)) === JSON.stringify(canon(b)), `${what}: the admin read and the read worked out directly differ (${JSON.stringify(canon(a)).slice(0, 120)} / ${JSON.stringify(canon(b)).slice(0, 120)})`);
    const ins = () => anonJson(`get_insights(${S}, '{"perio":"2026-11-19"}'::jsonb) - 'generated_at'`);
    same('get_insights', ins(), JSON.parse(sql(`select (sh_insights('{"perio":"2026-11-19"}'::jsonb) - 'generated_at')::text`)[0][0]));
    same('get_insights from the copy', ins(), JSON.parse(sql(`select (sh_insights('{"perio":"2026-11-19"}'::jsonb) - 'generated_at')::text`)[0][0]));
    same('get_insight_retries', anonJson(`get_insight_retries(${S}) - 'generated_at'`), JSON.parse(sql(`select sh_insight_retries()::text`)[0][0]));
    same('get_data_quality', anonJson(`get_data_quality(${S}) - 'generated_at' - 'storage'`),
      JSON.parse(sql(`select ((sh_data_quality() || jsonb_build_object('retention', sh_retention_status())) - 'generated_at' - 'storage')::text`)[0][0]));
    same('get_exam_debriefs', anonJson(`(select coalesce(json_agg(x), '[]') from get_exam_debriefs(${S}) x)`), JSON.parse(sql(`select sh_exam_debriefs()::text`)[0][0]));
    same('get_feature_events', anonJson(`(select coalesce(json_agg(x), '[]') from get_feature_events(${S}, 30) x)`), JSON.parse(sql(`select sh_feature_events(30, null)::text`)[0][0]));
    same('get_click_summary', anonJson(`(select coalesce(json_agg(x), '[]') from get_click_summary(${S}, 30) x)`), JSON.parse(sql(`select sh_click_summary(30, null)::text`)[0][0]));
    anonJson(`(select coalesce(json_agg(x), '[]') from get_click_summary(${S}, 30, 'perio') x)`);
    ok(!row('clicks:30:perio') && sql(`select count(*) from admin_cache where key like 'clicks%'`)[0][0] === '1', 'get_click_summary with a hub: worked out at once, not kept');
    const before = byHub();
    ok(row('visitors:30') && row('visitors:30').body, 'get_visitor_by_hub: kept under visitors:30');
    same('get_visitor_summary', anonJson(`(select coalesce(json_agg(x), '[]') from get_visitor_summary(${S}, 30) x)`), JSON.parse(sql(`select sh_visitor_summary(30)::text`)[0][0]));
    same('get_visitor_by_section', anonJson(`(select coalesce(json_agg(x), '[]') from get_visitor_by_section(${S}, 30) x)`), JSON.parse(sql(`select sh_visitor_by_section(30)::text`)[0][0]));
    ok(tick() === 0, 'the tick: nothing due right after the reads');

    /* new study time: the copy keeps the old numbers until it's due, then the tick works it out again */
    sql(`insert into activity_hourly (h, hub, section, visitor_id, n) values (date_trunc('hour', now()), 'fx-cache', 'home', 'fx-c1', 24)`);
    ok(JSON.stringify(byHub()) === JSON.stringify(before), 'the copy: new study time not in it yet');
    age('visitors:30', 20);
    ok(tick() >= 1 && byHub().some(r => r.hub === 'fx-cache'), 'the tick: a copy 20 minutes old, read in the last 2 hours, worked out again (quiet: every 15 minutes)');

    /* busy (20+ people pinged in 5 minutes): every hour, one read a minute */
    sql(`insert into activity_pings (visitor_id, visit_id, hub, section, pinged_at)
         select 'fx-busy-' || g, 'fx-busy-v' || g, 'zz-busy', 'home', now() - interval '1 minute' from generate_series(1, 25) g`);
    age('visitors:30', 20); age('debriefs', 20);
    ok(tick() === 0, 'the tick: busy, a copy 20 minutes old waits');
    age('visitors:30', 70); age('debriefs', 70);
    ok(tick() === 1, 'the tick: busy, one read a minute');
    ok(tick() === 1 && tick() === 0, 'the tick: busy, the second read the next minute, then nothing due');
    sql(`delete from activity_pings where hub = 'zz-busy'`);

    /* new arguments (an edited question's fingerprint): the copy now, a new one at the next tick */
    const qh = cur => anonJson(`get_question_health(${S}, 'perio', 120, ${q(JSON.stringify(cur))}::jsonb)`);
    const inHub = (rows, id) => (rows.find(r => r.qid === id) || {}).in_hub;
    const q1 = qh({ qa: 'v1' });
    ok(inHub(q1, 'qa') === true && inHub(q1, 'qb') === false, 'question health: worked out at once from the page\'s fingerprints');
    const q2 = qh({ qa: 'v1', qb: 'v1' });
    ok(inHub(q2, 'qb') === false && status()['qh:perio'].waiting === true, 'question health: new fingerprints get the copy, and a new one is on its way');
    ok(tick() >= 1 && status()['qh:perio'].waiting === false && inHub(qh({ qa: 'v1', qb: 'v1' }), 'qb') === true, 'the tick: new fingerprints worked out first, at once');
    /* a review (Looks fine / Needs a fix) and a report show at once, without waiting for a new copy */
    sql(`insert into question_flags (hub, note) values ('perio', 'made-up report  — question qc (fx)')`);
    anon(`select admin_review_question(${S}, 'perio', 'qa', 'v1', 'fix', array['ab_gap'], 'made-up note')`);
    const q3 = qh({ qa: 'v1', qb: 'v1' }), fresh = JSON.parse(sql(`select coalesce(jsonb_agg(to_jsonb(r)), '[]')::text from qh_report('perio', 120, '{"qa":"v1","qb":"v1"}'::jsonb) r`)[0][0]);
    const qa3 = q3.find(r => r.qid === 'qa') || {}, qc3 = q3.find(r => r.qid === 'qc') || {};
    ok(qa3.review_status === 'fix' && qa3.state === 'todo' && qc3.reports_open === 1, `question health: a review and a report show at once (${qa3.review_status}, ${qa3.state}, ${qc3.reports_open})`);
    same('question health with a review laid over the copy', q3, fresh);

    /* Refresh: asks for a new copy (not one under 2 minutes old) */
    ok(status(['visitors:30'])['visitors:30'].waiting === false, 'Refresh: a copy under 2 minutes old isn\'t asked for again');
    age('visitors:30', 5);
    ok(status(['visitors:30'])['visitors:30'].waiting === true && tick() >= 1 && status()['visitors:30'].waiting === false, 'Refresh: asked for, worked out at the next tick');
    ok(JSON.stringify(status()).indexOf('fx-') < 0, 'cache status: no visitor id in it');

    /* a read that fails waits before it's tried again; one that stops at the limit too */
    sql(`insert into admin_cache (key, args) values ('nope', '{}')`);
    tick();
    ok(row('nope').fails === 1 && /unknown key/.test(row('nope').error), `the tick: a failed read is noted (${JSON.stringify(row('nope'))})`);
    tick();
    ok(row('nope').fails === 1, 'the tick: a failed read waits 10 minutes before the next try');
    sql(`delete from admin_cache where key = 'nope'`);
    sql(`alter function public.sh_insight_retries() rename to sh_insight_retries_real;
         create function public.sh_insight_retries() returns jsonb language sql as $$ select pg_sleep(3); select '{}'::jsonb $$;`);
    age('retries', 20);
    tick(`set statement_timeout = '600ms';`);
    ok(row('retries').fails === 1 && /statement timeout/.test(row('retries').error) && row('retries').body, `the tick: a read stopped at the job's time limit is noted and its copy kept (${JSON.stringify(row('retries'))})`);
    sql(`drop function public.sh_insight_retries(); alter function public.sh_insight_retries_real() rename to sh_insight_retries;`);

    /* nobody has read it in 30 days: deleted */
    sql(`update admin_cache set wanted_at = now() - interval '31 days' where key = 'debriefs'`);
    tick();
    ok(!row('debriefs'), 'the tick: a read nobody used in 30 days is deleted');
    notes.push('admin reads worked out ahead: each the same as its function, a copy until due (15 min, an hour while busy), new arguments first, reviews and reports laid over at once, Refresh, failures and the time limit wait, 30-day cleanup');
  }
} catch (e) {
  problems.push(`test run failed: ${e.message.split('\n')[0]}`);
}
db.stop();
notes.forEach(n => console.log('  ' + n));
if (problems.length) { console.error(`\n✗ admin operations: ${problems.length} problem(s) in ${checks} checks:\n` + problems.map(p => '  - ' + p).join('\n')); process.exit(1); }
console.log(`\n✓ admin operations (live presence, archive overrides, order, surfaces, question health A/B, the A/B page, the reads worked out ahead): ${checks} checks passed`);
