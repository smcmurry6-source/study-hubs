#!/usr/bin/env node
// Hub archive state (widget/archive.js): the precedence between the dashboard's dates and an admin override, tested
// without a browser or a database. Fails if
//   - with no override, any hub in index.html (HUBS and ARCHIVED_HUBS) gets a different state than the dashboard gave
//     it before overrides existed (a frozen copy of that logic is below), at every hour from Sep 1 to Dec 31 2026;
//   - an override in force doesn't win, or still wins after it is cleared or its end time passes;
//   - a bad override (unknown state, a past end time) changes anything.
//   node tools/ci/archive.js
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const A = require(path.join(ROOT, 'widget', 'archive.js'));
const problems = [];
let checks = 0;
function eq(got, want, what){ checks++; if (got !== want) problems.push(`${what}: got ${got}, want ${want}`); }

/* ---------- the hubs, read from the dashboard (index.html is the one home of exam dates) ---------- */
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const D = A.fromDashboardHtml(html), HUBS = D.hubs, ARCHIVED = D.archived, OPT = D.options;
if (!/var CHECKIN_HOUR = \d+, ARCHIVE_HOUR = \d+, CARD_DAYS = \d+;/.test(html)) throw new Error('index.html: ARCHIVE_HOUR / CARD_DAYS not found');

/* ---------- a frozen copy of the dashboard's logic before overrides (index.html, 2026-11-04) ---------- */
function oldState(hub, listed, now){
  const ARCHIVE_HOUR = OPT.archiveHour, CARD_DAYS = OPT.cardDays;
  function parseYmd(s){ const p = String(s).split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  function examAt(x, hour){ const d = parseYmd(x.date); d.setHours(hour, 0, 0, 0); return d; }
  function lastExam(h){ return (h.exams || []).filter(x => x.date).sort((a, b) => a.date < b.date ? 1 : -1)[0] || null; }
  function archiveAt(h){
    if (h.archiveOn && h.archiveOn.date){ const d = parseYmd(h.archiveOn.date); d.setHours(h.archiveOn.hour != null ? h.archiveOn.hour : ARCHIVE_HOUR, 0, 0, 0); return d; }
    const x = lastExam(h); return x ? examAt(x, x.archiveHour != null ? x.archiveHour : ARCHIVE_HOUR) : null;
  }
  function cardGoneAt(h){
    if (h.hideCardOn && typeof h.hideCardOn === 'object'){ const g = parseYmd(h.hideCardOn.date); g.setHours(h.hideCardOn.hour != null ? h.hideCardOn.hour : 0, 0, 0, 0); return g; }
    if (h.hideCardOn) return parseYmd(h.hideCardOn);
    const a = archiveAt(h); return a ? new Date(a.getFullYear(), a.getMonth(), a.getDate() + CARD_DAYS, ARCHIVE_HOUR) : null;
  }
  /* HUBS.filter: archived from archiveAt on; shownArchived: the card until cardGoneAt */
  if (!listed) { const a = archiveAt(hub); if (!(a && now >= a)) return 'live'; }
  const g = cardGoneAt(hub); return g && now < g ? 'archived' : 'hidden';
}

/* 1. no override: the same answer as before, every hour of the term */
for (let t = new Date(2026, 8, 1).getTime(); t <= new Date(2026, 11, 31).getTime(); t += 3600e3) {
  const now = new Date(t);
  for (const [list, listed] of [[HUBS, false], [ARCHIVED, true]]) for (const h of list) {
    const want = oldState(h, listed, now), r = A.resolve(h, null, now, OPT, listed);
    checks++;
    if (r.state !== want || r.source !== 'auto') { problems.push(`${h.id} at ${now.toISOString()}: ${r.state}/${r.source}, the dashboard said ${want}`); break; }
  }
  if (problems.length > 5) break;
}

/* 2. made-up hubs: the automatic schedule, then every override against it */
const at = (y, m, d, h, min) => new Date(y, m - 1, d, h || 0, min || 0);
const final = { id: 'test-final', exams: [{ label: 'Midterm', date: '2026-10-21' }, { label: 'Final', date: '2026-11-19' }] };
eq(A.resolve(final, null, at(2026, 11, 19, 21, 59), OPT).state, 'live', 'auto: before 10 pm on the last exam day');
eq(A.resolve(final, null, at(2026, 11, 19, 22, 0), OPT).state, 'archived', 'auto: 10 pm on the last exam day');
eq(A.resolve(final, null, at(2026, 11, 29, 21, 59), OPT).state, 'archived', 'auto: the card stays 10 days');
eq(A.resolve(final, null, at(2026, 11, 29, 22, 0), OPT).state, 'hidden', 'auto: the card goes after 10 days');
const due = { id: 'test-due', exams: [{ label: 'Due', date: '2026-11-13', archiveHour: 24 }], archiveOn: { date: '2026-11-14', hour: 24 } };
eq(A.resolve(due, null, at(2026, 11, 14, 23, 59), OPT).state, 'live', 'auto: archiveOn moves the cutoff');
eq(A.resolve(due, null, at(2026, 11, 15, 0, 0), OPT).state, 'archived', 'auto: archiveOn hour 24 = midnight after');
const card = { id: 'test-card', exams: [{ label: 'Exam', date: '2026-10-16' }], hideCardOn: '2026-10-21' };
eq(A.resolve(card, null, at(2026, 10, 20, 23, 0), OPT).state, 'archived', 'auto: hideCardOn day not reached');
eq(A.resolve(card, null, at(2026, 10, 21, 0, 0), OPT).state, 'hidden', 'auto: hideCardOn at midnight');
const none = { id: 'test-none', exams: [] };
eq(A.resolve(none, null, at(2027, 6, 1), OPT).state, 'live', 'auto: no exam date stays live');
eq(A.resolve(none, null, at(2027, 6, 1), OPT, true).state, 'hidden', 'auto: listed archived with no card date');

const before = at(2026, 11, 10, 12), after = at(2026, 11, 20, 9), later = at(2026, 12, 15, 9);
for (const [now, label] of [[before, 'before its exam'], [after, 'archived by date'], [later, 'hidden by date']]) {
  for (const st of ['live', 'archived', 'hidden']) {
    const r = A.resolve(final, { state: st, until: null }, now, OPT);
    eq(r.state, st, `manual ${st} ${label}`); eq(r.source, 'manual', `manual ${st} ${label}: source`);
  }
  eq(A.resolve(final, null, now, OPT).source, 'auto', `cleared (back to automatic) ${label}`);
}
/* an end time: manual until then, the dates from then on */
const until = at(2026, 11, 21, 9).toISOString();
eq(A.resolve(final, { state: 'live', until }, at(2026, 11, 21, 8, 59), OPT).state, 'live', 'reopened until an end time: before it');
eq(A.resolve(final, { state: 'live', until }, at(2026, 11, 21, 9, 0), OPT).state, 'archived', 'reopened until an end time: at it, the dates again');
eq(A.resolve(final, { state: 'live', until }, at(2026, 11, 21, 9, 0), OPT).source, 'auto', 'ended override: source');
eq(A.resolve(final, { state: 'hidden', until: at(2026, 11, 1).toISOString() }, before, OPT).state, 'live', 'an override whose end has passed is ignored');
eq(A.resolve(final, { state: 'gone', until: null }, before, OPT).state, 'live', 'an unknown state is ignored');
eq(A.resolve(final, { state: 'auto', until: null }, after, OPT).state, 'archived', '"auto" is not an override');
eq(A.resolve(final, { state: 'archived', until: 'not a date' }, before, OPT).state, 'archived', 'an unreadable end time means no end');
/* reverse an archive: archive by hand, then clear it */
const ov = A.index([{ hub: 'test-final', state: 'archived', until: null }, { hub: 'other', state: 'hidden' }]);
eq(A.resolve(final, ov['test-final'], before, OPT).state, 'archived', 'index(): archived by hand');
eq(A.resolve(final, A.index([])['test-final'], before, OPT).state, 'live', 'index(): reversed, live again');
eq(A.readCache(), null, 'readCache() without localStorage');

if (problems.length) { console.error(`✗ archive state: ${problems.length} problem(s):\n` + problems.slice(0, 20).map(p => '  - ' + p).join('\n')); process.exit(1); }
console.log(`✓ archive state: ${checks} checks (${HUBS.length + ARCHIVED.length} dashboard hubs, every hour Sep-Dec 2026, overrides, end times, reversal)`);
