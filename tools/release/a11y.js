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
  let invisible = 0, stuck = 0, last = null, same = 0; const where = [];
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('Tab');
    const f = await page.evaluate(() => {
      const e = document.activeElement;
      if (!e || e === document.body) return null;
      if (e.closest('#shpv-pill, #shpv-panel')) return { skip: true };
      const s = getComputedStyle(e), ring = (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) || (s.boxShadow && s.boxShadow !== 'none');
      const id = e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/)[0] : '');
      return { id, ring, path: (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 30) };
    });
    if (!f || f.skip) continue;
    if (!f.ring) { invisible++; if (where.length < 3) where.push(f.id); }
    if (f.id + f.path === last) { if (++same >= 4) { stuck = 1; break; } } else same = 0;
    last = f.id + f.path;
  }
  return { invisible, stuck, where };
}
async function motion(page){
  return page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running' && a.effect && a.effect.getComputedTiming().iterations === Infinity
    && !(a.effect.target && a.effect.target.closest && a.effect.target.closest('#shpv-pill, #shpv-panel'))).length);
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
  }
  await ctx.close();
  /* dark mode: the first screen of each live hub and the dashboard */
  const dark = await ctxFor('dark'); await L.guard(dark);
  const dp = await dark.newPage();
  await dp.goto(srv.url + 'index.html?persona=returning'); await L.settle(dp);
  await dp.evaluate(() => { try { localStorage.setItem('sh_theme', 'dark'); } catch (e) {} });
  for (const [key, url] of [['dashboard (dark)', 'index.html'], ...live.map(h => [`${h} (dark)`, `hubs/${h}/`]), ...next.map(h => [`${h}/next (dark)`, `hubs/${h}/next/`])].filter(([k]) => !ONLY || k !== 'dashboard (dark)')) {
    await dp.goto(srv.url + url); await L.settle(dp);
    await dp.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await dp.addScriptTag({ content: AXE });
    const v = await dp.evaluate(async ([tags, exclude]) => (await window.axe.run({ exclude: exclude.map(s => [s]) }, { runOnly: { type: 'tag', values: tags }, resultTypes: ['violations'] })).violations
      .map(x => ({ id: x.id, impact: x.impact, n: x.nodes.length, help: x.help, sample: x.nodes[0] && x.nodes[0].target.join(' ') })), [TAGS, PREVIEW_UI]);
    results[key] = { axe: Object.fromEntries(v.map(x => [x.id, { n: x.n, impact: x.impact, help: x.help, sample: x.sample }])), focus: null, motion: 0 };
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
      if (r.focus.invisible > b.focus.invisible) problems.push(`${key}: ${r.focus.invisible} keyboard stops with no visible focus (baseline ${b.focus.invisible}), e.g. ${r.focus.where.join(', ')}`);
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
