// Fig 25: Hodgkin versus non-Hodgkin, and staging (L20 Lymphomas and Leukemias, Dr. Borak, from the recorded lecture
// and slides). A schematic body outline with its node groups (neck, above the collarbone, armpits, chest, abdomen,
// pelvis, groin), the diaphragm, the liver, stomach and spleen, and the pelvic bones for the marrow. Pick Hodgkin to see
// it start in the chest and climb node to node; pick non-Hodgkin to see nodes lit above and below the diaphragm with the
// one between them not enlarged, and a site outside the nodes. Step through stages 1 to 4 to see what each adds. The panel
// beside the body sets his side-by-side (when found, where it starts, spread, outside the nodes, the blood, the cells),
// or lists the four stages with the one picked lit. No CD markers (he said they aren't needed).
import { makeFig, f1, T, HOT } from "./shared.mjs";

const W = 440, H = 478;
/* node groups: [key, x, y, hover name] */
const NODES = [
  ["cervL", 99, 64, "Nodes in the neck (cervical)"], ["cervR", 141, 64, "Nodes in the neck (cervical)"],
  ["supL", 88, 104, "Nodes above the collarbone (supraclavicular)"], ["supR", 152, 104, "Nodes above the collarbone (supraclavicular)"],
  ["axL", 60, 128, "Nodes in the armpit (axillary)"], ["axR", 180, 128, "Nodes in the armpit (axillary)"],
  ["medi", 120, 150, "Nodes in the chest (mediastinal): central nodes, which you can't see or feel"],
  ["para", 120, 262, "Nodes in the abdomen, along the aorta: central nodes, below the diaphragm"],
  ["ilL", 98, 320, "Nodes in the pelvis (iliac)"], ["ilR", 142, 320, "Nodes in the pelvis (iliac)"],
  ["ingL", 84, 352, "Nodes in the groin (inguinal)"], ["ingR", 156, 352, "Nodes in the groin (inguinal)"],
];
const BODY = "M110 62V86Q107 94 92 96L58 102Q44 106 44 122L50 240Q54 262 60 290L56 330Q56 368 74 380L166 380Q184 368 184 330L180 290Q186 262 190 240L196 122Q196 106 182 102L148 96Q133 94 130 86V62Z";
const BONES = "M62 298Q80 282 108 292L105 305Q83 297 66 309ZM178 298Q160 282 132 292L135 305Q157 297 174 309Z";

/* the six states: which nodes are involved, which organs, and what the panel says */
const ST = {
  hl: { kind: "type", name: "Hodgkin lymphoma", verdict: "Localized, node to node, never the blood", ro: "Hodgkin",
    on: ["medi", "supL", "cervL"], org: [], chain: ["medi", "supL", "cervL"], note: ["medi", "starts in the chest", 176],
    say: "Hodgkin lymphoma, as he described it: usually localized when it is found, it begins in the central nodes you can't see, in the chest, and spreads contiguously, from one node to the node next to it, here up from the chest to above the collarbone and the neck. Disease outside the nodes is uncommon, the peripheral blood is never involved, and the tumor cells are a few scattered, very abnormal, bizarre cells, which can make the diagnosis tricky. It is treated with ABVD." },
  nhl: { kind: "type", name: "Non-Hodgkin lymphoma", verdict: "Widespread, skips nodes, outside the nodes", ro: "non-Hodgkin",
    on: ["cervR", "axL", "para", "ingR"], org: ["stom"], chain: [], note: ["medi", "not enlarged", 176],
    say: "Non-Hodgkin lymphoma: usually widespread when it is found, in the peripheral nodes, and it may spread non-contiguously: an enlarged node above the diaphragm and one below it, with the node between them not enlarged. Disease outside the nodes, such as the stomach here, is much more common, the blood can be involved, and the cells look very much like normal lymphocytes, so the tests are put together to make the diagnosis. It is often treated with CHOP." },
  s1: { kind: "stage", n: 1, name: "Stage 1", verdict: "One node region", ro: "stage 1",
    on: ["cervL"], org: [], chain: [],
    say: "Staging asks whether one site or several are involved, above or below the diaphragm or on both sides, whether there are sites outside the nodes or the lymphatic system, or whether the disease is disseminated. Stage 1 on the standard chart: one node region, here the neck." },
  s2: { kind: "stage", n: 2, name: "Stage 2", verdict: "Two regions, one side of the diaphragm", ro: "stage 2",
    on: ["cervL", "medi"], org: [], chain: [],
    say: "Stage 2 on the standard chart: two or more node regions on the same side of the diaphragm, here the neck and the chest, both above it." },
  s3: { kind: "stage", n: 3, name: "Stage 3", verdict: "Nodes on both sides of the diaphragm", ro: "stage 3",
    on: ["cervL", "medi", "para", "ingR"], org: [], chain: [],
    say: "Stage 3 on the standard chart: nodes on both sides of the diaphragm, here the neck and the chest above it, and the abdomen and the groin below it." },
  s4: { kind: "stage", n: 4, name: "Stage 4, the most aggressive", verdict: "Disseminated: the marrow, the liver", ro: "stage 4",
    on: ["cervL", "medi", "para", "ingR"], org: ["liver", "bone"], chain: [],
    say: "Stage 4: disseminated disease, in organs outside the lymphatic system, such as the bone marrow or the liver. He said that disseminated disease is the stage 4 disease, and the most aggressive. A letter B after any stage means the patient has B symptoms; A means none." },
};
/* the side-by-side, his words: [label, Hodgkin lines, non-Hodgkin lines] */
const ROWS = [
  ["when found", ["usually localized"], ["usually widespread"]],
  ["where it starts", ["central nodes,", "in the chest"], ["peripheral nodes"]],
  ["spread", ["contiguous: one", "node to the next"], ["can skip a", "node group"]],
  ["outside the nodes", ["uncommon"], ["much more common"]],
  ["the blood", ["never involved"], ["can be involved"]],
  ["the tumor cells", ["a few large,", "bizarre cells"], ["look like normal", "lymphocytes"]],
];
const STAGES = [
  [1, ["one node region"]],
  [2, ["two or more regions,", "same side of the", "diaphragm"]],
  [3, ["both sides of", "the diaphragm"]],
  [4, ["disseminated:", "outside the lymph", "system (marrow, liver)"]],
];
const ORG = {
  liver: { info: "The liver, an organ outside the lymphatic system: lymphoma in it means disseminated disease, stage 4." },
  stom: { info: "The stomach, a site outside the nodes: non-Hodgkin lymphomas start outside the nodes much more often than Hodgkin lymphoma (marginal zone lymphoma with H. pylori, for one)." },
  spleen: { info: "The spleen: lymphoid tissue, where a lymphoma can arise too." },
  bone: { info: "The pelvic bones and their marrow: lymphoma in the marrow means disseminated disease, stage 4. The marrow is where the leukemias start." },
};

/* ---------- page helpers (serialized into the page) ---------- */
function yaArrow(a, b, ra, rb) {
  var dx = b[0] - a[0], dy = b[1] - a[1], L = Math.sqrt(dx * dx + dy * dy), ux = dx / L, uy = dy / L;
  var x1 = a[0] + ux * (ra + 3), y1 = a[1] + uy * (ra + 3), x2 = b[0] - ux * (rb + 4), y2 = b[1] - uy * (rb + 4), px = -uy, py = ux;
  return '<path class="ya-chain" d="M' + f1(x1) + " " + f1(y1) + "L" + f1(x2 - ux * 5) + " " + f1(y2 - uy * 5) + '"/><path class="ya-arw" d="M' + f1(x2) + " " + f1(y2) + "L" + f1(x2 - ux * 7 + px * 4) + " " + f1(y2 - uy * 7 + py * 4) + "L" + f1(x2 - ux * 7 - px * 4) + " " + f1(y2 - uy * 7 - py * 4) + 'Z"/>';
}
function yaRender(st, D) {
  var S = D.ST[st.v], o = "", i, k, y, on = {}, og = {};
  S.on.forEach(function (n) { on[n] = 1; }); S.org.forEach(function (n) { og[n] = 1; });
  /* the body, the diaphragm, the organs, the pelvic bones */
  o += HOT("A body outline, front view, schematic. The dashed line is the diaphragm: staging asks whether the involved nodes are above it, below it, or on both sides.",
    '<path class="ya-body" d="' + D.BODY + '"/><ellipse class="ya-body" cx="120" cy="44" rx="20" ry="24"/>');
  o += '<path class="ya-dia" d="M48 214Q120 188 192 214"/>';
  o += HOT(D.ORG.liver.info, '<ellipse class="ya-org' + (og.liver ? " is-on" : "") + '" cx="86" cy="240" rx="28" ry="13"/>' + (og.liver ? T(86, 244, "liver", "ya-ol", "middle") : ""));
  o += HOT(D.ORG.stom.info, '<ellipse class="ya-org' + (og.stom ? " is-on" : "") + '" cx="147" cy="236" rx="14" ry="9"/>' + (og.stom ? T(147, 224, "stomach", "ya-ol", "middle") : ""));
  o += HOT(D.ORG.spleen.info, '<ellipse class="ya-org ya-spl" cx="175" cy="252" rx="8" ry="12"/>');
  o += HOT(D.ORG.bone.info, '<path class="ya-bone' + (og.bone ? " is-on" : "") + '" d="' + D.BONES + '"/>' + (og.bone ? T(120, 286, "marrow", "ya-ol", "middle") : ""));
  /* Hodgkin's climb, node to node */
  for (i = 0; i + 1 < S.chain.length; i++) o += yaArrow(D.XY[S.chain[i]], D.XY[S.chain[i + 1]], 9, 9);
  /* the node groups */
  D.NODES.forEach(function (n) {
    var lit = on[n[0]];
    o += HOT(n[3] + (lit ? ": involved here." : "."), '<circle class="ya-node' + (lit ? " is-on" : "") + '" cx="' + n[1] + '" cy="' + n[2] + '" r="' + (lit ? 9 : 5.5) + '"/>');
  });
  if (S.note) o += T(D.XY[S.note[0]][0], S.note[2], S.note[1], "ya-note", "middle");
  /* the legend under the body */
  o += '<path class="ya-dia" d="M10 403H32"/>' + T(38, 407, "diaphragm", "ya-leg", "start") +
    '<circle class="ya-node is-on" cx="132" cy="403" r="6"/>' + T(144, 407, "involved", "ya-leg", "start");
  /* the panel */
  var x = 244;
  if (S.kind === "type") {
    var hl = st.v === "hl";
    o += T(x, 30, hl ? "HODGKIN" : "NON-HODGKIN", "ya-h", "start") + T(x, 47, hl ? "(versus non-Hodgkin)" : "(versus Hodgkin)", "ya-lab", "start");
    y = 74;
    D.ROWS.forEach(function (r) {
      var lines = hl ? r[1] : r[2], other = hl ? r[2] : r[1];
      var g = T(x, y, r[0], "ya-lab", "start");
      for (k = 0; k < lines.length; k++) g += T(x, y + 17 + k * 17, lines[k], "ya-val", "start");
      o += HOT((hl ? "Hodgkin" : "Non-Hodgkin") + ", " + r[0] + ": " + lines.join(" ") + ". The other one: " + other.join(" ") + ".", g);
      y += 17 + lines.length * 17 + 11;
    });
  } else {
    o += T(x, 30, "STAGING", "ya-h", "start") + T(x, 47, "how far it has spread", "ya-lab", "start");
    y = 76;
    D.STAGES.forEach(function (s) {
      var cur = s[0] === S.n, g = '<circle class="ya-sb' + (cur ? " is-on" : "") + '" cx="' + (x + 9) + '" cy="' + (y - 5) + '" r="10"/>' + T(x + 9, y, String(s[0]), "ya-sn" + (cur ? " is-on" : ""), "middle");
      for (k = 0; k < s[1].length; k++) g += T(x + 26, y + k * 17, s[1][k], "ya-sv" + (cur ? " is-on" : ""), "start");
      o += HOT("Stage " + s[0] + ": " + s[1].join(" ") + "." + (s[0] === 4 ? " He called it the most aggressive." : " (The standard Ann Arbor chart; he named the criteria and stage 4.)"), g);
      y += s[1].length * 17 + 18;
    });
    o += T(x, y + 6, "B after the stage:", "ya-lab", "start") + T(x, y + 23, "B symptoms", "ya-sv is-on", "start");
  }
  /* the verdict */
  o += '<rect class="ya-ban" x="6" y="420" width="428" height="50" rx="10"/>' + T(18, 439, S.name.toUpperCase(), "ya-bt", "start") + T(18, 459, S.verdict, "ya-bv", "start");
  return o;
}
function yaSay(st, D) { var S = D.ST[st.v]; return [S.say, S.ro]; }

export default function nodespread() {
  const XY = {}; NODES.forEach((n) => { XY[n[0]] = [n[1], n[2]]; });
  const btn = (v, s) => `<button type="button" class="am-btn" data-amk="v" data-amv="${v}">${s}</button>`;
  return makeFig({
    id: "nodespread", lec: "lymleuk", fig: "Fig 25", short: "How lymphoma spreads", hint: "pick · hover",
    title: "How lymphoma spreads",
    caption: "Hodgkin versus non-Hodgkin lymphoma on a body map, and the four stages. Pick Hodgkin or non-Hodgkin to see how each spreads, or step through the stages.",
    W, H,
    label: "A schematic body outline with its lymph node groups, the diaphragm, the liver, stomach, spleen and pelvic bones. Hodgkin lymphoma lights the chest nodes and climbs node to node to the neck; non-Hodgkin lymphoma lights scattered nodes above and below the diaphragm, skipping the chest, and the stomach. The stages light one region, two above the diaphragm, both sides, then the liver and marrow. A panel beside the body compares the two lymphomas or lists the stages.",
    D: { ST, ROWS, STAGES, ORG, NODES, XY, BODY, BONES, ANIM: false, INIT: { v: "hl" } },
    render: yaRender, say: yaSay, helpers: [yaArrow],
    controls: `<div class="am-controls" role="group" aria-label="Lymphoma">${btn("hl", "Hodgkin")}${btn("nhl", "Non-Hodgkin")}</div>` +
      `<div class="am-controls" role="group" aria-label="Stage">${btn("s1", "Stage 1")}${btn("s2", "Stage 2")}${btn("s3", "Stage 3")}${btn("s4", "Stage 4")}</div>`,
    sources: [
      "From the L20 notes (Dr. Borak's recorded lecture and slides): his side-by-side of Hodgkin and non-Hodgkin lymphoma (Hodgkin usually localized, beginning in central nodes you can't see, in the chest, by the heart, in the lungs or possibly the abdomen, spreading contiguously from one node to the next, uncommonly outside the nodes, never in the peripheral blood, with a few scattered, bizarre tumor cells, treated with ABVD; non-Hodgkin usually widespread, in the peripheral nodes, possibly non-contiguous, with an enlarged node above the diaphragm and one below and the node between them not enlarged, much more often outside the nodes, able to involve the blood, with cells that look like normal lymphocytes, often treated with CHOP), and the criteria he gave for staging: one site or several, above or below the diaphragm or on both sides, extranodal or extralymphatic sites, and disseminated disease as stage 4, \"the most aggressive\".",
      "Stages 1 to 3 follow the standard Ann Arbor chart (Robbins and Cotran Pathologic Basis of Disease; Carbone et al., Cancer Research, 1971), since his slide shows the chart only as a picture: one node region; two or more on the same side of the diaphragm; both sides; disseminated involvement of organs outside the lymphatic system, with A or B for B symptoms. His slide on classic Hodgkin lymphoma adds that early-stage disease most often shows in the cervical or supraclavicular nodes (more than 70 percent) and the mediastinum (more than 60 percent); both put it above the diaphragm, and the drawing starts it in the chest, as he said aloud.",
      "Schematic and not to scale: a body outline drawn in code, with the node groups as circles (named only on hover), the liver, stomach and spleen, and the pelvic bones for the marrow. Which nodes light up in each state is an example, not one patient, and the drug names behind ABVD and CHOP are left out, as he didn't go through them. Educational, not medical advice.",
    ],
    css: `
.anima[data-anima="nodespread"] .am-svg{max-width:540px}
.anima .nodespread-svg .ya-body{fill:var(--anatomy-shade-2);stroke:var(--anatomy-mid);stroke-width:1.2}
.anima .nodespread-svg .ya-dia{fill:none;stroke:var(--anatomy-mid);stroke-width:1.6;stroke-dasharray:5 4}
.anima .nodespread-svg .ya-org{fill:color-mix(in srgb,var(--bx-eosin) 30%,var(--surface));stroke:var(--anatomy-lo);stroke-width:1}
.anima .nodespread-svg .ya-org.is-on{fill:color-mix(in srgb,var(--bx-hot) 32%,var(--surface));stroke:var(--bx-hot);stroke-width:1.6}
.anima .nodespread-svg .ya-spl{fill:color-mix(in srgb,var(--bx-violet) 18%,var(--surface))}
.anima .nodespread-svg .ya-bone{fill:var(--bx-fat);stroke:var(--anatomy-lo);stroke-width:1}
.anima .nodespread-svg .ya-bone.is-on{fill:color-mix(in srgb,var(--bx-hot) 32%,var(--surface));stroke:var(--bx-hot);stroke-width:1.6}
.anima .nodespread-svg .ya-node{fill:var(--surface);stroke:var(--anatomy-mid);stroke-width:1.2}
.anima .nodespread-svg .ya-node.is-on{fill:var(--bx-violet);stroke:var(--bx-nuc-line);stroke-width:1.4}
.anima .nodespread-svg .ya-chain{fill:none;stroke:var(--bx-hot);stroke-width:2.2;stroke-linecap:round}
.anima .nodespread-svg .ya-arw{fill:var(--bx-hot)}
.anima .nodespread-svg .t.ya-note{font-size:12px;font-weight:600;fill:var(--bx-hot)}
.anima .nodespread-svg .t.ya-ol{font-size:12px;font-weight:600;fill:var(--anatomy-strong)}
.anima .nodespread-svg .t.ya-leg{font-size:12px;fill:var(--anatomy-muted)}
.anima .nodespread-svg .t.ya-h{font-size:12px;font-weight:600;letter-spacing:.06em;fill:var(--anatomy-strong)}
.anima .nodespread-svg .t.ya-lab{font-size:12px;fill:var(--anatomy-muted)}
.anima .nodespread-svg .t.ya-val{font-size:13.5px;font-weight:600;fill:var(--anatomy-strong)}
.anima .nodespread-svg .ya-sb{fill:var(--surface);stroke:var(--anatomy-lo);stroke-width:1.2}
.anima .nodespread-svg .ya-sb.is-on{fill:var(--bx-violet);stroke:var(--bx-nuc-line)}
.anima .nodespread-svg .t.ya-sn{font-size:12px;font-weight:700;fill:var(--anatomy-muted);stroke:none}
.anima .nodespread-svg .t.ya-sn.is-on{fill:var(--surface)}
.anima .nodespread-svg .t.ya-sv{font-size:13px;fill:var(--anatomy-muted)}
.anima .nodespread-svg .t.ya-sv.is-on{fill:var(--anatomy-strong);font-weight:600}
.anima .nodespread-svg .ya-ban{fill:var(--anatomy-shade-1);stroke:var(--anatomy-lit);stroke-width:1.4}
.anima .nodespread-svg .t.ya-bt{font-size:12px;font-weight:600;letter-spacing:.06em;fill:var(--anatomy-muted)}
.anima .nodespread-svg .t.ya-bv{font-size:13.5px;font-weight:600;fill:var(--anatomy-strong)}
@media (max-width:560px){.anima .nodespread-svg .t.ya-val,.anima .nodespread-svg .t.ya-bv{font-size:15.5px}.anima .nodespread-svg .t.ya-lab,.anima .nodespread-svg .t.ya-leg,.anima .nodespread-svg .t.ya-note,.anima .nodespread-svg .t.ya-ol,.anima .nodespread-svg .t.ya-h,.anima .nodespread-svg .t.ya-bt,.anima .nodespread-svg .t.ya-sn{font-size:14.4px}.anima .nodespread-svg .t.ya-sv{font-size:15px}}
`,
  });
}
