// Static checks: every inline <script> and the widget scripts parse, no leftover merge-conflict markers.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process'), os = require('os');
const root = path.resolve(__dirname, '../..');
const pages = ['index.html', 'next/index.html', 'review/index.html', 'about/index.html', ...fs.readdirSync(path.join(root, 'hubs')).map(h => `hubs/${h}/index.html`)].filter(p => fs.existsSync(path.join(root, p)));
let failed = false;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sh-'));
function check(file, label){ try { execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' }); } catch (e) { failed = true; console.error(`✗ ${label}\n${e.stderr}`); } }
for (const p of pages) {
  const html = fs.readFileSync(path.join(root, p), 'utf8');
  [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].forEach((m, i) => { const f = path.join(tmp, p.replace(/\W+/g, '_') + i + '.js'); fs.writeFileSync(f, m[1]); check(f, `${p} inline script #${i + 1}`); });
  html.split('\n').forEach((line, n) => { if (/^(<<<<<<<|=======$|>>>>>>>)/.test(line)) { failed = true; console.error(`✗ ${p}:${n + 1} merge-conflict marker`); } });
}
/* the preview runtime (injected into previews only) and the preview and release tools */
for (const t of ['tools/preview/runtime/preview.js', 'tools/preview/transform.js', 'tools/preview/serve.js', 'tools/preview/build.js', 'tools/ci/preview.js',
  'tools/release/lib.js', 'tools/release/run.js', 'tools/release/secrets.js', 'tools/release/rls.js', 'tools/release/pg.js', 'tools/release/admin-ops.js', 'tools/release/admin-ui.js', 'tools/ci/archive.js', 'tools/release/a11y.js', 'tools/release/perf.js', 'tools/release/matrix.js', 'tools/release/postcheck.js']) check(path.join(root, t), t);
for (const w of ['widget/v3.js', 'widget/archive.js', 'widget/eggs.js', 'widget/clicks.js', 'widget/replies.js', 'widget/linkask.js', 'widget/ranks.js', 'widget/rankup.js', 'widget/drill.js', 'widget/pet.js', 'widget/fx.js', 'widget/highlight.js', 'widget/podcast.js', 'widget/tour.js', 'widget/games.js', 'widget/cases.js', 'widget/qhealth.js',
  /* the redesign, beside the live site until its release: the hub engine, the dashboard and its generated data */
  'widget/hub.js', 'widget/hub-art.js', 'widget/dash.js', 'widget/hub-art/dash.js', 'widget/hub-art/class.js', 'widget/hub-art/outfits.js', 'next/hubs.js'].filter(w => fs.existsSync(path.join(root, w)))) check(path.join(root, w), w);
console.log(failed ? 'Syntax check failed' : `✓ ${pages.length} pages and the widget scripts parse`);
process.exit(failed ? 1 : 0);
