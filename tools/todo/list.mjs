#!/usr/bin/env node
// Every open item on the to-do list, in one place (vault/how-to/package-the-to-dos.md; Claude Code: /backlog).
//
//   node tools/todo/list.mjs                    the working tree
//   node tools/todo/list.mjs --ref origin/main  what is on main, without leaving your branch (git fetch first)
//   node tools/todo/list.mjs --full             each item's whole text instead of its first line
//   node tools/todo/list.mjs --json             the same, as JSON
//
// It reads, and never changes:
//   - the task notes in vault/tasks/ (not done/): status, hub, due, waiting-on, pr, and every unticked box of Done when
//   - the inbox (vault/tasks/inbox.md): every line not ticked, and how many ticked lines are waiting to be cleared
//   - supabase/pending-migrations.txt: migrations written but not applied
//   - the bug log (vault/release/bug-log.md): every row not retested, accepted or won't fix
//   - vault/tasks/done/: unticked boxes left in finished tasks (leftovers to triage)
// What it can't see: open pull requests (GitHub) and the calendar (hubs.js). The how-to says how to add both.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const opt = name => args.includes(name);
const ref = (() => { const i = args.indexOf('--ref'); return i >= 0 ? args[i + 1] : null; })();
const full = opt('--full'), json = opt('--json');

const git = (...a) => execFileSync('git', a, { cwd: root, encoding: 'utf8', maxBuffer: 64 << 20 });
const read = f => ref ? git('show', `${ref}:${f}`) : readFileSync(path.join(root, f), 'utf8');
const has = f => { if (!ref) return existsSync(path.join(root, f)); try { git('cat-file', '-e', `${ref}:${f}`); return true; } catch (e) { return false; } };
const list = dir => ref
  ? git('ls-tree', '--name-only', `${ref}:${dir}`).split('\n').filter(Boolean)
  : (existsSync(path.join(root, dir)) ? readdirSync(path.join(root, dir)) : []);

const clip = (s, n = 200) => { s = s.replace(/\s+/g, ' ').trim(); return full || s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, '') + ' …'; };
const title = s => { const m = /^\*\*(.+?)\*\*/.exec(s.trim()); return m ? m[1] : null; };   // a bold phrase that starts the item
// A box ticked, or struck through with the reason (`- [ ] ~~...~~ dropped: ...`), is no longer open.
const isOpen = b => !b.done && !b.text.trim().startsWith('~~');
function frontmatter(text){
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(text), fm = {};
  if (m) m[1].split(/\r?\n/).forEach(l => { const kv = /^([A-Za-z][\w-]*):\s*(.*?)\s*(#.*)?$/.exec(l); if (kv) fm[kv[1]] = kv[2]; });
  return fm;
}
// The checklist items of a markdown text: [{ done, text }], a box's wrapped lines joined to it.
function boxes(text){
  const out = []; let cur = null;
  for (const line of text.split('\n')) {
    const m = /^(\s*)- \[([ xX])\] (.*)$/.exec(line);
    if (m) { cur = { done: m[2] !== ' ', text: m[3], indent: m[1].length }; out.push(cur); continue; }
    if (cur && line.trim() && /^\s+/.test(line) && !/^\s*- /.test(line)) cur.text += ' ' + line.trim();
    else cur = null;
  }
  return out;
}
const section = (text, heading) => { const m = new RegExp(`^## ${heading}\\s*$([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'm').exec(text); return m ? m[1] : ''; };

const out = { ref: ref || 'working tree', tasks: [], inbox: { open: [], ticked: 0 }, migrations: [], bugs: { open: [], retest: [] }, leftovers: [] };

// Task notes
for (const f of list('vault/tasks').filter(f => /^\d{4}-\d\d-\d\d-.+\.md$/.test(f)).sort()) {
  const file = `vault/tasks/${f}`, text = read(file), fm = frontmatter(text);
  if (fm.type !== 'task') continue;
  const open = boxes(section(text, 'Done when')).filter(isOpen).map(b => clip(b.text));
  out.tasks.push({ file, title: (/^# (.+)$/m.exec(text) || [, f])[1], status: fm.status, hub: fm.hub, due: fm.due || '',
    waiting: fm['waiting-on'] || '', pr: fm.pr || '', open, prompt: /^## Opening prompt/m.test(text) });
}

// The inbox
if (has('vault/tasks/inbox.md')) {
  const lines = read('vault/tasks/inbox.md').split('\n');
  lines.forEach((line, i) => {
    const m = /^- \[([ xX])\] (.*)$/.exec(line);
    if (!m) return;
    if (m[1] !== ' ') { out.inbox.ticked++; return; }
    let text = m[2];
    if (text.trim().startsWith('~~')) { out.inbox.ticked++; return; }
    for (let j = i + 1; j < lines.length && /^\s+\S/.test(lines[j]) && !/^- /.test(lines[j]); j++) text += ' ' + lines[j].trim();
    out.inbox.open.push({ line: i + 1, title: title(text), text: clip(text, 260) });
  });
}

// Pending migrations
if (has('supabase/pending-migrations.txt'))
  out.migrations = read('supabase/pending-migrations.txt').split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));

// The bug log: ID | Found | Severity | Problem | Owner | Status | Fix | Retest
if (has('vault/release/bug-log.md')) {
  for (const row of read('vault/release/bug-log.md').split('\n').filter(l => /^\| *BUG-\d+/.test(l))) {
    const c = row.replace(/^\|/, '').replace(/\|\s*$/, '').split('|').map(s => s.trim());
    const status = (c[5] || '').toLowerCase();
    if (/^(retested|accepted|won'?t fix|closed)/.test(status)) continue;
    const bug = { id: c[0], severity: c[2], status: c[5], owner: c[4], problem: clip(title(c[3]) || c[3], 180) };
    (status.startsWith('fixed') ? out.bugs.retest : out.bugs.open).push(bug);
  }
}

// Unticked boxes left in finished tasks
for (const f of list('vault/tasks/done').filter(f => f.endsWith('.md') && f !== 'README.md').sort()) {
  const file = `vault/tasks/done/${f}`;
  const left = boxes(read(file)).filter(isOpen);
  if (left.length) out.leftovers.push({ file, open: left.map(b => clip(b.text, 140)) });
}

if (json) { console.log(JSON.stringify(out, null, 2)); process.exit(0); }

const p = s => console.log(s);
p(`# The to-do list (${out.ref})\n`);
p(`## Task notes (${out.tasks.length})\n`);
for (const t of out.tasks) {
  const meta = [t.status, t.hub && `hub ${t.hub}`, t.due && `due ${t.due}`, t.pr && `pr ${t.pr}`, t.prompt && 'has an opening prompt'].filter(Boolean).join(' · ');
  p(`- ${t.title}\n  ${t.file} — ${meta}${t.waiting ? `\n  waiting on: ${t.waiting}` : ''}`);
  t.open.forEach(b => p(`  - [ ] ${b}`));
}
p(`\n## Inbox (${out.inbox.open.length} open; ${out.inbox.ticked} ticked lines waiting to be cleared)\n`);
out.inbox.open.forEach(i => p(`- inbox.md:${i.line} ${i.text}`));
p(`\n## Pending migrations (${out.migrations.length})\n`);
out.migrations.forEach(m => p(`- ${m}`));
p(`\n## Bug log: open (${out.bugs.open.length})\n`);
out.bugs.open.forEach(b => p(`- ${b.id} ${b.severity} [${b.status}; ${b.owner}] ${b.problem}`));
p(`\n## Bug log: fixed, waiting for a retest (${out.bugs.retest.length})\n`);
out.bugs.retest.forEach(b => p(`- ${b.id} ${b.severity} [${b.status}] ${b.problem}`));
p(`\n## Unticked boxes in finished tasks (${out.leftovers.length} notes: triage, don't assume they're open)\n`);
out.leftovers.forEach(l => { p(`- ${l.file}`); l.open.forEach(b => p(`  - [ ] ${b}`)); });
p(`\nNot shown: open pull requests (GitHub) and exam dates (hubs.js). See vault/how-to/package-the-to-dos.md.`);
