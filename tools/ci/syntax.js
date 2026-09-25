// Static checks: every inline <script> and the widget scripts parse, no leftover merge-conflict markers.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process'), os = require('os');
const root = path.resolve(__dirname, '../..');
const pages = ['index.html', 'review/index.html', ...fs.readdirSync(path.join(root, 'hubs')).map(h => `hubs/${h}/index.html`)].filter(p => fs.existsSync(path.join(root, p)));
let failed = false;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sh-'));
function check(file, label){ try { execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' }); } catch (e) { failed = true; console.error(`✗ ${label}\n${e.stderr}`); } }
for (const p of pages) {
  const html = fs.readFileSync(path.join(root, p), 'utf8');
  [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].forEach((m, i) => { const f = path.join(tmp, p.replace(/\W+/g, '_') + i + '.js'); fs.writeFileSync(f, m[1]); check(f, `${p} inline script #${i + 1}`); });
  html.split('\n').forEach((line, n) => { if (/^(<<<<<<<|=======$|>>>>>>>)/.test(line)) { failed = true; console.error(`✗ ${p}:${n + 1} merge-conflict marker`); } });
}
for (const w of ['widget/v3.js', 'widget/eggs.js', 'widget/clicks.js']) check(path.join(root, w), w);
console.log(failed ? 'Syntax check failed' : `✓ ${pages.length} pages and the widget scripts parse`);
process.exit(failed ? 1 : 0);
