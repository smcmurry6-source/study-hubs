// Fig: testosterone's two fates (L18 Estrogens and Androgens, Dr. Fasinu: "Where the sex hormones come from", his
// Case 2, the 5-alpha-reductase inhibitors, the aromatase inhibitors and the man without aromatase). His slide's extract
// of the pathway drawn as real skeletal formulas: cholesterol, in several steps, to DHEA, androstenedione and
// testosterone; then the fork: 5-alpha-reductase reduces ring A (DHT, the active androgen) and aromatase aromatizes it
// (estradiol; androstenedione to estrone), with estrone, estradiol and estriol below. The drugs sit on their arrows as
// stops. Pick a drug (or no aromatase at all): its enzyme stops, the flow piles up at the stop, the product fades, and
// four small tissues show what follows (the prostate and the scalp for DHT; ER-positive breast cancer cells for
// estradiol; a long bone's growth plate for both). Formulas follow the PubChem records; the tissues are schematic.
import { makeFig, f1, T, L, HOT } from "./shared.mjs";

const W = 460, H = 652, B = 9;

/* ---------- skeletal formulas (build time) ---------- */
/* the steroid nucleus in bond lengths, y down; rings A, B, C six-membered, D five-membered, drawn in the usual way */
const P = { 1: [0, -1], 2: [-0.866, -0.5], 3: [-0.866, 0.5], 4: [0, 1], 5: [0.866, 0.5], 10: [0.866, -0.5], 6: [1.732, 1], 7: [2.598, 0.5], 8: [2.598, -0.5], 9: [1.732, -1],
  11: [1.732, -2], 12: [2.598, -2.5], 13: [3.464, -2], 14: [3.464, -1], 15: [4.415, -0.691], 16: [5.003, -1.5], 17: [4.415, -2.309] };
const RC = { A: [0, 0], B: [1.732, 0], C: [2.598, -1.5], D: [4.152, -1.5] };
const CORE = [[1, 2], [2, 3], [3, 4], [4, 5], [5, 10], [10, 1], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [9, 11], [11, 12], [12, 13], [13, 14], [14, 8], [14, 15], [15, 16], [16, 17], [17, 13]];
/* the molecules (PubChem records: cholesterol 5997, DHEA 5881, androstenedione 6128, testosterone 6013, DHT 10635,
   estrone 5870, estradiol 5757, estriol 5756) */
const MOL = {
  chol: { dbl: [[5, 6, "B"]], c19: 1, s3: "OH", s17: "chain" },
  dhea: { dbl: [[5, 6, "B"]], c19: 1, s3: "OH", s17: "O" },
  adione: { dbl: [[4, 5, "A"]], c19: 1, s3: "O", s17: "O" },
  testo: { dbl: [[4, 5, "A"]], c19: 1, s3: "O", s17: "OH" },
  dht: { dbl: [], c19: 1, s3: "O", s17: "OH", h5: 1 },
  e1: { dbl: [[1, 2, "A"], [3, 4, "A"], [5, 10, "A"]], arom: 1, s3: "OH", s17: "O" },
  e2: { dbl: [[1, 2, "A"], [3, 4, "A"], [5, 10, "A"]], arom: 1, s3: "OH", s17: "OH" },
  e3: { dbl: [[1, 2, "A"], [3, 4, "A"], [5, 10, "A"]], arom: 1, s3: "OH", s17: "OH", s16: 1 },
};
function molSvg(m, cx, cy, ring) {
  const ox = cx - 15, oy = cy + 10, q = (p) => [ox + p[0] * B, oy + p[1] * B];
  const ln = (a, b, cls) => '<path class="' + (cls || "tt-bd") + '" d="M' + f1(a[0]) + " " + f1(a[1]) + "L" + f1(b[0]) + " " + f1(b[1]) + '"/>';
  const cut = (a, b, k) => { const d = [b[0] - a[0], b[1] - a[1]], n = Math.hypot(d[0], d[1]); return [b[0] - d[0] / n * k, b[1] - d[1] / n * k]; };
  let o = "";
  /* ring A tinted: it is the ring each enzyme changes */
  if (ring) o += '<path class="tt-ra ' + ring + '" d="M' + [1, 2, 3, 4, 5, 10].map((k) => q(P[k]).map(f1).join(" ")).join("L") + 'Z"/>';
  CORE.forEach((e) => { o += ln(q(P[e[0]]), q(P[e[1]])); });
  m.dbl.forEach((e) => {
    const a = P[e[0]], b = P[e[1]], c = RC[e[2]], mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], v = [c[0] - mid[0], c[1] - mid[1]], n = Math.hypot(v[0], v[1]), off = [v[0] / n * 0.19, v[1] / n * 0.19];
    const a2 = [a[0] + off[0] + (b[0] - a[0]) * 0.17, a[1] + off[1] + (b[1] - a[1]) * 0.17], b2 = [b[0] + off[0] - (b[0] - a[0]) * 0.17, b[1] + off[1] - (b[1] - a[1]) * 0.17];
    o += ln(q(a2), q(b2));
  });
  if (m.c19) o += ln(q(P[10]), q([0.866, -1.5]));
  o += ln(q(P[13]), q([3.464, -3.0]));
  /* ring A's 3-position: a ketone or a hydroxyl, down and to the left */
  const o3 = [-1.732, 1.0], O3 = q(o3), C3 = q(P[3]);
  if (m.s3 === "O") {
    const e = cut(C3, O3, 5.2), nx = -0.5 * 1.25, ny = -0.866 * 1.25;
    o += ln([C3[0] + nx, C3[1] + ny], [e[0] + nx, e[1] + ny]) + ln([C3[0] - nx, C3[1] - ny], [e[0] - nx, e[1] - ny]);
    o += '<text class="tt-at" x="' + f1(O3[0]) + '" y="' + f1(O3[1] + 3.9) + '" text-anchor="middle">O</text>';
  } else {
    o += ln(C3, cut(C3, O3, 5.2)) + '<text class="tt-at" x="' + f1(O3[0] + 3.4) + '" y="' + f1(O3[1] + 3.9) + '" text-anchor="end">HO</text>';
  }
  /* the 17-position: a ketone, a 17-beta hydroxyl (wedge), or cholesterol's side chain */
  const C17 = q(P[17]), e17 = q([4.724, -3.26]);
  if (m.s17 === "O") {
    const e = cut(C17, e17, 5.2), nx = 0.951 * 1.25, ny = 0.309 * 1.25;
    o += ln([C17[0] + nx, C17[1] + ny], [e[0] + nx, e[1] + ny]) + ln([C17[0] - nx, C17[1] - ny], [e[0] - nx, e[1] - ny]);
    o += '<text class="tt-at" x="' + f1(e17[0]) + '" y="' + f1(e17[1] + 3.9) + '" text-anchor="middle">O</text>';
  } else if (m.s17 === "OH") {
    const e = cut(C17, e17, 5.4), nx = 0.951 * 1.7, ny = 0.309 * 1.7;
    o += '<path class="tt-wg" d="M' + f1(C17[0]) + " " + f1(C17[1]) + "L" + f1(e[0] + nx) + " " + f1(e[1] + ny) + "L" + f1(e[0] - nx) + " " + f1(e[1] - ny) + 'Z"/>';
    o += '<text class="tt-at" x="' + f1(e17[0] - 3.4) + '" y="' + f1(e17[1] + 3.9) + '" text-anchor="start">OH</text>';
  } else {
    const ch = [[4.724, -3.26], [5.59, -2.76], [6.456, -3.26], [7.322, -2.76], [8.188, -3.26], [9.054, -2.76]];
    o += ln(C17, q(ch[0]));
    for (let i = 1; i < ch.length; i++) o += ln(q(ch[i - 1]), q(ch[i]));
    o += ln(q(ch[0]), q([4.224, -4.126])) + ln(q(ch[4]), q([8.188, -4.26]));
  }
  /* estriol's 16-alpha hydroxyl, hashed */
  if (m.s16) {
    const a = q(P[16]), e = q([5.95, -1.5]);
    for (let k = 1; k <= 5; k++) { const x = a[0] + (e[0] - a[0]) * k / 6, h = 0.4 + k * 0.38; o += '<path class="tt-bd tt-hs" d="M' + f1(x) + " " + f1(a[1] - h) + "V" + f1(a[1] + h) + '"/>'; }
    o += '<text class="tt-at" x="' + f1(e[0] + 1) + '" y="' + f1(e[1] + 3.9) + '" text-anchor="start">OH</text>';
  }
  /* DHT's 5-alpha hydrogen, hashed: the hydrogen 5-alpha-reductase added */
  if (m.h5) {
    const a = q(P[5]), e = q([0.866, 1.32]);
    for (let k = 1; k <= 4; k++) { const y = a[1] + (e[1] - a[1]) * k / 5, h = 0.4 + k * 0.42; o += '<path class="tt-bd tt-hs" d="M' + f1(a[0] - h) + " " + f1(y) + "H" + f1(a[0] + h) + '"/>'; }
    o += '<text class="tt-at tt-h" x="' + f1(e[0]) + '" y="' + f1(e[1] + 8.4) + '" text-anchor="middle">H</text>';
  }
  return o;
}

/* ---------- layout ---------- */
const CL = 80, CM = 228, CR = 394, R0 = 66, R1 = 190, R2 = 318, R3 = 430;
const POS = { chol: [62, R0 + 6], dhea: [CM, R0], adione: [CL, R1], testo: [CM, R1], dht: [CR, R1], e1: [CL, R2], e2: [CM, R2], e3: [128, R3] };
const RING = { testo: "tt-raT", dht: "tt-raD", e2: "tt-raE", e1: "tt-raE", e3: "tt-raE", adione: "tt-raT" };
const MS = {}; for (const k in MOL) MS[k] = molSvg(MOL[k], POS[k][0], POS[k][1], RING[k]);

/* reaction arrows: [x1, y1, x2, y2] */
const AR = {
  chol: [136, R0 + 4, 182, R0 + 4],
  dhea: [212, R0 + 48, 120, R1 - 30],
  ad2t: [116, R1 + 4, 186, R1 + 4],
  t2d: [268, R1 + 6, 352, R1 + 6],
  ad2e1: [CL, R1 + 48, CL, R2 - 30],
  t2e2: [CM, R1 + 48, CM, R2 - 30],
  e12: [116, R2 + 4, 186, R2 + 4],
  e1e3: [90, R2 + 50, 108, R3 - 14],
  e2e3: [210, R2 + 50, 186, R3 - 24],
};

/* ---------- the four tissues (build time, one picture per state) ---------- */
function vgFrame(x, y, w, h, title, chip, chipCls) {
  var cw = chip.length * 5.9 + 14;
  return '<rect class="tt-vg" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="10"/>' + T(x + 8, y + 16, title, "tt-vt", "start") +
    '<rect class="tt-chip ' + chipCls + '" x="' + f1(x + w - 6 - cw) + '" y="' + (y + 5) + '" width="' + f1(cw) + '" height="17" rx="8.5"/>' + T(x + w - 6 - cw / 2, y + 17.5, chip, "tt-cht", "middle");
}
/* the prostate under the bladder, the urethra through it; s = its size (1 enlarged, BPH) */
function prostate(x, y, s) {
  const cx = x + 70, o = [], t = y + 30, b = y + 64;
  o.push('<path class="tt-blad" d="M' + (cx - 5) + " " + (b + 4) + "C" + (cx - 20) + " " + (b + 1) + " " + (cx - 34) + " " + (b - 6) + " " + (cx - 33) + " " + (b - 16) + "C" + (cx - 32) + " " + (t + 2) + " " + (cx - 16) + " " + t + " " + cx + " " + t + "C" + (cx + 16) + " " + t + " " + (cx + 32) + " " + (t + 2) + " " + (cx + 33) + " " + (b - 16) + "C" + (cx + 34) + " " + (b - 6) + " " + (cx + 20) + " " + (b + 1) + " " + (cx + 5) + " " + (b + 4) + 'Z"/>');
  o.push('<path class="tt-bladin" d="M' + (cx - 4) + " " + (b - 2) + "C" + (cx - 17) + " " + (b - 4) + " " + (cx - 27) + " " + (b - 9) + " " + (cx - 26) + " " + (b - 17) + "C" + (cx - 25) + " " + (t + 8) + " " + (cx - 13) + " " + (t + 6) + " " + cx + " " + (t + 6) + "C" + (cx + 13) + " " + (t + 6) + " " + (cx + 25) + " " + (t + 8) + " " + (cx + 26) + " " + (b - 17) + "C" + (cx + 27) + " " + (b - 9) + " " + (cx + 17) + " " + (b - 4) + " " + (cx + 4) + " " + (b - 2) + 'Z"/>');
  const outline = (k) => { const rx = 28 * k, ry = 23 * k, py = b + 2 + ry * 0.92, pts = []; for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2, r = 1 + 0.06 * Math.cos(2 * a) + 0.03 * Math.sin(5 * a + 0.7) - 0.08 * Math.max(0, -Math.sin(a)) * Math.exp(-Math.pow(Math.cos(a) / 0.25, 2)); pts.push([cx + rx * r * Math.cos(a), py + ry * r * Math.sin(a)]); } return "M" + pts.map((p) => f1(p[0]) + " " + f1(p[1])).join("L") + "Z"; };
  const rx = 28 * s, ry = 23 * s, py = b + 2 + ry * 0.92;
  if (s < 1) o.push('<path class="tt-ghostp" d="' + outline(1) + '"/>');
  o.push('<path class="tt-pro" d="' + outline(s) + '"/>');
  /* glands (acini) inside, around the urethra */
  const ac = [[-0.56, -0.2], [0.56, -0.2], [-0.36, 0.42], [0.36, 0.42], [-0.74, 0.22], [0.74, 0.22], [-0.3, -0.52], [0.3, -0.52]];
  ac.forEach((a, i) => { o.push('<ellipse class="tt-acin" cx="' + f1(cx + a[0] * rx) + '" cy="' + f1(py + a[1] * ry) + '" rx="' + f1(3.6 * s) + '" ry="' + f1(2.6 * s) + '" transform="rotate(' + (i % 2 ? 25 : -25) + " " + f1(cx + a[0] * rx) + " " + f1(py + a[1] * ry) + ')"/>'); });
  /* the urethra from the bladder neck down through the gland: pinched when the gland is large */
  const uw = s > 0.9 ? 1.1 : 2.8, u0 = b + 1, u1 = y + 132;
  o.push('<path class="tt-ureth" d="M' + f1(cx - 3) + " " + u0 + "L" + f1(cx - uw) + " " + f1(py - ry * 0.4) + "L" + f1(cx - uw) + " " + f1(py + ry * 0.5) + "L" + f1(cx - 3) + " " + u1 + "H" + f1(cx + 3) + "L" + f1(cx + uw) + " " + f1(py + ry * 0.5) + "L" + f1(cx + uw) + " " + f1(py - ry * 0.4) + "L" + f1(cx + 3) + " " + u0 + 'Z"/>');
  return o.join("");
}
/* scalp: skin, three follicles, the hair; big = 1 a full follicle, 0 a shrunken one (with the full one's outline dashed) */
function folPath(fx, sy, d, w) {
  return "M" + f1(fx - w / 2) + " " + (sy - 4) + "L" + f1(fx - w / 2 + 1) + " " + f1(sy + d - 4) + "C" + f1(fx - w) + " " + f1(sy + d) + " " + f1(fx - w * 0.7) + " " + f1(sy + d + w * 1.1) + " " + f1(fx) + " " + f1(sy + d + w * 1.1) + "C" + f1(fx + w * 0.7) + " " + f1(sy + d + w * 1.1) + " " + f1(fx + w) + " " + f1(sy + d) + " " + f1(fx + w / 2 - 1) + " " + f1(sy + d - 4) + "L" + f1(fx + w / 2) + " " + (sy - 4) + "Z";
}
function scalp(x, y, big) {
  const o = [], sy = y + 60;
  o.push('<rect class="tt-derm" x="' + (x + 8) + '" y="' + sy + '" width="124" height="68"/>');
  o.push('<rect class="tt-fatl" x="' + (x + 8) + '" y="' + (sy + 58) + '" width="124" height="10"/>');
  o.push('<rect class="tt-epi" x="' + (x + 8) + '" y="' + (sy - 5) + '" width="124" height="7"/>');
  [x + 34, x + 70, x + 106].forEach((fx, i) => {
    const D0 = 44 + i % 2 * 5, d = big ? D0 : 17 + i % 2 * 3, w = big ? 7 : 3.6, hw = big ? 2.3 : 0.9, hl = big ? 22 : 9, lean = (i - 1) * 3;
    if (!big) o.push('<path class="tt-ghostf" d="' + folPath(fx, sy, D0, 7) + '"/>');
    o.push('<path class="tt-fol" d="' + folPath(fx, sy, d, w) + '"/>');
    o.push('<ellipse class="tt-pap" cx="' + fx + '" cy="' + f1(sy + d + w * 0.55) + '" rx="' + f1(w * 0.32) + '" ry="' + f1(w * 0.36) + '"/>');
    o.push('<path class="tt-hair" stroke-width="' + f1(hw) + '" d="M' + fx + " " + f1(sy + d - 1) + "L" + fx + " " + (sy - 5) + "Q" + f1(fx + lean * 0.3) + " " + f1(sy - 5 - hl * 0.55) + " " + f1(fx + lean + (big ? 5 : 2)) + " " + f1(sy - 5 - hl) + '"/>');
  });
  return o.join("");
}
/* ER-positive breast cancer cells crowding a duct (many) or a duct with its lumen open again (few) */
function breast(x, y, many) {
  const o = [], cx = x + 70, cy = y + 82, R = 40;
  o.push('<circle class="tt-duct" cx="' + cx + '" cy="' + cy + '" r="' + (R + 3) + '"/>');
  o.push('<circle class="tt-lum" cx="' + cx + '" cy="' + cy + '" r="' + R + '"/>');
  const cells = [];
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; cells.push([cx + (R - 6) * Math.cos(a), cy + (R - 6) * Math.sin(a), 6.2]); }
  if (many) {
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + 0.3; cells.push([cx + (R - 18) * Math.cos(a), cy + (R - 18) * Math.sin(a), 6.4]); }
    for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + 0.9; cells.push([cx + 7 * Math.cos(a), cy + 7 * Math.sin(a), 6]); }
  }
  const div = many ? 16 : -1;
  cells.forEach((c, i) => {
    const r = many ? c[2] : c[2] * 0.85;
    if (i === div) { const a = Math.atan2(c[1] - cy, c[0] - cx) * 180 / Math.PI + 90; o.push('<g transform="rotate(' + f1(a) + " " + f1(c[0]) + " " + f1(c[1]) + ')"><ellipse class="tt-cell" cx="' + f1(c[0]) + '" cy="' + f1(c[1]) + '" rx="8.6" ry="5.6"/><path class="tt-mit" d="M' + f1(c[0] - 4.2) + " " + f1(c[1] - 2.6) + "V" + f1(c[1] + 2.6) + "M" + f1(c[0] + 4.2) + " " + f1(c[1] - 2.6) + "V" + f1(c[1] + 2.6) + '"/></g>'); return; }
    o.push('<circle class="tt-cell" cx="' + f1(c[0]) + '" cy="' + f1(c[1]) + '" r="' + f1(r) + '"/>');
    o.push('<circle class="tt-cnuc" cx="' + f1(c[0] + 0.6) + '" cy="' + f1(c[1] - 0.4) + '" r="' + f1(r * 0.45) + '"/>');
  });
  return o.join("");
}
/* trabecular bone as a lattice of struts on a jittered grid inside a region; sparse = osteoporotic */
function lattice(inside, x0, y0, x1, y1, step, keep, seed) {
  let r = seed, d = "";
  const rnd = () => { r = (r * 9301 + 49297) % 233280; return r / 233280; };
  const g = {};
  for (let gy = y0; gy <= y1; gy += step) for (let gx = x0; gx <= x1; gx += step) { const p = [gx + (rnd() - 0.5) * step * 0.6, gy + (rnd() - 0.5) * step * 0.6]; if (inside(p[0], p[1])) g[gx + "," + gy] = p; }
  for (const k in g) { const [gx, gy] = k.split(",").map(Number), a = g[k]; [[step, 0], [0, step], [step, step], [-step, step]].forEach((dd, i) => { const b = g[(gx + dd[0]) + "," + (gy + dd[1])]; if (b && (i < 2 || rnd() < 0.35) && rnd() < keep) d += "M" + f1(a[0]) + " " + f1(a[1]) + "L" + f1(b[0]) + " " + f1(b[1]); }); }
  return d;
}
/* a long bone's end, vertical: epiphysis, growth plate, shaft; open = the plate stays open, the shaft longer and weak */
function bone(x, y, open) {
  const o = [], cx = x + 58, top = y + 30, ep = top + 28, len = open ? 128 : 96, bot = ep + 10 + len, hw = 15, kw = 27;
  const half = (yy) => yy < ep + 4 ? kw : yy < ep + 40 ? hw + (kw - hw) * Math.pow(1 - (yy - ep - 4) / 36, 2) : hw;
  const out = "M" + f1(cx - hw) + " " + f1(bot) + "V" + f1(ep + 40) + "C" + f1(cx - hw) + " " + f1(ep + 22) + " " + f1(cx - kw) + " " + f1(ep + 16) + " " + f1(cx - kw) + " " + f1(ep + 4) +
    "V" + f1(ep - 6) + "C" + f1(cx - kw) + " " + f1(top - 6) + " " + f1(cx - 4) + " " + f1(top - 2) + " " + f1(cx) + " " + f1(top + 4) + "C" + f1(cx + 4) + " " + f1(top - 2) + " " + f1(cx + kw) + " " + f1(top - 6) + " " + f1(cx + kw) + " " + f1(ep - 6) +
    "V" + f1(ep + 4) + "C" + f1(cx + kw) + " " + f1(ep + 16) + " " + f1(cx + hw) + " " + f1(ep + 22) + " " + f1(cx + hw) + " " + f1(ep + 40) + "V" + f1(bot);
  o.push('<path class="tt-bone" d="' + out + 'Z"/>');
  /* the marrow cavity of the shaft, inside a cortex that thins when the bone is weak */
  const cw = open ? 12 : 8.5;
  o.push('<path class="tt-mar" d="M' + f1(cx - cw) + " " + f1(bot) + "V" + f1(ep + 54) + "Q" + f1(cx) + " " + f1(ep + 44) + " " + f1(cx + cw) + " " + f1(ep + 54) + "V" + f1(bot) + 'Z"/>');
  /* trabeculae in the epiphysis and the metaphysis: a dense lattice, or a sparse, thin one */
  const inE = (px, py) => py > top + 6 + Math.pow((px - cx) / kw, 2) * 2 && py < ep - 4 && Math.abs(px - cx) < kw - 4 - Math.max(0, (top + 12 - py)) * 0.8;
  const inM = (px, py) => py > ep + 4 && py < ep + 48 && Math.abs(px - cx) < half(py) - 4 && (py < ep + 40 || Math.abs(px - cx) > cw + 2);
  const step = open ? 8 : 5.2, keep = open ? 0.55 : 0.95;
  o.push('<path class="tt-trab' + (open ? " is-thin" : "") + '" d="' + lattice(inE, cx - kw, top, cx + kw, ep, step, keep, 11) + lattice(inM, cx - kw, ep + 2, cx + kw, ep + 50, step, keep, 29) + '"/>');
  /* the growth plate: a band of cartilage while open, a fine line once estradiol closes it */
  if (open) {
    o.push('<path class="tt-plate" d="M' + f1(cx - kw + 0.7) + " " + f1(ep - 3.5) + "H" + f1(cx + kw - 0.7) + "V" + f1(ep + 3.5) + "H" + f1(cx - kw + 0.7) + 'Z"/>');
    let ch = ""; for (let i = 0; i < 9; i++) { const xx = cx - 21 + i * 5.25; ch += '<circle class="tt-chon" cx="' + f1(xx) + '" cy="' + f1(ep - 1.4) + '" r="1.2"/><circle class="tt-chon" cx="' + f1(xx) + '" cy="' + f1(ep + 1.6) + '" r="1.2"/>'; }
    o.push(ch);
  } else o.push('<path class="tt-line" d="M' + f1(cx - kw + 0.6) + " " + f1(ep) + "H" + f1(cx + kw - 0.6) + '"/>');
  return { svg: o.join(""), bot: bot, ep: ep, top: top, cx: cx, kw: kw };
}
const VG = { pY: 482, pX: 14, sX: 160, bX: 306, bY: 252 };
const BONE0 = bone(318, VG.bY, false), BONE1 = bone(318, VG.bY, true);

/* ---------- page helpers (serialized into the page) ---------- */
/* an arrow with its head; dashed past a stop */
function ttArrow(a, cls, stopU) {
  var x1 = a[0], y1 = a[1], x2 = a[2], y2 = a[3], dx = x2 - x1, dy = y2 - y1, n = Math.sqrt(dx * dx + dy * dy), ux = dx / n, uy = dy / n, hx = x2 - ux * 7, hy = y2 - uy * 7, o = "";
  if (stopU === undefined) o += '<path class="tt-arl ' + cls + '" d="M' + f1(x1) + " " + f1(y1) + "L" + f1(hx) + " " + f1(hy) + '"/>';
  else { var sx = x1 + dx * stopU, sy = y1 + dy * stopU; o += '<path class="tt-arl ' + cls + '" d="M' + f1(x1) + " " + f1(y1) + "L" + f1(sx) + " " + f1(sy) + '"/><path class="tt-arl tt-past ' + cls + '" d="M' + f1(sx) + " " + f1(sy) + "L" + f1(hx) + " " + f1(hy) + '"/>'; }
  return o + '<path class="tt-arh ' + cls + (stopU === undefined ? "" : " tt-pasth") + '" d="M' + f1(x2) + " " + f1(y2) + "L" + f1(hx - uy * 4) + " " + f1(hy + ux * 4) + "L" + f1(hx + uy * 4) + " " + f1(hy - ux * 4) + 'Z"/>';
}
/* molecules flowing along an arrow; with a stop they slow, crowd and fade at it */
function ttFlow(a, t, cls, stopU, ph) {
  var o = "", k, n = 3, x1 = a[0], y1 = a[1], dx = a[2] - x1, dy = a[3] - y1;
  for (k = 0; k < n; k++) {
    var u = t ? ((t / 2600 + k / n + (ph || 0)) % 1) : (k + 0.5) / n, op = Math.min(1, u / 0.12, (1 - u) / 0.12);
    if (stopU !== undefined) { u = u * (stopU - 0.06); op = Math.min(1, u / 0.08) * (1 - 0.7 * u / stopU); }
    else u = 0.04 + u * 0.82;
    o += '<circle class="tt-dot ' + cls + '" cx="' + f1(x1 + dx * u) + '" cy="' + f1(y1 + dy * u) + '" r="2.6" opacity="' + f1(Math.max(0, op)) + '"/>';
  }
  if (stopU !== undefined) for (k = 1; k <= 2; k++) o += '<circle class="tt-dot ' + cls + '" cx="' + f1(x1 + dx * (stopU - 0.08 * k - 0.02)) + '" cy="' + f1(y1 + dy * (stopU - 0.08 * k - 0.02)) + '" r="2.6" opacity=".9"/>';
  return o;
}
/* a stop sign where a drug blocks the arrow (or a cross where there is no enzyme at all) */
function ttStop(x, y, kind) {
  if (kind === "none") return '<circle class="tt-nox" cx="' + f1(x) + '" cy="' + f1(y) + '" r="8.5"/><path class="tt-noxm" d="M' + f1(x - 3.6) + " " + f1(y - 3.6) + "L" + f1(x + 3.6) + " " + f1(y + 3.6) + "M" + f1(x + 3.6) + " " + f1(y - 3.6) + "L" + f1(x - 3.6) + " " + f1(y + 3.6) + '"/>';
  var p = "", i; for (i = 0; i < 8; i++) { var an = (i + 0.5) / 8 * Math.PI * 2; p += (i ? "L" : "M") + f1(x + 9.5 * Math.cos(an)) + " " + f1(y + 9.5 * Math.sin(an)); }
  return '<path class="tt-stop" d="' + p + 'Z"/><rect class="tt-stopb" x="' + f1(x - 5.5) + '" y="' + f1(y - 1.6) + '" width="11" height="3.2" rx="1"/>';
}

function ttRender(st, D) {
  var t = st.t || 0, s = st.s, A = D.AR, R0 = D.R0, R1 = D.R1, o = "";
  var b5 = s === "fin", bAr = s === "ai" || s === "none", lowD = b5, lowE = bAr;
  o += T(14, 18, "HIS SLIDE'S EXTRACT OF THE PATHWAY", "tt-h", "start");
  /* ---- arrows and their flow ---- */
  o += HOT("Cholesterol is turned, in several steps, into DHEA (dehydroepiandrosterone), an important precursor. The pathway is complex; his slide is an extract of it.", ttArrow(A.chol, "tt-gray") + '<rect class="tt-hit" x="' + A.chol[0] + '" y="' + (A.chol[1] - 8) + '" width="' + (A.chol[2] - A.chol[0]) + '" height="40"/>' + T((A.chol[0] + A.chol[2]) / 2 - 2, A.chol[1] + 16, "several", "tt-en tt-gr", "middle") + T((A.chol[0] + A.chol[2]) / 2 - 2, A.chol[1] + 29, "steps", "tt-en tt-gr", "middle"));
  o += ttFlow(A.chol, t, "tt-dg", undefined, 0.1);
  o += HOT("DHEA is converted to androstenedione (or androstenediol), then to testosterone.", ttArrow(A.dhea, "tt-gray") + ttArrow(A.ad2t, "tt-gray"));
  o += ttFlow(A.dhea, t, "tt-dg", undefined, 0.4) + ttFlow(A.ad2t, t, "tt-dg", undefined, 0.7);
  /* 5-alpha-reductase, with its drug tag tied under it */
  var u5 = b5 ? 0.5 : undefined, mx = (A.t2d[0] + A.t2d[2]) / 2;
  o += HOT("5-alpha-reductase reduces testosterone to dihydrotestosterone (DHT). The name tells you what it does: it is a reductase. Reducing testosterone is its bioactivation: DHT is the active testosterone.",
    ttArrow(A.t2d, "tt-and", u5) + '<rect class="tt-hit" x="' + (A.t2d[0] - 2) + '" y="' + (A.t2d[1] - 22) + '" width="' + (A.t2d[2] - A.t2d[0] + 4) + '" height="26"/>' + T(mx, A.t2d[1] - 9, "5α-reductase", "tt-en tt-and-t", "middle"));
  o += ttFlow(A.t2d, t, "tt-da", u5, 0.2);
  o += HOT("The 5-alpha-reductase inhibitors he highlighted: finasteride (Proscar for BPH, Propecia for hair loss: the same drug at different strengths) and dutasteride (Avodart).",
    '<path class="tt-tie" d="M' + mx + " " + (A.t2d[1] + 1) + "V" + (A.t2d[1] + 9) + '"/><rect class="tt-tag' + (b5 ? " is-on" : "") + '" x="' + (mx - 40) + '" y="' + (A.t2d[1] + 9) + '" width="80" height="36" rx="7"/>' +
    T(mx, A.t2d[1] + 23, "finasteride", "tt-drug" + (b5 ? " is-on" : ""), "middle") + T(mx, A.t2d[1] + 38, "dutasteride", "tt-drug" + (b5 ? " is-on" : ""), "middle"));
  if (b5) o += ttStop(A.t2d[0] + (A.t2d[2] - A.t2d[0]) * 0.5, A.t2d[1], "drug");
  /* aromatase, twice */
  var ua = bAr ? 0.64 : undefined, kind = s === "none" ? "none" : "drug";
  var arInfo = "Aromatase aromatizes one of testosterone's rings, turning it into estradiol (and androstenedione into estrone): \"When you aromatize the ring, it becomes estrogen.\"" + (s === "none" ? " This man was born without it." : "");
  o += HOT(arInfo, ttArrow(A.ad2e1, "tt-est", ua) + '<rect class="tt-hit" x="' + (A.ad2e1[0] - 66) + '" y="' + A.ad2e1[1] + '" width="70" height="' + (A.ad2e1[3] - A.ad2e1[1]) + '"/>' + T(A.ad2e1[0] - 7, A.ad2e1[1] + 13, "aromatase", "tt-en tt-est-t", "end"));
  o += HOT(arInfo, ttArrow(A.t2e2, "tt-est", ua) + '<rect class="tt-hit" x="' + (A.t2e2[0] - 4) + '" y="' + A.t2e2[1] + '" width="70" height="' + (A.t2e2[3] - A.t2e2[1]) + '"/>' + T(A.t2e2[0] + 7, A.t2e2[1] + 13, "aromatase", "tt-en tt-est-t", "start"));
  o += ttFlow(A.ad2e1, t, "tt-de", ua, 0.5) + ttFlow(A.t2e2, t, "tt-de", ua, 0.15);
  var ym = A.t2e2[1] + (A.t2e2[3] - A.t2e2[1]) * 0.64;
  if (bAr) o += ttStop(A.ad2e1[0], ym, kind) + ttStop(A.t2e2[0], ym, kind);
  /* the aromatase inhibitors' tag, between the two aromatase arrows, tied to both */
  var tx = (A.ad2e1[0] + A.t2e2[0]) / 2, ty = ym - 25, on = s === "ai";
  if (s === "none") o += HOT("No aromatase: a man born without the enzyme can't make estradiol (or estrone).", '<path class="tt-tie" d="M' + (A.ad2e1[0] + 9) + " " + ym + "H" + (tx - 40) + "M" + (tx + 40) + " " + ym + "H" + (A.t2e2[0] - 9) + '"/><rect class="tt-tag is-none" x="' + (tx - 40) + '" y="' + (ym - 19) + '" width="80" height="38" rx="7"/>' + T(tx, ym - 3, "born", "tt-drug is-none", "middle") + T(tx, ym + 12, "without it", "tt-drug is-none", "middle"));
  else o += HOT("The aromatase inhibitors: anastrozole (Arimidex), the most popular and the one he highlighted, letrozole (Femara) and exemestane (Aromasin). They inhibit the conversion of testosterone to estradiol; use: breast cancer.",
    '<path class="tt-tie" d="M' + (A.ad2e1[0] + (on ? 10 : 0)) + " " + ym + "H" + (tx - 41) + "M" + (tx + 41) + " " + ym + "H" + (A.t2e2[0] - (on ? 10 : 0)) + '"/>' + (on ? "" : '<circle class="tt-tied" cx="' + A.ad2e1[0] + '" cy="' + ym + '" r="2.2"/><circle class="tt-tied" cx="' + A.t2e2[0] + '" cy="' + ym + '" r="2.2"/>') +
    '<rect class="tt-tag' + (on ? " is-on" : "") + '" x="' + (tx - 41) + '" y="' + ty + '" width="82" height="50" rx="7"/>' + T(tx, ty + 15, "anastrozole", "tt-drug" + (on ? " is-on" : ""), "middle") + T(tx, ty + 29.5, "letrozole", "tt-drug" + (on ? " is-on" : ""), "middle") + T(tx, ty + 44, "exemestane", "tt-drug" + (on ? " is-on" : ""), "middle"));
  /* estrone, estradiol, estriol */
  o += HOT("Estradiol and estrone interconvert, and both can be converted to estriol, in the liver and peripheral tissues.", '<g class="tt-m' + (lowE ? " is-low" : "") + '">' + ttArrow(A.e12, "tt-est-soft") + ttArrow([A.e12[2], A.e12[3], A.e12[0], A.e12[1]], "tt-est-soft") + ttArrow(A.e1e3, "tt-est-soft") + ttArrow(A.e2e3, "tt-est-soft") + "</g>");
  if (!lowE) o += ttFlow(A.e1e3, t, "tt-de", undefined, 0.3) + ttFlow(A.e2e3, t, "tt-de", undefined, 0.8);
  /* ---- the molecules ---- */
  function mol(k, name, sub, info, low, cls) {
    var p = D.POS[k], r = HOT(info, '<g class="tt-m' + (low ? " is-low" : "") + '">' + D.MS[k] + "</g>"), nx = p[0] + 4;
    r += T(nx, p[1] + 41, name + (low ? ' <tspan class="tt-fall">' + (s === "none" ? "✕" : "↓") + "</tspan>" : ""), "tt-nm" + (cls ? " " + cls + "-t" : "") + (low ? " is-low" : ""), "middle");
    if (sub) r += T(nx, p[1] + 55, sub, "tt-sub" + (low ? " is-low" : ""), "middle");
    return r;
  }
  var none = s === "none" ? " Here: none is made." : " Here it falls.";
  o += mol("chol", "cholesterol", "", "Cholesterol, where the steroid hormones start.", false);
  o += mol("dhea", "DHEA", "", "DHEA, dehydroepiandrosterone: an important precursor of testosterone (DHEAS is its sulfate). His slide's abbreviation table calls it dihydrotestosterone; he corrected it in class.", false);
  o += mol("adione", "androstenedione", "", "Androstenedione: DHEA becomes androstenedione, then testosterone. Aromatase turns androstenedione into estrone.", false);
  o += mol("testo", "testosterone", "", "Testosterone. Its two fates: reduced to DHT by 5-alpha-reductase, or aromatized to estradiol by aromatase." + (b5 ? " With 5-alpha-reductase blocked, it isn't activated to DHT." : ""), false, "tt-and");
  o += mol("dht", "DHT", "the active form", "Dihydrotestosterone (DHT), the active testosterone: a reduced testosterone (the hashed H is the hydrogen 5-alpha-reductase adds to ring A). DHT stimulates growth and drives the prostate." + (lowD ? " Here it falls: 5-alpha-reductase is blocked." : ""), lowD, "tt-and");
  o += mol("e1", "estrone (E1)", "", "Estrone (E1), made in the liver and peripheral tissues; aromatase makes it from androstenedione. The main ingredient of conjugated estrogens (Premarin)." + (lowE ? none : ""), lowE, "tt-est");
  o += mol("e2", "estradiol (E2)", "", "Estradiol (E2), the main estrogen, made in the ovary: testosterone with its first ring aromatized (a phenol ring, its methyl group gone)." + (lowE ? none : ""), lowE, "tt-est");
  o += mol("e3", "estriol (E3)", "", "Estriol (E3), made in the liver and peripheral tissues, from estradiol and estrone." + (lowE ? none : ""), lowE, "tt-est");
  /* the DHEA shelf tag, tied to the molecule: sold over the counter */
  var c16 = D.C16, tg = c16[1];
  o += HOT("Every testosterone product is a Schedule III controlled drug except DHEA, which he said has escaped that regulation: it is sold over the counter as a supplement (prasterone), and many older men take it during andropause to supplement their testosterone.",
    '<path class="tt-tie" d="M' + c16[0] + " " + tg + "H" + 306 + '"/><circle class="tt-tied" cx="' + c16[0] + '" cy="' + tg + '" r="2.2"/>' +
    '<path class="tt-stag" d="M316 ' + f1(tg - 24) + "H450V" + f1(tg + 24) + "H316L304 " + tg + 'Z"/><circle class="tt-sho" cx="314" cy="' + tg + '" r="2.4"/>' +
    T(384, tg - 7, "OTC supplement", "tt-sht", "middle") + T(384, tg + 7, "(prasterone)", "tt-shs", "middle") + T(384, tg + 19, "not Schedule III", "tt-shs", "middle"));
  /* ---- the bone: DHT stimulates growth, estradiol closes the epiphyses ---- */
  var bn = s === "none" ? D.BONE1 : D.BONE0, bx = 318, by = D.VG.bY, rx = bx + 14;
  o += '<rect class="tt-vg" x="' + bx + '" y="' + by + '" width="132" height="222" rx="10"/>' + T(bx + 8, by + 16, "long bone", "tt-vt", "start");
  o += HOT(s === "none" ? "Without aromatase there is no estradiol, so his epiphyses don't close on time: he grows very tall, with long bones but weak, osteoporotic bones (a thin cortex, sparse trabeculae). His slide's treatment is estradiol." : "Growth: DHT stimulates it, and estradiol limits it by closing the epiphyses (the growth plates). In a grown man the plate has closed to a fine line.", bn.svg);
  o += L(bn.cx + bn.kw + 7, bn.ep + 4, s === "none" ? "open" : "closed", bn.cx + bn.kw - 1, bn.ep, "start", "tt-lb" + (s === "none" ? " tt-bad" : ""));
  o += T(bn.cx + bn.kw + 7, bn.ep + 17, "plate", "tt-lb" + (s === "none" ? " tt-bad" : ""), "start");
  o += T(bx + 66, by + 213, s === "none" ? "very tall, weak" : "estradiol closed it", "tt-lb" + (s === "none" ? " tt-bad" : ""), "middle");
  /* a height rule beside the bone: longer without aromatase */
  o += HOT(s === "none" ? "Longer bones: the man without aromatase keeps growing and is very tall." : "The bone's length, for comparison.", '<path class="tt-rule" d="M' + rx + " " + (bn.top - 2) + "V" + bn.bot + "M" + (rx - 4) + " " + (bn.top - 2) + "H" + (rx + 4) + "M" + (rx - 4) + " " + bn.bot + "H" + (rx + 4) + '"/>' +
    (s === "none" ? '<path class="tt-rule tt-ghost" d="M' + (rx - 4) + " " + D.BONE0.bot + "H" + (rx + 4) + '"/><path class="tt-grow" d="M' + rx + " " + (D.BONE0.bot + 2) + "V" + (bn.bot - 2) + '"/>' : ""));
  /* ---- the three tissues ---- */
  var py = D.VG.pY, Ls = lowD ? " ↓" : "";
  o += vgFrame(D.VG.pX, py, 140, 160, "prostate", "DHT" + Ls, "tt-chA");
  o += HOT(lowD ? "With less DHT the enlarged prostate shrinks: finasteride at the higher strength (Proscar) and dutasteride treat benign prostatic hyperplasia." : "DHT drives the prostate's growth; in benign prostatic hyperplasia (BPH) it enlarges. Avoid testosterone in BPH.", lowD ? D.PRO0 : D.PRO1);
  o += T(D.VG.pX + 70, py + 151, lowD ? "BPH treated" : "enlarged: BPH", "tt-lb" + (lowD ? " tt-ok" : ""), "middle");
  o += vgFrame(D.VG.sX, py, 140, 160, "scalp", "DHT" + Ls, "tt-chA");
  o += HOT(lowD ? "Finasteride makes people grow hair: that side effect is why a lower strength was approved for hair loss (Propecia), the same drug as Proscar." : "Hair loss (alopecia): on the scalp, DHT shrinks the hair follicles and the hairs thin out. Blocking 5-alpha-reductase lets hair grow.", lowD ? D.HAIR1 : D.HAIR0);
  o += T(D.VG.sX + 70, py + 151, lowD ? "hair grows" : "hair loss (alopecia)", "tt-lb" + (lowD ? " tt-ok" : ""), "middle");
  o += vgFrame(D.VG.bX, py, 140, 160, "breast", "estradiol" + (lowE ? (s === "none" ? " ✕" : " ↓") : ""), "tt-chE");
  o += HOT(s === "ai" ? "Breast cancer: with aromatase blocked, the estrogen-fueled cancer cells are starved of estradiol. Aromatase inhibitors treat breast cancer, and are not for premenopausal women." : s === "none" ? "No estradiol is made at all without aromatase." : "ER-positive breast cancer cells: they overexpress estrogen receptors, so estrogen fuels their growth and an anti-estrogen will work. Avoid estrogen with breast cancer.", lowE ? D.BR0 : D.BR1);
  o += T(D.VG.bX + 70, py + 151, s === "ai" ? "cancer treated" : s === "none" ? "no estradiol" : "ER-positive cancer", "tt-lb" + (s === "ai" ? " tt-ok" : ""), "middle");
  return o;
}
function ttSay(st) {
  var s = st.s;
  if (s === "fin") return ["Finasteride or dutasteride blocks 5-alpha-reductase, so testosterone isn't activated to DHT and DHT falls. Less DHT shrinks the enlarged prostate (BPH: Proscar, the higher strength) and lets hair grow (alopecia: Propecia, the lower strength; the same drug). Side effects: gynecomastia and sexual dysfunction, the man in his Case 4.", "5α-reductase blocked · DHT ↓"];
  if (s === "ai") return ["Anastrozole (Arimidex), letrozole or exemestane blocks aromatase, so testosterone can't become estradiol (nor androstenedione estrone) and the estrogens fall: the cancer cells are starved of estradiol. Use: breast cancer. Remember hot flashes and thromboembolism; not for premenopausal women or with hepatic damage.", "aromatase blocked · estrogens ↓"];
  if (s === "none") return ["A man born without aromatase can't make estradiol. DHT still stimulates growth, but nothing closes his epiphyses on time: he grows very tall, with long but weak, osteoporotic bones. His slide's treatment: estradiol.", "no aromatase · no estradiol"];
  return ["Testosterone has two fates. 5-alpha-reductase reduces it to dihydrotestosterone (DHT), the active form; aromatase aromatizes its first ring to make estradiol (and androstenedione into estrone). Pick a drug to block an enzyme.", "both enzymes working"];
}

export default function tfates() {
  return makeFig({ id: "tfates", lec: "sexster", fig: "Fig 18.1", short: "Testosterone's two fates", hint: "pick a drug · hover",
    title: "Testosterone's two fates",
    caption: "Dr. Fasinu's pathway from cholesterol to testosterone, then the fork: 5-alpha-reductase makes DHT, the active form, and aromatase makes estradiol. Pick a drug to stop its enzyme and see which product falls and what that treats, or a man born without aromatase.",
    W, H, label: "Skeletal formulas of cholesterol, DHEA, androstenedione, testosterone, DHT, estrone, estradiol and estriol joined by reaction arrows, with 5-alpha-reductase and aromatase marked, the drugs that block each, a long bone's growth plate, and the prostate, scalp and breast cancer cells.",
    D: { INIT: { s: "off" }, ANIM: true, R0, R1, C16: [f1(POS.dhea[0] - 15 + 5.003 * B), f1(POS.dhea[1] + 10 - 1.5 * B)], AR, POS, MS, VG, BONE0, BONE1, PRO1: prostate(VG.pX, VG.pY, 1), PRO0: prostate(VG.pX, VG.pY, 0.74), HAIR0: scalp(VG.sX, VG.pY, 0), HAIR1: scalp(VG.sX, VG.pY, 1), BR1: breast(VG.bX, VG.pY, 1), BR0: breast(VG.bX, VG.pY, 0) },
    render: ttRender, say: ttSay, helpers: [ttArrow, ttFlow, ttStop, vgFrame],
    controls: `<div class="am-controls" role="group" aria-label="Block an enzyme">${[["off", "No drug"], ["fin", "Finasteride (5α-reductase)"], ["ai", "Anastrozole (aromatase)"], ["none", "No aromatase (born without)"]].map((b) => `<button type="button" class="am-btn" data-amk="s" data-amv="${b[0]}">${b[1]}</button>`).join("")}</div>`,
    sources: [
      "From the L18 notes, slides and recording (Dr. Fasinu): his slide's extract of the pathway (cholesterol, in several steps, to DHEA, then androstenedione or androstenediol, then testosterone); 5-alpha-reductase reducing testosterone to DHT, \"the active testosterone\" (his Case 2); aromatase aromatizing a ring to make estradiol, and androstenedione estrone; estrone and estriol from the liver and peripheral tissues; the blocking drugs he highlighted (finasteride, dutasteride; anastrozole, with letrozole and exemestane); DHEA sold over the counter (prasterone) and outside Schedule III; DHT stimulating growth and estradiol closing the epiphyses; the man without aromatase (very tall, weak osteoporotic bones, treated with estradiol); the uses and side effects in the summary. His slide's abbreviation table calls DHEA dihydrotestosterone; he corrected it in class (dehydroepiandrosterone), and the figure follows the correction.",
      "The skeletal formulas are drawn from the PubChem structure records (cholesterol CID 5997, DHEA 5881, androstenedione 6128, testosterone 6013, dihydrotestosterone 10635, estrone 5870, estradiol 5757, estriol 5756); they settled what each enzyme does to ring A: 5-alpha-reductase saturates the 4,5 double bond, adding the 5-alpha hydrogen drawn hashed on DHT, and aromatase removes the methyl group at the A/B ring junction and makes ring A aromatic (a phenol). Only the 17-beta hydroxyl, estriol's 16-alpha hydroxyl and DHT's 5-alpha hydrogen carry wedges; the ring-junction hydrogens are left implicit, as is usual.",
      "For how the tissues behave: the man without aromatase follows Morishima et al. (J Clin Endocrinol Metab 1995;80:3689) and Carani et al. (N Engl J Med 1997;337:91): unfused epiphyses, continued growth and low bone density, corrected by estradiol (the open plate, longer shaft, thin cortex and sparse trabeculae). The prostate shrinking on finasteride follows McConnell et al. (N Engl J Med 1998;338:557); the scalp follicles miniaturized by DHT and regrowing on finasteride follow Kaufman et al. (J Am Acad Dermatol 1998;39:578); Proscar 5 mg and Propecia 1 mg are the product labels' strengths (he wasn't sure of the numbers in class).",
      "Schematic: the full pathway has more steps and enzymes than his extract; the tissues are drawn to show the direction of each change, not its size; levels are qualitative. Educational, not medical advice."],
    css: `
.anima[data-anima="tfates"] .am-svg{max-width:540px}
.anima .tfates-svg .tt-h{font:600 11px var(--anatomy-mono);letter-spacing:.06em;fill:var(--anatomy-muted)}
.anima .tfates-svg .tt-bd{fill:none;stroke:var(--anatomy-hi);stroke-width:1.25;stroke-linecap:round}
.anima .tfates-svg .tt-hs{stroke-width:1}
.anima .tfates-svg .tt-wg{fill:var(--anatomy-hi)}
.anima .tfates-svg .tt-at{font:600 11px var(--anatomy-mono);fill:var(--anatomy-strong)}
.anima .tfates-svg .tt-h.tt-at{font-weight:600;letter-spacing:0;fill:var(--anatomy-strong)}
.anima .tfates-svg .tt-ra{stroke:none;opacity:.55}
.anima .tfates-svg .tt-raT{fill:var(--bx-blue-soft)}
.anima .tfates-svg .tt-raD{fill:var(--bx-blue-soft)}
.anima .tfates-svg .tt-raE{fill:var(--bx-cyto)}
.anima .tfates-svg .tt-m{transition:opacity .4s}
.anima .tfates-svg .tt-m.is-low{opacity:.24}
.anima .tfates-svg .tt-nm{font:600 12.5px var(--anatomy-mono);fill:var(--anatomy-strong);paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round}
.anima .tfates-svg .tt-nm.tt-and-t{fill:var(--bx-blue)}
.anima .tfates-svg .tt-nm.tt-est-t{fill:var(--bx-memb)}
.anima .tfates-svg .tt-nm.is-low{fill-opacity:.45}
.anima .tfates-svg .tt-sub{font:11px var(--anatomy-mono);fill:var(--anatomy-muted)}
.anima .tfates-svg .tt-sub.is-low{opacity:.5}
.anima .tfates-svg .tt-fall{font-weight:800;fill:var(--bx-inhib);fill-opacity:1}
.anima .tfates-svg .tt-arl{fill:none;stroke-width:1.6}
.anima .tfates-svg .tt-arl.tt-past{stroke-dasharray:2 3;opacity:.45}
.anima .tfates-svg .tt-arh{stroke:none}
.anima .tfates-svg .tt-arh.tt-pasth{opacity:.4}
.anima .tfates-svg .tt-gray{stroke:var(--anatomy-mid)} .anima .tfates-svg .tt-arh.tt-gray{fill:var(--anatomy-mid)}
.anima .tfates-svg .tt-arl.tt-and{stroke:var(--bx-blue);stroke-width:2.2} .anima .tfates-svg .tt-arh.tt-and{fill:var(--bx-blue)}
.anima .tfates-svg .tt-arl.tt-est{stroke:var(--bx-memb);stroke-width:2.2} .anima .tfates-svg .tt-arh.tt-est{fill:var(--bx-memb)}
.anima .tfates-svg .tt-arl.tt-est-soft{stroke:var(--bx-cyto-line);stroke-width:1.3} .anima .tfates-svg .tt-arh.tt-est-soft{fill:var(--bx-cyto-line)}
.anima .tfates-svg .tt-dot{stroke:var(--surface);stroke-width:.8}
.anima .tfates-svg .tt-dg{fill:var(--anatomy-mid)} .anima .tfates-svg .tt-da{fill:var(--bx-blue)} .anima .tfates-svg .tt-de{fill:var(--bx-memb)}
.anima .tfates-svg .tt-hit{fill:transparent}
.anima .tfates-svg .tt-en{font:600 12px var(--anatomy-mono);paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round}
.anima .tfates-svg .tt-gr{fill:var(--anatomy-muted);font-weight:400;font-size:11px}
.anima .tfates-svg .tt-and-t{fill:var(--bx-blue)} .anima .tfates-svg .tt-est-t{fill:var(--bx-memb)}
.anima .tfates-svg .tt-drug{font:11px var(--anatomy-mono);fill:var(--anatomy-muted);paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round}
.anima .tfates-svg .tt-drug.is-on{fill:var(--bx-inhib);font-weight:700}
.anima .tfates-svg .tt-tag .tt-drug{stroke:none}
.anima .tfates-svg .tt-tag{fill:var(--anatomy-shade-1);stroke:var(--anatomy-lo);stroke-width:1}
.anima .tfates-svg .tt-tag.is-on{fill:var(--bx-hot-soft);stroke:var(--bx-inhib);stroke-width:1.4}
.anima .tfates-svg .tt-tag.is-none{fill:var(--bx-hot-soft);stroke:var(--bx-inhib);stroke-dasharray:3 2}
.anima .tfates-svg .tt-drug.is-none{fill:var(--bx-inhib);font-weight:700;stroke:none}
.anima .tfates-svg .tt-tie{fill:none;stroke:var(--anatomy-lo);stroke-width:1;stroke-dasharray:2 2}
.anima .tfates-svg .tt-tied{fill:var(--anatomy-mid)}
.anima .tfates-svg .tt-stop{fill:var(--bx-inhib);stroke:var(--surface);stroke-width:1.4}
.anima .tfates-svg .tt-stopb{fill:var(--surface)}
.anima .tfates-svg .tt-nox{fill:var(--surface);stroke:var(--bx-inhib);stroke-width:1.8}
.anima .tfates-svg .tt-noxm{fill:none;stroke:var(--bx-inhib);stroke-width:2;stroke-linecap:round}
.anima .tfates-svg .tt-stag{fill:var(--bx-gold-soft);stroke:var(--bx-gold);stroke-width:1.2;stroke-linejoin:round}
.anima .tfates-svg .tt-sho{fill:var(--surface);stroke:var(--bx-gold);stroke-width:1}
.anima .tfates-svg .tt-sht{font:600 11.5px var(--anatomy-mono);fill:var(--anatomy-strong)}
.anima .tfates-svg .tt-shs{font:11px var(--anatomy-mono);fill:var(--anatomy-text)}
.anima .tfates-svg .tt-vg{fill:var(--anatomy-shade-0);stroke:var(--anatomy-faint);stroke-width:1}
.anima .tfates-svg .tt-vt{font:600 11px var(--anatomy-mono);letter-spacing:.05em;fill:var(--anatomy-muted);text-transform:uppercase}
.anima .tfates-svg .tt-chip{stroke:none}
.anima .tfates-svg .tt-chA{fill:var(--bx-blue-soft)} .anima .tfates-svg .tt-chE{fill:var(--bx-cyto)}
.anima .tfates-svg .tt-cht{font:600 11px var(--anatomy-mono);fill:var(--anatomy-strong)}
.anima .tfates-svg .tt-lb{font:11.5px var(--anatomy-mono);fill:var(--anatomy-text);paint-order:stroke;stroke:var(--anatomy-shade-0);stroke-width:3px;stroke-linejoin:round}
.anima .tfates-svg .tt-lb.tt-ok{fill:var(--bx-stim);font-weight:700}
.anima .tfates-svg .tt-lb.tt-bad{fill:var(--bx-inhib);font-weight:700}
.anima .tfates-svg .tt-blad{fill:var(--bx-cyto);stroke:var(--bx-cyto-line);stroke-width:1}
.anima .tfates-svg .tt-bladin{fill:var(--bx-lumen);stroke:none}
.anima .tfates-svg .tt-pro{fill:var(--bx-eosin);stroke:var(--bx-cyto-line);stroke-width:1.2}
.anima .tfates-svg .tt-acin{fill:var(--bx-lumen);stroke:var(--bx-nuc);stroke-width:.8}
.anima .tfates-svg .tt-ureth{fill:var(--bx-lumen);stroke:var(--bx-cyto-line);stroke-width:.8}
.anima .tfates-svg .tt-derm{fill:var(--bx-matrix)}
.anima .tfates-svg .tt-fatl{fill:var(--bx-fat);stroke:var(--bx-fat-line);stroke-width:.6}
.anima .tfates-svg .tt-epi{fill:var(--bx-eosin)}
.anima .tfates-svg .tt-fol{fill:var(--bx-cyto);stroke:var(--bx-cyto-line);stroke-width:.9}
.anima .tfates-svg .tt-pap{fill:var(--bx-nuc)}
.anima .tfates-svg .tt-ghostf,.anima .tfates-svg .tt-ghostp{fill:none;stroke:var(--anatomy-mid);stroke-width:.9;stroke-dasharray:2.5 2.5}
.anima .tfates-svg .tt-hair{fill:none;stroke:var(--anatomy-hi);stroke-linecap:round}
.anima .tfates-svg .tt-duct{fill:var(--bx-matrix);stroke:var(--bx-cyto-line);stroke-width:1.2}
.anima .tfates-svg .tt-lum{fill:var(--bx-lumen)}
.anima .tfates-svg .tt-cell{fill:var(--bx-cyto);stroke:var(--bx-cyto-line);stroke-width:.8}
.anima .tfates-svg .tt-cnuc{fill:var(--bx-nuc)}
.anima .tfates-svg .tt-mit{fill:none;stroke:var(--bx-nuc);stroke-width:2;stroke-linecap:round}
.anima .tfates-svg .tt-bone{fill:var(--bx-fat);stroke:var(--anatomy-mid);stroke-width:1.4}
.anima .tfates-svg .tt-mar{fill:var(--bx-blood-soft);stroke:var(--bx-fat-line);stroke-width:.8}
.anima .tfates-svg .tt-trab{fill:none;stroke:var(--bx-fat-line);stroke-width:1.5;stroke-linecap:round}
.anima .tfates-svg .tt-trab.is-thin{stroke-width:.9}
.anima .tfates-svg .tt-plate{fill:var(--bx-violet-soft);stroke:var(--bx-violet);stroke-width:1}
.anima .tfates-svg .tt-chon{fill:var(--bx-violet)}
.anima .tfates-svg .tt-line{fill:none;stroke:var(--anatomy-mid);stroke-width:1.2}
.anima .tfates-svg .tt-rule{fill:none;stroke:var(--anatomy-mid);stroke-width:1}
.anima .tfates-svg .tt-rule.tt-ghost{stroke-dasharray:2 2}
.anima .tfates-svg .tt-grow{fill:none;stroke:var(--bx-inhib);stroke-width:2.4}
.anima .tfates-svg .am-callout .t{font-size:11.5px}
@media (max-width:560px){.anima .tfates-svg .tt-nm{font-size:13.5px}.anima .tfates-svg .tt-en{font-size:13px}.anima .tfates-svg .tt-lb,.anima .tfates-svg .tt-drug{font-size:12.5px}.anima .tfates-svg .tt-h{font-size:12px}}
`,
  });
}
