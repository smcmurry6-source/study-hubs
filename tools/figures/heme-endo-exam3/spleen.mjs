// Fig: the spleen's white and red pulp (L19 Introduction to Hematology, Dr. Herr: "The spleen", "White pulp and red
// pulp", "Blood flow through the spleen" and "The splenic sinuses"). A block of spleen with the capsule on top: a
// trabecula from the capsule carries the trabecular artery, whose branch runs through the white pulp as the central
// arteriole, wrapped in its PALS (T cells, gold), pushed off to one side by a B cell nodule (blue) with a germinal center,
// the whole island ringed by the marginal zone, with marginal sinuses at its edge. In the red pulp, penicillar arterioles
// leave the white pulp and end in sheathed capillaries: one empties into a splenic cord (open), one drains straight into
// a sinus (closed); the sinuses drain into a trabecular vein in a second trabecula. Below, a sinus magnified: cut across
// (rod-shaped endothelial cells with slits between them, strands of basal lamina, a macrophage's process, a red cell
// squeezing through a slit), and seen from outside (staves and hoops of a leaky barrel). Step through the open route,
// then the closed one. Schematic, not to scale.
import { makeFig, f1, T, L, HOT } from "./shared.mjs";

/* ---------- build-time geometry ---------- */
const W = 460, H = 572;
const BX0 = 4, BX1 = 344, CAP0 = 44, CAP1 = 53, BY1 = 318;
const TA = 24, TB = 330; /* trabeculae centers */
const WC = [132, 186], WRX = 80, WRY = 68, MZ = 12; /* white pulp ellipse and the marginal zone around it */
const NOD = [140, 210], NR = 40, GC = [140, 204], GR = 22; /* the B cell nodule and its germinal center */
const AY = 152; /* the central arteriole runs level at this height */
const S1X = 294, S2Y = 284; /* the vertical and horizontal sinuses */
function rng(seed) { let a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
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
const dotD = (pts) => pts.map((q) => "M" + f1(q[0]) + " " + f1(q[1]) + "h0").join("");
const inEll = (p, c, rx, ry) => Math.pow((p[0] - c[0]) / rx, 2) + Math.pow((p[1] - c[1]) / ry, 2) < 1;
const ellPt = (c, rx, ry, a) => [c[0] + rx * Math.cos(a), c[1] + ry * Math.sin(a)];
function ellD(c, rx, ry) { return "M" + f1(c[0] - rx) + " " + f1(c[1]) + "A" + f1(rx) + " " + f1(ry) + " 0 1 0 " + f1(c[0] + rx) + " " + f1(c[1]) + "A" + f1(rx) + " " + f1(ry) + " 0 1 0 " + f1(c[0] - rx) + " " + f1(c[1]) + "Z"; }
function segDist(p, a, b) { const vx = b[0] - a[0], vy = b[1] - a[1], u = Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / (vx * vx + vy * vy))); return Math.hypot(p[0] - a[0] - u * vx, p[1] - a[1] - u * vy); }
const nearPath = (p, path, pad) => { for (let i = 1; i < path.length; i++) if (segDist(p, path[i - 1], path[i]) < pad) return true; return false; };

/* ---------- page helpers (serialized into the page) ---------- */
function spD(p) { var o = "", i; for (i = 0; i < p.length; i++) o += (i ? "L" : "M") + f1(p[i][0]) + " " + f1(p[i][1]); return o; }
function spLen(p) { var s = 0, i; for (i = 1; i < p.length; i++) s += Math.sqrt(Math.pow(p[i][0] - p[i - 1][0], 2) + Math.pow(p[i][1] - p[i - 1][1], 2)); return s; }
function spAt(p, s) {
  var i = 1, acc = 0, l = 0;
  for (; i < p.length; i++) { l = Math.sqrt(Math.pow(p[i][0] - p[i - 1][0], 2) + Math.pow(p[i][1] - p[i - 1][1], 2)); if (acc + l >= s || i === p.length - 1) break; acc += l; }
  i = Math.min(i, p.length - 1); var w = l ? Math.max(0, Math.min(1, (s - acc) / l)) : 0;
  return [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * w, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * w, Math.atan2(p[i][1] - p[i - 1][1], p[i][0] - p[i - 1][0])];
}
/* a red cell seen side on: a biconcave disc, pale in the middle */
function spRbc(x, y, a, s, cls) { return '<g class="sp-pt ' + (cls || "") + '" transform="translate(' + f1(x) + " " + f1(y) + ") rotate(" + f1(a * 57.3) + ")" + (s ? " scale(" + s + ")" : "") + '"><ellipse class="sp-rbc" rx="3.4" ry="2.4"/><ellipse class="sp-rbcc" rx="1.4" ry=".9"/></g>'; }
/* a stream of red cells along p (with no time they rest spread along it) */
function spFlow(p, n, per, t, off) {
  var o = "", tot = spLen(p), i;
  for (i = 0; i < n; i++) { var u = t ? ((t / per + i / n + (off || 0)) % 1 + 1) % 1 : ((i + 0.5) / n + (off || 0)) % 1, q = spAt(p, u * tot); o += spRbc(q[0], q[1], q[2], 0.9); }
  return o;
}
/* one red cell making the trip along p once per lap, resting at the end; at rest (no time) it sits at u0 */
function spTrip(p, t, per, u0) {
  var tot = spLen(p), u;
  if (!t) u = u0; else { var k = ((t / per) % 1 + 1) % 1; u = Math.min(1, k / 0.8); u = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; }
  var q = spAt(p, u * tot);
  return '<circle class="sp-halo" cx="' + f1(q[0]) + '" cy="' + f1(q[1]) + '" r="7"/>' + spRbc(q[0], q[1], q[2], 1.25, "sp-trk");
}
function spTube(p, cls) { var d = spD(p); return '<path class="sp-tw ' + cls + '" d="' + d + '"/><path class="sp-tl ' + cls + '" d="' + d + '"/>'; }
/* a label whose leader leaves from (sx, sy), a point beside the text that doesn't depend on its width */
function spLab(x, y, s, sx, sy, px, py, a, cls) { return '<g class="am-callout"><path class="lead" d="M' + f1(sx) + " " + f1(sy) + "L" + f1(px) + " " + f1(py) + '"/><circle class="dot" cx="' + f1(px) + '" cy="' + f1(py) + '" r="1.8"/>' + T(x, y, s, cls, a) + "</g>"; }
/* the red cell crossing the sinus wall in the close-up: u 0 out in the cord, 1 in the lumen; a dumbbell in the slit */
function spSqueeze(Q, u) {
  var a = Q.A, r = Q.R0 + (Q.R1 - Q.R0) * u, x = Q.C[0] + Math.cos(a) * r, y = Q.C[1] + Math.sin(a) * r;
  var d = Math.abs(r - Q.RW), sq = Math.max(0, 1 - d / 12), lob = 6.2 - 2 * sq, sep = 9 * sq, neck = 4.6 - 3.4 * sq;
  var g = '<g class="sp-pt" transform="translate(' + f1(x) + " " + f1(y) + ") rotate(" + f1(a * 57.3) + ')">';
  if (sq <= 0.02) return g + '<ellipse class="sp-rbc" rx="7.4" ry="5.2" transform="rotate(90)"/><ellipse class="sp-rbcc" rx="3" ry="2" transform="rotate(90)"/></g>';
  /* one outline: two lobes, one each side of the wall, joined by a narrow neck in the slit */
  var rx = lob * 0.8, h = neck / 2, P = function (x, y) { return f1(x) + " " + f1(y); };
  var d = "M" + P(-sep - rx, 0) + "C" + P(-sep - rx, -lob * 0.56) + " " + P(-sep - rx * 0.56, -lob) + " " + P(-sep, -lob) +
    "C" + P(-sep + rx * 0.7, -lob) + " " + P(-sep * 0.35, -h) + " " + P(0, -h) + "C" + P(sep * 0.35, -h) + " " + P(sep - rx * 0.7, -lob) + " " + P(sep, -lob) +
    "C" + P(sep + rx * 0.56, -lob) + " " + P(sep + rx, -lob * 0.56) + " " + P(sep + rx, 0) + "C" + P(sep + rx, lob * 0.56) + " " + P(sep + rx * 0.56, lob) + " " + P(sep, lob) +
    "C" + P(sep - rx * 0.7, lob) + " " + P(sep * 0.35, h) + " " + P(0, h) + "C" + P(-sep * 0.35, h) + " " + P(-sep + rx * 0.7, lob) + " " + P(-sep, lob) +
    "C" + P(-sep - rx * 0.56, lob) + " " + P(-sep - rx, lob * 0.56) + " " + P(-sep - rx, 0) + "Z";
  return g + '<path class="sp-rbc" d="' + d + '"/><ellipse class="sp-rbcc" cx="' + f1(-sep) + '" rx="' + f1(rx * 0.4) + '" ry="' + f1(lob * 0.4) + '"/><ellipse class="sp-rbcc" cx="' + f1(sep) + '" rx="' + f1(rx * 0.4) + '" ry="' + f1(lob * 0.4) + '"/></g>';
}

/* ---------- the fixed drawing ---------- */
function spleenArt() {
  const o = {}, R = rng(41);
  /* vessel routes */
  const ART = cr([[TA, BY1], [TA, 250], [TA, 180], [TA + 4, AY + 6], [TA + 16, AY]], 5);
  const ARTE = cr([[TA + 16, AY], [90, AY], [160, AY], [WC[0] + WRX + MZ + 6, AY]], 4);
  const FAN = [WC[0] + WRX + MZ + 6, AY];
  const P1 = cr([FAN, [242, 138], [252, 127]], 4), SC1 = [259, 120], P1E = [266, 113];
  const P2 = cr([FAN, [244, AY + 1], [254, AY + 2]], 4), SC2 = [262, AY + 3], P2E = [270, AY + 4];
  const P3 = cr([FAN, [240, 166], [248, 178]], 4), SC3 = [254, 186], P3E = [260, 194];
  const CLOSED = cr([P1E, [276, 106], [S1X - 6, 102], [S1X, 104]], 4);
  const MSR = cr([[178, AY - 1], [182, 143], [185, 136]], 4), MSL = cr([[80, AY + 2], [70, 160], [58, 170]], 4);
  /* the sinuses */
  const S1 = [[S1X, 62], [S1X, 300]], S2 = [[44, S2Y], [S1X, S2Y]], S4 = cr([[S1X, 74], [310, 72], [TB - 6, 78]], 4), S5 = cr([[S1X, 296], [310, 296], [TB - 6, 296]], 4);
  const VEIN = [[TB, 72], [TB, BY1]];
  /* routes the red cell takes */
  const CORD = cr([P3E, [266, 206], [276, 220], [S1X - 7, 230]], 5);
  const SLIT = [[S1X - 7, 230], [S1X, 233]];
  const DOWN = [[S1X, 233], [S1X, 296]].concat(S5.slice(1)).concat([[TB, 304], [TB, BY1 - 2]]);
  o.R = { ART, ARTE, P1, P2, P3, CLOSED, MSR, MSL, CORD, SLIT, DOWN, S1, S2, S4, S5, VEIN, PEN: [P1, P2, P3] };
  o.R.UP = ART.concat(ARTE.slice(1));
  o.R.OPEN = ART.concat(ARTE.slice(1), P3.slice(1), [SC3, P3E], CORD.slice(1), SLIT.slice(1), DOWN.slice(1));
  o.R.CL = ART.concat(ARTE.slice(1), P1.slice(1), [SC1, P1E], CLOSED.slice(1), [[S1X, 120], [S1X, 233]], DOWN.slice(1));
  o.SC = [SC1, SC2, SC3]; o.PE = [P1E, P2E, P3E];
  const block = (p, pad) => p[0] < BX0 + pad || p[0] > BX1 - pad || p[1] < CAP1 + pad || p[1] > BY1 - pad;
  const inTrab = (p, pad) => Math.abs(p[0] - TA) < 10 + pad || Math.abs(p[0] - TB) < 10 + pad;
  const inMZ = (p, pad) => inEll(p, WC, WRX + MZ + pad, WRY + MZ + pad);
  const inSin = (p, pad) => (Math.abs(p[0] - S1X) < 7 + pad && p[1] > 56 && p[1] < 304) || (Math.abs(p[1] - S2Y) < 7 + pad && p[0] > 38 && p[0] < S1X) || nearPath(p, S4, 7 + pad) || nearPath(p, S5, 7 + pad);
  const onVes = (p, pad) => [P1, P2, P3, CLOSED, CORD].some((q) => nearPath(p, q, pad)) || o.SC.some((c) => Math.hypot(p[0] - c[0], p[1] - c[1]) < 10 + pad);
  /* label boxes kept clear of cells */
  const keep = [[36, 60, 284, 101], [36, 296, 120, 316]];
  const inKeep = (p) => keep.some((b) => p[0] > b[0] && p[0] < b[2] && p[1] > b[1] && p[1] < b[3]);
  let s = "";
  /* red pulp: the cords fill the block; cut edges on three sides */
  const cordPts = [];
  for (let k = 0; k < 6000 && cordPts.length < 230; k++) {
    const p = [BX0 + R() * (BX1 - BX0), CAP1 + R() * (BY1 - CAP1)];
    if (block(p, 4) || inTrab(p, 2) || inMZ(p, 3) || inSin(p, 2) || onVes(p, 6) || inKeep(p)) continue;
    if (cordPts.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 7.5)) continue;
    cordPts.push(p);
  }
  /* reticular fibers: a loose meshwork between the cells */
  let ret = "";
  for (let k = 0; k < cordPts.length; k += 3) { const a = cordPts[k]; let b = null, bd = 1e9; for (const q of cordPts) { const d = Math.hypot(q[0] - a[0], q[1] - a[1]); if (d > 9 && d < bd && d < 26) { bd = d; b = q; } } if (b && !inSin([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], 1) && !inMZ([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], 1)) ret += "M" + f1(a[0]) + " " + f1(a[1]) + "L" + f1(b[0]) + " " + f1(b[1]); }
  const rbcs = cordPts.filter((q, i) => i % 5 !== 0), mcs = cordPts.filter((q, i) => i % 5 === 0 && i % 10 === 0), lys = cordPts.filter((q, i) => i % 10 === 5);
  let mac = "";
  mcs.forEach((q, j) => { const a = j * 1.3; mac += '<path class="sp-mac" d="M' + f1(q[0] - 5) + " " + f1(q[1]) + "Q" + f1(q[0] - 3) + " " + f1(q[1] - 5) + " " + f1(q[0] + 2) + " " + f1(q[1] - 4) + "Q" + f1(q[0] + 6 + Math.cos(a)) + " " + f1(q[1] - 1) + " " + f1(q[0] + 4) + " " + f1(q[1] + 4) + "Q" + f1(q[0] - 1) + " " + f1(q[1] + 6) + " " + f1(q[0] - 5) + " " + f1(q[1]) + 'Z"/><circle class="sp-macn" cx="' + f1(q[0]) + '" cy="' + f1(q[1]) + '" r="1.7"/>'; });
  o.MACS = mcs.map((q) => [f1(q[0]), f1(q[1])]);
  s += HOT(INFO.cord, '<rect class="sp-rp" x="' + BX0 + '" y="' + CAP1 + '" width="' + (BX1 - BX0) + '" height="' + (BY1 - CAP1) + '"/><path class="sp-ret" d="' + ret + '"/><path class="sp-rd" d="' + dotD(rbcs) + '"/><path class="sp-rdc" d="' + dotD(rbcs) + '"/><path class="sp-ly" d="' + dotD(lys) + '"/>' + mac);
  /* the sinuses: endothelium-lined channels with red cells in them */
  const sinD = "M" + S1[0][0] + " " + S1[0][1] + "V" + S1[1][1] + "M" + S2[0][0] + " " + S2Y + "H" + S1X + spD(S4) + spD(S5);
  s += HOT(INFO.sinus, '<path class="sp-sw" d="' + sinD + '"/><path class="sp-sl" d="' + sinD + '"/><path class="sp-sh" d="' + sinD + '"/>');
  o.SIND = sinD;
  /* the marginal zone, then the white pulp: PALS (gold) around the arteriole, the nodule (blue) beside it */
  const mzPts = [];
  for (let k = 0; k < 3000 && mzPts.length < 46; k++) { const a = R() * 2 * Math.PI, f = 1 + (R() * (MZ - 3) + 1.5) / WRX, p = [WC[0] + Math.cos(a) * WRX * f, WC[1] + Math.sin(a) * (WRY + (f - 1) * WRX)]; if (mzPts.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 8)) continue; if (nearPath(p, ARTE, 5) || nearPath(p, MSR, 4)) continue; mzPts.push(p); }
  const mzMac = mzPts.filter((q, i) => i % 3 === 0), mzB = mzPts.filter((q, i) => i % 3 !== 0);
  s += HOT(INFO.mz, '<path class="sp-mz" d="' + ellD(WC, WRX + MZ, WRY + MZ) + '"/><path class="sp-mzm" d="' + dotD(mzMac) + '"/><path class="sp-mzb" d="' + dotD(mzB) + '"/>');
  const tPts = [];
  for (let k = 0; k < 6000 && tPts.length < 120; k++) { const p = [WC[0] - WRX + R() * 2 * WRX, WC[1] - WRY + R() * 2 * WRY]; if (!inEll(p, WC, WRX - 4, WRY - 4)) continue; if (Math.hypot(p[0] - NOD[0], p[1] - NOD[1]) < NR + 3) continue; if (Math.abs(p[1] - AY) < 6) continue; if (p[0] > 82 && p[0] < 184 && p[1] > 128 && p[1] < 146) continue; if (nearPath(p, MSL, 4) || nearPath(p, MSR, 4)) continue; if (tPts.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 6.2)) continue; tPts.push(p); }
  s += HOT(INFO.pals, '<path class="sp-wp" d="' + ellD(WC, WRX, WRY) + '"/><path class="sp-td" d="' + dotD(tPts) + '"/>');
  /* the marginal sinuses: channels along the edge of the white pulp */
  s += HOT(INFO.msin, '<path class="sp-msw" d="' + ellD(WC, WRX + 2.5, WRY + 2.5) + '"/><path class="sp-msl" d="' + ellD(WC, WRX + 2.5, WRY + 2.5) + '"/>');
  const bPts = [];
  for (let k = 0; k < 4000 && bPts.length < 44; k++) { const a = R() * 2 * Math.PI, r = Math.sqrt(R()) * (NR - 3), p = [NOD[0] + Math.cos(a) * r, NOD[1] + Math.sin(a) * r]; if (Math.hypot(p[0] - GC[0], p[1] - GC[1]) < GR + 2.5) continue; if (bPts.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 5.4)) continue; bPts.push(p); }
  const gPts = [];
  for (let k = 0; k < 2000 && gPts.length < 13; k++) { const a = R() * 2 * Math.PI, r = Math.sqrt(R()) * (GR - 5), p = [GC[0] + Math.cos(a) * r, GC[1] + Math.sin(a) * r]; if (gPts.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 8)) continue; gPts.push(p); }
  s += HOT(INFO.nod, '<circle class="sp-nod" cx="' + NOD[0] + '" cy="' + NOD[1] + '" r="' + NR + '"/><path class="sp-bd" d="' + dotD(bPts) + '"/>');
  s += HOT(INFO.gc, '<circle class="sp-gc" cx="' + GC[0] + '" cy="' + GC[1] + '" r="' + GR + '"/><path class="sp-gcc" d="' + dotD(gPts) + '"/><path class="sp-gcn" d="' + dotD(gPts) + '"/>');
  /* the capsule and the trabeculae, with myofibroblasts in them */
  const trab = (x, w0, w1) => "M" + (x - w0) + " " + CAP1 + "L" + (x - w1) + " " + BY1 + "H" + (x + w1) + "L" + (x + w0) + " " + CAP1 + "Z";
  let myo = "";
  /* myofibroblast nuclei: down the middle where the trabecula is empty, beside its vessel where one runs in it */
  [TA, TB].forEach((x) => { let side = 1; for (let y = CAP1 + 12; y < BY1 - 6; y += 19) {
    const w = 11 - 3 * (y - CAP1) / (BY1 - CAP1), ves = x === TA ? y > AY - 8 : true;
    if (x === TA && Math.abs(y - AY) < 10) continue;
    const xx = ves ? x + side * (w - 2.4) : x + (R() - 0.5) * 6; side = -side;
    myo += "M" + f1(xx) + " " + f1(y - 3) + "l" + (ves ? "0 6" : "1.6 6"); } });
  let cap = "M" + BX0 + " " + CAP1 + "V" + (CAP0 + 2);
  for (let x = BX0; x <= BX1; x += 20) cap += "Q" + f1(x + 10) + " " + f1(CAP0 - 1.4) + " " + f1(Math.min(BX1, x + 20)) + " " + f1(CAP0 + 0.4);
  cap += "V" + CAP1 + "Z";
  s += HOT(INFO.trab, '<path class="sp-trab" d="' + trab(TA, 11, 8) + trab(TB, 11, 8) + '"/><path class="sp-myo" d="' + myo + '"/>');
  s += HOT(INFO.cap, '<path class="sp-cap" d="' + cap + '"/>');
  /* the block's cut faces */
  s += '<path class="sp-cut" d="M' + BX0 + " " + (CAP0 + 2) + "V" + BY1 + "H" + BX1 + "V" + (CAP0 + 2) + '"/>';
  o.BG = s;
  /* the vessels, drawn over the tissue */
  let fg = "";
  fg += HOT(INFO.vein, spTube(VEIN, "sp-vn") + '<ellipse class="sp-cutv" cx="' + TB + '" cy="' + BY1 + '" rx="4.8" ry="2"/>');
  fg += HOT(INFO.art, spTube(ART, "sp-ar") + '<ellipse class="sp-cuta" cx="' + TA + '" cy="' + BY1 + '" rx="3.8" ry="1.7"/>');
  fg += HOT(INFO.arteriole, spTube(ARTE, "sp-ar sp-ar2"));
  fg += HOT(INFO.msin, spTube(MSR, "sp-ar sp-ar3") + spTube(MSL, "sp-ar sp-ar3"));
  fg += HOT(INFO.pen, spTube(P1, "sp-ar sp-ar3") + spTube(P2, "sp-ar sp-ar3") + spTube(P3, "sp-ar sp-ar3"));
  fg += HOT(INFO.closed, spTube(CLOSED, "sp-cp"));
  /* the sheathed capillaries: a cuff of reticular fibers and macrophages; the open ones end in the cord */
  const scs = [[SC1, P1E, P1], [SC2, P2E, P2], [SC3, P3E, P3]];
  scs.forEach((z, j) => { const a = Math.atan2(z[1][1] - z[0][1], z[1][0] - z[0][0]) * 57.3;
    /* the open ones: a capillary end with red cells spilling out into the cord */
    const spill = j === 0 ? "" : spRbc(14, -3, 0.5, 0.95) + spRbc(16, 4, -0.4, 0.95) + spRbc(22, 0.5, 0.1, 0.95);
    fg += HOT(j === 0 ? INFO.sheath : INFO.open, '<g transform="translate(' + z[0][0] + " " + z[0][1] + ") rotate(" + f1(a) + ')"><ellipse class="sp-sc" rx="9.5" ry="5.6"/><path class="sp-scm" d="M-5 -2.6h0M0 -3.4h0M5 -2.4h0M-4 2.8h0M2 3.2h0"/><path class="sp-scl" d="M-9.5 0H' + (j === 0 ? "9.5" : "8") + '"/>' + spill + "</g>"); });
  /* venules: the sinuses drain through the trabecula's edge into the trabecular vein */
  const sinV = spD(S4.filter((q) => q[0] > 312)) + spD(S5.filter((q) => q[0] > 312));
  o.FG = '<path class="sp-sw sp-v" d="' + sinV + '"/><path class="sp-sl sp-v" d="' + sinV + '"/>' + fg;
  /* where the labels point */
  o.LB = {
    cap: [300, CAP0 + 4], trab: [TB + 3, 62], closed: [278, 106], pen: [242, 138], sheath: [SC2[0] + 2, SC2[1] - 1], open: [P3E[0] + 1, P3E[1] + 1],
    sinus: [S1X, 258], cord: [262, 246], vein: [TB + 3, BY1 - 9], art: [TA, BY1 + 2], msin: [185, 137], arteriole: [100, AY],
    wp: [72, 206], nod: [NOD[0] + 18, NOD[1] + NR - 6], mz: [110, 114], gc: GC,
  };
  return o;
}

/* ---------- the close-up of a sinus ---------- */
const PY0 = 382, PY1 = 566, LX0 = 4, LX1 = 226, RX0 = 234, RX1 = 456;
function crossSection() {
  const R = rng(5), C = [118, 470], RI = 24, RW = 31, RO = 38, n = 11, A0 = -0.7;
  let o = '<rect class="sp-pbg" x="' + LX0 + '" y="' + PY0 + '" width="' + (LX1 - LX0) + '" height="' + (PY1 - PY0) + '" rx="10"/>';
  /* the cord around it: red cells and reticular fibers */
  const pts = [];
  for (let k = 0; k < 4000 && pts.length < 54; k++) { const p = [LX0 + 8 + R() * (LX1 - LX0 - 16), PY0 + 8 + R() * (PY1 - PY0 - 16)]; if (Math.hypot(p[0] - C[0], p[1] - C[1]) < RO + 9) continue; if (p[1] < PY0 + 36 || p[1] > PY1 - 30) continue; if (p[0] < LX0 + 48 && p[1] > C[1] - 12 && p[1] < C[1] + 12) continue; if (Math.hypot(p[0] - 56, p[1] - 426) < 18) continue; const ra = A0 + 0; const q = [C[0] + Math.cos(ra) * 60, C[1] + Math.sin(ra) * 60]; if (Math.hypot(p[0] - q[0], p[1] - q[1]) < 14) continue; if (pts.some((z) => Math.hypot(z[0] - p[0], z[1] - p[1]) < 13)) continue; pts.push(p); }
  let rb = "", ret = "";
  pts.forEach((p, j) => { if (j % 4 === 3) return; rb += spRbc(p[0], p[1], R() * 3, 1.5); });
  pts.forEach((p, j) => { if (j % 2) return; let b = null, bd = 1e9; for (const q of pts) { const d = Math.hypot(q[0] - p[0], q[1] - p[1]); if (d > 12 && d < bd) { bd = d; b = q; } } if (b && bd < 40) ret += "M" + f1(p[0]) + " " + f1(p[1]) + "L" + f1(b[0]) + " " + f1(b[1]); });
  o += HOT(INFO.cord, '<path class="sp-ret2" d="' + ret + '"/>' + rb);
  /* the lumen, with red cells */
  o += HOT(INFO.sinus, '<circle class="sp-plum" cx="' + C[0] + '" cy="' + C[1] + '" r="' + (RI + 1) + '"/>' + spRbc(C[0] - 9, C[1] + 8, 0.4, 1.5) + spRbc(C[0] + 4, C[1] - 10, 2.2, 1.5));
  /* rod-shaped endothelial cells cut across, slits between them; strands of basal lamina outside */
  let cells = "", bl = "";
  const span = 2 * Math.PI / n, gap = 0.1;
  for (let k = 0; k < n; k++) {
    const a0 = A0 + k * span + gap / 2, a1 = A0 + (k + 1) * span - gap / 2, am = (a0 + a1) / 2;
    const p = (a, r) => f1(C[0] + Math.cos(a) * r) + " " + f1(C[1] + Math.sin(a) * r);
    cells += '<path class="sp-endo" d="M' + p(a0 + 0.04, RI) + "A" + RI + " " + RI + " 0 0 1 " + p(a1 - 0.04, RI) + "Q" + p(a1 + 0.02, (RI + RO) / 2) + " " + p(a1 - 0.04, RO) + "A" + RO + " " + RO + " 0 0 0 " + p(a0 + 0.04, RO) + "Q" + p(a0 - 0.02, (RI + RO) / 2) + " " + p(a0 + 0.04, RI) + 'Z"/>';
    if (k % 3 === 1) cells += '<ellipse class="sp-endn" cx="' + f1(C[0] + Math.cos(am) * 31) + '" cy="' + f1(C[1] + Math.sin(am) * 31) + '" rx="3.4" ry="4.6" transform="rotate(' + f1(am * 57.3) + " " + f1(C[0] + Math.cos(am) * 31) + " " + f1(C[1] + Math.sin(am) * 31) + ')"/>';
  }
  /* basal lamina: strands, not a continuous layer (this cut catches parts of two hoops) */
  [[-0.25, 1.35], [2.05, 3.15], [3.75, 4.75]].forEach((z) => { const r = RO + 2.2, p = (a) => f1(C[0] + Math.cos(a) * r) + " " + f1(C[1] + Math.sin(a) * r); bl += "M" + p(z[0]) + "A" + r + " " + r + " 0 0 1 " + p(z[1]); });
  o += HOT(INFO.rod, cells) + HOT(INFO.hoop, '<path class="sp-bl" d="' + bl + '"/>');
  /* a macrophage in the cord whose process reaches between two endothelial cells */
  const sl = A0 + 8 * span, sx = C[0] + Math.cos(sl) * (RI + 2), sy = C[1] + Math.sin(sl) * (RI + 2), mx = 52, my = 424;
  o += HOT(INFO.mac, '<path class="sp-macp" d="M' + mx + " " + my + "Q" + f1((mx + sx) / 2 + 6) + " " + f1((my + sy) / 2 - 8) + " " + f1(sx) + " " + f1(sy) + '"/><path class="sp-mac2" d="M' + (mx - 13) + " " + my + "Q" + (mx - 11) + " " + (my - 11) + " " + (mx + 1) + " " + (my - 10) + "Q" + (mx + 13) + " " + (my - 7) + " " + (mx + 12) + " " + (my + 3) + "Q" + (mx + 9) + " " + (my + 12) + " " + (mx - 2) + " " + (my + 11) + "Q" + (mx - 13) + " " + (my + 10) + " " + (mx - 13) + " " + my + 'Z"/><ellipse class="sp-macn2" cx="' + (mx - 1) + '" cy="' + (my + 1) + '" rx="5" ry="4"/>');
  /* where the other labels point: a slit (the gap between two cells, at a k boundary) */
  const sa = A0 + 3 * span, slit = [f1(C[0] + Math.cos(sa) * (RW + 1)), f1(C[1] + Math.sin(sa) * (RW + 1))];
  return { svg: o, Q: { C, A: A0, R0: 64, R1: 6, RW }, SLIT: slit, MAC: [mx - 4, my - 4], LUM: [C[0] - 2, C[1] + 16] };
}
function barrel() {
  const C = [345, 468], RR = 40, XL = 256, XR = 436, n = 12, HO = [282, 326, 370, 414];
  let o = '<rect class="sp-pbg" x="' + RX0 + '" y="' + PY0 + '" width="' + (RX1 - RX0) + '" height="' + (PY1 - PY0) + '" rx="10"/>';
  /* the lumen seen through the slits, darker toward the edges */
  o += '<rect class="sp-blum" x="' + XL + '" y="' + (C[1] - RR) + '" width="' + (XR - XL) + '" height="' + (2 * RR) + '" rx="6"/>';
  /* staves: rod-shaped cells running lengthwise; seen on a cylinder, the ones near the edges look thinner */
  let st = "", nuc = "", slits = [];
  for (let k = 0; k < n; k++) {
    const t0 = -Math.PI / 2 + k * Math.PI / n + 0.035, t1 = -Math.PI / 2 + (k + 1) * Math.PI / n - 0.035;
    const y0 = C[1] + RR * Math.sin(t0), y1 = C[1] + RR * Math.sin(t1), h = y1 - y0, ym = (y0 + y1) / 2;
    if (k) slits.push(C[1] + RR * Math.sin(-Math.PI / 2 + k * Math.PI / n));
    /* two cells end to end along each stave, staggered row by row */
    const cut = k % 2 ? 330 : 372, cls = k < 2 || k > n - 3 ? "sp-stave sp-st2" : "sp-stave";
    st += '<rect class="' + cls + '" x="' + (XL + 2) + '" y="' + f1(y0) + '" width="' + (cut - XL - 4) + '" height="' + f1(h) + '" rx="' + f1(Math.min(h / 2, 3)) + '"/>';
    st += '<rect class="' + cls + '" x="' + (cut + 1) + '" y="' + f1(y0) + '" width="' + (XR - cut - 3) + '" height="' + f1(h) + '" rx="' + f1(Math.min(h / 2, 3)) + '"/>';
    if (h > 4.5) { const nx = k % 2 ? 300 : 404; nuc += '<ellipse class="sp-stn" cx="' + nx + '" cy="' + f1(ym) + '" rx="8" ry="' + f1(Math.max(1.2, h / 2 - 1.4)) + '"/>'; }
  }
  /* the open end of the tube, so it reads as a vessel */
  o += HOT(INFO.rod, st + nuc + '<ellipse class="sp-bend" cx="' + XL + '" cy="' + C[1] + '" rx="6" ry="' + RR + '"/><ellipse class="sp-bendi" cx="' + XL + '" cy="' + C[1] + '" rx="3.4" ry="' + (RR - 4) + '"/>');
  /* hoops of basal lamina at right angles around the staves */
  let hp = "";
  HO.forEach((x) => { hp += '<path class="sp-hoop" d="M' + x + " " + f1(C[1] - RR - 2) + "Q" + (x + 3) + " " + C[1] + " " + x + " " + f1(C[1] + RR + 2) + '"/>'; });
  o += HOT(INFO.hoop, hp);
  /* where the labels point */
  const slitY = slits[7];
  return { svg: o, ROD: [300, f1(C[1] + RR * Math.sin(-Math.PI / 2 + 4.5 * Math.PI / n))], HOOP: [HO[2] + 2, f1(C[1] + RR - 6)], SLIT: [392, f1(slitY)], TOP: C[1] - RR, BOT: C[1] + RR };
}

/* ---------- the steps ---------- */
const STEPS = [
  { ch: 0, ro: "white pulp · red pulp",
    say: "A block of spleen under its capsule. The white pulp is an island of lymphoid tissue around a central arteriole: the PALS (mainly T cells, gold) wrapped around the arteriole, a B cell nodule (blue) farther out that pushes the arteriole to one side, and the marginal zone around it all. The red pulp, most of the spleen, is the splenic cords and the sinuses between them. Follow the blood with Open route or Closed route." },
  { ch: 1, ro: "open 1/5 · into the white pulp",
    say: "The open route, 1 of 5: the splenic artery enters at the hilum and divides into trabecular arteries, which branch and enter the white pulp as central arterioles, with two layers of smooth muscle and the cuff of lymphocytes that forms the PALS. Some branches end in marginal sinuses at the edge of the white pulp, supplying the marginal zone." },
  { ch: 1, ro: "open 2/5 · penicillar → sheathed",
    say: "2 of 5: other branches continue into the red pulp as short, straight penicillar arterioles, which drain into sheathed capillaries, wrapped in a sheath of reticular fibers and many macrophages. (His slide puts \"(PALS)\" after the sheathed capillaries; the PALS is the T cell sheath in the white pulp.)" },
  { ch: 1, ro: "open 3/5 · into a cord",
    say: "3 of 5, the open circulation: the sheathed capillary empties directly into the reticular meshwork of a splenic cord, not into an endothelium-lined sinus. The blood seeps slowly between the cords, where macrophages sample it." },
  { ch: 1, ro: "open 4/5 · through a slit",
    say: "4 of 5: the blood reenters the circulation through the splenic sinuses. Their walls are rod-shaped, loosely packed endothelial cells with slit-like spaces between them, and blood cells cross by squeezing through the slits (magnified below)." },
  { ch: 1, ro: "open 5/5 · out by the trabecular vein",
    say: "5 of 5: the sinuses drain into larger venules, then the trabecular veins, which merge into the splenic vein that leaves at the hilum." },
  { ch: 6, ro: "closed · straight into a sinus",
    say: "The closed route: the capillary drains straight into a sinus, with no stop in the cords. His circulation slide teaches the open route, but his notes on the next slide say about 90 percent of red pulp capillaries drain straight into the sinuses. Know what each route is." },
];
const INFO = {
  cap: "Capsule: dense connective tissue. It sends trabeculae, which contain myofibroblasts, into the organ. The spleen filters blood and responds to blood-borne infections; it has no afferent lymphatics.",
  trab: "Trabecula: from the capsule into the spleen, with myofibroblasts. Trabecular arteries and veins run in the trabeculae. Between them is a network of reticular fibers with macrophages and reticular cells attached.",
  art: "Trabecular artery: the splenic artery enters at the hilum and divides into trabecular arteries, which branch and enter the white pulp as the central arterioles.",
  arteriole: "Central arteriole: it comes from the splenic artery after many treelike branchings, with two layers of smooth muscle and the cuff of lymphocytes that forms the PALS. A central arteriole means the spleen's white pulp.",
  pals: "PALS, the periarteriolar lymphatic sheath: the lymphocytes wrapped around the central arteriole, mainly T cells. With the nodules, it is the white pulp: islands of lymphoid tissue around a central arteriole.",
  nod: "Lymphoid nodule: the B cells, farther out in the white pulp. Primary nodules, or secondary ones with germinal centers, as in the lymph nodes. A nodule pushes the arteriole off to one side.",
  gc: "Germinal center of a secondary nodule, as in the lymph nodes: where its B cells proliferate.",
  mz: "Marginal zone: a shell of sparsely cellular lymphoid tissue around the white pulp, with macrophages and some B cells. The marginal sinuses supply it.",
  msin: "Marginal sinuses: some branches of a central arteriole end here, at the edge of the white pulp, supplying the marginal zone.",
  pen: "Penicillar arterioles: short, straight branches of the central arteriole that continue into the red pulp and drain into sheathed capillaries.",
  sheath: "Sheathed capillary: wrapped in a sheath of reticular fibers and many macrophages, in the red pulp. His slide labels these \"(PALS)\", but the PALS is the T cell sheath around the central arteriole in the white pulp.",
  open: "Open circulation: the sheathed capillary empties directly into the reticular meshwork of a splenic cord, not into an endothelium-lined sinus. Macrophages sample the blood as it seeps between the cords.",
  closed: "Closed route: the capillary drains straight into a sinus. His notes say about 90 percent of red pulp capillaries drain this way; his circulation slide teaches the open route.",
  cord: "Splenic cords (cords of Billroth), red pulp: spaces between the sinuses with a scaffold of reticular fibers, holding reticular cells, lymphocytes, plasma cells, macrophages and all the formed elements of the blood. The red pulp's color comes from its many red cells.",
  sinus: "Splenic sinus, red pulp: a thin-walled venous sinusoid. Red pulp is these sinuses with the splenic cords between them, and it makes up most of the spleen.",
  vein: "Trabecular vein: the sinuses drain into larger venules, then the trabecular veins, which merge into the splenic vein that leaves at the hilum.",
  rod: "Rod-shaped, loosely packed endothelial cells run lengthwise along the sinus, with slit-like spaces between them, like the staves of a leaky barrel.",
  hoop: "Basal lamina: only strands, looping around the endothelial cells at right angles, like the hoops around the staves of a leaky barrel. No smooth muscle and no pericytes.",
  mac: "Macrophage: its processes reach between the endothelial cells to monitor the passing blood for foreign antigens.",
  rbc: "A red cell squeezing through a slit between two endothelial cells, from the cord back into the sinus. That is how blood cells cross the sinus wall.",
};

/* ---------- live drawing ---------- */
function spRender(st, D) {
  var t = st.t || 0, s = st.s, o = D.BG, R = D.R, LB = D.LB, i, f = "", lit = [];
  st.ch = D.STEPS[s].ch;
  /* blood always drifts along the sinuses */
  f += spFlow(R.S2, 4, 9000, t, 0) + spFlow([[R.S1[0][0], 64], [R.S1[0][0], 296]], 5, 9000, t, 0.3);
  if (s === 1) { lit = [R.UP, R.MSR, R.MSL]; f += spFlow(R.UP, 7, 4000, t, 0) + spFlow(R.MSR, 2, 2400, t, 0) + spFlow(R.MSL, 2, 2400, t, 0.5); }
  if (s === 2) { lit = R.PEN; for (i = 0; i < 3; i++) f += spFlow(R.PEN[i], 2, 2000, t, i / 3); }
  if (s === 3) lit = [R.CORD];
  if (s === 4) lit = [R.CORD.slice(-3).concat(R.SLIT.slice(1))];
  if (s === 5) lit = [R.DOWN];
  if (s === 6) lit = [R.P1, R.CLOSED, [[R.S1[0][0], 104], [R.S1[0][0], 233]], R.DOWN];
  o += D.FG;
  for (i = 0; i < lit.length; i++) o += '<path class="sp-lit" d="' + spD(lit[i]) + '"/>';
  o += f;
  /* the tracked red cell */
  if (s >= 1 && s <= 5) {
    var seg = [R.UP, R.PEN[2].concat([D.SC[2], D.PE[2]]), R.CORD, R.CORD.slice(-2).concat(R.SLIT.slice(1)), R.DOWN][s - 1];
    o += spTrip(seg, t, s === 3 ? 4200 : 3200, s === 4 ? 1 : 0.6);
  }
  if (s === 6) o += spTrip(R.CL, t, 7000, 0.62);
  /* ---------- labels ---------- */
  function on(a) { return a.indexOf(s) >= 0 ? " sp-on" : ""; }
  var X = 352;
  o += L(X, 32, "capsule", LB.cap[0], LB.cap[1], "start", "sp-l b");
  o += L(X, 60, "trabecula", LB.trab[0], LB.trab[1], "start", "sp-l b");
  o += L(X, 92, "closed: into", LB.closed[0], LB.closed[1], "start", "sp-l b" + on([6])) + T(X, 108, "a sinus", "sp-l b" + on([6]), "start");
  o += L(X, 136, "penicillar", LB.pen[0], LB.pen[1], "start", "sp-l b" + on([2])) + T(X, 152, "arterioles", "sp-l b" + on([2]), "start");
  o += L(X, 178, "sheathed", LB.sheath[0], LB.sheath[1], "start", "sp-l b" + on([2])) + T(X, 194, "capillary", "sp-l b" + on([2]), "start");
  o += L(X, 220, "open: into", LB.open[0], LB.open[1], "start", "sp-l b" + on([3])) + T(X, 236, "a cord", "sp-l b" + on([3]), "start");
  o += L(X, 262, "sinus", LB.sinus[0], LB.sinus[1], "start", "sp-l b" + on([4, 5]));
  o += L(X, 288, "splenic cord", LB.cord[0], LB.cord[1], "start", "sp-l b" + on([3]));
  o += L(X, 316, "trabecular", LB.vein[0], LB.vein[1], "start", "sp-l b" + on([5])) + T(X, 332, "vein", "sp-l b" + on([5]), "start");
  o += spLab(40, 76, "central arteriole", 47, 80, LB.arteriole[0], LB.arteriole[1], "start", "sp-l b" + on([1]));
  o += spLab(178, 76, "marginal sinus", 236, 80, LB.msin[0], LB.msin[1], "start", "sp-l b" + on([1]));
  o += spLab(88, 97, "marginal zone", 100, 101, LB.mz[0], LB.mz[1], "start", "sp-l b");
  o += T(D.WC[0], 143, "PALS: T cells", "sp-l sp-tt", "middle");
  o += T(42, 311, "red pulp", "sp-l sp-reg", "start");
  o += spLab(4, 342, "trabecular artery", 16, 329, LB.art[0], LB.art[1], "start", "sp-l b" + on([1]));
  o += spLab(132, 342, "white pulp", 150, 329, LB.wp[0], LB.wp[1], "start", "sp-l sp-reg2");
  o += spLab(218, 342, "B cell nodule", 230, 329, LB.nod[0], LB.nod[1], "start", "sp-l sp-bt");
  /* ---------- the close-up ---------- */
  o += T(D.LX0 + 2, D.PY0 - 8, "a sinus cut across", "sp-l sp-ttl", "start") + T(D.RX1 - 2, D.PY0 - 8, "its wall from outside", "sp-l sp-ttl", "end");
  o += '<g class="' + (s === 4 ? "sp-panel is-on" : "sp-panel") + '">' + D.XS + "</g>";
  var u = s === 4 && t ? Math.min(1, ((t / 3600) % 1) / 0.82) : (s === 5 || s === 6 ? 1 : 0.46);
  o += HOT(D.INFO.rbc, '<g class="sp-sq">' + spSqueeze(D.Q, u) + "</g>");
  o += '<g class="sp-panel">' + D.BR + "</g>";
  var Q = D.Q;
  o += spLab(D.LX0 + 8, D.PY0 + 20, "macrophage", D.LX0 + 30, D.PY0 + 25, D.MAC[0], D.MAC[1], "start", "sp-l b");
  var rq = [Q.C[0] + Math.cos(Q.A) * (Q.R0 + (Q.R1 - Q.R0) * 0.46) + 6, Q.C[1] + Math.sin(Q.A) * (Q.R0 + (Q.R1 - Q.R0) * 0.46) - 6];
  o += T(D.LX1 - 8, D.PY0 + 20, "red cell", "sp-l b" + on([4]), "end") + spLab(D.LX1 - 8, D.PY0 + 36, "squeezing", D.LX1 - 30, D.PY0 + 41, rq[0], rq[1], "end", "sp-l b" + on([4]));
  o += spLab(D.LX1 - 8, D.PY1 - 10, "slit", D.LX1 - 20, D.PY1 - 25, D.SLIT[0], D.SLIT[1], "end", "sp-l b" + on([4]));
  o += T(D.LX0 + 8, D.PY1 - 10, "cord", "sp-l sp-reg", "start") + T(Q.C[0], Q.C[1] + 4, "sinus", "sp-l sp-lum", "middle");
  o += spLab(D.RX0 + 8, D.PY0 + 20, "rod-shaped endothelial", D.RX0 + 44, D.PY0 + 42, D.ROD[0], D.ROD[1], "start", "sp-l b") + T(D.RX0 + 8, D.PY0 + 36, "cells, lengthwise", "sp-l b", "start");
  o += spLab(D.RX1 - 8, D.BOT + 16, "slits", D.RX1 - 20, D.BOT + 4, D.BSLIT[0], D.BSLIT[1], "end", "sp-l b" + on([4]));
  o += spLab(D.RX0 + 8, D.BOT + 16, "basal lamina hoops", D.RX0 + 80, D.BOT + 4, D.HOOP[0], D.HOOP[1], "start", "sp-l b");
  o += T(D.RX0 + 8, D.PY1 - 25, "no smooth muscle,", "sp-l sp-no", "start") + T(D.RX0 + 8, D.PY1 - 9, "no pericytes", "sp-l sp-no", "start");
  return o;
}
function spSay(st, D) { var S = D.STEPS[st.s]; return [S.say, S.ro]; }
function spOnset(st, k, D) { if (k === "ch") st.s = st.ch; }

export default function spleen() {
  const A = spleenArt(), X = crossSection(), B = barrel();
  const D = Object.assign({}, A, {
    STEPS, INFO, XS: X.svg, Q: X.Q, SLIT: X.SLIT, MAC: X.MAC, BR: B.svg, ROD: B.ROD, HOOP: B.HOOP, BSLIT: B.SLIT, BOT: B.BOT,
    LX0, LX1, RX0, RX1, PY0, PY1, WC,
    ANIM: true, PLAYMS: 4600, INIT: { s: 0, ch: 0 }, STEPKEY: "s", STEPMAX: 6, ONSET: "spOnset",
  });
  return makeFig({
    id: "spleen", lec: "hemeintro", fig: "Fig 17", short: "The spleen", hint: "step · hover",
    title: "The spleen's white and red pulp",
    caption: "White pulp (the PALS of T cells around a central arteriole, a B cell nodule, the marginal zone) and red pulp (cords and sinuses). Follow a red cell through the open route and squeeze it through a slit in a sinus wall, or take the closed route.",
    W, H,
    label: "A block of spleen: the capsule on top, a trabecula carrying the trabecular artery, the white pulp with the central arteriole in its T cell sheath (PALS), a B cell nodule with a germinal center, the marginal zone and marginal sinuses; the red pulp's splenic cords and sinuses, penicillar arterioles ending in sheathed capillaries, one emptying into a cord (open) and one into a sinus (closed), and the trabecular vein. Below, a sinus cut across, with rod-shaped endothelial cells, slits, strands of basal lamina, a macrophage process and a red cell squeezing through a slit, and the sinus wall seen from outside as staves and hoops.",
    D, render: spRender, say: spSay, helpers: [spD, spLen, spAt, spRbc, spFlow, spTrip, spTube, spLab, spSqueeze, spOnset],
    controls: `<div class="am-controls" role="group" aria-label="Route">${[[0, "White and red pulp"], [1, "Open route"], [6, "Closed route"]].map((b) => `<button type="button" class="am-btn" data-amk="ch" data-amv="${b[0]}">${b[1]}</button>`).join("")}</div>
<div class="am-controls" role="group" aria-label="Step"><button type="button" class="am-btn" data-amstep="-1">Back</button><button type="button" class="am-btn" data-amstep="1">Next</button><button type="button" class="am-btn" data-amplay aria-pressed="false">Play</button></div>`,
    sources: [
      "From the L19 notes (Dr. Herr): the capsule and its trabeculae with myofibroblasts; white pulp as lymphoid tissue around a central arteriole, its PALS mainly T cells, the B cell nodules farther out (primary, or secondary with germinal centers) pushing the arteriole to one side, and the marginal zone of macrophages and some B cells around it; red pulp as venous sinusoids with the splenic cords (cords of Billroth) between them; the route from trabecular artery to central arteriole, marginal sinuses, penicillar arterioles and sheathed capillaries (reticular fibers and macrophages), open into the cords or closed into the sinuses, then venules, trabecular veins and the splenic vein; the sinus wall's rod-shaped endothelial cells with slits, hoop-like strands of basal lamina, no smooth muscle or pericytes, and macrophage processes between the cells.",
      "Where the slides disagree: slide 40 writes \"sheathed capillaries (PALS)\"; the figure keeps the PALS around the central arteriole in the white pulp (slide 39 and its notes) and draws the sheathed capillaries in the red pulp wrapped in macrophages (slide 40's own notes). Slide 40 teaches the open circulation while slide 41's notes say about 90 percent of red pulp capillaries drain straight into the sinuses; the figure draws both routes and gives the 90 percent only as his note.",
      "Junqueira's Basic Histology and Ross and Pawlina's Histology: A Text and Atlas settled the drawing: the central arteriole runs eccentrically in the white pulp beside a nodule; marginal sinuses lie at the edge of the white pulp inside the marginal zone; penicillar arterioles fan out as short straight branches, each continuing as a capillary with a macrophage sheath; the sinus endothelial cells are long rods running parallel to the vessel's length with slits between them, and the basal lamina forms rings at right angles around them, so a red cell crosses the wall by deforming through a slit.",
      "Schematic and not to scale: the white pulp, the vessels and the close-ups are enlarged, and one block shows what a whole spleen spreads over many lobules. The vessels are drawn cut where they leave the block. The colors code T cells (gold), B cells (blue) and blood, not stains.",
    ],
    css: `
.anima[data-anima="spleen"] .am-svg{max-width:540px}
.anima .spleen-svg .t.sp-l{font-size:13px}
@media (max-width:560px){.anima .spleen-svg .t.sp-l{font-size:14.8px}}
.anima .spleen-svg .t.sp-on{fill:var(--bx-hot);font-weight:700}
.anima .spleen-svg .t.sp-tt{fill:color-mix(in srgb,var(--bx-gold) 55%,var(--anatomy-strong));font-weight:700}
.anima .spleen-svg .t.sp-bt{fill:var(--bx-blue);font-weight:600}
.anima .spleen-svg .t.sp-reg{fill:var(--bx-blood);font-weight:700}
.anima .spleen-svg .t.sp-reg2{fill:color-mix(in srgb,var(--bx-gold) 55%,var(--anatomy-strong));font-weight:700}
.anima .spleen-svg .t.sp-ttl{fill:var(--anatomy-muted)}
.anima .spleen-svg .t.sp-no{fill:var(--bx-inhib);font-weight:600}
.anima .spleen-svg .t.sp-lum{fill:var(--anatomy-strong);font-weight:600}
.anima .spleen-svg .sp-rp{fill:color-mix(in srgb,var(--bx-blood-soft) 70%,var(--anatomy-face))}
.anima .spleen-svg .sp-ret{fill:none;stroke:color-mix(in srgb,var(--bx-cyto-line) 45%,transparent);stroke-width:.6}
.anima .spleen-svg .sp-rd{fill:none;stroke:var(--bx-blood);stroke-width:4.2;stroke-linecap:round}
.anima .spleen-svg .sp-rdc{fill:none;stroke:color-mix(in srgb,var(--bx-blood) 55%,var(--bx-blood-soft));stroke-width:1.6;stroke-linecap:round}
.anima .spleen-svg .sp-ly{fill:none;stroke:var(--bx-nuc);stroke-width:3.4;stroke-linecap:round}
.anima .spleen-svg .sp-mac{fill:color-mix(in srgb,var(--bx-eosin) 70%,var(--bx-cyto));stroke:var(--bx-cyto-line);stroke-width:.7}
.anima .spleen-svg .sp-macn{fill:var(--bx-nuc)}
.anima .spleen-svg .sp-sw{fill:none;stroke:var(--bx-cyto-line);stroke-width:14;stroke-linecap:round;stroke-linejoin:round}
.anima .spleen-svg .sp-sl{fill:none;stroke:var(--bx-lumen);stroke-width:11;stroke-linecap:round;stroke-linejoin:round}
.anima .spleen-svg .sp-sh{fill:none;stroke:color-mix(in srgb,var(--bx-cyto-line) 28%,transparent);stroke-width:12.5;stroke-dasharray:1 9;stroke-linecap:butt}
.anima .spleen-svg .sp-mz{fill:color-mix(in srgb,var(--bx-blue-soft) 35%,var(--anatomy-face));stroke:color-mix(in srgb,var(--bx-blue) 40%,transparent);stroke-width:.8}
.anima .spleen-svg .sp-mzm{fill:none;stroke:color-mix(in srgb,var(--bx-eosin) 80%,var(--bx-cyto-line));stroke-width:4.4;stroke-linecap:round}
.anima .spleen-svg .sp-mzb{fill:none;stroke:var(--bx-blue);stroke-width:2.6;stroke-linecap:round;opacity:.8}
.anima .spleen-svg .sp-wp{fill:color-mix(in srgb,var(--bx-gold-soft) 88%,var(--anatomy-face));stroke:color-mix(in srgb,var(--bx-gold) 60%,transparent);stroke-width:.8}
.anima .spleen-svg .sp-td{fill:none;stroke:color-mix(in srgb,var(--bx-gold) 60%,var(--bx-nuc));stroke-width:2.6;stroke-linecap:round}
.anima .spleen-svg .sp-msw{fill:none;stroke:var(--bx-cyto-line);stroke-width:3.4;stroke-dasharray:14 6}
.anima .spleen-svg .sp-msl{fill:none;stroke:var(--bx-lumen);stroke-width:1.6;stroke-dasharray:14 6}
.anima .spleen-svg .sp-nod{fill:color-mix(in srgb,var(--bx-blue) 34%,var(--bx-blue-soft));stroke:var(--bx-blue);stroke-width:1}
.anima .spleen-svg .sp-bd{fill:none;stroke:var(--bx-nuc);stroke-width:2.6;stroke-linecap:round}
.anima .spleen-svg .sp-gc{fill:color-mix(in srgb,var(--bx-blue-soft) 45%,var(--anatomy-face));stroke:color-mix(in srgb,var(--bx-blue) 50%,transparent);stroke-width:.8}
.anima .spleen-svg .sp-gcc{fill:none;stroke:color-mix(in srgb,var(--bx-cyto) 70%,var(--anatomy-face));stroke-width:5.4;stroke-linecap:round}
.anima .spleen-svg .sp-gcn{fill:none;stroke:color-mix(in srgb,var(--bx-nuc) 60%,var(--anatomy-face));stroke-width:3;stroke-linecap:round}
.anima .spleen-svg .sp-trab{fill:var(--bx-eosin);stroke:var(--bx-cyto-line);stroke-width:.8}
.anima .spleen-svg .sp-myo{fill:none;stroke:var(--bx-nuc-line);stroke-width:1.6;stroke-linecap:round}
.anima .spleen-svg .sp-cap{fill:var(--bx-eosin);stroke:var(--bx-cyto-line);stroke-width:1.2}
.anima .spleen-svg .sp-cut{fill:none;stroke:var(--anatomy-lo);stroke-width:1.2}
.anima .spleen-svg .sp-tw{fill:none;stroke-linecap:round;stroke-linejoin:round}
.anima .spleen-svg .sp-tl{fill:none;stroke-linecap:round;stroke-linejoin:round}
.anima .spleen-svg .sp-tw.sp-ar{stroke:var(--bx-blood);stroke-width:7.6}
.anima .spleen-svg .sp-tl.sp-ar{stroke:var(--bx-blood-soft);stroke-width:3.2}
.anima .spleen-svg .sp-tw.sp-ar2{stroke-width:6.4}
.anima .spleen-svg .sp-tl.sp-ar2{stroke-width:2.2}
.anima .spleen-svg .sp-tw.sp-ar3{stroke-width:3.6}
.anima .spleen-svg .sp-tl.sp-ar3{stroke-width:1.2}
.anima .spleen-svg .sp-tw.sp-cp{stroke:var(--bx-blood);stroke-width:3}
.anima .spleen-svg .sp-tl.sp-cp{stroke:var(--bx-blood-soft);stroke-width:1}
.anima .spleen-svg .sp-tw.sp-vn{stroke:color-mix(in srgb,var(--bx-blood) 55%,var(--bx-violet));stroke-width:10}
.anima .spleen-svg .sp-tl.sp-vn{stroke:color-mix(in srgb,var(--bx-blood-soft) 70%,var(--bx-violet-soft));stroke-width:7}
.anima .spleen-svg .sp-cuta{fill:var(--bx-blood-soft);stroke:var(--bx-blood);stroke-width:1.4}
.anima .spleen-svg .sp-cutv{fill:color-mix(in srgb,var(--bx-blood-soft) 70%,var(--bx-violet-soft));stroke:color-mix(in srgb,var(--bx-blood) 55%,var(--bx-violet));stroke-width:1.4}
.anima .spleen-svg .sp-sc{fill:color-mix(in srgb,var(--bx-eosin) 55%,var(--bx-cyto));stroke:var(--bx-cyto-line);stroke-width:1}
.anima .spleen-svg .sp-scm{fill:none;stroke:var(--bx-nuc);stroke-width:2.4;stroke-linecap:round}
.anima .spleen-svg .sp-scl{fill:none;stroke:var(--bx-blood);stroke-width:1.6}
.anima .spleen-svg .sp-lit{fill:none;stroke:var(--bx-hot);stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round;opacity:.6}
.anima .spleen-svg .sp-pt{pointer-events:none}
.anima .spleen-svg .sp-rbc{fill:var(--bx-blood);stroke:color-mix(in srgb,var(--bx-blood) 70%,var(--anatomy-hi));stroke-width:.5}
.anima .spleen-svg .sp-rbcc{fill:color-mix(in srgb,var(--bx-blood) 55%,var(--bx-blood-soft))}
.anima .spleen-svg .sp-halo{fill:none;stroke:var(--bx-hot);stroke-width:1.8;pointer-events:none}
.anima .spleen-svg .sp-pbg{fill:color-mix(in srgb,var(--bx-blood-soft) 60%,var(--anatomy-face));stroke:var(--anatomy-lo);stroke-width:1.2}
.anima .spleen-svg .sp-panel.is-on .sp-pbg{stroke:var(--bx-hot);stroke-width:2}
.anima .spleen-svg .sp-ret2{fill:none;stroke:color-mix(in srgb,var(--bx-cyto-line) 50%,transparent);stroke-width:.8}
.anima .spleen-svg .sp-plum{fill:var(--bx-lumen)}
.anima .spleen-svg .sp-endo{fill:var(--bx-cyto);stroke:var(--bx-cyto-line);stroke-width:1}
.anima .spleen-svg .sp-endn{fill:var(--bx-nuc);stroke:var(--bx-nuc-line);stroke-width:.6}
.anima .spleen-svg .sp-bl{fill:none;stroke:var(--bx-violet);stroke-width:2;stroke-linecap:round}
.anima .spleen-svg .sp-macp{fill:none;stroke:color-mix(in srgb,var(--bx-eosin) 70%,var(--bx-cyto-line));stroke-width:3.4;stroke-linecap:round}
.anima .spleen-svg .sp-mac2{fill:color-mix(in srgb,var(--bx-eosin) 70%,var(--bx-cyto));stroke:var(--bx-cyto-line);stroke-width:1}
.anima .spleen-svg .sp-macn2{fill:var(--bx-nuc);stroke:var(--bx-nuc-line);stroke-width:.6}
.anima .spleen-svg .sp-blum{fill:color-mix(in srgb,var(--bx-blood) 30%,var(--bx-lumen));stroke:var(--bx-cyto-line);stroke-width:.8}
.anima .spleen-svg .sp-stave{fill:var(--bx-cyto);stroke:var(--bx-cyto-line);stroke-width:.8}
.anima .spleen-svg .sp-st2{fill:color-mix(in srgb,var(--bx-cyto) 72%,var(--bx-cyto-line))}
.anima .spleen-svg .sp-stn{fill:var(--bx-nuc);opacity:.85}
.anima .spleen-svg .sp-bend{fill:var(--bx-cyto);stroke:var(--bx-cyto-line);stroke-width:1}
.anima .spleen-svg .sp-bendi{fill:color-mix(in srgb,var(--bx-blood) 30%,var(--bx-lumen))}
.anima .spleen-svg .sp-hoop{fill:none;stroke:var(--bx-violet);stroke-width:3;stroke-linecap:round}
`,
  });
}
