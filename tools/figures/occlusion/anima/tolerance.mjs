// Fig: the tolerance model (Occlusion L7, "How a functional disturbance develops"). Normal function + Event >
// Physiologic tolerance => Symptoms. Left, the model as a stack (a labeled metaphor: blocks are not measured amounts):
// normal function at the base, the events the reader adds on top (local: a high crown, a burned palate, bruxism,
// constant deep pain; systemic: emotional stress, the flu), and the tolerance as a line the reader can raise or lower.
// Right, the masticatory system (the side-view rig of l7rig.mjs, with the masseter, the temporalis, the ear canal and
// the cranium outlined): below the line the patient adapts with no symptoms; above it the slides' signs light where
// they show (a. pulpitis, b. tooth wear or fracture, c. mobility, d. masticatory muscle pain, e. TMJ pain, f. ear pain,
// g. headache). "Monday, then Tuesday" replays the story the notes tell: the same events, a tolerance that changed.
import { figureSvg, plateHtml } from "./shared.mjs";
import { rig, RIG_HELPERS, RIG_CSS } from "./l7rig.mjs";

const MW = 280, HW = 320, H = 330;
const D = Object.assign(rig(), {
  V: { OX: 256, OY: 186, S: 1.9 },
  BASE: 304, COL: [30, 172], FN: 80, EV: 26, TMIN: 110, TMAX: 230,
  EVENTS: [
    { k: "crown", t: "high crown", g: "local", info: "A local event: a high crown or filling, any change in a sensory or proprioceptive input." },
    { k: "pizza", t: "burned palate", g: "local", info: "A local event: tissue trauma, such as pizza that was too hot." },
    { k: "brux", t: "bruxism", g: "local", info: "A local event: bruxism (repeated microtrauma); strain and blunt trauma are local events too." },
    { k: "pain", t: "deep pain", g: "local", info: "A local event: constant (deep) pain input." },
    { k: "stress", t: "emotional stress", s: "stress", g: "systemic", info: "A systemic event: emotions and stress." },
    { k: "flu", t: "the flu", s: "the flu", g: "systemic", info: "A systemic event: feeling bad all over with the flu." },
  ],
  /* the signs: where each shows (skull mm), its label (skull mm, centered) and its hover text */
  SIGNS: [
    { l: "a", t: ["a. pulpitis"], p: [-66, -37.5], at: [-68, -25], info: "a. Pulpitis." },
    { l: "b", t: ["b. wear,", "fracture"], p: [-103.4, -42.2], at: [-121, -42], info: "b. Tooth wear or fracture." },
    { l: "c", t: ["c. mobility"], p: [-74, -46.5], at: [-76, -59], info: "c. Tooth mobility." },
    { l: "d", t: ["d. muscle", "pain"], p: [-15, -26], at: [-15, -36], info: "d. Masticatory muscle pain (the masseter is drawn)." },
    { l: "e", t: ["e. TMJ pain"], p: [0, 0], at: [-6, 18], info: "e. TMJ pain." },
    { l: "f", t: ["f. ear pain"], p: [18, 2], at: [14, -16], info: "f. Ear pain." },
    { l: "g", t: ["g. headache"], p: [-22, 42], at: [-22, 33], info: "g. Headache (over the temporalis)." },
  ],
  /* the cranium (simplified), the orbit, the two big elevators and the ear canal, in skull mm (the frame crops them) */
  CRAN: [[-106.4, -12.4], [-104.6, -4], [-101, 6], [-98.4, 16], [-97, 23], [-99.6, 30], [-101, 40], [-99, 58], [-92, 76], [-80, 92], [-60, 106], [-30, 116], [4, 114], [34, 100], [54, 76], [62, 46], [58, 20], [46, 2], [32, -12], [24, -18], [19, -11], [15, -4], [10.8, -1.6]],
  ORBIT: [[-95, 20], [-92, 33], [-83, 40], [-71, 38], [-64, 28], [-64, 14], [-70, 6], [-82, 4.6], [-92, 9]],
  TEMP: { arc: [[-60, 26], [-58, 46], [-46, 62], [-24, 70], [2, 68], [22, 56], [32, 38], [30, 22]], ins: [[-27, -6], [-16, 1]], low: [[30, 22], [16, 12], [0, 8], [-12, 2], [-16, 1]], front: [[-27, -6], [-40, 4], [-56, 16], [-60, 26]] },
  MASS: { top: [[-37, -12], [-30, -5.6], [-20, -4], [-10, -4.6]], bot: [[-29, -58], [-18, -61.6], [-6, -60], [3, -55]], back: [[-10, -4.6], [-4, -14], [1, -30], [4.6, -46], [3, -55]], front: [[-29, -58], [-34, -42], [-37, -26], [-37, -12]] },
  EAR: [18, 2], BOX: [-137, -80, 36, 100],
});

/* is the stack above the line? */
function toOver(st, D) { return D.FN + st.h.reduce(function (a, b) { return a + b; }, 0) > st.tol + 0.5; }
function toTx(x, y, t, cls, a) { var f = function (n) { return Math.round(n * 10) / 10; }; return '<text class="to-t' + (cls ? " " + cls : "") + '" x="' + f(x) + '" y="' + f(y) + '"' + (a ? ' text-anchor="' + a + '"' : "") + ">" + t + "</text>"; }
/* the model: normal function and the events stacked against the tolerance line */
function toModel(st, D) {
  var f = function (n) { return Math.round(n * 10) / 10; }, tx = toTx, o = "";
  var over = toOver(st, D), x0 = D.COL[0], x1 = D.COL[1], y = D.BASE;
  o += tx(12, 22, "normal function + event", "to-head", "start");
  o += tx(12, 40, (over ? "&gt;" : "&lt;") + " physiologic tolerance", "to-head " + (over ? "to-bad" : "to-ok"), "start");
  o += tx(12, 58, over ? "⇒ symptoms: structures break down" : "⇒ no symptoms: the patient adapts", "to-head " + (over ? "to-bad" : "to-ok"), "start");
  o += '<path class="to-floor" d="M' + (x0 - 14) + " " + y + "H" + (x1 + 14) + '"/>';
  o += '<rect class="to-fn hot" data-info="Normal function: chewing, swallowing and speaking, regulated by the brainstem (the central pattern generator and its engrams), influenced by peripheral sensory and nociceptive input and by CNS effects such as the limbic system." x="' + x0 + '" y="' + f(y - D.FN) + '" width="' + (x1 - x0) + '" height="' + D.FN + '" rx="4"/>';
  o += tx((x0 + x1) / 2, y - D.FN / 2 - 2, "normal function", "to-in", "middle") + tx((x0 + x1) / 2, y - D.FN / 2 + 12, "chew, swallow, speak", "to-in to-small", "middle");
  y -= D.FN;
  D.EVENTS.forEach(function (e, i) {
    var h = st.h[i]; if (h < 0.5) return;
    o += '<rect class="to-ev to-' + e.g + ' hot" data-info="' + e.info + '" x="' + x0 + '" y="' + f(y - h) + '" width="' + (x1 - x0) + '" height="' + f(h) + '" rx="4"/>';
    if (h > 14) o += tx((x0 + x1) / 2, y - h / 2 + 4, e.s || e.t, "to-in", "middle");
    y -= h;
  });
  o += '<rect class="to-ev to-local" x="' + x0 + '" y="' + (D.BASE + 9) + '" width="10" height="10" rx="2"/>' + tx(x0 + 15, D.BASE + 18, "local event", "to-small", "start");
  o += '<rect class="to-ev to-systemic" x="' + (x0 + 92) + '" y="' + (D.BASE + 9) + '" width="10" height="10" rx="2"/>' + tx(x0 + 107, D.BASE + 18, "systemic", "to-small", "start");
  var ty = D.BASE - st.tol;
  if (over) o += '<rect class="to-over" x="' + x0 + '" y="' + f(y) + '" width="' + (x1 - x0) + '" height="' + f(ty - y) + '" rx="4"/>';
  o += '<g class="hot" data-info="Physiologic tolerance: the ability to tolerate events. Local factors: the occlusion defines a position of the mandible, which affects the joints, muscles, ligaments and orthopedic posture; an unstable orthopedic relationship of the mandible to the maxilla and cranial base. Systemic: genetics, gender, diet, acute or chronic disease."><path class="to-tol" d="M' + (x0 - 14) + " " + f(ty) + "H" + (x1 + 14) + '"/><circle class="to-knob" cx="' + (x1 + 14) + '" cy="' + f(ty) + '" r="4.5"/></g>';
  o += tx(x1 + 22, ty + 4, "tolerance", "to-lab", "start");
  return o;
}
/* the masticatory system, with the signs lit when the stack is above the line */
function toHead(over, D) {
  var f = function (n) { return Math.round(n * 10) / 10; }, V = D.V, tx = toTx, o = "";
  function X(p) { return V.OX + p[0] * V.S; } function Y(p) { return V.OY - p[1] * V.S; }
  function sm(pts, closed) { return D.rgD(closed ? D.rgSamp(pts, 5) : pts, V, closed); }
  function lerp(A, t) { var n = A.length - 1, i = Math.min(n - 1, Math.floor(t * n)), u = t * n - i; return [A[i][0] + (A[i + 1][0] - A[i][0]) * u, A[i][1] + (A[i + 1][1] - A[i][1]) * u]; }
  function fibers(A, B, n, cls) { var s = ""; for (var i = 1; i < n; i++) { var t = i / n, p = lerp(A, t), q = lerp(B, t); s += "M" + f(X(p)) + " " + f(Y(p)) + "L" + f(X(q)) + " " + f(Y(q)); } return '<path class="' + cls + '" d="' + s + '"/>'; }
  o += '<path class="to-cran hot" data-info="The cranium, simplified and cropped by the frame." d="' + D.rgD(D.rgClip(D.rgSamp(D.CRAN.concat([[0, 5], [-40, 0], [-90, -8]]), 4), D.BOX), V, true) + '"/>';
  o += '<path class="to-orbit" d="' + sm(D.ORBIT, true) + '"/>';
  var T = D.TEMP, M = D.MASS, tOut = T.arc.concat(T.low.slice(1), [T.ins[0]], T.front.slice(1, -1)), mOut = M.top.concat(M.back.slice(1), M.bot.slice(0, -1).reverse(), M.front.slice(1, -1));
  var temp = '<g class="hot" data-info="Temporalis: an elevator, fanning from the side of the skull and passing under the zygomatic arch to the coronoid process."><path class="to-musc" d="' + sm(tOut, true) + '"/>' + fibers(T.arc, [T.ins[0], [-24, -4], [-21, -2], [-18, 0], T.ins[1]], 14, "to-fib") + "</g>";
  o += D.rgScene({ C: [0, 0], Cm: [0, 0], th: 0 }, V, D, { mid: temp });
  o += '<g class="hot" data-info="Masseter: an elevator, from the zygomatic arch down and back to the angle of the mandible."><path class="to-musc to-mass" d="' + sm(mOut, true) + '"/>' + fibers(M.top, M.bot, 9, "to-fib") + "</g>";
  o += '<ellipse class="to-ear hot" data-info="The external ear canal, just behind the joint." cx="' + f(X(D.EAR)) + '" cy="' + f(Y(D.EAR)) + '" rx="' + f(2.8 * V.S) + '" ry="' + f(3.8 * V.S) + '"/>';
  D.SIGNS.forEach(function (s) {
    var p = [X(s.p), Y(s.p)], q = [X(s.at), Y(s.at)], g = '<g class="hot" data-info="' + (over ? "Above the tolerance: " : "Shows here once the tolerance is exceeded: ") + s.info + '">';
    if (over) g += '<circle class="to-ring" cx="' + f(p[0]) + '" cy="' + f(p[1]) + '" r="7"/>';
    g += '<circle class="' + (over ? "to-site-on" : "to-site") + '" cx="' + f(p[0]) + '" cy="' + f(p[1]) + '" r="2.6"/>';
    s.t.forEach(function (t, k) { g += tx(q[0], q[1] + 4 + (k - (s.t.length - 1) / 2) * 12, t, over ? "to-sign on" : "to-sign", "middle"); });
    o += g + "</g>";
  });
  return o;
}

const SUM = {
  under: "Normal function plus the event stays below the physiologic tolerance: the patient adapts and has no symptoms. Most of the time we tolerate things fairly well.",
  over: "Normal function plus the event exceeds the physiologic tolerance: symptoms begin, and structures break down. The signs on the slides: a. pulpitis, b. tooth wear or fracture, c. tooth mobility, d. masticatory muscle pain, e. TMJ pain, f. ear pain, g. headache.",
  monday: "Monday: the same habits and stresses as always, and the patient adapts.",
  tuesday: "Tuesday: nothing new happened, but the tolerance dropped, and the same events now exceed it: intense pain. Each element of the model can change, and you rarely know which. An old problem that wasn't one can become one: the straw that broke the camel's back.",
};

const DN = Object.assign({}, D, Object.fromEntries(RIG_HELPERS.concat([toOver, toTx]).map((fn) => [fn.name, fn])));
const st0 = { h: [26, 0, 0, 0, 0, 0], tol: 150 };
const svgModel = figureSvg({ width: MW, height: H, className: "to-svg to-model", label: "Normal function and the events stacked against a physiologic tolerance line.", body: toModel(st0, DN) });
const svgHead = figureSvg({ width: HW, height: H, className: "to-svg to-anat", label: "The jaws, joint, masseter and temporalis from the side, with the slides' signs and symptoms marked where they show.", body: toHead(false, DN) });
const plate = plateHtml({ fig: "Fig", title: "The tolerance model", hint: "add events · move the tolerance", readout: "", body: `<div class="am-svg to-box">${svgModel}${svgHead}</div>` });
const controls = `<div class="am-controls" role="group" aria-label="Events">${D.EVENTS.map((e, i) => `<button type="button" class="am-btn" data-toev="${i}" aria-pressed="${i === 0}">${e.t[0].toUpperCase() + e.t.slice(1)}${e.g === "systemic" ? " (systemic)" : ""}</button>`).join("")}</div>
<div class="am-controls"><label class="am-slider"><span>low tolerance</span><input type="range" min="0" max="100" step="1" value="33" aria-label="Physiologic tolerance"><span>high tolerance</span></label></div>
<div class="am-controls"><button type="button" class="am-btn" data-toweek aria-pressed="false">Monday, then Tuesday</button></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Hover or tap a block, the tolerance line or a structure.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From the L7 notes (Dr. Givan's Occ Lec6 slides and the 10/29 recording): Normal Function + Event &gt; Physiologic Tolerance ⇒ Symptoms; what regulates normal function; local and systemic events; local and systemic factors in tolerance; below the tolerance the patient adapts; each element can change, and an event tolerated one day may not be another; when the tolerances are exceeded, structures break down, with the signs a-g.</li>
<li>A metaphor, not a measurement: the stack shows the model's inequality, and the blocks' heights are equal by choice. Nobody has "a sticker on their forehead" saying how much they'll tolerate. The anatomy is the same schematic side view as the other L7 figures. Educational, not clinical guidance.</li></ul></details>`;

function toLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var model = root.querySelector(".to-model"), head = root.querySelector(".to-anat"), lastOver = false, slider = root.querySelector('input[type="range"]'), sum = root.querySelector(".am-summary"), info = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]"), bWeek = root.querySelector("[data-toweek]");
  var on = D.EVENTS.map(function (e, i) { return i === 0; }), want = { tol: 0 }, st = { h: D.EVENTS.map(function (e, i) { return on[i] ? D.EV : 0; }), tol: 0 }, raf = 0, week = 0, timer = 0;
  function tolOf(v) { return D.TMIN + (D.TMAX - D.TMIN) * v / 100; }
  want.tol = st.tol = tolOf(+slider.value);
  function over() { var t = D.FN; on.forEach(function (x) { if (x) t += D.EV; }); return t > want.tol + 0.5; }
  function text() {
    var o = over();
    sum.textContent = week === 1 ? D.SUM.monday : week === 2 ? D.SUM.tuesday : o ? D.SUM.over : D.SUM.under;
    if (readout) readout.textContent = (week === 1 ? "Monday: " : week === 2 ? "Tuesday: " : "") + (o ? "exceeds tolerance" : "below tolerance");
  }
  function draw() { model.innerHTML = D.toModel(st, D); var ov = D.toOver(st, D); if (ov !== lastOver) { lastOver = ov; head.innerHTML = D.toHead(ov, D); } }
  function tick() {
    cancelAnimationFrame(raf);
    if (reduce.matches) { st.h = on.map(function (x) { return x ? D.EV : 0; }); st.tol = want.tol; draw(); return; }
    var last = performance.now();
    function step(now) {
      var k = 1 - Math.exp(-(now - last) / 90), done = true; last = now;
      st.h = st.h.map(function (h, i) { var t = on[i] ? D.EV : 0, n = h + (t - h) * k; if (Math.abs(t - n) > 0.3) done = false; else n = t; return n; });
      st.tol += (want.tol - st.tol) * k; if (Math.abs(want.tol - st.tol) > 0.3) done = false; else st.tol = want.tol;
      draw(); if (!done) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
  }
  function stopWeek() { clearTimeout(timer); if (week) { week = 0; bWeek.setAttribute("aria-pressed", "false"); } }
  var btns = root.querySelectorAll("[data-toev]");
  btns.forEach(function (b) { b.addEventListener("click", function () { stopWeek(); var i = +b.getAttribute("data-toev"); on[i] = !on[i]; b.setAttribute("aria-pressed", String(on[i])); text(); tick(); }); });
  slider.addEventListener("input", function () { stopWeek(); want.tol = tolOf(+slider.value); text(); tick(); });
  bWeek.addEventListener("click", function () {
    clearTimeout(timer);
    /* Monday: bruxism and some stress, a comfortable tolerance; Tuesday: the same, a lower tolerance */
    on = D.EVENTS.map(function (e) { return e.k === "brux" || e.k === "stress"; });
    btns.forEach(function (b) { b.setAttribute("aria-pressed", String(on[+b.getAttribute("data-toev")])); });
    week = 1; bWeek.setAttribute("aria-pressed", "true"); slider.value = 70; want.tol = tolOf(70); text(); tick();
    timer = setTimeout(function () { week = 2; slider.value = 8; want.tol = tolOf(8); text(); tick(); }, reduce.matches ? 1500 : 2200);
  });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && root.contains(el)) info.textContent = el.getAttribute("data-info"); }
  [model, head].forEach(function (svg) { svg.addEventListener("pointerover", hot); svg.addEventListener("click", hot); });
  text(); draw();
}

const CSS = RIG_CSS("to") + `
.anima .to-box{max-width:640px;margin:0 auto;display:flex;flex-wrap:wrap;justify-content:center;align-items:flex-end}
.anima .am-svg.to-box svg.to-model{flex:280 1 250px;width:auto;max-width:330px}
.anima .am-svg.to-box svg.to-anat{flex:320 1 290px;width:auto;max-width:400px}
.anima .to-svg .to-t{fill:var(--anatomy-text);font:11.5px var(--anatomy-mono);paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round}
.anima .to-svg .to-head{fill:var(--anatomy-strong);font-weight:700;stroke:none}
.anima .to-svg .to-ok{fill:#2f8a5b}
.anima .to-svg .to-bad{fill:var(--tm-vessel)}
.anima .to-svg .to-in{fill:var(--anatomy-strong);stroke:none;font-size:11px}
.anima .to-svg .to-small{fill:var(--anatomy-text);font-size:10px}
.anima .to-svg .to-lab{fill:var(--anatomy-strong);font-size:10.5px;stroke:none}
.anima .to-svg .to-floor{stroke:var(--anatomy-mid);stroke-width:1.4}
.anima .to-svg .to-fn{fill:var(--anatomy-shade-1);stroke:var(--anatomy-mid);stroke-width:1}
.anima .to-svg .to-ev{stroke:var(--anatomy-mid);stroke-width:1}
.anima .to-svg .to-local{fill:var(--tm-retro)}
.anima .to-svg .to-systemic{fill:var(--tm-disc)}
.anima .to-svg .to-over{fill:var(--tm-vessel);fill-opacity:.3;stroke:var(--tm-vessel);stroke-width:1.4}
.anima .to-svg .to-tol{stroke:var(--anatomy-strong);stroke-width:2.2;stroke-linecap:round}
.anima .to-svg .to-knob{fill:var(--surface);stroke:var(--anatomy-strong);stroke-width:2}
.anima .to-svg .to-cran{fill:var(--tm-bone);stroke:var(--anatomy-lo);stroke-width:1;stroke-linejoin:round}
.anima .to-svg .to-orbit{fill:var(--anatomy-shade-2);stroke:var(--anatomy-lo);stroke-width:1}
.anima .to-svg .to-musc{fill:var(--tm-muscle);fill-opacity:.32;stroke:var(--tm-muscle-fib);stroke-width:1;stroke-linejoin:round}
.anima .to-svg .to-mass{fill-opacity:.4}
.anima .to-svg .to-fib{fill:none;stroke:var(--tm-muscle-fib);stroke-width:.6;stroke-opacity:.7}
.anima .to-svg .to-ear{fill:var(--tm-air);stroke:var(--anatomy-lo);stroke-width:1}
.anima .to-svg .to-site{fill:var(--anatomy-mid)}
.anima .to-svg .to-site-on{fill:var(--tm-vessel)}
.anima .to-svg .to-ring{fill:none;stroke:var(--tm-vessel);stroke-width:2;transform-box:fill-box;transform-origin:center;animation:to-pulse 1.6s ease-out infinite}
@keyframes to-pulse{0%{opacity:.95;transform:scale(.6)}100%{opacity:0;transform:scale(1.7)}}
@media (prefers-reduced-motion: reduce){.anima .to-svg .to-ring{animation:none;opacity:.9}}
.anima .to-svg .to-sign{fill:var(--anatomy-muted);font-size:10.5px;stroke-width:3px}
.anima .to-svg .to-sign.on{fill:var(--tm-vessel);font-weight:700}
`;

export function tolerance() {
  return {
    id: "tolerance", lec: "malocclusion",
    title: "The tolerance model",
    caption: "Stack events on normal function and move the physiologic tolerance: below the line the patient adapts; above it the signs and symptoms show. Then replay Monday and Tuesday.",
    html: `<div class="anima" data-anima="tolerance">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: toLive.toString(),
    helpers: RIG_HELPERS.concat([toOver, toTx, toModel, toHead]),
    data: Object.assign({ SUM }, D),
  };
}
