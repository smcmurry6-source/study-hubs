#!/usr/bin/env node
// Boards hub converter (docs/boards/ENGINE_PLAN.md section 4): src/boards/ -> hubs/boards/content/, the hub's content for
// the engine (widget/hub.js), plus hubs/boards/game/<bundle>.js for Chairside's bundles once src/boards/game/ has them.
// Dependency-free Node 22; works with Windows paths and CRLF checkouts.
//
//   node tools/build-boards.js                    validate, then write hubs/boards/content/ (core, questions, notes,
//                                                 study and facts .json), laid out by tools/hub-next/build.mjs
//   node tools/build-boards.js --check            build both steps in memory, compare with the committed files (CI); exit 1 if stale
//   node tools/build-boards.js --report           also print the blueprint report (FK x CC, case share, cue/negative/longest-key rates)
//   node tools/build-boards.js --unit medcx       validate one unit and print its counts (writes nothing)
//   node tools/build-boards.js --include-drafts --out <dir>
//                                                 local preview: also publish unchecked items and preview units, into
//                                                 <dir>/content/ (never into hubs/boards/)
//   node tools/build-boards.js --quiet            errors only (no warnings)
//   --units-dir <dir>   build from another units folder (test fixtures; needs --out); every unit in it, ordered by unit.num
//   --out <dir>         write the content to <dir>/content/ and game bundles to <dir>/game/ instead of hubs/boards/
//
// hubs/boards/content/ is generated: edit src/boards/ and rebuild, never the JSON. A merge conflict in it is resolved in
// the sources, then by rebuilding. hubs/boards/index.html is the hand-written settings page (SH_HUB).
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { pathToFileURL } = require('url');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src', 'boards');
const lint = require('./boards/lint-core.cjs');

// ---------- args ----------
function parseArgs(argv) {
  const o = { check: false, report: false, unit: null, drafts: false, quiet: false, unitsDir: null, out: null };
  const val = (i, what) => {
    const v = argv[i + 1];
    if (v == null || v.startsWith('--')) { console.error(`${argv[i]} needs ${what} (try --help)`); process.exit(2); }
    return v;
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--check') o.check = true;
    else if (a === '--report') o.report = true;
    else if (a === '--unit') o.unit = val(i++, 'a unit id');
    else if (a === '--include-drafts') o.drafts = true;
    else if (a === '--quiet') o.quiet = true;
    else if (a === '--units-dir') o.unitsDir = path.resolve(val(i++, 'a folder'));
    else if (a === '--out') o.out = path.resolve(val(i++, 'a folder'));
    else if (a === '-h' || a === '--help') o.help = true;
    else { console.error(`Unknown argument ${a} (try --help)`); process.exit(2); }
  }
  return o;
}

// ---------- small helpers ----------
const rel = p => { const r = path.relative(ROOT, p); return r.startsWith('..') || path.isAbsolute(r) ? p : r.split(path.sep).join('/'); };
const readText = p => fs.readFileSync(p, 'utf8').replace(/^﻿/, '').replace(/\r\n?/g, '\n');
const exists = p => fs.existsSync(p);
const kb = n => (n / 1024).toFixed(1) + ' KB';
const pick = (o, keys) => { const r = {}; for (const k of keys) if (o[k] !== undefined && o[k] !== null) r[k] = o[k]; return r; };
const stripTags = h => String(h).replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
function freshRequire(p) { const abs = path.resolve(p); delete require.cache[abs]; return require(abs); }

// Fields that go into questions.json and core.json's cases, in this order (stable output). The engine doesn't read every
// one of them yet (refs, sec, exam, fixed, pin, the blueprint fields: ENGINE_PLAN section 2); `checked`, `bench`, a
// case's `beats` and authoring notes stay in the sources.
const ITEM_FIELDS = ['id', 'lec', 'type', 'fmt', 'pbox', 'img', 'stem', 'choices', 'answer', 'fixed', 'pin', 'ex', 'why', 'cue', 'refs',
  'exam', 'ov', 'cc', 'cc2', 'fk', 'fk2', 'cog', 'diff', 'concept', 'sec', 'hy', 'case', 'phase', 'added'];
const CASE_FIELDS = ['id', 'units', 'box', 'stim', 'items', 'exam', 'added'];
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);

// ---------- the build ----------
function build(opt) {
  const problems = [];   // build errors (besides lint errors)
  const notices = [];    // build warnings
  const fail = (where, msg) => problems.push(`${where}: ${msg}`);
  const note = (where, msg) => notices.push(`${where}: ${msg}`);

  // 1. config, units, figures
  const config = freshRequire(path.join(SRC, 'config.js'));
  const unitsDir = opt.unitsDir || path.join(SRC, 'units');
  let order;
  if (opt.unitsDir) {
    order = exists(unitsDir) ? fs.readdirSync(unitsDir).filter(d => exists(path.join(unitsDir, d, 'unit.js'))) : [];
    // an unreadable unit.js sorts last; the per-unit load below reports it
    const num = d => { try { const n = freshRequire(path.join(unitsDir, d, 'unit.js')).num; return Number.isFinite(n) ? n : 0; } catch (e) { return Infinity; } };
    const nums = new Map(order.map(d => [d, num(d)]));
    order.sort((a, b) => (nums.get(a) === nums.get(b) ? 0 : nums.get(a) < nums.get(b) ? -1 : 1) || (a < b ? -1 : a > b ? 1 : 0));
  } else {
    order = (config.UNITS || []).slice();
    if (exists(unitsDir)) for (const d of fs.readdirSync(unitsDir).sort()) {
      if (!fs.statSync(path.join(unitsDir, d)).isDirectory() || order.includes(d)) continue;
      // --unit <id> validates a unit that is not in UNITS yet (it writes nothing, so nothing reaches the page)
      if (opt.unit === d) { order.push(d); note(rel(path.join(unitsDir, d)), 'not in config.UNITS yet: validated for --unit only'); }
      else note(rel(path.join(unitsDir, d)), 'not in config.UNITS, so it is not built');
    }
  }
  if (new Set(order).size !== order.length) fail('config.js', 'UNITS lists a unit twice');
  const units = [];
  for (const id of order) {
    const dir = path.join(unitsDir, id);
    if (!lint.UNITS.includes(id)) fail(`config.js UNITS`, `${id} is not a unit id (${lint.UNITS.join(', ')})`);
    if (!exists(path.join(dir, 'unit.js'))) { fail(rel(dir), 'listed in UNITS but has no unit.js'); continue; }
    let meta, data = { items: [], cases: [] };
    try { meta = freshRequire(path.join(dir, 'unit.js')); } catch (e) { fail(rel(path.join(dir, 'unit.js')), e.message); continue; }
    if (exists(path.join(dir, 'items.js'))) {
      try { data = freshRequire(path.join(dir, 'items.js')); } catch (e) { fail(rel(path.join(dir, 'items.js')), e.message); continue; }
      if (!data || !Array.isArray(data.items || []) || !Array.isArray(data.cases || [])) { fail(rel(path.join(dir, 'items.js')), 'must export { items: [...], cases: [...] }'); data = { items: [], cases: [] }; }
      const isObj = (x, i, kind) => { if (x && typeof x === 'object' && !Array.isArray(x)) return true; fail(rel(path.join(dir, 'items.js')), `${kind} entry ${i} is not an object`); return false; };
      data = { items: (data.items || []).filter((x, i) => isObj(x, i, 'items')), cases: (data.cases || []).filter((x, i) => isObj(x, i, 'cases')) };
    }
    const core = exists(path.join(dir, 'notes.core.html')) ? readText(path.join(dir, 'notes.core.html')) : null;
    const deep = exists(path.join(dir, 'notes.deep.html')) ? readText(path.join(dir, 'notes.deep.html')) : null;
    let blueprint = null;
    if (exists(path.join(dir, 'blueprint.json'))) try { blueprint = JSON.parse(readText(path.join(dir, 'blueprint.json'))); } catch (e) { fail(rel(path.join(dir, 'blueprint.json')), e.message); }
    units.push({ id, dir, meta, items: (data.items || []).slice(), cases: (data.cases || []).slice(), core, deep, blueprint });
  }
  if (opt.unit && !units.some(u => u.id === opt.unit)) fail('--unit', `${opt.unit} is not one of the built units (${units.map(u => u.id).join(', ') || 'none'})`);

  const figures = {};
  const figDir = path.join(SRC, 'figures');
  if (exists(figDir)) for (const f of fs.readdirSync(figDir).filter(f => f.endsWith('.js')).sort()) {
    const where = rel(path.join(figDir, f));
    try {
      const m = freshRequire(path.join(figDir, f)), svg = typeof m.svg === 'function' ? String(m.svg({})) : '';
      if (m.key !== f.replace(/\.js$/, '')) fail(where, `key "${m.key}" must match the file name`);
      if (!m.alt || !String(m.alt).trim()) fail(where, 'alt text is required');
      if (!/^\s*<svg[\s>]/.test(svg)) fail(where, 'svg() must return an <svg> element');
      if (/<script|\son\w+\s*=/i.test(svg)) fail(where, 'no scripts or event handlers in figures');
      figures[m.key] = { alt: String(m.alt), svg: svg.trim() };
    } catch (e) { fail(where, e.message); }
  }

  const synFile = path.join(SRC, 'synonyms.js');
  if (exists(synFile)) {
    try { freshRequire(synFile); note(rel(synFile), 'present but not used yet (the search work unit wires it in)'); } catch (e) { fail(rel(synFile), e.message); }
  }

  // 2. validate: units, notes, then the item lint (BUILD_SPEC 4.7 via tools/boards/lint-core.cjs)
  const L = lint.createLinter();
  const db = lint.loadFacts(L);
  lint.lintFacts(L, db);
  const notesByUnit = {};
  for (const u of units) {
    const where = rel(path.join(u.dir, 'unit.js')), m = u.meta || {};
    if (m.id !== u.id) fail(where, `id "${m.id}" must match the folder name "${u.id}"`);
    if (!Number.isInteger(m.num)) fail(where, 'num must be an integer');
    for (const k of ['title', 'short']) if (!m[k] || !String(m[k]).trim()) fail(where, `${k} is required`);
    if (!Array.isArray(m.exam) || !m.exam.length || m.exam.some(e => !['inbde', 'adex'].includes(e))) fail(where, "exam must list 'inbde' and/or 'adex'");
    if (!['taught', 'preview'].includes(m.status)) fail(where, "status must be 'taught' or 'preview'");
    if (typeof m.audio !== 'boolean') fail(where, 'audio must be true or false (false in release 1)');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(m.added || '')) fail(where, 'added must be a YYYY-MM-DD date');
    for (const it of u.items) if (it.lec !== u.id) fail(rel(path.join(u.dir, 'items.js')), `${it.id}: lec "${it.lec}" (an item lives in its home unit's items.js)`);
    for (const c of u.cases) if (!String(c.id || '').startsWith(`c-${u.id}-`)) fail(rel(path.join(u.dir, 'items.js')), `${c.id}: a case lives in its home unit (c-${u.id}-NNNN)`);
    notesByUnit[u.id] = validateNotes(u, { db, figures, fail, note });
  }
  // data-practice="sec:<id>" may point at any unit's section
  const allSecs = new Set(Object.values(notesByUnit).flatMap(n => n ? n.core.sections.map(s => s.id) : []));
  for (const u of units) for (const p of (notesByUnit[u.id] || { practice: [] }).practice) {
    if (!/^(sec|unit):/.test(p)) fail(rel(path.join(u.dir, 'notes.core.html')), `data-practice="${p}" must be sec:<id> or unit:<id>`);
    else if (p.startsWith('sec:') && !allSecs.has(p.slice(4))) fail(rel(path.join(u.dir, 'notes.core.html')), `data-practice="${p}": no such section`);
    else if (p.startsWith('unit:') && !units.some(x => x.id === p.slice(5))) fail(rel(path.join(u.dir, 'notes.core.html')), `data-practice="${p}": no such unit`);
  }
  const allItems = units.flatMap(u => u.items), allCases = units.flatMap(u => u.cases);
  const hasSec = (lec, sec) => notesByUnit[lec] ? notesByUnit[lec].core.sections.some(s => s.id === sec) : null;
  const items = allItems.map(it => ({ ...it, _file: rel(path.join(unitsDir, it.lec || '_', 'items.js')) }));
  const res = lint.lintItems(L, { all: items, cases: allCases.map(c => ({ ...c })) }, db, { unit: opt.unit, enabledTypes: config.ENABLED_TYPES, hasSec });
  for (const u of units) {
    const n = notesByUnit[u.id]; if (!n || !u.items.length || (opt.unit && opt.unit !== u.id)) continue;
    for (const s of n.core.sections) if (!allItems.some(it => it.sec === s.id)) note(rel(path.join(u.dir, 'notes.core.html')), `section ${s.id} has no items yet`);
  }
  for (const it of allItems) for (const k of it.img ? [it.img] : []) if (!figures[k]) fail(it.id, `img "${k}" is not a figure in src/boards/figures`);
  for (const c of allCases) for (const k of c.stim || []) if (!figures[k]) fail(c.id, `stim "${k}" is not a figure in src/boards/figures`);
  const lintErrors = L.findings.filter(f => f.sev === 'error'), lintWarns = L.findings.filter(f => f.sev === 'warn');

  // 3. publish filter: checked items and cases of taught units (all of them with --include-drafts)
  const scope = opt.unit ? units.filter(u => u.id === opt.unit) : units;
  const taught = new Set(units.filter(u => opt.drafts || (u.meta && u.meta.status === 'taught')).map(u => u.id));
  const okItem = it => taught.has(it.lec) && (opt.drafts || !!it.checked) && (config.ENABLED_TYPES || ['mcq']).includes(it.type);
  const byId = new Map(allItems.map(it => [it.id, it]));
  const pubCases = allCases.filter(c => (opt.drafts || !!c.checked) && (c.items || []).length && (c.items || []).every(id => byId.has(id) && okItem(byId.get(id))));
  const pubCaseIds = new Set(pubCases.map(c => c.id));
  const pubItems = allItems.filter(it => okItem(it) && (!it.case || pubCaseIds.has(it.case)));
  const counts = {};
  for (const u of scope) {
    const mine = pubItems.filter(it => it.lec === u.id), tally = key => { const t = {}; for (const it of mine) for (const v of [].concat(it[key] == null ? '-' : it[key])) t[v] = (t[v] || 0) + 1; return t; };
    counts[u.id] = {
      status: u.meta && u.meta.status, source: u.items.length, published: mine.length,
      standalone: mine.filter(it => !it.case).length, caseItems: mine.filter(it => it.case).length,
      cases: pubCases.filter(c => c.id.startsWith(`c-${u.id}-`)).length, fk: tally('fk'), cc: tally('cc'), cog: tally('cog'), exam: tally('exam'),
    };
  }

  // 4. the content for the engine (hubs/boards/content/, drawn by widget/hub.js; ENGINE_PLAN section 2)
  const groupOf = {};
  for (const g of config.GROUPS || []) for (const id of g.units || []) {
    if (groupOf[id]) fail('config.js GROUPS', `${id} is in two groups`);
    groupOf[id] = g.id;
  }
  const pubUnits = units.filter(u => u.meta);
  const lectures = pubUnits.map(u => {
    const m = u.meta, ex = (m.exam || []).slice();
    if (!groupOf[u.id]) fail('config.js GROUPS', `${u.id} is in no group: put it under one of the INBDE components`);
    return pick({ id: u.id, num: m.num, label: 'U' + m.num, title: m.title, short: m.short, group: groupOf[u.id],
      status: taught.has(u.id) ? 'taught' : 'upcoming', tag: ex.includes('adex') ? 'BOTH' : 'INBDE', exam: ex,
      who: ex.includes('adex') ? 'INBDE and ADEX' : 'INBDE only', from: 'written from primary sources', added: m.added },
      ['id', 'num', 'label', 'title', 'short', 'group', 'status', 'tag', 'exam', 'who', 'from', 'added']);
  });
  const questions = pubItems.map(it => {
    const q = pick(it, ITEM_FIELDS);
    if (q.pbox) q.pbox = boxRows(q.pbox);
    q.src = 'ref';
    return q;
  });
  const cases = pubCases.map(c => {
    const o = pick(c, CASE_FIELDS);
    o.box = boxRows(c.box || {});
    return o;
  });
  const full = {}, plain = {};
  for (const u of pubUnits) {
    if (!taught.has(u.id) || !notesByUnit[u.id]) continue;
    // Core is the engine's Plain English level and Deep dive its As taught (the hub labels them: T-08); Core alone is both
    if (u.deep) { full[u.id] = u.deep.trim(); plain[u.id] = u.core.trim(); } else full[u.id] = u.core.trim();
  }
  // the public part of each cited fact (items' refs and the notes' data-ref): facts, each fact id's sources, and sources,
  // each source's name, publisher, link and date. The claims and the quotes stay in src/boards/facts/ (T-11 draws the
  // source chips from this file)
  const facts = { facts: {}, sources: {} };
  const cite = id => {
    if (/^https:/.test(id) || facts.facts[id]) return;
    const f = db.facts.get(id); if (!f) return;
    facts.facts[id] = [...new Set((f.cites || []).map(c => c.src))];
    for (const k of facts.facts[id]) if (!facts.sources[k]) { const s = db.sources[k] || {}; facts.sources[k] = pick({ name: s.title, org: s.org, url: s.url, date: s.date }, ['name', 'org', 'url', 'date']); }
  };
  for (const q of questions) (q.refs || []).forEach(cite);
  for (const u of pubUnits) if (full[u.id]) for (const r of notesByUnit[u.id].refs) cite(r);
  // figures: the engine draws a hub's from content/figures.js, which the boards build doesn't write yet
  const usedFigs = new Set([...questions.map(q => q.img).filter(Boolean), ...cases.flatMap(c => c.stim || [])]);
  for (const u of pubUnits) if (full[u.id]) for (const k of notesByUnit[u.id].figs) usedFigs.add(k);
  if (usedFigs.size) fail('src/boards/figures', `published items or notes use ${[...usedFigs].join(', ')}, and the boards build doesn't write content/figures.js yet`);
  // the mock: every published unit's questions, up to 30 each, at the standalone pace, until T-14's exam blocks
  const blueprint = {};
  for (const l of lectures) { const n = questions.filter(q => q.lec === l.id).length; if (n) blueprint[l.id] = Math.min(n, 30); }
  const nMock = Object.values(blueprint).reduce((a, b) => a + b, 0);
  const core = {
    hub: config.HUB, title: config.TITLE, stateKey: config.STATE_KEY, audio: 'off',
    exams: [{ id: 'inbde', label: 'INBDE' }, { id: 'adex', label: 'ADEX' }], examNote: config.EXAM_NOTE,
    groups: (config.GROUPS || []).map(g => pick(g, ['id', 'title', 'code'])),
    lectures, likelyTopics: [], cases,
    mock: { blueprint, limit: nMock * ((config.MOCK || {}).standaloneSec || 63),
      blocks: { standalone: { sec: (config.MOCK || {}).standaloneSec }, cases: { sec: (config.MOCK || {}).caseSec } } },
    srcLabel: { ref: 'Board fact' },
  };
  const D = {
    'core.json': core, 'questions.json': questions, 'notes.json': { full, plain },
    'study.json': { hints: [], cram: {}, review: [], sequences: [], sortSets: [] },
  };

  // 5. game bundles (src/boards/game/<bundle>/*.js -> hubs/boards/game/<bundle>.js)
  const outDir = opt.out || path.join(ROOT, 'hubs', 'boards');
  const contentDir = path.join(outDir, 'content'), gameOut = path.join(outDir, 'game');
  const outputs = new Map();  // abs path -> content
  const gameSrc = path.join(SRC, 'game');
  if (exists(gameSrc)) for (const b of fs.readdirSync(gameSrc).sort()) {
    const bdir = path.join(gameSrc, b);
    if (!fs.statSync(bdir).isDirectory()) continue;
    const files = fs.readdirSync(bdir).filter(f => f.endsWith('.js')).sort();
    if (!files.length) continue;
    const body = files.map(f => `/* ---- ${b}/${f} ---- */\n${readText(path.join(bdir, f)).trim()}\n`).join('\n');
    const content = `/* GENERATED by tools/build-boards.js from src/boards/game/${b}/. Do not edit; edit the sources and rebuild. */\n` +
      `(function(){\n'use strict';\nvar BoardsGame = window.BoardsGame = window.BoardsGame || {};\n${body}})();\n`;
    const gz = zlib.gzipSync(content, { level: 9 }).length, limit = (config.GAME_GZIP_LIMIT || {})[b];
    if (limit && gz > limit) fail(`game/${b}.js`, `${kb(gz)} gzipped, over the ${kb(limit)} limit`);
    outputs.set(path.join(gameOut, b + '.js'), content);
  }

  return { config, units, scope, counts, findings: L.findings, lintErrors, lintWarns, lintItems: res.items, problems, notices, outputs,
    contentDir, gameOut, D, facts, pub: { items: pubItems, cases: pubCases, units: lectures } };
}

// Laying the content out (tools/hub-next/build.mjs buildFrom: the question index, High yield, a question or a lecture to a
// line), so what this writes is what that build would, and facts.json, a fact or a source to a line.
async function layOut(r) {
  const { buildFrom } = await import(pathToFileURL(path.join(ROOT, 'tools', 'hub-next', 'build.mjs')).href);
  const { out } = buildFrom(r.config.HUB, JSON.parse(JSON.stringify(r.D)));
  for (const [name, text] of Object.entries(out)) r.outputs.set(path.join(r.contentDir, name), text);
  const map = m => { const k = Object.keys(m).sort(); return k.length ? '{\n' + k.map(x => '  ' + JSON.stringify(x) + ': ' + JSON.stringify(m[x])).join(',\n') + '\n }' : '{}'; };
  r.outputs.set(path.join(r.contentDir, 'facts.json'), `{\n "facts": ${map(r.facts.facts)},\n "sources": ${map(r.facts.sources)}\n}\n`);
  const bytes = [...r.outputs].filter(([p]) => p.startsWith(r.contentDir)).reduce((n, [, t]) => n + Buffer.byteLength(t), 0);
  if (bytes > r.config.SIZE_LIMIT) r.problems.push(`${rel(r.contentDir)}: ${kb(bytes)}, over the ${kb(r.config.SIZE_LIMIT)} limit`);
  r.sizes = [...r.outputs].map(([p, t]) => [path.basename(p), Buffer.byteLength(t)]);
}

// The engine's patient box: rows of [label, text] (widget/hub-bank.js pboxHTML), from a box's patient, cc, hx and findings
function boxRows(b) {
  const rows = [];
  if (b.patient) rows.push(['Patient', String(b.patient)]);
  if (b.cc) rows.push(['Chief complaint', String(b.cc)]);
  if ((b.hx || []).length) rows.push(['History', b.hx.join('; ')]);
  if ((b.findings || []).length) rows.push(['Findings', b.findings.join('; ')]);
  return rows;
}


// ---------- notes (BUILD_SPEC 5.2) ----------
function parseNotes(html) {
  const sections = [], re = /<section\b([^>]*)>([\s\S]*?)<\/section>/g;
  let m;
  while ((m = re.exec(html))) {
    const attrs = m[1], id = (attrs.match(/\bid="([^"]*)"/) || [])[1], dsec = (attrs.match(/\bdata-sec="([^"]*)"/) || [])[1];
    const h2 = (m[2].match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/) || [])[1];
    sections.push({ id, dsec, title: h2 ? stripTags(h2) : '', html: m[2] });
  }
  const hy = (html.match(/<aside\b[^>]*class="[^"]*\bhy\b[^"]*"[^>]*>([\s\S]*?)<\/aside>/) || [])[1] || '';
  return { sections, hy };
}

function tagBalance(html) {
  const stack = [], re = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*?(\/?)>/g, out = [];
  const src = html.replace(/<!--[\s\S]*?-->/g, '');
  let m;
  while ((m = re.exec(src))) {
    const close = m[1] === '/', tag = m[2].toLowerCase(), self = m[3] === '/';
    if (VOID.has(tag) || self) continue;
    if (!close) { stack.push(tag); continue; }
    if (stack[stack.length - 1] === tag) { stack.pop(); continue; }
    out.push(`</${tag}> does not close <${stack[stack.length - 1] || 'nothing'}>`);
    const at = stack.lastIndexOf(tag); if (at !== -1) stack.length = at;
    if (out.length > 4) break;
  }
  if (stack.length && out.length <= 4) out.push(`unclosed <${stack.join('>, <')}>`);
  return out;
}

function validateNotes(u, { db, figures, fail, note }) {
  if (u.core == null && u.deep == null) return null;
  const fCore = rel(path.join(u.dir, 'notes.core.html')), fDeep = rel(path.join(u.dir, 'notes.deep.html'));
  if (u.core == null) { fail(fCore, 'missing (a unit with Deep dive notes needs Core notes)'); return null; }
  const out = { core: parseNotes(u.core), deep: u.deep == null ? null : parseNotes(u.deep), refs: new Set(), practice: [], figs: new Set() };
  if (u.deep == null) note(fDeep, 'missing (Core notes only)');
  for (const [file, html, parsed] of [[fCore, u.core, out.core], [fDeep, u.deep, out.deep]]) {
    if (html == null) continue;
    for (const p of tagBalance(html)) fail(file, p);
    if (/<script\b|<iframe\b|\son[a-z]+\s*=/i.test(html)) fail(file, 'no scripts, iframes or inline event handlers in notes');
    const br = stripTags(html).match(lint.BRITISH); if (br) fail(file, `British spelling "${br[0]}" (American English everywhere)`);
    if (!parsed.sections.length) fail(file, 'no <section id="..." data-sec="..."> blocks');
    const ids = new Set();
    for (const s of parsed.sections) {
      if (!s.id) { fail(file, 'a <section> has no id'); continue; }
      if (s.id !== s.dsec) fail(file, `section ${s.id}: data-sec must equal the id`);
      if (!new RegExp(`^${u.id}-[a-z0-9-]+$`).test(s.id)) fail(file, `section id ${s.id} must look like ${u.id}-<slug>`);
      if (ids.has(s.id)) fail(file, `section id ${s.id} is used twice`); ids.add(s.id);
      if (!s.title) fail(file, `section ${s.id} has no <h2> title`);
    }
    for (const m of html.matchAll(/data-ref="([^"]*)"/g)) {
      const r = m[1];
      if (/^https?:/.test(r)) { if (!/^https:\/\//.test(r)) fail(file, `data-ref ${r}: URLs must be https`); continue; }
      const f = db.facts.get(r);
      if (!f) fail(file, `data-ref="${r}": no such fact in src/boards/facts`);
      else if (f.status === 'unverified') fail(file, `data-ref="${r}": the fact is unverified`);
      else out.refs.add(r);
    }
    for (const m of html.matchAll(/data-practice="([^"]*)"/g)) out.practice.push(m[1]);
    for (const m of html.matchAll(/data-fig="([^"]*)"/g)) { if (!figures[m[1]]) fail(file, `data-fig="${m[1]}": no such figure in src/boards/figures`); else out.figs.add(m[1]); }
  }
  if (out.deep) {
    const a = out.core.sections.map(s => s.id).join(' '), b = out.deep.sections.map(s => s.id).join(' ');
    if (a !== b) fail(fDeep, `Core and Deep dive must have the same section ids in the same order\n    core: ${a}\n    deep: ${b}`);
  }
  return out;
}

// ---------- report (--report) ----------
function report(r) {
  const lines = [];
  for (const u of r.scope) {
    const list = r.lintItems.filter(it => it.lec === u.id);
    if (!list.length) { lines.push(`  ${u.id}: no items yet`); continue; }
    const pct = (n, d) => d ? Math.round(100 * n / d) + '%' : '-';
    const mcq = list.filter(i => (i.choices || []).length >= 3 && Number.isInteger(i.answer));
    const longest = mcq.filter(i => { const Ls = i.choices.map(c => c.length); return Ls[i.answer] > Math.max(...Ls.filter((_, k) => k !== i.answer)); }).length;
    const ov = {}; for (const i of list) for (const [k, v] of Object.entries(i.ov || {})) ov[`${k}:${v}`] = (ov[`${k}:${v}`] || 0) + 1;
    lines.push(`  ${u.id} (${list.length} source items, ${r.counts[u.id].published} published): case share ${pct(list.filter(i => i.case).length, list.length)}, ` +
      `cue ${pct(list.filter(i => i.cue).length, list.length)}, negatives ${pct(list.filter(i => i.fmt).length, list.length)}, key longest ${pct(longest, mcq.length)}; ov ${Object.entries(ov).map(([k, v]) => `${k} ${v}`).join(', ')}`);
    const fks = [...new Set(list.map(i => i.fk || '-'))].sort(), ccs = [...new Set(list.map(i => i.cc || '-'))].sort();
    lines.push('    FK x CC   ' + ccs.map(c => c.padStart(5)).join('') + '   total  target');
    const tgt = (u.blueprint && u.blueprint.fk) || {};
    for (const f of fks) {
      const row = ccs.map(c => String(list.filter(i => (i.fk || '-') === f && (i.cc || '-') === c).length || '.').padStart(5)).join('');
      lines.push(`    ${f.padEnd(9)} ${row}   ${String(list.filter(i => (i.fk || '-') === f).length).padStart(5)}  ${tgt[f] != null ? String(tgt[f]).padStart(6) : '     -'}`);
    }
    const ctgt = (u.blueprint && u.blueprint.cc) || {};
    if (Object.keys(ctgt).length) lines.push('    CC target: ' + Object.entries(ctgt).map(([c, n]) => `${c} ${list.filter(i => i.cc === c).length}/${n}`).join(', '));
    if (u.blueprint && u.blueprint.caseShare != null) lines.push(`    case share target ${Math.round(100 * u.blueprint.caseShare)}%`);
  }
  return lines.join('\n');
}

// ---------- main ----------
async function main() {
  const opt = parseArgs(process.argv.slice(2));
  if (opt.help) { const ls = readText(__filename).split('\n'), end = ls.findIndex((l, i) => i > 0 && !l.startsWith('//')); console.log(ls.slice(1, end).map(l => l.replace(/^\/\/ ?/, '')).join('\n')); return 0; }
  if (opt.check && opt.unit) { console.error('build-boards: --unit validates one unit and writes nothing; it does not combine with --check (run --check on its own).'); return 2; }
  if (opt.check && opt.drafts) { console.error('build-boards: --include-drafts is a local preview; it refuses to run with --check (CI compares the clean build).'); return 2; }
  if (opt.check && (opt.out || opt.unitsDir)) { console.error('build-boards: --check compares the real build with hubs/boards/; it takes no --out or --units-dir.'); return 2; }
  const real = path.join(ROOT, 'hubs', 'boards');
  if (opt.out && (opt.out === real || opt.out.startsWith(real + path.sep))) { console.error(`build-boards: --out is for a preview folder outside ${rel(real)} (plain node tools/build-boards.js writes the hub).`); return 2; }
  if (!opt.unit && (opt.drafts || opt.unitsDir) && !opt.out) { console.error(`build-boards: ${opt.drafts ? '--include-drafts' : '--units-dir'} writes a preview, never the hub: add --out <dir> (a scratch folder).`); return 2; }

  let r;
  try { r = build(opt); } catch (e) { console.error(`build-boards: ${e.stack || e.message}`); return 1; }
  if (!r.lintErrors.length && !r.problems.length && !opt.unit) {
    try { await layOut(r); } catch (e) { r.problems.push(`tools/hub-next/build.mjs: ${e.message}`); }
  }

  for (const f of r.findings) if (!opt.quiet || f.sev === 'error') console.log(lint.formatFinding(f));
  if (!opt.quiet) for (const n of r.notices) console.log(`warn  ${n}`);
  for (const p of r.problems) console.log(`ERROR ${p}`);

  const unitsLine = r.scope.length ? r.scope.map(u => {
    const c = r.counts[u.id];
    return `  ${u.id} (${c.status}): ${c.published} of ${c.source} items published (${c.standalone} standalone, ${c.caseItems} in cases; ${c.cases} cases homed here)` +
      (c.published ? `; FK ${fmtTally(c.fk)}; CC ${fmtTally(c.cc)}; cog ${fmtTally(c.cog)}; exam ${fmtTally(c.exam)}` : '');
  }).join('\n') : '  no units yet (the hub shows no units until the first one is listed in config.UNITS)';
  console.log(`\nboards: ${r.units.length} units, ${r.pub.items.length} items and ${r.pub.cases.length} cases published${opt.drafts ? ' (DRAFTS INCLUDED)' : ''}\n${unitsLine}`);
  if (opt.report) console.log('\nReport\n' + report(r));
  if (r.sizes) console.log('\nSize: ' + r.sizes.map(([k, n]) => `${k} ${kb(n)}`).join(', '));
  console.log(`lint: ${r.lintErrors.length} errors, ${r.lintWarns.length} warnings; build: ${r.problems.length} errors, ${r.notices.length} warnings`);

  if (r.lintErrors.length || r.problems.length) { console.error('\n✗ build failed: fix the errors above (nothing was written)'); return 1; }
  if (opt.unit) { console.log(`\n✓ unit ${opt.unit} is valid (--unit writes nothing)`); return 0; }

  // files in the folders this writes that it no longer builds (a game bundle dropped, a content file renamed)
  const leftovers = () => [[r.contentDir, /\.json$/], [r.gameOut, /\.js$/]].flatMap(([d, re]) =>
    exists(d) ? fs.readdirSync(d).filter(f => re.test(f)).map(f => path.join(d, f)).filter(p => !r.outputs.has(p)) : []);
  if (opt.check) {
    const stale = [];
    for (const [p, content] of r.outputs) {
      const cur = exists(p) ? readText(p) : null;
      if (cur !== content) stale.push(rel(p) + (cur == null ? ' (missing)' : ''));
    }
    for (const p of leftovers()) stale.push(rel(p) + ' (no longer built: delete it)');
    if (stale.length) { console.error(`\n✗ the boards hub's content is stale; run node tools/build-boards.js and commit:\n${stale.map(s => '  ' + s).join('\n')}`); return 1; }
    console.log(`\n✓ ${[...r.outputs.keys()].map(rel).join(', ')} up to date with src/boards`);
    return 0;
  }

  for (const [p, content] of r.outputs) {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    const cur = exists(p) ? readText(p) : null;   // a CRLF checkout of an unchanged file is left alone
    if (cur !== content) fs.writeFileSync(p, content);
  }
  for (const p of leftovers()) { fs.unlinkSync(p); console.log(`removed ${rel(p)} (no longer built)`); }
  console.log(`\n✓ wrote ${[...r.outputs.keys()].map(rel).join(', ')}${opt.drafts ? '  (DRAFT PREVIEW: not the hub)' : ''}`);
  return 0;
}

function fmtTally(t) { return Object.keys(t).sort().map(k => `${k} ${t[k]}`).join(', '); }

if (require.main === module) main().then(c => { process.exitCode = c; }, e => { console.error(e.stack || e.message); process.exitCode = 1; });
module.exports = { build, layOut, parseNotes, tagBalance, boxRows };
