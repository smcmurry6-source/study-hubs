'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const figure = require('../../src/boards/figures/perio-chart.js');

function assertWellFormedXml(source) {
  const tokens = source.match(/<[^>]*>|[^<]+/g) || [];
  assert.equal(tokens.join(''), source, 'all source text belongs to an XML token');
  const stack = [];
  const seen = new Set();
  const checkEntities = text => {
    assert.doesNotMatch(text, /&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[\da-f]+;)/i, 'XML entities are terminated');
  };

  for (const token of tokens) {
    if (!token.startsWith('<')) {
      checkEntities(token);
      continue;
    }
    if (/^<\//.test(token)) {
      const close = token.match(/^<\/([A-Za-z_][\w:.-]*)\s*>$/);
      assert.ok(close, `valid closing tag: ${token}`);
      assert.equal(stack.pop(), close[1], `matching closing tag: ${close[1]}`);
      continue;
    }

    const selfClosing = /\/>$/.test(token);
    const body = token.slice(1, selfClosing ? -2 : -1);
    const open = body.match(/^([A-Za-z_][\w:.-]*)([\s\S]*)$/);
    assert.ok(open, `valid opening tag: ${token}`);
    const [, name, tail] = open;
    let rest = tail;
    const attributes = new Set();
    while (rest.trim()) {
      rest = rest.replace(/^\s+/, '');
      const attr = rest.match(/^([A-Za-z_][\w:.-]*)\s*=\s*"([^"]*)"/);
      assert.ok(attr, `valid quoted attribute in <${name}>: ${rest}`);
      assert.ok(!attributes.has(attr[1]), `unique attribute ${attr[1]} in <${name}>`);
      attributes.add(attr[1]);
      checkEntities(attr[2]);
      rest = rest.slice(attr[0].length);
    }
    if (!selfClosing) stack.push(name);
    seen.add(name);
  }
  assert.deepEqual(stack, [], 'all tags are closed');
  assert.ok(seen.has('svg'), 'root SVG element exists');
}

function metricText(svg, metric, tooth, surface, site) {
  for (const match of svg.matchAll(/<text\b([^>]*)>([^<]*)<\/text>/g)) {
    const attrs = match[1];
    if (attrs.includes(`data-metric="${metric}"`) && attrs.includes(`data-tooth="${tooth}"`) &&
        attrs.includes(`data-surface="${surface}"`) && attrs.includes(`data-site="${site}"`)) {
      return match[2];
    }
  }
  return null;
}

test('calculates CAL as probing depth plus recession, including negative recession', () => {
  const chart = figure.svg({
    arch: 'max',
    show: { cal: true },
    teeth: [{
      n: 3,
      pd: [4, 5, 4, 3, 2, 3],
      rec: [3, 0, -2, 0, 1, -1]
    }]
  });

  assert.equal(metricText(chart, 'cal', 3, 'facial', 'MB'), '7');
  assert.equal(metricText(chart, 'cal', 3, 'facial', 'B'), '5');
  assert.equal(metricText(chart, 'cal', 3, 'facial', 'DB'), '2');
  assert.equal(metricText(chart, 'cal', 3, 'lingual', 'ML'), '3');
  assert.equal(metricText(chart, 'cal', 3, 'lingual', 'L'), '3');
  assert.equal(metricText(chart, 'cal', 3, 'lingual', 'DL'), '2');
  assertWellFormedXml(chart);
});

test('omits CAL unless requested and emits a well-formed SVG', () => {
  const chart = figure.svg({ arch: 'mand', teeth: [{ n: 19, pd: [3, 4, 3], rec: [0, 1, 0] }] });
  assert.doesNotMatch(chart, /data-metric="cal"/);
  assert.match(chart, /data-metric="pd" data-tooth="19"/);
  assertWellFormedXml(chart);
});

test('builds a data summary alt label for recorded measurements and marks', () => {
  const chart = figure.svg({
    arch: 'max',
    teeth: [
      { n: 3, pd: [6, 4, 7, null, 3], bop: [true, false], supp: [false, true], mob: 2, furc: { b: 'II' } },
      { n: 4, missing: true }
    ]
  });
  assert.match(chart, /2 of 4 recorded probing depths are over 5 mm/);
  assert.match(chart, /BOP is positive at 1 of 2 recorded sites \(50%\)/);
  assert.match(chart, /Suppuration is marked at 1 of 2 recorded sites/);
  assert.match(chart, /1 tooth is marked missing/);
  assert.match(chart, /Mobility grades recorded: 2 at 1 tooth/);
  assert.match(chart, /Furcation marks recorded: class II at 1 site/);
  assertWellFormedXml(chart);
});
