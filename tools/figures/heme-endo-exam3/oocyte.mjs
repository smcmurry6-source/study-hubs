// Fig: getting into the oocyte (L17 Pregnancy and Lactation, Dr. Madison: the three layers around the ovulated oocyte,
// ZP3 and the acrosomal reaction, ZP3 cleaved away and ZP2 bound, the second meiotic division, the cortical (zonal)
// reaction that blocks polyspermy, and the pronuclei fusing). Two views of one moment, drawn to the same true sizes: on top
// a magnified strip of the layers where the sperm gets in (cumulus, the ZP3 layer, ZP2, the zona pellucida, the plasma
// membrane with its cortical granules), and below it the whole oocyte, with a box marking the strip. A step slider moves
// the sperm in through the layers; each step lights its layer and its row in the list of steps, which points at where it
// happens in the whole oocyte. The ZP3-over-ZP2 layer is the lecture's model; the rest is drawn to true proportions
// (sizes in the sources, not on the drawing).
import { makeFig, f1, T, L, HOT } from "./shared.mjs";

const W = 440, H = 526;
/* the zoom strip: 4 px per micrometer, outside at the top */
const Z = { X0: 8, X1: 300, Y0: 22, Y1: 252, ZP: 120, ZI: 180, M: 190, K: 4 };
/* the whole oocyte: 0.9 px per micrometer */
const O = { X: 128, Y: 404, KW: 0.9, RM: 49.5, RZ0: 51.8, RZ1: 65.3 };

function rnd(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

/* build-time geometry: the cumulus cells in the strip and around the whole oocyte */
function cumulus() {
  const zc = [];
  /* outer row, rounder cells; inner row, the cells against the zona, radially long */
  for (let i = 0, x = 22; x < Z.X1 - 14; i++, x += 33 + rnd(i) * 6) zc.push([f1(x), f1(60 + (rnd(i + 40) - 0.5) * 8), f1(14 + rnd(i + 3) * 3), f1(12.5 + rnd(i + 7) * 2.5), f1((rnd(i + 9) - 0.5) * 40), 0]);
  for (let i = 0, x = 16; x < Z.X1 - 9; i++, x += 21 + rnd(i + 70) * 3) zc.push([f1(x), f1(100 + (rnd(i + 90) - 0.5) * 3), f1(9 + rnd(i + 20) * 1.5), f1(15.5 + rnd(i + 30) * 2), f1((rnd(i + 50) - 0.5) * 12), 1]);
  const wc = [];
  [[70, 4.6, 3.4, 1], [79, 4.6, 4.2, 1], [88, 4.8, 4.4, 1], [97, 4.4, 4, 0.45]].forEach(([r, a, b, op], ring) => {
    const n = Math.round(2 * Math.PI * r / 10.2);
    for (let k = 0; k < n; k++) {
      const ang = (k + (ring % 2) * 0.5 + (rnd(k + ring * 100) - 0.5) * 0.4) / n * 360;
      if (ring === 3 && rnd(k + 500) < 0.35) continue;
      wc.push([f1(ang), f1(r + (rnd(k + ring * 31) - 0.5) * 2), ring === 0 ? 3.3 : a, ring === 0 ? 5 : b, op]);
    }
  });
  return { ZC: zc, WC: wc };
}

/* ---------- page helpers (serialized into the page) ---------- */
/* where each part is at step i; the page eases from one step's numbers to the next */
function ocState(i, D) {
  return {
    y: D.TIPY[i], open: i >= 1 ? 1 : 0, acro: i >= 2 ? 1 : 0, enz: [0, 0, 1, 0.65, 0.3, 0, 0][i], cut: i >= 3 ? 1 : 0,
    zp2: [0, 0, 0, 1, 0.7, 0, 0][i], mei: i >= 4 ? 1 : 0, cort: i >= 5 ? 1 : 0, fuse: i >= 6 ? 1 : 0,
    by: D.BY[i], cy: D.CY[i]
  };
}
/* the lead sperm's path in the strip: a straight line slanted 10 degrees */
function ocTipX(y) { return 150 + (y - 120) * 0.176; }
/* a sperm in the strip: tip at (x, y), pointing down, turned by a degrees; ac = acrosome left (1 whole, 0 reacted) */
function ocSperm(x, y, a, ac, t, ph, top, cls) {
  var o = "", ra = a * Math.PI / 180, ux = Math.sin(ra), uy = Math.cos(ra), px = uy, py = -ux, s, pts = [], k;
  /* tail: from the midpiece's end back up and out of the strip, beating harder away from the head */
  var bx = x - ux * 40, by = y - uy * 40;
  for (s = 0; s <= 240; s += 4) {
    var amp = Math.min(7, s * 0.07) * (by - uy * s > 120 ? 0.35 : 1), w = amp * Math.sin(s / 34 * 2 * Math.PI - (t || 0) * 0.008 + ph);
    var qx = bx - ux * s + px * w, qy = by - uy * s + py * w;
    if (qy < top) { if (!pts.length) break; var pr = pts[pts.length - 1], f = (pr[1] - top) / ((pr[1] - qy) || 1); pts.push([pr[0] + (qx - pr[0]) * f, top]); break; }
    pts.push([qx, qy]);
  }
  var d1 = "", d2 = "";
  for (k = 0; k < pts.length; k++) { if (k <= 16) d1 += (k ? "L" : "M") + f1(pts[k][0]) + " " + f1(pts[k][1]); if (k >= 16) d2 += (k > 16 ? "L" : "M") + f1(pts[k][0]) + " " + f1(pts[k][1]); }
  o += '<path class="oc-tail" d="' + d1 + '"/>' + (d2 ? '<path class="oc-tail oc-tail2" d="' + d2 + '"/>' : "");
  var g = '<g transform="translate(' + f1(x) + " " + f1(y) + ") rotate(" + f1(-a) + ')">';
  /* midpiece with its sheath */
  g += '<rect class="oc-mid" x="-2.1" y="-40" width="4.2" height="20.5" rx="1.6"/>';
  for (k = 0; k < 7; k++) g += '<path class="oc-sheath" d="M-2.1 ' + f1(-38 + k * 2.8) + "L2.1 " + f1(-36.6 + k * 2.8) + '"/>';
  /* head: the acrosome's cap over the front, the nucleus behind it */
  g += '<path class="oc-head' + (cls ? " " + cls : "") + '" d="M0 0C6.6 -0.4 6.8 -12 3.6 -18L1.7 -20.2H-1.7L-3.6 -18C-6.8 -12 -6.6 -0.4 0 0Z"/>';
  if (ac > 0.02) g += '<path class="oc-acro" opacity="' + f1(ac) + '" d="M0 0C6.6 -0.4 6.8 -12 6.1 -11.6C4.8 -6 2.6 -3.4 0 -3.2C-2.6 -3.4 -4.8 -6 -6.1 -11.6C-6.8 -12 -6.6 -0.4 0 0Z"/>';
  g += '<path class="oc-nuc" d="M-5.7 -11.4C-4.6 -6 -2.5 -3.6 0 -3.4C2.5 -3.6 4.6 -6 5.7 -11.4C5.4 -14.4 4.4 -16.4 3.3 -17.8L1.5 -19.6H-1.5L-3.3 -17.8C-4.4 -16.4 -5.4 -14.4 -5.7 -11.4Z"/>';
  if (ac < 0.98) for (k = 0; k < 7; k++) { var va = (k / 6 - 0.5) * 2.5; g += '<circle class="oc-ves" opacity="' + f1(1 - ac) + '" cx="' + f1(Math.sin(va) * 7.6) + '" cy="' + f1(-6 + Math.cos(va) * 6.4 - 3) + '" r="1.3"/>'; }
  return o + g + "</g>";
}
/* a sperm in the whole oocyte: tip at radius r, angle th (degrees), slanted sl degrees from radial */
function ocWs(cx, cy, th, r, sl, t, ph, op) {
  var a = th * Math.PI / 180, x = cx + r * Math.cos(a), y = cy + r * Math.sin(a), d = (th + sl) * Math.PI / 180, ux = Math.cos(d), uy = Math.sin(d), o = "", p = "", s;
  for (s = 3; s <= 48; s += 3) { var w = Math.min(2.4, s * 0.06) * Math.sin(s / 9 - (t || 0) * 0.008 + ph); p += (s === 3 ? "M" : "L") + f1(x + ux * s - uy * w) + " " + f1(y + uy * s + ux * w); }
  o += '<path class="oc-wtail" d="' + p + '"/><ellipse class="oc-whead" cx="' + f1(x + ux * 1.6) + '" cy="' + f1(y + uy * 1.6) + '" rx="2.6" ry="1.5" transform="rotate(' + f1(th + sl) + " " + f1(x + ux * 1.6) + " " + f1(y + uy * 1.6) + ')"/>';
  return '<g opacity="' + f1(op) + '">' + o + "</g>";
}
/* strip y to whole-oocyte radius, strip x to angle */
function ocR(y, D) { return D.O.RM + (D.Z.M - y) / D.Z.K * D.O.KW; }
function ocTh(x, D) { return -90 + ((x - 150) / D.Z.K * D.O.KW) / D.O.RZ1 * 180 / Math.PI; }
function ocP(r, th, D) { var a = th * Math.PI / 180; return [D.O.X + r * Math.cos(a), D.O.Y + r * Math.sin(a)]; }
function ocRing(cx, cy, r0, r1) { return "M" + f1(cx - r1) + " " + f1(cy) + "a" + r1 + " " + r1 + " 0 1 0 " + 2 * r1 + " 0a" + r1 + " " + r1 + " 0 1 0 " + -2 * r1 + " 0Z" + "M" + f1(cx - r0) + " " + f1(cy) + "a" + r0 + " " + r0 + " 0 1 1 " + 2 * r0 + " 0a" + r0 + " " + r0 + " 0 1 1 " + -2 * r0 + " 0Z"; }

function ocRender(st, D) {
  var t = st.t || 0, s = Math.max(0, Math.min(6, Math.round(st.s))), o = "", i, k, x, y, Z = D.Z, O = D.O;
  st.s = s;
  if (st._s === undefined) { st._s = s; st._p = s; st._t0 = -1e9; }
  if (st._s !== s) { st._p = st._s; st._s = s; st._t0 = t; }
  var e = t ? Math.min(1, (t - st._t0) / 1100) : 1; e = e * e * (3 - 2 * e);
  var A = ocState(st._p, D), B = ocState(s, D), P = {};
  for (k in B) P[k] = A[k] + (B[k] - A[k]) * e;
  var tx = ocTipX(P.y), on = function (n) { return s === n ? " is-on" : ""; };

  /* ================= the strip, magnified ================= */
  o += T(Z.X0, 14, "WHERE THE SPERM GETS IN · MAGNIFIED", "oc-h", "start");
  o += '<rect class="oc-fluid" x="' + Z.X0 + '" y="' + Z.Y0 + '" width="' + (Z.X1 - Z.X0) + '" height="' + (Z.Y1 - Z.Y0) + '" rx="10"/>';
  /* ooplasm, the perivitelline space, the zona */
  o += HOT("The oocyte's cytoplasm, under its plasma membrane.", '<path class="oc-ooplasm" d="M' + Z.X0 + " " + Z.M + "H" + Z.X1 + "V" + (Z.Y1 - 10) + "Q" + Z.X1 + " " + Z.Y1 + " " + (Z.X1 - 10) + " " + Z.Y1 + "H" + (Z.X0 + 10) + "Q" + Z.X0 + " " + Z.Y1 + " " + Z.X0 + " " + (Z.Y1 - 10) + 'Z"/>');
  o += '<rect class="oc-pvs" x="' + Z.X0 + '" y="' + Z.ZI + '" width="' + (Z.X1 - Z.X0) + '" height="' + (Z.M - Z.ZI) + '"/>';
  var zon = '<rect class="oc-zona' + (P.cort > 0.5 ? " is-react" : "") + '" x="' + Z.X0 + '" y="' + Z.ZP + '" width="' + (Z.X1 - Z.X0) + '" height="' + (Z.ZI - Z.ZP) + '"/>';
  for (y = 139; y < Z.ZI - 3; y += 9) { var zl = ""; for (x = Z.X0; x <= Z.X1 + 0.1; x += 6) zl += (x === Z.X0 ? "M" : "L") + f1(x) + " " + f1(y + 1.6 * Math.sin(x / 13 + y)); zon += '<path class="oc-fib" d="' + zl + '"/>'; }
  o += HOT("Zona pellucida: a specialized extracellular matrix, a thick, rigid capsule around the oocyte. The acrosome's hyaluronidases and proteases break it down so the sperm can get through.", zon);
  /* the path the acrosomal enzymes digest */
  if (P.cut > 0.02) {
    var cy1 = Math.min(Math.max(P.y - 2, Z.ZP), Z.ZI), ch = "";
    ch += "M" + f1(ocTipX(Z.ZP - 4) - 7) + " " + (Z.ZP - 4) + "L" + f1(ocTipX(cy1) - 5.5) + " " + f1(cy1) + "Q" + f1(ocTipX(cy1 + 4)) + " " + f1(cy1 + 6) + " " + f1(ocTipX(cy1) + 5.5) + " " + f1(cy1) + "L" + f1(ocTipX(Z.ZP - 4) + 7) + " " + (Z.ZP - 4) + "Z";
    o += HOT("The path the acrosome's enzymes digest through the zona pellucida.", '<path class="oc-chan" opacity="' + f1(P.cut) + '" d="' + ch + '"/>');
  }
  /* the plasma membrane and its cortical granules */
  var mp = ""; for (x = Z.X0; x <= Z.X1 + 0.1; x += 4) mp += (x === Z.X0 ? "M" : "L") + f1(x) + " " + f1(Z.M + 0.8 * Math.sin(x / 7));
  o += HOT("The oocyte's own plasma membrane, the oolemma: the last of the three layers, which the sperm finally merges with.", '<path class="oc-hit" d="' + mp + '"/><path class="oc-memb' + on(6) + '" d="' + mp + '"/>');
  var gr = "", cup = "", rel = "";
  for (i = 0; i < 22; i++) {
    x = 14 + 13 * i; var gy = 198 - 6 * P.cort;
    if (P.cort < 0.98) gr += '<circle class="oc-gran" cx="' + x + '" cy="' + f1(gy) + '" r="2.8" opacity="' + f1(1 - P.cort) + '"/>';
    if (P.cort > 0.02) { cup += '<path class="oc-cup" opacity="' + f1(P.cort) + '" d="M' + (x - 3.4) + " " + (Z.M + 1.4) + "Q" + (x - 3.4) + " " + (Z.M + 5.6) + " " + x + " " + (Z.M + 5.6) + "Q" + (x + 3.4) + " " + (Z.M + 5.6) + " " + (x + 3.4) + " " + (Z.M + 1.4) + '"/>';
      for (k = 0; k < 3; k++) { var dy = ((t * 0.004 + k / 3 + i * 0.37) % 1); rel += '<circle class="oc-rel" cx="' + f1(x - 3 + k * 3) + '" cy="' + f1(Z.M - 3 - dy * 16 * P.cort) + '" r="1.1" opacity="' + f1(P.cort * (1 - dy) * 0.9) + '"/>'; } }
  }
  o += HOT(P.cort > 0.5 ? "The cortical (zonal) reaction: the oocyte has released its cortical granules, and the remaining zona proteins are shed, so no other sperm can bind. That prevents polyspermy: a single sperm fertilizes a single egg." : "Cortical granules, just under the plasma membrane. Once the sperm binds ZP2, the oocyte releases them: the cortical (zonal) reaction.", gr + cup + rel);
  /* the ZP3 layer on the zona's surface, and ZP2 under it */
  var cut = function (xx) { return Math.abs(xx - ocTipX(Z.ZP)) < 26; }, z3 = "", z2 = "", z2on = "";
  var shed = 1 - 0.85 * P.cort, fr = "";
  o += '<rect class="oc-zp3b" x="' + Z.X0 + '" y="' + (Z.ZP - 3.5) + '" width="' + (Z.X1 - Z.X0) + '" height="4" opacity="' + f1(shed) + '"/>';
  o += '<rect class="oc-zp2b" x="' + Z.X0 + '" y="' + (Z.ZP + 4) + '" width="' + (Z.X1 - Z.X0) + '" height="4" opacity="' + f1(0.55 + 0.45 * P.cut - 0.4 * P.cort) + '"/>';
  for (x = 13; x < Z.X1 - 2; x += 10) {
    var c3 = cut(x) ? 1 - P.cut : 1;
    if (c3 * shed > 0.03) z3 += '<path class="oc-zp3" opacity="' + f1(c3 * shed) + '" d="M' + x + " " + (Z.ZP - 1) + "V" + (Z.ZP - 6) + '"/><circle class="oc-zp3k" opacity="' + f1(c3 * shed) + '" cx="' + x + '" cy="' + (Z.ZP - 7.6) + '" r="2.2"/>';
    var x2 = x + 5, on2 = cut(x2) ? P.cut : 0;
    z2 += '<path class="oc-zp2" opacity="' + f1((0.5 + 0.5 * on2) * shed) + '" d="M' + x2 + " " + (Z.ZP + 3.4) + "l2.6 2.6l-2.6 2.6l-2.6 -2.6Z" + '"/>';
    if (on2 > 0.02 && P.zp2 > 0.02) z2on += '<circle class="oc-zp2r" cx="' + x2 + '" cy="' + (Z.ZP + 6) + '" r="4.6" opacity="' + f1(P.zp2) + '"/>';
  }
  /* the cleaved ZP3 pieces lift off the gap */
  if (P.zp2 > 0.02 && P.cort < 0.98) for (x = 13; x < Z.X1 - 2; x += 10) if (cut(x)) { var lift = 8 + 10 * P.cut + ((x * 7) % 5), tl = (x - ocTipX(Z.ZP)) * 0.9; fr += '<g opacity="' + f1(P.zp2 * 0.75) + '" transform="rotate(' + f1(tl) + " " + x + " " + f1(Z.ZP - lift) + ')"><path class="oc-zp3" d="M' + x + " " + f1(Z.ZP - lift + 4) + "V" + f1(Z.ZP - lift - 1) + '"/><circle class="oc-zp3k" cx="' + x + '" cy="' + f1(Z.ZP - lift - 2.6) + '" r="2.2"/></g>'; }
  /* shed fragments drift off after the cortical reaction */
  if (P.cort > 0.02) for (i = 0; i < 9; i++) { var fx = 20 + i * 32 + rnd(i) * 10, fu = ((t * 0.00012 + rnd(i + 9)) % 1), fy = Z.ZP - 10 - fu * 30; fr += '<circle class="oc-zp3k" cx="' + f1(fx) + '" cy="' + f1(fy) + '" r="1.9" opacity="' + f1(P.cort * 0.5 * (1 - fu)) + '"/>'; }
  o += HOT("ZP2: exposed once the ZP3 layer is cleaved away. After the acrosomal reaction the sperm binds ZP2, and binding it starts the oocyte's second meiotic division and the cortical (zonal) reaction.", z2 + z2on);

  /* the cumulus: cells in their matrix, pushed apart where many sperm break them down */
  o += '<rect class="oc-cmx" x="' + Z.X0 + '" y="40" width="' + (Z.X1 - Z.X0) + '" height="' + (Z.ZP - 44) + '" rx="4"/>';
  var cc = "", cx0 = ocTipX(80);
  D.ZC.forEach(function (c, j) {
    var dx = c[0] - cx0, near = Math.max(0, 1 - Math.abs(dx) / 34) * P.open, push = near * 7 * (dx < 0 ? -1 : 1), fade = 1 - 0.62 * Math.min(1, near * 1.6), sc = 1 - 0.22 * Math.min(1, near * 1.6);
    var X = c[0] + push;
    if (X - c[2] < Z.X0 + 1 || X + c[2] > Z.X1 - 1) return;
    cc += '<g opacity="' + f1(fade) + '"><ellipse class="oc-cell" cx="' + f1(X) + '" cy="' + c[1] + '" rx="' + f1(c[2] * sc) + '" ry="' + f1(c[3] * sc) + '" transform="rotate(' + c[4] + " " + f1(X) + " " + c[1] + ')"/><ellipse class="oc-cnu" cx="' + f1(X) + '" cy="' + f1(c[1] + (c[5] ? -2 : 0)) + '" rx="' + f1(c[2] * 0.42) + '" ry="' + f1(c[3] * 0.38) + '" transform="rotate(' + c[4] + " " + f1(X) + " " + c[1] + ')"/></g>';
  });
  o += HOT("The expanded cumulus, the outermost layer: the granulosa cells that surround the ovulated oocyte and keep nourishing it. Dr. Madison called this layer the corona radiata. Many sperm working together first break down its cells.", cc);
  o += HOT("ZP3, on the zona pellucida's surface: a species-specific receptor. When a sperm recognizes and binds ZP3, the acrosomal reaction starts. The acrosome's proteases then cleave the ZP3 layer away, exposing ZP2.", z3);
  o += fr;
  /* acrosomal enzymes around the tip */
  if (P.enz > 0.02) { var en = ""; for (i = 0; i < 16; i++) { var ea = rnd(i + 200) * Math.PI * 2, ed = 6 + ((t * 0.006 + rnd(i + 300) * 9) % 12), ex = ocTipX(Math.min(P.y, Z.ZI)) + Math.cos(ea) * ed, ey = Math.min(P.y, Z.ZI) + Math.sin(ea) * ed * 0.8 - 2; en += '<circle class="oc-enz" cx="' + f1(ex) + '" cy="' + f1(ey) + '" r="1.25" opacity="' + f1(P.enz * (1 - (ed - 6) / 14)) + '"/>'; }
    o += HOT("The acrosome's enzymes, hyaluronidases and proteases, released by the acrosomal reaction: they digest a path through the zona pellucida and cleave the ZP3 layer.", en); }

  /* the sperm: B reaches the zona later and is turned away; C stays in the cumulus */
  var bX = 86 + (P.by - 66) * 0.05, cX = 36 + (P.cy - 64) * 0.04, bOp = 1, cOp = 1 - 0.45 * P.cort;
  o += HOT(P.cort > 0.5 ? "Another sperm: the cortical reaction has shed the zona proteins, so it has nothing left to bind." : "Another sperm. Many sperm work together to break down the cumulus, but only one fertilizes the egg.", ocSperm(bX, P.by, -12, 1, t, 1.7, Z.Y0 + 1, "") );
  o += HOT("Another sperm, still in the cumulus.", '<g opacity="' + f1(cOp) + '">' + ocSperm(cX, P.cy, -8, 1, t, 3.1, Z.Y0 + 1, "") + "</g>");
  if (P.cort > 0.02) o += '<g opacity="' + f1(P.cort) + '"><circle class="oc-no" cx="' + f1(bX + 12) + '" cy="' + f1(P.by - 6) + '" r="6.5"/><path class="oc-nox" d="M' + f1(bX + 9.4) + " " + f1(P.by - 8.6) + "l5.2 5.2m0 -5.2l-5.2 5.2" + '"/></g>';
  o += HOT("The sperm that will fertilize the egg. Its acrosome, the cap on its head, is packed with enzymes (hyaluronidases and proteases). It arrives capacitated: the blocks to binding the oocyte are gone and the acrosomal reaction is possible.", ocSperm(tx, P.y, 10, 1 - P.acro, t, 0, Z.Y0 + 1, "oc-lead"));
  o += '<rect class="oc-frame" x="' + Z.X0 + '" y="' + Z.Y0 + '" width="' + (Z.X1 - Z.X0) + '" height="' + (Z.Y1 - Z.Y0) + '" rx="10"/>';

  /* labels in the strip, by step */
  if (s <= 1) o += L(tx + 22, P.y - 4, "acrosome", tx + 4.5, P.y - 3.2, "start", "oc-s b");
  if (s === 2) o += L(tx + 22, 152, "acrosomal reaction", tx + 5, P.y + 3, "start", "oc-s oc-hot");
  if (s === 3 || s === 4) o += L(tx + 26, 146, "binds ZP2", ocTipX(Z.ZP) + 19, Z.ZP + 6, "start", "oc-s oc-v");
  if (s === 3) o += L(ocTipX(Z.ZP) + 40, Z.ZP - 22, "ZP3 cleaved away", ocTipX(Z.ZP) + 23, Z.ZP - 19.5, "start", "oc-s oc-tl");
  if (s === 4) { var kx = Math.round((bX - 13) / 10) * 10 + 13; o += '<path class="lead" d="M' + f1(bX - 4) + " 138L" + kx + " " + (Z.ZP - 6) + '"/><circle class="dot" cx="' + kx + '" cy="' + (Z.ZP - 6) + '" r="1.8"/>' + T(bX - 4, 151, "binds ZP3", "oc-s oc-tl", "middle"); }
  if (s >= 5) o += L(16, 150, "can't bind", bX + 9, P.by - 1, "start", "oc-s oc-bad");
  if (s === 5) o += L(tx - 16, 236, "granules released", tx - 32, Z.M + 4, "end", "oc-s oc-gr");
  if (s === 6) o += L(tx - 14, 222, "merges with", tx - 4, Z.M + 1, "end", "oc-s b") + T(tx - 14, 236, "the membrane", "oc-s b", "end");

  /* the layer labels beside the strip */
  o += L(308, 60, "expanded cumulus", 292, 64, "start", "oc-c" + on(1)) + T(308, 75, "(corona radiata)", "oc-c mut", "start");
  o += L(308, 109, "ZP3 layer", 294, Z.ZP - 1.5, "start", "oc-c oc-tl" + on(2));
  o += L(308, 131, "ZP2", 294, Z.ZP + 6, "start", "oc-c oc-v" + on(3));
  o += L(308, 156, "zona pellucida", 294, 156, "start", "oc-c");
  o += L(308, 192, "plasma membrane", 294, Z.M + 0.8 * Math.sin(294 / 7), "start", "oc-c" + on(6)) + T(308, 207, "(oolemma)", "oc-c mut", "start");
  o += L(308, 230, "cortical granules", 287, P.cort > 0.5 ? Z.M + 5.6 : 198, "start", "oc-c oc-gr" + on(5));

  /* ================= the whole oocyte ================= */
  var RT = O.Y - O.RM - (Z.M - Z.Y0) / Z.K * O.KW, RW = (Z.X1 - Z.X0) / Z.K * O.KW, RH = (Z.Y1 - Z.Y0) / Z.K * O.KW, RX = O.X - RW / 2;
  var whole = "";
  /* cumulus cells */
  var wc = "";
  D.WC.forEach(function (c) {
    var a = c[0], dd = Math.abs(((a + 90) % 360 + 540) % 360 - 180), op = c[4];
    if (dd < 14) op *= 1 - 0.7 * P.open;
    var p = ocP(c[1], a, D);
    wc += '<ellipse class="oc-cell" cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" rx="' + c[2] + '" ry="' + c[3] + '" transform="rotate(' + f1(a + 90) + " " + f1(p[0]) + " " + f1(p[1]) + ')" opacity="' + f1(op) + '"/>';
  });
  whole += HOT("The expanded cumulus (corona radiata) around the whole oocyte; it runs on further than drawn.", wc);
  whole += '<circle class="oc-pvs" cx="' + O.X + '" cy="' + O.Y + '" r="' + O.RZ0 + '"/>';
  whole += HOT("The zona pellucida around the whole oocyte.", '<path class="oc-zona' + (P.cort > 0.5 ? " is-react" : "") + '" fill-rule="evenodd" d="' + ocRing(O.X, O.Y, O.RZ0, O.RZ1) + '"/><circle class="oc-wzp3" cx="' + O.X + '" cy="' + O.Y + '" r="' + f1(O.RZ1 + 0.6) + '" opacity="' + f1(1 - 0.85 * P.cort) + '"/>');
  if (P.cut > 0.02) { var c0 = ocP(O.RZ1 + 1, ocTh(ocTipX(Z.ZP), D), D), c1 = ocP(Math.max(ocR(Math.min(P.y, Z.ZI), D), O.RZ0), ocTh(ocTipX(Math.min(P.y, Z.ZI)), D), D); whole += '<path class="oc-wchan" opacity="' + f1(P.cut) + '" d="M' + f1(c0[0]) + " " + f1(c0[1]) + "L" + f1(c1[0]) + " " + f1(c1[1]) + '"/>'; }
  /* the oocyte, its polar bodies (drawn, not named), its chromosomes and cortical granules */
  var pb1 = ocP(O.RM + 4.6, 34, D);
  whole += '<circle class="oc-pb" cx="' + f1(pb1[0]) + '" cy="' + f1(pb1[1]) + '" r="5"/><circle class="oc-chr" cx="' + f1(pb1[0]) + '" cy="' + f1(pb1[1]) + '" r="1.4"/>';
  if (P.mei > 0.02) { var pb2 = ocP(O.RM + 3.6 * P.mei, 18, D); whole += '<g opacity="' + f1(P.mei) + '"><circle class="oc-pb" cx="' + f1(pb2[0]) + '" cy="' + f1(pb2[1]) + '" r="' + f1(1.5 + 2.6 * P.mei) + '"/><circle class="oc-chr" cx="' + f1(pb2[0]) + '" cy="' + f1(pb2[1]) + '" r="1.2"/></g>'; }
  whole += HOT("The oocyte, about the size of the period at the end of a sentence: its cytoplasm under the plasma membrane.", '<circle class="oc-ooplasm oc-wmemb" cx="' + O.X + '" cy="' + O.Y + '" r="' + O.RM + '"/>');
  var wg = "";
  for (i = 0; i < 64; i++) { var ga = i / 64 * 360, gp = ocP(O.RM - 3.2 + 3.6 * P.cort, ga, D); wg += '<circle class="oc-gran" cx="' + f1(gp[0]) + '" cy="' + f1(gp[1]) + '" r="1" opacity="' + f1(1 - 0.85 * P.cort) + '"/>'; }
  whole += HOT(P.cort > 0.5 ? "The cortical granules have been released all around the oocyte: the cortical (zonal) reaction, the block to polyspermy." : "Cortical granules all around, just under the plasma membrane.", wg);
  /* the female chromosomes: the second meiotic division, then the female pronucleus */
  var sp = ocP(O.RM - 9, 18, D), fpn = [O.X - 7.5, O.Y + 1], mpn = [O.X + 7.5, O.Y - 1];
  var chrom;
  if (P.fuse < 0.02) {
    var spd = 3 * P.mei;
    chrom = '<g transform="rotate(108 ' + f1(sp[0]) + " " + f1(sp[1]) + ')"><path class="oc-spin" d="M' + f1(sp[0]) + " " + f1(sp[1] - 8) + "Q" + f1(sp[0] + 5.4) + " " + f1(sp[1]) + " " + f1(sp[0]) + " " + f1(sp[1] + 8) + "Q" + f1(sp[0] - 5.4) + " " + f1(sp[1]) + " " + f1(sp[0]) + " " + f1(sp[1] - 8) + 'Z"/>';
    for (k = -1; k <= 1; k++) chrom += '<rect class="oc-chr" x="' + f1(sp[0] - 1 + k * 2.6) + '" y="' + f1(sp[1] - 2.2 - spd) + '" width="1.8" height="3" rx=".8"/>' + (P.mei > 0.02 ? '<rect class="oc-chr" opacity="' + f1(P.mei) + '" x="' + f1(sp[0] - 1 + k * 2.6) + '" y="' + f1(sp[1] - 0.8 + spd) + '" width="1.8" height="3" rx=".8"/>' : "");
    chrom += "</g>";
  } else {
    var fp = [sp[0] + (fpn[0] - sp[0]) * P.fuse, sp[1] + (fpn[1] - sp[1]) * P.fuse];
    chrom = '<circle class="oc-fpn" cx="' + f1(fp[0]) + '" cy="' + f1(fp[1]) + '" r="' + f1(3 + 5 * P.fuse) + '"/>';
  }
  whole += HOT("The oocyte's chromosomes. It finished its first meiotic division at ovulation; binding ZP2 starts the second, and it becomes haploid right before fertilization.", chrom);
  /* the sperm around it: lead, B and C from the strip, and a few others */
  var lr = ocR(P.y, D), lth = ocTh(tx, D);
  if (P.fuse < 0.98) whole += HOT("The sperm that fertilizes the egg.", ocWs(O.X, O.Y, lth, lr, -10, t, 0, 1 - P.fuse));
  if (P.fuse > 0.02) { var mp0 = ocP(O.RM - 5, lth, D), mq = [mp0[0] + (mpn[0] - mp0[0]) * P.fuse, mp0[1] + (mpn[1] - mp0[1]) * P.fuse]; whole += HOT("The male pronucleus, from the sperm's head, meeting the female pronucleus.", '<circle class="oc-mpn" cx="' + f1(mq[0]) + '" cy="' + f1(mq[1]) + '" r="' + f1(3 + 5 * P.fuse) + '"/>'); }
  whole += ocWs(O.X, O.Y, ocTh(bX, D), ocR(P.by, D), 12, t, 1.7, 1) + ocWs(O.X, O.Y, ocTh(cX, D), ocR(P.cy, D), 8, t, 3.1, cOp);
  D.OTH.forEach(function (q, j) { var rr = q[1] - (q[1] - q[2]) * P.open; whole += ocWs(O.X, O.Y, q[0], rr, q[3], t, j * 1.3 + 0.4, 1 - 0.4 * P.cort); });
  o += whole;
  /* the box that the strip magnifies, joined to it */
  o += '<path class="oc-zl" d="M' + f1(RX) + " " + f1(RT) + "L" + Z.X0 + " " + Z.Y1 + "M" + f1(RX + RW) + " " + f1(RT) + "L" + Z.X1 + " " + Z.Y1 + '"/>';
  o += HOT("The part of the whole oocyte that the strip above magnifies, about four times.", '<rect class="oc-zbox" x="' + f1(RX) + '" y="' + f1(RT) + '" width="' + f1(RW) + '" height="' + f1(RH) + '"/>');
  o += T(14, 518, "the whole oocyte", "oc-c mut", "start");

  /* ================= the steps, in order ================= */
  o += T(262, 286, "IN ORDER", "oc-h", "start");
  var tgt = [null, ocP(lr, lth, D), ocP(lr, lth, D), ocP(lr, lth, D), [sp[0], sp[1]], ocP(O.RM + 2, 2, D), [O.X + 4, O.Y - 7]];
  for (i = 1; i <= 6; i++) {
    var ry = 294 + (i - 1) * 37, cls = i === s ? " is-on" : i < s ? " is-done" : "";
    var row = '<rect class="oc-row' + cls + '" x="262" y="' + ry + '" width="172" height="32" rx="8"/><circle class="oc-num' + cls + '" cx="276" cy="' + (ry + 16) + '" r="8.5"/>' + T(276, ry + 20, String(i), "oc-nt" + cls, "middle");
    row += T(290, ry + 13.5, D.ROWS[i][0], "oc-rt" + cls, "start") + T(290, ry + 27, D.ROWS[i][1], "oc-rt" + cls, "start");
    o += HOT(D.ROWS[i][2], row);
  }
  if (s >= 1 && tgt[s]) { var ty = 294 + (s - 1) * 37 + 16; o += '<path class="oc-pt" d="M262 ' + ty + "L" + f1(tgt[s][0]) + " " + f1(tgt[s][1]) + '"/><circle class="dot" cx="' + f1(tgt[s][0]) + '" cy="' + f1(tgt[s][1]) + '" r="2"/>'; }
  return o;
}

function ocSay(st, D) {
  var s = st.s;
  return [D.TXT[s], "step " + s + " of 6 · " + D.RO[s]];
}

export default function oocyte() {
  const G = cumulus();
  const D = Object.assign({}, G, {
    Z, O, ANIM: true,
    INIT: { s: 0 }, STEPKEY: "s", STEPMAX: 6, PLAYMS: 2600,
    /* the lead sperm's tip, and two others' tips, in the strip at each step */
    TIPY: [64, 100, 120, 150, 172, 183, 214],
    BY: [66, 92, 102, 110, 120, 113, 113],
    CY: [64, 90, 96, 98, 98, 98, 98],
    OTH: [[215, 102, 91, 0], [140, 103, 92, 25], [70, 102, 92, -40], [30, 101, 91, -50]],
    ROWS: [null,
      ["many sperm break", "down the cumulus", "Step 1: capacitated sperm reach the expanded cumulus (corona radiata), and many sperm working together break down its cells."],
      ["binds ZP3:", "acrosomal reaction", "Step 2: a sperm recognizes and binds ZP3 on the zona pellucida, which sets off the acrosomal reaction: the acrosome ruptures and releases its hyaluronidases and proteases."],
      ["ZP3 cleaved away,", "binds ZP2", "Step 3: the acrosome's proteases cleave the ZP3 layer, so it is shed and ZP2 is exposed; the sperm binds ZP2, and its enzymes digest a path through the zona pellucida."],
      ["second meiotic", "division", "Step 4: binding ZP2 starts the oocyte's second meiotic division; it becomes haploid, right before fertilization. The first division happened at ovulation."],
      ["cortical reaction:", "polyspermy blocked", "Step 5: binding ZP2 also starts the cortical (zonal) reaction: the oocyte releases its cortical granules and the remaining zona proteins are shed, so no other sperm can bind. One sperm, one egg."],
      ["pronuclei fuse:", "a zygote", "Step 6: the sperm merges with the oocyte's plasma membrane, and soon after the male and female pronuclei fuse. The result is a zygote."]],
    TXT: [
      "The ovulated oocyte and its three layers, from the outside in: the expanded cumulus (Dr. Madison called it the corona radiata), the zona pellucida and the oocyte's own plasma membrane, the oolemma. The sperm's acrosome, the cap on its head, holds the enzymes that will get it through.",
      "Step 1: many capacitated sperm work together to break down the cells of the expanded cumulus (corona radiata), the outermost layer.",
      "Step 2: a sperm recognizes and binds ZP3, a species-specific receptor on the zona pellucida. \"ZP3 stimulates the acrosomal reaction\": the acrosome ruptures and releases its hyaluronidases and proteases.",
      "Step 3: the acrosome's proteases cleave the ZP3 layer, so it is shed and ZP2 is exposed. The sperm binds ZP2 instead, because the ZP3 receptors are gone, and its enzymes digest a path through the zona pellucida.",
      "Step 4: binding ZP2 starts two things. The first is the oocyte's second meiotic division: it becomes haploid, right before fertilization (the first division happened at ovulation). Another sperm is binding ZP3 elsewhere on the zona.",
      "Step 5: the second is the cortical (zonal) reaction: the oocyte releases its cortical granules and the remaining zona proteins are shed, so no other sperm can bind. That prevents polyspermy: a single sperm fertilizes a single egg.",
      "Step 6: the sperm merges with the oocyte's plasma membrane, the last layer, and soon after the male and female pronuclei fuse. The result is a zygote."],
    RO: ["three layers", "cumulus", "ZP3 · acrosome", "ZP2", "meiosis II", "cortical reaction", "zygote"],
  });
  return makeFig({
    id: "oocyte", lec: "preg", fig: "Fig 3", short: "Getting into the oocyte", hint: "step · hover",
    title: "Getting into the oocyte",
    caption: "Step a sperm in through the three layers around the ovulated oocyte: ZP3 and the acrosomal reaction, ZP3 cleaved away and ZP2 bound, the second meiotic division, the cortical reaction that blocks a second sperm, and the pronuclei fusing.",
    W, H,
    label: "A magnified strip of the layers around an ovulated oocyte (the expanded cumulus, the ZP3 layer and ZP2 on the zona pellucida, the plasma membrane with cortical granules) above the whole oocyte, with a sperm that moves in through the layers step by step and a numbered list of the six steps.",
    D, render: ocRender, say: ocSay, helpers: [rnd, ocState, ocTipX, ocSperm, ocWs, ocR, ocTh, ocP, ocRing],
    controls: `<div class="am-controls"><label class="am-slider"><span>start</span><input type="range" min="0" max="6" step="1" value="0" data-amk="s" aria-label="Step of fertilization"><span>6</span></label><button type="button" class="am-btn" data-amplay aria-pressed="false">Play</button></div>
<div class="am-controls"><button type="button" class="am-btn" data-amstep="-1">Back</button><button type="button" class="am-btn" data-amstep="1">Next step</button></div>`,
    sources: [
      "From the L17 recording and slides (Dr. Madison): the three layers from the outside in (the expanded cumulus, which he called the corona radiata; the zona pellucida; the plasma membrane, or oolemma); the acrosome's hyaluronidases and proteases; many sperm breaking down the corona radiata together; ZP3, a species-specific receptor, setting off the acrosomal reaction; the proteases cleaving the ZP3 layer to expose ZP2; ZP2 binding starting the second meiotic division and the cortical (zonal) reaction; the remaining zona proteins shed so no other sperm can bind; the pronuclei fusing into a zygote. The order of the steps is his slide's.",
      "Where the lecture and textbooks differ, the figure follows the lecture. He and his slide tie the second meiotic division to ZP2 binding; Costanzo (Physiology) and Guyton and Hall (Textbook of Medical Physiology) say the oocyte completes it once the sperm enters, as it fuses with the oolemma. Histology texts (Junqueira's Basic Histology) use \"corona radiata\" only for the innermost cumulus cells, the ones against the zona; the lecture uses it for the whole cumulus. In humans the two pronuclei meet and their envelopes break down as the first division begins, which the lecture calls fusing.",
      "Drawn to true proportions, both views at the same sizes (the strip at about 4 pixels per micrometer, the whole oocyte at about 0.9): the human oocyte about 110 micrometers across and its zona about 15 micrometers thick (ESHRE Atlas of Human Embryology; Gilbert, Developmental Biology), cumulus cells about 10 micrometers, the sperm's head about 5 by 3 micrometers with a midpiece about as long and a tail about 45 micrometers (WHO laboratory manual for the examination of human semen). The cortical granules (really under a micrometer) and the perivitelline space are drawn larger so they show. None of these sizes is on the drawing, because the lecture gives none.",
      "Schematic in these ways: the strip flattens the curved layers; the zona is really a meshwork of glycoprotein filaments, and the separate ZP3 layer over ZP2 is the lecture's model (the classic mouse studies make ZP3 the first receptor and ZP2 the one the reacted sperm binds: Wassarman, Cell 1999). The small cells beside the oocyte are its polar bodies, drawn because the meiotic divisions leave them; the lecture doesn't name them. Educational, not medical advice."],
    css: `
.anima[data-anima="oocyte"] .am-svg{max-width:600px}
.anima .oocyte-svg .oc-h{font:600 11px var(--anatomy-mono);letter-spacing:.06em;fill:var(--anatomy-muted)}
.anima .oocyte-svg .t.oc-c{font-size:12px}
.anima .oocyte-svg .t.oc-c.is-on{fill:var(--accent-ink);font-weight:700}
.anima .oocyte-svg .t.oc-s{font-size:11.5px;stroke-width:4.5px}
.anima .oocyte-svg .t.oc-tl{fill:var(--bx-ins);font-weight:600}
.anima .oocyte-svg .t.oc-v{fill:var(--bx-violet);font-weight:600}
.anima .oocyte-svg .t.oc-gr{fill:var(--bx-blue);font-weight:600}
.anima .oocyte-svg .t.oc-hot{fill:var(--bx-hot);font-weight:600}
.anima .oocyte-svg .t.oc-bad{fill:var(--bx-inhib);font-weight:600}
.anima .oocyte-svg .t.oc-c.oc-tl.is-on,.anima .oocyte-svg .t.oc-c.oc-v.is-on,.anima .oocyte-svg .t.oc-c.oc-gr.is-on{font-weight:800}
.anima .oocyte-svg .oc-fluid{fill:var(--bx-lumen);stroke:none}
.anima .oocyte-svg .oc-frame{fill:none;stroke:var(--anatomy-lo);stroke-width:1.2}
.anima .oocyte-svg .oc-ooplasm{fill:color-mix(in srgb,var(--bx-cyto) 55%,var(--bx-lumen))}
.anima .oocyte-svg .oc-wmemb{stroke:var(--bx-memb);stroke-width:1.4}
.anima .oocyte-svg .oc-pvs{fill:var(--bx-lumen)}
.anima .oocyte-svg .oc-zona{fill:color-mix(in srgb,var(--bx-eosin) 30%,var(--bx-matrix));stroke:var(--bx-cyto-line);stroke-width:.8}
.anima .oocyte-svg .oc-zona.is-react{fill:color-mix(in srgb,var(--bx-eosin) 18%,var(--bx-matrix))}
.anima .oocyte-svg .oc-fib{fill:none;stroke:var(--bx-eosin);stroke-width:.8;opacity:.7}
.anima .oocyte-svg .oc-chan{fill:var(--bx-lumen);stroke:var(--bx-hot);stroke-width:.8;stroke-linejoin:round}
.anima .oocyte-svg .oc-wchan{fill:none;stroke:var(--bx-lumen);stroke-width:2.2;stroke-linecap:round}
.anima .oocyte-svg .oc-hit{fill:none;stroke:transparent;stroke-width:8;pointer-events:stroke}
.anima .oocyte-svg .oc-memb{fill:none;stroke:var(--bx-memb);stroke-width:2}
.anima .oocyte-svg .oc-memb.is-on{stroke-width:3}
.anima .oocyte-svg .oc-gran{fill:var(--bx-blue-soft);stroke:var(--bx-blue);stroke-width:1}
.anima .oocyte-svg .oc-cup{fill:none;stroke:var(--bx-blue);stroke-width:1.2}
.anima .oocyte-svg .oc-rel{fill:var(--bx-blue)}
.anima .oocyte-svg .oc-zp3b{fill:var(--bx-ins-soft)}
.anima .oocyte-svg .oc-zp2b{fill:var(--bx-violet-soft)}
.anima .oocyte-svg .oc-zp3{fill:none;stroke:var(--bx-ins);stroke-width:1.4;stroke-linecap:round}
.anima .oocyte-svg .oc-zp3k{fill:var(--bx-ins)}
.anima .oocyte-svg .oc-zp2{fill:var(--bx-violet)}
.anima .oocyte-svg .oc-zp2r{fill:none;stroke:var(--bx-violet);stroke-width:1.3}
.anima .oocyte-svg .oc-cmx{fill:color-mix(in srgb,var(--bx-cyto) 22%,var(--bx-lumen))}
.anima .oocyte-svg .oc-cell{fill:var(--bx-cyto);stroke:var(--bx-cyto-line);stroke-width:.9}
.anima .oocyte-svg .oc-cnu{fill:var(--bx-nuc);opacity:.85}
.anima .oocyte-svg .oc-enz{fill:var(--bx-hot)}
.anima .oocyte-svg .oc-tail{fill:none;stroke:var(--bx-sperm);stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.anima .oocyte-svg .oc-tail2{stroke-width:1.1}
.anima .oocyte-svg .oc-mid{fill:color-mix(in srgb,var(--bx-sperm) 40%,var(--surface));stroke:var(--bx-sperm);stroke-width:.9}
.anima .oocyte-svg .oc-sheath{fill:none;stroke:var(--bx-sperm);stroke-width:.6;opacity:.8}
.anima .oocyte-svg .oc-head{fill:color-mix(in srgb,var(--bx-sperm) 25%,var(--surface));stroke:var(--bx-sperm);stroke-width:1.1}
.anima .oocyte-svg .oc-head.oc-lead{stroke-width:1.5}
.anima .oocyte-svg .oc-acro{fill:var(--bx-gold-soft);stroke:var(--bx-gold);stroke-width:1.2}
.anima .oocyte-svg .oc-nuc{fill:var(--bx-sperm)}
.anima .oocyte-svg .oc-ves{fill:var(--bx-gold);stroke:var(--surface);stroke-width:.4}
.anima .oocyte-svg .oc-no{fill:var(--surface);stroke:var(--bx-inhib);stroke-width:1.4}
.anima .oocyte-svg .oc-nox{fill:none;stroke:var(--bx-inhib);stroke-width:1.6;stroke-linecap:round}
.anima .oocyte-svg .oc-wzp3{fill:none;stroke:var(--bx-ins);stroke-width:1.2}
.anima .oocyte-svg .oc-pb{fill:var(--bx-cyto);stroke:var(--bx-cyto-line);stroke-width:.8}
.anima .oocyte-svg .oc-chr{fill:var(--bx-nuc-line)}
.anima .oocyte-svg .oc-spin{fill:none;stroke:var(--bx-nuc);stroke-width:.7;opacity:.8}
.anima .oocyte-svg .oc-fpn{fill:color-mix(in srgb,var(--bx-nuc) 45%,var(--surface));stroke:var(--bx-nuc-line);stroke-width:1}
.anima .oocyte-svg .oc-mpn{fill:color-mix(in srgb,var(--bx-sperm) 40%,var(--surface));stroke:var(--bx-sperm);stroke-width:1}
.anima .oocyte-svg .oc-wtail{fill:none;stroke:var(--bx-sperm);stroke-width:.9;stroke-linecap:round}
.anima .oocyte-svg .oc-whead{fill:var(--bx-sperm)}
.anima .oocyte-svg .oc-zl{fill:none;stroke:var(--anatomy-mid);stroke-width:.8}
.anima .oocyte-svg .oc-zbox{fill:none;stroke:var(--anatomy-mid);stroke-width:1.1}
.anima .oocyte-svg .oc-row{fill:var(--anatomy-shade-1);stroke:var(--anatomy-lo);stroke-width:.8}
.anima .oocyte-svg .oc-row.is-on{fill:var(--accent-soft);stroke:var(--accent);stroke-width:1.4}
.anima .oocyte-svg .oc-num{fill:var(--surface);stroke:var(--anatomy-mid);stroke-width:1}
.anima .oocyte-svg .oc-num.is-on{fill:var(--accent);stroke:var(--accent)}
.anima .oocyte-svg .oc-num.is-done{fill:var(--anatomy-shade-2)}
.anima .oocyte-svg .oc-nt{font:700 11px var(--anatomy-mono);fill:var(--anatomy-text);stroke:none}
.anima .oocyte-svg .oc-nt.is-on{fill:var(--surface)}
.anima .oocyte-svg .oc-rt{font:11.5px var(--anatomy-mono);fill:var(--anatomy-muted);stroke:none}
.anima .oocyte-svg .oc-rt.is-done{fill:var(--anatomy-text)}
.anima .oocyte-svg .oc-rt.is-on{fill:var(--accent-ink);font-weight:700}
.anima .oocyte-svg .oc-pt{fill:none;stroke:var(--accent);stroke-width:1}
.anima .oocyte-svg .oc-h,.anima .oocyte-svg .oc-rt,.anima .oocyte-svg .oc-nt{stroke:none}
@media (max-width:560px){.anima .oocyte-svg .oc-h{font-size:12px}.anima .oocyte-svg .t.oc-c,.anima .oocyte-svg .t.oc-s{font-size:13px}.anima .oocyte-svg .oc-rt{font-size:12.5px}.anima .oocyte-svg .oc-nt{font-size:12px}}
`,
  });
}
