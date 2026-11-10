// L13 (Dr. Herr): the labeled drawing of two Sertoli cells he said "is actually on your exam" (report #38), drawn anew
// for the hub, unlabeled: each part is numbered and the key names it, so a student can test themselves first.
// A static figure (FIGS, not anima): build.mjs writes it into the hub's `var FIGS = {...};` line.
//
// What it names follows the lecture (figures-teach-the-lecture): the labels of his drawing, outside to lumen (basal
// lamina; type A and type B spermatogonia in the basal compartment; the junctional complex between the two Sertoli cells;
// a primary spermatocyte; an early and a late spermatid at the lumen), the two compartments, and the Sertoli cell itself.
// The numbers are deliberately out of order, so the picture never gives away the outside-to-lumen sequence (mh-fig-seq).
//
// Sources (for the drawing's accuracy; nothing copied, the art is new):
//   - Ross MH, Pawlina W. Histology: A Text and Atlas, 8th ed. (2020), ch. 22: the Sertoli cells reach from the basal
//     lamina to the lumen; their lateral junctions sit above the spermatogonia and split the epithelium into a basal and an
//     adluminal compartment; spermatocytes sit just above the junctions; spermatids lie in recesses of the apical
//     cytoplasm, late spermatids with their heads in the cell and their tails in the lumen.
//   - Mescher AL. Junqueira's Basic Histology, 16th ed. (2021), ch. 21: Sertoli nuclei near the base, ovoid with a
//     prominent nucleolus; primary spermatocytes are the largest germ cells, with condensing (prophase) chromatin;
//     early spermatids are small round cells with an acrosomal cap forming over the nucleus.
// Schematic: sizes and spacing are illustrative (one cell of each kind is numbered; the others are drawn to look right).

const W = 460, H = 392;
const CSS = [
  ".fsc .cell{fill:var(--tag-plum-soft);stroke:var(--ink-soft);stroke-width:1.6;stroke-linejoin:round}",
  ".fsc .ct{fill:var(--surface-2)}",
  ".fsc .germ{fill:var(--surface);stroke:var(--ink-soft);stroke-width:1.3}",
  ".fsc .nuc{fill:var(--accent-soft);stroke:var(--ink-soft);stroke-width:1}",
  ".fsc .dark{fill:var(--ink)}",
  ".fsc .thread{fill:none;stroke:var(--ink-soft);stroke-width:1.3;stroke-linecap:round}",
  ".fsc .tail{fill:none;stroke:var(--ink-soft);stroke-width:1.2;stroke-linecap:round}",
  ".fsc .bl{stroke:var(--ink);stroke-width:3.5}",
  ".fsc .jx{stroke:var(--accent);stroke-width:2.2;stroke-linecap:round}",
  ".fsc .acro{fill:none;stroke:var(--accent);stroke-width:2.4;stroke-linecap:round}",
  ".fsc .lead{stroke:var(--ink-faint);stroke-width:1}",
  ".fsc .num circle{fill:var(--bg);stroke:var(--accent);stroke-width:1.6}",
  ".fsc .num text{fill:var(--ink);font:700 13.5px var(--font-body);text-anchor:middle}",
  ".fsc .brk{fill:none;stroke:var(--ink-soft);stroke-width:1.3}",
  ".fsc .let{fill:var(--ink);font:700 14px var(--font-body);text-anchor:middle}",
  ".fsc .side{fill:var(--ink-soft);font:italic 14px var(--font-body);text-anchor:middle}",
].join("");

/* the numbered parts: [number, x, y of the part, x, y of the number] */
const NUM = [
  [4, 232, 80, 302, 38],    // late spermatid: head in the apical cytoplasm, tail in the lumen
  [1, 241, 156, 300, 128],  // early spermatid
  [3, 212, 242, 162, 214],  // primary spermatocyte
  [6, 225, 292, 162, 290],  // junctional complex between the two Sertoli cells
  [7, 193, 323, 158, 328],  // type A spermatogonium
  [5, 267, 323, 312, 323],  // type B spermatogonium
  [2, 396, 341, 396, 364],  // basal lamina
  [8, 360, 258, 392, 226],  // a Sertoli cell (at its nucleus)
];
export const KEY = [
  ["1", "Early spermatid"],
  ["2", "Basal lamina"],
  ["3", "Primary spermatocyte"],
  ["4", "Late spermatid"],
  ["5", "Type B spermatogonium"],
  ["6", "Junctional complex between the two Sertoli cells"],
  ["7", "Type A spermatogonium"],
  ["8", "Sertoli cell"],
  ["A", "Basal compartment (below the junctional complex)"],
  ["B", "Adluminal compartment (above it, toward the lumen)"],
];

function lateSpermatid(x, y, tilt){
  return `<g transform="rotate(${tilt} ${x} ${y})"><path class="tail" d="M${x} ${y - 10} C${x - 4} ${y - 22} ${x + 5} ${y - 32} ${x + 1} ${y - 46}"/>` +
    `<ellipse class="dark" cx="${x}" cy="${y}" rx="3.6" ry="9.5"/></g>`;
}
function earlySpermatid(x, y){
  return `<circle class="germ" cx="${x}" cy="${y}" r="10.5"/><circle class="nuc" cx="${x}" cy="${y + 1.5}" r="5.6"/>` +
    `<path class="acro" d="M${x - 5.4} ${y - 2.2} A6.6 6.6 0 0 1 ${x + 5.4} ${y - 2.2}"/>`;
}
function spermatocyte(x, y, r){
  const n = r * 0.64;
  return `<circle class="germ" cx="${x}" cy="${y}" r="${r}"/><circle class="nuc" cx="${x}" cy="${y}" r="${n}"/>` +
    `<path class="thread" d="M${x - n * .6} ${y - n * .3} q${n * .3} ${-n * .5} ${n * .6} 0 t${n * .6} 0"/>` +
    `<path class="thread" d="M${x - n * .55} ${y + n * .35} q${n * .35} ${n * .45} ${n * .7} 0 t${n * .5} -${n * .1}"/>` +
    `<path class="thread" d="M${x - n * .1} ${y - n * .7} q${n * .2} ${n * .6} 0 ${n * 1.3}"/>`;
}

function svg(){
  const parts = [];
  parts.push(`<rect class="ct" x="30" y="341" width="400" height="28" rx="3"/>`);
  parts.push(`<ellipse class="nuc" cx="300" cy="355" rx="44" ry="3.4"/>`); // a peritubular myoid cell (drawn, not named)
  // the two Sertoli cells, basal lamina to lumen; below the junctional complex their bases part around the spermatogonia
  parts.push(`<path class="cell" d="M40 340 L40 96 C40 70 58 62 84 62 C118 62 150 70 176 64 C200 58 220 62 230 66 L230 296 C214 298 190 302 186 318 L186 340 Z"/>`);
  parts.push(`<path class="cell" d="M420 340 L420 96 C420 70 402 62 376 62 C342 62 310 70 284 64 C260 58 240 62 230 66 L230 296 C246 298 270 302 274 318 L274 340 Z"/>`);
  // Sertoli nuclei: ovoid, near the base, with a prominent nucleolus
  for (const x of [108, 352]) parts.push(`<ellipse class="nuc" cx="${x}" cy="266" rx="15" ry="22"/><circle class="dark" cx="${x + 1}" cy="262" r="3.2"/>`);
  // basal compartment: type A and type B spermatogonia on the basal lamina, between the Sertoli bases
  parts.push(`<circle class="germ" cx="208" cy="323" r="15"/><circle class="nuc" cx="208" cy="324" r="8.5"/><circle class="dark" cx="208" cy="324" r="1.8"/>`);
  parts.push(`<circle class="germ" cx="252" cy="323" r="15"/><circle class="nuc" cx="252" cy="324" r="8.5"/>` +
    [[-6, -2], [5, -5], [-2, 6], [6, 4], [0, -7]].map(([dx, dy]) => `<circle class="dark" cx="${252 + dx}" cy="${324 + dy}" r="1.4"/>`).join(""));
  // the junctional complex: where the two Sertoli cells meet, just above the spermatogonia
  parts.push([284, 288, 292, 296].map((y) => `<line class="jx" x1="223" y1="${y}" x2="237" y2="${y}"/>`).join(""));
  // adluminal compartment: primary spermatocytes, then spermatids, then late spermatids at the lumen
  parts.push(spermatocyte(230, 250, 21));
  parts.push(spermatocyte(226, 206, 18));
  parts.push(earlySpermatid(230, 158) + earlySpermatid(197, 150) + earlySpermatid(263, 148));
  parts.push(lateSpermatid(230, 84, 0) + lateSpermatid(199, 88, -12) + lateSpermatid(262, 88, 10));
  // compartments, lettered
  parts.push(`<path class="brk" d="M31 300 L25 300 L25 338 L31 338"/><text class="let" x="14" y="323">A</text>`);
  parts.push(`<path class="brk" d="M31 68 L25 68 L25 292 L31 292"/><text class="let" x="14" y="184">B</text>`);
  parts.push(`<text class="side" x="230" y="22">Lumen</text><text class="side" x="230" y="386">Outside the tubule</text>`);
  for (const [n, px, py, nx, ny] of NUM) parts.push(`<line class="lead" x1="${px}" y1="${py}" x2="${nx}" y2="${ny}"/>` +
    `<g class="num"><circle cx="${nx}" cy="${ny}" r="11.5"/><text x="${nx}" y="${ny + 4.8}">${n}</text></g>`);
  return `<svg class="fsc" viewBox="0 0 ${W} ${H}" role="img" aria-label="Two Sertoli cells from the basal lamina to the lumen, with eight numbered parts and two lettered compartments">` +
    `<style>${CSS}</style>${parts.join("")}</svg>`;
}

export const SERTOLI = {
  id: "sertoli",
  lec: "mhisto",
  title: "Two Sertoli cells, from the basal lamina to the lumen",
  caption: "Dr. Herr's labeled drawing (L13) is on the exam. This is the hub's own unlabeled version: name each number and letter, then open the key. Schematic.",
  key: KEY,
  svg: svg(),
};
