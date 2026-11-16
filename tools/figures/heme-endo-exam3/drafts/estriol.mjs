// Fig: the fetoplacental unit makes estriol (L17 Pregnancy and Lactation, Dr. Madison: "Making progesterone and
// estrogen: mother, placenta and fetus"). Three places stacked as they sit in the uterus: the mother's blood in the
// uterine wall at the top, the placenta under it in section (villous trees bathed in her blood, the basal plate against
// the wall, the chorionic plate below), the umbilical cord, and the fetus lying on its back with a window cut into its
// abdomen to show the liver and the large fetal adrenal on its kidney. One route of moving dots runs round the loop:
// cholesterol from the mother, cholesterol desmolase in the placenta (pregnenolone, and progesterone on its own), the
// fetal adrenal's 17,20 desmolase and sulfate (DHEA sulfate), the fetal liver's 16-hydroxylation, the placenta's
// aromatase (estriol), and estriol into the mother's blood. Step through it, or switch off the fetal adrenal or liver
// and watch her estriol fall while her progesterone holds. Levels are qualitative (normal, low).
import { makeFig, f1, T, L, HOT } from "./shared.mjs";

const W = 520, H = 592;

/* ---------- build-time geometry ---------- */
function sm(p, closed) {
  /* smooth path through p (Catmull-Rom as cubic Beziers); open paths keep their ends */
  var n = p.length, last = closed ? n : n - 1, d = "M" + f1(p[0][0]) + " " + f1(p[0][1]), i, a, b, c, e;
  for (i = 0; i < last; i++) {
    a = p[(i - 1 + n) % n]; b = p[i]; c = p[(i + 1) % n]; e = p[(i + 2) % n];
    if (!closed) { if (i === 0) a = b; if (i + 2 >= n) e = c; }
    d += "C" + f1(b[0] + (c[0] - a[0]) / 6) + " " + f1(b[1] + (c[1] - a[1]) / 6) + " " + f1(c[0] - (e[0] - b[0]) / 6) + " " + f1(c[1] - (e[1] - b[1]) / 6) + " " + f1(c[0]) + " " + f1(c[1]);
  }
  return d + (closed ? "Z" : "");
}
function cub(p0, p1, p2, p3, t) { var u = 1 - t; return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]; }
/* the placenta's outline: flat against the uterine wall, its fetal (chorionic) side bowed down to the cord */
const LENS = [[[510, 94], [514, 150], [440, 224], [260, 232]], [[260, 232], [80, 224], [6, 150], [10, 94]]];
const LENS_D = "M10 94L510 94C514 150 440 224 260 232C80 224 6 150 10 94Z";
const BOTTOM = [];
LENS.forEach((c) => { for (let k = 0; k <= 80; k++) BOTTOM.push(cub(c[0], c[1], c[2], c[3], k / 80)); });
function bottomAt(x) { let best = BOTTOM[0]; BOTTOM.forEach((q) => { if (Math.abs(q[0] - x) < Math.abs(best[0] - x)) best = q; }); return best[1]; }
/* a polyline sampled from a smooth open curve, and the same line moved sideways by off */
function sampleSm(p, n) {
  const out = [];
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[Math.max(0, i - 1)], b = p[i], c = p[i + 1], e = p[Math.min(p.length - 1, i + 2)];
    const c1 = [b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6], c2 = [c[0] - (e[0] - b[0]) / 6, c[1] - (e[1] - b[1]) / 6];
    for (let k = i ? 1 : 0; k <= n; k++) out.push(cub(b, c1, c2, c, k / n));
  }
  return out;
}
function offset(pl, off) {
  return pl.map((q, i) => { const a = pl[Math.max(0, i - 1)], b = pl[Math.min(pl.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], m = Math.hypot(dx, dy) || 1; return [q[0] - dy / m * off, q[1] + dx / m * off]; });
}
const r1 = (p) => p.map((q) => [f1(q[0]), f1(q[1])]);

/* a villous tree: a stem from the chorionic plate that branches three times, ending in knobs (the terminal villi) */
function tree(x0, top, seed) {
  const segs = [], knobs = [];
  const y0 = bottomAt(x0) - 3, h = y0 - top;
  function grow(x, y, ang, len, w, depth) {
    const x2 = x + Math.sin(ang) * len, y2 = y - Math.cos(ang) * len;
    segs.push([x, y, x2, y2, w]);
    if (depth === 0) { knobs.push([x2, y2, Math.max(2.4, w * 0.9)]); return; }
    const j = ((seed * 7 + depth * 3) % 5 - 2) * 0.06;
    grow(x2, y2, ang - 0.5 + j, len * 0.6, w * 0.7, depth - 1);
    grow(x2, y2, ang + 0.46 + j, len * 0.56, w * 0.7, depth - 1);
  }
  grow(x0, y0, ((seed % 3) - 1) * 0.07, h * 0.44, 8, 3);
  return { segs, knobs };
}

function staticArt() {
  const o = {};
  /* the uterine wall: smooth muscle cells as spindles with long nuclei, around the mother's vessel */
  let myo = '<rect class="es-myo" x="6" y="46" width="508" height="42" rx="9"/>';
  for (let row = 0; row < 2; row++) for (let i = 0; i < 17; i++) {
    const cx = 22 + i * 29.4 + (row ? 14 : 0), cy = row ? 80 : 53, rx = 12.5, ry = 2.6;
    if (cx > 500) continue;
    myo += '<path class="es-smc" d="M' + f1(cx - rx) + " " + cy + "Q" + f1(cx) + " " + f1(cy - ry * 2) + " " + f1(cx + rx) + " " + cy + "Q" + f1(cx) + " " + f1(cy + ry * 2) + " " + f1(cx - rx) + " " + cy + 'Z"/><ellipse class="es-smn" cx="' + f1(cx) + '" cy="' + cy + '" rx="4.6" ry="1.1"/>';
  }
  o.MYO = myo;
  o.VESSEL = '<rect class="es-ves" x="6" y="58" width="508" height="16"/><path class="es-vesl" d="M6 58H514M6 74H514"/>';
  /* the placenta: the pool of her blood, the villous trees, the basal plate, the chorionic plate with its fetal vessels */
  let pl = '<path class="es-ivs" d="' + LENS_D + '"/>';
  const trees = [[30, 112, 1], [70, 102, 2], [104, 122, 3], [140, 101, 4], [176, 118, 5], [212, 103, 6], [244, 124, 7], [278, 102, 8], [312, 120, 9], [346, 101, 10], [382, 118, 11], [418, 102, 12], [452, 116, 13], [488, 108, 14]];
  let vo = "", vi = "", kn = "";
  trees.forEach(function (tr) {
    const g = tree(tr[0], tr[1], tr[2]);
    g.segs.forEach(function (s) { const d = "M" + f1(s[0]) + " " + f1(s[1]) + "L" + f1(s[2]) + " " + f1(s[3]); vo += '<path class="es-vilo" d="' + d + '" stroke-width="' + f1(s[4] + 1.8) + '"/>'; vi += '<path class="es-vili" d="' + d + '" stroke-width="' + f1(s[4]) + '"/>'; });
    g.knobs.forEach(function (k) { kn += '<circle class="es-knobo" cx="' + f1(k[0]) + '" cy="' + f1(k[1]) + '" r="' + f1(k[2] + 0.9) + '"/>'; vi += '<circle class="es-knob" cx="' + f1(k[0]) + '" cy="' + f1(k[1]) + '" r="' + f1(k[2]) + '"/>'; });
  });
  pl += vo + kn + vi;
  pl += '<path class="es-basal" d="M10 94L510 94"/>';
  pl += '<path class="es-chor" d="M510 94C514 150 440 224 260 232C80 224 6 150 10 94"/>';
  /* fetal vessels on the chorionic plate, running to the cord */
  const CH = function (x) { return [x, bottomAt(x) - 3]; };
  o.CHV_L = [CH(104), CH(150), CH(200), CH(236), [254, 231]];
  o.CHV_R = [[265, 231], CH(290), CH(340), CH(390), CH(420)];
  pl += '<path class="es-chv" d="' + sm(r1(o.CHV_L)) + '"/><path class="es-chv" d="' + sm(r1(o.CHV_R)) + '"/>';
  pl += '<path class="es-lensl" d="' + LENS_D + '"/>';
  o.PLAC = pl;
  /* the spiral artery (left) and the two veins that drain her blood back to the wall */
  o.SPIRAL = '<path class="es-art" d="M64 74C56 78 72 82 64 86C56 90 72 94 64 98L62 104"/>';
  o.VEINS = '<path class="es-vein" d="M176 74L176 100"/><path class="es-vein" d="M446 74L446 100"/>';
  /* the cord, coiling from the chorionic plate to the umbilicus, with its vein and the arteries along it */
  const CORD = [[259, 230], [268, 268], [250, 308], [266, 348], [258, 384]];
  const cl = sampleSm(CORD, 14);
  o.CORD = '<path class="es-cordo" d="' + sm(CORD) + '"/><path class="es-cordi" d="' + sm(CORD) + '"/>' +
    '<path class="es-cvein" d="' + sm(r1(offset(cl, 4)).filter((q, i) => i % 7 === 0 || i === cl.length - 1)) + '"/>' +
    '<path class="es-cart" d="' + sm(r1(offset(cl, -5)).filter((q, i) => i % 7 === 0 || i === cl.length - 1)) + '"/>';
  const DN = r1(offset(cl, 4)).filter((q, i) => i % 4 === 0 || i === cl.length - 1), UP = r1(offset(cl, -5)).filter((q, i) => i % 4 === 0 || i === cl.length - 1).reverse();
  /* the fetus, on its back, head to the right: trunk, near leg flexed, near arm folded, head */
  const trunk = [[394, 416], [372, 398], [336, 386], [296, 381], [258, 383], [222, 389], [192, 404], [170, 428], [163, 460], [177, 492], [211, 512], [262, 520], [318, 519], [360, 511], [388, 494], [398, 464]];
  const head = [[446, 390], [478, 398], [500, 422], [506, 452], [496, 482], [470, 502], [440, 506], [410, 494], [392, 468], [390, 438], [404, 410], [420, 396]];
  o.BODY = '<path class="es-skin" d="' + sm(trunk, true) + '"/>';
  o.HEAD = '<path class="es-skin" d="' + sm(head, true) + '"/><path class="es-ear" d="M446 438C454 434 460 442 457 450C454 458 446 458 444 452"/>' +
    '<path class="es-lid" d="M466 412C471 417 478 417 482 412"/>';
  /* the near leg folded tight (thigh up along the belly, shin back down beside it, foot by the buttocks) */
  o.LEG = '<path class="es-skin" d="' + sm([[176, 470], [186, 436], [206, 404], [222, 384], [236, 380], [242, 392], [232, 414], [214, 446], [200, 474], [188, 482]], true) + '"/>' +
    '<path class="es-skin" d="' + sm([[228, 386], [210, 396], [190, 412], [172, 432], [160, 448], [158, 460], [168, 462], [184, 448], [204, 428], [226, 408], [238, 396]], true) + '"/>' +
    '<path class="es-skin" d="' + sm([[160, 446], [150, 452], [146, 464], [154, 470], [166, 464], [170, 454]], true) + '"/>';
  /* the near arm folded, hand at the chin */
  o.ARM = '<path class="es-skin" d="' + sm([[384, 452], [366, 438], [352, 420], [352, 404], [364, 396], [384, 394], [396, 398], [394, 408], [378, 408], [368, 412], [372, 424], [390, 440]], true) + '"/>';
  /* the window into the abdomen and the organs in it */
  o.WIN = '<ellipse class="es-win" cx="292" cy="452" rx="62" ry="44"/>';
  o.WINRIM = '<ellipse class="es-rim" cx="292" cy="452" rx="62" ry="44"/>';
  o.LIVER = '<path class="es-liver" d="' + sm([[284, 424], [308, 413], [332, 416], [348, 430], [344, 445], [320, 450], [298, 447], [282, 437]], true) + '"/><path class="es-livl" d="M314 415C320 424 320 438 316 449"/>';
  o.KIDNEY = '<path class="es-kid" d="' + sm([[240, 470], [256, 463], [272, 465], [280, 474], [274, 485], [256, 489], [242, 485], [236, 477]], true) + '"/><path class="es-hil" d="M258 477C262 475 266 475 270 477"/>';
  o.ADR = '<path class="es-adr" d="' + sm([[272, 458], [290, 455], [305, 464], [307, 480], [296, 491], [283, 489], [282, 477], [276, 466]], true) + '"/><path class="es-adrc" d="' + sm([[284, 463], [296, 463], [301, 472], [298, 482], [290, 483], [287, 472]], true) + '"/>';
  /* the routes; TRK_* are the parts drawn as tracks (in the cord its vessels are the track) */
  const PRE_A = [[104, 150], [104, 196]].concat(r1(sampleSm(o.CHV_L, 6)).slice(1)), PRE_B = [DN[DN.length - 1], [253, 400], [250, 422], [260, 446], [276, 457]];
  const OH_A = [[290, 420], [UP[0][0], UP[0][1]]], OH_B = [UP[UP.length - 1]].concat(r1(sampleSm(o.CHV_R, 6)).slice(1)).concat([[420, 196], [420, 150]]);
  o.P_CHOL = [[6, 66], [64, 66], [64, 104], [88, 128]];
  o.P_PROG = [[112, 122], [176, 102], [176, 66], [250, 66]];
  o.P_PREG = PRE_A.concat(DN.slice(1)).concat(PRE_B.slice(1));
  o.P_PROGF = PRE_A.concat(DN.slice(1));
  o.P_DHEAS = [[298, 460], [304, 448]];
  o.P_16OH = OH_A.concat(UP.slice(1)).concat(OH_B.slice(1));
  o.P_E3 = [[432, 124], [446, 102], [446, 66], [514, 66]];
  o.TRK_PREG = [PRE_A, PRE_B]; o.TRK_16OH = [OH_A, OH_B];
  return o;
}

/* ---------- page helpers (serialized into the page) ---------- */
function esPath(p) { var o = "", i; for (i = 0; i < p.length; i++) o += (i ? "L" : "M") + f1(p[i][0]) + " " + f1(p[i][1]); return o; }
/* dots riding a polyline; spacing and speed fixed, opacity op; t = 0 gives a still frame */
function esDots(p, t, cls, r, ph, op, gap) {
  var c = [0], Lt = 0, i, k, o = "";
  for (i = 1; i < p.length; i++) { Lt += Math.sqrt(Math.pow(p[i][0] - p[i - 1][0], 2) + Math.pow(p[i][1] - p[i - 1][1], 2)); c.push(Lt); }
  var n = Math.max(1, Math.round(Lt / (gap || 30)));
  for (k = 0; k < n; k++) {
    var u = t ? ((t * 0.045 / Lt + k / n + (ph || 0)) % 1) : ((k + 0.5) / n + (ph || 0)) % 1, s = u * Lt, j = 1;
    while (j < c.length - 1 && c[j] < s) j++;
    var f = (s - c[j - 1]) / ((c[j] - c[j - 1]) || 1), x = p[j - 1][0] + (p[j][0] - p[j - 1][0]) * f, y = p[j - 1][1] + (p[j][1] - p[j - 1][1]) * f;
    var a = Math.min(1, u / 0.06, (1 - u) / 0.06) * op;
    o += '<circle class="' + cls + '" cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + r + '" opacity="' + f1(a) + '"/>';
  }
  return o;
}
/* a labeled card: lines [[text, cls]], the first bold; lit rings it, off greys it */
function esCard(x, y, w, lines, info, lit, off) {
  var h = 10 + lines.length * 13.5, o = "";
  if (lit) o += '<rect class="es-ring" x="' + f1(x - 3.5) + '" y="' + f1(y - 3.5) + '" width="' + f1(w + 7) + '" height="' + f1(h + 7) + '" rx="10"/>';
  o += '<rect class="es-card' + (off ? " is-off" : "") + '" x="' + f1(x) + '" y="' + f1(y) + '" width="' + f1(w) + '" height="' + f1(h) + '" rx="7"/>';
  lines.forEach(function (ln, i) { o += T(x + 8, y + 15 + i * 13.5, ln[0], "es-xs " + (i ? "" : "b ") + (ln[1] || ""), "start"); });
  return HOT(info, o);
}
/* a level gauge: name over its arrow */
function esGauge(x, y, name, v, info, ncls) {
  var word = { n: "= normal", d: "↓ low" }[v], w = Math.round(Math.max(name.length, word.length) * 6.6 + 16), cls = v === "d" ? "es-dn" : "es-eq";
  return HOT(info, '<rect class="es-gauge ' + cls + '" x="' + f1(x) + '" y="' + f1(y) + '" width="' + w + '" height="32" rx="8"/>' +
    T(x + 8, y + 13, name, "es-xs " + (ncls || ""), "start") + T(x + 8, y + 26.5, word, "es-xs es-lv " + cls, "start"));
}
function esStamp(x, y, s) { var w = s.length * 6.6 + 14; return '<rect class="es-stamp" x="' + f1(x - w / 2) + '" y="' + f1(y - 11) + '" width="' + f1(w) + '" height="16" rx="4"/>' + T(x, y + 1, s, "es-xs es-stampt", "middle"); }

function esRender(st, D) {
  var t = st.t || 0, s = st.s, sc = st.sc, o = "";
  var flows = D.CASE[sc].flows; /* which segments run in this case */
  function op(k) { return s === 0 || s === k ? 1 : 0.2; }
  function lit(k) { return s === k; }
  var adrOff = sc === "adr", livOff = sc === "liv";

  /* ----- the mother: uterine wall and her blood ----- */
  o += HOT("The uterine wall (smooth muscle), with a vessel of the mother's blood running through it.", D.MYO);
  o += HOT("The mother's blood. It brings the cholesterol in, and it carries the progesterone and estriol the placenta makes out to her body: her estriol level is measured here.", D.VESSEL);
  o += T(14, 26, "MOTHER", "es-xs es-tag", "start");
  /* ----- the placenta ----- */
  o += HOT("The placenta in section: villous trees, covered by the trophoblast, hang in a pool of the mother's blood. The flat side is anchored to the uterine wall; fetal vessels on the bowed side gather into the cord. Its enzymes are cholesterol desmolase and aromatase, but not 17,20 desmolase.", D.PLAC);
  o += HOT("A spiral artery brings the mother's blood, and the cholesterol in it, into the placenta.", D.SPIRAL);
  o += HOT("Veins drain the mother's blood back out of the placenta, carrying its progesterone and estriol.", D.VEINS);
  o += T(14, 240, "PLACENTA", "es-xs es-tag", "start");
  /* ----- the cord and the fetus ----- */
  o += HOT("The fetus, on its back with its head to the right, with a window cut into its abdomen: the liver in front, and the large fetal adrenal on top of the kidney behind it.", D.BODY + D.LEG + D.WIN);
  o += T(14, 470, "FETUS", "es-xs es-tag", "start");
  o += HOT("Fetal liver: it hydroxylates DHEA sulfate, giving 16-hydroxy DHEA sulfate." + (livOff ? " Not working in this case." : ""), '<g class="' + (livOff ? "es-fail" : "") + '">' + D.LIVER + "</g>");
  o += HOT("Fetal kidney: not part of this route. (The 16-hydroxylation is the liver's, not the kidney's.)", D.KIDNEY);
  o += HOT("Fetal adrenal gland, large in the fetus, capping the kidney: its 17,20 desmolase makes the androgen DHEA, and it adds a sulfate (DHEA sulfate), which keeps the androgen from virilizing the fetus." + (adrOff ? " Not working in this case." : ""), '<g class="' + (adrOff ? "es-fail" : "") + '">' + D.ADR + "</g>");
  o += D.WINRIM + D.HEAD + D.ARM;
  o += HOT("The umbilical cord: pregnenolone (and progesterone) travel down it to the fetus, and 16-hydroxy DHEA sulfate travels back up it to the placenta.", D.CORD);

  /* ----- the route: tracks, then dots ----- */
  var SEG = [["P_CHOL", 1, "es-chol", "chol"], ["P_PROG", 2, "es-prog", "prog"], ["P_PROGF", 2, "es-prog", "prog"], ["P_PREG", 3, "es-preg", "preg"], ["P_DHEAS", 4, "es-dheas", "dheas"], ["P_16OH", 5, "es-oh", "oh"], ["P_E3", 6, "es-e3", "e3"]];
  SEG.forEach(function (g) {
    if (g[0] === "P_PROGF") return;
    var on = flows.indexOf(g[3]) >= 0, trk = D["TRK" + g[0].slice(1)] || [D[g[0]]];
    trk.forEach(function (p) { o += '<path class="es-route ' + g[2] + "l" + (on ? "" : " is-off") + (lit(g[1]) ? " is-lit" : "") + '" d="' + esPath(p) + '" opacity="' + f1(on ? (s === 0 || lit(g[1]) ? 0.85 : 0.3) : 0.4) + '"/>'; });
  });
  SEG.forEach(function (g, j) {
    if (flows.indexOf(g[3]) < 0) return;
    o += esDots(D[g[0]], t, g[2], g[0] === "P_DHEAS" ? 2.3 : 2.8, j * 0.13 + (g[0] === "P_PROGF" ? 0.5 : 0), op(g[1]), g[0] === "P_DHEAS" ? 8 : g[0] === "P_PROGF" ? 60 : 30);
  });

  /* ----- the cards ----- */
  o += esCard(84, 4, 156, [["cholesterol", "es-cholt"], ["mostly from her diet", "mut"]], "Every pregnancy steroid starts from cholesterol supplied by the mother, mostly from her diet. Her blood carries it into the placenta.", lit(1), false);
  o += esGauge(298, 4, "her progesterone", D.CASE[sc].prog, "Progesterone in the mother's blood. The placenta makes it on its own, so it doesn't depend on the fetus.", "es-progt");
  o += esGauge(426, 4, "her estriol", D.CASE[sc].e3, "Estriol in the mother's blood, the predominant estrogen of pregnancy. Making it takes a working fetal adrenal and liver, so her level reflects the health of the fetus.", "es-e3t");
  if (lit(6)) o += '<rect class="es-ring" x="422.5" y="0.5" width="95.6" height="39" rx="10"/>';
  o += HOT("Where the placenta's cholesterol desmolase works: in the trophoblast covering the villi, bathed in the mother's blood.", '<ellipse class="es-site' + (lit(2) ? " is-lit" : "") + '" cx="104" cy="134" rx="30" ry="22"/>');
  o += '<path class="lead" d="M150 248L124 150"/><circle class="dot" cx="124" cy="150" r="1.8"/>';
  o += esCard(10, 248, 188, [["cholesterol desmolase", ""], ["cholesterol → pregnenolone", "es-pregt"], ["+ progesterone, on its own", "es-progt"]],
    "The placenta has cholesterol desmolase: it turns the mother's cholesterol into pregnenolone, and it makes progesterone on its own (after the first trimester it supplies it to both mother and fetus).", lit(2), false);
  o += HOT("Where the placenta's aromatase works: the same trophoblast, here turning the fetus's 16-hydroxy DHEA sulfate into estriol.", '<ellipse class="es-site' + (lit(5) ? " is-lit" : "") + '" cx="424" cy="134" rx="30" ry="22"/>');
  o += '<path class="lead" d="M474 248L444 150"/><circle class="dot" cx="444" cy="150" r="1.8"/>';
  o += esCard(334, 248, 176, [["aromatase", ""], ["16-hydroxy DHEA sulfate", "es-oht"], ["→ estriol", "es-e3t"]],
    "The placenta has aromatase, the enzyme that turns androgens into estrogens: it converts the fetus's 16-hydroxy DHEA sulfate to estriol. (It can also use DHEA sulfate to make estradiol.)" + (sc === "ok" ? "" : " In this case it gets nothing from the fetus to make estriol from."), lit(5), false);
  o += HOT("What the placenta lacks: 17,20 desmolase. You need an androgen to make an estrogen, and that step takes the fetus. So to make estrogen, the placenta \"needs help from the baby.\"",
    (lit(3) ? '<rect class="es-ring" x="204.5" y="138.5" width="119" height="44" rx="10"/>' : "") + '<rect class="es-card es-lack" x="208" y="142" width="112" height="37" rx="7"/>' +
    '<path class="es-x" d="M218 152L226 160M226 152L218 160"/>' + T(232, 157, "lacks", "es-xs es-badt", "start") + T(216, 171, "17,20 desmolase", "es-xs b", "start"));
  o += '<path class="lead" d="M372 354L334 428"/><circle class="dot" cx="334" cy="428" r="1.8"/>';
  o += esCard(334, 308, 176, [["fetal liver", ""], ["16-hydroxylation", ""], ["→ 16-hydroxy DHEA sulfate", "es-oht"]],
    "The fetal liver hydroxylates DHEA sulfate, giving 16-hydroxy DHEA sulfate, which goes back to the placenta." + (livOff ? " Not working in this case." : ""), lit(4), livOff);
  o += '<path class="lead" d="M294 538L294 476"/><circle class="dot" cx="294" cy="476" r="1.8"/>';
  o += esCard(204, 538, 182, [["fetal adrenal", ""], ["17,20 desmolase + sulfate", ""], ["→ DHEA sulfate", "es-dheast"]],
    "The fetal adrenal has the 17,20 desmolase the placenta lacks: from pregnenolone it makes the androgen DHEA and adds a sulfate. DHEA sulfate can't virilize the fetus." + (adrOff ? " Not working in this case." : ""), lit(3), adrOff);
  if (adrOff) o += esStamp(336, 552, "not working");
  if (livOff) o += esStamp(462, 322, "not working");
  return o;
}

function esSay(st, D) {
  var C = D.CASE[st.sc], sum = D.STEPS[st.s][1] + (st.sc === "ok" ? "" : " " + C.say);
  var ro = (st.s ? st.s + "/6 " + D.STEPS[st.s][0] : "whole route") + " · " + C.ro;
  return [sum, ro];
}
function esOnset(st, k) { if (k === "sc") st.s = 0; }

const STEPS = [
  ["", "The route: the mother supplies cholesterol; the placenta's cholesterol desmolase makes pregnenolone (and progesterone, on its own); the fetal adrenal's 17,20 desmolase makes DHEA sulfate; the fetal liver hydroxylates it; and the placenta's aromatase finishes estriol, which goes into the mother's blood. Press Next to follow it one step at a time."],
  ["cholesterol", "1. Cholesterol from the mother, mostly from her diet, reaches the placenta in her blood. Every pregnancy steroid starts here."],
  ["desmolase", "2. The placenta's cholesterol desmolase turns cholesterol into pregnenolone. From it the placenta makes progesterone on its own, and after the first trimester it supplies it to both mother and fetus."],
  ["fetal adrenal", "3. The placenta lacks 17,20 desmolase, and you need an androgen to make an estrogen. So pregnenolone goes to the fetus, whose adrenal has the enzyme: it makes the androgen DHEA and adds a sulfate. The sulfate keeps DHEA sulfate from virilizing the fetus."],
  ["fetal liver", "4. The fetal liver hydroxylates it, giving 16-hydroxy DHEA sulfate."],
  ["aromatase", "5. Back in the placenta, aromatase, the enzyme that turns androgens into estrogens, converts 16-hydroxy DHEA sulfate to estriol, the predominant estrogen of pregnancy."],
  ["estriol", "6. Estriol goes into the mother's blood. Making it takes a working fetal adrenal and liver, so her estriol level reflects the health of the fetus."],
];
const CASE = {
  ok: { flows: ["chol", "prog", "preg", "dheas", "oh", "e3"], prog: "n", e3: "n", ro: "estriol normal", say: "" },
  adr: { flows: ["chol", "prog", "preg"], prog: "n", e3: "d", ro: "adrenal off, estriol ↓",
    say: "Fetal adrenal not working: there's no 17,20 desmolase step, so no DHEA sulfate, nothing for the liver or the placenta's aromatase, and the mother's estriol falls. Her progesterone doesn't: the placenta makes it on its own." },
  liv: { flows: ["chol", "prog", "preg", "dheas"], prog: "n", e3: "d", ro: "liver off, estriol ↓",
    say: "Fetal liver not working: DHEA sulfate isn't 16-hydroxylated, so the placenta's aromatase has nothing to make estriol from, and the mother's estriol falls. Her progesterone holds: the placenta makes it on its own." },
};

export default function estriol() {
  const A = staticArt();
  const D = Object.assign({}, A, { STEPS, CASE, ANIM: true, INIT: { s: 0, sc: "ok" }, STEPKEY: "s", STEPMAX: 6, PLAYMS: 3200, ONSET: "esOnset" });
  return makeFig({
    id: "estriol", lec: "preg", fig: "Fig 3", short: "Making estriol", hint: "step · switch off · hover",
    title: "The fetoplacental unit makes estriol",
    caption: "Dr. Madison's route from the mother's cholesterol to estriol, back and forth between the placenta and the fetus. Step through it, tap an enzyme to see who has it, and switch off the fetal adrenal or liver to watch the mother's estriol fall.",
    W, H,
    label: "Estriol synthesis in pregnancy: the mother's cholesterol enters the placenta, whose cholesterol desmolase makes pregnenolone and progesterone; pregnenolone goes down the cord to the fetal adrenal, whose 17,20 desmolase and sulfation make DHEA sulfate; the fetal liver 16-hydroxylates it; the placenta's aromatase converts it to estriol, which enters the mother's blood.",
    D, render: esRender, say: esSay, helpers: [esPath, esDots, esCard, esGauge, esStamp, esOnset],
    controls: `<div class="am-controls"><button type="button" class="am-btn" data-amstep="-1">Back</button><button type="button" class="am-btn" data-amstep="1">Next</button><button type="button" class="am-btn" data-amplay aria-pressed="false">Play</button><button type="button" class="am-btn" data-amk="s" data-amv="0">Whole route</button></div>
<div class="am-controls" role="group" aria-label="Fetus">${[["ok", "Healthy fetus"], ["adr", "Fetal adrenal not working"], ["liv", "Fetal liver not working"]].map((b) => `<button type="button" class="am-btn" data-amk="sc" data-amv="${b[0]}">${b[1]}</button>`).join("")}</div>`,
    sources: [
      "From the L17 notes (Dr. Madison): every pregnancy steroid starts from cholesterol supplied by the mother, mostly from her diet; the placenta makes progesterone on its own; the placenta has cholesterol desmolase and aromatase but lacks 17,20 desmolase, so the fetal adrenal makes DHEA, adds a sulfate (which keeps it from virilizing the fetus), the fetal liver hydroxylates it to 16-hydroxy DHEA sulfate, and the placenta's aromatase converts it to estriol; estriol is the estrogen of pregnancy, and the mother's level reflects the health of the fetus. The labels use the lecture's enzyme names.",
      "Where the lecture's two versions differ: in the recording the placenta makes pregnenolone and passes it to the fetus; the slide notes say the fetal adrenal can start from cholesterol. The figure follows the recording (as Costanzo does); either way the fetal adrenal supplies the 17,20 step. The deck's \"17,20 desmolase\" is what textbooks call 17,20-lyase (part of CYP17), and \"cholesterol desmolase\" is the side-chain cleavage enzyme.",
      "Costanzo, Physiology (7th ed.), the hormones of pregnancy, and Guyton and Hall, Textbook of Medical Physiology (14th ed.), pregnancy and lactation: the order of the route, which side has each enzyme, and that the placenta makes progesterone without the fetus. Strauss and Barbieri, eds., Yen & Jaffe's Reproductive Endocrinology (8th ed.): low maternal estriol when the fetal adrenal or liver can't do its step, which is what the two switches show (as a qualitative fall, not a number).",
      "Mesiano and Jaffe, Endocrine Reviews 1997;18:378-403 (the primate fetal adrenal cortex): the fetal adrenal is large, near the size of the kidney late in pregnancy, which is how it is drawn. Burton and Fowden, Philosophical Transactions B 2015;370:20140066: the villous trees bathed in maternal blood, anchored to the basal plate, which is how the placenta is drawn.",
      "Schematic and not to scale. Both enzymes of the placenta work in the same trophoblast; they are drawn at two ends of the placenta only to keep the route readable. The fetus is drawn lying on its back to keep the cord short, and the routes inside it stand for its blood, not real vessels. The dots show the order of the route, not amounts or speeds; the levels are only normal or low.",
    ],
    css: `
.anima[data-anima="estriol"] .am-svg{max-width:540px}
.anima .estriol-svg .t.es-xs{font-size:11px}
.anima .estriol-svg .t.es-tag{fill:var(--anatomy-muted);letter-spacing:.08em;font-weight:600}
.anima .estriol-svg .es-myo{fill:color-mix(in srgb,var(--bx-eosin) 30%,var(--anatomy-face));stroke:var(--anatomy-mid);stroke-width:1}
.anima .estriol-svg .es-smc{fill:color-mix(in srgb,var(--bx-eosin) 55%,var(--anatomy-face));stroke:var(--bx-cyto-line);stroke-width:.6}
.anima .estriol-svg .es-smn{fill:var(--bx-nuc)}
.anima .estriol-svg .es-ves{fill:var(--bx-blood-soft)}
.anima .estriol-svg .es-vesl{fill:none;stroke:var(--bx-blood);stroke-width:1.3}
.anima .estriol-svg .es-ivs{fill:color-mix(in srgb,var(--bx-blood-soft) 70%,var(--anatomy-face))}
.anima .estriol-svg .es-vilo{fill:none;stroke:var(--bx-cyto-line);stroke-linecap:round}
.anima .estriol-svg .es-vili{fill:none;stroke:var(--bx-cyto);stroke-linecap:round}
.anima .estriol-svg .es-knob{fill:var(--bx-cyto);stroke:none}
.anima .estriol-svg .es-knobo{fill:var(--bx-cyto-line);stroke:none}
.anima .estriol-svg .es-chv{fill:none;stroke:color-mix(in srgb,var(--bx-blood) 55%,var(--bx-blue));stroke-width:3;stroke-linecap:round;opacity:.7}
.anima .estriol-svg .es-site{fill:none;stroke:var(--anatomy-strong);stroke-width:1.3;stroke-dasharray:3 3}
.anima .estriol-svg .es-site.is-lit{stroke:var(--anatomy-lit);stroke-width:2.2;stroke-dasharray:none}
.anima .estriol-svg .es-basal{fill:none;stroke:var(--bx-memb);stroke-width:3}
.anima .estriol-svg .es-chor{fill:none;stroke:color-mix(in srgb,var(--bx-eosin) 70%,var(--anatomy-face));stroke-width:9}
.anima .estriol-svg .es-lensl{fill:none;stroke:var(--bx-memb);stroke-width:1.2}
.anima .estriol-svg .es-art{fill:none;stroke:var(--bx-blood);stroke-width:5;stroke-linecap:round}
.anima .estriol-svg .es-vein{fill:none;stroke:color-mix(in srgb,var(--bx-blood) 55%,var(--bx-blue));stroke-width:5;stroke-linecap:round}
.anima .estriol-svg .es-cordo{fill:none;stroke:var(--anatomy-mid);stroke-width:24;stroke-linecap:round}
.anima .estriol-svg .es-cordi{fill:none;stroke:color-mix(in srgb,var(--bx-blue-soft) 45%,var(--anatomy-face));stroke-width:21.6;stroke-linecap:round}
.anima .estriol-svg .es-cvein{fill:none;stroke:color-mix(in srgb,var(--bx-blood) 60%,var(--anatomy-face));stroke-width:4.4;opacity:.55}
.anima .estriol-svg .es-cart{fill:none;stroke:color-mix(in srgb,var(--bx-blue) 60%,var(--anatomy-face));stroke-width:3;opacity:.55}
.anima .estriol-svg .es-skin{fill:var(--anatomy-shade-2);stroke:var(--anatomy-mid);stroke-width:1.3}
.anima .estriol-svg .es-limbo{fill:none;stroke:var(--anatomy-mid);stroke-width:27;stroke-linecap:round;stroke-linejoin:round}
.anima .estriol-svg .es-limb{fill:none;stroke:var(--anatomy-shade-2);stroke-width:24.4;stroke-linecap:round;stroke-linejoin:round}
.anima .estriol-svg .es-limbo.es-arm{stroke-width:17}
.anima .estriol-svg .es-limb.es-arm{stroke-width:14.4}
.anima .estriol-svg .es-ear,.anima .estriol-svg .es-lid{fill:none;stroke:var(--anatomy-mid);stroke-width:1.3;stroke-linecap:round}
.anima .estriol-svg .es-win{fill:var(--anatomy-shade-0)}
.anima .estriol-svg .es-rim{fill:none;stroke:var(--anatomy-mid);stroke-width:2}
.anima .estriol-svg .es-liver{fill:color-mix(in srgb,var(--bx-blood) 45%,var(--bx-eosin));stroke:var(--bx-memb);stroke-width:1.2}
.anima .estriol-svg .es-livl{fill:none;stroke:var(--bx-memb);stroke-width:1}
.anima .estriol-svg .es-kid{fill:color-mix(in srgb,var(--bx-blood) 30%,var(--anatomy-face));stroke:var(--anatomy-mid);stroke-width:1.1}
.anima .estriol-svg .es-hil{fill:none;stroke:var(--anatomy-mid);stroke-width:1}
.anima .estriol-svg .es-adr{fill:var(--bx-gold-soft);stroke:var(--bx-gold);stroke-width:1.4}
.anima .estriol-svg .es-adrc{fill:color-mix(in srgb,var(--bx-gold) 40%,var(--bx-gold-soft));stroke:none}
.anima .estriol-svg .es-fail path{fill:var(--anatomy-shade-0);stroke:var(--anatomy-lo)}
.anima .estriol-svg .es-route{fill:none;stroke-width:1.4;stroke-dasharray:4 3}
.anima .estriol-svg .es-route.is-lit{stroke-width:2.2;stroke-dasharray:none}
.anima .estriol-svg .es-route.is-off{stroke:var(--anatomy-lo)!important}
.anima .estriol-svg .es-chol{fill:var(--bx-glu);stroke:var(--surface);stroke-width:.7}
.anima .estriol-svg .es-prog{fill:var(--bx-violet);stroke:var(--surface);stroke-width:.7}
.anima .estriol-svg .es-preg{fill:var(--bx-gold);stroke:var(--anatomy-text);stroke-width:.6}
.anima .estriol-svg .es-dheas{fill:var(--bx-blue);stroke:var(--surface);stroke-width:.7}
.anima .estriol-svg .es-oh{fill:var(--bx-ins);stroke:var(--surface);stroke-width:.7}
.anima .estriol-svg .es-e3{fill:var(--bx-memb);stroke:var(--surface);stroke-width:.7}
.anima .estriol-svg .es-choll{stroke:var(--bx-glu)}
.anima .estriol-svg .es-progl{stroke:var(--bx-violet)}
.anima .estriol-svg .es-pregl{stroke:var(--bx-gold)}
.anima .estriol-svg .es-dheasl{stroke:var(--bx-blue)}
.anima .estriol-svg .es-ohl{stroke:var(--bx-ins)}
.anima .estriol-svg .es-e3l{stroke:var(--bx-memb)}
.anima .estriol-svg .t.es-cholt{fill:var(--bx-glu);font-weight:600}
.anima .estriol-svg .t.es-progt{fill:var(--bx-violet);font-weight:600}
.anima .estriol-svg .t.es-pregt{fill:color-mix(in srgb,var(--bx-gold) 70%,var(--anatomy-strong));font-weight:600}
.anima .estriol-svg .t.es-dheast{fill:var(--bx-blue);font-weight:600}
.anima .estriol-svg .t.es-oht{fill:var(--bx-ins);font-weight:600}
.anima .estriol-svg .t.es-e3t{fill:var(--bx-memb);font-weight:600}
.anima .estriol-svg .t.es-badt{fill:var(--bx-inhib);font-weight:600}
.anima .estriol-svg .es-card{fill:var(--surface);stroke:var(--anatomy-lo);stroke-width:1.1}
.anima .estriol-svg .es-card.is-off{fill:var(--anatomy-shade-1);stroke-dasharray:4 3}
.anima .estriol-svg .es-card.es-lack{stroke:var(--bx-inhib);stroke-dasharray:4 3}
.anima .estriol-svg .es-x{fill:none;stroke:var(--bx-inhib);stroke-width:2;stroke-linecap:round}
.anima .estriol-svg .es-ring{fill:none;stroke:var(--anatomy-lit);stroke-width:2.4}
.anima .estriol-svg .es-gauge{fill:var(--surface);stroke:var(--anatomy-lo);stroke-width:1.1}
.anima .estriol-svg .es-gauge.es-dn{stroke:var(--bx-blue);stroke-width:1.6;fill:var(--bx-blue-soft)}
.anima .estriol-svg .t.es-lv{font-weight:700}
.anima .estriol-svg .t.es-lv.es-dn{fill:var(--bx-blue)}
.anima .estriol-svg .t.es-lv.es-eq{fill:var(--anatomy-strong)}
.anima .estriol-svg .es-stamp{fill:var(--surface);stroke:var(--bx-inhib);stroke-width:1.3}
.anima .estriol-svg .t.es-stampt{fill:var(--bx-inhib);font-weight:600;letter-spacing:.03em}
`,
  });
}
