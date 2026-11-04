// Fig 17: splint designs (Occlusion L7, "Occlusal therapy to establish stability": splints). The side-view rig
// (l7rig.mjs) with a splint on it: maxillary (a posterior flat plane with an anterior ramp) or mandibular (its ramp
// behind the upper front teeth); full or partial coverage (here an anterior plate: over months the covered teeth intrude
// and the uncovered ones extrude); stabilizing (joints seated) or repositioning (the jaw held in a chosen forward
// position). Protrude and the lower front teeth ride the ramp while every posterior tooth leaves the flat plane. The
// poses are solved in Node from the drawing (a splint 1.5 mm at its thinnest; the plate's months of wear close the
// anterior gap by 1.2 mm and extrude the back teeth until they meet); the tooth movement is exaggerated so it shows.
// Schematic, not a fabrication guide.
import { figureSvg, plateHtml } from "./shared.mjs";
import { rig, rigSolve, RIG_HELPERS, RIG_CSS } from "./l7rig.mjs";

const W = 560, H = 350;
const R = rig(), T = rigSolve.teeth(), C0 = [0, 0];
const r4 = (v) => Math.round(v * 10000) / 10000;
const thMax = rigSolve.splintTh(C0, C0, T, 1.5, "max"), thMand = rigSolve.splintTh(C0, C0, T, 1.5, "mand");
/* the anterior plate's months of wear: the jaw closes until the incisors have come 1.2 mm closer, and the back teeth
   extrude, half each, until they meet */
function months(th) {
  const y0 = rigSolve.tf(R.INC, { C: C0, Cm: C0, th })[1];
  let lo = 0, hi = th; for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (rigSolve.tf(R.INC, { C: C0, Cm: C0, th: m })[1] < y0 + 1.2) hi = m; else lo = m; }
  const th2 = (lo + hi) / 2;
  let g = Infinity;
  for (const t of T.lo) if (t.g === "post") for (const q of t.pts) { const r = rigSolve.tf(q, { C: C0, Cm: C0, th: th2 }); if (r[0] > -67.2 && r[0] < -35.2) g = Math.min(g, rigSolve.upperAt(r[0]) - r[1]); }
  return { th2: r4(th2), e: r4(Math.max(0, (g - 0.15) / 2)) };
}
const D = Object.assign(R, {
  W, H, V: { OX: 296, OY: 112.5, S: 2.5 }, /* the same frame as stability.mjs */
  BOX: [-12.8, -8.8, 4.6, 8.6], WIN: { x: 452, y: 92, w: 96, h: 96 }, FOG: { top: [21, 41], right: [40, 58], W, H },
  TH: { max: r4(thMax), mand: r4(thMand) }, MONTHS: { max: months(thMax), mand: months(thMand) },
  PROT: [r4(-3 / Math.SQRT2), r4(-3 / Math.SQRT2)], /* protrusion: 3 mm down the 45-degree ramp */
  REPOS: [r4(-3 * Math.cos(50 * Math.PI / 180)), r4(-3 * Math.sin(50 * Math.PI / 180))], /* held 3 mm forward and down the eminence */
});

/* the jaw pose for a state; m (0..1) is how far the months of wear have gone */
function spPose(st, D) {
  var th = D.TH[st.arch], C = [0, 0];
  if (st.cov === "part") th = th + (D.MONTHS[st.arch].th2 - th) * st.m;
  if (st.type === "repos") C = [D.REPOS[0], D.REPOS[1]];
  C = [C[0] + D.PROT[0] * st.p, C[1] + D.PROT[1] * st.p];
  return { C: C, Cm: [0, 0], th: th };
}
/* the splint outline for a state, from the jaw pose at rest (P0: closed, before any protrusion) */
function spPoly(st, P0, D) {
  var T = function (q) { return D.rgT(q, P0); }, lt = D.CUSP_LO.map(T), can = T(D.LC_TIP), inc = T(D.INC), pts, cups = st.type === "repos";
  function cupRow(base, tips, up) { /* a flat line through the opposing cusp tips, or (repositioning) cups that hold them */
    var o = [];
    tips.forEach(function (t) { if (!cups) { o.push(t); return; } var y0 = base(t[0]); o.push([t[0] + 1.2, y0], [t[0] + 0.6, t[1] + (up ? 0.3 : -0.3)], t, [t[0] - 0.6, t[1] + (up ? 0.3 : -0.3)], [t[0] - 1.2, y0]); });
    return o;
  }
  if (st.arch === "max") {
    var a = lt[0], b = lt[lt.length - 1], k = (b[1] - a[1]) / (b[0] - a[0]), off = cups ? -0.6 : 0, plane = function (x) { return a[1] + off + k * (x - a[0]); };
    /* the ramp runs down and forward from the lower incisor's contact; the labial flange wraps the upper central's edge */
    var F = [inc[0] - 2.5, inc[1] - 2.5], L = D.U_LAB, fx = Math.min(F[0], L[0][0]) - 1, front = [[F[0], F[1]], [fx, F[1] + 0.3], [L[2][0] - 0.9, L[2][1] - 0.3], [L[2][0] + 0.2, L[2][1] + 0.3], [-80, -40.4], [-76.2, -40.4]];
    if (st.cov === "part") return [[-66.6, -40]].concat([[-66.6, Math.min(can[1], inc[1]) - 0.2], [can[0] + 1.4, can[1] - 0.15], [can[0] - 1.4, can[1] - 0.15], [inc[0] + 1.6, inc[1] - 0.1], inc], front);
    pts = [[-34.4, -40.1], [-34.4, plane(-34.4)]].concat(cupRow(plane, lt, true), [[-69.4, plane(-69.4)], [can[0] + 1.2, can[1] - 0.15], [can[0] - 1.4, can[1] - 0.15], [inc[0] + 1.6, inc[1] - 0.1], inc], front, [[-68, -39.9]]);
    return pts;
  }
  /* mandibular: over the lower teeth (jaw frame), its top a flat plane through the upper cusp tips; in front a ramp
     rising behind the upper central incisor from its lingual-incisal contact */
  var yb = D.YB, inv = function (p) { /* skull to jaw frame, at P0 */ var x = p[0] - P0.C[0], y = p[1] - P0.C[1], c = Math.cos(-P0.th), s = Math.sin(-P0.th); return [x * c - y * s + P0.Cm[0], x * s + y * c + P0.Cm[1]]; };
  var E = D.U_LING, E2 = [E[0] + 3.4, E[1] + 3.4], UC = D.UC_TIP, LL = D.L_LAB;
  /* jaw frame: the labial flange over the lower central's incisal edge, then the buccal edge back to the second molar */
  var bottomJ = [[LL[1][0] - 0.7, LL[1][1] + 0.2], [LL[2][0] - 0.6, LL[2][1] - 0.2], [LL[2][0] + 3.5, -44.8], [-80, -43.8], [-70.6, -43.6], [-60, -43.4], [-37.4, -43.4], [-37.2, -41.4]];
  var bottom = bottomJ.map(T);
  var topRow = cups ? cupRow(function () { return yb - 0.6; }, D.CUSP_UP.map(function (u) { return [u[0], u[1]]; }), false) : [[-37.4, yb], [-69.6, yb]];
  if (st.cov === "part") return bottom.slice(0, 3).concat([T([-80, -43.6]), T([-70.6, -43.6]), T([-70.4, -41.6]), [UC[0] + 1.4, UC[1] - 0.1], UC, [UC[0] - 1.6, UC[1] + 0.1], E2, E]);
  return bottom.concat(topRow, [[UC[0] + 1.4, yb], UC, [UC[0] - 1.6, UC[1] + 0.1], E2, E]);
}
function spSvg(st, D) {
  var f = function (n) { return Math.round(n * 10) / 10; }, V = D.V, o = "";
  function X(p) { return V.OX + p[0] * V.S; } function Y(p) { return V.OY - p[1] * V.S; }
  function tx(x, y, t, cls, a) { return '<text class="sp-t' + (cls ? " " + cls : "") + '" x="' + f(x) + '" y="' + f(y) + '"' + (a ? ' text-anchor="' + a + '"' : "") + ">" + t + "</text>"; }
  var P = D.spPose(st, D), P0 = D.spPose({ arch: st.arch, cov: st.cov, type: st.type, m: st.m, p: 0 }, D);
  /* the splint moves with its arch: a maxillary one stays with the skull (and with intruding upper front teeth); a
     mandibular one goes where the jaw goes */
  var sp = D.spPoly(st, P0, D), mv = st.cov === "part" ? (st.arch === "max" ? { ua: 1.2 * st.m, up: -D.MONTHS.max.e * st.m, la: 0, lp: D.MONTHS.max.e * st.m } : { ua: 0, up: -D.MONTHS.mand.e * st.m, la: -1.2 * st.m, lp: D.MONTHS.mand.e * st.m }) : null;
  if (st.arch === "max") sp = sp.map(function (p) { return st.cov === "part" ? [p[0], p[1] + 1.2 * st.m] : p; });
  else sp = sp.map(function (p) { var x = p[0] - P0.C[0], y = p[1] - P0.C[1], c = Math.cos(-P0.th), s = Math.sin(-P0.th); var j = [x * c - y * s, x * s + y * c]; if (st.cov === "part") j[1] -= 1.2 * st.m; return D.rgT(j, { C: P.C, Cm: [0, 0], th: P.th }); });
  var info = st.arch === "max" ? "Maxillary splint: a plastic cover over the upper teeth with a new occlusal surface built on it, flat in the posterior (no indentations or elevations, so no eccentric contacts) with an anterior ramp." : "Mandibular splint: over the lower teeth, its flat surface meeting the upper cusp tips and its ramp behind the upper front teeth. Less speech interference and less visible: the daytime choice.";
  if (st.type === "repos") info = "Repositioning splint: built to hold the mandible in a chosen non-centric position (disc displacements, sleep apnea and similar), here forward. Drawn with cups that hold the opposing cusps there. Irreversible, on the slides.";
  if (st.cov === "part") info = "Partial coverage, here over the front teeth only: the back teeth don't touch. Covered teeth may intrude and uncovered teeth extrude (supereruption).";
  var spSvgStr = '<path class="sp-splint hot" data-info="' + info + '" d="' + D.rgD(sp, V, true) + '"/>';
  o += D.rgScene(P, V, D, { mv: mv, mid: st.arch === "mand" ? spSvgStr : "", fog: D.FOG });
  if (st.arch === "max") o += spSvgStr;
  /* the design's text sits on a soft card at the top, over the faded temporal region (its third line, the result,
     shows once a move is done) */
  o += D.rgCard([194, 9, 556, st.still && (st.p > 0 || st.cov === "part") ? 62 : 44], 10, 10);
  /* contacts against the splint, or the gaps left in the back */
  if (st.still) {
    if (st.cov === "full" && st.p === 0) {
      var pts = st.arch === "max" ? D.CUSP_LO.concat([D.LC_TIP, D.INC]).map(function (q) { return D.rgT(q, P); }) : D.CUSP_UP.concat([D.UC_TIP, D.U_LING]);
      pts.forEach(function (r) { o += '<circle class="sp-hit" cx="' + f(X(r)) + '" cy="' + f(Y(r)) + '" r="2.6"/>'; });
    } else if (st.cov === "full") {
      var ac = st.arch === "max" ? D.rgT(D.INC, P) : D.U_LING;
      o += '<circle class="sp-hit" cx="' + f(X(ac)) + '" cy="' + f(Y(ac)) + '" r="2.6"/>';
      o += tx(200, 56, "back teeth discluded: no contacts on the flat plane", "sp-res sp-ok", "start");
    } else {
      var ic = st.arch === "max" ? D.rgT(D.INC, P) : D.U_LING;
      o += '<circle class="sp-hit" cx="' + f(X(ic)) + '" cy="' + f(Y(ic)) + '" r="2.6"/>';
      o += tx(200, 56, st.m > 0.99 ? "covered teeth intruded, uncovered ones extruded" : "back teeth apart: nothing holds them", "sp-res " + (st.m > 0.99 ? "sp-bad" : "sp-cap"), "start");
    }
  }
  /* the joint, magnified */
  var J = D.rgJoint(P.C, D.BOX, D.WIN, D, "joint, magnified", P.th), seated = Math.hypot(P.C[0], P.C[1]) < 0.05;
  o += J.svg;
  if (!seated) { var g = D.rgCirc([0, 0], D.CR, 40).map(function (p) { return [J.V.OX + p[0] * J.V.S, J.V.OY - p[1] * J.V.S]; }), bx = D.WIN; g = g.filter(function (p) { return p[0] > bx.x && p[0] < bx.x + bx.w && p[1] > bx.y && p[1] < bx.y + bx.h; }); if (g.length > 2) o += '<path class="sp-seat" d="M' + g.map(function (p) { return f(p[0]) + " " + f(p[1]); }).join("L") + '"/>'; }
  var L = st.type === "repos" ? ["held forward:", "a chosen non-", "centric position"] : st.p > 0 ? ["translating", "down the", "eminence"] : ["seated:", "orthopedically", "stable"];
  L.forEach(function (t, i) { o += tx(452, 228 + i * 14, t, i ? "sp-cap" : "sp-head", "start"); });
  /* the design, in words, top left */
  var name = (st.arch === "max" ? "maxillary" : "mandibular") + ", " + (st.cov === "full" ? "full coverage" : "partial coverage") + ", " + (st.type === "stab" ? "stabilizing" : "repositioning");
  o += tx(200, 22, name, "sp-head", "start");
  o += tx(200, 38, st.type === "repos" ? "irreversible on the slides" : st.cov === "full" && st.arch === "max" ? "flat plane stabilization splint: reversible" : st.cov === "full" ? "flat plane, ramp behind the upper incisors" : "anterior plate: back teeth uncovered", "sp-cap", "start");
  return o;
}

const SUM = {
  max: "Maxillary: a posterior flat plane with an anterior ramp. Very stable and retentive, sturdier and less likely to fracture (better for heavy clenchers), easier to get anterior contacts on and to adjust; usable in Class I, II and even III, and ideally suited for Class II division 1 (excessive horizontal overlap). It shows, so it's normally worn at night.",
  mand: "Mandibular: generally less speech interference and less visible when speaking, so it's preferable for a patient who wears the splint during the day. Either arch can give a perfect dental occlusion coinciding with orthopedic stability.",
  full: " Full coverage covers every tooth in the arch, reduces the chance of teeth moving and is recommended in almost all situations.",
  part: " Partial coverage may let covered teeth intrude and uncovered teeth extrude (supereruption), may not be as effective, and small ones can be an aspiration hazard at night; whether they're easier to wear is questionable.",
  stab: " Stabilizing: dental stability while the joints are seated in an orthopedically stable relationship.",
  repos: " Repositioning: used in disc displacements, sleep apnea and other cases where a specific non-centric mandibular position is wanted; the slides list it as irreversible, with equilibration, orthodontics and surgery.",
  prot: " Protruding, the lower front teeth ride the ramp and every posterior tooth leaves the flat plane: no eccentric contacts in the back.",
};

const svg = figureSvg({ width: W, height: H, className: "sp-svg", label: "Side view of the jaws with an occlusal splint: maxillary or mandibular, full or partial coverage, stabilizing or repositioning; the joint magnified at the right.", body: spSvg({ arch: "max", cov: "full", type: "stab", p: 0, m: 0, still: true }, Object.assign({ spPose, spPoly }, D, Object.fromEntries(RIG_HELPERS.map((fn) => [fn.name, fn])))) });
const plate = plateHtml({ fig: "Fig 17", title: "Splint designs", hint: "pick a design · protrude · wear it for months", readout: "", body: `<div class="am-svg sp-box">${svg}</div>` });
const controls = `<div class="am-controls" role="group" aria-label="Arch"><button type="button" class="am-btn" data-sparch="max" aria-pressed="true">Maxillary</button><button type="button" class="am-btn" data-sparch="mand" aria-pressed="false">Mandibular</button></div>
<div class="am-controls" role="group" aria-label="Coverage"><button type="button" class="am-btn" data-spcov="full" aria-pressed="true">Full coverage</button><button type="button" class="am-btn" data-spcov="part" aria-pressed="false">Partial (front teeth only)</button></div>
<div class="am-controls" role="group" aria-label="Kind"><button type="button" class="am-btn" data-sptype="stab" aria-pressed="true">Stabilizing</button><button type="button" class="am-btn" data-sptype="repos" aria-pressed="false">Repositioning</button></div>
<div class="am-controls"><button type="button" class="am-btn" data-spgo="prot" aria-pressed="false">Protrude</button><button type="button" class="am-btn" data-spgo="months" aria-pressed="false" hidden>Wear it for months</button></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Hover or tap the splint, the joint or the mandible.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From the L7 notes (Dr. Givan's Occ Lec6 slides and the 10/29 recording): splints are maxillary or mandibular, full or partial arch, stabilizing or repositioning; a maxillary splint has a posterior flat plane (no indentations or elevations, so no eccentric contacts) with an anterior ramp, a mandibular splint its ramp behind the front teeth; their advantages; full coverage recommended in almost all situations; partial coverage may let covered teeth intrude and uncovered teeth extrude; a repositioning splint holds a specific non-centric position and is irreversible on the slides.</li>
<li>Schematic: the jaws, teeth and splints are drawn for clarity, not measured or fabricated (the skull and mandible to typical adult proportions, the arch laid out flat). The splints are drawn 1.5 mm at their thinnest, the ramps at 45 degrees, the partial splint as a plate over the front teeth, the repositioning splint 3 mm forward with cups that hold the cusps (its design beyond that isn't in the notes), and the months of tooth movement are exaggerated so they show. Educational, not clinical guidance.</li></ul></details>`;

function spLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var svg = root.querySelector(".sp-svg"), sum = root.querySelector(".am-summary"), info = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]");
  var bProt = root.querySelector('[data-spgo="prot"]'), bMon = root.querySelector('[data-spgo="months"]');
  var st = { arch: "max", cov: "full", type: "stab", p: 0, m: 0, still: true, wantP: 0, wantM: 0 }, raf = 0;
  function text() {
    var s = D.SUM[st.arch] + D.SUM[st.cov] + D.SUM[st.type] + (st.wantP ? D.SUM.prot : "");
    sum.textContent = s;
    if (readout) readout.textContent = st.type === "repos" ? "jaw held forward" : st.cov === "part" ? (st.wantM ? "teeth moved" : "back teeth apart") : st.wantP ? "back teeth discluded" : "even contacts, joints seated";
  }
  function draw() { svg.innerHTML = D.spSvg(st, D); }
  function anim() {
    cancelAnimationFrame(raf); text();
    if (reduce.matches) { st.p = st.wantP; st.m = st.wantM; st.still = true; draw(); return; }
    var p0 = st.p, m0 = st.m, t0 = performance.now(), dur = st.wantM !== m0 ? 1600 : 700;
    st.still = false;
    function step(now) { var u = Math.min(1, (now - t0) / dur), e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; st.p = p0 + (st.wantP - p0) * e; st.m = m0 + (st.wantM - m0) * e; st.still = u >= 1; draw(); if (u < 1) raf = requestAnimationFrame(step); }
    raf = requestAnimationFrame(step);
  }
  function sync() {
    /* protrusion is shown on a full-coverage stabilizing splint; the months of wear on a partial one */
    var canP = st.cov === "full" && st.type === "stab";
    bProt.disabled = !canP; if (!canP) { st.wantP = 0; st.p = 0; bProt.setAttribute("aria-pressed", "false"); }
    bMon.hidden = st.cov !== "part"; if (st.cov !== "part") { st.wantM = 0; st.m = 0; bMon.setAttribute("aria-pressed", "false"); }
  }
  function group(attr, key) { root.querySelectorAll("[" + attr + "]").forEach(function (b) { b.addEventListener("click", function () { st[key] = b.getAttribute(attr); root.querySelectorAll("[" + attr + "]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); st.m = 0; st.wantM = 0; bMon.setAttribute("aria-pressed", "false"); sync(); st.still = true; text(); draw(); }); }); }
  group("data-sparch", "arch"); group("data-spcov", "cov"); group("data-sptype", "type");
  bProt.addEventListener("click", function () { st.wantP = st.wantP ? 0 : 1; bProt.setAttribute("aria-pressed", String(!!st.wantP)); anim(); });
  bMon.addEventListener("click", function () { st.wantM = st.wantM ? 0 : 1; bMon.setAttribute("aria-pressed", String(!!st.wantM)); anim(); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && svg.contains(el)) info.textContent = el.getAttribute("data-info"); }
  svg.addEventListener("pointerover", hot); svg.addEventListener("click", hot);
  sync(); text(); draw();
}

const CSS = RIG_CSS("sp") + `
.anima .sp-box{max-width:600px;margin:0 auto}
.anima .sp-svg .sp-t{fill:var(--anatomy-text);font:11.5px var(--anatomy-mono);paint-order:stroke;stroke:var(--surface);stroke-width:3.5px;stroke-linejoin:round}
.anima .sp-svg .sp-head{fill:var(--anatomy-strong);font-weight:700}
.anima .sp-svg .sp-cap{fill:var(--anatomy-muted);font-size:10.5px}
.anima .sp-svg .sp-res{font-size:11.5px;font-weight:700}
.anima .sp-svg .sp-ok{fill:#2f8a5b}
.anima .sp-svg .sp-bad{fill:var(--tm-vessel)}
.anima .sp-svg .sp-hit{fill:#2f8a5b;stroke:var(--surface);stroke-width:1}
.anima .sp-svg .sp-splint{fill:var(--accent);fill-opacity:.3;stroke:var(--accent);stroke-width:1.2;stroke-linejoin:round}
.anima .sp-svg .sp-seat{fill:none;stroke:var(--anatomy-lit);stroke-width:1.2;stroke-dasharray:3 3;vector-effect:none}
.anima .am-btn:disabled{opacity:.45;cursor:not-allowed}
`;

export function splints() {
  return {
    id: "splints", lec: "malocclusion",
    title: "Splint designs",
    caption: "Build a splint: maxillary or mandibular, full or partial coverage, stabilizing or repositioning. Protrude on the ramp, or wear a partial splint for months.",
    html: `<div class="anima" data-anima="splints">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: spLive.toString(),
    helpers: RIG_HELPERS.concat([spPose, spPoly, spSvg]),
    data: Object.assign({ SUM }, D),
  };
}
