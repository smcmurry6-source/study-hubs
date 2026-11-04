// Fig: the slide from centric occlusion into MIP (Occlusion L1, "MIP, centric occlusion and centric relation").
// Drawn on the side-view rig the L7 figures use (l7rig.mjs: the skull with its fossa and eminence, the condyle on its
// disc, the mandible and both arches, in mm with the seated condyle at the origin), mirrored so the patient faces right
// like the other L1 side views. Closing on the hinge with the condyle seated (CR: pure rotation about the transverse
// horizontal axis), the first teeth to touch are the CO contact; from there the jaw slides up and forward into MIP while
// the condyle comes slightly off its seat, forward and down along the eminence (it stays in the fossa). A toggle shows
// the 10% whose CO and MIP coincide.
// Every pose is solved here in Node with the rig's contact solver: in MIP the condyle sits d mm down the eminence, d
// chosen so the CO contact slides 1.25 mm into MIP (the notes' average, 1.25 +/- 1 mm); the slide is a table of condyle
// positions, each with the rotation at which the teeth just touch. One scale throughout (about 3.4 px per mm), so the
// slide is small: the x4 panels reuse the same markup in a zoomed viewBox. The first contact falls on the second molars,
// nearest the hinge, as in the hub's Patient Box case (asserted below).
import { figureSvg, plateHtml } from "./shared.mjs";
import { rig, rigSolve, RIG_HELPERS, RIG_CSS } from "./l7rig.mjs";

const W = 470, SLIDE = 1.25, OPEN = 5 * Math.PI / 180;
const R = rig(), T = rigSolve.teeth();
const r4 = (v) => Math.round(v * 10000) / 10000;
/* the rig faces left; mirror x so this figure faces right */
const mx = (p) => [r4(-p[0]), r4(p[1])];
const mxs = (pts) => pts.map(mx);

/* the lower posterior point that presses hardest into the upper teeth at pose P (rig coordinates, MIP frame) */
function cuspAt(P) {
  let m = -Infinity, q = null;
  for (const t of T.lo) if (t.g === "post") for (const p of t.pts) { const r = rigSolve.tf(p, P); if (r[0] > -67.2 && r[0] < -35.2) { const v = r[1] - rigSolve.upperAt(r[0]); if (v > m) { m = v; q = p; } } }
  return q;
}
/* close on the hinge with the condyle seated, MIP being d mm down the eminence: the CO rotation, the cusp that touches
   first, where it touches and how far it then slides into MIP */
function closeAt(d) {
  const Cm = [R.EMI[0] * d, R.EMI[1] * d], th = rigSolve.contactTh([0, 0], Cm, T), P = { C: [0, 0], Cm, th }, q = cuspAt(P), a = rigSolve.tf(q, P);
  return { d, Cm, th, q, a, mm: Math.hypot(q[0] - a[0], q[1] - a[1]) };
}
let lo = 0.05, hi = 1.5;
for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (closeAt(mid).mm < SLIDE) lo = mid; else hi = mid; }
const S0 = closeAt(hi);
/* the slide: the condyle moves from its seat to its MIP position; at each step the jaw rotates until the teeth just touch */
const TAB = [];
for (let k = 0; k <= 20; k++) {
  const w = k / 20, C = [S0.Cm[0] * w, S0.Cm[1] * w], th = k === 20 ? 0 : rigSolve.contactTh(C, S0.Cm, T), hit = rigSolve.tf(S0.q, { C, Cm: S0.Cm, th });
  TAB.push([...mx(C), r4(-th), ...mx(hit)]);
}
const lowerM2 = T.lo.find((t) => t.n === "M2"), m2x = lowerM2.pts.map((p) => p[0]);
if (!(S0.a[0] <= Math.max(...m2x) && S0.a[0] >= Math.min(...m2x))) throw new Error("crslide: the CO contact is no longer on the second molars");
const incCO = rigSolve.tf(T.inc, { C: [0, 0], Cm: S0.Cm, th: S0.th });

/* the disc, magnified in a x4 panel here, so it gets the notes' shape (biconcave: the thick posterior band over the top of
   the seated condyle, the thin intermediate zone against the slope of the eminence, the anterior band in front): it fills
   the joint space where that is narrow and is capped where the space is wide. Angles from posterior (+x), y up. */
const rgSamp = RIG_HELPERS.find((fn) => fn.name === "rgSamp"), SKS = rgSamp(R.SKULL, 5);
function rayToSkull(a) {
  const dx = Math.cos(a), dy = Math.sin(a); let best = Infinity;
  for (let i = 0; i < SKS.length; i++) {
    const [x1, y1] = SKS[i], [x2, y2] = SKS[(i + 1) % SKS.length], ex = x2 - x1, ey = y2 - y1, den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-9) continue;
    const t = (x1 * ey - y1 * ex) / den, u = (x1 * dy - y1 * dx) / den;
    if (t > 0 && u >= 0 && u <= 1 && t < best) best = t;
  }
  return best;
}
const DISC_T = [[58, 0.5], [74, 2.3], [90, 2.9], [108, 2.4], [130, 1.6], [150, 1.7], [160, 2.1], [170, 1.6], [178, 0.5]];
function discT(d) { for (let i = 1; i < DISC_T.length; i++) if (d <= DISC_T[i][0]) { const [a0, t0] = DISC_T[i - 1], [a1, t1] = DISC_T[i], u = (1 - Math.cos((d - a0) / (a1 - a0) * Math.PI)) / 2; return t0 + (t1 - t0) * u; } return DISC_T[DISC_T.length - 1][1]; }
const DISC = [];
for (let d = 58; d <= 178; d += 2) { const a = d * Math.PI / 180, r = Math.min(rayToSkull(a) - 0.12, R.CR + 0.08 + discT(d)); DISC.push([r * Math.cos(a), r * Math.sin(a)]); }
for (let d = 178; d >= 58; d -= 2) { const a = d * Math.PI / 180, r = R.CR + 0.08; DISC.push([r * Math.cos(a), r * Math.sin(a)]); }

/* the view: x = 0 (the seated condyle) at OX; the height fits the jaw hinged fully open */
const V = { OX: 72, OY: 70, S: 3.4 };
const jawOpen = R.JAW.map((p) => rigSolve.tf([p[0] + S0.Cm[0], p[1] + S0.Cm[1]], { C: [0, 0], Cm: S0.Cm, th: S0.th + OPEN }));
const H = Math.ceil(V.OY - Math.min(...jawOpen.map((p) => p[1])) * V.S + 8);

const D = {
  W, H, OPEN: r4(OPEN), V,
  SKULL: mxs(R.SKULL), JAW: mxs(R.JAW), DISC: mxs(DISC), CR: R.CR,
  /* the rest of the rig's skull (the cranium behind the jaw, its openings, the edges drawn over the face), mirrored; the
     view crops it at the top and the back, where it fades out (FOG, mm above / behind the seated condyle) */
  BACK: mxs(R.BACK), EDGES: R.EDGES.map(mxs), SHADE: mxs(R.SHADE), ORBIT: mxs(R.ORBIT), NASAL: mxs(R.NASAL), DEEP: mxs(R.DEEP),
  EAM: { c: mx(R.EAM.c), rx: R.EAM.rx, ry: R.EAM.ry }, IOF: mx(R.IOF), FOG: { top: [9.5, 20], back: [9, 21] },
  UP: R.UP.map((t) => ({ n: t.n, g: t.g, pts: mxs(t.pts) })), LO: R.LO.map((t) => ({ n: t.n, g: t.g, pts: mxs(t.pts) })),
  CUSP_LO: mxs(R.CUSP_LO), INC: mx(R.INC),
  SL: { Cm: mx(S0.Cm), co: r4(-S0.th), tab: TAB },
  /* numbers for the read-outs: the condyle's travel and the incisal gap at the CO contact, in mm */
  SEATMM: r4(S0.d), INCGAP: r4(Math.hypot(T.inc[0] - incCO[0], T.inc[1] - incCO[1])),
};
/* where the "lower M2" label sits in the x4 panel: in the jaw's frame, 2.2 mm below the lower second molar's highest cusp
   and centered on its occlusal table, so it rides with the tooth and never sits on its outline (LM2T, the cusp height, is
   for the open jaw, when the crown is too low in the panel: the label then goes just above it) */
{
  const m2 = D.LO.find((t) => t.n === "M2").pts, top = Math.max(...m2.map((p) => p[1])), occ = m2.filter((p) => p[1] > top - 1.5);
  const cx = r4(occ.reduce((a, p) => a + p[0], 0) / occ.length);
  D.LM2 = [cx, r4(top - 2.2)]; D.LM2T = [cx, r4(top)];
}
/* the two x4 panels: the second molars around the first contact, the condyle on its seat */
const hit0 = [D.V.OX + TAB[0][3] * D.V.S, D.V.OY - TAB[0][4] * D.V.S];
D.ZOOM = { m2: [r4(hit0[0] - 27), r4(hit0[1] - 23), 58, 44], cond: [D.V.OX - 25, D.V.OY - 26, 58, 44] };

/* the pose for slider position v (0 open .. 0.5 the CO contact .. 1 MIP); same = the 10% whose CO and MIP coincide */
function crPose(v, same, D) {
  var p = D.SL, Cm = same ? [0, 0] : p.Cm;
  if (v <= 0.5) {
    var co = same ? 0 : p.co, u = v / 0.5;
    return { C: [0, 0], Cm: Cm, th: co - (1 - u) * D.OPEN, w: 0, phase: v < 0.5 ? "hinge" : same ? "mip" : "co", hit: same ? null : [p.tab[0][3], p.tab[0][4]] };
  }
  if (same) return { C: [0, 0], Cm: Cm, th: 0, w: 1, phase: "mip", hit: null };
  var w = (v - 0.5) / 0.5, x = w * (p.tab.length - 1), i = Math.min(p.tab.length - 2, Math.floor(x)), f = x - i, a = p.tab[i], b = p.tab[i + 1];
  function l(k) { return a[k] + (b[k] - a[k]) * f; }
  return { C: [l(0), l(1)], Cm: Cm, th: l(2), w: w, phase: w >= 1 ? "mip" : "slide", hit: [l(3), l(4)] };
}

/* the whole drawing for a state; the live figure redraws it (and the x4 panels) on every change */
function crSvg(v, same, D) {
  var P = D.crPose(v, same, D), V = D.V, f = function (n) { return Math.round(n * 10) / 10; }, s = "";
  function X(p) { return V.OX + p[0] * V.S; } function Y(p) { return V.OY - p[1] * V.S; }
  function tx(x, y, t, cls, a) { return '<text class="' + (cls || "cr-t") + '" x="' + f(x) + '" y="' + f(y) + '"' + (a ? ' text-anchor="' + a + '"' : "") + ">" + t + "</text>"; }
  /* a label with its leader: the leader starts on the text (under its first or last letter, or at its middle; dx nudges it
     onto a letter) and ends on a dot at the point */
  function lab(t, x, y, p, a, cls, dx) { var e = [X(p), Y(p)], lx = (a === "end" ? x - 4 : a === "middle" ? x : x + 4) + (dx || 0), ly = y < e[1] ? y + 1 : y - 8.5; return '<g class="cr-lab' + (cls ? " " + cls : "") + '"><path class="cr-lead" d="M' + f(lx) + " " + f(ly) + "L" + f(e[0]) + " " + f(e[1]) + '"/><circle class="cr-ldot" cx="' + f(e[0]) + '" cy="' + f(e[1]) + '" r="1.8"/>' + tx(x, y, t, "cr-t", a) + "</g>"; }
  var pose = { C: P.C, Cm: P.Cm, th: P.th };
  function ell(e, cls) { return '<ellipse class="' + cls + '" cx="' + f(X(e.c)) + '" cy="' + f(Y(e.c)) + '" rx="' + f(e.rx * V.S) + '" ry="' + f(e.ry * V.S) + '"/>'; }
  /* the skull behind the mandible: the cranium, the orbit and nasal opening, the ear canal and the deep space */
  s += '<path class="rg-bone" d="' + D.rgD(D.rgSamp(D.BACK, 4), V, true) + '"/><path class="rg-void" d="' + D.rgD(D.rgSamp(D.ORBIT, 4), V, true) + '"/><path class="rg-void rg-nose" d="' + D.rgD(D.rgSamp(D.NASAL, 3), V, true) + '"/>' + ell(D.EAM, "rg-void") + '<path class="rg-deep" d="' + D.rgD(D.rgSamp(D.DEEP, 3), V, true) + '"/>';
  /* lower teeth, then the mandible over their roots */
  D.LO.forEach(function (t) { s += '<path class="rg-tooth' + (t.n === "M2" ? " hot" : "") + '"' + (t.n === "M2" ? ' data-info="The lower second molar. Nearest the hinge, so when the jaw closes in CR it meets the upper second molar first."' : "") + ' d="' + D.rgD(D.rgSamp(t.pts, 6).map(function (p) { return D.rgT(p, pose); }), V, true) + '"/>'; });
  var jaw = D.rgSamp(D.JAW, 5).map(function (p) { return D.rgT([p[0] + pose.Cm[0], p[1] + pose.Cm[1]], pose); });
  s += '<path class="rg-jaw hot" data-info="The mandible. Closing in CR it only rotates about the seated condyles (the transverse horizontal axis); in the slide it moves up and forward as the condyles come slightly off their seats." d="' + D.rgD(jaw, V, true) + '"/>';
  /* upper teeth, then the skull over their roots */
  D.UP.forEach(function (t) { s += '<path class="rg-tooth' + (t.n === "M2" ? " hot" : "") + '"' + (t.n === "M2" ? ' data-info="The upper second molar. The lower second molar touches its mesial incline first, then slides up it into MIP."' : "") + ' d="' + D.rgD(D.rgSamp(t.pts, 6), V, true) + '"/>'; });
  s += '<g class="hot" data-info="The skull: the glenoid fossa and the articular eminence of the temporal bone, the zygomatic arch (the coronoid process passes under it) and the maxilla. In centric relation the condyle sits up and forward against the eminence\'s posterior slope, with the disc between."><path class="rg-bone-f" d="' + D.rgD(D.rgSamp(D.SKULL, 5), V, true) + '"/><path class="rg-shade" d="' + D.rgD(D.rgSamp(D.SHADE, 4), V, true) + '"/>' +
    D.EDGES.map(function (e) { return '<path class="rg-edge" d="' + D.rgD(D.rgSamp(e, 4, true), V) + '"/>'; }).join("") + ell({ c: D.IOF, rx: 1, ry: 0.8 }, "rg-void") + '</g>';
  /* the disc and condyle, then the seat (CR), dashed on top, once the condyle has left it */
  var c = P.C, off = Math.hypot(c[0], c[1]) > 0.005;
  s += '<g class="hot" data-info="The condyle on its disc. In centric relation it is seated: anterior-superior against the slope of the eminence, on the thin middle of the disc (the thick posterior band sits over the top of the condyle). The dashed circle marks that seat once the condyle leaves it."><path class="rg-disc" d="' + D.rgD(D.DISC.map(function (p) { return [p[0] + c[0], p[1] + c[1]]; }), V, true) + '"/><path class="rg-condyle" d="' + D.rgD(D.rgCirc(c, D.CR, 48), V, true) + '"/></g>';
  if (off) s += '<path class="cr-seat" d="' + D.rgD(D.rgCirc([0, 0], D.CR, 48), V, true) + '"/>';
  /* contacts: the first one (CO) and the slide, or every centric cusp in MIP */
  if (P.phase === "co" || P.phase === "slide") {
    var h = [X(P.hit), Y(P.hit)];
    s += '<circle class="cr-halo" cx="' + f(h[0]) + '" cy="' + f(h[1]) + '" r="6"/><circle class="cr-hit hot" data-info="The CO contact: the first tooth contact with the condyles seated. Only the second molars touch; every other tooth is still apart." cx="' + f(h[0]) + '" cy="' + f(h[1]) + '" r="2.4"/>';
  } else if (P.phase === "mip") D.CUSP_LO.forEach(function (q) { var r = D.rgT(q, pose); s += '<circle class="cr-ok" cx="' + f(X(r)) + '" cy="' + f(Y(r)) + '" r="2.2"/>'; });
  /* the view crops the skull at the top and the back: fade it out there (bands of the page color, opaque at the edge) */
  s += D.rgFog(V, D.W, D.H, "top", D.FOG.top[0], D.FOG.top[1], 24);
  for (var k = 0, nb = 24, fb = D.FOG.back; k <= nb; k++) { var m0 = fb[0] + (fb[1] - fb[0]) * k / nb, m1 = k === nb ? 1e4 : fb[0] + (fb[1] - fb[0]) * (k + 1) / nb, x1 = f(V.OX - m0 * V.S), x0 = f(Math.max(-2, V.OX - m1 * V.S));
    if (x1 > 0) s += '<rect class="rg-fog" x="' + x0 + '" y="-2" width="' + f(x1 - x0) + '" height="' + (D.H + 4) + '" style="fill-opacity:' + (k === nb ? 1 : Math.round(1000 * (k + 0.5) / nb) / 1000) + '"/>'; }
  /* labels on the main view (hidden in the x4 panels): above the skull, and on the body of the mandible */
  s += lab("condyle on its disc", 124, 30, [c[0], c[1] + D.CR + 1.4], "start");
  s += tx(D.W - 8, 12, "patient facing right →", "cr-t cr-mut", "end");
  if (P.phase === "co" || P.phase === "slide") s += lab(P.phase === "co" ? "first contact (CO)" : "sliding into MIP", 182, 268, P.hit, "middle", "", P.phase === "co" ? 0 : 4);
  if (P.phase === "co") s += lab("front teeth apart", 364, 268, D.rgT(D.INC, pose), "middle");
  if (P.phase === "mip") s += lab(same ? "CO = MIP: every cusp at once" : "MIP: the cusps meet evenly", 250, 268, D.rgT(D.CUSP_LO[3], pose), "middle");
  /* labels for the x4 panels (hidden in the main view) */
  var lq = D.rgT(D.LM2, pose), lqy = Y(lq);
  if (lqy > D.ZOOM.m2[1] + D.ZOOM.m2[3] - 1.2) lqy = Y(D.rgT(D.LM2T, pose)) - 1.6;
  s += tx(X([39.6, -38]), Y([39.6, -38]), "upper M2", "cr-zt", "middle") + tx(X(lq), lqy, "lower M2", "cr-zt", "middle");
  s += tx(X([c[0] - 1.8, c[1] - 6.6]), Y([c[0] - 1.8, c[1] - 6.6]), "condyle", "cr-zt", "middle") + tx(X([6.3, 3.9]), Y([6.3, 3.9]), "eminence", "cr-zt", "middle") + tx(X([c[0] - 0.6, c[1] + 4.9]), Y([c[0] - 0.6, c[1] + 4.9]), "disc", "cr-zt cr-zd", "middle");
  /* on two lines, so it fits between the seat and the panel's edge */
  if (off) s += tx(X([-4.6, 1.4]), Y([-4.6, 1.4]), "CR", "cr-zt cr-zs", "end") + tx(X([-4.6, 0.45]), Y([-4.6, 0.45]), "seat", "cr-zt cr-zs", "end");
  if (P.phase === "co" || P.phase === "slide") s += tx(X(P.hit) - 3, Y(P.hit) + 6, P.phase === "co" ? "first contact" : "sliding", "cr-zt cr-zc", "end");
  return s;
}

const DN = Object.assign({ crPose }, D, Object.fromEntries(RIG_HELPERS.map((fn) => [fn.name, fn])));
const svg = figureSvg({ width: W, height: H, className: "cr-svg", label: "Side view, patient facing right: the skull with the fossa and eminence, the condyle on its disc, the mandible and both dental arches, closing in centric relation to the first contact and sliding into MIP.", body: crSvg(0, false, DN) });
const zoom = (k, cap, label) => `<figure class="cr-zfig"><div class="am-svg"><svg xmlns="http://www.w3.org/2000/svg" class="iso-svg cr-svg cr-zoom" data-crz="${k}" viewBox="${D.ZOOM[k].join(" ")}" role="img" aria-label="${label}">${crSvg(0, false, DN)}</svg></div><figcaption>${cap}</figcaption></figure>`;
const plate = plateHtml({ fig: "Fig 7", title: "CR to MIP", hint: "close, then slide", readout: "closing in CR", body: `<div class="am-svg cr-box">${svg}</div><div class="cr-zooms">${zoom("m2", "Second molars ×4", "The second molars magnified four times")}${zoom("cond", "Condyle and its CR seat ×4", "The condyle and its seat magnified four times")}</div>` });
const controls = `<div class="am-controls"><label class="am-slider"><span>open</span><input type="range" min="0" max="100" step="1" value="0" aria-label="Close on the hinge to the first contact, then slide into MIP"><span>MIP</span></label><button type="button" class="am-btn" data-crplay aria-pressed="false">Close</button></div>
<div class="am-controls" role="group" aria-label="Which patient"><button type="button" class="am-btn" data-crsame="0" aria-pressed="true">A slide (about 90%)</button><button type="button" class="am-btn" data-crsame="1" aria-pressed="false">CO = MIP (about 10%)</button></div>
<div class="am-stats" aria-live="polite"><span><b>Teeth</b> <em data-r="teeth">apart</em></span><span><b>Condyle</b> <em data-r="cond">seated (CR)</em></span></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Tap or hover the condyle, the skull, the mandible or a second molar.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From the L1 notes: CR is the joint seated (anterior-superior, against the eminence, on the thinnest part of the disc, independent of the teeth) and allows pure rotation about the transverse horizontal axis; CO is the tooth contact with the mandible in CR (on Dr. Givan's exams, CO never means MIP); MIP is the full intercuspation, independent of condylar position. About 90% have a slide from the CO contact into MIP, averaging 1.25 ± 1 mm; about 10% have CO and MIP coincident.</li>
<li>Drawn to one scale, about 3.4 px per mm: the first contact slides 1.25 mm up and forward into MIP and the condyle comes about ${Math.round(S0.d * 10) / 10} mm off its seat, forward and down along the eminence, still in its fossa. That is too small to see at full size, so the ×4 panels magnify the second molars and the joint. The front teeth move farther than the molars (about ${Math.round(D.INCGAP * 10) / 10} mm), because the jaw also rotates a little as it slides.</li>
<li>The first contact is wherever the drawn teeth meet first when the jaw hinges closed (here the second molars, nearest the hinge, like the Patient Box case); in a real mouth it can be any tooth, and the slide can also deviate left or right. The skull, jaw and joint are the same schematic side view as the L7 figures, with cusps drawn as a regular zigzag.</li></ul></details>`;

function crLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var svg = root.querySelector(".cr-svg:not(.cr-zoom)"), zooms = Array.prototype.slice.call(root.querySelectorAll(".cr-zoom")), slider = root.querySelector('input[type="range"]'), play = root.querySelector("[data-crplay]");
  var sum = root.querySelector(".am-summary"), infoEl = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]");
  var rs = {}; Array.prototype.forEach.call(root.querySelectorAll("[data-r]"), function (e) { rs[e.getAttribute("data-r")] = e; });
  var v = 0, same = false, frame = 0, t0 = 0, playing = false, from = 0;
  function mm(n) { return (Math.round(n * 100) / 100).toFixed(2); }
  function draw() {
    var inner = D.crSvg(v, same, D); svg.innerHTML = inner; zooms.forEach(function (z) { z.innerHTML = inner; });
    var P = D.crPose(v, same, D), ph = P.phase, slid = same ? 0 : 1.25 * P.w;
    rs.teeth.textContent = same
      ? (ph === "hinge" ? "apart" : "every posterior tooth at once: CO = MIP")
      : { hinge: "apart", co: "first contact (CO): the second molars only; the front teeth about " + mm(D.INCGAP) + " mm apart", slide: "sliding up and forward along the inclines: " + mm(slid) + " of 1.25 mm", mip: "fully intercuspated (MIP), after a 1.25 mm slide" }[ph];
    rs.cond.textContent = same || P.w < 0.01 ? "seated (CR)" : P.w >= 1 ? "about " + mm(D.SEATMM) + " mm off its seat, forward and down (still in the fossa)" : "coming slightly off its seat, forward and down";
    if (readout) readout.textContent = same ? (ph === "hinge" ? "closing in CR" : "CO = MIP") : { hinge: "closing in CR", co: "CO", slide: "sliding", mip: "MIP" }[ph];
    var t = same
      ? (ph === "hinge" ? "This patient's CO and MIP coincide (about 10% of people). Close on the hinge with the condyles seated…" : "…and the first contact IS maximum intercuspation: every posterior tooth meets at once with the condyles still seated. No slide. This is also where we deliberately rebuild patients who need full reconstruction.")
      : ({ hinge: "The condyles are seated in centric relation, so the jaw can only rotate about the transverse horizontal axis: a hinge closure.",
           co: "First contact with the joints seated: centric occlusion. Only the second molars touch (see the ×4 panel); the front teeth are still apart. On Dr. Givan's exams, CO always means this contact, never MIP.",
           slide: "From the CO contact the jaw slides up and forward along the inclines into MIP, and the condyle comes slightly off its seat, forward and down the eminence.",
           mip: "MIP: full intercuspation, set by the teeth and the muscles, not by the joint. About 90% of people have this slide, averaging 1.25 ± 1 mm (a slide that deviates left or right tends to be more problematic). Closing into the unstable CO contact without the muscles' protection, especially asleep, gives wear facets, fractures and mobility." })[ph];
    if (sum.textContent !== t) sum.textContent = t;
  }
  function stop() { playing = false; cancelAnimationFrame(frame); play.setAttribute("aria-pressed", "false"); }
  function tick(now) {
    if (!t0) t0 = now; var e = (now - t0) / 1000, w;
    /* close in 1.2 s, rest on the CO contact 0.8 s, slide in 1 s */
    w = e < 1.2 ? 0.5 * e / 1.2 : e < 2 ? 0.5 : Math.min(1, 0.5 + 0.5 * (e - 2) / 1);
    v = Math.max(from, w); slider.value = Math.round(v * 100); draw();
    if (v < 1) frame = requestAnimationFrame(tick); else stop();
  }
  play.addEventListener("click", function () {
    if (playing) { stop(); return; }
    if (v >= 1) { v = 0; }
    if (reduce.matches) { v = 1; slider.value = 100; draw(); return; }
    from = v; playing = true; t0 = 0; play.setAttribute("aria-pressed", "true"); frame = requestAnimationFrame(tick);
  });
  slider.addEventListener("input", function () { stop(); v = +slider.value / 100; draw(); });
  root.querySelectorAll("[data-crsame]").forEach(function (b) { b.addEventListener("click", function () {
    stop(); same = b.getAttribute("data-crsame") === "1"; v = 0; slider.value = 0;
    root.querySelectorAll("[data-crsame]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); draw(); }); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && svg.contains(el)) infoEl.textContent = el.getAttribute("data-info"); }
  svg.addEventListener("pointerover", hot); svg.addEventListener("click", hot);
  draw();
}

const CSS = RIG_CSS("cr") + `
.anima .cr-box{max-width:620px;margin:0 auto}
.anima .cr-svg .cr-t{fill:var(--anatomy-text);font:14px var(--anatomy-mono);paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round}
.anima .cr-svg .cr-t.cr-mut{fill:var(--anatomy-muted)}
.anima .cr-svg .cr-lead{fill:none;stroke:var(--anatomy-mid);stroke-width:.8}
.anima .cr-svg .cr-ldot{fill:var(--anatomy-dot)}
.anima .cr-svg .cr-seat{fill:none;stroke:var(--anatomy-lit);stroke-width:1.3;stroke-dasharray:3 3;vector-effect:none}
.anima .cr-svg .cr-hit{fill:var(--tm-vessel)}
.anima .cr-svg .cr-halo{fill:var(--tm-vessel);opacity:.28}
.anima .cr-svg .cr-ok{fill:#2f8a5b;stroke:var(--surface);stroke-width:.8}
.anima .cr-svg .cr-zt{display:none}
.anima .cr-zooms{display:grid;grid-template-columns:1fr 1fr;gap:8px 12px;max-width:620px;margin:10px auto 0}
.anima .cr-zfig{margin:0}
.anima .cr-zfig .am-svg{border:1px solid var(--line);border-radius:8px;overflow:hidden;background:var(--surface)}
.anima .cr-zfig figcaption{font:.74rem var(--font-mono);color:var(--ink-soft);margin-top:4px;text-align:center}
.anima .cr-zoom .cr-t,.anima .cr-zoom .cr-lab{display:none}
.anima .cr-zoom .cr-zt{display:inline;fill:var(--anatomy-muted);font:2.8px var(--anatomy-mono);paint-order:stroke;stroke:var(--surface);stroke-width:.6px;stroke-linejoin:round}
.anima .cr-zoom .cr-zs{fill:var(--anatomy-lit)}
.anima .cr-zoom .cr-zc{fill:var(--tm-vessel)}
.anima .cr-zoom .cr-zd{fill:var(--anatomy-strong);stroke:none}
.anima .cr-zoom .cr-seat{stroke-width:.36;stroke-dasharray:.9 .7}
.anima .cr-zoom .cr-hit{r:1px}
.anima .cr-zoom .cr-halo{r:2.4px}
.anima .cr-zoom .cr-ok{r:.9px;stroke-width:.3}
`;

export function crslide() {
  return {
    id: "crslide", lec: "review",
    title: "From CR to the CO contact, then the slide into MIP",
    caption: "Close the jaw on its hinge with the condyles seated in centric relation until the first teeth touch (centric occlusion), then watch it slide up and forward into MIP as the condyle comes slightly off its seat; switch to the 10% whose CO and MIP coincide.",
    html: `<div class="anima" data-anima="crslide">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: crLive.toString(),
    helpers: RIG_HELPERS.concat([crPose, crSvg]),
    data: D,
  };
}
