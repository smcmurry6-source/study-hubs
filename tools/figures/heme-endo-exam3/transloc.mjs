// Fig 22: five translocations (L20 Lymphomas and Leukemias, Dr. Borak, from the recorded lecture and slides: follicular lymphoma, mantle
// cell lymphoma, Burkitt lymphoma, chronic myeloid leukemia, acute promyelocytic leukemia, and the notes' "translocations
// side by side"). The five pairs of chromosomes as a strip at the top, grouped the way the notes' memory hook groups them
// (the three B-cell lymphomas move a gene next to IGH on chromosome 14; the two myeloid ones fuse two genes), and the
// pair picked drawn large below: both chromosomes at their real relative lengths with their G-bands (hg38), each broken
// at its gene, and the two ends swapping places when you pick it. After the swap, the gene that moved sits next to IGH
// (switched on) or fuses with its partner (BCR::ABL1 on the short Philadelphia chromosome; PML::RARA), and a banner
// gives the disease, what the change does and the course or drug, in the lecture's words. No CD markers (his
// objectives: not needed).
import { makeFig, f1, T, L, HOT } from "./shared.mjs";

/* ---------- the chromosomes (build time) ---------- */
/* G-bands from the UCSC hg38 cytoBand table: each "end:stain" in Mb, starting at 0 (n gneg, 1-4 gpos25-gpos100,
   a acen, v gvar, s stalk) */
const RAW = {
  8: "2.3:n 6.3:3 12.8:n 19.2:4 23.5:n 27.5:2 29:n 36.7:3 38.5:n 39.9:1 43.2:n 45.2:a 47.2:a 51.3:n 51.7:3 54.6:n 60.6:2 61.3:n 65.1:2 67.1:n 69.6:2 72:n 74.6:4 74.7:n 83.5:3 85.9:n 92.3:4 97.9:n 100.5:1 105.1:n 109.5:3 111.1:n 116.7:4 118.3:n 121.5:2 126.3:n 130.4:2 135.4:n 138.9:3 145.1:n",
  9: "2.2:n 4.6:1 9:n 14.2:3 16.6:n 18.5:1 19.9:n 25.6:4 28:n 33.2:4 36.3:n 37.9:1 39:n 40:2 42.2:n 43:a 45.5:a 61.5:v 65:n 69.3:1 71.3:n 76.6:2 78.5:n 81.5:2 84.3:n 87.8:2 89.2:n 91.2:1 93.9:n 96.5:1 99.8:n 105.4:4 108.5:n 112.1:1 114.9:n 119.8:3 123.1:n 127.5:1 130.6:n 131.1:1 133.1:n 134.5:1 138.4:n",
  11: "2.8:n 11.7:2 13.8:n 16.9:2 22:n 26.2:4 27.2:n 31:3 36.4:n 43.4:4 48.8:n 51:3 53.4:a 55.8:a 60.1:3 61.9:n 63.6:1 66.1:n 68.7:1 70.5:n 75.5:2 77.4:n 85.9:4 88.6:n 93:4 97.4:n 102.3:4 103:n 110.6:4 112.7:n 114.6:2 121.3:n 124:2 127.9:n 130.9:2 135.1:n",
  14: "3.6:v 8:s 16.1:v 17.2:a 18.2:a 24.1:n 32.9:4 34.8:n 36.1:2 37.4:n 43:4 46.7:n 50.4:4 53.6:n 55:1 57.6:n 61.6:3 64.3:n 67.4:2 69.8:n 73.3:2 78.8:n 83.1:4 84.4:n 89.3:4 91.4:n 94.2:1 95.8:n 100.9:2 102.7:n 103.5:2 107:n",
  15: "4.2:v 9.7:s 17.5:v 19:a 20.5:a 25.5:n 27.8:2 30:n 30.9:2 33.4:n 39.8:3 42.5:n 43.3:1 44.5:n 49.2:3 52.6:n 58.8:3 59:n 63.4:1 66.9:n 67:1 67.2:n 72.4:1 74.9:n 76.3:1 78:n 81.4:2 84.7:n 88.5:2 93.8:n 98:2 102:n",
  17: "3.4:n 6.5:2 10.8:n 16.1:3 22.7:n 25.1:a 27.4:a 33.5:n 39.8:2 40.2:n 42.8:1 46.8:n 49.3:1 52.1:n 59.5:3 60.2:n 63.1:3 64.6:n 66.2:2 69.1:n 72.9:3 76.8:n 77.2:1 83.3:n",
  18: "2.9:n 7.2:2 8.5:n 10.9:1 15.4:n 18.5:a 21.5:a 27.5:n 35.1:4 39.5:n 45.9:3 50.7:n 56.2:3 58.6:n 61.3:2 63.9:n 69.1:4 71:n 75.4:1 80.4:n",
  22: "4.3:v 9.4:s 13.7:v 15:a 17.4:a 21.7:n 23.1:1 25.5:n 29.2:2 31.8:n 37.2:2 40.6:n 43.8:2 48.1:n 49.1:2 50.8:n",
};
const ACRO = { 14: 1, 15: 1, 22: 1 };
const BANDS = {}, LEN = {}, CEN = {};
for (const c in RAW) {
  let a = 0; BANDS[c] = RAW[c].split(" ").map((t) => { const [e, k] = t.split(":"); const r = [a, +e, k]; a = +e; return r; });
  LEN[c] = a; CEN[c] = BANDS[c].find((b) => b[2] === "a")[1];
}
const S = 1.2;               // stage scale, units per Mb: the longest chromosome drawn (14 after t(11;14), 170 Mb) is 204 units
const STAGE = { s: S, HW: 10.5, pinch: 5, R: 6, step: 1, gx: 3.5, gh: 7 };
const MINI = { s: 0.32, HW: 4.2, pinch: 2.4, R: 3, step: 0.6, gx: 2.6, gh: 3.2 };

function hwRaw(c, mb, o) {
  const B = BANDS[c]; let k = "n";
  for (const b of B) if (mb >= b[0] && mb <= b[1]) { k = b[2]; break; }
  if (k === "s") return o.HW * 0.3;
  if (ACRO[c] && mb < B[0][1]) return o.HW * 0.74;          /* the satellite at the tip of an acrocentric short arm */
  const d = (mb - CEN[c]) * o.s; return o.HW * (1 - 0.45 * Math.exp(-Math.pow(d / o.pinch, 2)));
}
/* half-width at a position: smoothed, with rounded telomeres */
function hw(c, mb, o) {
  let w = 0; for (let j = -3; j <= 3; j++) w += hwRaw(c, Math.min(LEN[c], Math.max(0, mb + (j * 0.5) / o.s)), o); w /= 7;
  const dT = mb * o.s, dB = (LEN[c] - mb) * o.s, R = o.R;
  if (dT < R) w *= Math.sqrt(Math.max(0, 1 - Math.pow((R - dT) / R, 2)));
  if (dB < R) w *= Math.sqrt(Math.max(0, 1 - Math.pow((R - dB) / R, 2)));
  return w;
}
/* the outline between two positions as [half-width, y] points, y measured from `a`, with straight runs merged */
function edge(c, u, v, a, o) {
  const n = Math.max(1, Math.ceil(((v - u) * o.s) / o.step)), P = [];
  for (let i = 0; i <= n; i++) { const mb = u + ((v - u) * i) / n; P.push([hw(c, mb, o), (mb - a) * o.s]); }
  const K = [P[0]];
  for (let i = 1; i < P.length - 1; i++) { const p = K[K.length - 1], q = P[i + 1], t = (P[i][1] - p[1]) / (q[1] - p[1]); if (Math.abs(p[0] + (q[0] - p[0]) * t - P[i][0]) > 0.04) K.push(P[i]); }
  K.push(P[P.length - 1]);
  return K;
}
function poly(K) { let d = "M" + K.map((p) => f1(-p[0]) + " " + f1(p[1])).join("L"); for (let i = K.length - 1; i >= 0; i--) d += "L" + f1(K[i][0]) + " " + f1(K[i][1]); return d + "Z"; }
/* one piece of a chromosome, [a, b] in Mb, drawn from y = 0 down; genes: [{ y1, y2 (Mb), col: "b" | "h" }] */
function piece(c, a, b, o, genes) {
  const body = poly(edge(c, a, b, a, o)), by = { 1: "", 2: "", 3: "", 4: "", v: "", s: "" };
  for (const band of BANDS[c]) { const u = Math.max(band[0], a), v = Math.min(band[1], b); if (v - u > 1e-6 && band[2] in by) by[band[2]] += poly(edge(c, u, v, a, o)); }
  let out = '<path class="tr-bd" d="' + body + '"/>';
  for (const k in by) if (by[k]) out += '<path class="tr-g' + k + '" d="' + by[k] + '"/>';
  out += '<path class="tr-ol" d="' + body + '"/>';
  (genes || []).forEach((g) => {
    const u = Math.max(g.y1, a), v = Math.min(g.y2, b); if (v - u < 1e-6) return;
    const w = hw(c, (u + v) / 2, o) + o.gx;
    out += '<rect class="tr-ge ' + (g.col === "b" ? "tr-gb" : "tr-gh") + '" x="' + f1(-w) + '" y="' + f1((u - a) * o.s) + '" width="' + f1(2 * w) + '" height="' + f1((v - u) * o.s) + '" rx="1.2"/>';
  });
  return out;
}

/* ---------- the five pairs, as the notes give them ---------- */
const IGH = { n: "IGH", sub: "heavy-chain gene", col: "b", at: "up" };
const PAIRS = [
  { t: "t(14;18)", name: "follicular lymphoma", a: 14, b: 18, bpA: 104.1, bpB: 63.1, gA: IGH, gB: { n: "BCL2", sub: "blocks apoptosis", col: "h", at: "dn" }, res: "A", on: "always on",
    dz: "follicular", group: 0,
    ban: ["Follicular lymphoma · 85 to 90 percent", "BCL2 always on, so the cells don't die", "Indolent: median survival over 17 years"],
    pre: "Chromosomes 14 and 18, before the swap. IGH, the immunoglobulin heavy-chain gene, sits near the end of 14's long arm; BCL2, the gene whose protein blocks apoptosis, sits on 18's long arm. In follicular lymphoma both break at the dashed lines and trade ends: t(14;18). Press After the swap to see it.",
    post: "t(14;18), follicular lymphoma, found in 85 to 90 percent and the event that starts it: the end of 18 carrying BCL2 now sits on 14, right next to IGH, so BCL2 is switched on all the time and the cells live on instead of dying. The neoplastic follicles stain for BCL2. It is indolent, with a median survival over 17 years. The hook: the three B-cell lymphomas all move a gene next to IGH on chromosome 14.",
    ro: ["t(14;18) · before", "t(14;18) · follicular"] },
  { t: "t(11;14)", name: "mantle cell lymphoma", a: 11, b: 14, bpA: 69.4, bpB: 104.1, gA: { n: "cyclin D1", sub: "", col: "h", at: "dn" }, gB: IGH, res: "B", on: "switched on",
    dz: "mantle cell", group: 0,
    ban: ["Mantle cell lymphoma · at least 95 percent", "Cyclin D1 on; the cyclin D1 stain is diagnostic", "Median survival up from 3 years to over 5 to 10"],
    pre: "Chromosomes 11 and 14, before the swap. Cyclin D1 sits on 11's long arm, and IGH, the immunoglobulin heavy-chain gene, near the end of 14's. In mantle cell lymphoma both break at the dashed lines and trade ends: t(11;14). Press After the swap to see it.",
    post: "t(11;14), mantle cell lymphoma, present in at least 95 percent and the first event in its development: most of 11's long arm, from cyclin D1 on, now sits on 14 next to IGH, so cyclin D1 is switched on. He said the translocation tells him right away it is mantle cell lymphoma (nothing else among the lymphomas carries it), and that if a test question says the cells express cyclin D1, it is mantle cell lymphoma. With current treatment the median survival has risen from 3 years to more than 5 to 10. Like t(14;18) and t(8;14), it moves a gene next to IGH on chromosome 14.",
    ro: ["t(11;14) · before", "t(11;14) · mantle cell"] },
  { t: "t(8;14)", name: "Burkitt lymphoma", a: 8, b: 14, bpA: 127.6, bpB: 104.1, gA: { n: "MYC", sub: "drives growth", col: "h", at: "dn" }, gB: IGH, res: "B", on: "switched on",
    dz: "Burkitt", group: 0,
    ban: ["Burkitt lymphoma · 80 percent", "MYC on: very fast growth", "Aggressive, yet over 90% of children survive"],
    pre: "Chromosomes 8 and 14, before the swap. MYC, a gene that drives cell growth and division, sits near the end of 8's long arm, and IGH, the immunoglobulin heavy-chain gene, near the end of 14's. In Burkitt lymphoma they trade ends: t(8;14). Press After the swap to see it.",
    post: "t(8;14), Burkitt lymphoma, its primary genetic event in 80 percent: the end of 8 carrying MYC now sits on 14 next to IGH, so MYC is on and the cells divide very fast, an aggressive lymphoma with a high tumor burden. With modern immunochemotherapy including rituximab, overall survival is over 90 percent in children and 80 percent in adults. Like the other two B-cell lymphomas, it moves a gene next to IGH on chromosome 14.",
    ro: ["t(8;14) · before", "t(8;14) · Burkitt"] },
  { t: "t(9;22)", name: "chronic myeloid leukemia", a: 9, b: 22, bpA: 130.73, bpB: 23.29, gA: { n: "ABL1", sub: "", col: "h", at: "split" }, gB: { n: "BCR", sub: "", col: "b", at: "split" }, res: "B", fus: ["BCR", "ABL1"], on: "kinase always on",
    dz: "CML", group: 1,
    ban: ["Chronic myeloid leukemia · 90 to 95 percent", "BCR::ABL1: a tyrosine kinase always on", "Imatinib (Gleevec) blocks it: first-line"],
    pre: "Chromosomes 9 and 22, before the swap. ABL1 sits near the end of 9's long arm, and BCR on 22's long arm. In chronic myeloid leukemia both break inside these genes, at the dashed lines, and trade ends: t(9;22). Press After the swap to see it.",
    post: "t(9;22), chronic myeloid leukemia, in 90 to 95 percent at diagnosis: the end of 9, from inside ABL1, now sits on 22 and fuses with BCR, making the BCR::ABL1 fusion gene on a shortened 22, the Philadelphia chromosome. Its tyrosine kinase is always on, which is enough to cause the chronic phase. Imatinib (Gleevec), the first-line drug, competes with ATP for the kinase's active site, blocking it so it can't drive the cell to proliferate.",
    ro: ["t(9;22) · before", "t(9;22) · CML"] },
  { t: "t(15;17)", name: "acute promyelocytic leukemia (APL)", a: 15, b: 17, bpA: 74.02, bpB: 40.33, gA: { n: "PML", sub: "", col: "b", at: "split" }, gB: { n: "RARA", sub: "retinoic acid receptor", col: "h", at: "split" }, res: "A", fus: ["PML", "RARA"], on: "maturation stops",
    dz: "APL", group: 1,
    ban: ["Acute promyelocytic leukemia (APL)", "PML::RARA: maturation stops at the promyelocyte", "ATRA plus arsenic trioxide: largely curative"],
    pre: "Chromosomes 15 and 17, before the swap. PML, the promyelocytic leukemia gene, sits on 15's long arm, and RARA, the retinoic acid receptor alpha gene, on 17's. In acute promyelocytic leukemia both break inside these genes, at the dashed lines, and trade ends: t(15;17). Press After the swap to see it.",
    post: "t(15;17), acute promyelocytic leukemia: the end of 17, from inside RARA, now sits on 15 and fuses with PML, making PML::RARA. The fusion protein impairs myeloid differentiation, so maturation stops at the promyelocyte. All-trans retinoic acid with arsenic trioxide (ATRA plus ATO), without conventional chemotherapy, is highly effective and largely curative for low- and intermediate-risk APL; the retinoic acid lets the blocked promyelocytes mature.",
    ro: ["t(15;17) · before", "t(15;17) · APL"] },
];
const INFO_CHR = {
  8: "Chromosome 8. MYC, near the end of its long arm, drives cell growth and division.",
  9: "Chromosome 9. ABL1 sits near the end of its long arm.",
  11: "Chromosome 11, with cyclin D1 on its long arm.",
  14: "Chromosome 14. IGH, the immunoglobulin heavy-chain gene, sits near the end of its long arm. Three B-cell lymphomas move a gene next to it: BCL2 (follicular), cyclin D1 (mantle cell) and MYC (Burkitt).",
  15: "Chromosome 15, with PML, the promyelocytic leukemia gene, on its long arm.",
  17: "Chromosome 17, with RARA, the retinoic acid receptor alpha gene, on its long arm.",
  18: "Chromosome 18, with BCL2 on its long arm: its protein blocks apoptosis.",
  22: "Chromosome 22, with BCR on its long arm. After t(9;22) it is the shortened Philadelphia chromosome.",
};

/* gene marks: "up" sits just above the break (it stays), "dn" just below it (it moves), "split" straddles it */
function genesOf(g, bp, o) { const h = o.gh / o.s; return g.at === "up" ? [{ y1: bp - h, y2: bp, col: g.col }] : g.at === "dn" ? [{ y1: bp, y2: bp + h, col: g.col }] : [{ y1: bp - h / 2, y2: bp + h / 2, col: g.col }]; }

/* the strip of all five: each pair's two small chromosomes, drawn once */
const CX = [52, 140, 228, 326, 410];
function minis(P) {
  return [["A", P.a, P.bpA, P.gA, -9], ["B", P.b, P.bpB, P.gB, 9]].map((q) => '<g class="tr-' + q[0] + '" transform="translate(' + q[4] + ' 71)">' + piece(q[1], 0, LEN[q[1]], MINI, genesOf(q[3], q[2], MINI)) + "</g>").join("");
}

/* ---------- page helpers (serialized into the page) ---------- */
function trOn(st, key, D) {
  st.rm = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  if (key === "p") { st.sw = 1; st.from = 0; } else st.from = st.k == null ? 1 - st.sw : st.k;
  st.at = performance.now();
}
function trRender(st, D) {
  var P = D.PR[st.p], X = D.X, y0 = D.Y0, s = D.S, o = "", i;
  /* the strip: the two groups, then the five pairs, the one picked framed */
  o += T(140, 15, "B-cell lymphomas", "tr-gh1", "middle") + T(140, 30, "a gene moves next to IGH on 14", "tr-gh2", "middle");
  o += T(368, 15, "Myeloid leukemias", "tr-gh1", "middle") + T(368, 30, "two genes fuse", "tr-gh2", "middle");
  o += '<path class="tr-brak" d="M10 42V37H270V42M286 42V37H450V42"/>';
  for (i = 0; i < 5; i++) {
    var Q = D.PR[i], cx = D.CX[i], on = i === st.p ? " is-on" : "";
    o += HOT(Q.t + ", " + Q.name + ": " + (Q.fus ? Q.fus[0] + " and " + Q.fus[1] + " fuse." : (Q.gA.n === "IGH" ? Q.gB.n : Q.gA.n) + " moves next to IGH on 14.") + (on ? "" : " Pick it below to swap it."),
      '<rect class="tr-col' + on + '" x="' + (cx - 41) + '" y="47" width="82" height="92" rx="9"/>' + T(cx, 63, Q.t, "tr-tl" + on, "middle") +
      '<g transform="translate(' + cx + ' 0)">' + D.MN[i] + "</g>" + T(cx, 133, Q.dz, "tr-dz" + on, "middle"));
  }
  var e = st.rm || st.from === st.sw ? 1 : Math.max(0, Math.min(1, (performance.now() - st.at) / 1500)), k;
  e = e * e * (3 - 2 * e); k = st.from + (st.sw - st.from) * e; st.k = k;
  var yA = y0 + P.bpA * s, yB = y0 + P.bpB * s, xa = X[0], xb = X[1], before = Math.max(0, 1 - 2 * k), after = Math.max(0, 2 * k - 1);
  var pulse = st.t ? 0.5 + 0.5 * Math.sin(st.t / 450) : 0.6;
  /* the stage's heading, the chromosome numbers and the key */
  o += T(230, 162, P.t + (st.sw ? ", after the swap" : ", before the swap"), "tr-h", "middle");
  o += T(xa, 182, String(P.a), "tr-num tr-nA", "middle") + T(xb, 182, String(P.b), "tr-num tr-nB", "middle");
  o += HOT("Blue marks the gene that stays where it is (IGH, BCR, PML); orange marks the gene that moves next to it (BCL2, cyclin D1, MYC, ABL1, RARA). The gene marks are drawn far bigger than the genes.",
    '<rect class="tr-ge tr-gb" x="12" y="191" width="14" height="7" rx="1.2"/>' + T(32, 198, "gene that stays", "tr-key", "start") +
    '<rect class="tr-ge tr-gh" x="12" y="209" width="14" height="7" rx="1.2"/>' + T(32, 216, "gene that moves", "tr-key", "start"));
  /* the glow on the junction that matters, after the swap */
  var rx = P.res === "A" ? xa : xb, ry = P.res === "A" ? yA : yB;
  if (after > 0) o += '<ellipse class="tr-halo" cx="' + rx + '" cy="' + f1(ry) + '" rx="' + f1(19 + 2 * pulse) + '" ry="' + f1(10 + 1.5 * pulse) + '" opacity="' + f1(after * (0.6 + 0.4 * pulse)) + '"/>';
  /* the pieces that stay */
  o += HOT(D.INFO[P.a], '<g class="tr-A" transform="translate(' + xa + " " + y0 + ')">' + P.As + "</g>");
  o += HOT(D.INFO[P.b], '<g class="tr-B" transform="translate(' + xb + " " + y0 + ')">' + P.Bs + "</g>");
  /* the breaks and the swap, before */
  if (before > 0) {
    o += '<g opacity="' + f1(before) + '"><path class="tr-brk" d="M' + (xa - 17) + " " + f1(yA) + "H" + (xa + 17) + "M" + (xb - 17) + " " + f1(yB) + "H" + (xb + 17) + '"/>';
    var ax = xa + 14, bx = xb - 14;
    o += '<path class="tr-arc" d="M' + ax + " " + f1(yA - 4) + "Q" + 230 + " " + f1(Math.min(yA, yB) - 26) + " " + (bx - 3) + " " + f1(yB - 6) + '"/><path class="tr-ah" d="M' + bx + " " + f1(yB - 4) + "l-7.5 -1.5l3.5 -5.5Z" + '"/>';
    o += '<path class="tr-arc" d="M' + bx + " " + f1(yB + 4) + "Q" + 230 + " " + f1(Math.max(yA, yB) + 26) + " " + (ax + 3) + " " + f1(yA + 6) + '"/><path class="tr-ah" d="M' + ax + " " + f1(yA + 4) + "l7.5 1.5l-3.5 5.5Z" + '"/>';
    o += "</g>";
  }
  /* the ends on the move: A's end travels to B's break, B's to A's, one arcing below the other */
  var ax2 = xa + (xb - xa) * k, ay = yA + (yB - yA) * k + 16 * Math.sin(Math.PI * k), bx2 = xb + (xa - xb) * k, by = yB + (yA - yB) * k - 16 * Math.sin(Math.PI * k);
  o += HOT(P.Iam, '<g class="tr-A" transform="translate(' + f1(ax2) + " " + f1(ay) + ')">' + P.Am + "</g>");
  o += HOT(P.Ibm, '<g class="tr-B" transform="translate(' + f1(bx2) + " " + f1(by) + ')">' + P.Bm + "</g>");
  /* labels before: each gene beside its own chromosome */
  function lab(x, y, name, sub, px, py, side, cls, op) {
    var anc = side < 0 ? "end" : "start", g = L(x, y, name, px, py, anc, "tr-gt " + cls);
    if (sub) g += T(x, y + 15, sub, "tr-gs", anc);
    return '<g opacity="' + f1(op) + '">' + g + "</g>";
  }
  function gy(g, bp) { return g.at === "up" ? bp - D.GH / 2 : g.at === "dn" ? bp + D.GH / 2 : bp; }
  var hwA = 10.5, hwB = 10.5;
  if (before > 0) {
    var ya = gy(P.gA, yA), yb = gy(P.gB, yB);
    o += lab(xa - 26, ya + 4, P.gA.n, P.gA.sub, xa - hwA - 1.5, ya, -1, P.gA.col === "b" ? "tr-cb" : "tr-ch", before);
    o += lab(xb + 26, yb + 4, P.gB.n, P.gB.sub, xb + hwB + 1.5, yb, 1, P.gB.col === "b" ? "tr-cb" : "tr-ch", before);
  }
  /* labels after: on the chromosome that carries the change */
  if (after > 0) {
    var sd = P.res === "A" ? -1 : 1, lx = rx + sd * 26, px = rx + sd * 12, anc = sd < 0 ? "end" : "start", g = "";
    if (P.fus) {
      g += L(lx, ry + 4, '<tspan class="tr-cb">' + P.fus[0] + '</tspan>::<tspan class="tr-ch">' + P.fus[1] + "</tspan>", px, ry, anc, "tr-gt tr-fu");
      g += T(lx, ry + 19, P.on, "tr-gs tr-on", anc);
      if (P.a === 9) g += T(xb, y0 + (P.bpB + 138.4 - P.bpA) * s + 28, "the Philadelphia", "tr-ph", "middle") + T(xb, y0 + (P.bpB + 138.4 - P.bpA) * s + 44, "chromosome", "tr-ph", "middle");
    } else {
      var other = P.res === "A" ? P.gB : P.gA;
      g += L(lx, ry - D.GH / 2 - 7, "IGH", px, ry - D.GH / 2, anc, "tr-gt tr-cb");
      g += L(lx, ry + D.GH / 2 + 17, other.n, px, ry + D.GH / 2, anc, "tr-gt tr-ch");
      g += T(lx, ry + D.GH / 2 + 32, P.on, "tr-gs tr-on", anc);
    }
    o += '<g opacity="' + f1(after) + '">' + g + "</g>";
  }
  /* the banner */
  var bt = D.H - 78;
  o += '<rect class="tr-ban' + (st.sw ? " is-on" : "") + '" x="8" y="' + bt + '" width="444" height="70" rx="10"/>';
  o += T(22, bt + 21, P.ban[0], "tr-b1", "start") + '<g opacity="' + f1(0.35 + 0.65 * k) + '">' + T(22, bt + 41, P.ban[1], "tr-b2", "start") + T(22, bt + 59, P.ban[2], "tr-b3", "start") + "</g>";
  return o;
}
function trSay(st, D) { var P = D.PR[st.p]; return [st.sw ? P.post : P.pre, P.ro[st.sw ? 1 : 0]]; }

export default function transloc() {
  const PR = PAIRS.map((P) => {
    const gA = genesOf(P.gA, P.bpA, STAGE), gB = genesOf(P.gB, P.bpB, STAGE);
    const nm = (n) => "the end of " + n + "'s long arm";
    return { t: P.t, name: P.name, dz: P.dz, a: P.a, b: P.b, bpA: P.bpA, bpB: P.bpB, res: P.res, on: P.on, fus: P.fus || null, ban: P.ban, pre: P.pre, post: P.post, ro: P.ro,
      gA: { n: P.gA.n, sub: P.gA.sub, col: P.gA.col, at: P.gA.at }, gB: { n: P.gB.n, sub: P.gB.sub, col: P.gB.col, at: P.gB.at },
      As: piece(P.a, 0, P.bpA, STAGE, gA), Am: piece(P.a, P.bpA, LEN[P.a], STAGE, gA),
      Bs: piece(P.b, 0, P.bpB, STAGE, gB), Bm: piece(P.b, P.bpB, LEN[P.b], STAGE, gB),
      Iam: "The piece that moves: " + nm(P.a) + (P.gA.at === "up" ? ", beyond IGH (a tiny piece, drawn bigger than it is)" : ", from " + (P.gA.at === "split" ? "inside " : "") + P.gA.n + " on") + ". It joins " + P.b + " at its break.",
      Ibm: "The piece that moves: " + nm(P.b) + (P.gB.at === "up" ? ", beyond IGH (a tiny piece, drawn bigger than it is)" : ", from " + (P.gB.at === "split" ? "inside " : "") + P.gB.n + " on") + ". It joins " + P.a + " at its break." };
  });
  const H = 482;
  return makeFig({
    id: "transloc", lec: "lymleuk", fig: "Fig 22", short: "Five translocations", hint: "pick · hover",
    title: "Five translocations",
    caption: "The five translocations in this lecture, the molecular associations he said you need, each a pair of chromosomes trading ends. Pick one to watch the swap and see the gene it moves or the fusion it makes, the disease, and its drug or course.",
    W: 460, H,
    label: "Five chromosome pairs, t(14;18), t(11;14), t(8;14), t(9;22) and t(15;17), with the pair picked drawn large: both chromosomes with their bands, broken at their genes, trading ends. After the swap, BCL2, cyclin D1 or MYC sits next to IGH on chromosome 14, or BCR fuses with ABL1 on the short Philadelphia chromosome, or PML fuses with RARA.",
    D: { PR, MN: PAIRS.map(minis), CX, INFO: INFO_CHR, X: [192, 268], Y0: 190, S, GH: STAGE.gh, H, ANIM: true, ONSET: "trOn", INIT: { p: 0, sw: 0, from: 0, at: 0 } },
    render: trRender, say: trSay, helpers: [trOn],
    controls: `<div class="am-controls" role="group" aria-label="Translocation">` + PAIRS.map((P, i) => `<button type="button" class="am-btn" data-amk="p" data-amv="${i}">${P.t} ${P.dz}</button>`).join("") + `</div>
<div class="am-controls" role="group" aria-label="Before or after"><button type="button" class="am-btn" data-amk="sw" data-amv="0">Before</button><button type="button" class="am-btn" data-amk="sw" data-amv="1">After the swap</button></div>`,
    sources: [
      "From the L20 notes (Dr. Borak's recorded lecture and slides; at the end he said \"you do need to know the molecular associations\" on these): t(14;18) in follicular lymphoma (85 to 90 percent), moving BCL2 next to IGH so BCL2 is always on and the cells don't die, with a median survival over 17 years; t(11;14) in mantle cell lymphoma (at least 95 percent), switching on cyclin D1, whose stain is diagnostic, with survival up from 3 years to more than 5 to 10; t(8;14) in Burkitt lymphoma (80 percent), moving MYC next to IGH, with survival over 90 percent in children and 80 percent in adults on rituximab-based treatment; t(9;22) in CML (90 to 95 percent), BCR::ABL1 on the shortened 22, the Philadelphia chromosome, a tyrosine kinase always on, blocked by imatinib; t(15;17) in APL, PML::RARA stopping maturation at the promyelocyte, treated with all-trans retinoic acid and arsenic trioxide; and the notes' hook, that the three B-cell lymphomas move a gene next to IGH on 14 and the two myeloid ones are fusions. The slides join fused genes with a double colon, as here.",
      "The chromosomes are drawn to their real relative lengths, with their centromeres and G-bands, from the UCSC Genome Browser's cytoBand table for the GRCh38 (hg38) assembly; the gene positions are GRCh38's (NCBI Gene): IGH at 14q32.33, BCL2 at 18q21.33, cyclin D1 (CCND1) at 11q13.3, MYC at 8q24.21, ABL1 at 9q34.12, BCR at 22q11.23, PML at 15q24.1 and RARA at 17q21.2. Which end moves where follows the standard karyotypes (Robbins and Cotran Pathologic Basis of Disease; the WHO classification, Swerdlow et al., 2017; Küppers and Dalla-Favera, Oncogene 2001, on IGH translocations in B-cell lymphomas): BCL2, cyclin D1 and MYC end up on chromosome 14 beside IGH (the 11q13 and 8q24 breaks fall just before cyclin D1 and MYC, so each gene moves whole); BCR and ABL1 break inside the genes and BCR::ABL1 sits on the shortened 22; PML and RARA break inside the genes and PML::RARA sits on 15. That is why 14 grows so long in t(11;14): nearly half of 11 moves onto it.",
      "Simplified: the gene marks are drawn far bigger than the genes, and the piece of 14 that leaves (only about 1 Mb beyond IGH) is drawn a little bigger so it can be seen. The other junction each swap makes is drawn but not named, as the lecture doesn't teach it. Blue and orange mark which gene stays and which moves, not anything about the genes themselves; the violet and teal tints only tell the two chromosomes apart. CD markers are left out, as his objectives say they aren't needed. Educational, not medical advice.",
    ],
    css: `
.anima[data-anima="transloc"] .am-svg{max-width:560px}
.anima .transloc-svg .tr-A .tr-bd{fill:color-mix(in srgb,var(--bx-violet) 12%,var(--surface))}
.anima .transloc-svg .tr-A .tr-g1{fill:color-mix(in srgb,var(--bx-violet) 26%,var(--surface))}
.anima .transloc-svg .tr-A .tr-g2{fill:color-mix(in srgb,var(--bx-violet) 44%,var(--surface))}
.anima .transloc-svg .tr-A .tr-g3{fill:color-mix(in srgb,var(--bx-violet) 64%,var(--surface))}
.anima .transloc-svg .tr-A .tr-g4{fill:color-mix(in srgb,var(--bx-violet) 86%,var(--surface))}
.anima .transloc-svg .tr-A .tr-ol{stroke:var(--bx-violet)}
.anima .transloc-svg .tr-B .tr-bd{fill:color-mix(in srgb,var(--bx-ins) 12%,var(--surface))}
.anima .transloc-svg .tr-B .tr-g1{fill:color-mix(in srgb,var(--bx-ins) 26%,var(--surface))}
.anima .transloc-svg .tr-B .tr-g2{fill:color-mix(in srgb,var(--bx-ins) 44%,var(--surface))}
.anima .transloc-svg .tr-B .tr-g3{fill:color-mix(in srgb,var(--bx-ins) 64%,var(--surface))}
.anima .transloc-svg .tr-B .tr-g4{fill:color-mix(in srgb,var(--bx-ins) 86%,var(--surface))}
.anima .transloc-svg .tr-B .tr-ol{stroke:var(--bx-ins)}
.anima .transloc-svg .tr-gv,.anima .transloc-svg .tr-gs{fill:var(--anatomy-lo)}
.anima .transloc-svg .tr-ol{fill:none;stroke-width:1}
.anima .transloc-svg .tr-ge{stroke:var(--surface);stroke-width:.8}
.anima .transloc-svg .tr-gb{fill:var(--bx-blue)}
.anima .transloc-svg .tr-gh{fill:var(--bx-hot)}
.anima .transloc-svg .tr-halo{fill:var(--bx-hot-soft);stroke:var(--bx-hot);stroke-width:1.2;stroke-dasharray:2.5 2.5}
.anima .transloc-svg .tr-brk{fill:none;stroke:var(--bx-inhib);stroke-width:1.6;stroke-dasharray:3.5 2.5}
.anima .transloc-svg .tr-arc{fill:none;stroke:var(--anatomy-mid);stroke-width:1.2}
.anima .transloc-svg .tr-ah{fill:var(--anatomy-mid)}
.anima .transloc-svg .tr-brak{fill:none;stroke:var(--anatomy-lo);stroke-width:1}
.anima .transloc-svg .tr-col{fill:transparent;stroke:transparent;stroke-width:1.3}
.anima .transloc-svg .tr-col.is-on{fill:var(--accent-soft,var(--anatomy-shade-1));stroke:var(--accent)}
.anima .transloc-svg .tr-ban{fill:var(--anatomy-shade-1);stroke:var(--anatomy-lo);stroke-width:1}
.anima .transloc-svg .tr-ban.is-on{stroke:var(--anatomy-lit);stroke-width:1.4}
.anima .transloc-svg .t.tr-gh1{font-size:12.5px;font-weight:700;fill:var(--anatomy-strong)}
.anima .transloc-svg .t.tr-gh2{font-size:12px;fill:var(--anatomy-text)}
.anima .transloc-svg .t.tr-tl{font-size:13px;font-weight:700;fill:var(--anatomy-text)}
.anima .transloc-svg .t.tr-tl.is-on,.anima .transloc-svg .t.tr-dz.is-on{fill:var(--accent-ink,var(--anatomy-strong))}
.anima .transloc-svg .t.tr-dz{font-size:12px;fill:var(--anatomy-text)}
.anima .transloc-svg .t.tr-h{font-size:12.5px;font-weight:600;fill:var(--anatomy-muted)}
.anima .transloc-svg .t.tr-num{font-size:14px;font-weight:700}
.anima .transloc-svg .t.tr-nA{fill:var(--bx-violet)}
.anima .transloc-svg .t.tr-nB{fill:var(--bx-ins)}
.anima .transloc-svg .t.tr-key{font-size:12px;fill:var(--anatomy-text)}
.anima .transloc-svg .t.tr-gt{font-size:14px;font-weight:700;fill:var(--anatomy-strong)}
.anima .transloc-svg .t.tr-cb,.anima .transloc-svg .tr-cb{fill:var(--bx-blue)}
.anima .transloc-svg .t.tr-ch,.anima .transloc-svg .tr-ch{fill:var(--bx-hot)}
.anima .transloc-svg .t.tr-gs{font-size:12px;fill:var(--anatomy-text)}
.anima .transloc-svg .t.tr-on{fill:var(--bx-hot);font-weight:600}
.anima .transloc-svg .t.tr-ph{font-size:12.5px;font-weight:600;fill:var(--anatomy-strong)}
.anima .transloc-svg .t.tr-b1{font-size:14px;font-weight:700;fill:var(--anatomy-strong)}
.anima .transloc-svg .t.tr-b2{font-size:13px;font-weight:600;fill:var(--bx-hot)}
.anima .transloc-svg .t.tr-b3{font-size:13px;fill:var(--anatomy-text)}
@media (max-width:560px){.anima .transloc-svg .t.tr-gh1{font-size:15px}.anima .transloc-svg .t.tr-gh2,.anima .transloc-svg .t.tr-dz,.anima .transloc-svg .t.tr-key,.anima .transloc-svg .t.tr-gs{font-size:14px}.anima .transloc-svg .t.tr-tl{font-size:15px}.anima .transloc-svg .t.tr-h{font-size:14.5px}.anima .transloc-svg .t.tr-num{font-size:16.5px}.anima .transloc-svg .t.tr-gt{font-size:16.5px}.anima .transloc-svg .t.tr-ph{font-size:14.5px}.anima .transloc-svg .t.tr-b1{font-size:16px}.anima .transloc-svg .t.tr-b2,.anima .transloc-svg .t.tr-b3{font-size:15px}}
`,
  });
}
