// Fig: vertical to horizontal (Periodontology S6, Dr. Geurs' canine case, from the notes and his class).
// Two panels, one figure:
//   the film: a drawn periapical radiograph of a mandibular lateral incisor and canine (with their neighbors' edges),
//     8 px = 1 mm. Before: a vertical (infrabony) defect along the canine's mesial root, its edge fuzzy and ill-defined.
//     After the DFDBA graft: the defect filled to a flat crest, a horizontal defect, with a dense crestal line; the
//     dashed line 1.5 mm from the CEJ is where bone belongs, which the fill doesn't reach (the lecture's expectation).
//   the cut: a cross-section across the lateral's root and the canine's H-shaped root (two canals: two roots fused),
//     18 px = 1 mm, with floss stretched across the mesial concavity (missing its depth) or an interdental brush
//     whose bristles spread into it.
// The crest reading (fuzzy = activity and resorption; dense, a crestal lamina dura = less activity and stability) is
// what he said about Jeffrey's films in the same lecture; it is drawn here on the canine's films as a general sign.
// Proportions follow Wheeler's average tooth sizes; the defect, the bone level and the cut are illustrative.
// Every state is drawn at build time; the live code only switches data-film / data-clean (CSS crossfades them).
import { figureSvg, plateHtml } from "./shared.mjs";

const r1 = (n) => Math.round(n * 10) / 10;
/* a polyline in px, written relative (short numbers) from rounded absolute points so it never drifts */
function P(pts, close) {
  let o = "", px = 0, py = 0;
  pts.forEach((p, i) => { const x = r1(p[0]), y = r1(p[1]); o += i ? (i === 1 ? "l" : " ") + r1(x - px) + " " + r1(y - py) : "M" + x + " " + y; px = x; py = y; });
  return (o + (close ? "Z" : "")).replace(/ -/g, "-");
}
/* dots as zero-length round-capped strokes: one path per size */
const dots = (pts, h = .01) => pts.map((p) => "M" + r1(p[0]) + " " + r1(p[1]) + "h" + h).join("");
/* a Catmull-Rom curve through pts, sampled into a dense polyline */
function sample(pts, k) {
  const out = [], n = pts.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
    for (let j = 0; j < k; j++) {
      const t = j / k, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((c) => .5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3)));
    }
  }
  out.push(pts[n - 1]);
  return out;
}
const lerp = (tab, y) => { if (y <= tab[0][0]) return tab[0][1]; for (let i = 1; i < tab.length; i++) if (y <= tab[i][0]) { const a = tab[i - 1], b = tab[i]; return a[1] + (b[1] - a[1]) * (y - a[0]) / (b[0] - a[0]); } return tab[tab.length - 1][1]; };
function inside(pt, poly) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > pt[1]) !== (b[1] > pt[1]) && pt[0] < (b[0] - a[0]) * (pt[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
let seed = 11; const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

/* ---------- the film (mm: x right from the film's left edge, y down; crowns up, as on a mandibular film) ---------- */
const K = 8, FX = 8, FY = 26, Y0 = -1.2, FWm = 18.5, FHm = 31.2, W = 330, H = 300;
const X = (x) => FX + K * x, Y = (y) => FY + K * (y - Y0), px = (p) => [X(p[0]), Y(p[1])], pxs = (a) => a.map(px);
/* labial view: crown half-widths (y, hw) per side, then a root that tapers to a rounded apex and bends distally (+x).
   Sizes: Wheeler's average crown and root lengths and cervical widths (mandibular central, lateral, canine, first premolar). */
const TEETH = {
  central: { cx: -.25, yj: 10.2, ya: 22.7, wJ: 3.5, bend: .3, L: [[1.2, 2], [1.5, 2.38], [2.6, 2.5], [4.4, 2.48], [6.6, 2.2], [10.2, 1.75]], R: [[1.2, 2], [1.5, 2.38], [2.6, 2.5], [4.4, 2.48], [6.6, 2.2], [10.2, 1.75]] },
  lateral: { cx: 5, yj: 10.5, ya: 24.5, wJ: 4, bend: .3, L: [[1, 2.25], [1.35, 2.63], [2.4, 2.75], [4.2, 2.73], [6.7, 2.45], [10.5, 2]], R: [[1, 2.25], [1.35, 2.63], [2.6, 2.75], [4.6, 2.72], [7, 2.42], [10.5, 2]] },
  canine: { cx: 11.25, yj: 11, ya: 27, wJ: 5.5, bend: .4, L: [[0, .2], [1.2, 1.55], [2.4, 2.95], [3.4, 3.5], [5, 3.45], [7, 3.25], [9.2, 2.98], [11, 2.75]], R: [[0, .2], [1.4, 1.5], [3.3, 2.95], [4.8, 3.5], [6.2, 3.42], [8, 3.2], [9.8, 2.95], [11, 2.75]] },
  premolar: { cx: 18.25, yj: 10.1, ya: 24.1, wJ: 5, bend: .3, L: [[1.6, .2], [2.9, 1.6], [4.3, 3.2], [5.5, 3.5], [7.1, 3.2], [8.6, 2.8], [10.1, 2.5]], R: [[1.6, .2], [2.9, 1.6], [4.5, 3.2], [5.9, 3.5], [7.4, 3.15], [8.8, 2.78], [10.1, 2.5]] },
};
const uOf = (T, y) => Math.min(1, Math.max(0, (y - T.yj) / (T.ya - T.yj)));
const hwR = (T, y) => { const u = uOf(T, y); return T.wJ / 2 * Math.sqrt(Math.max(0, 1 - u ** 4)) * (1 - .55 * u); };
const sh = (T, y) => T.bend * uOf(T, y) ** 3;
const xL = (T, y) => T.cx + sh(T, y) - hwR(T, y), xR = (T, y) => T.cx + sh(T, y) + hwR(T, y);
const apexYs = (T) => [.94, .975, .995].map((u) => T.yj + u * (T.ya - T.yj));
function rootYs(T, from) { const ys = []; for (let y = from; y < T.ya - 1.4; y += 1) ys.push(y); return ys.concat(apexYs(T)); }
function outline(T) {
  const top = T.L[0][0], o = [];
  for (let y = top; y < T.yj; y += .6) o.push([T.cx - lerp(T.L, y), y]);
  for (const y of rootYs(T, T.yj + .3)) o.push([xL(T, y), y]);
  o.push([T.cx + T.bend, T.ya]);
  for (const y of rootYs(T, T.yj + .3).reverse()) o.push([xR(T, y), y]);
  for (let y = T.yj; y > top; y -= .6) o.push([T.cx + lerp(T.R, y), y]);
  o.push([T.cx + lerp(T.R, top), top]);
  return P(pxs(o), true);
}
/* the enamel cap: the crown's outline and an inner line that thins to nothing at the CEJ */
function enamel(T) {
  const top = T.L[0][0], cusp = T.L[0][1] < 1, thick = cusp ? 1.5 : 1.05, o = [], inn = [];
  for (let y = T.yj; y > top; y -= .7) o.push([T.cx - lerp(T.L, y), y]);
  for (let y = top; y < T.yj; y += .7) o.push([T.cx + lerp(T.R, y), y]);
  o.push([T.cx + T.wJ / 2, T.yj]);
  const t = (y) => .06 + (thick - .06) * Math.pow(1 - (y - top) / (T.yj - top), 1.3);
  for (let y = T.yj; y > top + thick; y -= .7) inn.push([T.cx + lerp(T.R, y) - t(y), y]);
  if (cusp) inn.push([T.cx, top + thick]); else inn.push([T.cx + lerp(T.R, top + thick) - thick, top + thick], [T.cx - lerp(T.L, top + thick) + thick, top + thick]);
  for (let y = top + thick + .7; y < T.yj; y += .7) inn.push([T.cx - lerp(T.L, y) + t(y), y]);
  inn.push([T.cx - T.wJ / 2, T.yj]);
  return P(pxs(o), true) + P(pxs(inn), true);
}
/* the pulp of an untreated tooth: chamber in the crown, a canal to the apex */
function pulp(T) {
  const top = T.L[0][0], yc = top + .45 * (T.yj - top), a = [], b = [];
  const w = (y) => y < T.yj ? .2 + .5 * Math.min(1, (y - yc) / 1.6) : .7 - .5 * Math.min(1, (y - T.yj) / 4) - .1 * uOf(T, y);
  for (let y = yc; y < T.ya - .6; y += 1.2) { const c = T.cx + sh(T, y); a.push([c - w(y), y]); b.push([c + w(y), y]); }
  return P(pxs(a.concat(b.reverse())), true);
}
/* the lamina dura from the crest at y1 on the mesial side, round the apex, to the crest at y2 on the distal side */
function ld(T, y1, y2) {
  const o = rootYs(T, y1).map((y) => [xL(T, y), y]);
  o.push([T.cx + T.bend, T.ya]);
  for (const y of rootYs(T, y2).reverse()) o.push([xR(T, y), y]);
  return P(pxs(o), false);
}
const { central: TC, lateral: TL, canine: TK, premolar: TP } = TEETH;
const CR = { cl: 13.85, lat: 14.0, canA: 14.5, base: 19.8, cp: 14.05 };
/* the defect's edge before: from the crest on the lateral's root down obliquely to its base on the canine's mesial root */
const EDGE = sample([[xR(TL, CR.lat), CR.lat], [6.95, 14.4], [7.2, 15], [7.5, 15.9], [7.95, 17.3], [8.45, 18.6], [8.95, 19.4], [xL(TK, CR.base), CR.base]], 3);
/* the bone's own edge there is ragged (moth-eaten); the ghost line after treatment follows the smooth one */
const EDGEJ = EDGE.map((p, i) => { if (!i || i === EDGE.length - 1) return p; const a = EDGE[i - 1], b = EDGE[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy), d = (rnd() - .5) * .3; return [p[0] - dy / l * d, p[1] + dx / l * d]; });
const BONE = [[-3, CR.cl], [xR(TC, CR.cl), CR.cl], [xL(TL, CR.cl), CR.cl]].concat(EDGEJ, [[xR(TK, CR.cp), CR.cp], [xL(TP, CR.cp), CR.cp], [FWm + 1, CR.cp], [FWm + 1, 33], [-3, 33]]);
const FILL = [[xR(TL, CR.lat), CR.lat], [xL(TK, CR.canA), CR.canA]];
for (let y = CR.canA + .5; y < CR.base; y += .5) FILL.push([xL(TK, y), y]);
const FILLP = FILL.concat(EDGEJ.slice().reverse());
const inRoot = (p) => Object.values(TEETH).some((T) => p[1] > T.yj - .2 && p[1] < T.ya + .4 && p[0] > xL(T, p[1]) - .4 && p[0] < xR(T, p[1]) + .4);
/* marrow spaces: short round-capped dashes in two sizes, kept off the crest and the defect's edge */
function marrow(poly, n, gap) {
  const s = [], l = []; for (let i = 0, k = 0; i < 1200 && k < n; i++) {
    const p = [.3 + rnd() * (FWm - .6), 14.4 + rnd() * 15.4];
    if (!inside(p, poly) || inRoot(p) || EDGE.some((e) => Math.hypot(e[0] - p[0], e[1] - p[1]) < gap)) continue;
    (rnd() < .45 ? l : s).push(px(p)); k++;
  }
  return `<path class="vh-mar1" d="${dots(s, 1.4)}"/><path class="vh-mar2" d="${dots(l, 2)}"/>`;
}
/* erosion specks just inside the bone along the fuzzy edge */
function specks() {
  const o = []; for (let i = 1; i < EDGE.length - 2; i += 2) {
    const a = EDGE[i - 1], b = EDGE[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy), d = .25 + rnd() * .55;
    o.push(px([EDGE[i][0] - dy / l * d, EDGE[i][1] + dx / l * d]));
  }
  return dots(o, .6);
}
/* a canal filled at the root canal treatment: a tapering band from the access to near the apex */
function canal(pts) {
  const c = sample(pts, 2), a = [], b = [];
  c.forEach((p, i) => { const q = c[Math.min(c.length - 1, i + 1)], r = c[Math.max(0, i - 1)], dx = q[0] - r[0], dy = q[1] - r[1], l = Math.hypot(dx, dy) || 1, w = .27 - .15 * i / (c.length - 1); a.push([p[0] + dy / l * w, p[1] - dx / l * w]); b.push([p[0] - dy / l * w, p[1] + dx / l * w]); });
  return P(pxs(a.concat(b.reverse())), true);
}
const GP = canal([[TK.cx - .35, 9.7], [TK.cx - .75, 13.5], [TK.cx - .7, 19], [TK.cx - .2, 24], [TK.cx + .3, 26.3]]) + canal([[TK.cx + .35, 9.7], [TK.cx + .8, 13.5], [TK.cx + .85, 19], [TK.cx + .75, 24], [TK.cx + .45, 26.3]]);
const ACCESS = P(pxs(sample([[TK.cx - .85, 6.6], [TK.cx, 6.1], [TK.cx + .85, 6.6], [TK.cx + .75, 9.7], [TK.cx, 10.1], [TK.cx - .75, 9.7], [TK.cx - .85, 6.6]], 2)), true);
const cejY = (x) => TL.yj + 1.5 + (TK.yj - TL.yj) * (x - TL.cx) / (TK.cx - TL.cx);
const CEJ15 = [[2.8, cejY(2.8)], [14.4, cejY(14.4)]];

/* a label column right of the film: the leader light over the film, ink over the paper, ending on a dot on the part */
const LX = 166, FR = X(FWm);
function lab(pmm, ly, text, cls = "") {
  const p = px(pmm).map(r1), q = [LX - 4, ly - 4], t = (FR - p[0]) / (q[0] - p[0]), m = [r1(p[0] + t * (q[0] - p[0])), r1(p[1] + t * (q[1] - p[1]))];
  const lines = text.split("|").map((s, i) => `<tspan x="${LX}" dy="${i ? "1.15em" : 0}">${s}</tspan>`).join("");
  return `<g${cls ? ` class="${cls}"` : ""}><path class="vh-lin" d="M${p[0]} ${p[1]}L${m[0]} ${m[1]}"/><path class="vh-lead" d="M${m[0]} ${m[1]}L${q[0]} ${q[1]}"/><circle class="vh-dotf" cx="${p[0]}" cy="${p[1]}" r="2.3"/><text class="vh-t vh-lab" x="${LX}" y="${ly}">${lines}</text></g>`;
}
const HOT = {
  defect: "A vertical (infrabony) defect: bone loss that wraps down beside the root, with a deep pocket. At surgery, through a small flap, it had a 3-wall and a 2-wall component, as the radiograph suggested, and a streak of calculus in the root's concavity: the reason the defect was there.",
  fuzzy: "A fuzzy, ill-defined crest means activity: resorption going on (how he read the first of Jeffrey's films).",
  fill: "Filled with DFDBA, donor bone the body remodels as bone: the vertical defect became a horizontal one, a shallow, maintainable pocket that changed the tooth's prognosis.",
  dense: "A dense crest, sometimes called a crestal lamina dura, goes with less activity and stability (how he read Jeffrey's films at 20 and 25 years).",
  ghost: "Where the defect's edge was before treatment.",
  cej: "About 1.5 mm from the CEJ, where bone belongs. The expectation isn't to grow bone back to here, but to fill the defect.",
  canine: "The mandibular canine, with a root canal: two canals, which is uncommon in a mandibular canine. Two canals mean two roots formed and fused, usually into an H-shaped root with a concavity. The root canal isn't what let it regenerate: all you need is clean roots.",
  lateral: "The lateral incisor; the defect was between it and the canine.",
  root: "The canine's root cut across: two canals (filled at the root canal treatment), two roots fused into an H shape, with a concavity in its side. In this patient's concavity was a streak of calculus: a hard place to clean.",
  latroot: "The lateral incisor's root, beside the canine.",
  floss: "Floss, wrapped tight against the canine: it suspends over the top of the concavity and misses its depth.",
  bio: "Biofilm left in the depth of the concavity, where floss doesn't reach.",
  brush: "An interdental brush, through the space between the teeth: its bristles spread out into the concavity. Daily, to keep the biofilm away: that part is the patient's.",
};
function filmSvg() {
  const tooth = (T, k) => `<path class="vh-tooth" d="${outline(T)}"/><path class="vh-enam" d="${enamel(T)}"/>` + (k ? "" : `<path class="vh-pulp" d="${pulp(T)}"/>`);
  const crest = (y, a, b) => P(pxs([[xR(a, y), y], [xL(b, y), y]]), false);
  const edge = P(pxs(EDGE), false), dense = P(pxs(FILL.slice(0, 2)), false), cej = P(pxs(CEJ15), false);
  const fx = X(0), fy = Y(Y0), fw = K * FWm, fh = K * FHm, r = 9;
  const film = `<rect class="vh-film" x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="${r}"/>`
    + `<path class="vh-bone" d="${P(pxs(BONE), true)}"/>${marrow(BONE, 32, .55)}`
    /* after: the fill, its marrow, the canine's mesial lamina dura up to the new crest, the dense crest */
    + `<g class="vh-s vh-after"><g class="hot" data-info="${HOT.fill}"><path class="vh-bone" d="${P(pxs(FILLP), true)}"/>${marrow(FILLP, 5, .3)}</g>`
    + `<path class="vh-ldl" d="${P(pxs(FILL.slice(1).concat([[xL(TK, CR.base), CR.base]])), false)}"/>`
    + `<g class="hot" data-info="${HOT.dense}"><path class="vh-dense" d="${dense}"/><path class="vh-hit" d="${dense}"/></g></g>`
    /* before: the fuzzy edge (soft dark strokes into the bone) and erosion specks */
    + `<g class="vh-s vh-before"><g class="hot" data-info="${HOT.defect}"><path class="vh-hitf" d="${P(pxs(FILLP), true)}"/></g>`
    + `<g class="hot" data-info="${HOT.fuzzy}"><path class="vh-fz1" d="${edge}"/><path class="vh-fz2" d="${edge}"/><path class="vh-fz3" d="${edge}"/><path class="vh-speck" d="${specks()}"/><path class="vh-hit vh-hite" d="${edge}"/></g></g>`
    /* the lamina dura on every root where there is bone, and the neighbors' crests */
    + `<path class="vh-ldl" d="${ld(TC, CR.cl, CR.cl)}${ld(TL, CR.cl, CR.lat)}${ld(TK, CR.base, CR.cp)}${ld(TP, CR.cp, CR.cp)}"/>`
    + `<path class="vh-crest" d="${crest(CR.cl, TC, TL)}${crest(CR.cp, TK, TP)}"/>`
    + tooth(TC) + tooth(TP) + `<g class="hot" data-info="${HOT.lateral}">${tooth(TL)}</g>`
    + `<g class="hot" data-info="${HOT.canine}">${tooth(TK, 1)}<path class="vh-acc" d="${ACCESS}"/><path class="vh-gp" d="${GP}"/></g>`
    + `<g class="hot" data-info="${HOT.cej}"><path class="vh-cej" d="${cej}"/><path class="vh-hit" d="${cej}"/></g>`
    + `<g class="vh-s vh-after hot" data-info="${HOT.ghost}"><path class="vh-ghost" d="${edge}"/></g>`
    /* a mat in the paper's color hides what runs past the film's edge (no clip path: copies of a figure repeat ids) */
    + `<path class="vh-mat" fill-rule="evenodd" d="M${fx - 30} ${fy - 30}H${W + 30}V${fy + fh + 30}H${fx - 30}Z M${fx + r} ${fy}h${fw - 2 * r}q${r} 0 ${r} ${r}v${fh - 2 * r}q0 ${r}-${r} ${r}h${2 * r - fw}q-${r} 0-${r}-${r}v${2 * r - fh}q0-${r} ${r}-${r}Z"/>`
    + `<rect class="vh-frame" x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="${r}"/>`;
  const labels = lab([7.75, cejY(7.75)], 104, "1.5 mm from the CEJ:|where bone belongs")
    + lab([TK.cx - .45, 21.5], 240, "root canal:|two canals")
    + `<g class="vh-s vh-before">${lab(EDGE[4], 142, "fuzzy crest: activity,|resorption")}${lab([8.62, 16.4], 178, "vertical (infrabony)|defect")}</g>`
    + `<g class="vh-s vh-after">${lab([7.75, CR.lat + (CR.canA - CR.lat) * .48], 138, "dense crest: crestal|lamina dura, stable")}${lab([8.55, 16.3], 172, "defect filled:|now horizontal")}${lab(EDGE[15], 206, "where the|defect was")}</g>`;
  const tags = `<text class="vh-t vh-name" x="${X(TL.cx)}" y="18" text-anchor="middle">lateral</text><text class="vh-t vh-name" x="${X(TK.cx)}" y="18" text-anchor="middle">canine</text>`
    + `<text class="vh-ftag vh-s vh-before" x="${fx + 8}" y="${fy + fh - 9}">BEFORE</text><text class="vh-ftag vh-s vh-after" x="${fx + 8}" y="${fy + fh - 9}">AFTER</text>`
    + `<path class="vh-scale" d="M${FX} 287h${5 * K}M${FX} 283v8M${FX + 5 * K} 283v8"/><text class="vh-t vh-small" x="${FX + 5 * K + 8}" y="291">5 mm</text>`;
  return figureSvg({ width: W, height: H, className: "vh-svg vh-fsvg",
    label: "A drawn periapical radiograph of a mandibular lateral incisor and canine. Before: a vertical defect along the canine's mesial root with a fuzzy edge. After: the defect filled to a flat, horizontal crest with a dense crestal line, still short of 1.5 mm from the CEJ.",
    body: film + labels + tags });
}

/* ---------- the cut (px, 18 px = 1 mm; labial down, lingual up; lateral incisor left, canine right) ---------- */
const K2 = 18, CY = 150, XC = 175, XLt = 63.4, XB = 112;
const env = (v) => 2.75 * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(v) / 3.4, 3)), 1 / 2.2) * (1 + .06 * v / 3.4);
const dip = (v, d) => d * Math.exp(-((v / 1.1) ** 2));
const cM = (v) => XC - Math.max(0, env(v) - dip(v, 1.2)) * K2, cD = (v) => XC + Math.max(0, env(v) - dip(v, 1)) * K2;
const envL = (v) => 1.9 * Math.sqrt(Math.max(0, 1 - Math.pow(Math.abs(v) / 2.9, 2.4))) * (1 + .05 * v / 2.9);
const wLt = (v) => Math.max(0, envL(v) - .22 * Math.exp(-((v / 1.1) ** 2))) * K2, lD = (v) => XLt + wLt(v), lM = (v) => XLt - wLt(v);
const vy = (v) => CY + v * K2;
function ring(fl, fr, vmax) { const a = [], b = []; for (let v = -vmax; v <= vmax + 1e-9; v += vmax / 17) { a.push([fl(v), vy(v)]); b.push([fr(v), vy(v)]); } return P(a.concat(b.reverse()), true); }
function cutSvg() {
  /* the floss: tangent to the two lobes, wrapped round them, its ends out labially and lingually */
  let vLab = 1, vLin = -1;
  for (let v = .4; v <= 3; v += .02) { if (cM(v) < cM(vLab)) vLab = v; if (cM(-v) < cM(vLin)) vLin = -v; }
  const chord = Math.min(cM(vLab), cM(vLin)) - 1.6, fl = [[118, 246]];
  for (let v = 3.2; v > vLab; v -= .15) fl.push([cM(v) - 1.6, vy(v)]);
  fl.push([chord, vy(vLab)], [chord, vy(vLin)]);
  for (let v = vLin - .15; v >= -3.2; v -= .15) fl.push([cM(v) - 1.6, vy(v)]);
  fl.push([118, 54]);
  const flp = P(fl, false);
  /* biofilm along the mesial surface: floss leaves what lies deeper than its chord */
  const bio = [];
  for (let v = -2.4; v <= 2.41; v += .27) { const x = cM(v), deep = x - chord; if (deep > 4) bio.push([x - 2.6, vy(v)]); if (deep > 12) bio.push([x - 7, vy(v + .13)]); }
  /* the brush: a wire core through the embrasure, bristles out to the surfaces, longer into the concavity */
  let br = ""; const ends = [], ends2 = [];
  for (let y = 70; y <= 230; y += 3.4) {
    const v = (y - CY) / K2, R = 34 * Math.min(1, (4.5 - Math.abs(v)) / .9);
    const right = Math.abs(v) < 3.35 ? Math.min(R, cM(v) - .8 - XB) : R, left = Math.abs(v) < 2.85 ? Math.min(R * .8, XB - lD(v) - .8) : R * .8;
    br += "M" + r1(XB - left) + " " + r1(y) + "h" + r1(left + right); if (!(ends.length % 4) || y > 226) { ends.push([XB - left, y]); ends2.unshift([XB + right, y]); }
  }
  const L = (p, q, text, x, cls = "") => `<g${cls ? ` class="${cls}"` : ""}><path class="vh-lead" d="M${r1(p[0])} ${r1(p[1])}L${q[0]} ${q[1]}"/><circle class="vh-dot" cx="${r1(p[0])}" cy="${r1(p[1])}" r="2.3"/><text class="vh-t vh-lab" x="${x}" y="${q[2]}">${text.split("|").map((s, i) => `<tspan x="${x}" dy="${i ? "1.15em" : 0}">${s}</tspan>`).join("")}</text></g>`;
  const body = `<g class="hot" data-info="${HOT.latroot}"><path class="vh-dent" d="${ring(lM, lD, 2.9)}"/><ellipse class="vh-pulp2" cx="${XLt}" cy="${vy(.1)}" rx="5.6" ry="18"/></g>`
    + `<g class="hot" data-info="${HOT.root}"><path class="vh-dent" d="${ring(cM, cD, 3.4)}"/><circle class="vh-gp2" cx="${XC}" cy="${r1(vy(-1.75))}" r="7.4"/><circle class="vh-gp2" cx="${XC + 1}" cy="${r1(vy(1.75))}" r="7.8"/></g>`
    + `<g class="vh-s vh-floss"><g class="hot" data-info="${HOT.bio}"><path class="vh-bio" d="${dots(bio)}"/></g><g class="hot" data-info="${HOT.floss}"><path class="vh-fl" d="${flp}"/><path class="vh-hit" d="${flp}"/></g>`
    + `<text class="vh-t vh-tool" x="118" y="45" text-anchor="middle">floss</text>`
    + L([chord + 11, vy(.3)], [64, 254, 266], "floss bridges the concavity:|biofilm left in its depth", 10)
    + `<path class="vh-biok" d="M238 262h0"/><text class="vh-t vh-small" x="246" y="266">biofilm</text></g>`
    + `<g class="vh-s vh-brush"><g class="hot" data-info="${HOT.brush}"><path class="vh-hitf" d="${P(ends.concat(ends2), true)}"/><path class="vh-bri" d="${br}"/><path class="vh-wire" d="M${XB} 62V246"/><rect class="vh-handle" x="${XB - 5}" y="240" width="10" height="16" rx="3"/></g>`
    + `<text class="vh-t vh-tool" x="${XB}" y="52" text-anchor="middle">interdental brush</text>`
    + L([cM(0) - 1.5, CY], [64, 254, 266], "bristles spread out into|the concavity", 10) + `</g>`
    + L([XLt - 4, vy(-2.35)], [40, 28, 22], "lateral incisor", 10)
    + L([XC + 4, vy(-1.75) - 3], [228, 88, 92], "two canals", 232)
    + L([cD(0), CY], [228, 136, 140], "canine root,|H-shaped: two|roots fused", 232)
    + `<text class="vh-t vh-tag" x="322" y="18" text-anchor="end">LINGUAL</text><text class="vh-t vh-tag" x="322" y="293" text-anchor="end">LABIAL</text>`;
  return figureSvg({ width: W, height: H, className: "vh-svg vh-csvg",
    label: "A cut across the lateral incisor's root and the canine's H-shaped root with two canals. Floss stretched across the canine's mesial concavity misses its depth, where biofilm stays; an interdental brush's bristles spread into it.",
    body });
}

const D = {
  SUM: {
    before: "Before: a vertical (infrabony) defect beside a mandibular canine, between it and the lateral incisor, with a deep pocket. Its crest is fuzzy and ill-defined: activity, with resorption going on.",
    after: "After a DFDBA bone graft: the defect filled in, so the vertical defect became a horizontal one, with a shallow, maintainable pocket. That is the expectation: fill the defect, not grow bone back to 1.5 mm from the CEJ. A dense crest, sometimes called a crestal lamina dura, means less activity and stability.",
    floss: "Floss pulled against the H-shaped root bridges over the concavity and misses its depth, where the calculus was.",
    brush: "An interdental brush's bristles spread into the concavity, so this patient should use one daily rather than floss.",
  },
};

const panels = `<div class="vh-panels" data-film="before" data-clean="floss"><div class="vh-panel am-svg"><p class="vh-h">On the radiograph</p>${filmSvg()}</div><div class="vh-panel am-svg"><p class="vh-h">A cut across the roots, near the gum line</p>${cutSvg()}</div></div>`;
const plate = plateHtml({ fig: "S6 · Fig 4", title: "Vertical to horizontal", hint: "before / after · floss / brush", readout: "before · floss", body: panels });
const controls = `<div class="am-controls" role="group" aria-label="The film"><span class="vh-cl">Film</span><button type="button" class="am-btn" data-vhf="before" aria-pressed="true">Before</button><button type="button" class="am-btn" data-vhf="after" aria-pressed="false">After regeneration</button></div>
<div class="am-controls" role="group" aria-label="Cleaning the concavity"><span class="vh-cl">Home care</span><button type="button" class="am-btn" data-vhc="floss" aria-pressed="true">Floss</button><button type="button" class="am-btn" data-vhc="brush" aria-pressed="false">Interdental brush</button></div>
<p class="am-summary" aria-live="polite"><span data-vhs="f"></span> <span data-vhs="c"></span></p>
<p class="am-info">Tap the defect, the crest, the canine, the floss or the brush.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From Dr. Geurs' S6 lecture (the notes): the canine case, with two canals meaning two roots fused into an H-shaped root with a concavity, the streak of calculus in it, the DFDBA graft, the result (a vertical defect became a horizontal one, a shallow, maintainable pocket), the expectation (fill the defect, not bone back to 1.5 mm from the CEJ) and the interdental brush rather than floss. How the crest reads (fuzzy: activity and resorption; dense, a crestal lamina dura: less activity and stability) is what he said about Jeffrey's films in the same lecture; the canine's films weren't read that way in class, so it is drawn here as the general sign.</li>
<li>Outside sources: the teeth's crown and root lengths and cervical widths, and the mandibular canine's root (wide labiolingually, with proximal concavities, sometimes split into labial and lingual roots), follow Wheeler's Dental Anatomy, Physiology and Occlusion (Nelson, 11th ed.). The healthy crest as a thin radiopaque line continuous with the lamina dura, lost when the crest is active, follows White and Pharoah's Oral Radiology: Principles and Interpretation (Mallya and Lam, 8th ed.). Interdental brushes for concave root surfaces beside open embrasures, where floss cleans poorly, follow Newman and Carranza's Clinical Periodontology (13th ed.), its chapter on plaque control.</li>
<li>A schematic: a drawn radiograph, not the case's film, and the defect's depth and width, the bone level, the depth of the concavity and the gap between the roots are illustrative. The cut straightens the arch's curve and shows floss and brush in one plane. Educational, not medical advice.</li></ul></details>`;

function vhLive(root, D) {
  var box = root.querySelector(".vh-panels"), info = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]");
  var sf = root.querySelector('[data-vhs="f"]'), sc = root.querySelector('[data-vhs="c"]'), st = { f: "before", c: "floss" };
  function draw() {
    box.setAttribute("data-film", st.f); box.setAttribute("data-clean", st.c);
    sf.textContent = D.SUM[st.f]; sc.textContent = D.SUM[st.c];
    if (readout) readout.textContent = st.f + " · " + (st.c === "brush" ? "interdental brush" : "floss");
    root.querySelectorAll("[data-vhf]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-vhf") === st.f)); });
    root.querySelectorAll("[data-vhc]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-vhc") === st.c)); });
  }
  root.querySelectorAll("[data-vhf]").forEach(function (b) { b.addEventListener("click", function () { st.f = b.getAttribute("data-vhf"); draw(); }); });
  root.querySelectorAll("[data-vhc]").forEach(function (b) { b.addEventListener("click", function () { st.c = b.getAttribute("data-vhc"); draw(); }); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && box.contains(el)) info.textContent = el.getAttribute("data-info"); }
  box.addEventListener("pointerover", hot); box.addEventListener("click", hot);
  draw();
}

const CSS = `
.anima .vh-panels{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(320px,100%),1fr));gap:10px 18px;align-items:start}
.anima .vh-panel{width:100%;max-width:430px;margin:0 auto;min-width:0}
.anima .vh-h{margin:0 0 2px;text-align:center;font:600 .8rem var(--font-body);color:var(--ink-soft)}
.anima .vh-cl{font:.78rem var(--font-mono);color:var(--ink-soft);min-width:5.6em}
.anima .vh-s{transition:opacity .35s ease,visibility .35s}
.anima .vh-panels .vh-after,.anima .vh-panels .vh-brush{opacity:0;visibility:hidden}
.anima .vh-panels[data-film="after"] .vh-after,.anima .vh-panels[data-clean="brush"] .vh-brush{opacity:1;visibility:visible}
.anima .vh-panels[data-film="after"] .vh-before,.anima .vh-panels[data-clean="brush"] .vh-floss{opacity:0;visibility:hidden}
@media (prefers-reduced-motion: reduce){.anima .vh-s{transition:none}}
.anima .vh-svg .vh-t{fill:var(--anatomy-text);font:12px var(--anatomy-mono)}
.anima .vh-svg .vh-lab{fill:var(--anatomy-strong);font-weight:600}
.anima .vh-svg .vh-name,.anima .vh-svg .vh-tool{fill:var(--anatomy-strong);font-weight:700}
.anima .vh-svg .vh-small{fill:var(--anatomy-muted)}
.anima .vh-svg .vh-tag{font-size:11px;letter-spacing:.1em;fill:var(--anatomy-muted)}
.anima .vh-svg .vh-lead{fill:none;stroke:var(--anatomy-mid);stroke-width:.8}
.anima .vh-svg .vh-lin{fill:none;stroke:var(--vh-onfilm);stroke-width:.9;opacity:.85}
.anima .vh-svg .vh-dot{fill:var(--anatomy-strong);stroke:var(--surface);stroke-width:1}
.anima .vh-svg .vh-dotf{fill:var(--vh-onfilm);stroke:var(--pd-xray);stroke-width:1}
.anima .vh-svg .vh-ftag{fill:var(--vh-onfilm);font:700 12px var(--anatomy-mono);letter-spacing:.12em;opacity:.9}
.anima .vh-svg .vh-scale{fill:none;stroke:var(--anatomy-mid);stroke-width:1.2}
.anima .vh-fsvg path{stroke-linejoin:round}
.anima .vh-svg .vh-film{fill:var(--pd-xray)}
.anima .vh-svg .vh-frame{fill:none;stroke:var(--anatomy-lo);stroke-width:1.5}
.anima .vh-svg .vh-mat{fill:var(--surface)}
.anima .vh-svg .vh-bone{fill:var(--pd-xbone)}
.anima .vh-svg .vh-mar1,.anima .vh-svg .vh-mar2{fill:none;stroke:color-mix(in srgb, var(--pd-xray) 45%, var(--pd-xbone));stroke-linecap:round;stroke-width:2.4}
.anima .vh-svg .vh-mar2{stroke-width:3.6}
.anima .vh-svg .vh-ldl{fill:none;stroke:color-mix(in srgb, var(--pd-xti) 70%, var(--pd-xbone));stroke-width:5}
.anima .vh-svg .vh-crest{fill:none;stroke:color-mix(in srgb, var(--pd-xti) 55%, var(--pd-xbone));stroke-width:2}
.anima .vh-svg .vh-dense{fill:none;stroke:color-mix(in srgb, var(--pd-xti) 92%, var(--pd-xbone));stroke-width:3.6;stroke-linecap:round}
.anima .vh-svg .vh-fz1{fill:none;stroke:var(--pd-xray);stroke-width:13;opacity:.22}
.anima .vh-svg .vh-fz2{fill:none;stroke:var(--pd-xray);stroke-width:7.5;opacity:.3}
.anima .vh-svg .vh-fz3{fill:none;stroke:var(--pd-xray);stroke-width:3;opacity:.45}
.anima .vh-svg .vh-speck{fill:none;stroke:color-mix(in srgb, var(--pd-xray) 70%, var(--pd-xbone));stroke-width:2.6;stroke-linecap:round}
.anima .vh-svg .vh-tooth{fill:color-mix(in srgb, var(--pd-xti) 38%, var(--pd-xbone));stroke:color-mix(in srgb, var(--pd-xray) 80%, var(--pd-xbone));stroke-width:1.3}
.anima .vh-svg .vh-enam{fill:color-mix(in srgb, var(--pd-xti) 80%, var(--pd-xbone));fill-rule:evenodd}
.anima .vh-svg .vh-pulp{fill:color-mix(in srgb, var(--pd-xray) 68%, var(--pd-xbone))}
.anima .vh-svg .vh-acc{fill:color-mix(in srgb, var(--pd-xti) 85%, var(--pd-xbone))}
.anima .vh-svg .vh-gp{fill:var(--pd-xti)}
.anima .vh-svg .vh-cej{fill:none;stroke:var(--vh-cej);stroke-width:1.8;stroke-dasharray:5 3.5}
.anima .vh-svg .vh-ghost{fill:none;stroke:var(--pd-pus);stroke-width:1.8;stroke-dasharray:4 3}
.anima .vh-svg .vh-hit{fill:none;stroke:transparent;stroke-width:11}
.anima .vh-svg .vh-hitf{fill:transparent}
.anima .vh-svg .vh-lin,.anima .vh-svg .vh-lead,.anima .vh-svg .vh-dot,.anima .vh-svg .vh-dotf,.anima .vh-svg .vh-t,.anima .vh-svg .vh-ftag{pointer-events:none}
.anima .vh-svg .vh-hite{stroke-width:5}
.anima .vh-svg .vh-fz1,.anima .vh-svg .vh-fz2{pointer-events:none}
.anima .vh-svg .vh-dent{fill:var(--vh-dentin);stroke:var(--vh-line);stroke-width:1.4}
.anima .vh-svg .vh-pulp2{fill:color-mix(in srgb, var(--pd-red) 45%, var(--vh-dentin));stroke:var(--pd-red-line);stroke-width:.8}
.anima .vh-svg .vh-gp2{fill:var(--vh-gp);stroke:var(--vh-gp-line);stroke-width:1}
.anima .vh-svg .vh-bio,.anima .vh-svg .vh-biok{fill:none;stroke:var(--pd-bug);stroke-width:4.2;stroke-linecap:round}
.anima .vh-svg .vh-fl{fill:none;stroke:var(--vh-floss);stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.anima .vh-svg .vh-bri{fill:none;stroke:var(--vh-brush);stroke-width:1.1;stroke-linecap:round}
.anima .vh-svg .vh-wire{fill:none;stroke:var(--pd-ti-line);stroke-width:2.4;stroke-linecap:round}
.anima .vh-svg .vh-handle{fill:var(--pd-ti);stroke:var(--pd-ti-line);stroke-width:1}
.anima[data-anima="vtoh"]{--vh-dentin:#e6d4b3;--vh-line:#a8916a;--vh-gp:#e7906f;--vh-gp-line:#a8513a;--vh-floss:#2f6fc0;--vh-brush:#c97a14;--vh-onfilm:#e9eef2;--vh-cej:#8cc8ff}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]) .anima[data-anima="vtoh"]{--vh-dentin:#b9a27c;--vh-line:#e0cfa8;--vh-gp:#d27a5c;--vh-gp-line:#f2b49c;--vh-floss:#8fc1ff;--vh-brush:#f0a74a} }
:root[data-theme="dark"] .anima[data-anima="vtoh"]{--vh-dentin:#b9a27c;--vh-line:#e0cfa8;--vh-gp:#d27a5c;--vh-gp-line:#f2b49c;--vh-floss:#8fc1ff;--vh-brush:#f0a74a}
`;

export function vtoh() {
  return { id: "vtoh", lec: "periodontal-regeneration", title: "Vertical to horizontal",
    caption: "Dr. Geurs' canine case: the vertical defect filled to a horizontal one (not bone back to the CEJ), how the crest reads on the film, and why its H-shaped root takes an interdental brush, not floss.",
    html: `<div class="anima" data-anima="vtoh">${plate}${controls}${SOURCES}</div>`, css: CSS, live: vhLive.toString(), helpers: [], data: D };
}
