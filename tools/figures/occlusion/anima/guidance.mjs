// Fig: canine guidance vs group function (Occlusion L1 "Guidance and the goals of ideal occlusion", L5 "Schemes and
// guidance"). The patient's right side seen from the cheek (anterior to the right) in a right working movement, with a
// frontal section of the right canines beside it. With canine guidance the lower canine rides out and down the upper
// canine's steep lingual slope and the overlap lifts every back tooth apart; with group function the guidance is
// flatter and the lateral incisor, canine and first premolar share the working contacts (#7-6-5, the notes' example:
// "today a canine, lateral and maybe the first premolar, not every tooth"), while the back teeth only just separate.
// Built in millimeters (x forward, y down, the occlusal plane at y = 0) and scaled once. The teeth are in Class I: each
// lower tooth sits about half a cusp in front of its upper partner, the MB cusp of #3 over the buccal groove of #30 and
// the lower canine's tip in the embrasure between the upper lateral and canine. Upper teeth are drawn over the lower
// ones, as they overlap them from the cheek side.
// One model drives both views: the jaw travels sideways by TRAVEL (toward the viewer, so the side view shows only its
// vertical part); at the canine it drops by TRAVEL x tan(guiding slope), and toward the back a little less, because a
// working move turns about the working condyle (behind the drawing). The canines' vertical overlap is set so canine
// guidance reaches tip to tip at the end of the move. Slopes, drops and the condyle's distance are schematic; which
// teeth touch, and when each scheme is chosen, are the notes'.
import { figureSvg, plateHtml, f1, smooth } from "./shared.mjs";

const W = 470, H = 308, K = 8.8, OX = 22, OY = 128;             /* side view: x = OX + mm*K, y = OY + mm*K */
const X = (x) => OX + x * K, Y = (y) => OY + y * K, P = (p) => [f1(X(p[0])), f1(Y(p[1]))];
const OV = 3.4, SLOPE = { cg: 58, gf: 36 }, TRAVEL = OV / Math.tan(SLOPE.cg * Math.PI / 180), COND = -42;
const spee = (x) => -0.8 * Math.pow(Math.max(0, (30 - x) / 30), 2);   /* a mild curve of Spee, rising toward the back */

/* crowns from the cheek: [number, kind, x0 (distal), x1 (mesial), tip level, crown height]; anterior is to the right */
const UPPER = [[2, "m", 0, 9, 0.45, 7], [3, "m", 9, 19, 0.45, 7], [4, "p", 19, 25.6, 0.55, 8], [5, "p", 25.6, 32.6, 0.6, 8.2],
  [6, "c", 32.6, 39.4, 2.6, 10], [7, "i", 39.4, 43.6, 2.4, 9], [8, "i", 43.6, 47.0, 3.0, 10.5]];
const LOWER = [[31, "m2", -0.2, 10.3, 0.05, 7.5], [30, "m3", 10.3, 21.3, 0.05, 7.5], [29, "p", 21.3, 28.82, 0.0, 8], [28, "p", 28.82, 36.34, -0.05, 8.2],
  [27, "c", 36.34, 41.94, -0.8, 11], [26, "i", 41.94, 44.6, -0.5, 9], [25, "i", 44.6, 46.4, -0.5, 9]];
/* outline of a crown as [fraction of width from distal, fraction of height from the tip]; cervical end first */
const FORM = {
  m: [[.12, 1], [.03, .6], [0, .36], [.05, .25], [.3, 0], [.5, .2], [.72, -.01], [.95, .25], [1, .37], [.97, .6], [.88, 1]],
  m2: [[.12, 1], [.03, .6], [0, .3], [.05, .2], [.28, 0], [.5, .18], [.74, 0], [.95, .2], [1, .3], [.97, .6], [.88, 1]],
  m3: [[.12, 1], [.03, .6], [0, .3], [.04, .22], [.14, .04], [.26, .18], [.42, 0], [.61, .19], [.77, 0], [.95, .2], [1, .3], [.97, .6], [.88, 1]],
  p: [[.15, 1], [.03, .55], [0, .42], [.1, .3], [.52, 0], [.9, .3], [1, .42], [.97, .55], [.85, 1]],
  c: [[.16, 1], [.02, .55], [0, .42], [.08, .34], [.55, 0], [.95, .28], [1, .38], [.97, .55], [.84, 1]],
  i: [[.2, 1], [.02, .5], [.03, .14], [.25, 0], [.75, 0], [.98, .14], [.98, .5], [.8, 1]],
};
/* a crown's points (mm), with a root stub under the gum; up = upper tooth (its tip points down) */
function crown(t, up) {
  const [, kind, x0, x1, tip0, h] = t, w = x1 - x0, sg = up ? 1 : -1, tip = tip0 + spee((x0 + x1) / 2);
  const pts = FORM[kind].map(([fx, fh]) => [x0 + fx * w, tip - sg * fh * h]);
  const cer = tip - sg * h, root = cer - sg * 2.2;
  return [[x0 + .2 * w, root]].concat(pts, [[x1 - .2 * w, root]]);
}
const tipPt = (t, fx) => { const [, , x0, x1, tip0] = t, x = x0 + fx * (x1 - x0); return [x, tip0 + spee((x0 + x1) / 2)]; };
/* the gum: the scalloped margin around each crown's neck and papillae between them, closed by a soft fold 5 mm away */
function gum(teeth, up) {
  const sg = up ? 1 : -1, m = [];
  const cer = (t) => t[4] + spee((t[2] + t[3]) / 2) - sg * t[5];
  const pap = (a, b) => [a[3], (cer(a) + cer(b)) / 2 + sg * 0.33 * (a[5] + b[5]) / 2];
  m.push([teeth[0][2] - 2.5, cer(teeth[0]) - sg * 0.6]);
  teeth.forEach((t, i) => {
    const w = t[3] - t[2], c = cer(t);
    if (i === 0) m.push([t[2] + .05 * w, c + sg * 0.25 * t[5]]);
    m.push([t[2] + .3 * w, c + sg * 0.05], [t[2] + .5 * w, c - sg * 0.15], [t[2] + .7 * w, c + sg * 0.05]);
    m.push(i < teeth.length - 1 ? pap(t, teeth[i + 1]) : [t[3] - .02 * w, c + sg * 0.25 * t[5]]);
  });
  const last = teeth[teeth.length - 1];
  m.push([last[3] + 1.6, cer(last) - sg * 0.8]);
  const far = m.slice().reverse().map(([x, y], i, a) => [x, Math.min(...a.map((q) => sg * q[1])) * sg - sg * (3.4 + 0.35 * Math.sin(i))]);
  return m.concat(far);
}

/* the lower crowns' top edge and the upper crowns' bottom edge over #3, to place the gap mark */
function edge(pts, bottom) {
  const N = pts.length, out = {};
  for (let i = 0; i < N; i++) {
    const p0 = pts[(i - 1 + N) % N], p1 = pts[i], p2 = pts[(i + 1) % N], p3 = pts[(i + 2) % N];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    for (let k = 0; k < 40; k++) { const t = k / 40, s = 1 - t, x = s * s * s * p1[0] + 3 * s * s * t * c1[0] + 3 * s * t * t * c2[0] + t * t * t * p2[0], y = s * s * s * p1[1] + 3 * s * s * t * c1[1] + 3 * s * t * t * c2[1] + t * t * t * p2[1], c = Math.round(x * 10);
      if (out[c] === undefined || (bottom ? y > out[c] : y < out[c])) out[c] = y; }
  }
  return out;
}
const UB = Object.assign({}, ...UPPER.map((t) => edge(crown(t, true), true)));
const LT = Object.assign({}, ...LOWER.map((t) => edge(crown(t, false), false)));
let GX = 0, GS = Infinity;
for (let c = 100; c <= 180; c++) if (UB[c] !== undefined && LT[c] !== undefined && LT[c] - UB[c] < GS) { GS = LT[c] - UB[c]; GX = c / 10; }
const GU = UB[Math.round(GX * 10)], GL = LT[Math.round(GX * 10)];

const ROLE = { m: "molar", m2: "molar", m3: "molar", p: "premolar", c: "canine", i: "incisor" };
const MODES = {
  /* dots: [upper tooth, [fx, fh] at the start of the move, [fx, fh] at the end of canine guidance]: the contact is on the
     tooth's lingual side, so the dot sits inside its crown, sliding toward the tip as the guidance runs out */
  cg: { touch: [6], ltouch: [27], dots: [[6, [.8, .22], [.57, .05]]] },
  gf: { touch: [7, 6, 5], ltouch: [26, 27, 28], dots: [[7, [.45, .2], [.45, .08]], [6, [.8, .22], [.57, .05]], [5, [.66, .2], [.56, .08]]] },
};
const byN = (n) => LOWER.filter((t) => t[0] === n)[0];
const upN = (n) => UPPER.filter((t) => t[0] === n)[0];
const inCrown = (t, [fx, fh]) => { const [, , x0, x1, tip0, h] = t; return [+(x0 + fx * (x1 - x0)).toFixed(2), +(tip0 + spee((x0 + x1) / 2) - fh * h).toFixed(2)]; };
const dotsFor = (m) => MODES[m].dots.map(([n, a, b]) => [inCrown(upN(n), a), inCrown(upN(n), b)]);
const D = {
  OX, OY, K, COND, OV, TRAVEL, SLOPE, xc: tipPt(byN(27), .55)[0],
  DOTS: { cg: dotsFor("cg"), gf: dotsFor("gf") },
  touch: { cg: MODES.cg.touch, gf: MODES.gf.touch }, ltouch: { cg: MODES.cg.ltouch, gf: MODES.gf.ltouch },
  gap: { x: f1(GX), up: +GU.toFixed(2), lo: +GL.toFixed(2), sep: +GS.toFixed(2) },
  FI: { ox: 70, oy: 150, k: 9 },
};

/* ---------- the side view ---------- */
const dP = (pts) => smooth(pts.map(P), true);
const num = (t, up) => { const [n, , x0, x1, tip0, h] = t, y = tip0 + spee((x0 + x1) / 2) - (up ? 1 : -1) * (h + 1.7); return `<text class="gu-num" x="${f1(X((x0 + x1) / 2))}" y="${f1(Y(y) + 4)}" text-anchor="middle">${n}</text>`; };
const lowerG = LOWER.map((t) => `<path class="gu-tooth${t[1] === "c" ? " gu-can" : ""}" data-n="${t[0]}" d="${dP(crown(t, false))}"/>`).join("") +
  `<path class="gu-gum" d="${dP(gum(LOWER, false))}"/>` + LOWER.map((t) => num(t, false)).join("");
const upperG = UPPER.map((t) => `<path class="gu-tooth hot${t[1] === "c" ? " gu-can" : ""}" data-n="${t[0]}" data-info="#${t[0]}: upper right ${ROLE[t[1]]}${t[0] === 6 ? "; it guides alone in canine guidance" : t[0] === 7 || t[0] === 5 ? "; it shares the working contacts in group function" : ""}." d="${dP(crown(t, true))}"/>`).join("") +
  `<path class="gu-gum" d="${dP(gum(UPPER, true))}"/>` + UPPER.map((t) => num(t, true)).join("");
const sideBody = `<text class="gu-t gu-mut gu-sm" x="8" y="16">patient's RIGHT side, from the cheek · front →</text>` +
  `<g class="gu-low">${lowerG}</g>${upperG}<g class="gu-dots"></g><path class="gu-gap" d="M0 0"/><text class="gu-t gu-sm gu-gaptxt" x="0" y="0"></text>` +
  `<text class="gu-t gu-mut gu-sm" x="8" y="${H - 8}">right working move: the lower jaw also slides toward you</text>`;

/* ---------- the frontal section of the right canines (mm, x toward the tongue, y down; the upper tip at 0,0) ---------- */
const FI = D.FI, FXp = (p) => [f1(FI.ox + p[0] * FI.k), f1(FI.oy + p[1] * FI.k)];
const dF = (pts) => smooth(pts.map(FXp), true);
function upperCanine(a) {
  const c = Math.cos(a), s = Math.sin(a), e = [4.6 * c, -4.6 * s];
  return [[0, 0], [0.6 * c, -0.6 * s], [2.2 * c, -2.2 * s], [3.6 * c, -3.6 * s], e, [e[0] + 1.25, e[1] - 1.5], [e[0] + 1.6, -6.4], [e[0] + 1.0, -8.9], [3.2, -10.4],
    [2.6, -14], [2.0, -19], [-0.4, -19], [-0.9, -14], [-1.6, -10.4], [-2.45, -8.2], [-2.6, -6.0], [-1.95, -3.3], [-0.7, -1.0]];
}
const LC = [[0, 0], [-0.45, 0.9], [-1.2, 3.0], [-2.05, 5.6], [-2.15, 8.0], [-1.6, 10.6], [-1.0, 14], [-0.4, 24], [2.2, 24], [2.6, 14], [3.3, 10.6], [4.6, 8.0], [4.5, 5.2], [2.9, 2.6], [1.3, 0.8], [0.45, 0.05]];
function frontFor(mode) {
  const a = SLOPE[mode] * Math.PI / 180, L0 = [OV / Math.tan(a), -OV], lit = mode === "cg" ? "steep" : "flatter";
  return `<g class="gu-fm" data-m="${mode}"${mode === "cg" ? "" : " hidden"}><path class="gu-tooth gu-can" d="${dF(upperCanine(a))}"/>` +
    `<path class="gu-slope" d="M${FXp([0.5 * Math.cos(a), -0.5 * Math.sin(a)]).join(" ")}L${FXp([4.4 * Math.cos(a), -4.4 * Math.sin(a)]).join(" ")}"/>` +
    `<g class="gu-lc"><path class="gu-tooth gu-can" d="${dF(LC.map((p) => [p[0] + L0[0], p[1] + L0[1]]))}"/></g>` +
    `<text class="gu-t gu-sm" x="6" y="${H - 34}">${lit}</text><text class="gu-t gu-sm" x="6" y="${H - 20}">guidance</text></g>`;
}
const frontBody = frontFor("cg") + frontFor("gf") + `<circle class="gu-contact" cx="0" cy="0" r="3.6"/>` +
  `<text class="gu-t gu-sm" x="6" y="124">←</text><text class="gu-t gu-sm" x="6" y="138">labial</text>` +
  `<text class="gu-t gu-sm" x="${180 - 6}" y="66" text-anchor="end">lingual</text><text class="gu-t gu-sm" x="${180 - 6}" y="80" text-anchor="end">→</text>`;

const side = figureSvg({ width: W, height: H, className: "gu-svg gu-side", label: "The patient's right side from the cheek in a right working movement, upper teeth from the second molar to the central incisor over the lower teeth, in Class I, with the gums.", body: sideBody });
const front = figureSvg({ width: 180, height: H, className: "gu-svg gu-front", label: "Frontal section of the right upper and lower canines: the lower canine's tip rests on the upper canine's lingual slope and rides out and down it in a right move.", body: frontBody });
const plate = plateHtml({ fig: "Fig 8", title: "Working-side guidance", hint: "move to the right", readout: "canine guidance",
  body: `<div class="gu-grid"><div class="am-svg">${side}</div><figure class="gu-ffig"><div class="am-svg">${front}</div><figcaption>The right canines from the front</figcaption></figure></div>` });
const controls = `<div class="am-controls" role="group" aria-label="Scheme">${[["cg", "Canine guidance"], ["gf", "Group function"]].map(([k, l], i) => `<button type="button" class="am-btn" data-gumode="${k}" aria-pressed="${!i}">${l}</button>`).join("")}</div>
<div class="am-controls"><label class="am-slider"><span>MIP</span><input type="range" min="0" max="100" step="1" value="0" aria-label="Move the jaw to the right (working side)"><span>to the right</span></label><button type="button" class="am-btn" data-guplay aria-pressed="false">Move</button></div>
<div class="am-stats" aria-live="polite"><span><b>Guiding</b> <em data-r="touch">#6 (with #27)</em></span><span><b>Back teeth</b> <em data-r="back">together in MIP</em></span></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Tap or hover an upper tooth for its number.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From the notes: canine guidance (canine-protected articulation) uses the canines' vertical and horizontal overlap to disengage the posterior teeth in excursions; canines have the buttressing bone and proprioception for it. Group function shares the working-side contacts among several teeth (e.g. #7-6-5), today a few anterior teeth and perhaps the first premolar, not every tooth. Accepted schemes: balanced (dentures only), mutually protected, group function. With no signs or symptoms, copy the guidance the patient already has.</li>
<li>The teeth are in Class I (the lower canine's tip between the upper lateral and canine, the MB cusp of #3 over the buccal groove of #30). A red dot marks each upper tooth that is guiding; the contact itself is on its tongue side, out of sight in the side view. Slopes, drops and the gap are schematic, and the group-function canine is drawn with a flatter lingual slope. In the side view the canines don't look tip to tip at the end of the move, because the lower canine also moves toward the cheek; the front view shows them meeting. The lower jaw moves as one rigid piece that drops less toward the back, because a working movement turns about the working condyle; the sideways part of the move is toward you and can't be drawn in the side view.</li></ul></details>`;

function guLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var side = root.querySelector(".gu-side"), front = root.querySelector(".gu-front"), slider = root.querySelector('input[type="range"]'), play = root.querySelector("[data-guplay]");
  var sum = root.querySelector(".am-summary"), infoEl = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]");
  var low = side.querySelector(".gu-low"), dots = side.querySelector(".gu-dots"), gapP = side.querySelector(".gu-gap"), gapT = side.querySelector(".gu-gaptxt"), dotF = front.querySelector(".gu-contact");
  var rs = {}; Array.prototype.forEach.call(root.querySelectorAll("[data-r]"), function (e) { rs[e.getAttribute("data-r")] = e; });
  var u = 0, mode = "cg", frame = 0, t0 = 0, from = 0, to = 1, playing = false;
  function f(n) { return Math.round(n * 10) / 10; }
  function draw() {
    var a = D.SLOPE[mode] * Math.PI / 180, dc = u * D.TRAVEL * Math.tan(a), ang = Math.atan(dc / (D.xc - D.COND));
    var cx = D.OX + D.COND * D.K, cy = D.OY, c = Math.cos(ang), s = Math.sin(ang);
    function rot(p) { var x = D.OX + p[0] * D.K - cx, y = D.OY + p[1] * D.K - cy; return [cx + x * c - y * s, cy + x * s + y * c]; }
    low.setAttribute("transform", "rotate(" + f(ang * 180 / Math.PI * 100) / 100 + " " + f(cx) + " " + f(cy) + ")");
    var on = u > 0.02, T = D.touch[mode], LT = D.ltouch[mode];
    Array.prototype.forEach.call(side.querySelectorAll(".gu-tooth"), function (e) { var n = +e.getAttribute("data-n"); e.classList.toggle("is-on", on && (T.indexOf(n) >= 0 || LT.indexOf(n) >= 0)); });
    var run = dc / D.OV;
    dots.innerHTML = on ? D.DOTS[mode].map(function (d) { var x = d[0][0] + (d[1][0] - d[0][0]) * run, y = d[0][1] + (d[1][1] - d[0][1]) * run; return '<circle class="gu-contact" cx="' + f(D.OX + x * D.K) + '" cy="' + f(D.OY + y * D.K) + '" r="3.6"/>'; }).join("") : "";
    /* the gap over #3: the lower edge has dropped with the jaw */
    var g = D.gap, lo = rot([g.x, g.lo]), upY = D.OY + g.up * D.K, gap = (lo[1] - upY) / D.K;
    if (on && gap > 0.25) { gapP.setAttribute("d", "M" + f(lo[0] - 4) + " " + f(upY) + "H" + f(lo[0] + 4) + "M" + f(lo[0]) + " " + f(upY) + "V" + f(lo[1]) + "M" + f(lo[0] - 4) + " " + f(lo[1]) + "H" + f(lo[0] + 4));
      gapT.setAttribute("x", f(lo[0] + 8)); gapT.setAttribute("y", f((upY + lo[1]) / 2 + 4)); gapT.textContent = "gap"; }
    else { gapP.setAttribute("d", "M0 0"); gapT.textContent = ""; }
    /* the canines from the front: the lower canine slides out (to the viewer's left) and down the slope */
    Array.prototype.forEach.call(front.querySelectorAll(".gu-fm"), function (g) { if (g.getAttribute("data-m") === mode) g.removeAttribute("hidden"); else g.setAttribute("hidden", ""); });
    var FI = D.FI, mv = [-u * D.TRAVEL, dc], L0 = [D.OV / Math.tan(a), -D.OV];
    front.querySelector('.gu-fm[data-m="' + mode + '"] .gu-lc').setAttribute("transform", "translate(" + f(mv[0] * FI.k) + " " + f(mv[1] * FI.k) + ")");
    dotF.setAttribute("cx", f(FI.ox + (L0[0] + mv[0]) * FI.k)); dotF.setAttribute("cy", f(FI.oy + (L0[1] + mv[1]) * FI.k));
    rs.touch.textContent = T.map(function (n) { return "#" + n; }).join(", ") + " (with " + LT.map(function (n) { return "#" + n; }).join(", ") + ")";
    rs.back.textContent = !on ? "together in MIP" : gap <= 0.25 ? "just starting to part" : (mode === "cg" ? "lifted apart" : "only just apart") + " (about " + gap.toFixed(1) + " mm at #3, schematic)";
    if (readout) readout.textContent = mode === "cg" ? "canine guidance" : "group function";
    var t = mode === "cg"
      ? "Canine guidance: in a right working move the lower canine (#27) rides out and down the upper canine's (#6) steep lingual slope, and that overlap lifts every back tooth apart. Canines have the buttressing bone and the proprioception for it. With anterior guidance present, the closer determinant has the greater impact on posterior separation."
      : "Group function: a flatter guidance shared by several teeth, here the lateral incisor, canine and first premolar (#7-6-5), so the working load is spread; the back teeth only just separate. Chosen when the canine has compromised periodontal support, is missing, or is an implant (no proprioception). Today that means a few anterior teeth and maybe the first premolar, not every tooth; and with no signs or symptoms, copy the guidance the patient already has.";
    if (sum.textContent !== t) sum.textContent = t;
  }
  function stop() { playing = false; cancelAnimationFrame(frame); play.setAttribute("aria-pressed", "false"); }
  function tick(now) { if (!t0) t0 = now; var k = Math.min(1, (now - t0) / 1300), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; u = from + (to - from) * e; slider.value = Math.round(u * 100); draw(); if (k < 1) frame = requestAnimationFrame(tick); else stop(); }
  play.addEventListener("click", function () { if (playing) { stop(); return; } from = u; to = u > 0.5 ? 0 : 1; if (reduce.matches) { u = to; slider.value = Math.round(u * 100); draw(); return; } playing = true; t0 = 0; play.setAttribute("aria-pressed", "true"); frame = requestAnimationFrame(tick); });
  slider.addEventListener("input", function () { stop(); u = +slider.value / 100; draw(); });
  root.querySelectorAll("[data-gumode]").forEach(function (b) { b.addEventListener("click", function () { mode = b.getAttribute("data-gumode"); root.querySelectorAll("[data-gumode]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); draw(); }); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && side.contains(el)) infoEl.textContent = el.getAttribute("data-info"); }
  side.addEventListener("pointerover", hot); side.addEventListener("click", hot);
  draw();
}

const CSS = `
.anima .gu-grid{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;justify-content:center}
.anima .gu-grid > .am-svg{flex:3 1 420px;min-width:0}
.anima .gu-ffig{margin:0;flex:1 1 120px;max-width:190px}
.anima .gu-ffig figcaption{font:.74rem var(--font-mono);color:var(--ink-soft);text-align:center;margin-top:2px}
@media (max-width:560px){.anima .gu-ffig{max-width:150px}}
.anima .gu-svg .gu-t{fill:var(--anatomy-text);font:14px var(--anatomy-mono);paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round}
.anima .gu-svg .gu-mut{fill:var(--anatomy-muted)}
.anima .gu-svg .gu-sm{font-size:12px}
.anima .gu-svg .gu-num{fill:#7a4a44;font:600 11.5px var(--anatomy-mono)}
.anima .gu-svg .gu-gum{fill:#efc3bb;stroke:#b9766c;stroke-width:1;stroke-linejoin:round}
.anima .gu-svg .gu-tooth{fill:#f6efe0;stroke:#8b7653;stroke-width:1;stroke-linejoin:round;transition:fill .2s}
.anima .gu-svg .gu-tooth.is-on{fill:#f3d2a6;stroke:#b5651d;stroke-width:1.6}
.anima .gu-svg .gu-contact{fill:#c0392b;stroke:#fff8ee;stroke-width:1.4}
.anima .gu-svg .gu-gap{fill:none;stroke:var(--anatomy-lit);stroke-width:2;stroke-linecap:round}
.anima .gu-svg [hidden]{display:none}
.anima .gu-svg .gu-slope{fill:none;stroke:#2747a3;stroke-width:3;stroke-linecap:round;opacity:.75}
`;

export function guidance() {
  return {
    id: "guidance", lec: "review",
    title: "Canine guidance or group function",
    caption: "Move the jaw to the right and compare canine guidance, where the canines lift every back tooth apart, with group function, where the lateral incisor, canine and first premolar share the working contacts.",
    html: `<div class="anima" data-anima="guidance">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: guLive.toString(),
    helpers: [],
    data: D,
  };
}
