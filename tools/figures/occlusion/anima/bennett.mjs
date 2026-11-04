// Fig 14: where to take a lateral record (Occlusion L6, "How far to move to capture Bennett angle"). Dr. Givan's top-view
// stick drawing, animated: the straight protrusive line, and the orbiting condyle's path in a lateral move, which bows
// medially and then straightens. A record taken at 3-5 mm of condylar movement (B) measures a larger Bennett angle "b";
// at 7-10 mm (C), a smaller "c". On the right, the non-working lower molar from above (mesial up, buccal left): the
// opposing cusp leaves its central fossa toward distal and buccal, and the articulator builds that fossa and groove from
// the recorded angle. Built at c, the groove is narrower and turned distal, so the cusp's real early path (at b) runs up
// the cusp beside it: an interference. The path and angles are schematic (the notes give no numbers).
import { figureSvg, plateHtml } from "./shared.mjs";

const W = 520, H = 310;
const D = {
  W, H, A: [130, 262], K: 19, /* CR position on screen; px per mm of condylar movement */
  BEND: 1.45, /* medial bow of the orbiting path, mm per sqrt(mm), schematic */
  SB: 4, SC: 8.5, /* records at about 4 mm (3-5) and 8.5 mm (7-10) */
  M: [400, 150], /* the lower molar's center in the right panel */
  TH0: 10, HW: 6.5, /* degrees added to the angle for the groove on the molar (schematic), the built groove's half-width */
};

function bnPath(s, D) { return [D.A[0] + D.BEND * Math.sqrt(Math.max(0, s)) * D.K, D.A[1] - s * D.K]; }
function bnAngle(s, D) { var p = D.bnPath(s, D); return Math.atan2(p[0] - D.A[0], D.A[1] - p[1]); }

function bnSvg(st, D) {
  var f = function (n) { return Math.round(n * 10) / 10; }, o = "", A = D.A, u = st.u, r = Math.PI / 180;
  function tx(x, y, t, cls, a) { return '<text class="bn-t' + (cls ? " " + cls : "") + '" x="' + f(x) + '" y="' + f(y) + '"' + (a ? ' text-anchor="' + a + '"' : "") + ">" + t + "</text>"; }
  function P2(p) { return f(p[0]) + " " + f(p[1]); }
  function poly(pts) { return "M" + pts.map(P2).join("L") + "Z"; }
  function line(pts) { return "M" + pts.map(P2).join("L"); }
  function round(pts, it, open) {
    var a = pts;
    for (var k = 0; k < it; k++) {
      var out = [], nn = a.length;
      for (var i = 0; i < nn; i++) {
        var v = a[i], pv = a[(i - 1 + nn) % nn], nv = a[(i + 1) % nn];
        if (open && (i === 0 || i === nn - 1)) { out.push(v); continue; }
        out.push([v[0] + (pv[0] - v[0]) * 0.25, v[1] + (pv[1] - v[1]) * 0.25], [v[0] + (nv[0] - v[0]) * 0.25, v[1] + (nv[1] - v[1]) * 0.25]);
      }
      a = out;
    }
    return a;
  }
  var B = D.bnPath(D.SB, D), Cp = D.bnPath(D.SC, D), sRec = st.rec === "B" ? D.SB : D.SC, ang = D.bnAngle(sRec, D), angB = D.bnAngle(D.SB, D);
  /* ---- left: the orbiting condyle seen from above (anterior up, medial to the right) ---- */
  o += '<path class="bn-prot" d="M' + A[0] + " " + A[1] + "L" + A[0] + ' 30"/>' + tx(A[0] + 6, 22, "straight protrusion", "bn-cap", "start");
  var d = "", sMax = 11 * Math.max(0.02, u);
  for (var i = 0; i <= 40; i++) { var p = D.bnPath(sMax * i / 40, D); d += (i ? "L" : "M") + f(p[0]) + " " + f(p[1]); }
  o += '<path class="bn-orbit hot" data-info="The orbiting (non-working) condyle\'s path in a lateral move: anterior, inferior and medial. It bows medially at first, then straightens, so the angle to the straight protrusive path depends on how far you measure." d="' + d + '"/>';
  var cur = D.bnPath(sMax, D);
  o += '<circle class="bn-condyle" cx="' + f(cur[0]) + '" cy="' + f(cur[1]) + '" r="8"/>';
  if (u > 0.97) o += tx(cur[0] + 13, cur[1] + 4, "orbiting condyle", "bn-cap", "start");
  /* the two records: the chord from CR through each, a little past it, and the angle each makes with protrusion */
  function chord(P, on) { var k = 1 + 18 / Math.hypot(P[0] - A[0], P[1] - A[1]); return '<path class="bn-chord' + (on ? " is-on" : "") + '" d="M' + A[0] + " " + A[1] + "L" + f(A[0] + (P[0] - A[0]) * k) + " " + f(A[1] + (P[1] - A[1]) * k) + '"/>'; }
  if (u > 0.4) o += chord(B, st.rec === "B") + '<circle class="bn-pt" cx="' + f(B[0]) + '" cy="' + f(B[1]) + '" r="4"/>' + tx(B[0] + 10, B[1] + 4, "B: 3-5 mm", "bn-lab", "start");
  if (u > 0.85) {
    o += chord(Cp, st.rec === "C") + '<circle class="bn-pt" cx="' + f(Cp[0]) + '" cy="' + f(Cp[1]) + '" r="4"/>' + tx(Cp[0] + 10, Cp[1] + 4, "C: 7-10 mm", "bn-lab", "start");
    var aC = D.bnAngle(D.SC, D);
    var arcAt = function (rad, a, cls, lbl) { var x2 = A[0] + Math.sin(a) * rad, y2 = A[1] - Math.cos(a) * rad; return '<path class="' + cls + '" d="M' + A[0] + " " + (A[1] - rad) + "A" + rad + " " + rad + " 0 0 1 " + f(x2) + " " + f(y2) + '"/>' + tx(A[0] + Math.sin(a / 2) * (rad + 10), A[1] - Math.cos(a / 2) * (rad + 10) + 4, lbl, "bn-lab", "middle"); };
    o += arcAt(46, angB, "bn-arc" + (st.rec === "B" ? " is-on" : ""), "b") + arcAt(78, aC, "bn-arc" + (st.rec === "C" ? " is-on" : ""), "c");
  }
  o += '<circle class="bn-pt bn-a" cx="' + A[0] + '" cy="' + A[1] + '" r="5"/>' + tx(A[0] - 10, A[1] + 4, "A: CR", "bn-lab", "end");
  o += tx(A[0] + 90, A[1] + 4, "medial →", "bn-cap", "start") + tx(14, D.H - 8, "↑ anterior · seen from above", "bn-cap", "start");

  /* ---- right: the patient's lower left molar from above (mesial up, buccal left), the non-working side of a right
     lateral move. The upper molar's mesiolingual cusp sits in its central fossa and leaves it toward distal and buccal,
     out through the distobuccal groove; the articulator builds that groove at the angle the record read ---- */
  var M = D.M, F = [M[0], M[1] - 4], rel = function (q) { return [M[0] + q[0], M[1] + q[1]]; };
  var rim = round([[-50, -60], [-60, -32], [-60, 6], [-52, 42], [-34, 64], [-2, 68], [36, 62], [54, 28], [56, -22], [46, -60], [4, -68]].map(rel), 3);
  /* where a ray from the fossa leaves the crown */
  function exit(th) {
    var dv = [-Math.sin(th), Math.cos(th)], best = 1e9;
    for (var j = 0; j < rim.length; j++) {
      var a = rim[j], b = rim[(j + 1) % rim.length], ex = b[0] - a[0], ey = b[1] - a[1], den = dv[0] * ey - dv[1] * ex;
      if (Math.abs(den) < 1e-9) continue;
      var t = ((a[0] - F[0]) * ey - (a[1] - F[1]) * ex) / den, s2 = ((a[0] - F[0]) * dv[1] - (a[1] - F[1]) * dv[0]) / den;
      if (t > 0 && s2 >= 0 && s2 <= 1 && t < best) best = t;
    }
    return best;
  }
  function at(th, L) { return [F[0] - Math.sin(th) * L, F[1] + Math.cos(th) * L]; }
  o += '<g class="hot" data-info="The patient\'s left lower first molar from above, mesial up and the cheek side on the left. In a right lateral move this is the non-working side: the upper molar\'s mesiolingual cusp leaves the central fossa toward distal and buccal, out through the distobuccal groove. The Bennett angle set on the articulator decides how that fossa and groove are built.">';
  o += '<path class="bn-molar" d="' + poly(rim) + '"/>';
  [[-30, -36, 17], [-38, 2, 15], [-14, 50, 11], [28, -34, 17], [28, 22, 16]].forEach(function (c) { var q = rel(c); o += '<circle class="bn-cusp" cx="' + f(q[0]) + '" cy="' + f(q[1]) + '" r="' + c[2] + '"/>'; });
  /* the built fossa and distobuccal groove, at the recorded angle (drawn wider than the angle, schematic) */
  var thB = D.TH0 * r + ang, thR = D.TH0 * r + angB, hw = D.HW, Lb = exit(thB) - 1, nB = [Math.cos(thB), Math.sin(thB)];
  var gEnd = at(thB, Lb);
  o += '<g class="bn-built"><circle cx="' + f(F[0]) + '" cy="' + f(F[1]) + '" r="' + (hw + 3) + '"/><path d="' + poly([[F[0] + nB[0] * hw, F[1] + nB[1] * hw], [gEnd[0] + nB[0] * hw, gEnd[1] + nB[1] * hw], [gEnd[0] - nB[0] * hw, gEnd[1] - nB[1] * hw], [F[0] - nB[0] * hw, F[1] - nB[1] * hw]]) + '"/></g>';
  /* the grooves: central (mesial pit to distal pit), mesiobuccal, lingual and the built distobuccal one */
  var mp = rel([-1, -54]), dp = rel([6, 42]);
  o += '<path class="bn-groove" d="' + line(round([mp, rel([2, -34]), rel([-2, -16]), F, rel([4, 18]), dp], 2, true)) + '"/>';
  o += '<path class="bn-groove" d="' + line([rel([-2, -16]), rel([-26, -16]), at(101 * r, exit(101 * r))]) + '"/>';
  o += '<path class="bn-groove" d="' + line([F, at(-Math.PI / 2 + 0.04, exit(-Math.PI / 2 + 0.04))]) + '"/>';
  o += '<path class="bn-groove bn-groove-db" d="M' + P2(F) + "L" + P2(at(thB, Lb + 1)) + '"/>';
  o += '<circle class="bn-pit" cx="' + f(mp[0]) + '" cy="' + f(mp[1]) + '" r="2"/><circle class="bn-pit" cx="' + f(dp[0]) + '" cy="' + f(dp[1]) + '" r="2"/></g>';
  /* the cusp's real path while the teeth still touch: the early, larger angle (b) */
  var Lr = exit(thR) * Math.min(1, u / 0.4), pe = at(thR, Lr), inside = ang >= angB - 0.005;
  o += '<g class="hot" data-info="The opposing cusp\'s real path in the mouth during the first few millimeters, while the teeth still touch: it follows the early, larger angle (b). A groove built at b gives it room; one built at the smaller angle c is turned toward distal, and the path runs up the cusp beside it.">';
  if (Lr > 2) o += '<path class="bn-cusp-path" d="M' + P2(F) + "L" + P2(pe) + '"/>';
  if (!inside && u > 0.05) {
    var Lx = Math.min(Lr, hw / Math.sin(Math.max(0.01, angB - ang)));
    if (Lr > Lx + 1) { var hp = at(thR, Lx); o += '<path class="bn-hitseg" d="M' + P2(hp) + "L" + P2(pe) + '"/><circle class="bn-spark" cx="' + f(hp[0]) + '" cy="' + f(hp[1]) + '" r="5"/>'; }
  }
  o += '<circle class="bn-tip" cx="' + f(F[0]) + '" cy="' + f(F[1]) + '" r="4"/></g>';
  /* labels, key and the result */
  o += tx(M[0], 24, "lower left molar, from above", "bn-cap", "middle");
  o += tx(M[0] - 66, M[1] + 4, "buccal", "bn-cap", "end") + tx(M[0] + 64, M[1] + 4, "lingual", "bn-cap", "start");
  var kx = M[0] - 82, ky = M[1] + 92;
  o += '<circle class="bn-tip" cx="' + (kx + 11) + '" cy="' + (ky - 4) + '" r="4"/>' + tx(kx + 28, ky, "upper cusp tip", "bn-key", "start");
  o += '<path class="bn-cusp-path" d="M' + kx + " " + (ky + 12) + 'h22"/>' + tx(kx + 28, ky + 16, "its path in the mouth", "bn-key", "start");
  o += '<rect class="bn-built-key" x="' + kx + '" y="' + (ky + 24) + '" width="22" height="9" rx="3"/>' + tx(kx + 28, ky + 32, "groove built at " + (st.rec === "B" ? "b" : "c"), "bn-key bn-acc", "start");
  o += tx(M[0], D.H - 10, inside ? "built at b: it fits" : "built at c: it hits", "bn-res bn-" + (inside ? "ok" : "hit"), "middle");
  return o;
}

const svg = figureSvg({ width: W, height: H, className: "bn-svg", label: "Top view: the straight protrusive line and the orbiting condyle's curved path, with records at 3-5 mm and 7-10 mm, and the central fossa a crown gets from each.", body: bnSvg({ u: 1, rec: "B" }, Object.assign({ bnPath, bnAngle }, D)) });
const plate = plateHtml({ fig: "Fig 14", title: "Where to take a lateral record", hint: "move the condyle · pick a record", readout: "", body: `<div class="am-svg bn-box">${svg}</div>` });
const controls = `<div class="am-controls"><button type="button" class="am-btn" data-bnplay>Move the condyle</button><button type="button" class="am-btn" data-bnrec="B" aria-pressed="true">Record at 3-5 mm (B)</button><button type="button" class="am-btn" data-bnrec="C" aria-pressed="false">Record at 7-10 mm (C)</button></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Hover or tap the condyle's path, the molar or the cusp's path.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From the L6 notes (Dr. Givan's Occ Lec4 slide "How far to move to capture Bennett angle" and the 10/22 recording): A is CR, the vertical line straight protrusion, the dotted line the orbiting condyle's path; a record at B (3-5 mm) gives a larger angle b, at C (7-10 mm) a smaller angle c, which builds narrower fossae and more likely interferences. Make records at 3-5 mm.</li>
<li>Schematic: the path is a smooth curve of that shape, not a measured one, and its bow and both angles are drawn much larger than real Bennett angles so they show. The molar is the patient's left lower first molar, the non-working side when the left condyle orbits: the upper molar's mesiolingual cusp leaves its central fossa toward distal and buccal, through the distobuccal groove. That groove is drawn at the recorded angle plus a fixed amount, only to show that a smaller angle builds a narrower path, turned toward distal; on real teeth its direction also depends on the working condyle's rotation. Educational, not clinical guidance.</li></ul></details>`;
const TEXT = {
  B: "Record at 3-5 mm (B): the chord from CR to B leans well away from straight protrusion, so the Bennett angle read is larger (b). That is the path while the teeth still touch, so crowns built with it get fossae and grooves wide enough for the opposing cusp's path.",
  C: "Record at 7-10 mm (C): by then the path has straightened, so the chord from CR leans less and the angle read is smaller (c). The articulator builds narrower fossae, and in the mouth the cusp's real, early path runs up onto the cusp beside the groove: an interference. So take lateral records at 3-5 mm.",
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
.anima .bn-svg .bn-orbit{fill:none;stroke:var(--anatomy-hi);stroke-width:2;stroke-dasharray:2 4;stroke-linecap:round;vector-effect:none}
.anima .bn-svg .bn-condyle{fill:var(--tm-bone-in);stroke:var(--anatomy-hi);stroke-width:1.4}
.anima .bn-svg .bn-chord{stroke:var(--anatomy-mid);stroke-width:1.2}
.anima .bn-svg .bn-chord.is-on{stroke:var(--anatomy-lit);stroke-width:2.2}
.anima .bn-svg .bn-arc{fill:none;stroke:var(--anatomy-mid);stroke-width:1.2}
.anima .bn-svg .bn-arc.is-on{stroke:var(--anatomy-lit);stroke-width:2.2}
.anima .bn-svg .bn-pt{fill:var(--anatomy-hi)}
.anima .bn-svg .bn-a{fill:var(--anatomy-lit)}
.anima .bn-svg .bn-molar{fill:var(--anatomy-face);stroke:var(--anatomy-hi);stroke-width:1.4;stroke-linejoin:round}
.anima .bn-svg .bn-cusp{fill:var(--anatomy-shade-1);stroke:var(--anatomy-lo);stroke-width:1}
.anima .bn-svg .bn-groove{fill:none;stroke:var(--anatomy-mid);stroke-width:1.2;stroke-linecap:round;stroke-linejoin:round}
.anima .bn-svg .bn-groove-db{stroke:var(--anatomy-lit);stroke-width:1.4}
.anima .bn-svg .bn-pit{fill:var(--anatomy-mid)}
.anima .bn-svg .bn-built{fill:var(--anatomy-lit);opacity:.24}
.anima .bn-svg .bn-built-key{fill:var(--anatomy-lit);fill-opacity:.24;stroke:var(--anatomy-lit);stroke-width:1}
.anima .bn-svg .bn-tip{fill:var(--anatomy-hi)}
.anima .bn-svg .bn-key{font-size:11px}
.anima .bn-svg .bn-acc{fill:var(--anatomy-lit);font-weight:600}
.anima .bn-svg .bn-cusp-path{fill:none;stroke:var(--anatomy-hi);stroke-width:2;stroke-dasharray:5 3;vector-effect:none}
.anima .bn-svg .bn-hitseg{stroke:var(--tm-vessel);stroke-width:3;stroke-linecap:round}
.anima .bn-svg .bn-spark{fill:none;stroke:var(--tm-vessel);stroke-width:2}
@media (max-width:560px){.anima .bn-svg .bn-t{font-size:13.5px}.anima .bn-svg .bn-cap,.anima .bn-svg .bn-key{font-size:12.5px}.anima .bn-svg .bn-res{font-size:14px}}
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
