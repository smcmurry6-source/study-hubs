// Fig: making thyroid hormone in seven steps (Heme & Endo Exam 1, L4 Thyroid Physiology, with L8's drugs). A
// schematic section through the wall of a follicle: the colloid on top, one follicular cell (apical membrane with
// pendrin, thyroperoxidase and megalin; basolateral membrane with NIS) between two neighbors, and a capillary below.
// Step through the seven steps as the L4 notes give them; a selector shows where methimazole/PTU and an iodide load
// act (L4 Wolff-Chaikoff, L8 iodides), and what low iodide does. The 10/27-posted recording of L4 added sodium riding in
// with iodide, the TSH receptor's NADPH -> H2O2 supply for thyroperoxidase, and the deiodinases in the tissues.
// Numbers are only the notes' own (20-50x, about 90% T4 / 10% T3). Schematic.
import { figureSvg, plateHtml } from "./shared.mjs";

const W = 640, H = 430;
const D = {
  W, H, AP: 128, BL: 330, X0: 176, X1: 464,
  NIS: [232, 330], TSHR: 200, PEN: [250, 128], TPO: [322, 128], TGX: [392, 128], MEG: [432, 128], NUC: [300, 272], LYS: [392, 236],
  STEPS: [
    "Ready: the wall of a follicle. Follicular cells line the colloid; thyroid hormone is the only endocrine hormone made outside the cell, in the colloid. TSH reaches the basolateral side (a Gs receptor) and speeds every step. Step through.",
    "1. Iodide trapping: the sodium-iodide symporter (NIS) on the basolateral membrane carries sodium and iodide in together. Sodium runs down its gradient and drags iodide in against its own, concentrating it 20 to 50 times above plasma (the slides; \"tens to hundreds of times\" in the lecture).",
    "2. Thyroglobulin: the cell makes thyroglobulin (Tg) and secretes it into the colloid. Its tyrosines are the substrate, and it stores the hormones and iodine in the follicle.",
    "3. Iodide to iodine (alphabetical order): iodide crosses the apical membrane through pendrin, and thyroperoxidase oxidizes it to iodine. Its substrate is H2O2, made with the NADPH that TSH's glucose oxidation supplies.",
    "4. Organification and coupling: thyroperoxidase adds iodine to thyroglobulin's tyrosines (MIT, DIT), then couples them: MIT + DIT = T3, DIT + DIT = T4, still attached to thyroglobulin. Three jobs for one enzyme.",
    "5. Endocytosis: the cell takes colloid back in through megalin, the thyroglobulin receptor.",
    "6. Proteolysis: lysosomes digest thyroglobulin, freeing T4 (about 90%) and T3 (about 10%). It's messy: leftover thyroglobulin, MIT and DIT remain. This is the only time T4 and T3 are inside the cell.",
    "7. Secretion and recycling: free T4 and T3 cross into the blood; leftover MIT and DIT are deiodinated so their iodine is reused. In the tissues, 5'-deiodinase (outer ring) turns T4 into active T3, and 5-deiodinase (inner ring) makes inactive reverse T3.",
  ],
  DRUGS: {
    none: "",
    thio: "Methimazole and PTU interfere with iodination of thyroglobulin's tyrosines and with coupling (step 4), so no new T3 or T4 is made. PTU also blocks T4 to T3 conversion in the tissues.",
    iodide: "A large iodide load blocks organification for a while (the Wolff-Chaikoff effect) and lowers NIS; the gland escapes it. Before antithyroid drugs it was a treatment for hyperthyroidism. Given as a drug (Lugol's solution), iodide also inhibits hormone release (step 7): used before thyroid surgery and in thyroid storm.",
    lowiod: "Low iodide: NIS speeds up and traps iodide faster, keeping hormone production going. If iodide stays too low, T4 and T3 fall, TSH rises, and TSH's growth signal (hypertrophy and hyperplasia) enlarges the gland: a goiter.",
  },
};

/* which steps run, and which a drug blocks */
function thState(s, drug) {
  var k = Math.floor(s + 1e-6), blk4 = drug === "thio" || drug === "iodide", blk7 = drug === "iodide";
  return { low: drug === "lowiod", k: k, iod: k >= 1, tg: k >= 2, pen: k >= 3, org: k >= 4 && !blk4, blk4: blk4 && k >= 4, endo: k >= 5, lys: k >= 6, rel: k >= 7 && !blk7, blk7: blk7 && k >= 7, hormone: k >= 4 && !blk4 };
}

function thSvg(s, drug, t, D) {
  var S = D.thState(s, drug), f = function (n) { return Math.round(n * 10) / 10; }, o = "", AP = D.AP, BL = D.BL;
  function tx(x, y, txt, cls, a) { return '<text class="th-t' + (cls ? " " + cls : "") + '" x="' + f(x) + '" y="' + f(y) + '"' + (a ? ' text-anchor="' + a + '"' : "") + ">" + txt + "</text>"; }
  function lab(txt, x, y, px, py, a) { return '<g class="am-callout"><path class="th-lead" d="M' + f(a === "end" ? x + 3 : x - 3) + " " + f(y - 4) + "L" + f(px) + " " + f(py) + '"/><circle class="th-dot" cx="' + f(px) + '" cy="' + f(py) + '" r="1.8"/>' + tx(x, y, txt, "", a) + "</g>"; }
  function along(path, u) { var n = path.length - 1, i = Math.min(n - 1, Math.floor(u * n)), w = u * n - i; return [path[i][0] + (path[i + 1][0] - path[i][0]) * w, path[i][1] + (path[i + 1][1] - path[i][1]) * w]; }
  function ph(period, off) { return ((t / period + (off || 0)) % 1 + 1) % 1; }
  /* like along(), but by arc length, so an ion keeps one speed down a path with long and short legs */
  function alongL(path, u) { var L = [0], i; for (i = 1; i < path.length; i++) L.push(L[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
    var d = u * L[L.length - 1]; for (i = 1; i < path.length - 1 && L[i] < d; i++); var w = (d - L[i - 1]) / ((L[i] - L[i - 1]) || 1);
    return [path[i - 1][0] + (path[i][0] - path[i - 1][0]) * w, path[i - 1][1] + (path[i][1] - path[i - 1][1]) * w]; }
  /* fade in and out at the capillary's cut ends, so blood ions arrive from off the page instead of popping in */
  function edge(x) { return Math.max(0, Math.min(1, (x - 4) / 26, (636 - x) / 26)); }
  function ion(x, y, cls, r, op) { return '<circle class="' + cls + '" cx="' + f(x) + '" cy="' + f(y) + '" r="' + (r || 3.4) + '"' + (op != null && op < 1 ? ' style="opacity:' + f(op) + '"' : "") + "/>"; }
  function cross(x, y) { return '<path class="th-block" d="M' + (x - 9) + " " + (y - 9) + "l18 18M" + (x + 9) + " " + (y - 9) + 'l-18 18"/>'; }
  /* colloid (the follicle lumen) */
  o += '<path class="th-colloid hot" data-info="Colloid: the gelatinous matrix in the follicle lumen, mostly thyroglobulin. T3 and T4 are made here, outside the cell." d="M4 4H636V' + (AP - 2) + 'H4Z"/>';
  o += tx(14, 26, "colloid (follicle lumen)", "th-mut", "start");
  /* thyroglobulin in the colloid: a chain of tyrosine beads; iodinated beads after step 4 */
  if (S.tg) {
    var chains = [[64, 70], [180, 56], [296, 70], [430, 60], [540, 76]];
    chains.forEach(function (c, ci) {
      var d = "M" + c[0] + " " + c[1];
      for (var j = 1; j <= 6; j++) d += "L" + (c[0] + j * 13) + " " + (c[1] + (j % 2 ? -6 : 6));
      o += '<path class="th-tg" d="' + d + '"/>';
      for (var b = 0; b <= 6; b++) { var bx = c[0] + b * 13, by = c[1] + (b % 2 ? -6 : 6), cls = "th-tyr";
        if (S.hormone) cls = (b + ci) % 5 === 0 ? "th-t4" : (b + ci) % 7 === 3 ? "th-t3" : "th-mdit";
        o += ion(bx, by, cls, 3.2); }
    });
  }
  /* neighbors and the cell */
  o += '<path class="th-cell" d="M14 ' + AP + "H" + (D.X0 - 4) + "V" + BL + 'H14Z"/><ellipse class="th-nuc" cx="96" cy="282" rx="34" ry="22"/>';
  o += '<path class="th-cell" d="M' + (D.X1 + 4) + " " + AP + "H626V" + BL + "H" + (D.X1 + 4) + 'Z"/><ellipse class="th-nuc" cx="545" cy="282" rx="34" ry="22"/>';
  o += '<path class="th-cell th-main" d="M' + D.X0 + " " + AP + "H" + D.X1 + "V" + BL + "H" + D.X0 + 'Z"/>';
  /* microvilli on the apical surface */
  for (var m = D.X0 + 14; m < D.X1 - 6; m += 18) if (Math.abs(m - D.PEN[0]) > 14 && Math.abs(m - D.TPO[0]) > 18 && Math.abs(m - D.MEG[0]) > 14 && Math.abs(m - D.TGX[0]) > 12) o += '<path class="th-villus" d="M' + m + " " + AP + "v-9" + '"/>';
  /* nucleus (basal), rough ER and Golgi */
  o += '<g class="hot" data-info="The follicular cell makes thyroglobulin on its rough ER and packs it in the Golgi; vesicles carry it to the apical surface."><ellipse class="th-nuc" cx="' + D.NUC[0] + '" cy="' + D.NUC[1] + '" rx="46" ry="28"/><circle class="th-nucleolus" cx="' + (D.NUC[0] + 10) + '" cy="' + (D.NUC[1] - 6) + '" r="7"/>';
  for (var g = 0; g < 4; g++) o += '<path class="th-golgi" d="M' + (362 + g * 2) + " " + (196 - g * 7) + "Q" + (382) + " " + (204 - g * 7) + " " + (402 - g * 2) + " " + (196 - g * 7) + '"/>';
  for (var er = 0; er < 3; er++) o += '<path class="th-er" d="M' + (270) + " " + (166 + er * 9) + "q12 -6 24 0t24 0t24 0" + '"/>';
  o += "</g>";
  /* capillary, drawn under everything that moves: red cells, iodide and sodium drift through it left to right */
  o += '<path class="th-cap hot" data-info="Capillary: iodide comes in from the blood, and T4 and T3 leave into it. In the blood, more than 99% is bound to thyroxine-binding globulin, transthyretin and albumin." d="M14 346H626Q636 346 636 356V408Q636 418 626 418H14Q4 418 4 408V356Q4 346 14 346Z"/>';
  for (var r = 0; r < 5; r++) { var rx = 4 + ((r / 5 + ph(14000)) % 1) * 632; o += '<ellipse class="th-rbc" cx="' + f(rx) + '" cy="' + (r % 2 ? 398 : 370) + '" rx="13" ry="6" style="opacity:' + f(.75 * edge(rx)) + '"/>'; }
  /* passing iodide (fewer when iodide is low) and sodium that the cell does not take up this pass */
  var nI = S.low ? 2 : 6;
  for (var b1 = 0; b1 < nI; b1++) { var bx = 4 + ((b1 / nI + .07 + ph(9000)) % 1) * 632; o += ion(bx, [360, 384, 404][b1 % 3], "th-i", 3.4, edge(bx)); }
  for (var b2 = 0; b2 < 5; b2++) { var nx = 4 + ((b2 / 5 + .16 + ph(9000)) % 1) * 632; o += ion(nx, [376, 394, 364, 408, 386][b2], "th-na", 2.6, edge(nx)); }
  /* step 1: iodide flows in along the capillary, then through NIS into the cell */
  if (S.iod) for (var i1 = 0; i1 < 4; i1++) { var q = alongL([[4, 380], [D.NIS[0] - 26, 380], [D.NIS[0], 356], [D.NIS[0], BL], [D.NIS[0] - 8, 268], [D.PEN[0] - 6, 176]], ph(S.low ? 2200 : 4800, i1 / 4)); o += ion(q[0], q[1], "th-i", 3.4, q[1] > 346 ? edge(q[0]) : 1); }
  /* sodium rides in with each iodide (symport), then stays in the cytoplasm */
  if (S.k === 1) for (var n1 = 0; n1 < 3; n1++) { var qn = alongL([[4, 392], [D.NIS[0] - 14, 392], [D.NIS[0] + 10, 360], [D.NIS[0] + 10, BL], [D.NIS[0] + 22, 288]], ph(S.low ? 2200 : 4800, n1 / 3 + .1)); o += ion(qn[0], qn[1], "th-na", 2.6, qn[1] > 346 ? edge(qn[0]) : 1); }
  /* step 2: a thyroglobulin vesicle from the Golgi to the apical membrane */
  if (S.k === 2) { var q2 = along([[382, 178], [388, 150], [D.TGX[0], AP + 6]], ph(1800)); o += '<circle class="th-ves" cx="' + f(q2[0]) + '" cy="' + f(q2[1]) + '" r="8"/>'; }
  /* step 3: iodide out through pendrin into the colloid, to thyroperoxidase */
  if (S.pen) for (var i3 = 0; i3 < 3; i3++) { var q3 = along([[D.PEN[0], 170], [D.PEN[0], AP], [D.PEN[0] + 20, 104], [D.TPO[0] - 8, 108]], ph(2000, i3 / 3)); o += ion(q3[0], q3[1], q3[1] < AP && q3[0] > D.PEN[0] + 30 ? "th-i0" : "th-i"); }
  /* step 5: a colloid droplet taken in through megalin; step 6: a lysosome fuses with it */
  if (S.endo) {
    var u5 = S.k === 5 ? ph(2200) : 1, dp = along([[D.MEG[0], AP - 8], [D.MEG[0], AP + 20], [D.LYS[0] + 2, D.LYS[1] - 6]], u5);
    o += '<circle class="th-drop" cx="' + f(dp[0]) + '" cy="' + f(dp[1]) + '" r="13"/>';

    if (S.lys && S.hormone) { o += ion(dp[0] - 4, dp[1] - 3, "th-t4", 3.4) + ion(dp[0] + 5, dp[1] + 2, "th-t4", 3.4) + ion(dp[0] - 2, dp[1] + 6, "th-t4", 3.4) + ion(dp[0] + 6, dp[1] - 6, "th-t3", 3.4); }
  }
  /* a lysosome waits beside the droplet's path; at step 6 it fuses with the droplet */
  o += '<circle class="th-lyso hot" data-info="Lysosome: its proteases digest thyroglobulin, freeing T4 and T3 (and leftover MIT and DIT)." cx="' + (D.LYS[0] + 18) + '" cy="' + (D.LYS[1] + 2) + '" r="8"/>';
  /* step 7: T4/T3 out to the blood; MIT/DIT iodine recycled */
  if (S.rel && S.hormone) {
    for (var h = 0; h < 5; h++) { var q7 = alongL([[D.LYS[0], D.LYS[1] + 14], [D.LYS[0] + 18, BL - 10], [D.LYS[0] + 22, BL], [D.LYS[0] + 40, 404], [636, 404]], ph(5200, h / 5)); o += ion(q7[0], q7[1], h === 2 ? "th-t3" : "th-t4", 3.4, edge(q7[0])); }
    o += '<path class="th-recyc" d="M' + (D.LYS[0] - 18) + " " + (D.LYS[1] - 6) + "Q300 214 " + (D.NIS[0] + 2) + ' 232"/><circle class="th-dot" cx="' + (D.NIS[0] + 2) + '" cy="232" r="1.8"/>';
    o += tx(300, 212, "I⁻ recycled", "th-key-i", "middle");
  }
  /* proteins */
  var N = D.NIS, Pn = D.PEN, T = D.TPO, Mg = D.MEG;
  o += '<g class="hot" data-info="NIS, the sodium-iodide symporter: active transport of iodide into the cell, driven by the sodium gradient. TSH increases its expression; a large iodine load lowers it."><rect class="th-prot' + (S.k === 1 ? " is-act" : "") + '" x="' + (N[0] - 12) + '" y="' + (N[1] - 12) + '" width="24" height="24" rx="6"/></g>';
  o += '<g class="hot" data-info="Pendrin: carries iodide across the apical membrane into the colloid."><rect class="th-prot' + (S.k === 3 ? " is-act" : "") + '" x="' + (Pn[0] - 10) + '" y="' + (Pn[1] - 12) + '" width="20" height="24" rx="6"/></g>';
  o += '<g class="hot" data-info="Thyroperoxidase (TPO): on the apical surface, facing the colloid. It oxidizes iodide to iodine (needs H2O2), iodinates thyroglobulin\'s tyrosines and couples MIT and DIT. Methimazole and PTU act here."><path class="th-prot th-tpo' + (S.k === 3 || S.k === 4 ? " is-act" : "") + '" d="M' + (T[0] - 16) + " " + (T[1] + 8) + "V" + (T[1] - 6) + "Q" + T[0] + " " + (T[1] - 26) + " " + (T[0] + 16) + " " + (T[1] - 6) + "V" + (T[1] + 8) + 'Z"/>' + (S.blk4 ? cross(T[0], T[1] - 22) : "") + "</g>";
  o += '<g class="hot" data-info="Megalin: the thyroglobulin receptor that lets the cell take colloid back in by endocytosis."><path class="th-prot' + (S.k === 5 ? " is-act" : "") + '" d="M' + (Mg[0] - 12) + " " + (Mg[1] + 10) + "V" + (Mg[1] - 4) + "L" + Mg[0] + " " + (Mg[1] - 14) + "L" + (Mg[0] + 12) + " " + (Mg[1] - 4) + "V" + (Mg[1] + 10) + 'Z"/></g>';
  if (S.blk7) o += cross(D.LYS[0] + 22, BL);
  o += '<g class="hot" data-info="TSH receptor (Gs): cAMP and protein kinase A turn up NIS, thyroglobulin, pendrin, thyroperoxidase and megalin, and drive glucose oxidation and NADPH, which make the H2O2 thyroperoxidase needs. Its growth signal (hypertrophy, hyperplasia) is why a goiter forms. In Graves disease, antibodies switch it on."><path class="th-prot th-tshr" d="M' + (D.TSHR - 8) + " " + (BL + 10) + "V" + (BL - 8) + "Q" + D.TSHR + " " + (BL - 20) + " " + (D.TSHR + 8) + " " + (BL - 8) + "V" + (BL + 10) + 'Z"/></g>';
  if (S.pen) o += '<path class="th-recyc" d="M' + D.TSHR + " " + (BL - 22) + "Q" + (D.TSHR + 36) + " 210 " + (D.TPO[0] - 4) + " " + (AP + 14) + '"/>' + tx(D.X0 - 8, 214, "NADPH → H₂O₂", "th-key", "end");
  if (S.rel && S.hormone) o += tx(330, 388, "in the tissues: T4 → T3 (5′-deiodinase) or rT3 (5-deiodinase)", "th-key-h", "middle");
  /* labels */
  o += lab("NIS", 150, 372 + 10, N[0] - 10, N[1] + 6, "end");
  o += lab("pendrin", 196, 100, Pn[0] - 6, Pn[1] - 10, "end");
  o += lab("thyroperoxidase", 300, 46, T[0], T[1] - 22, "middle");
  o += lab("megalin", 500, 100, Mg[0] + 8, Mg[1] - 10, "start");
  o += lab("lysosome", 500, 250, D.LYS[0] + 24, D.LYS[1] + 6, "start");
  o += lab("nucleus", 470, 300, D.NUC[0] + 40, D.NUC[1] + 10, "start");
  o += lab("TSH receptor", 150, 318, D.TSHR - 6, BL - 8, "end");
  o += tx(596, 412, "capillary", "th-mut", "end");
  if (S.pen) o += tx(T[0] + 22, T[1] - 30, "H₂O₂", "th-key", "start");
  if (S.k === 1) o += tx(D.NIS[0] + 28, 318, "Na⁺", "th-key-na", "start");
  if (S.hormone) o += tx(612, 112, "T4 · T3 on Tg", "th-key-h", "end");
  return o;
}

const svg = figureSvg({ width: W, height: H, className: "th-svg", label: "The wall of a thyroid follicle: colloid above, a follicular cell with NIS, pendrin, thyroperoxidase and megalin, and a capillary below.", body: thSvg(0, "none", 0, Object.assign({ thState }, D)) });
const plate = plateHtml({ fig: "Fig 2", title: "Making thyroid hormone", hint: "step through · hover a part", readout: "ready", body: `<div class="am-svg th-box">${svg}</div>` });
const controls = `<div class="am-controls"><label class="am-slider"><span>ready</span><input type="range" min="0" max="7" step="1" value="0" aria-label="Step, from ready to step 7"><span>step 7</span></label></div>
<div class="am-controls"><button type="button" class="am-btn" data-thstep="-1">Back</button><button type="button" class="am-btn" data-thstep="1">Next step</button><button type="button" class="am-btn" data-thplay aria-pressed="false">Play</button></div>
<div class="am-controls" role="group" aria-label="Drug or iodide supply"><button type="button" class="am-btn" data-thdrug="none" aria-pressed="true">No drug</button><button type="button" class="am-btn" data-thdrug="thio" aria-pressed="false">Methimazole or PTU</button><button type="button" class="am-btn" data-thdrug="iodide" aria-pressed="false">Iodide load</button><button type="button" class="am-btn" data-thdrug="lowiod" aria-pressed="false">Low iodide</button></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Hover or tap NIS, pendrin, thyroperoxidase, megalin, the TSH receptor, the colloid, the nucleus or the capillary.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>The seven steps, the proteins at each and the numbers (20-50x, about 90% T4 and 10% T3) are from the L4 notes (Dr. Galin's slides and the recording of his lecture: sodium riding in with iodide, TSH's NADPH and H2O2, low iodide speeding NIS, the deiodinases); the drug actions are from the L4 (Wolff-Chaikoff) and L8 (Dr. Fasinu) notes.</li>
<li>Schematic: one cell between two neighbors, not to scale; thyroglobulin is drawn as a short bead chain; the TSH receptor is drawn but TSH itself isn't. Educational, not medical advice.</li></ul></details>`;

function thLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var svg = root.querySelector(".th-svg"), slider = root.querySelector('input[type="range"]'), play = root.querySelector("[data-thplay]");
  var sum = root.querySelector(".am-summary"), infoEl = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]");
  var s = 0, drug = "none", frame = 0, playing = false, timer = 0, visible = true, t0 = performance.now();
  var NAMES = ["ready", "iodide trapping", "thyroglobulin", "iodide to iodine", "organification + coupling", "endocytosis", "proteolysis", "secretion"];
  function text() {
    var S = D.thState(s, drug), txt = D.STEPS[S.k];
    if ((S.blk4 && S.k === 4) || S.blk7) txt = "Blocked here. " + D.DRUGS[drug];
    else if (S.blk4) txt = txt + " With the drug on, thyroglobulin carries no new T4 or T3.";
    else if (drug === "lowiod" && (S.k === 0 || S.k === 1)) txt = (S.k ? txt + " " : "") + D.DRUGS.lowiod;
    else if (drug !== "none" && !S.k) txt = D.DRUGS[drug] + " Step through to see where.";
    if (sum.textContent !== txt) sum.textContent = txt;
    if (readout) readout.textContent = (S.blk4 && S.k === 4) || S.blk7 ? NAMES[S.k] + " blocked" : S.blk4 ? NAMES[S.k] + " · no new T4/T3" : NAMES[S.k];
  }
  function draw(now) { svg.innerHTML = D.thSvg(s, drug, reduce.matches ? 0 : now - t0, D); }
  function loop(now) { draw(now); frame = visible && !reduce.matches ? requestAnimationFrame(loop) : 0; }
  function kick() { if (!frame && visible && !reduce.matches) frame = requestAnimationFrame(loop); else if (reduce.matches) draw(0); }
  function set(k) { s = Math.max(0, Math.min(7, k)); slider.value = s; text(); if (reduce.matches) draw(0); }
  function stop() { playing = false; clearInterval(timer); play.setAttribute("aria-pressed", "false"); play.textContent = "Play"; }
  root.querySelectorAll("[data-thstep]").forEach(function (b) { b.addEventListener("click", function () { stop(); set(s + +b.getAttribute("data-thstep")); }); });
  play.addEventListener("click", function () { if (playing) { stop(); return; } playing = true; play.setAttribute("aria-pressed", "true"); play.textContent = "Pause"; if (s >= 7) set(0); timer = setInterval(function () { if (s >= 7) { stop(); return; } set(s + 1); }, 2800); });
  slider.addEventListener("input", function () { stop(); set(+slider.value); });
  root.querySelectorAll("[data-thdrug]").forEach(function (b) { b.addEventListener("click", function () { drug = b.getAttribute("data-thdrug"); root.querySelectorAll("[data-thdrug]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); text(); if (reduce.matches) draw(0); }); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && svg.contains(el)) infoEl.textContent = el.getAttribute("data-info"); }
  svg.addEventListener("pointerover", hot); svg.addEventListener("click", hot);
  if (window.IntersectionObserver) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) kick(); }, { rootMargin: "80px" }).observe(svg);
  text(); draw(0); kick();
}

const CSS = `
.anima .th-box{max-width:640px;margin:0 auto}
.anima .th-svg .th-t{fill:var(--anatomy-text);font:13px var(--anatomy-mono);paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round}
.anima .th-svg .th-mut{fill:var(--anatomy-muted)}
.anima .th-svg .th-key{fill:var(--anatomy-lit);font-weight:600;font-size:12px}
.anima .th-svg .th-key-i{fill:var(--he-nuc);font-weight:600;font-size:11px}
.anima .th-svg .th-key-h{fill:var(--he-hormone);font-weight:600;font-size:12px}
.anima .th-svg .th-lead{fill:none;stroke:var(--anatomy-mid);stroke-width:.8}
.anima .th-svg .th-dot{fill:var(--anatomy-dot)}
.anima .th-svg .th-colloid{fill:var(--he-colloid);stroke:var(--he-cyto-line);stroke-width:.8;stroke-dasharray:3 3}
.anima .th-svg .th-tg{fill:none;stroke:var(--he-cyto-line);stroke-width:1.4}
.anima .th-svg .th-tyr{fill:var(--anatomy-face);stroke:var(--he-cyto-line);stroke-width:1}
.anima .th-svg .th-mdit{fill:var(--he-nuc);opacity:.75}
.anima .th-svg .th-t4{fill:var(--he-hormone)}
.anima .th-svg .th-t3{fill:var(--he-gold)}
.anima .th-svg .th-cell{fill:var(--he-cyto);stroke:var(--he-mem);stroke-width:2;opacity:.75}
.anima .th-svg .th-main{opacity:1;stroke-width:3}
.anima .th-svg .th-villus{stroke:var(--he-mem);stroke-width:3;stroke-linecap:round}
.anima .th-svg .th-nuc{fill:var(--he-nuc);opacity:.85;stroke:var(--he-nuc-line);stroke-width:1.2}
.anima .th-svg .th-nucleolus{fill:var(--he-nuc-line)}
.anima .th-svg .th-golgi,.anima .th-svg .th-er{fill:none;stroke:var(--he-cyto-line);stroke-width:2;stroke-linecap:round}
.anima .th-svg .th-i{fill:var(--he-nuc)}
.anima .th-svg .th-i0{fill:var(--anatomy-lit)}
.anima .th-svg .th-na{fill:var(--he-glu)}
.anima .th-svg .th-key-na{fill:var(--he-glu);font-weight:600;font-size:11px}
.anima .th-svg .th-ves{fill:var(--he-colloid);stroke:var(--he-cyto-line);stroke-width:1.4}
.anima .th-svg .th-drop{fill:var(--he-colloid);stroke:var(--he-cyto-line);stroke-width:1.4}
.anima .th-svg .th-lyso{fill:var(--he-nuc-line);opacity:.8}
.anima .th-svg .th-recyc{fill:none;stroke:var(--he-nuc);stroke-width:1.4;stroke-dasharray:4 3}
.anima .th-svg .th-prot{fill:var(--anatomy-shade-1);stroke:var(--anatomy-hi);stroke-width:1.2}
.anima .th-svg .th-prot.is-act{fill:var(--accent-soft);stroke:var(--anatomy-lit);stroke-width:2}
.anima .th-svg .th-block{stroke:var(--he-blood-line);stroke-width:3.2;stroke-linecap:round}
.anima .th-svg .th-cap{fill:var(--he-blood);stroke:var(--he-blood-line);stroke-width:1}
.anima .th-svg .th-rbc{fill:var(--he-rbc);opacity:.75}
`;

export function thyroid() {
  return {
    id: "thyroid", lec: "thyroid",
    title: "Making thyroid hormone, step by step",
    caption: "Step through the seven steps in a follicular cell, from iodide trapping to secretion, and see where methimazole or PTU and an iodide load act, and what low iodide does.",
    html: `<div class="anima" data-anima="thyroid">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: thLive.toString(),
    helpers: [thState, thSvg],
    data: D,
  };
}
