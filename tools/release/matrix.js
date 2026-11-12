#!/usr/bin/env node
// Device matrix and resilience (RELEASE_TEST_PLAN.md, "Browsers and devices", "Resilience"), on a preview.
// Matrix: small and large phones, a tablet both ways, a laptop and a wide desktop. On each: the dashboard and every
// mode of every live hub open without a JavaScript error and without scrolling sideways; tiny tap targets are counted.
// Engines: Chromium by default; SH_ENGINES=chromium,webkit,firefox adds Safari's engine and Firefox where Playwright
// has them installed (CI's release workflow does). Real iPhones and Android phones are still checked by hand (UAT).
// Resilience, on a phone and a laptop:
//   refresh      the mode you were in and an answer you gave survive a reload; the write log keeps going
//   history      dashboard -> hub -> Back -> Forward works, and Back from a hub returns to the dashboard
//   offline      after one visit, the dashboard and a hub open with no connection (service worker), and come back
//                fresh when the connection returns
//   class data   with class data slow (2 s a request) or unreachable, every hub still opens and works
//   slow network on a slow 3G connection (400 ms, 400 kbps), each live hub is usable (mode bar shown, its script and
//                the shared widget run) in under 45 s
//   node tools/release/matrix.js [--quick]   (--quick: two devices, no slow 3G)
'use strict';
const fs = require('fs'), path = require('path');
const L = require('./lib');
const { start } = require('../preview/serve');
const QUICK = process.argv.includes('--quick');

(async () => {
  const pw = require(process.env.PLAYWRIGHT_PATH || 'playwright');
  const D = pw.devices;
  const MATRIX = [
    ['phone, small (iPhone SE)', D['iPhone SE']], ['phone (iPhone 13)', D['iPhone 13']], ['phone (Pixel 7)', D['Pixel 7']],
    ['tablet portrait (iPad Mini)', D['iPad Mini']], ['tablet landscape (iPad Mini)', D['iPad Mini landscape']],
    ['laptop 1280x800', { viewport: { width: 1280, height: 800 } }], ['desktop 1920x1080', { viewport: { width: 1920, height: 1080 } }]
  ].filter((m, i) => !QUICK || i === 2 || i === 5);
  const engines = (process.env.SH_ENGINES || 'chromium').split(',').map(s => s.trim()).filter(Boolean);
  const problems = [], notes = [];
  const srv = await start({});
  const status = L.hubStatus(), live = L.hubs().filter(h => status[h] === 'live');
  const strip = d => { const o = Object.assign({}, d); delete o.defaultBrowserType; return o; };

  for (const engine of engines) {
    let browser;
    try { browser = await pw[engine].launch(engine === 'chromium' && process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}); }
    catch (e) { notes.push(`${engine}: not installed here, skipped (npx playwright install ${engine})`); continue; }
    for (const [label, dev] of MATRIX) {
      const tag = `${engine} · ${label}`;
      const opts = Object.assign(strip(dev), { serviceWorkers: 'block' });
      if (engine === 'firefox') delete opts.isMobile;   /* Firefox has no mobile emulation: size, touch and user agent only */
      const ctx = await browser.newContext(opts);
      await L.guard(ctx);
      const page = await ctx.newPage(); const errs = [];
      page.on('pageerror', e => errs.push(e.message));
      await page.goto(srv.url + 'index.html?persona=returning'); await L.settle(page);
      /* Measured against the layout width (clientWidth), not innerWidth: a phone browser zooms out to fit a page that's
         too wide, which grows innerWidth to match, so Chromium's phone emulation hid real overflow. Names the element
         that sticks out furthest (fixed elements and anything inside a clipping box can't scroll the page). */
      const sideways = async where => {
        const r = await page.evaluate(() => {
          const cw = document.documentElement.clientWidth, w = document.documentElement.scrollWidth - cw;
          if (w <= 1) return null;
          const clipped = e => { for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) if (getComputedStyle(p).overflowX !== 'visible') return true; return false; };
          let worst = null;
          for (const e of document.querySelectorAll('body *')) {
            const b = e.getBoundingClientRect();
            if (!b.width || b.right + scrollX <= cw + 1 || (worst && b.right <= worst.right)) continue;
            if (getComputedStyle(e).position === 'fixed' || clipped(e)) continue;
            worst = { right: b.right, e };
          }
          if (!worst) return { w, who: 'no element named' };
          const e = worst.e, cls = typeof e.className === 'string' ? e.className.trim().split(/\s+/).filter(Boolean).slice(0, 2) : [];
          const text = (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 24);
          return { w, who: e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + cls.map(c => '.' + c).join('') + (text ? ` "${text}"` : '') };
        });
        if (r) problems.push(`${tag}: ${where} scrolls sideways by ${r.w}px (furthest out: ${r.who})`);
      };
      await sideways('dashboard');
      let screens = 1, tiny = 0;
      /* the redesign's dashboard (next/, widget/dash.js; beside the live one until the release): each hub's tab and the class board's two lists */
      if (fs.existsSync(path.join(L.ROOT, 'next', 'index.html'))) {
        await page.goto(srv.url + 'next/?persona=returning'); await L.settle(page);
        await sideways('dashboard/next'); screens++;
        const tabs = await page.$$eval('#hubTabs [data-tab]', ts => ts.map(t => t.getAttribute('data-tab')));
        if (!tabs.length) problems.push(`${tag}: dashboard/next shows no hub tabs`);
        for (const t of tabs) { await page.click(`#hubTabs [data-tab="${t}"]`).catch(() => {}); await page.waitForTimeout(250); await sideways(`dashboard/next · ${t}`); screens++; }
        for (const bn of await page.$$('#boardSeg button')) { await bn.click().catch(() => {}); await page.waitForTimeout(350); }
        await sideways('dashboard/next · class board');
      }
      for (const hub of live) {
        await page.goto(srv.url + `hubs/${hub}/`); await L.settle(page);
        const modes = await page.$$eval('#modeSwitch [data-mode]', bs => bs.map(b => b.getAttribute('data-mode')));
        if (!modes.length) problems.push(`${tag}: ${hub} shows no mode bar`);
        for (const m of modes) {
          await page.click(`#modeSwitch [data-mode="${m}"]`, { timeout: 5000 }).catch(e => problems.push(`${tag}: ${hub} can't open ${m}: ${e.message.split('\n')[0]}`));
          await page.waitForTimeout(250); screens++;
          await sideways(`${hub} · ${m}`);
        }
        /* WCAG 2.2 target size (minimum): 24x24 CSS px; counted, not failed (inline links in text are exempt anyway) */
        tiny += await page.evaluate(() => [...document.querySelectorAll('button, [role="button"], [role="tab"], input[type="checkbox"], input[type="radio"], select')]
          .filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.width < 24 || r.height < 24) && !e.closest('#shpv-pill, #shpv-panel'); }).length);
      }
      errs.forEach(e => problems.push(`${tag}: JavaScript error: ${e}`));
      notes.push(`${tag}: ${screens} screens, ${errs.length} errors, ${tiny} controls under 24x24 px`);
      await ctx.close();
    }
    await browser.close();
  }

  /* ---------- resilience (Chromium) ---------- */
  const browser = await L.launch();
  for (const [label, dev] of [['phone', D['Pixel 7']], ['laptop', { viewport: { width: 1280, height: 800 } }]]) {
    const hub = live[0] || L.hubs()[0];
    /* refresh: mode and answers survive a reload */
    {
      const ctx = await browser.newContext(Object.assign(strip(dev), { serviceWorkers: 'block' })); await L.guard(ctx);
      const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
      await page.goto(srv.url + `hubs/${hub}/?persona=returning`); await L.settle(page);
      const modes = await page.$$eval('#modeSwitch [data-mode]', bs => bs.map(b => b.getAttribute('data-mode')));
      const target = modes[1] || modes[0];
      await page.click(`#modeSwitch [data-mode="${target}"]`); await page.waitForTimeout(400);
      const qid = await page.evaluate(() => { const ev = document.querySelector('script[src*="widget/v3.js"]').dataset.answeredEvent, q = window.SH_EXPORT.questions[1];
        document.dispatchEvent(new CustomEvent(ev, { detail: { qid: q.id, correct: false, choice: 1 } })); return q.id; });
      await page.waitForTimeout(600);
      const logBefore = await page.evaluate(() => window.__shPreview.log().length);
      await page.reload(); await L.settle(page);
      const after = await page.evaluate(([h, q]) => ({ mode: (document.querySelector('#modeSwitch [aria-selected="true"]') || {}).dataset, srs: (localStorage.getItem('sh_srs_' + h) || '').includes(q),
        log: window.__shPreview.log().length, mine: (window.__shPreview.db().answers[h] || []).some(r => r[0] === q && !r[3]) }), [hub, qid]);
      if (!after.mode || after.mode.mode !== target) problems.push(`refresh (${label}): ${hub} reopened in ${after.mode ? after.mode.mode : 'no mode'}, not ${target}`);
      if (!after.srs) problems.push(`refresh (${label}): the missed question isn't in spaced review after a reload`);
      if (!after.mine) problems.push(`refresh (${label}): the answer didn't reach the (fixture) server`);
      if (after.log < logBefore) problems.push(`refresh (${label}): the preview's write log was lost on reload`);
      errs.forEach(e => problems.push(`refresh (${label}): JavaScript error: ${e}`));
      notes.push(`refresh (${label}): ${hub} kept "${target}", the missed answer and the log across a reload`);
      await ctx.close();
    }
    /* history: dashboard -> hub -> back -> forward */
    {
      const ctx = await browser.newContext(Object.assign(strip(dev), { serviceWorkers: 'block' })); await L.guard(ctx);
      const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
      await page.goto(srv.url + 'index.html?persona=returning'); await L.settle(page);
      const link = await page.$(`a[href*="hubs/${hub}/"]`);
      if (!link) problems.push(`history (${label}): no link to ${hub} on the dashboard`);
      else {
        await Promise.all([page.waitForNavigation(), link.click()]); await L.settle(page);
        if (!page.url().includes(`hubs/${hub}/`)) problems.push(`history (${label}): the dashboard's link didn't open ${hub}`);
        await page.click('#modeSwitch [data-mode]:nth-child(2)').catch(() => {});
        await page.goBack(); await page.waitForLoadState(); await L.settle(page);
        if (page.url().includes('/hubs/')) problems.push(`history (${label}): Back from ${hub} didn't return to the dashboard (${page.url()})`);
        if (!(await page.$('#shpv-pill'))) problems.push(`history (${label}): the dashboard didn't render after Back`);
        await page.goForward(); await page.waitForLoadState(); await L.settle(page);
        if (!page.url().includes(`hubs/${hub}/`) || !(await page.$('#modeSwitch'))) problems.push(`history (${label}): Forward didn't bring ${hub} back`);
        await page.click('#sh-ribbon-back, #shhome-pill', { timeout: 3000 }).catch(() => problems.push(`history (${label}): no back-to-dashboard button in ${hub}`));
        await page.waitForLoadState(); await L.settle(page);
        if (page.url().includes('/hubs/')) problems.push(`history (${label}): ${hub}'s back button didn't open the dashboard`);
      }
      errs.forEach(e => problems.push(`history (${label}): JavaScript error: ${e}`));
      notes.push(`history (${label}): dashboard → ${hub} → Back → Forward → back button`);
      await ctx.close();
    }
    /* offline and cache recovery: the service worker */
    {
      const ctx = await browser.newContext(strip(dev)); await L.guard(ctx);
      const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
      await page.goto(srv.url + 'index.html?persona=returning'); await L.settle(page);
      await page.goto(srv.url + `hubs/${hub}/`); await L.settle(page);
      const sw = await page.evaluate(async () => { if (!navigator.serviceWorker) return 'none'; const r = await Promise.race([navigator.serviceWorker.ready, new Promise(ok => setTimeout(() => ok(null), 8000))]); return r ? 'ready' : 'not ready'; });
      await page.waitForTimeout(1500);
      await page.reload(); await L.settle(page);   /* the page is now controlled, and its files cached */
      await ctx.setOffline(true);
      for (const url of [`hubs/${hub}/`, 'index.html']) {
        const ok = await page.goto(srv.url + url).then(() => true, () => false); await L.settle(page);
        const shown = ok && await page.evaluate(() => !!(document.querySelector('#modeSwitch') || document.querySelector('.hub-card, [data-hub], #shpv-pill')));
        if (!shown) problems.push(`offline (${label}): ${url} didn't open with no connection (service worker: ${sw})`);
      }
      await ctx.setOffline(false);
      await page.goto(srv.url + `hubs/${hub}/`); await L.settle(page);
      if (!(await page.$('#modeSwitch'))) problems.push(`offline (${label}): ${hub} didn't recover after the connection came back`);
      errs.forEach(e => problems.push(`offline (${label}): JavaScript error: ${e}`));
      notes.push(`offline (${label}): service worker ${sw}; dashboard and ${hub} opened offline and recovered online`);
      await ctx.close();
    }
    /* class data slow or unreachable */
    for (const speed of ['slow', 'down']) {
      const ctx = await browser.newContext(Object.assign(strip(dev), { serviceWorkers: 'block' })); await L.guard(ctx);
      await ctx.addInitScript(s => { try { const u = JSON.parse(localStorage.getItem('sh_preview_ui') || '{}'); u.speed = s; localStorage.setItem('sh_preview_ui', JSON.stringify(u)); } catch (e) {} }, speed);
      const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
      for (const url of ['index.html?persona=returning', ...live.map(h => `hubs/${h}/`)]) {
        await page.goto(srv.url + url); await L.settle(page);
        if (url.startsWith('hubs/')) {
          const modes = await page.$$eval('#modeSwitch [data-mode]', bs => bs.map(b => b.getAttribute('data-mode')));
          for (const m of modes) await page.click(`#modeSwitch [data-mode="${m}"]`).catch(e => problems.push(`class data ${speed} (${label}): ${url} ${m}: ${e.message.split('\n')[0]}`));
        }
      }
      errs.forEach(e => problems.push(`class data ${speed} (${label}): JavaScript error: ${e}`));
      notes.push(`class data ${speed === 'down' ? 'unreachable' : 'slow'} (${label}): dashboard and ${live.length} live hubs opened and every mode worked`);
      await ctx.close();
    }
  }
  /* slow 3G: time until the mode bar can be used */
  if (!QUICK) for (const hub of live) {
    const ctx = await browser.newContext(Object.assign(strip(D['Pixel 7']), { serviceWorkers: 'block' })); await L.guard(ctx);
    await ctx.addInitScript(() => { try { localStorage.setItem('sh_tour', 'no'); localStorage.setItem('sh_tour_hub', 'no'); } catch (e) {} });
    const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
    await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 400, downloadThroughput: 400e3 / 8, uploadThroughput: 400e3 / 8 });
    const t0 = Date.now();
    await page.goto(srv.url + `hubs/${hub}/`, { waitUntil: 'commit', timeout: 120000 });
    /* usable = the mode bar is on screen, the hub's script has run to its end (SH_EXPORT is its last statement) and
       the shared widget has started (shSupabase): before that, taps do nothing */
    const ok = await page.waitForSelector('#modeSwitch [data-mode]', { state: 'visible', timeout: 90000 })
      .then(() => page.waitForFunction(() => window.SH_EXPORT && 'shSupabase' in window, null, { timeout: 90000 })).then(() => true, () => false);
    const ms = Date.now() - t0;
    if (!ok || ms > 45000) problems.push(`slow 3G: ${hub}'s mode bar took ${ok ? Math.round(ms / 1000) + ' s' : 'over 90 s'} (limit 45 s)`);
    notes.push(`slow 3G: ${hub} usable in ${(ms / 1000).toFixed(1)} s`);
    await ctx.close();
  }
  await browser.close(); srv.server.close();
  process.exit(L.report('devices and resilience', problems, notes));
})().catch(e => { console.error(e); process.exit(1); });
