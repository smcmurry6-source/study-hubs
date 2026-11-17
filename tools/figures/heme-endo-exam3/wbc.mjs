// Fig: the five white cells side by side (L19 Introduction to Hematology, Dr. Herr, from the slides). Schematic cells
// drawn anew in code (no micrographs: he tests drawings, not stained images), at relative size with a red cell for scale:
// the granulocytes (neutrophil, eosinophil, basophil) on top, the agranulocytes (monocyte, the small and the large
// lymphocyte) below. Each cell's cytoplasm, granules and nucleus explain themselves on hover or tap. Explore mode picks a
// cell and gives its features, contents and job; Quiz me hides the names, gives a clue in the lecture's words and asks
// which cell it describes (the five buttons are the answers), with feedback for a wrong pick.
//
// The cell drawings (cellArt, cellCss) are exported for the hematopoiesis tree (hemato.mjs), which draws the same cells
// small. They run at build time only: the figures carry the finished SVG strings in their data.
import { makeFig, f1, T, HOT } from "./shared.mjs";

/* ---------- build-time drawing kit for schematic blood cells ---------- */
function rng(seed) {
  /* mulberry32: the same granules on every build */
  let a = seed >>> 0;
  return function () { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function sm(p) {
  /* closed smooth path through p (Catmull-Rom as cubic Beziers) */
  const n = p.length; let d = "M" + f1(p[0][0]) + " " + f1(p[0][1]);
  for (let i = 0; i < n; i++) {
    const a = p[(i - 1 + n) % n], b = p[i], c = p[(i + 1) % n], e = p[(i + 2) % n];
    d += "C" + f1(b[0] + (c[0] - a[0]) / 6) + " " + f1(b[1] + (c[1] - a[1]) / 6) + " " + f1(c[0] - (e[0] - b[0]) / 6) + " " + f1(c[1] - (e[1] - b[1]) / 6) + " " + f1(c[0]) + " " + f1(c[1]);
  }
  return d + "Z";
}
/* a closed blob around (cx, cy): radius fn(angle) */
function polar(cx, cy, fn, n) { const p = []; for (let i = 0; i < n; i++) { const a = i / n * 2 * Math.PI, r = fn(a); p.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return sm(p); }
/* an ellipse-like lobe, a by b, turned phi radians, with a little wobble */
function lobe(cx, cy, a, b, phi, wob, s) {
  const p = [], n = 14;
  for (let i = 0; i < n; i++) { const t = i / n * 2 * Math.PI, k = 1 + wob * Math.sin(3 * t + s) + wob * 0.5 * Math.sin(5 * t + 2 * s), x = a * Math.cos(t) * k, y = b * Math.sin(t) * k; p.push([cx + x * Math.cos(phi) - y * Math.sin(phi), cy + x * Math.sin(phi) + y * Math.cos(phi)]); }
  return sm(p);
}
const circ = (x, y, r) => "M" + f1(x - r) + " " + f1(y) + "a" + f1(r) + " " + f1(r) + " 0 1 0 " + f1(2 * r) + " 0a" + f1(r) + " " + f1(r) + " 0 1 0 " + f1(-2 * r) + " 0";
/* n points in a disc of radius R, at least minD apart, that pass ok() */
function scatter(rand, n, R, minD, ok) {
  const pts = []; let tries = 0;
  while (pts.length < n && tries < n * 80) {
    tries++; const a = rand() * 2 * Math.PI, d = Math.sqrt(rand()) * R, p = [d * Math.cos(a), d * Math.sin(a)];
    if (ok && !ok(p)) continue;
    if (pts.every((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) >= minD)) pts.push(p);
  }
  return pts;
}
const dots = (x, y, pts, r, rand, jit) => pts.map((p) => circ(x + p[0], y + p[1], r * (1 + (jit || 0) * (rand() - 0.5)))).join("");

/* One schematic cell at (x, y), radius r (the cell's edge), classes prefixed k. Returns its parts as SVG strings:
   cyto (the cell body), gran (its granules, or lysosomes), nuc (its nucleus), top (granules drawn over the nucleus). */
export function cellArt(kind, x, y, r, k, seed) {
  const R = rng(seed || 7), o = { cyto: "", gran: "", nuc: "", top: "" };
  const body = (cls, wob) => '<path class="' + k + "cell " + k + cls + '" d="' + polar(x, y, (a) => r * (1 + (wob || 0.018) * Math.sin(3 * a + seed) + 0.012 * Math.sin(7 * a)), 28) + '"/>';
  if (kind === "neu") {
    o.cyto = body("c-neu");
    const pri = scatter(R, Math.max(6, Math.round(r * 0.45)), r * 0.84, r * 0.12), sec = scatter(R, Math.max(14, Math.round(r * 1.6)), r * 0.86, r * 0.07);
    o.gran = '<path class="' + k + 'g-neu2" d="' + dots(x, y, sec, Math.max(0.55, r * 0.028), R, 0.4) + '"/><path class="' + k + 'g-neu1" d="' + dots(x, y, pri, Math.max(0.75, r * 0.04), R, 0.3) + '"/>';
    /* three to five lobes joined by thin strands, in a loose C */
    const L = [[-0.46, 0.1, 0.17, 0.22, 0.3], [-0.34, -0.36, 0.2, 0.16, 0.6], [0.06, -0.5, 0.19, 0.15, 0.1], [0.42, -0.26, 0.16, 0.21, -0.5], [0.34, 0.22, 0.18, 0.15, 0.4]];
    let st = "";
    L.forEach((l, i) => { st += (i ? "L" : "M") + f1(x + l[0] * r) + " " + f1(y + l[1] * r); });
    o.nuc = '<path class="' + k + 'strand" stroke-width="' + f1(Math.max(1.1, r * 0.075)) + '" d="' + st + '"/><path class="' + k + 'nu" d="' + L.map((l, i) => lobe(x + l[0] * r, y + l[1] * r, l[2] * r, l[3] * r, l[4], 0.05, i + seed)).join("") + '"/>';
  } else if (kind === "eos") {
    o.cyto = body("c-eos");
    const g = scatter(R, Math.max(16, Math.round(r * 1.5)), r * 0.84, r * 0.15);
    o.gran = '<path class="' + k + 'g-eos" d="' + dots(x, y, g, Math.max(1, r * 0.068), R, 0.25) + '"/>';
    o.nuc = '<path class="' + k + 'strand" stroke-width="' + f1(Math.max(1.2, r * 0.08)) + '" d="M' + f1(x - 0.3 * r) + " " + f1(y - 0.02 * r) + "Q" + f1(x) + " " + f1(y + 0.14 * r) + " " + f1(x + 0.3 * r) + " " + f1(y - 0.02 * r) + '"/><path class="' + k + 'nu" d="' + lobe(x - 0.33 * r, y - 0.05 * r, 0.26 * r, 0.34 * r, 0.35, 0.04, seed) + lobe(x + 0.33 * r, y - 0.05 * r, 0.26 * r, 0.34 * r, -0.35, 0.04, seed + 2) + '"/>';
  } else if (kind === "bas") {
    o.cyto = body("c-bas");
    o.nuc = '<path class="' + k + 'nu ' + k + 'nu-bas" d="' + lobe(x - 0.2 * r, y + 0.02 * r, 0.27 * r, 0.36 * r, 0.3, 0.05, seed) + lobe(x + 0.24 * r, y - 0.02 * r, 0.26 * r, 0.33 * r, -0.4, 0.05, seed + 3) + '"/>';
    const g = scatter(R, Math.max(10, Math.round(r * 0.85)), r * 0.8, r * 0.19);
    o.top = '<path class="' + k + 'g-bas" d="' + g.map((p) => lobe(x + p[0], y + p[1], Math.max(1.3, r * 0.085) * (0.85 + R() * 0.35), Math.max(1.1, r * 0.075) * (0.85 + R() * 0.3), R() * 3, 0.08, R() * 6)).join("") + '"/>';
  } else if (kind === "mono") {
    o.cyto = body("c-mono", 0.03);
    const g = scatter(R, Math.max(8, Math.round(r * 0.55)), r * 0.86, r * 0.14);
    o.gran = '<path class="' + k + 'g-mono" d="' + dots(x, y, g, Math.max(0.6, r * 0.026), R, 0.4) + '"/>';
    /* an indented, horseshoe-shaped nucleus, off center */
    const ia = -0.5;
    o.nuc = '<path class="' + k + 'nu ' + k + 'nu-mono" d="' + polar(x - 0.1 * r, y + 0.04 * r, (a) => { const d = Math.atan2(Math.sin(a - ia), Math.cos(a - ia)); return r * 0.6 * (1 - 0.62 * Math.exp(-d * d / 0.32)) * (1 + 0.04 * Math.sin(4 * a)); }, 44) + '"/>';
  } else if (kind === "lym" || kind === "nk") {
    const big = kind === "nk";
    o.cyto = body(big ? "c-nk" : "c-lym", 0.012);
    const nr = r * (big ? 0.66 : 0.82), ia = 2.6;
    o.nuc = '<path class="' + k + 'nu ' + k + 'nu-lym" d="' + polar(x + (big ? -0.12 : 0.05) * r, y + 0.02 * r, (a) => { const d = Math.atan2(Math.sin(a - ia), Math.cos(a - ia)); return nr * (1 - 0.13 * Math.exp(-d * d / 0.12)); }, 36) + '"/>';
    const cl = scatter(R, 5, nr * 0.6, nr * 0.3);
    o.top = '<path class="' + k + 'chrom" d="' + dots(x + (big ? -0.12 : 0.05) * r, y, cl, Math.max(0.8, nr * 0.13), R, 0.5) + '"/>';
  } else if (kind === "rbc") {
    /* a biconcave disc: the central pallor fades in from the rim in three soft steps */
    o.cyto = '<circle class="' + k + 'rbc" cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(r) + '"/>' + [0.66, 0.56, 0.46, 0.36, 0.26].map((q) => '<circle class="' + k + 'rbc-c" cx="' + f1(x + 0.03 * r) + '" cy="' + f1(y + 0.03 * r) + '" r="' + f1(r * q) + '"/>').join("");
  } else if (kind === "plt") {
    /* a few platelets around (x, y): small discs with a granular center */
    const P = [[0, 0, 1], [r * 1.1, -r * 0.7, 0.8], [r * 0.9, r * 0.9, 0.9], [-r * 0.9, r * 1.0, 0.75]];
    o.cyto = '<path class="' + k + 'plt" d="' + P.map((p, i) => lobe(x + p[0], y + p[1], r * 0.62 * p[2], r * 0.46 * p[2], i, 0.1, i + seed)).join("") + '"/>';
    o.gran = '<path class="' + k + 'g-plt" d="' + P.map((p) => circ(x + p[0] - r * 0.1, y + p[1], r * 0.12 * p[2]) + circ(x + p[0] + r * 0.14, y + p[1] + r * 0.06, r * 0.1 * p[2])).join("") + '"/>';
  } else if (kind === "mk") {
    /* a megakaryocyte: a very large cell with a big lobulated nucleus, platelets budding from its edge (drawn small here) */
    o.cyto = '<path class="' + k + "cell " + k + 'c-mk" d="' + polar(x, y, (a) => r * (1 + 0.05 * Math.sin(5 * a + 1) + 0.09 * Math.exp(-Math.pow(Math.atan2(Math.sin(a), Math.cos(a)) / 0.35, 2))), 40) + '"/>';
    const g = scatter(R, Math.round(r * 1.2), r * 0.88, r * 0.08);
    o.gran = '<path class="' + k + 'g-mk" d="' + dots(x, y, g, Math.max(0.5, r * 0.03), R, 0.3) + '"/>';
    o.nuc = '<path class="' + k + 'nu" d="' + polar(x - 0.12 * r, y, (a) => r * 0.5 * (1 + 0.12 * Math.sin(4 * a + 0.4) + 0.06 * Math.sin(7 * a + 2)), 48) + '"/>';
  } else if (kind === "blast") {
    /* a stem or progenitor cell: a large, finely granular nucleus with nucleoli in a thin, pale cytoplasm */
    o.cyto = body("c-blast", 0.025);
    o.nuc = '<path class="' + k + 'nu ' + k + 'nu-blast" d="' + polar(x + 0.06 * r, y - 0.03 * r, (a) => r * 0.7 * (1 + 0.04 * Math.sin(3 * a + seed)), 30) + '"/>';
    o.top = '<path class="' + k + 'nucleo" d="' + circ(x - 0.1 * r, y - 0.18 * r, Math.max(1, r * 0.1)) + circ(x + 0.26 * r, y + 0.14 * r, Math.max(0.9, r * 0.08)) + '"/>';
  }
  return o;
}

/* the cells' paint, for a figure whose svg has class `scope`, classes prefixed k */
export function cellCss(scope, k) {
  const s = ".anima ." + scope + " ." + k, v = "--" + k + "baso", w = "--" + k + "pallor";
  /* the basophil's granules stay a deep blue-violet in both themes, darker than its nucleus; the red cell's center is
     paler than its rim in both */
  return `
.anima .${scope}{${v}:#2c2672;${w}:#fff4f2}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]) .anima .${scope}{${v}:#6a62d6;${w}:#fbd3d4} }
:root[data-theme="dark"] .anima .${scope}{${v}:#6a62d6;${w}:#fbd3d4}
${s}cell{stroke:var(--bx-cyto-line);stroke-width:1.1}
${s}c-neu{fill:color-mix(in srgb,var(--bx-cyto) 45%,var(--surface))}
${s}c-eos{fill:color-mix(in srgb,var(--bx-cyto) 40%,var(--surface))}
${s}c-bas{fill:color-mix(in srgb,var(--bx-violet-soft) 70%,var(--surface))}
${s}c-mono{fill:color-mix(in srgb,var(--bx-blue-soft) 75%,var(--bx-cyto))}
${s}c-lym,${s}c-nk{fill:var(--bx-blue-soft);stroke:var(--bx-blue)}
${s}c-mk{fill:color-mix(in srgb,var(--bx-cyto) 55%,var(--surface))}
${s}c-blast{fill:color-mix(in srgb,var(--bx-blue-soft) 60%,var(--surface));stroke:var(--bx-blue)}
${s}nu{fill:var(--bx-nuc);stroke:var(--bx-nuc-line);stroke-width:.9}
${s}nu-bas{fill:color-mix(in srgb,var(--bx-nuc) 80%,var(--bx-violet-soft))}
${s}nu-mono{fill:color-mix(in srgb,var(--bx-nuc) 78%,var(--bx-violet-soft))}
${s}nu-lym{fill:color-mix(in srgb,var(--bx-nuc) 72%,var(--bx-nuc-line))}
${s}nu-blast{fill:color-mix(in srgb,var(--bx-nuc) 55%,var(--bx-violet-soft))}
${s}strand{fill:none;stroke:var(--bx-nuc-line);stroke-linecap:round;stroke-linejoin:round}
${s}chrom{fill:var(--bx-nuc-line);opacity:.35}
${s}nucleo{fill:var(--bx-nuc-line);opacity:.8}
${s}g-neu1{fill:var(--bx-violet)}
${s}g-neu2{fill:color-mix(in srgb,var(--bx-eosin) 55%,var(--bx-violet));opacity:.7}
${s}g-eos{fill:color-mix(in srgb,var(--bx-blood) 62%,var(--bx-hot));stroke:color-mix(in srgb,var(--bx-blood) 80%,var(--anatomy-hi));stroke-width:.35}
${s}g-bas{fill:var(${v});stroke:color-mix(in srgb,var(${v}) 70%,var(--anatomy-hi));stroke-width:.3}
${s}g-mono{fill:var(--bx-eosin);opacity:.85}
${s}g-mk{fill:var(--bx-violet);opacity:.55}
${s}rbc{fill:var(--bx-blood);stroke:color-mix(in srgb,var(--bx-blood) 70%,var(--anatomy-hi));stroke-width:.8}
${s}rbc-c{fill:var(${w});opacity:.2}
${s}plt{fill:var(--bx-violet-soft);stroke:var(--bx-violet);stroke-width:.8}
${s}g-plt{fill:var(--bx-violet)}
`;
}

/* ---------- the figure ---------- */
const W = 480, H = 424;
/* drawn at 5 units per micrometer: sizes from Junqueira and Ross (see sources); labels give only the lecture's numbers */
const UM = 5;
const CELLS = {
  neu: { x: 82, y: 76, um: 12, seed: 11 },
  eos: { x: 240, y: 76, um: 13, seed: 23 },
  bas: { x: 398, y: 76, um: 11.5, seed: 5 },
  mono: { x: 82, y: 278, um: 16, seed: 9 },
  lym: { x: 204, y: 278, um: 7, seed: 3, kind: "lym" },
  nk: { x: 286, y: 278, um: 10.5, seed: 17, kind: "nk" },
  rbc: { x: 410, y: 278, um: 7.5, seed: 2, kind: "rbc" },
};
const NAME = { neu: "Neutrophil", eos: "Eosinophil", bas: "Basophil", mono: "Monocyte", lym: "Lymphocyte" };
const COL = {
  neu: ["neutrophil", "50 to 70%", "multi-lobed nucleus", "two types of granules"],
  eos: ["eosinophil", "1 to 4%", "bilobed nucleus", "red granules"],
  bas: ["basophil", "under 1%", "bilobed nucleus", "dark blue granules"],
  mono: ["monocyte", "2 to 8%", "horseshoe nucleus", "becomes a macrophage"],
  lym: ["lymphocytes", "30 to 40%", "round nucleus", "thin rim of cytoplasm"],
};
/* what each part says on hover: [explore, quiz (no names, no jobs)] */
const PART = {
  neu: {
    cell: ["Neutrophil: the main phagocyte of the blood and the first line of defense against bacteria, 50 to 70 percent of the white cells. Highly motile; it circulates about 10 hours, then migrates into the tissues. It stores glycogen and has few mitochondria.", "A granulocyte. Look at its nucleus and its granules."],
    gran: ["Two types of granules. The primary granules (the azurophilic ones in histology texts) contain elastase and myeloperoxidase; the secondary (specific) granules contain lysozyme and proteases.", "Granules of two types, fine and small."],
    nuc: ["A multi-lobed nucleus: several lobes joined by thin strands.", "A multi-lobed nucleus: several lobes joined by thin strands."] },
  eos: {
    cell: ["Eosinophil, 1 to 4 percent: it destroys larger parasites and modulates allergic responses. It accumulates in parasitic infections, rises in allergic reactions such as hay fever, and carries IgE receptors.", "A granulocyte. Look at its nucleus and its granules."],
    gran: ["Large specific granules that stain red, or pink, with eosin: peroxidase, which helps kill microorganisms, and major basic protein (MBP), which disrupts the membranes of parasites (protozoa and helminths) and makes basophils release histamine.", "Large granules that stain red, or pink, with eosin."],
    nuc: ["A large bilobed nucleus.", "A bilobed nucleus."] },
  bas: {
    cell: ["Basophil, the rarest white cell (under 1 percent). It carries IgE receptors: when IgE binds them, it releases its vasoactive contents. It plays a prominent role in bronchial asthma.", "A granulocyte. Look at its nucleus and its granules."],
    gran: ["Large specific granules that stain dark blue or purple, holding heparin and vasoactive substances such as histamine.", "Large granules that stain dark blue or purple."],
    nuc: ["A typically bilobed nucleus, partly hidden by the granules.", "A bilobed nucleus, partly hidden by the granules."] },
  mono: {
    cell: ["Monocyte, 2 to 8 percent: a fairly large cell. It circulates about 3 days, then migrates into the tissues during inflammation and becomes a macrophage (together, the mononuclear phagocytic system). It phagocytoses bacteria, cells and debris and expresses MHC class II.", "An agranulocyte: a fairly large cell with plenty of cytoplasm."],
    gran: ["Prominent lysosomes, not the prominent granules of a granulocyte: the monocyte is an agranulocyte.", "Small dots: lysosomes, not prominent granules."],
    nuc: ["A single nucleus, often indented or horseshoe-shaped.", "A single nucleus, indented or horseshoe-shaped."] },
  lym: {
    cell: ["A small lymphocyte, about 6 to 8 micrometers: the B and T cells. Its light-staining cytoplasm is only a thin rim around the nucleus.", "A small agranulocyte: a thin rim of cytoplasm."],
    nuc: ["A spherical, slightly indented nucleus that almost fills the cell.", "A spherical, slightly indented nucleus that almost fills the cell."] },
  nk: {
    cell: ["A large lymphocyte, about 9 to 12 micrometers: the NK cells. They lack B and T cell markers and kill virus-infected and tumor cells, also by ADCC.", "A larger agranulocyte, with a little more cytoplasm."],
    nuc: ["A spherical, slightly indented nucleus.", "A spherical, slightly indented nucleus."] },
  rbc: { cell: ["A red cell, for scale: about 99 percent of the cells in the blood. It carries oxygen and carbon dioxide and has no nucleus.", "A red cell, for scale: it has no nucleus."] },
};
const SUM = {
  "": ["Two classes, five types. The granulocytes (neutrophil, eosinophil, basophil) have prominent granules and play a role in innate immunity; the agranulocytes (monocyte, lymphocyte) lack them. Drawn to relative size, with a red cell for scale. Pick a cell below, or press Quiz me.", "5 white cells · relative size"],
  neu: ["Neutrophil, 50 to 70 percent of the white cells: the main phagocyte of the blood and the first line of defense against bacteria. A multi-lobed nucleus, large glycogen stores with few mitochondria, and two types of granules: the primary ones hold elastase and myeloperoxidase, the secondary ones lysozyme and proteases. It circulates about 10 hours, then migrates into the tissues.", "neutrophil · 50 to 70%"],
  eos: ["Eosinophil, 1 to 4 percent: a large bilobed nucleus and large specific granules that stain red with eosin. Peroxidase helps kill microorganisms; major basic protein disrupts the membranes of parasites (protozoa and helminths) and makes basophils release histamine. It accumulates in parasitic infections, rises in allergic reactions such as hay fever, and carries IgE receptors.", "eosinophil · 1 to 4%"],
  bas: ["Basophil, the rarest white cell (under 1 percent): a typically bilobed nucleus and large specific granules that stain dark blue to purple, holding heparin and vasoactive substances such as histamine. When IgE binds its IgE receptors it releases them, and it plays a prominent role in bronchial asthma.", "basophil · under 1%"],
  mono: ["Monocyte, 2 to 8 percent: a fairly large cell with one nucleus, often indented or horseshoe-shaped, and prominent lysosomes. It circulates about 3 days, then migrates into the tissues and becomes a macrophage. It phagocytoses bacteria, cells and debris and expresses MHC class II, which is how a macrophage presents antigen to helper T cells.", "monocyte · 2 to 8%"],
  lym: ["Lymphocytes, 30 to 40 percent: a spherical, slightly indented nucleus with only a thin rim of light-staining cytoplasm. The small ones, about 6 to 8 micrometers, are the B and T cells; the large ones, about 9 to 12 micrometers, are the NK cells. The blood's lymphocytes are immunocompetent: they recognize and respond to antigens.", "lymphocytes · 30 to 40%"],
};
/* quiz: a clue in the lecture's words, its answer, and the line that says why */
const CLUES = [
  ["A multi-lobed nucleus, and two types of granules: the primary ones hold elastase and myeloperoxidase.", "neu", "the neutrophil: multi-lobed nucleus, primary granules with elastase and myeloperoxidase."],
  ["A bilobed nucleus and large granules that stain red with eosin.", "eos", "the eosinophil, named for the eosin that stains its granules red."],
  ["Under 1 percent of the white cells: a bilobed nucleus under large granules that stain dark blue to purple.", "bas", "the basophil, the rarest white cell, with dark blue to purple granules."],
  ["A fairly large cell with a single nucleus, often indented or horseshoe-shaped.", "mono", "the monocyte: a horseshoe-shaped nucleus in a large cell."],
  ["A spherical, slightly indented nucleus with only a thin rim of light-staining cytoplasm.", "lym", "the lymphocyte: a round nucleus in a thin rim of cytoplasm."],
  ["The main phagocyte of the blood and the first line of defense against bacteria: 50 to 70 percent of the white cells.", "neu", "the neutrophil, the most common white cell and the first defense against bacteria."],
  ["Its granules hold heparin and histamine, released when IgE binds its receptors; it plays a prominent role in bronchial asthma.", "bas", "the basophil: heparin and histamine, IgE receptors, asthma."],
  ["Its major basic protein disrupts the membranes of parasites; it rises in hay fever.", "eos", "the eosinophil: major basic protein against parasites, and allergy."],
  ["It circulates about 3 days, then becomes a macrophage in the tissues, and it expresses MHC class II.", "mono", "the monocyte, which becomes the tissue macrophage."],
  ["30 to 40 percent of the white cells: the small ones are the B and T cells, the large ones the NK cells.", "lym", "the lymphocytes: small B and T cells, large NK cells."],
  ["It circulates for about 10 hours, then migrates into the tissues.", "neu", "the neutrophil, about 10 hours in the blood."],
];
const NOT = {
  neu: "it has a multi-lobed nucleus and fights bacteria",
  eos: "its granules stain red; it handles parasites and allergy",
  bas: "its granules stain dark blue to purple (heparin, histamine)",
  mono: "it has a horseshoe-shaped nucleus and becomes a macrophage",
  lym: "it is a round nucleus in a thin rim of cytoplasm",
};

function wbArt() {
  const A = {};
  for (const id in CELLS) { const c = CELLS[id]; A[id] = cellArt(c.kind || id, c.x, c.y, c.um * UM / 2, "wb-", c.seed); A[id].r = c.um * UM / 2; }
  return A;
}

function wbRender(st, D) {
  var o = "", quiz = st.mode === "qz", cl = D.CLUES[st.q], ans = quiz ? cl[1] : "", picked = quiz && st.pq === st.q ? st.sel : "", right = picked && picked === ans;
  o += T(12, 22, "GRANULOCYTES · PROMINENT GRANULES · INNATE IMMUNITY", "wb-h", "start");
  o += '<path class="wb-rule" d="M12 192H468"/>';
  o += T(12, 214, "AGRANULOCYTES · NO PROMINENT GRANULES", "wb-h", "start");
  ["neu", "eos", "bas", "mono", "lym", "nk", "rbc"].forEach(function (id) {
    var c = D.CELLS[id], a = D.ART[id], grp = id === "nk" ? "lym" : id, on = !quiz && st.sel === grp, P = D.PART[id], qi = quiz ? 1 : 0, ring = "";
    if (on) ring = '<circle class="wb-ring" cx="' + c.x + '" cy="' + c.y + '" r="' + f1(a.r + 6) + '"/>';
    if (quiz && picked === grp) ring = '<circle class="wb-ring ' + (right ? "wb-ok" : "wb-no") + '" cx="' + c.x + '" cy="' + c.y + '" r="' + f1(a.r + 6) + '"/>';
    var inner = a.cyto + (a.gran ? (P.gran ? HOT(P.gran[qi], a.gran) : a.gran) : "") + (a.nuc ? HOT(P.nuc[qi], a.nuc) : "") + (a.top ? (id === "bas" ? HOT(P.gran[qi], a.top) : a.top) : "");
    o += ring + '<g class="wb-cellg' + (st.sel && !quiz && !on && id !== "rbc" ? " wb-dim" : "") + '">' + HOT(P.cell[qi], inner) + "</g>";
  });
  /* the column labels: hidden in the quiz until the right cell is picked */
  ["neu", "eos", "bas", "mono", "lym"].forEach(function (id) {
    var c = D.COL[id], x = id === "lym" ? 246 : D.CELLS[id].x, y0 = D.CELLS[id].y < 200 ? 132 : 358, show = !quiz || (right && ans === id), on = !quiz && st.sel === id;
    if (show) o += '<g' + (st.sel && !quiz && !on ? ' class="wb-dim"' : "") + ">" + T(x, y0, c[0], "wb-name", "middle") + T(x, y0 + 16, c[1], "wb-share", "middle") + T(x, y0 + 32, c[2], "wb-ft", "middle") + T(x, y0 + 48, c[3], "wb-ft", "middle") + "</g>";
    else o += T(x, y0 + 8, "?", "wb-q", "middle");
  });
  if (!quiz || (right && ans === "lym")) {
    o += '<g' + (st.sel && !quiz && st.sel !== "lym" ? ' class="wb-dim"' : "") + ">" + T(204, 320, "B, T cells", "wb-sub", "middle") + T(204, 334, "6 to 8 µm", "wb-sub mut", "middle");
    o += T(286, 320, "NK cells", "wb-sub", "middle") + T(286, 334, "9 to 12 µm", "wb-sub mut", "middle") + "</g>";
  }
  o += T(410, 320, "red cell,", "wb-sub mut", "middle") + T(410, 334, "for scale", "wb-sub mut", "middle");
  return o;
}
function wbSay(st, D) {
  if (st.mode !== "qz") return D.SUM[st.sel || ""];
  var cl = D.CLUES[st.q], n = D.CLUES.length, head = "Clue " + (st.q + 1) + " of " + n + ": " + cl[0] + " Which cell is it?";
  if (st.pq !== st.q || !st.sel) return [head + " Pick one of the five below.", "quiz · clue " + (st.q + 1) + " of " + n];
  if (st.sel === cl[1]) return ["Right, " + cl[2] + " Press Next clue for another.", "clue " + (st.q + 1) + " of " + n + " · right"];
  return [head + " Not the " + D.NAME[st.sel].toLowerCase() + ": " + D.NOT[st.sel] + ". Try another.", "clue " + (st.q + 1) + " of " + n + " · try again"];
}
function wbOn(st, key, D) {
  if (key === "mode" && st.mode === "qz") { st.sel = ""; st.pq = -1; }
  if (key === "nx") { if (st.mode === "qz") st.q = (st.q + 1) % D.CLUES.length; st.mode = "qz"; st.sel = ""; st.pq = -1; st.nx = 0; }
  if (key === "sel" && st.mode === "qz") st.pq = st.q;
}

export default function wbc() {
  const D = { INIT: { mode: "ex", sel: "", q: 0, pq: -1, nx: 0 }, ONSET: "wbOn", CELLS, ART: wbArt(), PART, SUM, CLUES, NOT, NAME, COL };
  return makeFig({
    id: "wbc", lec: "hemeintro", fig: "Fig 14", short: "The five white cells", hint: "pick · hover · quiz",
    title: "The five white cells side by side",
    caption: "Schematic drawings of the five white blood cells at relative size, with a red cell for scale. Pick a cell to read its features, granules and job, or press Quiz me: the names hide and a clue asks which cell it describes.",
    W, H,
    label: "Schematic drawings of the white blood cells at relative size. Top row, the granulocytes: a neutrophil with a multi-lobed nucleus and fine granules, an eosinophil with a bilobed nucleus and large red granules, and a basophil with a bilobed nucleus under large dark blue granules. Bottom row, the agranulocytes: a large monocyte with a horseshoe-shaped nucleus, a small lymphocyte (B and T cells) and a large lymphocyte (NK cells), each a round nucleus in a thin rim of cytoplasm, and a red cell for scale.",
    D, render: wbRender, say: wbSay, helpers: [wbOn],
    controls: `<div class="am-controls" role="group" aria-label="Mode"><button type="button" class="am-btn" data-amk="mode" data-amv="ex">Explore</button><button type="button" class="am-btn" data-amk="mode" data-amv="qz">Quiz me</button><button type="button" class="am-btn" data-amk="nx" data-amv="1">Next clue</button></div>
<div class="am-controls" role="group" aria-label="Cell">${Object.keys(NAME).map((id) => `<button type="button" class="am-btn" data-amk="sel" data-amv="${id}">${NAME[id]}</button>`).join("")}</div>`,
    sources: [
      "From the L19 notes (Dr. Herr's slides and their speaker notes): the two classes and five types; each cell's share of the white count; the neutrophil's multi-lobed nucleus, glycogen and two types of granules (primary: elastase and myeloperoxidase; secondary: lysozyme and proteases), about 10 hours in the blood; the eosinophil's bilobed nucleus, red-staining granules, peroxidase and major basic protein, parasites, hay fever and IgE receptors; the basophil's bilobed nucleus, dark blue to purple granules, heparin, histamine, IgE receptors and asthma; the monocyte's indented or horseshoe-shaped nucleus, lysosomes, about 3 days in the blood, the macrophage and MHC class II; the lymphocyte's spherical, slightly indented nucleus and thin rim of light-staining cytoplasm, small B and T cells and large NK cells.",
      "Three slide errors, drawn the way the notes teach them. Slide 6 labels the neutrophil's secondary granules \"Azur granules\"; histology texts (Junqueira, Ross) call the primary granules azurophilic and the secondary ones specific, so the primary granules are drawn as the darker azurophilic ones and the hover names their contents. Slide 10 writes the lymphocyte sizes as 6 to 8 and 9 to 12 \"mm\"; they are micrometers. Slide 4 calls NK cells \"Killer T cells\"; they are drawn as the large lymphocytes, not as T cells (his slide 13: no B or T cell markers).",
      "Mescher AL, Junqueira's Basic Histology (the blood: its leukocyte table), and Ross MH and Pawlina W, Histology: A Text and Atlas (blood): the relative sizes the cells are drawn at, 5 drawing units per micrometer (red cell about 7.5 µm, neutrophil about 12, eosinophil about 13, basophil about 11.5, monocyte about 16, small lymphocyte 7, large lymphocyte 10.5), and how each looks: neutrophil lobes joined by thin chromatin strands, the eosinophil's two lobes and large round granules, basophil granules that often hide the nucleus, the monocyte's ample cytoplasm and eccentric indented nucleus, the lymphocyte's dense nucleus. Only the lecture's numbers are labeled.",
      "Bain BJ, Blood Cells: A Practical Guide: the colors of a stained smear the drawing translates into the hub's palette (orange-red eosinophil granules, deep purple basophil granules, gray-blue monocyte cytoplasm, pale blue lymphocyte cytoplasm, the red cell's central pallor).",
      "Schematic, not micrographs: shapes and colors are simplified, granule counts are illustrative, and every cell is drawn flat. The NK cell is drawn without granules, because the lecture describes the lymphocytes as agranulocytes. Educational, not medical advice.",
    ],
    css: `
.anima[data-anima="wbc"] .am-svg{max-width:540px}
.anima .wbc-svg .wb-h{font:600 11px var(--anatomy-mono);letter-spacing:.06em;fill:var(--anatomy-muted);stroke:none}
.anima .wbc-svg .wb-rule{fill:none;stroke:var(--anatomy-faint);stroke-width:1}
.anima .wbc-svg .wb-ring{fill:none;stroke:var(--accent);stroke-width:2.2}
.anima .wbc-svg .wb-ring.wb-ok{stroke:var(--bx-stim);stroke-width:2.6}
.anima .wbc-svg .wb-ring.wb-no{stroke:var(--bx-inhib);stroke-dasharray:4 3}
.anima .wbc-svg .wb-dim{opacity:.55}
.anima .wbc-svg .t.wb-name{font-size:13px;font-weight:600;fill:var(--anatomy-strong)}
.anima .wbc-svg .t.wb-share{font-size:12px;fill:var(--anatomy-strong)}
.anima .wbc-svg .t.wb-ft{font-size:11.5px}
.anima .wbc-svg .t.wb-sub{font-size:11.5px}
.anima .wbc-svg .t.wb-q{font-size:20px;font-weight:700;fill:var(--anatomy-muted)}
@media (max-width:560px){.anima .wbc-svg .wb-h{font-size:13px}.anima .wbc-svg .t.wb-name{font-size:15.5px}.anima .wbc-svg .t.wb-share{font-size:14.5px}.anima .wbc-svg .t.wb-ft,.anima .wbc-svg .t.wb-sub{font-size:13.5px}}
${cellCss("wbc-svg", "wb-")}`,
  });
}
