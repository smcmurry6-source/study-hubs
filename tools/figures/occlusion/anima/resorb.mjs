// Fig 20: how the ridges resorb (Occlusion L8, "What makes it harder"). Two sections side by side: the front of the
// mouth at the midline seen from the side (patient facing right) and the back of the mouth through the first molars
// seen from the front (patient's right at the viewer's left). A slider runs from natural teeth, through the extractions,
// to a long-edentulous patient: after the teeth are lost the maxilla resorbs up and in (anteriorly upward and inward,
// posteriorly upward and toward the midline) and the mandible down and out (anteriorly downward and forward,
// posteriorly downward and outward). Set denture teeth near the ridges, as the notes say they generally are, and the
// posterior teeth end up in crossbite and the front reads pseudo-Class III. What it shows and names comes from the L8
// notes (the 11/5 recording). Outside sources set the proportions (vault/rules/outside-sources-for-figures.md): the
// mandible loses about twice the maxilla's ridge height (Tallgren 1972 and 1980), and the basal bone keeps its shape
// while the alveolar bone resorbs (Cawood & Howell 1988). Outlines are schematic, drawn to typical proportions.
import { figureSvg, plateHtml } from "./shared.mjs";
import { DEN } from "./l8den.mjs";

/* millimeters, y up, the occlusal plane at y = 0; each outline is [dentate, long edentulous] with the same points */
const SAG = {
  W: 210, H: 330, V: { OX: 118, OY: 151, S: 5.2 },
  /* the maxilla at the midline: from the anterior nasal spine down the labial surface to the crest, along the palate
     and back along the nasal floor; points 1-9 are its oral surface, 5 the crest */
  MAX: [
    [[12.5, 22.4], [9.8, 20.6], [7.6, 16], [8.4, 11], [7.6, 9.6], [5.1, 9.2], [2.6, 9.8], [-1, 13], [-8, 16], [-26, 16.8], [-26, 21.6], [-6, 22.2]],
    [[12.5, 22.4], [9.8, 20.6], [6.2, 18.3], [4.8, 15.4], [3.4, 14], [1.4, 13.6], [-0.8, 14], [-3.6, 15.8], [-9, 17.1], [-26, 17.5], [-26, 21.6], [-6, 22.2]],
  ],
  /* the symphysis: the labial surface up from the chin, the crest (5), the lingual surface down; points 2-8 are oral */
  MAN: [
    [[7.2, -26.5], [6.9, -24], [4.8, -18], [5.6, -12.5], [5.0, -8.6], [2.7, -8.2], [0.6, -8.6], [-1.6, -13], [-4, -22], [-4.3, -24.5], [-4.4, -26.5]],
    [[7.2, -26.5], [6.9, -24], [5.6, -22], [6.8, -19.6], [6.8, -18.2], [5.0, -17.4], [3.2, -18], [1.0, -20.6], [-2.6, -23.4], [-4.3, -24.5], [-4.4, -26.5]],
  ],
  MAX_ORAL: [1, 9], MAN_ORAL: [2, 8], CREST: 5,
  /* the incisors (natural: necks run into the bone) and the denture incisors (necks cut to sit in the base) */
  UI: [[7.6, 10.4], [10.6, 0.2], [10.2, -0.6], [9.0, -0.3], [5.0, 5.0], [2.6, 10.6]],
  LI: [[4.8, -9.2], [7.0, 1.8], [6.5, 2.2], [5.8, 1.8], [3.2, -3.5], [0.6, -9.2]],
  DUI: [[8.38, 7.6], [10.6, 0.2], [10.2, -0.6], [9.0, -0.3], [5.0, 5.0], [3.84, 7.6]], DUI_NECK: [[3.9, 7.0], [8.3, 7.0]],
  DLI: [[5.09, -7.6], [7.0, 1.8], [6.5, 2.2], [5.8, 1.8], [3.2, -3.5], [1.26, -7.6]], DLI_NECK: [[1.3, -7.0], [5.0, -7.0]],
};
const COR = {
  W: 360, H: 330, V: { OX: 180, OY: 146, S: 4.0 },
  /* the patient's right half (the left is its mirror): the maxilla from the cheek over the ridge (4) to the midline (9) */
  MAX: [
    [[-46, 28], [-38, 22], [-33, 14], [-31, 9.6], [-26, 8.3], [-21.5, 9.6], [-18, 14], [-12, 19.5], [-5, 22.5], [0, 23]],
    [[-46, 28], [-36, 23.4], [-29.5, 17.5], [-26.5, 13.8], [-23, 12.7], [-19.6, 13.9], [-16.5, 16.8], [-11, 20.6], [-5, 22.9], [0, 23.2]],
  ],
  /* the mandible's body at the first molar: buccal surface up to the ridge (4), lingual surface down */
  MAN: [
    [[-37.2, -36], [-38, -24], [-34, -16], [-29, -10], [-23.5, -8.3], [-18.5, -10], [-17.5, -16], [-17, -24], [-17.6, -36]],
    [[-37.2, -36], [-38.5, -25], [-35, -20], [-31.5, -18.4], [-27.5, -17.5], [-23.5, -18.8], [-20.5, -21.5], [-17.8, -26], [-17.6, -36]],
  ],
  MAX_ORAL: [1, 9], MAN_ORAL: [1, 7], CREST: 4, MUC: 1,
  UX: -26, LX: -23.5, /* natural molar centers: the upper just buccal of the lower */
  TONGUE: DEN.TONGUE.map(([x, y]) => [x, Math.max(y, -36)]), PROF: DEN.PROF,
};

const SUM = {
  teeth: "With the teeth in place, the alveolar bone holds them, and the upper posterior teeth sit just outside the lower ones. Drag the slider (or press Play) to take the teeth out and watch what the ridges do.",
  out: "The teeth are gone. The bone that held them resorbs, and it follows patterns.",
  resorb: "The maxilla resorbs up and in: anteriorly upward and inward, posteriorly upward and toward the midline, so its supporting arch gets smaller than the original arch. The mandible resorbs down and out: anteriorly downward and forward, posteriorly downward and outward, so at the level where the teeth were, the edentulous mandible becomes larger than the dentate one.",
  long: "Long edentulous: the lower ridges now sit outside the upper ones, and the mandible sits ahead of the maxilla. A patient who becomes skeletal Class III because the mandible resorbs outward while the maxilla resorbs inward has a pseudo-Class III relationship. Set denture teeth to see what it does to the setup.",
  den: "Denture teeth are generally set near where the ridge is (\"not rocket science\"), so as the ridges part, the posterior teeth often have to be set in crossbite, and that's fine: there's nothing wrong with a crossbite in a denture. In front, the lower teeth end up ahead of the upper: pseudo-Class III.",
};
const HOT = {
  smax: "The maxilla at the midline, under the incisors. After the teeth are lost, the anterior ridge resorbs upward and inward.",
  sman: "The mandible at the midline (the symphysis). Its anterior ridge resorbs downward and forward.",
  cmax: "The maxilla through the first molars. The posterior ridges resorb upward and toward the midline: the upper arch gets smaller than the original arch.",
  cman: "The mandible through the first molars. The posterior ridges resorb downward and outward: at the level where the teeth were, the edentulous mandible becomes larger than the dentate one.",
  teeth: "Natural teeth: the upper posterior teeth sit just outside the lower ones.",
  den: "Denture teeth, set near where the ridge is.",
  ghost: "Dashed: where the ridge was when the teeth were in.",
  tongue: "The tongue.",
};

function rbLerp(a, b, u) { return a.map(function (p, i) { return [p[0] + (b[i][0] - p[0]) * u, p[1] + (b[i][1] - p[1]) * u]; }); }
function rbPath(pts, v, closed) { var f = function (n) { return Math.round(n * 10) / 10; }; return "M" + pts.map(function (p) { return f(v.OX + p[0] * v.S) + " " + f(v.OY - p[1] * v.S); }).join("L") + (closed ? "Z" : ""); }
/* a polyline moved d mm toward the mouth: s = +1 when the mouth is on its left */
function rbOff(pts, d, s) { return pts.map(function (p, i) { var a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; return [p[0] - dy / L * d * s, p[1] + dx / L * d * s]; }); }
function rbArrow(a, b, v, cls) {
  var f = function (n) { return Math.round(n * 10) / 10; }, x1 = v.OX + a[0] * v.S, y1 = v.OY - a[1] * v.S, x2 = v.OX + b[0] * v.S, y2 = v.OY - b[1] * v.S, L = Math.hypot(x2 - x1, y2 - y1);
  if (L < 8) return ""; var ux = (x2 - x1) / L, uy = (y2 - y1) / L;
  return '<path class="' + cls + '" d="M' + f(x1) + " " + f(y1) + "L" + f(x2) + " " + f(y2) + "M" + f(x2 - ux * 6 - uy * 4) + " " + f(y2 - uy * 6 + ux * 4) + "L" + f(x2) + " " + f(y2) + "L" + f(x2 - ux * 6 + uy * 4) + " " + f(y2 - uy * 6 - ux * 4) + '"/>';
}
function rbStage(t) { return t <= 0 ? 0 : t < 0.2 ? 1 : 2; }
function rbText(x, y, s, cls, a) { return '<text class="rb-t' + (cls ? " " + cls : "") + '" x="' + x + '" y="' + y + '"' + (a ? ' text-anchor="' + a + '"' : "") + ">" + s + "</text>"; }

/* the front, side view */
function rbSag(st, D) {
  var G = D.SAG, v = G.V, o = "", t = st.t, u = Math.max(0, (t - 0.2) / 0.8), toothA = Math.max(0, 1 - t / 0.15);
  var mx = D.rbLerp(G.MAX[0], G.MAX[1], u), mn = D.rbLerp(G.MAN[0], G.MAN[1], u);
  function hot(k) { return ' data-info="' + D.HOT[k] + '"'; }
  /* natural incisors (fading out as they're taken out) */
  if (toothA > 0) o += '<g class="hot" style="opacity:' + toothA.toFixed(2) + '"' + hot("teeth") + '><path class="rb-tooth" d="' + D.rbPath(G.UI, v, true) + '"/><path class="rb-tooth" d="' + D.rbPath(G.LI, v, true) + '"/></g>';
  /* mucosa, then bone */
  o += '<path class="rb-muc" style="stroke-width:' + (2 * v.S) + '" d="' + D.rbPath(mx.slice(G.MAX_ORAL[0], G.MAX_ORAL[1] + 1), v) + '"/>';
  o += '<path class="rb-muc" style="stroke-width:' + (2 * v.S) + '" d="' + D.rbPath(mn.slice(G.MAN_ORAL[0], G.MAN_ORAL[1] + 1), v) + '"/>';
  o += '<path class="rb-bone hot"' + hot("smax") + ' d="' + D.rbPath(mx, v, true) + '"/><path class="rb-bone hot"' + hot("sman") + ' d="' + D.rbPath(mn, v, true) + '"/>';
  /* where the ridges were, and which way they went */
  if (u > 0) {
    o += '<path class="rb-ghost hot"' + hot("ghost") + ' d="' + D.rbPath(G.MAX[0].slice(2, 8), v) + '"/><path class="rb-ghost hot"' + hot("ghost") + ' d="' + D.rbPath(G.MAN[0].slice(3, 8), v) + '"/>';
    o += D.rbArrow(G.MAX[0][G.CREST], mx[G.CREST], v, "rb-amax") + D.rbArrow(G.MAN[0][G.CREST], mn[G.CREST], v, "rb-aman");
  }
  /* denture incisors near the ridges */
  if (st.den && t >= 0.2) {
    var dxU = mx[G.CREST][0] - G.MAX[0][G.CREST][0], dxL = mn[G.CREST][0] - G.MAN[0][G.CREST][0], k = u * 20, i0 = Math.min(19, Math.floor(k)), dyL = G.DYL[i0] + (G.DYL[i0 + 1] - G.DYL[i0]) * (k - i0);
    var mv = function (pts, dx, dy) { return pts.map(function (p) { return [p[0] + dx, p[1] + dy]; }); };
    var oralU = mx.slice(2, 10), intU = D.rbOff(oralU, 1, 1), polU = D.rbOff(oralU.slice(5), 3.2, 1).reverse();
    var baseU = intU.concat(polU, mv(G.DUI_NECK, dxU, 0), [D.rbOff(oralU, 3, 1)[1], D.rbOff(oralU, 3, 1)[0]]);
    var oralL = mn.slice(2, 9), intL = D.rbOff(oralL, 1, -1), polL = D.rbOff(oralL, 3.2, -1);
    var baseL = intL.concat([polL[polL.length - 1], polL[polL.length - 2]], mv(G.DLI_NECK, dxL, dyL), [polL[1], polL[0]]);
    o += '<g class="hot"' + hot("den") + '><path class="rb-dtooth" d="' + D.rbPath(mv(G.DUI, dxU, 0), v, true) + '"/><path class="rb-base" d="' + D.rbPath(baseU, v, true) + '"/>';
    o += '<path class="rb-dtooth" d="' + D.rbPath(mv(G.DLI, dxL, dyL), v, true) + '"/><path class="rb-base" d="' + D.rbPath(baseL, v, true) + '"/></g>';
    if (u > 0.75) o += D.rbText(14, 160, "pseudo-Class III", "rb-bad");
  }
  o += D.rbText(8, 15, "Front · side view →", "rb-head");
  o += D.rbText(8, 308, "maxilla: up and in", "rb-kmax") + D.rbText(8, 324, "mandible: down and forward", "rb-kman");
  return o;
}

/* the back, through the first molars */
function rbCor(st, D) {
  var G = D.COR, v = G.V, o = "", t = st.t, u = Math.max(0, (t - 0.2) / 0.8), toothA = Math.max(0, 1 - t / 0.15), P = G.PROF;
  var mx = D.rbLerp(G.MAX[0], G.MAX[1], u), mn = D.rbLerp(G.MAN[0], G.MAN[1], u);
  function hot(k) { return ' data-info="' + D.HOT[k] + '"'; }
  function mir(pts, s) { return pts.map(function (p) { return [s * p[0], p[1]]; }); }
  /* a molar: prof buccal (u 0) to lingual (u 10), centered at xc on the right side; z = 1 upper, -1 lower; neck height */
  function crown(prof, xc, z, neck) { return [[0.8, neck * z], [0.1, 3.2 * z]].concat(prof, [[9.9, 3.2 * z], [9.2, neck * z]]).map(function (q) { return [xc - 5 + q[0], q[1]]; }); }
  o += '<path class="rb-tongue hot"' + hot("tongue") + ' d="' + D.rbPath(G.TONGUE, v, true) + '"/>';
  function both(r) { return r.concat(mir(r.slice(0, r.length - 1), -1).reverse()); }
  [1, -1].forEach(function (s) {
    if (toothA > 0) o += '<g class="hot" style="opacity:' + toothA.toFixed(2) + '"' + hot("teeth") + '><path class="rb-tooth" d="' + D.rbPath(mir(crown(P.anat.up, G.UX, 1, 10.5), s), v, true) + '"/><path class="rb-tooth" d="' + D.rbPath(mir(crown(P.anat.lo, G.LX, -1, 10.5), s), v, true) + '"/></g>';
    o += '<path class="rb-muc" style="stroke-width:' + (2 * G.MUC * v.S) + '" d="' + D.rbPath(mir(mn.slice(G.MAN_ORAL[0], G.MAN_ORAL[1] + 1), s), v) + '"/>';
    o += '<path class="rb-bone hot"' + hot("cman") + ' d="' + D.rbPath(mir(mn, s), v, true) + '"/>';
  });
  /* the maxilla is one piece across the midline */
  o += '<path class="rb-muc" style="stroke-width:' + (2 * G.MUC * v.S) + '" d="' + D.rbPath(both(mx.slice(G.MAX_ORAL[0], G.MAX_ORAL[1] + 1)), v) + '"/>';
  o += '<path class="rb-bone hot"' + hot("cmax") + ' d="' + D.rbPath(both(mx), v, true) + '"/>';
  [1, -1].forEach(function (s) {
    if (u > 0) {
      o += '<path class="rb-ghost hot"' + hot("ghost") + ' d="' + D.rbPath(mir(G.MAX[0].slice(2, 7), s), v) + '"/><path class="rb-ghost hot"' + hot("ghost") + ' d="' + D.rbPath(mir(G.MAN[0].slice(2, 7), s), v) + '"/>';
      o += D.rbArrow(mir([G.MAX[0][G.CREST]], s)[0], mir([mx[G.CREST]], s)[0], v, "rb-amax") + D.rbArrow(mir([G.MAN[0][G.CREST]], s)[0], mir([mn[G.CREST]], s)[0], v, "rb-aman");
    }
    if (st.den && t >= 0.2) {
      var xl = mn[G.CREST][0], oralL = mn.slice(2, 7), intL = D.rbOff(oralL, 1, 1), polL = D.rbOff(oralL, 3.2, 1);
      var baseL = intL.concat([polL[polL.length - 1], [xl + 5.4, -5.6], [xl - 5.4, -5.6], polL[0]]);
      o += '<g class="hot"' + hot("den") + '><path class="rb-dtooth" d="' + D.rbPath(mir(crown(P.flat.up, mx[G.CREST][0], 1, 7), s), v, true) + '"/>';
      o += '<path class="rb-dtooth" d="' + D.rbPath(mir(crown(P.flat.lo, xl, -1, 7), s), v, true) + '"/><path class="rb-base" d="' + D.rbPath(mir(baseL, s), v, true) + '"/></g>';
    }
  });
  /* the upper denture's base, one piece over the palate: intaglio across, then the polished side back with the necks */
  if (st.den && t >= 0.2) {
    var xu = mx[G.CREST][0], oralU = mx.slice(2, 10), intU = D.rbOff(oralU, 1, -1), off3 = D.rbOff(oralU, 3.2, -1);
    var polR = [off3[0], [xu - 5.4, 5.6], [xu + 5.4, 5.6]].concat(off3.slice(3));
    var baseU = intU.concat(mir(intU.slice(0, intU.length - 1), -1).reverse(), mir(polR, -1), polR.slice(0, polR.length - 1).reverse());
    o += '<path class="rb-base hot"' + hot("den") + ' d="' + D.rbPath(baseU, v, true) + '"/>';
  }
  if (st.den && u > 0.75) o += D.rbText(180, 130, "posterior crossbite", "rb-bad", "middle");
  o += D.rbText(8, 15, "Back · through the first molars", "rb-head");
  o += D.rbText(8, 308, "maxilla: up and toward the midline", "rb-kmax") + D.rbText(8, 324, "mandible: down and outward", "rb-kman");
  return o;
}

/* the denture incisors move with their ridges; the lower one drops only as far as it must to clear the upper one */
function inPoly(pt, poly) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi) c = !c; } return c; }
function edgePts(poly) { const out = []; poly.forEach((p, i) => { const q = poly[(i + 1) % poly.length]; for (let k = 0; k < 12; k++) out.push([p[0] + (q[0] - p[0]) * k / 12, p[1] + (q[1] - p[1]) * k / 12]); }); return out; }
const CR = SAG.CREST, DYL = [];
for (let i = 0; i <= 20; i++) {
  const u = i / 20, dxU = (SAG.MAX[1][CR][0] - SAG.MAX[0][CR][0]) * u, dxL = (SAG.MAN[1][CR][0] - SAG.MAN[0][CR][0]) * u;
  const U = SAG.DUI.map(([x, y]) => [x + dxU, y]);
  let d = 0; for (; d < 5; d += 0.05) { const L = SAG.DLI.map(([x, y]) => [x + dxL, y - d]); if (!edgePts(L).some((p) => inPoly(p, U)) && !edgePts(U).some((p) => inPoly(p, L))) break; }
  DYL.push(-Math.round((d + 0.15) * 100) / 100);
}
SAG.DYL = DYL;
const DATA = { SAG, COR, SUM, HOT };
const HELPERS = [rbLerp, rbPath, rbOff, rbArrow, rbStage, rbText, rbSag, rbCor];
const DD = Object.assign({}, DATA, Object.fromEntries(HELPERS.map((fn) => [fn.name, fn])));
const st0 = { t: 0, den: false };
const svgS = figureSvg({ width: SAG.W, height: SAG.H, className: "rb-svg rb-sag", label: "Side view at the midline, patient facing right: the maxilla and mandible under the incisors, from natural teeth to long edentulous.", body: rbSag(st0, DD) });
const svgC = figureSvg({ width: COR.W, height: COR.H, className: "rb-svg rb-cor", label: "Frontal section through the first molars, patient's right at the left: both maxillary and mandibular ridges and the tongue, from natural teeth to long edentulous.", body: rbCor(st0, DD) });
const plate = plateHtml({ fig: "Fig 20", title: "How the ridges resorb", hint: "take the teeth out", readout: "natural teeth", body: `<div class="am-svg rb-box">${svgS}${svgC}</div>` });
const controls = `<div class="am-controls"><label class="am-slider rb-sl"><span>teeth</span><input type="range" data-rb="t" min="0" max="1" step="0.01" value="0" aria-label="Time: from natural teeth to long edentulous"><span>long edentulous</span></label><button type="button" class="am-btn" data-rbplay>Play</button><button type="button" class="am-btn" data-rbden aria-pressed="false">Set denture teeth</button></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Hover or tap the bone, a tooth or a dashed line.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From the L8 notes (Dr. Givan, the 11/5 recording): after the teeth are lost the maxillary anterior ridge resorbs upward and inward, the maxillary posterior upward and toward the midline, the mandibular anterior downward and forward, the mandibular posterior downward and outward; the maxilla's arch gets smaller and, at the level of the teeth, the edentulous mandible larger; denture teeth are generally set near the ridge, so posterior teeth are often set in crossbite (nothing wrong with that in a denture); a patient made skeletal Class III this way has a pseudo-Class III relationship.</li>
<li>Outside sources for the proportions: Tallgren's 25-year study of complete denture wearers found the residual ridges keep shrinking for decades, the lower faster than the upper (J Prosthet Dent 1972;27:120-32), and her study of immediate dentures found the lower anterior ridge lost about twice the height of the upper; the figure's mandible loses about twice the maxilla's height. Cawood and Howell's classification of the edentulous jaws found that the alveolar bone resorbs while the basal bone keeps its shape (Int J Oral Maxillofac Surg 1988;17:232-6), so the drawing moves only the ridges and keeps the bone beneath them still.</li>
<li>Schematic sections drawn to typical proportions, not traced from a patient; the amounts are typical, not one patient's. The jaws are kept at the same vertical relation throughout, as if at the denture's vertical dimension. Denture molars are drawn flat for simplicity. Educational, not clinical guidance.</li></ul></details>`;

function rbLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var sag = root.querySelector(".rb-sag"), cor = root.querySelector(".rb-cor"), sum = root.querySelector(".am-summary"), info = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]");
  var range = root.querySelector('[data-rb="t"]'), play = root.querySelector("[data-rbplay]"), den = root.querySelector("[data-rbden]");
  var st = { t: 0, den: false }, raf = 0;
  function draw() {
    sag.innerHTML = D.rbSag(st, D); cor.innerHTML = D.rbCor(st, D);
    var s = D.rbStage(st.t), u = Math.max(0, (st.t - 0.2) / 0.8);
    sum.textContent = s === 0 ? D.SUM.teeth : s === 1 ? D.SUM.out : st.den ? D.SUM.den : u > 0.75 ? D.SUM.long : D.SUM.resorb;
    if (readout) readout.textContent = s === 0 ? "natural teeth" : s === 1 ? "teeth out" : u < 0.35 ? "edentulous, early" : u < 0.75 ? "years without teeth" : "long edentulous";
  }
  range.addEventListener("input", function () { cancelAnimationFrame(raf); st.t = +range.value; draw(); });
  den.addEventListener("click", function () { st.den = !st.den; den.setAttribute("aria-pressed", String(st.den)); if (st.den && st.t < 0.2) { st.t = 1; range.value = 1; } draw(); });
  play.addEventListener("click", function () {
    cancelAnimationFrame(raf);
    if (reduce.matches) { st.t = 1; range.value = 1; draw(); return; }
    var t0 = performance.now(), from = st.t >= 0.99 ? 0 : st.t;
    function step(now) { var k = Math.min(1, from + (now - t0) / 4000); st.t = k; range.value = k; draw(); if (k < 1) raf = requestAnimationFrame(step); }
    raf = requestAnimationFrame(step);
  });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && root.contains(el)) info.textContent = el.getAttribute("data-info"); }
  root.querySelector(".rb-box").addEventListener("pointerover", hot); root.querySelector(".rb-box").addEventListener("click", hot);
  draw();
}

const CSS = `
.anima .rb-box{max-width:620px;margin:0 auto;display:flex;flex-wrap:wrap;justify-content:center;align-items:flex-start;gap:6px 10px}
.anima .am-svg.rb-box svg.rb-sag{flex:210 1 176px;width:auto;max-width:240px}
.anima .am-svg.rb-box svg.rb-cor{flex:360 1 302px;width:auto;max-width:412px}
.anima .rb-sl input{flex:1}
.anima .rb-svg .rb-t{fill:var(--anatomy-text);font:10.5px var(--anatomy-mono);paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round}
.anima .rb-svg .rb-head{fill:var(--anatomy-muted)}
.anima .rb-svg .rb-kmax{fill:var(--anatomy-lit);font-weight:700}
.anima .rb-svg .rb-kman{fill:#2f8a5b;font-weight:700}
.anima .rb-svg .rb-bad{fill:var(--tm-vessel);font-weight:700;font-size:11.5px}
.anima .rb-svg .rb-bone{fill:var(--tm-bone);stroke:var(--anatomy-mid);stroke-width:.9;stroke-linejoin:round}
.anima .rb-svg .rb-muc{fill:none;stroke:var(--tm-retro);stroke-linejoin:round;stroke-linecap:round}
.anima .rb-svg .rb-tongue{fill:var(--tm-muscle);fill-opacity:.55;stroke:var(--tm-muscle-fib);stroke-width:.8}
.anima .rb-svg .rb-tooth{fill:var(--anatomy-face);stroke:var(--anatomy-hi);stroke-width:1;stroke-linejoin:round}
.anima .rb-svg .rb-dtooth{fill:var(--anatomy-face);stroke:var(--anatomy-hi);stroke-width:1;stroke-linejoin:round}
.anima .rb-svg .rb-base{fill:var(--dn-base);stroke:var(--dn-base-edge);stroke-width:1;stroke-linejoin:round}
.anima .rb-svg .rb-ghost{fill:none;stroke:var(--anatomy-muted);stroke-width:1.2;stroke-dasharray:3 3}
.anima .rb-svg .rb-amax{fill:none;stroke:var(--anatomy-lit);stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.anima .rb-svg .rb-aman{fill:none;stroke:#2f8a5b;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.anima .rb-svg{--dn-base:#efb7b8;--dn-base-edge:#b8646a}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]) .anima .rb-svg{--dn-base:#8c4d55;--dn-base-edge:#d48b90} }
:root[data-theme="dark"] .anima .rb-svg{--dn-base:#8c4d55;--dn-base-edge:#d48b90}
`;

export function resorb() {
  return {
    id: "resorb", lec: "dentures",
    title: "How the ridges resorb",
    caption: "Take the teeth out and run the years forward: the maxilla resorbs up and in, the mandible down and out. Then set denture teeth near the ridges and see why posterior teeth are often set in crossbite.",
    html: `<div class="anima" data-anima="resorb">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: rbLive.toString(),
    helpers: HELPERS,
    data: DATA,
  };
}
