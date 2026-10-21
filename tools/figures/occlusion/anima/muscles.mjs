// Fig: muscles of mastication by movement (Occlusion L2, "The exam slide: muscles for each movement").
// A schematic side view of the skull and mandible, patient facing right (so this is the patient's RIGHT side), in two
// panels: superficial (temporalis in anterior, middle and posterior fibers; masseter superficial and deep bellies; the
// digastric with the hyoid and the infrahyoid strap) and deep, with the zygomatic arch removed and the ramus drawn
// see-through (lateral pterygoid superior and inferior heads, medial pterygoid). Pick a movement and the muscles on
// Dr. Givan's exam slide light up, with an arrow along each one's line of pull. Lateral moves need both sides, so a
// toggle mirrors the drawing to the patient's LEFT side. The lit sets are exactly the slide (the hub's L2 notes and
// cram line); the superior head of the lateral pterygoid shows as "also active" in closing, which the notes add.
// The anatomy is schematic: shapes and attachments follow the notes' origin -> insertion table, not a measured skull.
import { figureSvg, plateHtml, f1, esc, smooth } from "./shared.mjs";

const W = 380, H = 410;
const P = (pts) => "M" + pts.map((p) => `${f1(p[0])} ${f1(p[1])}`).join("L");
const lerp = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];

/* ---------- bones (patient facing right) ---------- */
const CRAN = [[40,196],[34,150],[44,104],[74,62],[124,32],[190,20],[254,30],[302,62],[328,104],[334,134],[328,150],[338,176],[340,196],[334,214],
  [336,236],[330,252],[300,256],[258,254],[238,240],[214,214],[176,206],[150,214],[128,248],[112,240],[90,226],[60,216]];
const ORBIT = smooth([[272,132],[294,124],[314,134],[318,156],[306,172],[284,174],[268,162]], true);
const ARCH = [[176,194],[214,188],[262,186],[288,180],[298,190],[290,204],[262,206],[214,206],[180,208]];
const MAND = [[150,206],[160,200],[170,208],[166,222],[178,236],[196,232],[212,208],[220,194],[228,206],[232,240],[240,262],[300,262],[326,264],[332,282],
  [330,308],[318,326],[262,330],[196,330],[166,328],[150,314],[148,282],[152,246],[154,222]];
const UTEETH = [], LTEETH = [];
for (let i = 0; i < 7; i++) { const x = 246 + i * 11; UTEETH.push(`<rect class="mu-tooth" x="${x}" y="${246 - (i > 4 ? 2 : 0)}" width="10" height="${12 + (i > 4 ? 2 : 0)}" rx="3"/>`); LTEETH.push(`<rect class="mu-tooth" x="${x + 3}" y="258" width="10" height="11" rx="3"/>`); }
const HYOID = smooth([[200,352],[214,346],[232,348],[236,354],[228,360],[210,360]], true);

/* ---------- muscles ---------- */
/* temporalis: a fan from the temporal lines down under the arch to the coronoid process */
const TLINE = [[84,128],[92,96],[120,66],[164,48],[210,46],[252,58],[284,86],[292,118]];
const COR = [218, 196];
function fanPart(i0, i1, n) {
  const top = TLINE.slice(i0, i1 + 1);
  const a = top[0], b = top[top.length - 1];
  /* the posterior fibers bend down over the ear, the anterior ones drop straight to the coronoid */
  const ka = [COR[0] - 8 + (i0 / 7) * 12, COR[1] - 4], kb = [COR[0] - 6 + (i1 / 7) * 14, COR[1]];
  const outline = smooth([...top, kb, ka], true);
  let fib = "";
  for (let j = 1; j < n; j++) { const u = j / n, t = lerp(a, b, u), k = lerp(ka, kb, u), mid = [t[0] * .45 + k[0] * .55 + (i0 < 3 ? 10 : 0), t[1] * .4 + k[1] * .6]; fib += `M${f1(t[0])} ${f1(t[1] + 6)}Q${f1(mid[0])} ${f1(mid[1])} ${f1(k[0])} ${f1(k[1] - 6)}`; }
  return { d: outline, fib };
}
const T_P = fanPart(0, 3, 5), T_M = fanPart(3, 5, 4), T_A = fanPart(5, 7, 4);

function quad(o0, o1, i1, i0, n) {
  let fib = "";
  for (let j = 1; j < n; j++) { const u = j / n, p = lerp(o0, o1, u), q = lerp(i0, i1, u), a = lerp(p, q, .08), b = lerp(p, q, .92); fib += `M${f1(a[0])} ${f1(a[1])}L${f1(b[0])} ${f1(b[1])}`; }
  return { d: smooth([o0, lerp(o0, o1, .5), o1, lerp(o1, i1, .5), i1, lerp(i1, i0, .5), i0, lerp(i0, o0, .5)], true), fib };
}
/* masseter: superficial from the anterior two thirds of the arch down and back to the angle; deep from the posterior arch
   straight down onto the upper ramus */
const M_S = quad([286,202], [214,204], [160,312], [222,326], 6);
const M_D = quad([214,204], [178,206], [166,262], [204,268], 4);
/* digastric: posterior belly from the mastoid notch to the intermediate tendon at the hyoid, anterior belly to the chin */
const DIG_P = quad([132,246], [126,252], [204,352], [210,346], 3);
const DIG_A = quad([236,348], [234,356], [300,334], [302,326], 3);
const INFRA = quad([206,360], [228,360], [234,404], [206,404], 3);
/* deep panel: pterygoids from the lateral pterygoid plate (behind the maxillary tuberosity) back to the joint and ramus */
const PLATE = smooth([[244,206],[256,204],[262,232],[262,262],[252,266],[246,240]], true);
const LP_S = quad([252,204], [250,214], [176,212], [172,204], 3);
const LP_I = quad([250,216], [256,240], [172,226], [168,216], 4);
const MP = quad([254,242], [258,262], [192,322], [160,310], 5);

/* line of pull: from the insertion toward the origin (a muscle only pulls) */
const PULL = {
  tA: [[226,170],[234,96]], tM: [[214,166],[196,90]], tP: [[202,170],[128,116]],
  mS: [[196,300],[244,220]], mD: [[188,256],[194,214]],
  lpS: [[186,206],[236,207]], lpI: [[184,222],[236,228]], mp: [[180,306],[236,262]],
  dig: [[268,338],[226,350]], infra: [[218,364],[218,396]],
};

const INFO = {
  tA: "Temporalis, anterior fibers: nearly vertical, so they elevate (close) the jaw. The temporalis inserts on the thin coronoid process: a fast positioner, not a power closer.",
  tM: "Temporalis, middle fibers: elevation with some retrusion.",
  tP: "Temporalis, posterior fibers: run almost horizontally back over the ear, so they retrude (pull the mandible back), with some elevation. On the exam slide: retrusion = posterior temporalis + deep masseter.",
  mS: "Masseter, superficial belly: from the zygomatic arch down and back to the angle. Elevation plus some protrusion (exam slide: protrusion = inferior lateral pterygoid + superficial masseter). Its pull up and forward seats the condyles.",
  mD: "Masseter, deep belly: from the back of the arch nearly straight down onto the ramus. Elevation plus retrusion (exam slide: retrusion = posterior temporalis + deep masseter). It starts closure from wide open.",
  lpS: "Lateral pterygoid, superior head: from the greater wing of the sphenoid and infratemporal crest to the capsule and disc. Relaxed when opening, active when closing, holding the disc in place. Not one of the slide's movers.",
  lpI: "Lateral pterygoid, inferior head: from the lateral pterygoid plate to the pterygoid fovea on the condylar neck. Pulls the condyle forward, down and medially: both sides = protrusion and opening; one side alone swings the chin to the OTHER side.",
  mp: "Medial pterygoid: from the medial surface of the lateral pterygoid plate down and back to the inside of the angle. An elevator; with the masseter outside it forms the pterygomasseteric sling. In a lateral move the opposite side's medial pterygoid helps.",
  dig: "Digastric (a suprahyoid): posterior belly from the mastoid notch, intermediate tendon on the hyoid, anterior belly to the chin. With the hyoid held still it pulls the mandible down: a key opener.",
  infra: "Infrahyoid muscles (sternohyoid, omohyoid, sternothyroid, thyrohyoid): they fix the hyoid \"like a rock\" so the suprahyoids can open the jaw.",
  hyoid: "Hyoid bone: floats, articulating with no other bone; every horn and fossa is a muscle attachment.",
};

const fibG = (k, part, cls = "") => `<g class="hot mu-m" tabindex="0" data-mus="${k}" data-info="${esc(INFO[k])}"><path class="mu-body ${cls}" d="${part.d}"/><path class="mu-fib" d="${part.fib}"/></g>`;
const pullG = (k) => { const [a, b] = PULL[k], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, h = 8;
  return `<g class="mu-pull" data-pull="${k}"><path d="M${f1(a[0])} ${f1(a[1])}L${f1(b[0] - ux * 4)} ${f1(b[1] - uy * 4)}"/><path class="mu-ph" d="M${f1(b[0])} ${f1(b[1])}L${f1(b[0] - ux * h - uy * h * .55)} ${f1(b[1] - uy * h + ux * h * .55)}L${f1(b[0] - ux * h + uy * h * .55)} ${f1(b[1] - uy * h - ux * h * .55)}Z"/></g>`; };

function bones(deep) {
  const mand = `<path class="mu-bone mu-mand${deep ? " mu-see" : ""}" d="${smooth(MAND, true)}"/>`;
  return `<path class="mu-bone" d="${smooth(CRAN, true)}"/><path class="mu-orbit" d="${ORBIT}"/>` +
    `<ellipse class="mu-eam" cx="140" cy="202" rx="7" ry="8"/><path class="mu-bone" d="${smooth([[120,236],[134,234],[136,256],[128,268],[120,252]], true)}"/>` +
    `<path class="mu-stylo" d="M144 226L170 270"/><circle class="mu-dot" cx="170" cy="270" r="1.6"/>` +
    UTEETH.join("") + (deep ? `<path class="mu-plate" d="${PLATE}"/>` : "") + mand + LTEETH.join("");
}
function panel(deep) {
  let s = bones(deep);
  if (!deep) {
    s += fibG("tP", T_P) + fibG("tM", T_M) + fibG("tA", T_A);
    s += `<path class="mu-bone" d="${smooth(ARCH, true)}"/>`;
    s += fibG("mD", M_D) + fibG("mS", M_S);
    s += `<g class="hot mu-m" tabindex="0" data-mus="hyoid" data-info="${esc(INFO.hyoid)}"><path class="mu-bone" d="${HYOID}"/></g>`;
    s += `<g class="hot mu-m" tabindex="0" data-mus="dig" data-info="${esc(INFO.dig)}"><path class="mu-body" d="${DIG_P.d}"/><path class="mu-fib" d="${DIG_P.fib}"/><path class="mu-body" d="${DIG_A.d}"/><path class="mu-fib" d="${DIG_A.fib}"/><path class="mu-tendon" d="M206 350Q218 356 236 352"/></g>`;
    s += fibG("infra", INFRA);
    s += ["tA", "tM", "tP", "mS", "mD", "dig", "infra"].map(pullG).join("");
  } else {
    s += `<path class="mu-cut" d="M176 194L180 208M286 182L292 204"/>`;
    s += fibG("mp", MP) + fibG("lpI", LP_I) + fibG("lpS", LP_S);
    /* the condyle and disc stay solid so the heads have something to insert on */
    s += `<path class="mu-bone" d="${smooth([[150,206],[160,199],[171,207],[168,222],[156,224]], true)}"/><path class="mu-disc" d="M148 202Q160 192 174 201"/>`;
    s += ["lpS", "lpI", "mp"].map(pullG).join("");
  }
  return s;
}
/* labels, placed per side (mirrored for the left side) */
const LAB = {
  sup: [["tP", 70, 96, "Temporalis"], ["tP", 70, 108, "posterior"], ["tA", 296, 58, "anterior"], ["tM", 196, 40, "middle"], ["mS", 254, 300, "Masseter, superficial"], ["mD", 104, 286, "deep", ],
    ["dig", 114, 334, "Digastric"], ["hyoid", 246, 368, "Hyoid"], ["infra", 244, 396, "Infrahyoids"]],
  deep: [["lpS", 218, 182, "LP superior head"], ["lpI", 264, 226, "LP inferior head"], ["mp", 262, 300, "Medial pterygoid"], ["none", 60, 340, "Arch removed,"], ["none", 60, 353, "ramus see-through"]],
};
function labels(which, mirror) {
  return LAB[which].map(([k, x, y, t]) => {
    const X = mirror ? W - x : x, end = (mirror ? x < W / 2 : x > W / 2) && k !== "none";
    return `<text class="mu-lab" data-lab="${k}" x="${X}" y="${y}"${end && !mirror ? "" : ""}${(mirror ? x > W / 2 : x < W / 2) ? "" : ""}>${t}</text>`;
  }).join("");
}
function svgFor(which, side) {
  const mirror = side === "l", body = panel(which === "deep");
  const art = mirror ? `<g transform="translate(${W} 0) scale(-1 1)">${body}</g>` : body;
  const face = mirror ? T2(14, 18, "← facing left") : T2(W - 14, 18, "facing right →", "end");
  const title = which === "deep" ? "DEEP" : "SUPERFICIAL";
  const lab = `<text class="mu-lab strong" x="${mirror ? W - 14 : 14}" y="18"${mirror ? ' text-anchor="end"' : ""}>${title} · ${mirror ? "LEFT" : "RIGHT"} SIDE</text>`;
  const label = which === "deep" ? `The patient's ${mirror ? "left" : "right"} side with the zygomatic arch removed and the ramus see-through: the lateral pterygoid's superior and inferior heads and the medial pterygoid.`
    : `The patient's ${mirror ? "left" : "right"} side of the skull and mandible: temporalis (anterior, middle and posterior fibers), masseter (superficial and deep bellies), the digastric, the hyoid and the infrahyoid muscles.`;
  return figureSvg({ width: W, height: H, className: `mu-svg mu-${which}`, label, body: art + lab + face + labels(which, mirror) });
}
function T2(x, y, t, anchor) { return `<text class="mu-lab mu-mut" x="${x}" y="${y}"${anchor ? ` text-anchor="${anchor}"` : ""}>${t}</text>`; }

const SIDE_BOX = (side) => `<div class="mu-pair" data-muside="${side}"${side === "l" ? " hidden" : ""}><div class="am-svg">${svgFor("sup", side)}</div><div class="am-svg">${svgFor("deep", side)}</div></div>`;
const plate = plateHtml({ fig: "Fig 4", title: "Muscles by movement", hint: "pick a movement", readout: "",
  body: SIDE_BOX("r") + SIDE_BOX("l") });

const MOVES = [["elev", "Elevation (close)"], ["dep", "Depression (open)"], ["pro", "Protrusion"], ["retro", "Retrusion"], ["right", "To the right"], ["left", "To the left"]];
const controls = `<div class="am-controls mu-moves" role="group" aria-label="Movement">${MOVES.map(([k, l]) => `<button type="button" class="am-btn" data-mumove="${k}" aria-pressed="false">${l}</button>`).join("")}</div>
<div class="am-controls" role="group" aria-label="Side shown"><button type="button" class="am-btn" data-muside-btn="r" aria-pressed="true">Patient's right side</button><button type="button" class="am-btn" data-muside-btn="l" aria-pressed="false">Patient's left side</button></div>
<div class="am-stats" aria-live="polite"><span><b>Exam slide</b> <em data-r="slide">pick a movement</em></span><span><b>Lit on this side</b> <em data-r="here">none</em></span></div>
<p class="am-summary" aria-live="polite">Pick a movement and the muscles on Dr. Givan's exam slide light up, each with an arrow along its line of pull. For a move to the right or left, look at both sides: the toggle flips the drawing to the patient's other side.</p>
<p class="am-info">Tap or hover any muscle for its origin, insertion and job.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>The lit sets are Dr. Givan's exam slide, as in the hub's L2 notes ("if I ask a question regarding what muscle is involved in what motion, it will come from this slide"): elevation = temporalis, medial pterygoid, masseter; depression = lateral pterygoid (inferior head) + suprahyoids and infrahyoids; protrusion = lateral pterygoid (inferior head) + superficial masseter; retrusion = temporalis (horizontal, posterior fibers) + deep masseter; to the right = right temporalis + right masseter, left lateral pterygoid + left medial pterygoid (to the left, swap sides). The slide doesn't say which head of the lateral pterygoid; the notes do: the inferior head moves the jaw, the superior head works in closing, steadying the disc (shown as "also active" for elevation).</li>
<li>The digastric stands in for the suprahyoid group (digastric, geniohyoid, mylohyoid, stylohyoid) and one strap for the infrahyoids. Origins and insertions follow the notes' table; the skull, the muscle shapes and the arrows are schematic, not measured.</li>
<li>The deep panel removes the zygomatic arch and draws the ramus see-through: the pterygoids lie on the inner side of the ramus.</li></ul></details>`;

function muLive(root, D) {
  var side = "r", move = null;
  var rs = {}; Array.prototype.forEach.call(root.querySelectorAll("[data-r]"), function (e) { rs[e.getAttribute("data-r")] = e; });
  var sum = root.querySelector(".am-summary"), infoEl = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]");
  function litFor(m, s) {
    var L = D.LIT[m]; if (!L) return { on: [], aux: [] };
    if (L.r) return { on: L[s], aux: [] };
    return { on: L.on, aux: L.aux || [] };
  }
  function draw() {
    var x = litFor(move, side), on = {}, aux = {};
    x.on.forEach(function (k) { on[k] = 1; }); x.aux.forEach(function (k) { aux[k] = 1; });
    var box = root.querySelector('[data-muside="' + side + '"]');
    Array.prototype.forEach.call(root.querySelectorAll("[data-muside]"), function (b) { b.hidden = b !== box; });
    Array.prototype.forEach.call(box.querySelectorAll("[data-mus]"), function (e) { var k = e.getAttribute("data-mus"); e.classList.toggle("is-on", !!on[k]); e.classList.toggle("is-aux", !!aux[k]); e.classList.toggle("is-dim", !!move && !on[k] && !aux[k] && k !== "hyoid"); });
    Array.prototype.forEach.call(box.querySelectorAll("[data-pull]"), function (e) { e.classList.toggle("is-on", !!on[e.getAttribute("data-pull")]); });
    Array.prototype.forEach.call(box.querySelectorAll("[data-lab]"), function (e) { var k = e.getAttribute("data-lab"); e.classList.toggle("is-on", !!on[k]); e.classList.toggle("is-dim", !!move && !on[k] && !aux[k] && k !== "none" && k !== "hyoid"); });
    root.querySelectorAll("[data-mumove]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-mumove") === move)); });
    root.querySelectorAll("[data-muside-btn]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-muside-btn") === side)); });
    var T = move ? D.TXT[move] : null;
    rs.slide.textContent = T ? T.slide : "pick a movement";
    rs.here.textContent = move ? (x.on.length ? x.on.map(function (k) { return D.NAME[k]; }).join(", ") : "nothing on this side") + (x.aux.length ? " (also active: " + x.aux.map(function (k) { return D.NAME[k]; }).join(", ") + ")" : "") : "none";
    if (readout) readout.textContent = move ? T.short + " · " + (side === "r" ? "right side" : "left side") : (side === "r" ? "right side" : "left side");
    var t = T ? (T.sides ? T.sum + " " + T.sides[side] : T.sum) : "Pick a movement and the muscles on Dr. Givan's exam slide light up, each with an arrow along its line of pull. For a move to the right or left, look at both sides: the toggle flips the drawing to the patient's other side.";
    if (sum.textContent !== t) sum.textContent = t;
  }
  root.querySelectorAll("[data-mumove]").forEach(function (b) { b.addEventListener("click", function () { move = b.getAttribute("data-mumove"); draw(); }); });
  root.querySelectorAll("[data-muside-btn]").forEach(function (b) { b.addEventListener("click", function () { side = b.getAttribute("data-muside-btn"); draw(); }); });
  Array.prototype.forEach.call(root.querySelectorAll(".hot"), function (el) {
    var on = function () { infoEl.textContent = el.getAttribute("data-info"); el.classList.add("is-hot"); };
    var off = function () { el.classList.remove("is-hot"); };
    el.addEventListener("pointerenter", on); el.addEventListener("pointerleave", off);
    el.addEventListener("focus", on); el.addEventListener("blur", off); el.addEventListener("click", on);
  });
  draw();
}

const T_ALL = ["tA", "tM", "tP"], M_ALL = ["mS", "mD"];
const D = {
  LIT: {
    elev: { on: [...T_ALL, ...M_ALL, "mp"], aux: ["lpS"] },
    dep: { on: ["lpI", "dig", "infra"] },
    pro: { on: ["lpI", "mS"] },
    retro: { on: ["tP", "mD"] },
    right: { r: [...T_ALL, ...M_ALL], l: ["lpI", "mp"] },
    left: { r: ["lpI", "mp"], l: [...T_ALL, ...M_ALL] },
  },
  NAME: { tA: "anterior temporalis", tM: "middle temporalis", tP: "posterior temporalis", mS: "superficial masseter", mD: "deep masseter",
    lpS: "lateral pterygoid, superior head", lpI: "lateral pterygoid, inferior head", mp: "medial pterygoid", dig: "digastric (suprahyoids)", infra: "infrahyoids" },
  TXT: {
    elev: { short: "elevation", slide: "temporalis, medial pterygoid, masseter",
      sum: "Elevation (closing): temporalis, masseter and medial pterygoid on both sides. The masseter and medial pterygoid sling the angle from outside and inside; the temporalis positions. The superior head of the lateral pterygoid is active too, steadying the disc as it returns, but it isn't on the slide." },
    dep: { short: "depression", slide: "lateral pterygoid (inferior head) + suprahyoids and infrahyoids",
      sum: "Depression (opening): the inferior heads of both lateral pterygoids pull the condyles forward and down, while the infrahyoids hold the hyoid still and the suprahyoids (the digastric here) pull the mandible down. The superior head stays relaxed when opening." },
    pro: { short: "protrusion", slide: "lateral pterygoid (inferior head) + superficial masseter",
      sum: "Protrusion: both inferior lateral pterygoids pull the condyles forward, and the superficial masseter, whose fibers run up and forward, helps. Know the head: inferior, not superior." },
    retro: { short: "retrusion", slide: "temporalis (horizontal, posterior fibers) + deep masseter",
      sum: "Retrusion: the posterior, nearly horizontal fibers of the temporalis pull the coronoid back, with the deep masseter. Retrusion is short, only about a millimeter from the seated position." },
    right: { short: "to the right", slide: "right temporalis + right masseter; left lateral pterygoid + left medial pterygoid",
      sum: "Moving the chin to the right:", sides: { r: "on the right (working) side the temporalis and masseter work. Flip to the left side to see the other half of the slide.", l: "on the left side the inferior lateral pterygoid pulls that condyle forward and medially (one side alone swings the chin to the OTHER side), helped by the left medial pterygoid." } },
    left: { short: "to the left", slide: "left temporalis + left masseter; right lateral pterygoid + right medial pterygoid",
      sum: "Moving the chin to the left:", sides: { r: "on the right side the inferior lateral pterygoid pulls that condyle forward and medially, swinging the chin to the left, helped by the right medial pterygoid.", l: "on the left (working) side the temporalis and masseter work. Flip to the right side to see the pterygoids." } },
  },
};

const CSS = `
.anima .mu-pair{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:6px 14px}
.anima .mu-pair[hidden]{display:none}
.anima .mu-svg .mu-bone{fill:var(--tm-bone);stroke:var(--anatomy-hi);stroke-width:1.2;stroke-linejoin:round}
.anima .mu-svg .mu-see{fill-opacity:.35;stroke-dasharray:4 3}
.anima .mu-svg .mu-orbit{fill:var(--anatomy-shade-0);stroke:var(--anatomy-hi);stroke-width:1}
.anima .mu-svg .mu-eam{fill:var(--tm-air);stroke:var(--anatomy-hi);stroke-width:1}
.anima .mu-svg .mu-stylo{fill:none;stroke:var(--anatomy-hi);stroke-width:1.6;stroke-linecap:round}
.anima .mu-svg .mu-dot{fill:var(--anatomy-hi)}
.anima .mu-svg .mu-tooth{fill:#f6efe0;stroke:#8b7653;stroke-width:.9}
.anima .mu-svg .mu-plate{fill:var(--tm-bone-in);stroke:var(--anatomy-hi);stroke-width:1}
.anima .mu-svg .mu-disc{fill:none;stroke:var(--tm-disc);stroke-width:4;stroke-linecap:round}
.anima .mu-svg .mu-cut{fill:none;stroke:var(--anatomy-mid);stroke-width:1.4;stroke-linecap:round}
.anima .mu-svg .mu-body{fill:var(--tm-muscle);stroke:var(--tm-muscle-fib);stroke-width:1;fill-opacity:.92;transition:fill .2s,opacity .2s}
.anima .mu-svg .mu-fib{fill:none;stroke:var(--tm-muscle-fib);stroke-width:.8;opacity:.75;stroke-linecap:round}
.anima .mu-svg .mu-tendon{fill:none;stroke:var(--anatomy-text);stroke-width:2.4;stroke-linecap:round}
.anima .mu-svg .mu-m{transition:opacity .2s}
.anima .mu-svg .mu-m.is-dim{opacity:.32}
.anima .mu-svg .mu-m.is-on .mu-body{fill:#e05a4e;stroke:var(--anatomy-lit);stroke-width:2}
.anima .mu-svg .mu-m.is-aux .mu-body{stroke:var(--anatomy-lit);stroke-width:1.6;stroke-dasharray:4 3}
.anima .mu-svg .mu-pull{opacity:0;transition:opacity .2s;pointer-events:none}
.anima .mu-svg .mu-pull.is-on{opacity:1}
.anima .mu-svg .mu-pull path{fill:none;stroke:var(--anatomy-lit);stroke-width:2.6;stroke-linecap:round}
.anima .mu-svg .mu-pull .mu-ph{fill:var(--anatomy-lit);stroke:none}
.anima .mu-svg .mu-lab{fill:var(--anatomy-text);font:11px var(--anatomy-mono);paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round;transition:opacity .2s}
.anima .mu-svg .mu-lab.strong{fill:var(--anatomy-strong);font-weight:600}
.anima .mu-svg .mu-lab.mu-mut{fill:var(--anatomy-muted)}
.anima .mu-svg .mu-lab.is-on{fill:var(--anatomy-strong);font-weight:700}
.anima .mu-svg .mu-lab.is-dim{opacity:.4}
.anima .mu-moves .am-btn{white-space:nowrap}
@media (prefers-reduced-motion:reduce){.anima .mu-svg .mu-m,.anima .mu-svg .mu-pull,.anima .mu-svg .mu-body{transition:none}}
`;

export function muscles() {
  return {
    id: "muscles", lec: "anatomy",
    title: "Muscles of mastication by movement",
    caption: "Pick elevation, depression, protrusion, retrusion or a move to either side and the muscles on Dr. Givan's exam slide light up, each with its line of pull; flip sides for the lateral moves.",
    html: `<div class="anima" data-anima="muscles">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: muLive.toString(),
    helpers: [],
    data: D,
  };
}
