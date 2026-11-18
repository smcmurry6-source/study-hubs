// node tools/ci/quiet.js. The quiet spell (widget/v3.js, 2026-11-18): a fake database fails the first answer save; the page should hold every answer
// (one line, nothing sent during the spell), then save them one at a time in order with the same request ids, and hold
// its click batch meanwhile. Then a page whose database works: three quick answers all saved within a few seconds.
// Nothing reaches the real database: every request off 127.0.0.1 is answered here.
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

(async () => {
  const browser = await chromium.launch();
  try { await run(browser, false); await run(browser, true); } finally { await browser.close(); server.close(); }
  if (problems.length) { console.log('✗', problems.join('\n✗ ')); process.exit(1); }
  console.log('✓ the quiet spell: one line, nothing sent in the spell, the same ids, in order; a working database saves at once');
})();
