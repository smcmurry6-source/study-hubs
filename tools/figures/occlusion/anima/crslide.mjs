// Fig: the slide from centric occlusion into MIP (Occlusion L1, "MIP, centric occlusion and centric relation").
// A side view, patient facing right: the condyle in its fossa against the eminence, the upper teeth fixed, the mandible
// with its teeth. Closing on the hinge with the condyles seated (CR, pure rotation about the transverse horizontal axis),
// the first teeth to touch are the CO contact; from there the jaw slides up and forward into MIP while the condyle comes
// off its seat, forward and down the eminence. A toggle shows the 10% whose CO and MIP coincide (no slide).
// One model (crPose): the lower teeth are drawn in MIP; any other pose is the condyle at C plus a rotation about it, and
// the rotation is solved so the teeth just touch (crContactRot, bisection on the smallest gap between the two crown
// surfaces). The first contact therefore falls wherever the geometry puts it, here on the second molars, nearest the
// hinge, as in the hub's Patient Box case. The notes give the slide as about 1.25 ± 1 mm in about 90% of people; it is
// drawn to the figure's own scale (about 6 px per mm). Cusp shapes, the eminence angle and the hinge positions are schematic.
import { figureSvg, plateHtml } from "./shared.mjs";

const W = 470, H = 290;
const D = {
  W, H, k: 6, X: 1, slideMm: 1.25, P: 20, xb: 206, xe: 330, yk: 176, xk: 340, po: 8, inc: 25, cg: 35, condFrac: 0.7,
  C: [64, 98], r: 12, Tx: 362, vo: 3, ho: 2.5,
  teeth: [[206, 250, "M2"], [250, 290, "M1"], [290, 310, "PM2"], [310, 330, "PM1"]],
};

/* the occlusal interface in MIP: the plane, a zigzag of cusp tips and fossae */
function crCurve(x, D) { return D.yk + Math.tan(D.po * Math.PI / 180) * (x - D.xk); }
function crZig(x, D) {
  var hp = D.P / 2, h = hp * Math.tan(D.inc * Math.PI / 180), k = Math.round((x - D.xb) / hp), lowerTip = k % 2 !== 0;
  return crCurve(x, D) + (lowerTip ? -h : h);
}
/* surfaces sampled per column: upper (fixed) and lower (in MIP, before any move) */
function crSurf(D) {
  var hp = D.P / 2, xs = [];
  for (var x = D.xb - hp; x <= D.xe + 0.1; x += hp) xs.push([x, crZig(x, D)]);
  return xs;
}
function crInterp(pts, x) { for (var i = 1; i < pts.length; i++) if (pts[i][0] >= x) { var a = pts[i - 1], b = pts[i], t = (x - a[0]) / ((b[0] - a[0]) || 1); return a[1] + (b[1] - a[1]) * t; } return null; }
/* the move from MIP: the condyle placed off (px) from its CR seat and the jaw rotated rho (degrees, + = opening) about it */
function crMove(p, off, rho, D) {
  var a = rho * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), Cm = [D.C[0] + D.mipOff[0], D.C[1] + D.mipOff[1]];
  var x = p[0] - Cm[0], y = p[1] - Cm[1];
  return [D.C[0] + off[0] + x * c - y * s, D.C[1] + off[1] + x * s + y * c];
}
/* smallest vertical gap between the moved lower surface and the upper surface, and where it is */
function crGap(off, rho, D) {
  /* the upper teeth run from xb - P/2 to xe - P/2, the lower ones from xb to xe */
  var zz = crSurf(D), up = zz.filter(function (p) { return p[0] <= D.xe - D.P / 2 + 0.1; }), lo = zz.filter(function (p) { return p[0] >= D.xb - 0.1; }).map(function (p) { return crMove(p, off, rho, D); }), best = Infinity, at = null;
  for (var x = D.xb - D.P / 2; x <= D.xe; x += 1) { var u = crInterp(up, x), l = crInterp(lo, x); if (u == null || l == null) continue; if (l - u < best) { best = l - u; at = [x, u]; } }
  return { g: best, at: at };
}
/* the rotation at which the teeth just touch, for a condyle offset */
function crContactRot(off, D) {
  var lo = -4, hi = 12;
  for (var i = 0; i < 40; i++) { var m = (lo + hi) / 2; if (crGap(off, m, D).g < 0) lo = m; else hi = m; }
  return hi;
}
/* pose for slider position v (0 open .. 0.5 CO .. 1 MIP); same = CO and MIP coincide */
function crPose(v, same, D) {
  var em = D.cg * Math.PI / 180, dir = [Math.cos(em), Math.sin(em)], s = same ? 0 : D.slideMm * D.k * D.X * D.condFrac;
  if (v <= 0.5) { var rco = same ? 0 : D.rco, u = v / 0.5; return { off: [0, 0], rho: rco + (1 - u) * 10, u: 0, phase: v < 0.5 ? "hinge" : "co" }; }
  var w = (v - 0.5) / 0.5, off = [dir[0] * s * w, dir[1] * s * w];
  return { off: off, rho: same ? 0 : (w >= 1 ? 0 : crContactRot(off, D)), u: w, phase: w >= 1 ? "mip" : "slide" };
}

function crSvg(v, same, D) {
  var P = crPose(v, same, D), f = function (n) { return Math.round(n * 10) / 10; }, CH = 24, hp = D.P / 2;
  /* the pose's condyle offset is from the CR seat; the lower teeth are defined in MIP, which sits mipOff from it */
  var off = P.off;
  function mv(p) { return same ? crMoveSame(p) : crMove(p, off, P.rho, D); }
  function crMoveSame(p) { var a = P.rho * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), x = p[0] - D.C[0], y = p[1] - D.C[1]; return [D.C[0] + x * c - y * s, D.C[1] + x * s + y * c]; }
  function L(pts, close) { return pts.map(function (p, i) { return (i ? "L" : "M") + f(p[0]) + " " + f(p[1]); }).join("") + (close ? "Z" : ""); }
  function S(pts) { var n = pts.length, d = "M" + f(pts[0][0]) + " " + f(pts[0][1]);
    for (var i = 0; i < n; i++) { var p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      d += "C" + f(p1[0] + (p2[0] - p0[0]) / 6) + " " + f(p1[1] + (p2[1] - p0[1]) / 6) + " " + f(p2[0] - (p3[0] - p1[0]) / 6) + " " + f(p2[1] - (p3[1] - p1[1]) / 6) + " " + f(p2[0]) + " " + f(p2[1]); }
    return d + "Z"; }
  function tx(x, y, t, cls, a) { return '<text class="cr-t' + (cls ? " " + cls : "") + '" x="' + f(x) + '" y="' + f(y) + '"' + (a ? ' text-anchor="' + a + '"' : "") + ">" + t + "</text>"; }
  var cy = function (x) { return crCurve(x, D); }, zz = crSurf(D), s = "";
  function crown(t, up) { var pts = zz.filter(function (p) { return p[0] >= t[0] - 0.1 && p[0] <= t[1] + 0.1; }), d = up ? -CH : CH, w = t[1] - t[0];
    return pts.concat([[t[1] - 1, cy(t[1]) + d * .55], [t[1] - w * .12, cy(t[1]) + d], [t[0] + w * .12, cy(t[0]) + d], [t[0] + 1, cy(t[0]) + d * .55]]); }
  /* temporal bone: fossa over the seated condyle and the eminence */
  var C = D.C, r = D.r, em = D.cg * Math.PI / 180, dir = [Math.cos(em), Math.sin(em)], nrm = [Math.sin(em), -Math.cos(em)], tb = [];
  var aEnd = Math.atan2(nrm[1], nrm[0]) + 2 * Math.PI;
  for (var a = Math.PI * 0.95; a <= aEnd + 0.001; a += (aEnd - Math.PI * 0.95) / 8) tb.push([C[0] + (r + 1.5) * Math.cos(a), C[1] + (r + 1.5) * Math.sin(a)]);
  var t0 = [C[0] + (r + 1.5) * nrm[0], C[1] + (r + 1.5) * nrm[1]], e1 = [t0[0] + 50 * dir[0], t0[1] + 50 * dir[1]];
  tb.push(e1, [e1[0] + 9, e1[1] + 3], [e1[0] + 18, e1[1] - 3], [e1[0] + 26, e1[1] - 14], [e1[0] + 36, 46], [60, 40], [14, 46], [10, C[1] - 6], [C[0] - r - 12, C[1] + 8]);
  s += '<path class="cr-bone hot" data-info="The fossa and the articular eminence. In centric relation the condyle is seated: anterior-superior, against the slope of the eminence, on the thinnest part of its disc (the disc is left out here)." d="' + L(tb, true) + '"/>';
  /* the seat: where CR puts the condyle */
  s += '<circle class="cr-seat" cx="' + C[0] + '" cy="' + C[1] + '" r="' + r + '"/>';
  /* maxilla and the upper teeth */
  var T = [D.Tx, cy(D.Tx) - 4], E = [T[0] + D.ho * D.k, T[1] + D.vo * D.k], mx = [];
  for (var q = 186; q <= 340; q += 14) mx.push([q, cy(q) - CH + 2]);
  mx.push([E[0] - 10, E[1] - 50], [E[0] - 2, E[1] - 74]);
  for (q = 340; q >= 186; q -= 14) mx.push([q, cy(q) - CH - 30]);
  s += '<path class="cr-bone" d="' + L(mx, true) + '"/>';
  D.teeth.forEach(function (t) { s += '<path class="cr-tooth" d="' + L(crown([t[0] - hp, t[1] - hp], true), true) + '"/>'; });
  s += '<path class="cr-tooth cr-ant" d="' + L([[E[0] + 1.5, E[1] - 1], [E[0] + 3, E[1] - 26], [E[0] - 6, E[1] - 54], [T[0] - 16, E[1] - 50], [T[0] - 13, T[1] - 12], [T[0] - 4, T[1] - 3], [E[0] - 2, E[1] + .5]], true) + '"/>';
  /* the mandible, in MIP coordinates, moved */
  var Cm = same ? C : [C[0] + D.mipOff[0], C[1] + D.mipOff[1]], g = [];
  var md = [[Cm[0] - 8, Cm[1] + 6], [52, 146], [54, 218], [70, 244], [130, 256], [260, 262], [T[0] - 10, T[1] + 82], [T[0] + 10, T[1] + 66], [T[0] + 3, T[1] + 40],
    [T[0] - 18, T[1] + 36], [344, cy(344) + CH - 2]];
  for (q = D.xe; q >= D.xb; q -= 20) md.push([q, cy(q) + CH - 2]);
  md.push([190, cy(190) + 14], [168, 136], [152, 112], [138, 120], [112, 128], [Cm[0] + 9, Cm[1] + 8]);
  s += '<path class="cr-bone cr-mand" d="' + S(md.map(mv)) + '"/>';
  var cc = mv(Cm);
  s += '<circle class="cr-bone cr-cond hot" data-info="The condyle. Seated in CR while the jaw hinges closed; as the teeth slide into MIP it comes off its seat, forward and down the eminence." cx="' + f(cc[0]) + '" cy="' + f(cc[1]) + '" r="' + r + '"/>';
  D.teeth.forEach(function (t) { s += '<path class="cr-tooth hot" data-info="Lower ' + t[2] + '." d="' + L(crown(t, false).map(mv), true) + '"/>'; });
  var lm2 = mv([228, cy(228) + CH + 14]), lm1 = mv([270, cy(270) + CH + 14]), lpm = mv([310, cy(310) + CH + 14]);
  s += tx(lm2[0], lm2[1], "M2", "cr-mut cr-sm", "middle") + tx(lm1[0], lm1[1], "M1", "cr-mut cr-sm", "middle") + tx(lpm[0], lpm[1], "PMs", "cr-mut cr-sm", "middle");
  s += '<path class="cr-tooth cr-ant" d="' + L([[T[0], T[1]], [T[0] + 2.5, T[1] + 20], [T[0] - 1, T[1] + 42], [T[0] - 15, T[1] + 40], [T[0] - 12, T[1] + 12], [T[0] - 3, T[1] + 1]].map(mv), true) + '"/>';
  /* contacts: the first one in CO, all of them in MIP */
  if (P.phase !== "hinge") {
    if (P.phase === "mip" || same) { for (var c = D.xb + hp; c < D.xe; c += D.P) { var pt = [c, crZig(c, D)]; s += '<circle class="cr-contact" cx="' + f(pt[0]) + '" cy="' + f(pt[1]) + '" r="3"/>'; } }
    else { var G = crGap(off, P.rho, D); if (G.at) s += '<circle class="cr-contact-halo" cx="' + f(G.at[0]) + '" cy="' + f(G.at[1]) + '" r="9"/><circle class="cr-contact" cx="' + f(G.at[0]) + '" cy="' + f(G.at[1]) + '" r="3.5"/>'; }
  }
  /* the condyle's travel */
  if (!same && P.u > 0) { s += '<path class="cr-path" d="M' + f(C[0]) + " " + f(C[1]) + "L" + f(cc[0]) + " " + f(cc[1]) + '"/>'; }
  s += tx(C[0], C[1] + 36, "condyle", "cr-mut", "middle") + tx(8, D.H - 8, "patient facing right →", "cr-mut cr-sm");
  return s;
}

/* MIP sits a full slide forward and down the eminence from CR; the CO rotation is solved once at build time */
{
  const em = D.cg * Math.PI / 180, s = D.slideMm * D.k * D.X * D.condFrac;
  D.mipOff = [Math.cos(em) * s, Math.sin(em) * s].map((v) => Math.round(v * 100) / 100);
  D.rco = Math.round(crContactRot([0, 0], D) * 1000) / 1000;
  const g = crGap([0, 0], D.rco, D);
  if (!(g.at && g.at[0] < D.teeth[0][1])) throw new Error("crslide: the CO contact is no longer on the second molars");
}

const svg = figureSvg({ width: W, height: H, className: "cr-svg", label: "Side view, patient facing right: the condyle in its fossa, the upper teeth and the mandible with its teeth, closing from centric relation into the first contact and sliding into MIP.", body: crSvg(0, false, D) });
/* two ×4 views of the same drawing: the second molars' contact and the condyle on its seat */
const zoom = (cls, vb, cap, label) => `<figure class="cr-zfig"><div class="am-svg"><svg xmlns="http://www.w3.org/2000/svg" class="iso-svg cr-svg cr-zoom ${cls}" viewBox="${vb}" role="img" aria-label="${label}">${crSvg(0, false, D)}</svg></div><figcaption>${cap}</figcaption></figure>`;
const ZM = [D.xb + 4 - 30, crCurve(D.xb, D) - 24, 60, 46], ZC = [D.C[0] - 22, D.C[1] - 20, 50, 38];
D.zoom = { m2: ZM, cond: ZC };
const plate = plateHtml({ fig: "Fig 7", title: "CR to MIP", hint: "close, then slide", readout: "open", body: `<div class="am-svg cr-box">${svg}</div><div class="cr-zooms">${zoom("cr-zm2", ZM.join(" "), "Second molars ×4", "The second molars magnified four times")}${zoom("cr-zcond", ZC.join(" "), "Condyle and its CR seat ×4", "The condyle and its seat magnified four times")}</div>` });
const controls = `<div class="am-controls"><label class="am-slider"><span>open</span><input type="range" min="0" max="100" step="1" value="0" aria-label="Close on the hinge to the first contact, then slide into MIP"><span>MIP</span></label><button type="button" class="am-btn" data-crplay aria-pressed="false">Close</button></div>
<div class="am-controls" role="group" aria-label="Which patient"><button type="button" class="am-btn" data-crsame="0" aria-pressed="true">A slide (about 90%)</button><button type="button" class="am-btn" data-crsame="1" aria-pressed="false">CO = MIP (about 10%)</button></div>
<div class="am-stats" aria-live="polite"><span><b>Teeth</b> <em data-r="teeth">apart</em></span><span><b>Condyle</b> <em data-r="cond">seated (CR)</em></span></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Tap or hover the condyle, the eminence or a tooth.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From the L1 notes: CR is the joint seated (anterior-superior, against the eminence, independent of the teeth) and allows pure rotation about the transverse horizontal axis; CO is the tooth contact with the mandible in CR (on Dr. Givan's exams, CO never means MIP); MIP is the full intercuspation, independent of condylar position. About 90% have a slide from the CO contact into MIP, about 1.25 ± 1 mm; about 10% have CO and MIP coincident.</li>
<li>The slide and the condyle's travel are drawn one and a half times larger than 1.25 mm (any larger and the cusps would land tip on tip) so they can be seen. The first contact is wherever the model's teeth meet first when the jaw hinges closed (here the second molars, nearest the hinge, like the Patient Box case); in a real mouth it can be any tooth.</li>
<li>Cusp shapes, the eminence angle and the jaw outline are schematic; the disc is left out.</li></ul></details>`;

function crLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var svg = root.querySelector(".cr-svg:not(.cr-zoom)"), zooms = Array.prototype.slice.call(root.querySelectorAll(".cr-zoom")), slider = root.querySelector('input[type="range"]'), play = root.querySelector("[data-crplay]");
  var sum = root.querySelector(".am-summary"), infoEl = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]");
  var rs = {}; Array.prototype.forEach.call(root.querySelectorAll("[data-r]"), function (e) { rs[e.getAttribute("data-r")] = e; });
  var v = 0, same = false, frame = 0, t0 = 0, playing = false, from = 0;
  function draw() {
    var inner = D.crSvg(v, same, D); svg.innerHTML = inner; zooms.forEach(function (z) { z.innerHTML = inner; });
    var P = D.crPose(v, same, D), mm = same ? 0 : D.slideMm * P.u;
    var ph = same ? (v < 0.5 ? "hinge" : "mip") : P.phase;
    rs.teeth.textContent = { hinge: "apart", co: "first contact (CO), on the second molars only", slide: "sliding up the inclines (" + mm.toFixed(2) + " of about 1.25 mm)", mip: same ? "fully intercuspated: CO = MIP" : "fully intercuspated (MIP), after about 1.25 mm" }[ph];
    rs.cond.textContent = mm < 0.02 ? "seated (CR)" : mm > 1.24 ? "off its seat, forward and down" : "coming off its seat";
    if (readout) readout.textContent = { hinge: "closing in CR", co: "CO", slide: "sliding", mip: same ? "CO = MIP" : "MIP" }[ph];
    var t = same
      ? (ph === "hinge" ? "This patient's CO and MIP coincide (about 10% of people). Close on the hinge with the condyles seated…" : "…and the first contact IS maximum intercuspation: every posterior tooth meets at once with the condyles still seated. No slide. This is also where we deliberately rebuild patients who need full reconstruction.")
      : ({ hinge: "The condyles are seated in centric relation, so the jaw can only rotate about the transverse horizontal axis: a hinge closure.",
           co: "First contact with the joints seated: centric occlusion. Only the second molars touch; the front teeth are still apart. On Dr. Givan's exams, CO always means this contact, never MIP.",
           slide: "From the CO contact the jaw slides up and forward along the inclines into MIP, and the condyle comes off its seat, forward and down the eminence.",
           mip: "MIP: full intercuspation, set by the teeth and the muscles, not by the joint. About 90% of people have this slide, around 1.25 ± 1 mm (a slide that deviates left or right tends to be more problematic). Closing into the unstable CO contact without the muscles' protection, especially asleep, gives wear facets, fractures and mobility." })[ph];
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

const CSS = `
.anima .cr-box{max-width:620px;margin:0 auto}
.anima .cr-svg .cr-t{fill:var(--anatomy-text);font:15px var(--anatomy-mono);paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round}
.anima .cr-svg .cr-t.cr-mut{fill:var(--anatomy-muted)}
.anima .cr-svg .cr-t.cr-sm{font-size:13px}
.anima .cr-svg .cr-bone{fill:var(--tm-bone);stroke:var(--anatomy-hi);stroke-width:1.1;stroke-linejoin:round}
.anima .cr-svg .cr-mand{fill:var(--tm-bone-in)}
.anima .cr-svg .cr-seat{fill:none;stroke:var(--anatomy-lit);stroke-width:1.4;stroke-dasharray:3 3}
.anima .cr-svg .cr-tooth{fill:#f6efe0;stroke:#8b7653;stroke-width:1;stroke-linejoin:round}
.anima .cr-svg .cr-ant{fill:#efe6d2}
.anima .cr-svg .cr-contact{fill:#c0392b}
.anima .cr-svg .cr-contact-halo{fill:#e05a4e;opacity:.3}
.anima .cr-zooms{display:grid;grid-template-columns:1fr 1fr;gap:8px 12px;max-width:620px;margin:10px auto 0}
.anima .cr-zfig{margin:0}
.anima .cr-zfig .am-svg{border:1px solid var(--line);border-radius:8px;overflow:hidden;background:var(--surface)}
.anima .cr-zfig figcaption{font:.74rem var(--font-mono);color:var(--ink-soft);margin-top:4px;text-align:center}
.anima .cr-zoom .cr-t{display:none}
.anima .cr-zoom .cr-contact{r:1.2px}
.anima .cr-zoom .cr-contact-halo{r:3px}
.anima .cr-svg .cr-path{stroke:var(--anatomy-lit);stroke-width:2.4;stroke-linecap:round}
`;

export function crslide() {
  return {
    id: "crslide", lec: "review",
    title: "From CR to the CO contact, then the slide into MIP",
    caption: "Close the jaw on its hinge with the condyles seated in centric relation until the first teeth touch (centric occlusion), then watch it slide up and forward into MIP as the condyle comes off its seat; switch to the 10% whose CO and MIP coincide.",
    html: `<div class="anima" data-anima="crslide">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: crLive.toString(),
    helpers: [crCurve, crZig, crSurf, crInterp, crMove, crGap, crContactRot, crPose, crSvg],
    data: D,
  };
}
