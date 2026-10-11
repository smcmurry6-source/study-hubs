#!/usr/bin/env node
// Boards hub: verifier benchmark (PLAN_V2 item 8). Builds seeded-error copies of benchmark items, splits clean and
// seeded versions into two batches so no checker sees both versions of one item, and scores the checker's verdicts.
//
//   node tools/boards/bench.mjs build --items docs/boards/bench/items.js --seeds docs/boards/bench/seeds.js --out <dir> [--rng 7]
//       writes <dir>/batch-A.md, batch-B.md (what the checker reads), key.json (never shown to the checker)
//   node tools/boards/bench.mjs render --items <file> --ids b-x-0001,b-y-0002 --out <dir> [--rng 7] [--name recheck]
//       one batch of clean items (their whole case set comes along), for re-checking repaired items (stage 4b)
//   node tools/boards/bench.mjs score --out <dir> [--label sonnet]
//       reads <dir>/verdicts-A.json, verdicts-B.json, key.json and adjudication.json (optional: the author's call on
//       each flag: {"Q07": {"caught": true} } for seeded items, {"Q03": {"real": true, "note": "..."}} for clean ones)
//
// A seed is { id, type, note, replace: [[from, to]], answer: <option text>, why: {<option text>: <line>}, raw, dropCalc }.
// `replace` edits every text field of the item (and an exact option when `raw` and the from-text is wrapped in '').

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(import.meta.url);
const [cmd, ...rest] = process.argv.slice(2);
const opt = {}; for (let i = 0; i < rest.length; i += 2) opt[rest[i].replace(/^--/, '')] = rest[i + 1];

function rng(seed) { let s = +seed || 7; return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296); }
function shuffle(a, r) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function applySeed(it, seed) {
  const x = JSON.parse(JSON.stringify(it));
  for (const [from, to] of seed.replace || []) {
    let hits = 0;
    if (seed.raw && /^'.*'$/.test(from)) {
      const a = from.slice(1, -1), b = to.slice(1, -1);
      x.choices = x.choices.map(c => (c === a ? (hits++, b) : c));
    } else {
      const ed = s => { if (typeof s !== 'string' || !s.includes(from)) return s; hits++; return s.split(from).join(to); };
      for (const k of ['stem', 'ex', 'cue']) x[k] = ed(x[k]);
      x.choices = x.choices.map(ed); x.why = x.why.map(ed);
      if (x.pbox) { x.pbox.patient = ed(x.pbox.patient); x.pbox.cc = ed(x.pbox.cc); x.pbox.hx = (x.pbox.hx || []).map(ed); x.pbox.findings = (x.pbox.findings || []).map(ed); }
    }
    if (!hits) throw new Error(`${seed.id}: "${from.slice(0, 50)}" matched nothing`);
  }
  if (seed.answer) { const k = x.choices.indexOf(seed.answer); if (k < 0) throw new Error(`${seed.id}: answer text not found`); x.answer = k; }
  for (const [txt, line] of Object.entries(seed.why || {})) { const k = x.choices.indexOf(txt); if (k < 0) throw new Error(`${seed.id}: why option not found: ${txt}`); x.why[k] = line; }
  if (seed.dropCalc) delete x.calc;
  if (!/^Correct\./.test(x.why[x.answer])) throw new Error(`${seed.id}: seeded key's why line must still start with "Correct."`);
  return x;
}

function factBundle(refs, facts, sources) {
  return refs.filter(r => facts.has(r)).map(r => {
    const f = facts.get(r);
    return { id: r, status: f.status, claim: f.claim, conditions: f.conditions,
      quotes: f.cites.filter(c => c.quote).map(c => `${sources[c.src] ? sources[c.src].title : c.src} (${c.loc}): "${c.quote}"`) };
  });
}

function boxMd(b) {
  if (!b) return '';
  return `**Patient:** ${b.patient}\n**Chief Complaint:** ${b.cc}\n**Background and/or Patient History:**\n${(b.hx || []).map(h => '- ' + h).join('\n')}\n**Current Findings:**\n${(b.findings || []).map(h => '- ' + h).join('\n')}\n`;
}

function itemMd(q, qid, r, facts, sources) {
  const L = 'ABCDE';
  let order = q.choices.map((_, i) => i);
  if (!q.fixed) shuffle(order, r);
  const key = order.indexOf(q.answer);
  let s = `### ${qid}\n\n${q.pbox ? boxMd(q.pbox) + '\n' : ''}**Stem:** ${q.stem}\n\n${order.map((k, i) => `${L[i]}. ${q.choices[k]}`).join('\n')}\n\n` +
    `**Keyed answer:** ${L[key]}\n\n**Explanation:** ${q.ex}\n\n**Why each option:**\n${order.map((k, i) => `- ${L[i]}: ${q.why[k]}`).join('\n')}\n\n` +
    (q.cue ? `**Memory cue:** ${q.cue}\n\n` : '') +
    `**Tags:** cc ${q.cc}${q.cc2 ? ' (+' + q.cc2.join(', ') + ')' : ''}; fk ${q.fk}${q.fk2 ? ' (+' + q.fk2.join(', ') + ')' : ''}; cognitive level ${q.cog}; difficulty ${q.diff}; phase ${q.phase || '-'}\n\n` +
    `**Cited facts:**\n` + factBundle(q.refs, facts, sources).map(f => `- ${f.id} [${f.status}]: ${f.claim}${f.conditions ? ' (Conditions: ' + f.conditions + ')' : ''}\n${f.quotes.map(x => '  - ' + x).join('\n')}`).join('\n') + '\n';
  return { md: s, keyLetter: L[key] };
}

function build() {
  const { items, cases } = require(path.resolve(opt.items));
  const seeds = require(path.resolve(opt.seeds));
  const out = path.resolve(opt.out); fs.mkdirSync(out, { recursive: true });
  const r = rng(opt.rng);
  // facts
  const FD = path.join(ROOT, 'src/boards/facts'), sources = JSON.parse(fs.readFileSync(path.join(FD, 'sources.json'), 'utf8')), facts = new Map();
  for (const f of fs.readdirSync(FD).filter(f => f.endsWith('.json') && f !== 'sources.json')) for (const x of JSON.parse(fs.readFileSync(path.join(FD, f), 'utf8')).facts) facts.set(x.id, x);
  const seedOf = Object.fromEntries(seeds.map(s => [s.id, s]));
  for (const it of items) if (!seedOf[it.id]) throw new Error('no seed for ' + it.id);
  const seeded = Object.fromEntries(items.map(it => [it.id, applySeed(it, seedOf[it.id])]));
  const stand = items.filter(i => !i.case), half = Math.ceil(stand.length / 2);
  const firstHalf = new Set(stand.slice(0, half).map(i => i.id));
  const key = {};
  for (const batch of ['A', 'B']) {
    // A: clean first half + seeded second half + clean cases; B: the opposite
    const pick = it => (batch === 'A') === (it.case ? true : firstHalf.has(it.id)) ? { q: it, seeded: false } : { q: seeded[it.id], seeded: true };
    const blocks = shuffle([...stand.map(it => [pick(it)]), ...cases.map(c => c.items.map(id => pick(items.find(i => i.id === id))))], r);
    let n = 0, md = `# Batch ${batch}\n\n`;
    for (const block of blocks) {
      const c = block[0].q.case && cases.find(x => x.id === block[0].q.case);
      if (c) md += `## Case set ${batch}-CASE (the items below share this patient box)\n\n${boxMd(c.box)}\n`;
      for (const { q, seeded: sd } of block) {
        const qid = `${batch}${String(++n).padStart(2, '0')}`;
        const { md: m, keyLetter } = itemMd(q, qid, r, facts, sources);
        md += m + '\n';
        key[qid] = { item: q.id, bench: q.bench, seeded: sd, type: sd ? seedOf[q.id].type : null, note: sd ? seedOf[q.id].note : null, keyLetter, inCase: !!c };
      }
    }
    fs.writeFileSync(path.join(out, `batch-${batch}.md`), md);
  }
  fs.writeFileSync(path.join(out, 'key.json'), JSON.stringify(key, null, 1));
  console.log(`wrote ${out}/batch-A.md, batch-B.md (${Object.keys(key).length} items, ${Object.values(key).filter(k => k.seeded).length} seeded) and key.json`);
}

function loadFacts() {
  const FD = path.join(ROOT, 'src/boards/facts'), sources = JSON.parse(fs.readFileSync(path.join(FD, 'sources.json'), 'utf8')), facts = new Map();
  for (const f of fs.readdirSync(FD).filter(f => f.endsWith('.json') && f !== 'sources.json')) for (const x of JSON.parse(fs.readFileSync(path.join(FD, f), 'utf8')).facts) facts.set(x.id, x);
  return { facts, sources };
}

function render() {
  const { items, cases } = require(path.resolve(opt.items)), { facts, sources } = loadFacts();
  const want = new Set(String(opt.ids || '').split(',').filter(Boolean)), r = rng(opt.rng), name = opt.name || 'recheck';
  const out = path.resolve(opt.out); fs.mkdirSync(out, { recursive: true });
  const blocks = [], done = new Set();
  for (const it of items) {
    if (!want.size ? false : !want.has(it.id) || done.has(it.id)) continue;
    const c = it.case && cases.find(x => x.id === it.case);
    const block = c ? c.items.map(id => items.find(i => i.id === id)) : [it];
    block.forEach(b => done.add(b.id)); blocks.push(block);
  }
  shuffle(blocks, r);
  let n = 0, md = `# Batch ${name}\n\n`; const key = {};
  for (const block of blocks) {
    const c = block[0].case && cases.find(x => x.id === block[0].case);
    if (c) md += `## Case set (the items below share this patient box)\n\n${boxMd(c.box)}\n`;
    for (const q of block) {
      const qid = `R${String(++n).padStart(2, '0')}`, { md: m, keyLetter } = itemMd(q, qid, r, facts, sources);
      md += m + '\n'; key[qid] = { item: q.id, seeded: false, keyLetter, inCase: !!c, changed: want.has(q.id) };
    }
  }
  fs.writeFileSync(path.join(out, `batch-${name}.md`), md); fs.writeFileSync(path.join(out, `key-${name}.json`), JSON.stringify(key, null, 1));
  console.log(`wrote ${out}/batch-${name}.md (${n} items) and key-${name}.json`);
}

function score() {
  const out = path.resolve(opt.out), key = JSON.parse(fs.readFileSync(path.join(out, 'key.json'), 'utf8'));
  const adj = fs.existsSync(path.join(out, 'adjudication.json')) ? JSON.parse(fs.readFileSync(path.join(out, 'adjudication.json'), 'utf8')) : {};
  const v = {};
  for (const b of ['A', 'B']) { const f = path.join(out, `verdicts-${b}.json`); if (fs.existsSync(f)) for (const x of JSON.parse(fs.readFileSync(f, 'utf8'))) v[x.id] = x; }
  const rows = [], byType = {};
  let seededN = 0, flagged = 0, caught = 0, cleanN = 0, cleanPass = 0, falseAlarm = 0, realDefects = 0;
  for (const [qid, k] of Object.entries(key)) {
    const x = v[qid]; if (!x) { rows.push(`${qid} ${k.item} MISSING VERDICT`); continue; }
    const flag = x.verdict !== 'pass', a = adj[qid] || {};
    if (k.seeded) {
      seededN++; if (flag) flagged++;
      const ok = flag && a.caught !== false && (a.caught === true || a.caught === undefined);
      if (ok) caught++;
      (byType[k.type] ||= { n: 0, caught: 0 }).n++; if (ok) byType[k.type].caught++;
    } else {
      cleanN++; if (!flag) cleanPass++;
      if (flag) { if (a.real) realDefects++; else falseAlarm++; }
    }
    rows.push(`${qid} ${k.item.padEnd(13)} ${k.seeded ? ('SEEDED ' + k.type).padEnd(33) : 'clean'.padEnd(33)} -> ${x.verdict.padEnd(6)} ${(x.issues || []).map(i => i.check).join(',')}${a.note ? '  [' + a.note + ']' : ''}`);
  }
  console.log(rows.join('\n'));
  const pct = (a, b) => (b ? Math.round((100 * a) / b) + '%' : '-');
  console.log(`\n${opt.label || 'checker'}: seeded ${seededN}, flagged ${flagged} (${pct(flagged, seededN)}), caught the planted defect ${caught} (${pct(caught, seededN)})`);
  console.log(`clean ${cleanN}: passed ${cleanPass} (first-pass acceptance ${pct(cleanPass, cleanN)}); flagged ${cleanN - cleanPass} = ${realDefects} real defects + ${falseAlarm} false alarms (false-alarm rate ${pct(falseAlarm, cleanN)})`);
  console.log('by defect type: ' + Object.entries(byType).map(([t, s]) => `${t} ${s.caught}/${s.n}`).join('; '));
}

if (cmd === 'build') build(); else if (cmd === 'render') render(); else if (cmd === 'score') score();
else { console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 14).map(l => l.replace(/^\/\/ ?/, '')).join('\n')); process.exit(cmd ? 2 : 0); }
