// Dump every live hub's QUESTIONS and LECTURES to JSON, the same way the CI lint reads them.
//   node tools/dump-banks.js <out-dir>     -> <out-dir>/<hub>.json  ({ Q: [...], L: [...] })
// Needs Playwright (PLAYWRIGHT_PATH, as for tools/ci/smoke.js). Nothing is sent anywhere: all non-local requests are blocked.
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const root = path.resolve(__dirname, '..'), out = path.resolve(process.argv[2] || '.');
const TYPES = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css', '.json':'application/json' };
const server = http.createServer((req, res) => {
  let u = decodeURIComponent(req.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html';
  const f = path.join(root, u); if (!f.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.readFile(f, (e, b) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); res.end(b); });
}).listen(0, '127.0.0.1');
const hubs = fs.readdirSync(path.join(root, 'hubs')).filter(h => fs.existsSync(path.join(root, 'hubs', h, 'index.html')));
(async () => {
  await new Promise(r => server.on('listening', r));
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const ctx = await browser.newContext({ serviceWorkers: 'block' });
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  for (const hub of hubs) {
    const page = await ctx.newPage();
    await page.route(`**/hubs/${hub}/index.html`, async route => {
      const r = await route.fetch(); let h = await r.text(); const i = h.lastIndexOf('window.SH_EXPORT = {');
      if (i > 0) h = h.slice(0, i) + 'window.__DUMP = { Q: typeof QUESTIONS!=="undefined"?QUESTIONS:[], L: typeof LECTURES!=="undefined"?LECTURES:[] };\n' + h.slice(i);
      route.fulfill({ response: r, body: h });
    });
    await page.goto(`http://127.0.0.1:${server.address().port}/hubs/${hub}/index.html`); await page.waitForTimeout(800);
    const A = await page.evaluate(() => window.__DUMP ? JSON.parse(JSON.stringify(window.__DUMP)) : null);
    if (A) { fs.writeFileSync(path.join(out, hub + '.json'), JSON.stringify(A)); console.log(`${hub}: ${A.Q.length} questions, ${A.L.length} lectures`); }
    else console.log(`${hub}: could not read its data (is window.SH_EXPORT still at the end of the script?)`);
    await page.close();
  }
  await browser.close(); server.close();
})();
