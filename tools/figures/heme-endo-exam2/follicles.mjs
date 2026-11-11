// L14 (Dr. Herr): the follicle stages, one of Exam 2's two picture questions (Sam, 2026-11-11: "The two images on the exam
// are sertoli and female reproductive stages picture question"; the picture is the follicle stages, and Sam: "Yes, draw
// it"). A static figure (FIGS, not anima), unlabeled like the Sertoli cell drawing: the five follicles are numbered and
// the Graafian follicle's parts lettered, and the key names them, so a student can test themselves first. build.mjs
// writes it into the hub's `var FIGS = {...};` line.
//
// One piece of ovarian cortex, the way a section shows it: the surface epithelium and tunica albuginea on top, spindle-
// shaped stromal cells, primordial follicles just under the tunica albuginea, growing follicles deeper, and the mature
// Graafian follicle bulging on the surface. Each follicle is drawn with the same helpers as the stepped anima figure
// (follicle.mjs), so the two agree. The names and parts are Dr. Herr's (figures-teach-the-lecture): his five stages, and
// the Graafian follicle's antrum, cumulus oophorus, corona radiata, granulosa cells and the two thecae. L16 (Dr.
// Madison) names two stages differently, and the key says so. The numbers are deliberately out of order, so the picture
// never gives away the sequence (fh-fig-order).
//
// Sources (for the drawing's accuracy; nothing copied):
//   - Ross MH, Pawlina W. Histology: A Text and Atlas, 8th ed. (2020), ch. 23: primordial follicles lie in the
//     superficial cortex just under the tunica albuginea, a primary oocyte in one layer of squamous follicular cells; in
//     the primary follicle the cells turn cuboidal, then stratify (unilaminar to multilaminar) as the zona pellucida forms
//     and the stroma organizes into the theca; fluid-filled spaces join into one antrum in the secondary follicle, the
//     oocyte sits eccentric on the cumulus oophorus with the corona radiata around it; the mature follicle spans the
//     cortex and bulges from the surface.
//   - Mescher AL. Junqueira's Basic Histology, 16th ed. (2021), ch. 22: the theca interna's plump, vascular cells inside
//     the fibrous theca externa; the granulosa layer (membrana granulosa) lining the antrum.
// Schematic: not to scale. A real Graafian follicle (about 20 mm) is far larger than its neighbors and the primordial
// follicles far smaller (oocyte about 25 µm); the sizes here only rank them.
import follicle, { foR, foPt, foCirc, foRing, foStroma, foOocyte, foTheca, foGran, foSurface } from "./follicle.mjs";
import { f1, LIGHT, DARK } from "./shared.mjs";

const W = 540, H = 368;
const FX0 = 8, FX1 = 532, FY0 = 10, FY1 = 360;
const BASE = 60, BUMP = 30, BX = 394, BW = 104;            // the ovary's surface, bulging over the Graafian follicle
const sT = (x) => BASE - BUMP * Math.exp(-Math.pow((x - BX) / BW, 2));

// the five follicles: [stage, center x, center y]
const GF = { x: 394, y: 161 };   // Graafian
const SF = { x: 158, y: 262 };   // secondary (antral)
const LP = { x: 72, y: 150 };    // late primary (multilaminar)
const EP = { x: 192, y: 126 };   // early primary (unilaminar)
const PF = { x: 262, y: 96 };    // primordial
const OTHER_PRIM = [[30, 98], [248, 342], [258, 214], [494, 332]];

/* the follicle helpers' classes, restyled for a static figure outside .anima: the stepped figure's own CSS, rescoped */
const FO_CSS = follicle().css.split("\n").filter((l) => /^\.anima \.follicle-svg \.fo-[a-z-]+(\.fo-swell)?\{[^}]*\}$/.test(l))
  .map((l) => l.replace(".anima .follicle-svg ", ".ffs ")).join("");
const CSS = `.ffs{${LIGHT}}@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) .ffs{${DARK}}}:root[data-theme="dark"] .ffs{${DARK}}` +
  FO_CSS +
  ".ffs .lead{stroke:var(--ink-faint);stroke-width:1.1}" +
  ".ffs .num circle{fill:var(--bg);stroke:var(--accent);stroke-width:1.6}" +
  ".ffs .num text{fill:var(--ink);font:700 13px var(--font-body);text-anchor:middle}" +
  ".ffs .let rect{fill:var(--bg);stroke:var(--ink-soft);stroke-width:1.3}" +
  ".ffs .let text{fill:var(--ink);font:700 12.5px var(--font-body);text-anchor:middle}" +
  ".ffs .side{fill:var(--ink-soft);font:italic 12.5px var(--font-body)}";

/* ---------- the follicles (each as in follicle.mjs's matching stage, smaller) ---------- */
function primordial(x, y, r, sd){
  return foRing(x, y, r, r + 4.5, Math.max(6, Math.round(r / 2.2)), sd, "fo-fc", "fo-gn", "flat") + foOocyte(x, y, r, { nr: r * 0.36, nx: r * 0.22, ny: -r * 0.12 });
}
function earlyPrimary(x, y){
  const r = 18;
  let o = foOocyte(x, y, r, { nr: 6.5, nx: 2, ny: -1 });
  let zf = ""; for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283, p = foPt(x, y, r + 1.5, a), q = foPt(x, y, r + 1.5, a + 0.45);
    zf += `<path class="fo-zp" stroke-width="2" d="M${f1(p[0])} ${f1(p[1])}A${r + 1.5} ${r + 1.5} 0 0 1 ${f1(q[0])} ${f1(q[1])}"/>`; }
  o += zf + foRing(x, y, r + 3, r + 11, 15, 0.1, "fo-gc", "fo-gn", "round") + foCirc(x, y, r + 11.5, "fo-bl");
  return o;
}
function latePrimary(x, y){
  const r = 18, zo = r + 4.5, gR = zo + 24, ti = gR + 7, te = ti + 7;
  let o = foTheca(x, y, gR + 1, ti, te, 11, false) + foCirc(x, y, gR + 1, "fo-bl");
  for (let i = 0; i < 3; i++) { const ra = zo + i * 8, rb = ra + 8; o += foRing(x, y, ra, rb, Math.round(2 * Math.PI * (ra + 4) / 7.5), i * 0.11, "fo-gc", "fo-gn", "round"); }
  o += `<circle class="fo-zp" cx="${x}" cy="${y}" r="${f1(r + 2.2)}" stroke-width="4"/>` + foOocyte(x, y, r, { nr: 6.5, nx: 2, ny: -1 });
  return o;
}
/* secondary (G false) or Graafian (G true): an antrum, the oocyte on the cumulus oophorus with its corona radiata */
function antral(cx, cy, G){
  const gR = G ? 92 : 64, ti = gR + (G ? 13 : 9), te = ti + (G ? 11 : 9), tc = G ? 2.35 : 2.25, wall = G ? 11 : 24;
  const rc = G ? 60 : 38;
  const ra = (a) => { const d = Math.atan2(Math.sin(a - tc), Math.cos(a - tc));
    return G ? (gR - wall) - 30 * Math.exp(-d * d / 0.2) : (gR - wall) - 17 * Math.exp(-d * d / 0.4) - 7 * (1 + Math.cos(d)); };
  const oR = G ? 15 : 15, oc = foPt(cx, cy, rc, tc), zr = oR + 3.5, cr = zr + 7;
  let o = foTheca(cx, cy, gR + 1, ti, te, G ? 21 : 17, false) + foCirc(cx, cy, gR + 1, "fo-bl");
  o += foGran(cx, cy, gR, ra, [oc[0], oc[1], cr], G ? 5 : 9);
  const pts = []; for (let i = 0; i < 120; i++) { const a = i / 120 * 2 * Math.PI; pts.push(foPt(cx, cy, ra(a) - 0.5, a)); }
  // the antrum, its fluid pale; the corona radiata and zona around the oocyte
  o += `<path class="fo-liq" d="${smoothPath(pts)}"/>`;
  o += foRing(oc[0], oc[1], zr, cr, 15, 0.2, "fo-gc", "fo-gn", "radial");
  o += `<circle class="fo-zp" cx="${f1(oc[0])}" cy="${f1(oc[1])}" r="${f1(oR + 2)}" stroke-width="3.5"/>` + foOocyte(oc[0], oc[1], oR, { nr: 6, nx: 2, ny: -1.5, cg: true });
  return { svg: o, gR, ti, te, tc, rc, oc, cr, ra };
}
function smoothPath(p){
  const n = p.length; let d = `M${f1(p[0][0])} ${f1(p[0][1])}`;
  for (let i = 0; i < n; i++) { const a = p[(i - 1 + n) % n], b = p[i], c = p[(i + 1) % n], e = p[(i + 2) % n];
    d += `C${f1(b[0] + (c[0] - a[0]) / 6)} ${f1(b[1] + (c[1] - a[1]) / 6)} ${f1(c[0] - (e[0] - b[0]) / 6)} ${f1(c[1] - (e[1] - b[1]) / 6)} ${f1(c[0])} ${f1(c[1])}`; }
  return d + "Z";
}

/* ---------- the key ---------- */
export const KEY = [
  ["1", "Secondary (antral) follicle: fluid pooled into one antrum, the oocyte on the cumulus oophorus (L16 calls any follicle with an antrum Graafian)"],
  ["2", "Early primary (unilaminar) follicle: one layer of cube-shaped granulosa cells"],
  ["3", "Mature Graafian follicle: huge, bulging from the ovary's surface; the one that ovulates"],
  ["4", "Primordial follicle: one layer of flat (squamous) follicular cells"],
  ["5", "Late primary (multilaminar) follicle: many layers of granulosa cells, the theca forming, no fluid yet (L16 calls it secondary)"],
  ["A", "Antrum (liquor folliculi)"],
  ["B", "Corona radiata"],
  ["C", "Cumulus oophorus"],
  ["D", "Granulosa cells"],
  ["E", "Theca interna"],
  ["F", "Theca externa"],
];

const num = (n, px, py, x, y) => `<line class="lead" x1="${f1(px)}" y1="${f1(py)}" x2="${f1(x)}" y2="${f1(y)}"/><g class="num"><circle cx="${f1(x)}" cy="${f1(y)}" r="11"/><text x="${f1(x)}" y="${f1(y + 4.5)}">${n}</text></g>`;
const let_ = (n, px, py, x, y) => (px == null ? "" : `<line class="lead" x1="${f1(px)}" y1="${f1(py)}" x2="${f1(x)}" y2="${f1(y)}"/>`) +
  `<g class="let"><rect x="${f1(x - 9.5)}" y="${f1(y - 9.5)}" width="19" height="19" rx="4"/><text x="${f1(x)}" y="${f1(y + 4.4)}">${n}</text></g>`;

function svg(){
  const g = antral(GF.x, GF.y, true), s = antral(SF.x, SF.y, false);
  const holes = [[GF.x, GF.y, g.te + 2], [SF.x, SF.y, s.te + 2], [LP.x, LP.y, 62], [EP.x, EP.y, 31], [PF.x, PF.y, 14]]
    .concat(OTHER_PRIM.map(([x, y]) => [x, y, 13]));
  const parts = [];
  parts.push(`<rect class="fo-field" x="${FX0}" y="${FY0}" width="${FX1 - FX0}" height="${FY1 - FY0}" rx="10"/>`);
  parts.push(foStroma(FX0, FY0, FX1, FY1, holes, sT, 7, 900));
  parts.push(foSurface(FX0, FX1, BASE, BUMP, BX, BW, null, FY0));
  parts.push(primordial(PF.x, PF.y, 9, 0.3));
  OTHER_PRIM.forEach(([x, y], i) => parts.push(primordial(x, y, 8 + (i % 2), 0.7 * i)));
  parts.push(earlyPrimary(EP.x, EP.y), latePrimary(LP.x, LP.y), s.svg, g.svg);
  // the five follicles, numbered out of order
  const edge = (c, r, toward) => { const dx = toward[0] - c.x, dy = toward[1] - c.y, d = Math.hypot(dx, dy); return [c.x + dx / d * r, c.y + dy / d * r]; };
  const N = [[1, SF, s.te, [42, 248]], [2, EP, 30, [236, 156]], [3, GF, g.te, [300, 318]], [4, PF, 13, [226, 82]], [5, LP, 46, [128, 86]]];
  for (const [n, c, r, at] of N) { const p = edge(c, r - 4, at); parts.push(num(n, p[0], p[1], at[0], at[1])); }
  // the Graafian follicle's parts, lettered
  const at = (r, a) => foPt(GF.x, GF.y, r, a);
  parts.push(let_("A", null, null, GF.x + 22, GF.y - 34));
  const cor = foPt(g.oc[0], g.oc[1], g.cr - 3, -0.5); parts.push(let_("B", cor[0], cor[1], GF.x + 2, GF.y + 18));
  const cum = foPt(GF.x, GF.y, g.ra(g.tc + 0.45) + 4, g.tc + 0.45); parts.push(let_("C", cum[0], cum[1], GF.x - 30, GF.y + 6));
  const gr = at(g.gR - 6, 0.1); parts.push(let_("D", gr[0], gr[1], GF.x + 44, GF.y + 18));
  const tin = at((g.gR + g.ti) / 2 + 1, 0.72); parts.push(let_("E", tin[0], tin[1], 506, 300));
  const tex = at((g.ti + g.te) / 2 + 1, 0.98); parts.push(let_("F", tex[0], tex[1], 470, 336));
  parts.push(`<text class="side" x="${FX0 + 10}" y="${FY0 + 22}">Ovary, cortex</text>`);
  return `<svg class="ffs" viewBox="0 0 ${W} ${H}" role="img" aria-label="A piece of ovarian cortex with five follicles at different stages, numbered 1 to 5 out of order, and six parts of the largest one lettered A to F">` +
    `<style>${CSS}</style>${parts.join("")}</svg>`;
}

export const FOLLICLES = {
  id: "follicles",
  lec: "fhisto",
  title: "The follicle stages in the ovarian cortex",
  caption: "One of Exam 2's two picture questions shows the follicle stages (L14). Name each numbered follicle and each lettered part of the largest one, then open the key. Schematic, not to scale.",
  key: KEY,
  svg: svg(),
};
