// Fig: the envelope of motion, traced (Occlusion L1, "Mandibular movement and the envelope of motion").
// A pen on the lower central incisor draws Posselt's envelope one border at a time, in the three views of the static
// envSag / envHoriz / envFront figures (od.js; the outlines and the A-F / A-D points are copied from there so the two
// always match). Sagittal steps follow the notes: from CR, pure rotation to about 20-25 mm, rotation plus translation
// to maximum opening (40-60 mm, the posterior opening border), closing with the jaw fully protruded (the anterior
// opening border), then the superior contact border set by the teeth: back past the incisal edges to edge to edge, up
// the anterior guidance into MICP, and the slide back to CO/CR. A linked joint view shows the condyle at each step:
// the first two steps use the TMJ figure's own model (tmjModel, tmj.mjs); the protruded steps keep the condyle forward
// on the eminence and only change its rotation. The disc is the TMJ figure's (its thickness profile, turned back on the
// condyle as the condyle translates) and so is the mandible's outline, so the condyle never floats off the eminence.
// The step text, read-outs and joint label describe the border just traced (at a step boundary, the one that ended).
// Joint angles and positions are schematic.
import { figureSvg, plateHtml } from "./shared.mjs";
import { tmjModel, TMJ_D } from "./tmj.mjs";

/* the borders, as segments of the static figures' outlines; each step: [path from the previous point, label, text,
   joint state at its end: [mm for tmjModel] or [t along the eminence path, rotation in degrees]] */
const VIEWS = {
  sag: { w: 360, h: 384, start: [90, 60],
    shape: '<path class="en-soft" d="M112 40 C92 72 98 118 118 124 C138 118 136 72 112 40Z"/>',
    pins: [[76, 60, "A"], [112, 22, "B"], [160, 92, "C"], [252, 72, "D"], [64, 172, "E"], [130, 358, "F"]],
    extra: '<text class="en-t" x="262" y="16">Anterior →</text><text class="en-t en-mut" x="122" y="142">chewing</text>',
    steps: [
      ["C80 100 76 140 80 170", "A → E · pure rotation", "From CR (A), with the condyles seated, the jaw only rotates (the hinge movement) to about 20-25 mm at the incisors (E).", { mm: 25 }],
      ["C86 240 104 300 130 340", "E → F · rotation + translation", "Past 20-25 mm the condyles must translate down and forward on the eminence while still rotating, to maximum opening, about 40-60 mm (F). A → E → F is the posterior opening border.", { mm: 50 }],
      ["C220 300 270 190 235 64", "F → D · closing fully protruded", "Closing with the jaw held fully protruded traces the anterior opening border, up to maximum protrusion (D). The condyles stay forward on the eminence and rotate back.", { t: 0.92, th: 2 }],
      ["L196 64 L178 74 L160 72", "D → C · past the incisal edges", "Now the superior contact border, which the teeth set: back from maximum protrusion, flat past the incisal edges, to edge to edge (C).", { t: 0.3, th: 3 }],
      ["L112 40", "C → B · up the anterior guidance", "Up the anterior guidance into maximum intercuspation, MICP (B).", { t: 0.06, th: 0.5 }],
      ["L90 60", "B → A · the slide to CO/CR", "From MICP down and back to CO, the first contact with the condyles seated in CR (A). About 90% of people have this slide, around 1.25 mm; if CO equals MICP, the border runs straight from CR into the anterior guidance and this step is gone.", { t: 0, th: 0 }],
    ] },
  hor: { w: 360, h: 300, start: [180, 50],
    shape: '<circle class="en-dot0" cx="180" cy="50" r="5"/><text class="en-t" x="192" y="38">CR</text><circle class="en-dot0" cx="180" cy="240" r="4"/><text class="en-t en-mut" x="190" y="262">max protrusion</text>',
    pins: [[242, 64, "A"], [248, 188, "B"], [112, 188, "C"], [118, 64, "D"]],
    extra: '<text class="en-t" x="150" y="290">Anterior</text><text class="en-t" x="6" y="150">Patient&#8217;s</text><text class="en-t" x="6" y="166">RIGHT</text><text class="en-t" x="290" y="150">Patient&#8217;s</text><text class="en-t" x="290" y="166">LEFT</text>',
    steps: [
      ["L280 110", "A · left lateral", "Seen from above with the patient facing the bottom of the page (as on Dr. Givan's slide, so their left is on your right), from CR the incisor point swings to the patient's left: the left lateral border (A). The left condyle is the working one; the right (non-working) condyle comes forward and down the eminence."],
      ["L180 240", "B · left lateral with protrusion", "From the far left, protrude along the left lateral border with protrusion (B) to maximum protrusion at the bottom (front) apex."],
      ["L80 110", "C · right lateral with protrusion", "From maximum protrusion back to the far right: the right lateral border with protrusion (C)."],
      ["L180 50", "D · right lateral", "And back to CR along the right lateral border (D). Most chewing happens well inside these borders."],
    ] },
  fro: { w: 360, h: 330, start: [180, 40],
    shape: '<circle class="en-dot0" cx="180" cy="40" r="5"/><text class="en-t" x="192" y="34">ICP</text><circle class="en-dot0" cx="180" cy="56" r="4"/><text class="en-t" x="180" y="76" text-anchor="middle">PP</text><text class="en-t en-mut" x="150" y="318">max opening</text>',
    pins: [[238, 58, "A"], [268, 206, "B"], [92, 206, "C"], [122, 58, "D"]],
    extra: '<text class="en-t" x="8" y="150">Patient&#8217;s</text><text class="en-t" x="8" y="166">RIGHT</text><text class="en-t" x="288" y="150">Patient&#8217;s</text><text class="en-t" x="288" y="166">LEFT</text>',
    steps: [
      ["L270 98", "A · left lateral superior", "From the front (so the patient's left is on YOUR right), from the intercuspal position the incisor point slides out to the left along the left lateral superior border (A)."],
      ["C268 180 230 250 180 296", "B · left lateral opening", "From the far left it opens down the left lateral opening border (B) to maximum opening."],
      ["C130 250 92 180 90 98", "C · right lateral opening", "Closing up the right lateral opening border (C) to the far right."],
      ["L180 40", "D · right lateral superior", "And back along the right lateral superior border (D) to the intercuspal position. PP, the postural position, sits about 2-4 mm below it, held by a myotactic reflex."],
    ] },
};

/* the TMJ figure's mandible outline in its own frame (tmj.mjs mandOut: neck, ramus, sigmoid notch, coronoid), sampled
   as a polygon so the live code can rotate it and clip it to the joint window */
const MAND = [[-21, 6], [-20, 34], [-24, 90], [-30, 170], [-34, 280], [160, 280], [158, 120], [150, 58], [138, 26], [128, 44], [104, 82], [74, 98], [44, 86], [24, 52], [13, 36], [18, 18], [21, 4]];
function sampleOpen(pts, n) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t, g = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([Math.round(g(p0[0], p1[0], p2[0], p3[0]) * 10) / 10, Math.round(g(p0[1], p1[1], p2[1], p3[1]) * 10) / 10]); }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

const D = {
  VIEWS: Object.fromEntries(Object.entries(VIEWS).map(([k, v]) => [k, { n: v.steps.length, steps: v.steps.map((s) => ({ label: s[1], text: s[2], j: s[3] || null })) }])),
  /* the TMJ figure's model and disc */
  C0: TMJ_D.C0, CC: TMJ_D.CC, C1: TMJ_D.C1, TH1: TMJ_D.TH1, TH2: TMJ_D.TH2, PSI: TMJ_D.PSI, R: TMJ_D.R, RI: TMJ_D.RI, DT: TMJ_D.DT,
  MAND: sampleOpen(MAND, 4),
  /* the joint window, in the TMJ figure's coordinates: x0, y0, x1, y1 */
  WIN: [226, 104, 486, 290],
  /* what the condyle does during each sagittal step: [read-out, short label in the joint view] */
  JS: [["rotating only, still seated", "rotating"], ["rotating and sliding down the eminences", "rotating + sliding"], ["forward on the eminences, rotating back", "forward, closing"], ["sliding back up the eminences", "sliding back"], ["almost back on their seats (MICP)", "almost seated"], ["back on their seats (CR)", "seated"]],
};

/* the condyle at step position u (0..n) on the sagittal tab: centre and rotation */
function enJoint(u, D) {
  var st = D.VIEWS.sag.steps, i = Math.min(st.length - 1, Math.floor(u)), f = u - i;
  function at(k) {
    if (k < 0) return { C: D.C0, th: 0, t: 0 };
    var j = st[k].j;
    if (j.mm != null) { var m = tmjModel(j.mm, D); return { C: m.C, th: m.th, t: m.t }; }
    var t = j.t, s = 1 - t, a = D.C0, b = D.CC, c = D.C1;
    return { C: [s * s * a[0] + 2 * s * t * b[0] + t * t * c[0], s * s * a[1] + 2 * s * t * b[1] + t * t * c[1]], th: j.th, t: t };
  }
  /* inside a step the opening steps follow tmjModel continuously; the others blend their end states */
  var j = st[i].j;
  if (j.mm != null) { var mm0 = i ? st[i - 1].j.mm || 0 : 0, m = tmjModel(mm0 + (j.mm - mm0) * f, D); return { C: m.C, th: m.th, t: m.t }; }
  var p = at(i - 1), q = at(i);
  return { C: [p.C[0] + (q.C[0] - p.C[0]) * f, p.C[1] + (q.C[1] - p.C[1]) * f], th: p.th + (q.th - p.th) * f, t: p.t + (q.t - p.t) * f };
}

/* the disc's thickness by angle (degrees from the top of the condyle, + = anterior): the TMJ figure's profile */
function enDiscT(a, D) {
  var k = D.DT, i;
  if (a <= k[0][0]) return k[0][1];
  for (i = 1; i < k.length; i++) if (a <= k[i][0]) { var u = (a - k[i - 1][0]) / (k[i][0] - k[i - 1][0]); u = (1 - Math.cos(u * Math.PI)) / 2; return k[i - 1][1] + (k[i][1] - k[i - 1][1]) * u; }
  return k[k.length - 1][1];
}
/* the moving parts of the joint view for a condyle state J {C, th, t}, in the TMJ figure's coordinates: the disc (turned
   back on the condyle by PSI * t, as in the TMJ figure, so its thin middle stays between condyle and eminence) and the
   mandible (rotated th about the condyle), clipped to the window */
function enJointParts(J, D) {
  function f(v) { return Math.round(v * 10) / 10; }
  function rot(p, deg) { var r = deg * Math.PI / 180, c = Math.cos(r), s = Math.sin(r); return [J.C[0] + p[0] * c - p[1] * s, J.C[1] + p[0] * s + p[1] * c]; }
  function polar(a, r) { var q = a * Math.PI / 180; return [r * Math.sin(q), -r * Math.cos(q)]; }
  function P(pts) { return "M" + pts.map(function (p) { return f(p[0]) + " " + f(p[1]); }).join("L") + "Z"; }
  var psi = -D.PSI * (J.t || 0), out = [], inn = [];
  for (var a = -64; a <= 102; a += 6) { out.push(rot(polar(a, D.RI + enDiscT(a, D)), psi)); inn.unshift(rot(polar(a, D.RI), psi)); }
  var B = D.WIN, m = D.MAND.map(function (p) { return rot(p, J.th); });
  function side(arr, inside, cut) { var o = []; for (var i = 0; i < arr.length; i++) { var p = arr[i], q = arr[(i + 1) % arr.length], ip = inside(p), iq = inside(q); if (ip) o.push(p); if (ip !== iq) o.push(cut(p, q)); } return o; }
  function cx(x) { return function (p, q) { return [x, p[1] + (q[1] - p[1]) * (x - p[0]) / (q[0] - p[0])]; }; }
  function cy(y) { return function (p, q) { return [p[0] + (q[0] - p[0]) * (y - p[1]) / (q[1] - p[1]), y]; }; }
  m = side(m, function (p) { return p[0] >= B[0]; }, cx(B[0])); m = side(m, function (p) { return p[0] <= B[2]; }, cx(B[2])); m = side(m, function (p) { return p[1] <= B[3]; }, cy(B[3]));
  return { disc: P(out.concat(inn)), mand: m.length > 2 ? P(m) : "" };
}

function pin(x, y, l) { return `<g class="en-pin"><circle cx="${x}" cy="${y}" r="9"/><text x="${x}" y="${y + 4}" text-anchor="middle">${l}</text></g>`; }
function viewSvg(key) {
  const v = VIEWS[key];
  let x = v.start, d = "", segs = "";
  v.steps.forEach((s, i) => { segs += `<path class="en-seg" data-enseg="${i}" d="M${x[0]} ${x[1]} ${s[0]}"/>`; d += (i ? " " : `M${x[0]} ${x[1]} `) + s[0]; const nums = s[0].trim().split(/[\sA-Z]+/).filter(Boolean).map(Number); x = [nums[nums.length - 2], nums[nums.length - 1]]; });
  const body = v.shape.includes("en-soft") ? v.shape : "";
  const rest = v.shape.includes("en-soft") ? "" : v.shape;
  return figureSvg({ width: v.w, height: v.h, className: `en-svg en-${key}`,
    label: { sag: "Sagittal envelope of motion traced at the lower incisor, points A to F", hor: "Horizontal envelope of motion seen from above, anterior at the bottom, patient's left on the right, borders A to D", fro: "Frontal envelope of motion seen from the front, borders A to D" }[key],
    body: body + `<path class="en-track" d="${d}"/>` + segs + rest + v.extra + v.pins.map((p) => pin(...p)).join("") +
      `<g class="en-pen"><circle r="9" class="en-pen-halo"/><circle r="4.5" class="en-pen-dot"/></g>` });
}

/* the joint inset: the TMJ figure's fossa and eminence, cut to a window, with the disc, the condyle and the mandible */
const F = TMJ_D.FOSSA, WB = D.WIN;
const jointBone = `M${WB[0]} ${WB[1]}L${WB[0]} ` + F[0][1] + "L" + F.map((p) => p[0] + " " + p[1]).join("L") + `L${TMJ_D.TUB[0]} ${TMJ_D.TUB[1]}L${WB[2]} 172L${WB[2]} ${WB[1]}Z`;
const J0 = enJointParts({ C: TMJ_D.C0, th: 0, t: 0 }, D);
const jointSvg = figureSvg({ width: 260, height: 210, className: "en-joint", label: "The right temporomandibular joint from the side, patient facing right, with the condyle and disc at each step",
  body: `<g transform="translate(-226 -104)"><rect class="en-win" x="${WB[0]}" y="${WB[1]}" width="${WB[2] - WB[0]}" height="${WB[3] - WB[1]}"/><path class="en-jbone" d="${jointBone}"/>` +
    `<path class="en-mand" d="${J0.mand}"/><path class="en-disc" d="${J0.disc}"/>` +
    `<g class="en-cond" transform="translate(${TMJ_D.C0[0]} ${TMJ_D.C0[1]})"><circle class="en-chead" r="${TMJ_D.R}"/><path class="en-tick" d="M0 0V-17"/></g>` +
    `<rect class="en-win-edge" x="${WB[0]}" y="${WB[1]}" width="${WB[2] - WB[0]}" height="${WB[3] - WB[1]}"/>` +
    `<text class="en-t en-mut en-jt" x="404" y="132" text-anchor="middle">articular eminence</text><text class="en-t en-mut en-jt" x="300" y="122" text-anchor="middle">fossa</text></g>` +
    `<text class="en-t en-jlab" x="6" y="204">seated</text><text class="en-t en-mut" x="254" y="204" text-anchor="end">right TMJ</text>` });

const TABS = [["sag", "Sagittal"], ["hor", "Horizontal"], ["fro", "Frontal"]];
const plate = plateHtml({ fig: "Fig 6", title: "Envelope tracer", hint: "step through the borders", readout: "",
  body: `<div class="en-grid">${TABS.map(([k], i) => `<div class="am-svg en-view" data-enview="${k}"${i ? " hidden" : ""}>${viewSvg(k)}</div>`).join("")}<div class="am-svg en-jbox" data-enjoint>${jointSvg}</div></div>` });
const controls = `<div class="am-controls en-tabs" role="group" aria-label="View">${TABS.map(([k, l], i) => `<button type="button" class="am-btn" data-entab="${k}" aria-pressed="${!i}">${l}</button>`).join("")}</div>
<div class="am-controls"><label class="am-slider"><span>start</span><input type="range" min="0" max="600" step="1" value="0" aria-label="How far along the borders the pen has traced"><span>end</span></label></div>
<div class="am-controls"><button type="button" class="am-btn" data-enstep="-1">Back</button><button type="button" class="am-btn" data-enstep="1">Next step</button><button type="button" class="am-btn" data-enplay aria-pressed="false">Play all</button></div>
<div class="am-stats" aria-live="polite"><span><b>Step</b> <em data-r="step">not started</em></span><span data-enjrow><b>Condyles</b> <em data-r="joint">seated in CR</em></span></div>
<p class="am-summary" aria-live="polite"></p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>The outlines and the lettered points are the same as the static envelope figures above (the notes' Posselt envelope), traced in the order the L1 notes describe. The pen is the lower central incisor.</li>
<li>The joint view uses the TMJ figure's model (L2) for the opening steps: rotation only to about 20-25 mm, then translation down the eminence to maximum opening, the disc turning back on the condyle so its thin middle stays against the eminence. For the protruded steps the condyle is drawn forward on the eminence; its exact position and angle are schematic. The retrodiscal tissue and the muscles are left out (they are in the TMJ figure).</li>
<li>The borders are limits: the opening borders are set by ligaments and joint anatomy, the superior border by the teeth. We rarely function at a border except the superior one; chewing happens in the small teardrop below MICP.</li></ul></details>`;

function enLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var view = "sag", u = 0, tgt = 0, frame = 0, last = 0, playing = false;
  var slider = root.querySelector('input[type="range"]'), sum = root.querySelector(".am-summary"), readout = root.querySelector("[data-readout]");
  var rs = {}; Array.prototype.forEach.call(root.querySelectorAll("[data-r]"), function (e) { rs[e.getAttribute("data-r")] = e; });
  var jbox = root.querySelector("[data-enjoint]"), jrow = root.querySelector("[data-enjrow]"), cond = root.querySelector(".en-cond"), jlab = root.querySelector(".en-jlab"), play = root.querySelector("[data-enplay]");
  var mandEl = root.querySelector(".en-mand"), discEl = root.querySelector(".en-disc");
  var cache = {};
  function segs(k) {
    if (cache[k]) return cache[k];
    var box = root.querySelector('[data-enview="' + k + '"]'), list = Array.prototype.map.call(box.querySelectorAll("[data-enseg]"), function (p) { var L = p.getTotalLength(); p.style.strokeDasharray = L + " " + L; return { el: p, L: L }; });
    return (cache[k] = { box: box, list: list, pen: box.querySelector(".en-pen") });
  }
  function n() { return D.VIEWS[view].n; }
  function draw() {
    /* the border being traced, or at a step boundary the one just finished, so the text matches what was drawn */
    var S = segs(view), N = n(), i = u <= 0 ? 0 : Math.min(N - 1, Math.ceil(u - 1e-6) - 1), f = Math.max(0, Math.min(1, u - i));
    S.list.forEach(function (s, k) { var part = k < i ? 1 : k > i ? 0 : f; s.el.style.strokeDashoffset = String(s.L * (1 - part)); s.el.classList.toggle("is-now", k === i && u > 0 && u < N); });
    var seg = S.list[i], pt = seg.el.getPointAtLength(seg.L * f);
    S.pen.setAttribute("transform", "translate(" + pt.x.toFixed(1) + " " + pt.y.toFixed(1) + ")");
    var step = D.VIEWS[view].steps[i];
    /* at the end, the last border's label and text stay up (B → A's slide, D's chewing, C's PP), then the closing line */
    rs.step.textContent = u <= 0 ? "not started" : u >= N ? step.label + " (envelope closed)" : step.label;
    if (readout) readout.textContent = u <= 0 ? "" : u >= N ? "envelope closed" : step.label.split(" · ")[0];
    var t = u <= 0 ? ({ sag: "Press Next step (or drag) and the pen on the lower incisor traces the sagittal envelope from centric relation, one border at a time.", hor: "From above, patient facing the bottom of the page: the pen starts at CR, the top (back) apex.", fro: "From the front: the pen starts at the intercuspal position at the top." })[view] : u >= N ? step.text + " That closes the envelope. Everything the jaw can do lies inside it; function happens in a small teardrop below MICP." : step.text;
    if (sum.textContent !== t) sum.textContent = t;
    jbox.hidden = view !== "sag"; jrow.hidden = view !== "sag";
    if (view === "sag") {
      var J = D.enJoint(Math.min(u, N - 0.0001), D);
      cond.setAttribute("transform", "translate(" + J.C[0].toFixed(1) + " " + J.C[1].toFixed(1) + ") rotate(" + J.th.toFixed(2) + ")");
      var parts = D.enJointParts(J, D); mandEl.setAttribute("d", parts.mand); discEl.setAttribute("d", parts.disc);
      var js = u <= 0 || u >= N ? ["seated in CR", "seated"] : D.JS[i];
      rs.joint.textContent = js[0]; jlab.textContent = js[1];
    }
  }
  function stop() { playing = false; cancelAnimationFrame(frame); play.setAttribute("aria-pressed", "false"); }
  function tick(now) {
    var dt = Math.min(64, now - (last || now)); last = now;
    var dir = tgt > u ? 1 : -1, sp = playing ? 0.00055 : 0.0022;
    u = dir > 0 ? Math.min(tgt, u + dt * sp) : Math.max(tgt, u - dt * sp);
    slider.value = Math.round(u * 600 / n()); draw();
    if (u !== tgt) frame = requestAnimationFrame(tick); else { if (playing) stop(); }
  }
  function go(to) { tgt = Math.max(0, Math.min(n(), to)); cancelAnimationFrame(frame); if (reduce.matches) { u = tgt; slider.value = Math.round(u * 600 / n()); draw(); return; } last = 0; frame = requestAnimationFrame(tick); }
  root.querySelectorAll("[data-enstep]").forEach(function (b) { b.addEventListener("click", function () { stop(); var d = +b.getAttribute("data-enstep"); go(d > 0 ? Math.floor(u + 1e-6) + 1 : Math.ceil(u - 1e-6) - 1); }); });
  play.addEventListener("click", function () { if (playing) { stop(); return; } if (u >= n()) u = 0; playing = true; play.setAttribute("aria-pressed", "true"); go(n()); });
  slider.addEventListener("input", function () { stop(); cancelAnimationFrame(frame); u = tgt = +slider.value / 600 * n(); draw(); });
  root.querySelectorAll("[data-entab]").forEach(function (b) { b.addEventListener("click", function () {
    stop(); cancelAnimationFrame(frame); view = b.getAttribute("data-entab"); u = tgt = 0; slider.value = 0;
    root.querySelectorAll("[data-enview]").forEach(function (v) { v.hidden = v.getAttribute("data-enview") !== view; });
    root.querySelectorAll("[data-entab]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
    draw(); }); });
  draw();
}

const CSS = `
.anima .en-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px 18px;align-items:center}
.anima .en-grid [hidden]{display:none}
.anima .en-view{max-width:420px;margin:0 auto;width:100%}
.anima .en-jbox{max-width:300px;margin:0 auto;width:100%}
.anima .en-svg .en-t,.anima .en-joint .en-t{fill:var(--anatomy-text);font:13px var(--anatomy-mono);paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round}
.anima .en-t.en-mut{fill:var(--anatomy-muted)}
.anima .en-svg .en-soft{fill:var(--accent-soft);stroke:none}
.anima .en-svg .en-track{fill:none;stroke:var(--anatomy-lo);stroke-width:1.6;stroke-dasharray:3 4;vector-effect:none}
.anima .en-svg .en-seg{vector-effect:none;fill:none;stroke:var(--anatomy-strong);stroke-width:3;stroke-linecap:round;stroke-linejoin:round}
.anima .en-svg .en-seg.is-now{stroke:var(--anatomy-lit)}
.anima .en-svg .en-dot0{fill:var(--anatomy-strong)}
.anima .en-svg .en-pin circle{fill:var(--surface);stroke:var(--anatomy-mid);stroke-width:1.2}
.anima .en-svg .en-pin text{fill:var(--anatomy-strong);font:600 12px var(--anatomy-mono)}
.anima .en-svg .en-pen-halo{fill:var(--anatomy-lit);opacity:.22}
.anima .en-svg .en-pen-dot{fill:var(--anatomy-lit)}
.anima .en-joint .en-jbone{fill:var(--tm-bone);stroke:var(--anatomy-hi);stroke-width:1.2;stroke-linejoin:round}
.anima .en-joint .en-win{fill:var(--anatomy-shade-2)}
.anima .en-joint .en-win-edge{fill:none;stroke:var(--anatomy-lo);stroke-width:1}
.anima .en-joint .en-mand{fill:var(--tm-bone-in);stroke:var(--anatomy-hi);stroke-width:1.2;stroke-linejoin:round}
.anima .en-joint .en-disc{fill:var(--tm-disc);stroke:var(--anatomy-mid);stroke-width:.9;stroke-linejoin:round}
.anima .en-joint .en-jt{font-size:12px;stroke:var(--tm-bone)}
.anima .en-joint .en-chead{fill:var(--tm-bone);stroke:var(--anatomy-hi);stroke-width:1.4}
.anima .en-joint .en-tick{stroke:var(--anatomy-lit);stroke-width:2.4;stroke-linecap:round}
.anima .en-joint .en-jlab{fill:var(--anatomy-strong);font-weight:600}
.anima .en-tabs .am-btn{white-space:nowrap}
`;

export function envelope() {
  return {
    id: "envelope", lec: "review",
    title: "Envelope of motion, traced",
    caption: "Step through Posselt's envelope with a pen on the lower incisor, border by border, in the sagittal, horizontal and frontal views; on the sagittal view a joint view shows the condyle rotating or sliding at each step.",
    html: `<div class="anima" data-anima="envelope">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: enLive.toString(),
    helpers: [tmjModel, enJoint, enDiscT, enJointParts],
    data: D,
  };
}
