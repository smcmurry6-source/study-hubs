#!/usr/bin/env node
// Runs the whole automated release test (RELEASE_TEST_PLAN.md, "Automated gates") and writes one summary:
//   node tools/release/run.js                 everything
//   node tools/release/run.js --only rls,a11y  some suites
//   node tools/release/run.js --skip matrix    all but some
// Writes $SH_RELEASE_OUT/summary.md (default: <tmp>/sh-release/summary.md) to paste into the PR's test report.
// Suites that need something missing here (Playwright, axe-core, PostgreSQL) are reported as blocked, not passed.
'use strict';
const { spawnSync } = require('child_process'), fs = require('fs'), path = require('path');
const L = require('./lib');
const arg = n => (i => i > 0 ? process.argv[i + 1].split(',') : null)(process.argv.indexOf('--' + n));
const ONLY = arg('only'), SKIP = arg('skip') || [];
const SUITES = [
  ['syntax', 'Syntax and merge markers', 'tools/ci/syntax.js'],
  ['vault', 'Vault notes, links and tasks', 'tools/ci/vault.js'],
  ['archive', 'Hub archive state (dates and admin overrides)', 'tools/ci/archive.js'],
  ['secrets', 'Public-repo check (secrets, course material)', 'tools/release/secrets.js'],
  ['smoke', 'Smoke test and question-bank lint', 'tools/ci/smoke.js'],
  ['preview', 'Preview safety (no production requests, noindex, fixtures)', 'tools/ci/preview.js'],
  ['rls', 'Database permissions (RLS, grants, secrets)', 'tools/release/rls.js'],
  ['adminui', 'Admin page in a preview (Live, Hubs, newest first, phone layout)', 'tools/release/admin-ui.js'],
  ['admin', 'Admin operations on fixtures (live presence privacy, archive overrides, order)', 'tools/release/admin-ops.js'],
  ['retention', 'Analytics retention on fixtures (deletes, kept hours, device linking, recap)', 'tools/release/retention.js'],
  ['xp', 'XP and the game layer on fixtures (replayed calls, double taps, linked devices, the shop, the idea board)', 'tools/release/xp.js'],
  ['a11y', 'Accessibility (axe, keyboard, reduced motion)', 'tools/release/a11y.js'],
  ['perf', 'Performance budgets (slow 4G phone)', 'tools/release/perf.js'],
  ['matrix', 'Devices and resilience (refresh, history, offline, slow)', 'tools/release/matrix.js']
].filter(([k]) => (!ONLY || ONLY.includes(k)) && !SKIP.includes(k));

const rows = [];
let failed = 0;
for (const [key, name, file] of SUITES) {
  process.stdout.write(`\n=== ${name} (${file})\n`);
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [path.join(L.ROOT, file)], { cwd: L.ROOT, encoding: 'utf8', env: process.env, maxBuffer: 64 * 1048576 });
  const out = (r.stdout || '') + (r.stderr || '');
  process.stdout.write(out);
  const secs = Math.round((Date.now() - t0) / 1000);
  const blocked = out.match(/Cannot find module '(playwright|axe-core[^']*)'|no PostgreSQL server binaries|Executable doesn't exist/);
  const verdict = r.status === 0 ? 'pass' : blocked ? 'blocked' : 'FAIL';
  if (verdict === 'FAIL') failed++;
  const last = verdict === 'blocked' ? `needs ${blocked[1] ? blocked[1].split('/')[0] : blocked[0]}`
    : out.trim().split('\n').filter(l => /^[✓✗]|problem/.test(l.trim())).slice(-1)[0] || out.trim().split('\n').slice(-1)[0] || '';
  rows.push({ key, name, file, verdict, secs, last: last.trim().slice(0, 160), out });
}
const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
let sha = ''; try { sha = require('child_process').execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: L.ROOT }).toString().trim(); } catch (e) {}
const md = [`## Automated release test: ${now} UTC, ${sha}`, '', '| Suite | Result | Time | Summary |', '|---|---|---|---|',
  ...rows.map(r => `| ${r.name} (\`${r.file}\`) | ${r.verdict === 'pass' ? 'pass' : r.verdict === 'blocked' ? '**blocked**' : '**FAIL**'} | ${r.secs} s | ${r.last.replace(/\|/g, '\\|')} |`), '',
  failed ? `**${failed} suite(s) failed.** Details below.` : rows.some(r => r.verdict === 'blocked') ? 'Every suite that could run passed; blocked ones need the tool named above.' : 'Every suite passed.', '',
  ...rows.filter(r => r.verdict !== 'pass').map(r => `<details><summary>${r.name}</summary>\n\n\`\`\`\n${r.out.trim().split('\n').slice(-40).join('\n')}\n\`\`\`\n</details>\n`)].join('\n');
const outFile = path.join(L.outDir('.'), 'summary.md');
fs.writeFileSync(outFile, md + '\n');
console.log('\n' + md + `\n(summary written to ${outFile})`);
process.exit(failed ? 1 : 0);
