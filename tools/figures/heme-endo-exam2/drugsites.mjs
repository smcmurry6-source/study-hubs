// Fig 1: where each diabetes drug acts (L11 Pharmacology of Diabetes, Dr. Fasinu, recording and slides). A schematic
// front view of the body (patient's right on the viewer's left) with the organs the lecture puts a drug on: brain
// (hindbrain), stomach, liver, pancreas, small intestine, kidneys and bladder, skeletal muscle and fat. Pick a class: its
// sites light up, a zoom panel underneath animates the mechanism he teaches (the K-ATP channel closing, GLUT4 moving to
// the membrane, PPAR-gamma, the brush border enzyme blocked, incretin breakdown blocked, glucose left in the filtrate),
// and the side column gives the route, the hypoglycemia risk and weight effect in his words. Only the classes on his
// slides with a mechanism are drawn (bromocriptine is only named in his class list). Schematic, not to scale.
import { makeFig, f1, T, L, HOT } from "./shared.mjs";

/* smooth path through points (Catmull-Rom as cubic Bezier) */
function dsSm(p, c) {
  var n = p.length, d = "M" + f1(p[0][0]) + " " + f1(p[0][1]), last = c ? n : n - 1, i, a, b, e, g;
  for (i = 0; i < last; i++) {
    a = p[(i - 1 + n) % n]; b = p[i]; e = p[(i + 1) % n]; g = p[(i + 2) % n];
    if (!c) { if (i === 0) a = b; if (i + 2 >= n) g = e; }
    d += "C" + f1(b[0] + (e[0] - a[0]) / 6) + " " + f1(b[1] + (e[1] - a[1]) / 6) + " " + f1(e[0] - (g[0] - b[0]) / 6) + " " + f1(e[1] - (g[1] - b[1]) / 6) + " " + f1(e[0]) + " " + f1(e[1]);
  }
  return d + (c ? "Z" : "");
}
/* the point a fraction u along a polyline */
function dsAt(p, u) {
  var Ls = [], tot = 0, i, s;
  for (i = 1; i < p.length; i++) { var dd = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); Ls.push(dd); tot += dd; }
  s = Math.max(0, Math.min(1, u)) * tot;
  for (i = 0; i < Ls.length; i++) { if (s <= Ls[i] || i === Ls.length - 1) { var w = Ls[i] ? Math.min(1, s / Ls[i]) : 0; return [p[i][0] + (p[i + 1][0] - p[i][0]) * w, p[i][1] + (p[i + 1][1] - p[i][1]) * w]; } s -= Ls[i]; }
  return p[p.length - 1];
}
/* n dots riding a polyline, one lap per `per` ms; they fade in and out at the ends */
function dsFlow(p, n, per, t, cls, r, off, lvl) {
  var o = "", i, u, q, a;
  if (lvl !== undefined && lvl <= 0.02) return "";
  for (i = 0; i < n; i++) {
    u = (((t / per) + i / n + (off || 0)) % 1 + 1) % 1; q = dsAt(p, u);
    a = Math.min(1, u * 8, (1 - u) * 8) * (lvl === undefined ? 1 : lvl);
    o += '<circle class="' + cls + '" cx="' + f1(q[0]) + '" cy="' + f1(q[1]) + '" r="' + (r || 2.6) + '" opacity="' + f1(a) + '"/>';
  }
  return o;
}
/* a small drug molecule (diamond) */
function dsDia(x, y, s, op) { s = s || 4.5; return '<path class="ds-drug" d="M' + f1(x) + " " + f1(y - s) + "L" + f1(x + s) + " " + f1(y) + "L" + f1(x) + " " + f1(y + s) + "L" + f1(x - s) + " " + f1(y) + 'Z"' + (op !== undefined ? ' opacity="' + f1(op) + '"' : "") + "/>"; }
/* a glucose ring (hexagon) */
function dsHex(x, y, r, op) { var d = "", k; for (k = 0; k < 6; k++) { var a = Math.PI / 6 + k * Math.PI / 3; d += (k ? "L" : "M") + f1(x + r * Math.cos(a)) + " " + f1(y + r * Math.sin(a)); } return '<path class="ds-hex" d="' + d + 'Z"' + (op !== undefined ? ' opacity="' + f1(op) + '"' : "") + "/>"; }

/* ---------------- the body map (top left) ---------------- */
function dsBody(lv, st, D) {
  var o = "", t = st.t || 0, B = D.BODY, mir = function (p) { return p.map(function (q) { return [280 - q[0], q[1]]; }); };
  function glow(d, k) { return k > 0.02 ? '<path class="ds-halo" d="' + d + '" opacity="' + f1(k * (0.55 + 0.25 * Math.sin(t / 420))) + '"/><path class="ds-lit" d="' + d + '" opacity="' + f1(k) + '"/>' : ""; }
  /* arms behind the torso, then the torso; the legs run off the bottom */
  var side = B.SIDE, sideL = mir(side).reverse();
  var torso = dsSm(side, false) + "L146 332L140 304L134 332L" + f1(sideL[0][0]) + " " + f1(sideL[0][1]) + dsSm(sideL, false).replace(/^M[^C]*/, "") + "Z";
  o += '<path class="ds-skin" d="' + torso + '"/><path class="ds-skin" d="M131 60L131 80L149 80L149 60Z"/><ellipse class="ds-skin" cx="140" cy="40" rx="23" ry="28"/>';
  /* brain, with the hindbrain (brainstem and cerebellum) at its base */
  var hind = "M136 47C135 56 137 64 139 70L143 70C145 62 146 55 145 47Z", cereb = "M144 46C150 44 157 46 158 50C157 54 151 55 146 53Z";
  o += HOT(D.INFO.brain, '<ellipse class="ds-brain" cx="140" cy="34" rx="18" ry="15"/><path class="ds-gyri" d="M127 30C131 25 136 31 140 26C144 31 149 25 153 30M126 38C131 34 135 40 140 35C145 40 149 34 154 38"/>' +
    '<path class="ds-hind" d="' + hind + '"/><path class="ds-hind" d="' + cereb + '"/>' + glow("M122 34C122 22 158 22 158 34C158 44 148 49 140 49C132 49 122 44 122 34Z", lv.brain) + glow(hind + cereb, lv.brain));
  /* esophagus to the stomach */
  o += '<path class="ds-tube-o" d="M140 70L140 100L156 126"/><path class="ds-tube-i" d="M140 70L140 100L156 126"/>';
  /* kidneys, ureters and bladder (behind the gut) */
  function bean(cx, cy, s) { return dsSm([[cx, cy - 15], [cx + s * 8, cy - 12], [cx + s * 9, cy], [cx + s * 8, cy + 12], [cx, cy + 15], [cx - s * 5, cy + 10], [cx - s * 3, cy + 2], [cx - s * 3, cy - 3], [cx - s * 5, cy - 10]], true); }
  var kL = bean(93, 210, -1), kR = bean(187, 203, 1);
  o += '<path class="ds-ure" d="M97 214Q110 246 136 284M183 207Q170 246 144 284"/>';
  o += HOT(D.INFO.kidney, '<path class="ds-kid" d="' + kL + '"/><path class="ds-kid" d="' + kR + '"/>' + glow(kL, lv.kid) + glow(kR, lv.kid));
  o += HOT(D.INFO.bladder, '<ellipse class="ds-blad" cx="140" cy="289" rx="12" ry="9"/>' + glow("M128 289A12 9 0 1 0 152 289A12 9 0 1 0 128 289Z", lv.blad));
  /* small intestine, a coiled tube from the duodenum */
  var gut = dsSm(B.GUT, false);
  o += HOT(D.INFO.gut, '<path class="ds-tube-o ds-gut-o" d="' + gut + '"/><path class="ds-tube-i ds-gut-i" d="' + gut + '"/>' + (lv.gut > 0.02 ? '<path class="ds-gutlit" d="' + gut + '" opacity="' + f1(lv.gut * (0.55 + 0.25 * Math.sin(t / 420))) + '"/>' : ""));
  /* duodenum and pancreas (behind the stomach) */
  o += '<path class="ds-tube-o" d="M152 177Q116 174 108 190Q104 204 140 206"/><path class="ds-tube-i" d="M152 177Q116 174 108 190Q104 204 140 206"/>';
  var panc = dsSm(B.PANC, true);
  o += HOT(D.INFO.panc, '<path class="ds-panc" d="' + panc + '"/><path class="ds-lob" d="M126 186C130 182 134 190 138 185M150 186C154 181 158 189 162 183M174 181C178 176 182 184 186 178"/>' + glow(panc, lv.panc));
  /* stomach, then the liver over its left lobe */
  var stom = dsSm(B.STOM, true), liv = dsSm(B.LIV, true);
  o += HOT(D.INFO.stom, '<path class="ds-stom" d="' + stom + '"/><path class="ds-rugae" d="M166 140C172 146 176 152 175 160M184 132C190 142 192 152 188 164"/>' + glow(stom, lv.stom));
  o += HOT(D.INFO.liv, '<path class="ds-liv" d="' + liv + '"/><path class="ds-lob ds-lobl" d="M134 120C132 132 128 142 122 152"/>' + glow(liv, lv.liv));
  /* fat (a fat pad in the right flank: the injection site) and muscle (the thigh) */
  var fat = dsSm(B.FAT, true), mus = dsSm(B.MUS, false) + "Z";
  var cells = ""; [[190, 238], [197, 247], [189, 252], [196, 259], [190, 266], [195, 270]].forEach(function (c) { cells += '<circle class="ds-adip" cx="' + c[0] + '" cy="' + c[1] + '" r="4"/>'; });
  o += HOT(D.INFO.fat, '<path class="ds-fat" d="' + fat + '"/>' + cells + glow(fat, lv.fat));
  var stri = ""; for (var sx = 156; sx < 196; sx += 6) stri += "M" + sx + " " + (sx < 170 ? 299 : 294) + "L" + (sx - 3) + " 331";
  o += HOT(D.INFO.mus, '<path class="ds-mus" d="' + mus + '"/><path class="ds-stri" d="' + stri + '"/>' + glow(mus, lv.mus));
  /* organ names: on the organ where they fit, otherwise beside the body */
  o += T(112, 147, "liver", "s ds-on", "middle") + T(180, 152, "stomach", "s ds-on", "middle");
  o += L(110, 24, "brain", 124, 30, "end") + L(72, 192, "pancreas", 113, 187, "end") + L(72, 218, "kidney", 84, 214, "end") + L(72, 250, "gut", 105, 247, "end");
  o += L(214, 284, "fat", 199, 270, "start") + L(214, 320, "muscle", 196, 316, "start") + L(72, 296, "bladder", 128, 291, "end");
  return o;
}

/* what moves in the body for each drug */
function dsBodyFlow(st, lv, D) {
  var o = "", t = st.t || 0, d = st.d, F = D.PATHS;
  function inflow(cx, cy, cls, per, n, R) { var s = "", i; for (i = 0; i < n; i++) { var u = ((t / per + i / n) % 1), a = i * 2.4; s += '<circle class="' + cls + '" cx="' + f1(cx + Math.cos(a) * R * (1 - u)) + '" cy="' + f1(cy + Math.sin(a) * R * 0.7 * (1 - u)) + '" r="2.2" opacity="' + f1(Math.min(1, u * 5, (1 - u) * 5)) + '"/>'; } return s; }
  function syringe(on) { if (on < 0.02) return ""; var g = '<g class="ds-syr" opacity="' + f1(on) + '"><path class="ds-needle" d="M200 250L214 244"/><path class="ds-barrel" d="M213 240.5L241 228.5L244.5 236.5L216.5 248.5Z"/><path class="ds-needle" d="M243 232L254 227M252 222L256 231"/></g>'; return HOT("Injected under the skin (subcutaneous), into the fat: insulin, the GLP-1 agonists (oral semaglutide is the exception) and pramlintide are the parenteral drugs on his route summary.", g); }
  if (d === "ins") { o += syringe(1) + dsFlow(F.FAT_LIV, 6, 2600, t, "ds-ins", 2.6) + dsFlow(F.FAT_MUS, 4, 1800, t, "ds-ins", 2.6) + inflow(172, 314, "ds-glu", 1600, 6, 26) + inflow(193, 252, "ds-glu", 1700, 5, 22); }
  if (d === "su" || d === "meg") { var on = d === "meg" ? (0.5 + 0.5 * Math.cos(t / 900)) : 1; o += dsFlow(F.PAN_LIV, 5, 2400, t, "ds-ins", 2.6, 0, on) + dsFlow(F.PAN_MUS, 6, 3000, t, "ds-ins", 2.6, 0, on) + dsFlow(F.PAN_FAT, 4, 2200, t, "ds-ins", 2.6, 0, on); }
  if (d === "met") { o += dsFlow(F.LIV_OUT, 2, 3600, t, "ds-glu", 2.6, 0, 0.6) + '<g class="ds-stop"><circle cx="92" cy="138" r="7"/><path d="M88.5 138H95.5"/></g>' + inflow(172, 314, "ds-glu", 2400, 4, 24) + dsFlow(F.GUT_OUT, 2, 5200, t, "ds-glu", 2.4, 0, 0.7); }
  if (d === "tzd") { o += inflow(193, 252, "ds-fa", 1500, 7, 24) + inflow(172, 314, "ds-glu", 2400, 4, 24); }
  if (d === "agi" || d === "resin") {
    for (var c = 0; c < 3; c++) { var u = ((t / 7000 + c / 3) % 1), q = dsAt(D.BODY.GUT, u), q2 = dsAt(D.BODY.GUT, Math.max(0, u - 0.02)); o += '<path class="ds-chain" d="M' + f1(q2[0]) + " " + f1(q2[1]) + "L" + f1(q[0]) + " " + f1(q[1]) + '" opacity="' + f1(Math.min(1, u * 8, (1 - u) * 8)) + '"/>'; }
    if (d === "resin") o += '<g class="ds-q"><circle cx="118" cy="252" r="8"/><text x="118" y="256" text-anchor="middle">?</text></g>';
  }
  if (d === "glp1" || d === "amy") o += syringe(1);
  if (d === "glp1") o += dsFlow(F.PAN_LIV, 4, 2600, t, "ds-ins", 2.6) + dsFlow(F.PAN_MUS, 4, 3000, t, "ds-ins", 2.6) + dsFlow(F.FAT_PAN, 4, 2600, t, "ds-drug-dot", 2.4) + dsFlow(F.STOM_SLOW, 3, 9000, t, "ds-food", 3);
  if (d === "dpp4") { o += dsFlow(F.GUT_PAN, 5, 2600, t, "ds-glp", 2.8) + '<g class="hot" data-info="DPP-4, the enzyme that breaks down your own incretins (GLP-1, GIP). The inhibitor blocks it, so the incretins you release after a meal last longer."><path class="ds-dpp" d="M158 212A7 7 0 1 1 158 222L152 217Z"/>' + dsDia(152, 217, 3.6) + "</g>" + dsFlow(F.PAN_LIV, 4, 2600, t, "ds-ins", 2.6); }
  if (d === "amy") o += dsFlow(F.FAT_BRAIN, 6, 4200, t, "ds-drug-dot", 2.4) + dsFlow(F.STOM_SLOW, 3, 9000, t, "ds-food", 3);
  if (d === "sglt2") o += dsFlow(F.URE_L, 4, 2600, t, "ds-glu", 2.6) + dsFlow(F.URE_R, 4, 2600, t, "ds-glu", 2.6, 0.5);
  /* the zoom ring on the main site */
  var Z = D.RING[D.DRUGS[d].zoom];
  Z.forEach(function (z) { o += '<circle class="ds-ring" cx="' + z[0] + '" cy="' + z[1] + '" r="' + z[2] + '"/>'; });
  return o;
}

/* ---------------- the side column: route, hypoglycemia, weight, watch for ---------------- */
function dsCol(st, D) {
  var g = D.DRUGS[st.d], o = "", x = 286, i;
  o += T(x, 30, g.name, "b ds-big" + (g.name.length > 17 ? " ds-long" : ""), "start");
  g.ex.forEach(function (s, k) { o += T(x, 47 + k * 14, s, "s mut", "start"); });
  var y = 104;
  o += T(x, y, "ROUTE", "s ds-cap", "start") + T(x, y + 17, g.route, "ds-val", "start");
  y = 148;
  o += T(x, y, "HYPOGLYCEMIA", "s ds-cap", "start");
  var lab = ["none", "low", "yes", "high"];
  for (i = 0; i < 4; i++) {
    var on = g.hypo >= 0 && i <= g.hypo, cur = g.hypo === i;
    o += '<rect class="ds-seg' + (on ? " ds-seg-" + g.hypo : "") + '" x="' + (x + i * 46) + '" y="' + (y + 8) + '" width="42" height="12" rx="3"/>' + T(x + i * 46 + 21, y + 33, lab[i], "s" + (cur ? " b" : " mut"), "middle");
  }
  o += T(x, y + 52, g.hypoTxt, "ds-val", "start");
  y = 226;
  o += T(x, y, "WEIGHT", "s ds-cap", "start") + T(x, y + 17, g.weight, "ds-val" + (g.weight === "not covered" ? " mut" : ""), "start");
  y = 266;
  o += T(x, y, "WATCH FOR", "s ds-cap", "start");
  g.watch.forEach(function (s, k) { o += T(x, y + 17 + k * 15, s, "s", "start"); });
  return o;
}

/* ---------------- the zoom panels (bottom), drawn in local coords 0..460 x 0..246 ---------------- */
function dsPanel(st, D) {
  var g = D.DRUGS[st.d], k = g.zoom, t = st.t || 0, o = "", d = st.d;
  o += '<rect class="ds-pan" x="0" y="0" width="460" height="246" rx="10"/>';
  function cap(y) { return '<path class="vessel" d="M1 ' + y + 'H459V' + (y + 26) + 'H1Z"/>'; }
  function rbcs(y, per) { var s = "", i; for (i = 0; i < 7; i++) { var x = ((t / per + i / 7) % 1) * 480 - 10; s += '<ellipse class="ds-rbc" cx="' + f1(x) + '" cy="' + (y + 13) + '" rx="6" ry="3.6" opacity="' + f1(Math.max(0, Math.min(1, (x - 8) / 24, (452 - x) / 24)) * 0.75) + '"/>'; } return s; }
  if (k === "beta") {
    /* a meal cycle: glucose high after a meal, low between meals (reduced motion: after a meal) */
    var ph = ((t / 8000) % 1 + 1) % 1, meal = ph < 0.5, gl = d === "glp1" || d === "dpp4", i;
    var bound = d === "su" || (d === "meg" && meal), dep = bound || (gl && meal), rel = dep ? 1 : 0.1;
    o += cap(214) + rbcs(214, 9000) + T(452, 232, "capillary", "s ds-onv", "end");
    o += dsFlow([[-10, 221], [470, 221]], 8, 6000, t, "ds-glu", 2.4, 0, meal ? 1 : 0.18);
    var note = d === "su" ? (meal ? "insulin released" : "release goes on: hypo risk") : d === "meg" ? (meal ? "dosed with the meal" : "off fast: release stops") : d === "dpp4" ? (meal ? "your GLP-1 survives DPP-4" : "glucose low: release stops") : (meal ? "glucose high: insulin out" : "glucose low: release stops");
    o += '<rect class="ds-chip' + (meal ? "" : " ds-chip-lo") + '" x="258" y="2" width="198" height="38" rx="9"/>' + T(357, 17, meal ? "after a meal: glucose ↑" : "between meals: glucose ↓", "s ds-onv b", "middle") + T(357, 33, note, "s ds-onv " + (d === "su" && !meal ? "bad" : "ok"), "middle");
    /* alpha cell */
    o += HOT("Alpha cell: makes glucagon. GLP-1 (from a GLP-1 agonist, or your own when a DPP-4 inhibitor protects it) decreases glucagon release.", '<ellipse class="ds-alpha" cx="62" cy="82" rx="40" ry="36"/><ellipse class="nuc" cx="56" cy="78" rx="13" ry="11"/>' + [[36, 68], [46, 102], [78, 60], [86, 92], [70, 106], [36, 90], [84, 76]].map(function (p) { return '<circle class="ds-gcg" cx="' + p[0] + '" cy="' + p[1] + '" r="3.2"/>'; }).join(""));
    o += dsFlow([[84, 110], [100, 160], [108, 214]], 3, 2600, t, "ds-gcg", 2.6, 0, gl ? 0.25 : 1);
    o += T(40, 140, "alpha cell", "s b", "middle") + T(40, 154, gl ? "glucagon ↓" : "glucagon", "s" + (gl ? " ok" : " mut"), "middle");
    /* beta cell */
    var bx0 = 250, by0 = 120, brx = 104, bry = 80;
    o += HOT("Beta cell: makes insulin and releases it from granules. The insulin secretagogues (sulfonylureas, meglitinides) squeeze out insulin it has already made, so they need a working pancreas.", '<ellipse class="cyto" cx="' + bx0 + '" cy="' + by0 + '" rx="' + brx + '" ry="' + bry + '"/><ellipse class="nuc" cx="232" cy="98" rx="24" ry="20"/><circle class="ds-nucleolus" cx="238" cy="94" r="5"/>');
    o += '<ellipse class="ds-mem' + (dep ? " ds-dep" : "") + '" cx="' + bx0 + '" cy="' + by0 + '" rx="' + brx + '" ry="' + bry + '"/>';
    o += T(196, 68, "beta cell", "b", "middle") + T(200, 152, dep ? "depolarized" : "resting", "s" + (dep ? " hot-t" : " mut"), "middle");
    /* insulin granules slide to the membrane and empty into the capillary while the cell is driven */
    for (i = 0; i < 9; i++) {
      var gx = 270 + (i % 3) * 16 + (i > 5 ? 6 : 0), gy = 154 + Math.floor(i / 3) * 12, u = rel > 0.2 ? ((t / 2400 + i / 9) % 1) : 0, yy = gy + u * (194 - gy), fo = 1 - Math.max(0, u - 0.8) * 5;
      o += '<circle class="ds-gran" cx="' + f1(gx) + '" cy="' + f1(yy) + '" r="5.3" opacity="' + f1(fo) + '"/><circle class="ins" cx="' + f1(gx) + '" cy="' + f1(yy) + '" r="2.3" opacity="' + f1(fo) + '"/>';
    }
    o += dsFlow([[290, 198], [294, 226], [330, 227], [470, 227]], 7, 3000, t, "ds-ins", 2.6, 0, rel);
    o += T(292, 140, "insulin granules", "s", "middle");
    /* K-ATP channel with its SUR, on the left membrane */
    var kx = 146, ky = 120;
    o += HOT("K-ATP channel with its sulfonylurea receptor (SUR). Open, potassium leaves and the cell stays polarized. Sulfonylureas and meglitinides bind the SUR and close it (meglitinides share 2 binding sites with the sulfonylureas and have 1 of their own). After a meal, glucose closes it too.",
      '<rect class="ds-chan" x="' + (kx - 6) + '" y="' + (ky - 15) + '" width="12" height="11" rx="2"/><rect class="ds-chan" x="' + (kx - 6) + '" y="' + (ky + 4) + '" width="12" height="11" rx="2"/>' +
      '<path class="ds-gate' + (dep ? " ds-shut" : "") + '" d="M' + (kx - 7) + " " + ky + "H" + (kx + 7) + '" opacity="' + (dep ? 1 : 0.15) + '"/><rect class="ds-sur" x="' + (kx - 26) + '" y="' + (ky - 9) + '" width="18" height="18" rx="6"/>' + T(kx - 17, ky + 4, "S", "s ds-onsur", "middle"));
    if (bound) o += dsDia(kx - 17, ky - 14, 4.5) + dsDia(kx - 25, ky + 13, 4.5, 0.85);
    if (!dep) o += dsFlow([[kx + 16, ky], [kx - 6, ky], [kx - 34, ky + 30], [kx - 60, ky + 52]], 4, 1800, t, "ds-k", 3);
    else for (i = 0; i < 6; i++) o += '<circle class="ds-k" cx="' + f1(kx + 14 + (i % 3) * 9 + Math.sin(t / 300 + i) * 1.6) + '" cy="' + f1(ky - 10 + Math.floor(i / 3) * 18 + Math.cos(t / 260 + i) * 1.6) + '" r="3"/>';
    o += L(8, 190, "K-ATP channel", kx - 6, ky + 16, "start") + T(8, 204, dep ? "closed: K⁺ trapped" : "open: K⁺ leaves", "s" + (dep ? " bad" : " mut"), "start");
    /* calcium channel on the right membrane */
    var cx2 = 354, cy2 = 120;
    o += HOT("Calcium channel. Depolarization opens it; calcium flows in and drives exocytosis of the insulin granules.", '<rect class="ds-chan" x="' + (cx2 - 6) + '" y="' + (cy2 - 15) + '" width="12" height="11" rx="2"/><rect class="ds-chan" x="' + (cx2 - 6) + '" y="' + (cy2 + 4) + '" width="12" height="11" rx="2"/><path class="ds-gate" d="M' + (cx2 - 7) + " " + cy2 + "H" + (cx2 + 7) + '" opacity="' + (dep ? 0.15 : 1) + '"/>');
    if (dep) o += dsFlow([[440, cy2 - 26], [cx2 + 10, cy2], [cx2 - 30, cy2 + 6]], 4, 1700, t, "ds-ca", 3);
    o += T(364, 98, "Ca²⁺ channel", "s", "start") + T(364, 112, dep ? "open, Ca²⁺ in" : "closed", "s" + (dep ? " ok" : " mut"), "start");
    /* glucose enters from the capillary; the GLP-1 receptor sits on the membrane facing it */
    o += dsFlow([[188, 226], [194, 190], [206, 162]], 4, 2200, t, "ds-glu", 2.6, 0, meal ? 1 : 0.15);
    var rx = 228, ry = 198;
    o += HOT("GLP-1 receptor (also in the brain, heart, vessels, kidney, lung and gut). GLP-1 raises insulin secretion in proportion to the glucose there: glucose-dependent, so a low risk of hypoglycemia on its own.", '<path class="ds-gpcr" d="M' + (rx - 10) + " " + (ry - 7) + "l3 14l3 -14l3 14l3 -14l3 14l3 -14" + '"/>');
    o += T(rx, 184, "GLP-1R", "s" + (gl ? " b ds-glpt" : " mut"), "middle");
    if (d === "glp1") o += dsFlow([[120, 224], [200, 224], [rx, ry + 8]], 3, 2600, t, "ds-drug-dot", 3.2) + dsDia(rx + 1, ry + 11, 4);
    if (d === "dpp4") {
      o += dsFlow([[-10, 230], [rx - 50, 230], [rx, ry + 8]], 4, 2600, t, "ds-glp", 3.2) + dsFlow([[-10, 234], [470, 234]], 6, 5200, t, "ds-glp", 3, 0.3);
      o += HOT("DPP-4 in the blood: it breaks down your own GLP-1 and GIP. The inhibitor sits in it, so the incretins survive.", '<path class="ds-dpp" d="M84 220A9 9 0 1 1 84 234L76 227Z"/>' + dsDia(77, 227, 4)) + T(98, 232, "DPP-4 blocked", "s ds-onv b", "start");
    }
  }
  if (k === "tub") {
    o += '<path class="lumen" d="M1 22H459V80H1Z"/>' + T(12, 40, "filtrate", "s b", "start") + T(448, 40, "→ urine", "s b", "end");
    var cells = "", mv = "", c;
    for (c = 0; c < 4; c++) { var x0 = 14 + c * 108; cells += '<rect class="cyto" x="' + x0 + '" y="86" width="104" height="80" rx="6"/><ellipse class="nuc" cx="' + (x0 + 52) + '" cy="140" rx="14" ry="11"/>'; for (var m = 8; m < 100; m += 6) mv += "M" + (x0 + m) + " 86V80"; }
    o += HOT("Kidney tubule cells, just after the glomerulus. Normally about 99% of the glucose that is filtered is taken back here, through SGLT2.", cells + '<path class="ds-mv" d="' + mv + '"/>');
    for (c = 0; c < 4; c++) { var sx2 = 14 + c * 108 + 52; o += HOT("SGLT2, the sodium-glucose transporter that takes filtered glucose back into the blood. The drug blocks it (a highly selective inhibitor), so the glucose stays in the filtrate.", '<rect class="ds-sglt" x="' + (sx2 - 9) + '" y="78" width="18" height="14" rx="4"/>') + dsDia(sx2, 72, 4.5); }
    o += cap(186) + rbcs(186, 9000) + T(12, 204, "blood", "s b ds-onv", "start");
    o += T(66, 112, "SGLT2", "s b", "middle") + T(66, 126, "blocked", "s bad", "middle");
    o += dsFlow([[-10, 52], [470, 52]], 9, 5200, t, "ds-glu", 3.2) + dsFlow([[-10, 66], [470, 66]], 7, 4300, t, "ds-water", 2.6, 0.2);
    o += T(230, 240, "normally about 99% is taken back here", "s mut", "middle");
    o += T(282, 110, "glucose stays", "s", "middle") + T(282, 124, "in the filtrate", "s", "middle") + T(390, 110, "water follows:", "s", "middle") + T(390, 124, "polyuria", "s b", "middle");
  }
  if (k === "gut") {
    var agi = d === "agi";
    o += '<path class="lumen" d="M1 16H459V104H1Z"/>' + T(12, 34, "starch, disaccharides", "s b", "start") + T(448, 34, agi ? "→ colon: gas" : "→ on down the gut", "s b", "end");
    var cl = "", mv2 = "", e;
    for (e = 0; e < 4; e++) { var ex0 = 14 + e * 108; cl += '<rect class="cyto" x="' + ex0 + '" y="110" width="104" height="84" rx="6"/><ellipse class="nuc" cx="' + (ex0 + 52) + '" cy="170" rx="12" ry="15"/>'; for (var mm = 6; mm < 100; mm += 5) mv2 += "M" + (ex0 + mm) + " 110V102"; }
    o += HOT("Small intestine lining (enterocytes) with its brush border of microvilli, where alpha-glucosidase breaks starch, dextrin and disaccharides into glucose that can be absorbed.", cl + '<path class="ds-mv" d="' + mv2 + '"/>');
    for (e = 0; e < 8; e++) { var zx = 40 + e * 54; o += HOT(agi ? "Alpha-glucosidase on the brush border, blocked by acarbose or miglitol: the carbohydrate isn't broken down or absorbed." : "Alpha-glucosidase on the brush border, working normally.", '<path class="ds-enz" d="M' + (zx + 7) + " 94A7 7 0 1 1 " + (zx + 7) + ' 104L' + zx + ' 99Z"/>') + (agi ? dsDia(zx + 1, 99, 3.6) : ""); }
    o += cap(204) + rbcs(204, 9000) + T(12, 222, "blood", "s b ds-onv", "start");
    /* starch chains drift along; split into glucose that is absorbed unless the enzyme is blocked */
    for (var ch = 0; ch < 4; ch++) {
      var u2 = ((t / 9000 + ch / 4) % 1), bx = -60 + u2 * 560, by = (agi ? 56 : 48) + (ch % 2) * (agi ? 24 : 10), split = !agi && bx > 120;
      for (var j = 0; j < 5; j++) {
        var hx0 = split ? bx + j * 15 : bx + j * 11, edge = Math.max(0, Math.min(1, (hx0 - 6) / 20, (452 - hx0) / 20));
        if (edge <= 0) continue;
        if (!split) { o += (j ? '<path class="ds-link" d="M' + f1(bx + j * 11 - 7) + " " + by + "h4" + '" opacity="' + f1(edge) + '"/>' : "") + dsHex(hx0, by, 4.6, edge); }
        else { var age = Math.min(1, (bx - 120) / 140), absorb = j % 2 === 0 ? 0 : age; o += dsHex(hx0, by + absorb * (150 - by) + j * 2, 4.6, edge * (1 - Math.max(0, absorb - 0.85) * 6)); }
      }
    }
    o += T(130, 132, "brush border:", "s", "middle") + T(130, 146, "alpha-glucosidase", "s b", "middle") + T(130, 160, agi ? "blocked" : "working", "s" + (agi ? " bad" : " mut"), "middle");
    if (!agi) o += '<rect class="ds-notebg" x="20" y="64" width="420" height="25" rx="5"/><g class="ds-q"><circle cx="40" cy="76" r="9"/><text x="40" y="80" text-anchor="middle">?</text></g>' + T(250, 73, "colesevelam may decrease glucose absorption;", "s b", "middle") + T(250, 85, "the mechanism is not established", "s mut", "middle");
  }
  if (k === "liv") {
    o += '<path class="vessel" d="M378 1H446V245H378Z"/>' + T(412, 22, "blood", "s b ds-onv", "middle");
    for (var r2 = 0; r2 < 6; r2++) { var ry2 = ((t / 7000 + r2 / 6) % 1) * 260 - 10; o += '<ellipse class="ds-rbc" cx="' + (r2 % 2 ? 404 : 420) + '" cy="' + f1(ry2) + '" rx="3.6" ry="6"/>'; }
    var hep = dsSm([[30, 40], [180, 30], [350, 42], [362, 134], [350, 224], [190, 234], [34, 226], [22, 130]], true);
    o += HOT("Liver cell (hepatocyte). Metformin's primary effect is here: it inhibits hepatic gluconeogenesis, so less new glucose goes out into the blood. How it does it isn't settled; the lecture pays attention to the effect.", '<path class="cyto" d="' + hep + '"/><ellipse class="nuc" cx="96" cy="72" rx="22" ry="18"/><circle class="ds-nucleolus" cx="100" cy="68" r="4.5"/>');
    var gly = ""; [[150, 64], [170, 80], [196, 58], [214, 86], [240, 66], [262, 92], [286, 70], [70, 140], [58, 182], [92, 196]].forEach(function (p) { gly += '<circle class="ds-glyc" cx="' + p[0] + '" cy="' + p[1] + '" r="2"/>'; });
    o += gly;
    /* the gluconeogenesis line: small pieces assemble into glucose, which goes out to the blood */
    var rate = 0.25;
    o += '<path class="ds-gng" d="M110 168H330"/><path class="ds-gnga" d="M326 162L336 168L326 174Z"/>';
    o += dsFlow([[110, 168], [300, 168]], 8, 4200, t, "ds-pre", 2.2, 0, 0.8);
    for (var hx = 0; hx < 3; hx++) { var uu = ((t / 3600 + hx / 3) % 1); if (hx / 3 > rate * 1.2) continue; var p3 = dsAt([[336, 168], [372, 168], [400, 150], [412, 40]], uu); o += dsHex(p3[0], p3[1], 5, Math.min(1, uu * 6, (1 - uu) * 6)); }
    o += '<g class="ds-stop"><circle cx="222" cy="168" r="10"/><path d="M217 168H227"/></g>';
    o += dsDia(196, 136, 5) + dsDia(250, 144, 5) + dsDia(292, 128, 5);
    o += T(222, 200, "gluconeogenesis: new glucose", "s b", "middle") + T(222, 214, "inhibited by metformin", "s bad", "middle");
    o += T(250, 118, "metformin", "s ds-drugt", "middle") + T(70, 214, "liver cell", "s mut", "middle") + T(368, 236, "less glucose out", "s b", "end");
  }
  if (k === "fat") {
    o += '<path class="vessel" d="M384 1H446V245H384Z"/>' + T(415, 22, "blood", "s b ds-onv", "middle");
    var grow = 0.4 + 0.6 * ((t / 8000) % 1);
    o += HOT("Adipocyte: a thin rim of cytoplasm around one big lipid droplet. TZDs bind PPAR-gamma, a nuclear hormone receptor expressed mainly in fat, and switch on genes for glucose and lipid metabolism.", '<circle class="cyto" cx="214" cy="126" r="100"/><circle class="fat" cx="214" cy="130" r="90"/>');
    o += HOT("PPAR-gamma (peroxisome proliferator-activated receptor gamma), a nuclear receptor in the adipocyte's nucleus. With the drug bound it changes which genes are read.", '<ellipse class="nuc" cx="214" cy="40" rx="46" ry="18"/><path class="ds-dna" d="M178 44C186 36 194 52 202 44C210 36 218 52 226 44C234 36 242 52 250 44"/><rect class="ds-ppar" x="198" y="30" width="20" height="13" rx="4"/>' + dsDia(222, 34, 4.2));
    o += HOT("More adipocytes: TZDs increase the number of fat cells and fat mass (one reason for the weight gain).", '<circle class="cyto" cx="62" cy="186" r="' + f1(34 * grow) + '"/><circle class="fat" cx="62" cy="188" r="' + f1(28 * grow) + '"/>');
    o += dsFlow([[446, 96], [384, 96], [300, 110], [250, 120]], 6, 2400, t, "ds-fa", 2.8) + dsFlow([[446, 168], [384, 168], [312, 160], [270, 156]], 4, 2600, t, "ds-glu", 2.8, 0.3);
    o += '<rect class="ds-sglt" x="305" y="150" width="16" height="16" rx="4"/>';
    o += T(214, 96, "fatty acids taken up", "s", "middle") + T(214, 120, "into more adipocytes", "s", "middle") + T(214, 158, "insulin sensitivity ↑", "s ok", "middle") + T(214, 172, "(muscle and liver too)", "s mut", "middle");
    o += L(14, 62, "PPAR-gamma", 170, 44, "start") + T(14, 76, "nuclear receptor", "s mut", "start") + T(62, 236, "more adipocytes", "s", "middle");
  }
  if (k === "musc") {
    o += '<path class="ds-int" d="M1 1H459V62H1Z"/>' + T(452, 20, "blood", "s b", "end");
    var fib = "M14 74H446V206H14Z", bands = "";
    for (var bx2 = 20; bx2 < 446; bx2 += 14) bands += '<rect class="ds-aband" x="' + bx2 + '" y="76" width="6" height="128"/>';
    o += HOT("Skeletal muscle fiber (fat cells take up glucose the same way): the insulin-dependent glucose transporter, GLUT4, waits inside the cell until insulin acts.", '<path class="ds-mus" d="' + fib + '"/>' + bands + '<ellipse class="ds-mnuc" cx="70" cy="80" rx="18" ry="4.5"/><ellipse class="ds-mnuc" cx="300" cy="80" rx="18" ry="4.5"/><ellipse class="ds-mnuc" cx="190" cy="200" rx="18" ry="4.5"/><ellipse class="ds-mnuc" cx="400" cy="200" rx="18" ry="4.5"/>');
    /* insulin receptors (tyrosine kinase) with insulin and phosphates */
    [110, 236].forEach(function (rx3) {
      o += HOT("Insulin receptor, a tyrosine kinase: insulin binds outside, it phosphorylates (autophosphorylation of the insulin receptor substrate, IRS), and the signal moves GLUT4 to the membrane.", '<path class="ds-irs" d="M' + (rx3 - 7) + " 54L" + (rx3 - 3) + " 70V88M" + (rx3 + 7) + " 54L" + (rx3 + 3) + ' 70V88"/>' + '<circle class="ins" cx="' + rx3 + '" cy="58" r="4.2"/>' + '<circle class="ds-p" cx="' + (rx3 - 8) + '" cy="88" r="4"/><circle class="ds-p" cx="' + (rx3 + 8) + '" cy="88" r="4"/>');
    });
    o += dsFlow([[90, 4], [104, 56]], 2, 2000, t, "ds-ins", 2.6) + dsFlow([[260, 4], [240, 56]], 2, 2000, t, "ds-ins", 2.6, 0.5);
    /* GLUT4 vesicles rise to the membrane, then glucose comes in through them */
    [170, 330, 400].forEach(function (gx2, n) {
      var u3 = ((t / 4200 + n / 3) % 1), y3 = u3 < 0.45 ? 170 - (u3 / 0.45) * 96 : 74;
      o += '<circle class="ds-ves" cx="' + gx2 + '" cy="' + f1(y3) + '" r="9"/><rect class="ds-sglt" x="' + (gx2 - 5) + '" y="' + f1(y3 - 10) + '" width="10" height="9" rx="2.5"/>';
      if (u3 >= 0.45) o += dsFlow([[gx2, 28], [gx2, 74], [gx2 + 6, 120]], 3, 1400, t, "ds-glu", 2.8, n * 0.2);
    });
    o += dsFlow([[56, 26], [56, 74], [60, 116]], 3, 1600, t, "ds-k", 2.8);
    o += T(110, 116, "insulin receptor", "s b", "middle") + T(110, 130, "(tyrosine kinase)", "s", "middle") + T(330, 140, "GLUT4 moves to", "s b", "middle") + T(330, 154, "the membrane", "s b", "middle");
    o += T(56, 168, "K⁺ in", "s", "middle") + T(400, 44, "glucose in", "s", "middle") + T(230, 228, "skeletal muscle fiber (fat takes up glucose the same way)", "s mut", "middle");
  }
  if (k === "brain") {
    var cer = dsSm([[46, 120], [54, 78], [92, 44], [156, 32], [220, 40], [268, 68], [288, 108], [280, 138], [250, 150], [212, 156], [190, 170], [150, 176], [112, 168], [98, 152], [70, 148], [52, 140]], true);
    var cbl = dsSm([[214, 162], [246, 154], [276, 158], [288, 176], [276, 198], [246, 206], [222, 198], [210, 182]], true), bst = "M186 152C206 152 212 160 210 176C208 190 202 198 200 212L198 240L186 240L184 212C182 198 176 188 176 172C176 160 178 152 186 152Z";
    var pul = 0.6 + 0.3 * Math.sin(t / 420);
    o += HOT("The brain (side view, front to the left). GLP-1 receptors here lower food intake.", '<path class="ds-brain" d="' + cer + '"/><path class="ds-gyri" d="M104 150C128 140 150 128 178 112M170 34C164 60 156 84 148 110M206 40C200 62 196 86 194 106M70 96C86 84 98 98 116 80M220 82C236 74 252 92 270 86M120 118C128 104 140 116 150 100"/>');
    o += HOT("Hindbrain (brainstem and cerebellum): amylin, and its analog pramlintide, binds receptors here.", '<path class="ds-hind" d="' + bst + '"/><path class="ds-hind" d="' + cbl + '"/><path class="ds-folia" d="M218 172C236 164 258 166 280 172M216 184C236 178 260 180 284 186M222 196C240 192 258 194 276 198"/><path class="ds-halo" d="' + cbl + bst + '" opacity="' + f1(pul) + '"/><path class="ds-lit" d="' + cbl + bst + '"/>');
    o += dsFlow([[20, 238], [120, 232], [190, 214]], 5, 3200, t, "ds-drug-dot", 3);
    var rows = [["glucagon release", "↓", 76], ["gastric emptying", "↓", 126], ["satiety", "↑", 176]];
    rows.forEach(function (r, n) { o += '<path class="ds-out" d="M288 ' + (180 + n * 2) + "L" + 316 + " " + (r[2] - 4) + '"/><circle class="dot" cx="316" cy="' + (r[2] - 4) + '" r="2"/>' + T(324, r[2], r[0] + " " + r[1], "s b", "start"); });
    o += T(246, 228, "hindbrain", "s b", "middle") + T(96, 222, "pramlintide", "s ds-drugt", "middle") + T(110, 106, "cerebrum", "s mut", "middle");
  }
  return o;
}

function dsRender(st, D) {
  var t = st.t || 0, tgt = D.DRUGS[st.d].lit, keys = ["brain", "stom", "liv", "panc", "gut", "kid", "blad", "fat", "mus"], o = "";
  /* the lit sites ease to the new drug's (snap under reduced motion, or the first time) */
  if (!st._lv || !t) { st._lv = {}; keys.forEach(function (k) { st._lv[k] = tgt[k] || 0; }); }
  else { var k = 1 - Math.exp(-Math.max(0, t - (st._tl || t)) / 260); keys.forEach(function (n) { st._lv[n] += ((tgt[n] || 0) - st._lv[n]) * k; }); }
  st._tl = t;
  o += dsBody(st._lv, st, D) + dsBodyFlow(st, st._lv, D);
  o += '<path class="ds-rule" d="M276 14V326"/>' + dsCol(st, D);
  o += '<g transform="translate(10 344)">' + dsPanel(st, D) + "</g>";
  o += T(20, 362, D.ZOOM[D.DRUGS[st.d].zoom], "b ds-zt", "start");
  return o;
}
function dsSay(st, D) { var g = D.DRUGS[st.d]; return [g.sum, g.ro]; }

const D = {
  ANIM: true, INIT: { d: "su" },
  BODY: {
    SIDE: [[149, 76], [172, 82], [192, 88], [204, 100], [208, 118], [204, 140], [198, 176], [195, 212], [200, 245], [204, 272], [201, 300], [198, 332]],
    LIV: [[82, 128], [102, 120], [130, 118], [160, 121], [172, 127], [160, 134], [134, 146], [106, 162], [88, 166], [78, 152]],
    STOM: [[158, 128], [170, 120], [186, 121], [198, 134], [198, 154], [190, 170], [172, 178], [156, 178], [150, 172], [158, 166], [174, 162], [178, 148], [172, 138], [162, 138]],
    PANC: [[114, 186], [112, 178], [124, 176], [146, 180], [174, 176], [196, 170], [206, 172], [203, 180], [176, 186], [148, 192], [126, 196], [116, 194]],
    GUT: [[140, 206], [172, 212], [176, 224], [108, 228], [104, 240], [176, 242], [178, 254], [108, 256], [106, 268], [168, 272]],
    FAT: [[186, 232], [196, 228], [203, 244], [202, 266], [193, 276], [184, 266], [183, 246]],
    MUS: [[150, 300], [170, 293], [192, 296], [197, 316], [196, 332], [152, 332], [148, 316]],
  },
  PATHS: {
    FAT_LIV: [[192, 248], [170, 200], [130, 150], [112, 140]], FAT_MUS: [[192, 262], [184, 290], [174, 310]],
    PAN_LIV: [[140, 184], [128, 160], [116, 142]], PAN_MUS: [[170, 186], [190, 230], [184, 290], [172, 312]], PAN_FAT: [[190, 182], [196, 220], [194, 248]],
    LIV_OUT: [[106, 150], [124, 176], [150, 196]], GUT_OUT: [[150, 240], [160, 214], [168, 196]],
    FAT_PAN: [[194, 246], [196, 214], [180, 186]], GUT_PAN: [[136, 238], [146, 214], [150, 190]],
    FAT_BRAIN: [[194, 246], [212, 160], [196, 96], [150, 58]], STOM_SLOW: [[160, 132], [184, 150], [170, 172]],
    URE_L: [[97, 216], [110, 246], [136, 284]], URE_R: [[183, 209], [170, 246], [144, 284]],
  },
  RING: { musc: [[172, 314, 20], [193, 252, 16]], beta: [[150, 186, 16]], liv: [[118, 140, 22]], fat: [[193, 252, 18]], gut: [[140, 242, 26]], tub: [[93, 210, 16], [187, 203, 16]], brain: [[144, 52, 16]] },
  ZOOM: { musc: "Zoom: a muscle cell", beta: "Zoom: an islet in the pancreas", liv: "Zoom: a liver cell", fat: "Zoom: an adipocyte", gut: "Zoom: the gut lining", tub: "Zoom: a kidney tubule", brain: "Zoom: the brain, from the side" },
  INFO: {
    brain: "Brain: GLP-1 receptors here cut food intake (GLP-1 agonists). Pramlintide (amylin) binds receptors in the hindbrain: less glucagon, slower gastric emptying, more satiety.",
    stom: "Stomach: GLP-1 agonists and pramlintide slow gastric emptying, so you feel full sooner and longer (and oral drugs that need fast absorption, such as antibiotics and oral contraceptives, are delayed).",
    liv: "Liver: insulin cuts its glucose output (less gluconeogenesis and glycogen breakdown). Metformin's primary site: it inhibits hepatic gluconeogenesis. TZDs improve its insulin sensitivity.",
    panc: "Pancreas, the islets: beta cells make insulin and co-secrete amylin; alpha cells make glucagon. Sulfonylureas and meglitinides squeeze out insulin; GLP-1 agonists and DPP-4 inhibitors raise insulin with a meal and lower glucagon.",
    gut: "Small intestine: alpha-glucosidase inhibitors block carbohydrate breakdown at the brush border; metformin delays absorption; after a meal the gut releases the incretins (GLP-1, GIP) that DPP-4 breaks down. Colesevelam may decrease glucose absorption.",
    kidney: "Kidneys: glucose is filtered, then about 99% is taken back by the sodium-glucose transporter SGLT2. SGLT2 inhibitors block it, so glucose leaves in the urine.",
    bladder: "Bladder: with an SGLT2 inhibitor the urine carries glucose and extra water (polyuria), which invites genital yeast infections and urinary tract infections.",
    fat: "Adipose tissue: insulin brings glucose in through GLUT4; TZDs act on PPAR-gamma, expressed mainly here. Injected drugs go under the skin, into this fat.",
    mus: "Skeletal muscle: insulin brings glucose in through GLUT4 (and potassium in); metformin and TZDs make it more sensitive to insulin.",
  },
  DRUGS: {
    ins: { name: "Insulin", ex: ["rapid, short, NPH,", "long, ultra-long (Fig 2)"], route: "injected; Afrezza inhaled", hypo: 3, hypoTxt: "the watchword", weight: "gain", watch: ["hypoglycemia, weight gain", "retinopathy briefly worse", "lipoatrophy/hypertrophy"], zoom: "musc", lit: { liv: 0.6, mus: 1, fat: 1 },
      sum: "Insulin: all type 1 patients, and type 2 when needed; injected under the skin (Afrezza is inhaled). It binds the insulin receptor, a tyrosine kinase, and GLUT4 moves to the membrane of muscle and fat cells, so glucose (and potassium) move in; in the liver, gluconeogenesis and glycogen breakdown fall. Adverse: hypoglycemia, weight gain, a transient worsening of retinopathy, lipoatrophy or lipohypertrophy at the injection site.", ro: "hypoglycemia: yes" },
    su: { name: "Sulfonylureas", ex: ["glipizide, glyburide,", "glimepiride"], route: "oral", hypo: 3, hypoTxt: "yes, at any glucose", weight: "gain", watch: ["low durability", "disulfiram-like reaction", "G6PD; liver, kidney"], zoom: "beta", lit: { panc: 1 },
      sum: "Sulfonylureas (glipizide, glyburide, glimepiride), insulin secretagogues: they bind the sulfonylurea receptor (SUR) on the beta cell's K-ATP channel and close it. Potassium is trapped, the cell depolarizes, calcium channels open, and insulin the cell has already made is released, whatever the glucose. So they need a working pancreas. Adverse: hypoglycemia (in his practice question, the class most likely to cause it in type 2), weight gain, low durability; also agranulocytosis, jaundice, a disulfiram-like reaction with alcohol.", ro: "hypoglycemia: yes" },
    meg: { name: "Meglitinides", ex: ["repaglinide (Prandin),", "nateglinide"], route: "oral, with meals", hypo: 2, hypoTxt: "less than sulfonylureas", weight: "gain", watch: ["frequent dosing", "low durability", "not after a failed SU"], zoom: "beta", lit: { panc: 1 },
      sum: "Meglitinides (repaglinide, nateglinide): the same K-ATP channel and the same quick squeeze on the pancreas (2 binding sites shared with the sulfonylureas, 1 of their own), but rapidly absorbed: peak 1 hour, half-life 1 hour, so they are dosed with meals for the after-meal (postprandial) glucose. Adverse: hypoglycemia (less than with sulfonylureas), weight gain, frequent dosing, low durability; don't use them if a sulfonylurea has failed.", ro: "hypoglycemia: yes" },
    met: { name: "Metformin", ex: ["a biguanide; first-line", "for type 2"], route: "oral", hypo: 0, hypoTxt: "no (very low risk)", weight: "neutral or some loss", watch: ["GI upset (the common one)", "low B12, lactic acidosis", "avoid if eGFR is under 30"], zoom: "liv", lit: { liv: 1, mus: 0.45, gut: 0.45 },
      sum: "Metformin, the first-line drug for type 2 diabetes. Its primary effect is to inhibit hepatic gluconeogenesis; it also increases peripheral insulin sensitivity (glucose use in skeletal muscle) and delays glucose absorption from the gut. It has no effect when glucose is normal, so no hypoglycemia, and it is weight neutral or causes some weight loss. Adverse: GI upset (nausea, bloating, cramps, diarrhea), decreased B12 absorption, lactic acidosis; contraindicated when eGFR is under 30.", ro: "hypoglycemia: no" },
    tzd: { name: "TZDs", ex: ["pioglitazone (Actos),", "rosiglitazone (Avandia)"], route: "oral", hypo: 1, hypoTxt: "low risk", weight: "gain", watch: ["edema → heart failure", "avoid NYHA class III-IV", "macular edema; liver"], zoom: "fat", lit: { fat: 1, mus: 0.45, liv: 0.45 },
      sum: "Thiazolidinediones (pioglitazone, rosiglitazone) are ligands for PPAR-gamma, a nuclear hormone receptor expressed mainly in fat: more adipocytes, more fatty acid uptake into them, and better insulin sensitivity in muscle and liver. Low risk of hypoglycemia, and they preserve beta cell function. Adverse: dose-related edema with new or worse heart failure (avoid in NYHA class III or IV), weight gain, liver (avoid if ALT is over 2.5 times normal); they may raise the risk of macular edema.", ro: "hypoglycemia: low" },
    agi: { name: "α-glucosidase inhibitors", ex: ["acarbose (Precose),", "miglitol (Glyset)"], route: "oral", hypo: 0, hypoTxt: "no", weight: "no gain", watch: ["gas, bloating, diarrhea", "transaminases rise", "less digoxin absorbed"], zoom: "gut", lit: { gut: 1 },
      sum: "Alpha-glucosidase inhibitors (acarbose, miglitol) block alpha-glucosidase on the brush border of the small intestine, so starch, dextrin and disaccharides aren't broken down or absorbed and the after-meal spike is blunted; they work best on a starchy, high-fiber diet. Acarbose is minimally absorbed. No hypoglycemia. Adverse: flatulence, bloating and diarrhea (more with more carbohydrate), some transaminase elevation, less absorption of other drugs; avoid with bowel disease.", ro: "hypoglycemia: no" },
    glp1: { name: "GLP-1 agonists", ex: ["exenatide, liraglutide,", "dulaglutide, semaglutide"], route: "injected; Rybelsus oral", hypo: 1, hypoTxt: "low as monotherapy", weight: "loss", watch: ["nausea, vomiting (wanes)", "pancreatitis (rare)", "boxed: C-cell tumors"], zoom: "beta", lit: { panc: 1, stom: 0.8, brain: 0.8, fat: 0.25 },
      sum: "GLP-1 receptor agonists (exenatide, from the Gila monster's exendin-4, then liraglutide, dulaglutide, semaglutide, tirzepatide) act like the gut's incretin GLP-1 but resist DPP-4: insulin secretion rises in a glucose-dependent way, glucagon release falls, gastric emptying slows and food intake drops, so weight comes down. Low risk of hypoglycemia as monotherapy. Adverse: dose-dependent nausea and vomiting that wane, delayed absorption of other oral drugs, rare pancreatitis, acute renal failure; boxed warning: thyroid C-cell tumors in animal studies.", ro: "hypoglycemia: low" },
    dpp4: { name: "DPP-4 inhibitors", ex: ["sitagliptin, saxagliptin,", "linagliptin, alogliptin"], route: "oral, once a day", hypo: 0, hypoTxt: "no", weight: "neutral", watch: ["modest A1C drop, costly", "low durability (2 years)", "no HF (sitagliptin is ok)"], zoom: "beta", lit: { gut: 0.7, panc: 1 },
      sum: "DPP-4 inhibitors (sitagliptin, saxagliptin, linagliptin, alogliptin): DPP-4 is the enzyme that naturally breaks down your own incretins, GLP-1 and GIP. Blocking it makes the incretins you release after a meal last longer, so it's like taking a GLP-1, made by you: insulin rises and glucagon falls with the meal. No hypoglycemia, weight neutral, well tolerated, usable in kidney or liver disease. Adverse: expensive, modest A1C lowering, low durability; avoid in heart failure (except sitagliptin).", ro: "hypoglycemia: no" },
    amy: { name: "Pramlintide", ex: ["an amylin analog (Symlin)"], route: "injected before meals", hypo: 2, hypoTxt: "with insulin", weight: "not covered", watch: ["nausea, vomiting", "hypoglycemia with insulin"], zoom: "brain", lit: { brain: 1, stom: 0.8, panc: 0.3, fat: 0.25 },
      sum: "Pramlintide (Symlin), the synthetic form of amylin, which beta cells co-secrete with insulin (in type 2, amylin forms amyloid fibers). Injected before meals, half-life 50 minutes, usable in type 1 and type 2: it binds receptors in the hindbrain, decreasing glucagon release, slowing gastric emptying and increasing satiety. Adverse: nausea and vomiting; hypoglycemia when used with insulin.", ro: "hypo: with insulin" },
    sglt2: { name: "SGLT2 inhibitors", ex: ["canagliflozin,", "dapagliflozin,", "empa-, ertugliflozin"], route: "oral", hypo: 1, hypoTxt: "rare", weight: "not covered", watch: ["genital yeast, UTIs", "polyuria, low BP", "boxed: amputations"], zoom: "tub", lit: { kid: 1, blad: 0.8 },
      sum: "SGLT2 inhibitors (canagliflozin, dapagliflozin, empagliflozin, ertugliflozin: the -gliflozins, flushing out the sugar). About 99% of filtered glucose is normally taken back by the sodium-glucose transporter; these block it, so glucose leaves in the urine, dose-dependently, with water (osmotic diuresis). Hypoglycemia is rare; they lower blood pressure and help heart failure. Adverse: genital yeast infections, UTIs, polyuria, dizziness and hypotension, hyperkalemia, rare euglycemic DKA; boxed warning: amputations (canagliflozin, ertugliflozin).", ro: "hypoglycemia: rare" },
    resin: { name: "Bile acid resin", ex: ["colesevelam"], route: "oral, barely absorbed", hypo: -1, hypoTxt: "not covered", weight: "not covered", watch: ["constipation", "cuts others' absorption", "raises triglycerides"], zoom: "gut", lit: { gut: 0.6 },
      sum: "Colesevelam, a bile acid resin: bile acid metabolism is abnormal in type 2 and the resin may decrease glucose absorption, but the mechanism is not established, and these are not popular drugs for diabetes. Adverse: constipation and other GI effects; it decreases absorption of warfarin, phenytoin, verapamil, glyburide, thyroxine, ethinyl estradiol and fat-soluble vitamins, and can raise triglycerides.", ro: "mechanism unclear" },
  },
};

const CSS = `
.anima .drugsites-svg .t{font-size:13px}
.anima .drugsites-svg .t.s{font-size:12px}
.anima .drugsites-svg .t.ds-big{font-size:15.5px}
.anima .drugsites-svg .t.ds-big.ds-long{font-size:12.5px}
.anima .drugsites-svg .t.ds-val{fill:var(--anatomy-strong);font-weight:600;font-size:12px}
.anima .drugsites-svg .t.ds-cap{fill:var(--anatomy-muted);letter-spacing:.08em;font-size:10.5px}
.anima .drugsites-svg .t.ds-on{stroke:none;fill:var(--anatomy-hi);font-weight:600}
.anima .drugsites-svg .t.ds-onv{stroke:none}
.anima .drugsites-svg .t.ds-zt{stroke:none;font-size:13px}
.anima .drugsites-svg .t.ds-drugt{fill:var(--accent);font-weight:600}
.anima .drugsites-svg .t.ds-glpt{fill:var(--bx-blue);font-weight:600}
.anima .drugsites-svg .ds-skin{fill:var(--anatomy-shade-2);stroke:var(--anatomy-lo);stroke-width:1.2}
.anima .drugsites-svg .ds-brain{fill:var(--bx-violet-soft);stroke:var(--bx-violet);stroke-width:1.2}
.anima .drugsites-svg .ds-gyri,.anima .drugsites-svg .ds-folia{fill:none;stroke:var(--bx-violet);stroke-width:.8;opacity:.7}
.anima .drugsites-svg .ds-hind{fill:var(--bx-violet);opacity:.55;stroke:var(--bx-violet);stroke-width:.8}
.anima .drugsites-svg .ds-tube-o{fill:none;stroke:var(--bx-cyto-line);stroke-width:7;stroke-linecap:round;stroke-linejoin:round}
.anima .drugsites-svg .ds-tube-i{fill:none;stroke:var(--bx-cyto);stroke-width:4.6;stroke-linecap:round;stroke-linejoin:round}
.anima .drugsites-svg .ds-gut-o{stroke-width:9}
.anima .drugsites-svg .ds-gut-i{stroke-width:6.4}
.anima .drugsites-svg .ds-gutlit{fill:none;stroke:var(--accent);stroke-width:11;stroke-linecap:round;stroke-linejoin:round;opacity:.3}
.anima .drugsites-svg .ds-ure{fill:none;stroke:var(--bx-gold);stroke-width:1.6}
.anima .drugsites-svg .ds-kid{fill:var(--bx-blood-soft);stroke:var(--bx-blood);stroke-width:1.2}
.anima .drugsites-svg .ds-blad{fill:var(--bx-gold-soft);stroke:var(--bx-gold);stroke-width:1.2}
.anima .drugsites-svg .ds-panc{fill:var(--bx-gold-soft);stroke:var(--bx-gold);stroke-width:1.2}
.anima .drugsites-svg .ds-lob{fill:none;stroke:var(--bx-gold);stroke-width:.8;opacity:.8}
.anima .drugsites-svg .ds-lobl{stroke:var(--bx-blood)}
.anima .drugsites-svg .ds-stom{fill:var(--bx-cyto);stroke:var(--bx-cyto-line);stroke-width:1.2}
.anima .drugsites-svg .ds-rugae{fill:none;stroke:var(--bx-cyto-line);stroke-width:.8;opacity:.7}
.anima .drugsites-svg .ds-liv{fill:var(--bx-blood-soft);stroke:var(--bx-blood);stroke-width:1.3}
.anima .drugsites-svg .ds-fat{fill:var(--bx-fat);stroke:var(--bx-fat-line);stroke-width:1.2}
.anima .drugsites-svg .ds-adip{fill:none;stroke:var(--bx-fat-line);stroke-width:.8}
.anima .drugsites-svg .ds-mus{fill:var(--bx-blood-soft);stroke:var(--bx-blood);stroke-width:1.2}
.anima .drugsites-svg .ds-stri{fill:none;stroke:var(--bx-blood);stroke-width:.7;opacity:.6}
.anima .drugsites-svg .ds-halo{fill:none;stroke:var(--accent);stroke-width:7;opacity:.35;stroke-linejoin:round}
.anima .drugsites-svg .ds-lit{fill:none;stroke:var(--accent);stroke-width:2;stroke-linejoin:round}
.anima .drugsites-svg .ds-ring{fill:none;stroke:var(--accent);stroke-width:1.4;stroke-dasharray:3 3}
.anima .drugsites-svg .ds-rule{stroke:var(--line);stroke-width:1}
.anima .drugsites-svg .ds-seg{fill:var(--surface);stroke:var(--anatomy-lo);stroke-width:1}
.anima .drugsites-svg .ds-seg-0{fill:var(--bx-stim);stroke:var(--bx-stim)}
.anima .drugsites-svg .ds-seg-1{fill:var(--bx-gold);stroke:var(--bx-gold)}
.anima .drugsites-svg .ds-seg-2{fill:var(--bx-hot);stroke:var(--bx-hot)}
.anima .drugsites-svg .ds-seg-3{fill:var(--bx-inhib);stroke:var(--bx-inhib)}
.anima .drugsites-svg .ds-ins{fill:var(--bx-ins)}
.anima .drugsites-svg .ds-glu{fill:var(--bx-glu)}
.anima .drugsites-svg .ds-fa{fill:var(--bx-gold);stroke:var(--anatomy-mid);stroke-width:.4}
.anima .drugsites-svg .ds-glp{fill:var(--bx-blue)}
.anima .drugsites-svg .ds-k{fill:var(--bx-violet)}
.anima .drugsites-svg .ds-ca{fill:var(--bx-stim)}
.anima .drugsites-svg .ds-food{fill:var(--bx-cyto-line);opacity:.8}
.anima .drugsites-svg .ds-water{fill:var(--bx-blue);opacity:.7}
.anima .drugsites-svg .ds-drug,.anima .drugsites-svg .ds-drug-dot{fill:var(--accent);stroke:var(--surface);stroke-width:.8}
.anima .drugsites-svg .ds-chain{fill:none;stroke:var(--bx-glu);stroke-width:4;stroke-linecap:round;stroke-dasharray:3.5 2}
.anima .drugsites-svg .ds-stop circle{fill:var(--surface);stroke:var(--bx-inhib);stroke-width:1.6}
.anima .drugsites-svg .ds-stop path{stroke:var(--bx-inhib);stroke-width:2;stroke-linecap:round}
.anima .drugsites-svg .ds-notebg{fill:var(--surface);opacity:.88}
.anima .drugsites-svg .ds-q circle{fill:var(--surface);stroke:var(--anatomy-mid);stroke-width:1.2}
.anima .drugsites-svg .ds-q text{fill:var(--anatomy-strong);font:700 11px var(--anatomy-mono)}
.anima .drugsites-svg .ds-syr .ds-barrel{fill:var(--anatomy-face);stroke:var(--anatomy-mid);stroke-width:1.2}
.anima .drugsites-svg .ds-needle{fill:none;stroke:var(--anatomy-mid);stroke-width:1.4;stroke-linecap:round}
.anima .drugsites-svg .ds-dpp{fill:var(--bx-blue-soft);stroke:var(--bx-blue);stroke-width:1.2}
.anima .drugsites-svg .ds-chip{fill:var(--bx-glu-soft);stroke:var(--bx-glu);stroke-width:1}
.anima .drugsites-svg .ds-chip-lo{fill:var(--surface);stroke:var(--anatomy-lo)}
.anima .drugsites-svg .ds-pan{fill:var(--bx-matrix);stroke:var(--line-strong);stroke-width:1}
.anima .drugsites-svg .ds-rbc{fill:var(--bx-blood);opacity:.75}
.anima .drugsites-svg .ds-alpha{fill:var(--bx-gold-soft);stroke:var(--bx-gold);stroke-width:1.4}
.anima .drugsites-svg .ds-gcg{fill:var(--bx-gold)}
.anima .drugsites-svg .ds-nucleolus{fill:var(--bx-nuc-line)}
.anima .drugsites-svg .ds-mem{fill:none;stroke:var(--bx-memb);stroke-width:2.4}
.anima .drugsites-svg .ds-mem.ds-dep{stroke:var(--bx-hot);stroke-width:3}
.anima .drugsites-svg .ds-gran{fill:var(--bx-ins-soft);stroke:var(--bx-ins);stroke-width:1}
.anima .drugsites-svg .ds-chan{fill:var(--bx-violet-soft);stroke:var(--bx-violet);stroke-width:1.2}
.anima .drugsites-svg .ds-gate{stroke:var(--bx-violet);stroke-width:3;stroke-linecap:round}
.anima .drugsites-svg .ds-gate.ds-shut{stroke:var(--bx-inhib)}
.anima .drugsites-svg .ds-sur{fill:var(--bx-blue-soft);stroke:var(--bx-blue);stroke-width:1.2}
.anima .drugsites-svg .t.ds-onsur{stroke:none;font-size:10px;fill:var(--bx-blue);font-weight:700}
.anima .drugsites-svg .ds-gpcr{fill:none;stroke:var(--bx-blue);stroke-width:2;stroke-linejoin:round}
.anima .drugsites-svg .ds-sglt{fill:var(--bx-ins-soft);stroke:var(--bx-ins);stroke-width:1.3}
.anima .drugsites-svg .ds-mv{fill:none;stroke:var(--bx-cyto-line);stroke-width:1}
.anima .drugsites-svg .ds-enz{fill:var(--bx-violet-soft);stroke:var(--bx-violet);stroke-width:1.1}
.anima .drugsites-svg .ds-hex{fill:var(--bx-glu-soft);stroke:var(--bx-glu);stroke-width:1.3}
.anima .drugsites-svg .ds-link{stroke:var(--bx-glu);stroke-width:1.6}
.anima .drugsites-svg .ds-glyc{fill:var(--bx-nuc);opacity:.45}
.anima .drugsites-svg .ds-gng{stroke:var(--anatomy-mid);stroke-width:1.6;stroke-dasharray:4 3}
.anima .drugsites-svg .ds-gnga{fill:var(--anatomy-mid)}
.anima .drugsites-svg .ds-pre{fill:var(--anatomy-mid)}
.anima .drugsites-svg .ds-dna{fill:none;stroke:var(--bx-nuc-line);stroke-width:1.4}
.anima .drugsites-svg .ds-ppar{fill:var(--bx-blue-soft);stroke:var(--bx-blue);stroke-width:1.2}
.anima .drugsites-svg .ds-int{fill:var(--bx-blood-soft);opacity:.55}
.anima .drugsites-svg .ds-aband{fill:var(--bx-blood);opacity:.18}
.anima .drugsites-svg .ds-mnuc{fill:var(--bx-nuc);stroke:var(--bx-nuc-line);stroke-width:.8}
.anima .drugsites-svg .ds-irs{fill:none;stroke:var(--bx-ins);stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}
.anima .drugsites-svg .ds-p{fill:var(--bx-hot)}
.anima .drugsites-svg .ds-ves{fill:var(--bx-ins-soft);stroke:var(--bx-ins);stroke-width:1}
.anima .drugsites-svg .ds-out{fill:none;stroke:var(--anatomy-mid);stroke-width:1.1}
.anima[data-anima="drugsites"] .am-svg{max-width:520px}
`;

export default function () {
  return makeFig({ id: "drugsites", lec: "dmpharm", fig: "Fig 1", short: "Where each drug acts", hint: "pick a drug",
    title: "Where each diabetes drug acts",
    caption: "Pick a drug class: its sites light up on the body (front view: the patient's right is on your left), the zoom underneath animates the mechanism Dr. Fasinu teaches, and the side column gives the route, the hypoglycemia risk and the weight effect.",
    W: 480, H: 600, label: "A front view of the body with the brain, stomach, liver, pancreas, small intestine, kidneys, bladder, fat and thigh muscle, a column with the drug's route, hypoglycemia risk and weight effect, and a zoom panel showing its mechanism.",
    D, render: dsRender, say: dsSay, helpers: [dsSm, dsAt, dsFlow, dsDia, dsHex, dsBody, dsBodyFlow, dsCol, dsPanel], css: CSS,
    controls: `<div class="am-controls" role="group" aria-label="Drug class">${[["ins", "Insulin"], ["su", "Sulfonylureas"], ["meg", "Meglitinides"], ["met", "Metformin"], ["tzd", "TZDs"], ["agi", "α-glucosidase inhibitors"], ["glp1", "GLP-1 agonists"], ["dpp4", "DPP-4 inhibitors"], ["amy", "Pramlintide (amylin)"], ["sglt2", "SGLT2 inhibitors"], ["resin", "Bile acid resin"]].map((b) => `<button type="button" class="am-btn" data-amk="d" data-amv="${b[0]}">${b[1]}</button>`).join("")}</div>`,
    sources: [
      "From the L11 slides and recording (Dr. Fasinu): every class, its examples, its site and mechanism (the K-ATP channel and SUR for the secretagogues, hepatic gluconeogenesis for metformin, PPAR-gamma in adipose tissue for TZDs, the brush border alpha-glucosidase, GLP-1's insulin, glucagon, gastric emptying and food intake effects, DPP-4 breaking down the incretins, amylin's hindbrain receptors, SGLT2 and the 99% reabsorption), the insulin receptor (tyrosine kinase) and GLUT4 translocation, the route summary, and each class's hypoglycemia risk, weight effect and adverse effects in his words. Colesevelam is drawn with its mechanism 'not established', as on his slide; bromocriptine is only named in his class list and isn't drawn.",
      "For accuracy of the drawing only: organ positions follow standard anatomy (front view); the beta cell's K-ATP channel, calcium channel and granule exocytosis follow the sequence on his slide; SGLT2 sits in the tubule just after the glomerulus. Everything is schematic and not to scale; the hypoglycemia bar ranks his own words (no, low or rare, yes, the most likely). Educational, not medical advice.",
    ] });
}
