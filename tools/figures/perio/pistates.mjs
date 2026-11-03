// Fig: peri-implant health, mucositis and peri-implantitis (Periodontology S7, Dr. Kaur, Oct 29 class + slides).
// One implant in section with its crown, the mucosa, a plastic probe in the sulcus and the bone on both sides. The
// three 2017 World Workshop states: health (no inflammation, no bleeding, probing depth at its baseline, bone at the
// level left by initial remodeling), mucositis (red, swollen mucosa, profuse bleeding, deeper probing from the swelling,
// bone unchanged) and peri-implantitis (the same plus bone lost beyond the remodeling line). The ~2 mm remodeling is
// what she said in class (the slides give no number). Depths are schematic (7.5 px = 1 mm), not a patient's.
import { figureSvg, plateHtml } from "./shared.mjs";

const W = 540, H = 380, MM = 7.5;
const D = {
  W, H, MM, X0: 236, X1: 304, PLAT: 150, APEX: 334,
  SC: {
    health: { name: "peri-implant health", red: 0, swell: 0, bleed: 0, pus: 0, pd: 4, bone: 0,
      text: "Health: no signs of inflammation, no bleeding or suppuration on gentle probing, no increase in probing depth compared with previous exams, and no bone loss beyond the crestal changes from initial remodeling. This implant probes 4 mm, more than 3 mm and still healthy: it matches its own baseline." },
    muc: { name: "peri-implant mucositis", red: 1, swell: 1, bleed: 1, pus: 0, pd: 5.5, bone: 0,
      text: "Mucositis, the implant's gingivitis: red, swollen mucosa, profuse (line or drop) bleeding and/or suppuration on gentle probing, and a deeper probing depth than at baseline. The pocket is deeper because the swollen tissue adds height, not because bone was lost: the bone still sits at the remodeling line. It is reversible, so treat it." },
    pi: { name: "peri-implantitis", red: 1, swell: .8, bleed: 1, pus: 1, pd: 8, bone: 1,
      text: "Peri-implantitis: inflammation, bleeding and/or suppuration, increased probing depth, and bone loss beyond the crestal changes from initial remodeling, the one finding mucositis never has. Suppuration means active disease: do something now. Bone around implants is hard to regrow because no method reliably decontaminates the rough surface." },
  },
};

function piBase(D) {
  var o = "", f = function (n) { return Math.round(n * 10) / 10; }, X0 = D.X0, X1 = D.X1;
  /* implant body with threads */
  o += '<g class="hot" data-info="Implant body (titanium), roughened so osteoblasts attach. Plaque attaches too, and no decontamination method (saline, chlorhexidine, citric acid, EDTA, laser) works better than another."><path class="pi-ti" d="M' + X0 + " " + D.PLAT + "H" + X1 + "V" + (D.APEX - 18) + "Q" + X1 + " " + D.APEX + " " + (X0 + X1) / 2 + " " + D.APEX + "Q" + X0 + " " + D.APEX + " " + X0 + " " + (D.APEX - 18) + 'Z"/>';
  for (var y = D.PLAT + 14; y < D.APEX - 16; y += 13) o += '<path class="pi-thread" d="M' + (X0 - 5) + " " + y + "L" + X0 + " " + (y - 5) + "M" + (X1 + 5) + " " + y + "L" + X1 + " " + (y - 5) + '"/>';
  o += "</g>";
  /* abutment and crown */
  o += '<g class="hot" data-info="Abutment and crown. Their height, and how deep the implant sits, set how deep a healthy sulcus probes, which is why there is no 3 mm cutoff for implants."><path class="pi-ti" d="M' + (X0 + 10) + " " + D.PLAT + "V100H" + (X1 - 10) + "V" + D.PLAT + 'Z"/><path class="pi-crown" d="M' + (X0 + 8) + " 112C" + (X0 - 4) + " 96 " + (X0 - 30) + " 80 " + (X0 - 28) + " 52Q" + (X0 - 24) + " 26 " + (X0 + X1) / 2 + " 22Q" + (X1 + 24) + " 26 " + (X1 + 28) + " 52C" + (X1 + 30) + " 80 " + (X1 + 4) + " 96 " + (X1 - 8) + ' 112Z"/></g>';
  return o;
}

function piDyn(v, t, D) {
  var o = "", f = function (n) { return Math.round(n * 10) / 10; }, X0 = D.X0, X1 = D.X1, MM = D.MM;
  var crest = D.PLAT + 2 * MM + v.bone * 4 * MM; /* crest beside the implant */
  var far = D.PLAT + 2 * MM + v.bone * 1.2 * MM; /* crest away from it: a saucer-shaped defect */
  function bone(side) {
    var s = side < 0, xIn = s ? X0 - 1 : X1 + 1, xOut = s ? 48 : D.W - 48, xMid = s ? X0 - 70 : X1 + 70;
    return '<path class="pi-bone" d="M' + xOut + " " + f(far) + "C" + xMid + " " + f(far) + " " + (s ? X0 - 26 : X1 + 26) + " " + f(crest) + " " + xIn + " " + f(crest) + "V" + (D.H - 14) + "H" + xOut + 'Z"/>';
  }
  o += '<g class="hot" data-info="Alveolar bone. After loading, the crest remodels about 2 mm and levels off within about the first year: physiologic. Any loss beyond that line is pathologic, and that is what makes it peri-implantitis.">' + bone(-1) + bone(1) + "</g>";
  /* mucosa: margin rises and bulges with swelling */
  var marg = 118 - v.swell * 9, bulge = 22 + v.swell * 14;
  var base = marg + v.pd * MM;
  function gum(side) {
    var s = side < 0, xi = s ? X0 - 1 : X1 + 1, xo = s ? 48 : D.W - 48, d = s ? -1 : 1, top = s ? (X0 - 18) : xi;
    var head = s ? "M" + top + " " + f(marg) : "M" + xi + " " + f(marg);
    var tail = s ? "L" + xi + " " + f(base) + "Z" : "Z";
    return '<path class="pi-gum" style="fill:color-mix(in srgb, var(--pd-red) ' + Math.round(v.red * 80) + '%, var(--pd-gum))" d="' + head + "C" + (top + d * bulge) + " " + f(marg - 4) + " " + (top + d * (bulge + 26)) + " " + f(marg + 14) + " " + (xi + d * 92) + " " + f(marg + 20) + "L" + xo + " " + f(marg + 26) + "V" + f(far + 2) + "C" + (s ? X0 - 70 : X1 + 70) + " " + f(far + 2) + " " + (s ? X0 - 26 : X1 + 26) + " " + f(crest + 2) + " " + xi + " " + f(crest + 2) + tail + '"/>';
  }
  o += '<g class="hot" data-info="Peri-implant mucosa. Health: no change in color, no edema, no redness. Inflamed (mucositis, peri-implantitis): red and swollen, and the extra volume alone makes the pocket probe deeper.">' + gum(-1) + gum(1) + "</g>";
  /* probe in the sulcus on the left side, tip at the base of the sulcus */
  var tip = base, px = X0 - 4, sx = X0 - 58, sy = 8;
  o += '<g class="hot" data-info="Plastic implant probe, light force (about 0.25 N). Compare each reading with this implant\'s baseline: a depth only grows from measurement error, swelling, or true bone loss."><path class="pi-probe" d="M' + sx + " " + sy + "L" + px + " " + f(tip) + '"/>';
  for (var k = 1; k <= 12; k++) { var yy = tip - k * MM; if (yy < 20) break; var xx = px - (tip - yy) * (px - sx) / (tip - sy); if (k % 3 === 0) o += '<path class="pi-mark" d="M' + f(xx - 4) + " " + f(yy) + "H" + f(xx + 4) + '"/>'; }
  o += "</g>";
  o += '<path class="pi-lead" d="M' + (px - 3) + " " + f(tip) + "L" + (px - 96) + " " + f(tip + 40) + '"/><circle class="pi-dot" cx="' + px + '" cy="' + f(tip) + '" r="2"/><text class="pi-t pi-cl" x="' + (px - 100) + '" y="' + f(tip + 44) + '" text-anchor="end">PD ' + (Math.round(v.pd * 2) / 2) + " mm</text>";
  /* bleeding and suppuration at the margin */
  if (v.bleed > .02) for (var b = 0; b < 4; b++) { var u = ((t / 1400 + b / 4) % 1), x = X0 - 12 - b * 8, y = marg - 3 + u * 26; o += '<path class="pi-blood" opacity="' + f(v.bleed * Math.min(1, (1 - u) * 3)) + '" d="M' + f(x) + " " + f(y - 5) + "Q" + f(x + 3.5) + " " + f(y) + " " + f(x) + " " + f(y + 3) + "Q" + f(x - 3.5) + " " + f(y) + " " + f(x) + " " + f(y - 5) + 'Z"/>'; }
  if (v.pus > .02) o += '<g class="hot" data-info="Suppuration (pus): a sign of active disease. Whatever the long-term plan, it needs a response now: debride, and at a deep site perhaps a local antibiotic."><ellipse class="pi-pus" cx="' + (X1 + 14) + '" cy="' + f(marg - 2) + '" rx="' + f(6 * v.pus) + '" ry="' + f(4.5 * v.pus) + '"/></g>';
  /* the line of initial remodeling, drawn over the tissue */
  o += '<path class="pi-remod" d="M48 ' + (D.PLAT + 2 * MM) + "H" + (D.W - 48) + '"/><text class="pi-t pi-small pi-halo" x="' + (D.W - 50) + '" y="' + (D.PLAT + 2 * MM - 5) + '" text-anchor="end">initial remodeling (~2 mm)</text>';
  /* bone loss bracket */
  if (v.bone > .05) o += '<path class="pi-loss" d="M' + (X1 + 20) + " " + (D.PLAT + 2 * MM) + "V" + f(crest) + '"/><text class="pi-t pi-lossT" x="' + (X1 + 26) + '" y="' + f((D.PLAT + 2 * MM + crest) / 2 + 4) + '" opacity="' + f(v.bone) + '">bone loss beyond remodeling</text>';
  return o;
}

const svg = figureSvg({ width: W, height: H, className: "pi-svg", label: "An implant in section with its crown, the mucosa, a probe in the sulcus and the bone on both sides, with a dashed line marking the level of initial crestal remodeling.", body: piBase(D) + '<g class="pi-dyn">' + piDyn({ red: 0, swell: 0, bleed: 0, pus: 0, pd: 4, bone: 0 }, 0, D) + "</g>" });
const plate = plateHtml({ fig: "S7 · Fig 1", title: "Health, mucositis, peri-implantitis", hint: "pick a state · tap a part", readout: "peri-implant health", body: `<div class="am-svg pi-box">${svg}</div>` });
const controls = `<div class="am-controls" role="group" aria-label="State"><button type="button" class="am-btn" data-pistate="health" aria-pressed="true">Health</button><button type="button" class="am-btn" data-pistate="muc" aria-pressed="false">Mucositis</button><button type="button" class="am-btn" data-pistate="pi" aria-pressed="false">Peri-implantitis</button></div>
<div class="am-stats pi-stats"><span>Inflammation <b data-pi="infl"></b></span><span>Bleeding / suppuration <b data-pi="bop"></b></span><span>Probing depth <b data-pi="pd"></b></span><span>Bone <b data-pi="bone"></b></span></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Tap the implant, the crown, the mucosa, the bone, the probe or the pus.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>The criteria are the 2017 World Workshop's (Dr. Kaur's slides); the ~2 mm of initial remodeling in the first year is what she said in class, since the slides give no number.</li>
<li>Schematic: depths and the shape of the bone loss are illustrative, not one patient's, and the 4 mm baseline only shows that healthy implants can probe over 3 mm. Educational, not medical advice.</li></ul></details>`;

function piLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var svg = root.querySelector(".pi-svg"), dyn = svg.querySelector(".pi-dyn"), sum = root.querySelector(".am-summary"), infoEl = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]");
  var key = "health", v = { red: 0, swell: 0, bleed: 0, pus: 0, pd: 4, bone: 0 }, frame = 0, visible = true, t0 = performance.now(), last = t0;
  var STAT = { health: ["none", "none", "4 mm = baseline", "at remodeling line"], muc: ["present", "profuse bleeding", "deeper than baseline", "at remodeling line"], pi: ["present", "bleeding + pus", "deeper than baseline", "lost beyond the line"] };
  function step(now) { var k = 1 - Math.exp(-(now - last) / 260); last = now; ["red", "swell", "bleed", "pus", "pd", "bone"].forEach(function (n) { v[n] += (D.SC[key][n] - v[n]) * (reduce.matches ? 1 : k); }); dyn.innerHTML = D.piDyn(v, reduce.matches ? 700 : now - t0, D); }
  function loop(now) { step(now); frame = visible && !reduce.matches ? requestAnimationFrame(loop) : 0; }
  function kick() { last = performance.now(); if (!frame && visible && !reduce.matches) frame = requestAnimationFrame(loop); else if (reduce.matches) step(performance.now()); }
  function set(k) { key = k; sum.textContent = D.SC[k].text; if (readout) readout.textContent = D.SC[k].name;
    ["infl", "bop", "pd", "bone"].forEach(function (n, i) { var el = root.querySelector('[data-pi="' + n + '"]'); if (el) el.textContent = STAT[k][i]; });
    root.querySelectorAll("[data-pistate]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-pistate") === k)); }); kick(); }
  root.querySelectorAll("[data-pistate]").forEach(function (b) { b.addEventListener("click", function () { set(b.getAttribute("data-pistate")); }); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && svg.contains(el)) infoEl.textContent = el.getAttribute("data-info"); }
  svg.addEventListener("pointerover", hot); svg.addEventListener("click", hot);
  if (window.IntersectionObserver) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) kick(); }, { rootMargin: "80px" }).observe(svg);
  set("health");
}

const CSS = `
.anima .pi-box{max-width:600px;margin:0 auto}
.anima .pi-svg .pi-t{fill:var(--anatomy-text);font:11.5px var(--anatomy-mono)}
.anima .pi-svg .pi-halo{paint-order:stroke;stroke:var(--surface);stroke-width:3px}
.anima .pi-svg .pi-small{font-size:10.5px;fill:var(--anatomy-muted)}
.anima .pi-svg .pi-cl{font-weight:700;fill:var(--anatomy-strong);paint-order:stroke;stroke:var(--surface);stroke-width:3px}
.anima .pi-svg .pi-lossT{font-size:10.5px;font-weight:700;fill:var(--pd-red-line);paint-order:stroke;stroke:var(--surface);stroke-width:3px}
.anima .pi-svg .pi-ti{fill:var(--pd-ti);stroke:var(--pd-ti-line);stroke-width:1.2}
.anima .pi-svg .pi-thread{fill:none;stroke:var(--pd-ti-line);stroke-width:2.2;stroke-linecap:round}
.anima .pi-svg .pi-crown{fill:var(--pd-crown);stroke:var(--pd-crown-line);stroke-width:1.2}
.anima .pi-svg .pi-bone{fill:var(--pd-bone);stroke:var(--pd-bone-line);stroke-width:1.2}
.anima .pi-svg .pi-gum{stroke:var(--pd-gum-line);stroke-width:1.2}
.anima .pi-svg .pi-remod{stroke:var(--anatomy-mid);stroke-width:1;stroke-dasharray:5 4;fill:none}
.anima .pi-svg .pi-plat{stroke:var(--anatomy-lo);stroke-width:1;stroke-dasharray:2 4;fill:none}
.anima .pi-svg .pi-probe{stroke:var(--pd-drug);stroke-width:4;stroke-linecap:round;fill:none}
.anima .pi-svg .pi-mark{stroke:var(--surface);stroke-width:1.6}
.anima .pi-svg .pi-lead{fill:none;stroke:var(--anatomy-mid);stroke-width:.8}
.anima .pi-svg .pi-dot{fill:var(--anatomy-dot)}
.anima .pi-svg .pi-blood{fill:var(--pd-blood)}
.anima .pi-svg .pi-pus{fill:var(--pd-pus);stroke:var(--pd-enz);stroke-width:1}
.anima .pi-svg .pi-loss{stroke:var(--pd-red-line);stroke-width:2.4}
`;

export function pistates() {
  return { id: "pistates", lec: "implants-perio", title: "Peri-implant health, mucositis and peri-implantitis",
    caption: "One implant in its three 2017 states: what changes in the mucosa, the bleeding, the probing depth, and the bone against the line of initial remodeling.",
    html: `<div class="anima" data-anima="pistates">${plate}${controls}${SOURCES}</div>`, css: CSS, live: piLive.toString(), helpers: [piBase, piDyn], data: D };
}
