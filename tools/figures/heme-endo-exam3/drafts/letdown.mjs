// Fig: the breastfeeding reflex (L17 Pregnancy and Lactation, Dr. Madison: "How prolactin and oxytocin are
// controlled", with "After delivery" and "Lactation: building the breast during pregnancy"). Top: the hypothalamus and
// pituitary in section, front to the right, with three hypothalamic neurons: dopamine and GnRH neurons ending on the
// portal vessels to the anterior pituitary, and an oxytocin neuron whose axon runs down the stalk to the posterior
// pituitary. Bottom: the breast in section (chest wall, fat, ducts, lobules of alveoli, the nipple), the baby at the
// nipple, and one alveolus magnified (secretory cells around the milk, the myoepithelial cells around them). A nerve
// carries the suckling signal up; blood carries prolactin and oxytocin down, and LH and FSH to the ovary. Three
// states: no baby to feed (dopamine's brake on), suckling (dopamine falls, prolactin rises and makes milk, oxytocin
// lets it down, prolactin inhibits GnRH so LH, FSH and the periods stop) and late pregnancy (progesterone holds
// prolactin back in the breast). Levels are qualitative, and a level the lecture doesn't give says so.
import { makeFig, f1, T, L, HOT } from "./shared.mjs";

const W = 520, H = 650;

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
function polar(cx, cy, r, deg) { const a = deg * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
const IC = [452, 468]; /* the magnified alveolus */
/* lobules: centers, and the duct each drains through to the nipple */
const NIP = [254, 540];
const LOB = [[86, 452], [74, 512], [92, 584], [150, 448], [136, 618], [150, 520]];

function staticArt() {
  const o = {};
  /* ----- the hypothalamus and pituitary ----- */
  o.PANEL = '<rect class="ld-panel" x="8" y="8" width="398" height="252" rx="14"/>';
  const brain = "M8 22A14 14 0 0 1 22 8L392 8A14 14 0 0 1 406 22L406 150C380 152 330 150 300 152C288 153 282 162 268 162C254 162 246 152 234 150L230 150C228 150 206 150 204 150C190 150 180 154 168 154C156 154 150 146 136 146C110 146 60 150 8 150Z";
  o.BRAIN = '<path class="ld-brain" d="' + brain + '"/>';
  o.HYPO = '<path class="ld-hypo" d="M70 146C66 112 84 60 140 44C190 32 280 34 320 56C352 74 352 120 330 150C310 151 300 152 292 156C280 162 254 162 244 152L234 150L204 150C186 150 176 154 166 154C156 154 150 146 136 146C112 146 90 146 70 146Z"/>';
  o.STALK = '<path class="ld-stalk" d="M204 150C206 168 208 182 208 198L228 198C230 182 232 166 234 150Z"/>';
  o.PPIT = '<ellipse class="ld-ppit" cx="198" cy="218" rx="21" ry="19"/>';
  o.APIT = '<path class="ld-apit" d="' + sm([[222, 200], [246, 194], [272, 200], [284, 216], [278, 234], [256, 242], [232, 240], [218, 228], [216, 212]], true) + '"/>';
  /* median eminence capillary loops and the portal vessel down the front of the stalk to the anterior lobe */
  o.PORTAL = '<path class="ld-cap" d="M208 150C210 140 216 140 216 148C216 140 224 140 224 148C224 140 232 140 232 150"/><path class="ld-portal" d="M232 150C234 166 238 182 244 202"/>';
  /* neurons: soma (with nucleus) and axon */
  function neuron(x, y, cls) { return '<path class="ld-soma ' + cls + '" d="' + sm([[x - 9, y + 5], [x - 6, y - 7], [x + 2, y - 10], [x + 9, y - 3], [x + 8, y + 7], [x, y + 10]], true) + '"/><circle class="ld-snuc" cx="' + x + '" cy="' + y + '" r="3.2"/>'; }
  o.N_OXY = '<path class="ld-axon ld-oxya" d="M128 70C150 96 196 120 214 150C216 166 214 186 206 206"/>' + neuron(128, 64, "ld-oxys") + '<circle class="ld-term ld-oxys" cx="206" cy="208" r="3.4"/><circle class="ld-term ld-oxys" cx="196" cy="214" r="3"/><circle class="ld-term ld-oxys" cx="202" cy="224" r="3"/><path class="ld-axon ld-oxya" d="M206 206L196 214M206 206L202 224"/>';
  o.N_DA = '<path class="ld-axon ld-daa" d="M190 96C200 114 210 130 214 144"/>' + neuron(186, 90, "ld-das") + '<circle class="ld-term ld-das" cx="214" cy="145" r="3"/>';
  o.N_GN = '<path class="ld-axon ld-gna" d="M298 74C276 98 240 122 226 144"/>' + neuron(302, 68, "ld-gns") + '<circle class="ld-term ld-gns" cx="226" cy="145" r="3"/>';
  /* ----- the breast in section ----- */
  let wall = '<rect class="ld-musc" x="28" y="396" width="18" height="254"/>';
  for (let i = 0; i < 6; i++) wall += '<ellipse class="ld-rib" cx="16" cy="' + (418 + i * 44) + '" rx="9" ry="14"/>';
  o.WALL = wall;
  const mound = [[46, 400], [110, 412], [178, 446], [226, 494], [244, 524], [246, 556], [228, 590], [180, 628], [120, 650], [46, 650]];
  o.MOUND = '<path class="ld-breast" d="' + sm(mound) + 'L46 400Z"/>';
  o.AREOLA = '<path class="ld-areola" d="M240 512C250 524 252 556 240 572L246 556L246 524Z"/><path class="ld-nipple" d="M244 528C252 528 258 532 258 540C258 548 252 552 244 552Z"/>';
  /* ducts: each lobule drains toward the nipple; they gather close to it */
  o.DUCTS = LOB.map(function (c, j) {
    const mid = [c[0] + (NIP[0] - c[0]) * 0.55, c[1] + (NIP[1] - c[1]) * 0.55 + (j % 2 ? 10 : -10)];
    const end = [NIP[0] - 8, NIP[1] + (j - 2.5) * 2.4];
    return [[c[0] + 10, c[1]], mid, end].map((q) => [f1(q[0]), f1(q[1])]);
  });
  o.FAT = [[120, 420], [60, 430], [190, 480], [200, 600], [110, 560], [176, 580], [60, 620], [110, 488], [206, 530]].map(function (q, j) {
    return '<path class="ld-fat" d="' + sm([[q[0] - 14, q[1]], [q[0] - 4, q[1] - 11], [q[0] + 12, q[1] - 8], [q[0] + 15, q[1] + 4], [q[0] + 4, q[1] + 12], [q[0] - 10, q[1] + 9]], true) + '"/>';
  }).join("");
  /* ----- the baby at the nipple (profile, facing left) ----- */
  const face = [[318, 500], [348, 506], [370, 528], [376, 560], [366, 592], [340, 612], [308, 616], [286, 606], [276, 590], [272, 572], [268, 558], [262, 553], [258, 546], [262, 534], [266, 528], [264, 522], [270, 512], [290, 502]];
  o.BABY = '<path class="ld-skin" d="M300 650C302 626 330 604 372 600C420 600 440 626 444 650Z"/>' +
    '<path class="ld-skin" d="' + sm(face, true) + '"/><path class="ld-feat" d="M330 556C338 550 346 556 344 566C342 574 334 574 332 568"/>' +
    '<path class="ld-feat" d="M282 528C287 532 293 532 297 528"/><path class="ld-feat" d="M262 543C268 541 272 543 274 546"/>';
  /* ----- the ovary ----- */
  o.OVARY = '<ellipse class="ld-ova" cx="460" cy="318" rx="44" ry="22"/>' + [[436, 314, 4], [450, 326, 3.4], [476, 310, 3.6], [490, 322, 3]].map((q) => '<circle class="ld-foll" cx="' + q[0] + '" cy="' + q[1] + '" r="' + q[2] + '"/>').join("");
  /* ----- the magnified alveolus ----- */
  let inset = '<circle class="ld-inset" cx="' + IC[0] + '" cy="' + IC[1] + '" r="58"/>';
  /* a capillary passing the alveolus, lower left */
  inset += '<path class="ld-capo" d="M400 494C414 514 432 524 452 526"/><path class="ld-capi" d="M400 494C414 514 432 524 452 526"/>';
  /* the duct leaving toward the upper right */
  const da = -40, dw = 9, d0 = polar(IC[0], IC[1], 20, da), d1 = polar(IC[0], IC[1], 56, da);
  const nx = Math.cos((da + 90) * Math.PI / 180) * dw, ny = Math.sin((da + 90) * Math.PI / 180) * dw;
  inset += '<path class="ld-ductw" d="M' + f1(d0[0] - nx) + " " + f1(d0[1] - ny) + "L" + f1(d1[0] - nx) + " " + f1(d1[1] - ny) + "L" + f1(d1[0] + nx) + " " + f1(d1[1] + ny) + "L" + f1(d0[0] + nx) + " " + f1(d0[1] + ny) + 'Z"/>';
  o.INSET = inset;
  o.DUCTIN = [[f1(IC[0]), f1(IC[1])], [f1(d1[0] - 3), f1(d1[1] + 2)]];
  /* secretory cells: a ring of wedges with nuclei, leaving the duct's mouth open */
  let cells = "";
  for (let k = 0; k < 13; k++) {
    const a0 = da + 20 + k * (320 / 13), a1 = a0 + 320 / 13 - 1.5;
    const p = [polar(0, 0, 22, a0), polar(0, 0, 37, a0), polar(0, 0, 37, a1), polar(0, 0, 22, a1)];
    cells += '<path class="ld-sec" d="M' + p.map((q) => f1(q[0]) + " " + f1(q[1])).join("L") + 'Z"/>';
    const n = polar(0, 0, 31, (a0 + a1) / 2);
    cells += '<circle class="ld-snu" cx="' + f1(n[0]) + '" cy="' + f1(n[1]) + '" r="3.1"/>';
  }
  o.CELLS = cells;
  /* myoepithelial cells: flat spindles on the outer surface, around the ring */
  let myo = "";
  for (let k = 0; k < 7; k++) {
    const a = da + 34 + k * 44, q0 = polar(0, 0, 39.5, a - 17), q1 = polar(0, 0, 39.5, a + 17), m = polar(0, 0, 43.5, a), m2 = polar(0, 0, 37.6, a);
    myo += '<path class="ld-myo" d="M' + f1(q0[0]) + " " + f1(q0[1]) + "Q" + f1(m[0]) + " " + f1(m[1]) + " " + f1(q1[0]) + " " + f1(q1[1]) + "Q" + f1(m2[0]) + " " + f1(m2[1]) + " " + f1(q0[0]) + " " + f1(q0[1]) + 'Z"/>';
  }
  o.MYO = myo;
  /* routes: the nerve from the nipple to the hypothalamus; blood from the pituitary to the breast and the ovary */
  o.P_NERVE = [[246, 556], [180, 612], [100, 636], [40, 640], [20, 600], [20, 300], [20, 200], [40, 152], [70, 120], [110, 80]];
  o.P_NERVE2 = [[70, 120], [120, 106], [176, 96]];
  o.P_DA = [[214, 148], [233, 152], [238, 176], [244, 200]];
  o.P_GN = [[226, 148], [233, 152], [238, 176], [244, 200]];
  o.P_OXA = [[128, 70], [160, 104], [196, 124], [214, 150], [214, 176], [206, 206]];
  o.P_PRL = [[244, 240], [236, 260], [222, 270], [222, 372], [150, 372], [118, 400]];
  o.P_OXY = [[198, 236], [210, 260], [222, 270], [222, 372], [150, 372], [118, 400]];
  o.P_LH = [[256, 242], [236, 260], [222, 270], [222, 318], [416, 318]];
  o.VES = [[222, 262], [222, 372], [150, 372], [118, 400]];
  o.VES2 = [[222, 318], [416, 318]];
  o.B_PRL = [[234, 290], [392, 290], [392, 68], [314, 68]];
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
function ldWord(v) { return { u: "↑ high", d: "↓ low", n: "= normal", ng: "? not given", rise: "↑ rising", falls: "↓ falls", inh: "↓ inhibited", cyc: "= monthly", stop: "↓ stop", none: "none", made: "↑ made", little: "a little", yes: "yes", no: "no", low: "= low" }[v] || v; }
function ldCW(name, v) { return Math.round(Math.max(name.length, ldWord(v).length) * 6.6 + 16); }
/* a level chip: the name over its arrow; ring > 0 flashes a value that just changed */
function ldChip(x, y, name, v, info, ring, ncls) {
  var s = ldWord(v), w = ldCW(name, v);
  var up = v === "u" || v === "rise" || v === "made" || v === "yes", dn = v === "d" || v === "falls" || v === "inh" || v === "stop", q = v === "ng";
  var cls = up ? "ld-up" : dn ? "ld-dn" : q ? "ld-q" : "ld-eq";
  var o = (ring > 0 ? '<rect class="ld-ring" x="' + f1(x - 3) + '" y="' + f1(y - 3) + '" width="' + (w + 6) + '" height="38" rx="10" opacity="' + f1(ring) + '"/>' : "") +
    '<rect class="ld-chip ' + cls + '" x="' + f1(x) + '" y="' + f1(y) + '" width="' + w + '" height="32" rx="8"/>' +
    T(x + 8, y + 13, name, "ld-xs " + (ncls || ""), "start") + T(x + 8, y + 26.5, s, "ld-xs ld-lv " + cls, "start");
  return HOT(info + (q ? " The lecture doesn't give it for this state." : ""), o);
}
/* an inhibition line ending in a bar; faint when the brake is off */
function ldBrake(p, cls, on) {
  var a = p[p.length - 2], b = p[p.length - 1], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), c = Math.cos(ang + Math.PI / 2) * 6, s = Math.sin(ang + Math.PI / 2) * 6;
  return '<path class="ld-brk ' + cls + (on ? " is-on" : " is-off") + '" d="' + ldPath(p) + "M" + f1(b[0] - c) + " " + f1(b[1] - s) + "L" + f1(b[0] + c) + " " + f1(b[1] + s) + '"/>';
}
/* one lobule: a cluster of alveoli on its duct; size by state, milk inside when lactating */
function ldLobule(c, big, milk) {
  var o = "", k, n = big ? 9 : 4, R = big ? 13 : 7, r = big ? 5.4 : 3.2;
  for (k = 0; k < n; k++) {
    var a = (k / n) * Math.PI * 2 + c[0] * 0.01, x = c[0] + Math.cos(a) * R * (k % 2 ? 0.75 : 1), y = c[1] + Math.sin(a) * R * (k % 2 ? 0.75 : 1);
    o += '<circle class="ld-alv" cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + r + '"/>' + (milk ? '<circle class="ld-milk" cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(r * 0.55) + '"/>' : "");
  }
  return o + '<circle class="ld-alv" cx="' + c[0] + '" cy="' + c[1] + '" r="' + f1(r * 0.9) + '"/>' + (milk ? '<circle class="ld-milk" cx="' + c[0] + '" cy="' + c[1] + '" r="' + f1(r * 0.5) + '"/>' : "");
}

function ldRender(st, D) {
  var t = st.t || 0, S = D.SC[st.sc], lv = S.lv, o = "", suck = st.sc === "suck", preg = st.sc === "preg";
  if (st._sc === undefined) { st._sc = st.sc; st._prev = st.sc; st._t0 = -9999; }
  if (st._sc !== st.sc) { st._prev = st._sc; st._sc = st.sc; st._t0 = t; }
  var age = t ? t - st._t0 : 9999, P = D.SC[st._prev].lv;
  function ring(k) { return age < 1400 && P[k] !== lv[k] ? 1 - age / 1400 : 0; }

  /* ----- the hypothalamus and pituitary ----- */
  o += D.PANEL + HOT("Brain tissue above the pituitary, cut down the middle; front is to the right.", D.BRAIN);
  o += HOT("Hypothalamus: its dopamine neurons hold prolactin down, its GnRH neurons drive LH and FSH, and its oxytocin neurons make oxytocin. Suckling reaches it through the nerves.", D.HYPO);
  o += T(80, 30, "hypothalamus", "ld-xs b", "start");
  o += HOT("Pituitary stalk: the oxytocin axons run down it to the posterior pituitary.", D.STALK);
  o += HOT("Portal vessels: dopamine and GnRH, released at the top of the stalk, travel down them to the anterior pituitary.", D.PORTAL);
  o += HOT("Posterior pituitary: oxytocin, made in the hypothalamus, is carried down the axons and released here into the blood.", D.PPIT);
  o += HOT("Anterior pituitary: it releases prolactin (held down by dopamine) and LH and FSH (driven by GnRH).", D.APIT);
  o += L(22, 236, "posterior pituitary", 182, 226, "start", "ld-xs b");
  o += L(270, 252, "anterior pituitary", 262, 238, "start", "ld-xs b");
  o += HOT("Oxytocin neurons: suckling makes them fire; their oxytocin goes down the stalk to the posterior pituitary.", D.N_OXY);
  o += HOT("Dopamine neurons: they release dopamine constantly, \"a potent inhibitor of prolactin release from the anterior pituitary.\" Suckling turns them down" + (suck ? " (Dr. Madison added that the baby's sounds and sight, and the emotions of delivery, can lower dopamine too)." : "."), D.N_DA);
  o += HOT("GnRH neurons: GnRH drives LH and FSH from the anterior pituitary. Prolactin inhibits GnRH.", D.N_GN);
  o += T(108, 50, "oxytocin", "ld-xs ld-oxyt", "middle") + T(186, 72, "dopamine", "ld-xs ld-dat", "middle") + T(304, 50, "GnRH", "ld-xs ld-gnt", "middle");
  /* dopamine and GnRH down the portal vessel; oxytocin down the axon */
  o += ldDots(D.P_DA, lv.da, t, "ld-da", 2.4, 0);
  o += ldDots(D.P_GN, lv.gn, t, "ld-gn", 2.4, 0.5);
  o += ldDots(D.P_OXA, lv.oxy === "u" ? "u" : lv.oxy === "low" ? "d" : "", t, "ld-oxy", 2.2, 0);
  /* dopamine's brake on the anterior pituitary */
  o += HOT("Dopamine's brake on prolactin release." + (lv.da === "falls" ? " Turned down now: low dopamine means high prolactin." : ""), ldBrake([[250, 192], [256, 200]], "ld-brk-da", lv.da === "u"));
  if (suck) o += HOT("Prolactin releasing factor pushes prolactin up further once dopamine's brake is off.",
    '<rect class="ld-tag" x="290" y="182" width="96" height="46" rx="8"/>' + T(298, 197, "+ prolactin", "ld-xs ld-prlt", "start") + T(298, 210, "releasing", "ld-xs ld-prlt", "start") + T(298, 223, "factor", "ld-xs ld-prlt", "start") + '<path class="ld-tagl" d="M290 210L281 212"/>');

  /* ----- the blood ----- */
  o += HOT("Blood: the pituitary's prolactin and oxytocin travel to the breast, and its LH and FSH to the ovary.", '<path class="ld-vessel" d="' + ldPath(D.VES) + '"/><path class="ld-vessel" d="' + ldPath(D.VES2) + '"/><path class="ld-vline" d="' + ldPath(D.VES) + '"/><path class="ld-vline" d="' + ldPath(D.VES2) + '"/>');
  o += ldDots(D.P_PRL, lv.prl === "rise" ? "n" : lv.prl, t, "ld-prl", 2.6, 0);
  o += ldDots(D.P_OXY, lv.oxy === "low" ? "d" : lv.oxy, t, "ld-oxy", 2.6, 0.5);
  o += ldDots(D.P_LH, lv.lh === "cyc" ? "n" : lv.lh, t, "ld-lh", 2.6, 0.25);
  /* prolactin's brake on GnRH */
  o += HOT("\"One thing that I want to highlight\": prolactin inhibits GnRH, so LH, FSH and the sex steroids fall, and the periods stop (amenorrhea), as in hyperprolactinemia." + (preg ? " In pregnancy LH and FSH are already suppressed." : ""), ldBrake(D.B_PRL, "ld-brk-prl", suck));
  o += T(388, 284, "prolactin ⊣ GnRH", "ld-xs ld-prlt", "end");

  /* ----- the ovary ----- */
  o += HOT("Ovary: LH and FSH drive its follicles and the monthly cycle." + (suck ? " With GnRH inhibited, no follicle matures and the periods stop." : preg ? " In pregnancy LH and FSH are suppressed, and the periods stop." : ""), D.OVARY + (st.sc === "none" ? '<circle class="ld-foll ld-dom" cx="462" cy="318" r="9"/>' : ""));
  o += T(460, 288, "ovary", "ld-xs b", "middle");

  /* ----- the breast ----- */
  var big = st.sc !== "none", milk = st.sc !== "none";
  o += HOT("Chest wall: ribs and the pectoral muscle behind the breast.", D.WALL);
  o += HOT("The breast in section: fat around ducts that branch from the nipple to lobules of alveoli. In pregnancy estrogen grows and branches the ducts and adds fat; progesterone increases the number of alveoli.", D.MOUND + D.FAT);
  D.DUCTS.forEach(function (p) { o += '<path class="ld-ducto" d="M' + p.map(function (q) { return q[0] + " " + q[1]; }).join("L") + '"/><path class="ld-ducti' + (suck ? " is-milk" : "") + '" d="M' + p.map(function (q) { return q[0] + " " + q[1]; }).join("L") + '"/>'; });
  var lobs = ""; D.LOB.forEach(function (c) { lobs += ldLobule(c, big, milk); });
  o += HOT(st.sc === "none" ? "Lobules, small without a pregnancy: a few alveoli on the end of each duct." : "Lobules of alveoli, the milk-making sacs; progesterone increased their number in pregnancy." + (suck ? " Full of milk now." : " A little milk only: progesterone holds prolactin back."), lobs);
  o += HOT("Nipple: the ducts open here." + (suck ? " Suckling here is what starts the reflex." : ""), D.AREOLA);
  if (suck) D.DUCTS.forEach(function (p, j) { o += ldDots(p, "n", t, "ld-milkd", 2, j * 0.17); });
  /* zoom lines to the magnified alveolus */
  o += '<path class="ld-zoom" d="M164 438L418 420M164 458L404 506"/><circle class="ld-zc" cx="150" cy="448" r="16"/>';

  /* ----- the nerve: suckling up to the hypothalamus ----- */
  o += HOT("Nerve signal from the nipple to the hypothalamus (through the spinal cord, drawn short). Suckling lowers dopamine and makes the hypothalamus produce oxytocin.", '<path class="ld-nerve' + (suck ? " is-on" : "") + '" d="' + ldPath(D.P_NERVE) + '"/><path class="ld-nerve' + (suck ? " is-on" : "") + '" d="' + ldPath(D.P_NERVE2) + '"/>');
  if (suck) { o += ldDots(D.P_NERVE, "u", t, "ld-imp", 2.2, 0); o += ldDots(D.P_NERVE2, "n", t, "ld-imp", 2.2, 0.3); }
  o += T(28, 330, "nerve", "ld-xs ld-nervet", "start");

  /* ----- the baby, or the placenta's progesterone ----- */
  if (suck) o += HOT("The baby suckling at the nipple.", D.BABY);
  if (preg) o += HOT("During pregnancy the placenta's progesterone antagonizes prolactin, locally in the breast, so full milk production waits for delivery. \"What you should know.\"",
    '<rect class="ld-tag ld-ptag" x="286" y="560" width="96" height="46" rx="8"/>' + T(294, 575, "placenta", "ld-xs b", "start") + T(294, 588, "progesterone", "ld-xs ld-progt", "start") + T(294, 601, "↑ high", "ld-xs ld-lv ld-up", "start")) +
    HOT("Progesterone antagonizes prolactin in the breast.", ldBrake([[382, 572], [398, 572], [408, 520]], "ld-brk-prog", true));
  if (st.sc === "none") o += T(320, 600, "no baby to feed", "ld-xs mut", "middle");

  /* ----- the magnified alveolus ----- */
  var ph = t ? (t % 2600) / 2600 : 0, sq = suck && t ? Math.pow(Math.sin(Math.PI * Math.min(1, ph / 0.45)), 2) : 0, k = 1 - 0.07 * sq;
  o += D.INSET;
  var g = '<g transform="translate(' + D.IC[0] + " " + D.IC[1] + ") scale(" + f1(k * 100) / 100 + ')">';
  g += '<circle class="ld-lumen" cx="0" cy="0" r="22"/>';
  if (milk) { var nd = suck ? 9 : 3, m; for (m = 0; m < nd; m++) { var aa = m * 2.4, rr = 4 + (m * 7) % 13; g += '<circle class="ld-milk" cx="' + f1(Math.cos(aa) * rr) + '" cy="' + f1(Math.sin(aa) * rr) + '" r="' + (suck ? 3.6 : 2.6) + '"/>'; } }
  g += D.CELLS + '<g class="' + (suck ? "ld-myo-on" : "") + '">' + D.MYO + "</g>" + '<circle class="ld-bm" cx="0" cy="0" r="41.5"/></g>';
  o += HOT("One alveolus, magnified: secretory cells around a lumen of milk, with myoepithelial cells around them. Prolactin drives the secretory cells to make milk; oxytocin makes the myoepithelial cells contract and squeeze it out." + (suck ? " Contracting now: letdown." : ""), g);
  if (suck) {
    o += ldDots(D.DUCTIN, "u", t, "ld-milkd", 2.6, 0);
    for (var c = 0; c < 4; c++) { var a2 = (c * 90 + 25) * Math.PI / 180, x1 = D.IC[0] + Math.cos(a2) * 54, y1 = D.IC[1] + Math.sin(a2) * 54, x2 = D.IC[0] + Math.cos(a2) * 46, y2 = D.IC[1] + Math.sin(a2) * 46;
      o += '<path class="ld-sqz" d="M' + f1(x1) + " " + f1(y1) + "L" + f1(x2) + " " + f1(y2) + '"/>'; }
  }
  o += L(398, 410, "alveolus", 430, 446, "end", "ld-xs b");
  o += L(512, 548, "myoepithelial cells", 482, 498, "end", "ld-xs b");

  /* ----- level chips ----- */
  var C = [["dopamine", "da", "ld-dat"], ["prolactin", "prl", "ld-prlt"], ["oxytocin", "oxy", "ld-oxyt"], ["GnRH", "gn", "ld-gnt"], ["LH and FSH", "lh", "ld-lht"]];
  C.forEach(function (c, j) { o += ldChip(418, 10 + j * 48, c[0], lv[c[1]], D.INFO[c[1]], ring(c[1]), c[2]); });
  o += ldChip(418, 346, "periods", lv.per, D.INFO.per, ring("per"), "");
  o += ldChip(250, 410, "milk made", lv.milk, D.INFO.milk, ring("milk"), "");
  o += ldChip(418, 562, "letdown", lv.let, D.INFO.let, ring("let"), "ld-oxyt");
  return o;
}

function ldSay(st, D) { var S = D.SC[st.sc]; return [S.say, S.ro]; }

const SC = {
  none: { lv: { da: "u", prl: "low", oxy: "low", gn: "n", lh: "cyc", per: "cyc", milk: "none", let: "no" },
    say: "No baby to feed: the hypothalamus releases dopamine constantly, and dopamine holds prolactin release from the anterior pituitary down. There's no need for milk, so prolactin stays low. GnRH drives LH and FSH, and the cycle runs.",
    ro: "dopamine on · prolactin low" },
  suck: { lv: { da: "falls", prl: "u", oxy: "u", gn: "inh", lh: "d", per: "stop", milk: "made", let: "yes" },
    say: "Suckling: the nerve signal lowers dopamine, so the anterior pituitary releases prolactin (prolactin releasing factor adds to it), and prolactin drives full milk production in the alveoli. Suckling also makes the hypothalamus produce oxytocin, released from the posterior pituitary; it contracts the myoepithelial cells around each alveolus: letdown. Prolactin inhibits GnRH, so LH and FSH fall and the periods stop.",
    ro: "dopamine ↓ · prolactin ↑ · letdown" },
  preg: { lv: { da: "ng", prl: "rise", oxy: "ng", gn: "ng", lh: "d", per: "stop", milk: "little", let: "no" },
    say: "Late pregnancy: estrogen has grown the ducts, progesterone has added alveoli, and prolactin is rising, building up the milk enzymes. But the placenta's progesterone antagonizes prolactin in the breast, so there's only a little milk. When the placenta is delivered, progesterone falls and the brake comes off.",
    ro: "progesterone ⊣ prolactin" },
};
const INFO = {
  da: "Dopamine from the hypothalamus: the constant brake on prolactin release.",
  prl: "Prolactin from the anterior pituitary: it makes the milk (milk production) and inhibits GnRH.",
  oxy: "Oxytocin, made in the hypothalamus and released from the posterior pituitary: it contracts the myoepithelial cells (milk letdown).",
  gn: "GnRH from the hypothalamus: it drives LH and FSH.",
  lh: "LH and FSH from the anterior pituitary: they drive the ovary and the monthly cycle.",
  per: "The menstrual periods: they stop when LH and FSH are low (amenorrhea).",
  milk: "Milk production in the alveoli: prolactin's job.",
  let: "Milk letdown: oxytocin's job, through the myoepithelial cells.",
};

export default function letdown() {
  const A = staticArt();
  const D = Object.assign({}, A, { SC, INFO, LOB, IC, ANIM: true, INIT: { sc: "suck" } });
  return makeFig({
    id: "letdown", lec: "preg", fig: "Fig 4", short: "The breastfeeding reflex", hint: "pick · hover",
    title: "The breastfeeding reflex",
    caption: "Suckling at the nipple signals the hypothalamus: dopamine falls so prolactin makes milk, oxytocin lets it down, and prolactin shuts GnRH off. Compare it with no baby to feed and with late pregnancy, when progesterone holds prolactin back.",
    W, H,
    label: "The breastfeeding reflexes: a nerve signal from the nipple to the hypothalamus lowers dopamine, so the anterior pituitary releases prolactin, which makes milk in the alveoli; the hypothalamus makes oxytocin, released from the posterior pituitary, which contracts the myoepithelial cells around an alveolus (letdown); prolactin inhibits GnRH, so LH and FSH fall.",
    D, render: ldRender, say: ldSay, helpers: [ldPath, ldDots, ldWord, ldCW, ldChip, ldBrake, ldLobule],
    controls: `<div class="am-controls" role="group" aria-label="State">${[["none", "No baby to feed"], ["suck", "Suckling"], ["preg", "Late pregnancy"]].map((b) => `<button type="button" class="am-btn" data-amk="sc" data-amv="${b[0]}">${b[1]}</button>`).join("")}</div>`,
    sources: [
      "From the L17 notes (Dr. Madison): dopamine from the hypothalamus tonically inhibits prolactin release from the anterior pituitary; suckling decreases dopamine, and prolactin releasing factor pushes prolactin up further (low dopamine means high prolactin); suckling makes the hypothalamus produce oxytocin, released from the posterior pituitary; prolactin makes the milk and oxytocin contracts the myoepithelial cells around each alveolus (letdown); prolactin inhibits GnRH, so LH and FSH fall and the periods stop; during pregnancy estrogen grows the ducts and fat, progesterone increases the alveoli, prolactin rises, and progesterone antagonizes prolactin in the breast, so full milk waits for delivery; LH and FSH are suppressed in pregnancy.",
      "Where the lecture differs from textbooks, the figure follows the lecture: Dr. Madison names progesterone as prolactin's antagonist in pregnancy (Costanzo and Guyton name estrogen and progesterone together), and ties the baby's sounds and sight and the emotions of delivery to lower dopamine (physiology texts tie the baby's cry mainly to oxytocin and letdown). Levels the lecture doesn't give for a state are marked \"not given.\"",
      "Costanzo, Physiology (7th ed.), and Guyton and Hall, Textbook of Medical Physiology (14th ed.), lactation: the two pathways of the reflex (dopamine down the portal vessels to the anterior pituitary, oxytocin down the axons of the stalk to the posterior pituitary), and the alveolus with its myoepithelial cells. Crowley, Comprehensive Physiology 2015;5:255-291 (neuroendocrine regulation of lactation): the afferent path from the nipple to the hypothalamus and prolactin's suppression of GnRH during lactation.",
      "Ramsay and colleagues, Journal of Anatomy 2005;206:525-534 (the lactating breast by ultrasound): small ducts that branch close to the nipple and glandular tissue near it, which is how the ducts are drawn. Ross and Pawlina, Histology (8th ed.): the alveolus in section, a single layer of secretory cells with flat myoepithelial cells between them and the basement membrane.",
      "Schematic and not to scale. The nerve path from the nipple to the hypothalamus runs through the spinal cord and brainstem, drawn as one short line; the three neurons stand for groups of them, and their positions are illustrative. The dots show direction and more or less, not amounts; the alveolus's squeeze is exaggerated so it can be seen.",
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
.anima .letdown-svg .ld-stalk{fill:var(--anatomy-shade-1);stroke:var(--anatomy-mid);stroke-width:1.1}
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
.anima .letdown-svg .ld-skin{fill:var(--anatomy-shade-2);stroke:var(--anatomy-mid);stroke-width:1.3}
.anima .letdown-svg .ld-feat{fill:none;stroke:var(--anatomy-mid);stroke-width:1.3;stroke-linecap:round}
.anima .letdown-svg .ld-ova{fill:color-mix(in srgb,var(--bx-eosin) 30%,var(--anatomy-face));stroke:var(--anatomy-mid);stroke-width:1.2}
.anima .letdown-svg .ld-foll{fill:var(--bx-lumen);stroke:var(--bx-cyto-line);stroke-width:1}
.anima .letdown-svg .ld-foll.ld-dom{stroke-width:1.6;stroke:var(--bx-glu)}
.anima .letdown-svg .ld-inset{fill:color-mix(in srgb,var(--bx-fat) 70%,var(--bx-matrix));stroke:var(--anatomy-mid);stroke-width:1.4}
.anima .letdown-svg .ld-capo{fill:none;stroke:var(--bx-blood);stroke-width:9;stroke-linecap:round}
.anima .letdown-svg .ld-capi{fill:none;stroke:var(--bx-blood-soft);stroke-width:6.6;stroke-linecap:round}
.anima .letdown-svg .ld-ductw{fill:var(--ld-milk);stroke:var(--bx-cyto-line);stroke-width:1.2}
.anima .letdown-svg .ld-lumen{fill:var(--bx-lumen);stroke:var(--bx-cyto-line);stroke-width:.8}
.anima .letdown-svg .ld-sec{fill:var(--bx-cyto);stroke:var(--bx-cyto-line);stroke-width:.8}
.anima .letdown-svg .ld-snu{fill:var(--bx-nuc)}
.anima .letdown-svg .ld-myo{fill:color-mix(in srgb,var(--bx-memb) 45%,var(--bx-cyto));stroke:var(--bx-memb);stroke-width:.8}
.anima .letdown-svg .ld-myo-on .ld-myo{fill:var(--bx-memb)}
.anima .letdown-svg .ld-bm{fill:none;stroke:var(--anatomy-mid);stroke-width:.8}
.anima .letdown-svg .ld-sqz{fill:none;stroke:var(--bx-memb);stroke-width:2;stroke-linecap:round}
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
