#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const { portraitSvg } = require('../../src/boards/game/gfx/portrait.js');
const sfx = require('../../src/boards/game/audio/sfx.js');

const renders = [];
for (let seed = 1; seed <= 24; seed += 1) {
  const first = portraitSvg(seed);
  assert.equal(first, portraitSvg(seed), `seed ${seed} must render byte-for-byte identically`);
  assert.match(first, /<svg[^>]+data-age="\d+"/);
  renders.push(first);
}
assert.equal(new Set(renders).size, 24, 'the preview seeds should produce visibly varied portraits');

const options = { age:64, skinTone:7, hairStyle:4, hairTone:8, glasses:true, shirtTone:2 };
const overridden = portraitSvg(81723, options);
assert.equal(overridden, portraitSvg(81723, options), 'explicit portrait options must also be deterministic');
assert.match(overridden, /data-age="64"[^>]+data-skin-tone="7"[^>]+data-hair-style="4"[^>]+data-glasses="true"/);
assert.equal(sfx.enabled, false, 'sound must start off');
assert.equal(sfx.play('tap'), false, 'sound cues must stay silent until enabled');
assert.equal(sfx.enable(true), false, 'Node without WebAudio must remain silent');
assert.equal(sfx.enabled, false);

process.stdout.write('Portrait determinism passed for seeds 1-24 and explicit options.\n');
