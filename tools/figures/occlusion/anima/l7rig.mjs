// The side-view rig shared by two L7 figures (stability.mjs, splints.mjs): the glenoid fossa and articular eminence,
// the condyle with its disc, the maxilla and mandible, and both dental arches, seen from the patient's right with the
// patient facing left (anterior to the left, as in hingearc.mjs). Units are millimeters, y up; the seated condyle's
// center is the origin. The geometry is built here in Node; the poses (where the condyle is and how far the jaw has
// hinged open) are solved here too and stored as data, so the browser only transforms and draws.
// Schematic: the arch is a lateral view of the posterior teeth with a sagittal profile of the incisors, the cusps are a
// regular zigzag (about 26-degree inclines) and the joint is drawn for clarity, not traced from imaging.

const r1 = (v) => Math.round(v * 100) / 100;
const P2 = (pts) => pts.map((p) => [r1(p[0]), r1(p[1])]);

/* the articular surface: postglenoid process, the fossa roof, the posterior slope of the eminence, the crest. Close to
   the seated condyle (r 4) along the slope (the disc's thin intermediate zone), farther over the top and in front
   (the posterior and anterior bands) */
const ART = [[8.2, -1.6], [7.5, 2.6], [5.6, 5.5], [2.6, 6.7], [-0.5, 6.6], [-2.8, 5.2], [-4.4, 3.4], [-6, 1.4], [-8, -0.8], [-10, -2.2], [-12.5, -2.9], [-15.5, -2.4], [-18.5, -0.6], [-21.5, 1.9]];
const CR = 4; /* condyle radius */

/* the eminence direction the condyle travels when it comes off its seat (forward and down) */
const EMI = (() => { const a = 60 * Math.PI / 180; return [-Math.cos(a), -Math.sin(a)]; })();

/* sample the smoothed articular curve as a polyline (for the disc and for clipping) */
function sampleSmooth(pts, n) {
  const out = []; const N = pts.length;
  for (let i = 0; i < N - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(N - 1, i + 2)];
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[N - 1]);
  return out;
}
const ARTS = sampleSmooth(ART, 8);

/* distance from the origin to the articular curve along a ray at angle a (radians, 0 = posterior (+x), pi/2 = up) */
function rayToArt(a) {
  const dx = Math.cos(a), dy = Math.sin(a); let best = Infinity;
  for (let i = 0; i < ARTS.length - 1; i++) {
    const [x1, y1] = ARTS[i], [x2, y2] = ARTS[i + 1], ex = x2 - x1, ey = y2 - y1, den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-9) continue;
    const t = (x1 * ey - y1 * ex) / den, u = (x1 * dy - y1 * dx) / den;
    if (t > 0 && u >= 0 && u <= 1 && t < best) best = t;
  }
  return best;
}
/* the disc, relative to the condyle's center: from the posterior band over the top to the anterior band */
function discPoly() {
  const outer = [], inner = [];
  for (let d = 48; d <= 176; d += 4) { const a = d * Math.PI / 180, R = rayToArt(a) - 0.12; outer.push([R * Math.cos(a), R * Math.sin(a)]); }
  for (let d = 176; d >= 48; d -= 4) { const a = d * Math.PI / 180, R = CR + 0.08; inner.push([R * Math.cos(a), R * Math.sin(a)]); }
  /* round the two ends a little toward the condyle */
  return P2(outer.concat(inner));
}

/* ---------- the teeth (MIP, skull coordinates) ---------- */
const PER = 5.4, HP = PER / 2, YT = -42, YB = -43.3; /* cusp period, the interface's high and low points */
const U0 = -35; /* distal of the upper second molar */
/* upper posterior crowns: [name, periods]; lower ones start half a period mesial (Class I) */
const UPW = [["M2", 2], ["M1", 2], ["PM2", 1], ["PM1", 1]];
function zig(x) { /* the MIP interface: upper valleys (= lower cusp tips) at U0 - k*PER, upper cusp tips half a period on */
  const k = (U0 - x) / HP; const i = Math.floor(k), f = k - i;
  const yi = (i % 2 === 0) ? YT : YB, yj = (i % 2 === 0) ? YB : YT;
  return yi + (yj - yi) * f;
}
function crownUp(xa, xp) { /* xa anterior (more negative), xp posterior */
  const nx = Math.round((xp - xa) / HP); /* make sure the zigzag hits each cusp tip exactly */
  const z = [[xa + 0.25, zig(xa + 0.25)]]; for (let k = 1; k < nx; k++) z.push([xa + k * HP, zig(xa + k * HP)]); z.push([xp - 0.25, zig(xp - 0.25)]);
  return P2([[xp - 0.7, -30.5], [xa + 0.7, -30.5], [xa - 0.15, -36], [xa + 0.05, -40.6]].concat(z, [[xp - 0.05, -40.6], [xp + 0.15, -36]]));
}
function crownLo(xa, xp) {
  const nx = Math.round((xp - xa) / HP);
  const z = [[xp - 0.25, zig(xp - 0.25)]]; for (let k = nx - 1; k >= 1; k--) z.push([xa + k * HP, zig(xa + k * HP)]); z.push([xa + 0.25, zig(xa + 0.25)]);
  return P2([[xa + 0.7, -53], [xp - 0.7, -53], [xp + 0.15, -47], [xp - 0.05, -45.6]].concat(z, [[xa + 0.05, -45.6], [xa - 0.15, -47]]));
}
function teeth() {
  const up = [], lo = [], cuspLo = [], cuspUp = [];
  let x = U0;
  for (const [n, w] of UPW) { const xa = x - w * PER; up.push({ n, g: "post", pts: crownUp(xa, x) }); for (let k = 0; k < w; k++) cuspUp.push([r1(x - HP - k * PER), YB]); x = xa; }
  x = U0 - HP;
  for (const [n, w] of UPW) { const xa = x - w * PER; lo.push({ n, g: "post", pts: crownLo(xa, x) }); for (let k = 0; k < w; k++) cuspLo.push([r1(x - HP - k * PER), YT]); x = xa; }
  /* canines: the upper canine's tip sits between the lower canine and first premolar */
  up.push({ n: "C", g: "ant", pts: [[-68.2, -30.5], [-75, -30.5], [-76.2, -36], [-75.6, -40.6], [-72.2, -44.7], [-68.2, -41.4], [-67.6, -36]] });
  lo.push({ n: "C", g: "ant", pts: [[-70.9, -53], [-77, -53], [-78, -47], [-77.6, -44], [-74.6, -41.1], [-71.2, -43.4], [-70.6, -47]] });
  /* lateral incisors (seen obliquely, behind the centrals) and the centrals in profile */
  up.push({ n: "I2", g: "ant", pts: [[-81, -30.5], [-87.4, -30.5], [-89.6, -37], [-89.2, -42.4], [-86.8, -43.2], [-84.8, -40.8], [-82, -36]] });
  lo.push({ n: "I2", g: "ant", pts: [[-83, -53], [-88.6, -53], [-90, -46], [-89.6, -40.4], [-87.4, -40], [-85, -44], [-83.5, -48]] });
  up.push({ n: "I1", g: "ant", pts: [[-96.5, -30.5], [-103, -30.5], [-104.6, -36.5], [-104.8, -41.2], [-104.2, -43.4], [-102.2, -43.4], [-99.8, -39], [-97.4, -34.6]] });
  lo.push({ n: "I1", g: "ant", pts: [[-93.6, -53], [-98.6, -53], [-99.6, -46], [-100, -40.2], [-99.4, -39.3], [-97.6, -39.2], [-96.6, -42], [-94.4, -48]] });
  return { up, lo, cuspLo, cuspUp, inc: [-99.6, -39.3], incUp: [-103.2, -43.4] };
}

/* the mandible in side view, condyle center at its origin; its condylar head is drawn as the circle over the neck */
const JAW = [[3.2, -2.4], [5.8, -8], [7.4, -22], [8.2, -40], [7, -50], [3.6, -56.5], [-4, -60.5], [-22, -62.5], [-40, -63.6], [-62, -65.2], [-80, -66.2], [-92, -65.4], [-100, -62], [-103.8, -56], [-103.4, -50.5], [-101.2, -48.6], [-90, -48.4], [-80, -48.8], [-55, -49.6], [-38, -49.6], [-31.5, -46.5], [-27.5, -40], [-23.5, -30], [-21.2, -20], [-21, -9], [-23.6, -1.4], [-21.6, -1.8], [-16, -8.6], [-9, -7.6], [-3.4, -2.6]];
/* one piece of skull: the temporal bone's fossa and eminence (ART), the zygomatic arch, the zygoma coming down to the
   key ridge over the first molar, and the maxilla's alveolar process to the incisors; it is drawn over the coronoid
   process, which passes under the arch */
const SKULL_REST = [[-19, -2.7], [-25, -3.4], [-31, -4.4], [-36, -6.8], [-39.2, -11], [-41, -17], [-38.4, -23.6], [-34, -28.4], [-33.2, -31.5], [-45, -31.8], [-60, -32], [-80, -31.8], [-96, -31.6], [-104, -31], [-107.4, -27.6], [-109.6, -22], [-110, -17], [-106.4, -12.4], [-96, -10], [-80, -7], [-62, -2.2], [-48, 2.6], [-34, 4.6], [-20, 5.6], [-12, 8.2], [-6, 11.6], [0, 13], [7, 12.6], [11.6, 10], [13.4, 5], [13, 0.6], [10.8, -1.6]];

/* rigid pose: a point of the MIP-referenced jaw goes to C + R(th)(p - Cm) */
function tf(p, P) { const x = p[0] - P.Cm[0], y = p[1] - P.Cm[1], c = Math.cos(P.th), s = Math.sin(P.th); return [P.C[0] + x * c - y * s, P.C[1] + x * s + y * c]; }
/* the upper interface's height at x (posterior teeth) */
function upperAt(x) { return zig(x); }
/* closing on the hinge with the condyle at C, the smallest opening th with no lower posterior point above the uppers */
function contactTh(C, Cm, T) {
  const samples = [];
  for (const t of T.lo) if (t.g === "post") for (const p of t.pts) if (p[1] > -44.5) samples.push(p);
  const pen = (th) => { let m = -Infinity; for (const q of samples) { const r = tf(q, { C, Cm, th }); if (r[0] > -67.2 && r[0] < -35.2) m = Math.max(m, r[1] - upperAt(r[0])); } return m; };
  /* close from wide open until the first touch (the pen curve isn't monotonic: closing carries the lower cusps up and
     forward over the upper inclines), then refine */
  let hi = 0.3, lo = hi; const step = 0.0005;
  while (lo > 0 && pen(lo - step) < 0) lo -= step;
  if (lo <= step) return 0;
  hi = lo; lo = lo - step; for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (pen(mid) >= 0) lo = mid; else hi = mid; }
  return hi;
}
/* with the condyle at C, the opening at which the lower cusp tips sit `gap` mm below the upper cusp tips (a splint's
   thickness), measured at the thinnest place */
function splintTh(C, Cm, T, gap, arch) {
  const f = (th) => {
    const P = { C, Cm, th }, lt = T.cuspLo.map((q) => tf(q, P));
    /* a maxillary splint's flat plane runs through the lower cusp tips; a mandibular one's through the upper cusp tips */
    const a = lt[0], b = lt[lt.length - 1], k = (b[1] - a[1]) / (b[0] - a[0]);
    let m = Infinity;
    if (arch === "max") for (const u of T.cuspUp) m = Math.min(m, u[1] - (a[1] + k * (u[0] - a[0])));
    else for (const l of lt) m = Math.min(m, YB - l[1]);
    return m;
  };
  let lo = 0, hi = 0.4; for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (f(mid) < gap) lo = mid; else hi = mid; }
  return hi;
}

export function rig() {
  const T = teeth();
  return { SKULL: P2(ART.slice(0, -2).concat(SKULL_REST)), CR, EMI: P2([EMI])[0], JAW: P2(JAW), DISC: discPoly(),
    UP: T.up, LO: T.lo, CUSP_LO: T.cuspLo, CUSP_UP: T.cuspUp, INC: T.inc, INC_UP: T.incUp, PER, YT, YB };
}
/* where the first contact is, at a pose */
function contactPt(P, T) {
  let m = -Infinity, at = null;
  for (const t of T.lo) if (t.g === "post") for (const p of t.pts) { const r = tf(p, P); if (r[0] > -67.2 && r[0] < -35.2) { const v = r[1] - upperAt(r[0]); if (v > m) { m = v; at = r; } } }
  return P2([at])[0];
}
export const rigSolve = { contactTh, splintTh, contactPt, upperAt, tf, EMI, teeth };

/* ---------- browser helpers (stringified into each figure; they use only their arguments) ---------- */
/* the pose transform, as above */
function rgT(p, P) { var x = p[0] - P.Cm[0], y = p[1] - P.Cm[1], c = Math.cos(P.th), s = Math.sin(P.th); return [P.C[0] + x * c - y * s, P.C[1] + x * s + y * c]; }
/* polygon or polyline to a path in screen space; V = {OX, OY, S} */
function rgD(pts, V, closed) { var f = function (n) { return Math.round(n * 10) / 10; }; return "M" + pts.map(function (p) { return f(V.OX + p[0] * V.S) + " " + f(V.OY - p[1] * V.S); }).join("L") + (closed ? "Z" : ""); }
/* clip a polygon to an axis-aligned box (Sutherland-Hodgman), skull coordinates */
function rgClip(pts, b) {
  function side(arr, inside, cut) { var out = []; for (var i = 0; i < arr.length; i++) { var a = arr[i], c = arr[(i + 1) % arr.length], ia = inside(a), ic = inside(c); if (ia) out.push(a); if (ia !== ic) out.push(cut(a, c)); } return out; }
  function lerp(a, c, t) { return [a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t]; }
  var r = pts;
  r = side(r, function (p) { return p[0] >= b[0]; }, function (a, c) { return lerp(a, c, (b[0] - a[0]) / (c[0] - a[0])); }); if (!r.length) return r;
  r = side(r, function (p) { return p[0] <= b[2]; }, function (a, c) { return lerp(a, c, (b[2] - a[0]) / (c[0] - a[0])); }); if (!r.length) return r;
  r = side(r, function (p) { return p[1] >= b[1]; }, function (a, c) { return lerp(a, c, (b[1] - a[1]) / (c[1] - a[1])); }); if (!r.length) return r;
  r = side(r, function (p) { return p[1] <= b[3]; }, function (a, c) { return lerp(a, c, (b[3] - a[1]) / (c[1] - a[1])); });
  return r;
}
/* Catmull-Rom through points, sampled (closed), for outlines that are drawn and clipped */
function rgSamp(A, n) {
  var out = [], N = A.length;
  for (var i = 0; i < N; i++) { var p0 = A[(i - 1 + N) % N], p1 = A[i], p2 = A[(i + 1) % N], p3 = A[(i + 2) % N];
    for (var k = 0; k < n; k++) { var t = k / n, t2 = t * t, t3 = t2 * t;
      var g = function (a, b, c, d) { return 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3); };
      out.push([g(p0[0], p1[0], p2[0], p3[0]), g(p0[1], p1[1], p2[1], p3[1])]); } }
  return out;
}
/* a circle as a polygon */
function rgCirc(c, r, n) { var o = []; for (var i = 0; i < n; i++) { var a = i / n * Math.PI * 2; o.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]); } return o; }
/* the whole side view. P: the jaw pose; o.mv: {ua, up, la, lp} mm of vertical tooth movement (intrusion and
   extrusion) for the upper and lower anterior and posterior groups; o.cls: extra class on the condyle group; o.mid:
   SVG drawn between the jaw and the upper teeth (a mandibular splint) */
function rgScene(P, V, D, o) {
  o = o || {}; var mv = o.mv || { ua: 0, up: 0, la: 0, lp: 0 }, s = "";
  function shift(pts, dy) { return dy ? pts.map(function (p) { return [p[0], p[1] + dy]; }) : pts; }
  /* lower teeth, then the mandible over their roots */
  D.LO.forEach(function (t) { s += '<path class="rg-tooth" d="' + rgD(rgSamp(shift(t.pts, t.g === "ant" ? mv.la : mv.lp), 3).map(function (p) { return rgT(p, P); }), V, true) + '"/>'; });
  var jaw = rgSamp(D.JAW, 5).map(function (p) { return rgT([p[0] + P.Cm[0], p[1] + P.Cm[1]], P); });
  s += '<path class="rg-jaw hot" data-info="The mandible. It hinges about the condyles and, when they come off their seats, slides with them." d="' + rgD(jaw, V, true) + '"/>';
  if (o.mid) s += o.mid;
  /* upper teeth, then the skull over their roots */
  D.UP.forEach(function (t) { s += '<path class="rg-tooth" d="' + rgD(rgSamp(shift(t.pts, t.g === "ant" ? mv.ua : mv.up), 3), V, true) + '"/>'; });
  s += '<path class="rg-bone hot" data-info="The skull: the glenoid fossa and articular eminence of the temporal bone, the zygomatic arch (the coronoid process passes under it) and the maxilla. Seated, the condyle rests up and forward against the eminence\'s posterior slope, with the disc between." d="' + rgD(rgSamp(D.SKULL, 5), V, true) + '"/>';
  /* condyle and disc */
  var c = P.C;
  s += '<g class="hot' + (o.cls ? " " + o.cls : "") + '" data-info="The condyle, with the articular disc on it. Orthopedic stability: both condyles seated superior-anterior against the eminences, the discs properly between condyle and fossa."><path class="rg-disc" d="' + rgD(D.DISC.map(function (p) { return [p[0] + c[0], p[1] + c[1]]; }), V, true) + '"/><path class="rg-condyle" d="' + rgD(rgCirc(c, D.CR, 40), V, true) + '"/></g>';
  return s;
}
/* the joint magnified in a box: B = [x0, y0, x1, y1] in skull mm, W = {x, y, w, h} on screen */
function rgJoint(c, B, W, D, label) {
  var sx = W.w / (B[2] - B[0]), V = { OX: W.x - B[0] * sx, OY: W.y + B[3] * sx, S: sx }, s = "";
  function clipD(pts) { var r = rgClip(pts, B); return r.length > 2 ? rgD(r, V, true) : ""; }
  s += '<rect class="rg-win" x="' + W.x + '" y="' + W.y + '" width="' + W.w + '" height="' + W.h + '" rx="6"/>';
  s += '<path class="rg-bone" d="' + clipD(rgSamp(D.SKULL, 5)) + '"/>';
  var neck = [[3.2, -2.4], [4.4, -6], [5.4, -12], [-5.6, -12], [-4.6, -6], [-3.4, -2.6]].map(function (p) { return [p[0] + c[0], p[1] + c[1]]; });
  s += '<path class="rg-jaw" d="' + clipD(neck) + '"/>';
  s += '<path class="rg-disc" d="' + clipD(D.DISC.map(function (p) { return [p[0] + c[0], p[1] + c[1]]; })) + '"/>';
  s += '<path class="rg-condyle" d="' + clipD(rgCirc(c, D.CR, 48)) + '"/>';
  s += '<rect class="rg-win-edge" x="' + W.x + '" y="' + W.y + '" width="' + W.w + '" height="' + W.h + '" rx="6"/>';
  if (label) s += '<text class="rg-cap" x="' + (W.x + W.w / 2) + '" y="' + (W.y + W.h + 13) + '" text-anchor="middle">' + label + "</text>";
  return { svg: s, V: V };
}
export const RIG_HELPERS = [rgT, rgD, rgClip, rgSamp, rgCirc, rgScene, rgJoint];
export const RIG_CSS = (p) => `
.anima .${p}-svg .rg-bone{fill:var(--tm-bone);stroke:var(--anatomy-lo);stroke-width:1;stroke-linejoin:round}
.anima .${p}-svg .rg-jaw{fill:var(--tm-bone);stroke:var(--anatomy-hi);stroke-width:1.2;stroke-linejoin:round}
.anima .${p}-svg .rg-tooth{fill:var(--anatomy-face);stroke:var(--anatomy-hi);stroke-width:1;stroke-linejoin:round}
.anima .${p}-svg .rg-disc{fill:var(--tm-disc);stroke:var(--anatomy-mid);stroke-width:.8;stroke-linejoin:round}
.anima .${p}-svg .rg-condyle{fill:var(--tm-bone-in);stroke:var(--anatomy-hi);stroke-width:1.2}
.anima .${p}-svg .rg-win{fill:var(--anatomy-shade-2)}
.anima .${p}-svg .rg-win-edge{fill:none;stroke:var(--anatomy-lo);stroke-width:1}
.anima .${p}-svg .rg-cap{fill:var(--anatomy-muted);font:10.5px var(--anatomy-mono)}
`;
