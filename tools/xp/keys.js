#!/usr/bin/env node
// The answer keys a hub loads into the server at the redesign's release (migration_v54: question_keys,
// admin_load_question_keys), worked out from the hub's content JSON, so record_answer_v2 can decide right or wrong.
//   node tools/xp/keys.js <hub>                    the JSON array for admin_load_question_keys's p_keys
//   node tools/xp/keys.js <hub> --sql              one SQL statement for the connector (the admin secret stays a placeholder)
//   node tools/xp/keys.js <hub> --file <questions.json>   another content file (default hubs/<hub>/next/content/questions.json)
// Each key: { id, v, kind, answer, counted }. kind: "one" (mcq: the right choice's authored index), "all" (multi: the
// right choices), "order" (sequence: the steps 0..n-1 in their right order), "self" (match and recall cards, graded by the
// student). v is the question's version as the page reports it (question health's fingerprint of the exported question,
// widget/qhealth.js fp() over widget/hub.js exportQuestions()), so a page cached before an edit is graded against the key
// it showed. counted: false for a question kept out of the hub's mastery (a content field `counted: false`). Ids marked
// "retired" in tools/question-ids/<hub>.txt come last as { id, retired: true }.
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../..');

/* the same 53-bit hash and fingerprint as widget/qhealth.js */
function hash(str){
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0, ch; i < str.length; i++) { ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}
function fp(q){
  const keys = Object.keys(q).filter(k => k !== 'id' && k !== 'lec').sort();
  return hash(JSON.stringify(keys.map(k => [k, q[k] === undefined ? null : q[k]])));
}
/* what widget/hub.js exports for a question (exportQuestions), which is what question health fingerprints */
function exported(q){
  let hint = q.type === 'mcq' ? q.choices[q.answer] : q.type === 'multi' ? q.correct.map(k => q.choices[k]).join('; ')
    : q.type === 'sequence' ? q.steps.join(' → ') : (q.pairs || []).map(p => p.join(': ')).join('; ');
  if (q.ex) hint += ' — ' + q.ex;
  return { id: q.id, lec: q.lec, text: q.stem, hint, choices: q.choices || null, answer: q.type === 'mcq' ? q.answer : null };
}
function keyFor(q){
  const k = { id: q.id, v: fp(exported(q)) };
  if (q.type === 'mcq') Object.assign(k, { kind: 'one', answer: [q.answer] });
  else if (q.type === 'multi') Object.assign(k, { kind: 'all', answer: q.correct.slice().sort((a, b) => a - b) });
  else if (q.type === 'sequence') Object.assign(k, { kind: 'order', answer: q.steps.map((s, i) => i) });
  else Object.assign(k, { kind: 'self', answer: [] });
  k.counted = q.counted !== false;
  return k;
}
function keys(hub, file){
  const qs = JSON.parse(fs.readFileSync(file || path.join(ROOT, 'hubs', hub, 'next', 'content', 'questions.json'), 'utf8'));
  const out = qs.map(keyFor), have = new Set(out.map(k => k.id));
  const reg = path.join(ROOT, 'tools', 'question-ids', hub + '.txt');
  if (fs.existsSync(reg)) fs.readFileSync(reg, 'utf8').split('\n').map(l => l.replace(/#.*/, '').trim().split(/\s+/))
    .filter(p => p[1] === 'retired' && !have.has(p[0])).forEach(p => out.push({ id: p[0], retired: true }));
  return out;
}

module.exports = { keys, keyFor, fp, exported };

if (require.main === module) {
  const a = process.argv.slice(2), hub = a[0], fi = a.indexOf('--file');
  if (!hub || !/^[a-z0-9][a-z0-9-]{0,39}$/.test(hub)) { console.error('usage: node tools/xp/keys.js <hub> [--sql] [--file questions.json]'); process.exit(2); }
  const k = keys(hub, fi > 0 ? a[fi + 1] : null), json = JSON.stringify(k);
  if (a.includes('--sql')) console.log(`select admin_load_question_keys('<ADMIN_SECRET>', '${hub}', '${json.replace(/'/g, "''")}'::jsonb, true);`);
  else console.log(json);
  console.error(`${k.filter(x => !x.retired).length} keys, ${k.filter(x => x.retired).length} retired ids`);
}
