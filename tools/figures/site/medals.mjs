/* Mastery medals and trophy icons, drawn by hand in Timmy's ink style (tools/figures/site/style.mjs).
   Contract (the build and the preview page import exactly this):
     MEDAL_LEVELS                 ["Bronze", "Silver", "Gold", "Crown"]
     medal(level, hubId)          inner markup for viewBox 0 0 64 64; level 1-4; the hub's ribbons and emblem glyph
     TROPHIES[key].body           inner markup for viewBox 0 0 64 64, one per trophy key in widget/ranks.js
                                  (TROPHIES and HUB_TROPHIES, minus the four mastery-* keys, which are the medals)
     silhouette(key)              the trophy's outer shapes only, in currentColor: a locked secret trophy's mystery shape
   No ids, gradients, filters, <text> or <style>. Light comes from the top left: one flat shade on the far side, short
   white highlights on the near side, ink outlines 2.5 outside and 1.5 for inner detail.                              */
import { INK, C, TINTS } from "./style.mjs";

export const MEDAL_LEVELS = ["Bronze", "Silver", "Gold", "Crown"];

/* ---------------- small drawing helpers ---------------- */
const n = (v) => +(+v).toFixed(2);
const P = (x, y) => n(x) + " " + n(y);
const RJ = 'stroke-linejoin="round" stroke-linecap="round"';
function rng(seed){ let s = (seed * 9301 + 49297) % 233280 || 1; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
const rad = (d) => d * Math.PI / 180;
const pt = (cx, cy, r, deg) => [cx + Math.cos(rad(deg)) * r, cy + Math.sin(rad(deg)) * r];
/* closed Catmull-Rom curve through points: a smooth, hand-drawn outline */
function smooth(pts){
  const k = pts.length; let d = "M" + P(pts[0][0], pts[0][1]);
  for (let i = 0; i < k; i++){
    const p0 = pts[(i - 1 + k) % k], p1 = pts[i], p2 = pts[(i + 1) % k], p3 = pts[(i + 2) % k];
    d += "C" + P(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6) + " " + P(p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6) + " " + P(p2[0], p2[1]);
  }
  return d + "Z";
}
/* a wobbly ellipse (wob = how far a hand strays, in units), optionally turned by rot degrees */
function blob(cx, cy, rx, ry, wob = .35, seed = 1, k = 12, rot = 0){
  const R = rng(seed * 31 + 7), pts = [], c = Math.cos(rad(rot)), s = Math.sin(rad(rot));
  for (let i = 0; i < k; i++){
    const a = i / k * Math.PI * 2 - Math.PI / 2, j = (R() - .5) * 2 * wob;
    const x = Math.cos(a) * (rx + j), y = Math.sin(a) * (ry + j);
    pts.push([cx + x * c - y * s, cy + x * s + y * c]);
  }
  return smooth(pts);
}
/* a flat shade crescent on the far (bottom right) side of a disc */
function crescent(cx, cy, r, a1 = -25, a2 = 150, k = 1.32){
  const p1 = pt(cx, cy, r, a1), p2 = pt(cx, cy, r, a2);
  return "M" + P(p1[0], p1[1]) + "A" + n(r) + " " + n(r) + " 0 0 1 " + P(p2[0], p2[1]) + "A" + n(r * k) + " " + n(r * k) + " 0 0 0 " + P(p1[0], p1[1]) + "Z";
}
/* an arc as an open path (for highlights) */
function arc(cx, cy, r, a1, a2){
  const p1 = pt(cx, cy, r, a1), p2 = pt(cx, cy, r, a2);
  return "M" + P(p1[0], p1[1]) + "A" + n(r) + " " + n(r) + " 0 0 1 " + P(p2[0], p2[1]);
}
/* a scalloped ring (a rosette's petals) */
function scallop(cx, cy, r, k, bulge = .62){
  let d = "";
  for (let i = 0; i <= k; i++){
    const p = pt(cx, cy, r, -90 + i * 360 / k);
    if (!i) { d = "M" + P(p[0], p[1]); continue; }
    const q = pt(cx, cy, r, -90 + (i - 1) * 360 / k), ch = Math.hypot(p[0] - q[0], p[1] - q[1]);
    d += "A" + n(ch * bulge) + " " + n(ch * bulge) + " 0 0 1 " + P(p[0], p[1]);
  }
  return d + "Z";
}
function star(cx, cy, R, r, k = 5, rot = -90){
  const pts = [];
  for (let i = 0; i < k * 2; i++){ const p = pt(cx, cy, i % 2 ? r : R, rot + i * 180 / k); pts.push(P(p[0], p[1])); }
  return "M" + pts.join("L") + "Z";
}
/* a four-point sparkle */
function sparkle(cx, cy, R){
  const q = R * .18;
  return "M" + P(cx, cy - R) + "Q" + P(cx + q, cy - q) + " " + P(cx + R, cy) + "Q" + P(cx + q, cy + q) + " " + P(cx, cy + R) +
    "Q" + P(cx - q, cy + q) + " " + P(cx - R, cy) + "Q" + P(cx - q, cy - q) + " " + P(cx, cy - R) + "Z";
}
/* points sampled along a turned ellipse, as an open path */
function ellArc(cx, cy, rx, ry, a0, a1, step = 5){
  const pts = [];
  for (let a = a0; a <= a1 + .001; a += step) pts.push(P(cx + Math.cos(rad(a)) * rx, cy + Math.sin(rad(a)) * ry));
  return "M" + pts.join("L");
}
function darken(hex, k){
  const v = parseInt(hex.slice(1), 16), f = (c) => Math.max(0, Math.min(255, Math.round(c * (1 - k))));
  return "#" + [(v >> 16) & 255, (v >> 8) & 255, v & 255].map(f).map((c) => c.toString(16).padStart(2, "0")).join("");
}
function lighten(hex, k){
  const v = parseInt(hex.slice(1), 16), f = (c) => Math.round(c + (255 - c) * k);
  return "#" + [(v >> 16) & 255, (v >> 8) & 255, v & 255].map(f).map((c) => c.toString(16).padStart(2, "0")).join("");
}
/* Timmy's own tooth (widget/pet.js TOOTH, a 200 x 260 frame), moved and scaled into the 64 box */
const TOOTH = "M48 86 C42 56 56 34 78 34 C90 34 94 44 100 44 C106 44 110 34 122 34 C144 34 158 56 152 86 " +
  "C149 106 146 122 144 140 C142 166 138 192 130 210 C126 218 116 218 114 208 C111 190 108 172 100 168 " +
  "C92 172 89 190 86 208 C84 218 74 218 70 210 C62 192 58 166 56 140 C54 122 51 106 48 86 Z";
const TOOTH_SHADE = "M128 37 C147 42 157 62 151 88 C148 108 145 124 143 142 C141 168 137 192 129 210 C126 215 120 215 117 209 " +
  "C121 190 125 166 127 142 C129 120 135 104 137 88 C139 66 137 50 128 37 Z";
const TOOTH_HI = "M60 82 C58 60 66 46 80 43";
function tx(path, cx, top, s, flip){
  return path.replace(/(-?\d+\.?\d*) (-?\d+\.?\d*)/g, (m, x, y) => {
    const X = flip ? cx - (+x - 100) * s : cx + (+x - 100) * s, Y = flip ? top + (218 - +y) * s : top + (+y - 34) * s;
    return P(X, Y);
  });
}

/* parts: F = a filled, inked shape (with optional flat shade, inner detail and highlight); L = a plain stroke;
   T = a thick colored stroke with an ink edge (handles, rods); R = raw detail that the silhouette leaves out */
const F = (d, fill, o = {}) => ({ t: "f", d, fill, w: o.w == null ? 2.5 : o.w, shade: o.shade, sh: o.sh, op: o.op, inner: o.inner || "", hi: o.hi });
const L = (d, w = 1.5, color = INK, o = {}) => ({ t: "l", d, w, color, op: o.op });
const T = (d, w, fill, o = {}) => ({ t: "t", d, w, fill, edge: o.edge == null ? 2.6 : o.edge });
const R = (s) => ({ t: "r", s });
const hi = (d, w = 2, op = .65) => '<path d="' + d + '" stroke="#fff" stroke-width="' + w + '" stroke-linecap="round" fill="none" opacity="' + op + '"/>';
const fill = (d, c, op) => '<path d="' + d + '" fill="' + c + '"' + (op != null ? ' opacity="' + op + '"' : "") + "/>";
const line = (d, w, c = INK, op) => '<path d="' + d + '" fill="none" stroke="' + c + '" stroke-width="' + w + '" ' + RJ + (op != null ? ' opacity="' + op + '"' : "") + "/>";

function body(parts){
  return parts.map((p) => {
    if (p.t === "f") {
      return fill(p.d, p.fill) + (p.shade ? (Array.isArray(p.shade) ? p.shade : [p.shade]).map((s) => fill(s, p.sh || darken(p.fill, .18), p.op)).join("") : "") +
        p.inner + (p.hi ? (Array.isArray(p.hi) ? p.hi : [p.hi]).map((h) => hi(h)).join("") : "") +
        '<path d="' + p.d + '" fill="none" stroke="' + INK + '" stroke-width="' + p.w + '" ' + RJ + "/>";
    }
    if (p.t === "l") return line(p.d, p.w, p.color, p.op);
    if (p.t === "t") return line(p.d, p.w + p.edge, INK) + line(p.d, p.w, p.fill);
    return p.s;
  }).join("");
}
function sil(parts){
  return parts.map((p) => {
    if (p.t === "f") return '<path d="' + p.d + '" fill="currentColor" stroke="currentColor" stroke-width="' + p.w + '" ' + RJ + "/>";
    if (p.t === "l") return p.color === INK || p.color === "#fff" ? '<path d="' + p.d + '" fill="none" stroke="currentColor" stroke-width="' + p.w + '" ' + RJ + "/>" : "";
    if (p.t === "t") return '<path d="' + p.d + '" fill="none" stroke="currentColor" stroke-width="' + (p.w + p.edge) + '" ' + RJ + "/>";
    return "";
  }).join("");
}

/* digits drawn as pen strokes (no <text>): a 1, a 0 and a 3 at height h, top-left x, y */
function digit(ch, x, y, h){
  const w = h * .58;
  if (ch === "1") return "M" + P(x + w * .2, y + h * .22) + "L" + P(x + w * .55, y) + "L" + P(x + w * .55, y + h);
  if (ch === "0") return "M" + P(x + w / 2, y) + "C" + P(x + w * 1.06, y) + " " + P(x + w * 1.06, y + h) + " " + P(x + w / 2, y + h) + "C" + P(x - w * .06, y + h) + " " + P(x - w * .06, y) + " " + P(x + w / 2, y) + "Z";
  if (ch === "3") return "M" + P(x, y + h * .12) + "C" + P(x + w * .4, y - h * .08) + " " + P(x + w * 1.05, y + h * .02) + " " + P(x + w * .92, y + h * .27) +
    "C" + P(x + w * .84, y + h * .44) + " " + P(x + w * .55, y + h * .48) + " " + P(x + w * .35, y + h * .48) +
    "C" + P(x + w * .75, y + h * .48) + " " + P(x + w * 1.08, y + h * .6) + " " + P(x + w * .98, y + h * .8) +
    "C" + P(x + w * .86, y + h * 1.04) + " " + P(x + w * .3, y + h * 1.06) + " " + P(x - w * .04, y + h * .88);
  return "";
}

/* ---------------- the medals ---------------- */
/* each hub's glyph on a 24 grid, one color: "f" filled shapes, "s" strokes, "c" cut lines in the medal's own metal */
const GLYPH = {
  "occlusion": [ // an articulator from the side: upper and lower members on a hinged post, two casts biting
    ["s", "M3.6 3.8H21.2M3.6 20.2H21.2M4.4 3.8V9.2M4.4 14.8V20.2", 2.6], ["s", "M4.4 9.6a2.4 2.4 0 1 0 .01 0Z", 1.8],
    ["f", "M9.4 5H20V9.4L18.2 12 16.4 9.8 14.6 12 12.8 9.8 11 12 9.4 9.6Z"],
    ["f", "M9.4 19H20V14.6L18.2 12.2 16.4 14.4 14.6 12.2 12.8 14.4 11 12.2 9.4 14.4Z"]
  ],
  "perio": [ // a periodontal probe: the handle, the shank and a marked working end
    ["s", "M4 20.2 10.6 13.6", 4.4], ["s", "M10.6 13.6 15.6 8.6", 2], ["s", "M15.6 8.6 19.6 3.6", 1.5],
    ["s", "M16.5 7.6l1.2 .9M18 5.7l1.2 .9", 2.6], ["c", "M6 16.8l1.6 1.6M7.7 15.1l1.6 1.6", 1]
  ],
  "pcd-implants-exam1": [ // a crown on an abutment on a threaded fixture
    ["f", "M6.6 5C6.6 3.2 8.4 2.6 10 3.3 11 3.7 13 3.7 14 3.3 15.6 2.6 17.4 3.2 17.4 5 17.4 7 16.4 8.4 15.3 9H8.7C7.6 8.4 6.6 7 6.6 5Z"],
    ["f", "M9.6 9.8H14.4L13.9 11.6H10.1Z"],
    ["f", "M9 12.3H15L15.9 13.5 14.7 14.4 15.6 15.6 14.4 16.5 15.2 17.7 14 18.6 14.5 19.6 12 21.8 9.5 19.6 10 18.6 8.8 17.7 9.6 16.5 8.4 15.6 9.3 14.4 8.1 13.5Z"]
  ],
  "heme-endo-exam2": [ // the thyroid: two lobes like butterfly wings, upper poles flaring, joined by the isthmus
    ["f", "M10.6 12.4C10 8.8 7.8 4.6 5.8 3.2 4.6 2.4 3.4 3.8 3 6.6 2.4 10.4 2.2 15 3.4 18.2 4.6 21.4 8.2 22 9.8 19.4 10.4 18.4 10.8 17.2 10.8 16.2Z"],
    ["f", "M13.4 12.4C14 8.8 16.2 4.6 18.2 3.2 19.4 2.4 20.6 3.8 21 6.6 21.6 10.4 21.8 15 20.6 18.2 19.4 21.4 15.8 22 14.2 19.4 13.6 18.4 13.2 17.2 13.2 16.2Z"],
    ["f", "M10 12H14V16.8C12.8 17.4 11.2 17.4 10 16.8Z"], ["c", "M6.4 9.6C5.6 11.4 5.4 13.8 5.8 16M17.6 9.6C18.4 11.4 18.6 13.8 18.2 16", 1]
  ],
  "special-patient-care": [ // a molar resting in an open hand
    ["f", "M1.6 22.4V17.4C1.6 15.8 2.6 14.8 4 14.6L5.4 14.4C5.8 12.4 7.4 11.6 8.6 12.8L10 15.8H17C18.4 15.8 19.2 14.8 19.8 13.6 20.4 12.2 22.2 12.4 22.2 13.8 22.2 18.6 18.8 21.4 14.6 21.4H8.2L6.2 22.4Z"],
    ["c", "M17.6 18.4 20.4 17.6M16.6 20 19 19.4", 1],
    ["f", tx(TOOTH, 14.4, 1.2, .074)]
  ],
  "generic": [["f", tx(TOOTH, 12, 2.8, .1)]]
};
const MET = {
  1: [C.bronze, C.bronzeShade, C.bronzeLight],
  2: [C.silver, C.silverShade, C.silverLight],
  3: [C.gold, C.goldShade, C.goldLight],
  4: [C.gold, C.goldShade, C.goldLight]
};
function glyph(hub, cx, cy, s, metal){
  const g = GLYPH[hub] || GLYPH.generic;
  let out = '<g transform="translate(' + n(cx - 12 * s) + " " + n(cy - 12 * s) + ") scale(" + s + ')">';
  g.forEach((p) => {
    if (p[0] === "f") out += '<path d="' + p[1] + '" fill="' + INK + '"/>';
    else if (p[0] === "s") out += '<path d="' + p[1] + '" fill="none" stroke="' + INK + '" stroke-width="' + p[2] + '" ' + RJ + "/>";
    else out += '<path d="' + p[1] + '" fill="none" stroke="' + metal + '" stroke-width="' + p[2] + '" ' + RJ + "/>";
  });
  if (hub === "special-patient-care") out += '<path d="' + tx(TOOTH, 14.4, 1.2, .074) + '" fill="none" stroke="' + metal + '" stroke-width="1.2"/>';
  return out + "</g>";
}
export function medal(level, hubId){
  const lv = Math.max(1, Math.min(4, level | 0)), t = TINTS[hubId] || TINTS.generic, m = MET[lv], crown = lv === 4;
  const cx = 32, cy = crown ? 34 : 24.5, r = crown ? 16 : 17.5;
  const y0 = cy + r * .42, y1 = crown ? 61.5 : 59;
  /* the ribbon tails, in the hub's tint, each with a notched end */
  const left = "M" + P(cx - 12.5, y0 - 1) + "L" + P(cx - 1, y0 + 3) + "L" + P(cx - 5.5, y1) + "L" + P(cx - 9.2, y1 - 4) + "L" + P(cx - 13.6, y1 - 1.6) + "Z";
  const right = "M" + P(cx + 12.5, y0 - 1) + "L" + P(cx + 1, y0 + 3) + "L" + P(cx + 5.5, y1) + "L" + P(cx + 9.2, y1 - 4) + "L" + P(cx + 13.6, y1 - 1.6) + "Z";
  let s = fill(left, t.ink) + fill("M" + P(cx - 4.2, y0 + 1.8) + "L" + P(cx - 1, y0 + 3) + "L" + P(cx - 5.5, y1) + "L" + P(cx - 7.3, y1 - 2.3) + "Z", darken(t.ink, .28)) +
    line(left, 2.2) + fill(right, t.mid) + fill("M" + P(cx + 12.5, y0 - 1) + "L" + P(cx + 9.2, y0 + .4) + "L" + P(cx + 11.2, y1 - 2.6) + "L" + P(cx + 13.6, y1 - 1.6) + "Z", darken(t.mid, .2)) + line(right, 2.2);
  /* the disc: flat metal, a shade crescent, an inner rim, the hub's glyph, a highlight, the ink outline */
  const disc = blob(cx, cy, r, r, .3, lv + 3, 14);
  s += fill(disc, m[0]) + fill(crescent(cx, cy, r - .4, -30, 150, 1.36), m[1], lv === 2 ? .42 : .38) +
    '<path d="' + blob(cx, cy, r - 4.4, r - 4.4, .25, lv + 9, 12) + '" fill="none" stroke="' + m[1] + '" stroke-width="1.5" opacity=".8"/>' +
    glyph(hubId, cx, cy, crown ? .76 : .84, m[0]) +
    hi(arc(cx, cy, r - 2.3, 196, 242), 2.2, .85) + hi(arc(cx, cy, r - 2.3, 252, 260), 2.2, .85) +
    line(disc, 2.5);
  if (crown) {
    const c = "M" + P(20.5, 19.6) + "L" + P(18.6, 7.4) + "L" + P(25.4, 12.4) + "L" + P(32, 3.6) + "L" + P(38.6, 12.4) + "L" + P(45.4, 7.4) + "L" + P(43.5, 19.6) +
      "C" + P(36, 21.2) + " " + P(28, 21.2) + " " + P(20.5, 19.6) + "Z";
    s += fill(c, C.gold) + fill("M" + P(32, 3.6) + "L" + P(38.6, 12.4) + "L" + P(45.4, 7.4) + "L" + P(43.5, 19.6) + "C" + P(40, 20.3) + " " + P(36, 20.6) + " " + P(33, 20.7) + "Z", C.goldShade, .4) +
      line("M" + P(21.1, 16.4) + "C" + P(28.4, 17.8) + " " + P(35.6, 17.8) + " " + P(42.9, 16.4), 1.5) +
      hi("M" + P(21.6, 12.2) + "L" + P(22.2, 15), 1.8, .8) + line(c, 2.2) +
      '<circle cx="18.6" cy="7.4" r="1.9" fill="' + C.red + '" stroke="' + INK + '" stroke-width="1.3"/>' +
      '<circle cx="45.4" cy="7.4" r="1.9" fill="' + C.red + '" stroke="' + INK + '" stroke-width="1.3"/>' +
      '<circle cx="32" cy="3.9" r="2.2" fill="' + C.blue + '" stroke="' + INK + '" stroke-width="1.3"/>';
  }
  return s;
}

/* ---------------- the trophies ---------------- */
function stopwatch(bodyFill, bodyShade, wedge, handDeg, extra){
  const cx = 32, cy = 37.5, r = 18.5;
  const ring = blob(cx, cy, r, r, .3, 21, 14), face = blob(cx, cy, r - 4.3, r - 4.3, .2, 22, 12);
  let ticks = "";
  for (let i = 0; i < 12; i++){ const a = -90 + i * 30, p = pt(cx, cy, r - 6.2, a), q = pt(cx, cy, r - 8.2, a); ticks += "M" + P(p[0], p[1]) + "L" + P(q[0], q[1]); }
  const hp = pt(cx, cy, r - 7.8, handDeg - 90);
  const wedgePath = wedge >= 1 ? face : (() => { const p1 = pt(cx, cy, r - 4.3, -90), p2 = pt(cx, cy, r - 4.3, -90 + wedge * 360);
    return "M" + P(cx, cy) + "L" + P(p1[0], p1[1]) + "A" + n(r - 4.3) + " " + n(r - 4.3) + " 0 " + (wedge > .5 ? 1 : 0) + " 1 " + P(p2[0], p2[1]) + "Z"; })();
  return [
    F("M" + P(28.6, 19.6) + "L" + P(28.6, 16) + "H" + n(35.4) + "V" + n(19.6) + "Z", C.metal, { w: 2.2 }),
    F("M" + P(25.6, 11.4) + "C" + P(25.6, 10) + " " + P(26.4, 9.4) + " " + P(27.8, 9.4) + "H" + n(36.2) + "C" + P(37.6, 9.4) + " " + P(38.4, 10) + " " + P(38.4, 11.4) + "V" + n(14.4) +
      "C" + P(38.4, 15.6) + " " + P(37.6, 16.2) + " " + P(36.2, 16.2) + "H" + n(27.8) + "C" + P(26.4, 16.2) + " " + P(25.6, 15.6) + " " + P(25.6, 14.4) + "Z", bodyFill, { w: 2.2, shade: "M33 9.6H36.2C37.6 9.6 38.2 10.2 38.2 11.4V14.4C38.2 15.4 37.6 16 36.2 16H33Z", sh: bodyShade, op: .5 }),
    F("M" + P(43.2, 23.8) + "L" + P(46.6, 20.4) + "L" + P(49.6, 23.4) + "L" + P(46.2, 26.8) + "Z", bodyFill, { w: 2 }),
    F(ring, bodyFill, { shade: crescent(cx, cy, r - .4, -30, 150, 1.36), sh: bodyShade, op: .45, hi: arc(cx, cy, r - 2.1, 200, 250) }),
    F(face, C.paper, { w: 1.6, inner: fill(wedgePath, C.goldLight) + line(ticks, 1.3) + line("M" + P(cx, cy) + "L" + P(hp[0], hp[1]), 2.2) +
      '<circle cx="' + cx + '" cy="' + cy + '" r="1.9" fill="' + INK + '"/>' }),
    ...(extra || [])
  ];
}

const S = {};
/* First Hundred: a ribbon rosette with 100 on it */
S["answers-100"] = () => [
  F("M27 34 L20.6 56.6 L24.8 54.2 L28.4 57.4 L33.6 36Z", C.red, { shade: "M30.6 35.2L28.4 57.4L33.6 36Z", sh: darken(C.red, .25) }),
  F("M37 34 L43.4 56.6 L39.2 54.2 L35.6 57.4 L30.4 36Z", darken(C.red, .12), { shade: "M37 34L43.4 56.6L41.4 55.5L35.2 35.1Z", sh: darken(C.red, .3) }),
  F(scallop(32, 26.5, 17.5, 14, .64), C.gold, { shade: crescent(32, 26.5, 17, -20, 140, 1.3), sh: C.goldShade, op: .45, hi: [arc(32, 26.5, 15.5, 200, 236)] }),
  F(blob(32, 26.5, 11.2, 11.2, .25, 5, 12), C.paper, { w: 1.8, shade: crescent(32, 26.5, 10.8, -10, 120, 1.3), sh: C.paperShade,
    inner: line(digit("1", 23.6, 22.4, 8.4) + digit("0", 28.4, 22.4, 8.4) + digit("0", 34.2, 22.4, 8.4), 1.9) })
];
/* Thousand Club: a mountain with a flag on the peak */
S["answers-1000"] = () => [
  F("M35 55 C39 45 43 36 45.8 30.8 C46.8 29 48.6 29 49.6 30.8 C52.4 36.4 55.6 45 58 55Z", "#B9C1CA", { shade: "M47.8 29.6C50 37 51.6 46 52.4 55H58C55.6 45 52.4 36.4 49.6 30.8Z", sh: C.metalShade, op: .6 }),
  F("M6 55 C11 45 19.6 29.6 26.2 18.4 C27.2 16.8 28.6 16.8 29.6 18.4 C36 29 44.4 44.6 50 55Z", C.metal,
    { shade: "M28.2 17.6C30 30 31.2 43 33 55H50C44.4 44.6 36 29 29.6 18.4Z", sh: C.metalShade, op: .55,
      inner: '<path d="M22.4 24.6C24.6 21.2 26 19 27.6 17.6 29.4 19 30.8 21.2 33 24.8L30.8 23.2 29 26 27.2 23.2 25 26Z" fill="#fff" stroke="' + INK + '" stroke-width="1.5" ' + RJ + "/>",
      hi: "M12.6 47.6C15 43 17.6 38.6 20 34.6" }),
  L("M27.9 17.4V5.6", 2.2),
  F("M28.4 5.8 C32 6.4 35 8.6 38.4 9.2 C35 10 32 11.8 28.4 12.6Z", C.red, { w: 1.8 })
];
/* Full Week: a calendar page with seven ticks */
S["days-7"] = () => {
  const page = "M15.6 13.4H48.4C50.8 13.4 52.2 14.8 52.2 17.2V45.6L44.6 56.4H15.8C13.4 56.4 12 55 12 52.6V17.2C12 14.8 13.4 13.4 15.6 13.4Z";
  let ticks = "";
  [[19.5, 31], [27.5, 31], [35.5, 31], [43.5, 31], [23.5, 43], [31.5, 43], [39.5, 43]].forEach(([x, y]) => { ticks += "M" + P(x - 3, y) + "L" + P(x - .8, y + 2.6) + "L" + P(x + 3.4, y - 3); });
  return [
    F(page, C.paper, { shade: "M48.6 13.6C50.8 13.8 52 15 52 17.2V45.6L48.6 50.4Z", sh: C.paperShade,
      inner: fill("M15.6 13.4H48.4C50.8 13.4 52.2 14.8 52.2 17.2V22.6H12V17.2C12 14.8 13.4 13.4 15.6 13.4Z", C.red) +
        fill("M44 13.6H48.4C50.8 13.6 52 14.8 52 17.2V22.4H44Z", darken(C.red, .2), .6) + line("M12 22.6H52.2", 1.5) + line(ticks, 2.1) }),
    F("M44.6 56.4L52.2 45.6H47.4C45.8 45.6 44.6 46.8 44.6 48.4Z", C.paperShade, { w: 1.8 }),
    F("M20.6 8.6C20.6 7.4 21.4 6.6 22.6 6.6 23.8 6.6 24.6 7.4 24.6 8.6V16.6C24.6 17.8 23.8 18.6 22.6 18.6 21.4 18.6 20.6 17.8 20.6 16.6Z", C.metal, { w: 1.8 }),
    F("M39.4 8.6C39.4 7.4 40.2 6.6 41.4 6.6 42.6 6.6 43.4 7.4 43.4 8.6V16.6C43.4 17.8 42.6 18.6 41.4 18.6 40.2 18.6 39.4 17.8 39.4 16.6Z", C.metal, { w: 1.8 })
  ];
};
/* Iron Routine: a kettlebell with 30 painted on it */
S["days-30"] = () => [
  T("M22.4 30 C19.6 16 23.6 9.2 32 9.2 C40.4 9.2 44.4 16 41.6 30", 3.8, C.metalShade, { edge: 3.4 }),
  F("M32 22.4 C44.6 22.4 52.6 30.6 52.6 40.8 C52.6 48.8 47.8 54.4 43.4 56.4 H20.6 C16.2 54.4 11.4 48.8 11.4 40.8 C11.4 30.6 19.4 22.4 32 22.4Z", C.plum,
    { shade: "M48 28C51 31.6 52.6 36 52.6 40.8 52.6 48.8 47.8 54.4 43.4 56.4H33C42 54 48.4 46 48 28Z", sh: darken(C.plum, .3),
      inner: line(digit("3", 23.4, 34.6, 11) + digit("0", 33, 34.6, 11), 2.4, "#fff"), hi: ["M17.8 36.8C18.6 32.4 21.8 28.6 26 26.8"] }),
  L("M18.6 56.4H45.4", 2.5)
];
/* Sharp Explorer: a dental explorer with its shepherd's hook */
S["run-25"] = () => [
  T("M11.4 55 L30.6 35.8", 6.2, C.metal, { edge: 3 }),
  L("M14.2 49.4l3 3M17.4 46.2l3 3M20.6 43l3 3M23.8 39.8l3 3", 1.2, C.metalShade),
  T("M30.6 35.8 L42.6 23.8", 2.4, C.metal),
  T("M42.6 23.8 C46.6 19.8 50.2 14 47.8 10.2 C46 7.4 42.2 8 41.4 11.6", 1.8, C.metal),
  F(sparkle(34.6, 12.4, 5.4), C.gold, { w: 1.5 }),
  F(sparkle(52.6, 25.6, 3.2), C.gold, { w: 1.3 })
];
/* Tactical: a target with an arrow in the bull */
S["run-100"] = () => [
  F(blob(29, 35, 22, 22, .35, 41, 14), C.red, { shade: crescent(29, 35, 21.6, -20, 140, 1.36), sh: darken(C.red, .25), op: .7, hi: arc(29, 35, 19.6, 202, 238) }),
  F(blob(29, 35, 15.6, 15.6, .3, 42, 12), C.paper, { w: 1.6 }),
  F(blob(29, 35, 9.6, 9.6, .2, 43, 10), C.red, { w: 1.6 }),
  F(blob(29, 35, 4, 4, .1, 44, 8), C.gold, { w: 1.5 }),
  T("M30 34 L52.4 11.6", 2.2, C.wood, { edge: 2.6 }),
  F("M47 13 L49.6 6.6 L52.2 9.2 Z", C.gold, { w: 1.6 }), F("M50.8 16.8 L57.2 14.2 L54.6 11.6 Z", C.gold, { w: 1.6 }),
  F("M50.4 10.6 L53 4.2 L55.6 6.8 Z", C.blue, { w: 1.6 }), F("M53.2 13.4 L59.6 10.8 L57 8.2 Z", C.blue, { w: 1.6 })
];
/* Mock Ace: a stopwatch at 90% with a star */
S["mock90"] = () => stopwatch(C.metal, C.metalShade, .9, 324, [
  F(star(47.4, 47.6, 9.6, 4.4, 5, -90), C.gold, { w: 2.2, shade: "M47.4 47.6L53.6 52.6L56.5 44.6Z", sh: C.goldShade, op: .45 })
]);
/* Arcade Regular: a joystick */
S["arcade-25"] = () => [
  F("M7.6 46.4H56.4V52.4C56.4 54.8 54.8 56.4 52.4 56.4H11.6C9.2 56.4 7.6 54.8 7.6 52.4Z", C.blue, { shade: "M46 46.6H56.2V52.4C56.2 54.6 54.6 56.2 52.4 56.2H46Z", sh: darken(C.blue, .25) }),
  F("M12.4 38.2H51.6C53.6 38.2 54.8 39.2 55.2 41L56.4 46.4H7.6L8.8 41C9.2 39.2 10.4 38.2 12.4 38.2Z", "#8FD3F5", { w: 2.2,
    inner: '<ellipse cx="42" cy="42.2" rx="3.4" ry="1.9" fill="' + C.yellow + '" stroke="' + INK + '" stroke-width="1.5"/>' +
      '<ellipse cx="49.4" cy="42.2" rx="3.4" ry="1.9" fill="' + C.green + '" stroke="' + INK + '" stroke-width="1.5"/>' +
      '<ellipse cx="25.6" cy="42.2" rx="6" ry="2.4" fill="' + darken("#8FD3F5", .2) + '" stroke="' + INK + '" stroke-width="1.5"/>' }),
  T("M25.6 41.6 L22.6 22", 2.8, C.metal),
  F(blob(22, 17, 8.4, 8.2, .3, 51, 12), C.red, { shade: crescent(22, 17, 8, -20, 130, 1.35), sh: darken(C.red, .25), hi: arc(22, 17, 5.8, 200, 245) })
];
/* Golden Probe: a gold periodontal probe, sparkling */
S["golden"] = () => [
  T("M11 55.4 L31.6 34.8", 6.2, C.gold, { edge: 3 }),
  L("M14.6 49.2l2.6 2.6M17.8 46l2.6 2.6M21 42.8l2.6 2.6", 1.3, C.goldShade),
  T("M31.6 34.8 L42 24.4", 2.4, C.gold),
  T("M42 24.4 L48.2 13.4", 1.9, C.gold),
  L("M43.8 21.2l1.6 .9M46 17.4l1.6 .9", 3.2),
  F(sparkle(21, 21.6, 7.4), C.goldLight, { w: 1.6 }), F(sparkle(51.6, 36.4, 4.8), C.gold, { w: 1.5 }), F(sparkle(53.4, 8.6, 3.4), C.paper, { w: 1.3 })
];
/* Tooth Fairy: a wand topped with a little winged tooth */
S["fairy"] = () => [
  T("M13 56 L31.4 33", 2.6, C.pink),
  F(blob(28.2, 16.6, 7.6, 4.6, .3, 61, 12, -32), C.sky, { w: 1.6, hi: "M24 15.4C25.4 13.6 27.6 12.6 29.8 12.4" }),
  F(blob(48.2, 16.6, 7.6, 4.6, .3, 62, 12, 32), C.sky, { w: 1.6 }),
  F(tx(TOOTH, 38.2, 9.6, .135), C.enamel, { w: 2.2, shade: tx(TOOTH_SHADE, 38.2, 9.6, .135), sh: C.enamelShade, hi: tx(TOOTH_HI, 38.2, 9.6, .135),
    inner: line("M34.6 20.8Q36 22 37.4 20.8M39 20.8Q40.4 22 41.8 20.8M36.4 24.2Q38.2 25.8 40 24.2", 1.3) }),
  F(sparkle(19.6, 22.4, 4.8), C.gold, { w: 1.4 }), F(sparkle(54.6, 32, 3.6), C.gold, { w: 1.3 }), F(sparkle(22.6, 40.6, 2.8), C.goldLight, { w: 1.2 })
];
/* Fairy Collector: a jar of fairy lights (a string of five glowing bulbs) */
S["fairy-5"] = () => {
  const wire = "M18.6 28.6C24 26.6 27 33 23.6 36.6 20 40.4 26 45.6 31 42.6 36 39.6 34 31.4 39.6 30.6 45 29.8 47.4 36 44 40.6 40.6 45.2 44.6 50.6 46.4 52.6";
  let lights = line(wire, 1.5);
  [[22.6, 30.2, -20], [24.4, 40.6, 40], [33.6, 37.4, -60], [41.6, 31.8, 30], [43.4, 46.4, -30]].forEach(([x, y, a]) => {
    const cap = pt(x, y, 2.6, a - 90);
    lights += '<circle cx="' + x + '" cy="' + y + '" r="4.4" fill="' + C.goldLight + '"/>' +
      '<path d="' + blob(x, y + .4, 1.9, 2.5, .06, Math.round(x * 3), 8, a) + '" fill="' + C.gold + '" stroke="' + INK + '" stroke-width="1.1"/>' +
      '<path d="' + blob(cap[0], cap[1], 1.3, .9, .02, Math.round(y * 3), 6, a) + '" fill="' + C.plum + '" stroke="' + INK + '" stroke-width=".9"/>';
  });
  return [
    F("M18.6 22.4C14.6 24.4 13.4 28.4 13.4 34V50.6C13.4 54.4 16.2 57 20 57H44C47.8 57 50.6 54.4 50.6 50.6V34C50.6 28.4 49.4 24.4 45.4 22.4Z", "#E8F5FC",
      { shade: "M45.4 22.6C49.2 24.4 50.4 28.4 50.4 34V50.6C50.4 54.2 47.8 56.8 44 56.8H42C45.6 55.4 46.4 52.4 46.4 49V33C46.4 28 45.2 24.6 43 22.6Z", sh: "#CDE6F3",
        inner: lights + fill(sparkle(30.4, 49.6, 2.6), "#fff") + fill(sparkle(36.4, 25.8, 2), "#fff"), hi: ["M17.4 33.4V45.2", "M17.4 49V50.6"] }),
    F("M17 13.4C17 11.8 18 11 19.6 11H44.4C46 11 47 11.8 47 13.4V19C47 20.6 46 21.4 44.4 21.4H19.6C18 21.4 17 20.6 17 19Z", C.metal,
      { shade: "M40.6 11.2H44.4C46 11.2 46.8 12 46.8 13.4V19C46.8 20.4 46 21.2 44.4 21.2H40.6Z", sh: C.metalShade, op: .5, inner: line("M22.4 11.6V20.8M27.6 11.6V20.8M32.8 11.6V20.8M38 11.6V20.8", 1.2, C.metalShade) })
  ];
};
/* Final Blow: a cracked, defeated plaque blob */
const PLAQUE = "#DCD46A";
S["boss"] = () => {
  const b = blob(31, 38, 22, 17.6, 1.6, 71, 13);
  return [
    F(b, PLAQUE, { shade: "M46 26C52 30 54.6 36 53 43 51.6 49 46.6 53.6 40 55.2 46 50.4 49.6 44 49.4 37 49.2 32.6 48 29 46 26Z", sh: "#B5AC3E",
      inner: line("M20 32.6l5.2 5.2M25.2 32.6L20 37.8M35.8 32.6l5.2 5.2M41 32.6l-5.2 5.2", 2.2) + line("M23.6 46.2C26.4 44.2 29 47.8 31.6 45.8 34.2 43.8 36.6 47.4 39.2 45.6", 1.8) +
        line("M33.6 21.4L30.4 28.6 34.8 31.2 30.8 39.4", 2.2) +
        '<circle cx="15.6" cy="42" r="1.6" fill="#B5AC3E"/><circle cx="45" cy="45.4" r="1.3" fill="#B5AC3E"/><circle cx="40.4" cy="26.6" r="1.1" fill="#B5AC3E"/>',
      hi: "M14.4 34.4C15.4 29.6 19 25.6 23.6 23.8" }),
    F(star(50, 15.4, 8.6, 4.4, 8, -90), C.orange, { w: 1.8, inner: fill(star(50, 15.4, 4.4, 2.2, 8, -67.5), C.yellow) })
  ];
};
/* Night Owl: an owl on a branch under the moon */
S["owl"] = () => {
  const owl = "M19 9.6 L25.6 15.4 C27.6 14.6 29.6 14.2 32 14.2 C34.4 14.2 36.4 14.6 38.4 15.4 L45 9.6 C46.4 14 46.8 18 46.2 21.6 " +
    "C46.8 24.8 47 28.2 47 32.2 C47 43 41 50.2 32 50.2 C23 50.2 17 43 17 32.2 C17 28.2 17.2 24.8 17.8 21.6 C17.2 18 17.6 14 19 9.6Z";
  return [
    F("M52.6 6.6 A9.2 9.2 0 1 1 46.4 22.6 A7.2 7.2 0 1 0 52.6 6.6Z", C.gold, { w: 1.8 }),
    F(owl, C.wood, { shade: ["M43 21C45.6 25 46.2 30 45.8 34 45.2 40 42 45 37 47.6 41 42 42.6 35 43 21Z"], sh: C.woodShade,
      inner: fill(blob(32, 40.4, 8.4, 8.2, .3, 81, 12), C.bronzeLight) +
        line("M28.4 37.6l1.6 1.4 1.6-1.4M32.4 37.6l1.6 1.4 1.6-1.4M30.4 41.6l1.6 1.4 1.6-1.4M34.4 41.6l1.6 1.4 1.6-1.4M28.4 45.4l1.6 1.2 1.6-1.2", 1.2, C.woodShade) +
        fill(blob(25.4, 26.6, 7.8, 7.6, .25, 82, 12), C.bronzeLight) + fill(blob(38.6, 26.6, 7.8, 7.6, .25, 83, 12), C.bronzeLight) +
        '<circle cx="25.4" cy="26.6" r="5.4" fill="#fff" stroke="' + INK + '" stroke-width="1.6"/><circle cx="38.6" cy="26.6" r="5.4" fill="#fff" stroke="' + INK + '" stroke-width="1.6"/>' +
        '<circle cx="26.2" cy="27.2" r="2.7" fill="' + INK + '"/><circle cx="39.4" cy="27.2" r="2.7" fill="' + INK + '"/>' +
        '<circle cx="27" cy="26.2" r=".9" fill="#fff"/><circle cx="40.2" cy="26.2" r=".9" fill="#fff"/>' +
        '<path d="M32 31.2L34.2 33.4 32 36.6 29.8 33.4Z" fill="' + C.orange + '" stroke="' + INK + '" stroke-width="1.3" ' + RJ + "/>",
      hi: "M20.6 30C21 25.4 22.4 21.4 24.8 18.6" }),
    T("M6.6 52.6 C20 50.8 40 50.6 57.4 52.4", 3.8, C.wood, { edge: 3 }),
    L("M44 51.4 C46.6 49.6 48.4 47.2 49 45", 2.6, C.woodShade),
    L("M26.4 49.6v3M28.4 49.8v2.8M35.6 49.8v2.8M37.6 49.6v3", 1.6, C.orange)
  ];
};
/* Cheat Code: a d-pad with its arrows and two buttons */
S["konami"] = () => {
  const cross = "M18.4 14.6C18.4 13.4 19.2 12.6 20.4 12.6H27.6C28.8 12.6 29.6 13.4 29.6 14.6V26.4H41.4C42.6 26.4 43.4 27.2 43.4 28.4V35.6C43.4 36.8 42.6 37.6 41.4 37.6H29.6" +
    "V49.4C29.6 50.6 28.8 51.4 27.6 51.4H20.4C19.2 51.4 18.4 50.6 18.4 49.4V37.6H6.6C5.4 37.6 4.6 36.8 4.6 35.6V28.4C4.6 27.2 5.4 26.4 6.6 26.4H18.4Z";
  return [
    F(cross, C.plum, { shade: ["M29.6 37.6H41.4C42.6 37.6 43.2 37 43.2 35.6V33.6H29.6Z", "M29.6 37.6V49.4C29.6 50.6 29 51.2 27.6 51.2H25.6V37.6Z"], sh: darken(C.plum, .32),
      inner: '<path d="M24 16.4L27.2 21H20.8Z M24 47.6L27.2 43H20.8Z M8.4 32L13 28.8V35.2Z M39.6 32L35 28.8V35.2Z" fill="#fff" ' + RJ + ' stroke="#fff" stroke-width="1"/>' +
        '<circle cx="24" cy="32" r="3.4" fill="' + darken(C.plum, .2) + '"/>', hi: ["M7.6 28.6H16", "M20.6 15V22.6"] }),
    F(blob(50, 40.6, 4.6, 4.6, .15, 91, 10), C.red, { shade: crescent(50, 40.6, 4.4, -20, 130, 1.3), sh: darken(C.red, .25), hi: arc(50, 40.6, 2.8, 200, 250) }),
    F(blob(53.4, 28.6, 4.6, 4.6, .15, 92, 10), C.red, { shade: crescent(53.4, 28.6, 4.4, -20, 130, 1.3), sh: darken(C.red, .25), hi: arc(53.4, 28.6, 2.8, 200, 250) })
  ];
};
/* Floss Boss: a floss spool with a strand coming out */
S["floss"] = () => [
  T("M36.8 15.6 C38.4 8.4 46.6 5.4 51.4 9 C55.4 12 53.6 18.6 48.4 17.6", 1.4, "#fff", { edge: 2.4 }),
  F("M18.4 26.2H45.6C47.8 26.2 49 27.4 49 29.6V52C49 55 47.2 57 44.2 57H19.8C16.8 57 15 55 15 52V29.6C15 27.4 16.2 26.2 18.4 26.2Z", C.paper,
    { shade: "M43.4 26.4H45.6C47.6 26.4 48.8 27.6 48.8 29.6V52C48.8 54.8 47 56.8 44.2 56.8H40C43 55.4 43.6 53 43.6 50V26.4Z", sh: C.paperShade,
      inner: fill("M15.2 37.6C21 35.6 26 39.6 32 37.6 38 35.6 43 39.6 48.8 37.6V45.6C43 47.6 38 43.6 32 45.6 26 47.6 21 43.6 15.2 45.6Z", C.green) +
        line("M15.2 37.6C21 35.6 26 39.6 32 37.6 38 35.6 43 39.6 48.8 37.6M15.2 45.6C21 43.6 26 47.6 32 45.6 38 43.6 43 47.6 48.8 45.6", 1.5), hi: "M19.4 30.6V34" }),
  F("M17.4 15.4C17.4 14 18.4 13.2 19.8 13.2H44.2C45.6 13.2 46.6 14 46.6 15.4V26.2H17.4Z", C.green,
    { shade: "M41 13.4H44.2C45.6 13.4 46.4 14.2 46.4 15.4V26H41Z", sh: darken(C.green, .25), hi: "M21.4 17V21.4" }),
  F("M33 12.6H40.6V15.2H33Z", C.metal, { w: 1.6 })
];
/* Office Hours: a speech bubble wearing a mortarboard */
S["prof"] = () => [
  F("M11.4 30.4C11.4 24.6 15 21.6 20.6 21.6H46C51.4 21.6 54.6 24.6 54.6 30V42.4C54.6 47.8 51.4 50.8 46 50.8H28.6L17.4 57.6L20 50.8H20.2C14.6 50.8 11.4 47.8 11.4 42.4Z", C.paper,
    { shade: "M49.6 22C52.8 23 54.4 25.8 54.4 30V42.4C54.4 47.6 51.4 50.6 46 50.6H41.6C47.6 49 49.8 46 49.8 40.6Z", sh: C.paperShade,
      inner: '<path d="M24.2 34.2C24.2 31.2 26.2 29.6 28.6 29.6 30.8 29.6 31.6 31.6 31 33.4 30.4 35.2 28.4 36 26.8 36.2 26.8 38 27.6 39.6 29.4 40.8 25.8 40.6 24.2 37.4 24.2 34.2Z M35 34.2C35 31.2 37 29.6 39.4 29.6 41.6 29.6 42.4 31.6 41.8 33.4 41.2 35.2 39.2 36 37.6 36.2 37.6 38 38.4 39.6 40.2 40.8 36.6 40.6 35 37.4 35 34.2Z" fill="' + INK + '"/>' }),
  F("M23.4 15.6V22.8C27.8 25.6 40.2 25.6 44.6 22.8V15.6Z", C.plum, { w: 2.2, shade: "M38.6 15.8H44.4V22.6C42.8 23.6 40.6 24.2 38.6 24.6Z", sh: darken(C.plum, .3) }),
  F("M16.6 13.6 L34 6.2 L51.4 13.6 L34 21Z", C.plum, { w: 2.2, shade: "M34 21L51.4 13.6L48 12.2L34 18Z", sh: darken(C.plum, .3), hi: "M21.4 13.2L32 8.6" }),
  L("M34 13.6 L47.4 16 V26.6", 1.6, C.gold),
  F("M45.6 26.2H49.2L50 31.6H44.8Z", C.gold, { w: 1.5 })
];
/* Through the Root Canal: a molar with its canals traced and filled */
S["rootcanal"] = () => {
  const s = .235, cx = 32, top = 10;
  return [
    F(tx(TOOTH, cx, top, s), C.enamel, { shade: tx(TOOTH_SHADE, cx, top, s), sh: C.enamelShade, hi: tx(TOOTH_HI, cx, top, s),
      inner: fill(tx("M78 98 C78 84 88 80 100 82 C112 80 122 84 122 98 C122 108 114 114 100 114 C86 114 78 108 78 98 Z", cx, top, s), C.gumLight) +
        line(tx("M86 108 C82 140 76 172 78 204 M114 108 C118 140 124 172 122 204", cx, top, s), 3.6) +
        line(tx("M86 108 C82 140 76 172 78 204 M114 108 C118 140 124 172 122 204", cx, top, s), 1.7, C.orange) +
        '<path d="' + tx("M78 98 C78 84 88 80 100 82 C112 80 122 84 122 98 C122 108 114 114 100 114 C86 114 78 108 78 98 Z", cx, top, s) + '" fill="none" stroke="' + INK + '" stroke-width="1.5"/>' })
  ];
};
/* Indirect Vision: a mouth mirror, with an upper molar seen in it (upside down, as a maxillary molar is) */
S["mirror"] = () => [
  T("M12.6 56 L31 35.8", 4.8, C.metal, { edge: 3 }),
  L("M15.4 50.6l2.6 2.4M18.4 47.4l2.6 2.4M21.4 44.2l2.6 2.4", 1.2, C.metalShade),
  T("M31 35.8 L36.2 29.6", 1.8, C.metal),
  F(blob(43, 21, 14, 14, .25, 101, 14), C.metal, { shade: crescent(43, 21, 13.6, -25, 145, 1.36), sh: C.metalShade, op: .55 }),
  F(blob(43, 21, 10.4, 10.4, .2, 102, 12), C.sky, { w: 1.6,
    inner: '<path d="' + tx(TOOTH, 43, 13.6, .08, true) + '" fill="' + C.enamel + '" stroke="' + INK + '" stroke-width="1.3" ' + RJ + "/>",
    hi: ["M36.4 17.6C37.4 15 39.4 13.2 41.6 12.4", "M47.2 28.4C48.6 27.6 49.8 26.4 50.6 25"] })
];
/* Full Arch: sixteen teeth around one arch (top view), molars broad, incisors narrow */
S["fullarch"] = () => {
  let teeth = "";
  const K = 16, cx = 32, cy = 52.4, rx = 17.4, ry = 34;
  for (let i = 0; i < K; i++){
    const a = 180 + (i + .5) * 180 / K, x = cx + Math.cos(rad(a)) * rx, y = cy + Math.sin(rad(a)) * ry;
    const edge = Math.min(i, K - 1 - i), w = edge < 3 ? 3.1 : edge < 5 ? 2.6 : 2.2, h = edge < 3 ? 2.7 : edge < 5 ? 2.2 : 1.7;
    const tan = Math.atan2(Math.cos(rad(a)) * ry, -Math.sin(rad(a)) * rx) * 180 / Math.PI;
    teeth += '<path d="' + blob(x, y, w, h, .1, 110 + i, 8, tan + 90) + '" fill="' + C.enamel + '" stroke="' + INK + '" stroke-width="1.3"/>';
  }
  const gum = "M9.6 52.6 A22.4 39.6 0 0 1 54.4 52.6 L45 52.6 A13 29 0 0 0 19 52.6 Z";
  return [F(gum, C.gum, { shade: "M19 52.6A13 29 0 0 1 45 52.6L47.4 52.6A15.4 31.6 0 0 0 16.6 52.6Z", sh: C.gumShade, op: .75, inner: teeth, hi: "M12.8 42C13.6 32 17 24 22.2 19" })];
};
/* Floss Chain: three linked floss loops, each passing over one neighbor and under the other */
S["flosschain"] = () => {
  const RG = [[18.6, 33, C.green], [32, 31, C.blue], [45.4, 33, C.pink]], rx = 11.2, ry = 10;
  const ring = (c) => ellArc(c[0], c[1], rx, ry, 0, 360, 6) + "Z";
  /* the angles on ring A where it crosses ring B */
  const cross = (A, B) => {
    const f = (t) => ((A[0] + Math.cos(rad(t)) * rx - B[0]) / rx) ** 2 + ((A[1] + Math.sin(rad(t)) * ry - B[1]) / ry) ** 2 - 1, out = [];
    for (let t = 0; t < 360; t += .25) if (Math.sign(f(t)) !== Math.sign(f(t + .25))) out.push(t + .125);
    return out;
  };
  const top = (ts, A) => ts.reduce((m, t) => (Math.sin(rad(t)) < Math.sin(rad(m)) ? t : m));
  const bottom = (ts) => ts.reduce((m, t) => (Math.sin(rad(t)) > Math.sin(rad(m)) ? t : m));
  const over = (c, t) => { const d = ellArc(c[0], c[1], rx, ry, t - 15, t + 15, 2);
    return R('<path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="5.6" stroke-linecap="butt"/><path d="' + d + '" fill="none" stroke="' + c[2] + '" stroke-width="2.8" stroke-linecap="butt"/>'); };
  const t12 = top(cross(RG[0], RG[1])), t23 = bottom(cross(RG[1], RG[2]));
  return [...RG.map((c) => T(ring(c), 2.8, c[2], { edge: 2.8 })), over(RG[0], t12), over(RG[1], t23),
    R(RG.map((c) => hi(ellArc(c[0], c[1], rx - 2.4, ry - 2.4, 196, 236, 5), 1.6, .7)).join(""))];
};
/* Restorative: a molar with an occlusal filling */
S["cavity"] = () => {
  const s = .225, cx = 31, top = 12;
  const fillPath = tx("M76 50 C86 60 114 60 124 50 C126 66 114 76 100 76 C86 76 74 66 76 50 Z", cx, top, s);
  return [
    F(tx(TOOTH, cx, top, s), C.enamel, { shade: tx(TOOTH_SHADE, cx, top, s), sh: C.enamelShade, hi: tx(TOOTH_HI, cx, top, s),
      inner: '<path d="' + fillPath + '" fill="' + C.metal + '" stroke="' + INK + '" stroke-width="1.5" ' + RJ + "/>" + hi(tx("M86 60 C90 64 96 66 102 66", cx, top, s), 1.6, .9) }),
    F(sparkle(50.4, 14.4, 5.6), C.gold, { w: 1.5 }), F(sparkle(52.8, 32, 3.2), C.goldLight, { w: 1.3 })
  ];
};
/* Holiday Spirit: a wrapped present */
S["holiday"] = () => [
  F("M32 22.4 C26.6 12 15.4 12.6 18.6 19.6 C20.4 23.4 26.6 23.8 32 22.4Z", C.gold, { w: 2, shade: "M32 22.4C28 19 22.6 18.4 20.6 20.6 22.8 23 27.4 23.4 32 22.4Z", sh: C.goldShade, op: .5 }),
  F("M32 22.4 C37.4 12 48.6 12.6 45.4 19.6 C43.6 23.4 37.4 23.8 32 22.4Z", C.gold, { w: 2, shade: "M32 22.4C36 19 41.4 18.4 43.4 20.6 41.2 23 36.6 23.4 32 22.4Z", sh: C.goldShade, op: .5 }),
  F("M13.6 32.6H50.4V53.2C50.4 55.4 49.2 56.6 47 56.6H17C14.8 56.6 13.6 55.4 13.6 53.2Z", C.red,
    { shade: "M43.6 32.8H50.2V53.2C50.2 55.2 49 56.4 47 56.4H43.6Z", sh: darken(C.red, .25), inner: fill("M28.8 32.8H35.2V56.4H28.8Z", C.gold) + line("M28.8 32.8V56.4M35.2 32.8V56.4", 1.5) }),
  F("M12.4 25.6C12.4 23.6 13.6 22.4 15.6 22.4H48.4C50.4 22.4 51.6 23.6 51.6 25.6V32.6H12.4Z", C.red,
    { shade: "M45 22.6H48.4C50.4 22.6 51.4 23.8 51.4 25.6V32.4H45Z", sh: darken(C.red, .25), inner: fill("M28.6 22.6H35.4V32.4H28.6Z", C.gold) + line("M28.6 22.6V32.4M35.4 22.6V32.4", 1.5), hi: "M16 26.4H23" }),
  F(blob(32, 22.4, 3.4, 2.8, .1, 121, 8), C.gold, { w: 1.8 })
];
/* Pearly Whites: a sparkling tooth */
S["pet-perfect"] = () => {
  const s = .205, cx = 30.4, top = 11.6;
  return [
    F(tx(TOOTH, cx, top, s), C.enamel, { shade: tx(TOOTH_SHADE, cx, top, s), sh: C.enamelShade, hi: [tx(TOOTH_HI, cx, top, s), tx("M66 98 L66 104", cx, top, s)],
      inner: line(tx("M74 86 Q82 78 90 86 M110 86 Q118 78 126 86 M86 104 Q100 120 114 104", cx, top, s), 1.7) +
        fill(blob(cx + (66 - 100) * s, top + (102 - 34) * s, 1.4, 1, .05, 141, 8) + blob(cx + (134 - 100) * s, top + (102 - 34) * s, 1.4, 1, .05, 142, 8), C.gumLight) }),
    F(sparkle(49.4, 13.4, 7.2), C.gold, { w: 1.6 }), F(sparkle(13.6, 20.6, 4.6), C.goldLight, { w: 1.4 }), F(sparkle(51, 38.6, 3.8), C.gold, { w: 1.3 })
  ];
};
/* Full Recovery: a tooth with a bandage and a heart */
S["pet-revive"] = () => {
  const s = .205, cx = 27.6, top = 11.4;
  const band = blob(32.6, 21.6, 10.4, 3.6, .1, 131, 10, 38);
  return [
    F(tx(TOOTH, cx, top, s), C.enamel, { shade: tx(TOOTH_SHADE, cx, top, s), sh: C.enamelShade, hi: tx(TOOTH_HI, cx, top, s),
      inner: line(tx("M74 90 Q82 84 90 90 M110 90 Q118 84 126 90 M88 110 Q100 118 112 110", cx, top, s), 1.6) }),
    F(band, C.bronzeLight, { w: 1.8, inner: fill(blob(32.6, 21.6, 3.6, 2.6, .05, 132, 8, 38), "#F7DCC0") +
      '<g fill="' + C.bronze + '"><circle cx="27.4" cy="17.4" r=".7"/><circle cx="29" cy="19.6" r=".7"/><circle cx="37.6" cy="24.2" r=".7"/><circle cx="36" cy="26.2" r=".7"/></g>' }),
    F("M48.6 55.6 C42 51 38.6 46.8 38.6 43.2 C38.6 40.2 40.8 38.4 43.4 38.4 C45.6 38.4 47.2 39.6 48.6 41.6 C50 39.6 51.6 38.4 53.8 38.4 C56.4 38.4 58.4 40.2 58.4 43.2 C58.4 46.8 55.2 51 48.6 55.6Z", C.red,
      { w: 2.2, shade: "M55.6 39C57.6 39.8 58.2 41.4 58.2 43.2 58.2 46.6 55 50.8 48.6 55.4 52.6 51.6 55.2 47.4 55.6 39Z", sh: darken(C.red, .25), hi: "M41.6 42.4C41.8 41.4 42.4 40.8 43.2 40.6" })
  ];
};
/* Seen It All: an open eye */
S["seen-all"] = () => {
  let lashes = "";
  [[-150, 1], [-125, 1], [-90, 1], [-55, 1], [-30, 1]].forEach(([a]) => {
    const p = [32 + Math.cos(rad(a)) * 24.6, 33.6 + Math.sin(rad(a)) * 19.6], q = [32 + Math.cos(rad(a)) * 29.6, 33.6 + Math.sin(rad(a)) * 24];
    lashes += "M" + P(p[0], p[1]) + "L" + P(q[0], q[1]);
  });
  return [
    L(lashes, 2.2),
    F("M6.4 33.6 C13.6 20.4 22.6 15.6 32 15.6 C41.4 15.6 50.4 20.4 57.6 33.6 C50.4 46.8 41.4 51.6 32 51.6 C22.6 51.6 13.6 46.8 6.4 33.6Z", C.paper,
      { shade: "M10.4 38C17.4 46.6 24.4 50 32 50 39.6 50 46.6 46.6 53.6 38 46.6 47.6 39.6 51.4 32 51.4 24.4 51.4 17.4 47.6 10.4 38Z", sh: C.paperShade,
        inner: '<circle cx="32" cy="33.6" r="11.4" fill="' + C.blue + '" stroke="' + INK + '" stroke-width="1.6"/>' +
          fill(crescent(32, 33.6, 11, -10, 130, 1.3), darken(C.blue, .25), .6) +
          '<circle cx="32" cy="33.6" r="5" fill="' + INK + '"/><circle cx="35.4" cy="29.8" r="2.2" fill="#fff"/><circle cx="28.6" cy="37.6" r="1" fill="#fff" opacity=".8"/>' })
  ];
};
/* Perfect Mock: a gold stopwatch, full circle, wearing a crown */
S["mock-perfect"] = () => {
  const parts = stopwatch(C.gold, C.goldShade, 1, 0);
  parts.splice(1, 1, F("M23 16.6 L21.4 6.4 L27 10.6 L32 3.6 L37 10.6 L42.6 6.4 L41 16.6 C35 18 29 18 23 16.6Z", C.gold,
    { w: 2.2, shade: "M32 3.6L37 10.6L42.6 6.4L41 16.6C38.4 17.2 35.4 17.6 32.6 17.6Z", sh: C.goldShade, op: .45,
      inner: '<circle cx="32" cy="12.4" r="1.7" fill="' + C.red + '" stroke="' + INK + '" stroke-width="1.1"/>' }));
  return parts;
};

const KEYS = ["answers-100", "answers-1000", "days-7", "days-30", "run-25", "run-100", "mock90", "arcade-25", "golden", "fairy", "fairy-5", "boss",
  "owl", "konami", "floss", "prof", "rootcanal", "mirror", "fullarch", "flosschain", "cavity", "holiday", "pet-perfect", "pet-revive", "seen-all", "mock-perfect"];
export const TROPHIES = {};
const PARTS = {};
KEYS.forEach((k) => { PARTS[k] = S[k](); TROPHIES[k] = { body: body(PARTS[k]) }; });
export function silhouette(key){ return PARTS[key] ? sil(PARTS[key]) : ""; }

/* ---------------- the journey trophies (redesign phase 4, part A): one for each equipment journey finished, its
   object with a gold star. The server gives them as journey-0, journey-1 and journey-2 (migration_v54). They are not
   in widget/ranks.js's live list, so they have their own export; their names are in journeys.mjs. ---------------- */
const DONE = (cx, cy) => F(star(cx, cy, 8.6, 3.9), C.gold, { w: 1.9, shade: "M" + P(cx, cy - 8.6) + "L" + P(cx + 2.4, cy - 2.9) + "L" + P(cx + 8.2, cy - 2.6) + "L" + P(cx + 3.7, cy + 1.4) + "L" + P(cx + 5.1, cy + 7) + "L" + P(cx, cy + 3.9) + "Z", sh: C.goldShade, op: .4 });
const J = {};
/* the Handpiece: a contra-angle high-speed handpiece, head down and to the left, bur in its head */
J["journey-0"] = () => [
  L("M16.4 46.6 L19.2 54.6", 2.6),
  F("M49.2 10.6 L55.4 5.4 C57 4 59.2 4.4 60.2 6 C61.2 7.6 60.8 9.4 59.4 10.6 L53.2 15.8Z", C.metalShade, { w: 2.2 }),
  F("M24.4 31.4 L47.4 12 C49.4 10.4 52.2 10.8 53.8 12.8 C55.4 14.8 55 17.6 53 19.2 L30.4 38.8Z", C.metal,
    { shade: "M27.8 35.6L51 16.4C52.6 15 53.6 13.6 53.8 12.8C55.4 14.8 55 17.6 53 19.2L30.4 38.8Z", sh: C.metalShade, op: .5, hi: "M29 30.4L44.6 17.2",
      inner: line("M33.8 26.6L37.6 31.4M36.6 24.2L40.4 29M39.4 21.8L43.2 26.6", 1.5) }),
  F("M24.4 31.4 L30.4 38.8 C27 41 23.6 42.6 20 43.6 L17 39.6 C19 36.6 21.4 33.8 24.4 31.4Z", C.metal, { w: 2.2, shade: "M27.6 35.4L30.4 38.8C27 41 23.6 42.6 20 43.6L18.6 41.8C22 40.2 25 38 27.6 35.4Z", sh: C.metalShade, op: .5 }),
  F("M9.6 39.4 C8.4 37.4 9 35 11 33.8 L14.6 31.6 C16.6 30.4 19 31 20.2 33 L23.6 38.6 C24.8 40.6 24.2 43 22.2 44.2 L18.6 46.4 C16.6 47.6 14.2 47 13 45Z", C.metalLight,
    { shade: "M17.4 31.6C18.6 31.6 19.6 32.2 20.2 33L23.6 38.6C24.8 40.6 24.2 43 22.2 44.2L18.6 46.4C17.6 47 16.6 47.2 15.6 47C19.4 43.6 20.6 37.6 17.4 31.6Z", sh: C.metalShade, op: .45 }),
  DONE(46, 44)
];
/* the ModuPro: a typodont from the side, jaws a little open on the hinge at the back */
J["journey-1"] = () => {
  const up = "M10 25.4 H46 V29.4 C46 31.8 44.4 32.6 43 31.4 L41.5 30 L40 31.4 C38.6 32.6 37 31.8 37 29.4 C37 31.8 35.4 32.6 34 31.4 L32.5 30 L31 31.4 C29.6 32.6 28 31.8 28 29.4 V30.2 C28 32.8 23.6 32.8 23.6 30.2 V31 C23.6 33.6 19.4 33.6 19.4 31 V31.6 L17 35.6 L14.6 31.6 V32.2 C14.6 35 10.6 35 10.4 32.2Z";
  const lo = "M11.4 49.4 H46 V45.4 C46 43 44.4 42.2 43 43.4 L41.5 44.8 L40 43.4 C38.6 42.2 37 43 37 45.4 C37 43 35.4 42.2 34 43.4 L32.5 44.8 L31 43.4 C29.6 42.2 28 43 28 45.4 V44.6 C28 42 23.6 42 23.6 44.6 V43.8 C23.6 41.2 19.6 41.2 19.6 43.8 L17.6 39.6 L15.6 43.8 V43 C15.6 40.6 11.8 40.6 11.6 43Z";
  return [
    F("M46.6 13 H52.4 C53.6 13 54.4 13.8 54.4 15 V55 C54.4 56.2 53.6 57 52.4 57 H46.6Z", C.metalShade, { w: 2.2 }),
    F("M22 7.4 H32 V13 H22Z", C.metalShade, { w: 2 }),
    F("M8.6 12.4 H48 C49.4 12.4 50 13.2 50 14.4 V16.4 C50 17.6 49.4 18.4 48 18.4 H8.6 C7.2 18.4 6.6 17.6 6.6 16.4 V14.4 C6.6 13.2 7.2 12.4 8.6 12.4Z", C.metal, { w: 2.2, hi: "M10.6 14.4H30" }),
    F("M9 18.4 H47 V26 H10.4 C8.6 23.6 8.4 21 9 18.4Z", C.gum, { w: 2.2, shade: "M9.4 23.4H47V26H10.4C9.8 25.2 9.6 24.4 9.4 23.4Z", sh: C.gumShade, op: .6 }),
    F(up, C.enamel, { w: 1.9 }),
    F(lo, C.enamel, { w: 1.9 }),
    F("M10.4 49 H47 V56 H10.2 C9 53.6 9.2 51.2 10.4 49Z", C.gum, { w: 2.2, shade: "M9.8 53.4H47V56H10.2C9.8 55.2 9.8 54.4 9.8 53.4Z", sh: C.gumShade, op: .6 }),
    F("M8.6 56 H48 C49.4 56 50 56.8 50 58 V59.4 C50 60.6 49.4 61.4 48 61.4 H8.6 C7.2 61.4 6.6 60.6 6.6 59.4 V58 C6.6 56.8 7.2 56 8.6 56Z", C.metal, { w: 2.2 }),
    F(blob(50.6, 37.4, 5.4, 5.4, .2, 31, 10), C.metalLight, { w: 2.2, inner: '<circle cx="50.6" cy="37.4" r="1.6" fill="' + INK + '"/>' }),
    DONE(54, 14)
  ];
};
/* the Loupes: through-the-lens loupes from the front, two telescopes low in the lenses */
J["journey-2"] = () => {
  const lens = (m) => m ? "M60 22.6 H34.6 C33.4 33.6 36.4 44.4 44.6 46 C53.4 47.4 59.8 40.4 60 22.6Z" : "M4 22.6 H29.4 C30.6 33.6 27.6 44.4 19.4 46 C10.6 47.4 4.2 40.4 4 22.6Z";
  const scope = (cx) => [
    F(blob(cx, 37.6, 8.8, 8.8, .2, cx, 12), C.plum, { w: 2.2, shade: crescent(cx, 37.6, 8.5, -30, 150, 1.36), sh: INK, op: .35 }),
    F(blob(cx, 37.6, 5.6, 5.6, .15, cx + 3, 10), "#22303F", { w: 1.6, hi: arc(cx, 37.6, 3.6, 200, 262) })
  ];
  return [
    F(lens(0), C.sky, { w: 2.4, shade: "M4 22.6H29.4C29.8 26 29.8 29.4 29.2 32.6C22 31.6 12 30.6 4.6 29.6C4.2 27.4 4 25 4 22.6Z", sh: "#fff", op: .5 }),
    F(lens(1), C.sky, { w: 2.4, shade: "M60 22.6H34.6C34.2 26 34.2 29.4 34.8 32.6C42 31.6 52 30.6 59.4 29.6C59.8 27.4 60 25 60 22.6Z", sh: "#fff", op: .5 }),
    F("M2.6 18.6 C12 16.2 24 16.6 32 19.6 C40 16.6 52 16.2 61.4 18.6 V24 C52 21.8 40 22.2 32 25.2 C24 22.2 12 21.8 2.6 24Z", C.plum, { w: 2.3, hi: "M6.6 19.8C12 18.8 18 18.6 23 19.2" }),
    F("M27.4 9 H36.6 C37.8 9 38.4 9.6 38.4 10.8 V15.4 C38.4 16.6 37.8 17.2 36.6 17.2 H27.4 C26.2 17.2 25.6 16.6 25.6 15.4 V10.8 C25.6 9.6 26.2 9 27.4 9Z", C.plum, { w: 2, inner: '<circle cx="32" cy="13.1" r="2.5" fill="' + C.yellow + '" stroke="' + INK + '" stroke-width="1.3"/>' }),
    ...scope(20.4), ...scope(43.6),
    DONE(52, 52)
  ];
};
export const JOURNEY_TROPHIES = {};
Object.keys(J).forEach((k) => { const parts = J[k](); JOURNEY_TROPHIES[k] = { body: body(parts), sil: sil(parts) }; });

