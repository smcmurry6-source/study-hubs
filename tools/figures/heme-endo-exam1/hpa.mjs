// Fig: the HPA axis and its lab patterns (Heme & Endo Exam 1, L6 Adrenal Physiology with L2's primary vs secondary
// rule and L7's taper). A schematic axis (hypothalamus, portal vessels, anterior pituitary, the adrenal on its kidney,
// the long and short feedback loops, and α-MSH reaching the skin) beside an HTML lab panel (it reflows under the
// drawing on phones) whose gauges ease to each case's pattern. Levels are qualitative (low / normal / high), as the notes give them; no values.
import { figureSvg, plateHtml } from "./shared.mjs";

const W = 400, H = 440;
const D = {
  W, H,
  PORTAL: [[170, 92], [170, 142]], VESSEL: [[170, 202], [170, 300]],
  LONG: [[228, 342], [320, 342], [320, 58], [282, 58]], LONG_P: [[320, 172], [236, 172]],
  SHORT: [[106, 172], [56, 172], [56, 58], [60, 58]], MSH: [[124, 194], [92, 226]], PILL: [[358, 300], [320, 300]],
  GAUGES: [["crh", "CRH", 72], ["acth", "ACTH", 126], ["msh", "α-MSH", 180], ["cort", "cortisol (own)", 234], ["drug", "prednisone", 288]],
  SC: {
    normal: { name: "normal", v: { crh: .5, acth: .5, cort: .5, drug: 0 }, cortex: "ok", pit: "ok",
      read: ["All in the normal range:", "feedback holds each level", "steady"],
      text: "Normal: the paraventricular nucleus releases CRH into the portal vessels; the anterior pituitary releases ACTH, which acts on the zona fasciculata through a Gs receptor; cortisol feeds back on the pituitary and hypothalamus (long loop), and ACTH can turn off CRH (short loop)." },
    addison: { name: "Addison's · primary", v: { crh: .85, acth: .95, cort: .1, drug: 0 }, cortex: "gone", pit: "ok",
      read: ["Cortisol low, ACTH high", "= primary: the adrenal", "fails"],
      text: "Addison's disease (primary adrenal insufficiency): usually autoimmune destruction of the cortex. Cortisol is low, so there's no negative feedback and ACTH is high. ACTH is cut from POMC with α-MSH, so hyperpigmentation of skin and mucous membranes follows, often in the gums, often months to years before other symptoms. Aldosterone is often lost too (treated with fludrocortisone)." },
    cushing: { name: "Cushing's disease · secondary", v: { crh: .15, acth: .88, cort: .9, drug: 0 }, cortex: "ok", pit: "adenoma",
      read: ["Cortisol high, ACTH high", "= secondary: the pituitary", "secretes on its own"],
      text: "Cushing's disease: a pituitary adenoma makes ACTH (ACTH-dependent Cushing syndrome). ACTH and cortisol are both high: secondary, autonomous pituitary secretion. The high cortisol still turns down CRH. An ectopic ACTH source, such as a neuroendocrine tumor, is the other ACTH-dependent form." },
    tumor: { name: "adrenal tumor · primary", v: { crh: .15, acth: .1, cort: .9, drug: 0 }, cortex: "tumor", pit: "ok",
      read: ["Cortisol high, ACTH low", "= primary: the adrenal", "secretes on its own"],
      text: "Adrenal cortical tumor (ACTH-independent Cushing syndrome): the cortex makes cortisol on its own, and the high cortisol correctly suppresses CRH and ACTH. Very high cortisol with low ACTH is primary, the lecture's own example." },
    pred: { name: "on prednisone · suppressed", v: { crh: .15, acth: .1, cort: .15, drug: .9 }, cortex: "rest", pit: "ok",
      read: ["ACTH low, own cortisol low,", "drug high: the axis is", "suppressed"],
      text: "Long-term prednisone: the drug raises glucocorticoid levels, and the tight feedback loop shuts down CRH and ACTH, so the patient's own cortex goes into \"rest mode.\" Months of it bring Cushing signs: truncal obesity, a moon face, thin skin, osteoporosis (ACTH-independent, from exogenous glucocorticoids)." },
    predStop: { name: "stopped suddenly · insufficiency", v: { crh: .25, acth: .15, cort: .1, drug: 0 }, cortex: "rest", pit: "ok",
      read: ["Cortisol low, ACTH low:", "adrenal insufficiency until", "the axis wakes up"],
      text: "Stopped abruptly: the drug is gone, but it takes time for the axis to wake up, and the resting cortex can't make enough cortisol: adrenal insufficiency. That is why you taper." },
    predTaper: { name: "tapered off · recovered", v: { crh: .5, acth: .5, cort: .5, drug: 0 }, cortex: "ok", pit: "ok",
      read: ["Back in the normal range:", "the axis restarted as", "the dose fell"],
      text: "Tapered: a falling dose lets the body sense the drop and restart CRH and ACTH, so the cortex wakes and cortisol comes back. That's the logic of the Medrol Dosepak (methylprednisolone, 21 tablets: 6 on day one, then 5, 4, 3, 2, 1) and prednisone dose packs." },
  },
};

function hpSvg(v, key, t, D) {
  var sc = D.SC[key], f = function (n) { return Math.round(n * 10) / 10; }, o = "", gc = Math.min(1, v.cort + v.drug);
  function tx(x, y, txt, cls, a) { return '<text class="hp-t' + (cls ? " " + cls : "") + '" x="' + f(x) + '" y="' + f(y) + '"' + (a ? ' text-anchor="' + a + '"' : "") + ">" + txt + "</text>"; }
  function lab(txt, x, y, px, py, a) { return '<g class="am-callout"><path class="hp-lead" d="M' + f(a === "end" ? x + 3 : x - 3) + " " + f(y - 4) + "L" + f(px) + " " + f(py) + '"/><circle class="hp-dot" cx="' + f(px) + '" cy="' + f(py) + '" r="1.8"/>' + tx(x, y, txt, "", a) + "</g>"; }
  function poly(p) { return "M" + p.map(function (q) { return f(q[0]) + " " + f(q[1]); }).join("L"); }
  function along(p, u) {
    var L = [], tot = 0;
    for (var i = 1; i < p.length; i++) { var d = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); L.push(d); tot += d; }
    var s = u * tot;
    for (var j = 0; j < L.length; j++) { if (s <= L[j] || j === L.length - 1) { var w = L[j] ? Math.min(1, s / L[j]) : 0; return [p[j][0] + (p[j + 1][0] - p[j][0]) * w, p[j][1] + (p[j + 1][1] - p[j][1]) * w]; } s -= L[j]; }
  }
  function flow(p, level, cls, period, n) { var out = ""; n = n || 6; for (var i = 0; i < n; i++) { var a = Math.max(0, Math.min(1, level * n - i)); if (a <= .01) continue; var u = (((t / period) + i / n) % 1 + 1) % 1, q = along(p, u); out += '<circle class="' + cls + '" cx="' + f(q[0]) + '" cy="' + f(q[1]) + '" r="3.6" opacity="' + f(a) + '"/>'; } return out; }
  function minus(x, y, a) { return '<g class="hp-inh" opacity="' + f(.25 + .75 * a) + '"><circle cx="' + x + '" cy="' + y + '" r="7"/><path d="M' + (x - 3.5) + " " + y + "h7" + '"/></g>'; }
  function adrenal(s) { var c = [170, 338], P = [[170, 298], [234, 360], [106, 360]]; return "M" + P.map(function (q) { return f(c[0] + (q[0] - c[0]) * s) + " " + f(c[1] + (q[1] - c[1]) * s); }).join("L") + "Z"; }
  /* hypothalamus */
  o += '<g class="hot" data-info="Hypothalamus: stimuli feed in (hypoglycemia, the sleep-wake cycle, stress) and the paraventricular nucleus releases CRH into the portal vessels."><ellipse class="hp-brain" cx="170" cy="58" rx="112" ry="34"/>' + tx(170, 54, "hypothalamus", "hp-in", "middle") + tx(170, 72, "paraventricular n. · CRH", "hp-sm", "middle") + "</g>";
  /* portal vessels */
  o += '<path class="hp-portal" d="M164 92V142M176 92V142"/>' + flow(D.PORTAL, v.crh, "hp-crh", 1400, 4);
  /* anterior pituitary, with an adenoma in Cushing's disease */
  o += '<g class="hot" data-info="Anterior pituitary: corticotrophs cut proopiomelanocortin (POMC) into ACTH, and the same processing releases α-MSH (plus β-endorphin and β-lipotropin)."><ellipse class="hp-pit" cx="170" cy="172" rx="64" ry="30"/>' + tx(170, 168, "anterior pituitary", "hp-in", "middle") + tx(170, 185, "POMC → ACTH, α-MSH", "hp-sm", "middle") + "</g>";
  if (sc.pit === "adenoma") o += '<g class="hot" data-info="A pituitary adenoma that makes ACTH: it keeps secreting despite high cortisol (autonomous), so ACTH and cortisol are both high."><circle class="hp-mass" cx="226" cy="190" r="12"/></g>';
  /* ACTH down the systemic vessel */
  o += '<path class="hp-vessel" d="M170 202V300"/>' + flow(D.VESSEL, v.acth, "hp-acth", 1500, 5);
  /* α-MSH to the skin */
  var pig = Math.max(0, Math.min(1, (v.acth - .5) * 2.2));
  o += '<path class="hp-msh" d="' + poly(D.MSH) + '"/>' + flow(D.MSH, v.acth, "hp-mshd", 1300, 3);
  o += '<g class="hot" data-info="α-MSH stimulates melanocytes. Excess ACTH brings excess α-MSH: hyperpigmentation of skin and mucous membranes, often the gums."><rect class="hp-skin" x="22" y="226" width="96" height="40" rx="8"/><rect class="hp-pig" x="22" y="226" width="96" height="40" rx="8" opacity="' + f(pig * .85) + '"/>' + tx(70, 250, "skin · gums", "hp-sm hp-onskin", "middle") + "</g>";
  /* kidney and adrenal */
  o += '<path class="hp-kid" d="M104 386C104 360 132 352 170 360C208 352 236 360 236 386C236 414 206 424 186 416C176 412 164 412 154 416C134 424 104 414 104 386Z"/>' + tx(170, 398, "kidney", "hp-sm", "middle");
  var cc = sc.cortex, op = cc === "gone" ? .28 : cc === "rest" ? .5 : 1;
  o += '<g class="hot" data-info="Adrenal cortex: the zona fasciculata (middle zone) makes cortisol when ACTH binds its Gs receptor (cholesterol desmolase is the rate-limiting step). The medulla, inside, makes catecholamines."><path class="hp-zg" d="' + adrenal(1) + '" opacity="' + op + '"/><path class="hp-zf" d="' + adrenal(.84) + '" opacity="' + op + '"/><path class="hp-zr" d="' + adrenal(.56) + '" opacity="' + op + '"/><path class="hp-med" d="' + adrenal(.4) + '"/></g>';
  if (cc === "gone") o += '<path class="hp-scar" d="M122 352L146 318M140 356L162 324M190 324L212 356M206 320L228 352"/>';
  if (cc === "tumor") o += '<g class="hot" data-info="An adrenal cortical tumor: it makes cortisol on its own, ACTH-independent."><circle class="hp-mass" cx="210" cy="336" r="13"/></g>';
  /* cortisol up the long loop; prednisone joins it */
  o += '<path class="hp-loop" d="' + poly(D.LONG) + '"/><path class="hp-loop" d="' + poly(D.LONG_P) + '"/>';
  o += flow(D.LONG, v.cort, "hp-cort", 3200, 8) + flow(D.LONG_P, v.cort, "hp-cort", 1000, 2);
  if (v.drug > .02) {
    o += '<g class="hot" data-info="Prednisone, an oral glucocorticoid: about 4 times cortisol\'s anti-inflammatory activity, weak salt retention. It feeds back on the axis like cortisol." opacity="' + f(Math.min(1, v.drug * 1.3)) + '"><rect class="hp-pill" x="358" y="290" width="34" height="20" rx="10"/><path class="hp-pill2" d="M375 290V310"/></g>';
    o += '<path class="hp-loop hp-drugp" d="' + poly(D.PILL) + '"/>' + flow(D.PILL, v.drug, "hp-drug", 700, 2) + flow([[320, 300], [320, 58], [282, 58]], v.drug, "hp-drug", 2600, 6);
  }
  o += '<path class="hp-loop hp-short" d="' + poly(D.SHORT) + '"/>' + flow(D.SHORT, v.acth * .6, "hp-acth", 2600, 4);
  o += minus(275, 58, gc) + minus(242, 172, gc) + minus(66, 58, v.acth);
  /* callouts */
  o += lab("portal vessels", 186, 120, 176, 116, "start");
  o += lab("short loop", 64, 132, 56, 128, "start");
  o += lab("long loop", 312, 252, 320, 248, "end");
  o += lab("zona fasciculata", 150, 288, 136, 330, "end");
  o += lab("medulla", 246, 362, 180, 344, "start");
  if (sc.pit === "adenoma") o += lab("adenoma", 262, 214, 236, 196, "start");
  if (cc === "tumor") o += lab("tumor", 262, 330, 222, 334, "start");
  if (cc === "gone") o += tx(246, 388, "cortex destroyed", "hp-warn", "start");
  if (cc === "rest") o += tx(246, 388, "cortex at rest", "hp-warn", "start");
  return o;
}

/* the lab panel, as HTML so it reflows under the drawing on phones */
function hpLabs(v, key, D) {
  var o = '<div class="hp-lh">Labs</div>';
  D.GAUGES.forEach(function (g) {
    var k = g[0], val = k === "msh" ? v.acth : v[k], off = k === "drug" && val < .02;
    var word = off ? "none" : val > .66 ? "high" : val < .34 ? "low" : "normal";
    o += '<div class="hp-row' + (off ? " is-off" : "") + '"><span class="hp-gl">' + g[1] + '</span><b class="hp-gw hp-w-' + word + '">' + word + '</b><span class="hp-bar">' + (k === "drug" ? "" : '<i class="hp-norm"></i>') + (off ? "" : '<i class="hp-mk hp-mk-' + k + '" style="left:' + (Math.round((3 + val * 94) * 10) / 10) + '%"></i>') + "</span></div>";
  });
  o += '<div class="hp-axis"><span>low</span><span>normal</span><span>high</span></div>';
  var r = D.SC[key].read;
  return o + '<p class="hp-read"><b>' + r[0] + "</b> " + r.slice(1).join(" ") + "</p>";
}

const svg = figureSvg({ width: W, height: H, className: "hp-svg", label: "The HPA axis: hypothalamus, portal vessels, anterior pituitary and the adrenal on its kidney, with feedback loops and a lab panel.", body: hpSvg(D.SC.normal.v, "normal", 0, D) });
const plate = plateHtml({ fig: "Fig 3", title: "The HPA axis and its labs", hint: "pick a case · hover a part", readout: "normal", body: `<div class="hp-wrap"><div class="am-svg hp-box">${svg}</div><div class="hp-labs">${hpLabs(D.SC.normal.v, "normal", D)}</div></div>` });
const controls = `<div class="am-controls" role="group" aria-label="Case"><button type="button" class="am-btn" data-hpcase="normal" aria-pressed="true">Normal</button><button type="button" class="am-btn" data-hpcase="addison" aria-pressed="false">Addison's</button><button type="button" class="am-btn" data-hpcase="cushing" aria-pressed="false">Cushing's disease</button><button type="button" class="am-btn" data-hpcase="tumor" aria-pressed="false">Adrenal tumor</button></div>
<div class="am-controls" role="group" aria-label="Prednisone"><span class="hp-lbl">Prednisone:</span><button type="button" class="am-btn" data-hpcase="pred" aria-pressed="false">Months on it</button><button type="button" class="am-btn" data-hpcase="predStop" aria-pressed="false">Stopped suddenly</button><button type="button" class="am-btn" data-hpcase="predTaper" aria-pressed="false">Tapered off</button></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Hover or tap the hypothalamus, the pituitary, the adrenal, the skin or the pill.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>The axis, the loops, Addison's, Cushing's forms and the hyperpigmentation are from the L6 notes (Dr. Madison); the primary vs secondary rule from L2 (Dr. Galin: target hormone against pituitary hormone); prednisone, rest mode and the taper from L7 (Dr. Fasinu).</li>
<li>Schematic and qualitative: levels are low / normal / high, not lab values. The circadian rhythm (peak about 7-8 am) and the stimuli (hypoglycemia, stress, sleep-wake) aren't drawn. Educational, not medical advice.</li></ul></details>`;

function hpLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var svg = root.querySelector(".hp-svg"), labs = root.querySelector(".hp-labs"), lastLabs = "", sum = root.querySelector(".am-summary"), infoEl = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]");
  var key = "normal", v = Object.assign({}, D.SC.normal.v), frame = 0, visible = true, t0 = performance.now(), last = t0;
  function step(now) {
    var tgt = D.SC[key].v, k = 1 - Math.exp(-(now - last) / 260); last = now;
    for (var n in v) v[n] += (tgt[n] - v[n]) * (reduce.matches ? 1 : k);
    svg.innerHTML = D.hpSvg(v, key, reduce.matches ? 0 : now - t0, D);
    var L = D.hpLabs(v, key, D); if (L !== lastLabs) { labs.innerHTML = L; lastLabs = L; }
  }
  function loop(now) { step(now); frame = visible && !reduce.matches ? requestAnimationFrame(loop) : 0; }
  function kick() { last = performance.now(); if (!frame && visible && !reduce.matches) frame = requestAnimationFrame(loop); else if (reduce.matches) step(performance.now()); }
  function set(k) {
    key = k; sum.textContent = D.SC[k].text; if (readout) readout.textContent = D.SC[k].name;
    root.querySelectorAll("[data-hpcase]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-hpcase") === k)); });
    kick();
  }
  root.querySelectorAll("[data-hpcase]").forEach(function (b) { b.addEventListener("click", function () { set(b.getAttribute("data-hpcase")); }); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && svg.contains(el)) infoEl.textContent = el.getAttribute("data-info"); }
  svg.addEventListener("pointerover", hot); svg.addEventListener("click", hot);
  if (window.IntersectionObserver) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) kick(); }, { rootMargin: "80px" }).observe(svg);
  set("normal");
}

const CSS = `
.anima .hp-wrap{display:flex;gap:14px;align-items:stretch;max-width:660px;margin:0 auto}
.anima .hp-box{flex:1 1 400px;min-width:0;max-width:420px}
.anima .hp-labs{flex:0 0 220px;align-self:center;padding:12px 14px;border-radius:10px;background:color-mix(in srgb,var(--anatomy-shade-1) 60%,transparent);box-shadow:0 0 0 1px var(--anatomy-lo);font:12px var(--anatomy-mono);color:var(--anatomy-text)}
@media (max-width:640px){.anima .hp-wrap{flex-direction:column;gap:10px}.anima .hp-box{max-width:none;flex:auto}.anima .hp-labs{flex:auto;align-self:stretch}}
.anima .hp-lh{font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--anatomy-muted);margin-bottom:8px}
.anima .hp-row{display:grid;grid-template-columns:1fr auto;gap:3px 8px;margin-bottom:10px}
.anima .hp-gw{font-weight:700}
.anima .hp-w-high{color:var(--he-blood-line)}
.anima .hp-w-low{color:var(--he-nuc-line)}
.anima .hp-w-normal,.anima .hp-w-none,.anima .hp-row.is-off .hp-gl{color:var(--anatomy-muted)}
.anima .hp-bar{grid-column:1/-1;position:relative;height:10px;border-radius:5px;background:var(--surface);box-shadow:inset 0 0 0 1px var(--anatomy-lo)}
.anima .hp-norm{position:absolute;left:33.5%;width:33%;top:1px;bottom:1px;background:var(--accent-soft)}
.anima .hp-mk{position:absolute;top:50%;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;border:2px solid var(--surface)}
.anima .hp-mk-crh{background:var(--he-nuc)}
.anima .hp-mk-acth{background:var(--he-gold)}
.anima .hp-mk-msh{background:#7a4a2a}
.anima .hp-mk-cort{background:var(--he-hormone)}
.anima .hp-mk-drug{background:var(--he-blood-line)}
.anima .hp-axis{display:flex;justify-content:space-between;font-size:10.5px;color:var(--anatomy-muted);padding-bottom:8px;border-bottom:1px solid var(--anatomy-lo)}
.anima .hp-read{margin:8px 0 0;line-height:1.45}
.anima .hp-lbl{font:600 13px var(--anatomy-mono);color:var(--anatomy-muted);align-self:center}
.anima .hp-svg .hp-t{fill:var(--anatomy-text);font:13px var(--anatomy-mono);paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round}
.anima .hp-svg .hp-in{font-weight:600;stroke:none}
.anima .hp-svg .hp-sm{font-size:11px;fill:var(--anatomy-muted);stroke:none}
.anima .hp-svg .hp-onskin{fill:var(--anatomy-text)}
.anima .hp-svg .hp-warn{fill:var(--he-blood-line);font-size:12px;font-weight:600}
.anima .hp-svg .hp-lead{fill:none;stroke:var(--anatomy-mid);stroke-width:.8}
.anima .hp-svg .hp-dot{fill:var(--anatomy-dot)}
.anima .hp-svg .hp-brain{fill:var(--he-cyto);stroke:var(--he-mem);stroke-width:1.6}
.anima .hp-svg .hp-pit{fill:var(--he-colloid);stroke:var(--he-mem);stroke-width:1.6}
.anima .hp-svg .hp-portal{fill:none;stroke:var(--he-blood-line);stroke-width:2.4;opacity:.7}
.anima .hp-svg .hp-vessel{fill:none;stroke:var(--he-blood);stroke-width:12;stroke-linecap:round}
.anima .hp-svg .hp-msh{fill:none;stroke:var(--anatomy-mid);stroke-width:1.2;stroke-dasharray:3 3}
.anima .hp-svg .hp-loop{fill:none;stroke:var(--anatomy-mid);stroke-width:1.4;stroke-dasharray:5 4}
.anima .hp-svg .hp-drugp{stroke:var(--he-blood-line)}
.anima .hp-svg .hp-skin{fill:var(--he-cyto);stroke:var(--he-mem);stroke-width:1.2}
.anima .hp-svg .hp-pig{fill:#7a4a2a}
.anima .hp-svg .hp-kid{fill:var(--he-blood);stroke:var(--he-blood-line);stroke-width:1.2}
.anima .hp-svg .hp-zg{fill:var(--he-gold);stroke:var(--he-mem);stroke-width:1.2;stroke-linejoin:round}
.anima .hp-svg .hp-zf{fill:var(--he-glu);stroke:var(--he-mem);stroke-width:.8;stroke-linejoin:round}
.anima .hp-svg .hp-zr{fill:var(--he-gold);stroke:var(--he-mem);stroke-width:.8;stroke-linejoin:round}
.anima .hp-svg .hp-med{fill:var(--he-nuc);opacity:.8;stroke:var(--he-nuc-line);stroke-width:.8;stroke-linejoin:round}
.anima .hp-svg .hp-scar{fill:none;stroke:var(--he-blood-line);stroke-width:1.6;stroke-linecap:round;opacity:.8}
.anima .hp-svg .hp-mass{fill:var(--he-nuc-line);stroke:var(--anatomy-lit);stroke-width:1.6}
.anima .hp-svg .hp-pill{fill:var(--anatomy-face);stroke:var(--he-blood-line);stroke-width:1.6}
.anima .hp-svg .hp-pill2{stroke:var(--he-blood-line);stroke-width:1.2}
.anima .hp-svg .hp-crh{fill:var(--he-nuc)}
.anima .hp-svg .hp-acth{fill:var(--he-gold);stroke:var(--anatomy-text);stroke-width:.6}
.anima .hp-svg .hp-mshd{fill:#7a4a2a}
.anima .hp-svg .hp-cort{fill:var(--he-hormone)}
.anima .hp-svg .hp-drug{fill:var(--he-blood-line)}
.anima .hp-svg .hp-inh circle{fill:var(--surface);stroke:var(--he-blood-line);stroke-width:1.6}
.anima .hp-svg .hp-inh path{stroke:var(--he-blood-line);stroke-width:2;stroke-linecap:round}
`;

export function hpa() {
  return {
    id: "hpa", lec: "adrenal",
    title: "The HPA axis and its lab patterns",
    caption: "Switch between normal, Addison's disease, Cushing's disease, an adrenal tumor and long-term prednisone, and watch the feedback loops and the labs change.",
    html: `<div class="anima" data-anima="hpa">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: hpLive.toString(),
    helpers: [hpSvg, hpLabs],
    data: D,
  };
}
