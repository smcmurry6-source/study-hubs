// Fig 20: the three denture occlusal schemes in motion (Occlusion L8, "The occlusal schemes"). A frontal section
// through the first molars of a patient wearing complete dentures (l8den.mjs), patient's right at the left. Pick a
// scheme, then close into centric occlusion, slide into a right working movement or protrude. Balanced (anatomic
// teeth): contact on both sides in every position, the non-working side's being the balancing contact we avoid in
// natural teeth. Non-balanced (flat teeth, condylar guidance set to 0 on the articulator): contact only in centric
// occlusion; the patient's own condylar guidance drops the jaw, more on the non-working side, and the teeth come apart.
// Lingualized, set balanced or non-balanced: the long upper lingual cusp in the lower tooth's wide fossa. And what
// balance prevents: contact on the working side only, and the one-piece lower denture tips, its far side lifting off
// the ridge. Lamps say where the teeth touch, the front teeth included. Every pose is solved in Node from the drawing
// (the jaw's drop on each side is set, then the lower denture is raised until the touching side meets); the drops are
// schematic, not measured. Content from the L8 notes only (the 11/5 recording).
import { figureSvg, plateHtml } from "./shared.mjs";
import { DEN, DEN_HELPERS, DEN_CSS } from "./l8den.mjs";

const W = 560, H = 330;
const deg = Math.PI / 180;
const H30 = DEN.PROF.anat.h;
const FORM = { bal: "anat", non: "flat", lingB: "ling", lingN: "ling", one: "anat" };
/* each pose: the lateral slide, the jaw's drop on the right and left (mm), the lower denture's tip (deg) and which
   side(s) the lower denture is raised to touch */
const SPEC = {
  co: { bal: [0, 0, 0, 0, "b"], non: [0, 0, 0, 0, "b"], lingB: [0, 0, 0, 0, "b"], lingN: [0, 0, 0, 0, "b"], one: [0, 0, 0, 0, "b"] },
  work: { bal: [-2.5, H30, H30, 0, "b"], non: [-2.5, 0.6, 1.8, 0, ""], lingB: [-2.5, 1, 1, 0, "b"], lingN: [-2.5, 1.5, 2.6, 0, ""], one: [-2.5, H30, H30 + 3.4, 2.9, "r"] },
  prot: { bal: [0, 0, 0, 0, "b"], non: [0, 1.5, 1.5, 0, ""], lingB: [0, 0, 0, 0, "b"], lingN: [0, 1.5, 1.5, 0, ""] },
};
const D = Object.assign({}, DEN, { W, H, V: { OX: 280, OY: 196, S: 4.4 } }, Object.fromEntries(DEN_HELPERS.map((fn) => [fn.name, fn])));
const r4 = (v) => Math.round(v * 10000) / 10000;
const POSE = {};
for (const m of Object.keys(SPEC)) for (const k of Object.keys(SPEC[m])) {
  const [dx, dR, dL, tip, touch] = SPEC[m][k];
  const T = { dx, dy: -(dR + dL) / 2, rot: -Math.atan((dL - dR) / (2 * DEN.XC)) / deg, tip };
  for (let i = 0; touch && i < 3; i++) {
    const sides = touch === "b" ? ["r", "l"] : [touch];
    T.dy += Math.min(...sides.map((s) => D.dnContacts(s, FORM[k], T, D).gap));
  }
  POSE[m + ":" + k] = { dx: r4(T.dx), dy: r4(T.dy), rot: r4(T.rot), tip: r4(T.tip) };
}

const NAME = { bal: "balanced", non: "non-balanced", lingB: "lingualized (balanced)", lingN: "lingualized (non-bal.)", one: "one side only" };
const MOVE = { co: "closed", work: "right working", prot: "protrusion" };
const SUM = {
  "co:bal": "Balanced (bilateral balance): in centric occlusion the posterior teeth intercuspate on both sides. These are anatomic teeth, with 30-degree cusps.",
  "work:bal": "Right working: the teeth touch on the working side and, at the same time, on the non-working side, where the lower buccal cusp rides the upper lingual cusp. Those balancing contacts are exactly what we avoid in natural teeth. With contact on both sides, the one-piece denture doesn't tip out.",
  "prot:bal": "Protrusion: the posterior teeth stay in contact, and with anatomic teeth the front teeth may touch as well. Balance comes mainly from the compensating curve, the cusp height and what little the occlusal plane can change, set on a semi-adjustable articulator programmed with a facebow and a protrusive record.",
  "co:non": "Non-balanced: flat (0-degree) teeth on a flat plane parallel to the ridges, with no compensating curve. The posterior teeth contact only when the patient closes into centric occlusion.",
  "work:non": "Right working: the teeth come apart on both sides. The articulator's condylar guidance was set to zero, and the patient's own guidance is never zero, so it drops the jaw (more on the non-working side) as it moves. Not touching is another way to keep a denture from tipping.",
  "prot:non": "Protrusion: no contact anywhere, and no anterior contact. The forces stay centralized, never lateral or horizontal.",
  "co:lingB": "Lingualized: the long upper lingual cusp sits in the lower tooth's wide fossa, like a mortar and pestle. The upper buccal cusps don't touch. It's easy to set, and it can be set balanced or non-balanced.",
  "work:lingB": "Set balanced: a little plane of occlusion and compensating curve keep the lingual cusps touching on both sides in a lateral movement (left-right balance). Chosen for healthy, good ridges, firm mucosa, and good awareness and dexterity.",
  "prot:lingB": "Protrusion: the lingual cusps stay in contact, but the front teeth never touch. A lingualized denture can't be kept from tipping front to back.",
  "co:lingN": "Lingualized: the long upper lingual cusp sits in the lower tooth's wide fossa, like a mortar and pestle. The upper buccal cusps don't touch.",
  "work:lingN": "Set non-balanced: the lingual cusps hit in centric occlusion, and there is no contact in any eccentric movement. Chosen for a lot of ridge resorption, flabby tissues, poor oral awareness or dexterity, or difficult jaw relations.",
  "prot:lingN": "Protrusion: no contact, and the front teeth never touch.",
  "co:one": "Anatomic teeth set without balance. In centric occlusion they still intercuspate on both sides.",
  "work:one": "Right working with contact on the working side only. The bite pushes on one side of the one-piece lower denture, so it tips, and the non-working side lifts off its ridge (red). Patients can't work with that, which is why a denture is either balanced or kept from touching at all.",
};
const FRONT = { co: "apart: usually only the back teeth touch", work: "apart", "prot:bal": "touching: allowed with anatomic teeth", "prot:non": "apart: no anterior contact", "prot:lingB": "apart: never in lingualized", "prot:lingN": "apart: never in lingualized" };
const TEETH = {
  anat: "Anatomic denture teeth: 30-degree cusps (30 degrees or more), with sulci and ridges. They allow balance and look the most natural.",
  flat: "Flat (non-anatomic) teeth: 0-degree cusps. The least lateral force, so stability is easiest.",
  ling: "Lingualized: the upper tooth's lingual cusp is elongated (the pestle); the lower tooth is flat with a wide fossa (the mortar).",
};
const HOT = {
  max: "Maxilla. Its ridges and the depth of the palatal vault (a big one for the maxillary denture) give the upper denture something to hold on to.",
  mand: "Mandible, cut through at the first molars. It carries the lower denture and moves as one piece with it.",
  tongue: "Tongue. It hypertrophies after the teeth are lost and fills the space where they were, mostly a problem for the lower denture.",
  ubase: "Upper denture: one piece over both ridges and the palate. Its teeth never work on their own: one upper tooth.",
  lbase: "Lower denture: one horseshoe (its front is cut away in this section), so both sides move together: one lower tooth.",
};

function scSvg(st, D) {
  var f = function (n) { return Math.round(n * 10) / 10; }, V = D.V, T = st.T, form = D.FORM[st.k], o = "", key = st.m + ":" + st.k;
  function tx(x, y, t, cls, a) { return '<text class="sc-t' + (cls ? " " + cls : "") + '" x="' + f(x) + '" y="' + f(y) + '"' + (a ? ' text-anchor="' + a + '"' : "") + ">" + t + "</text>"; }
  var lift = st.u >= 1 && st.k === "one" && st.m === "work" ? "l" : null;
  o += D.dnScene(T, form, V, D, "sc", { hot: Object.assign({ teeth: D.TEETH[form] }, D.HOT), lift: lift });
  /* contacts, once the jaw is there */
  var C = { r: null, l: null };
  if (st.u >= 1) ["r", "l"].forEach(function (s) { C[s] = D.dnContacts(s, form, T, D); C[s].pts.forEach(function (p) { o += '<circle class="sc-hit" cx="' + f(D.dnX(p, V)) + '" cy="' + f(D.dnY(p, V)) + '" r="2.6"/>'; }); });
  if (lift) { var q = D.dnDen([25.5, -10], T, D); o += '<g class="am-callout"><path class="am-leader" d="M' + f(D.dnX(q, V)) + " " + f(D.dnY(q, V)) + "L" + 472 + " " + 252 + '"/><circle class="am-dot" cx="' + f(D.dnX(q, V)) + '" cy="' + f(D.dnY(q, V)) + '" r="1.8"/>' + tx(476, 256, "lifts off", "sc-bad", "start") + tx(476, 269, "the ridge", "sc-bad", "start") + "</g>"; }
  /* what's what */
  function lab(t, x, y, p, a) { var px = D.dnX(p, V), py = D.dnY(p, V), w = t.length * 6.9, sx = a === "end" ? x + 2 : x + w + 2; return '<g class="am-callout"><path class="am-leader" d="M' + f(sx) + " " + f(y - 4) + "L" + f(px) + " " + f(py) + '"/><circle class="am-dot" cx="' + f(px) + '" cy="' + f(py) + '" r="1.8"/>' + tx(x, y, t, "sc-lab", a) + "</g>"; }
  o += lab("upper denture", 12, 128, D.dnRot([-32.2, 10.5], [0, 0], 0), "start");
  var lp = D.dnDen([-31.5, -11.6], T, D); o += lab("lower denture", 12, 262, lp, "start");
  var tp = D.dnJaw([0, -16], T, D); o += tx(D.dnX(tp, V), D.dnY(tp, V), "tongue", "sc-lab", "middle");
  /* the sides */
  o += tx(14, 318, "patient's right", "sc-side", "start") + tx(546, 318, "patient's left", "sc-side", "end");
  if (st.m === "work") o += tx(14, 304, "working side", "sc-sub", "start") + tx(546, 304, "non-working side", "sc-sub", "end");
  /* lamps: where the teeth touch */
  function lamp(x, y, s, name, txt) { return '<circle class="sc-lamp-' + s + '" cx="' + (x + 6) + '" cy="' + (y - 4) + '" r="5.5"/>' + tx(x + 18, y, name, "sc-head", "start") + tx(x + 18, y + 14, txt, "sc-sub", "start"); }
  function side(s) { if (!C[s]) return ["off", "..."]; if (C[s].pts.length) return ["on", "touching"]; return lift === s ? ["bad", "apart: the denture tips"] : ["off", "apart"]; }
  var fr = D.FRONT[key] || D.FRONT[st.m] || "apart", fs = /touching/.test(fr) ? "on" : "off";
  o += '<rect class="sc-card" x="126" y="6" width="308" height="70" rx="10"/>';
  var a = side("r"), b = side("l");
  o += lamp(136, 22, a[0], "right side", a[1]) + lamp(290, 22, b[0], "left side", b[1]) + lamp(136, 56, st.u >= 1 ? fs : "off", "front teeth", st.u >= 1 ? fr : "...");
  return o;
}

const svg = figureSvg({ width: W, height: H, className: "sc-svg", label: "Frontal section through the first molars of a patient wearing complete dentures: the maxilla and palate with the upper denture, the mandible and tongue with the lower denture, and the upper and lower molars on each side, with lamps for where the teeth touch.", body: scSvg({ k: "bal", m: "co", u: 1, T: POSE["co:bal"] }, Object.assign({ SUM, NAME, MOVE, FRONT, TEETH, HOT, FORM, POSE, scSvg }, D)) });
const plate = plateHtml({ fig: "Fig 22", title: "Balanced, non-balanced, lingualized", hint: "scheme, then a move", readout: "", body: `<div class="am-svg sc-box">${svg}</div>` });
const controls = `<div class="am-controls" role="group" aria-label="Occlusal scheme"><button type="button" class="am-btn" data-sck="bal" aria-pressed="true">Balanced</button><button type="button" class="am-btn" data-sck="non" aria-pressed="false">Non-balanced</button><button type="button" class="am-btn" data-sck="lingB" aria-pressed="false">Lingualized, set balanced</button><button type="button" class="am-btn" data-sck="lingN" aria-pressed="false">Lingualized, set non-balanced</button><button type="button" class="am-btn" data-sck="one" aria-pressed="false">Contact on one side only</button></div>
<div class="am-controls" role="group" aria-label="Movement"><button type="button" class="am-btn" data-scm="co" aria-pressed="true">Close (centric occlusion)</button><button type="button" class="am-btn" data-scm="work" aria-pressed="false">Right working</button><button type="button" class="am-btn" data-scm="prot" aria-pressed="false">Protrude</button></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Hover or tap a denture, a tooth, the bone or the tongue.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From the L8 notes (Dr. Givan, the 11/5 recording): a denture patient has one upper tooth and one lower tooth, so the teeth are arranged to keep the denture from tipping; balancing is the opposite of tipping. Balanced occlusion is the bilateral, simultaneous contact of the anterior and posterior teeth in centric and eccentric positions (anterior contact allowed in protrusion with anatomic teeth); non-balanced occlusion uses flat (0-degree) teeth on a flat plane parallel to the ridges with no compensating curve, the articulator's condylar guidance set to zero, contact only in centric occlusion and no anterior contact; lingualized occlusion puts an elongated maxillary lingual cusp against a flat or wide-fossa mandibular tooth (mortar and pestle), set balanced (left-right balance) or non-balanced, never with anterior contact.</li>
<li>Schematic: a frontal section through the first molars, drawn to typical proportions, not traced from a patient. The cusp angles are the notes' (anatomic 30 degrees, flat 0 degrees; the lingualized teeth are semi-anatomic). How far the jaw drops on each side in a movement is drawn for clarity, not measured; the poses are solved from the drawing, the lower denture raised until the touching side meets. Protrusion moves the jaw forward, out of this section, so only its effect on contact is shown. Educational, not clinical guidance.</li></ul></details>`;

function scLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var svg = root.querySelector(".sc-svg"), sum = root.querySelector(".am-summary"), info = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]");
  var st = { k: "bal", m: "co", u: 1, T: D.POSE["co:bal"] }, raf = 0;
  var protBtn = root.querySelector('[data-scm="prot"]');
  function text() {
    sum.textContent = D.SUM[st.m + ":" + st.k];
    protBtn.disabled = st.k === "one"; protBtn.title = st.k === "one" ? "Shown for the three schemes" : "";
  }
  function read() { if (!readout) return; var c = ["r", "l"].map(function (s) { return D.dnContacts(s, D.FORM[st.k], st.T, D).pts.length > 0; }); readout.textContent = D.NAME[st.k] + " · " + D.MOVE[st.m] + " · " + (c[0] && c[1] ? "both sides touch" : c[0] ? "one side touches" : "apart"); }
  function draw() { svg.innerHTML = D.scSvg(st, D); if (st.u >= 1) read(); }
  function lerp(a, b, u) { function l(k) { return a[k] + (b[k] - a[k]) * u; } return { dx: l("dx"), dy: l("dy"), rot: l("rot"), tip: l("tip") }; }
  function go(seq) {
    cancelAnimationFrame(raf); text();
    if (reduce.matches) { st.T = seq[seq.length - 1]; st.u = 1; draw(); return; }
    var i = 0, from = st.T, t0 = performance.now(), dur = 600; st.u = 0;
    function step(now) {
      var u = Math.min(1, (now - t0) / dur), e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      st.T = lerp(from, seq[i], e);
      if (u >= 1) { from = seq[i]; i++; t0 = now; }
      if (i >= seq.length) { st.T = seq[seq.length - 1]; st.u = 1; draw(); return; }
      draw(); raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
  }
  function target() { return D.POSE[st.m + ":" + st.k]; }
  root.querySelectorAll("[data-sck]").forEach(function (b) { b.addEventListener("click", function () {
    var was = st.k; st.k = b.getAttribute("data-sck"); if (st.k === "one" && st.m === "prot") { st.m = "co"; root.querySelectorAll("[data-scm]").forEach(function (x) { x.setAttribute("aria-pressed", String(x.getAttribute("data-scm") === "co")); }); }
    root.querySelectorAll("[data-sck]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
    /* new teeth: start from centric occlusion, then move */
    if (was !== st.k) { st.T = D.POSE["co:" + st.k]; st.u = 1; draw(); }
    go([target()]);
  }); });
  root.querySelectorAll("[data-scm]").forEach(function (b) { b.addEventListener("click", function () {
    if (b.disabled) return; st.m = b.getAttribute("data-scm");
    root.querySelectorAll("[data-scm]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
    go(st.m === "co" ? [target()] : [D.POSE["co:" + st.k], target()]);
  }); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && svg.contains(el)) info.textContent = el.getAttribute("data-info"); }
  svg.addEventListener("pointerover", hot); svg.addEventListener("click", hot);
  text(); draw();
}

const CSS = DEN_CSS("sc") + `
.anima .sc-box{max-width:600px;margin:0 auto}
.anima .sc-svg .sc-t{fill:var(--anatomy-text);font:11.5px var(--anatomy-mono);paint-order:stroke;stroke:var(--surface);stroke-width:3.5px;stroke-linejoin:round}
.anima .sc-svg .sc-head{fill:var(--anatomy-strong);font-weight:700}
.anima .sc-svg .sc-sub{fill:var(--anatomy-muted);font-size:10.5px}
.anima .sc-svg .sc-lab{fill:var(--anatomy-strong)}
.anima .sc-svg .sc-side{fill:var(--anatomy-strong);font-weight:600}
.anima .sc-svg .sc-bad{fill:var(--tm-vessel);font-weight:600}
.anima .sc-svg .sc-card{fill:var(--surface);fill-opacity:.92;stroke:var(--line);stroke-width:1}
.anima .sc-svg .sc-lamp-on{fill:#2f8a5b}
.anima .sc-svg .sc-lamp-off{fill:none;stroke:var(--anatomy-mid);stroke-width:1.4}
.anima .sc-svg .sc-lamp-bad{fill:var(--tm-vessel)}
.anima .sc-svg .sc-hit{fill:#2f8a5b;stroke:var(--surface);stroke-width:1}
.anima .am-btn:disabled{opacity:.45;cursor:not-allowed}
`;

export function schemes() {
  return {
    id: "schemes", lec: "dentures",
    title: "Balanced, non-balanced and lingualized",
    caption: "Pick a scheme, then close, slide into a right working movement or protrude, and watch where the teeth touch. Then try contact on one side only: that is what balance prevents.",
    html: `<div class="anima" data-anima="schemes">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: scLive.toString(),
    helpers: DEN_HELPERS.concat([scSvg]),
    data: Object.assign({ SUM, NAME, MOVE, FRONT, TEETH, HOT, FORM, POSE }, D),
  };
}
