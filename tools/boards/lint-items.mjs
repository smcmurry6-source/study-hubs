#!/usr/bin/env node
// Boards hub: code checks for question items and fact records (zero model tokens; PLAN_V2 item 9, BUILD_SPEC 4.7).
//
//   node tools/boards/lint-items.mjs                         every src/boards/units/*/items.js, plus the fact records
//   node tools/boards/lint-items.mjs docs/boards/bench/items.js   these item files only (+ facts)
//   node tools/boards/lint-items.mjs --unit perio            one unit
//   node tools/boards/lint-items.mjs --facts                 fact records only
//   node tools/boards/lint-items.mjs --json out.json         also write the findings as JSON
//   node tools/boards/lint-items.mjs --quiet                 errors only
//
// Item files are CommonJS: module.exports = { items: [...], cases: [...] } (BUILD_SPEC 4.4). Exit 1 on any error.
// Warnings are for the verifier and the author to look at; errors block the build.

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(import.meta.url);
const FACTS_DIR = path.join(ROOT, 'src/boards/facts');

const ENABLED_TYPES = ['mcq'];
const OV_KNOWN = { inbde: ['DoD2018/CG2026'], adex: ['DLM2026-27'] };
const REQUIRED = ['id', 'lec', 'type', 'stem', 'choices', 'answer', 'ex', 'why', 'refs', 'exam', 'ov', 'cc', 'fk', 'cog', 'diff', 'concept', 'sec', 'added'];
const UNITS = ['anat', 'physio', 'micro', 'gpath', 'opath', 'rad', 'perio', 'endo', 'oper', 'pros', 'ortho', 'peds', 'oms', 'anes', 'pharm', 'medcx', 'infect', 'prof', 'pubh'];
const BRITISH = /\b(colou?rs?|colour\w*|favour\w*|centre\w*|behaviour\w*|haem\w*|anaesth\w*|paediatric\w*|oesophag\w*|labelled|organis(e|ed|ing|ation)\w*|analys(e|ed|ing)|programme|licence|defence|tumour\w*|fibre\w*|litre\w*|metre\w*|grey|manoeuvre|orthopaedic\w*|ischaemi\w*|oedema|foetal|leukaemia|aetiology|practise[ds]?)\b/i;
const STEM_WORDS_MIN = 40, STEM_WORDS_MAX = 110;
const SOURCE_MAX_AGE_Y = 8;

// ---------- args ----------
const argv = process.argv.slice(2);
const opt = { files: [], unit: null, factsOnly: false, json: null, quiet: false };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--unit') opt.unit = argv[++i];
  else if (a === '--facts') opt.factsOnly = true;
  else if (a === '--json') opt.json = argv[++i];
  else if (a === '--quiet') opt.quiet = true;
  else if (a === '-h' || a === '--help') { console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 13).map(l => l.replace(/^\/\/ ?/, '')).join('\n')); process.exit(0); }
  else opt.files.push(a);
}

const findings = [];
const seen = new Set();
const add = (sev, id, check, msg) => { const k = sev + id + check + msg; if (!seen.has(k)) { seen.add(k); findings.push({ sev, id, check, msg }); } };
const err = (id, check, msg) => add('error', id, check, msg);
const warn = (id, check, msg) => add('warn', id, check, msg);

// ---------- facts ----------
function loadFacts() {
  const sources = JSON.parse(fs.readFileSync(path.join(FACTS_DIR, 'sources.json'), 'utf8'));
  const facts = new Map();
  for (const f of fs.readdirSync(FACTS_DIR).filter(f => f.endsWith('.json') && f !== 'sources.json').sort()) {
    const data = JSON.parse(fs.readFileSync(path.join(FACTS_DIR, f), 'utf8'));
    for (const fact of data.facts || []) {
      if (facts.has(fact.id)) err(fact.id, 'fact-dup', `fact id in both ${facts.get(fact.id)._file} and ${f}`);
      facts.set(fact.id, { ...fact, _file: f });
    }
  }
  return { sources, facts };
}

function lintFacts({ sources, facts }) {
  const STATUS = ['verified', 'partial', 'unverified', 'proposal', 'convention'], RISK = ['low', 'medium', 'high'];
  for (const [k, s] of Object.entries(sources)) {
    for (const f of ['title', 'url', 'kind']) if (!s[f]) err('src:' + k, 'source-schema', `missing ${f}`);
    if (s.url && !/^https:\/\//.test(s.url)) err('src:' + k, 'source-schema', 'url must be https');
    if (!s.date) warn('src:' + k, 'source-date', 'no date (publication, last update or label effective date)');
    else if (/^\d{4}/.test(s.date) && +s.date.slice(0, 4) < new Date().getFullYear() - SOURCE_MAX_AGE_Y) warn('src:' + k, 'source-date', `source dated ${s.date}: check it is still current`);
  }
  for (const f of facts.values()) {
    if (!/^[A-Z]{2,4}-\d+$/.test(f.id)) err(f.id, 'fact-schema', 'id must look like IE-5');
    if (!STATUS.includes(f.status)) err(f.id, 'fact-schema', 'status must be one of ' + STATUS.join('/'));
    if (!RISK.includes(f.risk)) err(f.id, 'fact-schema', 'risk must be low/medium/high');
    if (!f.claim || f.claim.length < 15) err(f.id, 'fact-schema', 'claim missing or too short');
    if (/UNVERIFIED|\|---/.test(f.claim || '')) err(f.id, 'fact-schema', 'claim carries UNVERIFIED text or a markdown table: move it to conditions/data');
    if (!Array.isArray(f.units) || !f.units.length || f.units.some(u => !UNITS.includes(u))) err(f.id, 'fact-schema', 'units must be unit ids');
    if (!Array.isArray(f.cites)) { err(f.id, 'fact-schema', 'cites must be an array'); continue; }
    if (f.status === 'verified' && !f.cites.some(c => c.quote)) err(f.id, 'fact-quote', 'verified fact with no checked quote');
    if (f.status === 'partial' && !f.conditions) err(f.id, 'fact-schema', 'partial fact must say in conditions what is not verified');
    for (const c of f.cites) {
      if (!sources[c.src]) err(f.id, 'fact-source', `unknown source ${c.src}`);
      else if (c.quote == null && !sources[c.src].blocked) warn(f.id, 'fact-quote', `cite of ${c.src} has no quote`);
      if (c.quote && c.quote.split(/\s+/).length > 70) warn(f.id, 'fact-quote', `quote from ${c.src} is ${c.quote.split(/\s+/).length} words; keep quotes short`);
    }
    for (const s of f.see || []) if (!facts.has(s)) err(f.id, 'fact-see', `see ${s}: no such fact`);
    if (f.stem_names !== undefined && (!Array.isArray(f.stem_names) || !f.stem_names.length)) err(f.id, 'fact-schema', 'stem_names must be a non-empty array of names');
  }
}

// ---------- items ----------
const words = s => String(s || '').toLowerCase().replace(/[^a-z0-9%./ -]+/g, ' ').split(/\s+/).filter(Boolean);
const textOf = it => [it.stem, ...(it.choices || [])].join(' ');
const boxText = b => b ? [b.patient, b.cc, ...(b.hx || []), ...(b.findings || [])].join(' ') : '';
const num = s => { const m = String(s).replace(/,/g, '').match(/-?\d+(\.\d+)?/); return m ? +m[0] : NaN; };

function shingles(s, n = 8) {
  const w = words(s), out = new Set();
  for (let i = 0; i + n <= w.length; i++) out.add(w.slice(i, i + n).join(' '));
  return out;
}

function evalCalc(expr, facts) {
  if (!/^[\sA-Za-z0-9_.+\-*/()[\]'",<>=?:%]+$/.test(expr)) throw new Error('calc uses characters outside the whitelist');
  const F = {};
  for (const [id, f] of facts) if (f.data) F[id] = f.data;
  const { floor, ceil, round, min, max, abs } = Math;
  return Function('F', 'floor', 'ceil', 'round', 'min', 'max', 'abs', `"use strict"; return (${expr});`)(F, floor, ceil, round, min, max, abs);
}

function lintItems(files, { facts, sources }) {
  const all = [], cases = [], byFile = {};
  for (const file of files) {
    const abs = path.resolve(file);
    delete require.cache[abs];
    let mod;
    try { mod = require(abs); } catch (e) { err(file, 'load', e.message); continue; }
    for (const it of mod.items || []) { all.push({ ...it, _file: file }); }
    for (const c of mod.cases || []) cases.push({ ...c, _file: file });
    byFile[file] = (mod.items || []).length;
  }
  const items = opt.unit ? all.filter(i => i.lec === opt.unit || (i.case && cases.find(c => c.id === i.case && (c.units || []).includes(opt.unit)))) : all;
  const ids = new Map(), stems = new Map();
  const factShingles = new Map();
  for (const f of facts.values()) for (const c of f.cites || []) if (c.quote) for (const sh of shingles(c.quote)) factShingles.set(sh, f.id);

  for (const it of items) {
    const id = it.id || '(no id)';
    // 1 required fields and ids
    for (const f of REQUIRED) if (it[f] === undefined || it[f] === null || it[f] === '') err(id, 'required', `missing ${f}`);
    if (ids.has(id)) err(id, 'dup-id', `duplicate id (also in ${ids.get(id)})`); ids.set(id, it._file);
    if (it.lec && !UNITS.includes(it.lec)) err(id, 'lec', `lec ${it.lec} is not a unit`);
    if (it.id && it.lec && !new RegExp(`^b-${it.lec}-\\d{4}$`).test(it.id)) err(id, 'id-format', `id must be b-${it.lec}-NNNN`);
    if (it.type && !ENABLED_TYPES.includes(it.type)) err(id, 'type', `type ${it.type} not enabled (${ENABLED_TYPES.join(', ')})`);
    const ch = it.choices || [];
    // 2 options
    if ((it.exam || []).includes('inbde') && it.type === 'mcq' && (ch.length < 3 || ch.length > 5)) err(id, 'choices', `INBDE items have 3-5 options (has ${ch.length})`);
    if (!(Number.isInteger(it.answer) && it.answer >= 0 && it.answer < ch.length)) err(id, 'answer', 'answer index out of range');
    for (const c of ch) if (/\b(all|none) of the above\b|\bboth [a-d] and [a-d]\b/i.test(c)) err(id, 'forbidden-option', `"${c}"`);
    const normCh = ch.map(c => words(c).join(' '));
    if (new Set(normCh).size !== normCh.length) err(id, 'dup-option', 'two options are the same');
    if (/select all|all that apply|choose (two|three)/i.test(it.stem || '')) err(id, 'forbidden-format', 'select-all wording in an INBDE single-best-answer item');
    // 3 why lines
    const why = it.why || [];
    if (why.length !== ch.length || why.some(w => !String(w || '').trim())) err(id, 'why', `why[] needs one non-empty line per option (${why.length} for ${ch.length})`);
    if (Number.isInteger(it.answer) && why[it.answer] && !/^Correct\./.test(why[it.answer])) err(id, 'why', 'why[answer] must start with "Correct."');
    why.forEach((w, i) => { if (i !== it.answer && /^Correct\b/i.test(w || '')) err(id, 'why', `why[${i}] starts with "Correct" but is not the key`); });
    // 4 negatives
    const neg = /\b(EXCEPT|NOT|LEAST)\b/.test(it.stem || '');
    if (neg && !it.fmt) err(id, 'fmt', 'stem has EXCEPT/NOT/LEAST in capitals but fmt is not set');
    if (!neg && it.fmt) err(id, 'fmt', `fmt ${it.fmt} set but the stem has no capitalized EXCEPT/NOT/LEAST`);
    if (/\b(except|not|least)\b/.test(it.stem || '') && /which|what/i.test(it.stem || '') && !neg && /\bnot\b.*\?$/.test(it.stem || '')) warn(id, 'fmt', 'lowercase negative in the question: capitalize it and set fmt, or reword');
    // 5 cue
    if ((it.diff === 3 || it.cog === 3) && !it.cue) err(id, 'cue', 'cue required when diff or cog is 3');
    // 6 refs
    const refs = it.refs || [];
    if (!refs.length) err(id, 'refs', 'at least one ref');
    let risk = 'low';
    for (const r of refs) {
      if (/^https?:/.test(r)) { if (!/^https:\/\//.test(r)) err(id, 'refs', `URL refs must be https: ${r}`); continue; }
      const f = facts.get(r);
      if (!f) { err(id, 'refs', `fact ${r} does not exist`); continue; }
      if (f.status === 'unverified') err(id, 'refs', `fact ${r} is unverified: it cannot support an item`);
      if (f.status === 'proposal' || f.status === 'convention') warn(id, 'refs', `fact ${r} is a ${f.status}: make sure the key does not rest on it`);
      if (f.status === 'partial') warn(id, 'refs', `fact ${r} is partial: ${String(f.conditions || '').slice(0, 140)}`);
      if (!f.cites.some(c => c.quote)) warn(id, 'refs', `fact ${r} has no checked quote yet`);
      if (f.stem_names && !f.stem_names.some(n => new RegExp('\\b' + n + '\\b', 'i').test(it.stem || ''))) err(id, 'stem-names', `fact ${r} needs the stem to name its source (${f.stem_names.join(' / ')}): other sources give different numbers`);
      if (f.risk === 'high' || (f.risk === 'medium' && risk === 'low')) risk = f.risk;
      for (const c of f.cites) { const s = sources[c.src]; if (s && s.date && +s.date.slice(0, 4) < new Date().getFullYear() - SOURCE_MAX_AGE_Y) warn(id, 'source-date', `${r} rests on ${c.src} dated ${s.date}`); }
    }
    it._risk = risk;
    // 7 outline versions
    for (const ex of it.exam || []) {
      if (!it.ov || !it.ov[ex]) err(id, 'ov', `no outline version for ${ex}`);
      else if (OV_KNOWN[ex] && !OV_KNOWN[ex].includes(it.ov[ex])) warn(id, 'ov', `unknown ${ex} outline version ${it.ov[ex]}`);
    }
    // 8 style
    const box = it.case ? (cases.find(c => c.id === it.case) || {}).box : it.pbox;
    const all8 = [it.stem, ...ch, it.ex, ...why, it.cue, boxText(box)].join(' \n ');
    if (/#\d{1,2}\b/.test(all8)) err(id, 'style', 'tooth numbers are written "tooth 30", never "#30"');
    if (/\bthis patient\b/i.test(it.stem || '')) err(id, 'style', 'no "this patient" in a stem');
    if (/\bfilms?\b/i.test(all8)) err(id, 'style', 'radiographs are never called "film"');
    const br = all8.match(BRITISH); if (br) err(id, 'style', `British spelling "${br[0]}" (American English everywhere)`);
    if (it.pbox) checkBox(id, it.pbox);
    if (it.case && it.pbox) err(id, 'case', 'a case item uses the case box, not its own pbox');
    // length
    const n = words(boxText(box) + ' ' + textOf(it)).length;
    if (!it.case && (n < STEM_WORDS_MIN || n > STEM_WORDS_MAX)) warn(id, 'length', `${n} words with box, stem and options (aim for ${STEM_WORDS_MIN}-${STEM_WORDS_MAX})`);
    if (it.case && words(textOf(it)).length > STEM_WORDS_MAX) warn(id, 'length', `${words(textOf(it)).length} words in stem and options`);
    // length cue (per item)
    if (ch.length >= 3 && Number.isInteger(it.answer)) {
      const L = ch.map(c => c.length), others = L.filter((_, i) => i !== it.answer), mean = others.reduce((a, b) => a + b, 0) / others.length;
      if (L[it.answer] > 1.4 * mean && L[it.answer] - mean > 12) warn(id, 'length-cue', `key is ${Math.round(100 * L[it.answer] / mean)}% of the mean distractor length`);
    }
    // absolutes only in distractors
    const ABS = /\b(always|never|all|none|only|must|cannot)\b/i;
    if (Number.isInteger(it.answer) && !ABS.test(ch[it.answer] || '') && ch.filter((c, i) => i !== it.answer && ABS.test(c)).length >= 2) warn(id, 'absolutes', 'absolute words ("always", "never", "only"...) appear only in distractors');
    // hedged key among categorical distractors (benchmark run 1: a key that alone says "is linked to")
    const HEDGE = /\b(may|might|can|could|usually|often|generally|typically|linked|associated|suggest\w*|likely|about|consider\w*)\b/i;
    const CATEG = /\b(no|not|never|none|always|only|all|must|cannot|any|every)\b/i;
    if (Number.isInteger(it.answer) && ch.length >= 3 && HEDGE.test(ch[it.answer]) && !CATEG.test(ch[it.answer]) &&
        ch.filter((c, i) => i !== it.answer && CATEG.test(c) && !HEDGE.test(c)).length >= ch.length - 2) warn(id, 'hedging', 'only the key is hedged; the distractors are categorical claims');
    // stem words echoed only by the key
    if (Number.isInteger(it.answer) && ch.length >= 3) {
      const stemW = new Set(words(it.stem).filter(w => w.length > 5));
      const hits = ch.map(c => words(c).filter(w => stemW.has(w)).length);
      if (hits[it.answer] >= 2 && hits.every((h, i) => i === it.answer || h === 0)) warn(id, 'echo', 'only the key repeats words from the stem');
    }
    // duplicates across items
    const sk = words(it.stem).join(' ') + '|' + normCh.slice().sort().join('|');
    if (stems.has(sk)) err(id, 'dup-item', `same stem and options as ${stems.get(sk)}`); stems.set(sk, id);
    // calculation recomputed from fact data
    if (it.calc) {
      try {
        const v = evalCalc(it.calc, facts), k = num(ch[it.answer]);
        if (!(Math.abs(v - k) < 1e-9)) err(id, 'calc', `calc ${it.calc} = ${v}, but the key says ${ch[it.answer]}`);
        const same = ch.filter((c, i) => i !== it.answer && Math.abs(num(c) - v) < 1e-9);
        if (same.length) err(id, 'calc', `a distractor also equals the computed value ${v}`);
      } catch (e) { err(id, 'calc', e.message); }
    }
    // copy guard: 8 consecutive words shared with a fact quote
    for (const sh of shingles([it.stem, ...ch, it.ex, ...why].join(' '))) if (factShingles.has(sh)) { warn(id, 'copy', `8+ words shared with the quote in ${factShingles.get(sh)}: "${sh}"`); break; }
    // sec (notes) — checked once notes exist
    const notesDir = path.join(ROOT, 'src/boards/units', it.lec || '_', 'notes.core.html');
    if (fs.existsSync(notesDir) && it.sec && !fs.readFileSync(notesDir, 'utf8').includes(`id="${it.sec}"`)) err(id, 'sec', `section ${it.sec} not in ${it.lec} notes`);
  }

  // copy guard between items
  const itemSh = new Map();
  for (const it of items) for (const sh of shingles([it.stem, ...(it.choices || [])].join(' '))) {
    if (itemSh.has(sh) && itemSh.get(sh) !== it.id) { warn(it.id, 'copy', `8+ words shared with item ${itemSh.get(sh)}: "${sh}"`); break; }
    itemSh.set(sh, it.id);
  }

  // cases
  const used = new Map();
  for (const c of cases) {
    const id = c.id || '(case)';
    if (!/^c-[a-z]+-\d{4}$/.test(id)) err(id, 'case', 'case id must be c-<unit>-NNNN');
    checkBox(id, c.box);
    const list = c.items || [];
    if (list.length < 2 || list.length > 6) err(id, 'case', `cases have 2-6 items (has ${list.length})`);
    list.forEach((iid, k) => {
      const it = all.find(x => x.id === iid);
      if (!it) { err(id, 'case', `item ${iid} not found`); return; }
      if (it.case !== c.id) err(id, 'case', `item ${iid} does not point back (case: ${it.case})`);
      if (used.has(iid)) err(id, 'case', `item ${iid} is also in case ${used.get(iid)}`); used.set(iid, id);
      if (k === 0 && it.fmt) err(iid, 'case', 'no negative in the first item of a case');
      // leakage: an earlier item reveals a later item's key
      for (const prev of list.slice(0, k)) {
        const p = all.find(x => x.id === prev); if (!p) continue;
        const key = (it.choices || [])[it.answer];
        if (key && key.length > 12 && [p.stem, p.ex, ...(p.why || [])].join(' ').toLowerCase().includes(key.toLowerCase())) warn(iid, 'leak', `earlier item ${prev} contains this item's key text`);
      }
    });
    if (c.exam && !c.exam.length) err(id, 'case', 'exam tags empty');
  }
  for (const it of items) if (it.case && !cases.find(c => c.id === it.case)) err(it.id, 'case', `case ${it.case} not found`);

  // per-unit balance
  const byUnit = {};
  for (const it of items) (byUnit[it.lec] ||= []).push(it);
  for (const [u, list] of Object.entries(byUnit)) {
    const mcq = list.filter(i => i.type === 'mcq' && (i.choices || []).length >= 3);
    const longest = mcq.filter(i => { const L = i.choices.map(c => c.length); return L[i.answer] > Math.max(...L.filter((_, k) => k !== i.answer)); }).length;
    if (mcq.length >= 5 && longest / mcq.length > 0.35) err('unit:' + u, 'longest-key', `key strictly longest in ${longest} of ${mcq.length} (${Math.round(100 * longest / mcq.length)}%; limit 35%)`);
    const free = mcq.filter(i => !i.fixed), pos = {};
    for (const i of free) pos[i.answer] = (pos[i.answer] || 0) + 1;
    for (const [p, n] of Object.entries(pos)) if (free.length >= 8 && n / free.length > 0.4) warn('unit:' + u, 'key-position', `authored key at index ${p} in ${n} of ${free.length} shuffled items`);
    const negs = list.filter(i => i.fmt).length;
    if (list.length >= 10 && (negs / list.length < 0.1 || negs / list.length > 0.2)) warn('unit:' + u, 'negatives', `${negs} of ${list.length} negative items (aim for 10-20%)`);
  }
  return { items, cases, byFile };
}

function checkBox(id, b) {
  if (!b) return;
  if (!b.patient || !String(b.patient).trim()) err(id, 'box', 'box needs a patient line');
  if (!b.cc || !/["“]/.test(b.cc)) err(id, 'box', 'chief complaint must be in the patient\'s own words, in quotes');
  for (const k of Object.keys(b)) if (!['patient', 'cc', 'hx', 'findings'].includes(k)) err(id, 'box', `unknown box part ${k}`);
  if ((b.hx || []).length + (b.findings || []).length < 3) warn(id, 'box', 'thin box: realistic irrelevant data is required (a box with only what the key needs gives it away)');
}

// ---------- main ----------
const factsDb = loadFacts();
lintFacts(factsDb);
let res = { items: [], cases: [] };
if (!opt.factsOnly) {
  let files = opt.files;
  if (!files.length) {
    const ud = path.join(ROOT, 'src/boards/units');
    files = fs.existsSync(ud) ? fs.readdirSync(ud).map(u => path.join(ud, u, 'items.js')).filter(f => fs.existsSync(f)) : [];
  }
  res = lintItems(files, factsDb);
}
const errors = findings.filter(f => f.sev === 'error'), warns = findings.filter(f => f.sev === 'warn');
for (const f of opt.quiet ? errors : findings) console.log(`${f.sev === 'error' ? 'ERROR' : 'warn '} ${f.id.padEnd(16)} [${f.check}] ${f.msg}`);
const tiers = {}; for (const it of res.items) tiers[it._risk] = (tiers[it._risk] || 0) + 1;
console.log(`\n${factsDb.facts.size} facts, ${res.items.length} items, ${res.cases.length} cases: ${errors.length} errors, ${warns.length} warnings` +
  (res.items.length ? `; risk tiers (from cited facts): ${Object.entries(tiers).map(([k, v]) => `${k} ${v}`).join(', ')}` : ''));
if (opt.json) fs.writeFileSync(opt.json, JSON.stringify({ when: new Date().toISOString(), findings, risk: Object.fromEntries(res.items.map(i => [i.id, i._risk])) }, null, 1));
if (errors.length) process.exitCode = 1;
