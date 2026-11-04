// Fig: the TMJ opening, rotation then translation (Occlusion L2, Functional TMJ Anatomy). Sagittal, schematic, patient
// facing right. One model (tmjModel) drives both the built SVG (0 mm) and the live figure: the mandible rotates about the
// condyle in the lower joint space up to 25 mm of incisal opening, then the condyle-disc complex translates down the
// posterior slope of the eminence (upper joint space) while the disc rotates posteriorly on the condyle, to 50 mm.
// Numbers from the hub's L1/L2 notes (Dr. Givan's handouts): pure rotation to about 20-25 mm, maximum opening 40-60 mm.
// At about 5 px per mm the condyle travels roughly 19 mm forward and 10 mm down, about an eminence's height.
// Rotation angles, the disc's turn and the path are schematic, chosen so the parts keep their relationships.
// The mandible is drawn to the same scale (about 5 px per mm): a condylar head about 9 mm front to back, the sigmoid
// notch about 15 mm deep, the coronoid tip about 30 mm in front of the condyle, under the zygomatic arch (which the
// notes call the temporalis's protective tunnel), and a ramus about 32 mm wide. The joint model (C0, CC, C1, TH1, TH2,
// PSI, R, FOSSA, TUB) is shared with the envelope tracer (envelope.mjs): don't change those values here.
import { figureSvg, plateHtml, f1, esc, smooth, callout } from "./shared.mjs";

const W = 640, H = 420;
const D = {
  C0: [300, 168], CC: [352, 186], C1: [398, 216], R: 22, RI: 24.5, GAP: 3,
  TH1: 13, TH2: 26, PSI: 26,
  /* disc thickness by angle (degrees from the top of the condyle, clockwise = anterior): thick posterior band,
     thin intermediate zone, anterior band (about 3 : 1 : 2, as the notes describe: biconcave) */
  DT: [[-64, 3], [-46, 11], [-26, 15], [-6, 11], [14, 6], [30, 5], [46, 6], [62, 9], [74, 10], [90, 7], [102, 3]],
  /* in the mandible's own frame (origin = condyle center, x forward, y down): the pterygoid fovea on the front of the
     neck, where the inferior retrodiscal lamina meets the back of the neck, the outer TM ligament's attachment low on
     the outer surface of the neck, the lateral pole */
  FOVEA: [13.5, 31], NECK_P: [-18, 26], TML_NECK: [-15, 58], POLE: [9, -4],
  /* the TM ligament's origins on the outer surface of the articular eminence at the tubercle (absolute): the outer
     oblique portion fans down and back to the neck, the inner horizontal portion runs straight back to the pole */
  TMO: [408, 180], TMI: [400, 170],
  SL: [252, 178], LPS0: [[640, 186], [640, 208]], LPI0: [[640, 262], [640, 300]], CLR: 6,
  wide: `0 0 ${W} ${H}`, narrow: "150 40 420 330",
};
function discT(a, D) {
  var k = D.DT, i;
  if (a <= k[0][0]) return k[0][1];
  for (i = 1; i < k.length; i++) if (a <= k[i][0]) { var u = (a - k[i - 1][0]) / (k[i][0] - k[i - 1][0]); u = (1 - Math.cos(u * Math.PI)) / 2; return k[i - 1][1] + (k[i][1] - k[i - 1][1]) * u; }
  return k[k.length - 1][1];
}
export function tmjModel(mm, D) {
  var th = Math.min(mm, 25) / 25 * D.TH1 + Math.max(0, mm - 25) / 25 * (D.TH2 - D.TH1);
  var u = Math.max(0, Math.min(1, (mm - 25) / 25)), t = u * u * (3 - 2 * u);
  var a = D.C0, b = D.CC, c = D.C1, s = 1 - t;
  return { C: [s * s * a[0] + 2 * s * t * b[0] + t * t * c[0], s * s * a[1] + 2 * s * t * b[1] + t * t * c[1]], th: th, psi: -D.PSI * t, t: t };
}
/* everything that moves, as transforms and path data; the build bakes mm = 0 and the live code calls the same function */
function tmjFrame(mm, D) {
  var m = tmjModel(mm, D), C = m.C;
  function rot(p, deg) { var r = deg * Math.PI / 180, c = Math.cos(r), s = Math.sin(r); return [C[0] + p[0] * c - p[1] * s, C[1] + p[0] * s + p[1] * c]; }
  function polar(a, r) { var q = a * Math.PI / 180; return [r * Math.sin(q), -r * Math.cos(q)]; }
  function f(v) { return Math.round(v * 10) / 10; }
  function P(pts) { return "M" + pts.map(function (p) { return f(p[0]) + " " + f(p[1]); }).join("L"); }
  function lerp(a, b, u) { return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]; }
  /* smooth open curve through points (Catmull-Rom as cubic Bezier), without the leading M */
  function curve(pts) { var d = ""; for (var i = 0; i < pts.length - 1; i++) { var p0 = pts[i ? i - 1 : 0], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];
    d += "C" + f(p1[0] + (p2[0] - p0[0]) / 6) + " " + f(p1[1] + (p2[1] - p0[1]) / 6) + " " + f(p2[0] - (p3[0] - p1[0]) / 6) + " " + f(p2[1] - (p3[1] - p1[1]) / 6) + " " + f(p2[0]) + " " + f(p2[1]); } return d; }
  /* the underside of the temporal bone (fossa roof forward), for keeping the superior head below the eminence */
  function surfY(x) { var s = D.SURFT, i; if (x <= s[0][0]) return s[0][1]; for (i = 1; i < s.length; i++) if (x <= s[i][0]) return s[i - 1][1] + (s[i][1] - s[i - 1][1]) * (x - s[i - 1][0]) / (s[i][0] - s[i - 1][0]); return s[s.length - 1][1]; }
  var dPostO = rot(polar(-64, D.RI + discT(-64, D) + .5), m.psi), dPostI = rot(polar(-64, D.RI - .5), m.psi);
  var dAntO = rot(polar(102, D.RI + discT(102, D)), m.psi), dAntI = rot(polar(102, D.RI), m.psi);
  var neckP = rot(D.NECK_P, m.th), fovea = rot(D.FOVEA, m.th), fovea2 = rot([D.FOVEA[0] + 1.5, D.FOVEA[1] + 11], m.th);
  var tmlNeck = rot(D.TML_NECK, m.th), pole = rot(D.POLE, m.th);
  var sl = D.SL;
  /* superior lamina is elastic: drawn wavy, its waves smoothing out as it stretches */
  var n = 7, wav = [], dx = sl[0] - dPostO[0], dy = sl[1] - dPostO[1], len = Math.sqrt(dx * dx + dy * dy), amp = Math.max(0.6, 4.2 - len / 30);
  for (var i = 0; i <= n * 2; i++) { var u = i / (n * 2), w = (i % 2 ? 1 : -1) * amp * Math.sin(u * Math.PI); wav.push([dPostO[0] + dx * u - dy / len * w, dPostO[1] + dy * u + dx / len * w]); }
  var lowPost = [sl[0] - 6, sl[1] + 24];
  /* it fills the fossa behind the disc up to the disc's top, so no gap opens on the eminence slope as the disc slides
     forward (the disc is drawn over it) */
  function discOut(a) { return rot(polar(a, D.RI + discT(a, D) + .5), m.psi); }
  var aTop = Math.min(16, -20 + 50 * m.t), rim = [];
  for (var ra = -50; ra < aTop; ra += 8) rim.push(discOut(ra));
  var top = discOut(aTop);
  var behind = D.FOSSA.filter(function (p) { return p[0] < top[0]; }).reverse();
  /* the inferior lamina runs from the posterior band down the back of the condyle to the neck, bowed away from it */
  var lamMid = lerp(dPostI, neckP, .5), lamDir = rot([-1, 0], m.th); lamDir = [lamDir[0] - C[0], lamDir[1] - C[1]];
  var lam = [dPostI, [lamMid[0] + lamDir[0] * 6, lamMid[1] + lamDir[1] * 6], neckP];
  var retro = [top].concat(behind, [sl, lowPost, neckP, lam[1], dPostI, dPostO], rim);
  /* vessels sit inside the retrodiscal tissue, between the postglenoid process and the back of the condyle */
  var v1 = lerp(lerp(sl, dPostI, .5), lowPost, .25), v2 = lerp(lowPost, neckP, .5), v3 = lerp(lerp(sl, dPostI, .5), neckP, .55);
  v2 = [v2[0], v2[1] - 5];
  /* superior head: from the disc's anterior band forward to the infratemporal surface; where a straight band would cut
     through the eminence it runs just below the bone, as it does in a sagittal section */
  var N = 14, st = [], sb = [];
  for (var j = 0; j <= N; j++) {
    var uu = j / N, pt = lerp(dAntO, D.LPS0[0], uu), pb = lerp(dAntI, D.LPS0[1], uu);
    var push = Math.max(0, surfY(pt[0]) + D.CLR - pt[1]) * Math.min(1, j / 3);
    st.push([pt[0], pt[1] + push]); sb.push([pb[0], pb[1] + push]);
  }
  var lps = "M" + f(st[0][0]) + " " + f(st[0][1]) + curve(st) + "L" + f(sb[N][0]) + " " + f(sb[N][1]) + curve(sb.slice().reverse()) + "Z";
  var lpsF = ""; [.25, .5, .75].forEach(function (q) { var fl = st.map(function (p, k) { return lerp(p, sb[k], q); }); fl = fl.slice(1); lpsF += "M" + f(fl[0][0]) + " " + f(fl[0][1]) + curve(fl); });
  function band(a0, a1, b0, b1) { return P([a0, b0, b1, a1]) + "Z"; }
  var lpi = band(fovea, fovea2, D.LPI0[0], D.LPI0[1]);
  function fibers(a0, a1, b0, b1, k) { var out = ""; for (var j = 1; j < k; j++) { var u = j / k, p = [a0[0] + (a1[0] - a0[0]) * u, a0[1] + (a1[1] - a0[1]) * u], q = [b0[0] + (b1[0] - b0[0]) * u, b0[1] + (b1[1] - b0[1]) * u]; out += "M" + f(p[0]) + " " + f(p[1]) + "L" + f(q[0]) + " " + f(q[1]); } return out; }
  var A = {}, T = "translate(" + f(C[0]) + " " + f(C[1]) + ") rotate(" + f(m.th) + ")";
  A[".tm-mand"] = { transform: T }; A[".tm-mand2"] = { transform: T };
  A[".tm-disc"] = { transform: "translate(" + f(C[0]) + " " + f(C[1]) + ") rotate(" + f(m.psi) + ")" };
  A[".tm-retro"] = { d: (function () { var s = "M" + f(retro[0][0]) + " " + f(retro[0][1]); for (var k = 1; k < retro.length; k++) s += "L" + f(retro[k][0]) + " " + f(retro[k][1]); return s + "Z"; })() };
  A[".tm-v1"] = { cx: f(v1[0]), cy: f(v1[1]) }; A[".tm-v2"] = { cx: f(v2[0]), cy: f(v2[1]) }; A[".tm-v3"] = { cx: f(v3[0]), cy: f(v3[1]) };
  A[".tm-suplam"] = { d: P(wav) };
  A[".tm-inflam"] = { d: "M" + f(lam[0][0]) + " " + f(lam[0][1]) + curve(lam) };
  A[".tm-lps"] = { d: lps }; A[".tm-lps-f"] = { d: lpsF };
  A[".tm-lpi"] = { d: lpi }; A[".tm-lpi-f"] = { d: fibers(fovea, fovea2, D.LPI0[0], D.LPI0[1], 5) };
  A[".tm-tmlo"] = { d: P([D.TMO, tmlNeck]) };
  A[".tm-tmli"] = { d: P([D.TMI, pole]) };
  A[".tm-tmlo-dot"] = { cx: f(tmlNeck[0]), cy: f(tmlNeck[1]) };
  A[".tm-tmli-dot"] = { cx: f(pole[0]), cy: f(pole[1]) };
  /* labels that ride on the mandible: upright text, leader to a dot on the part */
  [["cond", D.LAB_COND], ["cor", D.LAB_COR]].forEach(function (L) {
    var k = L[0], o = L[1], tp = rot(o.t, m.th), lp = rot(o.l, m.th), dp = rot(o.p, m.th);
    A[".tm-lab-" + k] = { x: f(tp[0]), y: f(tp[1]) };
    if (o.t2) { var tp2 = rot(o.t2, m.th); A[".tm-lab-" + k + "2"] = { x: f(tp2[0]), y: f(tp2[1]) }; }
    A[".tm-lead-" + k] = { d: "M" + f(lp[0]) + " " + f(lp[1]) + "L" + f(dp[0]) + " " + f(dp[1]) };
    A[".tm-ldot-" + k] = { cx: f(dp[0]), cy: f(dp[1]) };
  });
  var gy = D.GAUGE[1] + (D.GAUGE[2] - D.GAUGE[1]) * mm / 50;
  A[".tm-gauge-mark"] = { d: "M" + (D.GAUGE[0] - 7) + " " + f(gy) + "H" + (D.GAUGE[0] + 7) };
  A[".tm-gauge-fill"] = { y: D.GAUGE[1], height: f(Math.max(0, gy - D.GAUGE[1])) };
  return { m: m, attrs: A };
}

/* ---------- static geometry (built once) ---------- */
function rotP(C, p, deg) { const r = deg * Math.PI / 180, c = Math.cos(r), s = Math.sin(r); return [C[0] + p[0] * c - p[1] * s, C[1] + p[0] * s + p[1] * c]; }
const polar = (a, r) => [r * Math.sin(a * Math.PI / 180), -r * Math.cos(a * Math.PI / 180)];
// The temporal bone's articular surface is molded to the disc: the fossa follows the closed disc, the eminence's
// posterior slope follows the disc's intermediate zone as the complex slides down it.
const surf = [[0, 214], [110, 216], [170, 208], [222, 212], [238, 205], [250, 188], [262, 166]];
for (let a = -60; a <= 48; a += 6) surf.push(rotP(D.C0, polar(a, D.RI + discT(a, D) + D.GAP), 0));
for (let i = 2; i <= 10; i++) { const mm = 25 + 2.5 * i, m = tmjModel(mm, D); surf.push(rotP(m.C, polar(30, D.RI + discT(30, D) + 2.4), m.psi)); }
const fossaEnd = surf.length;
// past the crest (the articular tubercle) the bone's lower border runs forward nearly level: the zygomatic arch
{ const L = surf[surf.length - 1]; surf.push([L[0] + 16, L[1] + 3], [L[0] + 40, L[1] - 1], [L[0] + 80, L[1] - 2], [L[0] + 150, L[1] - 3], [640, L[1] - 2]); }
const crestIdx = surf.reduce((bi, p, i) => (i > 20 && p[1] > surf[bi][1] ? i : bi), 21);
/* the fossa contour from the postglenoid process forward along the eminence slope: the retrodiscal tissue fills it behind the disc */
D.FOSSA = surf.slice(5, fossaEnd).map((p) => [f1(p[0]), f1(p[1])]);
D.TUB = [f1(surf[crestIdx][0] + 26), f1(surf[crestIdx][1] - 2)];
D.SURFT = surf.filter((p, i) => i > 12 && p[0] >= 296).map((p) => [f1(p[0]), f1(p[1])]);
D.GAUGE = [52, 270, 380];
/* the joint model, shared with the envelope tracer (envelope.mjs) */
export { D as TMJ_D };
const surfD = smooth(surf, false);
const boneD = surfD + `L640 0L0 0Z`;
// cartilage lining on the articular surface (fossa to just past the eminence crest), as a stroke under the outline
const cart = smooth(surf.slice(6, crestIdx + 3), false);
/* the same curve as surfD from point i0 to the end (the zygomatic arch's lower border), segment for segment */
function curveFrom(pts, i0) {
  let d = `M${f1(pts[i0][0])} ${f1(pts[i0][1])}`; const n = pts.length;
  for (let i = i0; i < n - 1; i++) { const p0 = pts[i ? i - 1 : 0], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2 < n ? i + 2 : i + 1];
    d += ` C${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])} ${f1(p2[1])}`; }
  return d;
}
const archI = crestIdx + 1, archLow = curveFrom(surf, archI), aP = surf[archI];
/* the arch is lateral to the coronoid process: drawn over it, nearly opaque, so the tip shows faintly behind it */
const archTop = [[640, 147], [560, 148], [492, 151], [458, 160]];
const archD = archLow + `L${archTop.map((p) => p.join(" ")).join("L")}Z`;
const archTopD = `M${f1(aP[0])} ${f1(aP[1])}` + smooth([aP, [446, 170], ...archTop.slice().reverse()], false).replace(/^M[^C]*/, "");

function rnd(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
const R1 = rnd(7);
let trab = "";
for (let i = 0; i < 70; i++) { const x = 8 + R1() * 624, y = 8 + R1() * 120; if (y > 150) continue; trab += `<ellipse class="tm-trab" cx="${f1(x)}" cy="${f1(y)}" rx="${f1(3 + R1() * 6)}" ry="${f1(1.6 + R1() * 2.4)}" transform="rotate(${Math.round(R1() * 180)} ${f1(x)} ${f1(y)})"/>`; }

// mandible in its own frame (origin = condyle center, 5 px per mm): condylar head (an ellipse 22 x 21), neck with the
// pterygoid fovea in front, the posterior border of the ramus, the anterior border rising to the coronoid process, the
// sigmoid notch between coronoid and condyle
const head = []; for (let a = 100; a >= -100; a -= 10) head.push([22 * Math.sin(a * Math.PI / 180), -21 * Math.cos(a * Math.PI / 180)]);
const MAND = [
  ...head,
  [-19.5, 18], [-17.5, 32], [-19, 58], [-21, 100], [-20, 150], [-16, 210], [-10, 270], [-6, 330], [100, 345], [214, 330],
  [196, 290], [176, 250], [158, 205], [148, 160], [146, 120], [150, 80], [155, 45], [158, 20], [155, 7], [149, 1.5], [143, 6],
  [130, 19], [114, 34], [96, 46], [76, 52], [56, 50], [38, 46], [25, 41], [16.5, 36], [13.5, 30], [15, 22], [18.5, 13],
];
const mandD = smooth(MAND, true);
/* the coronoid process (for its own hover target and the dashed outline of the part hidden behind the arch) */
const COR = [[76, 52], [96, 46], [114, 34], [130, 19], [143, 6], [149, 1.5], [155, 7], [158, 20], [155, 45], [150, 80], [110, 66]];
const corHit = smooth(COR, true);
const corGhost = smooth([[120, 30], [130, 19], [143, 6], [149, 1.5], [155, 7], [158, 20], [157.5, 30]], false);
/* articular fibrocartilage on the anterosuperior surface of the head, just inside the cortex */
const capPts = []; for (let a = -50; a <= 96; a += 6) capPts.push([20.2 * Math.sin(a * Math.PI / 180), -19.2 * Math.cos(a * Math.PI / 180)]);
const headCap = smooth(capPts, false);
function inPoly(p, poly) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
const R2 = rnd(11);
let mtrab = "";
for (let i = 0, k = 0; i < 400 && k < 46; i++) {
  const inHead = k < 16, x = inHead ? -18 + R2() * 36 : -16 + R2() * 170, y = inHead ? -16 + R2() * 44 : 30 + R2() * 240;
  const rx = 2 + R2() * (inHead ? 3 : 4.5), ry = 1.2 + R2() * 1.8;
  if (!inPoly([x, y], MAND) || !inPoly([x + rx + 3, y], MAND) || !inPoly([x - rx - 3, y], MAND) || !inPoly([x, y + 5], MAND) || !inPoly([x, y - 5], MAND)) continue;
  if (inHead && x * x / 324 + y * y / 289 > 1) continue;
  mtrab += `<ellipse class="tm-trab" cx="${f1(x)}" cy="${f1(y)}" rx="${f1(rx)}" ry="${f1(ry)}" transform="rotate(${Math.round(70 + R2() * 40)} ${f1(x)} ${f1(y)})"/>`; k++;
}
/* labels that ride on the mandible (frame coordinates: text, leader start, dot on the part) */
D.LAB_COND = { t: [24, 96], l: [21, 84], p: [1, 2] };
D.LAB_COR = { t: [100, 98], t2: [100, 111], l: [108, 86], p: [141, 30] };

// the disc in its own frame
const discO = [], discI = [];
for (let a = -64; a <= 102; a += 4) { discO.push(polar(a, D.RI + discT(a, D))); discI.push(polar(a, D.RI)); }
const discD = smooth(discO.concat(discI.slice().reverse()), true);
const zone = (a0, a1) => { const o = [], ii = []; for (let a = a0; a <= a1; a += 2) { o.push(polar(a, D.RI + discT(a, D) - .8)); ii.push(polar(a, D.RI + .8)); } return smooth(o.concat(ii.reverse()), true); };
const arc = (a0, a1, rf) => smooth(Array.from({ length: Math.round((a1 - a0) / 3) + 1 }, (_, i) => { const a = a0 + i * 3; return polar(a, rf(a)); }), false);

const F0 = tmjFrame(0, D);
const at = (sel) => Object.entries(F0.attrs[sel]).map(([k, v]) => ` ${k}="${v}"`).join("");

const INFO = {
  bone: "Temporal bone: the glenoid (mandibular) fossa, and in front of it the articular eminence, whose posterior slope the condyle and disc slide down when the jaw translates. Behind the fossa: the ear canal. In front, the zygomatic arch, the tunnel that protects the temporalis insertion on the coronoid process.",
  condyle: "Condyle: in the first 20-25 mm it only rotates, about the transverse horizontal axis, in the lower joint space. Centric relation is this seated, anterosuperior position against the eminence slope, on the thinnest avascular part of the disc.",
  coronoid: "Coronoid process: the temporalis inserts here. It sits under the zygomatic arch (drawn faded where it passes behind the arch), and swings down and forward out from under the arch as the mouth opens.",
  disc: "Articular disc: dense fibrous connective tissue that functions like a third bone, which makes the TMJ a compound joint. Biconcave: a thick anterior border, a thin intermediate zone (avascular, no nerves) where the condyle sits, and an even thicker posterior border. Thicker medially, so a displaced disc tends to go forward or medially. Not a meniscus.",
  upper: "Upper (superior) joint space, disc to temporal bone: translation happens here.",
  lower: "Lower (inferior) joint space, disc to condyle: rotation happens here.",
  retro: "Retrodiscal tissues: loaded with vessels and nerves, so functioning on them hurts. The superior retrodiscal lamina is elastic (it stretches here as the disc goes forward); the inferior lamina is collagenous and ties the disc to the back of the condyle.",
  lps: "Superior head of the lateral pterygoid: from the greater wing of the sphenoid (infratemporal crest) to the capsule and disc. Active in CLOSING, steadying the disc against the pull of the retrodiscal tissue.",
  lpi: "Inferior head of the lateral pterygoid: from the lateral surface of the lateral pterygoid plate to the pterygoid fovea of the condylar neck. Active in OPENING and protrusion: it pulls the condyle forward down the eminence.",
  tmlo: "TM ligament, outer oblique portion: a sling from the outer surface of the articular eminence down and back to the outer surface of the condylar neck. It limits rotational opening: once it is taut (about 20-25 mm), the jaw can only open further if the condyle translates forward.",
  tmli: "TM ligament, inner horizontal portion: from the eminence straight back to the lateral pole of the condyle and the disc. It limits posterior movement of the condyle and disc, protecting the retrodiscal tissue from a blow to the chin.",
};
const hot = (k, inner) => `<g class="hot" tabindex="0" data-part="${k}" data-info="${esc(INFO[k])}">${inner}</g>`;

const gauge = (() => {
  const [gx, y0, y1] = D.GAUGE; let s = `<rect class="tm-gauge-bg" x="${gx - 5}" y="${y0}" width="10" height="${y1 - y0}" rx="3"/>`;
  const yy = (mm) => f1(y0 + (y1 - y0) * mm / 50);
  s += `<rect class="tm-gauge-rot" x="${gx - 5}" y="${yy(20)}" width="10" height="${f1(yy(25) - yy(20))}"/>`;
  s += `<rect class="tm-gauge-fill" x="${gx - 5}" width="10"${at(".tm-gauge-fill")}/>`;
  for (let mm = 0; mm <= 50; mm += 10) s += `<path class="tm-gauge-tick" d="M${gx + 5} ${yy(mm)}h5"/><text class="am-label tm-gauge-t" x="${gx + 13}" y="${f1(+yy(mm) + 4)}">${mm}</text>`;
  s += `<path class="tm-gauge-mark"${at(".tm-gauge-mark")}/><text class="am-label strong" x="${gx - 8}" y="${y0 - 10}">Incisal opening (mm)</text>`;
  s += `<text class="am-label tm-gauge-note" x="${gx + 34}" y="${yy(22.5)}">end of rotation</text>`;
  return s;
})();
const rideLab = (k, lines) => `<g class="tm-ride"><path class="am-leader tm-lead-${k}"${at(".tm-lead-" + k)}/><circle class="am-dot tm-ldot-${k}" r="2"${at(".tm-ldot-" + k)}/>` +
  lines.map((t, i) => `<text class="am-label tm-rlab tm-lab-${k}${i ? "2" : ""}" text-anchor="middle"${at(".tm-lab-" + k + (i ? "2" : ""))}>${t}</text>`).join("") + `</g>`;

const crest = surf[crestIdx];
const body = [
  `<rect class="tm-soft" x="0" y="0" width="${W}" height="${H}"/>`,
  hot("bone", `<path class="tm-bone" d="${boneD}"/>${trab}<path class="tm-cart" d="${cart}"/><path class="tm-cortex" d="${surfD}"/><ellipse class="tm-eam" cx="192" cy="168" rx="20" ry="17"/>`),
  hot("retro", `<path class="tm-retro"${at(".tm-retro")}/><circle class="tm-vessel tm-v1" r="2.4"${at(".tm-v1")}/><circle class="tm-vessel tm-v2" r="1.9"${at(".tm-v2")}/><circle class="tm-vessel tm-v3" r="1.6"${at(".tm-v3")}/><path class="tm-inflam"${at(".tm-inflam")}/><path class="tm-suplam"${at(".tm-suplam")}/>`),
  /* the lateral pterygoid lies medial to the ramus and coronoid: drawn behind them, seen through the sigmoid notch */
  hot("lpi", `<path class="tm-muscle tm-lpi"${at(".tm-lpi")}/><path class="tm-fib tm-lpi-f"${at(".tm-lpi-f")}/>`),
  hot("lps", `<path class="tm-muscle tm-lps"${at(".tm-lps")}/><path class="tm-fib tm-lps-f"${at(".tm-lps-f")}/>`),
  hot("condyle", `<g class="tm-mand"${at(".tm-mand")}><path class="tm-mandible" d="${mandD}"/>${mtrab}<path class="tm-headcap" d="${headCap}"/><path class="tm-fovea" d="M15.5 25Q12 31 15 38"/></g>`),
  hot("bone", `<path class="tm-arch" d="${archD}"/><path class="tm-cortex" d="${archLow}"/><path class="tm-arch-top" d="${archTopD}"/>`),
  hot("coronoid", `<g class="tm-mand2"${at(".tm-mand2")}><path class="tm-hit" d="${corHit}"/><path class="tm-ghost" d="${corGhost}"/></g>`),
  hot("disc", `<g class="tm-disc"${at(".tm-disc")}><path class="tm-disc-body" d="${discD}"/><path class="tm-disc-iz" d="${zone(18, 44)}"/>` +
    `<path class="tm-space up" d="${arc(-56, 96, (a) => D.RI + discT(a, D) + 1.6)}"/><path class="tm-space lo" d="${arc(-58, 98, () => D.RI - 1.2)}"/></g>`),
  hot("tmli", `<path class="tm-lig tm-tmli"${at(".tm-tmli")}/><circle class="tm-lig-dot tm-tmli-dot" r="2.2"${at(".tm-tmli-dot")}/>`),
  hot("tmlo", `<path class="tm-lig tm-tmlo"${at(".tm-tmlo")}/><circle class="tm-lig-dot tm-tmlo-dot" r="2.4"${at(".tm-tmlo-dot")}/>`),
  `<circle class="tm-lig-dot" cx="${D.TMO[0]}" cy="${D.TMO[1]}" r="2.6"/><circle class="tm-lig-dot" cx="${D.TMI[0]}" cy="${D.TMI[1]}" r="2.6"/>`,
  `<text class="am-label tm-inlab" x="516" y="170" text-anchor="middle">zygomatic arch</text>`,
  rideLab("cond", ["condyle"]), rideLab("cor", ["coronoid", "process"]),
  callout([178, 160], "ear canal", [140, 128], "end"),
  callout([D.C0[0] - 6, D.C0[1] - 48], "glenoid fossa", [232, 64], "end"),
  callout([crest[0] + 11, crest[1] - 6], "articular eminence", [crest[0] + 30, 108], "start"),
  callout([622, 198], "LP, superior head", [624, 230], "end"),
  callout([622, 280], "LP, inferior head", [624, 344], "end"),
  `<g class="tm-gauge">${gauge}</g>`,
].join("");

const svg = figureSvg({ width: W, height: H, className: "tm-fig",
  label: "Schematic sagittal section of the right temporomandibular joint, patient facing right: temporal bone with the glenoid fossa, articular eminence, zygomatic arch and the ear canal; the mandibular condyle with its neck, the coronoid process tucked under the zygomatic arch, and the ramus; the biconcave articular disc with its thick posterior band, thin intermediate zone and anterior border; the retrodiscal tissue with its superior and inferior laminae; the superior and inferior heads of the lateral pterygoid; and the outer oblique and inner horizontal portions of the TM ligament. A slider opens the mouth from 0 to 50 millimeters: the condyle first rotates in the lower joint space, then the condyle and disc translate down the eminence in the upper joint space.",
  body });
const plate = plateHtml({ fig: "Fig 1", title: "TMJ opening: rotation, then translation", hint: "drag the slider", readout: "closed", body: `<div class="am-svg">${svg}</div>` });

const LEGEND = `<div class="am-stats tm-legend"><span><i class="sw" style="background:var(--tm-disc)"></i><b>Disc</b> <em>thick posterior band, thin intermediate zone, anterior border</em></span><span><i class="sw" style="background:var(--tm-retro)"></i><b>Retrodiscal tissue</b></span><span><i class="sw" style="background:var(--tm-muscle)"></i><b>Lateral pterygoid</b> <em>superior and inferior heads</em></span><span><i class="sw" style="background:var(--tm-lig)"></i><b>TM ligament</b> <em>outer oblique, inner horizontal</em></span></div>`;
const controls = `<div class="am-controls"><label class="am-slider"><span>Closed</span><input type="range" min="0" max="50" step="0.5" value="0" aria-label="Incisal opening in millimeters, 0 to 50"><span>50 mm</span></label><button type="button" class="am-btn tm-play" aria-pressed="false">Play</button></div>
<div class="am-stats" aria-live="polite"><span><b>Opening</b> <em data-r="mm"></em></span><span><b>Movement</b> <em data-r="phase"></em></span><span><b>Working space</b> <em data-r="space"></em></span><span><b>Outer TM ligament</b> <em data-r="lig"></em></span><span><b>Lateral pterygoid</b> <em data-r="lp"></em></span></div>
${LEGEND}
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Tap or hover any part for what it is.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>Drawn from the hub's L2 notes (Functional TMJ Anatomy, Dr. Givan): the biconcave disc and its zones, upper and lower joint spaces, the retrodiscal laminae, both heads of the lateral pterygoid and what each portion of the TM ligament limits; and the L1 handout's numbers: pure rotation to about 20-25 mm at the incisors, maximum opening about 40-60 mm.</li>
<li>Schematic, not to scale: the angles of rotation, how far the disc turns on the condyle, the path down the eminence and the ligament's tension are drawn to show the relationships, not measured. The mandible is drawn to the joint's scale (the coronoid process about 3 cm in front of the condyle, under the zygomatic arch), but the masseter and the soft tissue around the joint are left out.</li>
<li>Not all in one plane: the zygomatic arch and the TM ligament lie lateral to the joint and the lateral pterygoid medial to the ramus, so the ligament is drawn over the joint, the arch over the coronoid tip, and the muscle behind the ramus, where it shows through the notch between the condyle and the coronoid process.</li>
<li>Muscle activity follows the slider: moving it toward open lights the inferior head (opening), toward closed the superior head (closing).</li></ul></details>`;

function tmjLive(root, D) {
  var svg = root.querySelector(".tm-fig");
  var slider = root.querySelector('input[type="range"]');
  var playBtn = root.querySelector(".tm-play");
  var readout = root.querySelector("[data-readout]");
  var summary = root.querySelector(".am-summary");
  var infoEl = root.querySelector(".am-info");
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var rs = {}; Array.prototype.forEach.call(root.querySelectorAll("[data-r]"), function (e) { rs[e.getAttribute("data-r")] = e; });
  var els = {};
  var mm = 0, target = 0, prev = 0, dir = 0, playing = false, tourT = 0, frame = 0, last = 0, visible = true;
  function draw() {
    var F = D.tmjFrame(mm, D);
    Object.keys(F.attrs).forEach(function (sel) { var el = els[sel] || (els[sel] = svg.querySelector(sel)); if (!el) return; var a = F.attrs[sel]; for (var k in a) el.setAttribute(k, a[k]); });
    var rot = mm <= 25, taut = mm >= 22;
    dir = mm > prev + 1e-3 ? 1 : mm < prev - 1e-3 ? -1 : (Math.abs(target - mm) < 1e-3 ? 0 : dir);
    svg.setAttribute("data-phase", mm < .3 ? "closed" : rot ? "rot" : "trans");
    svg.setAttribute("data-lig", taut ? "taut" : "slack");
    svg.setAttribute("data-dir", dir > 0 ? "open" : dir < 0 ? "close" : "");
    rs.mm.textContent = mm.toFixed(0) + " mm";
    rs.phase.textContent = mm < .3 ? "closed (teeth together)" : rot ? "rotation only" : "rotation + translation";
    rs.space.textContent = mm < .3 ? "none" : rot ? "lower (disc to condyle)" : "upper (disc to eminence) and lower";
    rs.lig.textContent = mm < 18 ? "slack" : mm < 22 ? "tightening" : "taut";
    rs.lp.textContent = dir > 0 ? "inferior head (opening)" : dir < 0 ? "superior head (closing)" : "at rest";
    var st = mm < .3 ? "closed" : (rot ? "rotation" : "translation") + " · " + mm.toFixed(0) + " mm";
    if (readout.textContent !== st) readout.textContent = st;
    var text = mm < .3 ? "Closed: the condyle is seated in the fossa against the posterior slope of the eminence, on the thin intermediate zone of the disc, with the thick posterior band above it. Drag the slider to open." :
      rot ? "Pure rotation (hinge movement) about the transverse horizontal axis: the condyle turns inside the disc, in the lower joint space, while the disc stays put in the fossa. This carries the incisors to about 20-25 mm, when the outer oblique part of the TM ligament goes taut." :
      "Rotation plus translation: with the ligament taut, the jaw can only open further if the condyle-disc complex slides forward and down the posterior slope of the eminence, in the upper joint space. The disc rotates posteriorly on the condyle, so its thin intermediate zone stays between condyle and eminence, and the elastic superior retrodiscal lamina stretches behind it. Maximum opening is about 40-60 mm.";
    if (summary.textContent !== text) summary.textContent = text;
    prev = mm;
  }
  function step(dt) {
    if (playing) { tourT += dt; var u = (tourT % 8) / 8; target = u < .1 ? 0 : u < .5 ? (u - .1) / .4 : u < .6 ? 1 : u < .95 ? 1 - (u - .6) / .35 : 0; target = 50 * target * target * (3 - 2 * target); slider.value = target; }
    mm += (target - mm) * (1 - Math.exp(-dt / .16));
    if (Math.abs(target - mm) < .02) mm = target;
  }
  function tick(now) {
    frame = 0;
    if (!root.isConnected || !visible) return;
    var dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
    step(dt); draw();
    if (playing || Math.abs(target - mm) > .02) frame = requestAnimationFrame(tick);
    else { dir = 0; draw(); }
  }
  function kick() { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } }
  slider.addEventListener("input", function () { if (playing) setPlaying(false); target = +slider.value; if (reduce.matches) { prev = mm; mm = target; draw(); } else kick(); });
  function setPlaying(v) { playing = v && !reduce.matches; playBtn.textContent = playing ? "Pause" : "Play"; playBtn.setAttribute("aria-pressed", String(playing)); if (playing) { tourT = 0; kick(); } }
  playBtn.addEventListener("click", function () { setPlaying(!playing); });
  if (reduce.matches) playBtn.hidden = true;
  Array.prototype.forEach.call(svg.querySelectorAll(".hot"), function (el) {
    var on = function () { infoEl.textContent = el.getAttribute("data-info"); el.classList.add("is-hot"); };
    var off = function () { el.classList.remove("is-hot"); };
    el.addEventListener("pointerenter", on); el.addEventListener("pointerleave", off);
    el.addEventListener("focus", on); el.addEventListener("blur", off); el.addEventListener("click", on);
  });
  if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) kick(); }).observe(svg);
  var mq = window.matchMedia ? window.matchMedia("(max-width:560px)") : null;
  var fit = function () { svg.setAttribute("viewBox", mq && mq.matches ? D.narrow : D.wide); };
  if (mq) { fit(); if (mq.addEventListener) mq.addEventListener("change", fit); }
  draw();
}

const CSS = `
.anima .tm-fig{--tm-soft:#f1e8df}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]) .anima .tm-fig{--tm-soft:#2b2a31} }
:root[data-theme="dark"] .anima .tm-fig{--tm-soft:#2b2a31}
.anima .tm-soft{fill:var(--tm-soft)}
.anima .tm-bone{fill:var(--tm-bone)}
.anima .tm-trab{fill:var(--tm-trab);opacity:.7}
.anima .tm-cortex{fill:none;stroke:var(--anatomy-hi);stroke-width:1.6;stroke-linejoin:round}
.anima .tm-cart{fill:none;stroke:var(--tm-cart);stroke-width:5;stroke-linecap:round}
.anima .tm-eam{fill:var(--tm-air);stroke:var(--anatomy-hi);stroke-width:1.4}
.anima .tm-arch{fill:var(--tm-bone);fill-opacity:.8;stroke:none}
.anima .tm-arch-top{fill:none;stroke:var(--anatomy-mid);stroke-width:1;stroke-linecap:round}
.anima .tm-mandible{fill:var(--tm-bone-in);stroke:var(--anatomy-hi);stroke-width:1.6;stroke-linejoin:round}
.anima .tm-headcap{fill:none;stroke:var(--tm-cart);stroke-width:3;stroke-linecap:round}
.anima .tm-fovea{fill:none;stroke:var(--anatomy-mid);stroke-width:1.2;stroke-linecap:round}
.anima .tm-hit{fill:transparent;stroke:none}
.anima .tm-ghost{fill:none;stroke:var(--anatomy-hi);stroke-width:1.1;stroke-dasharray:3 2.5;vector-effect:none;opacity:.75}
.anima .tm-disc-body{fill:var(--tm-disc);stroke:var(--anatomy-hi);stroke-width:1.2;stroke-linejoin:round}
.anima .tm-disc-iz{fill:var(--tm-disc-mid);stroke:none}
.anima .tm-space{fill:none;stroke:var(--anatomy-lit);stroke-width:3;stroke-linecap:round;opacity:0;transition:opacity .3s}
.anima .tm-fig[data-phase="rot"] .tm-space.lo,.anima .tm-fig[data-phase="trans"] .tm-space.up{opacity:.9}
.anima .tm-fig[data-phase="trans"] .tm-space.lo{opacity:.45}
.anima .tm-retro{fill:var(--tm-retro);stroke:none;opacity:.9}
.anima .tm-vessel{fill:var(--tm-vessel)}
.anima .tm-suplam{fill:none;stroke:var(--anatomy-hi);stroke-width:1.4;stroke-linejoin:round}
.anima .tm-inflam{fill:none;stroke:var(--anatomy-hi);stroke-width:1.6;stroke-linecap:round}
.anima .tm-muscle{fill:var(--tm-muscle);stroke:var(--tm-muscle-fib);stroke-width:1;stroke-linejoin:round;opacity:.9;transition:filter .2s,opacity .2s}
.anima .tm-fib{fill:none;stroke:var(--tm-muscle-fib);stroke-width:.9;opacity:.8}
.anima .tm-fig[data-dir="open"] .tm-lpi,.anima .tm-fig[data-dir="close"] .tm-lps{opacity:1;stroke:var(--anatomy-lit);stroke-width:2.2}
.anima .tm-lig{fill:none;stroke:var(--tm-lig);stroke-width:4;stroke-linecap:round;opacity:.8;stroke-dasharray:4 4;vector-effect:none;transition:opacity .2s}
.anima .tm-fig[data-lig="taut"] .tm-tmlo{stroke-dasharray:none;opacity:1;stroke-width:5}
.anima .tm-lig-dot{fill:var(--anatomy-hi)}
.anima .tm-gauge-bg{fill:var(--anatomy-shade-3);stroke:var(--anatomy-mid);stroke-width:.8}
.anima .tm-gauge-rot{fill:var(--anatomy-faint)}
.anima .tm-gauge-fill{fill:var(--anatomy-lit);opacity:.55}
.anima .tm-gauge-tick{fill:none;stroke:var(--anatomy-mid);stroke-width:1}
.anima .tm-gauge-mark{fill:none;stroke:var(--anatomy-lit);stroke-width:3;stroke-linecap:round}
.anima .tm-gauge-note{font-size:10px}
.anima .tm-fig .am-label{fill:var(--anatomy-hi);paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round}
.anima .tm-fig .tm-inlab{fill:var(--anatomy-text);stroke:var(--tm-bone);font-style:italic}
.anima .tm-fig .tm-rlab{stroke:var(--tm-bone-in)}
.anima .tm-fig .am-leader{stroke:var(--anatomy-mid)}
.anima .tm-fig .am-dot{fill:var(--anatomy-hi)}
.anima .tm-legend .sw{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px;vertical-align:-1px;border:1px solid var(--line-strong)}
@media (max-width:560px){.anima .tm-gauge{display:none}}
@media (prefers-reduced-motion:reduce){.anima .tm-space,.anima .tm-muscle,.anima .tm-lig{transition:none}}
`;

export function tmj() {
  return {
    id: "tmj", lec: "anatomy",
    title: "TMJ opening: rotation, then translation",
    caption: "Drag the slider to open the mouth from 0 to 50 mm. Schematic sagittal section of the right joint, patient facing right; drawn from the L2 notes.",
    html: `<div class="anima" data-anima="tmj">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: tmjLive.toString(),
    helpers: [discT, tmjModel, tmjFrame],
    data: D,
  };
}
