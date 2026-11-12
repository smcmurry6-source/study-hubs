// Fig 29: measuring mobility (Occlusion L10, "Tooth mobility and occlusal trauma"; Dr. Abou-Arraj).
// The same premolar as Figs 27 and 28 (l10tooth.mjs), drawn to scale (18 px a millimeter, the ruler's millimeters are the
// tooth's), cut cheek to tongue down to about 6 mm below the CEJ. Two rigid instrument handles rock it buccolingually; a
// fixed millimeter scale above the crown shows how far the buccal cusp tip travels, shaded. His degrees: 0 physiologic
// (0.1-0.2 mm, nothing you can see), 1 up to 1 mm horizontally, 2 more than 1 mm, 3 horizontal and vertical (press on the
// occlusal surface and it moves into the socket). The ligament is drawn a little wider for the higher degrees (mobility
// depends on its width). A Fremitus view: the patient taps, the opposing premolar's lingual cusp meets the buccal cusp's
// inner incline and pushes the crown to the buccal, and a finger on the facial gingiva feels it move.
import { figureSvg, plateHtml } from "./shared.mjs";
import { TOOTH, SUPPORT, otSmooth, otPose, otRootBelow, otSocket, otText, otLab, otGumPose } from "./l10tooth.mjs";

const MW = 350, MH = 340;
const DATA = Object.assign({}, TOOTH, {
  MW, MH, V: { OX: 175, OY: 200, S: 18 }, SUP: SUPPORT.n,
  /* how far the buccal cusp tip travels, side to side (mm), in each degree (illustrative values inside his ranges), how
     far degree 3 sinks (mm), and the ligament's width (mm) drawn for each */
  RANGE: { 0: 0.15, 1: 0.8, 2: 1.5, 3: 1.8 }, SINK: 0.6, WID: { 0: 0.25, 1: 0.3, 2: 0.42, 3: 0.5, f: 0.5 },
  /* fremitus: the opposing cusp closes 0.3 mm past first contact on the buccal cusp's inner incline, pushing the crown
     about 0.5 mm to the buccal */
  FDROP: 0.3, FPUSH: 0.48,
  TIP: [-0.5, 8.1], HB: [-3.76, 4.2], HL: [3.86, 4.2], LCUSP: [2.3, 7.1], FC: [0.15, 7.78],
  /* the opposing upper premolar's crown (enamel outline and dentin), its lingual cusp on the lower buccal cusp's inner
     incline (the premature contact), its buccal cusp outside the lower one, 9 mm buccolingually; its root runs off the top */
  UPPER: [[-6.3, 16], [-6.55, 13.2], [-6.45, 11.3], [-5.9, 9.4], [-5.2, 7.7], [-4.6, 6.95], [-3.9, 7.4], [-2.9, 8.5], [-1.9, 9.25], [-1.0, 8.9], [-0.35, 8.3], [0.15, 7.78], [0.75, 8.1], [1.6, 8.9], [2.2, 10.1], [2.45, 12.0], [2.2, 16]],
  UPPER_D: [[-5.2, 16], [-5.4, 12.6], [-5.0, 10.4], [-4.3, 9.1], [-3.2, 9.9], [-1.9, 10.7], [-0.6, 10.2], [0.4, 9.7], [1.15, 10.5], [1.35, 12.6], [1.15, 16]],
  HOT: {
    tooth: "The tooth: a premolar cut cheek to tongue, buccal on the left, drawn to the ruler's scale.",
    pdl: "The periodontal ligament. A tooth's horizontal mobility depends on the height of the alveolar bone, the width of the PDL, and the shape and number of roots.",
    bone: "The alveolar bone: the higher it reaches, the less the tooth moves.",
    gum: "The gingiva.",
    inst: "Two rigid instruments, one on each side: move the tooth buccolingually between them.",
    press: "Degree 3: press on the occlusal surface and the tooth moves into the socket.",
    ruler: "A millimeter scale, fixed: the shaded band is how far the cusp tip travels side to side.",
    ghost: "How far the crown goes each way.",
    rest: "Where the tooth sat before it was pressed.",
    finger: "A finger resting on the facial gingiva feels the tooth move each time the teeth meet: fremitus.",
    opp: "The opposing tooth: the patient taps the teeth together.",
  },
});
const NOTE = "Dr. Givan's L7 handout grades Miller's index differently: 1 barely distinguishable, 2 any horizontal movement up to 1 mm, 3 more than 1 mm, or depressed or rotated. Both put vertical movement in the top grade. When a question names this lecture, use Dr. Abou-Arraj's degrees.";

/* the tooth's swing for a degree: degrees of tilt that move the cusp tip half the range */
function otmAmp(deg, D) { var t = D.TIP, c = D.SUP.c; return (D.RANGE[deg] / 2) / Math.hypot(t[0] - c[0], t[1] - c[1]) * 180 / Math.PI; }
function otmFA(D) { var p = D.FC, c = D.SUP.c; return -D.FPUSH / Math.hypot(p[0] - c[0], p[1] - c[1]) * 180 / Math.PI; }
/* where everything is at time t (ms) in a degree's loop: rock it to the lingual and to the buccal (twice for degree 3,
   then press it down); fremitus: the opposing cusp closes, pushes the crown buccally, opens */
function otmAt(deg, t, D) {
  var st = { deg: deg, a: 0, v: 0, push: 0, gap: 1.5 }, L = 2000;
  if (deg === "f") {
    var q = (t % 1400) / 1400, e = function (x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }, k;
    if (q < 0.35) st.gap = 1.5 * (1 - e(q / 0.35));
    else if (q < 0.5) { k = e((q - 0.35) / 0.15); st.gap = -D.FDROP * k; st.a = D.otmFA(D) * k; }
    else if (q < 0.62) { st.gap = -D.FDROP; st.a = D.otmFA(D); }
    else { k = e((q - 0.62) / 0.38); st.gap = -D.FDROP + (1.5 + D.FDROP) * k; st.a = D.otmFA(D) * Math.max(0, 1 - k * 4); }
    return st;
  }
  var tot = deg === "3" ? 2 * L + 1700 : L, p = t % tot;
  if (p < 2 * L || deg !== "3") { var s = Math.sin(2 * Math.PI * (p % L) / L); st.a = D.otmAmp(deg, D) * s; st.push = s > 0.04 ? 1 : s < -0.04 ? -1 : 0; }
  else { st.v = D.SINK * (1 - Math.cos(2 * Math.PI * (p - 2 * L) / 1700)) / 2; }
  return st;
}
/* the still pictures for reduced motion: rest, pushed to the lingual, pushed to the buccal (and pressed, degree 3);
   fremitus: apart, then together */
function otmStill(deg, i, D) {
  var st = { deg: deg, a: 0, v: 0, push: 0, gap: 1.5 };
  if (deg === "f") { if (i % 2) { st.gap = -D.FDROP; st.a = D.otmFA(D); } return st; }
  var n = i % (deg === "3" ? 4 : 3), A = D.otmAmp(deg, D);
  if (n === 1) { st.a = A; st.push = 1; } else if (n === 2) { st.a = -A; st.push = -1; } else if (n === 3) st.v = D.SINK;
  return st;
}
function otmScene(st, D) {
  var f = function (n) { return Math.round(n * 10) / 10; }, V = D.V, S = D.SUP, o = "", fr = st.deg === "f", W = D.WID[st.deg];
  var pose = { a: st.a, c: S.c, v: st.v };
  function P(p) { return [V.OX + p[0] * V.S, V.OY - p[1] * V.S]; }
  function SM(pts, closed, map) { return D.otSmooth(pts.map(map || P), closed); }
  function Q(ps) { return function (p) { return P(D.otPose(p, ps)); }; }
  var TQ = Q(pose), mir = function (pts) { return pts.map(function (p) { return [-p[0], p[1]]; }); };
  var sock = D.otSocket(D.otRootBelow(S.crest, D), function () { return W; }), rimL = sock[0], rimB = sock[sock.length - 1];
  var bone = S.BONE.concat([[rimB[0] - 0.05, rimB[1]]], [[rimL[0] + 0.05, rimL[1]]], mir(S.BONE).reverse());
  o += '<path class="ot-bone hot" data-info="' + D.HOT.bone + '" d="' + SM(bone, false) + 'Z"/>';
  o += '<path class="ot-pdl hot" data-info="' + D.HOT.pdl + '" d="' + SM(sock, false) + 'Z"/>';
  [S.GUM, mir(S.GUM)].forEach(function (g) { o += '<path class="ot-gum hot" data-info="' + D.HOT.gum + '" d="' + SM(D.otGumPose(g, pose, null, D), false) + 'Z"/>'; });
  /* the finger on the facial gingiva (fremitus), its pad against the gum, its nail on top */
  if (fr) {
    var fc = [-7.85, -4.0], fr2 = 2.6, a0 = P([-30, fc[1] + fr2]), a1 = P([fc[0], fc[1] + fr2]), a2 = P([fc[0], fc[1] - fr2]), a3 = P([-30, fc[1] - fr2]), R2 = fr2 * V.S;
    o += '<path class="ot-finger hot" data-info="' + D.HOT.finger + '" d="M' + f(a0[0]) + " " + f(a0[1]) + "L" + f(a1[0]) + " " + f(a1[1]) + "A" + f(R2) + " " + f(R2) + " 0 0 1 " + f(a2[0]) + " " + f(a2[1]) + "L" + f(a3[0]) + " " + f(a3[1]) + 'Z"/>';
    var n0 = P([-11.2, fc[1] + fr2]), n1 = P([-7.9, fc[1] + fr2 - 0.15]);
    o += '<path class="ot-nail" d="M' + f(n0[0]) + " " + f(n0[1] + 2) + "Q" + f((n0[0] + n1[0]) / 2) + " " + f(n0[1] - 5) + " " + f(n1[0]) + " " + f(n1[1] + 3) + '"/>';
    /* what the finger feels, while the crown is pushed */
    var buzz = Math.min(1, Math.abs(st.a / D.otmFA(D)));
    if (buzz > 0.2) { var bp = P([-5.1, -4.0]); [8, 13, 18].forEach(function (r) { o += '<path class="ot-buzz" style="stroke-opacity:' + f(buzz * 100) / 100 + '" d="M' + f(bp[0] - r * 0.5) + " " + f(bp[1] - r) + "Q" + f(bp[0] - r * 1.1) + " " + f(bp[1]) + " " + f(bp[0] - r * 0.5) + " " + f(bp[1] + r) + '"/>'; }); }
  }
  /* the crown at both ends of its swing (dashed), or where it sat before it was pressed or pushed */
  if (!fr && st.v <= 0.05) { var A = D.otmAmp(st.deg, D); if (A > 0.2) [-1, 1].forEach(function (sg) { o += '<path class="ot-ghost hot" data-info="' + D.HOT.ghost + '" d="' + SM(D.CROWN, false, Q({ a: sg * A, c: S.c })) + '"/>'; }); }
  if (st.v > 0.05 || (fr && st.a < -0.2)) o += '<path class="ot-ghost hot" data-info="' + D.HOT.rest + '" d="' + SM(D.CROWN, false, Q({ a: 0, c: S.c })) + '"/>';
  var tooth = D.CROWN.slice(0, -1).concat(D.ROOT.slice(0, -1)), dent = D.DEJ.slice(0, -1).concat(D.ROOT.slice(0, -1));
  o += '<g class="hot" data-info="' + D.HOT.tooth + '"><path class="ot-enamel" d="' + SM(tooth, true, TQ) + '"/><path class="ot-dentin" d="' + SM(dent, true, TQ) + '"/><path class="ot-pulp" d="' + SM(D.PULP, true, TQ) + '"/><path class="ot-out" d="' + SM(tooth, true, TQ) + '"/></g>';
  function arrow(x0, y0, x1, y1) { var l = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / l, uy = (y1 - y0) / l;
    return '<path class="ot-force" d="M' + f(x0) + " " + f(y0) + "L" + f(x1 - ux * 2) + " " + f(y1 - uy * 2) + "M" + f(x1 - ux * 8 - uy * 5) + " " + f(y1 - uy * 8 + ux * 5) + "L" + f(x1) + " " + f(y1) + "L" + f(x1 - ux * 8 + uy * 5) + " " + f(y1 - uy * 8 - ux * 5) + '"/>'; }
  if (!fr) {
    /* the two instrument handles, their ends on the crown's buccal and lingual surfaces at the height of contour */
    var hb = TQ(D.HB), hl = TQ(D.HL), r = 5.5;
    function handle(x0, x1, y, side) { var a = Math.min(x0, x1), b = Math.max(x0, x1), g = "";
      g += '<rect class="ot-inst" x="' + f(a) + '" y="' + f(y - r) + '" width="' + f(b - a) + '" height="' + f(2 * r) + '" rx="' + r + '"/>';
      for (var i = 0; i < 6; i++) { var kx = side < 0 ? 12 + i * 5 : D.MW - 12 - i * 5; g += '<path class="ot-knurl" d="M' + f(kx) + " " + f(y - r + 1.5) + "V" + f(y + r - 1.5) + '"/>'; }
      return g; }
    o += '<g class="hot" data-info="' + D.HOT.inst + '">' + handle(-12, hb[0] - 0.5, hb[1], -1) + handle(hl[0] + 0.5, D.MW + 12, hl[1], 1) + "</g>";
    if (st.push > 0) o += arrow(hb[0] - 46, hb[1] - 15, hb[0] - 14, hb[1] - 15);
    if (st.push < 0) o += arrow(hl[0] + 46, hl[1] - 15, hl[0] + 14, hl[1] - 15);
    if (st.deg === "3") {
      var lc = TQ(D.LCUSP);
      o += '<g class="hot" data-info="' + D.HOT.press + '"><rect class="ot-inst" x="' + f(lc[0] - r) + '" y="-12" width="' + f(2 * r) + '" height="' + f(lc[1] - 0.5 + 12) + '" rx="' + r + '"/></g>';
      if (st.v > 0.05) o += arrow(lc[0] + 16, lc[1] - 40, lc[0] + 16, lc[1] - 8);
      o += D.otText(lc[0] + 12, 18, ["press"], "ot-strong", "start");
      if (st.v > 0.05) o += D.otLab(["moves into", "the socket"], D.MW - 8, 160, TQ([3.62, 1.2]), "end", "", D);
    }
    /* the millimeter scale, fixed above the cusp tip: the band is the tip's travel, the needle where it is now */
    var RY = 26, tx0 = V.OX + D.TIP[0] * V.S, half = D.RANGE[st.deg] / 2 * V.S, tip = TQ(D.TIP);
    o += '<g class="hot" data-info="' + D.HOT.ruler + '"><rect class="ot-band-r" x="' + f(tx0 - half) + '" y="' + (RY + 1) + '" width="' + f(Math.max(1.5, 2 * half)) + '" height="7"/>';
    o += '<path class="ot-rule" d="M' + f(tx0 - 1.5 * V.S) + " " + RY + "H" + f(tx0 + 1.5 * V.S);
    for (var m = -3; m <= 3; m++) o += "M" + f(tx0 + m * 0.5 * V.S) + " " + RY + "V" + (RY + (m % 2 ? 4 : 8));
    o += '"/><path class="ot-rule" d="M' + f(tx0) + " " + (RY - 5) + "V" + (RY - 9) + "H" + f(tx0 + V.S) + "V" + (RY - 5) + '"/></g>';
    o += D.otText(tx0 + V.S / 2, RY - 13, ["1 mm"], "ot-cap", "middle");
    o += '<path class="ot-needle" d="M' + f(tip[0]) + " " + f(tip[1] - 2) + "L" + f(tx0 + (tip[0] - tx0)) + " " + (RY + 9) + '"/>';
    o += D.otText(tx0 - 1.5 * V.S - 8, RY + 7, [(st.deg === "0" ? "0.1-0.2 mm" : "moves " + D.RANGE[st.deg] + " mm")], "ot-strong", "end");
    o += D.otLab(["two rigid", "instruments"], 8, hb[1] + 40, [80, hb[1] + r], "start", "", D);
  } else {
    /* the opposing tooth's cusp, closing onto the buccal cusp's inner incline */
    var g = st.gap, up = function (p) { return P([p[0], p[1] + g]); };
    o += '<g class="hot" data-info="' + D.HOT.opp + '"><path class="ot-enamel" d="' + SM(D.UPPER, true, up) + '"/><path class="ot-dentin" d="' + SM(D.UPPER_D, true, up) + '"/><path class="ot-out" d="' + SM(D.UPPER, true, up) + '"/></g>';
    if (g < 0.6) o += arrow(V.OX + 62, 10, V.OX + 62, 40);
    o += D.otText(V.OX + 74, 22, ["the patient", "taps"], "ot-strong", "start");
    o += D.otLab(["finger on the", "facial gingiva"], 8, 170, P([-9.6, fc[1] + fr2]), "start", "", D);
  }
  o += D.otText(10, D.MH - 8, ["buccal"], "ot-cap", "start") + D.otText(D.MW - 10, D.MH - 8, ["lingual"], "ot-cap", "end");
  return o;
}
function otmText(deg) {
  return {
    0: "Degree 0: physiologic mobility, 0.1-0.2 mm horizontally: no movement you can see. Every healthy tooth moves this much in its ligament.",
    1: "Degree 1: increased mobility of the crown, at most 1 mm horizontally. To measure it, move the tooth buccolingually between two rigid instruments.",
    2: "Degree 2: visibly increased mobility, more than 1 mm horizontally. Mobility is a sign of adaptation: a tooth with Class 2 mobility doesn't have a hopeless prognosis, so look for why it is mobile.",
    3: "Degree 3: severe, horizontal and vertical: press on the occlusal surface and it moves into the socket (down, for this lower premolar), impinging on function. Class 3 makes the prognosis much worse.",
    f: "Fremitus: a palpable or visible movement of a tooth when subjected to occlusal forces. Have the patient tap their teeth together with a finger resting on the facial gingiva: if you feel the tooth move, it is being pushed every time the teeth meet. It shows mostly on anterior teeth. It isn't part of the mobility classification, but a tooth with fremitus usually has Class 3 mobility.",
  }[deg];
}
function otmRead(deg) { return { 0: "degree 0: 0.1-0.2 mm", 1: "degree 1: up to 1 mm", 2: "degree 2: over 1 mm", 3: "degree 3: vertical too", f: "fremitus" }[deg]; }

const ST0 = { deg: "1", a: 0, v: 0, push: 0, gap: 1.5 };
const ctx = Object.assign({ otSmooth, otPose, otRootBelow, otSocket, otText, otLab, otGumPose, otmAmp, otmFA }, DATA);
const svg = figureSvg({ width: MW, height: MH, className: "ot-svg otm-svg", label: "A premolar in buccolingual section, drawn to scale, between two rigid instrument handles that rock it buccolingually; a millimeter scale above the crown shows how far the cusp tip travels.", body: otmScene(ST0, ctx) });
const plate = plateHtml({ fig: "Fig 29", title: "Measuring tooth mobility", hint: "pick a degree", readout: otmRead("1"), body: `<div class="am-svg otm-box">${svg}</div>` });
const controls = `<div class="am-controls" role="group" aria-label="Mobility"><span class="ot-lbl">Degree</span><button type="button" class="am-btn" data-otdeg="0" aria-pressed="false">0</button><button type="button" class="am-btn" data-otdeg="1" aria-pressed="true">1</button><button type="button" class="am-btn" data-otdeg="2" aria-pressed="false">2</button><button type="button" class="am-btn" data-otdeg="3" aria-pressed="false">3</button><button type="button" class="am-btn" data-otdeg="f" aria-pressed="false">Fremitus</button><button type="button" class="am-btn" data-otmgo="1">Pause</button></div>
<p class="am-summary" aria-live="polite">${otmText("1")}</p>
<p class="ot-note">${NOTE}</p>
<p class="am-info">Hover or tap the instruments, the scale, the ligament or the dashed outlines.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From the L10 notes (Dr. Abou-Arraj): move the tooth buccolingually between two rigid instruments; his scale (Miller's): 0 physiologic mobility, 0.1-0.2 mm horizontally, no movement you can see; 1 increased mobility of the crown, at most 1 mm horizontally; 2 visibly increased, more than 1 mm horizontally; 3 severe, horizontal and vertical (press on the occlusal surface and it moves into the socket), impinging on function. Horizontal mobility depends on the height of the alveolar bone, the width of the PDL and the shape and number of roots. Fremitus: a palpable or visible movement of a tooth when subjected to occlusal forces; tap the teeth together with a finger on the facial gingiva; mostly anterior teeth; not part of the classification, but a tooth with fremitus usually has Class 3 mobility. Dr. Givan's L7 handout numbers the grades differently (above the controls).</li>
<li>Outside sources: Miller's mobility index (S. C. Miller, Textbook of Periodontia, 1938 and later editions); Mühlemann's tooth-mobility measurements (periodontometry), which put a healthy tooth's physiologic horizontal movement at about a tenth to two tenths of a millimeter; Lindhe, Lang and Karring, Clinical Periodontology and Implant Dentistry, on mobility, the ligament's width and fremitus. Tooth size from Wheeler's Dental Anatomy (mandibular second premolar).</li>
<li>Drawn to scale: the ruler's millimeters are the tooth's, so degree 0 really is too small to see. How far each degree moves here, how far degree 3 sinks, and the ligament's extra width for the higher degrees are illustrative values, not measurements. The lecture's "moves up into the socket" is for an upper tooth; this lower premolar moves down. Fremitus is drawn on this premolar for the scale; it shows mostly on anterior teeth.</li></ul></details>`;

function otmLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var svg = root.querySelector(".otm-svg"), sum = root.querySelector(".am-summary"), info = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]");
  var degs = root.querySelectorAll("[data-otdeg]"), go = root.querySelector("[data-otmgo]");
  var deg = "1", raf = 0, t0 = 0, playing = !reduce.matches, seen = true, still = 0;
  function show(st) { svg.innerHTML = D.otmScene(st, D); }
  function frame(now) { show(D.otmAt(deg, now - t0, D)); raf = requestAnimationFrame(frame); }
  function run() { cancelAnimationFrame(raf); if (playing && seen && !reduce.matches) { t0 = performance.now(); raf = requestAnimationFrame(frame); } else show(D.otmStill(deg, still, D)); }
  function label() { go.textContent = reduce.matches ? "Next position" : playing ? "Pause" : "Play"; }
  go.addEventListener("click", function () {
    if (reduce.matches) { still++; show(D.otmStill(deg, still, D)); return; }
    playing = !playing; still = 0; label(); run();
  });
  degs.forEach(function (b) { b.addEventListener("click", function () {
    deg = b.getAttribute("data-otdeg"); still = 0;
    degs.forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
    sum.textContent = D.otmText(deg); if (readout) readout.textContent = D.otmRead(deg); run(); }); });
  /* only while it is on screen */
  if (window.IntersectionObserver) new IntersectionObserver(function (es) { var v = es[es.length - 1].isIntersecting; if (v !== seen) { seen = v; run(); } }).observe(svg);
  if (reduce.addEventListener) reduce.addEventListener("change", function () { playing = !reduce.matches; label(); run(); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && root.contains(el) && el.getAttribute("data-info")) info.textContent = el.getAttribute("data-info"); }
  svg.addEventListener("pointerover", hot); svg.addEventListener("click", hot);
  label(); run();
}

const CSS = `
.anima .otm-box{max-width:420px;margin:0 auto}
.anima .ot-svg .ot-inst{fill:var(--anatomy-shade-2);stroke:var(--anatomy-hi);stroke-width:1.1}
.anima .ot-svg .ot-knurl{fill:none;stroke:var(--anatomy-mid);stroke-width:1}
.anima .ot-svg .ot-rule{fill:none;stroke:var(--anatomy-hi);stroke-width:1}
.anima .ot-svg .ot-band-r{fill:var(--anatomy-lit);fill-opacity:.35}
.anima .ot-svg .ot-needle{fill:none;stroke:var(--anatomy-lit);stroke-width:1.2}
.anima .ot-svg .ot-finger{fill:#ebc6a8;stroke:var(--anatomy-lo);stroke-width:1}
.anima .ot-svg .ot-nail{fill:none;stroke:#f6e3d3;stroke-width:4;stroke-linecap:round}
.anima .ot-svg .ot-buzz{fill:none;stroke:var(--anatomy-strong);stroke-width:1.4;stroke-linecap:round}
.anima .ot-note{font-size:.8rem;line-height:1.45;color:var(--ink-soft);margin:6px 0;padding:6px 10px;border-radius:8px;background:var(--anatomy-shade-3)}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]) .anima .ot-svg .ot-finger{fill:#9c7659} :root:not([data-theme="light"]) .anima .ot-svg .ot-nail{stroke:#bf9a7e} }
:root[data-theme="dark"] .anima .ot-svg .ot-finger{fill:#9c7659}
:root[data-theme="dark"] .anima .ot-svg .ot-nail{stroke:#bf9a7e}
`;

export function otmobility() {
  return {
    id: "otmobility", lec: "occtrauma",
    title: "Measuring tooth mobility",
    caption: "Rock the tooth buccolingually between two rigid instruments and read how far the crown travels: degrees 0 to 3, drawn to scale, and fremitus.",
    html: `<div class="anima" data-anima="otmobility">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: otmLive.toString(),
    helpers: [otSmooth, otPose, otRootBelow, otSocket, otText, otLab, otGumPose, otmAmp, otmFA, otmAt, otmStill, otmScene, otmText, otmRead],
    data: DATA,
  };
}
