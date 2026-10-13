#!/usr/bin/env node
// Review sheet for a unit's notes (Claude's notes review, Sessions 4 and 6): every block of notes.core.html and
// notes.deep.html as plain text with its [fact ids], flagged when a cited fact isn't verified, plus a glossary of each
// cited fact's status, risk, stem_names, claim and conditions. Read the two files side by side.
//
//   node tools/boards/notes-sheet.js <unit> [out-prefix]   writes <out-prefix>-notes.txt and <out-prefix>-gloss.txt
//                                                          (default prefix: .cache/notes-sheet/<unit>)
'use strict';
const fs = require('fs'), path = require('path');
const [unit, outArg] = process.argv.slice(2);
if (!unit) { console.error('usage: node tools/boards/notes-sheet.js <unit> [out-prefix]'); process.exit(2); }
const root = path.resolve(__dirname, '..', '..'), out = outArg || path.join(root, '.cache', 'notes-sheet', unit);
fs.mkdirSync(path.dirname(out), { recursive: true });
const F = {}, dir = path.join(root, 'src/boards/facts');
for (const f of fs.readdirSync(dir)) if (f.endsWith('.json') && f !== 'sources.json') {
  const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  (Array.isArray(j) ? j : j.facts || Object.values(j)).forEach(x => { if (x && x.id) F[x.id] = x; });
}
const strip = s => s.replace(/<span class="ref" data-ref="([^"]+)"><\/span>/g, ' [$1]').replace(/<\/(td|th)>/g, ' | ')
  .replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
const used = new Set(); let txt = '';
for (const lv of ['core', 'deep']) {
  const h = fs.readFileSync(path.join(root, `src/boards/units/${unit}/notes.${lv}.html`), 'utf8');
  txt += `\n######## ${lv.toUpperCase()}\n`; let n = 0;
  for (const b of h.split(/(?=<(?:p|li|tr|h2|h3|caption|figcaption)[\s>])/)) {
    const t = strip(b); if (!t) continue; n++;
    const refs = [...b.matchAll(/data-ref="([^"]+)"/g)].map(m => m[1]); refs.forEach(r => used.add(r));
    const bad = refs.filter(r => !F[r] || F[r].status !== 'verified').map(r => r + ':' + (F[r] ? F[r].status : 'MISSING'));
    txt += `${lv[0]}${n}. ${t}${bad.length ? '  <<' + bad.join(',') + '>>' : ''}\n`;
  }
}
let g = '';
for (const id of [...used].sort()) {
  const f = F[id]; if (!f) { g += `${id}: MISSING\n`; continue; }
  g += `${id} [${f.status}/${f.risk}${f.stem_names ? ' stem:' + f.stem_names.join('/') : ''}] ${f.claim}` +
    (f.conditions ? `\n   COND: ${f.conditions}` : '') + '\n';
}
fs.writeFileSync(out + '-notes.txt', txt); fs.writeFileSync(out + '-gloss.txt', g);
console.log(`${used.size} facts cited; wrote ${path.relative(root, out)}-notes.txt and -gloss.txt`);
