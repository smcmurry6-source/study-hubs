// Fig: why CR record thickness matters on a semi-adjustable articulator (Occlusion L6, "Record thickness"). A side view
// of the mandible hinging on the patient's hinge axis (PHA) next to the articulator's arbitrary axis (AHA), a few mm
// away (an arbitrary facebow lands within about 2-5 mm; the drawing uses 5 mm). The CR record holds the jaw open; the
// casts are mounted at that opening, so the two agree there. Remove the record and the articulator closes on its own
// arc, landing the lower molar somewhere the patient's jaw never goes. The thicker the record, the farther apart the
// arcs at closure. "Restore at this vertical" (the record taken at the VDO you'll treat) and "kinematic facebow"
// (AHA = PHA) both make the error vanish. One model (hgModel) drives the drawing; distances are schematic, and the
// error is shown magnified in the inset, without numbers (the notes give none).
import { figureSvg, plateHtml } from "./shared.mjs";

const W = 520, H = 330;
const D = {
  W, H, S: 3, OX: 420, OY: 78, /* px per mm, and where the patient's hinge axis sits on screen */
  OFF: [4, 3], /* the arbitrary axis, mm from the true one (5 mm: the top of the slides' 2-5 mm) */
  M0: [-45, -42], I0: [-97, -38], /* lower second molar cusp and lower incisor edge, closed in CR, mm from the axis (y up) */
  TMAX: 6, /* mm of separation at the molar at the slider's end (a schematic "thick" record) */
  UPM: [[-53, -30], [-37, -30], [-37, -40], [-40, -43.5], [-45, -42], [-50, -43.5], [-53, -40]],
  LOM: [[-53, -54], [-53, -45], [-49, -42.6], [-45, -42], [-41, -42.6], [-37, -45], [-37, -54]],
  UPI: [[-107, -30], [-99, -30], [-100, -42], [-104, -42.5]], LOI: [[-100.5, -37.5], [-96, -38], [-95, -52], [-101, -52]],
  JAW: [[0, 4.5], [4, 2], [6, -6], [7.5, -22], [8.5, -44], [5, -55], [-4, -61], [-40, -64], [-80, -66], [-97, -64], [-104, -56], [-104.5, -46], [-100.5, -40], [-80, -44.5], [-55, -46.5], [-36, -46.5], [-27, -40], [-21, -22], [-21, -6], [-24, -1], [-16, -9], [-8, -7], [-4.5, 0]],
};

/* the patient opens about PHA by th; the articulator, mounted there, closes about AHA until the molar is back at its
   contact height (or, restoring at this vertical, stays where the record put it) */
function hgModel(t, kin, atVdo, D) {
  function rot(p, c, a) { var x = p[0] - c[0], y = p[1] - c[1], co = Math.cos(a), si = Math.sin(a); return [c[0] + x * co - y * si, c[1] + x * si + y * co]; }
  var P = [0, 0], A = kin ? [0, 0] : [D.OFF[0], D.OFF[1]];
  var th = 0, lo = 0, hi = 0.5;
  for (var i = 0; i < 40; i++) { var mid = (lo + hi) / 2; if (D.M0[1] - rot(D.M0, P, mid)[1] < t) lo = mid; else hi = mid; }
  th = lo;
  var Mrec = rot(D.M0, P, th), Irec = rot(D.I0, P, th);
  var phi = 0;
  if (!atVdo) { lo = 0; hi = 0.6; for (i = 0; i < 40; i++) { mid = (lo + hi) / 2; if (rot(Mrec, A, -mid)[1] < D.M0[1]) lo = mid; else hi = mid; } phi = lo; }
  var Mart = rot(Mrec, A, -phi), Iart = rot(Irec, A, -phi);
  var Mpat = atVdo ? Mrec : D.M0, Ipat = atVdo ? Irec : D.I0;
  return { th: th, phi: phi, A: A, Mrec: Mrec, Irec: Irec, Mart: Mart, Iart: Iart, Mpat: Mpat, Ipat: Ipat,
    err: [Mart[0] - Mpat[0], Mart[1] - Mpat[1]], errI: [Iart[0] - Ipat[0], Iart[1] - Ipat[1]] };
}

function hgSvg(st, D) {
  var f = function (n) { return Math.round(n * 10) / 10; }, o = "", S = D.S;
  var m = D.hgModel(st.t, st.kin, st.atVdo, D);
  function X(p) { return D.OX + p[0] * S; } function Y(p) { return D.OY - p[1] * S; }
  function rot(p, c, a) { var x = p[0] - c[0], y = p[1] - c[1], co = Math.cos(a), si = Math.sin(a); return [c[0] + x * co - y * si, c[1] + x * si + y * co]; }
  function poly(pts) { return "M" + pts.map(function (p) { return f(X(p)) + " " + f(Y(p)); }).join("L") + "Z"; }
  function tx(x, y, t, cls, a) { return '<text class="hg-t' + (cls ? " " + cls : "") + '" x="' + f(x) + '" y="' + f(y) + '"' + (a ? ' text-anchor="' + a + '"' : "") + ">" + t + "</text>"; }
  function lab(t, x, y, px, py, a) { return '<g class="am-callout"><path class="am-leader" d="M' + f(a === "end" ? x + 3 : x - 3) + " " + f(y - 4) + "L" + f(px) + " " + f(py) + '"/><circle class="am-dot" cx="' + f(px) + '" cy="' + f(py) + '" r="1.8"/>' + tx(x, y, t, "", a) + "</g>"; }
  function arc(c, p, a0, a1, cls) { var d = "", n = 24; for (var i = 0; i <= n; i++) { var q = rot(p, c, a0 + (a1 - a0) * i / n); d += (i ? "L" : "M") + f(X(q)) + " " + f(Y(q)); } return '<path class="' + cls + '" d="' + d + '"/>'; }
  /* skull base: fossa and eminence; the fixed maxillary teeth */
  o += '<path class="hg-bone hot" data-info="The glenoid fossa and articular eminence: in CR the condyles sit seated in the fossae and the jaw only hinges." d="' + poly([[26, 18], [26, 9], [14, 8], [9, 9.5], [4, 9], [0, 7.6], [-4, 7], [-8, 4], [-12, -1.5], [-17, 0], [-22, 5], [-28, 9], [-28, 18]]) + '"/>';
  o += '<path class="hg-max" d="' + poly([[-112, -26], [-96, -22], [-60, -23], [-30, -24], [-24, -30], [-32, -31], [-56, -31], [-96, -31], [-108, -31]]) + '"/>';
  o += '<path class="hg-tooth hot" data-info="Upper second molar: the lower molar\'s cusp must land in its fossa in CR." d="' + poly(D.UPM) + '"/>';
  o += '<path class="hg-tooth" d="' + poly(D.UPI) + '"/>';
  /* the patient's arc (solid, about PHA) and the articulator's (dashed, about AHA) through the molar */
  o += arc([0, 0], D.M0, -0.08, 0.26, "hg-arc-pat");
  if (!st.kin) o += arc(m.A, m.Mrec, -0.3, 0.12, "hg-arc-art");
  /* the mandible: ghost where the record holds it, solid where the articulator closes it */
  var jawRec = D.JAW.map(function (p) { return rot(p, [0, 0], m.th); });
  var jawArt = jawRec.map(function (p) { return rot(p, m.A, -m.phi); });
  if (m.th > 0.002) o += '<path class="hg-jaw-ghost" d="' + poly(jawRec) + '"/>';
  o += '<path class="hg-jaw hot" data-info="The mandibular cast, mounted on the articulator with the CR record in place, then closed on the articulator\'s arc." d="' + poly(jawArt) + '"/>';
  var mv = function (p) { return rot(rot(p, [0, 0], m.th), m.A, -m.phi); };
  o += '<path class="hg-tooth hg-low" d="' + poly(D.LOM.map(mv)) + '"/><path class="hg-tooth hg-low" d="' + poly(D.LOI.map(mv)) + '"/>';
  /* the CR record between the teeth while it's in */
  if (m.th > 0.004) o += '<path class="' + (m.phi > 0.0005 ? 'hg-rec-ghost' : 'hg-rec') + '" d="' + poly([[-56, -41.6], [-34, -41.6], rot([-34, -42.4], [0, 0], m.th), rot([-56, -42.4], [0, 0], m.th)]) + '"/>';
  /* the two axes */
  o += '<g class="hot" data-info="The patient\'s hinge axis (PHA): the condyles rotate here in CR."><circle class="hg-condyle" cx="' + f(X([0, 0])) + '" cy="' + f(Y([0, 0])) + '" r="' + 4 * S + '"/><circle class="hg-axis" cx="' + f(X([0, 0])) + '" cy="' + f(Y([0, 0])) + '" r="3"/></g>';
  if (!st.kin) o += '<g class="hot" data-info="The articulator\'s hinge axis (AHA), placed by an arbitrary facebow: near the true axis, typically within 2-5 mm."><path class="hg-cross" d="M' + f(X(m.A) - 6) + " " + f(Y(m.A)) + "h12M" + f(X(m.A)) + " " + f(Y(m.A) - 6) + 'v12"/></g>';
  /* where each closure lands */
  o += '<circle class="hg-pt-pat" cx="' + f(X(m.Mpat)) + '" cy="' + f(Y(m.Mpat)) + '" r="3.2"/>';
  o += '<circle class="hg-pt-art" cx="' + f(X(m.Mart)) + '" cy="' + f(Y(m.Mart)) + '" r="3.2"/>';
  /* inset: the molar contact magnified */
  var ix = 96, iy = 244, z = 240, e = m.err, mag = Math.hypot(e[0], e[1]);
  o += '<g class="hg-inset"><circle class="hg-inset-bg" cx="' + ix + '" cy="' + iy + '" r="54"/>';
  o += '<path class="hg-inset-up" d="M' + (ix - 40) + " " + (iy - 34) + "L" + (ix - 6) + " " + (iy - 34) + "L" + ix + " " + iy + "L" + (ix - 46) + " " + (iy - 8) + 'Z"/>';
  o += '<circle class="hg-pt-pat" cx="' + ix + '" cy="' + iy + '" r="4"/>';
  var ex = ix + e[0] * z, ey = iy - e[1] * z;
  if (mag > 0.004) o += '<path class="hg-err" d="M' + ix + " " + iy + "L" + f(ex) + " " + f(ey) + '"/>';
  o += '<circle class="hg-pt-art" cx="' + f(ex) + '" cy="' + f(ey) + '" r="4"/>';
  o += tx(ix, iy + 70, mag > 0.004 ? "molar contact, magnified" : "no error: same spot", "hg-cap", "middle") + '<circle class="hg-pt-pat" cx="' + (ix - 52) + '" cy="' + (iy - 64) + '" r="3.5"/>' + tx(ix - 45, iy - 60, "patient", "hg-cap", "start") + '<circle class="hg-pt-art" cx="' + (ix + 8) + '" cy="' + (iy - 64) + '" r="3.5"/>' + tx(ix + 15, iy - 60, "articulator", "hg-cap", "start") + "</g>";
  /* labels */
  o += lab("patient's hinge axis", 470, 44, X([0, 0]) + 6, Y([0, 0]) - 6, "end");
  if (!st.kin) o += lab("articulator's axis", 506, 118, X(m.A) + 5, Y(m.A) + 2, "end");
  o += lab("patient's arc", 300, 318, X(D.hgArcPt(D, 0.2)), Y(D.hgArcPt(D, 0.2)), "end");
  if (!st.kin && m.th > 0.002) o += lab("articulator's arc", 360, 300, X(rot(m.Mrec, m.A, -0.12)), Y(rot(m.Mrec, m.A, -0.12)), "start");
  o += tx(14, 18, "← anterior", "hg-cap", "start");
  return o;
}
function hgArcPt(D, a) { var p = D.M0, co = Math.cos(a), si = Math.sin(a); return [p[0] * co - p[1] * si, p[0] * si + p[1] * co]; }

const SUM = {
  thin: "A thin CR record: the articulator's arc and the patient's nearly agree over that short distance, so the error at closure is small. Make CR records at the smallest opening that avoids tooth contact.",
  thick: "A thicker record: the casts were mounted with the jaw held open, and the articulator closes on an arc about its own axis, a few millimeters from the patient's. The farther it has to close, the farther apart the arcs, and the lower molar lands somewhere the patient's jaw never goes: the restoration comes back with interferences.",
  vdo: "Take the CR record at the vertical dimension you intend to treat (a full-mouth reconstruction at a new VDO): the casts are mounted exactly there and never closed, so the two arcs meet at that point and the articulator is \"dead on\" whatever the reconstruction.",
  kin: "A kinematic facebow puts the articulator's axis on the patient's exact hinge axis (AHA = PHA). The arcs are one and the same, so the thickness of the CR record doesn't affect accuracy: that's why it doesn't matter on a fully adjustable articulator.",
  none: "With no record, there's nothing to close from: the casts are related exactly as recorded.",
};

const svg = figureSvg({ width: W, height: H, className: "hg-svg", label: "Side view of the mandible hinging on the patient's axis, the articulator's axis a few millimeters away, and the two arcs of closure.", body: hgSvg({ t: 3, kin: false, atVdo: false }, Object.assign({ hgModel, hgArcPt }, D)) });
const plate = plateHtml({ fig: "Fig", title: "Record thickness and the hinge axis", hint: "slide the record · try the toggles", readout: "", body: `<div class="am-svg hg-box">${svg}</div>` });
const controls = `<div class="am-controls"><label class="am-slider"><span>thin record</span><input type="range" min="0" max="100" step="1" value="50" aria-label="CR record thickness"><span>thick record</span></label></div>
<div class="am-controls"><button type="button" class="am-btn" data-hgvdo aria-pressed="false">Restore at this vertical</button><button type="button" class="am-btn" data-hgkin aria-pressed="false">Kinematic facebow (AHA = PHA)</button></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Hover or tap the two axes, the upper molar or the mandible.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From the L6 notes (Dr. Givan's Occ Lec4 slides and the 10/22 recording): an arbitrary facebow places the articulator's axis near the patient's, typically within 2-5 mm; on a semi-adjustable articulator the arcs differ, so the thicker the CR record the more error; make it as thin as possible or at the vertical you will treat; with a kinematic facebow (fully adjustable) thickness doesn't matter.</li>
<li>Schematic: the jaw, the teeth and the offset (5 mm) are drawn for clarity, not measured, and the error in the inset is magnified with no number, because the notes give none. Educational, not clinical guidance.</li></ul></details>`;

function hgLive(root, D) {
  var svg = root.querySelector(".hg-svg"), slider = root.querySelector('input[type="range"]'), sum = root.querySelector(".am-summary"), info = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]");
  var bVdo = root.querySelector("[data-hgvdo]"), bKin = root.querySelector("[data-hgkin]");
  var st = { t: D.TMAX / 2, kin: false, atVdo: false };
  function draw() {
    svg.innerHTML = D.hgSvg(st, D);
    var key = st.t < 0.05 ? "none" : st.kin ? "kin" : st.atVdo ? "vdo" : st.t < D.TMAX * 0.3 ? "thin" : "thick";
    sum.textContent = D.SUM[key];
    if (readout) readout.textContent = key === "kin" ? "same arc: no error" : key === "vdo" ? "arcs meet here" : key === "none" ? "no record" : key === "thin" ? "small error" : "larger error";
  }
  slider.addEventListener("input", function () { st.t = D.TMAX * slider.value / 100; draw(); });
  bVdo.addEventListener("click", function () { st.atVdo = !st.atVdo; bVdo.setAttribute("aria-pressed", String(st.atVdo)); draw(); });
  bKin.addEventListener("click", function () { st.kin = !st.kin; bKin.setAttribute("aria-pressed", String(st.kin)); draw(); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && svg.contains(el)) info.textContent = el.getAttribute("data-info"); }
  svg.addEventListener("pointerover", hot); svg.addEventListener("click", hot);
  draw();
}

const CSS = `
.anima .hg-box{max-width:560px;margin:0 auto}
.anima .hg-svg .hg-t{fill:var(--anatomy-text);font:11.5px var(--anatomy-mono);paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round}
.anima .hg-svg .hg-cap{fill:var(--anatomy-muted);font-size:10.5px;stroke:none}
.anima .hg-svg .hg-bone{fill:var(--tm-bone);stroke:var(--anatomy-lo);stroke-width:1}
.anima .hg-svg .hg-max{fill:var(--tm-bone-in);stroke:var(--anatomy-lo);stroke-width:1;opacity:.8}
.anima .hg-svg .hg-tooth{fill:var(--anatomy-face);stroke:var(--anatomy-hi);stroke-width:1.2;stroke-linejoin:round}
.anima .hg-svg .hg-jaw{fill:var(--tm-bone);stroke:var(--anatomy-hi);stroke-width:1.4;stroke-linejoin:round;opacity:.92}
.anima .hg-svg .hg-jaw-ghost{fill:none;stroke:var(--anatomy-mid);stroke-width:1;stroke-dasharray:4 3}
.anima .hg-svg .hg-rec{fill:var(--tm-lig);opacity:.55;stroke:var(--tm-lig);stroke-width:1}
.anima .hg-svg .hg-rec-ghost{fill:none;stroke:var(--tm-lig);stroke-width:1;stroke-dasharray:3 3}
.anima .hg-svg .hg-condyle{fill:var(--tm-bone-in);stroke:var(--anatomy-hi);stroke-width:1.2}
.anima .hg-svg .hg-axis{fill:var(--anatomy-hi)}
.anima .hg-svg .hg-cross{stroke:var(--anatomy-lit);stroke-width:2.4;stroke-linecap:round}
.anima .hg-svg .hg-arc-pat{fill:none;stroke:var(--anatomy-hi);stroke-width:1.6}
.anima .hg-svg .hg-arc-art{fill:none;stroke:var(--anatomy-lit);stroke-width:1.6;stroke-dasharray:6 4}
.anima .hg-svg .hg-pt-pat{fill:var(--anatomy-hi)}
.anima .hg-svg .hg-pt-art{fill:var(--anatomy-lit);stroke:var(--surface);stroke-width:1}
.anima .hg-svg .hg-inset-bg{fill:var(--anatomy-shade-2);stroke:var(--anatomy-lo);stroke-width:1}
.anima .hg-svg .hg-inset-up{fill:var(--anatomy-face);stroke:var(--anatomy-hi);stroke-width:1.2;stroke-linejoin:round}
.anima .hg-svg .hg-err{stroke:var(--tm-vessel);stroke-width:2.2;stroke-linecap:round}
`;

export function hingearc() {
  return {
    id: "hingearc", lec: "instruments",
    title: "Record thickness and the hinge axis",
    caption: "Thicken the CR record and watch the articulator's arc of closure drift from the patient's; then take the record at the treatment vertical, or use a kinematic facebow.",
    html: `<div class="anima" data-anima="hingearc">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: hgLive.toString(),
    helpers: [hgModel, hgSvg, hgArcPt],
    data: Object.assign({ SUM }, D),
  };
}
