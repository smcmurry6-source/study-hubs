#!/usr/bin/env node
// Accessibility regression test (RELEASE_TEST_PLAN.md, "Accessibility"), on a preview with the returning learner:
//   - axe-core (WCAG 2.0/2.1/2.2 A and AA rules) on the dashboard, About, the admin page's sign-in and every mode of
//     every live hub, in light mode, plus each live hub's first screen in dark mode;
//   - keyboard: 30 presses of Tab from the top of each page; every stop must be visible (an outline or a ring) and
//     focus must keep moving (no trap);
//   - reduced motion: with "reduce motion" on, endless animations still running are counted.
// The site has known issues, so results are compared with tools/release/baselines/a11y.json: anything new or worse
// fails; anything better is reported so the baseline can come down (--update writes it). A page with no baseline
// (a new hub) fails on any serious or critical axe violation: new pages start clean.
//   npm i --no-save playwright axe-core && node tools/release/a11y.js [--update] [--hub occlusion]
'use strict';
const fs = require('fs'), path = require('path');
const L = require('./lib');
const { start } = require('../preview/serve');
const AXE = fs.readFileSync(process.env.AXE_CORE_PATH || require.resolve('axe-core/axe.min.js'), 'utf8');
const BASE_FILE = path.join(__dirname, 'baselines', 'a11y.json');
const UPDATE = process.argv.includes('--update');
const ONLY = (i => i > 0 ? process.argv[i + 1] : null)(process.argv.indexOf('--hub'));
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const PREVIEW_UI = ['#shpv-pill', '#shpv-panel', '.shpv-frame'];

async function audit(page){
  await page.addScriptTag({ content: AXE });
  return page.evaluate(async ([tags, exclude]) => {
    const r = await window.axe.run({ exclude: exclude.map(s => [s]) }, { runOnly: { type: 'tag', values: tags }, resultTypes: ['violations'] });
    return r.violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, help: v.help, sample: v.nodes[0] && v.nodes[0].target.join(' ') }));
  }, [TAGS, PREVIEW_UI]);
}
async function keyboard(page){
  await page.evaluate(() => { document.activeElement && document.activeElement.blur && document.activeElement.blur(); window.scrollTo(0, 0); });
  /* a stop is told apart by its text and its accessible name: buttons that read the same (the trophy case's unfound
     secrets all say "Secret") are still different stops when their names differ */
  let invisible = 0, stuck = 0, last = null, same = 0; const where = [], whyNot = [];
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('Tab');
    const f = await page.evaluate(() => {
      const e = document.activeElement;
      if (!e || e === document.body) return null;
      if (e.closest('#shpv-pill, #shpv-panel')) return { skip: true };
      const s = getComputedStyle(e), ring = (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) || (s.boxShadow && s.boxShadow !== 'none');
      const id = e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/)[0] : '');
      /* why a stop has no ring, for the report: is it :focus / :focus-visible, does the page have focus, what outline applies */
      let why = '';
      if (!ring) {
        why = `focus=${e.matches(':focus')} focus-visible=${e.matches(':focus-visible')} page-focused=${document.hasFocus()} outline=${s.outlineStyle} ${s.outlineWidth}` +
          ` html=${document.documentElement.className || '-'} in-hx=${!!e.closest('.hx')}`;
        return new Promise(r => setTimeout(() => { const t = getComputedStyle(e); r({ id, ring, why: why + ` later: active=${document.activeElement === e} outline=${t.outlineStyle} ${t.outlineWidth}`, path: (e.textContent || '').trim().slice(0, 30) + '|' + (e.getAttribute('aria-label') || '').slice(0, 80) }); }, 200));
      }
      return { id, ring, why, path: (e.textContent || '').trim().slice(0, 30) + '|' + (e.getAttribute('aria-label') || '').slice(0, 80) };
    });
    if (!f || f.skip) continue;
    if (!f.ring) { invisible++; if (where.length < 3) where.push(f.id); if (whyNot.length < 3) whyNot.push(`${f.id} (${f.why})`); }
    if (f.id + f.path === last) { if (++same >= 4) { stuck = 1; break; } } else same = 0;
    last = f.id + f.path;
  }
  return { invisible, stuck, where, why: whyNot };
}
async function motion(page){
  return page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running' && a.effect && a.effect.getComputedTiming().iterations === Infinity
    && !(a.effect.target && a.effect.target.closest && a.effect.target.closest('#shpv-pill, #shpv-panel'))).length);
}

const HAS_NEXT_DASH = fs.existsSync(path.join(L.ROOT, 'next', 'index.html'));
/* the new dashboard's boards on the preview's game layer: every row a button; audits the boards (as "dashboard/next · boards"
   when a check is passed in), then taps the second place's name and waits for that classmate's place */
async function openVisit(page, check){
  await page.evaluate(() => { document.querySelectorAll('section.survey').forEach(s => s.remove()); const c = document.getElementById('class'); if (c) c.scrollIntoView(); });
  if (!(await page.waitForSelector('#board .dx-visit', { timeout: 20000 }).catch(() => null))) return false;
  await page.waitForTimeout(1500);
  if (check) await check();
  await page.$eval('#board .dx-podium .p2 .dx-visit', b => b.click()).catch(() => {});
  if (!(await page.waitForSelector('dialog.tpv.is-visit[open] .tpv-guest', { timeout: 20000 }).catch(() => null))) return false;
  /* the trip through the clouds plays first (about 2.4 s); check the place once they've gone */
  await page.waitForFunction(() => !document.querySelector('dialog.tpv .tpv-clouds'), null, { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1000);
  return true;
}

(async () => {
  const baseline = fs.existsSync(BASE_FILE) ? JSON.parse(fs.readFileSync(BASE_FILE, 'utf8')) : { pages: {} };
  const results = {}, problems = [], notes = [];
  const srv = await start({});
  const browser = await L.launch();
  const status = L.hubStatus();
  const live = L.hubs().filter(h => status[h] === 'live' && (!ONLY || h === ONLY));
  const ctxFor = scheme => browser.newContext({ viewport: { width: 1280, height: 860 }, colorScheme: scheme, reducedMotion: 'reduce', serviceWorkers: 'block' });
  const ctx = await ctxFor('light');
  await L.guard(ctx);
  const page = await ctx.newPage();
  await page.goto(srv.url + 'index.html?persona=returning'); await L.settle(page);

  async function check(key, url, extra){
    if (url) { await page.goto(srv.url + url); await L.settle(page); }
    if (extra) await extra();
    const r = { axe: {}, focus: null, motion: 0 };
    for (const v of await audit(page)) r.axe[v.id] = { n: v.n, impact: v.impact, help: v.help, sample: v.sample };
    if (url) { r.focus = await keyboard(page); r.motion = await motion(page); }
    results[key] = r;
  }
  if (!ONLY) {
    await check('dashboard', 'index.html');
    await check('about', 'about/');
    await check('review (sign-in)', 'review/');
    /* the redesign's dashboard (next/, widget/dash.js; not live until the release), with its Settings sheet open too */
    if (HAS_NEXT_DASH) {
      await check('dashboard/next', 'next/');
      await check('dashboard/next · settings', null, async () => { await page.click('#setBtn').catch(() => {}); await page.waitForTimeout(300); });
      await page.keyboard.press('Escape').catch(() => {});
      /* visiting (phase 4): the boards with their rows as buttons, then a classmate's place opened from one */
      if (await openVisit(page, () => check('dashboard/next · boards', null))) {
        await check('dashboard/next · visited place', null);
        /* motion only, as for a hub's place: Tab inside the scene moves within its shadow root, which reads as one element */
        results['dashboard/next · visited place'].motion = await motion(page);
        await page.keyboard.press('Escape').catch(() => {});
      } else problems.push('dashboard/next · visited place: a row on the boards didn\'t open a classmate\'s place');
    }
  }
  for (const hub of live) {
    await page.goto(srv.url + `hubs/${hub}/`); await L.settle(page);
    const modes = await page.$$eval('#modeSwitch [data-mode]', bs => bs.map(b => b.getAttribute('data-mode')));
    let first = true;
    for (const m of modes) {
      await page.click(`#modeSwitch [data-mode="${m}"]`).catch(() => {}); await page.waitForTimeout(300);
      await check(`${hub} · ${m}`, null);
      if (first) { results[`${hub} · ${m}`].focus = await keyboard(page); results[`${hub} · ${m}`].motion = await motion(page); first = false; }
    }
  }
  /* the redesign's new versions (hubs/<id>/next/, widget/hub.js; not live until the release): the four views */
  const next = live.filter(h => fs.existsSync(path.join(L.ROOT, 'hubs', h, 'next', 'index.html')));
  for (const hub of next) {
    await page.goto(srv.url + `hubs/${hub}/next/`); await L.settle(page);
    let first = true;
    for (const v of ['home', 'notes', 'questions', 'more']) {
      await page.evaluate(h => { location.hash = h; }, v); await page.waitForTimeout(900);
      await check(`${hub}/next · ${v}`, null);
      if (first) { results[`${hub}/next · ${v}`].focus = await keyboard(page); results[`${hub}/next · ${v}`].motion = await motion(page); first = false; }
    }
    /* Timmy's place (widget/place.js; loaded on first use): its card under More, then the full view and the customizer */
    if (hub === next[0]) {
      await page.evaluate(() => { location.hash = 'more/place'; });
      if (await page.waitForSelector('.place-card .tpc.is-live', { timeout: 20000 }).catch(() => null)) {
        await check(`${hub}/next · place`, null);
        await page.click('.place-card .tpc').catch(() => {});
        if (await page.waitForSelector('dialog.tpv[open]', { timeout: 8000 }).catch(() => null)) {
          await page.waitForTimeout(600);
          await check(`${hub}/next · place, full view`, null);
          results[`${hub}/next · place, full view`].motion = await motion(page);
          await page.click('dialog.tpv [data-tp="customize"]').catch(() => {}); await page.waitForTimeout(900);
          await check(`${hub}/next · place, customize`, null);
          await page.keyboard.press('Escape').catch(() => {});
        } else problems.push(`${hub}/next · place: the full view didn't open`);
      } else problems.push(`${hub}/next · place: Timmy's place didn't draw for the returning test account`);
      /* Timmy's shop (widget/shop.js; loaded on first use): the page under More, then an item's sheet with Buy */
      await page.evaluate(() => { location.hash = 'more/shop'; });
      if (await page.waitForSelector('.shop-host .tsh-store', { timeout: 20000 }).catch(() => null)) {
        await page.waitForTimeout(600);
        await check(`${hub}/next · shop`, null);
        results[`${hub}/next · shop`].focus = await keyboard(page); results[`${hub}/next · shop`].motion = await motion(page);
        await page.click('.tsh-store .tsh-card.s-buy').catch(() => {});
        if (await page.waitForSelector('dialog.tsh-sheet[open]', { timeout: 8000 }).catch(() => null)) {
          await page.waitForTimeout(500);
          await check(`${hub}/next · shop, an item's sheet`, null);
          results[`${hub}/next · shop, an item's sheet`].motion = await motion(page);
          await page.keyboard.press('Escape').catch(() => {});
        } else problems.push(`${hub}/next · shop: an item's sheet didn't open`);
      } else problems.push(`${hub}/next · shop: the shop didn't draw for the returning test account`);
      /* the bowling egg's clip card (widget/bowling.js; loaded at the first strike): with the run at 49, one first-try
         right answer in the bank shows it. It is named, takes no focus by itself, and closes from the keyboard (its
         close button, and Escape). The pointer rests on it while axe runs, which holds it on the screen. */
      await page.evaluate(() => { location.hash = 'questions'; }); await page.waitForTimeout(900);
      const bowlAnswer = () => page.evaluate(async () => {
        localStorage.setItem('sh_bowl_run', '49'); localStorage.removeItem('sh_bowl_today'); localStorage.removeItem('sh_pref_eggs'); localStorage.removeItem('sh_pref_focus');
        const qs = (await (await fetch('content/questions.json')).json()).filter(q => q.type === 'mcq' && !q.fig && !q.pcase && !q.img);
        const q = qs[(window.__bwA = (window.__bwA || 0) + 1)], host = document.querySelector('.qcard') ? document.querySelector('.qcard').parentNode : document.querySelector('.hx-view:not([hidden])');
        const el = window.shHub.card(q.id); host.insertBefore(el, host.firstChild); el.scrollIntoView({ block: 'start' });
        const sc = el.querySelector('[data-showch]'); if (sc && sc.offsetParent) sc.click();
        el.querySelector('.ch[data-i="' + q.answer + '"]').click();
      });
      await bowlAnswer();
      if (await page.waitForSelector('.shb', { timeout: 10000 }).catch(() => null)) {
        await page.hover('.shb .shb-screen').catch(() => {});
        const k = `${hub}/next · bowling clip`;
        /* axe on the card alone: the bank under it is checked as its own screen */
        await page.addScriptTag({ content: AXE });
        const v = await page.evaluate(async tags => (await window.axe.run({ include: [['.shb']] }, { runOnly: { type: 'tag', values: tags }, resultTypes: ['violations'] })).violations
          .map(x => ({ id: x.id, impact: x.impact, n: x.nodes.length, help: x.help, sample: x.nodes[0] && x.nodes[0].target.join(' ') })), TAGS);
        results[k] = { axe: Object.fromEntries(v.map(x => [x.id, { n: x.n, impact: x.impact, help: x.help, sample: x.sample }])), focus: null, motion: await motion(page) };
        const c = await page.evaluate(() => { const c = document.querySelector('.shb'), x = c && c.querySelector('.shb-x');
          return { named: !!(c && /\S/.test(c.getAttribute('aria-label') || '')), x: !!(x && /\S/.test(x.getAttribute('aria-label') || '')), focus: !!(c && c.contains(document.activeElement)) }; });
        if (!c.named || !c.x) problems.push(`${k}: the clip card and its close button need names (${JSON.stringify(c)})`);
        if (c.focus) problems.push(`${k}: the clip card took the focus by itself`);
        await page.focus('.shb .shb-x'); await page.keyboard.press('Enter'); await page.waitForTimeout(500);
        if (await page.$('.shb')) problems.push(`${k}: its close button doesn't close it from the keyboard`);
        await page.mouse.move(0, 0); await bowlAnswer();
        if (await page.waitForSelector('.shb', { timeout: 10000 }).catch(() => null)) {
          await page.keyboard.press('Escape'); await page.waitForTimeout(500);
          if (await page.$('.shb')) problems.push(`${k}: Escape doesn't close it`);
        }
      } else problems.push(`${hub}/next · bowling clip: one first-try right answer with the run at 49 showed no clip`);
      await page.evaluate(() => ['sh_bowl_run', 'sh_bowl_today', 'sh_bowl_seen'].forEach(k => localStorage.removeItem(k)));
      /* the trophy case (widget/trophies.js; loaded on first use) under More, Stats and trophies: axe and the keyboard; every
         trophy has a name a screen reader gets, and a secret one is announced as a secret, never by its name. Then one
         card on the redesign's look (a trophy card), axe on the card alone. */
      await page.evaluate(() => { location.hash = 'more/stats'; });
      if (await page.waitForSelector('.sht .sht-cab', { timeout: 20000 }).catch(() => null)) {
        await page.waitForTimeout(800);
        const k = `${hub}/next · trophy case`;
        await check(k, null);
        results[k].focus = await keyboard(page); results[k].motion = await motion(page);
        const t = await page.evaluate(() => {
          const b = [...document.querySelectorAll('.sht [data-sht="trophy"]')], R = window.shRanks, all = R.TROPHIES.concat(R.RETIRED || []);
          const sec = b.filter(x => x.classList.contains('is-secret'));
          const leak = sec.filter(x => { const m = all.filter(y => y.k === x.getAttribute('data-k'))[0], said = (x.getAttribute('aria-label') || '') + ' ' + x.textContent;
            return !/^Secret trophy/.test(x.getAttribute('aria-label') || '') || !m || said.indexOf(m.n) >= 0; });
          return { n: b.length, unnamed: b.filter(x => !/\S/.test(x.getAttribute('aria-label') || '')).length, sec: sec.length, leak: leak.map(x => x.getAttribute('data-k')) };
        });
        if (t.n < 27 || t.unnamed) problems.push(`${k}: every trophy needs a name a screen reader gets (${t.unnamed} of ${t.n} have none)`);
        if (!t.sec || t.leak.length) problems.push(`${k}: a secret not found must be announced as a secret, never by its name (${t.leak.join(', ') || 'no secret drawn'})`);
        await page.evaluate(() => window.shRanks.preview('trophy', 1));
        if (await page.waitForSelector('.sh-ru-tr', { timeout: 15000 }).catch(() => null)) {
          await page.waitForTimeout(1200);
          const kc = `${hub}/next · trophy card`;
          await page.addScriptTag({ content: AXE });
          const v = await page.evaluate(async tags => (await window.axe.run({ include: [['.sh-ru-tr']] }, { runOnly: { type: 'tag', values: tags }, resultTypes: ['violations'] })).violations
            .map(x => ({ id: x.id, impact: x.impact, n: x.nodes.length, help: x.help, sample: x.nodes[0] && x.nodes[0].target.join(' ') })), TAGS);
          results[kc] = { axe: Object.fromEntries(v.map(x => [x.id, { n: x.n, impact: x.impact, help: x.help, sample: x.sample }])), focus: null, motion: await motion(page) };
          await page.click('.sh-ru-tr').catch(() => {});
        } else problems.push(`${hub}/next · trophy card: shRanks.preview("trophy") showed no card`);
      } else problems.push(`${hub}/next · trophy case: More, Stats and trophies didn't draw the case for the returning test account`);
    }
  }
  await ctx.close();
  /* dark mode: the first screen of each live hub and the dashboard */
  const dark = await ctxFor('dark'); await L.guard(dark);
  const dp = await dark.newPage();
  await dp.goto(srv.url + 'index.html?persona=returning'); await L.settle(dp);
  await dp.evaluate(() => { try { localStorage.setItem('sh_theme', 'dark'); } catch (e) {} });
  for (const [key, url] of [['dashboard (dark)', 'index.html'], ...(HAS_NEXT_DASH ? [['dashboard/next (dark)', 'next/']] : []), ...live.map(h => [`${h} (dark)`, `hubs/${h}/`]), ...next.map(h => [`${h}/next (dark)`, `hubs/${h}/next/`])].filter(([k]) => !ONLY || !/^dashboard/.test(k))) {
    await dp.goto(srv.url + url); await L.settle(dp);
    await dp.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await dp.addScriptTag({ content: AXE });
    const v = await dp.evaluate(async ([tags, exclude]) => (await window.axe.run({ exclude: exclude.map(s => [s]) }, { runOnly: { type: 'tag', values: tags }, resultTypes: ['violations'] })).violations
      .map(x => ({ id: x.id, impact: x.impact, n: x.nodes.length, help: x.help, sample: x.nodes[0] && x.nodes[0].target.join(' ') })), [TAGS, PREVIEW_UI]);
    results[key] = { axe: Object.fromEntries(v.map(x => [x.id, { n: x.n, impact: x.impact, help: x.help, sample: x.sample }])), focus: null, motion: 0 };
  }
  /* a visited place in dark mode (the theater is dark in both themes; the page behind it isn't) */
  if (HAS_NEXT_DASH && !ONLY) {
    await dp.goto(srv.url + 'next/'); await L.settle(dp);
    await dp.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    if (await openVisit(dp)) {
      await dp.addScriptTag({ content: AXE });
      const v = await dp.evaluate(async ([tags, exclude]) => (await window.axe.run({ exclude: exclude.map(s => [s]) }, { runOnly: { type: 'tag', values: tags }, resultTypes: ['violations'] })).violations
        .map(x => ({ id: x.id, impact: x.impact, n: x.nodes.length, help: x.help, sample: x.nodes[0] && x.nodes[0].target.join(' ') })), [TAGS, PREVIEW_UI]);
      results['dashboard/next · visited place (dark)'] = { axe: Object.fromEntries(v.map(x => [x.id, { n: x.n, impact: x.impact, help: x.help, sample: x.sample }])), focus: null, motion: 0 };
    } else problems.push('dashboard/next · visited place (dark): a row on the boards didn\'t open a classmate\'s place');
  }
  /* the shop in dark mode (its own wood and paper colors) */
  if (next.length) {
    await dp.goto(srv.url + `hubs/${next[0]}/next/#more/shop`); await L.settle(dp);
    await dp.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    if (await dp.waitForSelector('.shop-host .tsh-store', { timeout: 20000 }).catch(() => null)) {
      await dp.waitForTimeout(600); await dp.addScriptTag({ content: AXE });
      const v = await dp.evaluate(async ([tags, exclude]) => (await window.axe.run({ exclude: exclude.map(s => [s]) }, { runOnly: { type: 'tag', values: tags }, resultTypes: ['violations'] })).violations
        .map(x => ({ id: x.id, impact: x.impact, n: x.nodes.length, help: x.help, sample: x.nodes[0] && x.nodes[0].target.join(' ') })), [TAGS, PREVIEW_UI]);
      results[`${next[0]}/next · shop (dark)`] = { axe: Object.fromEntries(v.map(x => [x.id, { n: x.n, impact: x.impact, help: x.help, sample: x.sample }])), focus: null, motion: 0 };
    } else problems.push(`${next[0]}/next · shop (dark): the shop didn't draw`);
  }
  await dark.close(); await browser.close(); srv.server.close();

  /* compare with the baseline */
  let total = 0;
  for (const [key, r] of Object.entries(results)) {
    const b = baseline.pages[key];
    const count = Object.values(r.axe).reduce((s, x) => s + x.n, 0); total += count;
    if (!b) {
      const bad = Object.entries(r.axe).filter(([, x]) => x.impact === 'serious' || x.impact === 'critical');
      if (!UPDATE) bad.forEach(([id, x]) => problems.push(`${key} (new page, no baseline): ${x.impact} "${x.help}" ×${x.n}, e.g. ${x.sample}`));
      notes.push(`${key}: ${count} axe node(s), not in the baseline yet`);
      continue;
    }
    for (const [id, x] of Object.entries(r.axe)) {
      const was = (b.axe[id] || {}).n || 0;
      if (x.n > was) problems.push(`${key}: ${x.impact} "${x.help}" ${was} → ${x.n}, e.g. ${x.sample}`);
    }
    const better = Object.keys(b.axe).filter(id => !r.axe[id] || r.axe[id].n < b.axe[id].n);
    if (better.length) notes.push(`${key}: better than the baseline on ${better.join(', ')} (run with --update to lock it in)`);
    if (r.focus && b.focus) {
      if (r.focus.invisible > b.focus.invisible) problems.push(`${key}: ${r.focus.invisible} keyboard stops with no visible focus (baseline ${b.focus.invisible}), e.g. ${(r.focus.why && r.focus.why.length ? r.focus.why : r.focus.where).join(', ')}`);
      if (r.focus.stuck && !b.focus.stuck) problems.push(`${key}: the keyboard gets stuck (Tab stops moving)`);
    }
    if (r.motion > (b.motion || 0)) problems.push(`${key}: ${r.motion} endless animation(s) still run with reduced motion on (baseline ${b.motion || 0})`);
  }
  notes.unshift(`${Object.keys(results).length} screens checked; ${total} axe nodes in all`);
  const outFile = path.join(L.outDir('a11y'), 'a11y.json');
  fs.writeFileSync(outFile, JSON.stringify({ pages: results }, null, 1));
  notes.push(`full results: ${outFile}`);
  if (UPDATE) {
    const merged = ONLY ? Object.assign({}, baseline.pages, results) : results;
    fs.mkdirSync(path.dirname(BASE_FILE), { recursive: true });
    fs.writeFileSync(BASE_FILE, JSON.stringify({ about: 'Known accessibility issues per screen, so tools/release/a11y.js can fail only on new ones. Lower these numbers; never raise them to make a check pass (fix the page instead), except for a deliberate change Sam approved.', updated: new Date().toISOString().slice(0, 10), pages: merged }, null, 1) + '\n');
    notes.push(`baseline written: ${path.relative(L.ROOT, BASE_FILE)}`);
    problems.length = 0;
  }
  process.exit(L.report('accessibility', problems, notes));
})().catch(e => { console.error(e); process.exit(1); });
