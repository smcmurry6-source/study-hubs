#!/usr/bin/env node
// After a merge to main: the steps that used to be done by hand after every merge (Sam, 2026-11-15: "lets make all of
// that automatic"). .github/workflows/after-merge.yml runs it on every push to main. It works out from git what the
// push changed and does only what that needs, in this order (vault/how-to/after-a-merge.md):
//   keys       a hub's questions changed → load its answer keys (tools/xp/keys.js <hub> --load)
//   timmy      supabase/functions/timmy/ changed → deploy the function (tools/timmy/deploy.mjs), then check it serves:
//              when its code changed (core.js, index.ts), one real question on the live hub with the soonest exam
//              (vault/reference/ask-timmy.md, "At the release", step 4); when only site.json changed (the About page),
//              a free check that calls no model (a question asked from a mock exam gets the "paused" answer)
//   podcast    a hub's Timmy Time episode changed (content/core.json's podcast: its id or length) → tell the server, so
//              listening earns XP (admin_set_podcast_episode)
//   live       wait until GitHub Pages serves the push (up to 15 minutes), so what follows meets the new pages
//   fixes      a data fix added under tools/data-fixes/ → run it once on the live database (Supabase's management API)
//   changelog  a line added to tools/after-merge/changelog.txt → log_changelog for its hub (the hub's "Updated" label)
//   postcheck  node tools/release/postcheck.js on the push (the live pages, read-only)
//
//   node tools/after-merge/run.js --from <sha> --to <sha>       what a push from <from> to <to> needs (default: HEAD^1..HEAD)
//   node tools/after-merge/run.js ... --dry                     only print the plan; nothing is sent anywhere
//   node tools/after-merge/run.js ... --fix tools/data-fixes/<file>.sql   also run that data fix (added earlier, by hand)
//   node tools/after-merge/run.js ... --only keys,changelog     only some steps
//
// Secrets come from the environment and are never printed (vault/rules/secrets.md): SB_KEY and ADMIN_SECRET for keys,
// podcast and changelog; SUPABASE_ACCESS_TOKEN for timmy and fixes. A step whose secret is missing is "blocked", and the
// run fails so it shows on main's checks. The workflow's logs are public: nothing here prints a row of the class's data
// (a data fix's result is never printed) or anything about a person (vault/rules/learner-data-privacy.md).
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto'), { execFileSync, spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const REF = 'thytmzsgymydbzcqdnix', API = `https://${REF}.supabase.co`, LIVE = 'https://smcmurry6-source.github.io/study-hubs/';
const ORIGIN = 'https://smcmurry6-source.github.io';
const STEPS = ['keys', 'timmy', 'podcast', 'live', 'fixes', 'changelog', 'postcheck'];
const CHANGELOG = 'tools/after-merge/changelog.txt';
const SITE = ['index.html', 'hubs.js', 'about', 'review', 'hubs', 'widget', 'assets', 'manifest.webmanifest', 'sw.js'];   // tools/preview/transform.js SITE_ENTRIES
const HUB_RE = /^[a-z0-9][a-z0-9-]{0,39}$/;
const NAPS = ['error', 'refusal', 'limit', 'cap', 'off', 'busy', 'paused', 'hub'];   // supabase/functions/timmy/core.js napReply kinds

const git = (...a) => execFileSync('git', a, { cwd: ROOT, maxBuffer: 512 * 1048576 });
const show = (sha, f) => { try { return execFileSync('git', ['show', `${sha}:${f}`], { cwd: ROOT, maxBuffer: 512 * 1048576, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { return null; } };
const isSite = f => SITE.some(e => f === e || f.startsWith(e + '/'));
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ------------------------------------------------------------------------------------------------------ the plan
   Pure: from what changed, what to do. `changes` is git's --name-status (rename detection on, so a renamed data fix
   is R, not A, and never runs twice); `podcast(hub)` gives that hub's episode before and after; `added` the lines added
   to the changelog file. Exported for tools/after-merge/test.js. */
function plan({ changes, podcast, added, extraFixes, engineHubs }){
  const files = changes.map(c => c.path), touched = p => files.some(f => f === p || f.startsWith(p));
  const out = { keys: [], timmy: false, timmyCode: false, podcast: [], site: [], fixes: [], changelog: [], warnings: [] };
  for (const hub of engineHubs) {
    const qf = `hubs/${hub}/content/questions.json`;
    /* a change to how keys are built (tools/xp/keys.js) reloads every engine hub's */
    if (changes.some(c => c.path === qf && c.status !== 'D') || touched(`tools/question-ids/${hub}.txt`) || touched('tools/xp/keys.js')) out.keys.push(hub);
    if (touched(`hubs/${hub}/content/core.json`)) {
      const p = podcast(hub);
      if (p.after && p.after.id && !(p.before && p.before.id === p.after.id && p.before.seconds === p.after.seconds)) out.podcast.push({ hub, ...p.after });
    }
  }
  out.timmy = touched('supabase/functions/timmy/');
  /* the function's code, not only its site help (site.json changes with every About page edit, several times a day) */
  out.timmyCode = files.some(f => f.startsWith('supabase/functions/timmy/') && f !== 'supabase/functions/timmy/site.json');
  out.site = changes.filter(c => c.status !== 'D' && isSite(c.path)).map(c => c.path);
  out.fixes = changes.filter(c => c.status === 'A' && /^tools\/data-fixes\/[^/]+\.sql$/.test(c.path)).map(c => c.path).sort();
  for (const f of extraFixes || []) if (!out.fixes.includes(f)) out.fixes.push(f);
  for (const line of added) {
    const m = /^\s*([a-z0-9][a-z0-9-]{0,39}|all)\s*\|\s*(.+?)\s*$/.exec(line);
    if (!m || line.trim().startsWith('#')) { if (line.trim() && !line.trim().startsWith('#')) out.warnings.push(`${CHANGELOG}: a line that isn't "<hub> | <message>": ${line.slice(0, 80)}`); continue; }
    if (m[2].length > 400) { out.warnings.push(`${CHANGELOG}: a message over 400 characters for ${m[1]} (not logged)`); continue; }
    out.changelog.push({ hub: m[1], message: m[2] });
  }
  return out;
}

/* ------------------------------------------------------------------------------------------------------ from git */
function changesBetween(from, to){
  return git('diff', '--name-status', '-M', from, to).toString().split('\n').filter(Boolean).map(l => {
    const p = l.split('\t'); return { status: p[0][0], path: p[p.length - 1] };
  });
}
function episode(sha, hub){
  const b = show(sha, `hubs/${hub}/content/core.json`); if (!b) return null;
  try { const c = JSON.parse(b), p = c.podcast; if (!p || !p.id || c.audio === 'off') return null; return { id: p.id, seconds: Math.round(+p.duration || 0) }; }
  catch (e) { return null; }
}
function addedLines(from, to){
  return git('diff', '-U0', from, to, '--', CHANGELOG).toString().split('\n')
    .filter(l => l.startsWith('+') && !l.startsWith('+++')).map(l => l.slice(1));
}
function engineHubs(sha){
  return git('ls-tree', '--name-only', `${sha}:hubs`).toString().split('\n').filter(h => HUB_RE.test(h) && show(sha, `hubs/${h}/content/core.json`));
}

/* ------------------------------------------------------------------------------------------------------ calls */
async function rpc(fn, args){
  const key = process.env.SB_KEY;
  const r = await fetch(`${API}/rest/v1/rpc/${fn}`, { method: 'POST', body: JSON.stringify(args),
    headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' } });
  const text = await r.text();
  if (!r.ok) throw new Error(`${fn} answered ${r.status}: ${scrub(text).slice(0, 200)}`);
  return text;
}
function scrub(s){ for (const k of ['ADMIN_SECRET', 'SB_KEY', 'SUPABASE_ACCESS_TOKEN']) if (process.env[k]) s = s.split(process.env[k]).join('<secret>'); return s; }
function node(args){
  const r = spawnSync(process.execPath, args, { cwd: ROOT, env: process.env, encoding: 'utf8', maxBuffer: 64 * 1048576 });
  const out = scrub((r.stdout || '') + (r.stderr || '')).trim();
  return { ok: r.status === 0, out };
}
async function sql(query){
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, { method: 'POST', body: JSON.stringify({ query }),
    headers: { Authorization: 'Bearer ' + process.env.SUPABASE_ACCESS_TOKEN, 'Content-Type': 'application/json' } });
  const text = await r.text();
  // the rows a fix selects at its end are class data: never printed (the logs are public), only whether it ran
  if (!r.ok) { let msg = text; try { msg = JSON.parse(text).message || text; } catch (e) {} throw new Error(`the database answered ${r.status}: ${scrub(String(msg)).slice(0, 200)}`); }
}
/* The hub for the real question: the live one whose next exam is soonest, where students are asking now, so the cache
   the question writes (about $0.60 of a hub's content) is read by their next questions instead of expiring unused.
   Pure, for tools/after-merge/test.js: data is hubs.js's SH_DASH_DATA, today a yyyy-mm-dd. */
function checkHub(liveHubs, data, today){
  const next = id => {
    const h = ((data && data.hubs) || []).find(x => x.id === id);
    const days = ((h && h.exams) || []).map(e => e.date).filter(d => d && d >= today).sort();
    return days[0] || '9999-12-31';
  };
  return liveHubs.slice().sort((a, b) => (next(a) < next(b) ? -1 : next(a) > next(b) ? 1 : liveHubs.indexOf(a) - liveHubs.indexOf(b)))[0] || 'dashboard';
}
/* Only site.json changed: check the new version starts and answers, without a model call (free, and nothing is stored).
   A question asked from a mock exam is answered "paused" before any content, database or model is touched. */
async function pingTimmy(to){
  const body = { visitor: 'after-merge-' + to.slice(0, 7), hub: 'dashboard', text: 'Are you there?', chat: null,
    request: 'am' + to.slice(0, 7) + crypto.randomBytes(6).toString('hex'), voice: 'timmy', context: { view: 'questions/mock' } };
  const r = await fetch(`${API}/functions/v1/timmy`, { method: 'POST', body: JSON.stringify(body),
    headers: { 'content-type': 'application/json', origin: ORIGIN, ...(process.env.SB_KEY ? { apikey: process.env.SB_KEY } : {}) } });
  let d = null; try { d = await r.json(); } catch (e) {}
  if (!r.ok || !d || !d.ok || d.kind !== 'paused') throw new Error(`the function answered ${r.status}${d && (d.error || d.kind) ? ' (' + (d.error || d.kind) + ')' : ''}, not its "paused" answer: read the function's log (vault/reference/ask-timmy.md)`);
  return 'only the site help changed: the new version answers (a free check, no model call)';
}
async function askTimmy(to, liveHubs){
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
  const hub = checkHub(liveHubs, (() => { try { return require(path.join(ROOT, 'tools', 'release', 'lib.js')).hubData(); } catch (e) { return null; } })(), today);
  const body = { visitor: 'after-merge-' + to.slice(0, 7), hub, text: hub === 'dashboard' ? 'What can the hubs do?' : 'When is the exam, and what is on it?',
    chat: null, request: 'am' + to.slice(0, 7) + crypto.randomBytes(6).toString('hex'), voice: 'timmy', context: { view: 'home' } };
  if (hub === 'dashboard') body.hubs = liveHubs;
  const r = await fetch(`${API}/functions/v1/timmy`, { method: 'POST', body: JSON.stringify(body),
    headers: { 'content-type': 'application/json', origin: ORIGIN, ...(process.env.SB_KEY ? { apikey: process.env.SB_KEY } : {}) } });
  let d = null; try { d = await r.json(); } catch (e) {}
  if (!r.ok || !d || !d.ok) throw new Error(`the function answered ${r.status}${d && d.error ? ' (' + d.error + ')' : ''}`);
  if (NAPS.includes(d.kind)) throw new Error(`Timmy answered with his "${d.kind}" nap, not an answer: read the function's log (vault/reference/ask-timmy.md)`);
  return `${hub}: "${body.text}" came back as ${d.kind} (visitor ${body.visitor}, the admin page's Ask Timmy tab shows it)`;
}
async function waitLive(to, files){
  // a few small files stand for the push (the post-release check then compares every one)
  const probe = files.filter(f => !/\.(mp3|png|jpe?g|webp|woff2?)$/.test(f)).slice(0, 4);
  if (!probe.length) probe.push(files[0]);
  const want = Object.fromEntries(probe.map(f => [f, crypto.createHash('sha256').update(show(to, f)).digest('hex')]));
  const t0 = Date.now();
  while (Date.now() - t0 < 15 * 60000) {
    let same = 0;
    for (const f of probe) {
      try { const r = await fetch(LIVE + f + '?after-merge=' + Date.now()); if (r.ok && crypto.createHash('sha256').update(Buffer.from(await r.arrayBuffer())).digest('hex') === want[f]) same++; } catch (e) {}
    }
    if (same === probe.length) return `GitHub Pages serves the push (${Math.round((Date.now() - t0) / 1000)} s; checked ${probe.join(', ')})`;
    await sleep(30000);
  }
  throw new Error(`GitHub Pages still didn't serve the push after 15 minutes (${probe.join(', ')}): see "pages build and deployment" in Actions (vault/reference/shared-infrastructure.md)`);
}

/* ------------------------------------------------------------------------------------------------------ run */
async function main(){
  const argv = process.argv.slice(2), arg = n => (i => i >= 0 ? argv[i + 1] : null)(argv.indexOf('--' + n));
  const all = (n) => argv.reduce((a, v, i) => (v === '--' + n && argv[i + 1] ? a.concat(argv[i + 1]) : a), []);
  const DRY = argv.includes('--dry'), ONLY = arg('only') ? arg('only').split(',') : STEPS;
  const bad = ONLY.filter(s => !STEPS.includes(s)); if (bad.length) { console.error('✗ unknown step(s): ' + bad.join(', ')); process.exit(2); }
  const to = git('rev-parse', arg('to') || 'HEAD').toString().trim();
  let from = arg('from');
  if (!from || /^0+$/.test(from)) from = to + '^1';
  from = git('rev-parse', from).toString().trim();
  const extraFixes = all('fix').map(f => f.replace(/^\.\//, ''));
  for (const f of extraFixes) if (!/^tools\/data-fixes\/[A-Za-z0-9._-]+\.sql$/.test(f) || !show(to, f)) { console.error(`✗ --fix ${f}: not a data fix in tools/data-fixes/ at ${to.slice(0, 7)}`); process.exit(2); }

  const P = plan({ changes: changesBetween(from, to), extraFixes, engineHubs: engineHubs(to), added: addedLines(from, to),
    podcast: hub => ({ before: episode(from, hub), after: episode(to, hub) }) });
  const status = (() => { try { return require(path.join(ROOT, 'tools', 'release', 'lib.js')).hubStatus(); } catch (e) { return {}; } })();
  const liveHubs = engineHubs(to).filter(h => status[h] === 'live');

  const rows = [], has = (...k) => k.every(n => process.env[n]);
  const step = async (name, what, needs, fn) => {
    if (!ONLY.includes(name)) return;
    if (DRY) { rows.push([name, 'planned', what]); return; }
    if (!has(...needs)) { rows.push([name, 'blocked', `${what}: needs ${needs.filter(n => !process.env[n]).join(' and ')} (the workflow's secrets: vault/how-to/after-a-merge.md)`]); return; }
    try { rows.push([name, 'done', await fn()]); } catch (e) { rows.push([name, 'failed', `${what}: ${scrub(e.message)}`]); }
  };
  console.log(`after-merge: ${from.slice(0, 7)} → ${to.slice(0, 7)}${DRY ? ' (dry run: nothing is sent)' : ''}`);

  for (const hub of P.keys) await step('keys', `load ${hub}'s answer keys`, ['SB_KEY', 'ADMIN_SECRET'], async () => {
    const r = node(['tools/xp/keys.js', hub, '--load']); if (!r.ok) throw new Error(r.out.slice(-300)); return `${hub}: ${r.out.split('\n').filter(Boolean).join('; ')}`;
  });
  if (P.timmy) await step('timmy', P.timmyCode ? 'deploy Ask Timmy and ask it one question' : 'deploy Ask Timmy and check it answers', ['SUPABASE_ACCESS_TOKEN'], async () => {
    const r = node(['tools/timmy/deploy.mjs']); if (!r.ok) throw new Error(r.out.slice(-300));
    const v = (r.out.match(/version \d+/) || ['deployed'])[0];
    await sleep(10000);   // the new version takes a few seconds to serve
    return `${v}; ${P.timmyCode ? await askTimmy(to, liveHubs) : await pingTimmy(to)}`;
  });
  for (const e of P.podcast) await step('podcast', `register ${e.hub}'s episode ${e.id}`, ['SB_KEY', 'ADMIN_SECRET'], async () => {
    if (!(e.seconds >= 60 && e.seconds <= 14400)) throw new Error(`its duration (${e.seconds} s) is outside 60-14400`);
    await rpc('admin_set_podcast_episode', { p_secret: process.env.ADMIN_SECRET, p_hub: e.hub, p_ep: e.id, p_seconds: e.seconds });
    return `${e.hub}: ${e.id}, ${e.seconds} s (listening now earns XP)`;
  });

  let live = !P.site.length;
  if (P.site.length && (P.fixes.length || P.changelog.length || ONLY.includes('postcheck'))) await step('live', 'wait for GitHub Pages to serve the push', [], async () => { const m = await waitLive(to, P.site); live = true; return m; });
  if (DRY) live = true;
  for (const f of P.fixes) await step('fixes', `run ${f}`, ['SUPABASE_ACCESS_TOKEN'], async () => {
    if (!live) throw new Error('not run: the push isn\'t live yet, and a fix counts the new pages\' answers (run it later with --fix)');
    await sql(show(to, f).toString()); return `${f}: ran once (its result rows stay in the database)`;
  });
  for (const c of P.changelog) await step('changelog', `log "${c.message.slice(0, 60)}${c.message.length > 60 ? '...' : ''}" for ${c.hub}`, ['SB_KEY', 'ADMIN_SECRET'], async () => {
    await rpc('log_changelog', { p_secret: process.env.ADMIN_SECRET, p_hub: c.hub, p_message: c.message }); return `${c.hub}: ${c.message}`;
  });
  if (P.site.length) await step('postcheck', 'the post-release check (live pages, read-only)', [], async () => {
    const r = node(['tools/release/postcheck.js', '--from', from, '--to', to]);
    const last = r.out.split('\n').filter(Boolean).slice(-6).join(' / ');
    if (!r.ok) throw new Error(last); return last.slice(0, 300);
  });
  const hubsChanged = [...new Set(P.site.map(f => (/^hubs\/([^/]+)\//.exec(f) || [])[1]).filter(Boolean))];
  const logged = new Set(P.changelog.map(c => c.hub));
  const quiet = hubsChanged.filter(h => !logged.has(h) && !logged.has('all'));
  if (quiet.length && ONLY.includes('changelog')) P.warnings.push(`no changelog line for ${quiet.join(', ')} (fine when students wouldn't notice; otherwise add one to ${CHANGELOG} next time)`);
  if (!rows.length) rows.push(['-', 'nothing', 'this push needs no after-merge step']);

  const table = ['| Step | Result | What |', '|---|---|---|', ...rows.map(r => `| ${r[0]} | ${r[1]} | ${String(r[2]).replace(/\|/g, '\\|').replace(/\n/g, ' ')} |`)];
  const text = [`## After merge: ${from.slice(0, 7)} → ${to.slice(0, 7)}`, '', ...table, ...(P.warnings.length ? ['', ...P.warnings.map(w => '- ' + w)] : [])].join('\n');
  console.log(text);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, text + '\n');
  const failed = rows.filter(r => r[1] === 'failed' || r[1] === 'blocked');
  if (failed.length) { console.log(`\n✗ ${failed.length} step(s) didn't finish: run them again by hand (Actions → After merge → Run workflow) once fixed`); process.exit(1); }
  console.log('\n✓ after-merge steps done');
}

module.exports = { plan, isSite, checkHub };
if (require.main === module) main().catch(e => { console.error(scrub(String(e && e.stack || e))); process.exit(1); });
