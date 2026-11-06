#!/usr/bin/env node
// Interactive preview of this checkout, on its own origin, with fixture data (RELEASE_TEST_PLAN.md).
//   node tools/preview/serve.js                      http://127.0.0.1:4173/ (fixture data)
//   node tools/preview/serve.js --port 8080 --host 0.0.0.0   reachable from a phone on the same network
//   node tools/preview/serve.js --dir _preview       serve a built preview (tools/preview/build.js) instead of the checkout
//   node tools/preview/serve.js --latency 400        add 400 ms to every response (a slow connection, besides
//                                                   Chrome DevTools' throttling)
//   SH_STAGING_URL=https://<ref>.supabase.co SH_STAGING_KEY=sb_publishable_... node tools/preview/serve.js --data staging
// Open a test account directly: /?persona=missed, /hubs/occlusion/?persona=high-xp&now=2026-11-19T21:00
// Claude Code cloud sessions: run it in the background and call report_preview_port with the port it prints.
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), zlib = require('zlib');
const T = require('./transform');

function arg(name, def){ const i = process.argv.indexOf('--' + name); return i > 0 ? process.argv[i + 1] : def; }
const PORT = Number(arg('port', process.env.PORT || 4173));
const HOST = arg('host', '127.0.0.1');
const DIR = arg('dir', null);
const LATENCY = Number(arg('latency', 0)) || 0;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8' };

function start(opts){
  opts = opts || {};
  const root = opts.dir ? path.resolve(opts.dir) : T.ROOT;
  const built = !!opts.dir;
  const o = built ? null : T.options({ data: opts.data || 'fixture', stagingUrl: process.env.SH_STAGING_URL, stagingKey: process.env.SH_STAGING_KEY, label: opts.label });
  const runtime = built ? null : T.runtime(o);
  const server = http.createServer((req, res) => {
    /* text is gzipped when the browser asks, as GitHub Pages does, so sizes and timings match the live site */
    const gz = /\bgzip\b/.test(req.headers['accept-encoding'] || '');
    const send = (status, body, type, extra) => setTimeout(() => {
      const zip = gz && body && body.length > 1024 && /^(text|application\/(javascript|json|manifest))|svg/.test(type || '');
      if (zip) body = zlib.gzipSync(body);
      res.writeHead(status, Object.assign({ 'Content-Type': type || 'text/plain; charset=utf-8', 'X-Robots-Tag': T.ROBOTS, 'Cache-Control': 'no-cache', 'Referrer-Policy': 'no-referrer' },
        zip ? { 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding' } : {}, extra || {}));
      res.end(body);
    }, opts.latency || 0);
    let u;
    try { u = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch (e) { return send(400, 'bad request'); }
    if (u === '/robots.txt' && !built) return send(200, T.robotsTxt());
    if (u === `/${T.PREVIEW_DIR}/preview.js` && !built) return send(200, runtime, TYPES['.js']);
    if (u.endsWith('/')) u += 'index.html';
    const rel = u.replace(/^\/+/, '');
    if (!built && !T.inPreview(rel)) return send(404, 'not part of the site');
    const file = path.join(root, rel);
    if (!file.startsWith(root + path.sep)) return send(403, 'forbidden');
    fs.stat(file, (err, st) => {
      if (err || !st.isFile()) {
        /* a folder without its trailing slash: send the browser to the folder, as GitHub Pages does */
        if (!err && st.isDirectory()) return send(301, '', 'text/plain', { Location: u + '/' });
        return send(404, 'not found');
      }
      const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
      if (!built) {
        const body = T.transformFile(rel, fs.readFileSync(file), o);
        if (body !== null) return send(200, body, type);
      } else if (/^(text|application\/(javascript|json|manifest))|svg/.test(type)) return send(200, fs.readFileSync(file), type);
      /* media: byte ranges, so narration can seek */
      const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
      if (range) {
        const start = range[1] ? Number(range[1]) : 0, end = range[2] ? Math.min(Number(range[2]), st.size - 1) : st.size - 1;
        if (start >= st.size) return send(416, '', type, { 'Content-Range': `bytes */${st.size}` });
        return setTimeout(() => {
          res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1, 'X-Robots-Tag': T.ROBOTS });
          fs.createReadStream(file, { start, end }).pipe(res);
        }, opts.latency || 0);
      }
      setTimeout(() => {
        res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Accept-Ranges': 'bytes', 'X-Robots-Tag': T.ROBOTS, 'Cache-Control': 'no-cache' });
        fs.createReadStream(file).pipe(res);
      }, opts.latency || 0);
    });
  });
  return new Promise(resolve => server.listen(opts.port == null ? 0 : opts.port, opts.host || '127.0.0.1', () => {
    const a = server.address();
    resolve({ server, port: a.port, url: `http://${opts.host && opts.host !== '0.0.0.0' ? opts.host : '127.0.0.1'}:${a.port}/`, options: o });
  }));
}

module.exports = { start };

if (require.main === module) {
  start({ port: PORT, host: HOST, dir: DIR, data: arg('data', 'fixture'), latency: LATENCY, label: arg('label', null) }).then(s => {
    const o = s.options;
    console.log(`Preview of ${o ? o.label + (o.sha ? ' @ ' + o.sha.slice(0, 7) : '') : DIR} at ${s.url}`);
    console.log(`  class data: ${o ? (o.data === 'staging' ? 'staging (' + process.env.SH_STAGING_URL + ')' : 'fixtures, kept in the browser') : 'as built'}; production is blocked; pages are noindex`);
    console.log(`  test accounts: ${s.url}?persona=new | returning | high-xp | missed | archived | admin   (admin page: ${s.url}review/)`);
    console.log(`  the redesign's design system: ${s.url}tools/preview/design/`);
    console.log('  Ctrl+C to stop.');
  }).catch(e => { console.error(e.message); process.exit(1); });
}
