// Fig 12: why CR record thickness matters on a semi-adjustable articulator (Occlusion L6, "Record thickness"). A side
// view (the L7 side-view rig, l7rig.mjs: skull, mandible, disc and teeth in mm, the seated condyle at the origin, the
// patient facing left) of the mandible held open on the patient's hinge axis (PHA) by a CR record, with the
// articulator's arbitrary axis (AHA) a few mm away (an arbitrary facebow lands within about 2-5 mm; the drawing uses
// 5 mm). The casts are mounted at that opening, so the two agree there. Remove the record: the patient closes on an arc
// about the PHA, back into CR; the articulator closes on an arc about the AHA until the lower molar touches the upper
// one, a little off where the patient's lands. The inset shows that molar contact magnified 60 times. The thicker the
// record, the farther both have to close and the bigger the miss. "Restore at this vertical" (the record taken at the
// VDO you'll treat: the casts are never closed) and "kinematic facebow" (AHA = PHA) both remove the error.
// One model (hgModel) drives the drawing; the offset and the record thicknesses are schematic and the error has no
// number in the figure (the notes give none).
import { figureSvg, plateHtml } from "./shared.mjs";
import { rig, rigSolve, RIG_HELPERS, RIG_CSS } from "./l7rig.mjs";

const W = 520, H = 336;
const R = rig();
const r3 = (v) => Math.round(v * 1000) / 1000;
/* the upper posterior teeth's occlusal outline (the MIP interface), premolars to the second molar: the CR record's top */
const ZIG = [-67.4, -64.7, -62, -59.3, -56.6, -53.9, -51.2, -48.5, -45.8, -43.1, -40.4, -37.7, -36.4].map((x) => [x, r3(rigSolve.upperAt(x))]);
const D = Object.assign(R, {
  W, H, V: { OX: 322, OY: 64, S: 2.6 }, /* the main view: px per mm, and where the patient's hinge axis lands */
  OFF: [4, 3], /* the arbitrary axis, mm from the true one: 4 behind, 3 above (5 mm, the top of the slides' 2-5 mm) */
  M0: R.CUSP_LO[0], /* the lower second molar's distobuccal cusp tip, closed in CR between the upper second molar's buccal cusps (mm from the axis, y up) */
  K: r3((R.YT - R.YB) / (R.PER / 2)), /* the rig's cusp inclines: rise over run (about 26 degrees) */
  TMAX: 4.5, /* mm the record holds the molar apart at the slider's end (a schematic "thick" record) */
  ZIG,
  IN: { x: 446, y: 214, r: 60, z: 156 }, /* the inset: center, radius, px per mm (x60 the main view) */
  /* the skull fades out where the frame crops it: the cranium above the arch, the back of the head behind the mastoid */
  FOG: { top: [12, 24.6], right: [18, 36], W, H }, /* the ear canal (10-17 mm behind) stays clear */
});

/* the patient opens about the PHA by th until the molar is t mm apart; the articulator, mounted there, closes about the
   AHA until the lower molar's cusp touches the upper molar's inclines (or, restoring at this vertical, stays put) */
function hgModel(t, kin, atVdo, D) {
  function rot(p, c, a) { var x = p[0] - c[0], y = p[1] - c[1], co = Math.cos(a), si = Math.sin(a); return [c[0] + x * co - y * si, c[1] + x * si + y * co]; }
  var P = [0, 0], A = kin ? [0, 0] : [D.OFF[0], D.OFF[1]], M0 = D.M0, lo = 0, hi = 0.5, mid, i;
  for (i = 0; i < 48; i++) { mid = (lo + hi) / 2; if (M0[1] - rot(M0, P, mid)[1] < t) lo = mid; else hi = mid; }
  var th = t > 0 ? lo : 0, Mrec = rot(M0, P, th), phi = 0;
  /* the upper molar's surface over the lower cusp: its two inclines meeting above the cusp tip */
  function gap(a) { var q = rot(Mrec, A, -a); return (M0[1] - D.K * Math.abs(q[0] - M0[0])) - q[1]; }
  if (!atVdo && th > 0) { lo = 0; hi = th + 0.05; for (i = 0; i < 48; i++) { mid = (lo + hi) / 2; if (gap(mid) > 0) lo = mid; else hi = mid; } phi = lo; }
  var Mart = rot(Mrec, A, -phi), Mpat = atVdo ? Mrec : M0, ca = Math.cos(-phi), sa = Math.sin(-phi);
  return { th: th, phi: phi, A: A, Mrec: Mrec, Mart: Mart, Mpat: Mpat, err: [Mart[0] - Mpat[0], Mart[1] - Mpat[1]],
    /* rig poses: the jaw held open by the record, and the jaw closed on the articulator (about A, after opening about P) */
    rec: { C: [0, 0], Cm: [0, 0], th: th }, art: { C: [A[0] - (A[0] * ca - A[1] * sa), A[1] - (A[0] * sa + A[1] * ca)], Cm: [0, 0], th: th - phi } };
}
/* clip a polygon to a convex one (Sutherland-Hodgman); both in screen px */
function hgClip(pts, win) {
  var out = pts;
  for (var j = 0; j < win.length && out.length; j++) {
    var a = win[j], b = win[(j + 1) % win.length], inp = out; out = [];
    var side = function (p) { return (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]); };
    for (var i = 0; i < inp.length; i++) {
      var p = inp[i], q = inp[(i + 1) % inp.length], sp = side(p), sq = side(q);
      if (sp >= 0) out.push(p);
      if ((sp >= 0) !== (sq >= 0)) { var k = sp / (sp - sq); out.push([p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k]); }
    }
  }
  return out;
}

function hgSvg(st, D) {
  var f = function (n) { return Math.round(n * 10) / 10; }, o = "", V = D.V, S = V.S, IN = D.IN, i;
  var m = D.hgModel(st.t, st.kin, st.atVdo, D), open = m.th > 0.002;
  function X(p) { return V.OX + p[0] * S; } function Y(p) { return V.OY - p[1] * S; }
  function rot(p, c, a) { var x = p[0] - c[0], y = p[1] - c[1], co = Math.cos(a), si = Math.sin(a); return [c[0] + x * co - y * si, c[1] + x * si + y * co]; }
  function tx(x, y, t, cls, a) { return '<text class="hg-t' + (cls ? " " + cls : "") + '" x="' + f(x) + '" y="' + f(y) + '"' + (a ? ' text-anchor="' + a + '"' : "") + ">" + t + "</text>"; }
  /* a label (one line, or two as an array) whose leader runs from its first line to a dot on the part */
  function lab(t, x, y, px, py, a, cls) { var arr = [].concat(t), s = arr.map(function (l, k) { return '<tspan x="' + f(x) + '" dy="' + (k ? "1.2em" : 0) + '">' + l + "</tspan>"; }).join(""); return '<g class="hg-lab"><path class="am-leader" d="M' + f(a === "end" ? x + 3 : x - 3) + " " + f(y - 4) + "L" + f(px) + " " + f(py) + '"/><circle class="am-dot" cx="' + f(px) + '" cy="' + f(py) + '" r="1.8"/>' + tx(x, y, s, cls, a) + "</g>"; }
  function poly(pts) { return "M" + pts.map(function (p) { return f(p[0]) + " " + f(p[1]); }).join("L") + "Z"; }
  /* the record: a wax wafer between the upper posterior teeth and the lower ones, opened by th */
  var wafer = "";
  if (open) { var top = D.ZIG, bot = top.slice().reverse().map(function (p) { return rot(p, [0, 0], m.th); }); wafer = '<path class="' + (st.atVdo ? "hg-rec hg-rec-vdo" : "hg-rec") + ' hot" data-info="The CR record (wax): it holds the teeth apart so they don\'t touch, because tooth contact steers the jaw toward MIP. The casts are mounted with it in place, at this opening." d="' + D.rgD(top.concat(bot), V, true) + '"/>'; }
  /* the scene, the jaw held open by the record */
  o += D.rgScene(m.rec, V, D, { mid: wafer, fog: D.FOG });
  /* where the jaw closes to in CR (dashed: the outline of the ramus, the lower border and the chin) */
  if (open && !st.atVdo) o += '<path class="hg-ghost" d="' + D.rgD(D.rgSamp(D.JAW, 5).slice(0, 66), V, false) + '"/>';
  /* one soft card under the axis labels and the inset's key (sized for the phone's larger text), so no bone line runs
     through them; it starts just behind the ear canal, which stays clear */
  o += D.rgCard([372, 10, 504, 140], 8, 8);
  /* the two axes */
  var pc = [X([0, 0]), Y([0, 0])], ac = [X(m.A), Y(m.A)];
  o += '<circle class="hg-axis hot" data-info="The patient\'s hinge axis (PHA): in CR the condyles only rotate here, so the jaw opens and closes on an arc about it." cx="' + f(pc[0]) + '" cy="' + f(pc[1]) + '" r="2.6"/>';
  if (!st.kin) o += '<g class="hot" data-info="The articulator\'s hinge axis (AHA), placed by an arbitrary facebow: near the patient\'s, typically within 2-5 mm. The casts close on an arc about this one."><circle class="hg-hit" cx="' + f(ac[0]) + '" cy="' + f(ac[1]) + '" r="8"/><path class="hg-cross" d="M' + f(ac[0] - 5.5) + " " + f(ac[1]) + "h11M" + f(ac[0]) + " " + f(ac[1] - 5.5) + 'v11"/></g>';
  else o += '<path class="hg-cross" d="M' + f(pc[0] - 5.5) + " " + f(pc[1]) + "h11M" + f(pc[0]) + " " + f(pc[1] - 5.5) + 'v11"/>';
  /* the molar contact in the main view, tied to the inset */
  var mc = st.atVdo ? m.Mrec : D.M0, mx = X(mc), my = Y(mc), ring = 7;
  var dx = IN.x - mx, dy = IN.y - my, dl = Math.hypot(dx, dy);
  o += '<circle class="hg-ring" cx="' + f(mx) + '" cy="' + f(my) + '" r="' + ring + '"/><path class="hg-tie" d="M' + f(mx + dx / dl * ring) + " " + f(my + dy / dl * ring) + "L" + f(IN.x - dx / dl * IN.r) + " " + f(IN.y - dy / dl * IN.r) + '"/>';
  /* ---- the inset: the molar contact, x60 ---- */
  var c0 = st.atVdo ? m.Mrec : [D.M0[0] + D.BIAS[0], D.M0[1] + D.BIAS[1]];
  function I(q) { return [IN.x + (q[0] - c0[0]) * IN.z, IN.y - (q[1] - c0[1]) * IN.z]; }
  var win = []; for (i = 0; i < 64; i++) { var an = i / 64 * Math.PI * 2; win.push([IN.x + IN.r * Math.cos(an), IN.y + IN.r * Math.sin(an)]); }
  function clipD(pts) { var r = D.hgClip(pts, win); return r.length > 2 ? poly(r) : ""; }
  var B = IN.r * 3 / IN.z; /* half-width of the drawn wedges, mm */
  function cuspLo(tip) { return [I([tip[0] - B, tip[1] - D.K * B]), I(tip), I([tip[0] + B, tip[1] - D.K * B]), I([tip[0] + B, tip[1] - 3 * B]), I([tip[0] - B, tip[1] - 3 * B])]; }
  var ep = I(m.Mpat), ea = I(m.Mart), big = Math.hypot(ea[0] - ep[0], ea[1] - ep[1]) > 1.5;
  o += '<g class="hot" data-info="' + (st.atVdo ? "The lower molar\'s cusp at the record\'s opening, magnified 60 times. The casts are mounted and built here and never closed, so the patient and the articulator agree: no miss." : "The lower molar\'s cusp meeting the upper molar, magnified 60 times. Dashed: where the patient closes, the cusp seated between the upper cusps. Blue: where the articulator closes it, landing on an incline instead. The red line is the miss: work built on the articulator puts this contact where the patient\'s jaw never closes.") + '">';
  o += '<circle class="hg-win" cx="' + IN.x + '" cy="' + IN.y + '" r="' + IN.r + '"/>';
  var U = D.M0, Lc = I([U[0] - B, U[1] - D.K * B]), Rc = I([U[0] + B, U[1] - D.K * B]), Uc = I(U);
  if (!st.atVdo) o += '<path class="hg-in-up" d="' + clipD([Lc, Uc, Rc, I([U[0] + B, U[1] + 2 * B]), I([U[0] - B, U[1] + 2 * B])]) + '"/>';
  /* the patient's cusp: solid when nothing else is there, else dashed, where it should seat, under the articulator's */
  if (!big) o += '<path class="hg-in-lo" d="' + clipD(cuspLo(m.Mpat)) + '"/>';
  else o += '<path class="hg-in-art" d="' + clipD(cuspLo(m.Mart)) + '"/><path class="hg-in-seat" d="' + clipD(cuspLo(m.Mpat)) + '"/>';
  /* the upper molar's two inclines, drawn over the cusps */
  function cut(a, b) { var dx = b[0] - a[0], dy = b[1] - a[1], ox = a[0] - IN.x, oy = a[1] - IN.y, qa = dx * dx + dy * dy, qb = ox * dx + oy * dy, qc = ox * ox + oy * oy - IN.r * IN.r, t = Math.min(1, (-qb + Math.sqrt(Math.max(0, qb * qb - qa * qc))) / qa); return [a[0] + dx * t, a[1] + dy * t]; }
  if (!st.atVdo) { var l1 = cut(Uc, Lc), r1 = cut(Uc, Rc); o += '<path class="hg-in-edge" d="M' + f(l1[0]) + " " + f(l1[1]) + "L" + f(Uc[0]) + " " + f(Uc[1]) + "L" + f(r1[0]) + " " + f(r1[1]) + '"/>'; }
  if (big) o += '<path class="hg-err" d="M' + f(ep[0]) + " " + f(ep[1]) + "L" + f(ea[0]) + " " + f(ea[1]) + '"/>';
  o += '<circle class="hg-pt-pat" cx="' + f(ep[0]) + '" cy="' + f(ep[1]) + '" r="3.4"/>';
  o += big ? '<circle class="hg-pt-art" cx="' + f(ea[0]) + '" cy="' + f(ea[1]) + '" r="3.4"/>' : '<circle class="hg-pt-ring" cx="' + f(ep[0]) + '" cy="' + f(ep[1]) + '" r="6"/>';
  o += '<circle class="hg-win-edge" cx="' + IN.x + '" cy="' + IN.y + '" r="' + IN.r + '"/></g>';
  var cap = !open ? "no record" : st.atVdo ? "built here: no miss" : st.kin ? "one arc: no miss" : Math.hypot(ea[0] - ep[0], ea[1] - ep[1]) > 9 ? "the molar misses" : "a small miss";
  o += tx(IN.x, IN.y + IN.r + 17, cap, "hg-cap2", "middle") + tx(IN.x, IN.y + IN.r + 35, "molar contact ×60", "hg-cap", "middle");
  /* key to the inset, above it */
  var ky = IN.y - IN.r - 22, kx = IN.x - 40;
  o += '<circle class="hg-pt-pat" cx="' + kx + '" cy="' + (ky - 18) + '" r="3.4"/>' + tx(kx + 9, ky - 14, "patient", "hg-key", "start");
  o += '<circle class="hg-pt-art" cx="' + kx + '" cy="' + ky + '" r="3.4"/>' + tx(kx + 9, ky + 4, "articulator", "hg-key", "start");
  /* labels */
  if (!st.kin) {
    o += lab(["articulator's", "axis"], 376, 24, ac[0], ac[1], "start", "hg-lit");
    o += lab(["patient's", "hinge axis"], 376, 80, pc[0], pc[1], "start");
  } else o += lab(["both axes:", "AHA = PHA"], 376, 50, pc[0], pc[1], "start", "hg-lit");
  if (open) { var wm = rot([-63.5, -42.8], [0, 0], m.th * 0.5); o += lab(st.atVdo ? ["CR record, at the", "treatment VDO"] : "CR record", 196, 300, X(wm), Y(wm), "start"); } /* below the jaw's lower border at its widest opening */
  o += D.rgCard([10, 8, 96, 25], 6, 6) + tx(14, 20, "← anterior", "hg-cap", "start");
  return o;
}

const SUM = {
  thin: "A thin CR record: the jaw is barely open, so the articulator's arc and the patient's agree over that short closure and the molar lands almost where the patient's does. Make CR records at the smallest opening that avoids tooth contact.",
  thick: "A thick record: the casts were mounted with the jaw held well open. Take the record out and the patient closes on an arc about their own hinge axis, while the articulator closes on an arc about its own axis, a few millimeters away. The farther they have to close, the farther apart they land: the lower molar meets the upper one where the patient's jaw never goes, and work built there needs adjusting in the mouth.",
  vdo: "Take the CR record at the vertical dimension you intend to treat (for example a full-mouth reconstruction at a new VDO): the casts are mounted at that opening and built there without closing, so the two arcs meet at that point and the articulator is \"dead on\".",
  kin: "A kinematic facebow puts the articulator's axis on the patient's exact hinge axis (AHA = PHA). The two arcs are one and the same, so the thickness of the CR record doesn't affect accuracy: that's why it doesn't matter on a fully adjustable articulator.",
  none: "No record at all: nothing holds the jaw open, so nothing has to close and the arcs can't disagree. But a CR record has to keep the teeth apart (tooth contact steers the jaw toward MIP), so the goal is the thinnest record that still avoids contact.",
};

/* the inset looks a little past the patient's contact, toward where the thickest record's miss lands, so both show */
{ const e = hgModel(D.TMAX, false, false, D).err; D.BIAS = [r3(e[0] / 2), r3(e[1] / 2)]; }
const DFULL = Object.assign({ hgModel, hgClip, hgSvg }, D);
RIG_HELPERS.forEach((fn) => { DFULL[fn.name] = fn; });
const svg = figureSvg({ width: W, height: H, className: "hg-svg", label: "Side view of the jaw held open by a CR record on the patient's hinge axis, the articulator's axis a few millimeters away, and the molar contact where each closes, magnified.", body: hgSvg({ t: D.TMAX / 2, kin: false, atVdo: false }, DFULL) });
const plate = plateHtml({ fig: "Fig 12", title: "Record thickness and the hinge axis", hint: "slide the record · try the toggles", readout: "larger error", body: `<div class="am-svg hg-box">${svg}</div>` });
const controls = `<div class="am-controls"><label class="am-slider"><span>thin record</span><input type="range" min="0" max="100" step="1" value="50" aria-label="CR record thickness"><span>thick record</span></label></div>
<div class="am-controls"><button type="button" class="am-btn" data-hgvdo aria-pressed="false">Restore at this vertical</button><button type="button" class="am-btn" data-hgkin aria-pressed="false">Kinematic facebow (AHA = PHA)</button></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Hover or tap the two axes, the CR record or the magnified contact.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From the L6 notes (Dr. Givan's Occ Lec4 slides and the 10/22 recording): an arbitrary facebow places the articulator's axis near the patient's, typically within 2-5 mm; on a semi-adjustable articulator the arcs differ, so the thicker the CR record the more error; make it as thin as possible (the smallest opening that avoids tooth contact) or at the vertical you will treat, where the arcs meet; with a kinematic facebow (fully adjustable) thickness doesn't matter.</li>
<li>Schematic: the skull, jaw and teeth are the course's simplified side view, the articulator's axis is drawn 5 mm behind and above the patient's (an error can lie in any direction), the record's thicknesses are illustrative, and the articulator is closed until this one molar cusp touches. The miss is real geometry but tiny (a fraction of a millimeter), so the inset magnifies the contact 60 times and gives no number, because the notes give none. Educational, not clinical guidance.</li></ul></details>`;

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
.anima .hg-svg .hg-cap2{fill:var(--anatomy-strong);font-size:11px;font-weight:600;stroke:none}
.anima .hg-svg .hg-key{font-size:10.5px;stroke:none}
.anima .hg-svg .hg-lit{fill:var(--anatomy-lit);font-weight:600}
@media (max-width:560px){.anima .hg-svg .hg-t{font-size:14px}.anima .hg-svg .hg-cap,.anima .hg-svg .hg-key{font-size:13px}.anima .hg-svg .hg-cap2{font-size:13px}}
${RIG_CSS("hg")}
.anima .hg-svg .rg-jaw{fill:var(--tm-bone)}
.anima .hg-svg .hg-rec{fill:var(--tm-lig);fill-opacity:.62;stroke:var(--tm-lig);stroke-width:1;stroke-linejoin:round}
.anima .hg-svg .hg-ghost{fill:none;stroke:var(--anatomy-mid);stroke-width:1.1;stroke-dasharray:4 3;vector-effect:none}
.anima .hg-svg .hg-axis{fill:var(--anatomy-hi)}
.anima .hg-svg .hg-hit{fill:transparent;stroke:none}
.anima .hg-svg .hg-cross{stroke:var(--anatomy-lit);stroke-width:2.4;stroke-linecap:round}
.anima .hg-svg .hg-ring{fill:none;stroke:var(--tm-vessel);stroke-width:1.4}
.anima .hg-svg .hg-tie{stroke:var(--anatomy-mid);stroke-width:.9}
.anima .hg-svg .hg-win{fill:var(--anatomy-shade-2)}
.anima .hg-svg .hg-win-edge{fill:none;stroke:var(--anatomy-lo);stroke-width:1.2}
.anima .hg-svg .hg-in-up{fill:var(--anatomy-face);stroke:none}
.anima .hg-svg .hg-in-edge{fill:none;stroke:var(--anatomy-hi);stroke-width:1.4;stroke-linejoin:round}
.anima .hg-svg .hg-in-seat{fill:none;stroke:var(--anatomy-hi);stroke-width:1.1;stroke-dasharray:4 3;vector-effect:none}
.anima .hg-svg .hg-in-lo{fill:var(--anatomy-face);stroke:var(--anatomy-hi);stroke-width:1.2;stroke-linejoin:round}
.anima .hg-svg .hg-in-art{fill:var(--anatomy-lit);fill-opacity:.16;stroke:var(--anatomy-lit);stroke-width:1.6;stroke-linejoin:round}
.anima .hg-svg .hg-pt-pat{fill:var(--anatomy-hi)}
.anima .hg-svg .hg-pt-art{fill:var(--anatomy-lit);stroke:var(--surface);stroke-width:1}
.anima .hg-svg .hg-pt-ring{fill:none;stroke:var(--anatomy-lit);stroke-width:1.6}
.anima .hg-svg .hg-err{stroke:var(--tm-vessel);stroke-width:2.4;stroke-linecap:round}
`;

export function hingearc() {
  return {
    id: "hingearc", lec: "instruments",
    title: "Record thickness and the hinge axis",
    caption: "Thicken the CR record and see where the articulator closes the lower molar compared with the patient; then take the record at the treatment vertical, or use a kinematic facebow.",
    html: `<div class="anima" data-anima="hingearc">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: hgLive.toString(),
    helpers: [hgModel, hgClip, hgSvg].concat(RIG_HELPERS),
    data: Object.assign({ SUM }, D),
  };
}
