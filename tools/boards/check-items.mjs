#!/usr/bin/env node
// Scripted adversarial checker for Boards Hub questions. It uses the prompt in
// docs/boards/checker-prompt.md and bench.mjs render so item formatting stays shared.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(import.meta.url);
const BENCH = path.join(ROOT, 'tools/boards/bench.mjs');
const PROMPT_FILE = path.join(ROOT, 'docs/boards/checker-prompt.md');
const RUN1 = path.join(ROOT, 'docs/boards/bench/run1');
const FACTS_DIR = path.join(ROOT, 'src/boards/facts');
const DEFAULT_MODEL = 'qwen/qwen3.8-flash';
const CHECKS = new Set(['key', 'distractor', 'current', 'giveaway', 'ambiguity', 'rationale', 'citation', 'copy', 'style', 'tags']);
const SEVERITIES = new Set(['high', 'medium', 'low']);
const VERDICTS = new Set(['pass', 'fix', 'reject']);

export function parseVerdicts(reply, expectedIds) {
  if (typeof reply !== 'string') throw new Error('reply is not text');
  const start = reply.indexOf('[');
  if (start < 0) throw new Error('reply contains no JSON array');

  let depth = 0, inString = false, escaped = false, end = -1;
  for (let i = start; i < reply.length; i++) {
    const ch = reply[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) { end = i + 1; break; }
      if (depth < 0) break;
    }
  }
  if (end < 0) throw new Error('reply has an incomplete JSON array');

  let parsed;
  try { parsed = JSON.parse(reply.slice(start, end)); }
  catch (err) { throw new Error('invalid JSON array: ' + err.message); }
  if (!Array.isArray(parsed)) throw new Error('reply JSON is not an array');

  const seen = new Set();
  for (const v of parsed) {
    if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error('each verdict must be an object');
    if (typeof v.id !== 'string' || !v.id) throw new Error('each verdict needs a string id');
    if (seen.has(v.id)) throw new Error('duplicate verdict id: ' + v.id);
    seen.add(v.id);
    if (!VERDICTS.has(v.verdict)) throw new Error('invalid verdict for ' + v.id);
    if (!Array.isArray(v.issues)) throw new Error('issues must be an array for ' + v.id);
    for (const issue of v.issues) {
      if (!issue || !CHECKS.has(issue.check)) throw new Error('invalid issue check for ' + v.id);
      if (!SEVERITIES.has(issue.severity)) throw new Error('invalid issue severity for ' + v.id);
      if (typeof issue.detail !== 'string' || typeof issue.suggestion !== 'string') {
        throw new Error('each issue needs string detail and suggestion for ' + v.id);
      }
    }
  }
  if (expectedIds) {
    const expected = new Set(expectedIds);
    for (const id of seen) if (!expected.has(id)) throw new Error('unexpected verdict id: ' + id);
    for (const id of expected) if (!seen.has(id)) throw new Error('missing verdict id: ' + id);
  }
  return parsed;
}

function helpText() {
  return [
    'Usage:',
    '  node tools/boards/check-items.mjs --unit <unit> [--ids a,b] [--model <openrouter id>] [--passes 1|2] [--batch 10] [--out <dir>] [--max-usd 2] [--dry-run]',
    '  node tools/boards/check-items.mjs --bench [--model <openrouter id>] [--passes 1|2] [--batch 10] [--out <dir>] [--max-usd 2] [--dry-run]',
    '',
    'Options:',
    '  --unit        Source unit directory under src/boards/units; expects items.js.',
    '  --ids         Comma-separated item IDs. Case-set siblings are included for context.',
    '  --bench       Check the planted-error batches from docs/boards/bench/run1.',
    '  --model       OpenRouter model ID (default: ' + DEFAULT_MODEL + '). Anthropic models are rejected.',
    '  --passes      1 or 2. Pass 2 independently checks items citing high-risk facts.',
    '  --batch       Maximum items per API request (default: 10; case sets stay together).',
    '  --out         Output directory (default: docs/boards/verify/<unit-or-bench>-<run>).',
    '  --max-usd     Stop before another request once usage cost reaches this cap (default: 2).',
    '  --dry-run     Render requests and print character/token estimates without calling OpenRouter.',
    '  --help        Show this help.',
    '',
    'Requires Node 22 and OPENROUTER_API_KEY in the environment for non-dry runs.',
  ].join('\n');
}

function parseArgs(argv) {
  const options = {};
  const booleans = new Set(['help', 'bench', 'dry-run']);
  const known = new Set(['help', 'bench', 'dry-run', 'unit', 'ids', 'model', 'passes', 'batch', 'out', 'max-usd']);
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) throw new Error('unexpected argument: ' + arg);
    const name = arg.slice(2);
    if (!known.has(name)) throw new Error('unknown option: ' + arg);
    if (booleans.has(name)) { options[name] = true; continue; }
    if (!argv[i + 1] || argv[i + 1].startsWith('--')) throw new Error('missing value for ' + arg);
    options[name] = argv[++i];
  }
  return options;
}

function validateOptions(o) {
  if (o.help) return;
  if (!!o.bench === !!o.unit) throw new Error('choose exactly one of --bench or --unit <unit>');
  o.passes = o.passes === undefined ? 1 : Number(o.passes);
  o.batch = o.batch === undefined ? 10 : Number(o.batch);
  o['max-usd'] = o['max-usd'] === undefined ? 2 : Number(o['max-usd']);
  o.model = o.model || DEFAULT_MODEL;
  if (![1, 2].includes(o.passes)) throw new Error('--passes must be 1 or 2');
  if (!Number.isInteger(o.batch) || o.batch < 1) throw new Error('--batch must be a positive integer');
  if (!Number.isFinite(o['max-usd']) || o['max-usd'] < 0) throw new Error('--max-usd must be a nonnegative number');
  if (/anthropic/i.test(o.model)) throw new Error('--model must name a non-Anthropic model');
  if (o.unit && !/^[a-z0-9][a-z0-9_-]*$/i.test(o.unit)) throw new Error('--unit must be a simple unit name');
  if (o.bench && o.ids) throw new Error('--ids applies to --unit, not --bench');
}

function outputPath(o) {
  if (o.out) return path.resolve(o.out);
  const run = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '-').replace('Z', '') + '-' + process.pid;
  return path.join(ROOT, 'docs/boards/verify', (o.unit || 'bench') + '-' + run);
}

function prepareOutput(dir) {
  if (fs.existsSync(dir) && fs.readdirSync(dir).length) throw new Error('output directory is not empty: ' + dir);
  fs.mkdirSync(dir, { recursive: true });
}

function loadUnitData(unit) {
  const file = path.join(ROOT, 'src/boards/units', unit, 'items.js');
  if (!fs.existsSync(file)) throw new Error('item file not found: ' + file);
  const data = require(file);
  if (!data || !Array.isArray(data.items) || !Array.isArray(data.cases)) {
    throw new Error(file + ' must export { items, cases } for bench.mjs render');
  }
  return { file, data };
}

function loadFacts() {
  const facts = new Map();
  for (const file of fs.readdirSync(FACTS_DIR).filter(n => n.endsWith('.json') && n !== 'sources.json')) {
    const doc = JSON.parse(fs.readFileSync(path.join(FACTS_DIR, file), 'utf8'));
    for (const fact of doc.facts || []) facts.set(fact.id, fact);
  }
  return facts;
}

function hasHighRiskFact(item, facts) {
  return (item?.refs || []).some(id => facts.get(id)?.risk === 'high');
}

function sourceGroups(data, selectedIds) {
  const wanted = new Set(selectedIds);
  const itemById = new Map(data.items.map(item => [item.id, item]));
  const caseById = new Map(data.cases.map(c => [c.id, c]));
  const done = new Set(), groups = [];
  for (const item of data.items) {
    if (!wanted.has(item.id) || done.has(item.id)) continue;
    const c = item.case && caseById.get(item.case);
    const members = c ? c.items.map(id => itemById.get(id)) : [item];
    if (members.some(x => !x)) throw new Error('case set contains an unknown item: ' + (c ? c.id : item.id));
    for (const member of members) done.add(member.id);
    groups.push({ ids: members.map(x => x.id) });
  }
  const missing = [...wanted].filter(id => !itemById.has(id));
  if (missing.length) throw new Error('unknown item ID(s): ' + missing.join(', '));
  return groups;
}

function chunkGroups(groups, maxItems) {
  const chunks = [];
  let current = [], count = 0;
  for (const group of groups) {
    if (current.length && count + group.ids.length > maxItems) {
      chunks.push(current); current = []; count = 0;
    }
    current.push(group); count += group.ids.length;
    if (group.ids.length > maxItems) { chunks.push(current); current = []; count = 0; }
  }
  if (current.length) chunks.push(current);
  return chunks;
}

function flattenGroups(groups) {
  return [...new Set(groups.flatMap(group => group.ids))];
}

function renderWithBench(itemsFile, ids, name, tempRoot) {
  const dir = fs.mkdtempSync(path.join(tempRoot, 'render-'));
  try {
    execFileSync(process.execPath, [
      BENCH, 'render', '--items', itemsFile, '--ids', ids.join(','),
      '--out', dir, '--name', name, '--rng', '7',
    ], { cwd: ROOT, stdio: 'pipe' });
    const md = fs.readFileSync(path.join(dir, 'batch-' + name + '.md'), 'utf8');
    const key = JSON.parse(fs.readFileSync(path.join(dir, 'key-' + name + '.json'), 'utf8'));
    return { md, key };
  } catch (err) {
    const detail = err.stderr ? String(err.stderr).trim() : err.message;
    throw new Error('bench.mjs render failed: ' + detail);
  }
}

function promptFor(template, batchContent) {
  const tick = String.fromCharCode(96);
  const marker = 'INPUT: read exactly one file: ' + tick + '{BATCH}' + tick + '.';
  if (!template.includes(marker)) throw new Error('checker prompt is missing its INPUT batch placeholder');
  const filled = template.replace(marker, 'INPUT: read exactly one file:\n\n' + batchContent.trimEnd() + '\n');
  const outMarker = tick + '{OUT}' + tick;
  const outIndex = filled.lastIndexOf(outMarker);
  if (outIndex < 0) throw new Error('checker prompt is missing its OUTPUT path placeholder');
  return filled.slice(0, outIndex) + 'the response body' + filled.slice(outIndex + outMarker.length);
}

function splitBenchmarkBatch(markdown, key) {
  const markers = [];
  const re = /^(## Case set[^\r\n]*|### ([A-Za-z0-9_-]+))[ \t]*$/gm;
  let match;
  while ((match = re.exec(markdown))) {
    markers.push({ index: match.index, kind: match[2] ? 'item' : 'case', id: match[2] || null });
  }
  if (!markers.length) throw new Error('benchmark batch has no rendered items');

  const header = markdown.slice(0, markers[0].index).trimEnd() + '\n\n';
  const groups = [];
  let pendingCase = null, activeCase = null;
  const finishCase = () => {
    if (activeCase) {
      groups.push({ ids: activeCase.ids, text: activeCase.prefix + activeCase.parts.join('\n\n'), targets: activeCase.targets });
      activeCase = null;
    }
  };

  for (let i = 0; i < markers.length; i++) {
    const marker = markers[i];
    if (marker.kind === 'case') {
      finishCase();
      pendingCase = marker.index;
      continue;
    }
    const info = key[marker.id];
    if (!info) throw new Error('benchmark key is missing ' + marker.id);
    const next = markers[i + 1];
    const itemText = markdown.slice(marker.index, next ? next.index : markdown.length).trimEnd();
    if (info.inCase) {
      if (!activeCase) {
        if (pendingCase === null) throw new Error('case item has no case-set header: ' + marker.id);
        activeCase = { prefix: markdown.slice(pendingCase, marker.index).trimEnd() + '\n\n', ids: [], targets: [], parts: [] };
      }
      activeCase.ids.push(marker.id);
      activeCase.parts.push(itemText);
      pendingCase = null;
    } else {
      finishCase();
      groups.push({ ids: [marker.id], text: itemText, targets: [marker.id] });
      pendingCase = null;
    }
  }
  finishCase();
  return { header, groups };
}

function chunkBenchmarkText(header, groups, maxItems) {
  return chunkGroups(groups, maxItems).map((chunk, i) => ({
    groups: chunk,
    ids: flattenGroups(chunk),
    targetIds: [...new Set(chunk.flatMap(g => g.targets || g.ids))],
    text: header + chunk.map(g => g.text).join('\n\n') + '\n',
    chunkNumber: i + 1,
  }));
}

function buildUnitPlan(unit, idsArg, facts, maxItems) {
  const { file, data } = loadUnitData(unit);
  const selected = idsArg ? idsArg.split(',').map(x => x.trim()).filter(Boolean) : data.items.map(x => x.id);
  if (new Set(selected).size !== selected.length) throw new Error('--ids contains duplicate IDs');
  const groups = sourceGroups(data, selected);
  if (!groups.length) throw new Error('no items selected');
  const includedIds = flattenGroups(groups);
  const itemById = new Map(data.items.map(item => [item.id, item]));
  const highRiskIds = new Set(includedIds.filter(id => hasHighRiskFact(itemById.get(id), facts)));
  return {
    unit, file, data, groups, highRiskIds, itemById,
    pass1Chunks: chunkGroups(groups, maxItems),
    pass2Groups: groups.map(g => ({ ids: g.ids.filter(id => highRiskIds.has(id)) })).filter(g => g.ids.length),
  };
}

function readBenchPlan(facts, maxItems) {
  const keyFile = path.join(RUN1, 'key.json');
  const key = JSON.parse(fs.readFileSync(keyFile, 'utf8'));
  const itemData = require(path.join(RUN1, 'items.js'));
  const itemById = new Map(itemData.items.map(item => [item.id, item]));
  const highRiskIds = new Set();
  const batches = {};
  for (const side of ['A', 'B']) {
    const markdown = fs.readFileSync(path.join(RUN1, 'batch-' + side + '.md'), 'utf8');
    const parsed = splitBenchmarkBatch(markdown, key);
    const groups = parsed.groups.map(g => {
      const targets = g.ids.filter(qid => {
        const item = itemById.get(key[qid].item);
        if (item && hasHighRiskFact(item, facts)) { highRiskIds.add(qid); return true; }
        return false;
      });
      return { ...g, targets };
    });
    batches[side] = {
      key, groups,
      pass1Chunks: chunkBenchmarkText(parsed.header, groups, maxItems),
      pass2Groups: groups.filter(g => g.targets.length),
      pass2Header: parsed.header,
    };
  }
  return { key, keyFile, itemById, highRiskIds, batches };
}

function findCost(usage) {
  const values = [usage?.cost, usage?.cost_details?.upstream_inference_cost, usage?.cost_details?.total_cost];
  return values.find(v => typeof v === 'number' && Number.isFinite(v) && v >= 0);
}

function metric(usage, snake, camel) {
  const n = usage?.[snake] ?? usage?.[camel];
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 ? n : null;
}

function addUsage(state, usage, label) {
  if (!usage || typeof usage !== 'object') throw new Error('OpenRouter response did not include usage; cannot enforce --max-usd');
  const cost = findCost(usage);
  if (cost === undefined) throw new Error('OpenRouter usage did not include cost; cannot enforce --max-usd');
  const prompt = metric(usage, 'prompt_tokens', 'promptTokens');
  const completion = metric(usage, 'completion_tokens', 'completionTokens');
  const total = metric(usage, 'total_tokens', 'totalTokens');
  state.usage.requests++;
  state.usage.promptTokens += prompt ?? 0;
  state.usage.completionTokens += completion ?? 0;
  state.usage.totalTokens += total ?? ((prompt ?? 0) + (completion ?? 0));
  state.usage.estimatedCostUsd += cost;
  state.requestUsage.push({ label, promptTokens: prompt, completionTokens: completion, totalTokens: total, costUsd: cost });
}

function responseText(payload) {
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.map(part => typeof part?.text === 'string' ? part.text : '').join('');
  throw new Error('OpenRouter response did not contain message text');
}

function redact(message, apiKey) {
  return String(message).split(apiKey).join('[redacted]');
}

async function requestVerdicts(state, label, content, expectedIds) {
  const prompt = promptFor(state.promptTemplate, content);
  for (let attempt = 1; attempt <= 2; attempt++) {
    let response;
    try {
      response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + state.apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: state.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          max_tokens: 12000,
          usage: { include: true },
          provider: { ignore: ['Anthropic'] },
        }),
        signal: AbortSignal.timeout(180000),
      });
    } catch (err) {
      throw new Error('OpenRouter request failed for ' + label + ': ' + redact(err.message, state.apiKey));
    }

    let payload;
    try { payload = await response.json(); }
    catch { throw new Error('OpenRouter returned non-JSON HTTP ' + response.status + ' for ' + label); }
    if (!response.ok) {
      const message = payload?.error?.message || ('HTTP ' + response.status);
      throw new Error('OpenRouter request failed for ' + label + ': ' + redact(message, state.apiKey));
    }

    addUsage(state, payload.usage, label + (attempt > 1 ? '-retry' : ''));
    try { return parseVerdicts(responseText(payload), expectedIds); }
    catch (err) {
      if (attempt === 2) throw new Error('malformed checker reply twice for ' + label + ': ' + err.message);
      if (state.usage.estimatedCostUsd >= state.maxUsd) {
        state.complete = false;
        state.stopReason = '--max-usd cap reached before malformed-reply retry';
        throw new Error('malformed checker reply for ' + label + '; cost cap prevents the retry');
      }
      console.warn('Malformed JSON reply for ' + label + '; retrying once.');
    }
  }
  throw new Error('unreachable request state');
}

function requestSize(text) {
  const bytes = Buffer.byteLength(text, 'utf8');
  return { chars: text.length, bytes, approxTokens: Math.ceil(bytes / 4) };
}

function printDryRequest(label, prompt, count) {
  const size = requestSize(prompt);
  console.log(label + ': ' + count + ' item(s), ' + size.chars + ' chars, ' + size.bytes +
    ' UTF-8 bytes, ~' + size.approxTokens + ' input tokens');
}

function initialState(options, outDir, promptTemplate) {
  return {
    model: options.model,
    unit: options.unit || null,
    benchmark: !!options.bench,
    passes: options.passes,
    batchSize: options.batch,
    maxUsd: options['max-usd'],
    outDir,
    promptTemplate,
    apiKey: process.env.OPENROUTER_API_KEY,
    usage: { requests: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCostUsd: 0 },
    requestUsage: [],
    items: new Map(),
    complete: true,
    stopReason: null,
  };
}

function rank(verdict) {
  return verdict === 'reject' ? 2 : verdict === 'fix' ? 1 : 0;
}

function addItemVerdict(state, key, verdict, pass, extra = {}) {
  let row = state.items.get(key);
  if (!row) {
    row = { id: extra.itemId || key, issues: [], passes: [], highRisk: !!extra.highRisk, verdict: 'pass' };
    if (extra.benchmarkId) row.benchmarkId = extra.benchmarkId;
    state.items.set(key, row);
  }
  row.highRisk ||= !!extra.highRisk;
  if (extra.benchmarkId) row.benchmarkId = extra.benchmarkId;
  row.passes.push(pass);
  const existing = new Set(row.issues.map(issue => JSON.stringify(issue)));
  for (const issue of verdict.issues) {
    const encoded = JSON.stringify(issue);
    if (!existing.has(encoded)) { row.issues.push(issue); existing.add(encoded); }
  }
  if (rank(verdict.verdict) > rank(row.verdict)) row.verdict = verdict.verdict;
  if (row.verdict !== 'reject' && row.issues.some(issue => issue.severity === 'medium' || issue.severity === 'high')) row.verdict = 'fix';
}

function addRenderedResults(state, rendered, verdicts, pass, onlyItemIds, highRiskIds) {
  const renderToItem = new Map(Object.entries(rendered.key).map(([renderId, info]) => [renderId, info.item]));
  const targets = onlyItemIds ? new Set(onlyItemIds) : null;
  for (const verdict of verdicts) {
    const itemId = renderToItem.get(verdict.id);
    if (!itemId || (targets && !targets.has(itemId))) continue;
    addItemVerdict(state, itemId, verdict, pass, { highRisk: highRiskIds.has(itemId) });
  }
}

function summaryData(state) {
  const items = [...state.items.values()].map(row => ({
    id: row.id,
    ...(row.benchmarkId ? { benchmarkId: row.benchmarkId } : {}),
    highRisk: row.highRisk,
    verdict: row.verdict,
    flags: [...new Set(row.issues.map(issue => issue.check))],
    issues: row.issues,
    passes: [...new Set(row.passes)],
  }));
  return {
    model: state.model,
    unit: state.unit,
    benchmark: state.benchmark,
    passesRequested: state.passes,
    batchSize: state.batchSize,
    maxUsd: state.maxUsd,
    complete: state.complete,
    stopReason: state.stopReason,
    items,
    usage: {
      requests: state.usage.requests,
      promptTokens: state.usage.promptTokens,
      completionTokens: state.usage.completionTokens,
      totalTokens: state.usage.totalTokens,
      estimatedCostUsd: Number(state.usage.estimatedCostUsd.toFixed(8)),
      requestDetails: state.requestUsage,
    },
  };
}

function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
}

function canRequest(state) {
  if (state.usage.estimatedCostUsd >= state.maxUsd) {
    state.complete = false;
    state.stopReason = '--max-usd cap reached before next request';
    return false;
  }
  return true;
}

async function runUnit(options, state, plan, tempRoot) {
  for (let i = 0; i < plan.pass1Chunks.length; i++) {
    const groupChunk = plan.pass1Chunks[i];
    const batchNo = i + 1;
    const name = 'B' + String(batchNo).padStart(2, '0');
    const ids = flattenGroups(groupChunk);
    const rendered = renderWithBench(plan.file, ids, name, tempRoot);
    const expectedIds = Object.keys(rendered.key);
    const label = 'batch ' + name;
    if (!canRequest(state)) break;
    const verdicts = await requestVerdicts(state, label, rendered.md, expectedIds);
    writeJson(path.join(state.outDir, 'verdicts-' + String(batchNo).padStart(2, '0') + '.json'), verdicts);
    addRenderedResults(state, rendered, verdicts, 1, null, plan.highRiskIds);

    if (state.passes !== 2) continue;
    const highRiskInChunk = new Set(ids.filter(id => plan.highRiskIds.has(id)));
    const pass2Groups = plan.pass2Groups
      .map(group => ({ ids: group.ids.filter(id => highRiskInChunk.has(id)) }))
      .filter(group => group.ids.length);
    const pass2Chunks = chunkGroups(pass2Groups, options.batch);
    const pass2Results = [];
    for (let p = 0; p < pass2Chunks.length; p++) {
      const targetIds = flattenGroups(pass2Chunks[p]);
      const pass2Name = name + 'P' + String(p + 1).padStart(2, '0');
      const renderedAgain = renderWithBench(plan.file, targetIds, pass2Name, tempRoot);
      const expectedAgain = Object.keys(renderedAgain.key);
      if (!canRequest(state)) break;
      const second = await requestVerdicts(state, label + ' pass 2.' + (p + 1), renderedAgain.md, expectedAgain);
      const targetSet = new Set(targetIds);
      pass2Results.push(...second.filter(v => targetSet.has(renderedAgain.key[v.id]?.item)));
      addRenderedResults(state, renderedAgain, second, 2, targetIds, plan.highRiskIds);
    }
    if (pass2Results.length) {
      writeJson(path.join(state.outDir, 'verdicts-' + String(batchNo).padStart(2, '0') + '-pass2.json'), pass2Results);
    }
  }
}

function orderedValues(map, key, side, onlyIds) {
  return Object.keys(key)
    .filter(id => id.startsWith(side) && map.has(id) && (!onlyIds || onlyIds.has(id)))
    .map(id => map.get(id));
}

async function runBench(options, state, plan) {
  fs.copyFileSync(plan.keyFile, path.join(state.outDir, 'key.json'));
  const pass1 = { A: new Map(), B: new Map() };
  const pass2 = { A: new Map(), B: new Map() };

  for (const side of ['A', 'B']) {
    const batch = plan.batches[side];
    for (const request of batch.pass1Chunks) {
      const label = 'benchmark ' + side + '-' + String(request.chunkNumber).padStart(2, '0');
      if (!canRequest(state)) break;
      const verdicts = await requestVerdicts(state, label, request.text, request.ids);
      for (const verdict of verdicts) {
        pass1[side].set(verdict.id, verdict);
        const itemId = plan.key[verdict.id].item;
        addItemVerdict(state, verdict.id, verdict, 1, {
          itemId, highRisk: plan.highRiskIds.has(verdict.id), benchmarkId: verdict.id,
        });
      }
      writeJson(path.join(state.outDir, 'verdicts-' + side + '.json'), orderedValues(pass1[side], batch.key, side));
    }

    if (state.passes !== 2 || !state.complete) continue;
    const requests = chunkBenchmarkText(batch.pass2Header, batch.pass2Groups, options.batch);
    for (const request of requests) {
      const label = 'benchmark ' + side + '-pass2-' + String(request.chunkNumber).padStart(2, '0');
      if (!canRequest(state)) break;
      const verdicts = await requestVerdicts(state, label, request.text, request.ids);
      for (const verdict of verdicts) {
        if (!plan.highRiskIds.has(verdict.id)) continue;
        pass2[side].set(verdict.id, verdict);
        const itemId = plan.key[verdict.id].item;
        addItemVerdict(state, verdict.id, verdict, 2, { itemId, highRisk: true, benchmarkId: verdict.id });
      }
      writeJson(path.join(state.outDir, 'verdicts-' + side + '-pass2.json'),
        orderedValues(pass2[side], batch.key, side, plan.highRiskIds));
    }
  }
}

function benchmarkRates(state, plan) {
  let seeded = 0, seededCaught = 0, clean = 0, falseFlags = 0;
  const results = new Map([...state.items.values()].map(row => [row.benchmarkId, row]));
  for (const [id, item] of Object.entries(plan.key)) {
    const row = results.get(id);
    if (item.seeded) {
      seeded++;
      if (row && row.verdict !== 'pass') seededCaught++;
    } else {
      clean++;
      if (row && row.verdict !== 'pass') falseFlags++;
    }
  }
  const pct = (n, d) => d ? (100 * n / d).toFixed(1) + '%' : 'n/a';
  return { seeded, seededCaught, catchRate: pct(seededCaught, seeded), clean, falseFlags, falseFlagRate: pct(falseFlags, clean) };
}

function printTotals(state) {
  console.log('Usage: ' + state.usage.promptTokens + ' prompt + ' + state.usage.completionTokens +
    ' completion = ' + state.usage.totalTokens + ' tokens; estimated cost $' +
    state.usage.estimatedCostUsd.toFixed(4) + ' across ' + state.usage.requests + ' request(s).');
}

function printBenchDryRun(options, plan, promptTemplate) {
  for (const side of ['A', 'B']) {
    const batch = plan.batches[side];
    for (const request of batch.pass1Chunks) {
      printDryRequest('benchmark ' + side + '-' + String(request.chunkNumber).padStart(2, '0'),
        promptFor(promptTemplate, request.text), request.ids.length);
    }
    if (options.passes === 2) {
      const requests = chunkBenchmarkText(batch.pass2Header, batch.pass2Groups, options.batch);
      for (const request of requests) {
        printDryRequest('benchmark ' + side + '-pass2-' + String(request.chunkNumber).padStart(2, '0'),
          promptFor(promptTemplate, request.text), request.ids.length);
      }
    }
  }
}

function printUnitDryRun(options, plan, promptTemplate, tempRoot) {
  for (let i = 0; i < plan.pass1Chunks.length; i++) {
    const ids = flattenGroups(plan.pass1Chunks[i]);
    const rendered = renderWithBench(plan.file, ids, 'D' + String(i + 1).padStart(2, '0'), tempRoot);
    printDryRequest('batch ' + String(i + 1).padStart(2, '0'),
      promptFor(promptTemplate, rendered.md), Object.keys(rendered.key).length);
  }
  if (options.passes === 2) {
    const chunks = chunkGroups(plan.pass2Groups, options.batch);
    for (let i = 0; i < chunks.length; i++) {
      const ids = flattenGroups(chunks[i]);
      const rendered = renderWithBench(plan.file, ids, 'DP' + String(i + 1).padStart(2, '0'), tempRoot);
      printDryRequest('pass 2 batch ' + String(i + 1).padStart(2, '0'),
        promptFor(promptTemplate, rendered.md), Object.keys(rendered.key).length);
    }
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help || process.argv.length <= 2) { console.log(helpText()); return; }
  validateOptions(options);

  const promptTemplate = fs.readFileSync(PROMPT_FILE, 'utf8');
  const outDir = outputPath(options);
  const facts = loadFacts();
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), options['dry-run'] ? 'boards-checker-dry-' : 'boards-checker-'));

  try {
    if (options['dry-run']) {
      if (options.bench) printBenchDryRun(options, readBenchPlan(facts, options.batch), promptTemplate);
      else printUnitDryRun(options, buildUnitPlan(options.unit, options.ids, facts, options.batch), promptTemplate, tempRoot);
      return;
    }

    if (!process.env.OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY is not set in the environment');
    prepareOutput(outDir);
    const state = initialState(options, outDir, promptTemplate);
    let plan = null, failure = null;
    try {
      if (options.bench) {
        plan = readBenchPlan(facts, options.batch);
        await runBench(options, state, plan);
      } else {
        plan = buildUnitPlan(options.unit, options.ids, facts, options.batch);
        await runUnit(options, state, plan, tempRoot);
      }
    } catch (err) {
      failure = err;
      state.complete = false;
      state.stopReason = err.message;
    } finally {
      if (options.bench && plan) {
        const summary = summaryData(state);
        summary.benchmarkRates = benchmarkRates(state, plan);
        writeJson(path.join(outDir, 'summary.json'), summary);
      } else {
        writeJson(path.join(outDir, 'summary.json'), summaryData(state));
      }
      printTotals(state);
    }

    if (failure) throw failure;
    if (options.bench && state.complete) {
      const rates = benchmarkRates(state, plan);
      console.log('Benchmark catch rate: ' + rates.seededCaught + '/' + rates.seeded + ' (' + rates.catchRate + ')');
      console.log('Benchmark false-flag rate: ' + rates.falseFlags + '/' + rates.clean +
        ' clean items (' + rates.falseFlagRate + ')');
    }
    if (!state.complete) console.log('Stopped: ' + state.stopReason);
    else console.log('Wrote results to ' + outDir);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(err => {
    console.error('check-items: ' + err.message);
    process.exitCode = 1;
  });
}
