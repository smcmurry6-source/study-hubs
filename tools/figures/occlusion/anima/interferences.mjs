// Fig: working and non-working interferences (Occlusion L1, eccentric movements and contacts).
// Tab 1: the right first molars cut front to back (frontal section through the mesial cusps, buccal on the left), with
// the inclines numbered as in the static `inclines` figure and the help sheet. A slider moves the lower molar toward the
// cheek (a right move: the right side is working) or toward the tongue (a left move: the right side is non-working).
// Tab 2: the same molars from the cheek side (sagittal, mesial at the left) in a protrusive move.
// The teeth are built here in millimeters (x toward the tongue or distal, y down) and scaled once; each incline is a
// straight stretch of the crown's own outline, and its colored line is drawn on that stretch, just inside the tooth.
// One model drives both tabs: the lower tooth slides by dx and drops just far enough not to pass through the upper
// tooth (ixRide, from the two crowns' facing profiles, sampled from the same outlines). Contacts are where the model has
// the crowns touching. The geometry is schematic but chosen so the help sheet's pairs are the ones that meet: the
// working pairs (5 with 4, 2 with 6) slide on parallel slopes, so both touch through a right move; the non-working
// pair (1 with 3) are parallel B-contact inclines; in the side view the maxillary distal and mandibular mesial inclines
// are parallel. Distances are schematic; the figure shows which inclines face each other, not how far a jaw moves.
import { figureSvg, plateHtml, f1, smooth } from "./shared.mjs";

const K = 18, KS = 17; /* drawing units per millimeter: front view, side view */
const rad = (d) => d * Math.PI / 180;
const add = (a, b) => [a[0] + b[0], a[1] + b[1]], sub = (a, b) => [a[0] - b[0], a[1] - b[1]], mul = (a, k) => [a[0] * k, a[1] * k];
const len = (a) => Math.hypot(a[0], a[1]), unit = (a) => mul(a, 1 / len(a));
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/* a rounded corner at V between the stretch from A and the stretch to B: the tangent points and the arc between them */
function corner(A, V, B, r) {
  const u1 = unit(sub(A, V)), u2 = unit(sub(B, V)), half = Math.acos(Math.max(-1, Math.min(1, u1[0] * u2[0] + u1[1] * u2[1]))) / 2;
  const t = r / Math.tan(half), T1 = add(V, mul(u1, t)), T2 = add(V, mul(u2, t)), bis = unit(add(u1, u2)), C = add(V, mul(bis, r / Math.sin(half)));
  const a1 = Math.atan2(T1[1] - C[1], T1[0] - C[0]), a2 = Math.atan2(T2[1] - C[1], T2[0] - C[0]);
  let da = a2 - a1; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
  const arc = []; for (let i = 0; i <= 6; i++) { const a = a1 + da * i / 6; arc.push([C[0] + r * Math.cos(a), C[1] + r * Math.sin(a)]); }
  return { T1, T2, arc };
}
/* an outline from a spec: plain points are smooth knots; {v, r} is a vertex rounded with radius r (a cusp tip or a fossa);
   the stretch between two consecutive vertices is kept straight (densified so the spline can't bow it) */
function build(spec) {
  const n = spec.length, P = (i) => { const s = spec[(i + n) % n]; return s.v || s; };
  const pts = [], tips = {};
  spec.forEach((s, i) => {
    if (!s.v) { pts.push(s); return; }
    const c = corner(P(i - 1), s.v, P(i + 1), s.r); tips[s.id] = c;
    pts.push(...c.arc);
    const nx = spec[(i + 1) % n];
    if (nx.v) { const c2 = corner(s.v, nx.v, P(i + 2), nx.r); for (let k = 1; k < 6; k++) pts.push(lerp(c.T2, c2.T1, k / 6)); }
  });
  return { pts, tips };
}
/* Catmull-Rom (the curve smooth() draws), sampled */
function sample(pts, per) {
  const N = pts.length, out = [];
  for (let i = 0; i < N; i++) {
    const p0 = pts[(i - 1 + N) % N], p1 = pts[i], p2 = pts[(i + 1) % N], p3 = pts[(i + 2) % N];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    const m = Math.max(2, Math.ceil(len(sub(p2, p1)) * per));
    for (let k = 0; k < m; k++) { const t = k / m, s = 1 - t;
      out.push([s * s * s * p1[0] + 3 * s * s * t * c1[0] + 3 * s * t * t * c2[0] + t * t * t * p2[0], s * s * s * p1[1] + 3 * s * s * t * c1[1] + 3 * s * t * t * c2[1] + t * t * t * p2[1]]); }
  }
  return out;
}
/* per drawing-unit column, the lowest point of the upper crown (bottom) or the highest of the lower crown, from the
   outline itself (the roots run off the frame, so they never win) */
function profile(px, bottom) {
  const m = {};
  const pts = sample(px, 3); pts.push(pts[0]);
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1], steps = Math.max(1, Math.ceil(Math.abs(bx - ax) * 2));
    for (let k = 0; k <= steps; k++) { const x = ax + (bx - ax) * k / steps, y = ay + (by - ay) * k / steps, c = Math.round(x);
      if (m[c] === undefined || (bottom ? y > m[c] : y < m[c])) m[c] = y; }
  }
  const ks = Object.keys(m).map(Number), x0 = Math.min(...ks), x1 = Math.max(...ks), v = [];
  for (let x = x0; x <= x1; x++) v.push(m[x] === undefined ? null : f1(m[x]));
  return { x0, v };
}
const toPx = (O) => (p) => [O[0] + p[0] * K, O[1] + p[1] * K];

/* ---------- tab 1: frontal section through the mesial cusps of #3 and #30 (mm; x toward the tongue, y down) ---------- */
const tw = Math.tan(rad(36)), tn = Math.tan(rad(32)), st = rad(52);
const Fu = [0, 0], Bu = [-3.0, 3.0 * tw], Pu = [3.0, 3.0 * tn];                 /* upper: central fossa, buccal and palatal cusp tips */
const E2 = add(Pu, mul([Math.cos(st), -Math.sin(st)], 2.5));                   /* end of incline 2 (lingual incline of the palatal cusp) */
const GAP = 0.5 / K;                                                           /* MIP clearance on the B-contact inclines (1 and 3) */
const Bl = [0, GAP], Fl = add(Pu, [0, GAP]), Ll = add(Fl, [2.6, -2.6 * tw]);   /* lower: buccal cusp tip, central fossa, lingual cusp tip */
const E4 = add(Bl, mul([-Math.cos(st), Math.sin(st)], 2.3));                   /* end of incline 4 (facial incline of the buccal cusp) */
const UPPER = build([
  [-2.85, -10.6], [-3.25, -8.4], [-3.6, -6.2], [-3.8, -4.6], [-4.15, -3.4], [-4.3, -2.0], [-4.12, -0.6], [-3.78, 0.85], [-3.42, 1.72],
  { v: Bu, r: 0.36, id: "Bu" }, { v: Fu, r: 0.12, id: "Fu" }, { v: Pu, r: 0.55, id: "Pu" }, { v: E2, r: 0.4, id: "E2" },
  [5.2, -0.9], [5.8, -1.8], [6.15, -2.8], [6.2, -3.6], [6.0, -4.4], [5.75, -5.6], [5.85, -7.6], [6.15, -10.6],
  [3.7, -10.6], [3.3, -9.0], [2.5, -8.3], [1.3, -8.05], [0.2, -8.45], [-0.55, -9.3], [-0.85, -10.6],
]);
const LOWER = build([
  [-2.95, 7.6], [-3.22, 6.3], [-3.12, 4.9], [-2.75, 3.6], [-2.2, 2.65],
  { v: E4, r: 0.4, id: "E4" }, { v: Bl, r: 0.55, id: "Bl" }, { v: Fl, r: 0.12, id: "Fl" }, { v: Ll, r: 0.28, id: "Ll" },
  [5.95, 0.8], [6.28, 1.95], [6.45, 3.3], [6.35, 4.9], [6.05, 6.3], [5.75, 7.1], [5.55, 8.6], [5.15, 10.3], [4.75, 11.8],
  [-1.5, 11.8], [-2.1, 10.3], [-2.6, 8.7],
]);
const FO = [170, 158], FX = toPx(FO);
/* each incline: [tooth, from-tip-tangent, to-fossa], the side its tooth is on (up = the upper crown is above it) */
const FR_INCL = {
  max: { 5: [UPPER.tips.Bu.T2, UPPER.tips.Fu.T1], 1: [UPPER.tips.Fu.T2, UPPER.tips.Pu.T1], 2: [UPPER.tips.Pu.T2, UPPER.tips.E2.T1] },
  mand: { 4: [LOWER.tips.E4.T2, LOWER.tips.Bl.T1], 3: [LOWER.tips.Bl.T2, LOWER.tips.Fl.T1], 6: [LOWER.tips.Fl.T2, LOWER.tips.Ll.T1] },
};

/* ---------- tab 2: the molars from the cheek side, mesial at the left (mm; x distal, y down) ---------- */
const PER = 4.6, td = Math.tan(rad(30)), tm = Math.tan(rad(44));
const xt = PER * td / (tm + td), yt = xt * tm;                                  /* upper cusp tip from the valley mesial of it */
const V0 = [0, 0], V1 = [PER, 0], V2 = [2 * PER, 0], MBu = [xt, yt], DBu = [PER + xt, yt];
const SG = 0.5 / KS;
const MBl = [0, SG], DBl = [PER, SG], Dl = [2 * PER, SG], G1 = [xt, yt + SG], G2 = [PER + xt, yt + SG];
const SUP = build([
  [1.3, -11.2], [0.95, -9.4], [0.65, -7.2], [0.5, -5.0], [-0.2, -3.2], [-0.42, -1.4], [-0.32, -0.6],
  { v: V0, r: 0.3, id: "V0" }, { v: MBu, r: 0.4, id: "MB" }, { v: V1, r: 0.15, id: "V1" }, { v: DBu, r: 0.4, id: "DB" }, { v: V2, r: 0.3, id: "V2" },
  [9.6, -0.7], [9.75, -1.7], [9.45, -3.5], [8.7, -5.0], [8.55, -6.8], [8.75, -9.0], [9.0, -11.2],
  [6.7, -11.2], [6.25, -9.6], [5.6, -8.7], [4.6, -8.35], [3.5, -8.75], [3.0, -9.6], [3.0, -11.2],
]);
const SLO = build([
  [-0.2, 7.3], [-0.75, 5.5], [-1.15, 3.4], [-1.3, 1.65], [-0.9, 0.8],
  { v: MBl, r: 0.4, id: "MB" }, { v: G1, r: 0.15, id: "G1" }, { v: DBl, r: 0.4, id: "DB" }, { v: G2, r: 0.15, id: "G2" }, { v: Dl, r: 0.4, id: "D" },
  [10.05, 0.85], [10.45, 1.9], [10.25, 3.6], [9.75, 5.6], [9.2, 7.3], [9.05, 8.9], [9.15, 11.6],
  [6.9, 11.6], [6.6, 10.6], [5.6, 10.0], [4.4, 9.85], [3.3, 10.3], [2.8, 11.6], [0.3, 11.6], [0.05, 8.9],
]);
const SO = [112, 162], SX = (p) => [SO[0] + p[0] * KS, SO[1] + p[1] * KS];
const SA_INCL = {
  max: { mbd: [SUP.tips.MB.T2, SUP.tips.V1.T1], dbd: [SUP.tips.DB.T2, SUP.tips.V2.T1] },
  mand: { dbm: [SLO.tips.G1.T2, SLO.tips.DB.T1], dm: [SLO.tips.G2.T2, SLO.tips.D.T1] },
};

const D = {
  fr: { up: profile(UPPER.pts.map(FX), true), lo: profile(LOWER.pts.map(FX), false), max: 22, tol: 1.2, lift: 0.75,
    arrow: [FX([1.6, 5.0])[0], FX([1.6, 5.0])[1]], pairs: { work: [[2, 6], [4, 5]], non: [[1, 3]] } },
  sa: { up: profile(SUP.pts.map(SX), true), lo: profile(SLO.pts.map(SX), false), max: 16, tol: 1.2, lift: 0.75,
    arrow: [SX([4.6, 5.6])[0], SX([4.6, 5.6])[1]], pairs: { pro: [["mbd", "dbm"], ["dbd", "dm"]] } },
};
/* the smallest vertical gap between the crowns at a sideways shift sh (drawing units) */
function ixGap(V, sh) {
  var up = V.up, lo = V.lo, m = Infinity;
  for (var j = 0; j < up.v.length; j++) { var u = up.v[j], k = Math.round(up.x0 + j - sh) - lo.x0, l = k >= 0 ? lo.v[k] : null; if (u == null || l == null) continue; if (l - u < m) m = l - u; }
  return m;
}
/* where the lower tooth sits when slid by dx: dy (down, from MIP) and the contact spots (touching columns, grouped) */
function ixRide(view, dx, guided, D) {
  var V = D[view], up = V.up, lo = V.lo, best = D.ixGap(V, dx), g0 = V.g0, cols = [];
  var ride = Math.max(0, g0 - best), lift = guided ? 4 + Math.abs(dx) * V.lift : 0, dy = ride + lift;
  if (!guided && Math.abs(dx) > 1.5) for (var j = 0; j < up.v.length; j++) { var u = up.v[j], k = Math.round(up.x0 + j - dx) - lo.x0, l = k >= 0 ? lo.v[k] : null; if (u == null || l == null) continue; if (l - u - best < V.tol) cols.push([up.x0 + j, (u + l + dy) / 2]); }
  var spots = [], run = [];
  cols.forEach(function (c, n) { if (run.length && c[0] - run[run.length - 1][0] > 2) { spots.push(run); run = []; } run.push(c); if (n === cols.length - 1) spots.push(run); });
  return { dy: dy, spots: spots.map(function (r) { var c = r[Math.floor(r.length / 2)]; return [c[0], c[1]]; }) };
}
D.fr.g0 = f1(ixGap(D.fr, 0)); D.sa.g0 = f1(ixGap(D.sa, 0));

/* ---------- drawing ---------- */
const dPath = (pts) => smooth(pts, true);
/* an incline's colored line: the straight stretch of the outline, moved just inside its tooth */
function inclineSeg(a, b, X, inUp) {
  const A = X(a), B = X(b), d = unit(sub(B, A)); let n = [-d[1], d[0]]; if ((n[1] < 0) !== inUp) n = mul(n, -1);
  const o = mul(n, 3), s = mul(d, 2.5);
  return [add(add(A, o), s), add(sub(B, s), o), n];
}
const T = (x, y, t, cls = "ix-t", anchor = "") => `<text class="${cls}" x="${f1(x)}" y="${f1(y)}"${anchor ? ` text-anchor="${anchor}"` : ""}>${t}</text>`;
const pin = (p, t) => `<g class="ix-pin" data-i="${t}"><circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="10"/><text x="${f1(p[0])}" y="${f1(p[1] + 4)}" text-anchor="middle">${t}</text></g>`;
function inclines(set, X, inUp, pinOff) {
  let s = "", pins = "";
  Object.entries(set).forEach(([k, [a, b]]) => {
    const [A, B, n] = inclineSeg(a, b, X, inUp);
    s += `<path class="fg-incl ${inUp ? "max" : "mand"} ix-inc" data-i="${k}" d="M${f1(A[0])} ${f1(A[1])}L${f1(B[0])} ${f1(B[1])}"/>`;
    if (pinOff) { const m = lerp(A, B, 0.5); pins += pin(add(m, mul(n, pinOff)), k); }
  });
  return [s, pins];
}
const label2 = (p, a, b) => `<text class="ix-in" x="${f1(p[0])}" y="${f1(p[1])}" text-anchor="middle"><tspan x="${f1(p[0])}">${a}</tspan><tspan x="${f1(p[0])}" dy="11">${b}</tspan></text>`;

const [frMaxL, frMaxP] = inclines(FR_INCL.max, FX, true, 17);
const [frManL, frManP] = inclines(FR_INCL.mand, FX, false, 17);
const frBody = [
  `<path class="od-sec" d="${dPath(UPPER.pts.map(FX))}"/><path class="od-cej" d="M${FX([-3.8, -4.6]).map(f1).join(" ")}Q${FX([1.1, -3.7]).map(f1).join(" ")} ${FX([6.0, -4.4]).map(f1).join(" ")}"/>`,
  label2(FX([-2.55, -2.4]), "buccal", "cusp"), label2(FX([3.7, -2.4]), "palatal", "cusp"), frMaxL,
  `<g class="ix-low"><path class="od-sec low" d="${dPath(LOWER.pts.map(FX))}"/><path class="od-cej" d="M${FX([-2.95, 7.6]).map(f1).join(" ")}Q${FX([1.4, 8.3]).map(f1).join(" ")} ${FX([5.75, 7.1]).map(f1).join(" ")}"/>`,
  label2(FX([-1.25, 3.55]), "buccal", "cusp"), label2(FX([4.75, 3.55]), "lingual", "cusp"), frManL, frManP, `<path class="ix-dir" d="M0 0"/></g>`,
  frMaxP, `<g class="ix-sparks"></g>`,
  T(376, 24, "Maxillary #3", "ix-t sm", "end") + T(4, 318, "Mandibular", "ix-t sm") + T(4, 332, "#30", "ix-t sm"),
  T(4, 150, "BUCCAL", "ix-t sm") + T(4, 164, "(cheek)", "ix-t sm") + T(376, 150, "LINGUAL", "ix-t sm", "end") + T(376, 164, "(tongue)", "ix-t sm", "end"),
].join("");
const frSvg = figureSvg({ width: 380, height: 348, className: "ix-svg ix-fr",
  label: "Frontal section through the mesial cusps of the right first molars, #3 above and #30 below, buccal on the left, with their roots running off the top and bottom. Upper inclines 1, 2 and 5 are blue; lower inclines 3, 4 and 6 are red. A slider moves the lower molar toward the cheek or the tongue and lights the inclines that can collide.",
  body: frBody });

const [saMaxL] = inclines(SA_INCL.max, SX, true, 0);
const [saManL] = inclines(SA_INCL.mand, SX, false, 0);
const inT = (p, t) => `<text class="ix-in" x="${f1(p[0])}" y="${f1(p[1])}" text-anchor="middle">${t}</text>`;
const saBody = [
  `<path class="od-sec" d="${dPath(SUP.pts.map(SX))}"/><path class="od-cej" d="M${SX([0.5, -5.0]).map(f1).join(" ")}Q${SX([4.6, -4.1]).map(f1).join(" ")} ${SX([8.7, -5.0]).map(f1).join(" ")}"/>`,
  inT(SX([xt, -1.1]), "MB"), inT(SX([PER + xt, -1.1]), "DB"), saMaxL,
  `<g class="ix-low"><path class="od-sec low" d="${dPath(SLO.pts.map(SX))}"/><path class="od-cej" d="M${SX([-0.2, 7.3]).map(f1).join(" ")}Q${SX([4.5, 8.2]).map(f1).join(" ")} ${SX([9.2, 7.3]).map(f1).join(" ")}"/>`,
  inT(SX([0.15, 2.9]), "MB"), inT(SX([PER, 2.9]), "DB"), inT(SX([2 * PER - 0.1, 2.9]), "D"), saManL, `<path class="ix-dir" d="M0 0"/></g>`,
  `<g class="ix-sparks"></g>`,
  T(376, 26, "Maxillary #3", "ix-t sm", "end") + T(376, 40, "MB · DB cusps", "ix-t sm ix-mut", "end") + T(376, 316, "Mandibular #30", "ix-t sm", "end") + T(376, 330, "MB · DB · D cusps", "ix-t sm ix-mut", "end"),
  T(4, 146, "MESIAL", "ix-t sm") + T(4, 160, "(front)", "ix-t sm") + T(376, 146, "DISTAL", "ix-t sm", "end"),
].join("");
const saSvg = figureSvg({ width: 380, height: 348, className: "ix-svg ix-sa",
  label: "The right first molars seen from the cheek side, mesial at the left: #3 above with its mesiobuccal and distobuccal cusps, #30 below with three buccal cusps, in Class I. The distal inclines of the upper cusps are blue and the mesial inclines of the lower cusps red. A slider slides the lower molar forward.",
  body: saBody });

const plate = plateHtml({ fig: "Fig 3", title: "Interferences", hint: "slide the lower molar", readout: "MIP",
  body: `<div class="am-svg ix-box" data-ixv="fr">${frSvg}</div><div class="am-svg ix-box" data-ixv="sa" hidden>${saSvg}</div>` });

const controls = `<div class="am-controls ix-tabs" role="tablist" aria-label="View"><button type="button" class="am-btn" role="tab" data-ixtab="fr" aria-pressed="true" aria-selected="true">Side to side (front view)</button><button type="button" class="am-btn" role="tab" data-ixtab="sa" aria-pressed="false" aria-selected="false">Protrusive (side view)</button></div>
<div class="ix-ctl" data-ixv="fr"><label class="am-slider"><span>cheek</span><input type="range" data-s="fr" min="-100" max="100" step="1" value="0" aria-label="Move the lower molar toward the cheek (right move) or the tongue (left move)"><span>tongue</span></label>
<div class="am-controls"><button type="button" class="am-btn" data-ixgo="-100">Right move (right side working)</button><button type="button" class="am-btn" data-ixgo="0">MIP</button><button type="button" class="am-btn" data-ixgo="100">Left move (right side non-working)</button></div></div>
<div class="ix-ctl" data-ixv="sa" hidden><label class="am-slider"><span>MIP</span><input type="range" data-s="sa" min="0" max="100" step="1" value="0" aria-label="Slide the lower molar forward (protrusive)"><span>forward</span></label>
<div class="am-controls"><button type="button" class="am-btn" data-ixgo="0">MIP</button><button type="button" class="am-btn" data-ixgo="100">Protrude</button></div></div>
<div class="am-controls"><button type="button" class="am-btn ix-guide" aria-pressed="false">Let the guidance lift the teeth apart</button></div>
<div class="am-stats" aria-live="polite"><span><b>Movement</b> <em data-r="move">none: teeth in MIP</em></span><span><b>Inclines that can collide</b> <em data-r="pair">none yet</em></span></div>
<p class="am-summary" aria-live="polite"></p>`;

const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>Drawn from the hub's L1 notes and Dr. Givan's help sheet method: draw the molars in MIP, then move the mandibular tooth in your mind's eye. Right molars, left move (right side non-working): the facial incline of the maxillary palatal cusp (1) meets the lingual incline of the mandibular buccal cusp (3). Right move (working): the lingual incline of the maxillary palatal cusp (2) meets the buccal incline of the mandibular lingual cusp (6), and the facial incline of the mandibular buccal cusp (4) meets the lingual incline of the maxillary buccal cusp (5), an interference if unwanted, group function if wanted. Protrusive: the distal inclines of the maxillary cusps meet the mesial inclines of the mandibular cusps.</li>
<li>The front view is a section through the mesial cusps, numbered like the "Right first molars in MIP" figure; the side view is a Class I view from the cheek (the MB cusp of #3 over the buccal groove of #30), drawn as the cusps line up in a sagittal view. The cusps are straight-sided and evenly spaced, and the slopes are chosen so the help sheet's pairs face each other: in MIP the centric cusps sit in the opposing fossae, resting on inclines 1 and 3. In the model the lower tooth slides and rides down whatever it touches, and a spark marks each place the crowns are touching.</li>
<li>Movements are drawn as a pure slide in one plane, with schematic distances. In the mouth the condyles move too: the non-working condyle comes down the eminence, and canine or anterior guidance and Christensen's phenomenon (the space opening between the back teeth as the condyle drops in protrusion) normally lift the posterior teeth apart. "Let the guidance lift the teeth apart" shows that: no contact, no interference.</li></ul></details>`;

function ixLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var view = "fr", guided = false;
  var tgt = { fr: 0, sa: 0 }, cur = { fr: 0, sa: 0 }, frame = 0, last = 0;
  var svg = { fr: root.querySelector(".ix-fr"), sa: root.querySelector(".ix-sa") };
  var rs = {}; Array.prototype.forEach.call(root.querySelectorAll("[data-r]"), function (e) { rs[e.getAttribute("data-r")] = e; });
  var readout = root.querySelector("[data-readout]"), sum = root.querySelector(".am-summary"), guideBtn = root.querySelector(".ix-guide");
  var NAME = { mbd: "distal incline of the MB cusp of #3", dbd: "distal incline of the DB cusp of #3", dbm: "mesial incline of the DB cusp of #30", dm: "mesial incline of the distal cusp of #30" };
  function f(v) { return Math.round(v * 10) / 10; }
  function kind(v, x) { if (Math.abs(x) < 1.5) return null; return v === "sa" ? "pro" : x < 0 ? "work" : "non"; }
  function dxOf(v, s) { return v === "fr" ? s / 100 * D.fr.max : -s / 100 * D.sa.max; }
  function draw(v) {
    var s = svg[v], x = dxOf(v, cur[v]), R = D.ixRide(v, x, guided, D), k = kind(v, x), lit = {};
    s.querySelector(".ix-low").setAttribute("transform", "translate(" + f(x) + " " + f(R.dy) + ")");
    var pairs = k ? D[v].pairs[k] : [];
    pairs.forEach(function (p) { lit[p[0]] = lit[p[1]] = 1; });
    Array.prototype.forEach.call(s.querySelectorAll("[data-i]"), function (e) { var on = !!lit[e.getAttribute("data-i")]; e.classList.toggle("is-lit", on); e.classList.toggle("is-dim", !!k && !on); });
    var h = "";
    R.spots.forEach(function (p) { h += '<circle class="ix-spark" cx="' + f(p[0]) + '" cy="' + f(p[1]) + '" r="7"/><circle class="ix-spark-c" cx="' + f(p[0]) + '" cy="' + f(p[1]) + '" r="2.6"/>'; });
    s.querySelector(".ix-sparks").innerHTML = h;
    /* direction arrow inside the lower crown */
    var dir = s.querySelector(".ix-dir"), A = D[v].arrow;
    if (k) { var L = 24, sg = x < 0 ? -1 : 1, e = A[0] + sg * L, y = A[1];
      dir.setAttribute("d", "M" + (A[0] - sg * L) + " " + y + "L" + e + " " + y + "M" + e + " " + y + "L" + (e - sg * 8) + " " + (y - 5) + "M" + e + " " + y + "L" + (e - sg * 8) + " " + (y + 5)); }
    else dir.setAttribute("d", "M0 0");
    if (v !== view) return;
    var MOVE = { work: "right move: the right side is working (lower molar toward the cheek)", non: "left move: the right side is non-working (lower molar toward the tongue)", pro: "protrusive: the lower molar slides forward (mesial)" };
    rs.move.textContent = k ? MOVE[k] : "none: teeth in MIP";
    rs.pair.textContent = k ? pairs.map(function (p) { return v === "fr" ? p[0] + " with " + p[1] : NAME[p[0]].replace(" of #3", "") + " (#3) with " + NAME[p[1]].replace(" of #30", "") + " (#30)"; }).join("; ") : "none yet";
    if (readout) readout.textContent = !k ? "MIP" : guided ? "guided apart" : R.spots.length ? (R.spots.length > 1 ? R.spots.length + " contacts" : "1 contact") : "apart";
    var t;
    if (!k) t = v === "fr" ? "The right molars in MIP, cut front to back through the mesial cusps: cheek on the left, tongue on the right. Each centric cusp sits in the opposing fossa. Upper inclines are blue, lower ones red. Slide the lower molar toward the cheek (a right move) or the tongue (a left move) and watch which inclines run into each other." :
      "The same molars from the cheek side, mesial at the left, in Class I. Slide the lower molar forward, as in protrusion, and watch which inclines meet.";
    else if (guided) t = k === "pro" ? "With the incisors guiding and the condyle coming down the eminence, the back teeth separate as the jaw moves forward (Christensen's phenomenon), so the inclines never touch: no protrusive interference." :
      "Canine (or anterior) guidance lifts the back teeth apart, so these inclines never touch. That is the goal: posterior teeth disengaged in every excursion, no interferences.";
    else if (k === "work") t = "Right working move: the lower molar slides toward the cheek. Its lingual cusp's buccal incline (6) runs into the lingual incline of the upper palatal cusp (2), and its buccal cusp's facial incline (4) meets the lingual incline of the upper buccal cusp (5). Wanted, that is group function; unwanted, a working interference.";
    else if (k === "non") t = "Left move, so the right side is non-working: the lower molar slides toward the tongue (the right condyle orbits forward, down and in). The lingual incline of its buccal cusp (3) rides up the facial incline of the upper palatal cusp (1): a non-working (balancing) interference.";
    else t = "Protrusive: the lower molar slides mesially under the upper one, so the MESIAL inclines of the mandibular cusps run into the DISTAL inclines of the maxillary cusps. If the back teeth don't separate, those are the contacts.";
    if (sum.textContent !== t) sum.textContent = t;
  }
  function tick(now) {
    frame = 0; if (!root.isConnected) return;
    var dt = Math.min(.05, (now - (last || now)) / 1000), more = false; last = now;
    ["fr", "sa"].forEach(function (v) { var d = tgt[v] - cur[v]; if (Math.abs(d) < .3) { if (cur[v] !== tgt[v]) { cur[v] = tgt[v]; draw(v); } return; } cur[v] += d * Math.min(1, dt * 7); draw(v); more = true; });
    if (more) frame = requestAnimationFrame(tick);
  }
  function go(v, s, instant) { tgt[v] = s; if (instant || reduce.matches) { cur[v] = s; draw(v); return; } last = 0; if (!frame) frame = requestAnimationFrame(tick); }
  root.querySelectorAll("input[data-s]").forEach(function (inp) { inp.addEventListener("input", function () { go(inp.getAttribute("data-s"), +inp.value, true); }); });
  root.querySelectorAll("[data-ixgo]").forEach(function (b) { b.addEventListener("click", function () { var v = b.closest("[data-ixv]").getAttribute("data-ixv"), s = +b.getAttribute("data-ixgo"); root.querySelector('input[data-s="' + v + '"]').value = s; go(v, s); }); });
  root.querySelectorAll("[data-ixtab]").forEach(function (b) { b.addEventListener("click", function () {
    view = b.getAttribute("data-ixtab");
    root.querySelectorAll("[data-ixtab]").forEach(function (x) { var on = x === b; x.setAttribute("aria-pressed", String(on)); x.setAttribute("aria-selected", String(on)); });
    root.querySelectorAll("[data-ixv]").forEach(function (x) { if (x.classList.contains("ix-box") || x.classList.contains("ix-ctl")) x.hidden = x.getAttribute("data-ixv") !== view; });
    draw(view);
  }); });
  guideBtn.addEventListener("click", function () { guided = !guided; guideBtn.setAttribute("aria-pressed", String(guided)); draw("fr"); draw("sa"); });
  draw("sa"); draw("fr");
}

const CSS = `
.anima .ix-box{max-width:460px;margin:0 auto}
.anima .ix-svg .ix-t{fill:var(--anatomy-text);font:11px var(--anatomy-mono)}
.anima .ix-svg .ix-t.sm{font-size:10.5px}
.anima .ix-svg .ix-mut{fill:var(--anatomy-muted)}
.anima .ix-svg .ix-in{fill:#7a6544;font:9.5px var(--anatomy-mono)}
.anima .ix-svg .od-cej{vector-effect:none}
.anima .ix-inc{transition:opacity .2s,stroke-width .2s}
.anima .ix-inc.is-dim{opacity:.28}
.anima .ix-inc.is-lit{stroke-width:7}
.anima .ix-pin circle{fill:var(--surface);stroke:var(--anatomy-mid);stroke-width:1.2}
.anima .ix-pin text{fill:var(--anatomy-strong);font:600 11px var(--anatomy-mono)}
.anima .ix-pin.is-lit circle{stroke:var(--anatomy-lit);stroke-width:2.4}
.anima .ix-pin.is-dim{opacity:.45}
.anima .ix-spark{fill:#2747a3;opacity:.3}
.anima .ix-spark-c{fill:#1f3b8c}
.anima .ix-dir{fill:none;stroke:#2747a3;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
.anima .ix-tabs .am-btn{white-space:nowrap}
@media (prefers-reduced-motion:reduce){.anima .ix-inc{transition:none}}
`;

export function interferences() {
  return {
    id: "interferences", lec: "review",
    title: "Working and non-working interferences",
    caption: "Slide the lower right molar toward the cheek (a right move) or the tongue (a left move) and the inclines that can collide light up and name themselves; the side view does the same for protrusion.",
    html: `<div class="anima" data-anima="interferences">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: ixLive.toString(),
    helpers: [ixGap, ixRide],
    data: D,
  };
}
