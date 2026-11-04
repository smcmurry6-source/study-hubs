// Fig: ailing, failing, failed (Periodontology S7; Meffert 1992, on Dr. Kaur's slides, and what she said to do in class).
// Three drawn periapical radiographs of the same restored implant between two teeth, 8 px = 1 mm (a 4.1 x 10 mm implant):
//   ailing: radiographic bone loss that is static (the crest sits where it was on the previous film), no inflammation,
//     no mobility: monitor;
//   failing: progressive bone loss (the crest is lower than on the previous film) with signs of inflammation, no
//     mobility, still in function: case by case;
//   failed: progressive bone loss, clinical mobility and loss of function, with a radiolucent band around the body for
//     lost osseointegration: remove it.
// A radiograph shows bone and metal, not inflammation or mobility, so those clinical findings are written under each
// film, and "progressive" is read by comparing with the previous film (the dashed line), never from one film alone.
// Drawn radiographs, not real films; the amount of bone loss in each is illustrative.
import { figureSvg, plateHtml } from "./shared.mjs";

const W = 540, H = 344, K = 8, FW = 150, FH = 220, FT = 36;
const D = {
  K, FW, FH, FT,
  P: [
    { k: "ailing", x: 95, crest: 16.0, prev: 16.0, mob: 0, name: "Ailing", l1: "static bone loss", l2: "not inflamed, not mobile", l3: "monitor",
      info: "Ailing: radiographic bone loss that is static, with no signs of inflammation and no mobility. The crest sits where it was on the previous film: the loss has stopped, on its own or because someone intervened. Observe it: record the clinical and radiographic data at every visit." },
    { k: "failing", x: 270, crest: 17.4, prev: 15.6, mob: 0, name: "Failing", l1: "progressive bone loss", l2: "inflamed, not mobile", l3: "case by case",
      info: "Failing: progressive bone loss (the crest is lower than on the previous film) with signs of inflammation, but no mobility, so it is still in function. What you do varies case by case: treat it, or keep it working when removing it would leave too little bone to rebuild." },
    { k: "failed", x: 445, crest: 19.2, prev: 17.0, mob: 1, name: "Failed", l1: "progressive bone loss", l2: "mobile, lost function", l3: "remove it",
      info: "Failed: progressive bone loss, clinical mobility and loss of function. The dark band around the body is lost osseointegration, which can't be reversed, so the implant comes out. First confirm it's the body that moves, not the abutment or crown. (Peri-implantitis alone rarely makes an implant mobile; an implant with this much bone lost is still judged failed, mobile or not, when it has no future.)" },
  ],
};

/* fixed parts of one film, in film mm (x from the implant axis, y down from the film's top edge) */
function mfRo(y) { return y < 12.3 ? 2.05 : 2.05 - .32 * Math.min(1, (y - 12.3) / 8.4); }
function mfParts() {
  const P = (pts) => pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(2) + " " + p[1].toFixed(2)).join("") + "Z";
  /* implant: platform at 11.5, smooth collar, V threads, apex at 21.5 */
  const L = [[-2.05, 11.5], [-2.05, 12.3]], R = [[2.05, 11.5], [2.05, 12.3], [mfRo(12.55) - .42, 12.55]];
  for (let k = 0; k <= 8; k++) { const y = 12.3 + k; if (y > 20.55) break; L.push([-mfRo(y), y]); if (y + .5 < 20.8) L.push([-(mfRo(y + .5) - .42), y + .5]); }
  for (let k = 0; k <= 8; k++) { const y = 12.8 + k; if (y > 20.55) break; R.push([mfRo(y), y]); if (y + .5 < 20.8) R.push([mfRo(y + .5) - .42, y + .5]); }
  const body = L.concat([[-1.42, 20.85], [-.95, 21.3], [0, 21.52], [.95, 21.3], [1.42, 20.85]], R.slice().reverse());
  const abut = [[-2.05, 11.5], [-2.3, 9.5], [2.3, 9.5], [2.05, 11.5]];
  const crown = [[-2.3, 9.5], [-3.1, 8.6], [-3.75, 7.4], [-4.02, 6.2], [-3.95, 4.8], [-3.5, 3.4], [-2.6, 2.4], [-1.6, 2.15], [-.7, 2.7], [0, 2.95], [.7, 2.7], [1.6, 2.15], [2.6, 2.4], [3.5, 3.4], [3.95, 4.8], [4.02, 6.2], [3.75, 7.4], [3.1, 8.6], [2.3, 9.5]];
  /* the right-hand neighbor's mesial half (the left one is its mirror): crown, enamel cap, root, pulp */
  const tooth = [[9.2, 2.6], [7.4, 2.5], [5.3, 3.4], [4.3, 4.9], [4.05, 6.2], [4.25, 7.8], [4.9, 9.3], [5.15, 11], [5.45, 15], [5.9, 19], [6.6, 22.6], [7.4, 24.6], [8.0, 25.4], [8.8, 25.3], [9.2, 24.8]];
  const enamel = [[9.2, 2.6], [7.4, 2.5], [5.3, 3.4], [4.3, 4.9], [4.05, 6.2], [4.25, 7.8], [4.9, 9.3], [5.55, 8.7], [6.2, 6.0], [7.2, 4.3], [8.4, 3.75], [9.2, 3.7]];
  const pulp = [[7.0, 6.9], [7.25, 6.3], [7.8, 6.7], [8.35, 6.3], [8.6, 6.9], [8.45, 11.5], [8.25, 18], [8.05, 24.6], [7.8, 24.6], [7.5, 18], [7.2, 11.5]];
  const root = [[5.05, 10.6], [5.15, 11], [5.45, 15], [5.9, 19], [6.6, 22.6], [7.4, 24.6], [8.0, 25.4], [8.8, 25.3], [9.2, 24.8]];
  const mir = (pts) => pts.map((p) => [-p[0], p[1]]);
  const line = (pts) => pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(2) + " " + p[1].toFixed(2)).join("");
  /* thread crests on the face, the helix seen across the body */
  let helix = "";
  for (let k = 0; k <= 7; k++) { const y = 12.3 + k; helix += `M${(-mfRo(y)).toFixed(2)} ${y.toFixed(2)}L${mfRo(y + .5).toFixed(2)} ${(y + .5).toFixed(2)}`; }
  /* marrow spaces where there is always bone */
  let s = 5, dots = "";
  const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  for (let i = 0, n = 0; i < 300 && n < 34; i++) {
    const x = -9 + r() * 18, y = 13.4 + r() * 13.6, ax = Math.abs(x);
    if ((ax < 4.4 && y < 20.4) || ax < 2.7 || ax > 8.9 || y > 26.8) continue;
    dots += `<ellipse class="mf-marrow" cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" rx="${(.22 + r() * .3).toFixed(2)}" ry="${(.15 + r() * .18).toFixed(2)}"/>`; n++;
  }
  return {
    body: P(body), abut: P(abut), crown: P(crown), helix, dots,
    teeth: `<path class="mf-ld" d="${line(root)}${line(mir(root))}"/><path class="mf-pdl" d="${line(root)}${line(mir(root))}"/>`
      + `<path class="mf-dentin" d="${P(tooth)}${P(mir(tooth))}"/><path class="mf-enamel" d="${P(enamel)}${P(mir(enamel))}"/><path class="mf-pulp" d="${P(pulp)}${P(mir(pulp))}"/>`,
  };
}
D.G = mfParts();

/* the bone: neighbors' crests at 11.3 mm, a saucer down to the implant's crest */
function mfBone(crest) {
  var o = "", f = function (n) { return Math.round(n * 100) / 100; }, pts = [];
  for (var i = 0; i <= 12; i++) { var u = i / 12, x = -5.4 + 3.35 * u, e = u * u * (3 - 2 * u); pts.push([x, 11.3 + (crest - 11.3) * e]); }
  o += "M-9.2 26.3V11.3";
  pts.forEach(function (p) { o += "L" + f(p[0]) + " " + f(p[1]); });
  o += "L0 " + f(crest);
  for (var j = pts.length - 1; j >= 0; j--) o += "L" + f(-pts[j][0]) + " " + f(pts[j][1]);
  return o + "L9.2 11.3V26.3Q9.2 27.3 8.2 27.3H-8.2Q-9.2 27.3 -9.2 26.3Z";
}

function mfDraw(D, sel, t, narrow) {
  var o = "", f = function (n) { return Math.round(n * 100) / 100; }, k = D.K, G = D.G;
  /* on a phone, one film at a time (the buttons switch it), so its labels stay readable */
  (narrow ? D.P.filter(function (q) { return q.k === sel; }).map(function (q) { var c = {}; for (var n in q) c[n] = q[n]; c.x = 100; return c; }) : D.P).forEach(function (p) {
    var on = sel === p.k && !narrow, x0 = p.x - D.FW / 2, wob = p.mob ? Math.sin(t / 170) * 1.1 : 0;
    o += '<g class="hot mf-panel' + (on ? " is-on" : "") + '" data-mf="' + p.k + '" data-info="' + p.info + '">';
    o += '<rect class="mf-film" x="' + x0 + '" y="' + D.FT + '" width="' + D.FW + '" height="' + D.FH + '" rx="9"/>';
    /* film content in mm, with its origin at the implant axis and the film's top edge */
    o += '<g class="mf-mm" transform="translate(' + p.x + " " + D.FT + ") scale(" + k + ')">';
    o += '<path class="mf-bone" d="' + mfBone(p.crest) + '"/><g>' + G.dots + "</g>" + G.teeth;
    /* the crest on the previous film: dashed, at the implant on both sides */
    o += '<path class="mf-prev" d="M-4.2 ' + p.prev + "H-2.15M2.15 " + p.prev + "H4.2" + '"/>';
    /* the restored implant, rocking if mobile; a radiolucent band around it once osseointegration is lost */
    o += '<g transform="rotate(' + f(wob) + ' 0 17)">';
    if (p.mob) o += '<path class="mf-gap" d="' + G.body + '"/>';
    o += '<path class="mf-ti" d="' + G.body + '"/><path class="mf-helix" d="' + G.helix + '"/><path class="mf-abut" d="' + G.abut + '"/><path class="mf-crown" d="' + G.crown + '"/></g>';
    if (p.mob) o += '<path class="mf-arrow" d="M-1 1.1H-3.4M-3.4 1.1l.7-.55M-3.4 1.1l.7.55M1 1.1H3.4M3.4 1.1l-.7-.55M3.4 1.1l-.7.55"/>';
    o += "</g>";
    o += '<text class="mf-t mf-name" x="' + p.x + '" y="24" text-anchor="middle">' + p.name + "</text>";
    o += '<text class="mf-t mf-l1" x="' + p.x + '" y="' + (D.FT + D.FH + 20) + '" text-anchor="middle">' + p.l1 + '</text><text class="mf-t mf-l2" x="' + p.x + '" y="' + (D.FT + D.FH + 35) + '" text-anchor="middle">' + p.l2 + '</text><text class="mf-t mf-do" x="' + p.x + '" y="' + (D.FT + D.FH + 51) + '" text-anchor="middle">→ ' + p.l3 + "</text>";
    o += "</g>";
  });
  return o;
}

const svg = figureSvg({ width: W, height: H, className: "mf-svg", label: "Three drawn periapical radiographs of the same restored implant between two teeth: ailing, with bone loss at the level of the previous film; failing, with the crest lower than on the previous film; failed, lower still, with a dark band around a mobile implant.", body: '<g class="mf-dyn">' + mfDraw(D, "ailing", 0) + "</g>" });
const plate = plateHtml({ fig: "S7 · Fig 2", title: "Ailing, failing, failed (Meffert 1992)", hint: "tap an implant", readout: "ailing", body: `<div class="am-svg mf-box">${svg}</div>` });
const controls = `<div class="am-controls" role="group" aria-label="Implant"><button type="button" class="am-btn" data-mfk="ailing" aria-pressed="true">Ailing</button><button type="button" class="am-btn" data-mfk="failing" aria-pressed="false">Failing</button><button type="button" class="am-btn" data-mfk="failed" aria-pressed="false">Failed</button></div>
<div class="mf-key"><span><i class="mf-k-prev"></i>crest on the previous film</span><span>a film shows bone, not inflammation or mobility: those are clinical findings</span></div>
<p class="am-summary" aria-live="polite"></p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>Definitions from Dr. Kaur's slide (Meffert 1992); what to do for each from the Oct 29 class.</li>
<li>Drawn radiographs, not real films, at one scale (a 4.1 x 10 mm implant between two teeth). The amount of bone lost in each is illustrative. Static or progressive loss can only be read against an earlier film, which is why the baseline radiograph matters. Educational, not medical advice.</li></ul></details>`;

function mfLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var svg = root.querySelector(".mf-svg"), dyn = svg.querySelector(".mf-dyn"), sum = root.querySelector(".am-summary"), readout = root.querySelector("[data-readout]");
  var key = "ailing", frame = 0, visible = true, t0 = performance.now(), narrow = false;
  function draw(now) { dyn.innerHTML = D.mfDraw(D, key, reduce.matches ? 0 : now - t0, narrow); }
  function fit() { var w = svg.parentNode.clientWidth || 600, nw = w < 470; if (nw === narrow) return; narrow = nw; svg.setAttribute("viewBox", narrow ? "0 0 200 344" : "0 0 540 344"); draw(performance.now()); }
  function loop(now) { draw(now); frame = visible && !reduce.matches ? requestAnimationFrame(loop) : 0; }
  function kick() { if (!frame && visible && !reduce.matches) frame = requestAnimationFrame(loop); else draw(performance.now()); }
  function set(k) { key = k; var p = D.P.filter(function (x) { return x.k === k; })[0]; sum.textContent = p.info; if (readout) readout.textContent = p.name.toLowerCase();
    root.querySelectorAll("[data-mfk]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-mfk") === k)); }); kick(); }
  root.querySelectorAll("[data-mfk]").forEach(function (b) { b.addEventListener("click", function () { set(b.getAttribute("data-mfk")); }); });
  svg.addEventListener("click", function (e) { var g = e.target.closest && e.target.closest("[data-mf]"); if (g) set(g.getAttribute("data-mf")); });
  if (window.IntersectionObserver) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) kick(); }, { rootMargin: "80px" }).observe(svg);
  if (window.ResizeObserver) new ResizeObserver(fit).observe(svg.parentNode);
  fit(); set("ailing");
}

const CSS = `
.anima .mf-box{max-width:600px;margin:0 auto}
@media (max-width:560px){.anima .mf-box{max-width:330px}}
.anima .mf-svg .mf-panel{cursor:pointer}
.anima .mf-svg .mf-mm path{vector-effect:none}
.anima .mf-svg .mf-film{fill:var(--pd-xray);stroke:var(--anatomy-lo);stroke-width:1.5}
.anima .mf-svg .mf-panel.is-on .mf-film{stroke:var(--anatomy-lit);stroke-width:3}
.anima .mf-svg .mf-bone{fill:var(--pd-xbone)}
.anima .mf-svg .mf-marrow{fill:color-mix(in srgb, var(--pd-xray) 45%, var(--pd-xbone))}
.anima .mf-svg .mf-ld{fill:none;stroke:color-mix(in srgb, var(--pd-xti) 55%, var(--pd-xbone));stroke-width:.62}
.anima .mf-svg .mf-pdl{fill:none;stroke:color-mix(in srgb, var(--pd-xray) 75%, var(--pd-xbone));stroke-width:.3}
.anima .mf-svg .mf-dentin{fill:color-mix(in srgb, var(--pd-xti) 45%, var(--pd-xbone))}
.anima .mf-svg .mf-enamel{fill:color-mix(in srgb, var(--pd-xti) 80%, var(--pd-xbone))}
.anima .mf-svg .mf-pulp{fill:color-mix(in srgb, var(--pd-xray) 70%, var(--pd-xbone))}
.anima .mf-svg .mf-gap{fill:none;stroke:color-mix(in srgb, var(--pd-xray) 85%, #000);stroke-width:1.3;stroke-linejoin:round}
.anima .mf-svg .mf-ti{fill:var(--pd-xti)}
.anima .mf-svg .mf-helix{fill:none;stroke:color-mix(in srgb, var(--pd-xbone) 50%, var(--pd-xti));stroke-width:.12}
.anima .mf-svg .mf-abut{fill:var(--pd-xti)}
.anima .mf-svg .mf-crown{fill:color-mix(in srgb, var(--pd-xti) 85%, var(--pd-xbone));stroke:var(--pd-xti);stroke-width:.14}
.anima .mf-svg .mf-prev{fill:none;stroke:var(--pd-pus);stroke-width:.3;stroke-dasharray:.6 .45}
.anima .mf-svg .mf-arrow{fill:none;stroke:var(--pd-pus);stroke-width:.32;stroke-linecap:round;stroke-linejoin:round}
.anima .mf-svg .mf-t{fill:var(--anatomy-text);font:11.5px var(--anatomy-mono)}
.anima .mf-svg .mf-l2{fill:var(--anatomy-muted);font-size:10.5px}
.anima .mf-svg .mf-name{font-weight:700;font-size:13px;fill:var(--anatomy-strong)}
.anima .mf-svg .mf-do{font-weight:700;fill:var(--accent-ink)}
.anima .mf-key{display:flex;flex-wrap:wrap;gap:4px 16px;margin:2px 0 6px;font:12px var(--anatomy-mono);color:var(--anatomy-muted)}
.anima .mf-key span{display:inline-flex;align-items:center;gap:6px}
.anima .mf-k-prev{display:inline-block;width:18px;border-top:2px dashed var(--pd-pus)}
`;

export function meffert() {
  return { id: "meffert", lec: "implants-perio", title: "Ailing, failing, failed",
    caption: "Meffert's implant classification on drawn periapical radiographs, read against the previous film, with the clinical findings and what you do for each.",
    html: `<div class="anima" data-anima="meffert">${plate}${controls}${SOURCES}</div>`, css: CSS, live: mfLive.toString(), helpers: [mfBone, mfDraw], data: D };
}
