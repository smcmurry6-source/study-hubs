#!/usr/bin/env node
// Statement items in a new order (widget/statements.js; Sam, 2026-11-18, Perio reports #55/#56): on a later try a
// numbered-statement or two-statement item shows its statements shuffled and renumbered, each choice relabeled to the same
// statements. For every such item of every hub on the engine, in every version (content/variants.json) and every order of
// its statements, this checks that:
//   - shown statement j is the item's statement perm[j - 1], word for word, after the stem's own lead;
//   - choice k names the same statements it named before (so the key, the grading and the class's picks still hold), and
//     the choices are shown in canonical order (sorted by their numbers; the two-statement four in their fixed order);
//   - what the why lines and the explanation say about each statement ("Statement 3 is false", "It includes 3, which is
//     false", "It leaves out 2, which is true") agrees with the key after renumbering exactly as it did before.
// An item the kit can't follow keeps its own order (listed, not a failure). A why line that disagrees with its own key in
// the item's own order is a content problem: listed as a warning. Ask Timmy's server renumbers an item the same way
// (inOrder() in supabase/functions/timmy/core.js, so he calls a statement by the number on the student's screen): every
// order of every item must come out of it exactly as it comes out of the page's. Run by CI (check.yml).
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.join(__dirname, '..', '..');
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'widget', 'statements.js'), 'utf8'), ctx);
const K = ctx.window.shStatements;

const LIST = '\\d(?:\\s*,\\s*\\d)*(?:,?\\s+(?:and|or)\\s+\\d)?';
const digits = (s) => (String(s).match(/\d/g) || []).map(Number);
const TWO_T = [[1, 1], [0, 0], [1, 0], [0, 1]];
const TWO = ['Both statements are true', 'Both statements are false', 'Statement 1 is true; statement 2 is false', 'Statement 1 is false; statement 2 is true'];

/* every claim a text makes about a statement: [number, true?] */
function claims(t){
  const out = [];
  const add = (l, v) => digits(l).forEach((d) => out.push([d, v]));
  for (const m of String(t).matchAll(new RegExp('\\b[Ss]tatements?\\s+(' + LIST + ')\\s+(?:is|are)\\s+(true|false)\\b', 'g'))) add(m[1], m[2] === 'true');
  for (const m of String(t).matchAll(new RegExp('\\b[Ii]t\\s+(?:also\\s+)?(?:includes|takes in|adds|keeps)\\s+(' + LIST + '),\\s+which\\s+(?:is|are)\\s+(true|false)', 'g'))) add(m[1], m[2] === 'true');
  for (const m of String(t).matchAll(new RegExp('(?:^|[.;:!?]\\s+|\\b(?:Right|Wrong|Yes|No):\\s+|\\bso\\s+)(' + LIST + ')\\s+(?:is|are)\\s+(true|false)\\b', 'g'))) add(m[1], m[2] === 'true');
  for (const m of String(t).matchAll(new RegExp('\\b[Ii]t\\s+(?:also\\s+)?(?:leaves out|misses|drops|omits|skips)\\s+(' + LIST + '),\\s+which\\s+(?:is|are)\\s+(true|false)', 'g'))) add(m[1], m[2] === 'true');
  return out;
}
/* is statement d true, by the key? */
function truth(q){
  if (q.fmt === '2stmt') { const t = TWO_T[TWO.indexOf(q.choices[q.answer])] || []; return (d) => !!t[d - 1]; }
  const key = digits(q.choices[q.answer]); return (d) => key.indexOf(d) > -1;
}
function agrees(q){
  const tr = truth(q), bad = [];
  [q.ex || ''].concat(q.why || []).forEach((t, i) => claims(t).forEach(([d, v]) => { if (tr(d) !== v) bad.push((i ? 'why ' + (i - 1) : 'ex') + ': statement ' + d + ' said ' + v); }));
  return bad;
}
function perms(n){
  const out = [], a = [];
  const go = () => { if (a.length === n) { out.push(a.slice()); return; } for (let i = 1; i <= n; i++) if (a.indexOf(i) < 0) { a.push(i); go(); a.pop(); } };
  go(); return out;
}
function sameSets(a, b){ return a.length === b.length && a.every((x, i) => x === b[i]); }

let bad = 0, warn = 0, items = 0, moved = 0, kept = [];
const pairs = [];   /* [where, q, perm, the page's copy] for the server's check */
for (const hub of fs.readdirSync(path.join(root, 'hubs')).sort()) {
  const qf = path.join(root, 'hubs', hub, 'content', 'questions.json');
  if (!fs.existsSync(qf)) continue;
  const qs = JSON.parse(fs.readFileSync(qf, 'utf8'));
  const vf = path.join(root, 'hubs', hub, 'content', 'variants.json');
  const V = fs.existsSync(vf) ? JSON.parse(fs.readFileSync(vf, 'utf8')) : {};
  for (const base of qs) {
    if (base.type !== 'mcq' || (base.fmt !== 'numbered' && base.fmt !== '2stmt')) continue;
    let vs = V[base.id] || []; if (!Array.isArray(vs)) vs = [vs];
    const versions = [base].concat(vs.filter((v) => v && v.stem).map((v) => Object.assign({}, base, { stem: v.stem }, v.choices ? { choices: v.choices } : {}, v.why ? { why: v.why } : {}, v.ex ? { ex: v.ex } : {})));
    versions.forEach((q, w) => {
      items++;
      const where = `${hub} ${q.id}${w ? ' (version B)' : ''}`;
      const own = agrees(q);
      if (own.length) { warn++; console.warn(`  warning: ${where}: a why line disagrees with the key in its own order: ${own.join('; ')}`); }
      const P = K.parse(q.stem);
      if (!P) { kept.push(where + ': its stem'); return; }
      const all = perms(P.st.length).filter((p) => !p.every((v, i) => v === i + 1));
      const first = K.reorder(q, { perm: all[0] });
      if (first === q) { kept.push(where + ': its words'); return; }
      moved++;
      for (const perm of all) {
        const c = K.reorder(q, { perm });
        pairs.push([where, q, perm, c]);
        const errs = [];
        const S = K.parse(c.stem);
        if (!S || S.lead.join('\n') !== P.lead.join('\n') || S.st.some((s, j) => s !== P.st[perm[j] - 1])) errs.push('the statements');
        const inv = {}; perm.forEach((s, j) => { inv[s] = j + 1; });
        if (q.fmt === '2stmt') {
          c.choices.forEach((x, i) => { const m = TWO.indexOf(x), t = TWO_T[i]; if (m < 0 || TWO_T[m][0] !== t[perm[0] - 1] || TWO_T[m][1] !== t[perm[1] - 1]) errs.push('choice ' + i); });
          if (!sameSets(c._ord.map((i) => TWO.indexOf(c.choices[i])), [0, 1, 2, 3])) errs.push('the choice order');
        } else {
          c.choices.forEach((x, i) => { const want = digits(q.choices[i]).map((d) => inv[d]).sort((a, b) => a - b); if (!sameSets(digits(x), want) || K.label(want) !== x) errs.push('choice ' + i); });
          const shown = c._ord.map((i) => digits(c.choices[i]));
          for (let i = 1; i < shown.length; i++) { const a = shown[i - 1], b = shown[i]; let d = 0; for (let k = 0; k < Math.min(a.length, b.length) && !d; k++) d = a[k] - b[k]; if ((d || a.length - b.length) > 0) errs.push('the choice order'); }
        }
        if (!own.length) { const after = agrees(c); if (after.length) errs.push('the why lines: ' + after.join('; ')); }
        if (claims([q.ex || ''].concat(q.why || []).join(' ')).length !== claims([c.ex || ''].concat(c.why || []).join(' ')).length) errs.push('a reference was lost');
        if (errs.length) { bad++; console.error(`${where}, order ${perm.join('')}: ${errs.join(', ')}`); break; }
      }
    });
  }
}
import(require('url').pathToFileURL(path.join(root, 'supabase', 'functions', 'timmy', 'core.js')).href).then((core) => {
  let differ = 0;
  for (const [where, q, perm, c] of pairs) {
    const t = core.inOrder(q, perm.join(''));
    if (['stem', 'choices', 'why', 'ex'].some((k) => JSON.stringify(t[k]) !== JSON.stringify(c[k]))) { if (++differ <= 5) console.error(`${where}, order ${perm.join('')}: Ask Timmy's inOrder() renumbers it differently from widget/statements.js`); }
  }
  /* an order that doesn't fit the item (the browser sends it) leaves the item as it is */
  const two = pairs.find((p) => p[1].fmt === '2stmt');
  if (two && (core.inOrder(two[1], '1234') !== two[1] || core.inOrder(two[1], '11') !== two[1] || core.inOrder(two[1], '12') !== two[1])) { differ++; console.error("Ask Timmy's inOrder() took an order that doesn't fit the item"); }
  bad += differ;
  console.log(`statement items: ${items} (with their versions), ${moved} shown in a new order on a later try, ${kept.length} kept in their own order${warn ? `, ${warn} with a why line that disagrees with its key` : ''}`);
  kept.forEach((k) => console.log('  kept: ' + k));
  if (bad) { console.error(`✗ ${bad} statement item(s) renumber wrongly (widget/statements.js)`); process.exit(1); }
  console.log('✓ every statement item that is reordered still agrees with its key');
});
