// Fig: the sperm's route out (L13 Male Reproductive Histology, Dr. Herr, with L15's ejaculation and gland points).
// A schematic side view (front of the body to the left, so the penis points left and the epididymis and vas deferens
// are on the testis's back, right-hand side): the testis in section with its lobules, seminiferous tubules, tubuli
// recti and the rete testis in the mediastinum, the efferent ductules, the epididymis to its tail, the vas deferens up
// the spermatic cord, over and down behind the bladder, the ejaculatory duct through the prostate, and the urethra
// into the penis. The order follows his detailed duct slide (tubuli recti, then rete testis; his overview slide calls
// the straight ducts the rete testis). Step or play a sperm along the route; the panel gives each segment's lining
// and job in his words. A vasectomy toggle cuts the vas in the cord and shows what still reaches the ejaculate.
// Schematic: the testis is drawn large so its ducts show; nothing is to scale. Parts the lecture doesn't name (the
// ampulla, the membranous urethra, the epididymis's head and body) are drawn unlabeled.
import { makeFig, f1, T, L, HOT } from "./shared.mjs";

/* ---------- build-time geometry ---------- */
function cr(p, n) {
  /* an open Catmull-Rom curve through p, sampled n points per span */
  var o = [], i, k, a, b, c, d, t;
  for (i = 0; i < p.length - 1; i++) {
    a = p[Math.max(0, i - 1)]; b = p[i]; c = p[i + 1]; d = p[Math.min(p.length - 1, i + 2)];
    for (k = 0; k < n; k++) { t = k / n;
      var t2 = t * t, t3 = t2 * t;
      o.push([0.5 * ((2 * b[0]) + (-a[0] + c[0]) * t + (2 * a[0] - 5 * b[0] + 4 * c[0] - d[0]) * t2 + (-a[0] + 3 * b[0] - 3 * c[0] + d[0]) * t3),
        0.5 * ((2 * b[1]) + (-a[1] + c[1]) * t + (2 * a[1] - 5 * b[1] + 4 * c[1] - d[1]) * t2 + (-a[1] + 3 * b[1] - 3 * c[1] + d[1]) * t3)]); }
  }
  o.push(p[p.length - 1]);
  return o.map(function (q) { return [f1(q[0]), f1(q[1])]; });
}
function sm(p) {
  /* closed smooth path */
  var n = p.length, d = "M" + f1(p[0][0]) + " " + f1(p[0][1]), i, a, b, c, e;
  for (i = 0; i < n; i++) { a = p[(i - 1 + n) % n]; b = p[i]; c = p[(i + 1) % n]; e = p[(i + 2) % n];
    d += "C" + f1(b[0] + (c[0] - a[0]) / 6) + " " + f1(b[1] + (c[1] - a[1]) / 6) + " " + f1(c[0] - (e[0] - b[0]) / 6) + " " + f1(c[1] - (e[1] - b[1]) / 6) + " " + f1(c[0]) + " " + f1(c[1]); }
  return d + "Z";
}
function pl(p) { var o = "", i; for (i = 0; i < p.length; i++) o += (i ? "L" : "M") + f1(p[i][0]) + " " + f1(p[i][1]); return o; }
/* a coil: points wiggling side to side along a polyline (the epididymis duct, a seminiferous tubule) */
function coil(p, amp, waves) {
  var c = cr(p, 12), o = [], i, L = [0], tot;
  for (i = 1; i < c.length; i++) L.push(L[i - 1] + Math.hypot(c[i][0] - c[i - 1][0], c[i][1] - c[i - 1][1]));
  tot = L[L.length - 1];
  for (i = 0; i < c.length; i++) {
    var a = c[Math.max(0, i - 1)], b = c[Math.min(c.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], m = Math.hypot(dx, dy) || 1;
    var w = Math.sin(L[i] / tot * Math.PI * 2 * waves) * amp * Math.min(1, L[i] / 10, (tot - L[i]) / 10);
    o.push([f1(c[i][0] - dy / m * w), f1(c[i][1] + dx / m * w)]);
  }
  return o;
}

const TC = [252, 455], TRX = 88, TRY = 108;
function onT(deg, k) { var r = deg * Math.PI / 180; return [TC[0] + TRX * (k || 1) * Math.cos(r), TC[1] + TRY * (k || 1) * Math.sin(r)]; }

/* the route, segment by segment (screen coordinates; the testis is drawn large) */
const SEG = {
  tub: coil([[196, 452], [214, 436], [238, 446], [262, 432], [286, 444], [304, 440]], 7, 5),
  recti: [[304, 440], [312, 438], [319, 437]],
  rete: [[319, 437], [324, 428], [320, 418], [325, 408], [323, 400]],
  eff: coil([[323, 400], [320, 386], [316, 372], [318, 360], [326, 351]], 4.5, 4),
  epi: coil([[326, 351], [344, 342], [360, 352], [368, 380], [372, 420], [370, 470], [366, 512]], 6, 9),
  tail: coil([[366, 512], [362, 534], [350, 552], [342, 560]], 5, 2.5),
  vas: cr([[342, 560], [356, 568], [376, 566], [390, 548], [397, 505], [398, 430], [395, 352], [390, 280], [386, 216], [382, 160], [370, 100], [350, 60], [322, 44], [300, 52], [289, 76], [282, 104], [272, 134], [262, 152]], 6),
  ejac: cr([[262, 152], [250, 162], [236, 174], [222, 184]], 6),
  pros: cr([[222, 184], [219, 196], [218, 210], [216, 224]], 4),
  pen: cr([[216, 224], [210, 236], [196, 246], [150, 266], [92, 290], [44, 307]], 6),
};
const ORDER = ["tub", "recti", "rete", "eff", "epi", "tail", "vas", "ejac", "pros", "pen"];
/* where the sperm rests in each segment (fraction of its length) */
const REST = [0.5, 0.55, 0.5, 0.55, 0.5, 0.55, 0.36, 0.55, 0.5, 0.62];

function routeOf() {
  var pts = [], segAt = [];
  ORDER.forEach(function (k, j) { var s = SEG[k]; var start = pts.length ? 1 : 0; segAt.push(pts.length - (start ? 1 : 0)); for (var i = start; i < s.length; i++) pts.push(s[i]); });
  var L = [0], i; for (i = 1; i < pts.length; i++) L.push(f1(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])));
  var ends = segAt.map(function (a, j) { return j + 1 < segAt.length ? segAt[j + 1] : pts.length - 1; });
  var rest = ORDER.map(function (k, j) { return f1(L[segAt[j]] + (L[ends[j]] - L[segAt[j]]) * REST[j]); });
  return { pts: pts, L: L, segAt: segAt, ends: ends, rest: rest };
}

const STOPS = [
  { name: "Seminiferous tubule", lin: "Seminiferous (germinal) epithelium: Sertoli cells and spermatogenic cells.", job: "Sperm are made (about 74 days in all) and released into the lumen (spermiation); they leave non-motile.",
    say: "Seminiferous tubule: sperm are made in the germinal epithelium of Sertoli and spermatogenic cells (about 74 days) and released into the lumen. They leave the testis non-motile." },
  { name: "Tubuli recti", lin: "Not described in the lecture.", job: "The straight tubules: they lead out of the seminiferous tubules into the rete testis.",
    say: "Tubuli recti (straight tubules): the ducts that lead out of the seminiferous tubules. His overview slide calls these straight ducts the rete testis; his duct slide puts the tubuli recti first, then the rete testis." },
  { name: "Rete testis", lin: "Cuboidal epithelium, lining a network of sinusoid-like channels in the mediastinum.", job: "Receives the tubuli recti and drains into the efferent ductules.",
    say: "Rete testis: a network of channels in the mediastinum of the testis, lined by cuboidal epithelium. The straight tubules empty into it." },
  { name: "Efferent ductules", lin: "Non-ciliated simple cuboidal patches alternating with ciliated simple columnar (an uneven border).", job: "10 to 12 of them. The cuboidal cells absorb fluid; true, motile cilia sweep sperm to the epididymis.",
    say: "Efferent ductules (ductuli efferentes), 10 to 12 from the rete testis to the epididymis: patches of non-ciliated cuboidal cells, which absorb fluid from the tubules, alternate with ciliated columnar cells, whose motile cilia sweep the sperm along." },
  { name: "Epididymis", lin: "Pseudostratified columnar with stereocilia (long nonmotile microvilli) and basal cells.", job: "Maturation, 2 to 12 days (forward motility, new surface proteins). Absorbs fluid; glycerophosphocholine inhibits capacitation.",
    say: "Duct of the epididymis: one highly coiled duct, 4 to 6 m long, lined by pseudostratified columnar cells with stereocilia, not cilia. Over 2 to 12 days the sperm mature: chromatin stabilized, surface charge changed, new surface proteins, forward motility. The columnar cells absorb fluid and secrete glycerophosphocholine, which inhibits capacitation." },
  { name: "Tail of the epididymis", lin: "The same lining as the rest of the duct.", job: "Storage until ejaculation; peristalsis carries the sperm here.",
    say: "The tail of the epididymis is the storage region: peristalsis moves the sperm here, and they are stored until ejaculation (for up to several months, Dr. Madison adds)." },
  { name: "Vas deferens", lin: "Pseudostratified columnar with stereocilia, inside a thick muscular wall.", job: "A straight tube up the spermatic cord, with the testicular artery and pampiniform plexus. Moves sperm at ejaculation.",
    say: "Ductus (vas) deferens: a straight tube with a thick muscular wall, lined like the epididymis (pseudostratified columnar with stereocilia). It runs in the spermatic cord beside the testicular artery and pampiniform plexus, where a vasectomy cuts it. At ejaculation, under the sympathetic nervous system, sperm move through it." },
  { name: "Ejaculatory duct", lin: "Not described in the lecture.", job: "Collects the gland fluids: the seminal vesicle joins here. It passes through the prostate.",
    say: "Ejaculatory duct: it collects the fluids of the glands. The seminal vesicles empty into it during ejaculation, adding about 70% of the semen's volume, rich in fructose. It passes through the prostate to the prostatic urethra." },
  { name: "Prostatic urethra", lin: "Not described in the lecture.", job: "The prostate adds the first portion of the ejaculate: citric acid, acid phosphatase, PSA.",
    say: "Prostatic urethra: the ejaculatory ducts open into it, and the prostate adds its secretion, the first portion of the ejaculate (citric acid, acid phosphatase, fibrinolysin, PSA). The sperm mix with the seminal fluid here and beyond." },
  { name: "Penile urethra", lin: "Not described; it runs in the corpus spongiosum.", job: "The bulbourethral (Cowper's) glands empty their mucus here, before emission, to lubricate.",
    say: "Penile urethra, in the corpus spongiosum: the bulbourethral (Cowper's) glands empty a thick, slippery mucus into it that lubricates and comes before the emission of semen. Then out." },
];

/* ---------- page helpers ---------- */
function dcAt(R, s) {
  /* point and direction at arc length s along the route */
  var L = R.L, p = R.pts, lo = 0, hi = L.length - 1, i;
  s = Math.max(0, Math.min(L[hi], s));
  while (hi - lo > 1) { i = (lo + hi) >> 1; if (L[i] <= s) lo = i; else hi = i; }
  var w = L[hi] - L[lo] ? (s - L[lo]) / (L[hi] - L[lo]) : 0;
  return [p[lo][0] + (p[hi][0] - p[lo][0]) * w, p[lo][1] + (p[hi][1] - p[lo][1]) * w, Math.atan2(p[hi][1] - p[lo][1], p[hi][0] - p[lo][0])];
}
function dcSperm(R, s, t, hl) {
  /* head at s, the tail trailing back along the route */
  var h = dcAt(R, s), o = "", d = "", k;
  for (k = 0; k <= 8; k++) { var q = dcAt(R, s - 6 - k * 3.2), off = Math.sin(t / 140 + k * 0.9) * Math.min(1, k / 3) * 2.2; d += (k ? "L" : "M") + f1(q[0] - Math.sin(q[2]) * off) + " " + f1(q[1] + Math.cos(q[2]) * off); }
  if (hl) o += '<circle class="dc-halo" cx="' + f1(h[0]) + '" cy="' + f1(h[1]) + '" r="11"/>';
  o += '<path class="dc-tail" d="' + d + '"/>';
  o += '<g transform="translate(' + f1(h[0]) + " " + f1(h[1]) + ") rotate(" + f1(h[2] * 180 / Math.PI) + ')"><ellipse class="dc-head" rx="5.2" ry="3.2"/><path class="dc-acro" d="M1.6 -3A5.2 3.2 0 0 1 1.6 3Q3.4 0 1.6 -3Z"/></g>';
  return o;
}
function dcFlow(p, n, per, t, cls, r, off) {
  var o = "", i, u, k, Ls = [0], tot, j;
  for (i = 1; i < p.length; i++) Ls.push(Ls[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]));
  tot = Ls[Ls.length - 1];
  for (i = 0; i < n; i++) {
    u = (((t / per) + i / n + (off || 0)) % 1 + 1) % 1; var s = u * tot;
    for (j = 1; j < Ls.length && Ls[j] < s; j++);
    j = Math.min(j, Ls.length - 1); var w = (s - Ls[j - 1]) / ((Ls[j] - Ls[j - 1]) || 1), x = p[j - 1][0] + (p[j][0] - p[j - 1][0]) * w, y = p[j - 1][1] + (p[j][1] - p[j - 1][1]) * w;
    k = Math.min(1, u * 6, (1 - u) * 6);
    o += '<circle class="' + cls + '" cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + r + '" opacity="' + f1(k) + '"/>';
  }
  return o;
}
function dcWrap(s, n) { var w = s.split(" "), o = [], l = ""; w.forEach(function (x) { if ((l + " " + x).trim().length > n) { o.push(l.trim()); l = x; } else l += " " + x; }); if (l.trim()) o.push(l.trim()); return o; }

/* ---------- the fixed drawing ---------- */
function staticArt() {
  var o = {}, s = "", i;
  /* bladder, seminal vesicle, prostate, bulbourethral gland, penis */
  s += HOT("The urinary bladder, for orientation: the seminal vesicles sit behind it and the prostate just below it (Dr. Madison).", '<ellipse class="dc-blad" cx="205" cy="92" rx="62" ry="50"/>' + T(204, 88, "bladder", "s mut", "middle"));
  var sv = sm([[300, 92], [316, 88], [330, 98], [328, 112], [318, 118], [324, 130], [314, 142], [300, 146], [296, 158], [284, 160], [280, 150], [288, 138], [290, 124], [294, 110]]);
  var svCoil = "M296 100Q310 94 318 104Q306 110 316 120Q304 126 310 136Q298 140 292 152";
  o.SV = HOT("Seminal vesicles: coiled tubular glands about 15 cm long, pseudostratified columnar, with inner circular and outer longitudinal smooth muscle. About 70% of the semen volume (50 to 80% in Dr. Madison's lecture): fructose, the sperm's main energy source, prostaglandins and proteins. A yellow lipochrome pigment fluoresces in UV light. They empty into the ejaculatory duct.",
    '<path class="dc-sv" d="' + sv + '"/><path class="dc-svc" d="' + svCoil + '"/>');
  o.SVDUCT = [[286, 158], [276, 160], [266, 156], [262, 152]];
  o.PROS = HOT("Prostate: 30 to 50 compound tubuloalveolar glands (mucosal, submucosal and main) in a fibromuscular stroma, around the urethra. Its secretion is the first portion of the ejaculate: citric acid, acid phosphatase, fibrinolysin, PSA. The ejaculatory ducts pass through it.",
    '<path class="dc-pros" d="' + sm([[186, 176], [196, 158], [222, 152], [250, 158], [262, 176], [254, 200], [232, 212], [204, 208], [188, 196]]) + '"/>');
  o.BU = HOT("Bulbourethral (Cowper's) gland: thick, slippery mucus rich in galactose and sialic acid, emptied into the penile urethra. It lubricates and comes before the emission of semen. Skeletal muscle lies between its secretory units.",
    '<path class="dc-bu" d="' + sm([[236, 224], [244, 218], [254, 222], [256, 232], [246, 238], [236, 234]]) + '"/>');
  o.BUDUCT = [[238, 232], [226, 238], [212, 241], [204, 243]];
  /* the penis: the urethra runs in the corpus spongiosum, the corpora cavernosa above it */
  var pc = cr([[214, 230], [196, 246], [150, 266], [92, 290], [44, 307]], 8), top = [], bot = [], cs = [], cs2 = [];
  pc.forEach(function (q, j) { var a = pc[Math.max(0, j - 1)], b = pc[Math.min(pc.length - 1, j + 1)], dx = b[0] - a[0], dy = b[1] - a[1], m = Math.hypot(dx, dy) || 1, nx = -dy / m, ny = dx / m, w = j < 3 ? 14 + j * 3 : 21;
    top.push([q[0] + nx * w * 1.25, q[1] + ny * w * 1.25]); bot.push([q[0] - nx * w * 0.7, q[1] - ny * w * 0.7]); cs.push([q[0] + nx * 7, q[1] + ny * 7]); cs2.push([q[0] - nx * 7, q[1] - ny * 7]); });
  var glans = [[60, 280], [36, 290], [26, 304], [34, 318], [52, 318], [66, 312]];
  o.PEN = HOT("Penis: erectile tissue (the corpora cavernosa, and the corpus spongiosum around the penile urethra) inside the tunica albuginea.",
    '<path class="dc-pen" d="' + pl(top) + pl(bot.slice().reverse()).replace("M", "L") + 'Z"/><path class="dc-cs" d="' + pl(cs) + pl(cs2.slice().reverse()).replace("M", "L") + 'Z"/><path class="dc-pen" d="' + sm(glans) + '"/>');
  o.BG = s; s = "";
  /* the testis in section */
  var sept = "", tubs = "", tubsL = "";
  [300, 252, 208, 165, 122, 78].forEach(function (d) { var a = onT(d, 0.98), m = [TC[0] + 66 + (d < 200 && d > 100 ? 0 : 4), TC[1] + (d > 180 ? -26 : d < 120 ? 28 : 0) * (Math.abs(d - 180) / 120)]; sept += "M" + f1(a[0]) + " " + f1(a[1]) + "Q" + f1((a[0] + m[0]) / 2) + " " + f1((a[1] + m[1]) / 2 + (d > 180 ? 6 : -6)) + " " + f1(m[0]) + " " + f1(m[1]); });
  /* tubules in each lobule (between the septa); the one on the route is drawn by the route itself */
  [[276, 0.62], [230, 0.66], [140, 0.66], [100, 0.62]].forEach(function (q) { var a = onT(q[0], 0.86), b = onT(q[0], 0.3); var c = coil([a, [(a[0] * 2 + b[0]) / 3, (a[1] * 2 + b[1]) / 3], [(a[0] + b[0] * 2) / 3, (a[1] + b[1] * 2) / 3], [TC[0] + 52, TC[1] + (q[0] > 180 ? -16 : 16)]], 7, 4); tubs += pl(c); });
  o.TESTIS = HOT("Testis, in section: about 250 lobules, each with several blind-ended, highly coiled seminiferous tubules (30 to 70 cm long each) in loose vascular connective tissue with the Leydig cells.",
    '<ellipse class="dc-testis" cx="' + TC[0] + '" cy="' + TC[1] + '" rx="' + TRX + '" ry="' + TRY + '"/><path class="dc-sept" d="' + sept + '"/><path class="dc-tubo" d="' + tubs + '"/><path class="dc-tubi" d="' + tubs + '"/>');
  o.TUNICA = '<ellipse class="dc-tun" cx="' + TC[0] + '" cy="' + TC[1] + '" rx="' + TRX + '" ry="' + TRY + '"/>';
  /* mediastinum and the rete testis network */
  o.MED = HOT("Mediastinum of the testis: the rete testis lies here, a network of channels lined by cuboidal epithelium.", '<path class="dc-med" d="' + sm([[312, 404], [326, 396], [334, 420], [334, 470], [326, 492], [314, 486], [316, 450]]) + '"/><path class="dc-rete" d="M318 412L326 418L320 428L328 436L320 446L328 456L320 466L327 476M326 418L332 424M320 446L314 452M328 456L333 462"/>');
  /* efferent ductules: 10 to 12 small coiled ducts from the rete testis into the epididymis (8 drawn) */
  var eff = "";
  [[-12, -6], [-7, -3], [-2, 0], [3, 3], [8, 6], [13, 9], [18, 12]].forEach(function (q) { eff += pl(coil([[323 + q[1] * 0.2, 402], [318 + q[0] * 0.3, 384], [314 + q[0] * 0.6, 368], [322 + q[0] * 0.9, 354 + q[1] * 0.4], [330 + q[0] * 1.2, 346 + q[1] * 0.3]], 3, 3)); });
  o.EFF = HOT("Efferent ductules: 10 to 12 ducts from the rete testis to the epididymis, lined by non-ciliated cuboidal cells alternating with ciliated columnar cells.", '<path class="dc-tubo dc-eff" d="' + eff + '"/><path class="dc-tubi dc-eff" d="' + eff + '"/>');
  /* the epididymis, its coiled duct inside */
  var epiOut = sm([[318, 350], [330, 334], [352, 330], [370, 342], [380, 372], [384, 420], [382, 470], [378, 512], [374, 540], [362, 562], [344, 570], [330, 562], [336, 540], [346, 510], [350, 470], [350, 420], [344, 384], [334, 364]]);
  var c1 = coil([[330, 346], [350, 338], [366, 356], [374, 400], [376, 450], [372, 500], [366, 530], [352, 556]], 9, 15), c2 = coil([[336, 356], [356, 352], [362, 380], [366, 430], [364, 480], [360, 520], [350, 548]], 6, 13);
  o.EPI = HOT("Duct of the epididymis: one highly coiled duct, about 4 to 6 m long, packed into a small organ, so a section cuts it many times. Pseudostratified columnar with stereocilia and basal cells. Maturation, storage (in the tail) and transport by peristalsis.",
    '<path class="dc-epi" d="' + epiOut + '"/><path class="dc-coil" d="' + pl(c1) + pl(c2) + '"/>');
  /* the spermatic cord: vas deferens, testicular artery and pampiniform plexus inside one sheath */
  var cordC = cr([[396, 356], [392, 300], [388, 250], [386, 214]], 6), art = [], pp1 = [], pp2 = [];
  cordC.forEach(function (q, j) { art.push([q[0] - 7 + Math.sin(j * 0.9) * 1.4, q[1]]); pp1.push([q[0] + 6.5 + Math.sin(j * 1.3) * 2.2, q[1]]); pp2.push([q[0] + 8 - Math.sin(j * 1.3) * 2.2, q[1]]); });
  o.CORD = HOT("Spermatic cord: on his slide it carries the vas deferens, the testicular artery and the pampiniform plexus. The vas is reached and cut here in a vasectomy.", '<path class="dc-cord" d="' + sm([[384, 210], [392, 208], [398, 230], [404, 300], [408, 352], [398, 362], [386, 356], [382, 300], [377, 236]]) + '"/>');
  o.CORDV = HOT("Testicular artery, in the spermatic cord beside the vas deferens; a vasectomy leaves it intact.", '<path class="dc-art" d="' + pl(art) + '"/>') +
    HOT("Pampiniform plexus, a plexus of veins in the spermatic cord beside the vas deferens; a vasectomy leaves it intact.", '<path class="dc-pp" d="' + pl(pp1) + '"/><path class="dc-pp" d="' + pl(pp2) + '"/>');
  /* below the cord they run down to the back of the testis, under the epididymis */
  o.CORDLOW = '<path class="dc-art" d="' + pl(cr([[art[0][0], art[0][1]], [376, 366], [356, 380], [336, 404]], 5)) + '"/><path class="dc-pp" d="' + pl(cr([[pp1[0][0], pp1[0][1]], [392, 372], [362, 388], [338, 410]], 5)) + '"/>';
  return o;
}

/* ---------- live drawing ---------- */
function dcRender(st, D) {
  var o = "", t = st.t || 0, R = D.R, s = st.stop, vas = st.vas, i;
  if (st._s === undefined || st._s !== s) { st._from = st._s === undefined ? s : st._s; st._s = s; st._t0 = t; }
  var u = t ? Math.min(1, (t - st._t0) / 1700) : 1, e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
  if (st._from !== s - 1) e = 1;
  o += D.BG + D.PEN;
  /* the urethra, the ejaculatory duct, the seminal vesicle and its duct, the bulbourethral gland */
  function duct(p, cls) { var d = D.dcPath(p); return '<path class="dc-do' + (cls ? " " + cls : "") + '" d="' + d + '"/><path class="dc-di" d="' + d + '"/>'; }
  o += D.HOT("Urethra: from the bladder through the prostate (the prostatic urethra) and into the penis (the penile urethra, in the corpus spongiosum).", duct(D.URE));
  o += D.PROS + D.HOT("Prostatic urethra: the ejaculatory ducts and the prostate's own ducts open into it.", duct(D.SEG.pros));
  o += D.SV + D.HOT("The seminal vesicle's duct joins the vas deferens to form the ejaculatory duct.", duct(D.SVDUCT, "dc-thin"));
  o += D.HOT("Ejaculatory duct: collects the fluids of the glands (the seminal vesicles and the prostate) and empties into the prostatic urethra, passing through the prostate.", duct(D.SEG.ejac));
  o += D.BU + D.HOT("The bulbourethral gland's duct, opening into the penile urethra.", duct(D.BUDUCT, "dc-thin")) + D.HOT("Penile urethra, in the corpus spongiosum; the bulbourethral glands empty into it.", duct(D.SEG.pen));
  /* the testis */
  o += D.TESTIS + D.HOT("A seminiferous tubule: blind-ended and highly coiled. Sperm are made in its wall and released into its lumen.", duct(D.SEG.tub, "dc-tubr")) + D.MED;
  o += D.HOT("Tubuli recti (straight tubules): they lead out of the seminiferous tubules into the rete testis.", duct(D.SEG.recti, "dc-tubr")) + D.TUNICA;
  o += D.CORDLOW + D.EFF + D.HOT("The efferent ductule this sperm takes.", duct(D.SEG.eff, "dc-tubr")) + D.EPI;
  o += D.HOT("Ductus (vas) deferens: a straight tube with a thick muscular wall, lined by pseudostratified columnar cells with stereocilia. It runs up the spermatic cord, over and down behind the bladder (its last part widens, unlabeled here) to join the seminal vesicle's duct.", duct(D.SEG.vas, "dc-vas"));
  o += D.CORD + D.CORDV + D.HOT("Vas deferens, in the spermatic cord.", duct(D.CORDVAS, "dc-vas"));
  /* the vasectomy: two tied ends with a gap */
  if (vas) {
    var c = D.CUT;
    o += '<rect class="dc-gap" x="' + (c[0] - 9) + '" y="' + (c[1] - 9) + '" width="18" height="18"/>';
    o += D.HOT("Vasectomy: the vas deferens is cut (and its ends closed) in the spermatic cord. Sperm can't get past; the testicular artery and pampiniform plexus are left intact.", '<path class="dc-tie" d="M' + (c[0] - 6) + " " + (c[1] - 9) + "H" + (c[0] + 6) + "M" + (c[0] - 6) + " " + (c[1] + 9) + "H" + (c[0] + 6) + '"/><path class="dc-x" d="M' + (c[0] + 10) + " " + (c[1] - 5) + "l10 10m0 -10l-10 10" + '"/>');
  }
  /* the current segment, lit along the route */
  var seg = D.SEG[D.ORDER[s]];
  o += '<path class="dc-lit" d="' + D.dcPath(s === 6 ? D.SEG.vas : seg) + '"/>';
  /* gland fluids join as the sperm passes (all of them, during ejaculation, with the vasectomy on) */
  var fl = vas ? 9 : s;
  if (fl >= 7) o += D.dcFlow(D.SVDUCT.concat(D.SEG.ejac).concat(D.SEG.pros).concat(D.SEG.pen), 9, 6000, t, "dc-svf", 3);
  if (fl >= 8) { D.PROSD.forEach(function (p, j) { o += D.dcFlow(p, 2, 1800, t, "dc-prf", 2.6, j / 4); }); o += D.dcFlow(D.SEG.pros.concat(D.SEG.pen), 6, 5200, t, "dc-prf", 2.8, 0.3); }
  if (fl >= 9) o += D.dcFlow(D.BUDUCT.concat(D.SEG.pen.slice(4)), 5, 3600, t, "dc-buf", 2.8);
  /* the sperm: eased along the route from the last stop to this one; with the vasectomy it can't pass the cut */
  var from = st._from !== undefined && e < 1 ? R.rest[st._from] : R.rest[s], to = R.rest[s], pos = from + (to - from) * e, blocked = false;
  if (vas && pos > D.CUTS - 10) { pos = D.CUTS - 10; blocked = true; }
  o += D.dcSperm(R, pos, t, 1);
  /* ---------- labels ---------- */
  o += D.L(166, 172, "prostate", 190, 176, "end", "s") + D.L(166, 194, "prostatic urethra", 214, 198, "end", "s");
  o += D.L(334, 116, "seminal", 322, 112, "start", "s") + T(334, 130, "vesicle", "s", "start");
  o += D.L(280, 192, "ejaculatory duct", 244, 170, "start", "s");
  o += D.L(266, 248, "bulbourethral", 250, 236, "start", "s") + T(266, 262, "gland", "s", "start");
  o += D.L(100, 326, "penile urethra", 112, 282, "start", "s") + T(16, 270, "penis", "s mut", "start");
  o += D.L(410, 236, "spermatic", 396, 252, "start", "s") + T(410, 250, "cord", "s", "start");
  o += D.L(410, 362, "efferent", 338, 372, "start", "s") + T(410, 376, "ductules", "s", "start");
  o += D.L(410, 424, "epididymis", 380, 430, "start", "s");
  o += D.L(410, 478, "vas deferens", 399, 478, "start", "s");
  o += D.L(410, 538, "tail: storage", 374, 540, "start", "s");
  o += D.L(296, 498, "rete testis", 318, 470, "end", "s") + D.L(290, 404, "tubuli recti", 312, 436, "end", "s");
  o += D.L(176, 592, "seminiferous tubules", 206, 448, "start", "s");
  o += T(252, 330, "testis", "s mut", "middle");
  /* ---------- the spermatic cord in section (top right) ---------- */
  o += T(462, 20, "spermatic cord", "s b", "middle") + T(462, 34, "in section", "tb-xs mut", "middle");
  o += D.HOT("The spermatic cord in section: the vas deferens (a thick muscular wall around a small lumen), the testicular artery and the veins of the pampiniform plexus. In a vasectomy only the vas is cut.",
    '<circle class="dc-cord" cx="462" cy="84" r="40"/>' + '<circle class="dc-vasx' + (vas ? " is-cut" : "") + '" cx="450" cy="96" r="14"/><path class="dc-vasl" d="M447 93L453 95L449 99L452 101"/>' + '<circle class="dc-artx" cx="476" cy="66" r="6"/>' +
    [[478, 92], [488, 80], [464, 58], [444, 70], [486, 104], [470, 112], [494, 66]].map(function (q) { return '<circle class="dc-ppx" cx="' + q[0] + '" cy="' + q[1] + '" r="' + (q[0] % 3 ? 4 : 5) + '"/>'; }).join(""));
  o += '<path class="dc-zoom" d="M430 108L400 214"/>';
  [["dc-sw-vas", "vas deferens", ""], ["dc-sw-art", "testicular", "artery"], ["dc-sw-pp", "pampiniform", "plexus"]].forEach(function (r, j) { var y = [142, 158, 186][j]; o += '<rect class="' + r[0] + '" x="424" y="' + (y - 8) + '" width="10" height="8" rx="2"/>' + T(438, y, r[1], "tb-xs", "start") + (r[2] ? T(438, y + 13, r[2], "tb-xs", "start") : ""); });
  /* ---------- the panel (lower left): this segment's lining and job, or the vasectomy result ---------- */
  var S = D.STOPS[s], y = 352, x = 14;
  o += '<rect class="dc-panel" x="6" y="338" width="148" height="262" rx="10"/>';
  D.dcWrap((s + 1) + ". " + S.name, 18).forEach(function (l) { o += T(x, y, l, "s b", "start"); y += 15; });
  y += 4; o += T(x, y, "LINING", "tb-xs dc-cap", "start"); y += 14;
  D.dcWrap(S.lin, 21).forEach(function (l) { o += T(x, y, l, "tb-xs", "start"); y += 13; });
  y += 5; o += T(x, y, "WHAT HAPPENS", "tb-xs dc-cap", "start"); y += 14;
  D.dcWrap(S.job, 21).forEach(function (l) { o += T(x, y, l, "tb-xs", "start"); y += 13; });
  if (vas) {
    o += '<rect class="dc-panel dc-vbox" x="6" y="8" width="132" height="74" rx="10"/>' + T(14, 26, "AFTER A VASECTOMY", "tb-xs dc-cap bad", "start");
    [["sperm", "none"], ["volume", "nearly all"], ["fructose", "present"]].forEach(function (r, j) { var yy = 44 + j * 14; o += T(14, yy, r[0], "tb-xs mut", "start") + T(130, yy, r[1], "tb-xs b" + (r[1] === "none" ? " bad" : " ok"), "end"); });
  }
  if (blocked && s >= 6) o += T(D.CUT[0] + 24, D.CUT[1] + 18, "sperm stop here", "tb-xs bad", "start");
  return o;
}
function dcSay(st, D) {
  var S = D.STOPS[st.stop], ro = (st.stop + 1) + "/10 · " + S.name.toLowerCase();
  if (st.vas) return ["Vasectomy: the vas deferens is cut in the spermatic cord, apart from the testicular artery and pampiniform plexus. Sperm can't pass the cut, but the seminal vesicles (about 70% of the volume), the prostate and the bulbourethral glands all join beyond it, so semen keeps nearly all its volume and its fructose, with no sperm." + (st.stop > 6 ? " " + S.name + ": " + S.job : ""), "cut · " + ro];
  return [S.say, ro];
}

export default function ducts() {
  const A = staticArt(), R = routeOf();
  /* where the vas is cut in the cord, and its arc length on the route */
  let cutS = 0, best = 1e9; const CUT = [391, 288];
  R.pts.forEach((p, i) => { const d = Math.hypot(p[0] - CUT[0], p[1] - CUT[1]); if (d < best && i > R.segAt[6]) { best = d; cutS = R.L[i]; } });
  const cordVas = SEG.vas.filter((p) => p[1] <= 360 && p[1] >= 210 && p[0] > 370);
  const D = Object.assign({}, A, {
    SEG, ORDER, STOPS, R, CUT, CUTS: cutS, CORDVAS: cordVas,
    URE: cr([[212, 140], [214, 152], [222, 184]], 4).concat(SEG.pros.slice(1)).concat(SEG.pen.slice(1)),
    PROSD: [[[198, 176], [210, 186], [218, 192]], [[242, 196], [230, 198], [220, 200]], [[204, 200], [212, 204], [218, 206]]],
    ANIM: true, PLAYMS: 2600, INIT: { stop: 0, vas: false }, STEPKEY: "stop", STEPMAX: 9,
  });
  return makeFig({
    id: "ducts", lec: "mhisto", fig: "Fig 6", short: "The sperm's route out", hint: "step · hover",
    title: "The sperm's route out",
    caption: "A side view, front of the body to the left: from a seminiferous tubule through the ducts in his order, past the three glands, out through the penis. Step a sperm along it, and cut the vas to see what still reaches the ejaculate.",
    W: 520, H: 604, label: "The male reproductive tract from the side: the testis in section with seminiferous tubules, tubuli recti and the rete testis, the efferent ductules and epididymis, the vas deferens in the spermatic cord, the seminal vesicle, the ejaculatory duct in the prostate, the bulbourethral gland and the urethra in the penis.",
    D, render: dcRender, say: dcSay, helpers: [dcAt, dcSperm, dcFlow, dcWrap, function dcPath(p) { var o = "", i; for (i = 0; i < p.length; i++) o += (i ? "L" : "M") + f1(p[i][0]) + " " + f1(p[i][1]); return o; }],
    controls: `<div class="am-controls" role="group" aria-label="Move the sperm"><button type="button" class="am-btn" data-amstep="-1">Back</button><button type="button" class="am-btn" data-amstep="1">Next</button><button type="button" class="am-btn" data-amplay aria-pressed="false">Play</button><button type="button" class="am-btn" data-amt="vas" aria-pressed="false">Vasectomy</button></div>`,
    sources: [
      "From the L13 notes (Dr. Herr): the duct order on his duct slide (seminiferous tubules, tubuli recti, rete testis, ductuli efferentes, duct of the epididymis, ductus deferens, ejaculatory duct, urethra of the penis); each lining as he gives it (rete testis cuboidal; efferent ductules non-ciliated cuboidal alternating with ciliated columnar; epididymis and vas pseudostratified columnar with stereocilia, the vas with a thick muscular wall); the epididymis's three jobs, 2 to 12 days of maturation and glycerophosphocholine; the spermatic cord's vas, testicular artery and pampiniform plexus; where each gland joins (seminal vesicles and prostate into the ejaculatory duct and prostatic urethra, bulbourethral glands into the penile urethra), about 70% of the volume from the seminal vesicles, and why a vasectomy leaves nearly all of the volume.",
      "From the L15 notes (Dr. Madison): sperm arrive in the epididymis non-motile and are stored for up to several months; the seminal vesicles sit behind the bladder and empty into the ejaculatory duct; the prostate is just below the bladder, around the urethra; at ejaculation the sympathetic system moves sperm through the vas into the urethra.",
      "Schematic and not to scale: the testis is enlarged so its ducts show, 7 of the 10 to 12 efferent ductules are drawn, and the coils are simplified. The vas's widened last part, the membranous urethra between the prostate and the penis, and the head and body of the epididymis are drawn but not named, because the lecture doesn't name them. The overview slide calls the straight ducts the rete testis; the figure follows the detailed duct slide. The lecture doesn't describe the lining of the tubuli recti, the ejaculatory duct or the urethra."],
    css: `
.anima[data-anima="ducts"] .am-svg{max-width:540px}
.anima .ducts-svg .dc-blad{fill:var(--anatomy-shade-1);stroke:var(--anatomy-mid);stroke-width:1.2}
.anima .ducts-svg .dc-sv{fill:var(--bx-gold-soft);stroke:var(--bx-gold);stroke-width:1.4}
.anima .ducts-svg .dc-svc{fill:none;stroke:var(--bx-gold);stroke-width:1.1;opacity:.8}
.anima .ducts-svg .dc-pros{fill:color-mix(in srgb,var(--bx-eosin) 45%,var(--bx-matrix));stroke:var(--bx-cyto-line);stroke-width:1.3}
.anima .ducts-svg .dc-bu{fill:var(--bx-ins-soft);stroke:var(--bx-ins);stroke-width:1.3}
.anima .ducts-svg .dc-pen{fill:var(--bx-cyto);stroke:var(--bx-cyto-line);stroke-width:1.2}
.anima .ducts-svg .dc-cs{fill:color-mix(in srgb,var(--bx-cyto) 55%,var(--surface));stroke:none}
.anima .ducts-svg .dc-testis{fill:var(--bx-matrix)}
.anima .ducts-svg .dc-tun{fill:none;stroke:var(--bx-cyto-line);stroke-width:3.4}
.anima .ducts-svg .dc-sept{fill:none;stroke:var(--bx-cyto-line);stroke-width:1.2;opacity:.75}
.anima .ducts-svg .dc-tubo{fill:none;stroke:var(--bx-eosin);stroke-width:4.2;stroke-linejoin:round;stroke-linecap:round}
.anima .ducts-svg .dc-tubi{fill:none;stroke:var(--bx-lumen);stroke-width:1.3;stroke-linejoin:round;stroke-linecap:round}
.anima .ducts-svg .dc-eff.dc-tubo{stroke-width:3.2}
.anima .ducts-svg .dc-eff.dc-tubi{stroke-width:1}
.anima .ducts-svg .dc-med{fill:color-mix(in srgb,var(--bx-cyto-line) 25%,var(--bx-matrix));stroke:var(--bx-cyto-line);stroke-width:1}
.anima .ducts-svg .dc-rete{fill:none;stroke:var(--bx-memb);stroke-width:2;stroke-linejoin:round;stroke-linecap:round}
.anima .ducts-svg .dc-epi{fill:color-mix(in srgb,var(--bx-eosin) 40%,var(--bx-matrix));stroke:var(--bx-cyto-line);stroke-width:1.3}
.anima .ducts-svg .dc-coil{fill:none;stroke:var(--bx-memb);stroke-width:1.2;opacity:.55;stroke-linejoin:round}
.anima .ducts-svg .dc-do{fill:none;stroke:var(--bx-cyto-line);stroke-width:6.5;stroke-linejoin:round;stroke-linecap:round}
.anima .ducts-svg .dc-di{fill:none;stroke:var(--bx-lumen);stroke-width:2.6;stroke-linejoin:round;stroke-linecap:round}
.anima .ducts-svg .dc-do.dc-thin{stroke-width:5}
.anima .ducts-svg .dc-do.dc-tubr{stroke:var(--bx-eosin);stroke-width:5}
.anima .ducts-svg .dc-do.dc-vas{stroke:var(--bx-memb);stroke-width:7.5}
.anima .ducts-svg .dc-lit{fill:none;stroke:var(--anatomy-lit);stroke-width:3;stroke-linejoin:round;stroke-linecap:round;opacity:.9}
.anima .ducts-svg .dc-cord{fill:color-mix(in srgb,var(--bx-fat) 70%,transparent);stroke:var(--anatomy-mid);stroke-width:1.1}
.anima .ducts-svg .dc-art{fill:none;stroke:var(--bx-blood);stroke-width:2.2;stroke-linecap:round}
.anima .ducts-svg .dc-pp{fill:none;stroke:var(--bx-blue);stroke-width:1.6;stroke-linecap:round}
.anima .ducts-svg .dc-gap{fill:var(--bx-fat);stroke:none}
.anima .ducts-svg .dc-tie{stroke:var(--anatomy-hi);stroke-width:3;stroke-linecap:round}
.anima .ducts-svg .dc-x{fill:none;stroke:var(--bx-inhib);stroke-width:2.4;stroke-linecap:round}
.anima .ducts-svg .dc-halo{fill:var(--anatomy-lit);opacity:.16}
.anima .ducts-svg .dc-head{fill:var(--bx-sperm);stroke:var(--surface);stroke-width:.8}
.anima .ducts-svg .dc-acro{fill:var(--bx-memb)}
.anima .ducts-svg .dc-tail{fill:none;stroke:var(--bx-sperm);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.anima .ducts-svg .dc-svf{fill:var(--bx-gold);stroke:var(--surface);stroke-width:.6}
.anima .ducts-svg .dc-prf{fill:var(--bx-violet);stroke:var(--surface);stroke-width:.6}
.anima .ducts-svg .dc-buf{fill:var(--bx-ins);stroke:var(--surface);stroke-width:.6}
.anima .ducts-svg .dc-vasx{fill:var(--bx-memb);stroke:var(--bx-cyto-line);stroke-width:1}
.anima .ducts-svg .dc-vasx.is-cut{stroke:var(--bx-inhib);stroke-width:2.6}
.anima .ducts-svg .dc-vasl{fill:none;stroke:var(--bx-lumen);stroke-width:1.6;stroke-linejoin:round}
.anima .ducts-svg .dc-artx{fill:var(--bx-blood-soft);stroke:var(--bx-blood);stroke-width:2}
.anima .ducts-svg .dc-ppx{fill:var(--bx-blue-soft);stroke:var(--bx-blue);stroke-width:1.2}
.anima .ducts-svg .dc-zoom{fill:none;stroke:var(--anatomy-mid);stroke-width:1;stroke-dasharray:3 3}
.anima .ducts-svg .dc-sw-vas{fill:var(--bx-memb)}
.anima .ducts-svg .dc-sw-art{fill:var(--bx-blood)}
.anima .ducts-svg .dc-sw-pp{fill:var(--bx-blue)}
.anima .ducts-svg .dc-panel{fill:var(--anatomy-face);stroke:var(--anatomy-lo);stroke-width:1}
.anima .ducts-svg .dc-vbox{stroke:var(--bx-inhib);stroke-width:1.4}
.anima .ducts-svg .t.tb-xs{font-size:11px}
.anima .ducts-svg .t.dc-cap{fill:var(--anatomy-muted);letter-spacing:.06em;font-weight:600}
`,
  });
}
