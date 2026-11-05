#!/usr/bin/env node
// The admin page's Live and Hubs tabs and the Surveys tab's order, used in a preview (fixture data, production
// blocked) the way Sam would use them, plus what students then see on the dashboard and a hub page. Fails if
//   - check-in groups or surveys aren't newest first (the fixtures put the newest group last by name);
//   - Live shows an id, doesn't poll every 30 s while open, or polls while another tab is open or the page is hidden;
//   - archiving a hub skips the confirmation, doesn't reach the dashboard and the hub's notice, or can't be reversed;
//   - an end time doesn't hand the hub back to its dates; a change from a stale page isn't refused; a bad end time saves;
//   - Escape doesn't close the form and return focus; a removed page can be set to Live;
//   - any admin screen scrolls sideways at 390 px, a page throws, or any request heads for Supabase.
// Screenshots (desktop light, phone dark) go to $SH_RELEASE_OUT/admin-ui/.   node tools/release/admin-ui.js
'use strict';
const path = require('path');
const { start } = require('../preview/serve');
const L = require('./lib');
const problems = [], notes = [];
function ok(c, what){ if (!c) problems.push(what); }
const NOW = '2026-11-10T12:00';   /* before every live hub's last exam; Heme & Endo's card is gone by its dates */

(async () => {
  const srv = await start({ label: 'admin-ui test' });
  const base = srv.url, shots = L.outDir('admin-ui');
  const browser = await L.launch();
  const errs = [];
  async function open(ctx, url){ const p = await ctx.newPage(); p.on('pageerror', e => errs.push(url + ': ' + e.message)); await p.goto(base + url); return p; }
  async function admin(ctx, url){ const p = await open(ctx, url || 'review/'); await p.waitForSelector('#app:not([hidden])', { timeout: 15000 }); return p; }
  /* the admin page's views are links in its sidebar; on a phone the sidebar is a menu opened from the top bar */
  async function go(p, view){
    if (await p.isVisible('#menuBtn')) { await p.click('#menuBtn'); await p.waitForSelector('#sidebar.open'); }
    await p.click(`.nav [data-tab=${view}]`);
    await p.waitForFunction(v => !document.querySelector(`[data-panel=${v}]`).hidden, view);
  }
  async function hubsTab(p){ await go(p, 'hubs'); await p.waitForSelector('[data-arch-hub="occlusion"] .state', { timeout: 15000 }); await p.waitForTimeout(400); }
  async function setState(p, hub, st, until, note){
    await p.click(`[data-arch-edit="${hub}"]`);
    await p.check(`[data-arch-form="${hub}"] input[value=${st}]`);
    if (until != null) await p.fill(`[data-arch-form="${hub}"] [name=until]`, until);
    if (note) await p.fill(`[data-arch-form="${hub}"] [name=note]`, note);
    await p.click(`[data-arch-form="${hub}"] [type=submit]`);
  }
  async function confirm(p, hub){ await p.waitForSelector(`[data-arch-form="${hub}"] .arch-confirm`); await p.click(`[data-arch-confirm="${hub}"]`); await p.waitForSelector(`[data-arch-hub="${hub}"] .arch-msg`, { timeout: 10000 }); }
  const writes = p => p.evaluate(() => window.__shPreview.log().filter(x => x.name === 'admin_set_hub_archive' && x.kind === 'write').length);
  async function dashboard(ctx, extra){
    const p = await open(ctx, '?persona=returning' + (extra || ''));
    await p.waitForSelector('.hub-card', { timeout: 15000 }); await p.waitForTimeout(1200);   /* get_hub_overrides answers, the cards redraw */
    const cards = await p.$$eval('.hub-card', els => els.map(e => ({ title: (e.querySelector('h4') || {}).textContent, archived: e.classList.contains('is-archived'), open: !!e.querySelector('a.btn-primary') })));
    await p.close(); return cards;
  }
  const card = (cards, t) => cards.find(c => new RegExp(t).test(c.title || ''));

  try {
    /* ---------- 1. desktop, light: order, live, archive and reverse ---------- */
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' });
    const G = await L.guard(ctx);
    const page = await admin(ctx, `review/?persona=admin&now=${NOW}`);

    /* each view loads only its own data: the Overview doesn't ask for clicks, searches or surveys */
    await page.waitForSelector('[data-panel=overview] .card');
    const calls = () => page.evaluate(() => window.__shPreview.log().map(x => x.name));
    const first = await calls();
    ok(!first.some(n => /get_click_summary|get_search_terms|get_survey_results|get_feature_events|get_nuke_/.test(n)), `the Overview loads only its own data (it asked for ${[...new Set(first)].join(', ')})`);
    ok(first.filter(n => n === 'get_reports').length === 1, 'the sign-in check\'s reports are reused, not fetched twice');
    /* every view opens with its own title and no error */
    for (const v of ['insights', 'time', 'questions', 'health', 'clicks', 'searches', 'engagement', 'checkins', 'surveys', 'inbox', 'recap', 'overview']) {
      await go(page, v);
      await page.waitForFunction(v => { const el = document.querySelector(`[data-panel=${v}]`); return el && !el.querySelector('[aria-busy=true]') && el.children.length; }, v, { timeout: 15000 });
      const nav = (await page.textContent(`.nav [data-tab=${v}]`)).replace(/\d+$/, '').trim(), h1 = (await page.textContent('#viewTitle')).trim();
      ok(nav === h1, `${v}: the title says "${h1}", the menu "${nav}"`);
      ok(!(await page.$(`[data-panel=${v}] .err`)), `${v} shows an error`);
      ok(await page.evaluate(() => location.hash) === '#' + v, `${v}: the address ends in #${v}`);
    }
    ok((await calls()).includes('get_click_summary'), 'Clicks asks for its data when it opens');
    await page.goBack(); await page.waitForTimeout(300);
    ok(await page.evaluate(() => !document.querySelector('[data-panel=recap]').hidden && location.hash === '#recap'), 'the back button returns to the view before');
    notes.push('every view: its own title, no error, its own address; data loaded per view, the back button works');

    await go(page, 'checkins');
    await page.waitForSelector('[data-checkin-group]');
    const groups = await page.$$eval('[data-checkin-group]', els => els.map(e => e.getAttribute('data-checkin-group')));
    ok(groups.join() === 'heme-endo-exam1,pcd-implants-exam1,occlusion,perio', `check-in groups newest first, not by name (got ${groups})`);
    const heme = await page.$$eval('[data-checkin-group="heme-endo-exam1"] .sv-text', els => els.map(e => e.textContent));
    ok(/it was great/.test(heme[0] || ''), `inside a group the newest check-in comes first (got "${heme[0]}")`);
    await go(page, 'surveys');
    await page.waitForSelector('[data-panel=surveys] [data-sv-toggle]');
    const titles = await page.$$eval('[data-panel=surveys] .card h2', els => els.map(e => e.textContent));
    const iNew = titles.findIndex(t => /round 2/.test(t)), iOld = titles.findIndex(t => /round 1/.test(t));
    ok(iNew >= 0 && iOld > iNew, `surveys newest first (got ${titles.filter(t => /round/.test(t))})`);
    notes.push('Exam check-ins: groups and rows newest first; Surveys: newest first');

    /* Live: count, names, no ids, polling only while open and visible */
    const liveCalls = () => page.evaluate(() => window.__shPreview.log().filter(x => x.name === 'admin_live_presence').length);
    await go(page, 'live');
    await page.waitForFunction(() => (document.querySelector('#liveTotal') || {}).textContent === '5', null, { timeout: 10000 });
    const liveText = await page.textContent('[data-panel=live]');
    ok(/Mock Mandible/.test(liveText) && /Occlusion/.test(liveText), 'Live lists names under their hub');
    ok(!/fixture-|00000000-|preview0000|visitor/i.test(liveText.replace(/visitor id/gi, '')), 'Live shows no visitor id');
    ok(/^5 people studying/.test(await page.textContent('#viewSub')), 'the Live view says how many are studying under its title');
    await page.screenshot({ path: path.join(shots, 'live-desktop-light.png'), fullPage: true });
    const c1 = await liveCalls();
    await page.waitForTimeout(31500);
    const c2 = await liveCalls();
    ok(c2 === c1 + 1, `Live checks again after 30 s while open (${c1} -> ${c2})`);
    await go(page, 'overview');
    await page.waitForTimeout(31500);
    ok(await liveCalls() === c2, 'Live stops checking while another tab is open');
    await go(page, 'live');
    await page.waitForTimeout(800);
    const c3 = await liveCalls();
    ok(c3 === c2 + 1, `back on Live it checks at once (${c2} -> ${c3})`);
    await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); });
    await page.waitForTimeout(31500);
    ok(await liveCalls() === c3, 'Live stops checking while the page is hidden');
    await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' }); document.dispatchEvent(new Event('visibilitychange')); });
    await page.waitForTimeout(800);
    ok(await liveCalls() === c3 + 1, 'Live checks at once when the page is visible again');
    notes.push('Live: 5 people, names by hub, no ids; polls every 30 s only while open and visible');

    /* Hubs: archive Occlusion by hand, with the confirmation step */
    await hubsTab(page);
    ok(await page.$eval('[data-arch-hub="occlusion"] .state', e => e.textContent) === 'Live', 'Occlusion starts Live (automatic)');
    const removedLive = await page.$('[data-arch-hub="hepatobiliary"]') ? await (async () => { await page.click('[data-arch-edit="hepatobiliary"]'); const d = await page.$eval('[data-arch-form="hepatobiliary"] input[value=live]', e => e.disabled); await page.keyboard.press('Escape'); return d; })() : true;
    ok(removedLive, 'a hub whose page is removed can\'t be set to Live');
    await page.click('[data-arch-edit="occlusion"]');
    ok(await page.evaluate(() => document.activeElement && document.activeElement.value === 'auto'), 'opening the form puts focus on the current state');
    await page.keyboard.press('Escape');
    ok(await page.evaluate(() => document.activeElement && document.activeElement.getAttribute('data-arch-edit') === 'occlusion' && !document.querySelector('[data-arch-form="occlusion"]')), 'Escape closes the form and returns focus to Change…');
    await setState(page, 'occlusion', 'archived', null, 'Test: exam moved');
    await page.waitForSelector('[data-arch-form="occlusion"] .arch-confirm');
    const ctext = await page.textContent('[data-arch-form="occlusion"] .arch-confirm');
    ok(/Archived/.test(ctext) && /until you change it/.test(ctext) && /progress stay/.test(ctext), `the confirmation says what changes and what stays ("${ctext.slice(0, 90)}…")`);
    ok(await page.evaluate(() => document.activeElement && document.activeElement.classList.contains('arch-confirm')), 'focus moves to the confirmation');
    ok(await writes(page) === 0, 'nothing is saved before Confirm');
    await page.screenshot({ path: path.join(shots, 'hubs-confirm-desktop-light.png'), fullPage: true });
    await confirm(page, 'occlusion');
    ok(await writes(page) === 1, 'Confirm saves once');
    ok(/Archived/.test(await page.$eval('[data-arch-hub="occlusion"] .state', e => e.textContent)) && /Set by hand/.test(await page.textContent('[data-arch-hub="occlusion"]')), 'Occlusion shows Archived, set by hand');
    ok(/Occlusion:\s*Automatic → Archived[\s\S]*Test: exam moved/.test(await page.textContent('.log-list')), 'the change log has it, with the note');
    await page.screenshot({ path: path.join(shots, 'hubs-saved-desktop-light.png'), fullPage: true });

    let cards = await dashboard(ctx);
    const occ = card(cards, 'Occlusion');
    ok(occ && occ.archived && !occ.open, `the dashboard shows Occlusion archived with no Open button (${JSON.stringify(occ)})`);
    const hp = await open(ctx, 'hubs/occlusion/');
    const notice = await hp.waitForSelector('.sh-archived', { timeout: 8000 }).then(() => hp.textContent('.sh-archived'), () => '');
    ok(/This hub is archived/.test(notice) && /being updated right now/.test(notice), `the hub page says it is archived (got "${notice.slice(0, 80)}")`);
    await hp.close();

    /* reverse it: Back to automatic */
    await page.bringToFront();
    await page.click('[data-arch-auto="occlusion"]');
    ok(/goes back to Automatic/.test(await page.textContent('[data-arch-form="occlusion"] .arch-confirm')), 'Back to automatic asks first');
    await confirm(page, 'occlusion');
    ok(await page.$eval('[data-arch-hub="occlusion"] .state', e => e.textContent) === 'Live', 'Occlusion is Live again');
    cards = await dashboard(ctx);
    ok((card(cards, 'Occlusion') || {}).open, 'the dashboard shows Occlusion open again');
    const hp2 = await open(ctx, 'hubs/occlusion/');
    await hp2.waitForTimeout(4000);
    ok(!(await hp2.$('.sh-archived')), 'the hub page no longer says it is archived');
    await hp2.close();
    notes.push('Hubs: archive by hand -> dashboard card and hub notice; back to automatic -> open again');

    /* an end time: Heme & Endo (gone by its dates) reopened until 6 pm, then its dates again */
    await setState(page, 'heme-endo-exam1', 'live', '2026-11-10T09:00');
    await page.waitForSelector('[data-arch-hub="heme-endo-exam1"] .arch-msg.msg-err');
    ok(await writes(page) === 2, 'an end time in the past is refused before saving');
    await page.fill('[data-arch-form="heme-endo-exam1"] [name=until]', '2026-11-10T18:00');
    await page.click('[data-arch-form="heme-endo-exam1"] [type=submit]');
    ok(/until .*Nov.* 10/.test(await page.textContent('[data-arch-form="heme-endo-exam1"] .arch-confirm')), 'the confirmation names the end time');
    await confirm(page, 'heme-endo-exam1');
    cards = await dashboard(ctx);
    ok((card(cards, 'Heme & Endo Exam 1') || {}).open, 'reopened: the dashboard shows Heme & Endo open before its end time');
    cards = await dashboard(ctx, '&now=2026-11-10T19:00');
    ok(!card(cards, 'Heme & Endo Exam 1'), 'after its end time Heme & Endo goes back to its dates (no card)');
    notes.push('end time: reopened until 6 pm, its dates again at 7 pm');

    /* a change from a stale page is refused, not overwritten */
    const a = await admin(ctx, `review/?persona=admin&now=${NOW}`), b = await admin(ctx, `review/?persona=admin&now=${NOW}`);
    await hubsTab(a); await hubsTab(b);
    await setState(a, 'perio', 'hidden'); await confirm(a, 'perio');
    await setState(b, 'perio', 'archived'); await b.waitForSelector('[data-arch-form="perio"] .arch-confirm'); await b.click('[data-arch-confirm="perio"]');
    await b.waitForSelector('[data-arch-hub="perio"] .arch-msg.msg-err', { timeout: 10000 });
    ok(/changed in another tab/.test(await b.textContent('[data-arch-hub="perio"] .arch-msg')), 'the stale page is told someone else changed it');
    ok(await b.$eval('[data-arch-hub="perio"] .state', e => e.textContent) === 'Hidden', 'the stale page reloads the real state');
    await b.click('[data-arch-auto="perio"]'); await confirm(b, 'perio');
    await a.close(); await b.close();
    notes.push('a change from a stale tab is refused and the tab reloads');

    ok(G.leaks.length === 0, `requests to Supabase: ${G.leaks.join(', ')}`);
    ok(await page.evaluate(() => window.__shPreview.blocked()) === 0, 'the preview blocked a request to production');
    await ctx.close();

    /* ---------- 2. phone, dark: no sideways scrolling ---------- */
    const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'dark' });
    const G2 = await L.guard(phone);
    const m = await admin(phone, `review/?persona=admin&now=${NOW}`);
    const wide = () => m.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - 390);
    /* the menu: a full-screen sheet; Escape closes it and gives focus back to the Menu button */
    await m.tap('#menuBtn'); await m.waitForSelector('#sidebar.open');
    ok(await m.evaluate(() => document.activeElement && document.activeElement.closest('#sidebar') !== null), 'opening the menu moves focus into it');
    await m.keyboard.press('Escape');
    ok(await m.evaluate(() => !document.querySelector('#sidebar').classList.contains('open') && document.activeElement && document.activeElement.id === 'menuBtn'), 'Escape closes the menu and returns focus to Menu');
    const barTaps = await m.$$eval('.mbar .btn', els => els.map(e => Math.round(e.getBoundingClientRect().height)));
    ok(barTaps.every(h => h >= 44), `the top bar's buttons are at least 44 px tall (${barTaps})`);
    for (const tab of ['overview', 'live', 'checkins', 'inbox', 'hubs', 'health']) {
      await go(m, tab);
      if (tab === 'live') await m.waitForFunction(() => (document.querySelector('#liveTotal') || {}).textContent === '5');
      if (tab === 'hubs') { await m.waitForSelector('[data-arch-hub="occlusion"] .state'); await m.waitForTimeout(400); await m.tap('[data-arch-edit="occlusion"]'); await m.tap('[data-arch-form="occlusion"] input[value=hidden]'); await m.tap('[data-arch-form="occlusion"] [type=submit]'); await m.waitForSelector('.arch-confirm'); }
      if (tab === 'checkins') await m.waitForSelector('[data-checkin-group]');
      if (tab === 'overview') await m.waitForSelector('[data-panel=overview] .card');
      if (tab === 'health') await m.waitForSelector('[data-panel=health] .qh-item', { timeout: 30000 });   /* Question health: the fixture flags on a live hub */
      await m.waitForTimeout(300);
      const over = await wide();
      ok(over <= 0, `${tab} scrolls sideways on a 390 px phone by ${over} px`);
      await m.screenshot({ path: path.join(shots, `${tab}-phone-dark.png`), fullPage: tab !== 'checkins' });
    }
    const tap = await m.$$eval('[data-arch-form="occlusion"] .arch-opt, [data-arch-form="occlusion"] .btn', els => els.filter(e => e.offsetParent).map(e => Math.round(e.getBoundingClientRect().height)));
    ok(tap.every(h => h >= 40), `touch targets in the form are at least 40 px tall (${tap})`);
    ok(G2.leaks.length === 0, `phone: requests to Supabase: ${G2.leaks.join(', ')}`);
    await phone.close();
    notes.push('phone (390 px, dark): the menu (focus in, Escape out, 44 px bar); Overview, Live, Hubs with the form open, Check-ins and Inbox fit with no sideways scroll');
    ok(!errs.length, `page errors: ${errs.slice(0, 3).join(' | ')}`);
    notes.push(`screenshots in ${shots}`);
  } catch (e) {
    problems.push(`test run failed: ${e.message.split('\n')[0]}`);
  }
  await browser.close(); srv.server.close();
  process.exit(L.report('admin page (Live, Hubs, order) in a preview', problems, notes));
})();
