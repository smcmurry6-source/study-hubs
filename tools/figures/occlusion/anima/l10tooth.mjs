// The tooth the L10 figures share (Occlusion L10, Dr. Abou-Arraj's occlusal trauma lecture): a mandibular second
// premolar cut buccolingually (buccal on the viewer's left), in mm with y up from the CEJ and x from the long axis
// (buccal negative), the same outlines as Fig 24 (abfract.mjs; Wheeler's dimensions: crown 8 mm, root 14.5 mm, 8 mm
// buccolingually). The helpers are plain functions so the build can inline them into each figure's data scope; they
// reach each other and the outlines only through D, so the same code draws the static SVG here and redraws it in the page.
export const TOOTH = {
  CROWN: [[-3.5, 0], [-3.82, 0.9], [-4.0, 2.3], [-3.92, 3.6], [-3.6, 4.8], [-2.9, 6.2], [-1.8, 7.4], [-0.5, 8.1], [0.3, 7.6], [0.95, 6.45], [1.55, 6.6], [2.3, 7.1], [3.1, 6.6], [3.6, 5.5], [3.9, 4.0], [3.85, 2.4], [3.65, 1.0], [3.5, 0]],
  DEJ: [[-3.5, 0], [-3.3, 1.0], [-3.12, 2.3], [-2.88, 3.6], [-2.42, 4.75], [-1.62, 5.6], [-0.62, 6.3], [0.38, 5.62], [1.0, 5.2], [1.68, 5.48], [2.2, 5.8], [2.8, 5.0], [3.02, 3.6], [3.2, 2.0], [3.4, 0.9], [3.5, 0]],
  ROOT: [[3.5, 0], [3.49, -0.3], [3.45, -1.5], [3.3, -3.5], [3.0, -6.5], [2.5, -9.5], [1.8, -12.0], [0.9, -13.9], [0, -14.5], [-0.9, -13.9], [-1.8, -12.0], [-2.5, -9.5], [-3.0, -6.5], [-3.3, -3.5], [-3.45, -1.5], [-3.49, -0.3], [-3.5, 0]],
  PULP: [[-0.62, 5.0], [-0.15, 4.2], [0.55, 4.0], [1.15, 4.25], [1.45, 3.6], [1.3, 2.2], [0.95, 0.5], [0.62, -1.5], [0.45, -6], [0.3, -10.5], [0.14, -13.5], [-0.14, -13.5], [-0.3, -10.5], [-0.45, -6], [-0.62, -1.5], [-0.95, 0.5], [-1.2, 2.2], [-1.15, 3.8]],
};

/* the bone and gingiva on the buccal side (the lingual mirrors it) for normal support (the crest 1.8 mm below the CEJ, the
   center of rotation mid-root) and reduced support (bone and attachment lost: the crest 8.5 mm down, a third of the tooth
   still in bone, the center of rotation in the apical third); the center of rotation c is in mm */
export const SUPPORT = {
  n: { crest: -1.8, c: [0, -7.3],
    BONE: [[-7.9, -20.5], [-7.2, -16.5], [-6.3, -12.5], [-5.5, -8.5], [-5.0, -5.2], [-4.55, -3.0]],
    GUM: [[-3.49, -0.35], [-4.0, -0.6], [-4.6, -1.5], [-5.08, -3.0], [-5.42, -5.1], [-5.62, -6.9], [-5.12, -6.6], [-4.98, -5.2], [-4.55, -3.0], [-3.9, -1.8], [-3.45, -1.8], [-3.47, -1.0]] },
  r: { crest: -8.5, c: [0, -11.2],
    BONE: [[-7.9, -20.5], [-7.2, -16.5], [-6.4, -13.4], [-5.45, -11.3], [-4.9, -10.0], [-4.1, -9.0]],
    GUM: [[-2.92, -7.0], [-3.6, -7.3], [-4.4, -8.1], [-5.2, -9.3], [-5.8, -10.8], [-6.15, -12.3], [-5.6, -12.1], [-5.45, -11.3], [-4.9, -10.0], [-4.1, -9.0], [-3.12, -8.5], [-2.67, -8.5], [-2.75, -8.0], [-2.85, -7.5]] },
};

/* a smooth path through points (Catmull-Rom as cubic Bezier), points already in px */
export function otSmooth(pts, closed) {
  var f = function (n) { return Math.round(n * 10) / 10; }, n = pts.length, last = closed ? n : n - 1, d = "M" + f(pts[0][0]) + " " + f(pts[0][1]);
  for (var i = 0; i < last; i++) { var p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    if (!closed) { if (i === 0) p0 = p1; if (i + 2 >= n) p3 = p2; }
    d += "C" + f(p1[0] + (p2[0] - p0[0]) / 6) + " " + f(p1[1] + (p2[1] - p0[1]) / 6) + " " + f(p2[0] - (p3[0] - p1[0]) / 6) + " " + f(p2[1] - (p3[1] - p1[1]) / 6) + " " + f(p2[0]) + " " + f(p2[1]); }
  return d + (closed ? "Z" : "");
}
/* a pose: turn by a (degrees; + tips the crown to the lingual) about the point c (mm), then move by t (mm, + lingual),
   then sink by v (mm) */
export function otPose(p, pose) {
  var a = (pose.a || 0) * Math.PI / 180, c = pose.c || [0, 0], dx = p[0] - c[0], dy = p[1] - c[1];
  return [c[0] + dx * Math.cos(a) + dy * Math.sin(a) + (pose.t || 0), c[1] - dx * Math.sin(a) + dy * Math.cos(a) - (pose.v || 0)];
}
/* the root's surface from the bone crest on the lingual, round the apex, to the crest on the buccal, a point about every
   0.7 mm (the socket is built on it) */
export function otRootBelow(yc, D) {
  var R = D.ROOT, out = [], i, k;
  function xAt(side, y) { for (var j = 0; j < R.length - 1; j++) { var a = R[j], b = R[j + 1]; if ((a[0] >= 0) === (side > 0) && (b[0] >= 0) === (side > 0) && ((a[1] - y) * (b[1] - y) <= 0) && a[1] !== b[1]) { return a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]); } } return 0; }
  for (i = 0; i < R.length - 1; i++) {
    var a = R[i], b = R[i + 1];
    if (a[1] > yc && b[1] > yc) continue;
    var s = a[1] > yc ? [xAt(a[0] > 0 ? 1 : -1, yc), yc] : a, e = b[1] > yc ? [xAt(b[0] > 0 ? 1 : -1, yc), yc] : b;
    var len = Math.hypot(e[0] - s[0], e[1] - s[1]), m = Math.max(1, Math.round(len / 0.7));
    for (k = 0; k < m; k++) out.push([s[0] + (e[0] - s[0]) * k / m, s[1] + (e[1] - s[1]) * k / m]);
    if (b[1] > yc) { out.push(e); break; }
  }
  return out;
}
/* the socket wall: each root point pushed out along its normal by the ligament's width w(y, side) */
export function otSocket(pts, wf) {
  var n = pts.length, out = [];
  for (var i = 0; i < n; i++) {
    var p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1;
    var nx = -ty / l, ny = tx / l, w = wf(p[1], p[0] > 0 ? 1 : -1);
    if (i === 0 || i === n - 1) { nx = p[0] > 0 ? 1 : -1; ny = 0; }
    out.push([p[0] + nx * w, p[1] + ny * w]);
  }
  return out;
}
/* a block of text on a soft card (the page's color, a little see-through), so no line of the drawing runs through the
   words; 12px mono lines 13px apart (11px for the class ot-cap), anchored at x like an SVG text ("start", "middle", "end") */
export function otText(x, y, lines, cls, a) {
  var f = function (n) { return Math.round(n * 10) / 10; }, arr = typeof lines === "string" ? [lines] : lines, cap = / ?ot-cap/.test(cls || "");
  var cw = cap ? 6.65 : 7.25, w = Math.max.apply(null, arr.map(function (s) { return s.length; })) * cw, h = (arr.length - 1) * 13;
  var x0 = a === "end" ? x - w : a === "middle" ? x - w / 2 : x;
  var s = '<rect class="ot-card" x="' + f(x0 - 4) + '" y="' + f(y - (cap ? 11 : 12)) + '" width="' + f(w + 8) + '" height="' + f(h + (cap ? 15 : 16)) + '" rx="5"/>';
  return s + arr.map(function (t, i) { return '<text class="ot-t' + (cls ? " " + cls : "") + '" x="' + f(x) + '" y="' + f(y + i * 13) + '"' + (a ? ' text-anchor="' + a + '"' : "") + ">" + t + "</text>"; }).join("");
}
/* a label on a soft card with a leader from the card's near edge to a dot on the part q (px) */
export function otLab(lines, x, y, q, a, cls, D) {
  var f = function (n) { return Math.round(n * 10) / 10; }, arr = typeof lines === "string" ? [lines] : lines;
  var w = Math.max.apply(null, arr.map(function (s) { return s.length; })) * 7.25, sx = a === "end" ? x - w - 4 : a === "middle" ? x : x + w + 4;
  var sy = a === "middle" ? (q[1] < y ? y - 13 : y + (arr.length - 1) * 13 + 4) : y - 4;
  return '<g class="ot-call"><path class="am-leader" d="M' + f(sx) + " " + f(sy) + "L" + f(q[0]) + " " + f(q[1]) + '"/><circle class="am-dot" cx="' + f(q[0]) + '" cy="' + f(q[1]) + '" r="1.8"/>' + D.otText(x, y, arr, cls, a) + "</g>";
}

/* the CSS the L10 figures share (Fig 27 carries it; Figs 28 and 29 add only their own) */
export const OT_CSS = `
.anima .ot-svg .ot-t{fill:var(--anatomy-text);font:12px var(--anatomy-mono);paint-order:stroke;stroke:var(--surface);stroke-width:3.5px;stroke-linejoin:round}
.anima .ot-svg .ot-strong{fill:var(--anatomy-strong);font-weight:700}
.anima .ot-svg .ot-cap{fill:var(--anatomy-muted);font-size:11px}
.anima .ot-svg .ot-card{fill:var(--surface);fill-opacity:.88;stroke:none}
.anima .ot-svg .ot-on{stroke:none}
.anima .ot-svg .ot-tlab{fill:var(--tm-vessel);font-weight:700}
.anima .ot-svg .ot-plab{fill:#2f6fb4;font-weight:700}
.anima .ot-svg .ot-bone{fill:var(--tm-bone);stroke:var(--anatomy-lo);stroke-width:1}
.anima .ot-svg .ot-newbone{fill:var(--tm-bone-in);stroke:none}
.anima .ot-svg .ot-pdl{fill:#f4dcd5;stroke:var(--anatomy-lo);stroke-width:.6}
.anima .ot-svg .ot-gum{fill:var(--tm-retro);stroke:var(--anatomy-lo);stroke-width:.8;stroke-linejoin:round}
.anima .ot-svg .ot-enamel{fill:var(--tm-disc-mid)}
.anima .ot-svg .ot-dentin{fill:#e3c98a;stroke:var(--anatomy-lo);stroke-width:.8;stroke-linejoin:round}
.anima .ot-svg .ot-pulp{fill:var(--tm-muscle);stroke:var(--anatomy-lo);stroke-width:.7}
.anima .ot-svg .ot-out{fill:none;stroke:var(--anatomy-hi);stroke-width:1.3;stroke-linejoin:round;pointer-events:none}
.anima .ot-svg .ot-band{fill:none;stroke-width:5;stroke-linecap:round;stroke-linejoin:round}
.anima .ot-svg .ot-press{stroke:#3b7fd0}
.anima .ot-svg .ot-tens{stroke:var(--tm-vessel)}
.anima .ot-svg .ot-crot{fill:var(--surface);stroke:var(--anatomy-hi);stroke-width:1.6}
.anima .ot-svg .ot-crot-x{fill:none;stroke:var(--anatomy-hi);stroke-width:1.2}
.anima .ot-svg .ot-force{fill:none;stroke:var(--anatomy-strong);stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.anima .ot-svg .ot-force.ot-big{stroke-width:4.2}
.anima .ot-lbl{font:.78rem var(--font-mono);color:var(--ink-soft);min-width:4.6em}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]) .anima .ot-svg .ot-plab{fill:#7fb2ec} :root:not([data-theme="light"]) .anima .ot-svg .ot-press{stroke:#6ea8ea} :root:not([data-theme="light"]) .anima .ot-svg .ot-pdl{fill:#5b4240} }
:root[data-theme="dark"] .anima .ot-svg .ot-pdl{fill:#5b4240}
:root[data-theme="dark"] .anima .ot-svg .ot-plab{fill:#7fb2ec}
:root[data-theme="dark"] .anima .ot-svg .ot-press{stroke:#6ea8ea}
.anima .ot-svg .ot-ghost{fill:none;stroke:var(--anatomy-mid);stroke-width:1.1;stroke-dasharray:4 3;stroke-linejoin:round}
.anima .ot-svg .ot-was{fill:none;stroke:var(--anatomy-mid);stroke-width:.9;stroke-dasharray:3 3}
.anima .ot-count{font:.78rem var(--font-mono);color:var(--ink-soft)}
`;
/* the gingiva follows the tooth where it holds the tooth and the bone where it lies on the bone: each point moves with the
   tooth's pose near the root surface (|x| up to 3.6 mm) and with the bone (a pose, a function of the point, or nothing)
   from 4.9 mm out */
export function otGumPose(pts, tooth, bone, D) {
  return pts.map(function (p) {
    var k = Math.max(0, Math.min(1, (4.9 - Math.abs(p[0])) / 1.3)), a = D.otPose(p, tooth), b = typeof bone === "function" ? bone(p) : bone ? D.otPose(p, bone) : p;
    return [b[0] + (a[0] - b[0]) * k, b[1] + (a[1] - b[1]) * k];
  });
}
