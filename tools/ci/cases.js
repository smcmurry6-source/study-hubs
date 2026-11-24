#!/usr/bin/env node
// Checks every hub's drawn Patient Box cases (widget/cases.js) against their own numbers: for each hub on the engine
// with `pcases` in hubs/<hub>/content/core.json (its questions name them: `pcase` in questions.json; every hub is on the
// engine since the old single-file pages came down, 2026-11-19), every case must validate (realistic, consistent numbers), its
// `expect` must agree with derive() (the stage, grade, extent, recession types, peri-implant states the numbers
// give), every question that names a case (pcase:'id') must name one that exists when the hub has any cases, and
// every picture kind must be one the kit draws. Patient Box v2 (2026-11-20) adds: the tooth library (widget/teeth.js) has all 32
// teeth and draws each; every case's pictures pass checkFigs() (no bitewing of an incisor, a full-mouth view that agrees
// with the box's counts); a question with `rests` (what its key rests on: stage, grade, extent, rt, furc, impl, kind; since v2.1 also endo, fracture, resto, and caries for decay seen from the buccal; since
// v2.2 roottip, resorption and sealant) is answerable from the pictures and rows it shows; a question with `says` quotes numbers
// the record gives, in its text.
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
/* the clinical calls v2.1's answers settled from outside sources (2026-11-21), and v2.2's (2026-11-24: proximal root caries, root
   tips, resorption, sealants, temporaries, the clinical tests; the sources are in widget/cases.js's header): each record must
   pass or fail validate() as written; v2.3's (2026-11-24: implants on modules, an implant-supported bridge) too */
{
  const { K } = load('var PCASES = {};');
  const base = { age: 50, sex: 'man', smoke: 0 };
  const B30 = { m: 'bone', teeth: ['29', '30'], percent: 30, rec: 3 };
  const calls = [
    ['a root-filled incisor with only a veneer (the lingual access open)', false, ['8'], [{ m: 'endo', tooth: '8', fill: 'adequate' }, { m: 'restoration', tooth: '8', surfaces: 'F', material: 'ceramic', type: 'veneer' }]],
    ['a root-filled incisor with a veneer and its lingual access composite', true, ['8'], [{ m: 'endo', tooth: '8', fill: 'adequate' }, { m: 'restoration', tooth: '8', surfaces: 'F', material: 'ceramic', type: 'veneer' }, { m: 'restoration', tooth: '8', surfaces: 'L', material: 'composite' }]],
    ['a root-filled molar with only a buccal Class V', false, ['19'], [{ m: 'endo', tooth: '19', fill: 'adequate' }, { m: 'restoration', tooth: '19', surfaces: 'B', material: 'composite' }]],
    ['a root-filled molar with an occlusal composite', true, ['19'], [{ m: 'endo', tooth: '19', fill: 'adequate' }, { m: 'restoration', tooth: '19', surfaces: 'O', material: 'composite' }]],
    ['a stainless steel crown on a premolar', false, ['20'], [{ m: 'restoration', tooth: '20', material: 'crown', crown: 'ssc' }]],
    ['a stainless steel crown on a permanent molar', true, ['19'], [{ m: 'restoration', tooth: '19', material: 'crown', crown: 'ssc' }]],
    ['a vertical root fracture on an untreated, unrestored premolar', false, ['20'], [{ m: 'fracture', tooth: '20', type: 'vrf', side: 'm' }]],
    ['a vertical root fracture on an untreated molar not marked vital', false, ['19'], [{ m: 'fracture', tooth: '19', type: 'vrf', side: 'm', root: 'mesial' }]],
    ['a vertical root fracture on an attrited, untreated molar marked vital', true, ['19'], [{ m: 'fracture', tooth: '19', type: 'vrf', side: 'm', root: 'mesial', vital: true }]],
    // decay seen from the buccal (2026-11-21)
    ['root caries with no recession', false, ['22'], [{ m: 'caries', tooth: '22', surface: 'F', depth: 'dentin', root: true }]],
    ['root caries on a root exposed by 3 mm of recession', true, ['22'], [{ m: 'recession', teeth: ['22'], mm: 3 }, { m: 'caries', tooth: '22', surface: 'F', depth: 'dentin', root: true }]],
    ['root caries in the enamel', false, ['22'], [{ m: 'recession', teeth: ['22'], mm: 3 }, { m: 'caries', tooth: '22', surface: 'F', depth: 'enamel', root: true }]],
    ['root caries on a proximal surface with only facial recession (the interdental crest in place)', false, ['22'], [{ m: 'recession', teeth: ['22'], mm: 3 }, { m: 'caries', tooth: '22', surface: 'M', depth: 'dentin', root: true }]],
    ['root caries on a crowned tooth (that is recurrent caries at its margin)', false, ['19'], [{ m: 'recession', teeth: ['19'], mm: 2 }, { m: 'restoration', tooth: '19', material: 'crown', crown: 'pfm' }, { m: 'caries', tooth: '19', surface: 'B', depth: 'dentin', root: true }]],
    ['a white-spot lesion in the dentin', false, ['20'], [{ m: 'caries', tooth: '20', surface: 'B', depth: 'dentin', stage: 'white-spot' }]],
    ['a white-spot lesion on a buccal surface', true, ['20'], [{ m: 'caries', tooth: '20', surface: 'B', depth: 'enamel', stage: 'white-spot' }]],
    ['an arrested brown spot', true, ['20'], [{ m: 'caries', tooth: '20', surface: 'B', depth: 'enamel', stage: 'white-spot', arrested: true }]],
    ['a caries stage the kit does not know', false, ['20'], [{ m: 'caries', tooth: '20', surface: 'B', depth: 'enamel', stage: 'chalky' }]],
    ['recurrent caries at a buccal Class V', true, ['19'], [{ m: 'restoration', tooth: '19', surfaces: 'B', material: 'composite' }, { m: 'caries', tooth: '19', surface: 'B', depth: 'dentin', recurrent: true }]],
    ['recurrent caries on a buccal surface with no buccal restoration', false, ['19'], [{ m: 'restoration', tooth: '19', surfaces: 'MO', material: 'amalgam' }, { m: 'caries', tooth: '19', surface: 'B', depth: 'dentin', recurrent: true }]],
    ['recurrent caries at a crown\'s buccal margin', true, ['19'], [{ m: 'restoration', tooth: '19', material: 'crown', crown: 'zirconia' }, { m: 'caries', tooth: '19', surface: 'B', depth: 'dentin', recurrent: true }]],
    ['recurrent caries at a veneer\'s margin', true, ['8'], [{ m: 'restoration', tooth: '8', surfaces: 'F', material: 'ceramic', type: 'veneer' }, { m: 'caries', tooth: '8', surface: 'F', depth: 'dentin', recurrent: true }]],
    ['primary caries on a veneered labial surface', false, ['8'], [{ m: 'restoration', tooth: '8', surfaces: 'F', material: 'ceramic', type: 'veneer' }, { m: 'caries', tooth: '8', surface: 'F', depth: 'dentin' }]],
    ['arrested recurrent caries', false, ['19'], [{ m: 'restoration', tooth: '19', surfaces: 'B', material: 'composite' }, { m: 'caries', tooth: '19', surface: 'B', depth: 'dentin', recurrent: true, arrested: true }]],
    // Patient Box v2.2 (2026-11-24): proximal root caries
    ['proximal root caries on a root bared by interdental attachment loss', true, ['29', '30'], [B30, { m: 'caries', tooth: '29', surface: 'D', depth: 'dentin', root: true }]],
    ['proximal root caries with no interdental attachment loss', false, ['29', '30'], [{ m: 'caries', tooth: '29', surface: 'D', depth: 'dentin', root: true }]],
    ['proximal root caries in the enamel', false, ['29', '30'], [B30, { m: 'caries', tooth: '29', surface: 'D', depth: 'enamel', root: true }]],
    // root tips
    ['a retained root', true, ['12', '13'], [{ m: 'roottip', tooth: '12', kind: 'retained' }]],
    ['a retained root with a restoration', false, ['12', '13'], [{ m: 'roottip', tooth: '12', kind: 'retained' }, { m: 'restoration', tooth: '12', surfaces: 'MO', material: 'composite' }]],
    ['a retained root with a root canal filling (an overdenture abutment: not yet)', false, ['12', '13'], [{ m: 'roottip', tooth: '12', kind: 'retained' }, { m: 'endo', tooth: '12', fill: 'adequate' }]],
    ['a retained root with a periapical lesion', true, ['12', '13'], [{ m: 'roottip', tooth: '12', kind: 'retained' }, { m: 'endo', tooth: '12', fill: false, lesion: 4 }]],
    ['a root tip left in a molar\'s socket', true, ['13', '14', '15'], [{ m: 'roottip', tooth: '14', kind: 'fragment', len: 4, root: 'mesiobuccal' }]],
    ['a root tip longer than the root allows', false, ['13', '14', '15'], [{ m: 'roottip', tooth: '14', kind: 'fragment', len: 11, root: 'mesiobuccal' }]],
    ['a root tip of a root the tooth doesn\'t have', false, ['18', '19', '20'], [{ m: 'roottip', tooth: '19', kind: 'fragment', len: 4, root: 'palatal' }]],
    ['a root tip kind the kit doesn\'t know', false, ['13', '14', '15'], [{ m: 'roottip', tooth: '14', kind: 'stump' }]],
    // resorption
    ['internal resorption in the middle of a canal', true, ['8', '9'], [{ m: 'resorption', tooth: '9', type: 'internal', at: 'middle', size: 2.5 }]],
    ['internal resorption in a root-filled tooth', false, ['8', '9'], [{ m: 'endo', tooth: '9', fill: 'adequate' }, { m: 'restoration', tooth: '9', surfaces: 'L', material: 'composite' }, { m: 'resorption', tooth: '9', type: 'internal', at: 'middle', size: 2.5 }]],
    ['internal resorption wider than a lower incisor\'s root', false, ['24', '25'], [{ m: 'resorption', tooth: '24', type: 'internal', at: 'middle', size: 4 }]],
    ['two internal resorptions on one tooth', false, ['8', '9'], [{ m: 'resorption', tooth: '9', type: 'internal', at: 'middle', size: 2 }, { m: 'resorption', tooth: '9', type: 'internal', at: 'apical', size: 1.5 }]],
    ['external cervical resorption, Heithersay class 3', true, ['6', '7'], [{ m: 'resorption', tooth: '7', type: 'cervical', side: 'f', heithersay: 3 }]],
    ['external cervical resorption, Heithersay class 5', false, ['6', '7'], [{ m: 'resorption', tooth: '7', type: 'cervical', side: 'f', heithersay: 5 }]],
    ['external apical resorption of 2.5 mm', true, ['9', '10'], [{ m: 'resorption', tooth: '10', type: 'apical', mm: 2.5 }]],
    ['external apical resorption of 8 mm', false, ['9', '10'], [{ m: 'resorption', tooth: '10', type: 'apical', mm: 8 }]],
    ['replacement resorption on an immobile tooth', true, ['8', '9'], [{ m: 'resorption', tooth: '8', type: 'replacement', side: 'md', at: 'middle', mm: 6 }]],
    ['replacement resorption on a mobile tooth (ankylosis fixes it in the bone)', false, ['8', '9'], [{ m: 'resorption', tooth: '8', type: 'replacement', side: 'md', at: 'middle', mm: 6 }], { t: { 8: { mob: 1 } } }],
    ['a resorption type the kit doesn\'t know', false, ['8', '9'], [{ m: 'resorption', tooth: '8', type: 'surface' }]],
    // sealants
    ['occlusal sealants on molars', true, ['18', '19'], [{ m: 'sealant', teeth: ['18', '19'], surfaces: 'O' }]],
    ['a sealant in a mandibular molar\'s buccal pit', true, ['18', '19'], [{ m: 'sealant', teeth: ['19'], surfaces: 'OB' }]],
    ['a sealant in a maxillary molar\'s palatal groove', true, ['2', '3'], [{ m: 'sealant', teeth: ['3'], surfaces: 'OL' }]],
    ['a sealant in a maxillary lateral\'s lingual pit', true, ['7', '8'], [{ m: 'sealant', teeth: ['7'], surfaces: 'L' }]],
    ['a buccal sealant on a maxillary molar', false, ['2', '3'], [{ m: 'sealant', teeth: ['3'], surfaces: 'B' }]],
    ['an occlusal sealant on an incisor', false, ['23', '24'], [{ m: 'sealant', teeth: ['24'], surfaces: 'O' }]],
    ['a sealant over an enamel lesion (it can arrest one)', true, ['18', '19'], [{ m: 'caries', tooth: '19', surface: 'O', depth: 'enamel' }, { m: 'sealant', teeth: ['19'], surfaces: 'O' }]],
    ['a sealant over a dentin lesion', false, ['18', '19'], [{ m: 'caries', tooth: '19', surface: 'O', depth: 'dentin' }, { m: 'sealant', teeth: ['19'], surfaces: 'O' }]],
    ['a sealant over an occlusal amalgam', false, ['18', '19'], [{ m: 'restoration', tooth: '19', surfaces: 'O', material: 'amalgam' }, { m: 'sealant', teeth: ['19'], surfaces: 'O' }]],
    ['a sealant on a crowned molar', false, ['18', '19'], [{ m: 'restoration', tooth: '19', material: 'crown', crown: 'pfm' }, { m: 'sealant', teeth: ['19'], surfaces: 'O' }]],
    // temporaries
    ['a temporary filling sealing a root-filled molar\'s access', true, ['19', '20'], [{ m: 'endo', tooth: '19', fill: 'adequate' }, { m: 'restoration', tooth: '19', surfaces: 'O', material: 'temporary', temp: 'irm' }]],
    ['a Cavit Class II', true, ['20', '21'], [{ m: 'restoration', tooth: '21', surfaces: 'DO', material: 'temporary', temp: 'cavit' }]],
    ['a temporary inlay', false, ['20', '21'], [{ m: 'restoration', tooth: '21', surfaces: 'DO', material: 'temporary', type: 'inlay' }]],
    ['a temporary material the kit doesn\'t know', false, ['20', '21'], [{ m: 'restoration', tooth: '21', surfaces: 'DO', material: 'temporary', temp: 'zoe' }]],
    ['a temporary\'s material on a composite', false, ['20', '21'], [{ m: 'restoration', tooth: '21', surfaces: 'DO', material: 'composite', temp: 'irm' }]],
    ['a temporary filling with an overhang', false, ['20', '21'], [{ m: 'restoration', tooth: '21', surfaces: 'DO', material: 'temporary', temp: 'irm', overhang: 'd' }]],
    ['a provisional crown', true, ['19', '20'], [{ m: 'restoration', tooth: '20', material: 'crown', crown: 'provisional' }]],
    // clinical tests
    ['a cracked molar: bite test positive on release, transillumination stopped', true, ['18', '19'], [{ m: 'restoration', tooth: '19', surfaces: 'MOD', material: 'amalgam' }, { m: 'fracture', tooth: '19', type: 'crack' }], { tests: [{ test: 'bite', tooth: '19', result: 'positive', cusp: 'DL', release: true }, { test: 'transillumination', tooth: '19', result: 'positive' }] }],
    ['a positive bite test with nothing to cause it', false, ['18', '19'], [], { tests: [{ test: 'bite', tooth: '19', result: 'positive' }] }],
    ['pain on release on a negative bite test', false, ['18', '19'], [{ m: 'fracture', tooth: '19', type: 'crack' }], { tests: [{ test: 'bite', tooth: '19', result: 'negative', release: true }] }],
    ['a bite test on a cusp the tooth doesn\'t have', false, ['18', '19'], [{ m: 'fracture', tooth: '19', type: 'crack' }], { tests: [{ test: 'bite', tooth: '19', result: 'positive', cusp: 'MP', release: true }] }],
    ['transillumination through a crown', false, ['18', '19'], [{ m: 'restoration', tooth: '19', material: 'crown', crown: 'pfm' }], { tests: [{ test: 'transillumination', tooth: '19', result: 'negative' }] }],
    ['transillumination stopped with no crack', false, ['18', '19'], [], { tests: [{ test: 'transillumination', tooth: '19', result: 'positive' }] }],
    ['a metallic sound on percussion with no ankylosis', false, ['8', '9'], [], { tests: [{ test: 'percussion', tooth: '8', result: 'metallic' }] }],
    ['an ankylosed tooth with a normal percussion sound', false, ['8', '9'], [{ m: 'resorption', tooth: '8', type: 'replacement', side: 'md', at: 'middle', mm: 6 }], { tests: [{ test: 'percussion', tooth: '8', result: 'normal' }] }],
    ['tender to percussion with apical periodontitis', true, ['19', '20'], [{ m: 'endo', tooth: '19', fill: false, lesion: 4 }, { m: 'restoration', tooth: '19', surfaces: 'MOD', material: 'amalgam' }], { tests: [{ test: 'percussion', tooth: '19', result: 'tender' }] }],
    ['tender to percussion with nothing to cause it', false, ['19', '20'], [], { tests: [{ test: 'percussion', tooth: '19', result: 'tender' }] }],
    ['a test on a missing tooth', false, ['18', '19'], [{ m: 'missing', teeth: ['19'] }], { tests: [{ test: 'percussion', tooth: '19', result: 'normal' }] }],
    ['a test on a tooth not in the case', false, ['18', '19'], [], { tests: [{ test: 'percussion', tooth: '3', result: 'normal' }] }],
    ['the same test twice on one tooth', false, ['18', '19'], [], { tests: [{ test: 'percussion', tooth: '19', result: 'normal' }, { test: 'percussion', tooth: '19', result: 'normal' }] }],
    ['a test the kit doesn\'t have (pulp tests: not yet)', false, ['18', '19'], [], { tests: [{ test: 'cold', tooth: '19', result: 'normal' }] }],
    // Patient Box v2.3 (2026-11-24): implants on modules, an implant-supported bridge
    ['a healthy implant on a module', true, ['28', '29', '30'], [{ m: 'implant', tooth: '29', state: 'health', crown: 'zirconia', retention: 'screw', years: 3 }]],
    ['mucositis, peri-implantitis and a failed implant on modules', true, ['7', '8', '9', '10'], [{ m: 'implant', tooth: '8', state: 'mucositis', crown: 'lithium' }, { m: 'implant', tooth: '10', state: 'failed', crown: 'pfm', mob: 2 }]],
    ['peri-implantitis with excess cement and the facial mucosa receded', true, ['29', '30', '31'], [{ m: 'implant', tooth: '30', state: 'peri-implantitis', crown: 'pfm', retention: 'cement', cement: true, loss: 3.5, rec: 3, pus: true }]],
    ['an implant state the kit doesn\'t know', false, ['28', '29', '30'], [{ m: 'implant', tooth: '29', state: 'ailing' }]],
    ['bone loss past the baseline on a healthy implant', false, ['28', '29', '30'], [{ m: 'implant', tooth: '29', state: 'health', loss: 2 }]],
    ['bone loss past the baseline with mucositis (that is peri-implantitis)', false, ['28', '29', '30'], [{ m: 'implant', tooth: '29', state: 'mucositis', loss: 2 }]],
    ['an implant healing under its cover screw', true, ['13', '14', '15'], [{ m: 'implant', tooth: '14', state: 'healing', weeks: 6 }]],
    ['a cover screw on a healthy, loaded implant', false, ['13', '14', '15'], [{ m: 'implant', tooth: '14', state: 'health', cover: true }]],
    ['a crown on an implant still under its cover screw', false, ['13', '14', '15'], [{ m: 'implant', tooth: '14', state: 'healing', crown: 'pfm' }]],
    ['years since delivery on an implant still under its cover screw', false, ['13', '14', '15'], [{ m: 'implant', tooth: '14', state: 'healing', years: 1 }]],
    ['an implant under its cover screw probed', false, ['13', '14', '15'], [{ m: 'implant', tooth: '14', state: 'healing' }], { t: { 14: { pd: { f: [3, 2, 3], l: [3, 2, 3] } } } }],
    ['an implant that failed under its cover screw', true, ['13', '14', '15'], [{ m: 'implant', tooth: '14', state: 'failed', cover: true }]],
    ['a bridge on an implant still under its cover screw', false, ['12', '13', '14', '15'], [{ m: 'missing', teeth: ['13'] }, { m: 'implant', teeth: ['12', '14'], state: 'healing' }, { m: 'bridge', abutments: ['12', '14'], material: 'pfm' }]],
    ['a retention the kit doesn\'t know', false, ['28', '29', '30'], [{ m: 'implant', tooth: '29', retention: 'glue' }]],
    ['excess cement under a screw-retained crown', false, ['28', '29', '30'], [{ m: 'implant', tooth: '29', state: 'mucositis', retention: 'screw', cement: true }]],
    ['a crown delivered 60 years ago', false, ['28', '29', '30'], [{ m: 'implant', tooth: '29', years: 60 }]],
    ['a stainless steel crown on an implant', false, ['18', '19', '20'], [{ m: 'implant', tooth: '19', crown: 'ssc' }]],
    ['an overhang on an implant crown (excess cement is implant.cement)', false, ['18', '19', '20'], [{ m: 'implant', tooth: '19', crown: 'pfm' }], { t: { 19: { margin: { overhang: 'm' } } } }],
    ['a regular implant in a lower incisor\'s space (too close to its neighbors\' roots)', false, ['23', '24', '25'], [{ m: 'implant', tooth: '24', w: 4.1 }]],
    ['a narrow implant in a lower incisor\'s space (1.6 mm to each root)', true, ['23', '24', '25'], [{ m: 'implant', tooth: '24' }]],
    ['a narrow implant in an upper lateral\'s space', true, ['9', '10', '11'], [{ m: 'implant', tooth: '10' }]],
    ['two implants side by side at #24 and #25 (under 3 mm apart)', false, ['23', '24', '25', '26'], [{ m: 'implant', teeth: ['24', '25'] }]],
    ['two implants side by side at #8 and #9 (4.4 mm apart)', true, ['7', '8', '9', '10'], [{ m: 'implant', teeth: ['8', '9'] }]],
    ['two implants side by side at #29 and #30', true, ['28', '29', '30', '31'], [{ m: 'implant', teeth: ['29', '30'] }]],
    ['an implant\'s pocket base past the bone', false, ['28', '29', '30'], [{ m: 'implant', tooth: '29' }], { t: { 29: { pd: { f: [6, 5, 6], l: [3, 2, 3] } } } }],
    ['an implant\'s pocket base 3 mm short of the bone', false, ['28', '29', '30'], [{ m: 'implant', tooth: '29', bone: 4 }], { t: { 29: { pd: { f: [3, 2, 3], l: [3, 2, 3] } } } }],
    ['an implant\'s mucosal margin at the bone', false, ['28', '29', '30'], [{ m: 'implant', tooth: '29' }], { t: { 29: { rec: { f: [1, 1, 1], l: [-3, -2, -3] }, pd: { f: [1, 1, 1], l: [3, 2, 3] } } } }],
    ['an implant-supported bridge', true, ['18', '19', '20', '21', '22'], [{ m: 'missing', teeth: ['20'] }, { m: 'implant', teeth: ['19', '21'], retention: 'screw' }, { m: 'bridge', abutments: ['19', '21'], material: 'pfm' }]],
    ['a bridge joining an implant to a tooth', false, ['18', '19', '20', '21'], [{ m: 'missing', teeth: ['20'] }, { m: 'implant', tooth: '19' }, { m: 'bridge', abutments: ['19', '21'], material: 'pfm' }]],
    ['two pontics on two implants', false, ['18', '19', '20', '21', '22'], [{ m: 'missing', teeth: ['19', '20'] }, { m: 'implant', teeth: ['18', '21'] }, { m: 'bridge', abutments: ['18', '21'], material: 'zirconia' }]],
    ['a lithium disilicate bridge on implants at #3 and #5', false, ['3', '4', '5'], [{ m: 'missing', teeth: ['4'] }, { m: 'implant', teeth: ['3', '5'] }, { m: 'bridge', abutments: ['3', '5'], material: 'lithium' }]],
    ['a lithium disilicate bridge on implants at #7 and #9', true, ['7', '8', '9'], [{ m: 'missing', teeth: ['8'] }, { m: 'implant', teeth: ['7', '9'] }, { m: 'bridge', abutments: ['7', '9'], material: 'lithium' }]],
    ['a full mouth counting an implant as a tooth', false, ['29', '30', '31'], [{ m: 'missing', teeth: ['1', '16', '17', '32'] }, { m: 'implant', tooth: '30' }], { full: true, mouth: { teeth: 28, involved: 0, lost: 0 } }],
    ['a full mouth counting its implant apart', true, ['29', '30', '31'], [{ m: 'missing', teeth: ['1', '16', '17', '32'] }, { m: 'implant', tooth: '30' }], { full: true, mouth: { teeth: 27, involved: 0, lost: 0 } }],
  ];
  // a record: [what, passes, teeth, modules, more of the record (per-tooth t, tests)]
  for (const [what, ok, teeth, modules, extra] of calls) {
    const p = K.validate(Object.assign({ teeth, modules }, base, extra || {}));
    if (ok !== !p.length) { bad++; console.error(`✗ the kit's rules: ${what} should ${ok ? 'pass' : 'fail'} validate()` + (p.length ? ': ' + p.join('; ') : '')); }
  }
}
/* decay seen from the buccal (2026-11-21): what a question about caries can rest on (answerable(), rests ['caries']). A buccal
   lesion shows on the view where it is above the gingiva; a proximal one on a posterior tooth is a film finding. v2.2 (2026-11-24):
   proximal root caries on a film (arrested only with the exam in a row), a root tip on a periapical, resorption, sealants, a
   crack's tests in the record's rows */
{
  const { K } = load('var PCASES = {};');
  const base = { age: 60, sex: 'woman', smoke: 0 };
  const B30 = { m: 'bone', teeth: ['29', '30'], percent: 30, rec: 3 };
  const RC = [B30, { m: 'caries', tooth: '29', surface: 'D', depth: 'dentin', root: true }];
  const RCA = [B30, { m: 'caries', tooth: '30', surface: 'M', depth: 'dentin', root: true, arrested: true }];
  const TIP = [{ m: 'roottip', tooth: '14', kind: 'fragment', len: 4, root: 'mesiobuccal' }];
  const RET = [{ m: 'roottip', tooth: '12', kind: 'retained' }];
  const CRACK = [{ m: 'restoration', tooth: '19', surfaces: 'MOD', material: 'amalgam' }, { m: 'fracture', tooth: '19', type: 'crack' }];
  const PI = [{ m: 'implant', tooth: '30', state: 'peri-implantitis', crown: 'pfm', retention: 'cement', cement: true, loss: 3.5, years: 4 }];
  const recs = [
    ['a cervical lesion on the view', true, ['18', '19', '20'], [{ m: 'caries', tooth: '19', surface: 'B', depth: 'dentin' }], [{ kind: 'view' }]],
    ['root caries on the view', true, ['21', '22'], [{ m: 'recession', teeth: ['22'], mm: 3 }, { m: 'caries', tooth: '22', surface: 'F', depth: 'dentin', root: true }], [{ kind: 'view' }]],
    ['root caries on the odontogram alone (its look is the finding)', false, ['21', '22'], [{ m: 'recession', teeth: ['22'], mm: 3 }, { m: 'caries', tooth: '22', surface: 'F', depth: 'dentin', root: true }], [{ kind: 'film' }]],
    ['a molar\'s proximal lesion on the view alone', false, ['18', '19', '20'], [{ m: 'caries', tooth: '19', surface: 'D', depth: 'dentin' }], [{ kind: 'view' }]],
    ['a molar\'s proximal lesion on a bitewing', true, ['19', '20', '29', '30'], [{ m: 'caries', tooth: '19', surface: 'D', depth: 'dentin' }], [{ kind: 'bitewing', teeth: ['19', '20', '13', '14'] }]],
    ['an incisor\'s proximal lesion into the dentin on the view', true, ['7', '8', '9'], [{ m: 'caries', tooth: '8', surface: 'M', depth: 'dentin' }], [{ kind: 'view' }]],
    ['an incisor\'s proximal enamel lesion on the view alone', false, ['7', '8', '9'], [{ m: 'caries', tooth: '8', surface: 'M', depth: 'enamel' }], [{ kind: 'view' }]],
    ['recurrent caries at a crown\'s buccal margin under healthy gingiva, view alone', false, ['18', '19'], [{ m: 'restoration', tooth: '19', material: 'crown', crown: 'pfm' }, { m: 'caries', tooth: '19', surface: 'B', depth: 'dentin', recurrent: true }], [{ kind: 'view' }]],
    ['recurrent caries at a crown\'s buccal margin exposed by recession, on the view', true, ['18', '19'], [{ m: 'recession', teeth: ['19'], mm: 2 }, { m: 'restoration', tooth: '19', material: 'crown', crown: 'pfm' }, { m: 'caries', tooth: '19', surface: 'B', depth: 'dentin', recurrent: true }], [{ kind: 'view' }]],
    ['an occlusal enamel lesion on a film alone (no film shows it)', false, ['19', '20'], [{ m: 'caries', tooth: '19', surface: 'O', depth: 'enamel' }], [{ kind: 'film' }]],
    // Patient Box v2.2 (2026-11-24): proximal root caries, root tips, resorption, sealants, a crack's tests, a temporary
    ['proximal root caries on a periapical', true, ['29', '30'], RC, [{ kind: 'film' }]],
    ['proximal root caries on the view alone (the contact hides it)', false, ['29', '30'], RC, [{ kind: 'view' }]],
    ['proximal root caries on the odontogram alone (a film finding)', false, ['29', '30'], RC, [{ kind: 'odontogram' }], ['caries'], [], { full: true, mouth: { teeth: 28, involved: 2, lost: 0 }, modules: [{ m: 'missing', teeth: ['1', '16', '17', '32'] }].concat(RC) }],
    ['arrested proximal root caries on a film alone (a film can\'t tell it is arrested)', false, ['29', '30'], RCA, [{ kind: 'film' }]],
    ['arrested proximal root caries on a film, with the exam in a row', true, ['29', '30'], RCA, [{ kind: 'film' }], ['caries'], [['Exam', '#30\'s mesial root surface is dark, hard and shiny']]],
    ['a root tip on a periapical', true, ['13', '14', '15'], TIP, [{ kind: 'film' }], ['roottip']],
    ['a root tip on a bitewing alone (it stops short of the root)', false, ['13', '14', '15'], TIP, [{ kind: 'bitewing', teeth: ['13', '14', '15', '20', '19', '18'] }], ['roottip']],
    ['a root tip on the view alone (it is in the bone)', false, ['13', '14', '15'], TIP, [{ kind: 'view' }], ['roottip']],
    ['a retained root on the view, its stump above the receded gingiva', true, ['12', '13'], RET.concat([{ m: 'recession', teeth: ['12'], mm: 1 }]), [{ kind: 'view' }], ['roottip']],
    ['a retained root on the view alone, the gingiva over its stump', false, ['12', '13'], RET, [{ kind: 'view' }], ['roottip']],
    ['a retained root on a bitewing', true, ['12', '13'], RET, [{ kind: 'bitewing', teeth: ['12', '13', '14', '15', '21', '20', '19', '18'] }], ['roottip']],
    ['internal resorption on a periapical', true, ['8', '9'], [{ m: 'resorption', tooth: '9', type: 'internal', at: 'middle', size: 2.5 }], [{ kind: 'film' }], ['resorption']],
    ['internal resorption on the view alone', false, ['8', '9'], [{ m: 'resorption', tooth: '9', type: 'internal', at: 'middle', size: 2.5 }], [{ kind: 'view' }], ['resorption']],
    ['external cervical resorption on a bitewing (it reaches the cervix)', true, ['19', '20'], [{ m: 'resorption', tooth: '19', type: 'cervical', side: 'm', heithersay: 2 }], [{ kind: 'bitewing', teeth: ['14', '13', '19', '20'] }], ['resorption']],
    ['external apical resorption on a bitewing alone', false, ['19', '20'], [{ m: 'resorption', tooth: '19', type: 'apical', mm: 2 }], [{ kind: 'bitewing', teeth: ['14', '13', '19', '20'] }], ['resorption']],
    ['occlusal sealants on a film alone (no film shows one)', false, ['18', '19'], [{ m: 'sealant', teeth: ['18', '19'], surfaces: 'O' }], [{ kind: 'film' }], ['sealant']],
    ['occlusal sealants given in a row', true, ['18', '19'], [{ m: 'sealant', teeth: ['18', '19'], surfaces: 'O' }], [{ kind: 'film' }], ['sealant'], [['Exam', '#18 and #19 are sealed']]],
    ['a buccal pit sealant on the view', true, ['18', '19'], [{ m: 'sealant', teeth: ['19'], surfaces: 'B' }], [{ kind: 'view' }], ['sealant']],
    ['a cracked tooth with its bite test in the record\'s rows', true, ['18', '19'], CRACK, [{ kind: 'film' }], ['fracture'], [], { tests: [{ test: 'bite', tooth: '19', result: 'positive', cusp: 'DL', release: true }] }],
    ['a cracked tooth with no test and no odontogram', false, ['18', '19'], CRACK, [{ kind: 'film' }], ['fracture']],
    ['a temporary filling on a bitewing', true, ['19', '20'], [{ m: 'restoration', tooth: '20', surfaces: 'DO', material: 'temporary', temp: 'cavit' }], [{ kind: 'bitewing', teeth: ['14', '13', '19', '20'] }], ['resto']],
    // Patient Box v2.3 (2026-11-24): implants on modules (the box's row gives the delivery film's bone, or says there is none)
    ['peri-implantitis on the film and the chart, with the delivery film in the box', true, ['29', '30', '31'], PI, [{ kind: 'film' }, { kind: 'chart' }], ['impl']],
    ['peri-implantitis on the film alone (bleeding is a chart\'s finding)', false, ['29', '30', '31'], PI, [{ kind: 'film' }], ['impl']],
    ['peri-implantitis on the film, the bleeding in a row', true, ['29', '30', '31'], PI, [{ kind: 'film' }], ['impl'], [['Exam', '#30 bleeds and suppurates on probing']]],
    ['peri-implantitis on the chart alone (the bone is a film\'s)', false, ['29', '30', '31'], PI, [{ kind: 'chart' }], ['impl']],
    ['an implant with no earlier records on the film and the chart', true, ['29', '30', '31'], [{ m: 'implant', tooth: '30', state: 'peri-implantitis', baseline: false, bone: 5 }], [{ kind: 'film' }, { kind: 'chart' }], ['impl']],
    ['an implant under its cover screw on a film', true, ['13', '14', '15'], [{ m: 'implant', tooth: '14', state: 'healing', weeks: 6 }], [{ kind: 'film' }], ['impl']],
    ['an implant under its cover screw on the view alone (it is under the mucosa)', false, ['13', '14', '15'], [{ m: 'implant', tooth: '14', state: 'healing', weeks: 6 }], [{ kind: 'view' }], ['impl']],
    ['a failed implant on its film', true, ['9', '10', '11'], [{ m: 'implant', tooth: '10', state: 'failed', crown: 'pfm' }], [{ kind: 'film' }], ['impl']],
    ['an implant question on a case with no implant', false, ['28', '29', '30'], [], [{ kind: 'film' }, { kind: 'chart' }], ['impl']],
    ['an implant-supported bridge on a bitewing', true, ['18', '19', '20', '21'], [{ m: 'missing', teeth: ['20'] }, { m: 'implant', teeth: ['19', '21'], retention: 'screw' }, { m: 'bridge', abutments: ['19', '21'], material: 'pfm' }], [{ kind: 'bitewing', teeth: ['14', '13', '12', '21', '20', '19', '18'] }], ['resto']],
  ];
  // a record: [what, answerable, teeth, modules, figs, rests (caries by default), the question's own rows, more of the record]
  for (const [what, ok, teeth, modules, figs, rests, rows, extra] of recs) {
    const spec = Object.assign({ teeth, modules }, base, extra || {}), v = K.validate(spec);
    if (v.length) { bad++; console.error(`✗ the kit's rules: ${what}: the record itself fails validate(): ${v.join('; ')}`); continue; }
    const p = K.answerable(spec, figs, K.rows(spec).concat(rows || []), rests || ['caries']);
    if (ok !== !p.length) { bad++; console.error(`✗ the kit's rules: ${what} should ${ok ? 'be' : 'not be'} answerable` + (p.length ? ': ' + p.join('; ') : '')); }
  }
}
/* Patient Box v2.3 (2026-11-24): what derive() makes of an implant's numbers (the 2017 World Workshop's definitions, the lecture's
   failure rule; the sources are in widget/cases.js's header): each record must pass validate() and give its diagnosis */
{
  const { K } = load('var PCASES = {};');
  const base = { age: 55, sex: 'woman', smoke: 0, teeth: ['29', '30', '31'] };
  const dxs = [
    ['a healthy implant', [{ m: 'implant', tooth: '30', state: 'health' }], 'peri-implant health'],
    ['inflamed with the bone where it was at delivery', [{ m: 'implant', tooth: '30', state: 'mucositis' }], 'peri-implant mucositis'],
    ['inflamed with 3 mm lost since delivery', [{ m: 'implant', tooth: '30', state: 'peri-implantitis' }], 'peri-implantitis'],
    ['bone 1.8 mm below the platform at delivery and now: remodeling, not loss', [{ m: 'implant', tooth: '30', state: 'health', baseline: 1.8 }], 'peri-implant health'],
    ['more than half its length of bone lost, not mobile', [{ m: 'implant', tooth: '30', state: 'peri-implantitis', loss: 4.5 }], 'failed implant'],
    ['mobile with a radiolucent line round it', [{ m: 'implant', tooth: '30', state: 'failed' }], 'failed implant'],
    ['under its cover screw', [{ m: 'implant', tooth: '30', state: 'healing', weeks: 8 }], 'healing implant'],
    ['no earlier records, inflamed, bone 3.5 mm below the platform', [{ m: 'implant', tooth: '30', state: 'peri-implantitis', baseline: false, bone: 3.5 }], 'peri-implantitis'],
    ['no earlier records, inflamed, bone 2 mm below the platform and probing 5 mm', [{ m: 'implant', tooth: '30', state: 'mucositis', baseline: false, bone: 2 }], 'peri-implant mucositis'],
  ];
  for (const [what, modules, want] of dxs) {
    const spec = Object.assign({ modules }, base), v = K.validate(spec);
    if (v.length) { bad++; console.error(`✗ the kit's implant rules: ${what}: the record fails validate(): ${v.join('; ')}`); continue; }
    const got = K.derive(spec).impl['30'];
    if (!got || got.dx !== want) { bad++; console.error(`✗ the kit's implant rules: ${what} should be ${want}, derive() gives ${got ? got.dx : 'nothing'}`); }
  }
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
