#!/usr/bin/env node
// Can this pull request's CI keep an earlier green result instead of running its long checks again? (Sam, 2026-11-13,
// after a merge waited most of an hour while main moved three times, twice with notes only: "do 1 and 2 in their own PR".)
//
// Yes when an earlier run of the same workflow on this pull request actually ran its long jobs (the jobs whose names
// start with <job prefix>) and they all passed, and every file that differs between the commit that run tested and the
// commit being tested now is a note: a .md file anywhere, or .obsidian/. Only the fast checks read those (vault.js,
// secrets.js), and they always run. The comparison is with the merge commit being tested now (GITHUB_SHA), which has
// main in it, so a code change that came in from main means the long checks run again, and a merge of main that brought
// only notes doesn't. A run that kept an earlier result is never itself kept: the next one compares with the run that
// did the testing.
//
// It also says whether a newer push to the pull request has come in (newer=yes), so an old run steps aside instead of
// starting its long jobs and cancelling the new run's (2026-11-13: an older run's late job cancelled the head's).
//
//   CI:    node tools/ci/reuse.js <workflow file> <job prefix>
//          env: GH_TOKEN (needs actions: read), PR_NUMBER, PR_HEAD_REF, PR_HEAD_SHA, REUSE_OFF=true to run everything;
//          writes reuse=yes|no, from=<sha>, newer=yes|no to GITHUB_OUTPUT and a line to the run's summary
//   local: node tools/ci/reuse.js --diff <from> [<to>]     only the file test: what changed that isn't a note
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '../..');
const NOTES = /(^|\/)[^/]+\.md$|^\.obsidian\//;
const git = (...a) => execFileSync('git', a, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const notNotes = (from, to) => git('diff', '--name-only', '--no-renames', from, to).split('\n').filter(f => f && !NOTES.test(f));
function have(sha){
  try { git('cat-file', '-e', sha + '^{commit}'); return true; } catch (e) {}
  try { git('fetch', '--quiet', '--no-tags', '--filter=blob:none', 'origin', sha); return true; } catch (e) { return false; }
}

if (process.argv[2] === '--diff') {
  const [from, to = 'HEAD'] = process.argv.slice(3);
  if (!from) { console.error('usage: node tools/ci/reuse.js --diff <from> [<to>]'); process.exit(2); }
  const rest = notNotes(from, to);
  console.log(rest.length ? `not only notes: ${rest.length} file(s) would run the long checks again:\n  ${rest.join('\n  ')}` : `only notes changed from ${from} to ${to}: an earlier green result would be kept`);
  process.exit(0);
}

const E = process.env, [WF, PREFIX] = process.argv.slice(2);
const out = (k, v) => { if (E.GITHUB_OUTPUT) fs.appendFileSync(E.GITHUB_OUTPUT, `${k}=${v}\n`); };
const say = t => { console.log(t); if (E.GITHUB_STEP_SUMMARY) fs.appendFileSync(E.GITHUB_STEP_SUMMARY, t + '\n'); };
const API = E.GITHUB_API_URL || 'https://api.github.com', REPO = E.GITHUB_REPOSITORY;
async function gh(p){
  const r = await fetch(API + p, { headers: { authorization: `Bearer ${E.GH_TOKEN}`, accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28', 'user-agent': 'study-hubs-ci' } });
  if (!r.ok) throw new Error(`GitHub answered ${r.status} for ${p.split('?')[0]}`);
  return r.json();
}
function done(reuse, line, from){ out('reuse', reuse ? 'yes' : 'no'); if (from) out('from', from); say(line); }

(async () => {
  if (!WF || !PREFIX) { console.error('usage: node tools/ci/reuse.js <workflow file> <job prefix>'); process.exit(2); }
  if (!E.PR_NUMBER || !E.GH_TOKEN || !E.GITHUB_SHA) { out('newer', 'no'); return done(false, 'Not a pull request: every check runs.'); }
  const short = s => String(s).slice(0, 7);
  try {
    const pr = await gh(`/repos/${REPO}/pulls/${E.PR_NUMBER}`);
    if (pr.head && E.PR_HEAD_SHA && pr.head.sha !== E.PR_HEAD_SHA) {
      out('newer', 'yes');
      return done(false, `A newer push (${short(pr.head.sha)}) is being tested, so this run (${short(E.PR_HEAD_SHA)}) steps aside.`);
    }
  } catch (e) { console.log(`(couldn't check for a newer push: ${e.message})`); }
  out('newer', 'no');
  if (E.REUSE_OFF === 'true') return done(false, 'The `full-tests` label is on: every check runs.');
  let runs;
  try {
    runs = (await gh(`/repos/${REPO}/actions/workflows/${WF}/runs?event=pull_request&status=success&branch=${encodeURIComponent(E.PR_HEAD_REF || '')}&per_page=20`)).workflow_runs || [];
  } catch (e) { return done(false, `Every check runs (couldn't list this pull request's earlier runs: ${e.message}).`); }
  runs = runs.filter(r => String(r.id) !== String(E.GITHUB_RUN_ID) && (r.pull_requests || []).some(p => String(p.number) === String(E.PR_NUMBER)));
  let why = 'no earlier run of this pull request passed';
  const seen = new Set();
  for (const r of runs.slice(0, 10)) {
    if (seen.has(r.head_sha)) continue; seen.add(r.head_sha);
    let jobs;
    try { jobs = ((await gh(`/repos/${REPO}/actions/runs/${r.id}/jobs?per_page=50`)).jobs || []).filter(j => j.name.startsWith(PREFIX)); } catch (e) { continue; }
    if (!jobs.length || jobs.some(j => j.conclusion !== 'success')) { why = 'no earlier run of this pull request ran its long checks and passed'; continue; }
    if (!have(r.head_sha)) continue;
    let rest;
    try { rest = notNotes(r.head_sha, E.GITHUB_SHA); } catch (e) { continue; }
    if (!rest.length) {
      return done(true, `Only notes changed since [run #${r.run_number}](${r.html_url}) passed on ${short(r.head_sha)}, so its ${jobs.length} long job(s) still hold and are skipped here (\`node tools/ci/reuse.js\`). The fast checks still run.`, r.head_sha);
    }
    why = `code changed since the last green run (${rest.slice(0, 3).join(', ')}${rest.length > 3 ? `, and ${rest.length - 3} more` : ''})`;
    break;
  }
  done(false, `Every check runs: ${why}.`);
})().catch(e => { out('reuse', 'no'); say(`Every check runs (${e.message}).`); });
