// Fig: bleeding on probing over four maintenance visits (Periodontology S7, Dr. Kaur's slide). The chance of attachment
// loss for sites that bled at 4, 3, 2, 1 or 0 of 4 visits: 30%, 14%, 6%, 3%, 1.5%. The slide's numbers; bars to scale.
import { figureSvg, plateHtml } from "./shared.mjs";

const W = 540, H = 270;
const D = {
  B: [
    { v: "4 of 4", p: 30, t: "Bled at all 4 visits: a 30% chance of attachment loss. Repeated bleeding is the warning sign." },
    { v: "3 of 4", p: 14, t: "Bled at 3 of 4 visits: 14%." },
    { v: "2 of 4", p: 6, t: "Bled at 2 of 4 visits: 6%." },
    { v: "1 of 4", p: 3, t: "Bled at 1 of 4 visits: 3%. One bleed isn't a diagnosis: it can come from the wrong force or angulation." },
    { v: "0 of 4", p: 1.5, t: "No bleeding at any of 4 visits: 1.5%. Absence of bleeding is a good predictor of stability." },
  ],
};
function bopDraw(D, sel, g) {
  var o = "", f = function (n) { return Math.round(n * 10) / 10; }, x0 = 70, base = 210, sc = 5.6, bw = 64, gap = 26;
  for (var y = 0; y <= 30; y += 10) o += '<path class="bp-grid" d="M' + x0 + " " + (base - y * sc) + "H520" + '"/><text class="bp-t bp-ax" x="' + (x0 - 8) + '" y="' + (base - y * sc + 4) + '" text-anchor="end">' + y + "%</text>";
  D.B.forEach(function (b, i) {
    var x = x0 + 12 + i * (bw + gap), h = b.p * sc * g, on = sel === i;
    o += '<g class="hot bp-bar' + (on ? " is-on" : "") + '" data-bp="' + i + '"><rect class="bp-hit" x="' + (x - 8) + '" y="40" width="' + (bw + 16) + '" height="200"/><rect class="bp-r" x="' + x + '" y="' + f(base - h) + '" width="' + bw + '" height="' + f(h) + '" rx="3"/>';
    o += '<text class="bp-t bp-val" x="' + (x + bw / 2) + '" y="' + f(base - h - 6) + '" text-anchor="middle">' + b.p + "%</text>";
    o += '<text class="bp-t" x="' + (x + bw / 2) + '" y="' + (base + 18) + '" text-anchor="middle">' + b.v + "</text></g>";
  });
  o += '<path class="bp-axis" d="M' + x0 + " " + base + "H520" + '"/><text class="bp-t bp-ax" x="295" y="' + (base + 40) + '" text-anchor="middle">visits with bleeding on probing (of 4)</text>';
  o += '<text class="bp-t bp-ax" x="' + x0 + '" y="22">chance of attachment loss</text>';
  return o;
}
const svg = figureSvg({ width: W, height: H, className: "bp-svg", label: "Bar chart: chance of attachment loss by visits with bleeding on probing, 30% at 4 of 4, 14% at 3, 6% at 2, 3% at 1, 1.5% at none.", body: '<g class="bp-dyn">' + bopDraw(D, 0, 1) + "</g>" });
const plate = plateHtml({ fig: "S7 · Fig 3", title: "Bleeding on probing over four visits", hint: "tap a bar", readout: "4 of 4 · 30%", body: `<div class="am-svg bp-box">${svg}</div>` });
const controls = `<p class="am-summary" aria-live="polite"></p>`;
const SOURCES = `<details class="am-sources"><summary>Where the numbers come from</summary><ul><li>Dr. Kaur's slide on the significance of bleeding on probing (sites followed over 4 maintenance visits); bars drawn to scale. Educational, not medical advice.</li></ul></details>`;
function bopLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var svg = root.querySelector(".bp-svg"), dyn = svg.querySelector(".bp-dyn"), sum = root.querySelector(".am-summary"), readout = root.querySelector("[data-readout]"), sel = 0, grown = reduce.matches;
  function draw(g) { dyn.innerHTML = D.bopDraw(D, sel, g); }
  function set(i) { sel = i; sum.textContent = D.B[i].t; if (readout) readout.textContent = D.B[i].v + " · " + D.B[i].p + "%"; draw(1); }
  svg.addEventListener("click", function (e) { var b = e.target.closest && e.target.closest("[data-bp]"); if (b) set(+b.getAttribute("data-bp")); });
  svg.addEventListener("pointerover", function (e) { var b = e.target.closest && e.target.closest("[data-bp]"); if (b && +b.getAttribute("data-bp") !== sel) set(+b.getAttribute("data-bp")); });
  sum.textContent = D.B[0].t;
  if (!grown && window.IntersectionObserver) { draw(0); new IntersectionObserver(function (es, ob) { if (!es[0].isIntersecting) return; ob.disconnect(); var t0 = performance.now(); (function grow(now) { var g = Math.min(1, (now - t0) / 700); draw(1 - Math.pow(1 - g, 3)); if (g < 1) requestAnimationFrame(grow); })(t0); }).observe(svg); } else draw(1);
}
const CSS = `
.anima .bp-box{max-width:580px;margin:0 auto}
.anima .bp-svg .bp-t{fill:var(--anatomy-text);font:11.5px var(--anatomy-mono)}
.anima .bp-svg .bp-ax{fill:var(--anatomy-muted);font-size:10.5px}
.anima .bp-svg .bp-val{font-weight:700;fill:var(--anatomy-strong)}
.anima .bp-svg .bp-grid{stroke:var(--anatomy-faint);stroke-width:1}
.anima .bp-svg .bp-axis{stroke:var(--anatomy-mid);stroke-width:1.2}
.anima .bp-svg .bp-hit{fill:transparent}
.anima .bp-svg .bp-bar{cursor:pointer}
.anima .bp-svg .bp-r{fill:var(--pd-blood);opacity:.55}
.anima .bp-svg .bp-bar.is-on .bp-r{opacity:1}
`;
export function bop() {
  return { id: "bop", lec: "implants-perio", title: "Bleeding on probing over four visits",
    caption: "The chance of attachment loss for a site by how many of four maintenance visits it bled at: follow the pattern, not one reading.",
    html: `<div class="anima" data-anima="bop">${plate}${controls}${SOURCES}</div>`, css: CSS, live: bopLive.toString(), helpers: [bopDraw], data: D };
}
