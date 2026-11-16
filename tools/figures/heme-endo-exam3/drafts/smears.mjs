// Fig 20.3: smear look-alikes (L20 Lymphomas and Leukemias, Dr. Borak, from the slides). Six cells from the blood smears
// the lecture describes, drawn anew as schematic cells at one scale, each with a red cell beside it for size: a lymphoblast,
// a myeloblast with an Auer rod, an APL promyelocyte with a bundle of Auer rods, a Sézary cell with its cerebriform
// nucleus, a CLL lymphocyte with soccer-ball chromatin beside a smudge cell, and rouleaux. Pick a cell (A to F) to enlarge
// it, then name it: the enlarged view labels what gives it away and the card under the drawing says why. Hovering a part
// before naming it describes it in plain words; after naming, in the lecture's terms. No CD markers (his objectives say
// they aren't needed). The blasts sit side by side on the top row (the AML vs ALL pair, and the two cells with Auer rods),
// the mature lymphocytes and the red cells on the bottom row.
import { makeFig, f1, T, L, HOT } from "./shared.mjs";

/* ---------- build-time geometry: every cell is drawn in micrometers around (0, 0), then scaled ---------- */
const W = 420, H = 528;
const TS = 3.9, ZS = 6.4;                         // drawing units per micrometer: the grid, and the enlarged view (1.64x)
const PW = 130, PH = 120, PX = [5, 145, 285], PY = [6, 134];
const ZC = [110, 404];                            // the enlarged cell's center
const SLOT = [372, 408, 444, 480];                // the labels' baselines in the enlarged view
let seed = 20261117;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

/* closed smooth path through points (Catmull-Rom as cubic Beziers); open when c is false */
function sm(p, c = true) {
  const n = p.length, last = c ? n : n - 1;
  let d = "M" + f1(p[0][0]) + " " + f1(p[0][1]);
  for (let i = 0; i < last; i++) {
    let a = p[(i - 1 + n) % n], b = p[i], e = p[(i + 1) % n], g = p[(i + 2) % n];
    if (!c) { if (i === 0) a = b; if (i + 2 >= n) g = e; }
    d += "C" + f1(b[0] + (e[0] - a[0]) / 6) + " " + f1(b[1] + (e[1] - a[1]) / 6) + " " + f1(e[0] - (g[0] - b[0]) / 6) + " " + f1(e[1] - (g[1] - b[1]) / 6) + " " + f1(e[0]) + " " + f1(e[1]);
  }
  return d + (c ? "Z" : "");
}
/* an irregular round outline, radius fn(angle) */
function polar(cx, cy, fn, n = 28) { const p = []; for (let i = 0; i < n; i++) { const a = (i / n) * 2 * Math.PI; const r = fn(a); p.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return p; }
function wob(r, w, k = 1) { const p1 = rnd() * 6.28, p2 = rnd() * 6.28; return (a) => r * (1 + w * (0.55 * Math.sin(3 * a * k + p1) + 0.35 * Math.sin(5 * a + p2))); }

/* shapes in micrometers: closed blob, circle, needle (a straight rod), open curve */
const B = (pts, cls) => ({ t: "b", pts, cls });
const C = (x, y, r, cls) => ({ t: "c", x, y, r, cls });
const N = (a, b, w, cls) => ({ t: "n", a, b, w, cls });
const Q = (pts, w, cls) => ({ t: "q", pts, w, cls });
function draw(shapes, X, Y, s) {
  const M = (q) => [X + q[0] * s, Y + q[1] * s];
  return shapes.map((h) => {
    if (h.t === "b") return `<path class="${h.cls}" d="${sm(h.pts.map(M))}"/>`;
    if (h.t === "c") { const q = M([h.x, h.y]); return `<circle class="${h.cls}" cx="${f1(q[0])}" cy="${f1(q[1])}" r="${f1(h.r * s)}"/>`; }
    if (h.t === "n") { const a = M(h.a), b = M(h.b); return `<path class="${h.cls}" stroke-width="${f1(h.w * s)}" d="M${f1(a[0])} ${f1(a[1])}L${f1(b[0])} ${f1(b[1])}"/>`; }
    return `<path class="${h.cls}" stroke-width="${f1(h.w * s)}" d="${sm(h.pts.map(M), false)}"/>`;
  }).join("");
}
/* points scattered in a region: inside(x, y) decides, at least gap apart */
function scatter(n, R, inside, gap) {
  const out = []; let tries = 0;
  while (out.length < n && tries++ < 6000) {
    const x = (rnd() * 2 - 1) * R, y = (rnd() * 2 - 1) * R;
    if (inside(x, y) && out.every((q) => Math.hypot(q[0] - x, q[1] - y) >= gap)) out.push([x, y]);
  }
  return out;
}
const RBC_R = 3.75;                               // a red cell, 7.5 um across
/* the shape (a circle) nearest a point, as its center */
const near = (sh, x, y) => { const b = sh.reduce((m, h) => (Math.hypot(h.x - x, h.y - y) < Math.hypot(m.x - x, m.y - y) ? h : m)); return [b.x, b.y]; };
const rbc = (x, y, pal = true) => [C(x, y, RBC_R, "sr-rbc")].concat(pal ? [C(x + 0.15, y - 0.1, 1.45, "sr-pal")] : []);

/* ---------- the six cells: layers in painting order; q = plain words, n = the lecture's words ---------- */
function myeloblast() {
  const R = 8, nc = [-1.1, 0.3], nr = 5.6, rod = [[5.75, -2.6], [6.25, 2.2]];
  const cyto = B(polar(0, 0, wob(R, 0.025)), "sr-cyb");
  const nuc = B(polar(nc[0], nc[1], wob(nr, 0.03)), "sr-nf");
  const nl = [[-2.7, -1.7, 1.0], [0.9, -2.2, 0.85], [-1.6, 2.4, 0.75]];
  const dots = scatter(70, 6, (x, y) => Math.hypot(x - nc[0], y - nc[1]) < nr - 0.5 && nl.every((q) => Math.hypot(x - q[0], y - q[1]) > q[2] + 0.35), 0.62).map((q) => C(q[0], q[1], 0.2, "sr-chr"));
  const gr = scatter(9, 8, (x, y) => Math.hypot(x, y) < R - 0.8 && Math.hypot(x - nc[0], y - nc[1]) > nr + 0.5 && Math.abs(x - 6) > 0.9, 1.3).map((q) => C(q[0], q[1], 0.33, "sr-gn"));
  return { k: "mb", R, layers: [
    { shapes: [cyto], q: "The whole cell: a big cell, mostly nucleus, with a rim of blue cytoplasm.", n: "A myeloblast: a medium to large blast with a high nuclear-to-cytoplasmic ratio and moderate cytoplasm." },
    { shapes: gr, q: "A few fine purple dots in the cytoplasm.", n: "Granules: a myeloblast's moderate cytoplasm has granules; a lymphoblast's scant cytoplasm has none.", lab: ["granules"], p: near(gr, 5, 5) },
    { shapes: [nuc].concat(dots), q: "A large, round nucleus with fine, even chromatin.", n: "Fine chromatin: a blast's chromatin is fine and even, not clumped like a mature lymphocyte's.", lab: ["fine chromatin"], p: [nc[0] + 2.6, nc[1] + 2.8] },
    { shapes: nl.map((q) => C(q[0], q[1], q[2], "sr-nl")), q: "Pale round spots inside the nucleus.", n: "Distinct nucleoli: easy to see in a myeloblast, indistinct in a lymphoblast.", lab: ["distinct nucleoli"], p: [nl[1][0], nl[1][1]] },
    { shapes: [N(rod[0], rod[1], 0.5, "sr-ar")], q: "A thin red-blue needle in the cytoplasm.", n: "Auer rod: a red-blue, needle-like inclusion made of abnormal granules that fused (his slide: lysosomal and acid phosphatase-positive). It marks the blast as myeloid: Auer rods exclude ALL.", lab: ["Auer rod"], p: [6.05, -0.4] },
  ] };
}
function lymphoblast() {
  const R = 5.7, nc = [0.25, -0.1], nr = 5.0;
  const cyto = B(polar(0, 0, wob(R, 0.025)), "sr-cyb");
  const nf = wob(nr, 0.02), nuc = B(polar(nc[0], nc[1], (a) => nf(a) * (1 - 0.07 * Math.exp(-Math.pow(Math.atan2(Math.sin(a - 0.6), Math.cos(a - 0.6)), 2) / 0.05))), "sr-nf");
  const dots = scatter(60, 5.2, (x, y) => Math.hypot(x - nc[0], y - nc[1]) < nr - 0.5, 0.55).map((q) => C(q[0], q[1], 0.2, "sr-chr"));
    return { k: "lb", R, layers: [
    { shapes: [cyto], q: "A smaller cell, almost all nucleus, with only a thin rim of blue cytoplasm and no granules.", n: "Scant cytoplasm with no granules, and never an Auer rod: Auer rods exclude ALL.", lab: ["scant cytoplasm,", "no granules"], p: [5.45 * Math.cos(-1.2), 5.45 * Math.sin(-1.2)] },
    { shapes: [nuc].concat(dots), q: "A nucleus that fills nearly the whole cell, with fine, even chromatin.", n: "Fine chromatin, as in any blast: this is a young cell.", lab: ["fine chromatin"], p: [nc[0] + 2.4, nc[1] + 2.0] },
    { shapes: [C(-0.9, -1.0, 0.95, "sr-nl sr-faint")], q: "A faint spot in the nucleus, hard to make out.", n: "Indistinct nucleoli: hard to see, unlike a myeloblast's distinct ones.", lab: ["indistinct nucleoli"], p: [-0.9, -1.0] },
  ] };
}
function promyelocyte() {
  const R = 10, lobes = [[-2.6, 0.9, 4.3], [2.3, 1.6, 3.9]], oc = [-0.2, 1.2];
  const cyto = B(polar(0, 0, wob(R, 0.03), 34), "sr-cyb");
  /* a folded, two-lobed nucleus: the outline of two overlapping lobes */
  const nuc = B(polar(oc[0], oc[1], (a) => {
    let best = 0;
    for (const [x, y, r] of lobes) { const dx = oc[0] - x, dy = oc[1] - y, ux = Math.cos(a), uy = Math.sin(a), b = dx * ux + dy * uy, c = dx * dx + dy * dy - r * r, D = b * b - c; if (D >= 0) best = Math.max(best, -b + Math.sqrt(D)); }
    return best;
  }, 48), "sr-nf");
  const ndots = scatter(46, 7, (x, y) => lobes.some(([lx, ly, r]) => Math.hypot(x - lx, y - ly) < r - 0.5), 0.75).map((q) => C(q[0], q[1], 0.2, "sr-chr"));
  const ang = -0.98, dir = [Math.cos(ang), Math.sin(ang)], perp = [-dir[1], dir[0]], bc = [4.7, -4.6];
  const rods = [-1.1, -0.65, -0.2, 0.25, 0.7, 1.1].map((o, i) => {
    const h = 2.35 + (i % 3) * 0.3, tw = (i - 2.5) * 0.05, d2 = [Math.cos(ang + tw), Math.sin(ang + tw)], c = [bc[0] + perp[0] * o + dir[0] * (i % 2 ? 0.3 : -0.25), bc[1] + perp[1] * o + dir[1] * (i % 2 ? 0.3 : -0.25)];
    return N([c[0] - d2[0] * h, c[1] - d2[1] * h], [c[0] + d2[0] * h, c[1] + d2[1] * h], 0.34, "sr-ar");
  });
  const gr = scatter(270, 10, (x, y) => Math.hypot(x, y) < R - 0.7, 0.74).map((q) => C(q[0], q[1], 0.32 + rnd() * 0.14, "sr-gd"));
  return { k: "pro", R, layers: [
    { shapes: [cyto], q: "The biggest cell here, its cytoplasm crowded with coarse granules.", n: "An abnormal promyelocyte: APL's cell, where maturation stops (t(15;17), PML::RARA)." },
    { shapes: [nuc].concat(ndots), q: "The nucleus, partly hidden under the granules.", n: "The nucleus, partly hidden under the granules." },
    { shapes: gr, q: "Coarse pink-purple granules packed through the cytoplasm.", n: "Large, dense granules staining pink, red or purple, packed in the cytoplasm. On flow cytometry they give APL its high side scatter.", lab: ["dense granules"], p: near(gr, 7.5, 4.5) },
    { shapes: rods, q: "A bundle of thin red-blue needles.", n: "A bundle of Auer rods: APL's distinctive cells hold bundles of them, where a myeloblast's Auer rod comes alone.", lab: ["Auer rod bundle"], p: [bc[0] + dir[0] * 1.2, bc[1] + dir[1] * 1.2] },
  ] };
}
function sezary() {
  const R = 6.0, nc = [0.2, 0.1], nr = 5.05;
  const cyto = B(polar(0, 0, wob(R, 0.025)), "sr-cyp");
  /* the folds (cerebriform): grooves run in from the edge and curl, like the sulci of a brain, and notch the outline */
  const GA = [0.25, 1.05, 1.8, 2.55, 3.35, 4.1, 4.85, 5.6], GL = [2.9, 2.2, 3.1, 2.4, 3.0, 2.0, 2.8, 2.3];
  const notch = (a) => GA.reduce((m, g) => m * (1 - 0.075 * Math.exp(-Math.pow(Math.atan2(Math.sin(a - g), Math.cos(a - g)), 2) / 0.012)), 1);
  const nuc = B(polar(nc[0], nc[1], (a) => nr * (1 + 0.03 * Math.sin(5 * a + 0.4)) * notch(a), 72), "sr-nd");
  const G = GA.map((g, i) => {
    const sg = i % 2 ? 1 : -1, pts = [];
    for (let k = 0; k <= 4; k++) { const u = k / 4, r = nr * 0.93 - u * GL[i], a = g + sg * (0.55 * u * u + 0.08 * Math.sin(u * 5)); pts.push([nc[0] + r * Math.cos(a), nc[1] + r * Math.sin(a)]); }
    return Q(pts, 0.34, "sr-gv");
  });
  /* a meandering groove across the middle, and short side branches */
  G.push(Q([[-1.6, -0.9], [-0.7, -0.2], [0.3, -0.8], [1.2, 0.0], [1.0, 1.0], [1.9, 1.5]].map((q) => [q[0] + nc[0], q[1] + nc[1]]), 0.34, "sr-gv"));
  G.push(Q([[-0.6, 1.0], [-1.3, 1.7], [-1.0, 2.5]].map((q) => [q[0] + nc[0], q[1] + nc[1]]), 0.3, "sr-gv"));
  G.push(Q([[0.4, -1.9], [0.0, -2.8], [0.7, -3.3]].map((q) => [q[0] + nc[0], q[1] + nc[1]]), 0.3, "sr-gv"));
  return { k: "sz", R, layers: [
    { shapes: [cyto], q: "A small to medium cell with little cytoplasm.", n: "A T cell with scant cytoplasm; in Sézary syndrome these cells are in the skin, the nodes and the peripheral blood." },
    { shapes: [nuc].concat(G), q: "A dark nucleus folded in on itself by deep grooves.", n: "Cerebriform nucleus: hyperchromatic and hyperconvoluted, folded like the surface of a brain.", lab: ["cerebriform nucleus"], p: [nc[0] + 0.3, nc[1] - 0.45] },
  ] };
}
function cll() {
  const cc = [3.6, -2.6], R = 4.6, nr = 4.0, sc = [-5.4, 3.6];
  const cyto = B(polar(cc[0], cc[1], wob(R, 0.02)), "sr-cyp");
  const nuc = B(polar(cc[0] + 0.15, cc[1] + 0.1, wob(nr, 0.02)), "sr-nf");
  /* chromatin in blocks split by pale cracks: a soccer ball, or cracked mud */
  const cl = [];
  for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) {
    const x = i * 1.5 + (j % 2 ? 0.75 : 0) + (rnd() - 0.5) * 0.25, y = j * 1.3 + (rnd() - 0.5) * 0.25, d = Math.hypot(x, y), r = Math.min(0.66, nr - 0.2 - d);
    if (r > 0.24) cl.push(B(polar(cc[0] + 0.15 + x, cc[1] + 0.1 + y, wob(r, 0.16), 7), "sr-cl"));
  }
  /* the smudge cell: a nucleus crushed flat, ragged, with streaks of chromatin and no cytoplasm */
  const smf = wob(1, 0.1), smudge = B(polar(sc[0], sc[1], (a) => smf(a) * (6.0 * 4.6) / Math.hypot(4.6 * Math.cos(a), 6.0 * Math.sin(a)) * (1 + 0.07 * Math.sin(13 * a)), 44), "sr-sm");
  const st = [[[1.4, -2.6], [3.6, -1.9], [5.8, -2.4], [8.4, -1.3]], [[0.6, 0.2], [3.0, 0.9], [5.6, 0.2], [9.2, 0.9]], [[1.8, 2.4], [4.2, 1.7], [6.6, 2.6], [8.2, 1.9]], [[3.0, -3.6], [5.2, -3.0], [6.6, -3.7]]]
    .map((g) => Q(g.map((q) => [q[0] + sc[0] - 5.3, q[1] + sc[1] + 0.4]), 0.3, "sr-st"));
  return { k: "cll", R: 11.2, layers: [
    { shapes: [cyto], q: "A small, round cell, not much bigger than a red cell, with a thin rim of pale cytoplasm.", n: "A small, mature lymphocyte: CLL/SLL is a lymphoma of small, mature B cells.", lab: ["small, mature cell"], p: [cc[0] + 4.55 * Math.cos(-0.85), cc[1] + 4.55 * Math.sin(-0.85)] },
    { shapes: [nuc].concat(cl), q: "Dark chromatin in blocks, split by pale cracks.", n: "Clumped chromatin in a cracked-mud or soccer-ball pattern.", lab: ["soccer-ball", "chromatin"], p: [cc[0] + 0.15, cc[1] + 0.1] },
    { shapes: [smudge].concat(st), q: "A ragged, smeared purple patch, with no cell around it.", n: "Smudge cell: a fragile lymphocyte crushed flat as the smear was made, common on CLL smears.", lab: ["smudge cell"], p: [sc[0] + 1.6, sc[1] + 0.5] },
  ] };
}
function rouleaux() {
  const s1 = [], s2 = [];
  const a1 = -0.26; for (let t = -6.75; t <= 6.8; t += 2.7) s1.push([t * Math.cos(a1), 2.0 + t * Math.sin(a1)]);
  const a2 = 0.17; for (let t = -2.7; t <= 2.8; t += 2.7) s2.push([-2.4 + t * Math.cos(a2), -6.3 + t * Math.sin(a2)]);
  const disc = (q) => [C(q[0], q[1], RBC_R, "sr-rbc"), C(q[0] + 0.2, q[1] - 0.15, 1.3, "sr-pal sr-pal2")];
  return { k: "rl", R: 11, layers: [
    { shapes: s2.flatMap(disc).concat(s1.flatMap(disc)), q: "Red cells lined up, each overlapping the next, like a tipped-over stack.", n: "Rouleaux: red cells stacked like coins. In plasma cell myeloma the large amount of immunoglobulin protein makes them stick together.", lab: ["stack of coins"], p: s1[3] },
  ] };
}

/* the panels, A to F: the blasts on the top row, the mature lymphocytes and the red cells on the bottom */
const CELLS = [lymphoblast(), myeloblast(), promyelocyte(), sezary(), cll(), rouleaux()];
const LET = ["A", "B", "C", "D", "E", "F"];
const CENTER = { cll: [68, 66], rl: [65, 56] };
const NM = {
  mb: { sh: "myeloblast", nm: "Myeloblast", dz: "AML", a: "a myeloblast, the blast of AML",
    tell: "it is medium to large, with moderate cytoplasm holding granules, fine chromatin and distinct nucleoli, and it has an Auer rod, the red-blue needle that marks the blast as myeloid (Auer rods exclude ALL). Most AML needs 20 percent blasts.",
    look: "a myeloblast is a large blast with moderate, granular cytoplasm and distinct nucleoli, and may hold a single Auer rod." },
  lb: { sh: "lymphoblast", nm: "Lymphoblast", dz: "ALL", a: "a lymphoblast, the blast of ALL",
    tell: "it is small to medium, with a thin rim of scant cytoplasm and no granules, fine chromatin and indistinct nucleoli, and no Auer rod. ALL is the acute leukemia of young children (peak 2 to 3 years).",
    look: "a lymphoblast is small to medium, with a thin rim of cytoplasm, no granules, indistinct nucleoli and never an Auer rod." },
  pro: { sh: "promyelocyte", nm: "APL promyelocyte", dz: "APL · t(15;17)", a: "an abnormal promyelocyte of acute promyelocytic leukemia (APL)",
    tell: "it is bigger than a myeloblast, its cytoplasm packed with large, dense pink-purple granules, and it holds a bundle of Auer rods. In APL maturation stops at the promyelocyte (t(15;17), PML::RARA), and the danger is DIC.",
    look: "an APL promyelocyte is packed with large, dense granules and can hold a bundle of Auer rods." },
  sz: { sh: "Sézary cell", nm: "Sézary cell", dz: "Sézary syndrome", a: "a Sézary cell",
    tell: "it is a T cell whose dark nucleus is folded on itself by deep grooves, cerebriform, like the surface of a brain, with scant cytoplasm. In the blood, with erythroderma and generalized lymphadenopathy, these cells complete Sézary syndrome's triad.",
    look: "a Sézary cell has a dark nucleus folded in grooves (cerebriform)." },
  cll: { sh: "CLL + smudge", nm: "CLL cell + smudge cell", dz: "CLL/SLL", a: "a CLL lymphocyte with a smudge cell beside it",
    tell: "the lymphocyte is small and mature, not much bigger than a red cell, its chromatin clumped in blocks like a soccer ball or cracked mud, and the smudge cell is a fragile lymphocyte crushed flat as the smear was made. His objective stresses this look in the blood.",
    look: "a CLL cell is a small, mature lymphocyte with clumped, soccer-ball chromatin, with smudge cells around it." },
  rl: { sh: "rouleaux", nm: "Rouleaux", dz: "plasma cell myeloma", a: "rouleaux, red cells stacked like coins",
    tell: "there is no white cell here at all: the red cells stick together in stacks because myeloma's large amount of monoclonal immunoglobulin makes them stick. Look for the M-spike and CRAB with it.",
    look: "rouleaux are red cells stacked like coins, not a white cell." },
};
const GUESS = [["pro", "APL promyelocyte"], ["cll", "CLL cell + smudge cell"], ["lb", "Lymphoblast"], ["mb", "Myeloblast"], ["rl", "Rouleaux"], ["sz", "Sézary cell"]];

/* the static art for each panel and the enlarged view */
const PANELS = CELLS.map((c, i) => {
  const x0 = PX[i % 3], y0 = PY[Math.floor(i / 3)], ctr = CENTER[c.k] || [65, 58], X = x0 + ctr[0], Y = y0 + ctr[1];
  const th = c.layers.map((l) => draw(l.shapes, X, Y, TS)).join("") + (c.k === "rl" ? "" : draw(rbc(0, 0), x0 + 111, y0 + 24, 1 / 1 * TS));
  /* enlarged: one layer per part, and the labels' slots in order of height so the leaders don't cross */
  const zx = ZC[0] + (c.k === "cll" ? 8 : 0), zy = ZC[1];
  const labeled = c.layers.map((l, j) => [j, l]).filter(([, l]) => l.lab).sort((a, b) => a[1].p[1] - b[1].p[1]);
  const slot = {}; labeled.forEach(([j], m) => { slot[j] = SLOT[m + (labeled.length <= 2 ? 1 : 0)]; });
  const z = c.layers.map((l, j) => ({ svg: draw(l.shapes, zx, zy, ZS), q: l.q, n: l.n, lab: l.lab || null,
    p: l.p ? [f1(zx + l.p[0] * ZS), f1(zy + l.p[1] * ZS)] : null, y: slot[j] || 0 }));
  return { x: x0, y: y0, th, z, k: c.k };
});
const RBCZ = draw(rbc(0, 0), 36, 490, ZS);

/* ---------- page helpers (serialized into the page) ---------- */
function srMark(x, y, ok) {
  return ok ? '<circle class="sr-okc" cx="' + x + '" cy="' + y + '" r="6.5"/><path class="sr-okm" d="M' + (x - 3.2) + " " + y + "L" + (x - 0.8) + " " + (y + 2.6) + "L" + (x + 3.4) + " " + (y - 2.6) + '"/>'
    : '<circle class="sr-noc" cx="' + x + '" cy="' + y + '" r="6.5"/><path class="sr-nom" d="M' + (x - 2.8) + " " + (y - 2.8) + "L" + (x + 2.8) + " " + (y + 2.8) + "M" + (x + 2.8) + " " + (y - 2.8) + "L" + (x - 2.8) + " " + (y + 2.8) + '"/>';
}
/* a guess records the cell's answer (and its first answer, for the score); Start over clears them */
function srOn(st, k) {
  if (k === "g" && st.g) { if (!st.first[st.c]) st.first[st.c] = st.g; st.done[st.c] = st.g; }
  if (k === "z") { st.done = {}; st.first = {}; st.c = 0; st.g = ""; st.z = 0; st.all = false; }
}
function srRender(st, D) {
  var o = "", i, P, c, g, rev, on, inner, nm;
  st.g = st.done[st.c] || "";
  /* the six panels, one scale */
  for (i = 0; i < 6; i++) {
    P = D.PAN[i]; g = st.done[i]; rev = st.all || !!g; on = i === st.c; nm = D.NM[P.k];
    inner = '<rect class="sr-bg' + (on ? " is-on" : "") + '" x="' + P.x + '" y="' + P.y + '" width="130" height="120" rx="10"/>' + P.th +
      '<rect class="sr-tag' + (on ? " is-on" : "") + '" x="' + (P.x + 6) + '" y="' + (P.y + 6) + '" width="21" height="21" rx="5"/>' + T(P.x + 16.5, P.y + 21.5, D.LET[i], "b sr-tagt" + (on ? " is-on" : ""), "middle");
    if (rev) inner += T(P.x + 65, P.y + 112, nm.sh, "s " + (g ? (g === P.k ? "ok" : "bad") : "b"), "middle");
    if (g) inner += srMark(P.x + 118, P.y + 107, g === P.k);
    o += HOT(rev ? "Cell " + D.LET[i] + ": " + nm.nm + " (" + nm.dz + ")." : "Cell " + D.LET[i] + ", drawn at the same scale as the other five; the pink disc is a red cell, for size. Pick " + D.LET[i] + " under the drawing to enlarge it.", inner);
  }
  o += T(210, 273, "one scale for all six · pink disc = a red cell", "s mut", "middle");
  /* the picked cell, enlarged */
  P = D.PAN[st.c]; g = st.done[st.c]; rev = st.all || !!g; nm = D.NM[P.k];
  o += '<rect class="sr-zm" x="5" y="284" width="410" height="240" rx="12"/>';
  o += T(16, 304, "Cell " + D.LET[st.c] + ", enlarged", "b", "start");
  P.z.forEach(function (l) { o += HOT(rev ? l.n : l.q, l.svg); });
  if (P.k !== "rl") o += HOT("A red cell, about 7.5 micrometers across, at the same enlargement, for size.", D.RBCZ);
  if (rev) {
    o += T(222, 304, nm.nm, "b", "start") + T(222, 320, nm.dz, "s mut", "start");
    if (g) { o += srMark(404, 300, g === P.k); if (g !== P.k) o += T(222, 336, "you said " + D.NM[g].sh, "s bad", "start"); }
    P.z.forEach(function (l) { if (l.lab) { o += L(222, l.y, l.lab[0], l.p[0], l.p[1], "start", "b"); if (l.lab[1]) o += T(222, l.y + 14, l.lab[1], "b", "start"); } });
  } else {
    o += T(222, 352, "What is it?", "b", "start");
    ["Size: set it against", "the red cell.", "Cytoplasm: how much?", "Granules? Needles?", "Nucleus: fine or", "clumped? Nucleoli?"].forEach(function (s, j) { o += T(222, 378 + j * 17, s, "s mut", "start"); });
  }
  return o;
}
function srSay(st, D) {
  var P = D.PAN[st.c], g = st.done[st.c], nm = D.NM[P.k], n = 0, r = 0, i, s, Lt = "Cell " + D.LET[st.c];
  for (i = 0; i < 6; i++) { if (st.done[i]) n++; if (st.first[i] === D.PAN[i].k) r++; }
  if (g && g === P.k) s = "Right: " + Lt + " is " + nm.a + ". What gives it away: " + nm.tell;
  else if (g) s = "Not quite: " + D.NM[g].look.charAt(0).toUpperCase() + D.NM[g].look.slice(1) + " " + Lt + " is " + nm.a + ". What gives it away: " + nm.tell;
  else if (st.all) s = Lt + " is " + nm.a + ". What gives it away: " + nm.tell;
  else s = Lt + ": what is it? Set its size against the red cell, then look at the cytoplasm (how much, any granules or needles) and the nucleus (fine or clumped chromatin, nucleoli), and pick a name.";
  return [s, n ? n + " of 6 named · " + r + " right" : st.all ? "names shown" : "0 of 6 named"];
}

export default function smears() {
  const D = {
    PAN: PANELS, NM, LET, RBCZ, ANIM: false, ONSET: "srOn", STEPKEY: "c", STEPMAX: 5,
    INIT: { c: 0, g: "", all: false, z: 0, done: {}, first: {} },
  };
  const btn = (k, v, s, aria) => `<button type="button" class="am-btn" data-amk="${k}" data-amv="${v}"${aria ? ` aria-label="${aria}"` : ""}>${s}</button>`;
  return makeFig({
    id: "smears", lec: "lymleuk", fig: "Fig 20.3", short: "Smear look-alikes", hint: "pick · name · hover",
    title: "Smear look-alikes",
    caption: "Six cells from the blood smears in Dr. Borak's lecture, drawn at one scale beside a red cell. Pick a cell, name it, and see what gives it away.",
    W, H,
    label: "Six schematic blood smear cells at one scale, each beside a red cell: a lymphoblast, a myeloblast with an Auer rod, an abnormal promyelocyte with a bundle of Auer rods, a Sézary cell with a cerebriform nucleus, a small CLL lymphocyte with clumped chromatin beside a smudge cell, and rouleaux. Below, the picked cell enlarged, with what gives it away labeled once it is named.",
    D, render: srRender, say: srSay, helpers: [srMark, srOn],
    controls: `<div class="am-controls" role="group" aria-label="Pick a cell"><span class="sr-lab">Cell</span>${LET.map((s, i) => btn("c", i, s, "Cell " + s)).join("")}<button type="button" class="am-btn" data-amstep="1">Next cell</button></div>` +
      `<div class="am-controls" role="group" aria-label="Name it"><span class="sr-lab">It is</span>${GUESS.map(([k, s]) => btn("g", k, s)).join("")}</div>` +
      `<div class="am-controls"><button type="button" class="am-btn" data-amt="all" aria-pressed="false">Show every name</button>${btn("z", 1, "Start over")}</div>`,
    sources: [
      "From the L20 notes (Dr. Borak's slides): the AML and ALL blasts (AML medium to large, moderate cytoplasm with granules, fine chromatin, distinct nucleoli, Auer rods; ALL small to medium, scant cytoplasm with no granules, indistinct nucleoli; Auer rods exclude ALL); the Auer rod as a red-blue, needle-like inclusion of fused abnormal granules; CLL's small mature lymphocytes with clumped cracked-mud or soccer-ball chromatin and its smudge cells; APL's abnormal promyelocytes with large, dense pink, red or purple granules and bundles of Auer rods; Sézary cells with cerebriform nuclei (hyperchromatic and hyperconvoluted, as in mycosis fungoides); rouleaux, red cells stacked like coins by myeloma's excess immunoglobulin. Every label and card uses those words.",
      "Auer rods: the figure follows his slide, which calls them lysosomal and acid phosphatase-positive. Textbooks (Robbins and Cotran Pathologic Basis of Disease; the WHO classification) stress that they are myeloperoxidase-positive; the notes mention both, and nothing here depends on the stain.",
      "Bain BJ, Blood Cells: A Practical Guide, and Rodak's Hematology: Clinical Principles and Applications (Keohane, Otto and Walenga): the sizes that set the one scale (a red cell about 7.5 micrometers; a small mature lymphocyte about 7 to 10; a lymphoblast up to about twice that; a myeloblast about 15 to 20; a promyelocyte up to about 25; a Sézary cell drawn at about 12, in the middle of its small-to-large range) and each cell's look on a Romanowsky stain: the blast's fine chromatin and nucleoli, the hypergranular APL promyelocyte with its folded nucleus and bundled Auer rods, the grooved Sézary nucleus, the crushed smudge cell, rouleaux. The sizes set the drawing only; no size is labeled.",
      "Schematic: the cells are drawn anew in code, not traced from microscope images, in the hub's palette rather than true stain colors. Granule, chromatin and groove counts are illustrative, and one cell of each kind can't show the range a real smear has. The lecture's objectives say the individual CD markers aren't needed, so none are shown.",
    ],
    css: `
.anima[data-anima="smears"] .am-svg{max-width:520px}
.anima[data-anima="smears"] .sr-lab{font:600 .78rem var(--font-body);color:var(--ink-soft);margin-right:2px}
.anima .smears-svg .sr-bg{fill:var(--bx-lumen);stroke:var(--anatomy-lo);stroke-width:1}
.anima .smears-svg .sr-bg.is-on{stroke:var(--anatomy-lit);stroke-width:2.4}
.anima .smears-svg .sr-tag{fill:var(--surface);stroke:var(--anatomy-mid);stroke-width:1}
.anima .smears-svg .sr-tag.is-on{fill:var(--accent-soft);stroke:var(--accent);stroke-width:1.6}
.anima .smears-svg .t.sr-tagt{font-size:12.5px}
.anima .smears-svg .t.sr-tagt.is-on{fill:var(--accent-ink);stroke:none}
.anima .smears-svg .sr-zm{fill:var(--bx-lumen);stroke:var(--anatomy-lo);stroke-width:1}
.anima .smears-svg .sr-rbc{fill:color-mix(in srgb,var(--bx-blood) 42%,var(--bx-blood-soft));stroke:color-mix(in srgb,var(--bx-blood) 75%,var(--bx-blood-soft));stroke-width:.8}
.anima .smears-svg .sr-pal{fill:var(--bx-blood-soft);opacity:.85}
.anima .smears-svg .sr-pal2{opacity:.4}
.anima .smears-svg .sr-cyb{fill:color-mix(in srgb,var(--bx-blue) 30%,var(--bx-blue-soft));stroke:var(--bx-blue);stroke-width:.8}
.anima .smears-svg .sr-cyp{fill:var(--bx-blue-soft);stroke:color-mix(in srgb,var(--bx-blue) 60%,var(--bx-blue-soft));stroke-width:.8}
.anima .smears-svg .sr-nf{fill:color-mix(in srgb,var(--bx-nuc) 62%,var(--bx-lumen));stroke:var(--bx-nuc-line);stroke-width:.7}
.anima .smears-svg .sr-nd{fill:var(--bx-nuc);stroke:var(--bx-nuc-line);stroke-width:.8}
.anima .smears-svg .sr-chr{fill:var(--bx-nuc-line);opacity:.75}
.anima .smears-svg .sr-cl{fill:var(--bx-nuc-line)}
.anima .smears-svg .sr-nl{fill:color-mix(in srgb,var(--bx-blue) 22%,var(--bx-lumen));stroke:var(--bx-blue);stroke-width:.6}
.anima .smears-svg .sr-faint{opacity:.38}
.anima .smears-svg .sr-gn{fill:var(--bx-memb)}
.anima .smears-svg .sr-gd{fill:color-mix(in srgb,var(--bx-memb) 78%,var(--bx-blood));opacity:.92}
.anima .smears-svg .sr-ar{fill:none;stroke:color-mix(in srgb,var(--bx-blood) 62%,var(--bx-violet));stroke-linecap:round}
.anima .smears-svg .sr-gv{fill:none;stroke:color-mix(in srgb,var(--bx-nuc) 30%,var(--bx-lumen));stroke-linecap:round;stroke-linejoin:round}
.anima .smears-svg .sr-sm{fill:color-mix(in srgb,var(--bx-nuc) 42%,var(--bx-lumen));stroke:color-mix(in srgb,var(--bx-nuc) 70%,var(--bx-lumen));stroke-width:.6}
.anima .smears-svg .sr-st{fill:none;stroke:var(--bx-nuc-line);stroke-linecap:round;opacity:.55}
.anima .smears-svg .dot{stroke:var(--surface);stroke-width:1}
.anima .smears-svg .sr-okc{fill:var(--bx-stim)}
.anima .smears-svg .sr-noc{fill:var(--bx-inhib)}
.anima .smears-svg .sr-okm,.anima .smears-svg .sr-nom{fill:none;stroke:var(--surface);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
`,
  });
}
