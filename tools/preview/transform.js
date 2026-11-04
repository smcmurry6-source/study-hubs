// Preview transform: turns a copy of the live site into a production-safe preview (RELEASE_TEST_PLAN.md).
// Used by tools/preview/serve.js (on the fly) and tools/preview/build.js (a static copy for a preview host).
//
// Four independent layers keep a preview away from the class's real data; any one of them alone is enough:
//   1. every production Supabase URL and key in the served HTML/JS is rewritten to a fixture host on the reserved
//      .invalid TLD (RFC 6761: it never resolves), or to a staging project when one is configured;
//   2. a Content-Security-Policy meta tag (connect-src) that leaves the production host out, so the browser itself
//      refuses any fetch, XHR, WebSocket or beacon to it, however the URL was built;
//   3. the preview runtime (tools/preview/runtime/preview.js, loaded first in <head>) answers the fixture host from
//      in-browser fixture data and blocks and logs anything aimed at production;
//   4. previews are served from their own origin, so they never share localStorage or the service worker with the
//      live site (see RELEASE_TEST_PLAN.md, "Where previews are hosted").
// Plus noindex: a robots meta tag on every page, X-Robots-Tag on every response, robots.txt disallowing everything.
'use strict';
const fs = require('fs'), path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const PROD_HOST = 'thytmzsgymydbzcqdnix.supabase.co';
const PROD_URL = 'https://' + PROD_HOST;
const PROD_KEY = 'sb_publishable_6s_2KEdBVkEfEZH3qn8ouw_w7b8WcMS';
const FIXTURE_HOST = 'fixtures.preview.invalid';
const FIXTURE_URL = 'https://' + FIXTURE_HOST;
const FIXTURE_KEY = 'sb_preview_fixture_not_a_key';
const LIVE_SITE = 'https://smcmurry6-source.github.io/study-hubs/';
const PREVIEW_DIR = '__preview';   // where the runtime is served, at the preview's site root
const ROBOTS = 'noindex, nofollow, noarchive, nosnippet, noimageindex';

/* What the live site serves (and so what a preview serves). Everything else in the repo (vault, tools, SQL, notes)
   isn't part of the site. */
const SITE_ENTRIES = ['index.html', 'about', 'review', 'hubs', 'widget', 'assets', 'manifest.webmanifest', 'sw.js'];
const TEXT_EXT = new Set(['.html', '.js', '.css', '.json', '.webmanifest', '.svg', '.txt', '.md']);

function gitInfo(){
  const run = args => { try { return require('child_process').execFileSync('git', args, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch (e) { return ''; } };
  return { ref: process.env.SH_PREVIEW_REF || run(['rev-parse', '--abbrev-ref', 'HEAD']) || 'local', sha: (process.env.SH_PREVIEW_SHA || run(['rev-parse', 'HEAD']) || '').slice(0, 12) };
}

/* opts: { data: 'fixture' | 'staging', stagingUrl, stagingKey, label, ref, sha, audio: { mode: 'local' | 'remote', included: [paths] } } */
function options(o){
  o = Object.assign({ data: 'fixture', audio: { mode: 'local', included: [] } }, o || {});
  if (o.data === 'staging') {
    if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(o.stagingUrl || '')) throw new Error('staging data needs SH_STAGING_URL, e.g. https://<ref>.supabase.co (see RELEASE_TEST_PLAN.md)');
    if (o.stagingUrl === PROD_URL) throw new Error('SH_STAGING_URL is the production project; a preview never talks to production');
    if (!/^sb_publishable_/.test(o.stagingKey || '')) throw new Error('staging data needs SH_STAGING_KEY (the staging project\'s publishable key, never a secret or service-role key)');
  } else if (o.data !== 'fixture') throw new Error(`unknown data mode "${o.data}" (fixture or staging)`);
  const g = gitInfo();
  o.ref = o.ref || g.ref; o.sha = o.sha || g.sha;
  o.label = o.label || o.ref;
  o.builtAt = o.builtAt || new Date().toISOString();
  return o;
}
function target(o){ return o.data === 'staging' ? { url: o.stagingUrl, key: o.stagingKey } : { url: FIXTURE_URL, key: FIXTURE_KEY }; }

function rewriteText(text, o){
  const t = target(o);
  return text.split(PROD_URL).join(t.url).split(PROD_HOST).join(new URL(t.url).host).split(PROD_KEY).join(t.key);
}

function csp(o){
  const extra = o.data === 'staging' ? [o.stagingUrl, o.stagingUrl.replace(/^https:/, 'wss:')] : [];
  /* connect-src (fetch, XHR, WebSocket, beacons), img-src and media-src: the ways a page can send a request with data
     in it. The production host is deliberately absent. Scripts, styles and fonts load as they do on the live site.
     LIVE_SITE is there for static narration files a hosted preview leaves out (plain GETs of public files). */
  const live = new URL(LIVE_SITE).origin;
  return [`connect-src 'self' data: blob: https://fonts.googleapis.com https://fonts.gstatic.com ${live} ${extra.join(' ')}`.trim(),
    `img-src 'self' data: blob: ${live}`, `media-src 'self' data: blob: ${live}`].join('; ');
}

/* page: site-relative path of the HTML file, e.g. "hubs/occlusion/index.html" */
function transformHtml(html, page, o){
  const depth = page.split('/').length - 1;
  const rel = '../'.repeat(depth);
  const head = `\n<meta name="robots" content="${ROBOTS}">` +
    `\n<meta http-equiv="Content-Security-Policy" content="${csp(o)}">` +
    `\n<script src="${rel}${PREVIEW_DIR}/preview.js"></script>`;
  let out = rewriteText(html, o);
  out = out.replace(/<meta\s+name=["']robots["'][^>]*>\s*/gi, '');          // one robots tag, ours
  const charset = /<meta\s+charset=[^>]*>/i.exec(out);
  if (charset) out = out.slice(0, charset.index + charset[0].length) + head + out.slice(charset.index + charset[0].length);
  else if (/<head[^>]*>/i.test(out)) out = out.replace(/<head[^>]*>/i, m => m + head);
  else out = head + out;
  out = out.replace(/<title>([\s\S]*?)<\/title>/i, (m, t) => `<title>Preview · ${t.trim()}</title>`);
  return out;
}

function transformSw(js, o){
  /* its own cache name, so a preview's offline copy is never confused with another build's */
  return rewriteText(js, o).replace(/var VERSION = '([^']+)';/, (m, v) => `var VERSION = '${v}-preview-${(o.sha || 'local').slice(0, 7)}';`);
}

/* body for a site-relative file, or null to serve it untouched (binary) */
function transformFile(rel, buf, o){
  const ext = path.extname(rel).toLowerCase();
  if (!TEXT_EXT.has(ext)) return null;
  const text = buf.toString('utf8');
  if (ext === '.html') return transformHtml(text, rel, o);
  if (rel === 'sw.js') return transformSw(text, o);
  return rewriteText(text, o);
}

function runtime(o){
  const src = fs.readFileSync(path.join(__dirname, 'runtime', 'preview.js'), 'utf8');
  const personas = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'personas.json'), 'utf8'));
  const cfg = {
    label: o.label, ref: o.ref, sha: o.sha, builtAt: o.builtAt, data: o.data,
    fixtureHost: FIXTURE_HOST, stagingHost: o.data === 'staging' ? new URL(o.stagingUrl).host : null,
    liveSite: LIVE_SITE, audio: o.audio || { mode: 'local', included: [] }, personas: personas.personas, adminSecret: personas.adminSecret
  };
  return `window.SH_PREVIEW_CONFIG = ${JSON.stringify(cfg)};\n` + src;
}

function headersFile(){
  /* Cloudflare Pages and Netlify read _headers; other hosts need the same header set in their config */
  return `/*\n  X-Robots-Tag: ${ROBOTS}\n  Referrer-Policy: no-referrer\n  X-Content-Type-Options: nosniff\n`;
}
function robotsTxt(){ return 'User-agent: *\nDisallow: /\n'; }

module.exports = { ROOT, PROD_HOST, PROD_URL, PROD_KEY, FIXTURE_HOST, FIXTURE_URL, FIXTURE_KEY, LIVE_SITE, PREVIEW_DIR, ROBOTS, SITE_ENTRIES,
  options, rewriteText, transformHtml, transformFile, runtime, headersFile, robotsTxt, csp };
