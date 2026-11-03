// Fig: ailing, failing, failed (Periodontology S7; Meffert 1992, on Dr. Kaur's slides, and what she said to do in class).
// Three radiograph-style drawings of the same implant: ailing (static bone loss, no inflammation, no mobility: monitor),
// failing (progressive bone loss with inflammation, no mobility: case by case) and failed (progressive bone loss,
// mobility, loss of function: remove). The failed one shows a radiolucent band around the body for lost osseointegration.
// Schematic radiographs, not real films.
import { figureSvg, plateHtml } from "./shared.mjs";

const W = 540, H = 330;
const D = {
  P: [
    { k: "ailing", x: 95, loss: 26, prog: 0, infl: 0, mob: 0, name: "Ailing", line1: "static bone loss", line2: "monitor",
      info: "Ailing: static radiographic bone loss with no signs of inflammation and no mobility. The loss has stopped, on its own or because someone intervened. Observe it: record the clinical and radiographic data at every visit." },
    { k: "failing", x: 270, loss: 46, prog: 1, infl: 1, mob: 0, name: "Failing", line1: "progressive + inflamed", line2: "case by case",
      info: "Failing: progressive bone loss with signs of inflammation, but no mobility, so it is still in function. What you do varies case by case: treat it, or keep it working when removing it would leave too little bone to rebuild." },
    { k: "failed", x: 445, loss: 70, prog: 1, infl: 1, mob: 1, name: "Failed", line1: "mobile, lost function", line2: "remove it",
      info: "Failed: progressive bone loss, clinical mobility and loss of function. Mobility of the implant body means lost osseointegration, which can't be reversed, so the implant comes out. First confirm it's the body that moves, not the abutment or crown. (Peri-implantitis alone rarely makes an implant mobile; an implant with bone loss this advanced is judged failed either way.)" },
  ],
};

function mfDraw(D, sel, t) {
  var o = "", f = function (n) { return Math.round(n * 10) / 10; };
  D.P.forEach(function (p) {
    var x = p.x, top = 70, plat = 96, apex = 250, on = sel === p.k;
    var wob = p.mob ? Math.sin(t / 160) * 3 : 0;
    o += '<g class="hot mf-panel' + (on ? " is-on" : "") + '" data-mf="' + p.k + '" data-info="' + p.info + '">';
    o += '<rect class="mf-film" x="' + (x - 80) + '" y="34" width="160" height="236" rx="10"/>';
    /* bone: radiopaque gray, crest lowered by the loss, saucer toward the implant */
    var cr = plat + 14 + p.loss, fy = plat + 18 + p.loss * .35;
    o += '<path class="mf-bone" d="M' + (x - 76) + " " + f(fy) + "C" + (x - 54) + " " + f(fy) + " " + (x - 35) + " " + cr + " " + (x - 21) + " " + cr + "H" + (x + 21) + "C" + (x + 35) + " " + cr + " " + (x + 54) + " " + f(fy) + " " + (x + 76) + " " + f(fy) + "V266H" + (x - 76) + 'Z"/>';
    if (p.mob) o += '<path class="mf-gap" d="M' + (x - 23) + " " + cr + "V" + (apex - 4) + "Q" + x + " " + (apex + 12) + " " + (x + 23) + " " + (apex - 4) + "V" + cr + '"/>';
    /* implant (radiopaque white), wobbling if mobile */
    o += '<g transform="translate(' + f(wob) + ' 0) rotate(' + f(wob * .8) + " " + x + " " + plat + ')"><path class="mf-ti" d="M' + (x - 20) + " " + plat + "H" + (x + 20) + "V" + (apex - 14) + "Q" + (x + 20) + " " + apex + " " + x + " " + apex + "Q" + (x - 20) + " " + apex + " " + (x - 20) + " " + (apex - 14) + 'Z"/>';
    for (var y = plat + 12; y < apex - 14; y += 12) o += '<path class="mf-thread" d="M' + (x - 24) + " " + y + "L" + (x - 20) + " " + (y - 4) + "M" + (x + 24) + " " + y + "L" + (x + 20) + " " + (y - 4) + '"/>';
    o += '<path class="mf-ti" d="M' + (x - 12) + " " + plat + "V" + top + "H" + (x + 12) + "V" + plat + 'Z"/></g>';
    if (p.mob) o += '<path class="mf-arrow" d="M' + (x - 44) + " 60H" + (x - 28) + "M" + (x - 44) + " 60l5-4M" + (x - 44) + " 60l5 4M" + (x + 44) + " 60H" + (x + 28) + "M" + (x + 44) + " 60l-5-4M" + (x + 44) + ' 60l-5 4"/>';
    /* inflammation halo at the margin, and a progress arrow for active loss */
    if (p.infl) o += '<ellipse class="mf-infl" cx="' + x + '" cy="' + (plat + 6) + '" rx="46" ry="12" opacity="' + f(.45 + .25 * Math.sin(t / 300)) + '"/>';
    if (p.prog) o += '<path class="mf-prog" d="M' + (x + 52) + " " + (cr - 26) + "V" + (cr + 6) + "M" + (x + 52) + " " + (cr + 6) + "l-4-6M" + (x + 52) + " " + (cr + 6) + 'l4-6"/>';
    o += '<text class="mf-t mf-name" x="' + x + '" y="24" text-anchor="middle">' + p.name + "</text>";
    o += '<text class="mf-t" x="' + x + '" y="290" text-anchor="middle">' + p.line1 + '</text><text class="mf-t mf-do" x="' + x + '" y="306" text-anchor="middle">→ ' + p.line2 + "</text>";
    o += "</g>";
  });
  return o;
}

const svg = figureSvg({ width: W, height: H, className: "mf-svg", label: "Three radiograph-style drawings of an implant: ailing with static bone loss, failing with progressive bone loss and inflammation, failed with a radiolucent band around a mobile implant.", body: '<g class="mf-dyn">' + mfDraw(D, "ailing", 0) + "</g>" });
const plate = plateHtml({ fig: "S7 · Fig 2", title: "Ailing, failing, failed (Meffert 1992)", hint: "tap an implant", readout: "ailing", body: `<div class="am-svg mf-box">${svg}</div>` });
const controls = `<div class="am-controls" role="group" aria-label="Implant"><button type="button" class="am-btn" data-mfk="ailing" aria-pressed="true">Ailing</button><button type="button" class="am-btn" data-mfk="failing" aria-pressed="false">Failing</button><button type="button" class="am-btn" data-mfk="failed" aria-pressed="false">Failed</button></div>
<p class="am-summary" aria-live="polite"></p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>Definitions from Dr. Kaur's slide (Meffert 1992); what to do for each from the Oct 29 class.</li>
<li>Drawn radiographs, not real films; the amount of bone loss in each is illustrative. Educational, not medical advice.</li></ul></details>`;

function mfLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var svg = root.querySelector(".mf-svg"), dyn = svg.querySelector(".mf-dyn"), sum = root.querySelector(".am-summary"), readout = root.querySelector("[data-readout]");
  var key = "ailing", frame = 0, visible = true, t0 = performance.now();
  function draw(now) { dyn.innerHTML = D.mfDraw(D, key, reduce.matches ? 0 : now - t0); }
  function loop(now) { draw(now); frame = visible && !reduce.matches ? requestAnimationFrame(loop) : 0; }
  function kick() { if (!frame && visible && !reduce.matches) frame = requestAnimationFrame(loop); else draw(performance.now()); }
  function set(k) { key = k; var p = D.P.filter(function (x) { return x.k === k; })[0]; sum.textContent = p.info; if (readout) readout.textContent = p.name.toLowerCase();
    root.querySelectorAll("[data-mfk]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-mfk") === k)); }); kick(); }
  root.querySelectorAll("[data-mfk]").forEach(function (b) { b.addEventListener("click", function () { set(b.getAttribute("data-mfk")); }); });
  svg.addEventListener("click", function (e) { var g = e.target.closest && e.target.closest("[data-mf]"); if (g) set(g.getAttribute("data-mf")); });
  if (window.IntersectionObserver) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) kick(); }, { rootMargin: "80px" }).observe(svg);
  set("ailing");
}

const CSS = `
.anima .mf-box{max-width:600px;margin:0 auto}
.anima .mf-svg .mf-panel{cursor:pointer}
.anima .mf-svg .mf-film{fill:var(--pd-xray);stroke:var(--anatomy-lo);stroke-width:1.5}
.anima .mf-svg .mf-panel.is-on .mf-film{stroke:var(--anatomy-lit);stroke-width:3}
.anima .mf-svg .mf-bone{fill:var(--pd-xbone)}
.anima .mf-svg .mf-gap{fill:none;stroke:#05070a;stroke-width:5}
.anima .mf-svg .mf-ti{fill:var(--pd-xti)}
.anima .mf-svg .mf-thread{stroke:var(--pd-xti);stroke-width:2.2;stroke-linecap:round}
.anima .mf-svg .mf-infl{fill:var(--pd-red)}
.anima .mf-svg .mf-prog{fill:none;stroke:var(--pd-pus);stroke-width:2.2;stroke-linecap:round}
.anima .mf-svg .mf-arrow{fill:none;stroke:var(--pd-pus);stroke-width:2.2;stroke-linecap:round}
.anima .mf-svg .mf-t{fill:var(--anatomy-text);font:11.5px var(--anatomy-mono)}
.anima .mf-svg .mf-name{font-weight:700;font-size:13px;fill:var(--anatomy-strong)}
.anima .mf-svg .mf-do{font-weight:700;fill:var(--accent-ink)}
`;

export function meffert() {
  return { id: "meffert", lec: "implants-perio", title: "Ailing, failing, failed",
    caption: "Meffert's implant failure classification on drawn radiographs, with what you do for each.",
    html: `<div class="anima" data-anima="meffert">${plate}${controls}${SOURCES}</div>`, css: CSS, live: mfLive.toString(), helpers: [mfDraw], data: D };
}
