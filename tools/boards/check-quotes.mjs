#!/usr/bin/env node
// Boards hub: confirm that every quote in the fact records really appears in its source.
//
//   node tools/boards/check-quotes.mjs                 check every quote (sources cached for 7 days)
//   node tools/boards/check-quotes.mjs --fact IE-5     only these facts (repeatable, or comma-separated)
//   node tools/boards/check-quotes.mjs --src ada-anticoag
//   node tools/boards/check-quotes.mjs --refresh       refetch sources even if cached
//   node tools/boards/check-quotes.mjs --offline       use the cache only, never the network
//   node tools/boards/check-quotes.mjs --fetch         just fetch (warm the cache) and report source status
//   node tools/boards/check-quotes.mjs --grep <src> <regex>   search one source's text, print matches in context
//   node tools/boards/check-quotes.mjs --propose       for cites without a quote, print the best-matching sentences
//   node tools/boards/check-quotes.mjs --json <file>   also write the results as JSON
//   node tools/boards/check-quotes.mjs --dir <folder>   read sources.json + facts from another folder (drafts)
//
// Sources live in src/boards/facts/sources.json; facts in src/boards/facts/<unit>.json. A source's `fetch` URL (a
// machine-readable copy: DailyMed SPL XML, Europe PMC full text) is read instead of `url` when present. PDFs need
// `pdftotext` (poppler) or Python with pypdf. Sites that block plain requests are retried in headless Chromium when
// Playwright is installed (PLAYWRIGHT_PATH / CHROMIUM_PATH as for tools/ci/smoke.js). For a source marked `blocked`
// (e.g. aha-ie-2021), save its PDF from a browser as .cache/boards-sources/<key>.local.pdf and the check reads that.
//
// Match levels: exact (after normalizing case, quotes, dashes and spaces), loose (letters and digits only, so line
// breaks, hyphenation and symbols don't matter), ordered (every word in order within a short window: table cells
// that PDF extraction interleaves). Exit 1 if any quote is missing from a source that was read.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FACTS_DIR = path.join(ROOT, 'src/boards/facts');
const CACHE = path.join(ROOT, '.cache/boards-sources');
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const MAX_AGE_MS = 7 * 24 * 3600 * 1000;

// ---------- args ----------
const argv = process.argv.slice(2);
const opt = { fact: [], src: [], refresh: false, offline: false, fetchOnly: false, propose: false, json: null, grep: null, dir: FACTS_DIR };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--fact') opt.fact.push(...argv[++i].split(','));
  else if (a === '--src') opt.src.push(...argv[++i].split(','));
  else if (a === '--refresh') opt.refresh = true;
  else if (a === '--offline') opt.offline = true;
  else if (a === '--fetch') opt.fetchOnly = true;
  else if (a === '--propose') opt.propose = true;
  else if (a === '--json') opt.json = argv[++i];
  else if (a === '--dir') opt.dir = path.resolve(argv[++i]);
  else if (a === '--grep') { opt.grep = { src: argv[++i], re: argv[++i] }; }
  else if (a === '-h' || a === '--help') { console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 22).map(l => l.replace(/^\/\/ ?/, '')).join('\n')); process.exit(0); }
  else { console.error('unknown argument: ' + a); process.exit(2); }
}

// ---------- load ----------
export function loadFacts(dir = FACTS_DIR) {
  const sources = JSON.parse(fs.readFileSync(path.join(dir, 'sources.json'), 'utf8'));
  const facts = [];
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'sources.json').sort()) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    for (const fact of data.facts || []) facts.push({ ...fact, _file: f });
  }
  return { sources, facts };
}

// ---------- text extraction ----------
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '-', mdash: '-', minus: '-', le: '≤', ge: '≥',
  rsquo: "'", lsquo: "'", rdquo: '"', ldquo: '"', hellip: '...', deg: '°', micro: 'µ', mu: 'µ', times: 'x', middot: '·',
  reg: '®', trade: '™', copy: '©', shy: '', thinsp: ' ', ensp: ' ', emsp: ' ', plusmn: '±', frac12: '1/2', bull: '•' };
function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+\d*);/gi, (m, e) => {
    if (e[0] === '#') { const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return Number.isFinite(n) ? String.fromCodePoint(n) : m; }
    const v = ENT[e.toLowerCase()]; return v === undefined ? m : v;
  });
}
function markupToText(s) {
  return decodeEntities(s
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|svg|head)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<(br|hr)\b[^>]*>/gi, '\n')
    .replace(/<\/(p|div|li|tr|h\d|title|caption|table|section|paragraph|td|th|item|list)>/gi, '\n')
    .replace(/<[^>]+>/g, ' '))
    .replace(/[ \t ]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
}
function pdfToText(file) {
  try { return execFileSync('pdftotext', ['-enc', 'UTF-8', file, '-'], { maxBuffer: 64 << 20 }).toString('utf8'); } catch (e) { /* try python */ }
  for (const py of ['python3', 'python']) {
    try {
      return execFileSync(py, ['-I', '-c', 'import sys,pypdf;r=pypdf.PdfReader(sys.argv[1]);print("\\n".join((p.extract_text() or "") for p in r.pages))', file], { maxBuffer: 64 << 20 }).toString('utf8');
    } catch (e) { /* next */ }
  }
  throw new Error('cannot read PDF: install poppler (pdftotext) or Python with pypdf');
}

async function browserText(url) {
  const req = createRequire(import.meta.url);
  let chromium;
  try { ({ chromium } = req(process.env.PLAYWRIGHT_PATH || 'playwright')); } catch (e) { throw new Error('blocked, and Playwright is not installed for the browser retry'); }
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  try {
    const page = await (await browser.newContext({ userAgent: UA })).newPage();
    const r = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(2500);
    if (!r || r.status() >= 400) throw new Error('HTTP ' + (r && r.status()) + ' in browser');
    return await page.evaluate(() => document.body ? document.body.innerText : '');
  } finally { await browser.close(); }
}

// ---------- fetch with cache ----------
export async function getSourceText(key, src, { refresh = false, offline = false } = {}) {
  fs.mkdirSync(CACHE, { recursive: true });
  const txt = path.join(CACHE, key + '.txt'), meta = path.join(CACHE, key + '.meta.json');
  if (!refresh && fs.existsSync(txt)) {
    const age = Date.now() - fs.statSync(txt).mtimeMs;
    if (offline || age < MAX_AGE_MS) return { text: fs.readFileSync(txt, 'utf8'), meta: fs.existsSync(meta) ? JSON.parse(fs.readFileSync(meta, 'utf8')) : {}, cached: true };
  }
  const local = path.join(CACHE, key + '.local.pdf');
  if (fs.existsSync(local)) {   // a copy saved by hand from a browser, for sources that block scripts
    const text = pdfToText(local), info = { url: local, fetched: new Date().toISOString(), via: 'local file' };
    fs.writeFileSync(txt, text); fs.writeFileSync(meta, JSON.stringify(info, null, 1));
    return { text, meta: info, cached: false };
  }
  if (offline) throw new Error('not cached (offline)');
  if (src.blocked) throw new Error('blocks scripts; save the PDF from a browser as .cache/boards-sources/' + key + '.local.pdf');
  const url = src.fetch || src.url;
  let text, info = { url, fetched: new Date().toISOString() };
  const res = await fetch(url, { headers: { 'user-agent': UA, accept: '*/*' }, redirect: 'follow' }).catch(e => ({ ok: false, status: 0, err: e }));
  if (!res.ok) {
    if (src.kind === 'pdf' || res.status === 0) throw new Error('HTTP ' + (res.status || (res.err && res.err.message)));
    text = await browserText(url); info.via = 'browser';
  } else if (src.kind === 'pdf' || /pdf/.test(res.headers.get('content-type') || '')) {
    const pdf = path.join(CACHE, key + '.pdf');
    fs.writeFileSync(pdf, Buffer.from(await res.arrayBuffer()));
    text = pdfToText(pdf);
  } else {
    const raw = await res.text();
    if (src.kind === 'spl') {
      const m = raw.match(/<effectiveTime value="(\d{8})/); if (m) info.effective = m[1].replace(/(\d{4})(\d\d)(\d\d)/, '$1-$2-$3');
      const v = raw.match(/<versionNumber value="(\d+)"/); if (v) info.version = v[1];
    }
    text = markupToText(raw);
    if (text.length < 500 && src.kind === 'html') { text = await browserText(url); info.via = 'browser'; }
  }
  if (!text || text.trim().length < 200) throw new Error('no usable text at ' + url + (info.via ? ' (browser)' : ''));
  fs.writeFileSync(txt, text); fs.writeFileSync(meta, JSON.stringify(info, null, 1));
  return { text, meta: info, cached: false };
}

// ---------- matching ----------
export function norm1(s) {
  return s.normalize('NFKC').toLowerCase()
    .replace(/[‘’‛′`]/g, "'").replace(/[“”″]/g, '"')
    .replace(/[‐-―−]/g, '-').replace(/­/g, '')
    .replace(/\s+/g, ' ').replace(/ ([,.;:)\]])/g, '$1').replace(/([(\[]) /g, '$1').trim();
}
const norm2 = s => norm1(s).replace(/[^a-z0-9]+/g, '');
const words = s => norm1(s).split(/[^a-z0-9.]+/).map(w => w.replace(/^\.+|\.+$/g, '')).filter(Boolean);

export function matchQuote(quote, text, cache = {}) {
  const t1 = cache.t1 || (cache.t1 = norm1(text));
  if (t1.includes(norm1(quote))) return 'exact';
  const t2 = cache.t2 || (cache.t2 = norm2(text));
  if (t2.includes(norm2(quote))) return 'loose';
  // ordered: every word of the quote in order, within a window of 4x the quote's length
  const tw = cache.tw || (cache.tw = words(text)), qw = words(quote);
  if (!qw.length) return 'missing';
  const span = qw.length * 4 + 10;
  for (let i = 0; i < tw.length; i++) {
    if (tw[i] !== qw[0]) continue;
    let j = 1, k = i + 1;
    while (j < qw.length && k < tw.length && k - i <= span) { if (tw[k] === qw[j]) j++; k++; }
    if (j === qw.length) return 'ordered';
  }
  return 'missing';
}

function sentences(text) {
  return text.replace(/\s+/g, ' ').split(/(?<=[.;!?])\s+(?=[A-Z(•\d])|\s•\s/).map(s => s.trim()).filter(s => s.length > 25 && s.length < 600);
}
function propose(claim, text, n = 2) {
  const sents = sentences(text), df = new Map();
  const toks = s => new Set(words(s).filter(w => w.length > 3 || /\d/.test(w)));
  const sTok = sents.map(toks);
  for (const ts of sTok) for (const w of ts) df.set(w, (df.get(w) || 0) + 1);
  const cw = [...toks(claim)];
  const scored = sents.map((s, i) => {
    let sc = 0;
    for (const w of cw) if (sTok[i].has(w)) sc += (/\d/.test(w) ? 3 : 1) * Math.log(1 + sents.length / (df.get(w) || 1));
    return { s, sc: sc / Math.sqrt(1 + s.length / 200) };
  }).sort((a, b) => b.sc - a.sc);
  return scored.slice(0, n).map(x => x.s);
}

// ---------- main ----------
async function main() {
  const { sources, facts } = loadFacts(opt.dir);
  const texts = {}, failures = {};
  async function text(key) {
    if (key in texts || key in failures) return texts[key];
    const src = sources[key];
    if (!src) { failures[key] = 'not in sources.json'; return; }
    try { const r = await getSourceText(key, src, opt); texts[key] = r.text; texts['_meta_' + key] = r.meta; }
    catch (e) { failures[key] = e.message; }
    return texts[key];
  }

  if (opt.grep) {
    const t = await text(opt.grep.src);
    if (!t) { console.error(opt.grep.src + ': ' + failures[opt.grep.src]); process.exit(1); }
    const flat = t.replace(/\s+/g, ' '), re = new RegExp(opt.grep.re, 'gi');
    let m, n = 0;
    while ((m = re.exec(flat)) && n < 30) { n++; console.log('…' + flat.slice(Math.max(0, m.index - 220), m.index + m[0].length + 220) + '…\n'); if (!m[0].length) re.lastIndex++; }
    if (!n) console.log('no match');
    return;
  }

  const want = f => (!opt.fact.length || opt.fact.includes(f.id));
  const keys = new Set();
  for (const f of facts.filter(want)) for (const c of f.cites || []) if (!opt.src.length || opt.src.includes(c.src)) keys.add(c.src);
  if (opt.fetchOnly) for (const k of Object.keys(sources)) if (!opt.src.length || opt.src.includes(k)) keys.add(k);

  for (const k of [...keys].sort()) {
    const t = await text(k);
    if (opt.fetchOnly) {
      const m = texts['_meta_' + k] || {};
      console.log((t ? 'ok  ' : 'FAIL') + ' ' + k.padEnd(26) + (t ? String(t.length).padStart(8) + ' chars' : '  ' + failures[k]) +
        (m.effective ? '  label effective ' + m.effective + (sources[k].date && !m.effective.startsWith(sources[k].date) ? ' (sources.json says ' + (sources[k].date || '?') + ')' : '') : '') + (m.via ? '  via ' + m.via : ''));
    }
  }
  if (opt.fetchOnly) return;

  const results = [], counts = { exact: 0, loose: 0, ordered: 0, missing: 0, unread: 0, noquote: 0 };
  const caches = {};
  for (const f of facts.filter(want)) {
    for (const c of f.cites || []) {
      if (opt.src.length && !opt.src.includes(c.src)) continue;
      const r = { fact: f.id, src: c.src, loc: c.loc };
      if (!c.quote) {
        r.status = 'noquote'; counts.noquote++;
        if (opt.propose && texts[c.src]) r.proposals = propose(f.claim, texts[c.src], 1);
      } else if (!texts[c.src]) { r.status = 'unread'; r.reason = failures[c.src]; counts.unread++; }
      else { r.status = matchQuote(c.quote, texts[c.src], caches[c.src] || (caches[c.src] = {})); counts[r.status]++; }
      results.push(r);
    }
  }
  for (const r of results) {
    if (r.status === 'exact' || r.status === 'loose') continue;
    console.log(`${r.status.toUpperCase().padEnd(8)} ${r.fact.padEnd(7)} ${r.src}${r.reason ? '  (' + r.reason + ')' : ''}`);
    if (r.proposals) for (const p of r.proposals) console.log("           > " + p.slice(0, 330));
  }
  console.log(`\n${results.length} cites: ${counts.exact} exact, ${counts.loose} loose, ${counts.ordered} ordered (table text; eyeball these), ` +
    `${counts.missing} MISSING, ${counts.unread} unread source, ${counts.noquote} without a quote`);
  for (const [k, v] of Object.entries(failures)) console.log(`  source ${k}: ${v}`);
  if (opt.json) fs.writeFileSync(opt.json, JSON.stringify({ when: new Date().toISOString(), counts, results }, null, 1));
  if (counts.missing) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(e => { console.error(e); process.exit(2); });
