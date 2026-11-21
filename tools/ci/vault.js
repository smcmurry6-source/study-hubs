// Vault checks (vault/rules/repo-is-the-vault.md): the notes any agent is pointed at stay navigable.
//  - every relative markdown link in vault/, AGENTS.md, CLAUDE.md and README.md points at a file that exists
//  - no [[wikilinks]] (GitHub and agents can't follow them)
//  - every vault note has frontmatter with a `type`
//  - task notes have a valid status; vault/tasks/done/ holds only done or dropped tasks, and done ones live there
//  - every rule note is listed in vault/home.md and imported (@vault/rules/<file>) by CLAUDE.md, except a rule for one
//    feature (`load: on-demand`), which CLAUDE.md links under "Feature rules" instead of importing (2026-11-06)
//  - every @import in CLAUDE.md, and in a folder's own CLAUDE.md (tools/figures/, tools/podcast/), exists
//  - every hub folder (hubs/<id>/index.html) has vault/hubs/<id>.md, and every hub note is listed in vault/home.md
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '../..');
const problems = [];
const rel = f => path.relative(root, f).split(path.sep).join('/');

function walk(dir){
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? walk(p) : d.name.endsWith('.md') ? [p] : [];
  });
}
const vaultDir = path.join(root, 'vault');
const notes = fs.existsSync(vaultDir) ? walk(vaultDir) : [];
const entry = ['AGENTS.md', 'CLAUDE.md', 'README.md'].map(f => path.join(root, f)).filter(f => fs.existsSync(f));

// Markdown with fenced code blocks and inline code spans blanked out, so examples in code aren't checked.
function prose(text){
  return text.replace(/^(```|~~~)[\s\S]*?^\1[^\n]*$/gm, m => m.replace(/[^\n]/g, ' '))
             .replace(/`[^`\n]*`/g, m => ' '.repeat(m.length));
}
function frontmatter(text){
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(text);
  if (!m) return null;
  const fm = {};
  m[1].split(/\r?\n/).forEach(line => { const kv = /^([A-Za-z][\w-]*):\s*(.*?)\s*(#.*)?$/.exec(line); if (kv) fm[kv[1]] = kv[2]; });
  return fm;
}

for (const file of [...entry, ...notes]) {
  const text = fs.readFileSync(file, 'utf8'), body = prose(text), name = rel(file);
  const lineOf = i => body.slice(0, i).split('\n').length;
  for (const m of body.matchAll(/\[\[[^\]\n]+\]\]/g)) problems.push(`${name}:${lineOf(m.index)} uses a [[wikilink]]; use a relative markdown link [text](path.md)`);
  for (const m of body.matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    const target = m[1];
    if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('#')) continue;   // URLs, mailto:, in-page anchors
    let p = target.split('#')[0];
    try { p = decodeURIComponent(p); } catch (e) {}
    if (p.startsWith('/')) { problems.push(`${name}:${lineOf(m.index)} link "${target}" is absolute; make it relative to the note`); continue; }
    const abs = path.resolve(path.dirname(file), p);
    if (!fs.existsSync(abs)) problems.push(`${name}:${lineOf(m.index)} link "${target}" points at nothing`);
    else if (fs.statSync(abs).isDirectory()) problems.push(`${name}:${lineOf(m.index)} link "${target}" is a folder (Obsidian can't open it); link a note instead`);
  }
}

const STATUSES = ['open', 'in-progress', 'blocked', 'review', 'done', 'dropped'];
const tasksDir = path.join(vaultDir, 'tasks'), doneDir = path.join(tasksDir, 'done');
for (const file of notes) {
  const name = rel(file), fm = frontmatter(fs.readFileSync(file, 'utf8'));
  if (!fm || !fm.type) { problems.push(`${name}: needs frontmatter with a type (see vault/rules/repo-is-the-vault.md)`); continue; }
  if (fm.type !== 'task' || name.startsWith('vault/templates/')) continue;
  const inDone = path.dirname(file) === doneDir;
  if (!file.startsWith(tasksDir + path.sep)) problems.push(`${name}: task notes live in vault/tasks/`);
  if (!STATUSES.includes(fm.status)) problems.push(`${name}: status "${fm.status || ''}" isn't one of ${STATUSES.join(', ')}`);
  else if (inDone && !['done', 'dropped'].includes(fm.status)) problems.push(`${name}: is in done/ but its status is ${fm.status}`);
  else if (!inDone && ['done', 'dropped'].includes(fm.status)) problems.push(`${name}: is ${fm.status}; move it to vault/tasks/done/`);
  if (fm.status === 'blocked' && !fm['waiting-on']) problems.push(`${name}: is blocked; say what it is waiting on (waiting-on:)`);
  if (!fm.created) problems.push(`${name}: needs created: <yyyy-mm-dd>`);
}

const rulesDir = path.join(vaultDir, 'rules');
const home = path.join(vaultDir, 'home.md'), claude = path.join(root, 'CLAUDE.md');
const homeText = fs.existsSync(home) ? fs.readFileSync(home, 'utf8') : '';
const claudeText = fs.existsSync(claude) ? fs.readFileSync(claude, 'utf8') : '';
if (fs.existsSync(rulesDir)) {
  for (const f of fs.readdirSync(rulesDir).filter(f => f.endsWith('.md'))) {
    if (!homeText.includes(`(rules/${f})`)) problems.push(`vault/rules/${f}: not listed in vault/home.md`);
    const imported = new RegExp(`^@vault/rules/${f.replace(/\./g, '\\.')}\\s*$`, 'm').test(claudeText);
    const load = (frontmatter(fs.readFileSync(path.join(rulesDir, f), 'utf8')) || {}).load;
    if (load && load !== 'on-demand') problems.push(`vault/rules/${f}: load is "${load}"; it can only be on-demand (or left out)`);
    else if (load === 'on-demand') {
      if (imported) problems.push(`vault/rules/${f}: is load: on-demand, but CLAUDE.md imports it (link it under "Feature rules" instead, or drop load: on-demand)`);
      if (!claudeText.includes(`(vault/rules/${f})`)) problems.push(`vault/rules/${f}: is load: on-demand; link it under "Feature rules" in CLAUDE.md, saying when to read it`);
    } else if (!imported) problems.push(`vault/rules/${f}: not imported by CLAUDE.md (add a line "@vault/rules/${f}")`);
  }
}
// every hub folder has its note, and every hub note is on the map
const hubsDir = path.join(root, 'hubs'), hubNotes = path.join(vaultDir, 'hubs');
if (fs.existsSync(hubsDir)) {
  for (const id of fs.readdirSync(hubsDir).filter(d => fs.existsSync(path.join(hubsDir, d, 'index.html')))) {
    if (!fs.existsSync(path.join(hubNotes, id + '.md'))) problems.push(`hubs/${id}/ has no note: add vault/hubs/${id}.md (copy vault/templates/hub.md; see vault/how-to/build-a-hub.md)`);
  }
}
if (fs.existsSync(hubNotes)) {
  for (const f of fs.readdirSync(hubNotes).filter(f => f.endsWith('.md'))) {
    if (!homeText.includes(`(hubs/${f})`)) problems.push(`vault/hubs/${f}: not listed in vault/home.md`);
  }
}
for (const m of prose(claudeText).matchAll(/^@(\S+)\s*$/gm)) {
  if (!fs.existsSync(path.join(root, m[1]))) problems.push(`CLAUDE.md imports @${m[1]}, which doesn't exist`);
}
// a folder's own CLAUDE.md (Claude Code loads it when a session opens a file there): its imports resolve from its folder
for (const dir of ['tools', '.claude']) {
  const found = [], look = d => fs.existsSync(d) && fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
    if (e.isDirectory() && e.name !== 'node_modules') look(path.join(d, e.name)); else if (e.name === 'CLAUDE.md') found.push(path.join(d, e.name)); });
  look(path.join(root, dir));
  for (const f of found) for (const m of prose(fs.readFileSync(f, 'utf8')).matchAll(/^@(\S+)\s*$/gm)) {
    if (!fs.existsSync(path.resolve(path.dirname(f), m[1]))) problems.push(`${rel(f)} imports @${m[1]}, which doesn't exist`);
  }
}

if (problems.length) { problems.forEach(p => console.error('✗ ' + p)); console.error(`Vault check failed (${problems.length})`); process.exit(1); }
console.log(`✓ vault: ${notes.length} notes, links resolve, tasks and rules in order`);
