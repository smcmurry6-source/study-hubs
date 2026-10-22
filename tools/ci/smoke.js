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
  // the first-visit "Want a quick tour?" prompt dims the page and would block the clicks below; answer it up front
  await context.addInitScript(() => { try { localStorage.setItem('sh_tour', 'no'); localStorage.setItem('sh_tour_hub', 'no'); } catch (e) {} });
}

/* matching items allowed to repeat an answer because that hub grades matches by answer text (perio, since 2026-09-29) */
const SAME_ANSWER_OK = new Set(['perio:q4-L27']);
/* every multiple-choice and select-all question explains each of its choices (q.why, one line per choice, same order;
   Sam's standing rule, 2026-10-20). Hubs archived before the rule are exempt: their exams are over. */
const WHY_EXEMPT = new Set(['msk-exam3', 'msk-exam4', 'pcd-exam3']);
/* every taught lecture's questions include two-statement and true/false items (Sam's standing rule, 2026-10-22; CLAUDE.md
   "Two-statement and true/false questions"). Archived hubs are exempt, and so are the perio sessions taught before the
   rule (its engine has no true/false yet): a lecture taught after it, in any live or new hub, needs both formats. */
const FORMAT_EXEMPT = new Set(['msk-exam3', 'msk-exam4', 'pcd-exam3']);
const FORMAT_GRANDFATHERED = new Set(['perio:diagnosis-tx-planning', 'perio:incisions-flaps-sutures', 'perio:risk-assessment', 'perio:phase1-therapy', 'perio:resective-furcation']);
const FORMAT_MIN = { '2stmt': 3, tf: 5 };
const TWO_CHOICES = ['Both statements are true', 'Both statements are false', 'Statement 1 is true; statement 2 is false', 'Statement 1 is false; statement 2 is true'];
function lint(hub, A){
  const Q = A.QUESTIONS || [], L = A.LECTURES || [], ids = new Set(), lecIds = new Set(L.map(l => l.id)), longItems = [];
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
    if ((q.type === 'mcq' || q.type === 'multi') && !WHY_EXEMPT.has(hub)) {
      const w = q.why || [];
      if (w.length !== (q.choices || []).length || w.some(x => !String(x || '').trim())) problems.push(`${hub}: ${q.id} needs a why for every choice (q.why: ${w.length} of ${(q.choices || []).length}; add its row to QUESTION_WHY)`);
    }
    if (q.type === 'match') {
      /* two items with the same answer: grading by index marks the other copy wrong (perio q4-L27, LESSONS.md) */
      ['left', 'right'].forEach((side, k) => {
        const vals = (q.pairs || []).map(p => String(p[k]).trim().toLowerCase());
        if (new Set(vals).size !== vals.length && !SAME_ANSWER_OK.has(`${hub}:${q.id}`)) problems.push(`${hub}: ${q.id} matching has the same ${side}-hand item twice (give each pair a distinct answer)`);
      });
    }
    if (q.fmt === '2stmt') {
      if ((q.choices || []).join('|') !== TWO_CHOICES.join('|')) problems.push(`${hub}: ${q.id} two-statement choices must be exactly: ${TWO_CHOICES.join(' / ')}`);
      if (!/\n1\. [^]*\n2\. /.test(q.stem || '')) problems.push(`${hub}: ${q.id} two-statement stem needs its statements on lines starting "1. " and "2. "`);
    }
    if (q.fmt === 'tf' && (q.choices || []).join('|') !== 'True|False') problems.push(`${hub}: ${q.id} true/false choices must be exactly True / False`);
    if (q.type === 'sequence' && (q.steps || []).length > 5) longItems.push(`${q.id} (${q.steps.length} steps)`);
    if (q.type === 'multi' && (q.choices || []).length > 6) longItems.push(`${q.id} (${q.choices.length} options)`);
  });
  if (longItems.length) notes.push(`${hub}: heads-up, long ordering/select-all items score very low (LESSONS.md): ${longItems.join(', ')}`);
  if (!FORMAT_EXEMPT.has(hub)) {
    L.forEach(l => {
      const lq = Q.filter(q => q.lec === l.id);
      if (!lq.length || (l.status && l.status !== 'taught') || FORMAT_GRANDFATHERED.has(`${hub}:${l.id}`)) return;
      Object.keys(FORMAT_MIN).forEach(f => { const n = lq.filter(q => q.fmt === f).length;
        if (n < FORMAT_MIN[f]) problems.push(`${hub}: lecture ${l.id} has ${n} ${f === 'tf' ? 'true/false' : 'two-statement'} questions (needs at least ${FORMAT_MIN[f]}; CLAUDE.md "Two-statement and true/false questions")`); });
    });
    const tfq = Q.filter(q => q.fmt === 'tf');
    if (tfq.length >= 10) { const t = Math.round(100 * tfq.filter(q => q.answer === 0).length / tfq.length);
      if (t < 35 || t > 65) problems.push(`${hub}: ${t}% of true/false answers are True (keep it between 35% and 65%)`); }
  }
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
      // a hub whose last exam has passed opens "This hub is archived" over the page; close it like a student would
      await page.click(".sh-archived-stay", { timeout: 1000 }).catch(() => {});
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
