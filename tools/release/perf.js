#!/usr/bin/env node
// Performance budgets (RELEASE_TEST_PLAN.md, "Performance"), on a preview served gzipped like GitHub Pages, as a
// mid-range phone on a slow 4G connection (Lighthouse's mobile profile: 150 ms round trip, 1.6 Mbps down, 750 kbps
// up, CPU slowed 4x). For the dashboard, About and every hub it measures what a student waits for:
//   bytes over the wire (narration and video excluded: they stream on demand), requests, first contentful paint,
//   largest contentful paint, total blocking time (long tasks past 50 ms) and JavaScript heap.
// Bytes and requests are exact, so they fail at their budget; timings wobble on shared CI machines, so they fail only
// past 1.5x their budget and warn before that. Budgets: tools/release/budgets.json (--update sets them from this run
// with headroom: use it when a deliberate change, approved in its PR, moves a number).
//   node tools/release/perf.js [--update] [--page hubs/occlusion/]
'use strict';
const fs = require('fs'), path = require('path');
const L = require('./lib');
const { start } = require('../preview/serve');
const BUDGET_FILE = path.join(__dirname, 'budgets.json');
const UPDATE = process.argv.includes('--update');
const ONLY = (i => i > 0 ? process.argv[i + 1] : null)(process.argv.indexOf('--page'));
const NET = { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 };

async function measure(browser, url){
  const ctx = await browser.newContext({ viewport: { width: 412, height: 823 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1.75, serviceWorkers: 'block' });
  await L.guard(ctx);
  await ctx.addInitScript(() => {
    window.__perf = { lcp: 0, tbt: 0 };
    try { new PerformanceObserver(l => l.getEntries().forEach(e => { window.__perf.lcp = e.startTime; })).observe({ type: 'largest-contentful-paint', buffered: true }); } catch (e) {}
    try { new PerformanceObserver(l => l.getEntries().forEach(e => { window.__perf.tbt += Math.max(0, e.duration - 50); })).observe({ type: 'longtask', buffered: true }); } catch (e) {}
    try { localStorage.setItem('sh_tour', 'no'); localStorage.setItem('sh_tour_hub', 'no'); } catch (e) {}
  });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', NET);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  let bytes = 0, requests = 0, html = 0; const types = {}, previewOnly = {};
  cdp.on('Network.responseReceived', e => { types[e.requestId] = e.type; if (/\/__preview\//.test(e.response.url)) previewOnly[e.requestId] = 1; if (e.type === 'Document' && !html) html = -1; });
  cdp.on('Network.loadingFinished', e => {
    /* the preview's own runtime (/__preview/preview.js, fixtures included) is injected into previews only: students never
       download it, so it doesn't count against a page's budget */
    const t = types[e.requestId]; if (t === 'Media' || previewOnly[e.requestId]) return;
    requests++; bytes += e.encodedDataLength;
    if (t === 'Document' && html === -1) html = e.encodedDataLength;
  });
  const t0 = Date.now();
  await page.goto(url, { waitUntil: 'load', timeout: 120000 });
  const loadWall = Date.now() - t0;
  await page.waitForTimeout(3000);   /* let LCP and the long tasks after load settle */
  const m = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] || {}, fcp = performance.getEntriesByName('first-contentful-paint')[0];
    return { fcp: fcp ? fcp.startTime : null, lcp: window.__perf.lcp || null, tbt: window.__perf.tbt, dcl: nav.domContentLoadedEventEnd, load: nav.loadEventEnd,
      heap: performance.memory ? performance.memory.usedJSHeapSize : null };
  });
  await ctx.close();
  return { kb: Math.round(bytes / 1024), htmlKb: Math.round(Math.max(0, html) / 1024), requests, fcp: Math.round(m.fcp || 0), lcp: Math.round(m.lcp || 0), tbt: Math.round(m.tbt || 0),
    load: Math.round(m.load || loadWall), heapMb: m.heap ? Math.round(m.heap / 1048576) : null };
}

(async () => {
  const budgets = fs.existsSync(BUDGET_FILE) ? JSON.parse(fs.readFileSync(BUDGET_FILE, 'utf8')) : { pages: {} };
  const srv = await start({});
  const browser = await L.launch();
  /* the redesign's new versions (hubs/<id>/next/) are measured too, before they replace the live hubs */
  const next = L.hubs().filter(h => fs.existsSync(path.join(L.ROOT, 'hubs', h, 'next', 'index.html'))).map(h => `hubs/${h}/next/`);
  const pages = ['index.html', ...(fs.existsSync(path.join(L.ROOT, 'next', 'index.html')) ? ['next/'] : []), 'about/', ...L.hubs().map(h => `hubs/${h}/`), ...next].filter(p => !ONLY || p === ONLY);
  const results = {}, problems = [], notes = [];
  for (const p of pages) {
    results[p] = await measure(browser, srv.url + p + (p.startsWith('hubs/') || p === 'index.html' || p === 'next/' ? '?persona=returning' : ''));
    const r = results[p];
    notes.push(`${p.padEnd(32)} ${String(r.kb).padStart(5)} KB (${r.htmlKb} KB page) ${String(r.requests).padStart(3)} requests · FCP ${r.fcp} ms · LCP ${r.lcp} ms · TBT ${r.tbt} ms · load ${r.load} ms${r.heapMb ? ' · heap ' + r.heapMb + ' MB' : ''}`);
  }
  await browser.close(); srv.server.close();
  if (UPDATE) {
    const up = n => Math.ceil(n / 500) * 500;
    const next = Object.assign({}, budgets.pages);
    for (const [p, r] of Object.entries(results)) next[p] = { kb: Math.ceil(r.kb * 1.2 / 10) * 10, requests: r.requests + 6, fcp: up(Math.max(r.fcp * 1.5, 1500)), lcp: up(Math.max(r.lcp * 1.5, 2500)), tbt: up(Math.max(r.tbt * 1.5, 500)) };
    fs.writeFileSync(BUDGET_FILE, JSON.stringify({ about: 'Per-page budgets for tools/release/perf.js, measured as a mid-range phone on slow 4G (see the script). kb = bytes over the wire without narration or video; fcp, lcp, tbt in ms. Raise one only with a reason in the PR that Sam approves; lower them when a page gets lighter.', updated: new Date().toISOString().slice(0, 10), profile: 'slow 4G, CPU 4x, 412x823 phone', pages: next }, null, 1) + '\n');
    notes.push(`budgets written: ${path.relative(L.ROOT, BUDGET_FILE)}`);
  } else {
    for (const [p, r] of Object.entries(results)) {
      const b = budgets.pages[p];
      if (!b) { problems.push(`${p}: no budget yet (run with --update in the PR that adds the page)`); continue; }
      if (r.kb > b.kb) problems.push(`${p}: ${r.kb} KB over the wire, budget ${b.kb} KB`);
      if (r.requests > b.requests) problems.push(`${p}: ${r.requests} requests, budget ${b.requests}`);
      for (const k of ['fcp', 'lcp', 'tbt']) {
        if (r[k] > b[k] * 1.5) problems.push(`${p}: ${k.toUpperCase()} ${r[k]} ms, more than 1.5x its ${b[k]} ms budget`);
        else if (r[k] > b[k]) notes.push(`warning: ${p}: ${k.toUpperCase()} ${r[k]} ms is over its ${b[k]} ms budget (timings vary; rerun before acting)`);
      }
    }
  }
  fs.writeFileSync(path.join(L.outDir('perf'), 'perf.json'), JSON.stringify(results, null, 1));
  process.exit(L.report('performance budgets', problems, notes));
})().catch(e => { console.error(e); process.exit(1); });
