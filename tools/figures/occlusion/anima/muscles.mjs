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

const W = 380, H = 420;
const P = (pts) => "M" + pts.map((p) => `${f1(p[0])} ${f1(p[1])}`).join("L");
const lerp = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];

/* ---------- bones (patient facing right) ---------- */
const CRAN = [[44,214],[30,170],[36,120],[62,78],[110,42],[170,24],[230,26],[278,46],[310,78],[324,108],[322,128],[334,150],[332,162],[324,172],
  [330,190],[342,204],[336,214],[338,236],[320,241],[280,241],[244,241],[234,232],[220,222],[196,216],[176,214],[150,216],[136,236],[110,236],[80,228]];
const ORBIT = smooth([[268,140],[280,126],[298,124],[310,138],[308,158],[294,168],[276,166],[266,154]], true);
/* zygomatic bone and arch: drawn over the temporalis, which passes under it to the coronoid */
const ARCH = [[172,193],[200,189],[240,187],[262,180],[280,170],[300,172],[308,186],[296,202],[266,206],[232,205],[200,205],[174,207]];
const MAND = [[150,212],[152,203],[161,197],[171,201],[172,211],[169,222],[180,232],[194,229],[205,212],[211,196],[217,200],[221,222],[226,246],[236,261],
  [250,266],[290,266],[326,265],[334,282],[334,304],[326,324],[312,334],[264,336],[214,332],[190,326],[172,322],[162,310],[158,286],[158,252],[158,230],[154,220]];
const CONDYLE = [[150,212],[152,203],[161,197],[171,201],[172,211],[169,222],[156,222]];
const MASTOID = [[120,228],[136,226],[140,248],[132,262],[124,248]];
const UTEETH = [], LTEETH = [];
{ const TW = [13, 13, 10, 10, 9, 8, 8]; let x = 245;
  TW.forEach((w, i) => { UTEETH.push(`<rect class="mu-tooth" x="${x + (i > 4 ? 2 : 0)}" y="240" width="${w}" height="${i > 3 ? 14 : 12}" rx="3"/>`); LTEETH.push(`<rect class="mu-tooth" x="${x}" y="253" width="${w}" height="${i > 3 ? 13 : 12}" rx="3"/>`); x += w + 1; }); }
const HYOID = smooth([[204,368],[216,363],[230,365],[232,372],[222,377],[206,376]], true);

/* ---------- muscles ---------- */
/* temporalis: a fan from the temporal line (stopping behind the orbit) down under the arch to the coronoid process */
const TLINE = [[80,166],[84,124],[106,84],[146,58],[196,50],[236,60],[256,86],[260,122]];
const COR = [212, 196];
function fanPart(i0, i1, n) {
  const top = TLINE.slice(i0, i1 + 1);
  const a = top[0], b = top[top.length - 1];
  const ka = [COR[0] - 9 + (i0 / 7) * 14, COR[1] - 3], kb = [COR[0] - 7 + (i1 / 7) * 16, COR[1] + 1];
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
/* masseter: superficial from the zygomatic process and the front of the arch down and back to the angle; deep from
   the back of the arch nearly straight down onto the upper ramus */
const M_S = quad([258,205], [210,205], [174,320], [238,331], 6);
const M_D = quad([212,204], [176,206], [178,262], [210,270], 4);
/* digastric: posterior belly from the mastoid notch to the intermediate tendon at the hyoid, anterior belly to the chin */
/* the posterior belly bows back behind the angle of the mandible (it runs medial to it) */
const DIG_P = { d: smooth([[131,246],[138,302],[166,348],[204,374],[208,366],[174,338],[150,296],[142,242]], true),
  fib: `M136 254Q146 318 204 370M139 250Q152 314 206 368` };
const DIG_A = quad([230,366], [230,374], [312,338], [310,330], 3);
const INFRA = quad([206,378], [230,378], [232,418], [204,418], 3);
/* deep panel: pterygoids from the lateral pterygoid plate (behind the maxillary tuberosity) back to the joint and ramus */
const PLATE = smooth([[226,206],[236,204],[244,232],[244,262],[236,266],[230,240]], true);
const LP_S = quad([232,199], [230,209], [173,209], [171,201], 3);
const LP_I = quad([234,212], [240,238], [172,226], [170,215], 4);
const MP = quad([238,240], [244,262], [186,326], [164,312], 5);

/* line of pull: from the insertion toward the origin (a muscle only pulls) */
const PULL = {
  tA: [[220,180],[248,124]], tM: [[208,178],[196,86]], tP: [[198,180],[116,130]],
  mS: [[200,308],[238,222]], mD: [[192,258],[194,218]],
  lpS: [[182,205],[224,204]], lpI: [[182,222],[228,228]], mp: [[182,312],[234,258]],
  dig: [[298,342],[244,364]], infra: [[218,382],[218,412]],
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
    `<ellipse class="mu-eam" cx="139" cy="207" rx="6" ry="7"/><path class="mu-bone" d="${smooth(MASTOID, true)}"/>` +
    UTEETH.join("") + (deep ? `<path class="mu-plate" d="${PLATE}"/>` : "") + mand + LTEETH.join("");
}
function panel(deep) {
  let s = bones(deep);
  if (!deep) {
    s += fibG("tP", T_P) + fibG("tM", T_M) + fibG("tA", T_A);
    s += `<path class="mu-bone" d="${smooth(ARCH, true)}"/>`;
    s += fibG("mD", M_D) + fibG("mS", M_S);
    s += `<g class="hot mu-m" tabindex="0" data-mus="hyoid" data-info="${esc(INFO.hyoid)}"><path class="mu-bone" d="${HYOID}"/></g>`;
    s += `<g class="hot mu-m" tabindex="0" data-mus="dig" data-info="${esc(INFO.dig)}"><path class="mu-body" d="${DIG_P.d}"/><path class="mu-fib" d="${DIG_P.fib}"/><path class="mu-body" d="${DIG_A.d}"/><path class="mu-fib" d="${DIG_A.fib}"/><path class="mu-tendon" d="M202 370Q218 376 234 370"/></g>`;
    s += fibG("infra", INFRA);
    s += ["tA", "tM", "tP", "mS", "mD", "dig", "infra"].map(pullG).join("");
  } else {
    /* where the zygomatic arch was, before it was cut away */
    s += `<path class="mu-ghost" d="${smooth(ARCH, true)}"/>`;
    s += fibG("mp", MP) + fibG("lpI", LP_I) + fibG("lpS", LP_S);
    /* the condyle and disc stay solid so the heads have something to insert on */
    s += `<path class="mu-bone" d="${smooth(CONDYLE, true)}"/><path class="mu-disc" d="M148 201Q160 190 175 200"/>`;
    s += ["lpS", "lpI", "mp"].map(pullG).join("");
  }
  return s;
}
/* labels: [muscle key, text, x, y, anchor, point on the part (leader + dot) or null]; mirrored for the left side */
const LAB = {
  sup: [["tP", "posterior", 136, 118, "middle"], ["tM", "middle", 192, 100, "middle"], ["tA", "anterior", 236, 112, "middle"],
    ["tM", "TEMPORALIS", 176, 42, "middle"],
    ["mS", "Masseter,", 218, 272, "middle"], ["mS", "superficial", 218, 285, "middle"],
    ["mD", "Masseter, deep", 14, 300, "start", [186, 236]],
    ["dig", "Digastric", 14, 352, "start", [150, 316]],
    ["hyoid", "Hyoid", 262, 392, "start", [228, 372]],
    ["infra", "Infrahyoids", 252, 410, "start", [230, 404]]],
  deep: [["lpS", "Lateral pterygoid:", 120, 130, "start"], ["lpS", "superior head", 120, 150, "start", [212, 203]],
    ["lpI", "inferior head", 120, 168, "start", [200, 222]],
    ["mp", "Medial pterygoid", 232, 384, "start", [206, 294]],
    ["none", "Arch removed (dashed),", 14, 384, "start"], ["none", "ramus see-through", 14, 397, "start"]],
};
function labels(which, mirror) {
  return LAB[which].map(([k, t, x, y, anchor, pt]) => {
    const X = mirror ? W - x : x, a = mirror ? ({ start: "end", end: "start" }[anchor] || anchor) : anchor;
    let lead = "";
    if (pt) {
      const px = mirror ? W - pt[0] : pt[0], sx = a === "end" ? X + 3 : a === "start" ? X - 3 : X;
      /* leaders leave the label from its near end */
      const tx = a === "start" ? X + t.length * 6.6 + 3 : a === "end" ? X - t.length * 6.6 - 3 : X;
      const near = Math.abs(px - sx) < Math.abs(px - tx) ? sx : tx;
      lead = `<path class="mu-lead" data-lab="${k}" d="M${f1(near)} ${f1(y - 4)}L${f1(px)} ${f1(pt[1])}"/><circle class="mu-ldot" data-lab="${k}" cx="${f1(px)}" cy="${f1(pt[1])}" r="2"/>`;
    }
    return lead + `<text class="mu-lab${k === "none" ? " mu-mut" : ""}" data-lab="${k}" x="${f1(X)}" y="${y}" text-anchor="${a}">${t}</text>`;
  }).join("");
}
const DEEP_TOP = 100, DEEP_BOTTOM = 406, BAND = 30;
function svgFor(which, side) {
  const mirror = side === "l", body = panel(which === "deep");
  const art = mirror ? `<g transform="translate(${W} 0) scale(-1 1)">${body}</g>` : body;
  const face = mirror ? T2(14, 18, "← facing left") : T2(W - 14, 18, "facing right →", "end");
  const title = which === "deep" ? "DEEP" : "SUPERFICIAL";
  const lab = `<text class="mu-lab strong" x="${mirror ? W - 14 : 14}" y="18"${mirror ? ' text-anchor="end"' : ""}>${title} · ${mirror ? "LEFT" : "RIGHT"} SIDE</text>`;
  const label = which === "deep" ? `The patient's ${mirror ? "left" : "right"} side with the zygomatic arch removed and the ramus see-through: the lateral pterygoid's superior and inferior heads and the medial pterygoid.`
    : `The patient's ${mirror ? "left" : "right"} side of the skull and mandible: temporalis (anterior, middle and posterior fibers), masseter (superficial and deep bellies), the digastric, the hyoid and the infrahyoid muscles.`;
  /* the deep panel has nothing above the infratemporal fossa, so it is cropped to the jaw (keeps the buttons near the
     drawing when the panels stack) */
  const top = which === "deep" ? DEEP_TOP : 0, h = which === "deep" ? DEEP_BOTTOM - DEEP_TOP + BAND : H;
  const shifted = top ? `<g transform="translate(0 ${BAND - top})">${art + labels(which, mirror)}</g><rect class="mu-band" x="0" y="0" width="${W}" height="${BAND}"/><path class="mu-cutline" d="M0 ${BAND}H${W}"/>` : art + labels(which, mirror);
  return figureSvg({ width: W, height: h, className: `mu-svg mu-${which}`, label, body: shifted + lab + face });
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
    lpS: "lateral pterygoid (superior head)", lpI: "lateral pterygoid (inferior head)", mp: "medial pterygoid", dig: "digastric (suprahyoids)", infra: "infrahyoids" },
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
.anima .mu-svg .mu-lead{fill:none;stroke:var(--anatomy-mid);stroke-width:.8;transition:opacity .2s}
.anima .mu-svg .mu-ldot{fill:var(--anatomy-dot);transition:opacity .2s}
.anima .mu-svg .mu-lead.is-dim,.anima .mu-svg .mu-ldot.is-dim{opacity:.4}
.anima .mu-svg .mu-tooth{fill:#f6efe0;stroke:#8b7653;stroke-width:.9}
.anima .mu-svg .mu-plate{fill:var(--tm-bone-in);stroke:var(--anatomy-hi);stroke-width:1}
.anima .mu-svg .mu-disc{fill:none;stroke:var(--tm-disc);stroke-width:4;stroke-linecap:round}
.anima .mu-svg .mu-band{fill:var(--surface)}
.anima .mu-svg .mu-cutline{stroke:var(--line);stroke-width:1;stroke-dasharray:2 4}
.anima .mu-svg .mu-ghost{fill:none;stroke:var(--anatomy-mid);stroke-width:1;stroke-dasharray:3 3}
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
