/* Pull a hub's study material into plain text for writing a Timmy Time script.

   node tools/podcast/extract_hub.js <hub> <out-dir>                    a hub on the engine (hubs/<hub>/content/*.json)
   node tools/podcast/extract_hub.js hubs/<hub>/index.html <out-dir>    an old single-file hub

   Writes <out-dir>/NN-<lecture>.txt (the As taught notes, READINGS, as text, with the lecture's exam count when the hub
   has EXAM_COUNTS or MOCK_BLUEPRINT), exam.txt (EXAM_INFO, counts, course dates), hints.txt (HINTS, quoted), cram.txt
   (CRAM) and likely.txt (LIKELY_TOPICS). Any of those a hub doesn't define is skipped. For a hub on the engine it reads
   the content JSON (core.json, notes.json, study.json); for an old hub it evaluates the page's own top-level
   `var NAME = ...` data blocks in isolation, so it only reads data and never runs the page. */
const fs = require('fs'), path = require('path');
const [, , file, out] = process.argv;
if (!file || !out) { console.error('usage: node extract_hub.js <hub> <out-dir>   (an old single-file hub: hubs/<hub>/index.html)'); process.exit(1); }
fs.mkdirSync(out, { recursive: true });
/* a hub on the engine: its id, its folder or its page, when content/core.json sits beside the page */
const ROOT = path.resolve(__dirname, '../..');
const hubDir = /^[a-z0-9][a-z0-9-]*$/.test(file) ? path.join(ROOT, 'hubs', file) : fs.existsSync(file) && fs.statSync(file).isDirectory() ? file : path.dirname(file);
const ENGINE = fs.existsSync(path.join(hubDir, 'content', 'core.json')) ? (() => {
  const j = f => JSON.parse(fs.readFileSync(path.join(hubDir, 'content', f), 'utf8'));
  const core = j('core.json'), notes = j('notes.json'), study = j('study.json');
  return { LECTURES: core.lectures, READINGS: notes.full, EXAM_COUNTS: core.examCounts && Object.keys(core.examCounts).length ? core.examCounts : undefined,
    MOCK_BLUEPRINT: (core.mock && core.mock.blueprint) || undefined, EXAM_INFO: core.examInfo || undefined, COURSE_DATES: core.courseDates || undefined,
    HINTS: study.hints, CRAM: study.cram, LIKELY_TOPICS: core.likelyTopics,
    EXAMS: (core.exams || []).map(e => (e.label || e.id) + ': ' + e.date + (e.time ? ' ' + e.time : '') + (e.closes ? ', closes ' + e.closes : '')) };
})() : null;
const L = ENGINE ? [] : fs.readFileSync(file, 'utf8').split('\n');

/* the statement that starts on line i, evaluated on its own (lines are added until it parses) */
function stmt(i, name, pre) {
  let src = pre || '';
  for (let j = i; j < Math.min(L.length, i + 4000); j++) {
    src += L[j].replace(/^(const|let) /, 'var ') + '\n';
    try { new Function(src); return new Function(src + '; return ' + name + ';')(); } catch (e) { /* keep reading */ }
  }
  return undefined;
}
function grab(name) {
  if (ENGINE) return ENGINE[name];
  const i = L.findIndex(l => new RegExp('^(var|const|let) ' + name + '\\s*=').test(l));
  if (i >= 0) return stmt(i, name);
  /* a constant declared on a shared line: var EXAM_TIME = '08:00', EXAM_CLOSES = '09:30'; */
  const m = L.join('\n').match(new RegExp('^(?:var|const|let) [^\\n]*\\b' + name + "\\s*=\\s*('[^']*'|\"[^\"]*\"|-?\\d+(?:\\.\\d+)?|null)", 'm'));
  return m ? JSON.parse(m[1].replace(/^'|'$/g, '"')) : undefined;
}
/* hubs that fill an object one key at a time (perio: READINGS['id'] = `...`) */
function grabKeyed(name, obj) {
  obj = obj || {};
  L.forEach((l, i) => { if (l.startsWith(name + '[')) { const v = stmt(i, name, 'var ' + name + ' = {};\n'); if (v) Object.assign(obj, v); } });
  return obj;
}
const text = h => String(h || '')
  .replace(/<h[2-5][^>]*>/g, '\n## ').replace(/<\/h[2-5]>/g, '\n')
  .replace(/<li[^>]*>/g, '\n- ').replace(/<\/p>/g, '\n').replace(/<tr[^>]*>/g, '\n').replace(/<\/t[dh]>/g, ' | ')
  .replace(/<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, '')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
  .replace(/\n{3,}/g, '\n\n').trim();

const LECTURES = grab('LECTURES') || [], READINGS = grabKeyed('READINGS', grab('READINGS'));
const COUNTS = grab('EXAM_COUNTS') || grab('MOCK_BLUEPRINT') || {};
const wrote = [];
LECTURES.forEach((lec, i) => {
  if (!READINGS[lec.id]) return;
  const f = String(lec.num != null ? lec.num : i + 1).padStart(2, '0') + '-' + lec.id + '.txt';
  const head = '# ' + (lec.label || 'L' + (lec.num != null ? lec.num : i + 1)) + ' ' + lec.title + (lec.who ? ' (' + lec.who + ')' : '') +
    (COUNTS[lec.id] != null ? ', exam questions: ' + COUNTS[lec.id] : '') + (lec.status ? ', status: ' + lec.status : '') + '\n\n';
  fs.writeFileSync(path.join(out, f), head + text(READINGS[lec.id]) + '\n'); wrote.push(f);
});

const ex = [];
['EXAM_DATE', 'EXAM_TIME', 'EXAM_CLOSES', 'EXAM_END', 'FINAL_DATE', 'QUIZ_DUE'].forEach(n => { const v = grab(n); if (v != null) ex.push(n + ': ' + v); });
if (ENGINE && ENGINE.EXAMS.length) ex.push(...ENGINE.EXAMS);
const info = grab('EXAM_INFO'); if (info) ex.push('', ...info.map(r => Array.isArray(r) ? r.join(': ') : JSON.stringify(r)));
if (Object.keys(COUNTS).length) ex.push('', 'Questions per lecture: ' + JSON.stringify(COUNTS));
const dates = grab('COURSE_DATES'); if (dates) ex.push('', ...dates.map(d => d.date + '  ' + d.label + (d.kind ? ' (' + d.kind + ')' : '')));
if (ex.length) { fs.writeFileSync(path.join(out, 'exam.txt'), ex.join('\n') + '\n'); wrote.push('exam.txt'); }

const hints = grab('HINTS') || grab('EXAM_HINTS');
if (hints) {
  fs.writeFileSync(path.join(out, 'hints.txt'), hints.map(h => '[' + (h.lec || '') + '] ' + (h.kind || h.type || '') + ': "' + (h.quote || h.q || '') + '"' +
    ((h.take || h.takeaway) ? '\n    -> ' + (h.take || h.takeaway) : '')).join('\n') + '\n'); wrote.push('hints.txt');
}
let cram = grab('CRAM');
const cramList = !cram && grab('CRAM_CONTENT');  /* perio: [{ lec, points:[...] }] */
if (cramList) { cram = {}; cramList.forEach(c => { cram[c.lec] = (cram[c.lec] || []).concat(c.points || []); }); }
if (cram) {
  fs.writeFileSync(path.join(out, 'cram.txt'), Object.keys(cram).map(k => '## ' + k + '\n' + [].concat(cram[k]).map(x => '- ' + (typeof x === 'string' ? x : JSON.stringify(x))).join('\n')).join('\n\n') + '\n');
  wrote.push('cram.txt');
}
const likely = grab('LIKELY_TOPICS');
if (likely) { fs.writeFileSync(path.join(out, 'likely.txt'), likely.map(t => '[' + t.lec + '] ' + t.t + ' (' + t.basis + ')').join('\n') + '\n'); wrote.push('likely.txt'); }
console.log(wrote.length ? 'wrote ' + wrote.join(', ') : 'nothing found: does this hub keep its notes in READINGS?');
