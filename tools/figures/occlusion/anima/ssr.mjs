// Fig 21: support, stability and retention (Occlusion L8, "Support, stability and retention"). The same frontal section
// as Fig 20 (l8den.mjs), both dentures in centric occlusion. Pick one of the three: the force it resists is drawn on
// the teeth and the dentures move with it (pressed into the tissues, pulled away from them, slid sideways), and what
// resists it is highlighted. Support: the palate above and the buccal shelf below (the primary support areas; the
// retromolar pad is behind this section), not the ridge crests. Retention: what patients notice (peanut butter, the
// tongue lifting the lower denture); suction and the saliva's adhesion and cohesion need a good fit and a border seal at
// the periphery, and muscle control matters most. Stability: sideways force, resisted by structures in the way (ridge
// height, width and shape, the palatal vault); the most important of the three, and what implants are fabulous at.
// Content from the L8 notes only (the 11/5 recording). Schematic: the movements are exaggerated to be seen.
import { figureSvg, plateHtml } from "./shared.mjs";
import { DEN, DEN_HELPERS, DEN_CSS } from "./l8den.mjs";

const W = 560, H = 330;
const D = Object.assign({}, DEN, { W, H, V: { OX: 280, OY: 196, S: 4.4 } });
/* the move for each: the upper denture's offset and the lower denture's (mm) */
const MOVE = { support: { up: [0, 0.5], lo: [0, -0.5] }, retention: { up: [0, -1.3], lo: [0, 1.3] }, stability: { up: [-0.9, 0], lo: [-0.9, 0] }, none: { up: [0, 0], lo: [0, 0] } };
const RES = { support: "palate · buccal shelf · retromolar pad", retention: "fit · border seal · saliva · muscles", stability: "ridge height, width, shape · vault" };
const HEAD = { support: ["Support", "resists vertical force toward the tissues"], retention: ["Retention", "resists being pulled away from the tissues"], stability: ["Stability", "resists sideways force: the most important"] };
const SUM = {
  none: "The three most important things about any removable prosthesis: support, stability and retention. Pick one to see the force it resists and what resists it.",
  support: "Support resists vertical force toward the tissues: closing compresses the dentures into them. Some areas take it well, the primary support areas: the palate above, and the buccal shelf and retromolar pad below (the pad is behind the last molar, out of this section). The ridges themselves aren't good at it.",
  retention: "Retention resists dislodgement away from the tissues: peanut butter holding the dentures together as the jaw opens, the tongue lifting the lower denture. It's what patients focus on; it bothers them, but it doesn't hurt. Suction and the saliva's adhesion and cohesion help, but only with a good fit and a border seal at the periphery that keeps air out. Muscle control is likely the most important factor.",
  stability: "Stability resists horizontal force: we chew side to side, not straight up and down like a shark. Structures have to be in the way: ridge height, width and shape, and the depth of the palatal vault. Of the three, stability is the most important: a denture that slides when the patient bites is extraordinarily painful, and they can't eat. It's the one thing implants are fabulous at: even two can change a patient's life. The denture's occlusion helps all three, especially stability.",
};
const HOT = {
  max: "Maxilla: the ridges and the palatal vault. A deep vault is a big help for the maxillary denture.",
  mand: "Mandible, cut through at the first molars: the ridge, and beside it the buccal shelf.",
  tongue: "Tongue. It can lift the lower denture off its ridge (retention), and it hypertrophies after the teeth are lost.",
  ubase: "Upper denture: its base covers the palate, a primary support area.",
  lbase: "Lower denture: its buccal flange rests on the buccal shelf, a primary support area.",
  teeth: "Denture teeth. The occlusion, how the teeth fit together, contributes to support, stability and retention, especially stability.",
};

function srSvg(st, D) {
  var f = function (n) { return Math.round(n * 10) / 10; }, V = D.V, o = "", m = st.mode, M = D.MOVE[m], u = st.u;
  var up = [M.up[0] * u, M.up[1] * u], T = { dx: 0, dy: 0, rot: 0, tip: 0, ddx: M.lo[0] * u, ddy: M.lo[1] * u };
  function X(p) { return D.dnX(p, V); } function Y(p) { return D.dnY(p, V); }
  function tx(x, y, t, cls, a) { return '<text class="sr-t' + (cls ? " " + cls : "") + '" x="' + f(x) + '" y="' + f(y) + '"' + (a ? ' text-anchor="' + a + '"' : "") + ">" + t + "</text>"; }
  function line(pts, cls) { return '<path class="' + cls + '" d="' + D.dnPath(pts, V) + '"/>'; }
  function both(pts) { return [pts, pts.map(function (p) { return [-p[0], p[1]]; }).reverse()]; }
  /* a label with its leader from the text's near edge to the point (p in mm) */
  function lab(t, x, y, p, a) { var px = X(p), py = Y(p), w = t.length * 6.9, l = a === "end" ? x - w : x, r = l + w, sx = px < l ? l - 3 : r + 3; return '<g class="am-callout"><path class="am-leader" d="M' + f(sx) + " " + f(y - 4) + "L" + f(px) + " " + f(py) + '"/><circle class="am-dot" cx="' + f(px) + '" cy="' + f(py) + '" r="1.8"/>' + tx(x, y, t, "sr-lab", a) + "</g>"; }
  function near(pts, x) { return pts.reduce(function (b, p) { return Math.abs(p[0] - x) < Math.abs(b[0] - x) ? p : b; }); }
  function arrow(p, d, cls) { var a = [X(p), Y(p)], b = [X([p[0] + d[0], p[1] + d[1]]), Y([p[0] + d[0], p[1] + d[1]])], L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L;
    return '<path class="' + cls + '" d="M' + f(a[0]) + " " + f(a[1]) + "L" + f(b[0]) + " " + f(b[1]) + "M" + f(b[0] - ux * 7 - uy * 4.5) + " " + f(b[1] - uy * 7 + ux * 4.5) + "L" + f(b[0]) + " " + f(b[1]) + "L" + f(b[0] - ux * 7 + uy * 4.5) + " " + f(b[1] - uy * 7 - ux * 4.5) + '"/>'; }
  o += D.dnScene(T, "anat", V, D, "sr", { hot: D.HOT, up: up });
  var MAX = D.MAX, MD = D.MAND;
  if (m === "support") {
    var pal = MAX.filter(function (p) { return Math.abs(p[0]) <= 18; }), shelf = MD.slice(1, 5), crestU = MAX.filter(function (p) { return p[0] >= -29.6 && p[0] <= -22.4; }), crestL = MD.slice(4, 8);
    o += line(pal, "sr-good");
    both(shelf).forEach(function (q) { o += line(q, "sr-good"); });
    both(crestU).concat(both(crestL)).forEach(function (q) { o += line(q, "sr-meh"); });
    [[-25, 1.5], [25, 1.5]].forEach(function (p) { o += arrow([p[0], p[1] + 2.2], [0, 4.6], "sr-force"); o += arrow([p[0] - 2.5, p[1] - 4.6], [0, -4.6], "sr-force"); });
    o += lab("palate", 14, 120, [-12, 21.2], "start") + lab("buccal shelf", 12, 300, [-33, -15.2], "start") + lab("ridge crest:", 548, 288, [25.6, -11.1], "end") + tx(548, 302, "not good at it", "sr-lab", "end");
  } else if (m === "retention") {
    /* the saliva film, halfway across the gap between each denture and its mucosa */
    var film = D.dnOff(MAX.filter(function (p) { return Math.abs(p[0]) <= 32; }), -D.MUC).map(function (p) { return [p[0], p[1] + up[1] * 0.5]; });
    o += line(film, "sr-film");
    [1, -1].forEach(function (s) { o += line(D.dnOff(MD.slice(1, 10), D.MUC).map(function (p) { return D.dnDen([s * p[0], p[1]], { ddx: T.ddx, ddy: T.ddy * 0.5 }, D); }), "sr-film"); });
    [[-33, 12.4], [33, 12.4]].forEach(function (p) { o += '<circle class="sr-seal" cx="' + f(X([p[0] + up[0], p[1] + up[1]])) + '" cy="' + f(Y([p[0] + up[0], p[1] + up[1]])) + '" r="4"/>'; });
    [[-34.6, -14.3], [34.6, -14.3], [-17.3, -17.6], [17.3, -17.6]].forEach(function (p) { var q = D.dnDen(p, T, D); o += '<circle class="sr-seal" cx="' + f(X(q)) + '" cy="' + f(Y(q)) + '" r="4"/>'; });
    o += arrow([0, 18], [0, -5], "sr-force") + arrow([-25, -9], [0, 5.2], "sr-force") + arrow([25, -9], [0, 5.2], "sr-force");
    o += lab("border seal", 14, 112, [-33 + up[0], 12.4 + up[1]], "start") + lab("saliva film", 546, 112, near(film, 12), "end") + lab("tongue lifts it", 546, 300, D.dnJaw([10, -5], {}, D), "end");
  } else if (m === "stability") {
    var wallsU = MAX.filter(function (p) { return p[0] >= -31.6 && p[0] <= -16; }), wallsL = MD.slice(2, 10);
    both(wallsU).concat(both(wallsL)).forEach(function (q) { o += line(q, "sr-wall"); });
    o += arrow([45, 3.4], [-10, 0], "sr-force") + arrow([43, -3.6], [-10, 0], "sr-force");
    o += lab("ridge height and width", 12, 300, [-28, -13.2], "start") + lab("palatal vault", 546, 112, [14, 20.4], "end");
  }
  /* what this one is */
  var hd = D.HEAD[m];
  if (hd) { o += '<rect class="sr-card" x="130" y="6" width="300" height="46" rx="10"/>' + tx(280, 25, hd[0], "sr-head", "middle") + tx(280, 41, hd[1], "sr-sub", "middle"); }
  return o;
}

const svg = figureSvg({ width: W, height: H, className: "sr-svg", label: "Frontal section of a patient wearing complete dentures, showing for support, retention or stability the force on the dentures and the structures that resist it.", body: srSvg({ mode: "support", u: 1 }, Object.assign({ MOVE, HEAD, SUM, HOT, srSvg }, D, Object.fromEntries(DEN_HELPERS.map((fn) => [fn.name, fn])))) });
const plate = plateHtml({ fig: "Fig 21", title: "Support, stability, retention", hint: "pick one", readout: "palate · buccal shelf · retromolar pad", body: `<div class="am-svg sr-box">${svg}</div>` });
const controls = `<div class="am-controls" role="group" aria-label="Which one"><button type="button" class="am-btn" data-srm="support" aria-pressed="true">Support</button><button type="button" class="am-btn" data-srm="retention" aria-pressed="false">Retention</button><button type="button" class="am-btn" data-srm="stability" aria-pressed="false">Stability</button></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Hover or tap a denture, the bone or the tongue.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From the L8 notes (Dr. Givan, the 11/5 recording): support resists vertical force toward the tissues (the buccal shelf and retromolar pad below and the palate above take it well; the ridges aren't good at it); retention resists vertical dislodgement away from the tissues (peanut butter, the tongue lifting the lower denture; suction, adhesion and cohesion through the saliva need a good fit and a border seal, and muscle control is likely the most important factor); stability resists horizontal force, is the most important, depends on ridge height, width and shape and the palatal vault, and is what implants do best.</li>
<li>Schematic: a frontal section through the first molars, drawn to typical proportions, not traced from a patient; how far each denture moves is exaggerated so it can be seen. Educational, not clinical guidance.</li></ul></details>`;

function srLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var svg = root.querySelector(".sr-svg"), sum = root.querySelector(".am-summary"), info = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]");
  var st = { mode: "support", u: 1 }, raf = 0;
  function draw() { svg.innerHTML = D.srSvg(st, D); }
  function text() { sum.textContent = D.SUM[st.mode]; if (readout) readout.textContent = D.RES[st.mode]; }
  /* press, pull or slide: ease the move in, hold it */
  function go() {
    cancelAnimationFrame(raf); text();
    if (reduce.matches) { st.u = 1; draw(); return; }
    var t0 = performance.now();
    function step(now) { var k = Math.min(1, (now - t0) / 700); st.u = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; draw(); if (k < 1) raf = requestAnimationFrame(step); }
    st.u = 0; raf = requestAnimationFrame(step);
  }
  root.querySelectorAll("[data-srm]").forEach(function (b) { b.addEventListener("click", function () { st.mode = b.getAttribute("data-srm"); root.querySelectorAll("[data-srm]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); go(); }); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && svg.contains(el)) info.textContent = el.getAttribute("data-info"); }
  svg.addEventListener("pointerover", hot); svg.addEventListener("click", hot);
  text(); draw();
}

const CSS = DEN_CSS("sr") + `
.anima .sr-box{max-width:600px;margin:0 auto}
.anima .sr-svg .sr-t{fill:var(--anatomy-text);font:11.5px var(--anatomy-mono);paint-order:stroke;stroke:var(--surface);stroke-width:3.5px;stroke-linejoin:round}
.anima .sr-svg .sr-head{fill:var(--anatomy-strong);font-weight:700;font-size:12.5px}
.anima .sr-svg .sr-sub{fill:var(--anatomy-muted);font-size:10.5px}
.anima .sr-svg .sr-lab{fill:var(--anatomy-strong)}
.anima .sr-svg .sr-card{fill:var(--surface);fill-opacity:.92;stroke:var(--line);stroke-width:1}
.anima .sr-svg .sr-good{fill:none;stroke:#2f8a5b;stroke-width:4;stroke-linecap:round;stroke-linejoin:round;stroke-opacity:.85}
.anima .sr-svg .sr-meh{fill:none;stroke:var(--tm-vessel);stroke-width:3.2;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1 5}
.anima .sr-svg .sr-wall{fill:none;stroke:var(--anatomy-lit);stroke-width:3.4;stroke-linecap:round;stroke-linejoin:round;stroke-opacity:.8}
.anima .sr-svg .sr-film{fill:none;stroke:#4a8fd0;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
.anima .sr-svg .sr-seal{fill:none;stroke:#2f8a5b;stroke-width:2}
.anima .sr-svg .sr-force{fill:none;stroke:var(--tm-vessel);stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
`;

export function ssr() {
  return {
    id: "ssr", lec: "dentures",
    title: "Support, stability and retention",
    caption: "The three things to remember about any removable denture. Pick one to see the force it resists, which way the denture would move, and what resists it.",
    html: `<div class="anima" data-anima="ssr">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: srLive.toString(),
    helpers: DEN_HELPERS.concat([srSvg]),
    data: Object.assign({ MOVE, HEAD, RES, SUM, HOT }, D),
  };
}
