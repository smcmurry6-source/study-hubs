// L14 (Dr. Herr): the follicle stages, one of Exam 2's two picture questions (Sam, 2026-11-11: "The two images on the exam
// are sertoli and female reproductive stages picture question", "Yes, draw it", then, with a screenshot of the slide:
// "This is actually the female question he was talking about"). A static figure (FIGS, not anima), unlabeled like the
// Sertoli cell drawing: the stages keep his numbers 1-5 and every one of his labels is a letter, and the key gives his
// words, so a student can test themselves first. build.mjs writes it into the hub's `var FIGS = {...};` line.
//
// Laid out like his slide (the screenshot is not kept in the repo): the five follicles in a column, smallest on top,
// numbered 1 to 5 down the left, his labels down the right with leaders: 1 primordial follicle (oocyte, stromal cells,
// follicular cell), 2 unilaminar primary (basal lamina, zona pellucida forming), 3 multilaminar primary (zona pellucida,
// granulosa cells, theca interna), 4 antral (antrum, theca interna, theca externa, granulosa cells: the fluid still in
// several spaces, the oocyte off to one side) and 5 mature (graafian) (theca externa, theca interna, antrum, granulosa
// cells, corona radiata, cumulus oophorus: one big antrum, the oocyte on its mound low in the follicle). The same structure
// keeps one letter wherever he labels it, and the letters are deliberately out of order. Drawn anew in the hub's colors
// with the stepped follicle figure's own helpers (follicle.mjs), not traced. Names and labels are his
// (figures-teach-the-lecture); the key adds the hub notes' other names for 2-4 and L16's.
//
// Sources (for the drawing's accuracy; nothing copied):
//   - Ross MH, Pawlina W. Histology: A Text and Atlas, 8th ed. (2020), ch. 23: the primordial follicle's one layer of
//     squamous follicular cells among the stromal cells; the cuboidal granulosa cells, the forming zona pellucida and the
//     basal lamina of the unilaminar primary follicle; stratified granulosa cells and the theca of the multilaminar one;
//     fluid-filled spaces that join into one antrum; the oocyte eccentric on the cumulus oophorus, the corona radiata
//     around it.
//   - Mescher AL. Junqueira's Basic Histology, 16th ed. (2021), ch. 22: the theca interna's plump, vascular cells inside
//     the fibrous theca externa.
// Schematic: sizes only rank the stages (the oocyte grows from about 25 to 100-150 µm, the mature follicle to about 20 mm).
import follicle, { foPt, foCirc, foRing, foOocyte, foTheca, foGran, foPolar } from "./follicle.mjs";
import { f1, LIGHT, DARK } from "./shared.mjs";

const W = 440, H = 766;
const CX = 180, LX = 418;                                   // the follicles' column; the letters' column
const Y = [40, 112, 230, 410, 636];                         // the five follicles' centers

/* the follicle helpers' classes, restyled for a static figure outside .anima: the stepped figure's own CSS, rescoped */
const FO_CSS = follicle().css.split("\n").filter((l) => /^\.anima \.follicle-svg \.fo-[a-z-]+(\.fo-swell)?\{[^}]*\}$/.test(l))
  .map((l) => l.replace(".anima .follicle-svg ", ".ffs ")).join("");
const CSS = `.ffs{${LIGHT}}@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) .ffs{${DARK}}}:root[data-theme="dark"] .ffs{${DARK}}` +
  FO_CSS +
  ".ffs .halo{fill:var(--bx-matrix)}" +
  ".ffs .sd{fill:var(--bx-nuc-line);opacity:.8}" +
  ".ffs .lead{stroke:var(--ink-faint);stroke-width:1.1}" +
  ".ffs .lead-dot{fill:var(--ink-soft)}" +
  ".ffs .num circle{fill:var(--accent)}" +
  ".ffs .num text{fill:var(--bg);font:700 14px var(--font-body);text-anchor:middle}" +
  ".ffs .let rect{fill:var(--bg);stroke:var(--ink-soft);stroke-width:1.3}" +
  ".ffs .let text{fill:var(--ink);font:700 12.5px var(--font-body);text-anchor:middle}";

/* deterministic jitter */
let seed = 20261111;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

/* stromal (or theca) cells as short dark dashes in a ring, lying along it */
function dashes(cx, cy, r1, r2, n, rot, cls = "sd", len = 4.6){
  let o = "";
  for (let i = 0; i < n; i++) {
    const a = rot + (i + rnd() * 0.5) / n * 2 * Math.PI, r = r1 + rnd() * (r2 - r1), p = foPt(cx, cy, r, a);
    o += `<ellipse class="${cls}" cx="${f1(p[0])}" cy="${f1(p[1])}" rx="${f1(len * (0.8 + rnd() * 0.4))}" ry="1.3" transform="rotate(${f1(a * 57.2958 + 90 + (rnd() - 0.5) * 30)} ${f1(p[0])} ${f1(p[1])})"/>`;
  }
  return o;
}
const halo = (cx, cy, r) => `<circle class="halo" cx="${cx}" cy="${cy}" r="${r}"/>`;

/* ---------- the five stages ---------- */
function primordial(cy){        // a small oocyte in one layer of flat follicular cells, stromal cells around
  return halo(CX, cy, 28) + foRing(CX, cy, 13, 17.5, 8, 0.4, "fo-fc", "fo-gn", "flat") + foOocyte(CX, cy, 13, { nr: 4.8, nx: 1.5, ny: -1 }) +
    dashes(CX, cy, 21.5, 26, 11, 0.1);
}
function unilaminar(cy){        // one layer of cube-shaped granulosa cells on a basal lamina; the zona pellucida forming
  let zf = "";
  for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283 + 0.3, p = foPt(CX, cy, 15.4, a), q = foPt(CX, cy, 15.4, a + 0.5);
    zf += `<path class="fo-zp" stroke-width="2.2" d="M${f1(p[0])} ${f1(p[1])}A15.4 15.4 0 0 1 ${f1(q[0])} ${f1(q[1])}"/>`; }
  return halo(CX, cy, 34) + foRing(CX, cy, 17, 26, 14, 0.15, "fo-gc", "fo-gn", "round") + foCirc(CX, cy, 26.6, "fo-bl") +
    foOocyte(CX, cy, 14, { nr: 5, nx: 1.5, ny: -1 }) + zf + dashes(CX, cy, 29.5, 33, 13, 0.4);
}
function multilaminar(cy){      // many layers of granulosa cells around a complete zona; a theca interna forming outside
  let o = halo(CX, cy, 72) + dashes(CX, cy, 63.5, 70, 34, 0.2) + foCirc(CX, cy, 60.6, "fo-bl");
  for (let i = 0; i < 5; i++) { const ra = 25 + i * 7.1, rb = ra + 7.1; o += foRing(CX, cy, ra, rb, Math.round(2 * Math.PI * (ra + 3.5) / 7), i * 0.13, "fo-gc", "fo-gn", "round"); }
  return o + `<circle class="fo-zp" cx="${CX}" cy="${cy}" r="22.6" stroke-width="4.6"/>` + foOocyte(CX, cy, 20, { nr: 7, nx: 2, ny: -1.5 });
}
/* granulosa nuclei packed in a disk, skipping wherever skip(x, y) says */
function granDisk(cx, cy, R, skip){
  let o = foCirc(cx, cy, R, "fo-gbg");
  for (let rr = 4; rr < R - 2; rr += 6.4) {
    const n = Math.max(1, Math.floor(2 * Math.PI * rr / 6.6));
    for (let j = 0; j < n; j++) {
      const a = (j + rnd() * 0.5) / n * 2 * Math.PI, r2 = rr + (rnd() - 0.5) * 2, p = foPt(cx, cy, r2, a);
      if (!skip(p[0], p[1])) o += foCirc(p[0], p[1], 2.2, "fo-gn");
    }
  }
  return o;
}
const ANTRAL_POOLS = [[-26, -24, 21, 0.4], [10, -46, 11, 1.7], [-48, 8, 9, 2.9], [-14, 10, 8, 0.9], [24, -18, 6, 2.2], [-34, 34, 6, 1.1]];
const ANTRAL_OO = [26, 24, 17];
function antral(cy){            // fluid in several spaces joining into one antrum; the oocyte off to one side
  const R = 78;
  const pool = ([, , r, ph]) => (a) => r * (1 + 0.16 * Math.sin(3 * a + ph) + 0.09 * Math.sin(5 * a + ph * 2));
  const inPool = (x, y) => ANTRAL_POOLS.some((p) => { const dx = x - (CX + p[0]), dy = y - (cy + p[1]); return Math.hypot(dx, dy) < pool(p)(Math.atan2(dy, dx)) + 3; });
  const [ox, oy, orr] = ANTRAL_OO, oc = [CX + ox, cy + oy];
  let o = halo(CX, cy, 100) + foTheca(CX, cy, R + 1, R + 9, R + 18, 13, false) + foCirc(CX, cy, R + 1, "fo-bl");
  o += granDisk(CX, cy, R, (x, y) => inPool(x, y) || Math.hypot(x - oc[0], y - oc[1]) < orr + 5.5);
  for (const p of ANTRAL_POOLS) o += `<path class="fo-liq" d="${foPolar(CX + p[0], cy + p[1], pool(p), 48)}"/>`;
  o += `<circle class="fo-zp" cx="${f1(oc[0])}" cy="${f1(oc[1])}" r="${orr + 2.3}" stroke-width="4"/>` + foOocyte(oc[0], oc[1], orr, { nr: 6, nx: 2, ny: -1.5 });
  return o;
}
const MAT = { gR: 94, wall: 10, tc: 1.95, rc: 62, oR: 15 };
function mature(cy){            // one big antrum; the oocyte, in its corona radiata, on the cumulus oophorus
  const { gR, wall, tc, rc, oR } = MAT, ti = gR + 12, te = ti + 10;
  const ra = (a) => { const d = Math.atan2(Math.sin(a - tc), Math.cos(a - tc)); return (gR - wall) - 32 * Math.exp(-d * d / 0.2); };
  const oc = foPt(CX, cy, rc, tc), zr = oR + 3.6, cr = zr + 7.2;
  let o = halo(CX, cy, 126) + foTheca(CX, cy, gR + 1, ti, te, 21, false) + foCirc(CX, cy, gR + 1, "fo-bl");
  o += foGran(CX, cy, gR, ra, [oc[0], oc[1], cr], 5);
  o += `<path class="fo-liq" d="${foPolar(CX, cy, (a) => ra(a) - 0.5, 120)}"/>`;
  o += foRing(oc[0], oc[1], zr, cr, 15, 0.2, "fo-gc", "fo-gn", "radial");
  o += `<circle class="fo-zp" cx="${f1(oc[0])}" cy="${f1(oc[1])}" r="${f1(oR + 2)}" stroke-width="3.5"/>` + foOocyte(oc[0], oc[1], oR, { nr: 6, nx: 2, ny: -1.5, cg: true });
  return { svg: o, oc, cr };
}

/* ---------- the key: his numbers and labels ---------- */
export const KEY = [
  ["1", "Primordial follicle"],
  ["2", "Unilaminar primary follicle (early primary)"],
  ["3", "Multilaminar primary follicle (late primary; L16 calls it secondary)"],
  ["4", "Antral follicle (the notes' secondary follicle: fluid spaces joining into one antrum)"],
  ["5", "Mature (graafian) follicle"],
  ["A", "Zona pellucida (forming, in 2)"],
  ["B", "Antrum"],
  ["C", "Follicular cell"],
  ["D", "Corona radiata"],
  ["E", "Granulosa cells"],
  ["F", "Theca externa"],
  ["G", "Oocyte"],
  ["H", "Basal lamina"],
  ["I", "Cumulus oophorus"],
  ["J", "Theca interna"],
  ["K", "Stromal cells"],
];

const lead = (px, py, y) => `<line class="lead" x1="${f1(px)}" y1="${f1(py)}" x2="${LX - 10}" y2="${f1(y)}"/><circle class="lead-dot" cx="${f1(px)}" cy="${f1(py)}" r="1.6"/>`;
const letter = (L, px, py, y) => lead(px, py, y) + `<g class="let"><rect x="${LX - 9.5}" y="${f1(y - 9.5)}" width="19" height="19" rx="4"/><text x="${LX}" y="${f1(y + 4.4)}">${L}</text></g>`;
const number = (n, y) => `<g class="num"><circle cx="26" cy="${y}" r="14"/><text x="26" y="${y + 5}">${n}</text></g>`;

function svg(){
  const p = (r, a, cy) => foPt(CX, cy, r, a);
  const m = mature(Y[4]);
  const parts = [primordial(Y[0]), unilaminar(Y[1]), multilaminar(Y[2]), antral(Y[3]), m.svg];
  Y.forEach((y, i) => parts.push(number(i + 1, y)));
  // 1 primordial: oocyte, stromal cells, follicular cell
  parts.push(letter("G", ...p(6, -0.7, Y[0]), 16), letter("K", ...p(24, 0.0, Y[0]), 40), letter("C", ...p(15.2, 0.95, Y[0]), 66));
  // 2 unilaminar primary: basal lamina, zona pellucida forming
  parts.push(letter("H", ...p(26.6, -0.55, Y[1]), 96), letter("A", ...p(15.4, 0.75, Y[1]), 122));
  // 3 multilaminar primary: zona pellucida, granulosa cells, theca interna
  parts.push(letter("A", ...p(22.6, -0.75, Y[2]), 190), letter("E", ...p(46, -0.2, Y[2]), 218), letter("J", ...p(66, 0.25, Y[2]), 248));
  // 4 antral: antrum, theca interna, theca externa, granulosa cells
  const pool = ANTRAL_POOLS[1];
  parts.push(letter("B", CX + pool[0] + 4, Y[3] + pool[1], 350), letter("J", ...p(84, -0.42, Y[3]), 378),
    letter("F", ...p(93.5, 0.02, Y[3]), 408), letter("E", CX - 6, Y[3] + 54, 444));
  // 5 mature (graafian): theca externa, theca interna, antrum, granulosa cells, corona radiata, cumulus oophorus
  const cor = foPt(m.oc[0], m.oc[1], m.cr - 3, -0.2), cum = p(81, 1.55, Y[4]);
  parts.push(letter("F", ...p(111, -0.98, Y[4]), 528), letter("J", ...p(100.5, -0.72, Y[4]), 554), letter("B", CX + 30, Y[4] - 34, 580),
    letter("E", ...p(89, 0.12, Y[4]), 612), letter("D", ...cor, 676), letter("I", ...cum, 708));
  return `<svg class="ffs" viewBox="0 0 ${W} ${H}" role="img" aria-label="Five ovarian follicles in a column, numbered 1 to 5 from the smallest to the largest, with their parts lettered A to K">` +
    `<style>${CSS}</style>${parts.join("")}</svg>`;
}

export const FOLLICLES = {
  id: "follicles",
  lec: "fhisto",
  title: "The five follicle stages",
  caption: "Dr. Herr's follicle-stages picture (L14) is on the exam. This is the hub's own unlabeled version, laid out like his: name each number and letter, then open the key. Schematic.",
  key: KEY,
  svg: svg(),
};
