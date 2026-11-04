// Fig 18: the rule of thirds (Occlusion L7, "Occlusal therapy to establish stability": irreversible treatment). A
// frontal section of the right first molars (the same outlines as the hub's "Right first molars in MIP" figure, buccal
// at the left), with enamel and dentin; the root trunks fade out. The upper buccal and palatal cusps and the lower
// buccal cusp are labeled. With the condyles in the desired position, slide the mandibular molar lingually: the
// maxillary palatal (centric) cusp tip then lands on the inner incline of the mandibular buccal (centric) cusp instead
// of in the central fossa. That incline is split into thirds, numbered 1-3 from the fossa: a contact in the first third
// is selective grinding, in the middle third minor orthodontics and fixed prosthetics, beyond that major orthodontics,
// orthognathic surgery and prosthetics. The treatments are the notes' (the slide's labels); the notes say "the first
// third of the tooth" without saying which end, so measuring the thirds on the centric cusp's inner incline, nearest the
// central fossa first, is the course textbook's (Okeson) as summarized in occlusal equilibration teaching notes. The
// lower tooth rides the incline as it moves (one model, thY). The treatment list is HTML beside the drawing, so it
// wraps under it on a phone. Schematic.
import { figureSvg, plateHtml } from "./shared.mjs";

const W = 360, H = 330;
const D = {
  W, H, K: 0.95, OX: 10, OY: 4, SMAX: 58,
  /* outlines in the source figure's units (380 x 324), y down; the root trunks run on past the plate's edges, where
     they fade out */
  UP: [[100, -24], [84, 34], [72, 72], [78, 112], [90, 142], [101, 160], [126, 150], [150, 128], [176, 146], [204, 170], [234, 160], [256, 128], [266, 86], [258, 44], [240, -24]],
  LO: [[138, 372], [118, 286], [104, 242], [106, 200], [118, 172], [130, 156], [150, 136], [178, 160], [205, 178], [232, 160], [262, 140], [276, 160], [282, 204], [276, 252], [262, 288], [246, 372]],
  /* dentin (inside the dentinoenamel junction, on into the root), drawn by hand about 1.5-2 mm under the cusps */
  UPD: [[86, 40], [96, 80], [106, 116], [116, 132], [132, 124], [150, 102], [172, 118], [198, 138], [222, 128], [240, 104], [248, 72], [254, 42], [237, -24], [103, -24]],
  LOD: [[118, 284], [113, 238], [121, 198], [137, 176], [152, 166], [176, 186], [204, 204], [232, 188], [257, 170], [267, 196], [268, 250], [262, 286], [243, 372], [141, 372]],
  CEJ_UP: [[84, 36], [170, 44], [258, 40]], CEJ_LO: [[118, 286], [190, 278], [262, 288]],
  /* the mandibular buccal cusp's inner incline, tip to central fossa (lower tooth's own coordinates) */
  INC: [[150, 136], [178, 160], [205, 178]], PAL: [204, 170], UB: [101, 160],
  /* the root trunks fade into the page above and below (screen px: opaque edge, clear edge) */
  FADE: { top: [6, 52], bot: [328, 280] },
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
  /* a label (lines from x, y, anchor a) with a leader from its box to a dot at p (screen) */
  function lab(lines, x, y, a, p, info) {
    var w = Math.max.apply(null, lines.map(function (t) { return t.length; })) * 6.3, x0 = a === "end" ? x - w : x, bx = [x0 - 3, y - 10, x0 + w + 3, y + (lines.length - 1) * 13 + 3];
    var sx = Math.min(Math.max(p[0], bx[0]), bx[2]), sy = Math.min(Math.max(p[1], bx[1]), bx[3]), d = Math.hypot(p[0] - sx, p[1] - sy);
    return '<g class="th-call hot" data-info="' + info + '">' + (d > 4 ? '<path class="am-leader" d="M' + f(sx) + " " + f(sy) + "L" + f(p[0]) + " " + f(p[1]) + '"/>' : "") + '<circle class="am-dot" cx="' + f(p[0]) + '" cy="' + f(p[1]) + '" r="1.8"/>' + lines.map(function (t, i) { return tx(x, y + i * 13, t, "th-lab", a); }).join("") + "</g>";
  }
  /* teeth: enamel shell, dentin core, the CEJ */
  o += '<path class="th-enamel hot" data-info="Maxillary right first molar, cut buccolingually. Enamel is the outer shell; selective grinding is minor reshaping of enamel, never into dentin." d="' + sm(D.UP, false, true) + '"/>';
  o += '<path class="th-dentin hot" data-info="Dentin. Exposing it by grinding creates iatrogenic sensitivity: if the correction would reach dentin, restore instead." d="' + sm(D.UPD, false, true) + '"/>';
  o += '<path class="th-cej" d="' + sm(D.CEJ_UP, false, false) + '"/>';
  o += '<path class="th-enamel hot" data-info="Mandibular right first molar, closed with the condyles in the desired position (centric relation): wherever its contacts fall, that is where they are marked." d="' + sm(D.LO, true, true) + '"/>';
  o += '<path class="th-dentin hot" data-info="Dentin. Exposing it by grinding creates iatrogenic sensitivity: if the correction would reach dentin, restore instead." d="' + sm(D.LOD, true, true) + '"/>';
  o += '<path class="th-cej" d="' + sm(D.CEJ_LO, true, false) + '"/>';
  /* the root trunks fade out: side-by-side page-colored bands from the clear edge to the opaque one, then solid page
     color to the plate's edge (each pixel painted once, so the color can't drift in the dark theme) */
  [D.FADE.top, D.FADE.bot].forEach(function (e, t) { var a = e[0], b = e[1], n = 16, end = t ? D.H + 2 : -2;
    for (var k = 0; k <= n; k++) { var m0 = b + (a - b) * k / n, m1 = k === n ? end : b + (a - b) * (k + 1) / n, op = k === n ? 1 : Math.round(1000 * (k + 0.5) / n) / 1000;
      var ya = f(Math.min(m0, m1)), yb = f(Math.max(m0, m1)); /* edges rounded first: no seams between bands */
      o += '<rect class="th-fog" x="-2" y="' + ya + '" width="' + (D.W + 4) + '" height="' + f(yb - ya) + '" style="fill-opacity:' + op + '"/>'; } });
  /* the thirds of the mandibular buccal cusp's inner incline, numbered from the central fossa */
  var I = D.INC, seg = [], L = 0;
  for (var i = I.length - 1; i > 0; i--) { var a = I[i], b = I[i - 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); seg.push([a, b, L, L + l]); L += l; }
  function at(d) { for (var j = 0; j < seg.length; j++) { var g = seg[j]; if (d <= g[3] + 1e-9) { var t = (d - g[2]) / (g[3] - g[2]); return [g[0][0] + (g[1][0] - g[0][0]) * t, g[0][1] + (g[1][1] - g[0][1]) * t]; } } return I[0]; }
  var names = ["1, the first third (nearest the central fossa)", "2, the middle third", "3, the outer third, out to the cusp tip"];
  for (var k = 0; k < 3; k++) {
    var pts = []; for (var m = 0; m <= 8; m++) pts.push(at(L * (k + m / 8) / 3));
    var info = names[k] + " of the inner incline of the mandibular buccal (centric) cusp";
    o += '<path class="th-band th-z' + k + (k === z ? " is-on" : "") + ' hot" data-info="' + info + '" d="M' + pts.map(function (p) { return f(X(p[0], true)) + " " + f(Y(p[1], true) - 2.4); }).join("L") + '"/>';
    /* its number, in the lower tooth just under the band's middle */
    var p0 = at(L * k / 3), p1 = at(L * (k + 1) / 3), mx = X((p0[0] + p1[0]) / 2, true), my = Y((p0[1] + p1[1]) / 2, true), ux = (p1[0] - p0[0]), uy = (p1[1] - p0[1]), ul = Math.hypot(ux, uy);
    var nx = mx + uy / ul * 12.5, ny = my - ux / ul * 12.5; /* the normal pointing into the lower tooth */
    if (ny < my) { nx = mx - uy / ul * 12.5; ny = my + ux / ul * 12.5; }
    o += '<g class="hot' + (k === z ? " is-on" : "") + '" data-info="' + info + '"><circle class="th-num th-z' + k + (k === z ? " is-on" : "") + '" cx="' + f(nx) + '" cy="' + f(ny) + '" r="6.5"/>' + tx(nx, ny + 3.8, String(k + 1), "th-numt", "middle") + "</g>";
  }
  [0, 1, 2, 3].forEach(function (k) { var p = at(L * k / 3); o += '<circle class="th-tick" cx="' + f(X(p[0], true)) + '" cy="' + f(Y(p[1], true) - 2.4) + '" r="1.8"/>'; });
  /* where the maxillary palatal cusp tip lands */
  o += '<circle class="th-hit th-hz' + z + '" cx="' + f(X(D.PAL[0])) + '" cy="' + f(Y(D.PAL[1]) + 1) + '" r="5.5"/>';
  /* labels */
  o += tx(4, 18, "BUCCAL", "th-side", "start") + tx(D.W - 4, 18, "LINGUAL", "th-side", "end");
  o += tx(X(172), 18, "maxillary first molar", "th-cap", "middle") + tx(X(194), D.H - 8, "mandibular first molar", "th-cap", "middle");
  o += lab(["upper", "buccal cusp"], 4, Y(D.UB[1]) - 8, "start", [X(D.UB[0]) - 1.5, Y(D.UB[1]) + 1.5], "The maxillary buccal cusp: a noncentric cusp, outside the lower tooth.");
  o += lab(["upper", "palatal cusp"], D.W - 4, Y(100), "end", [X(D.PAL[0]) + 1.5, Y(D.PAL[1]) - 0.5], "The maxillary palatal (lingual) cusp: a centric cusp. Its tip is the contact being marked: ideally in the mandibular central fossa.");
  o += lab(["lower", "buccal cusp"], 4, Y(214), "start", [X(D.INC[0][0], true) - 1.5, Y(D.INC[0][1], true) + 1.5], "The mandibular buccal cusp: a centric cusp. Its inner incline runs from its tip down to the central fossa, and is the incline split into thirds.");
  return o;
}

const SUM = [
  "First third: the palatal cusp tip lands on the third of the incline nearest the central fossa. Selective grinding (equilibration): minor reshaping of enamel, avoiding exposed dentin: eliminate prematurities, then interferences, direct the centric forces axially, establish optimum occlusion.",
  "Middle third: the interarch alignment deviates farther from ideal, and grinding would expose dentin or mutilate the teeth. Minor orthodontics and fixed prosthetics instead. Most deviations fall here.",
  "Beyond that: a major deviation from the ideal interarch relation. Major orthodontics, orthognathic surgery and prosthetics.",
];
const ROWS = [["First third", "selective grinding"], ["Middle third", "minor orthodontics, fixed prosthetics (most deviations)"], ["Beyond that", "major orthodontics, orthognathic surgery, prosthetics"]];

const s0 = D.SMAX * 0.17;
const svg = figureSvg({ width: W, height: H, className: "th-svg", label: "Frontal section of the right first molars, buccal at the left: the inner incline of the mandibular buccal cusp divided into thirds, numbered from the central fossa, with the maxillary palatal cusp tip landing on one of them.", body: thSvg(s0, Object.assign({ thY, thZone }, D)) });
const rows = `<div class="th-rows"><p class="th-note">The lower buccal cusp's inner incline in thirds, numbered from the central fossa. Contacts are marked with the condyles in the desired position.</p>${ROWS.map((r, k) => `<div class="th-row${k === 0 ? " is-on" : ""}"><span class="th-badge th-b${k}">${k + 1}</span><span><b>${r[0]}</b><br>${r[1]}</span></div>`).join("")}</div>`;
const plate = plateHtml({ fig: "Fig 18", title: "The rule of thirds", hint: "slide the lower molar", readout: "", body: `<div class="am-svg th-box">${svg}${rows}</div>` });
const controls = `<div class="am-controls"><label class="am-slider"><span>in the fossa</span><input type="range" min="0" max="100" step="1" value="17" aria-label="How far off the contact lands"><span>past the cusp tip</span></label></div>
<div class="am-controls" role="group" aria-label="Jump to a third"><button type="button" class="am-btn" data-thz="0">First third</button><button type="button" class="am-btn" data-thz="1">Middle third</button><button type="button" class="am-btn" data-thz="2">Beyond</button></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Hover or tap a cusp, the enamel, the dentin or a third of the incline.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From the L7 notes (Dr. Givan's Occ Lec6 slides and the 10/29 recording): the rule of thirds simplifies the choice of irreversible treatment: mark the contacts with the condyles in the desired position; a discrepancy in the first third of the tooth, selective grinding; the middle third, minor orthodontics and fixed prosthetics (most deviations are here); beyond that, major orthodontics, orthognathic surgery and prosthetics. Selective grinding reshapes enamel only.</li>
<li>Which thirds: the notes don't say which end the first third starts from. Dividing the inner incline of a centric cusp into thirds, nearest the central fossa first, follows the course textbook (Okeson, <i>Management of Temporomandibular Disorders and Occlusion</i>) as summarized in occlusal equilibration teaching notes.</li>
<li>Schematic: the molar outlines are the hub's own frontal-section figure, with enamel and dentin drawn in by hand and the roots left out; the discrepancy is shown in one direction only (the mandibular molar lingual), and the tooth simply rides the incline. Educational, not clinical guidance.</li></ul></details>`;

function thLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var svg = root.querySelector(".th-svg"), rows = root.querySelectorAll(".th-row"), slider = root.querySelector('input[type="range"]'), sum = root.querySelector(".am-summary"), info = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]");
  var s = D.SMAX * slider.value / 100, raf = 0, last = -1;
  function draw() { svg.innerHTML = D.thSvg(s, D); var z = D.thZone(s, D); if (z !== last) { sum.textContent = D.SUM[z]; if (readout) readout.textContent = ["selective grinding", "minor ortho, fixed pros", "major ortho, surgery, pros"][z]; rows.forEach(function (r, k) { r.classList.toggle("is-on", k === z); }); last = z; } }
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
.anima .th-box{max-width:640px;margin:0 auto;display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:6px 16px}
.anima .am-svg.th-box svg.th-svg{flex:360 1 300px;width:auto;max-width:420px}
.anima .th-rows{flex:1 1 180px;max-width:230px;display:flex;flex-direction:column;gap:7px;font:11px/1.4 var(--anatomy-mono);color:var(--anatomy-muted)}
@media (max-width:560px){.anima .th-rows{max-width:none;padding:0 4px}}
.anima .th-note{margin:0 0 2px;font-size:10.5px}
.anima .th-row{display:flex;gap:9px;align-items:flex-start;border:1px solid var(--line);border-radius:8px;padding:6px 9px}
.anima .th-row b{color:var(--anatomy-strong)}
.anima .th-row.is-on{background:var(--anatomy-shade-2);border-color:var(--anatomy-mid);color:var(--anatomy-strong)}
.anima .th-badge{flex:none;width:18px;height:18px;margin-top:1px;border-radius:50%;color:#fff;font-weight:700;font-size:11px;line-height:18px;text-align:center}
.anima .th-b0{background:#2f8a5b}.anima .th-b1{background:var(--tm-lig)}.anima .th-b2{background:var(--tm-vessel)}
.anima .th-svg .th-t{fill:var(--anatomy-text);font:11.5px var(--anatomy-mono);paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round}
.anima .th-svg .th-lab{font-size:10.5px}
.anima .th-svg .th-cap{fill:var(--anatomy-muted);font-size:10.5px}
.anima .th-svg .th-side{fill:var(--anatomy-muted);font-size:10.5px;letter-spacing:.08em;stroke:none}
.anima .th-svg .th-enamel{fill:var(--tm-disc-mid);stroke:var(--anatomy-hi);stroke-width:1.3;stroke-linejoin:round}
.anima .th-svg .th-dentin{fill:var(--tm-bone);stroke:var(--anatomy-lo);stroke-width:.9;stroke-linejoin:round}
.anima .th-svg .th-cej{fill:none;stroke:var(--anatomy-mid);stroke-width:1}
.anima .th-svg .th-fog{fill:var(--surface);stroke:none;pointer-events:none;shape-rendering:crispEdges}
.anima .th-svg .th-band{fill:none;stroke-width:5.5;stroke-linecap:butt;opacity:.5}
.anima .th-svg .th-band.is-on{opacity:1;stroke-width:6.5}
.anima .th-svg .th-z0{stroke:#2f8a5b;fill:#2f8a5b}
.anima .th-svg .th-z1{stroke:var(--tm-lig);fill:var(--tm-lig)}
.anima .th-svg .th-z2{stroke:var(--tm-vessel);fill:var(--tm-vessel)}
.anima .th-svg .th-num{stroke:var(--surface);stroke-width:1.2;opacity:.6}
.anima .th-svg .th-num.is-on{opacity:1}
.anima .th-svg .th-numt{fill:#fff;font-weight:700;font-size:10.5px;stroke:none;pointer-events:none}
.anima .th-svg .th-tick{fill:var(--anatomy-hi)}
.anima .th-svg .th-hit{fill:none;stroke-width:2.6}
.anima .th-svg .th-hz0{stroke:#2f8a5b}.anima .th-svg .th-hz1{stroke:var(--tm-lig)}.anima .th-svg .th-hz2{stroke:var(--tm-vessel)}
`;

export function thirds() {
  return {
    id: "thirds", lec: "malocclusion",
    title: "The rule of thirds",
    caption: "With the condyles in the desired position, slide the mandibular molar off its ideal: the third of the lower buccal cusp's incline that the maxillary palatal cusp tip lands on picks the treatment.",
    html: `<div class="anima" data-anima="thirds">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: thLive.toString(),
    helpers: [thY, thZone, thSvg],
    data: Object.assign({ SUM }, D),
  };
}
