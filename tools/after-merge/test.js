#!/usr/bin/env node
// Checks tools/after-merge/run.js's plan (what a push needs after it merges) on made-up pushes, with nothing sent
// anywhere. Run by "Check hubs" (the fast job).   node tools/after-merge/test.js
'use strict';
const { plan } = require('./run.js');
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

// Ask Timmy deploys when its function changes, not for the About page alone (its site.json changes with it)
eq('timmy', plan({ ...base, changes: ch('M supabase/functions/timmy/site.json') }).timmy, true);
eq('no timmy', plan({ ...base, changes: ch('M about/index.html') }).timmy, false);

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

if (fails.length) { console.log('✗ after-merge plan:\n  ' + fails.join('\n  ')); process.exit(1); }
console.log('✓ after-merge plan: keys, Ask Timmy, episodes, data fixes and changelog lines on made-up pushes');
