// Fig: how an NK cell decides to kill (L19 Introduction to Hematology, Dr. Herr, from the recording and slides). His
// three-scenario schematic drawn anew: an NK cell on the left with an activating receptor and an inhibitory receptor,
// the other cell on the right with an activating ligand and MHC class I. Healthy cell: both bound, the inhibitory
// signal wins, no killing. Target cell (tumor or virus-infected): the ligand is there but MHC class I is missing, so the
// NK cell kills it. Induced killing: MHC class I is there but there are many more activating ligands, and the NK cell
// kills a self cell. A balance under the cells weighs the two signals. The fourth state is his ADCC picture: an
// antibody-coated target with an NK cell, a neutrophil, an eosinophil and a macrophage around it, each binding the
// antibodies' tails with an Fc receptor (CD16 on the NK cell). Buttons pick a scenario; Next and Play step through them.
// Lytic granules drift across to a cell being killed (still for reduced motion). Every part explains itself on hover.
import { makeFig, f1, T, HOT } from "./shared.mjs";
import { cellArt, cellCss } from "./wbc.mjs";

const W = 460, H = 420;
const NK = { x: 105, y: 178, r: 72 }, TG = { x: 355, y: 178, r: 78 };
/* the receptor pairs in each scenario: [y, kind, bound]; kind a = activating, i = inhibitory */
const PAIRS = [
  [[146, "a", 1], [212, "i", 1]],
  [[146, "a", 1], [212, "i", 0]],
  [[120, "a", 1], [147, "a", 1], [174, "a", 1], [201, "a", 1], [236, "i", 1]],
];
const SC = [
  { name: "HEALTHY CELL", act: 1, inh: 1, kill: false, ro: "healthy cell · spared",
    say: "A healthy cell shows an activating ligand and MHC class I. The NK cell's activating receptor binds the ligand, but its inhibitory receptor binds the MHC class I and stops that response: no killing. In his words, the MHC class I says \"cut it out.\"" },
  { name: "TARGET CELL", act: 1, inh: 0, kill: true, ro: "missing MHC class I · killed",
    say: "A target cell, such as a tumor cell or a virus-infected cell, still has the activating ligand but is missing its MHC class I. Nothing engages the inhibitory receptor, the activating receptor wins, and the NK cell kills it with its lytic granules (perforins, granzymes)." },
  { name: "SELF CELL", act: 4, inh: 1, kill: true, ro: "induced killing · killed",
    say: "Induced killing: the cell has both, MHC class I and the activating ligand, but many more activating ligands than usual. The activating signals outweigh the inhibitory one and the NK cell kills a self cell, which he said is probably playing a role in autoimmune responses." },
  { name: "ADCC", ro: "ADCC · killed",
    say: "ADCC, antibody-dependent cell-mediated cytotoxicity: antibodies bind the target cell's antigens, and the Fc receptors of an NK cell (CD16, which binds IgG's constant region), a neutrophil, an eosinophil and a macrophage bind the antibodies' tails, so the killer cells release lytic enzymes and kill the target. He presented these cells one by one, but \"they all play a role in concert together.\"" },
];
const INFO = {
  nk: "NK cell, the large lymphocyte: no B or T cell markers and no specific antigen receptor. It weighs an activating receptor against an inhibitory one. It matures in the bone marrow and belongs to innate immunity.",
  tg: ["A healthy cell: it shows MHC class I, which holds the NK cell back.", "A target cell (a tumor cell or a virus-infected cell): it has lost its MHC class I, so the NK cell kills it.", "A self cell with many more activating ligands than usual: the NK cell kills it anyway (induced killing), probably part of autoimmune responses."],
  ar: "Activating receptor, on the NK cell: it binds an activating ligand on the other cell and signals the NK cell to kill.",
  ir: "Inhibitory receptor, on the NK cell: it binds MHC class I and stops the killing. Bound, it overrides a single activating signal.",
  al: "Activating ligand, on the other cell: what the NK cell's activating receptor binds.",
  mhc: "MHC class I, on the other cell: the inhibitory receptor binds it, which tells the NK cell to leave this cell alone.",
  ghost: "Missing MHC class I: tumor cells and virus-infected cells can lose it, and then nothing stops the NK cell.",
  gran: "Lytic granules: the NK cell releases perforins and granzymes, which kill the cell.",
  bal: "The balance is a way to picture the decision: the inhibitory signal from MHC class I outweighs an activating one, but enough activating signals tip it the other way.",
  antibody: "An antibody bound to an antigen on the target cell: its tail, the constant (Fc) region, is what the killer cells' Fc receptors bind.",
  target: "The target cell, coated with antibodies: the antibody picks the target, and the killer cell does the killing, with no T cell receptor and no MHC involved.",
  e: { nk: "NK cell: its Fc receptor, CD16, binds the constant region of IgG on the target.", neu: "Neutrophil: it takes part in ADCC through its Fc receptors.", eos: "Eosinophil: it takes part in ADCC through its Fc receptors.", mac: "Macrophage: it takes part in ADCC through its Fc receptors." },
};
/* the ADCC layout: the target in the middle, four killer cells around it */
const AD = { x: 230, y: 188, r: 50, d: 128, er: 36 };
const EFF = [["nk", 225, "nk", ["NK cell", "(CD16)"]], ["neu", 315, "neu", ["neutrophil"]], ["eos", 45, "eos", ["eosinophil"]], ["mac", 135, "mono", ["macrophage"]]];
const ABA = [0, 45, 90, 135, 180, 225, 270, 315];

function xaArt() {
  const A = {};
  const n = cellArt("nk", NK.x, NK.y, NK.r, "xa-", 17); A.NK = n.cyto + n.nuc + n.top;
  A.EFF = EFF.map((e) => { const a = e[1] * Math.PI / 180, x = AD.x + Math.cos(a) * AD.d, y = AD.y + Math.sin(a) * AD.d, c = cellArt(e[2], x, y, e[0] === "mac" ? AD.er + 3 : AD.er, "xa-", 11 + e[1]); return { id: e[0], x: f1(x), y: f1(y), svg: c.cyto + c.gran + c.nuc + c.top }; });
  return A;
}

/* ---------- page helpers ---------- */
function xaMemb(c, y, side) { var dy = y - c.y; return c.x + side * Math.sqrt(Math.max(0, c.r * c.r - dy * dy)); }
function xaCell(cx, cy, r, cls) {
  return '<circle class="xa-tc ' + cls + '" cx="' + cx + '" cy="' + cy + '" r="' + r + '"/><circle class="xa-tn" cx="' + f1(cx + r * 0.22) + '" cy="' + f1(cy + 4) + '" r="' + f1(r * 0.4) + '"/>';
}
/* one antibody on the ADCC target at angle a (degrees), its arms on the surface, its tail outward */
function xaAb(D, deg) {
  var a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), X = D.AD.x, Y = D.AD.y, R = D.AD.r;
  function p(r, da) { return f1(X + Math.cos(a + da) * r) + " " + f1(Y + Math.sin(a + da) * r); }
  return '<path class="xa-ab" d="M' + p(R + 1, -0.13) + "L" + p(R + 11, 0) + "L" + p(R + 1, 0.13) + "M" + p(R + 11, 0) + "L" + p(R + 23, 0) + '"/>';
}
function xaGran(x0, y0, x1, y1, n, t, ph) {
  var o = "", k;
  for (k = 0; k < n; k++) { var u = ((t ? t / 1600 : 0) + k / n + ph) % 1, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u + Math.sin(k * 2.1) * 6; o += '<circle class="xa-gr" cx="' + f1(x) + '" cy="' + f1(y) + '" r="2.6"/>'; }
  return o;
}
function xaRender(st, D) {
  var s = st.s, S = D.SC[s], t = st.t || 0, o = "";
  if (s === 3) {
    o += T(12, 22, "ADCC", "xa-h", "start");
    o += HOT(D.INFO.target, xaCell(D.AD.x, D.AD.y, D.AD.r, "xa-die"));
    D.ABA.forEach(function (deg) { o += HOT(D.INFO.antibody, xaAb(D, deg)); });
    D.ART.EFF.forEach(function (e, i) {
      var a = D.EFF[i][1] * Math.PI / 180, c = Math.cos(a), sn = Math.sin(a), r0 = D.AD.d - (e.id === "mac" ? D.AD.er + 3 : D.AD.er), X = D.AD.x, Y = D.AD.y;
      var rec = '<path class="xa-fcr" d="M' + f1(X + c * r0) + " " + f1(Y + sn * r0) + "L" + f1(X + c * (D.AD.r + 26)) + " " + f1(Y + sn * (D.AD.r + 26)) + '"/><circle class="xa-fcr-c" cx="' + f1(X + c * (D.AD.r + 25)) + '" cy="' + f1(Y + sn * (D.AD.r + 25)) + '" r="3.4"/>';
      o += HOT(D.INFO.e[e.id], e.svg + rec);
      o += xaGran(X + c * (r0 - 4) + sn * 9, Y + sn * (r0 - 4) - c * 9, X + c * (D.AD.r + 4) + sn * 9, Y + sn * (D.AD.r + 4) - c * 9, 3, t, i * 0.21);
      var lab = D.EFF[i][3], up = sn < 0, ly = up ? +e.y - 48 - (lab.length - 1) * 15 : +e.y + 56;
      lab.forEach(function (ln, j) { o += T(+e.x, ly + j * 15, ln, "xa-l" + (j ? "" : " b"), "middle"); });
    });
    o += T(D.AD.x, D.AD.y + 5, "target", "xa-l b", "middle");
    o += '<path class="lead" d="M318 186L' + f1(D.AD.x + D.AD.r + 17) + ' 188"/><circle class="dot" cx="' + f1(D.AD.x + D.AD.r + 17) + '" cy="188" r="1.8"/>' + T(322, 184, "antibody", "xa-l b", "start") + T(322, 199, "(IgG)", "xa-l", "start");
    o += T(230, 380, "the antibody picks the target:", "xa-l mut", "middle") + T(230, 396, "no T cell receptor, no MHC", "xa-l mut", "middle");
    return o;
  }
  var P = D.PAIRS[s], kill = S.kill;
  o += T(D.NK.x, 22, "NK CELL", "xa-h", "middle") + T(D.TG.x, 22, S.name, "xa-h", "middle");
  o += HOT(D.INFO.nk, D.ART.NK);
  o += HOT(D.INFO.tg[s], xaCell(D.TG.x, D.TG.y, D.TG.r, kill ? "xa-die" : ""));
  var firstA = null, theI = null;
  P.forEach(function (p) {
    var y = p[0], a = p[1] === "a", bx = xaMemb(D.NK, y, 1), tx = xaMemb(D.TG, y, -1);
    if (a && firstA === null) firstA = y; if (!a) theI = p;
    var rec = '<path class="xa-st ' + (a ? "xa-act" : "xa-inh") + '" d="M' + f1(bx - 2) + " " + y + "L" + (a ? 211 : 212) + " " + y + '"/>' + (a ? '<path class="xa-cup xa-act" d="M225 ' + (y - 7) + "A7 7 0 0 0 225 " + (y + 7) + '"/>' : '<path class="xa-cup xa-inh" d="M227 ' + (y - 9) + "H212V" + (y + 9) + 'H227"/>');
    o += HOT(a ? D.INFO.ar : D.INFO.ir, rec);
    if (a) o += HOT(D.INFO.al, '<path class="xa-st xa-lig" d="M' + f1(tx + 2) + " " + y + "L226 " + y + '"/><circle class="xa-knob" cx="220" cy="' + y + '" r="5.2"/>');
    else if (p[2]) o += HOT(D.INFO.mhc, '<path class="xa-st xa-mhcs" d="M' + f1(tx + 2) + " " + y + "L229 " + y + '"/><rect class="xa-mhc" x="214.5" y="' + (y - 6.5) + '" width="15" height="13" rx="2.5"/><circle class="xa-b2m" cx="235" cy="' + (y + 7) + '" r="3.6"/>');
    else o += HOT(D.INFO.ghost, '<rect class="xa-ghost" x="' + f1(tx - 15) + '" y="' + (y - 6.5) + '" width="13" height="13" rx="2.5"/>');
  });
  if (kill) {
    o += HOT(D.INFO.gran, xaGran(182, firstA - 4, 276, firstA + 30, 6, t, 0));
    [firstA + 2, firstA + 26].forEach(function (y) { var x = xaMemb(D.TG, y, -1); o += '<circle class="xa-pore" cx="' + f1(x) + '" cy="' + y + '" r="3"/>'; });
  }
  /* labels: activating pair on top, inhibitory pair below */
  o += '<path class="lead" d="M198 74L216 ' + (firstA - 8) + '"/><circle class="dot" cx="216" cy="' + (firstA - 8) + '" r="1.8"/>' + T(200, 52, "activating", "xa-l b", "end") + T(200, 67, "receptor", "xa-l b", "end");
  o += '<path class="lead" d="M262 74L238 ' + (firstA - 3) + '"/><circle class="dot" cx="238" cy="' + firstA + '" r="1.8"/>' + T(260, 52, "activating", "xa-l b", "start") + T(260, 67, "ligand", "xa-l b", "start");
  var iy = theI[0];
  o += '<path class="lead" d="M198 274L213 ' + (iy + 10) + '"/><circle class="dot" cx="213" cy="' + (iy + 10) + '" r="1.8"/>' + T(200, 286, "inhibitory", "xa-l b", "end") + T(200, 301, "receptor", "xa-l b", "end");
  if (theI[2]) o += '<path class="lead" d="M262 274L236 ' + (iy + 10) + '"/><circle class="dot" cx="236" cy="' + (iy + 10) + '" r="1.8"/>' + T(260, 286, "MHC class I", "xa-l b", "start") + (s === 2 ? T(260, 301, "(still there)", "xa-l mut", "start") : "");
  else { var gx = xaMemb(D.TG, iy, -1) - 8; o += '<path class="lead" d="M262 274L' + f1(gx) + " " + (iy + 8) + '"/><circle class="dot" cx="' + f1(gx) + '" cy="' + (iy + 8) + '" r="1.8"/>' + T(260, 286, "no MHC", "xa-l bad", "start") + T(260, 301, "class I", "xa-l bad", "start"); }
  /* the balance: inhibitory (left) against activating (right) */
  var wI = S.inh * 2, wA = S.act, th = Math.max(-11, Math.min(11, (wA - wI) * 7)) * Math.PI / 180, cx = 230, cy = 338, hl = 112;
  var lx = cx - hl * Math.cos(th), ly = cy - hl * Math.sin(th), rx = cx + hl * Math.cos(th), ry = cy + hl * Math.sin(th), b = "";
  b += '<path class="xa-fulc" d="M' + cx + " " + cy + "L" + (cx - 12) + " " + (cy + 22) + "H" + (cx + 12) + 'Z"/><path class="xa-beam" d="M' + f1(lx) + " " + f1(ly) + "L" + f1(rx) + " " + f1(ry) + '"/>';
  function pan(x, y, n, cls) { var q = '<path class="xa-beam" d="M' + f1(x) + " " + f1(y) + "V" + f1(y + 12) + '"/><path class="xa-pan" d="M' + f1(x - 26) + " " + f1(y + 12) + "Q" + f1(x) + " " + f1(y + 24) + " " + f1(x + 26) + " " + f1(y + 12) + 'Z"/>', k; for (k = 0; k < n; k++) q += '<rect class="' + cls + '" x="' + f1(x - 4.5 * n + k * 9 + 0.5) + '" y="' + f1(y + 3) + '" width="8" height="8" rx="2"/>'; return q; }
  b += pan(lx, ly, wI, "xa-wi") + pan(rx, ry, wA, "xa-wa");
  o += HOT(D.INFO.bal, b);
  o += T(cx - hl, 398, "inhibitory", "xa-l", "middle") + T(cx + hl, 398, "activating", "xa-l", "middle") + T(cx, 398, kill ? "KILLED" : "SPARED", "xa-l " + (kill ? "bad" : "ok"), "middle");
  return o;
}
function xaSay(st, D) { var S = D.SC[st.s]; return [S.say, S.ro]; }

export default function nkcheck() {
  const D = { INIT: { s: 0 }, STEPKEY: "s", STEPMAX: 3, PLAYMS: 4200, ANIM: true, SC, PAIRS, INFO, AD, EFF, ABA, TG, NK, ART: xaArt() };
  return makeFig({
    id: "nkcheck", lec: "hemeintro", fig: "Fig 23", short: "How an NK cell decides", hint: "pick · hover",
    title: "How an NK cell decides to kill",
    caption: "His three scenarios: an NK cell weighs its activating receptor against its inhibitory one, which binds MHC class I. Pick a healthy cell, a cell missing MHC class I, or induced killing, and then ADCC, where antibodies pick the target.",
    W, H,
    label: "An NK cell on the left faces another cell on the right. The NK cell's activating receptor binds an activating ligand on the other cell, and its inhibitory receptor binds the other cell's MHC class I. A balance below weighs the inhibitory signal against the activating ones. A healthy cell, with MHC class I, is spared; a target cell missing MHC class I is killed; a cell with many more activating ligands is killed even with MHC class I. A fourth view shows ADCC: a target cell coated with antibodies, with an NK cell, a neutrophil, an eosinophil and a macrophage around it binding the antibodies' tails.",
    D, render: xaRender, say: xaSay, helpers: [xaMemb, xaCell, xaAb, xaGran],
    controls: `<div class="am-controls" role="group" aria-label="Scenario"><button type="button" class="am-btn" data-amk="s" data-amv="0">Healthy cell</button><button type="button" class="am-btn" data-amk="s" data-amv="1">Missing MHC I</button><button type="button" class="am-btn" data-amk="s" data-amv="2">Induced killing</button><button type="button" class="am-btn" data-amk="s" data-amv="3">ADCC</button></div>
<div class="am-controls"><button type="button" class="am-btn" data-amstep="-1">Back</button><button type="button" class="am-btn" data-amstep="1">Next</button><button type="button" class="am-btn" data-amplay aria-pressed="false">Play</button></div>`,
    sources: [
      "From the recording of the lecture (Tuesday, November 17, 1 pm), where he called this schematic \"pretty helpful\": a healthy cell with MHC class I and an activating ligand, an NK cell with an activating receptor and an inhibitory receptor, the inhibitory receptor binding the MHC class I and stopping the response, so no killing; a target cell with the activating ligand but missing the MHC class I, so the activating receptor binds and the NK cell kills it; and induced killing, both present but many more activating ligands, self-killing that is probably playing a role in autoimmune responses. Then his ADCC picture: a target cell with the NK cell, the neutrophil, the eosinophil and the macrophage around it, which \"all play a role in concert together\"; and NK cells recognizing IgG's constant region through the Fc receptor CD16.",
      "Once, describing the target cell, he said it was missing \"MHC class 2\"; just before, he twice said the inhibitory receptor binds MHC class 1, and immunology texts agree (Abbas AK, Lichtman AH and Pillai S, Cellular and Molecular Immunology, NK cell receptors; Murphy K and Weaver C, Janeway's Immunobiology, NK cells), so it is drawn as MHC class I.",
      "Those texts settled the drawing: inhibitory receptors that recognize MHC class I, activating receptors for ligands that stressed, infected and tumor cells express, the inhibitory signal usually dominating when both are engaged, release of perforins and granzymes at the contact, and ADCC through Fc receptors (FcγRIII, CD16, on NK cells) binding the Fc tail of antibody on the target. The MHC class I is drawn with its small partner chain (β2-microglobulin) as a dot, unlabeled.",
      "Schematic: one receptor of each kind stands for the many a real NK cell carries, and the balance is a teaching device for how the signals are weighed, not a measured quantity. Cells are not to scale. The NK cells are drawn as in the white cell figure, without granules, and the lytic granules appear only as they are released; the macrophage is drawn as a monocyte-shaped cell. Educational, not medical advice.",
    ],
    css: `
.anima[data-anima="nkcheck"] .am-svg{max-width:560px}
.anima .nkcheck-svg .t.xa-h{font-size:11px;font-weight:600;letter-spacing:.07em;fill:var(--anatomy-muted)}
.anima .nkcheck-svg .t.xa-l{font-size:13px}
.anima .nkcheck-svg .xa-tc{fill:color-mix(in srgb,var(--bx-cyto) 55%,var(--surface));stroke:var(--bx-cyto-line);stroke-width:1.3}
.anima .nkcheck-svg .xa-tc.xa-die{fill:color-mix(in srgb,var(--bx-cyto) 25%,var(--surface));stroke:var(--bx-inhib);stroke-dasharray:6 4}
.anima .nkcheck-svg .xa-tn{fill:color-mix(in srgb,var(--bx-nuc) 70%,var(--bx-cyto));stroke:var(--bx-nuc-line);stroke-width:.9}
.anima .nkcheck-svg .xa-st{fill:none;stroke-width:3;stroke-linecap:round}
.anima .nkcheck-svg .xa-cup{fill:none;stroke-width:3.2;stroke-linecap:round;stroke-linejoin:round}
.anima .nkcheck-svg .xa-act{stroke:var(--bx-stim)}
.anima .nkcheck-svg .xa-inh{stroke:var(--bx-inhib)}
.anima .nkcheck-svg .xa-lig{stroke:color-mix(in srgb,var(--bx-stim) 55%,var(--anatomy-mid))}
.anima .nkcheck-svg .xa-knob{fill:var(--bx-stim);stroke:color-mix(in srgb,var(--bx-stim) 60%,var(--anatomy-hi));stroke-width:.8}
.anima .nkcheck-svg .xa-mhcs{stroke:var(--bx-violet)}
.anima .nkcheck-svg .xa-mhc{fill:var(--bx-violet);stroke:color-mix(in srgb,var(--bx-violet) 60%,var(--anatomy-hi));stroke-width:.8}
.anima .nkcheck-svg .xa-b2m{fill:var(--bx-violet-soft);stroke:var(--bx-violet);stroke-width:1}
.anima .nkcheck-svg .xa-ghost{fill:none;stroke:var(--bx-violet);stroke-width:1.3;stroke-dasharray:3 2.5}
.anima .nkcheck-svg .xa-gr{fill:var(--bx-gold);stroke:color-mix(in srgb,var(--bx-gold) 60%,var(--anatomy-hi));stroke-width:.6}
.anima .nkcheck-svg .xa-pore{fill:var(--surface);stroke:var(--bx-inhib);stroke-width:1.2}
.anima .nkcheck-svg .xa-ab{fill:none;stroke:var(--bx-blue);stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}
.anima .nkcheck-svg .xa-fcr{fill:none;stroke:var(--bx-hot);stroke-width:2.6;stroke-linecap:round}
.anima .nkcheck-svg .xa-fcr-c{fill:var(--bx-hot)}
.anima .nkcheck-svg .xa-fulc{fill:var(--anatomy-lo);stroke:var(--anatomy-mid);stroke-width:1}
.anima .nkcheck-svg .xa-beam{fill:none;stroke:var(--anatomy-mid);stroke-width:2.4;stroke-linecap:round}
.anima .nkcheck-svg .xa-pan{fill:var(--anatomy-faint);stroke:var(--anatomy-mid);stroke-width:1.2}
.anima .nkcheck-svg .xa-wi{fill:var(--bx-inhib)}
.anima .nkcheck-svg .xa-wa{fill:var(--bx-stim)}
@media (max-width:560px){.anima .nkcheck-svg .t.xa-h{font-size:15px}.anima .nkcheck-svg .t.xa-l{font-size:15px}}
${cellCss("nkcheck-svg", "xa-")}`,
  });
}
