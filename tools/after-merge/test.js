#!/usr/bin/env node
// Checks tools/after-merge/run.js's plan (what a push needs after it merges) on made-up pushes, with nothing sent
// anywhere. Run by "Check hubs" (the fast job).   node tools/after-merge/test.js
'use strict';
const { plan, checkHub, closedCheckins, closedCheckinsSql, examEves, examEvesSql, downSql, upSql, coverFrom } = require('./run.js');
const fails = [];
const eq = (name, got, want) => { const g = JSON.stringify(got), w = JSON.stringify(want); if (g !== w) fails.push(`${name}: got ${g}, want ${w}`); };
const ch = (...a) => a.map(s => ({ status: s[0], path: s.slice(2) }));
const base = { podcast: () => ({ before: null, after: null }), added: [], engineHubs: ['occlusion', 'perio'] };

// a question bank edit loads that hub's keys only; a hub page or a retired id counts too, a deleted bank doesn't
let p = plan({ ...base, changes: ch('M hubs/occlusion/content/questions.json', 'M hubs/perio/content/notes.json') });
eq('keys after a bank edit', p.keys, ['occlusion']);
eq('site files', p.site, ['hubs/occlusion/content/questions.json', 'hubs/perio/content/notes.json']);
p = plan({ ...base, changes: ch('M tools/question-ids/perio.txt') });
eq('keys after a retirement', p.keys, ['perio']);
eq('no site files', p.site, []);
p = plan({ ...base, changes: ch('D hubs/perio/content/questions.json') });
eq('no keys for a deleted bank', p.keys, []);
p = plan({ ...base, changes: ch('M hubs/heme-endo-exam2/index.html') });
eq('no keys for an old single-file hub', p.keys, []);
p = plan({ ...base, changes: ch('M tools/xp/keys.js') });
eq('every engine hub\'s keys after a change to how keys are built', p.keys, ['occlusion', 'perio']);

// Ask Timmy deploys when its function changes, not for the About page alone (its site.json changes with it)
eq('timmy', plan({ ...base, changes: ch('M supabase/functions/timmy/site.json') }).timmy, true);
eq('no timmy', plan({ ...base, changes: ch('M about/index.html') }).timmy, false);
// a real question (about $0.60) only when the function's code changed; the About page alone gets the free check
eq('site help only: no real question', plan({ ...base, changes: ch('M about/index.html', 'M supabase/functions/timmy/site.json') }).timmyCode, false);
eq('code: a real question', plan({ ...base, changes: ch('M supabase/functions/timmy/core.js', 'M supabase/functions/timmy/site.json') }).timmyCode, true);
eq('the wrapper: a real question', plan({ ...base, changes: ch('M supabase/functions/timmy/index.ts') }).timmyCode, true);
// the real question goes to the live hub whose next exam is soonest (where students are asking), not the first listed
const dash = { hubs: [{ id: 'heme-endo-exam3', exams: [{ date: '2026-11-20' }] }, { id: 'perio', exams: [{ date: '2026-11-10' }, { date: '2026-11-19' }] }, { id: 'occlusion', exams: [] }] };
eq('soonest exam', checkHub(['heme-endo-exam3', 'perio', 'occlusion'], dash, '2026-11-18'), 'perio');
eq('a past exam doesn\'t count', checkHub(['heme-endo-exam3', 'perio'], dash, '2026-11-20'), 'heme-endo-exam3');
eq('no dates: the first listed', checkHub(['occlusion', 'perio'], { hubs: [] }, '2026-11-18'), 'occlusion');
eq('no live hub: the dashboard', checkHub([], dash, '2026-11-18'), 'dashboard');

// a data fix runs when it's added, never when it's edited or renamed; --fix adds one by hand
p = plan({ ...base, changes: ch('A tools/data-fixes/2026-11-20-b.sql', 'A tools/data-fixes/2026-11-20-a.sql', 'M tools/data-fixes/old.sql', 'R tools/data-fixes/moved.sql', 'A tools/data-fixes/notes.md') });
eq('fixes added, in order', p.fixes, ['tools/data-fixes/2026-11-20-a.sql', 'tools/data-fixes/2026-11-20-b.sql']);
p = plan({ ...base, changes: [], extraFixes: ['tools/data-fixes/2026-11-14-in-bennett.sql'] });
eq('a fix by hand', p.fixes, ['tools/data-fixes/2026-11-14-in-bennett.sql']);

// a new episode, or a new length, registers; the same episode doesn't; audio off has no episode (run.js gives null)
const pod = (before, after) => plan({ ...base, changes: ch('M hubs/occlusion/content/core.json'), podcast: () => ({ before, after }) }).podcast;
eq('new episode', pod({ id: 'midterm-review', seconds: 2900 }, { id: 'final-review', seconds: 2862 }), [{ hub: 'occlusion', id: 'final-review', seconds: 2862 }]);
eq('new length', pod({ id: 'final-review', seconds: 2800 }, { id: 'final-review', seconds: 2862 }).length, 1);
eq('same episode', pod({ id: 'final-review', seconds: 2862 }, { id: 'final-review', seconds: 2862 }), []);
eq('first episode', pod(null, { id: 'final-review', seconds: 2862 }).length, 1);
eq('audio off', pod({ id: 'final-review', seconds: 2862 }, null), []);

// changelog lines: "<hub> | <message>", comments and blanks skipped, anything else a warning
p = plan({ ...base, changes: [], added: ['# a comment', '', 'occlusion | Four questions fixed.', 'all | The bank shows more at a time.', 'Occlusion: no bar', 'perio |  ' + 'x'.repeat(401)] });
eq('changelog', p.changelog, [{ hub: 'occlusion', message: 'Four questions fixed.' }, { hub: 'all', message: 'The bank shows more at a time.' }]);
eq('changelog warnings', p.warnings.length, 2);

// a hub's page coming down deletes its "Good question?" thumbs (Sam, 2026-11-21); an edit or another deleted file doesn't
eq('down when a hub page is deleted', plan({ ...base, changes: ch('D hubs/perio/index.html', 'D hubs/perio/content/notes.json', 'D hubs/occlusion/audio/x.mp3') }).down, ['perio']);
eq('no down for an edited page', plan({ ...base, changes: ch('M hubs/perio/index.html') }).down, []);
eq('no down for a page not directly in a hub', plan({ ...base, changes: ch('D hubs/perio/old/index.html') }).down, []);
// the day it came down goes in hubs_down (migration_v95), the first day kept; a page added back takes its row out
eq('no up for a deleted page', plan({ ...base, changes: ch('D hubs/perio/index.html') }).up, []);
eq('up when a hub page is added', plan({ ...base, changes: ch('A hubs/perio/index.html', 'M hubs/occlusion/index.html') }).up, ['perio']);
eq('down records the Central day and keeps the first', /insert into hubs_down \(hub, day\) values \('perio', \(now\(\) at time zone 'America\/Chicago'\)::date\) on conflict \(hub\) do nothing/.test(downSql('perio')), true);
eq('down still deletes the thumbs', /delete from question_feedback where hub = 'perio'/.test(downSql('perio')), true);
eq('up deletes the row', upSql('perio'), "delete from hubs_down where hub = 'perio'");
let threwDown = false; try { downSql("x'; drop table y; --"); } catch (e) { threwDown = true; }
eq('a hub id with a quote is refused', threwDown, true);

// the closed check-ins follow hubs.js whenever it changes (migration_v86); its every closed exam, live hubs and archived
eq('checkins when hubs.js changes', plan({ ...base, changes: ch('M hubs.js') }).checkins, true);
eq('no checkins otherwise', plan({ ...base, changes: ch('M widget/dash.js') }).checkins, false);
const hd = { hubs: [{ id: 'occlusion', exams: [{ date: '2026-10-21', checkinClosed: true }, { date: '2026-11-16' }] }, { id: 'perio', exams: [{ date: '2026-11-19' }] }],
  archived: [{ id: 'hepatobiliary', exams: [{ date: '2026-09-18', checkinClosed: true }] }] };
eq('closed check-ins', closedCheckins(hd), [{ hub: 'hepatobiliary', date: '2026-09-18' }, { hub: 'occlusion', date: '2026-10-21' }]);
let threw = false; try { closedCheckins({ hubs: [{ id: "x'); drop table y; --", exams: [{ date: '2026-01-01', checkinClosed: true }] }] }); } catch (e) { threw = true; }
eq('an odd hub id never reaches the SQL', threw, true);
threw = false; try { closedCheckins(undefined); } catch (e) { threw = true; }
eq('no hubs.js data: nothing is reopened', threw, true);
eq('the SQL', /values \('hepatobiliary', '2026-09-18'::date\), \('occlusion', '2026-10-21'::date\)/.test(closedCheckinsSql(closedCheckins(hd))), true);
eq('none closed', closedCheckinsSql([]), 'delete from exam_checkins_closed');

// the exam-eve bosses follow hubs.js's exams too (migration_v97): the day before each live hub's exam, across a month's end
eq('eves when hubs.js changes', plan({ ...base, changes: ch('M hubs.js') }).eves, true);
eq('no eves otherwise', plan({ ...base, changes: ch('M widget/eggs.js') }).eves, false);
const he = { hubs: [{ id: 'review-of-systems', exams: [{ date: '2026-12-03' }, { date: '2026-12-10', eveBoss: 4000 }] }, { id: 'perio', exams: [{ date: '2026-12-01' }, { date: '2026-12-01' }, { date: '2026-12-05', eveBoss: false }] }],
  archived: [{ id: 'hepatobiliary', exams: [{ date: '2026-12-04' }] }] };
eq('exam eves', examEves(he), [{ hub: 'perio', day: '2026-11-30', exam: '2026-12-01', hp: null }, { hub: 'review-of-systems', day: '2026-12-02', exam: '2026-12-03', hp: null },
  { hub: 'review-of-systems', day: '2026-12-09', exam: '2026-12-10', hp: 4000 }]);
threw = false; try { examEves({ hubs: [{ id: 'perio', exams: [{ date: '2026-12-01', eveBoss: 'lots' }] }] }); } catch (e) { threw = true; }
eq('an eveBoss that isn\'t an HP is refused', threw, true);
threw = false; try { examEves({ hubs: [{ id: "x'); drop table y; --", exams: [{ date: '2026-12-01' }] }] }); } catch (e) { threw = true; }
eq('an odd hub id never reaches the eves\' SQL', threw, true);
const es = examEvesSql(examEves(he));
eq('the eves\' SQL: future ones only, a started boss never moved', [/values \('perio', '2026-11-30'::date, '2026-12-01'::date, null::int\)/.test(es), /4000\)/.test(es),
  /where v\.day >= \(now\(\) at time zone 'America\/Chicago'\)::date/.test(es), /e\.start_id is null and e\.settled_at is null/.test(es), /where eve_bosses\.start_id is null and eve_bosses\.settled_at is null/.test(es)], [true, true, true, true, true]);
eq('no eves: only the ones to come come out', [/delete from eve_bosses e where e\.day >= \(now\(\) at time zone 'America\/Chicago'\)::date and e\.start_id is null and e\.settled_at is null;/.test(examEvesSql([])), /insert/.test(examEvesSql([]))], [true, false]);
eq('nothing happens before migration_v97 is applied', [/^do \$eves\$ begin\n  if to_regclass\('public\.eve_bosses'\) is null then raise notice [^;]+; return; end if;/.test(es), /end \$eves\$$/.test(es)], [true, true]);

// a canceled run's push is covered by the next push run: it starts where the last run that wasn't canceled ended
// (#467's, 2026-11-19: waiting behind #469's, canceled when #472 merged). Commits a < b < c < d on main.
const line = ['a', 'b', 'c', 'd'], anc = (x, y) => line.indexOf(x) >= 0 && line.indexOf(x) <= line.indexOf(y);
const run = (n, sha, conclusion, event = 'push') => ({ run_number: n, head_sha: sha, event, status: 'completed', conclusion });
let c = coverFrom({ runs: [run(10, 'a', 'success'), run(11, 'b', 'cancelled')], runNumber: 12, before: 'b', isAncestor: anc });
eq('a canceled run: from where the last good one ended', c.from, 'a');
eq('it says so', /11 \(b\)/.test(c.note), true);
c = coverFrom({ runs: [run(11, 'b', 'cancelled'), run(10, 'a', 'success'), run(9, 'a', 'cancelled')], runNumber: 12, before: 'b', isAncestor: anc });
eq('only the canceled runs since the last good one', c.skipped.map(r => r.run_number), [11]);
c = coverFrom({ runs: [run(10, 'a', 'success'), run(11, 'b', 'cancelled'), run(12, 'c', 'cancelled')], runNumber: 13, before: 'c', isAncestor: anc });
eq('two canceled in a row', [c.from, c.skipped.length], ['a', 2]);
c = coverFrom({ runs: [run(10, 'a', 'success'), run(11, 'b', 'success')], runNumber: 12, before: 'b', isAncestor: anc });
eq('nothing canceled: the push\'s own range', [c.from, c.note], ['b', null]);
c = coverFrom({ runs: [run(10, 'a', 'failure'), run(11, 'b', 'cancelled')], runNumber: 12, before: 'b', isAncestor: anc });
eq('a failed run counts as covered (it went red; it is redone by hand)', c.from, 'a');
c = coverFrom({ runs: [run(10, 'a', 'success'), run(11, 'b', 'success', 'workflow_dispatch'), run(12, 'c', 'cancelled')], runNumber: 13, before: 'c', isAncestor: anc });
eq('a manual run is not where coverage ends', c.from, 'a');
c = coverFrom({ runs: [run(10, 'a', 'success'), run(11, 'c', 'cancelled'), run(13, 'd', 'success')], runNumber: 12, before: 'c', isAncestor: anc });
eq('newer runs (queued behind this one) are not looked at', c.from, 'a');
c = coverFrom({ runs: [run(10, 'x', 'success'), run(11, 'b', 'cancelled')], runNumber: 12, before: 'b', isAncestor: anc });
eq('a run off this line of history: the push\'s own range, with a warning', [c.from, /by hand/.test(c.note)], ['b', true]);
c = coverFrom({ runs: [run(11, 'b', 'cancelled')], runNumber: 12, before: 'b', isAncestor: anc });
eq('no good run in the page: the push\'s own range, with a warning', [c.from, /by hand/.test(c.note)], ['b', true]);
eq('no runs at all', coverFrom({ runs: [], runNumber: 1, before: 'b', isAncestor: anc }), { from: 'b', skipped: [], note: null });

if (fails.length) { console.log('✗ after-merge plan:\n  ' + fails.join('\n  ')); process.exit(1); }
console.log('✓ after-merge plan: keys, Ask Timmy, episodes, closed check-ins, data fixes, changelog lines and canceled runs on made-up pushes');
