// Fig 15: the tolerance model (Occlusion L7, "How a functional disturbance develops"). Normal function + Event >
// Physiologic tolerance => Symptoms. Left, the model as a stack (a labeled metaphor: blocks are not measured amounts):
// normal function at the base, the events the reader adds on top (local: a high crown, a burned palate, bruxism,
// constant deep pain; systemic: emotional stress, the flu), and the tolerance as a line the reader can raise or lower.
// Right, the masticatory system (the whole skull and mandible of l7rig.mjs, with the temporalis and the masseter
// added): below the line the patient adapts with no symptoms; above it the slides' signs light where
// they show, each label off the drawing or on plain bone with a leader to its dot (a. pulpitis, b. tooth wear or fracture, c. mobility, d. masticatory muscle pain, e. TMJ pain, f. ear pain,
// g. headache). "Monday, then Tuesday" replays the story the notes tell: the same events, a tolerance that changed.
import { figureSvg, plateHtml } from "./shared.mjs";
import { rig, RIG_HELPERS, RIG_CSS } from "./l7rig.mjs";

const MW = 280, HW = 338, H = 330;
const D = Object.assign(rig(), {
  V: { OX: 210, OY: 180, S: 1.4 },
  BASE: 304, COL: [30, 172], FN: 80, EV: 26, TMIN: 110, TMAX: 230,
  EVENTS: [
    { k: "crown", t: "high crown", g: "local", info: "A local event: a high crown or filling, any change in a sensory or proprioceptive input." },
    { k: "pizza", t: "burned palate", g: "local", info: "A local event: tissue trauma, such as pizza that was too hot." },
    { k: "brux", t: "bruxism", g: "local", info: "A local event: bruxism (repeated microtrauma); strain and blunt trauma are local events too." },
    { k: "pain", t: "deep pain", g: "local", info: "A local event: constant (deep) pain input." },
    { k: "stress", t: "emotional stress", s: "stress", g: "systemic", info: "A systemic event: emotions and stress." },
    { k: "flu", t: "the flu", s: "the flu", g: "systemic", info: "A systemic event: feeling bad all over with the flu." },
  ],
  /* the signs: p, where each shows (skull mm); at, its label (screen px) with anchor a; info, its hover text. The
     labels sit off the drawing or on plain bone, each with a leader to its dot */
  SIGNS: [
    { t: ["a. pulpitis"], p: [-71.8, -38.4], at: [74, 199], a: "end", info: "a. Pulpitis, or hypersensitive teeth (here the upper canine)." },
    { t: ["b. wear,", "fracture"], p: [-89.3, -42.9], at: [74, 234], a: "end", info: "b. Tooth wear or fracture (here at the upper central incisor's edge)." },
    { t: ["c. mobility"], p: [-66.6, -46.8], at: [117, 314], a: "middle", info: "c. Tooth mobility (here a lower premolar)." },
    { t: ["d. muscle pain"], p: [-18, -34], at: [230, 256], a: "start", info: "d. Masticatory muscle pain (the masseter and the temporalis are drawn)." },
    { t: ["e. TMJ pain"], p: [0, 0], at: [238, 226], a: "start", info: "e. TMJ pain." },
    { t: ["f. ear", "pain"], p: [13.6, 2], at: [238, 175], a: "start", info: "f. Ear pain (the ear canal sits just behind the joint)." },
    { t: ["g. headache"], p: [0, 70], at: [210, 42], a: "middle", info: "g. Headache (over the temporalis, on the side of the head)." },
  ],
  /* the temporalis: from the temporal line (the rig's TEMPLINE) down under the zygomatic arch to the coronoid process;
     its front edge runs down the back of the zygoma's frontal process. The masseter: from the zygoma and the arch's lower
     border down and back to the angle and the lower ramus. Skull mm, the jaw seated (MIP) */
  TEMP: { front: [[-52.2, 29.3], [-49, 23.8], [-48.4, 16], [-46.3, 10.4], [-42, 6], [-38, 3]], ins: [[-38, 3], [-24, 3]] },
  MASS: {
    top: [[-43.6, -5.2], [-41.4, -2.8], [-37.6, -1], [-32, 0], [-26.5, 0.8], [-21.6, 1.4], [-18.6, -1], [-15.4, -2.8]],
    back: [[-15.4, -2.8], [-11.4, -10], [-7.4, -22], [-3.9, -36], [-2, -46], [-3.2, -54], [-6.4, -59.8]],
    bot: [[-33, -67], [-27, -65.8], [-21, -64.6], [-16, -64.2], [-11, -62.8], [-6.4, -59.8]],
    front: [[-33, -67], [-33.4, -58], [-33.6, -48], [-33.9, -38], [-35.4, -28], [-38.6, -16], [-41.8, -8.4], [-43.6, -5.2]],
  },
});

/* is the stack above the line? */
function toOver(st, D) { return D.FN + st.h.reduce(function (a, b) { return a + b; }, 0) > st.tol + 0.5; }
function toTx(x, y, t, cls, a) { var f = function (n) { return Math.round(n * 10) / 10; }; return '<text class="to-t' + (cls ? " " + cls : "") + '" x="' + f(x) + '" y="' + f(y) + '"' + (a ? ' text-anchor="' + a + '"' : "") + ">" + t + "</text>"; }
/* the model: normal function and the events stacked against the tolerance line */
function toModel(st, D) {
  var f = function (n) { return Math.round(n * 10) / 10; }, tx = toTx, o = "";
  var over = toOver(st, D), x0 = D.COL[0], x1 = D.COL[1], y = D.BASE, ty = D.BASE - st.tol;
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
    /* the block's name, moved off the tolerance line when the line crosses it */
    var cy = y - h / 2, up = ty - (y - h), dn = y - ty;
    if (up > 0 && dn > 0 && Math.abs(ty - cy) < 8 && Math.max(up, dn) >= 12) cy = up >= dn ? y - h + up / 2 : ty + dn / 2;
    if (h > 14) o += tx((x0 + x1) / 2, cy + 4, e.s || e.t, "to-in", "middle");
    y -= h;
  });
  o += '<rect class="to-ev to-local" x="' + x0 + '" y="' + (D.BASE + 9) + '" width="10" height="10" rx="2"/>' + tx(x0 + 15, D.BASE + 18, "local event", "to-small", "start");
  o += '<rect class="to-ev to-systemic" x="' + (x0 + 92) + '" y="' + (D.BASE + 9) + '" width="10" height="10" rx="2"/>' + tx(x0 + 107, D.BASE + 18, "systemic", "to-small", "start");
  if (over) o += '<rect class="to-over" x="' + x0 + '" y="' + f(y) + '" width="' + (x1 - x0) + '" height="' + f(ty - y) + '" rx="4"/>';
  o += '<g class="hot" data-info="Physiologic tolerance: the ability to tolerate events. Local factors: the occlusion defines a position of the mandible, which affects the joints, muscles, ligaments and orthopedic posture; an unstable orthopedic relationship of the mandible to the maxilla and cranial base. Systemic: genetics, gender, diet, acute or chronic disease."><path class="to-tol" d="M' + (x0 - 14) + " " + f(ty) + "H" + (x1 + 14) + '"/><circle class="to-knob" cx="' + (x1 + 14) + '" cy="' + f(ty) + '" r="4.5"/></g>';
  o += tx(x1 + 22, ty + 4, "tolerance", "to-lab", "start");
  return o;
}
/* the masticatory system: the whole skull and mandible from the side, the temporalis and the masseter, with the signs
   lit when the stack is above the line */
function toHead(over, D) {
  var f = function (n) { return Math.round(n * 10) / 10; }, V = D.V, tx = toTx, o = "";
  function X(p) { return V.OX + p[0] * V.S; } function Y(p) { return V.OY - p[1] * V.S; }
  function lerp(A, t) { var n = A.length - 1, i = Math.min(n - 1, Math.floor(t * n)), u = t * n - i; return [A[i][0] + (A[i + 1][0] - A[i][0]) * u, A[i][1] + (A[i + 1][1] - A[i][1]) * u]; }
  function fibers(A, B, n, cls) { var s = ""; for (var i = 1; i < n; i++) { var t = i / n, p = lerp(A, t), q = lerp(B, t); s += "M" + f(X(p)) + " " + f(Y(p)) + "L" + f(X(q)) + " " + f(Y(q)); } return '<path class="' + cls + '" d="' + s + '"/>'; }
  /* temporalis: the temporal line, the insertion under the arch, the front edge */
  var T = D.TEMP, arc = D.rgSamp(D.TEMPLINE, 5, true), front = D.rgSamp(T.front, 3, true);
  var tOut = arc.concat(T.ins.slice().reverse(), front.slice().reverse());
  var temp = '<g class="hot" data-info="Temporalis: an elevator, fanning from the temporal line on the side of the skull and passing under the zygomatic arch to the coronoid process."><path class="to-musc" d="' + D.rgD(tOut, V, true) + '"/>' + fibers(arc, T.ins, 17, "to-fib") + "</g>";
  o += D.rgScene({ C: [0, 0], Cm: [0, 0], th: 0 }, V, D, { mid: temp, styloid: false });
  /* masseter, over the ramus */
  var M = D.MASS, mOut = D.rgSamp(M.top.concat(M.back.slice(1), M.bot.slice(0, -1).reverse(), M.front.slice(1, -1)), 3);
  o += '<g class="hot" data-info="Masseter: an elevator, from the cheekbone (malar process) and the zygomatic arch down and back to the angle and the lower ramus of the mandible."><path class="to-musc to-mass" d="' + D.rgD(mOut, V, true) + '"/>' + fibers(M.top, M.bot, 10, "to-fib") + "</g>";
  /* the signs: a dot where each shows, a leader to its label */
  D.SIGNS.forEach(function (s) {
    var px = X(s.p), py = Y(s.p), w = Math.max.apply(null, s.t.map(function (t) { return t.length; })) * 6.3, n = s.t.length;
    var x0 = s.a === "end" ? s.at[0] - w : s.a === "middle" ? s.at[0] - w / 2 : s.at[0], bx = [x0 - 3, s.at[1] - 10, x0 + w + 3, s.at[1] + (n - 1) * 12 + 3];
    var sx = Math.min(Math.max(px, bx[0]), bx[2]), sy = Math.min(Math.max(py, bx[1]), bx[3]), d = Math.hypot(px - sx, py - sy), r = over ? 3.4 : 3;
    var g = '<g class="hot" data-info="' + (over ? "Above the tolerance: " : "Shows here once the tolerance is exceeded: ") + s.info + '">';
    if (d > r + 1) g += '<path class="' + (over ? "to-lead on" : "to-lead") + '" d="M' + f(sx) + " " + f(sy) + "L" + f(px - (px - sx) * r / d) + " " + f(py - (py - sy) * r / d) + '"/>';
    if (over) g += '<circle class="to-ring" cx="' + f(px) + '" cy="' + f(py) + '" r="7"/>';
    g += '<circle class="' + (over ? "to-site-on" : "to-site") + '" cx="' + f(px) + '" cy="' + f(py) + '" r="2.6"/>';
    s.t.forEach(function (t, k) { g += tx(s.at[0], s.at[1] + k * 12, t, over ? "to-sign on" : "to-sign", s.a); });
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
const plate = plateHtml({ fig: "Fig 15", title: "The tolerance model", hint: "add events · move the tolerance", readout: "", body: `<div class="am-svg to-box">${svgModel}${svgHead}</div>` });
const controls = `<div class="am-controls" role="group" aria-label="Events">${D.EVENTS.map((e, i) => `<button type="button" class="am-btn" data-toev="${i}" aria-pressed="${i === 0}">${e.t[0].toUpperCase() + e.t.slice(1)}${e.g === "systemic" ? " (systemic)" : ""}</button>`).join("")}</div>
<div class="am-controls"><label class="am-slider"><span>low tolerance</span><input type="range" min="0" max="100" step="1" value="33" aria-label="Physiologic tolerance"><span>high tolerance</span></label></div>
<div class="am-controls"><button type="button" class="am-btn" data-toweek aria-pressed="false">Monday, then Tuesday</button></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Hover or tap a block, the tolerance line or a structure.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From the L7 notes (Dr. Givan's Occ Lec6 slides and the 10/29 recording): Normal Function + Event &gt; Physiologic Tolerance ⇒ Symptoms; what regulates normal function; local and systemic events; local and systemic factors in tolerance; below the tolerance the patient adapts; each element can change, and an event tolerated one day may not be another; when the tolerances are exceeded, structures break down, with the signs a-g.</li>
<li>A metaphor, not a measurement: the stack shows the model's inequality, and the blocks' heights are equal by choice. Nobody has "a sticker on their forehead" saying how much they'll tolerate. The anatomy is the same side view as Figs 16 and 17 (the whole skull here), with simplified outlines of the temporalis and masseter; each sign is marked at one example site, and the labels sit off the drawing with leaders. Educational, not clinical guidance.</li></ul></details>`;

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
.anima .am-svg.to-box svg.to-anat{flex:338 1 300px;width:auto;max-width:410px}
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
.anima .to-svg .to-musc{fill:var(--tm-muscle);fill-opacity:.32;stroke:var(--tm-muscle-fib);stroke-width:1;stroke-linejoin:round}
.anima .to-svg .to-mass{fill-opacity:.4}
.anima .to-svg .to-fib{fill:none;stroke:var(--tm-muscle-fib);stroke-width:.6;stroke-opacity:.7}
.anima .to-svg .to-lead{fill:none;stroke:var(--anatomy-muted);stroke-width:.9;stroke-linecap:round}
.anima .to-svg .to-lead.on{stroke:var(--tm-vessel);stroke-width:1.2}
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
