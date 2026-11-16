// Fig 20.2: where in the follicle (L20 Lymphomas and Leukemias, Dr. Borak, from the slides: follicular lymphoma, mantle
// cell lymphoma, marginal zone and MALT lymphoma). A secondary lymphoid follicle cut through its middle, drawn cell by
// cell in code: the germinal center (larger, paler B cells and a few macrophages), the mantle zone (a dense rim of small
// B cells, thicker on one side, as it is in a real follicle) and the marginal zone outside it (medium cells with more,
// paler cytoplasm). Each zone is labeled with the B-cell lymphoma it gives rise to. Pick a zone: it lights up, the others
// fade, and a card gives that lymphoma's translocation or link and its course, with a small drawing of what it looks
// like (a node full of back-to-back follicles; the mantle cells' slightly irregular nuclei; a lymphoepithelial lesion).
// No CD markers (his objectives: not needed).
import { makeFig, f1, T, L, HOT } from "./shared.mjs";

/* ---------- build-time drawing ---------- */
function rng(seed) { let a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function sm(p) {
  var n = p.length, d = "M" + f1(p[0][0]) + " " + f1(p[0][1]), i, a, b, c, e;
  for (i = 0; i < n; i++) { a = p[(i - 1 + n) % n]; b = p[i]; c = p[(i + 1) % n]; e = p[(i + 2) % n];
    d += "C" + f1(b[0] + (c[0] - a[0]) / 6) + " " + f1(b[1] + (c[1] - a[1]) / 6) + " " + f1(c[0] - (e[0] - b[0]) / 6) + " " + f1(c[1] - (e[1] - b[1]) / 6) + " " + f1(c[0]) + " " + f1(c[1]); }
  return d + "Z";
}
/* a zone's edge: a circle with a gentle wobble, as a function and as points */
function zone(cx, cy, r, ph) {
  const rad = (a) => r * (1 + 0.035 * Math.sin(3 * a + ph) + 0.022 * Math.sin(5 * a + 2 * ph));
  const pts = []; for (let k = 0; k < 40; k++) { const a = (k / 40) * Math.PI * 2; pts.push([cx + rad(a) * Math.cos(a), cy + rad(a) * Math.sin(a)]); }
  return { cx, cy, rad, pts, has: (x, y) => Math.hypot(x - cx, y - cy) < rad(Math.atan2(y - cy, x - cx)) };
}
const circ = (x, y, r) => "M" + f1(x - r) + " " + f1(y) + "a" + f1(r) + " " + f1(r) + " 0 1 0 " + f1(2 * r) + " 0a" + f1(r) + " " + f1(r) + " 0 1 0 " + f1(-2 * r) + " 0";
/* dart throwing: points at least `gap` apart that pass `ok` */
function scatter(R, n, gap, box, ok, taken) {
  const out = []; let tries = 0;
  while (out.length < n && tries < n * 80) { tries++;
    const x = box[0] + R() * (box[2] - box[0]), y = box[1] + R() * (box[3] - box[1]);
    if (!ok(x, y)) continue;
    if (out.some((q) => Math.hypot(q[0] - x, q[1] - y) < gap) || (taken && taken.some((q) => Math.hypot(q[0] - x, q[1] - y) < q[2]))) continue;
    out.push([x, y]); }
  return out;
}
/* a lymphocyte-like nucleus with a notch (cleaved) */
function cleaved(x, y, r, a) {
  const p = []; for (let k = 0; k < 12; k++) { const t = (k / 12) * Math.PI * 2, d = Math.cos(t - a) > 0.93 ? 0.55 : 1; p.push([x + r * d * Math.cos(t), y + r * 0.86 * d * Math.sin(t)]); }
  return sm(p);
}

function art() {
  const R = rng(20);
  const GC = zone(150, 196, 58, 0.6), MN = zone(150, 184, 90, 2.1), MZ = zone(150, 178, 124, 4.0);
  const box = [10, 42, 290, 322];
  const o = {};
  o.SEC = '<rect class="fo-sec" x="8" y="40" width="284" height="284" rx="14"/>';
  /* interfollicular tissue: a scatter of small lymphocytes */
  let ifc = ""; scatter(R, 120, 10, box, (x, y) => !MZ.has(x, y) && x > 14 && x < 286 && y > 46 && y < 318).forEach((q) => { ifc += circ(q[0], q[1], 2.1); });
  o.IF = '<path class="fo-ifc" d="' + ifc + '"/>';
  /* the marginal zone: medium cells with a rim of pale cytoplasm */
  let mzc = "", mzn = "";
  scatter(R, 400, 9.6, [20, 48, 280, 308], (x, y) => MZ.has(x, y) && !MN.has(x, y) && Math.hypot(x - MZ.cx, y - MZ.cy) < MZ.rad(Math.atan2(y - MZ.cy, x - MZ.cx)) - 4).forEach((q) => {
    mzc += circ(q[0], q[1], 4.3); mzn += circ(q[0] - 0.8 + R() * 0.6, q[1] + 0.3, 2.3 + R() * 0.4); });
  o.MZ = '<path class="fo-mz" fill-rule="evenodd" d="' + sm(MZ.pts) + sm(MN.pts) + '"/><path class="fo-mzc" d="' + mzc + '"/><path class="fo-mzn" d="' + mzn + '"/>';
  /* the mantle: a dense rim of small lymphocytes, thicker toward the top */
  let mnn = "";
  scatter(R, 700, 6.2, [50, 84, 250, 290], (x, y) => MN.has(x, y) && !GC.has(x, y) && Math.hypot(x - MN.cx, y - MN.cy) < MN.rad(Math.atan2(y - MN.cy, x - MN.cx)) - 2.6 && Math.hypot(x - GC.cx, y - GC.cy) > GC.rad(Math.atan2(y - GC.cy, x - GC.cx)) + 2.4)
    .forEach((q) => { mnn += circ(q[0], q[1], 2.35 + R() * 0.35); });
  o.MN = '<path class="fo-mn" fill-rule="evenodd" d="' + sm(MN.pts) + sm(GC.pts) + '"/><path class="fo-mnn" d="' + mnn + '"/>';
  /* the germinal center: a few macrophages with debris, then large cells (more toward the lower, darker half) and
     smaller cleaved ones (more toward the top) */
  const mac = [[128, 176], [176, 214], [140, 228]];
  let gm = "", deb = "";
  mac.forEach((m) => { gm += circ(m[0], m[1], 8.5); for (let k = 0; k < 4; k++) deb += circ(m[0] + (R() - 0.5) * 9, m[1] + (R() - 0.5) * 9, 1.1 + R() * 0.6); });
  let cb = "", cbn = "", cc = "";
  scatter(R, 120, 9.4, [92, 138, 208, 254], (x, y) => Math.hypot(x - GC.cx, y - GC.cy) < GC.rad(Math.atan2(y - GC.cy, x - GC.cx)) - 4.5, mac.map((m) => [m[0], m[1], 12.5]))
    .forEach((q) => { const big = R() < 0.25 + (q[1] - 150) / 160;
      if (big) { cb += circ(q[0], q[1], 4.2); cbn += circ(q[0] + 2.2, q[1] - 1, 0.8) + circ(q[0] - 2, q[1] + 1.6, 0.7); }
      else cc += cleaved(q[0], q[1], 3.1, R() * 6.28); });
  o.GC = '<path class="fo-gc" d="' + sm(GC.pts) + '"/><path class="fo-mac" d="' + gm + '"/><path class="fo-deb" d="' + deb + '"/><path class="fo-cb" d="' + cb + '"/><path class="fo-cbn" d="' + cbn + '"/><path class="fo-cc" d="' + cc + '"/>';
  o.E_GC = sm(GC.pts); o.E_MN = sm(MN.pts); o.E_MZ = sm(MZ.pts);
  /* insets, each in the card's right box (x 318-444) */
  function node(cx, cy, packed, seed) {
    const Q = rng(seed), p = [];
    for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2, dent = Math.exp(-Math.pow(a - Math.PI / 2, 2) / 0.12) * 0.45; p.push([cx + 52 * Math.cos(a) * (1 - dent * 0.2), cy + 25 * Math.sin(a) * (1 - dent)]); }
    let f = "", fc = "";
    const fol = packed
      ? scatter(Q, 16, 13.2, [cx - 46, cy - 22, cx + 46, cy + 22], (x, y) => Math.pow((x - cx) / 44, 2) + Math.pow((y - cy) / 18, 2) < 1 && !(y > cy + 8 && Math.abs(x - cx) < 8))
      : [[-33, -7], [-13, -15], [12, -15], [33, -7], [-40, 7], [40, 7]].map((q) => [cx + q[0], cy + q[1]]);
    fol.forEach((q) => { f += circ(q[0], q[1], packed ? 6.6 : 5); fc += circ(q[0], q[1] + (packed ? 0 : 0.7), packed ? 4.1 : 2.7); });
    return '<path class="fo-nd" d="' + sm(p) + '"/>' + (packed ? "" : '<path class="fo-med" d="M' + f1(cx - 24) + " " + f1(cy + 5) + "Q" + f1(cx) + " " + f1(cy - 6) + " " + f1(cx + 24) + " " + f1(cy + 5) + '"/>') +
      '<path class="fo-nf" d="' + f + '"/><path class="fo-nfc' + (packed ? " fo-nfc-p" : "") + '" d="' + fc + '"/>';
  }
  o.IN_GC = node(380, 372, false, 7) + node(380, 440, true, 9);
  /* mantle cell lymphoma cells: small to medium, slightly irregular nuclei, scant cytoplasm */
  const Q = rng(31);
  let mc = "", mcn = "";
  [[362, 384, 13], [392, 378, 14.5], [376, 408, 12.5], [404, 405, 12], [352, 410, 11]].forEach((c, i) => {
    const p = [], pn = [];
    for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; p.push([c[0] + c[2] * (1 + (Q() - 0.5) * 0.06) * Math.cos(a), c[1] + c[2] * 0.94 * Math.sin(a)]);
      const notch = Math.cos(a - i * 1.7) > 0.9 ? 0.7 : 1; pn.push([c[0] + c[2] * 0.8 * notch * (1 + (Q() - 0.5) * 0.12) * Math.cos(a), c[1] + c[2] * 0.76 * notch * (1 + (Q() - 0.5) * 0.12) * Math.sin(a)]); }
    mc += sm(p); mcn += sm(pn); });
  o.IN_MN = '<path class="fo-mcc" d="' + mc + '"/><path class="fo-mcn" d="' + mcn + '"/>';
  /* a lymphoepithelial lesion: a gland whose epithelium is invaded by the tumor cells on one side */
  let ep = "", epn = "", tum = "", tumn = "";
  const gx = 374, gy = 398, ro = 34, ri = 17;
  for (let k = 0; k < 14; k++) {
    const a0 = (k / 14) * Math.PI * 2, a1 = ((k + 1) / 14) * Math.PI * 2, inv = Math.cos((a0 + a1) / 2) > 0.62;
    if (inv) continue;
    ep += "M" + f1(gx + ri * Math.cos(a0)) + " " + f1(gy + ri * Math.sin(a0)) + "L" + f1(gx + ro * Math.cos(a0)) + " " + f1(gy + ro * Math.sin(a0)) + "A" + ro + " " + ro + " 0 0 1 " + f1(gx + ro * Math.cos(a1)) + " " + f1(gy + ro * Math.sin(a1)) +
      "L" + f1(gx + ri * Math.cos(a1)) + " " + f1(gy + ri * Math.sin(a1)) + "A" + ri + " " + ri + " 0 0 0 " + f1(gx + ri * Math.cos(a0)) + " " + f1(gy + ri * Math.sin(a0)) + "Z";
    const am = (a0 + a1) / 2; epn += circ(gx + (ro - 5.5) * Math.cos(am), gy + (ro - 5.5) * Math.sin(am), 3);
  }
  scatter(Q, 26, 8.4, [384, 362, 446, 434], (x, y) => { const d = Math.hypot(x - gx, y - gy); return d > ri + 3 && (d < ro + 2 ? Math.cos(Math.atan2(y - gy, x - gx)) > 0.6 : x < 442 && y > 366 && y < 430); })
    .forEach((q) => { tum += circ(q[0], q[1], 3.9); tumn += circ(q[0] - 0.4, q[1] + 0.3, 2.4); });
  o.IN_MZ = '<path class="fo-ep" d="' + ep + '"/><path class="fo-epn" d="' + epn + '"/><circle class="fo-lum" cx="' + gx + '" cy="' + gy + '" r="' + ri + '"/><path class="fo-mzc" d="' + tum + '"/><path class="fo-tumn" d="' + tumn + '"/>';
  return o;
}

/* ---------- page helpers (serialized into the page) ---------- */
function foRender(st, D) {
  var z = st.z, Z = D.ZN, o = "", on = function (k) { return z === "all" || z === k; };
  function grp(k, inner) { return '<g class="' + (on(k) ? "" : "fo-off") + '">' + inner + "</g>"; }
  o += D.SEC + D.IF;
  o += HOT(Z.marginal.info, grp("marginal", D.MZ));
  o += HOT(Z.mantle.info, grp("mantle", D.MN));
  o += HOT(Z.gc.info, grp("gc", D.GC));
  o += '<path class="fo-edge" d="' + D.E_MZ + D.E_MN + D.E_GC + '"/>';
  if (z === "gc") o += '<path class="fo-lit" d="' + D.E_GC + '"/>';
  if (z === "mantle") o += '<path class="fo-lit" d="' + D.E_MN + D.E_GC + '"/>';
  if (z === "marginal") o += '<path class="fo-lit" d="' + D.E_MZ + D.E_MN + '"/>';
  /* the labels: zone, then the lymphoma it gives */
  ["mantle", "gc", "marginal"].forEach(function (k) {
    var c = Z[k], cls = on(k) ? "" : " fo-fade";
    o += '<g class="fo-lab' + cls + '">' + L(306, c.ly, c.zone, c.px, c.py, "start", "fo-zn") + T(306, c.ly + 16, c.lym, "fo-ly " + c.tc, "start") + "</g>";
  });
  o += T(16, 30, "A LYMPHOID FOLLICLE, CUT OPEN", "fo-h", "start");
  /* the card */
  o += '<rect class="fo-card' + (z === "all" ? "" : " is-on") + '" x="8" y="336" width="444" height="' + (D.H - 344) + '" rx="12"/>';
  if (z === "all") {
    o += T(22, 358, "THREE ZONES, THREE B-CELL LYMPHOMAS", "fo-h", "start");
    ["gc", "mantle", "marginal"].forEach(function (k, i) {
      var c = Z[k], y = 386 + i * 26;
      o += HOT(c.info, '<circle class="fo-sw ' + c.sw + '" cx="27" cy="' + (y - 4.5) + '" r="6"/>' + T(40, y, '<tspan class="fo-b">' + c.zone + "</tspan> → " + c.lym + " · " + c.tag, "fo-row", "start"));
    });
    o += T(22, 474, "Mantle: the rim right around the center.", "fo-mn-t", "start") + T(22, 492, "Marginal: the zone outside the mantle.", "fo-mn-t", "start");
  } else {
    var c = Z[z];
    o += T(22, 362, c.title, "fo-title " + c.tc, "start");
    c.lines.forEach(function (ln, i) { o += T(22, 386 + i * 17.5, ln, "fo-ln", "start"); });
    o += HOT(c.inset, '<rect class="fo-inset" x="314" y="344" width="132" height="' + (D.H - 360) + '" rx="9"/>' + D["IN_" + c.ins] + c.ilab.map(function (s) { return T(380, s[1], s[0], "fo-il", "middle"); }).join(""));
  }
  return o;
}
function foSay(st, D) { var c = st.z === "all" ? D.ALL : D.ZN[st.z]; return [c.say, c.ro]; }

const ZN = {
  gc: { zone: "germinal center", lym: "follicular lymphoma", tag: "t(14;18)", tc: "fo-gct", sw: "fo-gcs", ly: 176, px: 176, py: 190, ins: "GC",
    title: "Follicular lymphoma",
    lines: ["from the germinal center (follicle center)", "t(14;18): BCL2 next to IGH, always on,", "so the cells don't die", "widespread when found, often no symptoms", "indolent: median survival over 17 years"],
    ilab: [["normal node", 410], ["follicular lymphoma:", 480], ["back-to-back follicles", 494]],
    info: "Germinal center, the follicle center: the pale middle of the follicle, with larger B cells. Follicular lymphoma comes from here: t(14;18) moves BCL2 next to IGH.",
    inset: "A normal node has a few follicles in its outer cortex. Follicular lymphoma fills the node with crowded, back-to-back follicles; the neoplastic follicles stain for BCL2, which helps separate them from reactive ones.",
    say: "Follicular lymphoma, from the germinal center (the follicle center): it grows in a follicular pattern, crowded back-to-back follicles filling the node, and makes up 10 to 20 percent of all lymphomas. t(14;18), in 85 to 90 percent, moves BCL2 next to IGH, so BCL2 is switched on all the time and the cells don't die. Most patients have widespread disease when it is found (the marrow in 40 to 70 percent), yet are often asymptomatic, and B symptoms are uncommon. It is indolent, with a median survival over 17 years, but it keeps progressing, and the prognosis is tied to how far it had spread at diagnosis.",
    ro: "center · follicular" },
  mantle: { zone: "mantle zone", lym: "mantle cell lymphoma", tag: "t(11;14)", tc: "fo-mnt", sw: "fo-mns", ly: 94, px: 198, py: 128, ins: "MN",
    title: "Mantle cell lymphoma",
    lines: ["from the mantle zone, the rim of small", "B cells around the germinal center", "t(11;14): cyclin D1 on, its stain diagnostic", "older (median 68 to 69), enlarged nodes", "survival: from 3 years to more than 5 to 10"],
    ilab: [["small to medium", 446], ["cells, slightly", 460], ["irregular nuclei", 474]],
    info: "Mantle zone: the rim of small B cells around the germinal center. Mantle cell lymphoma comes from here: t(11;14) switches on cyclin D1.",
    inset: "Mantle cell lymphoma: small to medium-sized cells with slightly irregular nuclei and scant cytoplasm.",
    say: "Mantle cell lymphoma, from the mantle zone, the rim of small B cells around the germinal center: small to medium-sized cells with slightly irregular nuclei and scant cytoplasm. t(11;14), in at least 95 percent, switches on cyclin D1, and his slide calls the cyclin D1 stain diagnostic. Patients are older (median 68 to 69), most with enlarged peripheral nodes; the spleen and marrow are commonly involved. Once considered incurable, its median survival has risen from 3 years to more than 5 to 10, and some patients may be cured.",
    ro: "mantle · mantle cell" },
  marginal: { zone: "marginal zone", lym: "MALT lymphoma", tag: "chronic inflammation", tc: "fo-mzt", sw: "fo-mzs", ly: 262, px: 238, py: 240, ins: "MZ",
    title: "MALT lymphoma",
    lines: ["extranodal marginal zone lymphoma", "grows on chronic inflammation:", "stomach H. pylori · salivary Sjögren", "thyroid Hashimoto · skin Borrelia", "indolent; some respond to antibiotics", "about 90% alive at 5 years"],
    ilab: [["lymphoepithelial", 454], ["lesion", 468]],
    info: "Marginal zone: outside the mantle, with medium cells and more cytoplasm. Marginal zone lymphoma comes from here; its extranodal form is MALT lymphoma, which grows on chronic inflammation.",
    inset: "A lymphoepithelial lesion: tumor cells invading a gland's epithelium, often seen in MALT lymphoma as it effaces the tissue.",
    say: "Marginal zone lymphoma, from the marginal zone B cells outside the mantle, has a nodal form and an extranodal one, MALT lymphoma. MALT lymphoma is indolent and grows on a chronic inflammatory disorder: the stomach with H. pylori, the skin with Borrelia burgdorferi, the ocular adnexa with Chlamydia psittaci, the salivary gland after Sjögren syndrome, the thyroid after Hashimoto thyroiditis; some respond to antibiotics. Its cells efface the tissue, often with lymphoepithelial lesions. B symptoms are rare, and about 90 percent are alive at 5 years and 80 percent at 10.",
    ro: "marginal · MALT" },
};
const ALL = {
  say: "A lymphoid follicle cut through its middle: the germinal center (the follicle center) in the middle, the mantle zone, a rim of small B cells, right around it, and the marginal zone outside the mantle. Each gives a B-cell lymphoma: follicular lymphoma from the follicle center, mantle cell lymphoma from the mantle zone, and marginal zone lymphoma, whose extranodal form is MALT lymphoma, from the marginal zone. Mantle and marginal are the pair to keep apart.",
  ro: "three zones" };

export default function follicle() {
  const A = art(), H = 520;
  return makeFig({
    id: "follicle", lec: "lymleuk", fig: "Fig 20.2", short: "Where in the follicle", hint: "pick · hover",
    title: "Where in the follicle",
    caption: "A lymphoid follicle cut open, each zone labeled with the B-cell lymphoma it gives rise to. Pick a zone to see its lymphoma's translocation or link and its course.",
    W: 460, H,
    label: "A lymphoid follicle in cross-section: the germinal center in the middle gives follicular lymphoma, the mantle zone of small B cells around it gives mantle cell lymphoma, and the marginal zone outside the mantle gives marginal zone (MALT) lymphoma.",
    D: Object.assign({}, A, { ZN, ALL, H, ANIM: false, INIT: { z: "all" } }),
    render: foRender, say: foSay,
    controls: `<div class="am-controls" role="group" aria-label="Zone">` + [["all", "All three"], ["gc", "Germinal center"], ["mantle", "Mantle zone"], ["marginal", "Marginal zone"]].map((b) => `<button type="button" class="am-btn" data-amk="z" data-amv="${b[0]}">${b[1]}</button>`).join("") + `</div>`,
    sources: [
      "From the L20 notes (Dr. Borak's slides): mantle cell lymphoma from the mantle zone of the lymphoid follicle, the rim of small B cells around the germinal center, with small to medium cells, slightly irregular nuclei and scant cytoplasm, t(11;14) and cyclin D1, median age 68 to 69, survival from 3 years to more than 5 to 10; follicular lymphoma's back-to-back follicles, t(14;18) with BCL2 next to IGH, 10 to 20 percent of lymphomas, widespread disease, a median survival over 17 years; marginal zone lymphoma from marginal zone B cells, its extranodal MALT form, the five chronic inflammatory links, antibiotics, lymphoepithelial lesions and survival. The notes don't name the zone follicular lymphoma comes from; the WHO classification (Swerdlow et al., 2017) and Robbins settle it as the follicle center (germinal center) B cell, and the lecture's \"follicle center\" wording for it follows them.",
      "Robbins and Cotran Pathologic Basis of Disease and Wheater's Functional Histology set the drawing: the germinal center's larger, paler cells (with more large cells toward one pole and more small cleaved cells toward the other) and its macrophages holding debris, the dense rim of small lymphocytes in the mantle, thicker toward the follicle's cap, and the marginal zone's medium cells with more pale cytoplasm outside it; the normal node with its follicles in the outer cortex. Those part names are left unlabeled, as the lecture doesn't teach them.",
      "Schematic and not to scale: one follicle drawn cell by cell in code (not traced from any image), with the marginal zone drawn as wide as in mucosa or spleen so it can be seen; in many nodes it is thin. The small drawings in the card are illustrations, not specimens. CD markers are left out, as his objectives say they aren't needed. Educational, not medical advice.",
    ],
    css: `
.anima[data-anima="follicle"] .am-svg{max-width:520px}
.anima .follicle-svg .fo-sec{fill:color-mix(in srgb,var(--bx-matrix) 70%,var(--surface));stroke:var(--anatomy-lo);stroke-width:1}
.anima .follicle-svg .fo-ifc{fill:color-mix(in srgb,var(--bx-nuc) 60%,var(--surface))}
.anima .follicle-svg .fo-mz{fill:color-mix(in srgb,var(--bx-ins) 22%,var(--bx-matrix))}
.anima .follicle-svg .fo-mzc{fill:color-mix(in srgb,var(--bx-ins-soft) 70%,var(--surface));stroke:color-mix(in srgb,var(--bx-ins) 55%,var(--surface));stroke-width:.5}
.anima .follicle-svg .fo-mzn{fill:color-mix(in srgb,var(--bx-nuc) 80%,var(--surface))}
.anima .follicle-svg .fo-mn{fill:color-mix(in srgb,var(--bx-violet) 30%,var(--bx-matrix))}
.anima .follicle-svg .fo-mnn{fill:var(--bx-nuc);stroke:var(--bx-nuc-line);stroke-width:.3}
.anima .follicle-svg .fo-gc{fill:color-mix(in srgb,var(--bx-gold-soft) 60%,var(--bx-matrix))}
.anima .follicle-svg .fo-mac{fill:color-mix(in srgb,var(--surface) 65%,var(--bx-eosin));stroke:var(--bx-cyto-line);stroke-width:.5}
.anima .follicle-svg .fo-deb{fill:var(--bx-nuc)}
.anima .follicle-svg .fo-cb{fill:color-mix(in srgb,var(--bx-nuc) 48%,var(--surface));stroke:var(--bx-nuc-line);stroke-width:.5}
.anima .follicle-svg .fo-cbn{fill:var(--bx-nuc-line)}
.anima .follicle-svg .fo-cc{fill:color-mix(in srgb,var(--bx-nuc) 72%,var(--surface));stroke:var(--bx-nuc-line);stroke-width:.4}
.anima .follicle-svg .fo-edge{fill:none;stroke:var(--anatomy-mid);stroke-width:.7;opacity:.55}
.anima .follicle-svg .fo-lit{fill:none;stroke:var(--anatomy-lit);stroke-width:2.2}
.anima .follicle-svg .fo-off{opacity:.32}
.anima .follicle-svg .fo-fade{opacity:.45}
.anima .follicle-svg .t.fo-h{font-size:11px;font-weight:600;letter-spacing:.06em;fill:var(--anatomy-muted)}
.anima .follicle-svg .t.fo-zn{font-size:13.5px;font-weight:600;fill:var(--anatomy-strong)}
.anima .follicle-svg .t.fo-ly{font-size:13px;font-weight:600}
.anima .follicle-svg .t.fo-gct{fill:color-mix(in srgb,var(--bx-gold) 55%,var(--anatomy-strong))}
.anima .follicle-svg .t.fo-mnt{fill:var(--bx-violet)}
.anima .follicle-svg .t.fo-mzt{fill:var(--bx-ins)}
.anima .follicle-svg .fo-gcs{fill:color-mix(in srgb,var(--bx-gold-soft) 60%,var(--bx-matrix));stroke:var(--bx-gold);stroke-width:1.2}
.anima .follicle-svg .fo-mns{fill:color-mix(in srgb,var(--bx-violet) 30%,var(--bx-matrix));stroke:var(--bx-violet);stroke-width:1.2}
.anima .follicle-svg .fo-mzs{fill:color-mix(in srgb,var(--bx-ins) 22%,var(--bx-matrix));stroke:var(--bx-ins);stroke-width:1.2}
.anima .follicle-svg .fo-card{fill:var(--anatomy-shade-1);stroke:var(--anatomy-lo);stroke-width:1}
.anima .follicle-svg .fo-card.is-on{stroke:var(--anatomy-lit);stroke-width:1.3}
.anima .follicle-svg .t.fo-row{font-size:12.5px;fill:var(--anatomy-text)}
.anima .follicle-svg .fo-b{font-weight:700;fill:var(--anatomy-strong)}
.anima .follicle-svg .t.fo-mn-t{font-size:12.5px;fill:var(--anatomy-strong);font-weight:600}
.anima .follicle-svg .t.fo-title{font-size:15px;font-weight:700}
.anima .follicle-svg .t.fo-ln{font-size:12.5px;fill:var(--anatomy-text)}
.anima .follicle-svg .fo-inset{fill:var(--surface);stroke:var(--anatomy-lo);stroke-width:1}
.anima .follicle-svg .t.fo-il{font-size:11.5px;fill:var(--anatomy-text)}
.anima .follicle-svg .fo-nd{fill:color-mix(in srgb,var(--bx-matrix) 80%,var(--surface));stroke:var(--anatomy-mid);stroke-width:1}
.anima .follicle-svg .fo-med{fill:none;stroke:var(--anatomy-lo);stroke-width:1;stroke-dasharray:2 3}
.anima .follicle-svg .fo-nf{fill:color-mix(in srgb,var(--bx-violet) 45%,var(--bx-matrix))}
.anima .follicle-svg .fo-nfc{fill:color-mix(in srgb,var(--bx-gold-soft) 70%,var(--bx-matrix))}
.anima .follicle-svg .fo-mcc{fill:color-mix(in srgb,var(--bx-blue-soft) 60%,var(--surface));stroke:var(--bx-cyto-line);stroke-width:.7}
.anima .follicle-svg .fo-mcn{fill:var(--bx-nuc);stroke:var(--bx-nuc-line);stroke-width:.5}
.anima .follicle-svg .fo-ep{fill:var(--bx-eosin);stroke:var(--bx-cyto-line);stroke-width:.6}
.anima .follicle-svg .fo-epn{fill:color-mix(in srgb,var(--bx-nuc) 70%,var(--bx-eosin))}
.anima .follicle-svg .fo-lum{fill:var(--bx-lumen);stroke:var(--bx-cyto-line);stroke-width:.8}
.anima .follicle-svg .fo-tumn{fill:var(--bx-nuc)}
@media (max-width:560px){.anima .follicle-svg .t.fo-zn{font-size:14.5px}.anima .follicle-svg .t.fo-ly{font-size:14px}.anima .follicle-svg .t.fo-h{font-size:12px}}
`,
  });
}
