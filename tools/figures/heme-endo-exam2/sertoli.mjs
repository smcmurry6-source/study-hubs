// L13 (Dr. Herr): the labeled drawing of two Sertoli cells he said "is actually on your exam ... I do want you to know the
// labels on this image" (report #38), drawn anew for the hub, unlabeled: each part is numbered and the key names it, so a
// student can test themselves first. A static figure (FIGS, not anima): build.mjs writes it into the hub's `var FIGS = {...};` line.
//
// Laid out like the drawing on his slide (Sam sent a screenshot to match, 2026-11-10; it is not kept in the repo): one row
// of spermatogonia on the basal lamina, the junctional complex just above them, a row of pachytene primary spermatocytes,
// two rows of early spermatids, late spermatids at the lumen, and two Sertoli cells, each a column from the basal lamina to
// the lumen with its nucleus at the spermatocyte level and its apical cytoplasm holding the late spermatids, with the
// peritubular (myoid) cells under the basal lamina. Drawn anew in the hub's colors, not traced. The key uses his slide's ten
// labels and its two compartments (figures-teach-the-lecture: he said to know every label on this image). The numbers are
// deliberately out of order, so the picture never gives away the outside-to-lumen sequence (mh-fig-seq).
//
// Sources (for the drawing's accuracy; nothing copied):
//   - Ross MH, Pawlina W. Histology: A Text and Atlas, 8th ed. (2020), ch. 22: Sertoli cells reach from the basal lamina to
//     the lumen and their cytoplasm surrounds every germ cell; the junctions between neighboring Sertoli cells sit just above
//     the spermatogonia and split the epithelium into a basal and an adluminal compartment; type A dark spermatogonia have a
//     dark nucleus with a pale nuclear vacuole, type A pale a pale, finely granular one, type B a round nucleus with chromatin
//     clumped against the envelope and a central nucleolus; late spermatids lie head-down in recesses of the apical Sertoli
//     cytoplasm, acrosome toward the base, with their tails and excess cytoplasm toward the lumen.
//   - Mescher AL. Junqueira's Basic Histology, 16th ed. (2021), ch. 21: Sertoli nuclei are irregular and infolded with a
//     prominent nucleolus; primary spermatocytes are the largest germ cells, their chromatin in threads (pachytene); early
//     spermatids are small round cells; the tubule wall holds flattened peritubular myoid cells.
// Schematic: sizes and spacing are illustrative (one cell of each kind is numbered; the others are drawn to look right).

const W = 484, H = 424;
const CSS = [
  ".fsc .so *{fill:none;stroke:var(--ink-soft);stroke-width:3.2;stroke-linejoin:round}",
  ".fsc .si *{fill:var(--tag-amber-soft);stroke:none}",
  ".fsc .ct{fill:var(--tag-rose-soft)}",
  ".fsc .myo{fill:var(--surface);stroke:var(--ink-faint);stroke-width:.9}",
  ".fsc .myn{fill:var(--tag-indigo);opacity:.75}",
  ".fsc .germ{fill:var(--tag-blue-soft);stroke:var(--ink-soft);stroke-width:1.2}",
  ".fsc .nuc{fill:var(--tag-blue);fill-opacity:.32;stroke:var(--ink-soft);stroke-width:.9}",
  ".fsc .nucp{fill:var(--tag-blue);fill-opacity:.14;stroke:var(--ink-soft);stroke-width:.9}",
  ".fsc .nucd{fill:var(--tag-blue);fill-opacity:.85;stroke:var(--ink-soft);stroke-width:.9}",
  ".fsc .vac{fill:var(--tag-blue-soft)}",
  ".fsc .snb{fill:var(--tag-blue-soft);stroke:var(--ink-soft);stroke-width:1}",
  ".fsc .snt{fill:var(--tag-blue);fill-opacity:.3}",
  ".fsc .dot{fill:var(--ink)}",
  ".fsc .fine{fill:var(--ink-soft)}",
  ".fsc .thread{fill:none;stroke:var(--ink);stroke-width:1.15;stroke-linecap:round}",
  ".fsc .spin{fill:var(--tag-rose-soft);stroke:var(--ink-soft);stroke-width:1}",
  ".fsc .head{fill:var(--ink)}",
  ".fsc .acro{fill:none;stroke:var(--tag-violet);stroke-width:2.4;stroke-linecap:round}",
  ".fsc .tail{fill:none;stroke:var(--ink-soft);stroke-width:1.2;stroke-linecap:round}",
  ".fsc .bl{stroke:var(--ink);stroke-width:3}",
  ".fsc .jx{fill:none;stroke:var(--accent);stroke-width:1.3}",
  ".fsc .lead{stroke:var(--ink-faint);stroke-width:1}",
  ".fsc .num circle{fill:var(--bg);stroke:var(--accent);stroke-width:1.6}",
  ".fsc .num text{fill:var(--ink);font:700 13px var(--font-body);text-anchor:middle}",
  ".fsc .brk{fill:none;stroke:var(--ink-soft);stroke-width:1.3}",
  ".fsc .let{fill:var(--ink);font:700 14px var(--font-body);text-anchor:middle}",
  ".fsc .side{fill:var(--ink-soft);font:italic 14px var(--font-body);text-anchor:middle}",
].join("");

const BL = 341;            // the basal lamina
const JX = 294;            // the junctional complex
const r1 = (n) => Math.round(n * 10) / 10;

/* the numbered parts: [number, x, y of the part, x, y of the number] */
const NUM = [
  [4, 418, 121, 466, 90],   // late spermatid (head in the apical Sertoli cytoplasm)
  [1, 398, 199, 466, 166],  // early spermatid
  [3, 412, 256, 466, 236],  // pachytene primary spermatocyte
  [6, 424, JX, 466, 290],   // junctional complex
  [2, 428, BL, 466, 328],   // basal lamina
  [9, 418, 369, 466, 368],  // peritubular (myoid) cell
  [7, 60, 330, 48, 404],    // type A dark spermatogonium
  [8, 132, 326, 128, 404],  // Sertoli cell (its foot on the basal lamina)
  [10, 193, 330, 198, 404], // type A pale spermatogonium
  [5, 299, 331, 292, 404],  // type B pale spermatogonium
];
export const KEY = [
  ["1", "Early spermatid"],
  ["2", "Basal lamina"],
  ["3", "Pachytene primary spermatocyte"],
  ["4", "Late spermatid"],
  ["5", "Type B pale spermatogonium"],
  ["6", "Junctional complex between neighboring Sertoli cells (the blood-testis barrier)"],
  ["7", "Type A dark spermatogonium"],
  ["8", "Sertoli cell"],
  ["9", "Peritubular (myoid) cell"],
  ["10", "Type A pale spermatogonium"],
  ["A", "Basal compartment (below the junctional complex)"],
  ["B", "Adluminal compartment (above it, toward the lumen)"],
];

/* ---------- the cells ---------- */
function spermatogonium(kind, x, rx, ry){
  const y = BL - ry - 1;
  let s = `<ellipse class="germ" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/>`;
  if (kind === "Ad") {       // a dark, oval nucleus with a pale nuclear vacuole
    s += `<ellipse class="nucd" cx="${x}" cy="${y + 1}" rx="${rx - 9}" ry="${ry - 6}"/><circle class="vac" cx="${x + 8}" cy="${y - 1}" r="4.2"/>`;
  } else if (kind === "Ap") { // a pale, finely granular nucleus, its nucleoli against the envelope
    s += `<ellipse class="nucp" cx="${x}" cy="${y + 1}" rx="${rx - 9}" ry="${ry - 6}"/>` +
      [[-7, -3], [-2, 3], [4, -4], [7, 3], [0, -1], [-5, 5], [3, 6]].map(([dx, dy]) => `<circle class="fine" cx="${x + dx}" cy="${y + 1 + dy}" r=".8"/>`).join("") +
      `<circle class="dot" cx="${x - rx + 11}" cy="${y}" r="1.9"/>`;
  } else {                    // type B: a round nucleus, chromatin clumped on the envelope, a central nucleolus
    const n = ry - 6;
    s += `<circle class="nuc" cx="${x}" cy="${y + 1}" r="${n}"/>` +
      [0, 50, 100, 150, 200, 250, 300].map((a) => { const t = a * Math.PI / 180;
        return `<circle class="dot" cx="${r1(x + Math.cos(t) * (n - 2.2))}" cy="${r1(y + 1 + Math.sin(t) * (n - 2.2))}" r="1.7"/>`; }).join("") +
      `<circle class="dot" cx="${x}" cy="${y + 1}" r="2"/>`;
  }
  return s;
}
function spermatocyte(x, y, r){   // the largest germ cell; pachytene: the chromatin in threads
  const n = r * 0.62;
  const th = [
    `M${x - n * .7} ${y - n * .25} q${n * .25} ${-n * .55} ${n * .5} ${-n * .1} t${n * .5} ${n * .05}`,
    `M${x - n * .55} ${y + n * .45} q${n * .3} ${-n * .4} ${n * .55} 0 t${n * .55} ${-n * .1}`,
    `M${x + n * .1} ${y - n * .75} q${-n * .35} ${n * .35} 0 ${n * .7} t${n * .05} ${n * .7}`,
    `M${x + n * .45} ${y - n * .45} q${n * .3} ${n * .25} 0 ${n * .5}`,
    `M${x - n * .35} ${y - n * .7} q${-n * .25} ${n * .2} ${-n * .05} ${n * .4}`,
  ].map((d) => `<path class="thread" d="${d.replace(/-?\d+\.\d+/g, (m) => String(r1(Number(m))))}"/>`).join("");
  return `<circle class="germ" cx="${x}" cy="${y}" r="${r}"/><circle class="nuc" cx="${x}" cy="${y}" r="${r1(n)}"/>${th}`;
}
function earlySpermatid(x, y, r){ // small and round, a round nucleus
  const n = r * 0.55;
  return `<circle class="germ" cx="${x}" cy="${y}" r="${r}"/><circle class="nuc" cx="${x}" cy="${y}" r="${r1(n)}"/>` +
    [[-3, -2], [3, 1], [-1, 4]].map(([dx, dy]) => `<circle class="dot" cx="${x + dx}" cy="${y + dy}" r="1.3"/>`).join("");
}
function lateSpermatid(x, y, tilt){ // head down in the Sertoli cytoplasm (acrosome toward the base), cytoplasm and tail toward the lumen
  return `<g transform="rotate(${tilt} ${x} ${y})">` +
    `<path class="tail" d="M${x} ${y - 50} C${x - 4} ${y - 62} ${x + 4} ${y - 74} ${x + 1} ${y - 88}"/>` +
    `<path class="spin" d="M${x} ${y + 2} C${x - 7} ${y - 10} ${x - 5} ${y - 38} ${x} ${y - 52} C${x + 5} ${y - 38} ${x + 7} ${y - 10} ${x} ${y + 2} Z"/>` +
    `<ellipse class="head" cx="${x}" cy="${y}" rx="3.8" ry="9"/>` +
    `<path class="acro" d="M${x - 3.6} ${y + 4} A4.4 6.5 0 0 0 ${x + 3.6} ${y + 4}"/></g>`;
}
function sertoliNucleus(cx, cy){  // irregular and infolded, a prominent nucleolus
  const p = (dx, dy) => `${cx + dx} ${cy + dy}`;
  const d = `M${p(-6, -33)} C${p(9, -35)} ${p(16, -18)} ${p(12, -6)} C${p(5, 0)} ${p(14, 11)} ${p(15, 19)} ` +
    `C${p(16, 31)} ${p(5, 34)} ${p(-4, 32)} C${p(-14, 30)} ${p(-17, 16)} ${p(-15, 2)} C${p(-13, -12)} ${p(-18, -29)} ${p(-6, -33)} Z`;
  return `<path class="snb" d="${d}"/><path class="snt" d="${d}"/>` +
    `<circle class="dot" cx="${cx - 2}" cy="${cy + 4}" r="3.6"/>` +
    [[-8, -18], [4, -24], [7, 18], [-9, 20], [-6, -6]].map(([dx, dy]) => `<circle class="fine" cx="${cx + dx}" cy="${cy + dy}" r=".9"/>`).join("");
}
function myoid(x, y){             // a flattened peritubular myoid cell
  return `<path class="myo" d="M${x - 46} ${y} C${x - 20} ${y - 6} ${x + 20} ${y - 6} ${x + 46} ${y} C${x + 20} ${y + 6} ${x - 20} ${y + 6} ${x - 46} ${y} Z"/>` +
    `<ellipse class="myn" cx="${x}" cy="${y}" rx="22" ry="2.6"/>`;
}

/* ---------- the two Sertoli cells: their cytoplasm surrounds every germ cell ---------- */
const LEFT = [[76, 172, -10], [108, 160, -4], [140, 170, 4], [172, 158, 10]];          // late spermatids in the left cell's processes
const RIGHT = [[296, 128, -18], [326, 104, -6], [354, 121, 4], [386, 113, 10], [418, 121, 16]]; // ... and in the right cell's crown
function sertoliShapes(){
  const s = [];
  // the epithelium's body, basal lamina up to the early spermatids (the germ cells are drawn over it)
  s.push(`<path d="M36 ${BL} L36 214 C60 206 178 204 196 196 C204 176 206 158 216 152 L436 152 L436 ${BL} Z"/>`);
  // the left cell's apical cytoplasm: a crown of slender processes, one around each late spermatid
  s.push(`<path d="M36 216 C36 198 48 188 66 186 L184 182 C194 184 198 192 198 202 Z"/>`);
  for (const [x, y, t] of LEFT) s.push(`<rect x="${x - 9}" y="${y - 48}" width="18" height="${206 - y + 48}" rx="9" transform="rotate(${t} ${x} ${y})"/>`);
  // the right cell's apical cytoplasm: a broad crown from its trunk, a stalk in the middle
  s.push(`<path d="M286 156 C286 138 296 126 308 122 C316 108 320 94 328 92 C337 94 341 106 347 114 C361 106 376 102 392 102 ` +
    `C412 102 430 108 436 114 L436 156 Z"/>`);
  return s.join("");
}

function svg(){
  const parts = [];
  // under the basal lamina: the tubule wall's connective tissue with peritubular myoid cells
  parts.push(`<rect class="ct" x="36" y="${BL + 1}" width="400" height="38"/>`);
  for (const [x, y] of [[90, 353], [215, 352], [345, 353], [140, 369], [270, 370], [390, 369]]) parts.push(myoid(x, y));
  // the Sertoli cells: outline first, then fill, so the shapes read as one cytoplasm
  const sh = sertoliShapes();
  parts.push(`<g class="so">${sh}</g><g class="si">${sh}</g>`);
  for (const [x, y] of [[131, 256], [332, 254]]) parts.push(sertoliNucleus(x, y));
  // the basal compartment: one row of spermatogonia on the basal lamina, between the Sertoli cells' feet
  parts.push(spermatogonium("Ad", 68, 31, 20));
  parts.push(spermatogonium("Ap", 192, 26, 19));
  parts.push(spermatogonium("B", 246, 27, 19));
  parts.push(spermatogonium("B", 299, 25, 19));
  parts.push(spermatogonium("B", 381, 28, 19));
  // the junctional complex, between neighboring Sertoli cells just above the spermatogonia (the trunks pass through it)
  const jx = [[37, 110], [153, 314], [347, 435]].map(([a, b]) => {
    let d = `M${a} ${JX - 1.6}H${b}M${a} ${JX + 1.6}H${b}`;
    for (let x = a + 2; x <= b - 1; x += 5) d += `M${x} ${JX - 1.6}V${JX + 1.6}`;
    return d;
  }).join("");
  parts.push(`<path class="jx" d="${jx}"/>`);
  // the adluminal compartment: pachytene primary spermatocytes, then two rows of early spermatids, then late spermatids
  for (const x of [67, 196, 262, 397]) parts.push(spermatocyte(x, 262, 26));
  for (const x of [82, 180, 231, 283]) parts.push(earlySpermatid(x, 212, 20));
  parts.push(earlySpermatid(383, 202, 21));
  for (const x of [216, 262, 306]) parts.push(earlySpermatid(x, 163, 20));
  for (const [x, y, t] of [...LEFT, ...RIGHT]) parts.push(lateSpermatid(x, y, t));
  parts.push(`<line class="bl" x1="36" y1="${BL}" x2="436" y2="${BL}"/>`);
  // the compartments, lettered
  parts.push(`<path class="brk" d="M31 ${JX + 3} L25 ${JX + 3} L25 ${BL - 2} L31 ${BL - 2}"/><text class="let" x="13" y="${(JX + BL) / 2 + 5}">A</text>`);
  parts.push(`<path class="brk" d="M31 100 L25 100 L25 ${JX - 4} L31 ${JX - 4}"/><text class="let" x="13" y="${(100 + JX) / 2 + 5}">B</text>`);
  parts.push(`<text class="side" x="238" y="58">Lumen</text>`);
  for (const [n, px, py, nx, ny] of NUM) parts.push(`<line class="lead" x1="${px}" y1="${py}" x2="${nx}" y2="${ny}"/>` +
    `<g class="num"><circle cx="${nx}" cy="${ny}" r="12"/><text x="${nx}" y="${ny + 4.6}">${n}</text></g>`);
  return `<svg class="fsc" viewBox="0 0 ${W} ${H}" role="img" aria-label="Two Sertoli cells from the basal lamina to the lumen, with ten numbered parts and two lettered compartments">` +
    `<style>${CSS}</style>${parts.join("")}</svg>`;
}

export const SERTOLI = {
  id: "sertoli",
  lec: "mhisto",
  title: "Two Sertoli cells, from the basal lamina to the lumen",
  caption: "Dr. Herr's labeled drawing (L13) is on the exam. This is the hub's own unlabeled version, laid out like his: name each number and letter, then open the key. Schematic.",
  key: KEY,
  svg: svg(),
};
