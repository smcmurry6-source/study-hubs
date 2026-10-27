// Fig: how the hypothalamus reaches each lobe of the pituitary (Heme & Endo Exam 1, L1 Endocrine Histology I and L2
// Hypothalamus & Pituitary). A schematic midline section: the hypothalamus with the supraoptic and paraventricular
// nuclei, the optic chiasm in front, the stalk, and the pituitary in the sella turcica. The anterior route: releasing
// hormones from short axons at the median eminence, through the portal veins, to the tropic cells of the pars distalis
// (pick a releasing hormone and its target cell lights up). The posterior route: long axons carry ADH and oxytocin to
// the pars nervosa, with Herring bodies and pituicytes. Schematic, not to scale; no numbers.
import { figureSvg, plateHtml } from "./shared.mjs";

const W = 520, H = 440;
const D = {
  W, H,
  RH: [[264, 152], [262, 186], [252, 198], [238, 296], [214, 330]],
  SON: [[198, 157], [256, 180], [278, 232], [306, 300], [320, 338]],
  PVN: [[300, 88], [280, 176], [284, 232], [314, 296], [334, 334]],
  PROD_A: [[206, 330], [172, 312], [56, 290]], PROD_P: [[330, 338], [372, 316], [508, 292]],
  CELLS: [[178, 318, "S"], [196, 308, "C"], [216, 306, "L"], [236, 314, "T"], [168, 342, "G"], [188, 334, "S"], [208, 332, "X"], [228, 340, "C"], [248, 332, "T"], [182, 364, "L"], [204, 360, "G"], [226, 366, "S"], [246, 356, "X"]],
  HORM: {
    crh: { rh: "CRH", cell: "C", out: "ACTH", text: "CRH → corticotrophs (basophils) → ACTH, cut from POMC, → the adrenal cortex. Corticotrophs are inhibited by high plasma cortisol. (CRH comes from the paraventricular nucleus.)" },
    trh: { rh: "TRH", cell: "T", out: "TSH", text: "TRH → thyrotrophs (basophils) → TSH → synthesis and release of thyroid hormone. Thyrotrophs are inhibited by T3 and T4 in the blood." },
    gnrh: { rh: "GnRH", cell: "G", out: "FSH, LH", text: "GnRH → gonadotrophs (basophils) → FSH and LH → ovarian follicle growth and estrogen secretion; steroid production in the testes. Gonadotrophs are inhibited by progesterone and estradiol." },
    ghrh: { rh: "GHRH", cell: "S", out: "GH", text: "GHRH → somatotrophs (acidophils) → growth hormone, which makes the liver produce IGF-1 for bone and muscle growth. Somatotrophs are inhibited by somatostatin." },
    da: { rh: "dopamine", cell: "L", out: "", inhib: true, text: "Dopamine → lactotrophs (acidophils): chronic inhibition of prolactin, the one pituitary hormone that is held down all the time. When a mother nurses, the dopamine brake comes off." },
  },
  ANT: "Anterior lobe (adenohypophysis: glandular epithelium from Rathke's pouch): hypothalamic axons stop at the median eminence and release into the first capillary bed (superior hypophysial artery); the portal veins carry the hormone to the fenestrated capillaries of the pars distalis, where it finds the cells with its receptor. ",
  POST: "Posterior lobe (neurohypophysis: neural tissue, not endocrine): large (magnocellular) neurons of the supraoptic and paraventricular nuclei send unmyelinated axons down the infundibulum, the hypothalamohypophysial tract. Granules of ADH (vasopressin) or oxytocin pile up in swellings, Herring bodies, and leave the terminals by exocytosis into fenestrated capillaries (inferior hypophysial artery); pituicytes pull their processes back to let them through. No releasing-hormone step: it's a storage site.",
};

function piSvg(mode, hk, t, D) {
  var f = function (n) { return Math.round(n * 10) / 10; }, o = "", ant = mode === "ant", hm = D.HORM[hk];
  function tx(x, y, txt, cls, a) { return '<text class="pi-t' + (cls ? " " + cls : "") + '" x="' + f(x) + '" y="' + f(y) + '"' + (a ? ' text-anchor="' + a + '"' : "") + ">" + txt + "</text>"; }
  function lab(txt, x, y, px, py, a) { return '<g class="am-callout"><path class="pi-lead" d="M' + f(a === "end" ? x + 3 : x - 3) + " " + f(y - 4) + "L" + f(px) + " " + f(py) + '"/><circle class="pi-dot" cx="' + f(px) + '" cy="' + f(py) + '" r="1.8"/>' + tx(x, y, txt, "", a) + "</g>"; }
  function poly(p) { return "M" + p.map(function (q) { return f(q[0]) + " " + f(q[1]); }).join("L"); }
  function along(p, u) {
    var L = [], tot = 0;
    for (var i = 1; i < p.length; i++) { var d = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); L.push(d); tot += d; }
    var s = u * tot;
    for (var j = 0; j < L.length; j++) { if (s <= L[j] || j === L.length - 1) { var w = L[j] ? Math.min(1, s / L[j]) : 0; return [p[j][0] + (p[j + 1][0] - p[j][0]) * w, p[j][1] + (p[j + 1][1] - p[j][1]) * w]; } s -= L[j]; }
  }
  function flow(p, cls, period, n, r, off) { var out = ""; for (var i = 0; i < n; i++) { var u = (((t / period) + i / n + (off || 0)) % 1 + 1) % 1, q = along(p, u); out += '<circle class="' + cls + '" cx="' + f(q[0]) + '" cy="' + f(q[1]) + '" r="' + (r || 3.2) + '" opacity="' + f(Math.min(1, u * 6, (1 - u) * 6)) + '"/>'; } return out; }
  /* sella turcica */
  o += '<path class="pi-bone hot" data-info="Sella turcica of the sphenoid bone: the pituitary sits in it, posterior to the optic chiasm." d="M100 326Q108 420 214 420H330Q398 418 404 326H418Q414 434 330 434H214Q90 434 86 326Z"/>';
  /* hypothalamus */
  o += '<path class="pi-hyp hot" data-info="Hypothalamus: a sensor of the external and internal environment (stress, hunger, temperature). Releasing and release-inhibiting hormones are made in the arcuate, paraventricular, periventricular and supraoptic nuclei." d="M50 150C50 66 140 22 265 22C390 22 480 66 480 150Q480 176 452 176H298V180H236V176H78Q50 176 50 150Z"/>';
  o += tx(265, 44, "hypothalamus", "pi-in", "middle");
  /* optic chiasm: the anterior side */
  o += '<g class="hot" data-info="Optic chiasm: lost on a picture? Find it; that side is anterior. The supraoptic nucleus sits just above it."><ellipse class="pi-chiasm" cx="140" cy="194" rx="46" ry="12"/>' + tx(140, 198, "optic chiasm", "pi-sm pi-on", "middle") + "</g>";
  o += tx(22, 194, "← anterior", "pi-sm", "start");
  /* stalk, pars tuberalis, the two lobes, pars intermedia */
  o += '<path class="pi-stalk hot" data-info="Infundibulum (stalk): continuous with the median eminence at the top and the pars nervosa below; the long axons run down it." d="M240 178H296Q292 230 302 290H266Q262 232 240 178Z"/>';
  o += '<path class="pi-tub hot" data-info="Pars tuberalis: the part of the anterior lobe that wraps around the stalk." d="M234 182Q252 232 258 292H266Q260 232 242 180Z"/>';
  o += '<path class="pi-ant hot" data-info="Anterior lobe (adenohypophysis), mostly pars distalis: cords of tropic cells and fenestrated capillaries (the secondary plexus). Stains darker. Acidophils: somatotrophs and lactotrophs; basophils: thyrotrophs, gonadotrophs and corticotrophs; chromophobes have little hormone." d="M262 292C246 282 198 280 168 292C134 306 130 362 158 382C186 398 240 398 262 382Z"/>';
  o += '<path class="pi-int hot" data-info="Pars intermedia: the thin middle part of the anterior lobe." d="M262 292H270V380H262Z"/>';
  o += '<path class="pi-post hot" data-info="Posterior lobe (neurohypophysis), the pars nervosa: unmyelinated axons from the hypothalamus supported by pituicytes. Stains lighter." d="M270 292C304 280 352 288 362 322C372 358 344 386 306 386C288 386 274 380 270 374Z"/>';
  o += tx(198, 410, "anterior lobe", "pi-sm pi-on", "middle") + tx(318, 410, "posterior lobe", "pi-sm pi-on", "middle");
  /* vessels: superior hypophysial artery, primary plexus, portal veins, secondary plexus; inferior artery and its bed */
  o += '<path class="pi-art" d="M14 234Q150 240 238 196"/>' + tx(14, 252, "sup. hypophysial a.", "pi-xs", "start");
  var pp = "M238 192"; for (var i = 0; i < 5; i++) pp += "q3 9 6 0q3 -9 6 0"; o += '<path class="pi-cap" d="' + pp + '"/>';
  o += '<path class="pi-portal" d="M250 198L234 300M262 198L248 302"/>';
  var sp = ""; for (var r = 0; r < 3; r++) { sp += "M160 " + (324 + r * 18); for (var c = 0; c < 7; c++) sp += "q6 " + (c % 2 ? 7 : -7) + " 13 0"; } o += '<path class="pi-cap" d="' + sp + '"/>';
  o += '<path class="pi-art" d="M508 312Q420 322 350 340"/>' + tx(508, 352, "inf. hypophysial a.", "pi-xs", "end");
  var pb = "M290 344"; for (var k = 0; k < 4; k++) pb += "q6 8 12 0q6 -8 12 0"; o += '<path class="pi-cap" d="' + pb + '"/>';
  o += '<path class="pi-vein" d="' + poly(D.PROD_A) + '"/><path class="pi-vein" d="' + poly(D.PROD_P) + '"/>';
  o += tx(54, 284, "to the blood", "pi-xs", "start") + tx(508, 280, "to the blood", "pi-xs", "end");
  /* nuclei and neurons */
  o += '<g class="hot" data-info="Paraventricular nucleus: large neurons that make ADH or oxytocin (each hormone its own neurons), and neurons that release CRH at the median eminence."><ellipse class="pi-nuc" cx="306" cy="70" rx="46" ry="19"/>' + tx(306, 66, "paraventricular", "pi-xs pi-on", "middle") + "</g>";
  o += '<g class="hot" data-info="Supraoptic nucleus, just above the optic chiasm: large neurons whose axons run to the pars nervosa carrying ADH or oxytocin."><ellipse class="pi-nuc" cx="168" cy="146" rx="44" ry="17"/>' + tx(160, 142, "supraoptic", "pi-xs pi-on", "middle") + "</g>";
  o += '<path class="pi-axon' + (ant ? " is-dim" : "") + '" d="' + poly(D.SON) + '"/><path class="pi-axon' + (ant ? " is-dim" : "") + '" d="' + poly(D.PVN) + '"/>';
  o += '<circle class="pi-soma' + (ant ? " is-dim" : "") + '" cx="192" cy="153" r="6"/><circle class="pi-soma' + (ant ? " is-dim" : "") + '" cx="300" cy="82" r="6"/>';
  /* Herring bodies swell while granules pass */
  var swell = ant ? 0 : .5 + .5 * Math.sin(t / 500);
  [[D.SON, .74], [D.PVN, .72]].forEach(function (a) { var q = along(a[0], a[1]); o += '<ellipse class="pi-herring' + (ant ? " is-dim" : "") + '" cx="' + f(q[0]) + '" cy="' + f(q[1]) + '" rx="' + f(5 + swell * 2) + '" ry="' + f(7 + swell * 2) + '"/>'; });
  /* pituicytes: processes on the capillaries pull back while hormone is released */
  var pull = ant ? 0 : .5 + .5 * Math.sin(t / 700);
  [[300, 362], [348, 316]].forEach(function (p, pi) {
    var reach = 14 - pull * 7, d = "";
    for (var a = 0; a < 5; a++) { var ang = a * 1.26 + pi, len = a === 0 ? reach : 9; d += "M" + p[0] + " " + p[1] + "l" + f(Math.cos(ang) * len) + " " + f(Math.sin(ang) * len); }
    o += '<g class="hot" data-info="Pituicytes: the neuroglial cells of the pars nervosa. Their processes touch both the axons and the capillaries; when ADH and oxytocin are released, the processes next to the vessels retract, letting the hormones into the pericapillary space."><path class="pi-glia" d="' + d + '"/><circle class="pi-gliab" cx="' + p[0] + '" cy="' + p[1] + '" r="4"/></g>';
  });
  /* the releasing-hormone neuron: a short axon to the median eminence */
  o += '<path class="pi-axon' + (ant ? "" : " is-dim") + '" d="M264 152L262 186"/><circle class="pi-soma' + (ant ? "" : " is-dim") + '" cx="264" cy="150" r="5"/>';
  /* tropic cells */
  D.CELLS.forEach(function (c) {
    var tgt = ant && c[2] === hm.cell, cls = c[2] === "X" ? "pi-chromo" : c[2] === "S" || c[2] === "L" ? "pi-acid" : "pi-baso";
    o += '<circle class="pi-cell ' + cls + (tgt ? " is-tgt" : "") + '" cx="' + c[0] + '" cy="' + c[1] + '" r="' + (tgt ? 7.5 : 6) + '"/>';
    if (tgt && hm.inhib) o += '<path class="pi-block" d="M' + (c[0] - 5) + " " + (c[1] - 12) + "h10" + '"/>';
  });
  /* hormones moving */
  if (ant) {
    o += flow(D.RH, hm.inhib ? "pi-rh pi-da" : "pi-rh", 2600, 5, 3.4);
    if (!hm.inhib) D.CELLS.forEach(function (c, ci) { if (c[2] === hm.cell) o += flow([[c[0], c[1]], [172, 312], [56, 290]], "pi-out", 2400, 2, 3.2, ci * .17); });
  } else {
    o += flow(D.SON, "pi-adh", 2800, 6, 3) + flow(D.PVN, "pi-oxt", 2800, 6, 3, .5);
    o += flow(D.PROD_P, "pi-adh", 2200, 2, 3) + flow(D.PROD_P, "pi-oxt", 2200, 2, 3, .5);
  }
  /* callouts */
  o += lab("median eminence", 318, 204, 294, 184, "start");
  o += lab("portal veins", 214, 266, 242, 252, "end");
  o += lab("Herring bodies", 384, 258, along(D.PVN, .72)[0] + 6, along(D.PVN, .72)[1], "start");
  o += lab("pituicyte", 384, 300, 352, 312, "start");
  o += lab("sella turcica", 424, 404, 410, 384, "start");
  if (ant) o += tx(12, 128, hm.rh + (hm.inhib ? " ⊣ prolactin" : " → " + hm.out), "pi-key", "start");
  else o += tx(12, 128, "ADH · oxytocin", "pi-key", "start");
  return o;
}

const svg = figureSvg({ width: W, height: H, className: "pi-svg", label: "A midline section of the hypothalamus and pituitary: the anterior lobe reached through the portal veins and the posterior lobe reached by long axons.", body: piSvg("ant", "crh", 0, D) });
const plate = plateHtml({ fig: "Fig 5", title: "Two lobes, two routes", hint: "pick a route · hover a part", readout: "anterior · CRH", body: `<div class="am-svg pi-box">${svg}</div>` });
const controls = `<div class="am-controls" role="group" aria-label="Route"><button type="button" class="am-btn" data-pimode="ant" aria-pressed="true">Anterior lobe: portal veins</button><button type="button" class="am-btn" data-pimode="post" aria-pressed="false">Posterior lobe: long axons</button></div>
<div class="am-controls pi-horms" role="group" aria-label="Hypothalamic hormone"><button type="button" class="am-btn" data-pihorm="crh" aria-pressed="true">CRH</button><button type="button" class="am-btn" data-pihorm="trh" aria-pressed="false">TRH</button><button type="button" class="am-btn" data-pihorm="gnrh" aria-pressed="false">GnRH</button><button type="button" class="am-btn" data-pihorm="ghrh" aria-pressed="false">GHRH</button><button type="button" class="am-btn" data-pihorm="da" aria-pressed="false">Dopamine</button></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Hover or tap a nucleus, the stalk, either lobe, the optic chiasm, a pituicyte or the sella turcica. Pink cells are acidophils, blue basophils, pale chromophobes.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From the L1 notes (Dr. Herr: lobes, parts, blood supply and portal system, cells of the pars distalis, Herring bodies, pituicytes) and the L2 notes (Dr. Galin: the median eminence, the releasing hormones and their targets, dopamine's brake on prolactin).</li>
<li>Schematic midline section, not to scale; a handful of cells stands for the cords of the pars distalis. Somatostatin, PRF and the feedback loops aren't drawn. Educational, not medical advice.</li></ul></details>`;

function piLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var svg = root.querySelector(".pi-svg"), sum = root.querySelector(".am-summary"), infoEl = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]"), horms = root.querySelector(".pi-horms");
  var mode = "ant", hk = "crh", frame = 0, visible = true, t0 = performance.now();
  function text() {
    sum.textContent = mode === "ant" ? D.ANT + D.HORM[hk].text : D.POST;
    if (readout) readout.textContent = mode === "ant" ? "anterior · " + D.HORM[hk].rh : "posterior · ADH, oxytocin";
    horms.classList.toggle("is-off", mode !== "ant");
    root.querySelectorAll("[data-pimode]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-pimode") === mode)); });
    root.querySelectorAll("[data-pihorm]").forEach(function (b) { b.setAttribute("aria-pressed", String(mode === "ant" && b.getAttribute("data-pihorm") === hk)); });
  }
  function draw(now) { svg.innerHTML = D.piSvg(mode, hk, reduce.matches ? 0 : now - t0, D); }
  function loop(now) { draw(now); frame = visible && !reduce.matches ? requestAnimationFrame(loop) : 0; }
  function kick() { if (!frame && visible && !reduce.matches) frame = requestAnimationFrame(loop); else if (reduce.matches) draw(0); }
  root.querySelectorAll("[data-pimode]").forEach(function (b) { b.addEventListener("click", function () { mode = b.getAttribute("data-pimode"); text(); kick(); }); });
  root.querySelectorAll("[data-pihorm]").forEach(function (b) { b.addEventListener("click", function () { hk = b.getAttribute("data-pihorm"); mode = "ant"; text(); kick(); }); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && svg.contains(el)) infoEl.textContent = el.getAttribute("data-info"); }
  svg.addEventListener("pointerover", hot); svg.addEventListener("click", hot);
  if (window.IntersectionObserver) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) kick(); }, { rootMargin: "80px" }).observe(svg);
  text(); draw(0); kick();
}

const CSS = `
.anima .pi-box{max-width:560px;margin:0 auto}
.anima .pi-horms.is-off{opacity:.45}
.anima .pi-svg .pi-t{fill:var(--anatomy-text);font:12px var(--anatomy-mono);paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round}
.anima .pi-svg .pi-in{font-weight:600;font-size:13px;stroke:none}
.anima .pi-svg .pi-sm{font-size:11.5px}
.anima .pi-svg .pi-xs{font-size:10.5px;fill:var(--anatomy-muted)}
.anima .pi-svg .pi-on{stroke:none;fill:var(--anatomy-text)}
.anima .pi-svg .pi-key{font-weight:700;font-size:13px;fill:var(--anatomy-lit)}
.anima .pi-svg .pi-lead{fill:none;stroke:var(--anatomy-mid);stroke-width:.8}
.anima .pi-svg .pi-dot{fill:var(--anatomy-dot)}
.anima .pi-svg .pi-bone{fill:var(--he-bone);stroke:var(--he-bone-line);stroke-width:1.2}
.anima .pi-svg .pi-hyp{fill:var(--he-cyto);stroke:var(--he-mem);stroke-width:1.6;opacity:.85}
.anima .pi-svg .pi-chiasm{fill:var(--anatomy-face);stroke:var(--anatomy-hi);stroke-width:1.2}
.anima .pi-svg .pi-stalk{fill:var(--he-colloid);stroke:var(--he-mem);stroke-width:1.4}
.anima .pi-svg .pi-tub{fill:var(--he-nuc);opacity:.55}
.anima .pi-svg .pi-ant{fill:var(--he-cyto);stroke:var(--he-mem);stroke-width:1.8}
.anima .pi-svg .pi-int{fill:var(--he-nuc);opacity:.45}
.anima .pi-svg .pi-post{fill:var(--he-colloid);stroke:var(--he-mem);stroke-width:1.8}
.anima .pi-svg .pi-art{fill:none;stroke:var(--he-blood-line);stroke-width:3;stroke-linecap:round}
.anima .pi-svg .pi-cap{fill:none;stroke:var(--he-blood-line);stroke-width:1.6;opacity:.8}
.anima .pi-svg .pi-portal{fill:none;stroke:var(--he-blood-line);stroke-width:2.4}
.anima .pi-svg .pi-vein{fill:none;stroke:var(--he-blood-line);stroke-width:1.2;stroke-dasharray:4 3;opacity:.7}
.anima .pi-svg .pi-nuc{fill:var(--he-nuc);opacity:.3;stroke:var(--he-nuc-line);stroke-width:1}
.anima .pi-svg .pi-axon{fill:none;stroke:var(--he-nuc-line);stroke-width:1.8;stroke-linejoin:round}
.anima .pi-svg .pi-soma{fill:var(--he-nuc-line)}
.anima .pi-svg .pi-herring{fill:var(--he-nuc);stroke:var(--he-nuc-line);stroke-width:1}
.anima .pi-svg .is-dim{opacity:.35}
.anima .pi-svg .pi-glia{stroke:var(--he-cyto-line);stroke-width:1.6;stroke-linecap:round}
.anima .pi-svg .pi-gliab{fill:var(--he-cyto-line)}
.anima .pi-svg .pi-cell{stroke:var(--he-mem);stroke-width:1}
.anima .pi-svg .pi-acid{fill:var(--he-hormone);opacity:.75}
.anima .pi-svg .pi-baso{fill:var(--he-nuc);opacity:.85}
.anima .pi-svg .pi-chromo{fill:var(--anatomy-face)}
.anima .pi-svg .pi-cell.is-tgt{opacity:1;stroke:var(--anatomy-lit);stroke-width:2.4}
.anima .pi-svg .pi-block{stroke:var(--he-blood-line);stroke-width:2.6;stroke-linecap:round}
.anima .pi-svg .pi-rh{fill:var(--anatomy-lit)}
.anima .pi-svg .pi-da{fill:var(--he-blood-line)}
.anima .pi-svg .pi-out{fill:var(--he-gold);stroke:var(--anatomy-text);stroke-width:.6}
.anima .pi-svg .pi-adh{fill:var(--he-gold);stroke:var(--anatomy-text);stroke-width:.6}
.anima .pi-svg .pi-oxt{fill:var(--he-glu);stroke:var(--anatomy-text);stroke-width:.6}
`;

export function pituitary() {
  return {
    id: "pituitary", lec: "histo1",
    title: "Two lobes, two routes from the hypothalamus",
    caption: "Follow a releasing hormone through the portal veins to its target cell in the anterior lobe, or ADH and oxytocin down the long axons to the posterior lobe.",
    html: `<div class="anima" data-anima="pituitary">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: piLive.toString(),
    helpers: [piSvg],
    data: D,
  };
}
