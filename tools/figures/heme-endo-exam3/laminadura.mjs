// Fig: the lamina dura, normal and in hyperparathyroidism (Lecture A, Dental Endocrinology Clinical Application,
// Dr. Taylor: "Hyperparathyroidism on the radiograph" and "Hypoparathyroidism"). Top: a periapical-style film of the
// lower premolars (the distal half of the canine, both premolars, the mesial half of the first molar), drawn to the
// teeth's real proportions: the white lamina dura and the dark PDL space around every root, the interdental crests and
// the trabecular bone. Bottom: the orange box on the film magnified (root, PDL, lamina dura, bone and marrow, a blood
// vessel), where PTH reaches the bone cells. Pick a state: in hyperparathyroidism osteoclasts open resorption bays, the
// lamina dura thins away and the film loses its white line (the bone turns diffuse gray up to the tooth), a radiolucent
// brown tumor appears below the second premolar, and the teeth are marked mobile; in hypoparathyroidism the blood's
// calcium falls and the muscle locks in tetany (the lecture gives no film finding for it, so the film is dimmed).
import { makeFig, f1, T, L, HOT } from "./shared.mjs";

/* ---------- build-time geometry (millimeters on the film, 9 drawing units per mm) ---------- */
const S = 9, FX = 118, FY = 26, FW = 26, FH = 36;
const PX = (q) => [FX + q[0] * S, FY + q[1] * S];
function crs(p, closed, per) {
  /* Catmull-Rom spline sampled into a dense polyline */
  const n = p.length, out = [], last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    let a = p[(i - 1 + n) % n], b = p[i], c = p[(i + 1) % n], d = p[(i + 2) % n];
    if (!closed) { if (i === 0) a = b; if (i + 2 >= n) d = c; }
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      const f = (j) => 0.5 * (2 * b[j] + (-a[j] + c[j]) * t + (2 * a[j] - 5 * b[j] + 4 * c[j] - d[j]) * t2 + (-a[j] + 3 * b[j] - 3 * c[j] + d[j]) * t3);
      out.push([f(0), f(1)]);
    }
  }
  if (!closed) out.push(p[n - 1]);
  return out;
}
const dOf = (pts, close) => pts.map((q, i) => (i ? "L" : "M") + f1(q[0]) + " " + f1(q[1])).join("") + (close ? "Z" : "");
/* the same Catmull-Rom curve as exact cubic Beziers (b + (c - a) / 6): closed, or the run of a closed curve from point
   i0 forward to i1 (closed with a straight line), or an open curve */
function bz(p, closed, i0, i1) {
  const n = p.length, q = p.map(PX), seg = [];
  if (i0 === undefined) { i0 = 0; i1 = closed ? n : n - 1; } else if (i1 <= i0) i1 += n;
  let d = "M" + f1(q[i0 % n][0]) + " " + f1(q[i0 % n][1]);
  for (let i = i0; i < i1; i++) {
    const b = q[i % n], c = q[(i + 1) % n];
    const a = closed || i > 0 ? q[(i - 1 + n) % n] : b, e = closed || i + 2 < n ? q[(i + 2) % n] : c;
    d += "C" + f1(b[0] + (c[0] - a[0]) / 6) + " " + f1(b[1] + (c[1] - a[1]) / 6) + " " + f1(c[0] - (e[0] - b[0]) / 6) + " " + f1(c[1] - (e[1] - b[1]) / 6) + " " + f1(c[0]) + " " + f1(c[1]);
  }
  return d + (closed || i0 ? "Z" : "");
}
/* an ellipse as two relative arcs (no element, so a texture of many is one path) */
function ell(cx, cy, rx, ry, deg) {
  const r = deg * Math.PI / 180, dx = Math.round(rx * Math.cos(r)), dy = Math.round(rx * Math.sin(r)), A = "a" + rx + " " + ry + " " + Math.round(deg) + " 1 0 ";
  return "M" + (cx + dx) + " " + (cy + dy) + A + (-2 * dx) + " " + (-2 * dy) + A + (2 * dx) + " " + (2 * dy) + "z";
}

/* the teeth, buccal view, clockwise from the cusp tip (mm; y grows toward the apex). Proportions from Wheeler's: lower
   premolar crowns 8-8.5 mm on 14-14.5 mm roots, 7 mm at the contacts and 5 mm at the neck; the canine's 11 mm crown
   and 16 mm root; the first molar's 11 mm crown, 7.5 mm long, on two 14 mm roots. */
const TEETH = [
  { id: "c", cej: 12.6, ci: [15, 5],
    out: [[0.9, 1.8], [2.6, 3.3], [4.2, 5.0], [4.6, 6.4], [4.3, 9.4], [3.8, 12.6], [3.7, 16.5], [3.1, 21.5], [2.3, 26.0], [1.4, 28.6], [0.6, 28.9], [-0.4, 28.2], [-1.2, 25.5], [-1.8, 21.0], [-1.7, 16.0], [-1.6, 12.6], [-2.2, 9.4], [-2.5, 6.0], [-1.6, 3.6]],
    dej: [[-1.6, 12.6], [-1.75, 9.4], [-1.9, 6.4], [-1.0, 4.6], [0.9, 3.4], [2.4, 4.6], [3.6, 6.2], [3.65, 9.4], [3.8, 12.6]],
    pulp: [[0.9, 5.4], [1.6, 6.6], [1.9, 9.0], [1.8, 12.4], [1.55, 17.0], [1.2, 22.0], [0.75, 27.6], [0.55, 27.6], [0.55, 22.0], [0.45, 17.0], [0.1, 12.4], [-0.1, 9.0], [0.2, 6.6]] },
  { id: "p1", cej: 11.5, ci: [15, 5],
    out: [[7.9, 3.0], [9.6, 4.3], [11.4, 5.5], [11.8, 6.6], [11.4, 8.8], [10.8, 11.5], [10.6, 15.0], [10.2, 19.0], [9.4, 23.0], [8.8, 25.2], [8.4, 25.6], [7.9, 25.2], [7.2, 23.0], [6.4, 19.0], [5.9, 15.0], [5.8, 11.5], [5.2, 8.6], [4.8, 6.0], [5.1, 5.0], [6.4, 3.8]],
    dej: [[5.8, 11.5], [5.85, 8.7], [5.6, 6.6], [6.0, 5.8], [7.0, 5.0], [7.9, 4.7], [9.1, 5.4], [10.5, 6.3], [10.9, 7.0], [10.6, 9.0], [10.8, 11.5]],
    pulp: [[7.9, 6.4], [8.6, 7.2], [9.3, 8.6], [9.3, 10.2], [9.0, 11.6], [8.75, 14.5], [8.55, 19.5], [8.45, 24.8], [8.3, 24.8], [8.05, 19.5], [7.75, 14.5], [7.5, 11.6], [7.2, 10.2], [7.2, 8.6], [7.5, 7.2]] },
  { id: "p2", cej: 11.4, ci: [15, 5],
    out: [[15.5, 3.4], [17.0, 4.3], [18.7, 5.4], [19.1, 6.7], [18.7, 9.0], [18.1, 11.4], [18.0, 15.0], [17.6, 19.0], [16.9, 23.2], [16.3, 25.5], [15.85, 25.9], [15.3, 25.5], [14.6, 23.2], [13.7, 19.0], [13.2, 15.0], [13.1, 11.4], [12.5, 9.0], [12.1, 6.5], [12.5, 5.3], [14.0, 4.3]],
    dej: [[13.1, 11.4], [13.15, 9.0], [12.9, 6.8], [13.4, 6.0], [14.5, 5.3], [15.5, 5.0], [16.6, 5.4], [17.8, 6.2], [18.3, 7.0], [17.95, 9.1], [18.1, 11.4]],
    pulp: [[15.5, 6.6], [16.2, 7.3], [16.7, 8.6], [16.6, 10.2], [16.3, 11.6], [16.1, 14.5], [15.95, 19.5], [15.9, 25.2], [15.75, 25.2], [15.45, 19.5], [15.15, 14.5], [14.9, 11.6], [14.6, 10.2], [14.6, 8.6], [15.0, 7.3]] },
  { id: "m1", cej: 11.5, ci: [26, 9],
    out: [[21.9, 4.0], [23.2, 4.6], [24.5, 5.3], [25.6, 4.7], [26.9, 4.3], [28.3, 4.8], [29.6, 5.6], [30.4, 6.8], [30.1, 9.2], [29.1, 11.5], [28.9, 15.0], [28.4, 20.0], [27.8, 24.0], [27.0, 24.9], [26.2, 24.2], [25.8, 20.0], [25.5, 16.3], [24.9, 15.1], [24.3, 16.2], [24.0, 20.0], [23.6, 24.0], [22.6, 25.6], [21.6, 25.0], [20.9, 21.5], [20.4, 17.0], [20.3, 13.5], [20.4, 11.5], [19.75, 9.0], [19.45, 6.6], [19.9, 5.1], [20.8, 4.4]],
    dej: [[20.4, 11.5], [20.35, 9.0], [20.2, 6.9], [20.9, 5.9], [21.9, 5.6], [23.2, 6.1], [24.5, 6.7], [25.6, 6.2], [26.9, 5.9], [28.3, 6.3], [29.4, 7.0], [29.45, 9.2], [29.1, 11.5]],
    pulp: [[21.3, 7.6], [22.2, 8.2], [25.6, 8.4], [26.9, 7.8], [27.6, 8.6], [27.5, 10.6], [27.0, 12.0], [27.05, 16.0], [27.0, 20.0], [26.95, 24.3], [26.8, 24.3], [26.6, 20.0], [26.4, 16.0], [26.0, 12.4], [24.9, 11.9], [23.6, 12.4], [23.25, 16.0], [22.85, 20.0], [22.55, 25.0], [22.4, 25.0], [22.2, 20.0], [21.95, 16.0], [21.6, 12.4], [21.0, 11.0], [20.9, 9.0]] },
];
/* the alveolar crest, about 1.5 mm below the necks, and where it meets each root */
const CREST = [[-3, 14.3], [3.76, 14.0], [4.8, 13.45], [5.84, 13.0], [10.74, 13.0], [11.95, 12.6], [13.13, 12.9], [18.06, 12.9], [19.25, 12.5], [20.32, 13.0], [32, 13.0]];
const CREST_SEG = [[[3.76, 14.0], [4.8, 13.45], [5.84, 13.0]], [[10.74, 13.0], [11.95, 12.6], [13.13, 12.9]], [[18.06, 12.9], [19.25, 12.5], [20.32, 13.0]]];
function crestY(x) { for (let i = 1; i < CREST.length; i++) if (x <= CREST[i][0]) { const a = CREST[i - 1], b = CREST[i], u = (x - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * u; } return 13; }
function inPoly(pt, poly) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > pt[1]) !== (b[1] > pt[1]) && pt[0] < (b[0] - a[0]) * (pt[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
function rand(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
/* the x where a tooth's outline crosses height y, on its mesial (min) or distal (max) side */
function sideX(dense, y, side) {
  const xs = [];
  for (let i = 0; i < dense.length; i++) { const a = dense[i], b = dense[(i + 1) % dense.length]; if ((a[1] - y) * (b[1] - y) <= 0 && a[1] !== b[1]) xs.push(a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1])); }
  return side === "min" ? Math.min.apply(null, xs) : Math.max.apply(null, xs);
}
/* the root's surface below the crest, as one open run (it carries the PDL space and the lamina dura) */
function socketRun(dense) {
  const below = dense.map((q) => q[1] > crestY(q[0]));
  let i0 = below.indexOf(true), i1 = below.lastIndexOf(true);
  const cut = (a, b) => { const fa = a[1] - crestY(a[0]), fb = b[1] - crestY(b[0]), u = fa / (fa - fb); return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]; };
  const run = dense.slice(i0, i1 + 1);
  if (i0 > 0) run.unshift(cut(dense[i0 - 1], dense[i0]));
  if (i1 < dense.length - 1) run.push(cut(dense[i1], dense[i1 + 1]));
  return run;
}

function filmArt() {
  const o = { SOCK: [], TOOTH: [] }, dense = {}, polys = [];
  for (const t of TEETH) {
    const d = crs(t.out, true, 10); dense[t.id] = d; polys.push(d);
    o.TOOTH.push('<path class="lm-dentin" d="' + bz(t.out, true) + '"/><path class="lm-enamel" d="' + bz(t.out, true, t.ci[0], t.ci[1]) + '"/><path class="lm-dentin" d="' + bz(t.dej, false) + 'Z"/><path class="lm-pulp" d="' + bz(t.pulp, true) + '"/>');
    o.SOCK.push(dOf(socketRun(crs(t.out, true, 4)).map(PX), false));
  }
  o.CRESTL = CREST_SEG.map((s) => bz(s, false)).join("");
  /* bone below the crest, and the air and soft tissue above it */
  o.BONE = bz(CREST, false).replace(/Z$/, "") + "L" + PX([32, 36.6]).map(f1).join(" ") + "L" + PX([-3, 36.6]).map(f1).join(" ") + "Z";
  /* marrow spaces: the mandible's thick trabeculae with large, roughly horizontal spaces */
  const r = rand(7), blobs = [];
  for (let gy = 0; gy < 17; gy++) for (let gx = 0; gx < 16; gx++) {
    const cx = -0.4 + gx * 1.8 + (gy % 2) * 0.9 + (r() - 0.5) * 0.8, cy = 13.7 + gy * 1.38 + (r() - 0.5) * 0.6;
    if (cy < crestY(cx) + 0.75 || cy > 36.3) continue;
    if (polys.some((p) => inPoly([cx, cy], p))) continue;
    const rx = 0.38 + r() * 0.5, ry = rx * (0.5 + r() * 0.3), rot = (r() - 0.5) * 40, c = PX([cx, cy]);
    blobs.push(ell(Math.round(c[0]), Math.round(c[1]), Math.round(rx * S * 2) / 2, Math.round(ry * S * 2) / 2, rot));
  }
  o.MARROW = '<path class="lm-marrow" d="' + blobs.join("") + '"/>';
  /* "ground glass": the trabecular pattern gone to a fine, even granularity: rows of short dashes in two tones, each
     row cut where the bone ends at the crest */
  let gl = "", gd = "";
  for (let j = 0; j < 46 && 13.3 + j * 0.5 < 36.2; j++) {
    const y = 13.3 + j * 0.5, segs = []; let x0 = null;
    for (let x = -1.5; x <= 27.6; x += 0.1) { const ok = y > crestY(x) + 0.35; if (ok && x0 === null) x0 = x; if ((!ok || x > 27.5) && x0 !== null) { segs.push([x0, x]); x0 = null; } }
    const sg = segs.map((g) => "M" + f1(PX([g[0], y])[0]) + " " + f1(PX([0, y])[1]) + "H" + f1(PX([g[1], y])[0])).join("");
    if (j % 2) gl += sg; else gd += sg;
  }
  o.GLASS = '<path class="lm-gl-l" d="' + gl + '"/><path class="lm-gl-d" d="' + gd + '"/>';
  /* the brown tumor: a lobulated radiolucency in the bone below the second premolar, with faint septa */
  const bt = [];
  for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, m = 1 + 0.08 * Math.sin(3 * a + 0.4) + 0.05 * Math.sin(5 * a + 1.3); bt.push([15.9 + Math.cos(a) * 4.3 * m, 31.0 + Math.sin(a) * 3.05 * m]); }
  const btRim = bt.map((q) => [15.9 + (q[0] - 15.9) * 1.1, 31.0 + (q[1] - 31.0) * 1.12]);
  o.BT = '<path class="lm-bt-rim" d="' + bz(btRim, true) + '"/><path class="lm-bt" d="' + bz(bt, true) + '"/>' +
    '<path class="lm-bt-sep" d="' + bz([[13.6, 28.6], [14.4, 30.6], [14.1, 33.3]], false) + bz([[17.9, 28.4], [17.3, 30.8], [18.5, 33.0]], false) + '"/>';
  o.BTHIT = bz(btRim, true);
  o.FILM = [FX, FY, FW * S, FH * S];
  /* where the labels point: the canine's distal lamina dura and PDL space, its root, the molar's mesial root, the bone */
  const cD = (y) => sideX(dense.c.filter((q) => q[0] > 1), y, "max");
  o.TG = {
    ld: PX([cD(17) + (2.6 + 1.4) / S, 17]), pdl: PX([cD(21) + 1.3 / S, 21]),
    root: PX([(sideX(dense.c, 24, "min") + cD(24)) / 2, 24]),
    mroot: PX([(sideX(dense.m1.filter((q) => q[0] < 24.6), 20, "min") + sideX(dense.m1.filter((q) => q[0] < 24.6), 20, "max")) / 2, 20]),
    bone: PX([4.6, 31.2]), bt: PX([15.9 + 4.3 * 1.13, 30.6]),
    mob: [PX([13.7, 1.55]), PX([17.7, 1.55])],
    box: [PX([16.9, 17.4]), PX([19.35, 19.95])],
  };
  return o;
}

/* ---------- the magnified panel (drawing units) ---------- */
const PT = 404, PB = 562;
const TRAB = [
  [[176, 420], [214, 416], [256, 420], [292, 428], [306, 438], [298, 448], [262, 446], [222, 442], [176, 444]],
  [[300, 480], [330, 470], [364, 476], [374, 490], [362, 504], [330, 508], [306, 498]],
  [[176, 516], [204, 512], [240, 518], [256, 528], [244, 538], [208, 536], [176, 538]],
];
function panelArt() {
  const o = {};
  const tr = TRAB.map((p) => crs(p, true, 6));
  o.TRAB = '<path class="lm-trab" d="' + tr.map((p) => dOf(p, true)).join("") + '"/>';
  /* dentinal tubules: from the field's edge to the cementum */
  let tub = ""; for (let y = PT + 6; y < PB; y += 7) tub += "M16 " + y + "C40 " + (y - 1.5) + " 60 " + (y + 1.5) + " 78 " + y;
  o.TUB = '<path class="lm-tub" d="' + tub + '"/>';
  /* marrow: fat cells packed in the spaces between the trabeculae, clear of the lamina dura and the vessel */
  const r = rand(5), fat = [];
  const clear = (x, y, rr) => !tr.some((p) => inPoly([x, y], p) || p.some((q) => Math.hypot(q[0] - x, q[1] - y) < rr + 2.5));
  for (let n = 0; n < 2400 && fat.length < 46; n++) {
    const rr = 7 + r() * 6, x = 198 + rr + r() * (392 - 198 - 2 * rr), y = PT + rr + 1 + r() * (PB - PT - 2 * rr - 2);
    if (!clear(x, y, rr)) continue;
    if (fat.some((f) => Math.hypot(f[0] - x, f[1] - y) < f[2] + rr + 1.5)) continue;
    fat.push([x, y, rr]);
  }
  o.FAT = fat.map((f) => '<circle class="lm-fat" cx="' + f1(f[0]) + '" cy="' + f1(f[1]) + '" r="' + f1(f[2]) + '"/>').join("");
  /* marrow cells between the fat cells */
  /* (zero-length strokes with round caps: one path of dots) */
  let mc = "", nmc = 0; for (let n = 0; n < 900 && nmc < 90; n++) {
    const x = Math.round(200 + r() * 190), y = Math.round(PT + 3 + r() * (PB - PT - 6));
    if (!clear(x, y, 2) || fat.some((f) => Math.hypot(f[0] - x, f[1] - y) < f[2] + 2.2)) continue;
    mc += "M" + x + " " + y + "h0"; nmc++;
  }
  o.MCELL = '<path class="lm-mcell" d="' + mc + '"/>';
  /* bone cells on the trabeculae: [x, y, angle] */
  o.OBT = [[232, 445.5, 92], [270, 449.5, 98], [214, 511, -86], [238, 515.5, -78], [334, 466.5, -80], [352, 507, 70]];
  return o;
}

/* ---------- page helpers (serialized into the page) ---------- */
/* dots riding a polyline: n of them, one lap per per ms, faded at both ends; still and evenly spaced without time */
function ldDots(p, n, per, t, cls, r, ph, op) {
  if (!n || op <= 0.02) return "";
  var c = [0], Lt = 0, i, k, o = "";
  for (i = 1; i < p.length; i++) { Lt += Math.sqrt(Math.pow(p[i][0] - p[i - 1][0], 2) + Math.pow(p[i][1] - p[i - 1][1], 2)); c.push(Lt); }
  for (k = 0; k < n; k++) {
    var u = ((t ? t / per : 0) + (k + 0.5) / n + (ph || 0)) % 1, s = u * Lt, j = 1;
    while (j < c.length - 1 && c[j] < s) j++;
    var f = (s - c[j - 1]) / ((c[j] - c[j - 1]) || 1), x = p[j - 1][0] + (p[j][0] - p[j - 1][0]) * f, y = p[j - 1][1] + (p[j][1] - p[j - 1][1]) * f;
    o += '<circle class="' + cls + '" cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + r + '" opacity="' + f1(Math.min(1, u / 0.08, (1 - u) / 0.08) * op) + '"/>';
  }
  return o;
}
/* a resorption bay's depth at height y */
function ldBay(y, B, k) { var d = 0, i; for (i = 0; i < B.length; i++) { var q = (y - B[i][0]) / B[i][1]; if (q > -1 && q < 1) d += B[i][2] * k * (0.5 + 0.5 * Math.cos(Math.PI * q)); } return d; }
function ldLeft(y, k, D) { return 142 + 11 * k + ldBay(y, D.BAYL, k); }
function ldRight(y, k, D) { return 188 - 12 * k - ldBay(y, D.BAYR, k); }
/* a callout from a label outside the film to a part on it: the leader is split at the film's edge so the part on the
   film is drawn light over a dark core, and it ends on a ringed pin */
function ldCall(x, y, s, px, py, a, cls, D) {
  var sx = a === "end" ? x + 3 : x - 3, sy = y - 4, ex = a === "end" ? D.FILM[0] : D.FILM[0] + D.FILM[2], u = (ex - sx) / ((px - sx) || 1), my = sy + (py - sy) * u;
  return '<path class="lead" d="M' + f1(sx) + " " + f1(sy) + "L" + f1(ex) + " " + f1(my) + '"/><path class="lm-lin-u" d="M' + f1(ex) + " " + f1(my) + "L" + f1(px) + " " + f1(py) + '"/><path class="lm-lin" d="M' + f1(ex) + " " + f1(my) + "L" + f1(px) + " " + f1(py) + '"/>' +
    '<circle class="lm-pin" cx="' + f1(px) + '" cy="' + f1(py) + '" r="2.3"/>' + (Array.isArray(s) ? s.map(function (ln, i) { return T(x, y + i * 14, ln, cls, a); }).join("") : T(x, y, s, cls, a));
}
function ldWord(v) { return { u: "↑ high", d: "↓ low", n: "= normal", ng: "? not given", tet: "tetany" }[v] || v; }
function ldChip(x, y, name, v, info) {
  var s = ldWord(v), w = Math.round(Math.max(name.length * 6.3, s.length * 6.6) + 18), cls = v === "u" ? "lm-up" : (v === "d" || v === "tet") ? "lm-dn" : v === "ng" ? "lm-q" : "lm-eq";
  return HOT(info, '<rect class="lm-chip ' + cls + '" x="' + x + '" y="' + y + '" width="' + w + '" height="34" rx="8"/>' + T(x + 9, y + 14, name, "lm-xs lm-nm", "start") + T(x + 9, y + 28, s, "lm-xs lm-lv " + cls, "start"));
}

function ldRender(st, D) {
  var t = st.t || 0, tk = st.s === "hyper" ? 1 : 0, th = st.s === "hypo" ? 1 : 0;
  /* ease between states: the lamina dura dissolves and the tumor fades in, rather than popping */
  if (!t || st._k === undefined) { st._k = tk; st._h = th; }
  else { var dt = Math.max(0, Math.min(120, t - (st._lt || t))), e = 1 - Math.exp(-dt / 280); st._k += (tk - st._k) * e; st._h += (th - st._h) * e; if (Math.abs(tk - st._k) < 0.004) st._k = tk; if (Math.abs(th - st._h) < 0.004) st._h = th; }
  st._lt = t;
  var k = st._k, h = st._h, F = D.FILM, G = D.TG, o = "", i, S = D.ST[st.s];

  /* ===== the film ===== */
  o += '<rect class="lm-film" x="' + F[0] + '" y="' + F[1] + '" width="' + F[2] + '" height="' + F[3] + '" rx="12"/>';
  o += '<rect class="lm-air" x="' + F[0] + '" y="' + F[1] + '" width="' + F[2] + '" height="20"/>';
  o += HOT(k > 0.5 ? D.INFO.boneH : D.INFO.bone, '<path class="lm-bone" d="' + D.BONE + '"/>' +
    (k < 0.98 ? '<g opacity="' + f1(1 - k) + '">' + D.MARROW + "</g>" : "") + (k > 0.02 ? '<g opacity="' + f1(k) + '">' + D.GLASS + "</g>" : ""));
  if (k > 0.02) o += HOT(D.INFO.bt, '<g opacity="' + f1(k) + '">' + D.BT + '</g><path class="lm-hit-f" d="' + D.BTHIT + '"/>');
  var sock = D.SOCK.join("");
  if (k < 0.98) o += '<g opacity="' + f1(1 - k) + '"><path class="lm-ld" d="' + sock + '"/><path class="lm-crest" d="' + D.CRESTL + '"/></g>';
  o += '<path class="lm-pdl" d="' + sock + '" opacity="' + f1(1 - 0.72 * k) + '"/>';
  o += HOT(D.INFO.tooth, D.TOOTH.join(""));
  o += HOT(k > 0.5 ? D.INFO.ldH : D.INFO.ld, '<path class="lm-hit" d="' + sock + D.CRESTL + '"/>');
  /* the box the panel below magnifies */
  o += HOT(D.INFO.box, '<rect class="lm-box" x="' + f1(G.box[0][0]) + '" y="' + f1(G.box[0][1]) + '" width="' + f1(G.box[1][0] - G.box[0][0]) + '" height="' + f1(G.box[1][1] - G.box[0][1]) + '" rx="2"/>');
  /* mobility: a clinical sign, marked over the crowns */
  if (k > 0.02) o += HOT(D.INFO.mob, '<g opacity="' + f1(k) + '"><rect class="lm-hit-f" x="' + f1(G.mob[0][0] - 2) + '" y="' + f1(G.mob[0][1] - 8) + '" width="' + f1(G.mob[1][0] - G.mob[0][0] + 4) + '" height="16"/><path class="lm-mob" d="M' + f1(G.mob[0][0] + 7) + " " + f1(G.mob[0][1]) + "H" + f1(G.mob[1][0] - 7) + '"/>' +
    '<path class="lm-mobh" d="M' + f1(G.mob[0][0]) + " " + f1(G.mob[0][1]) + "l8 -4.5v9z" + "M" + f1(G.mob[1][0]) + " " + f1(G.mob[1][1]) + "l-8 -4.5v9z" + '"/></g>');
  /* hypoparathyroidism: no film finding in the lecture */
  if (h > 0.02) o += '<rect class="lm-veil" x="' + F[0] + '" y="' + F[1] + '" width="' + F[2] + '" height="' + F[3] + '" rx="12" opacity="' + f1(0.62 * h) + '"/>' +
    '<g opacity="' + f1(h) + '"><rect class="lm-stamp" x="' + f1(F[0] + F[2] / 2 - 84) + '" y="' + f1(F[1] + 30) + '" width="168" height="40" rx="6"/>' +
    T(F[0] + F[2] / 2, F[1] + 47, "no film finding", "lm-xs lm-stampt", "middle") + T(F[0] + F[2] / 2, F[1] + 62, "in this lecture", "lm-xs lm-stampt", "middle") + "</g>";
  /* the film's frame: the paper covers the teeth where the film ends */
  o += '<path class="lm-mask" fill-rule="evenodd" d="M' + (F[0] - 60) + " " + (F[1] - 30) + "H" + (F[0] + F[2] + 60) + "V" + (F[1] + F[3] + 12) + "H" + (F[0] - 60) + "Z" +
    "M" + (F[0] + 12) + " " + F[1] + "H" + (F[0] + F[2] - 12) + "A12 12 0 0 1 " + (F[0] + F[2]) + " " + (F[1] + 12) + "V" + (F[1] + F[3] - 12) + "A12 12 0 0 1 " + (F[0] + F[2] - 12) + " " + (F[1] + F[3]) +
    "H" + (F[0] + 12) + "A12 12 0 0 1 " + F[0] + " " + (F[1] + F[3] - 12) + "V" + (F[1] + 12) + "A12 12 0 0 1 " + (F[0] + 12) + " " + F[1] + 'Z"/>';
  o += '<rect class="lm-edge" x="' + F[0] + '" y="' + F[1] + '" width="' + F[2] + '" height="' + F[3] + '" rx="12"/>';
  o += T(F[0] + F[2] / 2, 16, "a periapical-style film of the lower premolars", "lm-xs mut", "middle");

  /* ----- the film's labels ----- */
  var hy = k > 0.5;
  o += HOT(hy ? D.INFO.ldH : D.INFO.ld, ldCall(110, 183, hy ? ["lamina dura", "lost"] : "lamina dura", G.ld[0], G.ld[1], "end", "b" + (hy ? " lm-badt" : ""), D));
  if (!hy) o += HOT(D.INFO.pdl, ldCall(110, 219, "PDL space", G.pdl[0], G.pdl[1], "end", "b", D));
  o += HOT(D.INFO.root, ldCall(110, 246, "root", G.root[0], G.root[1], "end", "", D));
  o += HOT(hy ? D.INFO.boneH : D.INFO.bone, ldCall(110, hy ? 298 : 309, hy ? ["bone looks", "diffuse gray"] : "bone", G.bone[0], G.bone[1], "end", hy ? "lm-badt" : "", D));
  o += HOT(D.INFO.root, ldCall(360, 210, "root", G.mroot[0], G.mroot[1], "start", "", D));
  if (hy) {
    o += HOT(D.INFO.bt, ldCall(360, 300, ["brown tumor", "radiolucent"], G.bt[0], G.bt[1], "start", "b lm-badt", D));
    o += HOT(D.INFO.mob, ldCall(360, 46, ["teeth", "mobile"], G.mob[1][0] + 1, G.mob[1][1], "start", "lm-badt", D));
  }

  /* ===== the magnified panel ===== */
  var PT = D.PT, PB = D.PB, y, x, p;
  o += '<rect class="lm-panel" x="8" y="378" width="444" height="194" rx="12"/>';
  o += T(16, 370, "the orange box, magnified (schematic, not to scale)", "lm-xs mut", "start");
  o += '<rect class="lm-dent" x="16" y="' + PT + '" width="64" height="' + (PB - PT) + '"/>' + D.TUB + '<rect class="lm-cem" x="78" y="' + PT + '" width="8" height="' + (PB - PT) + '"/>';
  o += '<rect class="lm-pdlz" x="86" y="' + PT + '" width="80" height="' + (PB - PT) + '"/><rect class="lm-mrw" x="166" y="' + PT + '" width="232" height="' + (PB - PT) + '"/>';
  o += '<rect class="lm-ct" x="440" y="' + PT + '" width="4" height="' + (PB - PT) + '"/>';
  o += D.FAT + D.MCELL + D.TRAB;
  /* the lamina dura: a band of dense bone, eaten into by resorption bays when PTH is high */
  var lp = [], rp = [];
  for (y = PT; y <= PB + 2; y += 3) { var yy = Math.min(y, PB); lp.push([ldLeft(yy, k, D), yy]); rp.push([ldRight(yy, k, D), yy]); }
  p = lp.concat(rp.reverse());
  o += HOT(hy ? D.INFO.pldH : D.INFO.pld, '<path class="lm-band" d="M' + p.map(function (q) { return f1(q[0]) + " " + f1(q[1]); }).join("L") + 'Z"/>' + (function () {
    var s = "", lx, ok, run;
    for (lx = 150; lx <= 182; lx += 8) { run = ""; ok = false;
      for (y = PT; y <= PB; y += 4) { var inside = lx > ldLeft(y, k, D) + 1.6 && lx < ldRight(y, k, D) - 1.6; if (inside) { run += (ok ? "L" : "M") + lx + " " + y; ok = true; } else ok = false; }
      s += run; }
    var oc = "";
    for (i = 0; i < D.OCY.length; i++) { var q = D.OCY[i]; if (q[0] > ldLeft(q[1], k, D) + 3.5 && q[0] < ldRight(q[1], k, D) - 3.5) oc += '<ellipse cx="' + q[0] + '" cy="' + q[1] + '" rx="2.6" ry="1.4"/>'; }
    return '<path class="lm-lam" d="' + s + '"/><g class="lm-ocy">' + oc + "</g>";
  })());
  /* the PDL's fibers run from the cementum up into the lamina dura */
  var fb = "", fn = "";
  for (y = PT + 14; y <= PB + 8; y += 12) { var y1 = y - 12, x1 = ldLeft(y1, k, D) + 3, my = (y + y1) / 2 + 2; if (y1 < PT + 1) continue;
    var y0 = Math.min(y, PB); fb += "M86 " + y0 + "Q" + f1((86 + x1) / 2) + " " + f1(my + 3) + " " + f1(x1) + " " + y1; fn += '<ellipse cx="' + f1((86 + x1) / 2) + '" cy="' + f1(my + 1.6) + '" rx="3.4" ry="1.3" transform="rotate(-11 ' + f1((86 + x1) / 2) + " " + f1(my + 1.6) + ')"/>'; }
  o += HOT(D.INFO.ppdl, '<rect class="lm-hit-f" x="86" y="' + PT + '" width="56" height="' + (PB - PT) + '"/><path class="lm-fib" d="' + fb + '"/><g class="lm-fnu">' + fn + "</g>");
  o += HOT(D.INFO.proot, '<rect class="lm-hit-f" x="16" y="' + PT + '" width="70" height="' + (PB - PT) + '"/>');
  o += HOT(D.INFO.pbone, '<path class="lm-hit-f" d="' + D.TRABD + '"/>');
  /* osteoblasts on the bone; the ones over a bay are gone when it opens */
  var ob = "";
  for (i = 0; i < D.OBL.length; i++) { y = D.OBL[i]; var gone = ldBay(y, D.BAYR, 1) > 2 ? k : 0; if (gone > 0.98) continue; x = ldRight(y, k, D) + 4.4;
    ob += '<g opacity="' + f1(1 - gone) + '"><rect class="lm-obl" x="' + f1(x - 4) + '" y="' + f1(y - 6) + '" width="8" height="12" rx="3"/><circle class="lm-obn" cx="' + f1(x + 0.6) + '" cy="' + f1(y) + '" r="2.1"/></g>'; }
  for (i = 0; i < D.OBT.length; i++) { var b = D.OBT[i]; ob += '<g transform="translate(' + b[0] + " " + b[1] + ") rotate(" + b[2] + ')"><rect class="lm-obl" x="-6" y="-4" width="12" height="8" rx="3"/><circle class="lm-obn" cx="0" cy="0.8" r="2.1"/></g>'; }
  o += HOT(hy ? D.INFO.oblH : D.INFO.obl, ob);
  /* osteoclasts in their bays */
  if (k > 0.02) {
    var oc = "";
    for (i = 0; i < D.BAYR.length; i++) oc += ldOcl(ldRight(D.BAYR[i][0], k, D) + 9.5, D.BAYR[i][0], 1);
    for (i = 0; i < D.BAYL.length; i++) oc += ldOcl(ldLeft(D.BAYL[i][0], k, D) - 9.5, D.BAYL[i][0], -1);
    /* RANK ligand: the osteoblast beside each marrow-side bay signals its osteoclast */
    oc += '<path class="lm-rankl" d="M' + f1(ldRight(454, k, D) + 7) + ' 459Q' + f1(ldRight(462, k, D) + 16) + " 463 " + f1(ldRight(478, k, D) + 15) + ' 467.5"/>' +
      '<path class="lm-rankl" d="M216 541.5Q206 546 ' + f1(ldRight(551, k, D) + 18.5) + ' 545"/>';
    o += HOT(D.INFO.ocl, '<g opacity="' + f1(k) + '">' + oc + "</g>");
  }
  /* the vessel: PTH arrives in it; calcium freed from bone leaves in it */
  var lv = S.lv;
  o += HOT(D.INFO.vessel, '<rect class="lm-ves" x="398" y="' + PT + '" width="42" height="' + (PB - PT) + '"/>' + (function () {
    var s = "", n; for (n = 0; n < 6; n++) { var u = ((t ? t / 5200 : 0) + n / 6) % 1, yy = PT - 10 + u * (PB - PT + 20), xx = 419 + ((n * 7) % 5 - 2) * 2.4, a = Math.min(1, (yy - PT + 4) / 14, (PB + 4 - yy) / 14);
      if (a > 0) s += '<g opacity="' + f1(Math.max(0, a)) + '"><ellipse class="lm-rbc" cx="' + f1(xx) + '" cy="' + f1(yy) + '" rx="8.5" ry="4.4"/><ellipse class="lm-rbcc" cx="' + f1(xx) + '" cy="' + f1(yy) + '" rx="4" ry="1.7"/></g>'; }
    return s; })() + ldDots([[412, PT], [412, PB]], lv.ca === "u" ? 9 : lv.ca === "n" ? 5 : 2, 4300, t, "lm-ca", 2.7, 0.1, 1) +
    ldDots([[428, PT], [428, PB]], lv.pth === "u" ? 7 : lv.pth === "n" ? 3 : 1, 4600, t, "lm-pth", 2.5, 0.35, 1) + '<path class="lm-vw" d="M398 ' + PT + "V" + PB + "M440 " + PT + "V" + PB + '"/>');
  /* PTH out of the blood to the osteoblasts; calcium out of the bays into the blood */
  var pn = lv.pth === "u" ? 4 : lv.pth === "n" ? 2 : 0;
  o += ldDots(D.P_PTH1, pn, 3800, t, "lm-pth", 2.5, 0, 1) + ldDots(D.P_PTH2, pn, 4200, t, "lm-pth", 2.5, 0.4, 1);
  if (k > 0.02) o += ldDots(D.P_CA1, 5, 3600, t, "lm-ca", 2.6, 0, k) + ldDots(D.P_CA2, 5, 3400, t, "lm-ca", 2.6, 0.3, k);
  /* the panel's column heads */
  o += T(48, 396, "root", "lm-xs b", "middle") + T(112, 396, "PDL", "lm-xs b", "middle") + T(165, 396, "lamina dura", "lm-xs b" + (hy ? " lm-badt" : ""), "middle") + T(290, 396, "bone and marrow", "lm-xs b", "middle") + T(419, 396, "blood", "lm-xs b", "middle");
  if (k > 0.5) o += HOT(D.INFO.ocl, L(258, 465, "osteoclasts", ldRight(478, k, D) + 17.5, 473, "start", "lm-xs b lm-badt"));
  else o += HOT(D.INFO.obl, L(258, 465, "osteoblasts", ldRight(466, k, D) + 8.5, 466, "start", "lm-xs b"));

  /* ===== the levels and the muscle ===== */
  o += ldChip(8, 586, "PTH", lv.pth, D.INFO.cpth) + ldChip(92, 586, "blood calcium", lv.ca, D.INFO.cca) + ldChip(206, 586, "muscles", lv.mus, lv.mus === "tet" ? D.INFO.tet : lv.mus === "ng" ? D.INFO.musq : D.INFO.mus);
  o += '<circle class="lm-pth" cx="18" cy="632" r="2.5"/>' + T(25, 636, "PTH", "lm-xs mut", "start") + '<circle class="lm-ca" cx="62" cy="632" r="2.6"/>' + T(69, 636, "calcium", "lm-xs mut", "start");
  var tet = h, len = 104 - 22 * tet, thk = 8 + 4.5 * tet, jit = t && tet > 0.5 ? Math.sin(t / 26) * 0.9 + Math.sin(t / 41) * 0.6 : 0, xa = 318, xb = xa + 14 + len, yc = 603 + jit;
  var top = [], bot = [];
  for (i = 0; i <= 16; i++) { x = xa + 8 + (len - 2) * i / 16; var hh = thk * Math.sin(Math.PI * i / 16); top.push([x, yc - hh]); bot.push([x, yc + hh]); }
  var stri = ""; for (i = 2; i <= 14; i += 2) stri += "M" + f1(top[i][0]) + " " + f1(top[i][1] + 1) + "L" + f1(bot[i][0]) + " " + f1(bot[i][1] - 1);
  o += HOT(lv.mus === "tet" ? D.INFO.tet : lv.mus === "ng" ? D.INFO.musq : D.INFO.mus, '<g' + (lv.mus === "ng" ? ' opacity=".45"' : "") + '><rect class="lm-bnb" x="' + (xa - 8) + '" y="589" width="8" height="28" rx="2"/><rect class="lm-bnb" x="' + f1(xb + 8) + '" y="589" width="8" height="28" rx="2"/>' +
    '<path class="lm-tend" d="M' + xa + " " + f1(yc) + "H" + f1(xa + 8) + "M" + f1(xb) + " " + f1(yc) + "H" + f1(xb + 8) + '"/>' +
    '<path class="lm-mus' + (tet > 0.5 ? " is-tet" : "") + '" d="M' + top.map(function (q) { return f1(q[0]) + " " + f1(q[1]); }).join("L") + "L" + bot.slice().reverse().map(function (q) { return f1(q[0]) + " " + f1(q[1]); }).join("L") + 'Z"/>' +
    '<path class="lm-stri" d="' + stri + '"/></g>' + T((xa + xb + 8) / 2, 636, tet > 0.5 ? "locked: won't relax" : lv.mus === "ng" ? "not in the lecture" : "relaxes normally", "lm-xs" + (tet > 0.5 ? " lm-badt" : " mut"), "middle"));
  return o;
}
/* an osteoclast: a big multinucleated cell in its bay, ruffled border against the bone (side 1: bone to its left) */
function ldOcl(cx, cy, side) {
  var o = '<ellipse class="lm-ocl" cx="' + f1(cx) + '" cy="' + cy + '" rx="10.5" ry="13"/>', z = "", j;
  for (j = -4; j <= 4; j++) z += (j === -4 ? "M" : "L") + f1(cx - side * (8.4 - (j % 2 ? 1.6 : 0)) * Math.sqrt(1 - Math.pow(j * 2.2 / 13, 2))) + " " + f1(cy + j * 2.2);
  o += '<path class="lm-ruf" d="' + z + '"/>';
  [[1.5, -6.5], [4, -1], [1, 4.5], [4.5, 8]].forEach(function (n) { o += '<circle class="lm-ocn" cx="' + f1(cx + side * n[0]) + '" cy="' + f1(cy + n[1]) + '" r="2.4"/>'; });
  return o;
}

function ldSay(st, D) { var S = D.ST[st.s]; return [S.say, S.ro]; }

const ST = {
  normal: { lv: { pth: "n", ca: "n", mus: "n" }, ro: "normal · white line intact",
    say: "Normal film: a thin white line, the lamina dura, outlines each socket. It is the harder, denser bone the periodontal ligament attaches to, and the thin dark line between it and the root is the PDL space. PTH, from the four parathyroid glands, keeps blood calcium in range." },
  hyper: { lv: { pth: "u", ca: "u", mus: "ng" }, ro: "hyperpara · lamina dura lost",
    say: "Hyperparathyroidism: too much PTH means too much bone resorption, and at times osteoporosis. Osteoclasts resorb the bone and its calcium goes into the blood. On the film, look for loss of the lamina dura: the white line is gone, and the bone looks diffuse and gray right up to the tooth, with no definite outline. You may also see a brown tumor, a radiolucent (dark) area in the bone below a premolar, and tooth mobility. If you find one, ask the patient about other symptoms and send them to their physician to be checked." },
  hypo: { lv: { pth: "d", ca: "d", mus: "tet" }, ro: "hypopara · calcium ↓ · tetany",
    say: "Hypoparathyroidism: too little PTH means hypocalcemia. Low calcium shows as neuromuscular irritability and tetany, muscles that lock up and don't relax. The lecture gives no radiograph finding for it, so the film is dimmed: it isn't a finding." },
};
const INFO = {
  ld: "The lamina dura: on a normal film, the thin white line that outlines each socket. It is the harder, denser bone the periodontal ligament attaches to, and it runs on over the crest of the bone between the teeth.",
  ldH: "The lamina dura, lost: in hyperparathyroidism the white line around the roots is gone, and the bone looks diffuse and gray right up to the tooth, with no definite outline.",
  pdl: "The PDL space: the thin dark line between the lamina dura and the root, where the periodontal ligament sits.",
  root: "A root in its socket: the PDL space (dark) lies against it, and the lamina dura (white) outside that.",
  tooth: "The teeth: the lower canine (its distal half), both premolars and the first molar (its mesial half), drawn to their real proportions.",
  bone: "The bone around the sockets, with its trabecular pattern: denser trabeculae (light) around marrow spaces (dark).",
  boneH: "Too much PTH means too much bone resorption, and at times osteoporosis: on the film the bone looks diffuse and gray, right up to the tooth.",
  bt: "A brown tumor: in hyperparathyroidism it shows as a radiolucent (dark) area. Dr. Taylor's example, on a panoramic film, sat in the bone below a premolar. If you find one, ask the patient about other symptoms and send them to their physician to be checked.",
  mob: "Tooth mobility: in hyperparathyroidism the teeth can loosen as the bone around them is resorbed. It is a clinical sign, so the film can't show it; it is marked over the crowns.",
  box: "The orange box sits at the second premolar's root wall: the panel below magnifies it.",
  pld: "The lamina dura, magnified: a band of dense bone lining the socket, with the PDL's fibers anchored in it. On the film it is the white line.",
  pldH: "The lamina dura being resorbed: osteoclasts open bays in it from both sides and it thins away, so the film loses its white line.",
  ppdl: "The periodontal ligament: its fibers run from the cementum on the root to the lamina dura. On the film this is the dark PDL space.",
  proot: "The root: dentin, with a thin layer of cementum on its surface that the PDL's fibers attach to.",
  pbone: "Trabecular bone with marrow (fat cells) between the trabeculae.",
  obl: "Osteoblasts line the bone. If a question asks which cell PTH acts on, use Exam 1's mechanism: the PTH receptor is on the osteoblast, which then activates the osteoclasts through RANK ligand. (Dr. Taylor's slide says PTH \"inhibits osteoblasts, stimulates osteoclasts.\")",
  oblH: "Osteoblasts: PTH binds its receptor on them, and they activate the osteoclasts through RANK ligand (the short green dashed lines). Dr. Taylor's slide puts it as \"inhibits osteoblasts, stimulates osteoclasts\": either way, more osteoclast resorption.",
  ocl: "Osteoclasts: big cells with many nuclei that resorb bone in the bays they dig. Too much PTH means too much of this, and the calcium they free goes into the blood. In the jaws that means loss of the lamina dura, brown tumors and tooth mobility.",
  vessel: "Blood: PTH arrives in it from the parathyroid glands, and calcium freed from the bone leaves in it. PTH also has the kidney reabsorb calcium and release calcitriol so the gut absorbs more: the body takes calcium from the bones, keeps what it already has, and absorbs more.",
  cpth: "PTH, from the four parathyroid glands: the fast-acting regulator of blood calcium, under negative feedback.",
  cca: "Blood calcium: PTH raises it; calcitonin, from the thyroid when calcium rises, works the other way.",
  mus: "Muscles: with calcium in range they contract and relax normally.",
  musq: "Muscles: the lecture doesn't give a muscle finding for hyperparathyroidism.",
  tet: "Tetany: low calcium shows as neuromuscular irritability and tetany, muscles that lock up and don't relax.",
};

export default function laminadura() {
  const A = filmArt(), Pn = panelArt();
  const D = Object.assign({}, A, Pn, {
    ST, INFO, ANIM: true, INIT: { s: "normal" }, PT, PB,
    TRABD: TRAB.map((p) => dOf(crs(p, true, 3), true)).join(""),
    BAYL: [[490, 15, 13]], BAYR: [[478, 14, 12], [551, 12, 12]],
    OBL: [410, 454, 466, 478, 490, 502, 546, 556],
    OCY: [[148, 418], [160, 432], [172, 412], [154, 450], [178, 458], [164, 474], [150, 498], [176, 494], [160, 512], [172, 530], [150, 540], [164, 552]],
    P_PTH1: [[398, 452], [330, 458], [250, 459], [196, 456]],
    P_PTH2: [[398, 532], [340, 527], [290, 513], [240, 502], [194, 501]],
    P_CA1: [[190, 478], [270, 488], [320, 516], [398, 521]],
    P_CA2: [[190, 551], [300, 553], [398, 549]],
  });
  return makeFig({
    id: "laminadura", lec: "dental", fig: "Fig 2", short: "The lamina dura", hint: "pick · hover",
    title: "The lamina dura in hyperparathyroidism",
    caption: "A periapical-style film of the lower premolars, with the socket wall magnified below. Pick normal, hyperparathyroidism or hypoparathyroidism to see what PTH does to the white line, the bone and the blood's calcium.",
    W: 460, H: 648,
    label: "A periapical-style radiograph of the lower canine, premolars and first molar: a thin white lamina dura and a thin dark PDL space outline every root. Below it, the socket wall magnified: root, periodontal ligament, lamina dura, bone and marrow and a blood vessel, with PTH reaching the osteoblasts. In hyperparathyroidism osteoclasts resorb the lamina dura, the film loses its white line and shows a radiolucent brown tumor below the second premolar, and calcium rises in the blood; in hypoparathyroidism calcium falls and the muscle locks in tetany.",
    D, render: ldRender, say: ldSay, helpers: [ldDots, ldBay, ldLeft, ldRight, ldCall, ldWord, ldChip, ldOcl],
    controls: `<div class="am-controls" role="group" aria-label="State">${[["normal", "Normal"], ["hyper", "Hyperparathyroidism"], ["hypo", "Hypoparathyroidism"]].map((b) => `<button type="button" class="am-btn" data-amk="s" data-amv="${b[0]}">${b[1]}</button>`).join("")}</div>`,
    sources: [
      "From Lecture A's notes (Dr. Taylor, recording and slides): on a normal film a thin white line outlines the socket, the lamina dura, the harder, denser bone the periodontal ligament attaches to, with the thin dark PDL space between it and the root; in hyperparathyroidism the white line is lost and the bone looks diffuse and gray right up to the tooth; brown tumors (radiolucent; his example sat in the bone below a premolar on a panoramic film) and tooth mobility, and the referral to the physician; too much PTH means too much bone resorption, and at times osteoporosis; PTH's three ways of raising blood calcium; his slide's \"inhibits osteoblasts, stimulates osteoclasts\" and the notes' Exam 1 mechanism (the PTH receptor on the osteoblast, RANK ligand to the osteoclast), both drawn; hypoparathyroidism's hypocalcemia, neuromuscular irritability and tetany.",
      "White SC and Pharoah MJ, Oral Radiology: Principles and Interpretation (normal radiographic anatomy): how the film is drawn. Enamel is the most radiopaque, dentin less, the pulp radiolucent; the PDL space is a thin radiolucent line around the root and the lamina dura a thin radiopaque line outside it, continuous with the crest of the bone between the teeth; the mandible's trabeculae are thick, around larger marrow spaces.",
      "Neville BW, Damm DD, Allen CM and Chi AC, Oral and Maxillofacial Pathology (hyperparathyroidism): the hyperparathyroid film. The lamina dura is lost around the roots, the trabecular pattern turns to an even fine granularity (\"ground glass\"), and the brown tumor is a well-defined, unilocular or multilocular radiolucency, most often in the mandible. The lecture doesn't name the pattern, so only its words are labeled.",
      "Nelson SJ, Wheeler's Dental Anatomy, Physiology and Occlusion: the teeth's proportions (lower premolar crowns about 8 to 8.5 mm long on 14 to 14.5 mm roots, about 7 mm wide at the contacts and 5 mm at the neck; the canine's longer crown and root; the first molar's 11 mm crown on two roots), drawn at 9 drawing units per millimeter.",
      "Guyton and Hall, Textbook of Medical Physiology, and Costanzo, Physiology (PTH and calcium): the panel's mechanism, PTH reaching its receptor on the osteoblasts, which signal the osteoclasts through RANK ligand, and resorbed bone releasing calcium into the blood. They explain tetany by low extracellular calcium making nerve membranes more excitable; the lecture's reason is that muscles need calcium to work, so the figure gives his finding without either reason.",
      "Schematic: the PDL space and the lamina dura are drawn about 0.3 mm thick, thicker than life, so they read on a phone, and the film is a periapical-style crop rather than a true film size. The magnified panel is not to scale, its cells are enlarged, and the dots only show more or less. Tooth mobility is a clinical sign, marked over the crowns. The lecture gives no film finding for hypoparathyroidism (outside sources describe dental changes when it starts in childhood, which it doesn't teach), so its film is dimmed rather than drawn as a finding. Educational, not medical advice.",
    ],
    css: `
.anima[data-anima="laminadura"] .am-svg{max-width:500px}
.anima .laminadura-svg{--lm-f0:#141414;--lm-f1:#202020;--lm-st:#2a2a2a;--lm-bone:#6b6b6b;--lm-mar:#505050;--lm-gl1:#747474;--lm-gl2:#606060;--lm-ldw:#d6d6d6;--lm-pdlc:#262626;
  --lm-den:#b4b4b4;--lm-ena:#f0f0f0;--lm-pulp:#4a4a4a;--lm-bt:#2c2c2c;--lm-btr:#4b4b4b;--lm-ink:#f2f2f2}
.anima .laminadura-svg .t.lm-xs{font-size:11.5px}
.anima .laminadura-svg .t.lm-badt{fill:var(--bx-inhib);font-weight:600}
.anima .laminadura-svg .lm-film{fill:var(--lm-st)}
.anima .laminadura-svg .lm-air{fill:var(--lm-f1)}
.anima .laminadura-svg .lm-bone{fill:var(--lm-bone)}
.anima .laminadura-svg .lm-marrow{fill:var(--lm-mar)}
.anima .laminadura-svg .lm-gl-l{fill:none;stroke:var(--lm-gl1);stroke-width:1.4;stroke-dasharray:1.3 3.1 1.2 4.4}
.anima .laminadura-svg .lm-gl-d{fill:none;stroke:var(--lm-gl2);stroke-width:1.4;stroke-dasharray:1.2 3.7 1.4 2.9;stroke-dashoffset:2}
.anima .laminadura-svg .lm-ld{fill:none;stroke:var(--lm-ldw);stroke-width:10.8;stroke-linejoin:round}
.anima .laminadura-svg .lm-crest{fill:none;stroke:var(--lm-ldw);stroke-width:3;stroke-linecap:round}
.anima .laminadura-svg .lm-pdl{fill:none;stroke:var(--lm-pdlc);stroke-width:5.2;stroke-linejoin:round}
.anima .laminadura-svg .lm-dentin{fill:var(--lm-den)}
.anima .laminadura-svg .lm-enamel{fill:var(--lm-ena)}
.anima .laminadura-svg .lm-pulp{fill:var(--lm-pulp)}
.anima .laminadura-svg .lm-bt{fill:var(--lm-bt)}
.anima .laminadura-svg .lm-bt-rim{fill:var(--lm-btr)}
.anima .laminadura-svg .lm-bt-sep{fill:none;stroke:var(--lm-btr);stroke-width:1.6;stroke-linecap:round}
.anima .laminadura-svg .lm-hit{fill:none;stroke:transparent;stroke-width:9;pointer-events:stroke}
.anima .laminadura-svg .lm-hit-f{fill:transparent;stroke:none}
.anima .laminadura-svg .lm-box{fill:none;stroke:var(--bx-hot);stroke-width:1.6}
.anima .laminadura-svg .lm-mob{fill:none;stroke:var(--bx-hot);stroke-width:2.2}
.anima .laminadura-svg .lm-mobh{fill:var(--bx-hot)}
.anima .laminadura-svg .lm-veil{fill:var(--surface);pointer-events:none}
.anima .laminadura-svg .lm-stamp{fill:var(--surface);stroke:var(--anatomy-mid);stroke-width:1.2;pointer-events:none}
.anima .laminadura-svg .t.lm-stampt{fill:var(--anatomy-strong);font-weight:600;pointer-events:none}
.anima .laminadura-svg .lm-mask{fill:var(--surface)}
.anima .laminadura-svg .lm-edge{fill:none;stroke:var(--anatomy-lo);stroke-width:1.2}
.anima .laminadura-svg .lm-lin-u{fill:none;stroke:var(--lm-f0);stroke-width:2.6;stroke-linecap:round}
.anima .laminadura-svg .lm-lin{fill:none;stroke:var(--lm-ink);stroke-width:.9}
.anima .laminadura-svg .lm-pin{fill:var(--bx-hot);stroke:var(--lm-f0);stroke-width:1}
.anima .laminadura-svg .lm-panel{fill:var(--anatomy-face);stroke:var(--anatomy-lo);stroke-width:1}
.anima .laminadura-svg .lm-dent{fill:color-mix(in srgb,var(--bx-eosin) 45%,var(--bx-matrix))}
.anima .laminadura-svg .lm-tub{fill:none;stroke:var(--bx-cyto-line);stroke-width:.6;opacity:.5}
.anima .laminadura-svg .lm-cem{fill:color-mix(in srgb,var(--bx-eosin) 70%,var(--bx-memb))}
.anima .laminadura-svg .lm-pdlz{fill:var(--bx-matrix)}
.anima .laminadura-svg .lm-mrw{fill:color-mix(in srgb,var(--bx-fat) 70%,var(--bx-cyto))}
.anima .laminadura-svg .lm-ct{fill:var(--bx-matrix)}
.anima .laminadura-svg .lm-fat{fill:var(--bx-fat);stroke:var(--bx-fat-line);stroke-width:1}
.anima .laminadura-svg .lm-mcell{fill:none;stroke:var(--bx-nuc);stroke-width:3;stroke-linecap:round;opacity:.6}
.anima .laminadura-svg .lm-trab{fill:var(--bx-eosin);stroke:var(--bx-cyto-line);stroke-width:1}
.anima .laminadura-svg .lm-band{fill:color-mix(in srgb,var(--bx-eosin) 80%,var(--bx-memb));stroke:var(--bx-memb);stroke-width:1.2}
.anima .laminadura-svg .lm-lam{fill:none;stroke:var(--bx-cyto-line);stroke-width:.7;opacity:.7}
.anima .laminadura-svg .lm-ocy{fill:var(--bx-nuc-line)}
.anima .laminadura-svg .lm-fib{fill:none;stroke:var(--bx-cyto-line);stroke-width:1.1;opacity:.8}
.anima .laminadura-svg .lm-fnu{fill:var(--bx-nuc)}
.anima .laminadura-svg .lm-obl{fill:var(--bx-cyto);stroke:var(--bx-cyto-line);stroke-width:.9}
.anima .laminadura-svg .lm-obn,.anima .laminadura-svg .lm-ocn{fill:var(--bx-nuc)}
.anima .laminadura-svg .lm-ocl{fill:color-mix(in srgb,var(--bx-violet-soft) 55%,var(--bx-cyto));stroke:var(--bx-violet);stroke-width:1.4}
.anima .laminadura-svg .lm-ruf{fill:none;stroke:var(--bx-violet);stroke-width:1.1;stroke-linejoin:round}
.anima .laminadura-svg .lm-rankl{fill:none;stroke:var(--bx-stim);stroke-width:1.5;stroke-dasharray:3 2}
.anima .laminadura-svg .lm-ves{fill:var(--bx-blood-soft)}
.anima .laminadura-svg .lm-vw{fill:none;stroke:var(--bx-blood);stroke-width:1.6}
.anima .laminadura-svg .lm-rbc{fill:var(--bx-blood);opacity:.8}
.anima .laminadura-svg .lm-rbcc{fill:var(--bx-blood-soft);opacity:.6}
.anima .laminadura-svg .lm-ca{fill:var(--bx-gold);stroke:var(--anatomy-hi);stroke-width:.6}
.anima .laminadura-svg .lm-pth{fill:var(--bx-violet);stroke:var(--surface);stroke-width:.6}
.anima .laminadura-svg .lm-chip{fill:var(--surface);stroke:var(--anatomy-lo);stroke-width:1.1}
.anima .laminadura-svg .lm-chip.lm-up{stroke:var(--bx-hot);stroke-width:1.6;fill:var(--bx-hot-soft)}
.anima .laminadura-svg .lm-chip.lm-dn{stroke:var(--bx-blue);stroke-width:1.6;fill:var(--bx-blue-soft)}
.anima .laminadura-svg .lm-chip.lm-q{stroke-dasharray:3 3}
.anima .laminadura-svg .t.lm-lv{font-weight:700}
.anima .laminadura-svg .t.lm-lv.lm-up{fill:var(--bx-hot)}
.anima .laminadura-svg .t.lm-lv.lm-dn{fill:var(--bx-blue)}
.anima .laminadura-svg .t.lm-lv.lm-eq{fill:var(--anatomy-strong)}
.anima .laminadura-svg .t.lm-lv.lm-q{fill:var(--anatomy-muted);font-weight:500}
.anima .laminadura-svg .lm-bnb{fill:var(--anatomy-shade-1);stroke:var(--anatomy-mid);stroke-width:1}
.anima .laminadura-svg .lm-tend{fill:none;stroke:var(--anatomy-mid);stroke-width:3;stroke-linecap:butt}
.anima .laminadura-svg .lm-mus{fill:color-mix(in srgb,var(--bx-blood) 35%,var(--bx-eosin));stroke:var(--bx-memb);stroke-width:1.2}
.anima .laminadura-svg .lm-mus.is-tet{fill:color-mix(in srgb,var(--bx-blood) 60%,var(--bx-eosin));stroke:var(--bx-inhib);stroke-width:1.6}
.anima .laminadura-svg .lm-stri{fill:none;stroke:var(--bx-memb);stroke-width:.8;opacity:.6}
`,
  });
}
