// Fig 20.1: the neutrophil ladder (L20 Lymphomas and Leukemias, Dr. Borak, from the slides: how blood cells mature,
// acute versus chronic leukemia, blasts and Auer rods, acute promyelocytic leukemia, chronic myeloid leukemia). The six
// stages of the neutrophil line on a vertical ladder, youngest at the top: myeloblast, promyelocyte, myelocyte,
// metamyelocyte, band, segmented neutrophil (PMN), each cell drawn in code at its relative size, as on a stained smear.
// Beside each stage, a row of small cells shows where the cells pile up (the blood, or the marrow) in the state picked:
// normal, AML (blasts that don't mature, with an Auer rod), APL (maturation stops at the promyelocyte, the abnormal
// promyelocytes packed with granules and holding bundles of Auer rods), APL on ATRA plus arsenic (maturing again) and
// CML (every stage in the blood, with peaks at the myelocytes and the segmented neutrophils, few blasts). Counts are
// schematic; the only number shown is his 20 percent. No CD markers (his objectives: not needed).
import { makeFig, f1, T, HOT } from "./shared.mjs";

/* ---------- build-time drawing of the cells ---------- */
function rng(seed) { let a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function sm(p) {
  /* closed smooth path through p (Catmull-Rom as cubic Beziers) */
  var n = p.length, d = "M" + f1(p[0][0]) + " " + f1(p[0][1]), i, a, b, c, e;
  for (i = 0; i < n; i++) { a = p[(i - 1 + n) % n]; b = p[i]; c = p[(i + 1) % n]; e = p[(i + 2) % n];
    d += "C" + f1(b[0] + (c[0] - a[0]) / 6) + " " + f1(b[1] + (c[1] - a[1]) / 6) + " " + f1(c[0] - (e[0] - b[0]) / 6) + " " + f1(c[1] - (e[1] - b[1]) / 6) + " " + f1(c[0]) + " " + f1(c[1]); }
  return d + "Z";
}
/* an oval with a slightly uneven edge; dent (0-1) pushes in the side facing +x, for the metamyelocyte's kidney */
function oval(cx, cy, rx, ry, R, jit, dent, n) {
  n = n || 16; const p = [];
  for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2, j = 1 + (R() - 0.5) * jit, d = dent ? 1 - dent * Math.exp(-Math.pow(a > Math.PI ? a - 2 * Math.PI : a, 2) / 0.35) : 1;
    p.push([cx + rx * j * d * Math.cos(a), cy + ry * j * d * Math.sin(a)]); }
  return p;
}
function inside(p, x, y) { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { if ((p[i][1] > y) !== (p[j][1] > y) && x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) c = !c; } return c; }
function dots(R, n, r, test, cls, rr) {
  let o = "", k = 0, tries = 0;
  while (k < n && tries < n * 60) { tries++; const x = (R() * 2 - 1) * rr, y = (R() * 2 - 1) * rr; if (!test(x, y)) continue; k++;
    o += "M" + f1(x - r) + " " + f1(y) + "a" + r + " " + r + " 0 1 0 " + f1(2 * r) + " 0a" + r + " " + r + " 0 1 0 " + f1(-2 * r) + " 0"; }
  return o ? '<path class="' + cls + '" d="' + o + '"/>' : "";
}
/* one cell centered on 0,0 with radius r. kinds: blast, blastA (with an Auer rod), pro, proA (APL), myelo, meta, band, seg */
function cell(kind, r, seed, mini) {
  const R = rng(seed), memb = oval(0, 0, r, r * 0.96, R, 0.06, 0, 18);
  const inCell = (x, y) => inside(memb, x / 0.84, y / 0.84);
  const cyto = { blast: "nl-cyb", blastA: "nl-cyb", pro: "nl-cyp", proA: "nl-cyp", myelo: "nl-cym" }[kind] || "nl-cyn";
  let o = '<path class="nl-mem ' + cyto + '" d="' + sm(memb) + '"/>', nuc = null, nq = mini ? 0.35 : 1;
  if (kind === "blast" || kind === "blastA") {
    nuc = oval(-0.1 * r, 0.02 * r, 0.72 * r, 0.7 * r, R, 0.07, 0, 16);
    o += '<path class="nl-nf" d="' + sm(nuc) + '"/>';
    if (!mini) o += dots(R, Math.round(40 * Math.pow(r / 22, 2)), 0.55, (x, y) => inside(nuc, x / 0.92, y / 0.92), "nl-ch", r);
    const nl = mini ? [[-0.15, -0.1, 0.16]] : [[-0.32, -0.22, 0.12], [0.12, 0.18, 0.1], [-0.12, 0.34, 0.08]];
    nl.forEach((q) => { o += '<circle class="nl-no" cx="' + f1(q[0] * r) + '" cy="' + f1(q[1] * r) + '" r="' + f1(q[2] * r) + '"/>'; });
    if (kind === "blastA") o += '<path class="nl-auer" d="M' + f1(0.64 * r) + " " + f1(-0.38 * r) + "L" + f1(0.79 * r) + " " + f1(0.3 * r) + '"/>';
  } else if (kind === "pro" || kind === "proA") {
    nuc = oval(-0.28 * r, 0.1 * r, 0.5 * r, 0.45 * r, R, 0.08, 0, 16);
    if (!mini) o += '<ellipse class="nl-hof" cx="' + f1(0.14 * r) + '" cy="' + f1(-0.02 * r) + '" rx="' + f1(0.2 * r) + '" ry="' + f1(0.24 * r) + '"/>';
    o += '<path class="nl-nf nl-nf2" d="' + sm(nuc) + '"/>';
    if (!mini) o += dots(R, 22, 0.6, (x, y) => inside(nuc, x / 0.9, y / 0.9), "nl-ch", r) + '<circle class="nl-no" cx="' + f1(-0.36 * r) + '" cy="' + f1(0.02 * r) + '" r="' + f1(0.08 * r) + '"/>';
    const A = kind === "proA";
    o += dots(R, Math.round((A ? 64 : 34) * nq), f1(r * (A ? 0.085 : 0.07)), (x, y) => inCell(x, y) && (A || !(Math.hypot(x - 0.14 * r, y + 0.02 * r) < 0.2 * r)), A ? "nl-gra" : "nl-gr", r);
    if (A) {
      let b = ""; const n = mini ? 3 : 6;
      for (let k = 0; k < n; k++) { const a = (55 + (R() - 0.5) * 40) * Math.PI / 180, cx = 0.38 * r + (R() - 0.5) * 0.18 * r, cy = -0.3 * r + (R() - 0.5) * 0.2 * r, l = (mini ? 0.3 : 0.24) * r;
        b += "M" + f1(cx - l * Math.cos(a)) + " " + f1(cy - l * Math.sin(a)) + "L" + f1(cx + l * Math.cos(a)) + " " + f1(cy + l * Math.sin(a)); }
      o += '<path class="nl-auer' + (mini ? " nl-auer-m" : "") + '" d="' + b + '"/>';
    }
  } else {
    if (kind === "myelo") { nuc = oval(-0.3 * r, 0.08 * r, 0.44 * r, 0.42 * r, R, 0.06, 0, 16); o += '<path class="nl-nd" d="' + sm(nuc) + '"/>'; }
    else if (kind === "meta") { nuc = oval(-0.2 * r, 0.04 * r, 0.5 * r, 0.36 * r, R, 0.04, 0.42, 20); o += '<path class="nl-nd" d="' + sm(nuc) + '"/>'; }
    else if (kind === "band") {
      /* a curved band of even width: outer and inner arcs joined by round ends */
      const cx = 0.04 * r, cy = 0.02 * r, ro = 0.52 * r, ri = 0.3 * r, a0 = 0.85, a1 = 5.45, pts = [];
      for (let a = a0; a <= a1 + 1e-6; a += (a1 - a0) / 14) pts.push([cx + ro * Math.cos(a), cy + ro * Math.sin(a)]);
      let d = "M" + pts.map((q) => f1(q[0]) + " " + f1(q[1])).join("L");
      const e1 = [cx + ri * Math.cos(a1), cy + ri * Math.sin(a1)], e0 = [cx + ri * Math.cos(a0), cy + ri * Math.sin(a0)], rr = (ro - ri) / 2;
      d += "A" + f1(rr) + " " + f1(rr) + " 0 0 1 " + f1(e1[0]) + " " + f1(e1[1]);
      for (let a = a1; a >= a0 - 1e-6; a -= (a1 - a0) / 14) d += "L" + f1(cx + ri * Math.cos(a)) + " " + f1(cy + ri * Math.sin(a));
      d += "A" + f1(rr) + " " + f1(rr) + " 0 0 1 " + f1(pts[0][0]) + " " + f1(pts[0][1]) + "Z";
      o += '<path class="nl-nd" d="' + d + '"/>';
      nuc = null;
    } else {
      /* segmented: four lobes joined by thin strands */
      const L = [[0.3, -0.34], [-0.26, -0.3], [-0.36, 0.22], [0.2, 0.32]].map((q) => [q[0] * r, q[1] * r]);
      let s = "";
      for (let k = 0; k < 3; k++) s += "M" + f1(L[k][0]) + " " + f1(L[k][1]) + "Q" + f1((L[k][0] + L[k + 1][0]) / 2 * 0.6) + " " + f1((L[k][1] + L[k + 1][1]) / 2 * 0.6) + " " + f1(L[k + 1][0]) + " " + f1(L[k + 1][1]);
      o += '<path class="nl-fil" d="' + s + '"/>';
      L.forEach((q, k) => { o += '<path class="nl-nd" d="' + sm(oval(q[0], q[1], 0.21 * r, 0.18 * r, R, 0.1, 0, 10)) + '"/>'; });
    }
    if (nuc && !mini) o += dots(R, 8, f1(0.07 * r), (x, y) => inside(nuc, x / 0.8, y / 0.8), "nl-cl", r);
    o += dots(R, Math.round(42 * nq), f1(Math.max(0.5, 0.032 * r)), inCell, "nl-gf", r);
  }
  return o;
}

/* ---------- page helpers (serialized into the page) ---------- */
function nlBlock(y, cls, x1) { return '<path class="nl-stop ' + cls + '" d="M6 ' + y + 'H26"/><path class="nl-blk ' + cls + '" d="M32 ' + y + "H" + x1 + '"/>'; }

function nlRender(st, D) {
  var S = D.ST[st.ds], t = st.t || 0, o = "", i, k, Y = D.Y;
  /* the rail: the order of maturation, top to bottom */
  o += HOT("The neutrophil line matures in a fixed order, top to bottom: myeloblast, promyelocyte, myelocyte, metamyelocyte, band, segmented neutrophil (PMN). The blast is the youngest cell.",
    '<path class="nl-rail" d="M16 40V' + (Y[5] + 34) + '"/><path class="nl-arrow" d="M11 ' + (Y[5] + 28) + "L16 " + (Y[5] + 38) + "L21 " + (Y[5] + 28) + 'Z"/>' + T(6, 26, "matures", "nl-h", "start"));
  var gy = S.block >= 0 ? (Y[S.block] + Y[S.block + 1]) / 2 : 0, held = S.block >= 0 && !S.lift;
  /* cells moving down the rail; held at a block */
  for (k = 0; k < 4; k++) {
    var u = t ? ((t / 7000 + k / 4) % 1) : (k + 0.5) / 4, y = 44 + u * (Y[5] + 24 - 44), op = Math.min(1, u / 0.06, (1 - u) / 0.06);
    if (held && y > gy - 7 - k * 4) { y = gy - 7 - k * 4; op = 1; }
    o += '<circle class="nl-flow" cx="16" cy="' + f1(y) + '" r="3" opacity="' + f1(Math.max(0, op)) + '"/>';
  }
  for (i = 0; i < 6; i++) {
    var dim = held && i > S.block, kind = D.KIND[i];
    if (S.ab === i) kind += "A";
    var g = '<circle class="nl-badge" cx="16" cy="' + Y[i] + '" r="9"/>' + T(16, Y[i] + 4, String(i + 1), "nl-bn", "middle");
    g += '<g transform="translate(66 ' + Y[i] + ')"' + (dim ? ' opacity=".34"' : "") + ">" + D.CELL[kind] + "</g>";
    var nm = D.NAME[i], ty = nm.length > 1 ? Y[i] - 13 : Y[i] - 5;
    g += '<g' + (dim ? ' opacity=".34"' : "") + ">";
    for (k = 0; k < nm.length; k++) g += T(104, ty + k * 15, nm[k], "nl-nm", "start");
    g += T(104, ty + nm.length * 15 + 1, (S.ab === i ? D.LOOKA[i] : D.LOOK[i]), "nl-lk" + (S.ab === i ? " nl-lk-ab" : ""), "start") + "</g>";
    /* the pile: how many of this stage are where the state looks (schematic) */
    var n = S.pile[i], pk = S.ab === i ? D.KIND[i] + "A" : D.KIND[i];
    for (k = 0; k < n; k++) {
      var mk = (S.ab === 0 && i === 0) ? (k % 3 === 1 ? "blastA" : "blast") : pk;
      g += '<g transform="translate(' + (262 + k * 20) + " " + Y[i] + ')">' + D.MINI[mk] + "</g>";
    }
    if (S.tag && S.tag[i]) g += T(n ? 262 + n * 20 - 2 : 254, Y[i] + 4, S.tag[i], "nl-tag" + (S.tagc ? " " + S.tagc : ""), "start");
    if (!n && !(S.tag && S.tag[i])) g += '<path class="nl-none" d="M254 ' + Y[i] + 'H272"/>';
    o += HOT(D.INFO[i] + (S.note && S.note[i] ? " " + S.note[i] : ""), g + '<rect class="nl-hit" x="2" y="' + (Y[i] - 32) + '" width="436" height="64"/>');
  }
  /* the block */
  if (S.block >= 0) {
    o += HOT(S.lift ? "All-trans retinoic acid with arsenic trioxide: the retinoic acid lets the blocked promyelocytes mature." : S.block === 0 ? "In acute leukemia the blasts don't mature: they fill the marrow and crowd out normal blood-making." : "In APL, PML::RARA impairs myeloid differentiation: maturation stops at the promyelocyte.",
      nlBlock(gy, S.lift ? "nl-blk-off" : "", 244) + T(254, gy + 4, S.blabel, "nl-btag" + (S.lift ? " nl-btag-off" : ""), "start"));
  }
  /* the column's heading: where the pile is, and the state's fact */
  o += T(254, 20, S.comp === "blood" ? "IN THE BLOOD" : "IN THE MARROW", "nl-h nl-hb", "start") + T(254, 34, S.sub, "nl-sub", "start");
  /* the verdict */
  o += '<rect class="nl-ban' + (st.ds === "normal" ? "" : " is-on") + '" x="6" y="' + (Y[5] + 46) + '" width="428" height="46" rx="10"/>' +
    T(18, Y[5] + 64, S.name.toUpperCase(), "nl-h", "start") + T(18, Y[5] + 82, S.verdict, "nl-v", "start");
  return o;
}
function nlSay(st, D) { var S = D.ST[st.ds]; return [S.say, S.ro]; }

/* ---------- the states, as the notes give them ---------- */
const ST = {
  normal: { name: "Normal", comp: "blood", sub: "blasts stay in the marrow", pile: [0, 0, 0, 0, 1, 6], block: -1, ab: -1,
    tag: ["none", "", "", "", "", ""], tagc: "",
    verdict: "Only the last stages leave the marrow: no blasts",
    say: "Normal: a neutrophil matures in a fixed order, myeloblast, promyelocyte, myelocyte, metamyelocyte, band, then the segmented neutrophil (PMN). The blast is the youngest cell, and it stays in the marrow: outside the newborn period, blasts in the peripheral blood are always abnormal.",
    ro: "normal · blood" },
  aml: { name: "Acute myeloid leukemia", comp: "marrow", sub: "most AML: 20% blasts", pile: [8, 0, 0, 0, 1, 1], block: 0, ab: 0, blabel: "blasts don't mature",
    note: ["Here they fill the marrow; this one carries an Auer rod, a red-blue needle in its cytoplasm, which marks it as myeloid and excludes ALL.", "", "", "", "", ""],
    verdict: "Blasts that don't mature fill the marrow",
    say: "Acute myeloid leukemia: blasts that don't mature fill the marrow fast, crowding out normal blood-making, so the other lines fail (anemia, low platelets, too few working neutrophils). Most AML needs 20 percent blasts in the marrow; an AML with one of its defining genetic abnormalities is diagnosed whatever the blast count. An Auer rod, a red-blue needle in a myeloblast's cytoplasm, marks the blast as myeloid: Auer rods exclude ALL.",
    ro: "AML · 20% blasts" },
  apl: { name: "Acute promyelocytic leukemia", comp: "marrow", sub: "t(15;17), PML::RARA", pile: [1, 8, 0, 0, 0, 1], block: 1, ab: 1, blabel: "maturation stops here",
    note: ["", "In APL these abnormal promyelocytes predominate: large, dense granules and bundles of Auer rods.", "", "", "", ""],
    verdict: "Maturation stops at the promyelocyte",
    say: "Acute promyelocytic leukemia, a type of AML: t(15;17) fuses PML with RARA, and the PML::RARA protein impairs myeloid differentiation, so maturation stops at the promyelocyte. Abnormal promyelocytes predominate, their cytoplasm packed with large, dense granules, some holding bundles of Auer rods. The danger is a coagulopathy with DIC (bleeding gums, petechiae), which can cause early death.",
    ro: "APL · stops at 2" },
  atra: { name: "APL on ATRA plus arsenic", comp: "marrow", sub: "maturing again", pile: [1, 2, 2, 2, 2, 3], block: 1, ab: 1, lift: true, blabel: "retinoic acid: matures",
    note: ["", "All-trans retinoic acid lets them mature again.", "", "", "", ""],
    verdict: "Retinoic acid lets the promyelocytes mature",
    say: "APL treated with all-trans retinoic acid and arsenic trioxide (ATRA plus ATO), without conventional chemotherapy: the retinoic acid lets the blocked promyelocytes mature again, down the rest of the ladder. For low- and intermediate-risk APL it is highly effective and largely curative.",
    ro: "ATRA · maturing" },
  cml: { name: "Chronic myeloid leukemia", comp: "blood", sub: "every stage, few blasts", pile: [1, 1, 6, 3, 3, 7], block: -1, ab: -1,
    tag: ["under 20%", "", "peak", "", "", "peak"], tagc: "nl-tag-hot",
    note: ["In CML's chronic phase blasts stay under 20 percent of the blood and marrow.", "", "One of the two peaks in CML's blood.", "", "", "The other peak in CML's blood."],
    verdict: "Maturing cells fill the blood, not blasts",
    say: "Chronic myeloid leukemia, chronic phase: the cells still mature, so the blood fills with neutrophils at every stage of maturation, with peaks at the myelocytes and the segmented neutrophils, not blasts (fewer than 20 percent). The white count runs 12,000 to 1,000,000 per microliter, median about 80,000. Its cause is t(9;22), the Philadelphia chromosome, and its BCR::ABL1 kinase, which imatinib blocks.",
    ro: "CML · every stage" },
};
const INFO = [
  "Myeloblast (stage 1): the youngest cell, with a large nucleus (a high nuclear-to-cytoplasmic ratio), fine chromatin and distinct nucleoli. Acute leukemia is a disease of blasts.",
  "Promyelocyte (stage 2): its cytoplasm holds large granules. In acute promyelocytic leukemia, maturation stops here.",
  "Myelocyte (stage 3): the cell right after the promyelocyte, with a round nucleus.",
  "Metamyelocyte (stage 4): the nucleus begins to indent.",
  "Band (stage 5): the nucleus is a curved band, the last stage before the segmented neutrophil.",
  "Segmented neutrophil, or PMN (stage 6): the mature cell, its nucleus in lobes.",
];

export default function ladder() {
  /* relative diameters follow Rodak's: the promyelocyte the largest, the cells shrinking from the myelocyte on */
  const KIND = ["blast", "pro", "myelo", "meta", "band", "seg"], RAD = [22.5, 27, 21, 19.5, 17, 16];
  const CELL = {}, MINI = {};
  KIND.forEach((k, i) => { CELL[k] = cell(k, RAD[i], 11 + i * 7); MINI[k] = cell(k, 7.6, 101 + i * 13, true); });
  CELL.blastA = cell("blastA", RAD[0], 11); CELL.proA = cell("proA", RAD[1], 18);
  MINI.blastA = cell("blastA", 7.6, 101, true); MINI.proA = cell("proA", 7.6, 114, true);
  const Y = [72, 140, 208, 276, 344, 412];
  return makeFig({
    id: "ladder", lec: "lymleuk", fig: "Fig 20.1", short: "The neutrophil ladder", hint: "pick · hover",
    title: "The neutrophil ladder",
    caption: "The six stages of the neutrophil line, youngest at the top, and where the cells pile up in each disease. Pick a state to see where AML and APL stop and which stages fill CML's blood.",
    W: 440, H: Y[5] + 98,
    label: "The neutrophil line on a ladder: myeloblast, promyelocyte, myelocyte, metamyelocyte, band and segmented neutrophil, each drawn as a stained cell, with a row of small cells beside each stage showing how many there are in the blood or the marrow in the state picked.",
    D: { ST, INFO, KIND, CELL, MINI, Y, ANIM: true, INIT: { ds: "normal" },
      NAME: [["myeloblast"], ["promyelocyte"], ["myelocyte"], ["metamyelocyte"], ["band"], ["segmented", "neutrophil (PMN)"]],
      LOOK: ["fine chromatin", "large granules", "round nucleus", "indented nucleus", "band nucleus", "lobed nucleus"],
      LOOKA: ["an Auer rod", "Auer rod bundles", "", "", "", ""] },
    render: nlRender, say: nlSay, helpers: [nlBlock],
    controls: `<div class="am-controls" role="group" aria-label="State">` + [["normal", "Normal"], ["aml", "AML"], ["apl", "APL"], ["atra", "APL on ATRA"], ["cml", "CML"]].map((b) => `<button type="button" class="am-btn" data-amk="ds" data-amv="${b[0]}">${b[1]}</button>`).join("") + `</div>`,
    sources: [
      "From the L20 notes (Dr. Borak's slides): the order myeloblast, promyelocyte, myelocyte, metamyelocyte, band, segmented neutrophil (PMN); the blast as the youngest cell, with a high nuclear-to-cytoplasmic ratio, fine chromatin and distinct nucleoli; Auer rods in myeloblasts, red-blue needles that exclude ALL; most AML needing 20 percent blasts (his slide writes it \"greater than 20 percent\"; the WHO says 20 percent or more), except the AML types defined by a genetic abnormality; APL's abnormal promyelocytes with large, dense granules and bundles of Auer rods, t(15;17) and PML::RARA stopping maturation at the promyelocyte, DIC, and ATRA with arsenic trioxide letting them mature; CML's blood with neutrophils at every stage, peaks at the myelocytes and segmented neutrophils, fewer than 20 percent blasts, and its white count; no blasts in normal blood after the newborn period.",
      "Rodak's Hematology: Clinical Principles and Applications (Keohane, Otto and Walenga), the chapter on leukocyte development, and Bain's Blood Cells: A Practical Guide set how each stage is drawn: the relative sizes (the promyelocyte the largest, the cells shrinking from the myelocyte on), the blue cytoplasm of the early cells turning pink, the promyelocyte's eccentric nucleus with its pale area beside it, and the nucleus going from round to indented to a band to lobes. The lecture names stages 3 to 6 without describing them, so their one-line looks are only what their names mean. No size is labeled, since the lecture gives none.",
      "Schematic: the cells are drawn in code as on a stained smear, not traced from any image. The rows of small cells are not counts; they only say which stages are many or few, in the blood for normal and CML and in the marrow for AML and APL (where his numbers for those diseases are). The only number shown is his 20 percent. CD markers are left out, as his objectives say they aren't needed. Educational, not medical advice.",
    ],
    css: `
.anima[data-anima="ladder"] .am-svg{max-width:500px}
.anima .ladder-svg .nl-mem{stroke-width:.9}
.anima .ladder-svg .nl-cyb{fill:color-mix(in srgb,var(--bx-blue) 30%,var(--surface));stroke:var(--bx-blue)}
.anima .ladder-svg .nl-cyp{fill:color-mix(in srgb,var(--bx-blue-soft) 55%,var(--bx-cyto));stroke:color-mix(in srgb,var(--bx-blue) 60%,var(--bx-cyto-line))}
.anima .ladder-svg .nl-cym{fill:color-mix(in srgb,var(--bx-cyto) 72%,var(--bx-blue-soft));stroke:var(--bx-cyto-line)}
.anima .ladder-svg .nl-cyn{fill:color-mix(in srgb,var(--bx-cyto) 70%,var(--surface));stroke:var(--bx-cyto-line)}
.anima .ladder-svg .nl-nf{fill:color-mix(in srgb,var(--bx-nuc) 58%,var(--surface));stroke:var(--bx-nuc-line);stroke-width:.6}
.anima .ladder-svg .nl-nf2{fill:color-mix(in srgb,var(--bx-nuc) 72%,var(--surface))}
.anima .ladder-svg .nl-nd{fill:var(--bx-nuc);stroke:var(--bx-nuc-line);stroke-width:.6}
.anima .ladder-svg .nl-ch{fill:var(--bx-nuc-line);opacity:.5}
.anima .ladder-svg .nl-cl{fill:var(--bx-nuc-line);opacity:.45}
.anima .ladder-svg .nl-no{fill:color-mix(in srgb,var(--bx-nuc) 30%,var(--surface));stroke:var(--bx-nuc-line);stroke-width:.5}
.anima .ladder-svg .nl-hof{fill:color-mix(in srgb,var(--surface) 55%,var(--bx-blue-soft))}
.anima .ladder-svg .nl-gr{fill:var(--bx-memb);opacity:.8}
.anima .ladder-svg .nl-gra{fill:var(--bx-memb)}
.anima .ladder-svg .nl-gf{fill:color-mix(in srgb,var(--bx-memb) 40%,var(--bx-cyto))}
.anima .ladder-svg .nl-fil{fill:none;stroke:var(--bx-nuc);stroke-width:1}
.anima .ladder-svg .nl-auer{fill:none;stroke:color-mix(in srgb,var(--bx-blood) 55%,var(--bx-violet));stroke-width:1.5;stroke-linecap:round}
.anima .ladder-svg .nl-auer-m{stroke-width:.8}
.anima .ladder-svg .nl-rail{fill:none;stroke:var(--anatomy-lo);stroke-width:2}
.anima .ladder-svg .nl-arrow{fill:var(--anatomy-lo)}
.anima .ladder-svg .nl-flow{fill:var(--bx-cyto-line);stroke:var(--surface);stroke-width:.8}
.anima .ladder-svg .nl-badge{fill:var(--surface);stroke:var(--anatomy-mid);stroke-width:1.2}
.anima .ladder-svg .t.nl-bn{font-size:11px;font-weight:700;fill:var(--anatomy-strong);stroke:none}
.anima .ladder-svg .t.nl-nm{font-size:13.5px;font-weight:600;fill:var(--anatomy-strong)}
.anima .ladder-svg .t.nl-lk{font-size:12px;fill:var(--anatomy-text)}
.anima .ladder-svg .t.nl-lk-ab{fill:var(--bx-inhib);font-weight:600}
.anima .ladder-svg .t.nl-h{font-size:11px;font-weight:600;letter-spacing:.06em;fill:var(--anatomy-muted)}
.anima .ladder-svg .t.nl-hb{fill:var(--anatomy-strong)}
.anima .ladder-svg .t.nl-sub{font-size:12px;fill:var(--accent-ink,var(--anatomy-strong));font-weight:600}
.anima .ladder-svg .t.nl-tag{font-size:12px;fill:var(--anatomy-muted)}
.anima .ladder-svg .t.nl-tag-hot{fill:var(--bx-hot);font-weight:600}
.anima .ladder-svg .nl-none{fill:none;stroke:var(--anatomy-lo);stroke-width:1.2;stroke-linecap:round}
.anima .ladder-svg .nl-hit{fill:transparent}
.anima .ladder-svg .nl-blk{fill:none;stroke:var(--bx-inhib);stroke-width:1.6;stroke-dasharray:5 3}
.anima .ladder-svg .nl-stop{fill:none;stroke:var(--bx-inhib);stroke-width:3.2;stroke-linecap:round}
.anima .ladder-svg .nl-stop.nl-blk-off{stroke:var(--bx-stim)}
.anima .ladder-svg .nl-blk-off{stroke:var(--bx-stim);opacity:.8}
.anima .ladder-svg .t.nl-btag{font-size:12px;font-weight:700;fill:var(--bx-inhib)}
.anima .ladder-svg .t.nl-btag-off{fill:var(--bx-stim)}
.anima .ladder-svg .nl-ban{fill:var(--anatomy-shade-1);stroke:var(--anatomy-lo);stroke-width:1}
.anima .ladder-svg .nl-ban.is-on{stroke:var(--anatomy-lit);stroke-width:1.4}
.anima .ladder-svg .t.nl-v{font-size:12.5px;font-weight:600;fill:var(--anatomy-strong)}
@media (max-width:560px){.anima .ladder-svg .t.nl-nm{font-size:15px}.anima .ladder-svg .t.nl-lk,.anima .ladder-svg .t.nl-sub,.anima .ladder-svg .t.nl-tag,.anima .ladder-svg .t.nl-v{font-size:13.5px}.anima .ladder-svg .t.nl-btag{font-size:13px}.anima .ladder-svg .t.nl-h{font-size:12.5px}.anima .ladder-svg .t.nl-bn{font-size:12px}}
`,
  });
}
