#!/usr/bin/env node
// Learn's typed answer (widget/study-modes.js, Sam 2026-11-24): the forgiving match marks a clearly right answer right by
// itself, and never a wrong one. Checks the match on made-up questions (what it forgives, what it never forgives), then
// every live hub's questions: each question Learn would type has a right answer that matches itself, in either wording,
// and that no wrong choice matches.
//   node tools/ci/typed.js
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.resolve(__dirname, '../..');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'widget/study-modes.js'), 'utf8'), sandbox, { filename: 'widget/study-modes.js' });
const S = sandbox.window.SH_STUDY;
const problems = [];
let checks = 0;
function ok(cond, what){ checks++; if (!cond) problems.push(what); }
if (!S || typeof S.match !== 'function' || typeof S.typedOK !== 'function' || typeof S.typed !== 'function') { console.error('✗ widget/study-modes.js has no SH_STUDY.match / SH_STUDY.typedOK'); process.exit(1); }

const mcq = (right, wrong) => ({ type: 'mcq', answer: 0, choices: [right].concat(wrong || ['Something else entirely']) });
function right(typed, q, why){ const m = S.match(typed, q); ok(m.right && !m.other, `"${typed}" should be right for "${q.choices[q.answer]}" (${why}): ${JSON.stringify(m)}`); }
function notRight(typed, q, why, other){ const m = S.match(typed, q); ok(!m.right && (other == null || m.other === other), `"${typed}" should not be right for "${q.choices[q.answer]}" (${why}): ${JSON.stringify(m)}`); }

// what it forgives
right('ciliary ganglion', mcq('Ciliary ganglion'), 'case');
right('  Ciliary   Ganglion. ', mcq('Ciliary ganglion'), 'spaces and punctuation');
right('the middle meningeal artery', mcq('Middle meningeal artery'), 'an article');
right('mandibular 1st molar', mcq('Mandibular first molar'), 'a number word');
right('first mandibular molar', mcq('Mandibular first molar'), 'word order');
right('mandibular first molars', mcq('Mandibular first molar'), 'a plural s');
right('taurodontsim', mcq('Taurodontism'), 'two letters swapped in a long word');
right('taurodontim', mcq('Taurodontism'), 'a letter dropped in a long word');
right('ciliary ganglian', mcq('Ciliary ganglion'), 'a letter changed in a long word');
right('c6', mcq('C6'), 'a letter and a number');
right('C 6', mcq('C6'), 'a letter and a number, apart');
right('mesio-buccal', mcq('Mesiobuccal'), 'a hyphen');
right('vitamin k', mcq('Vitamin K (phylloquinone)'), 'a parenthesis left out');
right('Sjögren syndrome', mcq('Sjogren syndrome'), 'an accent');
right("Turner's tooth", mcq('Turners tooth'), 'an apostrophe');
right('an enamel pearl', mcq('An enamel pearl'), 'the choice\'s own article');
right('55', mcq('55'), 'a number');

// what it never forgives
notRight('adduction', mcq('Abduction'), 'a long word changed in its first two letters');
notRight('efferent', mcq('Afferent'), 'a long word changed in its first letter');
notRight('ileum', mcq('Ilium'), 'a typo in a short word');
notRight('medial', mcq('Mesial'), 'a typo in a 6-letter word');
notRight('hypoplasia', mcq('Hyperplasia'), 'two letters off');
notRight('intracellular', mcq('Intercellular'), 'two letters off in a long word');
notRight('54', mcq('55'), 'a number off by one');
notRight('c7', mcq('C6'), 'another number');
notRight('ganglion', mcq('Ciliary ganglion'), 'a word missing');
notRight('ciliary ganglion nerve', mcq('Ciliary ganglion'), 'a word too many');
notRight('', mcq('Ciliary ganglion'), 'nothing typed');
notRight('the', mcq('Ciliary ganglion'), 'only an article');
notRight('maxillary first molar', mcq('Mandibular first molar', ['Maxillary first molar']), 'another choice', true);
notRight('Mandibular first molar', { type: 'mcq', answer: 0, choices: ['Mandibular first molar', 'Mandibular first molars'] }, 'a wrong choice the same in its words', false);
// two wordings (A/B): the shown one's right choice and the original's both count, and neither one's wrong choices do
const base = { id: 'x', type: 'mcq', answer: 1, choices: ['Erosion', 'Attrition', 'Abrasion'] };
const worded = Object.assign({}, base, { choices: ['Acid wear', 'Tooth-to-tooth wear', 'Abrasion'], _base: base });
right('attrition', worded, 'the original wording\'s right choice');
right('tooth to tooth wear', worded, 'the shown wording\'s right choice');
notRight('erosion', worded, 'the original wording\'s wrong choice', true);

// which questions are typed
ok(S.typedOK(mcq('Ciliary ganglion')), 'a two-word answer is typed');
ok(!S.typedOK(mcq('The ciliary muscle relaxes, the zonular fibers tighten and the lens flattens')), 'a long answer is not typed');
ok(!S.typedOK(mcq('All of the above')), '"All of the above" is not typed');
ok(!S.typedOK(mcq('Both A and B')), '"Both" is not typed');
ok(!S.typedOK({ type: 'mcq', answer: 0, choices: ['First molar', 'first molars'] }), 'an answer no different in its words from another choice is not typed');
ok(!S.typedOK({ type: 'multi', correct: [0], choices: ['A', 'B'] }), 'select-all is not typed');

// every live hub's questions that Learn would type
let typed = 0;
const hubsDir = path.join(ROOT, 'hubs');
for (const hub of fs.readdirSync(hubsDir)) {
  const f = path.join(hubsDir, hub, 'content/questions.json');
  if (!fs.existsSync(f)) continue;
  let qs = JSON.parse(fs.readFileSync(f, 'utf8')); qs = Array.isArray(qs) ? qs : (qs.questions || Object.values(qs));
  let vars = {}; const vf = path.join(hubsDir, hub, 'content/variants.json');
  if (fs.existsSync(vf)) { try { vars = JSON.parse(fs.readFileSync(vf, 'utf8')) || {}; } catch (e) { vars = {}; } }
  for (const q of qs) {
    if (!q || !S.typed(q)) continue;
    typed++;
    const m = S.match(q.choices[q.answer], q);
    ok(m.right, `${hub} ${q.id}: its own right answer "${q.choices[q.answer]}" isn't matched (${JSON.stringify(m)})`);
    q.choices.forEach((c, i) => { if (i !== q.answer) { const w = S.match(c, q); ok(!w.right, `${hub} ${q.id}: a wrong choice, "${c}", is matched as right`); } });
    [].concat(vars[q.id] || []).forEach(v => {
      if (!v || !Array.isArray(v.choices)) return;
      const shown = Object.assign({}, q, { choices: v.choices, _base: q });
      const mv = S.match(v.choices[q.answer], shown);
      ok(mv.right, `${hub} ${q.id}: its reworded right answer "${v.choices[q.answer]}" isn't matched (${JSON.stringify(mv)})`);
    });
  }
}
console.log(`  ${typed} questions in the live hubs would be typed in Learn; ${checks} checks`);
if (problems.length) { console.error(`\n✗ Learn's typed answer: ${problems.length} problem(s):\n` + problems.map(p => '  - ' + p).join('\n')); process.exit(1); }
console.log('✓ Learn\'s typed answer: the forgiving match');
