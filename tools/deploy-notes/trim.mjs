#!/usr/bin/env node
/* Keeps the change log small (vault/tasks/2026-11-22-sustainable-for-years.md, package 5): every entry of
   DEPLOY_NOTES.md's "Recent major changes" older than --days (default 7) moves, unchanged and in the same order, to the
   archive file of its month next to it, DEPLOY_NOTES-<yyyy-mm>.md, newest first there too. Nothing is deleted or reworded.
   An entry's date is the first yyyy-mm-dd on its first line.
     node tools/deploy-notes/trim.mjs              # move entries older than 7 days
     node tools/deploy-notes/trim.mjs --days 14    # another window
     node tools/deploy-notes/trim.mjs --check      # say what would move, change nothing
   Grep the whole log with: grep -n "<hub or feature>" DEPLOY_NOTES*.md */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const MAIN = path.join(ROOT, 'DEPLOY_NOTES.md');
const args = process.argv.slice(2);
const days = Number(args.includes('--days') ? args[args.indexOf('--days') + 1] : 7);
const check = args.includes('--check');
const today = args.includes('--today') ? args[args.indexOf('--today') + 1] : new Date().toISOString().slice(0, 10);
const cut = new Date(Date.parse(today + 'T00:00:00Z') - days * 86400000).toISOString().slice(0, 10);

const HEAD = '## Recent major changes';
const text = fs.readFileSync(MAIN, 'utf8');
const lines = text.split('\n');
const start = lines.findIndex(l => l.startsWith(HEAD));
if (start < 0) throw new Error(`no "${HEAD}" heading in DEPLOY_NOTES.md`);
/* the list runs from the heading to the first line after it that is neither an entry nor an entry's continuation */
let end = start + 1;
while (end < lines.length && (lines[end] === '' || lines[end].startsWith('- ') || /^\s/.test(lines[end]))) end++;
while (end > start + 1 && lines[end - 1] === '') end--;

const entries = []; let cur = null; const lead = [];
for (const l of lines.slice(start + 1, end)) {
  if (l.startsWith('- ')) { cur = [l]; entries.push(cur); }
  else if (cur) cur.push(l);
  else lead.push(l);
}
const keep = [], move = new Map();
for (const e of entries) {
  const m = /(20\d\d-\d\d-\d\d)/.exec(e[0]);
  if (!m) throw new Error(`an entry without a date on its first line: ${e[0].slice(0, 100)}`);
  if (m[1] >= cut) keep.push(e);
  else { const k = m[1].slice(0, 7); if (!move.has(k)) move.set(k, []); move.get(k).push(e); }
}
const n = [...move.values()].reduce((a, v) => a + v.length, 0);
const block = es => es.map(e => { const b = e.slice(); while (b.length > 1 && b[b.length - 1] === '') b.pop(); return b.join('\n'); }).join('\n');
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

if (!n) { console.log(`DEPLOY_NOTES.md: nothing older than ${cut} (${(Buffer.byteLength(text) / 1024).toFixed(0)} KB)`); process.exit(0); }
for (const [k, es] of move) {
  const f = path.join(ROOT, `DEPLOY_NOTES-${k}.md`);
  const [y, mo] = k.split('-');
  const title = `# Deploy Notes, ${MONTHS[+mo - 1]} ${y}: the change log's older entries`;
  const intro = `Entries of [DEPLOY_NOTES.md](DEPLOY_NOTES.md)'s "Recent major changes" dated ${MONTHS[+mo - 1]} ${y}, moved here unchanged by\n` +
    '`node tools/deploy-notes/trim.mjs` once they were more than a week old, newest first. New entries go at the top of\n' +
    '`DEPLOY_NOTES.md`, never here. Search the whole log with `grep -n "<hub or feature>" DEPLOY_NOTES*.md`.\n\n## Entries\n';
  let out;
  if (fs.existsSync(f)) {
    const old = fs.readFileSync(f, 'utf8');
    const at = old.indexOf('\n## Entries\n');
    if (at < 0) throw new Error(`${path.basename(f)} has no "## Entries" heading`);
    const pre = old.slice(0, at + '\n## Entries\n'.length), rest = old.slice(pre.length).replace(/^\n+/, '');
    out = pre + '\n' + block(es) + '\n' + rest;   /* moved entries are newer than the ones already there */
  } else out = `${title}\n\n${intro}\n${block(es)}\n`;
  console.log(`${check ? 'would move' : 'moved'} ${es.length} entr${es.length === 1 ? 'y' : 'ies'} to ${path.basename(f)}`);
  if (!check) fs.writeFileSync(f, out);
}
const body = [...lines.slice(0, start + 1), ...lead, block(keep), ...lines.slice(end)].join('\n');
if (!check) fs.writeFileSync(MAIN, body);
console.log(`DEPLOY_NOTES.md: ${keep.length} entries from ${cut} on stay (${(Buffer.byteLength(text) / 1024).toFixed(0)} KB ${check ? 'now, about ' : '→ '}${(Buffer.byteLength(body) / 1024).toFixed(0)} KB)`);
