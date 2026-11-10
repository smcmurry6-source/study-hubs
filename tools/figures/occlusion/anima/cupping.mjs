// Fig 26: cupped-out cusp tips (Occlusion L9, "Erosion: acid that isn't caries", the "Cupped-out cusp tips" paragraph;
// Dr. Lawson's prerecorded lecture, with L7's attrition vs erosion facets). A mandibular first molar cut buccolingually
// through its mesial cusps (buccal on the viewer's left), close up on the crown. A slider wears the cusp tips down over
// the years: the enamel of each tip is worn flat until a pinpoint of dentin shows, the dentin horn under the cusp. From
// then on it depends on the toggle: with wear alone the enamel and dentin wear together (a flat facet, L7), with wear plus
// acid the exposed dentin dissolves first and sinks below the enamel around it, a cup. Beside it, the reason: dentin has a
// higher critical pH than enamel, drawn on a pH scale. Content from the L9 notes; the shapes and thicknesses from the
// sources below. Static geometry here; the browser redraws both drawings from the state.
import { figureSvg, plateHtml } from "./shared.mjs";

const TW = 340, TH = 300, SW = 200, SH = 300;
/* mm, y up from the CEJ, x from the middle of the crown; buccal is negative. Wheeler's mandibular first molar: crown
   7.5 mm high on the buccal, 10.5 mm buccolingually, 9 at the cervix; the crown tilts to the lingual over its root.
   Enamel about 2 mm over the cusps (up to 2.5, Ten Cate), about 1 mm on the sides, thinning to nothing at the CEJ. */
const D0 = {
  V: { OX: 170, OY: 232, S: 22 }, XS: 0.3,
  /* the crown's surface, buccal CEJ over the buccal cusp tip, the central fossa and the lingual cusp tip to lingual CEJ */
  OUT: [[-4.4, 0], [-4.9, 0.9], [-5.15, 2.0], [-5.05, 3.3], [-4.6, 4.6], [-3.9, 5.9], [-3.1, 6.9], [-2.4, 7.4], [-1.7, 7.0], [-0.9, 5.9], [-0.2, 4.9], [0.3, 4.6], [0.9, 4.9], [1.6, 6.1], [2.3, 7.3], [2.8, 7.8], [3.5, 7.4], [4.2, 6.3], [4.75, 4.8], [4.95, 3.3], [4.85, 1.9], [4.6, 0.8], [4.3, 0]],
  /* the dentinoenamel junction, CEJ to CEJ, a dentin horn under each cusp */
  DEJ: [[-4.4, 0], [-4.45, 0.9], [-4.25, 2.0], [-4.05, 3.2], [-3.7, 4.2], [-3.15, 5.0], [-2.4, 5.4], [-1.75, 5.05], [-1.15, 4.4], [-0.55, 3.75], [0.25, 3.35], [1.0, 3.75], [1.6, 4.5], [2.2, 5.3], [2.75, 5.7], [3.35, 5.35], [3.8, 4.6], [4.05, 3.4], [4.1, 2.0], [4.15, 0.9], [4.3, 0]],
  /* the mesial root's sides below the CEJ, off the bottom of the picture */
  ROOT: [[4.3, 0], [4.25, -1.0], [4.15, -2.5], [4.05, -4.5], [-4.15, -4.5], [-4.25, -2.5], [-4.35, -1.0], [-4.4, 0]],
  /* the pulp chamber, a horn under each cusp, and the mesial root's two canals */
  PULP: [[-1.7, 2.6], [-1.95, 2.2], [-2.0, 1.2], [-1.95, 0], [-1.95, -1.3], [-2.05, -4.6], [-1.7, -4.6], [-1.65, -1.6], [-1.2, -1.05], [0, -0.9], [1.2, -1.05], [1.65, -1.6], [1.7, -4.6], [2.05, -4.6], [1.95, -1.3], [2.0, 0], [2.1, 1.2], [2.1, 2.3], [1.9, 2.85], [1.55, 2.25], [0.9, 1.85], [0.2, 1.75], [-0.6, 1.8], [-1.3, 2.1]],
  /* the socket (bone crest 1.6 mm below the CEJ), the bone and the gingiva on each side */
  SOCKET: [[-4.51, -1.6], [-4.45, -2.5], [-4.35, -4.5], [4.25, -4.5], [4.35, -2.5], [4.45, -1.6]],
  BONE: [[[-4.51, -1.6], [-4.45, -2.5], [-4.35, -4.5], [-6.6, -4.5], [-6.3, -3.2], [-5.7, -2.3], [-5.0, -1.75]], [[4.45, -1.6], [4.35, -2.5], [4.25, -4.5], [6.5, -4.5], [6.2, -3.2], [5.6, -2.3], [4.9, -1.75]]],
  GUM: [[[-4.37, -0.3], [-4.85, -0.5], [-5.5, -1.3], [-6.15, -2.3], [-6.7, -3.3], [-7.1, -4.5], [-6.6, -4.5], [-6.3, -3.2], [-5.7, -2.3], [-5.0, -1.75], [-4.51, -1.6], [-4.36, -0.9]], [[4.26, -0.3], [4.75, -0.5], [5.4, -1.3], [6.05, -2.3], [6.6, -3.3], [7.0, -4.5], [6.5, -4.5], [6.2, -3.2], [5.6, -2.3], [4.9, -1.75], [4.45, -1.6], [4.25, -0.9]]],
  /* the wear: each cusp's facet comes down from its tip to its dentin horn (the pinpoint), then on a little further */
  B: { tip: 7.4, horn: 5.4, end: 4.75, ue: 0.45, dmax: 1.1 }, L: { tip: 7.8, horn: 5.7, end: 5.15, ue: 0.7, dmax: 0.7 },
  HORN: [-2.4, 5.4],
  /* the pH scale: neutral at the top, more acidic down; dentin's critical pH drawn at about 6.3, enamel's at about 5.5 */
  PH: { top: 7, bot: 4, y0: 50, y1: 270, den: 6.3, ena: 5.5 },
};

/* a Catmull-Rom curve through the points, sampled densely (n per span), in mm */
function cpCurve(pts, closed, n) {
  var o = [], N = pts.length, m = closed ? N : N - 1;
  function P(i) { if (closed) return pts[(i + N) % N]; return pts[Math.max(0, Math.min(N - 1, i))]; }
  for (var i = 0; i < m; i++) {
    var p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    for (var k = 0; k < n; k++) {
      var t = k / n, t2 = t * t, t3 = t2 * t;
      o.push([0, 1].map(function (j) { return 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3); }));
    }
  }
  if (!closed) o.push(pts[N - 1].slice());
  return o;
}
/* where each cusp's facet is at wear u (0 to 1), and how deep its cup is with acid a (0 to 1) */
function cpWear(u, a, D) {
  function one(c) {
    var p = u < c.ue ? c.tip - (c.tip - c.horn) * u / c.ue : c.horn - (c.horn - c.end) * (u - c.ue) / (1 - c.ue);
    var s = u <= c.ue ? 0 : Math.min(1, 1.4 * (u - c.ue) / (1 - c.ue));
    return { p: p, d: a * c.dmax * s, open: u >= c.ue - 0.004 };
  }
  return { b: one(D.B), l: one(D.L) };
}
/* the worn surface: each cusp's facet, and the cup where its dentin shows (steep-sided, so the enamel stands as a rim) */
function cpSurf(w, D) {
  var dej = D.cpCurve(D.DEJ, false, 12), cups = [];
  [["b", function (x) { return x < D.XS; }], ["l", function (x) { return x >= D.XS; }]].forEach(function (c) {
    var f = w[c[0]], lo = 1e9, hi = -1e9;
    dej.forEach(function (q) { if (c[1](q[0]) && q[1] >= f.p) { lo = Math.min(lo, q[0]); hi = Math.max(hi, q[0]); } });
    if (hi > lo) { var hw = (hi - lo) / 2; cups.push({ side: c[0], xm: (lo + hi) / 2, hw: hw, d: Math.min(f.d, 1.1 * hw), p: f.p }); }
  });
  function S(x) {
    var y = x < D.XS ? w.b.p : w.l.p;
    cups.forEach(function (c) { var t = (x - c.xm) / (c.hw * 1.06); if (Math.abs(t) < 1) y = Math.min(y, c.p - c.d * Math.sqrt(1 - t * t)); });
    return y;
  }
  return { S: S, cups: cups };
}
function cpTooth(st, D) {
  var V = D.V, f = function (n) { return Math.round(n * 10) / 10; };
  function X(x) { return V.OX + x * V.S; } function Y(y) { return V.OY - y * V.S; }
  function pts(a) { return a.map(function (q) { return f(X(q[0])) + " " + f(Y(q[1])); }).join("L"); }
  function poly(a, cls, info) { return '<path class="' + cls + (info ? ' hot" data-info="' + info : "") + '" d="M' + pts(a) + 'Z"/>'; }
  function tx(x, y, t, cls, a) { return '<text class="cp-t' + (cls ? " " + cls : "") + '" x="' + f(x) + '" y="' + f(y) + '"' + (a ? ' text-anchor="' + a + '"' : "") + ">" + t + "</text>"; }
  function lead(x1, y1, x2, y2) { return '<path class="cp-lead" d="M' + f(x1) + " " + f(y1) + "L" + f(x2) + " " + f(y2) + '"/><circle class="cp-dot" cx="' + f(x2) + '" cy="' + f(y2) + '" r="2"/>'; }
  var w = D.cpWear(st.u, st.a, D), sf = D.cpSurf(w, D), clamp = function (a) { return a.map(function (q) { return [q[0], Math.min(q[1], sf.S(q[0]))]; }); };
  var out = clamp(D.cpCurve(D.OUT, false, 12)), dej = clamp(D.cpCurve(D.DEJ, false, 12)), root = D.ROOT.slice(1), o = "";
  o += poly(D.SOCKET, "cp-pdl");
  D.BONE.forEach(function (b) { o += poly(b, "cp-bone"); });
  D.GUM.forEach(function (g) { o += poly(D.cpCurve(g, true, 6), "cp-gum"); });
  o += poly(out.concat(root), "cp-enamel", D.HOT.enamel);
  o += poly(dej.concat(root), "cp-dentin", D.HOT.dentin);
  o += poly(D.cpCurve(D.PULP, true, 8), "cp-pulp");
  o += '<path class="cp-out" d="M' + pts(out.concat(root)) + 'Z"/>';
  /* the cups, for hover */
  sf.cups.forEach(function (c) { if (c.d > 0.08) o += '<ellipse class="hot cp-hit" data-info="' + D.HOT.cup + '" cx="' + f(X(c.xm)) + '" cy="' + f(Y(c.p - c.d / 2)) + '" rx="' + f(c.hw * V.S + 4) + '" ry="' + f(c.d * V.S / 2 + 6) + '"/>'; });
  /* labels */
  o += tx(6, Y(3.3) + 4, "enamel", "cp-strong") + lead(50, Y(3.3), X(-4.55), Y(3.3));
  o += tx(334, Y(1.6) + 4, "dentin", "cp-strong", "end") + lead(292, Y(1.6), X(3.45), Y(1.6));
  if (!w.b.open) o += '<g class="hot" data-info="' + D.HOT.horn + '"><circle class="cp-hit" cx="' + f(X(D.HORN[0])) + '" cy="' + f(Y(D.HORN[1])) + '" r="12"/>' + tx(6, Y(5.6), "dentin horn", "cp-strong") + lead(82, Y(5.6) - 4, X(D.HORN[0]) - 2, Y(D.HORN[1]) + 1) + "</g>";
  var cb = sf.cups.filter(function (c) { return c.side === "b"; })[0], lines = null, tgt = null;
  if (st.u >= 0.02 && !w.b.open) { lines = ["wear facet: the enamel of", "the cusp tip worn flat"]; tgt = [-2.4, w.b.p]; }
  else if (w.b.open && st.u < D.B.ue + 0.06) { lines = ["a pinpoint of dentin shows:", "the dentin horn"]; tgt = [cb ? cb.xm : D.HORN[0], w.b.p]; }
  else if (w.b.open && cb && cb.d > 0.08) { lines = ["cupped out: acid dissolves", "the exposed dentin first"]; tgt = [cb.xm, cb.p - cb.d]; }
  else if (w.b.open) { lines = ["wear alone: a flat facet, enamel", "and dentin at the same height"]; tgt = [cb ? cb.xm : D.HORN[0], w.b.p]; }
  if (lines) o += tx(6, 16, lines[0], "cp-call") + tx(6, 30, lines[1], "cp-call") + lead(44, 35, X(tgt[0]), Y(tgt[1]) - 1);
  o += tx(6, D.TH - 8, "buccal", "cp-cap") + tx(334, D.TH - 8, "lingual", "cp-cap", "end");
  return o;
}
/* the pH scale: dentin starts to dissolve at a higher pH than enamel */
function cpScale(st, D) {
  var P = D.PH, f = function (n) { return Math.round(n * 10) / 10; }, o = "";
  function Y(p) { return P.y0 + (P.top - p) / (P.top - P.bot) * (P.y1 - P.y0); }
  function tx(x, y, t, cls, a) { return '<text class="cp-t' + (cls ? " " + cls : "") + '" x="' + f(x) + '" y="' + f(y) + '"' + (a ? ' text-anchor="' + a + '"' : "") + ">" + t + "</text>"; }
  o += tx(8, 18, "Why dentin first?", "cp-strong");
  for (var i = 0; i < 30; i++) { var p = P.top - (P.top - P.bot) * i / 30; o += '<rect class="cp-bar" x="30" y="' + f(Y(p)) + '" width="12" height="' + f((P.y1 - P.y0) / 30 + 0.5) + '" style="fill:' + D.cpColor(p - (P.top - P.bot) / 60) + '"/>'; }
  o += '<rect class="cp-barline" x="30" y="' + P.y0 + '" width="12" height="' + (P.y1 - P.y0) + '"/>';
  o += tx(24, Y(7) + 4, "7", "cp-cap", "end") + tx(48, Y(7) + 4, "neutral", "cp-cap");
  o += '<g class="hot" data-info="' + D.HOT.band + '"><rect class="cp-band' + (st.a > 0.5 ? " on" : "") + '" x="26" y="' + f(Y(P.den)) + '" width="20" height="' + f(Y(P.ena) - Y(P.den)) + '" rx="3"/>';
  o += tx(56, Y((P.den + P.ena) / 2) - 3, "dentin dissolves,", "cp-band-t") + tx(56, Y((P.den + P.ena) / 2) + 11, "enamel doesn't", "cp-band-t") + "</g>";
  [["den", "dentin starts", D.HOT.den], ["ena", "enamel starts", D.HOT.ena]].forEach(function (k) {
    var y = Y(P[k[0]]);
    o += '<g class="hot" data-info="' + k[2] + '"><path class="cp-tick" d="M26 ' + f(y) + 'H52"/>' + tx(56, y - (k[0] === "den" ? 18 : -14), k[1], "cp-strong") + tx(56, y - (k[0] === "den" ? 4 : -28), "to dissolve", "cp-cap") + "</g>";
  });
  o += '<path class="cp-arrow" d="M36 ' + (P.y1 + 8) + "v14m-4 -5l4 5 4-5" + '"/>' + tx(48, P.y1 + 20, "more acidic", "cp-cap");
  return o;
}
function cpColor(p) {
  var S = [[4, [216, 87, 74]], [5, [232, 145, 58]], [6, [222, 190, 64]], [7, [90, 169, 95]]], i;
  if (p <= S[0][0]) return "rgb(" + S[0][1].join(",") + ")";
  for (i = 1; i < S.length; i++) if (p <= S[i][0]) { var u = (p - S[i - 1][0]) / (S[i][0] - S[i - 1][0]), a = S[i - 1][1], b = S[i][1]; return "rgb(" + [0, 1, 2].map(function (k) { return Math.round(a[k] + (b[k] - a[k]) * u); }).join(",") + ")"; }
  return "rgb(" + S[S.length - 1][1].join(",") + ")";
}

const HOT = {
  enamel: "Enamel: thickest over the cusps. Wear flattens the cusp tips first, and it has to wear through before any dentin shows.",
  dentin: "Dentin: under the enamel. It has a higher critical pH than enamel, so once it's exposed, acid dissolves it first and faster.",
  horn: "The dentin horn: the dentin under each cusp reaches up toward its tip, so when the enamel wears through, a pinpoint of dentin shows there first.",
  cup: "The cup: the exposed dentin has dissolved below the enamel around it, which stands as a rim. Wear plus erosion; L7 adds that eroded facets are dull, not shiny.",
  band: "Between the two critical pHs an acid dissolves dentin but not enamel: that's why the exposed dentin cups out while the enamel rim stands.",
  den: "Dentin's critical pH, where it starts to dissolve, is higher: a milder acid already dissolves it.",
  ena: "Enamel's critical pH is lower: it takes a stronger acid to dissolve enamel.",
};
const DATA = Object.assign({ HOT, TH }, D0);
const ctx = Object.assign({ cpCurve, cpWear, cpSurf, cpColor }, DATA);
const ST0 = { u: 0, a: 1 };
const svgTooth = figureSvg({ width: TW, height: TH, className: "cp-svg cp-tooth", label: "A mandibular first molar cut buccolingually, close up on the crown: enamel over dentin, a dentin horn under each cusp. Wear flattens the cusp tips; with acid the exposed dentin dissolves into a cup.", body: cpTooth(ST0, ctx) });
const svgScale = figureSvg({ width: SW, height: SH, className: "cp-svg cp-scale", label: "A pH scale from neutral down to more acidic: dentin starts to dissolve at a higher pH than enamel, and between the two an acid dissolves dentin but not enamel.", body: cpScale(ST0, ctx) });
const plate = plateHtml({ fig: "Fig 26", title: "Cupped-out cusp tips", hint: "wear it down", readout: "wear plus acid · unworn", body: `<div class="am-svg cp-box">${svgTooth}${svgScale}</div>` });
const controls = `<div class="am-controls"><label class="am-slider">new<input type="range" min="0" max="100" value="0" data-cpt aria-label="Years of wear, from a new tooth to heavily worn">years of wear</label></div>
<div class="am-controls" role="group" aria-label="What wears the tooth"><button type="button" class="am-btn" data-cpacid="0" aria-pressed="false">Wear alone</button><button type="button" class="am-btn" data-cpacid="1" aria-pressed="true">Wear plus acid</button><button type="button" class="am-btn" data-cpplay>Watch it happen</button></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Hover or tap the enamel, the dentin or the pH scale.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From the L9 notes (Dr. Lawson's prerecorded lecture, a side point he "always thought was cool"): cupped-out cusp tips on eroded molars are a combination of wear and erosion. The patient wears through the enamel of a cusp tip until a pinpoint of dentin shows, the dentin horn under each cusp; as soon as that dentin is exposed, acid selectively dissolves it, because dentin has a higher critical pH than enamel. From L7 (Dr. Givan): attrition alone leaves facets with enamel and dentin at the same height; erosion leaves dull, cupped facets, as the dentin goes faster than the enamel.</li>
<li>Outside sources: cupping of the occlusal surfaces, the dentin hollowed below a rim of enamel, is a recognized sign of erosive tooth wear (Ganss and Lussi, Diagnosis of erosive tooth wear, Monogr Oral Sci 2014;25:22-31). The tooth's size and shape are a mandibular first molar's (Wheeler's Dental Anatomy: crown 7.5 mm high, 10.5 mm buccolingually, the crown tilted lingually over the root), with enamel about 2 mm thick over the cusps (Ten Cate's Oral Histology: up to about 2.5 mm). The scale places dentin's critical pH at about 6.3 and enamel's at about 5.5, typical textbook values; dentin's mineral is more soluble than enamel's (Hoppenbrouwers, Driessens and Borggreven, Arch Oral Biol 1987;32:319-322). The lecture gave no numbers, so the scale shows only their order.</li>
<li>Schematic: the years are not to scale, the buccal (supporting) cusp is drawn wearing first, and each facet is drawn flat. A real critical pH isn't fixed: it depends on the calcium and phosphate in the fluid on the tooth. Acid also softens enamel, and a cup's rim can chip; neither is drawn. Educational, not clinical guidance.</li></ul></details>`;

function cpLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var tooth = root.querySelector(".cp-tooth"), scale = root.querySelector(".cp-scale"), sum = root.querySelector(".am-summary"), info = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]");
  var slider = root.querySelector("[data-cpt]"), play = root.querySelector("[data-cpplay]"), segs = root.querySelectorAll("[data-cpacid]");
  var st = { u: 0, a: 1 }, acid = 1, raf = 0, araf = 0;
  function draw() { tooth.innerHTML = D.cpTooth(st, D); scale.innerHTML = D.cpScale(st, D); }
  function text() {
    var w = D.cpWear(st.u, st.a, D), s, r;
    if (st.u < 0.02) { s = "A mandibular first molar, cut buccolingually: enamel over dentin, thickest over the cusps, with a dentin horn reaching up under each cusp. Move the slider to wear it down over the years."; r = "unworn"; }
    else if (!w.b.open) { s = "Wear flattens the cusp tips first. Only enamel is worn so far: the dentin horn under the cusp is still covered."; r = "enamel worn"; }
    else if (st.u < D.B.ue + 0.06) { s = "The enamel of the buccal cusp tip has worn through: a pinpoint of dentin shows, the dentin horn. What happens next depends on acid."; r = "dentin shows"; }
    else if (acid) { s = "As soon as the dentin is exposed, acid selectively dissolves it, because dentin has a higher critical pH than enamel. It sinks below the enamel around it: a cupped-out cusp tip, from wear plus erosion" + (w.l.open ? ", now on the lingual cusp too." : ". Keep going and the lingual cusp cups too."); r = "cupped"; }
    else { s = "Wear alone wears the enamel and the dentin together: a flat facet with both at the same height (L7: attrition). No cup forms until acid is added."; r = "flat facet"; }
    sum.textContent = s;
    if (readout) readout.textContent = (acid ? "wear plus acid" : "wear alone") + " · " + r;
  }
  function setAcid(v) {
    acid = v; segs.forEach(function (b) { b.setAttribute("aria-pressed", String(+b.getAttribute("data-cpacid") === v)); });
    cancelAnimationFrame(araf);
    if (reduce.matches) { st.a = v; draw(); text(); return; }
    var a0 = st.a, t0 = performance.now();
    function step(now) { var k = Math.min(1, (now - t0) / 600); st.a = a0 + (v - a0) * (1 - Math.pow(1 - k, 3)); draw(); if (k < 1) araf = requestAnimationFrame(step); else text(); }
    text(); araf = requestAnimationFrame(step);
  }
  function run() {
    cancelAnimationFrame(raf);
    if (reduce.matches) { st.u = 1; slider.value = 100; draw(); text(); return; }
    var t0 = performance.now(), u0 = st.u >= 0.99 ? 0 : st.u, dur = 5200 * (1 - u0);
    function step(now) { var k = Math.min(1, (now - t0) / dur); st.u = u0 + (1 - u0) * k; slider.value = Math.round(st.u * 100); draw(); text(); if (k < 1) raf = requestAnimationFrame(step); }
    raf = requestAnimationFrame(step);
  }
  slider.addEventListener("input", function () { cancelAnimationFrame(raf); st.u = +slider.value / 100; draw(); text(); });
  segs.forEach(function (b) { b.addEventListener("click", function () { setAcid(+b.getAttribute("data-cpacid")); }); });
  play.addEventListener("click", run);
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && root.contains(el) && el.getAttribute("data-info")) info.textContent = el.getAttribute("data-info"); }
  [tooth, scale].forEach(function (s) { s.addEventListener("pointerover", hot); s.addEventListener("click", hot); });
  draw(); text();
}

const CSS = `
.anima .cp-box{max-width:600px;margin:0 auto;display:flex;flex-wrap:wrap;justify-content:center;align-items:flex-end;gap:4px 14px}
.anima .am-svg.cp-box svg.cp-tooth{flex:340 1 300px;width:auto;max-width:420px;overflow:hidden}
.anima .am-svg.cp-box svg.cp-scale{flex:200 1 170px;width:auto;max-width:240px}
.anima .cp-svg .cp-t{fill:var(--anatomy-text);font:12px var(--anatomy-mono);paint-order:stroke;stroke:var(--surface);stroke-width:3.5px;stroke-linejoin:round}
.anima .cp-svg .cp-strong{fill:var(--anatomy-strong);font-weight:700}
.anima .cp-svg .cp-cap{fill:var(--anatomy-muted);font-size:11px}
.anima .cp-svg .cp-call{fill:var(--anatomy-strong);font-weight:700}
.anima .cp-svg .cp-lead{fill:none;stroke:var(--anatomy-mid);stroke-width:1;pointer-events:none}
.anima .cp-svg .cp-dot{fill:var(--anatomy-strong);pointer-events:none}
.anima .cp-svg .cp-bone{fill:var(--tm-bone);stroke:var(--anatomy-lo);stroke-width:1}
.anima .cp-svg .cp-pdl{fill:var(--anatomy-faint);stroke:none}
.anima .cp-svg .cp-gum{fill:var(--tm-retro);stroke:var(--anatomy-lo);stroke-width:.8;stroke-linejoin:round}
.anima .cp-svg .cp-enamel{fill:var(--tm-disc-mid)}
.anima .cp-svg .cp-dentin{fill:#e3c98a;stroke:var(--anatomy-lo);stroke-width:.8;stroke-linejoin:round}
.anima .cp-svg .cp-pulp{fill:var(--tm-muscle);stroke:var(--anatomy-lo);stroke-width:.7;pointer-events:none}
.anima .cp-svg .cp-out{fill:none;stroke:var(--anatomy-hi);stroke-width:1.3;stroke-linejoin:round;pointer-events:none}
.anima .cp-svg .cp-hit{fill:transparent;stroke:none}
.anima .cp-svg .cp-bar{stroke:none}
.anima .cp-svg .cp-barline{fill:none;stroke:var(--anatomy-hi);stroke-width:1}
.anima .cp-svg .cp-tick{fill:none;stroke:var(--anatomy-strong);stroke-width:1.6}
.anima .cp-svg .cp-band{fill:var(--tag-rose);fill-opacity:.12;stroke:var(--tag-rose);stroke-width:1.4;stroke-dasharray:4 3;transition:fill-opacity .3s ease}
.anima .cp-svg .cp-band.on{fill-opacity:.3}
.anima .cp-svg .cp-band-t{fill:var(--tag-rose);font-weight:700;font-size:11.5px}
.anima .cp-svg .cp-arrow{fill:none;stroke:var(--anatomy-mid);stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round}
@media (prefers-reduced-motion: reduce){.anima .cp-svg .cp-band{transition:none}}
`;

export function cupping() {
  return {
    id: "cupping", lec: "nccl",
    title: "Cupped-out cusp tips",
    caption: "Wear the cusp tips down until a pinpoint of dentin shows, then compare wear alone with wear plus acid: the exposed dentin dissolves first and cups out.",
    html: `<div class="anima" data-anima="cupping">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: cpLive.toString(),
    helpers: [cpCurve, cpWear, cpSurf, cpTooth, cpScale, cpColor],
    data: DATA,
  };
}
