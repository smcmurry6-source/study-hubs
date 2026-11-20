// Fig 16: orthopedic vs occlusal stability (Occlusion L7, "Orthopedic stability and occlusal stability"). The side-view
// rig (l7rig.mjs: the skull and mandible, the cranium fading out above and behind): seat the joints and close on the hinge, and the first tooth touches before the rest (orthopedic
// stability, occlusal instability); bite into MIP and a condyle comes off its seat (occlusal stability, orthopedic
// instability); a flat plane stabilization splint gives both. The discrepancy buttons give the notes' risk factors
// (1-2 mm not likely a problem, more than 3 mm increased risk), "the 10%" makes MIP coincide with closure in CR, and the
// bruxer toggle adds the loading. The joint is magnified in a window. Every pose is solved in Node (the jaw closes on
// the hinge to the first touch; the splint is as thin as 1.5 mm at its thinnest), and drawn to one scale; the condyle's
// path off its seat is drawn forward and down. Schematic, not traced from a patient.
import { figureSvg, plateHtml } from "./shared.mjs";
import { rig, rigSolve, RIG_HELPERS, RIG_CSS } from "./l7rig.mjs";

const W = 560, H = 350;
const R = rig(), T = rigSolve.teeth();
const r2 = (v) => Math.round(v * 10000) / 10000;
function poses(d) {
  const Cm = [r2(R.EMI[0] * d), r2(R.EMI[1] * d)], C0 = [0, 0];
  const th = rigSolve.contactTh(C0, Cm, T), ths = rigSolve.splintTh(C0, Cm, T, 1.5, "max");
  return { d, Cm, th: r2(th), open: r2(th + 0.07), splint: r2(ths), contact: d ? rigSolve.contactPt({ C: C0, Cm, th }, T) : null };
}
const D = Object.assign(R, {
  W, H, V: { OX: 296, OY: 112.5, S: 2.5 }, /* room below for the chin when the jaw opens */
  BOX: [-12.8, -8.8, 4.6, 8.6], WIN: { x: 452, y: 92, w: 96, h: 96 }, FOG: { top: [21, 41], right: [40, 58], W, H },
  LAB: { fc: [108, 166], ft: [6, 186] }, /* where the two callouts sit (screen px) */
  POSE: { lo: poses(1.5), hi: poses(3.5), none: poses(0) },
});

/* the pose to draw for a mode: closed on the hinge with the joints seated, in MIP, or seated on a splint */
function stTarget(mode, k, D) {
  var p = D.POSE[k];
  if (mode === "mip") return { C: p.Cm, Cm: p.Cm, th: 0 };
  if (mode === "open") return { C: [0, 0], Cm: p.Cm, th: p.open };
  if (mode === "splint") return { C: [0, 0], Cm: p.Cm, th: p.splint };
  return { C: [0, 0], Cm: p.Cm, th: p.th };
}
/* a maxillary flat plane splint for the pose: over the upper occlusal surfaces, its flat underside through the lower
   cusp tips, stepping up to the lower canine and incisor, with the anterior ramp in front of the incisor */
function stSplint(P, D) {
  var lt = D.CUSP_LO.map(function (q) { return D.rgT(q, P); }), a = lt[0], b = lt[lt.length - 1], k = (b[1] - a[1]) / (b[0] - a[0]);
  var plane = function (x) { return a[1] + k * (x - a[0]); };
  var can = D.rgT(D.LC_TIP, P), inc = D.rgT(D.INC, P), L = D.U_LAB;
  /* the anterior ramp: from the incisor's contact, down and forward at 45 degrees to the splint's incisal edge; the
     labial flange wraps the upper central's incisal edge */
  var F = [inc[0] - 2.2, inc[1] - 2.2], fx = Math.min(F[0], L[0][0]) - 1;
  return [[-34.4, -40.1], [-34.4, plane(-34.4)], [-69.4, plane(-69.4)], [can[0] + 1.2, can[1] - 0.15], [can[0] - 1.4, can[1] - 0.15], [inc[0] + 1.6, inc[1] - 0.1], inc, F, [fx, F[1] + 0.3], [L[2][0] - 0.9, L[2][1] - 0.3], [L[2][0] + 0.2, L[2][1] + 0.3], [-80, -40.4], [-76.2, -40.4], [-68, -39.9]];
}
function stSvg(st, D) {
  var f = function (n) { return Math.round(n * 10) / 10; }, V = D.V, P = st.P, k = st.k, mode = st.mode, o = "";
  function X(p) { return V.OX + p[0] * V.S; } function Y(p) { return V.OY - p[1] * V.S; }
  function tx(x, y, t, cls, a) { return '<text class="st-t' + (cls ? " " + cls : "") + '" x="' + f(x) + '" y="' + f(y) + '"' + (a ? ' text-anchor="' + a + '"' : "") + ">" + t + "</text>"; }
  /* a label (one or more lines, left-aligned at x, first baseline y) whose leader leaves the side of its text box
     nearest the target and ends on a dot there */
  function lab(lines, x, y, p, cx, cy) {
    var w = Math.max.apply(null, lines.map(function (t) { return t.length; })) * 6.9, h = lines.length * 13, bx = [x - 2, y - 11, x + w + 2, y - 11 + h + 2];
    var px = X(p), py = Y(p), sx = px < bx[0] ? bx[0] : px > bx[2] ? bx[2] : px, sy = py < bx[1] ? bx[1] : py > bx[3] ? bx[3] : py;
    if (cx != null) { sx = cx; sy = cy; }
    return '<g class="am-callout"><path class="am-leader" d="M' + f(sx) + " " + f(sy) + "L" + f(px) + " " + f(py) + '"/><circle class="am-dot" cx="' + f(px) + '" cy="' + f(py) + '" r="1.8"/>' + lines.map(function (t, i) { return tx(x, y + i * 13, t, "", "start"); }).join("") + "</g>";
  }
  var seatedNow = Math.hypot(P.C[0], P.C[1]) < 0.05, none = k === "none";
  var ortho = mode !== "mip" || none, occl = mode !== "seated" || none;
  o += D.rgScene(P, V, D, { cls: "st-cj", fog: D.FOG });
  /* the splint, fading in once the jaw is there */
  if (mode === "splint" && st.u > 0.6) o += '<path class="st-splint hot" style="opacity:' + f(Math.min(1, (st.u - 0.6) / 0.4)) + '" data-info="Flat plane stabilization splint: a plastic cover over the maxillary occlusal surfaces, flat in the posterior (no indentations, so no eccentric contacts) with an anterior ramp. The joints are seated and every tooth meets the plastic: new contacts. Whatever MIP was, it\'s gone while the splint is in." d="' + D.rgD(D.stSplint(P, D), V, true) + '"/>';
  /* contacts */
  if (st.u >= 1) {
    if (mode === "mip" || (mode === "seated" && none)) D.CUSP_LO.forEach(function (q) { var r = D.rgT(q, P); o += '<circle class="st-hit-ok" cx="' + f(X(r)) + '" cy="' + f(Y(r)) + '" r="2.6"/>'; });
    else if (mode === "seated") { var c = D.POSE[k].contact; o += '<circle class="st-hit-bad" cx="' + f(X(c)) + '" cy="' + f(Y(c)) + '" r="6"/>'; }
    else if (mode === "splint") { D.CUSP_LO.concat([D.LC_TIP, D.INC]).forEach(function (q) { var r = D.rgT(q, P); o += '<circle class="st-hit-ok" cx="' + f(X(r)) + '" cy="' + f(Y(r)) + '" r="2.6"/>'; }); }
  }
  /* loading: a bruxer clenches and grinds hard on whatever the teeth meet, and the force reaches the joints */
  if (st.brux && st.u >= 1) {
    [[-45.8, -58], [-56.6, -58]].forEach(function (q) { var r = D.rgT(q, P); o += '<path class="st-load" d="M' + f(X(r)) + " " + f(Y(r) + 16) + "V" + f(Y(r) + 2) + "M" + f(X(r) - 4) + " " + f(Y(r) + 7) + "L" + f(X(r)) + " " + f(Y(r) + 2) + "L" + f(X(r) + 4) + " " + f(Y(r) + 7) + '"/>'; });
    var cb = [P.C[0], P.C[1] - 9]; o += '<path class="st-load" d="M' + f(X(cb)) + " " + f(Y(cb) + 14) + "V" + f(Y(cb)) + "M" + f(X(cb) - 4) + " " + f(Y(cb) + 5) + "L" + f(X(cb)) + " " + f(Y(cb)) + "L" + f(X(cb) + 4) + " " + f(Y(cb) + 5) + '"/>';
  }
  /* labels */
  if (mode === "seated" && !none && st.u >= 1) { var cp = D.POSE[k].contact; o += lab(["first contact"], D.LAB.fc[0], D.LAB.fc[1], cp, X(cp) + 0.5, D.LAB.fc[1] - 4); var ia = D.rgT(D.INC, P); o += lab(["front", "teeth", "apart"], D.LAB.ft[0], D.LAB.ft[1], [ia[0] - 0.4, ia[1] - 0.6]); }
  /* the two kinds of stability */
  function lamp(x, y, on, name, sub) { return '<circle class="' + (on ? "st-lamp-ok" : "st-lamp-bad") + '" cx="' + (x + 6) + '" cy="' + (y - 4) + '" r="5.5"/>' + tx(x + 18, y, name, "st-head", "start") + tx(x + 18, y + 15, sub, "st-sub " + (on ? "st-ok" : "st-bad"), "start"); }
  /* the two lamps sit at the top, over the faded temporal region, clear of the face and orbit */
  o += D.rgCard([192, 7, 404, 70], 10, 10);
  o += lamp(194, 20, ortho, "orthopedic stability", ortho ? "both joints seated" : "a condyle off its seat");
  o += lamp(194, 52, occl, "occlusal stability", mode === "splint" ? "every tooth meets the splint" : occl ? "teeth fully together (MIP)" : "one tooth touches first");
  /* the joint, magnified */
  var J = D.rgJoint(P.C, D.BOX, D.WIN, D, "joint, magnified", P.th);
  o += J.svg;
  if (!seatedNow) { var g = D.rgCirc([0, 0], D.CR, 40).map(function (p) { return [J.V.OX + p[0] * J.V.S, J.V.OY - p[1] * J.V.S]; }); var bx = D.WIN; g = g.filter(function (p) { return p[0] > bx.x && p[0] < bx.x + bx.w && p[1] > bx.y && p[1] < bx.y + bx.h; }); if (g.length > 2) o += '<path class="st-seat" d="M' + g.map(function (p) { return f(p[0]) + " " + f(p[1]); }).join("L") + '"/>'; }
  /* what the risk is */
  var L = [];
  if (none) L = ["the 10%:", "MIP coincides", "with closure", "in CR"];
  else if (mode === "mip") L = (k === "lo" ? ["off its seat", "1-2 mm: not", "likely to be", "a problem"] : ["off its seat", "more than 3 mm:", "increased risk"]).concat(st.brux ? ["+ bruxing:", "greater risk"] : []);
  else L = ["seated, stable", "with the disc", "and fossa"].concat(st.brux ? ["(loading the", "splint now)"].slice(0, mode === "splint" ? 2 : 0) : []);
  L.forEach(function (t, i) { o += tx(452, 228 + i * 14, t, i === 0 ? "st-head" : (mode === "mip" && !none && i > 0 ? "st-bad" : "st-sub"), "start"); });
  return o;
}

const SUM = {
  seated: "Teeth apart, the muscles seat the joints: orthopedic stability. Keep the joints seated and close on the hinge, and in most people one tooth touches before the rest: occlusal instability. Only about 10% of people have MIP coincident with closure in CR.",
  mip: "To bring the teeth fully together (MIP), one or both condyles come off their seat: dental stability, prioritized for function, sacrifices orthopedic stability. That is orthopedic instability: with the teeth in MIP, a condyle isn't in a stable relationship with the disc and fossa, and it may lead to an intracapsular disorder.",
  splint: "A flat plane stabilization splint gives both at once: the joints seated (orthopedic stability) and every tooth meeting the plastic evenly (occlusal stability). The goals: condyles up and forward against the eminences, discs in place, the posterior teeth contacting evenly and simultaneously, the anterior teeth discluding them in eccentric movement.",
  none: "In about 10% of people, MIP coincides with closure in CR: the joints stay seated with the teeth fully together, orthopedic and occlusal stability at once.",
  lo: " A condylar misposition of 1-2 mm is not likely to create a problem.",
  hi: " More than 3 mm presents increased risk (some would say 4 mm). Increased risk doesn't mean the patient will have a problem.",
  brux: " The amount of loading is the other risk factor: patients who brux have greater risk. Orthopedic instability needs loading forces to destabilize.",
};

const svg = figureSvg({ width: W, height: H, className: "st-svg", label: "Side view of the jaw joint, the mandible and both dental arches: seated joints with one tooth touching first, the teeth in MIP with a condyle off its seat, or a flat plane splint giving both; the joint magnified at the right.", body: stSvg({ P: stTarget("seated", "lo", D), k: "lo", mode: "seated", u: 1, brux: false }, Object.assign({ stTarget, stSplint }, D, Object.fromEntries(RIG_HELPERS.map((fn) => [fn.name, fn])))) });
const plate = plateHtml({ fig: "Fig 16", title: "Orthopedic vs occlusal stability", hint: "seat the joints · bite into MIP · add a splint", readout: "", body: `<div class="am-svg st-box">${svg}</div>` });
const controls = `<div class="am-controls" role="group" aria-label="Position"><button type="button" class="am-btn" data-stmode="seated" aria-pressed="true">Seat the joints and close</button><button type="button" class="am-btn" data-stmode="mip" aria-pressed="false">Bite into MIP</button><button type="button" class="am-btn" data-stmode="splint" aria-pressed="false">Stabilization splint</button></div>
<div class="am-controls" role="group" aria-label="How far MIP is from CR"><button type="button" class="am-btn" data-stk="lo" aria-pressed="true">1-2 mm off</button><button type="button" class="am-btn" data-stk="hi" aria-pressed="false">More than 3 mm off</button><button type="button" class="am-btn" data-stk="none" aria-pressed="false">The 10% (MIP = CR)</button><button type="button" class="am-btn" data-stbrux aria-pressed="false">Bruxer (heavy loading)</button></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Hover or tap the joint, the mandible or the splint.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From the L7 notes (Dr. Givan's Occ Lec6 slides and the 10/29 recording): joints fully seated give orthopedic stability, teeth fully in contact (MIP) occlusal stability; teeth apart, the muscles seat the joints; joints seated, close until tooth contact and the result is occlusal instability; about 10% of the population have MIP coincident with closure in CR; orthopedic instability (with the teeth in MIP, a condyle not stable with the disc and fossa) may lead to an intracapsular disorder; risk factors: the degree of discrepancy (1-2 mm not likely a problem, more than 3 mm increased risk) and the amount of loading (bruxers); a flat plane stabilization splint provides dental stability with the joints seated.</li>
<li>Schematic: one scale throughout, but the teeth, cusps (a regular zigzag), joint and the condyle's path off its seat (drawn forward and down) are drawn for clarity, not measured; the skull and mandible are drawn to typical adult proportions around them, with the arch laid out flat so the front teeth sit a little farther forward than in a true side view. The poses are solved from that drawing: the jaw hinges closed to the first touch, and the splint is 1.5 mm at its thinnest. Educational, not clinical guidance.</li></ul></details>`;

function stLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var svg = root.querySelector(".st-svg"), sum = root.querySelector(".am-summary"), info = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]");
  var st = { mode: "seated", k: "lo", brux: false, u: 1, P: D.stTarget("seated", "lo", D) }, raf = 0;
  function text() {
    var s = st.k === "none" ? D.SUM.none : D.SUM[st.mode];
    if (st.k !== "none" && st.mode === "mip") s += D.SUM[st.k];
    if (st.brux && st.k !== "none" && st.mode === "mip") s += D.SUM.brux;
    sum.textContent = s;
    if (readout) readout.textContent = st.k === "none" || st.mode === "splint" ? "both stable" : st.mode === "mip" ? "teeth stable, joint not" : "joints stable, teeth not";
  }
  function draw() { svg.innerHTML = D.stSvg(st, D); }
  function lerpP(a, b, u) { function l(x, y) { return x + (y - x) * u; } return { C: [l(a.C[0], b.C[0]), l(a.C[1], b.C[1])], Cm: [l(a.Cm[0], b.Cm[0]), l(a.Cm[1], b.Cm[1])], th: l(a.th, b.th) }; }
  /* move through a list of poses, the last one being the mode's; a splint fades in once the jaw is there */
  function go(seq) {
    cancelAnimationFrame(raf); text();
    if (reduce.matches) { st.P = seq[seq.length - 1]; st.u = 1; draw(); return; }
    var i = 0, from = st.P, t0 = performance.now(), dur = 650;
    st.u = 0;
    function step(now) {
      if (i >= seq.length) { /* the jaw is there: fade the splint in */
        st.u = Math.min(1, 0.6 + (now - t0) / 500 * 0.4); draw();
        if (st.u < 1) raf = requestAnimationFrame(step);
        return;
      }
      var u = Math.min(1, (now - t0) / dur), e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      st.P = lerpP(from, seq[i], e);
      if (u >= 1) { from = seq[i]; i++; t0 = now; }
      if (i >= seq.length && st.mode !== "splint") { st.u = 1; draw(); return; }
      if (i >= seq.length) st.u = 0.6;
      draw(); raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
  }
  function seqFor(mode) {
    var tgt = D.stTarget(mode, st.k, D);
    if (mode === "seated") return [D.stTarget("open", st.k, D), tgt];
    if (mode === "splint") return [D.stTarget("open", st.k, D), tgt];
    return [tgt];
  }
  root.querySelectorAll("[data-stmode]").forEach(function (b) { b.addEventListener("click", function () { st.mode = b.getAttribute("data-stmode"); root.querySelectorAll("[data-stmode]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); go(seqFor(st.mode)); }); });
  root.querySelectorAll("[data-stk]").forEach(function (b) { b.addEventListener("click", function () { st.k = b.getAttribute("data-stk"); root.querySelectorAll("[data-stk]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); go(seqFor(st.mode)); }); });
  var bb = root.querySelector("[data-stbrux]"); bb.addEventListener("click", function () { st.brux = !st.brux; bb.setAttribute("aria-pressed", String(st.brux)); text(); draw(); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && svg.contains(el)) info.textContent = el.getAttribute("data-info"); }
  svg.addEventListener("pointerover", hot); svg.addEventListener("click", hot);
  text(); draw();
}

const CSS = RIG_CSS("st") + `
.anima .st-box{max-width:600px;margin:0 auto}
.anima .st-svg .st-t{fill:var(--anatomy-text);font:11.5px var(--anatomy-mono);paint-order:stroke;stroke:var(--surface);stroke-width:3.5px;stroke-linejoin:round}
.anima .st-svg .st-head{fill:var(--anatomy-strong);font-weight:700}
.anima .st-svg .st-sub{fill:var(--anatomy-muted);font-size:10.5px}
.anima .st-svg .st-ok{fill:#2f8a5b}
.anima .st-svg .st-bad{fill:var(--tm-vessel);font-size:10.5px}
.anima .st-svg .st-lamp-ok{fill:#2f8a5b}
.anima .st-svg .st-lamp-bad{fill:var(--tm-vessel)}
.anima .st-svg .st-hit-ok{fill:#2f8a5b;stroke:var(--surface);stroke-width:1}
.anima .st-svg .st-hit-bad{fill:none;stroke:var(--tm-vessel);stroke-width:2.4}
.anima .st-svg .st-splint{fill:var(--accent);fill-opacity:.28;stroke:var(--accent);stroke-width:1.2;stroke-linejoin:round}
.anima .st-svg .st-load{fill:none;stroke:var(--tm-vessel);stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.anima .st-svg .st-seat{fill:none;stroke:var(--anatomy-lit);stroke-width:1.2;stroke-dasharray:3 3;vector-effect:none}
`;

export function stability() {
  return {
    id: "stability", lec: "malocclusion",
    title: "Orthopedic vs occlusal stability",
    caption: "Seat the joints and close: one tooth touches first. Bite into MIP: a condyle comes off its seat. A flat plane splint gives both. Then change how far MIP is from CR, or add a bruxer's loading.",
    html: `<div class="anima" data-anima="stability">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: stLive.toString(),
    helpers: RIG_HELPERS.concat([stTarget, stSplint, stSvg]),
    data: Object.assign({ SUM }, D),
  };
}
