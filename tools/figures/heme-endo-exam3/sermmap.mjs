// Fig: one drug, different tissues: the SERM map (L18 Estrogens and Androgens, Dr. Fasinu: "SERMs: why a drug can be
// selective", "Tamoxifen", "Raloxifene", "Clomiphene" and "The SERM summary table"). A schematic front view of a woman
// (patient's right on the viewer's left) with the five places his summary table compares: the hypothalamus and pituitary
// with the ovaries (ovulation), the breasts, the liver (serum lipids), the uterus and its lining, and bone (the femoral
// neck, magnified). Pick estradiol or a SERM: every tissue turns gold where the drug acts like estradiol (a plus on his
// table) or blue where it does the opposite (a minus), the lining thickens or stays thin, the bone's trabeculae fill in
// or thin out, the LH and FSH pulses shrink or grow, and the ovaries release eggs under clomiphene. Cards give what
// follows in his words, and his table sits underneath with the drug's row lit. Schematic, not to scale.
import { makeFig, f1, T, HOT } from "./shared.mjs";

/* ---------- build-time geometry ---------- */
function smSmooth(p, closed) {
  /* Catmull-Rom through p as cubic Beziers */
  var n = p.length, d = "M" + f1(p[0][0]) + " " + f1(p[0][1]), last = closed ? n : n - 1, i, a, b, c, e;
  for (i = 0; i < last; i++) {
    a = p[(i - 1 + n) % n]; b = p[i]; c = p[(i + 1) % n]; e = p[(i + 2) % n];
    if (!closed) { if (i === 0) a = b; if (i + 2 >= n) e = c; }
    d += "C" + f1(b[0] + (c[0] - a[0]) / 6) + " " + f1(b[1] + (c[1] - a[1]) / 6) + " " + f1(c[0] - (e[0] - b[0]) / 6) + " " + f1(c[1] - (e[1] - b[1]) / 6) + " " + f1(c[0]) + " " + f1(c[1]);
  }
  return d + (closed ? "Z" : "");
}
const MX = 244; /* the body's midline is x = 122: mirror with MX - x */
const mir = (p) => p.map((q) => [MX - q[0], q[1]]);

function staticArt() {
  const o = {};
  /* the torso: right side (viewer's right) from the crop up to the neck, then the left side down, then the thighs */
  const R = [[172, 470], [176, 420], [182, 372], [184, 336], [178, 312], [165, 276], [171, 246], [175, 224], [176, 204], [183, 180], [172, 166], [152, 160], [133, 152]];
  const Lf = mir(R).reverse();
  const inner = [[118, 470], [119, 420], [120, 372], [122, 354], [124, 372], [125, 420], [126, 470]];
  o.TORSO = smSmooth(R, false) + "L" + f1(Lf[0][0]) + " " + f1(Lf[0][1]) + smSmooth(Lf, false).replace(/^M[^C]*/, "") + "L" + inner.map((q) => f1(q[0]) + " " + f1(q[1])).join("L") + "Z";
  const ARM = [[181, 172], [190, 192], [194, 232], [196, 270], [199, 310], [201, 342], [204, 358], [199, 371], [190, 369], [187, 355], [186, 340], [183, 306], [180, 268], [177, 232], [174, 208]];
  o.ARMS = smSmooth(ARM, true) + smSmooth(mir(ARM), true);
  o.NECK = "M111 128L111 156L133 156L133 128Z";
  /* breasts: a soft outline with the lobules on their ducts around the nipple */
  o.BR = [148, 96].map(function (cx) {
    const cy = 210, p = [];
    for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2, r = 19.5 + (Math.sin(a) > 0 ? 1.5 * Math.sin(a) : 0); p.push([cx + r * Math.cos(a), cy + 0.94 * r * Math.sin(a)]); }
    return { cx, cy, d: smSmooth(p, true) };
  });
  /* liver under the right ribs (viewer's left), its thin left lobe reaching across the midline */
  o.LIV = smSmooth([[82, 238], [100, 229], [126, 230], [150, 236], [161, 243], [150, 250], [126, 256], [100, 263], [85, 257]], true);
  /* the uterus (body and cervix), enlarged; tubes out to the ovaries */
  o.UT = smSmooth([[104, 296], [113, 290], [122, 288.5], [131, 290], [140, 296], [142.5, 311], [137, 327], [130.5, 336], [129.5, 347], [114.5, 347], [113.5, 336], [107, 327], [101.5, 311]], true);
  o.CERV = "M122 337.5V346.5";
  o.TUBE_R = "M139 296C146 290 154 286.5 162 287C168 287.5 172 290 174 294";
  o.TUBE_L = "M105 296C98 290 90 286.5 82 287C76 287.5 72 290 70 294";
  o.FIMB = "M174 294L177 292.5M174 294L177.5 296M174 294L175.5 298M70 294L67 292.5M70 294L66.5 296M70 294L68.5 298";
  /* femurs: head in the hip, neck, greater trochanter, shaft converging toward the knee */
  const FOUT = [[151, 333], [159, 331.5], [166, 336], [172, 336.5], [177.5, 334.5], [182.5, 341], [182.5, 352], [179, 364], [172, 386], [167, 420], [163, 470]];
  const FIN = [[153, 470], [157, 420], [161, 388], [163, 375], [159, 367], [157.5, 357], [153, 347], [148, 342]];
  const fem = (a, b) => smSmooth(a, false) + "L" + f1(b[0][0]) + " " + f1(b[0][1]) + smSmooth(b, false).replace(/^M[^C]*/, "") + "Z";
  o.FEM = fem(FOUT, FIN) + fem(mir(FOUT), mir(FIN));
  o.FHEAD = '<circle cx="152" cy="337" r="7.6"/><circle cx="92" cy="337" r="7.6"/>';
  o.FHEAD_IN = '<circle class="sm-bonein" cx="152" cy="337" r="6.7"/><circle class="sm-bonein" cx="92" cy="337" r="6.7"/>';
  /* the zoom on the top of the femur: trabecular struts inside a circle; keep marks the ones a thin bone keeps */
  const BC = [212, 418], BR = 21, pts = [];
  for (let gy = -3; gy <= 3; gy++) for (let gx = -3; gx <= 3; gx++) {
    const jx = Math.sin(gx * 12.9 + gy * 78.2) * 1.7, jy = Math.cos(gx * 39.3 + gy * 11.7) * 1.7;
    const x = BC[0] + gx * 6.6 + (gy % 2 ? 3.3 : 0) + jx, y = BC[1] + gy * 5.8 + jy;
    if (Math.hypot(x - BC[0], y - BC[1]) < BR - 2.6) pts.push([x, y]);
  }
  const ed = [];
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
    const dd = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
    if (dd < 8.4) { const h = Math.abs(Math.sin(i * 17.3 + j * 5.1)); ed.push([f1(pts[i][0]), f1(pts[i][1]), f1(pts[j][0]), f1(pts[j][1]), h > 0.42 ? 1 : 0]); }
  }
  o.STRUTS = ed;
  o.BONE_C = BC; o.BONE_R = BR;
  /* the zoom cone, from a ring on the intertrochanteric region (trabecular bone) to the lens */
  const P = [168, 362], dx = P[0] - BC[0], dy = P[1] - BC[1], dl = Math.hypot(dx, dy), a0 = Math.atan2(dy, dx), ux = -dy / dl, uy = dx / dl;
  o.RING = P;
  o.CONE = "M" + f1(P[0] - 5 * ux) + " " + f1(P[1] - 5 * uy) + "L" + f1(BC[0] + BR * Math.cos(a0 + 1.22)) + " " + f1(BC[1] + BR * Math.sin(a0 + 1.22)) +
    "M" + f1(P[0] + 5 * ux) + " " + f1(P[1] + 5 * uy) + "L" + f1(BC[0] + BR * Math.cos(a0 - 1.22)) + " " + f1(BC[1] + BR * Math.sin(a0 - 1.22));
  /* the head: skull outline, the brain, the hypothalamus at its base and the pituitary on its stalk */
  o.HEAD = '<ellipse cx="122" cy="106" rx="26" ry="34"/>';
  o.BRAIN = smSmooth([[104, 102], [103, 90], [110, 80], [122, 76], [134, 80], [141, 90], [140, 102], [133, 110], [122, 112], [111, 110]], true);
  o.GYR = "M108 94C113 88 118 92 122 86C126 92 131 88 136 94M107 102C112 98 117 103 122 98C127 103 132 98 137 102";
  return o;
}

/* ---------- page helpers (serialized into the page) ---------- */
/* a state badge (+ same as estradiol, - opposite) where a card's leader lands */
function smBadge(x, y, s) { var p = s === "+"; return '<circle class="sm-bdg ' + (p ? "sm-p" : "sm-m") + '" cx="' + f1(x) + '" cy="' + f1(y) + '" r="6.4"/><path class="sm-bdgm ' + (p ? "sm-pt" : "sm-mt") + '" d="M' + f1(x - 3) + " " + f1(y) + "H" + f1(x + 3) + (p ? "M" + f1(x) + " " + f1(y - 3) + "V" + f1(y + 3) : "") + '"/>'; }
/* the LH and FSH trace: pulses scroll left; a is the pulse height */
function smTrace(a, t, x0, x1, b) {
  var o = "", x, P = 22, sc = t ? t * 0.012 : 6;
  for (x = x0; x <= x1; x += 1.5) { var q = (((x + sc) % P) + P) % P - P / 2; o += (x === x0 ? "M" : "L") + f1(x) + " " + f1(b - a * Math.exp(-(q * q) / 5)); }
  return o;
}
/* a lobule: a few round acini on a duct; on = proliferating (one cell dividing) */
function smLobule(x, y, nx, ny, on, t, ph) {
  var o = '<path class="sm-duct" d="M' + f1(nx) + " " + f1(ny) + "L" + f1(x) + " " + f1(y) + '"/>', k, n = on ? 4 : 3;
  for (k = 0; k < n; k++) { var a = k * 2 * Math.PI / n + ph; o += '<circle class="sm-ac" cx="' + f1(x + 2.6 * Math.cos(a)) + '" cy="' + f1(y + 2.6 * Math.sin(a)) + '" r="2.1"/>'; }
  if (on) { var u = t ? ((t / 1700 + ph) % 1) : 0.6, s = Math.min(1, u * 1.6) * 2.2, a2 = ph + 0.7; o += '<circle class="sm-ac sm-div" cx="' + f1(x + (4.6 + s) * Math.cos(a2)) + '" cy="' + f1(y + (4.6 + s) * Math.sin(a2)) + '" r="1.8"/><circle class="sm-ac sm-div" cx="' + f1(x + (4.6 - s * 0.2) * Math.cos(a2 + 0.6)) + '" cy="' + f1(y + (4.6 - s * 0.2) * Math.sin(a2 + 0.6)) + '" r="1.8"/>'; }
  return o;
}
/* the point a fraction u along a polyline */
function smAt(p, u) {
  var Ls = [], tot = 0, i, s;
  for (i = 1; i < p.length; i++) { var dd = Math.sqrt(Math.pow(p[i][0] - p[i - 1][0], 2) + Math.pow(p[i][1] - p[i - 1][1], 2)); Ls.push(dd); tot += dd; }
  s = Math.max(0, Math.min(1, u)) * tot;
  for (i = 0; i < Ls.length; i++) { if (s <= Ls[i] || i === Ls.length - 1) { var w = Ls[i] ? Math.min(1, s / Ls[i]) : 0; return [p[i][0] + (p[i + 1][0] - p[i][0]) * w, p[i][1] + (p[i + 1][1] - p[i][1]) * w]; } s -= Ls[i]; }
  return p[p.length - 1];
}
/* one tissue's card on the right: its name, + or -, and what follows */
function smCard(y, key, g, D) {
  var e = g.fx[key], p = e.s === "+", c = D.CARD[key], o = "";
  o += '<rect class="sm-card ' + (p ? "sm-cp" : "sm-cm") + '" x="246" y="' + y + '" width="226" height="74" rx="9"/>';
  o += T(256, y + 17, c.name, "sm-xs sm-cap", "start");
  var lab = p ? "+ same" : "− opposite", w = lab.length * 6.7 + 14;
  o += '<rect class="sm-chip ' + (p ? "sm-p" : "sm-m") + '" x="' + f1(464 - w) + '" y="' + (y + 6) + '" width="' + f1(w) + '" height="16" rx="8"/>' + T(464 - w / 2, y + 17.5, lab, "sm-xs " + (p ? "sm-pt" : "sm-mt") + " sm-bold", "middle");
  e.l.forEach(function (ln, i) { o += T(256, y + 36 + i * 14, ln[0], "sm-xs " + (ln[1] || "sm-ink"), "start"); });
  return HOT(c.info + " " + g.name + ": " + e.info, o);
}

function smRender(st, D) {
  var t = st.t || 0, g = D.DRUGS[st.d], fx = g.fx, o = "", k;
  function cls(key) { return fx[key].s === "+" ? "sm-p" : "sm-m"; }

  /* ----- the top band: the drug, its use, what to watch for, and the key ----- */
  o += T(10, 24, g.name.toUpperCase() + (g.brand ? " (" + g.brand + ")" : ""), "sm-name", "start");
  o += T(10, 41, g.use, "sm-xs sm-ink", "start") + T(10, 56, g.watch, "sm-xs sm-mut", "start");
  o += HOT(D.WHY, '<rect class="sm-key sm-p" x="338" y="10" width="134" height="18" rx="9"/>' + T(405, 23, "+ same as estradiol", "sm-xs sm-pt sm-bold", "middle") +
    '<rect class="sm-key sm-m" x="338" y="34" width="134" height="18" rx="9"/>' + T(405, 47, "− the opposite", "sm-xs sm-mt sm-bold", "middle"));

  /* ----- the body ----- */
  o += '<rect class="sm-panel" x="6" y="64" width="232" height="406" rx="12"/>';
  o += '<path class="sm-skin sm-arm" d="' + D.ARMS + '"/><path class="sm-skin" d="' + D.NECK + '"/><path class="sm-skin" d="' + D.TORSO + '"/>';
  /* head, brain, hypothalamus and pituitary */
  o += '<g class="sm-skin">' + D.HEAD + "</g>";
  o += HOT("The brain, front view. Estrogen's negative feedback acts on the hypothalamus and pituitary; that brake is what holds LH and FSH down.",
    '<path class="sm-brain" d="' + D.BRAIN + '"/><path class="sm-gyr" d="' + D.GYR + '"/>');
  o += HOT(D.CARD.ov.info + " " + g.name + ": " + fx.ov.info,
    '<ellipse class="sm-tis ' + cls("ov") + '" cx="122" cy="113" rx="7" ry="4.4"/><path class="sm-stalk" d="M122 117.4V121"/><circle class="sm-pit" cx="122" cy="125" r="4.2"/>');
  /* the LH and FSH monitor */
  var amp = { lo: 5, n: 12, hi: 21 }[g.lhfsh];
  o += HOT("LH and FSH pulses from the pituitary. " + { lo: "Smaller here: estrogen's feedback holds them down.", n: "Not held down the way estradiol holds them: ovulation isn't inhibited (a minus on his table).", hi: "Larger here: clomiphene blocks estrogen's negative feedback, so the pulses grow and drive the ovary to ovulate." }[g.lhfsh],
    '<path class="sm-probe" d="M118.1 123.4L90 112"/><rect class="sm-mon" x="12" y="74" width="78" height="52" rx="7"/><path class="sm-base" d="M18 119H84"/>' +
    '<path class="sm-trace ' + cls("ov") + 't" d="' + smTrace(amp, t, 18, 84, 119) + '"/>' + T(18, 87, "LH, FSH", "sm-xs sm-bold sm-ink", "start"));
  /* breasts */
  var bon = fx.br.s === "+";
  D.BR.forEach(function (b, j) {
    var lob = "", nx = b.cx, ny = b.cy + 3;
    for (k = 0; k < 5; k++) { var a = -Math.PI / 2 + k * 2 * Math.PI / 5 + (j ? 0.3 : 0), r = k === 2 || k === 3 ? 10.5 : 12; lob += smLobule(b.cx + r * Math.cos(a), b.cy + 2 + r * 0.92 * Math.sin(a), nx, ny, bon && (k % 2 === 0), t, k * 0.37 + j * 0.5); }
    o += HOT(D.CARD.br.info + " " + g.name + ": " + fx.br.info, '<path class="sm-tis sm-brst ' + cls("br") + '" d="' + b.d + '"/>' + lob + '<circle class="sm-areola" cx="' + nx + '" cy="' + ny + '" r="3.6"/>');
  });
  /* liver */
  o += HOT(D.CARD.li.info + " " + g.name + ": " + fx.li.info, '<path class="sm-tis ' + cls("li") + '" d="' + D.LIV + '"/><path class="sm-livl" d="M131 231C128 240 126 248 124 255"/>');
  /* femurs and hips */
  o += HOT(D.CARD.bo.info + " " + g.name + ": " + fx.bo.info, '<g class="sm-bone">' + D.FHEAD + '<path d="' + D.FEM + '"/>' + D.FHEAD_IN + "</g>");
  /* tubes, ovaries, uterus */
  o += '<path class="sm-tube" d="' + D.TUBE_R + '"/><path class="sm-tube" d="' + D.TUBE_L + '"/><path class="sm-fimb" d="' + D.FIMB + '"/>';
  var ovs = [[163, 302], [81, 302]], fol = "";
  ovs.forEach(function (c, j) {
    fol += '<ellipse class="sm-tis sm-ovy ' + cls("ov") + '" cx="' + c[0] + '" cy="' + c[1] + '" rx="10.5" ry="6.6"/>';
    var sm = [[-5, -1.5], [-1, 2.4], [4.5, -2]];
    if (g.ovy === "quiet") sm.forEach(function (q) { fol += '<circle class="sm-fol" cx="' + f1(c[0] + q[0]) + '" cy="' + f1(c[1] + q[1]) + '" r="1.4"/>'; });
    else if (g.ovy === "one") fol += '<circle class="sm-fol" cx="' + f1(c[0] - 4.5) + '" cy="' + f1(c[1] + 1.5) + '" r="1.4"/><circle class="sm-fol sm-big" cx="' + f1(c[0] + 2.5) + '" cy="' + f1(c[1] - 0.5) + '" r="3.4"/>';
    else fol += '<circle class="sm-fol sm-big" cx="' + f1(c[0] + (j ? -3 : 3)) + '" cy="' + f1(c[1] - 1) + '" r="4.4"/><circle class="sm-fol sm-big" cx="' + f1(c[0] + (j ? 4.2 : -4.2)) + '" cy="' + f1(c[1] + 1.2) + '" r="3"/>';
  });
  o += HOT("The ovaries. " + { quiet: "Only small follicles: with LH and FSH held down, none matures to ovulate.", one: "A follicle can still mature: the drug doesn't inhibit ovulation the way estradiol does (a minus on his table).", eggs: "With larger LH and FSH pulses the ovaries are driven to ovulate, and more than one egg can be released: twins, triplets, even quadruplets. Ovarian cysts are the other adverse effect." }[g.ovy], fol);
  if (g.ovy === "eggs") {
    var EP = [[[166, 296.5], [173, 293], [166, 288], [156, 287.5], [146, 291], [141, 295]], [[78, 296.5], [71, 293], [78, 288], [88, 287.5], [98, 291], [103, 295]]];
    EP.forEach(function (p, j) { var u = t ? ((t / 5200 + j * 0.45) % 1) : 0.42 + j * 0.2, q = smAt(p, u), op = Math.min(1, u / 0.1, (1 - u) / 0.1);
      o += '<g opacity="' + f1(op) + '"><circle class="sm-egg" cx="' + f1(q[0]) + '" cy="' + f1(q[1]) + '" r="2.6"/><circle class="sm-eggn" cx="' + f1(q[0]) + '" cy="' + f1(q[1]) + '" r="1"/></g>'; });
  }
  o += T(81, 321, "ovary", "sm-xs sm-mut", "middle");
  /* the uterus: muscle wall, then the lining (thick and glandular when stimulated, thin when not), then the cavity */
  var uon = fx.ut.s === "+";
  var endo = uon ? "M106.5 297.5L137.5 297.5L122.5 336L121.5 336Z" : "M111.5 300.5L132.5 300.5L122.5 327.5L121.5 327.5Z";
  var cav = uon ? "M116.5 302.5L127.5 302.5L122.3 318L121.7 318Z" : "M114 302L130 302L122.3 323L121.7 323Z";
  var glands = uon ? '<path class="sm-gland" d="M111 300.5C112 304 110.5 306 112 309.5M133 300.5C132 304 133.5 306 132 309.5M115.5 309C116.5 312.5 115 315 117 318M128.5 309C127.5 312.5 129 315 127 318M119 320C120 323 119 326 120.5 329M125 320C124 323 125 326 123.5 329"/>' : "";
  o += HOT(D.CARD.ut.info + " " + g.name + ": " + fx.ut.info,
    '<path class="sm-myo" d="' + D.UT + '"/><path class="sm-cerv" d="' + D.CERV + '"/><path class="sm-tis sm-endo ' + cls("ut") + '" d="' + endo + '"/>' + glands + '<path class="sm-cav" d="' + cav + '"/>');
  /* the magnified bone at the top of the femur: the trabeculae fill in or thin out */
  var BC = D.BONE_C, BRr = D.BONE_R, bon2 = fx.bo.s === "+", st1 = "";
  D.STRUTS.forEach(function (s) { if (bon2 || s[4]) { var d = "M" + s[0] + " " + s[1] + "L" + s[2] + " " + s[3]; st1 += d; } });
  o += HOT(D.CARD.bo.info + " " + g.name + ": " + fx.bo.info,
    '<path class="sm-cone" d="' + D.CONE + '"/>' +
    '<circle class="sm-marrow" cx="' + BC[0] + '" cy="' + BC[1] + '" r="' + BRr + '"/>' +
    '<path class="sm-tb-o' + (bon2 ? "" : " sm-thin") + '" d="' + st1 + '"/><path class="sm-tb-i' + (bon2 ? "" : " sm-thin") + '" d="' + st1 + '"/>' +
    '<circle class="sm-lens ' + cls("bo") + '" cx="' + BC[0] + '" cy="' + BC[1] + '" r="' + BRr + '"/><circle class="sm-ring" cx="' + D.RING[0] + '" cy="' + D.RING[1] + '" r="5"/>');
  o += T(BC[0], BC[1] + BRr + 14, "bone", "sm-xs sm-mut", "middle");
  /* the panel frame over the crop */
  o += '<rect class="sm-frame" x="6" y="64" width="232" height="406" rx="12"/>';

  /* ----- the cards and their leaders ----- */
  var CY = D.CARDY;
  D.ORDER.forEach(function (key, j) {
    var y = CY[j], a = D.CARD[key].to, e = fx[key];
    o += '<path class="sm-lead" d="M246 ' + (y + 37) + "L" + f1(a[0]) + " " + f1(a[1]) + '"/>' + smBadge(a[0], a[1], e.s);
    o += smCard(y, key, g, D);
  });

  /* ----- his summary table ----- */
  var TY = D.TY, X0 = 112, CW = 72, RH = 21;
  o += T(8, TY - 6, "HIS SUMMARY TABLE", "sm-xs sm-cap", "start") + T(160, TY - 6, "(compared with estradiol)", "sm-xs sm-mut", "start");
  o += '<rect class="sm-tbl" x="6" y="' + TY + '" width="468" height="' + (20 + RH * 4) + '" rx="8"/>';
  D.COLS.forEach(function (c, i) { o += T(X0 + CW * i + CW / 2, TY + 14, c[1], "sm-xs sm-bold sm-ink", "middle"); });
  o += '<path class="sm-rule" d="M6 ' + (TY + 20) + "H474" + '"/>';
  D.DRUGS.forEach(function (dr, r) {
    var y = TY + 20 + RH * r, on = r === st.d;
    if (on) o += '<rect class="sm-row" x="7" y="' + (y + 1) + '" width="466" height="' + (RH - 2) + '" rx="5"/>';
    o += T(14, y + 15, dr.name.toLowerCase(), "sm-xs " + (on ? "sm-bold sm-ink" : "sm-mut"), "start");
    D.COLS.forEach(function (c, i) {
      var e = dr.fx[c[0]], p = e.s === "+", x = X0 + CW * i, cell = '<rect class="sm-cell ' + (p ? "sm-p" : "sm-m") + (on ? " is-on" : "") + '" x="' + (x + 4) + '" y="' + (y + 3) + '" width="' + (CW - 8) + '" height="' + (RH - 6) + '" rx="4"/>';
      cell += T(x + CW / 2, y + 15, r === 0 ? e.w : (p ? "+" : "−"), "sm-xs sm-bold " + (p ? "sm-pt" : "sm-mt"), "middle");
      o += HOT(dr.name + ", " + c[2] + ": " + (r === 0 ? e.w + " (the reference)." : (p ? "+, the same effect as estradiol: " : "−, the opposite of estradiol: ") + e.w + "."), cell);
    });
  });
  if (st.d === 1 || st.d === 2) {
    var ux = X0 + CW * 2;
    o += '<rect class="sm-part" x="' + (ux + 1) + '" y="' + (TY + 20 + RH + 1) + '" width="' + (CW - 2) + '" height="' + (RH * 2 - 2) + '" rx="6"/>';
    o += T(ux + CW / 2, TY + 20 + RH * 4 + 16, "tamoxifen and raloxifene part ways here", "sm-xs sm-bold sm-ink", "middle");
  }
  return o;
}

function smSay(st, D) { var g = D.DRUGS[st.d]; return [g.say, g.ro]; }

/* ---------- the drugs, from his summary table and his slides on each SERM ---------- */
const CARD = {
  ov: { name: "OVULATION", to: [129, 113], info: "Ovulation: the hypothalamus and pituitary send LH and FSH to the ovary, and estrogen's negative feedback holds them down." },
  br: { name: "BREAST CELLS", to: [161, 202], info: "Breast cell proliferation: estrogen stimulates it, and ER-positive breast cancer grows on it." },
  li: { name: "SERUM LIPIDS", to: [151, 241], info: "Serum lipids, drawn at the liver: estrogen raises HDL, unlike testosterone, which lowers it." },
  ut: { name: "UTERINE LINING", to: [134, 305], info: "Uterine cell proliferation: estrogen grows the uterine muscle and develops the lining (endometrium)." },
  bo: { name: "BONE DENSITY", to: [232.3, 423.4], info: "Bone density, magnified at the top of the femur: estrogen antagonizes PTH-mediated bone calcium resorption, which protects bone." },
};
const OPP = [["opposite of estradiol", "sm-ink"], ["on his table", "sm-mut"]];
const DRUGS = [
  { name: "Estradiol", brand: "E2", use: "the reference row: the body's main estrogen", watch: "watch: clots, breast and uterine cancer", lhfsh: "lo", ovy: "quiet", ro: "estradiol · the reference",
    say: "Estradiol is the reference on his table, and every tissue here is a plus: it inhibits ovulation (its negative feedback holds LH and FSH down), stimulates breast and uterine cells, promotes bone density and improves serum lipids. Each SERM is compared with it, tissue by tissue.",
    fx: {
      ov: { s: "+", w: "inhibits", l: [["inhibits ovulation: its negative"], ["feedback holds LH and FSH down"]], info: "inhibits ovulation; its negative feedback holds LH and FSH down." },
      br: { s: "+", w: "stimulates", l: [["stimulates breast cell"], ["proliferation"]], info: "stimulates breast cell proliferation." },
      li: { s: "+", w: "improves", l: [["improves serum lipids:"], ["HDL goes up"]], info: "improves serum lipids (it raises HDL)." },
      ut: { s: "+", w: "stimulates", l: [["stimulates the lining:"], ["the endometrium grows"]], info: "stimulates uterine cells: the endometrium grows. Giving progesterone with it reduces the added uterine cancer risk." },
      bo: { s: "+", w: "promotes", l: [["promotes bone density: opposes"], ["PTH-driven calcium resorption"]], info: "promotes bone density." },
    } },
  { name: "Tamoxifen", brand: "Nolvadex", use: "use: ER-positive breast cancer", watch: "watch: uterine cancer and clots", lhfsh: "n", ovy: "one", ro: "tamoxifen · breast − uterus +",
    say: "Tamoxifen is an antagonist in the breast, so breast cells stop proliferating: it treats breast cancer, but only ER-positive tumors (about half respond). In the uterus it is an agonist: the endometrium proliferates and uterine cancer risk rises. Like estrogen it strengthens bone and improves lipids, and it raises the clot risk.",
    fx: {
      ov: { s: "−", w: "doesn't inhibit", l: [["doesn't inhibit ovulation"]], info: "doesn't inhibit ovulation (a minus on his table)." },
      br: { s: "−", w: "blocks", l: [["antagonist: breast cells stop"], ["proliferating, so it treats"], ["ER-positive breast cancer", "sm-ok"]], info: "an antagonist, so breast cells stop proliferating. It is given only when the tumor is ER-positive, with about a 50 percent response." },
      li: { s: "+", w: "improves", l: [["improves lipids:"], ["lowers LDL (his figure)"]], info: "the same as estradiol: it improves lipids; his tamoxifen figure says it lowers LDL." },
      ut: { s: "+", w: "stimulates", l: [["agonist: the endometrium"], ["proliferates, so uterine"], ["cancer risk rises", "sm-bad"]], info: "the receptor there is a different subtype, and tamoxifen activates it: endometrial cells proliferate and uterine cancer risk rises." },
      bo: { s: "+", w: "promotes", l: [["promotes bone density:"], ["strengthens bones"]], info: "the same as estradiol: it strengthens bones." },
    } },
  { name: "Raloxifene", brand: "Evista", use: "use: osteoporosis in postmenopausal women", watch: "watch: clots (DVT and PE, 2 to 3 times)", lhfsh: "n", ovy: "one", ro: "raloxifene · bone + uterus −",
    say: "Raloxifene prefers the receptors in bone: it acts like estrogen there, so it treats osteoporosis in postmenopausal women, but it causes no proliferation of the endometrium or of breast tumor cells. The uterus is where it parts ways with tamoxifen. Its side effect: a 2- to 3-fold rise in deep vein thrombosis and pulmonary embolism.",
    fx: {
      ov: { s: "−", w: "doesn't inhibit", l: [["doesn't inhibit ovulation"]], info: "doesn't inhibit ovulation (a minus on his table)." },
      br: { s: "−", w: "blocks", l: [["no proliferation of breast"], ["tumor cells"]], info: "no proliferation of breast tumor cells. It has a high affinity for both ER-alpha and ER-beta." },
      li: { s: "+", w: "improves", l: [["improves serum lipids"]], info: "the same as estradiol: it improves serum lipids." },
      ut: { s: "−", w: "no stimulation", l: [["no endometrial proliferation:"], ["the lining isn't stimulated"]], info: "no proliferation of the endometrium: the column that separates it from tamoxifen." },
      bo: { s: "+", w: "promotes", l: [["promotes bone density: treats"], ["osteoporosis after menopause", "sm-ok"]], info: "it prefers the receptors in bone and promotes bone density: it treats osteoporosis in postmenopausal women." },
    } },
  { name: "Clomiphene", brand: "Clomid", use: "use: to induce ovulation (first-line for fertility)", watch: "watch: multiple births, ovarian cysts", lhfsh: "hi", ovy: "eggs", ro: "clomiphene · ovulation induced",
    say: "Clomiphene, a weak agonist and strong antagonist at the estrogen receptors: by blocking them it opposes the negative feedback of the body's own estrogen, so the LH and FSH pulses grow larger and the ovary is driven to ovulate. It works only when the hypothalamic-pituitary-ovarian axis is intact. Its whole row on his table is a minus. Watch for multiple births and ovarian cysts.",
    fx: {
      ov: { s: "−", w: "induces it", l: [["blocks estrogen's feedback:"], ["bigger LH and FSH pulses,"], ["ovulation induced", "sm-ok"]], info: "it blocks estrogen's negative feedback, so the LH and FSH pulses grow larger and the ovary ovulates." },
      br: { s: "−", w: "opposite", l: OPP, info: "the opposite of estradiol on his table." },
      li: { s: "−", w: "opposite", l: OPP, info: "the opposite of estradiol on his table." },
      ut: { s: "−", w: "opposite", l: OPP, info: "the opposite of estradiol on his table." },
      bo: { s: "−", w: "opposite", l: OPP, info: "the opposite of estradiol on his table." },
    } },
];
const COLS = [["ov", "ovulation", "ovulation"], ["br", "breast", "breast cell proliferation"], ["ut", "uterus", "uterine cell proliferation"], ["bo", "bone", "bone density"], ["li", "lipids", "serum lipids"]];
const WHY = "Why one drug differs by tissue: estrogen has two receptor subtypes, ER-alpha and ER-beta, and each tissue expresses them at different levels; how the receptor binds DNA also depends on the shape the drug gives it. So a SERM can be an agonist in one tissue and an antagonist in another.";

export default function sermmap() {
  const A = staticArt();
  const D = Object.assign({}, A, {
    DRUGS, CARD, COLS, WHY, ANIM: true,
    ORDER: ["ov", "br", "li", "ut", "bo"], CARDY: [66, 148, 230, 312, 394], TY: 492,
    INIT: { d: 1 }, STEPKEY: "d", STEPMAX: 3, PLAYMS: 4200,
  });
  return makeFig({
    id: "sermmap", lec: "sexster", fig: "Fig 11", short: "The SERM map", hint: "pick · hover",
    title: "One drug, different tissues: the SERM map",
    caption: "Estradiol and the three SERMs on the five tissues of his summary table. Estrogen's two receptors, ER-alpha and ER-beta, sit at different levels in each tissue, so one drug can act like estrogen in one and against it in another. Pick a drug.",
    W: 480, H: 622,
    label: "A front view of a woman with the hypothalamus and pituitary, the breasts, the liver, the uterus with its lining, the ovaries and the femurs, a magnified piece of bone, five cards that say whether the chosen drug acts like estradiol or the opposite in each tissue, and his summary table of estradiol, tamoxifen, raloxifene and clomiphene.",
    D, render: smRender, say: smSay, helpers: [smBadge, smTrace, smLobule, smAt, smCard],
    controls: `<div class="am-controls" role="group" aria-label="Drug">` + DRUGS.map((g, i) => `<button type="button" class="am-btn" data-amk="d" data-amv="${i}">${g.name}</button>`).join("") +
      `<button type="button" class="am-btn" data-amplay aria-pressed="false">Play</button></div>`,
    sources: [
      "From the L18 notes (Dr. Fasinu, recording and slides): estrogen's two receptor subtypes, ER-alpha and ER-beta, with differential tissue expression; his SERM summary table (estradiol, tamoxifen, raloxifene, clomiphene; a plus for the same effect as estradiol, a minus for the opposite) for ovulation, breast cell proliferation, uterine cell proliferation, bone density and serum lipids; tamoxifen as a breast antagonist and uterine agonist for ER-positive breast cancer only (about 50 percent response), with his figure's lower LDL and stronger bones; raloxifene for postmenopausal osteoporosis, high affinity for both receptors, no endometrial or breast tumor proliferation, and a 2- to 3-fold rise in DVT and PE; clomiphene as a weak agonist and strong antagonist that opposes estrogen's negative feedback, so the LH and FSH pulses grow larger, in women with an intact axis, with multiple births and ovarian cysts; estrogen's effects on HDL and on PTH-mediated bone resorption. The rarely used SERMs on his table (toremifene, ospemifene, bazedoxifene, fulvestrant) are left out, as he said.",
      "Where his words and the slides differ, the figure follows the notes: he said clomiphene is a weak agonist at ER-alpha and a strong antagonist at ER-beta, while his slide doesn't assign the subtypes (and standard texts call it a mixed agonist-antagonist without that split), so no subtype is drawn for it. The ovulation column is his table's comparison with estradiol: a drug with a minus there doesn't inhibit ovulation. Raloxifene is given after menopause, so its ovaries show the table's comparison, not a postmenopausal woman's own ovaries. His effects slide says estrogen slightly raises LDL while his hormone therapy figure says it lowers it; the lipid cards name only HDL for estradiol and his tamoxifen figure's LDL for tamoxifen.",
      "For accuracy of the drawing (outside sources, for how it looks and behaves, not for what is labeled): organ positions follow a standard front view of the female body and pelvis (uterus with its tubes, the ovaries beside it, the femoral heads in the hips); the endometrium is drawn thicker and glandular under estrogen's proliferative effect and thin without it, and the trabeculae at the top of the femur (where osteoporotic hip fractures happen) thin out where bone density falls, as in histology and bone texts (Ross and Pawlina, Histology; Katzung's Basic and Clinical Pharmacology, the SERM and estrogen chapters). The LH and FSH trace is qualitative: pulse heights only say smaller, ordinary or larger.",
      "Schematic and not to scale: the uterus, ovaries and breast lobules are enlarged, and the bone is a magnified sample, not a measured density. Educational, not medical advice.",
    ],
    css: `
.anima[data-anima="sermmap"] .am-svg{max-width:560px}
.anima .sermmap-svg .t.sm-xs{font-size:11.5px}
.anima .sermmap-svg .t.sm-name{font-size:15px;font-weight:700;fill:var(--anatomy-strong)}
.anima .sermmap-svg .t.sm-cap{fill:var(--anatomy-muted);font-weight:700;letter-spacing:.06em;font-size:11px}
.anima .sermmap-svg .t.sm-bold{font-weight:700}
.anima .sermmap-svg .t.sm-ink{fill:var(--anatomy-strong)}
.anima .sermmap-svg .t.sm-mut{fill:var(--anatomy-muted)}
.anima .sermmap-svg .t.sm-ok{fill:var(--bx-stim);font-weight:700}
.anima .sermmap-svg .t.sm-bad{fill:var(--bx-inhib);font-weight:700}
.anima .sermmap-svg .t.sm-pt{fill:color-mix(in srgb,var(--bx-gold) 62%,var(--anatomy-strong))}
.anima .sermmap-svg .t.sm-mt{fill:var(--bx-blue)}
.anima .sermmap-svg .sm-panel{fill:var(--anatomy-shade-1)}
.anima .sermmap-svg .sm-frame{fill:none;stroke:var(--anatomy-lo);stroke-width:1.2}
.anima .sermmap-svg .sm-skin,.anima .sermmap-svg .sm-skin ellipse{fill:var(--anatomy-face);stroke:var(--anatomy-mid);stroke-width:1.2;stroke-linejoin:round}
.anima .sermmap-svg .sm-arm{fill:var(--anatomy-shade-3)}
.anima .sermmap-svg .sm-brain{fill:var(--bx-violet-soft);stroke:var(--bx-violet);stroke-width:1.1}
.anima .sermmap-svg .sm-gyr{fill:none;stroke:var(--bx-violet);stroke-width:.8;opacity:.6;stroke-linecap:round}
.anima .sermmap-svg .sm-stalk{fill:none;stroke:var(--anatomy-mid);stroke-width:2.2;stroke-linecap:round}
.anima .sermmap-svg .sm-pit{fill:var(--bx-violet-soft);stroke:var(--bx-violet);stroke-width:1.1}
.anima .sermmap-svg .sm-tis{stroke-width:1.4;stroke-linejoin:round}
.anima .sermmap-svg .sm-p{fill:var(--bx-gold-soft);stroke:var(--bx-gold)}
.anima .sermmap-svg .sm-m{fill:var(--bx-blue-soft);stroke:var(--bx-blue)}
.anima .sermmap-svg .sm-brst{stroke-width:1.2}
.anima .sermmap-svg .sm-duct{fill:none;stroke:var(--bx-cyto-line);stroke-width:.9;opacity:.8}
.anima .sermmap-svg .sm-ac{fill:var(--bx-cyto);stroke:var(--bx-cyto-line);stroke-width:.7}
.anima .sermmap-svg .sm-div{fill:var(--bx-eosin)}
.anima .sermmap-svg .sm-areola{fill:var(--bx-eosin);stroke:var(--bx-cyto-line);stroke-width:.8}
.anima .sermmap-svg .sm-livl{fill:none;stroke:var(--anatomy-mid);stroke-width:.8;opacity:.7}
.anima .sermmap-svg .sm-bone path,.anima .sermmap-svg .sm-bone circle{fill:color-mix(in srgb,var(--bx-fat-line) 40%,var(--anatomy-face));stroke:color-mix(in srgb,var(--bx-fat-line) 60%,var(--anatomy-mid));stroke-width:1.1}
.anima .sermmap-svg .sm-bone .sm-bonein{stroke:none}
.anima .sermmap-svg .sm-tube{fill:none;stroke:var(--bx-cyto-line);stroke-width:2.6;stroke-linecap:round}
.anima .sermmap-svg .sm-fimb{fill:none;stroke:var(--bx-cyto-line);stroke-width:1.2;stroke-linecap:round}
.anima .sermmap-svg .sm-fol{fill:var(--bx-lumen);stroke:var(--anatomy-mid);stroke-width:.7}
.anima .sermmap-svg .sm-fol.sm-big{stroke:var(--bx-gold);stroke-width:1}
.anima .sermmap-svg .sm-egg{fill:var(--bx-lumen);stroke:var(--bx-hot);stroke-width:1.2}
.anima .sermmap-svg .sm-eggn{fill:var(--bx-nuc)}
.anima .sermmap-svg .sm-myo{fill:var(--bx-cyto);stroke:var(--bx-cyto-line);stroke-width:1.3}
.anima .sermmap-svg .sm-cerv{fill:none;stroke:var(--bx-cyto-line);stroke-width:1}
.anima .sermmap-svg .sm-endo{stroke-width:1}
.anima .sermmap-svg .sm-gland{fill:none;stroke:var(--bx-cyto-line);stroke-width:.9;stroke-linecap:round}
.anima .sermmap-svg .sm-cav{fill:var(--bx-lumen);stroke:var(--bx-cyto-line);stroke-width:.7}
.anima .sermmap-svg .sm-marrow{fill:var(--bx-blood-soft)}
.anima .sermmap-svg .sm-tb-o{fill:none;stroke:var(--sm-bone-o);stroke-width:3.6;stroke-linecap:round}
.anima .sermmap-svg{--sm-bone:var(--anatomy-top);--sm-bone-o:var(--anatomy-mid)}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]) .anima .sermmap-svg{--sm-bone:#e9dccb;--sm-bone-o:#8a7a6c} }
:root[data-theme="dark"] .anima .sermmap-svg{--sm-bone:#e9dccb;--sm-bone-o:#8a7a6c}
.anima .sermmap-svg .sm-tb-i{fill:none;stroke:var(--sm-bone);stroke-width:2.2;stroke-linecap:round}
.anima .sermmap-svg .sm-tb-o.sm-thin{stroke-width:2.2}
.anima .sermmap-svg .sm-tb-i.sm-thin{stroke-width:1}
.anima .sermmap-svg .sm-lens{fill:none;stroke-width:2.2}
.anima .sermmap-svg .sm-ring{fill:none;stroke:var(--anatomy-mid);stroke-width:1;stroke-dasharray:2 2}
.anima .sermmap-svg .sm-cone{fill:none;stroke:var(--anatomy-mid);stroke-width:.8;stroke-dasharray:2 2}
.anima .sermmap-svg .sm-mon{fill:var(--anatomy-face);stroke:var(--anatomy-lo);stroke-width:1.1}
.anima .sermmap-svg .sm-base{fill:none;stroke:var(--anatomy-lo);stroke-width:1}
.anima .sermmap-svg .sm-trace{fill:none;stroke-width:1.8;stroke-linejoin:round}
.anima .sermmap-svg .sm-trace.sm-pt{stroke:var(--bx-gold)}
.anima .sermmap-svg .sm-trace.sm-mt{stroke:var(--bx-blue)}
.anima .sermmap-svg .sm-probe{fill:none;stroke:var(--anatomy-lo);stroke-width:1;stroke-dasharray:3 3}
.anima .sermmap-svg .sm-lead{fill:none;stroke:var(--anatomy-mid);stroke-width:.9}
.anima .sermmap-svg .sm-bdg{stroke-width:1.4}
.anima .sermmap-svg .sm-bdgm{fill:none;stroke-width:1.8;stroke-linecap:round}
.anima .sermmap-svg .sm-bdgm.sm-pt{stroke:color-mix(in srgb,var(--bx-gold) 62%,var(--anatomy-strong))}
.anima .sermmap-svg .sm-bdgm.sm-mt{stroke:var(--bx-blue)}
.anima .sermmap-svg .sm-card{fill:var(--anatomy-face);stroke-width:1.2}
.anima .sermmap-svg .sm-card.sm-cp{stroke:var(--bx-gold)}
.anima .sermmap-svg .sm-card.sm-cm{stroke:var(--bx-blue)}
.anima .sermmap-svg .sm-chip,.anima .sermmap-svg .sm-key{stroke-width:1.1}
.anima .sermmap-svg .sm-tbl{fill:var(--anatomy-face);stroke:var(--anatomy-lo);stroke-width:1}
.anima .sermmap-svg .sm-rule{fill:none;stroke:var(--anatomy-lo);stroke-width:1}
.anima .sermmap-svg .sm-row{fill:var(--anatomy-shade-1);stroke:var(--anatomy-lit);stroke-width:1.2}
.anima .sermmap-svg .sm-cell{stroke-width:.8;opacity:.55}
.anima .sermmap-svg .sm-cell.is-on{opacity:1}
.anima .sermmap-svg .sm-part{fill:none;stroke:var(--anatomy-lit);stroke-width:2;stroke-dasharray:4 3}
`,
  });
}
