#!/usr/bin/env node
// Checks every hub's drawn Patient Box cases (widget/cases.js) against their own numbers: for each hub with a
// /* pcases begin */ ... /* pcases end */ block, every case must validate (realistic, consistent numbers), its
// `expect` must agree with derive() (the stage, grade, extent, recession types, peri-implant states the numbers
// give), every question that names a case (pcase:'id') must name one that exists when the hub has any cases, and
// every picture kind must be one the kit draws. Run by CI (check.yml) and by tools/figures/perio/build.mjs.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.join(__dirname, '..', '..');
const kit = fs.readFileSync(path.join(root, 'widget', 'cases.js'), 'utf8');
const PB = '/* pcases begin */\n', PE = '/* pcases end */\n';
let bad = 0, hubsWithCases = 0, cases = 0;

function load(block){
  const ctx = { window: {}, document: { addEventListener(){} } };
  vm.createContext(ctx);
  vm.runInContext(kit + '\n' + block + '\nthis.PCASES = PCASES;', ctx);
  return { K: ctx.window.shCases, PCASES: ctx.PCASES };
}
function same(want, have){
  if (want && typeof want === 'object') return Object.keys(want).every((k) => same(want[k], have && have[k]));
  return want === have;
}
for (const hub of fs.readdirSync(path.join(root, 'hubs')).sort()) {
  const file = path.join(root, 'hubs', hub, 'index.html');
  if (!fs.existsSync(file)) continue;
  const src = fs.readFileSync(file, 'utf8');
  const i = src.indexOf(PB), j = src.indexOf(PE);
  if (i < 0) continue;
  if (j < i) { console.error(`${hub}: pcases markers out of order`); bad++; continue; }
  if (!/widget\/cases\.js/.test(src)) { console.error(`${hub}: has a pcases block but does not load widget/cases.js`); bad++; }
  if (!/widget\/cases\.css/.test(src)) { console.error(`${hub}: has a pcases block but does not load widget/cases.css`); bad++; }
  let K, PCASES;
  try { ({ K, PCASES } = load(src.slice(i + PB.length, j))); }
  catch (e) { console.error(`${hub}: the pcases block does not run: ${e.message}`); bad++; continue; }
  hubsWithCases++;
  const ids = Object.keys(PCASES);
  for (const id of ids) {
    const c = PCASES[id];
    cases++;
    const problems = K.validate(c.spec);
    (c.figs || []).forEach((f) => { if (['chart', 'film', 'view'].indexOf(f.kind) < 0) problems.push(`figs: unknown picture kind "${f.kind}"`); });
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
  const re = /pcase:\s*'([^']+)'/g; let m; const missing = new Set();
  while ((m = re.exec(src))) if (ids.length && !PCASES[m[1]]) missing.add(m[1]);
  // (hubs that use pcase only to group "same patient" questions have no PCASES; with cases present, every pcase must exist)
  if (missing.size) { bad++; console.error(`${hub}: questions name cases that are not in PCASES: ${[...missing].join(', ')}`); }
  // each question's own pictures (pfig) use known kinds
  const re2 = /pfig:\s*\[([^\]]*)\]/g; while ((m = re2.exec(src))) { const kinds = [...m[1].matchAll(/kind:\s*'([^']+)'/g)].map((x) => x[1]); for (const k of kinds) if (['chart', 'film', 'view'].indexOf(k) < 0) { bad++; console.error(`${hub}: pfig with unknown kind "${k}"`); } }
}
if (bad) { console.error(`✗ ${bad} problem(s) in the drawn Patient Box cases`); process.exit(1); }
console.log(`✓ ${cases} drawn Patient Box case(s) in ${hubsWithCases} hub(s) are realistic and agree with their keys`);
