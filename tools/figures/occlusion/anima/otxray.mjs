// Fig 29: the radiographic signs of occlusal trauma (Occlusion L10, "Signs and symptoms"; Dr. Abou-Arraj's lecture).
// A periapical film of the lower right (#30, #29, #28, labial mounting: distal at the left), drawn the way the Patient Box
// films are (tools/figures/occlusion/cases.js: Wheeler's average tooth sizes, the same film colors) and redrawn live.
// Each sign on his slide is a control: the PDL space (healthy, roughly 0.25 mm, or widened), the lamina dura (normal,
// thickened or discontinued), bone loss (vertical, furcation or circumferential) and root resorption. The readout says
// what each one is, and every sign carries his caveat: it can exist without occlusal trauma (a vertical defect above all).
import { figureSvg, plateHtml } from "./shared.mjs";

const W = 380, H = 300, FW = 246, K = 9;
/* Wheeler's averages (as in cases.js): cw crown width, cv width at the CEJ, ch crown height, rl root length, tr trunk */
const XT = {
  manM2: { cw: 10.5, cv: 8, ch: 7, rl: 13, cr: "mol", tr: 3.5 },
  manM1: { cw: 11, cv: 9, ch: 7.5, rl: 14, cr: "mol3", tr: 3 },
  manP2: { cw: 7, cv: 5, ch: 8, rl: 14.5, cr: "pm" },
  manP1: { cw: 7, cv: 5, ch: 8.5, rl: 14, cr: "pm" },
  manC: { cw: 7, cv: 5.5, ch: 11, rl: 16, cr: "can" },
};
const HOT = {
  pdl: "The PDL space: the thin radiolucent (dark) line around the root. In health it is roughly 0.25 mm wide.",
  pdlw: "A widened PDL space: a wider dark band around the root. The tooth is probably mobile, under forces shifting it in more than one direction: confirm it clinically.",
  lam: "The lamina dura: the thin radiopaque (white) line of the socket wall, just outside the PDL space.",
  lamt: "A thickened lamina dura: wider and more radiopaque than its neighbors'.",
  lamd: "A discontinued lamina dura: trace it around the root and it disappears, then appears again.",
  bone: "The alveolar bone. Its crest sits a little below the CEJs; horizontal bone loss runs parallel to the line connecting them.",
  vert: "A vertical (angular) defect: oblique to the line connecting the CEJs. It does not mean occlusal trauma.",
  circ: "Circumferential bone loss: around the root, so it shows on both sides of it.",
  furc: "Bone loss in the furcation, between the molar's roots.",
  res: "Root resorption: the apex is shorter and blunted.",
  tooth: "The tooth: enamel (the whitest), dentin, and the pulp (dark) inside.",
  cej: "The dashed line connects the CEJs of neighboring teeth. Horizontal bone loss runs parallel to it; vertical (angular) bone loss is oblique to it.",
};
const TEXT = {
  base: "A healthy film: a thin dark line around each root, the PDL space (roughly 0.25 mm), and outside it a thin white line, the lamina dura, with the bone's crest a little below the CEJs. Turn on the signs from his slide, one at a time or together.",
  pdl: "A widened PDL space: a wider radiolucent band around #29 than the roughly 0.25 mm of health, widest at the crest and the apex here, where a tooth pushed one way and then the other presses. Before you even look clinically, you can suspect it is mobile; confirm it clinically.",
  lamt: "A thickened lamina dura: the white line around the socket is wider and more radiopaque. It can go either way: thickened, or discontinued.",
  lamd: "A discontinued lamina dura: trace the white line around #29 and it disappears, then appears again.",
  vert: "Bone loss, vertical: a V-shaped (angular) defect down #29's mesial side, oblique to the line connecting the CEJs (dashed). His warning: just because you see a vertical defect, do not assume there is occlusal trauma; it isn't cause and effect. The opposite may be more true: when occlusal trauma comes with bone loss, the loss is likely to be more vertical.",
  furc: "Bone loss in the furcation: a radiolucency between #30's roots, under the furcation.",
  circ: "Circumferential bone loss: bone lost all around #29's root, so the defect shows on both sides of it.",
  res: "Root resorption, in some cases: #29's apex is shorter and blunted, with the PDL space and lamina dura following it.",
  caveat: " Any of these signs can exist without occlusal trauma: they are surrogate indicators, and occlusal trauma can only be confirmed histologically.",
};

function xF(n) { return Math.round(n * 10) / 10; }
function xRnd(seed) { var s = seed % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }
/* Catmull-Rom through pts as a dense polyline (cases.js's dense) */
function xDense(pts, closed, per) {
  per = per || 8; var n = pts.length, out = [], last = closed ? n : n - 1;
  for (var i = 0; i < last; i++) {
    var p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    if (!closed) { if (i === 0) p0 = p1; if (i + 2 >= n) p3 = p2; }
    var c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    for (var j = 0; j < per; j++) { var t = j / per, u = 1 - t;
      out.push([u * u * u * p1[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p2[0], u * u * u * p1[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p2[1]]); }
  }
  if (!closed) out.push(pts[n - 1]);
  return out;
}
function xPoly(pts, open) { return "M" + pts.map(function (p) { return xF(p[0]) + " " + xF(p[1]); }).join("L") + (open ? "" : "Z"); }
function xPath(cls, pts, open, extra) { return '<path class="' + cls + '"' + (extra || "") + ' d="' + xPoly(pts, open) + '"/>'; }
function xCrown(d) {
  var w = d.cw / 2, v = d.cv / 2, h = d.ch;
  if (d.cr === "can") return [[-v, h], [-w + .4, h * .56], [-w, h * .32], [-w + 1, h * .17], [-1.4, h * .075], [-.4, 0], [.7, h * .09], [w - 1, h * .24], [w, h * .4], [w - .4, h * .63], [v, h]];
  if (d.cr === "pm") return [[-v, h], [-w + .35, h * .56], [-w, h * .3], [-w + 1, h * .1], [-.3, 0], [w - 1.1, h * .12], [w, h * .32], [w - .35, h * .58], [v, h]];
  if (d.cr === "mol3") return [[-v, h], [-w + .4, h * .56], [-w, h * .3], [-w + .8, h * .08], [-w * .52, 0], [-w * .2, h * .13], [w * .14, 0], [w * .44, h * .13], [w * .7, h * .05], [w - .5, h * .16], [w, h * .34], [w - .4, h * .58], [v, h]];
  return [[-v, h], [-w + .4, h * .56], [-w, h * .3], [-w + .8, h * .08], [-w * .46, 0], [w * .02, h * .14], [w * .48, .1], [w - .8, h * .1], [w, h * .32], [w - .4, h * .58], [v, h]];
}
function xRoots(d) {
  var v = d.cv / 2;
  if (d.tr) return [[-v + 2.1, -v + 2.9, 2.1, d.rl], [v - 2, v - 1.6, 2, d.rl - 1]];
  return [[0, .7, v, d.rl]];
}
function xAx(r, t) { return r.a0 + (r.a1 - r.a0) * Math.pow(t, 1.7); }
function xHw(r, t) { return r.w0 + (r.wa - r.w0) * Math.pow(t, .92); }
/* the root offset dd px outward (PDL, lamina dura) from its crest on each side (yL, yR) around the apex. fun widens the
   space at the crest (fading over the coronal 40%) and apx at the apex (over the apical 30%): where a tooth pushed one
   way and then the other presses */
function xRootOut(r, dd, yL, yR, fun, apx) {
  var L = [], R = [], N = 18, i, t;
  function ex(t) { return (fun ? fun * Math.pow(Math.max(0, 1 - t / .4), 1.5) : 0) + (apx ? apx * Math.pow(Math.max(0, (t - .7) / .3), 1.5) : 0); }
  var tL = Math.min(.9, Math.max(0, (yL - r.y0) / r.len)), tR = Math.min(.9, Math.max(0, (yR - r.y0) / r.len));
  for (i = 0; i <= N; i++) { t = tL + (1 - tL) * i / N; L.push([xAx(r, t) - xHw(r, t) - dd - ex(t), r.y0 + t * r.len]); }
  var cx = xAx(r, 1), cy = r.y0 + r.len, rr = r.wa + dd + (apx || 0);
  for (i = 1; i < 8; i++) { var th = Math.PI - i * Math.PI / 8; L.push([cx + Math.cos(th) * rr, cy + Math.sin(th) * rr]); }
  for (i = N; i >= 0; i--) { t = tR + (1 - tR) * i / N; R.push([xAx(r, t) + xHw(r, t) + dd + ex(t), r.y0 + t * r.len]); }
  return L.concat(R);
}
/* one tooth on the film: o = { t, x, occ, k, m (mesial faces right), lift, bone:[mesial, distal] mm lost, pdl, lam, fun,
   apx (mm), res (mm of apex resorbed) } */
function xTooth(o, D) {
  var d = D.XT[o.t], k = o.k, sg = o.m ? -1 : 1, top = o.occ + (o.lift || 0) * k, cej = top + d.ch * k;
  function X(x) { return o.x + sg * x * k; }
  var cr = xDense(xCrown(d), false, 6).map(function (p) { return [X(p[0]), top + p[1] * k]; });
  var g = { o: o, d: d, k: k, x: o.x, cej: cej, top: top, sg: sg, crown: cr, roots: [] };
  var crestY = cej + 1.5 * k, bm = (o.bone && o.bone[0]) || 0, bd = (o.bone && o.bone[1]) || 0;
  g.crestM = crestY + bm * k; g.crestD = crestY + bd * k;
  xRoots(d).forEach(function (r) { var len = (r[3] - (o.res || 0)) * k; g.roots.push({ a0: X(r[0]), a1: X(r[1]), w0: r[2] * k, wa: (o.res ? 1.45 : .75) * k, y0: cej, len: len }); });
  return g;
}
function xCrestLR(g) { return g.sg > 0 ? [g.crestM, g.crestD] : [g.crestD, g.crestM]; }
function xTrunk(g, dd, y0) {
  var yf = g.cej + g.d.tr * g.k, l = g.roots[0], r = g.roots[1], L = g.sg > 0 ? l : r, R = g.sg > 0 ? r : l, pts = [], i;
  if (y0 >= yf) return null;
  function tOf(rt, y) { return Math.max(0, (y - rt.y0) / rt.len); }
  for (i = 0; i <= 4; i++) { var y = y0 + (yf - y0) * i / 4, t = tOf(L, y); pts.push([xAx(L, t) - xHw(L, t) - dd, y]); }
  var tl = tOf(L, yf), tr = tOf(R, yf), xa = xAx(L, tl) + xHw(L, tl) * .2, xb = xAx(R, tr) - xHw(R, tr) * .2;
  pts.push([xa, yf + dd], [(xa + xb) / 2, yf + dd - .5 * g.k], [xb, yf + dd]);
  for (i = 4; i >= 0; i--) { var y2 = y0 + (yf - y0) * i / 4, t2 = tOf(R, y2); pts.push([xAx(R, t2) + xHw(R, t2) + dd, y2]); }
  return pts;
}
/* the socket outlines of one tooth at offset dd (mm) */
function xSocket(g, dd) {
  var c = xCrestLR(g), out = [], fun = (g.o.fun || 0) * g.k, apx = (g.o.apx || 0) * g.k;
  g.roots.forEach(function (r) { out.push(xRootOut(r, dd * g.k, c[0], c[1], fun, apx)); });
  if (g.d.tr) { var tf = xTrunk(g, dd * g.k, Math.min(c[0], c[1])); if (tf) out.push(tf); }
  return out;
}
function xPulp(g) {
  var k = g.k, d = g.d, s = "", c = g.cej, sg = g.sg;
  function X(x) { return g.x + sg * x * k; }
  if (d.tr) {
    var w = d.cv * .3, horns = d.cr === "mol3" ? [[-w * .8, 3.1], [w * .4, 2.9]] : [[-w * .7, 3.0], [w * .7, 2.8]];
    s += xPath("xr-pulp", xDense([[X(-w), c + 1.4 * k], [X(-w - .25), c - .6 * k], [X(horns[0][0]), c - horns[0][1] * k], [X(0), c - 2.1 * k], [X(horns[1][0]), c - horns[1][1] * k], [X(w + .25), c - .6 * k], [X(w), c + 1.4 * k]], true, 6));
    g.roots.forEach(function (r) { var L = [], R = [], N = 10;
      for (var i = 0; i <= N; i++) { var t = .06 + .86 * i / N, x = xAx(r, t), y = r.y0 + t * r.len, hw = (.55 - .4 * t) * k; L.push([x - hw, y]); R.unshift([x + hw, y]); }
      s += xPath("xr-pulp", L.concat(R)); });
    return s;
  }
  var r = g.roots[0], horn = d.cr === "can" ? .5 : .42, L2 = [], R2 = [], N2 = 14, hl = horn * d.ch * k / r.len;
  for (var j = 0; j <= N2; j++) {
    var tt = -hl + (hl + .9) * j / N2, yy = r.y0 + tt * r.len, xx = tt < 0 ? r.a0 : xAx(r, tt);
    var hw2 = tt < 0 ? (1 - Math.pow(-tt / hl, 2)) * 1.05 * k : (.95 - .8 * Math.pow(tt, .7)) * k * .85;
    L2.push([xx - Math.max(.45, hw2), yy]); R2.unshift([xx + Math.max(.45, hw2), yy]);
  }
  return xPath("xr-pulp", xDense(L2.concat(R2), true, 3));
}
function xToothSVG(g, hot) {
  var s = "", k = g.k, d = g.d, sg = g.sg;
  function X(x) { return g.x + sg * x * k; }
  var a = hot ? ' data-info="' + hot + '"' : "", c = hot ? "xr-dentin hot" : "xr-dentin";
  s += xPath(c, [[X(-d.cv / 2 + .15), g.cej - 1.6 * k], [X(d.cv / 2 - .15), g.cej - 1.6 * k], [X(d.cv / 2 - .1), g.cej + 2], [X(-d.cv / 2 + .1), g.cej + 2]], false, a);
  g.roots.forEach(function (r) { s += xPath(c, xRootOut(r, 0, g.cej, g.cej, 0, 0), false, a); });
  if (d.tr) s += xPath(c, xTrunk(g, 0, g.cej - 1), false, a);
  s += xPath(hot ? "xr-enamel hot" : "xr-enamel", g.crown, false, a);
  var E = d.cr.indexOf("mol") === 0 ? 1.5 : d.cr === "pm" ? 1.3 : 1.0, cy = g.top + d.ch * .72 * k;
  var dej = g.crown.map(function (p) { var f = Math.max(0, Math.min(1, (g.cej - p[1]) / (d.ch * k))), th = E * k * Math.pow(f, .55), dx = g.x - p[0], dy = cy - p[1], L = Math.sqrt(dx * dx + dy * dy) || 1; return [p[0] + dx / L * th, p[1] + dy / L * th]; });
  var e0 = dej[0], e1 = dej[dej.length - 1];
  s += xPath("xr-dentin", dej.concat([[e1[0] + (g.x - e1[0]) * .04, g.cej + .8 * k], [e0[0] + (g.x - e0[0]) * .04, g.cej + .8 * k]]));
  s += xPulp(g);
  return s;
}
/* the bone up to the crest between the teeth (a crest point on each root surface, the septum between), trabeculae inside */
function xBone(gs, w, yBottom, seed) {
  var top = [], k = gs[0].k;
  function side(g, right, y) {
    var dd = ((g.o.pdl || .25) + (g.o.lam || .22)) * k + (right ? 0 : 0), xs = g.roots.map(function (r) { var t = Math.max(0, (y - r.y0) / r.len); return xAx(r, t) + (right ? 1 : -1) * xHw(r, t); });
    return right ? Math.max.apply(null, xs) + dd + (g.o.fun || 0) * k : Math.min.apply(null, xs) - dd - (g.o.fun || 0) * k;
  }
  gs.forEach(function (g, i) {
    var c = xCrestLR(g), xl = side(g, false, c[0]), xr = side(g, true, c[1]);
    if (i === 0) top.push([-5, c[0] - .3 * k]);
    top.push([xl, c[0]], [g.x, Math.max(c[0], c[1]) + .5 * k], [xr, c[1]]);
    var nx = gs[i + 1];
    if (nx) { var cn = xCrestLR(nx), xn = side(nx, false, cn[0]);
      var lo = Math.min(c[1], cn[0]), px = c[1] > cn[0] + 2 ? xn - .9 * k : cn[0] > c[1] + 2 ? xr + .9 * k : (xr + xn) / 2;
      top.push([px, lo - .4 * k]); }
    else top.push([w + 5, c[1] - .3 * k]);
  });
  var s = xPath("xr-bone", top.concat([[w + 5, yBottom], [-5, yBottom]]));
  function yTop(x) { for (var i = 1; i < top.length; i++) if (x <= top[i][0]) { var a = top[i - 1], b = top[i], t = (x - a[0]) / ((b[0] - a[0]) || 1); return a[1] + (b[1] - a[1]) * t; } return top[top.length - 1][1]; }
  var r = xRnd(seed), yMin = Math.min.apply(null, top.map(function (p) { return p[1]; }));
  /* the trabeculae, on the film only (the bone runs on under its lower edge); whole pixels are enough at this size */
  var tb = ["", ""], yEnd = yBottom - 60;
  for (var i = 0; i < 200; i++) { var cx = Math.round(r() * w), cy = Math.round(yMin + r() * (yEnd - yMin)), rx = 1.5 + r() * 5, ry = 1 + r() * 2.6, a = Math.round(r() * 180), cl = r() < .55 ? 0 : 1;
    if (cy < yTop(cx) + 3 || cy > yEnd - 2) continue;
    tb[cl] += '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + xF(rx) + '" ry="' + xF(ry) + '" transform="rotate(' + a + " " + cx + " " + cy + ')"/>'; }
  s += '<g class="xr-tb">' + tb[0] + '</g><g class="xr-tb2">' + tb[1] + "</g>";
  s += xPath("xr-cortex", top.slice(1, -1), true);
  return s;
}
/* teeth in contact from left to right, the one at index ci (#29) centered at cx */
function xRow(list, cx, occ, k, D, ci) {
  var x = cx - D.XT[list[ci].t].cw * k / 2, j, gs = [];
  for (j = 0; j < ci; j++) x -= D.XT[list[j].t].cw * k - .15 * k;
  list.forEach(function (o) { var d = D.XT[o.t]; o.k = k; o.occ = occ; o.x = x + d.cw * k / 2; gs.push(xTooth(o, D)); x += d.cw * k - .15 * k; });
  return gs;
}
/* the furcation lesion of a two-rooted tooth: from the furcation down depth mm, between the roots' PDL spaces */
function xFurc(g, dep) {
  var k = g.k, yf = g.cej + g.d.tr * k, l = g.roots[0], r = g.roots[1], L = g.sg > 0 ? l : r, R = g.sg > 0 ? r : l, pts = [], i, n = 6, dd = (g.o.pdl || .25) * k;
  function tOf(rt, y) { return Math.max(0, (y - rt.y0) / rt.len); }
  for (i = 0; i <= n; i++) { var y = yf + dep * k * i / n, t = tOf(L, y); pts.push([xAx(L, t) + xHw(L, t) + dd, y]); }
  var yb = yf + dep * k, tb1 = tOf(L, yb), tb2 = tOf(R, yb), xm = (xAx(L, tb1) + xHw(L, tb1) + xAx(R, tb2) - xHw(R, tb2)) / 2;
  pts.push([xm, yb + 1.1 * k]);
  for (i = n; i >= 0; i--) { var y2 = yf + dep * k * i / n, t2 = tOf(R, y2); pts.push([xAx(R, t2) - xHw(R, t2) - dd, y2]); }
  return xDense(pts, true, 3);
}
/* a label on a dark card inside the film, its leader up to p */
function xLab(lines, x, y, p) {
  var w = Math.max.apply(null, lines.map(function (s) { return s.length; })) * 6.2 + 12, h = lines.length * 13 + 7, s = '<g class="xr-call">';
  s += '<path class="xr-lead" d="M' + xF(x + w / 2) + " " + xF(y - 12) + "L" + xF(p[0]) + " " + xF(p[1]) + '"/><circle class="xr-lead-dot" cx="' + xF(p[0]) + '" cy="' + xF(p[1]) + '" r="2"/>';
  s += '<rect class="xr-card" x="' + xF(x) + '" y="' + xF(y - 12) + '" width="' + xF(w) + '" height="' + h + '" rx="4"/>';
  lines.forEach(function (t, i) { s += '<text class="xr-lab2" x="' + xF(x + 6) + '" y="' + xF(y + 1 + i * 13) + '">' + t + "</text>"; });
  return s + "</g>";
}
/* the labels beside the film, on soft cards, each with a leader to its part: sorted by the part's height and kept
   apart, so no leader crosses another card */
function xColumn(labs, D) {
  var x0 = D.FW + 8, gap = 8, s = "", i;
  labs.forEach(function (l) { l.h = l.lines.length * 14 + 8; l.cy = l.p[1]; });
  labs.sort(function (a, b) { return a.p[1] - b.p[1]; });
  for (i = 1; i < labs.length; i++) { var lo = labs[i - 1].cy + labs[i - 1].h / 2 + gap + labs[i].h / 2; if (labs[i].cy < lo) labs[i].cy = lo; }
  for (i = labs.length - 1; i >= 0; i--) { var hi = i === labs.length - 1 ? D.H - 6 - labs[i].h / 2 : labs[i + 1].cy - labs[i + 1].h / 2 - gap - labs[i].h / 2; if (labs[i].cy > hi) labs[i].cy = hi; }
  labs.forEach(function (l) {
    var w = Math.max.apply(null, l.lines.map(function (t) { return t.length; })) * 7.3 + 14, top = l.cy - l.h / 2;
    s += '<g class="ox-call"><path class="ox-lead-c" d="M' + x0 + " " + xF(l.cy) + "L" + xF(l.p[0]) + " " + xF(l.p[1]) + '"/><path class="ox-lead" d="M' + x0 + " " + xF(l.cy) + "L" + xF(l.p[0]) + " " + xF(l.p[1]) + '"/>';
    s += '<circle class="ox-dot" cx="' + xF(l.p[0]) + '" cy="' + xF(l.p[1]) + '" r="2.4"/>';
    s += '<rect class="ox-card" x="' + x0 + '" y="' + xF(top) + '" width="' + xF(w) + '" height="' + l.h + '" rx="5"/>';
    l.lines.forEach(function (t, j) { s += '<text class="ox-t' + (j ? "" : " ox-strong") + '" x="' + (x0 + 7) + '" y="' + xF(top + 15 + j * 14) + '">' + t + "</text>"; });
    s += "</g>";
  });
  return s;
}
/* the whole figure from the state: pdl 'n' | 'w', lam 'n' | 't' | 'd', bone 'none' | 'vert' | 'furc' | 'circ', res */
function xDraw(st, D) {
  var k = D.K, w = D.FW, h = D.H, occ = 28;
  var p29 = { t: "manP2", m: true, pdl: .25, lam: .22 };
  if (st.pdl === "w") { p29.pdl = .45; p29.fun = .55; p29.apx = .15; }
  if (st.lam === "t") p29.lam = .6;
  if (st.bone === "vert") p29.bone = [5.2, 0];
  if (st.bone === "circ") p29.bone = [4.6, 4.6];
  if (st.res) p29.res = 2.4;
  var m1 = { t: "manM1", m: true, pdl: .25, lam: .22, bone: st.bone === "furc" ? [.6, .6] : 0 };
  var gs = xRow([m1, p29, { t: "manP1", m: true, lift: .2 }, { t: "manC", m: true, lift: -.3 }], w / 2, occ, k, D, 1);
  var g = gs[1], gm = gs[0], s = "";
  s += '<rect class="xr-film" x="0" y="0" width="' + w + '" height="' + h + '"/>';
  s += '<rect class="xr-soft" x="0" y="' + xF(occ - 1.2 * k) + '" width="' + w + '" height="' + h + '"/>';
  s += '<g class="hot" data-info="' + D.HOT.bone + '">' + xBone(gs, w, h + 60, 29) + "</g>";
  /* the lamina dura, then the PDL space over it, then the teeth */
  var lamInfo = ' data-info="' + (st.lam === "t" ? D.HOT.lamt : st.lam === "d" ? D.HOT.lamd : D.HOT.lam) + '"';
  gs.forEach(function (t) { xSocket(t, (t.o.pdl || .25) + (t.o.lam || .22)).forEach(function (pts) { s += xPath(t === g ? "xr-lam hot" : "xr-lam", pts, false, t === g ? lamInfo : ""); }); });
  /* discontinued: the bone covers the line in places, so it disappears and appears again */
  if (st.lam === "d") xSocket(g, (g.o.pdl || .25) + (g.o.lam || .22) * .6).forEach(function (pts) { s += xPath("xr-gap", pts, true); });
  if (st.bone === "furc") s += xPath("xr-lesion hot", xFurc(gm, 3.6), false, ' data-info="' + D.HOT.furc + '"');
  var pdlInfo = ' data-info="' + (st.pdl === "w" ? D.HOT.pdlw : D.HOT.pdl) + '"';
  gs.forEach(function (t) { xSocket(t, t.o.pdl || .25).forEach(function (pts) { s += xPath(t === g ? "xr-pdl hot" : "xr-pdl", pts, false, t === g ? pdlInfo : ""); }); });
  gs.forEach(function (t) { s += xToothSVG(t, t === g || t === gm ? D.HOT.tooth : ""); });
  /* bone loss is read against the line connecting the CEJs: horizontal runs parallel to it, a vertical defect is oblique */
  if (st.bone === "vert" || st.bone === "circ") {
    var cj = function (t, right) { var d = t.d, x = t.x + (right ? 1 : -1) * d.cv / 2 * k; return xF(x) + " " + xF(t.cej); };
    s += '<path class="xr-cejline hot" data-info="' + D.HOT.cej + '" d="M' + cj(gm, true) + "L" + cj(g, false) + "M" + cj(g, true) + "L" + cj(gs[2], false) + '"/>';
  }
  /* the teeth's numbers, over the crowns */
  [[gm, "#30"], [g, "#29"], [gs[2], "#28"]].forEach(function (q) { s += '<text class="xr-num" x="' + xF(q[0].x) + '" y="16" text-anchor="middle">' + q[1] + "</text>"; });
  if (st.bone === "furc") { var yb = gm.cej + gm.d.tr * k + 3.6 * k + 6; s += xLab(["furcation", "bone loss"], gm.x - 34, h - 36, [gm.x, yb]); }
  s += '<circle class="xr-dot" cx="' + (w - 14) + '" cy="10" r="3"/>';
  /* around the film's corners and cut it at its edge: the page shows outside it */
  var R = 12;
  s += '<path class="xr-corner" fill-rule="evenodd" d="M-2 -2H' + (D.W + 2) + "V" + (h + 2) + "H-2Z M" + R + " 0H" + (w - R) + "A" + R + " " + R + " 0 0 1 " + w + " " + R + "V" + (h - R) + "A" + R + " " + R + " 0 0 1 " + (w - R) + " " + h + "H" + R + "A" + R + " " + R + " 0 0 1 0 " + (h - R) + "V" + R + "A" + R + " " + R + ' 0 0 1 ' + R + ' 0Z"/>';
  /* the labels, beside the film, for #29's mesial (right) side */
  var r = g.roots[0], cR = xCrestLR(g)[1], pd = (g.o.pdl || .25) * k, la = (g.o.lam || .22) * k;
  function edge(t, off) { return [xAx(r, t) + xHw(r, t) + off, r.y0 + t * r.len]; }
  var labs = [], any = st.pdl === "w" || st.lam !== "n" || st.bone !== "none" || st.res, tc = Math.min(.9, (cR - r.y0) / r.len);
  if (!any) { labs.push({ lines: ["PDL space", "~0.25 mm"], p: edge(.42, pd / 2) }); labs.push({ lines: ["lamina dura"], p: edge(.64, pd + la / 2) }); }
  if (st.pdl === "w") { var tp = st.bone === "vert" || st.bone === "circ" ? .86 : tc + .05, ex = tp < .4 ? .55 * k * Math.pow(1 - tp / .4, 1.5) : .15 * k * Math.pow(Math.max(0, (tp - .7) / .3), 1.5); labs.push({ lines: ["widened", "PDL space"], p: edge(tp, (pd + ex) / 2) }); }
  if (st.lam !== "n") labs.push({ lines: [st.lam === "t" ? "thickened" : "discontinued", "lamina dura"], p: edge(.66, pd + (st.lam === "t" ? la / 2 : 1)) });
  if (st.bone === "vert" || st.bone === "circ") {
    /* a point inside the defect: between the root's PDL and the bone's slope up to the septum by #28 */
    var r28 = gs[2].roots[0], c28 = xCrestLR(gs[2])[0], t28 = Math.max(0, (c28 - r28.y0) / r28.len), px = xAx(r28, t28) - xHw(r28, t28) - (.47 + .9) * k, py = c28 - .4 * k;
    var xc = xAx(r, tc) + xHw(r, tc) + pd + la + (g.o.fun || 0) * k, yt = cR + .4 * (py - cR), t2 = (yt - r.y0) / r.len, xp = xAx(r, t2) + xHw(r, t2) + pd;
    labs.push({ lines: st.bone === "vert" ? ["vertical", "defect"] : ["circumferential", "bone loss"], p: [(xp + xc + .4 * (px - xc)) / 2, yt] });
  }
  if (st.res) labs.push({ lines: ["root", "resorption"], p: [xAx(r, 1), r.y0 + r.len + r.wa + 1] });
  s += xColumn(labs, D);
  return s;
}

const ST0 = { pdl: "n", lam: "n", bone: "none", res: false };
const DATA = { W, H, FW, K, XT, HOT, TEXT };
const helpers = [xF, xRnd, xDense, xPoly, xPath, xCrown, xRoots, xAx, xHw, xRootOut, xTooth, xCrestLR, xTrunk, xSocket, xPulp, xToothSVG, xBone, xRow, xFurc, xLab, xColumn, xDraw];
const svg = figureSvg({ width: W, height: H, className: "xr ox-film", label: "A periapical radiograph of the lower right, #30, #29 and #28: the PDL space and lamina dura around each root, and the bone's crest. Controls add the radiographic signs of occlusal trauma to #29 (and the furcation to #30).", body: xDraw(ST0, DATA) });
const plate = plateHtml({ fig: "Fig 29", title: "The radiographic signs", hint: "turn on each sign", readout: "a healthy film", body: `<div class="am-svg ox-box">${svg}</div>` });
const controls = `<div class="am-controls ox-ctl" role="group" aria-label="PDL space"><span class="ox-lab">PDL space</span><button type="button" class="am-btn" data-oxp="n" aria-pressed="true">About 0.25 mm</button><button type="button" class="am-btn" data-oxp="w" aria-pressed="false">Widened</button></div>
<div class="am-controls ox-ctl" role="group" aria-label="Lamina dura"><span class="ox-lab">Lamina dura</span><button type="button" class="am-btn" data-oxl="n" aria-pressed="true">Normal</button><button type="button" class="am-btn" data-oxl="t" aria-pressed="false">Thickened</button><button type="button" class="am-btn" data-oxl="d" aria-pressed="false">Discontinued</button></div>
<div class="am-controls ox-ctl" role="group" aria-label="Bone loss"><span class="ox-lab">Bone loss</span><button type="button" class="am-btn" data-oxb="none" aria-pressed="true">None</button><button type="button" class="am-btn" data-oxb="vert" aria-pressed="false">Vertical</button><button type="button" class="am-btn" data-oxb="furc" aria-pressed="false">Furcation</button><button type="button" class="am-btn" data-oxb="circ" aria-pressed="false">Circumferential</button></div>
<div class="am-controls ox-ctl" role="group" aria-label="Root"><span class="ox-lab">Root</span><button type="button" class="am-btn" data-oxr aria-pressed="false">Root resorption</button></div>
<div class="am-controls ox-ctl"><button type="button" class="am-btn" data-oxall>Show them all</button><button type="button" class="am-btn" data-oxclear>Back to a healthy film</button></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Hover or tap the film: the PDL space, the lamina dura, the bone or the teeth.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From the L10 notes (Dr. Abou-Arraj's lecture and slides): the radiographic indicators of occlusal trauma are a widened PDL space (roughly 0.25 mm in health; widened, the tooth is likely mobile, to confirm clinically), a discontinued or thickened lamina dura, bone loss (furcation, vertical, circumferential) and root resorption. They are surrogate indicators: occlusal trauma can only be confirmed histologically. A vertical defect does not mean occlusal trauma, and every one of these signs can exist without it.</li>
<li>Outside sources: the teeth are drawn to average dimensions (Wheeler's Dental Anatomy), the same way the hub's Patient Box films are. Coolidge (J Am Dent Assoc 1937) measured the PDL at about 0.15-0.38 mm, thinnest at mid-root, consistent with the lecture's roughly 0.25 mm. Under forces that push a tooth one way and then the other, the PDL widens most at the crest and the apex (Lindhe's Clinical Periodontology, trauma from occlusion), which is how the widened space is drawn here.</li>
<li>Schematic: an illustration, not a patient's radiograph. The signs are drawn one tooth at a time so each can be seen; a real film would show them less cleanly, and which signs appear together varies. Educational, not clinical guidance.</li></ul></details>`;

function oxLive(root, D) {
  var film = root.querySelector(".ox-film"), sum = root.querySelector(".am-summary"), info = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]");
  var st = { pdl: "n", lam: "n", bone: "none", res: false }, last = "base";
  function press(attr, val) { root.querySelectorAll("[" + attr + "]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute(attr) === val)); }); }
  function sync() { press("data-oxp", st.pdl); press("data-oxl", st.lam); press("data-oxb", st.bone); var r = root.querySelector("[data-oxr]"); if (r) r.setAttribute("aria-pressed", String(st.res)); }
  function apply() {
    film.innerHTML = D.xDraw(st, D);
    var n = (st.pdl === "w" ? 1 : 0) + (st.lam !== "n" ? 1 : 0) + (st.bone !== "none" ? 1 : 0) + (st.res ? 1 : 0);
    var s = n === 0 ? D.TEXT.base : (n > 1 && last === "all" ? "Every sign on his slide at once: a widened PDL space, a changed lamina dura, bone loss and root resorption. A real tooth rarely shows them all." : D.TEXT[last] || D.TEXT.base) + D.TEXT.caveat;
    sum.textContent = s;
    if (readout) readout.textContent = n === 0 ? "a healthy film" : n === 1 ? "1 sign on" : n + " signs on";
  }
  root.querySelectorAll("[data-oxp]").forEach(function (b) { b.addEventListener("click", function () { st.pdl = b.getAttribute("data-oxp"); last = st.pdl === "w" ? "pdl" : "base"; sync(); apply(); }); });
  root.querySelectorAll("[data-oxl]").forEach(function (b) { b.addEventListener("click", function () { st.lam = b.getAttribute("data-oxl"); last = st.lam === "t" ? "lamt" : st.lam === "d" ? "lamd" : "base"; sync(); apply(); }); });
  root.querySelectorAll("[data-oxb]").forEach(function (b) { b.addEventListener("click", function () { st.bone = b.getAttribute("data-oxb"); last = st.bone === "none" ? "base" : st.bone; sync(); apply(); }); });
  var rb = root.querySelector("[data-oxr]"); if (rb) rb.addEventListener("click", function () { st.res = !st.res; last = st.res ? "res" : "base"; sync(); apply(); });
  var all = root.querySelector("[data-oxall]"); if (all) all.addEventListener("click", function () { st = { pdl: "w", lam: "d", bone: "vert", res: true }; last = "all"; sync(); apply(); });
  var clr = root.querySelector("[data-oxclear]"); if (clr) clr.addEventListener("click", function () { st = { pdl: "n", lam: "n", bone: "none", res: false }; last = "base"; sync(); apply(); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && root.contains(el) && el.getAttribute("data-info")) info.textContent = el.getAttribute("data-info"); }
  film.addEventListener("pointerover", hot); film.addEventListener("click", hot);
  sync(); apply();
}

const CSS = `
.anima .ox-box{max-width:520px;margin:0 auto}
.anima .ox-film{border-radius:14px}
.anima .ox-film .xr-film{fill:#121212}.anima .ox-film .xr-soft{fill:#242424}.anima .ox-film .xr-bone{fill:#5e5e5e}
.anima .ox-film .xr-tb{fill:#7a7a7a;opacity:.5}.anima .ox-film .xr-tb2{fill:#3c3c3c;opacity:.45}
.anima .ox-film .xr-cortex{fill:none;stroke:#8c8c8c;stroke-width:1.6;stroke-linejoin:round}
.anima .ox-film .xr-lam{fill:#cfcfcf}.anima .ox-film .xr-pdl{fill:#2a2a2a}.anima .ox-film .xr-dentin{fill:#b2b2b2}.anima .ox-film .xr-enamel{fill:#ececec}.anima .ox-film .xr-pulp{fill:#4f4f4f}
.anima .ox-film .xr-gap{fill:none;stroke:#5e5e5e;stroke-width:4;stroke-dasharray:10 24 15 32;stroke-linecap:butt;vector-effect:none}
.anima .ox-film .xr-lesion{fill:#2e2e2e}
.anima .ox-film .xr-dot{fill:#f3f3f3}
.anima .ox-film .xr-lead{fill:none;stroke:#f4f4f4;stroke-width:1.1}.anima .ox-film .xr-lead-dot{fill:#f4f4f4}
.anima .ox-film .xr-card{fill:#0b0b0b;fill-opacity:.82;stroke:#6b6b6b;stroke-width:.8}
.anima .ox-film .xr-lab2{fill:#f4f4f4;font:600 11px var(--font-body)}
.anima .ox-film .xr-num{fill:#d9d9d9;font:600 11px var(--font-body);paint-order:stroke;stroke:#121212;stroke-width:3px}
.anima .ox-film .xr-corner{fill:var(--surface)}
.anima .ox-ctl{gap:6px 8px;margin:10px 0 2px}
.anima .ox-lab{flex:0 0 100%;font:600 .72rem var(--font-mono);color:var(--ink-faint);text-transform:uppercase;letter-spacing:.04em}
.anima .ox-film .xr-cejline{fill:none;stroke:#e6e6e6;stroke-width:1.2;stroke-dasharray:4 3;vector-effect:none;opacity:.9}
.anima .ox-film .ox-card{fill:var(--surface);fill-opacity:.94;stroke:var(--line-strong);stroke-width:1}
.anima .ox-film .ox-t{fill:var(--anatomy-text);font:12px var(--anatomy-mono)}
.anima .ox-film .ox-strong{fill:var(--anatomy-strong);font-weight:700}
.anima .ox-film .ox-lead-c{fill:none;stroke:#141414;stroke-width:3;stroke-linecap:round}
.anima .ox-film .ox-lead{fill:none;stroke:#f4f4f4;stroke-width:1.2;stroke-linecap:round}
.anima .ox-film .ox-dot{fill:#f4f4f4;stroke:#141414;stroke-width:1.2}
`;

export function otxray() {
  return {
    id: "otxray", lec: "occtrauma",
    title: "The radiographic signs of occlusal trauma",
    caption: "A healthy film of the lower right, then each sign from his slide: a widened PDL space, a thickened or discontinued lamina dura, bone loss (vertical, furcation, circumferential) and root resorption. None of them proves occlusal trauma.",
    html: `<div class="anima" data-anima="otxray">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: oxLive.toString(),
    helpers,
    data: DATA,
  };
}
