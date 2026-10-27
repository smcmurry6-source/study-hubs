// Fig: why protrusive records are preferred for setting the SCI (Occlusion L6, "Eccentric records"). Left, the joint
// from the side: the condyle's protrusive path down the articular eminence at the patient's angle, the steeper path a
// lateral record reads (down the medial wall), and the angle the articulator is set to. Right, a posterior crown built
// on that articulator: its cusp inclines are as steep as the setting, so it just clears when the jaw moves along that
// angle. Then the patient protrudes along their real eminence. Built shallower than the patient, it discludes; built
// steeper (from a lateral record), it hits. The angles 20°, 30° and the 20-60° range (commonly 35-40°) are the notes';
// the lateral path is drawn steeper with no number (the notes give none),
import { figureSvg, plateHtml } from "./shared.mjs";

const W = 540, H = 300;
const D = {
  W, H, LAT: 8, /* schematic: how much steeper the lateral record's reading is drawn */
  J: [196, 70], /* condyle center in the joint panel */
  C: [430, 128], /* the cusp contact in the crown panel */
  RUN: 60, /* px of protrusion drawn at the crowns */
  EX: 1.6, /* vertical exaggeration in the crown panel */
};

function scModel(P, set, D) {
  var S = set === "prot" ? P : set === "lat" ? P + D.LAT : set === "a30" ? 30 : 20;
  var r = Math.PI / 180, slope = Math.tan(P * r) - Math.tan(S * r);
  return { P: P, S: S, slope: slope, out: slope > 0.02 ? "clear" : slope < -0.005 ? "hit" : "match" };
}

function scSvg(st, D) {
  var f = function (n) { return Math.round(n * 10) / 10; }, o = "", m = D.scModel(st.P, st.set, D), r = Math.PI / 180, u = st.u;
  function tx(x, y, t, cls, a) { return '<text class="sc-t' + (cls ? " " + cls : "") + '" x="' + f(x) + '" y="' + f(y) + '"' + (a ? ' text-anchor="' + a + '"' : "") + ">" + t + "</text>"; }
  function dir(a) { return [-Math.cos(a * r), Math.sin(a * r)]; }
  function ray(c, a, len, cls) { var d = dir(a); return '<path class="' + cls + '" d="M' + f(c[0]) + " " + f(c[1]) + "L" + f(c[0] + d[0] * len) + " " + f(c[1] + d[1] * len) + '"/>'; }
  /* joint panel (patient faces left): condyle seated, eminence surface one condyle radius above its protrusive path */
  var J = D.J, R = 20, d = dir(m.P), nrm = [-d[1], d[0]];
  if (nrm[1] > 0) nrm = [-nrm[0], -nrm[1]];
  var s0 = [J[0] + nrm[0] * R, J[1] + nrm[1] * R], s1 = [s0[0] + d[0] * 150, s0[1] + d[1] * 150];
  o += '<path class="sc-bone hot" data-info="The articular eminence: in protrusion the condyle slides down and forward along it. Its slope is the patient\'s sagittal condylar inclination." d="M' + (J[0] + 52) + " 12L" + (J[0] + 52) + " " + (J[1] - 6) + "Q" + (J[0] + 30) + " " + (J[1] - 4) + " " + (J[0] + 18) + " " + (J[1] - 14) + "Q" + J[0] + " " + (J[1] - 34) + " " + f(s0[0]) + " " + f(s0[1]) + "L" + f(s1[0]) + " " + f(s1[1]) + "L" + f(s1[0] - 8) + ' 12Z"/>';
  o += '<path class="sc-hz" d="M' + (J[0] + 40) + " " + J[1] + "L" + (J[0] - 170) + " " + J[1] + '"/>';
  o += ray(J, m.P + D.LAT, 150, "sc-path-lat") + ray(J, m.P, 150, "sc-path-pat") + ray(J, m.S, 162, "sc-path-art");
  var cu = [J[0] + d[0] * u * 60, J[1] + d[1] * u * 60];
  o += '<circle class="sc-condyle hot" data-info="The condyle, seated in CR; in protrusion it slides down the eminence." cx="' + f(cu[0]) + '" cy="' + f(cu[1]) + '" r="' + R + '"/>';
  if (u > 0.01) o += '<circle class="sc-condyle-ghost" cx="' + J[0] + '" cy="' + J[1] + '" r="' + R + '"/>';
  o += tx(14, 222, "protrusive path: " + m.P + "°", "sc-pat", "start");
  o += tx(14, 240, "lateral record reads steeper", "sc-lat", "start");
  o += tx(14, 258, "articulator set to " + (st.set === "lat" ? "the lateral reading" : m.S + "°"), "sc-art", "start");
  o += tx(14, 290, "the joint, from the side", "sc-cap", "start");
  o += tx(14, 200, "← anterior", "sc-cap", "start");
  /* crown panel: both crowns were built on the articulator, inclines at its angle S; in the mouth the lower one moves along P */
  var C = D.C, run = D.RUN * u, tS = Math.tan(m.S * r), tP = Math.tan(m.P * r);
  var L1 = C[0] - 120, R1 = C[0] + 80;
  var upY = function (x) { return C[1] + tS * (C[0] - x); };
  var tipU = [C[0] - 92, upY(C[0] - 92)];
  o += '<path class="sc-crown hot" data-info="Upper crown, built on the articulator: its distal incline is as steep as the articulator\'s condylar setting allows. Cusp height and fossa depth follow the SCI." d="M' + L1 + " 40L" + R1 + " 40L" + R1 + " " + (C[1] - 26) + "Q" + (C[0] + 26) + " " + (C[1] - 22) + " " + C[0] + " " + C[1] + "L" + f(tipU[0]) + " " + f(tipU[1]) + "Q" + f(L1 + 6) + " " + f(tipU[1] - 18) + " " + L1 + " " + f(tipU[1] - 40) + 'Z"/>';
  o += '<path class="sc-incline" d="M' + C[0] + " " + C[1] + "L" + f(tipU[0]) + " " + f(tipU[1]) + '"/>';
  var dx = -run, dy = tP * run;
  var lo = [[C[0], C[1]], [C[0] - 92, upY(C[0] - 92)], [C[0] - 104, upY(C[0] - 92) + 22], [C[0] - 104, 292], [C[0] + 70, 292], [C[0] + 70, C[1] + 26], [C[0] + 34, C[1] + 20]];
  o += '<path class="sc-low hot" data-info="Lower crown, built on the same articulator: its mesial incline matches the upper one at the articulator\'s angle." d="M' + lo.map(function (p) { return f(p[0] + dx) + " " + f(p[1] + dy); }).join("L") + 'Z"/>';
  /* along the incline: space (disclusion) or overlap (interference) after the move */
  var gap = run * (tP - tS);
  if (u > 0.05 && Math.abs(gap) > 0.6) {
    var xa = C[0] - 92, xb = C[0] + dx, cls = gap > 0 ? "sc-space" : "sc-overlap";
    o += '<path class="' + cls + '" d="M' + f(xa) + " " + f(upY(xa)) + "L" + f(xb) + " " + f(upY(xb)) + "L" + f(xb) + " " + f(upY(xb) + gap) + "L" + f(xa) + " " + f(upY(xa) + gap) + 'Z"/>';
  }
  o += tx(R1 - 4, 58, "upper crown", "sc-cap", "end") + tx(C[0] + 64, 282, "lower crown", "sc-cap", "end");
  o += tx(C[0] - 20, 22, u < 0.05 ? "press Protrude" : m.out === "clear" ? "discludes in the mouth" : m.out === "hit" ? "interference in the mouth" : "glides: just matches", "sc-res sc-" + m.out, "middle");
  return o;
}

const TEXT = {
  prot: "Set from a protrusive record: the articulator copies the patient's eminence, so the crown's inclines match the path it will travel in the mouth. One record sets both sides, and contacts it avoids in protrusion are also avoided in right and left laterotrusion.",
  lat: "Set from a lateral record: that record measures the path down the medial wall, which is steeper than the eminence. A crown built for the steeper angle has taller cusps than the patient's protrusive path can clear, so it hits in the mouth. That's why protrusive records are preferred.",
  a30: "Arbitrary 30°: most patients' protrusive angles run about 20-60°, commonly 35-40°, so a crown built at 30° is shallower than most patients and still discludes, while keeping decent anatomy. If this patient is flatter than 30°, it would hit.",
  a20: "Arbitrary 20°: it discludes almost everyone, but the cusps come out too shallow (\"I don't like it\"): poor anatomy and chewing efficiency. 30° is the usual compromise.",
};

const svg = figureSvg({ width: W, height: H, className: "sc-svg", label: "Left, the condyle's protrusive path down the eminence, a steeper lateral reading and the articulator's setting; right, a crown built at that setting meeting the patient's real path.", body: scSvg({ P: 38, set: "prot", u: 0 }, Object.assign({ scModel }, D)) });
const plate = plateHtml({ fig: "Fig", title: "Which SCI to build to", hint: "pick a setting · protrude", readout: "", body: `<div class="am-svg sc-box">${svg}</div>` });
const controls = `<div class="am-controls"><label class="am-slider"><span>patient 20°</span><input type="range" min="20" max="60" step="1" value="38" aria-label="The patient's eminence angle"><span>60°</span></label></div>
<div class="am-controls" role="group" aria-label="Articulator setting"><button type="button" class="am-btn" data-scset="prot" aria-pressed="true">From a protrusive record</button><button type="button" class="am-btn" data-scset="lat" aria-pressed="false">From a lateral record</button><button type="button" class="am-btn" data-scset="a30" aria-pressed="false">Arbitrary 30°</button><button type="button" class="am-btn" data-scset="a20" aria-pressed="false">Arbitrary 20°</button><button type="button" class="am-btn" data-scplay>Protrude</button></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Hover or tap the eminence, the condyle or the crown.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From the L6 notes (Dr. Givan's Occ Lec4 slides and the 10/22 recording): SCI controls posterior disclusion and cusp height; a protrusive record sets both sides and is preferred because the lateral record's SCI (down the medial wall) is steeper; arbitrary settings of 20-30° are common for fixed work, with 30° working because most patients are steeper (about 20-60°, commonly 35-40°) and 20° making the cusps too shallow.</li>
<li>Schematic: the crown is reduced to one incline and one cusp tip, with only the condylar guidance acting (no anterior guidance); the lateral reading is drawn 8° steeper only to show "steeper" (the notes give no number). Educational, not clinical guidance.</li></ul></details>`;

function scLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var svg = root.querySelector(".sc-svg"), slider = root.querySelector('input[type="range"]'), sum = root.querySelector(".am-summary"), info = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]"), play = root.querySelector("[data-scplay]");
  var st = { P: 38, set: "prot", u: 0 }, raf = 0;
  function draw() {
    svg.innerHTML = D.scSvg(st, D);
    var m = D.scModel(st.P, st.set, D);
    var txt = D.TEXT[st.set];
    if (st.set === "a30" && m.out === "hit") txt = "Arbitrary 30° on a patient flatter than 30°: the crown is steeper than this patient's eminence, so it hits. That's rare: most patients are steeper (about 20-60°, commonly 35-40°).";
    sum.textContent = txt;
    if (readout) readout.textContent = "patient " + st.P + "° · set " + (st.set === "lat" ? "steeper" : m.S + "°");
  }
  function protrude() {
    cancelAnimationFrame(raf);
    if (reduce.matches) { st.u = 1; draw(); return; }
    var t0 = performance.now();
    function step(now) { st.u = Math.min(1, (now - t0) / 1600); draw(); if (st.u < 1) raf = requestAnimationFrame(step); }
    st.u = 0; raf = requestAnimationFrame(step);
  }
  slider.addEventListener("input", function () { st.P = +slider.value; draw(); });
  root.querySelectorAll("[data-scset]").forEach(function (b) { b.addEventListener("click", function () { st.set = b.getAttribute("data-scset"); root.querySelectorAll("[data-scset]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); protrude(); }); });
  play.addEventListener("click", protrude);
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && svg.contains(el)) info.textContent = el.getAttribute("data-info"); }
  svg.addEventListener("pointerover", hot); svg.addEventListener("click", hot);
  draw();
}

const CSS = `
.anima .sc-box{max-width:580px;margin:0 auto}
.anima .sc-svg .sc-t{fill:var(--anatomy-text);font:11.5px var(--anatomy-mono);paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round}
.anima .sc-svg .sc-cap{fill:var(--anatomy-muted);font-size:10.5px;stroke:none}
.anima .sc-svg .sc-pat{fill:var(--anatomy-hi);font-weight:600}
.anima .sc-svg .sc-lat{fill:var(--tm-vessel)}
.anima .sc-svg .sc-art{fill:var(--anatomy-lit);font-weight:600}
.anima .sc-svg .sc-res{font-size:12.5px;font-weight:700}
.anima .sc-svg .sc-clear{fill:#2f8a5b}
.anima .sc-svg .sc-hit{fill:var(--tm-vessel)}
.anima .sc-svg .sc-match{fill:var(--anatomy-hi)}
.anima .sc-svg .sc-bone{fill:var(--tm-bone);stroke:var(--anatomy-lo);stroke-width:1.2}
.anima .sc-svg .sc-condyle{fill:var(--tm-bone-in);stroke:var(--anatomy-hi);stroke-width:1.4}
.anima .sc-svg .sc-condyle-ghost{fill:none;stroke:var(--anatomy-mid);stroke-width:1;stroke-dasharray:4 3}
.anima .sc-svg .sc-hz{stroke:var(--anatomy-lo);stroke-width:1;stroke-dasharray:2 3}
.anima .sc-svg .sc-path-pat{fill:none;stroke:var(--anatomy-hi);stroke-width:2.2;stroke-linecap:round}
.anima .sc-svg .sc-path-lat{fill:none;stroke:var(--tm-vessel);stroke-width:1.6;stroke-dasharray:5 4}
.anima .sc-svg .sc-path-art{fill:none;stroke:var(--anatomy-lit);stroke-width:2;stroke-dasharray:2 3;stroke-linecap:round}
.anima .sc-svg .sc-arc{fill:none;stroke:var(--anatomy-mid);stroke-width:1}
.anima .sc-svg .sc-crown{fill:var(--anatomy-face);stroke:var(--anatomy-hi);stroke-width:1.4;stroke-linejoin:round}
.anima .sc-svg .sc-incline{stroke:var(--anatomy-lit);stroke-width:2.4;stroke-linecap:round}
.anima .sc-svg .sc-low{fill:var(--anatomy-shade-1);stroke:var(--anatomy-hi);stroke-width:1.4;stroke-linejoin:round;opacity:.92}
.anima .sc-svg .sc-space{fill:#2f8a5b;opacity:.3}
.anima .sc-svg .sc-overlap{fill:var(--tm-vessel);opacity:.55}
`;

export function scirec() {
  return {
    id: "scirec", lec: "instruments",
    title: "Why protrusive records are preferred",
    caption: "Set the articulator from a protrusive record, a lateral record, or an arbitrary 30° or 20°, then protrude the patient's jaw along their real eminence and see whether a crown built there discludes or hits.",
    html: `<div class="anima" data-anima="scirec">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: scLive.toString(),
    helpers: [scModel, scSvg],
    data: Object.assign({ TEXT }, D),
  };
}
