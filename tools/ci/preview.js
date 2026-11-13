// Preview safety check (RELEASE_TEST_PLAN.md, "Data isolation"): CI runs it on every PR.
//  1. builds a static preview and checks every file (noindex, no production host or key, the runtime first in <head>);
//  2. opens the dashboard, About, the admin page and every hub in that preview as each test account and fails if any
//     request heads for Supabase, if a page throws, or if the runtime didn't load;
//  3. drives real write paths (an answer, a report, a name change) and checks they landed in the fixtures, and that
//     the admin RPCs refuse a wrong secret;
//  4. tries to reach production on purpose (fetch, XHR, beacon, WebSocket, image) and checks each one is refused
//     without a single request going out.
//   npm i --no-save playwright && npx playwright install chromium && node tools/ci/preview.js
'use strict';
const fs = require('fs'), path = require('path'), os = require('os');
const { build, check } = require('../preview/build');
const { start } = require('../preview/serve');
const T = require('../preview/transform');
const L = require('../release/lib');

const problems = [], notes = [];
(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sh-preview-'));
  const b = build(path.join(dir, 'site'), { audio: 'none', label: 'CI preview check' });
  check(b.out).forEach(p => problems.push('build: ' + p));
  notes.push(`built ${b.count} files (${(b.bytes / 1048576).toFixed(1)} MB) in ${b.out}`);
  const srv = await start({ dir: b.out });
  const base = srv.url;
  const browser = await L.launch();
  const personas = JSON.parse(fs.readFileSync(path.join(__dirname, '../preview/fixtures/personas.json'), 'utf8')).personas.map(p => p.id);
  const status = L.hubStatus();
  const live = L.hubs().filter(h => status[h] === 'live');

  async function visit(context, url, label, fn){
    const page = await context.newPage(), errs = [];
    page.on('pageerror', e => errs.push(e.message));
    const res = await page.goto(base + url);
    if (!res || !/noindex/.test(res.headers()['x-robots-tag'] || '')) problems.push(`${label}: response has no X-Robots-Tag: noindex`);
    await L.settle(page);
    const info = await page.evaluate(() => ({ rt: !!window.__shPreview, blocked: window.__shPreview ? window.__shPreview.blocked() : -1,
      robots: (document.querySelector('meta[name="robots"]') || {}).content || '', title: document.title, persona: window.__shPreview && window.__shPreview.persona.id }));
    if (!info.rt) problems.push(`${label}: the preview runtime didn't load`);
    if (info.blocked > 0) problems.push(`${label}: the page itself tried to reach production ${info.blocked} time(s) (see its write log)`);
    if (!/noindex/.test(info.robots)) problems.push(`${label}: no noindex robots meta`);
    if (!/^Preview · /.test(info.title)) problems.push(`${label}: the title doesn't say Preview`);
    if (!(await page.isVisible('#shpv-pill'))) problems.push(`${label}: the Preview button isn't showing`);
    if (fn) await fn(page, info);
    errs.forEach(e => problems.push(`${label}: JavaScript error: ${e}`));
    await page.close();
    return info;
  }

  for (const vp of [{ width: 1366, height: 860 }, { width: 390, height: 844, isMobile: true }]) {
    const tag = vp.isMobile ? 'phone' : 'desktop';
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.isMobile, hasTouch: !!vp.isMobile, serviceWorkers: 'block' });
    const g = await L.guard(context);
    for (const id of vp.isMobile ? ['returning'] : personas) {
      await visit(context, `index.html?persona=${id}`, `dashboard as ${id} (${tag})`, async (page, info) => { if (info.persona !== id) problems.push(`dashboard: asked for test account ${id}, got ${info.persona}`); });
    }
    await visit(context, 'about/', `About (${tag})`);
    for (const hub of L.hubs()) {
      await visit(context, `hubs/${hub}/`, `${hub} (${tag})`, async page => {
        if (vp.isMobile || !live.includes(hub)) return;
        /* the returning learner's history is generated from this hub's own question ids */
        const n = await page.evaluate(h => (window.__shPreview.db().answers[h] || []).length, hub);
        if (!n) problems.push(`${hub}: the returning learner has no answers here (get_my_answers fixture)`);
        /* a real answer through the widget's own event: every write lands in the fixtures */
        const before = await page.evaluate(() => window.__shPreview.log().length);
        await page.evaluate(() => {
          const ev = document.querySelector('script[src*="widget/v3.js"]').dataset.answeredEvent, q = window.SH_EXPORT.questions[0];
          document.dispatchEvent(new CustomEvent(ev, { detail: { qid: q.id, correct: true, choice: 0 } }));
        });
        await page.waitForTimeout(400);
        const got = await page.evaluate(b => window.__shPreview.log().slice(b).map(x => x.kind + ' ' + x.name), before);
        for (const w of ['write record_answer', 'write record_personal_answer', 'write record_choice']) if (!got.includes(w)) problems.push(`${hub}: answering didn't reach the fixtures as "${w}" (got: ${got.join(', ') || 'nothing'})`);
      });
    }
    /* the admin page unlocks with the preview's secret only (its sign-in reads get_reports_v2 where the game layer's
       migration is there, as in the preview, and get_reports otherwise) */
    await visit(context, 'review/?persona=admin', `admin page (${tag})`, async page => {
      await page.waitForTimeout(800);
      const r = await page.evaluate(() => { const lg = window.__shPreview.log(); return { reads: lg.filter(x => /^get_reports(_v2)?$/.test(x.name) && x.kind === 'read').length, denied: lg.filter(x => x.kind === 'denied').length }; });
      if (!r.reads) problems.push('admin page: the admin test account didn\'t unlock it with the preview secret');
      if (r.denied) problems.push(`admin page: ${r.denied} admin call(s) refused for the admin test account`);
      for (const fn of ['get_reports', 'get_reports_v2']) {
        const wrong = await page.evaluate(f => window.__shPreview.rpc(f, { p_secret: 'not-the-secret' }), fn);
        if (!wrong.error) problems.push(`admin page: ${fn} accepted a wrong secret in the fixtures`);
      }
    });
    if (!vp.isMobile) {
      /* writes from a page: a report and a display name */
      await visit(context, `hubs/${live[0] || L.hubs()[0]}/?persona=returning`, 'report and name writes', async page => {
        await page.evaluate(() => Promise.all([
          window.shSupabase.from('question_flags').insert({ hub: 'ci', note: 'CI fixture report', visitor_id: 'x' }),
          window.shSupabase.rpc('set_display_name', { p_visitor: localStorage.getItem('sh_visitor_id'), p_name: 'CI Canine' })]));
        const db = await page.evaluate(() => window.__shPreview.db());
        if (!db.flags.some(f => f.note === 'CI fixture report')) problems.push('a question report didn\'t land in the fixtures');
        if (db.name !== 'CI Canine') problems.push('a display-name change didn\'t land in the fixtures');
      });
      /* production on purpose: every route must be refused before it leaves the browser */
      await visit(context, 'index.html', 'deliberate production requests', async page => {
        const host = T.PROD_HOST, leaksBefore = g.leaks.length;
        const r = await page.evaluate(async h => {
          const out = {};
          try { await fetch('https://' + h + '/rest/v1/changelog?select=id'); out.fetch = 'sent'; } catch (e) { out.fetch = 'refused'; }
          try { const x = new XMLHttpRequest(); x.open('GET', 'https://' + h + '/rest/v1/changelog'); x.send(); out.xhr = 'sent'; } catch (e) { out.xhr = 'refused'; }
          out.beacon = navigator.sendBeacon('https://' + h + '/rest/v1/rpc/record_events', '{}') ? 'sent' : 'refused';
          const ws = new WebSocket('wss://' + h + '/realtime/v1/websocket'); out.ws = ws.readyState === 1 ? 'open' : 'not open';
          const img = new Image(); img.src = 'https://' + h + '/rest/v1/rpc/record_events?x=1'; document.body.appendChild(img);
          /* a clean frame's own fetch skips the runtime's guard: the page's CSP alone has to stop it */
          const f = document.createElement('iframe'); document.body.appendChild(f);
          try { await f.contentWindow.fetch('https://' + h + '/rest/v1/changelog?select=id'); out.raw = 'sent'; } catch (e) { out.raw = 'refused'; }
          await new Promise(r => setTimeout(r, 600));
          out.blocked = window.__shPreview.blocked();
          return out;
        }, host);
        if (r.fetch !== 'refused' || r.xhr !== 'refused' || r.beacon !== 'refused' || r.ws !== 'not open' || r.raw !== 'refused') problems.push(`deliberate production requests: not all refused (${JSON.stringify(r)})`);
        if (r.blocked < 5) problems.push(`deliberate production requests: the runtime counted ${r.blocked} of at least 5`);
        if (g.leaks.length > leaksBefore) problems.push(`deliberate production requests: ${g.leaks.length - leaksBefore} left the browser: ${g.leaks.slice(leaksBefore).join('; ')}`);
        notes.push(`deliberate production requests: fetch, XHR, beacon, WebSocket, image and a guard-free fetch all refused, none left the browser (${r.blocked} counted)`);
      });
    }
    if (g.leaks.length) problems.push(`${tag}: ${g.leaks.length} request(s) left the browser for Supabase: ${[...new Set(g.leaks)].slice(0, 5).join('; ')}`);
    notes.push(`${tag}: no request reached Supabase; ${new Set(g.external).size} other external host(s) were not contacted (${[...new Set(g.external)].join(', ') || 'none'})`);
    await context.close();
  }
  await browser.close(); srv.server.close();
  fs.rmSync(dir, { recursive: true, force: true });
  process.exit(L.report('preview safety check', problems, notes));
})().catch(e => { console.error(e); process.exit(1); });
