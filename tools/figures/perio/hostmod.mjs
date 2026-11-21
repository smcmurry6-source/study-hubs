// Fig: the host response and where host modulation acts (Periodontology S8, Dr. Litz's Nov 5 class). His flowchart,
// drawn as the cycle he describes: microbial challenge -> host immune-inflammatory response -> pro-inflammatory
// cytokines and prostaglandins (IL-1, PGE2, MMPs) -> connective tissue and bone breakdown -> clinical signs, and a deeper
// pocket holding more bacteria (the vicious cycle). Pick a treatment to see where it acts and what it slows: scaling and
// root planing on the bacterial load, NSAIDs on PGE2, Periostat on collagenase (MMPs), bisphosphonates on osteoclasts;
// "No bacteria" shows the engine doesn't start without its key (not autoimmune). Labels and text are the class's.
// Outside sources (cited in the figure) set the model's shape and the drugs' targets: Page & Kornman's pathogenesis
// model (risk factors acting on the host response), Golub's work on doxycycline and host collagenase, Vane on NSAIDs
// and prostaglandin synthesis, Russell on bisphosphonates and osteoclasts. The flow rates are schematic.
import { figureSvg, plateHtml } from "./shared.mjs";

const W = 400, H = 380;
const D = {
  /* boxes: center x, y, width, height */
  N: {
    mic: { x: 100, y: 66, w: 150, h: 58, t: ["Microbial", "challenge"], s: "bacteria and plaque" },
    host: { x: 300, y: 66, w: 156, h: 58, t: ["Host immune-", "inflammatory response"], s: "PMNs, macrophages" },
    med: { x: 312, y: 200, w: 150, h: 84, t: ["Cytokines and", "prostaglandins"], s: "" },
    brk: { x: 200, y: 320, w: 178, h: 72, t: ["Connective tissue", "and bone breakdown"], s: "" },
    sig: { x: 86, y: 200, w: 150, h: 70, t: ["Clinical signs"], s: ["deeper pockets,", "bone loss"] },
  },
  /* pills inside a box: [box, key, label, dx] */
  P: [["med", "il1", "IL-1", -48], ["med", "pge2", "PGE2", 0], ["med", "mmp", "MMPs", 48], ["brk", "col", "collagen", -38], ["brk", "bone", "bone", 38]],
  /* the cycle's five arrows (screen paths) */
  /* each with its end point and the point it arrives from (for the arrowhead) */
  E: [["M177 66L219 66", [219, 66], [177, 66]], ["M330 97C344 118 344 138 336 155", [336, 155], [344, 138]], ["M276 244C262 268 252 278 237 281", [237, 281], [252, 278]],
    ["M109 306C90 296 84 266 84 238", [84, 238], [84, 266]], ["M60 163C52 140 50 118 56 98", [56, 98], [50, 118]]],
  /* each treatment: how much of the cycle still flows on each arrow, what it blocks, what it dims */
  M: {
    cycle: { lv: [1, 1, 1, 1, 1], block: [], dim: [], drug: "", at: null },
    none: { lv: [0, 0, 0, 0, 0], block: [], dim: ["mic", "host", "med", "brk", "sig"], drug: "", at: null },
    srp: { lv: [0.35, 0.35, 0.35, 0.35, 0.35], block: [], dim: [], drug: "SRP", at: [110, 100] },
    nsaid: { lv: [1, 1, 0.55, 0.55, 0.55], block: ["pge2"], dim: ["bone"], drug: "NSAIDs", at: [312, 262] },
    bisph: { lv: [1, 1, 0.6, 0.6, 0.6], block: ["bone"], dim: [], drug: "bisphosphonates", at: [250, 369] },
    sdd: { lv: [1, 1, 0.6, 0.6, 0.6], block: ["mmp"], dim: ["col"], drug: "Periostat", at: [360, 262] },
  },
  NAME: { cycle: "untreated", none: "no bacteria", srp: "scaling and root planing", nsaid: "NSAIDs", bisph: "bisphosphonates", sdd: "Periostat" },
  STATUS: { cycle: "it feeds itself", none: "no key, no engine", srp: "the primary focus", nsaid: "PGE2 blocked", bisph: "osteoclasts slowed", sdd: "collagenase blocked" },
  SUM: {
    cycle: "Dr. Litz's flowchart. It always begins with the microbial challenge: plaque at the gingival margin. The host's immune-inflammatory response fights it, and its cells release pro-inflammatory cytokines and prostaglandins, which drive connective tissue and bone breakdown, seen as the clinical signs: deeper pockets and bone loss. A deeper pocket holds more bacteria, which calls for a bigger response: a vicious cycle. Bacteria are required but not sufficient; the host response mediates most of the destruction. Pick a treatment to see where it acts.",
    none: "Without bacteria nothing starts. Periodontal disease is not an autoimmune disease: the body doesn't destroy itself without a stimulus. The host response is the engine that takes a patient from health to disease, but it sits in the garage until someone turns the key, and the key is the bacteria.",
    srp: "Scaling and root planing acts at the start: it lowers the bacterial load that drives the host response, so the whole cycle slows. It never removes every bacterium, especially in deeper pockets and furcations, so the cycle slows but doesn't stop. Controlling the bacteria remains the primary focus; host modulation is added to it, never in place of it.",
    nsaid: "NSAIDs (aspirin, ibuprofen) inhibit the formation of prostaglandins, including PGE2, which upregulates osteoclasts and bone resorption. Given daily for up to 3 years they slowed alveolar bone destruction, but only with daily dosing, and prolonged use brings GI problems, hemorrhage from decreased platelet aggregation, and renal or hepatic impairment. So long-term NSAIDs for host modulation haven't developed.",
    bisph: "Bisphosphonates inhibit osteoclasts, so bone resorption slows (they may have anticollagenase effects too). The catch is bisphosphonate-related osteonecrosis of the jaw (BRONJ) after an invasive procedure such as an extraction or periodontal surgery, mostly with the high-dose IV forms, and the drugs stay in the body for years. BRONJ has stunted them as host modulation: no bisphosphonate is approved for periodontal disease.",
    sdd: "Periostat, sub-antimicrobial dose doxycycline (20 mg bid, a fifth of the 100 mg antibiotic dose), inhibits collagenase, particularly the collagenase made by the host's own cells such as PMNs. The bacteria are left alone, so resistance isn't evident and it can be given long term. The first FDA-approved systemic host modulation drug, always with scaling and root planing: in Caton 2000 it added statistically significant, but small, pocket reduction and attachment gain.",
  },
  HOT: {
    mic: "Microbial challenge: gram-negative bacteria in the plaque biofilm at the gingival margin. Required for periodontal disease to start and progress, but not sufficient by themselves: the key that starts the engine.",
    host: "Host immune-inflammatory response: complement calls in PMNs (the first responders, within about 24-48 hours) and releases histamine from mast cells (leaky vessels, edema); macrophages come later. Good cells, but both release cytokines.",
    med: "Pro-inflammatory cytokines and prostaglandins, released by the host's cells while they fight the bacteria.",
    il1: "IL-1, also called osteoclast activating factor: it activates osteoclasts, stimulates collagenase and activates PGE2.",
    pge2: "PGE2, a prostaglandin made by neutrophils, macrophages, fibroblasts and gingival epithelial cells in response to bacteria: it upregulates osteoclasts and bone resorption.",
    mmp: "MMPs (matrix metalloproteinases), collagenase among them: host-derived enzymes that break down connective tissue.",
    brk: "Connective tissue and bone breakdown: the collateral damage of the fight.",
    col: "Connective tissue: its collagen broken down by collagenase (MMPs).",
    bone: "Bone: resorbed by osteoclasts, which IL-1 and PGE2 upregulate.",
    sig: "Clinical signs: deeper pockets, and bone loss on radiographs. A deeper pocket is a niche for more bacteria.",
    risk: "Smoking and diabetes can compound periodontal disease. They are risk factors that can't be modified or aren't easily modified: patients with them are the ones to consider for host modulation.",
  },
};

function hmDraw(st, D) {
  var o = "", m = D.M[st.m], f = function (n) { return Math.round(n * 10) / 10; };
  function has(a, k) { return a.indexOf(k) > -1; }
  function tx(x, y, s, cls, a) { return '<text class="hm-t' + (cls ? " " + cls : "") + '" x="' + f(x) + '" y="' + f(y) + '" text-anchor="' + (a || "middle") + '">' + s + "</text>"; }
  /* the arrows: width and tone follow how much still flows */
  function head(e, s, cls) { var dx = e[0] - s[0], dy = e[1] - s[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
    return '<path class="' + cls + '" d="M' + f(e[0]) + " " + f(e[1]) + "L" + f(e[0] - ux * 9 - uy * 5) + " " + f(e[1] - uy * 9 + ux * 5) + "L" + f(e[0] - ux * 9 + uy * 5) + " " + f(e[1] - uy * 9 - ux * 5) + 'Z"/>'; }
  D.E.forEach(function (e, i) { var lv = m.lv[i], off = lv < 0.05;
    o += '<path class="hm-edge' + (off ? " is-off" : "") + '" d="' + e[0] + '" style="stroke-width:' + f(1.2 + 3.4 * lv) + '"/>' + head(e[1], e[2], "hm-headp" + (off ? " is-off" : "")); });
  o += '<g class="hm-dots"></g>';
  /* the middle of the cycle */
  o += tx(200, 126, "the vicious cycle", "hm-mid") + tx(200, 141, "a deeper pocket holds", "hm-sub") + tx(200, 153, "more bacteria", "hm-sub");
  /* risk factors feed the host response */
  o += '<g class="hot" data-info="' + D.HOT.risk + '">' + tx(300, 16, "smoking, diabetes", "hm-risk") + '<path class="hm-rarr" d="M300 20L300 29"/>' + head([300, 35], [300, 20], "hm-headr") + "</g>";
  o += tx(100, 24, "it always begins here", "hm-tag");
  /* the boxes */
  Object.keys(D.N).forEach(function (k) {
    var n = D.N[k], x0 = n.x - n.w / 2, y0 = n.y - n.h / 2, dim = has(m.dim, k), t0 = y0 + (n.t.length > 1 ? 18 : 22);
    o += '<g class="hot hm-node' + (dim ? " is-dim" : "") + (k === "mic" && st.m === "srp" ? " is-hit" : "") + '" data-info="' + D.HOT[k] + '"><rect class="hm-rect" x="' + f(x0) + '" y="' + f(y0) + '" width="' + n.w + '" height="' + n.h + '" rx="12"/>';
    n.t.forEach(function (line, i) { o += tx(n.x, t0 + i * 14, line, "hm-head"); });
    var s = typeof n.s === "string" ? (n.s ? [n.s] : []) : n.s, sy = t0 + n.t.length * 14 + 1;
    s.forEach(function (line, i) { o += tx(n.x, sy + i * 13, line, "hm-sub"); });
    o += "</g>";
  });
  /* the pills, blocked or dimmed by the treatment */
  D.P.forEach(function (p) {
    var n = D.N[p[0]], k = p[1], w = k === "col" ? 64 : 42, cx = n.x + p[3], cy = n.y + n.h / 2 - 17, bl = has(m.block, k), dm = has(m.dim, k) || has(m.dim, p[0]);
    o += '<g class="hot hm-pill' + (bl ? " is-blocked" : "") + (dm ? " is-dim" : "") + '" data-info="' + D.HOT[k] + '"><rect x="' + f(cx - w / 2) + '" y="' + f(cy - 10) + '" width="' + w + '" height="20" rx="10"/>' + tx(cx, cy + 4, p[2], "hm-pt") + "</g>";
    if (bl) o += '<path class="hm-slash" d="M' + f(cx - w / 2 - 2) + " " + f(cy + 11) + "L" + f(cx + w / 2 + 2) + " " + f(cy - 11) + '"/>';
  });
  /* the drug, where it acts */
  if (m.drug && m.at) { var bw = m.drug.length * 6.6 + 18; o += '<g class="hm-drug"><rect x="' + f(m.at[0] - bw / 2) + '" y="' + f(m.at[1] - 10) + '" width="' + f(bw) + '" height="20" rx="10"/>' + tx(m.at[0], m.at[1] + 4, m.drug, "hm-dt") + "</g>"; }
  return o;
}

const svg = figureSvg({ width: W, height: H, className: "hm-svg", label: "Dr. Litz's flowchart drawn as a cycle: microbial challenge, host immune-inflammatory response, cytokines and prostaglandins (IL-1, PGE2, MMPs), connective tissue and bone breakdown, clinical signs, and back to more bacteria. Smoking and diabetes feed into the host response. The chosen treatment is marked where it acts.", body: '<g class="hm-dyn">' + hmDraw({ m: "cycle" }, D) + "</g>" });
const plate = plateHtml({ fig: "S8 · Fig 3", title: "The host response, and host modulation", hint: "pick a treatment · tap a box", readout: D.STATUS.cycle, body: `<div class="am-svg hm-box">${svg}</div>` });
const BTN = [["cycle", "Untreated"], ["none", "No bacteria"], ["srp", "Scaling and root planing"], ["nsaid", "NSAIDs"], ["bisph", "Bisphosphonates"], ["sdd", "Periostat"]];
const controls = `<div class="am-controls" role="group" aria-label="Treatment">${BTN.map((b, i) => `<button type="button" class="am-btn" data-hmk="${b[0]}" aria-pressed="${i === 0}">${b[1]}</button>`).join("")}</div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Tap a box or a label inside one.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From Dr. Litz's Nov 5 class: the flowchart (microbial challenge, host immune-inflammatory response, pro-inflammatory cytokines and prostaglandins, connective tissue and bone breakdown, clinical signs, the vicious cycle), IL-1, PGE2 and MMPs, Reddy 2003 (the host response mediates the destruction), and what each therapy targets, with its limits.</li>
<li>Outside sources for the model and the targets: the flowchart is Page and Kornman's pathogenesis model (Periodontol 2000 1997;14:9-11), where risk factors such as smoking and diabetes act on the host response. NSAIDs block prostaglandin synthesis (Vane, Nature New Biol 1971;231:232-5). Sub-antimicrobial dose doxycycline inhibits host-derived collagenase, chiefly the neutrophils' MMP-8, without an antibacterial effect (Golub et al., Adv Dent Res 1998;12:12-26; Caton et al., J Periodontol 2000;71:521-32). Bisphosphonates bind bone mineral and inhibit the osteoclasts that resorb it (Russell, Bone 2011;49:2-19).</li>
<li>Schematic: how much flows on each arrow is a picture of "slows" or "stops", not a measured amount. The real response has many more cells and signals; only the ones taught are named. Educational, not medical advice.</li></ul></details>`;

function hmLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var svg = root.querySelector(".hm-svg"), dyn = svg.querySelector(".hm-dyn"), sum = root.querySelector(".am-summary"), info = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]");
  var st = { m: "cycle" }, raf = 0, seen = true, paths = [], t0 = 0;
  function draw() {
    dyn.innerHTML = D.hmDraw(st, D); paths = Array.prototype.slice.call(dyn.querySelectorAll(".hm-edge"));
    sum.textContent = D.SUM[st.m]; if (readout) readout.textContent = D.STATUS[st.m];
    root.querySelectorAll("[data-hmk]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-hmk") === st.m)); });
    dots(0);
  }
  /* the flow: dots run round the cycle, as many on each arrow as still flows there */
  function dots(t) {
    var g = dyn.querySelector(".hm-dots"); if (!g) return; var lv = D.M[st.m].lv, o = "";
    paths.forEach(function (p, i) { var n = Math.round(lv[i] * 4), L = p.getTotalLength ? p.getTotalLength() : 0; if (!L) return;
      for (var j = 0; j < n; j++) { var u = ((t / 2600) + j / n) % 1, q = p.getPointAtLength(u * L * 0.92); o += '<circle class="hm-dot" cx="' + q.x.toFixed(1) + '" cy="' + q.y.toFixed(1) + '" r="3"/>'; } });
    g.innerHTML = o;
  }
  function loop(now) { if (!t0) t0 = now; dots(now - t0); raf = requestAnimationFrame(loop); }
  function run() { cancelAnimationFrame(raf); if (!reduce.matches && seen) raf = requestAnimationFrame(loop); }
  if (window.IntersectionObserver) new IntersectionObserver(function (es) { seen = es[0].isIntersecting; run(); }).observe(svg);
  root.querySelectorAll("[data-hmk]").forEach(function (b) { b.addEventListener("click", function () { st.m = b.getAttribute("data-hmk"); draw(); }); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && svg.contains(el)) info.textContent = el.getAttribute("data-info"); }
  svg.addEventListener("pointerover", hot); svg.addEventListener("click", hot);
  draw(); run();
}

const CSS = `
.anima .hm-box{max-width:470px;margin:0 auto}
.anima .hm-svg .hm-t{fill:var(--anatomy-text);font:10.5px var(--anatomy-mono)}
.anima .hm-svg .hm-head{fill:var(--anatomy-strong);font-weight:700;font-size:11px}
.anima .hm-svg .hm-sub{fill:var(--anatomy-muted);font-size:10px}
.anima .hm-svg .hm-mid{fill:var(--pd-red);font-weight:700;font-size:12px}
.anima .hm-svg .hm-tag{fill:var(--anatomy-muted);font-size:10px;font-style:italic}
.anima .hm-svg .hm-risk{fill:var(--anatomy-muted);font-size:10px}
.anima .hm-svg .hm-rarr{fill:none;stroke:var(--anatomy-mid);stroke-width:1.2}
.anima .hm-svg .hm-headr{fill:var(--anatomy-mid)}
.anima .hm-svg .hm-rect{fill:var(--anatomy-face);stroke:var(--anatomy-mid);stroke-width:1.2}
.anima .hm-svg .hm-node.is-dim{opacity:.38}
.anima .hm-svg .hm-node.is-hit .hm-rect{stroke:var(--pd-drug);stroke-width:2.4}
.anima .hm-svg .hm-edge{fill:none;stroke:var(--pd-red);stroke-linecap:round;opacity:.8;transition:stroke-width .4s}
.anima .hm-svg .hm-edge.is-off{stroke:var(--anatomy-lo);stroke-dasharray:3 4;opacity:.9}
.anima .hm-svg .hm-headp{fill:var(--pd-red);opacity:.85}
.anima .hm-svg .hm-headp.is-off{fill:var(--anatomy-lo)}
.anima .hm-svg .hm-dot{fill:var(--pd-red-line);stroke:var(--surface);stroke-width:1}
.anima .hm-svg .hm-pill rect{fill:var(--pd-gum);stroke:var(--pd-gum-line);stroke-width:1}
.anima .hm-svg .hm-pt{fill:var(--anatomy-strong);font-weight:700;font-size:10px}
.anima .hm-svg .hm-pill.is-dim{opacity:.4}
.anima .hm-svg .hm-pill.is-blocked rect{fill:var(--surface);stroke:var(--pd-drug);stroke-dasharray:3 2}
.anima .hm-svg .hm-pill.is-blocked .hm-pt{fill:var(--anatomy-muted)}
.anima .hm-svg .hm-slash{stroke:var(--pd-drug);stroke-width:2.6;stroke-linecap:round}
.anima .hm-svg .hm-drug rect{fill:var(--pd-drug)}
.anima .hm-svg .hm-dt{fill:var(--surface);font-weight:700;font-size:10.5px}
.anima [data-anima="hostmod"] .am-controls{gap:6px 8px}
@media (prefers-reduced-motion: reduce){.anima .hm-svg .hm-edge{transition:none}}
`;

export function hostmod() {
  return { id: "hostmod", lec: "antibiotics-host-mod", title: "The host response, and host modulation",
    caption: "Dr. Litz's flowchart as the cycle it is: bacteria start it, the host response drives the breakdown, and a deeper pocket feeds it. Pick a treatment to see where it acts.",
    html: `<div class="anima" data-anima="hostmod">${plate}${controls}${SOURCES}</div>`, css: CSS, live: hmLive.toString(), helpers: [hmDraw], data: D };
}
