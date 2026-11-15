// Publish (or preview) a hub's recap to the dashboard's "Hub recaps" slideshow, the same way review/ → Recap → Publish does.
//   node tools/publish-recap.js <hub> --bank <file> [--exam YYYY-MM-DD, default: its last exam in hubs.js] [--title "MSK Exam 3"] [--no-names] [--dry-run]
// --bank: a local bank file ({questions:[...]}) or a tools/dump-banks.js file ({Q:[...]}), for the toughest
// question's text. Needs SB_KEY and ADMIN_SECRET in the environment (never printed). --dry-run prints what would go up.
const fs = require('fs'), path = require('path'), vm = require('vm');
const args = process.argv.slice(2), hub = args[0];
const opt = n => { const i = args.indexOf(n); return i > -1 ? args[i + 1] : null; };
if (!hub || hub.startsWith('--')) { console.error('usage: node tools/publish-recap.js <hub> --bank <file> [--exam YYYY-MM-DD] [--title T] [--no-names] [--dry-run]'); process.exit(1); }
const { SB_KEY, ADMIN_SECRET } = process.env;
if (!SB_KEY || !ADMIN_SECRET) { console.error('SB_KEY and ADMIN_SECRET must be set'); process.exit(1); }
const BASE = 'https://thytmzsgymydbzcqdnix.supabase.co/rest/v1/rpc/';
// same as review/index.html
const HUB_COLOR = { hepatobiliary: '#DDAE52', 'gi-exam1': '#DDAE52', 'msk-exam3': '#DDAE52', 'msk-exam4': '#DDAE52', occlusion: '#E08566', 'pcd-exam3': '#E08566', perio: '#E88EA9', genetics: '#6FC2B8', 'fixed-pros': '#E08566', 'heme-endo-exam1': '#C99BE0', 'heme-endo-exam2': '#EC9AC0', 'special-patient-care': '#6FC2B8', 'pcd-implants-exam1': '#8FB8E8' };
const HUB_TITLE = { hepatobiliary: 'GI Exam 2', 'gi-exam1': 'GI Exam 1', 'msk-exam3': 'MSK Exam 3', 'msk-exam4': 'MSK Exam 4', occlusion: 'Occlusion', 'pcd-exam3': 'PCD Fixed Pros Exam 3', perio: 'Periodontology', genetics: 'Genetics', 'fixed-pros': 'Fixed Pros', 'heme-endo-exam1': 'Heme & Endo Exam 1', 'heme-endo-exam2': 'Heme & Endo Exam 2', 'special-patient-care': 'Special Patient Care', 'pcd-implants-exam1': 'PCD Implants Exam 1' };

// widget/recap.js's snapshot(): the fields the dashboard draws, names dropped when they're off
const sandbox = { window: {} }; vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'widget', 'recap.js'), 'utf8'), sandbox);
const snapshot = sandbox.window.shRecap.snapshot;

function norm(q) {
  const choices = q.ch || q.choices, ai = q.a != null ? q.a : q.answer;
  return { id: q.id, type: q.type || (choices ? 'mcq' : ''), text: q.q || q.stem || q.text || '',
    answer: choices && typeof ai === 'number' ? choices[ai] : (q.ans || '') };
}
function lastExam(h) {
  // the dashboard's data (hubs.js): the hub's latest exam date; archiveOn (a reopened hub's new archive day) is not an exam
  const w = {}; Function('window', fs.readFileSync(path.join(__dirname, '..', 'hubs.js'), 'utf8'))(w);
  const D = w.SH_DASH_DATA || {}, hub = (D.hubs || []).concat(D.archived || []).find(x => x.id === h);
  const dates = hub ? (hub.exams || []).map(x => x.date).filter(Boolean).sort() : [];
  return dates.length ? dates[dates.length - 1] : null;
}
async function rpc(name, body) {
  const r = await fetch(BASE + name, { method: 'POST', headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const t = await r.text(); if (!r.ok) throw new Error(name + ' ' + r.status + ': ' + t.slice(0, 300)); return t ? JSON.parse(t) : null;
}
(async () => {
  const bankFile = opt('--bank'), names = !args.includes('--no-names'), dry = args.includes('--dry-run');
  const B = bankFile ? JSON.parse(fs.readFileSync(bankFile, 'utf8')) : {};
  const byId = {}; (B.questions || B.Q || []).map(norm).forEach(q => { byId[q.id] = q; });
  // the hub's last exam date from the dashboard's hubs.js (without it get_hub_recap can hit the statement timeout)
  const exam = opt('--exam') || lastExam(hub);
  if (!exam) throw new Error('no exam date for ' + hub + ' in hubs.js; pass --exam YYYY-MM-DD');
  const a = { p_secret: ADMIN_SECRET, p_hub: hub, p_exam: exam };
  const R = await rpc('get_hub_recap', a);
  if (!R || !R.minutes) throw new Error('no recap data for ' + hub);
  // feature the hardest multiple-choice question we have text for, else the hardest overall (as review/ does)
  const tough = R.toughest || [], pick = tough.find(t => { const q = byId[t.qid]; return q && q.text && q.type === 'mcq' && q.answer; }) || tough[0];
  if (pick) R.toughest = [pick].concat(tough.filter(t => t !== pick));
  const q = pick && byId[pick.qid], question = q && q.text ? { text: q.text, answer: q.answer } : null;
  const footnote = String(R.first_day) < '2026-09-25' ? "Time before Sep 25 counts at most 3 hours per sitting, so tabs left open don't inflate it." : '';
  const body = { p_secret: ADMIN_SECRET, p_hub: hub, p_title: opt('--title') || HUB_TITLE[hub] || hub, p_color: HUB_COLOR[hub] || '#DDAE52',
    p_data: snapshot(R, names), p_question: question, p_names: names, p_footnote: footnote };
  const summary = { hub, title: body.p_title, exam_day: R.exam_day, people: R.people, hours: Math.round(R.minutes / 60), answers: R.answers,
    toughest: question, names, awards: Object.keys(body.p_data.awards || {}) };
  console.log(JSON.stringify(summary, null, 2));
  if (!question) console.log('note: no question text found for the toughest question (pass --bank)');
  if (dry) { console.log('dry run: nothing published'); return; }
  await rpc('admin_publish_recap', body);
  const live = await rpc('get_published_recaps', {});
  console.log((live || []).some(x => x.hub === hub) ? `published: ${hub} is on the dashboard` : `publish call returned, but ${hub} is not in get_published_recaps`);
})().catch(e => { console.error(String(e.message || e).replace(ADMIN_SECRET, '<secret>')); process.exit(1); });
