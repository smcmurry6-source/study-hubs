// Fig: the 28-day cycle, three views at once (L16 Female Reproductive Physiology, Dr. Madison, with L14 Female
// Reproductive Histology, Dr. Herr). One day slider moves a cursor through four rows on one time axis: the pituitary's
// FSH and LH (fairly steady LH, then the surge), the feedback state (estradiol negative, positive above 200 pg/mL,
// progesterone negative), the ovary (a few follicles, one dominant, the Graafian follicle, ovulation on day 14, the
// corpus luteum, the corpus albicans), estradiol and progesterone, and the endometrium (menstrual days 1-5,
// proliferative 5-14 with straight glands, secretory 15-28 with coiled glands; spiral arteries constrict as progesterone
// drops). A pregnancy toggle keeps the corpus luteum (the placenta's hormone), progesterone and the lining: no menses.
// Curves are relative levels drawn to the slides' shapes, not data; the only number is the slides' 200 pg/mL.
import { makeFig, f1, T, L, HOT } from "./shared.mjs";

const W = 600, H = 562;
/* relative levels (0-1) at key days; a monotone curve through them, so nothing overshoots */
const K = {
  FSH: [[0.5, .5], [2, .6], [4, .62], [6, .54], [8, .44], [10, .34], [12, .27], [13.5, .24], [15, .23], [18, .2], [22, .18], [25, .2], [27, .33], [28.5, .46]],
  LH: [[0.5, .3], [4, .3], [8, .3], [11, .32], [12, .45], [12.7, .78], [13.2, 1], [13.7, .82], [14.3, .48], [15.2, .3], [18, .27], [22, .26], [25, .26], [27, .28], [28.5, .3]],
  E2: [[0.5, .12], [3, .13], [5, .17], [7, .27], [9, .43], [10.5, .6], [11.5, .8], [12.3, .92], [13, .8], [13.6, .52], [14.4, .3], [15.5, .3], [17, .38], [19, .5], [21, .56], [23, .5], [25, .36], [26.8, .18], [28.5, .12]],
  P4: [[0.5, .05], [12, .05], [13.5, .07], [14.5, .12], [16, .32], [18, .6], [20, .82], [21.5, .88], [23, .82], [24.5, .64], [26, .36], [27.3, .12], [28.5, .05]],
  TF: [[0.5, 62], [1.5, 46], [2.5, 28], [3.5, 14], [4.5, 8], [5.5, 9], [7, 15], [9, 23], [11, 32], [13, 40], [14.5, 46], [16, 53], [18, 62], [20, 70], [22, 76], [24, 80], [25.5, 79], [27, 72], [28.5, 64]],
};
/* with pregnancy the curves part from about day 22, where the corpus luteum would otherwise start to regress */
const TAIL = { FSH: [[24, .17], [26, .16], [28.5, .15]], LH: [[25, .22], [28.5, .2]], E2: [[24, .6], [26, .64], [28.5, .68]], P4: [[23, .9], [25, .94], [28.5, .97]], TF: [[24, 80], [26, 81], [28.5, 82]] };
const KP = {}; for (const k in K) KP[k] = K[k].filter((p) => p[0] <= 22).concat(TAIL[k]);
const THR = 0.78;

function cyX(d) { return 20 + (d - 0.5) * 20; }
function cyMono(P, x) {
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
/* a curve as a path from day a to day b, in a row from y1 (level 0) up hh */
function cyPath(P, a, b, y1, hh) { var o = "", x; for (x = a; x <= b + 1e-6; x += 0.2) o += (o ? "L" : "M") + f1(cyX(x)) + " " + f1(y1 - cyMono(P, x) * hh); if (b - Math.floor((b - a) / 0.2) * 0.2 - a > 1e-6) o += "L" + f1(cyX(b)) + " " + f1(y1 - cyMono(P, b) * hh); return o; }
function cyPolar(cx, cy, fn, n) { var o = "", i; for (i = 0; i <= n; i++) { var a = i / n * 2 * Math.PI, r = fn(a); o += (i ? "L" : "M") + f1(cx + r * Math.cos(a)) + " " + f1(cy + r * Math.sin(a)); } return o + "Z"; }
/* a growing follicle in miniature: theca, granulosa, an antrum with a cumulus mound, the oocyte */
function cyFol(x, y, r, af) {
  var o = '<circle class="cy-te" cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(r + 3) + '"/><circle class="cy-gr" cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(r) + '"/>', tc = 2.3;
  if (af > 0) o += '<path class="cy-ant" d="' + cyPolar(x, y, function (a) { var d = Math.atan2(Math.sin(a - tc), Math.cos(a - tc)); return r * af * (1 - 0.45 * Math.exp(-d * d / 0.25)); }, 40) + '"/>';
  var oc = af > 0 ? [x + Math.cos(tc) * r * 0.55, y + Math.sin(tc) * r * 0.55] : [x, y], orr = Math.max(2.6, r * (af > 0 ? 0.24 : 0.42));
  return o + '<circle class="cy-zp" cx="' + f1(oc[0]) + '" cy="' + f1(oc[1]) + '" r="' + f1(orr + 1.2) + '"/><circle class="cy-oo" cx="' + f1(oc[0]) + '" cy="' + f1(oc[1]) + '" r="' + f1(orr) + '"/>';
}
function cyCL(x, y, r) {
  return '<path class="cy-cl" d="' + cyPolar(x, y, function (a) { return r * (1 + 0.06 * Math.sin(6 * a) + 0.03 * Math.sin(11 * a + 1)); }, 60) + '"/><path class="cy-clin" d="' + cyPolar(x, y, function (a) { return r * (0.5 + 0.14 * Math.sin(7 * a + 0.4)); }, 60) + '"/>';
}
function cyCA(x, y, r) {
  return '<path class="cy-ca" d="' + cyPolar(x, y, function (a) { return r * (1 + 0.12 * Math.sin(5 * a) + 0.07 * Math.sin(9 * a + 2)); }, 50) + '"/><path class="cy-col" d="' + cyPolar(x, y, function (a) { return r * 0.55 * (1 + 0.12 * Math.sin(5 * a + 0.5)); }, 40) + '"/>';
}
/* which part of the cycle a day is in */
function cyPhase(d, preg) {
  return { ov: d <= 13 ? "follicular" : d === 14 ? "ovulation" : "luteal", ut: d <= 4 ? "menstrual" : d === 5 ? "menstrual→proliferative" : d <= 14 ? "proliferative" : "secretory",
    fb: d <= 11 ? "negE" : d <= 13 ? "pos" : d === 14 ? "ov" : (!preg && d >= 26) ? "fade" : "negP",
    st: d <= 4 ? 0 : d <= 8 ? 1 : d <= 13 ? 2 : d === 14 ? 3 : d <= 19 ? 4 : d <= 24 ? 5 : 6 };
}

function cyRender(st, D) {
  var d = Math.max(1, Math.min(28, Math.round(st.d))), preg = !!st.preg, ph = D.cyPhase(d, preg), o = "", i, x;
  st.d = d;
  var C = preg ? D.KP : D.K, P0 = 128, PH = 76, H1 = 354, HH = 72, BA0 = 452, MY0 = 466, MY1 = 482, OVS = 184, XL = cyX(0.5), XR = cyX(28.5);
  function band(a, b, y0, h, txt, on, info, key) { return HOT(info, '<rect class="cy-band' + (on ? " is-on" : "") + '" x="' + f1(cyX(a)) + '" y="' + y0 + '" width="' + f1(cyX(b) - cyX(a)) + '" height="' + h + '" rx="4"/>' + (txt ? T((cyX(a) + cyX(b)) / 2, y0 + h - 5, txt, "cy-bt" + (on ? " b" : ""), "middle") : "")); }
  o += T(XL, 12, "OVARIAN PHASES · L16 COUNTS DAYS 0-14, 14-28", "cy-h", "start") + '<g transform="translate(0 14)">';
  /* ---- the day cursor, under everything ---- */
  o += '<rect class="cy-cur" x="' + f1(cyX(d) - 10) + '" y="26" width="20" height="496"/>';
  o += '<path class="cy-ovl" d="M' + cyX(14) + " 26V522" + '"/>';
  /* ---- ovarian phases (top) ---- */
  o += band(0.5, 13.5, 6, 18, "follicular phase", ph.ov === "follicular", "Follicular phase, days 0 to 14 on Dr. Madison's slide (also called proliferative): it precedes ovulation, involves the development of the ovarian follicle, and is dominated by estrogen.");
  o += band(13.5, 14.5, 6, 18, "", ph.ov === "ovulation", "Midcycle: about day 14 of a 28-day cycle, which is 14 days before menses. Ovulation, the release of the mature ovum, 24 to 36 hours after the LH surge.");
  o += T(cyX(14), 20, "★", "cy-star", "middle");
  o += band(14.5, 28.5, 6, 18, "luteal phase", ph.ov === "luteal", "Luteal phase, days 14 to 28 (also called secretory): it follows ovulation, is driven by the corpus luteum, and is dominated by progesterone.");
  /* ---- pituitary: FSH and LH ---- */
  o += T(XL, 44, "PITUITARY · FSH AND LH", "cy-h", "start") + T(XR, 44, "relative levels", "cy-h cy-hr", "end");
  o += '<path class="cy-axis" d="M' + XL + " " + P0 + "H" + XR + '"/>';
  function curve(P, cls, y1, hh, info) { var full = cyPath(P, 0.5, 28.5, y1, hh); return HOT(info, '<path class="cy-hit" d="' + full + '"/><path class="cy-fut ' + cls + '" d="' + full + '"/><path class="cy-now ' + cls + '" d="' + cyPath(P, 0.5, d, y1, hh) + '"/><circle class="cy-dot ' + cls + '" cx="' + f1(cyX(d)) + '" cy="' + f1(y1 - cyMono(P, d) * hh) + '" r="4"/>'); }
  o += curve(C.FSH, "cy-fsh", P0, PH, "FSH: stimulates granulosa cell development and their estrogen synthesis (aromatase). Estradiol's negative feedback holds it down in the follicular phase, inhibin suppresses it at midcycle, and progesterone holds it down in the luteal phase.");
  o += curve(C.LH, "cy-lh", P0, PH, "LH: fairly steady across the cycle, then a dramatic surge just before ovulation, set off by estradiol's positive feedback. The surge restarts meiosis and causes follicular rupture 24 to 36 hours later. LH also drives the theca cells' testosterone.");
  o += T(cyX(2.6), P0 - cyMono(C.FSH, 2.6) * PH - 7, "FSH", "cy-lab cy-fsh-t", "middle");
  o += T(cyX(7), P0 - cyMono(C.LH, 7) * PH + 15, "LH", "cy-lab cy-lh-t", "middle");
  o += T(cyX(13.2) + 15, P0 - PH + 12, "LH surge", "cy-lab cy-lh-t", "start");
  var inh = d >= 11 && d <= 14;
  o += HOT("Inhibin, made by the granulosa cells, suppresses FSH (not LH). Dr. Madison's midcycle slide: FSH is suppressed by production of inhibin while LH surges, which is why the granulosa cells add LH receptors at midcycle.", T(cyX(13.4), P0 - 4, "inhibin ⊣ FSH", "cy-note" + (inh ? " is-on" : ""), "end"));
  if (ph.fb === "pos") o += T(cyX(12.5) - 6, P0 - PH + 12, "positive feedback", "cy-note is-on", "end") + T(cyX(12.5) - 6, P0 - PH + 26, "estradiol > 200 pg/mL", "cy-note is-on", "end");
  /* ---- feedback strip ---- */
  function seg(a, b, cls, txt, on, info, sh) { var mx = (cyX(a) + cyX(b)) / 2, k = "cy-fbt" + (on ? " b" : ""); return HOT(info, '<rect class="cy-fb ' + cls + (on ? " is-on" : "") + '" x="' + f1(cyX(a) + 1) + '" y="136" width="' + f1(cyX(b) - cyX(a) - 2) + '" height="18" rx="9"/>' + (txt ? (sh ? T(mx, 149, txt, k + " cy-lg", "middle") + T(mx, 149, sh, k + " cy-sh", "middle") : T(mx, 149, txt, k, "middle")) : "")); }
  o += seg(0.5, 11.5, "cy-neg", "− estradiol: negative feedback", ph.fb === "negE", "Negative feedback, most of the follicular phase: GnRH stimulates FSH and LH, they stimulate estradiol from the follicular cells, and estradiol feeds back negatively on GnRH, LH and FSH.", "− estradiol");
  o += seg(11.5, 13.5, "cy-pos", "+", ph.fb === "pos", "Positive feedback, midcycle: plasma estradiol reaches a critical level (above 200 pg/mL), which progressively sensitizes the pituitary to GnRH, so a surge of LH follows. Positive feedback is what makes the female axis cyclical; the male has none and is acyclical.");
  o += seg(13.5, 14.5, "cy-ovs", "", ph.fb === "ov", "About day 14 of a 28-day cycle: the dominant follicle ruptures and releases the oocyte.");
  o += seg(14.5, preg ? 28.5 : 25.5, "cy-neg", "− progesterone: negative feedback", ph.fb === "negP", "Negative feedback, luteal phase: GnRH stimulates FSH and LH, they stimulate progesterone secretion, and progesterone feeds back negatively on GnRH, LH and FSH. Progesterone gives negative feedback only.", "− progesterone");
  if (!preg) o += seg(25.5, 28.5, "cy-neg cy-fade", "falling", ph.fb === "fade", "The corpus luteum regresses, so progesterone and estrogen fall and their brake on the pituitary fades.");
  /* ---- ovary ---- */
  o += T(XL, 172, "OVARY", "cy-h", "start");
  var bx = cyX(10.6), rx = cyX(14), sT = function (xx) { return OVS - 8 * Math.exp(-Math.pow((xx - bx) / 26, 2)); };
  var ov = "M" + XL + " " + f1(sT(XL));
  for (x = XL; x <= XR; x += 4) ov += "L" + f1(x) + " " + f1(sT(x));
  o += HOT("The ovary's cortex, which holds the follicles, under its surface.", '<path class="cy-ovary" d="' + ov + "L" + XR + " 236Q" + XR + " 240 " + (XR - 4) + " 240H" + (XL + 4) + "Q" + XL + " 240 " + XL + ' 236Z"/>');
  var S = [
    [cyX(2.6), "a few follicles", "Each cycle a few follicles enter the next stage: fluid and hormones collect in an antrum (stage 2). FSH drives their granulosa cells; about 12 start each month.", "a few"],
    [cyX(6.6), "dominant", "One follicle becomes dominant; the rest become atretic. Its theca cells (LH) make testosterone and its granulosa cells (FSH, aromatase) turn it into estradiol."],
    [cyX(10.6), "Graafian", "The dominant Graafian follicle grows to bulge on the ovary's surface, makes estradiol above 200 pg/mL, and before ovulation has a high expression of LH receptors. Its granulosa cells add LH receptors at midcycle."],
    [cyX(14), "ovulation", "About day 14 of a 28-day cycle: collagenases weaken the follicle wall and prostaglandins raise blood flow; it ruptures 24 to 36 hours after the LH surge and releases the oocyte (meiosis I just completed) toward the fallopian tube."],
    [cyX(17.8), "", "The ruptured follicle becomes the corpus luteum: mostly granulosa cells (granulosa-lutein: progesterone and estrogen) with some theca cells (theca-lutein: progesterone)."],
    [cyX(22.2), "corpus luteum", "The corpus luteum secretes the steroid hormones needed for implantation and for maintaining a zygote, mainly progesterone."],
    [cyX(26.6), preg ? "kept" : "corpus albicans", preg ? "Pregnancy: a hormone from the placenta helps maintain the corpus luteum (later the placenta takes over hormone production)." : "No fertilization: the corpus luteum regresses over 14 days into a scar, the corpus albicans (fibroblasts fill it with collagen).", preg ? "kept" : "albicans"],
  ];
  for (i = 0; i < S.length; i++) {
    var sx = S[i][0], on = ph.st === i || (i === 4 && ph.st === 5) || (i === 5 && ph.st === 4), g = "";
    if (i === 0) g = cyFol(sx - 13, 214, 8, 0.4) + cyFol(sx + 1, 204, 10, 0.45) + cyFol(sx + 14, 220, 7, 0.35);
    else if (i === 1) g = '<g opacity=".55">' + cyFol(sx - 18, 224, 6, 0) + "</g>" + cyFol(sx + 3, 210, 17, 0.62);
    else if (i === 2) g = cyFol(sx, sT(sx) + 28, 25, 0.76);
    else if (i === 3) g = cyFol(rx, 212, 21, 0.7) + '<path class="cy-tear" d="M' + f1(rx - 6) + " 194L" + f1(rx - 9) + " 182H" + f1(rx + 9) + "L" + f1(rx + 6) + ' 194Z"/><circle class="cy-cor" cx="' + f1(rx + 12) + '" cy="170" r="7.4"/><circle class="cy-zp" cx="' + f1(rx + 12) + '" cy="170" r="5"/><circle class="cy-oo" cx="' + f1(rx + 12) + '" cy="170" r="3.8"/>';
    else if (i === 4) g = cyCL(sx, 210, 18);
    else if (i === 5) g = cyCL(sx, 210, 24);
    else g = preg ? cyCL(sx, 210, 25) : '<g opacity=".7">' + cyCA(sx, 212, 13) + "</g>";
    o += HOT(S[i][2], '<g class="cy-st' + (ph.st === i ? " is-on" : "") + '">' + g + "</g>");
    if (S[i][1]) { var lx2 = i === 5 ? (S[4][0] + sx) / 2 : sx, sh2 = S[i][3] || S[i][1]; o += T(lx2, 254, S[i][1], "cy-sl" + (on ? " b" : "") + (sh2 !== S[i][1] ? " cy-lg" : ""), "middle") + (sh2 !== S[i][1] ? T(lx2, 254, sh2, "cy-sl cy-sh" + (on ? " b" : ""), "middle") : ""); }
  }
  /* ---- ovarian hormones ---- */
  o += T(XL, 272, "OVARIAN HORMONES · ESTRADIOL, PROGESTERONE", "cy-h", "start");
  o += '<path class="cy-axis" d="M' + XL + " " + H1 + "H" + XR + '"/>';
  o += HOT("The critical level from Dr. Madison's midcycle slide: plasma estradiol above 200 pg/mL switches its feedback from negative to positive.", '<path class="cy-hit" d="M' + XL + " " + f1(H1 - D.THR * HH) + "H" + XR + '"/><path class="cy-thr" d="M' + XL + " " + f1(H1 - D.THR * HH) + "H" + XR + '"/>' + T(XL + 2, H1 - D.THR * HH - 4, "200 pg/mL", "cy-thrt", "start"));
  o += curve(C.E2, "cy-e2", H1, HH, "Estradiol (17β-estradiol, the main estrogen from the ovary): rises markedly through the follicular phase as the follicle grows, crosses 200 pg/mL just before the LH surge, and falls abruptly with progesterone at the end of the luteal phase. The corpus luteum's granulosa-lutein cells also make estrogen.");
  o += curve(C.P4, "cy-p4", H1, HH, "Progesterone: low in the follicular phase; it increases markedly in the luteal phase, made by the corpus luteum, and falls abruptly as the corpus luteum regresses: that abrupt loss prompts menses.");
  o += T(cyX(8.6), H1 - cyMono(C.E2, 8.6) * HH - 9, "estradiol", "cy-lab cy-e2-t", "end");
  o += T(cyX(21.5), H1 - 0.88 * HH - 6, "progesterone", "cy-lab cy-p4-t", "middle");
  /* ---- endometrium ---- */
  o += T(XL, 374, "ENDOMETRIUM", "cy-h", "start");
  var TF = C.TF, top = function (xx) { return BA0 - cyMono(TF, xx); };
  var my = '<rect class="cy-myo" x="' + XL + '" y="' + MY0 + '" width="' + (XR - XL) + '" height="' + (MY1 - MY0) + '" rx="3"/>';
  for (x = XL + 6; x < XR - 4; x += 11) my += '<ellipse class="cy-mn" cx="' + f1(x) + '" cy="' + f1(MY0 + 5 + (x % 3) * 3) + '" rx="4" ry="1.1"/>';
  o += HOT("Myometrium: smooth muscle (inner longitudinal, middle circular with the stratum vasculare, outer longitudinal). Estrogen contracts it; progesterone relaxes it.", my);
  o += HOT("Stratum basalis: the deep, narrow layer next to the myometrium. It stays at menstruation, and its glands and connective tissue proliferate to rebuild the functionalis.", '<rect class="cy-bas" x="' + XL + '" y="' + BA0 + '" width="' + (XR - XL) + '" height="' + (MY0 - BA0) + '"/>');
  var fp = "M" + XL + " " + BA0;
  for (x = 0.5; x <= 28.5 + 1e-6; x += 0.25) { var rag = x < 4.8 ? (Math.sin(x * 9.1) * 2.6 + Math.sin(x * 23.7) * 1.6) * (4.8 - x) / 4.3 : 0; fp += "L" + f1(cyX(x)) + " " + f1(top(x) + rag); }
  o += HOT("Stratum functionalis: superficial, vascularized by many helical (spiral) arteries; it undergoes extreme changes through the cycle and is shed at menstruation. Simple columnar epithelium covers it.", '<path class="cy-fun" d="' + fp + "L" + XR + " " + BA0 + 'Z"/>');
  if (!preg) for (i = 0; i < 3; i++) { var a0 = 25.5 + i, sp = "M" + f1(cyX(a0)) + " " + BA0; for (x = a0; x <= a0 + 1 + 1e-6; x += 0.25) sp += "L" + f1(cyX(x)) + " " + f1(top(x)); o += '<path class="cy-isch" opacity="' + (0.18 + i * 0.16) + '" d="' + sp + "L" + f1(cyX(a0 + 1)) + " " + BA0 + 'Z"/>'; }
  /* glands: straight while the functionalis regrows, coiled and secreting in the secretory phase */
  var gl = ["", "", ""];
  for (i = 1; i <= 28; i++) {
    var gx = cyX(i) + 4, yb = BA0 + 9, yt = top(i) + (i <= 4 ? 7 : 3), sec = i >= 15, amp = sec ? Math.min(3.2, (i - 14) * 0.6) : 0.4, pth = "";
    for (var yy = yb; yy >= yt - 1e-6; yy -= 1.5) pth += (pth ? "L" : "M") + f1(gx + amp * Math.sin((yb - yy) / 11 * 2 * Math.PI)) + " " + f1(yy);
    var w = sec ? 5.6 : 4.2, gi = i <= 4 ? 0 : sec ? 2 : 1;
    gl[gi] += '<path class="cy-gw" stroke-width="' + w + '" d="' + pth + '"/><path class="cy-gl" stroke-width="' + f1(w - 2.6) + '" d="' + pth + '"/>';
    if (i >= 17) for (yy = yb - 4; yy > yt + 3; yy -= 9) gl[gi] += '<circle class="cy-sec" cx="' + f1(gx + amp * Math.sin((yb - yy) / 11 * 2 * Math.PI)) + '" cy="' + f1(yy) + '" r="1.1"/>';
  }
  o += HOT("Glands in the basalis: only the deep parts of the glands remain while the functionalis is shed (menstrual phase, days 1 to 5).", gl[0]);
  o += HOT("Proliferative phase (days 5 to 14): estrogen grows the endometrium; the basalis rebuilds the functionalis, its glands straight.", gl[1]);
  o += HOT("Secretory phase (days 15 to 28): progesterone slows proliferation and increases secretions and vasculature; the functionalis is thick, its glands coiled and full of secretion.", gl[2]);
  /* spiral arteries, constricting as progesterone drops */
  var ar = "", arc = "";
  for (var a1 = 2.5; a1 <= 27.5; a1 += 3) {
    var ax = cyX(a1) - 2, yt2 = BA0 - cyMono(TF, a1) * (a1 < 5 ? 0.95 : 0.72), pa = "";
    for (yy = MY0 + 4; yy >= yt2; yy -= 1.2) pa += (pa ? "L" : "M") + f1(ax + 2.6 * Math.sin((MY0 - yy) / 7 * 2 * Math.PI)) + " " + f1(yy);
    if (!preg && a1 >= 25) arc += '<path class="cy-art cy-con" d="' + pa + '"/>'; else ar += '<path class="cy-art" d="' + pa + '"/>';
  }
  o += HOT("Spiral (helical) arteries of the functionalis. Estrogen lengthens the endometrial arteries; progesterone increases the vasculature.", ar);
  if (arc) o += HOT("The drop in progesterone causes constriction of the spiral arteries, leading to local ischemia in the functional layer and its separation from the basal layer (Dr. Herr's starred point).", arc);
  /* menses: the shed functionalis and blood; day 28, the start of separation */
  var bl = "";
  for (i = 0; i < 11; i++) { var bd = 0.8 + i * 0.36, by = top(bd) - 3 - (i % 3) * 5; bl += '<path class="cy-blood" d="M' + f1(cyX(bd)) + " " + f1(by - 3.5) + "Q" + f1(cyX(bd) + 2.6) + " " + f1(by + 0.5) + " " + f1(cyX(bd)) + " " + f1(by + 1.6) + "Q" + f1(cyX(bd) - 2.6) + " " + f1(by + 0.5) + " " + f1(cyX(bd)) + " " + f1(by - 3.5) + 'Z"/>'; }
  o += HOT("Menstrual phase, days 1 to 5: the functionalis is shed with blood; the basalis stays.", bl + '<path class="cy-frag" d="M' + f1(cyX(1.2)) + " " + f1(top(1.2) - 14) + "q6 -5 13 -1q4 4 -2 6q-7 2 -11 -5Z" + "M" + f1(cyX(2.3)) + " " + f1(top(2.3) - 12) + 'q5 -3 9 0q2 4 -3 4q-5 0 -6 -4Z"/>');
  if (!preg) o += HOT("Day 28, without fertilization: estrogen and progesterone fall abruptly, the ischemic functionalis separates from the basalis, and the lining and blood are sloughed off: menses.", '<path class="cy-sep" d="M' + f1(cyX(26.6)) + " " + (BA0 - 1) + "H" + f1(cyX(28.5)) + '"/>');
  o += T(cyX(11.6), top(11.6) - 7, "straight glands", "cy-sl", "middle");
  o += T(cyX(18.6), top(18.6) - 7, "coiled glands", "cy-sl", "middle");
  o += T(cyX(3.0), 404, "functionalis shed", "cy-sl cy-lg", "start");
  o += '<g class="cy-lg">' + L(cyX(8.3), top(7.5) - 18, "spiral artery", cyX(8.5) - 1, BA0 - 7, "end", "cy-sl") + "</g>";
  o += T(cyX(20.6), BA0 - 30, "stratum functionalis", "cy-in", "middle");
  o += T(cyX(20.8), BA0 + 10.5, "stratum basalis", "cy-in cy-in-s", "middle");
  o += T(cyX(20.8), MY1 - 4.5, "myometrium", "cy-in cy-in-s", "middle");
  if (!preg) o += T(XR, 367, "arteries constrict", "cy-sl" + (d >= 25 ? " b" : ""), "end");
  else o += T(XR, 367, "kept: no menses", "cy-sl" + (d >= 23 ? " b" : ""), "end");
  o += "</g>";
  /* ---- uterine phases (bottom) and the day axis ---- */
  o += T(XL, 510, "UTERINE PHASES · L14 COUNTS DAYS 1-5, 5-14, 15-28", "cy-h", "start");
  o += band(0.5, 5, 516, 18, "menstrual", ph.ut.indexOf("menstrual") === 0, "Menstrual phase, days 1 to 5: the functionalis is shed; the basalis stays.");
  o += band(5, 14.5, 516, 18, "proliferative", ph.ut === "proliferative" || ph.ut === "menstrual→proliferative", "Proliferative (or follicular) phase, days 5 to 14: estrogen from the growing follicles; the basalis rebuilds the functionalis.");
  o += band(14.5, 28.5, 516, 18, "secretory", ph.ut === "secretory", "Secretory (or luteal) phase, days 15 to 28: progesterone from the corpus luteum; a thick functionalis whose glands secrete.");
  var ax2 = '<path class="cy-axis" d="M' + XL + " 537H" + XR;
  for (i = 1; i <= 28; i++) ax2 += "M" + cyX(i) + " 537V" + (i === 1 || i === 5 || i === 14 || i === 28 ? 543 : 540);
  o += ax2 + '"/>';
  [1, 5, 14, 28].forEach(function (k) { if (k === d || Math.abs(k - d) > 1) o += T(cyX(k), 556, String(k), "cy-dn" + (k === d ? " b" : ""), "middle"); });
  if ([1, 5, 14, 28].indexOf(d) < 0) o += T(cyX(d), 556, String(d), "cy-dn b", "middle");
  return o;
}
function cySay(st, D) {
  var d = st.d, preg = !!st.preg, ph = D.cyPhase(d, preg), s;
  if (d <= 4) s = "Menstrual phase: the functionalis is shed with blood while the basalis stays. In the ovary a few follicles start to grow, under FSH; estradiol is still low and gives negative feedback.";
  else if (d === 5) s = "Menstruation ends and the proliferative phase begins: the basalis starts to rebuild the functionalis, driven by estrogen from the growing follicles.";
  else if (d <= 10) s = "Follicular (proliferative) phase: one follicle becomes dominant and makes estradiol (theca cells, LH: testosterone; granulosa cells, FSH: aromatase). Estradiol grows the endometrium and lengthens its arteries, the glands are straight, cervical mucus turns watery, and its negative feedback holds FSH and LH down.";
  else if (d === 11) s = "Late follicular phase: the Graafian follicle's estradiol climbs toward the critical level of 200 pg/mL; until then its feedback is still negative.";
  else if (d <= 13) s = "Midcycle: estradiol is above 200 pg/mL, so its feedback turns positive: the pituitary, sensitized to GnRH, releases the LH surge. Inhibin holds FSH down, so the granulosa cells add LH receptors. The surge restarts meiosis and raises collagenases and prostaglandins in the follicle.";
  else if (d === 14) s = "About day 14 of a 28-day cycle, 14 days before menses: the weakened dominant follicle ruptures, 24 to 36 hours after the LH surge, and releases the oocyte (meiosis I just completed) toward the fallopian tube.";
  else if (d <= 19) s = "Luteal (secretory) phase: the ruptured follicle becomes the corpus luteum, mostly granulosa cells with some theca cells. Progesterone rises and gives negative feedback on GnRH, LH and FSH; the glands start to coil and secrete.";
  else if (d <= 22 || preg && d <= 24) s = "Mid-luteal phase, dominated by progesterone: proliferation slows, secretions and vasculature increase, cervical mucus is thick, and the functionalis is near its thickest, with coiled glands full of secretion.";
  else if (preg) s = "Pregnancy: a hormone from the placenta keeps the corpus luteum, so progesterone and estrogen stay up, FSH and LH stay down, and the secretory lining is kept. Day 28 brings no menses: pregnancy is a cause of secondary amenorrhea. The placenta later takes over hormone production.";
  else if (d <= 27) s = "Late luteal phase, no fertilization: the corpus luteum regresses (over 14 days in all), progesterone and estrogen fall, and the drop in progesterone constricts the spiral arteries, making the functionalis ischemic.";
  else s = "Day 28, no fertilization: the regression of the corpus luteum brings an abrupt loss of estrogen and progesterone, the functionalis separates from the basalis, and the lining and blood are sloughed off: menses, day 1 of the next cycle.";
  if (preg && d < 23) s += " (With pregnancy the cycle looks the same until the late luteal days.)";
  var ut = ph.ut === "menstrual→proliferative" ? "menstrual → proliferative" : ph.ut;
  return ["Day " + d + " · " + (ph.ov === "ovulation" ? "midcycle (ovulation)" : ph.ov + " phase") + " · " + ut + " phase. " + s, "day " + d + " · " + (ph.ov === "ovulation" ? "ovulation" : ph.ov + ", " + (d === 5 ? "proliferative" : ph.ut))];
}

export default function cycle() {
  return makeFig({ id: "cycle", lec: "fphys", fig: "Fig 8", short: "The 28-day cycle", hint: "drag the day · hover",
    title: "The 28-day cycle, three views at once",
    caption: "Drag the day (or press Play) and watch the pituitary hormones, the feedback state, the ovary, the ovarian hormones and the endometrium move together. Turn on Pregnancy to see what changes when the corpus luteum is kept.",
    W, H, label: "A 28-day menstrual cycle on one time axis: FSH and LH, the feedback state, the ovary's follicle and corpus luteum, estradiol and progesterone with the 200 pg/mL line, and the endometrium's phases, with a cursor on the chosen day.",
    D: { INIT: { d: 1, preg: false }, STEPKEY: "d", STEPMAX: 28, PLAYMS: 650, K, KP, THR }, render: cyRender, say: cySay,
    helpers: [cyX, cyMono, cyPath, cyPolar, cyFol, cyCL, cyCA, cyPhase],
    controls: `<div class="am-controls"><label class="am-slider"><span>day 1</span><input type="range" min="1" max="28" step="1" value="1" data-amk="d" aria-label="Day of the cycle"><span>28</span></label><button type="button" class="am-btn" data-amplay aria-pressed="false">Play</button></div>
<div class="am-controls"><button type="button" class="am-btn" data-amstep="-1">Back a day</button><button type="button" class="am-btn" data-amstep="1">Next day</button><button type="button" class="am-btn" data-amt="preg" aria-pressed="false">Pregnancy</button></div>`,
    sources: [
      "From the L16 notes and slides (Dr. Madison): the three parts of a typical 28-day cycle (follicular about 14 days, midcycle 14 days before menses, luteal about 14 days); LH fairly steady, then the surge; estradiol's negative feedback, the switch to positive feedback above 200 pg/mL, inhibin suppressing FSH at midcycle, progesterone's negative feedback; ovulation 24 to 36 hours after the surge on day 14; the corpus luteum regressing over 14 days into the corpus albicans; menses on day 28 from the abrupt loss of estrogen and progesterone; what estrogen and progesterone do to the endometrium. From the L14 notes and slides (Dr. Herr): menstrual days 1-5, proliferative 5-14, secretory 15-28; the functionalis and basalis; straight glands, then coiled and secreting; the drop in progesterone constricting the spiral arteries; the placenta's hormone keeping the corpus luteum in pregnancy (the slides don't name it).",
      "Curves are qualitative, relative levels with no units: their shapes follow the slides (LH steady with one surge; estradiol rising to a peak just before it; progesterone high in the luteal phase) and the standard textbook cycle diagram, and only the slide's 200 pg/mL line is a number. Where the slide and textbooks differ, this follows the slide: many textbooks draw a smaller FSH peak alongside the LH surge, but the slide says FSH is suppressed by inhibin at midcycle, so FSH is drawn held down there. Inhibin has no curve, because the slides give no levels for it across the cycle.",
      "The FSH rise at the very end and start of the cycle, the small second estradiol rise from the corpus luteum, and where the pregnancy curves part (about day 22) are drawn from the standard diagram to make the cycle continuous; the slides give no levels for them. The ovary and endometrium are schematic, not to scale. Educational, not medical advice."],
    css: `
.anima[data-anima="cycle"] .am-svg{max-width:640px}
.anima .cycle-svg .cy-h{font:600 10.5px var(--anatomy-mono);letter-spacing:.06em;fill:var(--anatomy-muted)}
.anima .cycle-svg .cy-hr{font-weight:400;letter-spacing:0}
.anima .cycle-svg .cy-cur{fill:var(--accent);opacity:.1}
.anima .cycle-svg .cy-ovl{stroke:var(--anatomy-lo);stroke-width:1;stroke-dasharray:2 4}
.anima .cycle-svg .cy-band{fill:var(--anatomy-shade-1);stroke:var(--anatomy-lo);stroke-width:.8}
.anima .cycle-svg .cy-band.is-on{fill:var(--accent-soft);stroke:var(--accent)}
.anima .cycle-svg .cy-bt{font:11px var(--anatomy-mono);fill:var(--anatomy-text)}
.anima .cycle-svg .cy-bt.b{fill:var(--accent-ink)}
.anima .cycle-svg .cy-star{font:10px var(--anatomy-mono);fill:var(--accent)}
.anima .cycle-svg .cy-axis{fill:none;stroke:var(--anatomy-mid);stroke-width:1}
.anima .cycle-svg .cy-hit{fill:none;stroke:transparent;stroke-width:9;pointer-events:stroke}
.anima .cycle-svg .cy-fut{fill:none;stroke-width:1.6;opacity:.32}
.anima .cycle-svg .cy-now{fill:none;stroke-width:2.6;stroke-linejoin:round;stroke-linecap:round}
.anima .cycle-svg .cy-dot{stroke:var(--surface);stroke-width:1.6}
.anima .cycle-svg .cy-fsh{stroke:var(--bx-violet)} .anima .cycle-svg .cy-dot.cy-fsh{fill:var(--bx-violet)}
.anima .cycle-svg .cy-lh{stroke:var(--bx-blue)} .anima .cycle-svg .cy-dot.cy-lh{fill:var(--bx-blue)}
.anima .cycle-svg .cy-e2{stroke:var(--bx-memb)} .anima .cycle-svg .cy-dot.cy-e2{fill:var(--bx-memb)}
.anima .cycle-svg .cy-p4{stroke:var(--bx-gold)} .anima .cycle-svg .cy-dot.cy-p4{fill:var(--bx-gold)}
.anima .cycle-svg .cy-lab{font:600 12px var(--anatomy-mono);paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round}
.anima .cycle-svg .cy-fsh-t{fill:var(--bx-violet)} .anima .cycle-svg .cy-lh-t{fill:var(--bx-blue)} .anima .cycle-svg .cy-e2-t{fill:var(--bx-memb)} .anima .cycle-svg .cy-p4-t{fill:var(--bx-gold)}
.anima .cycle-svg .cy-note{font:10.5px var(--anatomy-mono);fill:var(--anatomy-muted);paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round}
.anima .cycle-svg .cy-note.is-on{fill:var(--bx-inhib);font-weight:600}
.anima .cycle-svg .cy-fb{stroke-width:1}
.anima .cycle-svg .cy-neg{fill:var(--bx-blue-soft);stroke:var(--bx-blue)}
.anima .cycle-svg .cy-pos{fill:var(--bx-hot-soft);stroke:var(--bx-hot)}
.anima .cycle-svg .cy-ovs{fill:var(--anatomy-shade-1);stroke:var(--anatomy-lo)}
.anima .cycle-svg .cy-fb{opacity:.55}
.anima .cycle-svg .cy-fb.is-on{opacity:1;stroke-width:1.8}
.anima .cycle-svg .cy-fade{opacity:.3}
.anima .cycle-svg .cy-fade.is-on{opacity:.7}
.anima .cycle-svg .cy-fbt{font:10.5px var(--anatomy-mono);fill:var(--anatomy-text)}
.anima .cycle-svg .cy-ovary{fill:var(--bx-matrix);stroke:var(--bx-cyto-line);stroke-width:1}
.anima .cycle-svg .cy-te{fill:var(--bx-eosin)}
.anima .cycle-svg .cy-gr{fill:var(--bx-violet-soft);stroke:var(--bx-violet);stroke-width:.8}
.anima .cycle-svg .cy-ant{fill:var(--bx-lumen);stroke:var(--bx-violet);stroke-width:.6}
.anima .cycle-svg .cy-zp{fill:var(--bx-eosin)}
.anima .cycle-svg .cy-oo{fill:var(--bx-cyto);stroke:var(--bx-nuc);stroke-width:.7}
.anima .cycle-svg .cy-tear{fill:var(--bx-lumen)}
.anima .cycle-svg .cy-cor{fill:var(--bx-violet-soft);stroke:var(--bx-violet);stroke-width:.8;stroke-dasharray:1.6 1.2}
.anima .cycle-svg .cy-cl{fill:var(--bx-gold-soft);stroke:var(--bx-gold);stroke-width:2.2}
.anima .cycle-svg .cy-clin{fill:var(--bx-lumen);stroke:var(--bx-gold);stroke-width:.8}
.anima .cycle-svg .cy-ca{fill:var(--bx-fat);stroke:var(--bx-fat-line);stroke-width:1}
.anima .cycle-svg .cy-col{fill:none;stroke:var(--bx-fat-line);stroke-width:.8}
.anima .cycle-svg .cy-st{opacity:.45}
.anima .cycle-svg .cy-st.is-on{opacity:1}
.anima .cycle-svg .cy-sl{font:10.5px var(--anatomy-mono);fill:var(--anatomy-text);paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round}
.anima .cycle-svg .cy-sl.b{fill:var(--anatomy-strong);font-weight:700}
.anima .cycle-svg .cy-thr{fill:none;stroke:var(--bx-hot);stroke-width:1.2;stroke-dasharray:5 4}
.anima .cycle-svg .cy-thrt{font:600 10.5px var(--anatomy-mono);fill:var(--bx-hot);paint-order:stroke;stroke:var(--surface);stroke-width:3px}
.anima .cycle-svg .cy-myo{fill:var(--bx-eosin)}
.anima .cycle-svg .cy-mn{fill:var(--bx-nuc);opacity:.55}
.anima .cycle-svg .cy-bas{fill:var(--bx-cyto)}
.anima .cycle-svg .cy-fun{fill:var(--bx-matrix);stroke:var(--bx-violet);stroke-width:1.6}
.anima .cycle-svg .cy-isch{fill:var(--anatomy-mid)}
.anima .cycle-svg .cy-gw{fill:none;stroke:var(--bx-violet);stroke-linecap:round;stroke-linejoin:round;opacity:.85}
.anima .cycle-svg .cy-gl{fill:none;stroke:var(--bx-lumen);stroke-linecap:round;stroke-linejoin:round}
.anima .cycle-svg .cy-sec{fill:var(--bx-eosin)}
.anima .cycle-svg .cy-art{fill:none;stroke:var(--bx-blood);stroke-width:1.5;stroke-linecap:round;pointer-events:stroke}
.anima .cycle-svg .cy-art.cy-con{stroke-width:.8}
.anima .cycle-svg .cy-blood{fill:var(--bx-blood)}
.anima .cycle-svg .cy-frag{fill:var(--bx-matrix);stroke:var(--bx-blood);stroke-width:1}
.anima .cycle-svg .cy-sep{fill:none;stroke:var(--bx-blood);stroke-width:1.6;stroke-dasharray:3 2}
.anima .cycle-svg .cy-in{font:600 11px var(--anatomy-mono);fill:var(--anatomy-strong);paint-order:stroke;stroke:var(--bx-matrix);stroke-width:3px;stroke-linejoin:round}
.anima .cycle-svg .cy-in-s{font-size:10px;stroke:var(--bx-cyto)}
.anima .cycle-svg .cy-dn{font:11px var(--anatomy-mono);fill:var(--anatomy-muted)}
.anima .cycle-svg .cy-dn.b{fill:var(--accent-ink);font-weight:700}
.anima .cycle-svg .cy-bt,.anima .cycle-svg .cy-fbt,.anima .cycle-svg .cy-h,.anima .cycle-svg .cy-dn,.anima .cycle-svg .cy-star{stroke:none}
.anima .cycle-svg .cy-sh{display:none}
@media (max-width:560px){.anima .cycle-svg .cy-lg{display:none}.anima .cycle-svg .cy-sh{display:inline}}
@media (max-width:560px){.anima .cycle-svg .cy-h{font-size:12.5px}.anima .cycle-svg .cy-bt,.anima .cycle-svg .cy-sl,.anima .cycle-svg .cy-fbt,.anima .cycle-svg .cy-note,.anima .cycle-svg .cy-thrt,.anima .cycle-svg .cy-dn{font-size:12.5px}.anima .cycle-svg .cy-lab{font-size:14px}.anima .cycle-svg .cy-sl{font-size:11.5px}.anima .cycle-svg .cy-in{font-size:12.5px}.anima .cycle-svg .cy-in-s{font-size:11.5px}}
`,
  });
}
