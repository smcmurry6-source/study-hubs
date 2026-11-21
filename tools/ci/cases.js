#!/usr/bin/env node
// Checks every hub's drawn Patient Box cases (widget/cases.js) against their own numbers: for each hub on the engine
// with `pcases` in hubs/<hub>/content/core.json (its questions name them: `pcase` in questions.json; every hub is on the
// engine since the old single-file pages came down, 2026-11-19), every case must validate (realistic, consistent numbers), its
// `expect` must agree with derive() (the stage, grade, extent, recession types, peri-implant states the numbers
// give), every question that names a case (pcase:'id') must name one that exists when the hub has any cases, and
// every picture kind must be one the kit draws. Patient Box v2 (2026-11-20) adds: the tooth library (widget/teeth.js) has all 32
// teeth and draws each; every case's pictures pass checkFigs() (no bitewing of an incisor, a full-mouth view that agrees
// with the box's counts); a question with `rests` (what its key rests on: stage, grade, extent, rt, furc, impl, kind; since v2.1 also endo, fracture, resto) is
// answerable from the pictures and rows it shows; a question with `says` quotes numbers the record gives, in its text.
// The example cases in tools/cases/examples.json are checked the same way. Run by CI (check.yml).
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.join(__dirname, '..', '..');
const kit = fs.readFileSync(path.join(root, 'widget', 'teeth.js'), 'utf8') + '\n' + fs.readFileSync(path.join(root, 'widget', 'cases.js'), 'utf8');
let bad = 0, hubsWithCases = 0, cases = 0;

function load(block){
  const ctx = { window: {}, document: { addEventListener(){} } };
  vm.createContext(ctx);
  vm.runInContext(kit + '\n' + block + '\nthis.PCASES = PCASES;', ctx);
  return { K: ctx.window.shCases, PCASES: ctx.PCASES };
}
const KINDS = load('var PCASES = {};').K.KINDS;
/* the tooth library: all 32 teeth, each with its roots, sites and films, and an outline that draws */
{
  const T = require(path.join(root, 'widget', 'teeth.js'));
  for (let n = 1; n <= 32; n++) {
    const c = T.tooth(n), o = c && T.outlineMM(n);
    const ok = c && c.roots.length && c.sites.length === 6 && c.films.length && o.crown.length > 10 && o.roots.every((r) => r.every((p) => p.every(Number.isFinite)));
    if (!ok) { bad++; console.error(`widget/teeth.js: tooth #${n} is incomplete`); }
    if (c && c.furcations.length && !c.trunk) { bad++; console.error(`widget/teeth.js: #${n} has furcations but no root trunk`); }
  }
}
function same(want, have){
  if (want && typeof want === 'object') return Object.keys(want).every((k) => same(want[k], have && have[k]));
  return want === have;
}
for (const hub of fs.readdirSync(path.join(root, 'hubs')).sort()) {
  if (!fs.existsSync(path.join(root, 'hubs', hub, 'index.html'))) continue;
  const coreFile = path.join(root, 'hubs', hub, 'content', 'core.json');
  if (!fs.existsSync(coreFile)) { bad++; console.error(`${hub}: a hub page with no content/core.json (every hub is on the engine)`); continue; }
  let K, PCASES;
  const named = [], pfigs = [];
  /* the cases are data in core.json (widget/hub.js loads the kit when it has any) */
  const core = JSON.parse(fs.readFileSync(coreFile, 'utf8'));
  const qs = JSON.parse(fs.readFileSync(path.join(root, 'hubs', hub, 'content', 'questions.json'), 'utf8'));
  qs.forEach((q) => { if (q.pcase) named.push(q.pcase); if (Array.isArray(q.pfig)) pfigs.push(q.pfig.map((f) => f && f.kind)); });
  if (!core.pcases) { for (const kinds of pfigs) for (const k of kinds) if (KINDS.indexOf(k) < 0) { bad++; console.error(`${hub}: a question's pfig has an unknown picture kind "${k}"`); } continue; }
  try { ({ K, PCASES } = load('var PCASES = ' + JSON.stringify(core.pcases) + ';')); }
  catch (e) { console.error(`${hub}: core.json's pcases do not load: ${e.message}`); bad++; continue; }
  checkSet(hub, K, PCASES, named, pfigs, qs);
}
/* the example cases (not on any page), checked like a hub's */
{
  const ex = JSON.parse(fs.readFileSync(path.join(root, 'tools', 'cases', 'examples.json'), 'utf8'));
  const { K } = load('var PCASES = {};');
  const qs = ex.questions || [];
  checkSet('tools/cases/examples.json', K, ex.pcases, qs.filter((q) => q.pcase).map((q) => q.pcase), qs.filter((q) => Array.isArray(q.pfig)).map((q) => q.pfig.map((f) => f && f.kind)), qs);
}
function checkSet(hub, K, PCASES, named, pfigs, qlist){
  const ids = Object.keys(PCASES);
  if (ids.length) hubsWithCases++;
  for (const id of ids) {
    const c = PCASES[id];
    cases++;
    const problems = K.validate(c.spec).concat(K.checkFigs(c.spec, c.figs || []));
    let d;
    try { d = K.derive(c.spec); } catch (e) { problems.push('derive failed: ' + e.message); }
    if (d && c.expect) {
      const got = { kind: d.kind, stage: d.stage, grade: d.grade, extent: d.extent, dx: d.dx, rt: d.rt, impl: d.impl, triggers: d.triggers, ratio: d.ratio, maxInterdental: d.maxInterdental.v, maxRBL: d.maxRBL.pct, bopPct: d.bopPct };
      for (const k of Object.keys(c.expect)) if (!same(c.expect[k], got[k])) problems.push(`expect.${k}: wrote ${JSON.stringify(c.expect[k])}, the numbers give ${JSON.stringify(got[k])}`);
    }
    // the drawings must build without throwing
    try { K.figures(c.spec, c.figs || [{ kind: 'chart' }, { kind: 'film' }, { kind: 'view' }]); } catch (e) { problems.push('drawing failed: ' + e.message); }
    const line = `${hub}/${id}: ${d ? d.dx : '?'}` + (d && Object.keys(d.impl).length ? '; implants ' + JSON.stringify(d.impl) : '') + (d && Object.keys(d.rt).length ? '; recession ' + JSON.stringify(d.rt) : '');
    if (problems.length) { bad++; console.error('✗ ' + line + '\n    ' + problems.join('\n    ')); } else console.log('  ' + line);
  }
  // every question that names a drawn case
  // (hubs that use pcase only to group "same patient" questions have no PCASES; with cases present, every pcase must exist)
  const missing = new Set(named.filter((id) => ids.length && !PCASES[id]));
  if (missing.size) { bad++; console.error(`${hub}: questions name cases that are not in PCASES: ${[...missing].join(', ')}`); }
  // each question's own pictures (pfig) use known kinds
  for (const kinds of pfigs) for (const k of kinds) if (KINDS.indexOf(k) < 0) { bad++; console.error(`${hub}: a question's pfig has an unknown picture kind "${k}"`); }
  // each question on a drawn case: its own pictures, answerable from what it shows, and the numbers its text quotes
  for (const q of qlist || []) {
    const c = q.pcase && PCASES[q.pcase]; if (!c) continue;
    const figs = q.pfig || c.figs || [], rows = K.caseRows(c).concat(q.pbox || []), probs = [];
    if (q.pfig) probs.push(...K.checkFigs(c.spec, q.pfig));
    if (q.rests) probs.push(...K.answerable(c.spec, figs, rows, q.rests));
    if (q.says) probs.push(...K.checkSays(c.spec, q));
    if (probs.length) { bad++; console.error(`✗ ${hub}/${q.id}:\n    ` + probs.join('\n    ')); }
  }
}
if (bad) { console.error(`✗ ${bad} problem(s) in the drawn Patient Box cases`); process.exit(1); }
console.log(`✓ ${cases} drawn Patient Box case(s) in ${hubsWithCases} set(s) (the hubs' and tools/cases/examples.json) are realistic and agree with their keys`);
