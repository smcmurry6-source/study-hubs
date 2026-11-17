// Fig: the breastfeeding reflex (L17 Pregnancy and Lactation, Dr. Madison: "How prolactin and oxytocin are
// controlled", with "After delivery" and "Lactation: building the breast during pregnancy"). Top: the hypothalamus and
// pituitary magnified in section, front to the right: an oxytocin neuron whose axon runs down the stalk to the posterior
// pituitary, and dopamine and GnRH neurons ending on the capillary loops of the portal vessels to the anterior
// pituitary. Bottom: the breast in section (chest wall, fat, ducts, lobules of alveoli, the nipple) with the baby at the
// nipple, and one alveolus magnified with the two jobs on cards: prolactin on the secretory cells (milk production) and
// oxytocin on the myoepithelial cells (milk ejection, letdown). A nerve carries the suckling signal from the nipple out
// through the chest wall and up to the hypothalamus, where it drives the oxytocin neurons and turns the dopamine neurons
// down; blood carries prolactin and oxytocin to the breast, and LH and FSH toward the ovaries, and prolactin's brake on
// GnRH runs back up. Three states: no baby to feed, suckling, and late pregnancy (progesterone holds prolactin back).
// Levels are qualitative, and a level the lecture doesn't give says so.
import { makeFig, f1, T, L, HOT } from "./shared.mjs";

const W = 520, H = 700;

/* ---------- build-time geometry ---------- */
function sm(p, closed) {
  var n = p.length, last = closed ? n : n - 1, d = "M" + f1(p[0][0]) + " " + f1(p[0][1]), i, a, b, c, e;
  for (i = 0; i < last; i++) {
    a = p[(i - 1 + n) % n]; b = p[i]; c = p[(i + 1) % n]; e = p[(i + 2) % n];
    if (!closed) { if (i === 0) a = b; if (i + 2 >= n) e = c; }
    d += "C" + f1(b[0] + (c[0] - a[0]) / 6) + " " + f1(b[1] + (c[1] - a[1]) / 6) + " " + f1(c[0] - (e[0] - b[0]) / 6) + " " + f1(c[1] - (e[1] - b[1]) / 6) + " " + f1(c[0]) + " " + f1(c[1]);
  }
  return d + (closed ? "Z" : "");
}
/* points along the same open Catmull-Rom curve sm() draws, so dots ride exactly on a drawn axon */
function smPts(p, n) {
  const out = [];
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[Math.max(0, i - 1)], b = p[i], c = p[i + 1], e = p[Math.min(p.length - 1, i + 2)];
    const c1 = [b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6], c2 = [c[0] - (e[0] - b[0]) / 6, c[1] - (e[1] - b[1]) / 6];
    for (let k = i ? 1 : 0; k <= n; k++) { const t = k / n, u = 1 - t; out.push([f1(u * u * u * b[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * c[0]), f1(u * u * u * b[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * c[1])]); }
  }
  return out;
}
function polar(cx, cy, r, deg) { const a = deg * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
const IC = [452, 384], IR = 62, IS = 1.15; /* the magnified alveolus: center, frame radius, scale of its drawing */
const NIP = [250, 540];
/* lobules of alveoli in the breast; LOB[2] is the one magnified */
const LOB = [[100, 452], [90, 512], [156, 466], [164, 530], [100, 578], [168, 592]];
const ZC = LOB[2];

function staticArt() {
  const o = {};
  /* ----- the hypothalamus and pituitary, in section, front to the right ----- */
  o.PANEL = '<rect class="ld-panel" x="8" y="8" width="398" height="252" rx="14"/>';
  o.BRAIN = '<path class="ld-brain" d="M8 22A14 14 0 0 1 22 8L392 8A14 14 0 0 1 406 22L406 150C380 152 330 150 300 152C288 153 282 162 268 162C254 162 246 152 234 150L230 150C228 150 206 150 204 150C190 150 180 154 168 154C156 154 150 146 136 146C110 146 60 150 8 150Z"/>';
  o.HYPO = '<path class="ld-hypo" d="M70 146C66 112 84 60 140 44C190 32 280 34 320 56C352 74 352 120 330 150C310 151 300 152 292 156C280 162 254 162 244 152L234 150L204 150C186 150 176 154 166 154C156 154 150 146 136 146C112 146 90 146 70 146Z"/>';
  o.STALK = '<path class="ld-stalkf" d="M204 150C204 168 200 186 193 205L213 207C219 186 226 168 234 150Z"/><path class="ld-stalk" d="M204 150C204 168 200 186 194 199.4M234 150C226 168 219 186 213 204.7"/>';
  o.PPIT = '<ellipse class="ld-ppit" cx="198" cy="218" rx="21" ry="19"/>';
  o.APIT = '<path class="ld-apit" d="' + sm([[222, 200], [246, 194], [272, 200], [284, 216], [278, 234], [256, 242], [232, 240], [218, 228], [216, 212]], true) + '"/>';
  /* the capillary loops at the top of the stalk, and the portal vessel down its front to the anterior lobe */
  o.PORTAL = '<path class="ld-cap" d="M210 150C211 141 217 141 218 149C219 141 225 141 226 149C227 141 233 141 233 150"/><path class="ld-portal" d="M233 150C236 166 239 182 243 199"/>';
  function neuron(x, y, cls) { return '<path class="ld-soma ' + cls + '" d="' + sm([[x - 9, y + 5], [x - 6, y - 7], [x + 2, y - 10], [x + 9, y - 3], [x + 8, y + 7], [x, y + 10]], true) + '"/><circle class="ld-snuc" cx="' + x + '" cy="' + y + '" r="3.2"/>'; }
  /* oxytocin neuron (high, toward the back): its axon runs down the stalk and ends in the posterior lobe */
  const OXA = [[112, 70], [140, 96], [178, 122], [204, 140], [211, 158], [208, 182], [201, 205]];
  o.N_OXY = '<path class="ld-axon ld-oxya" d="' + sm(OXA) + 'M201 205L191 216M201 205L199 226"/>' + neuron(112, 62, "ld-oxys") +
    '<circle class="ld-term ld-oxys" cx="201" cy="206" r="3.2"/><circle class="ld-term ld-oxys" cx="191" cy="216" r="3"/><circle class="ld-term ld-oxys" cx="199" cy="226" r="3"/>';
  o.P_OXA = smPts(OXA, 6);
  /* dopamine neuron (at the base, above the stalk) and GnRH neuron (in front): both end on the capillary loops */
  o.N_DA = '<path class="ld-axon ld-daa" d="M193 112C202 122 213 132 219 143"/>' + neuron(188, 104, "ld-das") + '<circle class="ld-term ld-das" cx="219" cy="144" r="3"/>';
  o.N_GN = '<path class="ld-axon ld-gna" d="M294 76C272 98 244 122 228 143"/>' + neuron(300, 70, "ld-gns") + '<circle class="ld-term ld-gns" cx="228" cy="144" r="3"/>';
  /* ----- the chest wall and the breast in section, nipple to the right ----- */
  let wall = '<rect class="ld-musc" x="40" y="398" width="16" height="278"/>';
  for (let i = 0; i < 6; i++) wall += '<ellipse class="ld-rib" cx="30" cy="' + (420 + i * 48) + '" rx="9" ry="13"/>';
  o.WALL = wall;
  const mound = [[56, 402], [116, 412], [182, 446], [228, 494], [246, 524], [248, 556], [232, 592], [188, 632], [126, 660], [56, 668]];
  o.MOUND = '<path class="ld-breast" d="' + sm(mound) + 'L56 402Z"/>';
  o.AREOLA = '<path class="ld-areola" d="M236 506C243 520 246.5 536 246.5 548C246.5 560 243 570 238 578C240 566 241 556 241 545C241 532 239.5 518 236 506Z"/><path class="ld-nipple" d="M247 528C255 528 262 532 262 540C262 548 255 552 247 552Z"/>';
  o.DUCTS = LOB.map(function (c, j) {
    const mid = [c[0] + (NIP[0] - c[0]) * 0.55, c[1] + (NIP[1] - c[1]) * 0.55 + (j % 2 ? 8 : -8)];
    const end = [NIP[0] - 4, NIP[1] + (j - 2.5) * 2.4];
    return [[c[0] + 10, c[1]], mid, end].map((q) => [f1(q[0]), f1(q[1])]);
  });
  o.FAT = [[126, 426], [76, 428], [204, 488], [210, 568], [128, 548], [204, 612], [72, 622], [124, 500], [70, 544], [134, 624]].map(function (q) {
    return '<path class="ld-fat" d="' + sm([[q[0] - 14, q[1]], [q[0] - 4, q[1] - 11], [q[0] + 12, q[1] - 8], [q[0] + 15, q[1] + 4], [q[0] + 4, q[1] + 12], [q[0] - 10, q[1] + 9]], true) + '"/>';
  }).join("");
  /* ----- the baby at the nipple, in profile facing left, wrapped in a blanket ----- */
  const bx = (x) => 260 + (x - 2 - 260) * 0.9, by = (y) => 540 + (y - 540) * 0.9;
  const tp = (d) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (m, x, y) => f1(bx(+x)) + " " + f1(by(+y)));
  const face = [[318, 500], [348, 506], [370, 528], [376, 560], [366, 592], [340, 612], [308, 616], [286, 606], [276, 590], [272, 572], [268, 558], [262, 553], [258, 546], [262, 534], [266, 528], [264, 522], [270, 512], [290, 502]].map((q) => [bx(q[0]), by(q[1])]);
  o.BABY = '<path class="ld-wrap" d="' + sm([[292, 604], [330, 594], [368, 600], [392, 624], [398, 658], [382, 686], [342, 694], [304, 684], [286, 656], [284, 626]], true) + '"/><path class="ld-wrapl" d="M292 646C318 634 356 632 392 646"/>' +
    '<path class="ld-skin" d="' + sm(face, true) + '"/><path class="ld-feat" d="' + tp("M330 556C338 550 346 556 344 566C342 574 334 574 332 568") + '"/>' +
    '<path class="ld-feat" d="' + tp("M282 528C287 532 293 532 297 528") + '"/><path class="ld-feat" d="' + tp("M262 543C268 541 272 543 274 546") + '"/>';
  /* ----- the magnified alveolus, drawn around 0,0 and placed at IC by the page ----- */
  const da = -40;
  let al = '<path class="ld-capo" d="' + sm([polar(0, 0, 48, 112), polar(0, 0, 48.5, 136), polar(0, 0, 48, 160), polar(0, 0, 49, 182)].map((q) => [f1(q[0]), f1(q[1])])) + '"/>';
  al += al.replace("ld-capo", "ld-capi");
  const dw = 7.5, d0 = polar(0, 0, 20, da), d1 = polar(0, 0, 53, da), nx = Math.cos((da + 90) * Math.PI / 180) * dw, ny = Math.sin((da + 90) * Math.PI / 180) * dw;
  al += '<path class="ld-ductw" d="M' + f1(d0[0] - nx) + " " + f1(d0[1] - ny) + "L" + f1(d1[0] - nx) + " " + f1(d1[1] - ny) + "M" + f1(d1[0] + nx) + " " + f1(d1[1] + ny) + "L" + f1(d0[0] + nx) + " " + f1(d0[1] + ny) + '"/>';
  o.ALV_BACK = al;
  o.DUCTIN = [[IC[0], IC[1]], [f1(IC[0] + d1[0] * IS), f1(IC[1] + d1[1] * IS)]];
  o.P_CAP = [polar(0, 0, 49, 182), polar(0, 0, 48, 160), polar(0, 0, 48.5, 136), polar(0, 0, 48, 112)].map((q) => [f1(IC[0] + q[0] * IS), f1(IC[1] + q[1] * IS)]);
  /* secretory cells: a ring of wedges with nuclei, open at the duct's mouth */
  let cells = "";
  for (let k = 0; k < 13; k++) {
    const a0 = da + 20 + k * (320 / 13), a1 = a0 + 320 / 13 - 1.5;
    const p = [polar(0, 0, 22, a0), polar(0, 0, 37, a0), polar(0, 0, 37, a1), polar(0, 0, 22, a1)];
    cells += '<path class="ld-sec" d="M' + p.map((q) => f1(q[0]) + " " + f1(q[1])).join("L") + 'Z"/>';
    const n = polar(0, 0, 31, (a0 + a1) / 2);
    cells += '<circle class="ld-snu" cx="' + f1(n[0]) + '" cy="' + f1(n[1]) + '" r="3.1"/>';
  }
  o.CELLS = cells;
  /* myoepithelial cells: flat spindles on the outer surface, a basket around the secretory cells */
  let myo = "";
  for (let k = 0; k < 7; k++) {
    const a = da + 34 + k * 44, q0 = polar(0, 0, 39.5, a - 17), q1 = polar(0, 0, 39.5, a + 17), m = polar(0, 0, 43.5, a), m2 = polar(0, 0, 37.6, a);
    myo += '<path class="ld-myo" d="M' + f1(q0[0]) + " " + f1(q0[1]) + "Q" + f1(m[0]) + " " + f1(m[1]) + " " + f1(q1[0]) + " " + f1(q1[1]) + "Q" + f1(m2[0]) + " " + f1(m2[1]) + " " + f1(q0[0]) + " " + f1(q0[1]) + 'Z"/>';
  }
  o.MYO = myo;
  /* the two cells the cards point at: a secretory cell low on the ring, a myoepithelial cell at 38 degrees */
  o.PT_SEC = polar(IC[0], IC[1], 30 * IS, 100).map(f1);
  o.PT_MYO = polar(IC[0], IC[1], 41.2 * IS, 38).map(f1);
  /* zoom lines from the magnified lobule to the frame: the two outer tangents of two circles */
  const zr = 16, dx = IC[0] - ZC[0], dy = IC[1] - ZC[1], dd = Math.hypot(dx, dy), base = Math.atan2(dy, dx), off = Math.acos((zr - IR) / dd);
  o.ZOOM = [1, -1].map(function (sg) { const th = base + sg * off; return [[f1(ZC[0] + zr * Math.cos(th)), f1(ZC[1] + zr * Math.sin(th))], [f1(IC[0] + IR * Math.cos(th)), f1(IC[1] + IR * Math.sin(th))]]; });
  /* routes: the nerve from the nipple, out through the chest wall between two ribs, up to the hypothalamus, then
     one branch to the oxytocin neuron and one to the dopamine neuron */
  o.P_NERVE = [[244, 556], [210, 600], [160, 630], [90, 640], [56, 636], [12, 636], [12, 118], [44, 112]];
  o.P_NA = [[44, 112], [102, 67]];
  o.P_NB = [[44, 112], [177, 105]];
  /* dopamine and GnRH down the portal vessel to the anterior lobe; the lobes' hormones into the blood */
  o.P_DA = [[219, 146], [233, 152], [237, 172], [243, 198]];
  o.P_GN = [[228, 146], [233, 152], [237, 172], [243, 198]];
  o.P_PRL = [[249, 239], [235, 257], [222, 270], [222, 372], [150, 372], [124, 416]];
  o.P_OXY = [[199, 236], [211, 257], [222, 270], [222, 372], [150, 372], [124, 416]];
  o.P_LH = [[249, 239], [235, 257], [222, 270], [222, 300], [398, 300]];
  o.VES = [[222, 262], [222, 372], [150, 372], [124, 416]];
  o.VES2 = [[222, 300], [398, 300]];
  o.B_PRL = [[392, 300], [392, 70], [311, 70]];
  return o;
}

/* ---------- page helpers (serialized into the page) ---------- */
function ldPath(p) { var o = "", i; for (i = 0; i < p.length; i++) o += (i ? "L" : "M") + f1(p[i][0]) + " " + f1(p[i][1]); return o; }
/* dots riding a polyline: lv "u" many and fast, "n" some, "d" few and slow, anything else none */
function ldDots(p, lv, t, cls, r, ph) {
  if (lv !== "u" && lv !== "n" && lv !== "d") return "";
  var c = [0], Lt = 0, i, k, o = "";
  for (i = 1; i < p.length; i++) { Lt += Math.sqrt(Math.pow(p[i][0] - p[i - 1][0], 2) + Math.pow(p[i][1] - p[i - 1][1], 2)); c.push(Lt); }
  var gap = lv === "u" ? 22 : lv === "d" ? 90 : 42, sp = lv === "u" ? 0.07 : lv === "d" ? 0.03 : 0.05, n = Math.max(1, Math.round(Lt / gap));
  for (k = 0; k < n; k++) {
    var u = t ? ((t * sp / Lt + k / n + (ph || 0)) % 1) : ((k + 0.5) / n + (ph || 0)) % 1, s = u * Lt, j = 1;
    while (j < c.length - 1 && c[j] < s) j++;
    var f = (s - c[j - 1]) / ((c[j] - c[j - 1]) || 1), x = p[j - 1][0] + (p[j][0] - p[j - 1][0]) * f, y = p[j - 1][1] + (p[j][1] - p[j - 1][1]) * f;
    var op = Math.min(1, u / 0.06, (1 - u) / 0.06);
    o += '<circle class="' + cls + '" cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + r + '" opacity="' + f1(op) + '"/>';
  }
  return o;
}
function ldWord(v) { return { u: "↑ high", d: "↓ low", n: "= normal", ng: "? not given", rise: "↑ rising", falls: "↓ falls", inh: "↓ inhibited", cyc: "= monthly", stop: "↓ stop", low: "= low", tonic: "= tonic" }[v] || v; }
function ldCW(name, v) { return Math.round(Math.max(name.length, ldWord(v).length) * 6.4 + 16); }
/* how many dots a level sends along a route: "u" many, "n" some, "d" few, "" none */
function ldRate(v) { return { u: "u", rise: "n", n: "n", tonic: "n", cyc: "n", low: "d", d: "d", falls: "d", inh: "d" }[v] || ""; }
/* a level chip: the name over its arrow; ring > 0 flashes a value that just changed */
function ldChip(x, y, name, v, info, ring, ncls) {
  var s = ldWord(v), w = ldCW(name, v);
  var up = v === "u" || v === "rise", dn = v === "d" || v === "falls" || v === "inh" || v === "stop", q = v === "ng";
  var cls = up ? "ld-up" : dn ? "ld-dn" : q ? "ld-q" : "ld-eq";
  var o = (ring > 0 ? '<rect class="ld-ring" x="' + f1(x - 3) + '" y="' + f1(y - 3) + '" width="' + (w + 6) + '" height="38" rx="10" opacity="' + f1(ring) + '"/>' : "") +
    '<rect class="ld-chip ' + cls + '" x="' + f1(x) + '" y="' + f1(y) + '" width="' + w + '" height="32" rx="8"/>' +
    T(x + 8, y + 13, name, "ld-xs " + (ncls || ""), "start") + T(x + 8, y + 26.5, s, "ld-xs ld-lv " + cls, "start");
  return HOT(info + (q ? " The lecture doesn't give it for this state." : ""), o);
}
/* a card naming a hormone, the cells it acts on and their job; the last line is the state */
function ldCard(x, y, w, lines, info, cls, ring) {
  var h = 10 + lines.length * 13.5, o = ring > 0 ? '<rect class="ld-ring" x="' + f1(x - 3) + '" y="' + f1(y - 3) + '" width="' + (w + 6) + '" height="' + f1(h + 6) + '" rx="10" opacity="' + f1(ring) + '"/>' : "";
  o += '<rect class="ld-card ' + cls + '" x="' + f1(x) + '" y="' + f1(y) + '" width="' + w + '" height="' + f1(h) + '" rx="7"/>';
  lines.forEach(function (ln, i) { o += T(x + 8, y + 15 + i * 13.5, ln[0], "ld-xs " + (ln[1] || ""), "start"); });
  return HOT(info, o);
}
/* an inhibition line ending in a bar; faint when the brake is off */
function ldBrake(p, cls, on) {
  var a = p[p.length - 2], b = p[p.length - 1], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), c = Math.cos(ang + Math.PI / 2) * 6, s = Math.sin(ang + Math.PI / 2) * 6;
  return '<path class="ld-brk ' + cls + (on ? " is-on" : " is-off") + '" d="' + ldPath(p) + "M" + f1(b[0] - c) + " " + f1(b[1] - s) + "L" + f1(b[0] + c) + " " + f1(b[1] + s) + '"/>';
}
/* one lobule: a cluster of alveoli at the end of its duct; bigger once pregnancy has built it, milk inside when nursing */
function ldLobule(c, big, milk) {
  var o = "", k, n = big ? 9 : 4, R = big ? 13 : 7, r = big ? 5.4 : 3.2;
  for (k = 0; k < n; k++) {
    var a = (k / n) * Math.PI * 2 + c[0] * 0.01, x = c[0] + Math.cos(a) * R * (k % 2 ? 0.75 : 1), y = c[1] + Math.sin(a) * R * (k % 2 ? 0.75 : 1);
    o += '<circle class="ld-alv" cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + r + '"/>' + (milk ? '<circle class="ld-milk" cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(r * 0.55) + '"/>' : "");
  }
  return o + '<circle class="ld-alv" cx="' + c[0] + '" cy="' + c[1] + '" r="' + f1(r * 0.9) + '"/>' + (milk ? '<circle class="ld-milk" cx="' + c[0] + '" cy="' + c[1] + '" r="' + f1(r * 0.5) + '"/>' : "");
}

function ldRender(st, D) {
  var t = st.t || 0, S = D.SC[st.sc], lv = S.lv, o = "", suck = st.sc === "suck", preg = st.sc === "preg", none = st.sc === "none";
  if (st._sc === undefined) { st._sc = st.sc; st._prev = st.sc; st._t0 = -9999; }
  if (st._sc !== st.sc) { st._prev = st._sc; st._sc = st.sc; st._t0 = t; }
  var age = t ? t - st._t0 : 9999, P = D.SC[st._prev].lv;
  function ring(k) { return age < 1400 && P[k] !== lv[k] ? 1 - age / 1400 : 0; }

  /* ----- the hypothalamus and pituitary ----- */
  o += D.PANEL + HOT("Brain tissue above the pituitary, magnified and cut down the middle; front is to the right.", D.BRAIN);
  o += HOT("Hypothalamus: its dopamine neurons hold prolactin down, its GnRH neurons drive LH and FSH, and its oxytocin neurons make oxytocin. The suckling signal reaches it through the nerves.", D.HYPO);
  o += T(258, 27, "hypothalamus", "ld-xs b", "middle");
  o += HOT("Posterior pituitary: oxytocin, made in the hypothalamus, is carried down the axons and released here into the blood.", D.PPIT);
  o += HOT("Pituitary stalk: the oxytocin axons run down it to the posterior pituitary.", D.STALK);
  o += HOT("Portal vessels: dopamine and GnRH, released into the capillary loops at the top of the stalk, travel down them to the anterior pituitary.", D.PORTAL);
  o += HOT("Anterior pituitary: it releases prolactin (held down by dopamine) and LH and FSH (driven by GnRH).", D.APIT);
  o += L(176, 252, "posterior pituitary", 188, 232, "end", "ld-xs b");
  o += L(270, 252, "anterior pituitary", 262, 240, "start", "ld-xs b");
  o += HOT("Oxytocin neurons: suckling makes them fire. The oxytocin they make goes down their axons, through the stalk, to the posterior pituitary.", D.N_OXY);
  o += HOT("Dopamine neurons: they release dopamine all the time, \"a potent inhibitor of prolactin release from the anterior pituitary.\" Suckling turns them down" + (suck ? " (Dr. Madison added that the baby's sounds and sight, and the emotions of delivery, can lower dopamine too)." : "."), D.N_DA);
  o += HOT("GnRH neurons: GnRH drives LH and FSH from the anterior pituitary. Prolactin inhibits GnRH.", D.N_GN);
  o += T(112, 44, "oxytocin", "ld-xs ld-oxyt", "middle") + T(190, 86, "dopamine", "ld-xs ld-dat", "middle") + T(300, 52, "GnRH", "ld-xs ld-gnt", "middle");
  o += ldDots(D.P_DA, ldRate(lv.da), t, "ld-da", 2.4, 0);
  o += ldDots(D.P_GN, ldRate(lv.gn), t, "ld-gn", 2.4, 0.5);
  o += ldDots(D.P_OXA, ldRate(lv.oxy), t, "ld-oxy", 2.2, 0);
  o += HOT("Dopamine's brake on prolactin release." + (lv.da === "falls" ? " Turned down now: low dopamine means high prolactin." : ""), ldBrake([[239, 180], [243, 196]], "ld-brk-da", lv.da === "tonic"));
  if (suck) o += HOT("Prolactin releasing factor pushes prolactin up further once dopamine's brake is off.",
    '<rect class="ld-tag" x="292" y="180" width="94" height="46" rx="8"/>' + T(300, 195, "+ prolactin", "ld-xs ld-prlt", "start") + T(300, 208, "releasing", "ld-xs ld-prlt", "start") + T(300, 221, "factor", "ld-xs ld-prlt", "start") + '<path class="ld-tagl" d="M292 208L284 213"/><circle class="dot" cx="284" cy="213" r="1.8"/>');

  /* ----- the blood ----- */
  o += HOT("Blood: the pituitary's prolactin and oxytocin travel to the breast, and its LH and FSH to the ovaries.", '<path class="ld-vein" d="M199 236L211 257L222 266M249 239L235 257L222 266"/><path class="ld-vessel" d="' + ldPath(D.VES) + '"/><path class="ld-vessel" d="' + ldPath(D.VES2) + '"/><path class="ld-vesend" d="M396 291L410 300L396 309Z"/><path class="ld-vline" d="' + ldPath(D.VES) + '"/><path class="ld-vline" d="' + ldPath(D.VES2) + '"/>');
  o += T(310, 322, "to the ovaries", "ld-xs mut", "middle");
  o += ldDots(D.P_PRL, ldRate(lv.prl), t, "ld-prl", 2.6, 0);
  o += ldDots(D.P_OXY, ldRate(lv.oxy), t, "ld-oxy", 2.6, 0.5);
  o += ldDots(D.P_LH, ldRate(lv.lh), t, "ld-lh", 2.6, 0.25);
  o += HOT("\"One thing that I want to highlight\": prolactin inhibits GnRH, so LH, FSH and the sex steroids fall, and the periods stop (amenorrhea), as in hyperprolactinemia." + (preg ? " In pregnancy LH and FSH are already suppressed." : ""), ldBrake(D.B_PRL, "ld-brk-prl", suck));
  o += T(386, 289, "prolactin ⊣ GnRH", "ld-xs ld-prlt", "end");

  /* ----- the breast ----- */
  o += HOT("Chest wall: ribs and the pectoral muscle behind the breast.", D.WALL);
  o += HOT("The breast in section: fat around ducts that branch from the nipple to lobules of alveoli. In pregnancy estrogen grows and branches the ducts and adds fat; progesterone increases the number of alveoli.", D.MOUND + D.FAT);
  D.DUCTS.forEach(function (p) { o += '<path class="ld-ducto" d="' + ldPath(p) + '"/><path class="ld-ducti' + (suck ? " is-milk" : "") + '" d="' + ldPath(p) + '"/>'; });
  var lobs = ""; D.LOB.forEach(function (c) { lobs += ldLobule(c, !none, suck); });
  o += HOT(none ? "Lobules, small without a pregnancy: a few alveoli at the end of each duct." : "Lobules of alveoli, the milk-producing structures; progesterone increased their number in pregnancy." + (suck ? " Full of milk now." : " A little milk only: progesterone holds prolactin back."), lobs);
  o += HOT("Nipple: the ducts open here." + (suck ? " Suckling here is what starts the reflex." : ""), D.AREOLA);
  if (suck) D.DUCTS.forEach(function (p, j) { o += ldDots(p, "n", t, "ld-milkd", 2, j * 0.17); });
  o += '<circle class="ld-zc" cx="' + D.ZC[0] + '" cy="' + D.ZC[1] + '" r="16"/><path class="ld-zoom" d="' + ldPath(D.ZOOM[0]) + ldPath(D.ZOOM[1]) + '"/>';
  o += L(198, 447, "alveoli", 168, 459, "start", "ld-xs b");

  /* ----- the nerve: suckling up to the hypothalamus ----- */
  var nv = suck ? " is-on" : "";
  o += HOT("Nerve signal from the nipple to the hypothalamus (out through the chest wall to the spinal cord, drawn short). Suckling lowers dopamine (the bar: it turns the dopamine neurons down) and makes the hypothalamus produce oxytocin (the dot: it drives the oxytocin neurons).",
    '<path class="ld-nerve' + nv + '" d="' + ldPath(D.P_NERVE) + '"/><path class="ld-nerve' + nv + '" d="' + ldPath(D.P_NA) + '"/><circle class="ld-nend' + nv + '" cx="' + D.P_NA[1][0] + '" cy="' + D.P_NA[1][1] + '" r="3"/>' +
    ldBrake(D.P_NB, "ld-nerve ld-nbar", suck));
  if (suck) { o += ldDots(D.P_NERVE, "u", t, "ld-imp", 2.2, 0); o += ldDots(D.P_NA, "n", t, "ld-imp", 2.2, 0.3); o += ldDots(D.P_NB, "n", t, "ld-imp", 2.2, 0.6); }
  o += T(20, 352, "nerve", "ld-xs ld-nervet", "start") + T(20, 365, "(suckling)", "ld-xs ld-nervet", "start");

  /* ----- the baby, or the placenta's progesterone ----- */
  if (suck) o += HOT("The baby suckling at the nipple.", D.BABY);
  if (preg) o += HOT("During pregnancy the placenta's progesterone antagonizes prolactin, locally in the breast, so full milk production waits for delivery: \"What you should know.\"",
    '<rect class="ld-tag ld-ptag" x="284" y="562" width="96" height="46" rx="8"/>' + T(292, 577, "placenta", "ld-xs b", "start") + T(292, 590, "progesterone", "ld-xs ld-progt", "start") + T(292, 603, "↑ high", "ld-xs ld-lv ld-up", "start") +
    ldBrake([[332, 562], [332, 494], [385, 494]], "ld-brk-prog", true));
  if (none) o += T(322, 580, "no baby to feed", "ld-xs mut", "middle");

  /* ----- the magnified alveolus ----- */
  var ph = t ? (t % 2600) / 2600 : 0, sq = suck && t ? Math.pow(Math.sin(Math.PI * Math.min(1, ph / 0.45)), 2) : 0, k = 1 - 0.05 * sq;
  o += '<circle class="ld-inset" cx="' + D.IC[0] + '" cy="' + D.IC[1] + '" r="' + D.IR + '"/>';
  var g = '<g transform="translate(' + D.IC[0] + " " + D.IC[1] + ") scale(" + f1(D.IS * k * 1000) / 1000 + ')">' + D.ALV_BACK + '<circle class="ld-lumen" cx="0" cy="0" r="22"/>';
  if (!none) { var nd = suck ? 9 : 3, m; for (m = 0; m < nd; m++) { var aa = m * 2.4, rr = 4 + (m * 7) % 13; g += '<circle class="ld-milk" cx="' + f1(Math.cos(aa) * rr) + '" cy="' + f1(Math.sin(aa) * rr) + '" r="' + (suck ? 3.6 : 2.6) + '"/>'; } }
  g += D.CELLS + '<g class="' + (suck ? "ld-myo-on" : "") + '">' + D.MYO + "</g>" + '<circle class="ld-bm" cx="0" cy="0" r="41.5"/></g>';
  o += HOT("One alveolus, magnified: secretory cells around a lumen of milk, with myoepithelial cells in a basket around them and a capillary bringing the blood. Prolactin drives the secretory cells to make milk; oxytocin makes the myoepithelial cells contract and squeeze it out into the duct." + (suck ? " Contracting now: letdown." : ""), g);
  o += ldDots(D.P_CAP, ldRate(lv.prl), t, "ld-prl", 2.2, 0) + ldDots(D.P_CAP, ldRate(lv.oxy), t, "ld-oxy", 2.2, 0.5);
  if (suck) {
    o += ldDots(D.DUCTIN, "u", t, "ld-milkd", 2.6, 0);
    for (var c = 0; c < 4; c++) { var a2 = [0, 75, 210, 265][c] * Math.PI / 180, x1 = D.IC[0] + Math.cos(a2) * 59, y1 = D.IC[1] + Math.sin(a2) * 59, x2 = D.IC[0] + Math.cos(a2) * 52, y2 = D.IC[1] + Math.sin(a2) * 52;
      o += '<path class="ld-sqz" d="M' + f1(x1) + " " + f1(y1) + "L" + f1(x2) + " " + f1(y2) + '"/>'; }
  }
  /* the two jobs: prolactin on the secretory cells, oxytocin on the myoepithelial cells */
  o += '<path class="lead" d="M436 462L' + D.PT_SEC[0] + " " + D.PT_SEC[1] + '"/><circle class="dot" cx="' + D.PT_SEC[0] + '" cy="' + D.PT_SEC[1] + '" r="1.8"/>';
  o += ldCard(388, 462, 98, [["prolactin", "ld-prlt b"], ["secretory cells", ""], ["milk production", "b"], [D.CARD.milk[lv.milk], "ld-lv " + (lv.milk === "u" ? "ld-up" : lv.milk === "none" ? "ld-dn" : "ld-eq")]], D.INFO.milk, "ld-cprl", ring("milk"));
  o += '<path class="lead" d="M504 534L' + D.PT_MYO[0] + " " + D.PT_MYO[1] + '"/><circle class="dot" cx="' + D.PT_MYO[0] + '" cy="' + D.PT_MYO[1] + '" r="1.8"/>';
  o += ldCard(388, 534, 120, [["oxytocin", "ld-oxyt b"], ["myoepithelial cells", ""], ["milk ejection", "b"], [D.CARD.let[lv.let], "ld-lv " + (lv.let === "yes" ? "ld-up" : "ld-eq")]], D.INFO.let, "ld-coxy", ring("let"));

  /* ----- level chips ----- */
  var C = [["dopamine", "da", "ld-dat"], ["prolactin", "prl", "ld-prlt"], ["oxytocin", "oxy", "ld-oxyt"], ["GnRH", "gn", "ld-gnt"], ["LH and FSH", "lh", "ld-lht"], ["periods", "per", ""]];
  C.forEach(function (c, j) { o += ldChip(418, 10 + j * 40, c[0], lv[c[1]], D.INFO[c[1]], ring(c[1]), c[2]); });
  return o;
}

function ldSay(st, D) { var S = D.SC[st.sc]; return [S.say, S.ro]; }

const SC = {
  none: { lv: { da: "tonic", prl: "low", oxy: "low", gn: "n", lh: "cyc", per: "cyc", milk: "none", let: "no" },
    say: "No baby to feed: the hypothalamus releases dopamine all the time, and dopamine holds prolactin release from the anterior pituitary down. There's no need for milk, so prolactin stays low and nothing makes or lets down milk. GnRH drives LH and FSH, and the cycle runs.",
    ro: "dopamine brake on" },
  suck: { lv: { da: "falls", prl: "u", oxy: "u", gn: "inh", lh: "d", per: "stop", milk: "u", let: "yes" },
    say: "Suckling sends a nerve signal to the hypothalamus, with two effects. Dopamine falls, so the anterior pituitary releases prolactin (prolactin releasing factor adds to it), and prolactin drives milk production in the secretory cells. Oxytocin, made in the hypothalamus and released from the posterior pituitary, contracts the myoepithelial cells: milk ejection, or letdown. Prolactin also inhibits GnRH, so LH and FSH fall and the periods stop.",
    ro: "prolactin ↑ · oxytocin ↑" },
  preg: { lv: { da: "ng", prl: "rise", oxy: "ng", gn: "ng", lh: "d", per: "stop", milk: "little", let: "no" },
    say: "Late pregnancy: estrogen has grown the ducts, progesterone has added alveoli, and prolactin is rising, building up the milk enzymes. But the placenta's progesterone antagonizes prolactin in the breast, so there's only a little milk. When the placenta is delivered, progesterone falls and the brake comes off.",
    ro: "progesterone ⊣ prolactin" },
};
const CARD = { milk: { u: "↑ full", none: "none", little: "a little" }, let: { yes: "↑ letdown", no: "no letdown" } };
const INFO = {
  da: "Dopamine from the hypothalamus: the constant brake on prolactin release. Low dopamine means high prolactin.",
  prl: "Prolactin from the anterior pituitary: it makes the milk (milk production) and inhibits GnRH.",
  oxy: "Oxytocin, made in the hypothalamus and released from the posterior pituitary: it contracts the myoepithelial cells (milk ejection, letdown).",
  gn: "GnRH from the hypothalamus: it drives LH and FSH.",
  lh: "LH and FSH from the anterior pituitary: they drive the ovaries and the monthly cycle.",
  per: "The menstrual periods: they stop when LH and FSH are low (amenorrhea).",
  milk: "Milk production is prolactin's job: it drives the secretory cells that line each alveolus. \"Prolactin sets the stage and creates all the milk products.\"",
  let: "Milk ejection (letdown) is oxytocin's job: the myoepithelial cells around each alveolus contract and squeeze the milk out into the ducts. \"Oxytocin is going to stimulate milk letdown.\"",
};

export default function letdown() {
  const A = staticArt();
  const D = Object.assign({}, A, { SC, CARD, INFO, LOB, IC, IR, IS, ZC, ANIM: true, INIT: { sc: "suck" } });
  return makeFig({
    id: "letdown", lec: "preg", fig: "Fig 7", short: "The breastfeeding reflex", hint: "pick · hover",
    title: "The breastfeeding reflex",
    caption: "Suckling at the nipple signals the hypothalamus: dopamine falls so prolactin makes the milk (milk production), oxytocin squeezes it out (milk ejection, or letdown), and prolactin shuts GnRH off. Compare it with no baby to feed and with late pregnancy, when progesterone holds prolactin back.",
    W, H,
    label: "The breastfeeding reflexes: a nerve signal from the nipple to the hypothalamus lowers dopamine, so the anterior pituitary releases prolactin, which drives the secretory cells of the alveoli to make milk; the hypothalamus makes oxytocin, released from the posterior pituitary, which contracts the myoepithelial cells around each alveolus (letdown); prolactin inhibits GnRH, so LH and FSH fall.",
    D, render: ldRender, say: ldSay, helpers: [ldPath, ldDots, ldWord, ldCW, ldRate, ldChip, ldCard, ldBrake, ldLobule],
    controls: `<div class="am-controls" role="group" aria-label="State">${[["none", "No baby to feed"], ["suck", "Suckling"], ["preg", "Late pregnancy"]].map((b) => `<button type="button" class="am-btn" data-amk="sc" data-amv="${b[0]}">${b[1]}</button>`).join("")}</div>`,
    sources: [
      "From the L17 notes (Dr. Madison): dopamine from the hypothalamus tonically inhibits prolactin release from the anterior pituitary; suckling decreases dopamine, and prolactin releasing factor pushes prolactin up further (low dopamine means high prolactin); suckling makes the hypothalamus produce oxytocin, released from the posterior pituitary; prolactin makes the milk (milk production) and oxytocin contracts the myoepithelial cells around each alveolus (milk letdown); prolactin inhibits GnRH, so LH and FSH fall and the periods stop; during pregnancy estrogen grows the ducts and fat, progesterone increases the alveoli, prolactin rises, and progesterone antagonizes prolactin in the breast, so full milk production waits for delivery; LH and FSH are suppressed in pregnancy. The labels use the lecture's words.",
      "Where the lecture differs from textbooks, the figure follows the lecture: Dr. Madison names progesterone as prolactin's antagonist in pregnancy (Costanzo and Guyton name estrogen and progesterone together), and ties the baby's sounds and sight and the emotions of delivery to lower dopamine (physiology texts tie the baby's cry mainly to oxytocin and letdown). Levels the lecture doesn't give for a state are marked \"not given.\"",
      "Costanzo, Physiology (7th ed.), and Guyton and Hall, Textbook of Medical Physiology (14th ed.), lactation and the hypothalamus: the two pathways of the reflex (dopamine and GnRH released at the top of the stalk and carried down the portal vessels to the anterior pituitary; oxytocin carried down the axons of the stalk to the posterior pituitary), the oxytocin neurons high in the hypothalamus and the dopamine neurons at its base, and the alveolus with its myoepithelial cells. Crowley, Comprehensive Physiology 2015;5:255-291 (neuroendocrine regulation of lactation): the afferent path from the nipple through the spinal cord to the hypothalamus, and prolactin's suppression of GnRH during lactation.",
      "Sarhadi and colleagues, British Journal of Plastic Surgery 1996;49:156-164 (the nerve supply of the breast and nipple): the nipple's nerve runs back through the breast to the intercostal nerves, which is why the nerve leaves through the chest wall between two ribs. Ramsay and colleagues, Journal of Anatomy 2005;206:525-534 (the lactating breast by ultrasound): ducts that branch close to the nipple, which is how the ducts are drawn. Ross and Pawlina, Histology (8th ed.): the alveolus in section, a single layer of secretory cells with flat myoepithelial cells around them and a capillary outside.",
      "Schematic and not to scale. The nerve path through the spinal cord and brainstem is drawn as one short line; each neuron stands for a group of them, and their positions are illustrative. The dots show direction and more or less, not amounts; the alveolus's squeeze is exaggerated so it can be seen.",
    ],
    css: `
.anima[data-anima="letdown"]{--ld-milk:#fffaf0;--ld-milk-line:#d9c7a6}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]) .anima[data-anima="letdown"]{--ld-milk:#efe6d2;--ld-milk-line:#bba98a} }
:root[data-theme="dark"] .anima[data-anima="letdown"]{--ld-milk:#efe6d2;--ld-milk-line:#bba98a}
.anima[data-anima="letdown"] .am-svg{max-width:540px}
.anima .letdown-svg .t.ld-xs{font-size:11px}
.anima .letdown-svg .ld-panel{fill:var(--anatomy-face);stroke:var(--anatomy-lo);stroke-width:1}
.anima .letdown-svg .ld-brain{fill:var(--anatomy-shade-2);stroke:var(--anatomy-mid);stroke-width:1.2}
.anima .letdown-svg .ld-hypo{fill:color-mix(in srgb,var(--bx-stim) 14%,var(--anatomy-shade-2));stroke:none}
.anima .letdown-svg .ld-stalkf{fill:var(--anatomy-shade-1)}
.anima .letdown-svg .ld-stalk{fill:none;stroke:var(--anatomy-mid);stroke-width:1.1}
.anima .letdown-svg .ld-ppit{fill:var(--anatomy-shade-1);stroke:var(--anatomy-mid);stroke-width:1.3}
.anima .letdown-svg .ld-apit{fill:var(--bx-violet-soft);stroke:var(--bx-violet);stroke-width:1.5}
.anima .letdown-svg .ld-cap{fill:none;stroke:var(--bx-blood);stroke-width:1.6;stroke-linecap:round}
.anima .letdown-svg .ld-portal{fill:none;stroke:var(--bx-blood);stroke-width:3;stroke-linecap:round;opacity:.8}
.anima .letdown-svg .ld-axon{fill:none;stroke-width:1.6;stroke-linecap:round}
.anima .letdown-svg .ld-oxya{stroke:var(--bx-memb)}
.anima .letdown-svg .ld-daa{stroke:var(--bx-blue)}
.anima .letdown-svg .ld-gna{stroke:var(--bx-stim)}
.anima .letdown-svg .ld-soma{stroke-width:1.2}
.anima .letdown-svg .ld-oxys{fill:color-mix(in srgb,var(--bx-memb) 30%,var(--anatomy-face));stroke:var(--bx-memb)}
.anima .letdown-svg .ld-das{fill:color-mix(in srgb,var(--bx-blue) 30%,var(--anatomy-face));stroke:var(--bx-blue)}
.anima .letdown-svg .ld-gns{fill:color-mix(in srgb,var(--bx-stim) 30%,var(--anatomy-face));stroke:var(--bx-stim)}
.anima .letdown-svg .ld-term{stroke-width:1}
.anima .letdown-svg .ld-snuc{fill:var(--bx-nuc)}
.anima .letdown-svg .ld-vessel{fill:none;stroke:var(--bx-blood-soft);stroke-width:13;stroke-linecap:round;stroke-linejoin:round}
.anima .letdown-svg .ld-vein{fill:none;stroke:var(--bx-blood-soft);stroke-width:6;stroke-linecap:round;stroke-linejoin:round}
.anima .letdown-svg .ld-vesend{fill:var(--bx-blood-soft)}
.anima .letdown-svg .ld-vline{fill:none;stroke:var(--bx-blood);stroke-width:.8;opacity:.5;stroke-dasharray:2 6}
.anima .letdown-svg .ld-brk{fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.anima .letdown-svg .ld-brk.is-off{stroke-width:1.2;stroke-dasharray:3 3;opacity:.45}
.anima .letdown-svg .ld-brk.is-on{stroke-width:2.6}
.anima .letdown-svg .ld-brk-da{stroke:var(--bx-blue)}
.anima .letdown-svg .ld-brk-prl{stroke:var(--bx-ins)}
.anima .letdown-svg .ld-brk-prog{stroke:var(--bx-violet)}
.anima .letdown-svg .ld-da{fill:var(--bx-blue);stroke:var(--surface);stroke-width:.6}
.anima .letdown-svg .ld-gn{fill:var(--bx-stim);stroke:var(--surface);stroke-width:.6}
.anima .letdown-svg .ld-oxy{fill:var(--bx-memb);stroke:var(--surface);stroke-width:.7}
.anima .letdown-svg .ld-prl{fill:var(--bx-ins);stroke:var(--surface);stroke-width:.7}
.anima .letdown-svg .ld-lh{fill:var(--bx-glu);stroke:var(--surface);stroke-width:.7}
.anima .letdown-svg .ld-imp{fill:var(--bx-hot);stroke:var(--surface);stroke-width:.6}
.anima .letdown-svg .t.ld-oxyt{fill:var(--bx-memb);font-weight:600}
.anima .letdown-svg .t.ld-dat{fill:var(--bx-blue);font-weight:600}
.anima .letdown-svg .t.ld-gnt{fill:var(--bx-stim);font-weight:600}
.anima .letdown-svg .t.ld-prlt{fill:var(--bx-ins);font-weight:600}
.anima .letdown-svg .t.ld-lht{fill:color-mix(in srgb,var(--bx-glu) 80%,var(--anatomy-strong));font-weight:600}
.anima .letdown-svg .t.ld-progt{fill:var(--bx-violet);font-weight:600}
.anima .letdown-svg .t.ld-nervet{fill:var(--bx-hot);font-weight:600}
.anima .letdown-svg .ld-tag{fill:var(--surface);stroke:var(--bx-ins);stroke-width:1.2}
.anima .letdown-svg .ld-tag.ld-ptag{stroke:var(--bx-violet)}
.anima .letdown-svg .ld-tagl{fill:none;stroke:var(--bx-ins);stroke-width:1.4}
.anima .letdown-svg .ld-musc{fill:color-mix(in srgb,var(--bx-blood) 35%,var(--anatomy-face));stroke:var(--anatomy-mid);stroke-width:1}
.anima .letdown-svg .ld-rib{fill:var(--anatomy-shade-1);stroke:var(--anatomy-mid);stroke-width:1.1}
.anima .letdown-svg .ld-breast{fill:var(--bx-fat);stroke:var(--anatomy-mid);stroke-width:1.4}
.anima .letdown-svg .ld-fat{fill:none;stroke:var(--bx-fat-line);stroke-width:.9}
.anima .letdown-svg .ld-areola{fill:color-mix(in srgb,var(--bx-cyto-line) 45%,var(--bx-fat));stroke:none}
.anima .letdown-svg .ld-nipple{fill:color-mix(in srgb,var(--bx-cyto-line) 55%,var(--bx-fat));stroke:var(--anatomy-mid);stroke-width:1.2}
.anima .letdown-svg .ld-ducto{fill:none;stroke:var(--bx-cyto-line);stroke-width:5;stroke-linecap:round;stroke-linejoin:round}
.anima .letdown-svg .ld-ducti{fill:none;stroke:var(--bx-matrix);stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}
.anima .letdown-svg .ld-ducti.is-milk{stroke:var(--ld-milk)}
.anima .letdown-svg .ld-alv{fill:var(--bx-cyto);stroke:var(--bx-cyto-line);stroke-width:1}
.anima .letdown-svg .ld-milk{fill:var(--ld-milk);stroke:var(--ld-milk-line);stroke-width:.6}
.anima .letdown-svg .ld-milkd{fill:var(--ld-milk);stroke:var(--ld-milk-line);stroke-width:.8}
.anima .letdown-svg .ld-zoom{fill:none;stroke:var(--anatomy-lo);stroke-width:1;stroke-dasharray:3 3}
.anima .letdown-svg .ld-zc{fill:none;stroke:var(--anatomy-mid);stroke-width:1.2}
.anima .letdown-svg .ld-nerve{fill:none;stroke:var(--bx-hot);stroke-width:1.6;opacity:.45;stroke-linejoin:round}
.anima .letdown-svg .ld-nerve.is-on{opacity:.9;stroke-width:2}
.anima .letdown-svg .ld-nerve.ld-nbar{stroke-dasharray:none}
.anima .letdown-svg .ld-nend{fill:var(--bx-hot);opacity:.45}
.anima .letdown-svg .ld-nend.is-on{opacity:.95}
.anima .letdown-svg .ld-skin{fill:var(--anatomy-shade-2);stroke:var(--anatomy-mid);stroke-width:1.3}
.anima .letdown-svg .ld-wrap{fill:var(--bx-blue-soft);stroke:var(--anatomy-mid);stroke-width:1.3}
.anima .letdown-svg .ld-wrapl{fill:none;stroke:var(--anatomy-mid);stroke-width:1;opacity:.6}
.anima .letdown-svg .ld-feat{fill:none;stroke:var(--anatomy-mid);stroke-width:1.3;stroke-linecap:round}
.anima .letdown-svg .ld-inset{fill:color-mix(in srgb,var(--bx-fat) 70%,var(--bx-matrix));stroke:var(--anatomy-mid);stroke-width:1.4}
.anima .letdown-svg .ld-capo{fill:none;stroke:var(--bx-blood);stroke-width:8;stroke-linecap:round}
.anima .letdown-svg .ld-capi{fill:none;stroke:var(--bx-blood-soft);stroke-width:6;stroke-linecap:round}
.anima .letdown-svg .ld-ductw{fill:none;stroke:var(--bx-cyto-line);stroke-width:1.2}
.anima .letdown-svg .ld-lumen{fill:var(--bx-lumen);stroke:var(--bx-cyto-line);stroke-width:.8}
.anima .letdown-svg .ld-sec{fill:var(--bx-cyto);stroke:var(--bx-cyto-line);stroke-width:.8}
.anima .letdown-svg .ld-snu{fill:var(--bx-nuc)}
.anima .letdown-svg .ld-myo{fill:color-mix(in srgb,var(--bx-memb) 45%,var(--bx-cyto));stroke:var(--bx-memb);stroke-width:.8}
.anima .letdown-svg .ld-myo-on .ld-myo{fill:var(--bx-memb)}
.anima .letdown-svg .ld-bm{fill:none;stroke:var(--anatomy-mid);stroke-width:.8}
.anima .letdown-svg .ld-sqz{fill:none;stroke:var(--bx-memb);stroke-width:2;stroke-linecap:round}
.anima .letdown-svg .ld-card{fill:var(--surface);stroke-width:1.4}
.anima .letdown-svg .ld-card.ld-cprl{stroke:var(--bx-ins)}
.anima .letdown-svg .ld-card.ld-coxy{stroke:var(--bx-memb)}
.anima .letdown-svg .ld-chip{fill:var(--surface);stroke:var(--anatomy-lo);stroke-width:1.1}
.anima .letdown-svg .ld-chip.ld-up{stroke:var(--bx-hot);stroke-width:1.6;fill:var(--bx-hot-soft)}
.anima .letdown-svg .ld-chip.ld-dn{stroke:var(--bx-blue);stroke-width:1.6;fill:var(--bx-blue-soft)}
.anima .letdown-svg .ld-chip.ld-q{stroke-dasharray:3 3}
.anima .letdown-svg .t.ld-lv{font-weight:700}
.anima .letdown-svg .t.ld-lv.ld-up{fill:var(--bx-hot)}
.anima .letdown-svg .t.ld-lv.ld-dn{fill:var(--bx-blue)}
.anima .letdown-svg .t.ld-lv.ld-eq{fill:var(--anatomy-strong)}
.anima .letdown-svg .t.ld-lv.ld-q{fill:var(--anatomy-muted);font-weight:500}
.anima .letdown-svg .ld-ring{fill:none;stroke:var(--anatomy-lit);stroke-width:2.4}
`,
  });
}
