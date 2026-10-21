// Fig: canine guidance vs group function (Occlusion L1 "Guidance and the goals of ideal occlusion", L5 "Schemes and
// guidance"). The patient's right side seen from the cheek (anterior to the right) in a right working movement, with a
// small front view of the canines. With canine guidance the lower canine rides out and down the upper canine's lingual
// slope and the steep overlap lifts every back tooth apart; with group function the guidance is flatter and the
// lateral incisor, canine and first premolar share the working contacts (#7-6-5, the notes' example: "today a canine,
// lateral and maybe the first premolar, not every tooth"), while the back teeth only just separate.
// The lower jaw moves as one rigid piece: it drops by the guiding slope times the sideways travel at the canine, and a
// little less toward the back because a working move turns about the working condyle (behind the drawing). The
// sideways travel itself is toward the viewer, so the side view shows only the vertical part. Slopes, drops and the
// condyle's distance are schematic; which teeth touch, and when each scheme is chosen, are the notes'.
import { figureSvg, plateHtml } from "./shared.mjs";

const W = 470, H = 248;
/* crowns in the side view: [x0, x1, kind, number]; upper ones sit half a cusp distal (Class I) */
const LOWER = [[96, 152, "m", 31], [152, 208, "m", 30], [208, 238, "p", 29], [238, 268, "p", 28], [268, 296, "c", 27], [296, 318, "i", 26]];
const UPPER = [[82, 138, "m", 2], [138, 194, "m", 3], [194, 224, "p", 4], [224, 254, "p", 5], [254, 286, "c", 6], [286, 312, "i", 7], [312, 340, "i", 8]];
const D = {
  W, H, yo: 118, LOWER, UPPER, condX: -260,
  /* per mode: guiding slope (degrees, front view), teeth in contact while working, back-tooth gap factor */
  MODES: {
    cg: { slope: 58, touch: [6], ltouch: [27] },
    gf: { slope: 36, touch: [7, 6, 5], ltouch: [26, 27, 28] },
  },
  travel: 18,
};

/* how far the lower jaw has dropped at x, for sideways travel u (0..1) in a mode */
function guDrop(x, u, mode, D) {
  var M = D.MODES[mode], dc = u * D.travel * Math.tan(M.slope * Math.PI / 180), xc = 282;
  return dc * (x - D.condX) / (xc - D.condX);
}

function guSvg(u, mode, D) {
  var M = D.MODES[mode], yo = D.yo, f = function (n) { return Math.round(n * 10) / 10; }, s = "";
  function S(pts) { var n = pts.length, d = "M" + f(pts[0][0]) + " " + f(pts[0][1]);
    for (var i = 0; i < n; i++) { var p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      d += "C" + f(p1[0] + (p2[0] - p0[0]) / 6) + " " + f(p1[1] + (p2[1] - p0[1]) / 6) + " " + f(p2[0] - (p3[0] - p1[0]) / 6) + " " + f(p2[1] - (p3[1] - p1[1]) / 6) + " " + f(p2[0]) + " " + f(p2[1]); }
    return d + "Z"; }
  function tx(x, y, t, cls, a) { return '<text class="gu-t' + (cls ? " " + cls : "") + '" x="' + f(x) + '" y="' + f(y) + '"' + (a ? ' text-anchor="' + a + '"' : "") + ">" + t + "</text>"; }
  /* a crown seen from the cheek: up = upper tooth (cusps point down) */
  function crown(t, up, dy) {
    var x0 = t[0] + 1, x1 = t[1] - 1, w = x1 - x0, sg = up ? 1 : -1, tip = yo + sg * (up ? 3 : 3), cerv = yo - sg * 34, pts;
    if (t[2] === "m") pts = [[x0, tip - sg * 9], [x0 + w * .25, tip], [x0 + w * .5, tip - sg * 6], [x0 + w * .75, tip], [x1, tip - sg * 9]];
    else if (t[2] === "p") pts = [[x0, tip - sg * 9], [x0 + w * .5, tip], [x1, tip - sg * 9]];
    else if (t[2] === "c") pts = [[x0, tip - sg * 12], [x0 + w * .5, tip + sg * (up ? 10 : 8)], [x1, tip - sg * 12]];
    else pts = [[x0, tip - sg * 2], [x0 + w * .5, tip + sg * (up ? 6 : 1)], [x1, tip - sg * 2]];
    pts = pts.concat([[x1 - 1, cerv + sg * 6], [x1 - w * .15, cerv], [x0 + w * .15, cerv], [x0 + 1, cerv + sg * 6]]);
    return pts.map(function (p) { return [p[0], p[1] + (dy || 0)]; });
  }
  /* maxilla and mandible bands */
  s += '<path class="gu-bone" d="M70 ' + (yo - 30) + 'C150 ' + (yo - 34) + ' 300 ' + (yo - 36) + ' 350 ' + (yo - 28) + 'L356 ' + (yo - 70) + 'L66 ' + (yo - 66) + 'Z"/>';
  D.UPPER.forEach(function (t) {
    var on = M.touch.indexOf(t[3]) >= 0;
    s += '<path class="gu-tooth' + (t[2] === "c" ? " gu-can" : "") + (on && u > 0.02 ? " is-on" : "") + ' hot" data-info="#' + t[3] + ' (upper right ' + { m: "molar", p: "premolar", c: "canine", i: "incisor" }[t[2]] + ')' + (on ? ': a guiding tooth in this scheme' : '') + '." d="' + S(crown(t, true)) + '"/>';
    s += tx((t[0] + t[1]) / 2, yo - 44, "#" + t[3], "gu-num", "middle");
  });
  var g = "", dl = guDrop(96, u, mode, D), dr = guDrop(330, u, mode, D);
  g += '<path class="gu-bone gu-mand" d="M78 ' + f(yo + 30 + dl) + 'C150 ' + f(yo + 34 + guDrop(150, u, mode, D)) + ' 280 ' + f(yo + 36 + guDrop(280, u, mode, D)) + ' 330 ' + f(yo + 30 + dr) + 'L334 ' + f(yo + 74 + dr) + 'L74 ' + f(yo + 70 + dl) + 'Z"/>';
  D.LOWER.forEach(function (t) {
    var on = M.ltouch.indexOf(t[3]) >= 0, dy = guDrop((t[0] + t[1]) / 2, u, mode, D);
    g += '<path class="gu-tooth' + (t[2] === "c" ? " gu-can" : "") + (on && u > 0.02 ? " is-on" : "") + '" d="' + S(crown(t, false, dy)) + '"/>';
    g += tx((t[0] + t[1]) / 2, yo + 50 + dy, "#" + t[3], "gu-num", "middle");
  });
  s += g;
  /* contact marks on the guiding teeth, gap marks behind */
  if (u > 0.02) {
    M.touch.forEach(function (n) { var t = D.UPPER.filter(function (q) { return q[3] === n; })[0], x = (t[0] + t[1]) / 2; s += '<circle class="gu-contact" cx="' + f(x) + '" cy="' + f(yo + (t[2] === "c" ? 6 : 4) + guDrop(x, u, mode, D) * 0.5) + '" r="3.5"/>'; });
    var x3 = (D.LOWER[1][0] + D.LOWER[1][1]) / 2, gap = guDrop(x3, u, mode, D);
    if (gap > 2) s += '<path class="gu-gap" d="M' + f(x3 + 18) + " " + (yo + 3) + "V" + f(yo + 3 + gap) + '"/>' + tx(x3 + 24, yo + 6 + gap / 2, "gap", "gu-sm");
  }
  s += tx(8, 18, "patient's RIGHT side, from the cheek · front →", "gu-mut gu-sm") + tx(8, D.H - 10, "right working movement: the lower jaw also slides toward you", "gu-mut gu-sm");
  return s;
}

/* front view of the right canines: the lower canine rides out (to the patient's right, the viewer's left) and down the
   upper canine's lingual slope */
function guFront(u, mode, D) {
  var M = D.MODES[mode], a = M.slope * Math.PI / 180, f = function (n) { return Math.round(n * 10) / 10; };
  var tipU = [70, 70], L = 46, dir = [Math.cos(a), Math.sin(a)];
  /* the lingual slope runs up and in (to the viewer's right) from the upper tip */
  var top = [tipU[0] + dir[0] * L, tipU[1] - dir[1] * L];
  var upper = "M" + f(tipU[0]) + " " + f(tipU[1]) + "L" + f(top[0]) + " " + f(top[1]) + "L" + f(top[0]) + " 6L" + f(tipU[0] - 22) + " 6L" + f(tipU[0] - 16) + " " + f(tipU[1] - 30) + "Z";
  var t = 0.15 + 0.85 * (1 - u), c = [tipU[0] + dir[0] * L * t, tipU[1] - dir[1] * L * t];
  var lower = "M" + f(c[0]) + " " + f(c[1]) + "L" + f(c[0] + 16) + " " + f(c[1] + 22) + "L" + f(c[0] + 14) + " 134L" + f(c[0] - 12) + " 134L" + f(c[0] - 12) + " " + f(c[1] + 20) + "Z";
  return '<path class="gu-tooth gu-can" d="' + upper + '"/><path class="gu-tooth gu-can" d="' + lower + '"/>' +
    '<circle class="gu-contact" cx="' + f(c[0]) + '" cy="' + f(c[1]) + '" r="3.5"/>' +
    '<path class="gu-arc" d="M' + f(tipU[0] + 20) + " " + tipU[1] + "A20 20 0 0 0 " + f(tipU[0] + 20 * dir[0]) + " " + f(tipU[1] - 20 * dir[1]) + '"/>' +
    '<text class="gu-t gu-sm" x="6" y="146">cheek ←</text><text class="gu-t gu-sm" x="154" y="146" text-anchor="end">→ tongue</text>';
}

const MODES = [["cg", "Canine guidance"], ["gf", "Group function"]];
const side = figureSvg({ width: W, height: H, className: "gu-svg gu-side", label: "The patient's right side from the cheek in a right working movement: upper and lower teeth from the second molar to the incisors.", body: guSvg(0, "cg", D) });
const front = figureSvg({ width: 160, height: 150, className: "gu-svg gu-front", label: "Front view of the right upper and lower canines: the lower canine rides out and down the upper canine's lingual slope.", body: guFront(0, "cg", D) });
const plate = plateHtml({ fig: "Fig 8", title: "Working-side guidance", hint: "move to the right", readout: "canine guidance",
  body: `<div class="gu-grid"><div class="am-svg">${side}</div><figure class="gu-ffig"><div class="am-svg">${front}</div><figcaption>The right canines from the front</figcaption></figure></div>` });
const controls = `<div class="am-controls" role="group" aria-label="Scheme">${MODES.map(([k, l], i) => `<button type="button" class="am-btn" data-gumode="${k}" aria-pressed="${!i}">${l}</button>`).join("")}</div>
<div class="am-controls"><label class="am-slider"><span>MIP</span><input type="range" min="0" max="100" step="1" value="0" aria-label="Move the jaw to the right (working side)"><span>to the right</span></label><button type="button" class="am-btn" data-guplay aria-pressed="false">Move</button></div>
<div class="am-stats" aria-live="polite"><span><b>Guiding</b> <em data-r="touch">#6 (and #27)</em></span><span><b>Back teeth</b> <em data-r="back">together in MIP</em></span></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Tap or hover an upper tooth for its number.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From the notes: canine guidance (canine-protected articulation) uses the canines' vertical and horizontal overlap to disengage the posterior teeth in excursions; canines have the buttressing bone and proprioception for it. Group function shares the working-side contacts among several teeth (e.g. #7-6-5), today a few anterior teeth and perhaps the first premolar, not every tooth. Accepted schemes: balanced (dentures only), mutually protected, group function. With no signs or symptoms, copy the guidance the patient already has.</li>
<li>Slopes, drops and the gap sizes are schematic. The lower jaw is drawn as one rigid piece that drops less toward the back, because a working movement turns about the working condyle; the sideways part of the move is toward you and can't be drawn in this view.</li></ul></details>`;

function guLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var side = root.querySelector(".gu-side"), front = root.querySelector(".gu-front"), slider = root.querySelector('input[type="range"]'), play = root.querySelector("[data-guplay]");
  var sum = root.querySelector(".am-summary"), infoEl = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]");
  var rs = {}; Array.prototype.forEach.call(root.querySelectorAll("[data-r]"), function (e) { rs[e.getAttribute("data-r")] = e; });
  var u = 0, mode = "cg", frame = 0, t0 = 0, from = 0, to = 1, playing = false;
  function draw() {
    side.innerHTML = D.guSvg(u, mode, D); front.innerHTML = D.guFront(u, mode, D);
    var M = D.MODES[mode], gap = D.guDrop(180, u, mode, D) / 6;
    rs.touch.textContent = M.touch.map(function (n) { return "#" + n; }).join(", ") + " (with " + M.ltouch.map(function (n) { return "#" + n; }).join(", ") + ")";
    rs.back.textContent = u < 0.02 ? "together in MIP" : (mode === "cg" ? "lifted apart" : "only just apart") + " (about " + gap.toFixed(1) + " mm at #3, schematic)";
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
.anima .gu-grid{display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center;justify-content:center}
.anima .gu-grid > .am-svg{flex:3 1 440px;min-width:0}
.anima .gu-ffig{margin:0;flex:1 1 130px;max-width:200px}
.anima .gu-ffig figcaption{font:.74rem var(--font-mono);color:var(--ink-soft);text-align:center;margin-top:2px}
.anima .gu-svg .gu-t{fill:var(--anatomy-text);font:14px var(--anatomy-mono);paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round}
.anima .gu-svg .gu-mut{fill:var(--anatomy-muted)}
.anima .gu-svg .gu-sm{font-size:12px}
.anima .gu-svg .gu-num{font-size:11px;fill:var(--anatomy-muted)}
.anima .gu-svg .gu-bone{fill:var(--tm-bone);stroke:var(--anatomy-hi);stroke-width:1.1;stroke-linejoin:round}
.anima .gu-svg .gu-mand{fill:var(--tm-bone-in)}
.anima .gu-svg .gu-tooth{fill:#f6efe0;stroke:#8b7653;stroke-width:1;stroke-linejoin:round;transition:fill .2s}
.anima .gu-svg .gu-tooth.is-on{fill:#f3d2a6;stroke:#b5651d;stroke-width:1.6}
.anima .gu-svg .gu-contact{fill:#c0392b}
.anima .gu-svg .gu-gap{stroke:var(--anatomy-lit);stroke-width:2;stroke-linecap:round}
.anima .gu-svg .gu-arc{fill:none;stroke:var(--anatomy-lit);stroke-width:1.6}
`;

export function guidance() {
  return {
    id: "guidance", lec: "review",
    title: "Canine guidance or group function",
    caption: "Move the jaw to the right and compare canine guidance, where the canines lift every back tooth apart, with group function, where the lateral incisor, canine and first premolar share the working contacts.",
    html: `<div class="anima" data-anima="guidance">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: guLive.toString(),
    helpers: [guDrop, guSvg, guFront],
    data: D,
  };
}
