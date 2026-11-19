#!/usr/bin/env node
// Checks tools/after-merge/run.js's plan (what a push needs after it merges) on made-up pushes, with nothing sent
// anywhere. Run by "Check hubs" (the fast job).   node tools/after-merge/test.js
'use strict';
const { plan, checkHub, closedCheckins, closedCheckinsSql } = require('./run.js');
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

if (fails.length) { console.log('✗ after-merge plan:\n  ' + fails.join('\n  ')); process.exit(1); }
console.log('✓ after-merge plan: keys, Ask Timmy, episodes, closed check-ins, data fixes and changelog lines on made-up pushes');
