// Fig: a lymph node, with its B and T cell zones (L19 Introduction to Hematology, Dr. Herr: "Lymph nodes", "The
// supporting cells of a lymph node" and "How lymph and lymphocytes move through a node"). A bean-shaped node cut in half,
// hilum down: afferent lymphatics (with valves) pierce the capsule on the convex side into the sinuses; trabeculae run in
// from the capsule with sinuses beside them; the cortex holds the B cell follicles (primary ones, and secondary ones with
// a germinal center and a mantle zone), the paracortex (deep cortex) holds the T cells and the high endothelial venules,
// and the medulla opens at the hilum, where the artery comes in and the efferent lymphatic leaves. B zone blue, T zone
// gold. Two insets: a germinal center magnified (B cells, a follicular dendritic cell holding antigen-antibody complexes),
// and an HEV magnified with a lymphocyte crossing its wall. Step through three stories: antigen in the lymph (in, filtered
// in the sinuses, out), a lymphocyte from the blood (artery, across the HEV, out the efferent), and a primary follicle
// becoming a secondary one. Schematic, not to scale: the vein at the hilum and the medullary cords are drawn unlabeled
// because the lecture doesn't name them.
import { makeFig, f1, T, L, HOT } from "./shared.mjs";

/* ---------- build-time geometry ---------- */
const W = 520, H = 628;
const CX = 260, CY = 190, RX = 164, RY = 124, DENT = 54, DW = 0.36, RAD = Math.PI / 180;
function ang(a, b) { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; }
/* the outline: an ellipse with the hilum pushed in at the bottom */
function rim(th) { const g = Math.exp(-Math.pow(ang(th, Math.PI / 2) / DW, 2)); return [CX + RX * Math.cos(th), CY + RY * Math.sin(th) - DENT * g]; }
function nrm(th) {
  const e = 1e-3, a = rim(th - e), b = rim(th + e), p = rim(th);
  let tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tx, ty); tx /= l; ty /= l;
  let nx = -ty, ny = tx; if ((CX - p[0]) * nx + (CY - 20 - p[1]) * ny < 0) { nx = -nx; ny = -ny; }
  return [nx, ny];
}
/* how far the cortex and paracortex reach: full on the convex side, thinning to nothing at the hilum */
function wv(th) { return 1 - Math.exp(-Math.pow(ang(th, Math.PI / 2) / 0.8, 2)); }
const dCor = (th) => 10 + 46 * wv(th), dPar = (th) => 10 + 80 * wv(th);
function at(deg, d) { const th = deg * RAD, p = rim(th), n = nrm(th), dd = typeof d === "function" ? d(th) : d; return [p[0] + n[0] * dd, p[1] + n[1] * dd]; }
function ring(d, n) { const p = []; for (let i = 0; i < n; i++) p.push(at(i * 360 / n, d)); return p; }
function sm(p) {
  /* closed smooth path through p (Catmull-Rom as cubic Beziers) */
  var n = p.length, d = "M" + f1(p[0][0]) + " " + f1(p[0][1]), i, a, b, c, e;
  for (i = 0; i < n; i++) { a = p[(i - 1 + n) % n]; b = p[i]; c = p[(i + 1) % n]; e = p[(i + 2) % n];
    d += "C" + f1(b[0] + (c[0] - a[0]) / 6) + " " + f1(b[1] + (c[1] - a[1]) / 6) + " " + f1(c[0] - (e[0] - b[0]) / 6) + " " + f1(c[1] - (e[1] - b[1]) / 6) + " " + f1(c[0]) + " " + f1(c[1]); }
  return d + "Z";
}
function cr(p, n) {
  /* an open Catmull-Rom curve through p, sampled n points per span */
  var o = [], i, k, a, b, c, d, t;
  for (i = 0; i < p.length - 1; i++) {
    a = p[Math.max(0, i - 1)]; b = p[i]; c = p[i + 1]; d = p[Math.min(p.length - 1, i + 2)];
    for (k = 0; k < n; k++) { t = k / n; var t2 = t * t, t3 = t2 * t;
      o.push([0.5 * ((2 * b[0]) + (-a[0] + c[0]) * t + (2 * a[0] - 5 * b[0] + 4 * c[0] - d[0]) * t2 + (-a[0] + 3 * b[0] - 3 * c[0] + d[0]) * t3),
        0.5 * ((2 * b[1]) + (-a[1] + c[1]) * t + (2 * a[1] - 5 * b[1] + 4 * c[1] - d[1]) * t2 + (-a[1] + 3 * b[1] - 3 * c[1] + d[1]) * t3)]); }
  }
  o.push(p[p.length - 1]);
  return o.map(function (q) { return [f1(q[0]), f1(q[1])]; });
}
function rng(seed) { let a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
/* many small round marks as one path: zero-length segments drawn with round caps */
const dotD = (pts) => pts.map((q) => "M" + f1(q[0]) + " " + f1(q[1]) + "h0").join("");
function segDist(p, a, b) { const vx = b[0] - a[0], vy = b[1] - a[1], u = Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / (vx * vx + vy * vy))); return Math.hypot(p[0] - a[0] - u * vx, p[1] - a[1] - u * vy); }
function unitDisk(r, n, minD) { const o = []; let k = 0; while (o.length < n && k++ < 5000) { const x = r() * 2 - 1, y = r() * 2 - 1; if (x * x + y * y > 1) continue; if (o.some((q) => Math.hypot(q[0] - x, q[1] - y) < minD)) continue; o.push([f1(x * 100) / 100, f1(y * 100) / 100]); } return o; }

/* the follicles: angle on the outline, radius, kind (sec = secondary, pri = primary, focus = the one that changes) */
const FOL = [
  { a: 164, r: 22, k: "sec" }, { a: 196, r: 22, k: "pri" }, { a: 228, r: 23, k: "sec" }, { a: 262, r: 24, k: "sec" },
  { a: 296, r: 22, k: "pri" }, { a: 329, r: 23, k: "focus" }, { a: 1, r: 21, k: "pri" },
];
const TRAB = [148, 180, 212, 245, 279, 312, 345, 17];
const HEVA = [174, 236, 302, 9];
const AFF = [206, 238, 286, 321];
const MAC = [224, 300, 196];

/* ---------- page helpers (serialized into the page) ---------- */
function lnD(p) { var o = "", i; for (i = 0; i < p.length; i++) o += (i ? "L" : "M") + f1(p[i][0]) + " " + f1(p[i][1]); return o; }
function lnAt(p, s) {
  /* point at arc length s along polyline p, with its direction */
  var i = 1, acc = 0, l = 0;
  for (; i < p.length; i++) { l = Math.sqrt(Math.pow(p[i][0] - p[i - 1][0], 2) + Math.pow(p[i][1] - p[i - 1][1], 2)); if (acc + l >= s || i === p.length - 1) break; acc += l; }
  i = Math.min(i, p.length - 1); var w = l ? Math.max(0, Math.min(1, (s - acc) / l)) : 0;
  return [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * w, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * w, Math.atan2(p[i][1] - p[i - 1][1], p[i][0] - p[i - 1][0])];
}
function lnLen(p) { var s = 0, i; for (i = 1; i < p.length; i++) s += Math.sqrt(Math.pow(p[i][0] - p[i - 1][0], 2) + Math.pow(p[i][1] - p[i - 1][1], 2)); return s; }
/* a moving stream along p: n marks, one lap every per ms; with no time (reduced motion) they rest spread along it */
function lnFlow(p, n, per, t, kind, off, fadeEnd) {
  var o = "", tot = lnLen(p), i;
  for (i = 0; i < n; i++) {
    var u = t ? ((t / per + i / n + (off || 0)) % 1 + 1) % 1 : ((i + 0.5) / n + (off || 0)) % 1, q = lnAt(p, u * tot);
    var op = Math.min(1, u * 8, fadeEnd ? (1 - u) * 2.2 : (1 - u) * 8);
    o += lnMark(kind, q[0], q[1], q[2], op);
  }
  return o;
}
function lnMark(kind, x, y, a, op) {
  var g = '<g class="ln-pt" opacity="' + f1(Math.max(0, op)) + '" transform="translate(' + f1(x) + " " + f1(y) + ')">';
  if (kind === "ag") return g + '<path class="ln-ag" d="M0 -3.2L2.8 1.6L-2.8 1.6Z"/></g>';
  if (kind === "ly") return g + '<circle class="ln-lyf" r="2"/></g>';
  if (kind === "rbc") return g + '<ellipse class="ln-rbc" rx="2.8" ry="2" transform="rotate(' + f1(a * 57.3) + ')"/></g>';
  if (kind === "B" || kind === "T") return g + '<circle class="ln-c' + kind + '" r="4.2"/><circle class="ln-cn" r="2.6"/></g>';
  if (kind === "ab") return g + '<path class="ln-ab" d="M0 3.4V0L-2.6 -3M0 0L2.6 -3"/></g>';
  return "";
}
/* one cell travelling along p once per lap (rest at the end for the last part of the lap); at rest it sits at u0 */
function lnTrip(p, t, per, kind, u0, delay) {
  var tot = lnLen(p), u;
  if (!t) u = u0; else { var k = (((t - (delay || 0)) / per) % 1 + 1) % 1; u = Math.min(1, k / 0.72); u = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; }
  var q = lnAt(p, u * tot);
  return lnMark(kind, q[0], q[1], q[2], 1);
}
/* a follicle: g = 0 primary (a ball of B cells), g = 1 secondary (a pale germinal center inside a darker mantle) */
function lnFol(c, r, g, FD, dir, hl) {
  var o = '<circle class="ln-fol" cx="' + f1(c[0]) + '" cy="' + f1(c[1]) + '" r="' + f1(r) + '"/>', i, dots = "", gcc = "", gcn = "", fd = "";
  var gx = c[0] + dir[0] * r * 0.16 * g, gy = c[1] + dir[1] * r * 0.16 * g, rg = r * 0.62 * g;
  if (g > 0) o += '<circle class="ln-man" cx="' + f1(c[0]) + '" cy="' + f1(c[1]) + '" r="' + f1(r) + '" opacity="' + f1(g) + '"/><circle class="ln-gc" cx="' + f1(gx) + '" cy="' + f1(gy) + '" r="' + f1(rg) + '"/>';
  for (i = 0; i < FD.dots.length; i++) { var x = c[0] + FD.dots[i][0] * r * 0.9, y = c[1] + FD.dots[i][1] * r * 0.9;
    if (g > 0 && Math.sqrt((x - gx) * (x - gx) + (y - gy) * (y - gy)) < rg + 1.6) continue; dots += "M" + f1(x) + " " + f1(y) + "h0"; }
  o += '<path class="ln-dot" d="' + dots + '"/>';
  if (g > 0.2) {
    for (i = 0; i < FD.gc.length; i++) { var px = gx + FD.gc[i][0] * rg * 0.78, py = gy + FD.gc[i][1] * rg * 0.78; gcc += "M" + f1(px) + " " + f1(py) + "h0"; gcn += "M" + f1(px + 0.4) + " " + f1(py) + "h0"; }
    for (i = 0; i < FD.fdc.length; i++) { var fx = gx + FD.fdc[i][0] * rg * 0.5, fy = gy + FD.fdc[i][1] * rg * 0.5, k;
      for (k = 0; k < 4; k++) { var aa = FD.fdc[i][2] + k * 1.57; fd += "M" + f1(fx) + " " + f1(fy) + "L" + f1(fx + Math.cos(aa) * 4.6) + " " + f1(fy + Math.sin(aa) * 4.6); } }
    o += '<g opacity="' + f1(Math.min(1, (g - 0.2) / 0.5)) + '"><path class="ln-gcc" d="' + gcc + '"/><path class="ln-gcn" d="' + gcn + '"/><path class="ln-fdcs" d="' + fd + '"/></g>';
  }
  if (hl) o += '<circle class="ln-ring" cx="' + f1(c[0]) + '" cy="' + f1(c[1]) + '" r="' + f1(r + 4) + '"/>';
  return o;
}
function lnTube(p, cls) { var d = lnD(p); return '<path class="ln-tw ' + cls + '" d="' + d + '"/><path class="ln-tl ' + cls + '" d="' + d + '"/>'; }
/* a valve: two leaflets pointing the way the lymph flows */
function lnValve(p, s, w) { var q = lnAt(p, s), a = q[2], c = Math.cos(a), si = Math.sin(a), h = w / 2 - 0.6;
  return '<path class="ln-valve" d="M' + f1(q[0] - c * 4 - si * h) + " " + f1(q[1] - si * 4 + c * h) + "L" + f1(q[0] + c * 3) + " " + f1(q[1] + si * 3) + "L" + f1(q[0] - c * 4 + si * h) + " " + f1(q[1] - si * 4 - c * h) + '"/>'; }
function lnEase(u) { u = Math.max(0, Math.min(1, u)); return u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; }

/* ---------- the fixed drawing ---------- */
function nodeArt() {
  const o = {}, R = rng(19), rp = (d) => ring(d, 64);
  const fols = FOL.map((f) => Object.assign({}, f, { c: at(f.a, 10 + f.r + 1), dir: nrm(f.a * RAD) }));
  const hevs = HEVA.map((a) => at(a, (th) => (dCor(th) + dPar(th)) / 2 + 2));
  const inFol = (p, pad) => fols.some((f) => Math.hypot(p[0] - f.c[0], p[1] - f.c[1]) < f.r + pad);
  const trabSeg = TRAB.map((a) => [at(a, 4), at(a, dPar(a * RAD) - 4)]);
  const nearTrab = (p, pad) => trabSeg.some((s) => segDist(p, s[0], s[1]) < pad);
  const nearHev = (p, pad) => hevs.some((h) => Math.hypot(p[0] - h[0], p[1] - h[1]) < pad);
  function band(lo, hi, n, pad) {
    const out = []; let k = 0;
    while (out.length < n && k++ < n * 40) { const th = R() * 2 * Math.PI, a = typeof lo === "function" ? lo(th) : lo, b = hi(th); if (b - a < 4) continue;
      const p = at(th / RAD, a + 1.5 + R() * (b - a - 3)); if (inFol(p, 1.5) || nearTrab(p, 5) || nearHev(p, 9)) continue; out.push(p); }
    return out;
  }
  /* the regions, outside in */
  const capsule = sm(rp(0)), sinus = sm(rp(5)), cortex = sm(rp(10)), para = sm(rp(dCor)), med = sm(rp(dPar));
  let s = "";
  s += HOT(INFO.capsule, '<path class="ln-cap" d="' + capsule + '"/>');
  s += HOT(INFO.sinus, '<path class="ln-sin" d="' + sinus + '"/>');
  s += HOT(INFO.cortex, '<path class="ln-cor" d="' + cortex + '"/><path class="ln-dot" d="' + dotD(band(10, dCor, 170, 0)) + '"/>');
  s += HOT(INFO.para, '<path class="ln-par" d="' + para + '"/><path class="ln-dot" d="' + dotD(band(dCor, dPar, 230, 0)) + '"/>');
  /* the medulla: pale sinuses between cords that fan out from the hilum */
  const HIL = [262, 252];
  let cords = "", cdots = [];
  [150, 178, 203, 228, 262, 296, 324, 354, 28].forEach((a, j) => {
    const e = at(a, (th) => dPar(th) - 3), b = [HIL[0] + (e[0] - HIL[0]) * 0.34, HIL[1] + (e[1] - HIL[1]) * 0.34 + 4];
    const m = [(e[0] + b[0]) / 2 + (j % 2 ? 4 : -4), (e[1] + b[1]) / 2];
    const p = cr([e, m, b], 6); cords += lnD(p);
    for (let i = 1; i < p.length - 1; i += 2) cdots.push([p[i][0] + (R() - 0.5) * 4, p[i][1] + (R() - 0.5) * 4]);
  });
  s += HOT(INFO.medulla, '<path class="ln-med" d="' + med + '"/><path class="ln-cord" d="' + cords + '"/><path class="ln-dot" d="' + dotD(cdots) + '"/>');
  o.HIL = HIL;
  /* trabeculae from the capsule, with sinuses running beside them */
  let tsin = "", trab = "";
  TRAB.forEach((a) => {
    const th = a * RAD, n = 9, L1 = [], L2 = [], S1 = [], S2 = [], dEnd = dPar(th) - 2;
    for (let i = 0; i <= n; i++) { const d = 3 + (dEnd - 3) * i / n, p = at(a, d), q = nrm(th), tx = -q[1], ty = q[0], w = 2.8 - 1.6 * i / n, sw = w + 2.6;
      L1.push([p[0] + tx * w, p[1] + ty * w]); L2.unshift([p[0] - tx * w, p[1] - ty * w]); S1.push([p[0] + tx * sw, p[1] + ty * sw]); S2.unshift([p[0] - tx * sw, p[1] - ty * sw]); }
    tsin += lnD(S1.concat(S2)) + "Z"; trab += lnD(L1.concat(L2)) + "Z";
  });
  s += HOT(INFO.sinus, '<path class="ln-tsin" d="' + tsin + '"/>') + HOT(INFO.trab, '<path class="ln-trab" d="' + trab + '"/>');
  /* HEVs in the paracortex */
  o.HEVS = hevs.map((h) => [f1(h[0]), f1(h[1])]);
  hevs.forEach((h) => {
    let cells = "";
    for (let k = 0; k < 7; k++) { const a = k / 7 * 2 * Math.PI; cells += "M" + f1(h[0] + Math.cos(a) * 4.2) + " " + f1(h[1] + Math.sin(a) * 4.2) + "h0"; }
    s += HOT(INFO.hev, '<circle class="ln-hevw" cx="' + f1(h[0]) + '" cy="' + f1(h[1]) + '" r="6.6"/><path class="ln-hevc" d="' + cells + '"/><circle class="ln-hevl" cx="' + f1(h[0]) + '" cy="' + f1(h[1]) + '" r="2.2"/>');
  });
  /* the follicles (all but the one that changes) */
  const FD = { dots: unitDisk(R, 46, 0.2), gc: unitDisk(R, 9, 0.48), fdc: [[0.15, -0.35, 0.4], [-0.4, 0.3, 1.1]] };
  o.FD = FD;
  let fs = "";
  fols.forEach((f) => {
    if (f.k === "focus") { o.FOCUS = { c: [f1(f.c[0]), f1(f.c[1])], r: f.r, dir: [f1(f.dir[0] * 100) / 100, f1(f.dir[1] * 100) / 100] }; return; }
    fs += HOT(f.k === "sec" ? INFO.sec : INFO.pri, lnFol(f.c, f.r, f.k === "sec" ? 1 : 0, FD, f.dir, false));
  });
  o.FOLS = fols.map((f) => ({ c: [f1(f.c[0]), f1(f.c[1])], r: f.r, k: f.k }));
  o.BG = s + fs;
  /* macrophages reaching into the sinuses */
  let mac = "";
  MAC.forEach((a) => { const p = at(a, 7.4), q = nrm(a * RAD), tx = -q[1], ty = q[0];
    mac += HOT(INFO.mac, '<path class="ln-mac" d="M' + f1(p[0] - tx * 5.6) + " " + f1(p[1] - ty * 5.6) + "Q" + f1(p[0] + q[0] * 4) + " " + f1(p[1] + q[1] * 4) + " " + f1(p[0] + tx * 5.6) + " " + f1(p[1] + ty * 5.6) + "Q" + f1(p[0] - q[0] * 2.4) + " " + f1(p[1] - q[1] * 2.4) + " " + f1(p[0] - tx * 5.6) + " " + f1(p[1] - ty * 5.6) + 'Z"/><circle class="ln-macn" cx="' + f1(p[0] + q[0] * 0.6) + '" cy="' + f1(p[1] + q[1] * 0.6) + '" r="1.7"/>'); });
  o.MACS = MAC.map((a) => { const p = at(a, 7.4); return [f1(p[0]), f1(p[1])]; });
  /* the hilum: artery in, the vein (unlabeled) and the efferent lymphatic out; cut ends below */
  const ART = cr([[232, 402], [231, 340], [233, 296], [240, 262]], 6);
  const ARTR = cr([[240, 262], [262, 238], [304, 222], [hevs[3][0] - 8, hevs[3][1] + 3]], 6);
  const ARTL = cr([[240, 262], [226, 236], [196, 214], [hevs[0][0] + 7, hevs[0][1] + 2]], 6);
  const VEIN = cr([[256, 402], [256, 330], [257, 290], [255, 268]], 6);
  const EFF = cr([[HIL[0] + 22, HIL[1] + 6], [286, 290], [288, 340], [289, 402]], 6);
  o.ART = ART; o.ARTR = ARTR; o.ARTL = ARTL; o.EFF = EFF; o.VEIN = VEIN;
  /* the afferent lymphatics: from outside, through the capsule, into the sinus */
  o.AFFV = AFF.map((a) => cr([at(a + 7, -40), at(a + 2, -20), at(a, 5.5)], 6));
  /* the lymph's way on from each afferent: along the sinus to the next trabecula, down beside it, across the medulla to
     the efferent */
  o.SUB = AFF.map((a, k) => { const b = k < 2 ? a + 6 : a - 7, p = []; for (let i = 0; i <= 6; i++) p.push(at(a + (b - a) * i / 6, 7.4)); return p.map((q) => [f1(q[0]), f1(q[1])]); });
  const tFor = AFF.map((a, k) => (k < 2 ? a + 6 : a - 7));
  o.TRS = tFor.map((a) => { const th = a * RAD, q = nrm(th), tx = -q[1], ty = q[0], p = []; for (let i = 0; i <= 8; i++) { const d = 7.4 + (dPar(th) - 9) * i / 8, c = at(a, d), w = 2.8 - 1.6 * i / 8 + 1.3; p.push([f1(c[0] + tx * w), f1(c[1] + ty * w)]); } return p; });
  o.MEDS = tFor.map((a) => { const e = at(a, (th) => dPar(th) + 2); return cr([e, [e[0] + (HIL[0] + 22 - e[0]) * 0.5, e[1] + (HIL[1] - e[1]) * 0.5 - 8], [HIL[0] + 22, HIL[1] + 4]], 6); });
  o.MACP = cr([at(286, 7.4), at(292, 7.4), at(299, 7.4)], 4);
  /* a dendritic cell carrying antigen from the sinus to the T cells */
  o.DCP = cr([at(250, 8), at(252, 30), at(247, 54), at(240, (th) => (dCor(th) + dPar(th)) / 2 - 4)], 6);
  /* a lymphocyte from the HEV: T cells stay in the paracortex, B cells go on to the follicles */
  const hR = hevs[3], fc = fols.find((f) => f.k === "focus").c;
  o.TP = cr([[hR[0], hR[1]], [hR[0] - 10, hR[1] - 12], [hR[0] - 20, hR[1] - 16]], 6);
  o.BP = cr([[hR[0], hR[1]], [hR[0] + 6, hR[1] - 22], [fc[0] + 4, fc[1] + 16], [fc[0] - 2, fc[1] + 4]], 6);
  o.TOUT = cr([[hR[0] - 20, hR[1] - 16], [hR[0] - 40, hR[1] + 4], [300, 244], [HIL[0] + 22, HIL[1] + 4]], 6).concat(EFF.slice(1));
  const tb = at(345, 9);
  o.BOUT = cr([[fc[0] - 2, fc[1] + 4], [fc[0] - 18, fc[1] - 4], [tb[0], tb[1]]], 6).concat(o.TRS[3].slice(0).reverse().slice(0, 0)).concat(cr([at(345, 12), at(345, 40), at(345, (th) => dPar(th) - 2), [300, 240], [HIL[0] + 22, HIL[1] + 4]], 6)).concat(EFF.slice(1));
  o.AGF = cr([at(321, 7.4), at(327, 7.4), at(330, 12), [fc[0] + 2, fc[1] - 8]], 6);
  /* the fixed parts drawn over the tissue */
  let fg = mac;
  fg += HOT(INFO.vein, lnTube(VEIN, "ln-vn") + '<ellipse class="ln-cutv" cx="256" cy="402" rx="5.4" ry="2.4"/>');
  fg += HOT(INFO.art, lnTube(ART, "ln-ar") + lnTube(ARTR, "ln-ar ln-ar2") + lnTube(ARTL, "ln-ar ln-ar2") + '<ellipse class="ln-cuta" cx="232" cy="402" rx="4.4" ry="2"/>');
  fg += HOT(INFO.eff, lnTube(EFF, "ln-ly") + lnValve(EFF, 46, 10) + lnValve(EFF, 96, 10) + '<ellipse class="ln-cutl" cx="289" cy="402" rx="5.8" ry="2.5"/>');
  o.AFFV.forEach((p) => { fg += HOT(INFO.aff, lnTube(p, "ln-ly") + lnValve(p, 20, 10) + '<circle class="ln-cutl" cx="' + p[0][0] + '" cy="' + p[0][1] + '" r="5"/>'); });
  o.FG = fg;
  return o;
}

/* ---------- the insets ---------- */
function gcInset() {
  const R = rng(7), X0 = 10, Y0 = 438, X1 = 250, Y1 = 612;
  let o = '<rect class="ln-ibg ln-igc" x="' + X0 + '" y="' + Y0 + '" width="' + (X1 - X0) + '" height="' + (Y1 - Y0) + '" rx="10"/>';
  /* the mantle along the top: small lymphocytes, tightly packed */
  let man = "", mn = "";
  for (let y = Y0 + 7; y < Y0 + 30; y += 6.4) for (let x = X0 + 8 + ((y / 6.4) % 2) * 3.2; x < X1 - 6; x += 6.6) { const jx = x + (R() - 0.5) * 1.6, jy = y + (R() - 0.5) * 1.6; man += "M" + f1(jx) + " " + f1(jy) + "h0"; mn += "M" + f1(jx + 0.3) + " " + f1(jy) + "h0"; }
  o += HOT(INFO.mantle, '<rect class="ln-imant" x="' + X0 + '" y="' + Y0 + '" width="' + (X1 - X0) + '" height="30" rx="10"/><path class="ln-ims" d="' + man + '"/><path class="ln-imn" d="' + mn + '"/>');
  /* the germinal center's B cells: small and large lymphocytes and lymphoblasts */
  const FDC = [118, 530], cells = [];
  for (let k = 0; k < 400 && cells.length < 34; k++) {
    const big = R() < 0.3, r = big ? 9.5 : 7, x = X0 + 10 + R() * (X1 - X0 - 20), y = Y0 + 40 + R() * (Y1 - Y0 - 50);
    if (Math.hypot(x - FDC[0], y - FDC[1]) < 20 + r) continue; if (cells.some((c) => Math.hypot(c[0] - x, c[1] - y) < c[2] + r + 2.5)) continue;
    if (x < X0 + 4 + r || x > X1 - 4 - r || y > Y1 - 4 - r) continue; cells.push([x, y, r, big]);
  }
  let bc = "";
  cells.forEach((c) => { bc += '<circle class="ln-ibc" cx="' + f1(c[0]) + '" cy="' + f1(c[1]) + '" r="' + c[2] + '"/><circle class="' + (c[3] ? "ln-ibn2" : "ln-ibn") + '" cx="' + f1(c[0] + 0.6) + '" cy="' + f1(c[1] - 0.4) + '" r="' + (c[3] ? 6 : 4.6) + '"/>' + (c[3] ? '<circle class="ln-inuc" cx="' + f1(c[0] + 1.6) + '" cy="' + f1(c[1] - 1.4) + '" r="1.3"/>' : ""); });
  o += HOT(INFO.gcB, bc);
  /* the follicular dendritic cell: thin hair-like processes between the B cells, immune complexes stuck along them */
  const procs = [[-0.2, 62], [0.6, 56], [1.5, 46], [2.3, 64], [3.1, 70], [3.9, 52], [4.7, 44], [5.5, 58]];
  let pr = "", ic = "";
  procs.forEach((p, j) => {
    const a0 = p[0], len = p[1], pts = [];
    for (let i = 0; i <= 8; i++) { const u = i / 8, a = a0 + Math.sin(u * 3 + j) * 0.28; pts.push([FDC[0] + Math.cos(a) * (9 + len * u), FDC[1] + Math.sin(a) * (9 + len * u) * 0.86]); }
    const q = cr(pts, 3).filter((z) => z[0] > X0 + 3 && z[0] < X1 - 3 && z[1] > Y0 + 33 && z[1] < Y1 - 3);
    pr += lnD(q);
    const b = q[Math.floor(q.length * 0.55)], br = [b[0] + Math.cos(a0 + 0.9) * 14, b[1] + Math.sin(a0 + 0.9) * 12];
    if (br[0] > X0 + 4 && br[0] < X1 - 4 && br[1] > Y0 + 33 && br[1] < Y1 - 4) pr += "M" + f1(b[0]) + " " + f1(b[1]) + "Q" + f1((b[0] + br[0]) / 2 + 3) + " " + f1((b[1] + br[1]) / 2) + " " + f1(br[0]) + " " + f1(br[1]);
    [0.4, 0.8].forEach((f) => { const z = q[Math.min(q.length - 1, Math.floor(q.length * f))]; if (!z) return; const a = Math.atan2(z[1] - FDC[1], z[0] - FDC[0]) + Math.PI / 2;
      ic += '<g transform="translate(' + f1(z[0]) + " " + f1(z[1]) + ") rotate(" + f1(a * 57.3) + ')"><path class="ln-iy" d="M0 0V-3.4M0 -3.4L-2.6 -6.2M0 -3.4L2.6 -6.2"/><path class="ln-iag" d="M-2.6 -6.4L0 -9.6L2.6 -6.4Z"/></g>'; });
  });
  o += HOT(INFO.fdc, '<path class="ln-fdcp" d="' + pr + '"/><ellipse class="ln-fdcb" cx="' + FDC[0] + '" cy="' + FDC[1] + '" rx="11" ry="9"/><ellipse class="ln-fdcn" cx="' + (FDC[0] + 1) + '" cy="' + FDC[1] + '" rx="6.4" ry="4.4"/>');
  o += HOT(INFO.ic, ic);
  return { svg: o, FDC };
}
function hevInset() {
  const R = rng(23), X0 = 270, Y0 = 438, X1 = 510, Y1 = 612, C = [392, 528], RI = 20, RO = 40;
  let o = '<rect class="ln-ibg ln-ihev" x="' + X0 + '" y="' + Y0 + '" width="' + (X1 - X0) + '" height="' + (Y1 - Y0) + '" rx="10"/>';
  /* T cells of the paracortex around it */
  let tc = "", tn = "";
  for (let k = 0, n = 0; k < 900 && n < 58; k++) {
    const x = X0 + 9 + R() * (X1 - X0 - 18), y = Y0 + 9 + R() * (Y1 - Y0 - 18);
    if (Math.hypot(x - C[0], y - C[1]) < RO + 9) continue; if (y < Y0 + 22 && x < X0 + 130) continue;
    tc += "M" + f1(x) + " " + f1(y) + "h0"; tn += "M" + f1(x + 0.4) + " " + f1(y - 0.3) + "h0"; n++;
  }
  o += HOT(INFO.hevT, '<path class="ln-its" d="' + tc + '"/><path class="ln-itn" d="' + tn + '"/>');
  /* the venule: a ring of plump endothelial cells around the lumen, one gap where the lymphocyte crosses */
  const GAP = -0.72, n = 10;
  let cells = "";
  for (let k = 0; k < n; k++) {
    const a0 = GAP + 0.17 + k * (2 * Math.PI - 0.34) / n, a1 = a0 + (2 * Math.PI - 0.34) / n - 0.06, am = (a0 + a1) / 2;
    const p = (a, r) => f1(C[0] + Math.cos(a) * r) + " " + f1(C[1] + Math.sin(a) * r);
    cells += '<path class="ln-iendo" d="M' + p(a0, RI) + "A" + RI + " " + RI + " 0 0 1 " + p(a1, RI) + "L" + p(a1 + 0.03, RO) + "A" + RO + " " + RO + " 0 0 0 " + p(a0 - 0.03, RO) + 'Z"/><ellipse class="ln-iendn" cx="' + f1(C[0] + Math.cos(am) * 30) + '" cy="' + f1(C[1] + Math.sin(am) * 30) + '" rx="5.4" ry="4.4" transform="rotate(' + f1(am * 57.3) + " " + f1(C[0] + Math.cos(am) * 30) + " " + f1(C[1] + Math.sin(am) * 30) + ')"/>';
  }
  o += HOT(INFO.hevI, '<circle class="ln-ibm" cx="' + C[0] + '" cy="' + C[1] + '" r="' + (RO + 1.5) + '"/><circle class="ln-ilum" cx="' + C[0] + '" cy="' + C[1] + '" r="' + RI + '"/>' + cells +
    '<ellipse class="ln-irbc" cx="' + (C[0] - 7) + '" cy="' + (C[1] + 6) + '" rx="6.4" ry="4.6"/><ellipse class="ln-irbc2" cx="' + (C[0] - 7) + '" cy="' + (C[1] + 6) + '" rx="2.6" ry="1.6"/>');
  return { svg: o, C, RI, RO, GAP };
}
/* the crossing lymphocyte in the HEV inset: u 0 in the lumen, 1 out among the T cells; it narrows in the wall */
function lnCross(I, u) {
  var r = 6 + u * 52, sq = u > 0.18 && u < 0.62 ? Math.sin((u - 0.18) / 0.44 * Math.PI) : 0, x = I.C[0] + Math.cos(I.GAP) * r, y = I.C[1] + Math.sin(I.GAP) * r;
  var rx = 6.4 + sq * 3.2, ry = 6.4 - sq * 3.4, rot = I.GAP * 57.3;
  return '<g transform="translate(' + f1(x) + " " + f1(y) + ") rotate(" + f1(rot) + ')"><ellipse class="ln-ixl" rx="' + f1(rx) + '" ry="' + f1(ry) + '"/><ellipse class="ln-ixn" cx="0.5" rx="' + f1(rx * 0.7) + '" ry="' + f1(ry * 0.72) + '"/></g>';
}

/* ---------- the steps ---------- */
const STEPS = [
  { ch: 0, ro: "zones · B cortex · T paracortex",
    say: "A lymph node cut in half. A dense fibrous capsule sends trabeculae inward. The outer cortex holds the lymphoid follicles of B cells (blue), the paracortex, or deep cortex, holds the T cells (gold), and the medulla is the inner part, opening at the hilum. Lymph comes in through afferent lymphatics and leaves through the efferent lymphatic at the hilum, where the artery comes in. Pick a story to follow." },
  { ch: 1, ro: "lymph 1/3 · afferent → sinuses",
    say: "Antigen in the lymph, 1 of 3: afferent lymphatic vessels bring lymph from the surrounding tissues and neighboring nodes through the capsule into a network of lymphatic sinuses. The antigen comes in soluble form or carried by dendritic cells." },
  { ch: 1, ro: "lymph 2/3 · filtered in the sinuses",
    say: "2 of 3: the sinus walls let the lymph percolate into the superficial and deep cortex, where the lymphocytes carry out immunosurveillance. Macrophages reach into the sinuses and phagocytose antigens and foreign material: that is how the node filters lymph. Dendritic cells present antigen to the T cells of the paracortex." },
  { ch: 1, ro: "lymph 3/3 · out the efferent",
    say: "3 of 3: the lymph returns to the sinuses and leaves through the medulla in the efferent lymphatic vessel at the hilum. The lymph node is the only lymphoid structure with both afferent and efferent lymphatics." },
  { ch: 4, ro: "blood 1/3 · artery at the hilum",
    say: "A lymphocyte from the blood, 1 of 3: blood comes in through an artery at the hilum, and its branches carry the blood's lymphocytes up through the medulla to the deep cortex." },
  { ch: 4, ro: "blood 2/3 · across the HEV",
    say: "2 of 3: the lymphocytes cross into the deep cortex through the high endothelial venules (HEVs) of the paracortex. T cells and dendritic cells are directed to the paracortex; B cells go on to the cortex and its follicles." },
  { ch: 4, ro: "blood 3/3 · out the efferent",
    say: "3 of 3: both leave the node through the efferent lymphatic vessel. That is how a node recirculates lymphocytes, one of its four jobs, with filtering lymph, adding lymphocytes to it and making antibodies, mostly IgG." },
  { ch: 7, ro: "primary follicle",
    say: "A primary, unstimulated follicle is a spherical aggregate of B cells in a meshwork of reticular fibers. Antigen arrives in the lymph, and its B cells interact with the antigen and with T cells." },
  { ch: 7, ro: "secondary follicle · germinal center",
    say: "After antigenic stimulation it becomes a secondary, stimulated follicle: a germinal center, the major site of B cell proliferation (small and large lymphocytes, lymphoblasts and follicular dendritic cells), inside a mantle zone of small lymphocytes. Plasma cells release antibody into the lymph. This is the tender, swollen node under the jaw after a tooth infection." },
];
const INFO = {
  capsule: "Capsule: dense fibrous connective tissue around the node. It sends trabeculae of collagen inward, which support the node and carry its blood vessels. Lymph nodes are small, bean-shaped and encapsulated, up to about 20 mm across; there are 500 to 600 of them, in places such as the neck, groin and axillae.",
  trab: "Trabecula: collagen from the capsule. Trabeculae support the node and carry its blood vessels; the lymph runs in the sinuses beside them.",
  sinus: "Lymphatic sinuses: the afferent lymph pours into this network. The sinus walls let the lymph percolate into the cortex and deep cortex, and macrophages reach into the sinuses to phagocytose antigens and foreign material: that is how the node filters lymph.",
  cortex: "Cortex, just under the capsule: lymphoid nodules, or follicles, of B cells from the bone marrow, in a stroma of reticular fibers.",
  pri: "Primary, unstimulated follicle: a spherical aggregate of B cells in a meshwork of reticular fibers.",
  sec: "Secondary, stimulated follicle, after antigenic stimulation: a pale germinal center, the major site of B cell proliferation, surrounded by a darker mantle zone of small lymphocytes.",
  para: "Paracortex (deep cortex): the T cell zone. Antigen-dependent T cell differentiation and proliferation happen here, and its high endothelial venules let lymphocytes in from the blood.",
  medulla: "Medulla: the inner part of the node. Its sinuses gather the lymph toward the hilum, where it leaves in the efferent lymphatic.",
  hev: "High endothelial venule (HEV), in the paracortex: lymphocytes from the blood cross its wall into the deep cortex. T cells and dendritic cells stay in the paracortex; B cells go on to the cortex. An HEV means the lymph node paracortex.",
  mac: "Macrophage reaching into a sinus: it phagocytoses antigens and foreign material, and it also presents antigen. There are fewer macrophages than dendritic cells.",
  aff: "Afferent lymphatic vessel: it brings lymph from the surrounding tissues and neighboring nodes through the capsule into the sinuses. Like veins, lymphatic vessels have valves and thin walls.",
  eff: "Efferent lymphatic vessel, at the hilum: lymph, B and T cells, and antibody from the plasma cells leave the node here. The lymph node is the only lymphoid structure with both afferent and efferent lymphatics.",
  art: "Artery at the hilum: blood comes in here, and its branches carry the blood's lymphocytes up to the high endothelial venules of the deep cortex.",
  vein: "Blood leaves the node at the hilum.",
  dc: "Dendritic cell: an antigen-presenting cell. It watches for foreign particles, carries antigen in with the lymph and presents it to the T cells of the paracortex.",
  mantle: "Mantle zone: small lymphocytes, packed around the germinal center.",
  gcB: "B cells of the germinal center: small and large lymphocytes and lymphoblasts. This is the major site of B cell proliferation, where B cells proliferate and differentiate after meeting antigen and T cells.",
  fdc: "Follicular dendritic cell: many thin, hair-like processes that interdigitate between the B cells of the germinal center. It lacks MHC II, so it is not an antigen-presenting cell.",
  ic: "Antigen-antibody complexes, stuck to the follicular dendritic cell's processes through Fc receptors.",
  hevI: "A high endothelial venule (HEV) in section: lymphocytes in the blood cross its wall, between its endothelial cells, into the deep cortex.",
  hevT: "T cells of the paracortex, around the HEV.",
};

/* ---------- live drawing ---------- */
function lnRender(st, D) {
  var t = st.t || 0, s = st.s, o = "", i, k;
  st.ch = D.STEPS[s].ch;
  if (st._s !== s) { st._s = s; st._t0 = t; }
  var age = t ? t - st._t0 : 1e9;
  /* the follicle that changes: primary until step 8, then it grows a germinal center */
  var g = s === 8 ? (t ? lnEase(age / 1800) : 1) : 0, F = D.FOCUS;
  var fr = F.r + 3 * g;
  o += D.BG + HOT(g > 0.5 ? D.INFO.sec : D.INFO.pri, lnFol(F.c, fr, g, D.FD, F.dir, s >= 7)) + D.FG;
  /* what this step lights up, and what moves */
  var lit = [], f = "";
  if (s === 0) { D.AFFV.forEach(function (p, j) { f += lnFlow(p, 2, 5200, t, "ly", j / 4); }); f += lnFlow(D.EFF, 3, 5200, t, "ly", 0.2); }
  if (s === 1) { lit = D.AFFV.concat(D.SUB); D.AFFV.forEach(function (p, j) { f += lnFlow(p.concat(D.SUB[j].slice(1)), 4, 3600, t, "ag", j / 7, true); }); }
  if (s === 2) {
    lit = D.TRS.concat([D.MACP, D.DCP]);
    D.TRS.forEach(function (p, j) { if (j !== 2) f += lnFlow(p, 4, 4200, t, "ag", j / 5, true); });
    f += lnFlow(D.MACP, 3, 2600, t, "ag", 0, true);
    var dcq = lnAt(D.DCP, (t ? (t / 5200) % 1 : 0.7) * lnLen(D.DCP));
    f += HOT(D.INFO.dc, '<g transform="translate(' + f1(dcq[0]) + " " + f1(dcq[1]) + ')"><path class="ln-dcp" d="M0 0L8 -3M0 0L5 6M0 0L-6 5M0 0L-7 -4M0 0L1 -8"/><circle class="ln-dcb" r="3.4"/><path class="ln-ag" d="M6 -6.6L8.6 -2.2L3.4 -2.2Z"/></g>');
  }
  if (s === 3) { lit = D.MEDS.concat([D.EFF]); D.MEDS.forEach(function (p, j) { f += lnFlow(p.concat(D.EFF.slice(1)), 4, 4600, t, j % 2 ? "ag" : "ly", j / 6); }); }
  if (s === 4) { lit = [D.ART, D.ARTR, D.ARTL]; f += lnFlow(D.ART.concat(D.ARTR.slice(1)), 6, 3000, t, "rbc", 0) + lnFlow(D.ART.concat(D.ARTL.slice(1)), 4, 3000, t, "rbc", 0.1);
    f += lnTrip(D.ART.concat(D.ARTR.slice(1)), t, 3000, "B", 0.75, 0) + lnTrip(D.ART.concat(D.ARTR.slice(1)), t, 3000, "T", 0.55, 900); }
  if (s === 5) { lit = [D.TP, D.BP]; f += lnTrip(D.TP, t, 3600, "T", 0.8, 0) + lnTrip(D.BP, t, 3600, "B", 0.8, 300); }
  if (s === 6) { lit = [D.TOUT, D.BOUT]; f += lnTrip(D.TOUT, t, 5200, "T", 0.55, 0) + lnTrip(D.BOUT, t, 5200, "B", 0.4, 700); }
  if (s === 7) { lit = [D.AGF]; f += lnFlow(D.AGF, 3, 3600, t, "ag", 0, true); var tq = D.TP[D.TP.length - 1]; f += lnMark("T", F.c[0] - 4, F.c[1] + F.r + 6, 0, 1); }
  if (s === 8) { lit = D.MEDS.concat([D.EFF]); D.MEDS.forEach(function (p, j) { f += lnFlow(p.concat(D.EFF.slice(1)), 3, 4800, t, "ab", j / 5); }); }
  for (i = 0; i < lit.length; i++) o += '<path class="ln-lit" d="' + lnD(lit[i]) + '"/>';
  o += f;
  /* ---------- labels ---------- */
  function on(a) { return a.indexOf(s) >= 0 ? " ln-on" : ""; }
  o += L(108, 34, "afferent lymphatics", D.AFFV[1][3][0], D.AFFV[1][3][1], "end", "ln-xs b" + on([1]));
  o += L(408, 34, "capsule", 414, 112, "start", "ln-xs b" + on([0]));
  o += L(408, 62, "sinus", 401, 116, "start", "ln-xs b" + on([1, 2]));
  o += L(38, 112, "trabecula", 106, 132, "start", "ln-xs b");
  o += L(196, 26, "germinal center", D.FOLS[3].c[0] - 2, D.FOLS[3].c[1] + 4, "end", "ln-xs b" + on([8]));
  o += L(298, 26, "mantle zone", D.FOLS[3].c[0] + 12, D.FOLS[3].c[1] - 14, "start", "ln-xs b" + on([8]));
  o += T(270, 52, "secondary follicle", "ln-xs mut", "start");
  o += L(468, 150, "primary", F.c[0] + 16, F.c[1] - 10, "start", "ln-xs b" + on([7])) + T(468, 164, "follicle", "ln-xs b" + on([7]), "start");
  o += L(8, 196, "cortex", D.FOLS[1].c[0] - 6, D.FOLS[1].c[1] + 22, "start", "ln-xs ln-bt") + T(8, 210, "B cells", "ln-xs ln-bt", "start");
  o += L(8, 252, "paracortex", 128, 236, "start", "ln-xs ln-tt") + T(8, 266, "T cells", "ln-xs ln-tt", "start");
  o += L(470, 236, "HEV", D.HEVS[3][0] + 6, D.HEVS[3][1] + 2, "start", "ln-xs b" + on([4, 5]));
  o += L(470, 284, "medulla", 330, 246, "start", "ln-xs b");
  o += L(160, 322, "hilum", 236, 284, "end", "ln-xs b");
  o += L(214, 380, "artery", 230, 372, "end", "ln-xs b" + on([4]));
  o += L(306, 360, "efferent", 291, 352, "start", "ln-xs b" + on([3, 6])) + T(306, 374, "lymphatic", "ln-xs b" + on([3, 6]), "start");
  /* legend */
  o += '<rect class="ln-swB" x="358" y="392" width="10" height="10" rx="2"/>' + T(372, 401, "B cells", "ln-xs", "start") + '<rect class="ln-swT" x="430" y="392" width="10" height="10" rx="2"/>' + T(444, 401, "T cells", "ln-xs", "start");
  o += '<g transform="translate(14 396)"><path class="ln-ag" d="M0 -3.2L2.8 1.6L-2.8 1.6Z"/></g>' + T(24, 401, "antigen", "ln-xs", "start") + '<path class="ln-lw" d="M84 397H104"/><path class="ln-ll" d="M84 397H104"/>' + T(108, 401, "lymph", "ln-xs", "start");
  /* ---------- the insets ---------- */
  var gcOn = s === 8, hevOn = s === 4 || s === 5;
  o += '<path class="ln-zoom" d="M' + D.FOLS[0].c[0] + " " + f1(D.FOLS[0].c[1] + D.FOLS[0].r + 2) + "L60 438" + '"/><circle class="ln-zr" cx="' + D.FOLS[0].c[0] + '" cy="' + D.FOLS[0].c[1] + '" r="' + (D.FOLS[0].r + 2) + '"/>';
  o += '<path class="ln-zoom" d="M' + D.HEVS[3][0] + " " + f1(D.HEVS[3][1] + 9) + "L470 438" + '"/><circle class="ln-zr" cx="' + D.HEVS[3][0] + '" cy="' + D.HEVS[3][1] + '" r="9"/>';
  o += '<g class="' + (gcOn ? "ln-inset is-on" : "ln-inset") + '">' + D.GCI + '</g>';
  o += '<g class="' + (hevOn ? "ln-inset is-on" : "ln-inset") + '">' + D.HEVI;
  var cu = hevOn && t ? (((t - 400) / 3200) % 1 + 1) % 1 : 0.42;
  o += HOT(D.INFO.hevI, lnCross(D.HI, Math.min(1, cu / 0.8))) + "</g>";
  o += T(18, 432, "a germinal center, magnified", "ln-xs ln-cap", "start") + T(278, 432, "an HEV, magnified", "ln-xs ln-cap", "start");
  o += L(52, 604, "follicular dendritic cell", D.FDC[0] - 6, D.FDC[1] + 6, "start", "ln-xs b" + on([8]));
  o += T(52, 590, "no MHC II: presents nothing", "ln-xs ln-no", "start");
  o += T(18, 456, "mantle zone", "ln-xs ln-capw", "start");
  o += L(238, 574, "antigen-antibody", D.ICL[0], D.ICL[1], "end", "ln-xs") + T(238, 588, "complexes (Fc receptors)", "ln-xs", "end");
  o += L(502, 470, "lymphocyte crossing", 430, 492, "end", "ln-xs b" + on([5])) + T(502, 604, "T cells (paracortex)", "ln-xs ln-tt", "end") + L(330, 470, "HEV", 362, 500, "end", "ln-xs b");
  return o;
}
function lnSay(st, D) { var S = D.STEPS[st.s]; return [S.say, S.ro]; }
function lnOnset(st, k, D) { if (k === "ch") st.s = st.ch; }

export default function node() {
  const A = nodeArt(), G = gcInset(), HV = hevInset();
  /* where the "antigen-antibody complexes" label points: a complex low and right of the FDC */
  const D = Object.assign({}, A, {
    STEPS, INFO, GCI: G.svg, FDC: G.FDC, HEVI: HV.svg, HI: { C: HV.C, GAP: HV.GAP }, ICL: [176, 552],
    ANIM: true, PLAYMS: 4200, INIT: { s: 0, ch: 0 }, STEPKEY: "s", STEPMAX: 8, ONSET: "lnOnset",
  });
  return makeFig({
    id: "node", lec: "hemeintro", fig: "Fig 4", short: "A lymph node", hint: "step · hover",
    title: "A lymph node, with its B and T cell zones",
    caption: "A node cut in half, hilum down: B cell follicles in the cortex, T cells in the paracortex, the medulla inside. Follow antigen in the lymph, a lymphocyte from the blood, and a follicle meeting antigen.",
    W, H,
    label: "A lymph node in section: afferent lymphatics with valves entering the capsule, sinuses under the capsule and beside the trabeculae, the cortex with primary and secondary follicles (germinal center and mantle zone), the paracortex with high endothelial venules, the medulla, and the artery and efferent lymphatic at the hilum; with insets of a germinal center (B cells and a follicular dendritic cell holding antigen-antibody complexes) and a high endothelial venule with a lymphocyte crossing its wall.",
    D, render: lnRender, say: lnSay, helpers: [lnD, lnAt, lnLen, lnFlow, lnMark, lnTrip, lnFol, lnTube, lnValve, lnEase, lnCross, lnOnset],
    controls: `<div class="am-controls" role="group" aria-label="Story">${[[0, "The zones"], [1, "Antigen in the lymph"], [4, "A lymphocyte from the blood"], [7, "A follicle meets antigen"]].map((b) => `<button type="button" class="am-btn" data-amk="ch" data-amv="${b[0]}">${b[1]}</button>`).join("")}</div>
<div class="am-controls" role="group" aria-label="Step"><button type="button" class="am-btn" data-amstep="-1">Back</button><button type="button" class="am-btn" data-amstep="1">Next</button><button type="button" class="am-btn" data-amplay aria-pressed="false">Play</button></div>`,
    sources: [
      "From the L19 notes (Dr. Herr): the capsule and its collagen trabeculae, the reticular stroma; the cortex's follicles of B cells, primary (a spherical aggregate of B cells) and secondary (a germinal center, the major site of B cell proliferation, with small and large lymphocytes, lymphoblasts and follicular dendritic cells, inside a mantle zone of small lymphocytes); the paracortex (deep cortex) with the T cells; the medulla; afferent lymphatics into the sinuses, percolation through the cortex, macrophages in the sinuses as the filter, and the efferent lymphatic at the hilum (the only lymphoid structure with both); blood in through an artery at the hilum and its lymphocytes across the high endothelial venules, T cells and dendritic cells to the paracortex and B cells to the cortex; follicular dendritic cells holding antigen-antibody complexes by Fc receptors and lacking MHC II; his B cell activation figure and the swollen node of a tooth infection.",
      "Size: the notes say up to about 20 mm across. His slide gives 1 to 20 mm and its speaker notes 2 to 20 mm; the figure follows the notes, and no question depends on it. His slide 30 notes have lymphocytes reentering across the efferent lymphatic walls; the figure follows slide 33 and the notes (in through the HEVs, out through the efferent lymphatic).",
      "Junqueira's Basic Histology and Ross and Pawlina's Histology settled the drawing: where the afferent lymphatics enter (the convex side) and the efferent leaves (the hilum), valves in both, the sinuses under the capsule and beside the trabeculae draining through the medulla, the mantle as a darker cap on the capsule side of a pale germinal center, an HEV's plump, tall endothelial cells with a lymphocyte crossing between them, and a follicular dendritic cell's long processes among the B cells.",
      "Schematic and not to scale: the follicles, HEVs and insets are enlarged, and the routes are idealized. The vein at the hilum and the cords of the medulla are drawn but not named, because the lecture doesn't name them. Lymphocytes are drawn as dots; the colors code B (blue) and T (gold) zones, not stains.",
    ],
    css: `
.anima[data-anima="node"] .am-svg{max-width:560px}
.anima .node-svg .t.ln-xs{font-size:11px}
.anima .node-svg .t.ln-on{fill:var(--anatomy-lit)}
.anima .node-svg .t.ln-bt{fill:var(--bx-blue);font-weight:600}
.anima .node-svg .t.ln-tt{fill:color-mix(in srgb,var(--bx-gold) 62%,var(--anatomy-strong));font-weight:600}
.anima .node-svg .t.ln-cap{fill:var(--anatomy-muted);letter-spacing:.03em}
.anima .node-svg .t.ln-capw{fill:var(--anatomy-strong);font-weight:600}
.anima .node-svg .t.ln-no{fill:var(--bx-inhib);font-weight:600}
.anima .node-svg .ln-cap{fill:var(--bx-eosin);stroke:var(--bx-cyto-line);stroke-width:1.2}
.anima .node-svg .ln-sin{fill:var(--bx-lumen)}
.anima .node-svg .ln-cor{fill:color-mix(in srgb,var(--bx-blue-soft) 62%,var(--anatomy-face))}
.anima .node-svg .ln-par{fill:color-mix(in srgb,var(--bx-gold-soft) 85%,var(--anatomy-face))}
.anima .node-svg .ln-med{fill:var(--bx-lumen);stroke:color-mix(in srgb,var(--bx-gold) 40%,transparent);stroke-width:.8}
.anima .node-svg .ln-cord{fill:none;stroke:color-mix(in srgb,var(--bx-eosin) 55%,var(--bx-matrix));stroke-width:9;stroke-linecap:round;stroke-linejoin:round}
.anima .node-svg .ln-dot{fill:none;stroke:var(--bx-nuc);stroke-width:2.5;stroke-linecap:round;opacity:.75}
.anima .node-svg .ln-tsin{fill:var(--bx-lumen)}
.anima .node-svg .ln-trab{fill:var(--bx-eosin);stroke:var(--bx-cyto-line);stroke-width:.6}
.anima .node-svg .ln-fol{fill:var(--bx-blue-soft);stroke:var(--bx-blue);stroke-width:1}
.anima .node-svg .ln-man{fill:color-mix(in srgb,var(--bx-blue) 38%,var(--bx-blue-soft))}
.anima .node-svg .ln-gc{fill:color-mix(in srgb,var(--bx-blue-soft) 45%,var(--anatomy-face));stroke:color-mix(in srgb,var(--bx-blue) 50%,transparent);stroke-width:.8}
.anima .node-svg .ln-gcc{fill:none;stroke:color-mix(in srgb,var(--bx-cyto) 70%,var(--anatomy-face));stroke-width:5;stroke-linecap:round}
.anima .node-svg .ln-gcn{fill:none;stroke:color-mix(in srgb,var(--bx-nuc) 60%,var(--anatomy-face));stroke-width:2.6;stroke-linecap:round}
.anima .node-svg .ln-fdcs{fill:none;stroke:var(--bx-violet);stroke-width:.9;stroke-linecap:round}
.anima .node-svg .ln-ring{fill:none;stroke:var(--anatomy-lit);stroke-width:2;stroke-dasharray:4 3}
.anima .node-svg .ln-hevw{fill:var(--bx-cyto);stroke:var(--bx-blood);stroke-width:1}
.anima .node-svg .ln-hevc{fill:none;stroke:var(--bx-nuc);stroke-width:2.4;stroke-linecap:round}
.anima .node-svg .ln-hevl{fill:var(--bx-blood-soft);stroke:var(--bx-blood);stroke-width:.6}
.anima .node-svg .ln-mac{fill:color-mix(in srgb,var(--bx-eosin) 70%,var(--bx-cyto));stroke:var(--bx-cyto-line);stroke-width:.8}
.anima .node-svg .ln-macn{fill:var(--bx-nuc)}
.anima .node-svg .ln-tw{fill:none;stroke-linecap:round;stroke-linejoin:round}
.anima .node-svg .ln-tl{fill:none;stroke-linecap:round;stroke-linejoin:round}
.anima .node-svg .ln-tw.ln-ly{stroke:var(--bx-ins);stroke-width:10}
.anima .node-svg .ln-tl.ln-ly{stroke:var(--bx-ins-soft);stroke-width:7}
.anima .node-svg .ln-tw.ln-ar{stroke:var(--bx-blood);stroke-width:7.5}
.anima .node-svg .ln-tl.ln-ar{stroke:var(--bx-blood-soft);stroke-width:3.6}
.anima .node-svg .ln-tw.ln-ar2{stroke-width:4.6}
.anima .node-svg .ln-tl.ln-ar2{stroke-width:1.8}
.anima .node-svg .ln-tw.ln-vn{stroke:color-mix(in srgb,var(--bx-blood) 55%,var(--bx-violet));stroke-width:10}
.anima .node-svg .ln-tl.ln-vn{stroke:color-mix(in srgb,var(--bx-blood-soft) 70%,var(--bx-violet-soft));stroke-width:7}
.anima .node-svg .ln-valve{fill:none;stroke:var(--bx-ins);stroke-width:1.3;stroke-linejoin:round}
.anima .node-svg .ln-cutl{fill:var(--bx-ins-soft);stroke:var(--bx-ins);stroke-width:1.4}
.anima .node-svg .ln-cuta{fill:var(--bx-blood-soft);stroke:var(--bx-blood);stroke-width:1.4}
.anima .node-svg .ln-cutv{fill:color-mix(in srgb,var(--bx-blood-soft) 70%,var(--bx-violet-soft));stroke:color-mix(in srgb,var(--bx-blood) 55%,var(--bx-violet));stroke-width:1.4}
.anima .node-svg .ln-lit{fill:none;stroke:var(--anatomy-lit);stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round;opacity:.5}
.anima .node-svg .ln-pt{pointer-events:none}
.anima .node-svg .ln-ag{fill:var(--bx-stim);stroke:var(--surface);stroke-width:.7;stroke-linejoin:round}
.anima .node-svg .ln-lyf{fill:var(--bx-ins);opacity:.7}
.anima .node-svg .ln-rbc{fill:var(--bx-blood);stroke:var(--surface);stroke-width:.5}
.anima .node-svg .ln-cB{fill:var(--bx-blue);stroke:var(--surface);stroke-width:1}
.anima .node-svg .ln-cT{fill:var(--bx-gold);stroke:var(--surface);stroke-width:1}
.anima .node-svg .ln-cn{fill:var(--bx-nuc-line)}
.anima .node-svg .ln-ab{fill:none;stroke:var(--bx-blue);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.anima .node-svg .ln-dcb{fill:var(--bx-violet);stroke:var(--surface);stroke-width:.8}
.anima .node-svg .ln-dcp{fill:none;stroke:var(--bx-violet);stroke-width:1.4;stroke-linecap:round}
.anima .node-svg .ln-swB{fill:var(--bx-blue-soft);stroke:var(--bx-blue);stroke-width:1}
.anima .node-svg .ln-swT{fill:var(--bx-gold-soft);stroke:var(--bx-gold);stroke-width:1}
.anima .node-svg .ln-lw{fill:none;stroke:var(--bx-ins);stroke-width:7;stroke-linecap:round}
.anima .node-svg .ln-ll{fill:none;stroke:var(--bx-ins-soft);stroke-width:4;stroke-linecap:round}
.anima .node-svg .ln-zoom{fill:none;stroke:var(--anatomy-mid);stroke-width:1;stroke-dasharray:3 3}
.anima .node-svg .ln-zr{fill:none;stroke:var(--anatomy-mid);stroke-width:1.2}
.anima .node-svg .ln-ibg{fill:var(--anatomy-face);stroke:var(--anatomy-lo);stroke-width:1.2}
.anima .node-svg .ln-igc{fill:color-mix(in srgb,var(--bx-blue-soft) 45%,var(--anatomy-face))}
.anima .node-svg .ln-ihev{fill:color-mix(in srgb,var(--bx-gold-soft) 80%,var(--anatomy-face))}
.anima .node-svg .ln-inset.is-on .ln-ibg{stroke:var(--anatomy-lit);stroke-width:2}
.anima .node-svg .ln-imant{fill:color-mix(in srgb,var(--bx-blue) 30%,var(--bx-blue-soft))}
.anima .node-svg .ln-ims{fill:none;stroke:color-mix(in srgb,var(--bx-cyto) 60%,var(--anatomy-face));stroke-width:5.6;stroke-linecap:round}
.anima .node-svg .ln-imn{fill:none;stroke:var(--bx-nuc);stroke-width:4;stroke-linecap:round}
.anima .node-svg .ln-ibc{fill:color-mix(in srgb,var(--bx-cyto) 75%,var(--anatomy-face));stroke:var(--bx-cyto-line);stroke-width:.8}
.anima .node-svg .ln-ibn{fill:var(--bx-nuc);stroke:var(--bx-nuc-line);stroke-width:.6}
.anima .node-svg .ln-ibn2{fill:color-mix(in srgb,var(--bx-nuc) 55%,var(--anatomy-face));stroke:var(--bx-nuc-line);stroke-width:.6}
.anima .node-svg .ln-inuc{fill:var(--bx-nuc-line)}
.anima .node-svg .ln-fdcp{fill:none;stroke:var(--bx-violet);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.anima .node-svg .ln-fdcb{fill:var(--bx-violet-soft);stroke:var(--bx-violet);stroke-width:1.4}
.anima .node-svg .ln-fdcn{fill:color-mix(in srgb,var(--bx-violet) 45%,var(--bx-violet-soft))}
.anima .node-svg .ln-iy{fill:none;stroke:var(--bx-blue);stroke-width:1.3;stroke-linecap:round}
.anima .node-svg .ln-iag{fill:var(--bx-stim);stroke:var(--surface);stroke-width:.5}
.anima .node-svg .ln-its{fill:none;stroke:color-mix(in srgb,var(--bx-gold) 55%,var(--anatomy-face));stroke-width:8;stroke-linecap:round}
.anima .node-svg .ln-itn{fill:none;stroke:var(--bx-nuc);stroke-width:5.4;stroke-linecap:round}
.anima .node-svg .ln-ibm{fill:none;stroke:var(--bx-cyto-line);stroke-width:1.2}
.anima .node-svg .ln-ilum{fill:var(--bx-blood-soft)}
.anima .node-svg .ln-iendo{fill:var(--bx-cyto);stroke:var(--bx-cyto-line);stroke-width:1}
.anima .node-svg .ln-iendn{fill:var(--bx-nuc);stroke:var(--bx-nuc-line);stroke-width:.6}
.anima .node-svg .ln-irbc{fill:var(--bx-blood)}
.anima .node-svg .ln-irbc2{fill:color-mix(in srgb,var(--bx-blood) 55%,var(--bx-blood-soft))}
.anima .node-svg .ln-ixl{fill:var(--bx-gold);stroke:var(--anatomy-hi);stroke-width:.8}
.anima .node-svg .ln-ixn{fill:var(--bx-nuc)}
`,
  });
}
