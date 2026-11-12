// Fig 27: primary vs secondary occlusal trauma (Occlusion L10, "Primary vs secondary occlusal trauma"; Dr. Abou-Arraj).
// A mandibular second premolar in buccolingual section (buccal on the left) in its bone, with normal support (the crest
// 1.8 mm below the CEJ) or reduced support (bone and attachment lost: the crest about 8.5 mm down, a third of the tooth's
// length still in bone). A normal or a traumatic load on the buccal cusp's incline tips the crown to the lingual about the
// tooth's center of rotation: mid-root with normal support, in the apical third with reduced support, so the same load
// tips the reduced tooth further. The ligament is squeezed (pressure) on one side and stretched (tension) on the other,
// opposite above and below the center of rotation. Beside it, his analogy: a fence post two thirds in the ground vs a third.
import { figureSvg, plateHtml } from "./shared.mjs";
import { TOOTH, SUPPORT, OT_CSS, otSmooth, otPose, otRootBelow, otSocket, otText, otLab } from "./l10tooth.mjs";

const TW = 350, TH = 374, SW = 170, SH = 300;
const D0 = Object.assign({}, TOOTH, {
  V: { OX: 192, OY: 132, S: 10.5 }, W: 0.45,
  SUP: SUPPORT,

  /* how far each case tips the crown (degrees): illustrative, larger than real so it can be seen; the reduced tooth
     tips further under the same load (a longer arm, less bone to resist it) */
  TILT: { nn: 1.2, nt: 4.0, rn: 4.5, rt: 8.5 },
  /* the load meets the buccal cusp's outer incline, square to it (as in Fig 24) */
  INC: [-1.8, 7.4], ANG: 38.4,
});
const HOT = {
  bone: "The alveolar bone. With normal support it reaches to about 2 mm below the CEJ; with reduced support, bone and attachment have been lost, so less of the root is held.",
  pdl: "The periodontal ligament (PDL), between the root and the bone (drawn wider than its real width so it can be seen).",
  tooth: "The tooth. An occlusal force is the initiating factor; the injury it causes in the periodontium is occlusal trauma.",
  crot: "The center of rotation: the tooth tips about this point. With normal support it is generally in the mid-root; with reduced support it moves apically, toward the apical third.",
  press: "Pressure: the side where the ligament is squeezed between the root and the bone.",
  tens: "Tension: the side where the ligament is stretched.",
  gum: "The gingiva.",
  post: "His analogy: a fence post. Two thirds in the ground, lean on it and it probably won't move; with only a third, or 20%, in the ground, the same lean (same force, same mass) may tip it.",
};

function otsKey(st) { return st.sup + (st.load === "t" ? "t" : "n"); }
function otsTooth(st, D) {
  var f = function (n) { return Math.round(n * 10) / 10; }, V = D.V, S = D.SUP[st.sup], o = "";
  var pose = { a: st.tilt, c: S.c };
  function P(p) { return [V.OX + p[0] * V.S, V.OY - p[1] * V.S]; }
  function Q(p) { return P(D.otPose(p, pose)); }
  function SM(pts, closed, map) { return D.otSmooth(pts.map(map || P), closed); }
  function tx(x, y, t, cls, a) { return D.otText(x, y, [t], cls, a); }
  function lab(lines, x, y, q, a, cls) { return D.otLab(lines, x, y, q, a, cls, D); }
  var mir = function (pts) { return pts.map(function (p) { return [-p[0], p[1]]; }); };
  /* the socket: the root's surface below the crest, at rest, pushed out by the ligament's width */
  var root = D.otRootBelow(S.crest, D), sock = D.otSocket(root, function () { return D.W; });
  var rimL = sock[0], rimB = sock[sock.length - 1];
  var bone = S.BONE.concat([[rimB[0] - 0.05, rimB[1]]], [[rimL[0] + 0.05, rimL[1]]], mir(S.BONE).reverse());
  o += '<path class="ot-bone hot" data-info="' + D.HOT.bone + '" d="' + SM(bone, false) + 'Z"/>';
  o += '<path class="ot-pdl hot" data-info="' + D.HOT.pdl + '" d="' + SM(sock, false) + 'Z"/>';
  /* pressure and tension along the socket wall: above the center of rotation the crown side moves lingual (pressure
     lingual, tension buccal), below it the root moves buccal (the reverse) */
  var amt = Math.min(1, st.tilt / D.TILT.rt * 1.6), cy = S.c[1];
  function seg(side, above) { return sock.filter(function (p) { return (p[0] > 0) === (side > 0) && (above ? p[1] >= cy - 0.3 : p[1] <= cy + 0.3) && Math.abs(p[0]) > 0.9; }); }
  if (amt > 0.03) {
    [[1, true, "ot-press"], [-1, true, "ot-tens"], [-1, false, "ot-press"], [1, false, "ot-tens"]].forEach(function (b) {
      var pts = seg(b[0], b[1]); if (pts.length < 2) return;
      o += '<path class="ot-band ' + b[2] + ' hot" data-info="' + (b[2] === "ot-press" ? D.HOT.press : D.HOT.tens) + '" style="stroke-opacity:' + f(amt * 100) / 100 + '" d="' + SM(pts, false) + '"/>';
    });
  }
  D.GUM_ALL(S).forEach(function (g) { o += '<path class="ot-gum hot" data-info="' + D.HOT.gum + '" d="' + SM(g, false) + 'Z"/>'; });
  /* the tooth, tipped about the center of rotation */
  var tooth = D.CROWN.slice(0, -1).concat(D.ROOT.slice(0, -1)), dent = D.DEJ.slice(0, -1).concat(D.ROOT.slice(0, -1));
  o += '<g class="hot" data-info="' + D.HOT.tooth + '"><path class="ot-enamel" d="' + SM(tooth, true, Q) + '"/><path class="ot-dentin" d="' + SM(dent, true, Q) + '"/><path class="ot-pulp" d="' + SM(D.PULP, true, Q) + '"/><path class="ot-out" d="' + SM(tooth, true, Q) + '"/></g>';
  /* the center of rotation */
  var c = P(S.c);
  o += '<g class="hot" data-info="' + D.HOT.crot + '"><circle class="ot-crot" cx="' + f(c[0]) + '" cy="' + f(c[1]) + '" r="5"/><path class="ot-crot-x" d="M' + f(c[0] - 8) + " " + f(c[1]) + "H" + f(c[0] + 8) + "M" + f(c[0]) + " " + f(c[1] - 8) + "V" + f(c[1] + 8) + '"/></g>';
  /* the load, square to the incline */
  var big = st.load === "t", a = D.ANG * Math.PI / 180, dir = [Math.sin(a), -Math.cos(a)], p1 = Q(D.INC), L = big ? 62 : 36;
  var p0 = [p1[0] - dir[0] * L, p1[1] + dir[1] * L], ux = dir[0], uy = -dir[1], hw = big ? 7 : 5;
  o += '<path class="ot-force' + (big ? " ot-big" : "") + '" d="M' + f(p0[0]) + " " + f(p0[1]) + "L" + f(p1[0] - ux * 3) + " " + f(p1[1] - uy * 3) +
    "M" + f(p1[0] - ux * 11 - uy * hw) + " " + f(p1[1] - uy * 11 + ux * hw) + "L" + f(p1[0] - ux * 1.5) + " " + f(p1[1] - uy * 1.5) + "L" + f(p1[0] - ux * 11 + uy * hw) + " " + f(p1[1] - uy * 11 - ux * hw) + '"/>';
  o += tx(8, 18, big ? "traumatic force" : "normal force", "ot-strong", "start") + tx(8, 32, big ? "(excessive)" : "on the cusp incline", "ot-cap", "start");
  /* labels: the left column (buccal) top to bottom, the right column (lingual) */
  var ym = V.OY - (S.crest + cy) / 2 * V.S, show = amt > 0.18;
  if (show) o += lab(["tension"], 8, ym + 4, D.otSocketMid(sock, -1, cy, 1, P), "start", "ot-tlab");
  o += lab(["center of", "rotation:", st.sup === "n" ? "mid-root" : "apical third"], 8, V.OY - cy * V.S + 10, [c[0] - 6, c[1]], "start", "ot-strong");
  if (st.sup === "r") o += lab(["bone and", "attachment lost"], 8, V.OY + 2.2 * V.S, Q([-3.1, -3.6]), "start");
  else o += lab(["normal bone", "and attachment"], 8, V.OY - cy * V.S + 66, P([-6.05, -11.6]), "start");
  if (show) {
    o += lab(["pressure"], D.TW - 6, ym - 10, D.otSocketMid(sock, 1, cy, 1, P), "end", "ot-plab");
    o += lab(["tension"], D.TW - 6, V.OY - (cy - 3.2) * V.S, D.otSocketMid(sock, 1, cy, -1, P), "end", "ot-tlab");
  }
  o += tx(10, D.TH - 8, "buccal", "ot-cap", "start") + tx(D.TW - 10, D.TH - 8, "lingual", "ot-cap", "end");
  return o;
}
/* both gingiva flaps for a support level (the lingual one mirrored) */
function GUM_ALL(S) { return [S.GUM, S.GUM.map(function (p) { return [-p[0], p[1]]; })]; }
/* a point on the socket wall, on one side, halfway between the crest and the center of rotation (above) or below it */
function otSocketMid(sock, side, cy, where, P) {
  var pts = sock.filter(function (p) { return (p[0] > 0) === (side > 0) && (where < 0 ? p[1] < cy - 0.6 : p[1] > cy + 0.6) && Math.abs(p[0]) > 0.9; });
  var p = pts[Math.floor(pts.length / 2)] || sock[0]; return P([p[0] + side * 0.2, p[1]]);
}
function otsPost(st, D) {
  var f = function (n) { return Math.round(n * 10) / 10; }, o = "", G = 150, X0 = 92, LEN = 150, buried = st.sup === "n" ? 100 : 40, piv = [X0, G + buried * 0.62], a = st.tilt * Math.PI / 180;
  function tx(x, y, t, cls, an) { return D.otText(x, y, [t], cls, an); }
  function R(p) { var dx = p[0] - piv[0], dy = p[1] - piv[1]; return [piv[0] + dx * Math.cos(a) - dy * Math.sin(a), piv[1] + dx * Math.sin(a) + dy * Math.cos(a)]; }
  var top = G - (LEN - buried), bot = G + buried, w = 7;
  var corners = [[X0 - w, top], [X0 + w, top], [X0 + w, bot], [X0 - w, bot]].map(R);
  o += D.otText(X0, 14, ["his analogy:"], "ot-cap", "middle") + tx(X0, 28, "a fence post", "ot-strong", "middle");
  o += '<rect class="ot-soil hot" data-info="' + D.HOT.post + '" x="0" y="' + G + '" width="' + D.SW + '" height="' + (D.SH - G) + '"/>';
  o += '<path class="ot-soil-top" d="M0 ' + G + "H" + D.SW + '"/>';
  o += '<path class="ot-post hot" data-info="' + D.HOT.post + '" d="M' + corners.map(function (p) { return f(p[0]) + " " + f(p[1]); }).join("L") + 'Z"/>';
  /* the lean, at the top, the same way the load tips the crown */
  var tp = R([X0 - w, top + 12]);
  o += '<path class="ot-force' + (st.load === "t" ? " ot-big" : "") + '" d="M' + f(tp[0] - 44) + " " + f(tp[1]) + "L" + f(tp[0] - 3) + " " + f(tp[1]) + "M" + f(tp[0] - 12) + " " + f(tp[1] - 6) + "L" + f(tp[0] - 1.5) + " " + f(tp[1]) + "L" + f(tp[0] - 12) + " " + f(tp[1] + 6) + '"/>';
  o += tx(tp[0] - 47, tp[1] + 4, "lean", "ot-strong", "end");
  o += tx(X0, D.SH - 12, st.sup === "n" ? "two thirds in the ground" : "a third in the ground", "ot-cap ot-on", "middle");
  return o;
}

const ST0 = { sup: "n", load: "t", tilt: 4.0 };
const DATA = Object.assign({ TW, TH, SW, SH, HOT }, D0);
const ctx = Object.assign({ otSmooth, otPose, otRootBelow, otSocket, otText, otLab, otSocketMid, GUM_ALL, otsKey }, DATA);
const svgTooth = figureSvg({ width: TW, height: TH, className: "ot-svg ots-tooth", label: "A mandibular premolar in buccolingual section in its bone. A load on the buccal cusp's incline tips the crown to the lingual about the tooth's center of rotation; the ligament is under pressure on one side and tension on the other.", body: otsTooth(ST0, ctx) });
const svgPost = figureSvg({ width: SW, height: SH, className: "ot-svg ots-postbox", label: "His analogy: a fence post leaned on at the top, buried two thirds deep or only a third.", body: otsPost(ST0, ctx) });
const plate = plateHtml({ fig: "Fig 27", title: "Primary or secondary occlusal trauma", hint: "change the support and the force", readout: "primary occlusal trauma", body: `<div class="am-svg ots-box">${svgTooth}${svgPost}</div>` });
const controls = `<div class="am-controls" role="group" aria-label="Support"><span class="ot-lbl">Support</span><button type="button" class="am-btn" data-otsup="n" aria-pressed="true">Normal</button><button type="button" class="am-btn" data-otsup="r" aria-pressed="false">Reduced</button></div>
<div class="am-controls" role="group" aria-label="Force"><span class="ot-lbl">Force</span><button type="button" class="am-btn" data-otload="n" aria-pressed="false">Normal</button><button type="button" class="am-btn" data-otload="t" aria-pressed="true">Traumatic</button></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Hover or tap the tooth, the bone, the center of rotation or the fence post.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From the L10 notes (Dr. Abou-Arraj): primary occlusal trauma is traumatic (excessive) occlusal force on a tooth with normal support (normal bone and attachment levels); secondary is normal or traumatic force on a tooth with reduced support (bone and attachment loss). With normal support the center of rotation is generally in the mid-root; with reduced support it sits closer to the apical third, which is why a normal force can injure a tooth with reduced support: his fence post, two thirds in the ground vs a third or 20%. The distinction is clinical: histologically the changes are the same. A unilateral force puts pressure on one side and tension on the other.</li>
<li>Outside sources: tooth size from Wheeler's Dental Anatomy (mandibular second premolar: crown 8 mm, root 14.5 mm), the crest about 1.8 mm below the CEJ in health. Finite element and laser holography studies place a single-rooted tooth's center of resistance about a third to two fifths of the way from the crest to the apex, and show it moving apically, with the tooth tipping further under the same load, as bone is lost (Tanne et al., Am J Orthod Dentofacial Orthop 1991;100:66-71; Geramy, Am J Orthod Dentofacial Orthop 2000;117:399-405). A crown-tipping force turns the tooth about a point a little apical to that.</li>
<li>Schematic: the tipping is drawn many times larger than a real tooth moves (tenths of a millimeter), and the ligament wider than its real 0.25 mm, so both can be seen; how far each case tips is illustrative, not computed. The fence post leans the same angle as the tooth.</li></ul></details>`;

function otsLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var tooth = root.querySelector(".ots-tooth"), post = root.querySelector(".ots-postbox"), sum = root.querySelector(".am-summary"), info = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]");
  var sups = root.querySelectorAll("[data-otsup]"), loads = root.querySelectorAll("[data-otload]");
  var st = { sup: "n", load: "t", tilt: D.TILT.nt }, raf = 0;
  function draw() { tooth.innerHTML = D.otsTooth(st, D); post.innerHTML = D.otsPost(st, D); }
  function kind() { return st.sup === "r" ? "secondary occlusal trauma" : st.load === "t" ? "primary occlusal trauma" : "no occlusal trauma"; }
  function text() {
    var s;
    if (st.sup === "n" && st.load === "n") s = "A normal force on a tooth with normal support: the tooth barely tips about its center of rotation, in the mid-root, and the periodontium withstands and distributes the load. No occlusal trauma.";
    else if (st.sup === "n") s = "Primary occlusal trauma: a traumatic (excessive) force on a tooth with normal support, no bone or attachment lost. The crown tips about the center of rotation in the mid-root; the ligament is under pressure on one side and tension on the other, and the injury shows in the periodontium.";
    else if (st.load === "n") s = "Secondary occlusal trauma: even a normal force injures a tooth that has lost bone and attachment. The center of rotation has moved apically, toward the apical third, so the same load tips the tooth further: the fence post with only a third in the ground.";
    else s = "Secondary occlusal trauma, with a traumatic force: reduced support and an excessive load tip the tooth the most. Secondary means reduced support, whether the force is normal or traumatic.";
    if (st.sup === "r" || st.load === "t") s += " Primary or secondary is a clinical distinction: histologically the changes are the same.";
    sum.textContent = s;
    if (readout) readout.textContent = kind();
  }
  function press() { sups.forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-otsup") === st.sup)); }); loads.forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-otload") === st.load)); }); }
  function go() {
    press(); text(); cancelAnimationFrame(raf);
    var to = D.TILT[D.otsKey(st)], from = st.tilt;
    if (reduce.matches || Math.abs(to - from) < 0.01) { st.tilt = to; draw(); return; }
    var t0 = performance.now();
    function step(now) { var k = Math.min(1, (now - t0) / 520), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; st.tilt = from + (to - from) * e; draw(); if (k < 1) raf = requestAnimationFrame(step); }
    raf = requestAnimationFrame(step);
  }
  sups.forEach(function (b) { b.addEventListener("click", function () { if (st.sup === b.getAttribute("data-otsup")) return; st.sup = b.getAttribute("data-otsup"); st.tilt = 0; go(); }); });
  loads.forEach(function (b) { b.addEventListener("click", function () { st.load = b.getAttribute("data-otload"); go(); }); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && root.contains(el) && el.getAttribute("data-info")) info.textContent = el.getAttribute("data-info"); }
  [tooth, post].forEach(function (s) { s.addEventListener("pointerover", hot); s.addEventListener("click", hot); });
  draw(); text();
}

const CSS = OT_CSS + `
.anima .ots-box{max-width:560px;margin:0 auto;display:flex;flex-wrap:wrap;justify-content:center;align-items:flex-end;gap:4px 12px}
.anima .am-svg.ots-box svg.ots-tooth{flex:350 1 300px;width:auto;max-width:420px}
.anima .am-svg.ots-box svg.ots-postbox{flex:170 1 140px;width:auto;max-width:200px}
.anima .ot-svg .ot-soil{fill:var(--tm-trab);stroke:none}
.anima .ot-svg .ot-soil-top{fill:none;stroke:var(--anatomy-mid);stroke-width:1.2}
.anima .ot-svg .ot-post{fill:var(--tm-lig);stroke:var(--anatomy-hi);stroke-width:1.1;stroke-linejoin:round}
`;

export function otsupport() {
  return {
    id: "otsupport", lec: "occtrauma",
    title: "Primary vs secondary occlusal trauma",
    caption: "Set the support and the force: the same load tips a tooth with reduced support further, because its center of rotation sits lower, like a fence post with less of it in the ground.",
    html: `<div class="anima" data-anima="otsupport">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: otsLive.toString(),
    helpers: [otSmooth, otPose, otRootBelow, otSocket, otText, otLab, otSocketMid, GUM_ALL, otsKey, otsTooth, otsPost],
    data: DATA,
  };
}
