// Fig: a thymic lobule and T cell education (L19 Introduction to Hematology, Dr. Herr, from the slides). One lobule cut
// through, drawn anew in code as a schematic section: the capsule and a trabecula on each side, the cortex dark with
// densely packed thymocytes, the pale medulla with its epithelioreticular cells and Hassall's corpuscles, a postcapillary
// venule where the precursors come in and one where the T cells leave, and a cortical capillary whose wall (inset A) shows
// the three layers of the blood-thymus barrier. Next and Play walk one thymocyte through its education, with its CD
// markers at each stage (in, out to the cortex edge, dividing and gaining its receptor, positive selection in the cortex,
// negative selection in the medulla, out as a single-positive cell); the stage list on the right keeps the order in
// view. Hide names turns the regions and the barrier's layers into a self-test. Every part explains itself on hover or
// tap. The thymocyte moves between stages with a CSS animation that reduced motion turns off.
import { makeFig, f1, T, L, HOT } from "./shared.mjs";

const W = 460, H = 604;
const TOP = 336; /* the section's cut bottom edge */

/* ---------- build-time geometry ---------- */
function rng(seed) {
  let a = seed >>> 0;
  return function () { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function sm(p, open) {
  /* smooth path through p (Catmull-Rom as cubic Beziers), closed unless open */
  const n = p.length; let d = "M" + f1(p[0][0]) + " " + f1(p[0][1]);
  const last = open ? n - 1 : n;
  for (let i = 0; i < last; i++) {
    const a = p[open ? Math.max(0, i - 1) : (i - 1 + n) % n], b = p[i], c = p[open ? i + 1 : (i + 1) % n], e = p[open ? Math.min(n - 1, i + 2) : (i + 2) % n];
    d += "C" + f1(b[0] + (c[0] - a[0]) / 6) + " " + f1(b[1] + (c[1] - a[1]) / 6) + " " + f1(c[0] - (e[0] - b[0]) / 6) + " " + f1(c[1] - (e[1] - b[1]) / 6) + " " + f1(c[0]) + " " + f1(c[1]);
  }
  return d + (open ? "" : "Z");
}
const blob = (cx, cy, r, wob, seed, n) => { const p = []; n = n || 14; for (let i = 0; i < n; i++) { const a = i / n * 2 * Math.PI, k = 1 + wob * Math.sin(3 * a + seed) + wob * 0.6 * Math.sin(5 * a + 2 * seed); p.push([cx + r * k * Math.cos(a), cy + r * k * Math.sin(a)]); } return sm(p); };
const ell = (cx, cy, rx, ry, rot, wob, seed) => { const p = [], n = 12; for (let i = 0; i < n; i++) { const t = i / n * 2 * Math.PI, k = 1 + (wob || 0) * Math.sin(3 * t + (seed || 0)), x = rx * k * Math.cos(t), y = ry * k * Math.sin(t), c = Math.cos(rot || 0), s = Math.sin(rot || 0); p.push([cx + x * c - y * s, cy + x * s + y * c]); } return sm(p); };
/* the organ's surface (top of the capsule), the capsule's inner edge, and the cortex/medulla boundary */
const capTop = (x) => 33 + Math.pow((x - 230) / 230, 2) * 12;
const capIn = (x) => capTop(x) + 10;
const medTop = (x) => 178 + 150 * Math.pow(Math.abs(x - 230) / 230, 1.7) + 3 * Math.sin(x / 21);
/* the two trabeculae: a tapered band from the capsule down to a tip */
const TRAB = [{ x: 30, tip: 252, w: 15 }, { x: 430, tip: 252, w: 15 }];
function trabW(t, y) { const y0 = capIn(t.x), f = Math.max(0, (t.tip - y) / (t.tip - y0)); return t.w / 2 * Math.pow(f, 0.55); }
function inTrab(x, y, pad) { return TRAB.some((t) => y < t.tip + pad && Math.abs(x - t.x) < trabW(t, y) + pad); }
/* where the stage's actors sit */
const P = [null, [149, 202], [196, 64], [252, 92], [316, 148], [300, 242], [368, 276]];
const SPOT = {
  vin: [134, 213], vout: [392, 287], cap: [52, 234], hc: [222, 286], hc2: [112, 320],
  erc: [342, 136], mac: [282, 170], apc: [326, 256],
};
/* nothing else is drawn on these */
const KEEP = [[134, 213, 15], [392, 287, 15], [52, 234, 11], [222, 286, 19], [112, 320, 11], [342, 136, 16], [282, 170, 14], [326, 256, 15]];
const free = (x, y, pad) => KEEP.every((k) => Math.hypot(x - k[0], y - k[1]) > k[2] + (pad || 0));

function tyArt() {
  const A = {}, R = rng(19);
  /* the section's ground: cortex color everywhere under the capsule (the neighboring lobules' cortex too) */
  let top = []; for (let x = 6; x <= 454; x += 16) top.push([x, capTop(x)]);
  const edge = "M6 " + f1(capTop(6)) + top.map((p) => "L" + f1(p[0]) + " " + f1(p[1])).join("") + "L454 " + f1(capTop(454)) + "L454 " + (TOP - 8) + "Q454 " + TOP + " 446 " + TOP + "L14 " + TOP + "Q6 " + TOP + " 6 " + (TOP - 8) + "Z";
  A.GROUND = '<path class="ty-cx" d="' + edge + '"/>';
  /* the medulla: everything under the boundary */
  let mp = []; for (let x = 6; x <= 454; x += 8) mp.push([x, Math.min(TOP, medTop(x))]);
  A.MED = '<path class="ty-md" d="M6 ' + f1(Math.min(TOP, medTop(6))) + mp.map((p) => "L" + f1(p[0]) + " " + f1(p[1])).join("") + "L454 " + (TOP - 8) + "Q454 " + TOP + " 446 " + TOP + "L14 " + TOP + "Q6 " + TOP + ' 6 ' + (TOP - 8) + 'Z"/>';
  A.MEDLINE = '<path class="ty-cmj" d="' + sm(mp.filter((p, i) => i % 2 === 0), true) + '"/>';
  /* cortex thymocytes: small dark nuclei, packed */
  let cd = "", cd2 = "";
  for (let y = capIn(230) + 3; y < TOP; y += 5.2) for (let x = 8; x < 453; x += 5.4) {
    const px = Math.round(x + (R() - 0.5) * 3), py = Math.round(y + (R() - 0.5) * 3);
    if (py < capIn(px) + 2.5 || py > medTop(px) - 2.5 || py > TOP - 3 || inTrab(px, py, 2.5) || !free(px, py, 1)) continue;
    if (R() < 0.18) cd2 += "M" + px + " " + py + "h0"; else cd += "M" + px + " " + py + "h0";
  }
  A.CDOT = '<path class="ty-cd" d="' + cd + '"/><path class="ty-cd2" d="' + cd2 + '"/>';
  /* medulla: fewer, bigger thymocytes, and the epithelioreticular cells with pale nuclei */
  let md = "", erc = "", ercp = "";
  for (let y = 182; y < TOP; y += 10.5) for (let x = 12; x < 450; x += 11) {
    const px = Math.round(x + (R() - 0.5) * 8), py = Math.round(y + (R() - 0.5) * 8);
    if (py < medTop(px) + 5 || py > TOP - 5 || !free(px, py, 3)) continue;
    if (R() < 0.16 && py < TOP - 16 && px > 20 && px < 440) { const rot = R() * 3; erc += ell(px, py, 4.6, 3, rot, 0.05, R() * 6); const a = rot + 1.2; ercp += "M" + f1(px + 5 * Math.cos(a)) + " " + f1(py + 5 * Math.sin(a)) + "q" + f1(4 * Math.cos(a + 0.5)) + " " + f1(4 * Math.sin(a + 0.5)) + " " + f1(9 * Math.cos(a)) + " " + f1(9 * Math.sin(a)); }
    else if (R() < 0.8) md += "M" + px + " " + py + "h0";
  }
  A.MDOT = '<path class="ty-ercp" d="' + ercp + '"/><path class="ty-md-d" d="' + md + '"/><path class="ty-erc" d="' + erc + '"/>';
  /* the trabeculae and the capsule: dense connective tissue with its fibers */
  A.TRAB = TRAB.map((t) => {
    const L1 = [], R1 = []; for (let y = capIn(t.x) - 2; y <= t.tip; y += 12) { const w = trabW(t, y); L1.push([t.x - w + 0.6 * Math.sin(y / 9), y]); R1.unshift([t.x + w + 0.6 * Math.sin(y / 11), y]); }
    const pts = L1.concat([[t.x, t.tip + 2]]).concat(R1);
    let fib = ""; for (let k = -1; k <= 1; k++) { fib += "M" + f1(t.x + k * 3.2) + " " + f1(capIn(t.x) + 2) + "Q" + f1(t.x + k * 2.4 + 1.5) + " " + f1((capIn(t.x) + t.tip) / 2) + " " + f1(t.x + k * 0.6) + " " + f1(t.tip - 30 - Math.abs(k) * 20); }
    return '<path class="ty-ct" d="M' + pts.map((p) => f1(p[0]) + " " + f1(p[1])).join("L") + 'Z"/><path class="ty-fib" d="' + fib + '"/>';
  }).join("");
  let cap = []; for (let x = 6; x <= 454; x += 12) cap.push([x, capTop(x)]);
  let capi = []; for (let x = 454; x >= 6; x -= 12) capi.push([x, capIn(x)]);
  let cfib = ""; for (let k = 0; k < 3; k++) { cfib += "M10 " + f1(capTop(10) + 2.6 + k * 2.6); for (let x = 22; x <= 450; x += 12) cfib += "L" + x + " " + f1(capTop(x) + 2.6 + k * 2.6 + 0.5 * Math.sin(x / 7 + k)); }
  A.CAP = '<path class="ty-ct" d="M' + cap.concat(capi).map((p) => f1(p[0]) + " " + f1(p[1])).join("L") + 'Z"/><path class="ty-fib" d="' + cfib + '"/>';
  /* Hassall's corpuscles: concentric flattened epithelial cells, pink */
  const hass = (c, r) => { let o = '<path class="ty-hc" d="' + blob(c[0], c[1], r, 0.05, 2, 16) + '"/>'; for (let k = 1; k <= 4; k++) o += '<path class="ty-hcl" d="' + blob(c[0] + k * 0.4, c[1] - k * 0.3, r * (1 - k * 0.19), 0.06, k, 14) + '"/>'; return o + '<path class="ty-hcc" d="' + blob(c[0] + 1.8, c[1] - 1.4, r * 0.16, 0.1, 5, 8) + '"/>'; };
  A.HC = hass(SPOT.hc, 16); A.HC2 = hass(SPOT.hc2, 9);
  /* vessels: two postcapillary venules at the corticomedullary junction, and a cortical capillary */
  const venule = (c, rot) => {
    let o = '<path class="ty-vw" d="' + ell(c[0], c[1], 13, 8.5, rot, 0.03, 1) + '"/><path class="ty-vl" d="' + ell(c[0], c[1], 8.6, 4.6, rot, 0.04, 3) + '"/>';
    for (let i = 0; i < 7; i++) { const t = i / 7 * 2 * Math.PI, x = 10.8 * Math.cos(t), y = 6.6 * Math.sin(t), cs = Math.cos(rot), sn = Math.sin(rot); o += '<path class="ty-en" d="' + ell(c[0] + x * cs - y * sn, c[1] + x * sn + y * cs, 2.3, 1.5, t + rot + Math.PI / 2, 0, 0) + '"/>'; }
    return o + '<ellipse class="ty-rbc" cx="' + f1(c[0] - 2) + '" cy="' + f1(c[1]) + '" rx="3.4" ry="2.4"/>';
  };
  A.VIN = venule(SPOT.vin, -0.35); A.VOUT = venule(SPOT.vout, 0.4);
  A.CAPI = '<circle class="ty-vw" cx="' + SPOT.cap[0] + '" cy="' + SPOT.cap[1] + '" r="6.4"/><circle class="ty-vl" cx="' + SPOT.cap[0] + '" cy="' + SPOT.cap[1] + '" r="4"/><ellipse class="ty-rbc" cx="' + (SPOT.cap[0] - 0.5) + '" cy="' + SPOT.cap[1] + '" rx="2.6" ry="1.9"/>';
  /* the cortex's epithelioreticular cell (hidden by thymocytes everywhere else), its macrophage, and the medulla's presenting cell */
  const star = (c, r, n, seed) => { const p = []; for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * 2 * Math.PI + seed, rr = i % 2 ? r * 0.42 : r * (0.95 + 0.12 * Math.sin(i * 1.7 + seed)); p.push([c[0] + rr * Math.cos(a), c[1] + rr * Math.sin(a)]); } return sm(p); };
  A.ERC = '<path class="ty-ercb" d="' + star(SPOT.erc, 15, 5, 0.3) + '"/><path class="ty-ercn" d="' + ell(SPOT.erc[0] + 1, SPOT.erc[1], 5, 3.4, 0.3, 0.04, 2) + '"/>';
  A.MAC = '<path class="ty-mac" d="' + blob(SPOT.mac[0], SPOT.mac[1], 11, 0.08, 4, 16) + '"/><path class="ty-macn" d="' + ell(SPOT.mac[0] - 4, SPOT.mac[1] + 2, 3.8, 2.6, 0.5, 0.05, 1) + '"/><circle class="ty-vac" cx="' + (SPOT.mac[0] + 4) + '" cy="' + (SPOT.mac[1] - 3) + '" r="2.2"/><circle class="ty-vac" cx="' + (SPOT.mac[0] + 2) + '" cy="' + (SPOT.mac[1] + 5) + '" r="1.6"/>';
  A.APC = '<path class="ty-apc" d="' + star(SPOT.apc, 14, 6, 1.1) + '"/><path class="ty-ercn" d="' + ell(SPOT.apc[0], SPOT.apc[1], 4.4, 3.2, 1, 0.04, 3) + '"/>';
  /* inset A: the capillary wall, magnified, as a stack of layers */
  A.INSET = insetArt(R);
  return A;
}
/* inset A: x 14..96, from the thymocytes (top) to the blood (bottom) */
const IN = { x0: 14, x1: 96, y0: 384 };
const LAY = { thy: [384, 414], erc: [415, 433], bl2: 434, pv: [435, 479], bm: 480, en: [481, 491], lum: [492, 588] };
function insetArt(R) {
  const o = {}, x0 = IN.x0, x1 = IN.x1, wv = (y, k) => { let d = "M" + x0 + " " + f1(y); for (let x = x0 + 6; x <= x1; x += 6) d += "L" + x + " " + f1(y + 0.8 * Math.sin(x / 9 + k)); return d; };
  o.lum = '<path class="ty-ilum" d="M' + x0 + " " + LAY.lum[0] + "H" + x1 + "V" + (LAY.lum[1] - 6) + "Q" + x1 + " " + LAY.lum[1] + " " + (x1 - 6) + " " + LAY.lum[1] + "H" + (x0 + 6) + "Q" + x0 + " " + LAY.lum[1] + " " + x0 + " " + (LAY.lum[1] - 6) + 'Z"/>' +
    '<ellipse class="ty-rbc" cx="38" cy="526" rx="13" ry="9"/><ellipse class="ty-rbcc" cx="38" cy="526" rx="6" ry="4"/><ellipse class="ty-rbc" cx="74" cy="558" rx="12" ry="8.4" transform="rotate(-18 74 558)"/><ellipse class="ty-rbcc" cx="74" cy="558" rx="5.4" ry="3.6" transform="rotate(-18 74 558)"/>' +
    '<circle class="ty-ilym" cx="70" cy="514" r="8.5"/><circle class="ty-ilymn" cx="70.6" cy="514" r="6.6"/>' +
    '<path class="ty-ag" d="M26 566l3.2 5.6h-6.4zM50 572l3.2 5.6h-6.4zM86 520l3.2 5.6h-6.4z"/>';
  /* the endothelium: thin flat cells with long nuclei, on its basement membrane */
  let en = '<path class="ty-ien" d="M' + x0 + " " + LAY.en[0] + "H" + x1 + "V" + LAY.en[1] + "H" + x0 + 'Z"/>';
  for (let x = x0 + 14; x < x1; x += 30) en += '<ellipse class="ty-ienn" cx="' + x + '" cy="' + (LAY.en[0] + 5) + '" rx="9" ry="2.4"/>';
  for (let x = x0 + 29; x < x1; x += 30) en += '<path class="ty-iseam" d="M' + x + " " + LAY.en[0] + "V" + LAY.en[1] + '"/>';
  o.en = en; o.bm = '<path class="ty-ibm" d="' + wv(LAY.bm, 0) + '"/>';
  /* perivascular connective tissue: loose matrix, a few collagen fibers, a macrophage */
  let pv = '<path class="ty-ipv" d="M' + x0 + " " + LAY.pv[0] + "H" + x1 + "V" + LAY.pv[1] + "H" + x0 + 'Z"/><path class="ty-ifib" d="M' + x0 + ' 444C30 440 40 450 58 446M' + (x0 + 2) + ' 470C24 466 34 476 44 472M70 441C80 446 88 440 ' + x1 + ' 445M80 474C86 470 90 476 ' + x1 + ' 472"/>';
  pv += '<path class="ty-imac" d="' + blob(62, 457, 14, 0.07, 3, 18) + '"/><path class="ty-imacn" d="' + ell(56, 459, 6, 4, 0.4, 0.05, 2) + '"/><circle class="ty-vac" cx="68" cy="451" r="3"/><circle class="ty-vac" cx="70" cy="463" r="2.2"/><circle class="ty-ivac2" cx="63" cy="447" r="1.6"/>';
  o.pv = pv;
  /* the epithelioreticular cells: flattened, pale nuclei, sitting on their own basal lamina */
  let erc = ""; [[27, 0.06], [55, -0.05], [83, 0.05]].forEach((c, i) => { erc += '<path class="ty-ierc" d="' + ell(c[0], 424, 13.2, 7.2, c[1], 0.03, i) + '"/><path class="ty-iercn" d="' + ell(c[0] + 1, 423.5, 5.6, 3.2, c[1], 0.03, i + 2) + '"/>'; });
  o.erc = erc; o.bl2 = '<path class="ty-ibm" d="' + wv(LAY.bl2, 2) + '"/>';
  /* the thymocytes outside the barrier */
  let th = "";
  [[22, 393], [37, 391], [52, 394], [67, 391], [82, 393], [29, 406], [44, 405], [59, 407], [74, 405], [89, 407]].forEach((c) => { th += '<circle class="ty-ithy" cx="' + c[0] + '" cy="' + c[1] + '" r="6.4"/><circle class="ty-ithyn" cx="' + (c[0] + 0.4) + '" cy="' + c[1] + '" r="5"/>'; });
  o.thy = th;
  return o;
}

/* ---------- page helpers (serialized into the page) ---------- */
function tyTok(x, y, cls, txt) {
  /* one thymocyte, drawn bigger than the section's dots */
  return '<g class="ty-tok' + (cls ? " " + cls : "") + '"><circle class="ty-tokc" cx="' + x + '" cy="' + y + '" r="8"/><circle class="ty-tokn" cx="' + (x + 0.6) + '" cy="' + (y - 0.4) + '" r="5.6"/>' + (txt ? T(x, y + 4, txt, "ty-tokt", "middle") : "") + "</g>";
}
function tyChip(x, y, lines, end) {
  var w = 0; lines.forEach(function (s) { w = Math.max(w, s.length); }); w = Math.round(w * 7.1 + 14);
  var x0 = end ? x - w : x, h = 8 + lines.length * 14, o = '<rect class="ty-chip" x="' + x0 + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="7"/>';
  lines.forEach(function (s, i) { o += T(x0 + 7, y + 16 + i * 14, s, "ty-chipt", "start"); });
  return o;
}
function tyRender(st, D) {
  var s = st.s, hide = !!st.hide, o = "", S = D.STEPS[s];
  /* remember where the thymocyte was, so a change of stage moves it there */
  var from = st._last === undefined ? s : st._last; st._last = s;
  function nm(t) { return hide ? "?" : t; }
  /* ----- the lobule ----- */
  o += HOT("A thymic lobule. The thymus is largest and most active in the newborn and before adolescence (about 12 to 15 grams at birth, 30 to 40 grams by puberty); from the early teens it involutes, and fat replaces it.", D.ART.GROUND);
  o += HOT("The cortex: packed with developing T cells (thymocytes), mostly small lymphocytes, so densely that they hide the epithelioreticular cells, so it stains darker. Cortical thymocytes divide often, then move into the medulla as they mature.", D.ART.CDOT);
  o += HOT("The medulla, the inner part of the lobule: more epithelioreticular cells, with pale nuclei, and loosely packed, bigger T cells, so it stains lighter. Macrophages and dendritic cells are found in both regions.", D.ART.MED + D.ART.MDOT);
  o += D.ART.MEDLINE;
  o += HOT("Hassall's corpuscles, the medulla's distinguishing feature: concentric layers of flattened epithelial cells that stain acidophilic (pink).", D.ART.HC + D.ART.HC2);
  o += HOT("A trabecula: dense connective tissue from the capsule that divides the thymus into lobules. Like the capsule, it carries blood vessels, nerves and efferent, but not afferent, lymphatics.", D.ART.TRAB);
  o += HOT("The capsule, from mesoderm, like the trabeculae: it carries blood vessels, nerves and efferent, but not afferent, lymphatic vessels.", D.ART.CAP);
  var on4 = s === 4, on5 = s === 5;
  o += HOT("An epithelioreticular cell. These cells form the thymus's stroma, its framework, from their cell processes instead of reticular fibers: the exception among the lymphoid organs. They come from the endoderm of the pharyngeal pouches. In the cortex they present antigen on MHC molecules for positive selection.", '<g class="ty-actor' + (on4 ? " is-on" : "") + '">' + D.ART.ERC + "</g>");
  o += HOT("A cortical macrophage: it phagocytoses the thymocytes that fail their thymic education and die by apoptosis.", '<g class="ty-actor' + (on4 ? " is-on" : "") + '">' + D.ART.MAC + "</g>");
  o += HOT("In the medulla, cells display self antigen on self MHC; a thymocyte aimed at it is eliminated (negative selection).", '<g class="ty-actor' + (on5 ? " is-on" : "") + '">' + D.ART.APC + "</g>");
  var vIn = s === 1, vOut = s === 6;
  o += HOT("A postcapillary venule at the corticomedullary junction: T cell precursors from the bone marrow enter the thymus through these venules.", '<g class="ty-actor' + (vIn ? " is-on" : "") + '">' + D.ART.VIN + "</g>");
  o += HOT("A postcapillary venule: the T cells that pass both selections leave through these venules into the circulation.", '<g class="ty-actor' + (vOut ? " is-on" : "") + '">' + D.ART.VOUT + "</g>");
  o += HOT("A capillary in the cortex: the blood-thymus barrier wraps the cortical capillaries, where the developing thymocytes are. Its wall is magnified in inset A.", D.ART.CAPI + '<circle class="ty-zoom" cx="' + D.SPOT.cap[0] + '" cy="' + D.SPOT.cap[1] + '" r="11"/><circle class="ty-badge" cx="' + (D.SPOT.cap[0] + 11) + '" cy="' + (D.SPOT.cap[1] - 11) + '" r="7.5"/>' + T(D.SPOT.cap[0] + 11, D.SPOT.cap[1] - 7, "A", "ty-badget", "middle"));

  /* ----- labels: the regions always, the parts in the overview ----- */
  o += T(96, 120, nm("cortex"), "ty-reg", "middle") + (hide ? "" : T(96, 135, "dark, packed", "ty-s", "middle"));
  o += T(162, 290, nm("medulla"), "ty-reg", "middle") + (hide ? "" : T(162, 305, "pale", "ty-s", "middle"));
  if (s === 0) {
    o += L(92, 22, nm("capsule"), 110, 37, "end", "ty-s");
    o += L(452, 22, nm("trabecula"), 431, 92, "end", "ty-s");
    o += L(248, 329, nm("Hassall's corpuscle"), 233, 299, "start", "ty-s");
    o += L(118, 180, nm("postcapillary"), 128, 205, "end", "ty-s") + (hide ? "" : T(118, 193, "venule", "ty-s", "end"));
    o += T(66, 256, nm("capillary"), "ty-s", "start");
  }
  if (s === 1) o += L(118, 180, "postcapillary", 128, 205, "end", "ty-s") + T(118, 193, "venule", "ty-s", "end");
  if (s === 4) { o += T(452, 99, "epithelioreticular cell", "ty-s", "end") + L(452, 112, "presents MHC", 353, 129, "end", "ty-s"); o += L(256, 190, "macrophage", 272, 177, "end", "ty-s"); }
  if (s === 5) o += L(452, 230, "self antigen on", 338, 250, "end", "ty-s") + T(452, 243, "self MHC", "ty-s", "end");
  if (s === 6) o += L(408, 258, "venule", 399, 279, "start", "ty-s");

  /* ----- the thymocyte's trail and the stage's events ----- */
  if (s > 0) {
    var tr = "M" + D.P[1][0] + " " + D.P[1][1]; for (var i = 2; i <= s; i++) tr += "L" + D.P[i][0] + " " + D.P[i][1];
    o += '<path class="ty-trail" d="' + tr + '"/>';
    D.P.forEach(function (p, i) { if (i && i < s) o += '<circle class="ty-was" cx="' + p[0] + '" cy="' + p[1] + '" r="2.6"/>'; });
  }
  if (s === 3) o += tyTok(266, 104, "ty-dau", "");
  if (s === 4) {
    /* thymocytes that failed: apoptotic, broken up, one inside the macrophage */
    o += HOT("A thymocyte that failed positive selection: it dies by apoptosis (its nucleus breaks up), and the macrophage clears it.", '<g class="ty-die"><circle class="ty-tokc" cx="262" cy="160" r="6.5"/><circle class="ty-frag" cx="260" cy="158" r="2"/><circle class="ty-frag" cx="264.5" cy="161" r="1.6"/><circle class="ty-frag" cx="261" cy="163" r="1.3"/></g><circle class="ty-frag" cx="285" cy="172" r="1.8"/>');
    o += T(250, 146, "dies", "ty-s ty-bad", "end");
  }
  if (s === 5) {
    o += HOT("A thymocyte aimed at self antigen on self MHC: negative selection eliminates it.", tyTok(344, 276, "ty-x", "") + '<path class="ty-xm" d="M338 270l12 12M350 270l-12 12"/>');
    o += T(362, 300, "self-reactive:", "ty-s ty-bad", "start") + T(362, 313, "eliminated", "ty-s ty-bad", "start");
  }
  if (s > 0) {
    var p = D.P[s], q = D.P[from] || p, mv = from !== s ? ' style="--fx:' + (q[0] - p[0]) + "px;--fy:" + (q[1] - p[1]) + 'px"' : "";
    var info = "The thymocyte we follow. " + S.say;
    if (s === 6) o += HOT(info, '<g class="ty-mv"' + mv + ">" + tyTok(p[0], p[1], "ty-me", "4") + tyTok(p[0] + 14, p[1] - 20, "ty-me ty-cd8", "8") + "</g>");
    else o += HOT(info, '<g class="ty-mv"' + mv + ">" + tyTok(p[0], p[1], "ty-me", "") + "</g>");
    var c = S.chip;
    o += '<g class="ty-chipg">' + tyChip(c[0], c[1], S.mk, c[2]) + "</g>";
  }

  /* ----- inset A: the blood-thymus barrier ----- */
  var I = D.ART.INSET, bx = 106;
  o += '<rect class="ty-panel" x="6" y="350" width="234" height="246" rx="12"/>' + T(16, 370, "A · BLOOD-THYMUS BARRIER", "ty-h", "start");
  o += HOT("The blood in the capillary's lumen: antigens and the mature lymphocytes circulating in it stay on this side of the barrier.", I.lum);
  o += HOT("Barrier layer 1: the capillary endothelium and its basement membrane.", '<g class="ty-lay">' + I.en + I.bm + "</g>");
  o += HOT("Barrier layer 2: macrophages in the perivascular connective tissue, which sits between the endothelium's basal lamina and the epithelioreticular cells' basal lamina.", '<g class="ty-lay">' + I.pv + "</g>");
  o += HOT("Barrier layer 3: the epithelioreticular cells, on their own basal lamina, wrapping the capillary.", '<g class="ty-lay">' + I.erc + I.bl2 + "</g>");
  o += HOT("The developing thymocytes of the cortex: the blood-thymus barrier protects them from antigens and keeps them apart from the mature lymphocytes circulating in the blood.", I.thy);
  function lay(n, y, ty, a, b) {
    var s2 = '<path class="lead" d="M88 ' + ty + "L" + (bx - 6.5) + " " + y + '"/><circle class="dot" cx="88" cy="' + ty + '" r="1.8"/>';
    if (n) s2 += '<circle class="ty-num" cx="' + bx + '" cy="' + y + '" r="6.5"/>' + T(bx, y + 4, n, "ty-numt", "middle");
    s2 += T(n ? bx + 10 : bx - 4, y + 4, hide ? "?" : a, "ty-s" + (n ? "" : ""), "start");
    if (b && !hide) s2 += T(n ? bx + 10 : bx - 4, y + 17, b, "ty-s", "start");
    return s2;
  }
  o += lay("", 398, 398, "thymocytes", "");
  o += lay("3", 422, 424, "epithelioreticular", "cells");
  o += lay("2", 452, 457, "perivascular", "macrophages");
  o += lay("1", 486, 486, "endothelium +", "basement membrane");
  o += lay("", 540, 540, "blood", "");

  /* ----- the stage list ----- */
  o += '<rect class="ty-panel" x="246" y="350" width="208" height="246" rx="12"/>' + T(256, 370, "T CELL EDUCATION", "ty-h", "start");
  D.STAGES.forEach(function (g, i) {
    var n = i + 1, y = 380 + i * 35, cls = s === n ? " is-now" : s > n ? " is-done" : s ? " is-next" : "";
    o += '<g class="ty-row' + cls + '">' + (s === n ? '<rect class="ty-now" x="250" y="' + (y - 1) + '" width="200" height="33" rx="8"/>' : "") +
      '<circle class="ty-num" cx="262" cy="' + (y + 11) + '" r="7.5"/>' + T(262, y + 15, String(n), "ty-numt", "middle") +
      T(276, y + 11, g[0], "ty-sn", "start") + T(276, y + 25, g[1], "ty-sm", "start") + "</g>";
  });
  return o;
}
function tySay(st, D) {
  var S = D.STEPS[st.s];
  if (st.hide && st.s === 0) return ["Names hidden: name the lobule's regions and the barrier's three layers, then hover or tap each to check. Press Next to follow a T cell through its education.", S.ro + " · names hidden"];
  return [S.say, S.ro + (st.hide ? " · names hidden" : "")];
}

const STAGES = [
  ["enters by a venule", "CD4− CD8−, from marrow"],
  ["out to the cortex edge", "CD2, CD7: early"],
  ["divides, gains a TCR", "CD1, then CD3, CD4+ CD8+"],
  ["positive selection", "cortex: MHC recognized"],
  ["negative selection", "medulla: self antigen"],
  ["leaves by a venule", "CD4+ or CD8+"],
];
const STEPS = [
  { ro: "lobule · cortex and medulla",
    say: "A thymic lobule. The capsule and the trabeculae carry blood vessels, nerves and efferent, but not afferent, lymphatics. The cortex is packed with developing T cells, the thymocytes, so it stains darker; the medulla has more epithelioreticular cells and fewer, bigger T cells, so it stains lighter, and Hassall's corpuscles mark it. Press Next to follow a T cell through its education, or tap a layer of the barrier in inset A." },
  { ro: "step 1 of 6 · CD4− CD8−", mk: ["CD4− CD8−"], chip: [161, 214, false],
    say: "The precursors (CFU-LyT) come from the bone marrow immunoincompetent, negative for both CD4 and CD8. They enter the thymus through postcapillary venules, at the medulla." },
  { ro: "step 2 of 6 · CD2, CD7", mk: ["CD2, CD7"], chip: [210, 54, false],
    say: "They migrate out to the cortex, at the edge of the lobule. CD2 and CD7 mark this early stage." },
  { ro: "step 3 of 6 · CD4+ CD8+", mk: ["CD1, then TCR,", "CD3, CD4+ CD8+"], chip: [282, 56, false],
    say: "In the cortex they divide often and rearrange their T cell receptor genes, which gives the receptors their antigenic diversity. CD1 marks a middle stage; then they express the T cell receptor, CD3, and both CD4 and CD8." },
  { ro: "step 4 of 6 · positive selection", mk: ["sees MHC:", "survives"], chip: [332, 160, false],
    say: "Positive selection, in the cortex: the epithelioreticular cells present antigen on MHC molecules. A thymocyte whose receptor recognizes them survives; one that doesn't dies by apoptosis, and the cortex's macrophages clear it. About 95 to 99 percent of thymocytes die during selection." },
  { ro: "step 5 of 6 · negative selection", mk: ["not aimed at self:", "survives"], chip: [290, 202, true],
    say: "Negative selection, in the medulla: the thymocytes aimed at self antigen displayed on self MHC are eliminated. The survivors are ready for an immune response." },
  { ro: "step 6 of 6 · CD4+ or CD8+", mk: ["CD4+ helper or", "CD8+ cytotoxic"], chip: [452, 297, true],
    say: "The cells that pass both tests are single-positive: CD4-positive helper or CD8-positive cytotoxic T cells. They leave through postcapillary venules into the circulation, for the T cell areas: the paracortex of the lymph nodes, the spleen's periarteriolar lymphatic sheaths and the Peyer's patches' interfollicular regions." },
];

export default function thymus() {
  const D = { INIT: { s: 0, hide: false }, STEPKEY: "s", STEPMAX: 6, PLAYMS: 3000, STEPS, STAGES, P, SPOT, ART: tyArt() };
  return makeFig({
    id: "thymus", lec: "hemeintro", fig: "Fig 15", short: "A thymic lobule", hint: "step · hover",
    title: "A thymic lobule and T cell education",
    caption: "One lobule of the thymus: the dark cortex, the pale medulla with its Hassall's corpuscles, and the blood-thymus barrier around a cortical capillary (inset A). Press Next to follow a T cell from the venule where it enters, through positive and negative selection, to the venule where it leaves.",
    W, H,
    label: "A schematic section of one thymic lobule: the capsule on top and a trabecula on each side, a dark outer cortex packed with small thymocytes, and a pale inner medulla with epithelioreticular cells and Hassall's corpuscles. Postcapillary venules sit at the corticomedullary junction. Inset A magnifies a cortical capillary's wall: the endothelium and its basement membrane, macrophages in the perivascular connective tissue, and the epithelioreticular cells. A list gives the six stages of T cell education: entering by a venule as CD4 and CD8 negative cells, moving to the cortex edge, dividing and gaining the T cell receptor with CD4 and CD8, positive selection in the cortex, negative selection in the medulla, and leaving by a venule as CD4 or CD8 positive cells.",
    D, render: tyRender, say: tySay, helpers: [tyTok, tyChip],
    controls: `<div class="am-controls"><button type="button" class="am-btn" data-amstep="-1">Back</button><button type="button" class="am-btn" data-amstep="1">Next</button><button type="button" class="am-btn" data-amplay aria-pressed="false">Play</button><button type="button" class="am-btn" data-amt="hide" aria-pressed="false">Hide names</button></div>`,
    sources: [
      "From the L19 notes (Dr. Herr's slides and their speaker notes): the capsule and trabeculae (mesoderm) with blood vessels, nerves and efferent but not afferent lymphatics, dividing the thymus into lobules of cortex and medulla; the cortex packed with developing T cells that hide the epithelioreticular cells and stain darker, its macrophages clearing the cells that fail; the medulla with more epithelioreticular cells, loosely packed bigger T cells, lighter staining and Hassall's corpuscles; the stroma of epithelioreticular cell processes (pharyngeal pouch endoderm); the barrier's three parts (the capillary endothelium and its basement membrane, macrophages in the perivascular connective tissue, the epithelioreticular cells) and where the perivascular tissue sits; thymic education (entry through postcapillary venules as CD4 and CD8 negative cells, the move out to the cortex, CD2 and CD7 early, CD1 in the middle, then the T cell receptor, CD3, CD4 and CD8; positive selection in the cortex, negative selection in the medulla, 95 to 99 percent dying by apoptosis, single-positive cells leaving through postcapillary venules for the T cell areas); size and involution.",
      "Two places where his slides and the textbooks differ, drawn the way the notes teach them. Slide 26's notes have a thymocyte survive positive selection if it recognizes \"self or foreign\" antigen; standard texts say it must recognize self MHC. The figure says it recognizes the MHC molecules the epithelioreticular cells present, and keeps the order, which is what the questions ask. Slide 22's notes derive the epithelioreticular cells from the third and fourth pharyngeal pouches; most embryology texts name mainly the third, so the hover says only pharyngeal pouch endoderm.",
      "Ross MH and Pawlina W, Histology: A Text and Atlas (the thymus) and Mescher AL, Junqueira's Basic Histology (the thymus): the lobule's layout (a cortex capping each lobule, the medulla continuous between lobules under incomplete trabeculae), Hassall's corpuscles as concentric whorls of flattened epithelial cells, postcapillary venules at the corticomedullary junction as where the precursors enter and the T cells leave, the barrier around the cortical capillaries and the order of its layers from the blood outward, and macrophages clearing apoptotic thymocytes in the cortex. The notes say the precursors enter \"the medulla\"; the venules are drawn at the junction, which agrees with both.",
      "Schematic, not to scale: the thymocyte we follow, the macrophages and the epithelioreticular cells are drawn far larger than the section's thymocytes, the stain colors are simplified (the cortex is drawn darker than the medulla in both themes), the cell that presents self antigen in the medulla is drawn without naming its type (the notes don't), and inset A straightens a piece of the capillary wall into flat layers. Educational, not medical advice.",
    ],
    css: `
.anima[data-anima="thymus"] .am-svg{max-width:540px}
.anima .thymus-svg{--ty-cx:#b9a3d6;--ty-cd:#3f2a75;--ty-cd2:#5a43a0;--ty-md:#f3e4ee;--ty-mdd:#8a72c0;--ty-ercf:#e9dcef;--ty-ercs:#9d86c6;--ty-ct:#f2c9da;--ty-fib:#c0638c;--ty-hc:#f4a9c6;--ty-hcl:#c95d8a}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]) .anima .thymus-svg{--ty-cx:#1f1631;--ty-cd:#54429a;--ty-cd2:#6550ad;--ty-md:#76627a;--ty-mdd:#b8a5dd;--ty-ercf:#8e7896;--ty-ercs:#d8c8f2;--ty-ct:#6b3a52;--ty-fib:#e48fb4;--ty-hc:#b5607f;--ty-hcl:#f2b3cc} }
:root[data-theme="dark"] .anima .thymus-svg{--ty-cx:#1f1631;--ty-cd:#54429a;--ty-cd2:#6550ad;--ty-md:#76627a;--ty-mdd:#b8a5dd;--ty-ercf:#8e7896;--ty-ercs:#d8c8f2;--ty-ct:#6b3a52;--ty-fib:#e48fb4;--ty-hc:#b5607f;--ty-hcl:#f2b3cc}
.anima .thymus-svg .ty-cx{fill:var(--ty-cx);stroke:var(--anatomy-lo);stroke-width:1}
.anima .thymus-svg .ty-cd{fill:none;stroke:var(--ty-cd);stroke-width:3.7;stroke-linecap:round}
.anima .thymus-svg .ty-cd2{fill:none;stroke:var(--ty-cd2);stroke-width:4.3;stroke-linecap:round}
.anima .thymus-svg .ty-md{fill:var(--ty-md)}
.anima .thymus-svg .ty-cmj,.anima .thymus-svg .ty-cmjl{fill:none;stroke:color-mix(in srgb,var(--ty-cd) 45%,transparent);stroke-width:1}
.anima .thymus-svg .ty-md-d{fill:none;stroke:var(--ty-mdd);stroke-width:6;stroke-linecap:round}
.anima .thymus-svg .ty-erc{fill:var(--ty-ercf);stroke:var(--ty-ercs);stroke-width:.9}
.anima .thymus-svg .ty-ercp{fill:none;stroke:var(--ty-ercs);stroke-width:1.1;stroke-linecap:round;opacity:.7}
.anima .thymus-svg .ty-ct{fill:var(--ty-ct);stroke:var(--ty-fib);stroke-width:1}
.anima .thymus-svg .ty-fib{fill:none;stroke:var(--ty-fib);stroke-width:.8;opacity:.6}
.anima .thymus-svg .ty-hc{fill:var(--ty-hc);stroke:var(--ty-hcl);stroke-width:1.2}
.anima .thymus-svg .ty-hcl{fill:none;stroke:var(--ty-hcl);stroke-width:.9}
.anima .thymus-svg .ty-hcc{fill:var(--ty-hcl)}
.anima .thymus-svg .ty-vw{fill:var(--bx-cyto);stroke:var(--bx-cyto-line);stroke-width:1}
.anima .thymus-svg .ty-vl{fill:var(--bx-blood-soft);stroke:var(--bx-cyto-line);stroke-width:.7}
.anima .thymus-svg .ty-en{fill:var(--bx-nuc);stroke:none}
.anima .thymus-svg .ty-rbc{fill:var(--bx-blood);stroke:color-mix(in srgb,var(--bx-blood) 70%,var(--anatomy-hi));stroke-width:.6}
.anima .thymus-svg .ty-rbcc{fill:var(--bx-blood-soft);opacity:.55}
.anima .thymus-svg .ty-ercb{fill:var(--ty-ercf);stroke:var(--ty-ercs);stroke-width:1.1}
.anima .thymus-svg .ty-ercn{fill:color-mix(in srgb,var(--ty-ercs) 45%,var(--ty-ercf));stroke:var(--ty-ercs);stroke-width:.8}
.anima .thymus-svg .ty-mac{fill:color-mix(in srgb,var(--bx-eosin) 45%,var(--surface));stroke:var(--bx-cyto-line);stroke-width:1}
.anima .thymus-svg .ty-macn{fill:var(--bx-nuc);stroke:var(--bx-nuc-line);stroke-width:.6}
.anima .thymus-svg .ty-vac{fill:var(--surface);stroke:var(--bx-cyto-line);stroke-width:.6}
.anima .thymus-svg .ty-apc{fill:color-mix(in srgb,var(--bx-gold-soft) 70%,var(--ty-ercf));stroke:var(--bx-gold);stroke-width:1.1}
.anima .thymus-svg .ty-actor{opacity:.9}
.anima .thymus-svg .ty-actor.is-on{opacity:1;filter:drop-shadow(0 0 3px var(--anatomy-lit))}
.anima .thymus-svg .ty-zoom{fill:none;stroke:var(--anatomy-strong);stroke-width:1.2;stroke-dasharray:3 2}
.anima .thymus-svg .ty-badge,.anima .thymus-svg .ty-num{fill:var(--surface);stroke:var(--anatomy-strong);stroke-width:1.1}
.anima .thymus-svg .t.ty-badget,.anima .thymus-svg .t.ty-numt{font-size:11px;font-weight:700;fill:var(--anatomy-strong);stroke:none}
.anima .thymus-svg .t.ty-reg{font-size:13px;font-weight:700;fill:var(--anatomy-strong);letter-spacing:.02em}
.anima .thymus-svg .t.ty-s{font-size:11.5px}
.anima .thymus-svg .t.ty-bad{fill:var(--bx-inhib);font-weight:600}
.anima .thymus-svg .t.ty-h{font-size:11px;font-weight:600;letter-spacing:.06em;fill:var(--anatomy-muted)}
.anima .thymus-svg .ty-trail{fill:none;stroke:var(--anatomy-lit);stroke-width:1.6;stroke-dasharray:4 3;stroke-linecap:round;opacity:.85}
.anima .thymus-svg .ty-was{fill:var(--anatomy-lit)}
.anima .thymus-svg .ty-tokc{fill:var(--bx-blue-soft);stroke:var(--bx-blue);stroke-width:1.4}
.anima .thymus-svg .ty-tokn{fill:var(--bx-nuc);stroke:var(--bx-nuc-line);stroke-width:.6}
.anima .thymus-svg .ty-me .ty-tokc{stroke:var(--anatomy-lit);stroke-width:2.4}
.anima .thymus-svg .t.ty-tokt{font-size:11px;font-weight:700;fill:var(--surface);stroke:none}
.anima .thymus-svg .ty-dau{opacity:.9}
.anima .thymus-svg .ty-die .ty-tokc{fill:var(--surface);stroke:var(--bx-inhib);stroke-dasharray:2 1.5}
.anima .thymus-svg .ty-frag{fill:var(--bx-nuc-line)}
.anima .thymus-svg .ty-x .ty-tokc{stroke:var(--bx-inhib)}
.anima .thymus-svg .ty-xm{fill:none;stroke:var(--bx-inhib);stroke-width:2.2;stroke-linecap:round}
.anima .thymus-svg .ty-chip{fill:var(--surface);stroke:var(--anatomy-lit);stroke-width:1.3}
.anima .thymus-svg .t.ty-chipt{font-size:11.5px;font-weight:600;fill:var(--anatomy-strong);stroke:none}
.anima .thymus-svg .ty-mv{animation:ty-move .9s cubic-bezier(.4,0,.2,1) both}
@keyframes ty-move{from{transform:translate(var(--fx,0px),var(--fy,0px))}to{transform:translate(0px,0px)}}
@media (prefers-reduced-motion: reduce){.anima .thymus-svg .ty-mv{animation:none}}
.anima .thymus-svg .ty-panel{fill:var(--anatomy-shade-1);stroke:var(--anatomy-lo);stroke-width:1}
.anima .thymus-svg .ty-ilum{fill:var(--bx-blood-soft);stroke:none}
.anima .thymus-svg .ty-ilym{fill:var(--bx-blue-soft);stroke:var(--bx-blue);stroke-width:1}
.anima .thymus-svg .ty-ilymn{fill:var(--bx-nuc)}
.anima .thymus-svg .ty-ag{fill:var(--bx-hot)}
.anima .thymus-svg .ty-ien{fill:var(--bx-cyto);stroke:var(--bx-cyto-line);stroke-width:.8}
.anima .thymus-svg .ty-ienn{fill:var(--bx-nuc)}
.anima .thymus-svg .ty-iseam{fill:none;stroke:var(--bx-cyto-line);stroke-width:.8}
.anima .thymus-svg .ty-ibm{fill:none;stroke:var(--bx-memb);stroke-width:1.8}
.anima .thymus-svg .ty-ipv{fill:color-mix(in srgb,var(--bx-matrix) 80%,var(--surface))}
.anima .thymus-svg .ty-ifib{fill:none;stroke:var(--bx-cyto-line);stroke-width:1;opacity:.6}
.anima .thymus-svg .ty-imac{fill:color-mix(in srgb,var(--bx-eosin) 50%,var(--surface));stroke:var(--bx-cyto-line);stroke-width:1.1}
.anima .thymus-svg .ty-imacn{fill:var(--bx-nuc);stroke:var(--bx-nuc-line);stroke-width:.7}
.anima .thymus-svg .ty-ivac2{fill:var(--bx-nuc-line)}
.anima .thymus-svg .ty-ierc{fill:var(--ty-ercf);stroke:var(--ty-ercs);stroke-width:1}
.anima .thymus-svg .ty-iercn{fill:color-mix(in srgb,var(--ty-ercs) 40%,var(--ty-ercf));stroke:var(--ty-ercs);stroke-width:.8}
.anima .thymus-svg .ty-ithy{fill:var(--bx-blue-soft);stroke:var(--bx-blue);stroke-width:.8}
.anima .thymus-svg .ty-ithyn{fill:var(--ty-cd)}
.anima .thymus-svg .ty-lay:hover{filter:drop-shadow(0 0 3px var(--anatomy-lit))}
.anima .thymus-svg .ty-now{fill:var(--accent-soft);stroke:var(--accent);stroke-width:1.2}
.anima .thymus-svg .t.ty-sn{font-size:12px;font-weight:600;fill:var(--anatomy-strong)}
.anima .thymus-svg .t.ty-sm{font-size:11px;fill:var(--anatomy-text)}
.anima .thymus-svg .ty-row.is-next{opacity:.5}
.anima .thymus-svg .ty-row.is-now .ty-num{fill:var(--accent);stroke:var(--accent)}
.anima .thymus-svg .ty-row.is-now .t.ty-numt{fill:var(--surface)}
@media (max-width:560px){.anima .thymus-svg .t.ty-tokt,.anima .thymus-svg .t.ty-badget,.anima .thymus-svg .t.ty-numt{font-size:12.5px}.anima .thymus-svg .t.ty-s,.anima .thymus-svg .t.ty-chipt{font-size:12.5px}.anima .thymus-svg .t.ty-reg{font-size:14px}.anima .thymus-svg .t.ty-sn{font-size:12.5px}.anima .thymus-svg .t.ty-sm{font-size:11.5px}.anima .thymus-svg .t.ty-h{font-size:11.5px}}
`,
  });
}
