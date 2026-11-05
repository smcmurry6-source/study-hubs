// Fig: inside a seminiferous tubule (L13 Male Reproductive Histology, Dr. Herr; also L15, Dr. Madison). A wedge cut
// from a tubule in cross-section, as on his labeled section: the lumen at the top (the tubule's center), the seminiferous
// epithelium below it, the wall (basement membrane and peritubular myoid cells), then the interstitium with Leydig cells
// and a capillary. Sertoli cells reach from the basement membrane to the lumen and are joined near their bases by tight
// junctions (the blood-testis barrier) that split the basal and adluminal compartments. Two views: step one clone through
// spermatogenesis (pale A spermatogonium, mitosis, the primary spermatocyte crossing the junctions, meiosis I and II,
// spermiogenesis, spermiation) with its chromosome count as the lectures write it (diploid 2n, haploid 1n), or the
// hormones (LH on Leydig cells, FSH on Sertoli cells, ABP, inhibin and the two brakes). Schematic, not to scale.
import { makeFig, f1, T, L, HOT } from "./shared.mjs";

/* ---------- geometry: polar coordinates around the tubule's center (above the drawing) ---------- */
function tbP(a, R, D) { var r = a * Math.PI / 180; return [D.CX + R * Math.sin(r), D.CY + R * Math.cos(r)]; }
function tbPath(p, close) { var o = "", i; for (i = 0; i < p.length; i++) o += (i ? "L" : "M") + f1(p[i][0]) + " " + f1(p[i][1]); return o + (close ? "Z" : ""); }
function tbArc(a1, a2, R, D, n) { var o = [], i; n = n || 28; for (i = 0; i <= n; i++) o.push(tbP(a1 + (a2 - a1) * i / n, R, D)); return o; }
function tbSector(a1, a2, R1, R2, D) { return tbPath(tbArc(a1, a2, R1, D).concat(tbArc(a2, a1, R2, D)), true); }
/* closed smooth path through points (Catmull-Rom as cubic Bezier) */
function tbSm(p) {
  var n = p.length, d = "M" + f1(p[0][0]) + " " + f1(p[0][1]), i, a, b, c, e;
  for (i = 0; i < n; i++) { a = p[(i - 1 + n) % n]; b = p[i]; c = p[(i + 1) % n]; e = p[(i + 2) % n];
    d += "C" + f1(b[0] + (c[0] - a[0]) / 6) + " " + f1(b[1] + (c[1] - a[1]) / 6) + " " + f1(c[0] - (e[0] - b[0]) / 6) + " " + f1(c[1] - (e[1] - b[1]) / 6) + " " + f1(c[0]) + " " + f1(c[1]); }
  return d + "Z";
}
/* the point a fraction u along a polyline, and dots riding it (they fade in and out at the ends) */
function tbAt(p, u) {
  var Ls = [], tot = 0, i, s;
  for (i = 1; i < p.length; i++) { var dd = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); Ls.push(dd); tot += dd; }
  s = Math.max(0, Math.min(1, u)) * tot;
  for (i = 0; i < Ls.length; i++) { if (s <= Ls[i] || i === Ls.length - 1) { var w = Ls[i] ? Math.min(1, s / Ls[i]) : 0; return [p[i][0] + (p[i + 1][0] - p[i][0]) * w, p[i][1] + (p[i + 1][1] - p[i][1]) * w]; } s -= Ls[i]; }
  return p[p.length - 1];
}
function tbFlow(p, n, per, t, cls, r, off, lvl) {
  var o = "", i, u, q, k;
  if (lvl !== undefined && lvl <= 0.02) return "";
  for (i = 0; i < n; i++) {
    u = (((t / per) + i / n + (off || 0)) % 1 + 1) % 1; q = tbAt(p, u);
    k = Math.min(1, u * 7, (1 - u) * 7) * (lvl === undefined ? 1 : lvl);
    o += '<circle class="' + cls + '" cx="' + f1(q[0]) + '" cy="' + f1(q[1]) + '" r="' + (r || 3) + '" opacity="' + f1(k) + '"/>';
  }
  return o;
}

/* ---------- one germ cell, drawn in its own frame: +y points out toward the basement membrane ---------- */
/* k: dA (dark type A), pA (pale type A), B (type B spermatogonium), ps / ss (primary / secondary spermatocyte),
   sd (spermatid, m 0 round .. 1 elongated, with tail), sz (spermatozoon), rb (cytoplasm left behind) */
function tbCell(k, x, y, rot, s, m, hl, wig) {
  var o = "", c = hl ? " is-trk" : "", r;
  function E(cx, cy, rx, ry, cls) { return '<ellipse class="' + cls + '" cx="' + f1(cx) + '" cy="' + f1(cy) + '" rx="' + f1(rx) + '" ry="' + f1(ry) + '"/>'; }
  function lerp(a, b, u) { return a + (b - a) * u; }
  if (k === "dA" || k === "pA") {
    if (hl) o += E(0, 0, 21 * s, 16 * s, "tb-halo");
    o += E(0, 0, 16.5 * s, 12 * s, "tb-cy" + c);
    o += E(0, 0.5, 10.5 * s, 7 * s, k === "dA" ? "tb-nu" : "tb-nu tb-pale");
    if (k === "dA") o += '<circle class="tb-nl" cx="' + f1(7.6 * s) + '" cy="0" r="1.9"/><circle class="tb-vac" cx="' + f1(-2.5 * s) + '" cy="0.8" r="2.4"/>';
    else o += '<circle class="tb-nl" cx="0" cy="0.5" r="2.1"/>';
  } else if (k === "B") {
    r = 12.5 * s;
    if (hl) o += '<circle class="tb-halo" r="' + f1(r + 5) + '"/>';
    o += '<circle class="tb-cy' + c + '" r="' + f1(r) + '"/><circle class="tb-nu" r="' + f1(r * 0.6) + '"/>';
    o += '<circle class="tb-chr" cx="' + f1(-r * 0.3) + '" cy="' + f1(-r * 0.2) + '" r="1.2"/><circle class="tb-chr" cx="' + f1(r * 0.28) + '" cy="' + f1(r * 0.1) + '" r="1.2"/><circle class="tb-chr" cx="0" cy="' + f1(r * 0.33) + '" r="1.1"/>';
  } else if (k === "ps" || k === "ss") {
    r = (k === "ps" ? 17 : 13.5) * s;
    if (hl) o += '<circle class="tb-halo" r="' + f1(r + 5) + '"/>';
    o += '<circle class="tb-cy' + c + '" r="' + f1(r) + '"/><circle class="tb-nu' + (k === "ps" ? " tb-pale" : "") + '" r="' + f1(r * 0.6) + '"/>';
    /* condensed chromatin threads (the look of a cell in meiosis) */
    if (k === "ps") o += '<path class="tb-thr" d="M' + f1(-r * 0.4) + " " + f1(-r * 0.1) + "q" + f1(r * 0.2) + " " + f1(-r * 0.3) + " " + f1(r * 0.4) + " " + f1(-r * 0.12) + "M" + f1(-r * 0.15) + " " + f1(r * 0.3) + "q" + f1(r * 0.25) + " " + f1(-r * 0.05) + " " + f1(r * 0.42) + " " + f1(-r * 0.28) + "M" + f1(-r * 0.36) + " " + f1(r * 0.18) + "q" + f1(r * 0.05) + " " + f1(-r * 0.18) + " " + f1(r * 0.16) + " " + f1(-r * 0.22) + '"/>';
    else o += '<circle class="tb-chr" cx="' + f1(-r * 0.18) + '" cy="' + f1(-r * 0.12) + '" r="1.3"/><circle class="tb-chr" cx="' + f1(r * 0.2) + '" cy="' + f1(r * 0.15) + '" r="1.3"/>';
  } else if (k === "sd" || k === "sz") {
    var mm = k === "sz" ? 1 : m, free = k === "sz", cyR = lerp(9, 5.4, mm) * s, cyY = lerp(0, -5, mm) * s;
    var nY = lerp(0, 3.4, mm) * s, nRx = lerp(5.2, 2.7, mm) * s, nRy = lerp(5.2, 6.3, mm) * s, tl = lerp(0, 50, mm) * s, base = nY - nRy;
    if (hl) o += free ? E(0, nY, nRx + 5, nRy + 5, "tb-halo") : '<circle class="tb-halo" cx="0" cy="' + f1(cyY) + '" r="' + f1(cyR + 5) + '"/>';
    /* tail (flagellum), waving a little when the page animates */
    if (tl > 1) { var w = (wig || 0), q1 = 3.2 * Math.sin(w), q2 = -3.2 * Math.sin(w + 1.6); o += '<path class="tb-tail" d="M0 ' + f1(base) + "Q" + f1(q1 * s) + " " + f1(base - tl * 0.35) + " 0 " + f1(base - tl * 0.55) + "T" + f1(q2 * 0.6 * s) + " " + f1(base - tl) + '"/>'; }
    if (!free) o += '<circle class="tb-cy' + c + '" cx="0" cy="' + f1(cyY) + '" r="' + f1(cyR) + '"/>';
    /* mitochondria: scattered in the round spermatid, gathered into the middle piece at the end */
    if (mm < 0.55) { var gm = mm / 0.55; [[-5, -3], [4.6, -4], [-3.4, 4.4]].forEach(function (q) { o += E(lerp(q[0] * s, 0, gm), lerp(q[1] * s, base - 3 * s, gm), 1.7 * s, 1 * s, "tb-mito"); }); }
    else o += '<path class="tb-mid" d="M0 ' + f1(base) + "V" + f1(base - 7.5 * s) + '"/>';
    /* the Golgi moves to the top (the outward pole) of the nucleus and becomes the acrosome */
    if (mm < 0.4) { var ga = lerp(0, Math.PI / 2, mm / 0.4), gx = Math.cos(ga) * 7.4 * s, gy = Math.sin(ga) * 7.4 * s; o += '<path class="tb-golgi" opacity="' + f1(1 - mm / 0.4) + '" d="M' + f1(gx - 2.6 * s) + " " + f1(gy) + "q" + f1(2.6 * s) + " " + f1(2.2 * s) + " " + f1(5.2 * s) + " 0M" + f1(gx - 2 * s) + " " + f1(gy - 1.8 * s) + "q" + f1(2 * s) + " " + f1(1.8 * s) + " " + f1(4 * s) + ' 0"/>'; }
    o += E(0, nY, nRx, nRy, mm > 0.6 ? "tb-nu tb-dense" : "tb-nu");
    if (mm > 0.15) { var ao = Math.min(1, (mm - 0.15) * 3); o += '<path class="tb-acro" opacity="' + f1(ao) + '" d="M' + f1(-nRx - 0.6) + " " + f1(nY + nRy * 0.15) + "Q" + f1(-nRx) + " " + f1(nY + nRy + 2.6 * s) + " 0 " + f1(nY + nRy + 2.4 * s) + "Q" + f1(nRx) + " " + f1(nY + nRy + 2.6 * s) + " " + f1(nRx + 0.6) + " " + f1(nY + nRy * 0.15) + "Q0 " + f1(nY + nRy * 0.9) + " " + f1(-nRx - 0.6) + " " + f1(nY + nRy * 0.15) + 'Z"/>'; }
  } else if (k === "rb") {
    o += '<path class="tb-cy" d="M' + f1(-4.6 * s) + " 0C" + f1(-4.6 * s) + " " + f1(-4 * s) + " " + f1(3.4 * s) + " " + f1(-5 * s) + " " + f1(4.6 * s) + " " + f1(-0.6 * s) + "C" + f1(5.4 * s) + " " + f1(3.4 * s) + " " + f1(-4.6 * s) + " " + f1(4.4 * s) + " " + f1(-4.6 * s) + ' 0Z"/>';
  }
  return '<g class="tb-cell" transform="translate(' + f1(x) + " " + f1(y) + ") rotate(" + f1(rot) + ')">' + o + "</g>";
}

const INFO = {
  dA: "Dark type A spermatogonium: a reserve stem cell, small and basal, on the basement membrane in the basal compartment. Oval to flattened nucleus with a peripheral nucleolus and a nuclear vacuole. Gives rise to more dark A and pale A.",
  pA: "Pale type A spermatogonium: a progenitor cell. Its nucleus stains lighter (rich in euchromatin), with a central nucleolus and no vacuole. Gives rise to more pale A and type B.",
  B: "Type B spermatogonium: a committed cell. It becomes a primary spermatocyte, which moves straight into the adluminal compartment.",
  ps: "Primary spermatocyte: a larger germ cell above the tight junctions, in the adluminal compartment. It starts out diploid (2n) and is the cell that carries out meiosis.",
  ss: "Secondary spermatocyte: the cell between the two meiotic divisions. Meiosis I has halved the chromosomes (1n); no new chromosomes are made before meiosis II.",
  sd: "Early spermatid: haploid (1n), with 23 unpaired chromosomes (22 autosomes and an X or a Y). One primary spermatocyte makes four.",
  ld: "Late spermatids line the lumen, held in the Sertoli cell's apical cytoplasm. Spermiogenesis has condensed the nucleus into the head, made the acrosome from the Golgi, gathered the mitochondria into the middle piece and grown a flagellum.",
  sz: "Spermatozoa released into the lumen (spermiation). They are not finished: maturation is completed in the epididymis, and capacitation happens later, in the female tract.",
  rb: "Excess cytoplasm left behind at spermiation: the Sertoli cell phagocytoses it.",
};

/* ---------- the drawing's fixed parts, built once here and stored as SVG strings ---------- */
const G = { CX: 300, CY: -190, TH: 18, RL: 292, RJ: 522, RB: 560, RW: 582, RO: 700, RC: 661, SERT: [-12, 0, 12] };
function dg(px, R) { return px / R * 180 / Math.PI; }

function sertoliOutline(ac, aL, aR) {
  /* half widths (px) up the column; the flaps at R 516-528 reach the neighbors over the spermatogonia */
  var up = [[G.RB + 1, 12], [546, 10.5], [533, 9.5], ["flap"], [503, 13], [484, 11.5], [458, 12.5], [432, 10.5], [404, 11.5], [378, 9.5], [350, 10], [326, 8.5], [306, 6.5]];
  var left = [], right = [];
  up.forEach(function (q) {
    if (q[0] === "flap") { left.push([aL, 529], [aL, 516]); right.push([aR, 529], [aR, 516]); return; }
    left.push([ac - dg(q[1], q[0]), q[0]]); right.push([ac + dg(q[1], q[0]), q[0]]);
  });
  var pts = left.concat([[ac, G.RL - 1]]).concat(right.reverse());
  return tbSm(pts.map(function (q) { return tbP(q[0], q[1], G); }));
}

function staticParts() {
  var o = {}, s = "", i;
  /* interstitium: loose, vascular connective tissue */
  var inter = tbSector(-G.TH, G.TH, G.RW, G.RO, G), fib = "";
  [[-15, 600, 9], [-3, 596, 7], [4, 640, 8], [13, 604, 6], [-7, 686, 10], [9, 688, 9], [-16, 678, 6], [16, 650, 4]].forEach(function (f) {
    var a = tbP(f[0], f[1], G), b = tbP(f[0] + f[2] * 0.5, f[1] + 6, G), c = tbP(f[0] + f[2], f[1] - 2, G);
    fib += "M" + f1(a[0]) + " " + f1(a[1]) + "Q" + f1(b[0]) + " " + f1(b[1] + 8) + " " + f1(c[0]) + " " + f1(c[1]);
  });
  s += HOT("Interstitium: the loose, vascular connective tissue between the tubules. The Leydig cells live here, outside the tubule.", '<path class="tb-int" d="' + inter + '"/><path class="tb-fib" d="' + fib + '"/>');
  o.BG0 = s; s = "";
  /* Leydig cells: two clusters of polygonal eosinophilic cells with round nuclei */
  var ley = "", cl = [[-10.5, 616], [-7.6, 618], [-9.2, 640], [-12.1, 637], [7.4, 612], [10.2, 615], [8.7, 637], [11.6, 637], [5.8, 634]];
  cl.forEach(function (c, j) {
    var p = tbP(c[0], c[1], G), pts = [], k;
    for (k = 0; k < 6; k++) { var an = (k / 6) * Math.PI * 2 + j * 0.7, rr = 11.5 + ((j * 7 + k * 3) % 5) * 0.6; pts.push([p[0] + Math.cos(an) * rr, p[1] + Math.sin(an) * rr * 0.92]); }
    ley += '<path class="tb-ley" d="' + tbSm(pts) + '"/><circle class="tb-nu" cx="' + f1(p[0] + (j % 2 ? 2 : -2)) + '" cy="' + f1(p[1] - 1) + '" r="4.3"/>';
  });
  o.LEY = ley;
  /* the wall: connective tissue with peritubular myoid cells, the basement membrane on its inner face */
  var wall = tbSector(-G.TH, G.TH, G.RB, G.RW, G), my = "";
  [[-16.6, -7.6], [-6.4, 4.8], [6, 16.4]].forEach(function (m) {
    var top = tbArc(m[0], m[1], 566, G, 10), bot = tbArc(m[1], m[0], 575, G, 10), mid = (m[0] + m[1]) / 2;
    var lens = top.concat(bot); lens[0] = tbP(m[0] - 0.4, 570.5, G); lens[top.length - 1] = tbP(m[1] + 0.4, 570.5, G);
    var na = tbArc(mid - 2.2, mid + 2.2, 570.5, G, 6);
    my += '<path class="tb-myo" d="' + tbPath(lens, true) + '"/><path class="tb-myon" d="' + tbPath(na) + '"/>';
  });
  o.WALL = HOT("The tubule wall: connective tissue with peritubular myoid cells. The myoid cells are in the wall itself, not out in the interstitium.", '<path class="tb-wall" d="' + wall + '"/>' + my);
  o.BM = HOT("Basement membrane: the spermatogonia sit on it, and the Sertoli cells reach from it to the lumen.", '<path class="tb-bm" d="' + tbPath(tbArc(-G.TH, G.TH, G.RB, G)) + '"/>');
  /* the epithelium's ground and the lumen */
  o.EPI = '<path class="tb-epi" d="' + tbSector(-G.TH, G.TH, G.RL, G.RB, G) + '"/>';
  o.LUM = HOT("Lumen of the seminiferous tubule. Released sperm leave through it, toward the tubuli recti and the rete testis.", '<path class="tb-lum" d="' + tbPath([tbP(-G.TH, 196, G), tbP(G.TH, 196, G)].concat(tbArc(G.TH, -G.TH, G.RL, G)), true) + '"/>');
  /* Sertoli cells, their nuclei and the tight junctions between them */
  var flaps = [[-G.TH, -6], [-6, 6], [6, G.TH]], sert = "", sertO = "";
  G.SERT.forEach(function (ac, j) {
    var d = sertoliOutline(ac, flaps[j][0], flaps[j][1]), np = tbP(ac, 497, G);
    sertO += '<path d="' + d + '"/>';
    sert += HOT("Sertoli (sustentacular) cell: columnar, reaching from the basement membrane to the lumen, with a generally ovoid nucleus. It answers FSH; supports and feeds the germ cells, phagocytoses the cytoplasm they shed, and makes androgen-binding protein, inhibin and anti-Müllerian hormone. It does not divide in the adult and resists heat, radiation and toxins.",
      '<path class="tb-sert" d="' + d + '"/><g transform="translate(' + f1(np[0]) + " " + f1(np[1]) + ") rotate(" + f1(-ac) + ')"><ellipse class="tb-snu" rx="6.8" ry="11.5"/><circle class="tb-nl" cy="-1" r="2.1"/></g>');
  });
  o.SERT = sert; o.SERTO = sertO;
  var tj = "";
  [-6, 6].forEach(function (a) {
    var p1 = tbP(a, 530, G), p2 = tbP(a, 515, G), d = "M" + f1(p1[0]) + " " + f1(p1[1]) + "L" + f1(p2[0]) + " " + f1(p2[1]);
    tj += '<path class="tb-tj" d="' + d + '"/>';
    for (i = 0; i < 3; i++) { var q = tbP(a, 518.5 + i * 4.5, G); tj += '<circle class="tb-tjd" cx="' + f1(q[0]) + '" cy="' + f1(q[1]) + '" r="1.5"/>'; }
  });
  o.TJ = HOT("Occluding (tight) junctions between neighboring Sertoli cells, near their bases: the blood-testis barrier. They divide the epithelium into the basal compartment (the spermatogonia) and the adluminal compartment (spermatocytes and spermatids), protecting the developing gametes from the immune system.", tj);
  /* the germ cells that aren't followed: left gap, the two edge gaps; late spermatids at the Sertoli apices; sperm in the lumen */
  var bg = [["dA", -6, 545], ["ps", -8.3, 472], ["ps", -3.8, 466], ["ss", -6.2, 414], ["sd", -7.9, 368], ["sd", -4.3, 362],
    ["pA", -15.7, 546], ["ss", -15.3, 420], ["sd", -15.5, 364], ["B", 15.6, 546], ["ps", 15.4, 470], ["sd", 15.4, 366]];
  var cells = "";
  bg.forEach(function (c) { var p = tbP(c[1], c[2], G), flat = c[0] === "dA" || c[0] === "pA"; cells += HOT(INFO[c[0]], tbCell(c[0], p[0], p[1], -c[1], 1, 0, 0, 0)); });
  o.CELLS = cells;
  /* late spermatids: heads held in the Sertoli apices, tails into the lumen */
  var ld = "";
  [[-13.6, 318], [-11.9, 312], [-10.3, 320], [-1.6, 316], [0.1, 310], [1.7, 318], [-16.6, 322], [12, 312], [13.6, 319], [16.4, 324]].forEach(function (c) { var p = tbP(c[0], c[1], G); ld += tbCell("sd", p[0], p[1], -c[0], 1, 1, 0, c[0]); });
  o.LATE = HOT(INFO.ld, ld);
  o.LUMSP = [[-7.4, 270, 0.3], [-3.2, 258, 1.2], [-14.4, 262, 2.4], [14.6, 250, 3.1]];
  /* the right gap when it isn't following a clone (hormone views): the same kinds of cells as the left gap */
  var rg = "";
  [["pA", 4.4, 545], ["B", 8.8, 546], ["ps", 4.2, 468], ["ps", 8.6, 474], ["ss", 6.2, 414], ["sd", 4.6, 364], ["sd", 8.2, 368]].forEach(function (c) { var p = tbP(c[1], c[2], G); rg += HOT(INFO[c[0]], tbCell(c[0], p[0], p[1], -c[1], 1, 0, 0, 0)); });
  o.RIGHT = rg;
  /* compartments (shading) */
  o.BASAL = tbSector(-G.TH, G.TH, G.RJ, G.RB, G);
  o.ADLUM = tbSector(-G.TH, G.TH, G.RL, G.RJ, G);
  return o;
}

/* the clone, step by step: each cell names its parent (p) in the step before; tr = followed */
const CL = [
  [{ k: "pA", a: 6.2, R: 545, tr: 1 }],
  [{ k: "pA", a: 3.6, R: 545, p: 0 }, { k: "B", a: 8.8, R: 546, p: 0, tr: 1 }],
  [{ k: "pA", a: 3.6, R: 545, p: 0 }, { k: "ps", a: 6.6, R: 470, p: 1, tr: 1 }],
  [{ k: "pA", a: 3.6, R: 545, p: 0 }, { k: "ss", a: 4.3, R: 414, p: 1, tr: 1 }, { k: "ss", a: 8.7, R: 414, p: 1, tr: 1 }],
  [{ k: "pA", a: 3.6, R: 545, p: 0 }, { k: "sd", m: 0, a: 3.5, R: 381, p: 1, tr: 1 }, { k: "sd", m: 0, a: 4.9, R: 353, p: 1, tr: 1 }, { k: "sd", m: 0, a: 8.1, R: 353, p: 2, tr: 1 }, { k: "sd", m: 0, a: 9.4, R: 381, p: 2, tr: 1 }],
  [{ k: "pA", a: 3.6, R: 545, p: 0 }, { k: "sd", m: 1, a: 3.3, R: 324, p: 1, tr: 1 }, { k: "sd", m: 1, a: 5.5, R: 318, p: 2, tr: 1 }, { k: "sd", m: 1, a: 7.7, R: 318, p: 3, tr: 1 }, { k: "sd", m: 1, a: 9.9, R: 324, p: 4, tr: 1 }],
  [{ k: "pA", a: 3.6, R: 545, p: 0 }, { k: "sz", a: 2.6, R: 272, p: 1, tr: 1 }, { k: "sz", a: 5.4, R: 262, p: 2, tr: 1 }, { k: "sz", a: 8, R: 266, p: 3, tr: 1 }, { k: "sz", a: 10.4, R: 276, p: 4, tr: 1 },
    { k: "rb", a: 3.2, R: 331, p: 1 }, { k: "rb", a: 5.6, R: 326, p: 2 }, { k: "rb", a: 7.8, R: 326, p: 3 }, { k: "rb", a: 9.9, R: 331, p: 4 }],
];

const STEPS = [
  { say: "Start on the basement membrane, in the basal compartment: dark type A spermatogonia are reserve stem cells, pale type A are progenitors, type B are committed. At puberty, under testosterone, they enter the cell cycle. Follow the outlined pale type A cell.", ro: "spermatogonium · 2n" },
  { say: "Mitosis: the pale type A spermatogonium divides. One daughter stays a pale type A; the other is a type B spermatogonium, committed to go on. Both are still diploid (2n).", ro: "mitosis · 2n" },
  { say: "The type B spermatogonium becomes a primary spermatocyte (spermatocytogenesis) and moves straight past the tight junctions into the adluminal compartment, behind the blood-testis barrier. It is still diploid (2n).", ro: "primary spermatocyte · 2n" },
  { say: "Meiosis I: the diploid primary spermatocyte divides into two secondary spermatocytes, and the chromosome number is halved (1n).", ro: "meiosis I · 2n → 1n" },
  { say: "Meiosis II: each secondary spermatocyte divides again, with no new chromosomes made, so one primary spermatocyte gives four spermatids, each haploid (1n) with 23 unpaired chromosomes: 22 autosomes and an X or a Y.", ro: "meiosis II · 1n" },
  { say: "Spermiogenesis, with no more division: the nucleus elongates and condenses into the head, the Golgi forms the acrosome, the mitochondria gather in the middle piece and a flagellum forms, as most of the cytoplasm is discarded (Golgi, cap or acrosomal, and maturation phases).", ro: "spermiogenesis · 1n" },
  { say: "Spermiation: the Sertoli cell releases the sperm into the lumen, and the excess cytoplasm stays behind for the Sertoli cell to phagocytose. Spermatogenesis takes about 74 days; maturation is completed in the epididymis.", ro: "spermiation · 1n" },
];
const VIEWS = {
  lh: { say: "LH, from the anterior pituitary, binds receptors on the Leydig cells, outside the tubule, and starts their production of testosterone, which stimulates sperm development. Testosterone goes into the tubule and out into the blood.", ro: "LH → Leydig → testosterone" },
  fsh: { say: "FSH acts on the Sertoli cells, inside the tubule. They make androgen-binding protein (ABP), which binds testosterone and keeps it concentrated in the tubule, and inhibin. Spermatogenesis needs both FSH and that high testosterone.", ro: "FSH → Sertoli → ABP, inhibin" },
  fb: { say: "The brakes, by negative feedback on the anterior pituitary: testosterone lowers LH secretion (Dr. Madison adds GnRH from the hypothalamus), and inhibin from the Sertoli cells blocks FSH release. Testosterone taken from outside switches LH down, and the Leydig cells lose their stimulus.", ro: "testosterone ⊣ LH · inhibin ⊣ FSH" },
};

/* ---------- live drawing ---------- */
function tbRender(st, D) {
  var o = "", t = st.t || 0, v = st.view, cells = v === "cells", i;
  /* remember when the step changed, per copy of the figure, so each step plays its move once */
  if (st._s === undefined || st._s !== st.step) { st._from = st._s === undefined ? st.step : st._s; st._s = st.step; st._t0 = t; }
  var u = t ? Math.min(1, (t - st._t0) / 1500) : 1, e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
  var fwd = st._from === st.step - 1;
  if (!fwd) e = 1;
  o += D.BG0;
  /* the capillary, red cells streaming along it */
  var capT = D.tbArc(-D.TH, D.TH, D.RC - 9, D, 28), capB = D.tbArc(D.TH, -D.TH, D.RC + 9, D, 28);
  o += D.HOT("Capillary in the interstitium: LH and FSH arrive from the anterior pituitary in the blood, and testosterone and inhibin leave in it.", '<path class="vessel" d="' + D.tbPath(capT.concat(capB), true) + '"/>');
  for (i = 0; i < 7; i++) { var ra = -D.TH + 1 + ((((t / 9000) + i / 7) % 1 + 1) % 1) * (2 * D.TH - 2), rp = D.tbP(ra, D.RC + (i % 2 ? 3 : -3), D); o += '<ellipse class="tb-rbc" cx="' + f1(rp[0]) + '" cy="' + f1(rp[1]) + '" rx="6" ry="3.4" transform="rotate(' + f1(-ra) + " " + f1(rp[0]) + " " + f1(rp[1]) + ')"/>'; }
  o += D.HOT("Interstitial cells of Leydig, outside the tubule. LH binds their receptors and they make testosterone: in the embryo, at sexual maturity, and throughout adult life to keep spermatogenesis going.", '<g class="' + (v === "lh" || v === "fb" ? "tb-lit" : "") + '">' + D.LEY + "</g>");
  o += D.WALL + D.EPI;
  if (st.comp || (cells && st.step === 2)) o += D.HOT("Basal compartment: between the basement membrane and the tight junctions. The spermatogonia live here.", '<path class="tb-basal" d="' + D.BASAL + '"/>') + D.HOT("Adluminal compartment: above the tight junctions, behind the barrier. The spermatocytes and spermatids develop here, out of the immune system's reach.", '<path class="tb-adlum" d="' + D.ADLUM + '"/>');
  o += D.SERT;
  if (v === "fsh" || v === "fb") o += '<g class="tb-sglow">' + D.SERTO + "</g>";
  o += D.LUM + D.BM + D.CELLS + D.LATE;
  /* free sperm in the lumen */
  D.LUMSP.forEach(function (c) { var p = D.tbP(c[0], c[1], D); o += D.HOT(D.INFO.sz, D.tbCell("sz", p[0], p[1], -c[0], 1, 1, 0, t / 260 + c[2])); });
  /* the followed clone, or a plain right gap */
  var trk = [];
  if (cells) {
    var now = D.CL[st.step], prev = st.step > 0 ? D.CL[st.step - 1] : null, sz = { dA: 15, pA: 14, B: 12.5, ps: 17, ss: 13.5, sd: 9, sz: 6, rb: 4.6 };
    var kids = {}; if (prev) now.forEach(function (c) { kids[c.p] = (kids[c.p] || 0) + 1; });
    now.forEach(function (c) {
      var pc = prev && e < 1 ? prev[c.p] : null, a = c.a, R = c.R, k = c.k, s = 1, m = c.m || 0, op = 1;
      if (pc) {
        a = pc.a + (c.a - pc.a) * e; R = pc.R + (c.R - pc.R) * e;
        if (c.k === "rb") { op = e; s = 0.4 + 0.6 * e; }
        else if (pc.k === c.k) m = (pc.m || 0) + ((c.m || 0) - (pc.m || 0)) * e;
        else if (kids[c.p] > 1 || c.k === "sz") s = (sz[pc.k] / sz[c.k]) + (1 - sz[pc.k] / sz[c.k]) * e;
        else { var rr = sz[c.k] / sz[pc.k]; if (e < 0.5) { k = pc.k; s = 1 + (rr - 1) * e; } else s = 1 / rr + (1 - 1 / rr) * e; }
        if (c.k === "sz" && pc.k === "sd") { s = 1; }
      }
      var p = D.tbP(a, R, D), g = D.tbCell(k, p[0], p[1], -a, s, m, c.tr, t / 260 + a);
      if (op < 1) g = '<g opacity="' + f1(op) + '">' + g + "</g>";
      o += D.HOT(D.INFO[k === "sd" && m > 0.5 ? "ld" : k], g);
      if (c.tr) trk.push([p[0], p[1], sz[k] * s]);
    });
  } else o += D.RIGHT;
  o += D.TJ;
  /* ---------- hormones ---------- */
  if (!cells) {
    var lh = v === "lh" || v === "fb", fsh = v === "fsh" || v === "fb";
    var capIn = D.tbArc(-D.TH, D.TH, D.RC, D, 28);
    if (lh) o += D.tbFlow(capIn, 9, 7000, t, "tb-lh", 3.2) + D.tbFlow(D.P_LH1, 2, 2600, t, "tb-lh", 3.2) + D.tbFlow(D.P_LH2, 2, 2600, t, "tb-lh", 3.2, 0.5);
    if (fsh) { o += D.tbFlow(capIn, 9, 7000, t, "tb-fsh", 3.2, 0.06); D.P_FSH.forEach(function (p, j) { o += D.tbFlow(p, 2, 3000, t, "tb-fsh", 3.2, j / 3); }); }
    if (lh) { D.P_TIN.forEach(function (p, j) { o += D.tbFlow(p, 3, 3400, t, "tb-t", 3, j / 2); }); o += D.tbFlow(D.P_TOUT, 3, 3000, t, "tb-t", 3) + D.tbFlow(D.tbArc(9, D.TH, D.RC, D, 8), 2, 2400, t, "tb-t", 3); }
    if (fsh) {
      /* ABP up the Sertoli cells into the adluminal compartment, carrying testosterone; inhibin out to the blood */
      D.P_ABP.forEach(function (p, j) { for (var q = 0; q < 3; q++) { var uu = (((t / 4200) + q / 3 + j / 5) % 1 + 1) % 1, pt = D.tbAt(p, uu), al = Math.min(1, uu * 6, (1 - uu) * 6); o += '<g opacity="' + f1(al) + '"><circle class="tb-abp" cx="' + f1(pt[0]) + '" cy="' + f1(pt[1]) + '" r="3.4"/>' + (uu > 0.35 ? '<circle class="tb-t" cx="' + f1(pt[0] + 4.6) + '" cy="' + f1(pt[1] - 1) + '" r="2.4"/>' : "") + "</g>"; } });
      D.P_INH.forEach(function (p, j) { o += D.tbFlow(p, 2, 3200, t, "tb-inh", 3, j / 3 + 0.2); });
      o += D.tbFlow(D.tbArc(0, D.TH, D.RC, D, 12), 3, 3600, t, "tb-inh", 3, 0.3);
    }
    /* the loop to the anterior pituitary, under the wedge */
    o += '<path class="tb-loop" d="' + D.tbPath(D.LOOP_IN) + '"/><path class="tb-loop" d="' + D.tbPath(D.LOOP_OUT) + '"/>';
    if (lh) o += D.tbFlow(D.LOOP_IN, 4, 5000, t, "tb-lh", 3);
    if (fsh) o += D.tbFlow(D.LOOP_IN, 4, 5000, t, "tb-fsh", 3, 0.12);
    if (v === "fb") o += D.tbFlow(D.LOOP_OUT, 4, 5000, t, "tb-t", 3) + D.tbFlow(D.LOOP_OUT, 3, 5000, t, "tb-inh", 3, 0.15);
    o += D.HOT("Anterior pituitary: it releases LH and FSH into the blood (under GnRH from the hypothalamus, in Dr. Madison's lecture).", '<rect class="tb-pit" x="180" y="556" width="160" height="40" rx="12"/>' + T(260, 573, "anterior pituitary", "s b", "middle") + T(260, 589, (lh && fsh ? "LH · FSH" : lh ? "LH" : "FSH"), "s mut", "middle"));
    if (v === "fb") {
      o += D.HOT("Testosterone lowers LH secretion by negative feedback (and, in Dr. Madison's lecture, GnRH from the hypothalamus too).", '<g class="tb-minus"><circle cx="352" cy="566" r="7"/><path d="M348.5 566H355.5"/></g>' + T(364, 570, "testosterone ⊣ LH", "s bad", "start"));
      o += D.HOT("Inhibin, made by the Sertoli cells, blocks FSH release by the anterior pituitary.", '<g class="tb-minus"><circle cx="352" cy="588" r="7"/><path d="M348.5 588H355.5"/></g>' + T(364, 592, "inhibin ⊣ FSH", "s bad", "start"));
    }
    /* names on the flows */
    if (lh) o += T(122, 520, "LH", "s tb-lht", "start") + D.L(150, 498, "testosterone", 352, 520, "start", "s tb-tt");
    if (fsh) o += T(122, (lh ? 536 : 520), "FSH", "s tb-fsht", "start") + (v === "fsh" ? D.L(392, 220, "ABP + testosterone", 314, 300, "start", "s tb-abpt") + T(392, 236, "in the tubule", "s mut", "start") : "") + D.L(150, (lh ? 482 : 498), "inhibin", 286, 590 - 0, "start", "s tb-inht");
  }
  /* ---------- labels ---------- */
  o += D.L(30, 380, "basement", 120, 372, "start", "s") + T(30, 394, "membrane", "s", "start");
  o += D.L(30, 430, "myoid cell", 114, 420, "start", "s");
  o += D.L(30, 470, "Leydig cells", 176, 452, "start", "s");
  o += T(446, 448, "capillary", "s tb-onv", "end");
  o += D.L(452, 38, "lumen", 352, 40, "start", "s");
  if (cells) {
    if (st.step < 5) o += D.L(8, 158, "early spermatids", 196, 175, "start", "s");
    o += D.L(8, 206, "secondary", 222, 220, "start", "s") + T(8, 220, "spermatocyte", "s", "start");
    o += D.L(8, 256, "primary", 216, 275, "start", "s") + T(8, 270, "spermatocyte", "s", "start");
    o += D.L(8, 312, "tight junction", 239, 333, "start", "s");
    o += D.L(8, 344, "spermatogonia", 250, 357, "start", "s");
    o += D.L(408, 106, "late", 336, 114, "start", "s") + T(408, 120, "spermatids", "s", "start");
  } else {
    o += D.L(8, 240, "Sertoli cell", 244, 268, "start", "s b");
    o += D.L(8, 312, "tight junction", 239, 333, "start", "s");
  }
  if (st.comp || (cells && st.step === 2)) o += D.L(430, 186, "adluminal", 404, 242, "start", "s tb-adt") + T(430, 200, "compartment", "s tb-adt", "start") + D.L(470, 300, "basal", 452, 334, "start", "s tb-bat");
  /* ---------- the clone's chromosome count ---------- */
  if (cells && trk.length) {
    var top = trk[0], cy = 0; trk.forEach(function (q) { cy += q[1]; if (q[0] + q[2] > top[0] + top[2]) top = q; }); cy /= trk.length;
    var edge = D.CX + (cy - D.CY) * Math.tan(D.TH * Math.PI / 180) + 8, n2 = st.step < 3 || (st.step === 3 && e < 0.5);
    o += '<path class="lead" d="M' + f1(edge) + " " + f1(cy) + "L" + f1(top[0] + top[2] + 2) + " " + f1(top[1]) + '"/><rect class="tb-badge" x="' + f1(edge) + '" y="' + f1(cy - 11) + '" width="30" height="22" rx="11"/>' + T(edge + 15, cy + 4.5, n2 ? "2n" : "1n", "b", "middle");
    /* the ladder */
    var lad = ["mitosis", "meiosis I", "meiosis II", "spermiogenesis", "spermiation"], sub = ["2n stays 2n", "2n → 1n", "1n stays 1n", "1n, no division", "1n, released"], at = [1, 3, 4, 5, 6];
    o += T(260, 538, "the outlined clone, and its chromosome count", "s mut", "middle");
    lad.forEach(function (nm, j) {
      var x = 6 + j * 102, cur = at[j] === st.step, done = at[j] < st.step;
      o += '<rect class="tb-chip' + (cur ? " is-cur" : done ? " is-done" : "") + '" x="' + x + '" y="550" width="98" height="44" rx="8"/>' + T(x + 49, 568, nm, "s" + (cur ? " b" : done ? "" : " mut"), "middle") + T(x + 49, 584, sub[j], "s" + (cur ? " hot-t" : " mut"), "middle");
    });
  }
  /* the spermiogenesis zoom (steps 5 and 6): a round spermatid, then the spermatozoon it becomes, color-keyed */
  if (cells && st.step >= 5) {
    o += '<rect class="tb-zoom" x="6" y="6" width="184" height="142" rx="10"/>' + T(16, 24, "spermiogenesis", "s b", "start");
    o += D.tbCell("sd", 32, 64, 90, 1.5, 0, 0, 0) + '<path class="lead" d="M50 64H62"/><path class="tb-arrow" d="M62 60L68 64L62 68Z"/>' + D.tbCell("sz", 96, 64, 90, 1.5, 1, 0, t / 300);
    [["tb-sw-acro", "acrosome ← Golgi"], ["tb-sw-nu", "head ← nucleus"], ["tb-sw-mid", "mid piece ← mitochondria"], ["tb-sw-tail", "flagellum, new"]].forEach(function (r, j) { var y = 96 + j * 14; o += '<rect class="' + r[0] + '" x="16" y="' + (y - 7) + '" width="9" height="6" rx="2"/>' + T(30, y, r[1], "tb-xs", "start"); });
  }
  return o;
}
function tbSay(st, D) {
  if (st.view === "cells") { var s = D.STEPS[st.step]; return [s.say, (st.step + 1) + "/7 · " + s.ro]; }
  var w = D.VIEWS[st.view]; return [w.say, w.ro];
}

export default function tubule() {
  const S = staticParts();
  /* hormone paths, in drawing coordinates */
  const P = (a, R) => tbP(a, R, G).map((n) => Math.round(n * 10) / 10);
  const D = Object.assign({}, G, S, {
    INFO, CL, STEPS, VIEWS, ANIM: true, PLAYMS: 2600,
    INIT: { view: "cells", step: 0, comp: false }, STEPKEY: "step", STEPMAX: 6,
    P_LH1: [P(-9.4, 655), P(-9.6, 646)], P_LH2: [P(8.6, 654), P(8.8, 645)],
    P_FSH: [[P(-12, 654), P(-12, 590), P(-12, 556)], [P(0, 654), P(0, 590), P(0, 556)], [P(12, 654), P(12, 590), P(12, 556)]],
    P_TIN: [[P(-8.6, 604), P(-7, 582), P(-6.2, 556), P(-6, 500)], [P(7.6, 600), P(6.4, 580), P(6, 556), P(6.2, 504)]],
    P_TOUT: [P(9.6, 646), P(9.4, 655)],
    P_ABP: [[P(-12, 520), P(-12, 420), P(-12, 330), P(-12, 270)], [P(0, 520), P(0, 420), P(0, 330), P(0, 262)], [P(12, 520), P(12, 420), P(12, 330), P(12, 270)]],
    P_INH: [[P(-12.6, 556), P(-13.2, 600), P(-13.6, 654)], [P(0.6, 556), P(0.9, 600), P(1.2, 654)], [P(12.6, 556), P(13.1, 600), P(13.6, 654)]],
    LOOP_IN: [[180, 576], [16, 576], [16, P(-G.TH, G.RC)[1]], P(-G.TH, G.RC)],
    LOOP_OUT: [P(G.TH, G.RC), [512, P(G.TH, G.RC)[1]], [512, 576], [340, 576]],
  });
  return makeFig({
    id: "tubule", lec: "mhisto", fig: "Fig", short: "Seminiferous tubule", hint: "step a clone · switch views · hover a cell",
    title: "Inside a seminiferous tubule",
    caption: "A wedge cut from a tubule in cross-section: the lumen (the tubule's center) at the top, the basement membrane and the interstitium at the bottom. Follow one clone from spermatogonium to sperm, or switch to the hormones that run the testis.",
    W: 520, H: 612, label: "A wedge of a seminiferous tubule in cross-section: Sertoli cells from the basement membrane to the lumen with tight junctions near their bases, germ cells from spermatogonia to spermatozoa, the wall with myoid cells, and Leydig cells and a capillary in the interstitium.",
    D, render: tbRender, say: tbSay, helpers: [tbP, tbPath, tbArc, tbAt, tbFlow, tbCell],
    controls: `<div class="am-controls" role="group" aria-label="View"><button type="button" class="am-btn" data-amk="view" data-amv="cells">Spermatogenesis</button><button type="button" class="am-btn" data-amk="view" data-amv="lh">LH → Leydig</button><button type="button" class="am-btn" data-amk="view" data-amv="fsh">FSH → Sertoli</button><button type="button" class="am-btn" data-amk="view" data-amv="fb">Feedback</button></div>
<div class="am-controls tb-steps" role="group" aria-label="Step through spermatogenesis"><button type="button" class="am-btn" data-amstep="-1">Back</button><button type="button" class="am-btn" data-amstep="1">Next</button><button type="button" class="am-btn" data-amplay aria-pressed="false">Play</button><button type="button" class="am-btn" data-amt="comp" aria-pressed="false">Shade the compartments</button></div>`,
    sources: [
      "From the L13 notes (Dr. Herr): the cells on his labeled cross-section (spermatogonia at the base, primary spermatocytes, late spermatids near the lumen, Sertoli cells, Leydig cells outside the tubule, peritubular myoid cells in the wall); Sertoli cells columnar from basement membrane to lumen with an ovoid nucleus, tight junctions near their bases making the blood-testis barrier and the basal and adluminal compartments; dark A, pale A and type B spermatogonia and their nuclei; meiosis (diploid primary spermatocytes to haploid spermatids); spermiogenesis (nucleus to head, Golgi to acrosome, mitochondria to middle piece, a flagellum); spermiation; about 74 days. LH on Leydig cells (testosterone), FSH on Sertoli cells (androgen-binding protein), testosterone lowering LH and inhibin blocking FSH.",
      "From the L15 notes (Dr. Madison): two meiotic divisions with no new chromosomes made in the second, four spermatids of 23 unpaired chromosomes (22 plus X or Y); ABP keeps testosterone in the testis higher than in the blood; testosterone also inhibits GnRH.",
      "Schematic and not to scale: one clone is drawn through every stage in one place for clarity, while in a real tubule each spot is at one stage (so neighboring tubules look different). The chromatin threads, the cell shapes and the residual cytoplasm are drawn to look right and are not labeled. The lecture doesn't give a nucleus description for type B spermatogonia."],
    css: `
.anima[data-anima="tubule"] .am-svg{max-width:540px}
.anima[data-anima="tubule"]:has([data-amk="view"][data-amv="cells"][aria-pressed="false"]) .tb-steps{display:none}
.anima .tubule-svg .tb-int{fill:var(--bx-fat);stroke:var(--bx-fat-line);stroke-width:1}
.anima .tubule-svg .tb-fib{fill:none;stroke:var(--bx-fat-line);stroke-width:1.1;opacity:.8}
.anima .tubule-svg .tb-wall{fill:color-mix(in srgb,var(--bx-eosin) 22%,var(--bx-fat));stroke:var(--bx-fat-line);stroke-width:1}
.anima .tubule-svg .tb-myo{fill:var(--bx-eosin);stroke:var(--bx-cyto-line);stroke-width:.8}
.anima .tubule-svg .tb-myon{fill:none;stroke:var(--bx-nuc);stroke-width:3.2;stroke-linecap:round}
.anima .tubule-svg .tb-bm{fill:none;stroke:var(--bx-memb);stroke-width:2.2}
.anima .tubule-svg .tb-epi{fill:var(--bx-matrix);stroke:var(--bx-cyto-line);stroke-width:1}
.anima .tubule-svg .tb-lum{fill:var(--bx-lumen);stroke:var(--bx-cyto-line);stroke-width:1}
.anima .tubule-svg .tb-sert{fill:color-mix(in srgb,var(--bx-eosin) 55%,var(--bx-matrix));stroke:var(--bx-cyto-line);stroke-width:1.3}
.anima .tubule-svg .tb-sglow path{fill:none;stroke:var(--bx-blue);stroke-width:2.6;opacity:.85}
.anima .tubule-svg .tb-snu{fill:color-mix(in srgb,var(--bx-nuc) 35%,var(--bx-matrix));stroke:var(--bx-nuc-line);stroke-width:1}
.anima .tubule-svg .tb-cy{fill:color-mix(in srgb,var(--bx-cyto) 70%,var(--surface));stroke:var(--bx-cyto-line);stroke-width:1}
.anima .tubule-svg .tb-cy.is-trk{stroke:var(--anatomy-lit);stroke-width:2.2}
.anima .tubule-svg .tb-halo{fill:var(--anatomy-lit);opacity:.14}
.anima .tubule-svg .tb-nu{fill:var(--bx-nuc);stroke:var(--bx-nuc-line);stroke-width:.8}
.anima .tubule-svg .tb-nu.tb-pale{fill:color-mix(in srgb,var(--bx-nuc) 45%,var(--surface))}
.anima .tubule-svg .tb-nu.tb-dense{fill:var(--bx-nuc-line)}
.anima .tubule-svg .tb-nl{fill:var(--bx-nuc-line)}
.anima .tubule-svg .tb-vac{fill:var(--bx-lumen);stroke:var(--bx-nuc-line);stroke-width:.6}
.anima .tubule-svg .tb-chr{fill:var(--bx-nuc-line)}
.anima .tubule-svg .tb-thr{fill:none;stroke:var(--bx-nuc-line);stroke-width:1.4;stroke-linecap:round}
.anima .tubule-svg .tb-tail{fill:none;stroke:var(--bx-sperm);stroke-width:1.3;stroke-linecap:round}
.anima .tubule-svg .tb-mid{fill:none;stroke:var(--bx-gold);stroke-width:2.8;stroke-linecap:round}
.anima .tubule-svg .tb-mito{fill:var(--bx-gold);opacity:.9}
.anima .tubule-svg .tb-golgi{fill:none;stroke:var(--bx-hot);stroke-width:1.1;stroke-linecap:round}
.anima .tubule-svg .tb-acro{fill:var(--bx-memb);opacity:.9}
.anima .tubule-svg .tb-tj{stroke:var(--anatomy-hi);stroke-width:3;stroke-linecap:round}
.anima .tubule-svg .tb-tjd{fill:var(--surface)}
.anima .tubule-svg .tb-ley{fill:var(--bx-eosin);stroke:var(--bx-cyto-line);stroke-width:1}
.anima .tubule-svg .tb-lit .tb-ley{stroke:var(--bx-violet);stroke-width:2.2}
.anima .tubule-svg .tb-rbc{fill:var(--bx-blood)}
.anima .tubule-svg .tb-basal{fill:var(--bx-blue-soft);opacity:.85}
.anima .tubule-svg .tb-adlum{fill:var(--bx-gold-soft);opacity:.7}
.anima .tubule-svg .tb-lh{fill:var(--bx-violet);stroke:var(--surface);stroke-width:.8}
.anima .tubule-svg .tb-fsh{fill:var(--bx-blue);stroke:var(--surface);stroke-width:.8}
.anima .tubule-svg .tb-t{fill:var(--bx-gold);stroke:var(--anatomy-text);stroke-width:.6}
.anima .tubule-svg .tb-abp{fill:var(--bx-ins);stroke:var(--surface);stroke-width:.8}
.anima .tubule-svg .tb-inh{fill:var(--bx-inhib);stroke:var(--surface);stroke-width:.8}
.anima .tubule-svg .t.tb-lht{fill:var(--bx-violet);font-weight:600}
.anima .tubule-svg .t.tb-fsht{fill:var(--bx-blue);font-weight:600}
.anima .tubule-svg .t.tb-tt{fill:var(--bx-gold);font-weight:600}
.anima .tubule-svg .t.tb-abpt{fill:var(--bx-ins);font-weight:600}
.anima .tubule-svg .t.tb-inht{fill:var(--bx-inhib);font-weight:600}
.anima .tubule-svg .t.tb-adt{fill:var(--anatomy-strong)}
.anima .tubule-svg .t.tb-bat{fill:var(--anatomy-strong)}
.anima .tubule-svg .t.tb-onv{stroke:none;fill:var(--bx-blood)}
.anima .tubule-svg .tb-loop{fill:none;stroke:var(--anatomy-mid);stroke-width:1.4;stroke-dasharray:5 4}
.anima .tubule-svg .tb-pit{fill:var(--anatomy-face);stroke:var(--anatomy-mid);stroke-width:1.3}
.anima .tubule-svg .tb-minus circle{fill:var(--surface);stroke:var(--bx-inhib);stroke-width:1.6}
.anima .tubule-svg .tb-minus path{stroke:var(--bx-inhib);stroke-width:2;stroke-linecap:round}
.anima .tubule-svg .tb-badge{fill:var(--anatomy-face);stroke:var(--anatomy-lit);stroke-width:1.6}
.anima .tubule-svg .tb-chip{fill:none;stroke:var(--anatomy-lo);stroke-width:1}
.anima .tubule-svg .tb-chip.is-done{fill:var(--anatomy-shade-1)}
.anima .tubule-svg .tb-chip.is-cur{fill:var(--anatomy-face);stroke:var(--anatomy-lit);stroke-width:2}
.anima .tubule-svg .tb-zoom{fill:var(--anatomy-face);stroke:var(--anatomy-lo);stroke-width:1}
.anima .tubule-svg .tb-arrow{fill:var(--anatomy-mid)}
.anima .tubule-svg .t.tb-xs{font-size:11px}
.anima .tubule-svg .tb-sw-acro{fill:var(--bx-memb)}
.anima .tubule-svg .tb-sw-nu{fill:var(--bx-nuc-line)}
.anima .tubule-svg .tb-sw-mid{fill:var(--bx-gold)}
.anima .tubule-svg .tb-sw-tail{fill:var(--bx-sperm)}
`,
  });
}

/* for the bio audit (node): the Sertoli outlines and the germ cells as closed boundaries */
export function auditInput() {
  const flaps = [[-G.TH, -6], [-6, 6], [6, G.TH]];
  return { flaps, G, CL };
}
