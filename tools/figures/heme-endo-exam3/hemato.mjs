// Fig: where the blood cells come from (L19 Introduction to Hematology, Dr. Herr, from the slides). His hematopoiesis
// tree drawn anew as a left-to-right cartoon: one pluripotential stem cell in the bone marrow, the two multipotential stem
// cells (lymphoid and myeloid), their colony-forming cells, and the end cells in the blood, each with its share. The
// lymphoid line gives the B, T and NK cells (the T cells by way of the thymus); the myeloid line gives the red cells, the
// megakaryocytes and their platelets, the granulocytes and the monocytes. Next and Play step through the lines one at a
// time; By granules recolors the end cells as granulocytes and agranulocytes, so the monocyte shows up as the myeloid
// cell without prominent granules; Hide names turns it into a self-test. Every part explains itself on hover or tap.
// The end cells are wbc.mjs's schematic cell drawings, smaller, at relative size.
import { makeFig, f1, T, HOT } from "./shared.mjs";
import { cellArt, cellCss } from "./wbc.mjs";

const W = 460, H = 540;
/* columns: stem cell, multipotential stem cells, colony-forming cells, the marrow's last stop, the thymus, the blood */
const X = { stem: 40, multi: 100, cfc: 160, mid: 210, thy: 257, end: 304, lab: 331 };
/* end cells drawn at 2.4 units per micrometer (sizes from Junqueira and Ross, as in the wbc figure) */
const UM = 2.4;
const NODES = {
  stem: { x: X.stem, y: 262, r: 13, kind: "blast", seed: 4, line: "" },
  lymM: { x: X.multi, y: 118, r: 11, kind: "blast", seed: 8, line: "ly" },
  myeM: { x: X.multi, y: 334, r: 11, kind: "blast", seed: 12, line: "my" },
  lyC: { x: X.cfc, y: 118, r: 8.5, kind: "blast", seed: 15, line: "ly" },
  eC: { x: X.cfc, y: 214, r: 8.5, kind: "blast", seed: 21, line: "my" },
  mkC: { x: X.cfc, y: 262, r: 8.5, kind: "blast", seed: 25, line: "my" },
  gmC: { x: X.cfc, y: 392, r: 8.5, kind: "blast", seed: 29, line: "my" },
  mk: { x: X.mid, y: 262, r: 19, kind: "mk", seed: 31, line: "my" },
  thy: { x: X.thy, y: 118, r: 11, kind: "thy", line: "ly" },
  B: { x: X.end, y: 66, um: 7, kind: "lym", seed: 3, line: "ly", g: "ag", name: "B cell", sub: ["antibodies"] },
  T: { x: X.end, y: 118, um: 7, kind: "lym", seed: 6, line: "ly", g: "ag", name: "T cell", sub: ["via the thymus"] },
  NK: { x: X.end, y: 170, um: 10.5, kind: "nk", seed: 17, line: "ly", g: "ag", name: "NK cell", sub: ["large lymphocyte"] },
  rbc: { x: X.end, y: 214, um: 7.5, kind: "rbc", seed: 2, line: "my", g: "no", name: "red cells", sub: ["99% of cells"] },
  plt: { x: X.end, y: 262, r: 6.5, kind: "plt", seed: 5, line: "my", g: "no", name: "platelets", sub: ["start clotting"] },
  neu: { x: X.end, y: 316, um: 12, kind: "neu", seed: 11, line: "my", g: "gr", name: "neutrophil", sub: ["50 to 70%"] },
  eos: { x: X.end, y: 370, um: 13, kind: "eos", seed: 23, line: "my", g: "gr", name: "eosinophil", sub: ["1 to 4%"] },
  bas: { x: X.end, y: 420, um: 11.5, kind: "bas", seed: 5, line: "my", g: "gr", name: "basophil", sub: ["under 1%"] },
  mono: { x: X.end, y: 474, um: 16, kind: "mono", seed: 9, line: "my", g: "ag", name: "monocyte", sub: ["2 to 8%", "→ macrophage"] },
};
for (const k in NODES) { const n = NODES[k]; if (n.um) n.r = n.um * UM / 2; }
/* the ring drawn around each end cell and the two multipotential cells; the branches end on it */
for (const k in NODES) { const n = NODES[k]; if (n.g || k === "lymM" || k === "myeM") n.rr = (n.kind === "plt" ? 13 : n.r) + 4; }
const er = (n) => n.rr || n.r;
/* the branches, parent to child */
const EDGES = [["stem", "lymM"], ["stem", "myeM"], ["lymM", "lyC"], ["lyC", "B"], ["lyC", "thy"], ["thy", "T"], ["lyC", "NK"],
  ["myeM", "eC"], ["eC", "rbc"], ["myeM", "mkC"], ["mkC", "mk"], ["mk", "plt"], ["myeM", "gmC"], ["gmC", "neu"], ["gmC", "eos"], ["gmC", "bas"], ["gmC", "mono"]];
/* what each part says on hover or tap */
const INFO = {
  stem: "Pluripotential stem cell, in the bone marrow: it gives rise to the two multipotential stem cells, and so to every blood cell.",
  lymM: "Lymphoid multipotential stem cell: it makes the lymphocyte colony-forming cells, which become the B and T lymphocytes (and the NK cells).",
  myeM: "Myeloid multipotential stem cell: it makes the colony-forming cells for the erythrocytes, for the megakaryocytes, and for the granulocytes and monocytes.",
  lyC: "Lymphocyte colony-forming cells. In the marrow, the lymphoid line (CFU-Ly) splits into CFU-LyB, which gives the B cells, and CFU-LyT, which gives the T cells.",
  eC: "Colony-forming cell for the erythrocytes, on the myeloid line.",
  mkC: "Colony-forming cell for the megakaryocytes, on the myeloid line.",
  gmC: "Colony-forming cell for the granulocytes and monocytes: one myeloid progenitor for both, which is why the monocyte is a myeloid cell.",
  mk: "Megakaryocyte: a very large cell that stays in the bone marrow (drawn small here). Its fragments are the platelets.",
  thy: "The thymus. T cell precursors start in the marrow but leave it immunoincompetent, negative for CD4 and CD8, and mature here; they leave it CD4-positive or CD8-positive.",
  B: "B cell, a small lymphocyte of the lymphoid line. B cells form and mature in the bone marrow, carry IgM and IgD as receptors, and become antibody-making plasma cells: the humoral response. Lymphocytes are 30 to 40 percent of the white cells.",
  T: "T cell, a small lymphocyte of the lymphoid line. Its precursor leaves the marrow for the thymus to mature. T cells carry the cellular response: CD4 helper and CD8 cytotoxic T cells. Lymphocytes are 30 to 40 percent of the white cells.",
  NK: "NK cell, the large lymphocyte, of the lymphoid line. NK cells form and mature in the bone marrow, lack B and T cell markers, and kill virus-infected and tumor cells. They are not T cells. Lymphocytes are 30 to 40 percent of the white cells.",
  rbc: "Red cell (erythrocyte), myeloid line: about 99 percent of the cells in the blood. It carries oxygen and carbon dioxide. Not a white cell.",
  plt: "Platelets, myeloid line: fragments of megakaryocytes in the bone marrow. They initiate blood clotting. Not white cells.",
  neu: "Neutrophil, myeloid line, a granulocyte: 50 to 70 percent of the white cells, the most common. The main phagocyte of the blood and the first line of defense against bacteria.",
  eos: "Eosinophil, myeloid line, a granulocyte: 1 to 4 percent of the white cells. It destroys larger parasites and modulates allergic responses.",
  bas: "Basophil, myeloid line, a granulocyte: under 1 percent, the rarest white cell. Its granules hold heparin and histamine; it plays a prominent role in bronchial asthma.",
  mono: "Monocyte, myeloid line, but an agranulocyte: 2 to 8 percent of the white cells. It has no prominent granules, yet it comes from the same progenitor as the granulocytes. In the tissues it becomes a macrophage.",
};
/* the steps: which parts are lit, the summary and the readout */
const STEPS = [
  { on: null, ro: "2 lines · every blood cell",
    say: "One pluripotential stem cell in the bone marrow gives rise to every blood cell, through two multipotential stem cells: the lymphoid line (the lymphocytes: B, T and NK cells) and the myeloid line (red cells, megakaryocytes and their platelets, the granulocytes and the monocytes). In an adult, all of these cells come from the bone marrow. Press Next to follow each line." },
  { on: ["stem", "lymM", "myeM"], ro: "step 1 of 7 · two lines",
    say: "The pluripotential stem cell gives rise to two multipotential stem cells. The lymphoid one makes the lymphocyte colony-forming cells; the myeloid one makes the colony-forming cells for the erythrocytes, for the megakaryocytes, and for the granulocytes and monocytes." },
  { on: ["stem", "myeM", "eC", "rbc"], ro: "step 2 of 7 · red cells",
    say: "Myeloid line: the red cells, or erythrocytes. They are about 99 percent of the cells in the blood, and they carry oxygen and carbon dioxide." },
  { on: ["stem", "myeM", "mkC", "mk", "plt"], ro: "step 3 of 7 · platelets",
    say: "Myeloid line: the megakaryocytes stay in the bone marrow, and their fragments are the platelets, which initiate blood clotting." },
  { on: ["stem", "myeM", "gmC", "neu", "eos", "bas"], ro: "step 4 of 7 · granulocytes",
    say: "Myeloid line: the granulocytes, with prominent granules and a role in innate immunity. Neutrophils are 50 to 70 percent of the white cells, eosinophils 1 to 4 percent and basophils under 1 percent." },
  { on: ["stem", "myeM", "gmC", "mono"], ro: "step 5 of 7 · monocyte",
    say: "Myeloid line: the monocyte, 2 to 8 percent of the white cells. It has no prominent granules, so it is an agranulocyte, but it comes from the same myeloid progenitor as the granulocytes. In the tissues it becomes a macrophage." },
  { on: ["stem", "lymM", "lyC", "B", "NK"], ro: "step 6 of 7 · B and NK cells",
    say: "Lymphoid line: the lymphocyte colony-forming cells make the B cells and the NK cells, which both form and mature in the bone marrow. Lymphocytes are 30 to 40 percent of the white cells." },
  { on: ["stem", "lymM", "lyC", "thy", "T"], ro: "step 7 of 7 · T cells",
    say: "Lymphoid line: T cell precursors also start in the marrow, but they leave it immunoincompetent, negative for CD4 and CD8, and mature in the thymus. They leave it as CD4-positive or CD8-positive T cells." },
];

/* ---------- build-time drawing ---------- */
/* a branch from a parent's edge to a child's edge, a smooth S that leaves and arrives level */
function edgePath(a, b) {
  if (a.kind === "blast" && a.r > 12) {
    /* from the stem cell: leave from its top or bottom, arrive level */
    const sx = a.x, sy = a.y + (b.y < a.y ? -a.r : a.r), ex = b.x - er(b), ey = b.y;
    return "M" + f1(sx) + " " + f1(sy) + "C" + f1(sx) + " " + f1(sy + (ey - sy) * 0.8) + " " + f1(sx + (ex - sx) * 0.3) + " " + f1(ey) + " " + f1(ex) + " " + f1(ey);
  }
  const x1 = a.x + er(a), y1 = a.y, x2 = b.x - er(b), y2 = b.y, dx = (x2 - x1) * 0.5;
  return "M" + f1(x1) + " " + f1(y1) + "C" + f1(x1 + dx) + " " + f1(y1) + " " + f1(x2 - dx) + " " + f1(y2) + " " + f1(x2) + " " + f1(y2);
}
function thymusArt(n) {
  /* a small bilobed organ: two lobes side by side, each a cortex around a paler medulla */
  const x = n.x, y = n.y, r = n.r;
  const lobe = (cx, rot) => '<ellipse cx="' + f1(cx) + '" cy="' + f1(y + 1) + '" rx="' + f1(r * 0.52) + '" ry="' + f1(r * 0.92) + '" transform="rotate(' + rot + " " + f1(cx) + " " + f1(y) + ')"/>';
  const med = (cx, rot) => '<ellipse cx="' + f1(cx) + '" cy="' + f1(y + 2) + '" rx="' + f1(r * 0.24) + '" ry="' + f1(r * 0.5) + '" transform="rotate(' + rot + " " + f1(cx) + " " + f1(y) + ')"/>';
  return '<g class="hm-thy">' + lobe(x - r * 0.42, -12) + lobe(x + r * 0.42, 12) + "</g>" + '<g class="hm-thym">' + med(x - r * 0.42, -12) + med(x + r * 0.42, 12) + "</g>";
}
function hmArt() {
  const A = {};
  for (const id in NODES) {
    const n = NODES[id];
    if (n.kind === "thy") { A[id] = thymusArt(n); continue; }
    const a = cellArt(n.kind, n.x, n.y, n.r, "hm-", n.seed || 1);
    A[id] = a.cyto + a.gran + a.nuc + a.top;
  }
  A.E = {}; EDGES.forEach((e) => { A.E[e[0] + ">" + e[1]] = edgePath(NODES[e[0]], NODES[e[1]]); });
  return A;
}

/* ---------- page helpers (serialized into the page) ---------- */
function hmRender(st, D) {
  var S = D.STEPS[st.s], on = S.on, hide = !!st.hide, gran = st.by === "gran", o = "";
  function lit(id) { return !on || on.indexOf(id) >= 0; }
  /* the two places: the bone marrow, and the blood */
  o += HOT("The bone marrow: in an adult, every blood cell comes from here, the T cell precursors included.", '<rect class="hm-marrow" x="6" y="30" width="232" height="' + (D.H - 66) + '" rx="12"/>');
  o += HOT("The blood: the end cells circulate here. The lymphocytes go on to the lymphoid organs, and the monocytes into the tissues, where they become macrophages.", '<rect class="hm-blood" x="276" y="30" width="' + (D.W - 282) + '" height="' + (D.H - 66) + '" rx="12"/>');
  o += T(16, 22, "BONE MARROW", "hm-h", "start") + T(284, 22, "IN THE BLOOD", "hm-h", "start");
  /* the branches */
  D.EDGES.forEach(function (e) {
    var a = D.NODES[e[0]], b = D.NODES[e[1]], ln = b.line || a.line, cls = "hm-edge " + (gran ? "hm-eg" : ln === "ly" ? "hm-ely" : "hm-emy") + (lit(e[0]) && lit(e[1]) ? (on ? " is-on" : "") : " is-off");
    o += '<path class="' + cls + '" d="' + D.ART.E[e[0] + ">" + e[1]] + '"/>';
  });
  /* the cells */
  Object.keys(D.NODES).forEach(function (id) {
    var n = D.NODES[id], ring = "", off = !lit(id);
    if (n.g) {
      var rc = gran ? (n.g === "gr" ? "hm-rgr" : n.g === "ag" ? "hm-rag" : "hm-rno") : (n.line === "ly" ? "hm-rly" : "hm-rmy");
      ring = '<circle class="hm-ring ' + rc + '" cx="' + n.x + '" cy="' + n.y + '" r="' + f1(n.rr) + '"/>';
    } else if (id === "lymM" || id === "myeM") ring = '<circle class="hm-ring ' + (gran ? "hm-rn" : id === "lymM" ? "hm-rly" : "hm-rmy") + '" cx="' + n.x + '" cy="' + n.y + '" r="' + f1(n.rr) + '"/>';
    o += '<g class="hm-node' + (off ? " is-off" : "") + '">' + HOT(D.INFO[id], ring + D.ART[id]) + "</g>";
  });
  /* labels in the marrow */
  function lab(id, s) { return '<g class="hm-lab' + (lit(id) ? "" : " is-off") + '">' + s + "</g>"; }
  o += lab("stem", T(58, 254, hide ? "?" : "pluripotential", "hm-s", "start") + (hide ? "" : T(58, 267, "stem cell", "hm-s", "start")));
  o += lab("lymM", T(100, 86, hide ? "?" : "lymphoid", "hm-s b", "middle") + (hide ? "" : T(100, 99, "multipotential", "hm-s", "middle")));
  o += lab("myeM", T(108, 364, hide ? "?" : "myeloid", "hm-s b", "end") + (hide ? "" : T(108, 377, "multipotential", "hm-s", "end")));
  o += lab("mk", T(232, 237, hide ? "?" : "megakaryocyte", "hm-s", "end"));
  o += lab("thy", T(257, 146, hide ? "?" : "thymus", "hm-s", "middle"));
  o += lab(lit("lyC") || lit("eC") || lit("mkC") || lit("gmC") ? "stem" : "gmC", '<path class="lead" d="M121 438L155 400"/><circle class="dot" cx="155" cy="400" r="1.8"/>' + T(118, 444, hide ? "?" : "colony-forming", "hm-s", "end") + (hide ? "" : T(118, 457, "cells", "hm-s", "end")));
  /* the end cells' names and shares */
  var lyOn = lit("B") || lit("T") || lit("NK");
  o += '<g class="hm-lab' + (lyOn ? "" : " is-off") + '">' + T(284, 46, hide ? "lymphocytes · ?" : "lymphocytes · 30 to 40%", "hm-grp", "start") + "</g>";
  Object.keys(D.NODES).forEach(function (id) {
    var n = D.NODES[id]; if (!n.name) return;
    var sub = n.sub.slice();
    if (gran && n.g) sub = [n.g === "gr" ? "granulocyte" : n.g === "ag" ? "agranulocyte" : "not a white cell"].concat(id === "mono" ? ["but myeloid"] : []);
    var y0 = n.y - (sub.length > 1 ? 9 : 2), s = T(D.X.lab, y0, hide ? "?" : n.name, "hm-name", "start");
    if (!hide) sub.forEach(function (ln, i) { s += T(D.X.lab, y0 + 14 + i * 13.5, ln, "hm-sub" + (gran && n.g ? " hm-t" + n.g : ""), "start"); });
    o += lab(id, s);
  });
  /* the key */
  var ky = D.H - 14;
  if (gran) o += '<circle class="hm-ring hm-rgr" cx="14" cy="' + (ky - 4) + '" r="5"/>' + T(24, ky, "granulocyte", "hm-k", "start") + '<circle class="hm-ring hm-rag" cx="118" cy="' + (ky - 4) + '" r="5"/>' + T(128, ky, "agranulocyte", "hm-k", "start") + '<circle class="hm-ring hm-rno" cx="230" cy="' + (ky - 4) + '" r="5"/>' + T(240, ky, "not a white cell", "hm-k", "start");
  else o += '<path class="hm-edge hm-ely" d="M8 ' + (ky - 4) + 'H26"/>' + T(32, ky, "lymphoid line", "hm-k", "start") + '<path class="hm-edge hm-emy" d="M140 ' + (ky - 4) + 'H158"/>' + T(164, ky, "myeloid line", "hm-k", "start");
  return o;
}
function hmSay(st, D) {
  var S = D.STEPS[st.s], s = S.say;
  if (st.s === 0 && st.by === "gran") s = "By granules: the granulocytes (neutrophils, eosinophils, basophils) have prominent granules; the agranulocytes (monocytes and lymphocytes) lack them. The two groupings don't match the two lines: the monocyte is an agranulocyte from the myeloid line. Red cells and platelets aren't white cells.";
  if (st.hide && st.s === 0) s = "Names hidden: name each cell, its line and its share, then hover or tap it to check. Press Next to follow each line.";
  return [s, S.ro + (st.hide ? " · names hidden" : "")];
}

export default function hemato() {
  const D = { INIT: { s: 0, by: "line", hide: false }, STEPKEY: "s", STEPMAX: STEPS.length - 1, PLAYMS: 3200, NODES, EDGES, INFO, STEPS, X, W, H, ART: hmArt() };
  return makeFig({
    id: "hemato", lec: "hemeintro", fig: "Fig 13", short: "Where blood cells come from", hint: "step · hover",
    title: "Where the blood cells come from",
    caption: "One stem cell in the bone marrow, two lines, and every blood cell, with each white cell's share of the white count. Press Next to follow each line, By granules to see where the monocyte fits, or Hide names to test yourself.",
    W, H,
    label: "Hematopoiesis as a tree, left to right. In the bone marrow, one pluripotential stem cell gives two multipotential stem cells. The lymphoid one makes the lymphocyte colony-forming cells, which give the B cells, the NK cells and, by way of the thymus, the T cells: the lymphocytes, 30 to 40 percent of the white cells. The myeloid one makes colony-forming cells for the red cells (about 99 percent of the blood's cells), for the megakaryocytes, which shed the platelets, and for the granulocytes and monocytes: neutrophils 50 to 70 percent, eosinophils 1 to 4, basophils under 1, monocytes 2 to 8.",
    D, render: hmRender, say: hmSay,
    controls: `<div class="am-controls"><button type="button" class="am-btn" data-amstep="-1">Back</button><button type="button" class="am-btn" data-amstep="1">Next</button><button type="button" class="am-btn" data-amplay aria-pressed="false">Play</button></div>
<div class="am-controls" role="group" aria-label="Color the cells by"><button type="button" class="am-btn" data-amk="by" data-amv="line">By line</button><button type="button" class="am-btn" data-amk="by" data-amv="gran">By granules</button><button type="button" class="am-btn" data-amt="hide" aria-pressed="false">Hide names</button></div>`,
    sources: [
      "From the L19 notes (Dr. Herr's slides and their speaker notes): one pluripotential stem cell giving two multipotential stem cells; the lymphoid one making the lymphocyte colony-forming cells, which become the B and T lymphocytes (CFU-Ly splitting into CFU-LyB and CFU-LyT in the marrow); the myeloid one making the colony-forming cells for the erythrocytes, for the megakaryocytes (which develop into the platelets) and for the granulocytes and monocytes; every blood cell coming from the bone marrow in an adult; B and NK cells forming and maturing in the marrow, and T cell precursors leaving it immunoincompetent (CD4 and CD8 negative) to mature in the thymus; each cell's share and one-line job; the monocyte becoming a macrophage in the tissues.",
      "NK cells are drawn on the lymphoid line, as the large lymphocyte. The notes list them with the lymphocytes and have them form and mature in the bone marrow; standard immunology texts derive them from the common lymphoid progenitor (Abbas AK, Lichtman AH and Pillai S, Cellular and Molecular Immunology; Murphy K and Weaver C, Janeway's Immunobiology). His slide 4 calls NK cells \"Killer T cells\"; they are not T cells (his slide 13: no B or T cell markers), so they get their own branch, not the T cell's.",
      "The order of the branches and which progenitor feeds which line follow the standard hematopoiesis diagram (Mescher AL, Junqueira's Basic Histology, hemopoiesis; Ross MH and Pawlina W, Histology: A Text and Atlas, blood cell formation), drawn with only the stages the lecture names: the intermediate precursors (blasts, the erythroid and granulocyte series) are left out. The end cells are drawn at relative size, 2.4 drawing units per micrometer, from those texts' sizes; only the lecture's numbers are labeled.",
      "Schematic: the megakaryocyte is drawn far smaller than it is, the thymus is an icon, and the cells are flat cartoons, not micrographs. Educational, not medical advice.",
    ],
    css: `
.anima[data-anima="hemato"] .am-svg{max-width:520px}
.anima .hemato-svg .hm-marrow{fill:color-mix(in srgb,var(--bx-cyto) 22%,var(--surface));stroke:var(--bx-cyto-line);stroke-width:1;stroke-opacity:.55}
.anima .hemato-svg .hm-blood{fill:color-mix(in srgb,var(--bx-blood-soft) 55%,var(--surface));stroke:var(--bx-blood);stroke-width:1;stroke-opacity:.45}
.anima .hemato-svg .t.hm-h{font-size:11px;font-weight:600;letter-spacing:.07em;fill:var(--anatomy-muted)}
.anima .hemato-svg .t.hm-s{font-size:11.5px}
.anima .hemato-svg .t.hm-grp{font-size:12px;font-weight:600;fill:var(--anatomy-strong)}
.anima .hemato-svg .t.hm-name{font-size:12.5px;font-weight:600;fill:var(--anatomy-strong)}
.anima .hemato-svg .t.hm-sub{font-size:11.5px}
.anima .hemato-svg .t.hm-tgr{fill:color-mix(in srgb,var(--bx-gold) 60%,var(--anatomy-strong));font-weight:600}
.anima .hemato-svg .t.hm-tag{fill:var(--bx-ins);font-weight:600}
.anima .hemato-svg .t.hm-tno{fill:var(--anatomy-muted)}
.anima .hemato-svg .t.hm-k{font-size:11.5px}
.anima .hemato-svg .hm-edge{fill:none;stroke-width:2.2;stroke-linecap:round}
.anima .hemato-svg .hm-ely{stroke:var(--bx-blue)}
.anima .hemato-svg .hm-emy{stroke:var(--bx-memb)}
.anima .hemato-svg .hm-eg{stroke:var(--anatomy-lo)}
.anima .hemato-svg .hm-edge.is-on{stroke-width:3.4}
.anima .hemato-svg .hm-edge.is-off,.anima .hemato-svg .hm-node.is-off,.anima .hemato-svg .hm-lab.is-off{opacity:.22}
.anima .hemato-svg .hm-ring{fill:var(--surface);stroke-width:2}
.anima .hemato-svg .hm-rly{stroke:var(--bx-blue)}
.anima .hemato-svg .hm-rmy{stroke:var(--bx-memb)}
.anima .hemato-svg .hm-rgr{stroke:var(--bx-gold);stroke-width:2.6}
.anima .hemato-svg .hm-rag{stroke:var(--bx-ins);stroke-width:2.6}
.anima .hemato-svg .hm-rn{stroke:var(--anatomy-lo)}
.anima .hemato-svg .hm-rno{stroke:var(--anatomy-lo);stroke-dasharray:3 2.5}
.anima .hemato-svg .hm-thy{fill:color-mix(in srgb,var(--bx-nuc) 55%,var(--bx-cyto));stroke:var(--bx-nuc-line);stroke-width:.9}
.anima .hemato-svg .hm-thym{fill:var(--bx-cyto)}
@media (max-width:560px){.anima .hemato-svg .t.hm-h{font-size:12px}.anima .hemato-svg .t.hm-s,.anima .hemato-svg .t.hm-sub,.anima .hemato-svg .t.hm-k{font-size:12.5px}.anima .hemato-svg .t.hm-name{font-size:13.5px}.anima .hemato-svg .t.hm-grp{font-size:13px}}
${cellCss("hemato-svg", "hm-")}`,
  });
}
