// Fig: the first weeks, a timeline with the hormone handoff (L17 Pregnancy and Lactation, Dr. Madison: his timeline
// slide and "Corpus luteum first, then placenta"). One time slider moves a cursor through three views at once: a
// schematic of the ovary, the fallopian tube and the uterus (the oocyte caught by the fimbriae, fertilized in the distal
// tube within 24 hours, held back while estrogen constricts the opening of the uterus, let in when progesterone relaxes
// the myometrium about 4 days after ovulation, implanting 5 to 7 days after, hCG from about day 8 rescuing the corpus
// luteum, then the placenta growing); the lecture's events on the same axis; and two rows of relative levels, hCG and
// progesterone split by who makes it (corpus luteum, then placenta, crossing at the end of the first trimester). The axis
// is days after ovulation for the first two weeks, then weeks of pregnancy counted from the last period. A "No pregnancy"
// toggle shows what hCG prevents: the corpus luteum regressing about 14 days after ovulation. Levels are qualitative.
import { makeFig, f1, T, L, HOT } from "./shared.mjs";

const W = 600, H = 500;

/* ---------- build-time geometry: the ovary, the tube, the uterus ---------- */
function crPts(P, n) {
  /* points along a Catmull-Rom curve through P, resampled to n+1 points evenly spaced by length */
  const raw = [];
  for (let i = 0; i < P.length - 1; i++) {
    const a = P[Math.max(0, i - 1)], b = P[i], c = P[i + 1], e = P[Math.min(P.length - 1, i + 2)];
    for (let k = 0; k < 40; k++) {
      const t = k / 40, t2 = t * t, t3 = t2 * t;
      raw.push([0, 1].map((j) => 0.5 * (2 * b[j] + (-a[j] + c[j]) * t + (2 * a[j] - 5 * b[j] + 4 * c[j] - e[j]) * t2 + (-a[j] + 3 * b[j] - 3 * c[j] + e[j]) * t3)));
    }
  }
  raw.push(P[P.length - 1]);
  const len = [0]; for (let i = 1; i < raw.length; i++) len.push(len[i - 1] + Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1]));
  const out = []; let j = 0;
  for (let k = 0; k <= n; k++) {
    const s = len[len.length - 1] * k / n; while (j < len.length - 2 && len[j + 1] < s) j++;
    const f = (s - len[j]) / ((len[j + 1] - len[j]) || 1); out.push([raw[j][0] + (raw[j + 1][0] - raw[j][0]) * f, raw[j][1] + (raw[j + 1][1] - raw[j][1]) * f]);
  }
  return out;
}
function smooth(p) {
  /* closed smooth path through p */
  const n = p.length; let d = "M" + f1(p[0][0]) + " " + f1(p[0][1]);
  for (let i = 0; i < n; i++) { const a = p[(i - 1 + n) % n], b = p[i], c = p[(i + 1) % n], e = p[(i + 2) % n];
    d += "C" + f1(b[0] + (c[0] - a[0]) / 6) + " " + f1(b[1] + (c[1] - a[1]) / 6) + " " + f1(c[0] - (e[0] - b[0]) / 6) + " " + f1(c[1] - (e[1] - b[1]) / 6) + " " + f1(c[0]) + " " + f1(c[1]); }
  return d + "Z";
}
function geo() {
  /* the tube: from its fimbriated mouth by the ovary (distal) to the opening of the uterus (proximal) */
  const C = crPts([[118, 104], [158, 82], [222, 70], [300, 71], [372, 77], [440, 82]], 60);
  const fl = (t) => Math.pow(Math.max(0, 1 - t / 0.13), 2);
  const rOut = (t) => (t < 0.55 ? 11.5 - 2.5 * t / 0.55 : 9 - 3.6 * (t - 0.55) / 0.45) + 5.5 * fl(t);
  const rLum = (t) => (t < 0.55 ? 6.2 - 1.4 * t / 0.55 : 4.8 - 3.2 * (t - 0.55) / 0.45) + 5.5 * fl(t);
  const nrm = C.map((p, i) => { const a = C[Math.max(0, i - 1)], b = C[Math.min(C.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); return [-dy / l, dx / l]; });
  const side = (rf, s) => C.map((p, i) => [p[0] + nrm[i][0] * rf(i / 60) * s, p[1] + nrm[i][1] * rf(i / 60) * s]);
  const line = (pts) => pts.map((q, i) => (i ? "L" : "M") + f1(q[0]) + " " + f1(q[1])).join("");
  const oa = side(rOut, 1), ob = side(rOut, -1), la = side(rLum, 1), lb = side(rLum, -1);
  const tube = line(oa) + line(ob.slice().reverse()).replace("M", "L") + "Z";
  const lumen = line(la) + line(lb.slice().reverse()).replace("M", "L") + "Z";
  /* folds of the lining in the wide distal part, and cilia on it */
  let fold = "";
  for (let i = 3; i < 34; i += 2) { const t = i / 60, p = C[i], n = nrm[i], r = rLum(t); fold += "M" + f1(p[0] + n[0] * r * 0.95) + " " + f1(p[1] + n[1] * r * 0.95) + "L" + f1(p[0] + n[0] * r * 0.45) + " " + f1(p[1] + n[1] * r * 0.45) + "M" + f1(p[0] - n[0] * r * 0.95) + " " + f1(p[1] - n[1] * r * 0.95) + "L" + f1(p[0] - n[0] * r * 0.5) + " " + f1(p[1] - n[1] * r * 0.5); }
  /* the mouth (seen a little obliquely) and its fimbriae, a fringe of fingers fanned toward the ovary */
  const m = C[0], mn = nrm[0], tg = [C[1][0] - C[0][0], C[1][1] - C[0][1]], tl = Math.hypot(tg[0], tg[1]), fw = [tg[0] / tl, tg[1] / tl];
  const mang = Math.atan2(mn[1], mn[0]) * 180 / Math.PI;
  const mouth = '<ellipse class="fw-mouth" cx="' + f1(m[0] - fw[0] * 1.5) + '" cy="' + f1(m[1] - fw[1] * 1.5) + '" rx="15.6" ry="4.6" transform="rotate(' + f1(mang) + " " + f1(m[0] - fw[0] * 1.5) + " " + f1(m[1] - fw[1] * 1.5) + ')"/>';
  let fim = "", fimTip = null;
  const LEN = [9, 12, 15, 14, 17, 15, 19, 26, 17];
  for (let k = 0; k < 9; k++) {
    const u = -14.5 + k * 3.6, base = [m[0] + mn[0] * u + fw[0] * 2, m[1] + mn[1] * u + fw[1] * 2], ang = Math.atan2(-fw[1], -fw[0]) - u / 14.5 * 0.85 + 0.2, len = LEN[k];
    const tip = [base[0] + Math.cos(ang) * len, base[1] + Math.sin(ang) * len], cx = -Math.sin(ang), cy = Math.cos(ang), w0 = 1.9, w1 = 1.3, bend = 1.4 + (k % 2) * 1.2;
    const mid = [(base[0] + tip[0]) / 2 + cx * bend, (base[1] + tip[1]) / 2 + cy * bend];
    fim += '<path class="fw-fim" d="M' + f1(base[0] + cx * w0) + " " + f1(base[1] + cy * w0) + "Q" + f1(mid[0] + cx * w0) + " " + f1(mid[1] + cy * w0) + " " + f1(tip[0] + cx * w1) + " " + f1(tip[1] + cy * w1) + "A" + w1 + " " + w1 + " 0 0 1 " + f1(tip[0] - cx * w1) + " " + f1(tip[1] - cy * w1) + "Q" + f1(mid[0] - cx * w0) + " " + f1(mid[1] - cy * w0) + " " + f1(base[0] - cx * w0) + " " + f1(base[1] - cy * w0) + 'Z"/>';
    if (k === 3) fimTip = [f1(tip[0] + Math.cos(ang) * -4), f1(tip[1] + Math.sin(ang) * -4)];
  }
  /* the ovary, with a few small follicles */
  const ov = smooth([[22, 128], [36, 110], [62, 104], [90, 112], [100, 130], [86, 148], [56, 152], [30, 146]]);
  let fol = ""; [[38, 132, 4.5], [52, 142, 3.4], [84, 136, 4], [30, 120, 3]].forEach((q) => { fol += '<circle class="fw-fol" cx="' + q[0] + '" cy="' + q[1] + '" r="' + q[2] + '"/>'; });
  /* the uterus in coronal section: wall, endometrium, cavity; the other tube cut short */
  const ut = smooth([[442, 80], [468, 60], [512, 52], [556, 60], [582, 80], [578, 112], [556, 140], [532, 156], [528, 172], [496, 172], [492, 156], [468, 140], [446, 112]]);
  const endo = smooth([[460, 82], [486, 72], [512, 70], [538, 72], [564, 82], [548, 106], [528, 128], [518, 146], [506, 146], [496, 128], [476, 106]]);
  const cav = "M470 85C490 81 534 81 554 85C544 100 526 118 514 140C510 150 510 162 512 172" + "L512 172C514 162 514 150 510 140C498 118 480 100 470 85Z";
  const stub = "M572 70L590 59Q595 57 597 61Q598 65 594 67L578 82Z", stubL = "M579 74L593 64";
  const chan = "M436 82Q456 82 472 86";
  return { TP: C.map((q) => [f1(q[0]), f1(q[1])]), TUBE: tube, LUM: lumen, FOLD: fold, MOUTH: mouth, FIM: fim, FIMTIP: fimTip, OV: ov, FOL: fol, UT: ut, ENDO: endo, CAV: cav, STUB: stub, STUBL: stubL, CHAN: chan };
}

/* ---------- page helpers (serialized) ---------- */
function fwX(d) { return d <= 14 ? 30 + d * 300 / 14 : 330 + (d - 14) * 250 / 77; }
function fwD(i) { return i <= 14 ? i : 14 + 7 * (i - 14); }
function fwMono(P, x) {
  var n = P.length, i = 0;
  if (x <= P[0][0]) return P[0][1];
  if (x >= P[n - 1][0]) return P[n - 1][1];
  while (i < n - 2 && x > P[i + 1][0]) i++;
  function sl(k) {
    if (k === 0) return (P[1][1] - P[0][1]) / (P[1][0] - P[0][0]);
    if (k === n - 1) return (P[n - 1][1] - P[n - 2][1]) / (P[n - 1][0] - P[n - 2][0]);
    var a = (P[k][1] - P[k - 1][1]) / (P[k][0] - P[k - 1][0]), b = (P[k + 1][1] - P[k][1]) / (P[k + 1][0] - P[k][0]);
    return a * b <= 0 ? 0 : 2 / (1 / a + 1 / b);
  }
  var h = P[i + 1][0] - P[i][0], t = (x - P[i][0]) / h, m0 = sl(i) * h, m1 = sl(i + 1) * h, t2 = t * t, t3 = t2 * t;
  return Math.max(0, (2 * t3 - 3 * t2 + 1) * P[i][1] + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * P[i + 1][1] + (t3 - t2) * m1);
}
/* a curve from day a to day b, finer in the days part */
function fwPath(P, a, b, y1, hh, k) {
  var o = "", x = a, v;
  k = k || 1;
  while (true) { v = Math.min(1, fwMono(P, x) * k); o += (o ? "L" : "M") + f1(fwX(x)) + " " + f1(y1 - v * hh); if (x >= b) break; x = Math.min(b, x + (x < 14 ? 0.2 : 1)); }
  return o;
}
/* a label whose leader starts at (sx, sy), next to the text, and ends on a dot at (px, py) */
function fwLL(x, y, s, a, cls, sx, sy, px, py) { return '<g class="am-callout"><path class="lead" d="M' + f1(sx) + " " + f1(sy) + "L" + f1(px) + " " + f1(py) + '"/><circle class="dot" cx="' + f1(px) + '" cy="' + f1(py) + '" r="1.8"/>' + T(x, y, s, cls, a) + "</g>"; }
/* the conceptus at day d: oocyte, zygote, dividing cells, blastocyst */
function fwEmb(x, y, d) {
  var o = "", i;
  if (d <= 0) return '<circle class="fw-cor" cx="' + f1(x) + '" cy="' + f1(y) + '" r="7.4"/><circle class="fw-zp" cx="' + f1(x) + '" cy="' + f1(y) + '" r="5.6"/><circle class="fw-oo" cx="' + f1(x) + '" cy="' + f1(y) + '" r="4.4"/>';
  o += '<circle class="fw-zp" cx="' + f1(x) + '" cy="' + f1(y) + '" r="5.8"/>';
  if (d === 1) return o + '<circle class="fw-oo" cx="' + f1(x) + '" cy="' + f1(y) + '" r="4.6"/><circle class="fw-pn" cx="' + f1(x - 1.4) + '" cy="' + f1(y) + '" r="1.3"/><circle class="fw-pn" cx="' + f1(x + 1.4) + '" cy="' + f1(y) + '" r="1.3"/>';
  if (d === 2) { [[-1.9, -1.9], [1.9, -1.9], [-1.9, 1.9], [1.9, 1.9]].forEach(function (q) { o += '<circle class="fw-oo" cx="' + f1(x + q[0]) + '" cy="' + f1(y + q[1]) + '" r="2.5"/>'; }); return o; }
  if (d === 3) { for (i = 0; i < 9; i++) { var a = i * 2.4, r = i ? 2.9 : 0; o += '<circle class="fw-oo" cx="' + f1(x + r * Math.cos(a)) + '" cy="' + f1(y + r * Math.sin(a)) + '" r="1.85"/>'; } return o; }
  /* the blastocyst: trophoblasts around a fluid-filled cavity (the inner cells drawn, not named) */
  o = '<circle class="fw-tr" cx="' + f1(x) + '" cy="' + f1(y) + '" r="6.2"/><circle class="fw-bc" cx="' + f1(x) + '" cy="' + f1(y) + '" r="4.4"/><path class="fw-icm" d="M' + f1(x - 3.6) + " " + f1(y + 2.4) + "Q" + f1(x) + " " + f1(y - 1.2) + " " + f1(x + 3.6) + " " + f1(y + 2.4) + "Q" + f1(x) + " " + f1(y + 5) + " " + f1(x - 3.6) + " " + f1(y + 2.4) + 'Z"/>';
  return o;
}

function fwRender(st, D) {
  var i = Math.max(0, Math.min(25, Math.round(st.i))), d = D.fwD(i), np = !!st.np, o = "", k, x, y;
  st.i = i;
  var gw = 2 + d / 7, XL = 30, XR = 580, XK = 330;
  var cl = np ? D.CLN : D.CL, Y = { cur0: 194, ev: 230, h1: 312, hh: 44, p1: 410, ph: 62, ax: 418 };
  var clv = fwMono(cl, d), plv = np ? 0 : fwMono(D.PL, d), hv = np ? 0 : fwMono(D.HCG, d);

  /* ================= the anatomy ================= */
  o += T(14, 13, "OVARY, TUBE AND UTERUS · SCHEMATIC", "fw-h", "start");
  o += '<rect class="fw-panel" x="8" y="20" width="584" height="156" rx="10"/>';
  /* the ovary and its corpus luteum */
  o += HOT("The ovary. After ovulation the ruptured follicle becomes the corpus luteum.", '<path class="fw-ovary" d="' + D.G.OV + '"/>' + D.G.FOL);
  var clr, clc;
  if (np && d >= 14) { clr = 7.5; clc = "fw-alb"; }
  else if (np && d > 8) { clr = 13 - (d - 8) * 0.8; clc = "fw-cl fw-cl-fade"; }
  else { clr = d === 0 ? 9 : d < 4 ? 11 + d * 0.5 : d < 8 ? 13 : d <= 56 ? 14.5 : 14.5 - (d - 56) / 35 * 3; clc = "fw-cl"; }
  var clInfo = np && d >= 14 ? "Corpus albicans: without hCG, about 14 days after ovulation the corpus luteum regresses into this scar, and estrogen and progesterone fall abruptly." : np && d > 8 ? "The corpus luteum is regressing: no trophoblasts, no hCG to rescue it. Its progesterone and estrogen fall." : d >= 8 ? "The corpus luteum, rescued by hCG: it stays intact and increases its synthesis of progesterone and estrogen. It makes most of them during the first trimester." : "The corpus luteum, \"a robust endocrine organ\": the ruptured follicle, making large amounts of progesterone, with estrogen. Progesterone is the key hormone that prepares the endometrium for implantation.";
  o += HOT(clInfo, '<circle class="' + clc + '" cx="68" cy="' + f1(118 - clr * 0.35) + '" r="' + f1(clr) + '"/>' + (clc === "fw-cl" ? '<circle class="fw-clin" cx="68" cy="' + f1(118 - clr * 0.35) + '" r="' + f1(clr * 0.45) + '"/>' : ""));
  /* the tube */
  var fimInfo = "The fimbriae: finger-like projections at the distal end of the tube that capture the oocyte when the follicle ruptures at midcycle and bring it into the tube.";
  o += HOT(fimInfo, D.G.FIM);
  o += HOT("The fallopian tube. Beating cilia and peristaltic contractions move the oocyte, then the embryo, along it. Fertilization most often happens in its distal part, near the ovary.", '<path class="fw-tube" d="' + D.G.TUBE + '"/><path class="fw-lumen" d="' + D.G.LUM + '"/><path class="fw-fold" d="' + D.G.FOLD + '"/>');
  o += HOT(fimInfo, D.G.MOUTH);
  /* the uterus: wall, endometrium, cavity, and the opening where the tube meets it */
  o += HOT("The uterus. Its muscle, the myometrium: estrogen promotes contraction, progesterone relaxes it.", '<path class="fw-ut" d="' + D.G.UT + '"/><path class="fw-tube" d="' + D.G.STUB + '"/><path class="fw-stubl" d="' + D.G.STUBL + '"/>');
  var shed = np && d >= 14;
  o += HOT(shed ? "Without progesterone the endometrium is shed: menses." : "The endometrium in the luteal (secretory) phase: wider, more defined vessels and glycogen vacuoles, energy for implantation. Once the blastocyst arrives it decidualizes further.", '<path class="fw-endo' + (shed ? " fw-shed" : "") + '" d="' + D.G.ENDO + '"/>');
  o += '<path class="fw-cav" d="' + D.G.CAV + '"/>';
  var open = d >= 4 || (np && d >= 4);
  o += HOT(open ? "The opening of the uterus, relaxed: progesterone has risen and relaxed the myometrium, so the blastocyst can move into the uterus." : "The opening of the uterus, where the tube meets it, constricted: estrogen, still high just after midcycle, promotes contraction and constriction here, holding the embryo back while the endometrium gets ready.",
    '<path class="fw-chanw" d="' + D.G.CHAN + '"/><path class="fw-chan" stroke-width="' + (open ? 3 : 0.9) + '" d="' + D.G.CHAN + '"/><ellipse class="fw-sph' + (open ? "" : " is-tight") + '" cx="451" cy="' + (open ? 78.4 : 80.2) + '" rx="3.4" ry="' + (open ? 2 : 2.8) + '"/><ellipse class="fw-sph' + (open ? "" : " is-tight") + '" cx="451" cy="' + (open ? 85.8 : 84) + '" rx="3.4" ry="' + (open ? 2 : 2.8) + '"/>');
  /* the placenta and the growing sac, from implantation on */
  var site = [512, 76], emb = null, eLab = "";
  if (!np && d >= 8) {
    var sr = d < 14 ? 5.2 : Math.min(27, 5.2 + (d - 14) * 0.31), pt = d < 14 ? 1.5 : Math.min(8, 1.5 + (d - 14) * 0.1), sy = site[1] + sr * 0.82;
    var pl = "M" + f1(site[0] - sr * 0.95) + " " + f1(sy - sr * 0.3) + "A" + f1(sr) + " " + f1(sr) + " 0 0 1 " + f1(site[0] + sr * 0.95) + " " + f1(sy - sr * 0.3) + "L" + f1(site[0] + (sr + pt) * 0.95) + " " + f1(sy - (sr + pt) * 0.3) + "A" + f1(sr + pt) + " " + f1(sr + pt) + " 0 0 0 " + f1(site[0] - (sr + pt) * 0.95) + " " + f1(sy - (sr + pt) * 0.3) + "Z";
    o += HOT("The placenta: it begins developing shortly after implantation and is fully developed by the end of the first trimester; then it takes over the hormone production.", '<path class="fw-pla" d="' + pl + '"/>');
    if (d >= 14) o += '<circle class="fw-sac" cx="' + site[0] + '" cy="' + f1(sy) + '" r="' + f1(sr) + '"/><path class="fw-em" d="M' + f1(site[0] - sr * 0.28) + " " + f1(sy + sr * 0.32) + "q" + f1(sr * 0.2) + " " + f1(-sr * 0.42) + " " + f1(sr * 0.5) + " " + f1(-sr * 0.2) + "q" + f1(sr * 0.12) + " " + f1(sr * 0.25) + " " + f1(-sr * 0.14) + " " + f1(sr * 0.4) + "q" + f1(-sr * 0.22) + " " + f1(sr * 0.06) + " " + f1(-sr * 0.36) + " " + f1(-sr * 0.2) + 'Z"/>';
    else emb = [site[0], site[1] + 2];
    /* placental progesterone, around the placenta */
    if (plv > 0.02) for (k = 0; k < 9; k++) { var pa = Math.PI * (1.12 + k * 0.095), pr = sr + pt + 3 + (k % 2) * 2.4; o += '<circle class="fw-pdot" cx="' + f1(site[0] + pr * Math.cos(pa)) + '" cy="' + f1(sy + pr * Math.sin(pa) * 0.86) + '" r="' + f1(0.6 + plv * 2.6) + '"/>'; }
  }
  /* the conceptus in the tube or the cavity */
  var tp = D.TPOS[Math.min(d, 7)];
  if (d <= 7 && !(np && d >= 1)) { emb = tp.length === 1 ? D.G.TP[tp[0]] : tp; }
  if (np && d <= 1) emb = D.G.TP[d === 0 ? 2 : 10];
  if (emb) {
    var ed = np ? 0 : Math.min(d, 8), info = ["The oocyte, just released and captured by the fimbriae, still in its expanded cumulus.", "The zygote: fertilization took place within 24 hours of ovulation, in the distal fallopian tube. The male and female pronuclei fuse.", "Rapid cell division follows as the embryo moves down the tube. (Dr. Madison: you don't need the names of the stages.)", "Still dividing, held back at the opening of the uterus while estrogen keeps it constricted.", "The blastocyst, about 100 cells around a fluid-filled cavity, its outer layer the trophoblasts. It enters the uterine cavity about 4 days after ovulation.", "The blastocyst in the uterine cavity, ready to implant: implantation happens at the blastocyst stage.", "Implanting (5 to 7 days after ovulation): adhesion molecules bind the trophoblasts to the endometrium, and the trophoblasts invade.", "Implanting (5 to 7 days after ovulation): the syncytiotrophoblasts burrow into the endometrial stroma.", "Implanted. About 8 days after ovulation the trophoblasts start secreting hCG."][ed];
    if (np && d === 1) info = "No pregnancy: the oocyte is not fertilized, and no embryo comes.";
    o += HOT(info, '<g class="fw-emb' + (np && d === 1 ? " fw-gone" : "") + '">' + D.fwEmb(emb[0], emb[1], np ? 0 : Math.min(d, 4)) + "</g>");
    if (!np && d >= 6 && d <= 13) o += '<path class="fw-bury" d="M' + f1(emb[0] - 7.5) + " " + f1(emb[1] - 3) + "Q" + f1(emb[0]) + " " + f1(emb[1] - (d >= 7 ? 9 : 6.5)) + " " + f1(emb[0] + 7.5) + " " + f1(emb[1] - 3) + '"/>';
    eLab = np ? (d === 0 ? "oocyte" : "not fertilized") : ["oocyte", "zygote", "dividing", "dividing", "blastocyst", "blastocyst", "implanting", "implanting", "implanted"][Math.min(d, 8)];
  }
  /* sperm meeting the oocyte in the distal tube */
  if (!np && d <= 1) { var sp = ""; [[24, -1.2, 0.5], [30, 1.6, -0.4], [36, -0.4, 0.2]].forEach(function (q, j) { var p = D.G.TP[q[0] - (d ? 6 : 0) + 4 * 0], a = Math.atan2(D.G.TP[q[0] + 1][1] - p[1], D.G.TP[q[0] + 1][0] - p[0]); if (d === 1) return; var hx = p[0] + q[1], hy = p[1] + q[2]; sp += '<ellipse class="fw-sph-h" cx="' + f1(hx) + '" cy="' + f1(hy) + '" rx="1.6" ry="1" transform="rotate(' + f1(a * 180 / Math.PI) + " " + f1(hx) + " " + f1(hy) + ')"/><path class="fw-sptail" d="M' + f1(hx + Math.cos(a) * 1.5) + " " + f1(hy + Math.sin(a) * 1.5) + "q" + f1(Math.cos(a) * 4 - Math.sin(a) * 1.5) + " " + f1(Math.sin(a) * 4 + Math.cos(a) * 1.5) + " " + f1(Math.cos(a) * 8) + " " + f1(Math.sin(a) * 8) + '"/>'; }); if (sp) o += HOT("Sperm: of about 250 million deposited, only about 50 make it to the distal fallopian tube, where fertilization usually happens.", sp); }
  /* the two signals between the uterus and the ovary, through the blood */
  var hw = np ? 0 : (d < 8 ? 0 : Math.max(1, Math.min(3.4, 1 + hv * 2.6 + (d >= 8 && d <= 14 ? 0.5 : 0))));
  if (hw) o += HOT("hCG, secreted by the trophoblasts (later the placenta) into the mother's blood, reaches the corpus luteum: \"this is what rescues the corpus luteum.\" It keeps progesterone and estrogen high, and LH and FSH stay suppressed.", '<path class="fw-hcgw" stroke-width="' + f1(hw + 6) + '" d="M446 104C380 126 170 128 88 116"/><path class="fw-hcga" stroke-width="' + f1(hw) + '" d="M446 104C380 126 170 128 90 116.4"/><path class="fw-hcgh" d="M84 115.5L93 111.8L91.6 120.6Z"/>' + T(262, 128, "hCG", "fw-sig fw-sig-h", "middle"));
  var pw = Math.max(0, clv * 6.5);
  if (pw > 0.3) o += HOT("Progesterone (with estrogen) from the corpus luteum, through the blood to the uterus: it keeps the endometrium ready for implantation and relaxes the myometrium.", '<path class="fw-p4w" stroke-width="' + f1(pw + 6) + '" d="M80 125C160 172 380 168 452 128"/><path class="fw-p4a" stroke-width="' + f1(pw) + '" d="M80 125C160 172 380 168 447 130.6"/><path class="fw-p4h" d="M454 126.5L449.2 136L443.8 128.8Z"/>' + T(262, 162, "progesterone", "fw-sig fw-sig-p", "middle"));
  /* labels */
  o += fwLL(14, 90, clc === "fw-alb" ? "corpus albicans" : "corpus luteum", "start", "fw-l b", 58, 94, 64, 118 - clr * 0.35 - clr + 1.5);
  o += T(60, 168, "ovary", "fw-l", "middle");
  o += L(96, 40, "fimbriae", D.G.FIMTIP[0], D.G.FIMTIP[1], "end", "fw-l");
  o += L(168, 40, "distal tube", 168, 75.5, "middle", "fw-l");
  if (d >= 4 || np) o += T(262, 102, "fallopian tube", "fw-l mut", "middle");
  o += L(436, 36, "opening of the uterus", 451, 77, "end", "fw-l");
  o += T(436, 50, open ? "relaxed: progesterone" : "constricted: estrogen", "fw-l " + (open ? "fw-l-p" : "fw-l-e"), "end");
  o += T(586, 172, shed ? "menses" : "uterus", "fw-l" + (shed ? " fw-l-bad" : ""), "end");
  if (!np && d >= 14) o += fwLL(588, 40, "placenta", "end", "fw-l fw-l-pl" + (d >= 70 ? " b" : ""), 560, 43, 522, 74);
  if (eLab && emb) { if (emb[0] < 440) o += fwLL(emb[0] + (d === 0 ? 22 : 0), 106 + (d === 0 ? 14 : 0), eLab, "middle", "fw-l b", emb[0] + (d === 0 ? 14 : 0), 97 + (d === 0 ? 14 : 0), emb[0], emb[1] + (d === 0 ? 7.5 : 6.5)); else o += fwLL(588, 40, eLab, "end", "fw-l b", 560, 43, emb[0] + 4, emb[1] - 5); }

  /* ================= the events, on the time axis ================= */
  o += T(14, 190, "WHAT HAPPENS WHEN", "fw-h", "start");
  o += '<rect class="fw-cur" x="' + f1(fwX(d) - 9) + '" y="' + Y.cur0 + '" width="18" height="' + (Y.ax - Y.cur0) + '"/>';
  o += '<path class="fw-brk" d="M' + XK + " " + Y.cur0 + "V" + Y.ax + '"/>';
  o += '<path class="fw-evl" d="M' + XL + " " + Y.ev + "H" + XR + '"/>';
  D.EV.forEach(function (e) {
    var on = d >= e[5] && d <= e[6], dim = np && e[7], ex = fwX(e[0]), ty = e[2] ? 222 : 206, tx = e[4] === "end" ? ex + (e[8] || 0) : e[4] === "start" ? ex + (e[8] || 0) : ex;
    var lab = e[1]; if (e[0] === 14) lab = np ? "corpus luteum regresses" : "corpus luteum rescued";
    var g = (e[9] ? '<rect class="fw-evb' + (on ? " is-on" : "") + '" x="' + f1(fwX(e[9][0])) + '" y="' + (Y.ev - 3) + '" width="' + f1(fwX(e[9][1]) - fwX(e[9][0])) + '" height="6" rx="3"/>' : "") + '<path class="fw-evt" d="M' + f1(ex) + " " + (ty + 4) + "V" + (Y.ev - 2) + '"/><circle class="fw-evd' + (on ? " is-on" : "") + '" cx="' + f1(ex) + '" cy="' + Y.ev + '" r="3.2"/>' + T(tx, ty, lab, "fw-ev" + (on ? " is-on" : ""), e[4] || "middle");
    o += HOT(np && e[0] === 14 ? "About 14 days after ovulation, with no hCG, the corpus luteum regresses into the corpus albicans; estrogen and progesterone fall abruptly and the endometrium is shed: menses." : e[3], '<g' + (dim ? ' opacity=".28"' : "") + ">" + g + "</g>");
  });
  /* ================= hCG ================= */
  o += T(14, 254, "hCG · FROM THE TROPHOBLASTS", "fw-h", "start") + T(XR, 254, "relative level", "fw-h fw-hr", "end");
  o += '<path class="fw-axis" d="M' + XL + " " + Y.h1 + "H" + XR + '"/>';
  if (!np) {
    var hf = fwPath(D.HCG, 8, 91, Y.h1, Y.hh), hn = d >= 8 ? fwPath(D.HCG, 8, d, Y.h1, Y.hh) : "";
    var zf = fwPath(D.HCG, 8, 14, Y.h1, Y.hh, 50), zn = d >= 8 ? fwPath(D.HCG, 8, Math.min(d, 14), Y.h1, Y.hh, 50) : "";
    o += HOT("hCG, secreted by the trophoblasts from about 8 days after ovulation. It can be found in urine or blood about 10 to 11 days after fertilization (what a pregnancy test measures), is highest toward the end of the first trimester, at about 10 weeks, then declines for the rest of pregnancy.", '<path class="fw-hit" d="' + hf + '"/><path class="fw-fut fw-hcg" d="' + hf + '"/>' + (hn ? '<path class="fw-now fw-hcg" d="' + hn + '"/>' : ""));
    o += HOT("The first days of hCG, drawn 50 times taller so they show: it rises very fast (\"it's very high, very quickly\").", '<path class="fw-hit" d="' + zf + '"/><path class="fw-fut fw-hcg fw-zoom" d="' + zf + '"/>' + (zn ? '<path class="fw-now fw-hcg fw-zoom" d="' + zn + '"/>' : "") + T(fwX(14) - 4, Y.h1 - Y.hh * 0.6 - 4, "×50", "fw-cl-t fw-hcg-t", "end"));
    if (d >= 8) o += '<circle class="fw-dot fw-hcg" cx="' + f1(fwX(d)) + '" cy="' + f1(Y.h1 - Math.min(1, fwMono(D.HCG, d) * (d <= 14 ? 50 : 1)) * Y.hh) + '" r="4"/>';
    o += T(fwX(56), Y.h1 - Y.hh - 4, "hCG", "fw-cl-t fw-hcg-t", "middle");
  } else o += '<rect class="fw-none" x="' + XL + '" y="' + (Y.h1 - Y.hh) + '" width="' + (XR - XL) + '" height="' + Y.hh + '"/>' + T((XL + XR) / 2, Y.h1 - 16, "no pregnancy: no trophoblasts, no hCG", "fw-cl-t mut", "middle");
  /* ================= progesterone ================= */
  o += T(14, 332, "PROGESTERONE · WHO MAKES IT", "fw-h", "start") + T(XR, 332, "relative level", "fw-h fw-hr", "end");
  o += '<path class="fw-axis" d="M' + XL + " " + Y.p1 + "H" + XR + '"/>';
  var cf = fwPath(cl, 0, np ? 16 : 91, Y.p1, Y.ph), cn = fwPath(cl, 0, np ? Math.min(d, 16) : d, Y.p1, Y.ph);
  o += HOT(np ? "Progesterone from the corpus luteum without a pregnancy: it rises through the luteal phase, then falls abruptly as the corpus luteum regresses, about 14 days after ovulation." : "Progesterone from the corpus luteum: rescued by hCG, it makes most of the progesterone and estrogen during the first trimester, then its share falls as the placenta takes over.", '<path class="fw-hit" d="' + cf + '"/><path class="fw-fut fw-p4c" d="' + cf + '"/><path class="fw-now fw-p4c" d="' + cn + '"/>');
  if (!np) {
    var pf = fwPath(D.PL, 14, 91, Y.p1, Y.ph), pn = d > 14 ? fwPath(D.PL, 14, d, Y.p1, Y.ph) : "";
    o += HOT("Progesterone from the placenta: it can make progesterone on its own, from the mother's cholesterol. Fully developed by the end of the first trimester, it takes over the hormone production and supplies both mother and fetus.", '<path class="fw-hit" d="' + pf + '"/><path class="fw-fut fw-p4p" d="' + pf + '"/>' + (pn ? '<path class="fw-now fw-p4p" d="' + pn + '"/>' : ""));
    var xc = D.XC;
    o += HOT("The handoff: by the end of the first trimester the placenta's progesterone passes the corpus luteum's.", '<circle class="fw-xc' + (d >= 70 && d <= 77 ? " is-on" : "") + '" cx="' + f1(fwX(xc)) + '" cy="' + f1(Y.p1 - fwMono(D.PL, xc) * Y.ph) + '" r="6.5"/>');
    o += '<circle class="fw-dot fw-p4p" cx="' + f1(fwX(d)) + '" cy="' + f1(Y.p1 - plv * Y.ph) + '" r="' + (d > 14 ? 4 : 0) + '"/>';
    o += T(fwX(84) + 2, Y.p1 - fwMono(D.PL, 84) * Y.ph - 9, "placenta", "fw-cl-t fw-p4p-t", "end");
  } else o += '<rect class="fw-none" x="' + f1(fwX(16)) + '" y="' + (Y.p1 - Y.ph) + '" width="' + f1(XR - fwX(16)) + '" height="' + Y.ph + '"/>' + T((fwX(16) + XR) / 2, Y.p1 - 26, "menses, then a new cycle", "fw-cl-t mut", "middle") + T((fwX(16) + XR) / 2, Y.p1 - 12, "(not drawn)", "fw-cl-t mut", "middle");
  o += '<circle class="fw-dot fw-p4c" cx="' + f1(fwX(d)) + '" cy="' + f1(Y.p1 - clv * Y.ph) + '" r="4"/>';
  o += T(fwX(np ? 6.5 : 30), Y.p1 - fwMono(cl, np ? 6.5 : 30) * Y.ph - 9, "corpus luteum", "fw-cl-t fw-p4c-t", "middle");
  /* ================= the axis ================= */
  var ax = '<path class="fw-axis" d="M' + XL + " " + Y.ax + "H" + XR;
  for (k = 0; k <= 14; k++) ax += "M" + f1(fwX(k)) + " " + Y.ax + "V" + (Y.ax + (k % 7 === 0 ? 6 : 3));
  for (k = 3; k <= 15; k++) ax += "M" + f1(fwX((k - 2) * 7)) + " " + Y.ax + "V" + (Y.ax + 4);
  o += ax + '"/>';
  o += '<path class="fw-brk2" d="M' + (XK - 4) + " " + (Y.ax + 5) + "L" + (XK - 1) + " " + (Y.ax - 5) + "M" + (XK + 1) + " " + (Y.ax + 5) + "L" + (XK + 4) + " " + (Y.ax - 5) + '"/>';
  [0, 2, 4, 6, 8, 10, 12, 14].forEach(function (n) { o += T(fwX(n), 432, String(n), "fw-tk" + (n === d ? " b" : ""), "middle"); });
  if (d <= 14 && d % 2) o += T(fwX(d), 432, String(d), "fw-tk b", "middle");
  o += T(XK + 10, 432, "← days after ovulation", "fw-tk mut", "start");
  [2, 3, 4, 6, 8, 10, 12, 14].forEach(function (n) { o += T(fwX((n - 2) * 7), 448, String(n), "fw-tk fw-wk" + (d > 14 && Math.abs(gw - n) < 0.01 ? " b" : ""), "middle"); });
  if (d > 14 && [6, 8, 10, 12, 14].indexOf(gw) < 0) o += T(fwX(d), 448, String(gw), "fw-tk fw-wk b", "middle");
  o += T(XL - 4, 464, "weeks of pregnancy, counted from the start of the last period (ovulation is about week 2)", "fw-tk fw-wk", "start");
  /* the first trimester */
  o += HOT("The first trimester runs to about week 13. The corpus luteum carries it; the placenta is fully developed by its end and takes over.", '<rect class="fw-tri" x="' + XL + '" y="474" width="' + f1(fwX(77) - XL) + '" height="16" rx="3"/>' + T((XL + fwX(77)) / 2, 486, "first trimester", "fw-trt", "middle"));
  o += '<rect class="fw-tri fw-tri2" x="' + f1(fwX(77) + 2) + '" y="474" width="' + f1(XR - fwX(77) - 2) + '" height="16" rx="3"/>' + T((fwX(77) + XR) / 2, 486, "second", "fw-trt", "middle");
  return o;
}

function fwWho(st, D) {
  var d = D.fwD(st.i), np = !!st.np;
  if (np) return d >= 14 ? "none (corpus albicans)" : d >= 9 ? "the corpus luteum, falling" : "the corpus luteum";
  var c = D.fwMono(D.CL, d), p = D.fwMono(D.PL, d);
  return p > c * 1.12 ? "the placenta" : p > c * 0.75 ? "the corpus luteum and the placenta: the handoff" : "the corpus luteum";
}
function fwSay(st, D) {
  var d = D.fwD(st.i), np = !!st.np, gw = 2 + d / 7, s, when = d <= 14 ? (d === 0 ? "Ovulation, day 0" : "Day " + d + " after ovulation") + " (about week " + (Math.round(gw * 10) / 10) + ")" : "Week " + gw + " of pregnancy (" + (d / 7) + " weeks after ovulation)";
  if (np) {
    if (d === 0) s = "Ovulation: the fimbriae capture the oocyte. The ruptured follicle becomes the corpus luteum, which makes progesterone, with estrogen.";
    else if (d <= 3) s = "No pregnancy: the oocyte is not fertilized. The corpus luteum makes progesterone all the same, through the luteal phase.";
    else if (d <= 8) s = "Luteal phase: progesterone prepares the endometrium (wider vessels, glycogen) and relaxes the myometrium, but no blastocyst arrives.";
    else if (d <= 13) s = "No trophoblasts, so no hCG: the corpus luteum starts to regress, and its progesterone and estrogen fall.";
    else if (d === 14) s = "About 14 days after ovulation the corpus luteum has regressed into the corpus albicans. Estrogen and progesterone fall abruptly, and the endometrium is shed: menses. hCG exists to stop exactly this.";
    else s = "No pregnancy: after menses a new cycle begins (not drawn). Turn off No pregnancy to see what hCG changes.";
  } else {
    if (d === 0) s = "Ovulation: the fimbriae capture the oocyte, and the tube's cilia and contractions move it along. The ruptured follicle becomes the corpus luteum and starts making progesterone, with estrogen.";
    else if (d === 1) s = "Fertilization takes place within 24 hours of ovulation, in the distal fallopian tube: the zygote.";
    else if (d <= 3) s = "Rapid cell division follows as the embryo moves down the tube. Estrogen, still high just after midcycle, constricts the opening of the uterus, holding the embryo back while the endometrium gets ready.";
    else if (d === 4) s = "About 4 days after ovulation: progesterone has risen and relaxed the myometrium, and the blastocyst (about 100 cells, its outer layer the trophoblasts) enters the uterine cavity.";
    else if (d <= 7) s = "Implantation, 5 to 7 days after ovulation (\"there's no definitive day\"): the blastocyst attaches to the endometrium, and its trophoblasts invade the stroma.";
    else if (d <= 10) s = "About 8 days after ovulation the trophoblasts start secreting hCG. It \"informs\" the corpus luteum that fertilization has happened: \"this is what rescues the corpus luteum.\"";
    else if (d <= 13) s = "hCG can be found in urine or blood about 10 to 11 days after fertilization: it is what a pregnancy test measures. Under hCG the corpus luteum increases its progesterone and estrogen.";
    else if (d === 14) s = "About 14 days after ovulation the corpus luteum would regress into the corpus albicans. hCG rescues it: progesterone and estrogen stay high, LH and FSH stay suppressed, and there are no menses (the secondary amenorrhea of pregnancy).";
    else if (d <= 49) s = "First trimester: the corpus luteum, kept going by hCG, makes most of the progesterone and estrogen, because the placenta, which began developing shortly after implantation, isn't fully formed yet.";
    else if (d <= 63) s = "hCG is highest toward the end of the first trimester, at about 10 weeks, then declines for the rest of pregnancy. The placenta's share of the progesterone is growing.";
    else if (d <= 77) s = "End of the first trimester: the placenta is fully developed and takes over the hormone production. Its progesterone passes the corpus luteum's.";
    else s = "After the first trimester the placenta makes the progesterone on its own and supplies it to both mother and fetus; hCG keeps declining.";
  }
  return [when + ". " + s, (d <= 14 ? "day " + d : "week " + gw) + " · progesterone: " + D.fwWho(st, D)];
}

export default function firstweeks() {
  const G = geo();
  /* relative levels at key days after ovulation (monotone curves through them) */
  const HCG = [[8, 0], [9, 0.001], [10, 0.002], [11, 0.004], [12, 0.006], [13, 0.009], [14, 0.012], [21, 0.05], [28, 0.18], [35, 0.42], [42, 0.7], [49, 0.92], [56, 1], [63, 0.9], [70, 0.7], [77, 0.52], [84, 0.4], [91, 0.32]];
  const CL = [[0, 0.06], [2, 0.14], [4, 0.25], [6, 0.33], [8, 0.37], [10, 0.39], [12, 0.41], [14, 0.43], [21, 0.46], [28, 0.47], [35, 0.47], [42, 0.45], [49, 0.42], [56, 0.38], [63, 0.33], [70, 0.28], [77, 0.22], [84, 0.17], [91, 0.13]];
  const CLN = [[0, 0.06], [2, 0.14], [4, 0.25], [6, 0.33], [8, 0.36], [9, 0.34], [10, 0.29], [11, 0.22], [12, 0.14], [13, 0.07], [14, 0.03], [15, 0.01], [16, 0]];
  const PL = [[14, 0], [21, 0.01], [28, 0.03], [35, 0.06], [42, 0.1], [49, 0.14], [56, 0.18], [63, 0.215], [70, 0.25], [77, 0.31], [84, 0.4], [91, 0.52]];
  /* where the two progesterone curves cross */
  let XC = 70; for (let x = 60; x <= 85; x += 0.25) { if (fwMono(PL, x) >= fwMono(CL, x)) { XC = x; break; } }
  /* the conceptus by day: an index on the tube, or a point in the uterus */
  const TPOS = [[2], [12], [36], [54], [482, 98], [506, 106], [512, 86], [512, 80]];
  /* events: [day, label, row, info, anchor, lit from, lit to, hidden with No pregnancy, label offset, band] */
  const EV = [
    [0, "ovulation", 0, "Ovulation, at midcycle. The fimbriae capture the oocyte, and the ruptured follicle becomes the corpus luteum.", "start", 0, 0, false, -4],
    [0.5, "fertilized", 1, "Fertilization: within 24 hours of ovulation, in the distal fallopian tube (typically day 15 or 16 of the cycle).", "start", 1, 1, true, 2],
    [4, "in the uterus", 0, "About 4 days after ovulation the blastocyst, about 100 cells, enters the uterine cavity, once progesterone has relaxed the myometrium.", "start", 4, 4, true, -10],
    [6, "implants", 1, "Implantation: 5 to 7 days after ovulation. He stressed these are ranges: \"there's no definitive day.\"", "middle", 5, 7, true, 0, [5, 7]],
    [8, "hCG starts", 0, "About 8 days after ovulation the trophoblasts start secreting hCG, the important part of his timeline slide.", "start", 8, 10, true, -2],
    [11.5, "pregnancy test +", 1, "hCG can be found in urine or blood about 10 to 11 days after fertilization: a pregnancy test measures hCG.", "middle", 11, 13, true, 0, [10.5, 12.5]],
    [14, "corpus luteum rescued", 0, "About 14 days after ovulation: when the corpus luteum would regress without hCG. With hCG it is rescued, and there are no menses.", "start", 14, 14, false, -37],
    [56, "hCG peaks", 1, "hCG peaks toward the end of the first trimester, at about 10 weeks, then declines.", "middle", 56, 63, true],
    [XC, "placenta takes over", 0, "End of the first trimester: the placenta is fully developed and takes over the hormone production from the corpus luteum.", "end", 70, 77, true, 48],
  ];
  const D = { G, HCG, CL, CLN, PL, XC, TPOS, EV, INIT: { i: 0, np: false }, STEPKEY: "i", STEPMAX: 25, PLAYMS: 1100 };
  return makeFig({
    id: "firstweeks", lec: "preg", fig: "Fig 4", short: "The first weeks", hint: "drag the time · hover",
    title: "The first weeks: a timeline with the hormone handoff",
    caption: "Drag the time from ovulation to the second trimester: where the embryo is, the lecture's day numbers, hCG rescuing the corpus luteum, and the placenta taking over the progesterone. Turn on No pregnancy to see what happens without hCG.",
    W, H,
    label: "A schematic ovary, fallopian tube and uterus above a time axis (days after ovulation, then weeks of pregnancy) with the events of the first weeks, an hCG curve, and progesterone from the corpus luteum and from the placenta crossing at the end of the first trimester.",
    D, render: fwRender, say: fwSay, helpers: [fwX, fwD, fwMono, fwPath, fwLL, fwEmb, fwWho],
    controls: `<div class="am-controls"><label class="am-slider"><span>ovulation</span><input type="range" min="0" max="25" step="1" value="0" data-amk="i" aria-label="Time after ovulation"><span>week 15</span></label><button type="button" class="am-btn" data-amplay aria-pressed="false">Play</button></div>
<div class="am-controls"><button type="button" class="am-btn" data-amstep="-1">Back</button><button type="button" class="am-btn" data-amstep="1">Next</button><button type="button" class="am-btn" data-amt="np" aria-pressed="false">No pregnancy</button></div>`,
    sources: [
      "From the L17 recording, slides and slide notes (Dr. Madison): fertilization within 24 hours of ovulation in the distal fallopian tube; the fimbriae, cilia and peristaltic contractions; estrogen constricting the opening of the uterus and progesterone relaxing the myometrium; the blastocyst (about 100 cells) in the uterine cavity about 4 days after ovulation; implantation 5 to 7 days after ovulation; hCG from the trophoblasts about 8 days after ovulation, found in urine or blood 10 to 11 days after fertilization and highest at about 10 weeks; the corpus luteum regressing about 14 days after ovulation without hCG; the corpus luteum making most of the progesterone and estrogen in the first trimester and the placenta taking over at its end.",
      "The lecture gives no day for the switch from estrogen to progesterone at the opening of the uterus; it is drawn where the blastocyst enters, about day 4. The weeks are counted from the start of the last period, the way obstetrics counts them (and the lecture's 40 weeks to delivery), so ovulation falls at about week 2 of a 28-day cycle (ACOG, Methods for Estimating the Due Date, Committee Opinion 700); the lecture's 10-week hCG peak is read on that scale.",
      "Curves are qualitative, relative levels, each row on its own scale. Their shapes follow the standard textbook figures (Guyton and Hall, Textbook of Medical Physiology, hormones of pregnancy; Costanzo, Physiology, hormones of pregnancy) and hCG's early doubling and peak follow Cole (Reproductive Biology and Endocrinology, 2009). The placenta's progesterone crosses the corpus luteum's at the end of the first trimester, as the lecture says; lutectomy studies (Csapo and colleagues, American Journal of Obstetrics and Gynecology, 1973) put the luteal-placental shift a little earlier, at about 7 to 9 weeks, after which the corpus luteum is no longer needed.",
      "The anatomy is schematic and not to scale (the embryo is drawn much larger than its 0.1 to 0.2 millimeters, and the uterus doesn't grow with the sac). The cleavage stages aren't named, as the lecture asks. Educational, not medical advice."],
    css: `
.anima[data-anima="firstweeks"] .am-svg{max-width:640px}
.anima .firstweeks-svg .fw-h{font:600 11px var(--anatomy-mono);letter-spacing:.06em;fill:var(--anatomy-muted);stroke:none}
.anima .firstweeks-svg .fw-hr{font-weight:400;letter-spacing:0}
.anima .firstweeks-svg .fw-panel{fill:var(--bx-lumen);stroke:var(--anatomy-faint);stroke-width:1}
.anima .firstweeks-svg .fw-ovary{fill:var(--bx-matrix);stroke:var(--bx-cyto-line);stroke-width:1.1}
.anima .firstweeks-svg .fw-fol{fill:var(--bx-lumen);stroke:var(--bx-violet);stroke-width:.8}
.anima .firstweeks-svg .fw-cl{fill:var(--bx-gold-soft);stroke:var(--bx-gold);stroke-width:2.2}
.anima .firstweeks-svg .fw-cl-fade{opacity:.55}
.anima .firstweeks-svg .fw-clin{fill:var(--bx-lumen);stroke:var(--bx-gold);stroke-width:.8}
.anima .firstweeks-svg .fw-alb{fill:var(--bx-fat);stroke:var(--bx-fat-line);stroke-width:1.2}
.anima .firstweeks-svg .fw-tube,.anima .firstweeks-svg .fw-fim{fill:var(--bx-cyto);stroke:var(--bx-cyto-line);stroke-width:1}
.anima .firstweeks-svg .fw-mouth{fill:color-mix(in srgb,var(--bx-cyto-line) 28%,var(--bx-lumen));stroke:var(--bx-cyto-line);stroke-width:1}
.anima .firstweeks-svg .fw-lumen{fill:var(--bx-lumen);stroke:var(--bx-cyto-line);stroke-width:.6}
.anima .firstweeks-svg .fw-fold{fill:none;stroke:var(--bx-eosin);stroke-width:1;stroke-linecap:round}
.anima .firstweeks-svg .fw-stubl{fill:none;stroke:var(--bx-lumen);stroke-width:2;stroke-linecap:round}
.anima .firstweeks-svg .fw-ut{fill:var(--bx-eosin);stroke:var(--bx-cyto-line);stroke-width:1.2}
.anima .firstweeks-svg .fw-endo{fill:var(--bx-matrix);stroke:var(--bx-violet);stroke-width:1}
.anima .firstweeks-svg .fw-endo.fw-shed{fill:var(--bx-blood-soft);stroke:var(--bx-blood);stroke-dasharray:3 2}
.anima .firstweeks-svg .fw-cav{fill:var(--bx-lumen);stroke:var(--bx-violet);stroke-width:.8}
.anima .firstweeks-svg .fw-chanw{fill:none;stroke:var(--bx-cyto-line);stroke-width:4.6;stroke-linecap:round}
.anima .firstweeks-svg .fw-chan{fill:none;stroke:var(--bx-lumen);stroke-linecap:round}
.anima .firstweeks-svg .fw-sph{fill:var(--bx-blue-soft);stroke:var(--bx-blue);stroke-width:1}
.anima .firstweeks-svg .fw-sph.is-tight{fill:var(--bx-blue);stroke:var(--bx-blue)}
.anima .firstweeks-svg .fw-pla{fill:var(--bx-memb);stroke:var(--bx-memb);stroke-width:.8;stroke-linejoin:round}
.anima .firstweeks-svg .fw-sac{fill:var(--bx-lumen);stroke:var(--bx-violet);stroke-width:1}
.anima .firstweeks-svg .fw-em{fill:var(--bx-cyto);stroke:var(--bx-cyto-line);stroke-width:.7}
.anima .firstweeks-svg .fw-pdot{fill:var(--bx-gold)}
.anima .firstweeks-svg .fw-cor{fill:var(--bx-violet-soft);stroke:var(--bx-violet);stroke-width:.7;stroke-dasharray:1.4 1}
.anima .firstweeks-svg .fw-zp{fill:var(--bx-eosin);stroke:var(--bx-cyto-line);stroke-width:.6}
.anima .firstweeks-svg .fw-oo{fill:var(--bx-cyto);stroke:var(--bx-nuc);stroke-width:.7}
.anima .firstweeks-svg .fw-pn{fill:var(--bx-nuc)}
.anima .firstweeks-svg .fw-tr{fill:var(--bx-cyto);stroke:var(--bx-nuc);stroke-width:1}
.anima .firstweeks-svg .fw-bc{fill:var(--bx-lumen)}
.anima .firstweeks-svg .fw-icm{fill:var(--bx-nuc);opacity:.7}
.anima .firstweeks-svg .fw-gone{opacity:.35}
.anima .firstweeks-svg .fw-bury{fill:none;stroke:var(--bx-hot);stroke-width:1.2;stroke-linecap:round}
.anima .firstweeks-svg .fw-sph-h{fill:var(--bx-sperm)}
.anima .firstweeks-svg .fw-sptail{fill:none;stroke:var(--bx-sperm);stroke-width:.7}
.anima .firstweeks-svg .fw-hcgw,.anima .firstweeks-svg .fw-p4w{fill:none;stroke:transparent;pointer-events:stroke}
.anima .firstweeks-svg .fw-hcga{fill:none;stroke:var(--bx-ins);stroke-dasharray:6 4;stroke-linecap:round}
.anima .firstweeks-svg .fw-hcgh{fill:var(--bx-ins)}
.anima .firstweeks-svg .fw-p4a{fill:none;stroke:var(--bx-gold);stroke-dasharray:6 4;stroke-linecap:round}
.anima .firstweeks-svg .fw-p4h{fill:var(--bx-gold)}
.anima .firstweeks-svg .fw-sig{font:700 11.5px var(--anatomy-mono);paint-order:stroke;stroke:var(--bx-lumen);stroke-width:4px;stroke-linejoin:round}
.anima .firstweeks-svg .fw-sig-h{fill:var(--bx-ins)}
.anima .firstweeks-svg .fw-sig-p{fill:color-mix(in srgb,var(--bx-gold) 70%,var(--anatomy-strong))}
.anima .firstweeks-svg .t.fw-l{font-size:11.5px;stroke:var(--bx-lumen);stroke-width:4px}
.anima .firstweeks-svg .t.fw-l-e{fill:var(--bx-blue);font-weight:600}
.anima .firstweeks-svg .t.fw-l-p{fill:color-mix(in srgb,var(--bx-gold) 70%,var(--anatomy-strong));font-weight:600}
.anima .firstweeks-svg .t.fw-l-pl{fill:var(--bx-memb)}
.anima .firstweeks-svg .t.fw-l-bad{fill:var(--bx-inhib);font-weight:600}
.anima .firstweeks-svg .fw-cur{fill:var(--accent);opacity:.1}
.anima .firstweeks-svg .fw-brk{fill:none;stroke:var(--anatomy-lo);stroke-width:1;stroke-dasharray:2 4}
.anima .firstweeks-svg .fw-brk2{fill:none;stroke:var(--anatomy-mid);stroke-width:1.2}
.anima .firstweeks-svg .fw-evl{fill:none;stroke:var(--anatomy-lo);stroke-width:1}
.anima .firstweeks-svg .fw-evt{fill:none;stroke:var(--anatomy-lo);stroke-width:.8}
.anima .firstweeks-svg .fw-evd{fill:var(--surface);stroke:var(--anatomy-mid);stroke-width:1.2}
.anima .firstweeks-svg .fw-evd.is-on{fill:var(--accent);stroke:var(--accent)}
.anima .firstweeks-svg .fw-evb{fill:var(--anatomy-shade-2);stroke:var(--anatomy-lo);stroke-width:.6}
.anima .firstweeks-svg .fw-evb.is-on{fill:var(--accent-soft);stroke:var(--accent)}
.anima .firstweeks-svg .fw-ev{font:11px var(--anatomy-mono);fill:var(--anatomy-text);paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round}
.anima .firstweeks-svg .fw-ev.is-on{fill:var(--accent-ink);font-weight:700}
.anima .firstweeks-svg .fw-axis{fill:none;stroke:var(--anatomy-mid);stroke-width:1}
.anima .firstweeks-svg .fw-hit{fill:none;stroke:transparent;stroke-width:10;pointer-events:stroke}
.anima .firstweeks-svg .fw-fut{fill:none;stroke-width:1.6;opacity:.32}
.anima .firstweeks-svg .fw-now{fill:none;stroke-width:2.6;stroke-linejoin:round;stroke-linecap:round}
.anima .firstweeks-svg .fw-zoom{stroke-dasharray:4 3;stroke-width:1.6}
.anima .firstweeks-svg .fw-dot{stroke:var(--surface);stroke-width:1.6}
.anima .firstweeks-svg .fw-hcg{stroke:var(--bx-ins)} .anima .firstweeks-svg .fw-dot.fw-hcg{fill:var(--bx-ins)}
.anima .firstweeks-svg .fw-p4c{stroke:var(--bx-gold)} .anima .firstweeks-svg .fw-dot.fw-p4c{fill:var(--bx-gold)}
.anima .firstweeks-svg .fw-p4p{stroke:var(--bx-memb)} .anima .firstweeks-svg .fw-dot.fw-p4p{fill:var(--bx-memb)}
.anima .firstweeks-svg .fw-cl-t{font:600 11.5px var(--anatomy-mono);paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round}
.anima .firstweeks-svg .fw-cl-t.mut{fill:var(--anatomy-muted);font-weight:400}
.anima .firstweeks-svg .fw-hcg-t{fill:var(--bx-ins)} .anima .firstweeks-svg .fw-p4c-t{fill:color-mix(in srgb,var(--bx-gold) 70%,var(--anatomy-strong))} .anima .firstweeks-svg .fw-p4p-t{fill:var(--bx-memb)}
.anima .firstweeks-svg .fw-xc{fill:none;stroke:var(--anatomy-mid);stroke-width:1.2;stroke-dasharray:2 2}
.anima .firstweeks-svg .fw-xc.is-on{stroke:var(--accent);stroke-width:1.8;stroke-dasharray:none}
.anima .firstweeks-svg .fw-none{fill:var(--anatomy-shade-1);stroke:var(--anatomy-lo);stroke-width:.6;stroke-dasharray:3 3}
.anima .firstweeks-svg .fw-tk{font:11px var(--anatomy-mono);fill:var(--anatomy-text);stroke:none}
.anima .firstweeks-svg .fw-tk.mut{fill:var(--anatomy-muted)}
.anima .firstweeks-svg .fw-tk.fw-wk{fill:var(--anatomy-muted)}
.anima .firstweeks-svg .fw-tk.b{fill:var(--accent-ink);font-weight:700}
.anima .firstweeks-svg .fw-tri{fill:var(--accent-soft);stroke:var(--accent);stroke-width:.8}
.anima .firstweeks-svg .fw-tri2{fill:var(--anatomy-shade-1);stroke:var(--anatomy-lo)}
.anima .firstweeks-svg .fw-trt{font:11px var(--anatomy-mono);fill:var(--anatomy-text);stroke:none}
@media (max-width:560px){.anima .firstweeks-svg .fw-h{font-size:12.5px}.anima .firstweeks-svg .fw-ev{font-size:12px}.anima .firstweeks-svg .fw-tk,.anima .firstweeks-svg .fw-trt{font-size:12.5px}.anima .firstweeks-svg .t.fw-l,.anima .firstweeks-svg .fw-cl-t,.anima .firstweeks-svg .fw-sig{font-size:13px}}
`,
  });
}
