#!/usr/bin/env node
/* The published site's size against GitHub Pages' 1 GB limit (vault/rules/archived-hubs-drop-their-audio.md).
   Pages publishes every file in main (.nojekyll), so the site is the sum of the tracked files. Narration and Timmy Time
   are nearly all of it: about 100-180 MB a hub. Warns from WARN_MB, fails from FAIL_MB, and either way names the hubs
   that still carry audio, biggest first, so the fix is clear: take an archived hub's audio off (the rule above).

     node tools/ci/size.js            # the tracked files as they are on disk now
     node tools/ci/size.js --quiet    # only the total, the warning or the failure

   MB here is 1,048,576 bytes, as du and GitHub count it. */
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const WARN_MB = 750, FAIL_MB = 900, LIMIT_MB = 1024;
const root = path.resolve(__dirname, '..', '..');
const MB = 1048576;
const quiet = process.argv.includes('--quiet');

const files = execFileSync('git', ['ls-files', '-z'], { cwd: root, maxBuffer: 64 * MB }).toString('utf8').split('\0').filter(Boolean);
let total = 0;
const byTop = new Map(), audio = new Map();
for (const f of files) {
  let s = 0;
  try { s = fs.statSync(path.join(root, f)).size; } catch (e) { continue; }   /* deleted on disk, not yet committed */
  total += s;
  const parts = f.split('/');
  const top = parts[0] === 'hubs' && parts.length > 2 ? `hubs/${parts[1]}` : (parts.length > 1 ? parts[0] : '(root files)');
  byTop.set(top, (byTop.get(top) || 0) + s);
  if (parts[0] === 'hubs' && parts[2] === 'audio' && /\.mp3$/.test(f)) audio.set(parts[1], (audio.get(parts[1]) || 0) + s);
}

const mb = n => (n / MB).toFixed(0) + ' MB';
const audioTotal = [...audio.values()].reduce((a, b) => a + b, 0);
console.log(`Published site: ${mb(total)} of GitHub Pages' ${LIMIT_MB} MB limit (${files.length} files; narration and Timmy Time ${mb(audioTotal)})`);
if (!quiet) {
  console.log('Largest folders:');
  [...byTop.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).forEach(([k, v]) => console.log(`  ${mb(v).padStart(7)}  ${k}`));
}
const audioList = () => [...audio.entries()].sort((a, b) => b[1] - a[1]).map(([h, v]) => `${h} ${mb(v)}`).join(', ');
const fix = `Take the audio off every archived hub (vault/rules/archived-hubs-drop-their-audio.md). Hubs with audio now: ${audioList() || 'none'}.`;

if (total / MB >= FAIL_MB) {
  console.error(`::error::The site is ${mb(total)}, over this check's ${FAIL_MB} MB line (GitHub Pages stops at ${LIMIT_MB} MB, and big publishes time out). ${fix}`);
  process.exit(1);
}
if (total / MB >= WARN_MB) console.log(`::warning::The site is ${mb(total)}, past ${WARN_MB} MB (this check fails at ${FAIL_MB} MB; GitHub Pages stops at ${LIMIT_MB} MB). ${fix}`);
else console.log(`OK: under ${WARN_MB} MB.`);
