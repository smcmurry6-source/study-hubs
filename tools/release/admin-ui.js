#!/usr/bin/env node
// The admin page's Live, Hubs and Ask Timmy tabs and the Surveys tab's order, used in a preview (fixture data, production
// blocked) the way Sam would use them, plus what students then see on the dashboard and a hub page. Fails if
//   - check-in groups or surveys aren't newest first (the fixtures put the newest group last by name);
//   - Live shows an id, doesn't poll every 30 s while open, or polls while another tab is open or the page is hidden;
//   - archiving a hub skips the confirmation, doesn't reach the dashboard and the hub's notice, or can't be reversed;
//   - an end time doesn't hand the hub back to its dates; a change from a stale page isn't refused; a bad end time saves;
//   - Escape doesn't close the form and return focus; a removed page can be set to Live;
//   - Ask Timmy (migration_v55's admin_timmy_* calls, the preview's made-up chats): its numbers don't add up to what the
//     functions return; a visitor id or chat id is drawn; anything a student typed or Timmy answered is drawn as markup;
//     a chat doesn't open; the hub filter leaks other hubs; the settings save without asking, save a bad value, or don't
//     reach everyone's chat (on, off); the Inbox's "Read the chat with Timmy" doesn't open that chat; the calls answer
//     without the admin secret; before the release (the functions missing) the tab doesn't say so; serious or critical
//     axe violations on the tab with a chat open (when axe-core is installed, as in CI);
//   - any admin screen scrolls sideways at 390 px, a page throws, or any request heads for Supabase;
//   - the page turns dark on a dark-mode device (it is light only, Sam 2026-11-06).
// Screenshots (desktop light, phone on a dark-mode device) go to $SH_RELEASE_OUT/admin-ui/.   node tools/release/admin-ui.js
'use strict';
const path = require('path'), fs = require('fs');
const { start } = require('../preview/serve');
const L = require('./lib');
const problems = [], notes = [];
function ok(c, what){ if (!c) problems.push(what); }
const NOW = '2026-11-10T12:00';   /* before every live hub's last exam; Heme & Endo's card is gone by its dates */
let AXE = null; try { AXE = fs.readFileSync(process.env.AXE_CORE_PATH || require.resolve('axe-core/axe.min.js'), 'utf8'); } catch (e) {}
const FIX = 'https://fixtures.preview.invalid/rest/v1/rpc/';

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
    for (const v of ['insights', 'time', 'questions', 'health', 'clicks', 'searches', 'engagement', 'checkins', 'surveys', 'timmy', 'inbox', 'recap', 'overview']) {
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

    /* ---------- Ask Timmy (migration_v55, from the release): the preview answers admin_timmy_* with made-up chats ---------- */
    const T = '[data-panel=timmy]';
    const fixture = (fn, args) => page.evaluate(async ([u, a]) => { const r = await fetch(u, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(a) }); return { status: r.status, body: await r.json() }; }, [FIX + fn, args]);
    const secret = await page.evaluate(() => sessionStorage.getItem('sh_admin_secret'));
    const kpi = label => page.$$eval(`${T} .kpi`, (els, l) => { const k = els.find(e => e.querySelector('.kpi-label').textContent === l); return k ? k.querySelector('.kpi-value').textContent : null; }, label);
    const tmWrites = () => page.evaluate(() => window.__shPreview.log().filter(x => x.name === 'admin_timmy_config' && x.kind === 'write').length);
    await go(page, 'timmy');
    await page.waitForSelector(`${T} [data-tm-item]`, { timeout: 15000 });
    const days30 = (await fixture('admin_timmy_days', { p_secret: secret, p_days: 30 })).body;
    const sum = (rows, k) => rows.reduce((a, r) => a + Number(r[k]), 0);
    ok(await kpi('Questions') === sum(days30, 'questions').toLocaleString(), `the Questions figure is the days' total (${await kpi('Questions')} vs ${sum(days30, 'questions')})`);
    ok(await kpi('Estimated cost') === '$' + sum(days30, 'cost_usd').toFixed(2), `the cost is the days' total (${await kpi('Estimated cost')})`);
    ok(/^Timmy is on\. [\d,]+ questions in the last 30 days/.test(await page.textContent('#viewSub')), `the title row says he's on and how many questions ("${await page.textContent('#viewSub')}")`);
    const denied = await fixture('admin_timmy_chat', { p_secret: 'wrong', p_chat: '7e1e0000-0000-4000-a000-000000000001' });
    ok(denied.status === 401 && !JSON.stringify(denied.body).includes('working side'), `a chat without the admin secret is refused (${denied.status})`);
    /* a chat with markup in it: drawn as text, nothing runs, no element is made from it */
    const markup = page.locator(`${T} [data-tm-item]`, { hasText: 'Does <b>bold</b> work here?' }).first();
    await markup.locator('[data-tm-open]').click();
    await markup.locator('.tm-msg.is-timmy').waitFor({ timeout: 10000 });
    const mx = await page.evaluate(sel => { const el = document.querySelector(sel); return { els: el.querySelectorAll('img, script, iframe, u, svg, object, i:not(.bar > i)').length,
      bold: [...el.querySelectorAll('b')].some(b => /^bold$/.test(b.textContent)), xss: window.__tmXss, text: el.textContent }; }, T);
    ok(mx.els === 0 && !mx.bold && mx.xss === undefined, `a student's or Timmy's markup made elements (${mx.els} elements, bold ${mx.bold}, ran ${mx.xss})`);
    ok(['Does <b>bold</b> work here? <img src=x onerror="window.__tmXss=1">', 'so <i>this</i> shows', '<script>window.__tmXss=3</script>a quote with markup', 'L1 notes <u>underlined?</u>'].every(t => mx.text.includes(t)),
      'what the student typed, Timmy\'s answer, a quote and a label show as the text they are');
    ok(await markup.locator('[data-tm-open]').getAttribute('aria-expanded') === 'true' && (await markup.locator('[data-tm-open]').textContent()) === 'Hide the chat', 'an open chat says so on its button');
    /* a usual chat: both sides, where the student was, the checked quotes, the button he offered, what it cost */
    const usual = page.locator(`${T} [data-tm-item]`, { hasText: 'working side and the nonworking side' }).first();
    await usual.locator('[data-tm-open]').click();
    await usual.locator('.tm-msg.is-timmy').first().waitFor();
    const ut = await usual.locator('.tm-chat').textContent();
    ok(/Student[\s\S]*Lecture Notes · lecture review, paragraph 35[\s\S]*Timmy[\s\S]*Answered[\s\S]*Thumbs up[\s\S]*Checked\s*L1 notes: “the working \(laterotrusive\) side/.test(ut) && /Button: Open the notes: Occlusion review, paragraph 37/.test(ut) && /claude-opus-5-5 · [\d.]+ s · 1,180 in, 420 out/.test(ut),
      `a chat shows both sides, where the student was, checked quotes, the button and the cost ("${ut.slice(0, 160)}…")`);
    const ptext = await page.textContent(T);
    ok(!/preview0000|00000000-0000-4000|7e1e0000|visitor/i.test(ptext), 'the Timmy tab draws no visitor id or chat id');
    ok(/Closest lectures: Perio S4 Phase I Therapy & Instrumentation ×1/.test(ptext), 'Not covered sums up the closest lectures');
    await page.screenshot({ path: path.join(shots, 'timmy-desktop-light.png'), fullPage: true });
    if (AXE) {
      await page.addScriptTag({ content: AXE });
      const v = await page.evaluate(async sel => (await window.axe.run(sel, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] }, resultTypes: ['violations'] }))
        .violations.filter(x => x.impact === 'serious' || x.impact === 'critical').map(x => `${x.id} (${x.nodes.length}: ${x.nodes[0].target.join(' ')})`), T);
      ok(!v.length, `axe on the Timmy tab with chats open: ${v.join('; ')}`);
      notes.push('Ask Timmy: axe (WCAG 2.2 AA) finds nothing serious with two chats open');
    } else notes.push('Ask Timmy: axe-core isn\'t installed here, so its accessibility check was skipped (the Release tests run it)');
    /* one hub: every card shows only that hub, and the figures follow */
    await page.click(`${T} [data-tm-hub="perio"]`);
    const hubsShown = await page.$$eval(`${T} [data-tm-item] .report-top .hub`, els => [...new Set(els.map(e => e.textContent.trim()))]);
    ok(hubsShown.length && hubsShown.every(h => h === 'Perio'), `the hub filter shows Perio only (${hubsShown})`);
    ok(await kpi('Questions') === sum(days30.filter(r => r.hub === 'perio'), 'questions').toLocaleString(), 'the figures follow the hub filter');
    await page.click(`${T} [data-tm-hub="all"]`);
    notes.push('Ask Timmy: figures match the functions\' rows, a chat opens with both sides, markup shows as text, no ids, one hub at a time, no answer without the secret');
    /* the settings: a bad value is refused, a change asks first, Escape backs out, Confirm reaches everyone */
    const form = `${T} [data-tm-form]`;
    await page.fill(`${form} [name=cap]`, '500'); await page.click(`${form} [data-tm-save]`);
    ok(/0 to 100/.test(await page.textContent(`${form} [data-tm-msg]`)) && !(await page.$(`${form} .arch-confirm`)), 'a cap over $100 is refused before anything is asked');
    await page.fill(`${form} [name=cap]`, '15'); await page.uncheck(`${form} [name=enabled]`); await page.click(`${form} [data-tm-save]`);
    await page.waitForSelector(`${form} .arch-confirm`);
    const conf = await page.textContent(`${form} .arch-confirm`);
    ok(/Turn Timmy off for everyone/.test(conf) && /\$10\.00 → \$15\.00/.test(conf), `the confirmation says what changes ("${conf.slice(0, 120)}")`);
    ok(await page.evaluate(() => document.activeElement && document.activeElement.classList.contains('arch-confirm')), 'focus moves to the confirmation');
    ok(await tmWrites() === 0, 'nothing is saved before Confirm');
    await page.keyboard.press('Escape');
    ok(await page.evaluate(() => !document.querySelector('[data-tm-form] .arch-confirm') && document.activeElement && document.activeElement.hasAttribute('data-tm-save')), 'Escape backs out and returns focus to Save');
    await page.click(`${form} [data-tm-save]`); await page.click(`${form} [data-tm-confirm]`);
    await page.waitForFunction(() => /^Saved\./.test((document.querySelector('[data-tm-msg]') || {}).textContent || ''));
    ok(await tmWrites() === 1, 'Confirm saves once');
    ok(/^Timmy is off/.test(await page.textContent('#viewSub')) && (await page.textContent(`${T} .tm-status .state`)) === 'Off' && await page.inputValue(`${form} [name=cap]`) === '15', 'the tab shows him off with the new cap');
    const after = (await fixture('admin_timmy_config', { p_secret: secret })).body;
    ok(after.enabled === false && after.day_cap_usd === 15 && after.per_visitor_day === 40, `the settings saved as asked (${JSON.stringify(after)})`);
    await page.check(`${form} [name=enabled]`); await page.fill(`${form} [name=cap]`, '10'); await page.click(`${form} [data-tm-save]`);
    ok(/Turn Timmy back on/.test(await page.textContent(`${form} .arch-confirm`)), 'turning him back on asks too');
    await page.click(`${form} [data-tm-confirm]`);
    await page.waitForFunction(() => /^Saved\./.test((document.querySelector('[data-tm-msg]') || {}).textContent || ''));
    ok((await page.textContent(`${T} .tm-status .state`)) === 'On' && await tmWrites() === 2, 'he is on again');
    await page.click(`${form} [data-tm-save]`);
    ok(/Nothing changed/.test(await page.textContent(`${form} [data-tm-msg]`)) && await tmWrites() === 2, 'Save with nothing changed saves nothing');
    await page.screenshot({ path: path.join(shots, 'timmy-settings-desktop-light.png') });
    notes.push('Ask Timmy settings: $500 refused, off and $15 asked first and saved once, Escape backs out, back on, nothing changed saves nothing');
    /* the Inbox: a report from the chat's Report button opens its whole chat, and its reply shows on the Timmy tab */
    await go(page, 'inbox');
    await page.waitForSelector('[data-tm-report="8811"]');
    await page.click('[data-tm-report="8811"]');
    await page.waitForSelector(`${T} [data-tm-report-id="8811"] .tm-msg.is-focus`, { timeout: 10000 });
    ok(await page.evaluate(() => location.hash) === '#timmy' && /a day or two/.test(await page.textContent(`${T} [data-tm-report-id="8811"] .tm-msg.is-focus`)), 'the Inbox\'s "Read the chat with Timmy" opens that chat at the reported answer');
    ok(/Open/.test(await page.textContent(`${T} [data-tm-report-id="8811"] .report-top`)), 'the reported answer shows as open');
    await page.screenshot({ path: path.join(shots, 'timmy-reported-desktop-light.png'), fullPage: true });
    await page.click(`${T} [data-tm-report-id="8811"] a[href="#inbox"]`);
    await page.waitForSelector('.report[data-id="8811"] .resolve-btn');
    await page.fill('.report[data-id="8811"] .report-replybox', 'Thanks: Timmy\'s rules now say to quote the notes word for word.');
    await page.click('.report[data-id="8811"] .resolve-btn');
    await page.waitForSelector('[data-panel=inbox] .report[data-id="8811"]', { state: 'detached' });   /* the Inbox shows open reports */
    await go(page, 'timmy'); await page.click('#refreshBtn');
    await page.waitForFunction(() => /Resolved/.test((document.querySelector('[data-panel=timmy] [data-tm-report-id="8811"] .report-top') || {}).textContent || ''), null, { timeout: 10000 });
    notes.push('Ask Timmy: the Inbox opens a reported answer\'s chat; resolving it there shows Resolved here');

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

    /* ---------- 2. phone in dark mode: the page stays light, no sideways scrolling ---------- */
    const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'dark' });
    const G2 = await L.guard(phone);
    const m = await admin(phone, `review/?persona=admin&now=${NOW}`);
    const wide = () => m.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - 390);
    /* light only (Sam, 2026-11-06: dark was hard to read): a dark-mode phone still gets the light page */
    const look = await m.evaluate(() => [getComputedStyle(document.body).backgroundColor, getComputedStyle(document.querySelector('.sheet')).backgroundColor, getComputedStyle(document.documentElement).colorScheme]);
    ok(look[0] === 'rgb(238, 242, 244)' && look[1] === 'rgb(255, 255, 255)' && look[2] === 'light', `the admin page stays light on a dark-mode phone (body ${look[0]}, sheet ${look[1]}, color-scheme ${look[2]})`);
    /* the menu: a full-screen sheet; Escape closes it and gives focus back to the Menu button */
    await m.tap('#menuBtn'); await m.waitForSelector('#sidebar.open');
    ok(await m.evaluate(() => document.activeElement && document.activeElement.closest('#sidebar') !== null), 'opening the menu moves focus into it');
    await m.keyboard.press('Escape');
    ok(await m.evaluate(() => !document.querySelector('#sidebar').classList.contains('open') && document.activeElement && document.activeElement.id === 'menuBtn'), 'Escape closes the menu and returns focus to Menu');
    const barTaps = await m.$$eval('.mbar .btn', els => els.map(e => Math.round(e.getBoundingClientRect().height)));
    ok(barTaps.every(h => h >= 44), `the top bar's buttons are at least 44 px tall (${barTaps})`);
    for (const tab of ['overview', 'live', 'checkins', 'inbox', 'hubs', 'health', 'timmy']) {
      await go(m, tab);
      if (tab === 'live') await m.waitForFunction(() => (document.querySelector('#liveTotal') || {}).textContent === '5');
      if (tab === 'hubs') { await m.waitForSelector('[data-arch-hub="occlusion"] .state'); await m.waitForTimeout(400); await m.tap('[data-arch-edit="occlusion"]'); await m.tap('[data-arch-form="occlusion"] input[value=hidden]'); await m.tap('[data-arch-form="occlusion"] [type=submit]'); await m.waitForSelector('.arch-confirm'); }
      if (tab === 'checkins') await m.waitForSelector('[data-checkin-group]');
      if (tab === 'overview') await m.waitForSelector('[data-panel=overview] .card');
      if (tab === 'health') await m.waitForSelector('[data-panel=health] .qh-item', { timeout: 30000 });   /* Question health: the fixture flags on a live hub */
      if (tab === 'timmy') { await m.waitForSelector('[data-panel=timmy] [data-tm-item]'); const r = m.locator('[data-panel=timmy] [data-tm-report-id="8811"]'); await r.locator('[data-tm-open]').tap(); await r.locator('.tm-msg.is-timmy').waitFor(); }
      await m.waitForTimeout(300);
      /* touch targets, measured while that tab is the one showing (hidden ones have no size) */
      if (tab === 'hubs') {
        const tap = await m.$$eval('[data-arch-form="occlusion"] .arch-opt, [data-arch-form="occlusion"] .btn', els => els.filter(e => e.offsetParent).map(e => Math.round(e.getBoundingClientRect().height)));
        ok(tap.length && tap.every(h => h >= 40), `touch targets in the form are at least 40 px tall (${tap})`);
      }
      if (tab === 'timmy') {
        const tmTap = await m.$$eval('[data-panel=timmy] .btn, [data-panel=timmy] .chips button', els => els.filter(e => e.offsetParent).map(e => Math.round(e.getBoundingClientRect().height)));
        ok(tmTap.length && tmTap.every(h => h >= 44), `the Timmy tab's buttons are at least 44 px tall on a phone (${[...new Set(tmTap)]})`);
      }
      const over = await wide();
      ok(over <= 0, `${tab} scrolls sideways on a 390 px phone by ${over} px`);
      await m.screenshot({ path: path.join(shots, `${tab}-phone-dark.png`), fullPage: tab !== 'checkins' });
    }
    ok(G2.leaks.length === 0, `phone: requests to Supabase: ${G2.leaks.join(', ')}`);
    await phone.close();
    notes.push('phone (390 px, dark-mode device): the page stays light; the menu (focus in, Escape out, 44 px bar); Overview, Live, Hubs with the form open, Check-ins, Inbox, Question health and Ask Timmy with a chat open fit with no sideways scroll');

    /* ---------- 3. before the release: the live database has no admin_timmy_* functions, and the tab says so ---------- */
    const pre = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' });
    const G3 = await L.guard(pre);
    await pre.addInitScript(() => { try { const u = JSON.parse(localStorage.getItem('sh_preview_ui') || '{}'); u.missing = ['admin_timmy_']; localStorage.setItem('sh_preview_ui', JSON.stringify(u)); } catch (e) {} });
    const b4 = await admin(pre, `review/?persona=admin&now=${NOW}#timmy`);
    await b4.waitForFunction(() => /migration_v55/.test((document.querySelector('[data-panel=timmy]') || {}).textContent || ''), null, { timeout: 15000 });
    ok(/starts at the redesign’s release/.test(await b4.textContent('#viewSub')) && !(await b4.$('[data-panel=timmy] .err')) && !(await b4.$('[data-panel=timmy] [data-tm-form]')),
      'before the release the tab says Ask Timmy starts then, with no error and no settings');
    await b4.screenshot({ path: path.join(shots, 'timmy-before-release-desktop-light.png') });
    await go(b4, 'overview'); await b4.waitForSelector('[data-panel=overview] .card');
    ok(!(await b4.$('[data-panel=overview] .err')), 'the rest of the page works without them');
    ok(G3.leaks.length === 0, `before the release: requests to Supabase: ${G3.leaks.join(', ')}`);
    await pre.close();
    notes.push('before the release (admin_timmy_* missing, as on the live database): the tab says Ask Timmy starts at the release; the rest of the page works');
    ok(!errs.length, `page errors: ${errs.slice(0, 3).join(' | ')}`);
    notes.push(`screenshots in ${shots}`);
  } catch (e) {
    problems.push(`test run failed: ${e.message.split('\n')[0]}`);
  }
  await browser.close(); srv.server.close();
  process.exit(L.report('admin page (Live, Hubs, Ask Timmy, order) in a preview', problems, notes));
})();
