// Fig 28: unilateral vs jiggling force (Occlusion L10, "Unilateral and jiggling forces"; Dr. Abou-Arraj).
// The same premolar as Fig 27 (l10tooth.mjs), with normal support, pushed eight times. A unilateral force pushes from the
// buccal every time: pressure on one side of the ligament and tension on the other, the same sides each push, so the
// tooth tips (the crown leans about the center of rotation) or, bodily, moves root and crown together, and the socket
// follows it: what orthodontics does, controlled. A jiggling force pushes from the buccal, then the lingual: both sides
// are squeezed and stretched in turn, and the ligament widens on both sides into an hourglass (narrow at the center of
// rotation, wide at the crest and the apex), with bone loss on both sides and mobility; once it is wide enough the pushes
// stop widening it and the tooth just moves more. Play or step through the pushes; with reduced motion each step is a
// still picture (the push, then the release).
import { figureSvg, plateHtml } from "./shared.mjs";
import { TOOTH, SUPPORT, otSmooth, otPose, otRootBelow, otSocket, otText, otLab, otGumPose } from "./l10tooth.mjs";

const JW = 350, JH = 372;
const DATA = Object.assign({}, TOOTH, {
  JW, JH, N: 8,
  V: { OX: 175, OY: 128, S: 10.5 }, W: 0.45, SUP: SUPPORT.n,
  /* illustrative, many times what a real push does so it can be seen: the crown tips 0.7 degrees a push (tipping), the
     tooth moves 0.1 mm a push (bodily), and jiggling widens the ligament up to 0.6 mm more at the apex (in proportion to
     the distance from the center of rotation), reached after 6 pushes, then no more */
  STEP: 0.7, MOVE: 0.1, GMAX: 0.6, GK: 6,
  HOT: {
    bone: "The alveolar bone.",
    bonej: "The alveolar bone. Pushed both ways, it is lost on both sides of the socket, which widens; the crest keeps its height (the animal studies: trauma alone took bone density, not crestal bone height).",
    pdl: "The periodontal ligament (PDL), between the root and the bone (drawn wider than its real 0.25 mm so it can be seen).",
    pdlj: "The widened PDL: narrowest at the center of rotation and widest at the crest and the apex, an hourglass shape around the tooth.",
    press: "Pressure: the side where the ligament is squeezed between the root and the bone.",
    tens: "Tension: the side where the ligament is stretched.",
    tooth: "The tooth: a premolar cut cheek to tongue, buccal on the left.",
    crot: "The center of rotation, generally in the mid-root with normal support. The tooth tips about it, so the root moves most at the crest and the apex.",
    was: "Where the socket wall was before the pushes: the socket has moved with the tooth.",
    start: "Where the tooth started.",
    range: "How far the tooth now moves each way when pushed: its mobility.",
    gum: "The gingiva.",
  },
});

/* the extra width an hourglass has reached after k pushes, and how far (degrees) a push can then tip the tooth before the
   root meets the socket wall at the crest or the apex (three quarters of the way: the ligament is squeezed, not gone) */
function otjG(k, D) { return D.GMAX * Math.min(1, k / D.GK); }
function otjAmp(G, D) { var c = D.SUP.c[1], dc = D.SUP.crest - c, da = c + 14.5; return 0.75 * Math.min((D.W + G * dc / da) / dc, (D.W + G) / da) * 180 / Math.PI; }
function otjEase(x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
/* where everything is. st = { m: "tip" | "body" | "jig", k: pushes done, ph: 0 at rest, else how far through push k + 1
   (to 0.5 the push, then the release: a one-way push leaves the tooth where it went and the socket catches up; a jiggling
   push lets it swing back, and the ligament widens) */
function otjState(st, D) {
  var k = st.k, ph = st.ph, q1 = D.otjEase(Math.min(1, ph / 0.5)), q2 = ph > 0.5 ? D.otjEase((ph - 0.5) / 0.5) : 0;
  var s = st.m === "jig" && k % 2 ? -1 : 1, c = D.SUP.c;
  var r = { s: s, amt: ph > 0 ? (ph <= 0.5 ? q1 : 1 - q2) : 0, tooth: { a: 0, c: c, t: 0 }, sock: { a: 0, c: c, t: 0 }, G: 0, amp: 0 };
  if (st.m === "tip") { r.tooth.a = (k + q1) * D.STEP; r.sock.a = (k + q2) * D.STEP; }
  else if (st.m === "body") { r.tooth.t = (k + q1) * D.MOVE; r.sock.t = (k + q2) * D.MOVE; }
  else { var G0 = D.otjG(k, D), G1 = D.otjG(k + 1, D); r.G = G0 + (G1 - G0) * q2; r.amp = D.otjAmp(r.G, D); r.tooth.a = s * D.otjAmp(G0, D) * (ph <= 0.5 ? q1 : 1 - q2); }
  return r;
}
function otjScene(st, D) {
  var f = function (n) { return Math.round(n * 10) / 10; }, V = D.V, S = D.SUP, o = "", R = D.otjState(st, D), cy = S.c[1], jig = st.m === "jig";
  function P(p) { return [V.OX + p[0] * V.S, V.OY - p[1] * V.S]; }
  function SM(pts, closed, map) { return D.otSmooth(pts.map(map || P), closed); }
  function lab(lines, x, y, q, a, cls) { return D.otLab(lines, x, y, q, a, cls, D); }
  var mir = function (pts) { return pts.map(function (p) { return [-p[0], p[1]]; }); };
  var root0 = D.otRootBelow(S.crest, D);
  function socketAt(pose, G) { return D.otSocket(root0.map(function (p) { return D.otPose(p, pose); }), function (y) { return D.W + G * Math.abs(y - cy) / (cy + 14.5); }); }
  var sock = socketAt(R.sock, R.G), moved = !jig && (st.k > 0 || st.ph > 0.5);
  /* the outer bone near the crest moves sideways with the socket, fading out by 7.5 mm down (a one-way push moves the
     alveolar process too) */
  var lean = Math.sin(R.sock.a * Math.PI / 180);
  function outer(pts) { return pts.map(function (p) { var w = Math.max(0, Math.min(1, (p[1] + 7.5) / 2.5)); return [p[0] + ((p[1] - cy) * lean + R.sock.t) * w, p[1]]; }); }
  var rimL = sock[0], rimB = sock[sock.length - 1];
  var bone = outer(S.BONE).concat([[rimB[0] - 0.05, rimB[1]]], [[rimL[0] + 0.05, rimL[1]]], outer(mir(S.BONE)).reverse());
  o += '<path class="ot-bone hot" data-info="' + (jig ? D.HOT.bonej : D.HOT.bone) + '" d="' + SM(bone, false) + 'Z"/>';
  var was = moved ? socketAt({ a: 0, c: S.c, t: 0 }, 0) : null;
  if (was) o += '<path class="ot-newbone" d="' + SM(was, false) + 'Z"/>';
  o += '<path class="ot-pdl hot" data-info="' + (jig && st.k > 1 ? D.HOT.pdlj : D.HOT.pdl) + '" d="' + SM(sock, false) + 'Z"/>';
  if (was) o += '<path class="ot-was hot" data-info="' + D.HOT.was + '" d="' + SM(was, false) + '"/>';
  /* pressure and tension: a push from the buccal (s = 1) moves the crown to the lingual, so above the center of rotation
     the lingual is squeezed and the buccal stretched, and below it the reverse; a bodily push squeezes the whole lingual */
  function seg(side, above) { return sock.filter(function (p) { return (p[0] > 0) === (side > 0) && (above === null || (above ? p[1] >= cy - 0.3 : p[1] <= cy + 0.3)) && Math.abs(p[0]) > 0.9; }); }
  if (R.amt > 0.03) {
    var bands = st.m === "body" ? [[1, null, 1], [-1, null, -1]] : [[1, true, R.s], [-1, true, -R.s], [-1, false, R.s], [1, false, -R.s]];
    bands.forEach(function (b) { var pts = seg(b[0], b[1]), pr = b[2] > 0; if (pts.length < 2) return;
      o += '<path class="ot-band ' + (pr ? "ot-press" : "ot-tens") + ' hot" data-info="' + (pr ? D.HOT.press : D.HOT.tens) + '" style="stroke-opacity:' + f(R.amt * 100) / 100 + '" d="' + SM(pts, false) + '"/>'; });
  }
  [S.GUM, mir(S.GUM)].forEach(function (g) { o += '<path class="ot-gum hot" data-info="' + D.HOT.gum + '" d="' + SM(D.otGumPose(g, R.tooth, function (p) { return outer([p])[0]; }, D), false) + 'Z"/>'; });
  var tooth = D.CROWN.slice(0, -1).concat(D.ROOT.slice(0, -1)), dent = D.DEJ.slice(0, -1).concat(D.ROOT.slice(0, -1));
  function Q(pose) { return function (p) { return P(D.otPose(p, pose)); }; }
  /* where it started (one way), or how far it now moves each way (jiggling) */
  if (moved) o += '<path class="ot-ghost hot" data-info="' + D.HOT.start + '" d="' + SM(D.CROWN, false, Q({ a: 0, c: S.c })) + '"/>';
  if (jig) [-1, 1].forEach(function (sg) { o += '<path class="ot-ghost hot" data-info="' + D.HOT.range + '" d="' + SM(D.CROWN, false, Q({ a: sg * R.amp, c: S.c })) + '"/>'; });
  var TQ = Q(R.tooth);
  o += '<g class="hot" data-info="' + D.HOT.tooth + '"><path class="ot-enamel" d="' + SM(tooth, true, TQ) + '"/><path class="ot-dentin" d="' + SM(dent, true, TQ) + '"/><path class="ot-pulp" d="' + SM(D.PULP, true, TQ) + '"/><path class="ot-out" d="' + SM(tooth, true, TQ) + '"/></g>';
  if (st.m !== "body") { var c = P(S.c);
    o += '<g class="hot" data-info="' + D.HOT.crot + '"><circle class="ot-crot" cx="' + f(c[0]) + '" cy="' + f(c[1]) + '" r="5"/><path class="ot-crot-x" d="M' + f(c[0] - 8) + " " + f(c[1]) + "H" + f(c[0] + 8) + "M" + f(c[0]) + " " + f(c[1] - 8) + "V" + f(c[1] + 8) + '"/></g>'; }
  /* the force on the crown: this push's, or (at rest) the next one's, faint */
  var s = R.s, hp = TQ([s * -3.88, 4.0]), op = R.amt > 0.03 ? 0.35 + 0.65 * R.amt : 0.35, tail = hp[0] - s * 60, tip = hp[0] - s * 2;
  if (st.k < D.N || st.ph > 0) {
    o += '<path class="ot-force" style="stroke-opacity:' + f(op * 100) / 100 + '" d="M' + f(tail) + " " + f(hp[1]) + "L" + f(tip - s * 2) + " " + f(hp[1]) + "M" + f(tip - s * 11) + " " + f(hp[1] - 6) + "L" + f(tip) + " " + f(hp[1]) + "L" + f(tip - s * 11) + " " + f(hp[1] + 6) + '"/>';
    o += D.otText(tail, hp[1] - 12, ["force"], "ot-strong", s > 0 ? "start" : "end");
  }
  /* labels */
  var ym = V.OY - (S.crest + cy) / 2 * V.S;
  function at(side, y) { var best = sock[0], d = 1e9; sock.forEach(function (p) { if ((p[0] > 0) === (side > 0) && Math.abs(p[1] - y) < d) { d = Math.abs(p[1] - y); best = p; } }); return best; }
  if (R.amt > 0.18) {
    var lb = st.m === "body" ? -1 : -R.s, rb = -lb, pB = at(-1, (S.crest + cy) / 2), pL = at(1, (S.crest + cy) / 2);
    o += lab([lb > 0 ? "pressure" : "tension"], 8, ym + 4, P([pB[0] - 0.2, pB[1]]), "start", lb > 0 ? "ot-plab" : "ot-tlab");
    o += lab([rb > 0 ? "pressure" : "tension"], D.JW - 8, ym + 4, P([pL[0] + 0.2, pL[1]]), "end", rb > 0 ? "ot-plab" : "ot-tlab");
  } else if (moved) {
    o += lab(["where it started"], 8, 20, P([-3.6, 4.8]), "start");
  } else if (jig && st.k > 1) {
    var w12 = at(-1, -12.2), r12 = D.otRootBelow(S.crest, D).filter(function (p) { return p[0] < 0; }).reduce(function (a, p) { return Math.abs(p[1] + 12.2) < Math.abs(a[1] + 12.2) ? p : a; });
    o += lab(["widened PDL:", "an hourglass"], 8, V.OY + 9.6 * V.S, P([(w12[0] + r12[0]) / 2, (w12[1] + r12[1]) / 2]), "start");
    var bl = at(1, S.crest - 0.9);
    o += lab(["bone loss,", "both sides"], D.JW - 8, V.OY + 4.6 * V.S, P([bl[0] + 0.25, bl[1]]), "end");
  }
  if (jig && R.amt <= 0.18) {
    var tA = Q({ a: -R.amp, c: S.c })([-0.5, 8.1]), tB = Q({ a: R.amp, c: S.c })([-0.5, 8.1]), yy = Math.min(tA[1], tB[1]) - 9;
    o += '<path class="ot-range" d="M' + f(tA[0]) + " " + f(yy) + "H" + f(tB[0]) + "M" + f(tA[0] + 5) + " " + f(yy - 4) + "L" + f(tA[0]) + " " + f(yy) + "L" + f(tA[0] + 5) + " " + f(yy + 4) + "M" + f(tB[0] - 5) + " " + f(yy - 4) + "L" + f(tB[0]) + " " + f(yy) + "L" + f(tB[0] - 5) + " " + f(yy + 4) + '"/>';
    o += D.otText(tB[0] + 10, yy + 4, ["mobility"], "ot-strong", "start");
  }
  o += D.otText(10, D.JH - 8, ["buccal"], "ot-cap", "start") + D.otText(D.JW - 10, D.JH - 8, ["lingual"], "ot-cap", "end");
  return o;
}
function otjText(st, D) {
  var s = "";
  if (st.m === "tip") s = "A unilateral force acts in one direction: pressure on one side of the ligament and tension on the other, the same sides every push. Pushed again and again, the tooth tips: the crown leans to the lingual about the center of rotation, and the socket follows it. Orthodontics uses tipping (mesially or distally, to position a tooth in the arch) as a controlled, unilateral movement, not jiggling.";
  else if (st.m === "body") s = "Bodily movement: the whole tooth, root and crown, moves in one direction, with pressure along the whole lingual side and tension along the whole buccal side, and the socket follows it. Orthodontics uses it too, as a controlled, unilateral movement.";
  else if (st.k < D.GK) s = "A jiggling force comes from one side and then from the other: here once from the buccal and once from the lingual (or once from the mesial and once from the distal). Each side is squeezed on one push and stretched on the next, so there is pressure and tension on both sides, and the ligament space widens on both.";
  else s = "The net result is an hourglass shape around the tooth: a widened PDL, narrowest at the center of rotation and widest at the crest and the apex, bone loss on both sides, and mobility. Once the space is wide enough the pushes stop widening it and the tooth just moves more: mobility as a sign of adaptation. The slides call jiggling often the clinical situation in humans.";
  if (st.k === 0 && st.ph === 0) s = "Press Next push, or Play, to push the tooth " + D.N + " times. " + s;
  return s;
}
function otjRead(st, D) { return st.m === "tip" ? "one way: it tips" : st.m === "body" ? "one way: bodily" : st.k < D.GK ? "jiggling: both sides" : "jiggling: an hourglass"; }

const ST0 = { m: "tip", k: 0, ph: 0 };
const ctx = Object.assign({ otSmooth, otPose, otRootBelow, otSocket, otText, otLab, otGumPose, otjG, otjAmp, otjEase, otjState }, DATA);
const svg = figureSvg({ width: JW, height: JH, className: "ot-svg otj-svg", label: "A premolar in buccolingual section in its bone, pushed on the crown again and again: from one side only (a unilateral force: the tooth tips or moves bodily and the socket follows), or from one side and then the other (a jiggling force: the ligament widens on both sides into an hourglass, and the tooth becomes mobile).", body: otjScene(ST0, ctx) });
const plate = plateHtml({ fig: "Fig 28", title: "Unilateral or jiggling force", hint: "push it", readout: otjRead(ST0, ctx), body: `<div class="am-svg otj-box">${svg}</div>` });
const controls = `<div class="am-controls" role="group" aria-label="Force"><span class="ot-lbl">Force</span><button type="button" class="am-btn" data-otjm="tip" aria-pressed="true">One way: tipping</button><button type="button" class="am-btn" data-otjm="body" aria-pressed="false">One way: bodily</button><button type="button" class="am-btn" data-otjm="jig" aria-pressed="false">Jiggling</button></div>
<div class="am-controls" role="group" aria-label="Pushes"><button type="button" class="am-btn" data-otjs="play">Play</button><button type="button" class="am-btn" data-otjs="next">Next push</button><button type="button" class="am-btn" data-otjs="reset">Start over</button><span class="ot-count">push 0 of 8</span></div>
<p class="am-summary" aria-live="polite">${otjText(ST0, ctx)}</p>
<p class="am-info">Hover or tap the ligament, the bone, the tooth or the dashed outlines.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From the L10 notes (Dr. Abou-Arraj): a unilateral force acts in one direction, pressure on one side and tension on the other; orthodontics uses it, tipping (the crown leans) or bodily movement (the whole tooth, root and crown, moves in one direction), as controlled movement, not jiggling. A jiggling force comes from one side and then from the other (once from the mesial and once from the distal, or once from the facial and once from the lingual): pressure and tension on both sides, and the net result is an hourglass shape around the tooth, a widened PDL, bone loss on both sides and mobility, "often the clinical situation in humans." Mobility is a sign of adaptation. In the animal studies, trauma alone took bone density, not crestal bone height, and caused no attachment loss, so the crest and the gingiva stay where they are here.</li>
<li>Outside sources, for how it works: Lindhe, Lang and Karring, Clinical Periodontology and Implant Dentistry (the chapter on trauma from occlusion): orthodontic-type forces cause resorption on the pressure side and new bone on the tension side, so the tooth moves and the ligament keeps its width; jiggling forces widen the ligament on both sides, in an hourglass around a tipping tooth, until it is wide enough that the forces no longer injure it, leaving a tooth with increased but stable mobility (Svanberg and Lindhe's beagle studies). Bodily movement needs an appliance that controls the root as well as the crown; one arrow on the crown stands for it here.</li>
<li>Schematic: the movements, the ligament (its real width about 0.25 mm) and its widening are drawn many times larger than they are, and the number of pushes is illustrative: real remodeling takes days to weeks.</li></ul></details>`;

function otjLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var svg = root.querySelector(".otj-svg"), sum = root.querySelector(".am-summary"), info = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]"), count = root.querySelector(".ot-count");
  var modes = root.querySelectorAll("[data-otjm]"), playB = root.querySelector('[data-otjs="play"]'), T = 1400;
  var st = { m: "tip", k: 0, ph: 0 }, raf = 0, timer = 0, playing = false;
  function draw() {
    svg.innerHTML = D.otjScene(st, D);
    count.textContent = "push " + Math.min(D.N, st.k + (st.ph > 0 ? 1 : 0)) + " of " + D.N;
    var t = D.otjText(st, D); if (sum.textContent !== t) sum.textContent = t;
    if (readout) { var r = D.otjRead(st, D); if (readout.textContent !== r) readout.textContent = r; }
  }
  function stop() { playing = false; cancelAnimationFrame(raf); clearTimeout(timer); playB.textContent = "Play"; }
  /* run push k + 1 (from wherever it was paused) to its end */
  function push(done) {
    if (st.k >= D.N) { if (done) done(); return; }
    var t0 = performance.now() - st.ph * T;
    function step(now) { var x = Math.min(1, (now - t0) / T); st.ph = x; if (x >= 1) { st.k++; st.ph = 0; } draw(); if (x < 1) raf = requestAnimationFrame(step); else if (done) done(); }
    cancelAnimationFrame(raf); raf = requestAnimationFrame(step);
  }
  /* reduced motion: still pictures, the push (its peak), then the release */
  function stepStill() { if (st.ph === 0) { if (st.k < D.N) st.ph = 0.5; } else { st.k++; st.ph = 0; } draw(); }
  function play() {
    if (reduce.matches) { stop(); st.k = D.N; st.ph = 0; draw(); return; }
    if (st.k >= D.N) { st.k = 0; st.ph = 0; }
    playing = true; playB.textContent = "Pause";
    (function next() { if (!playing) return; push(function () { if (playing && st.k < D.N) timer = setTimeout(next, 260); else stop(); }); })();
  }
  playB.addEventListener("click", function () { if (playing) stop(); else play(); });
  root.querySelector('[data-otjs="next"]').addEventListener("click", function () { stop(); if (reduce.matches) stepStill(); else push(); });
  root.querySelector('[data-otjs="reset"]').addEventListener("click", function () { stop(); st.k = 0; st.ph = 0; draw(); });
  modes.forEach(function (b) { b.addEventListener("click", function () {
    stop(); st.m = b.getAttribute("data-otjm"); st.k = 0; st.ph = 0;
    modes.forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); draw(); }); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && root.contains(el) && el.getAttribute("data-info")) info.textContent = el.getAttribute("data-info"); }
  svg.addEventListener("pointerover", hot); svg.addEventListener("click", hot);
  if (reduce.matches) playB.textContent = "Show the end";
  draw();
}

const CSS = `
.anima .otj-box{max-width:420px;margin:0 auto}
.anima .ot-svg .ot-range{fill:none;stroke:var(--anatomy-strong);stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
`;

export function otjiggle() {
  return {
    id: "otjiggle", lec: "occtrauma",
    title: "Unilateral vs jiggling force",
    caption: "Push the tooth one way again and again and it tips or moves; push it one way, then the other, and the ligament widens on both sides into an hourglass, with bone loss and mobility.",
    html: `<div class="anima" data-anima="otjiggle">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: otjLive.toString(),
    helpers: [otSmooth, otPose, otRootBelow, otSocket, otText, otLab, otGumPose, otjG, otjAmp, otjEase, otjState, otjScene, otjText, otjRead],
    data: DATA,
  };
}
