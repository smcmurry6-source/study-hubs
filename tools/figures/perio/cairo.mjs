// Fig: the Cairo recession types, RT1, RT2, RT3 (Periodontology S9, Dr. Abou-Arraj's recorded lecture + slides).
// A facial view of a maxillary canine with 4 mm of facial recession and its two neighbors, drawn to one scale
// (14 px = 1 mm). The buccal attachment loss is the same in all three: the margin 4 mm apical to the facial CEJ and a
// 1 mm sulcus, so the buccal CAL is 5 mm. What changes is the interproximal attachment, read from the interproximal
// CEJ, which in a facial view sits where the CEJ line meets the tooth's outline, about 2.5 mm coronal to the facial
// CEJ on a canine:
//   RT1: no interproximal attachment loss; the papillae fill the embrasures and hide the interproximal CEJ
//        (interproximal CAL 0); about 100% root coverage is achievable;
//   RT2: interproximal CAL 4.5 mm, less than or equal to the buccal 5 mm; the interproximal CEJ shows; partial
//        coverage, at best up to the level of the interproximal attachment (here 2 of the 4 mm, about 50%);
//   RT3: interproximal CAL 7 mm, more than the buccal 5 mm; no root coverage is expected.
// The toggle draws the most a graft can cover: the CEJ in RT1, the level of the interproximal attachment in RT2, none
// in RT3. The numbers are illustrative, chosen to fit the lecture's "about 50 to 60%" for RT2.
import { figureSvg, plateHtml, callout } from "./shared.mjs";

const S = 14, W = 440, H = 384, CX = 220, PY = 206;

function caCR(p, n) {
  var o = [], N = p.length;
  for (var i = 0; i < N - 1; i++) {
    var a = p[i - 1] || p[i], b = p[i], c = p[i + 1], d = p[i + 2] || p[i + 1];
    for (var k = 0; k < n; k++) { var t = k / n, t2 = t * t, t3 = t2 * t;
      o.push([.5 * (2 * b[0] + (c[0] - a[0]) * t + (2 * a[0] - 5 * b[0] + 4 * c[0] - d[0]) * t2 + (3 * b[0] - a[0] - 3 * c[0] + d[0]) * t3),
              .5 * (2 * b[1] + (c[1] - a[1]) * t + (2 * a[1] - 5 * b[1] + 4 * c[1] - d[1]) * t2 + (3 * b[1] - a[1] - 3 * c[1] + d[1]) * t3)]); }
  }
  o.push(p[N - 1]); return o;
}
/* mm points (x from the canine's axis, y down from its facial CEJ) to a path in px */
function caD(D, p, close) {
  var o = "";
  for (var i = 0; i < p.length; i++) o += (i ? "L" : "M") + Math.round((D.CX + p[i][0] * D.S) * 10) / 10 + " " + Math.round((D.PY + p[i][1] * D.S) * 10) / 10;
  return o + (close ? "Z" : "");
}
/* the gingival margin across the three teeth: a scalloped arc on each tooth's facial, meeting at the papilla tips */
function caMargin(v, D) {
  var pts = [], T = D.TEETH;
  function arc(c, hw, m, pl, pr, e) { for (var k = 0; k <= 16; k++) { var u = -1 + k / 8, p = u < 0 ? pl : pr, w = Math.pow(Math.max(0, 1 - u * u), e || .95); pts.push([c + u * hw, p + (m - p) * w]); } }
  arc(T[3].c, T[3].kw, -1.1, -4.8, -4.9);
  arc(T[0].c, T[0].kw, -1.1, -4.9, v.pap); arc(0, 3.8, v.marg, v.pap, v.pap, .6); arc(T[2].c, T[2].kw, -1.1, v.pap, -4.6);
  arc(T[4].c, T[4].kw, -1.1, -4.6, -4.8);
  return pts;
}
function caDyn(v, D) {
  var o = "", f = function (n) { return Math.round(n * 10) / 10; }, X = function (mm) { return f(D.CX + mm * D.S); }, Y = function (mm) { return f(D.PY + mm * D.S); };
  var mg = caMargin(v, D), mgj = D.MGJ;
  /* gingiva (margin to the MGJ) and alveolar mucosa (MGJ down) */
  var gum = mg.concat(mgj.slice().reverse());
  o += '<g class="hot" data-info="' + D.HOT.gum + '"><path class="ca-gum" d="' + caD(D, gum, true) + '"/></g>';
  o += '<g class="hot" data-info="' + D.HOT.muc + '"><path class="ca-muc" d="' + caD(D, mgj.concat([[16.5, 13.5], [-16.5, 13.5]]), true) + '"/></g>';
  o += '<path class="ca-mgj" d="' + caD(D, mgj, false) + '"/><path class="ca-edge" d="' + caD(D, mg, false) + '"/>';
  /* the canine's facial sulcus: its base, 1 mm under the margin (the buccal attachment) */
  o += '<path class="ca-att" d="M' + X(-.9) + " " + Y(v.marg + 1) + "H" + X(.9) + '"/>';
  /* interproximal attachment, mesial and distal, under the papillae */
  [-1, 1].forEach(function (s) { var x = s * 3.55; o += '<g class="hot" data-info="' + D.HOT.iatt + '"><path class="ca-att ca-iatt" d="M' + X(x - .55) + " " + Y(v.iatt) + "H" + X(x + .55) + '"/></g>'; });
  /* the most a graft can cover */
  if (v.cov > .02) {
    var c = [], lvl = v.covY;
    if (v.covRT1 > .5) for (var k = 0; k <= 16; k++) { var u = -1 + k / 8; c.push([u * 2.78, -2.5 * u * u]); }
    else for (var k2 = 0; k2 <= 16; k2++) { var u2 = -1 + k2 / 8; c.push([u2 * 2.9, v.pap + (lvl - v.pap) * Math.pow(Math.max(0, 1 - u2 * u2), .55)]); }
    o += '<g class="hot" data-info="' + D.HOT.cov + '" opacity="' + f(v.cov) + '"><path class="ca-cov" d="' + caD(D, c, false) + '"/></g>';
  }
  /* the dimension brackets: buccal CAL on the right, interproximal CAL (mesial) on the left */
  var bx = 13.4, ax = -13.4;
  o += '<path class="ca-guide" d="M' + X(.9) + " " + Y(0) + "H" + X(bx) + "M" + X(.9) + " " + Y(v.marg + 1) + "H" + X(bx) + '"/>';
  o += '<path class="ca-brk" d="M' + X(bx) + " " + Y(0) + "V" + Y(v.marg + 1) + "M" + X(bx - .3) + " " + Y(0) + "H" + X(bx + .3) + "M" + X(bx - .3) + " " + Y(v.marg + 1) + "H" + X(bx + .3) + '"/>';
  o += '<text class="ca-t ca-num" x="' + X(bx - .5) + '" y="' + Y((v.marg + 1) / 2 + .1) + '" text-anchor="end">buccal</text><text class="ca-t ca-num" x="' + X(bx - .5) + '" y="' + f(D.PY + ((v.marg + 1) / 2 + .1) * D.S + 14) + '" text-anchor="end">CAL ' + Math.round(v.marg + 1) + '</text>';
  var ic = Math.round((v.iatt + 2.5) * 2) / 2;
  o += '<path class="ca-guide" d="M' + X(-3.6) + " " + Y(-2.5) + "H" + X(ax) + (ic > .2 ? "M" + X(-3.6) + " " + Y(v.iatt) + "H" + X(ax) : "") + '"/>';
  if (ic > .2) o += '<path class="ca-brk ca-brk-i" d="M' + X(ax) + " " + Y(-2.5) + "V" + Y(v.iatt) + "M" + X(ax - .3) + " " + Y(-2.5) + "H" + X(ax + .3) + "M" + X(ax - .3) + " " + Y(v.iatt) + "H" + X(ax + .3) + '"/>';
  var iy = ic > .2 ? (-2.5 + v.iatt) / 2 + .1 : -2.1;
  o += '<text class="ca-t ca-num ca-num-i" x="' + X(ax + .5) + '" y="' + Y(iy) + '">interprox.</text><text class="ca-t ca-num ca-num-i" x="' + X(ax + .5) + '" y="' + f(D.PY + iy * D.S + 14) + '">CAL ' + (ic > .2 ? (ic % 1 ? ic.toFixed(1) : ic) : 0) + '</text>';
  /* the interproximal CEJ: hidden under the papilla in RT1, visible in RT2 and RT3 */
  var seen = v.pap > -2.3;
  [-1, 1].forEach(function (s) { o += '<g class="hot" data-info="' + D.HOT.icej + '"><circle class="ca-icej' + (seen ? "" : " is-hid") + '" cx="' + X(s * 2.82) + '" cy="' + Y(-2.5) + '" r="3.2"/></g>'; });
  return o;
}

/* a tooth in facial view: crown outline from its cervical (at the CEJ height on the proximal) up to the incisal, and its root */
function toothPts(c, t) {
  var L = -1, R = 1, cw = t.cw, kw = t.kw, pts = [];
  pts.push([c + L * cw, -2.5], [c + L * (cw + (kw - cw) * .55), -4.4], [c + L * kw, t.kyL]);
  t.inc.forEach(function (p) { pts.push([c + p[0], p[1]]); });
  pts.push([c + R * kw, t.kyR], [c + R * (cw + (kw - cw) * .55), -4.2], [c + R * cw, -2.5]);
  return pts;
}
function rootPts(c, t) { var cw = t.cw; return [[c - cw, -2.5], [c - cw + .05, 0], [c - cw + .35, 4], [c - cw + .75, 8], [c - cw + 1.1, 12], [c - cw + 1.3, 14], [c + cw - 1.3, 14], [c + cw - 1.1, 12], [c + cw - .75, 8], [c + cw - .35, 4], [c + cw - .05, 0], [c + cw, -2.5]]; }

const TEETH = [
  { name: "lateral incisor", c: -7.2, cw: 2.5, kw: 3.4, kyL: -6.4, kyR: -7.0, inc: [[-3.3, -8.4], [-2.6, -9.3], [-1.2, -9.7], [.6, -9.75], [2.2, -9.45], [3.2, -8.6]] },
  { name: "canine", c: 0, cw: 2.8, kw: 3.8, kyL: -7.0, kyR: -5.6, inc: [[-3.7, -8.0], [-2.7, -8.75], [-1.3, -9.55], [0, -10.4], [1.4, -9.65], [2.9, -8.85], [3.8, -7.3]] },
  { name: "first premolar", c: 7.2, cw: 2.5, kw: 3.4, kyL: -5.6, kyR: -6.2, inc: [[-3.3, -7.5], [-2.3, -8.3], [-1.0, -9.0], [0, -9.25], [1.1, -9.0], [2.4, -8.3], [3.3, -7.3]] },
  { name: "central incisor", c: -14.6, cw: 3.2, kw: 4.0, kyL: -8.0, kyR: -7.4, inc: [[-4.0, -9.6], [-3.2, -10.5], [-1.2, -10.8], [1.2, -10.8], [3.3, -10.4], [4.0, -9.4]] },
  { name: "second premolar", c: 13.8, cw: 2.4, kw: 3.2, kyL: -6.2, kyR: -6.0, inc: [[-3.1, -7.4], [-2.1, -8.2], [-.9, -8.8], [0, -9.0], [1.0, -8.8], [2.2, -8.1], [3.1, -7.2]] },
];

function staticTeeth(D) {
  let o = "";
  TEETH.forEach((t, i) => {
    const crown = caCR(toothPts(t.c, t), 4), root = caCR(rootPts(t.c, t), 4);
    const cej = []; for (let k = 0; k <= 16; k++) { const u = -1 + k / 8; cej.push([t.c + u * (t.cw - .02), -2.5 + 2.5 * (1 - u * u)]); }
    const info = i === 1 ? D.HOT.root : D.HOT.nb;
    o += `<g class="hot" data-info="${info}"><path class="ca-root" d="${caD(D, root, true)}"/></g>`;
    o += `<g class="hot" data-info="${i === 1 ? D.HOT.crown : D.HOT.nb}"><path class="ca-crown" d="${caD(D, crown, false)}L${(D.CX + (t.c + t.cw) * D.S).toFixed(1)} ${(D.PY - 2.5 * D.S).toFixed(1)}${caD(D, cej.slice().reverse(), false).replace(/^M/, "L")}Z"/></g>`;
    o += `<g class="hot" data-info="${D.HOT.cej}"><path class="ca-cej" d="${caD(D, cej, false)}"/></g>`;
  });
  return o;
}

const D = {
  W, H, S, CX, PY, TEETH,
  SC: {
    rt1: { pap: -6.0, iatt: -2.5, marg: 4, cov: 1, covY: 0, covRT1: 1, name: "RT1 · about 100%",
      text: "RT1: recession with no loss of interproximal attachment. The papillae still fill the embrasures and the interproximal CEJ can't be detected on the mesial or the distal. The best prognosis: about 100% root coverage is achievable, all the way to the CEJ." },
    rt2: { pap: 0, iatt: 2, marg: 4, cov: 1, covY: 2, covRT1: 0, name: "RT2 · partial",
      text: "RT2: interproximal attachment is lost, but the interproximal CAL (4.5 mm here) is less than or equal to the buccal CAL (5 mm). You can see the CEJ interproximally. Expect partial coverage, at best up to the level of the interproximal attachment (here 2 of the 4 mm, about 50%): there is no framework and no blood supply interproximally to hold tissue any higher." },
    rt3: { pap: 2.5, iatt: 4.5, marg: 4, cov: 0, covY: 4, covRT1: 0, name: "RT3 · no coverage",
      text: "RT3: the interproximal CAL (7 mm here) is greater than the buccal CAL (5 mm). A graft for root coverage “would not end up achieving that root coverage at all,” so it isn't encouraged. The classification is how you decide when to propose a soft tissue graft for root coverage, and when not to." },
  },
  STAT: { rt1: ["5 mm", "0 (CEJ hidden)", "about 100%"], rt2: ["5 mm", "4.5 mm, ≤ buccal", "partial, about 50% here"], rt3: ["5 mm", "7 mm, > buccal", "none"] },
  HOT: {
    crown: "The canine's crown. Canines are among the teeth commonly affected by recession, with maxillary molars and mandibular central incisors.",
    root: "The exposed root, between the CEJ and the gingival margin. Recession is measured with the probe from the margin to the CEJ, at the same six sites as probing depth: 4 mm here at the mid-facial.",
    nb: "A neighboring tooth with no recession. Its papilla is shared with the canine, so interproximal attachment loss shows on both.",
    cej: "The CEJ. On the facial it dips apically; toward the proximal surfaces it curves coronally, so the interproximal CEJ sits higher than the facial one.",
    icej: "The interproximal CEJ. In RT1 it can't be detected clinically on the mesial or the distal; in RT2 and RT3 you can see it, because interproximal attachment has been lost.",
    iatt: "The interproximal attachment level, the depth of the interproximal sulcus or pocket. Interproximal CAL runs from the interproximal CEJ to here.",
    gum: "Keratinized gingiva, from the gingival margin to the MGJ. Over the canine the margin is 4 mm apical to the CEJ, with a 1 mm sulcus: buccal CAL 5 mm.",
    muc: "Alveolar mucosa, apical to the MGJ: loose, mobile and redder than the gingiva.",
    cov: "The most a graft can cover: the CEJ in RT1, the level of the interproximal attachment in RT2. Drawn as a picture of the rule, not a prediction for one patient.",
  },
};
D.MGJ = caCR([[-16.5, 7.4], [-11, 7.0], [-7.2, 7.8], [-3.6, 7.2], [0, 7.9], [3.6, 7.3], [7.2, 7.9], [11, 7.1], [16.5, 7.5]], 6);
D.TEETH_SVG = staticTeeth(D);

const START = { pap: D.SC.rt1.pap, iatt: D.SC.rt1.iatt, marg: 4, cov: 0, covY: 0, covRT1: 1 };
const scale = `<path class="ca-scale" d="M16 ${H - 14}h${5 * S}M16 ${H - 18}v8M${16 + 5 * S} ${H - 18}v8"/><text class="ca-t ca-small" x="${16 + 2.5 * S}" y="${H - 21}" text-anchor="middle">5 mm</text>`;
const labels = (() => {
  const X = (mm) => CX + mm * S, Y = (mm) => PY + mm * S;
  return callout([X(-1.4), Y(-.63)], "CEJ", [X(-9.6), Y(-12.6)], "start", "ca-onmouth") + callout([X(.3), Y(2.6)], "exposed root", [X(5.4), Y(-12.6)], "start", "ca-onmouth")
    + callout([X(-9.5), Y(4.4)], "gingiva", [X(-15.6), Y(9.6)], "start", "ca-ongum") + callout([X(9.2), Y(10.2)], "alveolar mucosa", [X(15.6), Y(11.6)], "end", "ca-onmuc");
})();
const svg = figureSvg({ width: W, height: H, className: "ca-svg", label: "A facial view of a maxillary canine with 4 mm of facial recession and its two neighbors. Brackets give the buccal CAL on the right and the interproximal CAL on the left; the papillae and the interproximal CEJ change with the recession type.",
  body: `<rect class="ca-mouth" x="0" y="0" width="${W}" height="${H}"/><g class="ca-teeth">${D.TEETH_SVG}</g><g class="ca-dyn">${caDyn(START, D)}</g>${labels}${scale}` });
const plate = plateHtml({ fig: "S9 · Fig 1", title: "Cairo RT1, RT2, RT3", hint: "pick a type · tap a part", readout: D.SC.rt1.name, body: `<div class="am-svg ca-box">${svg}</div>` });
const controls = `<div class="am-controls" role="group" aria-label="Recession type"><button type="button" class="am-btn" data-cat="rt1" aria-pressed="true">RT1</button><button type="button" class="am-btn" data-cat="rt2" aria-pressed="false">RT2</button><button type="button" class="am-btn" data-cat="rt3" aria-pressed="false">RT3</button><button type="button" class="am-btn" data-cacov aria-pressed="false">Show what a graft can cover</button></div>
<div class="am-stats ca-stats"><span>Buccal CAL <b data-ca="0"></b></span><span>Interproximal CAL <b data-ca="1"></b></span><span>Root coverage <b data-ca="2"></b></span></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Tap the root, the CEJ, the papilla, the gingiva or a dashed attachment mark.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From Dr. Abou-Arraj's recorded lecture and slides: the three types, read from the interproximal CAL against the buccal CAL, and what each lets a graft achieve (about 100%, partial, none).</li>
<li>Outside sources: the definitions are Cairo and colleagues' (J Clin Periodontol 2011;38:661-6), who measured interproximal CAL from the interproximal CEJ to the depth of the interproximal pocket. That the most coronal coverage follows the interproximal attachment is Zucchelli and colleagues' (J Periodontol 2010;81:1019-26). The canine's shape, its 10 mm crown and the CEJ's curve of about 2.5 mm toward the proximal surfaces follow Wheeler's Dental Anatomy (Nelson, 11th ed.).</li>
<li>Drawn to one scale (the 5 mm bar). One tooth with a symmetric CEJ curve; the depths are illustrative, chosen so RT2 gets about 50%, inside the lecture's 50 to 60%. Educational, not medical advice.</li></ul></details>`;

function caLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var svg = root.querySelector(".ca-svg"), dyn = svg.querySelector(".ca-dyn"), sum = root.querySelector(".am-summary"), info = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]"), covBtn = root.querySelector("[data-cacov]");
  var N = ["pap", "iatt", "marg", "cov", "covY", "covRT1"], key = "rt1", showCov = false, v = {}, frame = 0, last = 0;
  N.forEach(function (n) { v[n] = D.SC.rt1[n]; }); v.cov = 0;
  function target(n) { return n === "cov" ? (showCov ? D.SC[key].cov : 0) : D.SC[key][n]; }
  function draw() { dyn.innerHTML = D.caDyn(v, D); }
  function loop(now) { var k = 1 - Math.exp(-Math.max(0, now - (last || now)) / 220); last = now; var done = true;
    N.forEach(function (n) { var t = target(n); if (n === "covRT1") { v[n] = t; return; } v[n] += (t - v[n]) * k; if (Math.abs(t - v[n]) > .005) done = false; });
    draw(); frame = done ? 0 : requestAnimationFrame(loop); }
  function kick() { if (reduce.matches) { N.forEach(function (n) { v[n] = target(n); }); draw(); return; } last = 0; if (!frame) frame = requestAnimationFrame(loop); }
  function set(k) { key = k; sum.textContent = D.SC[k].text; if (readout) readout.textContent = D.SC[k].name;
    D.STAT[k].forEach(function (s, i) { var el = root.querySelector('[data-ca="' + i + '"]'); if (el) el.textContent = s; });
    root.querySelectorAll("[data-cat]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-cat") === k)); }); kick(); }
  root.querySelectorAll("[data-cat]").forEach(function (b) { b.addEventListener("click", function () { set(b.getAttribute("data-cat")); }); });
  covBtn.addEventListener("click", function () { showCov = !showCov; covBtn.setAttribute("aria-pressed", String(showCov)); kick(); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && svg.contains(el)) info.textContent = el.getAttribute("data-info"); }
  svg.addEventListener("pointerover", hot); svg.addEventListener("click", hot);
  set("rt1");
}

const CSS = `
.anima .ca-box{max-width:540px;margin:0 auto}
.anima[data-anima="cairo"]{--ca-mouth:#3a242c;--ca-enamel:#fbf8f2;--ca-enamel-line:#a99f8c;--ca-root:#dcc6a1;--ca-root-line:#a8916a}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]) .anima[data-anima="cairo"]{--ca-mouth:#120b0e;--ca-enamel:#e4ddd0;--ca-enamel-line:#8f8676;--ca-root:#b9a27c;--ca-root-line:#8a7552} }
:root[data-theme="dark"] .anima[data-anima="cairo"]{--ca-mouth:#120b0e;--ca-enamel:#e4ddd0;--ca-enamel-line:#8f8676;--ca-root:#b9a27c;--ca-root-line:#8a7552}
.anima .ca-svg .ca-mouth{fill:var(--ca-mouth)}
.anima .ca-svg .ca-crown{fill:var(--ca-enamel);stroke:var(--ca-enamel-line);stroke-width:1.1;stroke-linejoin:round}
.anima .ca-svg .ca-root{fill:var(--ca-root);stroke:var(--ca-root-line);stroke-width:1}
.anima .ca-svg .ca-cej{fill:none;stroke:var(--ca-root-line);stroke-width:1.4}
.anima .ca-svg .ca-gum{fill:var(--pd-gum);stroke:none}
.anima .ca-svg .ca-muc{fill:color-mix(in srgb, var(--pd-red) 55%, var(--pd-gum))}
.anima .ca-svg .ca-edge{fill:none;stroke:var(--pd-gum-line);stroke-width:1.3;stroke-linejoin:round}
.anima .ca-svg .ca-mgj{fill:none;stroke:var(--pd-gum-line);stroke-width:1;stroke-dasharray:4 3}
.anima .ca-svg .ca-att{stroke:var(--anatomy-strong);stroke-width:2.2;stroke-linecap:round;stroke-dasharray:3 2;fill:none}
.anima .ca-svg .ca-iatt{stroke:var(--pd-drug)}
.anima .ca-svg .ca-icej{fill:var(--pd-drug);stroke:var(--surface);stroke-width:1.2}
.anima .ca-svg .ca-icej.is-hid{fill:var(--surface);stroke:var(--pd-drug);stroke-dasharray:2 2}
.anima .ca-svg .ca-cov{fill:none;stroke:var(--pd-bug);stroke-width:3;stroke-dasharray:6 4;stroke-linecap:round}
.anima .ca-svg .ca-guide{fill:none;stroke:var(--anatomy-mid);stroke-width:.8;stroke-dasharray:2 3}
.anima .ca-svg .ca-brk{fill:none;stroke:var(--anatomy-strong);stroke-width:1.3}
.anima .ca-svg .ca-brk-i{stroke:var(--pd-drug)}
.anima .ca-svg .ca-t{fill:var(--anatomy-text);font:11px var(--anatomy-mono)}
.anima .ca-svg .ca-num{font-weight:700;fill:var(--anatomy-strong);paint-order:stroke;stroke:var(--surface);stroke-width:3px}
.anima .ca-svg .ca-num-i{fill:var(--pd-drug)}
.anima .ca-svg .ca-small{font-size:10.5px;fill:var(--anatomy-muted)}
.anima .ca-svg .ca-scale{fill:none;stroke:var(--anatomy-mid);stroke-width:1.2}
.anima .ca-svg .am-label{paint-order:stroke;stroke:var(--surface);stroke-width:3px}
.anima .ca-svg .am-label.ca-onmouth{fill:var(--ca-enamel);stroke:var(--ca-mouth)}
.anima .ca-svg .am-label.ca-ongum{stroke:var(--pd-gum)}
.anima .ca-svg .am-label.ca-onmuc{stroke:color-mix(in srgb, var(--pd-red) 55%, var(--pd-gum))}
`;

export function cairo() {
  return { id: "cairo", lec: "perio-plastic-esthetics", title: "The Cairo recession types",
    caption: "One canine with the same 4 mm of facial recession, three ways: what decides RT1, RT2 or RT3 is the interproximal attachment, and it decides how much root a graft can cover.",
    html: `<div class="anima" data-anima="cairo">${plate}${controls}${SOURCES}</div>`, css: CSS, live: caLive.toString(), helpers: [caCR, caD, caMargin, caDyn], data: D };
}
