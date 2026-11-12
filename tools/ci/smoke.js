// Browser smoke test + question-bank lint for every live hub and the dashboard.
// Class data (Supabase) is stubbed with empty results; nothing is written anywhere.
//   npm i --no-save playwright && npx playwright install chromium && node tools/ci/smoke.js
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const root = path.resolve(__dirname, '../..');
const TYPES = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css', '.mp3':'audio/mpeg', '.svg':'image/svg+xml', '.png':'image/png', '.webp':'image/webp', '.mp4':'video/mp4', '.webm':'video/webm', '.json':'application/json' };
const server = http.createServer((req, res) => {
  let u = decodeURIComponent(req.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html';
  const f = path.join(root, u); if (!f.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.stat(f, (e, st) => { if (e || !st.isFile()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Content-Length': st.size }); fs.createReadStream(f).pipe(res); });
}).listen(0, '127.0.0.1');
const BASE = () => `http://127.0.0.1:${server.address().port}/`;
const allHubs = fs.readdirSync(path.join(root, 'hubs')).filter(h => fs.existsSync(path.join(root, 'hubs', h, 'index.html')));
/* Which hubs to click through and lint (2026-11-06): only the hubs a change touches, because one hub's files never
   reach another hub's page (no hub loads another's files). Every hub when a shared file changes (widget/, the dashboard,
   sw.js, assets, a workflow, this test), on main, with --all or SMOKE_ALL=1, or when git can't tell what changed. Files
   that never reach a page (notes, tools, SQL, the vault, about/ and review/, which this test doesn't open) don't count.
   The dashboard is always checked. SMOKE_CHANGED_FROM=<git ref> sets the base (CI: the PR's base, HEAD^1 of the merge
   commit); locally it's where this branch left origin/main, and uncommitted and new files count too. */
const NEVER_ON_A_PAGE = /^(vault\/|tools\/|supabase\/|\.claude\/|\.obsidian\/|about\/|review\/|migration_v[^/]*\.sql$|\.gitignore$)|(^|\/)[^/]+\.md$/;
function pickHubs(){
  if (process.argv.includes('--all') || process.env.SMOKE_ALL) return { hubs: allHubs, why: 'every hub (--all)' };
  let base = process.env.SMOKE_CHANGED_FROM;
  if (!base && process.env.CI) return { hubs: allHubs, why: 'every hub (a CI run that is not a pull request)' };
  const git = (...a) => require('child_process').execFileSync('git', a, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  let changed;
  try {
    if (!base) base = git('merge-base', 'HEAD', 'origin/main').trim();
    changed = (git('diff', '--name-only', '--no-renames', base) + '\n' + git('ls-files', '--others', '--exclude-standard')).split('\n').filter(Boolean);
  } catch (e) { return { hubs: allHubs, why: `every hub (git couldn't tell what changed${base ? ' since ' + base : ''})` }; }
  const touched = new Set();
  for (const f of changed) {
    const m = /^hubs\/([^/]+)\//.exec(f) || /^tools\/question-ids\/([^/]+)\.txt$/.exec(f);
    if (m) { touched.add(m[1]); continue; }
    if (f === 'tools/ci/smoke.js' || !NEVER_ON_A_PAGE.test(f)) return { hubs: allHubs, why: `every hub (${f} is shared)` };
  }
  const hubs = allHubs.filter(h => touched.has(h));
  return { hubs, why: (hubs.length ? `the hub(s) this change touches: ${hubs.join(', ')}` : 'no hub changed, so the dashboard only') + ' (--all checks every hub)' };
}
const { hubs, why: hubsWhy } = pickHubs();
console.log(`Smoke test: ${hubsWhy}`);
/* the redesign's new versions (hubs/<id>/next/, widget/hub.js), built beside the live hubs until the release: those of
   the hubs picked above (a change to hubs/<id>/next/ touches <id>; widget/hub.js is shared, so it picks every hub) */
const nextHubs = hubs.filter(h => fs.existsSync(path.join(root, 'hubs', h, 'next', 'index.html')));
const problems = [], notes = [];

/* the idea board (widget/ideas.js; its server is migration_v54, not applied until the redesign's release): a made-up
   board, so the new dashboard and a new hub's More have something to draw. One title is markup, which must show as text. */
const IDEAS = { total: 4, hubs: { '': 3, perio: 1 }, categories: { feature: 2, fun: 1, content: 1 }, ideas: [
  { id: 1, title: 'Smoke idea one', body: 'A made-up idea.', name: 'Test Molar', hub: null, category: 'feature', source: 'board', status: 'planned', note: 'A made-up reason.', up: 5, down: 1, at: new Date(Date.now() - 864e5).toISOString(), own: false, mine: 0, reported: false },
  { id: 2, title: '<img src=x onerror="window.__idea=1">', body: '<b>bold</b>', name: '<i>Name</i>', hub: 'perio', category: 'content', source: 'checkin', status: 'open', note: null, up: 2, down: 0, at: new Date(Date.now() - 2 * 864e5).toISOString(), own: false, mine: 0, reported: false },
  { id: 3, title: 'Smoke idea three', body: '', name: 'Timmy Tooth', hub: null, category: 'fun', source: 'starter', status: 'open', note: null, up: 1, down: 0, at: new Date(Date.now() - 3 * 864e5).toISOString(), own: false, mine: 0, reported: false },
  { id: 4, title: 'Smoke idea four, mine', body: '', name: 'Test Molar', hub: null, category: 'feature', source: 'board', status: 'open', note: null, up: 0, down: 0, at: new Date(Date.now() - 4 * 864e5).toISOString(), own: true, mine: 0, reported: false }] };
async function stub(context){
  await context.route(/^https?:\/\/(?!127\.0\.0\.1)/, route => {
    const u = route.request().url();
    if (/supabase\.co\/rest\/v1\/rpc\/get_ideas/.test(u)) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(IDEAS) });
    if (/supabase\.co\/rest\/v1\/rpc\/vote_idea/.test(u)) return route.fulfill({ status: 200, contentType: 'application/json', body: '{"up":6,"down":1,"mine":1}' });
    if (/supabase\.co\/rest\/v1\/rpc\/get_display_name/.test(u)) return route.fulfill({ status: 200, contentType: 'application/json', body: '"Test Molar"' });
    if (/supabase\.co\/rest\/v1\//.test(u)) return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    return route.abort();
  });
  if (context.routeWebSocket) await context.routeWebSocket(/.*/, ws => ws.close());
  // the first-visit "Want a quick tour?" prompt dims the page and would block the clicks below; answer it up front
  await context.addInitScript(() => { try { localStorage.setItem('sh_tour', 'no'); localStorage.setItem('sh_tour_hub', 'no'); } catch (e) {} });
}

/* matching items allowed to repeat an answer because that hub grades matches by answer text (perio, since 2026-09-29) */
const SAME_ANSWER_OK = new Set(['perio:q4-L27']);
/* every multiple-choice and select-all question explains each of its choices (q.why, one line per choice, same order;
   Sam's standing rule, 2026-10-20). Hubs archived before the rule are exempt: their exams are over. */
const WHY_EXEMPT = new Set(['msk-exam3', 'msk-exam4', 'pcd-exam3']);
/* every taught lecture's questions include two-statement and true/false items (Sam's standing rule, 2026-10-22;
   vault/rules/two-statement-and-true-false.md) and numbered-statement items (2026-10-28;
   vault/rules/numbered-statements.md). Archived hubs are exempt, and so are the perio sessions taught before the rules (its engine has neither
   true/false nor numbered items yet): a lecture taught after them, in any live or new hub, needs all three formats. */
const FORMAT_EXEMPT = new Set(['msk-exam3', 'msk-exam4', 'pcd-exam3']);
const FORMAT_GRANDFATHERED = new Set(['perio:diagnosis-tx-planning', 'perio:incisions-flaps-sutures', 'perio:risk-assessment', 'perio:phase1-therapy', 'perio:resective-furcation']);
const FORMAT_MIN = { '2stmt': 3, tf: 5, numbered: 2 };
/* "Which statement is true?" (fmt 'which': one true, three false) and "Which statement is false?" (fmt 'whichf': one false,
   three true): Sam's standing rule, 2026-11-10 (vault/rules/which-statement-questions.md). Every lecture taught after it
   needs at least one of each. Hubs archived before the rule are exempt, and so are the lectures already taught then
   (Occlusion's midterm lectures, Heme & Endo Exam 2's Exam 1 Refresher, Perio's sessions through Session 9). */
const WHICH_MIN = { which: 1, whichf: 1 };
const WHICH_EXEMPT = new Set(['msk-exam3', 'msk-exam4', 'pcd-exam3', 'heme-endo-exam1', 'pcd-implants-exam1', 'special-patient-care']);
const WHICH_GRANDFATHERED = new Set(['occlusion:review', 'occlusion:anatomy', 'occlusion:function', 'occlusion:concepts', 'occlusion:applying',
  'heme-endo-exam2:refresh', 'perio:diagnosis-tx-planning', 'perio:incisions-flaps-sutures', 'perio:risk-assessment', 'perio:phase1-therapy',
  'perio:resective-furcation', 'perio:implants-perio', 'perio:antibiotics-host-mod', 'perio:perio-plastic-esthetics']);
/* High Likelihood Exam Questions (Sam's standing rule, 2026-10-30; vault/rules/high-likelihood-topics.md):
   every lecture with questions has at least one LIKELY_TOPICS entry, so a lecture added to a hub is ranked too, and every
   topic's ids exist in that lecture. Archived hubs from before the rule are exempt, and so are lectures whose exam is over
   while the hub stays up for a later one (Occlusion's midterm lectures; the final isn't cumulative). */
const LIKELY_EXEMPT = new Set(['msk-exam3', 'msk-exam4', 'pcd-exam3']);
const LIKELY_SKIP = new Set(['occlusion:review', 'occlusion:anatomy', 'occlusion:function', 'occlusion:concepts', 'occlusion:applying']);
const FORMAT_NAME = { '2stmt': 'two-statement', tf: 'true/false', numbered: 'numbered-statement', which: '"which statement is true"', whichf: '"which statement is false"' };
const TWO_CHOICES = ['Both statements are true', 'Both statements are false', 'Statement 1 is true; statement 2 is false', 'Statement 1 is false; statement 2 is true'];
/* Question ids are permanent (vault/rules/question-ids-are-permanent.md): class data, reports, pins and question health
   are keyed on them. tools/question-ids/<hub>.txt lists every id the hub has ever shipped, "<id> retired" for one deleted
   on purpose. A registered id missing from the hub (renamed or deleted) fails, and so does a retired id coming back.
   A new id is added to the file by a local run; CI (which can't commit) fails until it's there. */
const IDS_DIR = path.join(root, 'tools', 'question-ids');
function checkIds(hub, qids){
  const file = path.join(IDS_DIR, `${hub}.txt`), rel = `tools/question-ids/${hub}.txt`, ci = !!process.env.CI;
  const live = new Set(), retired = new Set(), have = new Set(qids);
  const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  if (text !== null) text.split('\n').forEach(line => {
    const t = line.replace(/#.*/, '').trim(); if (!t) return;
    const [id, flag] = t.split(/\s+/); (flag === 'retired' ? retired : live).add(id);
  });
  live.forEach(id => { if (!have.has(id) && !retired.has(id)) problems.push(`${hub}: question id ${id} is gone from the hub. Ids are permanent: give it back its id (edit the question in place), or, if it was deleted on purpose, change its line in ${rel} to "${id} retired"`); });
  qids.forEach(id => { if (retired.has(id)) problems.push(`${hub}: question id ${id} was retired; a new question needs a new id (${rel})`); });
  const fresh = qids.filter(id => !live.has(id) && !retired.has(id));
  if (!fresh.length) return;
  if (ci) { problems.push(`${hub}: ${fresh.length} question id(s) not in ${rel} yet: run node tools/ci/smoke.js locally (it adds them), or add these ids, one per line: ${fresh.join(", ")}`); return; }
  fs.mkdirSync(IDS_DIR, { recursive: true });
  const head = text === null ? `# Question ids for hubs/${hub}: every id this hub has ever shipped, one per line, never reused.\n` +
    `# "<id> retired" marks a question deleted on purpose. Rules: vault/rules/question-ids-are-permanent.md\n` : (text.endsWith('\n') ? '' : '\n');
  fs.appendFileSync(file, head + fresh.join('\n') + '\n');
  notes.push(`${hub}: added ${fresh.length} new question id(s) to ${rel} (commit it)`);
}
function lint(hub, A){
  const Q = A.QUESTIONS || [], L = A.LECTURES || [], ids = new Set(), lecIds = new Set(L.map(l => l.id)), longItems = [];
  checkIds(hub, Q.map(q => String(q.id)));
  Q.forEach(q => {
    if (ids.has(q.id)) problems.push(`${hub}: duplicate question id ${q.id}`); ids.add(q.id);
    if (!lecIds.has(q.lec)) problems.push(`${hub}: ${q.id} points at unknown lecture "${q.lec}"`);
    if (q.type === 'mcq') {
      const ch = q.choices || [];
      if (ch.length < 2) problems.push(`${hub}: ${q.id} has fewer than 2 choices`);
      if (!(q.answer >= 0 && q.answer < ch.length)) problems.push(`${hub}: ${q.id} answer index ${q.answer} is out of range`);
      const low = ch.map(c => String(c).trim().toLowerCase()); if (new Set(low).size !== low.length) problems.push(`${hub}: ${q.id} has duplicate choices`);
    }
    if (q.type !== 'recall' && !String(q.ex || '').trim()) problems.push(`${hub}: ${q.id} has no explanation`);
    if ((q.type === 'mcq' || q.type === 'multi') && !WHY_EXEMPT.has(hub)) {
      const w = q.why || [];
      if (w.length !== (q.choices || []).length || w.some(x => !String(x || '').trim())) problems.push(`${hub}: ${q.id} needs a why for every choice (q.why: ${w.length} of ${(q.choices || []).length}; add its row to QUESTION_WHY)`);
    }
    if (q.type === 'match') {
      /* two items with the same answer: grading by index marks the other copy wrong (perio q4-L27, LESSONS.md) */
      ['left', 'right'].forEach((side, k) => {
        const vals = (q.pairs || []).map(p => String(p[k]).trim().toLowerCase());
        if (new Set(vals).size !== vals.length && !SAME_ANSWER_OK.has(`${hub}:${q.id}`)) problems.push(`${hub}: ${q.id} matching has the same ${side}-hand item twice (give each pair a distinct answer)`);
      });
    }
    if (q.fmt === '2stmt') {
      if ((q.choices || []).join('|') !== TWO_CHOICES.join('|')) problems.push(`${hub}: ${q.id} two-statement choices must be exactly: ${TWO_CHOICES.join(' / ')}`);
      if (!/\n1\. [^]*\n2\. /.test(q.stem || '')) problems.push(`${hub}: ${q.id} two-statement stem needs its statements on lines starting "1. " and "2. "`);
    }
    if (q.fmt === 'tf' && (q.choices || []).join('|') !== 'True|False') problems.push(`${hub}: ${q.id} true/false choices must be exactly True / False`);
    if (q.fmt === 'numbered') {
      /* "Which ... are true?" with numbered statements; choices are combinations ("1 and 3 only", "1, 2 and 4") in a
         fixed canonical order, sorted by their numbers (choiceOrder never shuffles them) */
      const n = ((q.stem || '').match(/\n\d+\. /g) || []).length, ch = (q.choices || []).map(String);
      const sets = ch.map(c => (c.match(/\d+/g) || []).map(Number));
      const cmp = (a, b) => { for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i] - b[i]; return a.length - b.length; };
      if (n < 3) problems.push(`${hub}: ${q.id} numbered-statement stem needs 3 or more statements on lines starting "1. ", "2. ", "3. "`);
      if (!ch.every(c => /^\d+( only| and \d+ only|(, \d+)+ and \d+)$/.test(c))) problems.push(`${hub}: ${q.id} numbered-statement choices must read like "2 only", "1 and 3 only" or "1, 2 and 4"`);
      if (sets.some(st => st.some(k => k < 1 || k > n))) problems.push(`${hub}: ${q.id} a numbered-statement choice names a statement the stem doesn't have`);
      if (sets.some((st, i) => i && cmp(sets[i - 1], st) >= 0)) problems.push(`${hub}: ${q.id} numbered-statement choices must be in canonical order (sorted by their numbers)`);
    }
    if (q.fmt === 'which' || q.fmt === 'whichf') {
      /* four (or more) statements that each stand alone; one true (which) or one false (whichf); the choices shuffle */
      const st = q.stem || '', neg = /\b(false|incorrect|not true|not correct|EXCEPT)\b/i.test(st);
      if (q.type !== 'mcq' || (q.choices || []).length < 4) problems.push(`${hub}: ${q.id} a "which statement" item needs 4 or more statements as its choices`);
      if (!/\bwhich\b/i.test(st)) problems.push(`${hub}: ${q.id} a "which statement" stem asks "Which statement ... ?"`);
      if (q.fmt === 'which' && neg) problems.push(`${hub}: ${q.id} asks for the false statement: make it fmt 'whichf' (whichf())`);
      if (q.fmt === 'whichf' && !neg) problems.push(`${hub}: ${q.id} is fmt 'whichf' but its stem doesn't ask which statement is false`);
    }
    if (q.type === 'sequence' && (q.steps || []).length > 5) longItems.push(`${q.id} (${q.steps.length} steps)`);
    if (q.type === 'multi' && (q.choices || []).length > 6) longItems.push(`${q.id} (${q.choices.length} options)`);
  });
  if (!LIKELY_EXEMPT.has(hub)) {
    const T = A.LIKELY_TOPICS;
    if (!Array.isArray(T)) problems.push(`${hub}: no LIKELY_TOPICS (High Likelihood Exam Questions; copy it from special-patient-care)`);
    else {
      const byId = new Map(Q.map(q => [q.id, q]));
      T.forEach(t => (t.ids || []).forEach(id => { const q = byId.get(id);
        if (!q) problems.push(`${hub}: LIKELY_TOPICS "${t.t}" lists unknown question ${id}`);
        else if (q.lec !== t.lec) problems.push(`${hub}: LIKELY_TOPICS "${t.t}" (${t.lec}) lists ${id}, which is in ${q.lec}`); }));
      L.forEach(l => { if (LIKELY_SKIP.has(`${hub}:${l.id}`) || !Q.some(q => q.lec === l.id)) return;
        if (!T.some(t => t.lec === l.id && (t.ids || []).length)) problems.push(`${hub}: lecture ${l.id} has no High Likelihood topics (add its LIKELY_TOPICS entries, ranked by hints and reviews)`); });
    }
  }
  if (longItems.length) notes.push(`${hub}: heads-up, long ordering/select-all items score very low (LESSONS.md): ${longItems.join(', ')}`);
  if (!FORMAT_EXEMPT.has(hub)) {
    L.forEach(l => {
      const lq = Q.filter(q => q.lec === l.id);
      if (!lq.length || (l.status && l.status !== 'taught') || FORMAT_GRANDFATHERED.has(`${hub}:${l.id}`)) return;
      Object.keys(FORMAT_MIN).forEach(f => { const n = lq.filter(q => q.fmt === f).length;
        if (n < FORMAT_MIN[f]) problems.push(`${hub}: lecture ${l.id} has ${n} ${FORMAT_NAME[f]} questions (needs at least ${FORMAT_MIN[f]}; see vault/rules/${f === 'numbered' ? 'numbered-statements' : 'two-statement-and-true-false'}.md)`); });
      if (WHICH_EXEMPT.has(hub) || WHICH_GRANDFATHERED.has(`${hub}:${l.id}`)) return;
      Object.keys(WHICH_MIN).forEach(f => { const n = lq.filter(q => q.fmt === f).length;
        if (n < WHICH_MIN[f]) problems.push(`${hub}: lecture ${l.id} has ${n} ${FORMAT_NAME[f]} questions (needs at least ${WHICH_MIN[f]}; see vault/rules/which-statement-questions.md)`); });
    });
    const tfq = Q.filter(q => q.fmt === 'tf');
    if (tfq.length >= 10) { const t = Math.round(100 * tfq.filter(q => q.answer === 0).length / tfq.length);
      if (t < 35 || t > 65) problems.push(`${hub}: ${t}% of true/false answers are True (keep it between 35% and 65%)`); }
    /* statement keys must not form a pattern (PCD Implants suggestion #14, 2026-11-04: 36 of 46 two-statement keys were
       "1 true, 2 false", and statement 1 was true in all 30 numbered items): spread two-statement keys over all four
       choices, numbered keys over every position, and the false statements over every number */
    const two = Q.filter(q => q.fmt === '2stmt');
    if (two.length >= 12) TWO_CHOICES.forEach((c, i) => { const t = Math.round(100 * two.filter(q => q.answer === i).length / two.length);
      if (t < 10 || t > 40) problems.push(`${hub}: "${c}" is the key of ${t}% of two-statement questions (keep each choice between 10% and 40%; swap statements or change which is false)`); });
    const numq = Q.filter(q => q.fmt === 'numbered');
    if (numq.length >= 8) {
      const most = Math.max(...[0, 1, 2, 3].map(i => numq.filter(q => q.answer === i).length));
      if (most / numq.length > 0.45) problems.push(`${hub}: ${Math.round(100 * most / numq.length)}% of numbered-statement keys are in the same position (keep it at 45% or less; pick the wrong combinations to move the key)`);
      [1, 2, 3, 4].forEach(k => { const t = numq.filter(q => (String(q.choices[q.answer]).match(/\d+/g) || []).map(Number).includes(k)).length;
        if (t / numq.length > 0.9) problems.push(`${hub}: statement ${k} is true in ${t} of ${numq.length} numbered-statement questions (put the false statements at different numbers)`); });
    }
  }
  const mc = Q.filter(q => q.type === 'mcq' && (q.choices || []).length >= 3);
  const longest = mc.filter(q => { const len = q.choices.map(c => String(c).length), a = len[q.answer]; return a > Math.max(...len.filter((_, i) => i !== q.answer)); }).length;
  const pct = mc.length ? Math.round(100 * longest / mc.length) : 0;
  notes.push(`${hub}: ${Q.length} questions, ${L.length} lectures; correct answer is the longest choice in ${pct}% of MCQs`);
  if (pct > 40) problems.push(`${hub}: the correct answer is the longest choice in ${pct}% of MCQs (keep it under 40%; chance is ~25%)`);
  const audioDir = path.join(root, 'hubs', hub, 'audio');
  /* an archived hub whose audio came off the site says data-audio="off" on its widget tag
     (vault/rules/archived-hubs-drop-their-audio.md): no narration is expected, and none may be left behind */
  const audioOff = (() => { try { return /<script[^>]*widget\/v3\.js"[^>]*\bdata-audio="off"/.test(fs.readFileSync(path.join(root, 'hubs', hub, 'index.html'), 'utf8')); } catch (e) { return false; } })();
  if (audioOff) {
    const left = fs.existsSync(audioDir) ? fs.readdirSync(audioDir).filter(f => /\.(mp3|words\.json)$/.test(f)) : [];
    if (left.length) problems.push(`${hub}: its widget tag says data-audio="off" but audio/ still holds ${left.length} file(s) (${left.slice(0, 3).join(', ')}): take them out, or drop data-audio="off"`);
    notes.push(`${hub}: audio off (archived; Listen uses the device's voice, no Timmy Time)`);
  } else if (fs.existsSync(audioDir)) L.forEach(l => {
    if (A.READINGS[l.id] && !fs.existsSync(path.join(audioDir, `${l.id}-full.mp3`))) problems.push(`${hub}: missing narration audio/${l.id}-full.mp3`);
    if (A.READINGS_PLAIN[l.id] && !fs.existsSync(path.join(audioDir, `${l.id}-plain.mp3`))) problems.push(`${hub}: missing narration audio/${l.id}-plain.mp3`);
  });
  /* Follow along (widget/hub.js): a redesigned hub's narration has its word timings beside it, made from that very mp3
     (tools/narration_words.py; tools/narrate.py writes them whenever it renders one) */
  const nextNotes = path.join(root, 'hubs', hub, 'next', 'content', 'notes.json');
  if (!audioOff && fs.existsSync(audioDir) && fs.existsSync(nextNotes)) {
    const NN = JSON.parse(fs.readFileSync(nextNotes, 'utf8'));
    const unrecorded = [];
    ['full', 'plain', 'hy'].forEach(level => Object.keys(NN[level] || {}).forEach(id => {
      const mp3 = path.join(audioDir, `${id}-${level}.mp3`), wf = mp3.replace(/\.mp3$/, '.words.json'), fix = `python3 tools/narration_words.py ${hub} --lec ${id} --level ${level}`;
      if (!fs.existsSync(mp3)) { if (level === 'hy') unrecorded.push(id); return; }
      if (!fs.existsSync(wf)) { problems.push(`${hub}: no word timings for audio/${id}-${level}.mp3 (${fix})`); return; }
      let d = null; try { d = JSON.parse(fs.readFileSync(wf, 'utf8')); } catch (e) {}
      if (!d || d.v !== 1) problems.push(`${hub}: audio/${id}-${level}.words.json can't be read (${fix})`);
      else if (d.bytes !== fs.statSync(mp3).size) problems.push(`${hub}: audio/${id}-${level}.words.json was made from another recording of it (${fix})`);
      else if (!d.w || !Array.isArray(d.t) || 2 * d.w.split(' ').length !== d.t.length) problems.push(`${hub}: audio/${id}-${level}.words.json has ${d.w ? d.w.split(' ').length : 0} words but ${(d.t || []).length / 2} times (${fix})`);
      /* High yield is rebuilt whenever the notes, predicted topics, hints or questions change (tools/hub-next/high-yield.mjs),
         so its recording says which text it was spoken from ("h", tools/narrate.py's text_hash) and must still match it
         (vault/rules/text-and-audio-never-drift.md); the build then offers it to the page (notes.json's hyAudio) */
      else if (level === 'hy' && d.h !== crypto.createHash('sha1').update(NN.hy[id], 'utf8').digest('hex').slice(0, 12))
        problems.push(`${hub}: audio/${id}-hy.mp3 was spoken from another version of ${id}'s High yield: record it again (python3 tools/narrate.py hubs/${hub}/next/content/notes.json --level hy --lec ${id} --force, then node tools/hub-next/build.mjs --hub ${hub})`);
    }));
    /* a lecture with High yield and no recording of it is allowed (Listen reads it in the device's voice), and named */
    if (unrecorded.length) notes.push(`${hub}: High yield not narrated for ${unrecorded.join(', ')} (Listen uses the device's voice there)`);
    const offered = (NN.hyAudio || []).filter(id => !fs.existsSync(path.join(audioDir, `${id}-hy.mp3`)));
    if (offered.length) problems.push(`${hub}: notes.json's hyAudio lists ${offered.join(', ')} with no audio/<lecture>-hy.mp3 (node tools/hub-next/build.mjs --hub ${hub})`);
  }
}

(async () => {
  await new Promise(r => server.listening ? r() : server.on('listening', r));
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  for (const vp of [{ width: 1366, height: 860 }, { width: 390, height: 844, isMobile: true }]) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.isMobile, hasTouch: !!vp.isMobile, serviceWorkers: 'block' }); /* sw.js would bypass the lint hook */
    await stub(context);
    const label = vp.isMobile ? 'phone' : 'desktop';
    // dashboard
    { const page = await context.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
      await page.goto(BASE() + 'index.html'); await page.waitForTimeout(800);
      errs.forEach(e => problems.push(`dashboard (${label}): ${e}`));
      const w = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (w > 1) problems.push(`dashboard (${label}): page scrolls sideways by ${w}px`);
      await page.close(); }
    // the redesigned dashboard (next/, widget/dash.js; beside the live one until the release): every hub tab, the class
    // board's two lists, Settings, the name dialog and the menu
    if (fs.existsSync(path.join(root, 'next', 'index.html'))) {
      const page = await context.newPage(); const errs = [], name = `next dashboard (${label})`; page.on('pageerror', e => errs.push(e.message));
      await page.goto(BASE() + 'next/index.html'); await page.waitForTimeout(1200);
      const sideways = async what => { const w = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (w > 1) problems.push(`${name}: ${what} scrolls sideways by ${w}px`); };
      if (!(await page.$('#dx h1'))) problems.push(`${name}: the page has no title`);
      const tabs = await page.$$eval('#hubTabs [data-tab]', bs => bs.map(b => b.getAttribute('data-tab')));
      if (!tabs.length && !(await page.$('.dx-empty'))) problems.push(`${name}: no hub tabs and no "no hubs are live" message`);
      for (const t of tabs) {
        await page.click(`#hubTabs [data-tab="${t}"]`); await page.waitForTimeout(250);
        const st = await page.evaluate(() => { const p = document.getElementById('hubPanel'); return { hub: p.getAttribute('data-hub'), start: !!p.querySelector('a.dx-start[href*="hubs/"]'), title: (p.querySelector('.dx-title') || {}).textContent || '' }; });
        if (st.hub !== t || !st.start || !st.title.trim()) problems.push(`${name}: the ${t} tab didn't open its hub (title, Start studying)`);
        await sideways(`the ${t} tab`);
      }
      if (tabs.length && !(await page.$('#hubPanel .dx-stage .dx-ring'))) problems.push(`${name}: the open hub has no progress ring`);
      for (const b of ['streaks', 'ranks']) { await page.click(`#boardSeg [data-board="${b}"]`); await page.waitForTimeout(200); if (!(await page.$('#board > *'))) problems.push(`${name}: the class board's ${b} list is empty`); await sideways(`the ${b} board`); }
      if (!(await page.$('#class #now #nowCount'))) problems.push(`${name}: the class panel has no "studying right now" count`);
      // the classroom in the studying-now tile, and the stage behind the top three (Sam, 2026-11-11). Eight made-up people at
      // once take their desks without the walk; an outfit that isn't one (here, markup) must come out as a plain Timmy.
      const room = await page.evaluate(async () => {
        const D = window.shDash, hubs = D && D.hubs ? D.hubs().map(h => h.id) : [], list = [];
        if (!D || !D.setLive || !hubs.length) return { skip: !hubs.length };
        for (let i = 0; i < 8; i++) list.push({ key: 'smoke' + i, hub: hubs[i % hubs.length], fit: ['', 'thanksgiving:turkey', '<img src=x onerror="window.__fit=1">', 'captain-hat'][i % 4] });
        // one of the eight is a hub tab of this browser's own (the key a hub tab remembers): only that desk gets "You"
        try { localStorage.setItem('sh_presence_mine', JSON.stringify({ [list[5].hub + '/smoke5']: Date.now() })); } catch (e) {}
        const by = {}; list.forEach(x => { by[x.hub] = (by[x.hub] || 0) + 1; }); D.setLive(by, list);
        await new Promise(r => setTimeout(r, 400));
        const out = { art: !!(window.SH_CLASS_ART && window.SH_CLASS_ART.room && window.SH_CLASS_ART.stage), room: !!document.querySelector('#now.has-room #room svg'), desks: document.querySelectorAll('#room .rm-seat').length,
          tims: document.querySelectorAll('#room .rm-tim svg').length, count: document.getElementById('nowCount').textContent, bad: document.querySelectorAll('#room img').length + (window.__fit ? 1 : 0),
          podium: !!document.querySelector('#board .dx-podium'), set: !!document.querySelector('#board .dx-set .st-win'),
          me: [...document.querySelectorAll('#nowMe .dx-me')].map(e => e.textContent).join('|') };
        D.setLive({}, []); out.after = document.querySelectorAll('#nowMe .dx-me').length;
        try { localStorage.removeItem('sh_presence_mine'); } catch (e) {}
        return out;
      });
      if (!room.skip) {
        if (!room.art || !room.room || room.desks < 8) problems.push(`${name}: the studying-now tile drew no classroom (${JSON.stringify(room)})`);
        else if (room.tims !== 8 || room.count !== '8') problems.push(`${name}: eight people studying, but the classroom seats ${room.tims} and the board says ${room.count}`);
        if (room.bad) problems.push(`${name}: an outfit from another browser was drawn as markup`);
        if (room.room && (room.me !== 'You' || room.after)) problems.push(`${name}: your own Timmy should be the only one tagged "You", and only while he's there (tags: "${room.me}", after everyone left: ${room.after})`);
        if (room.podium && !room.set) problems.push(`${name}: the leaderboard's top three have no stage`);
      }
      await sideways('the classroom');
      // taken out on Sam's call (2026-11-11): the What's new list, the arcade scores and the When people study chart
      for (const gone of ['#changelog', '#boardSeg [data-board="arcade"]', '#hoursLine']) if (await page.$(gone)) problems.push(`${name}: ${gone} is back on the page`);
      await page.click('#setBtn'); await page.waitForTimeout(200);
      if (!(await page.$('.dx-dlg [data-focus]')) || (await page.$$('.dx-dlg .set-row')).length < 8) problems.push(`${name}: Settings didn't open with Focus mode and the extras`);
      await page.keyboard.press('Escape'); await page.waitForTimeout(100);
      if (await page.$('.dx-dlg')) problems.push(`${name}: Escape didn't close Settings`);
      await page.click('#greetEdit'); await page.waitForTimeout(200);
      if (!(await page.$('.dx-dlg input'))) problems.push(`${name}: the name dialog didn't open`);
      await page.keyboard.press('Escape');
      await page.click('#menuBtn'); await page.waitForTimeout(100);
      if (!(await page.$('#dxMenu:not([hidden]) #tourBtn')) || !(await page.$('#dxMenu #aboutBtn'))) problems.push(`${name}: the menu didn't open with About and the tour`);
      await page.keyboard.press('Escape');
      if (!(await page.$('#ideas[data-sh-ideas]'))) problems.push(`${name}: the idea board's section (#ideas) is missing`);
      // the idea board (widget/ideas.js): the made-up board above is drawn, a vote counts, the form has the hub and the six
      // kinds, what a student wrote shows as text, and every button names itself with a fixed data- value (click counts
      // must never pick up anyone's words: learner-data-privacy)
      const board = await page.evaluate(async () => {
        const el = document.getElementById('ideas'), wait = ms => new Promise(r => setTimeout(r, ms));
        if (!el || el.hidden) return { hidden: true };
        el.scrollIntoView();   // its drawings (widget/hub-art/board.js) are fetched when the board comes near the screen
        for (let i = 0; i < 20 && !el.querySelector('.shi-card .shi-pin svg'); i++) await wait(150);
        const out = { cards: el.querySelectorAll('.shi-card').length, markup: el.querySelectorAll('.shi-card img, .shi-card b:not(.shi-meta b):not(.shi-why b), .shi-card i').length + (window.__idea ? 1 : 0),
          tags: [...el.querySelectorAll('.shi-card:nth-child(2) .shi-tag')].map(t => t.textContent).join('|'), status: !!el.querySelector('.shi-card .shi-why'),
          own: !!el.querySelector('.shi-card.is-own [data-shi="delete"]'), filters: el.querySelectorAll('[data-shi-filter] option').length };
        out.art = [el.querySelectorAll('.shi-card .shi-pin svg').length, el.querySelectorAll('.shi-card .shi-kindart svg').length, el.querySelectorAll('.shi-card .shi-stamp').length, el.querySelectorAll('.shi-card.is-top .shi-rosette svg').length].join(' ');
        const up = el.querySelector('.shi-card [data-shi="up"]'); up.click(); await wait(250);
        out.vote = up.getAttribute('aria-pressed') + ' ' + up.querySelector('.num').textContent;
        el.querySelector('[data-shi="new"]').click(); await wait(100);
        out.kinds = el.querySelectorAll('.shi-form .shi-kind input[type=radio]').length; out.hubs = (el.querySelector('.shi-form [data-shi-f="hub"] option') || {}).textContent;
        out.unnamed = [...el.querySelectorAll('button, label.shi-kind')].filter(b => ![...b.attributes].some(a => /^data-shi/.test(a.name) && a.value)).length;
        el.querySelector('[data-shi="cancel"]').click();
        return out;
      });
      if (board.hidden) problems.push(`${name}: the idea board didn't show`);
      else {
        if (board.cards !== 4 || !board.status || !board.own || board.filters < 9) problems.push(`${name}: the idea board is missing cards, a status line, Delete on my own idea or its filters (${JSON.stringify(board)})`);
        if (board.markup) problems.push(`${name}: an idea's words were drawn as markup`);
        if (board.art !== '4 4 1 1') problems.push(`${name}: the idea board's drawings are missing: every note has a pin and its kind's picture, Sam's answer is a stamp and the top idea wears the rosette (pins, kinds, stamps, rosette: ${board.art})`);
        if (board.tags !== 'Perio|Questions and notes|From a check-in') problems.push(`${name}: an idea's tags should be its hub, its kind and where it came from, not "${board.tags}"`);
        if (board.vote !== 'true 6') problems.push(`${name}: an up vote on the idea board didn't count (${board.vote})`);
        if (board.kinds !== 6 || board.hubs !== 'All hubs') problems.push(`${name}: the idea form should offer All hubs first and six kinds (${board.kinds}, ${board.hubs})`);
        if (board.unnamed) problems.push(`${name}: ${board.unnamed} idea board button(s) have no fixed data-shi name, so click counts would record their text`);
      }
      await sideways('the idea board');
      errs.forEach(e => problems.push(`${name}: JavaScript error: ${e}`));
      notes.push(`${name}: ${tabs.length} hub tabs, the class board, Settings, the name dialog and the menu`);
      await page.close();
    }
    for (const hub of hubs) {
      const page = await context.newPage(); const errs = [];
      page.on('pageerror', e => errs.push(e.message));
      if (!vp.isMobile) await page.route(`**/hubs/${hub}/index.html`, async route => {
        const r = await route.fetch(); let h = await r.text(); const i = h.lastIndexOf('window.SH_EXPORT = {');
        if (i > 0) h = h.slice(0, i) + 'window.__CI = { QUESTIONS: typeof QUESTIONS!=="undefined"?QUESTIONS:[], LECTURES: typeof LECTURES!=="undefined"?LECTURES:[], READINGS: typeof READINGS!=="undefined"?READINGS:{}, READINGS_PLAIN: typeof READINGS_PLAIN!=="undefined"?READINGS_PLAIN:{}, LIKELY_TOPICS: typeof LIKELY_TOPICS!=="undefined"?LIKELY_TOPICS:undefined };\n' + h.slice(i);
        route.fulfill({ response: r, body: h });
      });
      await page.goto(BASE() + `hubs/${hub}/index.html`); await page.waitForTimeout(800);
      // a hub whose last exam has passed opens "This hub is archived" over the page; close it like a student would
      await page.click(".sh-archived-stay", { timeout: 1000 }).catch(() => {});
      if (!vp.isMobile) { const A = await page.evaluate(() => window.__CI); if (A) lint(hub, A); else problems.push(`${hub}: could not read its question data (is window.SH_EXPORT still set at the end of the script?)`); }
      const modes = await page.$$eval('#modeSwitch [data-mode]', bs => bs.map(b => b.getAttribute('data-mode')));
      let screens = 0;
      for (const m of modes) {
        await page.click(`#modeSwitch [data-mode="${m}"]`); await page.waitForTimeout(250); screens++;
        const subs = await page.$$eval(`[data-mode-panel="${m}"] .subtabs button, [data-mode-panel="${m}"] #compendium-subnav button`, bs => bs.map((b, i) => i));
        for (const i of subs) { await page.click(`:is([data-mode-panel="${m}"] .subtabs button, [data-mode-panel="${m}"] #compendium-subnav button) >> nth=${i}`).catch(() => {}); await page.waitForTimeout(200); screens++;
          const w = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (w > 1) problems.push(`${hub} (${label}): ${m} tab ${i + 1} scrolls sideways by ${w}px`); }
        if (m === 'arcade') {
          const games = await page.$$eval('#panel-arcade .ar-grid [data-game]', bs => [...new Set(bs.map(b => b.getAttribute('data-game')))]);
          for (const g of games) { await page.click(`#panel-arcade .ar-grid [data-game="${g}"]`).catch(() => {}); await page.waitForTimeout(250);
            const s = await page.$('#panel-arcade [data-start]'); if (s) await s.click().catch(() => {}); await page.waitForTimeout(400);
            const back = await page.$('#panel-arcade [data-back]'); if (back) await back.click().catch(() => {}); await page.waitForTimeout(150); screens++; }
        }
      }
      errs.forEach(e => problems.push(`${hub} (${label}): JavaScript error: ${e}`));
      notes.push(`${hub} (${label}): clicked through ${screens} screens`);
      await page.close();
    }
    // the redesigned hubs: the four views, then every page in More and every set of questions
    for (const hub of nextHubs) {
      const page = await context.newPage(); const errs = [], name = `${hub}/next`;
      page.on('pageerror', e => errs.push(e.message));
      await page.goto(BASE() + `hubs/${hub}/next/index.html`); await page.waitForTimeout(1500);
      const modes = await page.$$eval('#modeSwitch [data-mode]', bs => bs.map(b => b.getAttribute('data-mode')));
      if (modes.join() !== 'home,notes,questions,more') problems.push(`${name} (${label}): the views are ${modes.join(', ') || 'missing'}, not Home, Notes, Questions and More`);
      const n = await page.evaluate(() => window.SH_EXPORT && window.SH_EXPORT.questions ? window.SH_EXPORT.questions.length : 0);
      if (!n) problems.push(`${name} (${label}): window.SH_EXPORT has no questions (the widget's search, stats and question health read it)`);
      let screens = 0;
      const routes = [...modes, 'questions/drill', 'questions/misses', 'questions/weak', 'questions/mock',
        'more/timmy', 'more/hints', 'more/cram', 'more/side', 'more/arcade', 'more/stats', 'more/settings', 'more/ideas'];
      for (const r of routes) {
        if (modes.includes(r)) await page.click(`#modeSwitch [data-mode="${r}"]`); else await page.evaluate(h => { location.hash = h; }, r);
        await page.waitForTimeout(r === 'more/arcade' ? 1500 : 500); screens++;
        // the idea board's page in More: this hub's ideas and the all-hub ones, and a new idea starts on this hub
        if (r === 'more/ideas') {
          await page.waitForSelector('.more-body .shi-card', { timeout: 15000 }).catch(() => {});
          const ib = await page.evaluate(() => { const b = document.querySelector('.more-body'); if (!b || !b.querySelector('.shi-card')) return null;
            b.querySelector('[data-shi="new"]').click(); const v = (b.querySelector('.shi-form [data-shi-f="hub"]') || {}).value; b.querySelector('[data-shi="cancel"]').click();
            return { hub: v, first: (b.querySelector('[data-shi-filter="hub"]') || {}).value, markup: b.querySelectorAll('.shi-card img').length + (window.__idea ? 1 : 0) }; });
          if (!ib) problems.push(`${name} (${label}): the idea board in More drew no ideas`);
          else if (ib.hub !== hub || ib.first !== hub || ib.markup) problems.push(`${name} (${label}): the idea board in More should open on this hub, start a new idea on it and show words as text (${JSON.stringify(ib)})`);
        }
        const st = await page.evaluate(() => { const v = document.querySelector('.hx-view:not([hidden])'); return { h1: !!(v && v.querySelector('h1')), w: document.documentElement.scrollWidth - innerWidth }; });
        if (!st.h1) problems.push(`${name} (${label}): ${r} has no page title`);
        if (st.w > 1) problems.push(`${name} (${label}): ${r} scrolls sideways by ${st.w}px`);
        if (r === 'questions') { const c = await page.$('#qlist .qcard .ch'); if (c) { await c.click(); await page.waitForTimeout(300); if (!(await page.$('#qlist .qcard.is-answered'))) problems.push(`${name} (${label}): answering a question didn't mark the card answered`); } }
        if (r === 'more/arcade') { const g = await page.$('.ar-grid [data-game]'); if (g) { await g.click(); await page.waitForTimeout(400); const back = await page.$('#panel-arcade [data-back]'); if (back) await back.click().catch(() => {}); } }
      }
      /* High yield, the notes' third reading level (tools/hub-next/high-yield.mjs): on a lecture that has it, the switch shows
         it, each predicted topic a heading, nothing scrolls sideways; then back to As taught */
      const hyLec = (() => { try { return Object.keys(JSON.parse(fs.readFileSync(path.join(root, 'hubs', hub, 'next', 'content', 'notes.json'), 'utf8')).hy || {})[0]; } catch (e) { return null; } })();
      if (hyLec) {
        await page.evaluate(h => { location.hash = h; }, 'notes/' + hyLec); await page.waitForTimeout(800);
        const hb = await page.$('[data-level="hy"]');
        if (!hb) problems.push(`${name} (${label}): notes/${hyLec} has High yield in notes.json but no High yield button`);
        else {
          await hb.click(); await page.waitForTimeout(600); screens++;
          const st = await page.evaluate(() => ({ t: document.querySelectorAll('.reading-prose.hy .hy-t').length, on: !!document.querySelector('[data-level="hy"][aria-pressed="true"]'), w: document.documentElement.scrollWidth - innerWidth }));
          if (!st.on || !st.t) problems.push(`${name} (${label}): High yield for ${hyLec} shows ${st.t} topics`);
          /* its Listen offers the recording exactly when the build listed it (notes.json's hyAudio), else the device's voice */
          const rec = (() => { try { return (JSON.parse(fs.readFileSync(path.join(root, 'hubs', hub, 'next', 'content', 'notes.json'), 'utf8')).hyAudio || []).includes(hyLec); } catch (e) { return false; } })();
          const offers = await page.evaluate(() => { const b = document.querySelector('.reading #sh-tts-btn'); return b ? b.getAttribute('data-sh-tts-audio') === '1' : null; });
          if (offers !== rec) problems.push(`${name} (${label}): High yield for ${hyLec}: Listen ${offers ? 'offers' : 'does not offer'} its recording, but notes.json's hyAudio ${rec ? 'lists' : "doesn't list"} it`);
          if (st.w > 1) problems.push(`${name} (${label}): High yield for ${hyLec} scrolls sideways by ${st.w}px`);
          const back = await page.$('[data-level="full"]'); if (back) { await back.click(); await page.waitForTimeout(300); }
        }
      }
      errs.forEach(e => problems.push(`${name} (${label}): JavaScript error: ${e}`));
      notes.push(`${name} (${label}): clicked through ${screens} screens, ${n} questions`);
      await page.close();
    }
    await context.close();
  }
  // top bars and tab rows (2026-11-04): at the widths and text sizes where they used to break, every control in the
  // dashboard's and each hub's top bar, the mode tabs and the dashboard's arcade rows is fully on screen, not clipped
  // by a hidden scrollbar, and every mode tab shows its label
  for (const tb of [{ width: 320, height: 640 }, { width: 1001, height: 800 }, { width: 390, height: 844, size: 'xxlarge' }]) {
    const context = await browser.newContext({ viewport: { width: tb.width, height: tb.height }, serviceWorkers: 'block' });
    await stub(context);
    await context.addInitScript(size => { try { localStorage.setItem('sh_tour', 'no'); localStorage.setItem('sh_tour_hub', 'no'); if (size) localStorage.setItem('sh_pref_size', size); } catch (e) {} }, tb.size || '');
    const label = `${tb.width}px${tb.size ? ', largest text' : ''}`;
    for (const url of ['index.html', ...(fs.existsSync(path.join(root, 'next', 'index.html')) ? ['next/index.html'] : []), ...hubs.map(h => `hubs/${h}/index.html`), ...nextHubs.map(h => `hubs/${h}/next/index.html`)]) {
      const page = await context.newPage();
      await page.goto(BASE() + url); await page.waitForTimeout(700);
      await page.click('.sh-archived-stay', { timeout: 500 }).catch(() => {});
      await page.waitForTimeout(150);
      const bad = await page.evaluate(() => {
        const out = [], vw = document.documentElement.clientWidth;
        if (document.documentElement.scrollWidth > vw + 1) out.push(`page scrolls sideways by ${document.documentElement.scrollWidth - vw}px`);
        const els = document.querySelectorAll('header.hub-header button, header.hub-header a, .topbar button, .topbar a, .hx-bar a, .hx-bar button, .hx-strip button, #modeSwitch [data-mode], #arcadeHubs button, #gameTabs button, .dx-bar a, .dx-bar button, .dx-tab, #boardSeg button, .dx-actions a');
        for (const el of els) {
          const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || el.closest('[hidden]')) continue;
          const r = el.getBoundingClientRect(); if (!r.width && !r.height) continue;
          const name = (el.getAttribute('aria-label') || el.textContent || el.id || '').trim().replace(/\s+/g, ' ').slice(0, 30);
          if (r.right > vw + 1 || r.left < -1) { out.push(`"${name}" is past the screen's edge`); continue; }
          for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
            if (/(hidden|auto|scroll|clip)/.test(getComputedStyle(a).overflowX)) { const ar = a.getBoundingClientRect(); if (r.right > ar.right + 1 || r.left < ar.left - 1) out.push(`"${name}" is cut off inside ${a.id ? '#' + a.id : a.className}`); break; }
          }
        }
        document.querySelectorAll('#modeSwitch [data-mode]').forEach(b => { const l = b.querySelector('.mode-label'); if (l && (getComputedStyle(l).display === 'none' || !l.textContent.trim())) out.push(`the ${b.getAttribute('data-mode')} tab hides its label`); });
        return out;
      });
      bad.forEach(b => problems.push(`${url} (${label}): ${b}`));
      // the Settings sheet at the largest text (BUG-013): every row of buttons stays inside the sheet and the screen
      if (tb.size) {
        const off = await page.evaluate(() => {
          const btn = document.getElementById('setBtn'); if (btn) btn.click();
          const sp = document.getElementById('shstat-settingspanel'); if (sp) sp.classList.add('is-open');
          const out = [], vw = document.documentElement.getBoundingClientRect();
          document.querySelectorAll('.set-seg button, .shset-seg button, .dx-dlg .seg button').forEach(b => {
            const r = b.getBoundingClientRect(); if (!r.width) return;
            const box = (b.closest('#shstat-settingspanel') || b.closest('.dx-dlgcard') || document.documentElement).getBoundingClientRect();
            if (r.right > Math.min(vw.right, box.right) + 1 || r.left < Math.max(vw.left, box.left) - 1) {
              const seg = b.parentElement; out.push(`Settings: "${b.textContent.trim()}" (${seg.dataset.set || seg.dataset.key || seg.dataset.pref || 'a row'}) runs past the sheet's edge`);
            }
          });
          return out;
        });
        off.forEach(b => problems.push(`${url} (${label}): ${b}`));
      }
      await page.close();
    }
    notes.push(`top bars and tab rows checked at ${label}${tb.size ? ', with the Settings sheet' : ''}`);
    await context.close();
  }
  await browser.close(); server.close();
  notes.forEach(n => console.log('  ' + n));
  if (problems.length) { console.error('\n✗ ' + problems.length + ' problem(s):\n' + problems.map(p => '  - ' + p).join('\n')); process.exit(1); }
  console.log(`\n✓ smoke test and question lint passed: ${hubsWhy}`);
})().catch(e => { console.error(e); process.exit(1); });
