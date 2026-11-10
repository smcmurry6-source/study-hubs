// Fig: the male HPG axis and what breaks it (L15 Male Reproductive Physiology, Dr. Madison: the hypothalamic-
// pituitary-testicular axis, the two-cell, two-gonadotropin model, making testosterone, reading a hormone pattern and
// the two disorders). A brain in sagittal section (front to the right) with the hypothalamus and the pituitary, a GnRH
// monitor that shows the pulses (or the flat line of continuous GnRH), and one loop of blood: LH and FSH run down it to
// a magnified piece of testis (Leydig cells, a seminiferous tubule with its Sertoli cells), testosterone and inhibin run
// back up it to the brakes on the hypothalamus and the pituitary, and testosterone branches off to its targets (the
// Wolffian ducts, the DHT tissues through 5-alpha-reductase, puberty). Pick a case: the broken part is marked, each
// hormone's flow speeds up or dies away, and a tag on each flow gives its arrow. Different from Exam 1's HPA figure on
// purpose: an anatomical brain and a loop of blood instead of stacked boxes, tags on the flows instead of gauges, and a
// pulse monitor. Levels are qualitative only (high, low, normal), and a value the lecture doesn't give says so.
import { makeFig, f1, T, L, HOT } from "./shared.mjs";

/* ---------- build-time geometry ---------- */
function sm(p) {
  /* closed smooth path through p (Catmull-Rom as cubic Beziers) */
  var n = p.length, d = "M" + f1(p[0][0]) + " " + f1(p[0][1]), i, a, b, c, e;
  for (i = 0; i < n; i++) { a = p[(i - 1 + n) % n]; b = p[i]; c = p[(i + 1) % n]; e = p[(i + 2) % n];
    d += "C" + f1(b[0] + (c[0] - a[0]) / 6) + " " + f1(b[1] + (c[1] - a[1]) / 6) + " " + f1(c[0] - (e[0] - b[0]) / 6) + " " + f1(c[1] - (e[1] - b[1]) / 6) + " " + f1(c[0]) + " " + f1(c[1]); }
  return d + "Z";
}
function rnd(p) { return p.map(function (q) { return [f1(q[0]), f1(q[1])]; }); }

const TC = [228, 448], TR = 68, TL = 20;
function onT(deg, r) { var a = deg * Math.PI / 180; return [TC[0] + r * Math.cos(a), TC[1] + r * Math.sin(a)]; }

function staticArt() {
  const o = {};
  /* brain in sagittal section, front to the right; cerebellum and brainstem behind and below */
  const brain = [[44, 100], [32, 70], [42, 40], [74, 18], [122, 8], [172, 12], [212, 30], [236, 60], [238, 90], [226, 110], [200, 116], [176, 112], [150, 114], [124, 118], [100, 114], [76, 110], [56, 108]];
  const stem = [[104, 112], [124, 114], [121, 140], [116, 172], [113, 198], [95, 198], [97, 170], [100, 140]];
  o.BRAIN = HOT("Brain in sagittal section, front to the right: the hypothalamus sits at its base, with the pituitary hanging below it on its stalk.",
    '<ellipse class="hg-cbl" cx="70" cy="121" rx="27" ry="14"/><path class="hg-gyr" d="M50 118C62 112 78 112 92 118M48 126C62 121 80 121 94 127"/>' +
    '<path class="hg-stem" d="' + sm(stem) + '"/>' +
    '<path class="hg-brain" d="' + sm(brain) + '"/>' +
    '<path class="hg-gyr" d="M58 62C82 40 112 46 132 30M150 62C170 44 196 50 214 40M64 90C92 74 124 86 152 72M170 92C190 80 210 90 228 78M112 22C118 36 116 50 126 62"/>');
  o.HYPO = '<ellipse class="hg-hyp" cx="148" cy="116" rx="17" ry="8"/>';
  o.STALK = '<path class="hg-stalk" d="M150 122C152 136 154 148 157 162"/>';
  o.PPIT = HOT("Posterior pituitary: not part of this axis.", '<circle class="hg-ppit" cx="146" cy="173" r="9"/>');
  o.APIT_D = '<ellipse class="hg-apit" cx="166" cy="175" rx="13.5" ry="11.5"/>';
  /* the testis panel: a seminiferous tubule in cross-section and Leydig cells in the connective tissue beside it */
  let tub = '<circle class="hg-wall" cx="' + TC[0] + '" cy="' + TC[1] + '" r="' + (TR + 4) + '"/><circle class="hg-epi" cx="' + TC[0] + '" cy="' + TC[1] + '" r="' + TR + '"/>';
  for (let i = 0; i < 6; i++) {
    const a = i * 60 + 15, p = [onT(a - 9, TR - 1), onT(a - 4, TR - 26), onT(a - 5, TL + 3), onT(a, TL - 1), onT(a + 5, TL + 3), onT(a + 4, TR - 26), onT(a + 9, TR - 1)];
    tub += '<path class="hg-sert" d="M' + rnd(p).map((q) => q.join(" ")).join("L") + 'Z"/>';
    const n = onT(a, TR - 13);
    tub += '<ellipse class="hg-snu" cx="' + f1(n[0]) + '" cy="' + f1(n[1]) + '" rx="3.2" ry="5.4" transform="rotate(' + (a + 90) + " " + f1(n[0]) + " " + f1(n[1]) + ')"/>';
  }
  let germ = "";
  for (let i = 0; i < 6; i++) {
    const a = i * 60 + 45, g = onT(a, TR - 7), p = onT(a, TR - 21), s1 = onT(a - 7, TL + 13), s2 = onT(a + 7, TL + 13), s3 = onT(a, TL + 8);
    germ += '<circle class="hg-gc" cx="' + f1(g[0]) + '" cy="' + f1(g[1]) + '" r="4.6"/><circle class="hg-gn" cx="' + f1(g[0]) + '" cy="' + f1(g[1]) + '" r="2.6"/>' +
      '<circle class="hg-gc" cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" r="6.6"/><circle class="hg-gn" cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" r="3.8"/>' +
      [s1, s2, s3].map((s) => '<circle class="hg-gc" cx="' + f1(s[0]) + '" cy="' + f1(s[1]) + '" r="3.2"/><circle class="hg-gn" cx="' + f1(s[0]) + '" cy="' + f1(s[1]) + '" r="1.6"/>').join("");
  }
  o.TUB = tub + '<circle class="hg-lum" cx="' + TC[0] + '" cy="' + TC[1] + '" r="' + TL + '"/>';
  o.GERM = germ;
  /* sperm in the lumen, heads at the epithelium's edge, tails into the lumen */
  o.SPERM = [0, 60, 120, 180, 240, 300].map(function (a) {
    const h = onT(a + 20, TL + 1), m = onT(a + 50, TL - 9), e = onT(a + 110, 6);
    return '<path class="hg-tail" d="M' + f1(h[0]) + " " + f1(h[1]) + "Q" + f1(m[0]) + " " + f1(m[1]) + " " + f1(e[0]) + " " + f1(e[1]) + '"/><ellipse class="hg-head" cx="' + f1(h[0]) + '" cy="' + f1(h[1]) + '" rx="3" ry="1.9" transform="rotate(' + (a + 20 + 90) + " " + f1(h[0]) + " " + f1(h[1]) + ')"/>';
  });
  const ley = [[102, 436], [126, 430], [114, 458]];
  o.LEY = ley.map(function (c, j) {
    const p = []; for (let k = 0; k < 7; k++) { const a = (k / 7) * Math.PI * 2 + j, r = 12 + ((k * 7 + j * 3) % 4) - 1.5; p.push([c[0] + r * Math.cos(a), c[1] + r * 0.88 * Math.sin(a)]); }
    return '<path class="hg-ley" d="' + sm(p) + '"/><circle class="hg-lnu" cx="' + f1(c[0] + 1) + '" cy="' + f1(c[1] - 1) + '" r="4"/>';
  }).join("");
  return o;
}

/* ---------- page helpers (serialized into the page) ---------- */
function hgPath(p) { var o = "", i; for (i = 0; i < p.length; i++) o += (i ? "L" : "M") + f1(p[i][0]) + " " + f1(p[i][1]); return o; }
/* hormone dots moving along a polyline; how many and how fast follow the level (u high, n normal, d low; ng none) */
function hgDots(p, lv, t, cls, r, ph) {
  if (lv !== "u" && lv !== "n" && lv !== "d") return "";
  var c = [0], Lt = 0, i, k, o = "";
  for (i = 1; i < p.length; i++) { Lt += Math.sqrt(Math.pow(p[i][0] - p[i - 1][0], 2) + Math.pow(p[i][1] - p[i - 1][1], 2)); c.push(Lt); }
  var gap = lv === "u" ? 24 : lv === "d" ? 96 : 44, sp = lv === "u" ? 0.07 : lv === "d" ? 0.032 : 0.05, n = Math.max(1, Math.round(Lt / gap));
  for (k = 0; k < n; k++) {
    var u = t ? ((t * sp / Lt + k / n + (ph || 0)) % 1) : ((k + 0.5) / n + (ph || 0)) % 1, s = u * Lt, j = 1;
    while (j < c.length - 1 && c[j] < s) j++;
    var f = (s - c[j - 1]) / ((c[j] - c[j - 1]) || 1), x = p[j - 1][0] + (p[j][0] - p[j - 1][0]) * f, y = p[j - 1][1] + (p[j][1] - p[j - 1][1]) * f;
    var op = Math.min(1, u / 0.05, (1 - u) / 0.05);
    o += '<circle class="' + cls + '" cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + r + '" opacity="' + f1(op) + '"/>';
  }
  return o;
}
/* a tag on a flow: the hormone's name over its arrow; ring > 0 marks a value that just changed */
function hgWord(v) { return { u: "↑ high", d: "↓ low", n: "= normal", ng: "? not given", ns: "? not on slides", mr: "= male range", pulse: "pulses", cont: "continuous" }[v] || v; }
function hgCW(name, v) { return Math.round(Math.max(name.length, hgWord(v).length) * 6.6 + 16); }
function hgChip(x, y, name, v, info, ring, ncls, end) {
  var s = hgWord(v), w = hgCW(name, v), x0 = end ? x - w : x;
  var cls = v === "u" ? "hg-up" : v === "d" ? "hg-dn" : (v === "ng" || v === "ns") ? "hg-q" : "hg-eq";
  var o = (ring > 0 ? '<rect class="hg-ring" x="' + f1(x0 - 3) + '" y="' + f1(y - 3) + '" width="' + (w + 6) + '" height="38" rx="10" opacity="' + f1(ring) + '"/>' : "") +
    '<rect class="hg-chip ' + cls + '" x="' + f1(x0) + '" y="' + f1(y) + '" width="' + w + '" height="32" rx="8"/>' +
    T(x0 + 8, y + 13, name, "hg-xs hg-nm " + (ncls || ""), "start") + T(x0 + 8, y + 26.5, s, "hg-xs hg-lv " + cls, "start");
  return HOT(info + " Here: " + ({ u: "high.", d: "low.", n: "normal.", ng: "the lecture doesn't give it for this case.", ns: "not on the slides.", mr: "in the male range.", pulse: "in pulses.", cont: "continuous." })[v], o);
}
/* the GnRH monitor's trace: pulses scroll left; continuous is a flat raised line */
function hgTrace(m, t, x0, x1, b) {
  var o = "", x, y, sc = t ? t * 0.03 : 0, P = 62, A = m === "u" ? 44 : m === "d" ? 13 : 32;
  for (x = x0; x <= x1; x += 2) {
    if (m === "cont") y = b - 24 - Math.sin((x + sc) / 9) * 0.8;
    else if (m === "ng") y = b;
    else { var q = (((x + sc) % P) + P) % P - P / 2; y = b - A * Math.exp(-(q * q) / 30); }
    o += (x === x0 ? "M" : "L") + f1(x) + " " + f1(y);
  }
  return o;
}
function hgMark(x, y, ok) {
  return ok ? '<circle class="hg-okc" cx="' + x + '" cy="' + y + '" r="7"/><path class="hg-okm" d="M' + (x - 3.4) + " " + y + "L" + (x - 0.8) + " " + (y + 2.8) + "L" + (x + 3.6) + " " + (y - 2.8) + '"/>'
    : '<circle class="hg-noc" cx="' + x + '" cy="' + y + '" r="7"/><path class="hg-nom" d="M' + (x - 3) + " " + (y - 3) + "L" + (x + 3) + " " + (y + 3) + "M" + (x + 3) + " " + (y - 3) + "L" + (x - 3) + " " + (y + 3) + '"/>';
}
/* an inhibition line ending in a bar, faint when the brake is weak */
function hgBrake(p, cls, lv) {
  var a = p[p.length - 2], b = p[p.length - 1], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), c = Math.cos(ang + Math.PI / 2) * 6, s = Math.sin(ang + Math.PI / 2) * 6;
  var k = lv === "u" ? " is-strong" : lv === "d" ? " is-weak" : (lv === "ng" || lv === "ns") ? " is-q" : "";
  return '<path class="' + cls + k + '" d="' + hgPath(p) + "M" + f1(b[0] - c) + " " + f1(b[1] - s) + "L" + f1(b[0] + c) + " " + f1(b[1] + s) + '"/>';
}

function hgRender(st, D) {
  var t = st.t || 0, S = D.SC[st.sc], lv = S.lv, fl = S.f, o = "";
  /* remember the last case per copy, so the tags that changed can flash */
  if (st._sc === undefined) { st._sc = st.sc; st._prev = st.sc; st._t0 = -9999; }
  if (st._sc !== st.sc) { st._prev = st._sc; st._sc = st.sc; st._t0 = t; }
  var age = t ? t - st._t0 : 9999, P = D.SC[st._prev].lv;
  function ring(k) { return age < 1400 && P[k] !== lv[k] ? 1 - age / 1400 : 0; }
  var dev = !!S.dev, axis = dev ? ' opacity=".42"' : "";

  /* ----- the axis: brain, hypothalamus, pituitary, monitor ----- */
  o += "<g" + axis + ">";
  o += D.BRAIN;
  o += HOT("Hypothalamus: releases GnRH, in pulses, to the anterior pituitary. Testosterone inhibits its GnRH secretion.", D.HYPO);
  o += T(148, 100, "hypothalamus", "hg-xs b", "middle");
  o += HOT("Pituitary stalk: GnRH travels down to the anterior pituitary.", D.STALK);
  o += hgDots([[150, 122], [153, 140], [157, 162]], lv.gnrh === "cont" ? "u" : lv.gnrh === "pulse" ? "n" : lv.gnrh, t, "hg-gnrh", 2.2, 0);
  o += D.PPIT;
  o += HOT("Anterior pituitary: GnRH makes it release LH and FSH. Testosterone inhibits its LH secretion; inhibin inhibits its FSH." + (S.fail === "pit" ? " In this case it is failing." : ""),
    '<g class="' + (S.fail === "pit" ? "hg-fail" : "") + '">' + D.APIT_D + "</g>");
  o += L(196, 206, "anterior pituitary", 172, 184, "start", "hg-xs b");
  if (S.fail === "pit") o += '<rect class="hg-stamp" x="196" y="212" width="62" height="16" rx="4"/>' + T(227, 224, "failing", "hg-xs hg-stampt", "middle");
  if (st.sc === "cont") o += '<rect class="hg-stamp hg-stamp-o" x="196" y="212" width="112" height="16" rx="4"/>' + T(252, 224, "GnRH nonstop", "hg-xs hg-stampt hg-stampo", "middle");
  /* the monitor */
  o += HOT("A monitor of GnRH release over time. GnRH, and so LH, must come in pulses to keep testosterone production normal; continuous GnRH lowers LH instead.",
    '<rect class="hg-screen" x="262" y="12" width="246" height="102" rx="10"/><path class="hg-grid" d="M272 54H498M272 76H498"/>' +
    '<path class="hg-base" d="M272 100H498"/><path class="hg-trace' + (lv.gnrh === "ng" ? " is-q" : "") + '" d="' + hgTrace(lv.gnrh === "pulse" ? "n" : lv.gnrh, t, 272, 498, 100) + '"/>' +
    T(272, 30, "GnRH over time", "hg-xs hg-gnrht", "start"));
  o += hgChip(502, 18, "GnRH", lv.gnrh === "pulse" ? "pulse" : lv.gnrh, D.INFO.gnrh, ring("gnrh"), "hg-gnrht", true);
  o += '<path class="hg-probe" d="M166 112L262 66"/>';
  o += "</g>";

  /* ----- the loop of blood ----- */
  o += HOT("Blood: LH and FSH travel down to the testes; testosterone and inhibin travel back up to the hypothalamus and pituitary, and testosterone on to its targets.", '<path class="hg-vessel" d="' + hgPath(D.VES) + '"/><path class="hg-vline" d="' + hgPath(D.VES) + '"/>');

  /* ----- the testis panel ----- */
  o += '<rect class="hg-panel" x="62" y="300" width="256" height="268" rx="14"/>' + T(72, 318, "inside the testis", "hg-xs mut", "start");
  o += "<g" + axis + ">";
  var failT = S.fail === "testis", failTub = S.fail === "tub" || failT;
  o += HOT("Seminiferous tubule in cross-section: Sertoli cells from the basement membrane to the lumen, with the germ cells between them. FSH and testosterone (kept high here by ABP) drive spermatogenesis." + (failTub ? (failT ? " In this case the testes are failing." : " In this case the tubules are damaged.") : ""),
    '<g class="' + (failTub ? "hg-fail" : "") + '">' + D.TUB + (failTub ? "" : D.GERM) + "</g>");
  var nSp = fl.sp === "d" ? 1 : 6;
  o += HOT("Sperm released into the lumen." + (fl.sp === "d" ? " In this case the sperm count is very low." : ""), '<g class="' + (fl.sp === "ng" ? "hg-faint" : "") + '">' + D.SPERM.slice(0, nSp).join("") + "</g>");
  o += HOT("Sertoli cells, the FSH target: they nourish the germ cells, secrete androgen-binding protein (ABP) and inhibin, form the blood-testis barrier, and hold most of the testis's aromatase." + (failTub ? " Damaged in this case: less inhibin." : ""),
    '<circle class="hg-hit" cx="274" cy="412" r="12"/>');
  o += L(172, 368, "Sertoli cells", 212, 400, "start", "hg-xs b");
  o += HOT("Leydig cells, the LH target, in the connective tissue between the tubules: they make testosterone from cholesterol. They have some aromatase, but most is in the Sertoli cells." + (failT ? " Failing in this case: little testosterone." : ""),
    '<g class="' + (failT ? "hg-fail" : "") + '">' + D.LEY + "</g>");
  o += T(112, 406, "Leydig cells", "hg-xs b", "middle");
  if (failT) o += '<rect class="hg-stamp" x="194" y="306" width="74" height="16" rx="4"/>' + T(231, 318, "failing", "hg-xs hg-stampt", "middle");
  if (S.fail === "tub") o += '<rect class="hg-stamp" x="194" y="306" width="74" height="16" rx="4"/>' + T(231, 318, "damaged", "hg-xs hg-stampt", "middle");
  /* flows inside: LH and FSH in, T to the tubule with ABP and to the blood, estradiol, inhibin out */
  o += HOT("LH reaches the Leydig cells.", '<path class="hg-fl hg-lhl' + (fl.lh === "ng" ? " is-q" : "") + '" d="' + hgPath(D.P_LHIN) + '"/>');
  o += HOT("FSH reaches the Sertoli cells.", '<path class="hg-fl hg-fshl' + (fl.fsh === "ng" ? " is-q" : "") + '" d="' + hgPath(D.P_FSHIN) + '"/>');
  o += HOT("Testosterone into the tubule: Sertoli cells' androgen-binding protein (ABP) keeps it higher in the testis than in the blood, and spermatogenesis depends on that.", '<path class="hg-fl hg-abpl" d="' + hgPath(D.P_ABP) + '"/>');
  o += T(151, 440, "ABP", "hg-xs hg-abpt", "middle");
  o += HOT("Testosterone leaves the Leydig cells for the blood.", '<path class="hg-fl hg-tl" d="' + hgPath(D.P_TOUT) + '"/>');
  o += HOT("Inhibin leaves the Sertoli cells for the blood.", '<path class="hg-fl hg-inhl' + (fl.inh === "ng" ? " is-q" : "") + '" d="' + hgPath(D.P_INHOUT) + '"/>');
  o += HOT("Aromatase (estrogen synthase) turns testosterone into estradiol. Dr. Madison corrected his slide in class: the Sertoli cells, driven by FSH, do most of it from fetal development on; the Leydig cells have some.",
    '<path class="hg-e2l" d="M270 507L282 525"/><circle class="hg-e2" cx="278" cy="519" r="2"/>' + T(288, 540, "estradiol", "hg-xs hg-e2t", "middle") + T(288, 553, "aromatase", "hg-xs mut", "middle"));
  if (lv.itt) o += hgChip(154, 528, "T in testis", lv.itt, D.INFO.itt, ring("itt"), "hg-tt", false);
  o += hgChip(312, 325, "sperm", lv.sp, D.INFO.sp, ring("sp"), "", true);
  o += "</g>";

  /* ----- hormone dots ----- */
  o += hgDots(D.P_LH, dev ? "ng" : fl.lh, t, "hg-lh", 2.6, 0);
  o += hgDots(D.P_FSH, dev ? "ng" : fl.fsh, t, "hg-fsh", 2.6, 0.5);
  o += hgDots(D.P_ABP, dev ? "ng" : fl.abp, t, "hg-abp", 2.3, 0);
  o += hgDots(D.P_TLOW, fl.tl, t, "hg-t", 2.6, 0);
  o += hgDots(D.P_TUP, fl.tu, t, "hg-t", 2.6, 0.25);
  o += hgDots(D.P_INH, dev ? "ng" : fl.inh, t, "hg-inh", 2.6, 0.6);
  D.CARDY.forEach(function (y, j) { o += hgDots([[332, y], [346, y]], fl.tu === "u" ? "n" : fl.tu, t, "hg-t", 2, j / 3); });

  /* ----- the brakes ----- */
  o += "<g" + axis + ">";
  var tb = lv.t === "mr" ? "n" : lv.t, ib = lv.inh;
  o += HOT("Testosterone inhibits GnRH secretion from the hypothalamus.", hgBrake(D.B_TH, "hg-brk hg-brk-t", tb));
  o += HOT("Testosterone inhibits LH secretion from the anterior pituitary.", hgBrake(D.B_TP, "hg-brk hg-brk-t", tb));
  o += HOT("Inhibin inhibits the synthesis and release of FSH.", hgBrake(D.B_IP, "hg-brk hg-brk-i", ib));
  o += T(236, 164, "T ⊣ GnRH, LH", "hg-xs hg-tt", "start") + T(236, 178, "inhibin ⊣ FSH", "hg-xs hg-inht", "start");
  o += "</g>";

  /* ----- tags on the flows ----- */
  o += "<g" + axis + ">";
  o += hgChip(48, 250, "LH", lv.lh, D.INFO.lh, ring("lh"), "hg-lht", false);
  o += hgChip(52 + hgCW("LH", lv.lh), 250, "FSH", lv.fsh, D.INFO.fsh, ring("fsh"), "hg-fsht", false);
  o += hgChip(326, 258, "inhibin", lv.inh, D.INFO.inh, ring("inh"), "hg-inht", true);
  o += "</g>";
  o += hgChip(344, 122, "T (blood)", lv.t, D.INFO.t, ring("t"), "hg-tt", false);

  /* ----- injections ----- */
  if (S.inj) o += HOT("Testosterone injections (as in anabolic steroid use) add testosterone to the blood from outside the axis.",
    '<path class="hg-needle" d="M340 489H372"/><rect class="hg-barrel" x="372" y="481" width="70" height="16" rx="3"/><rect class="hg-dose" x="374" y="483.5" width="44" height="11" rx="2"/>' +
    '<path class="hg-plunger" d="M442 489H462M462 480V498"/>' + T(404, 516, "testosterone", "hg-xs hg-tt", "middle") + T(404, 529, "injections", "hg-xs hg-tt", "middle")) + hgDots(D.P_INJ, "u", t, "hg-t", 2.6, 0.1);

  /* ----- testosterone's targets ----- */
  D.CARDS.forEach(function (c, j) {
    var y = D.CARDY[j] - c.h / 2, s = (S.cards && S.cards[j]) || c.st, ok = s[1] === "ok", o2 = "";
    o2 += '<rect class="hg-card' + (ok ? "" : " is-bad") + '" x="346" y="' + y + '" width="166" height="' + c.h + '" rx="9"/>';
    o2 += '<path class="hg-rcp' + (S.rx ? " is-off" : "") + '" d="M352 ' + (y + 14) + "v6a5 5 0 0 0 10 0v-6M357 " + (y + 25) + 'v5"/>' + (S.rx ? '<path class="hg-rx" d="M350 ' + (y + 12) + "L364 " + (y + 30) + "M364 " + (y + 12) + "L350 " + (y + 30) + '"/>' : "");
    o2 += T(370, y + 16, c.name, "hg-xs b", "start");
    c.sub.forEach(function (ln, i) { o2 += T(370, y + 30 + i * 13, ln, "hg-xs " + (c.subcls || "mut"), "start"); });
    var y0 = y + 30 + c.sub.length * 13 + 4;
    if (j === 1 && st.sc === "ard") o2 += '<path class="hg-rx" d="M368 ' + (y + 26) + "L486 " + (y + 46) + '"/>';
    s[0].forEach(function (ln, i) { o2 += T(370, y0 + i * 13, ln, "hg-xs " + (ok ? "hg-okt" : "hg-badt"), "start"); });
    o2 += hgMark(500, y + 12, ok);
    if (j === 1) o2 += hgChip(370, y + c.h - 38, "DHT", lv.dht || "ng", D.INFO.dht, ring("dht"), "hg-dhtt", false);
    o += HOT(c.info + (S.cards && S.cards[j] ? " " + S.cards[j][2] : ""), o2);
  });

  /* ----- the verdict ----- */
  o += HOT("What the pattern says.", '<rect class="hg-ban' + (st.sc === "normal" ? "" : " is-on") + '" x="8" y="602" width="504" height="48" rx="10"/>' + T(20, 621, S.name.toUpperCase(), "hg-xs hg-bant", "start") + T(20, 640, S.verdict, "hg-v", "start"));
  return o;
}

function hgSay(st, D) {
  var S = D.SC[st.sc];
  return [S.say, S.ro];
}

/* ---------- the cases, as the notes and the hub's case questions give them ---------- */
const CARDS = [
  { name: "Wolffian ducts", sub: ["testosterone itself"], h: 70, st: [["build the internal", "male ducts (fetus)"], "ok"],
    info: "The Wolffian ducts are testosterone tissue: testosterone itself acts on them, in the fetus, to build the internal male structures." },
  { name: "DHT tissues", sub: ["T → DHT by", "5-alpha-reductase"], subcls: "hg-dhtt", h: 122, st: [["penis, scrotum and", "prostate form"], "ok"],
    info: "5-alpha-reductase converts testosterone to dihydrotestosterone, mainly in peripheral tissues; DHT forms the penis, scrotum and prostate." },
  { name: "puberty", sub: ["testosterone itself"], h: 70, st: [["male secondary sex", "characteristics"], "ok"],
    info: "At puberty testosterone rises and brings the male secondary sex characteristics." },
];
const CARDY = [194, 304, 422];
const DEVNOTE = "These are development cases: the labs the lecture gives are testosterone (and DHT); the rest of the axis is dimmed.";
const SC = {
  normal: { name: "Normal", lv: { gnrh: "pulse", lh: "n", fsh: "n", t: "n", inh: "n", sp: "n", dht: "n" }, f: { lh: "n", fsh: "n", abp: "n", tl: "n", tu: "n", inh: "n", sp: "n" },
    verdict: "Pulses in; testosterone and inhibin hold it steady",
    say: "Normal: the hypothalamus releases GnRH in pulses, and the anterior pituitary answers with LH and FSH. LH acts on the Leydig cells, which make testosterone; FSH acts on the Sertoli cells (spermatogenesis, ABP, inhibin). Testosterone inhibits GnRH and LH, and inhibin inhibits FSH, so serum testosterone stays in a narrow range.",
    ro: "normal · in range" },
  cont: { name: "Continuous GnRH", lv: { gnrh: "cont", lh: "d", fsh: "ns", t: "d", inh: "ng", sp: "ng" }, f: { lh: "d", fsh: "ng", abp: "d", tl: "d", tu: "d", inh: "ng", sp: "ng" },
    verdict: "GnRH nonstop: LH ↓, so testosterone ↓",
    say: "Continuous GnRH: GnRH, and so LH, must be released in pulses. Given continuously, GnRH does the opposite of what you might expect: it decreases LH secretion, and therefore testosterone. The slides don't say what happens to FSH.",
    ro: "nonstop · LH↓ T↓" },
  inj: { name: "Testosterone injections", inj: true, lv: { gnrh: "d", lh: "d", fsh: "d", t: "u", inh: "ng", sp: "d", itt: "d" }, f: { lh: "d", fsh: "d", abp: "d", tl: "d", tu: "u", inh: "ng", sp: "d" },
    verdict: "T ↑ with LH ↓ and FSH ↓: it comes from outside",
    say: "Testosterone injections (as in anabolic steroid use): blood testosterone is high, and it inhibits GnRH and LH; with less GnRH, FSH falls too. The testes are no longer stimulated, so the high testosterone inside the testis that spermatogenesis needs is lost, and the sperm count falls even though blood testosterone is high.",
    ro: "shots · T↑ LH↓ FSH↓" },
  testes: { name: "Failing testes", fail: "testis", lv: { gnrh: "u", lh: "u", fsh: "u", t: "d", inh: "d", sp: "ng" }, f: { lh: "u", fsh: "u", abp: "d", tl: "d", tu: "d", inh: "d", sp: "ng" },
    verdict: "T ↓ with LH ↑ and FSH ↑: the testes are failing",
    say: "Failing testes: testosterone (and inhibin) are low, so the brake is off and GnRH, LH and FSH rise. Low testosterone with high LH and FSH puts the problem in the testes themselves.",
    ro: "testes · T↓ LH↑ FSH↑" },
  pit: { name: "Failing pituitary", fail: "pit", lv: { gnrh: "ng", lh: "d", fsh: "d", t: "d", inh: "ng", sp: "ng" }, f: { lh: "d", fsh: "d", abp: "d", tl: "d", tu: "d", inh: "ng", sp: "ng" },
    verdict: "T ↓ with LH ↓ and FSH ↓: the problem is above the testis",
    say: "Failing pituitary: LH and FSH are low, so the testes aren't stimulated and testosterone is low too. Low testosterone with low LH and FSH points above the testis: the pituitary, or the GnRH above it.",
    ro: "pituitary · T↓ LH↓ FSH↓" },
  tub: { name: "Damaged tubules, healthy Leydig cells", fail: "tub", lv: { gnrh: "ng", lh: "n", fsh: "u", t: "n", inh: "d", sp: "d" }, f: { lh: "n", fsh: "u", abp: "n", tl: "n", tu: "n", inh: "d", sp: "d" },
    verdict: "FSH ↑ alone, LH and T normal: less inhibin",
    say: "Damaged tubules, healthy Leydig cells: the Sertoli cells make less inhibin, so FSH rises on its own, while LH and testosterone stay normal. Each testis cell feeds back on its own gonadotropin: Leydig testosterone on GnRH and LH, Sertoli inhibin on FSH. The hub's case has a very low sperm count.",
    ro: "tubules · FSH↑ only" },
  ard: { name: "5-alpha-reductase deficiency", dev: true, lv: { gnrh: "ng", lh: "ng", fsh: "ng", t: "mr", inh: "ng", sp: "ng", dht: "d" }, f: { lh: "ng", fsh: "ng", abp: "ng", tl: "n", tu: "n", inh: "ng", sp: "ng" },
    cards: [[["develop: testosterone", "acts"], "ok", "In 5-alpha-reductase deficiency testosterone is made and its receptor works, so the Wolffian ducts develop."],
      [["DHT low: genitalia", "female-appearing"], "bad", "Testosterone can't be converted to DHT, so the external genitalia are female; these children are often raised as girls."],
      [["may bring male changes", "as testosterone rises"], "ok", "At puberty testosterone rises, and because testosterone acts on its own, they may develop male secondary sex characteristics."]],
    verdict: "T works, DHT ↓: Wolffian ducts yes, male genitalia no",
    say: "5-alpha-reductase deficiency (XY, testes): testosterone is made, in the male range, and its receptor works, so the Wolffian ducts develop. But it can't be converted to DHT, so DHT is low and the external genitalia are female. AMH works, so there are no Müllerian ducts. At puberty testosterone rises, and they may develop male secondary sex characteristics. " + DEVNOTE,
    ro: "5-ARD · DHT↓" },
  ais: { name: "Androgen insensitivity syndrome", dev: true, rx: true, lv: { gnrh: "ng", lh: "ng", fsh: "ng", t: "mr", inh: "ng", sp: "ng" }, f: { lh: "ng", fsh: "ng", abp: "ng", tl: "n", tu: "n", inh: "ng", sp: "ng" },
    cards: [[["regress: no working", "receptor"], "bad", "In androgen insensitivity testosterone has no working receptor, so the Wolffian ducts regress."],
      [["female: no working", "receptor"], "bad", "DHT has no working receptor either, so the external genitalia follow the default female pathway."],
      [["female secondary sex", "characteristics"], "bad", "At puberty the secondary sex characteristics are female as well."]],
    verdict: "T made, no working receptor: T and DHT can't act",
    say: "Androgen insensitivity syndrome (testicular feminization), an X-linked androgen receptor deficiency: the person is XY with testes, and testosterone is made (in the normal adult male range in the hub's case), but neither testosterone nor DHT has a working receptor. The Wolffian ducts regress, the external genitalia are female, and puberty is female. AMH needs no androgen receptor, so the Müllerian ducts regress too: no uterus. " + DEVNOTE,
    ro: "AIS · no receptor" },
};
const INFO = {
  gnrh: "GnRH, from the hypothalamus: it makes the anterior pituitary release LH and FSH, and it must come in pulses.",
  lh: "LH, from the anterior pituitary: it acts on the Leydig cells, which make testosterone.",
  fsh: "FSH, from the anterior pituitary: it acts on the Sertoli cells (spermatogenesis, ABP, inhibin).",
  t: "Serum testosterone, from the Leydig cells: it inhibits GnRH and LH.",
  inh: "Inhibin, from the Sertoli cells: it inhibits FSH.",
  sp: "Sperm count.",
  itt: "Testosterone inside the testis: normally higher than in the blood (LH-driven Leydig production, held by Sertoli ABP), and spermatogenesis depends on it.",
  dht: "DHT, made from testosterone by 5-alpha-reductase in peripheral tissues.",
};

export default function hpg() {
  const A = staticArt();
  const VES = [[164, 187], [152, 206], [112, 222], [64, 234], [44, 258], [44, 562], [62, 586], [314, 586], [332, 568], [332, 168], [318, 150], [240, 148], [200, 152]];
  const D = Object.assign({}, A, {
    SC, INFO, CARDS, CARDY, ANIM: true,
    INIT: { sc: "normal" },
    VES,
    P_LH: [[164, 187], [152, 206], [112, 222], [64, 234], [44, 258], [44, 432], [90, 432]],
    P_FSH: [[164, 187], [152, 206], [112, 222], [64, 234], [44, 258], [44, 384], [150, 384], [182, 402]],
    P_LHIN: [[44, 432], [90, 432]],
    P_FSHIN: [[44, 384], [150, 384], [182, 402]],
    P_ABP: [[136, 446], [162, 450]],
    P_TOUT: [[128, 468], [146, 484], [146, 586]],
    P_TLOW: [[128, 468], [146, 484], [146, 586], [314, 586], [332, 568], [332, 489]],
    P_TUP: [[332, 489], [332, 168], [318, 150], [240, 148], [200, 152]],
    P_INJ: [[372, 489], [334, 489]],
    P_INHOUT: [[251, 512], [252, 586]],
    P_INH: [[251, 512], [252, 586], [314, 586], [332, 568], [332, 168], [318, 150], [240, 148], [200, 152]],
    B_TH: [[200, 152], [182, 138], [166, 124]],
    B_TP: [[200, 152], [184, 166]],
    B_IP: [[200, 152], [194, 174], [182, 182]],
  });
  return makeFig({
    id: "hpg", lec: "mphys", fig: "Fig 9", short: "The male HPG axis", hint: "pick · hover",
    title: "The male HPG axis and what breaks it",
    caption: "The hypothalamus, the anterior pituitary and the testes on one loop of blood, with testosterone's brakes and its targets. Pick a case to see which part breaks and which way each hormone goes.",
    W: 520, H: 660,
    label: "The hypothalamic-pituitary-testicular axis: GnRH from the hypothalamus to the anterior pituitary, LH and FSH in the blood to the Leydig and Sertoli cells of the testis, testosterone and inhibin back to the hypothalamus and pituitary as negative feedback, and testosterone on to the Wolffian ducts, to the DHT tissues through 5-alpha-reductase and to puberty.",
    D, render: hgRender, say: hgSay, helpers: [hgPath, hgDots, hgWord, hgCW, hgChip, hgTrace, hgMark, hgBrake],
    controls: `<div class="am-controls" role="group" aria-label="Case">` + Object.keys(SC).map((k) => `<button type="button" class="am-btn" data-amk="sc" data-amv="${k}">${{ normal: "Normal", cont: "Continuous GnRH", inj: "Testosterone injections", testes: "Failing testes", pit: "Failing pituitary", tub: "Damaged tubules", ard: "5-alpha-reductase deficiency", ais: "Androgen insensitivity" }[k]}</button>`).join("") + `</div>`,
    sources: [
      "From the L15 notes (Dr. Madison): GnRH from the hypothalamus releases LH and FSH; LH acts on the Leydig cells (testosterone), FSH on the Sertoli cells (spermatogenesis, ABP, inhibin); testosterone inhibits GnRH and LH and inhibin inhibits FSH; GnRH (and so LH) must be pulsatile, and continuous GnRH decreases LH and testosterone; ABP keeps testosterone higher in the testis than in the blood; 5-alpha-reductase makes DHT in peripheral tissues (penis, scrotum, prostate); aromatase mostly in the Sertoli cells (FSH) from fetal development on, with some in the Leydig cells (his correction in the 11/6 recording, which overrides the slide's \"Leydig cells from puberty on\"); the hormone-pattern table (failing testes, failing pituitary, testosterone injections, damaged tubules with low inhibin, continuous GnRH with FSH not on the slides); androgen insensitivity and 5-alpha-reductase deficiency.",
      "From the hub's case questions on this lecture: GnRH rises with failing testes (the brake is off GnRH, LH and FSH) and falls with injected testosterone; the injection case's very low sperm count and lost intratesticular testosterone; the damaged-tubule case's very low sperm count; testosterone in the male range in both development cases, and DHT low in 5-alpha-reductase deficiency. Anything a case or the notes don't give is tagged \"not given\" rather than worked out.",
      "Schematic and not to scale: the brain is a simple sagittal outline and the testis is a magnified tubule with Leydig cells beside it. The GnRH monitor is qualitative (its pulse spacing and heights aren't data), and the flows' speeds only say higher or lower. The axis is drawn for an adult; the development cases dim it and look at the targets.",
    ],
    css: `
.anima[data-anima="hpg"] .am-svg{max-width:540px}
.anima .hpg-svg .t.hg-xs{font-size:11px}
.anima .hpg-svg .t.hg-v{font-size:12.5px;fill:var(--anatomy-strong);font-weight:600}
.anima .hpg-svg .hg-brain{fill:var(--anatomy-shade-2);stroke:var(--anatomy-mid);stroke-width:1.3}
.anima .hpg-svg .hg-cbl,.anima .hpg-svg .hg-stem{fill:var(--anatomy-shade-1);stroke:var(--anatomy-mid);stroke-width:1.1}
.anima .hpg-svg .hg-gyr{fill:none;stroke:var(--anatomy-lo);stroke-width:1.1;stroke-linecap:round}
.anima .hpg-svg .hg-hyp{fill:var(--bx-stim);opacity:.85;stroke:var(--anatomy-hi);stroke-width:.8}
.anima .hpg-svg .hg-stalk{fill:none;stroke:var(--anatomy-mid);stroke-width:4;stroke-linecap:round}
.anima .hpg-svg .hg-ppit{fill:var(--anatomy-shade-1);stroke:var(--anatomy-mid);stroke-width:1.1}
.anima .hpg-svg .hg-apit{fill:var(--bx-violet-soft);stroke:var(--bx-violet);stroke-width:1.6}
.anima .hpg-svg .hg-screen{fill:var(--anatomy-shade-1);stroke:var(--anatomy-lo);stroke-width:1.2}
.anima .hpg-svg .hg-grid{fill:none;stroke:var(--anatomy-faint);stroke-width:1}
.anima .hpg-svg .hg-base{fill:none;stroke:var(--anatomy-lo);stroke-width:1}
.anima .hpg-svg .hg-trace{fill:none;stroke:var(--bx-stim);stroke-width:2.2;stroke-linejoin:round}
.anima .hpg-svg .hg-trace.is-q{stroke:var(--anatomy-lo);stroke-dasharray:3 4}
.anima .hpg-svg .hg-probe{fill:none;stroke:var(--anatomy-lo);stroke-width:1;stroke-dasharray:3 3}
.anima .hpg-svg .hg-vessel{fill:none;stroke:var(--bx-blood-soft);stroke-width:13;stroke-linecap:round;stroke-linejoin:round}
.anima .hpg-svg .hg-vline{fill:none;stroke:var(--bx-blood);stroke-width:.8;opacity:.5;stroke-dasharray:2 6}
.anima .hpg-svg .hg-panel{fill:var(--anatomy-face);stroke:var(--anatomy-lo);stroke-width:1}
.anima .hpg-svg .hg-wall{fill:color-mix(in srgb,var(--bx-eosin) 22%,var(--bx-fat));stroke:var(--bx-fat-line);stroke-width:1}
.anima .hpg-svg .hg-epi{fill:var(--bx-matrix);stroke:var(--bx-memb);stroke-width:1.6}
.anima .hpg-svg .hg-lum{fill:var(--bx-lumen);stroke:var(--bx-cyto-line);stroke-width:1}
.anima .hpg-svg .hg-sert{fill:color-mix(in srgb,var(--bx-eosin) 55%,var(--bx-matrix));stroke:var(--bx-cyto-line);stroke-width:1}
.anima .hpg-svg .hg-snu{fill:color-mix(in srgb,var(--bx-nuc) 35%,var(--bx-matrix));stroke:var(--bx-nuc-line);stroke-width:.8}
.anima .hpg-svg .hg-gc{fill:color-mix(in srgb,var(--bx-cyto) 70%,var(--surface));stroke:var(--bx-cyto-line);stroke-width:.8}
.anima .hpg-svg .hg-gn{fill:var(--bx-nuc)}
.anima .hpg-svg .hg-tail{fill:none;stroke:var(--bx-sperm);stroke-width:1.1;stroke-linecap:round}
.anima .hpg-svg .hg-head{fill:var(--bx-sperm)}
.anima .hpg-svg .hg-ley{fill:var(--bx-eosin);stroke:var(--bx-cyto-line);stroke-width:1}
.anima .hpg-svg .hg-lnu{fill:var(--bx-nuc);stroke:var(--bx-nuc-line);stroke-width:.6}
.anima .hpg-svg .hg-hit{fill:transparent}
.anima .hpg-svg .hg-fail *{fill:var(--anatomy-shade-0);stroke:var(--anatomy-lo)}
.anima .hpg-svg .hg-fail{opacity:.9}
.anima .hpg-svg .hg-faint{opacity:.35}
.anima .hpg-svg .hg-stamp{fill:var(--surface);stroke:var(--bx-inhib);stroke-width:1.3}
.anima .hpg-svg .t.hg-stampt{fill:var(--bx-inhib);font-weight:600;letter-spacing:.04em}
.anima .hpg-svg .hg-stamp-o{stroke:var(--bx-hot)}
.anima .hpg-svg .t.hg-stampo{fill:var(--bx-hot)}
.anima .hpg-svg .hg-fl{fill:none;stroke-width:1.4;stroke-dasharray:4 3;opacity:.75}
.anima .hpg-svg .hg-fl.is-q{stroke:var(--anatomy-lo)!important;opacity:.6}
.anima .hpg-svg .hg-lhl{stroke:var(--bx-violet)}
.anima .hpg-svg .hg-fshl{stroke:var(--bx-blue)}
.anima .hpg-svg .hg-abpl{stroke:var(--bx-ins)}
.anima .hpg-svg .hg-tl{stroke:var(--bx-gold)}
.anima .hpg-svg .hg-inhl{stroke:var(--bx-inhib)}
.anima .hpg-svg .hg-e2l{fill:none;stroke:var(--bx-cyto-line);stroke-width:1.3}
.anima .hpg-svg .hg-e2{fill:var(--bx-cyto-line)}
.anima .hpg-svg .hg-gnrh{fill:var(--bx-stim);stroke:var(--surface);stroke-width:.6}
.anima .hpg-svg .hg-lh{fill:var(--bx-violet);stroke:var(--surface);stroke-width:.7}
.anima .hpg-svg .hg-fsh{fill:var(--bx-blue);stroke:var(--surface);stroke-width:.7}
.anima .hpg-svg .hg-t{fill:var(--bx-gold);stroke:var(--anatomy-text);stroke-width:.6}
.anima .hpg-svg .hg-abp{fill:var(--bx-ins);stroke:var(--surface);stroke-width:.6}
.anima .hpg-svg .hg-inh{fill:var(--bx-inhib);stroke:var(--surface);stroke-width:.7}
.anima .hpg-svg .t.hg-gnrht{fill:var(--bx-stim);font-weight:600}
.anima .hpg-svg .t.hg-lht{fill:var(--bx-violet);font-weight:600}
.anima .hpg-svg .t.hg-fsht{fill:var(--bx-blue);font-weight:600}
.anima .hpg-svg .t.hg-tt{fill:color-mix(in srgb,var(--bx-gold) 70%,var(--anatomy-strong));font-weight:600}
.anima .hpg-svg .t.hg-inht{fill:var(--bx-inhib);font-weight:600}
.anima .hpg-svg .t.hg-abpt{fill:var(--bx-ins);font-weight:600}
.anima .hpg-svg .t.hg-e2t{fill:var(--bx-cyto-line);font-weight:600}
.anima .hpg-svg .t.hg-dhtt{fill:color-mix(in srgb,var(--bx-glu) 75%,var(--anatomy-strong))}
.anima .hpg-svg .hg-chip{fill:var(--surface);stroke:var(--anatomy-lo);stroke-width:1.1}
.anima .hpg-svg .hg-chip.hg-up{stroke:var(--bx-hot);stroke-width:1.6;fill:var(--bx-hot-soft)}
.anima .hpg-svg .hg-chip.hg-dn{stroke:var(--bx-blue);stroke-width:1.6;fill:var(--bx-blue-soft)}
.anima .hpg-svg .hg-chip.hg-q{stroke-dasharray:3 3}
.anima .hpg-svg .t.hg-lv{font-weight:700}
.anima .hpg-svg .t.hg-lv.hg-up{fill:var(--bx-hot)}
.anima .hpg-svg .t.hg-lv.hg-dn{fill:var(--bx-blue)}
.anima .hpg-svg .t.hg-lv.hg-eq{fill:var(--anatomy-strong)}
.anima .hpg-svg .t.hg-lv.hg-q{fill:var(--anatomy-muted);font-weight:500}
.anima .hpg-svg .hg-ring{fill:none;stroke:var(--anatomy-lit);stroke-width:2.4}
.anima .hpg-svg .hg-brk{fill:none;stroke-width:2;stroke-linecap:round}
.anima .hpg-svg .hg-brk-t{stroke:var(--bx-gold)}
.anima .hpg-svg .hg-brk-i{stroke:var(--bx-inhib)}
.anima .hpg-svg .hg-brk.is-strong{stroke-width:3.4}
.anima .hpg-svg .hg-brk.is-weak{stroke-width:1.2;stroke-dasharray:3 3;opacity:.6}
.anima .hpg-svg .hg-brk.is-q{stroke:var(--anatomy-lo);stroke-dasharray:2 3}
.anima .hpg-svg .hg-card{fill:var(--anatomy-face);stroke:var(--anatomy-lo);stroke-width:1}
.anima .hpg-svg .hg-card.is-bad{stroke:var(--bx-inhib);stroke-dasharray:4 3}
.anima .hpg-svg .hg-rcp{fill:none;stroke:var(--bx-gold);stroke-width:2;stroke-linecap:round}
.anima .hpg-svg .hg-rcp.is-off{opacity:.45}
.anima .hpg-svg .hg-rx{fill:none;stroke:var(--bx-inhib);stroke-width:2;stroke-linecap:round}
.anima .hpg-svg .t.hg-okt{fill:var(--bx-stim)}
.anima .hpg-svg .t.hg-badt{fill:var(--bx-inhib)}
.anima .hpg-svg .hg-okc{fill:var(--bx-stim)}
.anima .hpg-svg .hg-okm,.anima .hpg-svg .hg-nom{fill:none;stroke:var(--surface);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.anima .hpg-svg .hg-noc{fill:var(--bx-inhib)}
.anima .hpg-svg .hg-needle{fill:none;stroke:var(--anatomy-mid);stroke-width:1.6}
.anima .hpg-svg .hg-barrel{fill:var(--anatomy-face);stroke:var(--anatomy-mid);stroke-width:1.2}
.anima .hpg-svg .hg-dose{fill:var(--bx-gold);opacity:.8}
.anima .hpg-svg .hg-plunger{fill:none;stroke:var(--anatomy-mid);stroke-width:2;stroke-linecap:round}
.anima .hpg-svg .hg-ban{fill:var(--anatomy-shade-1);stroke:var(--anatomy-lo);stroke-width:1}
.anima .hpg-svg .hg-ban.is-on{stroke:var(--anatomy-lit);stroke-width:1.4}
.anima .hpg-svg .t.hg-bant{fill:var(--anatomy-muted);letter-spacing:.06em}
`,
  });
}
