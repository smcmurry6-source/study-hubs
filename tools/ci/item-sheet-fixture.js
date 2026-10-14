#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..', '..');
const script = path.join(root, 'tools', 'boards', 'item-sheet.js');
fs.mkdirSync(path.join(root, '.cache'), { recursive: true });
const fixtureDir = fs.mkdtempSync(path.join(root, '.cache', 'item-sheet-fixture-'));
const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'item-sheet-out-'));
const itemFile = path.join(fixtureDir, 'items.js');
const items = {
  items: [
    {
      id: 'fx-wanted', lec: 'fixture', type: 'mcq', stem: 'Which choice is longest?',
      choices: ['Short', 'The longest answer'], answer: 1, why: ['', 'Correct.'],
      ex: 'This sentence cites EN-2. This sentence has no inline fact citation.',
      cue: 'A small cue.', refs: ['ITEM-SHEET-MISSING-999', 'EN-2'], cc: 'CC1',
    },
    {
      id: 'fx-other', lec: 'other', type: 'mcq', stem: 'Filtered by unit.',
      choices: ['A', 'B'], answer: 0, why: ['Correct.', 'No.'], ex: 'Another explanation.', refs: [],
    },
  ],
  cases: [],
};

try {
  fs.writeFileSync(itemFile, `module.exports = ${JSON.stringify(items, null, 2)};\n`);
  const result = spawnSync(process.execPath, [
    script, 'fixture', '--items', itemFile, '--ids', 'fx-wanted', '--changed-since', 'HEAD', '--out', outDir,
  ], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const markdown = fs.readFileSync(path.join(outDir, 'fixture.md'), 'utf8');
  assert.match(markdown, /## fx-wanted/);
  assert.doesNotMatch(markdown, /## fx-other/);
  assert.match(markdown, /Cited fact ITEM-SHEET-MISSING-999 is missing/);
  assert.match(markdown, /Cited fact EN-2 has status partial, not verified/);
  assert.match(markdown, /Explanation sentence 2 has no inline fact citation/);
  assert.match(markdown, /Key choice B is the longest choice/);
  assert.match(markdown, /Choice A has an empty why line/);
  assert.match(markdown, /Summary: 1 items?;/);
  console.log('item-sheet fixture passed');
} finally {
  fs.rmSync(fixtureDir, { recursive: true, force: true });
  fs.rmSync(outDir, { recursive: true, force: true });
}
