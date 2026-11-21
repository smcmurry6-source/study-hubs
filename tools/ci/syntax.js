// Static checks: every inline <script> and the widget scripts parse, no leftover merge-conflict markers.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process'), os = require('os');
const root = path.resolve(__dirname, '../..');
const pages = ['index.html', 'review/index.html', 'about/index.html', ...fs.readdirSync(path.join(root, 'hubs')).map(h => `hubs/${h}/index.html`)].filter(p => fs.existsSync(path.join(root, p)));
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
  'tools/release/lib.js', 'tools/release/run.js', 'tools/release/secrets.js', 'tools/release/rls.js', 'tools/release/pg.js', 'tools/release/bench-answers.js', 'tools/release/admin-ops.js', 'tools/release/admin-ui.js', 'tools/ci/archive.js', 'tools/release/a11y.js', 'tools/release/perf.js', 'tools/release/matrix.js', 'tools/release/postcheck.js',
  /* Ask Timmy: the Edge Function's logic (index.ts is Deno's; tools/timmy/test.mjs runs the logic), its tests, its site-help build and its eval */
  'supabase/functions/timmy/core.js', 'tools/timmy/test.mjs', 'tools/timmy/build.mjs', 'tools/timmy/eval.mjs', 'tools/release/timmy.js',
  /* the engine hubs' content step */
  'tools/hub-next/build.mjs', 'tools/hub-next/high-yield.mjs',
  /* the to-do list's printout (vault/how-to/package-the-to-dos.md) */
  'tools/todo/list.mjs',
  /* the bundles: the build, and the slim database client's own build and wire check */
  'tools/bundle/build.mjs', 'tools/bundle/client/entry.mjs', 'tools/bundle/client/build.mjs', 'tools/bundle/client/wire-check.mjs']) check(path.join(root, t), t);
/* a hub on the engine: the scripts beside its page (its drawings and its arcade) */
for (const h of fs.readdirSync(path.join(root, 'hubs'))) for (const f of ['figures.js', 'arcade.js']) { const w = `hubs/${h}/content/${f}`; if (fs.existsSync(path.join(root, w))) check(path.join(root, w), w); }
for (const w of ['widget/v3.js', 'widget/archive.js', 'widget/eggs.js', 'widget/clicks.js', 'widget/replies.js', 'widget/linkask.js', 'widget/ranks.js', 'widget/ranks-hub.js', 'widget/prize.js', 'widget/rankup.js', 'widget/drill.js', 'widget/pet.js', 'widget/fx.js', 'widget/highlight.js', 'widget/podcast.js', 'widget/tour.js', 'widget/games.js', 'widget/teeth.js', 'widget/cases.js', 'widget/qhealth.js',
  /* the hub engine (the core and its three parts), the dashboard and its data (hubs.js) */
  'widget/hub.js', 'widget/hub-rewards.js', 'widget/hub-timmy.js', 'widget/hub-bank.js', 'widget/study-modes.js', 'widget/guide.js', 'widget/hub-art.js', 'widget/dash.js', 'widget/ideas.js', 'widget/ask.js', 'widget/hub-art/dash.js', 'widget/hub-art/class.js', 'widget/hub-art/board.js', 'widget/hub-art/shop.js', 'widget/hub-art/outfits.js', 'widget/journeys.js', 'widget/hub-art/journeys.js', 'widget/trophies.js', 'widget/hub-art/trophies.js', 'hubs.js',
  /* Timmy's place: the renderer, its kit and one file per set (all on first use) */
  /* the bundles the dashboard and the engine's hubs load, and the slim database client inside one (tools/bundle/build.mjs) */
  'widget/hub.bundle.js', 'widget/dash.bundle.js', 'widget/rest.bundle.js', 'widget/hub-rest.bundle.js', 'widget/vendor/supabase-lite-2.117.2.js',
  'widget/place.js', 'widget/shop.js', 'widget/bowling.js', 'widget/hub-art/place.js', 'widget/hub-art/bowling.js', ...(fs.existsSync(path.join(root, 'widget/hub-art/place')) ? fs.readdirSync(path.join(root, 'widget/hub-art/place')).filter(f => /\.js$/.test(f)).sort().map(f => 'widget/hub-art/place/' + f) : []), ...(fs.existsSync(path.join(root, 'widget/hub-art/outfits')) ? fs.readdirSync(path.join(root, 'widget/hub-art/outfits')).filter(f => /\.js$/.test(f)).sort().map(f => 'widget/hub-art/outfits/' + f) : [])].filter(w => fs.existsSync(path.join(root, w)))) check(path.join(root, w), w);
/* the service worker: it parses, every file its PRECACHE names exists, and every live hub on the engine is in it */
check(path.join(root, 'sw.js'), 'sw.js');
try {
  const P = new Function('self', 'caches', fs.readFileSync(path.join(root, 'sw.js'), 'utf8') + ';return { PRECACHE: PRECACHE, HUBS: HUBS };')({ addEventListener(){}, location: {} }, {});
  for (const u of P.PRECACHE) { const f = u === './' ? 'index.html' : /\/$/.test(u) ? u + 'index.html' : u; if (!fs.existsSync(path.join(root, f))) { failed = true; console.error(`✗ sw.js: PRECACHE names ${u}, which isn't in the repo`); } }
  const { hubStatus } = require('../release/lib.js');
  const st = hubStatus();
  for (const h of Object.keys(st).filter(h => st[h] === 'live' && !P.HUBS.includes(h))) { failed = true; console.error(`✗ sw.js: ${h} is a live hub and isn't in HUBS (its page and content wouldn't be kept for offline)`); }
} catch (e) { failed = true; console.error('✗ sw.js: its lists could not be read: ' + e.message); }
/* the engine reads its big content files a few lines at a time (parseSteps in widget/hub.js): on every engine hub's files it
   must build what JSON.parse builds, a line a step (a clock that runs out on every line) */
const steps = [];
try {
  const src = fs.readFileSync(path.join(root, 'widget/hub.js'), 'utf8'), at = src.indexOf('  function parseSteps(text, pace){'), end = src.indexOf('\n  }\n', at);
  if (at < 0 || end < 0) throw new Error('widget/hub.js has no parseSteps(text, pace)');
  const STEPPED = (src.match(/var STEPPED = (\{[^}]*\});/) || [])[1];
  if (!STEPPED) throw new Error('widget/hub.js has no STEPPED list');
  let t = 0;
  const parseSteps = new Function('window', src.slice(at, end + 4) + '; return parseSteps;')({ performance: { now: () => (t += 20) } });
  for (const h of fs.readdirSync(path.join(root, 'hubs'))) for (const f of Object.keys(JSON.parse(STEPPED))) {
    const file = path.join(root, 'hubs', h, 'content', f); if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, 'utf8'), want = JSON.stringify(JSON.parse(text));
    steps.push(parseSteps(text, setImmediate).then(v => { if (JSON.stringify(v) !== want) { failed = true; console.error(`✗ hubs/${h}/content/${f}: parseSteps (widget/hub.js) doesn't build what JSON.parse does`); } },
      e => { failed = true; console.error(`✗ hubs/${h}/content/${f}: parseSteps failed: ${e.message}`); }));
  }
  /* and a file laid out another way falls back to JSON.parse */
  for (const x of ['{"a": [1, 2], "b": {"c": "d"}}', '{\n "a": {"x":\n 1}\n}', '[\n{"k": 1},\n{"k": 2}\n]', '{\n "a": 1,\n "a": 2\n}']) steps.push(parseSteps(x, setImmediate).then(v => { if (JSON.stringify(v) !== JSON.stringify(JSON.parse(x))) { failed = true; console.error(`✗ parseSteps (widget/hub.js) reads ${JSON.stringify(x)} differently from JSON.parse`); } }));
} catch (e) { failed = true; console.error('✗ parseSteps: ' + e.message); }
Promise.all(steps).then(() => {
  console.log(failed ? 'Syntax check failed' : `✓ ${pages.length} pages and the widget scripts parse; parseSteps reads ${steps.length - 4} content files as JSON.parse does`);
  process.exit(failed ? 1 : 0);
});
