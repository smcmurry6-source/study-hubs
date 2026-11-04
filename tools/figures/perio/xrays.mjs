// Fig: when to take implant radiographs (Periodontology S7, Dr. Kaur's slides). The schedule from placement through
// maintenance: placement, before uncovery (or before the prosthetic phase if one-stage), final impression, abutment
// seating, final restoration (the baseline), every 6 months in the first year, then annually; plus an off-schedule film
// only when the clinical signs change (confirmatory, not exploratory; Lang and Hill 1977). Spacing is not to scale.
import { figureSvg, plateHtml } from "./shared.mjs";

const W = 540, H = 250;
const D = {
  N: [
    { x: 40, a: "Placement", b: "", ph: 0, t: "At implant fixture placement." },
    { x: 108, a: "Before", b: "uncovery", ph: 0, t: "Before the Phase II uncovery surgery, or before the prosthetic phase if the implant was one-stage." },
    { x: 176, a: "Final", b: "impression", ph: 1, t: "At the final impression." },
    { x: 244, a: "Abutment", b: "seating", ph: 1, t: "At final abutment seating." },
    { x: 312, a: "Restoration", b: "= BASELINE", ph: 1, base: 1, t: "At final cementation or placement of the restoration: the baseline radiograph that every later film is compared with." },
    { x: 380, a: "6 months", b: "", ph: 2, t: "Every 6 months for the first year in function." },
    { x: 444, a: "1 year", b: "", ph: 2, t: "End of the first year: from here, as long as the implant stays healthy, annually." },
    { x: 504, a: "Yearly", b: "after", ph: 2, t: "Annually thereafter on every healthy implant in function." },
  ],
  EXTRA: "Off schedule, at any maintenance visit, only when the clinical signs change: increased probing depth, bleeding on probing, suppuration. Radiographs are confirmatory rather than exploratory: read them together with the clinical findings (Lang and Hill 1977).",
};
function xrDraw(D, sel) {
  var o = "", y = 110, PH = [["Surgical", 40, 108], ["Prosthetic", 176, 312], ["Maintenance", 380, 504]];
  PH.forEach(function (p, i) { o += '<path class="xr-ph xr-ph' + i + '" d="M' + (p[1] - 14) + " 62H" + (p[2] + 14) + '"/><text class="xr-t xr-pht" x="' + (p[1] + p[2]) / 2 + '" y="54" text-anchor="middle">' + p[0] + "</text>"; });
  o += '<path class="xr-line" d="M24 ' + y + 'H520"/>';
  D.N.forEach(function (n, i) {
    var on = sel === i;
    o += '<g class="hot xr-node' + (on ? " is-on" : "") + '" data-xr="' + i + '"><rect class="xr-hit" x="' + (n.x - 30) + '" y="70" width="60" height="100"/>';
    o += '<rect class="xr-film' + (n.base ? " xr-base" : "") + '" x="' + (n.x - 10) + '" y="' + (y - 13) + '" width="20" height="26" rx="3"/><path class="xr-imp" d="M' + (n.x - 2.5) + " " + (y - 7) + "h5v12q-2.5 4-5 0z" + '"/>';
    o += '<text class="xr-t' + (n.base ? " xr-bt" : "") + '" x="' + n.x + '" y="' + (y + 32) + '" text-anchor="middle">' + n.a + '</text><text class="xr-t' + (n.base ? " xr-bt" : "") + '" x="' + n.x + '" y="' + (y + 45) + '" text-anchor="middle">' + n.b + "</text></g>";
  });
  /* an extra film can come at any maintenance visit: a brace under the maintenance films, then the chip */
  o += '<g class="hot xr-node' + (sel === -1 ? " is-on" : "") + '" data-xr="-1"><path class="xr-branch" d="M366 166q0 8 8 8H434q8 0 8 8q0-8 8-8H510q8 0 8-8M442 182V190"/><rect class="xr-chip" x="306" y="190" width="224" height="28" rx="14"/><text class="xr-t xr-ct" x="418" y="208" text-anchor="middle">+ extra film if PD ↑, BOP or pus</text></g>';
  return o;
}
/* the same schedule as a vertical list, for a phone */
function xrDrawV(D, sel) {
  var o = "", x = 92, y0 = 34, dy = 50, PH = [["Surgical", 0, 1], ["Prosthetic", 2, 4], ["Maintenance", 5, 7]];
  PH.forEach(function (p, i) { var a = y0 + p[1] * dy - 14, b = y0 + p[2] * dy + 14; o += '<path class="xr-ph xr-ph' + i + '" d="M28 ' + a + "V" + b + '"/><text class="xr-t xr-pht" x="18" y="' + (a + b) / 2 + '" text-anchor="middle" transform="rotate(-90 18 ' + (a + b) / 2 + ')">' + p[0] + "</text>"; });
  o += '<path class="xr-line" d="M' + x + " " + (y0 - 18) + "V" + (y0 + 7 * dy + 18) + '"/>';
  D.N.forEach(function (n, i) {
    var on = sel === i, y = y0 + i * dy;
    o += '<g class="hot xr-node' + (on ? " is-on" : "") + '" data-xr="' + i + '"><rect class="xr-hit" x="44" y="' + (y - dy / 2) + '" width="290" height="' + dy + '"/>';
    o += '<rect class="xr-film' + (n.base ? " xr-base" : "") + '" x="' + (x - 10) + '" y="' + (y - 13) + '" width="20" height="26" rx="3"/><path class="xr-imp" d="M' + (x - 2.5) + " " + (y - 7) + "h5v12q-2.5 4-5 0z" + '"/>';
    o += '<text class="xr-t xr-tv' + (n.base ? " xr-bt" : "") + '" x="' + (x + 24) + '" y="' + (y + 4) + '">' + n.a + (n.b ? " " + n.b : "") + "</text></g>";
  });
  var ya = y0 + 5 * dy - 14, yb = y0 + 7 * dy + 14, yc = y0 + 8 * dy + 6;
  o += '<g class="hot xr-node' + (sel === -1 ? " is-on" : "") + '" data-xr="-1"><path class="xr-branch" d="M300 ' + ya + "q8 0 8 8V" + ((ya + yb) / 2 - 8) + "q0 8 8 8q-8 0-8 8V" + (yb - 8) + "q0 8-8 8" + "M316 " + (ya + yb) / 2 + "H326V" + (yc - 14) + "H262" + '"/><rect class="xr-chip" x="40" y="' + (yc - 28) + '" width="222" height="28" rx="14"/><text class="xr-t xr-ct" x="151" y="' + (yc - 10) + '" text-anchor="middle">+ extra film if PD ↑, BOP or pus</text></g>';
  return o;
}
const svg = figureSvg({ width: W, height: H, className: "xr-svg", label: "A timeline of implant radiographs: placement, before uncovery, final impression, abutment seating, final restoration as the baseline, 6 months, 1 year, then yearly, plus an extra film only when clinical signs change.", body: '<g class="xr-dyn">' + xrDraw(D, 4) + "</g>" });
const plate = plateHtml({ fig: "S7 · Fig 4", title: "When to take implant radiographs", hint: "tap a film", readout: "baseline", body: `<div class="am-svg xr-box">${svg}</div>` });
const controls = `<p class="am-summary" aria-live="polite"></p>`;
const SOURCES = `<details class="am-sources"><summary>Where this comes from</summary><ul><li>The schedule on Dr. Kaur's slides (peri-implant evaluation: radiographs) and her class comments; spacing between films isn't to scale. Educational, not medical advice.</li></ul></details>`;
function xrLive(root, D) {
  var svg = root.querySelector(".xr-svg"), dyn = svg.querySelector(".xr-dyn"), sum = root.querySelector(".am-summary"), readout = root.querySelector("[data-readout]"), sel = 4, narrow = false;
  function draw() { dyn.innerHTML = narrow ? D.xrDrawV(D, sel) : D.xrDraw(D, sel); }
  function set(i) { sel = i; draw(); var n = D.N[i]; sum.textContent = i < 0 ? D.EXTRA : n.t; if (readout) readout.textContent = i < 0 ? "confirmatory" : (n.a + (n.b ? " " + n.b : "")).toLowerCase(); }
  function fit() { var w = svg.parentNode.clientWidth || 600, nw = w < 470; if (nw === narrow) return; narrow = nw; svg.setAttribute("viewBox", narrow ? "0 0 340 470" : "0 0 540 250"); draw(); }
  svg.addEventListener("click", function (e) { var b = e.target.closest && e.target.closest("[data-xr]"); if (b) set(+b.getAttribute("data-xr")); });
  svg.addEventListener("pointerover", function (e) { var b = e.target.closest && e.target.closest("[data-xr]"); if (b) set(+b.getAttribute("data-xr")); });
  if (window.ResizeObserver) new ResizeObserver(fit).observe(svg.parentNode);
  fit(); set(4);
}
const CSS = `
.anima .xr-box{max-width:600px;margin:0 auto}
.anima .xr-svg .xr-t{fill:var(--anatomy-text);font:10.5px var(--anatomy-mono)}
.anima .xr-svg .xr-tv{font-size:12px}
.anima .xr-svg .xr-bt{font-weight:700;fill:var(--accent-ink)}
.anima .xr-svg .xr-pht{font-weight:700;fill:var(--anatomy-strong);font-size:11px}
.anima .xr-svg .xr-ph{stroke-width:5;stroke-linecap:round;opacity:.55}
.anima .xr-svg .xr-ph0{stroke:var(--pd-bone-line)}.anima .xr-svg .xr-ph1{stroke:var(--pd-drug)}.anima .xr-svg .xr-ph2{stroke:var(--pd-bug)}
.anima .xr-svg .xr-line{stroke:var(--anatomy-mid);stroke-width:1.4}
.anima .xr-svg .xr-hit{fill:transparent}
.anima .xr-svg .xr-node{cursor:pointer}
.anima .xr-svg .xr-film{fill:var(--pd-xray);stroke:var(--anatomy-lo);stroke-width:1.2}
.anima .xr-svg .xr-base{stroke:var(--accent);stroke-width:2.4}
.anima .xr-svg .xr-node.is-on .xr-film{stroke:var(--anatomy-lit);stroke-width:3}
.anima .xr-svg .xr-imp{fill:var(--pd-xti)}
.anima .xr-svg .xr-branch{fill:none;stroke:var(--pd-pus);stroke-width:1.6}
.anima .xr-svg .xr-chip{fill:var(--surface);stroke:var(--pd-pus);stroke-width:1.6}
.anima .xr-svg .xr-node.is-on .xr-chip{stroke-width:3}
.anima .xr-svg .xr-ct{font-weight:700;font-size:11px;fill:var(--anatomy-strong)}
`;
export function xrays() {
  return { id: "xrays", lec: "implants-perio", title: "When to take implant radiographs",
    caption: "Every film from placement to maintenance, the baseline they're all compared with, and the one kind you take off schedule.",
    html: `<div class="anima" data-anima="xrays">${plate}${controls}${SOURCES}</div>`, css: CSS, live: xrLive.toString(), helpers: [xrDraw, xrDrawV], data: D };
}
