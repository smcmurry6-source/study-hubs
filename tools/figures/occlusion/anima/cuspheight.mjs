// Fig: determinants of cusp height (Occlusion L1, "The determinants of posterior morphology").
// A side view, patient facing right: the condyle against the slope of the articular eminence, the posterior teeth of one
// side (M2, M1, PM2, PM1) in Class I, the canines and the central incisors. Sliders set the five sagittal factors in the
// notes' table (condylar guidance, vertical overlap, horizontal overlap, plane of occlusion, curve of Spee); a protrusion
// slider (or Play) slides the jaw forward to edge to edge.
// One model (chModel): in protrusion the condyle comes down the eminence (slope CG) and the lower incisor comes down the
// upper incisor's lingual surface (slope VO/HO), so every point of the mandible between them moves forward and down at a
// slope that blends the two by its distance from the condyle (the jaw translates and rotates a little). A cusp just clears
// when its incline, measured from the local occlusal surface (plane of occlusion plus the curve of Spee), is no steeper
// than that path: allowed incline = path slope angle - local occlusal angle. Today's teeth (solid) are built from the
// starting settings; the dashed outline is the cusp that would just clear with the current settings, and a cusp taller
// than that turns red. The gap that opens between the back teeth is Christensen's phenomenon.
// Every number is schematic (drawing units); the trends are the notes' table, checked at the bottom of this file: steeper
// CG, more VO -> taller; more HO, PO more parallel to CG, a more acute Spee -> shorter (the most posterior cusps).
import { figureSvg, plateHtml } from "./shared.mjs";

const W = 470, H = 300;

const D = {
  W, H, k: 5, P: 28, xb: 150, xk: 330, yk: 176, C0: [56, 96], r: 12, Tx: 356, margin: 3,
  start: { cg: 35, vo: 3, ho: 3, po: 10, spee: 1.5, p: 0 },
  lower: [[150, 206, "M2"], [206, 262, "M1"], [262, 290, "PM2"], [290, 318, "PM1"]],
  MSG: {
    cg: ["Condylar guidance is steeper than at the start: the back of the jaw drops more as it comes forward, so the posterior cusps can be taller.", "Condylar guidance is flatter than at the start: the back of the jaw drops less as it comes forward, so the posterior cusps must be shorter."],
    vo: ["More vertical overlap makes the anterior guidance steeper: the front of the jaw drops more, so the posterior cusps can be taller.", "Less vertical overlap flattens the anterior guidance: the front of the jaw drops less, so the posterior cusps must be shorter."],
    ho: ["More horizontal overlap flattens the anterior guidance: the jaw slides farther before it drops, so the posterior cusps must be shorter.", "Less horizontal overlap steepens the anterior guidance, so the posterior cusps can be taller."],
    po: ["The plane of occlusion is tilted more, closer to parallel with the condylar guidance: the teeth slide along each other instead of separating, so the posterior cusps must be shorter.", "The plane of occlusion is flatter, less parallel to the condylar guidance, so the posterior cusps can be taller."],
    spee: ["A more acute curve of Spee tips the back of the occlusal surface up toward the condylar path, so the most posterior cusps must be shorter.", "A flatter curve of Spee leaves the most posterior cusps more room: they can be taller."],
  },
};

/* the model: occlusal curve, guidance blend, allowed incline per x, and where the jaw is at protrusion st.p (0-1) */
function chModel(st, D) {
  var rad = Math.PI / 180, s = st.spee * D.k, xb = D.xb, xk = D.xk, yk = D.yk, tp = Math.tan(st.po * rad);
  function cy(x) { var y = yk + tp * (x - xk); if (x > xb && x < xk) { var u = (x - xb) / (xk - xb); y += s * 4 * u * (1 - u); } return y; }
  function th(x) { var d = tp; if (x >= xb && x <= xk) { var u = (x - xb) / (xk - xb); d += s * 4 * (1 - 2 * u) / (xk - xb); } return Math.atan(d); }
  var T = [D.Tx, cy(D.Tx) - 4], xc = D.C0[0], yc = D.C0[1];
  var tcg = Math.tan(st.cg * rad), tag = st.vo / st.ho;
  function phi(x) { var t = (x - xc) / (T[0] - xc); return Math.atan((1 - t) * tcg + t * tag); }
  function allow(x) { return Math.max(0, (phi(x) - th(x)) / rad); }
  var ppx = st.p * st.ho * D.k, dc = ppx * tcg, di = ppx * tag, rho = (di - dc) / (T[0] - xc);
  function move(x, y) { var c = Math.cos(rho), sn = Math.sin(rho); return [xc + ppx + (x - xc) * c - (y - yc) * sn, yc + dc + (x - xc) * sn + (y - yc) * c]; }
  return { cy: cy, th: th, T: T, phi: phi, allow: allow, ppx: ppx, dc: dc, di: di, rho: rho, move: move, xc: xc, yc: yc };
}

/* the whole drawing for a state; the live figure redraws it on every change */
function chSvg(st, D) {
  var m = chModel(st, D), m0 = chModel(D.start, D), rad = Math.PI / 180, hp = D.P / 2, xb = D.xb, cy = m.cy, CH = 30;
  function f(v) { return Math.round(v * 10) / 10; }
  function P(pts) { return pts.map(function (p, i) { return (i ? "L" : "M") + f(p[0]) + " " + f(p[1]); }).join("") + "Z"; }
  function L(pts) { return pts.map(function (p, i) { return (i ? "L" : "M") + f(p[0]) + " " + f(p[1]); }).join(""); }
  /* closed Catmull-Rom curve through the points (same as shared.mjs smooth) */
  function S(pts) { var n = pts.length, d = "M" + f(pts[0][0]) + " " + f(pts[0][1]);
    for (var i = 0; i < n; i++) { var p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      d += "C" + f(p1[0] + (p2[0] - p0[0]) / 6) + " " + f(p1[1] + (p2[1] - p0[1]) / 6) + " " + f(p2[0] - (p3[0] - p1[0]) / 6) + " " + f(p2[1] - (p3[1] - p1[1]) / 6) + " " + f(p2[0]) + " " + f(p2[1]); }
    return d + "Z"; }
  function tx(x, y, t, cls, anchor) { return '<text class="ch-t' + (cls ? " " + cls : "") + '" x="' + f(x) + '" y="' + f(y) + '"' + (anchor ? ' text-anchor="' + anchor + '"' : "") + ">" + t + "</text>"; }
  function act(x) { return Math.max(0, m0.allow(x) - D.margin); }
  /* zigzag interface: lower cusp tips at xb + 14 + 28j (up), lower valleys / upper cusp tips at xb + 28j (down) */
  function zy(x, deg) { var h = hp * Math.tan(deg * rad), lowerTip = Math.round((x - xb) / hp) % 2 !== 0; return cy(x) + (lowerTip ? -h : h); }
  var x1 = D.lower[D.lower.length - 1][1], xs = [];
  for (var x = xb - hp; x <= x1 + 0.1; x += hp) xs.push(x);
  var s = "";
  /* reference horizontal: both guidance angles and the plane are measured from it */
  s += '<path class="ch-ref" d="M6 30H' + (D.W - 6) + '"/>' + tx(D.W - 8, 24, "reference horizontal", "ch-mut", "end");
  /* temporal bone: the fossa over the condyle and the posterior slope of the eminence at angle CG */
  var c0 = D.C0, r = D.r, cg = st.cg * rad, dir = [Math.cos(cg), Math.sin(cg)], nrm = [Math.sin(cg), -Math.cos(cg)], tb = [];
  var aEnd = Math.atan2(nrm[1], nrm[0]) + 2 * Math.PI;
  for (var a = Math.PI * 0.95; a <= aEnd + 0.001; a += (aEnd - Math.PI * 0.95) / 8) tb.push([c0[0] + (r + 1.5) * Math.cos(a), c0[1] + (r + 1.5) * Math.sin(a)]);
  var tp0 = [c0[0] + (r + 1.5) * nrm[0], c0[1] + (r + 1.5) * nrm[1]], e1 = [tp0[0] + 50 * dir[0], tp0[1] + 50 * dir[1]];
  tb.push([tp0[0] + 25 * dir[0], tp0[1] + 25 * dir[1]], e1, [e1[0] + 9, e1[1] + 3], [e1[0] + 18, e1[1] - 3], [e1[0] + 26, e1[1] - 14], [e1[0] + 36, 48], [e1[0] + 10, 42], [60, 42], [14, 48], [10, c0[1] - 6], [c0[0] - r - 12, c0[1] + 8]);
  s += '<path class="ch-bone hot" data-info="The articular eminence. In protrusion the condyle slides down its posterior slope: that slope is the condylar guidance (CG). Steeper = the back of the jaw drops more = taller cusps allowed." d="' + P(tb) + '"/>';
  /* CG angle mark */
  var arcR = 24, ap = [tp0[0] + arcR, tp0[1]], aq = [tp0[0] + arcR * dir[0], tp0[1] + arcR * dir[1]];
  s += '<path class="ch-guide" d="M' + f(tp0[0]) + " " + f(tp0[1]) + "H" + f(tp0[0] + 32) + '"/><path class="ch-arc" d="M' + f(ap[0]) + " " + f(ap[1]) + "A" + arcR + " " + arcR + " 0 0 1 " + f(aq[0]) + " " + f(aq[1]) + '"/>';
  s += tx(tp0[0] + 2, tp0[1] - 12, "CG " + Math.round(st.cg) + "°", "ch-key");
  /* maxilla and the upper teeth (fixed) */
  var T = m.T, E = [T[0] + st.ho * D.k, T[1] + st.vo * D.k], mx = [];
  for (var q = 128; q <= 330; q += 14) mx.push([q, cy(q) - CH + 2]);
  mx.push([E[0] - 10, E[1] - 50], [E[0] - 2, E[1] - 74]);
  for (q = 330; q >= 128; q -= 14) mx.push([q, cy(q) - CH - 30]);
  s += '<path class="ch-bone" d="' + P(mx) + '"/>';
  function crown(t, up) {
    var pts = [];
    xs.forEach(function (x) { if (x >= t[0] - 0.1 && x <= t[1] + 0.1) pts.push([x, zy(x, act(x))]); });
    var d = up ? -CH : CH, w = t[1] - t[0];
    pts.push([t[1] - 1, cy(t[1]) + d * .55], [t[1] - w * .12, cy(t[1]) + d], [t[0] + w * .12, cy(t[0]) + d], [t[0] + 1, cy(t[0]) + d * .55]);
    return pts;
  }
  D.lower.forEach(function (t) {
    s += '<path class="ch-tooth hot" data-info="An upper posterior tooth (today\'s cusps). Its distal inclines meet the lower teeth\'s mesial inclines when the jaw comes forward." d="' + P(crown([t[0] - hp, t[1] - hp], true)) + '"/>';
  });
  /* upper canine and central incisor; the incisor's lingual slope is the anterior guidance (VO over HO) */
  s += '<path class="ch-tooth ch-ant" d="' + S([[305, cy(305) - 14], [318, cy(318) + 12], [331, cy(331) - 12], [329, cy(331) - CH - 2], [307, cy(305) - CH - 2]]) + '"/>';
  var dl = Math.hypot(st.ho, st.vo), u = [st.ho / dl, st.vo / dl];
  s += '<path class="ch-tooth ch-ant hot" data-info="Upper central incisor. The lower incisor slides down its lingual surface in protrusion: the anterior guidance. More vertical overlap (VO) makes it steeper, more horizontal overlap (HO) flatter." d="' +
    P([[E[0] + 1.5, E[1] - 1], [E[0] + 3, E[1] - 26], [E[0] - 6, E[1] - 54], [Math.min(T[0] - 16, E[0] - 34), Math.min(E[1] - 50, T[1] - 26)], [T[0] - 13, T[1] - 12], [T[0] - 6 * u[0], T[1] - 6 * u[1]], [E[0] - 2, E[1] + 0.5]]) + '"/>';
  /* the lower jaw, moved by the protrusion */
  var g = "";
  var md = [[c0[0] - 8, c0[1] + 6], [44, 140], [46, 214], [62, 240], [130, 252], [260, 258], [T[0] - 10, T[1] + 82], [T[0] + 10, T[1] + 66], [T[0] + 3, T[1] + 40],
    [T[0] - 18, T[1] + 36], [340, cy(340) + CH - 2]];
  for (q = 318; q >= xb; q -= 28) md.push([q, cy(q) + CH - 2]);
  md.push([132, cy(132) + 18], [118, Math.min(116, cy(132) - 12)], [104, 122], [92, 126], [c0[0] + 9, c0[1] + 8]);
  g += '<path class="ch-bone ch-mand" d="' + S(md) + '"/>';
  g += '<circle class="ch-bone hot" data-info="The condyle. It comes down the eminence as the jaw protrudes (drawn without the disc)." cx="' + c0[0] + '" cy="' + c0[1] + '" r="' + r + '"/>';
  var hits = [];
  D.lower.forEach(function (t) {
    g += '<path class="ch-tooth hot" data-info="Lower ' + t[2] + ' (today\'s cusps, solid). The dashed outline is the tallest cusp that would still clear with the settings below." d="' + P(crown(t, false)) + '"/>';
    g += tx((t[0] + t[1]) / 2, cy((t[0] + t[1]) / 2) + CH + 14, t[2], "ch-mut ch-sm", "middle");
    for (var c = t[0] + hp; c < t[1]; c += D.P) if (act(c) > m.allow(c) + 0.2) hits.push(c);
  });
  hits.forEach(function (c) { g += '<path class="ch-hit" d="' + P([[c - hp, zy(c - hp, act(c - hp))], [c, zy(c, act(c))], [c + hp, zy(c + hp, act(c + hp))]]) + '"/>'; });
  /* the cusp that would just clear: the same tips and valleys with the allowed incline */
  var lx = xs.filter(function (x) { return x >= xb - 0.1; });
  g += '<path class="ch-allow" d="' + L(lx.map(function (x) { return [x, zy(x, m.allow(x))]; })) + '"/>';
  g += '<path class="ch-tooth ch-ant" d="' + S([[318, cy(318) + 12], [330, cy(330) - 12], [340, cy(340) + 6], [338, cy(340) + CH], [320, cy(318) + CH]]) + '"/>';
  g += '<path class="ch-tooth ch-ant" d="' + P([[T[0], T[1]], [T[0] + 2.5, T[1] + 20], [T[0] - 1, T[1] + 42], [T[0] - 15, T[1] + 40], [T[0] - 12, T[1] + 12], [T[0] - 3, T[1] + 1]]) + '"/>';
  var rd = m.rho / rad;
  s += '<g class="ch-low" transform="translate(' + f(m.xc + m.ppx) + " " + f(m.yc + m.dc) + ") rotate(" + Math.round(rd * 1000) / 1000 + ") translate(" + (-m.xc) + " " + (-m.yc) + ')">' + g + "</g>";
  /* Christensen's phenomenon: the space opening between the back teeth */
  if (st.p > 0.02) {
    /* per column: the upper teeth's surface and the moved lower teeth's surface; between them is the gap, and where the
       lower surface rises above the upper one the teeth would hit */
    var loz = lx.map(function (x) { return m.move(x, zy(x, act(x))); });
    function at(pts, x) { for (var i = 1; i < pts.length; i++) if (pts[i][0] >= x) { var a = pts[i - 1], b = pts[i], t = (x - a[0]) / ((b[0] - a[0]) || 1); return a[1] + (b[1] - a[1]) * t; } return null; }
    function upAt(x) { var k = Math.floor((x - (xb - hp)) / hp), xa = xb - hp + k * hp, ya = zy(xa, act(xa)), yb = zy(xa + hp, act(xa + hp)); return ya + (yb - ya) * (x - xa) / hp; }
    var gapT = [], gapB = [], hitT = [], hitB = [];
    for (var c = Math.ceil(loz[0][0]); c <= x1; c += 1) { var yu = upAt(c), yl = at(loz, c); if (yl == null) continue;
      gapT.push([c, yu]); gapB.push([c, Math.max(yu, yl)]); hitT.push([c, Math.min(yu, yl)]); hitB.push([c, yu]); }
    if (gapT.length > 1) s += '<path class="ch-gap" d="' + P(gapT.concat(gapB.reverse())) + '"/><path class="ch-over" d="' + P(hitT.concat(hitB.reverse())) + '"/>';
  }
  /* plane of occlusion through the canine, on top so it reads across the teeth */
  var po = st.po * rad, pa = [112, D.yk + Math.tan(po) * (112 - D.xk)], pb = [T[0] + 6, D.yk + Math.tan(po) * (T[0] + 6 - D.xk)];
  s += '<path class="ch-plane" d="M' + f(pa[0]) + " " + f(pa[1]) + "L" + f(pb[0]) + " " + f(pb[1]) + '"/>';
  /* VO / HO at the incisors */
  var lab = E[0] + 12;
  s += '<path class="ch-guide" d="M' + f(T[0] + 2) + " " + f(T[1]) + "H" + f(lab - 2) + '"/>';
  s += '<path class="ch-dim" d="M' + f(lab - 4) + " " + f(T[1] + 1) + "V" + f(E[1] - 1) + '"/>' + tx(lab, (T[1] + E[1]) / 2 + 4, "VO " + st.vo, "ch-key");
  s += '<path class="ch-dim" d="M' + f(T[0] + 3) + " " + f(E[1] + 7) + "H" + f(E[0]) + '"/>' + tx(lab, E[1] + 20, "HO " + st.ho, "ch-key");
  s += tx(c0[0], c0[1] + 34, "condyle", "ch-mut", "middle");
  s += tx(8, D.H - 8, "patient facing right →", "ch-mut ch-sm") + tx(D.W - 8, D.H - 8, "plane " + Math.round(st.po) + "° · Spee " + st.spee + " mm", "ch-mut ch-sm", "end");
  return s;
}

/* read-outs shared by the build and the live figure */
function chRead(st, D) {
  var m = chModel(st, D), m0 = chModel(D.start, D), x = D.lower[1][0] + D.P / 2, hits = [];
  D.lower.forEach(function (t) { for (var c = t[0] + D.P / 2; c < t[1]; c += D.P) if (Math.max(0, m0.allow(c) - D.margin) > m.allow(c) + 0.2 && hits.indexOf(t[2]) < 0) hits.push(t[2]); });
  return { allow: Math.round(m.allow(x)), today: Math.round(Math.max(0, m0.allow(x) - D.margin)), drop: Math.round((m.dc + m.rho * (x - m.xc)) / D.k * 10) / 10, hits: hits };
}

const svg = figureSvg({ width: W, height: H, className: "ch-svg", label: "Side view, patient facing right: the condyle on the articular eminence, the upper and lower posterior teeth, the canines and the central incisors, with the plane of occlusion and the guidance angles marked.", body: chSvg(D.start, D) });
const r0 = chRead(D.start, D);
const sl = (k, lab, min, max, step, a, b) => `<label class="am-slider ch-sl"><span class="ch-sl-n">${lab}</span><span>${a}</span><input type="range" data-ch="${k}" min="${min}" max="${max}" step="${step}" value="${D.start[k]}" aria-label="${lab}"><span>${b}</span></label>`;
const plate = plateHtml({ fig: "Fig 5", title: "Cusp height", hint: "change a factor, then protrude", readout: `M1 cusp ≤ ${r0.allow}°`, body: `<div class="am-svg ch-box">${svg}</div>` });
const LEGEND = `<div class="ch-legend" aria-hidden="true"><span><i class="ch-sw ch-sw-tooth"></i>today's cusps</span><span><i class="ch-sw ch-sw-allow"></i>would just clear</span><span><i class="ch-sw ch-sw-hit"></i>too tall: would hit</span><span><i class="ch-sw ch-sw-gap"></i>gap behind (Christensen)</span><span><i class="ch-sw ch-sw-plane"></i>plane of occlusion</span></div>`;
const controls = LEGEND + `<div class="am-controls"><label class="am-slider"><span>MIP</span><input type="range" data-ch="p" min="0" max="1" step="0.01" value="0" aria-label="Protrude the jaw from MIP to edge to edge"><span>edge to edge</span></label><button type="button" class="am-btn" data-chplay aria-pressed="false">Protrude</button><button type="button" class="am-btn" data-chreset>Start over</button></div>
<div class="ch-sliders">${sl("cg", "Condylar guidance", 15, 55, 1, "flat", "steep")}${sl("vo", "Vertical overlap", 1, 6, 0.5, "1 mm", "6 mm")}${sl("ho", "Horizontal overlap", 1, 6, 0.5, "1 mm", "6 mm")}${sl("po", "Plane of occlusion", 0, 15, 1, "flat", "tilted")}${sl("spee", "Curve of Spee", 0, 3, 0.25, "flat", "acute")}</div>
<div class="am-stats" aria-live="polite"><span><b>First molar cusp</b> <em data-r="allow">can be up to ${r0.allow}° (today ${r0.today}°)</em></span><span><b>Back teeth drop</b> <em data-r="drop">0 mm (in MIP)</em></span><span><b>Would hit</b> <em data-r="hits">nothing</em></span></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Tap or hover the eminence, the incisors or a tooth for what it does.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>The trends are the notes' table: steeper condylar guidance and more vertical overlap allow taller posterior cusps; more horizontal overlap, a plane of occlusion more parallel to the condylar guidance and a more acute curve of Spee (the most posterior cusps) make them shorter. Thielmann's formula ties the factors together.</li>
<li>Every number on it is schematic: the angles, millimeters and degrees are drawing units for comparing settings, not norms to memorize. The jaw's path at each tooth blends the condylar path and the incisor path by the tooth's distance from the condyle; a cusp just clears when its incline, measured from the local occlusal surface, is no steeper than that path.</li>
<li>The Bennett movement (a lateral side shift) is a horizontal factor and can't be drawn in a side view: a greater, more superior or more immediate side shift also means shorter cusps. The horizontal factors that set ridge and groove direction are in Fig 2.</li>
<li>Teeth are drawn from the cheek side in Class I, one cusp pitch for every tooth, and the disc is left out of the joint.</li></ul></details>`;

function chLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var svg = root.querySelector(".ch-svg"), st = {}, last = null, tgt = 0, frame = 0, t0 = 0, playing = false;
  Object.keys(D.start).forEach(function (k) { st[k] = D.start[k]; });
  var rs = {}; Array.prototype.forEach.call(root.querySelectorAll("[data-r]"), function (e) { rs[e.getAttribute("data-r")] = e; });
  var sum = root.querySelector(".am-summary"), infoEl = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]"), play = root.querySelector("[data-chplay]");
  var inputs = {}; Array.prototype.forEach.call(root.querySelectorAll("[data-ch]"), function (i) { inputs[i.getAttribute("data-ch")] = i; });
  function intro() { return "Today's teeth (solid) fit the starting settings. Change a factor and the dashed outline shows the tallest cusp that would still clear; a cusp taller than that turns red. Then protrude the jaw: the back teeth separate as the condyle comes down the eminence and the incisors come down the guidance."; }
  function draw() {
    svg.innerHTML = D.chSvg(st, D);
    var r = D.chRead(st, D);
    rs.allow.textContent = "can be up to " + r.allow + "° (today " + r.today + "°)";
    rs.drop.textContent = st.p > 0.01 ? r.drop + " mm at " + Math.round(st.p * 100) + "% of the way to edge to edge" : "0 mm (in MIP)";
    rs.hits.textContent = r.hits.length ? r.hits.join(", ") + ": too tall for these settings" : "nothing";
    if (readout) readout.textContent = "M1 cusp ≤ " + r.allow + "°";
    var t = intro();
    if (last && last !== "p") { var up = st[last] > D.start[last], same = st[last] === D.start[last]; t = same ? "Back at the starting value." : D.MSG[last][up ? 0 : 1]; }
    else if (last === "p" && st.p > 0.02) t = "Protruding: the condyle comes down the eminence and the lower incisor slides down the upper incisor's lingual surface, so the lower jaw drops as it comes forward and a space opens between the back teeth (Christensen's phenomenon)." + (r.hits.length ? " The red cusps are taller than the dashed limit: as the jaw starts forward their mesial inclines would strike the upper teeth's distal inclines (a protrusive interference)." : " Every cusp clears.");
    if (sum.textContent !== t) sum.textContent = t;
  }
  function stop() { playing = false; cancelAnimationFrame(frame); play.setAttribute("aria-pressed", "false"); }
  function tick(now) {
    if (!t0) t0 = now; var u = Math.min(1, (now - t0) / 1600), v = u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
    st.p = Math.round((tgt ? v : 1 - v) * 100) / 100; inputs.p.value = st.p; last = "p"; draw();
    if (u < 1) frame = requestAnimationFrame(tick); else stop();
  }
  play.addEventListener("click", function () {
    if (playing) { stop(); return; }
    tgt = st.p > 0.5 ? 0 : 1;
    if (reduce.matches) { st.p = tgt; inputs.p.value = st.p; last = "p"; draw(); return; }
    playing = true; t0 = 0; play.setAttribute("aria-pressed", "true"); frame = requestAnimationFrame(tick);
  });
  root.querySelector("[data-chreset]").addEventListener("click", function () { stop(); Object.keys(D.start).forEach(function (k) { st[k] = D.start[k]; if (inputs[k]) inputs[k].value = st[k]; }); last = null; draw(); });
  Object.keys(inputs).forEach(function (k) { inputs[k].addEventListener("input", function () { stop(); st[k] = +inputs[k].value; last = k; draw(); }); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && svg.contains(el)) infoEl.textContent = el.getAttribute("data-info"); }
  svg.addEventListener("pointerover", hot); svg.addEventListener("click", hot);
  draw();
}

const CSS = `
.anima .ch-box{max-width:620px;margin:0 auto}
.anima .ch-svg .ch-t{fill:var(--anatomy-text);font:15px var(--anatomy-mono);paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round}
.anima .ch-svg .ch-t.ch-mut{fill:var(--anatomy-muted)}
.anima .ch-svg .ch-t.ch-sm{font-size:13px}
.anima .ch-svg .ch-t.ch-key{fill:var(--anatomy-strong);font-weight:600}
.anima .ch-svg .ch-ref{stroke:var(--anatomy-lo);stroke-width:1;stroke-dasharray:2 4}
.anima .ch-svg .ch-bone{fill:var(--tm-bone);stroke:var(--anatomy-hi);stroke-width:1.1;stroke-linejoin:round}
.anima .ch-svg .ch-mand{fill:var(--tm-bone-in)}
.anima .ch-svg .ch-tooth{fill:#f6efe0;stroke:#8b7653;stroke-width:1;stroke-linejoin:round}
.anima .ch-svg .ch-ant{fill:#efe6d2}
.anima .ch-svg .ch-allow{fill:none;stroke:var(--anatomy-lit);stroke-width:1.6;stroke-dasharray:4 3;stroke-linejoin:round}
.anima .ch-svg .ch-hit{fill:#e05a4e;fill-opacity:.35;stroke:#c0392b;stroke-width:1.4}
.anima .ch-svg .ch-over{fill:#c0392b;stroke:none}
.anima .ch-svg .ch-gap{fill:var(--anatomy-lit);fill-opacity:.2;stroke:none}
.anima .ch-svg .ch-gap-key{stroke:var(--anatomy-lit);stroke-width:.6}
.anima .ch-svg .ch-plane{stroke:var(--anatomy-mid);stroke-width:1.1;stroke-dasharray:6 4}
.anima .ch-svg .ch-guide{stroke:var(--anatomy-mid);stroke-width:.9;stroke-dasharray:2 3}
.anima .ch-svg .ch-arc,.anima .ch-svg .ch-dim{fill:none;stroke:var(--anatomy-lit);stroke-width:1.6}
.anima .ch-svg .ch-lead{stroke:var(--anatomy-mid);stroke-width:.8}
.anima .ch-svg .ch-dot{fill:var(--anatomy-dot)}
.anima .ch-legend{display:flex;flex-wrap:wrap;gap:4px 16px;margin:8px 0 2px;font:.76rem var(--font-mono);color:var(--ink-soft)}
.anima .ch-legend span{display:inline-flex;align-items:center;gap:6px}
.anima .ch-sw{display:inline-block;width:16px;height:10px;border-radius:2px}
.anima .ch-sw-tooth{background:#f6efe0;border:1px solid #8b7653}
.anima .ch-sw-allow{border-top:2px dashed var(--accent);height:0;border-radius:0}
.anima .ch-sw-hit{background:rgba(224,90,78,.45);border:1px solid #c0392b}
.anima .ch-sw-gap{background:var(--accent-soft);border:1px solid var(--accent)}
.anima .ch-sw-plane{border-top:1.5px dashed var(--ink-faint);height:0;border-radius:0}
.anima .ch-sliders{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:4px 18px;margin:4px 0 8px}
.anima .ch-sl{flex-wrap:wrap;gap:2px 8px}
.anima .ch-sl .ch-sl-n{flex-basis:100%;color:var(--ink);font-weight:600}
`;

export function cuspheight() {
  return {
    id: "cuspheight", lec: "review",
    title: "What sets posterior cusp height",
    caption: "Change condylar guidance, vertical or horizontal overlap, the plane of occlusion or the curve of Spee and see how tall the back cusps can be; then protrude the jaw and watch the back teeth separate.",
    html: `<div class="anima" data-anima="cuspheight">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: chLive.toString(),
    helpers: [chModel, chSvg, chRead],
    data: D,
  };
}

/* the notes' trends, checked when this module loads (the build fails if the model ever disagrees with the table) */
{
  const x = D.lower[0][0] + D.P / 2, a = (o) => chModel({ ...D.start, ...o }, D).allow(x);
  const base = a({});
  const ok = a({ cg: 45 }) > base && a({ vo: 4 }) > base && a({ ho: 4 }) < base && a({ po: 15 }) < base && a({ spee: 2.5 }) < base;
  if (!ok) throw new Error("cuspheight: the model's trends no longer match the notes' table");
}
