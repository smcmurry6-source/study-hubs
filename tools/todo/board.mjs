#!/usr/bin/env node
// The backlog board: /backlog's numbered packages as one page, with each package's session prompt and a button that
// starts it (vault/how-to/package-the-to-dos.md, step 4).
//
//   node tools/todo/board.mjs <packages.json> --out <board.html>
//   node tools/todo/board.mjs --example            prints a packages file to start from
//
// The packages file is written by the agent running /backlog (in its scratchpad, never committed: it can carry the
// session's environment id). Each package's prompt is filled in from the template in step 5 of the how-to, so the
// template keeps one home; a package with "prompt" uses that text as it is, and one with "opening" (a task note's own
// Opening prompt) gets the template's closing lines after it. The page is tools/todo/board.html.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const HOWTO = path.join(root, 'vault/how-to/package-the-to-dos.md');
const PAGE = path.join(here, 'board.html');
const TIERS = ['week', 'next', 'later'];
const SIZES = ['S', 'M', 'L'];
const STATES = ['ready', 'waiting', 'ask'];
const ASIDE = ['pr', 'waiting', 'sam', 'parked', 'moot'];

const EXAMPLE = {
  asOf: '2026-11-18T16:30:00-06:00',
  asOfLabel: 'Wed Nov 18, 4:30 pm',
  repo: 'https://github.com/smcmurry6-source/study-hubs',
  environmentId: '(optional: the environment new sessions run in, from get_environment)',
  calendar: ['Perio final Thu 11/19 (archives 10 pm)'],
  packages: [{
    n: 1, tier: 'week', title: 'A short title', size: 'M', alone: false, state: 'ready',
    waits: '(only when state is "waiting") what unblocks it',
    items: [{ text: 'What the item is, in a line', where: 'vault/tasks/<file>.md, its Done when' }],
    why: 'Why these go together (optional)',
    decided: ["Sam's words, word for word"], ask: ['A question for Sam, answered before the work starts'],
    order: '', deadline: '', needs: '',
  }],
  aside: { pr: [], waiting: [], sam: [], parked: [], moot: [] },
};

function fail(msg) { console.error(`✗ board.mjs: ${msg}`); process.exit(1); }

// The ```text block in step 5 of the how-to, as lines.
export function template(md = fs.readFileSync(HOWTO, 'utf8')) {
  const step = md.split(/^## 5\./m)[1];
  const block = step && step.match(/```text\n([\s\S]*?)\n```/);
  if (!block) fail(`no \`\`\`text template in step 5 of ${path.relative(root, HOWTO)}`);
  return block[1].split('\n');
}

// "<A | B | C>" alternatives: each has one placeholder (<...> or ...), which the value replaces.
function alternatives(line) { return line.slice(1, -1).split(' | '); }
function fill(alt, value) {
  const m = alt.match(/<[^<>]*>|\.\.\./);
  if (!m) return `${alt} ${value}`;
  return alt.slice(0, m.index) + value + alt.slice(m.index + m[0].length);
}
const sentence = s => (/[.!?]["')]?$/.test(s) ? s : s + '.');

export function promptFor(p, lines = template()) {
  if (p.prompt) return p.prompt.trim();
  const out = [];
  const tailFrom = lines.findIndex(l => /^Out of scope:/.test(l));
  if (tailFrom < 0) fail('the template has no "Out of scope:" line; update board.mjs with it');
  const items = p.items || [];
  const itemLine = (it, i) => `${i + 1}. ${it.text}${it.where ? `: ${it.where}` : ''}`;
  if (p.opening) {
    out.push(p.opening.trim());
    if (items.length > 1) { out.push('', 'It also covers (each is written down in the vault; read it first):'); items.slice(1).forEach((it, i) => out.push(itemLine(it, i))); }
    out.push('');
    lines.slice(0, tailFrom).filter(l => /^</.test(l)).forEach(l => out.push(...special(l)));
    out.push(...lines.slice(tailFrom));
    return tidy(out);
  }
  let seenTitle = false, seenItems = false;
  for (const l of lines) {
    if (l.includes('<title>')) { out.push(l.replace('<title>', p.title)); seenTitle = true; continue; }
    if (/^1\. </.test(l)) { items.forEach((it, i) => out.push(itemLine(it, i))); seenItems = true; continue; }
    if (/^2\. \.\.\.$/.test(l)) continue;
    if (/^<.*>$/.test(l)) { out.push(...special(l)); continue; }
    out.push(l);
  }
  if (!seenTitle || !seenItems) fail('the template lost its <title> or its "1. <item>" line; update board.mjs with it');
  return tidy(out);

  function special(l) {
    const alts = alternatives(l);
    if (/decided/.test(alts[0])) {
      const r = [];
      if (p.decided && p.decided.length) r.push(fill(alts[0], p.decided.join('". "')));
      if (p.ask && p.ask.length) r.push(fill(alts[1], p.ask.join(' ')).replace(/([?!.])\.$/, '$1'));
      return r;
    }
    if (/^Order/.test(alts[0])) {
      const vals = [p.order, p.deadline, p.needs];
      return alts.map((a, i) => (vals[i] ? sentence(fill(a, vals[i])) : '')).filter(Boolean);
    }
    return [l];
  }
}
function tidy(lines) { return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim(); }

function check(d) {
  if (!Array.isArray(d.packages) || !d.packages.length) fail('"packages" is empty');
  if (!/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(d.repo || '')) fail('"repo" must be the repository\'s https://github.com/... URL');
  if (!d.asOf) fail('"asOf" is missing');
  const seen = new Set();
  d.packages.forEach((p, i) => {
    const at = `package ${p.n ?? i + 1}`;
    if (!Number.isInteger(p.n) || seen.has(p.n)) fail(`${at}: "n" must be a whole number used once`);
    seen.add(p.n);
    if (!p.title) fail(`${at}: no title`);
    if (!TIERS.includes(p.tier)) fail(`${at}: "tier" is one of ${TIERS.join(', ')}`);
    if (!SIZES.includes(p.size)) fail(`${at}: "size" is one of ${SIZES.join(', ')}`);
    if (p.state && !STATES.includes(p.state)) fail(`${at}: "state" is one of ${STATES.join(', ')}`);
    if (p.state === 'waiting' && !p.waits) fail(`${at}: a waiting package says what it waits on ("waits")`);
    if (!p.prompt && !(p.items || []).length) fail(`${at}: no items`);
    (p.items || []).forEach(it => { if (!it.text) fail(`${at}: an item with no text`); });
  });
  Object.keys(d.aside || {}).forEach(k => { if (!ASIDE.includes(k)) fail(`aside "${k}" is not one of ${ASIDE.join(', ')}`); });
}

export function build(d) {
  check(d);
  const lines = template();
  const data = {
    asOf: d.asOf, asOfLabel: d.asOfLabel || '', repo: d.repo, environmentId: d.environmentId || '',
    calendar: d.calendar || [],
    packages: d.packages.map(p => ({
      n: p.n, tier: p.tier, title: p.title, size: p.size, alone: !!p.alone, state: p.state || 'ready',
      waits: p.waits || '', items: p.items || [], why: p.why || '', ask: p.ask || [], prompt: promptFor(p, lines),
    })),
    aside: d.aside || {},
  };
  // JSON inside a <script> tag: "<" escaped so nothing in it can close the tag
  const json = JSON.stringify(data).replace(/</g, '\\u003c').replace(/[\u2028\u2029]/g, c => '\\u' + c.charCodeAt(0).toString(16));
  const page = fs.readFileSync(PAGE, 'utf8');
  if (!page.includes('/*BOARD_DATA*/')) fail('tools/todo/board.html lost its /*BOARD_DATA*/ placeholder');
  return page.replace('/*BOARD_DATA*/', () => json);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.includes('--example')) { console.log(JSON.stringify(EXAMPLE, null, 2)); process.exit(0); }
  const src = args.find(a => !a.startsWith('--'));
  const outAt = args.indexOf('--out');
  const out = outAt >= 0 ? args[outAt + 1] : null;
  if (!src || !out) fail('usage: node tools/todo/board.mjs <packages.json> --out <board.html>  (or --example)');
  let d;
  try { d = JSON.parse(fs.readFileSync(src, 'utf8')); } catch (e) { fail(`can't read ${src}: ${e.message}`); }
  const html = build(d);
  fs.writeFileSync(out, html);
  console.log(`✓ ${out}: ${d.packages.length} packages, ${Math.round(html.length / 1024)} KB`);
}
