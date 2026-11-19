// node tools/ci/quiet.js. The quiet spell (widget/v3.js, 2026-11-18): a fake database fails the first answer save; the page should hold every answer
// (one line, nothing sent during the spell), then save them one at a time in order with the same request ids, and hold
// its click batch meanwhile. Then a page whose database works: three quick answers all saved within a few seconds.
// And the answers kept on the device (2026-11-19): a page whose saves fail is hidden, shown, hidden again; a second page
// of the hub opens on a working database and sends them, in order, spaced as answered, with the same ids; the first page,
// shown again, finds them taken and sends nothing more.
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
  await page.goto(BASE() + 'hubs/perio/index.html#questions');
  const on = await page.waitForFunction(() => window.shGame && window.shGame.v2() && window.shDb, null, { timeout: 20000 }).catch(() => null);
  if (!on) { problems.push(`${failFirst ? 'failing' : 'working'} database: the page didn't come up on the game layer with window.shDb`); await context.close(); return; }
  const ev = await page.evaluate(() => { const s = [...document.scripts].find(x => x.dataset && x.dataset.answeredEvent); return s ? s.dataset.answeredEvent : 'perio:answered'; });
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
    const clicksInSpell = log.slice(from).filter(c => c.fn === 'record_clicks' || c.fn === 'record_events').length;
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
  const context = await browser.newContext(), t0 = Date.now(), log = [], KEY = 'sh_answers_kept:perio';
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
    await page.goto(BASE() + 'hubs/perio/index.html#questions');
    return (await page.waitForFunction(() => window.shGame && window.shGame.v2() && window.shDb, null, { timeout: 20000 }).catch(() => null)) ? page : null;
  };
  const show = (page, hidden) => page.evaluate(h => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => h ? 'hidden' : 'visible' }); document.dispatchEvent(new Event('visibilitychange')); }, hidden);
  const stored = page => page.evaluate(k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return 'unreadable'; } }, KEY);
  const a = await open();
  if (!a) { problems.push("kept answers: the page didn't come up on the game layer"); await context.close(); return; }
  const ev = await a.evaluate(() => { const s = [...document.scripts].find(x => x.dataset && x.dataset.answeredEvent); return s ? s.dataset.answeredEvent : 'perio:answered'; });
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

(async () => {
  const browser = await chromium.launch();
  try { await run(browser, false); await Promise.all([run(browser, true), kept(browser)]); } finally { await browser.close(); server.close(); }
  if (problems.length) { console.log('✗', problems.join('\n✗ ')); process.exit(1); }
  console.log('✓ the quiet spell: one line, nothing sent in the spell, the same ids, in order; a working database saves at once; answers kept on the device go from the next page');
})();
