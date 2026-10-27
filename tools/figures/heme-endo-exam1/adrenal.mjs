// Fig: the adrenal from capsule to medulla (Heme & Endo Exam 1, L6 Adrenal Physiology and L9 Endocrine Histology II).
// A schematic column through the gland: the capsule with its subcapsular plexus, the zona glomerulosa's arches, the
// fasciculata's straight cords of spongiocytes with sinusoids between them, the reticularis' network and the medulla's
// chromaffin cells around the central vein, with each zone's share, product and stimulus beside it. Blood runs from
// capsule to medulla (sinusoids) and straight through (long medullary arteries); in a stress response cortisol rides
// that blood down to the medulla and turns on PNMT. Shares are the notes' own; the rest is schematic, not to scale.
import { figureSvg, plateHtml } from "./shared.mjs";

const W = 540, H = 460;
const D = {
  W, H, ZG: [38, 70], ZF: [70, 252], ZR: [252, 276], MED: [276, 446],
  S: [[[85, 40], [85, 276], [150, 362]], [[205, 40], [205, 276], [178, 352]], [[295, 40], [295, 276], [200, 364]], [[55, 40], [55, 276], [150, 372]]],
  ART: [[262, 22], [262, 300], [200, 368]],
  CLUS: [[82, 318], [252, 318], [116, 400], [244, 404]],
  FIBER: [[4, 296], [40, 300], [70, 312]],
  SC: {
    rest: { name: "at rest", stress: 0,
      text: "Blood runs from the capsule inward. Arteries form a subcapsular plexus; short cortical arteries become sinusoids that run through all three zones and drain at the corticomedullary junction into the medulla, carrying cortical hormones with them; long medullary arteries pass straight through and capillarize in the medulla. So the medulla has a dual supply. Its sinusoids collect into a central vein, which leaves as the suprarenal vein." },
    stress: { name: "stress · cortisol → PNMT", stress: 1,
      text: "Stress response: ACTH drives the fasciculata, and the cortisol it makes flows with the blood from cortex to medulla, where it activates PNMT (norepinephrine → epinephrine). Sympathetic preganglionic fibers release acetylcholine onto chromaffin cells: they depolarize, calcium flows in, and they release epinephrine and norepinephrine, about 80% epinephrine. Acetylcholine and ACTH also activate tyrosine hydroxylase and dopamine beta-hydroxylase." },
  },
};

/* the static histology, built once */
function adBase(D) {
  var o = "", f = function (n) { return Math.round(n * 10) / 10; };
  function tx(x, y, txt, cls, a) { return '<text class="ad-t' + (cls ? " " + cls : "") + '" x="' + f(x) + '" y="' + f(y) + '"' + (a ? ' text-anchor="' + a + '"' : "") + ">" + txt + "</text>"; }
  /* zone backgrounds */
  o += '<rect class="ad-zg" x="20" y="38" width="310" height="32"/><rect class="ad-zf" x="20" y="70" width="310" height="182"/><rect class="ad-zr" x="20" y="252" width="310" height="24"/><rect class="ad-med" x="20" y="276" width="310" height="170" rx="0"/>';
  /* capsule and subcapsular plexus */
  o += '<g class="hot" data-info="Capsule: connective tissue around both cortex and medulla. Arteries penetrate it and form a subcapsular plexus."><rect class="ad-cap" x="20" y="18" width="310" height="20" rx="4"/>';
  for (var c = 0; c < 6; c++) o += '<path class="ad-fib" d="M' + (30 + c * 50) + " 24q20 4 40 0" + '"/>';
  o += '</g><path class="ad-plex" d="M22 37H328"/>';
  /* zona glomerulosa: arches of cells */
  o += '<g class="hot" data-info="Zona glomerulosa (outer, about 10-15% of the cortex): cells in arches. The only zone with aldosterone synthase, so the sole source of aldosterone; driven by angiotensin II and potassium (ACTH only a little).">';
  for (var g = 0; g < 5; g++) { var x = 52 + g * 60; o += '<path class="ad-arch" d="M' + (x - 20) + " 70Q" + (x - 20) + " 44 " + x + " 44Q" + (x + 20) + " 44 " + (x + 20) + ' 70"/>'; for (var n = 0; n < 5; n++) { var a = Math.PI * (n / 4); o += '<circle class="ad-n" cx="' + f(x - Math.cos(a) * 20) + '" cy="' + f(70 - Math.sin(a) * 26 + 2) + '" r="2.2"/>'; } }
  o += "</g>";
  /* zona fasciculata: straight cords of spongiocytes, sinusoids between */
  o += '<g class="hot" data-info="Zona fasciculata (middle, 65-80%, the largest): straight cords of spongiocytes, full of lipid droplets (stored cholesterol). Makes cortisol (and corticosterone, some androgens) in response to ACTH.">';
  for (var k = 0; k < 10; k++) for (var r = 0; r < 12; r++) { var cx = 26 + k * 30, cy = 73 + r * 15; o += '<rect class="ad-spong" x="' + cx + '" y="' + cy + '" width="22" height="13" rx="3"/><circle class="ad-lip" cx="' + (cx + 5) + '" cy="' + (cy + 4.5) + '" r="2"/><circle class="ad-lip" cx="' + (cx + 17) + '" cy="' + (cy + 8.5) + '" r="2"/><circle class="ad-n" cx="' + (cx + 11) + '" cy="' + (cy + 6.5) + '" r="2"/>'; }
  o += "</g>";
  for (var s = 0; s < 9; s++) o += '<path class="ad-sin" d="M' + (51 + s * 30) + " 40V276" + '"/>';
  /* zona reticularis: a network of cords */
  o += '<g class="hot" data-info="Zona reticularis (inner, about 5-10%): a network of anastomosing cords. Makes weak androgens (DHEA, androstenedione) in response to ACTH."><path class="ad-ret" d="M20 258L50 270L80 258L110 270L140 258L170 270L200 258L230 270L260 258L290 270L320 258"/><path class="ad-ret" d="M20 272L50 260L80 272L110 260L140 272L170 260L200 272L230 260L260 272L290 260L320 272"/></g>';
  /* medulla: sinusoids, central vein, chromaffin clusters, sympathetic fiber */
  o += '<path class="ad-msin" d="M55 278Q90 330 150 372M85 278Q110 330 150 362M205 278Q200 320 178 352M295 278Q260 330 200 364"/>';
  o += '<path class="ad-art" d="M262 18V300Q240 340 200 368"/>';
  o += '<g class="hot" data-info="Central vein: the medullary sinusoids collect into it, and it leaves the gland as the suprarenal vein."><path class="ad-vein" d="M175 380V458"/><ellipse class="ad-cv" cx="175" cy="366" rx="28" ry="18"/></g>';
  o += '<g class="hot" data-info="Chromaffin cells: modified postganglionic sympathetic neurons with no axons. Acetylcholine from preganglionic fibers depolarizes them, calcium flows in, and they release epinephrine and norepinephrine into the blood (about 80% epinephrine, because they are rich in PNMT).">';
  D.CLUS.forEach(function (c) { for (var i = 0; i < 6; i++) { var a = i * 1.047, x = c[0] + Math.cos(a) * 15, y = c[1] + Math.sin(a) * 11; o += '<circle class="ad-chrom" cx="' + f(x) + '" cy="' + f(y) + '" r="8.5"/><circle class="ad-gran" cx="' + f(x - 2) + '" cy="' + f(y - 2) + '" r="1.4"/><circle class="ad-gran" cx="' + f(x + 2.5) + '" cy="' + f(y + 1.5) + '" r="1.4"/>'; } });
  o += "</g>";
  o += '<path class="ad-nerve" d="M4 296Q40 300 70 312"/><circle class="ad-bouton" cx="70" cy="312" r="3.6"/>';
  /* side column: zone, share, product, stimulus */
  function brace(y0, y1) { return '<path class="ad-brace" d="M338 ' + (y0 + 1) + "H342V" + (y1 - 1) + "H338" + '"/>'; }
  o += brace(18, 38) + tx(350, 32, "capsule", "ad-zn", "start");
  o += brace(38, 70) + tx(350, 50, "glomerulosa · 10-15%", "ad-zn", "start") + tx(350, 65, "aldosterone · Ang II, K⁺", "ad-zs", "start");
  o += brace(70, 252) + tx(350, 140, "fasciculata · 65-80%", "ad-zn", "start") + tx(350, 156, "cortisol · ACTH", "ad-zs", "start") + tx(350, 172, "spongiocytes:", "ad-zs", "start") + tx(350, 186, "lipid droplets", "ad-zs", "start");
  o += brace(252, 276) + tx(350, 262, "reticularis · 5-10%", "ad-zn", "start") + tx(350, 276, "DHEA · ACTH", "ad-zs", "start");
  o += brace(276, 446) + tx(350, 312, "medulla", "ad-zn", "start") + tx(350, 328, "chromaffin cells", "ad-zs", "start") + tx(350, 344, "~80% epinephrine", "ad-zs", "start") + tx(350, 360, "ACh from sympathetic", "ad-zs", "start") + tx(350, 374, "preganglionic fibers", "ad-zs", "start");
  /* callouts */
  function lab(txt, x, y, px, py, a) { return '<g class="am-callout"><path class="ad-lead" d="M' + f(a === "end" ? x + 3 : x - 3) + " " + f(y - 4) + "L" + f(px) + " " + f(py) + '"/><circle class="ad-dot" cx="' + f(px) + '" cy="' + f(py) + '" r="1.8"/>' + tx(x, y, txt, "ad-cl", a) + "</g>"; }
  o += lab("central vein", 350, 410, 202, 370, "start");
  o += lab("suprarenal vein", 350, 440, 177, 446, "start");
  o += lab("long medullary artery", 350, 228, 263, 214, "start");
  o += lab("sympathetic fiber", 8, 288, 30, 298, "start");
  return o;
}

function adDyn(v, t, D) {
  var f = function (n) { return Math.round(n * 10) / 10; }, o = "", st = v.stress;
  function along(p, u) {
    var L = [], tot = 0;
    for (var i = 1; i < p.length; i++) { var d = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); L.push(d); tot += d; }
    var s = u * tot;
    for (var j = 0; j < L.length; j++) { if (s <= L[j] || j === L.length - 1) { var w = L[j] ? Math.min(1, s / L[j]) : 0; return [p[j][0] + (p[j + 1][0] - p[j][0]) * w, p[j][1] + (p[j + 1][1] - p[j][1]) * w]; } s -= L[j]; }
  }
  function dots(p, n, cls, period, a, r, off, u0) { var out = ""; for (var i = 0; i < n; i++) { var al = Math.max(0, Math.min(1, a * n - i)); if (al <= .01) continue; var u = (((t / period) + i / n + (off || 0)) % 1 + 1) % 1; u = (u0 || 0) + u * (1 - (u0 || 0)); var q = along(p, u); out += '<circle class="' + cls + '" cx="' + f(q[0]) + '" cy="' + f(q[1]) + '" r="' + (r || 3) + '" opacity="' + f(al * Math.min(1, (1 - u) * 8)) + '"/>'; } return out; }
  /* blood down the sinusoids and the long medullary artery */
  D.S.forEach(function (p, i) { o += dots(p, 5, "ad-rbc", 5200, 1, 2.6, i * .13); });
  o += dots(D.ART, 4, "ad-rbc", 2600, 1, 2.6);
  /* aldosterone joins in the glomerulosa, cortisol in the fasciculata (more with ACTH in stress) */
  D.S.forEach(function (p, i) { o += dots(p, 3, "ad-aldo", 5200, 1, 2.8, i * .21, .06); o += dots(p, 6, "ad-cort", 4600, .35 + .65 * st, 3.2, i * .17, .28); });
  /* ACTH arriving from the capsule in stress */
  if (st > .02) for (var a = 0; a < 6; a++) { var x = 40 + a * 52, u = ((t / 1800 + a / 6) % 1); o += '<circle class="ad-acth" cx="' + x + '" cy="' + f(12 + u * 60) + '" r="3" opacity="' + f(st * Math.min(1, (1 - u) * 5)) + '"/>'; }
  /* acetylcholine down the sympathetic fiber, then catecholamines out of the chromaffin clusters */
  if (st > .02) o += dots(D.FIBER, 3, "ad-ach", 900, st, 2.6);
  var rel = .25 + .75 * st;
  D.CLUS.forEach(function (c, i) { var p = [[c[0], c[1]], [175 + (c[0] < 175 ? -18 : 18), 366]]; for (var j = 0; j < 5; j++) { var cls = j === 4 ? "ad-ne" : "ad-epi"; o += dots(p, 1, cls, 2200, rel, 3, i * .23 + j * .2); } });
  /* PNMT badge, lit as cortisol arrives */
  o += '<g class="hot" data-info="PNMT (phenylethanolamine N-methyltransferase) converts norepinephrine to epinephrine. Cortisol activates it, and the cortical blood brings cortisol straight to the medulla."><rect class="ad-pnmt" x="276" y="352" width="50" height="20" rx="10" opacity="' + f(.45 + .55 * st) + '"/><text class="ad-t ad-pt" x="301" y="366" text-anchor="middle">PNMT</text></g>';
  return o;
}

const svg = figureSvg({ width: W, height: H, className: "ad-svg", label: "A column through the adrenal: capsule, zona glomerulosa, fasciculata and reticularis, and the medulla with its central vein, each zone labeled with its share and product.", body: adBase(D) + '<g class="ad-dyn">' + adDyn({ stress: 0 }, 0, D) + "</g>" });
const plate = plateHtml({ fig: "Fig 6", title: "Capsule to medulla", hint: "pick a state · hover a zone", readout: "at rest", body: `<div class="am-svg ad-box">${svg}</div>` });
const controls = `<div class="am-controls" role="group" aria-label="State"><button type="button" class="am-btn" data-adcase="rest" aria-pressed="true">At rest</button><button type="button" class="am-btn" data-adcase="stress" aria-pressed="false">Stress response</button></div>
<div class="ad-key"><span><i class="ad-k-rbc"></i>blood</span><span><i class="ad-k-aldo"></i>aldosterone</span><span><i class="ad-k-cort"></i>cortisol</span><span><i class="ad-k-acth"></i>ACTH</span><span><i class="ad-k-ach"></i>acetylcholine</span><span><i class="ad-k-epi"></i>epinephrine</span><span><i class="ad-k-ne"></i>norepinephrine</span></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Hover or tap the capsule, a zone, the chromaffin cells, PNMT or the central vein.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>Zones, shares, spongiocytes, the blood supply and chromaffin secretion are from the L9 notes (Dr. Herr's slides; recording not in yet); products, stimuli, PNMT and cortisol's role in the medulla from the L6 notes (Dr. Madison). L9 lists ACTH among the glomerulosa's stimuli; L6 says ACTH acts there only a little, which is what's shown.</li>
<li>Schematic: the zones' heights follow their shares, but cells, vessels and the medulla aren't to scale, and one column stands for the whole gland. Educational, not medical advice.</li></ul></details>`;

function adLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var svg = root.querySelector(".ad-svg"), dyn = svg.querySelector(".ad-dyn"), sum = root.querySelector(".am-summary"), infoEl = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]");
  var key = "rest", v = { stress: 0 }, frame = 0, visible = true, t0 = performance.now(), last = t0;
  function step(now) { var k = 1 - Math.exp(-(now - last) / 300); last = now; v.stress += (D.SC[key].stress - v.stress) * (reduce.matches ? 1 : k); dyn.innerHTML = D.adDyn(v, reduce.matches ? 0 : now - t0, D); }
  function loop(now) { step(now); frame = visible && !reduce.matches ? requestAnimationFrame(loop) : 0; }
  function kick() { last = performance.now(); if (!frame && visible && !reduce.matches) frame = requestAnimationFrame(loop); else if (reduce.matches) step(performance.now()); }
  function set(k) { key = k; sum.textContent = D.SC[k].text; if (readout) readout.textContent = D.SC[k].name; root.querySelectorAll("[data-adcase]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-adcase") === k)); }); kick(); }
  root.querySelectorAll("[data-adcase]").forEach(function (b) { b.addEventListener("click", function () { set(b.getAttribute("data-adcase")); }); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && svg.contains(el)) infoEl.textContent = el.getAttribute("data-info"); }
  svg.addEventListener("pointerover", hot); svg.addEventListener("click", hot);
  if (window.IntersectionObserver) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) kick(); }, { rootMargin: "80px" }).observe(svg);
  set("rest");
}

const CSS = `
.anima .ad-box{max-width:580px;margin:0 auto}
.anima .ad-key{display:flex;flex-wrap:wrap;gap:4px 14px;margin:2px 0 6px;font:12px var(--anatomy-mono);color:var(--anatomy-muted)}
.anima .ad-key span{display:inline-flex;align-items:center;gap:5px}
.anima .ad-key i{width:9px;height:9px;border-radius:50%;display:inline-block}
.anima .ad-k-rbc{background:var(--he-rbc)}.anima .ad-k-aldo{background:var(--he-gold)}.anima .ad-k-cort{background:var(--he-hormone)}
.anima .ad-k-acth{background:var(--he-glu)}.anima .ad-k-ach{background:var(--anatomy-lit)}.anima .ad-k-epi{background:var(--he-k)}.anima .ad-k-ne{background:var(--he-nuc)}
.anima .ad-svg .ad-t{fill:var(--anatomy-text);font:12px var(--anatomy-mono)}
.anima .ad-svg .ad-zn{font-weight:700;font-size:12px}
.anima .ad-svg .ad-zs{font-size:11px;fill:var(--anatomy-muted)}
.anima .ad-svg .ad-cl{font-size:11px;paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round}
.anima .ad-svg .ad-pt{font-size:10.5px;font-weight:700}
.anima .ad-svg .ad-lead{fill:none;stroke:var(--anatomy-mid);stroke-width:.8}
.anima .ad-svg .ad-dot{fill:var(--anatomy-dot)}
.anima .ad-svg .ad-brace{fill:none;stroke:var(--anatomy-mid);stroke-width:1.2}
.anima .ad-svg .ad-cap{fill:var(--he-bone);stroke:var(--he-bone-line);stroke-width:1}
.anima .ad-svg .ad-fib{fill:none;stroke:var(--he-bone-line);stroke-width:.8}
.anima .ad-svg .ad-plex{stroke:var(--he-blood-line);stroke-width:2.4}
.anima .ad-svg .ad-zg{fill:var(--he-gold);opacity:.22}
.anima .ad-svg .ad-zf{fill:var(--he-hormone);opacity:.1}
.anima .ad-svg .ad-zr{fill:var(--he-nuc);opacity:.22}
.anima .ad-svg .ad-med{fill:var(--he-nuc);opacity:.12}
.anima .ad-svg .ad-arch{fill:none;stroke:var(--he-cyto-line);stroke-width:11;stroke-linecap:round;opacity:.55}
.anima .ad-svg .ad-n{fill:var(--he-nuc-line)}
.anima .ad-svg .ad-spong{fill:var(--he-cyto);stroke:var(--he-mem);stroke-width:.8}
.anima .ad-svg .ad-lip{fill:var(--surface);stroke:var(--he-cyto-line);stroke-width:.5}
.anima .ad-svg .ad-sin{stroke:var(--he-blood-line);stroke-width:1.4;opacity:.55}
.anima .ad-svg .ad-ret{fill:none;stroke:var(--he-cyto-line);stroke-width:7;stroke-linejoin:round;opacity:.6}
.anima .ad-svg .ad-msin{fill:none;stroke:var(--he-blood-line);stroke-width:1.6;opacity:.55}
.anima .ad-svg .ad-art{fill:none;stroke:var(--he-blood-line);stroke-width:3.2}
.anima .ad-svg .ad-vein{stroke:var(--he-blood);stroke-width:16;stroke-linecap:round}
.anima .ad-svg .ad-cv{fill:var(--he-blood);stroke:var(--he-blood-line);stroke-width:1.4}
.anima .ad-svg .ad-chrom{fill:var(--he-cyto);stroke:var(--he-nuc-line);stroke-width:1.1}
.anima .ad-svg .ad-gran{fill:var(--he-nuc-line)}
.anima .ad-svg .ad-nerve{fill:none;stroke:var(--anatomy-hi);stroke-width:2}
.anima .ad-svg .ad-bouton{fill:var(--anatomy-hi)}
.anima .ad-svg .ad-rbc{fill:var(--he-rbc)}
.anima .ad-svg .ad-aldo{fill:var(--he-gold)}
.anima .ad-svg .ad-cort{fill:var(--he-hormone);stroke:var(--surface);stroke-width:.8}
.anima .ad-svg .ad-acth{fill:var(--he-glu)}
.anima .ad-svg .ad-ach{fill:var(--anatomy-lit)}
.anima .ad-svg .ad-epi{fill:var(--he-k);stroke:var(--surface);stroke-width:.8}
.anima .ad-svg .ad-ne{fill:var(--he-nuc);stroke:var(--surface);stroke-width:.8}
.anima .ad-svg .ad-pnmt{fill:var(--accent-soft);stroke:var(--anatomy-lit);stroke-width:1.4}
`;

export function adrenal() {
  return {
    id: "adrenal", lec: "adrenal",
    title: "The adrenal from capsule to medulla",
    caption: "The three cortical zones and the medulla with their shares and products, the blood that runs from cortex to medulla, and what a stress response adds.",
    html: `<div class="anima" data-anima="adrenal">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: adLive.toString(),
    helpers: [adBase, adDyn],
    data: D,
  };
}
