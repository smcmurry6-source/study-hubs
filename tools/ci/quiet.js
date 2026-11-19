// node tools/ci/quiet.js. The quiet spell (widget/v3.js, 2026-11-18): a fake database fails the first answer save; the page should hold every answer
// (one line, nothing sent during the spell), then save them one at a time in order with the same request ids, and hold
// its click batch meanwhile. Then a page whose database works: three quick answers all saved within a few seconds.
// And the answers kept on the device (2026-11-19): a page whose saves fail is hidden, shown, hidden again; a second page
// of the hub opens on a working database and sends them, in order, spaced as answered, with the same ids; the first page,
// shown again, finds them taken and sends nothing more.
// And fewer calls from the page (2026-11-19, the database optimization pass, phase 2, migration_v82): phase2() below.
// And the answer history kept on the device (phase 3, migration_v84): history() below.
// Nothing reaches the real database: every request off 127.0.0.1 is answered here, and every WebSocket is closed (the
// pages aren't marked automated, so a live realtime connection would put them in the class's "studying now" count).
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const root = path.resolve(__dirname, '../..');
const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.mp3': 'audio/mpeg' };
const server = http.createServer((req, res) => {
  let u = decodeURIComponent(req.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html';
  const f = path.join(root, u); if (!f.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.stat(f, (e, st) => { if (e || !st.isFile()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); });
}).listen(0, '127.0.0.1');
const BASE = () => `http://127.0.0.1:${server.address().port}/`;
const problems = [];
const rank = { xp: 2400, journey: 0, tier: 1, level: 2, step: 4, gtier: 1, step_at: 2000, next_at: 3000, tier_at: 1500, steps: 63, answers: 300, correct: 220, days: 12, badges: [], dark_seen: [], boost: null };

async function run(browser, failFirst){
  const context = await browser.newContext();
  if (context.routeWebSocket) await context.routeWebSocket(/.*/, ws => ws.close());
  const t0 = Date.now(), log = [];
  let inflight = 0, maxInflight = 0, answers = 0;
  await context.route(/^https?:\/\/(?!127\.0\.0\.1)/, async route => {
    const u = route.request().url(), fn = (/\/rpc\/([a-z0-9_]+)/.exec(u) || [])[1] || (/\/rest\/v1\/([a-z_]+)/.exec(u) || [])[1] || '';
    if (!/supabase\.co/.test(u)) return route.fulfill({ status: 204, body: '' });
    let a = {}; try { a = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
    log.push({ t: Date.now() - t0, fn, req: a.p_request, qid: a.p_qid });
    const json = (b, s) => route.fulfill({ status: s || 200, contentType: 'application/json', body: JSON.stringify(b) });
    if (fn === 'get_widget_bootstrap_v2') return json({ rank, mastery: [] });
    if (fn === 'get_rank_profile_v2') return json(rank);
    if (fn === 'record_answer_v2') {
      inflight++; maxInflight = Math.max(maxInflight, inflight); const n = ++answers;
      await new Promise(r => setTimeout(r, 400));
      inflight--;
      if (failFirst && n === 1) return json({ code: '57014', message: 'canceling statement due to statement timeout' }, 500);
      return json({ ok: true, correct: true, kind: 'one', xp: 10, base: 10, mult: 1, why: null, bonus: [], boost: null, total: 2400 + n * 10, crowns: 100 + n });
    }
    return json(fn ? null : []);
  });
  const page = await context.newPage(), errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.addInitScript(() => { try { Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false, configurable: true }); } catch (e) {} });
  await page.goto(BASE() + 'hubs/heme-endo-exam3/index.html#questions');
  const on = await page.waitForFunction(() => window.shGame && window.shGame.v2() && window.shDb, null, { timeout: 20000 }).catch(() => null);
  if (!on) { problems.push(`${failFirst ? 'failing' : 'working'} database: the page didn't come up on the game layer with window.shDb`); await context.close(); return; }
  const ev = await page.evaluate(() => { const s = [...document.scripts].find(x => x.dataset && x.dataset.answeredEvent); return s ? s.dataset.answeredEvent : 'hee3:answered'; });
  const from = log.length;
  for (const q of ['pq-1', 'pq-2', 'pq-3']) {
    await page.evaluate(([e, qid]) => document.dispatchEvent(new CustomEvent(e, { detail: { qid, choice: 0, correct: true, ctx: 'bank' } })), [ev, q]);
    await page.waitForTimeout(500);
  }
  const ans = () => log.slice(from).filter(c => c.fn === 'record_answer_v2');
  if (!failFirst) {
    await page.waitForTimeout(3000);
    const a = ans();
    if (a.length !== 3) problems.push(`working database: 3 answers should be 3 saves within 4 s, got ${a.length}`);
    if (maxInflight > 1) problems.push(`working database: ${maxInflight} saves in flight at once (the line sends one at a time)`);
    console.log('working database:', a.map(c => `${c.qid}@${c.t}ms`).join(', '), '| most in flight at once:', maxInflight);
  } else {
    await page.waitForTimeout(4000);
    const busy = await page.evaluate(() => window.shDb.busy());
    const early = ans();
    if (!busy) problems.push('failing database: no quiet spell after the failed save');
    if (early.length !== 1) problems.push(`failing database: during the quiet spell only the first (failed) save should have gone, got ${early.length}`);
    // a click in the spell: its batch should wait
    await page.mouse.click(10, 10); await page.evaluate(() => window.shClicks && window.shClicks.flush && window.shClicks.flush());
    const clicksInSpell = log.slice(from).filter(c => c.fn === 'record_clicks' || c.fn === 'record_events' || c.fn === 'record_analytics').length;
    for (let i = 0; i < 100 && ans().length < 4; i++) await page.waitForTimeout(500);
    const a = ans();
    console.log('failing database:', a.map(c => `${c.qid}@${Math.round(c.t / 1000)}s`).join(', '), '| most in flight at once:', maxInflight, '| clicks sent in the spell:', clicksInSpell);
    if (a.length !== 4) problems.push(`failing database: expected 4 saves (one failed, then three), got ${a.length}`);
    else {
      if (JSON.stringify(a.map(c => c.qid)) !== JSON.stringify(['pq-1', 'pq-1', 'pq-2', 'pq-3'])) problems.push(`failing database: saves out of order: ${a.map(c => c.qid)}`);
      if (a[0].req !== a[1].req) problems.push('failing database: the retry should carry the same request id');
      if (a[1].t - a[0].t < 20000) problems.push(`failing database: the retry came ${a[1].t - a[0].t} ms after the failure, inside the quiet spell (22-37 s)`);
    }
    if (maxInflight > 1) problems.push(`failing database: ${maxInflight} saves in flight at once`);
    if (clicksInSpell) problems.push(`failing database: ${clicksInSpell} click/event batches sent during the quiet spell`);
    if (await page.evaluate(() => window.shDb.busy())) problems.push('failing database: still in a quiet spell after a save worked');
  }
  if (errs.length) problems.push(`page errors: ${errs.join(' | ')}`);
  await context.close();
}

async function kept(browser){
  const context = await browser.newContext(), t0 = Date.now(), log = [], KEY = 'sh_answers_kept:heme-endo-exam3';
  if (context.routeWebSocket) await context.routeWebSocket(/.*/, ws => ws.close());
  let failing = true;
  await context.route(/^https?:\/\/(?!127\.0\.0\.1)/, async route => {
    const u = route.request().url(), fn = (/\/rpc\/([a-z0-9_]+)/.exec(u) || [])[1] || '';
    if (!/supabase\.co/.test(u)) return route.fulfill({ status: 204, body: '' });
    let a = {}; try { a = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
    const json = (b, s) => route.fulfill({ status: s || 200, contentType: 'application/json', body: JSON.stringify(b) });
    if (fn === 'get_widget_bootstrap_v2') return json({ rank, mastery: [] });
    if (fn === 'get_rank_profile_v2') return json(rank);
    if (fn === 'record_answer_v2') {
      const c = { t: Date.now() - t0, req: a.p_request, qid: a.p_qid, failed: failing };
      log.push(c);
      await new Promise(r => setTimeout(r, 400));
      c.done = Date.now() - t0;
      if (c.failed) return json({ code: '57014', message: 'canceling statement due to statement timeout' }, 500);
      return json({ ok: true, correct: true, kind: 'one', xp: 10, base: 10, mult: 1, why: null, bonus: [], boost: null, total: 2410, crowns: 101 });
    }
    return json(fn ? null : []);
  });
  await context.addInitScript(() => { try { Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false, configurable: true }); } catch (e) {} });
  const errs = [], open = async () => {
    const page = await context.newPage(); page.on('pageerror', e => errs.push(e.message));
    await page.goto(BASE() + 'hubs/heme-endo-exam3/index.html#questions');
    return (await page.waitForFunction(() => window.shGame && window.shGame.v2() && window.shDb, null, { timeout: 20000 }).catch(() => null)) ? page : null;
  };
  const show = (page, hidden) => page.evaluate(h => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => h ? 'hidden' : 'visible' }); document.dispatchEvent(new Event('visibilitychange')); }, hidden);
  const stored = page => page.evaluate(k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return 'unreadable'; } }, KEY);
  const a = await open();
  if (!a) { problems.push("kept answers: the page didn't come up on the game layer"); await context.close(); return; }
  const ev = await a.evaluate(() => { const s = [...document.scripts].find(x => x.dataset && x.dataset.answeredEvent); return s ? s.dataset.answeredEvent : 'hee3:answered'; });
  for (const q of ['pq-1', 'pq-2']) {
    await a.evaluate(([e, qid]) => document.dispatchEvent(new CustomEvent(e, { detail: { qid, choice: 0, correct: true, ctx: 'bank' } })), [ev, q]);
    await a.waitForTimeout(2500);
  }
  const first = log.slice();
  if (first.length !== 1) problems.push(`kept answers: one failed save before the quiet spell, got ${first.length}`);
  await show(a, true);
  const k1 = await stored(a);
  const ids = Array.isArray(k1) ? k1.map(e => e && e.a && e.a.p_request) : [];
  if (!Array.isArray(k1) || JSON.stringify(k1.map(e => e.a.p_qid)) !== '["pq-1","pq-2"]') problems.push(`kept answers: hidden, the device should keep pq-1 and pq-2, got ${JSON.stringify(k1)}`);
  else if (first[0] && ids[0] !== first[0].req) problems.push('kept answers: the kept pq-1 should carry the request id it was sent with');
  await show(a, false);
  const k2 = await stored(a);
  if (k2 !== null) problems.push(`kept answers: shown again, the page should take its answers back off the device, left ${JSON.stringify(k2)}`);
  await show(a, true);
  failing = false;
  const from = log.length, b = await open();
  if (!b) { problems.push("kept answers: the second page didn't come up"); await context.close(); return; }
  for (let i = 0; i < 40 && log.length - from < 2; i++) await b.waitForTimeout(500);
  await b.waitForTimeout(1000);
  const sent = log.slice(from);
  console.log('kept answers: the second page sent', sent.map(c => `${c.qid}@${c.t}ms`).join(', '));
  if (sent.length !== 2) problems.push(`kept answers: the second page should send the 2 kept answers, sent ${sent.length}`);
  else {
    if (sent[0].qid !== 'pq-1' || sent[1].qid !== 'pq-2') problems.push(`kept answers: out of order: ${sent.map(c => c.qid)}`);
    if (sent[0].req !== ids[0] || sent[1].req !== ids[1]) problems.push('kept answers: sent with new request ids (they must be the kept ones)');
    if (sent[1].t - sent[0].done < 2000) problems.push(`kept answers: answered 2.5 s apart, sent ${sent[1].t - sent[0].done} ms after the one before came back (the speed limit wants 2 s)`);
  }
  if ((await stored(b)) !== null) problems.push('kept answers: still on the device after the second page sent them');
  // the first page, shown again, finds them taken: nothing more from it, even after its quiet spell (up to 37.5 s)
  await show(a, false);
  const spellEnd = (first[0] ? first[0].done : 0) + 40000;
  while (Date.now() - t0 < spellEnd) await b.waitForTimeout(1000);
  const more = log.length - from - 2;
  if (more > 0) problems.push(`kept answers: the first page sent ${more} more after the second page took its answers`);
  if (errs.length) problems.push(`kept answers, page errors: ${errs.join(' | ')}`);
  await context.close();
}

// The study-time pings go out together (2026-11-19, migration_v77): a visit's first ping at once, then what the page counted
// (one a 25 s) in one record_activity_pings call a minute, each with its age; what is held when the page is hidden goes at
// once; a database without the call gets one record_activity_ping a ping. And the changelog is read once, then kept on
// the device (half an hour), not every four minutes. The page's clock is run by hand, so four minutes take a moment.
async function pings(browser, missing){
  const what = missing ? 'pings, a database without record_activity_pings' : 'pings';
  const context = await browser.newContext();
  if (context.routeWebSocket) await context.routeWebSocket(/.*/, ws => ws.close());
  const log = [];
  await context.route(/^https?:\/\/(?!127\.0\.0\.1)/, async route => {
    const u = route.request().url(), fn = (/\/rpc\/([a-z0-9_]+)/.exec(u) || [])[1] || (/\/rest\/v1\/([a-z_]+)/.exec(u) || [])[1] || '';
    if (!/supabase\.co/.test(u)) return route.fulfill({ status: 204, body: '' });
    let a = {}; try { a = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
    log.push({ fn, items: a.p_items, section: a.p_section, visit: a.p_visit });
    const json = (b, s) => route.fulfill({ status: s || 200, contentType: 'application/json', body: JSON.stringify(b) });
    if (fn === 'get_widget_bootstrap_v2') return json({ rank, mastery: [] });
    if (fn === 'get_rank_profile_v2') return json(rank);
    if (fn === 'changelog') return json([{ created_at: '2026-11-19T01:00:00+00:00' }]);
    if (fn === 'record_activity_pings' && missing) return json({ code: 'PGRST202', message: 'Could not find the function public.record_activity_pings' }, 404);
    return json(fn ? null : []);
  });
  await context.addInitScript(() => { try { Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false, configurable: true }); } catch (e) {} });
  const page = await context.newPage(), errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.clock.install();
  await page.goto(BASE() + 'hubs/heme-endo-exam3/index.html#questions');
  if (!(await page.waitForFunction(() => window.shGame && window.shGame.v2() && window.shDb, null, { timeout: 20000 }).catch(() => null))) {
    problems.push(`${what}: the page didn't come up on the game layer`); await context.close(); return;
  }
  const settle = () => page.waitForTimeout(400);   // real time, for the answers to the calls
  const of = name => log.filter(c => c.fn === name);
  await page.clock.runFor(3000); await settle();
  // the visit's first ping, at once
  const first = of('record_activity_pings');
  if (first.length !== 1 || !Array.isArray(first[0].items) || first[0].items.length !== 1 || first[0].items[0].a !== 0)
    problems.push(`${what}: the visit's first ping should go at once, alone, with age 0 (${JSON.stringify(first.map(c => c.items))})`);
  if (missing) {
    if (of('record_activity_ping').length !== 1) problems.push(`${what}: the first ping should be sent again the old way (${of('record_activity_ping').length} record_activity_ping calls)`);
  } else if (of('record_activity_ping').length) problems.push(`${what}: ${of('record_activity_ping').length} old one-ping calls with the new call working`);
  // two minutes on the page: a ping at 50, 75 and 100 s (the first was credited ahead), sent together a minute after the first of them
  await page.clock.runFor(112000); await settle();
  if (missing) {
    if (of('record_activity_pings').length !== 1) problems.push(`${what}: asked for the missing call again (${of('record_activity_pings').length} calls)`);
    if (of('record_activity_ping').length !== 4) problems.push(`${what}: 3 held pings should go as 3 old calls (${of('record_activity_ping').length - 1})`);
  } else {
    const calls = of('record_activity_pings');
    const ages = calls[1] && Array.isArray(calls[1].items) ? calls[1].items.map(i => i.a) : null;
    if (calls.length !== 2 || !ages || ages.length !== 3 || Math.abs(ages[0] - 60) > 3 || Math.abs(ages[1] - 35) > 3 || Math.abs(ages[2] - 10) > 3)
      problems.push(`${what}: after two minutes, one call with three pings counted about 60, 35 and 10 s before (${calls.length - 1} calls, ages ${JSON.stringify(ages)})`);
    else if (calls[1].items.some(i => typeof i.s !== 'string' || !i.s) || calls[1].visit !== calls[0].visit) problems.push(`${what}: every ping carries its section, and the call the same visit`);
    // 40 s more (a ping at 125 and 150 s), then the page is hidden: what it holds goes at once, with half a ping's worth rounded up
    await page.clock.runFor(40000);
    const before = of('record_activity_pings').length;
    await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); });
    await settle();
    const last = of('record_activity_pings').slice(before);
    if (last.length !== 1 || !Array.isArray(last[0].items) || last[0].items.length < 2) problems.push(`${what}: hiding the page should send what it holds in one call (${JSON.stringify(last.map(c => c.items))})`);
    if (of('record_activity_ping').length) problems.push(`${what}: ${of('record_activity_ping').length} old one-ping calls with the new call working`);
  }
  // the changelog: read once on load, then from the device (the watcher looks again at four minutes)
  await page.clock.runFor(120000); await settle();
  if (of('changelog').length !== 1) problems.push(`${what}: the changelog should be read once in five minutes, then kept on the device (${of('changelog').length} reads)`);
  if (errs.length) problems.push(`${what}, page errors: ${errs.join(' | ')}`);
  await context.close();
}

// Fewer calls from the page (2026-11-19, the database optimization pass, phase 2, migration_v82): a card's class numbers in
// one get_class_numbers call (not the question_stats and question_choices reads); question health's rows, the clicks and the
// events in one record_analytics call (not three); and on the game layer the tenth answer worked out on the page, with no
// get_rank_profile_v2 or get_hub_mastery, its XP from the replies and this hub's mastery from each question's last try, until
// something the page can't count happens (a trophy sent: the next tenth answer reads both). A database without
// migration_v82 gets the old reads and calls, and isn't asked for the missing ones again.
async function phase2(browser, missing){
  const what = missing ? 'phase 2, a database without migration_v82' : 'phase 2';
  const context = await browser.newContext();
  if (context.routeWebSocket) await context.routeWebSocket(/.*/, ws => ws.close());
  const log = []; let n = 0;
  const gone = { code: 'PGRST202', message: 'Could not find the function public.get_class_numbers' };
  await context.route(/^https?:\/\/(?!127\.0\.0\.1)/, async route => {
    const u = route.request().url(), fn = (/\/rpc\/([a-z0-9_]+)/.exec(u) || [])[1] || (/\/rest\/v1\/([a-z_]+)/.exec(u) || [])[1] || '';
    if (!/supabase\.co/.test(u)) return route.fulfill({ status: 204, body: '' });
    let a = {}; try { a = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
    log.push({ fn, a });
    const json = (b, s) => route.fulfill({ status: s || 200, contentType: 'application/json', body: JSON.stringify(b) });
    if (fn === 'get_widget_bootstrap_v2') return json({ rank: Object.assign({}, rank, { best_run: 30 }), mastery: [{ hub: 'heme-endo-exam3', latest_correct: 5, seen: 8 }],
      answers: [['pq-1', 1763500000, 0], ['pq-2', 1763500100, 1]] });
    if (fn === 'get_rank_profile_v2') return json(Object.assign({}, rank, { best_run: 30 }));
    if (fn === 'get_hub_mastery') return json([{ hub: 'heme-endo-exam3', latest_correct: 5, seen: 8 }]);
    if (missing && (fn === 'get_class_numbers' || fn === 'record_analytics')) return json(gone, 404);
    if (fn === 'get_class_numbers') return json({ stats: [{ qid: 'pq-1', attempts: 9, correct: 4 }], choices: [{ qid: 'pq-1', choice: 2, picks: 3 }] });
    if (fn === 'question_stats') return json([{ qid: 'pq-1', attempts: 9, correct: 4 }]);
    if (fn === 'question_choices') return json([{ qid: 'pq-1', choice: 2, picks: 3 }]);
    if (fn === 'record_answer_v2') { n++; return json({ ok: true, correct: true, kind: 'one', xp: 10, base: 10, mult: 1, why: null, bonus: [], boost: null, total: 2400 + n * 10, crowns: 100 + n }); }
    return json(fn ? null : []);
  });
  await context.addInitScript(() => { try { Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false, configurable: true }); } catch (e) {} });
  const page = await context.newPage(), errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto(BASE() + 'hubs/heme-endo-exam3/index.html#questions');
  if (!(await page.waitForFunction(() => window.shGame && window.shGame.v2() && window.shDb && window.shAnalytics && window.shClicks, null, { timeout: 20000 }).catch(() => null))) {
    problems.push(`${what}: the page didn't come up on the game layer`); await context.close(); return;
  }
  await page.waitForTimeout(1500);
  const count = (from, name) => log.slice(from).filter(c => c.fn === name).length;
  // the class's numbers on a card
  let from = log.length;
  const by = await page.evaluate(() => new Promise(ok => { window.shGetClassStats(['pq-1', 'pq-2'], b => ok(b), true); setTimeout(() => ok(null), 8000); }));
  const p1 = by && by['pq-1'], p2 = by && by['pq-2'];
  if (!p1 || p1.total !== 9 || p1.correct !== 4 || !p1.choices || p1.choices[2] !== 3 || !p2 || p2.total !== 0 || !p2.choices)
    problems.push(`${what}: the class's numbers came back wrong: ${JSON.stringify(by)}`);
  if (count(from, 'get_class_numbers') !== 1) problems.push(`${what}: ${count(from, 'get_class_numbers')} get_class_numbers calls for one card (1)`);
  if (missing) {
    if (count(from, 'question_stats') !== 1 || count(from, 'question_choices') !== 1) problems.push(`${what}: the old two reads should follow the missing call (${count(from, 'question_stats')}, ${count(from, 'question_choices')})`);
    from = log.length;
    await page.evaluate(() => new Promise(ok => { window.shGetClassStats(['pq-3'], () => ok(), true); setTimeout(ok, 8000); }));
    if (count(from, 'get_class_numbers')) problems.push(`${what}: asked for the missing get_class_numbers again`);
    if (count(from, 'question_stats') !== 1) problems.push(`${what}: the next card should read the old way (${count(from, 'question_stats')} question_stats reads)`);
  } else if (count(from, 'question_stats') || count(from, 'question_choices')) problems.push(`${what}: ${count(from, 'question_stats') + count(from, 'question_choices')} old reads beside get_class_numbers`);
  // the analytics: a click, a feature event and a row of question health go out together
  const flushOnce = () => page.evaluate(() => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = 'Phase two check'; document.body.appendChild(b); b.click(); b.remove();
    window.shTrack('ci:phase2');
    window.shAnalytics.send('qh', [{ q: 'pq-1', v: 'ci' }]);
  }).then(() => page.waitForTimeout(1500));
  from = log.length; await flushOnce();
  const one = log.slice(from).filter(c => c.fn === 'record_analytics'), old = ['record_qh', 'record_clicks', 'record_events'].map(f => count(from, f));
  if (!missing) {
    const a = one[0] && one[0].a;
    if (one.length !== 1 || !a || !(a.p_qh || []).length || !(a.p_clicks || []).length || !(a.p_events || []).some(e => e.k === 'ci:phase2'))
      problems.push(`${what}: a click, an event and a question-health row should go in one record_analytics call (${one.length} calls: ${JSON.stringify(one.map(c => c.a))})`);
    if (old.some(x => x)) problems.push(`${what}: old analytics calls beside record_analytics (record_qh ${old[0]}, record_clicks ${old[1]}, record_events ${old[2]})`);
  } else {
    if (one.length > 1) problems.push(`${what}: ${one.length} record_analytics calls (the missing one should be asked once)`);
    if (old.some(x => x !== 1)) problems.push(`${what}: the three old calls should follow (record_qh ${old[0]}, record_clicks ${old[1]}, record_events ${old[2]})`);
    from = log.length; await flushOnce();
    if (count(from, 'record_analytics')) problems.push(`${what}: asked for the missing record_analytics again`);
    if (['record_qh', 'record_clicks', 'record_events'].some(f => count(from, f) !== 1)) problems.push(`${what}: the next batches should go the old way`);
  }
  if (!missing) {
    // the tenth answer, on the page: nine quick answers, then a tenth once they are saved
    await page.evaluate(() => { window.__p2 = []; document.addEventListener('sh:rank-profile', e => window.__p2.push(e.detail)); });
    const ev = await page.evaluate(() => { const s = [...document.scripts].find(x => x.dataset && x.dataset.answeredEvent); return s ? s.dataset.answeredEvent : 'hee3:answered'; });
    const answer = async qs => {
      const saved = count(0, 'record_answer_v2') + qs.length;
      for (const q of qs) await page.evaluate(([e, qid]) => document.dispatchEvent(new CustomEvent(e, { detail: { qid, choice: 0, correct: true, ctx: 'bank' } })), [ev, q]);
      for (let i = 0; i < 60 && count(0, 'record_answer_v2') < saved; i++) await page.waitForTimeout(500);
    };
    const qs = Array.from({ length: 20 }, (_, i) => 'pq-' + (i + 1));
    from = log.length;
    await answer(qs.slice(0, 9)); await page.waitForTimeout(800); await answer(qs.slice(9, 10)); await page.waitForTimeout(2500);
    const reads = count(from, 'get_rank_profile_v2') + count(from, 'get_hub_mastery');
    const last = await page.evaluate(() => window.__p2[window.__p2.length - 1] || null);
    if (reads) problems.push(`${what}: the tenth answer read the rank or mastery ${reads} times (worked out on the page: none)`);
    if (!last) problems.push(`${what}: the tenth answer didn't redraw the rank (no sh:rank-profile)`);
    else {
      if (last.profile.xp !== 2500) problems.push(`${what}: after ten answers the XP should be the last reply's total, 2500 (${last.profile.xp})`);
      // 5 right of 8 seen, then pq-1 (wrong before) right, pq-2 (right before) right again, and eight new ones right: 14
      if (!last.mastery || last.mastery.got !== 14) problems.push(`${what}: after ten answers this hub's mastery should count 14 right on the latest try (${JSON.stringify(last.mastery)})`);
    }
    // a trophy sent from the page: the next tenth answer reads both again
    await page.evaluate(() => document.dispatchEvent(new CustomEvent('sh:trophy-sent')));
    from = log.length;
    await answer(qs.slice(10, 19)); await page.waitForTimeout(800); await answer(qs.slice(19)); await page.waitForTimeout(2500);
    if (count(from, 'get_rank_profile_v2') !== 1 || count(from, 'get_hub_mastery') !== 1)
      problems.push(`${what}: after a trophy, the next tenth answer should read the rank and mastery once each (${count(from, 'get_rank_profile_v2')}, ${count(from, 'get_hub_mastery')})`);
    console.log(`${what}: ten answers, ${reads} reads; after a trophy, ${count(from, 'get_rank_profile_v2') + count(from, 'get_hub_mastery')} reads`);
  }
  if (errs.length) problems.push(`${what}, page errors: ${errs.join(' | ')}`);
  await context.close();
}

/* phase 3 (migration_v84): the first page gets the whole history with its id and count, and keeps it; the second sends the
   cursor and gets two answers, and holds all of them; a database without v84 (missing) gets asked again without it. */
async function history(browser, missing){
  const context = await browser.newContext();
  if (context.routeWebSocket) await context.routeWebSocket(/.*/, ws => ws.close());
  const boots = [], since = [];
  const T = 1763500000, old = Array.from({ length: 30 }, (_, i) => ['pq-' + (i % 9), T + i * 10, i % 3 ? 1 : 0]);
  const fresh = [['pq-1', T + 295, 1], ['pq-2', T + 500, 0]];
  await context.route(/^https?:\/\/(?!127\.0\.0\.1)/, async route => {
    const u = route.request().url(), fn = (/\/rpc\/([a-z0-9_]+)/.exec(u) || [])[1] || '';
    if (!/supabase\.co/.test(u)) return route.fulfill({ status: 204, body: '' });
    let a = {}; try { a = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
    const json = (b, s) => route.fulfill({ status: s || 200, contentType: 'application/json', body: JSON.stringify(b) });
    if (fn === 'get_widget_bootstrap_v2') {
      boots.push(a);
      if (a.p_answers_after != null) {
        if (missing) return json({ code: 'PGRST202', message: 'Could not find the function' }, 404);
        return json({ rank, mastery: [], answers: fresh, answers_id: 132, answers_n: 32, answers_part: true });
      }
      return json(Object.assign({ rank, mastery: [], answers: old }, boots.length === 1 || !missing ? { answers_id: 130, answers_n: 30, answers_part: false } : {}));
    }
    if (fn === 'get_my_answers_since') { since.push(a); return json({ answers: [], answers_id: 132, answers_n: 32, answers_part: true }); }
    if (fn === 'get_rank_profile_v2') return json(rank);
    return json(fn ? null : []);
  });
  await context.addInitScript(() => { try { Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false, configurable: true }); } catch (e) {} });
  const what = `the answer history on the device (${missing ? 'a database without v84' : 'v84'})`, errs = [];
  const open = async () => {
    const page = await context.newPage(); page.on('pageerror', e => errs.push(e.message));
    await page.goto(BASE() + 'hubs/heme-endo-exam3/index.html#questions');
    await page.waitForFunction(() => window.shBootstrap && window.shBootstrap.data, null, { timeout: 20000 }).catch(() => null);
    await page.waitForTimeout(800);
    return page;
  };
  const a = await open();
  const kept = await a.evaluate(() => { try { return JSON.parse(localStorage.getItem('sh_answers_hist:heme-endo-exam3')); } catch (e) { return null; } });
  if (!kept || kept.id !== 130 || kept.n !== 30 || !Array.isArray(kept.a) || kept.a.length !== 30) problems.push(`${what}: the first page didn't keep the history with its id and count (${JSON.stringify(kept && { id: kept.id, n: kept.n })})`);
  if (boots[0] && boots[0].p_answers_after != null) problems.push(`${what}: the first page sent a cursor it didn't have`);
  await a.close();
  const b = await open();
  const second = boots.slice(1);
  if (!second[0] || second[0].p_answers_after !== 130 || second[0].p_answers_n !== 30) problems.push(`${what}: the second page didn't send the device's id and count (${JSON.stringify(second[0])})`);
  const got = await b.evaluate(() => window.shBootstrap.data && window.shBootstrap.data.answers);
  const stored = await b.evaluate(() => { try { return JSON.parse(localStorage.getItem('sh_answers_hist:heme-endo-exam3')); } catch (e) { return null; } });
  if (!missing) {
    const want = JSON.stringify(old.concat(fresh).map((r, i) => [r, i]).sort((x, y) => x[0][1] - y[0][1] || x[1] - y[1]).map(x => x[0]));
    if (JSON.stringify(got) !== want) problems.push(`${what}: the second page's history isn't the copy with the two new answers in place (${got && got.length})`);
    if (!stored || stored.id !== 132 || stored.n !== 32 || stored.a.length !== 32) problems.push(`${what}: the second page didn't keep the longer history`);
    if (second.length !== 1) problems.push(`${what}: ${second.length} bootstraps from the second page, not 1`);
    await b.evaluate(() => window.shSyncProgress && window.shSyncProgress());
    await b.waitForTimeout(600);
    if (since.length && (since[0].p_after !== 132 || since[0].p_n !== 32)) problems.push(`${what}: a later sync sent ${JSON.stringify(since[0])}`);
  } else {
    if (second.length !== 2 || second[1].p_answers_after != null) problems.push(`${what}: the page didn't ask again without the cursor (${second.length} calls)`);
    if (JSON.stringify(got) !== JSON.stringify(old)) problems.push(`${what}: the page didn't take the whole history from the second ask`);
    if (stored) problems.push(`${what}: the page kept a copy for a database that doesn't send its id`);
  }
  if (errs.length) problems.push(`${what}, page errors: ${errs.join(' | ')}`);
  await context.close();
}

(async () => {
  const browser = await chromium.launch();
  try { await run(browser, false); await Promise.all([run(browser, true), kept(browser), pings(browser, false), pings(browser, true), phase2(browser, false), phase2(browser, true), history(browser, false), history(browser, true)]); } finally { await browser.close(); server.close(); }
  if (problems.length) { console.log('✗', problems.join('\n✗ ')); process.exit(1); }
  console.log('✓ the quiet spell: one line, nothing sent in the spell, the same ids, in order; a working database saves at once; answers kept on the device go from the next page; pings go together once a minute, and the changelog is read once; a card\'s class numbers, the analytics and the tenth answer take one call or none; the answer history is kept on the device and only what is newer is read');
})();
