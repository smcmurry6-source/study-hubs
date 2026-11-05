// Fig: from primordial follicle to corpus luteum (L14 Female Reproductive Histology, Dr. Herr). The follicle in section,
// the way a histology slide shows it, through Dr. Herr's five stages (primordial, early primary (unilaminar), late
// primary (multilaminar), secondary (antral), mature Graafian), then ovulation, the corpus luteum and its fate: the
// corpus albicans if there is no pregnancy, or a corpus luteum kept by the placenta's hormone if there is. A badge gives
// the oocyte's meiotic arrest at each stage as his starred slide does: prophase I in every follicle until the LH surge,
// metaphase II from just before ovulation until fertilization. Every stage is drawn to fill the frame (not to scale);
// the only sizes are the lecture's (oocyte about 25 µm, then 100-150 µm; Graafian follicle about 20 mm).
import { makeFig, f1, T, L, HOT } from "./shared.mjs";

const W = 580, H = 432;
const STAGES = ["Primordial follicle", "Early primary (unilaminar)", "Late primary (multilaminar)", "Secondary (antral) follicle", "Mature Graafian follicle", "Ovulation", "Corpus luteum", "Corpus albicans"];

/* deterministic jitter, so the static copy and the live page draw the same section */
function foR(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function foPt(cx, cy, r, a) { return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
/* closed smooth path through points (Catmull-Rom as cubic Bezier) */
function foSmooth(p) {
  var n = p.length, d = "M" + f1(p[0][0]) + " " + f1(p[0][1]), i;
  for (i = 0; i < n; i++) { var a = p[(i - 1 + n) % n], b = p[i], c = p[(i + 1) % n], e = p[(i + 2) % n];
    d += "C" + f1(b[0] + (c[0] - a[0]) / 6) + " " + f1(b[1] + (c[1] - a[1]) / 6) + " " + f1(c[0] - (e[0] - b[0]) / 6) + " " + f1(c[1] - (e[1] - b[1]) / 6) + " " + f1(c[0]) + " " + f1(c[1]); }
  return d + "Z";
}
/* a closed outline r = fn(angle) around a center */
function foPolar(cx, cy, fn, n) { var p = [], i; for (i = 0; i < n; i++) { var a = i / n * 2 * Math.PI; p.push(foPt(cx, cy, fn(a), a)); } return foSmooth(p); }
function foCirc(cx, cy, r, cls, extra) { return '<circle class="' + cls + '" cx="' + f1(cx) + '" cy="' + f1(cy) + '" r="' + f1(r) + '"' + (extra || "") + "/>"; }
/* a ring of cells between r1 and r2: flat (squamous) nuclei lie along the ring, round ones sit in the middle,
   radial ones point at the center (corona radiata) */
function foRing(cx, cy, r1, r2, n, rot, cell, nuc, kind) {
  var o = "", i, s = 2 * Math.PI / n, rm = (r1 + r2) / 2;
  for (i = 0; i < n; i++) {
    var a0 = rot + i * s, a1 = a0 + s, p = foPt(cx, cy, r1, a0), q = foPt(cx, cy, r1, a1), u = foPt(cx, cy, r2, a1), v = foPt(cx, cy, r2, a0);
    o += '<path class="' + cell + '" d="M' + f1(p[0]) + " " + f1(p[1]) + "A" + f1(r1) + " " + f1(r1) + " 0 0 1 " + f1(q[0]) + " " + f1(q[1]) + "L" + f1(u[0]) + " " + f1(u[1]) + "A" + f1(r2) + " " + f1(r2) + " 0 0 0 " + f1(v[0]) + " " + f1(v[1]) + 'Z"/>';
    var am = a0 + s * (0.5 + (foR(i * 7 + r1) - 0.5) * 0.3), m = foPt(cx, cy, rm, am), deg = am * 180 / Math.PI;
    if (kind === "flat") o += '<ellipse class="' + nuc + '" cx="' + f1(m[0]) + '" cy="' + f1(m[1]) + '" rx="' + f1(Math.min(7.5, rm * s * 0.34)) + '" ry="1.8" transform="rotate(' + f1(deg + 90) + " " + f1(m[0]) + " " + f1(m[1]) + ')"/>';
    else if (kind === "radial") o += '<ellipse class="' + nuc + '" cx="' + f1(m[0]) + '" cy="' + f1(m[1]) + '" rx="' + f1((r2 - r1) * 0.3) + '" ry="1.9" transform="rotate(' + f1(deg) + " " + f1(m[0]) + " " + f1(m[1]) + ')"/>';
    else o += foCirc(m[0], m[1], Math.min(3.6, (r2 - r1) * 0.26), nuc);
  }
  return o;
}
/* ovarian stroma: spindle cells in whorls; skips the holes [[x, y, r]] and anything above the surface sf(x) */
function foStroma(x0, y0, x1, y1, holes, sf, seed, n) {
  var o = "", i, h;
  for (i = 0; i < n; i++) {
    var x = x0 + 7 + foR(seed + i * 2) * (x1 - x0 - 14), y = y0 + 7 + foR(seed + i * 2 + 1) * (y1 - y0 - 14), ok = !sf || y > sf(x) + 9;
    for (h = 0; ok && h < holes.length; h++) if (Math.hypot(x - holes[h][0], y - holes[h][1]) < holes[h][2] + 5) ok = false;
    if (!ok) continue;
    var a = 34 * Math.sin(x / 41 + 0.8) + 30 * Math.cos(y / 37) + (foR(seed + i * 5) - 0.5) * 30;
    o += '<ellipse class="fo-sn" cx="' + f1(x) + '" cy="' + f1(y) + '" rx="5.4" ry="1.5" transform="rotate(' + f1(a) + " " + f1(x) + " " + f1(y) + ')"/>';
  }
  return o;
}
/* the oocyte: cytoplasm, organelles, a vesicular nucleus (or a metaphase plate), cortical granules, a polar body */
function foOocyte(cx, cy, r, o2) {
  var o = foCirc(cx, cy, r, "fo-oo"), i;
  for (i = 0; i < Math.round(r * 0.7); i++) { var a = foR(i * 3 + r) * 6.283, d = Math.sqrt(foR(i * 3 + 1 + r)) * (r - 4); o += foCirc(cx + d * Math.cos(a), cy + d * Math.sin(a), 0.9 + foR(i + 9) * 0.8, "fo-org"); }
  if (o2.cg) for (i = 0; i < Math.round(r * 0.9); i++) { var b = i / Math.round(r * 0.9) * 6.283; o += foCirc(cx + (r - 3) * Math.cos(b), cy + (r - 3) * Math.sin(b), 1.1, "fo-cg"); }
  if (o2.meta) {
    /* metaphase II: chromosomes lined up on the plate, a faint spindle, near the surface */
    var mx = cx + r * 0.45, my = cy - r * 0.35;
    o += '<path class="fo-sp" d="M' + f1(mx - 9) + " " + f1(my - 8) + "L" + f1(mx) + " " + f1(my + 1) + "L" + f1(mx + 9) + " " + f1(my - 8) + "M" + f1(mx - 9) + " " + f1(my + 10) + "L" + f1(mx) + " " + f1(my + 1) + "L" + f1(mx + 9) + " " + f1(my + 10) + '"/>';
    for (i = -2; i <= 2; i++) o += '<path class="fo-mp" d="M' + f1(mx + i * 3.2) + " " + f1(my - 2.4) + "V" + f1(my + 4.4) + '"/>';
  } else if (o2.nr) {
    var nx = cx + o2.nx, ny = cy + o2.ny, nr = o2.nr;
    o += foCirc(nx, ny, nr, "fo-onuc");
    for (i = 0; i < Math.round(nr * 0.9); i++) { var c = foR(i * 5 + nr) * 6.283, e = Math.sqrt(foR(i * 5 + 2 + nr)) * (nr - 3); o += foCirc(nx + e * Math.cos(c), ny + e * Math.sin(c), 0.8, "fo-chr"); }
    o += foCirc(nx + nr * 0.25, ny - nr * 0.2, Math.max(2.2, nr * 0.2), "fo-ncl");
  }
  return o;
}
/* the theca: interna (vascular, plump cells, capillaries) inside externa (fibrous, spindle cells), from rb outward */
function foTheca(cx, cy, rb, ri, re, seed, swell) {
  var o = foCirc(cx, cy, re, "fo-te") + foCirc(cx, cy, ri, "fo-ti" + (swell ? " fo-swell" : "")), i, n;
  for (i = 1; i <= 2; i++) o += foCirc(cx, cy, ri + (re - ri) * i / 3, "fo-fib");
  n = Math.round(re * 0.42);
  for (i = 0; i < n; i++) { var a = i / n * 6.283 + foR(seed + i) * 0.1, m = foPt(cx, cy, ri + (re - ri) * (0.25 + 0.5 * foR(seed + i * 3)), a); o += '<ellipse class="fo-sn" cx="' + f1(m[0]) + '" cy="' + f1(m[1]) + '" rx="5" ry="1.4" transform="rotate(' + f1(a * 57.3 + 90) + " " + f1(m[0]) + " " + f1(m[1]) + ')"/>'; }
  n = Math.round(rb * 0.16);
  for (i = 0; i < n; i++) { var b = (i + 0.5) / n * 6.283, c = foPt(cx, cy, (rb + ri) / 2, b), w = Math.min(5.5, (ri - rb) * 0.36);
    o += '<ellipse class="fo-cap" cx="' + f1(c[0]) + '" cy="' + f1(c[1]) + '" rx="' + f1(w * 1.3) + '" ry="' + f1(w) + '" transform="rotate(' + f1(b * 57.3 + 90) + " " + f1(c[0]) + " " + f1(c[1]) + ')"/>' + foCirc(c[0], c[1], w * 0.45, "fo-rbc"); }
  n = Math.round(rb * 0.3);
  for (i = 0; i < n; i++) { var d = (i + 0.5 + 0.5) / n * 6.283 + 0.13, q = foPt(cx, cy, rb + (ri - rb) * (0.3 + 0.4 * foR(seed + 40 + i)), d); o += foCirc(q[0], q[1], 1.9, "fo-tn"); }
  return o;
}
/* granulosa cells as packed nuclei inside R, around an antrum ra(angle) and around the oocyte's exclusion ex */
function foGran(cx, cy, R, ra, ex, seed) {
  var o = foCirc(cx, cy, R, "fo-gbg"), rr, j;
  for (rr = 5; rr < R - 2; rr += 6.6) {
    var n = Math.max(1, Math.floor(2 * Math.PI * rr / 6.8));
    for (j = 0; j < n; j++) {
      var a = (j + foR(seed + rr * 3 + j) * 0.5) / n * 2 * Math.PI, r2 = rr + (foR(seed + j * 7 + rr) - 0.5) * 2.2;
      if (ra && r2 < ra(a) + 3.4) continue;
      var p = foPt(cx, cy, r2, a);
      if (ex && Math.hypot(p[0] - ex[0], p[1] - ex[1]) < ex[2] + 2.5) continue;
      o += foCirc(p[0], p[1], 2.25, "fo-gn");
    }
  }
  return o;
}
/* the ovary's surface: peritoneal space above, surface epithelium, then the tunica albuginea, bulging over (bx, bw);
   gap = [x0, x1] leaves a rupture */
function foSurface(x0, x1, base, bump, bx, bw, gap, top) {
  function sT(x) { return base - bump * Math.exp(-Math.pow((x - bx) / bw, 2)); }
  function th(x) { return 13 - 6 * Math.exp(-Math.pow((x - bx) / bw, 2)); }
  var o = "", x, runs = gap ? [[x0, gap[0]], [gap[1], x1]] : [[x0, x1]], k;
  /* above the surface is the peritoneal space, not stroma */
  var cover = "M" + x0 + " " + top + "H" + x1;
  for (x = x1; x >= x0; x -= 6) cover += "L" + f1(x) + " " + f1(sT(x) + 1);
  o += '<path class="fo-peri" d="' + cover + "L" + x0 + " " + f1(sT(x0) + 1) + 'Z"/>';
  for (k = 0; k < runs.length; k++) {
    var a = runs[k][0], b = runs[k][1], tp = "", bt = "";
    for (x = a; x <= b + 0.01; x += Math.max(1, (b - a) / 40)) { tp += (tp ? "L" : "M") + f1(x) + " " + f1(sT(x) + 4); bt = "L" + f1(x) + " " + f1(sT(x) + 4 + th(x)) + bt; }
    o += '<path class="fo-tun" d="' + tp + bt + 'Z"/>';
    var ep = "";
    for (x = a; x <= b + 0.01; x += Math.max(1, (b - a) / 40)) ep += (ep ? "L" : "M") + f1(x) + " " + f1(sT(x) + 2);
    o += '<path class="fo-epi" d="' + ep + '"/>';
    for (x = a + 3; x < b - 2; x += 7) o += foCirc(x, sT(x) + 2, 1.5, "fo-gn");
  }
  return o;
}
/* the corpus luteum: a folded wall of pale granulosa-lutein cells, darker theca-lutein cells around it and down the
   folds, the collapsed center inside; s scales it, pale fades it (regressing) */
function foLutein(cx, cy, s, pale) {
  function rO(a) { return s * rOut(a); }
  function rI(a) { return s * (66 + 18 * Math.sin(7 * a + 0.4) + 7 * Math.sin(3 * a)); }
  var o = '<g' + (pale ? ' opacity="' + pale + '"' : "") + ">", i, j;
  o += '<path class="fo-tl" d="' + foPolar(cx, cy, rO, 120) + '"/>';
  o += '<path class="fo-gl" d="' + foPolar(cx, cy, function (a) { return rO(a) - 11 * s; }, 120) + '"/>';
  /* granulosa-lutein cells: large and pale, filling the wall */
  for (var rr = 0; rr < 6; rr++) {
    var n = Math.round(2 * Math.PI * s * (80 + rr * 12) / 15);
    for (j = 0; j < n; j++) {
      var a = (j + (rr % 2) * 0.5) / n * 2 * Math.PI, lo = rI(a) + 6 * s, hi = rO(a) - 17 * s, r = lo + (hi - lo) * (rr + 0.5) / 6;
      if (hi - lo < 6) continue;
      var p = foPt(cx, cy, r, a);
      o += foCirc(p[0], p[1], Math.max(3, 6.6 * s), "fo-glc") + foCirc(p[0] + 0.6, p[1] - 0.4, Math.max(1.4, 2.4 * s), "fo-gn");
    }
  }
  /* theca-lutein cells: smaller, darker, in the outer band and running into the folds */
  var m = Math.round(2 * Math.PI * rO(0) / 9);
  for (j = 0; j < m; j++) { var b = j / m * 2 * Math.PI, q = foPt(cx, cy, rO(b) - 5.5 * s, b); o += foCirc(q[0], q[1], Math.max(2, 3.6 * s), "fo-tlc") + foCirc(q[0], q[1], Math.max(1, 1.5 * s), "fo-tn"); }
  for (j = 0; j < 7; j++) {
    var c = (Math.PI / 2 - 0.4 + 2 * Math.PI * j) / 7;
    for (i = 1; i < 6; i++) { var rr2 = rO(c) - 11 * s - (rO(c) - 11 * s - rI(c)) * i / 6, q2 = foPt(cx, cy, rr2, c + Math.sin(i) * 0.02); o += foCirc(q2[0], q2[1], Math.max(1.8, 3.2 * s), "fo-tlc") + foCirc(q2[0], q2[1], Math.max(0.9, 1.3 * s), "fo-tn"); }
  }
  o += '<path class="fo-core" d="' + foPolar(cx, cy, rI, 120) + '"/>';
  for (i = 0; i < 6; i++) { var e = foR(i * 9 + 3) * 6.283, f = foPt(cx, cy, rI(e) * 0.85, e), g = foPt(cx, cy, rI(e + 2.2) * 0.8, e + 2.2); o += '<path class="fo-fibrin" d="M' + f1(f[0]) + " " + f1(f[1]) + "Q" + f1(cx + (foR(i) - 0.5) * 30 * s) + " " + f1(cy + (foR(i + 4) - 0.5) * 30 * s) + " " + f1(g[0]) + " " + f1(g[1]) + '"/>'; }
  return o + "</g>";
}
/* the corpus luteum's outer outline (unscaled), shared by the drawing and its label */
function rOut(a) { return 138 + 5 * Math.sin(6 * a) + 3 * Math.sin(11 * a + 1); }
/* the corpus albicans: a shrunken, wavy, pale scar of collagen with a few flattened fibroblasts */
function foAlbicans(cx, cy, s) {
  function rr(a) { return s * (80 + 10 * Math.sin(5 * a) + 6 * Math.sin(9 * a + 2)); }
  var o = '<path class="fo-alb" d="' + foPolar(cx, cy, rr, 100) + '"/>', k, j;
  for (k = 1; k <= 4; k++) { var fr = 0.2 + k * 0.17, ph = k * 1.3; o += '<path class="fo-col" d="' + foPolar(cx, cy, function (a) { return rr(a) * fr * (1 + 0.06 * Math.sin(13 * a + ph)); }, 90) + '"/>'; }
  for (j = 0; j < 16; j++) { var a = foR(j * 4 + 2) * 6.283, d = rr(a) * (0.3 + 0.6 * foR(j * 4 + 3)), p = foPt(cx, cy, d, a); o += '<ellipse class="fo-fbn" cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" rx="4.6" ry="1.3" transform="rotate(' + f1(a * 57.3 + 90) + " " + f1(p[0]) + " " + f1(p[1]) + ')"/>'; }
  return o;
}
/* a label with extra lines under it */
function foLab(x, y, lines, px, py, a) { var o = L(x, y, lines[0], px, py, a || "start"), i; for (i = 1; i < lines.length; i++) o += T(x, y + i * 16, lines[i], "s mut", a || "start"); return o; }

function foRender(st, D) {
  var o = "", over = "", s = Math.max(0, Math.min(7, st.s)), fert = st.fert === "yes", cx = 196, cy = 250, LX = 398, FX0 = 8, FX1 = 386, FY0 = 58, FY1 = 424, i;
  st.s = s;
  var field = HOT("Ovarian cortex stroma: densely packed spindle-shaped stromal cells. The cortex holds the developing follicles; the medulla, deeper, is loose connective tissue rich in vessels and nerves.", '<rect class="fo-field" x="' + FX0 + '" y="' + FY0 + '" width="' + (FX1 - FX0) + '" height="' + (FY1 - FY0) + '" rx="10"/>');
  var labs = "", hole = [], sf = null;
  /* ---------- the section for each stage ---------- */
  var body = "";
  if (s === 0) {
    var r0 = 58;
    hole = [[cx, cy, r0 + 9], [312, 120, 20], [86, 372, 19], [318, 372, 17]];
    var prim = function (x, y, r, sd) { return foRing(x, y, r, r + 5, Math.max(6, Math.round(r / 4.2)), sd, "fo-fc", "fo-gn", "flat") + foOocyte(x, y, r, { nr: r * 0.34, nx: r * 0.22, ny: -r * 0.12 }); };
    body += HOT("Other primordial follicles: by menarche about 400,000 remain, each a primary oocyte arrested in prophase I.", prim(312, 120, 14, 1) + prim(86, 372, 13, 2) + prim(318, 372, 11, 3));
    body += HOT("Squamous follicular cells: a single layer of flat cells that completely surround the oocyte and are attached to each other by desmosomes.", foRing(cx, cy, r0, r0 + 7, 13, 0.2, "fo-fc", "fo-gn", "flat"));
    var dz = ""; for (i = 0; i < 13; i++) { var dp = foPt(cx, cy, r0 + 3.5, 0.2 + i * 2 * Math.PI / 13); dz += foCirc(dp[0], dp[1], 1.7, "fo-desmo"); }
    body += HOT("Desmosomes join the squamous follicular cells to each other.", dz);
    body += HOT("Primary oocyte, arrested in prophase of meiosis I: a spherical cell about 25 µm in diameter, with an asymmetric nucleus, vesicular-looking chromatin and prominent organelles.", foOocyte(cx, cy, r0, { nr: 19, nx: 22, ny: -15 }));
    labs += foLab(LX, 96, ["primary oocyte", "about 25 µm"], cx + 40, cy - 40);
    labs += foLab(LX, 176, ["asymmetric nucleus", "vesicular chromatin"], cx + 34, cy - 22);
    labs += foLab(LX, 262, ["follicular cells:", "squamous, one layer"], cx + r0 + 4, cy + 10);
    labs += foLab(LX, 330, ["desmosomes"], foPt(cx, cy, r0 + 3.5, 0.2 + 2 * 2 * Math.PI / 13)[0], foPt(cx, cy, r0 + 3.5, 0.2 + 2 * 2 * Math.PI / 13)[1]);
  } else if (s === 1) {
    var r1 = 84;
    hole = [[cx, cy, r1 + 24]];
    body += HOT("Primary oocyte, now a very large cell (100-150 µm) with a large nucleus and abundant RER, Golgi and mitochondria. Still arrested in prophase I.", foOocyte(cx, cy, r1, { nr: 26, nx: 6, ny: -4 }));
    var zf = ""; for (i = 0; i < 9; i++) { var za = i / 9 * 6.283; var zp = foPt(cx, cy, r1 + 2, za), zq = foPt(cx, cy, r1 + 2, za + 0.5); zf += '<path class="fo-zp" stroke-width="3" d="M' + f1(zp[0]) + " " + f1(zp[1]) + "A" + (r1 + 2) + " " + (r1 + 2) + " 0 0 1 " + f1(zq[0]) + " " + f1(zq[1]) + '"/>'; }
    body += HOT("Zona pellucida, beginning to form: rich in glycosaminoglycans and glycoproteins.", zf);
    body += HOT("Granulosa cells: the follicular cells have become cuboidal, and from this stage on they are called granulosa cells. One layer, so the follicle is unilaminar. Extensive gap junctions join them, but no tight junctions: there is no blood-follicle barrier (unlike the blood-testis barrier).", foRing(cx, cy, r1 + 4, r1 + 21, 24, 0.1, "fo-gc", "fo-gn", "round"));
    body += HOT("Basal lamina under the granulosa cells.", foCirc(cx, cy, r1 + 22, "fo-bl"));
    labs += foLab(LX, 92, ["primary oocyte", "100-150 µm"], cx + 52, cy - 50);
    labs += foLab(LX, 170, ["zona pellucida", "begins to form"], foPt(cx, cy, r1 + 2, -0.55)[0], foPt(cx, cy, r1 + 2, -0.55)[1]);
    labs += foLab(LX, 258, ["granulosa cells:", "cuboidal, one layer;", "gap junctions,", "no tight junctions"], foPt(cx, cy, r1 + 13, 0.25)[0], foPt(cx, cy, r1 + 13, 0.25)[1]);
  } else if (s === 2) {
    var r2 = 64, zo = r2 + 8, gR = zo + 52, ti = gR + 16, te = ti + 16;
    hole = [[cx, cy, te + 2]];
    body += HOT("Theca externa: mostly fibrous connective tissue and smooth muscle cells. Theca interna: richly vascularized connective tissue whose cells have LH receptors and, in response to LH, make androgens that are precursors to estrogen. Stromal cells organize into this theca folliculi outside the basal lamina of the granulosa cells.", foTheca(cx, cy, gR + 1, ti, te, 11, false));
    body += HOT("Basal lamina of the granulosa cells: the theca folliculi forms outside it.", foCirc(cx, cy, gR + 1, "fo-bl"));
    var lay = ""; for (i = 0; i < 4; i++) { var ra = zo + i * 13, rb = ra + 13; lay += foRing(cx, cy, ra, rb, Math.round(2 * Math.PI * (ra + 6.5) / 12), i * 0.09, "fo-gc", "fo-gn", "round"); }
    body += HOT("Granulosa cells proliferate into several layers: the follicle is now multilaminar.", lay);
    var mv = ""; for (i = 0; i < 44; i++) { var ma = i / 44 * 6.283, m0 = foPt(cx, cy, r2 + 0.5, ma), m1 = foPt(cx, cy, zo - 0.5, ma + 0.03); mv += "M" + f1(m0[0]) + " " + f1(m0[1]) + "L" + f1(m1[0]) + " " + f1(m1[1]); }
    body += HOT("Zona pellucida, now surrounding the oocyte: produced by the follicular cells, its major components are the glycoproteins ZP1, ZP2 and ZP3. Microvilli from the oocyte and filopodia from the granulosa cells penetrate it and make contact with each other.", '<circle class="fo-zp" cx="' + cx + '" cy="' + cy + '" r="' + (r2 + 4) + '" stroke-width="8"/><path class="fo-mv" d="' + mv + '"/>');
    body += HOT("Primary oocyte, still arrested in prophase I.", foOocyte(cx, cy, r2, { nr: 21, nx: 5, ny: -3 }));
    labs += foLab(LX, 84, ["theca externa", "fibrous CT and", "smooth muscle"], foPt(cx, cy, te - 6, -1.2)[0], foPt(cx, cy, te - 6, -1.2)[1]);
    labs += foLab(LX, 140, ["theca interna", "vascular; LH", "receptors: androgens"], foPt(cx, cy, (gR + ti) / 2, -0.75)[0], foPt(cx, cy, (gR + ti) / 2, -0.75)[1]);
    labs += foLab(LX, 208, ["basal lamina"], foPt(cx, cy, gR + 1, -0.3)[0], foPt(cx, cy, gR + 1, -0.3)[1]);
    labs += foLab(LX, 254, ["granulosa cells", "several layers"], foPt(cx, cy, zo + 30, 0.12)[0], foPt(cx, cy, zo + 30, 0.12)[1]);
    labs += foLab(LX, 316, ["zona pellucida", "ZP1, ZP2, ZP3"], foPt(cx, cy, r2 + 4, 0.75)[0], foPt(cx, cy, r2 + 4, 0.75)[1]);
  } else if (s === 3 || s === 4) {
    var G = s === 4, gR3 = G ? 126 : 106, ti3 = gR3 + (G ? 18 : 14), te3 = ti3 + (G ? 15 : 13), tc = G ? 2.35 : 2.25, wall = G ? 15 : 22;
    var ccx = cx, ccy = G ? 268 : cy, rc = G ? 82 : 60;
    var ra3 = function (a) { var d = Math.atan2(Math.sin(a - tc), Math.cos(a - tc)); return G ? (gR3 - wall) - 42 * Math.exp(-d * d / 0.2) : (gR3 - wall) - 26 * Math.exp(-d * d / 0.4) - 10 * (1 + Math.cos(d)); };
    var oR = G ? 20 : 21, oc = foPt(ccx, ccy, rc, tc), zr = oR + 4.5, cr = zr + 8.5;
    hole = [[ccx, ccy, te3 + 2]];
    if (G) sf = function (x) { return 128 - 30 * Math.exp(-Math.pow((x - ccx) / 130, 2)); };
    body += HOT(G ? "Theca layers, more prominent in the Graafian follicle: the theca interna (vascular, with LH receptors; makes androgens) inside the fibrous theca externa." : "Theca interna (vascular, LH receptors, makes androgens) and theca externa (fibrous connective tissue and smooth muscle).", foTheca(ccx, ccy, gR3 + 1, ti3, te3, 21, G));
    body += foCirc(ccx, ccy, gR3 + 1, "fo-bl");
    body += HOT("Granulosa cells, many layers. Under FSH they make liquor folliculi, and they secrete oocyte maturation inhibitor (OMI) into the antrum.", foGran(ccx, ccy, gR3, ra3, [oc[0], oc[1], cr], 5));
    body += HOT(G ? "Antrum: a large chamber of liquor folliculi. Granulosa cells keep adding glycosaminoglycans and hyaluronic acid, so it swells before ovulation." : "Liquor folliculi: made by granulosa cells under FSH (glycosaminoglycans, proteoglycans, steroid-binding proteins, progesterone, estradiol). It keeps accumulating until the pools form a single chamber, the antrum. Its presence is what distinguishes a secondary follicle from a primary one.", '<path class="fo-liq" d="' + foPolar(ccx, ccy, ra3, 120) + '"/>' + (G ? "" : '<ellipse class="fo-liq" cx="' + f1(ccx + 70) + '" cy="' + f1(ccy + 52) + '" rx="7" ry="4.5"/><ellipse class="fo-liq" cx="' + f1(ccx + 84) + '" cy="' + f1(ccy + 28) + '" rx="5" ry="3.5"/><ellipse class="fo-liq" cx="' + f1(ccx + 28) + '" cy="' + f1(ccy + 86) + '" rx="5.5" ry="3.5"/>'));
    body += HOT("Corona radiata: the single layer of granulosa cells that surrounds the oocyte.", foRing(oc[0], oc[1], zr, cr, 18, 0.2, "fo-gc", "fo-gn", "radial"));
    body += HOT("Zona pellucida (ZP1, ZP2, ZP3).", '<circle class="fo-zp" cx="' + f1(oc[0]) + '" cy="' + f1(oc[1]) + '" r="' + f1(oR + 2.5) + '" stroke-width="5"/>');
    body += HOT("Primary oocyte, still arrested in prophase I. Cortical granules are evident just under its plasma membrane.", foOocyte(oc[0], oc[1], oR, { nr: 8.5, nx: 3, ny: -2, cg: true }));
    var cum = foPt(ccx, ccy, rc + cr + 6, tc + 0.12);
    if (G) {
      labs += foLab(LX, 80, ["bulges on the", "ovary's surface"], ccx + 46, 104);
      labs += foLab(LX, 132, ["tunica albuginea"], ccx + 96, 122);
      labs += foLab(LX, 172, ["theca externa"], foPt(ccx, ccy, te3 - 6, -0.62)[0], foPt(ccx, ccy, te3 - 6, -0.62)[1]);
      labs += foLab(LX, 204, ["theca interna", "more prominent"], foPt(ccx, ccy, (gR3 + ti3) / 2, -0.34)[0], foPt(ccx, ccy, (gR3 + ti3) / 2, -0.34)[1]);
      labs += foLab(LX, 256, ["granulosa cells"], foPt(ccx, ccy, gR3 - 7, 0.02)[0], foPt(ccx, ccy, gR3 - 7, 0.02)[1]);
      labs += foLab(LX, 300, ["corona radiata"], foPt(oc[0], oc[1], cr - 2, 0.6)[0], foPt(oc[0], oc[1], cr - 2, 0.6)[1]);
      labs += foLab(LX, 340, ["cumulus oophorus", "holds the oocyte", "to the wall"], cum[0] + 4, cum[1] + 2);
      labs += T(ccx + 20, ccy - 8, "antrum", "b", "middle");
    } else {
      labs += foLab(LX, 90, ["theca externa"], foPt(ccx, ccy, te3 - 5, -1.0)[0], foPt(ccx, ccy, te3 - 5, -1.0)[1]);
      labs += foLab(LX, 126, ["theca interna"], foPt(ccx, ccy, (gR3 + ti3) / 2, -0.62)[0], foPt(ccx, ccy, (gR3 + ti3) / 2, -0.62)[1]);
      labs += foLab(LX, 168, ["antrum", "liquor folliculi"], ccx + 34, ccy - 20);
      labs += foLab(LX, 226, ["granulosa cells"], foPt(ccx, ccy, gR3 - 9, 0.2)[0], foPt(ccx, ccy, gR3 - 9, 0.2)[1]);
      labs += foLab(LX, 274, ["corona radiata"], foPt(oc[0], oc[1], cr - 2, 0.2)[0], foPt(oc[0], oc[1], cr - 2, 0.2)[1]);
      labs += foLab(LX, 316, ["cortical granules"], foPt(oc[0], oc[1], oR - 3, 0.9)[0], foPt(oc[0], oc[1], oR - 3, 0.9)[1]);
      labs += foLab(LX, 352, ["cumulus oophorus"], cum[0] + 2, cum[1] + 4);
    }
  } else if (s === 5) {
    var ox = cx - 10, oy = 284, g5 = 112, t5i = g5 + 17, t5e = t5i + 14;
    sf = function (x) { return 134 - 22 * Math.exp(-Math.pow((x - ox) / 120, 2)); };
    var ra5 = function (a) { return (g5 - 16) * (1 + 0.07 * Math.sin(6 * a) + 0.05 * Math.sin(11 * a + 1)); };
    hole = [[ox, oy, t5e + 2]];
    body += HOT("The emptied follicle collapses and becomes folded; LH then converts it into the corpus luteum.", foTheca(ox, oy, g5 + 1, t5i, t5e, 31, true) + foCirc(ox, oy, g5 + 1, "fo-bl") + foGran(ox, oy, g5, ra5, null, 8) + '<path class="fo-liq" d="' + foPolar(ox, oy, ra5, 120) + '"/>');
    /* the tear: open from the antrum through the follicle wall, the theca and the tunica albuginea */
    body += HOT("The swollen follicle pushed against the tunica albuginea until the walls of both the ovary and the follicle ruptured.", '<path class="fo-tear" d="M' + f1(ox - 12) + " " + f1(oy - g5 + 18) + "C" + f1(ox - 16) + " " + f1(oy - g5 - 6) + " " + f1(ox - 26) + " 132 " + f1(ox - 24) + " 108L" + f1(ox + 24) + " 108C" + f1(ox + 24) + " 132 " + f1(ox + 14) + " " + f1(oy - g5 - 6) + " " + f1(ox + 12) + " " + f1(oy - g5 + 18) + 'Z"/>');
    var fx = 290, fing = "M" + FX1 + " " + FY0 + "H" + (fx + 26) + "Q" + fx + " " + (FY0 + 14) + " " + (fx - 4) + " " + (FY0 + 28), k;
    for (k = 0; k < 6; k++) { var x0 = fx - 4 + k * 15, x1 = x0 + 15, dy = (k % 2) * 7; fing += "Q" + f1(x0 + 1) + " " + (FY0 + 46 + dy) + " " + f1(x0 + 7.5) + " " + (FY0 + 46 + dy) + "Q" + f1(x1 - 1) + " " + (FY0 + 46 + dy) + " " + f1(x1) + " " + (FY0 + 28 + (k === 5 ? 4 : 0)); }
    over += HOT("Infundibulum: the funnel-shaped end of the oviduct, covered by fimbriae. The secondary oocyte is released into the peritoneum near its opening and enters the duct.", '<path class="fo-tube" d="' + fing + "L" + FX1 + " " + (FY0 + 34) + 'Z"/>');
    over += '<ellipse class="fo-liq" cx="' + f1(ox + 6) + '" cy="100" rx="4" ry="2.6"/><ellipse class="fo-liq" cx="' + f1(ox + 20) + '" cy="93" rx="3" ry="2"/>';
    over += HOT("The secondary oocyte, arrested at metaphase II, with its first polar body under the zona pellucida and the cells of the corona radiata, released into the peritoneum near the infundibulum.", '<g class="fo-drift">' + foRing(ox + 56, 86, 16, 24, 15, 0.3, "fo-gc", "fo-gn", "radial") + '<circle class="fo-zp" cx="' + f1(ox + 56) + '" cy="86" r="14.5" stroke-width="3.5"/>' + foOocyte(ox + 56, 86, 12.5, { meta: true }) + foCirc(ox + 49, 94, 2.8, "fo-pb") + "</g>");
    labs += foLab(LX, 104, ["secondary oocyte", "+ corona radiata,", "toward the", "infundibulum"], ox + 78, 82);
    labs += foLab(LX, 184, ["first polar body"], ox + 50, 95);
    labs += foLab(LX, 236, ["ruptured tunica", "albuginea"], ox + 30, sf(ox + 30) + 9);
    labs += foLab(LX, 330, ["collapsing,", "folding follicle"], foPt(ox, oy, g5 - 6, 0.35)[0], foPt(ox, oy, g5 - 6, 0.35)[1]);
    labs += T(fx + 50, FY0 + 21, "fimbriae", "s", "middle");
  } else if (s === 6 || (s === 7 && fert)) {
    var sc = s === 7 ? 1.08 : 1, lx = cx, ly = cy + 4;
    hole = [[lx, ly, 150 * sc]];
    body += HOT(s === 7 ? "Corpus luteum, kept: if pregnancy occurs, the placenta produces a hormone that helps maintain the corpus luteum, and with it the progesterone that keeps the endometrium in place." : "Corpus luteum: the collapsed, folded follicle, converted by LH. Granulosa-lutein cells (from the granulosa cells) make progesterone and estrogen; theca-lutein cells (from the enlarged theca interna cells) make progesterone.", foLutein(lx, ly, sc, 0));
    var gp = foPt(lx, ly, 104 * sc, -0.35), tp = foPt(lx, ly, (rOut(0.25) - 5.5) * sc, 0.25), sa = (Math.PI / 2 - 0.4 + 2 * Math.PI * 1) / 7, sp = foPt(lx, ly, 104 * sc, sa), wa = 0.62, wp = foPt(lx, ly, (66 + 18 * Math.sin(7 * wa + 0.4) + 7 * Math.sin(3 * wa) + 16) * sc, wa);
    labs += HOT("Granulosa-lutein cells: from the granulosa cells of the Graafian follicle; they make progesterone and estrogen. The corpus luteum is mostly these.", foLab(LX, 96, ["granulosa-lutein", "cells: progesterone", "and estrogen"], gp[0], gp[1]));
    labs += HOT("Theca-lutein cells: the enlarged cells of the theca interna, smaller and darker, around the edge and down the folds; they make progesterone.", foLab(LX, 196, ["theca-lutein cells", "at the edge and in", "the folds:", "progesterone"], tp[0], tp[1]) + '<path class="lead" d="M' + (LX - 3) + " 192L" + f1(sp[0]) + " " + f1(sp[1]) + '"/>' + foCirc(sp[0], sp[1], 1.8, "dot"));
    labs += foLab(LX, 300, [s === 7 ? "kept by a hormone" : "folded wall", s === 7 ? "from the placenta" : "of the collapsed", s === 7 ? "" : "follicle"].filter(function (x) { return x; }), wp[0], wp[1]);
  } else {
    var ax = cx, ay = cy + 6;
    hole = [[ax, ay, 100]];
    body += HOT("Corpus albicans: with no pregnancy the corpus luteum degenerates, and the old structure fills with fibroblasts that secrete collagen, a pale scar.", foAlbicans(ax, ay, 1));
    labs += foLab(LX, 150, ["collagen"], ax + 28, ay - 36);
    labs += foLab(LX, 220, ["fibroblasts", "secrete it"], foPt(ax, ay, 46, 0.55)[0], foPt(ax, ay, 46, 0.55)[1]);
    labs += foLab(LX, 300, ["a pale scar: the", "corpus albicans"], ax + 82, ay + 26);
  }
  o += field + foStroma(FX0, FY0, FX1, FY1, hole, sf, 7 + s * 13, 300) + body;
  if (s === 4) o += HOT("The ovary's surface: an epithelium continuous with the mesothelium (the so-called germinal epithelium) over the tunica albuginea, its capsule. The Graafian follicle makes a bulge here and has to break through it at ovulation.", foSurface(FX0, FX1, 128, 30, cx, 130, null, FY0));
  if (s === 5) o += HOT("The ovary's surface and tunica albuginea, torn where the follicle ruptured.", foSurface(FX0, FX1, 134, 22, cx - 10, 120, [cx - 34, cx + 14], FY0)) + over;
  o += '<rect class="fo-frame" x="' + FX0 + '" y="' + FY0 + '" width="' + (FX1 - FX0) + '" height="' + (FY1 - FY0) + '" rx="10"/>';
  /* title and the meiosis badge */
  o += '<circle class="fo-num" cx="22" cy="28" r="13"/>' + T(22, 33, String(s + 1), "fo-numt", "middle");
  o += T(43, 34, s === 7 && fert ? "Corpus luteum, kept" : D.STAGES[s], "b fo-title", "start");
  if (s === 2 || s === 3) o += T(44, 51, s === 2 ? "L16 (Dr. Madison) calls this the secondary follicle" : "L16 calls a follicle with an antrum Graafian", "s mut fo-alt", "start");
  var mb = s <= 3 ? ["PRIMARY OOCYTE", "prophase I, arrested"] : s === 4 ? ["PRIMARY OOCYTE", "prophase I → LH surge"] : s === 5 ? ["SECONDARY OOCYTE", "metaphase II, arrested"] : fert ? ["FERTILIZED", "meiosis II completes"] : ["OOCYTE HAS LEFT", "metaphase II, ~24 h"];
  o += HOT(s <= 3 ? "Every follicle holds a primary oocyte arrested in prophase of meiosis I, from before birth until the LH surge." : s === 4 ? "Still prophase I. The LH surge causes release of meiosis-inducing factor, and the primary oocyte completes meiosis I shortly before ovulation." : s === 5 ? "Meiosis I ended with unequal cytokinesis: a secondary oocyte and the first polar body. The secondary oocyte entered meiosis II and is arrested at metaphase II until fertilization." : fert ? "Only upon fertilization (usually in the ampulla) does the oocyte complete meiosis II, forming the ovum and a second polar body." : "The ovulated secondary oocyte stays at metaphase II; unfertilized, it remains viable only about 24 hours.",
    '<rect class="fo-badge" x="364" y="7" width="212" height="44" rx="9"/>' + T(376, 24, "MEIOSIS · " + mb[0], "fo-bk", "start") + T(376, 43, mb[1], "b fo-bv", "start"));
  o += labs;
  o += T(LX, FY1 - 18, "not to scale:", "s mut", "start") + T(LX, FY1 - 3, s <= 0 ? "oocyte ≈ 25 µm" : s <= 3 ? "oocyte 100-150 µm" : s <= 5 ? "Graafian ≈ 20 mm" : "drawn to fill", "s mut", "start");
  return o;
}
function foSay(st, D) {
  var s = st.s, fert = st.fert === "yes";
  var A = [
    "Primordial follicle, the most primitive stage: a primary oocyte, about 25 µm, with an asymmetric nucleus and vesicular chromatin, completely surrounded by a single layer of squamous follicular cells joined by desmosomes. Look for: flat cells, one layer, no zona pellucida.",
    "Early primary (unilaminar) follicle: the follicular cells have become cuboidal, and from now on they are granulosa cells, still one layer. The oocyte grows to 100-150 µm, and the zona pellucida begins to form. Gap junctions, no tight junctions: no blood-follicle barrier. Look for: cuboidal cells, one layer.",
    "Late primary (multilaminar) follicle: the granulosa cells proliferate into several layers, the zona pellucida (ZP1, ZP2, ZP3) surrounds the oocyte, and stromal cells outside the basal lamina organize into the theca interna (vascular, LH receptors, androgens) and theca externa (fibrous). Look for: several layers, no fluid yet. Dr. Madison's L16 calls this many-layered follicle with a theca the secondary follicle.",
    "Secondary (antral) follicle: told apart by liquor folliculi, made by granulosa cells under FSH, pooling into one chamber, the antrum. A cumulus oophorus forms, the corona radiata is the single layer of granulosa cells around the oocyte, and cortical granules appear under its membrane. Look for: fluid. Dr. Madison's L16 calls any follicle with an antrum a Graafian follicle; the order of events is the same.",
    "Mature Graafian follicle: about 20 mm, it bulges on the surface of the ovary; the theca layers are more prominent, and the oocyte adheres to the wall through the cumulus oophorus. Primordial to here takes many months. Its estrogen triggers the LH surge, and meiosis I completes shortly before ovulation.",
    "Ovulation: LH raises blood flow and theca interna permeability (local edema) and releases meiosis-inducing factor. Hyaluronic acid swells the antrum until the follicle and the tunica albuginea rupture, and the secondary oocyte (with its first polar body, arrested at metaphase II) and the corona radiata are released near the infundibulum.",
    "Corpus luteum: the emptied follicle collapses and folds, and LH converts it. Granulosa-lutein cells, from the granulosa cells, make progesterone and estrogen; theca-lutein cells, from the enlarged theca interna cells, make progesterone.",
    fert ? "If pregnancy occurs: the placenta produces a hormone that helps maintain the corpus luteum, so it keeps making progesterone, which keeps the endometrium in place. No corpus albicans forms. Fertilization completed meiosis II: the ovum and a second polar body."
      : "If pregnancy does not occur: the corpus luteum degenerates, and the old structure fills with fibroblasts that secrete collagen, becoming the corpus albicans. The unfertilized oocyte stayed viable only about 24 hours."];
  var arrest = s <= 4 ? "prophase I" : s === 5 ? "metaphase II" : fert ? "fertilized" : "not fertilized";
  return [A[s], "stage " + (s + 1) + "/8 · " + arrest];
}
function foOnset(st, key) { if (key === "fert" && st.s < 6) st.s = 7; }

export default function follicle() {
  const stageBtns = STAGES.map((n, i) => `<button type="button" class="am-btn" data-amk="s" data-amv="${i}">${i + 1} ${n.replace(" follicle", "").replace("Mature ", "")}</button>`).join("");
  return makeFig({ id: "follicle", lec: "fhisto", fig: "Fig 7", short: "Follicle stages", hint: "step · hover a part",
    title: "From primordial follicle to corpus luteum",
    caption: "Dr. Herr's five follicle stages in section, then ovulation, the corpus luteum and what becomes of it. Step through them, check the oocyte's meiotic arrest in the badge, and switch between no fertilization and fertilization.",
    W, H, label: "An ovarian follicle in histologic section at each stage from primordial follicle to corpus albicans, with its layers labeled and the oocyte's meiotic arrest in a badge.",
    D: { INIT: { s: 0, fert: "no" }, STEPKEY: "s", STEPMAX: 7, PLAYMS: 2800, STAGES, ONSET: "foOnset" }, render: foRender, say: foSay,
    helpers: [foR, foPt, foSmooth, foPolar, foCirc, foRing, foStroma, foOocyte, foTheca, foGran, foSurface, rOut, foLutein, foAlbicans, foLab, foOnset],
    controls: `<div class="am-controls fo-stages" role="group" aria-label="Stage">${stageBtns}</div>
<div class="am-controls"><button type="button" class="am-btn" data-amstep="-1">Back</button><button type="button" class="am-btn" data-amstep="1">Next</button><button type="button" class="am-btn" data-amplay aria-pressed="false">Play</button><span class="fo-sep" aria-hidden="true"></span><span class="fo-lbl">After ovulation:</span><button type="button" class="am-btn" data-amk="fert" data-amv="no">No fertilization</button><button type="button" class="am-btn" data-amk="fert" data-amv="yes">Fertilization</button></div>`,
    sources: [
      "From the L14 notes and slides (Dr. Herr): the five stages and how to tell them apart (squamous or cuboidal cells, one layer or several, fluid, a bulge on the ovary); the oocyte's size (about 25 µm in the primordial follicle, 100-150 µm once growing) and the Graafian follicle's (about 20 mm); his starred slide on the arrests (prophase I in every follicle, meiosis I completed shortly before ovulation after the LH surge, metaphase II until fertilization); ovulation; the granulosa-lutein and theca-lutein cells; the corpus albicans; and the placenta's hormone that maintains the corpus luteum in pregnancy (the slide doesn't name it).",
      "The names are Dr. Herr's (L14). Dr. Madison's L16 names the same sequence differently: his secondary follicle is the many-layered follicle with a theca (L14's late primary), and his Graafian follicle is any follicle with an antrum (L14's secondary, then mature Graafian). L16 also puts the end of meiosis I at ovulation and has the corpus luteum regress over 14 days; the badge follows L14 (meiosis I finishes shortly before ovulation, meiosis II only at fertilization), since this is his lecture.",
      "Schematic sections, not to scale: each stage is drawn to fill the frame, so the oocyte looks the same size from stage to stage when it really grows from about 25 to 100-150 µm, and the follicle from a fraction of a millimeter to about 20 mm. Cell counts, the folds of the corpus luteum and the stroma's whorls are drawn for the look, from standard histology atlas views; only the parts the lecture names are labeled. Educational, not medical advice."],
    css: `
.anima[data-anima="follicle"] .am-svg{max-width:600px}
.anima .follicle-svg .t{font-size:13px}
.anima .follicle-svg .t.s{font-size:12px}
.anima .follicle-svg .fo-title{font-size:15px}
.anima .follicle-svg .fo-alt{font-size:11px}
.anima .follicle-svg .fo-num{fill:var(--accent)}
.anima .follicle-svg .fo-numt{fill:var(--surface);stroke:none;font-weight:700;font-size:13px}
.anima .follicle-svg .fo-badge{fill:var(--accent-soft);stroke:var(--accent);stroke-width:1.2}
.anima .follicle-svg .fo-bk{font-size:10.5px;letter-spacing:.04em;fill:var(--anatomy-muted);stroke:none}
.anima .follicle-svg .fo-bv{font-size:13px;fill:var(--accent-ink);stroke:none}
.anima .follicle-svg .fo-field{fill:var(--bx-matrix)}
.anima .follicle-svg .fo-frame{fill:none;stroke:var(--anatomy-lo);stroke-width:1.2}
.anima .follicle-svg .fo-sn{fill:var(--bx-nuc);opacity:.5}
.anima .follicle-svg .fo-peri{fill:var(--surface)}
.anima .follicle-svg .fo-oo{fill:var(--bx-cyto);stroke:var(--bx-cyto-line);stroke-width:1.2}
.anima .follicle-svg .fo-org{fill:var(--bx-cyto-line);opacity:.32}
.anima .follicle-svg .fo-cg{fill:var(--bx-memb);opacity:.8}
.anima .follicle-svg .fo-onuc{fill:var(--bx-lumen);stroke:var(--bx-nuc);stroke-width:1.4}
.anima .follicle-svg .fo-chr{fill:var(--bx-nuc);opacity:.75}
.anima .follicle-svg .fo-ncl{fill:var(--bx-nuc-line)}
.anima .follicle-svg .fo-mp{stroke:var(--bx-nuc-line);stroke-width:2.2;stroke-linecap:round}
.anima .follicle-svg .fo-sp{fill:none;stroke:var(--bx-nuc);stroke-width:.6;opacity:.6}
.anima .follicle-svg .fo-pb{fill:var(--bx-cyto);stroke:var(--bx-nuc);stroke-width:1}
.anima .follicle-svg .fo-zp{fill:none;stroke:var(--bx-eosin)}
.anima .follicle-svg .fo-mv{fill:none;stroke:var(--bx-cyto-line);stroke-width:.6;opacity:.8}
.anima .follicle-svg .fo-fc{fill:var(--bx-violet-soft);stroke:var(--bx-violet);stroke-width:.6}
.anima .follicle-svg .fo-gc{fill:var(--bx-violet-soft);stroke:var(--bx-violet);stroke-width:.6}
.anima .follicle-svg .fo-gbg{fill:var(--bx-violet-soft)}
.anima .follicle-svg .fo-gn{fill:var(--bx-nuc)}
.anima .follicle-svg .fo-desmo{fill:var(--anatomy-hi)}
.anima .follicle-svg .fo-bl{fill:none;stroke:var(--bx-memb);stroke-width:1.3}
.anima .follicle-svg .fo-ti{fill:var(--bx-cyto)}
.anima .follicle-svg .fo-ti.fo-swell{fill:var(--bx-blood-soft)}
.anima .follicle-svg .fo-te{fill:var(--bx-eosin)}
.anima .follicle-svg .fo-fib{fill:none;stroke:var(--bx-cyto-line);stroke-width:.7;opacity:.7}
.anima .follicle-svg .fo-tn{fill:var(--bx-nuc-line)}
.anima .follicle-svg .fo-cap{fill:var(--bx-blood-soft);stroke:var(--bx-blood);stroke-width:1}
.anima .follicle-svg .fo-rbc{fill:var(--bx-blood)}
.anima .follicle-svg .fo-liq{fill:var(--bx-lumen);stroke:var(--bx-cyto-line);stroke-width:.8}
.anima .follicle-svg .fo-plume{opacity:.85}
.anima .follicle-svg .fo-tun{fill:var(--bx-eosin);stroke:var(--bx-cyto-line);stroke-width:.6}
.anima .follicle-svg .fo-epi{fill:none;stroke:var(--bx-violet);stroke-width:4;stroke-linecap:round;opacity:.55}
.anima .follicle-svg .fo-tube{fill:var(--bx-cyto);stroke:var(--bx-cyto-line);stroke-width:1.2}
.anima .follicle-svg .fo-tl{fill:var(--bx-gold)}
.anima .follicle-svg .fo-gl{fill:var(--bx-gold-soft)}
.anima .follicle-svg .fo-glc{fill:var(--bx-gold-soft);stroke:var(--bx-gold);stroke-width:.8}
.anima .follicle-svg .fo-tlc{fill:var(--bx-gold);stroke:var(--bx-hot);stroke-width:.6}
.anima .follicle-svg .fo-core{fill:var(--bx-lumen);stroke:var(--bx-gold);stroke-width:1}
.anima .follicle-svg .fo-fibrin{fill:none;stroke:var(--bx-eosin);stroke-width:.9;opacity:.8}
.anima .follicle-svg .fo-alb{fill:var(--bx-fat);stroke:var(--bx-fat-line);stroke-width:1.2}
.anima .follicle-svg .fo-col{fill:none;stroke:var(--bx-fat-line);stroke-width:.9;opacity:.85}
.anima .follicle-svg .fo-fbn{fill:var(--bx-nuc);opacity:.7}
.anima .follicle-svg .fo-drift{animation:fo-drift 4.8s ease-in-out infinite alternate}
@keyframes fo-drift{from{transform:translate(-30px,16px)}to{transform:translate(6px,-3px)}}
.anima .follicle-svg .fo-tear{fill:var(--bx-lumen);stroke:var(--bx-cyto-line);stroke-width:.8}
@media (max-width:560px){.anima .follicle-svg .t{font-size:15.5px}.anima .follicle-svg .t.s{font-size:13.5px}.anima .follicle-svg .fo-title{font-size:17px}.anima .follicle-svg .fo-bk{font-size:11.5px}.anima .follicle-svg .fo-bv{font-size:14.5px}.anima .follicle-svg .fo-alt{font-size:12px}}
@media (prefers-reduced-motion: reduce){.anima .follicle-svg .fo-drift{animation:none}}
.anima .fo-stages .am-btn{padding:4px 8px;font-size:.76rem}
.anima .fo-sep{flex:0 0 6px}
.anima .fo-lbl{font:600 .78rem var(--font-body);color:var(--ink-faint)}
`,
  });
}
