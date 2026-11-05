// Fig 23: posterior tooth forms (Occlusion L8, "Tooth forms compared"). Four upper and lower molar pairs seen from the
// front, buccal at the left, set cusp to fossa in a denture base: anatomic (30 degree cusps; the notes: 30 or more),
// semi-anatomic (drawn at 20 degrees; the notes: about 12-20 depending on the mold), non-anatomic or flat (0 degrees) and
// lingualized (a long upper lingual cusp in a wide, shallow fossa: the notes' "flat plane or wide fossa", mortar and
// pestle). "Slide sideways" moves each lower tooth 1.5 mm buccally while it stays in contact: cusped teeth ride over
// each other and the contact force, square to the sloping surfaces in contact, pushes the denture sideways (more the
// steeper the cusps); flat teeth glide and the force stays straight down (the notes: least lateral force, so stability
// is easiest). The profiles are l8den.mjs's, shared with Fig 22. Content from the L8 notes only (the 11/5 recording);
// the force direction is the plain mechanics of two surfaces in contact. Schematic, not traced from a mold chart.
import { figureSvg, plateHtml } from "./shared.mjs";
import { DEN } from "./l8den.mjs";

const PW = 140, PH = 250, S = 8, X0 = 22, YO = 122, SLIDE = 1.5, STEPS = 20;
const FORMS = ["anat", "semi", "flat", "ling"];
const NAME = { anat: "Anatomic", semi: "Semi-anatomic", flat: "Flat", ling: "Lingualized" };
const SUB = { anat: "30° or more", semi: "about 12-20°", flat: "0°", ling: "long lingual cusp" };
const SCHEME = { anat: "balanced", semi: "balanced or not", flat: "non-balanced", ling: "balanced or not" };
const HOT = {
  anat: "Anatomic, 30° or more: sulci and ridges, they look like teeth. For balanced occlusion (the anterior teeth may touch in protrusion). For it: the best esthetics, may chew slightly better. Against it: a semi-adjustable articulator programmed with a facebow and a protrusive record, more skill, and harder with abnormal jaw relations.",
  semi: "Semi-anatomic, lower cusps (about 12-20° depending on the mold). Balanced or not, with lower lateral forces: easier stability, and they can still be set in balance. Not quite as esthetic.",
  flat: "Non-anatomic (flat), 0°. Non-balanced. The least lateral force, so stability is easiest; any jaw relation (Class I, II, III) and crossbite, simpler to adjust, good for poor neuromuscular control, fewer complications. Less esthetic, and they penetrate food less, but that's clinically acceptable.",
  ling: "Lingualized: a semi-anatomic upper tooth with an elongated lingual cusp against a flat plane or a wide fossa on the lower tooth, a little like a mortar and pestle. Much easier to arrange, set balanced or non-balanced: most likely the scheme for many of your dentures.",
};
const SUM = {
  close: "Four posterior tooth forms: an upper and a lower molar seen from the front, buccal at the left, cusp in fossa. Anatomic teeth have cusps of 30° or more, semi-anatomic about 12-20° depending on the mold, and flat (non-anatomic) teeth 0°. Lingualized teeth are semi-anatomic with a long upper lingual cusp that sits on a flat plane or in a wide fossa of the lower tooth, a little like a mortar and pestle. Slide them sideways to compare.",
  slide: "Sliding sideways, cusps have to ride over cusps. The force between the teeth acts square to the sloping surfaces in contact, so part of it pushes the denture sideways, more the steeper the cusps. Flat teeth just glide and the force stays straight down: the least lateral force, so stability is easiest. Steeper cusps look best and may chew slightly better; flat teeth suit any jaw relation and are simpler to adjust.",
};

/* the occlusal outlines (mm; upper in its own u, lower shifted 2.5 mm lingual for cusp in fossa, then slid) */
const occU = (k) => DEN.PROF[k].up.map(([u, y]) => [u, y]);
const occL = (k, off) => DEN.PROF[k].lo.map(([u, y]) => [u + 2.5 + off, y]);
function yAt(poly, x) { for (let i = 1; i < poly.length; i++) if (x >= poly[i - 1][0] && x <= poly[i][0]) { const t = (x - poly[i - 1][0]) / ((poly[i][0] - poly[i - 1][0]) || 1); return poly[i - 1][1] + t * (poly[i][1] - poly[i - 1][1]); } return null; }
/* keep the lower tooth in contact: the vertical offset that closes the smallest gap */
function contactDy(k, off) { const U = occU(k), L = occL(k, off); let min = 1e9; for (let i = 0; i <= 400; i++) { const x = i / 40; const yu = yAt(U, x), yl = yAt(L, x); if (yu != null && yl != null) min = Math.min(min, yu - yl); } return min; }
const r3 = (v) => Math.round(v * 1000) / 1000;
const DY = {}, PUSH = {};
for (const k of FORMS) {
  DY[k] = Array.from({ length: STEPS + 1 }, (_, i) => r3(contactDy(k, -SLIDE * i / STEPS)));
  /* after the slide: where the teeth touch, and the force on the lower tooth (unit, square to its surface there) */
  const off = -SLIDE, dy = DY[k][STEPS], U = occU(k), L = occL(k, off).map(([x, y]) => [x, y + dy]), xs = [];
  for (let i = 0; i <= 1000; i++) { const x = i / 100, yu = yAt(U, x), yl = yAt(L, x); if (yu != null && yl != null && yu - yl < 0.005) xs.push(x); }
  /* the contact on the lingual half when there are two (the one the lingual cusp makes); flat teeth: the middle */
  const lingual = xs.filter((x) => x > 5), pick = k === "flat" ? xs.filter((x) => x > 4.5 && x < 5.5) : (lingual.length ? lingual : xs);
  const cx = pick[Math.floor(pick.length / 2)], cy = yAt(U, cx);
  let seg = 1; while (seg < L.length - 1 && L[seg][0] < cx) seg++;
  const ax = L[seg][0] - L[seg - 1][0], ay = L[seg][1] - L[seg - 1][1], n = Math.hypot(ax, ay);
  PUSH[k] = { x: r3(cx), y: r3(cy), nx: r3(ay / n), ny: r3(-ax / n) };
}

function tfPanel(k, s, D) {
  var f = function (n) { return Math.round(n * 10) / 10; }, o = "", off = -D.SLIDE * s, i = Math.min(D.STEPS - 1, Math.floor(s * D.STEPS)), t = s * D.STEPS - i;
  var dy = D.DY[k][i] + (D.DY[k][i + 1] - D.DY[k][i]) * t, P = D.PROF[k];
  function X(x) { return D.X0 + x * D.S; } function Y(y) { return D.YO - y * D.S; }
  function path(pts, closed) { return "M" + pts.map(function (p) { return f(X(p[0])) + " " + f(Y(p[1])); }).join("L") + (closed ? "Z" : ""); }
  function tx(x, y, s2, cls) { return '<text class="tf-t' + (cls ? " " + cls : "") + '" x="' + f(x) + '" y="' + f(y) + '" text-anchor="middle">' + s2 + "</text>"; }
  function crown(prof, z, dx, dy2) { return [[0.8, 7.2 * z], [0.1, 3.2 * z]].concat(prof, [[9.9, 3.2 * z], [9.2, 7.2 * z]]).map(function (p) { return [p[0] + dx, p[1] + dy2]; }); }
  o += '<g class="hot" data-info="' + D.HOT[k] + '"><rect class="tf-hit" x="2" y="2" width="' + (D.PW - 4) + '" height="' + (D.PH - 4) + '" rx="10"/>';
  o += tx(D.PW / 2, 18, D.NAME[k], "tf-name") + tx(D.PW / 2, 33, D.SUB[k], "tf-sub");
  /* upper tooth in its base; lower tooth in its base, slid */
  var lx = 2.5 + off;
  o += '<path class="tf-tooth" d="' + path(crown(P.up, 1, 0, 0), true) + '"/><path class="tf-base" d="' + path([[-0.6, 6], [10.6, 6], [11, 8.6], [-1, 8.6]], true) + '"/>';
  o += '<path class="tf-tooth" d="' + path(crown(P.lo, -1, lx, dy), true) + '"/><path class="tf-base" d="' + path([[-0.6 + lx, -6 + dy], [10.6 + lx, -6 + dy], [11 + lx, -8.6 + dy], [-1 + lx, -8.6 + dy]], true) + '"/>';
  /* the cusp angle, on the lower lingual cusp's buccal incline */
  if ((k === "anat" || k === "semi") && s < 0.02) {
    var cx = 5 + lx, cy = dy, a = Math.atan2(P.h, 2.5), r = 3.4;
    o += '<path class="tf-ref" d="M' + f(X(cx)) + " " + f(Y(cy)) + "L" + f(X(cx + 4.6)) + " " + f(Y(cy)) + '"/>';
    o += '<path class="tf-arc" d="M' + f(X(cx + r)) + " " + f(Y(cy)) + "A" + f(r * D.S) + " " + f(r * D.S) + " 0 0 0 " + f(X(cx + r * Math.cos(a))) + " " + f(Y(cy + r * Math.sin(a))) + '"/>';
    o += '<text class="tf-t tf-ang" x="' + f(X(cx + 3.2)) + '" y="' + f(Y(cy - 1.6)) + '" text-anchor="middle">' + Math.round(a * 180 / Math.PI) + "°</text>";
  }
  if (k === "flat") o += '<path class="tf-ref" d="M' + f(X(lx + 1)) + " " + f(Y(dy - 0.02)) + "L" + f(X(lx + 9)) + " " + f(Y(dy - 0.02)) + '"/>';
  /* lingualized: the pestle (the long upper lingual cusp) and the mortar (the lower fossa) */
  if (k === "ling") {
    o += '<path class="tf-mark" d="' + path(P.up.slice(2, 5), false) + '"/>';
    o += '<path class="tf-mark tf-mortar" d="' + path(P.lo.slice(2, 5).map(function (p) { return [p[0] + lx, p[1] + dy]; }), false) + '"/>';
  }
  /* the push on the lower denture once it has slid */
  if (s > 0.98) {
    var q = D.PUSH[k], L = 4.6, x1 = X(q.x), y1 = Y(q.y), x2 = X(q.x + q.nx * L), y2 = Y(q.y + q.ny * L), ux = (x2 - x1) / (L * D.S), uy = (y2 - y1) / (L * D.S);
    o += '<circle class="tf-hitdot" cx="' + f(x1) + '" cy="' + f(y1) + '" r="2.6"/>';
    o += '<path class="tf-force" d="M' + f(x1) + " " + f(y1) + "L" + f(x2) + " " + f(y2) + "M" + f(x2 - ux * 7 - uy * 4.5) + " " + f(y2 - uy * 7 + ux * 4.5) + "L" + f(x2) + " " + f(y2) + "L" + f(x2 - ux * 7 + uy * 4.5) + " " + f(y2 - uy * 7 - ux * 4.5) + '"/>';
    /* its sideways part, under the lower base */
    var side = q.nx * L * D.S, by = Y(dy - 8.6) + 10;
    if (Math.abs(side) > 2) { var bx = X(lx + 5) - side / 2, ex = bx + side, sg = side > 0 ? 1 : -1;
      o += '<path class="tf-side" d="M' + f(bx) + " " + f(by) + "L" + f(ex) + " " + f(by) + "M" + f(ex - sg * 6) + " " + f(by - 4) + "L" + f(ex) + " " + f(by) + "L" + f(ex - sg * 6) + " " + f(by + 4) + '"/>'; }
    o += tx(D.PW / 2, 226, Math.abs(side) > 2 ? "pushed sideways" : "straight down", Math.abs(side) > 2 ? "tf-bad" : "tf-good");
  }
  o += tx(D.PW / 2, 242, D.SCHEME[k], "tf-sub") + "</g>";
  return o;
}

const DATA = { PW, PH, S, X0, YO, SLIDE, STEPS, PROF: DEN.PROF, NAME, SUB, SCHEME, HOT, SUM, DY, PUSH };
const svgs = FORMS.map((k) => figureSvg({ width: PW, height: PH, className: "tf-svg", label: `${NAME[k]} posterior denture teeth, ${SUB[k]}, an upper and a lower molar seen from the front, for ${SCHEME[k]} occlusion.`, body: tfPanel(k, 0, Object.assign({ tfPanel }, DATA)) }).replace("<svg", `<svg data-tf="${k}"`)).join("");
const plate = plateHtml({ fig: "Fig 23", title: "Posterior tooth forms", hint: "slide them sideways", readout: "closed", body: `<div class="am-svg tf-box">${svgs}</div>` });
const controls = `<div class="am-controls" role="group" aria-label="Movement"><button type="button" class="am-btn" data-tfm="close" aria-pressed="true">Closed</button><button type="button" class="am-btn" data-tfm="slide" aria-pressed="false">Slide sideways</button></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Hover or tap a tooth form.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From the L8 notes (Dr. Givan, the 11/5 recording): anatomic teeth 30° or more, semi-anatomic about 12-20° depending on the mold (lingualized teeth belong here), non-anatomic (flat) 0°; the scheme each suits; flat teeth have the least lateral force, so stability is easiest; lingualized teeth have an elongated maxillary lingual cusp against a flat plane or a wide fossa, like a mortar and pestle.</li>
<li>The arrow is the contact force on the lower tooth, square to the surfaces in contact (plain mechanics, friction left out); the arrow under the base is its sideways part. Semi-anatomic teeth are drawn at 20°. The slide is 1.5 mm with the teeth kept in contact.</li>
<li>Schematic outlines, not traced from a manufacturer's mold. Educational, not clinical guidance.</li></ul></details>`;

function tfLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var svgs = root.querySelectorAll("[data-tf]"), sum = root.querySelector(".am-summary"), info = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]");
  var st = { m: "close", s: 0 }, raf = 0;
  function draw() { svgs.forEach(function (svg) { svg.innerHTML = D.tfPanel(svg.getAttribute("data-tf"), st.s, D); }); }
  function text() { sum.textContent = D.SUM[st.m]; if (readout) readout.textContent = st.m === "slide" ? "slid 1.5 mm" : "closed"; }
  function go() {
    cancelAnimationFrame(raf); text();
    var from = st.s, to = st.m === "slide" ? 1 : 0;
    if (reduce.matches || from === to) { st.s = to; draw(); return; }
    var t0 = performance.now();
    function step(now) { var k = Math.min(1, (now - t0) / 800), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; st.s = from + (to - from) * e; draw(); if (k < 1) raf = requestAnimationFrame(step); }
    raf = requestAnimationFrame(step);
  }
  root.querySelectorAll("[data-tfm]").forEach(function (b) { b.addEventListener("click", function () { st.m = b.getAttribute("data-tfm"); root.querySelectorAll("[data-tfm]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); go(); }); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && root.contains(el)) info.textContent = el.getAttribute("data-info"); }
  root.querySelector(".tf-box").addEventListener("pointerover", hot); root.querySelector(".tf-box").addEventListener("click", hot);
  text(); draw();
}

const CSS = `
.anima .tf-box{max-width:620px;margin:0 auto;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px 8px}
@media (max-width:560px){.anima .tf-box{grid-template-columns:repeat(2,minmax(0,1fr));max-width:360px}}
.anima .am-svg.tf-box svg.tf-svg{width:100%;height:auto}
.anima .tf-svg .tf-t{fill:var(--anatomy-text);font:10.5px var(--anatomy-mono)}
.anima .tf-svg .tf-name{fill:var(--anatomy-strong);font-weight:700;font-size:12px}
.anima .tf-svg .tf-sub{fill:var(--anatomy-muted)}
.anima .tf-svg .tf-good{fill:#2f8a5b;font-weight:700}
.anima .tf-svg .tf-bad{fill:var(--tm-vessel);font-weight:700}
.anima .tf-svg .tf-hit{fill:transparent;stroke:var(--line);stroke-width:1}
.anima .tf-svg .hot:hover .tf-hit{stroke:var(--anatomy-mid)}
.anima .tf-svg .tf-tooth{fill:var(--anatomy-face);stroke:var(--anatomy-hi);stroke-width:1.2;stroke-linejoin:round}
.anima .tf-svg .tf-base{fill:var(--dn-base);stroke:var(--dn-base-edge);stroke-width:1;stroke-linejoin:round}
.anima .tf-svg .tf-ref{fill:none;stroke:var(--anatomy-muted);stroke-width:1;stroke-dasharray:3 3}
.anima .tf-svg .tf-ang{fill:var(--anatomy-lit);font-weight:700}
.anima .tf-svg .tf-arc{fill:none;stroke:var(--anatomy-lit);stroke-width:1.6}
.anima .tf-svg .tf-mark{fill:none;stroke:var(--anatomy-lit);stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-opacity:.85}
.anima .tf-svg .tf-mortar{stroke:#2f8a5b}
.anima .tf-svg .tf-hitdot{fill:#2f8a5b;stroke:var(--surface);stroke-width:1}
.anima .tf-svg .tf-force{fill:none;stroke:var(--tm-vessel);stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
.anima .tf-svg .tf-side{fill:none;stroke:var(--tm-vessel);stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:4 3}
.anima .tf-svg{--dn-base:#efb7b8;--dn-base-edge:#b8646a}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]) .anima .tf-svg{--dn-base:#8c4d55;--dn-base-edge:#d48b90} }
:root[data-theme="dark"] .anima .tf-svg{--dn-base:#8c4d55;--dn-base-edge:#d48b90}
`;

export function toothforms() {
  return {
    id: "toothforms", lec: "dentures",
    title: "Posterior tooth forms",
    caption: "Anatomic, semi-anatomic, flat and lingualized denture teeth side by side. Slide them sideways and see which ones push the denture sideways.",
    html: `<div class="anima" data-anima="toothforms">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: tfLive.toString(),
    helpers: [tfPanel],
    data: DATA,
  };
}
