// Fig: a tooth vs an implant under load (Occlusion L5, "Implants"). A natural tooth in its periodontal ligament beside
// an implant locked in bone. Tab 1, under load (about 10 lb): the tooth sinks about 28 µm on its ligament (or tips
// 56-75 µm sideways, posterior teeth), which its ligament feels (proprioception); the implant moves about 2-3 µm (10-50
// µm sideways), bone strain only. Tab 2, the shimstock check (about 12 µm): on a light closure the strip holds on the
// natural tooth and pulls through the implant crown with some resistance; on a clench the tooth drops into its
// ligament and the strip holds on both. Every number is the notes' own; movements are drawn 500 times larger (0.5 px
// per µm), and the shapes are schematic.
import { figureSvg, plateHtml } from "./shared.mjs";

const W = 460, H = 332;
const D = {
  W, H, k: 0.5, /* px per µm */
  tooth: { apical: 28, lateral: 65, latRange: "56-75 µm (posterior teeth)" },
  implant: { apical: 2.5, apicalRange: "2-3 µm", lateral: 30, latRange: "10-50 µm" },
  shim: 12,
  XT: 120, XI: 336,
};

function imSvg(st, D) {
  var f = function (n) { return Math.round(n * 10) / 10; }, o = "", k = D.k, tab = st.tab, u = st.u;
  function C(pts) { var n = pts.length, d = "M" + f(pts[0][0]) + " " + f(pts[0][1]);
    for (var i = 0; i < n; i++) { var p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      d += "C" + f(p1[0] + (p2[0] - p0[0]) / 6) + " " + f(p1[1] + (p2[1] - p0[1]) / 6) + " " + f(p2[0] - (p3[0] - p1[0]) / 6) + " " + f(p2[1] - (p3[1] - p1[1]) / 6) + " " + f(p2[0]) + " " + f(p2[1]); }
    return d + "Z"; }
  function tx(x, y, t, cls, a) { return '<text class="im-t' + (cls ? " " + cls : "") + '" x="' + f(x) + '" y="' + f(y) + '"' + (a ? ' text-anchor="' + a + '"' : "") + ">" + t + "</text>"; }
  function arrow(x1, y1, x2, y2, cls) { var dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, h = 8;
    return '<path class="' + cls + '" d="M' + f(x1) + " " + f(y1) + "L" + f(x2 - ux * 4) + " " + f(y2 - uy * 4) + '"/><path class="' + cls + ' im-ah" d="M' + f(x2) + " " + f(y2) + "L" + f(x2 - ux * h - uy * h * .55) + " " + f(y2 - uy * h + ux * h * .55) + "L" + f(x2 - ux * h + uy * h * .55) + " " + f(y2 - uy * h - ux * h * .55) + 'Z"/>'; }
  var lat = st.dir === "lat";
  /* how far each one has moved (px): sideways = tipping about a point low on the root, drawn as a shift at the crown */
  var tMove = tab === "load" ? u * (lat ? D.tooth.lateral : D.tooth.apical) * k : u * D.tooth.apical * k;
  var iMove = tab === "load" ? u * (lat ? D.implant.lateral : D.implant.apical) * k : u * D.implant.apical * k;
  var crest = 172;
  /* bone with gingiva over it */
  o += '<path class="im-bone" d="M14 ' + crest + 'Q60 ' + (crest - 6) + ' 120 ' + (crest - 2) + 'Q180 ' + (crest - 6) + ' 228 ' + crest + 'Q280 ' + (crest - 6) + ' 336 ' + (crest - 2) + 'Q392 ' + (crest - 6) + ' 446 ' + crest + 'L446 304L14 304Z"/>';
  for (var i = 0; i < 26; i++) { var bx = 24 + (i * 53) % 410, by = 196 + (i * 37) % 100; o += '<circle class="im-trab" cx="' + bx + '" cy="' + by + '" r="' + (3 + (i % 3)) + '"/>'; }
  o += '<path class="im-gum" d="M14 ' + (crest - 2) + 'Q60 ' + (crest - 14) + ' 92 ' + (crest - 12) + 'L148 ' + (crest - 12) + 'Q190 ' + (crest - 14) + ' 228 ' + (crest - 6) + 'Q270 ' + (crest - 14) + ' 306 ' + (crest - 12) + 'L366 ' + (crest - 12) + 'Q400 ' + (crest - 14) + ' 446 ' + (crest - 2) + 'L446 ' + (crest + 6) + 'L14 ' + (crest + 6) + 'Z"/>';
  /* natural tooth: socket, ligament, root and crown; it moves inside its socket */
  var X = D.XT, dyT = lat ? 0 : tMove, dxT = lat ? tMove : 0;
  o += '<path class="im-socket" d="M' + (X - 26) + " " + (crest - 4) + "L" + (X - 20) + " 292Q" + X + " 312 " + (X + 20) + " 292L" + (X + 26) + " " + (crest - 4) + 'Z"/>';
  o += '<path class="im-pdl hot" data-info="Periodontal ligament: the tooth is slung in it, so it moves (about 28 µm down under about 10 lb) and its nerve endings feel it: proprioception. The PDL detects material down to about 20 µm." d="M' + (X - 24) + " " + (crest - 4) + "L" + (X - 18) + " 290Q" + X + " 309 " + (X + 18) + " 290L" + (X + 24) + " " + (crest - 4) + 'Z"/>';
  var tilt = lat ? Math.atan2(dxT, 160) * 180 / Math.PI : 0;
  o += '<g transform="translate(0 ' + f(dyT) + ') rotate(' + f(tilt) + " " + X + ' 262)">';
  o += '<path class="im-root" d="M' + (X - 20) + " " + (crest - 10) + "L" + (X - 15) + " 286Q" + X + " 302 " + (X + 15) + " 286L" + (X + 20) + " " + (crest - 10) + 'Z"/>';
  o += '<path class="im-tooth hot" data-info="Natural tooth: crown and root, held in bone by its periodontal ligament." d="' + C([[X - 36, 106], [X - 22, 96], [X - 8, 104], [X + 8, 96], [X + 24, 104], [X + 36, 110], [X + 32, 150], [X + 22, crest - 6], [X - 22, crest - 6], [X - 32, 150]]) + '"/></g>';
  /* implant: fixture threaded straight into bone, abutment, crown; it barely moves */
  var Y = D.XI, dyI = lat ? 0 : iMove, dxI = lat ? iMove : 0, tiltI = lat ? Math.atan2(dxI, 160) * 180 / Math.PI : 0;
  o += '<g transform="translate(0 ' + f(dyI) + ') rotate(' + f(tiltI) + " " + Y + ' 262)">';
  var th = "M" + (Y - 15) + " " + (crest + 2);
  for (var t = 0; t < 10; t++) { var yy = crest + 6 + t * 11; th += "L" + (Y - 19) + " " + (yy + 3) + "L" + (Y - 15) + " " + (yy + 8); }
  th += "L" + (Y - 10) + " 292L" + (Y + 10) + " 292";
  for (t = 9; t >= 0; t--) { yy = crest + 6 + t * 11; th += "L" + (Y + 15) + " " + (yy + 8) + "L" + (Y + 19) + " " + (yy + 3); }
  th += "L" + (Y + 15) + " " + (crest + 2) + "Z";
  o += '<path class="im-fixture hot" data-info="Implant fixture: titanium locked in bone (osseointegrated), with no periodontal ligament. Under about 10 lb it moves about 2-3 µm, only by straining the bone, and nothing in it feels the load." d="' + th + '"/>';
  o += '<path class="im-abut" d="M' + (Y - 10) + " " + (crest + 2) + "L" + (Y - 8) + " " + (crest - 16) + "L" + (Y + 8) + " " + (crest - 16) + "L" + (Y + 10) + " " + (crest + 2) + 'Z"/>';
  o += '<path class="im-tooth hot" data-info="Implant crown." d="' + C([[Y - 36, 106], [Y - 22, 96], [Y - 8, 104], [Y + 8, 96], [Y + 24, 104], [Y + 36, 110], [Y + 32, 150], [Y + 18, crest - 14], [Y - 18, crest - 14], [Y - 32, 150]]) + '"/></g>';
  if (tab === "load") {
    /* the load, and what each one reports */
    if (u > 0.01) {
      o += lat ? arrow(X - 76, 128, X - 42 + dxT, 128, "im-force") + arrow(Y - 76, 128, Y - 42 + dxI, 128, "im-force") : arrow(X, 44, X, 90 + dyT, "im-force") + arrow(Y, 44, Y, 90 + dyI, "im-force");
      o += tx(X, 36, "about 10 lb", "im-key", "middle") + tx(Y, 36, "about 10 lb", "im-key", "middle");
      /* proprioception: the ligament's nerve endings fire */
      if (u > 0.3) { for (var w = 0; w < 3; w++) o += '<path class="im-wave" style="opacity:' + f(Math.min(1, (u - 0.3) * 2) * (1 - w * .25)) + '" d="M' + (X + 34 + w * 9) + " " + (250 - w * 4) + "q6 -8 0 -16" + '"/>'; o += tx(X + 64, 246, "felt", "im-key"); }
    }
    /* at full load the notes' own figures; on the way there, the drawn movement in µm */
    var full = u > 0.98, tm = full ? (lat ? "56-75" : "about 28") : "about " + Math.round(u * (lat ? D.tooth.lateral : D.tooth.apical));
    var im = full ? (lat ? "10-50" : "about 2-3") : "about " + (lat ? Math.round(u * D.implant.lateral) : (u * D.implant.apical).toFixed(1));
    o += tx(X, 322, "tooth: " + (u > 0.01 ? tm + " µm" : "at rest"), "im-strong", "middle");
    o += tx(Y, 322, "implant: " + (u > 0.01 ? im + " µm" : "at rest"), "im-strong", "middle");
  } else {
    /* opposing teeth come down: light closure (u small) to clench (u = 1); the tooth sinks into its PDL on the clench */
    var gapI = (1 - u) * 6 + 0.01, oppT = 90 + dyT, oppI = 90 + dyI - gapI;
    o += '<path class="im-tooth im-opp" d="' + C([[X - 36, oppT - 4], [X - 32, oppT - 50], [X + 32, oppT - 50], [X + 36, oppT - 4], [X + 22, oppT + 4], [X + 8, oppT - 2], [X - 8, oppT + 4], [X - 22, oppT - 2]]) + '"/>';
    o += '<path class="im-tooth im-opp" d="' + C([[Y - 36, oppI - 4], [Y - 32, oppI - 50], [Y + 32, oppI - 50], [Y + 36, oppI - 4], [Y + 22, oppI + 4], [Y + 8, oppI - 2], [Y - 8, oppI + 4], [Y - 22, oppI - 2]]) + '"/>';
    var holdI = u > 0.85;
    o += '<path class="im-shim is-hold" d="M' + (X - 58) + " " + f(oppT + 6) + "L" + (X + 50) + " " + f(oppT + 6) + '"/>' + tx(X - 60, oppT + 10, "holds", "im-key", "end");
    o += '<path class="im-shim' + (holdI ? " is-hold" : "") + '" d="M' + (Y - 58) + " " + f(oppI + 6 + gapI * 0.5) + "L" + (Y + 50) + " " + f(oppI + 6 + gapI * 0.5) + '"/>' + tx(Y - 60, oppI + 10, holdI ? "holds" : "pulls through", "im-key", "end");
    o += tx(X, 322, u > 0.85 ? "clench: sinks into its PDL" : "light closure", "im-strong", "middle") + tx(Y, 322, u > 0.85 ? "clench: now holds too" : "very light: some resistance", "im-strong", "middle");
  }
  o += tx(X, 14, "natural tooth", "im-head", "middle") + tx(Y, 14, "implant", "im-head", "middle");
  return o;
}

const svg = figureSvg({ width: W, height: H, className: "im-svg", label: "A natural tooth in its periodontal ligament beside an implant fused to bone, each under the same load.", body: imSvg({ tab: "load", dir: "ap", u: 0 }, D) });
const plate = plateHtml({ fig: "Fig 10", title: "Tooth vs implant", hint: "load them", readout: "movement drawn ×500", body: `<div class="am-svg im-box">${svg}</div>` });
const controls = `<div class="am-controls im-tabs" role="group" aria-label="View"><button type="button" class="am-btn" data-imtab="load" aria-pressed="true">Under load</button><button type="button" class="am-btn" data-imtab="shim" aria-pressed="false">Shimstock check</button></div>
<div class="am-controls" data-imrow="load" role="group" aria-label="Direction"><button type="button" class="am-btn" data-imdir="ap" aria-pressed="true">Push down</button><button type="button" class="am-btn" data-imdir="lat" aria-pressed="false">Push sideways</button></div>
<div class="am-controls"><label class="am-slider"><span data-imlo>no load</span><input type="range" min="0" max="100" step="1" value="0" aria-label="How hard"><span data-imhi>about 10 lb</span></label><button type="button" class="am-btn" data-implay aria-pressed="false">Press</button></div>
<div class="am-stats"><span><b>Down</b> <em>tooth about 28 µm · implant about 2-3 µm</em></span><span><b>Sideways</b> <em>tooth 56-75 µm (posterior), 90-108 µm (anterior) · implant 10-50 µm</em></span><span><b>Shimstock</b> <em>about 12 µm</em></span></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Tap or hover the ligament, the implant fixture or a crown.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>The numbers are the L5 notes' table (loads under about 10 lb) and its shimstock check; proprioception and the PDL's 20 µm sensitivity are from L1/L5.</li>
<li>Movements are drawn 500 times larger (28 µm becomes 14 px). Sideways movement is drawn as a tip about a point low on the root, with the midpoint of each range. The ligament's width, the threads and the bone are schematic.</li></ul></details>`;

function imLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var svg = root.querySelector(".im-svg"), slider = root.querySelector('input[type="range"]'), play = root.querySelector("[data-implay]");
  var sum = root.querySelector(".am-summary"), infoEl = root.querySelector(".am-info"), lo = root.querySelector("[data-imlo]"), hi = root.querySelector("[data-imhi]"), dirRow = root.querySelector('[data-imrow="load"]');
  var st = { tab: "load", dir: "ap", u: 0 }, frame = 0, t0 = 0, from = 0, to = 1, playing = false;
  function draw() {
    svg.innerHTML = D.imSvg(st, D);
    dirRow.hidden = st.tab !== "load"; lo.textContent = st.tab === "load" ? "no load" : "light closure"; hi.textContent = st.tab === "load" ? "about 10 lb" : "clench"; play.textContent = st.tab === "load" ? "Press" : "Close";
    var t;
    if (st.tab === "load") t = st.dir === "ap"
      ? "Pushed straight down with about 10 lb, the tooth sinks about 28 µm on its periodontal ligament, and the ligament feels it (proprioception). The implant, locked in bone with no ligament, moves about 2-3 µm by straining the bone, and nothing feels it. That's why an implant canine shouldn't guide alone, and why its contacts are built light."
      : "Pushed sideways, a posterior tooth tips 56-75 µm (an anterior one 90-108 µm); the implant moves 10-50 µm. Posterior implants: avoid contact in excursions if possible (mutually protected occlusion). Anterior implants: avoid immediate canine disclusion and share the load with the natural teeth, which have proprioception.";
    else t = st.u > 0.85
      ? "On a clench the natural teeth drop into their ligaments and the implant crown now meets its opponent: the shimstock holds on all of them. Implant crowns: equal contact in maximum intercuspation (no contact at all would let the opposing tooth supererupt)."
      : "On a light closure the shimstock (about 12 µm) holds on the natural teeth and pulls through the implant crown with some resistance: implant crowns are built very light in casual closure, because the implant can't sink the way a tooth does.";
    if (sum.textContent !== t) sum.textContent = t;
  }
  function stop() { playing = false; cancelAnimationFrame(frame); play.setAttribute("aria-pressed", "false"); }
  function tick(now) { if (!t0) t0 = now; var q = Math.min(1, (now - t0) / 1200), e = q < .5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2; st.u = from + (to - from) * e; slider.value = Math.round(st.u * 100); draw(); if (q < 1) frame = requestAnimationFrame(tick); else stop(); }
  play.addEventListener("click", function () { if (playing) { stop(); return; } from = st.u; to = st.u > 0.5 ? 0 : 1; if (reduce.matches) { st.u = to; slider.value = Math.round(st.u * 100); draw(); return; } playing = true; t0 = 0; play.setAttribute("aria-pressed", "true"); frame = requestAnimationFrame(tick); });
  slider.addEventListener("input", function () { stop(); st.u = +slider.value / 100; draw(); });
  root.querySelectorAll("[data-imtab]").forEach(function (b) { b.addEventListener("click", function () { stop(); st.tab = b.getAttribute("data-imtab"); st.u = 0; slider.value = 0; root.querySelectorAll("[data-imtab]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); draw(); }); });
  root.querySelectorAll("[data-imdir]").forEach(function (b) { b.addEventListener("click", function () { st.dir = b.getAttribute("data-imdir"); root.querySelectorAll("[data-imdir]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); draw(); }); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && svg.contains(el)) infoEl.textContent = el.getAttribute("data-info"); }
  svg.addEventListener("pointerover", hot); svg.addEventListener("click", hot);
  draw();
}

const CSS = `
.anima .im-box{max-width:560px;margin:0 auto}
.anima [data-imrow][hidden]{display:none}
.anima .im-svg .im-t{fill:var(--anatomy-text);font:14px var(--anatomy-mono);paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round}
.anima .im-svg .im-head{fill:var(--anatomy-strong);font-weight:600}
.anima .im-svg .im-strong{fill:var(--anatomy-strong);font-size:13px}
.anima .im-svg .im-key{fill:var(--anatomy-lit);font-weight:600;font-size:13px}
.anima .im-svg .im-bone{fill:var(--tm-bone);stroke:var(--anatomy-hi);stroke-width:1}
.anima .im-svg .im-trab{fill:var(--tm-trab);opacity:.7}
.anima .im-svg .im-gum{fill:var(--tm-retro);stroke:var(--tm-muscle-fib);stroke-width:.8}
.anima .im-svg .im-socket{fill:var(--tm-bone-in);stroke:var(--anatomy-hi);stroke-width:1}
.anima .im-svg .im-pdl{fill:var(--tm-retro);stroke:none}
.anima .im-svg .im-root{fill:#efe2c4;stroke:#8b7653;stroke-width:1}
.anima .im-svg .im-tooth{fill:#f6efe0;stroke:#8b7653;stroke-width:1.1}
.anima .im-svg .im-opp{fill:#efe6d2}
.anima .im-svg .im-fixture{fill:#aab2bf;stroke:#55606f;stroke-width:1}
.anima .im-svg .im-abut{fill:#c3c9d2;stroke:#55606f;stroke-width:1}
.anima .im-svg .im-force{fill:none;stroke:var(--anatomy-lit);stroke-width:2.6;stroke-linecap:round}
.anima .im-svg .im-force.im-ah{fill:var(--anatomy-lit);stroke:none}
.anima .im-svg .im-wave{fill:none;stroke:var(--anatomy-lit);stroke-width:2;stroke-linecap:round}
.anima .im-svg .im-shim{stroke:#c0392b;stroke-width:2.4;stroke-dasharray:6 4}
.anima .im-svg .im-shim.is-hold{stroke-dasharray:none}
`;

export function implant() {
  return {
    id: "implant", lec: "applying",
    title: "A tooth and an implant under load",
    caption: "Load a natural tooth in its ligament and an implant fused to bone with the same force and compare how far each moves, then run the shimstock check on a light closure and on a clench.",
    html: `<div class="anima" data-anima="implant">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: imLive.toString(),
    helpers: [imSvg],
    data: D,
  };
}
