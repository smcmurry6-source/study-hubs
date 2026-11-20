// Fig: a tooth vs an implant under load (Occlusion L5, "Implants"). A natural tooth (a premolar in buccolingual
// section, buccal to the left) in its periodontal ligament beside an implant locked in bone. Tab 1, under load (about
// 10 lb): the tooth sinks about 28 µm on its ligament (or tips 56-75 µm sideways, posterior teeth), which its ligament
// feels (proprioception); the implant moves about 2-3 µm (10-50 µm sideways), bone strain only. Tab 2, the shimstock
// check (about 12 µm): on a light closure the strip holds on the natural tooth and drags through the implant crown with
// some resistance; on a clench the tooth drops into its ligament and the strip holds on both. Every number is the
// notes' own. Scale: the teeth are drawn at about 8 px per mm (a premolar crown about 8 mm wide and tall, a 13 mm root);
// movements at 0.25 px per µm, about 30 times the teeth's scale; the ligament about 1 mm wide, about 5 times its real
// width (about 0.2 mm), so the drawn movement fits inside it. Shapes are schematic.
import { figureSvg, plateHtml } from "./shared.mjs";

const W = 460, H = 332;
const D = {
  W, H, k: 0.25, /* px per µm */
  tooth: { apical: 28, lateral: 65, latRange: "56-75 µm (posterior teeth)" },
  implant: { apical: 2.5, apicalRange: "2-3 µm", lateral: 30, latRange: "10-50 µm" },
  shim: 12,
  XT: 120, XI: 336, CREST: 172, TOP: 96,
  /* the tooth, relative to its long axis (x) at absolute heights (y): crown from the buccal CEJ over the cusps (buccal
     cusp, central fossa, lingual cusp) to the lingual CEJ, then the root down to the apex and back */
  CROWN: [[-23, 162], [-28, 148], [-30, 132], [-29, 118], [-24, 105], [-15, 96], [-7, 102], [1, 111], [8, 105], [17, 100], [25, 107], [29, 118], [30, 132], [28, 148], [23, 162]],
  ROOT: [[22, 174], [20, 192], [17, 216], [12, 242], [6, 261], [0, 267], [-6, 261], [-12, 242], [-17, 216], [-20, 192], [-22, 174]],
  /* dentin-enamel junction (enamel about 2 mm over the cusps, thinning to nothing at the CEJ) and the pulp */
  DEJ: [[-23, 162], [-24, 150], [-22, 134], [-19, 121], [-14, 112], [-7, 116], [1, 121], [9, 117], [15, 116], [20, 122], [22, 134], [23, 150], [23, 162]],
  PULP: [[-10, 130], [-12, 121], [-8, 124], [0, 129], [8, 125], [11, 121], [11, 131], [8, 143], [5, 166], [3, 200], [1.6, 238], [.8, 259], [-.8, 259], [-1.6, 238], [-3, 200], [-5, 166], [-8, 143]],
  /* the socket (alveolar bone proper): the root offset by about 8 px, 10 at the apex; the ligament fills it */
  SOCKET: [[31, 171], [29, 190], [26, 216], [20, 246], [11, 271], [0, 277], [-11, 271], [-20, 246], [-26, 216], [-29, 190], [-31, 171]],
  /* implant crown: the same occlusal form, emerging from the abutment */
  ICROWN: [[-12, 163], [-21, 153], [-28, 141], [-30, 128], [-29, 118], [-24, 105], [-15, 96], [-7, 102], [1, 111], [8, 105], [17, 100], [25, 107], [29, 118], [30, 128], [28, 141], [21, 153], [12, 163]],
  CT: 238, CI: 236, /* centers of tipping: the root's apical third, low on the fixture */
};

function imSvg(st, D) {
  var f = function (n) { return Math.round(n * 10) / 10; }, o = "", k = D.k, tab = st.tab, u = st.u, cr = D.CREST;
  function C(pts) { var n = pts.length, d = "M" + f(pts[0][0]) + " " + f(pts[0][1]);
    for (var i = 0; i < n; i++) { var p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      d += "C" + f(p1[0] + (p2[0] - p0[0]) / 6) + " " + f(p1[1] + (p2[1] - p0[1]) / 6) + " " + f(p2[0] - (p3[0] - p1[0]) / 6) + " " + f(p2[1] - (p3[1] - p1[1]) / 6) + " " + f(p2[0]) + " " + f(p2[1]); }
    return d + "Z"; }
  function O(pts) { var n = pts.length, d = "M" + f(pts[0][0]) + " " + f(pts[0][1]);
    for (var i = 0; i < n - 1; i++) { var p0 = pts[i ? i - 1 : 0], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2 < n ? i + 2 : i + 1];
      d += "C" + f(p1[0] + (p2[0] - p0[0]) / 6) + " " + f(p1[1] + (p2[1] - p0[1]) / 6) + " " + f(p2[0] - (p3[0] - p1[0]) / 6) + " " + f(p2[1] - (p3[1] - p1[1]) / 6) + " " + f(p2[0]) + " " + f(p2[1]); }
    return d; }
  function at(X, pts) { return pts.map(function (p) { return [X + p[0], p[1]]; }); }
  function tx(x, y, t, cls, a) { return '<text class="im-t' + (cls ? " " + cls : "") + '" x="' + f(x) + '" y="' + f(y) + '"' + (a ? ' text-anchor="' + a + '"' : "") + ">" + t + "</text>"; }
  function arrow(x1, y1, x2, y2, cls) { var dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, h = 8;
    return '<path class="' + cls + '" d="M' + f(x1) + " " + f(y1) + "L" + f(x2 - ux * 4) + " " + f(y2 - uy * 4) + '"/><path class="' + cls + ' im-ah" d="M' + f(x2) + " " + f(y2) + "L" + f(x2 - ux * h - uy * h * .55) + " " + f(y2 - uy * h + ux * h * .55) + "L" + f(x2 - ux * h + uy * h * .55) + " " + f(y2 - uy * h - ux * h * .55) + 'Z"/>'; }
  /* the shimstock check is always a straight closure; only the load tab can push sideways */
  var lat = tab === "load" && st.dir === "lat";
  var X = D.XT, Y = D.XI;
  /* displacement at the crown's top: down (axial) or sideways (a tip about a point in the apical third) */
  var tD = u * (lat ? D.tooth.lateral : D.tooth.apical) * k, iD = u * (lat ? D.implant.lateral : D.implant.apical) * k;
  var tDy = lat ? 0 : tD, iDy = lat ? 0 : iD;
  var tA = lat ? Math.atan2(tD, D.CT - D.TOP) : 0, iA = lat ? Math.atan2(iD, D.CI - D.TOP) : 0;
  function mover(cx, cy, a, dy) { var c = Math.cos(a), s = Math.sin(a); return function (p) { return [cx + (p[0] - cx) * c - (p[1] - cy) * s, cy + (p[0] - cx) * s + (p[1] - cy) * c + dy]; }; }
  var mT = mover(X, D.CT, tA, tDy), mI = mover(Y, D.CI, iA, iDy);
  var gT = 'transform="translate(0 ' + f(tDy) + ") rotate(" + f(tA * 180 / Math.PI) + " " + X + " " + D.CT + ')"';
  var gI = 'transform="translate(0 ' + f(iDy) + ") rotate(" + f(iA * 180 / Math.PI) + " " + Y + " " + D.CI + ')"';
  /* bone, sectioned, with the socket; the ligament fills the socket and the root moves inside it */
  o += '<path class="im-bone" d="M14 ' + cr + "L446 " + cr + 'L446 306L14 306Z"/>';
  [[30, 200, 3], [52, 236, 4], [74, 282, 3], [44, 286, 5], [176, 196, 3], [196, 232, 4], [168, 270, 5], [210, 290, 3], [246, 210, 4], [262, 262, 3], [290, 292, 4],
   [392, 196, 3], [410, 240, 5], [430, 282, 3], [384, 290, 4], [246, 186, 3], [160, 296, 3], [70, 190, 3]].forEach(function (b) { o += '<circle class="im-trab" cx="' + b[0] + '" cy="' + b[1] + '" r="' + b[2] + '"/>'; });
  o += '<path class="im-pdl hot" data-info="Periodontal ligament: the tooth is slung in it, so it moves (about 28 µm down under about 10 lb) and its nerve endings feel it: proprioception. The PDL detects material down to about 20 µm." d="' + O(at(X, D.SOCKET)) + 'Z"/>';
  o += '<path class="im-lamina" d="' + O(at(X, D.SOCKET)) + '"/>';
  /* natural tooth: dentin and root, enamel cap, pulp */
  o += '<g class="hot" data-info="Natural tooth (a premolar, cut buccolingually): enamel crown, dentin, pulp, and a root held in bone by its periodontal ligament." ' + gT + '>';
  o += '<path class="im-dentin" d="' + C(at(X, D.CROWN.concat(D.ROOT))) + '"/>';
  o += '<path class="im-enamel" d="' + O(at(X, D.CROWN)) + O(at(X, D.DEJ.slice().reverse())).replace(/^M[^C]*/, "") + 'Z"/>';
  o += '<path class="im-pulp" d="' + C(at(X, D.PULP)) + '"/></g>';
  /* implant: fixture threaded straight into bone, abutment, crown; it barely moves */
  var th = "M" + (Y - 15) + " " + (cr + 1);
  for (var t = 0; t < 7; t++) { var yy = cr + 5 + t * 11; th += "L" + (Y - 19) + " " + (yy + 3) + "L" + (Y - 15) + " " + (yy + 8); }
  th += "L" + (Y - 13) + " " + (cr + 86) + "Q" + Y + " " + (cr + 92) + " " + (Y + 13) + " " + (cr + 86);
  for (t = 6; t >= 0; t--) { yy = cr + 5 + t * 11; th += "L" + (Y + 15) + " " + (yy + 8) + "L" + (Y + 19) + " " + (yy + 3); }
  th += "L" + (Y + 15) + " " + (cr + 1) + "Z";
  o += '<g ' + gI + '>';
  o += '<path class="im-fixture hot" data-info="Implant fixture: titanium locked in bone (osseointegrated), with no periodontal ligament. Under about 10 lb it moves about 2-3 µm, only by straining the bone, and nothing in it feels the load." d="' + th + '"/>';
  o += '<path class="im-abut" d="M' + (Y - 11) + " " + (cr + 1) + "L" + (Y - 10) + " " + (cr - 22) + "L" + (Y + 10) + " " + (cr - 22) + "L" + (Y + 11) + " " + (cr + 1) + 'Z"/>';
  o += '<path class="im-enamel im-icrown hot" data-info="Implant crown, on an abutment screwed to the fixture." d="' + C(at(Y, D.ICROWN)) + '"/></g>';
  /* gingiva (and the mucosa around the implant), cut through, over the bone: its inner edge stays on the tooth (and on
     the implant crown and abutment) as they move */
  function edge(Xc, m, side, inner) { return inner.map(function (p) { return m([Xc + side * p[0], p[1]]); }); }
  function tail(pts) { return O(pts).replace(/^M[^C]*/, ""); }
  var gInT = [[27.5, 155], [24, 162], [22.3, 170]], gInI = [[22.5, 152.5], [17, 158], [11.2, 164], [10.6, cr - 1]];
  var tL = edge(X, mT, -1, gInT), tR = edge(X, mT, 1, gInT), iL = edge(Y, mI, -1, gInI), iR = edge(Y, mI, 1, gInI);
  var gs = cr - 11, b0 = cr + .5;
  o += '<path class="im-gum" d="M14 ' + b0 + "L14 " + gs + tail([[14, gs], [X - 58, gs], [X - 44, gs - 1.5], [X - 34, gs - 4.5], tL[0]]) + tail(tL) + "L" + (X - 31) + " " + b0 + 'Z"/>';
  o += '<path class="im-gum" d="M' + f(tR[0][0]) + " " + f(tR[0][1]) + tail(tR) + "L" + (X + 31) + " " + b0 + "L" + f(iL[iL.length - 1][0]) + " " + b0 + "L" + f(iL[iL.length - 1][0]) + " " + f(iL[iL.length - 1][1]) +
    tail(iL.slice().reverse()) + tail([iL[0], [Y - 30, gs - 4.5], [Y - 42, gs - 1.5], [228, gs], [X + 44, gs - 1.5], [X + 34, gs - 4.5], tR[0]]) + 'Z"/>';
  o += '<path class="im-gum" d="M' + f(iR[0][0]) + " " + f(iR[0][1]) + tail(iR) + "L" + f(iR[iR.length - 1][0]) + " " + b0 + "L446 " + b0 + "L446 " + gs + tail([[446, gs], [Y + 56, gs], [Y + 42, gs - 1.5], [Y + 30, gs - 4.5], iR[0]]) + 'Z"/>';
  if (tab === "load") {
    /* the load, and what each one reports */
    if (u > 0.01) {
      if (lat) {
        o += arrow(X - 88, 120, X - 31 + tD * .75, 120, "im-force") + arrow(Y - 88, 120, Y - 31 + iD * .75, 120, "im-force");
        o += tx(X - 58, 84, "about 10 lb", "im-key", "middle") + tx(Y - 58, 84, "about 10 lb", "im-key", "middle");
      } else {
        o += arrow(X - 15, 46, X - 15, 92 + tDy, "im-force") + arrow(Y - 15, 46, Y - 15, 92 + iDy, "im-force");
        o += tx(X - 15, 38, "about 10 lb", "im-key", "middle") + tx(Y - 15, 38, "about 10 lb", "im-key", "middle");
      }
      /* proprioception: the ligament's nerve endings fire; the implant has none */
      if (u > 0.3) {
        var op = f(Math.min(1, (u - 0.3) * 2));
        for (var w = 0; w < 3; w++) o += '<path class="im-wave" style="opacity:' + f(op * (1 - w * .25)) + '" d="M' + (X + 34 + w * 8) + " " + (226 - w * 3) + "q5 -8 0 -16" + '"/>';
        o += tx(X + 62, 222, "felt", "im-key") + '<g style="opacity:' + op + '">' + tx(Y + 26, 222, "not felt", "im-mut") + "</g>";
      }
    }
    /* at full load the notes' own figures; on the way there, the drawn movement in µm */
    var full = u > 0.98, tm = full ? (lat ? "56-75" : "about 28") : "about " + Math.round(u * (lat ? D.tooth.lateral : D.tooth.apical));
    var im = full ? (lat ? "10-50" : "about 2-3") : "about " + (lat ? Math.round(u * D.implant.lateral) : (u * D.implant.apical).toFixed(1));
    o += tx(X, 324, "tooth: " + (u > 0.01 ? tm + " µm" : "at rest"), "im-strong", "middle");
    o += tx(Y, 324, "implant: " + (u > 0.01 ? im + " µm" : "at rest"), "im-strong", "middle");
  } else {
    /* opposing crowns (cusp to cusp, schematic): light closure (u = 0) to clench (u = 1). The natural tooth and its
       opponent drop into their ligaments together; the strip (12 µm, drawn to the movement scale) lies in the gap. On the
       implant the gap is just the strip's thickness, so it drags through until a clench presses it. */
    var s = D.shim * k, yc = D.TOP - s / 2;
    function opp(Xc, dy) { return D.CROWN.map(function (p) { return [Xc + p[0], 2 * yc - p[1] + dy]; }); }
    var holdI = u > 0.85;
    o += '<path class="im-enamel im-opp" d="' + C(opp(X, tDy)) + '"/><path class="im-enamel im-opp" d="' + C(opp(Y, iDy)) + '"/>';
    o += '<rect class="im-shim is-hold" x="' + (X - 48) + '" y="' + f(D.TOP - s + tDy) + '" width="96" height="' + f(s) + '"/>' + tx(X - 52, D.TOP + 3 + tDy, "holds", "im-key", "end");
    o += '<rect class="im-shim' + (holdI ? " is-hold" : "") + '" x="' + (Y - 48) + '" y="' + f(D.TOP - s + iDy) + '" width="96" height="' + f(s) + '"/>' + tx(Y - 52, D.TOP + 3 + iDy, holdI ? "holds" : "drags through", "im-key", "end");
    if (!holdI) o += arrow(Y + 50, D.TOP - s / 2 + iDy, Y + 70, D.TOP - s / 2 + iDy, "im-pull");
    o += tx(X, 324, u > 0.85 ? "clench: sinks into its PDL" : "light closure", "im-strong", "middle") + tx(Y, 324, u > 0.85 ? "clench: now holds too" : "very light: some resistance", "im-strong", "middle");
  }
  o += tx(X, 16, "natural tooth", "im-head", "middle") + tx(Y, 16, "implant", "im-head", "middle");
  return o;
}

const svg = figureSvg({ width: W, height: H, className: "im-svg", label: "A natural premolar in its periodontal ligament beside an implant fused to bone, each cut buccolingually, under the same load.", body: imSvg({ tab: "load", dir: "ap", u: 0 }, D) });
const plate = plateHtml({ fig: "Fig 10", title: "Tooth vs implant", hint: "load them", readout: "movement drawn ×30", body: `<div class="am-svg im-box">${svg}</div>` });
const controls = `<div class="am-controls im-tabs" role="group" aria-label="View"><button type="button" class="am-btn" data-imtab="load" aria-pressed="true">Under load</button><button type="button" class="am-btn" data-imtab="shim" aria-pressed="false">Shimstock check</button></div>
<div class="am-controls" data-imrow="load" role="group" aria-label="Direction"><button type="button" class="am-btn" data-imdir="ap" aria-pressed="true">Push down</button><button type="button" class="am-btn" data-imdir="lat" aria-pressed="false">Push sideways</button></div>
<div class="am-controls"><label class="am-slider"><span data-imlo>no load</span><input type="range" min="0" max="100" step="1" value="0" aria-label="How hard"><span data-imhi>about 10 lb</span></label><button type="button" class="am-btn" data-implay aria-pressed="false">Press</button></div>
<div class="am-stats"><span><b>Down</b> <em>tooth about 28 µm · implant about 2-3 µm</em></span><span><b>Sideways</b> <em>tooth 56-75 µm (posterior), 90-108 µm (anterior) · implant 10-50 µm</em></span><span><b>Shimstock</b> <em>about 12 µm</em></span></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Tap or hover the ligament, the implant fixture or a crown.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>The numbers are the L5 notes' table (loads under about 10 lb) and its shimstock check; proprioception and the PDL's 20 µm sensitivity are from L1/L5.</li>
<li>Movements are drawn about 30 times larger than the teeth (28 µm becomes 7 px, where a millimeter of tooth is about 8 px), and the ligament about 5 times its real width of about 0.2 mm, so the tooth can be seen moving inside it. Sideways movement is drawn as a tip about a point in the root's apical third, with the midpoint of each range (65 µm for the tooth, 30 µm for the implant). The shimstock is drawn to the movement scale, between cusp tips. The threads, the bone and the soft tissue are schematic.</li></ul></details>`;

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
      ? "On a clench the natural teeth drop into their ligaments, so the implant crown is pressed against its opponent too: the shimstock holds on all of them. Implant crowns: equal contact in maximum intercuspation (no contact at all would let the opposing tooth supererupt)."
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
.anima .im-svg .im-mut{fill:var(--anatomy-muted);font-size:12.5px;stroke:var(--tm-bone)}
.anima .im-svg .im-bone{fill:var(--tm-bone);stroke:var(--anatomy-hi);stroke-width:1}
.anima .im-svg .im-trab{fill:var(--tm-trab);opacity:.7}
.anima .im-svg .im-gum{fill:var(--tm-retro);stroke:var(--tm-muscle-fib);stroke-width:.8;stroke-linejoin:round}
.anima .im-svg .im-pdl{fill:var(--tm-retro);stroke:none}
.anima .im-svg .im-lamina{fill:none;stroke:var(--anatomy-hi);stroke-width:1.3}
.anima .im-svg .im-dentin{fill:#efe2c4;stroke:#8b7653;stroke-width:1.1;stroke-linejoin:round}
.anima .im-svg .im-enamel{fill:#fbf7ee;stroke:#8b7653;stroke-width:1.1;stroke-linejoin:round}
.anima .im-svg .im-pulp{fill:#e7aaa2;stroke:#b5655d;stroke-width:.8}
.anima .im-svg .im-opp{fill:#f3ecdc}
.anima .im-svg .im-fixture{fill:#aab2bf;stroke:#55606f;stroke-width:1;stroke-linejoin:round}
.anima .im-svg .im-abut{fill:#c3c9d2;stroke:#55606f;stroke-width:1}
.anima .im-svg .im-force{fill:none;stroke:var(--anatomy-lit);stroke-width:2.6;stroke-linecap:round}
.anima .im-svg .im-force.im-ah{fill:var(--anatomy-lit);stroke:none}
.anima .im-svg .im-pull{fill:none;stroke:#c0392b;stroke-width:1.6;stroke-linecap:round}
.anima .im-svg .im-pull.im-ah{fill:#c0392b;stroke:none}
.anima .im-svg .im-wave{fill:none;stroke:var(--anatomy-lit);stroke-width:2;stroke-linecap:round}
.anima .im-svg .im-shim{fill:#e0574a;fill-opacity:.35;stroke:#c0392b;stroke-width:1.2;stroke-dasharray:4 3;vector-effect:none}
.anima .im-svg .im-shim.is-hold{fill-opacity:1;stroke-dasharray:none}
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
