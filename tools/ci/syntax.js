// Static checks: every inline <script> and the widget scripts parse, no leftover merge-conflict markers.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process'), os = require('os');
const root = path.resolve(__dirname, '../..');
const pages = ['index.html', 'review/index.html', 'about/index.html', ...fs.readdirSync(path.join(root, 'hubs')).map(h => `hubs/${h}/index.html`)].filter(p => fs.existsSync(path.join(root, p)));
/* An extracted hub keeps its data next to index.html. Keep this list explicit: a missing data set should fail the
   static check before a browser tries to fetch it. */
const HUB_CONTENT_FILES = ['manifest', 'core', 'questions', 'whys', 'notes', 'review', 'study', 'cases', 'figures'];
let failed = false;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sh-'));
function check(file, label){ try { execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' }); } catch (e) { failed = true; console.error(`✗ ${label}\n${e.stderr}`); } }
function checkBuilder(file, label){
  try { execFileSync(process.execPath, [file, '--check'], { cwd: root, stdio: 'pipe' }); }
  catch (e) { failed = true; console.error(`✗ ${label}\n${e.stderr || e.stdout || e.message}`); }
}
function checkJson(file, label){
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { failed = true; console.error(`✗ ${label}: invalid JSON (${e.message})`); return null; }
}
for (const p of pages) {
  const html = fs.readFileSync(path.join(root, p), 'utf8');
  [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].forEach((m, i) => { const f = path.join(tmp, p.replace(/\W+/g, '_') + i + '.js'); fs.writeFileSync(f, m[1]); check(f, `${p} inline script #${i + 1}`); });
  html.split('\n').forEach((line, n) => { if (/^(<<<<<<<|=======$|>>>>>>>)/.test(line)) { failed = true; console.error(`✗ ${p}:${n + 1} merge-conflict marker`); } });
}
for (const hub of fs.readdirSync(path.join(root, 'hubs'))) {
  const dir = path.join(root, 'hubs', hub, 'content');
  if (!fs.existsSync(dir)) continue;
  if (!fs.statSync(dir).isDirectory()) { failed = true; console.error(`✗ hubs/${hub}/content must be a directory`); continue; }
  const json = new Set(fs.readdirSync(dir).filter(f => path.extname(f) === '.json'));
  const parsed = {};
  HUB_CONTENT_FILES.forEach(name => {
    const file = `${name}.json`;
    if (!json.has(file)) { failed = true; console.error(`✗ hubs/${hub}/content/${file} is required`); return; }
    parsed[name] = checkJson(path.join(dir, file), `hubs/${hub}/content/${file}`);
  });
  const manifest = parsed.manifest;
  if (manifest) {
    if (manifest.format !== 1) { failed = true; console.error(`✗ hubs/${hub}/content/manifest.json needs format 1`); }
    else if (manifest.files && typeof manifest.files === 'object' && !Array.isArray(manifest.files)) {
      HUB_CONTENT_FILES.slice(1).forEach(name => { if (manifest.files[name] !== `${name}.json`) { failed = true; console.error(`✗ hubs/${hub}/content/manifest.json must map ${name} to ${name}.json`); } });
    } else if (Array.isArray(manifest.datasets)) {
      /* Accept the early manifest shape too: data-set names imply their canonical .json filenames. */
      HUB_CONTENT_FILES.slice(1).forEach(name => { if (!manifest.datasets.includes(name)) { failed = true; console.error(`✗ hubs/${hub}/content/manifest.json does not list ${name}`); } });
    } else { failed = true; console.error(`✗ hubs/${hub}/content/manifest.json needs a files map`); }
  }
  /* Parse an added content JSON file too; future data sets should not bypass this guard. */
  json.forEach(file => { if (!HUB_CONTENT_FILES.includes(path.basename(file, '.json'))) checkJson(path.join(dir, file), `hubs/${hub}/content/${file}`); });
}
/* the preview runtime (injected into previews only) and the preview and release tools */
for (const t of ['tools/preview/runtime/preview.js', 'tools/preview/transform.js', 'tools/preview/serve.js', 'tools/preview/build.js', 'tools/ci/preview.js',
  'tools/release/lib.js', 'tools/release/run.js', 'tools/release/secrets.js', 'tools/release/rls.js', 'tools/release/pg.js', 'tools/release/admin-ops.js', 'tools/release/admin-ui.js', 'tools/ci/archive.js', 'tools/release/a11y.js', 'tools/release/perf.js', 'tools/release/matrix.js', 'tools/release/postcheck.js']) check(path.join(root, t), t);
for (const w of ['widget/hub.js', 'widget/v3.js', 'widget/archive.js', 'widget/eggs.js', 'widget/clicks.js', 'widget/replies.js', 'widget/linkask.js', 'widget/ranks.js', 'widget/rankup.js', 'widget/drill.js', 'widget/pet.js', 'widget/fx.js', 'widget/highlight.js', 'widget/podcast.js', 'widget/tour.js', 'widget/games.js', 'widget/cases.js', 'widget/qhealth.js']) check(path.join(root, w), w);
/* The Phase 1 figure migration makes these generated files lazy hub assets. Do not invoke today's inline-marker
   builders until an external JS or CSS output exists: the content extraction intentionally leaves their old markers
   stale. Once an asset appears, both parse it and require its builder's freshness check in every CI syntax run. */
for (const f of [
  { hub: 'occlusion', build: 'tools/figures/occlusion/build.mjs' },
  { hub: 'heme-endo-exam2', build: 'tools/figures/heme-endo-exam2/build.mjs' },
  { hub: 'pcd-implants-exam1', build: 'tools/figures/pcd-implants-exam1/build.mjs' }
]) {
  const dir = path.join(root, 'hubs', f.hub, 'figures');
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) continue;
  const files = fs.readdirSync(dir).filter(name => /\.(js|css)$/i.test(name));
  if (!files.length) continue;
  files.filter(name => name.endsWith('.js')).forEach(name => check(path.join(dir, name), `hubs/${f.hub}/figures/${name}`));
  checkBuilder(f.build, `${f.build} --check`);
}
console.log(failed ? 'Syntax check failed' : `✓ ${pages.length} pages and the widget scripts parse`);
process.exit(failed ? 1 : 0);
