// Fig: who raises and lowers blood calcium (Heme & Endo Exam 1, L10 Calcium Regulation: slides + 10/27 recording). A
// schematic body map: the parathyroid's chief cells with their calcium-sensing receptor and the thyroid's C cells on
// top, the blood across the middle, and the three sites of control below (kidney, gut, bone), each with the cells and
// transporters the notes name. Pick a case and the hormones and calcium movements follow it, beside an HTML panel
// (it reflows under the drawing on phones). The recording added the soda (high phosphate) case and estrogen's brake on
// bone (menopause). Levels are qualitative; the notes give no plasma values.
import { figureSvg, plateHtml } from "./shared.mjs";

const W = 400, H = 440;
const D = {
  W, H,
  PTH_K: [[95, 108], [95, 172], [118, 172], [118, 262], [66, 262]], PTH_B: [[95, 108], [95, 166], [292, 166], [292, 336]],
  CTN: [[336, 112], [336, 176], [352, 176], [352, 322]],
  D3: [[120, 340], [138, 340], [138, 300], [178, 300]],
  RCA: [[58, 300], [102, 300], [102, 194]], RP: [[46, 236], [46, 404]],
  GUT: [[200, 418], [200, 382], [200, 252], [200, 192]], BONE: [[348, 366], [360, 300], [366, 192]], PARA: [[300, 348], [324, 348]],
  GAUGES: [["pth", "PTH"], ["d3", "calcitriol"], ["ctn", "calcitonin"]],
  SC: {
    low: { name: "calcium falls · PTH up", v: { pth: .92, d3: .85, ctn: .06, gut: .9, rca: .9, rp: .9, res: .85, ca: .15 }, en: "1a", pit: "ok",
      trig: "Blood Ca²⁺ low", net: "Net: calcium back up, phosphate down",
      text: "Blood calcium falls (nerves fire too easily: tetany, Trousseau's and Chvostek's signs): the calcium-sensing receptor on chief cells isn't stimulated, intracellular calcium doesn't rise, and PTH secretion goes up. Kidney: more calcium reabsorbed in the distal tubule, phosphate excreted, and 1α-hydroxylase makes calcitriol, which turns on the gut's apical calcium channels, calbindin and basolateral pump. Bone: PTH binds osteoblasts (osteoclasts have no PTH receptor), whose paracrine cytokines and growth factors stimulate osteoclasts to resorb bone. Net: calcium up, phosphate down, though calcitriol's phosphate absorption in the gut evens the phosphate out in normal times." },
    normal: { name: "normal", v: { pth: .5, d3: .5, ctn: .5, gut: .5, rca: .5, rp: .5, res: .5, ca: .5 }, en: "both", pit: "ok",
      trig: "Blood Ca²⁺ normal", net: "Formation and resorption balance",
      text: "Normal: plasma calcium is about 50% ionized, 40% protein-bound and 10% complexed, and the hormones control the ionized calcium at three sites: the gut, bone and kidney. Calcium and phosphate usually move the same way; the one exception is the kidney under PTH. Osteoblasts carry receptors for PTH, vitamin D3 and estrogen; osteoclasts carry the calcitonin receptor (\"put a star by this\"). The whole skeleton is replaced about every 7 years." },
    high: { name: "calcium rises · PTH down", v: { pth: .08, d3: .12, ctn: .9, gut: .15, rca: .2, rp: .2, res: .1, ca: .88 }, en: "24", pit: "ok",
      trig: "Blood Ca²⁺ high", net: "Net: calcium falls back",
      text: "Blood calcium rises: calcium stimulates the Gq-coupled calcium-sensing receptor, intracellular calcium rises, and that inhibits PTH secretion: \"the one caveat in endocrinology where a rise in intracellular calcium actually inhibits the secretory pathway.\" High calcium also dulls nerves: lethargy, weakness, sleepiness. The kidney's 24-hydroxylase makes inactive 24,25-(OH)2-D3 instead of calcitriol. The C cells release calcitonin, which inhibits osteoclasts. Calcium falls back." },
    hyper: { name: "primary hyperparathyroidism", v: { pth: .95, d3: .85, ctn: .75, gut: .85, rca: .9, rp: .9, res: .95, ca: .9 }, en: "1a", pit: "adenoma", stones: true,
      trig: "A parathyroid adenoma", net: "PTH high despite high Ca²⁺; phosphate low",
      text: "Primary hyperparathyroidism: one or more parathyroid glands (hyperplasia or a benign tumor) make too much PTH: PTH high despite high calcium, with low phosphate. It is the most common disorder of calcium regulation. High calcium brings lethargy, weakness and constipation; PTH drives bone resorption (bone pain, fractures, vertebral compression); and so much calcium is filtered that it spills over, meets phosphate and forms kidney stones, again and again. Treatment: calcitonin, and bisphosphonates, which bind hydroxyapatite so osteoclasts can't break it down." },
    soda: { name: "high phosphate (lots of soda)", v: { pth: .5, d3: .12, ctn: .5, gut: .18, rca: .5, rp: .6, res: .5, ca: .4 }, en: "24", pit: "ok",
      trig: "Blood phosphate high", net: "Less calcitriol: less calcium absorbed",
      text: "The \"real thing\" or a bad thing? Sodas get their caramel color and fizz from phosphate. In a growing child who drinks a lot of it, hyperphosphatemia turns off renal 1α-hydroxylase and switches on 24-hydroxylase, so the child makes inactive 24,25-(OH)2-D3 instead of calcitriol, absorbs less calcium and phosphate from the gut, and has less to build hydroxyapatite for lengthening bones." },
    meno: { name: "menopause · estrogen falls", v: { pth: .5, d3: .5, ctn: .5, gut: .5, rca: .5, rp: .5, res: .9, ca: .5 }, en: "both", pit: "ok", noE: true,
      trig: "Estrogen falls", net: "Blood calcium normal, bone lost",
      text: "Normally estrogen keeps bone breakdown in check by blocking PTH's ability to make osteoblasts activate osteoclasts. At menopause (around 50) estrogen drops off a cliff, the brake comes off, and resorption runs ahead of formation: osteoporosis, often first seen as dorsal kyphosis. Men are spared until andropause, around 75 to 80. Long-term glucocorticoids do something similar: they put osteoblasts \"in overdrive,\" continuously stimulating osteoclasts." },
  },
};

function caSvg(v, key, t, D) {
  var sc = D.SC[key], f = function (n) { return Math.round(n * 10) / 10; }, o = "";
  function tx(x, y, txt, cls, a) { return '<text class="ca-t' + (cls ? " " + cls : "") + '" x="' + f(x) + '" y="' + f(y) + '"' + (a ? ' text-anchor="' + a + '"' : "") + ">" + txt + "</text>"; }
  function lab(txt, x, y, px, py, a) { return '<g class="am-callout"><path class="ca-lead" d="M' + f(a === "end" ? x + 3 : x - 3) + " " + f(y - 4) + "L" + f(px) + " " + f(py) + '"/><circle class="ca-dot" cx="' + f(px) + '" cy="' + f(py) + '" r="1.8"/>' + tx(x, y, txt, "", a) + "</g>"; }
  function poly(p) { return "M" + p.map(function (q) { return f(q[0]) + " " + f(q[1]); }).join("L"); }
  function along(p, u) {
    var L = [], tot = 0;
    for (var i = 1; i < p.length; i++) { var d = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); L.push(d); tot += d; }
    var s = u * tot;
    for (var j = 0; j < L.length; j++) { if (s <= L[j] || j === L.length - 1) { var w = L[j] ? Math.min(1, s / L[j]) : 0; return [p[j][0] + (p[j + 1][0] - p[j][0]) * w, p[j][1] + (p[j + 1][1] - p[j][1]) * w]; } s -= L[j]; }
  }
  function flow(p, level, cls, period, n, r) { var out = ""; for (var i = 0; i < n; i++) { var a = Math.max(0, Math.min(1, level * n - i)); if (a <= .01) continue; var u = (((t / period) + i / n) % 1 + 1) % 1, q = along(p, u); out += '<circle class="' + cls + '" cx="' + f(q[0]) + '" cy="' + f(q[1]) + '" r="' + (r || 3.2) + '" opacity="' + f(a) + '"/>'; } return out; }
  /* thyroid lobe with the parathyroid on its back */
  o += '<path class="ca-thy" d="M24 70C24 34 60 22 96 26C134 30 168 46 168 78C168 112 136 128 96 126C56 124 24 106 24 70Z"/>' + tx(96, 46, "thyroid · parathyroid", "ca-sm", "middle");
  var big = sc.pit === "adenoma";
  o += '<g class="hot" data-info="Parathyroid chief cells sense blood calcium through the calcium-sensing receptor (Gq) and release PTH. High calcium raises intracellular calcium, which inhibits PTH secretion; low calcium lets PTH secretion rise."><ellipse class="ca-para" cx="95" cy="86" rx="' + (big ? 42 : 34) + '" ry="' + (big ? 24 : 19) + '"/>' + tx(95, 90, "chief cells", "ca-in", "middle") + "</g>";
  if (big) o += '<circle class="ca-mass" cx="128" cy="100" r="11"/>';
  /* the CaSR: lit when calcium binds it */
  var lit = v.ca > .66;
  o += '<g class="hot" data-info="Calcium-sensing receptor (CaSR), Gq-coupled. Calcium stimulates it, intracellular calcium rises from internal stores, and that inhibits PTH secretion: the opposite of most secretory cells."><path class="ca-rec' + (lit ? " is-act" : "") + '" d="M' + (big ? 52 : 60) + " 78l-8 -6M" + (big ? 52 : 60) + " 78l-8 6M" + (big ? 52 : 60) + ' 78h-12"/></g>';
  if (lit) o += '<circle class="ca-ion" cx="' + (big ? 37 : 45) + '" cy="78" r="3.4"/>';
  /* PTH granules inside the gland, fewer when secretion is low */
  for (var g = 0; g < 6; g++) if (g < Math.round(v.pth * 6)) o += '<circle class="ca-pthg" cx="' + (78 + g * 7) + '" cy="' + (100 + (g % 2) * 4) + '" r="2.4"/>';
  /* thyroid follicle with a C cell beside it */
  o += '<g class="hot" data-info="C cells (parafollicular cells) sit outside the thyroid follicles and secrete calcitonin when plasma calcium rises (gastrin also stimulates them). Calcitonin isn\'t essential; its effects are opposite to PTH\'s."><circle class="ca-fol" cx="300" cy="74" r="32"/><circle class="ca-colloid" cx="300" cy="74" r="22"/><ellipse class="ca-ccell' + (v.ctn > .66 ? " is-act" : "") + '" cx="338" cy="102" rx="12" ry="9"/></g>';
  o += tx(300, 26, "thyroid C cells", "ca-sm", "middle");
  /* blood */
  o += '<rect class="ca-blood" x="12" y="150" width="376" height="44" rx="20"/>' + tx(24, 186, "blood", "ca-sm ca-onblood", "start");
  for (var b = 0; b < 9; b++) { var a = Math.max(0, Math.min(1, v.ca * 9 - b)); if (a > .01) { var bx = 30 + ((t / 90 + b * 41) % 340); o += '<circle class="ca-ion" cx="' + f(bx) + '" cy="' + (160 + (b % 3) * 8) + '" r="3" opacity="' + f(a) + '"/>'; } }
  /* the three tiles */
  o += '<rect class="ca-tile" x="12" y="212" width="118" height="216" rx="10"/><rect class="ca-tile" x="141" y="212" width="118" height="216" rx="10"/><rect class="ca-tile" x="270" y="212" width="118" height="216" rx="10"/>';
  o += tx(71, 230, "kidney", "ca-head", "middle") + tx(200, 230, "gut", "ca-head", "middle") + tx(329, 230, "bone", "ca-head", "middle");
  /* kidney: distal tubule, Ca back to blood, phosphate to urine, the two hydroxylases */
  o += '<g class="hot" data-info="Kidney: PTH increases calcium reabsorption in the distal tubule and decreases phosphate reabsorption, so phosphate is excreted (calcium and phosphate move opposite ways only here, “hint, hint, put a star by it”: it keeps them from meeting and forming kidney stones). PTH also turns on 1α-hydroxylase. Kidney disease can cut calcitriol production."><path class="ca-tube" d="M34 240V408H58V240Z"/><path class="ca-tubel" d="M46 244V404"/></g>';
  o += tx(46, 424, "urine", "ca-sm", "middle");
  o += flow(D.RCA, v.rca, "ca-ion", 1600, 4) + flow(D.RP, v.rp, "ca-po4", 1800, 4);
  if (sc.stones) o += '<path class="ca-stone" d="M40 372l6 -5l7 3l-1 7l-7 3l-6 -3Z"/><path class="ca-stone" d="M44 392l4 -3l5 2l-1 5l-5 1Z"/>';
  var on1 = sc.en === "1a" || sc.en === "both", on24 = sc.en === "24" || sc.en === "both";
  o += '<g class="hot" data-info="1α-hydroxylase (kidney) makes active 1,25-(OH)2-D3, calcitriol. Turned on by hypocalcemia, PTH and low phosphate."><rect class="ca-enz' + (on1 && sc.en !== "both" ? " is-act" : "") + '" x="66" y="326" width="58" height="22" rx="11"/>' + tx(95, 341, "1α-OHase", "ca-enzt", "middle") + "</g>";
  o += '<g class="hot" data-info="24-hydroxylase (kidney) makes inactive 24,25-(OH)2-D3. Turned on by hypercalcemia, high phosphate and calcitriol itself."><rect class="ca-enz' + (on24 && sc.en !== "both" ? " is-act" : "") + '" x="66" y="356" width="58" height="22" rx="11"/>' + tx(95, 371, "24-OHase", "ca-enzt", "middle") + "</g>";
  /* calcitriol from the kidney to the enterocyte */
  o += '<path class="ca-path" d="' + poly(D.D3) + '"/>' + flow(D.D3, v.d3, "ca-d3", 1400, 3, 3.4);
  /* gut: enterocyte with apical channel, calbindin and basolateral pump */
  o += '<rect class="ca-lumen" x="147" y="384" width="106" height="38" rx="6"/>' + tx(232, 412, "lumen", "ca-sm", "middle");
  o += '<g class="hot" data-info="Enterocyte: calcitriol binds its receptor and turns on three things: apical calcium channels (calcium in from the lumen), calbindin (carries calcium across the cell so it doesn\'t interfere with signaling) and a basolateral active pump into the blood. Its receptor is intranuclear: it works by turning genes on. Phosphate absorption rises too (how is still being worked out)."><rect class="ca-cell" x="174" y="252" width="52" height="130" rx="8"/><ellipse class="ca-nuc" cx="190" cy="300" rx="11" ry="15"/></g>';
  o += '<rect class="ca-chan' + (v.gut > .66 ? " is-act" : "") + '" x="192" y="374" width="16" height="16" rx="4"/><path class="ca-pump' + (v.gut > .66 ? " is-act" : "") + '" d="M190 252a10 10 0 0 1 20 0Z"/>';
  o += flow(D.GUT, v.gut, "ca-ion", 2000, 5);
  /* bone: matrix, osteoblast (PTH receptor), osteoclast (calcitonin receptor) */
  o += '<path class="ca-bone" d="M276 372H322Q330 388 346 388Q362 388 368 372H382V422H276Z"/>';
  for (var l = 0; l < 3; l++) o += '<path class="ca-lam" d="M282 ' + (398 + l * 8) + "H376" + '"/>';
  o += '<g class="hot" data-info="Osteoblasts build bone and carry the receptors for PTH, vitamin D3 and estrogen. PTH binds them, and they release paracrine cytokines and growth factors (RANK ligand among them) that activate osteoclasts. Estrogen blocks that signal; at menopause the brake is lost."><rect class="ca-ob" x="280" y="346" width="26" height="24" rx="5"/><circle class="ca-nuc" cx="293" cy="358" r="5"/></g>';
  var supp = v.res < .3;
  o += '<g class="hot" data-info="Osteoclasts come from the hematopoietic lineage, like monocytes and macrophages, and resorb bone, releasing calcium and phosphate into the blood. They have no PTH receptor (“It doesn’t”); they carry the calcitonin receptor: calcitonin stops bone turnover." opacity="' + (supp ? .55 : 1) + '"><path class="ca-oc" d="M318 360Q318 328 346 326Q376 328 378 360Q370 372 362 366Q354 374 346 368Q338 374 330 366Q322 372 318 360Z"/><circle class="ca-nuc" cx="334" cy="344" r="4.5"/><circle class="ca-nuc" cx="348" cy="340" r="4.5"/><circle class="ca-nuc" cx="362" cy="346" r="4.5"/></g>';
  o += flow(D.PARA, v.pth, "ca-para-d", 900, 2, 2.6);
  o += flow(D.BONE, v.res, "ca-ion", 1700, 4) + flow(D.BONE, v.res * .7, "ca-po4", 2100, 3);
  /* hormones on their way */
  o += flow(D.PTH_K, v.pth, "ca-pth", 2600, 5) + flow(D.PTH_B, v.pth, "ca-pth", 3000, 6) + flow(D.CTN, v.ctn, "ca-ctn", 2400, 5);
  if (v.ctn > .66) o += '<path class="ca-block" d="M362 314l10 10M372 314l-10 10"/>';
  /* callouts */
  o += lab("CaSR (Gq)", 34, 140, 50, 80, "start");
  o += lab("tubule", 68, 266, 58, 262, "start");
  o += lab("channel", 236, 368, 208, 380, "start");
  o += lab("pump", 236, 262, 210, 250, "start");
  o += lab("osteoblast", 282, 290, 292, 344, "start");
  o += lab("osteoclast", 384, 316, 362, 330, "end");
  if (sc.pit === "adenoma") o += lab("adenoma", 168, 132, 132, 104, "start");
  return o;
}

/* the hormone panel, as HTML so it reflows under the drawing on phones */
function caLabs(v, key, D) {
  var sc = D.SC[key], o = '<div class="hp-lh">Hormones</div><p class="ca-trig">' + sc.trig + "</p>";
  D.GAUGES.forEach(function (g) {
    var k = g[0], val = v[k], word = val > .66 ? "high" : val < .34 ? "low" : "normal";
    o += '<div class="hp-row"><span class="hp-gl">' + g[1] + '</span><b class="hp-gw hp-w-' + word + '">' + word + '</b><span class="hp-bar"><i class="hp-norm"></i><i class="hp-mk ca-mk-' + k + '" style="left:' + (Math.round((3 + val * 94) * 10) / 10) + '%"></i></span></div>';
  });
  o += '<div class="hp-axis"><span>low</span><span>normal</span><span>high</span></div>';
  o += '<p class="hp-read"><b>' + sc.net + "</b></p>";
  o += '<p class="ca-brake">Estrogen\'s brake on bone: <b>' + (sc.noE ? "off" : "on") + "</b></p>";
  return o + '<div class="ca-key"><span><i class="ca-k-ca"></i>Ca²⁺</span><span><i class="ca-k-p"></i>phosphate</span><span><i class="ca-k-pth"></i>PTH</span><span><i class="ca-k-d3"></i>calcitriol</span><span><i class="ca-k-ctn"></i>calcitonin</span></div>';
}

const svg = figureSvg({ width: W, height: H, className: "ca-svg", label: "Calcium control: the parathyroid and thyroid C cells above the blood, and the kidney, gut and bone below.", body: caSvg(D.SC.normal.v, "normal", 0, D) });
const plate = plateHtml({ fig: "Fig 4", title: "Who moves blood calcium", hint: "pick a case · hover a part", readout: "normal", body: `<div class="hp-wrap"><div class="am-svg hp-box">${svg}</div><div class="hp-labs">${caLabs(D.SC.normal.v, "normal", D)}</div></div>` });
const controls = `<div class="am-controls" role="group" aria-label="Case"><button type="button" class="am-btn" data-cacase="low" aria-pressed="false">Calcium falls</button><button type="button" class="am-btn" data-cacase="normal" aria-pressed="true">Normal</button><button type="button" class="am-btn" data-cacase="high" aria-pressed="false">Calcium rises</button><button type="button" class="am-btn" data-cacase="hyper" aria-pressed="false">Primary hyperparathyroidism</button><button type="button" class="am-btn" data-cacase="soda" aria-pressed="false">High phosphate (soda)</button><button type="button" class="am-btn" data-cacase="meno" aria-pressed="false">Menopause</button></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Hover or tap the chief cells, the receptor, the C cells, the tubule, the hydroxylases, the enterocyte, the osteoblast or the osteoclast.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>Everything here is from the L10 notes (Dr. Galin's slides and his 10/27 lecture): the calcium-sensing receptor paradox, PTH on kidney and bone (through the osteoblast), the kidney as the one place calcium and phosphate part ways, the two hydroxylases and what turns each on, calcitriol in the enterocyte, calcitonin, estrogen's brake, the soda example and primary hyperparathyroidism.</li>
<li>Schematic and qualitative: levels are low / normal / high, not lab values; one tile per site, not to scale. Vitamin D's skin and liver steps (UV light, 25-hydroxylation) aren't drawn. Educational, not medical advice.</li></ul></details>`;

function caLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var svg = root.querySelector(".ca-svg"), labs = root.querySelector(".hp-labs"), lastLabs = "", sum = root.querySelector(".am-summary"), infoEl = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]");
  var key = "normal", v = Object.assign({}, D.SC.normal.v), frame = 0, visible = true, t0 = performance.now(), last = t0;
  function step(now) {
    var tgt = D.SC[key].v, k = 1 - Math.exp(-(now - last) / 260); last = now;
    for (var n in v) v[n] += (tgt[n] - v[n]) * (reduce.matches ? 1 : k);
    svg.innerHTML = D.caSvg(v, key, reduce.matches ? 0 : now - t0, D);
    var L = D.caLabs(v, key, D); if (L !== lastLabs) { labs.innerHTML = L; lastLabs = L; }
  }
  function loop(now) { step(now); frame = visible && !reduce.matches ? requestAnimationFrame(loop) : 0; }
  function kick() { last = performance.now(); if (!frame && visible && !reduce.matches) frame = requestAnimationFrame(loop); else if (reduce.matches) step(performance.now()); }
  function set(k) {
    key = k; sum.textContent = D.SC[k].text; if (readout) readout.textContent = D.SC[k].name;
    root.querySelectorAll("[data-cacase]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-cacase") === k)); });
    kick();
  }
  root.querySelectorAll("[data-cacase]").forEach(function (b) { b.addEventListener("click", function () { set(b.getAttribute("data-cacase")); }); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && svg.contains(el)) infoEl.textContent = el.getAttribute("data-info"); }
  svg.addEventListener("pointerover", hot); svg.addEventListener("click", hot);
  if (window.IntersectionObserver) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) kick(); }, { rootMargin: "80px" }).observe(svg);
  set("normal");
}

const CSS = `
.anima .ca-svg .ca-t{fill:var(--anatomy-text);font:12px var(--anatomy-mono);paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round}
.anima .ca-svg .ca-in{font-size:11px;font-weight:600;stroke:none}
.anima .ca-svg .ca-sm{font-size:11px;fill:var(--anatomy-muted);stroke:none}
.anima .ca-svg .ca-onblood{fill:var(--anatomy-text)}
.anima .ca-svg .ca-head{font-weight:700;font-size:12px;letter-spacing:.06em;text-transform:uppercase;fill:var(--anatomy-muted);stroke:none}
.anima .ca-svg .ca-enzt{font-size:10.5px;stroke:none}
.anima .ca-svg .ca-lead{fill:none;stroke:var(--anatomy-mid);stroke-width:.8}
.anima .ca-svg .ca-dot{fill:var(--anatomy-dot)}
.anima .ca-svg .ca-thy{fill:var(--he-colloid);stroke:var(--he-cyto-line);stroke-width:1}
.anima .ca-svg .ca-para{fill:var(--he-cyto);stroke:var(--he-mem);stroke-width:1.6}
.anima .ca-svg .ca-mass{fill:var(--he-nuc-line);stroke:var(--anatomy-lit);stroke-width:1.4}
.anima .ca-svg .ca-rec{fill:none;stroke:var(--anatomy-hi);stroke-width:2.4;stroke-linecap:round}
.anima .ca-svg .ca-rec.is-act{stroke:var(--anatomy-lit)}
.anima .ca-svg .ca-pthg{fill:var(--he-hormone)}
.anima .ca-svg .ca-fol{fill:var(--he-cyto);stroke:var(--he-mem);stroke-width:1.2}
.anima .ca-svg .ca-colloid{fill:var(--he-colloid);stroke:var(--he-cyto-line);stroke-width:.8}
.anima .ca-svg .ca-ccell{fill:var(--he-gold);stroke:var(--he-mem);stroke-width:1.2;opacity:.7}
.anima .ca-svg .ca-ccell.is-act{opacity:1;stroke:var(--anatomy-lit);stroke-width:2}
.anima .ca-svg .ca-blood{fill:var(--he-blood);stroke:var(--he-blood-line);stroke-width:1}
.anima .ca-svg .ca-tile{fill:var(--anatomy-shade-1);opacity:.55;stroke:var(--anatomy-lo);stroke-width:1}
.anima .ca-svg .ca-tube{fill:var(--he-colloid);stroke:var(--he-mem);stroke-width:2}
.anima .ca-svg .ca-tubel{stroke:var(--he-cyto-line);stroke-width:.8;stroke-dasharray:3 4}
.anima .ca-svg .ca-stone{fill:var(--he-bone);stroke:var(--he-bone-line);stroke-width:1.2}
.anima .ca-svg .ca-enz{fill:var(--surface);stroke:var(--anatomy-lo);stroke-width:1}
.anima .ca-svg .ca-enz.is-act{fill:var(--accent-soft);stroke:var(--anatomy-lit);stroke-width:1.8}
.anima .ca-svg .ca-path{fill:none;stroke:var(--anatomy-mid);stroke-width:1.2;stroke-dasharray:4 3}
.anima .ca-svg .ca-lumen{fill:var(--he-colloid);stroke:var(--he-cyto-line);stroke-width:1}
.anima .ca-svg .ca-cell{fill:var(--he-cyto);stroke:var(--he-mem);stroke-width:1.6}
.anima .ca-svg .ca-nuc{fill:var(--he-nuc);opacity:.85;stroke:var(--he-nuc-line);stroke-width:1}
.anima .ca-svg .ca-chan,.anima .ca-svg .ca-pump{fill:var(--anatomy-shade-1);stroke:var(--anatomy-hi);stroke-width:1.2}
.anima .ca-svg .ca-chan.is-act,.anima .ca-svg .ca-pump.is-act{fill:var(--accent-soft);stroke:var(--anatomy-lit);stroke-width:1.8}
.anima .ca-svg .ca-bone{fill:var(--he-bone);stroke:var(--he-bone-line);stroke-width:1.2}
.anima .ca-svg .ca-lam{stroke:var(--he-bone-line);stroke-width:.8;opacity:.6}
.anima .ca-svg .ca-ob{fill:var(--he-cyto);stroke:var(--he-mem);stroke-width:1.4}
.anima .ca-brake{margin:6px 0 0;font-size:12px;color:var(--anatomy-muted)}
.anima .ca-svg .ca-oc{fill:var(--he-cyto);stroke:var(--he-nuc-line);stroke-width:1.6}
.anima .ca-svg .ca-ion{fill:var(--he-ca)}
.anima .ca-svg .ca-po4{fill:var(--he-k)}
.anima .ca-svg .ca-pth{fill:var(--he-hormone)}
.anima .ca-svg .ca-para-d{fill:var(--he-hormone);opacity:.7}
.anima .ca-svg .ca-ctn{fill:var(--he-gold);stroke:var(--anatomy-text);stroke-width:.6}
.anima .ca-svg .ca-d3{fill:var(--he-glu);stroke:var(--anatomy-text);stroke-width:.6}
.anima .ca-svg .ca-block{stroke:var(--he-blood-line);stroke-width:2.6;stroke-linecap:round}
.anima .ca-trig{margin:0 0 10px;font-weight:700}
.anima .ca-mk-pth{background:var(--he-hormone)}
.anima .ca-key{display:flex;flex-wrap:wrap;gap:4px 12px;margin-top:10px;font-size:11px;color:var(--anatomy-muted)}
.anima .ca-key span{display:inline-flex;align-items:center;gap:5px}
.anima .ca-key i{width:9px;height:9px;border-radius:50%;display:inline-block}
.anima .ca-k-ca{background:var(--he-ca)}.anima .ca-k-p{background:var(--he-k)}.anima .ca-k-pth{background:var(--he-hormone)}
.anima .ca-k-d3{background:var(--he-glu)}.anima .ca-k-ctn{background:var(--he-gold)}
.anima .ca-mk-d3{background:var(--he-glu)}
.anima .ca-mk-ctn{background:var(--he-gold)}
`;

export function calcium() {
  return {
    id: "calcium", lec: "calcium",
    title: "Who moves blood calcium",
    caption: "Let blood calcium fall or rise, switch on a parathyroid adenoma, or try a soda habit or menopause, and follow PTH, calcitriol and calcitonin to the kidney, gut and bone.",
    html: `<div class="anima" data-anima="calcium">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: caLive.toString(),
    helpers: [caSvg, caLabs],
    data: D,
  };
}
