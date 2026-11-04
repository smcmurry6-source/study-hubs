// Fig: where a mounting error shows (Occlusion L6, "Hinge axis and facebow"). Left, a semi-adjustable arcon articulator
// from the side, drawn to scale with a model patient: the condylar elements on the lower member, the fossae (housings,
// condylar guidance set to the patient's 35 degrees) on the upper member, the incisal pin on the upper member resting on
// a flat incisal guide table, mounting plates, mounting stone and both casts in Class I occlusion. The casts sit where
// the facebow puts them, or too far back, too high, too far forward or too low. Both casts move together, because the
// mandibular cast is mounted to the maxillary one with the CR record. Right, the same patient's teeth in the mouth
// protruding, and for each lower posterior tooth how much more (+) or less (-) it separates on the articulator than in
// the mouth after the first millimeter forward. Too far back or too high puts the teeth closer to the hinge axis: the
// back teeth separate less on the articulator, so work built there leans on the front teeth (the slide: premature or
// heavy contacts on the most anterior teeth). Too far forward or too low: they separate more, cusps built there are too
// tall, and the most posterior teeth hit first.
// One model (meModel: a rigid mandible whose condyle slides down a 35-degree guidance while the lower incisor edge
// slides down the upper incisor's 50-degree lingual surface, solved in closed form) drives both panels and the numbers.
// Units are millimeters, y up, the hinge axis (the condylar element's center) at the origin, anterior to the left as in
// hingearc.mjs; the reference plane (axis-orbital, the Slidematic's) is y = 0.
import { figureSvg, plateHtml } from "./shared.mjs";

const r2 = (v) => Math.round(v * 100) / 100;
const P = (pts) => pts.map(([x, y]) => [r2(x), r2(y)]);
/* corner cutting (Chaikin) on a closed outline: a vertex marked [x, y, 1] stays a sharp corner (cusp tips, incisal
   edges, the casts' trimmed corners), every other corner is rounded; the browser then draws plain polygons */
function round(pts, it = 3) {
  let a = pts;
  for (let k = 0; k < it; k++) {
    const out = [], n = a.length;
    for (let i = 0; i < n; i++) {
      const v = a[i], pv = a[(i - 1 + n) % n], nv = a[(i + 1) % n];
      if (v[2]) { out.push(v); continue; }
      out.push([v[0] + (pv[0] - v[0]) * 0.25, v[1] + (pv[1] - v[1]) * 0.25], [v[0] + (nv[0] - v[0]) * 0.25, v[1] + (nv[1] - v[1]) * 0.25]);
    }
    a = out;
  }
  return P(a);
}
const sharp = (p) => [p[0], p[1], 1];
const D2R = Math.PI / 180;

/* ---------- the model patient ---------- */
const SCI = 35, AG = 50, OB = 3, OCC = 8; /* condylar guidance, anterior guidance (deg to the reference plane), overbite (mm), occlusal plane (deg) */
const U0 = [-82, -43]; /* the upper central incisal edge: 82 mm in front of the hinge axis, 43 mm below the reference plane */
const G = [Math.cos(AG * D2R), Math.sin(AG * D2R)]; /* up the upper incisor's lingual surface, from the edge */
const T0 = OB / G[1]; /* how far up that surface the lower incisal edge rests in MIP */
const L = (t) => [U0[0] + t * G[0], U0[1] + t * G[1]];
const I0 = L(T0); /* the lower incisal edge in MIP */
/* the occlusal plane, tilted OCC degrees (lower in front), with a 1.2 mm curve of Spee over the posterior teeth */
const spee = (x) => { const u = (x + 71) / 35; return u > 0 && u < 1 ? -1.2 * Math.sin(Math.PI * u) : 0; };
const occY = (x) => U0[1] + (x - U0[0]) * Math.tan(OCC * D2R) + spee(x);

/* a posterior crown (or canine) in buccal view. tips: cusp-tip x positions; h: crown height; up: an upper tooth (cusps
   point down); ov: how far the tips pass the occlusal plane (upper buccal cusps overlap the lower ones from the cheek) */
function crown(xm, xd, tips, h, up, ov, kind) {
  const s = up ? 1 : -1;
  const ref = (x) => occY(x) - s * ov; /* the tips' line */
  const pt = (x, v, k) => [x, ref(x) + s * v, k ? 1 : 0];
  const can = kind === "C", mol = kind === "M";
  /* v: from the cusp tips toward the cervix. Contacts sit at the junction of the occlusal and middle thirds (higher on
     the canine); the marginal ridges about 1.7-2 mm above the tips, so the cusp ridges slope about 30-40 degrees */
  const vcM = can ? 3.2 : mol ? 2.2 : 2.5, vcD = can ? 4.2 : vcM + 0.2, vmM = can ? 2.4 : mol ? 1.7 : 1.9, vmD = can ? 3.2 : mol ? 1.8 : 2.0;
  const pts = [pt(xm + (mol ? 1.4 : 1.2), h), pt(xm + 0.45, h - 2.2), pt(xm, vcM), pt(xm + 0.45, vmM)];
  tips.forEach((x, i) => {
    if (i) { const g = (tips[i - 1] + x) / 2; pts.push(pt(g - 0.18, 1.45), pt(g, 1.6, 1), pt(g + 0.18, 1.45)); } /* the buccal groove */
    pts.push(pt(x, 0, 1));
  });
  pts.push(pt(xd - 0.45, vmD), pt(xd, vcD), pt(xd - 0.45, h - 2.2), pt(xd - (mol ? 1.4 : 1.2), h), pt((xm + xd) / 2, h + 0.6));
  return round(pts, 2);
}
/* corner cutting on an open line (the gingival scallops), its two ends kept */
function openRound(pts, it = 2) {
  let a = pts;
  for (let k = 0; k < it; k++) {
    const out = [a[0]];
    for (let i = 0; i < a.length - 1; i++) { const p = a[i], q = a[i + 1]; out.push([p[0] * 0.75 + q[0] * 0.25, p[1] * 0.75 + q[1] * 0.25], [p[0] * 0.25 + q[0] * 0.75, p[1] * 0.25 + q[1] * 0.75]); }
    out.push(a[a.length - 1]); a = out;
  }
  return P(a);
}
function teeth() {
  const up = [], lo = [];
  /* upper: lateral incisor (oblique, behind), central in profile (its lingual surface is the anterior guidance) */
  up.push({ n: "I2", pts: round([[-76.9, -32.8], [-77.6, -36.5], [-77.5, -40.6], sharp([-77.0, -42.2]), sharp([-74.6, -42.0]), [-73.7, -40.4], [-73.4, -36.5], [-74.0, -32.7]], 2) });
  up.push({ n: "I1", pts: round([sharp(U0), [-82.3, -42.4], [-82.1, -40], [-81.5, -37.2], [-80.6, -34.6], [-79.7, -32.4], [-76.6, -31.9], [-73.7, -33.2], [-73.5, -34.6], [-74.2, -36.1], sharp(L(7.6)), sharp(L(5)), sharp(L(3)), sharp(L(1.2))], 3) });
  up.push({ n: "C", pts: crown(-74.2, -67.5, [-70.85], 10, true, 1.4, "C") });
  up.push({ n: "PM1", pts: crown(-67.5, -61.2, [-64.35], 8, true, 0.9) });
  up.push({ n: "PM2", pts: crown(-61.2, -55.1, [-58.15], 7.5, true, 0.9) });
  up.push({ n: "M1", pts: crown(-55.1, -45.4, [-52.7, -48.4], 7, true, 0.9, "M") });
  up.push({ n: "M2", pts: crown(-45.4, -36.8, [-42.9, -38.9], 6.5, true, 0.9, "M") });
  /* lower: lateral (behind), central in profile with its edge on the upper lingual surface (3 mm overbite) */
  lo.push({ n: "I2", pts: round([[-76.9, -49.4], [-77.5, -45.5], [-77.4, -41.6], sharp([-77.0, -40.3]), sharp([-74.6, -40.5]), [-73.9, -41.8], [-73.6, -45.5], [-74.1, -49.4]], 2) });
  lo.push({ n: "I1", pts: round([sharp(I0), [-79.75, -40.7], [-79.7, -41.5], [-79.4, -44.5], [-78.6, -47.4], [-77.8, -49.7], [-75.1, -49.9], [-72.4, -49.4], [-72.2, -47.3], [-73.0, -46.2], [-74.6, -44.9], [-76.9, -42.3], sharp([I0[0] + 0.7, I0[1] - 0.12])], 3) });
  lo.push({ n: "C", pts: crown(-77.0, -70.8, [-73.9], 10, false, 1.4, "C") });
  lo.push({ n: "PM1", pts: crown(-70.8, -64.0, [-67.4], 8, false, 0.9) });
  lo.push({ n: "PM2", pts: crown(-64.0, -57.2, [-60.6], 7.5, false, 0.9) });
  lo.push({ n: "M1", pts: crown(-57.2, -46.5, [-54.9, -50.7, -47.6], 7.5, false, 0.9, "M") });
  lo.push({ n: "M2", pts: crown(-46.5, -36.3, [-43.9, -39.0], 7, false, 0.9, "M") });
  /* the lower buccal cusp tips the model follows: canine, premolars, the molars' distobuccal cusps */
  const cusp = (x, ov) => [r2(x), r2(occY(x) + ov)];
  const CUSP = [{ n: "C", p: cusp(-73.9, 1.4) }, { n: "PM1", p: cusp(-67.4, 0.9) }, { n: "PM2", p: cusp(-60.6, 0.9) }, { n: "M1", p: cusp(-50.7, 0.9) }, { n: "M2", p: cusp(-39.0, 0.9) }];
  /* gingival lines, front to back: margins over each crown's cervix, papillae between */
  const gU = [[-80.2, -33.4], [-77.3, -35.0], [-75.6, -33.3], [-74.3, occY(-74.3) + 1.4 + 5.0], [-70.85, occY(-70.85) - 1.4 + 9.3], [-67.5, occY(-67.5) - 0.9 + 3.7], [-64.35, occY(-64.35) - 0.9 + 7.3], [-61.2, occY(-61.2) - 0.9 + 3.7], [-58.15, occY(-58.15) - 0.9 + 6.8], [-55.1, occY(-55.1) - 0.9 + 3.6], [-50.25, occY(-50.25) - 0.9 + 6.4], [-45.4, occY(-45.4) - 0.9 + 3.6], [-41.1, occY(-41.1) - 0.9 + 5.9], [-35.3, occY(-35.3) - 0.9 + 6.2]];
  const gL = [[-78.1, -49.0], [-76.8, -47.6], [-75.6, -48.6], [-73.9, occY(-73.9) + 1.4 - 9.3], [-70.8, occY(-70.8) + 0.9 - 3.9], [-67.4, occY(-67.4) + 0.9 - 7.3], [-64.0, occY(-64.0) + 0.9 - 3.7], [-60.6, occY(-60.6) + 0.9 - 6.8], [-57.2, occY(-57.2) + 0.9 - 3.6], [-51.85, occY(-51.85) + 0.9 - 6.9], [-46.5, occY(-46.5) + 0.9 - 3.6], [-41.4, occY(-41.4) + 0.9 - 6.4], [-34.8, occY(-34.8) + 0.9 - 6.0]];
  return { up, lo, CUSP, gU: openRound(gU), gL: openRound(gL) };
}
const TT = teeth();

/* the casts' bases (stone), each closed along its gingival line: the maxillary cast's top and the mandibular cast's
   bottom are flat, trimmed for mounting */
const CAST_U = round(TT.gU.map((p) => [p[0], p[1], 1]).concat([[-33.8, -27.5], [-32.6, -22], sharp([-33.2, -15]), sharp([-84.5, -15]), [-87.2, -18.5], [-87.4, -25.5], [-84.2, -30.8]]), 2);
const CAST_L = round(TT.gL.map((p) => [p[0], p[1], 1]).concat([[-33.6, -40.3], [-31.6, -45.2], sharp([-32.0, -70]), sharp([-82.0, -70]), [-84.2, -66.5], [-84.0, -57.5], [-81.0, -51.2]]), 2);

/* ---------- the articulator (articulator coordinates: the casts are drawn at their own position plus the error) ---------- */
const E = [-Math.cos(SCI * D2R), -Math.sin(SCI * D2R)]; /* the condylar element's path: forward and down the fossa roof */
const N = [E[1], -E[0]]; /* the roof's normal, up and back toward the housing */
const RB = 4; /* condylar element radius */
const roof = (s) => [s * E[0] + RB * N[0], s * E[1] + RB * N[1]];
const kWall = (RB - roof(0)[0]) / -E[0]; /* where the roof meets the centric stop (x = RB) */
const ART = {
  /* upper member: the beam, the incisal pin's boss, the condylar housing (its inclined roof is the condylar guidance;
     the centric stop behind the element), the upper mounting plate, the incisal pin */
  beam: P([[-127, 23], [5, 23], [11, 19.5], [11, 13], [-125, 13], [-127, 15]]),
  boss: P([[-135, 27], [-123, 27], [-123, 10.5], [-135, 10.5]]),
  housing: P([[RB, -4.5], [RB, roof(-kWall)[1]], roof(13), [roof(13)[0] - 2.5, roof(13)[1]], [roof(13)[0] - 2.5, 13], [11, 13], [11, -4.5]]),
  plateU: P([[-93, 13], [-29, 13], [-29, 8], [-93, 8]]),
  pin: P([[-130.2, 31], [-127.8, 31], [-127.8, -55.8], [-129, -58], [-130.2, -55.8]]),
  /* lower member: the base, the condylar post, the incisal guide table on its column, the lower mounting plate */
  base: P([[-141, -95], [12, -95], [12, -101.5], [9, -105], [-141, -105]]),
  post: P([[-3.2, -3.1], [3.2, -3.1], [3.6, -95], [-3.6, -95]]),
  table: P([[-139, -58], [-120, -58], [-120, -62], [-125.5, -62], [-125.5, -95], [-133.5, -95], [-133.5, -62], [-139, -62]]),
  plateL: P([[-93, -90], [-29, -90], [-29, -95], [-93, -95]]),
  /* where the mounting stone meets each plate, and each cast's trimmed surface */
  stoneU: { plate: [-91, -31, 8], cast: [-84, -33.5, -15] },
  stoneL: { plate: [-91, -31, -90], cast: [-81.6, -32.4, -70] },
};

const D = {
  SCI, AG, OB, U0: P([U0])[0], I0: P([I0])[0],
  UP: TT.up, LO: TT.lo, CUSP: TT.CUSP, GU: TT.gU, GL: TT.gL, CAST_U, CAST_L, ART,
  ROOF: P([roof(-kWall), roof(13)]),
  /* screens: the articulator panel and the mouth panel (px per mm and where x = 0, y = 0 lands) */
  WA: 300, HA: 376, SA: 1.8, AX: 268, AY: 100,
  WM: 300, HM: 376, SM: 5.0, MX: 437, MY: -94, BASE: 284,
  F1: 1, /* mm forward at which the numbers are read */
  DIR: { ok: [0, 0], back: [1, 0], high: [0, 1], fwd: [-1, 0], low: [0, -1] },
  SIDE: { ok: "none", back: "ant", high: "ant", fwd: "post", low: "post" },
  NAME: { ok: "where the facebow puts them", back: "too far back", high: "too high", fwd: "too far forward", low: "too low" },
  KPX: 1.3, /* bar px per micrometer */
};

/* ---------- browser helpers (stringified into the hub; they use only their arguments) ---------- */
/* the protrusion, solved in closed form: the lower incisal edge on the upper lingual surface, the condyle down its
   guidance, the mandible rigid. off: where the casts sit relative to the hinge axis (mm). Returns a pose for a forward
   travel f (mm of the lower incisal edge), and per lower cusp the difference between the articulator and the mouth */
function meModel(off, D) {
  var d2r = Math.PI / 180, e = [-Math.cos(D.SCI * d2r), -Math.sin(D.SCI * d2r)], g = [Math.cos(D.AG * d2r), Math.sin(D.AG * d2r)];
  var t0 = D.OB / g[1];
  function mk(o) {
    var U = [D.U0[0] + o[0], D.U0[1] + o[1]], I0 = [U[0] + t0 * g[0], U[1] + t0 * g[1]], r0 = I0[0] * I0[0] + I0[1] * I0[1], a0 = Math.atan2(I0[1], I0[0]);
    return function (f) {
      var t = t0 - f / g[0], I = [U[0] + t * g[0], U[1] + t * g[1]], ie = I[0] * e[0] + I[1] * e[1];
      var s = ie - Math.sqrt(Math.max(0, ie * ie - (I[0] * I[0] + I[1] * I[1]) + r0));
      var C = [s * e[0], s * e[1]], phi = Math.atan2(I[1] - C[1], I[0] - C[0]) - a0;
      if (phi > Math.PI) phi -= 2 * Math.PI; if (phi < -Math.PI) phi += 2 * Math.PI;
      return { C: C, phi: phi, s: s };
    };
  }
  function tf(p, Q) { var c = Math.cos(Q.phi), s = Math.sin(Q.phi); return [Q.C[0] + p[0] * c - p[1] * s, Q.C[1] + p[0] * s + p[1] * c]; }
  var pm = mk([0, 0]), pa = mk(off), Qm = pm(D.F1), Qa = pa(D.F1);
  var err = D.CUSP.map(function (k) {
    var p = k.p, q = [p[0] + off[0], p[1] + off[1]], m = tf(p, Qm), a = tf(q, Qa);
    return Math.round(((m[1] - p[1]) - (a[1] - q[1])) * 1000); /* um: + = drops more on the articulator */
  });
  return { pm: pm, pa: pa, tf: tf, fE: t0 * g[0], err: err };
}
/* both panels. st: { pos, mm (size of the error), u (0-1: the casts sliding into the wrong place), v (0-1: the protrusion) } */
function meSvg(st, D) {
  var f = function (n) { return Math.round(n * 10) / 10; };
  var dir = D.DIR[st.pos], amt = st.pos === "ok" ? 0 : st.mm, off = [dir[0] * amt * st.u, dir[1] * amt * st.u];
  var M = D.meModel(off, D), fNow = st.v * M.fE, Qa = M.pa(fNow), Qm = M.pm(fNow), full = D.meModel([dir[0] * amt, dir[1] * amt], D);
  function tx(x, y, t, cls, a) { return '<text class="me-t' + (cls ? " " + cls : "") + '" x="' + f(x) + '" y="' + f(y) + '"' + (a ? ' text-anchor="' + a + '"' : "") + ">" + t + "</text>"; }
  function sh(pts, o) { return pts.map(function (p) { return [p[0] + o[0], p[1] + o[1]]; }); }
  function path(pts, S, Q) { return "M" + pts.map(function (p) { var s = S(Q ? M.tf(p, Q) : p); return f(s[0]) + " " + f(s[1]); }).join("L") + "Z"; }
  /* ---- the articulator ---- */
  var SA = D.SA;
  function A(p) { return [D.AX + p[0] * SA, D.AY - p[1] * SA]; }
  function stone(S, o, Q, up) {
    var c = S.cast, p = S.plate, y = c[2] + o[1];
    var pts = up ? [[c[0] + o[0], y], [c[0] + o[0] - 1.2, (y + p[2]) / 2], [p[0], p[2]], [p[1], p[2]], [c[1] + o[0] + 1.6, (y + p[2]) / 2 + 1], [c[1] + o[0], y]]
      : [[c[0] + o[0], y], [c[1] + o[0], y], [c[1] + o[0] + 1.5, (y + p[2]) / 2 - 1], [p[1], p[2]], [p[0], p[2]], [c[0] + o[0] - 1.4, (y + p[2]) / 2]];
    return path(pts, A, Q);
  }
  var a = "", R = D.ART, moved = amt * st.u > 0.05;
  a += tx(12, 18, "on the articulator", "me-head", "start") + tx(12, 33, "← anterior · dashed: facebow position", "me-cap", "start");
  /* lower member (it carries the condylar elements: arcon), moving with the mandibular cast */
  a += '<g class="hot" data-info="Lower member: the base, the condylar posts carrying the condylar elements (arcon: the condyles are on the lower member, as in the patient), the incisal guide table and the mandibular mounting plate."><path class="me-metal" d="' + path(R.base, A, Qa) + '"/><path class="me-metal" d="' + path(R.post, A, Qa) + '"/><path class="me-metal" d="' + path(R.plateL, A, Qa) + '"/></g>';
  a += '<path class="me-metal hot" data-info="Incisal guide table, on the lower member, set flat here: the casts\' own front teeth guide the movement, so the incisal pin lifts off it as the jaw protrudes." d="' + path(R.table, A, Qa) + '"/>';
  a += '<path class="me-stone2 hot" data-info="Mounting stone holding the mandibular cast to the lower mounting plate. The mandibular cast is mounted to the maxillary one with the CR record, so whatever error the maxillary cast has, it has too." d="' + stone(R.stoneL, off, Qa, false) + '"/>';
  a += '<path class="me-cast hot" data-info="Mandibular cast. It follows the maxillary cast: both sit too far back, too high, too far forward or too low together." d="' + path(sh(D.CAST_L, off), A, Qa) + '"/>';
  D.LO.forEach(function (t) { a += '<path class="me-tooth me-lo' + (t.n === "I2" ? " me-behind" : "") + '" d="' + path(sh(t.pts, off), A, Qa) + '"/>'; });
  /* upper member */
  a += '<g class="hot" data-info="Upper member: it carries the fossae (the condylar housings), the maxillary mounting plate and the incisal pin. A facebow transfer mounts the maxillary cast to it in the same relation to the hinge axis as the patient\'s maxilla."><path class="me-metal" d="' + path(R.beam, A) + '"/><path class="me-metal" d="' + path(R.boss, A) + '"/><path class="me-metal" d="' + path(R.plateU, A) + '"/></g>';
  a += '<path class="me-stone2 hot" data-info="Mounting stone holding the maxillary cast to the upper mounting plate, poured with the cast held where the facebow put it. A cast mounted wrong is held in the wrong place by this stone." d="' + stone(R.stoneU, off, null, true) + '"/>';
  a += '<path class="me-cast hot" data-info="Maxillary cast, mounted with the facebow: in the same relation to the articulator\'s hinge axis as the patient\'s maxilla is to theirs." d="' + path(sh(D.CAST_U, off), A) + '"/>';
  D.UP.forEach(function (t) { a += '<path class="me-tooth' + (t.n === "I2" ? " me-behind" : "") + '" d="' + path(sh(t.pts, off), A) + '"/>'; });
  /* the facebow position (dashed), over the casts */
  if (moved) a += '<path class="me-ghost" d="' + path(D.CAST_U, A) + '"/><path class="me-ghost" d="' + path(D.CAST_L, A) + '"/>';
  a += '<path class="me-pin hot" data-info="Incisal pin, on the upper member. In centric it rests on the incisal guide table and holds the vertical dimension the casts were mounted at." d="' + path(R.pin, A) + '"/>';
  a += '<path class="me-metal hot" data-info="Condylar housing (the fossa element), on the upper member. Its roof is the condylar guidance, set here to the patient\'s 35 degrees; the condylar element slides forward and down it in protrusion. Behind the element, the centric stop." d="' + path(R.housing, A) + '"/>';
  var cc = A(Qa.C), ra = A(D.ROOF[0]), rb = A(D.ROOF[1]);
  a += '<path class="me-guide" d="M' + f(ra[0]) + " " + f(ra[1]) + "L" + f(rb[0]) + " " + f(rb[1]) + '"/>';
  a += '<g class="hot" data-info="Condylar element on the lower member. The articulator\'s hinge axis runs through the two elements\' centers; the facebow relates the maxillary cast to it."><circle class="me-ball" cx="' + f(cc[0]) + '" cy="' + f(cc[1]) + '" r="' + f(4 * SA) + '"/><path class="me-cross" d="M' + f(cc[0] - 4) + " " + f(cc[1]) + "h8M" + f(cc[0]) + " " + f(cc[1] - 4) + 'v8"/></g>';
  a += tx(D.AX - 8, D.AY - 50, "hinge axis", "me-lab", "end") + '<path class="me-lead" d="M' + f(D.AX - 6) + " " + f(D.AY - 46) + "L" + f(cc[0] - 1.5) + " " + f(cc[1] - 3.5) + '"/>';
  var r35 = A([-9.5, -8.5]);
  a += tx(r35[0], r35[1], "35°", "me-lab", "end");
  a += tx(A([-123, 0])[0] + 4, D.AY - 24 * SA - 3, "incisal pin", "me-lab", "start");
  /* status */
  var inc = [D.U0[0] + off[0], D.U0[1] + off[1]];
  a += tx(12, 336, moved ? "casts mounted " + D.NAME[st.pos] + ", " + Math.round(amt * st.u) + " mm" : "casts where the facebow puts them", "me-res " + (amt > 0 ? "me-bad" : "me-ok"), "start");
  a += tx(12, 352, "axis to incisal edge: " + Math.round(-inc[0]) + " mm across, " + Math.round(-inc[1]) + " down", "me-cap", "start");
  a += tx(12, 366, moved ? "in the patient: " + Math.round(-D.U0[0]) + " across, " + Math.round(-D.U0[1]) + " down" : "the same as in the patient", "me-cap", "start");
  /* ---- in the mouth ---- */
  var SM = D.SM;
  function Mx(p) { return [D.MX + p[0] * SM, D.MY - p[1] * SM]; }
  function band(line, dy) { var a0 = line[0], b0 = line[line.length - 1]; return line.concat([[b0[0] + 0.4, b0[1] + dy], [a0[0] - 0.4, a0[1] + dy]]); }
  var m = "", side = D.SIDE[st.pos], err = full.err, mx = 0, show = Math.min(1, st.v * 1.6);
  err.forEach(function (v) { mx = Math.max(mx, Math.abs(v)); });
  m += tx(12, 18, "in the mouth: protrusion", "me-head", "start") + tx(12, 33, "the patient's own paths", "me-cap", "start");
  function litFor(n) {
    if (!amt) return 0;
    if (side === "ant") return (n === "I1" || n === "I2") ? Math.min(1, mx / 20) * show : 0;
    var i = ["C", "PM1", "PM2", "M1", "M2"].indexOf(n);
    return i < 0 ? 0 : Math.max(0, Math.min(1, err[i] / 20)) * show;
  }
  function tooth(t, Q, info) { var k = litFor(t.n), d = path(t.pts, Mx, Q); return '<path class="me-tooth hot' + (Q ? " me-lo" : "") + (t.n === "I2" ? " me-behind" : "") + '" data-info="' + info + '" d="' + d + '"/>' + (k > 0.02 ? '<path class="me-lit" style="opacity:' + f(k) + '" d="' + d + '"/>' : ""); }
  D.LO.forEach(function (t) { m += tooth(t, Qm, "Lower teeth, moving with the mandible: the incisal edge slides down the upper central incisor\'s lingual surface (50 degrees here) while the condyles slide down their eminences (35 degrees)."); });
  m += '<path class="me-gum" d="' + path(band(D.GL, -3.5), Mx, Qm) + '"/>';
  D.UP.forEach(function (t) { m += tooth(t, null, "Upper teeth, fixed to the skull. Their buccal cusps overlap the lower buccal cusps from the cheek side; the upper canine\'s tip sits between the lower canine and first premolar, and the upper first molar\'s mesiobuccal cusp over the lower first molar\'s buccal groove (Class I)."); });
  m += '<path class="me-gum" d="' + path(band(D.GU, 3.5), Mx) + '"/>';
  /* the chart: how much more (+, up) or less (-, down) each lower posterior tooth drops on the articulator than in the mouth */
  var base = D.BASE, K = D.KPX, grow = Math.min(1, fNow / D.F1);
  m += tx(12, 202, "articulator vs mouth, after 1 mm forward", "me-head2", "start");
  m += '<rect class="me-sw-hit" x="12" y="210" width="9" height="9"/>' + tx(26, 218.5, "drops more there: built too tall, hits", "me-key", "start");
  m += '<rect class="me-sw-clr" x="12" y="225" width="9" height="9"/>' + tx(26, 233.5, "drops less: the front teeth guide alone", "me-key", "start");
  m += '<path class="me-ref" d="M28 ' + f(base - 20 * K) + 'H292M28 ' + f(base + 20 * K) + 'H292"/>' + tx(26, base - 20 * K + 3.5, "+20", "me-cap", "end") + tx(26, base + 20 * K + 3.5, "−20", "me-cap", "end") + tx(26, base - 20 * K - 13, "µm", "me-cap", "end");
  m += '<path class="me-axis" d="M28 ' + base + 'H292"/>';
  D.CUSP.forEach(function (k, i) {
    var x = Mx(k.p)[0], v = err[i] * grow, h = v * K;
    if (Math.abs(h) > 0.4) m += '<rect class="' + (v > 0 ? "me-bar-hit" : "me-bar-clr") + '" x="' + f(x - 7) + '" y="' + f(h > 0 ? base - h : base) + '" width="14" height="' + f(Math.abs(h)) + '"/>';
    var r = Math.round(v);
    if (grow > 0.05) m += tx(x, h >= 0 ? base - h - 4 : base - h + 11, (r > 0 ? "+" : r < 0 ? "−" : "") + Math.abs(r), "me-val", "middle");
    m += tx(x, D.BASE + 48, k.n, "me-cap", "middle");
  });
  var xi = Mx([-80, 0])[0];
  m += tx(xi, base - 4, "guides", "me-cap", "middle") + tx(xi, D.BASE + 48, "I1", "me-cap", "middle");
  var res = side === "none" ? ["moves like the patient", "me-ok"] : side === "ant" ? ["most anterior teeth: premature", "me-bad"] : ["most posterior teeth: premature", "me-bad"];
  m += tx(12, 352, res[0], "me-res " + res[1], "start");
  if (side !== "none") m += tx(12, 366, "or heavy contacts", "me-res " + res[1], "start");
  var m2 = err[err.length - 1];
  return { art: a, mouth: m, m2: m2, readout: side === "none" ? "no error" : "2nd molar " + (m2 > 0 ? "+" : m2 < 0 ? "−" : "") + Math.abs(m2) + " µm" };
}

const TEXT = {
  ok: "Where the facebow puts them: the casts sit as far from the articulator's hinge axis as the patient's teeth sit from their own, so on the articulator the teeth move along the patient's paths and the work needs little adjustment.",
  back: "Mounted {mm} mm too far back, the teeth sit closer to the hinge axis than the patient's. Protruding, the back teeth separate less on the articulator than they will in the mouth ({m2} µm less at the second molar after 1 mm). Work built there is shaped for that: posterior cusps come out flatter than needed, and anterior guidance is built steeper than this patient needs to clear the back teeth. In the mouth the most anterior teeth take premature or heavy contacts.",
  high: "Mounted {mm} mm too high (superior), the teeth again sit closer to the hinge axis: the same as too far back. The back teeth separate less on the articulator than in the mouth ({m2} µm less at the second molar after 1 mm), anterior guidance built there comes out steeper than needed, and the most anterior teeth take premature or heavy contacts.",
  fwd: "Mounted {mm} mm too far forward, the teeth sit farther from the hinge axis than the patient's. Protruding, the back teeth separate more on the articulator than they will in the mouth ({m2} µm more at the second molar after 1 mm), so cusps built there come out taller and steeper than the patient's path allows: in the mouth the most posterior teeth meet early or hard.",
  low: "Mounted {mm} mm too low (inferior), the teeth again sit farther from the hinge axis: the same as too far forward. The back teeth separate more on the articulator than in the mouth ({m2} µm more at the second molar after 1 mm), cusps built there are too tall, and the most posterior teeth take premature or heavy contacts.",
};

const Dfull = Object.assign({ meModel, meSvg }, D);
const first = meSvg({ pos: "back", mm: 10, u: 1, v: 1 }, Dfull);
const svgA = figureSvg({ width: D.WA, height: D.HA, className: "me-svg me-art-svg", label: "A semi-adjustable arcon articulator from the side, with both casts mounted where the facebow puts them or too far back, too high, too far forward or too low.", body: first.art });
const svgM = figureSvg({ width: D.WM, height: D.HM, className: "me-svg me-mouth-svg", label: "The patient's teeth in the mouth protruding, and for each lower posterior tooth how much more or less it separates on the articulator than in the mouth.", body: first.mouth });
const plate = plateHtml({ fig: "Fig", title: "Where a mounting error shows", hint: "mount the casts · protrude", readout: first.readout, body: `<div class="am-svg me-box"><div class="me-pair">${svgA}${svgM}</div></div>` });
const controls = `<div class="am-controls" role="group" aria-label="Where the casts are mounted"><button type="button" class="am-btn" data-mepos="ok" aria-pressed="false">Facebow position</button><button type="button" class="am-btn" data-mepos="back" aria-pressed="true">Too far back</button><button type="button" class="am-btn" data-mepos="high" aria-pressed="false">Too high</button><button type="button" class="am-btn" data-mepos="fwd" aria-pressed="false">Too far forward</button><button type="button" class="am-btn" data-mepos="low" aria-pressed="false">Too low</button></div>
<div class="am-controls"><label class="am-slider"><span>Error</span><input type="range" min="1" max="15" step="1" value="10" data-memm aria-label="Size of the mounting error in millimeters"><span class="me-mm">10 mm</span></label><button type="button" class="am-btn" data-meplay>Protrude again</button></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Hover or tap the parts of the articulator, or the teeth.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From the L6 notes (Dr. Givan's Occ Lec4 slide "Hinge axis and facebow" and its four pictures: rearward, high, forward and low cast mounting): the facebow relates the maxillary cast to the hinge axis; mounting errors show in protrusion and laterotrusion; too posterior or too superior gives premature and/or heavy contacts on the most anterior teeth, too anterior or too inferior on the most posterior teeth. An arbitrary facebow lands within about 2-5 mm.</li>
<li>The articulator is a semi-adjustable arcon (condylar elements on the lower member, fossae on the upper; the incisal pin on the upper member resting on a flat incisal guide table), drawn to scale with the model patient. The mandibular cast is mounted to the maxillary one with the CR record, so both casts carry the error.</li>
<li>The numbers come from a side-view model of protrusion in an average-size adult: the upper incisal edge 82 mm in front of the hinge axis and 43 mm below the reference plane (the Slidematic's 43 mm; about 4 inches from each condyle, Bonwill's triangle), the occlusal plane 8° to the reference plane with a curve of Spee, condylar guidance 35° on the patient and the articulator alike, anterior guidance 50° on the upper central incisors, 3 mm overbite, Class I teeth. Each value is how much farther (+) or less far (−) that tooth's buccal cusp has dropped on the articulator than in the mouth once the lower incisors have moved 1 mm forward, while the cusps still overlap; it grows with the movement.</li>
<li>The direction holds whenever the anterior guidance is steeper than the condylar guidance, as in most patients; with flatter anterior guidance it reverses. A protrusive record taken on mis-mounted casts would partly hide the error near the position where it was taken. Laterotrusion adds a swing about the working condyle that one side view can't show; the slide gives the same rule for it. Teeth are simplified outlines (the central incisors in profile, the rest from the cheek side). Educational, not clinical guidance.</li></ul></details>`;

function meLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var sA = root.querySelector(".me-art-svg"), sM = root.querySelector(".me-mouth-svg"), sum = root.querySelector(".am-summary"), info = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]");
  var rng = root.querySelector("[data-memm]"), out = root.querySelector(".me-mm"), play = root.querySelector("[data-meplay]");
  var st = { pos: "back", mm: 10, u: 1, v: 1 }, raf = 0;
  function draw() {
    var r = D.meSvg(st, D); sA.innerHTML = r.art; sM.innerHTML = r.mouth;
    sum.textContent = D.TEXT[st.pos].replace("{mm}", st.mm).replace("{m2}", Math.abs(r.m2));
    if (readout) readout.textContent = r.readout;
    rng.disabled = st.pos === "ok";
  }
  function run(mount) {
    cancelAnimationFrame(raf);
    if (reduce.matches) { st.u = 1; st.v = 1; draw(); return; }
    var t0 = performance.now(), TU = mount ? 700 : 0, TV = 1300;
    function ease(x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
    function step(now) {
      var t = now - t0;
      st.u = TU ? ease(Math.min(1, t / TU)) : 1;
      st.v = t < TU ? 0 : ease(Math.min(1, (t - TU) / TV));
      draw();
      if (t < TU + TV) raf = requestAnimationFrame(step);
    }
    st.v = 0; if (mount) st.u = 0;
    raf = requestAnimationFrame(step);
  }
  root.querySelectorAll("[data-mepos]").forEach(function (b) {
    b.addEventListener("click", function () {
      st.pos = b.getAttribute("data-mepos");
      root.querySelectorAll("[data-mepos]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      run(st.pos !== "ok");
    });
  });
  rng.addEventListener("input", function () { cancelAnimationFrame(raf); st.mm = +rng.value; out.textContent = st.mm + " mm"; st.u = 1; st.v = 1; draw(); });
  play.addEventListener("click", function () { run(false); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && root.contains(el)) info.textContent = el.getAttribute("data-info"); }
  [sA, sM].forEach(function (s) { s.addEventListener("pointerover", hot); s.addEventListener("click", hot); });
  draw();
}

const CSS = `
.anima .me-box{max-width:640px;margin:0 auto}
.anima .me-pair{display:flex;gap:6px;align-items:flex-start}
.anima .me-pair > svg{flex:1 1 0;min-width:0}
@media (max-width:560px){.anima .me-pair{flex-direction:column;gap:10px}.anima .me-pair > svg{flex:none;width:100%}}
.anima .me-svg .me-t{fill:var(--anatomy-text);font:11px var(--anatomy-mono);paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round}
.anima .me-svg .me-head{fill:var(--anatomy-strong);font-weight:700;stroke:none}
.anima .me-svg .me-cap{fill:var(--anatomy-muted);font-size:10px;stroke:none}
.anima .me-svg .me-lab{fill:var(--anatomy-strong);font-size:10.5px}
.anima .me-svg .me-lead{fill:none;stroke:var(--anatomy-mid);stroke-width:.8}
.anima .me-svg .me-res{font-size:11.5px;font-weight:700}
.anima .me-svg .me-ok{fill:#2f8a5b}
.anima .me-svg .me-bad{fill:var(--tm-vessel)}
.anima .me-svg .me-val{fill:var(--anatomy-strong);font-size:10px;stroke-width:2.5px}
.anima .me-svg .me-key{font-size:10px;stroke:none}
.anima .me-svg .me-metal{fill:var(--anatomy-shade-0);stroke:var(--anatomy-hi);stroke-width:1.1;stroke-linejoin:round}
.anima .me-svg .me-pin{fill:var(--anatomy-shade-3);stroke:var(--anatomy-hi);stroke-width:1.1;stroke-linejoin:round}
.anima .me-svg .me-ball{fill:var(--anatomy-shade-3);stroke:var(--anatomy-hi);stroke-width:1.3}
.anima .me-svg .me-cross{stroke:var(--anatomy-lit);stroke-width:1.6;stroke-linecap:round}
.anima .me-svg .me-guide{fill:none;stroke:var(--anatomy-lit);stroke-width:1.6;stroke-linecap:round}
.anima .me-svg .me-cast{fill:var(--tm-bone);stroke:var(--anatomy-lo);stroke-width:1;stroke-linejoin:round}
.anima .me-svg .me-stone2{fill:var(--tm-bone-in);stroke:var(--anatomy-lo);stroke-width:.9;stroke-linejoin:round}
.anima .me-svg .me-ghost{fill:none;stroke:var(--anatomy-lit);stroke-width:1.1;stroke-dasharray:4 3;vector-effect:none}
.anima .me-svg .me-tooth{fill:var(--anatomy-face);stroke:var(--anatomy-hi);stroke-width:.9;stroke-linejoin:round}
.anima .me-mouth-svg .me-tooth{stroke-width:1.1}
.anima .me-svg .me-tooth.me-lo{fill:var(--anatomy-shade-3)}
.anima .me-svg .me-tooth.me-behind{fill:var(--anatomy-shade-1)}
.anima .me-svg .me-gum{fill:var(--tm-retro);stroke:none}
.anima .me-svg .me-lit{fill:var(--tm-vessel);fill-opacity:.28;stroke:var(--tm-vessel);stroke-width:2;pointer-events:none}
.anima .me-svg .me-axis{stroke:var(--anatomy-mid);stroke-width:1}
.anima .me-svg .me-ref{stroke:var(--anatomy-lo);stroke-width:1;stroke-dasharray:3 3;vector-effect:none}
.anima .me-svg .me-bar-hit{fill:var(--tm-vessel)}
.anima .me-svg .me-bar-clr{fill:var(--anatomy-lit)}
.anima .me-svg .me-head2{fill:var(--anatomy-strong);font-size:10.5px;font-weight:600;stroke:none}
.anima .me-svg .me-sw-hit{fill:var(--tm-vessel)}
.anima .me-svg .me-sw-clr{fill:var(--anatomy-lit)}
`;

export function mounterr() {
  return {
    id: "mounterr", lec: "instruments",
    title: "Where a mounting error shows",
    caption: "Mount both casts where the facebow puts them, or too far back, too high, too far forward or too low, then protrude: see how much more or less the back teeth separate on the articulator than in the mouth, and which teeth meet early.",
    html: `<div class="anima" data-anima="mounterr">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: meLive.toString(),
    helpers: [meModel, meSvg],
    data: Object.assign({ TEXT }, D),
  };
}
