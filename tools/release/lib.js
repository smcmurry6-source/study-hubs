// Shared helpers for the preview safety check (tools/ci/preview.js) and the release suites (tools/release/*.js).
// Every suite runs against a preview (tools/preview/serve.js), never the live site, so nothing it does reaches
// production; each one also records any request aimed at a Supabase host and fails if there is one.
'use strict';
const fs = require('fs'), path = require('path'), os = require('os');
const ROOT = path.resolve(__dirname, '../..');
const SUPABASE = /(^|\.)supabase\.(co|in|net)$/i;

function chromium(){
  const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
  return chromium;
}
async function launch(){
  return chromium().launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
}
function hubs(){
  return fs.readdirSync(path.join(ROOT, 'hubs')).filter(h => fs.existsSync(path.join(ROOT, 'hubs', h, 'index.html'))).sort();
}

/* Exam dates come from the dashboard's HUBS (the one home for them, vault/rules/repo-is-the-vault.md). A hub is
   "live" until 10 pm on its last exam day (or its archiveOn), the same rule the dashboard uses. */
function hubStatus(when){
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const start = html.indexOf('var HUBS = ['), end = html.indexOf('];', start);
  const block = html.slice(start, end);
  const now = when ? new Date(when) : new Date(), out = {};
  for (const id of hubs()) {
    const i = block.indexOf(`id:"${id}"`);
    if (i < 0) { out[id] = 'archived'; continue; }
    /* the next top-level entry starts a line with "{ id:" (an exam's extraQs also have ids, deeper in) */
    const rest = block.slice(i + 5), m = /\n {4}\{ id:"/.exec(rest), entry = block.slice(i, m ? i + 5 + m.index : undefined);
    const dates = [...entry.matchAll(/label:"[^"]*", date:"(\d{4}-\d{2}-\d{2})"/g)].map(m => m[1]).sort();   /* exam dates, not check-in or card dates */
    const ao = /archiveOn:\{ date:"(\d{4}-\d{2}-\d{2})", hour:(\d+) \}/.exec(entry);
    let cut = null;
    if (ao) { const [y, m, d] = ao[1].split('-').map(Number); cut = new Date(y, m - 1, d, Number(ao[2])); }
    else if (dates.length) { const [y, m, d] = dates[dates.length - 1].split('-').map(Number); cut = new Date(y, m - 1, d, 22); }
    out[id] = cut && now >= cut ? 'archived' : 'live';
  }
  return out;
}

/* Records every request the browser makes; anything to a Supabase host is a leak (the preview must answer it). */
async function guard(context, opts){
  opts = opts || {};
  const leaks = [], external = [];
  await context.route(/^(https?|wss?):\/\//, route => {
    const u = new URL(route.request().url());
    if (u.hostname === '127.0.0.1' || u.hostname === 'localhost') return route.continue();
    if (SUPABASE.test(u.hostname)) { leaks.push(`${route.request().method()} ${u.host}${u.pathname}`); return route.abort(); }
    external.push(u.host);
    /* fonts and the live site's static narration are harmless GETs; offline-safe runs abort them */
    return opts.allowExternal ? route.continue() : route.abort();
  });
  if (context.routeWebSocket) await context.routeWebSocket(/.*/, ws => { const u = new URL(ws.url()); if (SUPABASE.test(u.hostname)) leaks.push(`WebSocket ${u.host}`); ws.close(); });
  return { leaks, external };
}

/* Some pages open a pop-up or an "archived" notice the first time; get them out of the way like a person would. */
async function settle(page){
  await page.waitForTimeout(700);
  await page.click('.sh-archived-stay', { timeout: 500 }).catch(() => {});
}

function report(name, problems, notes){
  (notes || []).forEach(n => console.log('  ' + n));
  if (problems.length) { console.error(`\n✗ ${name}: ${problems.length} problem(s):\n` + problems.map(p => '  - ' + p).join('\n')); return 1; }
  console.log(`\n✓ ${name} passed`);
  return 0;
}

function outDir(name){
  const d = process.env.SH_RELEASE_OUT || path.join(os.tmpdir(), 'sh-release');
  fs.mkdirSync(path.join(d, name), { recursive: true });
  return path.join(d, name);
}

module.exports = { ROOT, SUPABASE, launch, hubs, hubStatus, guard, settle, report, outDir };
