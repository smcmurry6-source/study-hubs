// Fig: where to take a lateral record (Occlusion L6, "How far to move to capture Bennett angle"). Dr. Givan's top-view
// stick drawing, animated: the straight protrusive line, and the orbiting condyle's path in a lateral move, which bows
// medially and then straightens. A record taken at 3-5 mm of condylar movement (B) measures a larger Bennett angle "b";
// at 7-10 mm (C), a smaller "c". On the right, the central fossa a crown gets from that angle: built at c it is
// narrower, and the opposing cusp's real path rides out onto the ridge (an interference). The path is a smooth curve of
// that shape; no angles are given as numbers (the notes give none).
import { figureSvg, plateHtml } from "./shared.mjs";

const W = 520, H = 300;
const D = {
  W, H, A: [130, 262], K: 19, /* CR position on screen; px per mm of condylar movement */
  BEND: 1.45, /* medial bow of the orbiting path, mm per sqrt(mm), schematic */
  SB: 4, SC: 8.5, /* records at about 4 mm (3-5) and 8.5 mm (7-10) */
  M: [392, 150], /* lower molar center in the right panel */
};

function bnPath(s, D) { return [D.A[0] + D.BEND * Math.sqrt(Math.max(0, s)) * D.K, D.A[1] - s * D.K]; }
function bnAngle(s, D) { var p = D.bnPath(s, D); return Math.atan2(p[0] - D.A[0], D.A[1] - p[1]); }

function bnSvg(st, D) {
  var f = function (n) { return Math.round(n * 10) / 10; }, o = "", A = D.A, u = st.u;
  function tx(x, y, t, cls, a) { return '<text class="bn-t' + (cls ? " " + cls : "") + '" x="' + f(x) + '" y="' + f(y) + '"' + (a ? ' text-anchor="' + a + '"' : "") + ">" + t + "</text>"; }
  var B = D.bnPath(D.SB, D), Cp = D.bnPath(D.SC, D), sRec = st.rec === "B" ? D.SB : D.SC, ang = D.bnAngle(sRec, D), angB = D.bnAngle(D.SB, D);
  /* the straight protrusive line and the curved orbiting path, drawn to how far the condyle has moved */
  o += '<path class="bn-prot" d="M' + A[0] + " " + A[1] + "L" + A[0] + ' 30"/>' + tx(A[0] + 6, 22, "straight protrusion", "bn-cap", "start");
  var d = "", sMax = 11 * Math.max(0.02, u);
  for (var i = 0; i <= 40; i++) { var p = D.bnPath(sMax * i / 40, D); d += (i ? "L" : "M") + f(p[0]) + " " + f(p[1]); }
  o += '<path class="bn-orbit hot" data-info="The orbiting (non-working) condyle\'s path in a lateral move: anterior, inferior and medial. It bows medially at first, then straightens, so the angle to the straight protrusive path depends on how far you measure." d="' + d + '"/>';
  var cur = D.bnPath(sMax, D);
  o += '<circle class="bn-condyle" cx="' + f(cur[0]) + '" cy="' + f(cur[1]) + '" r="8"/>';
  /* the two records and their chords */
  if (u > 0.4) {
    o += '<path class="bn-chord' + (st.rec === "B" ? " is-on" : "") + '" d="M' + A[0] + " " + A[1] + "L" + f(B[0] + (B[0] - A[0]) * 1.4) + " " + f(B[1] + (B[1] - A[1]) * 1.4) + '"/>';
    o += '<circle class="bn-pt" cx="' + f(B[0]) + '" cy="' + f(B[1]) + '" r="4"/>' + tx(B[0] + 10, B[1] + 4, "B: 3-5 mm", "bn-lab", "start");
  }
  if (u > 0.85) {
    o += '<path class="bn-chord' + (st.rec === "C" ? " is-on" : "") + '" d="M' + A[0] + " " + A[1] + "L" + f(Cp[0] + (Cp[0] - A[0]) * 0.3) + " " + f(Cp[1] + (Cp[1] - A[1]) * 0.3) + '"/>';
    o += '<circle class="bn-pt" cx="' + f(Cp[0]) + '" cy="' + f(Cp[1]) + '" r="4"/>' + tx(Cp[0] + 10, Cp[1] + 4, "C: 7-10 mm", "bn-lab", "start");
    /* the two angles at A */
    var aB = D.bnAngle(D.SB, D), aC = D.bnAngle(D.SC, D);
    var arcAt = function (rad, a, cls, lbl) { var x1 = A[0], y1 = A[1] - rad, x2 = A[0] + Math.sin(a) * rad, y2 = A[1] - Math.cos(a) * rad; return '<path class="' + cls + '" d="M' + x1 + " " + y1 + "A" + rad + " " + rad + " 0 0 1 " + f(x2) + " " + f(y2) + '"/>' + tx(A[0] + Math.sin(a / 2) * (rad + 10), A[1] - Math.cos(a / 2) * (rad + 10), lbl, "bn-lab", "middle"); };
    o += arcAt(46, aB, "bn-arc" + (st.rec === "B" ? " is-on" : ""), "b") + arcAt(78, aC, "bn-arc" + (st.rec === "C" ? " is-on" : ""), "c");
  }
  o += '<circle class="bn-pt bn-a" cx="' + A[0] + '" cy="' + A[1] + '" r="5"/>' + tx(A[0] - 10, A[1] + 4, "A: CR", "bn-lab", "end");
  o += tx(A[0] + 90, A[1] + 4, "medial →", "bn-cap", "start") + tx(14, 292, "↑ anterior · seen from above", "bn-cap", "start");
  /* right panel: the central fossa built from the recorded angle, and the opposing cusp's real early path (at b) */
  var M = D.M, half = 52;
  o += '<path class="bn-molar hot" data-info="A lower molar from above. Its central fossa has to be wide enough for the opposing cusp\'s path in the non-working movement; the Bennett angle set on the articulator decides how wide it is built." d="M' + (M[0] - 70) + " " + (M[1] - 40) + "Q" + (M[0] - 74) + " " + (M[1] - 62) + " " + (M[0] - 40) + " " + (M[1] - 62) + "L" + (M[0] + 44) + " " + (M[1] - 60) + "Q" + (M[0] + 76) + " " + (M[1] - 58) + " " + (M[0] + 72) + " " + (M[1] - 30) + "L" + (M[0] + 70) + " " + (M[1] + 34) + "Q" + (M[0] + 70) + " " + (M[1] + 60) + " " + (M[0] + 40) + " " + (M[1] + 60) + "L" + (M[0] - 44) + " " + (M[1] + 62) + "Q" + (M[0] - 74) + " " + (M[1] + 60) + " " + (M[0] - 72) + " " + (M[1] + 34) + 'Z"/>';
  [[-44, -38], [6, -42], [46, -30], [-40, 32], [24, 36]].forEach(function (c) { o += '<circle class="bn-cusp" cx="' + (M[0] + c[0]) + '" cy="' + (M[1] + c[1]) + '" r="11"/>'; });
  o += '<path class="bn-groove" d="M' + (M[0] - 62) + " " + (M[1] + 2) + "Q" + (M[0] - 20) + " " + (M[1] - 6) + " " + (M[0] + 10) + " " + (M[1] + 4) + "T" + (M[0] + 64) + " " + (M[1] - 2) + '"/>';
  var e = [M[0] - 20, M[1] + 44];
  function wedge(a) { var L = 96; return "M" + e[0] + " " + e[1] + "L" + f(e[0] + Math.sin(a) * L) + " " + f(e[1] - Math.cos(a) * L) + "L" + f(e[0]) + " " + f(e[1] - L) + "Z"; }
  o += '<path class="bn-fossa" d="' + wedge(ang) + '"/>';
  var L2 = 96, pe = [e[0] + Math.sin(angB) * L2, e[1] - Math.cos(angB) * L2];
  var inside = ang >= angB - 0.005;
  o += '<path class="bn-cusp-path" d="M' + e[0] + " " + e[1] + "L" + f(pe[0]) + " " + f(pe[1]) + '"/>';
  if (!inside) { var hitL = L2 * 0.45, hp = [e[0] + Math.sin(angB) * hitL, e[1] - Math.cos(angB) * hitL]; o += '<path class="bn-hitseg" d="M' + f(hp[0]) + " " + f(hp[1]) + "L" + f(pe[0]) + " " + f(pe[1]) + '"/><circle class="bn-spark" cx="' + f(hp[0]) + '" cy="' + f(hp[1]) + '" r="6"/>'; }
  o += '<circle class="bn-pt" cx="' + e[0] + '" cy="' + e[1] + '" r="3.5"/>';
  o += tx(M[0], M[1] + 88, st.rec === "B" ? "fossa built at b: the path fits" : "built at c: too narrow, it hits", "bn-res bn-" + (inside ? "ok" : "hit"), "middle");
  o += tx(M[0], 26, "lower molar, from above", "bn-cap", "middle");
  return o;
}

const svg = figureSvg({ width: W, height: H, className: "bn-svg", label: "Top view: the straight protrusive line and the orbiting condyle's curved path, with records at 3-5 mm and 7-10 mm, and the central fossa a crown gets from each.", body: bnSvg({ u: 1, rec: "B" }, Object.assign({ bnPath, bnAngle }, D)) });
const plate = plateHtml({ fig: "Fig", title: "Where to take a lateral record", hint: "move the condyle · pick a record", readout: "", body: `<div class="am-svg bn-box">${svg}</div>` });
const controls = `<div class="am-controls"><button type="button" class="am-btn" data-bnplay>Move the condyle</button><button type="button" class="am-btn" data-bnrec="B" aria-pressed="true">Record at 3-5 mm (B)</button><button type="button" class="am-btn" data-bnrec="C" aria-pressed="false">Record at 7-10 mm (C)</button></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Hover or tap the path or the molar.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From the L6 notes (Dr. Givan's Occ Lec4 slide "How far to move to capture Bennett angle" and the 10/22 recording): A is CR, the vertical line straight protrusion, the dotted line the orbiting condyle's path; a record at B (3-5 mm) gives a larger angle b, at C (7-10 mm) a smaller angle c, which builds narrower fossae and more likely interferences. Make records at 3-5 mm.</li>
<li>Schematic: the path is a smooth curve of that shape, not a measured one, and the molar is reduced to its central fossa and one opposing cusp's path. Educational, not clinical guidance.</li></ul></details>`;
const TEXT = {
  B: "Record at 3-5 mm (B): the chord from CR to B leans well away from straight protrusion, so the Bennett angle read is larger (b). Crowns built with it get central fossae wide enough for the opposing cusp's path.",
  C: "Record at 7-10 mm (C): by then the path has straightened, so the chord from CR leans less and the angle read is smaller (c). The articulator builds narrower fossae, and in the mouth the cusp's real path rides out onto the ridge: an interference. So take lateral records at 3-5 mm.",
};

function bnLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var svg = root.querySelector(".bn-svg"), sum = root.querySelector(".am-summary"), info = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]");
  var st = { u: 1, rec: "B" }, raf = 0;
  function draw() { svg.innerHTML = D.bnSvg(st, D); sum.textContent = D.TEXT[st.rec]; if (readout) readout.textContent = st.rec === "B" ? "B: larger angle" : "C: smaller angle"; }
  function play() {
    cancelAnimationFrame(raf);
    if (reduce.matches) { st.u = 1; draw(); return; }
    var t0 = performance.now();
    function step(now) { st.u = Math.min(1, (now - t0) / 2200); draw(); if (st.u < 1) raf = requestAnimationFrame(step); }
    st.u = 0; raf = requestAnimationFrame(step);
  }
  root.querySelector("[data-bnplay]").addEventListener("click", play);
  root.querySelectorAll("[data-bnrec]").forEach(function (b) { b.addEventListener("click", function () { st.rec = b.getAttribute("data-bnrec"); root.querySelectorAll("[data-bnrec]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); draw(); }); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && svg.contains(el)) info.textContent = el.getAttribute("data-info"); }
  svg.addEventListener("pointerover", hot); svg.addEventListener("click", hot);
  draw();
}

const CSS = `
.anima .bn-box{max-width:560px;margin:0 auto}
.anima .bn-svg .bn-t{fill:var(--anatomy-text);font:11.5px var(--anatomy-mono);paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round}
.anima .bn-svg .bn-cap{fill:var(--anatomy-muted);font-size:10.5px;stroke:none}
.anima .bn-svg .bn-lab{font-weight:600;fill:var(--anatomy-strong)}
.anima .bn-svg .bn-res{font-size:12px;font-weight:700}
.anima .bn-svg .bn-ok{fill:#2f8a5b}
.anima .bn-svg .bn-hit{fill:var(--tm-vessel)}
.anima .bn-svg .bn-prot{stroke:var(--anatomy-hi);stroke-width:1.6}
.anima .bn-svg .bn-orbit{fill:none;stroke:var(--anatomy-hi);stroke-width:2;stroke-dasharray:2 4;stroke-linecap:round}
.anima .bn-svg .bn-condyle{fill:var(--tm-bone-in);stroke:var(--anatomy-hi);stroke-width:1.4}
.anima .bn-svg .bn-chord{stroke:var(--anatomy-mid);stroke-width:1.2}
.anima .bn-svg .bn-chord.is-on{stroke:var(--anatomy-lit);stroke-width:2.2}
.anima .bn-svg .bn-arc{fill:none;stroke:var(--anatomy-mid);stroke-width:1.2}
.anima .bn-svg .bn-arc.is-on{stroke:var(--anatomy-lit);stroke-width:2.2}
.anima .bn-svg .bn-pt{fill:var(--anatomy-hi)}
.anima .bn-svg .bn-a{fill:var(--anatomy-lit)}
.anima .bn-svg .bn-molar{fill:var(--anatomy-face);stroke:var(--anatomy-hi);stroke-width:1.4}
.anima .bn-svg .bn-cusp{fill:var(--anatomy-shade-2);stroke:var(--anatomy-lo);stroke-width:1}
.anima .bn-svg .bn-groove{fill:none;stroke:var(--anatomy-mid);stroke-width:1.2}
.anima .bn-svg .bn-fossa{fill:var(--accent-soft);opacity:.85;stroke:var(--anatomy-lit);stroke-width:1.2}
.anima .bn-svg .bn-cusp-path{stroke:var(--anatomy-hi);stroke-width:2;stroke-dasharray:5 3}
.anima .bn-svg .bn-hitseg{stroke:var(--tm-vessel);stroke-width:3;stroke-linecap:round}
.anima .bn-svg .bn-spark{fill:none;stroke:var(--tm-vessel);stroke-width:2}
`;

export function bennett() {
  return {
    id: "bennett", lec: "instruments",
    title: "Where to take a lateral record",
    caption: "Move the orbiting condyle and compare a record taken at 3-5 mm with one at 7-10 mm: the Bennett angle each reads, and the central fossa a crown gets from it.",
    html: `<div class="anima" data-anima="bennett">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: bnLive.toString(),
    helpers: [bnPath, bnAngle, bnSvg],
    data: Object.assign({ TEXT }, D),
  };
}
