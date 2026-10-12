#!/usr/bin/env node
// Boards hub: code checks for question items and fact records (zero model tokens; PLAN_V2 item 9, BUILD_SPEC 4.7).
//
//   node tools/boards/lint-items.mjs                         every src/boards/units/*/items.js, plus the fact records
//   node tools/boards/lint-items.mjs docs/boards/bench/items.js   these item files only (+ facts)
//   node tools/boards/lint-items.mjs --unit perio            one unit
//   node tools/boards/lint-items.mjs --facts                 fact records only
//   node tools/boards/lint-items.mjs --json out.json         also write the findings as JSON
//   node tools/boards/lint-items.mjs --quiet                 errors only
//   node tools/boards/lint-items.mjs --facts --facts-dir <folder>   lint a draft fact folder (sources.json + *.json)
//
// Item files are CommonJS: module.exports = { items: [...], cases: [...] } (BUILD_SPEC 4.4). Exit 1 on any error.
// Warnings are for the verifier and the author to look at; errors block the build.
// The checks themselves live in tools/boards/lint-core.cjs (also used by tools/build-boards.js and tools/ci/smoke.js);
// importing this file gives the same functions without running the command line.

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const core = require('./lint-core.cjs');
export const { lintBoards, loadFacts, lintFacts, loadItemFiles, lintItems, createLinter, formatFinding } = core;
export default core;

function main(argv) {
  const opt = { files: [], unit: null, factsOnly: false, json: null, quiet: false, factsDir: core.FACTS_DIR };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--unit') opt.unit = argv[++i];
    else if (a === '--facts') opt.factsOnly = true;
    else if (a === '--json') opt.json = argv[++i];
    else if (a === '--quiet') opt.quiet = true;
    else if (a === '--facts-dir') opt.factsDir = path.resolve(argv[++i]);
    else if (a === '-h' || a === '--help') { console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 13).map(l => l.replace(/^\/\/ ?/, '')).join('\n')); process.exit(0); }
    else opt.files.push(a);
  }

  const L = core.createLinter();
  const factsDb = core.loadFacts(L, opt.factsDir);
  core.lintFacts(L, factsDb);
  let res = { items: [], cases: [] };
  if (!opt.factsOnly) {
    let files = opt.files;
    if (!files.length) {
      const ud = path.join(core.ROOT, 'src/boards/units');
      files = fs.existsSync(ud) ? fs.readdirSync(ud).map(u => path.join(ud, u, 'items.js')).filter(f => fs.existsSync(f)) : [];
    }
    const loaded = core.loadItemFiles(L, files);
    res = core.lintItems(L, loaded, factsDb, { unit: opt.unit });
  }
  const findings = L.findings;
  const errors = findings.filter(f => f.sev === 'error'), warns = findings.filter(f => f.sev === 'warn');
  for (const f of opt.quiet ? errors : findings) console.log(core.formatFinding(f));
  const tiers = {}; for (const it of res.items) tiers[it._risk] = (tiers[it._risk] || 0) + 1;
  console.log(`\n${factsDb.facts.size} facts, ${res.items.length} items, ${res.cases.length} cases: ${errors.length} errors, ${warns.length} warnings` +
    (res.items.length ? `; risk tiers (from cited facts): ${Object.entries(tiers).map(([k, v]) => `${k} ${v}`).join(', ')}` : ''));
  if (opt.json) fs.writeFileSync(opt.json, JSON.stringify({ when: new Date().toISOString(), findings, risk: Object.fromEntries(res.items.map(i => [i.id, i._risk])) }, null, 1));
  if (errors.length) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
