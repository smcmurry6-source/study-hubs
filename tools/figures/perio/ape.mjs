// Fig: altered passive eruption (Periodontology S9, from Dr. Abou-Arraj's slides and the exam-review guide; the live
// class that covers it isn't posted yet). A labiolingual section through a maxillary central incisor, crown down, drawn
// to one scale (13 px = 1 mm). Coslet's two axes, as the notes give them:
//   Type 1: a wider gingival dimension (free gingival margin to MGJ), the MGJ apical to the alveolar crest;
//   Type 2: a normal dimension, the MGJ at the level of the CEJ;
//   Subcategory A: more than 1 mm between the CEJ and the osseous crest; B: the crest in close proximity to the CEJ.
// In every type the gingival margin sits on the enamel, so the clinical crown is shorter than the anatomical crown.
// After treatment (crown lengthening, matched to the type): 1A gingivectomy alone; 2A an apically positioned flap;
// 1B and 2B an apically positioned flap plus osseous surgery.
// Positions in mm are illustrative; the labels give only the notes' relations (apical to the crest, more than 1 mm).
import { figureSvg, plateHtml } from "./shared.mjs";

const S = 13, W = 416, H = 392, CX = 279, PY = 223.5, TOP = 15.6;

/* the tooth's facial and palatal outlines: x (mm, facial -) at d (mm from the CEJ, apical +) */
function apLerp(t, d) { if (d <= t[0][0]) return t[0][1]; for (var i = 1; i < t.length; i++) if (d <= t[i][0]) { var a = t[i - 1], b = t[i]; return a[1] + (b[1] - a[1]) * (d - a[0]) / (b[0] - a[0]); } return t[t.length - 1][1]; }
function apF(d) { return d < 0 ? apLerp([[-10.5, -.7], [-10, -1.2], [-9.2, -1.8], [-8, -2.4], [-7, -2.75], [-6, -3.02], [-5, -3.22], [-4, -3.37], [-3, -3.46], [-2, -3.5], [-1, -3.47], [0, -3.38]], d) : -3.38 + 3.2 * Math.pow(Math.min(d, 13.4) / 13.4, 1.45); }
function apL(d) { return d < 0 ? apLerp([[-10.5, -.1], [-10.1, .45], [-9.3, .7], [-8.5, .88], [-7.5, 1.02], [-6.5, 1.22], [-5.5, 1.5], [-4.5, 1.88], [-3.6, 2.35], [-2.7, 2.85], [-1.8, 3.28], [-.9, 3.45], [0, 3.25]], d) : 3.25 - 3.05 * Math.pow(Math.min(d, 13.4) / 13.4, 1.45); }
/* the outer surface of the facial bone plate (crest at c), and the surface the soft tissue lies on */
function apBO(d, c) { return apF(d) - (.95 + .02 * d) * Math.pow(Math.min(1, Math.max(0, (d - c) / 2.2)), .6); }
function apIn(d, c) { return (d < c ? apF(d) : apBO(d, c)) - .03; }
/* soft tissue thickness: gingiva 1.4 mm, mucosa 0.95 mm, blended across the MGJ */
function apTh(d, g) { var u = Math.max(0, Math.min(1, (d - g + .5) / 1.0)); return 1.4 - .45 * u; }
function apP(D, pts, close) { var o = ""; for (var i = 0; i < pts.length; i++) o += (i ? "L" : "M") + Math.round((D.CX + pts[i][0] * D.S) * 10) / 10 + " " + Math.round((D.PY - pts[i][1] * D.S) * 10) / 10; return o + (close ? "Z" : ""); }
/* a band of soft tissue from lo to hi; cap rounds its coronal end (the gingival margin) */
function apBand(lo, hi, c, g, cap) {
  var a = [], b = [], n = Math.max(6, Math.round((hi - lo) * 3));
  for (var i = 0; i <= n; i++) { var d = lo + (hi - lo) * i / n, x = apIn(d, c); a.push([x, d]); b.push([x - apTh(d, g), d]); }
  var t = apTh(lo, g), r = .55;
  return b.slice().reverse().concat(cap ? [[b[0][0] + t * .12, lo - r * .7], [(a[0][0] + b[0][0]) / 2 + .05, lo - r], [a[0][0] - t * .12, lo - r * .55]] : [], a);
}
function apBone(D, c) {
  var o = [[apF(c) + .02, c]];
  for (var d = c; d <= D.TOP + .01; d += .4) o.push([apBO(d, c), d]);
  return o.concat([[apBO(D.TOP, c), D.TOP], [6.5, D.TOP], [6.5, 3.3], [4.6, 2.6], [apL(2) - .02, 2.0], [1.2, 6], [-1.2, 6]]);
}
function apDyn(st, D) {
  var f = function (n) { return Math.round(n * 10) / 10; }, X = function (mm) { return f(D.CX + mm * D.S); }, Y = function (d) { return f(D.PY - d * D.S); };
  var k = st.t + st.s, B = D.ST[k], P = st.after ? D.AFTER[k] : B, c = P.crest, g = P.mgj, m = P.m, o = "", lab = [];
  if (st.after && B.crest !== c) { var gh = [[apF(B.crest), B.crest]]; for (var d0 = B.crest; d0 <= c + .8; d0 += .2) gh.push([apBO(d0, B.crest), d0]); for (var d1 = c + .8; d1 >= c; d1 -= .2) gh.push([apBO(d1, c), d1]); o += '<g class="hot" data-info="' + D.HOT.boneGhost + '"><path class="ap-boneghost" d="' + apP(D, gh, true) + '"/></g>'; lab.push([D.TXT.boneGhost, apF((B.crest + c) / 2) - .35, (B.crest + c) / 2]); }
  /* the soft tissue: keratinized gingiva from the margin to the MGJ, then mucosa */
  o += '<g class="hot" data-info="' + D.HOT.muc + '"><path class="ap-muc" d="' + apP(D, apBand(g, D.TOP, c, g, false), true) + '"/></g>';
  o += '<g class="hot" data-info="' + D.HOT.kg + '"><path class="ap-kg" d="' + apP(D, apBand(m, g, c, g, true), true) + '"/>';
  var e = []; for (var i = 0; i <= 30; i++) { var d = m + (g - m) * i / 30; e.push([apIn(d, c) - apTh(d, g) + .1, d]); } o += '<path class="ap-ker" d="' + apP(D, e, false) + '"/></g>';
  if (st.after) { o += '<g class="hot" data-info="' + D.HOT.ghost + '"><path class="ap-ghost" d="' + apP(D, apBand(B.m, m - .1, B.crest, B.mgj, true), true) + '"/></g>'; lab.push([D.TXT.ghost[st.t === "1" && st.s === "A" ? 1 : 0], apF(B.m + .4) - .7, B.m + .4]); }
  /* the MGJ */
  var mi = apIn(g, c), mo = mi - apTh(g, g);
  o += '<path class="ap-mgj" d="M' + X(mo - .45) + " " + Y(g) + "H" + X(mi - .05) + '"/>';
  /* the margin, carried across to the clinical-crown bracket */
  var mt = m - .55;
  o += '<path class="ap-guide" d="M' + X(apF(mt) + .1) + " " + Y(mt) + "H" + X(D.BX[0] + .4) + '"/><path class="ap-brk" d="M' + X(D.BX[0] - .35) + " " + Y(mt) + "H" + X(D.BX[0]) + "V" + Y(-10.5) + "H" + X(D.BX[0] - .35) + '"/>';
  o += '<text class="ap-t ap-rot" transform="translate(' + X(D.BX[0] + .95) + " " + Y((mt - 10.5) / 2) + ') rotate(-90)" text-anchor="middle">clinical crown</text>';
  /* labels: sorted from apical to coronal, one slot each, so no leaders cross */
  lab.push([D.TXT.muc, apIn(11.5, c) - apTh(11.5, g) / 2, 11.5]);
  lab.push([D.TXT.mgj[st.after ? (st.t === "1" && st.s === "A" ? 2 : 3) : (st.t === "1" ? 0 : 1)], mo - .1, g]);
  lab.push([D.TXT.crest[st.after && st.s === "B" ? 2 : (st.s === "A" ? 0 : 1)], apF(c) - .2, c + .2]);
  lab.push([D.TXT.kg[st.after ? (st.t === "1" && st.s === "A" ? 2 : 3) : (st.t === "1" ? 0 : 1)], apIn((m + g) / 2, c) - apTh((m + g) / 2, g) / 2, (m + g) / 2]);
  lab.push([D.TXT.margin[st.after ? 1 : 0], (apF(mt + .3) * 2 - apTh(m, g)) / 2, mt + .25]);
  lab.sort(function (p, q) { return q[2] - p[2]; });
  lab.forEach(function (l, j) {
    var sy = 13.6 - j * 2.75, lines = l[0].split("|"), ty = sy + (lines.length - 1) * .42;
    o += '<path class="ap-lead" d="M' + X(l[1]) + " " + Y(l[2]) + "L" + X(-6.35) + " " + Y(sy) + '"/><circle class="ap-dot" cx="' + X(l[1]) + '" cy="' + Y(l[2]) + '" r="2.2"/>';
    o += '<text class="ap-t ap-lab" x="' + X(-6.6) + '" y="' + Y(ty - .3) + '" text-anchor="end">' + lines.map(function (s, i) { return '<tspan x="' + X(-6.6) + '" dy="' + (i ? "1.15em" : "0") + '">' + s + "</tspan>"; }).join("") + "</text>";
  });
  return o;
}
function apBoneSvg(st, D) { var P = st.after ? D.AFTER[st.t + st.s] : D.ST[st.t + st.s]; return '<g class="hot" data-info="' + D.HOT.bone + '"><path class="ap-bone" d="' + apP(D, apBone(D, P.crest), true) + '"/></g>'; }

/* the incisor in section, the palatal gingiva, the CEJ and the anatomical-crown bracket (the same in every state) */
function staticSvg(D) {
  const X = (mm) => Math.round((CX + mm * S) * 10) / 10, Y = (d) => Math.round((PY - d * S) * 10) / 10;
  const tooth = [];
  for (let d = -10.5; d <= 13.4; d += .3) tooth.push([apF(d), d]);
  tooth.push([-.05, 13.62], [.1, 13.6]);
  for (let d = 13.4; d >= -10.5; d -= .3) tooth.push([apL(d), d]);
  const enamel = [];
  for (let d = 0; d >= -10.5; d -= .3) enamel.push([apF(d), d]);
  for (let d = -10.5; d <= 0; d += .3) enamel.push([apL(d), d]);
  for (let d = 0; d >= -9.0; d -= .3) { const e = Math.min(1, -d / 2.2); enamel.push([apL(d) - (.95 * e + .02), d]); }
  for (let d = -9.0; d <= 0; d += .3) { const e = Math.min(1, -d / 2.2); enamel.push([apF(d) + (1.0 * e + .02), d]); }
  const pulp = [];
  const pc = (d) => (apF(d) + apL(d)) / 2 + .1, pw = (d) => d < -3 ? .3 + .45 * (d + 6.5) / 3.5 : d < 1 ? .75 : .75 - .58 * (d - 1) / 12;
  for (let d = -6.5; d <= 12.9; d += .5) pulp.push([pc(d) - pw(d), d]);
  for (let d = 12.9; d >= -6.5; d -= .5) pulp.push([pc(d) + pw(d), d]);
  const palatal = [[apL(-1.1), -1.1], [4.2, -1.25], [5.3, -.4], [6.5, .85], [6.5, 3.3], [4.6, 2.6], [apL(2) - .02, 2.0]];
  for (let d = 2.0; d >= -1.1; d -= .3) palatal.push([apL(d) + .03, d]);
  const bx = D.BX[1];
  return `<g class="hot" data-info="${D.HOT.tooth}"><path class="ap-dent" d="${apP(D, tooth, true)}"/><path class="ap-enam" d="${apP(D, enamel, true)}"/><path class="ap-pulp" d="${apP(D, pulp, true)}"/></g>`
    + `<path class="ap-kg" d="${apP(D, palatal, true)}"/><path class="ap-ker" d="${apP(D, [[apL(-1.1) + .1, -1.15], [4.2, -1.15], [5.3, -.32], [6.5, .93]], false)}"/>`
    + `<path class="ap-guide" d="M${X(apF(0) + .05)} ${Y(0)}H${X(bx + .4)}"/><text class="ap-t ap-on" x="${X(-1.6)}" y="${Y(.28)}" text-anchor="middle">CEJ</text>`
    + `<path class="ap-brk" d="M${X(bx - .35)} ${Y(0)}H${X(bx)}V${Y(-10.5)}H${X(bx - .35)}"/><text class="ap-t ap-rot" transform="translate(${X(bx + .95)} ${Y(-5.25)}) rotate(-90)" text-anchor="middle">anatomical crown</text>`
    + `<path class="ap-guide" d="M${X(apF(-10.5) + .2)} ${Y(-10.5)}H${X(bx + .4)}"/>`;
}

const D = {
  W, H, S, CX, PY, TOP, BX: [7.2, 8.95],
  ST: { "1A": { m: -3, mgj: 3.6, crest: 2 }, "1B": { m: -3, mgj: 2.6, crest: .35 }, "2A": { m: -3, mgj: 0, crest: 2 }, "2B": { m: -3, mgj: 0, crest: .35 } },
  AFTER: { "1A": { m: -.5, mgj: 3.6, crest: 2 }, "1B": { m: -.5, mgj: 5.1, crest: 2 }, "2A": { m: -.5, mgj: 2.5, crest: 2 }, "2B": { m: -.5, mgj: 2.5, crest: 2 } },
  TXT: {
    muc: "alveolar mucosa",
    mgj: ["MGJ, apical|to the crest", "MGJ, at the|level of the CEJ", "MGJ", "MGJ, moved|apically"],
    crest: ["bone crest, more than|1 mm from the CEJ", "bone crest, close|to the CEJ", "bone crest, after|osseous surgery"],
    kg: ["gingiva, wider|than normal", "gingiva, normal|width", "gingiva, still|a band", "gingiva, its|width kept"],
    margin: ["gingival margin,|on the enamel", "new margin, at|about the CEJ"],
    ghost: ["where the|margin was", "gingiva cut|away"],
    boneGhost: "bone removed",
  },
  TX: { "1A": "gingivectomy alone", "2A": "apically positioned flap", "1B": "apically positioned flap + osseous surgery", "2B": "apically positioned flap + osseous surgery" },
  SUM: {
    "1A": ["Type 1A: a wider band of gingiva, with the MGJ apical to the bone crest, and more than 1 mm between the CEJ and the crest. The gingival margin sits on the enamel, so the clinical crown is shorter than the anatomical crown. Types 1A and 1B are the ones seen most often.",
      "Type 1A, gingivectomy alone: it is the only type with both extra gingiva and room above the bone, so the excess gingiva is cut away and a band of keratinized gingiva still remains."],
    "1B": ["Type 1B: a wider band of gingiva, with the MGJ apical to the crest, but the bone crest in close proximity to the CEJ. Types 1A and 1B are the ones seen most often.",
      "Type 1B, an apically positioned flap plus osseous surgery: the bone itself sits too close to the CEJ, so it has to be moved, whatever the gingiva. Bone is removed and the flap is positioned apically."],
    "2A": ["Type 2A: a normal width of gingiva, with the MGJ at the level of the CEJ, and more than 1 mm between the CEJ and the crest. The tooth still looks short: the margin sits on the enamel.",
      "Type 2A, an apically positioned flap: the band of gingiva is only of normal width, so cutting it away would cost keratinized gingiva. The flap moves the whole band apically instead."],
    "2B": ["Type 2B: a normal width of gingiva, with the MGJ at the level of the CEJ, and the bone crest in close proximity to the CEJ.",
      "Type 2B, an apically positioned flap plus osseous surgery: the bone sits too close to the CEJ, so bone is removed, and the flap moves the band of gingiva apically, keeping its width."],
  },
  HOT: {
    tooth: "A maxillary central incisor in section. The anatomical crown runs from the incisal edge to the CEJ; the clinical crown is the part that shows above the gingiva.",
    kg: "Keratinized gingiva, from the gingival margin to the MGJ. Type 1 has a wider band than normal; Type 2 a normal width.",
    muc: "Alveolar mucosa, beyond the MGJ.",
    bone: "The facial bone. Subcategory A has more than 1 mm between the CEJ and the crest; in B the crest sits in close proximity to the CEJ.",
    ghost: "Where the gingiva was before treatment: it covered part of the anatomical crown.",
    boneGhost: "The bone removed in osseous surgery, so the crest no longer sits close to the CEJ.",
  },
};
D.STATIC = staticSvg(D);

const scale = `<path class="ap-scale" d="M16 ${H - 14}h${5 * S}M16 ${H - 18}v8M${16 + 5 * S} ${H - 18}v8"/><text class="ap-t ap-small" x="${16 + 2.5 * S}" y="${H - 21}" text-anchor="middle">5 mm</text>`;
const tags = `<text class="ap-t ap-tag" x="${CX - 4.6 * S}" y="${PY + 10.4 * S}" text-anchor="middle">FACIAL</text><text class="ap-t ap-tag" x="${CX + 4.4 * S}" y="${PY + 10.4 * S}" text-anchor="middle">PALATAL</text>`;
const st0 = { t: "1", s: "A", after: false };
const svg = figureSvg({ width: W, height: H, className: "ap-svg", label: "A section through a maxillary central incisor with altered passive eruption: the gingival margin on the enamel, the MGJ and the bone crest for the chosen type and subcategory, before and after crown lengthening, with the clinical and anatomical crowns bracketed.",
  body: `<g class="ap-bonel">${apBoneSvg(st0, D)}</g>${D.STATIC}<g class="ap-dyn">${apDyn(st0, D)}</g>${tags}${scale}` });
const plate = plateHtml({ fig: "S9 · Fig 4", title: "Altered passive eruption", hint: "pick a type · then treat it", readout: "Type 1A · before", body: `<div class="am-svg ap-box">${svg}</div>` });
const controls = `<div class="am-controls" role="group" aria-label="Type"><button type="button" class="am-btn" data-apt="1" aria-pressed="true">Type 1: wider gingiva</button><button type="button" class="am-btn" data-apt="2" aria-pressed="false">Type 2: normal width</button></div>
<div class="am-controls" role="group" aria-label="Subcategory"><button type="button" class="am-btn" data-aps="A" aria-pressed="true">A: crest more than 1 mm from the CEJ</button><button type="button" class="am-btn" data-aps="B" aria-pressed="false">B: crest close to the CEJ</button></div>
<div class="am-controls" role="group" aria-label="Treatment"><button type="button" class="am-btn" data-apa="0" aria-pressed="true">Before</button><button type="button" class="am-btn" data-apa="1" aria-pressed="false">After crown lengthening</button></div>
<div class="am-stats"><span>Treatment <b data-ap="0"></b></span><span>Clinical crown <b data-ap="1"></b></span></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Tap the gingiva, the mucosa, the bone or the tooth.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From Dr. Abou-Arraj's slides and the notes (the live class that covers this part of S9 isn't posted yet): the two types and two subcategories, which are the most common, and the treatment for each.</li>
<li>Outside sources: the classification is Coslet, Vanarsdall and Weisgold's (Alpha Omegan 1977;70:24-8), and passive eruption as the gingiva's migration to a final stable position at the cervical level follows Alpiste-Illueca (Med Oral Patol Oral Cir Bucal 2011;16:e100-4). The tooth's proportions follow Wheeler's Dental Anatomy (Nelson, 11th ed.), and the crest after osseous surgery is drawn about where Gargiulo, Wentz and Orban's supracrestal dimensions put it (J Periodontol 1961;32:261-7); the labels give only the notes' relations.</li>
<li>A schematic, drawn to one scale (the 5 mm bar): where the margin, the MGJ and the crest sit in each type, how far the margin moves and how much bone comes off are illustrative. Educational, not medical advice.</li></ul></details>`;

function apLive(root, D) {
  var svg = root.querySelector(".ap-svg"), dyn = svg.querySelector(".ap-dyn"), bonel = svg.querySelector(".ap-bonel"), sum = root.querySelector(".am-summary"), info = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]");
  var st = { t: "1", s: "A", after: false };
  function draw() {
    var k = st.t + st.s;
    bonel.innerHTML = D.apBoneSvg(st, D); dyn.innerHTML = D.apDyn(st, D);
    sum.textContent = D.SUM[k][st.after ? 1 : 0]; if (readout) readout.textContent = "Type " + k + " · " + (st.after ? "after" : "before");
    var a = root.querySelector('[data-ap="0"]'), b = root.querySelector('[data-ap="1"]');
    if (a) a.textContent = D.TX[k]; if (b) b.textContent = st.after ? "about the anatomical crown" : "shorter than the anatomical crown";
    root.querySelectorAll("[data-apt]").forEach(function (x) { x.setAttribute("aria-pressed", String(x.getAttribute("data-apt") === st.t)); });
    root.querySelectorAll("[data-aps]").forEach(function (x) { x.setAttribute("aria-pressed", String(x.getAttribute("data-aps") === st.s)); });
    root.querySelectorAll("[data-apa]").forEach(function (x) { x.setAttribute("aria-pressed", String((x.getAttribute("data-apa") === "1") === st.after)); });
  }
  root.querySelectorAll("[data-apt]").forEach(function (x) { x.addEventListener("click", function () { st.t = x.getAttribute("data-apt"); st.after = false; draw(); }); });
  root.querySelectorAll("[data-aps]").forEach(function (x) { x.addEventListener("click", function () { st.s = x.getAttribute("data-aps"); st.after = false; draw(); }); });
  root.querySelectorAll("[data-apa]").forEach(function (x) { x.addEventListener("click", function () { st.after = x.getAttribute("data-apa") === "1"; draw(); }); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && svg.contains(el)) info.textContent = el.getAttribute("data-info"); }
  svg.addEventListener("pointerover", hot); svg.addEventListener("click", hot);
  draw();
}

const CSS = `
.anima .ap-box{max-width:520px;margin:0 auto}
.anima .ap-svg .ap-t{fill:var(--anatomy-text);font:11px var(--anatomy-mono)}
.anima .ap-svg .ap-lab{fill:var(--anatomy-strong);font-weight:600}
.anima .ap-svg .ap-rot{fill:var(--anatomy-strong);font-weight:600;font-size:10.5px}
.anima .ap-svg .ap-small{font-size:10.5px;fill:var(--anatomy-muted)}
.anima .ap-svg .ap-tag{font-size:9.5px;letter-spacing:.1em;fill:var(--anatomy-muted)}
.anima .ap-svg .ap-on{font-size:10.5px;font-weight:600;fill:var(--ap-ink);paint-order:stroke;stroke:var(--ap-dentin);stroke-width:3px}
.anima .ap-svg .ap-lead{fill:none;stroke:var(--anatomy-mid);stroke-width:.8}
.anima .ap-svg .ap-dot{fill:var(--anatomy-strong);stroke:var(--surface);stroke-width:1}
.anima .ap-svg .ap-bone{fill:var(--pd-bone);stroke:var(--pd-bone-line);stroke-width:1.1;stroke-linejoin:round}
.anima .ap-svg .ap-boneghost{fill:color-mix(in srgb, var(--pd-bone) 45%, transparent);stroke:var(--pd-bone-line);stroke-width:1.1;stroke-dasharray:3 2.5}
.anima .ap-svg .ap-dent{fill:var(--ap-dentin);stroke:var(--ap-line);stroke-width:1}
.anima .ap-svg .ap-enam{fill:var(--ap-enamel);stroke:var(--ap-line);stroke-width:.9;stroke-linejoin:round}
.anima .ap-svg .ap-pulp{fill:color-mix(in srgb, var(--pd-red) 45%, var(--ap-dentin));stroke:var(--pd-red-line);stroke-width:.6}
.anima .ap-svg .ap-kg{fill:var(--pd-gum);stroke:var(--pd-gum-line);stroke-width:1;stroke-linejoin:round}
.anima .ap-svg .ap-muc{fill:var(--ap-muc);stroke:var(--pd-red-line);stroke-width:1;stroke-linejoin:round}
.anima .ap-svg .ap-ker{fill:none;stroke:var(--pd-gum-line);stroke-width:2.4;stroke-linecap:round}
.anima .ap-svg .ap-ghost{fill:none;stroke:var(--pd-gum-line);stroke-width:1.2;stroke-dasharray:3 3}
.anima .ap-svg .ap-mgj{fill:none;stroke:var(--anatomy-strong);stroke-width:1.3;stroke-dasharray:3 2}
.anima .ap-svg .ap-guide{fill:none;stroke:var(--anatomy-mid);stroke-width:.9;stroke-dasharray:2 3}
.anima .ap-svg .ap-brk{fill:none;stroke:var(--anatomy-strong);stroke-width:1.3}
.anima .ap-svg .ap-scale{fill:none;stroke:var(--anatomy-mid);stroke-width:1.2}
.anima[data-anima="ape"]{--ap-enamel:#fbf8f2;--ap-dentin:#dcc6a1;--ap-line:#a8916a;--ap-ink:#4a3b22;--ap-muc:color-mix(in srgb, var(--pd-red) 45%, var(--pd-gum))}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]) .anima[data-anima="ape"]{--ap-enamel:#e4ddd0;--ap-dentin:#b9a27c;--ap-line:#8a7552;--ap-ink:#2e2414;--ap-muc:#b8344b} }
:root[data-theme="dark"] .anima[data-anima="ape"]{--ap-enamel:#e4ddd0;--ap-dentin:#b9a27c;--ap-line:#8a7552;--ap-ink:#2e2414;--ap-muc:#b8344b}
`;

export function ape() {
  return { id: "ape", lec: "perio-plastic-esthetics", title: "Altered passive eruption",
    caption: "Coslet's types (where the MGJ sits) and subcategories (how close the bone crest is to the CEJ), and the crown lengthening each one gets. From the slides; the live class isn't posted yet.",
    html: `<div class="anima" data-anima="ape">${plate}${controls}${SOURCES}</div>`, css: CSS, live: apLive.toString(), helpers: [apLerp, apF, apL, apBO, apIn, apTh, apP, apBand, apBone, apDyn, apBoneSvg], data: D };
}
