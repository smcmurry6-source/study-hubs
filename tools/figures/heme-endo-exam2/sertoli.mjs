// L13 (Dr. Herr): the labeled drawing of two Sertoli cells he said "is actually on your exam ... I do want you to know the
// labels on this image" (report #38), drawn anew for the hub, unlabeled: each part is numbered and the key names it, so a
// student can test themselves first. A static figure (FIGS, not anima): build.mjs writes it into the hub's `var FIGS = {...};` line.
//
// Laid out like the drawing on his slide (Sam sent a screenshot to match, 2026-11-10; it is not kept in the repo), its rows
// and proportions measured off it: the peritubular (myoid) cells under the basal lamina; one row of spermatogonia on the
// basal lamina; the junctional complex just above them; a row of large pachytene primary spermatocytes; two rows of early
// spermatids; late spermatids head-down in the apical cytoplasm, tails in the lumen. The two Sertoli cells are fibrous
// columns from the basal lamina to the lumen, their nuclei at the spermatocyte level: the left one branches into slender
// processes around its late spermatids, the right one into a broad crown with a stalk and a few residual bodies. The germ
// cells are packed as in the slide, so the Sertoli cytoplasm shows only between them and in the two columns. Drawn anew in
// the hub's colors, not traced. The key uses his slide's ten labels and its two compartments (figures-teach-the-lecture: he
// said to know every label on this image). The numbers are deliberately out of order, so the picture never gives away the
// outside-to-lumen sequence (mh-fig-seq).
//
// Sources (for the drawing's accuracy; nothing copied):
//   - Ross MH, Pawlina W. Histology: A Text and Atlas, 8th ed. (2020), ch. 22: Sertoli cells reach from the basal lamina to
//     the lumen and their cytoplasm surrounds every germ cell; the junctions between neighboring Sertoli cells sit just above
//     the spermatogonia and split the epithelium into a basal and an adluminal compartment; type A dark spermatogonia have a
//     dark nucleus with a pale nuclear vacuole, type A pale a pale, finely granular one, type B a round nucleus with coarse
//     chromatin clumps; late spermatids lie head-down in recesses of the apical Sertoli cytoplasm, acrosome toward the base,
//     their tails and excess cytoplasm toward the lumen; the shed cytoplasm becomes residual bodies.
//   - Mescher AL. Junqueira's Basic Histology, 16th ed. (2021), ch. 21: Sertoli nuclei are irregular and infolded with a
//     prominent nucleolus; primary spermatocytes are the largest germ cells, their chromatin in threads (pachytene); early
//     spermatids are small round cells; the tubule wall holds flattened peritubular myoid cells.
// Schematic: sizes and spacing are illustrative (one cell of each kind is numbered; the others are drawn to look right).

const W = 484, H = 402;
const X0 = 36, X1 = 436;   // the epithelium's cut edges
const BL = 329;            // the basal lamina
const JX = 279;            // the junctional complex

const CSS = [
  ".fsc .so *{fill:none;stroke:var(--ink-soft);stroke-width:2.6;stroke-linejoin:round}",
  ".fsc .si *{fill:var(--tag-amber-soft);stroke:none}",
  ".fsc .fib{fill:none;stroke:var(--tag-amber);stroke-width:.75;stroke-opacity:.34;stroke-linecap:round}",
  ".fsc .ct{fill:var(--tag-red-soft)}",
  ".fsc .ctl{fill:none;stroke:var(--tag-rose);stroke-width:.8;stroke-opacity:.35}",
  ".fsc .myn{fill:var(--tag-indigo);fill-opacity:.8}",
  ".fsc .gon{fill:var(--tag-teal-soft);stroke:var(--ink-soft);stroke-width:1}",
  ".fsc .cyte{fill:var(--tag-blue-soft);stroke:var(--ink-soft);stroke-width:1}",
  ".fsc .tid{fill:var(--tag-violet-soft);stroke:var(--ink-soft);stroke-width:1}",
  ".fsc .nuc{fill:var(--tag-blue);fill-opacity:.34;stroke:var(--ink-soft);stroke-width:.8}",
  ".fsc .nucp{fill:var(--tag-blue);fill-opacity:.15;stroke:var(--ink-soft);stroke-width:.8}",
  ".fsc .nucd{fill:var(--tag-blue);fill-opacity:.82;stroke:var(--ink-soft);stroke-width:.8}",
  ".fsc .snb{fill:var(--tag-blue-soft);stroke:var(--ink-soft);stroke-width:.9}",
  ".fsc .snt{fill:var(--tag-blue);fill-opacity:.3}",
  ".fsc .vac{fill:var(--tag-teal-soft);stroke:var(--ink-soft);stroke-width:.5}",
  ".fsc .st{fill:var(--ink);fill-opacity:.5}",
  ".fsc .dot{fill:var(--ink)}",
  ".fsc .thr{fill:none;stroke:var(--ink);stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}",
  ".fsc .lobe{fill:var(--tag-rose-soft);stroke:var(--ink-soft);stroke-width:.8}",
  ".fsc .head{fill:var(--ink)}",
  ".fsc .acro{fill:var(--tag-violet)}",
  ".fsc .tail{fill:none;stroke:var(--ink-soft);stroke-width:1;stroke-linecap:round}",
  ".fsc .rb{fill:var(--tag-rose-soft);stroke:var(--ink-soft);stroke-width:.7}",
  ".fsc .bl{stroke:var(--ink);stroke-width:2.6}",
  ".fsc .jx{fill:none;stroke:var(--accent);stroke-width:.9}",
  ".fsc .jxd{fill:var(--accent)}",
  ".fsc .lead{stroke:var(--ink-faint);stroke-width:1}",
  ".fsc .num circle{fill:var(--bg);stroke:var(--accent);stroke-width:1.6}",
  ".fsc .num text{fill:var(--ink);font:700 13px var(--font-body);text-anchor:middle}",
  ".fsc .brk{fill:none;stroke:var(--ink-soft);stroke-width:1.3}",
  ".fsc .let{fill:var(--ink);font:700 14px var(--font-body);text-anchor:middle}",
  ".fsc .side{fill:var(--ink-soft);font:italic 13px var(--font-body);text-anchor:middle}",
].join("");

/* the numbered parts: [number, x, y of the part, x, y of the number] */
const NUM = [
  [4, 412, 112, 466, 86],   // late spermatid (head in the apical Sertoli cytoplasm)
  [1, 398, 168, 466, 150],  // early spermatid
  [3, 414, 236, 466, 220],  // pachytene primary spermatocyte
  [6, 426, JX, 466, 268],   // junctional complex
  [2, 430, BL, 466, 306],   // basal lamina
  [9, 422, 352, 466, 344],  // peritubular (myoid) cell
  [7, 66, 312, 52, 386],    // type A dark spermatogonium
  [8, 133, 306, 128, 386],  // Sertoli cell (its foot on the basal lamina)
  [10, 190, 312, 198, 386], // type A pale spermatogonium
  [5, 298, 312, 290, 386],  // type B pale spermatogonium
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

/* ---------- drawing helpers: a seeded random source, so the build is repeatable ---------- */
let seed = 20261110;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const jit = (a) => (rnd() * 2 - 1) * a;
const f = (n) => String(Math.round(n * 10) / 10);
const cx_ = (x) => Math.max(X0, Math.min(X1, x));
const P = (p) => `${f(p[0])} ${f(p[1])}`;

/* a smooth closed curve through points (Catmull-Rom as cubic Beziers); clip keeps it inside the cut edges */
function closed(pts, clip = true){
  const n = pts.length, c = clip ? (p) => [cx_(p[0]), p[1]] : (p) => p;
  let d = `M${P(c(pts[0]))}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    d += `C${P(c([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]))} ${P(c([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]))} ${P(c(p2))}`;
  }
  return d + "Z";
}
/* an open smooth curve through points */
function open(pts){
  let d = `M${P(pts[0])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += `C${P([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6])} ${P([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6])} ${P(p2)}`;
  }
  return d;
}
/* a cell or nucleus: a squarish, slightly irregular oval, optionally flattened on a floor (the basal lamina) */
function blob(cx, cy, rx, ry, o = {}){
  const n = o.n || 16, wob = o.wob ?? 0.04, e = 2 / (o.sq || 2.4), pts = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * 2 * Math.PI + 0.2, c = Math.cos(t), s = Math.sin(t), k = 1 + jit(wob);
    let y = cy + Math.sign(s) * Math.abs(s) ** e * ry * k;
    if (o.floor != null) y = Math.min(y, o.floor);
    pts.push([cx + Math.sign(c) * Math.abs(c) ** e * rx * k, y]);
  }
  return closed(pts, o.clip !== false);
}
/* stipple: fine dots scattered inside an oval */
function stipple(cx, cy, rx, ry, n, cls = "st", r = 0.75){
  let s = "";
  for (let i = 0; i < n; i++) {
    const a = rnd() * 2 * Math.PI, d = Math.sqrt(rnd()) * 0.8, x = cx + Math.cos(a) * d * rx;
    if (x < X0 + 1 || x > X1 - 1) continue;
    s += `<circle class="${cls}" cx="${f(x)}" cy="${f(cy + Math.sin(a) * d * ry)}" r="${r}"/>`;
  }
  return s;
}

/* ---------- the cells ---------- */
function spermatogonium(kind, x, rx, ry){
  const y = BL - ry - 0.5, nrx = rx * 0.66, nry = ry * 0.66;
  let s = `<path class="gon" d="${blob(x, y, rx, ry, { floor: BL - 0.6, sq: 2.6 })}"/>`;
  if (kind === "Ad") {        // a dark, oval nucleus with a pale nuclear vacuole
    s += `<path class="nucd" d="${blob(x, y + 1, nrx, nry, { sq: 2.2, wob: 0.03 })}"/>` +
      `<path class="vac" d="${blob(x + nrx * 0.45, y - 1, 4.2, 3.8, { sq: 2, wob: 0.02 })}"/>`;
  } else if (kind === "Ap") { // a pale, finely granular nucleus, its nucleoli against the envelope
    s += `<path class="nucp" d="${blob(x, y + 1, nrx, nry, { sq: 2.2, wob: 0.03 })}"/>` + stipple(x, y + 1, nrx, nry, 16) +
      `<circle class="dot" cx="${f(cx_(x - nrx + 2.6))}" cy="${f(y)}" r="1.7"/><circle class="dot" cx="${f(cx_(x + nrx - 3))}" cy="${f(y + 3)}" r="1.4"/>`;
  } else {                    // type B: a round nucleus, coarse chromatin clumps, a central nucleolus
    const nr = Math.min(nrx, nry) + 1.5;
    s += `<path class="nuc" d="${blob(x, y + 1, nr, nr, { sq: 2, wob: 0.03 })}"/>` + stipple(x, y + 1, nr, nr, 7) +
      Array.from({ length: 8 }, (_, i) => { const t = (i / 8) * 2 * Math.PI + jit(0.3), d = nr * (0.62 + jit(0.12));
        return `<circle class="dot" cx="${f(x + Math.cos(t) * d)}" cy="${f(y + 1 + Math.sin(t) * d)}" r="${f(1.5 + rnd() * 0.9)}"/>`; }).join("") +
      `<circle class="dot" cx="${f(x + jit(1.5))}" cy="${f(y + 1 + jit(1.5))}" r="2"/>`;
  }
  return s;
}
function spermatocyte(x, y, r){   // the largest germ cell; pachytene: its chromatin in thick, coiled threads
  const n = r * 0.64;
  let s = `<path class="cyte" d="${blob(x, y, r, r * 0.97, { sq: 2.25 })}"/><path class="nuc" d="${blob(x + jit(1.5), y + jit(1.5), n, n, { sq: 2, wob: 0.03 })}"/>`;
  // the threads: short wavy strands spread evenly over the nucleus, each turned its own way
  const spots = [[0, 0], [-0.46, -0.36], [0.42, -0.42], [-0.5, 0.32], [0.46, 0.34], [0, -0.62], [0.02, 0.6], [-0.66, -0.02], [0.65, -0.02]];
  for (const [u, v] of spots) {
    const px = x + (u + jit(0.08)) * n, py = y + (v + jit(0.08)) * n, a = rnd() * Math.PI, L = n * (0.24 + rnd() * 0.08);
    const ca = Math.cos(a), sa = Math.sin(a), w = n * 0.1 * (rnd() < 0.5 ? -1 : 1);
    const pt = (t, o) => [px + ca * t * L + -sa * o, py + sa * t * L + ca * o];
    s += `<path class="thr" d="${open([pt(-1, 0), pt(-0.5, w), pt(0, 0), pt(0.5, -w), pt(1, 0)])}"/>`;
  }
  return s;
}
function earlySpermatid(x, y, r){ // small and round, a round central nucleus
  const n = r * 0.56;
  return `<path class="tid" d="${blob(x, y, r, r, { sq: 2.15 })}"/><path class="nuc" d="${blob(x, y, n, n, { sq: 2, wob: 0.03 })}"/>` +
    stipple(x, y, n, n, 6) + [[-0.35, -0.2], [0.3, 0.15], [-0.05, 0.4]].map(([a, b]) =>
      `<circle class="dot" cx="${f(x + a * n)}" cy="${f(y + b * n)}" r="1.3"/>`).join("");
}
// late spermatid: head down in the Sertoli cytoplasm (acrosome toward the base), its cytoplasm and tail toward the lumen
const lobe = (x, y) => open([[x, y + 8], [x - 5.5, y - 8], [x - 3.5, y - 34], [x, y - 54]]).replace(/^M/, "M") +
  open([[x, y - 54], [x + 3.5, y - 34], [x + 5.5, y - 8], [x, y + 8]]).replace(/^M[^C]*/, "") + "Z";
function lateSpermatid(x, y, tilt){
  return `<g transform="rotate(${tilt} ${x} ${y})">` +
    `<path class="tail" d="${open([[x, y - 50], [x - 2.5, y - 64], [x + 2.5, y - 78], [x + 0.5, y - 92]])}"/>` +
    `<path class="lobe" d="${lobe(x, y)}"/>` +
    `<path class="head" d="M${x} ${y - 10} C${x + 4.6} ${y - 7} ${x + 4.4} ${y + 6} ${x} ${y + 10} C${x - 4.4} ${y + 6} ${x - 4.6} ${y - 7} ${x} ${y - 10} Z"/>` +
    `<path class="acro" d="M${x - 3.9} ${y + 3} C${x - 3.4} ${y + 7} ${x - 1.5} ${y + 9.6} ${x} ${y + 10.6} C${x + 1.5} ${y + 9.6} ${x + 3.4} ${y + 7} ${x + 3.9} ${y + 3} C${x + 1.5} ${y + 4.6} ${x - 1.5} ${y + 4.6} ${x - 3.9} ${y + 3} Z"/></g>`;
}
function residualBody(x, y, r){
  return `<path class="rb" d="${blob(x, y, r, r * 0.9, { sq: 2, wob: 0.08, clip: false })}"/>` + stipple(x, y, r * 0.8, r * 0.7, 4, "dot", 0.9);
}
function sertoliNucleus(cx, cy, hw, hh){ // irregular and infolded, a prominent nucleolus
  const p = (dx, dy) => `${f(cx + dx * hw)} ${f(cy + dy * hh)}`;
  const d = `M${p(-0.35, -1)} C${p(0.5, -1.06)} ${p(1, -0.55)} ${p(0.75, -0.18)} C${p(0.3, 0)} ${p(0.88, 0.33)} ${p(0.94, 0.58)} ` +
    `C${p(1, 0.94)} ${p(0.3, 1.03)} ${p(-0.25, 0.97)} C${p(-0.88, 0.91)} ${p(-1.06, 0.48)} ${p(-0.94, 0.06)} C${p(-0.81, -0.36)} ${p(-1.12, -0.88)} ${p(-0.35, -1)} Z`;
  return `<path class="snb" d="${d}"/><path class="snt" d="${d}"/>` + stipple(cx - 0.05 * hw, cy, hw * 0.8, hh * 0.85, 18) +
    `<circle class="dot" cx="${f(cx - 0.1 * hw)}" cy="${f(cy + 0.12 * hh)}" r="3.6"/>`;
}

/* ---------- the two Sertoli cells ---------- */
const LEFT = [[76, 152, -14], [98, 142, -7], [120, 154, 0], [142, 142, 7], [163, 152, 14]];               // in the left cell's processes
const RIGHT = [[269, 117, -14], [331, 77, -4], [347, 106, 6], [380, 108, 12], [410, 112, 18]];            // in the right cell's crown
function sheath(x, y, tilt, top){ // a slender process of Sertoli cytoplasm around one late spermatid
  const pts = [[x - 9.5, y + 24], [x - 8.5, y + 2], [x - 6.5, y - top * 0.55], [x - 4, y - top], [x, y - top - 3], [x + 4, y - top],
    [x + 6.5, y - top * 0.55], [x + 8.5, y + 2], [x + 9.5, y + 24], [x, y + 28]];
  return `<path transform="rotate(${tilt} ${x} ${y})" d="${closed(pts, false)}"/>`;
}
function sertoliShapes(){
  // the epithelium's cytoplasm, basal lamina to the apical surface (the germ cells are drawn over it)
  const top = [[X0, 162], [56, 159], [100, 161], [160, 160], [186, 158], [206, 140], [232, 136], [254, 124], [268, 110],
    [290, 103], [316, 96], [342, 98], [366, 101], [392, 98], [414, 101], [X1, 104]];
  const body = open(top) + `L${X1} ${BL}L${X0} ${BL}Z`;
  return `<path d="${body}"/>` + LEFT.map(([x, y, t]) => sheath(x, y, t, 44)).join("") + sheath(331, 77, -4, 40);
}
function fibers(){                // the Sertoli cytoplasm's streaks, up each column and out into its processes
  let s = "";
  LEFT.forEach(([x, y], i) => { const k = i - 2;
    s += `<path class="fib" d="${open([[124 + k * 7, BL - 2], [128 + k * 5, 296], [130 + k * 7, 225], [126 + k * 9, 196], [x, y + 12]])}"/>`; });
  RIGHT.forEach(([x, y], i) => { const k = i - 2;
    s += `<path class="fib" d="${open([[336 + k * 3, BL - 2], [334 + k * 5, 296], [334 + k * 8, 210], [338 + k * 10, 150], [x, y + 12]])}"/>`; });
  return s;
}

function svg(){
  const parts = [];
  // under the basal lamina: the tubule wall's connective tissue, with flattened peritubular myoid cells
  parts.push(`<rect class="ct" x="${X0}" y="${BL}" width="${X1 - X0}" height="33"/>`);
  for (const y of [336, 347, 358]) parts.push(`<path class="ctl" d="${open([[X0, y], [140, y - 1.5], [240, y + 1.2], [340, y - 1], [X1, y + 0.8]])}"/>`);
  for (const [x, y] of [[88, 341], [214, 340], [342, 341], [150, 353], [278, 354], [404, 352]])
    parts.push(`<path class="myn" d="M${x - 27} ${y} C${x - 12} ${y - 3.4} ${x + 12} ${y - 3.4} ${x + 27} ${y} C${x + 12} ${y + 3.4} ${x - 12} ${y + 3.4} ${x - 27} ${y} Z"/>`);
  // the Sertoli cells: outline first, then fill, so the shapes read as one cytoplasm; then its streaks
  const sh = sertoliShapes();
  parts.push(`<g class="so">${sh}</g><g class="si">${sh}</g>`, fibers());
  parts.push(sertoliNucleus(130, 259, 20, 31), sertoliNucleus(334, 250, 21, 40));
  // the basal compartment: one row of spermatogonia on the basal lamina, between the Sertoli cells' feet
  parts.push(spermatogonium("Ad", 69, 33, 22), spermatogonium("Ap", 190, 26, 21), spermatogonium("B", 244, 26, 21),
    spermatogonium("B", 298, 26, 21), spermatogonium("B", 376, 28, 21), spermatogonium("Ap", 428, 22, 20));
  // the junctional complex, between neighboring Sertoli cells just above the spermatogonia (the columns pass through it)
  let jx = "", jd = "";
  for (const [a, b] of [[X0 + 1, 101], [164, 300], [362, X1 - 1]]) {
    jx += `M${a} ${JX - 1.4}H${b}M${a} ${JX + 1.4}H${b}`;
    for (let x = a + 2.5; x < b - 1; x += 4.5) jd += `<circle class="jxd" cx="${f(x)}" cy="${JX}" r=".75"/>`;
  }
  parts.push(`<path class="jx" d="${jx}"/>${jd}`);
  // the adluminal compartment: pachytene primary spermatocytes, two rows of early spermatids, late spermatids at the lumen
  for (const x of [67, 196, 264, 396]) parts.push(spermatocyte(x, 243, 32));
  for (const x of [80, 172, 216, 260]) parts.push(earlySpermatid(x, 189, 20));
  parts.push(earlySpermatid(384, 172, 22));
  for (const x of [196, 248, 300]) parts.push(earlySpermatid(x, 143, 20));
  for (const [x, y, r] of [[300, 112, 6], [364, 120, 5.5], [424, 124, 5]]) parts.push(residualBody(x, y, r));
  for (const [x, y, t] of [...LEFT, ...RIGHT]) parts.push(lateSpermatid(x, y, t));
  parts.push(`<line class="bl" x1="${X0}" y1="${BL}" x2="${X1}" y2="${BL}"/>`);
  // the compartments, lettered
  parts.push(`<path class="brk" d="M31 ${JX + 3} L25 ${JX + 3} L25 ${BL - 2} L31 ${BL - 2}"/><text class="let" x="13" y="${(JX + BL) / 2 + 5}">A</text>`);
  parts.push(`<path class="brk" d="M31 62 L25 62 L25 ${JX - 4} L31 ${JX - 4}"/><text class="let" x="13" y="${(62 + JX) / 2 + 5}">B</text>`);
  parts.push(`<text class="side" x="214" y="44">Lumen</text>`);
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
