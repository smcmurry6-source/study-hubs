// Fig: cusp pathways in motion (Occlusion L1, eccentric movements and contacts).
// Panel 1: #3 and #30 in the help sheet's layouts (upper buccal up, lower buccal down, mesial at the left), the same teeth
// and arrows as the static pathMax / pathMand figures (tools/figures/occlusion/od.js). Pick a movement and the opposing cusp
// leaves its MIP contact and draws its path on both teeth at once: the mandible moves by d against the maxilla, so on #3
// the lower cusp travels +d and on #30 the upper cusp travels -d, which is why every path reverses on a lower tooth.
// Panel 2: the mandible from above (anterior at the top, patient's right on the right) rotating about the working
// condyle. The path a right-side cusp takes in a right move (rotation about the right condyle) and in a left move (about
// the left condyle) spread apart more the farther the cusp is from the rotating condyle and from the midline and the more
// side shift there is, and less the wider the intercondylar distance (the hub's L1 notes on horizontal determinants).
// Panel 2 is a geometric model: distances are schematic, so its angle shows the trend, not a patient's value.
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { figureSvg, plateHtml, f1 } from "./shared.mjs";

/* the hub's own drawing kit, so the teeth match the static figures exactly */
const ctx = {};
vm.runInNewContext(readFileSync(new URL("../od.js", import.meta.url), "utf8"), ctx);
const OD = ctx.OD;

/* the mandible's movement against the maxilla, in mm-ish units along (mesial, buccal) for a right-side tooth,
   at the static figures' arrow lengths: protrusive mesial; right working buccal leaning 15 deg mesial; left move (right
   side non-working) mesiolingual at 45 deg; retrusive distal and short */
const r15 = 15 * Math.PI / 180;
const MOVES = {
  pro: { letter: "A", d: [100, 0] },
  work: { letter: "B", d: [104 * Math.sin(r15), 104 * Math.cos(r15)] },
  nonwork: { letter: "C", d: [80, -80] },
  retro: { letter: "D", d: [-40, 0] },
};
const ORDERM = ["pro", "work", "nonwork", "retro"];

function toothPanel(arch) {
  const max = arch === "max";
  const t = OD.tooth(max ? "maxM1" : "manM1", { x: 96, y: max ? 52 : 58, k: max ? 18 : 16.5, flip: !max });
  const b = t.pt.c, H = (max ? 52 : 58) + t.h + 40;
  /* upper tooth: the lower cusp moves +d (mesial = -x, buccal = -y); lower tooth: the upper cusp moves -d (mesial = -x,
     buccal = +y), which lands on (+m, -b) on screen */
  const end = {};
  ORDERM.forEach((k) => { const [m, bb] = MOVES[k].d; end[k] = max ? [f1(b[0] - m), f1(b[1] - bb)] : [f1(b[0] + m), f1(b[1] - bb)]; });
  const pinOff = max ? { pro: [-13, -14], work: [-16, -6], nonwork: [-12, 12], retro: [14, -14] } : { pro: [13, -14], work: [16, 6], nonwork: [12, -12], retro: [-14, -14] };
  let s = t.svg;
  Object.keys(t.pt).forEach((c) => { if (OD.CUSP_NAME[c] && c !== "B" && c !== "L") s += OD.txt(t.pt[c][0], t.pt[c][1] + 4, c, "fg-t sm od-cl", "middle"); });
  s += `<circle class="od-ghost" cx="${f1(b[0])}" cy="${f1(b[1])}" r="11"/>`;
  ORDERM.forEach((k) => {
    const e = end[k];
    s += `<g class="cm-ghost" data-m="${k}">${OD.arrow(b[0], b[1], e[0], e[1], "cm-g", 10)}${OD.pin(e[0] + pinOff[k][0], e[1] + pinOff[k][1], MOVES[k].letter, "cm-pin")}</g>`;
  });
  s += `<path class="cm-trace" d="M${f1(b[0])} ${f1(b[1])}L${f1(b[0])} ${f1(b[1])}"/><path class="cm-head" d="M0 0"/>`;
  s += `<circle class="cm-cusp" cx="${f1(b[0])}" cy="${f1(b[1])}" r="7"/>`;
  s += OD.txt(t.cx, 22, max ? "BUCCAL" : "LINGUAL", "fg-t", "middle") + OD.txt(t.cx, H - 12, max ? "PALATAL" : "BUCCAL", "fg-t", "middle") +
    OD.txt(8, t.cy + 4, "MESIAL", "fg-t sm") + OD.txt(t.x + t.w + 26, t.cy + 4, "DISTAL", "fg-t sm");
  s += OD.txt(14, H - 12, max ? "#3 stays put" : "#30 moves with the jaw", "fg-t sm cm-who");
  const label = max ? "Maxillary right first molar #3, occlusal view, buccal at the top and mesial at the left. A dot marks the distobuccal cusp of #30 in the central fossa; picking a movement draws that cusp's path across #3." :
    "Mandibular right first molar #30, occlusal view, lingual at the top and mesial at the left. A dot marks the mesiolingual cusp of #3 in the central fossa; picking a movement draws that cusp's path across #30, the reverse of the path on #3.";
  return { svg: figureSvg({ width: 380, height: f1(H), className: "cm-tooth", label, body: s }), base: [f1(b[0]), f1(b[1])], end };
}
const P3 = toothPanel("max"), P30 = toothPanel("mand");

/* ---------- panel 2: the jaw from above ---------- */
const D = {
  teeth: { max: { base: P3.base, end: P3.end }, mand: { base: P30.base, end: P30.end } },
  letters: { pro: "A", work: "B", nonwork: "C", retro: "D" },
  S: 2.6, OX: 190, OY: 290, AMAX: 0.26, SHIFT: 3.5,
  dist: [30, 46, 66], mid: [18, 25, 32], icd: [84, 100, 118],
};
/* the jaw at a moment of a lateral move: side 1 = right move (rotates about the right condyle), -1 = left move;
   u = 0..1 of the move; returns where a point of the mandible (mm, x right, y anterior) ends up */
function jawMove(p, o, side, u, D) {
  var cx = side * o.icd / 2, a = -side * D.AMAX * u, c = Math.cos(a), s = Math.sin(a), dx = p[0] - cx, dy = p[1];
  var sh = o.shift ? side * D.SHIFT * Math.min(1, u * 3) : 0;
  return [cx + dx * c - dy * s + sh, dx * s + dy * c];
}
/* the two path chords for the right-side cusp and the angle between them */
function jawAngles(o, D) {
  var P = [o.mid, o.dist], L = jawMove(P, o, 1, 1, D), M = jawMove(P, o, -1, 1, D);
  var a = [L[0] - P[0], L[1] - P[1]], b = [M[0] - P[0], M[1] - P[1]];
  var cos = (a[0] * b[0] + a[1] * b[1]) / Math.sqrt((a[0] * a[0] + a[1] * a[1]) * (b[0] * b[0] + b[1] * b[1]));
  return { P: P, L: L, M: M, deg: Math.acos(Math.max(-1, Math.min(1, cos))) * 180 / Math.PI };
}
/* everything panel 2 draws, for one setting and one moment (side 0 = at rest) */
function jawFrame(o, side, u, D) {
  function f(v) { return Math.round(v * 10) / 10; }
  function X(p) { return [f(D.OX + p[0] * D.S), f(D.OY - p[1] * D.S)]; }
  function poly(pts) { return "M" + pts.map(function (p) { var q = X(p); return q[0] + " " + q[1]; }).join("L"); }
  var h = o.icd / 2;
  /* outline of the mandible from above: condyles, rami and the body curving to the chin */
  /* right half, buccal border from the condyle forward to the chin and lingual border back; the rami flare out behind
     the body, which carries the teeth (schematic) */
  var outR = [[h + 4, -2], [h + 1, 10], [(h + 34) / 2 + 1, 28], [34, 46], [31, 64], [23, 83], [12, 93], [0, 96]];
  var inR = [[0, 85], [8, 82], [14, 72], [17, 58], [19, 44], [(h + 19) / 2, 24], [h - 8, 8], [h - 8, -2]];
  function mir(a) { return a.map(function (p) { return [-p[0], p[1]]; }); }
  var out = mir(outR).concat(outR.slice().reverse().slice(1)), inn = inR.slice().reverse().concat(mir(inR).slice(1));
  function sm(pts) { var n = pts.length, d = "M" + X(pts[0]).join(" "); for (var i = 0; i < n - 1; i++) { var p0 = X(pts[Math.max(0, i - 1)]), p1 = X(pts[i]), p2 = X(pts[i + 1]), p3 = X(pts[Math.min(n - 1, i + 2)]);
    d += "C" + f(p1[0] + (p2[0] - p0[0]) / 6) + " " + f(p1[1] + (p2[1] - p0[1]) / 6) + " " + f(p2[0] - (p3[0] - p1[0]) / 6) + " " + f(p2[1] - (p3[1] - p1[1]) / 6) + " " + p2[0] + " " + p2[1]; } return d; }
  var ang = jawAngles(o, D), P = ang.P;
  function mv(p) { return side ? jawMove(p, o, side, u, D) : p; }
  var A = {};
  var oi = inn.map(mv), ip = X(oi[0]);
  A[".cj-jaw"] = { d: sm(out.map(mv)) + "L" + ip[0] + " " + ip[1] + sm(oi).replace(/^M[^C]*/, "") + "Z" };
  var cl = X(mv([-h, 0])), cr = X(mv([h, 0])), cp = X(mv(P));
  A[".cj-cond.l"] = { cx: cl[0], cy: cl[1] }; A[".cj-cond.r"] = { cx: cr[0], cy: cr[1] };
  A[".cj-cusp"] = { cx: cp[0], cy: cp[1] };
  A[".cj-tooth"] = { transform: "translate(" + cp[0] + " " + cp[1] + ") rotate(" + f(side ? D.AMAX * u * side * 180 / Math.PI : 0) + ")" };
  /* fixed reference marks where the condyles and the cusp sit at rest */
  var rl = X([-h, 0]), rr = X([h, 0]), rp = X(P);
  A[".cj-rest.l"] = { cx: rl[0], cy: rl[1] }; A[".cj-rest.r"] = { cx: rr[0], cy: rr[1] }; A[".cj-rest.p"] = { cx: rp[0], cy: rp[1] };
  /* each path as an arc of the move, plus its chord arrowhead; the angle between them at the cusp */
  function arc(sd) { var pts = []; for (var i = 0; i <= 16; i++) pts.push(jawMove(P, o, sd, i / 16, D)); return poly(pts); }
  function head(sd) { var e = X(jawMove(P, o, sd, 1, D)), q = X(jawMove(P, o, sd, .82, D)), dx = e[0] - q[0], dy = e[1] - q[1], L = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / L, uy = dy / L;
    return "M" + e[0] + " " + e[1] + "L" + f(e[0] - ux * 9 - uy * 5) + " " + f(e[1] - uy * 9 + ux * 5) + "L" + f(e[0] - ux * 9 + uy * 5) + " " + f(e[1] - uy * 9 - ux * 5) + "Z"; }
  A[".cj-path.lat"] = { d: arc(1) }; A[".cj-head.lat"] = { d: head(1) };
  A[".cj-path.med"] = { d: arc(-1) }; A[".cj-head.med"] = { d: head(-1) };
  var a1 = Math.atan2(-(ang.L[1] - P[1]), ang.L[0] - P[0]), a2 = Math.atan2(-(ang.M[1] - P[1]), ang.M[0] - P[0]), R = 17;
  var p1 = [rp[0] + R * Math.cos(a1), rp[1] + R * Math.sin(a1)], p2 = [rp[0] + R * Math.cos(a2), rp[1] + R * Math.sin(a2)];
  var da = a2 - a1; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
  A[".cj-angle"] = { d: "M" + f(p1[0]) + " " + f(p1[1]) + "A" + R + " " + R + " 0 0 " + (da > 0 ? 1 : 0) + " " + f(p2[0]) + " " + f(p2[1]) };
  var am = a1 + da / 2;
  A[".cj-deg"] = { x: f(rp[0] + (R + 15) * Math.cos(am)), y: f(rp[1] + (R + 15) * Math.sin(am) + 4) };
  var spin = side === 1 ? cr : side === -1 ? cl : null;
  A[".cj-spin"] = spin ? { cx: spin[0], cy: spin[1], opacity: 1 } : { opacity: 0 };
  return { attrs: A, deg: ang.deg };
}
const O0 = { dist: D.dist[1], mid: D.mid[1], icd: D.icd[1], shift: false };
const J0 = jawFrame(O0, 0, 0, D);
const at = (sel) => Object.entries(J0.attrs[sel] || {}).map(([k, v]) => ` ${k}="${v}"`).join("");
const jawBody = [
  `<path class="cj-mid" d="M${D.OX} 18V${D.OY + 22}"/>`,
  `<text class="fg-t sm" x="${D.OX}" y="14" text-anchor="middle">ANTERIOR</text>`,
  `<text class="fg-t sm" x="8" y="${D.OY + 30}">Patient's LEFT</text><text class="fg-t sm" x="372" y="${D.OY + 30}" text-anchor="end">Patient's RIGHT</text>`,
  `<circle class="cj-rest l"${at(".cj-rest.l")} r="3"/><circle class="cj-rest r"${at(".cj-rest.r")} r="3"/><circle class="cj-rest p"${at(".cj-rest.p")} r="3"/>`,
  `<g class="hot" tabindex="0" data-info="The mandible seen from above. In a lateral move it swings around the condyle on the side it moves toward (the working condyle), while the other condyle orbits forward and medially."><path class="cj-jaw"${at(".cj-jaw")}/></g>`,
  `<circle class="cj-spin"${at(".cj-spin")} r="13"/>`,
  `<g class="hot" tabindex="0" data-info="Left condyle. In a LEFT move it is the working condyle and mostly rotates; in a right move it is the non-working condyle and orbits forward, down and medially."><ellipse class="cj-cond l"${at(".cj-cond.l")} rx="10" ry="6"/></g>`,
  `<g class="hot" tabindex="0" data-info="Right condyle. In a RIGHT move it is the working condyle and mostly rotates; in a left move it is the non-working condyle and orbits forward, down and medially."><ellipse class="cj-cond r"${at(".cj-cond.r")} rx="10" ry="6"/></g>`,
  `<g class="cj-tooth"${at(".cj-tooth")}><rect x="-12" y="-11" width="24" height="22" rx="7" class="cj-molar"/></g>`,
  `<g class="hot" tabindex="0" data-info="Path of the cusp in a RIGHT move (laterotrusive, working): the jaw rotates about the right condyle, so the cusp swings toward the cheek and a little forward."><path class="cj-path lat"${at(".cj-path.lat")}/><path class="cj-head lat"${at(".cj-head.lat")}/></g>`,
  `<g class="hot" tabindex="0" data-info="Path of the cusp in a LEFT move (mediotrusive, non-working): the jaw rotates about the left condyle, so the cusp swings toward the tongue and forward."><path class="cj-path med"${at(".cj-path.med")}/><path class="cj-head med"${at(".cj-head.med")}/></g>`,
  `<circle class="cj-cusp"${at(".cj-cusp")} r="4.5"/>`,
  `<path class="cj-angle"${at(".cj-angle")}/><text class="cj-deg"${at(".cj-deg")} text-anchor="middle">${Math.round(J0.deg)}°</text>`,
].join("");
const jawSvg = figureSvg({ width: 380, height: D.OY + 40, className: "cm-jaw",
  label: "The mandible seen from above, anterior at the top, with both condyles and a right mandibular molar cusp. Two arrows show the cusp's path in a right move and in a left move, with the angle between them. Sliders move the cusp farther from the condyles or the midline, widen or narrow the intercondylar distance, or add a side shift.",
  body: jawBody });

const plate1 = plateHtml({ fig: "Fig 2", title: "Cusp pathways in motion", hint: "pick a movement", readout: "MIP",
  body: `<div class="cm-pair"><div class="am-svg">${P3.svg}</div><div class="am-svg">${P30.svg}</div></div>` });
const plate2 = plateHtml({ fig: "Fig 2b", title: "Why the paths spread apart", hint: "drag the sliders", readout: "",
  body: `<div class="am-svg cm-jawbox">${jawSvg}</div>` });

const MOVE_BTNS = [["pro", "A · Protrusive"], ["work", "B · Right move (working)"], ["nonwork", "C · Left move (right side non-working)"], ["retro", "D · Retrusive"]];
const controls1 = `<div class="am-controls cm-moves" role="group" aria-label="Movement">${MOVE_BTNS.map(([k, l]) => `<button type="button" class="am-btn" data-move="${k}" aria-pressed="false">${l}</button>`).join("")}<button type="button" class="am-btn cm-all" aria-pressed="true">Show all four</button></div>
<div class="am-stats" aria-live="polite"><span><b>Movement</b> <em data-r="move">none: teeth in MIP</em></span><span><b>On #3 (upper)</b> <em data-r="up">the DB cusp of #30 sits in the central fossa</em></span><span><b>On #30 (lower)</b> <em data-r="low">the ML cusp of #3 sits in the central fossa</em></span></div>
<p class="am-summary" aria-live="polite">Pick a movement. The dot on each tooth is the opposing cusp in MIP, at the base of every arrow (the help sheet's rule); watch where it goes on the upper tooth and on the lower one.</p>`;
const slider = (k, lo, hi, label, aria) => `<label class="am-slider"><span>${lo}</span><input type="range" data-s="${k}" min="0" max="100" step="1" value="50" aria-label="${aria}"><span>${hi}</span></label><span class="cm-slab">${label}</span>`;
const controls2 = `<div class="am-controls cm-jawctl">${slider("dist", "closer", "farther", "Distance from the rotating condyle", "Cusp distance from the rotating condyle")}${slider("mid", "near", "far", "Distance from the midline", "Cusp distance from the midsagittal plane")}${slider("icd", "narrow", "wide", "Intercondylar distance", "Intercondylar distance")}</div>
<div class="am-controls"><button type="button" class="am-btn" data-swing="1">Right move</button><button type="button" class="am-btn" data-swing="-1">Left move</button><button type="button" class="am-btn cm-shift" aria-pressed="false">Add side shift (Bennett)</button></div>
<div class="am-stats" aria-live="polite"><span><b>Angle between the paths</b> <em data-r="deg">${Math.round(J0.deg)}°</em></span><span><b>Compared with the start</b> <em data-r="cmp">the starting setting</em></span><span class="cm-legend"><i class="sw lat"></i><b>Right move</b> <em>working</em> <i class="sw med"></i><b>Left move</b> <em>non-working</em></span></div>
<p class="am-summary cm-sum2" aria-live="polite"></p>
<p class="am-info">Tap or hover the condyles and the paths for what they are.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>Drawn from the hub's L1 notes and Dr. Givan's "What cusp hits where?" help sheet: on a maxillary tooth you watch a mandibular cusp (protrusive mesial, working buccal, non-working mesiopalatal); on a mandibular tooth you watch a maxillary cusp, and everything reverses (protrusive distal, working lingual, non-working distobuccal). The MIP contact is at the base of each arrow. The teeth and arrows are the same as in the Cusp pathways figures above, including the help sheet's slight mesial lean of the working path on the upper tooth; retrusion is only about a millimeter, so its arrow is short.</li>
<li>Fig 2b follows the notes on horizontal determinants: a greater distance from the rotating condyle, a greater distance from the midsagittal plane and a greater Bennett movement all increase the angle between a cusp's laterotrusive and mediotrusive paths; a greater intercondylar distance decreases it. It is a geometric model (the jaw rotating about one condyle, plus an optional side shift), with schematic distances, so the angle shows the trend, not a patient's value, and it won't match the help sheet's drawing exactly.</li>
<li>Paths are drawn in the horizontal plane only; in the mouth the cusps also separate vertically as the condyle moves down the eminence.</li></ul></details>`;

function cmLive(root, D) {
  var svgs = root.querySelectorAll(".cm-tooth"), jaw = root.querySelector(".cm-jaw");
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var rs = {}; Array.prototype.forEach.call(root.querySelectorAll("[data-r]"), function (e) { rs[e.getAttribute("data-r")] = e; });
  var ros = root.querySelectorAll("[data-readout]"), readout = ros[0], readout2 = ros[1], sum1 = root.querySelector(".am-summary"), sum2 = root.querySelector(".cm-sum2"), infoEl = root.querySelector(".am-info");
  var allBtn = root.querySelector(".cm-all"), shiftBtn = root.querySelector(".cm-shift");
  var TXT = {
    pro: ["protrusive (jaw slides straight forward)", "the lower cusp runs MESIAL (A)", "the upper cusp runs DISTAL (A)",
      "Protrusive: the mandible slides forward. On #3, which stays put, the distobuccal cusp of #30 runs mesial. On #30, which moves forward with the jaw, the mesiolingual cusp of #3 is left behind, so its path runs distal: \"if I'm looking at the mandibular arch and the mandible is sliding forward, the contacts are going toward the posterior.\""],
    work: ["right move: the right side is working (laterotrusive)", "the lower cusp runs BUCCAL, a little mesial (B)", "the upper cusp runs LINGUAL, a little distal (B)",
      "Right working move: the chin swings toward the right cheek. On #3 the lower cusp runs buccal, leaning a little mesial; on #30 the upper cusp runs lingual, leaning a little distal. The working condyle mostly rotates."],
    nonwork: ["left move: the right side is non-working (mediotrusive)", "the lower cusp runs MESIOPALATAL (C)", "the upper cusp runs DISTOBUCCAL (C)",
      "Left move, so the right side is non-working: the right condyle orbits forward, down and medially, carrying the right molars toward the tongue and forward. On #3 the lower cusp runs mesiopalatal; on #30 the upper cusp runs distobuccal. Contacts here are non-working interferences."],
    retro: ["retrusive (jaw moves slightly back)", "the lower cusp runs DISTAL, short (D)", "the upper cusp runs MESIAL, short (D)",
      "Retrusive: the mandible moves only slightly back (about a millimeter, posterior temporalis). On #3 the lower cusp runs distal; on #30 the upper cusp runs mesial."]
  };
  var move = null, t = 0, frame = 0, last = 0, showAll = true;
  function f(v) { return Math.round(v * 10) / 10; }
  function drawTeeth() {
    Array.prototype.forEach.call(svgs, function (svg, i) {
      var T = D.teeth[i ? "mand" : "max"], b = T.base, e = move ? T.end[move] : b, u = move ? t : 0;
      var p = [b[0] + (e[0] - b[0]) * u, b[1] + (e[1] - b[1]) * u];
      svg.querySelector(".cm-cusp").setAttribute("cx", f(p[0])); svg.querySelector(".cm-cusp").setAttribute("cy", f(p[1]));
      svg.querySelector(".cm-trace").setAttribute("d", "M" + b[0] + " " + b[1] + "L" + f(p[0]) + " " + f(p[1]));
      var hd = svg.querySelector(".cm-head");
      if (move && u > .97) { var dx = e[0] - b[0], dy = e[1] - b[1], L = Math.sqrt(dx * dx + dy * dy), ux = dx / L, uy = dy / L, h = 11;
        hd.setAttribute("d", "M" + e[0] + " " + e[1] + "L" + f(e[0] - ux * h - uy * h * .55) + " " + f(e[1] - uy * h + ux * h * .55) + "L" + f(e[0] - ux * h + uy * h * .55) + " " + f(e[1] - uy * h - ux * h * .55) + "Z"); }
      else hd.setAttribute("d", "M0 0");
      svg.setAttribute("data-move", move || ""); svg.setAttribute("data-all", showAll ? "1" : "0");
    });
    root.querySelectorAll("[data-move]").forEach(function (bt) { if (bt.tagName === "BUTTON") bt.setAttribute("aria-pressed", String(bt.getAttribute("data-move") === move)); });
    var x = move ? TXT[move] : null;
    rs.move.textContent = x ? x[0] : "none: teeth in MIP";
    rs.up.textContent = x ? x[1] : "the DB cusp of #30 sits in the central fossa";
    rs.low.textContent = x ? x[2] : "the ML cusp of #3 sits in the central fossa";
    if (readout) readout.textContent = move ? D.letters[move] + " · " + (move === "work" ? "working" : move === "nonwork" ? "non-working" : move === "pro" ? "protrusive" : "retrusive") : "MIP";
    if (x && sum1.textContent !== x[3]) sum1.textContent = x[3];
  }
  function tick(now) {
    frame = 0; if (!root.isConnected) return;
    var dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
    t = Math.min(1, t + dt / 1.3); drawTeeth();
    if (t < 1) frame = requestAnimationFrame(tick);
  }
  function pick(k) { move = k; t = reduce.matches ? 1 : 0; last = 0; drawTeeth(); if (!reduce.matches && !frame) frame = requestAnimationFrame(tick); }
  root.querySelectorAll("button[data-move]").forEach(function (bt) { bt.addEventListener("click", function () { pick(bt.getAttribute("data-move")); }); });
  allBtn.addEventListener("click", function () { showAll = !showAll; allBtn.setAttribute("aria-pressed", String(showAll)); drawTeeth(); });

  /* panel 2 */
  var o = { dist: D.dist[1], mid: D.mid[1], icd: D.icd[1], shift: false }, base = D.jawAngles({ dist: D.dist[1], mid: D.mid[1], icd: D.icd[1], shift: false }, D).deg;
  var side = 0, u = 0, jf = 0, jl = 0, els = {};
  function val(k, v) { var r = D[k]; return v <= 50 ? r[0] + (r[1] - r[0]) * v / 50 : r[1] + (r[2] - r[1]) * (v - 50) / 50; }
  function drawJaw() {
    var F = D.jawFrame(o, side, u, D);
    Object.keys(F.attrs).forEach(function (sel) { var el = els[sel] || (els[sel] = jaw.querySelector(sel)); if (!el) return; var a = F.attrs[sel]; for (var k in a) el.setAttribute(k, a[k]); });
    var deg = Math.round(F.deg); jaw.querySelector(".cj-deg").textContent = deg + "°";
    rs.deg.textContent = deg + "°"; if (readout2) readout2.textContent = deg + "° between the paths";
    var dd = deg - Math.round(base);
    rs.cmp.textContent = dd > 0 ? dd + "° wider" : dd < 0 ? (-dd) + "° narrower" : "the starting setting";
    jaw.setAttribute("data-side", side > 0 ? "r" : side < 0 ? "l" : "");
    var s2 = "The two arrows are the paths a right mandibular molar cusp takes across the upper tooth: in a right move the jaw swings around the right (working) condyle; in a left move, around the left one. ";
    s2 += "Farther from the rotating condyle, farther from the midline or with more side shift, the paths spread wider; a wider intercondylar distance brings them closer. That is why an articulator much smaller than the patient makes crowns you have to adjust.";
    if (sum2.textContent !== s2) sum2.textContent = s2;
  }
  function jtick(now) {
    jf = 0; if (!root.isConnected) return;
    var dt = Math.min(.05, (now - (jl || now)) / 1000); jl = now;
    u = Math.min(2, u + dt / .9); var uu = u <= 1 ? u : 2 - u; var save = u; u = uu * uu * (3 - 2 * uu); drawJaw(); u = save;
    if (save < 2) jf = requestAnimationFrame(jtick); else { side = 0; u = 0; drawJaw(); }
  }
  root.querySelectorAll("[data-swing]").forEach(function (bt) { bt.addEventListener("click", function () {
    side = +bt.getAttribute("data-swing");
    if (reduce.matches) { u = 1; drawJaw(); return; }
    u = 0; jl = 0; if (!jf) jf = requestAnimationFrame(jtick);
  }); });
  root.querySelectorAll("input[data-s]").forEach(function (inp) { inp.addEventListener("input", function () { o[inp.getAttribute("data-s")] = val(inp.getAttribute("data-s"), +inp.value); if (!jf) { side = 0; u = 0; } drawJaw(); }); });
  shiftBtn.addEventListener("click", function () { o.shift = !o.shift; shiftBtn.setAttribute("aria-pressed", String(o.shift)); if (!jf) { side = 0; u = 0; } drawJaw(); });
  Array.prototype.forEach.call(jaw.querySelectorAll(".hot"), function (el) {
    var on = function () { infoEl.textContent = el.getAttribute("data-info"); el.classList.add("is-hot"); };
    var off = function () { el.classList.remove("is-hot"); };
    el.addEventListener("pointerenter", on); el.addEventListener("pointerleave", off);
    el.addEventListener("focus", on); el.addEventListener("blur", off); el.addEventListener("click", on);
  });
  drawTeeth(); drawJaw();
}

const CSS = `
.anima .cm-pair{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:6px 14px}
.anima .cm-tooth .fg-t{fill:var(--anatomy-text);font:11px var(--anatomy-mono)}
.anima .cm-tooth .fg-t.sm{font-size:10px}
.anima .cm-tooth .cm-who{fill:var(--anatomy-muted)}
.anima .cm-g{fill:none;stroke:var(--anatomy-mid);stroke-width:2;stroke-linecap:round;opacity:.5}
.anima .cm-g-head{fill:var(--anatomy-mid);opacity:.5}
.anima .cm-ghost{transition:opacity .25s}
.anima .cm-tooth[data-all="0"] .cm-ghost{opacity:0}
.anima .cm-tooth[data-move]:not([data-move=""]) .cm-ghost{opacity:.35}
.anima .cm-tooth[data-all="0"][data-move]:not([data-move=""]) .cm-ghost{opacity:0}
.anima .cm-tooth .fg-pin.cm-pin circle{fill:var(--surface);stroke:var(--anatomy-mid);stroke-width:1.2}
.anima .cm-tooth .fg-pin.cm-pin text{fill:var(--anatomy-strong);font:600 11px var(--anatomy-mono)}
.anima .cm-tooth[data-move="pro"] .cm-ghost[data-m="pro"],.anima .cm-tooth[data-move="work"] .cm-ghost[data-m="work"],.anima .cm-tooth[data-move="nonwork"] .cm-ghost[data-m="nonwork"],.anima .cm-tooth[data-move="retro"] .cm-ghost[data-m="retro"]{opacity:1}
.anima .cm-tooth[data-move="pro"] .cm-ghost[data-m="pro"] .cm-g,.anima .cm-tooth[data-move="work"] .cm-ghost[data-m="work"] .cm-g,.anima .cm-tooth[data-move="nonwork"] .cm-ghost[data-m="nonwork"] .cm-g,.anima .cm-tooth[data-move="retro"] .cm-ghost[data-m="retro"] .cm-g{opacity:0}
.anima .cm-tooth[data-move]:not([data-move=""]) .cm-pin circle{stroke:var(--anatomy-lit)}
.anima .cm-trace{fill:none;stroke:var(--anatomy-lit);stroke-width:3.4;stroke-linecap:round}
.anima .cm-head{fill:var(--anatomy-lit)}
.anima .cm-cusp{fill:var(--anatomy-lit);stroke:var(--surface);stroke-width:2}
.anima .cm-moves .am-btn{white-space:nowrap}
.anima .cm-jawbox{max-width:460px;margin:0 auto}
.anima .cm-jaw .fg-t{fill:var(--anatomy-text);font:10px var(--anatomy-mono)}
.anima .cj-mid{fill:none;stroke:var(--anatomy-faint);stroke-width:1;stroke-dasharray:4 4}
.anima .cj-jaw{fill:var(--tm-bone);stroke:var(--anatomy-hi);stroke-width:1.4;stroke-linejoin:round;fill-rule:evenodd}
.anima .cj-cond{fill:var(--tm-bone-in);stroke:var(--anatomy-hi);stroke-width:1.4}
.anima .cj-rest{fill:none;stroke:var(--anatomy-mid);stroke-width:1;stroke-dasharray:2 2}
.anima .cj-spin{fill:none;stroke:var(--anatomy-lit);stroke-width:2;stroke-dasharray:3 3;transition:opacity .2s}
.anima .cj-molar{fill:#e9dcbf;stroke:#8b7653;stroke-width:1.2}
.anima .cj-cusp{fill:var(--anatomy-strong)}
.anima .cj-path{fill:none;stroke-width:3.4;stroke-linecap:round}
.anima .cj-path.lat{stroke:var(--anatomy-lit)}.anima .cj-head.lat{fill:var(--anatomy-lit)}
.anima .cj-path.med{stroke:var(--tag-red)}.anima .cj-head.med{fill:var(--tag-red)}
.anima .cj-angle{fill:none;stroke:var(--anatomy-strong);stroke-width:1.2}
.anima .cj-deg{fill:var(--anatomy-strong);font:600 12px var(--anatomy-mono);paint-order:stroke;stroke:var(--surface);stroke-width:4px;stroke-linejoin:round}
.anima .cm-jawctl{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 12px;align-items:center}
.anima .cm-legend .sw{display:inline-block;width:14px;height:4px;border-radius:2px;margin:0 5px 2px 0;vertical-align:middle}.anima .cm-legend .sw.lat{background:var(--anatomy-lit)}.anima .cm-legend .sw.med{background:var(--tag-red);margin-left:10px}
.anima .cm-slab{font:.78rem var(--font-body);color:var(--ink-soft)}
@media (max-width:560px){.anima .cm-jawctl{grid-template-columns:1fr}.anima .cm-slab{margin:-4px 0 6px}}
@media (prefers-reduced-motion:reduce){.anima .cm-ghost,.anima .cj-spin{transition:none}}
`;

export function cuspmotion() {
  return {
    id: "cuspmotion", lec: "review",
    title: "Cusp pathways in motion",
    caption: "Pick a movement and watch the opposing cusp leave its MIP contact on #3 and on #30 at once: every path reverses on the lower tooth. Below, the jaw from above shows why the working and non-working paths spread apart.",
    html: `<div class="anima" data-anima="cuspmotion">${plate1}${controls1}${plate2}${controls2}${SOURCES}</div>`,
    css: CSS,
    live: cmLive.toString(),
    helpers: [jawMove, jawAngles, jawFrame],
    data: D,
  };
}
