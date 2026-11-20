// Fig 31: what the 1970s animal experiments showed (Occlusion L10, "The animal experiments of the 1970s"; Dr. Abou-Arraj's
// lecture). One premolar in buccolingual section, standing in its bone: the CEJ, the attachment level, the bone's crest,
// the PDL and the bone's density (drawn as how many trabeculae are left). Controls set occlusal trauma (none, a jiggling
// force, or stopped 10 weeks earlier) and inflammation (none, gingivitis on a normal periodontium, periodontitis on a
// reduced one); with periodontitis and jiggling, which animals (beagle dogs or squirrel monkeys), because the two groups
// disagreed there. Findings from the L10 notes' table; the millimeters are schematic. The browser redraws the section.
import { figureSvg, plateHtml } from "./shared.mjs";

const W = 380, H = 352;
/* mm, y up from the CEJ, x from the long axis; buccal is negative. The tooth is L9's premolar (abfract.mjs: Wheeler's
   mandibular second premolar, crown 8 mm, root 14.5 mm) */
const G = {
  OX: 126, OY: 122, S: 10.5, X0: 220,
  CROWN: [[-3.5, 0], [-3.82, 0.9], [-4.0, 2.3], [-3.92, 3.6], [-3.6, 4.8], [-2.9, 6.2], [-1.8, 7.4], [-0.5, 8.1], [0.3, 7.6], [0.95, 6.45], [1.55, 6.6], [2.3, 7.1], [3.1, 6.6], [3.6, 5.5], [3.9, 4.0], [3.85, 2.4], [3.65, 1.0], [3.5, 0]],
  DEJ: [[-3.5, 0], [-3.3, 1.0], [-3.12, 2.3], [-2.88, 3.6], [-2.42, 4.75], [-1.62, 5.6], [-0.62, 6.3], [0.38, 5.62], [1.0, 5.2], [1.68, 5.48], [2.2, 5.8], [2.8, 5.0], [3.02, 3.6], [3.2, 2.0], [3.4, 0.9], [3.5, 0]],
  ROOT: [[3.5, 0], [3.49, -0.3], [3.45, -1.5], [3.3, -3.5], [3.0, -6.5], [2.5, -9.5], [1.8, -12.0], [0.9, -13.9], [0, -14.5], [-0.9, -13.9], [-1.8, -12.0], [-2.5, -9.5], [-3.0, -6.5], [-3.3, -3.5], [-3.45, -1.5], [-3.49, -0.3], [-3.5, 0]],
  PULP: [[-0.62, 5.0], [-0.15, 4.2], [0.55, 4.0], [1.15, 4.25], [1.45, 3.6], [1.3, 2.2], [0.95, 0.5], [0.62, -1.5], [0.45, -6], [0.3, -10.5], [0.14, -13.5], [-0.14, -13.5], [-0.3, -10.5], [-0.45, -6], [-0.62, -1.5], [-0.95, 0.5], [-1.2, 2.2], [-1.15, 3.8]],
  /* the bone's outer surface on each side, from the bottom up to a normal crest 1.8 mm below the CEJ */
  OUTB: [[-7.9, -20], [-7.2, -16.5], [-6.3, -12.5], [-5.5, -8.5], [-5.0, -5.2], [-4.55, -3.0], [-3.78, -1.8]],
  OUTL: [[8.2, -20], [7.6, -16.5], [6.8, -12.5], [6.0, -8.5], [5.35, -5.2], [4.75, -3.0], [3.78, -1.8]],
  /* the crown's cervical surface, for the gingival margin (buccal, lingual), from the CEJ up */
  CERV: [[[-3.5, 0], [-3.82, 0.9], [-4.0, 2.3]], [[3.5, 0], [3.65, 1.0], [3.85, 2.4]]],
};
/* trabeculae: places in the bone (seeded, so the same every time); u decides which go first as density falls */
function trabeculae() {
  let s = 20241112; const r = () => { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; };
  const lerp = (pts, y) => { for (let i = 1; i < pts.length; i++) if (y <= pts[i][1]) { const a = pts[i - 1], b = pts[i], t = (y - a[1]) / (b[1] - a[1]); return a[0] + (b[0] - a[0]) * t; } return pts[pts.length - 1][0]; };
  const out = [];
  for (let i = 0; i < 1400 && out.length < 270; i++) {
    const x = -8.2 + r() * 16.6, y = -19.8 + r() * 17.6, rx = .28 + r() * .3, ry = .12 + r() * .12, a = Math.round(r() * 180), u = r();
    if (x < lerp(G.OUTB, y) + .3 || x > lerp(G.OUTL, y) - .3) continue;
    const half = y > -14 ? (y > -1.5 ? 3.5 : lerp(y > -12 ? [[2.3, -10.5], [3.0, -6.5], [3.3, -3.5], [3.45, -1.5]] : [[0, -14.5], [1.8, -12]], y)) : 0;
    if (y > -14.2 && Math.abs(x) < half + .45) continue;
    if (y <= -14.2 && Math.hypot(x, y + 13.6) < 1.5) continue;
    out.push([+x.toFixed(1), +y.toFixed(1), +rx.toFixed(2), +ry.toFixed(2), a, +u.toFixed(2)]);
  }
  return out;
}
const HOT = {
  tooth: "The tooth: a premolar in section, enamel over the crown, dentin, and the pulp inside.",
  cej: "The CEJ, where the enamel ends: the reference for the attachment level.",
  att: "The attachment level: how far down the root the gingiva and the PDL fibers still hold. Attachment loss is measured from the CEJ.",
  pdl: "The PDL space between the root and the socket. Under a jiggling force it widens into an hourglass, widest at the crest and the apex.",
  bone: "The alveolar bone. Its density is drawn as how many trabeculae are left: fewer means more radiolucent on a film.",
  crest: "The bone's crest. Trauma alone takes density, not height: the crest stays where it was.",
  lost: "The dashed outline: where the bone was before. Crestal bone lost in height.",
  gum: "The gingiva.",
  guminf: "Inflamed gingiva: red and swollen, from the plaque.",
  plaque: "Plaque. At the margin it inflames the gingiva (gingivitis); subgingival, it goes with the attachment and bone loss of periodontitis.",
  force: "A jiggling force: from one side, then from the other. Pressure and tension on both sides of the root.",
};

function otF(n) { return Math.round(n * 10) / 10; }
/* what the experiments found, as the drawing's numbers: c the crest (mm below the CEJ), cal the attachment loss (mm),
   dens the bone's density (1 normal), w the PDL's widening (0-1), rock how far the tooth moves (degrees, only while
   jiggled). Schematic values; the words in otText are the findings */
function otParams(st) {
  var p = { c: 1.8, cal: 0, dens: 1, w: 0, rock: 0 }, perio = st.inf === "perio", dog = st.model === "dog";
  if (perio) { p.c = 5.0; p.cal = 4.0; }
  if (st.tr === "on") {
    p.w = 1; p.rock = perio ? 3 : 2; p.dens = st.inf === "none" ? .45 : .25;
    if (perio && dog) { p.c = 6.5; p.cal = 5.5; }
  }
  if (st.tr === "off" && perio) { p.w = 1; p.dens = .3; }
  return p;
}
function otLerp(pts, y) {
  for (var i = 1; i < pts.length; i++) if (y <= pts[i][1]) { var a = pts[i - 1], b = pts[i], t = (y - a[1]) / ((b[1] - a[1]) || 1); return a[0] + (b[0] - a[0]) * t; }
  return pts[pts.length - 1][0];
}
/* the tooth's surface on side s (-1 buccal, 1 lingual) at height y: the root below the CEJ, the crown's cervical part above */
function otToothX(y, s, D) {
  if (y > 0) { var c = D.CERV[s < 0 ? 0 : 1]; return otLerp(c, y); }
  var R = D.ROOT, side = [], i;
  for (i = 0; i < R.length; i++) if ((s > 0 && R[i][0] >= 0 && i <= 8) || (s < 0 && R[i][0] <= 0 && i >= 8)) side.push(R[i]);
  side.sort(function (a, b) { return a[1] - b[1]; });
  return y < -14.5 ? 0 : otLerp(side, y);
}
/* the PDL's width at height y: about 0.25 mm; a jiggling force widens it into an hourglass, most at the crest and the apex */
function otPdl(y, c, w) {
  var a = Math.exp(-Math.pow((y + c) / 2.2, 2)), b = Math.exp(-Math.pow((y + 14.5) / 2.6, 2));
  return .25 + w * (.42 * a + .3 * b);
}
function otDense(pts, per) {
  var n = pts.length, out = [];
  for (var i = 0; i < n - 1; i++) {
    var p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
    var c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    for (var j = 0; j < per; j++) { var t = j / per, u = 1 - t;
      out.push([u * u * u * p1[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p2[0], u * u * u * p1[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p2[1]]); }
  }
  out.push(pts[n - 1]);
  return out;
}
/* the socket wall: the root offset outward by the PDL's width, from the crest on the lingual around the apex to the buccal */
function otSocket(c, w, D) {
  var R = otDense(D.ROOT, 6), off = [], out = [], i;
  for (i = 0; i < R.length; i++) {
    var a = R[Math.max(0, i - 1)], b = R[Math.min(R.length - 1, i + 1)], tx = b[0] - a[0], ty = b[1] - a[1], L = Math.sqrt(tx * tx + ty * ty) || 1, d = otPdl(R[i][1], c, w);
    off.push([R[i][0] - ty / L * d, R[i][1] + tx / L * d]);
  }
  for (i = 0; i < off.length; i++) {
    var p = off[i], q = off[i + 1];
    if (p[1] <= -c) out.push(p);
    if (q && (p[1] <= -c) !== (q[1] <= -c)) { var t = (-c - p[1]) / (q[1] - p[1]); out.push([p[0] + (q[0] - p[0]) * t, -c]); }
  }
  return out;
}
function otPath(pts, closed, D) {
  var n = pts.length, last = closed ? n : n - 1;
  function P(p) { return [D.OX + p[0] * D.S, D.OY - p[1] * D.S]; }
  var q = pts.map(P), d = "M" + otF(q[0][0]) + " " + otF(q[0][1]);
  for (var i = 0; i < last; i++) { var p0 = q[(i - 1 + n) % n], p1 = q[i], p2 = q[(i + 1) % n], p3 = q[(i + 2) % n];
    if (!closed) { if (i === 0) p0 = p1; if (i + 2 >= n) p3 = p2; }
    d += "C" + otF(p1[0] + (p2[0] - p0[0]) / 6) + " " + otF(p1[1] + (p2[1] - p0[1]) / 6) + " " + otF(p2[0] - (p3[0] - p1[0]) / 6) + " " + otF(p2[1] - (p3[1] - p1[1]) / 6) + " " + otF(p2[0]) + " " + otF(p2[1]); }
  return d + (closed ? "Z" : "");
}
function otLine(pts, D) { return "M" + pts.map(function (p) { return otF(D.OX + p[0] * D.S) + " " + otF(D.OY - p[1] * D.S); }).join("L"); }
/* the bone: up each outer surface to the crest, over it, and down the socket wall around the apex */
function otBone(c, w, D) {
  var sock = otSocket(c, w, D), xb = otLerp(D.OUTB, -c), xl = otLerp(D.OUTL, -c);
  var ob = D.OUTB.filter(function (p) { return p[1] < -c - .3; }), ol = D.OUTL.filter(function (p) { return p[1] < -c - .3; });
  var sb = sock[sock.length - 1], sl = sock[0];
  return ob.concat([[xb, -c - .1], [(xb + sb[0]) / 2, -c + .12], [sb[0], -c]]).concat(sock.slice(1, -1).reverse()).concat([[sl[0], -c], [(xl + sl[0]) / 2, -c + .12], [xl, -c - .1]]).concat(ol.reverse());
}
/* the gingiva on side s: from the margin down the tooth (a pocket where attachment was lost), over the crest, down the
   bone's outer surface, and back up its outside */
function otGum(s, c, cal, inf, D) {
  var gm = inf === "none" ? .8 : 1.25, T = inf === "none" ? 1.15 : cal > 0 ? 1.3 : 1.75, pw = cal > 0 ? .75 : .1, yb = -cal, pts = [], i, y;
  for (i = 0; i <= 8; i++) { y = gm - (gm + c) * i / 8; var gap = y > yb ? pw * Math.pow((y - yb) / (gm - yb), .8) : 0; pts.push([otToothX(y, s, D) + s * gap, y]); }
  var out = s < 0 ? D.OUTB : D.OUTL, xo = otLerp(out, -c), sock = otSocket(c, 0, D), sx = s < 0 ? sock[sock.length - 1][0] : sock[0][0];
  pts.push([sx, -c], [xo, -c - .1]);
  var yl = Math.max(-19, -c - 3.4);
  for (i = 1; i <= 3; i++) { y = -c - (c + yl < 0 ? (-c - yl) * i / 3 : 0); pts.push([otLerp(out, y), y]); }
  pts.push([otLerp(out, yl) + s * T * .45, yl - .25]);
  for (i = 3; i >= 0; i--) { y = -c - (-c - yl) * i / 3; pts.push([otLerp(out, y) + s * T, y]); }
  pts.push([otToothX(gm - .7, s, D) + s * (.55 + (inf === "none" ? 0 : .55)), gm - .55], [otToothX(gm, s, D) + s * .3, gm + .02]);
  return pts;
}
/* the labels beside the drawing, on soft cards, sorted by the part's height and kept apart so no leader crosses a card */
function otColumn(labs, D) {
  var x0 = D.X0, gap = 7, s = "", i;
  labs.forEach(function (l) { l.h = l.lines.length * 14 + 8; l.cy = l.p[1]; });
  labs.sort(function (a, b) { return a.p[1] - b.p[1]; });
  for (i = 1; i < labs.length; i++) { var lo = labs[i - 1].cy + labs[i - 1].h / 2 + gap + labs[i].h / 2; if (labs[i].cy < lo) labs[i].cy = lo; }
  for (i = labs.length - 1; i >= 0; i--) { var hi = i === labs.length - 1 ? D.H - 6 - labs[i].h / 2 : labs[i + 1].cy - labs[i + 1].h / 2 - gap - labs[i].h / 2; if (labs[i].cy > hi) labs[i].cy = hi; }
  labs.forEach(function (l) {
    var w = Math.max.apply(null, l.lines.map(function (t) { return t.length; })) * 7.3 + 14, top = l.cy - l.h / 2;
    s += '<g class="ot-call"><path class="am-leader ot-lead" d="M' + x0 + " " + otF(l.cy) + "L" + otF(l.p[0]) + " " + otF(l.p[1]) + '"/><circle class="am-dot" cx="' + otF(l.p[0]) + '" cy="' + otF(l.p[1]) + '" r="2.2"/>';
    s += '<rect class="ot-card" x="' + x0 + '" y="' + otF(top) + '" width="' + otF(w) + '" height="' + l.h + '" rx="5"/>';
    l.lines.forEach(function (t, j) { s += '<text class="ot-t' + (j ? "" : " ot-strong") + (l.cls && j ? " " + l.cls : "") + '" x="' + (x0 + 7) + '" y="' + otF(top + 15 + j * 14) + '">' + t + "</text>"; });
    s += "</g>";
  });
  return s;
}
/* the words for each part, from the notes' table */
function otWords(st) {
  var on = st.tr === "on", off = st.tr === "off", perio = st.inf === "perio", ging = st.inf === "ging", dog = st.model === "dog";
  var w = {};
  w.att = !perio ? "no loss" : on ? (dog ? "lost more" : "no further loss") : "lost";
  w.crest = !perio ? (st.tr === "none" ? "normal" : "height unchanged") : on ? (dog ? "lower still" : "no lower") : "lower";
  w.dens = on ? (st.inf === "none" ? "lower" : "lower still") : off ? (perio ? "still low" : "regained") : "normal";
  w.pdl = on || (off && perio) ? "widened" : "~0.25 mm";
  w.mob = on ? (perio ? "increased more" : "increased") : off ? (perio ? "still increased" : "back to normal") : perio ? "increased (less bone)" : "normal";
  w.gum = perio ? "inflamed, a pocket" : ging ? "inflamed" : "healthy";
  return w;
}
function otDraw(st, D) {
  var p = D.otParams(st), S = D.S, s = "", i, inf = st.inf;
  function P(q) { return [D.OX + q[0] * S, D.OY - q[1] * S]; }
  function tx(x, y, t, cls, a) { return '<text class="ot-t' + (cls ? " " + cls : "") + '" x="' + otF(x) + '" y="' + otF(y) + '"' + (a ? ' text-anchor="' + a + '"' : "") + ">" + t + "</text>"; }
  /* the bone, its trabeculae (fewer as density falls, first beside the socket), the lost bone dashed */
  var bone = otBone(p.c, p.w, D);
  s += '<path class="ot-bone hot" data-info="' + D.HOT.bone + '" d="' + otLine(bone, D) + 'Z"/>';
  var tb = "";
  D.TRAB.forEach(function (t) {
    var x = t[0], y = t[1]; if (y > -p.c - .45) return;
    var dist = y > -14 ? Math.abs(x) - Math.abs(otToothX(y, x < 0 ? -1 : 1, D)) - otPdl(y, p.c, p.w) : Math.sqrt(x * x + Math.pow(y + 14, 2)) - .6 - otPdl(y, p.c, p.w);
    if (dist < .3) return;
    var keep = 1 - (1 - p.dens) * (1.45 - .65 * Math.min(1, Math.max(0, (dist - .3) / 3.2)));
    if (t[5] > keep) return;
    var q = P([x, y]), cx = Math.round(q[0]), cy = Math.round(q[1]);
    tb += '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + otF(t[2] * S) + '" ry="' + otF(t[3] * S) + '" transform="rotate(' + t[4] + " " + cx + " " + cy + ')"/>';
  });
  s += '<g class="ot-trab">' + tb + "</g>";
  /* the PDL in its socket */
  s += '<path class="ot-pdl hot" data-info="' + D.HOT.pdl + '" d="' + otPath(otSocket(p.c, p.w, D), false, D) + 'Z"/>';
  /* the gingiva on both sides */
  [-1, 1].forEach(function (sd) { s += '<path class="ot-gum' + (inf === "none" ? "" : " ot-inf") + ' hot" data-info="' + (inf === "none" ? D.HOT.gum : D.HOT.guminf) + '" d="' + otPath(otGum(sd, p.c, p.cal, inf, D), true, D) + '"/>'; });
  if (p.c > 1.85) {
    var ghost = otBone(1.8, 0, D).filter(function (q) { return q[1] > -p.c - .35; });
    [-1, 1].forEach(function (sd) { var g = ghost.filter(function (q) { return q[0] * sd > 0; }); if (g.length > 1) s += '<path class="ot-ghost hot" data-info="' + D.HOT.lost + '" d="' + otLine(g, D) + '"/>'; });
  }
  /* the tooth (it rocks while jiggled), with its CEJ and attachment level marked and any plaque on it */
  var tooth = D.CROWN.slice(0, -1).concat(D.ROOT.slice(0, -1)), dent = D.DEJ.slice(0, -1).concat(D.ROOT.slice(0, -1)), t = "";
  t += '<path class="ot-enamel" d="' + otPath(tooth, true, D) + '"/><path class="ot-dentin" d="' + otPath(dent, true, D) + '"/><path class="ot-pulp" d="' + otPath(D.PULP, true, D) + '"/><path class="ot-out" d="' + otPath(tooth, true, D) + '"/>';
  [-1, 1].forEach(function (sd) {
    var a = P([otToothX(0, sd, D) + sd * .05, 0]), b = P([otToothX(0, sd, D) - sd * .7, 0]);
    t += '<path class="ot-cej" d="M' + otF(a[0]) + " " + otF(a[1]) + "L" + otF(b[0]) + " " + otF(b[1]) + '"/>';
    if (p.cal > 0) { var y = -p.cal, a2 = P([otToothX(y, sd, D) + sd * .05, y]), b2 = P([otToothX(y, sd, D) - sd * .75, y]); t += '<path class="ot-att" d="M' + otF(a2[0]) + " " + otF(a2[1]) + "L" + otF(b2[0]) + " " + otF(b2[1]) + '"/>'; }
    if (inf !== "none") {
      var gm = 1.25, y0 = inf === "perio" ? gm - .1 : gm + 1.0, y1 = inf === "perio" ? -p.cal + .45 : gm + .05, n = inf === "perio" ? 9 : 4;
      for (i = 0; i < n; i++) { var yy = y0 - (y0 - y1) * i / Math.max(1, n - 1), q = P([otToothX(yy, sd, D) + sd * .24, yy]); t += '<circle class="ot-plaque" cx="' + otF(q[0]) + '" cy="' + otF(q[1]) + '" r="' + otF((.15 + .05 * (i % 3)) * S) + '"/>'; }
    }
  });
  var pv = P([0, -9]);
  s += '<g class="hot' + (p.rock ? " ot-rock" : "") + '" data-info="' + D.HOT.tooth + '"' + (p.rock ? ' style="--a:' + p.rock + "deg;transform-origin:" + otF(pv[0]) + "px " + otF(pv[1]) + 'px"' : "") + ">" + t + "</g>";
  /* the jiggling force: from one side, then the other */
  if (st.tr === "on") {
    var yA = D.OY - 4.6 * S, l0 = D.OX - 8.3 * S, r0 = D.OX + 8.3 * S, l1 = D.OX - 4.6 * S, r1 = D.OX + 4.5 * S;
    s += '<g class="hot" data-info="' + D.HOT.force + '"><path class="ot-force ot-fl" d="M' + otF(l0) + " " + otF(yA) + "L" + otF(l1 - 2) + " " + otF(yA) + "M" + otF(l1 - 10) + " " + otF(yA - 6) + "L" + otF(l1 - 1) + " " + otF(yA) + "L" + otF(l1 - 10) + " " + otF(yA + 6) + '"/>' +
      '<path class="ot-force ot-fr" d="M' + otF(r0) + " " + otF(yA) + "L" + otF(r1 + 2) + " " + otF(yA) + "M" + otF(r1 + 10) + " " + otF(yA - 6) + "L" + otF(r1 + 1) + " " + otF(yA) + "L" + otF(r1 + 10) + " " + otF(yA + 6) + '"/></g>';
    s += tx(D.OX, 14, "jiggling force", "ot-strong", "middle") + tx(D.OX, 27, "one side, then the other", "ot-cap", "middle");
  } else if (st.tr === "off") s += tx(D.OX, 14, "trauma stopped", "ot-strong", "middle") + tx(D.OX, 27, "10 weeks later", "ot-cap", "middle");
  if (inf === "perio" && st.tr !== "none") s += tx(6, D.H - 8, st.tr === "off" || st.model === "monkey" ? "squirrel monkeys" : "beagle dogs", "ot-cap ot-tag", "start");
  /* the labels */
  var wd = otWords(st), labs = [], c = p.c;
  var att = p.cal > 0 ? P([otToothX(-p.cal, 1, D) + .05, -p.cal]) : P([otToothX(0, 1, D) + .05, 0]);
  if (p.cal > 0) { labs.push({ lines: ["CEJ"], p: P([otToothX(0, 1, D) + .05, 0]) }); labs.push({ lines: ["attachment level", wd.att], p: att, cls: "ot-bad" }); }
  else labs.push({ lines: ["attachment level", "at the CEJ: no loss"], p: att });
  var xs = otSocket(c, p.w, D)[0][0], xo = otLerp(D.OUTL, -c);
  labs.push({ lines: ["bone crest", wd.crest + (c > 1.85 ? " (dashed: before)" : "")], p: P([(xs + xo) / 2, -c + .1]), cls: c > 1.85 ? "ot-bad" : "" });
  var yp = -c - 1.1, xpd = otToothX(yp, 1, D) + otPdl(yp, c, p.w) / 2;
  labs.push({ lines: ["PDL", wd.pdl], p: P([xpd, yp]), cls: p.w ? "ot-bad" : "" });
  labs.push({ lines: ["bone density", wd.dens], p: P([otLerp(D.OUTL, -10) - 1.3, -10]), cls: p.dens < 1 ? "ot-bad" : "" });
  if (inf !== "none") labs.push({ lines: ["gingiva", wd.gum], p: P([otLerp(D.OUTL, -c) + 1.3, -c - .6]), cls: "ot-bad" });
  /* the second line of a long crest label goes on its own */
  labs.forEach(function (l) { if (l.lines[1] && l.lines[1].length > 19) { var k = l.lines[1].indexOf(" ("); if (k > 0) l.lines = [l.lines[0], l.lines[1].slice(0, k), l.lines[1].slice(k + 1)]; } });
  s += otColumn(labs, D);
  return s;
}

const ST0 = { tr: "none", inf: "none", model: "dog" };
const DATA = Object.assign({ W, H, HOT, TRAB: trabeculae() }, G);
const helpers = [otF, otParams, otLerp, otToothX, otPdl, otDense, otSocket, otPath, otLine, otBone, otGum, otColumn, otWords, otDraw];
const ctx = Object.assign({ otParams }, DATA);
const svg = figureSvg({ width: W, height: H, className: "ot-svg ot-sec", label: "A premolar in section in its bone, with the CEJ, the attachment level, the bone's crest, the PDL and the bone's density marked. Controls add occlusal trauma (a jiggling force) and inflammation, as in the 1970s animal experiments.", body: otDraw(ST0, ctx) });
const plate = plateHtml({ fig: "Fig 31", title: "The animal experiments", hint: "trauma, then inflammation", readout: "no attachment loss", body: `<div class="am-svg ot-box">${svg}</div>` });
const controls = `<div class="am-controls ot-ctl" role="group" aria-label="Occlusal trauma"><span class="ot-lab">Occlusal trauma</span><button type="button" class="am-btn" data-ott="none" aria-pressed="true">None</button><button type="button" class="am-btn" data-ott="on" aria-pressed="false">Jiggling</button><button type="button" class="am-btn" data-ott="off" aria-pressed="false">Stopped: 10 weeks later</button></div>
<div class="am-controls ot-ctl" role="group" aria-label="Inflammation"><span class="ot-lab">Inflammation</span><button type="button" class="am-btn" data-oti="none" aria-pressed="true">None</button><button type="button" class="am-btn" data-oti="ging" aria-pressed="false">Gingivitis (normal support)</button><button type="button" class="am-btn" data-oti="perio" aria-pressed="false">Periodontitis (reduced support)</button></div>
<div class="am-controls ot-ctl ot-models" role="group" aria-label="Which animals" hidden><span class="ot-lab">Which animals (they disagreed)</span><button type="button" class="am-btn" data-otm="dog" aria-pressed="true">Beagle dogs</button><button type="button" class="am-btn" data-otm="monkey" aria-pressed="false">Squirrel monkeys</button></div>
<div class="am-stats ot-stats"></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Hover or tap the drawing: the tooth, the PDL, the bone, the gingiva or the force.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From the L10 notes (Dr. Abou-Arraj's lecture and slides): trauma alone (both groups) gave increased mobility, a loss of bone density (more radiolucent, no loss of crestal bone height) and no attachment loss, with a return to pretreatment stability once it was removed; with gingivitis on a normal periodontium, a greater loss of density and still no attachment loss; with periodontitis on a reduced periodontium the groups disagreed (beagle dogs: attachment and bone loss beyond the disease alone, "co-destruction is a reality"; squirrel monkeys: no further attachment loss, "co-destruction is a question"). In the monkeys, the bone regained its density 10 weeks after the trauma stopped, but with the periodontitis left untreated there was no return to stability. The monkeys' trauma was a wooden wedge moved to the other side every 48 hours (moderate, like an orthodontic force); the dogs', a cap splint in hyperocclusion with a spring bar (a severe, true jiggling force). A jiggling force widens the PDL into an hourglass.</li>
<li>Outside sources: the beagle dog studies (Lindhe and Svanberg, J Clin Periodontol 1974; Ericsson and Lindhe, J Clin Periodontol 1982) and the squirrel monkey studies (Polson, Meitner and Zander, J Periodontal Res 1976, including the reversibility of the bone loss), as summarized in Lindhe's Clinical Periodontology (trauma from occlusion), for what changed and where: the PDL widening most at the marginal and apical parts of the root, and resorption beside the socket first. The tooth is L9's premolar, drawn to Wheeler's average sizes, its crest about 1.8 mm below the CEJ.</li>
<li>Schematic: the millimeters (crest and attachment level) and how many trabeculae go are illustrative, not measured; density is shown as trabeculae, not as a film. Both groups' trauma is drawn as one jiggling force. "Stopped" with periodontitis shows the monkeys' result, the only one in the notes; "stopped" with gingivitis shows the density coming back because, in the lecture's words, there was still no irreversible damage. Educational, not clinical guidance.</li></ul></details>`;

function otLive(root, D) {
  var sec = root.querySelector(".ot-sec"), sum = root.querySelector(".am-summary"), info = root.querySelector(".am-info"), stats = root.querySelector(".ot-stats"), models = root.querySelector(".ot-models"), readout = root.querySelector("[data-readout]");
  var st = { tr: "none", inf: "none", model: "dog" };
  var TXT = {
    "none|none": "A healthy tooth: the attachment at the CEJ, the bone's crest a little below it, a thin PDL and dense bone. Add the jiggling trauma, inflammation, or both, to see what the 1970s animal experiments found.",
    "on|none": "Occlusal trauma alone (both groups): the tooth gets more mobile, the PDL widens into an hourglass and the bone loses density (more radiolucent), but the crest keeps its height and no attachment is lost. Now stop the trauma.",
    "off|none": "10 weeks after the trauma stopped, the bone regained its density, and the PDL and mobility went back to normal: a return to pretreatment stability. So trauma alone is not a primary factor: do this damage and things get bad, but stop it in time and they become stable again.",
    "none|ging": "Gingivitis alone: plaque at the margin and inflamed gingiva. The attachment, the crest and the bone's density are untouched.",
    "on|ging": "Trauma with inflammation on a normal periodontium (gingivitis): more mobility and a greater loss of bone density, but still no attachment loss. Still no irreversible damage.",
    "off|ging": "The trauma stopped and the gingivitis stays: with no irreversible damage done, the bone's density comes back. The gingivitis stays until the plaque is dealt with.",
    "none|perio": "Periodontitis alone: the plaque has gone subgingival, a pocket has formed, and attachment and crestal bone are lost: a reduced periodontium. This is what both groups compared against.",
    "on|perio|dog": "Trauma on periodontitis, in the beagle dogs (a cap splint in hyperocclusion with a spring bar: a severe, true jiggling force): attachment and bone lost beyond what the disease caused alone. Their conclusion: co-destruction is a reality.",
    "on|perio|monkey": "Trauma on periodontitis, in the squirrel monkeys (a wooden wedge moved to the other side every 48 hours: a moderate force, like an orthodontic one): the bone lost density and the PDL widened, but no attachment was lost beyond the disease alone. Their conclusion: co-destruction is a question.",
    "off|perio": "In the monkeys, 10 weeks after the trauma stopped with the periodontitis left untreated: no return to stability. Stopping the occlusal trauma does not reverse periodontitis: you still have to treat the periodontitis.",
  };
  function press(attr, val) { root.querySelectorAll("[" + attr + "]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute(attr) === val)); }); }
  function apply() {
    press("data-ott", st.tr); press("data-oti", st.inf); press("data-otm", st.model);
    models.hidden = !(st.tr === "on" && st.inf === "perio");
    sec.innerHTML = D.otDraw(st, D);
    var key = st.tr + "|" + st.inf + (st.tr === "on" && st.inf === "perio" ? "|" + st.model : "");
    sum.textContent = TXT[key] || "";
    var w = D.otWords(st);
    stats.innerHTML = "<span>Attachment: <b>" + w.att + "</b></span><span>Crestal bone height: <b>" + w.crest + "</b></span><span>Bone density: <b>" + w.dens + "</b></span><span>PDL: <b>" + w.pdl + "</b></span><span>Mobility: <b>" + w.mob + "</b></span>";
    if (readout) readout.textContent = w.att === "no loss" ? "no attachment loss" : w.att === "lost" ? "attachment lost" : w.att === "lost more" ? "more attachment lost" : "no further loss";
  }
  root.querySelectorAll("[data-ott]").forEach(function (b) { b.addEventListener("click", function () { st.tr = b.getAttribute("data-ott"); apply(); }); });
  root.querySelectorAll("[data-oti]").forEach(function (b) { b.addEventListener("click", function () { st.inf = b.getAttribute("data-oti"); apply(); }); });
  root.querySelectorAll("[data-otm]").forEach(function (b) { b.addEventListener("click", function () { st.model = b.getAttribute("data-otm"); apply(); }); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && root.contains(el) && el.getAttribute("data-info")) info.textContent = el.getAttribute("data-info"); }
  sec.addEventListener("pointerover", hot); sec.addEventListener("click", hot);
  apply();
}

const CSS = `
.anima .ot-box{max-width:520px;margin:0 auto}
.anima .ot-svg{--ot-trab:#bfae86;--ot-inf:#e07e74;--ot-plaque:#a98522;--ot-bad:#b0443c}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]) .anima .ot-svg{--ot-trab:#a39572;--ot-inf:#b4544b;--ot-plaque:#d8b04a;--ot-bad:#f08a80} }
:root[data-theme="dark"] .anima .ot-svg{--ot-trab:#a39572;--ot-inf:#b4544b;--ot-plaque:#d8b04a;--ot-bad:#f08a80}
.anima .ot-svg .ot-bone{fill:var(--tm-bone-in);stroke:var(--anatomy-lo);stroke-width:1;stroke-linejoin:round}
.anima .ot-svg .ot-trab{fill:var(--ot-trab);pointer-events:none}
.anima .ot-svg .ot-ghost{fill:none;stroke:var(--anatomy-mid);stroke-width:1.2;stroke-dasharray:4 3;vector-effect:none}
.anima .ot-svg .ot-pdl{fill:var(--anatomy-faint);stroke:var(--anatomy-lo);stroke-width:.6}
.anima .ot-svg .ot-gum{fill:var(--tm-retro);stroke:var(--anatomy-lo);stroke-width:.8;stroke-linejoin:round}
.anima .ot-svg .ot-gum.ot-inf{fill:var(--ot-inf)}
.anima .ot-svg .ot-enamel{fill:var(--tm-disc-mid)}
.anima .ot-svg .ot-dentin{fill:#e3c98a;stroke:var(--anatomy-lo);stroke-width:.8;stroke-linejoin:round}
.anima .ot-svg .ot-pulp{fill:var(--tm-muscle);stroke:var(--anatomy-lo);stroke-width:.7}
.anima .ot-svg .ot-out{fill:none;stroke:var(--anatomy-hi);stroke-width:1.3;stroke-linejoin:round;pointer-events:none}
.anima .ot-svg .ot-cej{fill:none;stroke:var(--anatomy-hi);stroke-width:1.6}
.anima .ot-svg .ot-att{fill:none;stroke:var(--ot-bad);stroke-width:2.2}
.anima .ot-svg .ot-plaque{fill:var(--ot-plaque);stroke:var(--anatomy-lo);stroke-width:.5}
.anima .ot-svg .ot-force{fill:none;stroke:var(--anatomy-strong);stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}
.anima .ot-svg .ot-card{fill:var(--surface);fill-opacity:.94;stroke:var(--line-strong);stroke-width:1}
.anima .ot-svg .ot-t{fill:var(--anatomy-text);font:12px var(--anatomy-mono);paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round}
.anima .ot-svg .ot-strong{fill:var(--anatomy-strong);font-weight:700}
.anima .ot-svg .ot-cap{fill:var(--anatomy-muted)}
.anima .ot-svg .ot-bad{fill:var(--ot-bad);font-weight:600}
.anima .ot-svg .ot-tag{font-weight:600}
.anima .ot-svg .ot-rock{transform-box:view-box;animation:ot-rock 1.3s ease-in-out infinite alternate}
.anima .ot-svg .ot-fl{animation:ot-push 2.6s ease-in-out infinite}
.anima .ot-svg .ot-fr{animation:ot-push 2.6s ease-in-out -1.3s infinite}
@keyframes ot-rock{from{transform:rotate(calc(-1 * var(--a)))}to{transform:rotate(var(--a))}}
@keyframes ot-push{0%,45%{opacity:1}55%,100%{opacity:.2}}
@media (prefers-reduced-motion: reduce){.anima .ot-svg .ot-rock,.anima .ot-svg .ot-fl,.anima .ot-svg .ot-fr{animation:none}}
.anima .ot-ctl{gap:6px 8px;margin:10px 0 2px}
.anima .ot-ctl[hidden]{display:none}
.anima .ot-lab{flex:0 0 100%;font:600 .72rem var(--font-mono);color:var(--ink-faint);text-transform:uppercase;letter-spacing:.04em}
.anima .ot-stats{margin-top:10px}
`;

export function otanimal() {
  return {
    id: "otanimal", lec: "occtrauma",
    title: "What the animal experiments showed",
    caption: "Add a jiggling force to a tooth, then inflammation, then stop the force 10 weeks later: what happened to the attachment, the crest, the bone's density, the PDL and the mobility in the 1970s beagle dog and squirrel monkey studies.",
    html: `<div class="anima" data-anima="otanimal">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: otLive.toString(),
    helpers,
    data: DATA,
  };
}
