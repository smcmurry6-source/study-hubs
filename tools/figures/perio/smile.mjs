// Fig: the esthetic checklist on the anterior teeth (Periodontology S9, from Dr. Abou-Arraj's slides and his Nov 12 live
// class). A frontal view of #5-#12 with the gingiva and the lips, in mm (8.6 px = 1 mm, the centrals' incisal edges at
// y = 0), and four checks from the notes:
//   the smile line: low shows no gingiva, medium up to 2-3 mm (the ideal), high more;
//   the gingival line: the centrals' and canines' margins level, the laterals' about 1 mm coronal;
//   the gingival zenith: slightly distal to each tooth's midline, the canine included;
//   the proportions: the golden proportion seen from the front (central 1.6 : lateral 1 : visible canine 0.6), and a
//     central about 75-80% as wide as it is long (10 mm long, about 8 mm wide), never square.
// Three mouths: an ideal one; his Patient 1 (a high smile line, flat contours on #8-#10, laterals about 1 mm apical to
// the centrals, #6 and #11 asymmetric, square centrals, #7 near-ideal and the reference tooth); and Patient 1 after
// crown lengthening (2 mm of bone for 2 mm of gingiva on the centrals, #10 matched to #7, the canines lengthened, more at
// #6 than at #11, with #6 a compromise). Positions not given in the notes (how far #6 and #11 sat, the papillae, the
// lips) are illustrative.
import { figureSvg, plateHtml } from "./shared.mjs";

const S = 8.6, W = 416, H = 330, CX = 208, PY = 211;

/* a smooth path through the points (Catmull-Rom as cubic Beziers), mm to px */
function smPath(D, pts, close) {
  var f = function (n) { return Math.round(n * 10) / 10; }, X = function (mm) { return f(D.CX + mm * D.S); }, Y = function (mm) { return f(D.PY + mm * D.S); };
  var n = pts.length, P = function (i) { return pts[close ? (i + n) % n : Math.max(0, Math.min(n - 1, i))]; }, o = "M" + X(pts[0][0]) + " " + Y(pts[0][1]);
  for (var i = 0; i < (close ? n : n - 1); i++) {
    var p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    o += "C" + X(p1[0] + (p2[0] - p0[0]) / 6) + " " + Y(p1[1] + (p2[1] - p0[1]) / 6) + " " + X(p2[0] - (p3[0] - p1[0]) / 6) + " " + Y(p2[1] - (p3[1] - p1[1]) / 6) + " " + X(p2[0]) + " " + Y(p2[1]);
  }
  return o + (close ? "Z" : "");
}
function smLine(D, pts, close) { var o = ""; for (var i = 0; i < pts.length; i++) o += (i ? "L" : "M") + Math.round((D.CX + pts[i][0] * D.S) * 10) / 10 + " " + Math.round((D.PY + pts[i][1] * D.S) * 10) / 10; return o + (close ? "Z" : ""); }
/* the teeth for a mouth k: x0 < x1 in mm, the zenith z and the edge (or cusp tip) e, the zenith's x */
function smTeeth(k, D) {
  var P = D.P[k], T = [], side = function (ns, sg) {
    var x = .05, out = [];
    ns.forEach(function (n) {
      var kind = D.KIND[n], w = D.TW[kind], flat = P.flat.indexOf(n) >= 0, fz = flat ? .5 : D.ZF[kind];
      var m = x * sg, d = (x + w) * sg;
      out.push({ n: n, kind: kind, x0: Math.min(m, d), x1: Math.max(m, d), xm: m, sg: sg, w: w, z: P.z[n], e: D.E[kind], flat: flat, xz: m + sg * fz * w });
      x += w + .1;
    });
    return out;
  };
  T = side([8, 7, 6, 5, 4], -1).reverse().concat(side([9, 10, 11, 12, 13], 1));
  return T;
}
/* the gingival margin across the arch: a scallop over each tooth, a papilla between neighbors */
function smMargin(T, D) {
  var pap = [], M = [], i, j;
  for (i = 0; i < T.length - 1; i++) {
    var a = T[i], b = T[i + 1], dep = D.PDEP[a.kind + b.kind] * (a.flat || b.flat ? .62 : 1);
    pap.push([(a.x1 + b.x0) / 2, Math.max(a.z, b.z) + dep]);
  }
  pap.unshift([T[0].x0 - .4, T[0].z + 2.2]); pap.push([T[T.length - 1].x1 + .4, T[T.length - 1].z + 2.2]);
  for (i = 0; i < T.length; i++) {
    var t = T[i], L = pap[i], R = pap[i + 1], ex = t.flat ? 3.4 : 2;
    for (j = 0; j <= 12; j++) { var u = j / 12; M.push([L[0] + (t.xz - L[0]) * u, t.z + (L[1] - t.z) * Math.pow(1 - u, ex)]); }
    for (j = 1; j < 12; j++) { var v = j / 12; M.push([t.xz + (R[0] - t.xz) * v, t.z + (R[1] - t.z) * Math.pow(v, ex)]); }
  }
  M.push(R);
  return M;
}
function smAt(M, x) { if (x <= M[0][0]) return M[0][1]; for (var i = 1; i < M.length; i++) if (x <= M[i][0]) { var a = M[i - 1], b = M[i]; return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0] || 1); } return M[M.length - 1][1]; }
/* one tooth's outline from the front, from under the gingiva to the edge; u runs mesial (0) to distal (w) */
function smTooth(t) {
  var w = t.w, z = t.z, e = t.e, top = z - 2.6, p;
  if (t.kind === "c") p = [[.4, top], [.12, z + 3], [.03, e - 1.6], [.12, e - .45], [.55, e - .02], [w - 1.4, e], [w - .5, e - .35], [w - .12, e - 1.3], [w - .06, e - 2.8], [w - .22, z + 3], [w - .6, top]];
  else if (t.kind === "l") p = [[.45, top], [.15, z + 3], [.06, e - 1.7], [.28, e - .5], [.95, e - .04], [w - 1.7, e - .1], [w - .6, e - .65], [w - .16, e - 1.9], [w - .14, z + 3], [w - .5, top]];
  else if (t.kind === "k") { var tip = w * .42; p = [[.3, top], [.1, z + 3], [.05, e - 2.1], [tip - .55, e - .3], [tip, e], [tip + .6, e - .45], [w - .1, e - 2.7], [w - .2, z + 3], [w - .45, top]]; }
  else { var c = w * .5; p = [[.3, top], [.12, z + 2.6], [.06, e - 1.7], [c - .5, e - .25], [c, e], [c + .5, e - .3], [w - .06, e - 1.7], [w - .12, z + 2.6], [w - .3, top]]; }
  return p.map(function (q) { return [t.xm + t.sg * q[0], q[1]]; });
}
/* the lips: retracted for the checks on the teeth, or in a full smile with the lip where it was put */
function smLips(st) {
  return st.mode === "smile" ? { L: st.lip, hw: 22.5, cy: st.lip + 4, lo0: 2.2, eu: 1, el: 4, vb: 4.2, lb: 6 } : { L: -17.6, hw: 23, cy: -6, lo0: 6.5, eu: 2, el: 2, vb: 3, lb: 4.5 };
}
function smDyn(st, D) {
  var f = function (n) { return Math.round(n * 10) / 10; }, X = function (mm) { return f(D.CX + mm * D.S); }, Y = function (mm) { return f(D.PY + mm * D.S); };
  var T = smTeeth(st.k, D), M = smMargin(T, D), Lp = smLips(st), o = "", i, j, x;
  var by = {}; T.forEach(function (t) { by[t.n] = t; });
  var up = function (x) { return Lp.L + (Lp.cy - Lp.L) * Math.min(1, Math.pow(x / Lp.hw, 2 * Lp.eu)); }, lo = function (x) { return Lp.lo0 - (Lp.lo0 - Lp.cy) * Math.min(1, Math.pow(x / Lp.hw, 2 * Lp.el)); };
  var U = [], Lo = [];
  for (i = 0; i <= 48; i++) { x = -Lp.hw + 2 * Lp.hw * i / 48; U.push([x, up(x)]); }
  for (i = 48; i >= 0; i--) { x = -Lp.hw + 2 * Lp.hw * i / 48; Lo.push([x, lo(x)]); }
  var open = smLine(D, U.concat(Lo), true);
  o += '<path class="sm-mouth" d="' + open + '"/>';
  /* the teeth, the premolars in shadow; Patient 1's fluorosis as faint flecks */
  var teeth = "";
  T.forEach(function (t) {
    teeth += '<path class="sm-tooth' + (t.kind === "p" || t.kind === "q" ? " sm-pm" + (t.kind === "q" ? " sm-pm2" : "") : "") + '" d="' + smPath(D, smTooth(t), true) + '"/>';
    if (t.kind === "c" || t.kind === "l") {
      var a = t.xm + t.sg * .6, b = t.xm + t.sg * (t.w - .9);
      teeth += '<path class="sm-trans" d="' + smPath(D, [[a, t.e - .35], [(a + b) / 2, t.e - 1.25], [b, t.e - .45], [(a + b) / 2, t.e - .7]], true) + '"/>';
    }
    if (t.kind !== "p" && t.kind !== "q") { var hx = t.xm + t.sg * t.w * .33, hw = t.w * .1; teeth += '<path class="sm-hi" d="' + smPath(D, [[hx - hw, t.z + 1.6], [hx + hw, t.z + 1.4], [hx + hw * .8, t.e - 2.4], [hx - hw * .9, t.e - 2.2]], true) + '"/>'; }
    if (st.k > 0 && t.kind !== "p" && t.kind !== "q") for (j = 0; j < 3; j++) { var fx = t.xm + t.sg * t.w * (.25 + .27 * j), fy = t.z + (t.e - t.z) * (.45 + .17 * ((j * 7 + t.n) % 3)); teeth += '<ellipse class="sm-fleck' + (j === 1 ? " sm-brown" : "") + '" cx="' + X(fx) + '" cy="' + Y(fy) + '" rx="' + f(t.w * (j === 1 ? .07 : .09) * D.S) + '" ry="' + f((j === 1 ? .25 : .32) * D.S) + '"/>'; }
  });
  o += '<g class="hot" data-info="' + D.HOT.teeth[st.k] + '">' + teeth + "</g>";
  /* the gingiva, its stippling, the alveolar mucosa above the MGJ */
  var gum = [[-25, -26], [25, -26], [25, M[M.length - 1][1]]].concat(M.slice().reverse(), [[-25, M[0][1]]]);
  var mgj = function (x) { return -15 - .5 * (x / 20) * (x / 20); }, MG = [];
  for (i = 0; i <= 40; i++) { x = -25 + 50 * i / 40; MG.push([x, mgj(x)]); }
  var dots = "";
  for (i = 0; i < 36; i++) for (j = 0; j < 11; j++) {
    var h1 = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453, h2 = Math.sin(i * 39.346 + j * 11.135) * 24634.6345;
    h1 -= Math.floor(h1); h2 -= Math.floor(h2);
    var dx = -20 + i * 1.15 + (h1 - .5) * .8, dy = -14.6 + j * 1.15 + (h2 - .5) * .8;
    if (dy < smAt(M, dx) - .9 && dy > mgj(dx) + .5) dots += '<circle cx="' + X(dx) + '" cy="' + Y(dy) + '" r=".75"/>';
  }
  o += '<g class="hot" data-info="' + D.HOT.gum + '"><path class="sm-gum" d="' + smLine(D, gum, true) + '"/><g class="sm-stip">' + dots + "</g></g>";
  o += '<g class="hot" data-info="' + D.HOT.muc + '"><path class="sm-muc" d="' + smLine(D, [[-25, -26], [25, -26]].concat(MG.slice().reverse()), true) + '"/></g>';
  o += '<path class="sm-mgj" d="' + smLine(D, MG, false) + '"/>';
  /* the face with the mouth open in it, then the lips */
  var face = "M0 0H" + D.W + "V" + D.H + "H0Z";
  o += '<path class="sm-skin" fill-rule="evenodd" d="' + face + open + '"/>';
  var uv = [], lv = [];
  for (i = 0; i <= 48; i++) { x = -Lp.hw + 2 * Lp.hw * i / 48; var q = Math.min(1, (x / Lp.hw) * (x / Lp.hw)), ax = Math.abs(x); uv.push([x, up(x) - (Lp.vb * (1 - .75 * q) + .8 * Math.exp(-(ax - 5) * (ax - 5) / 6) - .6 * Math.exp(-x * x / 2.5))]); }
  for (i = 48; i >= 0; i--) { x = -Lp.hw + 2 * Lp.hw * i / 48; var q2 = Math.min(1, (x / Lp.hw) * (x / Lp.hw)); lv.push([x, lo(x) + Lp.lb * (1 - .8 * q2)]); }
  o += '<g class="hot" data-info="' + D.HOT.lip[st.mode === "smile" ? 0 : 1] + '"><path class="sm-lip" d="' + smLine(D, U.concat(uv.reverse()), true) + '"/><path class="sm-lip" d="' + smLine(D, Lo.slice().reverse().concat(lv), true) + '"/></g>';
  o += '<text class="sm-t sm-tag" x="14" y="20">' + (st.mode === "smile" ? "FULL SMILE" : "LIPS RETRACTED") + "</text>";
  /* the check's overlay */
  var c8 = by[8], c9 = by[9], ref = (c8.z + c9.z) / 2, six = [6, 7, 8, 9, 10, 11];
  if (st.mode === "smile") {
    var show = c9.z - up(c9.xz), xb = c9.xz;
    if (show > .05) o += '<path class="sm-brk" d="M' + X(xb - .5) + " " + Y(c9.z) + "H" + X(xb + .5) + "M" + X(xb) + " " + Y(c9.z) + "V" + Y(up(xb)) + "M" + X(xb - .5) + " " + Y(up(xb)) + "H" + X(xb + .5) + '"/><circle class="sm-zdot" cx="' + X(xb) + '" cy="' + Y(c9.z) + '" r="2.6"/>';
    var lt = show > .05 ? fmt(show) + " mm of gingiva" : "no gingiva showing";
    o += '<text class="sm-t sm-on" x="' + X(xb + 1.1) + '" y="' + Y(show > .05 ? (c9.z + up(xb)) / 2 + .45 : up(xb) + 1.8) + '">' + lt + "</text>";
  } else if (st.mode === "gline") {
    o += '<path class="sm-guide" d="M' + X(-16.8) + " " + Y(ref) + "H" + X(16.8) + '"/>';
    o += '<path class="sm-gline" d="' + smLine(D, six.map(function (n) { return [by[n].xz, by[n].z]; }), false) + '"/>';
    six.forEach(function (n) { o += '<circle class="sm-zdot" cx="' + X(by[n].xz) + '" cy="' + Y(by[n].z) + '" r="2.6"/>'; });
    var l = by[10], dz = l.z - ref, bx = l.xz + 1.25;
    o += '<path class="sm-brk" d="M' + X(bx - .4) + " " + Y(ref) + "H" + X(bx) + "V" + Y(l.z) + "H" + X(bx - .4) + '"/>';
    o += '<text class="sm-t sm-on" x="' + X(l.xz + .6) + '" y="' + Y(Math.min(ref, l.z) - 1.3) + '" text-anchor="middle">' + fmt(Math.abs(dz)) + " mm " + (dz > 0 ? "coronal" : "apical") + "</text>";
    o += '<text class="sm-t sm-on" x="' + X(-16.9) + '" y="' + Y(ref - .5) + '" text-anchor="end">centrals</text>';
    if (st.k > 0) o += '<text class="sm-t sm-onm" x="' + X((by[7].x0 + by[7].x1) / 2) + '" y="' + Y(4.1) + '" text-anchor="middle">reference</text>';
  } else if (st.mode === "zenith") {
    six.forEach(function (n) {
      var t = by[n], mid = (t.x0 + t.x1) / 2;
      o += '<path class="sm-axis" d="M' + X(mid) + " " + Y(t.z - 1.6) + "V" + Y(t.e - 1.2) + '"/><circle class="sm-zdot" cx="' + X(t.xz) + '" cy="' + Y(t.z) + '" r="2.6"/>';
    });
    o += '<text class="sm-t sm-on" x="' + X(9) + '" y="' + Y(c9.z - 2.2) + '" text-anchor="middle">' + D.ZTXT[st.k] + "</text>";
  } else {
    six.forEach(function (n) {
      var t = by[n], mid = (t.x0 + t.x1) / 2;
      o += '<path class="sm-bar" d="M' + X(t.x0 + .2) + " " + Y(1.9) + "H" + X(t.x1 - .2) + "M" + X(t.x0 + .2) + " " + Y(1.45) + "V" + Y(2.35) + "M" + X(t.x1 - .2) + " " + Y(1.45) + "V" + Y(2.35) + '"/>';
      o += '<text class="sm-t sm-onm" x="' + X(mid) + '" y="' + Y(4) + '" text-anchor="middle">' + D.GOLD[t.kind] + "</text>";
    });
    o += '<path class="sm-box" d="M' + X(c9.x0 + .05) + " " + Y(c9.z) + "H" + X(c9.x1 - .05) + "V" + Y(c9.e) + "H" + X(c9.x0 + .05) + "Z" + '"/>';
    var r = Math.round(100 * D.TW.c / (c9.e - c9.z)), ym = (c9.z + c9.e) / 2;
    o += '<text class="sm-t sm-on sm-big" x="' + X((c9.x0 + c9.x1) / 2) + '" y="' + Y(ym + .2) + '" text-anchor="middle">' + r + "%</text>";
    o += '<text class="sm-t sm-on" x="' + X((c9.x0 + c9.x1) / 2) + '" y="' + Y(ym + 1.7) + '" text-anchor="middle">wide/long</text>';
  }
  if (st.mode === "gline" || st.mode === "zenith") six.forEach(function (n) { var t = by[n]; o += '<text class="sm-t sm-onm sm-num" x="' + X((t.x0 + t.x1) / 2) + '" y="' + Y(2.7) + '" text-anchor="middle">#' + n + "</text>"; });
  return o;
}
function fmt(n) { var r = Math.round(n * 2) / 2; return String(r); }

const D = {
  W, H, S, CX, PY,
  KIND: { 4: "q", 5: "p", 6: "k", 7: "l", 8: "c", 9: "c", 10: "l", 11: "k", 12: "p", 13: "q" },
  TW: { c: 8, l: 4.95, k: 3.06, p: 2.8, q: 2.3 }, // the golden proportion from the front: 1.618 : 1 : 0.618
  E: { c: 0, l: -.8, k: -.3, p: -1.4, q: -2 },
  ZF: { c: .6, l: .58, k: .53, p: .5, q: .5 },
  PDEP: { cc: 4.2, cl: 3.6, lc: 3.6, lk: 3.2, kl: 3.2, kp: 2.8, pk: 2.8, pq: 2.5, qp: 2.5 },
  GOLD: { c: "1.6", l: "1", k: "0.6" },
  P: [
    { z: { 4: -8, 5: -8.6, 6: -10, 7: -9, 8: -10, 9: -10, 10: -9, 11: -10, 12: -8.6, 13: -8 }, flat: [] },
    { z: { 4: -7, 5: -7.4, 6: -7.6, 7: -9, 8: -8, 9: -8, 10: -8.9, 11: -8.2, 12: -7.6, 13: -7.1 }, flat: [8, 9, 10] },
    { z: { 4: -7, 5: -7.4, 6: -9.5, 7: -9, 8: -10, 9: -10, 10: -9, 11: -10, 12: -7.6, 13: -7.1 }, flat: [] },
  ],
  LIP0: [-12, -12.5, -12.5],
  NAME: ["Ideal", "Patient 1", "After crown lengthening"],
  RO: ["Ideal", "Patient 1", "After"],
  MODES: { smile: "smile line", gline: "gingival line", zenith: "zeniths", prop: "proportions" },
  ZTXT: ["zeniths: slightly distal", "#8-#10: flat contours", "zeniths: slightly distal"],
  STATS: {
    gline: [["Laterals", ["1 mm coronal (ideal)", "1 mm apical", "1 mm coronal"]], ["Canines", ["level with the centrals", "uneven, #6 and #11", "#11 level; #6 a compromise"]]],
    zenith: [["Zeniths", ["slightly distal", "flat on #8 and #9", "slightly distal"]], ["Contours", ["scalloped", "flat on #8-#10", "scalloped"]]],
    prop: [["From the front", ["1.6 : 1 : 0.6", "1.6 : 1 : 0.6", "1.6 : 1 : 0.6"]], ["Central, wide/long", ["80%", "about 100%: square", "80%"]]],
  },
  SUM: {
    gline: [
      "The gingival line: the central incisors' and canines' margins level (a canine up to 1 mm more apical is accepted), and the lateral incisors' about 1 mm coronal to them. The dots are each tooth's zenith.",
      "Patient 1: the laterals (#7 and #10) sat about 1 mm apical to the centrals instead of 1 mm coronal, and #6 and #11 were asymmetric. #7 had near-ideal proportions, so it became the reference tooth: lengthening it would have meant moving everything else further apically.",
      "After crown lengthening around #7, the reference tooth: the centrals' margins went about 2 mm apically (2 mm of bone for 2 mm of gingiva), so the laterals now sit 1 mm coronal to them; #10 was matched to #7; the canines were lengthened, more at #6 than at #11, but #6 was a compromise, since matching #11 would have exposed root.",
    ],
    zenith: [
      "The gingival zenith, the height of contour, sits slightly distal to each tooth's midline (the dashed line), the canine included. From the front the canine's looks centered only because the canine sits at the corner of the arch.",
      "Patient 1: #8 and #9 had flat heights of contour (flat gingival contours on #8-#10), with no clear zenith.",
      "After crown lengthening the new margins are scalloped again, each zenith slightly distal to the tooth's midline.",
    ],
    prop: [
      "The golden proportion, seen from the front: if the lateral is 1 wide, the central is about 1.6 and the visible part of the canine about 0.6. A central incisor is about 75-80% as wide as it is long (10 mm long, about 8 mm wide), never square.",
      "Patient 1: square centrals. Short clinical crowns with gingival line asymmetries point to altered passive eruption: the widths are fine, but the gingiva covers part of each crown.",
      "After crown lengthening the centrals are 2 mm longer, about 80% as wide as they are long: crown lengthening changes a tooth's length, not its width. Provisional veneers went on at 3 weeks, the definitive restorations at six months.",
    ],
  },
  SMILE: {
    low: "A low smile line: the lip covers the gingival margins, so no gingiva shows.",
    medium: "A medium smile line: up to 2-3 mm of gingiva shows. That's the ideal.",
    high: "A high smile line: more than 3 mm of gingiva shows.",
    pt: ["Drag the lip to see each kind.", "Patient 1's smile line was high, more than 3 mm. Her facial thirds were equal and her lip of normal length and mobility: the cause was short clinical crowns.", "Her lip hasn't moved: crown lengthening moved her margins about 2 mm apically, so less gingiva shows."],
  },
  HOT: {
    teeth: ["The maxillary anterior teeth from the front, central to canine, with the first premolars in the shadow behind the canines.",
      "Patient 1's teeth: generalized fluorosis, which she disliked and wanted veneers for, square centrals and short clinical crowns.",
      "Patient 1 after crown lengthening: longer clinical crowns, still with fluorosis until the veneers."],
    gum: "The gingiva: the gingival line runs along its margins, with a zenith (the height of contour) over each tooth and a papilla between neighbors.",
    muc: "The alveolar mucosa, above the MGJ.",
    lip: ["The upper lip on a full smile: how much gingiva it uncovers is the smile line.", "The lips held back, so the whole gingival line shows."],
  },
};

const st0 = { k: 0, mode: "smile", lip: -12 };
const scale = `<path class="sm-scale" d="M${W - 16 - 5 * S} ${H - 14}h${5 * S}M${W - 16 - 5 * S} ${H - 18}v8M${W - 16} ${H - 18}v8"/><text class="sm-t sm-small" x="${W - 16 - 2.5 * S}" y="${H - 21}" text-anchor="middle">5 mm</text>`;
const svg = figureSvg({ width: W, height: H, className: "sm-svg", label: "The maxillary anterior teeth from the front with their gingiva and the lips: the smile line, the gingival line, the gingival zeniths and the teeth's proportions, for an ideal smile and for Patient 1 before and after crown lengthening.",
  body: `<g class="sm-dyn">${smDyn(st0, D)}</g>${scale}` });
const plate = plateHtml({ fig: "S9 · Fig 8", title: "The esthetic checklist", hint: "pick a check", readout: "Ideal · smile line", body: `<div class="am-svg sm-box">${svg}</div>` });
const controls = `<div class="am-controls" role="group" aria-label="Whose mouth">${D.NAME.map((n, i) => `<button type="button" class="am-btn" data-smk="${i}" aria-pressed="${i === 0}">${n}</button>`).join("")}</div>
<div class="am-controls" role="group" aria-label="Check">${Object.keys(D.MODES).map((m) => `<button type="button" class="am-btn" data-smm="${m}" aria-pressed="${m === "smile"}">${D.MODES[m].charAt(0).toUpperCase() + D.MODES[m].slice(1)}</button>`).join("")}</div>
<div class="am-controls" data-sm-lip><label class="am-slider">The lip on a full smile <input type="range" min="-3" max="7" step="0.5" value="2" data-sml aria-label="Gingiva showing above the central incisors on a full smile, in millimeters"><b data-sml-out></b></label></div>
<div class="am-stats"><span><i data-sm-a></i> <b data-sm="0"></b></span><span><i data-sm-b></i> <b data-sm="1"></b></span></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Tap the teeth, the gingiva or the lip.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From Dr. Abou-Arraj's slides, his Nov 12 live class and the notes: the smile line (low, medium up to 2-3 mm, high), the gingival line (centrals and canines level, laterals about 1 mm coronal), the zenith slightly distal, the golden proportion seen from the front, a central about 75-80% as wide as it is long (10 mm by about 8 mm), and his Patient 1, before and after crown lengthening.</li>
<li>Outside sources: the frontal widths at the golden proportion follow Levin (J Prosthet Dent 1978;40:244-52); the gingival line's levels and the zenith's distal position follow Chu, Tan, Stappert and Tarnow (J Esthet Restor Dent 2009;21:113-20); the smile line's three heights follow Tjan, Miller and The (J Prosthet Dent 1984;51:24-28). They settled where the zeniths sit and what each smile line shows.</li>
<li>A schematic, drawn to one scale (the 5 mm bar): the papillae, the lips, the premolars and how far #6 and #11 sat in Patient 1 are illustrative, and the teeth keep the same widths in all three mouths. Educational, not medical advice.</li></ul></details>`;

function smLive(root, D) {
  var svg = root.querySelector(".sm-svg"), dyn = svg.querySelector(".sm-dyn"), sum = root.querySelector(".am-summary"), info = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]");
  var lipRow = root.querySelector("[data-sm-lip]"), lipIn = root.querySelector("[data-sml]"), lipOut = root.querySelector("[data-sml-out]");
  var st = { k: 0, mode: "smile", lip: D.LIP0[0] };
  function zc() { return D.P[st.k].z[9]; }
  function draw() {
    dyn.innerHTML = D.smDyn(st, D);
    var show = zc() - st.lip, cls = show <= 0 ? "low" : show <= 3 ? "medium" : "high";
    lipRow.hidden = st.mode !== "smile"; lipIn.value = show;
    lipOut.textContent = (show > 0 ? D.fmt(show) + " mm of gingiva" : "no gingiva") + " · " + cls;
    var a = root.querySelector("[data-sm-a]"), b = root.querySelector("[data-sm-b]"), v0 = root.querySelector('[data-sm="0"]'), v1 = root.querySelector('[data-sm="1"]');
    if (st.mode === "smile") { a.textContent = "Gingiva showing"; v0.textContent = show > 0 ? D.fmt(show) + " mm" : "none"; b.textContent = "Smile line"; v1.textContent = cls + (cls === "medium" ? " (ideal)" : ""); sum.textContent = D.SMILE[cls] + " " + D.SMILE.pt[st.k]; }
    else { var S2 = D.STATS[st.mode]; a.textContent = S2[0][0]; v0.textContent = S2[0][1][st.k]; b.textContent = S2[1][0]; v1.textContent = S2[1][1][st.k]; sum.textContent = D.SUM[st.mode][st.k]; }
    if (readout) readout.textContent = D.RO[st.k] + " · " + D.MODES[st.mode];
    root.querySelectorAll("[data-smk]").forEach(function (x) { x.setAttribute("aria-pressed", String(+x.getAttribute("data-smk") === st.k)); });
    root.querySelectorAll("[data-smm]").forEach(function (x) { x.setAttribute("aria-pressed", String(x.getAttribute("data-smm") === st.mode)); });
  }
  root.querySelectorAll("[data-smk]").forEach(function (x) { x.addEventListener("click", function () { var k = +x.getAttribute("data-smk"); if (!(k > 0 && st.k > 0)) st.lip = D.LIP0[k]; st.k = k; draw(); }); });
  root.querySelectorAll("[data-smm]").forEach(function (x) { x.addEventListener("click", function () { st.mode = x.getAttribute("data-smm"); draw(); }); });
  lipIn.addEventListener("input", function () { st.lip = zc() - +lipIn.value; draw(); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && svg.contains(el)) info.textContent = el.getAttribute("data-info"); }
  svg.addEventListener("pointerover", hot); svg.addEventListener("click", hot);
  draw();
}

const CSS = `
.anima .sm-box{max-width:560px;margin:0 auto}
.anima .sm-svg .sm-t{fill:var(--anatomy-text);font:11px var(--anatomy-mono)}
.anima .sm-svg .sm-small{font-size:10.5px;fill:var(--sm-ink)}
.anima .sm-svg .sm-tag{font-size:9.5px;letter-spacing:.1em;fill:var(--sm-ink);opacity:.8}
.anima .sm-svg .sm-on{font-size:10.5px;font-weight:600;fill:var(--sm-ink);paint-order:stroke;stroke:var(--sm-halo);stroke-width:3px;stroke-linejoin:round}
.anima .sm-svg .sm-big{font-size:13px}
.anima .sm-svg .sm-onm{font-size:10px;font-weight:600;fill:var(--sm-on-mouth)}
.anima .sm-svg .sm-num{font-weight:500;opacity:.85}
.anima .sm-svg .sm-skin{fill:var(--sm-skin);stroke:none}
.anima .sm-svg .sm-mouth{fill:var(--sm-mouth)}
.anima .sm-svg .sm-lip{fill:var(--sm-lip);stroke:var(--sm-lip-line);stroke-width:1;stroke-linejoin:round}
.anima .sm-svg .sm-gum{fill:var(--pd-gum);stroke:var(--pd-gum-line);stroke-width:1.1;stroke-linejoin:round}
.anima .sm-svg .sm-stip circle{fill:var(--pd-gum-line);opacity:.22}
.anima .sm-svg .sm-muc{fill:var(--sm-muc);stroke:none}
.anima .sm-svg .sm-mgj{fill:none;stroke:var(--pd-gum-line);stroke-width:1;opacity:.8}
.anima .sm-svg .sm-tooth{fill:var(--sm-enamel);stroke:var(--sm-tooth-line);stroke-width:1;stroke-linejoin:round}
.anima .sm-svg .sm-pm{fill:color-mix(in srgb, var(--sm-enamel) 72%, var(--sm-mouth))}
.anima .sm-svg .sm-pm2{fill:color-mix(in srgb, var(--sm-enamel) 52%, var(--sm-mouth))}
.anima .sm-svg .sm-trans{fill:var(--sm-trans);opacity:.4}
.anima .sm-svg .sm-hi{fill:#fff;opacity:.45}
.anima .sm-svg .sm-fleck{fill:#fff;opacity:.85}
.anima .sm-svg .sm-fleck.sm-brown{fill:var(--sm-brown);opacity:.22}
.anima .sm-svg .sm-guide{fill:none;stroke:var(--sm-ink);stroke-width:1;stroke-dasharray:4 3;opacity:.75}
.anima .sm-svg .sm-gline{fill:none;stroke:var(--sm-accent);stroke-width:1.8;stroke-linejoin:round}
.anima .sm-svg .sm-zdot{fill:var(--sm-accent);stroke:var(--sm-halo);stroke-width:1.2}
.anima .sm-svg .sm-axis{fill:none;stroke:var(--sm-ink);stroke-width:1;stroke-dasharray:3 2.5}
.anima .sm-svg .sm-brk{fill:none;stroke:var(--sm-ink);stroke-width:1.5}
.anima .sm-svg .sm-bar{fill:none;stroke:var(--sm-on-mouth);stroke-width:1.4}
.anima .sm-svg .sm-box{fill:none;stroke:var(--sm-accent);stroke-width:1.4;stroke-dasharray:4 3}
.anima .sm-svg .sm-scale{fill:none;stroke:var(--sm-ink);stroke-width:1.2}
.anima [data-sm-lip][hidden]{display:none}
.anima[data-anima="smile"] .am-stats i{font-style:normal}
.anima[data-anima="smile"]{--sm-skin:#efd8c4;--sm-ink:#3f2c22;--sm-halo:#fbf3ec;--sm-lip:#cf7d86;--sm-lip-line:#a2525d;--sm-mouth:#3a242c;--sm-on-mouth:#f4e9e4;--sm-enamel:#fbf8f2;--sm-tooth-line:#a99f8c;--sm-shade:#b8ad9c;--sm-trans:#b9c9d6;--sm-brown:#a57a45;--sm-muc:color-mix(in srgb, var(--pd-red) 45%, var(--pd-gum));--sm-accent:#1f6f8b}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]) .anima[data-anima="smile"]{--sm-skin:#8a6f5e;--sm-ink:#1d140f;--sm-halo:#e9d7c8;--sm-lip:#a5525e;--sm-lip-line:#6e2f39;--sm-mouth:#120b0e;--sm-on-mouth:#eadfd9;--sm-enamel:#e4ddd0;--sm-tooth-line:#8f8676;--sm-shade:#8c8273;--sm-trans:#9fb0bd;--sm-brown:#8a6236;--sm-muc:#b8344b;--sm-accent:#0f4f66} }
:root[data-theme="dark"] .anima[data-anima="smile"]{--sm-skin:#8a6f5e;--sm-ink:#1d140f;--sm-halo:#e9d7c8;--sm-lip:#a5525e;--sm-lip-line:#6e2f39;--sm-mouth:#120b0e;--sm-on-mouth:#eadfd9;--sm-enamel:#e4ddd0;--sm-tooth-line:#8f8676;--sm-shade:#8c8273;--sm-trans:#9fb0bd;--sm-brown:#8a6236;--sm-muc:#b8344b;--sm-accent:#0f4f66}
`;

export function smile() {
  return { id: "smile", lec: "perio-plastic-esthetics", title: "The esthetic checklist",
    caption: "The esthetic evaluation on the front teeth: the smile line, the gingival line, the zeniths and the proportions, for an ideal smile and for his Patient 1 before and after crown lengthening. From the Nov 12 live class.",
    html: `<div class="anima" data-anima="smile">${plate}${controls}${SOURCES}</div>`, css: CSS, live: smLive.toString(), helpers: [smPath, smLine, smTeeth, smMargin, smAt, smTooth, smLips, smDyn, fmt], data: D };
}
