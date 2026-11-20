// Fig 25: pH vs buffering capacity (Occlusion L9, "pH vs buffering capacity" and "Raising the pH"; Dr. Lawson's
// prerecorded lecture). Two drinks that start at the same pH, 4 (his example), each with a pH probe in it. Add bicarbonate
// a drop at a time, the way buffering capacity is measured, and count how much each takes to reach neutral: A (an
// unbuffered acid) in a few drops, B (a citric acid buffer, like orange juice) in eight times as many. A water button
// doubles the volume: the pH barely moves (a log scale) and it still takes the same bicarbonate. The chart traces each
// drink's pH against the drops added. The drinks are made up to show the idea; the chemistry is real (a strong acid, and
// citric acid with its three pKa values, titrated with a base).
import { figureSvg, plateHtml } from "./shared.mjs";

const GW = 340, GH = 256, CW = 340, CH = 214;
const KW = 1e-14, KA = [Math.pow(10, -3.13), Math.pow(10, -4.76), Math.pow(10, -6.40)];
const DROP = 2e-5, NA_DROPS = 5, NB_DROPS = 40;
/* the protons citric acid has given up, on average, at hydrogen ion concentration h */
function bfN(h, D) { var k = D.KA, a = h * h * k[0], b = h * k[0] * k[1], c = k[0] * k[1] * k[2]; return (a + 2 * b + 3 * c) / (h * h * h + a + b + c); }
/* B is sized so NB_DROPS bring it from pH 4 to 7 exactly; A holds NA_DROPS' worth of strong acid */
const h4 = 1e-4, h7 = 1e-7;
const CT = (NB_DROPS * DROP + KW / h4 - h4 + h7 - KW / h7) / (bfN(h7, { KA }) - bfN(h4, { KA }));
const NA0 = CT * bfN(h4, { KA }) + KW / h4 - h4;
const D0 = { KW, KA, DROP, AA: NA_DROPS * DROP, CT, NA0, NA_DROPS, NB_DROPS };

/* each drink's pH from its moles of acid and base and its volume (1 at the start, doubled with each glass of water) */
function bfPH(dr, n, V, D) {
  var b = n * D.DROP;
  if (dr === "a") { var c = (D.AA - b) / V, h = (c + Math.sqrt(c * c + 4 * D.KW)) / 2; return -Math.log(h) / Math.LN10; }
  var lo = 1, hi = 13;
  for (var i = 0; i < 60; i++) { var m = (lo + hi) / 2, x = Math.pow(10, -m), g = x + (D.NA0 + b) / V - D.CT / V * D.bfN(x, D) - D.KW / x; if (g > 0) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
function bfColor(p) {
  var S = [[4, [216, 87, 74]], [5, [232, 145, 58]], [6, [222, 190, 64]], [7, [90, 169, 95]]], i;
  if (p <= S[0][0]) return "rgb(" + S[0][1].join(",") + ")";
  for (i = 1; i < S.length; i++) if (p <= S[i][0]) { var u = (p - S[i - 1][0]) / (S[i][0] - S[i - 1][0]), a = S[i - 1][1], b = S[i][1]; return "rgb(" + [0, 1, 2].map(function (k) { return Math.round(a[k] + (b[k] - a[k]) * u); }).join(",") + ")"; }
  return "rgb(" + S[S.length - 1][1].join(",") + ")";
}
/* the two glasses, their probes and droppers */
function bfGlasses(st, D) {
  var f = function (n) { return Math.round(n * 10) / 10; }, o = "";
  function tx(x, y, t, cls, a) { return '<text class="bf-t' + (cls ? " " + cls : "") + '" x="' + f(x) + '" y="' + f(y) + '"' + (a ? ' text-anchor="' + a + '"' : "") + ">" + t + "</text>"; }
  [["a", 88], ["b", 252]].forEach(function (g) {
    var dr = g[0], x = g[1], s = st[dr], p = D.bfPH(dr, s.n, st.V, D), done = p >= 6.995;
    var top = 92, bot = 212, wt = 52, wb = 41, lv = { 1: 0.46, 2: 0.66, 4: 0.82, 8: 0.92 }[st.V] || 0.95, ly = bot - (bot - top) * lv;
    var xl = function (y) { return x - (wb + (wt - wb) * (bot - y) / (bot - top)); }, xr = function (y) { return 2 * x - xl(y); };
    /* the dropper, then the drop on its way */
    o += '<g class="hot" data-info="' + D.HOT.drop + '"><path class="bf-dropper" d="M' + f(x - 40) + " 22h14v32l-5 14h-4l-5-14Z" + '"/><rect class="bf-bulb" x="' + f(x - 42) + '" y="10" width="18" height="14" rx="6"/></g>';
    if (st.fall && st.fall[dr] != null && !done) { var fy = 72 + (ly - 72) * st.fall[dr]; o += '<circle class="bf-drop" cx="' + f(x - 33) + '" cy="' + f(fy) + '" r="3.4"/>'; }
    /* the liquid, its color by pH (red at 4, green at 7, like an indicator) */
    o += '<path class="bf-liq hot" data-info="' + D.HOT["liq" + dr] + '" style="fill:' + D.bfColor(p) + '" d="M' + f(xl(ly)) + " " + f(ly) + "L" + f(xr(ly)) + " " + f(ly) + "L" + f(xr(bot)) + " " + bot + "L" + f(xl(bot)) + " " + bot + 'Z"/>';
    /* the pH probe, its cable up to the meter */
    o += '<g class="hot" data-info="' + D.HOT.probe + '"><path class="bf-cable" d="M' + f(x + 24) + " 66C" + f(x + 24) + " 60 " + f(x + 32) + " 58 " + f(x + 36) + ' 56"/><path class="bf-probe" d="M' + f(x + 24) + " 64L" + f(x + 24) + " " + f(bot - 16) + '"/><circle class="bf-bulb2" cx="' + f(x + 24) + '" cy="' + f(bot - 13) + '" r="5"/>';
    o += '<rect class="bf-meter" x="' + f(x + 8) + '" y="18" width="66" height="38" rx="6"/>' + tx(x + 41, 32, "pH", "bf-cap", "middle") + tx(x + 41, 50, (Math.round(p * 10) / 10).toFixed(1), "bf-ph", "middle") + "</g>";
    o += '<path class="bf-glass" d="M' + f(xl(top - 6)) + " " + f(top - 6) + "L" + f(xl(bot)) + " " + bot + "L" + f(xr(bot)) + " " + bot + "L" + f(xr(top - 6)) + " " + f(top - 6) + '"/>';
    o += tx(x - 33, 81, "bicarbonate", "bf-cap", "middle");
    /* the name and how it's going */
    o += tx(x, 232, "Drink " + dr.toUpperCase() + (st.V > 1 ? ", volume ×" + st.V : ""), "bf-strong", "middle");
    var line = done ? "neutral after " + s.n + " drops" : s.n ? s.n + (s.n === 1 ? " drop" : " drops") + " so far" : "no bicarbonate yet";
    o += tx(x, 247, line, done ? "bf-ok" : "bf-cap", "middle");
  });
  return o;
}
/* pH against drops added, for both */
function bfChart(st, D) {
  var f = function (n) { return Math.round(n * 10) / 10; }, o = "", x0 = 44, x1 = 326, y0 = 176, y1 = 16, xm = 45, p0 = 3.5, p1 = 7.5;
  function X(n) { return x0 + (x1 - x0) * n / xm; } function Y(p) { return y0 - (y0 - y1) * (Math.min(p1, Math.max(p0, p)) - p0) / (p1 - p0); }
  function tx(x, y, t, cls, a) { return '<text class="bf-t' + (cls ? " " + cls : "") + '" x="' + f(x) + '" y="' + f(y) + '"' + (a ? ' text-anchor="' + a + '"' : "") + ">" + t + "</text>"; }
  [4, 5, 6, 7].forEach(function (p) { o += '<path class="' + (p === 7 ? "bf-neutral" : "bf-grid") + '" d="M' + x0 + " " + f(Y(p)) + "H" + x1 + '"/>' + tx(x0 - 6, Y(p) + 4, String(p), "bf-cap", "end"); });
  o += tx(x1, Y(7) - 6, "neutral", "bf-ok", "end");
  [0, 10, 20, 30, 40].forEach(function (n) { o += '<path class="bf-grid" d="M' + f(X(n)) + " " + y0 + "v4" + '"/>' + tx(X(n), y0 + 16, String(n), "bf-cap", "middle"); });
  o += '<path class="bf-axis" d="M' + x0 + " " + y1 + "V" + y0 + "H" + x1 + '"/>';
  o += tx(x0 - 6, y1 - 4, "pH", "bf-cap", "end") + tx((x0 + x1) / 2, y0 + 32, "bicarbonate added (drops)", "bf-cap", "middle");
  ["a", "b"].forEach(function (dr) {
    var h = st[dr].hist; if (!h.length) return;
    o += '<path class="bf-line bf-' + dr + '" d="M' + h.map(function (q) { return f(X(q[0])) + " " + f(Y(q[1])); }).join("L") + '"/>';
    var e = h[h.length - 1]; o += '<circle class="bf-dot bf-' + dr + '" cx="' + f(X(e[0])) + '" cy="' + f(Y(e[1])) + '" r="3.2"/>' + tx(X(e[0]) + 7, Y(e[1]) + (dr === "a" ? -6 : 14), dr.toUpperCase(), "bf-strong bf-" + dr + "t", "start");
  });
  return o;
}

const HOT = {
  drop: "Bicarbonate, a base: added a little at a time, the way buffering capacity is measured. It's also what saliva uses to neutralize what you drink.",
  probe: "A pH probe: how you measure pH. It reads how acidic the drink is right now, not how much acid it holds.",
  liqa: "Drink A starts at pH 4. Very little bicarbonate brings it to neutral: a low buffering capacity, and that's good.",
  liqb: "Drink B starts at the same pH 4 but takes much more bicarbonate: a high buffering capacity, and that's bad, like orange juice and wine. Citric acid also grabs calcium (a chelator).",
};
function bfState(D) { return { V: 1, a: { n: 0, hist: [[0, D.bfPH("a", 0, 1, D)]] }, b: { n: 0, hist: [[0, D.bfPH("b", 0, 1, D)]] }, fall: null, water: 0 }; }
const DATA = Object.assign({ GW, GH, CW, CH, HOT }, D0);
const ctx = Object.assign({ bfN, bfPH, bfColor }, DATA);
const ST0 = bfState(ctx);
const svgG = figureSvg({ width: GW, height: GH, className: "bf-svg bf-glasses", label: "Two drinks, both at pH 4, each with a pH probe in it and a dropper of bicarbonate above it.", body: bfGlasses(ST0, ctx) });
const svgC = figureSvg({ width: CW, height: CH, className: "bf-svg bf-chart", label: "A chart of each drink's pH against the drops of bicarbonate added, with neutral (pH 7) marked.", body: bfChart(ST0, ctx) });
const plate = plateHtml({ fig: "Fig 25", title: "pH vs buffering capacity", hint: "add bicarbonate", readout: "both pH 4.0", body: `<div class="am-svg bf-box">${svgG}${svgC}</div>` });
const controls = `<div class="am-controls"><button type="button" class="am-btn" data-bfadd="1">Add a drop of bicarbonate</button><button type="button" class="am-btn" data-bfadd="5">Add 5 drops</button><button type="button" class="am-btn" data-bfwater>Add water (double it)</button><button type="button" class="am-btn" data-bfreset>Start over</button></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Hover or tap a drink, a probe or the bicarbonate.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From the L9 notes (Dr. Lawson's prerecorded lecture): buffering capacity is how much bicarbonate, and so how much saliva, it takes to neutralize a drink; a drink at pH 4 that takes a lot has a high buffering capacity (bad), one that takes a little a low one (good); pH is measured with a probe, buffering capacity by adding bicarbonate a little at a time until the pH is back to neutral; measured this way, orange juice and wine are "way, way bad"; citric acid is a chelator; pH is a log scale, so doubling an acid with water doesn't meaningfully change its pH ("a swimming pool of water"), and a base such as bicarbonate is what neutralizes it.</li>
<li>Outside sources: the dental erosion literature measures a drink's buffering capacity as its titratable acidity, the base needed to bring it to a set pH, and finds it predicts erosion better than pH alone (Lussi, Jaeggi and Zero, Caries Res 2004;38 Suppl 1:34-44). Drink B is a citric acid buffer computed from citric acid's three pKa values (3.13, 4.76, 6.40, CRC Handbook of Chemistry and Physics); drink A is an unbuffered strong acid. Diluting an unbuffered acid twofold raises its pH by about 0.3 (log 2), so getting from 4 to 7 would take about a thousandfold dilution.</li>
<li>Schematic: the two drinks are made up (both at pH 4, his example), not measured beverages, and a "drop" is an arbitrary unit sized so A needs 5 and B 40. Bicarbonate is modeled as a plain base: the carbon dioxide it releases is ignored. The liquid's color follows its pH like an indicator, as a cue; real drinks don't change color. Educational, not clinical guidance.</li></ul></details>`;

function bfLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var gl = root.querySelector(".bf-glasses"), ch = root.querySelector(".bf-chart"), sum = root.querySelector(".am-summary"), info = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]");
  var st = D.bfState(D), raf = 0, busy = false;
  var adds = root.querySelectorAll("[data-bfadd]"), water = root.querySelector("[data-bfwater]"), reset = root.querySelector("[data-bfreset]");
  function ph(dr) { return D.bfPH(dr, st[dr].n, st.V, D); }
  function one(v) { return (Math.round(v * 10) / 10).toFixed(1); }
  function draw() { gl.innerHTML = D.bfGlasses(st, D); ch.innerHTML = D.bfChart(st, D); }
  function text() {
    var pa = ph("a"), pb = ph("b"), da = pa >= 6.995, db = pb >= 6.995, s;
    if (st.water && !st.a.n && !st.b.n) s = "Water alone: the volume is ×" + st.V + " and A has only moved to pH " + one(pa) + ", B to " + one(pb) + ". pH is a log scale, so each doubling moves an acid at most about 0.3; to get from 4 to 7 you'd need about a thousand times the water (a swimming pool). Now add bicarbonate: it still takes the same amount, because the water took no acid away. A base works.";
    else if (!st.a.n && !st.b.n) s = "Both drinks start at pH 4, measured with a pH probe. Add bicarbonate a little at a time, the way buffering capacity is measured, and count how much each takes to get back to neutral (pH 7).";
    else if (!da) s = "Drink A is at pH " + one(pa) + " and drink B at " + one(pb) + " after the same bicarbonate. Keep going: which one reaches neutral first?";
    else if (!db) s = "Drink A reached neutral after " + st.a.n + " drops: a low buffering capacity, and that's good, because your saliva can neutralize it quickly. Drink B started at the same pH 4 and is only at " + one(pb) + ". Keep adding.";
    else s = "Drink B took " + st.b.n + " drops, " + Math.round(st.b.n / st.a.n) + " times as many as A, though both started at pH 4: a high buffering capacity, and that's bad. pH and buffering capacity sound alike but aren't the same thing. Measured this way, orange juice and wine are much worse than their pH alone suggests, and citric acid also grabs calcium.";
    sum.textContent = s;
    if (readout) readout.textContent = (da ? "A " + st.a.n + " drops" : "A pH " + one(pa)) + " · " + (db ? "B " + st.b.n + " drops" : "B pH " + one(pb));
    adds.forEach(function (b) { b.disabled = da && db; });
  }
  /* add k drops to each drink that isn't neutral yet, one at a time */
  function add(k) {
    if (busy) return;
    var left = k;
    function drop() {
      ["a", "b"].forEach(function (dr) { if (ph(dr) < 6.995) { st[dr].n++; st[dr].hist.push([st[dr].n, ph(dr)]); } });
      left--; draw(); text();
      if (left > 0 && (ph("a") < 6.995 || ph("b") < 6.995)) next(); else busy = false;
    }
    function next() {
      if (reduce.matches) { drop(); return; }
      busy = true; var t0 = performance.now();
      function step(now) { var u = Math.min(1, (now - t0) / (k > 1 ? 160 : 360)); st.fall = { a: u, b: u }; gl.innerHTML = D.bfGlasses(st, D); if (u < 1) raf = requestAnimationFrame(step); else { st.fall = null; drop(); } }
      raf = requestAnimationFrame(step);
    }
    next();
  }
  adds.forEach(function (b) { b.addEventListener("click", function () { add(+b.getAttribute("data-bfadd")); }); });
  water.addEventListener("click", function () {
    if (busy || st.V >= 8) return;
    st.V *= 2; st.water++; ["a", "b"].forEach(function (dr) { st[dr].hist.push([st[dr].n, ph(dr)]); });
    water.disabled = st.V >= 8; draw(); text();
  });
  reset.addEventListener("click", function () { cancelAnimationFrame(raf); busy = false; st = D.bfState(D); water.disabled = false; draw(); text(); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && root.contains(el)) info.textContent = el.getAttribute("data-info"); }
  [gl, ch].forEach(function (s) { s.addEventListener("pointerover", hot); s.addEventListener("click", hot); });
  draw(); text();
}

const CSS = `
.anima .bf-box{max-width:700px;margin:0 auto;display:flex;flex-wrap:wrap;justify-content:center;align-items:flex-end;gap:6px 18px}
.anima .am-svg.bf-box svg{flex:1 1 280px;width:auto;max-width:380px}
.anima .bf-svg .bf-t{fill:var(--anatomy-text);font:12px var(--anatomy-mono);paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round}
.anima .bf-svg .bf-strong{fill:var(--anatomy-strong);font-weight:700}
.anima .bf-svg .bf-cap{fill:var(--anatomy-muted);font-size:11px}
.anima .bf-svg .bf-ok{fill:#2f8a5b;font-weight:700;font-size:11.5px}
.anima .bf-svg .bf-ph{fill:var(--anatomy-strong);font:700 16px var(--anatomy-mono);stroke:none}
.anima .bf-svg .bf-meter{fill:var(--anatomy-face);stroke:var(--anatomy-hi);stroke-width:1.2}
.anima .bf-svg .bf-glass{fill:none;stroke:var(--anatomy-hi);stroke-width:2;stroke-linejoin:round}
.anima .bf-svg .bf-liq{fill-opacity:.8;stroke:none;transition:fill .35s ease}
.anima .bf-svg .bf-probe{fill:none;stroke:var(--anatomy-mid);stroke-width:4;stroke-linecap:round}
.anima .bf-svg .bf-bulb2{fill:var(--anatomy-face);stroke:var(--anatomy-hi);stroke-width:1.2}
.anima .bf-svg .bf-cable{fill:none;stroke:var(--anatomy-hi);stroke-width:1.4}
.anima .bf-svg .bf-dropper{fill:var(--anatomy-face);stroke:var(--anatomy-hi);stroke-width:1.2;stroke-linejoin:round}
.anima .bf-svg .bf-bulb{fill:var(--anatomy-mid);stroke:var(--anatomy-hi);stroke-width:1}
.anima .bf-svg .bf-drop{fill:#7fb6e6;stroke:var(--anatomy-hi);stroke-width:.8}
.anima .bf-svg .bf-grid{fill:none;stroke:var(--anatomy-faint);stroke-width:1}
.anima .bf-svg .bf-neutral{fill:none;stroke:#2f8a5b;stroke-width:1.4;stroke-dasharray:5 4}
.anima .bf-svg .bf-axis{fill:none;stroke:var(--anatomy-mid);stroke-width:1.2}
.anima .bf-svg .bf-line{fill:none;stroke-width:2.6;stroke-linejoin:round;stroke-linecap:round}
.anima .bf-svg .bf-line.bf-a,.anima .bf-svg .bf-dot.bf-a{stroke:var(--accent)}.anima .bf-svg .bf-dot.bf-a{fill:var(--accent)}
.anima .bf-svg .bf-line.bf-b,.anima .bf-svg .bf-dot.bf-b{stroke:var(--tag-rose)}.anima .bf-svg .bf-dot.bf-b{fill:var(--tag-rose)}
.anima .bf-svg .bf-at{fill:var(--accent)}.anima .bf-svg .bf-bt{fill:var(--tag-rose)}
.anima .am-btn:disabled{opacity:.45;cursor:default}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]) .anima .bf-svg .bf-ok{fill:#6fcf97} :root:not([data-theme="light"]) .anima .bf-svg .bf-neutral{stroke:#6fcf97} }
:root[data-theme="dark"] .anima .bf-svg .bf-ok{fill:#6fcf97}
:root[data-theme="dark"] .anima .bf-svg .bf-neutral{stroke:#6fcf97}
@media (prefers-reduced-motion: reduce){.anima .bf-svg .bf-liq{transition:none}}
`;

export function buffer() {
  return {
    id: "buffer", lec: "nccl",
    title: "pH vs buffering capacity",
    caption: "Two drinks at the same pH, 4. Add bicarbonate a drop at a time and count how much each takes to reach neutral; then try diluting one with water.",
    html: `<div class="anima" data-anima="buffer">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: bfLive.toString(),
    helpers: [bfN, bfPH, bfColor, bfGlasses, bfChart, bfState],
    data: DATA,
  };
}
