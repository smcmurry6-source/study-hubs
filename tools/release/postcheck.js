#!/usr/bin/env node
// Post-release verification of the LIVE site (RELEASE_TEST_PLAN.md, "After the release"). Read-only:
//   1. every site file changed by the release is fetched from GitHub Pages and compared byte for byte with main
//      (did the deploy publish, and did it publish everything?);
//   2. the dashboard and each changed (or every live) hub are opened in a headless browser with every Supabase request
//      blocked before it leaves the browser, so this visit writes nothing and isn't counted in the analytics; the
//      pages must render without a JavaScript error.
//   node tools/release/postcheck.js                    compare origin/main's latest merge with its parent
//   node tools/release/postcheck.js --from <sha> --to <sha>
//   node tools/release/postcheck.js --all              every site file and every live hub
'use strict';
const crypto = require('crypto'), { execFileSync } = require('child_process');
const L = require('./lib');
const T = require('../preview/transform');
const arg = (n, d) => (i => i > 0 ? process.argv[i + 1] : d)(process.argv.indexOf('--' + n));
const ALL = process.argv.includes('--all');
const git = (...a) => execFileSync('git', a, { cwd: L.ROOT, maxBuffer: 256 * 1048576 });

(async () => {
  const problems = [], notes = [];
  try { git('fetch', '-q', 'origin', 'main'); } catch (e) { notes.push('(could not fetch origin/main; using the local copy)'); }
  const to = arg('to', git('rev-parse', 'origin/main').toString().trim());
  const from = arg('from', git('rev-parse', to + '^1').toString().trim());
  const isSite = f => T.SITE_ENTRIES.some(e => f === e || f.startsWith(e + '/'));
  let files = ALL ? git('ls-tree', '-r', '--name-only', to).toString().split('\n').filter(Boolean).filter(isSite)
                  : git('diff', '--name-only', from, to).toString().split('\n').filter(Boolean).filter(isSite);
  const deleted = ALL ? [] : git('diff', '--name-only', '--diff-filter=D', from, to).toString().split('\n').filter(Boolean).filter(isSite);
  notes.push(`release ${from.slice(0, 7)} → ${to.slice(0, 7)}: ${files.length} site file(s) to check${deleted.length ? `, ${deleted.length} removed` : ''}`);
  const bust = '?postcheck=' + to.slice(0, 7) + Date.now();
  let same = 0;
  for (const f of files) {
    if (deleted.includes(f)) continue;
    const want = crypto.createHash('sha256').update(git('show', `${to}:${f}`)).digest('hex');
    try {
      const r = await fetch(T.LIVE_SITE + f + bust);
      if (!r.ok) { problems.push(`${f}: the live site answers ${r.status}`); continue; }
      const got = crypto.createHash('sha256').update(Buffer.from(await r.arrayBuffer())).digest('hex');
      if (got !== want) problems.push(`${f}: the live copy differs from main (the deploy hasn't finished, failed, or is cached: wait a few minutes and rerun)`); else same++;
    } catch (e) { problems.push(`${f}: couldn't fetch the live copy (${e.message})`); }
  }
  for (const f of deleted) { const r = await fetch(T.LIVE_SITE + f + bust).catch(() => null); if (r && r.ok) notes.push(`${f}: removed in main but still served (GitHub Pages can take a few minutes)`); }
  notes.push(`${same} of ${files.length - deleted.length} changed file(s) live and identical to main`);

  const status = L.hubStatus();
  const hubs = L.hubs().filter(h => status[h] === 'live' && (ALL || files.some(f => f.startsWith(`hubs/${h}/`) || f.startsWith('widget/'))));
  const browser = await L.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  let blocked = 0;
  await ctx.route(/^(https?|wss?):\/\//, route => { const u = new URL(route.request().url()); if (L.SUPABASE.test(u.hostname)) { blocked++; return route.abort(); } return route.continue(); });
  if (ctx.routeWebSocket) await ctx.routeWebSocket(/supabase/, ws => { blocked++; ws.close(); });
  await ctx.addInitScript(() => { try { localStorage.setItem('sh_tour', 'no'); localStorage.setItem('sh_tour_hub', 'no'); } catch (e) {} });
  for (const p of ['index.html', ...hubs.map(h => `hubs/${h}/`)]) {
    const page = await ctx.newPage(), errs = [];
    page.on('pageerror', e => errs.push(e.message));
    const r = await page.goto(T.LIVE_SITE + p).catch(e => ({ status: () => e.message }));
    await page.waitForTimeout(1500);
    const ok = await page.evaluate(() => !!(document.querySelector('#modeSwitch') || document.querySelector('main, #app, body > *'))).catch(() => false);
    if (!r || (typeof r.status === 'function' && r.status() !== 200)) problems.push(`${p}: live page answered ${r && r.status()}`);
    if (!ok) problems.push(`${p}: the live page rendered nothing`);
    errs.forEach(e => problems.push(`${p}: JavaScript error on the live site: ${e}`));
    notes.push(`live ${p}: ${errs.length} errors`);
    await page.close();
  }
  await browser.close();
  notes.push(`${blocked} Supabase request(s) blocked in the browser: this check wrote nothing to the class's data`);
  process.exit(L.report('post-release verification', problems, notes));
})().catch(e => { console.error(e); process.exit(1); });
