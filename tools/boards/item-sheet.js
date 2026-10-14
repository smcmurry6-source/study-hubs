#!/usr/bin/env node
// Compact review sheet for a unit's question items and the facts they cite.
//
//   node tools/boards/item-sheet.js <unit> [--ids a,b] [--changed-since <git ref>]
//       [--items <file>] [--out <dir>]
//   Writes <dir>/<unit>.md, or numbered files of 20 items for large units.
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const { createRequire } = require('node:module');

const ROOT = path.resolve(__dirname, '..', '..');
const usage = 'usage: node tools/boards/item-sheet.js <unit> [--ids a,b] [--changed-since <git ref>] [--items <file>] [--out <dir>]';

function parseArgs(argv) {
  const options = {};
  let unit = null;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help') {
      console.log(usage);
      process.exit(0);
    }
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      if (!['ids', 'changed-since', 'items', 'out'].includes(key)) throw new Error(`unknown option: ${arg}`);
      if (i + 1 >= argv.length || argv[i + 1].startsWith('--')) throw new Error(`${arg} needs a value`);
      options[key] = argv[++i];
    } else if (!unit) unit = arg;
    else throw new Error(`unexpected argument: ${arg}`);
  }
  if (!unit) throw new Error(usage);
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(unit)) throw new Error(`invalid unit name: ${unit}`);
  return { unit, options };
}

function evaluateItems(source, filename) {
  const mod = { exports: {} };
  const run = new Function('require', 'module', 'exports', '__filename', '__dirname', source);
  run(createRequire(filename), mod, mod.exports, filename, path.dirname(filename));
  if (!mod.exports || !Array.isArray(mod.exports.items)) throw new Error(`${filename} must export { items: [...] }`);
  return { items: mod.exports.items, cases: Array.isArray(mod.exports.cases) ? mod.exports.cases : [] };
}

function loadItemFile(file) {
  if (!fs.existsSync(file)) throw new Error(`item file not found: ${file}`);
  return evaluateItems(fs.readFileSync(file, 'utf8'), file);
}

function repoRelative(file) {
  const rel = path.relative(ROOT, file);
  if (!rel || rel === '..' || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) {
    throw new Error(`--changed-since requires --items to be inside the repository: ${file}`);
  }
  return rel.split(path.sep).join('/');
}

function loadAtRef(ref, file) {
  const commit = spawnSync('git', ['cat-file', '-e', `${ref}^{commit}`], { cwd: ROOT, stdio: 'ignore' });
  if (commit.status !== 0) throw new Error(`git ref not found: ${ref}`);
  const rel = repoRelative(file);
  const object = `${ref}:${rel}`;
  const exists = spawnSync('git', ['cat-file', '-e', object], { cwd: ROOT, stdio: 'ignore' });
  if (exists.status !== 0) return null;
  const source = execFileSync('git', ['show', object], { cwd: ROOT, encoding: 'utf8' });
  return evaluateItems(source, file);
}

function jsonShape(value) {
  if (Array.isArray(value)) return value.map(jsonShape);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, jsonShape(value[key])]));
  }
  return value;
}

const TEXT_FIELDS = [
  'id', 'type', 'fmt', 'lec', 'exam', 'ov', 'cc', 'cc2', 'fk', 'fk2', 'cog', 'diff', 'phase',
  'concept', 'sec', 'tags', 'stem', 'choices', 'answer', 'fixed', 'ex', 'why', 'cue', 'refs', 'pbox', 'case',
];

function reviewText(item, caseDef) {
  const text = {};
  for (const key of TEXT_FIELDS) if (item[key] !== undefined) text[key] = item[key];
  if (caseDef && caseDef.box) text.caseBox = caseDef.box;
  return JSON.stringify(jsonShape(text));
}

function factsFrom(folder) {
  const facts = new Map();
  for (const filename of fs.readdirSync(folder).filter(name => name.endsWith('.json') && name !== 'sources.json')) {
    const parsed = JSON.parse(fs.readFileSync(path.join(folder, filename), 'utf8'));
    const rows = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.facts) ? parsed.facts : Object.values(parsed));
    for (const fact of rows) if (fact && fact.id) facts.set(fact.id, fact);
  }
  const sources = JSON.parse(fs.readFileSync(path.join(folder, 'sources.json'), 'utf8'));
  return { facts, sources: sources.sources || sources };
}

function formatValue(value) {
  if (Array.isArray(value)) return value.map(formatValue).join(', ');
  if (value && typeof value === 'object') return Object.entries(value).map(([key, val]) => `${key}:${formatValue(val)}`).join(', ');
  return String(value);
}

function tagsFor(item) {
  const keys = ['lec', 'exam', 'ov', 'cc', 'cc2', 'fk', 'fk2', 'cog', 'diff', 'phase', 'concept', 'sec'];
  const tags = keys.filter(key => item[key] !== undefined && item[key] !== null && item[key] !== '')
    .map(key => `${key}=${formatValue(item[key])}`);
  if (item.tags !== undefined && item.tags !== null && item.tags !== '') tags.unshift(`tags=${formatValue(item.tags)}`);
  return tags.join(' · ') || '—';
}

function boxLines(box) {
  if (!box) return [];
  const lines = [];
  if (box.patient) lines.push(`**Patient:** ${box.patient}`);
  if (box.cc) lines.push(`**Chief complaint:** ${box.cc}`);
  if (Array.isArray(box.hx) && box.hx.length) lines.push(`**History:** ${box.hx.map(x => `\n- ${x}`).join('')}`);
  if (Array.isArray(box.findings) && box.findings.length) lines.push(`**Findings:** ${box.findings.map(x => `\n- ${x}`).join('')}`);
  return lines;
}

function choiceLabel(index) {
  let value = index + 1, label = '';
  while (value) {
    value--;
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26);
  }
  return label;
}

function explanationSentences(text) {
  if (!text || !text.trim()) return [];
  const marker = '\uE000';
  const protectedText = text
    .replace(/\b(?:e\.g|i\.e|Mr|Mrs|Ms|Dr|Prof|vs|etc)\./gi, value => value.replace(/\./g, marker))
    .replace(/\b(?:[A-Z]\.){2,}/g, value => value.replace(/\./g, marker))
    .replace(/(\d)\.(\d)/g, `$1${marker}$2`);
  return protectedText.split(/(?<=[.!?])\s+/).map(s => s.replaceAll(marker, '.').trim()).filter(Boolean);
}

function renderItem(item, factsDb, caseDef) {
  let flags = 0;
  const flag = message => { flags++; return `!! ${message}\n`; };
  const lines = [`## ${item.id}`, '', `**Type:** ${item.type || '—'}  `, `**Tags:** ${tagsFor(item)}`, ''];
  if (!caseDef && item.pbox) lines.push(...boxLines(item.pbox), '');
  lines.push(`**Stem:** ${item.stem || '—'}`, '');

  const choices = Array.isArray(item.choices) ? item.choices : [];
  const why = Array.isArray(item.why) ? item.why : [];
  const answer = Number.isInteger(item.answer) && item.answer >= 0 && item.answer < choices.length ? item.answer : -1;
  const lengths = choices.map(choice => String(choice ?? '').trim().length);
  const longest = lengths.length && answer >= 0 && lengths[answer] > Math.max(...lengths.filter((_, i) => i !== answer), -1);
  choices.forEach((choice, index) => {
    const label = choiceLabel(index), keyMark = index === answer ? ' **[KEY]**' : '';
    lines.push(`- ${label}. ${choice}${keyMark}`);
    const reason = typeof why[index] === 'string' ? why[index].trim() : '';
    lines.push(`  Why: ${reason || '—'}`);
    if (!reason) lines.push(flag(`Choice ${label} has an empty why line.`).trimEnd());
  });
  if (answer < 0 && choices.length) lines.push(flag('Key answer index is missing or invalid.').trimEnd());
  if (longest) lines.push(flag(`Key choice ${choiceLabel(answer)} is the longest choice (${lengths[answer]} characters).`).trimEnd());
  lines.push('', `**Cue:** ${item.cue || '—'}`, '', `**Explanation:** ${item.ex || '—'}`);
  const refs = Array.isArray(item.refs) ? item.refs : [];
  explanationSentences(item.ex || '').forEach((sentence, index) => {
    const inlineIds = [...sentence.matchAll(/\b([A-Z]{1,6}-\d+)\b/g)].map(match => match[1]);
    if (!inlineIds.length) lines.push(flag(`Explanation sentence ${index + 1} has no inline fact citation.`).trimEnd());
    else for (const id of inlineIds) if (!refs.includes(id)) lines.push(flag(`Explanation sentence ${index + 1} mentions ${id}, which is not listed in refs.`).trimEnd());
  });

  lines.push('', '**Facts:**');
  if (!refs.length) lines.push('- None cited.');
  for (const id of [...new Set(refs)]) {
    const fact = factsDb.facts.get(id);
    if (!fact) {
      lines.push(`- **${id}** — MISSING`);
      lines.push(flag(`Cited fact ${id} is missing.`).trimEnd());
      continue;
    }
    lines.push(`- **${id}:** ${fact.claim || 'No statement recorded.'}`);
    lines.push(`  Conditions: ${fact.conditions || '—'}`);
    if (fact.status !== 'verified') lines.push(flag(`Cited fact ${id} has status ${fact.status || 'missing'}, not verified.`).trimEnd());
    const cites = Array.isArray(fact.cites) ? fact.cites : [];
    if (!cites.length) lines.push('  - No source citations recorded.');
    for (const cite of cites) {
      const source = factsDb.sources[cite.src] || {};
      const sourceTitle = source.title || cite.src || 'Unknown source';
      const sourceUrl = source.url || 'URL not recorded';
      lines.push(`  - Source: ${sourceTitle} — ${sourceUrl}${cite.loc ? ` (${cite.loc})` : ''}`);
      if (cite.quote) lines.push(`    > ${cite.quote}`);
      else lines.push('    > [No verbatim quote recorded]');
      if (!factsDb.sources[cite.src]) lines.push(flag(`Source ${cite.src || '(unknown)'} for fact ${id} is missing from sources.json.`).trimEnd());
    }
  }
  return { markdown: lines.join('\n') + '\n', flags };
}

function buildBlocks(items, cases) {
  const byId = new Map(items.map(item => [item.id, item]));
  const caseById = new Map();
  for (const caseDef of cases) for (const id of caseDef.items || []) caseById.set(id, caseDef);
  const itemCase = item => (item.case && cases.find(c => c.id === item.case)) || caseById.get(item.id) || null;
  const seen = new Set(), blocks = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    const caseDef = itemCase(item);
    if (!caseDef) {
      seen.add(item.id);
      blocks.push({ caseDef: null, items: [item] });
      continue;
    }
    const listed = (caseDef.items || []).map(id => byId.get(id)).filter(Boolean);
    const group = listed.length ? listed : items.filter(candidate => itemCase(candidate) === caseDef);
    for (const candidate of group) seen.add(candidate.id);
    if (!group.includes(item)) { group.push(item); seen.add(item.id); }
    blocks.push({ caseDef, items: group });
  }
  return blocks;
}

function main() {
  const { unit, options } = parseArgs(process.argv.slice(2));
  const file = path.resolve(options.items || path.join(ROOT, 'src', 'boards', 'units', unit, 'items.js'));
  const current = loadItemFile(file);
  let items = current.items.filter(item => !item.lec || item.lec === unit);
  if (options.ids) {
    const wanted = new Set(options.ids.split(',').map(id => id.trim()).filter(Boolean));
    const available = new Set(items.map(item => item.id));
    const missing = [...wanted].filter(id => !available.has(id));
    if (missing.length) throw new Error(`item id(s) not found in ${unit}: ${missing.join(', ')}`);
    items = items.filter(item => wanted.has(item.id));
  }
  if (options['changed-since']) {
    const prior = loadAtRef(options['changed-since'], file);
    const priorItems = prior ? prior.items.filter(item => !item.lec || item.lec === unit) : [];
    const priorCases = prior ? prior.cases : [];
    const priorById = new Map(priorItems.map(item => [item.id, item]));
    const priorCaseById = new Map();
    for (const caseDef of priorCases) for (const id of caseDef.items || []) priorCaseById.set(id, caseDef);
    items = items.filter(item => {
      const caseDef = (item.case && current.cases.find(c => c.id === item.case)) || current.cases.find(c => (c.items || []).includes(item.id));
      const oldItem = priorById.get(item.id);
      if (!oldItem) return true;
      const oldCase = (oldItem.case && priorCases.find(c => c.id === oldItem.case)) || priorCases.find(c => (c.items || []).includes(oldItem.id)) || priorCaseById.get(oldItem.id);
      return reviewText(item, caseDef) !== reviewText(oldItem, oldCase);
    });
  }

  const includedIds = new Set(items.map(item => item.id));
  const cases = current.cases.filter(caseDef => (caseDef.items || []).some(id => includedIds.has(id)) || items.some(item => item.case === caseDef.id));
  const blocks = buildBlocks(items, cases);
  const { facts, sources } = factsFrom(path.join(ROOT, 'src', 'boards', 'facts'));
  const factsDb = { facts, sources };
  const outputDir = path.resolve(options.out || path.join(ROOT, '.cache', 'item-sheet', unit));
  fs.mkdirSync(outputDir, { recursive: true });
  const chunks = [];
  let chunk = [], chunkItems = 0;
  const pushChunk = () => { if (chunk.length) chunks.push(chunk); chunk = []; chunkItems = 0; };
  for (const block of blocks) {
    if (block.items.length > 20) {
      pushChunk();
      for (let i = 0; i < block.items.length; i += 20) chunks.push([{ ...block, items: block.items.slice(i, i + 20) }]);
    } else {
      if (chunkItems && chunkItems + block.items.length > 20) pushChunk();
      chunk.push(block);
      chunkItems += block.items.length;
    }
  }
  pushChunk();
  if (!chunks.length) chunks.push([]);
  const totalItems = items.length;
  let totalFlags = 0;
  const filenames = [];
  chunks.forEach((chunk, index) => {
    let count = 0;
    const itemCount = chunk.reduce((sum, block) => sum + block.items.length, 0);
    const first = chunks.slice(0, index).reduce((sum, prior) => sum + prior.reduce((n, block) => n + block.items.length, 0), 0) + 1;
    const last = first + itemCount - 1;
    const lines = [`# ${unit} item review${totalItems > 20 ? ` (${first}-${last})` : ''}`, ''];
    for (const block of chunk) {
      if (block.caseDef) lines.push(`## Case box: ${block.caseDef.id}`, '', ...boxLines(block.caseDef.box), '');
      for (const item of block.items) {
        const rendered = renderItem(item, factsDb, block.caseDef);
        count += rendered.flags;
        lines.push(rendered.markdown.trimEnd(), '');
      }
    }
    lines.push(`Summary: ${itemCount} ${itemCount === 1 ? 'item' : 'items'}; ${count} review flags.`, '');
    const filename = totalItems > 20 ? `${unit}-${String(index + 1).padStart(2, '0')}.md` : `${unit}.md`;
    fs.writeFileSync(path.join(outputDir, filename), lines.join('\n'));
    filenames.push(filename);
    totalFlags += count;
  });
  console.log(`Wrote ${filenames.map(name => path.join(outputDir, name)).join(', ')} (${items.length} items; ${totalFlags} review flags).`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  if (error.message.startsWith('usage:')) process.exitCode = 2;
  else process.exitCode = 1;
}
