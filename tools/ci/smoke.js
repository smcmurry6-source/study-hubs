// Browser smoke test + question-bank lint for every hub and the dashboard.
// Class data (Supabase) is stubbed with empty results; nothing is written anywhere (tools/ci/no-leaks.js answers what a
// closing page sends, which routing misses, and its proxy refuses whatever still gets past: BUG-197).
//   npm i --no-save playwright && npx playwright install chromium && node tools/ci/smoke.js
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const noLeaks = require('./no-leaks.js');
const root = path.resolve(__dirname, '../..');
const TYPES = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css', '.mp3':'audio/mpeg', '.svg':'image/svg+xml', '.png':'image/png', '.webp':'image/webp', '.mp4':'video/mp4', '.webm':'video/webm', '.json':'application/json' };
const server = http.createServer((req, res) => {
  let u = decodeURIComponent(req.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html';
  const f = path.join(root, u); if (!f.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.stat(f, (e, st) => { if (e || !st.isFile()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Content-Length': st.size }); fs.createReadStream(f).pipe(res); });
}).listen(0, '127.0.0.1');
const BASE = () => `http://127.0.0.1:${server.address().port}/`;
const allHubs = fs.readdirSync(path.join(root, 'hubs')).filter(h => fs.existsSync(path.join(root, 'hubs', h, 'index.html')));
/* Which hubs to click through and lint (2026-11-06): only the hubs a change touches, because one hub's files never
   reach another hub's page (no hub loads another's files). Every hub when a shared file changes (widget/, the dashboard,
   sw.js, assets, a workflow, this test), on main, with --all or SMOKE_ALL=1, or when git can't tell what changed. Files
   that never reach a page (notes, tools, SQL, the vault, about/ and review/, which this test doesn't open) don't count.
   The dashboard is always checked. SMOKE_CHANGED_FROM=<git ref> sets the base (CI: the PR's base, HEAD^1 of the merge
   commit); locally it's where this branch left origin/main, and uncommitted and new files count too. */
const NEVER_ON_A_PAGE = /^(vault\/|tools\/|supabase\/|\.claude\/|\.obsidian\/|about\/|review\/|migration_v[^/]*\.sql$|\.gitignore$)|(^|\/)[^/]+\.md$/;
function pickHubs(){
  if (process.argv.includes('--all') || process.env.SMOKE_ALL) return { hubs: allHubs, why: 'every hub (--all)' };
  let base = process.env.SMOKE_CHANGED_FROM;
  if (!base && process.env.CI) return { hubs: allHubs, why: 'every hub (a CI run that is not a pull request)' };
  const git = (...a) => require('child_process').execFileSync('git', a, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  let changed;
  try {
    if (!base) base = git('merge-base', 'HEAD', 'origin/main').trim();
    changed = (git('diff', '--name-only', '--no-renames', base) + '\n' + git('ls-files', '--others', '--exclude-standard')).split('\n').filter(Boolean);
  } catch (e) { return { hubs: allHubs, why: `every hub (git couldn't tell what changed${base ? ' since ' + base : ''})` }; }
  const touched = new Set();
  for (const f of changed) {
    const m = /^hubs\/([^/]+)\//.exec(f) || /^tools\/question-ids\/([^/]+)\.txt$/.exec(f);
    if (m) { touched.add(m[1]); continue; }
    if (f === 'tools/ci/smoke.js' || !NEVER_ON_A_PAGE.test(f)) return { hubs: allHubs, why: `every hub (${f} is shared)` };
  }
  const hubs = allHubs.filter(h => touched.has(h));
  return { hubs, why: (hubs.length ? `the hub(s) this change touches: ${hubs.join(', ')}` : 'no hub changed, so the dashboard only') + ' (--all checks every hub)' };
}
const { hubs, why: hubsWhy } = pickHubs();
/* SMOKE_PART=desktop or SMOKE_PART=phone runs one half (2026-11-13: CI runs the two at once, as two jobs, to save time).
   The desktop half has the question-bank lint and the id registry; the phone half has the top bars and tab rows. Without
   it (the default, and any local run) both halves run, one after the other. */
const PART = process.env.SMOKE_PART || '';
if (PART && !['desktop', 'phone'].includes(PART)) { console.error(`SMOKE_PART must be desktop or phone, not "${PART}"`); process.exit(1); }
console.log(`Smoke test: ${hubsWhy}${PART ? `, the ${PART} half` : ''}`);
/* Every hub is on the engine (widget/hub.js: its page is settings, its content is in hubs/<id>/content/). The old
   single-file hub pages came down 2026-11-19, and their walk and checks with them. */
const engineHubs = hubs;
const content = (h, f) => path.join(root, 'hubs', h, 'content', f);
/* The dashboard and the engine's hubs load bundles (tools/bundle/build.mjs, tools/bundle/bundles.json): the engine as
   one deferred script with the page, the shared widgets and a hub's own widget layer once it is drawn, and one
   stylesheet. A page that asks for a file one of its bundles carries has lost the bundle. */
const BUNDLES = JSON.parse(fs.readFileSync(path.join(root, 'tools/bundle/bundles.json'), 'utf8'));
const inBundle = out => { const b = BUNDLES.scripts[out] || {}; return [...(b.css || []), ...(b.run || []), ...(b.hold || [])]; };
const SHEET = Object.keys(BUNDLES.styles)[0];
/* what a page gets from its bundles, and so must not fetch by itself */
const BUNDLED = { hub: [...new Set([...inBundle('hub.bundle.js'), ...inBundle('rest.bundle.js'), ...inBundle('hub-rest.bundle.js'), ...BUNDLES.styles[SHEET]])],
  dash: [...new Set([...inBundle('dash.bundle.js'), ...inBundle('rest.bundle.js'), ...BUNDLES.styles[SHEET]])] };
const widgetFile = u => { const m = /\/widget\/([^?#]+)/.exec(u); return m && !/[?&]bundle-check\b/.test(u) ? m[1] : ''; };   /* not this test's own reads of a source */
/* One typeface, self-hosted (assets/fonts/): a redesigned page asks Google Fonts for nothing. */
const GOOGLE_FONTS = /^https?:\/\/fonts\.(googleapis|gstatic)\.com\//;
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
/* the 8-bit code (widget/eggs.js): what it adds to the page for its pixel face, then the code again to leave */
async function eightBit(page){
  await page.evaluate(() => { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); });
  for (const k of KONAMI) await page.keyboard.press(k);
  await page.waitForTimeout(400);
  const r = await page.evaluate(async () => {
    const el = document.getElementById('sh-egg-8bit-font'), on = document.documentElement.classList.contains('sh-8bit');
    let face = false; try { face = !el && (await document.fonts.load('16px VT323')).length > 0; } catch (e) {}   /* with no link added: the page's own copy */
    return { on, tag: el ? el.tagName : '', href: el && el.href || '', face };
  });
  for (const k of KONAMI) await page.keyboard.press(k);
  await page.waitForTimeout(200);
  return r;
}
/* at the end of a page's walk: nothing its bundles carry was fetched by itself, on load or on any screen */
function ownFiles(name, label, kind, asked){
  const own = [...new Set(asked.filter(f => BUNDLED[kind].includes(f)))];
  if (own.length) problems.push(`${name} (${label}): the page fetched ${own.join(', ')} by ${own.length === 1 ? 'itself' : 'themselves'}; its bundles carry ${own.length === 1 ? 'it' : 'them'} (tools/bundle/bundles.json)`);
}
/* every style rule of a stylesheet, as the browser reads it back: the bundle's sheet must be its sources' rules, in order */
const RULES = `(css => { const sh = new CSSStyleSheet(); sh.replaceSync(css); return [...sh.cssRules].map(r => r.cssText); })`;
async function bundleCheck(page, name, label, kind, asked){
  const want = kind === 'hub' ? ['hub.bundle.js', 'rest.bundle.js', 'hub-rest.bundle.js', SHEET] : ['dash.bundle.js', 'rest.bundle.js', SHEET];
  const missing = want.filter(f => !asked.includes(f));
  if (missing.length) problems.push(`${name} (${label}): the page never asked for ${missing.join(', ')}`);
  const core = kind === 'hub' ? 'hub.bundle.js' : 'dash.bundle.js';
  const tag = await page.$eval(`script[src$="widget/${core}"]`, x => ({ defer: x.defer, head: !!x.closest('head') })).catch(() => null);
  if (!tag || !tag.defer || !tag.head) problems.push(`${name} (${label}): widget/${core} should be a deferred script in the page's head`);
  const r = await page.evaluate(async ([sheet, parts, rules, v3]) => {
    const rulesOf = eval(rules), get = async f => (await fetch(new URL('widget/' + f + '?bundle-check', document.querySelector(`link[href*="${sheet}"]`).href.replace(/widget\/.*$/, ''))).then(x => x.text()));
    const out = { links: document.querySelectorAll('link[rel="stylesheet"]').length };
    const built = rulesOf(await get(sheet)), src = [];
    for (const p of parts) src.push(...rulesOf(await get(p)));
    out.sheet = built.length === src.length && built.every((t, i) => t === src[i]) ? '' : `${built.length} rules, its sources ${src.length}${built.length === src.length ? ', one differs: ' + built.find((t, i) => t !== src[i]).slice(0, 80) : ''}`;
    if (v3) {
      const st = document.getElementById('sh-css-v3'), link = document.querySelector(`link[href*="${sheet}"]`);
      const a = st ? rulesOf(st.textContent) : [], b = rulesOf(await get('v3.css'));
      out.v3 = !st ? 'no <style id="sh-css-v3"> on the page' : !(st.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING) ? 'it should come before the stylesheet, so the stylesheet wins'
        : a.length === b.length && a.every((t, i) => t === b[i]) ? '' : `${a.length} rules, widget/v3.css ${b.length}`;
    }
    return out;
  }, [SHEET, BUNDLES.styles[SHEET], RULES, kind === 'hub']);
  if (r.sheet) problems.push(`${name} (${label}): widget/${SHEET} is not its sources' rules in order (${r.sheet}): run node tools/bundle/build.mjs`);
  if (r.v3) problems.push(`${name} (${label}): widget/v3.css inside hub-rest.bundle.js: ${r.v3}`);
  return r;
}
const problems = [], notes = [];

/* the idea board (widget/ideas.js; its server is migration_v54, not applied until the redesign's release): a made-up
   board, so the new dashboard and a new hub's More have something to draw. One title is markup, which must show as text. */
const IDEAS = { total: 4, hubs: { '': 3, perio: 1 }, categories: { feature: 2, fun: 1, content: 1 }, ideas: [
  { id: 1, title: 'Smoke idea one', body: 'A made-up idea.', name: 'Test Molar', hub: null, category: 'feature', source: 'board', status: 'planned', note: 'A made-up reason.', up: 5, down: 1, at: new Date(Date.now() - 864e5).toISOString(), own: false, mine: 0, reported: false },
  { id: 2, title: '<img src=x onerror="window.__idea=1">', body: '<b>bold</b>', name: '<i>Name</i>', hub: 'perio', category: 'content', source: 'checkin', status: 'open', note: null, up: 2, down: 0, at: new Date(Date.now() - 2 * 864e5).toISOString(), own: false, mine: 0, reported: false },
  { id: 3, title: 'Smoke idea three', body: '', name: 'Timmy Tooth', hub: null, category: 'fun', source: 'starter', status: 'open', note: null, up: 1, down: 0, at: new Date(Date.now() - 3 * 864e5).toISOString(), own: false, mine: 0, reported: false },
  { id: 4, title: 'Smoke idea four, mine', body: '', name: 'Test Molar', hub: null, category: 'feature', source: 'board', status: 'open', note: null, up: 0, down: 0, at: new Date(Date.now() - 4 * 864e5).toISOString(), own: true, mine: 0, reported: false }] };
/* Ask Timmy's chat (widget/ask.js; its server, the `timmy` Edge Function, is deployed at the redesign's release): with
   Timmy not adopted (as in these runs) the Ask button opens it, with the line that chats are saved; a question goes out
   with what the function reads; the answer's words are drawn as text, never markup; Report on an answer sends; a drafted
   report can be edited and turned down; every button names itself with a fixed data-ska value (click counts must never
   pick up anyone's words); on a hub, an answer's "From the notes" link opens the notes at the lecture. Returns what was sent. */
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type, apikey, authorization, x-client-info', 'access-control-allow-methods': 'POST, OPTIONS' };
async function askCheck(page, name, o){
  const sent = [];
  await page.route(/supabase\.co\/functions\/v1\/timmy/, route => {
    const r = route.request();
    if (r.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    let body = {}; try { body = JSON.parse(r.postData() || '{}'); } catch (e) {}
    sent.push(body);
    const n = sent.length, cites = o.lec ? [{ id: 'N1.0', hub: o.hub, kind: 'notes', label: 'L1 notes', quote: 'a quote', go: { v: 'notes', lec: o.lec, k: 0 } }] : [];
    return route.fulfill({ status: 200, headers: Object.assign({ 'content-type': 'application/json' }, CORS), body: JSON.stringify({ ok: true, chat: '00000000-0000-4000-a000-00000000000' + (n % 10), message: 900 + n, kind: 'answer',
      paragraphs: [{ text: 'Smoke answer <img src=x onerror="window.__ask=1"> in plain words.', cites }], offer: n === 2 ? { kind: 'report', text: 'A drafted report', qid: null } : null, go: null, closest: null }) });
  });
  await page.route(/supabase\.co\/rest\/v1\/rpc\/timmy_report/, route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"id":1}' }));
  await o.open();
  await page.waitForSelector('.ska.is-on .ska-panel', { timeout: 5000 }).catch(() => {});
  /* the panel slides in: wait until it has stopped, so a tap lands on what was aimed at */
  await page.waitForFunction(() => { const p = document.querySelector('.ska.is-on .ska-panel'), t = p && getComputedStyle(p).transform; return !!p && (t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)'); }, null, { timeout: 3000 }).catch(() => {});
  const p0 = await page.evaluate(() => { const r = document.querySelector('.ska'); if (!r || r.hidden) return null;
    return { title: document.getElementById('skaT').textContent, note: document.querySelector('.ska-note').textContent, starters: document.querySelectorAll('.ska-starters [data-ska^="starter-"]').length }; });
  if (!p0) { problems.push(`${name}: the Ask button didn't open Ask Timmy's chat`); return sent; }
  if (p0.title !== 'Ask the hub' || !/saved to help improve the hub/.test(p0.note) || p0.starters < 3) problems.push(`${name}: the chat should say who answers, that chats are saved to help improve the hub, and offer starters (${JSON.stringify(p0)})`);
  await page.fill('#skaIn', 'What is a smoke test?'); await page.click('.ska-send');
  await page.waitForSelector('.ska-m.is-tim:not(.is-wait)', { timeout: 8000 }).catch(() => {});
  const b = sent[0];
  if (!b || b.hub !== o.hubId || b.voice !== 'plain' || !/^[A-Za-z0-9_-]{8,64}$/.test(b.request || '') || !b.visitor || b.text !== 'What is a smoke test?' || !b.context || !b.context.view) problems.push(`${name}: the chat's question went out as ${JSON.stringify(b)}`);
  else if (o.hubId === 'dashboard' && !(Array.isArray(b.hubs) && b.hubs.length)) problems.push(`${name}: the dashboard's chat sent no live hubs`);
  const a1 = await page.evaluate(() => ({ text: (document.querySelector('.ska-m.is-tim .ska-b p') || {}).textContent || '', markup: document.querySelectorAll('.ska-log img').length + (window.__ask ? 1 : 0), w: document.documentElement.scrollWidth - innerWidth }));
  if (!/<img/.test(a1.text) || a1.markup) problems.push(`${name}: Timmy's answer was drawn as markup, or not at all (${JSON.stringify(a1)})`);
  if (a1.w > 1) problems.push(`${name}: the open chat scrolls the page sideways by ${a1.w}px`);
  await page.click('.ska-m.is-tim [data-ska="report"]'); await page.fill('.ska-rep textarea', 'Smoke report'); await page.click('[data-ska="report-send"]');
  if (!(await page.waitForFunction(() => /Thanks/.test((document.querySelector('.ska-rep') || {}).textContent || ''), null, { timeout: 4000 }).catch(() => null))) problems.push(`${name}: Report on Timmy's answer didn't send`);
  await page.fill('#skaIn', 'Something is broken'); await page.click('.ska-send');
  await page.waitForSelector('.ska-offer[data-offer="report"] textarea', { timeout: 8000 }).catch(() => {});
  const draft = await page.$eval('.ska-offer[data-offer="report"] textarea', t => t.value).catch(() => null);
  if (draft !== 'A drafted report') problems.push(`${name}: Timmy's drafted report isn't in an editable box (${draft})`);
  else { await page.click('.ska-offer [data-ska="offer-no"]'); if (!(await page.$('.ska-offer.is-done'))) problems.push(`${name}: No thanks didn't close Timmy's drafted report`); }
  const unnamed = await page.evaluate(() => [...document.querySelectorAll('.ska button, .ska a[href], .ska label, .ska summary, .ska-fab, .ska-spot button')].filter(e => !e.getAttribute('data-ska')).map(e => e.className || e.tagName));
  if (unnamed.length) problems.push(`${name}: ${unnamed.length} button(s) in the chat have no fixed data-ska name, so click counts would record their text (${unnamed.join(', ')})`);
  if (o.lec) {
    await page.click('.ska-m.is-tim .ska-cite'); await page.waitForTimeout(700);
    const h = await page.evaluate(() => location.hash);
    if (h !== '#notes/' + o.lec) problems.push(`${name}: the answer's "From the notes" link opened ${h}, not #notes/${o.lec}`);
  }
  /* the dashboard's "What should I study tonight?" reads the student's own answers from the server (get_my_answers), so a
     new or linked device sees what was answered elsewhere: every question answered right there must reach the progress sent */
  if (o.hubId === 'dashboard' && b && Array.isArray(b.hubs)) {
    const hub = b.hubs.find(h => fs.existsSync(content(h, 'core.json')));
    const idx = hub ? (JSON.parse(fs.readFileSync(content(hub, 'core.json'), 'utf8')).index || []) : [];
    if (idx.length) {
      const asked = [], rows = idx.map((r, i) => [r[0], 1763500000 + i, 1]);
      await page.route(/supabase\.co\/rest\/v1\/rpc\/get_my_answers/, route => { let a = {}; try { a = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
        asked.push(a.p_hub); return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(a.p_hub === hub ? rows : []) }); });
      const n0 = sent.length;
      await page.fill('#skaIn', 'What should I study tonight?'); await page.click('.ska-send');
      await page.waitForFunction(n => document.querySelectorAll('.ska-m.is-tim:not(.is-wait)').length >= n, n0 + 1, { timeout: 8000 }).catch(() => {});
      const t = sent[n0], row = t && t.progress && (t.progress.lectures || []).find(x => x.hub === hub && x.answered > 0);
      if (!asked.includes(hub)) problems.push(`${name}: "What should I study tonight?" didn't read the student's answers from the server (get_my_answers for ${hub})`);
      else if (!row || row.answered < 1 || row.right < 1) problems.push(`${name}: the answers from the server didn't reach "What should I study tonight?"'s progress (${JSON.stringify(row || (t && t.progress) || null)})`);
      await page.unroute(/supabase\.co\/rest\/v1\/rpc\/get_my_answers/);
    }
  }
  if (await page.$('.ska.is-on')) { await page.click('[data-ska="close"]'); await page.waitForTimeout(300); }
  return sent;
}
/* The game layer's wiring (phase 4, session 8; vault/tasks/done/2026-11-12-redesign-game-layer-wiring.md), desktop only.
   navigator.webdriver is hidden so the widget records (every call is answered here; nothing is written anywhere).
   A hub on the game layer: Million-Dollar Smile played to the end twice (one right answer and Walk away, then
      Play again and one wrong answer) makes, each play, one xp_session_start ("arcade", "smile") and one xp_session_finish
      with that session and the score, and no submit_arcade_score; each answer is one record_answer_v2 with the pick's
      authored index (not its place on screen) and its play's session, and none of today's answer calls; the stubbed +50s
      reach the rank pill, and the toast names the game. Then Timmy Time plays with 44.9 seconds of minute 0 already heard
      on this device: one pod_minute_v2 (minute 0), its stubbed 10 XP on the pill, the minute kept as taken.
   (Until the redesign's release this also played an old hub with this branch's widget/games.js and podcast.js and with
   main's, to prove the live pages' calls hadn't changed; those pages were replaced at the release.) */
async function wiringCheck(context, hub, label){
  const QS0 = JSON.parse(fs.readFileSync(content(hub, 'questions.json'), 'utf8'));
  /* a hub with A/B versions (content/variants.json): a question may be shown in either, the first one picked by device;
     choice k of a version is choice k of the original, so a version is matched like the original and answered by index */
  const VF = content(hub, 'variants.json'), VS = fs.existsSync(VF) ? JSON.parse(fs.readFileSync(VF, 'utf8')) : {};
  const QS = QS0.concat(...QS0.map(q => [].concat(VS[q.id] || []).filter(v => v && v.stem && Array.isArray(v.choices))
    .map(v => Object.assign({}, q, { stem: v.stem, choices: v.choices }))));
  const CORE0 = JSON.parse(fs.readFileSync(content(hub, 'core.json'), 'utf8'));
  const EP = CORE0.audio === 'off' ? null : (CORE0.podcast || {}).id || null;   /* an archived hub's episode came off the site */
  const json = (route, body) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  const unbot = () => { try { Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false, configurable: true }); } catch (e) {} };
  const args = r => { try { return JSON.parse(r.postData() || '{}'); } catch (e) { return {}; } };
  const fnOf = u => (/\/rpc\/([a-z0-9_]+)/.exec(u) || [])[1] || '';
  /* the question on screen, answered right (its authored answer's text) or wrong (another choice): what was picked */
  async function answer(page, right){
    await page.waitForFunction(() => document.querySelectorAll('.ms-opt').length && !document.querySelector('.ms-opt.right, .ms-opt.locked'), null, { timeout: 12000 });
    const shown = await page.evaluate(() => { const q = document.querySelector('.ms-q'), f = q.querySelector('.ms-for');
      return { stem: q.textContent.slice(f ? f.textContent.length : 0), opts: [...document.querySelectorAll('.ms-opt span')].map(s => s.textContent) }; });
    const q = QS.find(x => x.stem === shown.stem && shown.opts.every(t => (x.choices || []).includes(t)));
    if (!q) return null;
    const at = shown.opts.findIndex(t => (t === q.choices[q.answer]) === !!right);
    await page.click(`.ms-opt[data-ms="${at}"]`);
    return { qid: q.id, choice: q.choices.indexOf(shown.opts[at]), at, right: !!right };
  }
  /* one right answer and Walk away ($100), then Play again and one wrong answer ($0) */
  async function play(page, startSel){
    const picks = [];
    await page.click(startSel);
    await page.waitForSelector('#panel-arcade [data-start]', { timeout: 10000 });
    await page.click('#panel-arcade [data-start]');
    picks.push(await answer(page, true));
    await page.waitForSelector('#panel-arcade [data-walk]:not([disabled])', { timeout: 12000 });
    await page.waitForFunction(() => !document.querySelector('.ms-opt.locked'), null, { timeout: 12000 });
    await page.click('#panel-arcade [data-walk]');
    await page.waitForSelector('#panel-arcade [data-overlay] [data-start]', { timeout: 12000 });
    await page.waitForTimeout(600);
    await page.click('#panel-arcade [data-overlay] [data-start]');
    picks.push(await answer(page, false));
    await page.waitForSelector('#panel-arcade [data-overlay] [data-start]', { timeout: 15000 });
    await page.waitForTimeout(1200);
    return picks;
  }
  const watch = (page, calls) => page.on('request', r => { const u = r.url(); if (r.method() === 'POST' && /supabase\.co\/rest\/v1\/rpc\//.test(u)) calls.push({ fn: fnOf(u), a: args(r) }); });

  {
    const page = await context.newPage(), errs = [], calls = [], name = `${hub}, the game layer's wiring`;
    page.on('pageerror', e => errs.push(e.message));
    await page.addInitScript(unbot);
    let total = 2400, sids = 0;
    const rank = () => ({ xp: total, journey: 0, tier: 1, level: 2, step: 4, gtier: 1, step_at: 2000, next_at: 3000, tier_at: 1500, steps: 63, answers: 300, correct: 220, days: 12, badges: [], dark_seen: [], boost: null });
    watch(page, calls);
    await page.route(/supabase\.co\/rest\/v1\/rpc\/(get_widget_bootstrap_v2|get_rank_profile_v2|record_answer_v2|xp_session_start|xp_session_finish|pod_minute_v2)(\?|$)/, route => {
      const fn = fnOf(route.request().url());
      if (fn === 'get_widget_bootstrap_v2') return json(route, { rank: rank(), mastery: [] });
      if (fn === 'get_rank_profile_v2') return json(route, rank());
      if (fn === 'record_answer_v2') { total += 1; return json(route, { ok: true, xp: 1, base: 1, mult: 1, why: null, bonus: [], boost: null, total }); }
      if (fn === 'xp_session_start') return json(route, '00000000-0000-4000-8000-00000000a8c' + (++sids));
      if (fn === 'xp_session_finish') { total += 50; return json(route, { ok: true, xp: 50, mult: 1 }); }
      total += 10; return json(route, { ok: true, xp: 10, done: 0, mult: 1, heard: 1, of: 52 });
    });
    await page.goto(BASE() + `hubs/${hub}/index.html#more/arcade`);
    const on = await page.waitForFunction(() => window.shGame && window.shGame.v2(), null, { timeout: 15000 }).catch(() => null);
    await page.waitForSelector('.ar-grid [data-game="smile"]', { timeout: 20000 }).catch(() => {});
    if (!on || !(await page.$('.ar-grid [data-game="smile"]'))) problems.push(`${name} (${label}): the page didn't come up on the game layer with Million-Dollar Smile in the arcade`);
    else {
      const from = calls.length, toasts = [];
      await page.exposeFunction('__toast', t => toasts.push(t));
      /* a reward shows on the reward card (widget/hub-rewards.js drawPrize, in .hx-prizes beside the toasts), whose
         screen-reader line says what it paid; anything else is a toast */
      await page.evaluate(() => { const host = document.getElementById('hxToast'); if (host) new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (!n.classList) return; if (n.classList.contains('hx-toast')) window.__toast(n.textContent); else if (n.classList.contains('hx-prize')) window.__toast((n.querySelector('.sr') || n).textContent); }))).observe(host.parentNode, { childList: true, subtree: true }); });
      const picks = await play(page, '.ar-grid [data-game="smile"]');
      for (let i = 0; i < 20 && calls.filter(c => c.fn === 'xp_session_finish').length < 2; i++) await page.waitForTimeout(250);
      await page.waitForTimeout(500);
      const got = calls.slice(from), by = fn => got.filter(c => c.fn === fn);
      const starts = by('xp_session_start'), fins = by('xp_session_finish'), ans = by('record_answer_v2');
      if (picks.some(p => !p)) problems.push(`${name} (${label}): couldn't read Smile's question from the page`);
      if (starts.length !== 2 || starts.some(c => c.a.p_kind !== 'arcade' || c.a.p_game !== 'smile' || c.a.p_hub !== hub)) problems.push(`${name} (${label}): two plays should start two arcade sessions for "smile" (${JSON.stringify(starts.map(c => c.a))})`);
      const fin = fins.map(c => [c.a.p_session, c.a.p_score]);
      if (JSON.stringify(fin) !== JSON.stringify([['00000000-0000-4000-8000-00000000a8c1', 100], ['00000000-0000-4000-8000-00000000a8c2', 0]])) problems.push(`${name} (${label}): each play should finish its own session with its score ($100, then $0): ${JSON.stringify(fin)}`);
      if (by('submit_arcade_score').length) problems.push(`${name} (${label}): on the game layer the server posts the score, but the page called submit_arcade_score`);
      const old = got.filter(c => /^record_(answer|choice|choices|personal_answer|correct_streak)$/.test(c.fn)).map(c => c.fn);
      if (old.length) problems.push(`${name} (${label}): an arcade answer also went out the old way (${old.join(', ')})`);
      const want = picks.filter(Boolean).map((p, i) => [p.qid, p.choice, 'arcade', '00000000-0000-4000-8000-00000000a8c' + (i + 1)]);
      const sent = ans.map(c => [c.a.p_qid, c.a.p_choice, c.a.p_ctx, c.a.p_session]);
      if (JSON.stringify(sent) !== JSON.stringify(want)) problems.push(`${name} (${label}): each arcade answer should be one record_answer_v2 with the authored index and its play's session: sent ${JSON.stringify(sent)}, picked ${JSON.stringify(want)}`);
      const pill = await page.evaluate(() => Number(((document.querySelector('#hxRank [data-xp]') || {}).textContent || '').replace(/\D/g, '')));
      if (pill !== total) problems.push(`${name} (${label}): the rank pill reads ${pill} XP after the games, not the ${total} the server paid`);
      const gname = await page.evaluate(() => ((((window.SH_HUB || {}).arcade || {}).games || []).find(g => g.id === 'smile') || {}).name || '');
      if (!toasts.some(t => t.startsWith(`${gname} finished: +50 XP and 25 Shiny Gold Crowns`))) problems.push(`${name} (${label}): the +50's reward card should name the game as the lobby does, with its 25 crowns ("${gname} finished: +50 XP and 25 Shiny Gold Crowns."): ${JSON.stringify(toasts)}`);
      /* one of the hub's own games (Cusp Sort, Pocket Crusher): its session starts where its overlay comes off (the call
         to shGames.played in its arcade.js) */
      const AJ = fs.readFileSync(content(hub, 'arcade.js'), 'utf8');
      const ownId = [...((/var GAMES = \[([\s\S]*?)\n\s*\];/.exec(AJ) || [])[1] || '').matchAll(/\bid:\s*'([a-z]+)'/g)].map(m => m[1]).find(id => !['board', 'cloze', 'escape', 'cross', 'smile'].includes(id));
      if (ownId) {
        const f3 = calls.length;
        await page.click('#panel-arcade [data-back]'); await page.waitForSelector(`.ar-grid [data-game="${ownId}"]`, { timeout: 8000 });
        await page.click(`.ar-grid [data-game="${ownId}"]`); await page.waitForSelector('#panel-arcade [data-start]', { timeout: 8000 });
        await page.click('#panel-arcade [data-start]');
        for (let i = 0; i < 20 && !calls.slice(f3).some(c => c.fn === 'xp_session_start'); i++) await page.waitForTimeout(250);
        const st = calls.slice(f3).filter(c => c.fn === 'xp_session_start').map(c => c.a.p_game);
        if (JSON.stringify(st) !== JSON.stringify([ownId])) problems.push(`${name} (${label}): starting ${ownId}, one of the hub's own games, should start one session for it (${JSON.stringify(st)})`);
        await page.click('#panel-arcade [data-back]').catch(() => {}); await page.waitForTimeout(300);
      }
      /* Timmy Time */
      if (EP) {
        const key = `sh_pod_min:${hub}:${EP}`, f2 = calls.length;
        await page.evaluate(k => localStorage.setItem(k, JSON.stringify({ h: { 0: 44.9 }, p: [] })), key);
        await page.evaluate(() => { location.hash = 'more/timmy'; });
        await page.waitForSelector('.sh-pod-play', { timeout: 15000 }).catch(() => {});
        const before = total;
        await page.click('.sh-pod-play').catch(() => {});
        for (let i = 0; i < 40 && !calls.slice(f2).some(c => c.fn === 'pod_minute_v2'); i++) await page.waitForTimeout(250);
        await page.waitForTimeout(1500);
        await page.evaluate(() => { const a = document.querySelector('audio.sh-pod-audio'); if (a) a.pause(); });
        const pm = calls.slice(f2).filter(c => c.fn === 'pod_minute_v2');
        const kept = await page.evaluate(k => localStorage.getItem(k), key);
        const pill2 = await page.evaluate(() => Number(((document.querySelector('#hxRank [data-xp]') || {}).textContent || '').replace(/\D/g, '')));
        await page.evaluate(k => localStorage.removeItem(k), key);   /* the pages below share this origin's storage */
        if (pm.length !== 1 || pm[0].a.p_minute !== 0 || pm[0].a.p_ep !== EP || pm[0].a.p_hub !== hub || !pm[0].a.p_visitor) problems.push(`${name} (${label}): a minute heard should report once, as minute 0 of ${EP} (${JSON.stringify(pm.map(c => c.a))})`);
        else {
          if (pill2 !== before + 10) problems.push(`${name} (${label}): the rank pill reads ${pill2} after a Timmy Time minute, not the ${before + 10} the server paid`);
          if (!/"p":\[0\]/.test(kept || '')) problems.push(`${name} (${label}): the minute the server took isn't kept on the device (${kept})`);
        }
      }
      notes.push(`${name} (${label}): two plays of Smile, each a session (start, answers with the authored index, finish with the score), no submit_arcade_score; +50 on the pill${ownId ? `; ${ownId} starts its own session` : ''}${EP ? '; a Timmy Time minute reported once' : ''}`);
    }
    errs.forEach(e => problems.push(`${name} (${label}): JavaScript error: ${e}`));
    await page.close();
  }
}
/* Visiting from a hub's arcade board (the inbox's "A smoke check for visiting from a hub's arcade board", 2026-11-20): a game's
   game-over card shows the class's top five (get_arcade_leaderboard_v2, stubbed), and a classmate's name there is a button
   (lbName() in the hub's content/arcade.js, window.shVisitPlace in widget/hub-timmy.js). A tap opens that place as a visit
   (get_place, stubbed: "<name>'s place" in the title as text), Escape closes it and gives focus back to the name, a key
   that opens nothing says so on its row, your own row isn't a button and a name with markup is drawn as text. Runs on a
   hub whose arcade has Smile and visit buttons; none since Heme & Endo Exam 3's page came down (2026-11-20), so it is
   skipped until the next hub with an arcade ships, like wiringCheck. */
async function visitCheck(context, hub, label){
  const name = `${hub}, visiting from the arcade board`, K = c => c.repeat(24), BAD = '<img src=x onerror="window.__visit=1">Bee';
  const json = (route, body) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  const rank = { xp: 2400, journey: 0, tier: 1, level: 2, step: 4, gtier: 1, step_at: 2000, next_at: 3000, tier_at: 1500, steps: 63, answers: 300, correct: 220, days: 12, badges: [], dark_seen: [], boost: null };
  const shop = { day: '2026-11-20', seasons: [], throwback: false, wallet: { balance: 0 }, items: [], inventory: [], locked: [], equipped: {}, costumes: [], snacks_today: [], boost: null };
  const rows = [{ rnk: 1, display_name: 'Visit Alpha', best: 500, is_me: false, flair: null, visit: K('a') }, { rnk: 2, display_name: BAD, best: 300, is_me: false, flair: null, visit: K('b') },
    { rnk: 3, display_name: 'Test Molar', best: 100, is_me: true, flair: null, visit: K('e') }];
  const places = { [K('a')]: { name: 'Visit Alpha', equipped: { home: 'castle', scene: 'beach' }, rank: { journey: 0, tier: 2, level: 1 }, flair: null } };
  const page = await context.newPage(), errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.addInitScript(() => { try { Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false, configurable: true }); } catch (e) {} });
  let sids = 0;
  await page.route(/supabase\.co\/rest\/v1\/rpc\/(get_widget_bootstrap_v2|get_rank_profile_v2|record_answer_v2|xp_session_start|xp_session_finish|get_arcade_leaderboard_v2|get_place)(\?|$)/, route => {
    const fn = (/\/rpc\/([a-z0-9_]+)/.exec(route.request().url()) || [])[1];
    if (fn === 'get_widget_bootstrap_v2') return json(route, { rank, mastery: [], shop });
    if (fn === 'get_rank_profile_v2') return json(route, rank);
    if (fn === 'record_answer_v2') return json(route, { ok: true, xp: 1, base: 1, mult: 1, why: null, bonus: [], boost: null, total: rank.xp });
    if (fn === 'xp_session_start') return json(route, '00000000-0000-4000-8000-00000000b00' + (++sids));
    if (fn === 'xp_session_finish') return json(route, { ok: true, xp: 0, mult: 1 });
    if (fn === 'get_arcade_leaderboard_v2') return json(route, rows);
    let a = {}; try { a = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
    return json(route, places[a.p_key] || null);
  });
  await page.goto(BASE() + `hubs/${hub}/index.html#more/arcade/smile`);
  const go = await page.waitForSelector('#panel-arcade [data-start]', { timeout: 20000 }).catch(() => null);
  if (!go) { problems.push(`${name} (${label}): Smile didn't open from #more/arcade/smile`); await page.close(); return; }
  await go.click();
  /* answer until the game is over: a wrong answer ends it, a right one is walked away from */
  for (let i = 0; i < 6 && !(await page.$('#panel-arcade [data-overlay] [data-lb]')); i++) {
    await page.waitForFunction(() => document.querySelector('#panel-arcade [data-overlay] [data-lb]') || (document.querySelectorAll('.ms-opt').length && !document.querySelector('.ms-opt.locked')), null, { timeout: 12000 }).catch(() => {});
    if (await page.$('#panel-arcade [data-overlay] [data-lb]')) break;
    const walk = await page.$('#panel-arcade [data-walk]:not([disabled])');
    if (walk) await walk.click(); else await page.click('.ms-opt[data-ms="0"]').catch(() => {});
    await page.waitForTimeout(1800);
  }
  const btn = await page.waitForSelector('#panel-arcade [data-lb] button[data-sh-visit]', { timeout: 12000 }).catch(() => null);
  if (!btn) problems.push(`${name} (${label}): the game-over card's class board has no visit buttons`);
  else {
    await page.waitForTimeout(400);
    const r = await page.evaluate(() => ({ n: document.querySelectorAll('#panel-arcade [data-lb] button[data-sh-visit]').length, labels: [...document.querySelectorAll('#panel-arcade [data-lb] button[data-sh-visit]')].map(b => b.getAttribute('aria-label')),
      injected: !!window.__visit || !!document.querySelector('#panel-arcade [data-lb] img') }));
    if (r.n !== 2) problems.push(`${name} (${label}): two classmates' rows should be buttons and your own shouldn't (${JSON.stringify(r.labels)})`);
    if (r.injected) problems.push(`${name} (${label}): a leaderboard name with markup in it was drawn as markup`);
    const alpha = '#panel-arcade [data-lb] button[data-key="' + K('a') + '"]';
    await page.click(alpha);
    const dlg = await page.waitForSelector('dialog.tpv[open]', { timeout: 20000 }).catch(() => null);
    if (!dlg) problems.push(`${name} (${label}): tapping a name on the board didn't open that person's place`);
    else {
      await page.waitForTimeout(3000);   /* the trip through the clouds */
      const t = await page.evaluate(() => { const h = document.querySelector('dialog.tpv #tpvT'); if (!h) return null; const c = h.cloneNode(true), n = c.querySelector('.tpv-num'); if (n) n.remove(); return { text: c.textContent.trim(), els: c.children.length }; });
      if (!t || t.text !== 'Visit Alpha’s place' || t.els) problems.push(`${name} (${label}): the visited place's title should be "Visit Alpha's place" as text (${JSON.stringify(t)})`);
      await page.keyboard.press('Escape'); await page.waitForTimeout(800);
      const after = await page.evaluate(k => ({ open: !!document.querySelector('dialog.tpv[open]'), focus: (document.activeElement && document.activeElement.getAttribute('data-key')) === k }), K('a'));
      if (after.open) problems.push(`${name} (${label}): Escape didn't close the visited place`);
      else if (!after.focus) problems.push(`${name} (${label}): closing the visited place should give focus back to the name tapped`);
    }
    await page.click('#panel-arcade [data-lb] button[data-key="' + K('b') + '"]');
    const msg = await page.waitForFunction(() => { const m = document.querySelector('#panel-arcade [data-lb] .sh-visit-msg'); return m && m.textContent; }, null, { timeout: 12000 }).catch(() => null);
    const said = msg ? await msg.jsonValue() : '';
    if (!/couldn.t be opened/.test(said || '')) problems.push(`${name} (${label}): a key that opens nothing should say so on its row (${JSON.stringify(said)})`);
    if (await page.$('dialog.tpv[open]')) problems.push(`${name} (${label}): a key that opens nothing opened a place anyway`);
    notes.push(`${name} (${label}): a name on Smile's game-over board opens that place as a visit, Escape gives focus back, a key that opens nothing says so`);
  }
  errs.forEach(e => problems.push(`${name} (${label}): JavaScript error: ${e}`));
  await page.close();
}
async function stub(context){
  await noLeaks(context);   /* a closing page's last requests skip routing: answered in the page instead */
  await context.route(/^https?:\/\/(?!127\.0\.0\.1)/, route => {
    const u = route.request().url();
    if (/supabase\.co\/rest\/v1\/rpc\/get_ideas/.test(u)) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(IDEAS) });
    if (/supabase\.co\/rest\/v1\/rpc\/vote_idea/.test(u)) return route.fulfill({ status: 200, contentType: 'application/json', body: '{"up":6,"down":1,"mine":1}' });
    if (/supabase\.co\/rest\/v1\/rpc\/get_display_name/.test(u)) return route.fulfill({ status: 200, contentType: 'application/json', body: '"Test Molar"' });
    if (/supabase\.co\/rest\/v1\//.test(u)) return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    return route.abort();
  });
  if (context.routeWebSocket) await context.routeWebSocket(/.*/, ws => ws.close());
  // the first-visit "Want a quick tour?" prompt dims the page and would block the clicks below; answer it up front
  await context.addInitScript(() => { try { localStorage.setItem('sh_tour', 'no'); localStorage.setItem('sh_tour_hub', 'no'); } catch (e) {} });
  // an archived hub opens "This hub is archived" over the page once the database answers (widget/v3.js); press "Keep browsing"
  // like a student would, whenever it comes. Occlusion (2026-11-16) is the first hub on the engine to be archived, and the
  // engine's checks below never closed it.
  await context.addInitScript(() => { try { new MutationObserver(() => { const b = document.querySelector('.sh-archived-stay'); if (b) b.click(); })
    .observe(document, { childList: true, subtree: true }); } catch (e) {} });
  // the dashboard's exam check-in and survey open in a window over the dimmed page (widget/dash.js formWindow, 2026-11-17)
  // four seconds after it loads, for anyone with progress in a hub whose exam has passed; press its × ("Not now", "Later")
  // like a student would, whenever it comes. A survey's "Later" first says "Saved to your Inbox.", so the second press closes it.
  await context.addInitScript(() => { try { new MutationObserver(() => { const b = document.querySelector('section.survey.is-shown .survey-x'); if (b) b.click(); })
    .observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] }); } catch (e) {} });
}

/* every multiple-choice and select-all question explains each of its choices (q.why, one line per choice, same order;
   Sam's standing rule, 2026-10-20). (The hubs exempted from this and the rules below came down with their pages, 2026-11-19.) */
/* every taught lecture's questions include two-statement and true/false items (Sam's standing rule, 2026-10-22;
   vault/rules/two-statement-and-true-false.md) and numbered-statement items (2026-10-28;
   vault/rules/numbered-statements.md): every taught lecture needs all three formats. */
const FORMAT_MIN = { '2stmt': 3, tf: 5, numbered: 2 };
/* "Which statement is true?" (fmt 'which': one true, three false) and "Which statement is false?" (fmt 'whichf': one false,
   three true): Sam's standing rule, 2026-11-10 (vault/rules/which-statement-questions.md). Every lecture taught after it
   needs at least one of each. */
const WHICH_MIN = { which: 1, whichf: 1 };
/* High Likelihood Exam Questions (Sam's standing rule, 2026-10-30; vault/rules/high-likelihood-topics.md):
   every lecture with questions has at least one LIKELY_TOPICS entry, so a lecture added to a hub is ranked too, and every
   topic's ids exist in that lecture. */
const FORMAT_NAME = { '2stmt': 'two-statement', tf: 'true/false', numbered: 'numbered-statement', which: '"which statement is true"', whichf: '"which statement is false"' };
const TWO_CHOICES = ['Both statements are true', 'Both statements are false', 'Statement 1 is true; statement 2 is false', 'Statement 1 is false; statement 2 is true'];
/* Question ids are permanent (vault/rules/question-ids-are-permanent.md): class data, reports, pins and question health
   are keyed on them. tools/question-ids/<hub>.txt lists every id the hub has ever shipped, "<id> retired" for one deleted
   on purpose. A registered id missing from the hub (renamed or deleted) fails, and so does a retired id coming back.
   A new id is added to the file by a local run; CI (which can't commit) fails until it's there. */
const IDS_DIR = path.join(root, 'tools', 'question-ids');
function checkIds(hub, qids){
  const file = path.join(IDS_DIR, `${hub}.txt`), rel = `tools/question-ids/${hub}.txt`, ci = !!process.env.CI;
  const live = new Set(), retired = new Set(), have = new Set(qids);
  const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  if (text !== null) text.split('\n').forEach(line => {
    const t = line.replace(/#.*/, '').trim(); if (!t) return;
    const [id, flag] = t.split(/\s+/); (flag === 'retired' ? retired : live).add(id);
  });
  live.forEach(id => { if (!have.has(id) && !retired.has(id)) problems.push(`${hub}: question id ${id} is gone from the hub. Ids are permanent: give it back its id (edit the question in place), or, if it was deleted on purpose, change its line in ${rel} to "${id} retired"`); });
  qids.forEach(id => { if (retired.has(id)) problems.push(`${hub}: question id ${id} was retired; a new question needs a new id (${rel})`); });
  const fresh = qids.filter(id => !live.has(id) && !retired.has(id));
  if (!fresh.length) return;
  if (ci) { problems.push(`${hub}: ${fresh.length} question id(s) not in ${rel} yet: run node tools/ci/smoke.js locally (it adds them), or add these ids, one per line: ${fresh.join(", ")}`); return; }
  fs.mkdirSync(IDS_DIR, { recursive: true });
  const head = text === null ? `# Question ids for hubs/${hub}: every id this hub has ever shipped, one per line, never reused.\n` +
    `# "<id> retired" marks a question deleted on purpose. Rules: vault/rules/question-ids-are-permanent.md\n` : (text.endsWith('\n') ? '' : '\n');
  fs.appendFileSync(file, head + fresh.join('\n') + '\n');
  notes.push(`${hub}: added ${fresh.length} new question id(s) to ${rel} (commit it)`);
}
/* each wording of a question, as the card would show it: the original with the wording's stem, choices, whys and ex */
function lintWordings(hub, Q, V, core){
  const by = new Map(Q.map(q => [q.id, q])), W = [];
  if (core.variants !== Object.keys(V).length) problems.push(`${hub}: core.json's "variants" (${core.variants}) doesn't count variants.json's ${Object.keys(V).length} questions (run: node tools/hub-next/build.mjs)`);
  Object.entries(V).forEach(([id, raw]) => (Array.isArray(raw) ? raw : [raw]).forEach((v, k) => {
    const q = by.get(id); if (!q) { problems.push(`${hub}: variants.json has ${id}, which isn't a question`); return; }
    W.push(Object.assign({}, q, { stem: v.stem, choices: v.choices || q.choices, why: v.why || q.why, ex: v.ex || q.ex, _at: `${id} (wording ${k + 2})` }));
  }));
  W.forEach(q => {
    const at = q._at, ch = q.choices || [];
    if (q.type === 'mcq' || q.type === 'multi') {
      const low = ch.map(c => String(c).trim().toLowerCase()); if (new Set(low).size !== low.length) problems.push(`${hub}: ${at} has duplicate choices`);
      if (!Array.isArray(q.why) || q.why.length !== ch.length || q.why.some(w => !String(w || '').trim())) problems.push(`${hub}: ${at} needs a "why" for every choice`);
    }
    if (q.type === 'mcq' && !(q.answer >= 0 && q.answer < ch.length)) problems.push(`${hub}: ${at} answer index out of range`);
    if (q.type === 'multi' && !(Array.isArray(q.correct) && q.correct.every(i => i >= 0 && i < ch.length))) problems.push(`${hub}: ${at} has a key outside its choices`);
    if (!String(q.stem || '').trim()) problems.push(`${hub}: ${at} has no stem`);
  });
  const mc = W.filter(q => q.type === 'mcq' && (q.choices || []).length >= 3);
  const longest = mc.filter(q => { const len = q.choices.map(c => String(c).length), a = len[q.answer]; return a > Math.max(...len.filter((_, i) => i !== q.answer)); }).length;
  const pct = mc.length ? Math.round(100 * longest / mc.length) : 0;
  notes.push(`${hub}: ${W.length} reworded questions; correct answer is the longest choice in ${pct}% of their MCQs`);
  if (pct > 40) problems.push(`${hub}: in the reworded questions the correct answer is the longest choice in ${pct}% of MCQs (keep it under 40%)`);
}
function lint(hub, A){
  const Q = A.QUESTIONS || [], L = A.LECTURES || [], ids = new Set(), lecIds = new Set(L.map(l => l.id)), longItems = [];
  checkIds(hub, Q.map(q => String(q.id)));
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
    if (q.type === 'mcq' || q.type === 'multi') {
      const w = q.why || [];
      if (w.length !== (q.choices || []).length || w.some(x => !String(x || '').trim())) problems.push(`${hub}: ${q.id} needs a why for every choice (q.why: ${w.length} of ${(q.choices || []).length}; add its row to QUESTION_WHY)`);
    }
    if (q.type === 'match') {
      /* two items with the same answer: grading by index marks the other copy wrong (perio q4-L27, LESSONS.md) */
      ['left', 'right'].forEach((side, k) => {
        const vals = (q.pairs || []).map(p => String(p[k]).trim().toLowerCase());
        if (new Set(vals).size !== vals.length) problems.push(`${hub}: ${q.id} matching has the same ${side}-hand item twice (give each pair a distinct answer)`);
      });
    }
    if (q.fmt === '2stmt') {
      if ((q.choices || []).join('|') !== TWO_CHOICES.join('|')) problems.push(`${hub}: ${q.id} two-statement choices must be exactly: ${TWO_CHOICES.join(' / ')}`);
      if (!/\n1\. [^]*\n2\. /.test(q.stem || '')) problems.push(`${hub}: ${q.id} two-statement stem needs its statements on lines starting "1. " and "2. "`);
    }
    if (q.fmt === 'tf' && (q.choices || []).join('|') !== 'True|False') problems.push(`${hub}: ${q.id} true/false choices must be exactly True / False`);
    if (q.fmt === 'numbered') {
      /* "Which ... are true?" with numbered statements; choices are combinations ("1 and 3 only", "1, 2 and 4") in a
         fixed canonical order, sorted by their numbers (choiceOrder never shuffles them) */
      const n = ((q.stem || '').match(/\n\d+\. /g) || []).length, ch = (q.choices || []).map(String);
      const sets = ch.map(c => (c.match(/\d+/g) || []).map(Number));
      const cmp = (a, b) => { for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i] - b[i]; return a.length - b.length; };
      if (n < 3) problems.push(`${hub}: ${q.id} numbered-statement stem needs 3 or more statements on lines starting "1. ", "2. ", "3. "`);
      if (!ch.every(c => /^\d+( only| and \d+ only|(, \d+)+ and \d+)$/.test(c))) problems.push(`${hub}: ${q.id} numbered-statement choices must read like "2 only", "1 and 3 only" or "1, 2 and 4"`);
      if (sets.some(st => st.some(k => k < 1 || k > n))) problems.push(`${hub}: ${q.id} a numbered-statement choice names a statement the stem doesn't have`);
      if (sets.some((st, i) => i && cmp(sets[i - 1], st) >= 0)) problems.push(`${hub}: ${q.id} numbered-statement choices must be in canonical order (sorted by their numbers)`);
    }
    if (q.fmt === 'which' || q.fmt === 'whichf') {
      /* four (or more) statements that each stand alone; one true (which) or one false (whichf); the choices shuffle */
      const st = q.stem || '', neg = /\b(false|incorrect|not true|not correct|EXCEPT)\b/i.test(st);
      if (q.type !== 'mcq' || (q.choices || []).length < 4) problems.push(`${hub}: ${q.id} a "which statement" item needs 4 or more statements as its choices`);
      if (!/\bwhich\b/i.test(st)) problems.push(`${hub}: ${q.id} a "which statement" stem asks "Which statement ... ?"`);
      if (q.fmt === 'which' && neg) problems.push(`${hub}: ${q.id} asks for the false statement: make it fmt 'whichf' (whichf())`);
      if (q.fmt === 'whichf' && !neg) problems.push(`${hub}: ${q.id} is fmt 'whichf' but its stem doesn't ask which statement is false`);
    }
    if (q.type === 'sequence' && (q.steps || []).length > 5) longItems.push(`${q.id} (${q.steps.length} steps)`);
    if (q.type === 'multi' && (q.choices || []).length > 6) longItems.push(`${q.id} (${q.choices.length} options)`);
  });
  {
    const T = A.LIKELY_TOPICS;
    if (!Array.isArray(T)) problems.push(`${hub}: no LIKELY_TOPICS (High Likelihood Exam Questions; copy it from review-of-systems)`);
    else {
      const byId = new Map(Q.map(q => [q.id, q]));
      T.forEach(t => (t.ids || []).forEach(id => { const q = byId.get(id);
        if (!q) problems.push(`${hub}: LIKELY_TOPICS "${t.t}" lists unknown question ${id}`);
        else if (q.lec !== t.lec) problems.push(`${hub}: LIKELY_TOPICS "${t.t}" (${t.lec}) lists ${id}, which is in ${q.lec}`); }));
      L.forEach(l => { if (!Q.some(q => q.lec === l.id)) return;
        if (!T.some(t => t.lec === l.id && (t.ids || []).length)) problems.push(`${hub}: lecture ${l.id} has no High Likelihood topics (add its LIKELY_TOPICS entries, ranked by hints and reviews)`); });
    }
  }
  if (longItems.length) notes.push(`${hub}: heads-up, long ordering/select-all items score very low (LESSONS.md): ${longItems.join(', ')}`);
  {
    /* A hub of many courses (its lectures have a group: Review of Systems) counts the formats per course, not per lecture
       (Sam, 2026-11-19: "Mostly board-style": the special formats per course, the rest single-best-answer and patient boxes) */
    const units = L.some(l => l.group)
      ? [...new Set(L.map(l => l.group))].map(g => ({ id: g, what: 'course', lecs: L.filter(l => l.group === g && (!l.status || l.status === 'taught')).map(l => l.id) }))
      : L.map(l => ({ id: l.id, what: 'lecture', lecs: [l.id], l }));
    units.forEach(u => {
      const l = u.l || { id: u.id };
      const lq = Q.filter(q => u.lecs.includes(q.lec));
      if (!lq.length || (l.status && l.status !== 'taught')) return;
      Object.keys(FORMAT_MIN).forEach(f => { const n = lq.filter(q => q.fmt === f).length;
        if (n < FORMAT_MIN[f]) problems.push(`${hub}: ${u.what} ${l.id} has ${n} ${FORMAT_NAME[f]} questions (needs at least ${FORMAT_MIN[f]}; see vault/rules/${f === 'numbered' ? 'numbered-statements' : 'two-statement-and-true-false'}.md)`); });
      Object.keys(WHICH_MIN).forEach(f => { const n = lq.filter(q => q.fmt === f).length;
        if (n < WHICH_MIN[f]) problems.push(`${hub}: ${u.what} ${l.id} has ${n} ${FORMAT_NAME[f]} questions (needs at least ${WHICH_MIN[f]}; see vault/rules/which-statement-questions.md)`); });
    });
    const tfq = Q.filter(q => q.fmt === 'tf');
    if (tfq.length >= 10) { const t = Math.round(100 * tfq.filter(q => q.answer === 0).length / tfq.length);
      if (t < 35 || t > 65) problems.push(`${hub}: ${t}% of true/false answers are True (keep it between 35% and 65%)`); }
    /* statement keys must not form a pattern (PCD Implants suggestion #14, 2026-11-04: 36 of 46 two-statement keys were
       "1 true, 2 false", and statement 1 was true in all 30 numbered items): spread two-statement keys over all four
       choices, numbered keys over every position, and the false statements over every number */
    const two = Q.filter(q => q.fmt === '2stmt');
    if (two.length >= 12) TWO_CHOICES.forEach((c, i) => { const t = Math.round(100 * two.filter(q => q.answer === i).length / two.length);
      if (t < 10 || t > 40) problems.push(`${hub}: "${c}" is the key of ${t}% of two-statement questions (keep each choice between 10% and 40%; swap statements or change which is false)`); });
    const numq = Q.filter(q => q.fmt === 'numbered');
    if (numq.length >= 8) {
      const most = Math.max(...[0, 1, 2, 3].map(i => numq.filter(q => q.answer === i).length));
      if (most / numq.length > 0.45) problems.push(`${hub}: ${Math.round(100 * most / numq.length)}% of numbered-statement keys are in the same position (keep it at 45% or less; pick the wrong combinations to move the key)`);
      [1, 2, 3, 4].forEach(k => { const t = numq.filter(q => (String(q.choices[q.answer]).match(/\d+/g) || []).map(Number).includes(k)).length;
        if (t / numq.length > 0.9) problems.push(`${hub}: statement ${k} is true in ${t} of ${numq.length} numbered-statement questions (put the false statements at different numbers)`); });
    }
  }
  const mc = Q.filter(q => q.type === 'mcq' && (q.choices || []).length >= 3);
  const longest = mc.filter(q => { const len = q.choices.map(c => String(c).length), a = len[q.answer]; return a > Math.max(...len.filter((_, i) => i !== q.answer)); }).length;
  const pct = mc.length ? Math.round(100 * longest / mc.length) : 0;
  notes.push(`${hub}: ${Q.length} questions, ${L.length} lectures; correct answer is the longest choice in ${pct}% of MCQs`);
  if (pct > 40) problems.push(`${hub}: the correct answer is the longest choice in ${pct}% of MCQs (keep it under 40%; chance is ~25%)`);
  const audioDir = path.join(root, 'hubs', hub, 'audio');
  /* an archived hub whose audio came off the site says data-audio="off" on its widget tag
     (vault/rules/archived-hubs-drop-their-audio.md): no narration is expected, and none may be left behind */
  const audioOff = A.CORE ? A.CORE.audio === 'off' : (() => { try { return /<script[^>]*widget\/v3\.js"[^>]*\bdata-audio="off"/.test(fs.readFileSync(path.join(root, 'hubs', hub, 'index.html'), 'utf8')); } catch (e) { return false; } })();
  if (audioOff) {
    const left = fs.existsSync(audioDir) ? fs.readdirSync(audioDir).filter(f => /\.(mp3|words\.json)$/.test(f)) : [];
    if (left.length) problems.push(`${hub}: its ${A.CORE ? 'core.json says "audio": "off"' : 'widget tag says data-audio="off"'} but audio/ still holds ${left.length} file(s) (${left.slice(0, 3).join(', ')}): take them out, or drop the switch`);
    if (A.NOTES && (A.NOTES.hyAudio || []).length) problems.push(`${hub}: audio is off but notes.json's hyAudio still lists ${A.NOTES.hyAudio.join(', ')} (node tools/hub-next/build.mjs --hub ${hub})`);
    if (A.NOTES && A.NOTES.guideAudio) problems.push(`${hub}: audio is off but notes.json's guideAudio is still true (node tools/hub-next/build.mjs --hub ${hub})`);
    notes.push(`${hub}: audio off (archived; Listen uses the device's voice, no Timmy Time)`);
  } else if (fs.existsSync(audioDir)) L.forEach(l => {
    if (A.READINGS[l.id] && !fs.existsSync(path.join(audioDir, `${l.id}-full.mp3`))) problems.push(`${hub}: missing narration audio/${l.id}-full.mp3`);
    if (A.READINGS_PLAIN[l.id] && !fs.existsSync(path.join(audioDir, `${l.id}-plain.mp3`))) problems.push(`${hub}: missing narration audio/${l.id}-plain.mp3`);
  });
  /* Follow along (widget/hub.js): the narration of a hub on the engine has its word timings beside it, made from that
     very mp3 (tools/narration_words.py; tools/narrate.py writes them whenever it renders one) */
  if (!audioOff && fs.existsSync(audioDir) && A.NOTES) {
    const NN = A.NOTES;
    const unrecorded = [];
    ['full', 'plain', 'hy'].forEach(level => Object.keys(NN[level] || {}).forEach(id => {
      const mp3 = path.join(audioDir, `${id}-${level}.mp3`), wf = mp3.replace(/\.mp3$/, '.words.json'), fix = `python3 tools/narration_words.py ${hub} --lec ${id} --level ${level}`;
      if (!fs.existsSync(mp3)) { if (level === 'hy') unrecorded.push(id); return; }
      if (!fs.existsSync(wf)) { problems.push(`${hub}: no word timings for audio/${id}-${level}.mp3 (${fix})`); return; }
      let d = null; try { d = JSON.parse(fs.readFileSync(wf, 'utf8')); } catch (e) {}
      if (!d || d.v !== 1) problems.push(`${hub}: audio/${id}-${level}.words.json can't be read (${fix})`);
      else if (d.bytes !== fs.statSync(mp3).size) problems.push(`${hub}: audio/${id}-${level}.words.json was made from another recording of it (${fix})`);
      else if (!d.w || !Array.isArray(d.t) || 2 * d.w.split(' ').length !== d.t.length) problems.push(`${hub}: audio/${id}-${level}.words.json has ${d.w ? d.w.split(' ').length : 0} words but ${(d.t || []).length / 2} times (${fix})`);
      /* High yield is rebuilt whenever the notes, predicted topics, hints or questions change (tools/hub-next/high-yield.mjs),
         so its recording says which text it was spoken from ("h", tools/narrate.py's text_hash) and must still match it
         (vault/rules/text-and-audio-never-drift.md); the build then offers it to the page (notes.json's hyAudio) */
      else if (level === 'hy' && d.h !== crypto.createHash('sha1').update(NN.hy[id], 'utf8').digest('hex').slice(0, 12))
        problems.push(`${hub}: audio/${id}-hy.mp3 was spoken from another version of ${id}'s High yield: record it again (python3 tools/narrate.py ${hub} --level hy --lec ${id} --force, then node tools/hub-next/build.mjs --hub ${hub})`);
    }));
    /* a lecture with High yield and no recording of it is allowed (Listen reads it in the device's voice), and named */
    if (unrecorded.length) notes.push(`${hub}: High yield not narrated for ${unrecorded.join(', ')} (Listen uses the device's voice there)`);
    const offered = (NN.hyAudio || []).filter(id => !fs.existsSync(path.join(audioDir, `${id}-hy.mp3`)));
    if (offered.length) problems.push(`${hub}: notes.json's hyAudio lists ${offered.join(', ')} with no audio/<lecture>-hy.mp3 (node tools/hub-next/build.mjs --hub ${hub})`);
    /* a professor's study guide (widget/guide.js): its recording, audio/guide.mp3, says which text it was spoken from, the page's
       readable part as tools/hub-next/guide.mjs writes it, and must still match it, like High yield's */
    const gmp3 = path.join(audioDir, 'guide.mp3'), gwf = gmp3.replace(/\.mp3$/, '.words.json'), again = `python3 tools/narrate.py ${hub} --level guide --force, then node tools/hub-next/build.mjs --hub ${hub}`;
    const ghtml = require('child_process').execFileSync('node', [path.join(root, 'tools', 'hub-next', 'guide.mjs'), hub], { cwd: root, encoding: 'utf8' });
    if (!ghtml) { if (fs.existsSync(gmp3)) problems.push(`${hub}: audio/guide.mp3 is there but study.json has no guide (git rm it, then node tools/hub-next/build.mjs --hub ${hub})`); }
    else if (!fs.existsSync(gmp3)) { notes.push(`${hub}: the study guide isn't narrated (Listen uses the device's voice there)`); if (NN.guideAudio) problems.push(`${hub}: notes.json's guideAudio is true with no audio/guide.mp3 (node tools/hub-next/build.mjs --hub ${hub})`); }
    else {
      let d = null; try { d = JSON.parse(fs.readFileSync(gwf, 'utf8')); } catch (e) {}
      if (!d || d.v !== 1) problems.push(`${hub}: audio/guide.mp3 has no readable words file beside it (${again})`);
      else if (d.bytes !== fs.statSync(gmp3).size) problems.push(`${hub}: audio/guide.words.json was made from another recording of it (${again})`);
      else if (!d.w || !Array.isArray(d.t) || 2 * d.w.split(' ').length !== d.t.length) problems.push(`${hub}: audio/guide.words.json has ${d.w ? d.w.split(' ').length : 0} words but ${(d.t || []).length / 2} times (${again})`);
      else if (d.h !== crypto.createHash('sha1').update(ghtml, 'utf8').digest('hex').slice(0, 12)) problems.push(`${hub}: audio/guide.mp3 was spoken from another version of the study guide: record it again (${again})`);
      else if (NN.guideAudio !== true) problems.push(`${hub}: audio/guide.mp3 matches the study guide but notes.json's guideAudio isn't true (node tools/hub-next/build.mjs --hub ${hub})`);
      else notes.push(`${hub}: the study guide is narrated (audio/guide.mp3, ${Math.round(d.dur / 60)} min)`);
    }
  }
}

(async () => {
  await new Promise(r => server.listening ? r() : server.on('listening', r));
  /* behind tools/ci/no-leaks.js's refusing proxy: a request still in its route when a page closes goes on to the network (BUG-197) */
  const browser = await noLeaks.launch(chromium, process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  for (const vp of [{ width: 1366, height: 860 }, { width: 390, height: 844, isMobile: true }].filter(v => !PART || PART === (v.isMobile ? 'phone' : 'desktop'))) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.isMobile, hasTouch: !!vp.isMobile, serviceWorkers: 'block' }); /* sw.js would bypass the lint hook */
    await stub(context);
    const label = vp.isMobile ? 'phone' : 'desktop';
    // the dashboard (index.html, widget/dash.js): every hub tab, the class
    // board's two lists, Settings, the name dialog and the menu
    {
      const page = await context.newPage(); const errs = [], name = `dashboard (${label})`; page.on('pageerror', e => errs.push(e.message));
      const askedFiles = [], outside = []; page.on('request', r => { const w = widgetFile(r.url()); if (w) askedFiles.push(w); if (GOOGLE_FONTS.test(r.url())) outside.push(r.url().slice(0, 80)); });
      await page.goto(BASE() + 'index.html'); await page.waitForTimeout(1200);
      await page.waitForFunction(() => window.SH_BUNDLE && window.shRanks && window.shPet && window.shIdeas, null, { timeout: 15000 }).catch(() => {});
      { const bun = await bundleCheck(page, 'dashboard', label, 'dash', askedFiles);
        notes.push(`${name}: the page asked for ${[...new Set(askedFiles)].length} widget files (${[...new Set(askedFiles)].join(', ')}) and links ${bun.links} stylesheet${bun.links === 1 ? '' : 's'}`); }
      /* against the device's width, not innerWidth: an emulated phone widens its layout viewport to fit a page that is
         too wide, so scrollWidth - innerWidth reads 0 on exactly the pages that overflow (BUG-140, BUG-141) */
      const sideways = async what => { const dw = (page.viewportSize() || {}).width || 0; const w = await page.evaluate(d => Math.max(document.documentElement.scrollWidth, innerWidth) - (d || innerWidth), dw); if (w > 1) problems.push(`${name}: ${what} scrolls sideways by ${w}px`); };
      if (!(await page.$('#dx h1'))) problems.push(`${name}: the page has no title`);
      const tabs = await page.$$eval('#hubTabs [data-tab]', bs => bs.map(b => b.getAttribute('data-tab')));
      if (!tabs.length && !(await page.$('.dx-empty'))) problems.push(`${name}: no hub tabs and no "no hubs are live" message`);
      for (const t of tabs) {
        await page.click(`#hubTabs [data-tab="${t}"]`); await page.waitForTimeout(250);
        const st = await page.evaluate(() => { const p = document.getElementById('hubPanel'); return { hub: p.getAttribute('data-hub'), start: !!p.querySelector('a.dx-start[href*="hubs/"]'), title: (p.querySelector('.dx-title') || {}).textContent || '' }; });
        if (st.hub !== t || !st.start || !st.title.trim()) problems.push(`${name}: the ${t} tab didn't open its hub (title, Start studying)`);
        await sideways(`the ${t} tab`);
      }
      if (tabs.length && !(await page.$('#hubPanel .dx-stage .dx-ring'))) problems.push(`${name}: the open hub has no progress ring`);
      for (const b of ['streaks', 'ranks']) { await page.click(`#boardSeg [data-board="${b}"]`); await page.waitForTimeout(200); if (!(await page.$('#board > *'))) problems.push(`${name}: the class board's ${b} list is empty`); await sideways(`the ${b} board`); }
      if (!(await page.$('#class #now #nowCount'))) problems.push(`${name}: the class panel has no "studying right now" count`);
      // the classroom in the studying-now tile, and the stage behind the top three (Sam, 2026-11-11). Eight made-up people at
      // once take their desks without the walk; an outfit that isn't one (here, markup) must come out as a plain Timmy.
      const room = await page.evaluate(async () => {
        const D = window.shDash, hubs = D && D.hubs ? D.hubs().map(h => h.id) : [], list = [];
        if (!D || !D.setLive || !hubs.length) return { skip: !hubs.length };
        for (let i = 0; i < 8; i++) list.push({ key: 'smoke' + i, hub: hubs[i % hubs.length], fit: ['', 'thanksgiving:turkey', '<img src=x onerror="window.__fit=1">', 'captain-hat'][i % 4] });
        // one of the eight is a hub tab of this browser's own (the key a hub tab remembers): only that desk gets "You"
        try { localStorage.setItem('sh_presence_mine', JSON.stringify({ [list[5].hub + '/smoke5']: Date.now() })); } catch (e) {}
        const by = {}; list.forEach(x => { by[x.hub] = (by[x.hub] || 0) + 1; }); D.setLive(by, list);
        await new Promise(r => setTimeout(r, 400));
        const out = { art: !!(window.SH_CLASS_ART && window.SH_CLASS_ART.room && window.SH_CLASS_ART.stage), room: !!document.querySelector('#now.has-room #room svg'), desks: document.querySelectorAll('#room .rm-seat').length,
          tims: document.querySelectorAll('#room .rm-tim svg').length, count: document.getElementById('nowCount').textContent, bad: document.querySelectorAll('#room img').length + (window.__fit ? 1 : 0),
          podium: !!document.querySelector('#board .dx-podium'), set: !!document.querySelector('#board .dx-set .st-win'),
          me: [...document.querySelectorAll('#nowMe .dx-me')].map(e => e.textContent).join('|') };
        D.setLive({}, []); out.after = document.querySelectorAll('#nowMe .dx-me').length;
        try { localStorage.removeItem('sh_presence_mine'); } catch (e) {}
        return out;
      });
      if (!room.skip) {
        if (!room.art || !room.room || room.desks < 8) problems.push(`${name}: the studying-now tile drew no classroom (${JSON.stringify(room)})`);
        else if (room.tims !== 8 || room.count !== '8') problems.push(`${name}: eight people studying, but the classroom seats ${room.tims} and the board says ${room.count}`);
        if (room.bad) problems.push(`${name}: an outfit from another browser was drawn as markup`);
        if (room.room && (room.me !== 'You' || room.after)) problems.push(`${name}: your own Timmy should be the only one tagged "You", and only while he's there (tags: "${room.me}", after everyone left: ${room.after})`);
        if (room.podium && !room.set) problems.push(`${name}: the leaderboard's top three have no stage`);
      }
      await sideways('the classroom');
      // taken out on Sam's call (2026-11-11): the What's new list, the arcade scores and the When people study chart
      for (const gone of ['#changelog', '#boardSeg [data-board="arcade"]', '#hoursLine']) if (await page.$(gone)) problems.push(`${name}: ${gone} is back on the page`);
      await page.click('#setBtn'); await page.waitForTimeout(200);
      if (!(await page.$('.dx-dlg [data-focus]')) || (await page.$$('.dx-dlg .set-row')).length < 8) problems.push(`${name}: Settings didn't open with Focus mode and the extras`);
      await page.keyboard.press('Escape'); await page.waitForTimeout(100);
      if (await page.$('.dx-dlg')) problems.push(`${name}: Escape didn't close Settings`);
      await page.click('#greetEdit'); await page.waitForTimeout(200);
      if (!(await page.$('.dx-dlg input'))) problems.push(`${name}: the name dialog didn't open`);
      await page.keyboard.press('Escape');
      await page.click('#menuBtn'); await page.waitForTimeout(100);
      if (!(await page.$('#dxMenu:not([hidden]) #tourBtn')) || !(await page.$('#dxMenu #aboutBtn'))) problems.push(`${name}: the menu didn't open with About and the tour`);
      await page.keyboard.press('Escape');
      if (!(await page.$('#ideas[data-sh-ideas]'))) problems.push(`${name}: the idea board's section (#ideas) is missing`);
      // the idea board (widget/ideas.js): the made-up board above is drawn, a vote counts, the form has the hub and the six
      // kinds, what a student wrote shows as text, and every button names itself with a fixed data- value (click counts
      // must never pick up anyone's words: learner-data-privacy)
      const board = await page.evaluate(async () => {
        const el = document.getElementById('ideas'), wait = ms => new Promise(r => setTimeout(r, ms));
        if (!el || el.hidden) return { hidden: true };
        el.scrollIntoView();   // its drawings (widget/hub-art/board.js) are fetched when the board comes near the screen
        for (let i = 0; i < 20 && !el.querySelector('.shi-card .shi-pin svg'); i++) await wait(150);
        const out = { cards: el.querySelectorAll('.shi-card').length, markup: el.querySelectorAll('.shi-card img, .shi-card b:not(.shi-meta b):not(.shi-why b), .shi-card i').length + (window.__idea ? 1 : 0),
          tags: [...el.querySelectorAll('.shi-card:nth-child(2) .shi-tag')].map(t => t.textContent).join('|'), status: !!el.querySelector('.shi-card .shi-why'),
          own: !!el.querySelector('.shi-card.is-own [data-shi="delete"]'), filters: el.querySelectorAll('[data-shi-filter] option').length };
        out.art = [el.querySelectorAll('.shi-card .shi-pin svg').length, el.querySelectorAll('.shi-card .shi-kindart svg').length, el.querySelectorAll('.shi-card .shi-stamp').length, el.querySelectorAll('.shi-card.is-top .shi-rosette svg').length].join(' ');
        const up = el.querySelector('.shi-card [data-shi="up"]'); up.click(); await wait(250);
        out.vote = up.getAttribute('aria-pressed') + ' ' + up.querySelector('.num').textContent;
        el.querySelector('[data-shi="new"]').click(); await wait(100);
        out.kinds = el.querySelectorAll('.shi-form .shi-kind input[type=radio]').length; out.hubs = (el.querySelector('.shi-form [data-shi-f="hub"] option') || {}).textContent;
        out.unnamed = [...el.querySelectorAll('button, label.shi-kind')].filter(b => ![...b.attributes].some(a => /^data-shi/.test(a.name) && a.value)).length;
        el.querySelector('[data-shi="cancel"]').click();
        return out;
      });
      if (board.hidden) problems.push(`${name}: the idea board didn't show`);
      else {
        if (board.cards !== 4 || !board.status || !board.own || board.filters < 9) problems.push(`${name}: the idea board is missing cards, a status line, Delete on my own idea or its filters (${JSON.stringify(board)})`);
        if (board.markup) problems.push(`${name}: an idea's words were drawn as markup`);
        if (board.art !== '4 4 1 1') problems.push(`${name}: the idea board's drawings are missing: every note has a pin and its kind's picture, Sam's answer is a stamp and the top idea wears the rosette (pins, kinds, stamps, rosette: ${board.art})`);
        if (board.tags !== 'Perio|Questions and notes|From a check-in') problems.push(`${name}: an idea's tags should be its hub, its kind and where it came from, not "${board.tags}"`);
        if (board.vote !== 'true 6') problems.push(`${name}: an up vote on the idea board didn't count (${board.vote})`);
        if (board.kinds !== 6 || board.hubs !== 'All hubs') problems.push(`${name}: the idea form should offer All hubs first and six kinds (${board.kinds}, ${board.hubs})`);
        if (board.unnamed) problems.push(`${name}: ${board.unnamed} idea board button(s) have no fixed data-shi name, so click counts would record their text`);
      }
      await sideways('the idea board');
      // Ask Timmy on the dashboard: everyone has Timmy, so the "Ask the hub" button takes his place in the "you" card only
      // when he's turned off (Settings; put back after), and answers from every live hub at once
      if (!(await page.$('#askSpot:not([hidden]) [data-ska="spot"]')) && !(await page.$('#petHome.shpet-house:not([hidden])'))) problems.push(`${name}: neither Timmy nor the Ask button is in the "you" card`);
      await page.evaluate(() => { localStorage.setItem('sh_pref_pet', 'off'); document.dispatchEvent(new CustomEvent('sh:pref', { detail: { key: 'sh_pref_pet', val: 'off' } })); });
      await page.waitForSelector('#askSpot:not([hidden]) [data-ska="spot"]', { timeout: 10000 }).catch(() => {});
      if (!(await page.$('#askSpot:not([hidden]) [data-ska="spot"]'))) problems.push(`${name}: no Ask button in the "you" card while Timmy isn't there`);
      else await askCheck(page, name, { hubId: 'dashboard', open: () => page.click('#askSpot [data-ska="spot"]') });
      await page.evaluate(() => localStorage.removeItem('sh_pref_pet'));
      errs.forEach(e => problems.push(`${name}: JavaScript error: ${e}`));
      /* a recap's saved image (widget/recap.js): given a font it is drawn in that one family (this page passes the
         site's own); without one, in the two faces it has always had (the live dashboard and the admin page) */
      if (!vp.isMobile) {
        await page.addScriptTag({ url: BASE() + 'widget/recap.js' });
        const faces = await page.evaluate(() => {
          const used = [], d = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'font');
          Object.defineProperty(CanvasRenderingContext2D.prototype, 'font', { configurable: true, get(){ return d.get.call(this); }, set(v){ used.push(String(v).replace(/^\S+ \S+ /, '')); d.set.call(this, v); } });
          const R = { hub: 'smoke', first_day: '2026-11-01', last_day: '2026-11-10', exam_day: '2026-11-10', minutes: 1200, people: 30, answers: 5000, correct: 4000,
            by_day: [{ d: '2026-11-01', minutes: 100 }, { d: '2026-11-09', minutes: 300 }], by_hour: [], after_midnight: 3, night_before: 200, night_before_people: 12, regulars: 9, toughest: [], top_answers: [], best_run: null, awards: {} };
          const run = o => { used.length = 0; let err = ''; try { window.shRecap.draw(document.createElement('canvas'), R, o); } catch (e) { err = e.message; } return { err, fams: [...new Set(used)] }; };
          const out = { own: run({ title: 'Smoke' }), one: run({ title: 'Smoke', font: "'Nunito Sans', sans-serif" }) };
          Object.defineProperty(CanvasRenderingContext2D.prototype, 'font', d);
          return out;
        });
        if (faces.one.err || faces.one.fams.join() !== "'Nunito Sans', sans-serif") problems.push(`${name}: a recap image drawn with a font should use only that family (${faces.one.err || faces.one.fams.join(' | ')})`);
        if (faces.own.err || !faces.own.fams.some(x => /Fraunces/.test(x)) || !faces.own.fams.some(x => /Work Sans/.test(x)) || faces.own.fams.some(x => /Nunito/.test(x))) problems.push(`${name}: a recap image drawn without a font should keep Fraunces and Work Sans, as on the live dashboard (${faces.own.err || faces.own.fams.join(' | ')})`);
        if (!/font: FACE/.test(fs.readFileSync(path.join(root, 'widget/dash.js'), 'utf8'))) problems.push(`${name}: widget/dash.js should hand the recap image the site's own typeface (font: FACE)`);
      }
      if (outside.length) problems.push(`${name}: the page asked Google Fonts for ${[...new Set(outside)].join(', ')}; the redesign's one typeface is self-hosted`);
      ownFiles('dashboard', label, 'dash', askedFiles);
      notes.push(`${name}: ${tabs.length} hub tabs, the class board, Settings, the name dialog and the menu`);
      await page.close();
    }
    // the hubs on the engine: the four views, then every page in More and every set of questions
    for (const hub of engineHubs) {
      /* the question-bank lint, from the hub's content (the JSON is where it is edited) */
      if (!vp.isMobile) {
        try {
          const rd = f => JSON.parse(fs.readFileSync(content(hub, f), 'utf8')), core = rd('core.json'), nts = rd('notes.json');
          lint(hub, { QUESTIONS: rd('questions.json'), LECTURES: core.lectures || [], READINGS: nts.full || {}, READINGS_PLAIN: nts.plain || {}, LIKELY_TOPICS: core.likelyTopics, CORE: core, NOTES: nts });
          /* a hub's other wordings (content/variants.json, shown on later tries): the build checks their shape
             (tools/hub-next/build.mjs checkVariants); here each wording gets the bank's own per-question lint */
          if (fs.existsSync(content(hub, 'variants.json'))) lintWordings(hub, rd('questions.json'), rd('variants.json'), core);
        } catch (e) { problems.push(`${hub}: could not read its content (hubs/${hub}/content/): ${e.message}`); }
      }
      const page = await context.newPage(); const errs = [], name = `${hub}`;
      page.on('pageerror', e => errs.push(e.message));
      const askedFiles = [], outside = [], askedFonts = []; page.on('request', r => { const w = widgetFile(r.url()); if (w) askedFiles.push(w); if (GOOGLE_FONTS.test(r.url())) outside.push(r.url().slice(0, 80)); if (/\.woff2?(\?|$)/.test(r.url())) askedFonts.push(r.url()); });
      await page.goto(BASE() + `hubs/${hub}/index.html`); await page.waitForTimeout(1500);
      const modes = await page.$$eval('#modeSwitch [data-mode]', bs => bs.map(b => b.getAttribute('data-mode')));
      if (modes.join() !== 'home,notes,questions,more') problems.push(`${name} (${label}): the views are ${modes.join(', ') || 'missing'}, not Home, Notes, Questions and More`);
      const n = await page.evaluate(() => window.SH_EXPORT && window.SH_EXPORT.questions ? window.SH_EXPORT.questions.length : 0);
      if (!n) problems.push(`${name} (${label}): window.SH_EXPORT has no questions (the widget's search, stats and question health read it)`);
      /* the bundles: the engine with the page, the shared widgets and the hub's own layer once it is drawn (they come
         when the browser is idle, after the notes), one stylesheet, and nothing they carry fetched by itself */
      await page.waitForFunction(() => window.shBootstrap && window.SH_BUNDLE && window.shRanks && window.shPet, null, { timeout: 15000 }).catch(() => {});
      const bun = await bundleCheck(page, name, label, 'hub', askedFiles);
      if (hub === engineHubs[0]) notes.push(`${name} (${label}): the page asked for ${[...new Set(askedFiles)].length} widget files (${[...new Set(askedFiles)].join(', ')}) and links ${bun.links} stylesheet${bun.links === 1 ? '' : 's'}`);
      let screens = 0;
      const routes = [...modes, 'questions/drill', 'questions/misses', 'questions/weak', 'questions/mock',
        'more/timmy', 'more/hints', 'more/cram', 'more/side', 'more/arcade', 'more/stats', 'more/settings', 'more/ideas'];
      for (const r of routes) {
        if (modes.includes(r)) await page.click(`#modeSwitch [data-mode="${r}"]`); else await page.evaluate(h => { location.hash = h; }, r);
        await page.waitForTimeout(r === 'more/arcade' ? 1500 : 500); screens++;
        // the idea board's page in More: this hub's ideas and the all-hub ones, and a new idea starts on this hub
        if (r === 'more/ideas') {
          await page.waitForSelector('.more-body .shi-card', { timeout: 15000 }).catch(() => {});
          const ib = await page.evaluate(() => { const b = document.querySelector('.more-body'); if (!b || !b.querySelector('.shi-card')) return null;
            b.querySelector('[data-shi="new"]').click(); const v = (b.querySelector('.shi-form [data-shi-f="hub"]') || {}).value; b.querySelector('[data-shi="cancel"]').click();
            return { hub: v, first: (b.querySelector('[data-shi-filter="hub"]') || {}).value, markup: b.querySelectorAll('.shi-card img').length + (window.__idea ? 1 : 0) }; });
          if (!ib) problems.push(`${name} (${label}): the idea board in More drew no ideas`);
          else if (ib.hub !== hub || ib.first !== hub || ib.markup) problems.push(`${name} (${label}): the idea board in More should open on this hub, start a new idea on it and show words as text (${JSON.stringify(ib)})`);
        }
        const st = await page.evaluate(() => { const v = document.querySelector('.hx-view:not([hidden])'); return { h1: !!(v && v.querySelector('h1')), w: document.documentElement.scrollWidth - innerWidth }; });
        if (!st.h1) problems.push(`${name} (${label}): ${r} has no page title`);
        if (st.w > 1) problems.push(`${name} (${label}): ${r} scrolls sideways by ${st.w}px`);
        if (r === 'questions') { const c = await page.$('#qlist .qcard .ch'); if (c) { await c.click(); await page.waitForTimeout(300); if (!(await page.$('#qlist .qcard.is-answered'))) problems.push(`${name} (${label}): answering a question didn't mark the card answered`); } }
        if (r === 'more/arcade') { const g = await page.$('.ar-grid [data-game]'); if (g) { await g.click(); await page.waitForTimeout(400); const back = await page.$('#panel-arcade [data-back]'); if (back) await back.click().catch(() => {}); } }
      }
      /* High yield, the notes' third reading level (tools/hub-next/high-yield.mjs): on a lecture that has it, the switch shows
         it, each predicted topic a heading, nothing scrolls sideways; then back to As taught */
      const hyLec = (() => { try { return Object.keys(JSON.parse(fs.readFileSync(content(hub, 'notes.json'), 'utf8')).hy || {})[0]; } catch (e) { return null; } })();
      if (hyLec) {
        await page.evaluate(h => { location.hash = h; }, 'notes/' + hyLec); await page.waitForTimeout(800);
        const hb = await page.$('[data-level="hy"]');
        if (!hb) problems.push(`${name} (${label}): notes/${hyLec} has High yield in notes.json but no High yield button`);
        else {
          await hb.click(); await page.waitForTimeout(600); screens++;
          const st = await page.evaluate(() => ({ t: document.querySelectorAll('.reading-prose.hy .hy-t').length, on: !!document.querySelector('[data-level="hy"][aria-pressed="true"]'), w: document.documentElement.scrollWidth - innerWidth }));
          if (!st.on || !st.t) problems.push(`${name} (${label}): High yield for ${hyLec} shows ${st.t} topics`);
          /* its Listen offers the recording exactly when the build listed it (notes.json's hyAudio), else the device's voice */
          const rec = (() => { try { return (JSON.parse(fs.readFileSync(content(hub, 'notes.json'), 'utf8')).hyAudio || []).includes(hyLec); } catch (e) { return false; } })();
          const offers = await page.evaluate(() => { const b = document.querySelector('.reading #sh-tts-btn'); return b ? b.getAttribute('data-sh-tts-audio') === '1' : null; });
          if (offers !== rec) problems.push(`${name} (${label}): High yield for ${hyLec}: Listen ${offers ? 'offers' : 'does not offer'} its recording, but notes.json's hyAudio ${rec ? 'lists' : "doesn't list"} it`);
          if (st.w > 1) problems.push(`${name} (${label}): High yield for ${hyLec} scrolls sideways by ${st.w}px`);
          const back = await page.$('[data-level="full"]'); if (back) { await back.click(); await page.waitForTimeout(300); }
        }
      }
      /* a professor's study guide (#notes/guide, widget/guide.js): it draws every lecture on it, its readable part says exactly
         what its recording was spoken from (tools/hub-next/guide.mjs: change one and the other changes with it, or Follow
         along loses its place), and Listen offers the recording exactly when the build says it matches (notes.json's guideAudio) */
      const nGuide = (() => { try { return (JSON.parse(fs.readFileSync(content(hub, 'study.json'), 'utf8')).guide || []).length; } catch (e) { return 0; } })();
      if (nGuide) {
        await page.evaluate(() => { location.hash = 'notes/guide'; }); await page.waitForTimeout(1500); screens++;
        const ghtml = require('child_process').execFileSync('node', [path.join(root, 'tools', 'hub-next', 'guide.mjs'), hub], { cwd: root, encoding: 'utf8' });
        const gs = await page.evaluate(html => {
          const prose = document.querySelector('.reading.guide .reading-prose.gd'); if (!prose) return null;
          const read = [];
          (function walk(n){ for (let c = n.firstChild; c; c = c.nextSibling) { if (c.nodeType === 3) read.push(c.data); else if (c.nodeType === 1 && !/^(SCRIPT|STYLE|SVG|BUTTON|TEMPLATE|NOSCRIPT)$/i.test(c.tagName) && !c.hasAttribute('data-sh-noread')) walk(c); } })(prose);
          const d = document.createElement('div'); d.innerHTML = html;
          const k = s => s.toLowerCase().replace(/[^0-9a-z]/g, ''), b = document.querySelector('.reading.guide #sh-tts-btn');
          return { secs: prose.querySelectorAll('.gd-lec').length, page: k(read.join(' ')), said: k(d.textContent), offers: b ? b.getAttribute('data-sh-tts-audio') === '1' : null, follow: !!document.querySelector('.reading.guide [data-follow]'), w: document.documentElement.scrollWidth - innerWidth };
        }, ghtml);
        const grec = (() => { try { return JSON.parse(fs.readFileSync(content(hub, 'notes.json'), 'utf8')).guideAudio === true; } catch (e) { return false; } })();
        if (!gs) problems.push(`${name} (${label}): notes/guide draws no study guide`);
        else {
          if (gs.secs !== nGuide) problems.push(`${name} (${label}): the study guide draws ${gs.secs} of its ${nGuide} lectures`);
          if (gs.page !== gs.said) { let i = 0; while (i < gs.page.length && gs.page[i] === gs.said[i]) i++; problems.push(`${name} (${label}): the study guide's page and its narration text differ (widget/guide.js vs tools/hub-next/guide.mjs) from "...${gs.page.slice(Math.max(0, i - 30), i + 30)}" vs "...${gs.said.slice(Math.max(0, i - 30), i + 30)}"`); }
          if (gs.offers !== grec) problems.push(`${name} (${label}): the study guide's Listen ${gs.offers ? 'offers' : 'does not offer'} its recording, but notes.json's guideAudio is ${grec}`);
          if (!gs.follow) problems.push(`${name} (${label}): the study guide has no Follow along toggle`);
          if (gs.w > 1) problems.push(`${name} (${label}): the study guide scrolls sideways by ${gs.w}px`);
        }
      }
      /* a lecture's one-page sheet (#notes/<lecture>/sheet, widget/sheet.js, idea board #5, 2026-11-22): the notes' toolbar
         offers it where the lecture has cram lines or topics; its printed copy holds each of them word for word; on the laptop
         every lecture's, and the one with the smallest type printed to a Letter PDF must be one page (the print rules hide the
         rest of the page, and fit()'s measure agrees with the printer); nothing scrolls sideways; leaving it takes the copy
         away. A sheet that needs two pages even at 7 pt is a note, not a failure (its cram sheet is long). */
      {
        const rd = f => { try { return JSON.parse(fs.readFileSync(content(hub, f), 'utf8')); } catch (e) { return {}; } };
        const cram = rd('study.json').cram || {}, topics = rd('core.json').likelyTopics || [];
        const sheets = (rd('core.json').lectures || []).map(l => l.id).filter(id => (cram[id] || []).length || topics.some(t => t.lec === id));
        const want = vp.isMobile ? sheets.slice(0, 1) : sheets, long = [];
        let small = null;
        if (sheets.length) {
          await page.evaluate(h => { location.hash = h; }, 'notes/' + sheets[0]); await page.waitForTimeout(600);
          if (!(await page.$(`.reading .toolbar a[href="#notes/${sheets[0]}/sheet"]`))) problems.push(`${name} (${label}): notes/${sheets[0]} has cram lines or topics but its toolbar offers no One-page sheet`);
        }
        for (const id of want) {
          await page.evaluate(h => { location.hash = h; }, 'notes/' + id + '/sheet');
          const ok = await page.waitForFunction(id => document.getElementById('sheet-' + id) && document.querySelector('body > .shp[data-fit][data-lec="' + id + '"]'), id, { timeout: 10000 }).then(() => true, () => false);
          if (!ok) { problems.push(`${name} (${label}): notes/${id}/sheet draws no sheet, or no printed copy`); continue; }
          await page.evaluate(() => document.fonts.ready); screens++;
          const s = await page.evaluate(() => { const p = document.querySelector('body > .shp'), q = p.querySelector('.shp-cram'); return { fit: p.dataset.fit, fs: +p.dataset.fs, cram: q ? [...q.querySelectorAll('li')].map(li => li.textContent) : [], on: document.documentElement.classList.contains('sh-sheet-on'), print: !!document.querySelector('.sheet [data-sheet="print"]'), w: document.documentElement.scrollWidth - innerWidth }; });
          const miss = (cram[id] || []).filter(b => !s.cram.includes(b));
          if (miss.length) problems.push(`${name} (${label}): ${id}'s printed sheet is missing ${miss.length} of its cram lines (first: "${miss[0].slice(0, 60)}")`);
          if (!s.on || !s.print) problems.push(`${name} (${label}): ${id}'s sheet has no Print button, or the page isn't marked for printing it`);
          if (s.w > 1) problems.push(`${name} (${label}): ${id}'s sheet scrolls sideways by ${s.w}px`);
          if (s.fit !== '1') long.push(id);
          else if (!small || s.fs < small.fs) small = { id, fs: s.fs };
        }
        if (long.length) notes.push(`${name} (${label}): ${long.length} sheet${long.length === 1 ? '' : 's'} print on two pages even at 7 pt (${long.slice(0, 5).join(', ')}): a long cram sheet`);
        if (small && !vp.isMobile && page.pdf) {
          await page.evaluate(h => { location.hash = h; }, 'notes/' + small.id + '/sheet');
          await page.waitForFunction(id => document.querySelector('body > .shp[data-fit][data-lec="' + id + '"]'), small.id, { timeout: 10000 }).catch(() => {});
          const pdf = await page.pdf({ format: 'Letter', preferCSSPageSize: true, printBackground: true }).catch(e => { problems.push(`${name} (${label}): couldn't print ${small.id}'s sheet: ${e.message}`); return null; });
          const pages = pdf ? (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length : 1;
          if (pages !== 1) problems.push(`${name} (${label}): ${small.id}'s sheet measures one page at ${small.fs} pt but printed on ${pages}`);
          else notes.push(`${name} (${label}): ${want.length} one-page sheets; the smallest type, ${small.id}'s at ${small.fs} pt, printed on one Letter page`);
        }
        if (sheets.length) {
          await page.evaluate(() => { location.hash = 'notes'; }); await page.waitForTimeout(400);
          if (await page.$('body > .shp') || await page.evaluate(() => document.documentElement.classList.contains('sh-sheet-on'))) problems.push(`${name} (${label}): leaving a sheet leaves its printed copy in the page, so printing the notes would print the sheet`);
        }
      }
      /* Ask Timmy (widget/ask.js): everyone has Timmy, so the Ask icon is in his corner only while he's turned off (Settings;
         put back after); the chat, then "Ask Timmy" on an answered question, which sends that question with the next
         message; no Ask icon during a mock */
      await page.evaluate(() => { location.hash = 'home'; }); await page.waitForTimeout(400);
      if (await page.$('.ska-fab:not([hidden])')) problems.push(`${name} (${label}): the Ask icon is in Timmy's corner while he's there`);
      await page.evaluate(() => { localStorage.setItem('sh_pref_pet', 'off'); document.dispatchEvent(new CustomEvent('sh:pref', { detail: { key: 'sh_pref_pet', val: 'off' } })); });
      /* Timmy isn't on an archived hub (widget/hub-timmy.js askArchived), so there is no Ask icon there at all (Occlusion, 2026-11-17) */
      const archived = (() => { try { const c = JSON.parse(fs.readFileSync(content(hub, 'core.json'), 'utf8')); let last = null;
        (c.exams || []).forEach(x => { const p = String(x.date || '').split('-').map(Number); if (p.length === 3 && p[0]) { const d = new Date(p[0], p[1] - 1, p[2], 22); if (!last || d > last) last = d; } });
        return !!(last && new Date() >= last); } catch (e) { return false; } })();
      if (!archived) await page.waitForSelector('.ska-fab:not([hidden])', { timeout: 15000 }).catch(() => {});
      else await page.waitForTimeout(1500);
      if (archived) { if (await page.$('.ska-fab:not([hidden])')) problems.push(`${name} (${label}): an archived hub shows the Ask icon`); }
      else if (!(await page.$('.ska-fab:not([hidden])'))) problems.push(`${name} (${label}): no Ask icon in Timmy's corner while he isn't there`);
      else {
        const lec0 = (() => { try { return JSON.parse(fs.readFileSync(content(hub, 'core.json'), 'utf8')).lectures[0].id; } catch (e) { return null; } })();
        const sent = await askCheck(page, `${name} (${label})`, { hubId: hub, hub, lec: lec0, open: () => page.click('.ska-fab') });
        await page.evaluate(() => { location.hash = 'questions'; }); await page.waitForTimeout(800);
        const ch = await page.$('#qlist .qcard:not(.is-answered) .ch'); if (ch) { await ch.click(); await page.waitForTimeout(500); }
        const ab = await page.$('#qlist .qcard.is-answered [data-ask-q]');
        if (!ab) problems.push(`${name} (${label}): an answered question has no Ask Timmy button`);
        else {
          const qid = await ab.evaluate(x => x.closest('.qcard').getAttribute('data-qid'));
          await ab.click(); await page.waitForSelector('.ska.is-on', { timeout: 5000 }).catch(() => {});
          const at = await page.evaluate(() => ({ on: !!document.querySelector('.ska-attach:not([hidden])'), text: (document.getElementById('skaIn') || {}).value || '' }));
          if (!at.on || !at.text) problems.push(`${name} (${label}): Ask Timmy on a question didn't attach it and start a question (${JSON.stringify(at)})`);
          const before = sent.length; await page.click('.ska-send'); await page.waitForTimeout(3500);
          const last = sent[sent.length - 1];
          if (sent.length === before || !last.ask || last.ask.qid !== qid) problems.push(`${name} (${label}): Ask Timmy didn't send question ${qid} with the message (${JSON.stringify(last && last.ask)})`);
          if (await page.$('.ska.is-on')) await page.click('[data-ska="close"]');
        }
        await page.evaluate(() => { location.hash = 'questions/mock'; }); await page.waitForTimeout(800);
        if (await page.evaluate(() => { const f = document.querySelector('.ska-fab'); return !!f && !f.hidden && getComputedStyle(f).display !== 'none'; })) problems.push(`${name} (${label}): the Ask icon shows during the mock exam`);
      }
      await page.evaluate(() => localStorage.removeItem('sh_pref_pet'));
      /* the 8-bit code's pixel face is the site's own file here, fetched only now (a live hub's comes from Google Fonts) */
      if (askedFonts.some(u => /vt323/.test(u))) problems.push(`${name} (${label}): the pixel face was fetched before anyone did the 8-bit code`);
      if (!vp.isMobile && hub === engineHubs[0]) {
        await page.evaluate(() => { location.hash = 'home'; }); await page.waitForTimeout(400);
        const e8 = await eightBit(page);
        if (!e8.on || e8.tag || !e8.face || !askedFonts.some(u => /assets\/fonts\/vt323\.woff2/.test(u)))
          problems.push(`${name} (${label}): the 8-bit code should take its pixel face from assets/fonts/vt323.woff2, declared in widget/hub.css (8-bit mode ${e8.on ? 'on' : 'did not start'}${e8.tag ? ', a <' + e8.tag.toLowerCase() + '> was added' : ''}${e8.face ? '' : ', the face did not load'})`);
      }
      if (outside.length) problems.push(`${name} (${label}): the page asked Google Fonts for ${[...new Set(outside)].join(', ')}; the redesign's one typeface is self-hosted`);
      /* the one stylesheet carries the dashboard's rules too (widget/dash.css): none of them may reach anything on a hub */
      for (const r of ['home', 'questions', 'more/stats', 'more']) {
        await page.evaluate(h => { location.hash = h; }, r); await page.waitForTimeout(500);
        const hit = await page.evaluate(async ([rules, sheet]) => {
          const css = await fetch(new URL('widget/dash.css?bundle-check', document.querySelector(`link[href*="${sheet}"]`).href.replace(/widget\/.*$/, ''))).then(x => x.text());
          const sh = new CSSStyleSheet(); sh.replaceSync(css); const out = [];
          (function walk(list){ for (const x of list) { if (x.selectorText) { try { if (document.querySelector(x.selectorText)) out.push(x.selectorText.slice(0, 70)); } catch (e) {} } else if (x.cssRules && !/keyframes/i.test(x.constructor.name)) walk(x.cssRules); } })(sh.cssRules);
          return out;
        }, [RULES, SHEET]);
        if (hit.length) { problems.push(`${name} (${label}): ${hit.length} rule(s) of widget/dash.css style something on this hub's ${r} (${hit.slice(0, 4).join(' | ')}): scope them to the dashboard (.dx)`); break; }
      }
      errs.forEach(e => problems.push(`${name} (${label}): JavaScript error: ${e}`));
      ownFiles(name, label, 'hub', askedFiles);
      notes.push(`${name} (${label}): clicked through ${screens} screens, ${n} questions`);
      await page.close();
    }
    /* the game layer on a redesigned hub (migration_v54, at the release; widget/v3.js data-game="v2"): the page asks for
       the v2 bootstrap, and with a rank past the Handpiece in it the pill names the journey and draws its object (the
       drawings load on first use), double XP shows as a chip, More's Stats has the road ahead, and the hand-off plays
       for a device that last saw the Handpiece: a dialog that Escape closes. The stub above answers every other call
       with [], so nothing is recorded; a page without the switch (every live hub) never makes the v2 call. */
    for (const hub of engineHubs.slice(0, 1)) {
      const page = await context.newPage(); const errs = [], name = `${hub}, game layer`; let asked = 0;
      page.on('pageerror', e => errs.push(e.message));
      await page.addInitScript(() => { try { localStorage.setItem('sh_rank_g', '20'); localStorage.setItem('sh_rank_tier', '6'); localStorage.setItem('sh_rank_step', '20'); } catch (e) {} });
      const rank = { xp: 190000, journey: 1, tier: 3, level: 2, step: 31, gtier: 10, step_at: 184523, next_at: 190475, tier_at: 178571, steps: 63, answers: 900, correct: 700, days: 40,
        badges: ['journey-0'], dark_seen: [0], boost: { mult: 2, until: new Date(Date.now() + 5 * 3600e3).toISOString(), src: 'medal' } };
      await page.route(/supabase\.co\/rest\/v1\/rpc\/get_widget_bootstrap_v2/, route => { asked++; return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ rank, mastery: [] }) }); });
      await page.goto(BASE() + `hubs/${hub}/index.html#more/stats`);
      const scene = await page.waitForSelector('.shj.shj-hand[role="dialog"]', { timeout: 15000 }).catch(() => null);
      if (!asked) problems.push(`${name} (${label}): the page never asked for get_widget_bootstrap_v2`);
      if (!scene) problems.push(`${name} (${label}): the hand-off to the ModuPro didn't play for a device that last saw the Handpiece`);
      else {
        const said = await page.evaluate(() => { const d = document.querySelector('.shj'); return { label: d.getAttribute('aria-label') || '', modal: d.getAttribute('aria-modal'), buttons: d.querySelectorAll('button').length }; });
        if (!/ModuPro/.test(said.label) || said.modal !== 'true' || said.buttons < 2) problems.push(`${name} (${label}): the hand-off should be a labeled modal dialog with Skip and its button (${JSON.stringify(said)})`);
        await page.keyboard.press('Escape'); await page.waitForTimeout(700);
        if (await page.$('.shj')) problems.push(`${name} (${label}): Escape didn't close the hand-off`);
      }
      await page.waitForTimeout(800);
      const g = await page.evaluate(() => { const p = document.querySelector('#hxRank'), x = document.querySelector('#hxXp');
        return { name: p ? (p.querySelector('b') || {}).textContent : '', art: p ? !!p.querySelector('svg[aria-label*="ModuPro"]') : false, chip: p ? !!p.querySelector('.xboost') : false, x2: x ? !!x.querySelector('.x2') : false,
          road: document.querySelectorAll('[data-road] .shj-road li, [data-sht-roadin] .shj-road li').length, w: document.documentElement.scrollWidth - innerWidth, g: localStorage.getItem('sh_rank_g'), tier: localStorage.getItem('sh_rank_tier') }; });
      if (g.name !== 'ModuPro Silver II') problems.push(`${name} (${label}): the rank pill reads "${g.name}", not the journey's rank`);
      if (!g.art) problems.push(`${name} (${label}): the rank pill didn't draw the ModuPro (widget/hub-art/journeys.js loads on first use)`);
      if (!g.chip || !g.x2) problems.push(`${name} (${label}): double XP isn't shown (the chip on the rank pill, the 2x on the phone's XP meter)`);
      if (g.road !== 3) problems.push(`${name} (${label}): More's Stats shows ${g.road} journeys on the road ahead, not 3`);
      if (g.w > 1) problems.push(`${name} (${label}): Stats with the road ahead scrolls sideways by ${g.w}px`);
      if (g.g !== '31' || g.tier !== '6') problems.push(`${name} (${label}): the device should remember step 31 of 63 and keep the Handpiece's own rank at Dark Matter (${g.g}, ${g.tier})`);
      errs.forEach(e => problems.push(`${name} (${label}): JavaScript error: ${e}`));
      notes.push(`${name} (${label}): the journeys' pill, boost, road and hand-off`);
      await page.close();
    }
    /* the game layer's wiring (session 8): the arcade's sessions and Timmy Time's minutes (wiringCheck, above), on a
       hub with Million-Dollar Smile, a podcast if one has it */
    if (!vp.isMobile && engineHubs.length) {
      const has = (h, f, re) => { try { return re.test(fs.readFileSync(content(h, f), 'utf8')); } catch (e) { return false; } };
      const smile = engineHubs.filter(h => has(h, 'arcade.js', /id:\s*'smile'/));
      const live = smile.filter(h => !has(h, 'core.json', /"audio":\s*"off"/));
      const wh = live.find(h => has(h, 'core.json', /"podcast":\s*\{/)) || live[0] || smile[0];
      if (wh) await wiringCheck(context, wh, label).catch(e => problems.push(`${wh}, the game layer's wiring (${label}): the check stopped: ${e.message.split('\n')[0]}`));
      /* visiting from a hub's arcade board (visitCheck, above): a live hub whose arcade has Smile and visit buttons */
      const vh = live.find(h => has(h, 'arcade.js', /data-sh-visit/));
      if (vh) await visitCheck(context, vh, label).catch(e => problems.push(`${vh}, visiting from the arcade board (${label}): the check stopped: ${e.message.split('\n')[0]}`));
      else notes.push(`visiting from a hub's arcade board (${label}): skipped, no live hub has an arcade with Smile`);
    }
    /* Timmy's place (phase 4, part C: widget/place.js, its kit widget/hub-art/place.js and one file per set). On the
       game layer, with a made-up shop in the bootstrap: More has the tile once Timmy is adopted, nothing of the place
       loads with the page, the card draws, the full view is a dialog, Timmy answers a tap, Customize puts a piece in
       the yard through equip_item (stubbed here; nothing is recorded), the bowling lane takes the side yard and the
       front corner, and Escape closes it. */
    for (const hub of engineHubs.slice(0, 1)) {
      const page = await context.newPage(); const errs = [], name = `${hub}, Timmy's place`, asked = [], calls = [];
      page.on('pageerror', e => errs.push(e.message));
      page.on('request', r => { if (/\/widget\/(place\.(js|css)|hub-art\/place)/.test(r.url())) asked.push(r.url().replace(/^.*\/widget\//, '')); });
      await page.addInitScript(() => { try { localStorage.setItem('sh_pet_born', '2026-10-01'); localStorage.setItem('sh_rank_g', '4'); localStorage.setItem('sh_rank_tier', '1'); localStorage.setItem('sh_rank_step', '4'); } catch (e) {} });
      const rank = { xp: 2400, journey: 0, tier: 1, level: 2, step: 4, gtier: 1, step_at: 2000, next_at: 3000, tier_at: 1500, steps: 63, answers: 300, correct: 220, days: 12, badges: [], dark_seen: [], boost: null };
      const equipped = { 'yard-left': 'garden' };
      const shop = () => ({ day: '2026-11-12', seasons: [], throwback: false, wallet: { balance: 0 }, items: [], costumes: [], snacks_today: 0, boost: null,
        /* all of Desert ranch (migration_v65's collection), for the Collections view below */
        inventory: ['garden', 'mailbox', 'bowling-lane', 'castle', 'cowboy-hat', 'floss-mummy', 'adobe-ranch', 'red-rocks', 'bandana', 'sheriff-vest', 'cactus-garden', 'windmill-pump', 'covered-wagon']
          .map(id => ({ id, at: '2026-11-01', how: 'bought' })).concat([{ id: 'rank-antique-outfit', at: '2026-11-02', how: 'rank' }]),
        locked: [{ id: 'rank-bronze-outfit', name: 'Bronze outfit', kind: 'outfit', rarity: 'rare', rank_tier: 2 }, { id: 'rank-modu-gold-outfit', name: 'Gold crown and velvet cape', kind: 'outfit', rarity: 'legendary', rank_tier: 11 }], equipped: Object.assign({}, equipped) });
      await page.route(/supabase\.co\/rest\/v1\/rpc\/get_widget_bootstrap_v2/, route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ rank, mastery: [], shop: shop() }) }));
      await page.route(/supabase\.co\/rest\/v1\/rpc\/get_my_shop/, route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(shop()) }));
      await page.route(/supabase\.co\/rest\/v1\/rpc\/equip_item/, route => {
        let a = {}; try { a = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
        calls.push(a.p_slot + '=' + a.p_item);
        if (a.p_item === 'bowling-lane') { delete equipped['yard-corner']; equipped['yard-side'] = a.p_item; }
        else if (a.p_item) { Object.keys(equipped).forEach(k => { if (equipped[k] === a.p_item && /^yard-/.test(k)) delete equipped[k]; }); equipped[a.p_slot] = a.p_item; }
        else delete equipped[a.p_slot];
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, equipped }) });
      });
      /* Collections (migration_v75): Desert ranch is finished and its bonus not taken yet; claiming it pays (stubbed) */
      const desert = paid => ({ k: 'desert', kind: 'collection', n: 8, have: 8, done: true, pays: true, paid });
      let claimed = 0;
      await page.route(/supabase\.co\/rest\/v1\/rpc\/get_my_collections/, route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, pays: 1000, collections: [desert(claimed > 0)] }) }));
      await page.route(/supabase\.co\/rest\/v1\/rpc\/claim_collections_v2/, route => { claimed++;
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, src: 'collection', xp: claimed > 1 ? 0 : 1000, won: claimed > 1 ? [] : ['desert'], crowns: 1000, pays: 1000, collections: [desert(true)] }) }); });
      await page.goto(BASE() + `hubs/${hub}/index.html#more`); await page.waitForTimeout(2500);
      if (!(await page.$('a[href="#more/place"], [data-more="place"]')) && !(await page.evaluate(() => [...document.querySelectorAll('.menu .rows a, .menu .rows button')].some(x => /Timmy’s place/.test(x.textContent))))) problems.push(`${name} (${label}): More has no "Timmy's place" tile for an adopted Timmy`);
      if (asked.length) problems.push(`${name} (${label}): the place's files loaded with the page, before it was opened (${asked.join(', ')}): they load on first use`);
      await page.evaluate(() => { location.hash = 'more/place'; });
      const card = await page.waitForSelector('.place-card .tpc.is-live', { timeout: 20000 }).catch(() => null);
      if (!card) problems.push(`${name} (${label}): More > Timmy's place didn't draw the place`);
      else {
        if (!asked.includes('place.js') || !asked.includes('hub-art/place.js')) problems.push(`${name} (${label}): the place drew without its renderer and kit (${asked.join(', ')})`);
        const c = await page.evaluate(() => { const b = document.querySelector('.place-card .tpc'), i = b.querySelector('img'); return { label: b.getAttribute('aria-label') || ((i && i.alt) || '') + ' ' + b.textContent, img: !!i && i.naturalWidth > 0, w: document.documentElement.scrollWidth - innerWidth, still: (localStorage.getItem('sh_place_still') || '').slice(0, 4) }; });
        if (!/Timmy’s place/.test(c.label) || !/garden/i.test(c.label) || !c.img) problems.push(`${name} (${label}): the place's card should be a labeled button with its picture (${JSON.stringify(c)})`);
        if (c.w > 1) problems.push(`${name} (${label}): Timmy's place scrolls sideways by ${c.w}px`);
        if (c.still !== '<svg') problems.push(`${name} (${label}): the place didn't keep a still on the device for the dashboard's card`);
        await card.click();
        const dlg = await page.waitForSelector('dialog.tpv[open]', { timeout: 8000 }).catch(() => null);
        if (!dlg) problems.push(`${name} (${label}): tapping the place's card didn't open the full view`);
        else {
          await page.waitForTimeout(900);
          const v = await page.evaluate(() => { const d = document.querySelector('dialog.tpv'), st = d.querySelector('.tpv-stage'), sr = st && st.shadowRoot, t = sr && sr.querySelector('.tp-timmy');
            return { label: d.getAttribute('aria-label') || (document.getElementById(d.getAttribute('aria-labelledby')) || {}).textContent || '', timmy: !!t, tlabel: t ? t.getAttribute('aria-label') : '', statue: !!(sr && sr.querySelector('[data-egg="statue"]')),
              w: d.scrollWidth - d.clientWidth, seg: !d.querySelector('.tpv-seg').hidden, state: window.shPlace.state() }; });
          if (!/Timmy’s place/.test(v.label)) problems.push(`${name} (${label}): the place's full view has no name (${v.label})`);
          if (!v.timmy || !/HP/.test(v.tlabel || '')) problems.push(`${name} (${label}): Timmy isn't at his place as a labeled button with his HP (${v.tlabel})`);
          if (!v.statue) problems.push(`${name} (${label}): the rank statue isn't in the place`);
          if (v.w > 1) problems.push(`${name} (${label}): the place's full view scrolls sideways by ${v.w}px`);
          if (!v.state.game || !v.seg) problems.push(`${name} (${label}): with a shop in the bootstrap the place should offer Customize (${JSON.stringify(v.state)})`);
          await page.click('dialog.tpv .tp-timmy', { force: true }); await page.waitForTimeout(500);
          const said = await page.evaluate(() => { const b = document.querySelector('dialog.tpv .tpv-stage').shadowRoot.querySelector('.tp-bubble'); return b ? b.textContent : ''; });
          if (!said) problems.push(`${name} (${label}): Timmy said nothing when tapped at his place`);
          await page.click('dialog.tpv [data-tp="customize"]'); await page.waitForSelector('dialog.tpv .tpv-tile[data-pick="front"]', { timeout: 8000 }).catch(() => null);
          const front = await page.$('dialog.tpv .tpv-tile[data-pick="front"]');
          if (!front) problems.push(`${name} (${label}): Customize didn't show the yard's spots`);
          else {
            await front.click(); await page.waitForTimeout(400);
            const cards = await page.$$eval('dialog.tpv .tpv-card[data-item]', els => els.map(e => e.dataset.item));
            if (!cards.includes('mailbox') || cards.includes('campfire')) problems.push(`${name} (${label}): the customizer should offer what's owned and nothing else (${cards.join(', ')})`);
            const mb = await page.$('dialog.tpv .tpv-card[data-item="mailbox"]'); if (mb) await mb.click();
            await page.waitForTimeout(900);
            await page.click('dialog.tpv .tpv-tile[data-pick="side"]'); await page.waitForTimeout(400);
            const lane = await page.$('dialog.tpv .tpv-card[data-item="bowling-lane"]'); if (lane) await lane.click();
            await page.waitForTimeout(1200);
            const after = await page.evaluate(() => ({ eq: window.shPlace.state().equipped, corner: !!document.querySelector('dialog.tpv .tpv-tile[data-pick="corner"]'),
              locked: (() => { return document.querySelectorAll('dialog.tpv .tpv-card.is-locked').length; })(), w: (() => { const d = document.querySelector('dialog.tpv'); return d.scrollWidth - d.clientWidth; })() }));
            if (calls.join() !== 'yard-front=mailbox,yard-side=bowling-lane') problems.push(`${name} (${label}): the customizer should save each change through equip_item (${calls.join(', ') || 'no calls'})`);
            if (after.eq['yard-front'] !== 'mailbox' || after.eq['yard-side'] !== 'bowling-lane' || after.eq['yard-left'] !== 'garden') problems.push(`${name} (${label}): after two changes the place has ${JSON.stringify(after.eq)}`);
            if (after.corner) problems.push(`${name} (${label}): with the bowling lane in the side yard, the front corner should not be offered`);
            if (after.w > 1) problems.push(`${name} (${label}): Customize scrolls sideways by ${after.w}px`);
            await page.click('dialog.tpv .tpv-tile[data-pick="timmy"]'); await page.waitForTimeout(400);
            /* a year-round collection's piece (the desert's cowboy hat, migration_v65) is under its own tab, Collections,
               headed by its collection, and its drawings (hub-art/place/desert.js) are fetched only because it's owned */
            const co = await page.$('dialog.tpv [data-src="coll"]'); if (co) { await co.click(); await page.waitForTimeout(600); }
            const coll = await page.evaluate(() => ({ cards: [...document.querySelectorAll('dialog.tpv .tpv-card[data-item]')].map(e => e.dataset.item), head: [...document.querySelectorAll('dialog.tpv .tpv-seth')].map(e => e.textContent),
              tabs: (() => { const t = document.querySelector('dialog.tpv .tpv-tabs'); return t ? Math.round(t.getBoundingClientRect().right - t.parentElement.getBoundingClientRect().right) : 0; })(), w: (() => { const d = document.querySelector('dialog.tpv'); return d.scrollWidth - d.clientWidth; })() }));
            if (!co || !coll.cards.includes('cowboy-hat') || coll.head.join() !== 'Desert ranch') problems.push(`${name} (${label}): an owned collection piece should be under Collections, headed by its collection (${JSON.stringify(coll)})`);
            /* four tabs now (Classics, Collections, Seasonal, Rank): they fit the panel on a phone */
            if (coll.tabs > 1 || coll.w > 1) problems.push(`${name} (${label}): the outfit tabs run ${coll.tabs}px past their panel (the view scrolls sideways by ${coll.w}px)`);
            if (!asked.includes('hub-art/place/desert.js') || asked.some(u => /hub-art\/place\/(dino|moonbase|reef|arcade|rockshow)\.js/.test(u))) problems.push(`${name} (${label}): only the owned collection's drawings should load (${asked.join(', ')})`);
            const rk = await page.$('dialog.tpv [data-src="rank"]'); if (rk) { await rk.click(); await page.waitForTimeout(300); }
            const lk = await page.evaluate(() => { const l = document.querySelector('dialog.tpv .tpv-card.is-locked'); return l ? l.textContent : ''; });
            if (!/Reach Bronze/.test(lk)) problems.push(`${name} (${label}): a rank outfit not reached yet should show locked, with the rank that gives it (${lk})`);
            /* a later journey's piece (migration_v91) names its journey: "Reach ModuPro Gold" */
            const lk2 = await page.evaluate(() => [...document.querySelectorAll('dialog.tpv .tpv-card.is-locked')].map(l => l.textContent).join(' | '));
            if (!/Reach ModuPro Gold/.test(lk2)) problems.push(`${name} (${label}): a ModuPro rank outfit not reached yet should show locked with "Reach ModuPro Gold" (${lk2})`);
            const names = await page.$$eval('dialog.tpv button, dialog.tpv [role="button"]', bs => bs.filter(b => !(b.getAttribute('aria-label') || b.textContent || '').trim()).length);
            if (names) problems.push(`${name} (${label}): ${names} button(s) in the place's full view have no name`);
          }
          await page.keyboard.press('Escape'); await page.waitForTimeout(500);
          if (await page.$('dialog.tpv[open]')) problems.push(`${name} (${label}): Escape didn't close the place's full view`);
          /* Collections (migration_v75): More's "Your collections" opens the place on every season's set, year-round
             collection and the rare costumes, with what's owned of each; only the drawings of the cards near the screen
             are fetched; a finished collection offers its bonus and claiming it says it's paid; Escape closes it all */
          const cb = await page.$('[data-place-coll]');
          if (!cb) problems.push(`${name} (${label}): More's Timmy's place has no "Your collections" button`);
          else {
            const packsBefore = asked.filter(u => /hub-art\/place\//.test(u)).length;
            await cb.click();
            const co = await page.waitForSelector('dialog.tpv .tpv-over:not([hidden]) .tco', { timeout: 10000 }).catch(() => null);
            if (!co) problems.push(`${name} (${label}): "Your collections" didn't open the collections`);
            else {
              await page.waitForTimeout(1200);
              const cv = await page.evaluate(() => { const ov = document.querySelector('dialog.tpv .tpv-over'), box = ov.querySelector('.tpv-overin'), d = ov.querySelector('.tco[data-k="desert"]');
                return { n: ov.querySelectorAll('.tco').length, kinds: [...ov.querySelectorAll('.tco-gh')].map(h => h.textContent.replace(/\s*\d+ of \d+$/, '')),
                  desert: d ? d.querySelector('.tco-prog').textContent : '', own: d ? d.querySelectorAll('.tco-p.is-own').length : 0, claim: !!(d && d.querySelector('[data-tp="coll-claim"]')),
                  art: !!(d && d.querySelector('.tco-pic img')), w: box.scrollWidth - box.clientWidth, x: (document.querySelector('[data-tp="over-close"]') || {}).getAttribute && document.querySelector('[data-tp="over-close"]').getAttribute('aria-label'),
                  names: [...ov.querySelectorAll('button')].filter(b => !(b.getAttribute('aria-label') || b.textContent || '').trim()).length }; });
              if (cv.n !== 21 || cv.kinds.join('|') !== 'Holidays and seasons|Year-round collections|Rare costumes') problems.push(`${name} (${label}): Collections should list 21 (14 sets, 6 year-round, the costumes) under three headings (${JSON.stringify(cv)})`);
              if (!/8 of 8/.test(cv.desert) || cv.own !== 8 || !cv.claim) problems.push(`${name} (${label}): a finished collection should show 8 of 8 and offer its bonus (${JSON.stringify(cv)})`);
              if (cv.w > 1) problems.push(`${name} (${label}): Collections scrolls sideways by ${cv.w}px`);
              if (cv.names) problems.push(`${name} (${label}): ${cv.names} button(s) in Collections have no name`);
              const packs = asked.filter(u => /hub-art\/place\//.test(u));
              if (packs.length >= 20 || packs.some(u => /hub-art\/place\/(summer|july4|spring)\.js/.test(u))) problems.push(`${name} (${label}): Collections fetched the drawings of cards far off the screen (${packs.slice(packsBefore).join(', ')})`);
              /* claiming: a test browser asks nothing, so this one says it isn't one (every call is answered here) */
              await page.evaluate(() => { try { Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false, configurable: true }); } catch (e) {} });
              await page.click('dialog.tpv .tco[data-k="desert"] [data-tp="coll-claim"]'); await page.waitForTimeout(900);
              const cl = await page.evaluate(() => ({ st: (document.querySelector('dialog.tpv .tco[data-k="desert"] .tco-foot') || {}).textContent || '', s: window.shPlace.state() }));
              if (claimed !== 1 || !/Desert ranch finished!/.test(cl.st) || cl.s.collPaid !== 1) problems.push(`${name} (${label}): claiming the bonus should pay once and say so (${claimed} calls, ${JSON.stringify(cl)})`);
              await page.keyboard.press('Escape'); await page.waitForTimeout(500);
              if (await page.$('dialog.tpv[open]')) problems.push(`${name} (${label}): Escape didn't close Collections (opened on its own, it closes the place too)`);
            }
          }
        }
      }
      errs.forEach(e => problems.push(`${name} (${label}): JavaScript error: ${e}`));
      notes.push(`${name} (${label}): Timmy's place, its full view, the customizer and Collections (a bonus claimed)`);
      await page.close();
    }
    /* The bowling egg (phase 4, part D: widget/bowling.js and its drawings widget/hub-art/bowling.js, both fetched on first
       use). In a new hub's bank with the run at 49 (sh_bowl_run): neither file loads with the page; one first-try right
       answer shows a strike clip after the verdict, in a card docked at the bottom that is named, takes no focus and goes
       at a tap; a retry changes nothing; a wrong first try puts the run at 0; 150 plays the turkey and starts the run
       again; Escape closes a clip; nothing plays (or counts) in the mock, with the eggs off or in Focus mode; reduced
       motion shows the clip's still and its word. At Timmy's place a tap on the bowling lane plays a clip inside the full
       view, and with the eggs off the lane keeps its own surprise. A live hub has no counter and fetches neither file. */
    for (const hub of engineHubs.slice(0, 1)) {
      const BOWL_KEYS = ['panic', 'conga', 'floss', 'rocket', 'sweep', 'neighbor', 'turkey', 'spare'];
      const fresh = async (opts) => {
        const page = await context.newPage(), errs = [], asked = [];
        page.on('pageerror', e => errs.push(e.message));
        page.on('request', r => { if (/\/widget\/(bowling\.js|hub-art\/bowling\.js)/.test(r.url())) asked.push(r.url().replace(/^.*\/widget\//, '')); });
        if (opts && opts.reduced) await page.emulateMedia({ reducedMotion: 'reduce' });
        return { page, errs, asked };
      };
      const clean = p => p.evaluate(() => ['sh_bowl_run', 'sh_bowl_today', 'sh_bowl_seen', 'sh_bowl_trophy', 'sh_pref_eggs', 'sh_pref_focus'].forEach(k => localStorage.removeItem(k)));
      /* a question card from the bank's own code (shHub.card), answered right or wrong as a student would tap it */
      const answer = (p, right, again) => p.evaluate(async ([right, again]) => {
        const B = window.__bw || (window.__bw = { qs: (await (await fetch('content/questions.json')).json()).filter(q => q.type === 'mcq' && !q.fig && !q.pcase && !q.img), i: 0, last: null });
        const q = again ? B.last : (B.last = B.qs[B.i++]);
        const host = document.querySelector('.qcard') ? document.querySelector('.qcard').parentNode : document.querySelector('.hx-view:not([hidden])');
        const el = window.shHub.card(q.id); host.insertBefore(el, host.firstChild); el.scrollIntoView({ block: 'start' });
        const sc = el.querySelector('[data-showch]'); if (sc && sc.offsetParent) sc.click();
        window.__bwAt = performance.now(); window.__bwShown = 0;
        if (!window.__bwObs) { window.__bwObs = new MutationObserver(() => { if (!window.__bwShown && document.querySelector('.shb')) window.__bwShown = performance.now(); }); window.__bwObs.observe(document.body, { childList: true }); }
        el.querySelector('.ch[data-i="' + (right ? q.answer : (q.answer + 1) % q.choices.length) + '"]').click();
        return { id: q.id, verdict: !!el.querySelector('.qc-result .verdict'), run: localStorage.getItem('sh_bowl_run') };
      }, [right, !!again]);
      const run = p => p.evaluate(() => localStorage.getItem('sh_bowl_run'));
      const card = p => p.evaluate(() => { const c = document.querySelector('.shb'); if (!c) return null; const r = c.getBoundingClientRect(), w = c.querySelector('.shb-word'), x = c.querySelector('.shb-x'), i = c.querySelector('img');
        return { clip: c.dataset.clip, still: c.classList.contains('is-still'), label: c.getAttribute('aria-label') || '', top: r.top, bottom: r.bottom, h: innerHeight, focus: c.contains(document.activeElement),
          word: w ? w.textContent : '', wordAnim: w ? getComputedStyle(w).animationName : '', alt: i ? i.alt : '', x: x ? x.getAttribute('data-bowl') + '|' + (x.getAttribute('aria-label') || '') : '',
          after: window.__bwShown ? Math.round(window.__bwShown - window.__bwAt) : -1, seen: localStorage.getItem('sh_bowl_seen') || '' }; });
      const name = `${hub}, the bowling egg`;
      { /* the bank */
        const { page, errs, asked } = await fresh();
        await page.goto(BASE() + `hubs/${hub}/index.html#questions`);
        await page.waitForSelector('.qcard', { timeout: 20000 }).catch(() => null); await page.waitForTimeout(800);
        await clean(page);
        if (asked.length) problems.push(`${name} (${label}): the bowling egg's files loaded with the page (${asked.join(', ')}): they load at the first strike`);
        await page.evaluate(() => localStorage.setItem('sh_bowl_run', '49'));
        const a = await answer(page, true);
        await page.waitForSelector('.shb', { timeout: 8000 }).catch(() => null); await page.waitForTimeout(300);
        const c = await card(page);
        if (!c) problems.push(`${name} (${label}): the 50th first-try right answer in a row showed no clip (run ${await run(page)})`);
        else {
          if (!a.verdict || c.after < 800) problems.push(`${name} (${label}): the clip should come after the answer's verdict (verdict ${a.verdict}, ${c.after} ms after the tap)`);
          if (!['panic', 'conga', 'floss', 'rocket', 'sweep', 'neighbor'].includes(c.clip)) problems.push(`${name} (${label}): a strike played "${c.clip}", not one of the six strike clips`);
          if (!/^Bowling clip: /.test(c.label) || c.x !== 'close|Close the bowling clip') problems.push(`${name} (${label}): the clip card should be named and have a named close button with data-bowl (${c.label}, ${c.x})`);
          if (c.focus) problems.push(`${name} (${label}): the clip card took the focus`);
          if (!(c.bottom <= c.h && c.top > c.h / 3)) problems.push(`${name} (${label}): the clip card should be docked at the bottom of the screen (${Math.round(c.top)}-${Math.round(c.bottom)} of ${c.h})`);
          if (!c.seen.includes(c.clip)) problems.push(`${name} (${label}): the sighting wasn't kept on the device (${c.seen})`);
          if (!asked.includes('bowling.js') || !asked.includes('hub-art/bowling.js')) problems.push(`${name} (${label}): the clip played without its two files (${asked.join(', ')})`);
          if (await run(page) !== '50') problems.push(`${name} (${label}): the run should be 50 after the strike (${await run(page)})`);
          await page.click('.shb .shb-screen'); await page.waitForTimeout(600);
          if (await page.$('.shb')) problems.push(`${name} (${label}): a tap didn't remove the clip`);
        }
        await answer(page, false, true); await page.waitForTimeout(300);
        if (await run(page) !== '50') problems.push(`${name} (${label}): a second try at a question changed the run (${await run(page)}, not 50)`);
        await answer(page, false); await page.waitForTimeout(300);
        if (await run(page) !== '0') problems.push(`${name} (${label}): a wrong first try should put the run at 0 (${await run(page)})`);
        await page.evaluate(() => localStorage.setItem('sh_bowl_run', '149'));
        await answer(page, true);
        await page.waitForSelector('.shb', { timeout: 8000 }).catch(() => null);
        const t = await card(page);
        if (!t || t.clip !== 'turkey' || t.word !== 'Turkey!') problems.push(`${name} (${label}): 150 in a row should play the turkey (${t ? t.clip + ', ' + t.word : 'no clip'})`);
        if (await run(page) !== '0') problems.push(`${name} (${label}): after the turkey the run starts again at 0 (${await run(page)})`);
        if (t) { await page.keyboard.press('Escape'); await page.waitForTimeout(600); if (await page.$('.shb')) problems.push(`${name} (${label}): Escape didn't close the clip`); }
        for (const [k, v, what] of [['sh_pref_eggs', 'off', 'the eggs off'], ['sh_pref_focus', 'on', 'Focus mode']]) {
          await page.evaluate(([k, v]) => { localStorage.setItem('sh_bowl_run', '49'); localStorage.setItem(k, v); }, [k, v]);
          await answer(page, true); await page.waitForTimeout(2200);
          if (await page.$('.shb') || await run(page) !== '49') problems.push(`${name} (${label}): with ${what} a strike played or the run moved (${await run(page)})`);
          await page.evaluate(k => localStorage.removeItem(k), k);
        }
        /* the mock: its answers are recorded with ctx "mock" at submit, and neither count nor play */
        await page.evaluate(() => { localStorage.setItem('sh_bowl_run', '49'); location.hash = 'questions/mock'; }); await page.waitForTimeout(900);
        const start = await page.$('[data-mockstart]'); if (start) { await start.click(); await page.waitForTimeout(900); }
        await page.evaluate(() => { [...document.querySelectorAll('.qcard[data-ctx="mock"]')].slice(0, 5).forEach(c => { const b = c.querySelector('[data-mock-pick]'); if (b) b.click(); }); });
        for (let i = 0; i < 2; i++) { const s = await page.$('[data-submit]'); if (s) { await s.click(); await page.waitForTimeout(400); } }
        await page.waitForTimeout(1800);
        if (await page.$('.shb') || await run(page) !== '49') problems.push(`${name} (${label}): the mock counted toward the run or played a clip (${await run(page)})`);
        for (let i = 0; i < 4 && await page.$('.sh-mk'); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(450); } /* the mock's results card */
        const nm = await page.$('[data-newmock]'); if (nm) await nm.click({ timeout: 5000 }).catch(() => null);
        await clean(page);
        errs.forEach(e => problems.push(`${name} (${label}): JavaScript error: ${e}`));
        await page.close();
      }
      if (!vp.isMobile) { /* reduced motion: the still and its word */
        const { page, errs } = await fresh({ reduced: true });
        await page.goto(BASE() + `hubs/${hub}/index.html#questions`);
        await page.waitForSelector('.qcard', { timeout: 20000 }).catch(() => null); await page.waitForTimeout(800);
        await clean(page); await page.evaluate(() => localStorage.setItem('sh_bowl_run', '49'));
        await answer(page, true);
        await page.waitForSelector('.shb', { timeout: 8000 }).catch(() => null);
        const c = await card(page);
        if (!c || !c.still || c.word !== 'Strike!' || c.wordAnim !== 'none' || !/\(the last frame\)$/.test(c.alt)) problems.push(`${name} (${label}, reduced motion): the clip should be its still with "Strike!" (${JSON.stringify(c && { still: c.still, word: c.word, anim: c.wordAnim, alt: c.alt.slice(-20) })})`);
        await clean(page);
        errs.forEach(e => problems.push(`${name} (${label}, reduced motion): JavaScript error: ${e}`));
        await page.close();
      }
      if (!vp.isMobile) { /* Timmy's place: the bowling lane */
        const { page, errs, asked } = await fresh();
        await page.addInitScript(() => { try { localStorage.setItem('sh_pet_born', '2026-10-01'); localStorage.setItem('sh_rank_g', '4'); localStorage.setItem('sh_rank_tier', '1'); localStorage.setItem('sh_rank_step', '4'); } catch (e) {} });
        const rank = { xp: 2400, journey: 0, tier: 1, level: 2, step: 4, gtier: 1, step_at: 2000, next_at: 3000, tier_at: 1500, steps: 63, answers: 300, correct: 220, days: 12, badges: [], dark_seen: [], boost: null };
        const shop = () => ({ day: '2026-11-12', seasons: [], throwback: false, wallet: { balance: 0 }, items: [], costumes: [], snacks_today: 0, boost: null,
          inventory: [{ id: 'bowling-lane', at: '2026-11-01', how: 'bought' }], locked: [], equipped: { 'yard-side': 'bowling-lane' } });
        await page.route(/supabase\.co\/rest\/v1\/rpc\/get_widget_bootstrap_v2/, route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ rank, mastery: [], shop: shop() }) }));
        await page.route(/supabase\.co\/rest\/v1\/rpc\/get_my_shop/, route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(shop()) }));
        await page.goto(BASE() + `hubs/${hub}/index.html#more/place`);
        const pc = await page.waitForSelector('.place-card .tpc.is-live', { timeout: 20000 }).catch(() => null);
        await clean(page);
        if (!pc) problems.push(`${name} (${label}): Timmy's place didn't draw, so the lane wasn't checked`);
        else {
          for (let i = 0; i < 4 && await page.$('.sh-ru.is-on, .shj.is-on'); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(700); } /* a rank-up card, if one shows */
          await pc.click({ timeout: 10000 }).catch(() => null); await page.waitForSelector('dialog.tpv[open]', { timeout: 8000 }).catch(() => null); await page.waitForTimeout(1200);
          if (!(await page.$('dialog.tpv[open]'))) problems.push(`${name} (${label}): the place's full view didn't open, so the lane wasn't checked`);
          const tap = () => page.evaluate(() => { const st = document.querySelector('dialog.tpv .tpv-stage'), sr = st && st.shadowRoot, n = sr && sr.querySelector('[data-egg="lane"]'); if (!n) return false; n.dispatchEvent(new MouseEvent('click', { bubbles: true })); return true; });
          if (asked.length) problems.push(`${name} (${label}): the bowling egg's files loaded with the place (${asked.join(', ')})`);
          if (!(await tap())) problems.push(`${name} (${label}): the place has no bowling lane to tap`);
          else {
            const lc = await page.waitForSelector('dialog.tpv .shb.shb-in-host', { timeout: 8000 }).catch(() => null);
            const k = lc ? await lc.getAttribute('data-clip') : '';
            if (!BOWL_KEYS.includes(k)) problems.push(`${name} (${label}): a tap on the lane should play a clip inside the place (${k || 'none'})`);
            if (lc) { await page.keyboard.press('Escape'); await page.waitForTimeout(500);
              if (await page.$('dialog.tpv .shb')) problems.push(`${name} (${label}): Escape didn't close the lane's clip`);
              if (!(await page.$('dialog.tpv[open]'))) problems.push(`${name} (${label}): Escape on the lane's clip closed the whole place too`); }
            await page.evaluate(() => localStorage.setItem('sh_pref_eggs', 'off'));
            await tap(); await page.waitForTimeout(900);
            const said = await page.evaluate(() => { const b = document.querySelector('dialog.tpv .tpv-stage').shadowRoot.querySelector('.tp-bubble'); return { clip: !!document.querySelector('dialog.tpv .shb'), text: b ? b.textContent : '' }; });
            if (said.clip || !/Strike! Well, close\./.test(said.text)) problems.push(`${name} (${label}): with the eggs off the lane should keep its own surprise (${JSON.stringify(said)})`);
          }
          await page.keyboard.press('Escape');
        }
        await clean(page);
        errs.forEach(e => problems.push(`${name} (${label}, the lane): JavaScript error: ${e}`));
        await page.close();
      }
      notes.push(`${name} (${label}): the run, a strike, a retry, a miss, the turkey, the mock, eggs off, Focus mode${vp.isMobile ? '' : ', reduced motion and the lane'}`);
    }
    /* Timmy's shop (phase 4, part B: widget/shop.js, its art widget/hub-art/shop.js and the place's kit). On the game
       layer, with a made-up shop in the bootstrap and buy_item stubbed here (nothing is recorded): More has the Shop
       tile, nothing of the shop loads with the page, the shelves draw, a purchase lowers the balance and the piece shows
       as Yours and in the customizer, a double tap sends one request id, a dropped connection charges nothing and the
       retry sends the same id, a refusal says why and changes nothing, a snack can't be bought while Timmy is at 100 HP
       (the bootstrap's pet_days carry the snack's hp, read by widget/pet.js), every button names its click by data-shop
       alone, and an item's name is never drawn as markup. */
    for (const hub of engineHubs.slice(0, 1)) {
      const page = await context.newPage(); const errs = [], name = `${hub}, Timmy's shop`, asked = [], buys = [];
      page.on('pageerror', e => errs.push(e.message));
      page.on('request', r => { if (/\/widget\/(shop\.(js|css)|hub-art\/shop\.js)/.test(r.url())) asked.push(r.url().replace(/^.*\/widget\//, '')); });
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date());
      /* Timmy's own tally of today's answers (sh_pet_log) is left by the click-throughs above, where he's on the page for
         everyone: start without it, so his health is the snack's 100 and nothing else */
      await page.addInitScript(() => { try { localStorage.removeItem('sh_pet_log'); localStorage.setItem('sh_pet_born', '2026-10-01'); localStorage.setItem('sh_rank_g', '4'); localStorage.setItem('sh_rank_tier', '1'); localStorage.setItem('sh_rank_step', '4'); } catch (e) {} });
      const rank = { xp: 2400, journey: 0, tier: 1, level: 2, step: 4, gtier: 1, step_at: 2000, next_at: 3000, tier_at: 1500, steps: 63, answers: 300, correct: 220, days: 12, badges: [], dark_seen: [], boost: null };
      const wallet = { earned: 300, spent: 0, balance: 300, from_xp: 230, trophies: 50, medals: 0, rankups: 20 }, inv = [], seen = new Map();
      let refuse = '', drop = false;
      const item = (id, nm, kind, rarity, price, shelf, x) => Object.assign({ id, name: nm, kind, rarity, price, season: null, slot: null, hp: null, boost_minutes: null, boost_mult: null, shelf, gift: false, owned: false }, x || {});
      const CAT = [item('sandcastle', 'Sand<img src=x onerror="window.__shopx=1">castle', 'yard', 'common', 150, 'daily'), item('igloo', 'Igloo', 'yard', 'epic', 2200, 'daily'),
        item('bow-tie', 'Bow tie', 'outfit', 'common', 120, 'weekly'), item('apple', 'Apple', 'snack', 'common', 100, 'always', { hp: 10 }),
        item('boost-1h', 'Double XP for 1 hour', 'boost', 'rare', 600, 'always', { boost_minutes: 60, boost_mult: 2 })];
      const shop = () => ({ day: today, seasons: [], throwback: false, wallet: Object.assign({}, wallet), items: CAT.map(x => Object.assign({}, x, { owned: inv.some(i => i.id === x.id) })),
        inventory: inv.slice(), locked: [], equipped: {}, costumes: [], snacks_today: [], boost: null });
      const fed = [{ d: today, attempts: 0, correct: 0, hp: 100 }];
      const json = (route, body) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
      await page.route(/supabase\.co\/rest\/v1\/rpc\/get_widget_bootstrap_v2/, route => json(route, { rank, mastery: [], shop: shop(), pet_days: fed }));
      await page.route(/supabase\.co\/rest\/v1\/rpc\/get_my_shop/, route => json(route, shop()));
      await page.route(/supabase\.co\/rest\/v1\/rpc\/get_pet_days_v2/, route => json(route, fed));
      await page.route(/supabase\.co\/rest\/v1\/rpc\/buy_item/, route => {
        let a = {}; try { a = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
        buys.push(a.p_request + ' ' + a.p_item);
        if (drop) { drop = false; return route.abort(); }
        if (seen.has(a.p_request)) return json(route, Object.assign({}, seen.get(a.p_request), { repeat: true }));
        const it = CAT.find(x => x.id === a.p_item);
        if (refuse) return json(route, { ok: false, error: refuse });
        if (!it) return json(route, { ok: false, error: 'unknown' });
        if (inv.some(i => i.id === it.id)) return json(route, { ok: false, error: 'owned' });
        if (wallet.balance < it.price) return json(route, { ok: false, error: 'balance', balance: wallet.balance, price: it.price });
        wallet.balance -= it.price; wallet.spent += it.price; inv.push({ id: it.id, at: new Date().toISOString(), how: 'bought' });
        const res = { ok: true, item: it.id, kind: it.kind, price: it.price, balance: wallet.balance, hp: null, boost_until: null };
        seen.set(a.p_request, res); return json(route, res);
      });
      await page.goto(BASE() + `hubs/${hub}/index.html#more`); await page.waitForTimeout(2500);
      const tile = await page.evaluate(() => [...document.querySelectorAll('a[href="#more/shop"]')].map(x => x.textContent.replace(/\s+/g, ' ')).join(' | '));
      if (!tile) problems.push(`${name} (${label}): More has no "Timmy's shop" tile on the game layer`);
      else if (!/300 gold crowns/.test(tile)) problems.push(`${name} (${label}): the Shop tile should show the balance from the bootstrap (${tile})`);
      if (asked.length) problems.push(`${name} (${label}): the shop's files loaded with the page (${asked.join(', ')}): they load on first use`);
      await page.evaluate(() => { location.hash = 'more/shop'; });
      const store = await page.waitForSelector('.shop-host .tsh-store', { timeout: 20000 }).catch(() => null);
      if (!store) problems.push(`${name} (${label}): More > Timmy's shop didn't draw the shop`);
      else {
        await page.waitForTimeout(800);
        if (!['shop.js', 'shop.css', 'hub-art/shop.js'].every(f => asked.includes(f))) problems.push(`${name} (${label}): the shop drew without its files (${asked.join(', ')})`);
        const s = await page.evaluate(() => {
          const r = document.querySelector('.tsh-store'), cards = [...r.querySelectorAll('.tsh-card[data-item]')], btns = [...document.querySelectorAll('.tsh-store button')];
          return { bal: (r.querySelector('[data-shop-bal]') || {}).textContent, shelves: [...r.querySelectorAll('.tsh-shelf')].map(x => x.className.replace(/.*tsh-shelf-/, '')),
            state: Object.fromEntries(cards.map(c => [c.dataset.item, c.className.replace(/.*\bs-/, '')])), x: !!window.__shopx || !!r.querySelector('img[src="x"]'),
            nameTxt: (r.querySelector('.tsh-card[data-item="sandcastle"] .tsh-rname') || {}).textContent || '',
            first: btns.filter(b => { const d = [...b.attributes].map(a => a.name).filter(n => n.indexOf('data-') === 0); return d[0] !== 'data-shop'; }).map(b => b.outerHTML.slice(0, 80)),
            w: document.documentElement.scrollWidth - innerWidth };
        });
        if (s.bal !== '300') problems.push(`${name} (${label}): the shop's balance reads "${s.bal}", not 300`);
        if (s.shelves.join() !== 'today,week,spotted,always') problems.push(`${name} (${label}): the shop's shelves are ${s.shelves.join(', ')}, not Today's picks, This week, Spotted (the ten costumes as shapes) and Always here (an empty shelf is left out)`);
        const spot = await page.evaluate(() => ({ shapes: document.querySelectorAll('.tsh-shelf-spotted .tsh-unseen').length, cards: document.querySelectorAll('.tsh-shelf-spotted .tsh-card[data-item]').length }));
        if (spot.shapes !== 10 || spot.cards) problems.push(`${name} (${label}): with no costume spotted yet, the Spotted shelf shows the ten as shapes and nothing to buy (${JSON.stringify(spot)})`);
        if (s.state.sandcastle !== 'buy' || s.state.igloo !== 'short' || s.state.apple !== 'full' || s.state['boost-1h'] !== 'short') problems.push(`${name} (${label}): the cards' states are ${JSON.stringify(s.state)}`);
        if (s.x) problems.push(`${name} (${label}): an item's name was drawn as markup`);
        else if (!/<img/.test(s.nameTxt)) problems.push(`${name} (${label}): an item's name should show as text (${s.nameTxt})`);
        if (s.first.length) problems.push(`${name} (${label}): every button in the shop names its click by data-shop first (${s.first.join(' / ')})`);
        if (s.w > 1) problems.push(`${name} (${label}): the shop scrolls sideways by ${s.w}px`);
        const open = async id => { await page.click(`.tsh-store .tsh-card[data-item="${id}"]`); return page.waitForSelector('dialog.tsh-sheet[open]', { timeout: 5000 }).catch(() => null); };
        const sheetSays = () => page.evaluate(() => { const d = document.querySelector('dialog.tsh-sheet[open]'); return d ? d.innerText.replace(/\s+/g, ' ') : ''; });
        /* a snack while he's at 100 HP: no Buy */
        if (await open('apple')) {
          const a = await page.evaluate(() => { const b = document.querySelector('dialog.tsh-sheet [data-shop="confirm"]'); return { dis: !b || b.disabled, txt: document.querySelector('dialog.tsh-sheet').innerText }; });
          if (!a.dis || !/full/i.test(a.txt)) problems.push(`${name} (${label}): a snack at 100 HP should say he's full and offer no Buy`);
          await page.keyboard.press('Escape'); await page.waitForTimeout(300);
        } else problems.push(`${name} (${label}): tapping a card didn't open its sheet`);
        if (vp.isMobile) { /* the phone: shelves scroll sideways inside, the page doesn't */
          const ph = await page.evaluate(() => { const c = document.querySelector('.tsh-shelf-today .tsh-rcards'); return c ? { x: getComputedStyle(c).overflowX, w: c.scrollWidth > c.clientWidth } : null; });
          if (!ph || !/auto|scroll/.test(ph.x)) problems.push(`${name} (${label}): on a phone a shelf should scroll sideways (${JSON.stringify(ph)})`);
        } else {
          /* a dropped connection charges nothing; the retry sends the same request id; a double tap sends one */
          if (await open('sandcastle')) {
            drop = true;
            await page.click('dialog.tsh-sheet [data-shop="confirm"]'); await page.waitForTimeout(700);
            const d1 = await sheetSays(), bal1 = await page.textContent('.tsh-store [data-shop-bal]');
            if (!/nothing was charged/.test(d1) || bal1 !== '300') problems.push(`${name} (${label}): a dropped connection should say nothing was charged and leave 300 (${bal1}; ${d1.slice(0, 120)})`);
            await page.dblclick('dialog.tsh-sheet [data-shop="confirm"]'); await page.waitForTimeout(1600);
            const ids = buys.map(b => b.split(' ')[0]);
            if (buys.length !== 2 || ids[0] !== ids[1] || !/^[A-Za-z0-9_-]{8,64}$/.test(ids[0])) problems.push(`${name} (${label}): the retry and its double tap should send one request with the first try's id (${buys.join(', ')})`);
            const d2 = await sheetSays(), bal2 = await page.textContent('.tsh-store [data-shop-bal]');
            if (!/It’s yours/.test(d2) || bal2 !== '150') problems.push(`${name} (${label}): after buying, the sheet should say it's yours and the balance read 150 (${bal2}; ${d2.slice(0, 120)})`);
            await page.waitForTimeout(800);
            const st = await page.evaluate(() => (document.querySelector('.tsh-store .tsh-card[data-item="sandcastle"]') || {}).className || '');
            if (!/\bs-owned\b/.test(st)) problems.push(`${name} (${label}): a bought piece's card should show Yours (${st})`);
            /* a refusal says why and changes nothing */
            await page.keyboard.press('Escape'); await page.waitForTimeout(300);
            if (await open('bow-tie')) {
              refuse = 'not-today'; const n = buys.length;
              await page.click('dialog.tsh-sheet [data-shop="confirm"]'); await page.waitForTimeout(700);
              const d3 = await sheetSays(), bal3 = await page.textContent('.tsh-store [data-shop-bal]');
              if (buys.length !== n + 1 || !/left the shelf/.test(d3) || bal3 !== '150' || /It’s yours/.test(d3)) problems.push(`${name} (${label}): a refusal should say why and change nothing (${bal3}; ${d3.slice(0, 120)})`);
              refuse = '';
              await page.click('dialog.tsh-sheet [data-shop="confirm"]'); await page.waitForTimeout(1600);
              const wear = await page.$('dialog.tsh-sheet [data-shop="wear"]');
              if (!wear) problems.push(`${name} (${label}): a bought outfit should offer "Put it on"`);
              else {
                await wear.click();
                const pl = await page.waitForSelector('dialog.tpv[open] .tpv-card[data-item="bow-tie"]', { timeout: 15000 }).catch(() => null);
                if (!pl) problems.push(`${name} (${label}): "Put it on" should open the customizer on Timmy's outfits, with the bow tie in it`);
                await page.keyboard.press('Escape'); await page.waitForTimeout(400);
              }
            }
          }
        }
      }
      errs.forEach(e => problems.push(`${name} (${label}): JavaScript error: ${e}`));
      notes.push(`${name} (${label}): Timmy's shop, a purchase, a refusal and a dropped connection`);
      await page.close();
    }
    /* Learn and Flashcards (widget/study-modes.js + .css, the "Study as" toggle above the Question Bank's panel): nothing of
       them loads with the page or the bank, the toggle loads them; Learn asks a question from the panel's set (answered,
       no "Try it again", a Next button); a flashcard is never a .qcard (question health and the class's picks leave it
       alone), turns over to its answer and four ratings, and a rating brings the next card; every button they draw carries
       a fixed data-* name; the mock has no toggle. The stub answers get_my_cards with [], and the page sends no rating
       under a test browser, so nothing is recorded. The bank is put back on Questions at the end. */
    for (const hub of engineHubs.slice(0, 1)) {
      const page = await context.newPage(); const errs = [], name = `${hub}, Learn and Flashcards`, asked = [];
      page.on('pageerror', e => errs.push(e.message));
      page.on('request', r => { if (/\/widget\/study-modes\.(js|css)/.test(r.url())) asked.push(r.url().replace(/^.*\/widget\//, '')); });
      await page.goto(BASE() + `hubs/${hub}/index.html#questions`); await page.waitForTimeout(1500);
      const views = await page.$$eval('[data-qview]', bs => bs.map(b => b.getAttribute('data-qview')));
      if (views.join() !== 'questions,learn,cards') problems.push(`${name} (${label}): the Question Bank's "Study as" toggle is ${views.join(', ') || 'missing'}, not Questions, Learn and Flashcards`);
      if (asked.length) problems.push(`${name} (${label}): Learn and Flashcards' files loaded with the page, before the toggle was used (${asked.join(', ')}): they load on first use`);
      if (views.length) {
        /* Learn and Flashcards open a launcher in the bank (how far along, Start); Start opens the session over the
           whole screen, and Escape or Close puts you back (Sam, 2026-11-13) */
        await page.click('[data-qview="learn"]');
        const ls0 = await page.waitForSelector('.sm-launch [data-sm="start"]', { timeout: 15000 }).catch(() => null);
        if (!ls0) problems.push(`${name} (${label}): Learn drew no launcher with a Start button`);
        else {
          const above = await page.evaluate(() => { const a = document.querySelector('.sm-launch'), b = document.querySelector('.bank-main .fpanel, .bank-main [data-panel], .bank-which'); return !!(a && b && (a.compareDocumentPosition(b) & 4)); });
          if (!above) problems.push(`${name} (${label}): Learn's launcher should come before the "Which questions" panel`);
          await ls0.click();
        }
        const lc = await page.waitForSelector('.sm-focus [data-smstage] .qcard', { timeout: 15000 }).catch(() => null);
        if (!asked.includes('study-modes.js') || !asked.includes('study-modes.css')) problems.push(`${name} (${label}): Learn opened without study-modes.js and study-modes.css (${asked.join(', ')})`);
        if (!lc) problems.push(`${name} (${label}): Learn drew no question`);
        else {
          await page.evaluate(() => {
            const c = document.querySelector('[data-smstage] .qcard'), sc = c.querySelector('[data-showch]'); if (sc && sc.offsetParent) sc.click();
            const rv = c.querySelector('[data-reveal]'); if (rv) { rv.click(); c.querySelector('[data-grade]').click(); return; }
            const st = [...c.querySelectorAll('[data-step]')]; if (st.length) { st.forEach(b => b.click()); return; }
            const l = [...c.querySelectorAll('[data-side="l"]')]; if (l.length) { l.forEach(x => { x.click(); const r = c.querySelector('[data-side="r"]:not(:disabled)'); if (r) r.click(); }); return; }
            const ch = c.querySelector('.ch'); if (ch) ch.click(); const k = c.querySelector('[data-check]'); if (k && !k.disabled) k.click();
          });
          await page.waitForTimeout(500);
          const st = await page.evaluate(() => { const c = document.querySelector('[data-smstage] .qcard'); return { answered: !!c && c.classList.contains('is-answered'), again: !!(c && c.querySelector('[data-again]')), next: !!document.querySelector('[data-smstage] [data-sm="next"]') }; });
          if (!st.answered || st.again || !st.next) problems.push(`${name} (${label}): a Learn question should end answered, with Next and without "Try it again" (${JSON.stringify(st)})`);
          const lw = await page.evaluate(d => Math.max(document.documentElement.scrollWidth, innerWidth) - (d || innerWidth), (page.viewportSize() || {}).width || 0);
          if (lw > 1) problems.push(`${name} (${label}): Learn's session scrolls sideways by ${lw}px`);
          await page.keyboard.press('Escape'); await page.waitForTimeout(500);
          const closed = await page.evaluate(() => ({ gone: !document.querySelector('.sm-focus'), lock: document.documentElement.classList.contains('sm-open'), launcher: !!document.querySelector('.sm-launch [data-sm="start"]') }));
          if (!closed.gone || closed.lock || !closed.launcher) problems.push(`${name} (${label}): Escape should close Learn's session and show its launcher again (${JSON.stringify(closed)})`);
        }
        await page.click('[data-qview="cards"]');
        const cs0 = await page.waitForSelector('.sm-launch [data-sm="start"]', { timeout: 10000 }).catch(() => null);
        if (!cs0) problems.push(`${name} (${label}): Flashcards drew no launcher with a Study button`); else await cs0.click();
        const fc = await page.waitForSelector('.sm-cards .fcard', { timeout: 10000 }).catch(() => null);
        if (!fc) problems.push(`${name} (${label}): Flashcards drew no card`);
        else {
          const first = await fc.getAttribute('data-fqid');
          if (await page.$('.sm-cards .qcard, .sm-cards [data-qid]')) problems.push(`${name} (${label}): a flashcard is drawn as a question card (.qcard / data-qid): question health would log it as an unanswered question`);
          await page.click('.sm-cards [data-sm="flip"]'); await page.waitForTimeout(900);
          const back = await page.evaluate(() => { const c = document.querySelector('.sm-cards .fcard'); return { ans: !!c.querySelector('.fc-ans'), rates: c.querySelectorAll('.fc-r').length, shown: !c.querySelector('[data-raterow]').hidden, w: document.documentElement.scrollWidth - innerWidth }; });
          if (!back.ans || back.rates !== 4 || !back.shown) problems.push(`${name} (${label}): a flashcard turned over should show its answer and four ratings (${JSON.stringify(back)})`);
          if (back.w > 1) problems.push(`${name} (${label}): a turned-over flashcard scrolls sideways by ${back.w}px`);
          await page.click('.sm-cards [data-sm="good"]'); await page.waitForTimeout(900);
          const after = await page.evaluate(() => { const c = document.querySelector('.sm-cards .fcard'); return { id: c && c.getAttribute('data-fqid'), caught: !!document.querySelector('.sm-caught') }; });
          if (!after.caught && (!after.id || after.id === first)) problems.push(`${name} (${label}): rating a flashcard Good didn't bring the next card`);
        }
        const unnamedIn = await page.$$eval('.sm button', bs => bs.filter(b => !b.closest('.qcard') && ![...b.attributes].some(a => /^data-/.test(a.name))).map(b => (b.textContent || '').trim().slice(0, 30)));
        if (unnamedIn.length) problems.push(`${name} (${label}): button(s) in a Flashcards session without a fixed data-* name (click counts): ${unnamedIn.join(', ')}`);
        if (await page.$('.sm-focus [data-sm="exit"]')) { await page.click('.sm-focus [data-sm="exit"]'); await page.waitForTimeout(500); }
        if (await page.$('.sm-focus')) problems.push(`${name} (${label}): Close didn't close the Flashcards session`);
        /* the bank's own question card inside Learn keeps its buttons as they are; everything Learn and Flashcards draw is named */
        const unnamed = await page.$$eval('.sm button', bs => bs.filter(b => !b.closest('.qcard') && ![...b.attributes].some(a => /^data-/.test(a.name))).map(b => (b.textContent || '').trim().slice(0, 30)));
        if (unnamed.length) problems.push(`${name} (${label}): button(s) in Learn or Flashcards without a fixed data-* name (click counts): ${unnamed.join(', ')}`);
        await page.evaluate(() => { location.hash = 'questions/mock'; }); await page.waitForTimeout(800);
        if (await page.$('[data-qview]')) problems.push(`${name} (${label}): the "Study as" toggle shows during the mock exam (the mock is always questions)`);
        await page.evaluate(() => { location.hash = 'questions'; }); await page.waitForTimeout(800);
        const qb = await page.$('[data-qview="questions"]'); if (qb) { await qb.click(); await page.waitForTimeout(400); }
        if (!(await page.$('#qlist .qcard'))) problems.push(`${name} (${label}): back on Questions, the bank drew no question cards`);
      }
      errs.forEach(e => problems.push(`${name} (${label}): JavaScript error: ${e}`));
      notes.push(`${name} (${label}): the "Study as" toggle, a Learn question and a flashcard turned over and rated`);
      await page.close();
    }
    /* the dashboard's "you" card: the place is drawn over a blank frame (the old house picture's spot). The page is at its
       request budget, so nothing of the place loads with it; the place draws on first use and keeps a still, and the
       next visit shows that still at once, still without a request. */
    {
      const page = await context.newPage(); const errs = [], name = `dashboard, Timmy's place`; let asked = [];
      page.on('pageerror', e => errs.push(e.message));
      page.on('request', r => { if (/\/widget\/(place\.(js|css)|hub-art\/place)/.test(r.url())) asked.push(r.url().replace(/^.*\/widget\//, '')); });
      await page.addInitScript(() => { try { localStorage.setItem('sh_pet_born', '2026-10-01'); localStorage.setItem('sh_tour_done', '1'); } catch (e) {} });
      await page.goto(BASE() + 'index.html'); await page.waitForTimeout(2500);
      const before = await page.evaluate(() => { const s = document.querySelector('#petHome .shpet-scene'); return { scene: !!s, place: !!(s && s.classList.contains('has-place')), house: !!(s && s.querySelector('.shpet-housesvg')) }; });
      if (!before.scene || !before.house) problems.push(`${name} (${label}): the "you" card should hold the blank frame the place is drawn over (${JSON.stringify(before)})`);
      if (asked.length) problems.push(`${name} (${label}): the place's files loaded with the dashboard (${asked.join(', ')}): the page is at its request budget, they load on first use`);
      await page.evaluate(() => window.dispatchEvent(new Event('scroll')));
      const live = await page.waitForSelector('#petHome .shpet-scene.has-place .tpc.is-live', { timeout: 20000 }).catch(() => null);
      if (!live) problems.push(`${name} (${label}): the place didn't take the frame's spot after the first scroll`);
      else {
        const d = await page.evaluate(() => { const s = document.querySelector('#petHome .shpet-scene'), h = s.querySelector('.shpet-housesvg'), b = s.querySelector('.shpet-btn');
          return { house: h ? getComputedStyle(h).display : '', timmy: b ? getComputedStyle(b).display : '', info: !!document.querySelector('#petHome .shpet-info [data-joke]'), w: document.documentElement.scrollWidth - innerWidth }; });
        if (d.house !== 'none' || d.timmy !== 'none' || !d.info) problems.push(`${name} (${label}): with the place drawn, the frame and its Timmy step aside and his name, HP and buttons stay (${JSON.stringify(d)})`);
        if (d.w > 1) problems.push(`${name} (${label}): the dashboard with the place scrolls sideways by ${d.w}px`);
        asked = [];
        await page.reload(); await page.waitForTimeout(2500);
        const again = await page.evaluate(() => { const s = document.querySelector('#petHome .shpet-scene'), i = s && s.querySelector('.tpc img'); return { place: !!(s && s.classList.contains('has-place')), img: !!i && i.naturalWidth > 0 }; });
        if (!again.place || !again.img) problems.push(`${name} (${label}): the second visit should show the place's saved still at once (${JSON.stringify(again)})`);
        if (asked.length) problems.push(`${name} (${label}): the saved still should need no request (${asked.join(', ')})`);
        const still = await page.$('#petHome .tpc');
        if (still) { await still.click(); if (!(await page.waitForSelector('dialog.tpv[open]', { timeout: 20000 }).catch(() => null))) problems.push(`${name} (${label}): tapping the saved still didn't load the place and open it`); else { await page.keyboard.press('Escape'); await page.waitForTimeout(300); } }
      }
      errs.forEach(e => problems.push(`${name} (${label}): JavaScript error: ${e}`));
      notes.push(`${name} (${label}): the place in the "you" card, on first use and from its still`);
      await page.close();
    }
    /* the new dashboard's balance and Shop button (widget/dash.js): the balance comes from the bootstrap, the shop's
       files load only when the button is tapped, the shop opens as a dialog and Escape gives focus back to the button.
       And a live hub never asks for any of it: no shop files, no get_pet_days_v2, no buy_item. */
    {
      const page = await context.newPage(); const errs = [], name = `dashboard, Timmy's shop`, asked = [];
      page.on('pageerror', e => errs.push(e.message));
      page.on('request', r => { if (/\/widget\/(shop\.(js|css)|hub-art\/shop\.js)/.test(r.url())) asked.push(r.url().replace(/^.*\/widget\//, '')); });
      /* this device last saw the same rank, so no rank-up card covers the page */
      await page.addInitScript(() => { try { localStorage.setItem('sh_pet_born', '2026-10-01'); localStorage.setItem('sh_tour_done', '1'); localStorage.setItem('sh_rank_g', '4'); localStorage.setItem('sh_rank_tier', '1'); localStorage.setItem('sh_rank_step', '4'); } catch (e) {} });
      const rank = { xp: 2400, journey: 0, tier: 1, level: 2, step: 4, gtier: 1, step_at: 2000, next_at: 3000, tier_at: 1500, steps: 63, answers: 300, correct: 220, days: 12, badges: [], dark_seen: [], boost: null };
      const shop = { day: '2026-11-12', seasons: [], throwback: false, wallet: { earned: 1234, spent: 0, balance: 1234 }, items: [{ id: 'bow-tie', name: 'Bow tie', kind: 'outfit', rarity: 'common', price: 120, shelf: 'weekly', owned: false }],
        inventory: [], locked: [], equipped: {}, costumes: [], snacks_today: [], boost: null };
      const json = (route, body) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
      await page.route(/supabase\.co\/rest\/v1\/rpc\/get_widget_bootstrap_v2/, route => json(route, { rank, shop }));
      await page.route(/supabase\.co\/rest\/v1\/rpc\/get_my_shop/, route => json(route, shop));
      await page.goto(BASE() + 'index.html'); await page.waitForTimeout(2500);
      const w = await page.evaluate(() => { const e = document.getElementById('youShop'); return e ? { hidden: e.hidden, text: e.innerText.replace(/\s+/g, ' '), btn: !!e.querySelector('button[data-dash="shop"]') } : null; });
      if (!w || w.hidden || !/1,234 Shiny Gold Crowns/.test(w.text) || !w.btn) problems.push(`${name} (${label}): the "you" card should show the balance from the bootstrap and a Shop button (${JSON.stringify(w)})`);
      if (asked.length) problems.push(`${name} (${label}): the shop's files loaded with the dashboard (${asked.join(', ')}): they load when the button is tapped`);
      if (await page.$('.sh-ru.is-on')) { await page.keyboard.press('Escape'); await page.waitForTimeout(600); }
      if (w && w.btn) {
        await page.click('#youShop [data-dash="shop"]', { timeout: 8000 }).catch(e => problems.push(`${name} (${label}): the Shop button couldn't be tapped (${e.message.split('\n')[0]})`));
        const dlg = await page.waitForSelector('dialog.tsh-dlg[open] .tsh-store', { timeout: 20000 }).catch(() => null);
        if (!dlg) problems.push(`${name} (${label}): the Shop button didn't open the shop`);
        else {
          if (!asked.includes('shop.js')) problems.push(`${name} (${label}): the shop opened without fetching shop.js`);
          const d = await page.evaluate(() => { const g = document.querySelector('dialog.tsh-dlg'), h = document.getElementById(g.getAttribute('aria-labelledby'));
            return { name: h ? h.textContent : '', ids: [...document.querySelectorAll('[id]')].map(e => e.id).filter((x, i, a) => a.indexOf(x) !== i), w: g.scrollWidth - g.clientWidth }; });
          if (!/Timmy’s Shop/.test(d.name)) problems.push(`${name} (${label}): the shop's dialog has no name (${d.name})`);
          if (d.ids.length) problems.push(`${name} (${label}): ids used twice with the shop open: ${d.ids.join(', ')}`);
          if (d.w > 1) problems.push(`${name} (${label}): the shop's dialog scrolls sideways by ${d.w}px`);
          await page.keyboard.press('Escape'); await page.waitForTimeout(500);
          const back = await page.evaluate(() => ({ open: !!document.querySelector('dialog.tsh-dlg'), focus: document.activeElement && document.activeElement.getAttribute('data-dash') }));
          if (back.open || back.focus !== 'shop') problems.push(`${name} (${label}): Escape should close the shop and give focus back to the Shop button (${JSON.stringify(back)})`);
        }
      }
      errs.forEach(e => problems.push(`${name} (${label}): JavaScript error: ${e}`));
      notes.push(`${name} (${label}): the balance and the Shop button on the "you" card`);
      await page.close();
    }
    /* Visiting (phase 4, session 4: widget/dash.js's boards, widget/place.js's visit). On the game layer every board row
       has a visit key, and its name is a button named for what it does ("Visit <name>'s place", your own "Open your
       place") with one fixed name for the click count (data-dash="visit") and the key on its row, never on the button.
       A tap opens the place as a visit: "<name>'s place" in the title as text, no Customize, no HP; get_place is asked
       once for a person (the stage's outfits already asked for the top three); place:visit is counted with nothing about
       whose; closing gives focus back to the row. A name with markup in it is drawn as text, a key that opens nothing
       gives one plain line on its row, a row whose key isn't one isn't a button, and nothing of the place loads with the
       page. Without the game layer (no _v2 boards) no row is a button. */
    {
      const name = `dashboard, visiting`, K = c => c.repeat(24), BAD = '<img src=x onerror="window.__visit=1">Bee';
      const json = (route, body, status) => route.fulfill({ status: status || 200, contentType: 'application/json', body: JSON.stringify(body) });
      const rank = { xp: 2400, journey: 0, tier: 1, level: 2, step: 4, gtier: 1, step_at: 2000, next_at: 3000, tier_at: 1500, steps: 63, answers: 300, correct: 220, days: 12, badges: [], dark_seen: [], boost: null };
      const row = (rnk, display_name, xp, visit, me) => ({ rnk, display_name, xp, journey: 0, tier: 3, level: 2, step: 11, is_me: !!me, flair: null, visit });
      const board = [row(1, 'Visit Alpha', 9000, K('a')), row(2, BAD, 8000, K('b')), row(3, 'Cee', 7000, K('c')), row(4, 'Dee', 6000, K('d')), row(5, 'Eff', 5000, 'not-a-key'), row(6, 'Test Molar', 2400, K('e'), true)];
      const places = { [K('a')]: { name: 'Visit Alpha', equipped: { home: 'castle', scene: 'beach', outfit: 'captain-hat' }, rank: { journey: 1, tier: 0, level: 2 }, flair: null },
        [K('b')]: { name: BAD, equipped: { home: 'igloo', scene: 'snowy-mountain', 'yard-left': 'campfire', outfit: 'beanie' }, rank: { journey: 0, tier: 4, level: 1 }, flair: null },
        [K('c')]: { name: 'Cee', equipped: {}, rank: { journey: 0, tier: 2, level: 3 }, flair: null } };
      const page = await context.newPage(); const errs = [], asked = [], placeCalls = {};
      page.on('pageerror', e => errs.push(e.message));
      page.on('request', r => { if (/\/widget\/(place\.(js|css)|hub-art\/place)/.test(r.url())) asked.push(r.url().replace(/^.*\/widget\//, '')); });
      await page.addInitScript(() => { try { localStorage.setItem('sh_pet_born', '2026-10-01'); localStorage.setItem('sh_tour_done', '1'); localStorage.setItem('sh_rank_g', '4'); localStorage.setItem('sh_rank_tier', '1'); localStorage.setItem('sh_rank_step', '4'); } catch (e) {} });
      await page.route(/supabase\.co\/rest\/v1\/rpc\/get_widget_bootstrap_v2/, route => json(route, { rank, shop: { day: '2026-11-12', seasons: [], throwback: false, wallet: { balance: 0 }, items: [], inventory: [], locked: [], equipped: {}, costumes: [], snacks_today: [], boost: null } }));
      await page.route(/supabase\.co\/rest\/v1\/rpc\/get_rank_board_v2/, route => json(route, board));
      await page.route(/supabase\.co\/rest\/v1\/rpc\/get_leaderboard_v2/, route => json(route, board.slice(0, 4).map(r => ({ display_name: r.display_name, streak: 10 - r.rnk, total_answered: 100, journey: 0, tier: 2, level: 1, step: 7, flair: null, visit: r.visit }))));
      await page.route(/supabase\.co\/rest\/v1\/rpc\/get_place/, route => { let a = {}; try { a = JSON.parse(route.request().postData() || '{}'); } catch (e) {} placeCalls[a.p_key] = (placeCalls[a.p_key] || 0) + 1; return json(route, places[a.p_key] || null); });
      await page.goto(BASE() + 'index.html'); await page.waitForTimeout(2000);
      if (asked.length) problems.push(`${name} (${label}): the place's files loaded with the dashboard (${asked.join(', ')}): a tap on a row is a first use`);
      if (await page.$('.sh-ru.is-on')) { await page.keyboard.press('Escape'); await page.waitForTimeout(600); }
      await page.evaluate(() => { document.getElementById('class').scrollIntoView(); const o = window.shTrack; window.__tracked = []; window.shTrack = (k, n) => { window.__tracked.push(String(k)); return o && o(k, n); }; });
      if (!(await page.waitForSelector('#board .dx-visit', { timeout: 15000 }).catch(() => null))) problems.push(`${name} (${label}): the boards' rows didn't become buttons on the game layer`);
      else {
        await page.waitForTimeout(1200);
        const r = await page.evaluate(() => ({
          buttons: [...document.querySelectorAll('#board .dx-visit')].map(b => ({ label: b.getAttribute('aria-label') || '', tag: b.tagName, data: [...b.attributes].filter(a => a.name.startsWith('data-')).map(a => a.name + '=' + a.value).join(' '), key: (b.closest('[data-visit]') || {}).getAttribute ? b.closest('[data-visit]').getAttribute('data-visit') : '' })),
          plain: [...document.querySelectorAll('#board li:not([data-visit])')].map(l => l.textContent.trim().slice(0, 20)), injected: !!window.__visit || !!document.querySelector('#board img'),
          w: document.documentElement.scrollWidth - innerWidth }));
        const labels = r.buttons.map(b => b.label);
        if (r.buttons.length !== 5 || r.buttons.some(b => b.tag !== 'BUTTON' || b.data !== 'data-dash=visit' || !/^[0-9a-f]{24}$/.test(b.key))) problems.push(`${name} (${label}): every row with a key (5 here) should have one button carrying only data-dash="visit", its key on the row (${JSON.stringify(r.buttons)})`);
        if (!labels.includes('Visit Visit Alpha’s place') || !labels.includes('Visit Dee’s place') || !labels.includes('Test Molar (you): open your place')) problems.push(`${name} (${label}): the buttons should be named "Visit <name>'s place", and "<name> (you): open your place" on your own row (${labels.join(' | ')})`);
        if (!r.plain.some(t => /Eff/.test(t))) problems.push(`${name} (${label}): a row whose key isn't 24 hex characters shouldn't be a button (${r.plain.join(' | ')})`);
        if (r.injected) problems.push(`${name} (${label}): a leaderboard name with markup in it was drawn as markup`);
        if (r.w > 1) problems.push(`${name} (${label}): the board with its buttons scrolls sideways by ${r.w}px`);
        const bee = '#board .dx-visit[aria-label^="Visit <img"]';
        await page.click(bee);
        const dlg = await page.waitForSelector('dialog.tpv[open]', { timeout: 20000 }).catch(() => null);
        if (!dlg) problems.push(`${name} (${label}): tapping a row didn't open that person's place`);
        else {
          /* the trip Sam approved on the design page: clouds over the whole screen with "Off to <name>'s place" as text, the
             window hidden behind them until they cover it, and all of it gone once they've scattered */
          await page.waitForTimeout(150);
          const trip = await page.evaluate(() => { const d = document.querySelector('dialog.tpv'), c = d.querySelector('.tpv-clouds'), b = c && c.querySelector('.tpv-clmsg b');
            return { clouds: !!c, hidden: d.classList.contains('is-trip'), aria: c ? c.getAttribute('aria-hidden') : '', n: c ? c.querySelectorAll('.tpv-cloud').length : 0, line: b ? b.textContent : '', els: b ? b.children.length : -1, injected: !!window.__visit }; });
          if (!trip.clouds || !trip.hidden || trip.aria !== 'true' || trip.n < 9) problems.push(`${name} (${label}): a visit should start with the trip through the clouds, the window hidden behind them (${JSON.stringify(trip)})`);
          if (trip.clouds && (trip.line !== 'Off to ' + BAD + '’s place' || trip.els || trip.injected)) problems.push(`${name} (${label}): the trip's line should be "Off to <name>'s place" as text (${JSON.stringify(trip)})`);
          await page.waitForTimeout(2600);
          const after = await page.evaluate(() => { const d = document.querySelector('dialog.tpv'); return { clouds: !!d.querySelector('.tpv-clouds'), hidden: d.classList.contains('is-trip') }; });
          if (after.clouds || after.hidden) problems.push(`${name} (${label}): the clouds should be gone and the window showing 2.6 s after a visit opens (${JSON.stringify(after)})`);
          const v = await page.evaluate(() => { const d = document.querySelector('dialog.tpv'), sr = d.querySelector('.tpv-stage').shadowRoot, t = sr && sr.querySelector('.tp-timmy');
            const h = d.querySelector('#tpvT').cloneNode(true), tb = h.querySelector('.tpv-num'); if (tb) tb.remove();
            return { title: h.textContent.trim(), titleEls: h.children.length, top: tb ? { shown: (tb.querySelector('[aria-hidden="true"]') || {}).textContent, said: (tb.querySelector('.tpv-sr') || {}).textContent, cls: tb.className } : null, seg: d.querySelector('.tpv-seg').hidden, cust: !!d.querySelector('[data-tp="customize2"], [data-tp="customize"]:not([hidden]) ') && !d.querySelector('.tpv-seg').hidden,
              hp: !!d.querySelector('.tpv-hp'), timmy: t ? t.getAttribute('aria-label') : '', home: (d.querySelector('.tpv-sub') || {}).textContent || '', injected: !!window.__visit || !!d.querySelector('img[src="x"]'), w: d.scrollWidth - d.clientWidth,
              forms: !!document.querySelector('section.survey'),
              look: { visit: d.classList.contains('is-visit'), kick: (d.querySelector('.tpv-kick') || {}).textContent || '', rank: (d.querySelector('.tpv-guest .tpv-gr') || {}).textContent || '', art: !!d.querySelector('.tpv-grank svg') } }; });
          if (!v.look.visit || v.look.kick !== 'Welcome to' || !/Gold/.test(v.look.rank) || !v.look.art) problems.push(`${name} (${label}): a visit should open in its theater look, "Welcome to" over the name and their rank drawn on the guest card (${JSON.stringify(v.look)})`);
          if (v.title !== BAD + '’s place' || v.titleEls) problems.push(`${name} (${label}): the visited place's title should be "<name>'s place" as text (${JSON.stringify(v.title)}, ${v.titleEls} elements)`);
          /* the top ten's number badge (Sam: "a special number badge next to their name"): Bee is #2 on the Ranks board,
             drawn as "#2" in silver and read out as words */
          if (!v.top || v.top.shown !== '#2' || v.top.said !== ', number 2 on the leaderboard' || !/\bt2\b/.test(v.top.cls)) problems.push(`${name} (${label}): a top-ten visit should have its number badge after the name (${JSON.stringify(v.top)})`);
          if (!v.seg || v.cust || v.hp || /HP/.test(v.timmy)) problems.push(`${name} (${label}): a visited place can't be changed and shows no HP (${JSON.stringify(v)})`);
          if (!/Igloo/i.test(v.home)) problems.push(`${name} (${label}): the visited place isn't theirs (their home is the igloo; the view says "${v.home}")`);
          if (v.injected) problems.push(`${name} (${label}): a visited place drew its name as markup`);
          if (v.w > 1) problems.push(`${name} (${label}): the visited place scrolls sideways by ${v.w}px`);
          /* the dashboard asks for the check-in four seconds after it loads, while this visit is open: it waits for the place
             to close, since under the <dialog> it would be hidden and take the Escape that closes the place */
          if (v.forms) problems.push(`${name} (${label}): the check-in or survey window opened under a classmate's place`);
          if (placeCalls[K('b')] !== 1) problems.push(`${name} (${label}): get_place was asked ${placeCalls[K('b')] || 0} times for one of the top three: the stage's outfits and the visit share one answer`);
          /* where focus goes first: a check-in waiting in the made-up data opens 0-1.5 s after the place closes
             (whenUncovered in widget/dash.js looks every 1.5 s) and takes focus then, which is fine once the row had it */
          await page.evaluate(() => { window.__focusSeq = []; document.addEventListener('focusin', e => window.__focusSeq.push((e.target.getAttribute && e.target.getAttribute('aria-label')) || ''), true); });
          await page.keyboard.press('Escape'); await page.waitForTimeout(500);
          const back = await page.evaluate(() => ({ open: !!document.querySelector('dialog.tpv'), focus: (window.__focusSeq || []).filter(l => l !== 'Exam check-in')[0] || (document.activeElement ? document.activeElement.getAttribute('aria-label') || '' : ''), tracked: window.__tracked || [] }));
          if (back.open || !/^Visit <img/.test(back.focus)) problems.push(`${name} (${label}): closing the place should give focus back to the row (${JSON.stringify(back.focus)})`);
          const vt = back.tracked.filter(k => /^place:/.test(k));
          if (!vt.includes('place:visit') || vt.some(k => /bbbb|Bee|img/.test(k))) problems.push(`${name} (${label}): a visit should be counted as place:visit and nothing about whose (${vt.join(', ')})`);
        }
        await page.click('#board .dx-visit[aria-label="Visit Dee’s place"]'); await page.waitForTimeout(1500);
        const dee = await page.evaluate(() => ({ open: !!document.querySelector('dialog.tpv'), lines: [...document.querySelectorAll('#board .dx-vmsg')].map(m => (m.closest('[data-visit]').querySelector('.dx-visit') || {}).textContent + ': ' + m.textContent) }));
        if (dee.open || dee.lines.length !== 1 || !/^Dee: That place couldn’t be opened just now/.test(dee.lines[0])) problems.push(`${name} (${label}): a key that opens nothing should give one plain line on its row and nothing else (${JSON.stringify(dee)})`);
        /* the tour (round 3's design page): a visit carries the board's other rows with keys (Alpha, Bee, Cee, Dee here: not
           Eff, whose key is bad, nor your own). The arrows are named for where they go, carry one fixed click name each and
           go there through the clouds, one window at a time, asking get_place for nothing the page already has; Dee's place
           can't be read, so you stay at Cee with one plain line; "Back to mine" goes home, and closing then gives focus to
           your own row. */
        const tour = () => page.evaluate(() => { const ds = document.querySelectorAll('dialog.tpv'), d = ds[0]; if (!d) return { n: 0, focus: document.activeElement ? document.activeElement.getAttribute('aria-label') || '' : '' };
          const btn = k => { const b = d.querySelector('[data-tp="visit-' + k + '"]'); return b ? { label: b.getAttribute('aria-label'), data: [...b.attributes].filter(a => a.name.startsWith('data-')).map(a => a.name).join(' ') } : null; };
          const h = d.querySelector('#tpvT').cloneNode(true), tb = h.querySelector('.tpv-num'); if (tb) tb.remove();
          return { n: ds.length, title: h.textContent.trim(), top: tb ? (tb.querySelector('[aria-hidden="true"]') || {}).textContent : '', visit: d.classList.contains('is-visit'), clouds: !!d.querySelector('.tpv-clouds'), prev: btn('prev'), next: btn('next'), home: btn('home'),
            gnav: (d.querySelector('.tpv-gnav') || {}).textContent || '', wait: (() => { const w = d.querySelector('.tpv-wait'); return w && !w.hidden ? w.textContent : ''; })(), focus: document.activeElement ? document.activeElement.getAttribute('data-tp') || '' : '', injected: !!window.__visit }; });
        const vb = () => (placeCalls[K('a')] || 0) + (placeCalls[K('b')] || 0) + (placeCalls[K('c')] || 0) + (placeCalls[K('d')] || 0);
        await page.click(bee); await page.waitForTimeout(2800);
        let t = await tour();
        if (!t.prev || !t.next || !t.home || t.prev.label !== 'Previous place: Visit Alpha' || t.next.label !== 'Next place: Cee' || t.home.label !== 'Back to mine' || [t.prev, t.next, t.home].some(b => b.data !== 'data-tp'))
          problems.push(`${name} (${label}): a visit from the board should have Previous, Next and Back to mine, named for where they go, each with one fixed click name (${JSON.stringify(t)})`);
        if (!/^Place 2 of 4 on the board/.test(t.gnav) || !/Next: Cee$/.test(t.gnav) || t.injected) problems.push(`${name} (${label}): the guest card should say where on the board this place is, as text (${JSON.stringify(t.gnav)})`);
        const before = vb();
        await page.click('dialog.tpv [data-tp="visit-next"]'); await page.waitForTimeout(400);
        const mid = await tour();
        if (!mid.clouds || mid.n !== 1) problems.push(`${name} (${label}): Next should go through the clouds, one window at a time (${JSON.stringify(mid)})`);
        await page.waitForTimeout(2800); t = await tour();
        if (t.n !== 1 || t.title !== 'Cee’s place' || t.top !== '#3' || t.clouds || t.focus !== 'visit-next' || !/^Place 3 of 4/.test(t.gnav)) problems.push(`${name} (${label}): Next should open Cee's place (#3), the clouds gone and focus on Next again (${JSON.stringify(t)})`);
        await page.keyboard.press('Enter'); await page.waitForTimeout(3000); t = await tour();
        if (t.n !== 1 || t.title !== 'Cee’s place' || t.clouds || !/^That place couldn’t be opened just now/.test(t.wait)) problems.push(`${name} (${label}): a place that can't be read should leave you where you are with one plain line (${JSON.stringify(t)})`);
        if (vb() - before) problems.push(`${name} (${label}): the tour should ask get_place for nothing the page already has (the top three's outfits and the tap on Dee asked; ${vb() - before} more asked)`);
        await page.click('dialog.tpv [data-tp="visit-home"]'); await page.waitForTimeout(3200); t = await tour();
        if (t.n !== 1 || t.visit || t.title !== 'Timmy’s place' || t.clouds) problems.push(`${name} (${label}): Back to mine should open your own place (${JSON.stringify(t)})`);
        await page.keyboard.press('Escape'); await page.waitForTimeout(500); t = await tour();
        if (t.n || t.focus !== 'Test Molar (you): open your place') problems.push(`${name} (${label}): closing your place after a tour should give focus to your own row (${JSON.stringify(t)})`);
        const tt = (await page.evaluate(() => window.__tracked || [])).filter(k => /^place:/.test(k));
        if (tt.filter(k => k === 'place:visit').length < 3 || tt.some(k => /aaaa|cccc|Cee|Bee|Alpha|img/.test(k))) problems.push(`${name} (${label}): each place on a tour is counted as place:visit, never whose (${tt.join(', ')})`);
        /* Visit someone random, from the whole class (migration_v57's get_random_place): the server picks, here Gee, who is
           on no board, then Cee, then Hache; the page sends its own id and the keys the trip has shown (p_skip), never
           anyone else's. A random trip has no Previous at its first place, Next is "Visit someone else at random" and rolls
           the die in the clouds ("Off to someone random…") before the name; Previous goes back through the trip without
           asking the server; get_place isn't asked for a place the pick brought; focus goes back to the button. */
        const rb = await page.evaluate(() => { const p = document.getElementById('visitRand'), b = p && p.querySelector('button'); return p ? { shown: !p.hidden, data: b ? [...b.attributes].filter(a => a.name.startsWith('data-')).map(a => a.name + '=' + a.value).join(' ') : '' } : null; });
        if (!rb || !rb.shown || rb.data !== 'data-dash=visit-random') problems.push(`${name} (${label}): "Visit someone random" should be under the board with one fixed click name (${JSON.stringify(rb)})`);
        else {
          const picks = [{ visit: K('f'), name: 'Gee', equipped: { home: 'castle' }, rank: { journey: 0, tier: 1, level: 1 }, flair: null }, Object.assign({ visit: K('a') }, places[K('a')]),
            { visit: K('9'), name: 'Hache', equipped: { outfit: 'beanie' }, rank: { journey: 0, tier: 0, level: 1 }, flair: null }], rasks = [];
          await page.route(/supabase\.co\/rest\/v1\/rpc\/get_random_place/, route => { let a = {}; try { a = JSON.parse(route.request().postData() || '{}'); } catch (e) {} rasks.push(a); return json(route, picks[rasks.length - 1] || null); });
          const g0 = (placeCalls[K('f')] || 0) + (placeCalls[K('9')] || 0);
          await page.click('#visitRand button'); await page.waitForTimeout(3000); t = await tour();
          const myId = await page.evaluate(() => localStorage.getItem('sh_visitor_id'));
          if (t.n !== 1 || t.title !== 'Gee’s place' || t.top || !t.visit || t.prev || !t.next || t.next.label !== 'Visit someone else at random' || t.next.data !== 'data-tp' || !t.home)
            problems.push(`${name} (${label}): a random visit should open the place the server picked, someone on no board, with Next to someone else at random and no Previous yet (${JSON.stringify(t)})`);
          if (!/^Picked at random from the class/.test(t.gnav) || !/Next: someone else at random$/.test(t.gnav)) problems.push(`${name} (${label}): the guest card should say the visit was picked at random (${JSON.stringify(t.gnav)})`);
          if (rasks.length !== 1 || !myId || rasks[0].p_visitor !== myId || JSON.stringify(rasks[0].p_skip) !== '[]' || Object.keys(rasks[0]).sort().join() !== 'p_skip,p_visitor')
            problems.push(`${name} (${label}): the random pick should send only the page's own id and the keys already shown (${JSON.stringify(rasks)})`);
          await page.click('dialog.tpv [data-tp="visit-next"]'); await page.waitForTimeout(350);
          const roll = await page.evaluate(() => { const d = document.querySelector('dialog.tpv'), m = d && d.querySelector('.tpv-clmsg'); return m ? m.textContent : ''; });
          if (!/^Off to someone random/.test(roll)) problems.push(`${name} (${label}): Next on a random trip should roll the die in the clouds first (${JSON.stringify(roll)})`);
          await page.waitForTimeout(3400); t = await tour();
          if (t.n !== 1 || t.title !== 'Visit Alpha’s place' || t.top !== '#1' || t.clouds || t.focus !== 'visit-next' || !t.prev || t.prev.label !== 'Previous place: Gee' || t.next.label !== 'Visit someone else at random')
            problems.push(`${name} (${label}): Next on a random trip should open the next pick, with Previous back to the last (${JSON.stringify(t)})`);
          if (rasks.length !== 2 || JSON.stringify(rasks[1].p_skip) !== JSON.stringify([K('f')])) problems.push(`${name} (${label}): Next should ask again, skipping the places the trip has shown (${JSON.stringify(rasks.map(a => a.p_skip))})`);
          await page.click('dialog.tpv [data-tp="visit-prev"]'); await page.waitForTimeout(3200); t = await tour();
          if (t.n !== 1 || t.title !== 'Gee’s place' || t.prev || t.focus !== 'visit-next' || t.next.label !== 'Next place: Visit Alpha' || rasks.length !== 2 || !/Next: Visit Alpha$/.test(t.gnav))
            problems.push(`${name} (${label}): Previous should go back through the trip without a new pick, focus on Next (${JSON.stringify(t)}, ${rasks.length} picks)`);
          if ((placeCalls[K('f')] || 0) + (placeCalls[K('9')] || 0) - g0) problems.push(`${name} (${label}): get_place shouldn't be asked for a place the random pick brought`);
          await page.keyboard.press('Escape'); await page.waitForTimeout(500);
          const rf = await page.evaluate(() => ({ open: !!document.querySelector('dialog.tpv'), rand: !!(document.activeElement && document.activeElement.closest('#visitRand')) }));
          if (rf.open || !rf.rand) problems.push(`${name} (${label}): closing a random visit should give focus back to the button (${JSON.stringify(rf)})`);
          /* no one else has customized their place (the server gives nothing): one plain line under the button, no visit */
          await page.unroute(/supabase\.co\/rest\/v1\/rpc\/get_random_place/);
          await page.route(/supabase\.co\/rest\/v1\/rpc\/get_random_place/, route => json(route, null));
          await page.click('#visitRand button'); await page.waitForTimeout(1500);
          const nobody = await page.evaluate(() => ({ open: !!document.querySelector('dialog.tpv'), line: (document.querySelector('#visitRand .dx-rmsg') || {}).textContent || '' }));
          if (nobody.open || !/^No one else has decorated their place yet/.test(nobody.line)) problems.push(`${name} (${label}): with no one else customized, the button should say so and open nothing (${JSON.stringify(nobody)})`);
          /* before the release (no get_random_place yet): one of the board's rows whose place has something chosen, from a
             random one on (made certain for the test: Cee, then Dee, then Alpha, the first with a place of their own) */
          await page.unroute(/supabase\.co\/rest\/v1\/rpc\/get_random_place/);
          await page.route(/supabase\.co\/rest\/v1\/rpc\/get_random_place/, route => json(route, { code: 'PGRST202', message: 'Could not find the function' }, 404));
          await page.evaluate(() => { window.__rnd = Math.random; Math.random = () => .6; });
          await page.click('#visitRand button'); await page.waitForTimeout(1200); await page.evaluate(() => { Math.random = window.__rnd; }); await page.waitForTimeout(1800); t = await tour();
          const gone = await page.evaluate(() => (document.querySelector('#visitRand .dx-rmsg') || {}).textContent || '');
          if (t.n !== 1 || t.title !== 'Visit Alpha’s place' || !t.visit || !/^Place 1 of 4 on the board/.test(t.gnav) || gone) problems.push(`${name} (${label}): without the server's pick, a random visit should be the next of the board's rows with a place of their own, with the board's tour (${JSON.stringify(t)}, line ${JSON.stringify(gone)})`);
          await page.keyboard.press('Escape'); await page.waitForTimeout(500);
        }
        await page.click('#boardSeg [data-board="streaks"]'); await page.waitForTimeout(800);
        const sb = await page.$$eval('#board .dx-visit', bs => bs.map(b => b.getAttribute('aria-label')));
        if (sb.length !== 4) problems.push(`${name} (${label}): the study streaks board's rows should be buttons too (${sb.join(' | ')})`);
      }
      errs.forEach(e => problems.push(`${name} (${label}): JavaScript error: ${e}`));
      notes.push(`${name} (${label}): rows as buttons, a visit, the plain line, focus back, the tour, a random visit from the whole class (and the board's rows before the release), both boards`);
      await page.close();
    }
    /* Everyone has Timmy (Ask Timmy, part 4; the only behavior since the redesign's release). widget/pet.js
       is served with its FULL_FROM at today, as a preview serves it (tools/preview/transform.js), so a Timmy met today starts
       at 100 HP. A first-time visitor on a new hub has Timmy on the bar with no introduction and no "Tap me!", at 100 HP, his
       birthday today and the pet-adopt badge sent; he wears the bootstrap's outfit (shop.equipped.outfit): nothing until the
       first key (outfits.js never loads with a page), then the outfit, kept on the device; on the next visit he wears it at
       once with no request; with nothing on he wears nothing, on Halloween too; shPet.fit() is the outfit's id; changing
       it in the customizer changes the bar without a reload; More has Timmy's place and the shop. The same first visit on
       the dashboard has him in the "you" card. */
    {
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date());
      /* widget/pet.js by itself (a live page) or inside the bundle the redesign's pages load it from */
      const petFrom = async page => page.route(/\/widget\/(pet|rest\.bundle)\.js(\?.*)?$/, async route => {
        /* the test's own file server can reset a reused connection (BUG-195): try twice, then say which file and go on */
        let r, t, err;
        for (let i = 0; i < 2 && !t; i++) try { r = await route.fetch(); t = await r.text(); } catch (e) { err = e; }
        if (!t) { problems.push(`widget/${widgetFile(route.request().url())} (${label}): the test's file server failed it twice (${(err && err.message || '').split('\n')[0]})`); return route.abort().catch(() => {}); }
        const from = /var FULL_FROM = "\d{4}-\d{2}-\d{2}";/;
        if (!from.test(t)) problems.push(`widget/${widgetFile(route.request().url())} (${label}): no \`var FULL_FROM = "yyyy-mm-dd";\` line (tools/preview/transform.js looks for it to point it at a preview's start)`);
        return route.fulfill({ response: r, body: t.replace(from, `var FULL_FROM = "${today}";`) });
      });
      const rank = { xp: 2400, journey: 0, tier: 1, level: 2, step: 4, gtier: 1, step_at: 2000, next_at: 3000, tier_at: 1500, steps: 63, answers: 300, correct: 220, days: 12, badges: [], dark_seen: [], boost: null };
      const equipped = { outfit: 'bow-tie' };
      const shop = () => ({ day: today, seasons: [], throwback: false, wallet: { earned: 300, spent: 0, balance: 300 }, items: [], costumes: [], snacks_today: [], boost: null, locked: [],
        inventory: ['bow-tie', 'sun-hat'].map(id => ({ id, at: '2026-11-01', how: 'bought' })), equipped: Object.assign({}, equipped) });
      const json = (route, body) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
      /* the pages above share this browser's storage, Timmy's tally of their answers too: start each page below as a
         first visit, once (a reload keeps it), with the rank this device last saw (so no rank-up card) and no tour */
      const fresh = page => page.addInitScript(() => { try { if (sessionStorage.getItem('sh_smoke_fresh')) return; sessionStorage.setItem('sh_smoke_fresh', '1');
        ['sh_pet_born', 'sh_pet_log', 'sh_pet_outfit', 'sh_pet_adopt_sent', 'sh_pet_perfect', 'sh_egg_holiday_test', 'sh_pref_pet', 'sh_pref_focus'].forEach(k => localStorage.removeItem(k));
        localStorage.setItem('sh_rank_g', '4'); localStorage.setItem('sh_rank_tier', '1'); localStorage.setItem('sh_rank_step', '4'); localStorage.setItem('sh_tour_done', '1'); } catch (e) {} });
      const game = async (page, adopts, asked) => {
        await petFrom(page);
        page.on('request', r => { if (/\/widget\/hub-art\/outfits\.js/.test(r.url())) asked.push('outfits.js'); });
        await page.route(/supabase\.co\/rest\/v1\/rpc\/get_widget_bootstrap_v2/, route => json(route, { rank, mastery: [], shop: shop(), pet_days: [] }));
        await page.route(/supabase\.co\/rest\/v1\/rpc\/get_my_shop/, route => json(route, shop()));
        await page.route(/supabase\.co\/rest\/v1\/rpc\/record_achievement/, route => { let a = {}; try { a = JSON.parse(route.request().postData() || '{}'); } catch (e) {} if (a.p_kind === 'pet-adopt') adopts.push(a.p_hub); return json(route, true); });
        await page.route(/supabase\.co\/rest\/v1\/rpc\/equip_item/, route => {
          let a = {}; try { a = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
          if (a.p_item) equipped[a.p_slot] = a.p_item; else delete equipped[a.p_slot];
          return json(route, { ok: true, equipped });
        });
      };
      /* what Timmy on the bar (or in the "you" card) has on, against the shop's drawings (outfits.js, once it is here) */
      const bar = (page, sel) => page.evaluate(sel => {
        const b = document.querySelector(sel), h = b ? b.innerHTML : '', O = window.SH_OUTFITS, P = window.shPet;
        /* the page serializes the drawing its own way (<path/> comes back as <path></path>): compare the parts the same way */
        const norm = x => { const g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.innerHTML = x; return g.innerHTML; };
        const kept = JSON.parse(localStorage.getItem('sh_pet_outfit') || 'null');
        /* the kit's drawing of it once outfits.js is here; before that (a later visit), the one kept on the device */
        const has = id => { const p = (O && O.parts[id]) || (kept && kept.id === id ? kept : null); return !!p && [p.top, p.face, p.back].filter(Boolean).every(x => h.includes(norm(x))); };
        return { here: !!b, dressed: /shpet-(hat|garb|back)/.test(h), bowTie: has('bow-tie'), sunHat: has('sun-hat'), fit: P ? P.fit() : null, hp: P ? P.hp() : null,
          kept, born: localStorage.getItem('sh_pet_born'), on: document.documentElement.classList.contains('sh-pet-on'),
          intro: !!document.querySelector('.shpet-dlg'), perch: !!document.querySelector('.shpet-perch, #petPerch, .dx-porch'), say: (document.querySelector('.shpet-say') || {}).textContent || '' };
      }, sel);
      for (const hub of engineHubs.slice(0, 1)) {
        const page = await context.newPage(), errs = [], adopts = [], asked = [], name = `${hub}, everyone has Timmy`;
        page.on('pageerror', e => errs.push(e.message));
        await game(page, adopts, asked);
        await fresh(page);
        await page.goto(BASE() + `hubs/${hub}/index.html#more`); await page.waitForTimeout(3000);
        let t = await bar(page, '.shpet-home .shpet-btn');
        if (!t.here || !t.on) problems.push(`${name} (${label}): a first-time visitor has no Timmy on the bar (${JSON.stringify({ here: t.here, on: t.on })})`);
        if (t.intro || /Tap me!/.test(t.say)) problems.push(`${name} (${label}): a first-time visitor got the adoption introduction or "Tap me!" (${JSON.stringify({ intro: t.intro, say: t.say })})`);
        if (t.born !== today || adopts.join() !== today) problems.push(`${name} (${label}): meeting Timmy should make today his birthday and send the pet-adopt badge once (${t.born}, ${adopts.join() || 'none sent'})`);
        if (t.hp !== 100) problems.push(`${name} (${label}): a Timmy met on or after the redesign's day should start at 100 HP, not ${t.hp}`);
        if (t.fit !== 'bow-tie') problems.push(`${name} (${label}): shPet.fit() should be the bootstrap's outfit id, bow-tie, not "${t.fit}"`);
        if (asked.length || t.dressed) problems.push(`${name} (${label}): with nothing kept on the device, outfits.js loaded with the page or he wore something before it came (${asked.join(', ')}, ${t.dressed})`);
        const tiles = await page.evaluate(() => [...document.querySelectorAll('a[href="#more/place"], a[href="#more/shop"]')].map(a => a.getAttribute('href')).join());
        if (!/#more\/place/.test(tiles) || !/#more\/shop/.test(tiles)) problems.push(`${name} (${label}): More should have Timmy's place and the shop for everyone (${tiles})`);
        await page.keyboard.press('Shift'); await page.waitForFunction(() => window.SH_OUTFITS, null, { timeout: 15000 }).catch(() => {}); await page.waitForTimeout(500);
        t = await bar(page, '.shpet-home .shpet-btn');
        if (!t.bowTie || !t.kept || t.kept.id !== 'bow-tie') problems.push(`${name} (${label}): after the first key Timmy should wear the bow tie and keep it on the device (${JSON.stringify({ bowTie: t.bowTie, kept: t.kept && t.kept.id })})`);
        /* the next visit: the kept drawing, no request, and no first hello */
        asked.length = 0;
        await page.reload(); await page.waitForTimeout(2500); await page.keyboard.press('Shift'); await page.waitForTimeout(800);
        t = await bar(page, '.shpet-home .shpet-btn');
        if (!t.bowTie || asked.length) problems.push(`${name} (${label}): on the next visit Timmy should wear the kept bow tie with no request for outfits.js (${t.bowTie}, ${asked.join(', ')})`);
        if (/Hi, I'm Timmy Tooth/.test(t.say) || adopts.length !== 1) problems.push(`${name} (${label}): the first hello or the badge came again on the next visit (${adopts.length} sent)`);
        /* nothing on, on Halloween: nothing on him (no holiday costume of his own) */
        delete equipped.outfit; asked.length = 0;
        await page.evaluate(() => localStorage.setItem('sh_egg_holiday_test', 'halloween'));
        await page.reload(); await page.waitForTimeout(2500);
        t = await bar(page, '.shpet-home .shpet-btn');
        if (t.dressed || t.fit !== '' || !t.kept || t.kept.id !== '' || asked.length) problems.push(`${name} (${label}): with nothing on, on Halloween, Timmy should wear nothing (${JSON.stringify({ dressed: t.dressed, fit: t.fit, kept: t.kept, asked })})`);
        /* the customizer: the sun hat goes on, and the bar follows without a reload */
        await page.evaluate(() => { location.hash = 'more/place'; });
        const card = await page.waitForSelector('.place-card .tpc.is-live', { timeout: 20000 }).catch(() => null);
        if (!card) problems.push(`${name} (${label}): Timmy's place didn't draw`);
        else {
          await card.click(); await page.waitForSelector('dialog.tpv[open]', { timeout: 8000 }).catch(() => {});
          await page.click('dialog.tpv [data-tp="customize"]').catch(() => {}); await page.waitForTimeout(500);
          await page.click('dialog.tpv .tpv-tile[data-pick="timmy"]').catch(() => {}); await page.waitForTimeout(500);
          const hat = await page.$('dialog.tpv .tpv-card[data-item="sun-hat"]');
          if (!hat) problems.push(`${name} (${label}): the customizer has no sun hat to put on`);
          else {
            await hat.click(); await page.waitForTimeout(1200);
            const s = await page.evaluate(() => { const b = document.querySelector('.shpet-home .shpet-btn'), K = window.SH_PLACE, o = K && K.OUTFITS.filter(x => x.id === 'sun-hat')[0], p = o && K.outfitParts(o.k);
              const norm = x => { const g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.innerHTML = x; return g.innerHTML; };
              return { on: !!p && !!b && b.innerHTML.includes(norm(p.top)), fit: window.shPet.fit(), kept: (JSON.parse(localStorage.getItem('sh_pet_outfit') || '{}') || {}).id }; });
            if (!s.on || s.fit !== 'sun-hat' || s.kept !== 'sun-hat' || equipped.outfit !== 'sun-hat') problems.push(`${name} (${label}): putting on the sun hat at his place should dress Timmy on the bar at once (${JSON.stringify(s)}, saved: ${equipped.outfit})`);
          }
          await page.keyboard.press('Escape'); await page.waitForTimeout(300);
        }
        errs.forEach(e => problems.push(`${name} (${label}): JavaScript error: ${e}`));
        notes.push(`${name} (${label}): a first visit, his outfit kept, nothing on at Halloween, the customizer`);
        await page.close();
      }
      {
        equipped.outfit = 'bow-tie';
        const page = await context.newPage(), errs = [], adopts = [], asked = [], name = 'dashboard, everyone has Timmy';
        page.on('pageerror', e => errs.push(e.message));
        await game(page, adopts, asked);
        await fresh(page);
        await page.goto(BASE() + 'index.html'); await page.waitForTimeout(3000);
        let t = await bar(page, '#petHome .shpet-btn');
        const house = await page.evaluate(() => !!document.querySelector('#petHome.shpet-house:not([hidden])'));
        if (!house || !t.here || t.perch || t.intro) problems.push(`${name} (${label}): a first-time visitor should find Timmy in the "you" card, with no porch, perch or introduction (${JSON.stringify({ house, here: t.here, perch: t.perch, intro: t.intro })})`);
        if (t.hp !== 100 || t.born !== today || adopts.join() !== today) problems.push(`${name} (${label}): meeting him starts him at 100 HP, today, with the badge sent (${t.hp}, ${t.born}, ${adopts.join() || 'none'})`);
        if (t.fit !== 'bow-tie') problems.push(`${name} (${label}): shPet.fit() should be bow-tie, not "${t.fit}"`);
        await page.keyboard.press('Shift'); await page.waitForFunction(() => window.SH_OUTFITS, null, { timeout: 15000 }).catch(() => {}); await page.waitForTimeout(500);
        t = await bar(page, '#petHome .shpet-btn');
        if (!t.bowTie) problems.push(`${name} (${label}): Timmy in the "you" card should wear the bow tie`);
        errs.forEach(e => problems.push(`${name} (${label}): JavaScript error: ${e}`));
        notes.push(`${name} (${label}): a first visit, in his outfit`);
        await page.close();
      }
    }
    /* The trophy case and the cards on the design system (phase 4, session 6; vault/tasks/2026-11-12-redesign-trophy-case-and-cards.md).
       A new hub on the game layer whose profile won First Hundred, a run of 25, the Tooth Fairy, the Golden Probe and Full
       Arch in this hub: none of the case's files (widget/trophies.js and .css, widget/hub-art/trophies.js) load with the
       page; a right answer grows no Full Arch chart and Settings has no Full Arch switch; More, Stats and trophies shows 27
       trophies, 16 on the Secrets shelf, no Full Arch among them, and Full Arch alone on the Retired shelf as "Full Arch
       (retired)"; a secret not found is its silhouette, its name nowhere in the page or a label; a won trophy is its
       drawing; every button has a fixed data-sht; the scoreboard, a card per lecture and the achievements are under it.
       Without Full Arch won there is no Retired shelf. A trophy the device hasn't seen plays the new card (drawn, "New
       trophy", in the rank's metal, "... of 27 in your case") and a tap skips it. On the new dashboard the "you" card opens
       the case. A card after a level-up card still plays (BUG-116). */
    {
      const json = (route, body) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
      const caseFiles = /\/widget\/(trophies\.(js|css)|hub-art\/trophies\.js)(\?|$)/;
      const rank = badges => ({ xp: 2400, journey: 0, tier: 1, level: 2, step: 4, gtier: 1, step_at: 2000, next_at: 3000, tier_at: 1500, steps: 63, answers: 300, correct: 220, days: 12, badges, dark_seen: [], boost: null });
      const SHARES = [['answers-100', 166], ['run-25', 87], ['fairy', 58], ['golden', 41], ['boss', 23], ['fullarch', 15], ['journey-0', 6]].map(([kind, n]) => ({ kind, n, total: 212 }));
      /* a page on the game layer with these trophies won; `seen` is what this device last saw (null: a first look) */
      const tpage = async (badges, seen, dash) => {
        const page = await context.newPage(), got = [], errs = [];
        page.on('pageerror', e => errs.push(e.message));
        page.on('request', r => { if (caseFiles.test(r.url())) got.push(r.url().replace(/^.*\/widget\//, '')); });
        await page.route(/supabase\.co\/rest\/v1\/rpc\/get_widget_bootstrap_v2/, route => json(route, { rank: rank(badges), mastery: [], pet_days: [] }));
        await page.route(/supabase\.co\/rest\/v1\/rpc\/get_trophy_stats_v2/, route => json(route, SHARES));
        await page.addInitScript(seen => { try { if (sessionStorage.getItem('sh_smoke_tc')) return; sessionStorage.setItem('sh_smoke_tc', '1');
          localStorage.setItem('sh_rank_g', '4'); localStorage.setItem('sh_rank_tier', '1'); localStorage.setItem('sh_rank_step', '4'); localStorage.setItem('sh_tour_done', '1');
          ['sh_bowl_trophy', 'sh_pref_celebrate', 'sh_pref_arch', 'sh_pref_eggs', 'sh_pref_focus'].forEach(k => localStorage.removeItem(k));
          if (seen === null) localStorage.removeItem('sh_trophy_seen'); else localStorage.setItem('sh_trophy_seen', seen); } catch (e) {} }, seen);
        return { page, got, errs };
      };
      /* n right answers, as the hub's widget hears them */
      const answer = (page, n) => page.evaluate(n => { const t = document.querySelector('script[data-answered-event]'), e = t && t.getAttribute('data-answered-event');
        for (let i = 0; e && i < n; i++) document.dispatchEvent(new CustomEvent(e, { detail: { correct: true, qid: 'smoke-' + i } })); return !!e; }, n);
      for (const hub of engineHubs.slice(0, 1)) {
        const name = `${hub}, the trophy case`;
        let { page, got, errs } = await tpage(['answers-100', 'run-25', 'fairy', 'golden', 'fullarch:' + hub], null);
        await page.goto(BASE() + `hubs/${hub}/index.html`); await page.waitForTimeout(3000);
        await page.waitForFunction(() => window.shRanks && [...document.scripts].some(s => /\/eggs\.js/.test(s.src)), null, { timeout: 15000 }).catch(() => {});
        if (got.length) problems.push(`${name} (${label}): ${got.join(', ')} loaded with the page (the case loads when it is first opened)`);
        if (!(await answer(page, 3))) problems.push(`${name} (${label}): couldn't find the widget's answered event`);
        await page.waitForTimeout(600);
        if (await page.$('.sh-egg-arch')) problems.push(`${name} (${label}): the Full Arch chart showed after a right answer (it is retired on the redesign)`);
        await page.evaluate(() => { location.hash = 'more/settings'; }); await page.waitForTimeout(700);
        const set = await page.evaluate(() => { const v = document.querySelector('.hx-view:not([hidden])'); return v ? v.innerText : ''; });
        if (!/Rank-up and trophy cards/.test(set) || /Full Arch/.test(set)) problems.push(`${name} (${label}): Settings should list the extras without Full Arch`);
        await page.evaluate(() => { location.hash = 'more/stats'; });
        const cab = await page.waitForSelector('.sht .sht-cab', { timeout: 20000 }).catch(() => null);
        await page.waitForTimeout(1000);
        if (!cab) problems.push(`${name} (${label}): More, Stats and trophies didn't draw the trophy case`);
        else {
          const c = await page.evaluate(() => {
            const q = s => [...document.querySelectorAll(s)], k = b => b.getAttribute('data-k');
            /* the 27 are the first three shelves; each hub's own eight sit on a shelf of their own under them (Sam, 2026-11-13) */
            const main = q('.sht-shelf:not(.is-retired):not(.is-hub) [data-sht="trophy"]'), ret = q('.sht-shelf.is-retired [data-sht="trophy"]');
            const hubShelves = q('.sht-shelf.is-hub').map(s => ({ h: ((s.querySelector('h3') || {}).textContent || '').trim(), n: s.querySelectorAll('[data-sht="trophy"]').length, keys: [...s.querySelectorAll('[data-sht="trophy"]')].every(b => /:/.test(k(b))),
              medals: s.querySelectorAll('[data-k^="mastery-"] .sht-obj svg').length }));
            const secrets = q('.sht-shelf').filter(s => /^Secrets/.test((s.querySelector('h3') || {}).textContent || ''))[0];
            const boss = document.querySelector('[data-sht="trophy"][data-k="boss"]'), first = document.querySelector('[data-sht="trophy"][data-k="answers-100"]');
            const words = document.body.innerHTML + ' ' + q('[aria-label], [title]').map(e => (e.getAttribute('aria-label') || '') + ' ' + (e.getAttribute('title') || '')).join(' ');
            return { hubShelves, n: main.length, secrets: secrets ? secrets.querySelectorAll('[data-sht="trophy"]').length : 0, arch: main.some(b => k(b) === 'fullarch'),
              ret: ret.map(b => k(b) + ':' + b.textContent.trim()).join(), boss: !!boss && boss.classList.contains('is-secret') && /^Secret trophy/.test(boss.getAttribute('aria-label') || '') && !!boss.querySelector('.sht-obj svg path'),
              named: /Final Blow/.test(words), first: !!first && first.classList.contains('is-won') && first.querySelectorAll('.sht-obj svg *').length > 3,
              unnamed: q('.sht button').filter(b => !b.getAttribute('data-sht')).length, boards: !!document.querySelector('[data-sht="boards"]'),
              board: !!document.querySelector('.stx-board .stx-gauge, .stx-board .stx-tiles'), lecs: q('.stx-lec').length, ach: !!document.querySelector('.stx-ach .stx-badges') };
          });
          const lecs = await page.evaluate(() => (window.SH_EXPORT && window.SH_EXPORT.lectures || []).length);
          if (c.n !== 27 || c.secrets !== 16) problems.push(`${name} (${label}): the case should hold 27 trophies, 16 of them secret (${c.n}, ${c.secrets})`);
          if (!c.hubShelves.length || c.hubShelves.some(s => s.n !== 8 || !s.keys || s.medals !== 4)) problems.push(`${name} (${label}): the case should have a shelf for this hub with its 8 trophies, each keyed "<trophy>:<hub>", the four mastery medals drawn (${JSON.stringify(c.hubShelves)})`);
          if (c.arch) problems.push(`${name} (${label}): Full Arch is among the case's trophies (it is retired: only on the Retired shelf, for those who won it)`);
          if (c.ret !== 'fullarch:Full Arch (retired)') problems.push(`${name} (${label}): Full Arch, won here, should sit alone on the Retired shelf as "Full Arch (retired)" (${c.ret || 'none'})`);
          if (!c.boss || c.named) problems.push(`${name} (${label}): a secret not found should be its silhouette, announced as a secret, its name nowhere in the page (${JSON.stringify({ boss: c.boss, named: c.named })})`);
          if (!c.first) problems.push(`${name} (${label}): a won trophy should show its drawing, lit`);
          if (c.unnamed) problems.push(`${name} (${label}): ${c.unnamed} button(s) in the case have no fixed data-sht, so click counts would record their words`);
          if (!c.boards) problems.push(`${name} (${label}): the case has no Leaderboards button`);
          if (!c.board || c.lecs !== lecs || !c.ach) problems.push(`${name} (${label}): under the case: the scoreboard, a card for each of ${lecs} lectures and the achievements (${JSON.stringify({ board: c.board, lecs: c.lecs, ach: c.ach })})`);
        }
        errs.forEach(e => problems.push(`${name} (${label}): JavaScript error: ${e}`));
        await page.close();
        /* without Full Arch won: no Retired shelf */
        ({ page, got, errs } = await tpage(['answers-100'], null));
        await page.goto(BASE() + `hubs/${hub}/index.html#more/stats`); await page.waitForTimeout(1500);
        await page.waitForSelector('.sht .sht-cab', { timeout: 20000 }).catch(() => null);
        if (await page.$('.sht-shelf.is-retired')) problems.push(`${name} (${label}): a Retired shelf showed for someone who never won Full Arch`);
        /* BUG-116: a card after a level-up card still plays (a local `done` in levelNow's close() once stopped the queue) */
        await page.evaluate(() => window.shRanks.preview('level', 4, 2));
        const lv = await page.waitForSelector('.sh-ru-lv:not(.sh-ru-tr)', { timeout: 15000 }).catch(() => null);
        if (!lv) problems.push(`${name} (${label}): shRanks.preview(level) showed no level-up card`);
        else {
          await page.waitForTimeout(1500); await lv.click().catch(() => {});
          await page.evaluate(() => window.shRanks.preview('tier', 5, 6));
          if (!(await page.waitForSelector('.sh-ru', { timeout: 8000 }).catch(() => null))) problems.push(`${name} (${label}): after a level-up card no later card played (BUG-116)`);
          else { await page.waitForTimeout(800); await page.keyboard.press('Escape'); await page.waitForTimeout(900); }
        }
        await page.close();
        /* a trophy this device hasn't seen yet: the new card, skipped with a tap */
        ({ page, got, errs } = await tpage(['answers-100', 'fairy', 'golden'], 'fairy,golden'));
        await page.goto(BASE() + `hubs/${hub}/index.html`);
        const card = await page.waitForSelector('.sh-ru-tr', { timeout: 20000 }).catch(() => null);
        if (!card) problems.push(`${name} (${label}): a trophy won since this device last looked played no card`);
        else {
          await page.waitForTimeout(1200);
          const t = await page.evaluate(() => { const el = document.querySelector('.sh-ru-tr');
            return { metal: el.getAttribute('data-metal'), eye: el.querySelector('.sh-ru-lv-eye').textContent, drawn: !!el.querySelector('.sh-ru-lv-coin svg[viewBox="0 0 64 64"]'),
              rare: (el.querySelector('.sh-ru-tr-rare') || {}).textContent || '', css: !!document.getElementById('sh-trophies-css'), frame: getComputedStyle(el).borderTopWidth }; });
          if (t.metal !== 'gold' || t.eye !== 'New trophy' || !t.drawn || !/3 of 27 in your case/.test(t.rare) || !t.css || t.frame !== '3px')
            problems.push(`${name} (${label}): the new trophy card should be drawn on the design system ("New trophy", the drawing, "3 of 27 in your case", widget/trophies.css): ${JSON.stringify(t)}`);
          await card.click(); await page.waitForTimeout(800);
          if (await page.$('.sh-ru-tr')) problems.push(`${name} (${label}): a tap didn't skip the trophy card`);
        }
        errs.forEach(e => problems.push(`${name}, the card (${label}): JavaScript error: ${e}`));
        await page.close();
        notes.push(`${name} (${label}): 27 trophies (16 secret), Full Arch only as retired, the stats under the case, and the new trophy card`);
      }
      {
        const name = 'dashboard, the trophy case', { page, got, errs } = await tpage(['answers-100', 'fairy'], null);
        await page.goto(BASE() + 'index.html'); await page.waitForTimeout(2000);
        await page.mouse.wheel(0, 200);
        const btn = await page.waitForSelector('[data-dx="trophies"]', { timeout: 20000 }).catch(() => null);
        if (got.length) problems.push(`${name} (${label}): ${got.join(', ')} loaded before the case was opened`);
        if (!btn) problems.push(`${name} (${label}): the "you" card has no Trophy case button`);
        else {
          await btn.click();
          const ok = await page.waitForSelector('.dx-dlg .sht-cab', { timeout: 20000 }).catch(() => null); await page.waitForTimeout(600);
          const n = await page.$$eval('.dx-dlg .sht-shelf:not(.is-retired):not(.is-hub) [data-sht="trophy"]', b => b.length);
          if (!ok || n !== 27) problems.push(`${name} (${label}): the "you" card should open the case with 27 trophies (${n})`);
          const hs = await page.$$eval('.dx-dlg .sht-shelf.is-hub', ss => ss.map(s => s.querySelectorAll('[data-sht="trophy"]').length));
          if (!hs.length || hs.some(x => x !== 8)) problems.push(`${name} (${label}): the case on the dashboard should have a shelf of 8 for each hub on the engine (${hs.join(', ') || 'none'})`);
          await page.keyboard.press('Escape');
        }
        errs.forEach(e => problems.push(`${name} (${label}): JavaScript error: ${e}`));
        await page.close();
        notes.push(`${name} (${label}): the "you" card's Trophy case button opens the case`);
      }
    }
    await context.close();
  }
  // top bars and tab rows (2026-11-04): at the widths and text sizes where they used to break, every control in the
  // dashboard's and each hub's top bar, the mode tabs and the dashboard's arcade rows is fully on screen, not clipped
  // by a hidden scrollbar, and every mode tab shows its label
  for (const tb of PART === 'desktop' ? [] : [{ width: 320, height: 640 }, { width: 1001, height: 800 }, { width: 390, height: 844, size: 'xxlarge' }]) {
    const context = await browser.newContext({ viewport: { width: tb.width, height: tb.height }, serviceWorkers: 'block' });
    await stub(context);
    await context.addInitScript(size => { try { localStorage.setItem('sh_tour', 'no'); localStorage.setItem('sh_tour_hub', 'no'); if (size) localStorage.setItem('sh_pref_size', size); } catch (e) {} }, tb.size || '');
    const label = `${tb.width}px${tb.size ? ', largest text' : ''}`;
    for (const url of ['index.html', ...hubs.map(h => `hubs/${h}/index.html`)]) {
      const page = await context.newPage();
      await page.goto(BASE() + url); await page.waitForTimeout(700);
      await page.click('.sh-archived-stay', { timeout: 500 }).catch(() => {});
      await page.waitForTimeout(150);
      const bad = await page.evaluate(() => {
        const out = [], vw = document.documentElement.clientWidth;
        if (document.documentElement.scrollWidth > vw + 1) out.push(`page scrolls sideways by ${document.documentElement.scrollWidth - vw}px`);
        const els = document.querySelectorAll('header.hub-header button, header.hub-header a, .topbar button, .topbar a, .hx-bar a, .hx-bar button, .hx-strip button, #modeSwitch [data-mode], #arcadeHubs button, #gameTabs button, .dx-bar a, .dx-bar button, .dx-tab, #boardSeg button, .dx-actions a');
        for (const el of els) {
          const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || el.closest('[hidden]')) continue;
          const r = el.getBoundingClientRect(); if (!r.width && !r.height) continue;
          const name = (el.getAttribute('aria-label') || el.textContent || el.id || '').trim().replace(/\s+/g, ' ').slice(0, 30);
          if (r.right > vw + 1 || r.left < -1) { out.push(`"${name}" is past the screen's edge`); continue; }
          for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
            if (/(hidden|auto|scroll|clip)/.test(getComputedStyle(a).overflowX)) { const ar = a.getBoundingClientRect(); if (r.right > ar.right + 1 || r.left < ar.left - 1) out.push(`"${name}" is cut off inside ${a.id ? '#' + a.id : a.className}`); break; }
          }
        }
        document.querySelectorAll('#modeSwitch [data-mode]').forEach(b => { const l = b.querySelector('.mode-label'); if (l && (getComputedStyle(l).display === 'none' || !l.textContent.trim())) out.push(`the ${b.getAttribute('data-mode')} tab hides its label`); });
        return out;
      });
      bad.forEach(b => problems.push(`${url} (${label}): ${b}`));
      // the Settings sheet at the largest text (BUG-013): every row of buttons stays inside the sheet and the screen
      if (tb.size) {
        const off = await page.evaluate(() => {
          const btn = document.getElementById('setBtn'); if (btn) btn.click();
          const sp = document.getElementById('shstat-settingspanel'); if (sp) sp.classList.add('is-open');
          const out = [], vw = document.documentElement.getBoundingClientRect();
          document.querySelectorAll('.set-seg button, .shset-seg button, .dx-dlg .seg button').forEach(b => {
            const r = b.getBoundingClientRect(); if (!r.width) return;
            const box = (b.closest('#shstat-settingspanel') || b.closest('.dx-dlgcard') || document.documentElement).getBoundingClientRect();
            if (r.right > Math.min(vw.right, box.right) + 1 || r.left < Math.max(vw.left, box.left) - 1) {
              const seg = b.parentElement; out.push(`Settings: "${b.textContent.trim()}" (${seg.dataset.set || seg.dataset.key || seg.dataset.pref || 'a row'}) runs past the sheet's edge`);
            }
          });
          return out;
        });
        off.forEach(b => problems.push(`${url} (${label}): ${b}`));
      }
      await page.close();
    }
    notes.push(`top bars and tab rows checked at ${label}${tb.size ? ', with the Settings sheet' : ''}`);
    await context.close();
  }
  // the dashboard's pop-ups at X-Large and XX-Large text on a small phone (BUG-184 to BUG-187, 2026-11-19): the text size zooms
  // <html>, which makes 100vw and 100vh bigger than the screen, so each is sized by its own box or a container instead.
  // The More menu, Settings, Timmy's checkup and his place's full view each stay on the screen, don't scroll sideways
  // and keep every button inside them
  for (const lt of PART === 'desktop' ? [] : [{ width: 320, height: 640, size: 'xxlarge' }, { width: 375, height: 667, size: 'xlarge' }]) {
    const context = await browser.newContext({ viewport: { width: lt.width, height: lt.height }, serviceWorkers: 'block' });
    await stub(context);
    await context.addInitScript(size => { try { localStorage.setItem('sh_pref_size', size); } catch (e) {} }, lt.size);
    const label = `${lt.width}px, ${lt.size === 'xxlarge' ? 'XX-Large' : 'X-Large'} text`;
    const page = await context.newPage();
    await page.goto(BASE() + 'index.html'); await page.waitForTimeout(700);
    /* a box on the screen: inside it on all four sides, no sideways scroll, and each of its controls inside it */
    const onScreen = (sel, what) => page.evaluate(([sel, what]) => {
      const el = document.querySelector(sel); if (!el) return [`${what} didn't open`];
      const out = [], r = el.getBoundingClientRect(), W = innerWidth, H = innerHeight;
      if (r.left < -1 || r.right > W + 1) out.push(`${what} runs past the screen's side (${Math.round(r.left)} to ${Math.round(r.right)} of ${W}px)`);
      if (r.top < -1 || r.bottom > H + 1) out.push(`${what} is taller than the screen (${Math.round(r.top)} to ${Math.round(r.bottom)} of ${H}px)`);
      if (el.scrollWidth > el.clientWidth + 1) out.push(`${what} scrolls sideways by ${el.scrollWidth - el.clientWidth}px`);
      for (const c of el.querySelectorAll('button, a')) {
        const cs = getComputedStyle(c), b = c.getBoundingClientRect(); if (cs.display === 'none' || cs.visibility === 'hidden' || !b.width || c.closest('[hidden]') || c.closest('.tsh-rcards')) continue;   /* a shop shelf scrolls sideways on a phone */
        if (b.left < Math.max(0, r.left) - 1 || b.right > Math.min(W, r.right) + 1) { out.push(`${what}: "${(c.getAttribute('aria-label') || c.textContent).trim().replace(/\s+/g, ' ').slice(0, 30)}" runs past its edge`); break; }
      }
      return out;
    }, [sel, what]);
    const report = list => list.forEach(b => problems.push(`index.html (${label}): ${b}`));
    // the More menu (BUG-184)
    await page.click('#menuBtn'); await page.waitForTimeout(150);
    report(await onScreen('#dxMenu:not([hidden])', 'the More menu'));
    await page.click('#menuBtn'); await page.waitForTimeout(100);
    // Settings (BUG-186)
    await page.click('#setBtn'); await page.waitForTimeout(300);
    report(await onScreen('.dx-dlg .dx-dlgcard', 'Settings'));
    await page.keyboard.press('Escape'); await page.waitForTimeout(150);
    await page.evaluate(() => { const d = document.querySelector('.dx-dlg'); if (d) d.remove(); });
    // Timmy's checkup card (BUG-187): his house draws on the first scroll, tap or key
    await page.evaluate(() => window.scrollTo(0, 300)); await page.keyboard.press('Shift');
    const check = await page.waitForSelector('[data-check]', { timeout: 8000 }).catch(() => null);
    if (!check) problems.push(`index.html (${label}): Timmy's house has no Checkup button`);
    else {
      await page.evaluate(() => document.querySelector('[data-check]').click()); await page.waitForTimeout(400);
      report(await onScreen('.shpet-dlg .shpet-card', "Timmy's checkup"));
      await page.evaluate(() => { const d = document.querySelector('.shpet-dlg'); if (d) d.remove(); });
    }
    // Timmy's place's full view (BUG-185)
    const tpc = await page.waitForSelector('.tpc', { timeout: 8000 }).catch(() => null);
    if (!tpc) problems.push(`index.html (${label}): the "you" card has no Timmy's place`);
    else {
      await tpc.click();
      const dlg = await page.waitForSelector('dialog.tpv[open]', { timeout: 10000 }).catch(() => null);
      if (!dlg) problems.push(`index.html (${label}): tapping Timmy's place didn't open its full view`);
      else { await page.waitForTimeout(600); report(await onScreen('dialog.tpv[open]', "Timmy's place")); }
      await page.keyboard.press('Escape'); await page.waitForTimeout(200);
      await page.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => { try { d.close(); } catch (e) {} }));
    }
    // Timmy's Shop and an item's sheet, and Ask Timmy's panel (BUG-190): sized in % of the screen, not vw and dvh
    const shopBtn = await page.$('.dx-shopbtn');
    if (shopBtn) {
      await page.evaluate(() => document.querySelector('.dx-shopbtn').click());
      const card = await page.waitForSelector('dialog.tsh-dlg[open] [data-shop="item"]', { timeout: 8000 }).catch(() => null);
      if (!card) problems.push(`index.html (${label}): Timmy's Shop didn't open with its items`);
      else {
        await page.waitForTimeout(300); report(await onScreen('dialog.tsh-dlg[open] .tsh-dlgin', "Timmy's Shop"));
        await page.evaluate(() => document.querySelector('dialog.tsh-dlg[open] [data-shop="item"]').click());
        const sheet = await page.waitForSelector('dialog.tsh-sheet[open] .tsh-item', { timeout: 4000 }).catch(() => null);
        if (!sheet) problems.push(`index.html (${label}): an item in Timmy's Shop didn't open its sheet`);
        else { await page.waitForTimeout(300); report(await onScreen('dialog.tsh-sheet[open] .tsh-item', "a shop item's sheet")); }
      }
      await page.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => { try { d.close(); } catch (e) {} }));
    }
    if (await page.evaluate(() => !!(window.shAsk && window.shAsk.available && window.shAsk.available()))) {
      await page.evaluate(() => window.shAsk.open()); await page.waitForTimeout(600);
      report(await onScreen('.ska.is-on .ska-panel', "Ask Timmy's panel"));
      if (await page.evaluate(() => { const p = document.querySelector('.ska.is-on .ska-panel'); return !!p && p.scrollTop > 1; })) problems.push(`index.html (${label}): Ask Timmy's panel is taller than its box (its header scrolled off the top)`);
      await page.evaluate(() => window.shAsk.close());
    }
    notes.push(`the dashboard's More menu, Settings, Timmy's checkup, his place, the shop and Ask Timmy fit the screen at ${label}`);
    await context.close();
  }
  // every view of a hub on the engine fits a 320px phone at the largest text (BUG-168, 2026-11-19): the check above opens
  // only Home, and the arcade lobby, the Question Bank, Notes, Exam Hints, the cram sheet, Stats and Settings all scrolled
  // sideways there. The largest text zooms the page 1.45x, so it lays out in 220px: if it fits here, it fits on any phone.
  for (const hub of PART === 'desktop' ? [] : engineHubs) {
    const context = await browser.newContext({ viewport: { width: 320, height: 640 }, serviceWorkers: 'block', isMobile: true, hasTouch: true });
    await stub(context);
    await context.addInitScript(() => { try { localStorage.setItem('sh_tour', 'no'); localStorage.setItem('sh_tour_hub', 'no'); localStorage.setItem('sh_pref_size', 'xxlarge'); } catch (e) {} });
    const page = await context.newPage(); const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.goto(BASE() + `hubs/${hub}/index.html#home`); await page.waitForTimeout(900);
    await page.click('.sh-archived-stay', { timeout: 500 }).catch(() => {});
    const views = ['home', 'notes', 'questions', 'questions/mock', 'more', 'more/arcade', 'more/hints', 'more/cram', 'more/side', 'more/stats', 'more/settings', 'more/timmy'];
    /* each arcade game too, once started (2026-11-20, the inbox's "The arcade games themselves at 320 px with the largest
       text"): #more/arcade/<game>, then its Play button */
    const games = await page.evaluate(() => (((window.SH_HUB || {}).arcade || {}).games || []).map(g => g.id)).catch(() => []);
    for (const v of views.concat(games.map(g => 'more/arcade/' + g))) {
      const game = /^more\/arcade\/./.test(v);
      if (game) { await page.evaluate(() => { location.hash = 'more'; }); await page.waitForTimeout(300); }
      await page.evaluate(v => { location.hash = v; }, v); await page.waitForTimeout(v === 'more/arcade' || game ? 1500 : 700);
      if (game) { const st = await page.$('#panel-arcade [data-start]'); if (st) { await st.click().catch(() => {}); await page.waitForTimeout(1200); } }
      /* measured against the layout width, naming the element that reaches furthest past it, or the one whose words or
         drawing spill past its own box (a long word, a decoration): fixed parts (the bar, Timmy) can't scroll the page */
      const r = await page.evaluate(() => {
        const cw = document.documentElement.clientWidth, w = document.documentElement.scrollWidth - cw;
        if (w <= 1) return null;
        const hidden = e => { for (let p = e; p && p !== document.documentElement; p = p.parentElement) { const cs = getComputedStyle(p); if (cs.position === 'fixed' || (p !== e && cs.overflowX !== 'visible')) return true; } return false; };
        let worst = null, spill = null;
        for (const e of document.querySelectorAll('.hx-view *')) {
          const b = e.getBoundingClientRect(); if (!b.width || hidden(e)) continue;
          if (b.right > cw + 1 && (!worst || b.right > worst.b.right)) worst = { e, b };
          if (e.scrollWidth > e.clientWidth + 1 && e.clientWidth && getComputedStyle(e).overflowX === 'visible' && !e.querySelector('*:not(br)')) spill = spill || { e, b };
        }
        const hit = worst || spill; if (!hit) return { w, who: 'no element named' };
        const e = hit.e, cls = typeof e.className === 'string' ? e.className.trim().split(/\s+/).filter(Boolean).slice(0, 2) : [];
        return { w, who: e.tagName.toLowerCase() + cls.map(c => '.' + c).join('') + ` "${(e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30)}"` };
      });
      if (r) problems.push(`${hub} #${v} (320px, largest text): the page scrolls sideways by ${r.w}px (furthest out: ${r.who})`);
    }
    /* BUG-126: a toast is never under Timmy, the streak flame or the Listen player at the bottom of a phone */
    const under = await page.evaluate(() => {
      const host = document.getElementById('hxToast'); if (!host) return 'no toast host (#hxToast)';
      host.insertAdjacentHTML('beforeend', '<div class="hx-toast" role="status" data-smoke>The Yellow Body finished: +50 XP. Synced 12 questions from your other devices</div>');
      const t = host.lastElementChild.getBoundingClientRect(), out = [];
      for (const sel of ['.shpet-home', '#sh-flame', '.sh-tts-dock', '.sh-pod-dock', '#hxBar']) {
        const e = document.querySelector(sel); if (!e || getComputedStyle(e).display === 'none') continue;
        const b = e.getBoundingClientRect(); if (b.width && b.height && b.left < t.right && b.right > t.left && b.top < t.bottom && b.bottom > t.top) out.push(sel);
      }
      host.lastElementChild.remove();
      return out.join(', ');
    });
    if (under) problems.push(`${hub} (320px, largest text): a toast sits under ${under} (BUG-126)`);
    errs.forEach(e => problems.push(`${hub} (320px, largest text): JavaScript error: ${e}`));
    notes.push(`${hub}: ${views.length} views${games.length ? ` and ${games.length} arcade games, started,` : ''} fit a 320px phone at the largest text, and a toast is clear of Timmy and the bar`);
    await context.close();
  }
  await browser.close(); server.close();
  notes.forEach(n => console.log('  ' + n));
  if (problems.length) { console.error('\n✗ ' + problems.length + ' problem(s):\n' + problems.map(p => '  - ' + p).join('\n')); process.exit(1); }
  console.log(`\n✓ smoke test${PART === 'phone' ? '' : ' and question lint'} passed: ${hubsWhy}${PART ? `, the ${PART} half` : ''}`);
})().catch(e => { console.error(e); process.exit(1); });
