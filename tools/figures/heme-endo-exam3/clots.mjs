// Fig 10: why estrogen-active drugs cause clots (L18 Estrogens and Androgens, Dr. Fasinu: "The natural estrogens",
// "What estrogen does", "Estrogen's adverse effects, contraindications and interactions", "Raloxifene", "Aromatase
// inhibitors", his opening case and Case 5). Three views at once:
// - a schematic front view of a woman (patient's right on the viewer's left) with the two ways an estrogen gets in: a
//   pill swallowed (mouth, esophagus, stomach, gut, portal vein, the liver first) or a patch on the skin (straight into
//   the general blood), and the path a clot takes from a deep calf vein up the inferior vena cava, through the right
//   heart and the pulmonary artery to a lung;
// - the liver, magnified: hepatocytes on a sinusoid, and what they put into the blood, clotting factors 2, 7, 9 and 10
//   (up) and antithrombin III (down), against the normal level; warfarin holds the four factors down and an
//   estrogen pushes them back up;
// - a deep leg vein, magnified: red cells, the factors and antithrombin III flowing past a valve, and a clot that starts
//   in the valve pocket, grows with the risk and, at the top of the range, breaks off and travels to the lung.
// Under them a qualitative clot-risk bar (the drug, immobilization, warfarin's cut) and the drugs that share the risk.
// Pick a drug; switch on "Immobilized after surgery" and "Also on warfarin". Schematic, not to scale; the only number
// is raloxifene's 2 to 3 times from his slide.
import { makeFig, f1, T, L, HOT } from "./shared.mjs";

/* ---------- smooth path through points (Catmull-Rom as cubic Beziers); used at build time and in the page ---------- */
function clSm(p, closed) {
  var n = p.length, d = "M" + f1(p[0][0]) + " " + f1(p[0][1]), last = closed ? n : n - 1, i, a, b, c, e;
  for (i = 0; i < last; i++) {
    a = p[(i - 1 + n) % n]; b = p[i]; c = p[(i + 1) % n]; e = p[(i + 2) % n];
    if (!closed) { if (i === 0) a = b; if (i + 2 >= n) e = c; }
    d += "C" + f1(b[0] + (c[0] - a[0]) / 6) + " " + f1(b[1] + (c[1] - a[1]) / 6) + " " + f1(c[0] - (e[0] - b[0]) / 6) + " " + f1(c[1] - (e[1] - b[1]) / 6) + " " + f1(c[0]) + " " + f1(c[1]);
  }
  return d + (closed ? "Z" : "");
}
const MX = 220; /* the body's midline is x = 110: mirror with MX - x */
const mir = (p) => p.map((q) => [MX - q[0], q[1]]);

/* ---------- build-time geometry for the body ---------- */
function staticArt() {
  const o = {};
  /* outline: the right side (viewer's right) from the ankle up to the neck, the left side back down, then the legs' inner edges */
  const RO = [[138, 474], [146, 448], [150, 420], [148, 398], [152, 385], [158, 345], [160, 310], [156, 290], [150, 262], [152, 236], [156, 206], [158, 176], [161, 150], [157, 134], [142, 126], [118, 121]];
  const LO = mir(RO).reverse();
  const RI = [[112, 324], [116, 355], [118, 385], [118, 398], [117, 420], [120, 448], [124, 474]];
  const LI = mir(RI).reverse();
  const tail = (p) => clSm(p, false).replace(/^M[^C]*/, "");
  o.BODY = clSm(RO, false) + "L" + f1(LO[0][0]) + " " + f1(LO[0][1]) + tail(LO) + "L" + f1(LI[0][0]) + " " + f1(LI[0][1]) + tail(LI) + "Q110 319 112 324" + tail(RI) + "Z";
  const ARM = [[157, 132], [167, 140], [172, 170], [174, 205], [178, 240], [182, 272], [184, 296], [180, 306], [173, 304], [171, 290], [167, 262], [163, 232], [161, 200], [160, 172]];
  o.ARMS = clSm(ARM, true) + clSm(mir(ARM), true);
  /* lungs (the left one, on the viewer's right, with its notch for the heart), the heart, the liver, the stomach */
  o.LUNG_R = clSm([[100, 146], [90, 142], [80, 152], [74, 176], [72, 200], [76, 212], [92, 210], [100, 204], [102, 176]], true);
  o.LUNG_L = clSm([[120, 146], [130, 142], [140, 152], [146, 176], [148, 200], [144, 212], [130, 212], [124, 206], [126, 196], [120, 186], [118, 170]], true);
  o.HEART = clSm([[100, 186], [108, 180], [120, 182], [128, 190], [130, 200], [122, 212], [112, 216], [102, 208], [98, 196]], true);
  o.LIVER = clSm([[76, 216], [96, 214], [116, 216], [134, 218], [142, 222], [132, 230], [114, 240], [96, 248], [80, 246], [72, 232]], true);
  o.STOM = clSm([[124, 222], [136, 216], [148, 220], [153, 234], [148, 250], [134, 256], [124, 252], [130, 244], [140, 238], [138, 228]], true);
  o.GUT = clSm([[118, 256], [130, 262], [128, 270], [106, 272], [104, 280], [130, 284], [128, 292], [106, 296]], false);
  o.ESO = "M110 100L110 150C110 190 116 210 128 220";
  o.PORTAL = "M116 263Q112 252 112 241";
  /* veins: the inferior vena cava up to the right heart, the iliac and deep leg veins; the pulmonary artery to both lungs */
  o.IVC = "M100 306L100 226Q100 212 104 206";
  o.VEIN_L = clSm([[100, 306], [96, 318], [94, 350], [92, 388], [91, 410], [92, 440], [90, 474]], false);
  o.VEIN_R = clSm([[100, 306], [112, 314], [124, 330], [126, 350], [128, 388], [129, 410], [128, 440], [130, 474]], false);
  o.PA = "M116 184Q116 172 112 168L96 168Q88 170 84 178M112 168L126 166Q134 168 137 176";
  /* the patch on the lower abdomen and the small vein it drains into */
  o.PATCH_V = "M140 303Q128 310 112 314";
  /* paths the dots ride */
  o.P_ORAL = [[110, 98], [110, 150], [113, 192], [126, 218], [142, 232], [138, 250], [124, 258], [130, 266], [116, 263], [112, 250], [110, 238], [100, 230]];
  o.P_PATCH = [[144, 298], [140, 303], [128, 310], [112, 314], [100, 306], [100, 250], [100, 226], [104, 206]];
  o.P_EMB = [[91, 428], [92, 388], [94, 350], [96, 318], [100, 306], [100, 250], [100, 226], [104, 206], [112, 194], [116, 184], [114, 170], [100, 168], [90, 170], [84, 178]];
  return o;
}

/* ---------- page helpers (serialized into the page) ---------- */
/* the point a fraction u along a polyline */
function clAt(p, u) {
  var Ls = [], tot = 0, i, s;
  for (i = 1; i < p.length; i++) { var dd = Math.sqrt(Math.pow(p[i][0] - p[i - 1][0], 2) + Math.pow(p[i][1] - p[i - 1][1], 2)); Ls.push(dd); tot += dd; }
  s = Math.max(0, Math.min(1, u)) * tot;
  for (i = 0; i < Ls.length; i++) { if (s <= Ls[i] || i === Ls.length - 1) { var w = Ls[i] ? Math.min(1, s / Ls[i]) : 0; return [p[i][0] + (p[i + 1][0] - p[i][0]) * w, p[i][1] + (p[i + 1][1] - p[i][1]) * w]; } s -= Ls[i]; }
  return p[p.length - 1];
}
/* n drug diamonds riding a path, one lap per `per` ms; still frame: spread along it */
function clFlow(p, n, per, t, cls, r) {
  var o = "", i;
  for (i = 0; i < n; i++) {
    var u = t ? (((t / per) + i / n) % 1) : (i + 0.5) / n, q = clAt(p, u), a = Math.min(1, u * 8, (1 - u) * 8);
    o += '<path class="' + cls + '" d="M' + f1(q[0]) + " " + f1(q[1] - r) + "L" + f1(q[0] + r) + " " + f1(q[1]) + "L" + f1(q[0]) + " " + f1(q[1] + r) + "L" + f1(q[0] - r) + " " + f1(q[1]) + 'Z" opacity="' + f1(a) + '"/>';
  }
  return o;
}
/* the model: how much each control moves the liver, the risk and the clot */
function clModel(st, D) {
  var g = D.DRUGS[st.dr], eL = g.eL, cut = st.warf ? 0.45 - 0.25 * eL : 0, before = 0.1 + g.dd + (st.imm ? 0.35 : 0), r = Math.max(0.02, before - cut);
  return { g: g, eL: eL, F: 1 + 0.6 * eL - (st.warf ? 0.5 : 0), A: 1 - 0.4 * eL, before: before, cut: cut, r: r, s: r < 0.32 ? 0 : r < 0.85 ? 0.15 + 0.3 * (r - 0.32) / 0.53 : 1, emb: r >= 0.85,
    word: r < 0.09 ? "lower" : r <= 0.12 ? "baseline" : r < 0.5 ? "raised" : r < 0.85 ? "high" : "highest" };
}
/* the clot in the valve pocket: s from 0 (none) to 1 (it fills the pocket and trails down the vein) */
function clClot(s, t, D) {
  if (s <= 0.02) return "";
  var x0 = 300, y0 = 318, Lt = 8 + 78 * s, Th = 6 + 20 * s, o = "", k;
  var pts = [[x0 + 2, y0 - 2], [x0 + 22, y0 - 6.5], [x0 + 36 + Lt * 0.5, y0 + 0.5], [x0 + 36 + Lt, y0 + 2 + Th * 0.25], [x0 + 36 + Lt * 0.8, y0 + Th * 0.7], [x0 + 36 + Lt * 0.35, y0 + Th], [x0 + 30, y0 + Th * 0.8 + 4], [x0 + 14, y0 + 12 + Th * 0.2], [x0 + 4, y0 + 6]];
  o += '<path class="cl-clot" d="' + clSm(pts, true) + '"/>';
  /* fibrin strands and trapped red cells, kept inside the blob's middle */
  var fib = "", n = 6 + Math.round(10 * s);
  for (k = 0; k < n; k++) {
    var ax = x0 + 8 + ((k * 37) % 100) / 100 * (Lt + 22), ay = y0 + 3 + ((k * 53) % 100) / 100 * Th * 0.75, bx = ax + 7 + (k % 3) * 3, by = ay + ((k % 2) ? 4 : -2);
    var lim = function (x) { return Math.min(x0 + 30 + Lt * 0.9, x); };
    fib += "M" + f1(lim(ax)) + " " + f1(Math.max(y0 + 2, ay)) + "L" + f1(lim(bx)) + " " + f1(Math.min(y0 + Th * 0.8 + 2, Math.max(y0 + 2, by)));
  }
  o += '<path class="cl-fib" d="' + fib + '"/>';
  for (k = 0; k < Math.round(2 + 6 * s); k++) { var rx = x0 + 12 + ((k * 29) % 100) / 100 * (Lt + 14), ry = y0 + 4 + ((k * 61) % 100) / 100 * Th * 0.6; o += '<ellipse class="cl-rbc cl-trap" cx="' + f1(Math.min(x0 + 28 + Lt * 0.85, rx)) + '" cy="' + f1(ry) + '" rx="3.4" ry="2.2"/>'; }
  return o;
}
/* a red cell, seen edge-on as it tumbles */
function clRbc(x, y, a) { return '<ellipse class="cl-rbc" cx="' + f1(x) + '" cy="' + f1(y) + '" rx="5" ry="3.1" opacity="' + f1(a) + '"/><ellipse class="cl-rbcp" cx="' + f1(x) + '" cy="' + f1(y) + '" rx="2.2" ry="1.2" opacity="' + f1(a) + '"/>'; }

/* ---------- the body (left) ---------- */
function clBody(st, M, D) {
  var t = st.t || 0, o = "", g = M.g;
  o += '<rect class="cl-panel" x="6" y="52" width="208" height="424" rx="12"/>';
  o += '<path class="cl-skin cl-arm" d="' + D.ARMS + '"/><path class="cl-skin" d="M101 98V124H119V98Z"/><path class="cl-skin" d="' + D.BODY + '"/>';
  o += '<ellipse class="cl-skin" cx="110" cy="80" rx="17" ry="21"/><path class="cl-mouth" d="M105 94Q110 97 115 94"/>';
  /* veins behind the organs */
  o += HOT(D.INFO.ivc, '<path class="cl-ivc" d="' + D.IVC + '"/>');
  o += HOT(D.INFO.legv, '<path class="cl-vein" d="' + D.VEIN_L + '"/><path class="cl-vein" d="' + D.VEIN_R + '"/>');
  o += HOT(D.INFO.lung, '<path class="cl-lung" d="' + D.LUNG_R + '"/><path class="cl-lung" d="' + D.LUNG_L + '"/>');
  o += '<path class="cl-eso" d="' + D.ESO + '"/>';
  o += HOT(D.INFO.heart, '<path class="cl-heart" d="' + D.HEART + '"/>');
  o += HOT(D.INFO.pa, '<path class="cl-pa" d="' + D.PA + '"/>');
  o += HOT(D.INFO.stom, '<path class="cl-stom" d="' + D.STOM + '"/>');
  o += HOT(D.INFO.gut, '<path class="cl-gut-o" d="' + D.GUT + '"/><path class="cl-gut-i" d="' + D.GUT + '"/>');
  o += HOT(D.INFO.portal, '<path class="cl-portal" d="' + D.PORTAL + '"/>');
  var glow = M.eL > 0.02 ? '<path class="cl-halo" d="' + D.LIVER + '" opacity="' + f1(M.eL * (t ? 0.3 + 0.15 * Math.sin(t / 420) : 0.4)) + '"/><path class="cl-glow" d="' + D.LIVER + '" opacity="' + f1(0.35 + 0.65 * M.eL) + '"/>' : "";
  o += HOT(D.INFO.liver, '<path class="cl-liv" d="' + D.LIVER + '"/><path class="cl-livl" d="M116 217C114 226 112 234 108 242"/>' + glow);
  /* the way in: a pill swallowed, or a patch on the skin */
  if (g.route === "oral") {
    o += HOT(D.INFO.pill, '<g class="cl-pill"><rect x="128" y="85" width="16" height="8" rx="4"/><path d="M136 85V93"/></g>') + T(150, 93, "by mouth", "cl-xs cl-ink", "start");
    o += clFlow(D.P_ORAL, 7, 5200, t, "cl-drug", 3.2);
  }
  if (g.route === "patch") {
    o += HOT(D.INFO.patch, '<path class="cl-pv" d="' + D.PATCH_V + '"/><rect class="cl-patch" x="136" y="291" width="18" height="13" rx="3"/><path class="cl-patchl" d="M140 295.5H150M140 299.5H150"/>') + T(136, 318, "patch", "cl-xs cl-ink", "start");
    o += clFlow(D.P_PATCH, 5, 4600, t, "cl-drug", 3.2);
  }
  /* the clot's trip: from the calf vein to the lung (still frame: lodged in the lung, its route dotted) */
  if (M.emb) {
    o += '<path class="cl-route" d="M' + D.P_EMB.map(function (q) { return f1(q[0]) + " " + f1(q[1]); }).join("L") + '"/>';
    var ph = t ? ((t / 6500) % 1) : 1, at = ph < 0.2 ? 0 : Math.min(1, (ph - 0.2) / 0.6), q = clAt(D.P_EMB, at), op = !t ? 1 : ph < 0.2 ? ph / 0.2 : ph > 0.95 ? (1 - ph) / 0.05 : 1;
    o += HOT(D.INFO.emb, '<ellipse class="cl-emb" cx="' + f1(q[0]) + '" cy="' + f1(q[1]) + '" rx="4.6" ry="3.4" opacity="' + f1(op) + '"/>');
    if (at >= 1) o += '<circle class="cl-pe" cx="84" cy="178" r="8" opacity="' + f1(op) + '"/>';
  }
  /* the zoom rings and their connectors to the two panels */
  o += '<circle class="cl-ring" cx="128" cy="226" r="7"/><path class="cl-conn" d="M135 226H222"/><circle class="dot" cx="222" cy="226" r="1.8"/>';
  o += '<circle class="cl-ring" cx="91" cy="430" r="7"/><path class="cl-conn" d="M98 430H222"/><circle class="dot" cx="222" cy="430" r="1.8"/>';
  /* labels */
  o += L(56, 194, "lungs", 78, 194, "end", "cl-xs") + L(56, 216, "heart", 103, 205, "end", "cl-xs") + L(56, 240, "liver", 82, 238, "end", "cl-xs") + L(56, 283, "gut", 104, 281, "end", "cl-xs");
  if (M.emb) o += L(56, 160, "PE", 80, 176, "end", "cl-xs cl-bad");
  if (M.emb) o += L(56, 434, "DVT", 84, 431, "end", "cl-xs cl-bad");
  o += '<rect class="cl-frame" x="6" y="52" width="208" height="424" rx="12"/>';
  return o;
}

/* ---------- the liver, magnified (top right) ---------- */
function clLiver(st, M, D) {
  var t = st.t || 0, o = "", g = M.g, k;
  o += '<rect class="cl-panel" x="222" y="52" width="252" height="214" rx="12"/>';
  o += T(232, 70, "IN THE LIVER", "cl-xs cl-cap", "start");
  /* a sinusoid between two plates of hepatocytes */
  var cells = "";
  [[232, 260], [280, 318]].forEach(function (c, j) {
    for (k = 0; k < 3; k++) {
      var y0 = 94 + k * 38, y1 = y0 + 36, sk = j ? 2 : -2;
      cells += '<path class="cyto" d="M' + c[0] + " " + (y0 + sk) + "L" + c[1] + " " + (y0 - sk) + "L" + c[1] + " " + (y1 - sk) + "L" + c[0] + " " + (y1 + sk) + 'Z"/><circle class="nuc" cx="' + f1((c[0] + c[1]) / 2) + '" cy="' + (y0 + 18) + '" r="7.5"/>';
    }
  });
  o += HOT(D.INFO.hep, '<path class="vessel" d="M262 84H278V212H262Z"/>' + cells);
  var src = g.route === "oral" ? "from the gut first" : g.route === "patch" ? "less arrives" : "";
  if (src) o += T(270, 86, src, "cl-xs cl-ink", "middle");
  /* the drug coming down the sinusoid: many from the gut, a few from a patch */
  var nd = Math.round(6 * M.eL);
  for (k = 0; k < nd; k++) { var u = t ? ((t / 3400 + k / Math.max(1, nd)) % 1) : (k + 0.5) / Math.max(1, nd), y = 92 + u * 118, a = Math.min(1, u * 8, (1 - u) * 8), x = 270 + Math.sin(u * 9 + k) * 2.4;
    o += '<path class="cl-drug" d="M' + f1(x) + " " + f1(y - 3) + "L" + f1(x + 3) + " " + f1(y) + "L" + f1(x) + " " + f1(y + 3) + "L" + f1(x - 3) + " " + f1(y) + 'Z" opacity="' + f1(a) + '"/>'; }
  /* what the liver puts into the blood: factors 2, 7, 9, 10 and antithrombin III, against the normal level */
  var base = 200, hN = 50, xs = [336, 360, 384, 408], lab = ["2", "7", "9", "10"];
  xs.forEach(function (x, i) {
    var h = Math.max(6, Math.min(96, hN * M.F));
    o += HOT(D.INFO.fac, '<rect class="cl-barf" x="' + x + '" y="' + f1(base - h) + '" width="18" height="' + f1(h) + '" rx="2"/>') + T(x + 9, base + 14, lab[i], "cl-xs cl-ink cl-bold", "middle");
  });
  var hA = Math.max(6, hN * M.A);
  o += HOT(D.INFO.at3, '<rect class="cl-bara" x="440" y="' + f1(base - hA) + '" width="22" height="' + f1(hA) + '" rx="2"/>') + T(451, base + 14, "AT III", "cl-xs cl-ink cl-bold", "middle");
  o += '<path class="cl-base" d="M332 ' + base + 'H466"/><path class="cl-norm" d="M332 ' + (base - hN) + 'H466"/>' + T(332, base - hN - 5, "normal", "cl-xs cl-mut", "start");
  /* arrows over the bars: which way each goes */
  if (M.F > 1.05) o += '<path class="cl-up" d="M372 ' + f1(base - hN * M.F - 22) + "V" + f1(base - hN * M.F - 8) + "M367 " + f1(base - hN * M.F - 17) + "L372 " + f1(base - hN * M.F - 22) + "L377 " + f1(base - hN * M.F - 17) + '"/>';
  if (M.A < 0.95) o += '<path class="cl-dn" d="M451 ' + f1(base - hA - 22) + "V" + f1(base - hA - 8) + "M446 " + f1(base - hA - 13) + "L451 " + f1(base - hA - 8) + "L456 " + f1(base - hA - 13) + '"/>';
  if (st.warf) o += HOT(D.INFO.warf, '<rect class="cl-wchip" x="336" y="' + f1(Math.min(base - hN * M.F, base - hN) - 40) + '" width="90" height="16" rx="8"/>' + T(381, Math.min(base - hN * M.F, base - hN) - 28, "warfarin ↓", "cl-xs cl-wt cl-bold", "middle"));
  o += T(384, base + 30, "clotting factors", "cl-xs cl-mut", "middle");
  /* the panel's two-line summary */
  var s1, s2, c2 = "cl-ink";
  if (st.warf && M.eL > 0.02) { s1 = "warfarin holds factors 2, 7, 9, 10 down;"; s2 = "this drug pushes them back up"; c2 = "cl-bad"; }
  else if (st.warf) { s1 = "warfarin holds factors 2, 7, 9, 10 down"; s2 = "antithrombin III is unchanged"; }
  else if (g.route === "patch") { s1 = "a smaller effect: oral estrogens"; s2 = "have more effects on the liver"; }
  else if (M.eL > 0.02) { s1 = "more factors 2, 7, 9 and 10,"; s2 = "less antithrombin III"; c2 = "cl-bad"; }
  else { s1 = "the normal output of factors"; s2 = "and antithrombin III"; }
  o += T(232, 244, s1, "cl-xs cl-ink", "start") + T(232, 259, s2, "cl-xs " + c2, "start");
  o += '<rect class="cl-frame" x="222" y="52" width="252" height="214" rx="12"/>';
  return o;
}

/* ---------- a deep leg vein, magnified (bottom right) ---------- */
function clVein(st, M, D) {
  var t = st.t || 0, o = "", k, v = st.imm ? 13 : 52;
  o += '<rect class="cl-panel" x="222" y="274" width="252" height="206" rx="12"/>';
  o += T(232, 292, "IN A DEEP LEG VEIN", "cl-xs cl-cap", "start") + T(466, 292, "to the heart →", "cl-xs cl-mut", "end");
  /* the wall and the lumen, with a valve: two cusps whose pockets open toward the heart */
  o += HOT(D.INFO.vein, '<path class="cl-wall" d="M223 308H294C302 301 330 301 340 308H473V318H340C330 311 302 311 294 318H223ZM223 392H294C302 399 330 399 340 392H473V402H340C330 409 302 409 294 402H223Z"/><path class="cl-lum" d="M223 318H294C302 311 330 311 340 318H473V392H340C330 399 302 399 294 392H223Z"/>');
  /* red cells and the proteins in the blood */
  var lanes = [330, 346, 362, 378], n = 12;
  for (k = 0; k < n; k++) {
    var span = 270, x = 214 + ((((t / 1000) * v + k * span / n * 1.0 + (k % 4) * 9) % span) + span) % span, y = lanes[k % 4] + Math.sin(k * 2.1 + x / 40) * 2;
    if (y < 342 && x > 296 && x < 300 + 44 + 86 * M.s && M.s > 0.02) continue; /* the clot holds that lane */
    var a = Math.max(0, Math.min(1, (x - 226) / 14, (470 - x) / 14));
    o += clRbc(x, y, a);
  }
  var nf = Math.max(1, Math.round(3 * M.F)), na = Math.max(1, Math.round(4 * M.A));
  for (k = 0; k < nf; k++) { var xf = 226 + ((((t / 1000) * v * 0.9 + k * 244 / nf + 30) % 244) + 244) % 244, yf = 354 + (k % 2 ? 14 : -4); var af = Math.max(0, Math.min(1, (xf - 226) / 12, (470 - xf) / 12)); o += '<path class="cl-fac" d="M' + f1(xf) + " " + f1(yf - 3.6) + "L" + f1(xf + 3.6) + " " + f1(yf) + "L" + f1(xf) + " " + f1(yf + 3.6) + "L" + f1(xf - 3.6) + " " + f1(yf) + 'Z" opacity="' + f1(af) + '"/>'; }
  for (k = 0; k < na; k++) { var xa = 226 + ((((t / 1000) * v * 1.1 + k * 244 / na + 90) % 244) + 244) % 244, ya = 370 + (k % 2 ? 10 : 0); var aa = Math.max(0, Math.min(1, (xa - 226) / 12, (470 - xa) / 12)); o += '<circle class="cl-at" cx="' + f1(xa) + '" cy="' + f1(ya) + '" r="3.2" opacity="' + f1(aa) + '"/>'; }
  /* the clot, then the valve cusps over it */
  o += HOT(D.INFO.clot, clClot(M.s, t, D));
  o += HOT(D.INFO.valve, '<path class="cl-cusp" d="M297 315Q318 324 338 350M297 395Q318 386 338 360"/>');
  /* a piece breaks off at the top of the range and leaves for the heart and the lungs */
  if (M.emb) {
    var ph = t ? ((t / 6500) % 1) : 0.12, u = Math.min(1, ph / 0.2), ex = 300 + 36 + 86 + u * 60, op = ph < 0.2 ? Math.max(0, Math.min(1, (472 - ex) / 10)) : 0;
    if (op > 0) o += '<ellipse class="cl-emb" cx="' + f1(Math.min(468, ex)) + '" cy="326" rx="4.6" ry="3.4" opacity="' + f1(op) + '"/>';
  }
  /* key */
  o += '<path class="cl-fac" d="M234 412.4L237.6 416L234 419.6L230.4 416Z"/>' + T(243, 420, "clotting factors 2, 7, 9, 10", "cl-xs cl-ink", "start");
  o += '<circle class="cl-at" cx="234" cy="431" r="3.2"/>' + T(243, 435, "antithrombin III", "cl-xs cl-ink", "start");
  o += clRbc(400, 431, 1) + T(410, 435, "red cell", "cl-xs cl-ink", "start");
  /* what is happening */
  var w1 = st.imm ? "immobilized: blood moves slowly" : "she's up and about: blood keeps moving";
  var w2 = M.emb ? "a piece breaks off for the lung" : M.s > 0.02 ? "a small clot can start in a valve pocket" : "no clot forms";
  o += T(232, 455, w1, "cl-xs " + (st.imm ? "cl-hot" : "cl-mut"), "start") + T(232, 470, w2, "cl-xs " + (M.s > 0.45 ? "cl-bad" : "cl-ink"), "start");
  o += '<rect class="cl-frame" x="222" y="274" width="252" height="206" rx="12"/>';
  return o;
}

/* ---------- the clot-risk bar and the drugs that share it (bottom) ---------- */
function clRisk(st, M, D) {
  var o = "", g = M.g, x0 = 10, k = 380, y = 512, x = x0;
  o += T(10, 504, "CLOT RISK", "cl-xs cl-cap", "start") + T(470, 504, "deep vein thrombosis, pulmonary embolism", "cl-xs cl-mut", "end");
  o += '<rect class="cl-track" x="10" y="' + y + '" width="460" height="18" rx="9"/>';
  var segs = [["base", 0.1, D.INFO.rbase], ["drug", g.dd, g.rinfo], ["imm", st.imm ? 0.35 : 0, D.INFO.rimm]], ends = {};
  segs.forEach(function (sg) { if (sg[1] > 0) { o += HOT(sg[2], '<rect class="cl-seg cl-seg-' + sg[0] + '" x="' + f1(x) + '" y="' + y + '" width="' + f1(sg[1] * k) + '" height="18"/>'); } x += sg[1] * k; ends[sg[0]] = x; });
  if (st.warf) { var cs = x0 + M.r * k; o += HOT(D.INFO.rwarf, '<rect class="cl-cut" x="' + f1(cs) + '" y="' + (y - 3) + '" width="' + f1(x - cs) + '" height="24" rx="3"/>'); }
  o += '<rect class="cl-trackf" x="10" y="' + y + '" width="460" height="18" rx="9"/>';
  o += '<path class="cl-tick" d="M' + f1(x0 + M.r * k) + " " + (y - 6) + "V" + (y + 24) + '"/>';
  if (g.dd > 0) o += T(ends.base + 2, y + 34, g.rlab, "cl-xs " + (g.dd >= 0.5 ? "cl-bad" : "cl-ink"), "start");
  if (st.imm) o += T(ends.imm, y + 34, "immobilized", "cl-xs cl-hot", "end");
  if (!g.dd && !st.imm) o += T(12, y + 34, "baseline", "cl-xs cl-mut", "start");
  if (st.warf) { var wl = "warfarin's cut" + (M.eL > 0.02 ? ": smaller with this drug" : ""), cx = x0 + M.r * k; o += T(Math.min(cx, 470 - wl.length * 6.4), y + 49, wl, "cl-xs cl-wt", "start"); }
  /* the drugs that share the risk */
  o += T(10, 584, "THE DRUGS THAT SHARE THE RISK", "cl-xs cl-cap", "start");
  var cx2 = 10;
  D.SHELF.forEach(function (c) {
    var on = c.on.indexOf(st.dr) >= 0, w = c.name.length * 6.6 + 18;
    o += HOT(c.info, '<rect class="cl-chip' + (on ? " is-on" : "") + '" x="' + f1(cx2) + '" y="592" width="' + f1(w) + '" height="20" rx="10"/>' + T(cx2 + w / 2, 606, c.name, "cl-xs cl-chipt" + (on ? " cl-bold" : ""), "middle"));
    cx2 += w + 8;
  });
  o += T(10, 632, "his rule: any clot or stroke, even 10 years ago: no estrogen", "cl-xs cl-ink", "start");
  return o;
}

function clRender(st, D) {
  var M = clModel(st, D), g = M.g, o = "";
  o += T(10, 24, g.name, "cl-name", "start") + T(10, 41, g.sub, "cl-xs cl-mut", "start");
  o += '<rect class="cl-flag' + (st.imm ? " is-on" : "") + '" x="356" y="9" width="118" height="17" rx="8.5"/>' + T(415, 21.5, "immobilized", "cl-xs cl-flagt" + (st.imm ? " cl-bold" : ""), "middle");
  o += '<rect class="cl-flag cl-flagw' + (st.warf ? " is-on" : "") + '" x="356" y="30" width="118" height="17" rx="8.5"/>' + T(415, 42.5, "on warfarin", "cl-xs cl-flagt" + (st.warf ? " cl-bold" : ""), "middle");
  o += clBody(st, M, D) + clLiver(st, M, D) + clVein(st, M, D) + clRisk(st, M, D);
  return o;
}

function clSay(st, D) {
  var M = clModel(st, D), g = M.g, s = g.say;
  if (st.imm) s += " " + (st.dr === "ral" ? D.SAYS.immRal : D.SAYS.imm);
  if (st.warf) s += " " + (M.eL > 0.02 ? D.SAYS.warfE : D.SAYS.warf0);
  return [s, "clot risk: " + M.word];
}

/* ---------- the drugs and the words, from his slides and recording ---------- */
const DRUGS = {
  none: { name: "NO DRUG", sub: "for comparison", route: "", eL: 0, dd: 0, rlab: "", rinfo: "",
    say: "No drug: the liver makes its normal amounts of clotting factors and antithrombin III, and the blood keeps moving through the deep leg veins." },
  oral: { name: "ESTROGEN BY MOUTH", sub: "swallowed: the gut, then the liver first", route: "oral", eL: 1, dd: 0.55, rlab: "estrogen by mouth",
    rinfo: "An estrogen raises the clot risk. Thromboembolism is, in his words, 'the most serious and most common side effect of estrogens.'",
    say: "An estrogen taken by mouth (ethinyl estradiol in the pill, Premarin for menopause) goes from the gut to the liver first, and oral estrogens have more effects on the liver: it makes more clotting factors 2, 7, 9 and 10 and less antithrombin III, so clots form more easily. Thromboembolism, deep vein thrombosis and pulmonary embolism, is in his words the most serious and most common side effect of estrogens." },
  patch: { name: "ESTRADIOL PATCH (Estraderm)", sub: "through the skin into the general blood", route: "patch", eL: 0.35, dd: 0.2, rlab: "patch: smaller",
    rinfo: "A patch is drawn with a smaller rise than a pill, because his slide says oral estrogens have more effects on the liver. It is still an estrogen product: his contraindications apply to every one.",
    say: "An estradiol patch (Estraderm) sends the hormone through the skin into the general blood, not through the gut to the liver first, so the liver's effect is smaller: his slide says oral estrogens have more effects on the liver, including the rise in clotting factors. It is still an estrogen: after any clot or stroke, however long ago, no estrogen product." },
  tam: { name: "TAMOXIFEN (Nolvadex)", sub: "a SERM by mouth, for breast cancer", route: "oral", eL: 1, dd: 0.5, rlab: "tamoxifen: clot risk",
    rinfo: "Tamoxifen: his figure of its effects lists a higher blood clot risk with the higher uterine cancer risk.",
    say: "Tamoxifen blocks estrogen in the breast, yet it shares estrogen's clot risk (his tamoxifen figure: a higher blood clot risk). \"Drugs that are estrogenic, even those that are anti-estrogenic, they tend to increase clotting factors, and that's why they have a problem with thrombosis.\"" },
  ral: { name: "RALOXIFENE (Evista)", sub: "a SERM by mouth, for osteoporosis", route: "oral", eL: 1, dd: 0.5, rlab: "raloxifene: DVT and PE 2 to 3 times",
    rinfo: "Raloxifene: a 2- to 3-fold increase in the risk of deep vein thrombosis and pulmonary embolism, his slide's number.",
    say: "Raloxifene (Evista), for osteoporosis after menopause: a 2- to 3-fold increase in the risk of deep vein thrombosis and pulmonary embolism. Agonist or antagonist, these modulators share estrogen's side effects and are avoided in a patient with a history of DVT or PE." },
};
const SAYS = {
  imm: "Immobilized after surgery, blood moves slowly in the deep leg veins and the risk climbs: a clot can grow there and a piece can travel up to the heart and into the lung, a pulmonary embolism.",
  immRal: "Immobilized after surgery, the risk climbs further: his Case 5, a woman on raloxifene whose extraction site heals slowly. The added risk to keep in mind is a thromboembolic event while she is immobilized.",
  warfE: "On warfarin, an oral anticoagulant: estrogen increases the production of clotting factors, so it decreases warfarin's efficacy, and the protection shrinks.",
  warf0: "On warfarin, an oral anticoagulant, the four factors are held down and the clot risk falls.",
};
const INFO = {
  ivc: "The inferior vena cava: it carries blood from the legs and the belly up to the right side of the heart. A clot that breaks off in a leg vein rides it up.",
  legv: "The deep veins of the legs. Deep vein thrombosis (DVT) is a clot in one of them, most often in the calf.",
  lung: "The lungs. A clot that breaks off in a leg vein passes through the right heart and lodges in a pulmonary artery: a pulmonary embolism (PE).",
  heart: "The heart: blood from the legs enters the right side and is pumped out through the pulmonary artery to the lungs.",
  pa: "The pulmonary artery, from the right heart to both lungs: where a traveling leg clot lodges (a pulmonary embolism).",
  stom: "The stomach: a pill is swallowed and absorbed from the gut.",
  gut: "The gut: what is absorbed here goes to the liver first, by the portal vein. Estrone and estriol are also secreted in the bile and reabsorbed here (enterohepatic recirculation).",
  portal: "The portal vein, from the gut to the liver: the reason a swallowed estrogen reaches the liver first.",
  liver: "The liver: it makes the clotting factors and antithrombin III. Oral estrogens have more effects on the liver, including an increase in clotting factors.",
  pill: "Swallowed: ethinyl estradiol (the oral contraceptives), Premarin (conjugated estrogens for menopause), and the SERMs tamoxifen and raloxifene are all taken by mouth.",
  patch: "An estradiol patch (Estraderm) on the skin of the lower abdomen: the hormone goes into the general blood, not through the gut to the liver first.",
  emb: "An embolus: a piece of the leg clot, carried up the inferior vena cava, through the right heart, into a pulmonary artery. In the lung it is a pulmonary embolism.",
  hep: "Hepatocytes along a sinusoid, the liver's blood channel. Blood from the gut (the portal vein) reaches them first, so a swallowed estrogen hits them hardest.",
  fac: "Clotting factors 2, 7, 9 and 10 (II, VII, IX, X): estrogen increases their production, so blood clots more easily.",
  at3: "Antithrombin III, a natural brake on clotting: estrogen decreases it.",
  warf: "Warfarin, an oral anticoagulant, lowers the working amounts of the same four factors, 2, 7, 9 and 10. Estrogen increases their production, so it decreases warfarin's efficacy.",
  vein: "A deep leg vein, magnified. Blood flows toward the heart, helped by the valves; when she lies still after a procedure, it moves slowly and pools.",
  valve: "A valve: two cusps that let blood through toward the heart and close against backflow. Behind each cusp is a pocket where blood moves slowly, and a clot often starts there.",
  clot: "A clot (thrombus): fibrin strands with trapped red cells. More clotting factors and less antithrombin III let it form and grow; slow blood when immobilized helps it along.",
  rbase: "Everyone has some risk of a clot: this is the baseline, with no drug and up and about.",
  rimm: "Immobilized after surgery: his dental case warns about thromboembolic events while the patient is immobilized.",
  rwarf: "Warfarin takes part of the risk away; with an estrogen-active drug it takes less, because the drug raises clotting factor production (decreased efficacy of oral anticoagulants, his slide).",
};
const SHELF = [
  { name: "estrogens", on: ["oral", "patch"], info: "Estrogens (estradiol, ethinyl estradiol, estrone as Premarin): clotting factors up, antithrombin III down. Thromboembolism is the most serious and most common side effect." },
  { name: "tamoxifen", on: ["tam"], info: "Tamoxifen, a SERM: anti-estrogen in the breast, but it raises the blood clot risk (his figure)." },
  { name: "raloxifene", on: ["ral"], info: "Raloxifene, a SERM: a 2- to 3-fold increase in the risk of deep vein thrombosis and pulmonary embolism (his Case 5)." },
  { name: "aromatase inhibitors", on: [], info: "Aromatase inhibitors (anastrozole, letrozole, exemestane): his slide lists thromboembolism, and he said to remember it with hot flashes." },
];

export default function clots() {
  const A = staticArt();
  const D = Object.assign({}, A, { DRUGS, SAYS, INFO, SHELF, ANIM: true, INIT: { dr: "oral", imm: false, warf: false } });
  const btn = (k, v, s) => `<button type="button" class="am-btn" data-amk="${k}" data-amv="${v}">${s}</button>`;
  return makeFig({
    id: "clots", lec: "sexster", fig: "Fig 10", short: "Why the clots", hint: "pick · switch · hover",
    title: "Why estrogen-active drugs cause clots",
    caption: "A swallowed estrogen reaches the liver first, which makes more clotting factors 2, 7, 9 and 10 and less antithrombin III. Compare a patch and the SERMs, then add immobilization after surgery (his raloxifene case) and warfarin.",
    W: 480, H: 642,
    label: "A front view of a woman with the route of a swallowed estrogen (mouth, stomach, gut, portal vein, liver) or a patch on the skin, and the route of a clot from a deep calf vein up the inferior vena cava through the heart to a lung; the liver magnified, with bars for clotting factors 2, 7, 9 and 10 and antithrombin III against the normal level; a deep leg vein magnified, with a valve and a clot in its pocket; a clot-risk bar; and the drugs that share the risk.",
    D, render: clRender, say: clSay, helpers: [clSm, clAt, clFlow, clModel, clClot, clRbc, clBody, clLiver, clVein, clRisk],
    controls: `<div class="am-controls" role="group" aria-label="Drug">${btn("dr", "none", "No drug")}${btn("dr", "oral", "Estrogen by mouth")}${btn("dr", "patch", "Estradiol patch")}${btn("dr", "tam", "Tamoxifen")}${btn("dr", "ral", "Raloxifene")}</div>` +
      `<div class="am-controls"><button type="button" class="am-btn" data-amt="imm" aria-pressed="false">Immobilized after surgery</button><button type="button" class="am-btn" data-amt="warf" aria-pressed="false">Also on warfarin</button></div>`,
    sources: [
      "From the L18 notes (Dr. Fasinu, recording and slides): oral estrogens have more effects on the liver, including an increase in clotting factors; estrogen increases production of clotting factors 2, 7, 9 and 10 and decreases antithrombin III; \"drugs that are estrogenic, even those that are anti-estrogenic, they tend to increase clotting factors\"; thromboembolism (deep vein thrombosis, pulmonary embolism) as the most serious and most common side effect of estrogens; estrogens decrease the efficacy of oral anticoagulants; raloxifene's 2- to 3-fold rise in DVT and PE; tamoxifen's blood clot risk (his figure); thromboembolism on the aromatase inhibitors' slide; his contraindication of any clot or stroke, however long ago; the estradiol patch (Estraderm), ethinyl estradiol and Premarin; Case 5, raloxifene and thromboembolic events during immobilization.",
      "Where the slides and the textbooks part, the figure follows the lecture: his slide and recording put the aromatase inhibitors with the drugs that share the clot risk, while standard texts rate their risk below tamoxifen's and give it no liver mechanism, so they are listed (not drawn in the liver). His slide's \"thrombolytic complications\" means clots forming, as the notes say.",
      "For accuracy and behavior (outside sources, for how it works, not for what is labeled): a swallowed drug goes from the gut by the portal vein to the liver before the general circulation, and a transdermal patch skips that first pass, which is why oral estrogen moves the liver's clotting proteins more (Katzung's Basic and Clinical Pharmacology, the estrogen chapter; Goodman and Gilman's The Pharmacological Basis of Therapeutics). Observational studies found a smaller added clot risk with transdermal than with oral estrogen (Canonico and colleagues, the ESTHER study, Circulation 2007); the lecture says only that oral estrogens have more effects on the liver, so the patch is drawn with a smaller effect, not none. Warfarin lowers the working amounts of factors 2, 7, 9 and 10 (Katzung, the anticoagulant chapter), which is why more of them blunts it. Deep vein clots often start in the pockets behind venous valves, where blood moves slowly, and immobility slows the flow further (Bovill and van der Vliet, Annual Review of Physiology 2011); the clot travels up the inferior vena cava, through the right heart, to a pulmonary artery.",
      "Schematic and not to scale: the organs and the vein are simplified, the bars and the risk bar are qualitative (higher or lower, not measured), and the clot's size only follows the risk. The only number shown is raloxifene's 2 to 3 times from his slide. Educational, not medical advice.",
    ],
    css: `
.anima[data-anima="clots"] .am-svg{max-width:560px}
.anima .clots-svg .t.cl-xs{font-size:11.5px}
.anima .clots-svg .t.cl-name{font-size:15px;font-weight:700;fill:var(--anatomy-strong)}
.anima .clots-svg .t.cl-cap{fill:var(--anatomy-muted);font-weight:700;letter-spacing:.06em;font-size:11px}
.anima .clots-svg .t.cl-bold{font-weight:700}
.anima .clots-svg .t.cl-ink{fill:var(--anatomy-strong)}
.anima .clots-svg .t.cl-mut{fill:var(--anatomy-muted)}
.anima .clots-svg .t.cl-bad{fill:var(--bx-inhib);font-weight:700}
.anima .clots-svg .t.cl-hot{fill:var(--bx-hot);font-weight:700}
.anima .clots-svg .t.cl-wt{fill:var(--bx-blue);font-weight:700}
.anima .clots-svg .t.cl-chipt,.anima .clots-svg .t.cl-flagt{fill:var(--anatomy-strong);stroke:none}
.anima .clots-svg .cl-panel{fill:var(--anatomy-shade-1)}
.anima .clots-svg .cl-frame{fill:none;stroke:var(--anatomy-lo);stroke-width:1.2}
.anima .clots-svg .cl-skin{fill:var(--anatomy-face);stroke:var(--anatomy-mid);stroke-width:1.2;stroke-linejoin:round}
.anima .clots-svg .cl-arm{fill:var(--anatomy-shade-3)}
.anima .clots-svg .cl-mouth{fill:none;stroke:var(--anatomy-mid);stroke-width:1.1;stroke-linecap:round}
.anima .clots-svg .cl-lung{fill:var(--bx-blood-soft);stroke:var(--bx-blood);stroke-width:1;opacity:.85}
.anima .clots-svg .cl-heart{fill:color-mix(in srgb,var(--bx-blood) 80%,var(--bx-blood-soft));stroke:var(--bx-blood);stroke-width:1}
.anima .clots-svg .cl-liv{fill:color-mix(in srgb,var(--bx-blood) 30%,var(--bx-gold-soft));stroke:var(--bx-blood);stroke-width:1.2}
.anima .clots-svg .cl-livl{fill:none;stroke:var(--bx-blood);stroke-width:.8;opacity:.7}
.anima .clots-svg .cl-glow{fill:none;stroke:var(--bx-gold);stroke-width:1.8;stroke-linejoin:round}
.anima .clots-svg .cl-halo{fill:none;stroke:var(--bx-gold);stroke-width:7;stroke-linejoin:round}
.anima .clots-svg .cl-stom{fill:var(--bx-cyto);stroke:var(--bx-cyto-line);stroke-width:1.1}
.anima .clots-svg .cl-eso{fill:none;stroke:var(--bx-cyto-line);stroke-width:3;stroke-linecap:round;opacity:.7}
.anima .clots-svg .cl-gut-o{fill:none;stroke:var(--bx-cyto-line);stroke-width:7;stroke-linecap:round;stroke-linejoin:round}
.anima .clots-svg .cl-gut-i{fill:none;stroke:var(--bx-cyto);stroke-width:4.6;stroke-linecap:round;stroke-linejoin:round}
.anima .clots-svg .cl-portal{fill:none;stroke:var(--bx-violet);stroke-width:2.6;stroke-linecap:round}
.anima .clots-svg .cl-ivc{fill:none;stroke:var(--bx-blue);stroke-width:4;stroke-linecap:round}
.anima .clots-svg .cl-vein{fill:none;stroke:var(--bx-blue);stroke-width:2.4;stroke-linecap:round}
.anima .clots-svg .cl-pa{fill:none;stroke:var(--bx-blue);stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
.anima .clots-svg .cl-pv{fill:none;stroke:var(--bx-blue);stroke-width:1.6;stroke-linecap:round}
.anima .clots-svg .cl-patch{fill:var(--bx-gold-soft);stroke:var(--bx-gold);stroke-width:1.3}
.anima .clots-svg .cl-patchl{fill:none;stroke:var(--bx-gold);stroke-width:.9}
.anima .clots-svg .cl-pill rect{fill:var(--bx-gold-soft);stroke:var(--bx-gold);stroke-width:1.2}
.anima .clots-svg .cl-pill path{fill:none;stroke:var(--bx-gold);stroke-width:1}
.anima .clots-svg .cl-drug{fill:var(--accent);stroke:var(--surface);stroke-width:.7}
.anima .clots-svg .cl-route{fill:none;stroke:var(--bx-inhib);stroke-width:1.1;stroke-dasharray:2 3;opacity:.8}
.anima .clots-svg .cl-emb{fill:var(--bx-blood);stroke:var(--anatomy-strong);stroke-width:1}
.anima .clots-svg .cl-pe{fill:none;stroke:var(--bx-inhib);stroke-width:1.6}
.anima .clots-svg .cl-ring{fill:none;stroke:var(--anatomy-strong);stroke-width:1.1;stroke-dasharray:2 2}
.anima .clots-svg .cl-conn{fill:none;stroke:var(--anatomy-mid);stroke-width:.9;stroke-dasharray:3 3}
.anima .clots-svg .cl-barf{fill:var(--bx-gold-soft);stroke:var(--bx-gold);stroke-width:1.2}
.anima .clots-svg .cl-bara{fill:var(--bx-blue-soft);stroke:var(--bx-blue);stroke-width:1.2}
.anima .clots-svg .cl-base{fill:none;stroke:var(--anatomy-mid);stroke-width:1.2}
.anima .clots-svg .cl-norm{fill:none;stroke:var(--anatomy-mid);stroke-width:1;stroke-dasharray:4 3}
.anima .clots-svg .cl-up{fill:none;stroke:var(--bx-inhib);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.anima .clots-svg .cl-dn{fill:none;stroke:var(--bx-inhib);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.anima .clots-svg .cl-wchip{fill:var(--bx-blue-soft);stroke:var(--bx-blue);stroke-width:1.1}
.anima .clots-svg .cl-wall{fill:var(--bx-blue-soft);stroke:var(--bx-blue);stroke-width:1}
.anima .clots-svg .cl-lum{fill:var(--bx-blood-soft)}
.anima .clots-svg .cl-cusp{fill:none;stroke:var(--bx-blue);stroke-width:3;stroke-linecap:round}
.anima .clots-svg .cl-rbc{fill:var(--bx-blood);stroke:color-mix(in srgb,var(--bx-blood) 70%,var(--anatomy-strong));stroke-width:.6}
.anima .clots-svg .cl-rbcp{fill:color-mix(in srgb,var(--bx-blood) 55%,var(--bx-blood-soft))}
.anima .clots-svg .cl-fac{fill:var(--bx-gold);stroke:var(--anatomy-strong);stroke-width:.5}
.anima .clots-svg .cl-at{fill:var(--bx-blue);stroke:var(--surface);stroke-width:.8}
.anima .clots-svg .cl-clot{fill:var(--cl-clot);stroke:var(--cl-clot-line);stroke-width:1}
.anima .clots-svg .cl-fib{fill:none;stroke:var(--cl-fib);stroke-width:1;stroke-linecap:round}
.anima .clots-svg .cl-trap{stroke-width:.4}
.anima .clots-svg{--cl-fib:#fff4dc;--cl-clot:#8e2330;--cl-clot-line:#5a1219}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]) .anima .clots-svg{--cl-fib:#f6e3bd;--cl-clot:#a8323f;--cl-clot-line:#f3b0b6} }
:root[data-theme="dark"] .anima .clots-svg{--cl-fib:#f6e3bd;--cl-clot:#a8323f;--cl-clot-line:#f3b0b6}
.anima .clots-svg .cl-track{fill:var(--anatomy-face)}
.anima .clots-svg .cl-trackf{fill:none;stroke:var(--anatomy-lo);stroke-width:1.1}
.anima .clots-svg .cl-seg-base{fill:var(--anatomy-lo)}
.anima .clots-svg .cl-seg-drug{fill:var(--bx-gold)}
.anima .clots-svg .cl-seg-imm{fill:var(--bx-hot)}
.anima .clots-svg .cl-cut{fill:var(--surface);opacity:.72;stroke:var(--bx-blue);stroke-width:1.4;stroke-dasharray:4 2}
.anima .clots-svg .cl-tick{fill:none;stroke:var(--anatomy-strong);stroke-width:2;stroke-linecap:round}
.anima .clots-svg .cl-chip{fill:var(--anatomy-face);stroke:var(--anatomy-lo);stroke-width:1.1}
.anima .clots-svg .cl-chip.is-on{fill:var(--bx-gold-soft);stroke:var(--bx-gold);stroke-width:1.6}
.anima .clots-svg .cl-flag{fill:var(--anatomy-face);stroke:var(--anatomy-lo);stroke-width:1.1}
.anima .clots-svg .cl-flag.is-on{fill:var(--bx-hot-soft);stroke:var(--bx-hot);stroke-width:1.5}
.anima .clots-svg .cl-flagw.is-on{fill:var(--bx-blue-soft);stroke:var(--bx-blue)}
`,
  });
}
