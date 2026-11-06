// A frontal (coronal) section through the first molars of a patient wearing complete dentures, for the L8 (Denture
// Occlusion) figures: the maxilla with its palate, the upper denture and its molars; the mandible, the tongue, the lower
// denture and its molars. Patient's right at the viewer's left, as in the hub's other frontal views. Millimeters, y up,
// the occlusal plane at y = 0 in centric occlusion; the mandible and the lower denture move with a transform
// { dx, dy, rot } about (0, -30) (rot in degrees, counterclockwise), and the lower denture can also tip about its
// right ridge crest (`tip`, degrees), which is how a denture with contact on one side only tips off the far side.
// Every outline is schematic, drawn to typical edentulous proportions (ridges about 50 mm apart, crowns 10 mm wide
// buccolingually and about 7 mm tall), not traced from a patient. The four posterior tooth forms are the L8 notes':
// anatomic (30 degree cusps), semi-anatomic (20 degrees, in the notes' 12-20 range), flat (0 degrees) and lingualized
// (a long upper lingual cusp against a lower tooth with a wide, shallow fossa: mortar and pestle).

const r3 = (v) => Math.round(v * 1000) / 1000;
const deg = Math.PI / 180;
const h30 = r3(2.5 * Math.tan(30 * deg)), h20 = r3(2.5 * Math.tan(20 * deg));

export const DEN = {
  XC: 25, /* upper molar centers, mm from the midline; the lower molars sit 2.5 mm lingual (cusp in fossa) */
  ROT_C: [0, 0], TIP_C: [-24.5, -10],
  /* occlusal outlines, u from the buccal edge (0) to the lingual edge (10), y up */
  PROF: {
    anat: { up: [[0, h30 + 0.6], [2.5, 0], [5, h30], [7.5, 0], [10, h30 + 0.6]], lo: [[0, -0.6], [2.5, h30], [5, 0], [7.5, h30], [10, -0.6]], h: h30 },
    semi: { up: [[0, h20 + 0.6], [2.5, 0], [5, h20], [7.5, 0], [10, h20 + 0.6]], lo: [[0, -0.6], [2.5, h20], [5, 0], [7.5, h20], [10, -0.6]], h: h20 },
    flat: { up: [[0, 0.7], [0.8, 0], [5, 0], [9.2, 0], [10, 0.7]], lo: [[0, -0.7], [0.8, 0], [5, 0], [9.2, 0], [10, -0.7]], h: 0 },
    ling: { up: [[0, 1.2], [2.5, 0.4], [5, 1.3], [7.5, -0.6], [10, 0.8]], lo: [[0, -0.4], [1, 0], [2.5, 0], [5, -0.6], [7.5, 0], [9, 0], [10, -0.4]], h: 0.6 },
  },
  /* the maxilla's oral surface, right to left (the palate's vault in the middle) */
  MAX: [[-60, 46], [-47, 40], [-40, 30], [-36.5, 19.5], [-34, 15.5], [-31.5, 14], [-29.5, 11.6], [-27, 10.4], [-24.5, 10.6], [-22.5, 12], [-20, 14.6], [-16, 19], [-10, 22.6], [-4, 24.2], [0, 24.5], [4, 24.2], [10, 22.6], [16, 19], [20, 14.6], [22.5, 12], [24.5, 10.6], [27, 10.4], [29.5, 11.6], [31.5, 14], [34, 15.5], [36.5, 19.5], [40, 30], [47, 40], [60, 46]],
  /* the right half of the mandible (section), from the buccal side over the ridge to the lingual side */
  MAND: [[-37, -24], [-36, -17], [-33.5, -15.6], [-30.5, -14.8], [-28, -13.2], [-26, -11.4], [-24.5, -11], [-22.5, -11.6], [-20.6, -13.4], [-19.4, -16.5], [-18.8, -22], [-18.4, -70], [-37.5, -70]],
  MAND_TOP: 12, /* the oral surface is MAND[0..10] */
  TONGUE: [[-18, -70], [-18.2, -22], [-17.6, -15], [-16, -9], [-12, -3.6], [-6, -0.8], [0, 0], [6, -0.8], [12, -3.6], [16, -9], [17.6, -15], [18.2, -22], [18, -70]],
  /* the denture bases' polished surfaces (the intaglio follows the bone 1 mm out, over the mucosa) */
  UB_POL: [[33, 12.4], [32.6, 8.6], [30.8, 6.6], [20.4, 6.6], [18, 9.6], [14, 15.6], [9, 19.6], [4, 21.6], [0, 22], [-4, 21.6], [-9, 19.6], [-14, 15.6], [-18, 9.6], [-20.4, 6.6], [-30.8, 6.6], [-32.6, 8.6], [-33, 12.4]],
  UB_X: 32.6,
  LB_POL: [[-17.3, -17.6], [-17.0, -13], [-17.5, -8.4], [-18.3, -6.6], [-26.7, -6.6], [-29.4, -8.6], [-32.6, -12], [-34.6, -14.3]], LB_X: -34.8,
  MUC: 1,
};

/* screen helpers: v = { OX, OY, S } (px per mm, y down on screen) */
function dnX(p, v) { return v.OX + p[0] * v.S; }
function dnY(p, v) { return v.OY - p[1] * v.S; }
function dnPath(pts, v, closed) { var f = function (n) { return Math.round(n * 10) / 10; }; return "M" + pts.map(function (p) { return f(v.OX + p[0] * v.S) + " " + f(v.OY - p[1] * v.S); }).join("L") + (closed ? "Z" : ""); }
/* a polyline moved d mm along its left normal (negative d: the right side) */
function dnOff(pts, d) { return pts.map(function (p, i) { var a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; return [p[0] - dy / L * d, p[1] + dx / L * d]; }); }
/* a rigid move: rotate by T.rot (deg) about c, then translate */
function dnRot(p, c, a) { var r = a * Math.PI / 180, s = Math.sin(r), k = Math.cos(r), x = p[0] - c[0], y = p[1] - c[1]; return [c[0] + x * k - y * s, c[1] + x * s + y * k]; }
function dnJaw(p, T, D) { var q = dnRot(p, D.ROT_C, T.rot || 0); return [q[0] + (T.dx || 0), q[1] + (T.dy || 0)]; }
/* the lower denture: the jaw's move, after tipping about its right ridge crest */
function dnDen(p, T, D) { var q = D.dnJaw(T.tip ? D.dnRot(p, D.TIP_C, T.tip) : p, T, D); return [q[0] + (T.ddx || 0), q[1] + (T.ddy || 0)]; }
/* a molar's crown outline (mm) on a side ("r" = patient's right, at the viewer's left); lower crowns in the jaw's frame */
function dnCrown(side, lower, form, D) {
  var P = D.PROF[form], prof = lower ? P.lo : P.up, sg = side === "r" ? 1 : -1, xb = lower ? D.XC - 2.5 + 5 : D.XC + 5, z = lower ? -1 : 1;
  var u = [[0.8, 7.2 * z], [0.1, 3.2 * z]].concat(prof, [[9.9, 3.2 * z], [9.2, 7.2 * z]]);
  return u.map(function (q) { return [-sg * (xb - q[0]), q[1]]; });
}
/* the occlusal outline alone, buccal to lingual */
function dnOcc(side, lower, form, D) { var P = D.PROF[form], sg = side === "r" ? 1 : -1, xb = lower ? D.XC - 2.5 + 5 : D.XC + 5; return (lower ? P.lo : P.up).map(function (q) { return [-sg * (xb - q[0]), q[1]]; }); }
function dnInterp(poly, x) { var q = poly.slice().sort(function (a, b) { return a[0] - b[0]; }); if (x < q[0][0] || x > q[q.length - 1][0]) return null; for (var i = 1; i < q.length; i++) if (x <= q[i][0]) { var t = (x - q[i - 1][0]) / ((q[i][0] - q[i - 1][0]) || 1); return q[i - 1][1] + t * (q[i][1] - q[i - 1][1]); } return null; }
/* contacts on a side: every vertex of either outline within 0.08 mm of the other; also the smallest gap */
function dnContacts(side, form, T, D) {
  var U = D.dnOcc(side, false, form, D), L = D.dnOcc(side, true, form, D).map(function (p) { return D.dnDen(p, T, D); }), out = [], min = 1e9;
  L.forEach(function (p) { var y = D.dnInterp(U, p[0]); if (y == null) return; var g = y - p[1]; min = Math.min(min, g); if (g < 0.08) out.push([p[0], (y + p[1]) / 2]); });
  U.forEach(function (p) { var y = D.dnInterp(L, p[0]); if (y == null) return; var g = p[1] - y; min = Math.min(min, g); if (g < 0.08) out.push([p[0], (y + p[1]) / 2]); });
  /* also sample between vertices, for the smallest gap */
  for (var i = 0; i <= 60; i++) { var x = Math.min.apply(null, U.map(function (p) { return p[0]; })) + i / 60 * 10, yu = D.dnInterp(U, x), yl = D.dnInterp(L, x); if (yu != null && yl != null) min = Math.min(min, yu - yl); }
  var seen = {}; out = out.filter(function (p) { var k = Math.round(p[0] * 2); if (seen[k]) return false; seen[k] = 1; return true; });
  return { pts: out, gap: min };
}
/* the whole section: maxilla, upper teeth and base; mandible and tongue (jaw move T); lower teeth and base (denture
   move: T plus its tip). c = class prefix; opt.hot adds hover text; opt.lift paints the lower base's intaglio red on
   the side lifting off its ridge */
function dnScene(T, form, v, D, c, opt) {
  opt = opt || {}; var o = "", J = function (p) { return D.dnJaw(p, T, D); }, Dn = function (p) { return D.dnDen(p, T, D); };
  function hot(info) { return opt.hot && info ? ' data-info="' + info + '"' : ""; }
  function cls(n, h) { return 'class="' + c + "-" + n + (opt.hot && h ? " hot" : "") + '"'; }
  /* maxilla: mucosa (a 1 mm band under the bone), then the bone */
  var mx = D.MAX.concat([[60, 80], [-60, 80]]);
  o += '<path class="' + c + '-muc" style="stroke-width:' + (2 * D.MUC * v.S) + '" d="' + D.dnPath(D.MAX, v) + '"/>';
  o += "<path " + cls("bone", 1) + hot(opt.hot && opt.hot.max) + ' d="' + D.dnPath(mx, v, true) + '"/>';
  /* mandible, both halves, with mucosa */
  ["r", "l"].forEach(function (s) {
    var sg = s === "r" ? 1 : -1, m = D.MAND.map(function (p) { return J([sg * p[0], p[1]]); });
    o += '<path class="' + c + '-muc" style="stroke-width:' + (2 * D.MUC * v.S) + '" d="' + D.dnPath(m.slice(0, D.MAND_TOP - 1), v) + '"/>';
    o += "<path " + cls("bone", 1) + hot(opt.hot && opt.hot.mand) + ' d="' + D.dnPath(m, v, true) + '"/>';
  });
  o += "<path " + cls("tongue", 1) + hot(opt.hot && opt.hot.tongue) + ' d="' + D.dnPath(D.TONGUE.map(J), v, true) + '"/>';
  /* upper teeth, then the upper base over their necks */
  var U = opt.up || [0, 0], Up = function (p) { return [p[0] + U[0], p[1] + U[1]]; };
  ["r", "l"].forEach(function (s) { o += "<path " + cls("tooth", 1) + hot(opt.hot && opt.hot.teeth) + ' d="' + D.dnPath(D.dnCrown(s, false, form, D).map(Up), v, true) + '"/>'; });
  var ub = D.dnOff(D.MAX.filter(function (p) { return Math.abs(p[0]) <= D.UB_X; }), -D.MUC).concat(D.UB_POL);
  o += "<path " + cls("base", 1) + hot(opt.hot && opt.hot.ubase) + ' d="' + D.dnPath(ub.map(Up), v, true) + '"/>';
  /* lower teeth and base, each side (the base is one horseshoe: both halves move together) */
  ["r", "l"].forEach(function (s) {
    var sg = s === "r" ? 1 : -1;
    o += "<path " + cls("tooth", 1) + hot(opt.hot && opt.hot.teeth) + ' d="' + D.dnPath(D.dnCrown(s, true, form, D).map(Dn), v, true) + '"/>';
    var top = D.dnOff(D.MAND.slice(1, D.MAND_TOP - 2), D.MUC).filter(function (p) { return p[0] > D.LB_X; });
    var lb = top.concat(D.LB_POL);
    var pts = lb.map(function (p) { return Dn([sg * p[0], p[1]]); });
    o += "<path " + cls("base", 1) + hot(opt.hot && opt.hot.lbase) + ' d="' + D.dnPath(pts, v, true) + '"/>';
    if (opt.lift === s) { var dn = top.map(function (p) { return Dn([sg * p[0], p[1]]); }), jw = top.map(function (p) { return J([sg * p[0], p[1]]); }).reverse();
      o += '<path class="' + c + '-gap" d="' + D.dnPath(dn.concat(jw), v, true) + '"/><path class="' + c + '-lift" d="' + D.dnPath(dn, v) + '"/>'; }
  });
  return o;
}

export const DEN_HELPERS = [dnX, dnY, dnPath, dnOff, dnRot, dnJaw, dnDen, dnCrown, dnOcc, dnInterp, dnContacts, dnScene];

/* the section's paint, under a figure's class prefix */
export const DEN_CSS = (c) => `
.anima .${c}-svg .${c}-bone{fill:var(--tm-bone);stroke:var(--anatomy-mid);stroke-width:.9;stroke-linejoin:round}
.anima .${c}-svg .${c}-muc{fill:none;stroke:var(--tm-retro);stroke-linejoin:round;stroke-linecap:round}
.anima .${c}-svg .${c}-tongue{fill:var(--tm-muscle);fill-opacity:.55;stroke:var(--tm-muscle-fib);stroke-width:.8}
.anima .${c}-svg .${c}-base{fill:var(--dn-base);stroke:var(--dn-base-edge);stroke-width:1;stroke-linejoin:round}
.anima .${c}-svg .${c}-tooth{fill:var(--anatomy-face);stroke:var(--anatomy-hi);stroke-width:1;stroke-linejoin:round}
.anima .${c}-svg .${c}-gap{fill:var(--tm-vessel);fill-opacity:.25;stroke:none}
.anima .${c}-svg .${c}-lift{fill:none;stroke:var(--tm-vessel);stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}
.anima .${c}-svg{--dn-base:#efb7b8;--dn-base-edge:#b8646a}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]) .anima .${c}-svg{--dn-base:#8c4d55;--dn-base-edge:#d48b90} }
:root[data-theme="dark"] .anima .${c}-svg{--dn-base:#8c4d55;--dn-base-edge:#d48b90}
`;
