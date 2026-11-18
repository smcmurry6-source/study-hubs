// Fig: counting the walls (Periodontology S6, Dr. Geurs's Nov 18 class, his slides and the exam-review guide).
// One intrabony defect against the mesial root surface of a tooth, between it and its neighbor, drawn as an oblique
// block of alveolar bone seen from the buccal (x mesiodistal, y buccolingual with buccal at -y, z up, in mm; the
// original crest at z = 0, the CEJ at +2). Settings, as the notes give them:
//   3-wall: buccal, lingual and proximal bony walls, the root surface as the fourth side (the most contained);
//   2-wall: the buccal wall lost (the opening case's kind), lingual and proximal left;
//   1-wall: only the proximal wall, against the neighboring tooth (between two teeth, a hemiseptum);
//   the opening case: about 3 mm of 3-wall defect at the base, about 4-6 mm of 2-wall defect with no facial wall, and a
//     1-wall part coronal to the lingual wall;
//   horizontal bone loss: a lower, flat crest, "no defect to fill".
// Beside it, the film the same bone gives: a buccolingual beam crosses every wall at once, so the drawn film is the bone
// summed along y. Walls that remain lie over the defect and hide it; the notes' rule is that bone loss obvious to the eye
// means more than 50% of the mineral is lost, which for most defects means the buccal or lingual wall is gone.
// The bone is a heightfield drawn in y-slabs from lingual to buccal (painter's order is exact: the planes between slabs
// separate them), each slab's faces from distal to mesial. Proportions are schematic: the septum is drawn wider than
// life so a wide defect fits, and how much of the beam's bone each setting removes is illustrative.
import { figureSvg, plateHtml } from "./shared.mjs";

const RAD = Math.PI / 180, PHI = -18 * RAD, ELE = 50 * RAD;
const G = { X0: -10.2, X1: 8.4, Y0: -5, Y1: 5, ZB: -10.5, CEJ: 2, CR: 5.4, YP: 2.2, WF: 0.7,
  N: { x0: -9.3, x1: -4.7, hy: 3.5, r: 1.3 }, T: { x0: 2.8, x1: 7.2, hy: 4, r: 1.3 } };

/* the state's numbers: crest, floor, the buccal and lingual walls' tops (-99: lost), the proximal wall's slope */
export function wlPar(D, st) {
  var G = D.G, k = st.k, P = { k: k, def: k !== "h", zc: k === "h" ? -4 : 0 };
  P.zf = k === "c" ? -9.5 : -6;
  P.hb = k === "3" ? 0 : (k === "c" ? P.zf + 3 : -99);
  P.hl = k === "3" || k === "2" ? 0 : (k === "c" ? P.zf + 8 : -99);
  P.ta = Math.tan((st.wide && k !== "c" ? 40 : 20) * Math.PI / 180);
  P.x0f = G.T.x0 - G.WF;
  return P;
}
/* where the proximal wall's face is at height z */
export function wlXw(P, z) { return P.x0f - (z - P.zf) * P.ta; }
/* a root's mesiodistal extent at y (rounded corners), or null */
export function wlRx(R, y) {
  var a = Math.abs(y); if (a >= R.hy) return null;
  var e = a - (R.hy - R.r); if (e <= 0) return [R.x0, R.x1];
  var dx = R.r - Math.sqrt(Math.max(0, R.r * R.r - e * e)); return [R.x0 + dx, R.x1 - dx];
}
/* the bone and roots along x at one y: [x0, x1, h0, h1, kind]; b bone, r root, p proximal wall's crest, q its face,
   wb / wl the buccal / lingual wall's top, f the floor */
export function wlProf(D, st, P, y) {
  var G = D.G, s = [], nx = wlRx(G.N, y), tx = wlRx(G.T, y), x = G.X0, zc = P.zc;
  function add(a, b, ha, hb, k) { if (b - a > 1e-6) s.push([a, b, ha, hb, k]); }
  if (nx) { add(x, nx[0], zc, zc, "b"); add(nx[0], nx[1], G.CEJ, G.CEJ, "r"); x = nx[1]; }
  var xr = tx ? tx[0] : G.T.x0;
  if (P.def) {
    var wh = y < -G.YP ? P.hb : (y > G.YP ? P.hl : -99), xt = wlXw(P, zc);
    if (wh >= zc) { add(x, xt, zc, zc, "b"); add(xt, xr, zc, zc, y < 0 ? "wb" : "wl"); }
    else {
      var top = Math.max(wh, P.zf), xb = wlXw(P, top);
      var xp = Math.max(x, xt - 1.3);
      add(x, xp, zc, zc, "b"); add(xp, xt, zc, zc, "p"); add(xt, xb, zc, top, "q");
      add(xb, xr, top, top, top > P.zf ? (y < 0 ? "wb" : "wl") : "f");
    }
  } else add(x, xr, zc, zc, "b");
  if (tx) { add(tx[0], tx[1], G.CEJ, G.CEJ, "r"); add(tx[1], G.X1, zc, zc, "b"); } else add(xr, G.X1, zc, zc, "b");
  return s;
}
export function wlPt(D, x, y, z) { var C = D.C; return [C.ox + C.k * (x * C.c + y * C.s), C.oy + C.k * ((x * C.s - y * C.c) * C.se - z * C.ce)]; }
export function wlPoly(D, pts) { var o = ""; for (var i = 0; i < pts.length; i++) { var p = wlPt(D, pts[i][0], pts[i][1], pts[i][2]); o += (i ? "L" : "M") + Math.round(p[0] * 10) / 10 + " " + Math.round(p[1] * 10) / 10; } return o + "Z"; }
/* the drawing: slabs from lingual to buccal, then the crowns, the tinted faces on the buccal surface, the lost walls */
export function wl3d(D, st) {
  var G = D.G, P = wlPar(D, st), C = D.C, out = [], cur = null;
  function put(cls, hot, d) { if (cur && cur.c === cls && cur.h === hot) cur.d += d; else { cur = { c: cls, h: hot, d: d }; out.push(cur); } }
  var HOT = { b: "bone", r: "root", p: "wp", q: "wp", wb: "wb", wl: "wl", f: "floor" };
  var TOP = { b: "wl-b0", r: "wl-r0", p: "wl-w0", q: "wl-w1", wb: "wl-w0", wl: "wl-w0", f: "wl-fl" };
  var ys = [G.Y0, G.Y1, -G.YP, G.YP];
  [G.N, G.T].forEach(function (R) { for (var i = 0; i <= 4; i++) { var e = R.hy - R.r + R.r * i / 4; ys.push(e, -e); } });
  ys = ys.filter(function (v, i, a) { return v >= G.Y0 && v <= G.Y1 && a.indexOf(v) === i; }).sort(function (a, b) { return b - a; });
  var rampOk = C.s * C.ce + P.ta * C.se > 0;
  for (var j = 0; j < ys.length - 1; j++) {
    var y1 = ys[j], y0 = ys[j + 1];
    if (y1 - y0 < 1e-6) continue;
    var s = wlProf(D, st, P, (y0 + y1) / 2);
    for (var i = s.length - 1; i >= 0; i--) {
      var g = s[i], k = g[4], hot = st.k === "h" && k === "b" ? "crest" : HOT[k];
      if (k !== "q" || rampOk) put(TOP[k], hot, wlPoly(D, [[g[0], y0, g[2]], [g[1], y0, g[3]], [g[1], y1, g[3]], [g[0], y1, g[2]]]));
      var hl = i ? s[i - 1][3] : G.ZB;
      if (g[2] > hl + 1e-6) put(k === "r" ? "wl-r2" : (k === "b" || i === 0 ? "wl-b2" : "wl-w2"), k === "r" ? "root" : hot, wlPoly(D, [[g[0], y0, hl], [g[0], y0, g[2]], [g[0], y1, g[2]], [g[0], y1, hl]]));
    }
    for (i = 0; i < s.length; i++) {
      g = s[i]; k = g[4];
      var wall = k === "wl" && Math.abs(y0 - G.YP) < 1e-6;
      put(k === "r" ? "wl-r1" : (wall ? "wl-w1" : "wl-b1"), k === "r" ? "root" : (wall ? "wl" : (st.k === "h" ? "crest" : "bone")), wlPoly(D, [[g[0], y0, G.ZB], [g[1], y0, G.ZB], [g[1], y0, g[3]], [g[0], y0, g[2]]]));
    }
  }
  var yb = G.Y0, xr = G.T.x0;
  var o = "";
  out.forEach(function (c) { var p = '<path class="' + c.c + '" d="' + c.d + '"/>'; o += c.h ? '<g class="hot" data-info="' + D.HOT[c.h] + '">' + p + "</g>" : p; });
  /* the crowns: the root's outline at the CEJ, out to the height of contour, in to the occlusal table */
  [G.N, G.T].forEach(function (R, n) {
    function ring(z, e) { var pts = [], cx = (R.x0 + R.x1) / 2, hx = (R.x1 - R.x0) / 2 + e, hy = R.hy + e, r = R.r + e; for (var q = 0; q < 4; q++) for (var t = 0; t <= 6; t++) { var a = (q * 90 + t * 15) * Math.PI / 180, sx = q === 0 || q === 3 ? 1 : -1, sy = q < 2 ? 1 : -1; pts.push([cx + sx * (hx - r) + r * Math.cos(a), sy * (hy - r) + r * Math.sin(a), z]); } return pts; }
    var all = ring(G.CEJ, 0).concat(ring(G.CEJ + 1.7, .55), ring(G.CR, .15)).map(function (p) { return wlPt(D, p[0], p[1], p[2]); });
    all.sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
    function cr(o2, a, b) { return (a[0] - o2[0]) * (b[1] - o2[1]) - (a[1] - o2[1]) * (b[0] - o2[0]); }
    var lo = [], up = [];
    all.forEach(function (p) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); });
    for (var q = all.length - 1; q >= 0; q--) { var p = all[q]; while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    var hull = lo.slice(0, -1).concat(up.slice(0, -1)), d = "";
    hull.forEach(function (p, i) { d += (i ? "L" : "M") + Math.round(p[0] * 10) / 10 + " " + Math.round(p[1] * 10) / 10; });
    o += '<g class="hot" data-info="' + D.HOT[n ? "tooth" : "nbr"] + '"><path class="wl-c1" d="' + d + 'Z"/><path class="wl-c0" d="' + wlPoly(D, ring(G.CR, .15)) + '"/></g>';
  });
  /* the walls that were lost, as dashed ghosts */
  if (P.def && P.hb < P.zc) { var b0 = Math.max(P.hb, P.zf); o += '<path class="wl-ghost" d="' + wlPoly(D, [[wlXw(P, b0), yb, b0], [xr, yb, b0], [xr, yb, P.zc], [wlXw(P, P.zc), yb, P.zc]]) + wlPoly(D, [[wlXw(P, P.zc), yb, P.zc], [xr, yb, P.zc], [xr, -G.YP, P.zc], [wlXw(P, P.zc), -G.YP, P.zc]]) + '"/>'; }
  if (P.def && P.hl < P.zc) { var l0 = Math.max(P.hl, P.zf); o += '<path class="wl-ghost" d="' + wlPoly(D, [[wlXw(P, P.zc), G.YP, P.zc], [xr, G.YP, P.zc], [xr, G.Y1, P.zc], [wlXw(P, P.zc), G.Y1, P.zc]]) + wlPoly(D, [[wlXw(P, l0), G.YP, l0], [xr, G.YP, l0], [xr, G.YP, P.zc], [wlXw(P, P.zc), G.YP, P.zc]]) + '"/>'; }
  return o + wlLabels(D, st, P);
}
/* labels: a dot on each part, leaders out to a column on each side, sorted so no leaders cross */
export function wlLabels(D, st, P) {
  var G = D.G, L = [], R = [], T = D.TXT, xr = G.T.x0, zc = P.zc, xt = wlXw(P, zc);
  function at(x, y, z) { return wlPt(D, x, y, z); }
  if (!P.def) {
    L.push([T.crest, at(-1, -1, zc)]);
    R.push([T.rootx, at(xr + .3, -4.05, (zc + G.CEJ) / 2)]);
  } else {
    L.push([T.wp, at((G.N.x1 + xt) / 2, st.k === "3" ? 0 : -1, zc)]);
    R.push([T.root, at(xr, 1.2, Math.max(P.zf + 1.5, -2.2))]);
    if (P.hl > P.zf) R.push([P.hl < zc ? T.wlc : T.wl, at((wlXw(P, P.hl) + xr) / 2, (G.YP + G.Y1) / 2, P.hl)]);
    else R.push([T.wlx, at((xt + xr) / 2, (G.YP + G.Y1) / 2, zc)]);
    if (P.hb > P.zf) { var zm = (P.zf + P.hb) / 2; L.push([P.hb < zc ? T.wbc : T.wb, at((wlXw(P, zm) + xr) / 2, G.Y0, zm)]); }
    if (P.hb < zc) { var zg = (Math.max(P.hb, P.zf) + zc) / 2; L.push([T.wbx, at((wlXw(P, zg) + xr) / 2, G.Y0, zg)]); }
  }
  var o = "";
  [[L, D.LX, "end"], [R, D.RX, "start"]].forEach(function (c) {
    var list = c[0].sort(function (a, b) { return a[1][1] - b[1][1]; }), n = list.length, y0 = D.LY0, gap = D.LGAP;
    list.forEach(function (l, i) {
      var lines = l[0].split("|"), ty = Math.max(y0 + i * gap, Math.min(l[1][1], D.LY1 - (n - 1 - i) * gap)), ex = c[1] + (c[2] === "end" ? 5 : -5);
      y0 = ty + gap * .1; if (i < n - 1) y0 = Math.max(y0, ty);
      o += '<path class="wl-lead" d="M' + Math.round(l[1][0] * 10) / 10 + " " + Math.round(l[1][1] * 10) / 10 + "L" + ex + " " + Math.round(ty - 4) + '"/><circle class="wl-dot" cx="' + Math.round(l[1][0] * 10) / 10 + '" cy="' + Math.round(l[1][1] * 10) / 10 + '" r="2.3"/>';
      o += '<text class="wl-t wl-lab" x="' + c[1] + '" y="' + Math.round(ty) + '" text-anchor="' + c[2] + '">' + lines.map(function (t, q) { return '<tspan x="' + c[1] + '" dy="' + (q ? "1.15em" : "0") + '">' + t + "</tspan>"; }).join("") + "</text>";
    });
  });
  return o;
}
/* the radiograph: the same bone summed along the buccolingual beam */
export function wlFilm(D, st) {
  var G = D.G, P = wlPar(D, st), F = D.F, o = "";
  function X(x) { return Math.round((F.ox + x * F.k) * 10) / 10; }
  function Y(z) { return Math.round((F.oy - z * F.k) * 10) / 10; }
  function poly(pts) { return pts.map(function (p, i) { return (i ? "L" : "M") + X(p[0]) + " " + Y(p[1]); }).join("") + "Z"; }
  var zb = (F.oy - F.y1) / F.k, xa = (F.x0 - F.ox) / F.k, xb = (F.x1 - F.ox) / F.k;
  o += '<rect class="wl-f-air" x="' + F.x0 + '" y="' + F.y0 + '" width="' + (F.x1 - F.x0) + '" height="' + (F.y1 - F.y0) + '"/>';
  o += '<g class="hot" data-info="' + D.HOT.film + '"><path class="wl-f-bone" d="' + poly([[xa, zb], [xb, zb], [xb, P.zc], [xa, P.zc]]) + '"/>';
  var bands = wlBands(P);
  bands.forEach(function (b) { if (b[0] < b[1]) o += '<path class="wl-f-l' + b[2] + '" d="' + poly([[wlXw(P, b[0]), b[0]], [G.T.x0, b[0]], [G.T.x0, b[1]], [wlXw(P, b[1]), b[1]]]) + '"/>'; });
  o += "</g>";
  /* the teeth: root, pulp, crown; the lamina dura beside each root, missing where the defect is */
  [G.N, G.T].forEach(function (R, n) {
    var cx = (R.x0 + R.x1) / 2, w = R.x1 - R.x0;
    o += '<path class="wl-f-ld" d="M' + X(R.x0 - .3) + " " + Y(zb) + "V" + Y(P.zc) + "M" + X(R.x1 + .3) + " " + Y(zb) + "V" + Y(n && P.def ? P.zf : P.zc) + '"/>';
    o += '<path class="wl-f-root" d="' + poly([[R.x0, zb], [R.x1, zb], [R.x1, G.CEJ], [R.x0, G.CEJ]]) + '"/>';
    o += '<path class="wl-f-crown" d="' + poly([[R.x0, G.CEJ], [R.x1, G.CEJ], [R.x1 + .55, G.CEJ + 1.7], [R.x1 + .15, G.CR], [R.x0 - .15, G.CR], [R.x0 - .55, G.CEJ + 1.7]]) + '"/>';
    o += '<path class="wl-f-pulp" d="' + poly([[cx - .45, zb], [cx + .45, zb], [cx + .6, G.CEJ + .6], [cx + w * .22, G.CEJ + 1.9], [cx - w * .22, G.CEJ + 1.9], [cx - .6, G.CEJ + .6]]) + '"/>';
  });
  /* the defect angle: between the root surface and the defect's bony wall, as it's measured on the film */
  if (P.def && st.k !== "c") {
    var zv = P.zf - G.WF / P.ta, r = 3.2, a = Math.atan(P.ta);
    o += '<path class="wl-f-ang" d="M' + X(G.T.x0) + " " + Y(zv) + "V" + Y(P.zc + .8) + "M" + X(G.T.x0) + " " + Y(zv) + "L" + X(wlXw(P, P.zc + .8)) + " " + Y(P.zc + .8) + '"/>';
    o += '<path class="wl-f-arc" d="M' + X(G.T.x0) + " " + Y(zv + r) + "A" + r * F.k + " " + r * F.k + " 0 0 0 " + X(G.T.x0 - r * Math.sin(a)) + " " + Y(zv + r * Math.cos(a)) + '"/>';
    o += '<text class="wl-t wl-ft" x="' + X(G.T.x0 - r * Math.sin(a) - .4) + '" y="' + Y(zv + r * .45) + '" text-anchor="end">' + (st.wide ? D.TXT.wide : D.TXT.narrow) + "</text>";
  }
  /* the film's rounded corners, masked */
  o += '<path class="wl-f-mask" fill-rule="evenodd" d="M0 0H' + D.FW + "V" + D.FH + "H0Z" + "M" + (F.x0 + 9) + " " + F.y0 + "H" + (F.x1 - 9) + "Q" + F.x1 + " " + F.y0 + " " + F.x1 + " " + (F.y0 + 9) + "V" + (F.y1 - 9) + "Q" + F.x1 + " " + F.y1 + " " + (F.x1 - 9) + " " + F.y1 + "H" + (F.x0 + 9) + "Q" + F.x0 + " " + F.y1 + " " + F.x0 + " " + (F.y1 - 9) + "V" + (F.y0 + 9) + "Q" + F.x0 + " " + F.y0 + " " + (F.x0 + 9) + " " + F.y0 + 'Z"/>';
  o += '<rect class="wl-f-edge" x="' + F.x0 + '" y="' + F.y0 + '" width="' + (F.x1 - F.x0) + '" height="' + (F.y1 - F.y0) + '" rx="9"/>';
  return o;
}
/* the defect's parts from the floor up: [from, to, level], level 1 = 3-wall (buccal and lingual walls in the beam),
   2 = one of them lost, 3 = both lost */
export function wlBands(P) {
  if (!P.def) return [];
  var cut = [P.zf, P.zc], o = [];
  if (P.hb > P.zf && P.hb < P.zc) cut.push(P.hb);
  if (P.hl > P.zf && P.hl < P.zc) cut.push(P.hl);
  cut.sort(function (a, b) { return a - b; });
  for (var i = 0; i < cut.length - 1; i++) { var m = (cut[i] + cut[i + 1]) / 2; o.push([cut[i], cut[i + 1], 1 + (P.hb > m ? 0 : 1) + (P.hl > m ? 0 : 1)]); }
  return o;
}

const S = 15;
const C = { c: Math.cos(PHI), s: Math.sin(PHI), se: Math.sin(ELE), ce: Math.cos(ELE), k: S, ox: 0, oy: 0 };
/* fit the block and crowns into the drawing, leaving the label columns */
(() => {
  const D0 = { C };
  const pts = [];
  for (const x of [G.X0, G.X1]) for (const y of [G.Y0, G.Y1]) for (const z of [G.ZB, 0]) pts.push(wlPt(D0, x, y, z));
  for (const R of [G.N, G.T]) for (const x of [R.x0 - .6, R.x1 + .6]) for (const y of [-R.hy - .6, R.hy + .6]) pts.push(wlPt(D0, x, y, G.CR));
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  C.ox = 200 - (Math.min(...xs) + Math.max(...xs)) / 2; C.oy = 12 - Math.min(...ys);
  C.H = Math.round(Math.max(...ys) - Math.min(...ys) + 24);
})();
const W3 = 400, H3 = C.H;
const FW = 220, FH = 196;
const F = { x0: 6, y0: 6, x1: 214, y1: 190, k: 9.5 };
F.ox = 6 + 11.6 * F.k; F.oy = 6 + 6.9 * F.k;

const D = {
  G, C, F, FW, FH, LX: 92, RX: 308, LY0: 24, LY1: H3 - 14, LGAP: 30,
  TXT: {
    wb: "buccal|wall", wbc: "buccal wall,|base only", wbx: "buccal wall,|lost",
    wl: "lingual|wall", wlc: "lingual wall,|to here", wlx: "lingual wall,|lost",
    wp: "proximal|wall", root: "root|surface", crest: "crest, lower|and flat", rootx: "root,|exposed",
    narrow: "25° or less", wide: "wider",
  },
  LAB: { "3": "3-wall", "2": "2-wall", "1": "1-wall", c: "opening case", h: "horizontal" },
  STAT: {
    "3": ["3: buccal, lingual, proximal", "a faint shadow", "the most amenable"],
    "2": ["2: lingual, proximal", "an obvious defect", "less predictable"],
    "1": ["1: proximal (a hemiseptum)", "an obvious defect", "the least predictable"],
    c: ["3, then 2, then 1", "obvious, faint at the base", "each part heals by its walls"],
    h: ["none: no defect", "a lower, flat crest", "not a regeneration case"],
  },
  SUM: {
    "3": "3-wall: bone on the buccal, the lingual and the proximal side (against the neighboring tooth), with the root surface as the fourth side. It is the most contained defect: what you put in it stays there, and there is the most bony surface to heal from, so it is potentially the most amenable to regeneration. On the film the buccal and lingual walls lie over the defect, so it shows only as a faint shadow. A site that probes deep (an 8 mm pocket, say) with only a faint shadow is the better candidate.",
    "2": "2-wall: the buccal wall is gone, as in the opening case, leaving the lingual and the proximal wall. Less contained, so less predictable. With a wall gone, more than half the mineral in the beam's path is lost and the defect is obvious on the film: by the time you see it on a radiograph, it likely is not a 3-wall defect.",
    "1": "1-wall: only the proximal wall is left; between two teeth that is a hemiseptum. A predominantly 1-wall defect is non-supportive anatomy, a risk factor for failure: nothing holds up the graft, the clot or the flap, so the decision tree sends it to combination therapy or a cellular bone allograft. On the film it is the most obvious of all.",
    c: "The opening case, once debrided: about 3 mm of 3-wall defect at the base (bone on the facial and lingual there), about 4 to 6 mm of 2-wall defect above it with no facial wall, and a 1-wall part coronal to the lingual wall. Almost every defect is a combination, and each part contributes to how it can heal. On the film the 3-wall base is the faintest part, and the walls are confirmed at surgery.",
    h: "Horizontal bone loss: the crest is lower but flat, with no walls around a defect. \"There's just no defect to fill,\" so it isn't amenable to regeneration. On the film the crest is simply lower all the way across.",
  },
  ANG: [" Narrow: a steep wall, close to the root. Defects deeper than 3 mm with a radiographic angle of 25 degrees or less were the most amenable to GTR; a narrow defect fills more completely but is harder to instrument.",
    " Wide: the wall slopes away from the root, so the defect has farther to fill; deeper, narrower defects with more walls gained more CAL and bone (Nibali, 2021)."],
  PART: { 1: "3-wall part", 2: "2-wall part", 3: "1-wall part" },
  HOT: {
    wb: "The buccal wall: bone on the cheek side of the defect (the facial). On a film it lies over the defect, along with the lingual wall, and hides it.",
    wl: "The lingual wall: bone on the tongue side of the defect. In the beam's path with the buccal wall, it hides the defect on a film.",
    wp: "The proximal wall: the bone against the neighboring tooth. On its own, between two teeth, it is a hemiseptum, a 1-wall defect.",
    root: "The root surface is the defect's fourth side, not a bony wall: it has to be clean, and it contributes no cells, so only the bony walls are counted.",
    floor: "The base of the defect, after the granulomatous tissue is removed and the bony walls are exposed.",
    bone: "Alveolar bone around the two roots.",
    crest: "Horizontal bone loss: the crest is lower but flat, so there are no walls to hold a graft or a clot.",
    tooth: "The tooth with the defect: the defect lies against its root.",
    nbr: "The neighboring tooth: the proximal wall is the bone against its root.",
    film: "The film looks through the bone from buccal to lingual, so every wall is summed into one picture: what shows is how much bone the beam crosses. It shows the defect's depth and angle, never which walls remain.",
  },
};

const st0 = { k: "3", wide: false };
const svg3 = figureSvg({ width: W3, height: H3, className: "wl-svg", label: "An intrabony defect against a root, drawn as a block of bone seen from the buccal, with the remaining bony walls tinted and labeled and any lost wall shown dashed.", body: '<g class="wl-dyn"></g>' });
const svgF = figureSvg({ width: FW, height: FH, className: "wl-fsvg", label: "The periapical radiograph the same defect gives, with the defect angle marked.", body: '<g class="wl-fdyn"></g>' });
const plate = plateHtml({ fig: "S6 · Fig 2", title: "Counting the walls", hint: "pick a defect · tap a wall", readout: "3-wall · narrow",
  body: `<div class="wl-row"><div class="am-svg wl-box">${svg3}</div><div class="wl-fbox"><p class="wl-cap">The radiograph</p><div class="am-svg">${svgF}</div><div class="wl-meter" aria-hidden="true"></div></div></div>` });
const controls = `<div class="am-controls" role="group" aria-label="Defect"><button type="button" class="am-btn" data-wlk="3" aria-pressed="true">3-wall</button><button type="button" class="am-btn" data-wlk="2" aria-pressed="false">2-wall</button><button type="button" class="am-btn" data-wlk="1" aria-pressed="false">1-wall</button><button type="button" class="am-btn" data-wlk="c" aria-pressed="false">The opening case</button><button type="button" class="am-btn" data-wlk="h" aria-pressed="false">Horizontal bone loss</button></div>
<div class="am-controls" role="group" aria-label="Defect angle"><button type="button" class="am-btn" data-wla="0" aria-pressed="true">Narrow: 25° or less</button><button type="button" class="am-btn" data-wla="1" aria-pressed="false">Wide</button></div>
<div class="am-stats"><span>Bony walls <b data-wl="0"></b></span><span>On the film <b data-wl="1"></b></span><span>Regeneration <b data-wl="2"></b></span></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Tap a wall, the root surface or the film.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From Dr. Geurs's class, his slides and the exam-review guide: defects classified by walls, width and depth (Reynolds, 2015); the opening case's about 3 mm of 3-wall, 4 to 6 mm of 2-wall and a 1-wall part; a 1-wall defect between two teeth as a hemiseptum; more than 50% of the mineral lost before bone loss is obvious on a film, which usually means the buccal or lingual wall is gone; depth over 3 mm and an angle of 25 degrees or less; and that the walls are confirmed at surgery.</li>
<li>Outside sources: counting a defect by its remaining bony walls, with the root surface as one side and most defects a combination, follows Goldman and Cohen (J Periodontol, 1958); how intrabony defects and their depth and angle are read from radiographs, and why a film can't show the wall configuration, follow Papapanou and Tonetti (Periodontol 2000, 2000); the defect angle as the angle between the root surface and the defect's bony wall on the film follows Steffensen and Weber (J Periodontol, 1989). That a loss inside bone shows on a film only when the cortical bone in the beam's path is involved follows Bender and Seltzer (J Am Dent Assoc, 1961), who studied lesions in jaw bone generally.</li>
<li>A schematic: the septum is drawn wider than life so a wide defect fits, the walls are tinted so they can be counted, the roots are simple shapes, and the drawn film is the same bone summed from buccal to lingual. How much of the beam's bone each setting removes, the drawn depths (the opening case's follow the notes) and the drawn angles (20 and 40 degrees) are illustrative. The 2-wall setting is the opening case's kind, without the buccal wall. Educational, not medical advice.</li></ul></details>`;

function wlLive(root, D) {
  var svg = root.querySelector(".wl-svg"), dyn = svg.querySelector(".wl-dyn"), fsvg = root.querySelector(".wl-fsvg"), fdyn = fsvg.querySelector(".wl-fdyn");
  var sum = root.querySelector(".am-summary"), info = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]"), meter = root.querySelector(".wl-meter");
  var st = { k: "3", wide: false };
  function draw() {
    dyn.innerHTML = D.wl3d(D, st); fdyn.innerHTML = D.wlFilm(D, st);
    var ang = st.k !== "c" && st.k !== "h";
    sum.textContent = D.SUM[st.k] + (ang ? D.ANG[st.wide ? 1 : 0] : "");
    if (readout) readout.textContent = D.LAB[st.k] + (ang ? " · " + (st.wide ? "wide" : "narrow") : "");
    for (var i = 0; i < 3; i++) { var b = root.querySelector('[data-wl="' + i + '"]'); if (b) b.textContent = D.STAT[st.k][i]; }
    var P = D.wlPar(D, st), bands = D.wlBands(P).slice().reverse(), m = "";
    if (bands.length) {
      m = '<p class="wl-mh">Bone lost along the beam</p>';
      bands.forEach(function (b) { var lv = b[2], pc = lv === 1 ? 44 : (lv === 2 ? 72 : 100); m += '<div class="wl-mr"><span class="wl-ml">' + (bands.length > 1 ? D.PART[lv] : "the defect") + '</span><span class="wl-mt"><span class="wl-mf wl-mf' + lv + '" style="width:' + pc + '%"></span><span class="wl-m50"></span></span><span class="wl-mv">' + (lv === 1 ? "faint" : "obvious") + "</span></div>"; });
      m += '<p class="wl-mk"><span class="wl-m50k"></span>50%: obvious to the eye</p>';
    } else m = '<p class="wl-mh">No defect: the crest is just lower</p>';
    meter.innerHTML = m;
    root.querySelectorAll("[data-wlk]").forEach(function (x) { x.setAttribute("aria-pressed", String(x.getAttribute("data-wlk") === st.k)); });
    root.querySelectorAll("[data-wla]").forEach(function (x) { x.setAttribute("aria-pressed", String((x.getAttribute("data-wla") === "1") === st.wide)); x.disabled = !ang; });
  }
  root.querySelectorAll("[data-wlk]").forEach(function (x) { x.addEventListener("click", function () { st.k = x.getAttribute("data-wlk"); draw(); }); });
  root.querySelectorAll("[data-wla]").forEach(function (x) { x.addEventListener("click", function () { st.wide = x.getAttribute("data-wla") === "1"; draw(); }); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (!el || !root.contains(el)) return; info.textContent = el.getAttribute("data-info"); }
  svg.addEventListener("pointerover", hot); svg.addEventListener("click", hot); fsvg.addEventListener("pointerover", hot); fsvg.addEventListener("click", hot);
  draw();
}

const CSS = `
.anima .wl-row{display:flex;flex-wrap:wrap;gap:12px 16px;align-items:center;justify-content:center}
.anima .wl-box{flex:1 1 340px;min-width:0;max-width:470px}
.anima .wl-fbox{flex:0 1 230px;min-width:0;max-width:250px}
.anima .wl-cap{margin:0 0 4px;font:600 .78rem var(--anatomy-mono);color:var(--anatomy-muted);text-align:center}
.anima .wl-svg .wl-t{fill:var(--anatomy-text);font:12px var(--anatomy-mono)}
.anima .wl-svg .wl-lab{fill:var(--anatomy-strong);font-weight:600}
.anima .wl-svg .wl-lead{fill:none;stroke:var(--anatomy-mid);stroke-width:.8}
.anima .wl-svg .wl-dot{fill:var(--anatomy-strong);stroke:var(--surface);stroke-width:1}
.anima .wl-svg path{stroke-linejoin:round}
.anima .wl-svg .wl-b0{fill:var(--wl-b0);stroke:var(--wl-b0);stroke-width:.5}
.anima .wl-svg .wl-b1{fill:var(--wl-b1);stroke:var(--wl-b1);stroke-width:.5}
.anima .wl-svg .wl-b2{fill:var(--wl-b2);stroke:var(--wl-b2);stroke-width:.5}
.anima .wl-svg .wl-fl{fill:var(--wl-fl);stroke:var(--wl-fl);stroke-width:.5}
.anima .wl-svg .wl-w0{fill:var(--wl-w0);stroke:var(--wl-w0);stroke-width:.5}
.anima .wl-svg .wl-w1{fill:var(--wl-w1);stroke:var(--wl-w1);stroke-width:.5}
.anima .wl-svg .wl-w2{fill:var(--wl-w2);stroke:var(--wl-w2);stroke-width:.5}
.anima .wl-svg .wl-r0{fill:var(--wl-r0);stroke:var(--wl-r0);stroke-width:.5}
.anima .wl-svg .wl-r1{fill:var(--wl-r1);stroke:var(--wl-r1);stroke-width:.5}
.anima .wl-svg .wl-r2{fill:var(--wl-r2);stroke:var(--wl-r2);stroke-width:.5}
.anima .wl-svg .wl-c1{fill:var(--wl-c1);stroke:var(--wl-line);stroke-width:1}
.anima .wl-svg .wl-c0{fill:var(--wl-c0);stroke:var(--wl-line);stroke-width:.8}
.anima .wl-svg .wl-ghost{fill:color-mix(in srgb, var(--wl-w0) 18%, transparent);stroke:var(--anatomy-strong);stroke-width:1.1;stroke-dasharray:3.5 3}
.anima .wl-fsvg .wl-f-air{fill:var(--pd-xray)}
.anima .wl-fsvg .wl-f-bone{fill:var(--pd-xbone)}
.anima .wl-fsvg .wl-f-l1{fill:color-mix(in srgb, var(--pd-xray) 24%, var(--pd-xbone))}
.anima .wl-fsvg .wl-f-l2{fill:color-mix(in srgb, var(--pd-xray) 62%, var(--pd-xbone))}
.anima .wl-fsvg .wl-f-l3{fill:var(--pd-xray)}
.anima .wl-fsvg .wl-f-root{fill:color-mix(in srgb, var(--pd-xti) 45%, var(--pd-xbone))}
.anima .wl-fsvg .wl-f-crown{fill:color-mix(in srgb, var(--pd-xti) 85%, var(--pd-xbone))}
.anima .wl-fsvg .wl-f-pulp{fill:color-mix(in srgb, var(--pd-xray) 65%, var(--pd-xbone))}
.anima .wl-fsvg .wl-f-ld{fill:none;stroke:color-mix(in srgb, var(--pd-xti) 60%, var(--pd-xbone));stroke-width:1.6}
.anima .wl-fsvg .wl-f-ang{fill:none;stroke:var(--wl-ang);stroke-width:1.2;stroke-dasharray:4 2.5}
.anima .wl-fsvg .wl-f-arc{fill:none;stroke:var(--wl-ang);stroke-width:1.6}
.anima .wl-fsvg .wl-ft{fill:var(--wl-ang);font:600 12px var(--anatomy-mono);paint-order:stroke;stroke:var(--pd-xray);stroke-width:3px}
.anima .wl-fsvg .wl-f-mask{fill:var(--surface)}
.anima .wl-fsvg .wl-f-edge{fill:none;stroke:var(--anatomy-lo);stroke-width:1.5}
.anima .wl-meter{margin:6px 2px 0;font:.76rem var(--anatomy-mono);color:var(--ink-soft)}
.anima .wl-mh{margin:0 0 4px;font-weight:600;color:var(--ink)}
.anima .wl-mr{display:grid;grid-template-columns:7.4em 1fr 4.4em;gap:6px;align-items:center;margin:3px 0}
.anima .wl-mt{position:relative;height:9px;border-radius:5px;background:var(--line);overflow:hidden}
.anima .wl-mf{position:absolute;left:0;top:0;bottom:0;border-radius:5px}
.anima .wl-mf1{background:color-mix(in srgb, var(--wl-w1) 55%, var(--line))}
.anima .wl-mf2,.anima .wl-mf3{background:var(--wl-w2)}
.anima .wl-m50{position:absolute;left:50%;top:-2px;bottom:-2px;width:2px;background:var(--ink)}
.anima .wl-mk{margin:4px 0 0;color:var(--ink-faint);display:flex;align-items:center;gap:6px}
.anima .wl-m50k{display:inline-block;width:2px;height:11px;background:var(--ink)}
.anima .am-btn:disabled{opacity:.45;cursor:default}
.anima[data-anima="walls"]{--wl-b0:#ebe3d5;--wl-b1:#d8ccb8;--wl-b2:#c3b59d;--wl-fl:#ab9b80;--wl-w0:#f2cd84;--wl-w1:#dcaa52;--wl-w2:#c18d3a;
  --wl-r0:#fbf2d9;--wl-r1:#efdcab;--wl-r2:#d9c185;--wl-c0:#ffffff;--wl-c1:#f2f3f0;--wl-line:#9d927d;--wl-ang:#f4c56a}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]) .anima[data-anima="walls"]{--wl-b0:#5b5347;--wl-b1:#4a4339;--wl-b2:#3c362e;--wl-fl:#2f2a24;--wl-w0:#c0904a;--wl-w1:#a1743a;--wl-w2:#835d2d;
  --wl-r0:#a99a74;--wl-r1:#958664;--wl-r2:#7e7053;--wl-c0:#d9d6cd;--wl-c1:#c2beb3;--wl-line:#6f6656;--wl-ang:#f4c56a} }
:root[data-theme="dark"] .anima[data-anima="walls"]{--wl-b0:#5b5347;--wl-b1:#4a4339;--wl-b2:#3c362e;--wl-fl:#2f2a24;--wl-w0:#c0904a;--wl-w1:#a1743a;--wl-w2:#835d2d;
  --wl-r0:#a99a74;--wl-r1:#958664;--wl-r2:#7e7053;--wl-c0:#d9d6cd;--wl-c1:#c2beb3;--wl-line:#6f6656;--wl-ang:#f4c56a}
`;

export function walls() {
  return { id: "walls", lec: "periodontal-regeneration", title: "Counting the walls",
    caption: "One intrabony defect beside a root, set to three, two or one bony wall, the opening case's combination or horizontal bone loss, with the radiograph each one gives: the walls that remain lie over the defect and hide it on the film. From Dr. Geurs's class and slides.",
    html: `<div class="anima" data-anima="walls">${plate}${controls}${SOURCES}</div>`, css: CSS, live: wlLive.toString(),
    helpers: [wlPar, wlXw, wlRx, wlProf, wlPt, wlPoly, wl3d, wlLabels, wlFilm, wlBands], data: D };
}
