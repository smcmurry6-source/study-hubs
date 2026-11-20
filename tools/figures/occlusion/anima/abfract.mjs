// Fig 24: abfraction (Occlusion L9, "Abfraction: the occlusion"; Dr. Lawson's prerecorded lecture). A mandibular second
// premolar cut buccolingually (buccal on the viewer's left), standing in its bone. A slider moves the load from straight
// down the long axis (the buccal cusp tip) onto an inclined plane (the buccal cusp's outer incline, pushed square to it):
// the crown is pushed to the lingual, the tooth bends about the fulcrum where the bone holds it, the lingual cervical side
// is compressed and the buccal cervical side stretched (tension). "Load it again and again" repeats the load, and a notch
// grows on the tensile side just above the bone: the abfraction lesion. Beside it, his analogy: push on a stop sign and it
// bends at the ground, the stretched side is where it's damaged. Content from the L9 notes; the bend is exaggerated to be
// seen. Static geometry here; the browser redraws both drawings from the state.
import { figureSvg, plateHtml } from "./shared.mjs";

const TW = 340, TH = 356, SW = 200, SH = 300;
/* mm, y up from the CEJ, x from the long axis; buccal is negative. Typical size (Wheeler's): crown 8 mm, root 14.5 mm,
   crown 8 mm buccolingually, 7 at the cervix */
const D0 = {
  V: { OX: 170, OY: 150, S: 10.5 }, YC: -1.8, YTOP: 8.1, ANG: 38.4, BEND: 0.95, DMAX: 1.7,
  /* the crown, buccal CEJ over the cusps to lingual CEJ (the buccal cusp tip, then its outer incline, are vertices) */
  CROWN: [[-3.5, 0], [-3.82, 0.9], [-4.0, 2.3], [-3.92, 3.6], [-3.6, 4.8], [-2.9, 6.2], [-1.8, 7.4], [-0.5, 8.1], [0.3, 7.6], [0.95, 6.45], [1.55, 6.6], [2.3, 7.1], [3.1, 6.6], [3.6, 5.5], [3.9, 4.0], [3.85, 2.4], [3.65, 1.0], [3.5, 0]],
  /* the dentin under the enamel (thickest at the cusps), CEJ to CEJ */
  DEJ: [[-3.5, 0], [-3.3, 1.0], [-3.12, 2.3], [-2.88, 3.6], [-2.42, 4.75], [-1.62, 5.6], [-0.62, 6.3], [0.38, 5.62], [1.0, 5.2], [1.68, 5.48], [2.2, 5.8], [2.8, 5.0], [3.02, 3.6], [3.2, 2.0], [3.4, 0.9], [3.5, 0]],
  /* the root, lingual CEJ round the apex to buccal CEJ */
  ROOT: [[3.5, 0], [3.49, -0.3], [3.45, -1.5], [3.3, -3.5], [3.0, -6.5], [2.5, -9.5], [1.8, -12.0], [0.9, -13.9], [0, -14.5], [-0.9, -13.9], [-1.8, -12.0], [-2.5, -9.5], [-3.0, -6.5], [-3.3, -3.5], [-3.45, -1.5], [-3.49, -0.3], [-3.5, 0]],
  PULP: [[-0.62, 5.0], [-0.15, 4.2], [0.55, 4.0], [1.15, 4.25], [1.45, 3.6], [1.3, 2.2], [0.95, 0.5], [0.62, -1.5], [0.45, -6], [0.3, -10.5], [0.14, -13.5], [-0.14, -13.5], [-0.3, -10.5], [-0.45, -6], [-0.62, -1.5], [-0.95, 0.5], [-1.2, 2.2], [-1.15, 3.8]],
  /* the alveolar bone, its crest 1.8 mm below the CEJ, and the socket a periodontal ligament's width round the root */
  BONE: [[-7.9, -20], [-7.2, -16.5], [-6.3, -12.5], [-5.5, -8.5], [-5.0, -5.2], [-4.55, -3.0], [-3.78, -1.8], [3.78, -1.8], [4.75, -3.0], [5.35, -5.2], [6.0, -8.5], [6.8, -12.5], [7.6, -16.5], [8.2, -20]],
  SOCKET: [[-3.78, -1.8], [-3.75, -3.5], [-3.45, -6.5], [-2.9, -9.5], [-2.15, -12.1], [-1.1, -14.2], [0, -14.85], [1.1, -14.2], [2.15, -12.1], [2.9, -9.5], [3.45, -6.5], [3.75, -3.5], [3.78, -1.8]],
  /* the gingiva over the bone, its margin a little below the CEJ */
  GUM: [[[-3.49, -0.35], [-4.0, -0.6], [-4.6, -1.5], [-5.08, -3.0], [-5.42, -5.1], [-5.62, -6.9], [-5.12, -6.6], [-4.98, -5.2], [-4.55, -3.0], [-3.78, -1.8], [-3.47, -1.0]], [[3.49, -0.35], [4.05, -0.6], [4.7, -1.5], [5.28, -3.0], [5.8, -5.1], [6.05, -6.9], [5.5, -6.6], [5.33, -5.2], [4.75, -3.0], [3.78, -1.8], [3.47, -1.0]]],
  /* the cervical stress bands, just inside each surface from the crest up */
  BAND: { b: [[-2.98, -1.7], [-3.02, -0.8], [-3.05, 0], [-3.37, 0.9], [-3.55, 2.3], [-3.5, 3.1]], l: [[2.98, -1.7], [3.02, -0.8], [3.05, 0], [3.2, 1.0], [3.4, 2.4], [3.45, 3.1]] },
  /* the load: from the buccal cusp tip (along the long axis) to the middle of its outer incline (square to it) */
  TIP: [-0.5, 8.1], INC: [-1.8, 7.4],
};
const HOT = {
  enamel: "Enamel, the crown's cap. Tooth structure, like most materials, is much stronger in compression than in tension (being pulled apart).",
  dentin: "Dentin, under the enamel and making up the root.",
  pulp: "The pulp.",
  bone: "The alveolar bone holds the root. Where the tooth is anchored in the bone is the fulcrum it bends about.",
  gum: "The gingiva.",
  tens: "Tension: the stretched side. The tensile forces pull apart the bonds within the tooth structure here, at the cervical area just above the fulcrum.",
  comp: "Compression: the squeezed side. Tooth structure handles compression well.",
  notch: "The abfraction lesion: on the tensile side, at the cervical area, just above the fulcrum. Clues that a patient loads their teeth this hard: tori and exostoses, opposing wear facets or other generalized wear. Treatment: a night guard; restore it too if needed for esthetics.",
  sign: "The stop sign: push on it and it bends at the ground, where it's anchored (the fulcrum). The side being stretched is under tension, and that's where it gets damaged.",
};

/* the state: t where the load lands (0 long axis, 1 inclined plane), u how much of it is on (1 held, 0 off), d the
   lesion's depth (mm), k the stop sign's crack (0-1) */
function abLat(st, D) { return Math.sin(st.t * D.ANG * Math.PI / 180); }
function abSmooth(pts, closed) {
  var f = function (n) { return Math.round(n * 10) / 10; }, n = pts.length, last = closed ? n : n - 1, d = "M" + f(pts[0][0]) + " " + f(pts[0][1]);
  for (var i = 0; i < last; i++) { var p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    if (!closed) { if (i === 0) p0 = p1; if (i + 2 >= n) p3 = p2; }
    d += "C" + f(p1[0] + (p2[0] - p0[0]) / 6) + " " + f(p1[1] + (p2[1] - p0[1]) / 6) + " " + f(p2[0] - (p3[0] - p1[0]) / 6) + " " + f(p2[1] - (p3[1] - p1[1]) / 6) + " " + f(p2[0]) + " " + f(p2[1]); }
  return d + (closed ? "Z" : "");
}
function abTooth(st, D) {
  var f = function (n) { return Math.round(n * 10) / 10; }, V = D.V, lat = D.abLat(st, D), dm = D.BEND * lat * st.u, o = "";
  /* the crown bends to the lingual above the crest, most at the top (a cantilever held in the bone) */
  function bx(y) { if (y <= D.YC) return 0; var s = (y - D.YC) / (D.YTOP - D.YC); return dm * (3 * s * s - s * s * s) / 2; }
  function P(p) { return [V.OX + (p[0] + bx(p[1])) * V.S, V.OY - p[1] * V.S]; }
  function S(pts, closed) { return D.abSmooth(pts.map(P), closed); }
  function L(pts) { return "M" + pts.map(function (p) { var q = P(p); return f(q[0]) + " " + f(q[1]); }).join("L"); }
  function tx(x, y, t, cls, a) { return '<text class="ab-t' + (cls ? " " + cls : "") + '" x="' + f(x) + '" y="' + f(y) + '"' + (a ? ' text-anchor="' + a + '"' : "") + ">" + t + "</text>"; }
  /* a label (one or more lines) with a leader from the end of its first line to the point p (mm) */
  function lab(lines, x, y, p, a, cls) { var q = P(p), w = Math.max.apply(null, lines.map(function (s) { return s.length; })) * 7.2, sx = a === "end" ? x - w - 3 : x + w + 3;
    return '<g class="ab-call"><path class="am-leader" d="M' + f(sx) + " " + f(y - 4) + "L" + f(q[0]) + " " + f(q[1]) + '"/><circle class="am-dot" cx="' + f(q[0]) + '" cy="' + f(q[1]) + '" r="1.8"/>' +
      lines.map(function (s, i) { return tx(x, y + i * 13, s, cls, a); }).join("") + "</g>"; }
  var tooth = D.CROWN.slice(0, -1).concat(D.ROOT.slice(0, -1)), dent = D.DEJ.slice(0, -1).concat(D.ROOT.slice(0, -1));
  /* bone, socket, gingiva (the root sits in the socket; the bone doesn't bend) */
  o += '<path class="ab-bone hot" data-info="' + D.HOT.bone + '" d="' + S(D.BONE, false) + 'Z"/>';
  o += '<path class="ab-pdl" d="' + S(D.SOCKET, false) + 'Z"/>';
  D.GUM.forEach(function (g) { o += '<path class="ab-gum hot" data-info="' + D.HOT.gum + '" d="' + S(g, false) + 'Z"/>'; });
  /* the long axis */
  o += '<path class="ab-axis" d="M' + V.OX + " " + f(V.OY + 15.6 * V.S) + "L" + V.OX + " " + f(V.OY - 10.4 * V.S) + '"/>';
  /* the tooth */
  o += '<path class="ab-enamel hot" data-info="' + D.HOT.enamel + '" d="' + S(tooth, true) + '"/>';
  o += '<path class="ab-dentin hot" data-info="' + D.HOT.dentin + '" d="' + S(dent, true) + '"/>';
  o += '<path class="ab-pulp hot" data-info="' + D.HOT.pulp + '" d="' + S(D.PULP, true) + '"/>';
  o += '<path class="ab-out" d="' + S(tooth, true) + '"/>';
  o += '<path class="ab-cej" d="' + S(D.DEJ.slice(0, 7), false) + '"/><path class="ab-cej" d="' + S(D.DEJ.slice(9), false) + '"/>';
  /* the stress bands: compression where it's squeezed, tension where it's stretched */
  var tn = lat * st.u, cb = 0.32 * st.u * (1 - lat), cl = Math.min(1, 0.32 * st.u + 0.62 * tn);
  o += '<path class="ab-band ab-comp hot" data-info="' + D.HOT.comp + '" style="stroke-opacity:' + f(cl * 100) / 100 + '" d="' + S(D.BAND.l, false) + '"/>';
  if (cb > 0.01) o += '<path class="ab-band ab-comp" style="stroke-opacity:' + f(cb * 100) / 100 + '" d="' + S(D.BAND.b, false) + '"/>';
  if (tn > 0.01) o += '<path class="ab-band ab-tens hot" data-info="' + D.HOT.tens + '" style="stroke-opacity:' + f(Math.min(1, tn * 1.45) * 100) / 100 + '" d="' + S(D.BAND.b, false) + '"/>';
  /* the lesion: a notch on the buccal (tensile) side, CEJ area, just above the bone */
  if (st.d > 0.02) {
    var ap = [-3.83 + st.d, 0.95];
    o += '<path class="ab-air" d="' + L([[-4.9, 2.3], [-4.0, 2.3], ap, [-3.49, -0.3], [-4.9, -0.3]]) + 'Z"/>';
    o += '<path class="ab-notch hot" data-info="' + D.HOT.notch + '" d="' + L([[-4.0, 2.3], ap, [-3.49, -0.3]]) + '"/>';
  }
  /* the load: square to the surface it lands on */
  var a = st.t * D.ANG * Math.PI / 180, dir = [Math.sin(a), -Math.cos(a)], c = [D.TIP[0] + (D.INC[0] - D.TIP[0]) * st.t, D.TIP[1] + (D.INC[1] - D.TIP[1]) * st.t];
  var p1 = P(c), p0 = [p1[0] - dir[0] * 46, p1[1] + dir[1] * 46], ux = (p1[0] - p0[0]) / 46, uy = (p1[1] - p0[1]) / 46;
  o += '<path class="ab-force" style="stroke-opacity:' + f((0.35 + 0.65 * st.u) * 100) / 100 + '" d="M' + f(p0[0]) + " " + f(p0[1]) + "L" + f(p1[0] - ux * 2) + " " + f(p1[1] - uy * 2) +
    "M" + f(p1[0] - ux * 9 - uy * 5) + " " + f(p1[1] - uy * 9 + ux * 5) + "L" + f(p1[0] - ux * 1.5) + " " + f(p1[1] - uy * 1.5) + "L" + f(p1[0] - ux * 9 + uy * 5) + " " + f(p1[1] - uy * 9 - ux * 5) + '"/>';
  o += tx(10, 22, "load", "ab-strong", "start") + tx(10, 36, st.t < 0.12 ? "down the long axis" : "on an inclined plane", "ab-cap", "start");
  /* labels */
  o += lab(["fulcrum:", "the bone holds it"], 10, V.OY + 3.4 * V.S, [-3.78, -1.8], "start");
  if (tn > 0.08) o += lab(["tension"], 10, V.OY - 3.6 * V.S, [-3.55, 2.6], "start", "ab-tlab");
  else o += lab(["compression"], 10, V.OY - 3.6 * V.S, [-3.55, 2.6], "start", "ab-clab");
  o += lab(["compression"], D.TW - 8, V.OY - 3.6 * V.S, [3.42, 2.6], "end", "ab-clab");
  if (st.d > 0.3) o += lab(["NCCL: just", "above the fulcrum"], 10, V.OY + 0.2 * V.S, [-3.83 + st.d, 0.95], "start", "ab-strong");
  o += tx(12, D.TH - 8, "buccal", "ab-cap", "start") + tx(D.TW - 12, D.TH - 8, "lingual", "ab-cap", "end");
  return o;
}
function abSign(st, D) {
  var f = function (n) { return Math.round(n * 10) / 10; }, lat = D.abLat(st, D), o = "", G = 262, X0 = 100, HP = 128;
  function tx(x, y, t, cls, a) { return '<text class="ab-t' + (cls ? " " + cls : "") + '" x="' + f(x) + '" y="' + f(y) + '"' + (a ? ' text-anchor="' + a + '"' : "") + ">" + t + "</text>"; }
  var ds = 26 * lat * st.u, pts = [], i;
  for (i = 0; i <= 12; i++) { var h = HP * i / 12, q = h / HP; pts.push([X0 + ds * (3 * q * q - q * q * q) / 2, G - h]); }
  var top = pts[12], s = 1.5 * ds / HP, th = Math.atan(s) * 180 / Math.PI, cx = top[0] + s * 30, cy = top[1] - 30;
  o += tx(X0, 16, "his analogy: a stop sign", "ab-strong", "middle");
  /* the ground: it holds the post, as the bone holds the root */
  o += '<rect class="ab-ground hot" data-info="' + D.HOT.sign + '" x="0" y="' + G + '" width="' + D.SW + '" height="' + (D.SH - G) + '"/>';
  o += '<path class="ab-post hot" data-info="' + D.HOT.sign + '" d="M' + pts.map(function (p) { return f(p[0]) + " " + f(p[1]); }).join("L") + '"/>';
  /* stress at the base */
  var tn = lat * st.u, cb = 0.32 * st.u * (1 - lat), cl = Math.min(1, 0.32 * st.u + 0.62 * tn);
  o += '<path class="ab-band ab-comp" style="stroke-opacity:' + f(cl * 100) / 100 + '" d="M' + f(X0 + 6.5) + " " + (G - 2) + "L" + f(X0 + 6.5 + ds * 0.03) + " " + (G - 34) + '"/>';
  if (cb > 0.01) o += '<path class="ab-band ab-comp" style="stroke-opacity:' + f(cb * 100) / 100 + '" d="M' + f(X0 - 6.5) + " " + (G - 2) + "L" + f(X0 - 6.5 + ds * 0.03) + " " + (G - 34) + '"/>';
  if (tn > 0.01) o += '<path class="ab-band ab-tens" style="stroke-opacity:' + f(Math.min(1, tn * 1.45) * 100) / 100 + '" d="M' + f(X0 - 6.5) + " " + (G - 2) + "L" + f(X0 - 6.5 + ds * 0.03) + " " + (G - 34) + '"/>';
  if (st.k > 0.02) o += '<path class="ab-crack" d="M' + f(X0 - 4) + " " + f(G - 12 - 6 * st.k) + "L" + f(X0 - 4 + 4.5 * st.k) + " " + f(G - 9) + "L" + f(X0 - 4) + " " + f(G - 6 + 2 * st.k) + 'Z"/>';
  /* the sign, seen at an angle so its face is toward the push, leaning with the top of the post */
  var oct = [], k;
  for (k = 0; k < 8; k++) { var a = (22.5 + 45 * k) * Math.PI / 180; oct.push(f(0.6 * 38 * Math.cos(a)) + " " + f(38 * Math.sin(a))); }
  var oin = []; for (k = 0; k < 8; k++) { var b = (22.5 + 45 * k) * Math.PI / 180; oin.push(f(0.6 * 34 * Math.cos(b)) + " " + f(34 * Math.sin(b))); }
  o += '<g class="hot" data-info="' + D.HOT.sign + '" transform="translate(' + f(cx) + " " + f(cy) + ") rotate(" + f(th) + ')"><path class="ab-sign" d="M' + oct.join("L") + 'Z"/><path class="ab-sign-rim" d="M' + oin.join("L") + 'Z"/>' +
    '<text class="ab-stop" transform="scale(0.6 1)" x="0" y="6" text-anchor="middle">STOP</text></g>';
  /* the push, the same way the load meets the tooth */
  var an = st.t * D.ANG * Math.PI / 180, dir = [Math.sin(an), Math.cos(an)];
  var tgt = [cx - 22.8 * st.t + 0 * (1 - st.t), cy - 38 * (1 - st.t)], p0 = [tgt[0] - dir[0] * 52, tgt[1] - dir[1] * 52];
  o += '<path class="ab-force" style="stroke-opacity:' + f((0.35 + 0.65 * st.u) * 100) / 100 + '" d="M' + f(p0[0]) + " " + f(p0[1]) + "L" + f(tgt[0] - dir[0] * 2) + " " + f(tgt[1] - dir[1] * 2) +
    "M" + f(tgt[0] - dir[0] * 9 - dir[1] * 5) + " " + f(tgt[1] - dir[1] * 9 + dir[0] * 5) + "L" + f(tgt[0] - dir[0] * 1.5) + " " + f(tgt[1] - dir[1] * 1.5) + "L" + f(tgt[0] - dir[0] * 9 + dir[1] * 5) + " " + f(tgt[1] - dir[1] * 9 - dir[0] * 5) + '"/>';
  o += tx(p0[0] - 4, p0[1] - 5, "push", "ab-strong", st.t > 0.5 ? "start" : "middle");
  o += tx(X0 - 11, G - 40, tn > 0.08 ? "tension" : "compression", tn > 0.08 ? "ab-tlab" : "ab-clab", "end") + tx(X0 + 11, G - 40, "compression", "ab-clab", "start");
  o += tx(X0, G + 20, "the ground holds it:", "ab-cap ab-on", "middle") + tx(X0, G + 33, "the fulcrum", "ab-cap ab-on", "middle");
  return o;
}

const ST0 = { t: 1, u: 1, d: 0, k: 0 };
const DATA = Object.assign({ TW, TH, SW, SH, HOT }, D0);
const ctx = Object.assign({ abLat, abSmooth }, DATA);
const svgTooth = figureSvg({ width: TW, height: TH, className: "ab-svg ab-tooth", label: "A mandibular premolar in buccolingual section, in its bone, with a load on the buccal cusp: the crown bends about the bone, the lingual cervical side is compressed and the buccal cervical side is under tension.", body: abTooth(ST0, ctx) });
const svgSign = figureSvg({ width: SW, height: SH, className: "ab-svg ab-signbox", label: "A stop sign on a post anchored in the ground, pushed the same way: it bends at the ground, the stretched side under tension.", body: abSign(ST0, ctx) });
const plate = plateHtml({ fig: "Fig 24", title: "Abfraction: the tooth bends", hint: "move the load", readout: "tension buccal · compression lingual", body: `<div class="am-svg ab-box">${svgTooth}${svgSign}</div>` });
const controls = `<div class="am-controls"><label class="am-slider">long axis<input type="range" min="0" max="100" value="100" data-abt aria-label="Where the load lands: from straight down the long axis to an inclined plane">inclined plane</label></div>
<div class="am-controls"><button type="button" class="am-btn" data-abplay>Load it again and again</button><button type="button" class="am-btn" data-abreset>Start over</button></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Hover or tap the tooth, the bone or the stop sign.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From the L9 notes (Dr. Lawson's prerecorded lecture): loads on the inclined planes of the occlusal surface cause stress at the cervical part of the tooth; things are stronger in compression than in tension; the fulcrum is where the tooth is anchored in the bone; one side is compressed, the other is under tension, and abfraction lesions form where the tensile stress is, just above the fulcrum; the stop sign analogy; the clues (exostoses and tori, opposing wear facets) and the night guard. Dr. Givan's L7 adds that abfraction is supported by lab studies but neither validated nor rejected clinically.</li>
<li>Outside sources: Lee and Eakle (J Prosthet Dent 1984;52:374-380) proposed that lateral forces flex the tooth about a fulcrum at the cervical area and that the tensile stress there breaks the bonds between the enamel crystals; Grippo (J Esthet Dent 1991;3:14-19) named these lesions abfractions and described them as wedge-shaped. The tooth is drawn to typical mandibular second premolar dimensions (Wheeler's Dental Anatomy: crown 8 mm, root 14.5 mm, 8 mm buccolingually), with the bone crest about 1.8 mm below the CEJ.</li>
<li>Schematic: the load here pushes the crown to the lingual, so the buccal side is the tensile one, where these notches are most often seen; a load from the other side would reverse it. The bend is drawn about a hundred times larger than a real tooth flexes, the stress is shown as colored bands rather than computed, and the notch grows over a few loads where in a mouth it takes years. Educational, not clinical guidance.</li></ul></details>`;

function abLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var tooth = root.querySelector(".ab-tooth"), sign = root.querySelector(".ab-signbox"), sum = root.querySelector(".am-summary"), info = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]");
  var slider = root.querySelector("[data-abt]"), play = root.querySelector("[data-abplay]"), reset = root.querySelector("[data-abreset]");
  var st = { t: 1, u: 1, d: 0, k: 0 }, raf = 0, playing = false;
  function draw() { tooth.innerHTML = D.abTooth(st, D); sign.innerHTML = D.abSign(st, D); }
  function text() {
    var lat = D.abLat(st, D), s;
    if (lat < 0.08) s = "A load straight down the long axis presses the whole tooth evenly: it's all compression, which tooth structure handles well. Nothing bends, so no lesion forms" + (st.d > 0.02 ? " (the notch you see was made by the earlier loads)." : ".");
    else s = "A load the tooth isn't supposed to have, on an inclined plane, pushes the crown to the lingual. The bone holds the root, so the tooth bends about the fulcrum where it's anchored: the lingual side is compressed and the buccal side is stretched, under tension. Tooth structure is weaker in tension, so the bonds pull apart there, at the cervical area just above the fulcrum.";
    if (st.d > 0.3) s += " Load after load, an abfraction lesion has formed on the tensile side. It's hard to be sure it isn't abrasion: look for tori, exostoses and wear facets, and treat it with a night guard, a sacrificial piece of plastic to grind on.";
    sum.textContent = s;
    if (readout) readout.textContent = lat < 0.08 ? "all compression" : "tension buccal · compression lingual";
  }
  function stop() { cancelAnimationFrame(raf); playing = false; play.setAttribute("aria-pressed", "false"); st.u = 1; draw(); text(); }
  /* repeat the load: each one bends the tooth and lets it go; where there's tension, the notch deepens */
  function run() {
    if (playing) { stop(); return; }
    var lat = D.abLat(st, D), per = 0.24 * lat / Math.sin(D.ANG * Math.PI / 180);
    if (reduce.matches) { st.d = Math.min(D.DMAX, st.d + per * 8); st.k = Math.min(1, st.k + lat * 1.1); st.u = 1; draw(); text(); return; }
    playing = true; play.setAttribute("aria-pressed", "true");
    var t0 = performance.now(), n = 8, last = 0;
    function step(now) {
      var ph = (now - t0) / 620, c = Math.floor(ph);
      if (c > last) { st.d = Math.min(D.DMAX, st.d + per); st.k = Math.min(1, st.k + lat * 0.14); last = c; text(); }
      if (c >= n) { stop(); return; }
      st.u = Math.sin(Math.PI * (ph - c)); draw();
      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
  }
  slider.addEventListener("input", function () { st.t = +slider.value / 100; if (!playing) st.u = 1; draw(); text(); });
  play.addEventListener("click", run);
  reset.addEventListener("click", function () { if (playing) stop(); st.d = 0; st.k = 0; draw(); text(); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && root.contains(el) && el.getAttribute("data-info")) info.textContent = el.getAttribute("data-info"); }
  [tooth, sign].forEach(function (s) { s.addEventListener("pointerover", hot); s.addEventListener("click", hot); });
  draw(); text();
}

const CSS = `
.anima .ab-box{max-width:600px;margin:0 auto;display:flex;flex-wrap:wrap;justify-content:center;align-items:flex-end;gap:4px 14px}
.anima .am-svg.ab-box svg.ab-tooth{flex:340 1 300px;width:auto;max-width:420px}
.anima .am-svg.ab-box svg.ab-signbox{flex:200 1 170px;width:auto;max-width:240px}
.anima .ab-svg .ab-t{fill:var(--anatomy-text);font:12px var(--anatomy-mono);paint-order:stroke;stroke:var(--surface);stroke-width:3.5px;stroke-linejoin:round}
.anima .ab-svg .ab-strong{fill:var(--anatomy-strong);font-weight:700}
.anima .ab-svg .ab-cap{fill:var(--anatomy-muted);font-size:11px}
.anima .ab-svg .ab-on{stroke:var(--anatomy-shade-1)}
.anima .ab-svg .ab-tlab{fill:var(--tm-vessel);font-weight:700}
.anima .ab-svg .ab-clab{fill:#2f6fb4;font-weight:700}
.anima .ab-svg .ab-bone{fill:var(--tm-bone);stroke:var(--anatomy-lo);stroke-width:1}
.anima .ab-svg .ab-pdl{fill:var(--anatomy-faint);stroke:var(--anatomy-lo);stroke-width:.6}
.anima .ab-svg .ab-gum{fill:var(--tm-retro);stroke:var(--anatomy-lo);stroke-width:.8;stroke-linejoin:round}
.anima .ab-svg .ab-axis{fill:none;stroke:var(--anatomy-mid);stroke-width:1;stroke-dasharray:5 4;pointer-events:none}
.anima .ab-svg .ab-enamel{fill:var(--tm-disc-mid)}
.anima .ab-svg .ab-dentin{fill:#e3c98a;stroke:var(--anatomy-lo);stroke-width:.8;stroke-linejoin:round}
.anima .ab-svg .ab-pulp{fill:var(--tm-muscle);stroke:var(--anatomy-lo);stroke-width:.7}
.anima .ab-svg .ab-out{fill:none;stroke:var(--anatomy-hi);stroke-width:1.3;stroke-linejoin:round;pointer-events:none}
.anima .ab-svg .ab-cej{fill:none;stroke:none}
.anima .ab-svg .ab-band{fill:none;stroke-width:6;stroke-linecap:round;stroke-linejoin:round}
.anima .ab-svg .ab-tens{stroke:var(--tm-vessel)}
.anima .ab-svg .ab-comp{stroke:#3b7fd0}
.anima .ab-svg .ab-air{fill:var(--surface);stroke:none;pointer-events:none}
.anima .ab-svg .ab-notch{fill:none;stroke:var(--anatomy-hi);stroke-width:1.3;stroke-linejoin:miter;pointer-events:stroke}
.anima .ab-svg .ab-force{fill:none;stroke:var(--anatomy-strong);stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}
.anima .ab-svg .ab-ground{fill:var(--anatomy-shade-1);stroke:none}
.anima .ab-svg .ab-post{fill:none;stroke:var(--anatomy-mid);stroke-width:7;stroke-linecap:butt;stroke-linejoin:round}
.anima .ab-svg .ab-sign{fill:#c8323a;stroke:var(--anatomy-hi);stroke-width:1}
.anima .ab-svg .ab-sign-rim{fill:none;stroke:#fff;stroke-width:2}
.anima .ab-svg .ab-stop{fill:#fff;font:700 15px var(--font-body);letter-spacing:.5px}
.anima .ab-svg .ab-crack{fill:var(--anatomy-hi)}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]) .anima .ab-svg .ab-clab{fill:#7fb2ec} :root:not([data-theme="light"]) .anima .ab-svg .ab-comp{stroke:#6ea8ea} }
:root[data-theme="dark"] .anima .ab-svg .ab-clab{fill:#7fb2ec}
:root[data-theme="dark"] .anima .ab-svg .ab-comp{stroke:#6ea8ea}
`;

export function abfract() {
  return {
    id: "abfract", lec: "nccl",
    title: "Abfraction: why the notch forms at the neck of the tooth",
    caption: "Move the load from the long axis onto an inclined plane and watch the tooth bend about the bone: one side compressed, the other stretched. Then load it again and again to see where the lesion forms, beside his stop sign.",
    html: `<div class="anima" data-anima="abfract">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: abLive.toString(),
    helpers: [abLat, abSmooth, abTooth, abSign],
    data: DATA,
  };
}
