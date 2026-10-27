// Fig: glucose-induced insulin secretion in a beta cell (Heme & Endo Exam 1, L5 Endocrine Pancreas). A schematic
// section of one beta cell beside a fenestrated capillary: GLUT2, glycolysis and a mitochondrion, the ATP-sensitive
// K+ channel (the sulfonylurea receptor), a voltage-dependent Ca2+ channel and insulin granules. Step through the six
// steps as Dr. Madison's slide lists them; toggles for low vs high glucose and for a sulfonylurea. No numbers are
// drawn: the notes give the sequence, not membrane potentials. Shapes are schematic, not to scale.
import { figureSvg, plateHtml } from "./shared.mjs";

/* closed smooth path through points (Catmull-Rom as cubic Bezier); self-contained so it also runs in the page */
function heSmooth(pts) {
  var f = function (n) { return Math.round(n * 10) / 10; }, n = pts.length, d = "M" + f(pts[0][0]) + " " + f(pts[0][1]);
  for (var i = 0; i < n; i++) { var p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    d += "C" + f(p1[0] + (p2[0] - p0[0]) / 6) + " " + f(p1[1] + (p2[1] - p0[1]) / 6) + " " + f(p2[0] - (p3[0] - p1[0]) / 6) + " " + f(p2[1] - (p3[1] - p1[1]) / 6) + " " + f(p2[0]) + " " + f(p2[1]); }
  return d + "Z";
}

const W = 620, H = 400;
const D = {
  W, H,
  CELL: [[70, 92], [124, 50], [232, 36], [360, 38], [470, 46], [546, 82], [574, 150], [572, 240], [546, 300], [470, 326], [330, 330], [190, 326], [100, 302], [64, 224], [58, 152]],
  GLUT: [148, 320], KATP: [300, 38], CAV: [573, 196], MITO: [212, 168], NUC: [432, 150],
  GRAN: [[318, 262], [352, 286], [392, 258], [430, 284], [470, 256], [506, 280], [452, 226], [378, 228]],
  STEPS: [
    "Ready: a beta cell beside a fenestrated capillary. The primary signal for insulin release is a rise in blood glucose. Pick high or low glucose, then step through.",
    "1. Glucose enters the beta cell through GLUT2 transporters.",
    "2. Glucokinase phosphorylates it, and glycolysis (then the mitochondria) raise ATP: the ATP:ADP ratio goes up.",
    "3. ATP closes the ATP-sensitive K+ channels (K-ATP, the sulfonylurea receptor).",
    "4. Potassium stays in, so the membrane depolarizes.",
    "5. Depolarization opens voltage-dependent calcium channels, and calcium flows in.",
    "6. The rise in intracellular calcium fuses insulin granules with the membrane: insulin, with its C-peptide 1:1, goes into the blood.",
  ],
};

/* what the cell is doing at step s (0..6) with high or low glucose and with or without a sulfonylurea */
function btState(s, glu, su) {
  /* GLUT2 carries glucose in proportion to blood glucose, so some always enters; low glucose = a trickle and too little ATP */
  var k = Math.floor(s + 1e-6), inG = k >= 1, atp = glu && k >= 2, lowAtp = !glu && k >= 2;
  var closed = (atp && k >= 3) || (su && k >= 3), depol = closed && k >= 4, ca = depol && k >= 5, rel = ca && k >= 6;
  return { k: k, inG: inG, atp: atp, lowAtp: lowAtp, closed: closed, depol: depol, ca: ca, rel: rel };
}

function btSvg(s, glu, su, t, D) {
  var S = D.btState(s, glu, su), f = function (n) { return Math.round(n * 10) / 10; }, o = "";
  function tx(x, y, txt, cls, a) { return '<text class="bt-t' + (cls ? " " + cls : "") + '" x="' + f(x) + '" y="' + f(y) + '"' + (a ? ' text-anchor="' + a + '"' : "") + ">" + txt + "</text>"; }
  function lab(txt, x, y, px, py, a) { return '<g class="am-callout"><path class="bt-lead" d="M' + f(a === "end" ? x + 3 : x - 3) + " " + f(y - 4) + "L" + f(px) + " " + f(py) + '"/><circle class="bt-dot" cx="' + f(px) + '" cy="' + f(py) + '" r="1.8"/>' + tx(x, y, txt, "", a) + "</g>"; }
  function hex(x, y, r) { var p = []; for (var i = 0; i < 6; i++) { var a = Math.PI / 6 + i * Math.PI / 3; p.push(f(x + r * Math.cos(a)) + " " + f(y + r * Math.sin(a))); } return '<path class="bt-glu" d="M' + p.join("L") + 'Z"/>'; }
  function along(path, u) { var n = path.length - 1, i = Math.min(n - 1, Math.floor(u * n)), w = u * n - i; return [path[i][0] + (path[i + 1][0] - path[i][0]) * w, path[i][1] + (path[i + 1][1] - path[i][1]) * w]; }
  var ph = function (period, off) { return ((t / period + (off || 0)) % 1 + 1) % 1; };
  /* capillary with red cells; glucose drifts in the plasma */
  o += '<path class="bt-cap hot" data-info="Fenestrated capillary: islets are highly vascularized because everything they make has to reach the blood." d="M14 342H606Q616 342 616 352V378Q616 388 606 388H14Q4 388 4 378V352Q4 342 14 342Z"/>';
  for (var r = 0; r < 6; r++) { var rx = ((r * 103 + t * 0.012) % 640) - 20; o += '<ellipse class="bt-rbc" cx="' + f(rx) + '" cy="' + (r % 2 ? 372 : 360) + '" rx="13" ry="6"/>'; }
  var ng = glu ? 7 : 2;
  for (var g = 0; g < ng; g++) { var gx = ((g * 89 + t * 0.02) % 620); o += hex(gx, g % 2 ? 377 : 354, 5); }
  o += tx(596, 400 - 4, "capillary", "bt-mut", "end");
  /* the cell */
  o += '<path class="bt-cell' + (S.depol ? " is-depol" : "") + '" d="' + D.heSmooth(D.CELL) + '"/>';
  /* nucleus and Golgi */
  o += '<g class="hot" data-info="Insulin is made as preproinsulin on the ribosomes; in the ER the signal sequence is clipped off (proinsulin), and in the Golgi and granules the C-peptide is cut out, leaving insulin."><ellipse class="bt-nuc" cx="' + D.NUC[0] + '" cy="' + D.NUC[1] + '" rx="60" ry="44"/><circle class="bt-nucleolus" cx="' + (D.NUC[0] + 14) + '" cy="' + (D.NUC[1] - 8) + '" r="9"/>';
  for (var gi = 0; gi < 4; gi++) o += '<path class="bt-golgi" d="M' + (330 + gi * 3) + " " + (176 - gi * 7) + "Q" + (352 + gi * 2) + " " + (186 - gi * 7) + " " + (374 - gi * 1) + " " + (176 - gi * 7) + '"/>';
  o += "</g>";
  /* mitochondrion */
  var M = D.MITO;
  o += '<g class="hot" data-info="Glycolysis in the cytosol, then the mitochondria, turn glucose into ATP, so the ATP:ADP ratio rises with blood glucose."><ellipse class="bt-mito" cx="' + M[0] + '" cy="' + M[1] + '" rx="46" ry="22"/><path class="bt-crista" d="M' + (M[0] - 34) + " " + M[1] + "l8-13l8 26l8-26l8 26l8-26l8 26l8-26l8 13" + '"/></g>';
  /* insulin granules (dense core = insulin with zinc); in step 6 the lower ones fuse with the membrane */
  D.GRAN.forEach(function (p, i) {
    var x = p[0], y = p[1], fuse = S.rel && i < 6;
    if (fuse) { var u = Math.min(1, ph(1600, i * 0.17) * 1.6); y = p[1] + (322 - p[1]) * u; }
    o += '<g class="bt-gran-g hot" data-info="Secretory granules: insulin stored in a complex with zinc, together with the C-peptide cut from proinsulin. They are secreted together, 1:1."><circle class="bt-gran" cx="' + f(x) + '" cy="' + f(y) + '" r="10"/><circle class="bt-core" cx="' + f(x) + '" cy="' + f(y) + '" r="4.6"/></g>';
  });
  /* glucose comes in through GLUT2 and goes to the mitochondrion */
  if (S.inG) { var GP = [[148, 356], [148, 322], [156, 286], [176, 230], [196, 186]], ne = glu ? 3 : 1; for (var e = 0; e < ne; e++) { var q = along(GP, ph(glu ? 2200 : 3600, e / ne)); o += hex(q[0], q[1], 5); } }
  /* ATP to the K-ATP channel */
  if (S.atp) { var AP = [[238, 152], [262, 112], [286, 78], [298, 50]]; for (var a2 = 0; a2 < 4; a2++) { var qa = along(AP, ph(1800, a2 / 4)); o += '<circle class="bt-atp" cx="' + f(qa[0]) + '" cy="' + f(qa[1]) + '" r="3.6"/>'; } }
  /* low glucose: a little ATP is made but the ratio stays too low to reach and close K-ATP */
  if (S.lowAtp) { var qa0 = along([[238, 152], [250, 131], [262, 112]], ph(3000)); o += '<circle class="bt-atp" cx="' + f(qa0[0]) + '" cy="' + f(qa0[1]) + '" r="3.6" opacity="' + f(1 - ph(3000)) + '"/>'; }
  /* K+ leaves through the open K-ATP channel */
  if (!S.closed) for (var kk = 0; kk < 3; kk++) { var qk = along([[300, 92], [300, 40], [300, 4]], ph(1500, kk / 3)); o += '<circle class="bt-k" cx="' + f(qk[0]) + '" cy="' + f(qk[1]) + '" r="3.4"/>'; }
  /* Ca2+ comes in through the voltage-dependent channel toward the granules */
  if (S.ca) for (var c = 0; c < 4; c++) { var qc = along([[612, 196], [573, 196], [530, 214], [480, 240]], ph(1600, c / 4)); o += '<circle class="bt-ca" cx="' + f(qc[0]) + '" cy="' + f(qc[1]) + '" r="3.4"/>'; }
  /* insulin into the blood */
  if (S.rel) for (var ii = 0; ii < 6; ii++) { var u2 = ph(1600, ii * 0.17), x2 = D.GRAN[ii][0]; if (u2 > 0.62) { var w2 = (u2 - 0.62) / 0.38; o += '<circle class="bt-ins" cx="' + f(x2 + w2 * 40) + '" cy="' + f(326 + w2 * 34) + '" r="3"/>'; } }
  /* GLUT2 */
  var G = D.GLUT;
  o += '<g class="hot" data-info="GLUT2: glucose enters the beta cell through these transporters, so what comes in follows blood glucose."><rect class="bt-prot" x="' + (G[0] - 13) + '" y="' + (G[1] - 13) + '" width="11" height="26" rx="4"/><rect class="bt-prot" x="' + (G[0] + 2) + '" y="' + (G[1] - 13) + '" width="11" height="26" rx="4"/></g>';
  /* K-ATP channel with the sulfonylurea receptor; closed = subunits together */
  var K = D.KATP, gap = S.closed ? 1 : 6;
  o += '<g class="hot" data-info="ATP-sensitive K+ channel (K-ATP), the sulfonylurea receptor. Open at rest, letting K+ out; ATP closes it, and so does a sulfonylurea."><rect class="bt-prot' + (S.closed ? " is-shut" : "") + '" x="' + (K[0] - 14 - gap) + '" y="' + (K[1] - 14) + '" width="14" height="28" rx="4"/><rect class="bt-prot' + (S.closed ? " is-shut" : "") + '" x="' + (K[0] + gap) + '" y="' + (K[1] - 14) + '" width="14" height="28" rx="4"/>';
  if (su) o += '<path class="bt-su" d="M' + (K[0] - 30) + " " + (K[1] - 18) + "l7-6l7 6l-7 6Z" + '"/>';
  o += "</g>";
  /* voltage-dependent Ca2+ channel */
  var V = D.CAV, gv = S.depol ? 6 : 1;
  o += '<g class="hot" data-info="Voltage-dependent Ca2+ channel: it opens when the membrane depolarizes."><rect class="bt-prot" x="' + (V[0] - 14) + '" y="' + (V[1] - 14 - gv) + '" width="28" height="13" rx="4"/><rect class="bt-prot" x="' + (V[0] - 14) + '" y="' + (V[1] + 1 + gv) + '" width="28" height="13" rx="4"/></g>';
  /* labels */
  o += lab("GLUT2", 92, 268, G[0] - 10, G[1] - 6, "end");
  o += lab("K-ATP channel", 360, 16, K[0] + 14, K[1] - 6, "start");
  if (su) o += tx(K[0] - 34, K[1] - 24, "sulfonylurea", "bt-key", "end");
  o += lab("Ca²⁺ channel", 616, 128, V[0] + 6, V[1] - 16, "end");
  o += lab("mitochondrion", 110, 128, M[0] - 30, M[1] - 12, "end");
  o += lab("nucleus", 506, 102, D.NUC[0] + 44, D.NUC[1] - 26, "start");
  o += lab("insulin granules", 300, 214, D.GRAN[7][0] - 8, D.GRAN[7][1] + 2, "middle");
  o += tx(300 + 10, 8 + 4, "K⁺", "bt-key-k");
  if (S.ca) o += tx(612, 186, "Ca²⁺", "bt-key-ca", "end");
  if (S.depol) o += tx(64, 98, "depolarized", "bt-key", "start");
  return o;
}

const svg = figureSvg({ width: W, height: H, className: "bt-svg", label: "A beta cell beside a capillary: GLUT2 transporters, a mitochondrion, the K-ATP channel, a voltage-dependent calcium channel and insulin granules.", body: btSvg(0, true, false, 0, Object.assign({ heSmooth, btState }, D)) });
const plate = plateHtml({ fig: "Fig 1", title: "Insulin release", hint: "step through · hover a part", readout: "ready", body: `<div class="am-svg bt-box">${svg}</div>` });
const controls = `<div class="am-controls"><label class="am-slider"><span>ready</span><input type="range" min="0" max="6" step="1" value="0" aria-label="Step, from ready to step 6"><span>step 6</span></label></div>
<div class="am-controls"><button type="button" class="am-btn" data-btstep="-1">Back</button><button type="button" class="am-btn" data-btstep="1">Next step</button><button type="button" class="am-btn" data-btplay aria-pressed="false">Play</button></div>
<div class="am-controls" role="group" aria-label="Conditions"><button type="button" class="am-btn" data-btglu="1" aria-pressed="true">High glucose</button><button type="button" class="am-btn" data-btglu="0" aria-pressed="false">Low glucose</button><button type="button" class="am-btn" data-btsu aria-pressed="false">Add a sulfonylurea</button></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Hover or tap GLUT2, the mitochondrion, the K-ATP channel, the calcium channel, the granules, the nucleus or the capillary.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>The six steps and every part are from the L5 notes (Dr. Madison): glucose in through GLUT2, glucokinase and glycolysis raise ATP, ATP closes K-ATP (the sulfonylurea receptor), the cell depolarizes, voltage-dependent Ca2+ channels open, and Ca2+ fuses the granules. Sulfonylureas close the same K-ATP channels.</li>
<li>Other signals (amino acids, glucagon through Gs, acetylcholine and CCK through Gq, the incretins GLP-1 and GIP) mostly potentiate this glucose response; they aren't drawn.</li>
<li>Schematic: one cell, not to scale, no membrane potential values. Educational, not medical advice.</li></ul></details>`;

function btLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var svg = root.querySelector(".bt-svg"), slider = root.querySelector('input[type="range"]'), play = root.querySelector("[data-btplay]");
  var sum = root.querySelector(".am-summary"), infoEl = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]");
  var s = 0, glu = true, su = false, frame = 0, playing = false, timer = 0, visible = true, t0 = performance.now();
  function text() {
    var S = D.btState(s, glu, su), k = S.k, txt = D.STEPS[k];
    if (k === 1 && !glu) txt = "1. With low glucose only a trickle enters: GLUT2 carries glucose in proportion to blood glucose.";
    else if (k >= 2 && !glu && !su) txt = "With low glucose little enters, ATP stays low, K-ATP stays open and K+ keeps leaving: the cell stays at rest and doesn't release insulin.";
    else if (k === 2 && su && !glu) txt = "With low glucose only a trickle enters and ATP stays low, so ATP alone won't close K-ATP.";
    else if (k >= 3 && su && !glu) txt = "A sulfonylurea closes the K-ATP channel directly, so the cell depolarizes, opens its Ca2+ channels and releases insulin even without the glucose signal. " + (k >= 4 ? "Then " + D.STEPS[k].charAt(3).toLowerCase() + D.STEPS[k].slice(4) : "");
    else if (k >= 3 && su) txt += " The sulfonylurea closes the same channels.";
    if (sum.textContent !== txt) sum.textContent = txt;
    if (readout) readout.textContent = k === 0 ? (glu ? "glucose high" : "glucose low") : (S.rel ? "insulin out" : S.ca ? "Ca²⁺ in" : S.depol ? "depolarized" : S.closed ? "K-ATP closed" : S.atp ? "ATP:ADP up" : S.lowAtp ? "ATP:ADP low" : S.inG ? (glu ? "glucose in" : "a little glucose in") : "at rest");
  }
  function draw(now) { svg.innerHTML = D.btSvg(s, glu, su, reduce.matches ? 0 : now - t0, D); }
  function loop(now) { draw(now); frame = visible && !reduce.matches ? requestAnimationFrame(loop) : 0; }
  function kick() { if (!frame && visible && !reduce.matches) frame = requestAnimationFrame(loop); else if (reduce.matches) draw(0); }
  function set(k) { s = Math.max(0, Math.min(6, k)); slider.value = s; text(); if (reduce.matches) draw(0); }
  function stop() { playing = false; clearInterval(timer); play.setAttribute("aria-pressed", "false"); play.textContent = "Play"; }
  root.querySelectorAll("[data-btstep]").forEach(function (b) { b.addEventListener("click", function () { stop(); set(s + +b.getAttribute("data-btstep")); }); });
  play.addEventListener("click", function () { if (playing) { stop(); return; } playing = true; play.setAttribute("aria-pressed", "true"); play.textContent = "Pause"; if (s >= 6) set(0); timer = setInterval(function () { if (s >= 6) { stop(); return; } set(s + 1); }, 2600); });
  slider.addEventListener("input", function () { stop(); set(+slider.value); });
  root.querySelectorAll("[data-btglu]").forEach(function (b) { b.addEventListener("click", function () { glu = b.getAttribute("data-btglu") === "1"; root.querySelectorAll("[data-btglu]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); text(); if (reduce.matches) draw(0); }); });
  var sb = root.querySelector("[data-btsu]"); sb.addEventListener("click", function () { su = !su; sb.setAttribute("aria-pressed", String(su)); text(); if (reduce.matches) draw(0); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && svg.contains(el)) infoEl.textContent = el.getAttribute("data-info"); }
  svg.addEventListener("pointerover", hot); svg.addEventListener("click", hot);
  if (window.IntersectionObserver) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) kick(); }, { rootMargin: "80px" }).observe(svg);
  text(); draw(0); kick();
}

const CSS = `
.anima .bt-box{max-width:640px;margin:0 auto}
.anima .bt-svg .bt-t{fill:var(--anatomy-text);font:13px var(--anatomy-mono);paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round}
.anima .bt-svg .bt-mut{fill:var(--anatomy-muted)}
.anima .bt-svg .bt-key{fill:var(--anatomy-lit);font-weight:600;font-size:12px}
.anima .bt-svg .bt-key-k{fill:var(--he-k);font-weight:600;font-size:11px}
.anima .bt-svg .bt-key-ca{fill:var(--he-ca);font-weight:600;font-size:11px}
.anima .bt-svg .bt-lead{fill:none;stroke:var(--anatomy-mid);stroke-width:.8}
.anima .bt-svg .bt-dot{fill:var(--anatomy-dot)}
.anima .bt-svg .bt-cap{fill:var(--he-blood);stroke:var(--he-blood-line);stroke-width:1}
.anima .bt-svg .bt-rbc{fill:var(--he-rbc);opacity:.75}
.anima .bt-svg .bt-cell{fill:var(--he-cyto);stroke:var(--he-mem);stroke-width:3;transition:stroke .3s}
.anima .bt-svg .bt-cell.is-depol{stroke:var(--anatomy-lit);stroke-width:4}
.anima .bt-svg .bt-nuc{fill:var(--he-nuc);opacity:.85;stroke:var(--he-nuc-line);stroke-width:1.4}
.anima .bt-svg .bt-nucleolus{fill:var(--he-nuc-line)}
.anima .bt-svg .bt-golgi{fill:none;stroke:var(--he-cyto-line);stroke-width:2.2;stroke-linecap:round}
.anima .bt-svg .bt-mito{fill:var(--he-mito);stroke:var(--he-mito-line);stroke-width:1.4}
.anima .bt-svg .bt-crista{fill:none;stroke:var(--he-mito-line);stroke-width:1.2;stroke-linejoin:round}
.anima .bt-svg .bt-gran{fill:var(--anatomy-face);stroke:var(--he-gran);stroke-width:1.4}
.anima .bt-svg .bt-core{fill:var(--he-gran)}
.anima .bt-svg .bt-prot{fill:var(--anatomy-shade-1);stroke:var(--anatomy-hi);stroke-width:1.2}
.anima .bt-svg .bt-prot.is-shut{fill:var(--anatomy-shade-0)}
.anima .bt-svg .bt-su{fill:var(--anatomy-lit);stroke:var(--anatomy-hi);stroke-width:.8}
.anima .bt-svg .bt-glu{fill:none;stroke:var(--he-glu);stroke-width:1.6}
.anima .bt-svg .bt-atp{fill:var(--he-gold)}
.anima .bt-svg .bt-k{fill:var(--he-k)}
.anima .bt-svg .bt-ca{fill:var(--he-ca)}
.anima .bt-svg .bt-ins{fill:var(--he-gran)}
`;

export function beta() {
  return {
    id: "beta", lec: "pancreas",
    title: "How a beta cell releases insulin",
    caption: "Step through glucose-induced insulin secretion: GLUT2, ATP, the K-ATP channel, depolarization, calcium and the granules. Try low glucose, and add a sulfonylurea.",
    html: `<div class="anima" data-anima="beta">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: btLive.toString(),
    helpers: [btState, btSvg, heSmooth],
    data: D,
  };
}
