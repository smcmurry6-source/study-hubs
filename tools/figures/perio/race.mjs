// Fig: the race for the space (Periodontology S6, Dr. Geurs's class, his slides and the exam-review guide).
// A buccolingual section through a cleaned intrabony defect beside a root, crown up, drawn to one scale (24 px = 1 mm;
// the crown, the apex and the far side run off the frame). The defect is 5 mm deep below its bony wall's crest, its wall
// at about 25 degrees to the root and about 3 mm wide at the crest (the notes: deeper than 3 mm and 25 degrees or less
// suit regeneration; the decision tree adds a graft or a reinforced membrane from 3 mm wide). The flap lies on the
// wall's outer surface and bridges the defect's opening to meet the root coronal to it.
// Three settings, as the notes give them:
//   no barrier: the flap's epithelium migrates down the root fastest, its connective tissue next, bone slowest; the site
//     heals as a long junctional epithelium with a little bone fill at the base (repair: open flap debridement);
//   GTR membrane: a barrier between the flap and the defect keeps the flap's epithelium and connective tissue out, and
//     the slow tissues (bone, and the ligament at the base) fill the space: new bone, new PDL, new cementum with
//     inserting fibers; the collagen membrane is bioabsorbed. With nothing under it, it sags into this wide defect;
//   graft under the membrane (combination therapy): the graft holds the space so the membrane can't collapse, and the
//     body remodels it as bone.
// The time slider runs from surgery to months; its fronts (epithelium fast, bone slow) are schematic. The class gives
// only comparisons for the timing (a skin cut heals in about a week, a broken leg in about six weeks), so the stages are
// named that way and called schematic in the sources. Thin layers (epithelium, PDL, cementum) are drawn thicker than
// true so they show. Painter's order does the clipping (no SVG ids): what fills the defect is drawn first, generously,
// and the tooth, the bone and the flap are drawn over it.
import { figureSvg, plateHtml } from "./shared.mjs";

const S = 24, W = 424, H = 372, X0 = 140, Y0 = 60, LX = 300;

/* the root's buccal surface (x in mm, + toward the flap) at d mm below the CEJ; above the CEJ, the crown's bulge */
export function rsXr(d) { if (d >= 0) return -.07 * d - .0045 * d * d; var u = Math.min(1, -d / 2.4); return .55 * Math.sin(u * Math.PI / 2); }
/* the inner surface of the defect's bony wall: from the PDL at the base (8.5 mm) to the crest (2.7 mm out, 3.5 mm deep) */
export function rsW(d) { return rsXr(d) + .3 + (2.7 - rsXr(3.5) - .3) * Math.pow(Math.max(0, (8.5 - d) / 5), .68); }
/* the wall's outer surface, which the flap lies on */
export function rsBo(d) { return 3.9 + .06 * (d - 3.6); }
export function rsSm(a, b, s) { var x = Math.max(0, Math.min(1, (s - a) / (b - a))); return x * x * (3 - 2 * x); }
export function rsEz(x) { return 1 - (1 - x) * (1 - x); }
/* mm points to a path in px */
export function rsP(D, pts, close) { var o = ""; for (var i = 0; i < pts.length; i++) o += (i ? "L" : "M") + Math.round((D.X0 + pts[i][0] * D.S) * 10) / 10 + " " + Math.round((D.Y0 + pts[i][1] * D.S) * 10) / 10; return o + (close ? "Z" : ""); }
/* the flap's inner surface: on the root from its margin, across the defect's opening (sagging by sag mm), over the
   crest and down the wall's outer surface */
export function rsCover(sag) {
  var c = [], r = [.3, .7, 1.1, 1.5, 1.85, 2.2, 2.45], i, u, d;
  for (i = 0; i < r.length; i++) c.push([rsXr(r[i]) + .01, r[i]]);
  c.push([rsXr(2.58) + .07, 2.58]);
  var x0 = rsXr(2.6) + .1, x1 = 2.78;
  for (i = 1; i <= 8; i++) { u = i / 8; c.push([x0 + (x1 - x0) * u, 2.62 + .66 * u + (.12 + sag) * Math.sin(Math.PI * u)]); }
  c.push([3.1, 3.3], [3.5, 3.33], [3.84, 3.46]);
  for (d = 3.75; d <= 13.8; d += .65) c.push([rsBo(d) - .03, d]);
  return c;
}
/* a line offset by t mm to the flap's side */
export function rsOff(c, t) {
  var o = [];
  for (var i = 0; i < c.length; i++) {
    var a = c[Math.max(0, i - 1)], b = c[Math.min(c.length - 1, i + 1)], tx = b[0] - a[0], td = b[1] - a[1], n = Math.sqrt(tx * tx + td * td) || 1;
    o.push([c[i][0] + td / n * t, c[i][1] - tx / n * t]);
  }
  return o;
}
/* a ligament band beside the root from a to b mm, with its fibers running from the root to the bone */
export function rsPdl(D, a, b) {
  var l = [], r = [], f = "", d, n = Math.max(2, Math.round((b - a) / .4));
  for (var i = 0; i <= n; i++) { d = a + (b - a) * i / n; l.push([rsXr(d), d]); r.unshift([rsXr(d) + .3, d]); }
  for (d = a + .2; d < b - .1; d += .5) f += "M" + Math.round((D.X0 + (rsXr(d) + .05) * D.S) * 10) / 10 + " " + Math.round((D.Y0 + (d + .05) * D.S) * 10) / 10 + "l5.3 -3.1";
  return '<path class="rs-pdl" d="' + rsP(D, l.concat(r), 1) + '"/><path class="rs-fib" d="' + f + '"/>';
}
export function rsCem(D, a, b) { var p = [], n = Math.max(2, Math.round((b - a) / .5)); for (var i = 0; i <= n; i++) { var d = a + (b - a) * i / n; p.push([rsXr(d) + .04, d]); } return '<path class="rs-cem" d="' + rsP(D, p, 0) + '"/>'; }
/* one graft particle: an irregular polygon */
export function rsBlob(D, g) {
  var p = [];
  for (var j = 0; j < 7; j++) { var h = Math.sin(g[3] * 12.99 + j * 78.23) * 43758.55, k = .78 + .34 * (h - Math.floor(h)), a = j / 7 * 2 * Math.PI + g[3]; p.push([g[0] + Math.cos(a) * g[2] * k, g[1] + Math.sin(a) * g[2] * k]); }
  return rsP(D, p, 1);
}
/* labels: sorted top to bottom, one slot each in the right-hand column, every leader ending on a dot on its part */
export function rsLab(L, D) {
  var o = "", i, ys = [], f = function (n) { return Math.round(n * 10) / 10; };
  L = L.map(function (l) { return [l[0].split("|"), D.X0 + l[1] * D.S, D.Y0 + l[2] * D.S]; });
  L.sort(function (a, b) { return a[2] - b[2]; });
  function h(j) { return (L[j][0].length - 1) * 13; }
  for (i = 0; i < L.length; i++) ys.push(Math.max(L[i][2] - h(i) / 2 + 4, i ? ys[i - 1] + h(i - 1) + 23 : 40));
  for (i = L.length - 1; i >= 0; i--) { var lim = i === L.length - 1 ? D.H - 8 - h(i) : ys[i + 1] - 23 - h(i); if (ys[i] > lim) ys[i] = lim; }
  for (i = 0; i < L.length; i++) {
    var l = L[i], y = ys[i];
    o += '<path class="rs-lead" d="M' + f(l[1]) + " " + f(l[2]) + "L" + (D.LX - 5) + " " + f(y + h(i) / 2 - 4) + '"/><circle class="rs-dot" cx="' + f(l[1]) + '" cy="' + f(l[2]) + '" r="2.2"/>';
    o += '<text class="rs-t" x="' + D.LX + '" y="' + f(y) + '">' + l[0].map(function (s, j) { return '<tspan x="' + D.LX + '" dy="' + (j ? 13 : 0) + '">' + s + "</tspan>"; }).join("") + "</text>";
  }
  return o;
}
export function rsStage(s) { return s < .07 ? 0 : s < .42 ? 1 : s < .8 ? 2 : 3; }
/* everything that changes with the setting (m: 0 no barrier, 1 GTR membrane, 2 graft under the membrane) and the time
   (s: 0 at surgery to 1, months later). The fronts: epithelium fast, the flap's connective tissue next, ligament and
   bone slow. Under a membrane the clot is repopulated by the ligament's cells. */
export function rsDyn(st, D) {
  var m = st.m, s = st.s, k = rsStage(s), Hh = D.HOT, T = D.TXT, f = function (n) { return Math.round(n * 100) / 100; };
  var sag = m === 1 ? .25 + .6 * rsSm(0, .3, s) : 0, C = rsCover(sag), fill = "", mid = "", lab = [], x, i, d;
  var E = m ? .3 + (D.ESTOP - .3) * rsEz(Math.min(1, s / .12)) : .3 + 7.2 * rsEz(Math.min(1, s / .3));
  var Bt = m ? 8.5 - (8.5 - (m === 2 ? 2.95 : 3.3)) * rsSm(.3, 1, s) : 8.5 - 1.1 * rsSm(.3, 1, s);
  var Pf = m ? 8.5 - 6.15 * rsSm(.2, .95, s) : 8.5 - 1.05 * rsSm(.3, 1, s);
  var q = m ? Math.round(100 * rsSm(.35, 1, s)) : 0;
  fill += '<g class="hot" data-info="' + (q > 60 ? Hh.npdl : Hh.clot) + '"><path style="fill:color-mix(in srgb, var(--rs-pdl) ' + q + '%, var(--rs-clot))" d="' + rsP(D, [[-1, 2.3], [3.05, 2.3], [3.05, 9], [-1.2, 9]], 1) + '"/></g>';
  if (!m && s > .02) {
    var cf = 2.5 + 5.6 * rsSm(.04, .68, s), ct = [[-1, 2.3], [3.05, 2.3]];
    for (x = 3.05; x >= -1.01; x -= .25) ct.push([x, cf + .16 * Math.sin(x * 3.7)]);
    fill += '<g class="hot" data-info="' + Hh.ct + '"><path class="rs-ct" d="' + rsP(D, ct, 1) + '"/></g>';
  }
  if (Bt < 8.45) {
    var xa = rsXr(Bt), xw = Bt > 3.5 ? rsW(Bt) : 2.75, bf = [];
    for (x = xa - .4; x <= 3.11; x += .2) bf.push([x, Bt + .45 * (1 - Math.max(0, Math.min(1, (x - xa) / (xw - xa))))]);
    bf.push([3.1, 9], [xa - .7, 9]);
    fill += '<g class="hot" data-info="' + (m ? Hh.nb : Hh.lb) + '"><path class="rs-nb" d="' + rsP(D, bf, 1) + '"/></g>';
  }
  if (m === 2) {
    var rm = rsSm(.45, 1, s), g = "";
    for (i = 0; i < D.GR.length; i++) g += rsBlob(D, D.GR[i]);
    fill += '<g class="hot rs-gr" data-info="' + (rm > .8 ? Hh.grafted : Hh.graft) + '" style="fill:color-mix(in srgb, var(--rs-nb) ' + Math.round(rm * 100) + '%, var(--rs-graft));stroke-opacity:' + f(1 - .7 * rm) + '"><path d="' + g + '"/></g>';
  }
  if (Pf < 8.45) { mid += '<g class="hot" data-info="' + Hh.npdl + '">' + rsPdl(D, Pf, 8.5) + "</g>"; if (m) mid += '<g class="hot" data-info="' + Hh.cem + '">' + rsCem(D, Pf, 8.5) + "</g>"; }
  mid += '<g class="hot" data-info="' + Hh.ct + '"><path class="rs-flap" d="' + rsP(D, C, 0) + D.OUTL + 'Z"/></g><g class="hot" data-info="' + Hh.epi + '"><path class="rs-oe" d="' + D.EPI + '"/></g>';
  if (m) {
    var seg = C.slice(D.MEM[0], D.MEM[1] + 1), a = rsOff(seg, .02), b = rsOff(seg, .32).reverse(), gone = s > .9;
    mid += '<g class="hot" data-info="' + (gone ? Hh.memGone : m === 1 && k ? Hh.memSag : Hh.mem) + '"><path class="rs-mem' + (gone ? " is-gone" : "") + '" style="opacity:' + f(1 - .7 * rsSm(.6, .95, s)) + '" d="' + rsP(D, a.concat(b), 1) + '"/></g>';
  }
  if (E > .4) {
    var el = [], er = [], n = Math.round((E - .3) / .25) + 2;
    for (i = 0; i <= n; i++) { d = .3 + (E - .3) * i / n; el.push([rsXr(d), d]); er.unshift([rsXr(d) + Math.max(.04, .26 * Math.min(1, (E - d) / .7)), d]); }
    mid += '<g class="hot" data-info="' + (m ? Hh.estop : k === 3 ? Hh.lje : Hh.epi) + '"><path class="rs-epi" d="' + rsP(D, el.concat(er), 1) + '"/></g>';
  }
  function cx(dd) { return (rsXr(dd) + .3 + (dd >= 3.5 ? rsW(dd) : 2.7)) / 2; }
  if (!k) lab.push([T.epi0, .55, -.1]);
  else if (!m) { d = Math.max(3.4, E - 1.2); lab.push([k === 3 ? T.lje : T.epi1, rsXr(d) + .13, d]); }
  else lab.push([T.estop, rsXr(D.ESTOP - .4) + .13, D.ESTOP - .4]);
  if (!m && k >= 2) lab.push([T.ct, cx(5.2), 5.2]); else lab.push([T.ct, 5, 9.7]);
  lab.push([T.wall, rsW(6.9) + .75, 6.9]);
  if (!k) lab.push([T.root, rsXr(4.6) - .3, 4.6]);
  if (m === 2) { if (k < 3) lab.push([T.graft, D.GRL[0], D.GRL[1]]); }
  else if (k < 2) lab.push([T.clot, cx(6.9), 6.9]);
  if (m) { var pm = rsOff(C.slice(D.MEMLAB - 1, D.MEMLAB + 2), .17)[1]; lab.push([[T.mem0, m === 1 ? T.mem1 : T.mem2, m === 1 ? T.mem1 : T.mem2, T.mem3][k], pm[0], pm[1]]); }
  if (!m || k < 2) lab.push([T.pdl0, rsXr(10.6) + .15, 10.6]);
  if (m && k >= 2) { d = k === 3 ? 6.4 : Math.min(7.7, Pf + 1); lab.push([k === 3 ? T.npdl : T.npdl2, rsXr(d) + .16, d]); if (k === 3) lab.push([T.cem, rsXr(4.7) + .04, 4.7]); }
  if (k >= 2) { if (m) { d = k === 3 ? 5.5 : Math.max(Bt + .9, 6.2); lab.push([k === 3 ? (m === 2 ? T.nb3g : T.nb3) : T.nb2, cx(d) + .25, d]); } else lab.push([k === 3 ? T.lb3 : T.lb2, cx(7.95) + .12, 7.95]); }
  return { fill: fill, mid: mid, lab: rsLab(lab, D) };
}

/* graft particles packed into the defect under the membrane (seeded, so the build is stable) */
function grafts() {
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const bridge = rsCover(0).slice(7, 17);
  const coverD = (x) => { for (let i = 1; i < bridge.length; i++) if (x <= bridge[i][0]) { const a = bridge[i - 1], b = bridge[i]; return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]); } return 3.3; };
  const out = [];
  for (let d = 2.95; d <= 8.3; d += .5) for (let x = -.2 + (Math.round(d * 2) % 2) * .28; x <= 2.7; x += .56) {
    const r = .2 + rnd() * .1, px = x + (rnd() - .5) * .16, pd = d + (rnd() - .5) * .16;
    const right = pd >= 3.5 ? rsW(pd) : 2.72;
    if (px < rsXr(pd) + .34 + r || px > right - r - .02 || pd < coverD(px) + r + .03 || pd > 8.45 - r) continue;
    out.push([+px.toFixed(2), +pd.toFixed(2), +r.toFixed(2), +(rnd() * 6).toFixed(2)]);
  }
  return out;
}

const D = {
  W, H, S, X0, Y0, LX, ESTOP: 1.72, MEM: [4, 23], MEMLAB: 12,
  TXT: {
    epi0: "flap epithelium", epi1: "epithelium, down|the root", lje: "long junctional|epithelium", estop: "epithelium stops|at the membrane",
    ct: "flap connective|tissue", wall: "bony wall", root: "root, scaled and|root planed", clot: "blood clot", graft: "bone graft",
    mem0: "GTR membrane|(collagen)", mem1: "membrane, sagging|into the defect", mem2: "membrane, held|up by the graft", mem3: "membrane,|absorbed",
    pdl0: "PDL at the base", npdl2: "new PDL and|cementum, climbing", npdl: "new PDL", cem: "new cementum,|inserting fibers",
    nb2: "new bone, slowly", nb3: "new bone", nb3g: "new bone, the|graft remodeled", lb2: "bone, slow, from|the base", lb3: "a little bone|fill at the base",
  },
  HOT: {
    tooth: "The tooth, cut through. The root beside the defect was scaled and root planed: it has to be clean before anything goes in.",
    bone: "The defect's bony wall. With the granulomatous tissue removed, the walls contribute to healing: more walls, a more contained defect and more bony surface to heal from.",
    pdl: "The ligament left at the base of the defect: a little ligament space, one of the slow tissues. Its cells can form new attachment.",
    clot: "The blood clot in the cleaned defect, protected by the flap. Whatever tissue is fastest in migrating into the defect wins the race for the space.",
    ct: "The flap's connective tissue (gingival connective tissue): slower than its epithelium, faster than bone. Without a barrier it grows into the defect; it doesn't form attached ligament.",
    epi: "The flap's epithelium: without a barrier it migrates straight down the root toward the bone, faster than anything else.",
    lje: "A long junctional epithelium against the root instead of new cementum with inserting ligament fibers: repair. A pocket lined by epithelium is a pocket again.",
    estop: "The flap's epithelium runs down the root only as far as the membrane's edge; below it the membrane keeps it off the root.",
    mem: "The GTR barrier membrane, between the flap and the defect: it keeps out the flap's epithelium and connective tissue, so bone and ligament can fill the space. Today's are collagen, bioabsorbed.",
    memSag: "With nothing under it, the membrane can collapse into the defect, leaving less space to fill. This defect is about 3 mm wide at its crest, where the decision tree adds a graft or uses a reinforced membrane.",
    memGone: "The collagen membrane is bioabsorbed: it stayed a while, influenced the healing and went away.",
    graft: "A bone graft (the patient's own bone, or a processed donor graft such as DFDBA): a scaffold for bone to grow over, holding the space so the membrane can't collapse into the defect.",
    grafted: "The graft, remodeled: the body recognizes it and remodels it as bone.",
    nb: "New bone: slow, but very predictable while the site is still. It grows in from the base and the bony walls.",
    lb: "A little bone fill at the base (most likely in the 3-wall part at the bottom). On the slide's studies, open flap debridement gained 0.7 to 1.2 mm of bone and 1.3 to 1.5 mm of CAL.",
    npdl: "New periodontal ligament, from the ligament cells at the base, between the new bone and the root.",
    cem: "New cementum with ligament fibers inserting into it: with new bone and new PDL, a new functional attachment apparatus. Only histology can prove it.",
  },
  SET: ["No barrier", "GTR membrane", "Graft + membrane"],
  TIME: ["at surgery", "about a week", "about six weeks", "months later"],
  TS: ["surgery", "a week", "six weeks", "months"],
  ROOT: [["a clean surface", "epithelium, moving down", "epithelium", "long junctional epithelium"], ["a clean surface", "a clean surface, protected", "new cementum, climbing", "new cementum, inserting fibers"]],
  RES: [["the race starts", "epithelium ahead", "epithelium winning", "repair"], ["the race starts", "slow tissues protected", "regenerating", "regeneration"]],
  SUM: [
    ["No barrier, at surgery: the granulomatous tissue is out, the root is planed clean, and the flap is sutured back over the defect, which fills with a blood clot. Whatever tissue migrates in fastest will win the race for the space.",
      "About a week: the flap's epithelium migrates straight down the root, faster than anything else, with the flap's connective tissue behind it. A cut in the skin is gone in about a week; bone has barely started.",
      "About six weeks: the epithelium is nearly at the base and the flap's connective tissue fills the defect. Bone heals slowly but predictably, like a broken leg in a cast, and has only begun at the base.",
      "Months later, repair: a long junctional epithelium lies against the root instead of new cementum with inserting fibers, with a little bone fill at the base. A pocket lined by epithelium is a pocket again. This is open flap debridement, the baseline (about 1.5 mm of CAL, 1 mm of bone) every regenerative therapy must beat."],
    ["GTR, at surgery: a barrier membrane goes between the flap and the cleaned defect, keeping out the flap's epithelium and connective tissue. Under it, in the clot, the slow tissues (bone and the bit of ligament at the base) have the space to themselves.",
      "About a week: the epithelium runs down the root only as far as the membrane's edge. With nothing under it, the membrane sags a little into this wide defect. Ligament cells from the base start up the root.",
      "About six weeks: new ligament climbs the root, laying down new cementum, and bone grows in slowly from the base and the walls. Collagen membranes stay a while, influence the healing and are bioabsorbed.",
      "Months later, regeneration: new bone, new PDL and new cementum with inserting fibers, a new functional attachment apparatus. The membrane is absorbed. The fill stops where the membrane sagged; a graft under it would have held the space."],
    ["Combination therapy, at surgery: a bone graft is packed into the defect and the membrane goes over it. The graft is a scaffold for bone, and it holds the space so the membrane can't collapse into the defect.",
      "About a week: the epithelium stops at the membrane's edge, and the graft keeps the membrane up. Like a broken bone, a defect heals when it is still.",
      "About six weeks: new bone forms around the graft particles from the base and the walls, new ligament and cementum climb the root, and the body remodels the graft as bone.",
      "Months later, regeneration across the whole defect, up to the membrane: new bone, new PDL and new cementum with inserting fibers. The membrane is absorbed and the graft remodeled as bone: the defect filled and leveled out."],
  ],
};
D.GR = grafts();
{ const g = D.GR.reduce((b, p) => (Math.abs(p[1] - 6) + Math.abs(p[0] - .9) < Math.abs(b[1] - 6) + Math.abs(b[0] - .9) ? p : b)); D.GRL = [g[0], g[1]]; }

/* px points to a smooth path (Catmull-Rom as cubic Bezier), rounded to whole px to keep the figure small */
const px = (p) => [X0 + p[0] * S, Y0 + p[1] * S];
function smoothPx(pts, closed) {
  const r = Math.round, n = pts.length, last = closed ? n : n - 1; let o = `M${r(pts[0][0])} ${r(pts[0][1])}`;
  for (let i = 0; i < last; i++) {
    let p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    if (!closed) { if (i === 0) p0 = p1; if (i + 2 >= n) p3 = p2; }
    o += `C${r(p1[0] + (p2[0] - p0[0]) / 6)} ${r(p1[1] + (p2[1] - p0[1]) / 6)} ${r(p2[0] - (p3[0] - p1[0]) / 6)} ${r(p2[1] - (p3[1] - p1[1]) / 6)} ${r(p2[0])} ${r(p2[1])}`;
  }
  return o + (closed ? "Z" : "");
}
/* the flap's outer surface (static) from the bottom up over the margin to its inner corner on the root, and the oral
   epithelium along it */
const C0 = rsCover(0)[0];
const OUTER = [[C0[0], C0[1]], [.05, -.05], [.3, -.26], [.66, -.21], [.95, .1], [1.17, .6], [1.4, 1.15], [1.8, 1.55], [2.5, 1.85], [3.3, 2.08], [4.1, 2.4], [4.8, 2.92], [5.3, 3.6], [5.56, 4.5], [5.68, 5.5], [5.8, 7.5], [5.98, 10], [6.2, 13.6]];
D.OUTL = smoothPx(OUTER.slice().reverse().map(px), false).replace(/^M/, "L");
const inset = rsOff(OUTER, -.13); inset[0] = [C0[0] + .1, C0[1] - .02];
D.EPI = smoothPx(inset.map(px), false);

/* the static parts: the far side's gingiva, bone and ligament; the tooth; the defect's bony wall and the ligament below
   its base */
function staticSvg() {
  const P = (pts, c) => rsP(D, pts, c), xl = (d) => -5 - rsXr(d), out = [];
  const range = (a, b, st) => { const r = []; for (let d = a; st > 0 ? d <= b + 1e-6 : d >= b - 1e-6; d += st) r.push(+d.toFixed(3)); return r; };
  const fibs = (x, a, b, sgn) => { let o = ""; for (let d = a; d < b; d += .5) { const p = px([x(d) + sgn * .05, d + .05]); o += `M${p[0].toFixed(1)} ${p[1].toFixed(1)}l${(sgn * .22 * S).toFixed(1)} -3.1`; } return o; };
  // the far side: gingiva above its crest, then bone and ligament (unlabeled context)
  const ling = [[xl(-1.1) - .05, -1.1], [xl(.2) - .02, .2], [xl(1.6) - .02, 1.6], [xl(1.9) - .45, 1.98], [-8, 2.6], [-8, 1.1], [-6.6, .45], [-5.9, -.35]];
  out.push(`<path class="rs-flap" d="${P(ling, 1)}"/><path class="rs-oe" d="${P([[xl(-1.1) - .1, -1.0], [-5.9, -.28], [-6.6, .52], [-8.2, 1.2]], 0)}"/>`);
  const lb = [[xl(1.95) - .3, 1.95], ...range(3.5, 14, 1.5).map((d) => [xl(d) - .3, d]), [-8, 14], [-8, 2.75], [xl(1.95) - 1.2, 2.2], [xl(1.95) - .6, 1.9]];
  const lp = [...range(1.95, 14, 1.5).map((d) => [xl(d), d]), ...range(14, 1.95, -1.5).map((d) => [xl(d) - .3, d])];
  out.push(`<path class="rs-bone" d="${P(lb, 1)}"/><path class="rs-pdl" d="${P(lp, 1)}"/><path class="rs-fib" d="${fibs(xl, 2.2, 13.6, -1)}"/>`);
  // the tooth: dentin, enamel, pulp
  const td = [-4.8, -3.2, -2.2, -1.5, -.9, -.4, 0, 1.5, 3.5, 6, 9, 11.5, 14];
  const tooth = [...td.map((d) => [rsXr(d), d]), ...td.slice().reverse().map((d) => [xl(d), d])];
  const te = (d) => 1.15 * Math.sin(Math.min(1, -d / 2.6) * Math.PI / 2), ed = [0, -.4, -.9, -1.5, -2.2, -3.2, -4.8];
  const enB = [...ed.map((d) => [rsXr(d), d]), ...ed.slice().reverse().map((d) => [rsXr(d) - te(d), d])];
  const enL = [...ed.map((d) => [xl(d), d]), ...ed.slice().reverse().map((d) => [xl(d) + te(d), d])];
  const hw = (d) => d < -2.6 ? 1.15 * Math.sqrt(Math.max(0, (d + 3.4) / .8)) : d < -1.1 ? 1.15 : d < .5 ? 1.15 - .65 * (d + 1.1) / 1.6 : .5 - .024 * (d - .5);
  const pd = [-3.4, -3.1, -2.6, -1.1, .5, 3, 7, 11, 14];
  const pulp = [...pd.map((d) => [-2.5 - hw(d), d]), ...pd.slice().reverse().map((d) => [-2.5 + hw(d), d])];
  out.push(`<g class="hot" data-info="${D.HOT.tooth}"><path class="rs-dent" d="${P(tooth, 1)}"/><path class="rs-enam" d="${P(enB, 1)}"/><path class="rs-enam" d="${P(enL, 1)}"/><path class="rs-pulp" d="${smoothPx(pulp.map(px), true)}"/>`);
  out.push(`<path class="rs-cem" d="${P(range(1.95, 14, 1.5).map((d) => [xl(d) - .04, d]), 0)}"/></g>`);
  // the defect's bony wall and the bone below it, and the ligament left at the base
  const bone = [[2.7, 3.5], ...range(4.1, 8.5, .55).map((d) => [rsW(d), d]), [rsW(8.5), 8.5], ...range(10, 14, 2).map((d) => [rsXr(d) + .3, d]), [rsBo(14), 14], [3.9, 3.6], [3.8, 3.46], [3.5, 3.34], [3.15, 3.31], [2.84, 3.37]];
  out.push(`<g class="hot" data-info="${D.HOT.bone}"><path class="rs-bone" d="${P(bone, 1)}"/></g>`);
  const bp = [...range(8.5, 14, 1.1).map((d) => [rsXr(d), d]), ...range(14, 8.5, -1.1).map((d) => [rsXr(d) + .3, d])];
  out.push(`<g class="hot" data-info="${D.HOT.pdl}"><path class="rs-pdl" d="${P(bp, 1)}"/><path class="rs-fib" d="${fibs(rsXr, 8.75, 13.8, 1)}"/>${rsCem(D, 8.5, 14)}</g>`);
  return out.join("");
}

const scale = `<path class="rs-scale" d="M${LX + 50} 18h${2 * S}M${LX + 50} 14v8M${LX + 50 + 2 * S} 14v8"/><text class="rs-t rs-small" x="${LX + 42}" y="22" text-anchor="end">2 mm</text>`;
const svg = figureSvg({ width: W, height: H, className: "rs-svg", label: "A section through a cleaned intrabony defect beside a root, with the flap over it: without a barrier, with a GTR membrane, or with a bone graft under the membrane, from surgery to months later. Labels name the tissues that fill the defect and line the root.",
  body: `<g class="rs-fill"></g>${staticSvg()}<g class="rs-mid"></g><g class="rs-lab"></g>${scale}` });
const plate = plateHtml({ fig: "S6 · Fig 1", title: "The race for the space", hint: "pick a setting · drag the time", readout: "No barrier · surgery", body: `<div class="am-svg rs-box">${svg}</div>` });
const controls = `<div class="am-controls" role="group" aria-label="Setting"><button type="button" class="am-btn" data-rsm="0" aria-pressed="true">No barrier</button><button type="button" class="am-btn" data-rsm="1" aria-pressed="false">GTR membrane</button><button type="button" class="am-btn" data-rsm="2" aria-pressed="false">Graft under the membrane</button></div>
<div class="am-controls"><label class="am-slider"><span>Time</span><input type="range" min="0" max="100" step="1" value="0" data-rst aria-label="Time after surgery"><b data-rsv>at surgery</b></label><button type="button" class="am-btn" data-rsplay aria-pressed="false">Run the race</button></div>
<div class="am-stats"><span>On the root <b data-rs="0"></b></span><span>Outcome <b data-rs="1"></b></span></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Tap a tissue (the flap, the clot, the bone, the root) to read what it is.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From Dr. Geurs's class, his slides and the exam-review guide: the race for the space (the flap's epithelium fastest, its connective tissue faster than bone, bone slow but predictable), repair as a long junctional epithelium, regeneration as new bone, new cementum and new PDL (the 1996 World Workshop's definition), the membrane between the flap and the defect, the graft that holds the space, collagen membranes that are bioabsorbed, and open flap debridement's numbers.</li>
<li>Outside sources: the four tissues competing to repopulate the root, and the idea that whichever gets there decides the attachment, are Melcher's (J Periodontol 1976;47:256-60). Healing by a long junctional epithelium after flap surgery without a barrier follows Caton, Nyman and Zander (J Clin Periodontol 1980;7:224-31). The barrier between the flap and the root, covering the defect and resting on the bone around it, and the new cementum with inserting fibers under it, follow Nyman, Lindhe, Karring and Rylander (J Clin Periodontol 1982;9:290-6), the first human case, with a laboratory filter, and Gottlow, Nyman, Lindhe, Karring and Wennstr&ouml;m (J Clin Periodontol 1986;13:604-16). The order of healing (epithelium first, bone and cementum over weeks to months) and why a membrane needs space under it follow Polimeni, Xiropaidis and Wikesj&ouml; (Periodontol 2000 2006;41:30-47).</li>
<li>A schematic, drawn to one scale (the 2 mm bar), with the epithelium, ligament and cementum drawn thicker than true so they show. The timing is schematic: "about a week" and "about six weeks" are the class's comparisons (a cut in the skin, a broken leg in a cast), not times measured in a defect. How far each tissue gets, how much the membrane sags and the graft particles are illustrative, and the little recession a flap leaves isn't drawn. Educational, not medical advice.</li></ul></details>`;

function rsLive(root, D) {
  var svg = root.querySelector(".rs-svg"), gFill = svg.querySelector(".rs-fill"), gMid = svg.querySelector(".rs-mid"), gLab = svg.querySelector(".rs-lab");
  var sum = root.querySelector(".am-summary"), info = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]");
  var range = root.querySelector("[data-rst]"), val = root.querySelector("[data-rsv]"), play = root.querySelector("[data-rsplay]");
  var st = { m: 0, s: 0 }, raf = 0, lastK = -1, lastM = -1;
  function draw() {
    var k = D.rsStage(st.s), o = D.rsDyn(st, D), t = D.TIME[k];
    gFill.innerHTML = o.fill; gMid.innerHTML = o.mid; gLab.innerHTML = o.lab;
    range.value = String(Math.round(st.s * 100)); range.setAttribute("aria-valuetext", t); val.textContent = t;
    if (readout) readout.textContent = D.SET[st.m] + " · " + D.TS[k];
    if (k !== lastK || st.m !== lastM) {
      sum.textContent = D.SUM[st.m][k];
      var a = root.querySelector('[data-rs="0"]'), b = root.querySelector('[data-rs="1"]');
      if (a) a.textContent = D.ROOT[st.m ? 1 : 0][k]; if (b) b.textContent = D.RES[st.m ? 1 : 0][k];
      lastK = k; lastM = st.m;
    }
    root.querySelectorAll("[data-rsm]").forEach(function (x) { x.setAttribute("aria-pressed", String(x.getAttribute("data-rsm") === String(st.m))); });
  }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; play.setAttribute("aria-pressed", "false"); }
  root.querySelectorAll("[data-rsm]").forEach(function (x) { x.addEventListener("click", function () { st.m = +x.getAttribute("data-rsm"); draw(); }); });
  range.addEventListener("input", function () { stop(); st.s = +range.value / 100; draw(); });
  play.addEventListener("click", function () {
    if (raf) { stop(); return; }
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) { st.s = 1; draw(); return; }
    var s0 = st.s > .98 ? 0 : st.s, t0 = 0;
    play.setAttribute("aria-pressed", "true");
    function step(ts) { if (!t0) t0 = ts; st.s = Math.min(1, s0 + (ts - t0) / 6000); draw(); if (st.s < 1) raf = requestAnimationFrame(step); else stop(); }
    raf = requestAnimationFrame(step);
  });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && svg.contains(el)) info.textContent = el.getAttribute("data-info"); }
  svg.addEventListener("pointerover", hot); svg.addEventListener("click", hot);
  draw();
}

const DARK = "--rs-enamel:#e4ddd0;--rs-dentin:#b9a27c;--rs-line:#8a7552;--rs-cem:#e0bd82;--rs-epi:#cf9bd2;--rs-clot:#c0384b;--rs-pdl:#6a4b3e;--rs-pdl-line:#d6a888;--rs-nb:#62584a;--rs-mem:#2c3e57;--rs-mem-line:#8ab2e6;--rs-graft:#a39780";
const CSS = `
.anima .rs-box{max-width:540px;margin:0 auto}
.anima .rs-svg .rs-t{fill:var(--anatomy-strong);font:600 11px var(--anatomy-mono)}
.anima .rs-svg .rs-small{font-weight:400;fill:var(--anatomy-muted)}
.anima .rs-svg .rs-lead{fill:none;stroke:var(--anatomy-mid);stroke-width:.8}
.anima .rs-svg .rs-dot{fill:var(--anatomy-strong);stroke:var(--surface);stroke-width:1}
.anima .rs-svg .rs-dent{fill:var(--rs-dentin);stroke:var(--rs-line);stroke-width:1}
.anima .rs-svg .rs-enam{fill:var(--rs-enamel);stroke:var(--rs-line);stroke-width:.8;stroke-linejoin:round}
.anima .rs-svg .rs-pulp{fill:color-mix(in srgb, var(--pd-red) 45%, var(--rs-dentin));stroke:var(--pd-red-line);stroke-width:.6}
.anima .rs-svg .rs-bone{fill:var(--pd-bone);stroke:var(--pd-bone-line);stroke-width:1.1;stroke-linejoin:round}
.anima .rs-svg .rs-nb{fill:var(--rs-nb);stroke:var(--pd-bone-line);stroke-width:.9;stroke-dasharray:3 2}
.anima .rs-svg .rs-ct{fill:var(--pd-gum)}
.anima .rs-svg .rs-flap{fill:var(--pd-gum);stroke:var(--pd-gum-line);stroke-width:.9;stroke-linejoin:round}
.anima .rs-svg .rs-oe{fill:none;stroke:var(--rs-epi);stroke-width:6;stroke-linejoin:round;stroke-linecap:round}
.anima .rs-svg .rs-epi{fill:var(--rs-epi)}
.anima .rs-svg .rs-pdl{fill:var(--rs-pdl);stroke:var(--rs-pdl-line);stroke-width:.6}
.anima .rs-svg .rs-fib{fill:none;stroke:var(--rs-pdl-line);stroke-width:.8}
.anima .rs-svg .rs-cem{fill:none;stroke:var(--rs-cem);stroke-width:2.6;stroke-linecap:round}
.anima .rs-svg .rs-mem{fill:var(--rs-mem);stroke:var(--rs-mem-line);stroke-width:1.1;stroke-linejoin:round}
.anima .rs-svg .rs-mem.is-gone{fill:none;stroke-dasharray:3 3}
.anima .rs-svg .rs-gr path{stroke:var(--pd-bone-line);stroke-width:.8;stroke-linejoin:round}
.anima .rs-svg .rs-scale{fill:none;stroke:var(--anatomy-mid);stroke-width:1.2}
.anima[data-anima="race"]{--rs-enamel:#fbf8f2;--rs-dentin:#dcc6a1;--rs-line:#a8916a;--rs-cem:#94703c;--rs-epi:#8a4f8f;--rs-clot:#c9505f;--rs-pdl:#f4dcc8;--rs-pdl-line:#bf8a6a;--rs-nb:#f8eed6;--rs-mem:#cddcf0;--rs-mem-line:#2e62a0;--rs-graft:#fffaf0}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]) .anima[data-anima="race"]{${DARK}} }
:root[data-theme="dark"] .anima[data-anima="race"]{${DARK}}
`;

export function race() {
  return { id: "race", lec: "periodontal-regeneration", title: "The race for the space",
    caption: "What reaches the cleaned root first decides how an intrabony defect heals: the flap's epithelium is fastest, bone slowest. With no barrier, a GTR membrane, or a graft under the membrane. From Dr. Geurs's class and slides.",
    html: `<div class="anima" data-anima="race">${plate}${controls}${SOURCES}</div>`, css: CSS, live: rsLive.toString(),
    helpers: [rsXr, rsW, rsBo, rsSm, rsEz, rsP, rsCover, rsOff, rsPdl, rsCem, rsBlob, rsLab, rsStage, rsDyn], data: D };
}
