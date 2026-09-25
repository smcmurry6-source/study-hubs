// Browser smoke test + question-bank lint for every live hub and the dashboard.
// Class data (Supabase) is stubbed with empty results; nothing is written anywhere.
//   npm i --no-save playwright && npx playwright install chromium && node tools/ci/smoke.js
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const root = path.resolve(__dirname, '../..');
const TYPES = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css', '.mp3':'audio/mpeg', '.svg':'image/svg+xml', '.png':'image/png', '.webp':'image/webp', '.mp4':'video/mp4', '.webm':'video/webm', '.json':'application/json' };
const server = http.createServer((req, res) => {
  let u = decodeURIComponent(req.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html';
  const f = path.join(root, u); if (!f.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.stat(f, (e, st) => { if (e || !st.isFile()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Content-Length': st.size }); fs.createReadStream(f).pipe(res); });
}).listen(0, '127.0.0.1');
const BASE = () => `http://127.0.0.1:${server.address().port}/`;
const hubs = fs.readdirSync(path.join(root, 'hubs')).filter(h => fs.existsSync(path.join(root, 'hubs', h, 'index.html')));
const problems = [], notes = [];

async function stub(context){
  await context.route(/^https?:\/\/(?!127\.0\.0\.1)/, route => {
    const u = route.request().url();
    if (/supabase\.co\/rest\/v1\/rpc\/get_display_name/.test(u)) return route.fulfill({ status: 200, contentType: 'application/json', body: '"Test Molar"' });
    if (/supabase\.co\/rest\/v1\//.test(u)) return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    return route.abort();
  });
  if (context.routeWebSocket) await context.routeWebSocket(/.*/, ws => ws.close());
}

function lint(hub, A){
  const Q = A.QUESTIONS || [], L = A.LECTURES || [], ids = new Set(), lecIds = new Set(L.map(l => l.id));
  Q.forEach(q => {
    if (ids.has(q.id)) problems.push(`${hub}: duplicate question id ${q.id}`); ids.add(q.id);
    if (!lecIds.has(q.lec)) problems.push(`${hub}: ${q.id} points at unknown lecture "${q.lec}"`);
    if (q.type === 'mcq') {
      const ch = q.choices || [];
      if (ch.length < 2) problems.push(`${hub}: ${q.id} has fewer than 2 choices`);
      if (!(q.answer >= 0 && q.answer < ch.length)) problems.push(`${hub}: ${q.id} answer index ${q.answer} is out of range`);
      const low = ch.map(c => String(c).trim().toLowerCase()); if (new Set(low).size !== low.length) problems.push(`${hub}: ${q.id} has duplicate choices`);
    }
    if (q.type !== 'recall' && !String(q.ex || '').trim()) problems.push(`${hub}: ${q.id} has no explanation`);
  });
  const mc = Q.filter(q => q.type === 'mcq' && (q.choices || []).length >= 3);
  const longest = mc.filter(q => { const len = q.choices.map(c => String(c).length), a = len[q.answer]; return a > Math.max(...len.filter((_, i) => i !== q.answer)); }).length;
  const pct = mc.length ? Math.round(100 * longest / mc.length) : 0;
  notes.push(`${hub}: ${Q.length} questions, ${L.length} lectures; correct answer is the longest choice in ${pct}% of MCQs`);
  if (pct > 40) problems.push(`${hub}: the correct answer is the longest choice in ${pct}% of MCQs (keep it under 40%; chance is ~25%)`);
  const audioDir = path.join(root, 'hubs', hub, 'audio');
  if (fs.existsSync(audioDir)) L.forEach(l => {
    if (A.READINGS[l.id] && !fs.existsSync(path.join(audioDir, `${l.id}-full.mp3`))) problems.push(`${hub}: missing narration audio/${l.id}-full.mp3`);
    if (A.READINGS_PLAIN[l.id] && !fs.existsSync(path.join(audioDir, `${l.id}-plain.mp3`))) problems.push(`${hub}: missing narration audio/${l.id}-plain.mp3`);
  });
}

(async () => {
  await new Promise(r => server.listening ? r() : server.on('listening', r));
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  for (const vp of [{ width: 1366, height: 860 }, { width: 390, height: 844, isMobile: true }]) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.isMobile, hasTouch: !!vp.isMobile, serviceWorkers: 'block' }); /* sw.js would bypass the lint hook */
    await stub(context);
    const label = vp.isMobile ? 'phone' : 'desktop';
    // dashboard
    { const page = await context.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
      await page.goto(BASE() + 'index.html'); await page.waitForTimeout(800);
      errs.forEach(e => problems.push(`dashboard (${label}): ${e}`));
      const w = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (w > 1) problems.push(`dashboard (${label}): page scrolls sideways by ${w}px`);
      await page.close(); }
    for (const hub of hubs) {
      const page = await context.newPage(); const errs = [];
      page.on('pageerror', e => errs.push(e.message));
      if (!vp.isMobile) await page.route(`**/hubs/${hub}/index.html`, async route => {
        const r = await route.fetch(); let h = await r.text(); const i = h.lastIndexOf('window.SH_EXPORT = {');
        if (i > 0) h = h.slice(0, i) + 'window.__CI = { QUESTIONS: typeof QUESTIONS!=="undefined"?QUESTIONS:[], LECTURES: typeof LECTURES!=="undefined"?LECTURES:[], READINGS: typeof READINGS!=="undefined"?READINGS:{}, READINGS_PLAIN: typeof READINGS_PLAIN!=="undefined"?READINGS_PLAIN:{} };\n' + h.slice(i);
        route.fulfill({ response: r, body: h });
      });
      await page.goto(BASE() + `hubs/${hub}/index.html`); await page.waitForTimeout(800);
      if (!vp.isMobile) { const A = await page.evaluate(() => window.__CI); if (A) lint(hub, A); else problems.push(`${hub}: could not read its question data (is window.SH_EXPORT still set at the end of the script?)`); }
      const modes = await page.$$eval('#modeSwitch [data-mode]', bs => bs.map(b => b.getAttribute('data-mode')));
      let screens = 0;
      for (const m of modes) {
        await page.click(`#modeSwitch [data-mode="${m}"]`); await page.waitForTimeout(250); screens++;
        const subs = await page.$$eval(`[data-mode-panel="${m}"] .subtabs button, [data-mode-panel="${m}"] #compendium-subnav button`, bs => bs.map((b, i) => i));
        for (const i of subs) { await page.click(`:is([data-mode-panel="${m}"] .subtabs button, [data-mode-panel="${m}"] #compendium-subnav button) >> nth=${i}`).catch(() => {}); await page.waitForTimeout(200); screens++;
          const w = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (w > 1) problems.push(`${hub} (${label}): ${m} tab ${i + 1} scrolls sideways by ${w}px`); }
        if (m === 'arcade') {
          const games = await page.$$eval('#panel-arcade .ar-grid [data-game]', bs => [...new Set(bs.map(b => b.getAttribute('data-game')))]);
          for (const g of games) { await page.click(`#panel-arcade .ar-grid [data-game="${g}"]`).catch(() => {}); await page.waitForTimeout(250);
            const s = await page.$('#panel-arcade [data-start]'); if (s) await s.click().catch(() => {}); await page.waitForTimeout(400);
            const back = await page.$('#panel-arcade [data-back]'); if (back) await back.click().catch(() => {}); await page.waitForTimeout(150); screens++; }
        }
      }
      errs.forEach(e => problems.push(`${hub} (${label}): JavaScript error: ${e}`));
      notes.push(`${hub} (${label}): clicked through ${screens} screens`);
      await page.close();
    }
    await context.close();
  }
  await browser.close(); server.close();
  notes.forEach(n => console.log('  ' + n));
  if (problems.length) { console.error('\n✗ ' + problems.length + ' problem(s):\n' + problems.map(p => '  - ' + p).join('\n')); process.exit(1); }
  console.log('\n✓ smoke test and question lint passed');
})().catch(e => { console.error(e); process.exit(1); });
