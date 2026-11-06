#!/usr/bin/env node
// Static, production-safe copy of the site for a preview host or a CI artifact (RELEASE_TEST_PLAN.md).
//   node tools/preview/build.js --out _preview                    fixture data, narration changed on this branch only
//   node tools/preview/build.js --out _preview --audio all        every mp3 (about 700 MB)
//   node tools/preview/build.js --out _preview --audio none       no hub narration copied; it streams from the live site
//   node tools/preview/build.js --out _preview --no-podcast       leave out Timmy Time episodes (over Cloudflare Pages'
//                                                                 25 MB a file); they play the live site's copy
//   node tools/preview/build.js --check _preview                  verify a built preview (CI runs this)
// Narration left out of the build is played from the live site's static copy (a plain GET of a public mp3; no data
// is sent). Writes _headers (X-Robots-Tag for Cloudflare Pages / Netlify), robots.txt and preview-manifest.json.
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const T = require('./transform');

function arg(name, def){ const i = process.argv.indexOf('--' + name); return i > 0 ? process.argv[i + 1] : def; }
const isHubAudio = rel => /^hubs\/[^/]+\/audio\/.+\.(mp3|mp4|webm)$/i.test(rel);
const isPodcast = rel => /^hubs\/[^/]+\/audio\/timmy-time\.mp3$/i.test(rel);

function walk(dir, base){
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => {
    const p = path.join(dir, d.name), rel = path.relative(base, p).split(path.sep).join('/');
    if (d.name.startsWith('.')) return [];
    return d.isDirectory() ? walk(p, base) : [rel];
  });
}
function changedFiles(baseRef){
  try { return new Set(execFileSync('git', ['diff', '--name-only', `${baseRef}...HEAD`], { cwd: T.ROOT }).toString().split('\n').filter(Boolean)); }
  catch (e) { console.warn(`  (couldn't diff against ${baseRef}; treating no narration as changed)`); return new Set(); }
}

function build(out, opts){
  out = path.resolve(out);
  if (out === T.ROOT || T.ROOT.startsWith(out + path.sep)) throw new Error('--out must be a new folder, not the repo or a parent of it');
  if (fs.existsSync(out) && fs.readdirSync(out).length && !fs.existsSync(path.join(out, 'preview-manifest.json'))) throw new Error(`${out} has files that aren't a preview; pick an empty folder`);
  fs.rmSync(out, { recursive: true, force: true });
  const audioMode = opts.audio || 'changed';
  const changed = audioMode === 'changed' ? changedFiles(opts.base || 'origin/main') : new Set();
  const files = T.SITE_ENTRIES.concat(T.PREVIEW_PAGES).flatMap(e => { const p = path.join(T.ROOT, e); return !fs.existsSync(p) ? [] : fs.statSync(p).isDirectory() ? walk(p, T.ROOT) : [e]; });
  const included = [], skipped = [], podcasts = [];
  files.forEach(rel => {
    if (isHubAudio(rel) && (audioMode === 'none' || (audioMode === 'changed' && !changed.has(rel)))) { skipped.push(rel); return; }
    if (opts.noPodcast && isPodcast(rel)) { skipped.push(rel); podcasts.push(rel); return; }
    if (isHubAudio(rel)) included.push(rel);
  });
  const o = T.options({ data: opts.data || 'fixture', stagingUrl: process.env.SH_STAGING_URL, stagingKey: process.env.SH_STAGING_KEY, label: opts.label,
    audio: audioMode === 'all' && !podcasts.length ? { mode: 'local', included: [] } : { mode: 'remote', included } });
  let bytes = 0, count = 0;
  const skip = new Set(skipped);
  files.forEach(rel => {
    if (skip.has(rel)) return;
    const src = path.join(T.ROOT, rel), dst = path.join(out, rel);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    const body = T.transformFile(rel, fs.readFileSync(src), o);
    if (body === null) fs.copyFileSync(src, dst); else fs.writeFileSync(dst, body);
    bytes += fs.statSync(dst).size; count++;
  });
  fs.mkdirSync(path.join(out, T.PREVIEW_DIR), { recursive: true });
  fs.writeFileSync(path.join(out, T.PREVIEW_DIR, 'preview.js'), T.runtime(o));
  fs.writeFileSync(path.join(out, '_headers'), T.headersFile());
  fs.writeFileSync(path.join(out, 'robots.txt'), T.robotsTxt());
  fs.writeFileSync(path.join(out, 'preview-manifest.json'), JSON.stringify({ label: o.label, ref: o.ref, sha: o.sha, builtAt: o.builtAt, data: o.data,
    audio: audioMode, narrationIncluded: included.length, narrationFromLiveSite: skipped.length, podcastsLeftOut: podcasts, files: count }, null, 1));
  return { out, count, bytes, included: included.length, skipped: skipped.length, podcasts, options: o };
}

/* every check a preview host relies on; returns a list of problems */
function check(dir){
  dir = path.resolve(dir);
  const problems = [];
  if (!fs.existsSync(path.join(dir, 'preview-manifest.json'))) return [`${dir} is not a built preview (no preview-manifest.json)`];
  const files = walk(dir, dir);
  const text = files.filter(f => /\.(html|js|css|json|webmanifest|svg|txt|md)$/i.test(f) || f === '_headers');
  for (const f of text) {
    const s = fs.readFileSync(path.join(dir, f), 'utf8');
    if (s.includes(T.PROD_HOST)) problems.push(`${f}: still names the production Supabase host`);
    if (s.includes(T.PROD_KEY)) problems.push(`${f}: still carries the production publishable key`);
    if (f.endsWith('.html')) {
      if (!/<meta name="robots" content="noindex/.test(s)) problems.push(`${f}: no noindex robots meta tag`);
      if (!/<meta http-equiv="Content-Security-Policy" content="connect-src [^"]*; img-src [^"]*; media-src [^"]*"/.test(s)) problems.push(`${f}: no connect-src/img-src/media-src Content-Security-Policy`);
      else if (/Content-Security-Policy" content="[^"]*supabase\.co(?!\.invalid)/.test(s) && !process.env.SH_STAGING_URL) problems.push(`${f}: CSP allows a supabase.co host in a fixture build`);
      if (!/__preview\/preview\.js"><\/script>/.test(s)) problems.push(`${f}: doesn't load the preview runtime`);
      const head = s.slice(0, s.search(/<\/head>/i));
      const firstScript = head.search(/<script[\s>]/i), runtimeAt = head.search(/<script src="[^"]*__preview\/preview\.js"/);
      if (runtimeAt < 0 || firstScript !== runtimeAt) problems.push(`${f}: the preview runtime must be the first script in <head>`);
    }
  }
  const h = fs.existsSync(path.join(dir, '_headers')) ? fs.readFileSync(path.join(dir, '_headers'), 'utf8') : '';
  if (!/X-Robots-Tag: noindex/.test(h)) problems.push('_headers: no X-Robots-Tag: noindex');
  const r = fs.existsSync(path.join(dir, 'robots.txt')) ? fs.readFileSync(path.join(dir, 'robots.txt'), 'utf8') : '';
  if (!/Disallow: \/\s*$/m.test(r)) problems.push('robots.txt: must disallow everything');
  return problems;
}

module.exports = { build, check };

if (require.main === module) {
  try {
    const dir = arg('check', null);
    if (dir) {
      const p = check(dir);
      if (p.length) { console.error('✗ preview check failed:\n' + p.map(x => '  - ' + x).join('\n')); process.exit(1); }
      console.log(`✓ ${dir}: noindex everywhere, no production host or key, the runtime loads first on every page`);
    } else {
      const r = build(arg('out', '_preview'), { audio: arg('audio', 'changed'), data: arg('data', 'fixture'), label: arg('label', null), base: arg('base', 'origin/main'), noPodcast: process.argv.includes('--no-podcast') });
      console.log(`✓ preview of ${r.options.label} @ ${(r.options.sha || '').slice(0, 7)} in ${r.out}: ${r.count} files, ${(r.bytes / 1048576).toFixed(1)} MB; narration: ${r.included} included, ${r.skipped} from the live site`);
      if (r.podcasts.length) console.log(`  Timmy Time left out (the preview plays the live site's copy): ${r.podcasts.join(', ')}`);
      const p = check(r.out);
      if (p.length) { console.error('✗ but the check failed:\n' + p.map(x => '  - ' + x).join('\n')); process.exit(1); }
    }
  } catch (e) { console.error('✗ ' + e.message); process.exit(1); }
}
