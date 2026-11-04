// Fig: the rule of thirds (Occlusion L7, "Occlusal therapy to establish stability": irreversible treatment). A frontal
// section of the right first molars (the same outlines as the hub's "Right first molars in MIP" figure, buccal at the
// left), with enamel and dentin. With the condyles in the desired position, slide the mandibular molar lingually: the
// maxillary palatal (centric) cusp tip then lands on the inner incline of the mandibular buccal (centric) cusp instead
// of in the central fossa. That incline is split into thirds from the fossa: a contact in the first third is selective
// grinding, in the middle third minor orthodontics and fixed prosthetics, beyond that major orthodontics, orthognathic
// surgery and prosthetics. The treatments are the notes' (the slide's labels); measuring the thirds on the centric
// cusp's inner incline, nearest the central fossa first, is the course textbook's (Okeson) as summarized in occlusal
// equilibration teaching notes. The lower tooth rides the incline as it moves (one model, thY). Schematic.
import { figureSvg, plateHtml } from "./shared.mjs";

const W = 520, H = 330;
const D = {
  W, H, K: 0.9, OX: 6, OY: 2, SMAX: 58,
  /* outlines in the source figure's units (380 x 324), y down */
  UP: [[96, 8], [84, 34], [72, 72], [78, 112], [90, 142], [101, 160], [126, 150], [150, 128], [176, 146], [204, 170], [234, 160], [256, 128], [266, 86], [258, 44], [244, 8]],
  LO: [[132, 318], [118, 286], [104, 242], [106, 200], [118, 172], [130, 156], [150, 136], [178, 160], [205, 178], [232, 160], [262, 140], [276, 160], [282, 204], [276, 252], [262, 288], [252, 318]],
  /* dentin (inside the dentinoenamel junction, on into the root), drawn by hand about 1.5-2 mm under the cusps */
  UPD: [[86, 40], [96, 80], [106, 116], [116, 132], [132, 124], [150, 102], [172, 118], [198, 138], [222, 128], [240, 104], [248, 72], [254, 42], [244, 8], [96, 8]],
  LOD: [[118, 284], [113, 238], [121, 198], [137, 176], [152, 166], [176, 186], [204, 204], [232, 188], [257, 170], [267, 196], [268, 250], [262, 286], [252, 318], [132, 318]],
  CEJ_UP: [[84, 36], [170, 44], [258, 40]], CEJ_LO: [[118, 286], [190, 278], [262, 288]],
  /* the mandibular buccal cusp's inner incline, tip to central fossa (lower tooth's own coordinates) */
  INC: [[150, 136], [178, 160], [205, 178]], PAL: [204, 170],
  ZONES: ["first", "middle", "beyond"],
};

/* the lower tooth's offset for a lingual slide s (source units): the upper palatal cusp tip, fixed, sits on the lower
   buccal cusp's inner incline at x = PAL.x - s, so the lower tooth drops by however high the incline is there */
function thY(s, D) {
  var I = D.INC, x = D.PAL[0] - Math.min(s, D.SMAX), y;
  if (x <= I[0][0]) y = I[0][1];
  else if (x <= I[1][0]) y = I[0][1] + (x - I[0][0]) / (I[1][0] - I[0][0]) * (I[1][1] - I[0][1]);
  else y = I[1][1] + (x - I[1][0]) / (I[2][0] - I[1][0]) * (I[2][1] - I[1][1]);
  return D.PAL[1] - y;
}
/* which third the contact is in: 0, 1, 2 (the incline's length from the fossa, in thirds; past the tip counts as 2) */
function thZone(s, D) { var I = D.INC, L1 = Math.hypot(I[2][0] - I[1][0], I[2][1] - I[1][1]), L0 = Math.hypot(I[1][0] - I[0][0], I[1][1] - I[0][1]), x = D.PAL[0] - s, d;
  if (x >= I[1][0]) d = Math.hypot(I[2][0] - x, (I[2][0] - x) * (I[2][1] - I[1][1]) / (I[2][0] - I[1][0])); else d = L1 + Math.min(L0, Math.hypot(I[1][0] - x, (I[1][0] - x) * (I[1][1] - I[0][1]) / (I[1][0] - I[0][0])));
  return Math.min(2, Math.floor(d / ((L0 + L1) / 3) - 1e-9)); }
function thSvg(s, D) {
  var f = function (n) { return Math.round(n * 10) / 10; }, o = "", K = D.K, dy = D.thY(s, D), z = D.thZone(s, D);
  function X(x, lo) { return D.OX + (x + (lo ? s : 0)) * K; } function Y(y, lo) { return D.OY + (y + (lo ? dy : 0)) * K; }
  function sm(pts, lo, closed) {
    var q = pts.map(function (p) { return [X(p[0], lo), Y(p[1], lo)]; }), n = q.length, d = "M" + f(q[0][0]) + " " + f(q[0][1]), last = closed ? n : n - 1;
    for (var i = 0; i < last; i++) { var p0 = q[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], p1 = q[i], p2 = q[(i + 1) % n], p3 = q[closed ? (i + 2) % n : Math.min(n - 1, i + 2)];
      d += "C" + f(p1[0] + (p2[0] - p0[0]) / 6) + " " + f(p1[1] + (p2[1] - p0[1]) / 6) + " " + f(p2[0] - (p3[0] - p1[0]) / 6) + " " + f(p2[1] - (p3[1] - p1[1]) / 6) + " " + f(p2[0]) + " " + f(p2[1]); }
    return d + (closed ? "Z" : "");
  }
  function tx(x, y, t, cls, a) { return '<text class="th-t' + (cls ? " " + cls : "") + '" x="' + f(x) + '" y="' + f(y) + '"' + (a ? ' text-anchor="' + a + '"' : "") + ">" + t + "</text>"; }
  /* teeth: enamel shell, dentin core, the CEJ */
  o += '<path class="th-enamel hot" data-info="Maxillary right first molar, cut buccolingually. Enamel is the outer shell; selective grinding is minor reshaping of enamel, never into dentin." d="' + sm(D.UP, false, true) + '"/>';
  o += '<path class="th-dentin hot" data-info="Dentin. Exposing it by grinding creates iatrogenic sensitivity: if the correction would reach dentin, restore instead." d="' + sm(D.UPD, false, true) + '"/>';
  o += '<path class="th-cej" d="' + sm(D.CEJ_UP, false, false) + '"/>';
  o += '<path class="th-enamel hot" data-info="Mandibular right first molar, closed with the condyles in the desired position (centric relation): wherever its contacts fall, that is where they are marked." d="' + sm(D.LO, true, true) + '"/>';
  o += '<path class="th-dentin" d="' + sm(D.LOD, true, true) + '"/>';
  o += '<path class="th-cej" d="' + sm(D.CEJ_LO, true, false) + '"/>';
  /* the thirds of the mandibular buccal cusp's inner incline, from the central fossa */
  var I = D.INC, seg = [], L = 0;
  for (var i = I.length - 1; i > 0; i--) { var a = I[i], b = I[i - 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); seg.push([a, b, L, L + l]); L += l; }
  function at(d) { for (var j = 0; j < seg.length; j++) { var g = seg[j]; if (d <= g[3] + 1e-9) { var t = (d - g[2]) / (g[3] - g[2]); return [g[0][0] + (g[1][0] - g[0][0]) * t, g[0][1] + (g[1][1] - g[0][1]) * t]; } } return I[0]; }
  var names = ["first third (nearest the fossa)", "middle third", "outer third, to the cusp tip"];
  for (var k = 0; k < 3; k++) { var pts = []; for (var m = 0; m <= 8; m++) pts.push(at(L * (k + m / 8) / 3)); o += '<path class="th-band th-z' + k + (k === z ? " is-on" : "") + ' hot" data-info="' + names[k] + ' of the inner incline of the mandibular buccal (centric) cusp" d="M' + pts.map(function (p) { return f(X(p[0], true)) + " " + f(Y(p[1], true) - 2.4); }).join("L") + '"/>'; }
  [0, 1, 2, 3].forEach(function (k) { var p = at(L * k / 3); o += '<circle class="th-tick" cx="' + f(X(p[0], true)) + '" cy="' + f(Y(p[1], true) - 2.4) + '" r="2"/>'; });
  /* where the maxillary palatal cusp tip lands */
  o += '<circle class="th-hit th-hz' + z + '" cx="' + f(X(D.PAL[0])) + '" cy="' + f(Y(D.PAL[1]) + 1) + '" r="5.5"/>';
  /* labels */
  o += tx(X(170), 20, "maxillary first molar", "th-cap", "middle");
  o += tx(6, 120, "BUCCAL", "th-side", "start") + tx(338, 120, "LINGUAL", "th-side", "end");
  var pt = [X(D.PAL[0]) + 4, Y(D.PAL[1]) + 3];
  o += '<g class="am-callout"><path class="am-leader" d="M' + f(X(272) - 3) + " " + f(Y(112) - 4) + "L" + f(pt[0]) + " " + f(pt[1]) + '"/><circle class="am-dot" cx="' + f(pt[0]) + '" cy="' + f(pt[1]) + '" r="1.8"/>' + tx(X(272), Y(104), "upper palatal", "", "start") + tx(X(272), Y(104) + 13, "cusp tip", "", "start") + "</g>";
  o += '<g class="am-callout"><path class="am-leader" d="M' + f(X(60)) + " " + f(Y(214) - 4) + "L" + f(X(150, true) - 2) + " " + f(Y(136, true) + 3) + '"/><circle class="am-dot" cx="' + f(X(150, true) - 2) + '" cy="' + f(Y(136, true) + 3) + '" r="1.8"/>' + tx(8, Y(214), "lower buccal", "", "start") + tx(8, Y(214) + 13, "cusp tip", "", "start") + "</g>";
  /* the three treatments */
  var TR = [["first third", "selective grinding"], ["middle third", "minor orthodontics,", "fixed prosthetics", "(most deviations)"], ["beyond that", "major orthodontics,", "orthognathic surgery,", "prosthetics"]], y0 = 46;
  TR.forEach(function (r, k) {
    var h = 18 + (r.length - 1) * 14;
    o += '<rect class="th-row' + (k === z ? " th-rz" + k : "") + '" x="344" y="' + (y0 - 15) + '" width="170" height="' + (h + 8) + '" rx="8"/>';
    o += '<circle class="th-num th-z' + k + '" cx="358" cy="' + (y0 - 4) + '" r="8"/>' + tx(358, y0, String(k + 1), "th-numt", "middle");
    o += tx(372, y0, r[0], "th-head", "start");
    for (var j = 1; j < r.length; j++) o += tx(372, y0 + j * 14, r[j], "th-cap" + (k === z ? " th-on" : ""), "start");
    y0 += h + 26;
  });
  o += tx(344, y0 + 6, "contacts marked with the", "th-cap", "start") + tx(344, y0 + 20, "condyles in the desired", "th-cap", "start") + tx(344, y0 + 34, "position", "th-cap", "start");
  o += tx(X(190, true), Math.min(D.H - 6, Y(312, true)), "mandibular first molar", "th-cap", "middle");
  return o;
}

const SUM = [
  "First third: the palatal cusp tip lands on the third of the incline nearest the central fossa. Selective grinding (equilibration): minor reshaping of enamel, avoiding exposed dentin: eliminate prematurities, then interferences, direct the centric forces axially, establish optimum occlusion.",
  "Middle third: the interarch alignment deviates farther from ideal, and grinding would expose dentin or mutilate the teeth. Minor orthodontics and fixed prosthetics instead. Most deviations fall here.",
  "Beyond that: a major deviation from the ideal interarch relation. Major orthodontics, orthognathic surgery and prosthetics.",
];

const svg = figureSvg({ width: W, height: H, className: "th-svg", label: "Frontal section of the right first molars, buccal at the left: the inner incline of the mandibular buccal cusp divided into thirds, with the maxillary palatal cusp tip landing on one of them.", body: thSvg(D.SMAX * 0.17, Object.assign({ thY, thZone }, D)) });
const plate = plateHtml({ fig: "Fig", title: "The rule of thirds", hint: "slide the lower molar", readout: "", body: `<div class="am-svg th-box">${svg}</div>` });
const controls = `<div class="am-controls"><label class="am-slider"><span>in the fossa</span><input type="range" min="0" max="100" step="1" value="17" aria-label="How far off the contact lands"><span>past the cusp tip</span></label></div>
<div class="am-controls" role="group" aria-label="Jump to a third"><button type="button" class="am-btn" data-thz="0">First third</button><button type="button" class="am-btn" data-thz="1">Middle third</button><button type="button" class="am-btn" data-thz="2">Beyond</button></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Hover or tap the enamel, the dentin or a third of the incline.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From the L7 notes (Dr. Givan's Occ Lec6 slides and the 10/29 recording): the rule of thirds simplifies the choice of irreversible treatment: mark the contacts with the condyles in the desired position; a discrepancy in the first third, selective grinding; the middle third, minor orthodontics and fixed prosthetics (most deviations are here); beyond that, major orthodontics, orthognathic surgery and prosthetics. Selective grinding reshapes enamel only.</li>
<li>Which thirds: the slide shows the rule as a picture; dividing the inner incline of a centric cusp into thirds, nearest the central fossa first, follows the course textbook (Okeson, <i>Management of Temporomandibular Disorders and Occlusion</i>) as summarized in occlusal equilibration teaching notes.</li>
<li>Schematic: the molar outlines are the hub's own frontal-section figure, with enamel and dentin drawn in by hand; the discrepancy is shown in one direction only (the mandibular molar lingual), and the tooth simply rides the incline. Educational, not clinical guidance.</li></ul></details>`;

function thLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var svg = root.querySelector(".th-svg"), slider = root.querySelector('input[type="range"]'), sum = root.querySelector(".am-summary"), info = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]");
  var s = D.SMAX * slider.value / 100, raf = 0, last = -1;
  function draw() { svg.innerHTML = D.thSvg(s, D); var z = D.thZone(s, D); if (z !== last) { sum.textContent = D.SUM[z]; if (readout) readout.textContent = ["selective grinding", "minor ortho, fixed pros", "major ortho, surgery, pros"][z]; last = z; } }
  slider.addEventListener("input", function () { cancelAnimationFrame(raf); s = D.SMAX * slider.value / 100; draw(); });
  root.querySelectorAll("[data-thz]").forEach(function (b) { b.addEventListener("click", function () {
    var k = +b.getAttribute("data-thz"), to = [0.17, 0.5, 0.9][k] * D.SMAX;
    cancelAnimationFrame(raf);
    if (reduce.matches) { s = to; slider.value = Math.round(s / D.SMAX * 100); draw(); return; }
    var from = s, t0 = performance.now();
    function step(now) { var u = Math.min(1, (now - t0) / 600), e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; s = from + (to - from) * e; slider.value = Math.round(s / D.SMAX * 100); draw(); if (u < 1) raf = requestAnimationFrame(step); }
    raf = requestAnimationFrame(step);
  }); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && svg.contains(el)) info.textContent = el.getAttribute("data-info"); }
  svg.addEventListener("pointerover", hot); svg.addEventListener("click", hot);
  draw();
}

const CSS = `
.anima .th-box{max-width:560px;margin:0 auto}
.anima .th-svg .th-t{fill:var(--anatomy-text);font:11.5px var(--anatomy-mono);paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round}
.anima .th-svg .th-head{fill:var(--anatomy-strong);font-weight:700;stroke:none}
.anima .th-svg .th-cap{fill:var(--anatomy-muted);font-size:10.5px;stroke:none}
.anima .th-svg .th-on{fill:var(--anatomy-strong)}
.anima .th-svg .th-side{fill:var(--anatomy-muted);font-size:10.5px;letter-spacing:.08em;stroke:none}
.anima .th-svg .th-enamel{fill:var(--tm-disc-mid);stroke:var(--anatomy-hi);stroke-width:1.3;stroke-linejoin:round}
.anima .th-svg .th-dentin{fill:var(--tm-bone);stroke:var(--anatomy-lo);stroke-width:.9;stroke-linejoin:round}
.anima .th-svg .th-cej{fill:none;stroke:var(--anatomy-mid);stroke-width:1}
.anima .th-svg .th-band{fill:none;stroke-width:5;stroke-linecap:butt;opacity:.55}
.anima .th-svg .th-band.is-on{opacity:1;stroke-width:6}
.anima .th-svg .th-z0{stroke:#2f8a5b;fill:#2f8a5b}
.anima .th-svg .th-z1{stroke:var(--tm-lig);fill:var(--tm-lig)}
.anima .th-svg .th-z2{stroke:var(--tm-vessel);fill:var(--tm-vessel)}
.anima .th-svg .th-tick{fill:var(--anatomy-hi)}
.anima .th-svg .th-hit{fill:none;stroke-width:2.6}
.anima .th-svg .th-hz0{stroke:#2f8a5b}.anima .th-svg .th-hz1{stroke:var(--tm-lig)}.anima .th-svg .th-hz2{stroke:var(--tm-vessel)}
.anima .th-svg .th-row{fill:transparent;stroke:var(--line);stroke-width:1}
.anima .th-svg .th-rz0,.anima .th-svg .th-rz1,.anima .th-svg .th-rz2{fill:var(--anatomy-shade-2);stroke:var(--anatomy-mid)}
.anima .th-svg .th-num{stroke:none}
.anima .th-svg .th-numt{fill:#fff;font-weight:700;font-size:11px;stroke:none}
`;

export function thirds() {
  return {
    id: "thirds", lec: "malocclusion",
    title: "The rule of thirds",
    caption: "With the condyles in the desired position, slide the mandibular molar off its ideal: where the maxillary palatal cusp tip lands on the opposing incline picks the treatment.",
    html: `<div class="anima" data-anima="thirds">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: thLive.toString(),
    helpers: [thY, thZone, thSvg],
    data: Object.assign({ SUM }, D),
  };
}
