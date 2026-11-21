// Fig: the endocrine glands and the mouth (Lecture A, Dental Endocrinology Clinical Application, Dr. Taylor). A body
// outline, front view, with the glands the lecture walks through: the hypothalamus and pituitary, the thyroid with the
// four parathyroids behind it, the adrenals on the kidneys (with a magnified section for cortex and medulla), the
// pancreas, and the ovaries or the testes (a Female / Male switch). Tap a gland (or its button): the column beside the
// body gives what it makes, small drawn mouths where a finding can be seen (acromegaly's forward jaw and spacing,
// hypothyroid macroglossia, Addison pigment, diabetic candidiasis, pubertal and pregnancy gingivitis with the pyogenic
// granuloma, the hyperparathyroid film) and the dental points to keep in mind; the table below compares its disorders in
// the notes' own rows. Laid out 440 wide, with the table full width under the body, so its text reads at phone width.
// The summary under the figure repeats the card in full sentences.
import { makeFig, f1, T, HOT } from "./shared.mjs";

/* ---------- text: Nunito Sans advance widths (em), for wrapping at build time ---------- */
const CW = { " ": .25, i: .24, l: .24, j: .24, f: .33, t: .35, r: .39, I: .29, ".": .24, ",": .24, ":": .25, ";": .25, "'": .2, "\"": .37, "(": .32, ")": .32, "-": .36, "/": .37,
  m: .88, w: .77, M: .87, W: .96, s: .46, c: .49, z: .46, x: .5, v: .51, y: .51, k: .52, a: .54, e: .55, "↑": .6, "↓": .6 };
function tw(s, fs, bold) { let w = 0; for (const ch of s) w += CW[ch] !== undefined ? CW[ch] : /[A-Z]/.test(ch) ? .67 : /[0-9]/.test(ch) ? .57 : .59; return w * fs * (bold ? 1.07 : 1) * 1.04; }
function wrap(s, width, fs, bold, first) {
  /* first: width already used on the first line (a bold lead) */
  const words = s.split(" "), out = []; let line = "", used = first || 0;
  for (const wd of words) {
    const t = line ? line + " " + wd : wd;
    if (tw(t, fs, bold) + used > width && line) { out.push(line); line = wd; used = 0; } else line = t;
  }
  if (line) out.push(line);
  return out;
}
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function tx(x, y, s, cls, a) { return '<text class="t ' + cls + '" x="' + f1(x) + '" y="' + f1(y) + '"' + (a ? ' text-anchor="' + a + '"' : "") + ">" + s + "</text>"; }
/* a bold lead and its text, wrapped: returns [svg, lines]. A lead too long for the width wraps on its own, and the text
   starts on a new line when its first word won't fit after the lead */
function rich(x, y, lead, text, width, fs, lh) {
  const L = wrap(lead + ":", width, fs, true), lw = tw(L[L.length - 1] + " ", fs, true);
  let lines = wrap(text, width, fs, false, lw), joined = true;
  if (lw + tw(text.split(" ")[0], fs, false) > width) { lines = wrap(text, width, fs, false); joined = false; }
  let o = "", k = 0;
  L.forEach((ln, i) => {
    const last = i === L.length - 1;
    o += '<text class="t gm-tx" x="' + f1(x) + '" y="' + f1(y + k * lh) + '"><tspan class="gm-b">' + esc(ln) + "</tspan>" + (last && joined ? " " + esc(lines[0] || "") : "") + "</text>"; k++;
  });
  for (let i = joined ? 1 : 0; i < lines.length; i++) { o += tx(x, y + k * lh, esc(lines[i]), "gm-tx"); k++; }
  return [o, k];
}

/* ---------- the little mouths, drawn in a 120 x 64 box ---------- */
const OPEN_IN = "M12 30C22 4 98 4 108 30C98 62 22 62 12 30Z", OPEN_OUT = "M6 30C16 0 104 0 114 30C104 64 16 64 6 30Z";
const SHUT_IN = "M12 32C22 10 98 10 108 32C98 54 22 54 12 32Z", SHUT_OUT = "M6 32C16 4 104 4 114 32C104 60 16 60 6 32Z";
const GUM_IN = "M10 32C20 2 100 2 110 32C100 62 20 62 10 32Z", GUM_OUT = "M4 32C14 -2 106 -2 116 32C106 66 14 66 4 32Z";
const BOX = "M8 0H112A8 8 0 0 1 120 8V56A8 8 0 0 1 112 64H8A8 8 0 0 1 0 56V8A8 8 0 0 1 8 0Z";
/* one tooth: x0..x1 across, from the neck (cej) to the edge; upper teeth have edge > cej; a canine comes to a point */
function tooth(x0, x1, cej, edge, canine, cls) {
  const up = edge > cej, s = up ? 1 : -1, h = edge - cej, xm = (x0 + x1) / 2;
  let d = "M" + f1(x0 + 0.9) + " " + f1(cej) + "C" + f1(x0 - 0.2) + " " + f1(cej + h * 0.35) + " " + f1(x0 - 0.1) + " " + f1(cej + h * 0.7) + " " + f1(x0 + 0.2) + " " + f1(edge - s * 2);
  if (canine) d += "Q" + f1(x0 + 0.8) + " " + f1(edge - s * 0.2) + " " + f1(xm) + " " + f1(edge + s * 1.4) + "Q" + f1(x1 - 0.8) + " " + f1(edge - s * 0.2) + " " + f1(x1 - 0.2) + " " + f1(edge - s * 2);
  else d += "Q" + f1(x0 + 0.5) + " " + f1(edge) + " " + f1(x0 + 2.4) + " " + f1(edge) + "L" + f1(x1 - 2.4) + " " + f1(edge) + "Q" + f1(x1 - 0.5) + " " + f1(edge) + " " + f1(x1 - 0.2) + " " + f1(edge - s * 2);
  d += "C" + f1(x1 + 0.1) + " " + f1(cej + h * 0.7) + " " + f1(x1 + 0.2) + " " + f1(cej + h * 0.35) + " " + f1(x1 - 0.9) + " " + f1(cej) + "Z";
  return '<path class="' + (cls || "gm-tooth") + '" d="' + d + '"/>';
}
/* the gum along a row of teeth: a band from the vestibule (yv) to a scalloped margin with papillae between the teeth */
function gum(teeth, yv, pap, cls) {
  const up = teeth[0][3] > teeth[0][2], s = up ? 1 : -1;
  let d = "M6 " + yv + "L6 " + f1(teeth[0][2] + s * 3);
  teeth.forEach((t, i) => {
    d += "L" + f1(t[0]) + " " + f1(t[2] + s * 2.5) + "Q" + f1((t[0] + t[1]) / 2) + " " + f1(t[2] - s * 2.6) + " " + f1(t[1]) + " " + f1(t[2] + s * 2.5);
    const n = teeth[i + 1]; if (n) d += "Q" + f1((t[1] + n[0]) / 2 - 0.6) + " " + f1(t[2] + s * pap) + " " + f1((t[1] + n[0]) / 2) + " " + f1(Math.max(t[2], n[2]) * (up ? 1 : 0) + Math.min(t[2], n[2]) * (up ? 0 : 1) + s * pap) + "Q" + f1((t[1] + n[0]) / 2 + 0.6) + " " + f1(n[2] + s * pap) + " " + f1(n[0]) + " " + f1(n[2] + s * 2.5);
  });
  const L = teeth[teeth.length - 1];
  d += "L114 " + f1(L[2] + s * 3) + "L114 " + yv + "Z";
  return '<path class="' + cls + '" d="' + d + '"/>';
}
function mouth(f) {
  let o = "";
  if (f.film) {
    /* a small periapical-style film: two premolar roots, no white line around them, a radiolucent brown tumor */
    o += '<path class="gm-f0" d="' + BOX + '"/><path class="gm-fb" d="M2 23C20 20 32 24 60 22C88 20 100 24 118 22V56A6 6 0 0 1 112 62H8A6 6 0 0 1 2 56Z"/>';
    o += '<path class="gm-fg" d="M4 30H116M4 36H116M4 42H116M4 48H116M4 54H116"/>';
    [[32, 0], [74, 1]].forEach(function (p) { const x = p[0];
      o += '<path class="gm-fd" d="M' + (x - 13) + " 13C" + (x - 13) + " 5 " + (x - 6) + " 3 " + x + " 3C" + (x + 6) + " 3 " + (x + 13) + " 5 " + (x + 13) + " 13C" + (x + 12) + " 17 " + (x + 9) + " 20 " + (x + 9) + " 22C" + (x + 8) + " 32 " + (x + 4) + " 42 " + (x + 1) + " 47C" + (x - 1) + " 48 " + (x - 2) + " 48 " + (x - 3) + " 46C" + (x - 6) + " 40 " + (x - 9) + " 30 " + (x - 9) + " 22C" + (x - 9) + " 20 " + (x - 12) + " 17 " + (x - 13) + ' 13Z"/>' +
        '<path class="gm-fe" d="M' + (x - 13) + " 13C" + (x - 13) + " 5 " + (x - 6) + " 3 " + x + " 3C" + (x + 6) + " 3 " + (x + 13) + " 5 " + (x + 13) + " 13C" + (x + 9) + " 9 " + (x + 5) + " 7.5 " + x + " 7.5C" + (x - 5) + " 7.5 " + (x - 9) + " 9 " + (x - 13) + ' 13Z"/>' +
        '<path class="gm-fp" d="M' + (x - 2.5) + " 11C" + (x - 2.5) + " 22 " + (x - 1.2) + " 36 " + (x - 0.6) + " 45L" + (x + 0.4) + " 45C" + (x + 1.1) + " 36 " + (x + 2.5) + " 22 " + (x + 2.5) + ' 11Z"/>'; });
    o += '<path class="gm-ft" d="M76 52C76 47 82 46 88 46C96 46 103 48 103 53C103 58 96 61 89 61C81 61 76 58 76 52Z"/>';
    o += '<path class="gm-fbox" d="' + BOX + '"/>';
    return o;
  }
  /* open: lips apart (the tongue shows); gums: lips drawn back from closed teeth (the gingiva shows); else a closed smile */
  const open = !!f.open, gums = !!f.gums, IN = open ? OPEN_IN : gums ? GUM_IN : SHUT_IN, OUT = open ? OPEN_OUT : gums ? GUM_OUT : SHUT_OUT;
  o += '<path class="gm-cav" d="' + IN + '"/>';
  const gp = f.gp ? 6.4 : 4.8, gcls = "gm-gum" + (f.red ? " gm-red" : "");
  /* the teeth: [x0, x1, cej, edge, canine]; spaced apart when the arch has grown (diastemas) */
  const gap = f.gaps ? 0.6 : 0, sp = f.gaps ? 0.26 : 0;
  const spread = (row) => row.map((t) => { const m = (t[0] + t[1]) / 2 + ((t[0] + t[1]) / 2 - 60) * sp, w = t[1] - t[0] - gap; return [m - w / 2, m + w / 2, t[2], t[3], t[4]]; });
  let U, Lw;
  if (open) {
    U = [[31, 39, 13, 27, 1], [39.5, 48, 14.5, 26.5], [48.5, 59.75, 13.5, 28], [60.25, 71.5, 13.5, 28], [72, 80.5, 14.5, 26.5], [81, 89, 13, 27, 1]];
    Lw = [[37.5, 45.5, 53, 41.5, 1], [45.8, 53, 53.5, 42], [53.3, 59.85, 53.5, 42], [60.15, 66.7, 53.5, 42], [67, 74.2, 53.5, 42], [74.5, 82.5, 53, 41.5, 1]];
  } else {
    U = [[31, 39, 19.5, 35, 1], [39.5, 48, 21, 34.5], [48.5, 59.75, 20, 36], [60.25, 71.5, 20, 36], [72, 80.5, 21, 34.5], [81, 89, 19.5, 35, 1]];
    /* Class III: the lower incisors sit in front of the upper ones */
    Lw = f.c3 ? [[33.5, 42.5, 45, 30.5, 1], [42.8, 51.6, 45.5, 30], [51.9, 59.8, 45.5, 30], [60.2, 68.1, 45.5, 30], [68.4, 77.2, 45.5, 30], [77.5, 86.5, 45, 30.5, 1]]
      : [[37.5, 45.5, 46, 33.8, 1], [45.8, 53, 46.5, 33.5], [53.3, 59.85, 46.5, 33.5], [60.15, 66.7, 46.5, 33.5], [67, 74.2, 46.5, 33.5], [74.5, 82.5, 46, 33.8, 1]];
  }
  U = spread(U); Lw = spread(Lw);
  const upper = U.map((t) => tooth(t[0], t[1], t[2], t[3], t[4])).join("") + gum(U, open || gums ? 6 : 8, gp, gcls);
  const lower = Lw.map((t) => tooth(t[0], t[1], t[2], t[3], t[4], f.c3 ? "gm-tooth gm-front" : "")).join("") + gum(Lw, open || gums ? 58 : 56, gp, gcls);
  /* the tongue's back rises behind the lower teeth; a big one lies over them, its edge scalloped by the teeth */
  const tongueN = '<path class="gm-tongue" d="M22 52C22 26 98 26 98 52Z"/>';
  let tb = "M14 58C12 28 108 28 106 58";
  for (let x = 106; x > 14.5; x -= 8.5) { const x2 = Math.max(14, x - 8.5), yb = (q) => 46.5 + Math.pow((q - 60) / 46, 2) * 9; tb += "L" + f1(x) + " " + f1(yb(x)) + "Q" + f1((x + x2) / 2) + " " + f1(yb((x + x2) / 2) + 3.4) + " " + f1(x2) + " " + f1(yb(x2)); }
  const tongueB = '<path class="gm-tongue" d="' + tb + 'Z"/>';
  if (open) {
    o += upper + (f.big ? "" : tongueN) + lower + (f.big ? tongueB : "");
    if (f.cand) o += '<path class="gm-cand" d="M38 37c2-2.5 6-2.5 7 0c.5 2.2-2.5 3-5 3c-2 0-2.8-1.5-2-3ZM55 33.5c3-1.8 8-1 8 1.6c0 2.4-4 2.6-6 2.4c-2-.2-3.4-2.4-2-4ZM71 36.5c2-1.6 5.5-1 5.5 1c0 1.8-2.8 2.4-4.5 2.2c-1.8-.2-2-2-1-3.2ZM48 39c1.6-1 4.4-.4 4.4 1c0 1-2.4 1.6-3.6 1.3c-1-.2-1.4-1.6-.8-2.3ZM63 38.5c1.4-.9 3.8-.4 3.8.9c0 .9-2 1.4-3.1 1.1c-.9-.2-1.2-1.4-.7-2Z"/>';
  } else if (f.c3) o += upper + lower;
  else o += lower + upper;
  if (f.mel) o += '<path class="gm-mel" d="M26 15c3-3 9-2 10 0c1 3-4 4-7 4c-3 0-4-2-3-4ZM41 11.5c4-2 11-1 11 1.5c0 2.5-6 3.5-9 3c-3-.4-3.4-3-2-4.5ZM60 13c3-1.5 8-1 8.5 1c.4 2-4 3-6.5 2.6c-2.4-.4-3.4-2.4-2-3.6ZM74 11c4-1.5 10-.5 10 2c0 2.4-5.6 3-8.4 2.4c-2.6-.6-3-3.2-1.6-4.4ZM88 15.5c2.6-1.6 7-.6 7 1.4c0 1.8-3.6 2.4-5.6 2c-1.8-.4-2.4-2.4-1.4-3.4ZM34 50.5c3-1.4 8-.6 8 1.4c0 1.8-4.4 2.4-6.6 2c-2-.4-2.8-2.4-1.4-3.4ZM52 51c4-1.2 9-.2 9 1.6c0 1.6-5 2-7.4 1.6c-2-.4-3-2.2-1.6-3.2ZM70 50c3-1.2 7.6-.4 7.6 1.4c0 1.6-4 2.2-6 1.8c-2-.4-3-2.2-1.6-3.2Z"/>';
  if (f.pg) o += '<path class="gm-pg" d="M44.5 21.5C42 21 40 24.5 40.8 27.2C39.6 29.8 41.4 33 44.4 32.6C45.8 34.8 49.8 34.2 50.6 31.4C53.4 30.6 53.4 26.2 51 25C50.8 22 47 20.4 44.5 21.5Z"/><path class="gm-pgh" d="M43.2 25c1-.9 2.4-.9 3 0M46.8 28.6c.9-.7 2.1-.6 2.6.2"/>';
  o += '<path class="gm-skin" fill-rule="evenodd" d="' + BOX + IN + '"/><path class="gm-lip" fill-rule="evenodd" d="' + OUT + IN + '"/><path class="gm-frame" d="' + BOX + '"/>';
  return o;
}

/* ---------- the body (drawing units; the body's midline at x = 115) ---------- */
const X0 = 115;
function bzc(p, closed) {
  const n = p.length; let d = "M" + f1(p[0][0]) + " " + f1(p[0][1]);
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const b = p[i], c = p[(i + 1) % n], a = closed || i > 0 ? p[(i - 1 + n) % n] : b, e = closed || i + 2 < n ? p[(i + 2) % n] : c;
    d += "C" + f1(b[0] + (c[0] - a[0]) / 6) + " " + f1(b[1] + (c[1] - a[1]) / 6) + " " + f1(c[0] - (e[0] - b[0]) / 6) + " " + f1(c[1] - (e[1] - b[1]) / 6) + " " + f1(c[0]) + " " + f1(c[1]);
  }
  return d + (closed ? "Z" : "");
}
const mir = (p) => p.map((q) => [2 * X0 - q[0], q[1]]);
function bodyArt() {
  const o = {};
  /* torso and thighs, no arms (a schematic outline), front view: patient's right on the viewer's left */
  const side = [[128, 88], [128, 117], [146, 125], [166, 132], [177, 142], [179, 156], [174, 170], [170, 196], [165, 238], [160, 284], [165, 326], [171, 366], [172, 402], [168, 448], [165, 482]];
  const inner = [[127, 482], [124, 466], [X0, 430]];
  const L = mir(side).reverse(), Li = mir(inner.slice(0, 2)).reverse();
  /* right side down, across the right thigh's cut, up its inner edge to the crotch, down the left inner thigh, across, up the left side */
  o.TORSO = '<path class="gm-skinb" d="' + bzc(side, false) + "L" + inner.map((q) => f1(q[0]) + " " + f1(q[1])).join("L") + "L" + Li.map((q) => f1(q[0]) + " " + f1(q[1])).join("L") + "L" + f1(L[0][0]) + " " + f1(L[0][1]) + bzc(L, false).replace(/^M[^C]*/, "") + 'Z"/>';
  const head = [[X0, 16], [133, 20], [143, 35], [145, 55], [141, 74], [133, 88], [122, 96], [X0, 97.5], [108, 96], [97, 88], [89, 74], [85, 55], [87, 35], [97, 20]];
  o.HEAD = '<path class="gm-skinb" d="' + bzc(head, true) + '"/>';
  /* context, faint: the brain, the trachea, the kidneys, the uterus */
  o.BRAIN = '<path class="gm-ctx" d="' + bzc([[X0, 24], [131, 27], [138, 40], [137, 56], [126, 63], [X0, 64], [104, 63], [93, 56], [92, 40], [99, 27]], true) + '"/><path class="gm-gyr" d="M100 36C106 31 110 38 115 33C120 38 124 31 130 36M98 47C105 42 110 50 115 45C120 50 125 42 132 47"/>';
  let rings = ""; for (let y = 104; y <= 168; y += 6) rings += "M" + (X0 - 4.5) + " " + y + "H" + (X0 + 4.5);
  o.TRACH = '<path class="gm-trach" d="M' + (X0 - 4.5) + " 100V172M" + (X0 + 4.5) + ' 100V172"/><path class="gm-ring" d="' + rings + '"/>';
  const kid = (cx, cy, s) => bzc([[cx, cy - 19], [cx + s * 9, cy - 15], [cx + s * 11, cy], [cx + s * 9, cy + 15], [cx, cy + 19], [cx - s * 6, cy + 13], [cx - s * 4, cy + 3], [cx - s * 4, cy - 3], [cx - s * 6, cy - 13]], true);
  o.KID = '<path class="gm-ctx" d="' + kid(89, 272, -1) + '"/><path class="gm-ctx" d="' + kid(141, 265, 1) + '"/>';
  o.UTERUS = '<path class="gm-ctx" d="' + bzc([[X0, 372], [124, 374], [126, 384], [120, 396], [X0, 400], [110, 396], [104, 384], [106, 374]], true) + '"/><path class="gm-tube" d="M106 375Q100 372 104 380.6M124 375Q130 372 126 380.6"/>';
  o.SCROT = '<path class="gm-skinb" d="' + bzc([[X0, 428], [125, 434], [129, 448], [124, 460], [X0, 463], [106, 460], [101, 448], [105, 434]], true) + '"/><path class="gm-raphe" d="M' + X0 + " 432V461" + '"/>';
  /* the glands */
  o.HYPO = '<ellipse class="gm-g gm-gh" cx="' + X0 + '" cy="60" rx="8" ry="4.2"/>';
  o.PIT = '<path class="gm-stalk" d="M' + X0 + " 64V69" + '"/><ellipse class="gm-g gm-gp" cx="' + X0 + '" cy="72.5" rx="4.8" ry="4"/>';
  o.THY = '<path class="gm-g gm-gt" d="' + bzc([[108.5, 110], [111.5, 113], [113, 120], [117, 120.5], [118.5, 113], [121.5, 110], [124.5, 114], [125, 124], [121.5, 129], [118, 125], [X0, 124.5], [112, 125], [108.5, 129], [105, 124], [105.5, 114]], true) + '"/>';
  o.PARA = [[104.6, 114.5], [125.4, 114.5], [104.8, 125.5], [125.2, 125.5]].map((c) => '<ellipse class="gm-g gm-gpt" cx="' + c[0] + '" cy="' + c[1] + '" rx="2.7" ry="2.2"/>').join("");
  o.ADR = '<path class="gm-g gm-ga" d="M80 254C80 247 86 241 91 240C95 242 99 248 99 254C94 252.5 85 252.5 80 254Z"/><path class="gm-g gm-ga" d="M132 249C133 242 140 236 147 237C151 240 152 246 150 251C145 249 137 248 132 249Z"/>';
  o.PANC = '<path class="gm-g gm-gn" d="' + bzc([[92, 284], [99, 276], [111, 277], [127, 271], [143, 262], [154, 257], [158, 261], [151, 269], [134, 279], [116, 286.5], [104, 294], [94, 292.5]], true) + '"/><path class="gm-lob" d="M104 283c2-2 4 2 6 0M120 279c2-2 4 2 6 0M136 271c2-2 4 2 6 0"/>';
  o.OVA = '<ellipse class="gm-g gm-go" cx="97.5" cy="384" rx="6.5" ry="4.5"/><ellipse class="gm-g gm-go" cx="132.5" cy="384" rx="6.5" ry="4.5"/>';
  o.TES = '<ellipse class="gm-g gm-gs" cx="109.5" cy="449" rx="5.4" ry="7.4"/><ellipse class="gm-g gm-gs" cx="120.5" cy="450" rx="5.4" ry="7.4"/>';
  /* the adrenal, magnified: cortex outside, medulla in the core */
  o.INSET = { cx: 196, cy: 212,
    cortex: "M171 226C171 208 184 192 198 190C210 192 222 206 222 224C211 219 183 219 171 226Z",
    medulla: "M182 220C184 210 191 202 198 201C205 203 212 211 213 219C204 216.5 191 216.5 182 220Z" };
  return o;
}

/* ---------- the cards: the notes' rows for each gland ---------- */
const GL = {
  hp: { title: "Hypothalamus and pituitary", sub: "the control center",
    makes: [["Hypothalamus", "releasing and inhibiting hormones, to the pituitary"], ["Anterior pituitary", "ACTH (adrenal cortex), TSH (thyroid), GH (growth), FSH and LH (reproduction), prolactin (lactation)"], ["Posterior pituitary", "ADH (conserves water) and oxytocin"]],
    cols: [["Growth hormone excess", "up"], ["Too little ADH", "dn"]],
    rows: [["What it is", "Before puberty: very tall, 7 feet or more. After puberty: acromegaly", "Diabetes insipidus: the kidneys let out far too much fluid; always thirsty"],
      ["In the mouth", "The mandible grows: Class I to edge-to-edge or Class III; diastemas; macroglossia", "None given"]],
    mouth: [["acro", { gums: true, c3: true, gaps: true }, "Acromegaly: Class III, diastemas"], null],
    notes: [["Implants", "the sex hormones fuse the growth plates at puberty: wait for growth to stop"], ["Not diabetes mellitus", "same first word, different hormone"]] },
  thy: { title: "Thyroid", sub: "in the neck, over the trachea",
    makes: [["T3 and T4", "metabolism, the body's thermostat; regulated by TSH"], ["Calcitonin", "released when blood calcium rises; reverses PTH's effects on bone"]],
    cols: [["Hyperthyroidism", "up"], ["Hypothyroidism", "dn"]],
    rows: [["How often you'll see it", "On occasion", "Far more often"], ["Weight", "Loss", "Gain"], ["Heart rate", "Tachycardia", "Bradycardia"], ["Other", "Heat intolerance", "Fatigue"],
      ["Eruption in children", "Accelerated", "Delayed"], ["Other dental points", "Increased sensitivity to epinephrine; avoid excessive vasoconstrictor when uncontrolled", "Macroglossia; delayed wound healing"]],
    mouth: [null, ["hypothy", { open: true, big: true }, "Hypothyroidism: macroglossia"]],
    notes: [["Thyroid storm", "high fever, heart rate 140 or higher, agitation, delirium: call 911"], ["Surgery", "find the recurrent laryngeal nerve: damage leaves a hoarse, raspy voice"]] },
  para: { title: "Parathyroids", sub: "four glands, behind the thyroid",
    makes: [["PTH", "the fast-acting calcium regulator: osteoclasts resorb bone, the kidney reabsorbs calcium, calcitriol so the gut absorbs more"]],
    cols: [["Hyperparathyroidism", "up"], ["Hypoparathyroidism", "dn"]],
    rows: [["What it does", "Too much bone resorption; at times osteoporosis", "Hypocalcemia"], ["Signs", "Tooth mobility", "Neuromuscular irritability; tetany"],
      ["On the radiograph", "Loss of the lamina dura; brown tumors (radiolucent)", "None given"], ["Dental care", "A brown tumor: ask about other symptoms, refer to the physician", "None given"]],
    mouth: [["hyperpara", { film: true }, "Hyperparathyroidism: the film"], null],
    notes: [["Vitamin D", "the long-term regulator, activated in the kidney"]] },
  cortex: { title: "Adrenal cortex", sub: "the outer layer of each adrenal, on the kidney",
    makes: [["Cortisol", "stress response, immune regulation, glucose metabolism"], ["Aldosterone", "sodium retention, potassium regulation"]],
    cols: [["Addison disease", "dn"], ["Cushing syndrome", "up"]],
    rows: [["Cortisol", "Too little (often with low aldosterone)", "Too much (or long-term steroid therapy)"], ["Clinical features", "Hypotension, fatigue, hyperpigmentation", "Moon face, buffalo hump, hyperglycemia"],
      ["In the mouth", "Brown patches; diffuse oral melanosis", "Increased infection risk, delayed healing"], ["Emergency", "Adrenal crisis; extra steroid after a big procedure", "None listed"]],
    mouth: [["addison", { gums: true, mel: true }, "Addison disease: brown patches"], null],
    notes: [["Why brown", "low cortisol lets ACTH rise, and ACTH stimulates melanocytes"], ["Crisis triggers", "long or stressful surgery, infection or trauma, a missed steroid dose"]] },
  med: { title: "Adrenal medulla", sub: "the core of each adrenal",
    makes: [["Epinephrine and norepinephrine", "amines (his example): fight or flight. The heart speeds up, vessels constrict, the bronchioles dilate, the stomach stops moving"]],
    cols: [["Dental significance", "eq"]],
    rows: [["", "Vasoconstrictor use: the epinephrine in local anesthetics"], ["", "Stress management during treatment"]],
    notes: [["Memory tool", "a corticosteroid comes from the adrenal cortex; the medulla is epinephrine and norepinephrine"], ["Hyperthyroidism", "increased sensitivity to epinephrine: avoid excessive vasoconstrictor when uncontrolled"]] },
  panc: { title: "Pancreas", sub: "its islets' two opposite hormones",
    makes: [["Alpha cells: glucagon", "breaks down glycogen, drives gluconeogenesis"], ["Beta cells: insulin", "a peptide (his example); moves glucose into muscle and fat; the storage hormone"]],
    cols: [["Type 1 diabetes", "eq"], ["Type 2 diabetes", "eq"]],
    rows: [["Cause", "Autoimmune destruction of the beta cells", "Insulin resistance"], ["Insulin", "None made: insulin injections to survive", "Hyperinsulinemia: ineffective, not deficient"], ["Usually", "Starts young", "Production may decline over time"],
      ["In the mouth, both", "Xerostomia (most common, not specific), candidiasis, burning mouth, delayed healing, more periodontal disease and caries", null]],
    mouth: [["dm", { open: true, cand: true, red: true }, "Diabetes: candidiasis"], "span"],
    notes: [["HbA1c above 7", "poorly controlled: implant failure, periodontal disease"], ["Glucose under 60", "give straight glucose; IV dextrose or glucagon if that fails"], ["Schedule", "mornings, after the meal and medications"]] },
  gonf: { title: "Ovaries", sub: "the sex hormones, driven by the pituitary",
    makes: [["Estrogen and progesterone", "steroids (estrogen is his example); higher in pregnancy, falling at menopause"]],
    cols: [["Puberty", "eq"], ["Pregnancy", "eq"], ["Menopause", "eq"]],
    rows: [["Oral effects", "Increased gingival inflammation", "Pregnancy gingivitis; pyogenic granuloma (\"pregnancy tumor\"), usually interproximal", "Xerostomia; altered taste; osteoporosis implications"]],
    mouth: [["puberty", { gums: true, red: true }, "Puberty: gingival inflammation"], ["preg", { gums: true, red: true, gp: true, pg: true }, "Pregnancy: pyogenic granuloma"], null],
    notes: [["Growth plates", "puberty's sex hormones fuse them: wait for growth to stop before an implant"]] },
  gonm: { title: "Testes", sub: "the sex hormones, driven by the pituitary",
    makes: [["Testosterone", "a steroid (his example); aromatase converts it to estrogen"]],
    cols: [["Puberty", "eq"], ["Pregnancy", "off"], ["Menopause", "off"]],
    rows: [["Oral effects", "Increased gingival inflammation", "The ovaries' stage: switch to Female", "The ovaries' stage: switch to Female"]],
    mouth: [["puberty", { gums: true, red: true }, "Puberty: gingival inflammation"], null, null],
    notes: [["Growth plates", "puberty's sex hormones fuse them: wait for growth to stop before an implant"]] },
};
const VINFO = {
  acro: "Acromegaly: the growing mandible brings the lower teeth forward (Class I to edge-to-edge or Class III), and the bigger arch opens diastemas between the teeth. The tongue enlarges too (macroglossia), but the jaw and the spacing are what point to growth hormone.",
  hypothy: "Hypothyroidism: macroglossia, an enlarged tongue. It appears with growth hormone excess too, so the rest of the history decides.",
  hyperpara: "Hyperparathyroidism on the film: the lamina dura, the white line around each root, is lost, and a brown tumor shows as a radiolucent (dark) area.",
  addison: "Addison disease: brown and black patches on the gums and tongue; the more extensive form is diffuse oral melanosis. If you see them, have the patient checked.",
  dm: "Diabetes: candidiasis (the white patches), with inflamed gums from periodontal disease. Xerostomia, the most common finding, can't be drawn.",
  puberty: "Puberty: increased gingival inflammation, red and swollen gums.",
  preg: "Pregnancy: pregnancy gingivitis, and a pyogenic granuloma (the \"pregnancy tumor\"), an overgrowth of gum tissue, usually interproximal.",
};
/* the layout: the body on the left of the top band, the gland's side column beside it (what it makes, the drawn mouths,
   the reminders), and its disorders compared row by row below, full width, so the text reads at phone width */
const W = 440, BAND = 490, X1 = 248, CW1 = 178, TX = 20, TW = 400;
function card(G) {
  let o = "", y = 34;
  /* the side column */
  wrap(G.title, CW1, 17, true).forEach((ln) => { o += tx(X1, y, esc(ln), "gm-ttl", "start"); y += 20; });
  if (G.sub) { y -= 3; wrap(G.sub, CW1, 12, false).forEach((ln) => { o += tx(X1, y, esc(ln), "gm-sub", "start"); y += 15; }); }
  y += 8; o += tx(X1, y, "MAKES", "gm-cap", "start"); y += 17;
  for (const m of G.makes) { const r = rich(X1, y, m[0], m[1], CW1, 12.5, 15); o += r[0]; y += r[1] * 15 + 5; }
  const ms = (G.mouth || []).map((m, i) => (m && m !== "span" ? [m, i] : null)).filter(Boolean);
  if (ms.length) {
    o += '<path class="gm-rule" d="M240 ' + f1(y - 2) + "H432" + '"/>'; y += 14;
    o += tx(X1, y, "WHAT IT LOOKS LIKE", "gm-cap", "start"); y += 4;
    ms.forEach(([m, i]) => {
      const c = G.cols[Math.min(i, G.cols.length - 1)], sc = 1.4, h = 64 * sc;
      y += 15; o += tx(X1, y, esc(m[2]), "gm-mc gm-" + c[1], "start"); y += 5;
      o += HOT(VINFO[m[0]], '<g transform="translate(' + f1(X1) + " " + f1(y) + ") scale(" + sc + ')">' + mouth(m[1]) + "</g>");
      y += h + 4;
    });
  }
  if (G.notes && G.notes.length) {
    o += '<path class="gm-rule" d="M240 ' + f1(y + 4) + "H432" + '"/>'; y += 20;
    o += tx(X1, y, "KEEP IN MIND", "gm-cap", "start"); y += 17;
    for (const m of G.notes) { const r = rich(X1, y, m[0], m[1], CW1, 12.5, 15); o += HOT(m[0] + ": " + m[1] + ".", r[0]); y += r[1] * 15 + 5; }
  }
  const T0 = Math.max(BAND, y + 4) + 8;
  o = '<rect class="gm-card" x="238" y="8" width="196" height="' + f1(T0 - 16) + '" rx="12"/>' + o;
  /* the table, full width: the row labels in a column of their own, as in the notes' tables */
  let t = "";
  y = T0 + 26;
  const n = G.cols.length, gap = 14, LW = G.rows.some((r) => r[0]) ? 80 : 0, C0 = TX + (LW ? LW + 12 : 0);
  const cw = (TX + TW - C0 - gap * (n - 1)) / n, cx = (i) => C0 + i * (cw + gap);
  let hh = 0; const heads = G.cols.map((c) => wrap(c[0], cw, 13, true)); heads.forEach((h) => { hh = Math.max(hh, h.length); });
  const colInfo = G.cols.map((c, i) => c[0] + ": " + G.rows.map((r) => (r[0] ? r[0] + ": " : "") + (r[i + 1] || r[1])).join(". ") + ".");
  const colSvg = G.cols.map(() => "");
  G.cols.forEach((c, i) => { let s = ""; heads[i].forEach((ln, j) => { s += tx(cx(i), y + j * 16, esc(ln), "gm-ch gm-" + c[1], "start"); }); s += '<rect class="gm-bar gm-' + c[1] + '" x="' + f1(cx(i)) + '" y="' + f1(y + 6 + (hh - 1) * 16) + '" width="' + f1(cw) + '" height="3" rx="1.5"/>'; colSvg[i] += s; });
  y += 6 + (hh - 1) * 16 + 23;
  G.rows.forEach((r, k) => {
    let mx = 1, ml = 0;
    if (k) t += '<path class="gm-hair" d="M' + TX + " " + f1(y - 13) + "H" + (TX + TW) + '"/>';
    if (r[0]) { const ls = wrap(r[0], LW, 11.5, true); ls.forEach((ln, j) => { t += tx(TX, y + j * 14, esc(ln), "gm-rl", "start"); }); ml = ls.length * 14 - 15; }
    if (r[2] === null) { /* one cell across the columns */
      const ls = wrap(r[1], TX + TW - C0, 12.5, false); ls.forEach((ln, j) => { t += tx(C0, y + j * 15, esc(ln), "gm-tx", "start"); }); mx = ls.length;
    } else G.cols.forEach((c, i) => { const ls = wrap(r[i + 1], cw, 12.5, false); ls.forEach((ln, j) => { colSvg[i] += tx(cx(i), y + j * 15, esc(ln), "gm-tx" + (c[1] === "off" || r[i + 1] === "None given" || r[i + 1] === "None listed" ? " mut" : ""), "start"); }); mx = Math.max(mx, ls.length); });
    y += Math.max(mx * 15, ml + 15) + 11;
  });
  G.cols.forEach((c, i) => { t += HOT(colInfo[i], colSvg[i]); });
  return { svg: o, table: t, t0: T0, h: y };
}

/* ---------- page helpers (serialized) ---------- */
function gmWire(D) {
  /* tapping a gland in the drawing presses its button, so the one live controller handles it */
  if (D._w || typeof document === "undefined") return; D._w = 1;
  document.addEventListener("click", function (e) {
    var g = e.target && e.target.closest && e.target.closest("[data-gm]"); if (!g) return;
    var r = g.closest("[data-anima]"), b = r && r.querySelector('button[data-amk="g"][data-amv="' + g.getAttribute("data-gm") + '"]');
    if (b && b.getAttribute("aria-pressed") !== "true") b.click();
  });
}
function gmTap(key, info, inner, on) { return '<g class="hot gm-tap' + (on ? " is-on" : "") + '" data-gm="' + key + '" data-info="' + info.replace(/"/g, "&quot;") + '">' + inner + "</g>"; }
function gmLab(x, y, s, px, py, a, on) {
  return '<path class="lead' + (on ? " gm-lon" : "") + '" d="M' + f1(a === "end" ? x + 3 : x - 3) + " " + f1(y - 4) + "L" + f1(px) + " " + f1(py) + '"/><circle class="dot" cx="' + f1(px) + '" cy="' + f1(py) + '" r="1.8"/>' + T(x, y, s, "gm-lab" + (on ? " gm-lsel" : ""), a);
}
function gmRender(st, D) {
  gmWire(D);
  var g = st.g, m = st.sx === "m", o = "", I = D.INSET, key = g === "gon" ? (m ? "gonm" : "gonf") : g;
  function on(k) { return g === k; }
  /* the body */
  o += HOT(D.INFO.body, D.TORSO + (m ? D.SCROT : "") + D.HEAD);
  o += HOT(D.INFO.brain, D.BRAIN) + HOT(D.INFO.trach, D.TRACH) + HOT(D.INFO.kid, D.KID) + (m ? "" : HOT(D.INFO.uterus, D.UTERUS));
  /* glands: the selected one(s) get a halo */
  o += gmTap("hp", D.INFO.hp, (on("hp") ? '<ellipse class="gm-halo" cx="115" cy="66" rx="14" ry="13"/>' : "") + D.HYPO + D.PIT, on("hp"));
  o += gmTap("para", D.INFO.para, (on("para") ? '<ellipse class="gm-halo" cx="115" cy="120" rx="17" ry="14"/>' : "") + D.PARA, on("para"));
  o += gmTap("thy", D.INFO.thy, (on("thy") ? '<ellipse class="gm-halo" cx="115" cy="120" rx="17" ry="14"/>' : "") + '<g opacity="' + (on("para") ? ".35" : "1") + '">' + D.THY + "</g>", on("thy"));
  var ad = on("cortex") || on("med");
  o += gmTap(on("med") ? "med" : "cortex", D.INFO.adr, (ad ? '<ellipse class="gm-halo" cx="89.5" cy="248" rx="15" ry="11"/><ellipse class="gm-halo" cx="141" cy="244" rx="15" ry="11"/>' : "") + D.ADR, ad);
  o += gmTap("panc", D.INFO.panc, (on("panc") ? '<path class="gm-halo" d="M88 288C92 270 140 252 162 256C166 270 120 300 88 288Z"/>' : "") + D.PANC, on("panc"));
  o += gmTap("gon", m ? D.INFO.tes : D.INFO.ova, (on("gon") ? (m ? '<ellipse class="gm-halo" cx="115" cy="449" rx="17" ry="14"/>' : '<ellipse class="gm-halo" cx="97.5" cy="384" rx="11" ry="9"/><ellipse class="gm-halo" cx="132.5" cy="384" rx="11" ry="9"/>') : "") + (m ? D.TES : D.OVA), on("gon"));
  /* bigger tap targets over the small glands, so a finger finds them on a phone */
  var hit = function (k, info, shapes) { return gmTap(k, info, shapes.map(function (e) { return '<ellipse class="gm-hit" cx="' + e[0] + '" cy="' + e[1] + '" rx="' + e[2] + '" ry="' + e[3] + '"/>'; }).join(""), false); };
  o += hit("hp", D.INFO.hp, [[115, 66, 11, 12]]) + hit("thy", D.INFO.thy, [[115, 120, 9, 8.5]]) + hit("para", D.INFO.para, [[104.6, 114.5, 5, 5], [125.4, 114.5, 5, 5], [104.8, 125.5, 5, 5], [125.2, 125.5, 5, 5]]);
  o += hit(on("med") ? "med" : "cortex", D.INFO.adr, [[89.5, 248, 12, 9], [141, 244, 12, 9]]);
  o += m ? hit("gon", D.INFO.tes, [[115, 450, 13, 11]]) : hit("gon", D.INFO.ova, [[97.5, 384, 10, 8], [132.5, 384, 10, 8]]);
  /* the magnified adrenal: cortex and medulla, each its own entry */
  o += '<path class="gm-zoom" d="M147 238L171 226M147 238L222 224"/>';
  o += gmTap("cortex", D.INFO.cortex, '<path class="gm-g gm-ga' + (on("cortex") ? " gm-sel" : "") + '" d="' + I.cortex + '"/>', on("cortex"));
  o += gmTap("med", D.INFO.med, '<path class="gm-g gm-gm' + (on("med") ? " gm-sel" : "") + '" d="' + I.medulla + '"/>', on("med"));
  o += gmLab(176, 180, "cortex", 186, 199, "start", on("cortex")) + gmLab(198, 244, "medulla", 205, 213, "middle", on("med"));
  /* labels */
  o += gmLab(84, 79, "pituitary", 110.5, 73, "end", on("hp")) + gmLab(150, 46, "hypothalamus", 122, 59, "start", on("hp"));
  o += gmLab(98, 106, "thyroid", 107, 116, "end", on("thy")) + gmLab(140, 104, "parathyroids", 127.5, 113.5, "start", on("para"));
  o += gmLab(64, 246, "adrenal", 85, 247, "end", ad) + gmLab(178, 300, "pancreas", 150, 268, "start", on("panc"));
  o += m ? gmLab(64, 470, "testes", 107, 455, "end", on("gon")) : gmLab(64, 388, "ovaries", 93, 385, "end", on("gon"));
  /* the card */
  var C = D.CARDS[key];
  o += C.svg + '<rect class="gm-card" x="8" y="' + C.t0 + '" width="426" height="' + f1(C.h - C.t0 + 2) + '" rx="12"/>' + C.table;
  return o;
}
function gmSay(st, D) {
  var key = st.g === "gon" ? (st.sx === "m" ? "gonm" : "gonf") : st.g;
  return [D.SUM[key], D.RO[key]];
}

const SUM = {
  hp: "Hypothalamus and pituitary, the control center: the hypothalamus sends releasing and inhibiting hormones to the pituitary, and the anterior pituitary's hormones drive the other glands: ACTH (adrenal cortex stimulation), TSH (thyroid stimulation), GH (growth regulation), FSH and LH (reproductive function) and prolactin (lactation). The posterior pituitary has ADH (conserves water) and oxytocin.\nGrowth hormone excess: before puberty, while the long bones are open, a very tall person (7 feet or more); after puberty, acromegaly. Look for the jaw: the mandible grows, so the bite moves from Class I to edge-to-edge or Class III, diastemas open, and the tongue enlarges (macroglossia).\nToo little ADH: diabetes insipidus. The kidneys let out far too much fluid, so the patient is very thirsty all the time. It is not diabetes mellitus.\nDental care: the sex hormones fuse the growth plates at puberty, so wait for growth to stop before placing an implant.",
  thy: "Thyroid: T3 and T4, regulated by TSH, run metabolism, the body's thermostat. Calcitonin is released when blood calcium rises and reverses PTH's effects on bone.\nHyperthyroidism (seen on occasion): weight loss, tachycardia, heat intolerance, and accelerated eruption in children. Increased sensitivity to epinephrine: avoid excessive vasoconstrictor in uncontrolled disease.\nHypothyroidism (seen far more often): weight gain, bradycardia, fatigue, and delayed eruption. In the mouth: macroglossia and delayed wound healing.\nThyroid storm: high fever, a heart rate of 140 or higher, agitation, delirium. Call 911.\nThyroid and parathyroid surgery: the surgeon finds the recurrent laryngeal nerve first; damage to it leaves a hoarse, raspy voice.",
  para: "Parathyroids: four glands behind the thyroid. PTH is the fast-acting calcium regulator: osteoclasts resorb bone, the kidney reabsorbs calcium, and calcitriol makes the gut absorb more. Vitamin D, activated in the kidney, is the long-term regulator.\nHyperparathyroidism: too much bone resorption, at times osteoporosis. On the radiograph: loss of the lamina dura and brown tumors (radiolucent), with tooth mobility. If you find a brown tumor, ask about other symptoms and send the patient to their physician.\nHypoparathyroidism: hypocalcemia, which shows as neuromuscular irritability and tetany. The lecture gives no mouth finding for it.",
  cortex: "Adrenal cortex: cortisol (stress response, immune regulation, glucose metabolism) and aldosterone (sodium retention, potassium regulation).\nAddison disease: too little cortisol, often with low aldosterone. Hypotension, fatigue and hyperpigmentation: brown patches on the gums and tongue, or diffuse oral melanosis, because low cortisol lets ACTH rise and ACTH stimulates melanocytes. Its emergency is adrenal crisis, set off by long or stressful surgery, significant infection or trauma, or a missed steroid dose; after a bigger procedure the patient may need supplemental corticosteroid, the dose agreed with the physician.\nCushing syndrome: too much corticosteroid (or long-term steroid therapy). Moon face, buffalo hump, hyperglycemia; in the mouth, plan for an increased infection risk and delayed healing.",
  med: "Adrenal medulla: epinephrine and norepinephrine (amines, his example), the fight-or-flight hormones: the heart speeds up, vessels constrict, the bronchioles dilate and the stomach stops moving.\nDental significance: vasoconstrictor use (the epinephrine in local anesthetics) and stress management during treatment.\nMemory tool: a corticosteroid comes from the adrenal cortex; the medulla is epinephrine and norepinephrine.",
  panc: "Pancreas: alpha cells make glucagon, which breaks down glycogen and drives gluconeogenesis; beta cells make insulin (a peptide, his example), the storage hormone, which moves glucose into muscle and fat.\nType 1 diabetes: autoimmune destruction of the beta cells, so no insulin: insulin injections to survive. It usually starts young.\nType 2 diabetes: insulin resistance, with hyperinsulinemia: the insulin is ineffective, not deficient. Production may decline over time.\nIn the mouth: xerostomia (the most common, but not specific), candidiasis, burning mouth syndrome, delayed healing, and more periodontal disease and caries. Sugar in the saliva feeds Candida and Streptococcus mutans, and the periodontal link runs both ways.\nIn the chair: an HbA1c above 7 is poorly controlled (much higher risk of implant failure and periodontal disease). Confirm the meal and the medication and book mornings. A finger-stick under 60 means give glucose (straight glucose, not table sugar), then IV dextrose or glucagon if that fails.",
  gonf: "Ovaries: estrogen (a steroid, his example) and progesterone, driven by the pituitary. Their oral effects change with the stage of life.\nPuberty: increased gingival inflammation.\nPregnancy: estrogen and progesterone are higher, so the gums overreact: pregnancy gingivitis, and the pyogenic granuloma (the \"pregnancy tumor\"), usually interproximal.\nMenopause: the sex hormones fall: xerostomia, altered taste, and osteoporosis implications.\nPuberty's sex hormones also fuse the growth plates: wait for growth to stop before placing an implant.",
  gonm: "Testes: testosterone (a steroid, his example), driven by the pituitary; aromatase converts testosterone to estrogen.\nPuberty: increased gingival inflammation. The sex hormones also fuse the growth plates, so wait for growth to stop before placing an implant.\nPregnancy and menopause are the ovaries' stages: switch the body to Female to see them.",
};
const RO = { hp: "hypothalamus · pituitary", thy: "thyroid", para: "parathyroids", cortex: "adrenal cortex", med: "adrenal medulla", panc: "pancreas", gonf: "ovaries", gonm: "testes" };
const INFO = {
  body: "A body outline, front view: the patient's right is on your left.",
  brain: "The brain: the hypothalamus sits at its base, with the pituitary hanging below it.",
  trach: "The trachea: the thyroid wraps the front of it, just below the larynx.",
  kid: "A kidney: an adrenal gland sits on top of each one. The kidney also makes the active form of vitamin D.",
  uterus: "The uterus, with the ovaries beside it.",
  hp: "The hypothalamus and pituitary, the control center: the hypothalamus sends releasing and inhibiting hormones to the pituitary.",
  thy: "The thyroid: T3 and T4 (regulated by TSH) and calcitonin.",
  para: "The four parathyroid glands, on the back of the thyroid (drawn through it): PTH.",
  adr: "The adrenal glands, one on each kidney: cortex outside (cortisol, aldosterone), medulla inside (epinephrine, norepinephrine). The magnified one shows both.",
  cortex: "The adrenal cortex, the outer layer: cortisol and aldosterone. A corticosteroid comes from the cortex.",
  med: "The adrenal medulla, the core: epinephrine and norepinephrine.",
  panc: "The pancreas: alpha cells make glucagon, beta cells make insulin.",
  ova: "The ovaries: estrogen and progesterone.",
  tes: "The testes, in the scrotum: testosterone.",
};

export default function glandmap() {
  const B = bodyArt(), CARDS = {}; let H = 0;
  for (const k of Object.keys(GL)) { const c = card(GL[k]); CARDS[k] = { svg: c.svg, table: c.table, t0: c.t0, h: c.h }; H = Math.max(H, c.h); }
  H = Math.ceil(H + 12);
  const D = Object.assign({}, B, { CARDS, SUM, RO, INFO, H, ANIM: false, INIT: { g: "thy", sx: "f" } });
  return makeFig({
    id: "glandmap", lec: "dental", fig: "Fig 1", short: "Glands and the mouth", hint: "tap a gland",
    title: "The endocrine glands and the mouth",
    caption: "Tap a gland on the body (or a button) to see what it makes, its disorders side by side as the notes' tables give them, what each looks like in the mouth and what changes in the chair.",
    W, H,
    label: "A front-view body outline with the hypothalamus and pituitary, the thyroid with the four parathyroids behind it, the adrenal glands on the kidneys with a magnified adrenal showing cortex and medulla, the pancreas, and the ovaries or testes. Beside it, a card for the selected gland: its hormones, its disorders compared row by row, small drawings of the mouth findings, and the dental care points.",
    D, render: gmRender, say: gmSay, helpers: [gmWire, gmTap, gmLab],
    controls: `<div class="am-controls" role="group" aria-label="Gland">${[["hp", "Hypothalamus and pituitary"], ["thy", "Thyroid"], ["para", "Parathyroids"], ["cortex", "Adrenal cortex"], ["med", "Adrenal medulla"], ["panc", "Pancreas"], ["gon", "Ovaries or testes"]].map((b) => `<button type="button" class="am-btn" data-amk="g" data-amv="${b[0]}">${b[1]}</button>`).join("")}</div>
<div class="am-controls" role="group" aria-label="Body"><span>Body:</span><button type="button" class="am-btn" data-amk="sx" data-amv="f">Female</button><button type="button" class="am-btn" data-amk="sx" data-amv="m">Male</button></div>`,
    sources: [
      "From Lecture A's notes (Dr. Taylor, recording and slides): every hormone, disorder, oral finding and dental point on the cards, in its words, with the notes' tables (anterior pituitary hormones; hyperthyroidism vs hypothyroidism; Addison disease vs Cushing syndrome; sex hormones and the mouth) and the three hormone classes' examples (amines, epinephrine and norepinephrine; peptides, insulin; steroids, estrogen or testosterone). Where the notes add another lecture's version (Graves disease as the most common cause of hyperthyroidism, Lecture 11's diagnostic cutoffs), the card keeps Dr. Taylor's.",
      "Gray's Anatomy and Netter's Atlas of Human Anatomy: where each gland sits. The pituitary hangs from the hypothalamus at the base of the brain; the thyroid's two lobes and isthmus wrap the front of the trachea below the larynx, with four parathyroids on the back of the lobes; the adrenals cap the upper poles of the kidneys (the right one pyramidal, the left crescent-shaped), and the right kidney sits a little lower; the pancreas crosses in front of the kidneys, its head on the right and its tail toward the left; the ovaries lie beside the uterus on the pelvic wall, the testes in the scrotum. The adrenal's cortex surrounds its medulla.",
      "Little JW, Falace DA and others, Dental Management of the Medically Compromised Patient, and Neville BW and others, Oral and Maxillofacial Pathology: what the drawn findings look like. Acromegaly's mandibular prognathism (an anterior crossbite) with spaced teeth; macroglossia, drawn with the scalloped tongue edges it leaves against the teeth (unlabeled); Addison disease's patchy brown-black pigment on the attached gingiva; pseudomembranous candidiasis as white plaques on the tongue; gingival inflammation as red, swollen margins and papillae; the pyogenic granuloma as a red, lobulated mass on an interdental papilla, most often on the upper front gingiva; the hyperparathyroid film's lost lamina dura and radiolucent brown tumor.",
      "Schematic: the body is an outline without arms, cut at the thighs, and its glands are enlarged to be tapped; nothing is to scale. The parathyroids are on the back of the thyroid, so they are drawn showing through it when selected. The small mouths are illustrations of each finding, not photographs or cases. Educational, not medical advice.",
    ],
    css: `
.anima[data-anima="glandmap"] .am-svg{max-width:500px}
.anima[data-anima="glandmap"] .am-summary{white-space:pre-line}
.anima[data-anima="glandmap"] .am-controls > span{font:500 .8rem var(--font-body);color:var(--ink-soft)}
.anima .glandmap-svg{--gm-skin:#efd9c7;--gm-skinl:#c9a58c;--gm-lip:#d98a87;--gm-lipl:#a8524f;--gm-cav:#5a1f27;--gm-tooth:#fbf6ea;--gm-toothl:#b9ab93;--gm-gum:#ef9c9a;--gm-guml:#c0605e;
  --gm-red:#e0514f;--gm-tongue:#de8486;--gm-tonguel:#a9484c;--gm-mel:#5b3a2a;--gm-cand:#fbfbf6;--gm-pg:#c22e3a;--gm-f0:#141414;--gm-fb:#666;--gm-fd:#b6b6b6;--gm-fe:#efefef;--gm-fp:#4a4a4a;--gm-ft:#2b2b2b}
:root[data-theme="dark"] .anima .glandmap-svg{--gm-skin:#8a6a58;--gm-skinl:#5e4436}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]) .anima .glandmap-svg{--gm-skin:#8a6a58;--gm-skinl:#5e4436} }
.anima .glandmap-svg .gm-skinb{fill:var(--anatomy-shade-1);stroke:var(--anatomy-mid);stroke-width:1.2}
.anima .glandmap-svg .gm-raphe{fill:none;stroke:var(--anatomy-lo);stroke-width:.8}
.anima .glandmap-svg .gm-ctx{fill:var(--anatomy-shade-2);stroke:var(--anatomy-lo);stroke-width:1}
.anima .glandmap-svg .gm-gyr{fill:none;stroke:var(--anatomy-lo);stroke-width:.9;stroke-linecap:round}
.anima .glandmap-svg .gm-trach{fill:none;stroke:var(--anatomy-lo);stroke-width:1}
.anima .glandmap-svg .gm-ring{fill:none;stroke:var(--anatomy-lo);stroke-width:1.4;opacity:.7}
.anima .glandmap-svg .gm-tube{fill:none;stroke:var(--anatomy-lo);stroke-width:1.2}
.anima .glandmap-svg .gm-stalk{fill:none;stroke:var(--bx-violet);stroke-width:2.4}
.anima .glandmap-svg .gm-g{stroke-width:1.2}
.anima .glandmap-svg .gm-gh{fill:var(--bx-stim);opacity:.85;stroke:var(--anatomy-hi)}
.anima .glandmap-svg .gm-gp{fill:var(--bx-violet-soft);stroke:var(--bx-violet)}
.anima .glandmap-svg .gm-gt{fill:color-mix(in srgb,var(--bx-blood) 30%,var(--bx-eosin));stroke:var(--bx-memb)}
.anima .glandmap-svg .gm-gpt{fill:var(--bx-gold);stroke:var(--anatomy-hi);stroke-width:.8}
.anima .glandmap-svg .gm-ga{fill:var(--bx-gold-soft);stroke:var(--bx-gold);stroke-width:1.4}
.anima .glandmap-svg .gm-gm{fill:color-mix(in srgb,var(--bx-blood) 35%,var(--bx-blood-soft));stroke:var(--bx-blood);stroke-width:1.3}
.anima .glandmap-svg .gm-gn{fill:var(--bx-glu-soft);stroke:var(--bx-glu);stroke-width:1.3}
.anima .glandmap-svg .gm-lob{fill:none;stroke:var(--bx-glu);stroke-width:.9;opacity:.8}
.anima .glandmap-svg .gm-go{fill:var(--bx-violet-soft);stroke:var(--bx-violet)}
.anima .glandmap-svg .gm-gs{fill:var(--bx-blue-soft);stroke:var(--bx-blue)}
.anima .glandmap-svg .gm-sel{stroke:var(--anatomy-lit);stroke-width:2.4}
.anima .glandmap-svg .gm-halo{fill:var(--accent-soft);stroke:var(--anatomy-lit);stroke-width:1.4;stroke-dasharray:3 2.5;opacity:.9}
.anima .glandmap-svg .gm-tap{cursor:pointer}
.anima .glandmap-svg .gm-hit{fill:transparent;stroke:none}
.anima .glandmap-svg .gm-zoom{fill:none;stroke:var(--anatomy-lo);stroke-width:1;stroke-dasharray:3 3}
.anima .glandmap-svg .t.gm-lab{font-size:12.5px}
.anima .glandmap-svg .t.gm-lsel{fill:var(--accent-ink);font-weight:700}
.anima .glandmap-svg .lead.gm-lon{stroke:var(--anatomy-lit);stroke-width:1.2}
.anima .glandmap-svg .gm-card{fill:var(--anatomy-face);stroke:var(--anatomy-lo);stroke-width:1}
.anima .glandmap-svg .gm-rule{fill:none;stroke:var(--anatomy-lo);stroke-width:1}
.anima .glandmap-svg .gm-hair{fill:none;stroke:var(--anatomy-faint);stroke-width:1}
.anima .glandmap-svg .t.gm-ttl{font-size:17px;font-weight:700;fill:var(--anatomy-strong)}
.anima .glandmap-svg .t.gm-sub{font-size:12px;fill:var(--anatomy-muted)}
.anima .glandmap-svg .t.gm-cap{font-size:11px;font-weight:700;letter-spacing:.08em;fill:var(--anatomy-muted)}
.anima .glandmap-svg .t.gm-tx{font-size:12.5px;fill:var(--anatomy-text)}
.anima .glandmap-svg .t.gm-tx.mut{fill:var(--anatomy-muted)}
.anima .glandmap-svg .gm-b{font-weight:700;fill:var(--anatomy-strong)}
.anima .glandmap-svg .t.gm-rl{font-size:11.5px;font-weight:600;fill:var(--anatomy-muted)}
.anima .glandmap-svg .t.gm-ch{font-size:13px;font-weight:700}
.anima .glandmap-svg .t.gm-mc{font-size:12px;font-weight:700;fill:var(--anatomy-strong)}
.anima .glandmap-svg .t.gm-mc.gm-up{fill:var(--bx-hot)}
.anima .glandmap-svg .t.gm-mc.gm-dn{fill:var(--bx-blue)}
.anima .glandmap-svg .t.gm-mc.gm-eq{fill:var(--accent-ink)}
.anima .glandmap-svg .t.gm-ch.gm-up{fill:var(--bx-hot)}
.anima .glandmap-svg .t.gm-ch.gm-dn{fill:var(--bx-blue)}
.anima .glandmap-svg .t.gm-ch.gm-eq{fill:var(--accent-ink)}
.anima .glandmap-svg .t.gm-ch.gm-off{fill:var(--anatomy-muted)}
.anima .glandmap-svg .gm-bar{fill:var(--accent)}
.anima .glandmap-svg .gm-bar.gm-up{fill:var(--bx-hot)}
.anima .glandmap-svg .gm-bar.gm-dn{fill:var(--bx-blue)}
.anima .glandmap-svg .gm-bar.gm-off{fill:var(--anatomy-lo)}
.anima .glandmap-svg .gm-cav{fill:var(--gm-cav)}
.anima .glandmap-svg .gm-tooth{fill:var(--gm-tooth);stroke:var(--gm-toothl);stroke-width:.6}
.anima .glandmap-svg .gm-tooth.gm-front{stroke:#7d6c55;stroke-width:1}
.anima .glandmap-svg .gm-gum{fill:var(--gm-gum);stroke:var(--gm-guml);stroke-width:.6}
.anima .glandmap-svg .gm-gum.gm-red{fill:var(--gm-red);stroke:var(--gm-pg)}
.anima .glandmap-svg .gm-tongue{fill:var(--gm-tongue);stroke:var(--gm-tonguel);stroke-width:.7}
.anima .glandmap-svg .gm-scal{fill:none;stroke:var(--gm-tonguel);stroke-width:.8}
.anima .glandmap-svg .gm-cand{fill:var(--gm-cand);stroke:#d8d4c4;stroke-width:.4}
.anima .glandmap-svg .gm-mel{fill:var(--gm-mel);opacity:.85}
.anima .glandmap-svg .gm-pg{fill:var(--gm-pg);stroke:#8e1c26;stroke-width:.6}
.anima .glandmap-svg .gm-pgh{fill:none;stroke:#f3a3a3;stroke-width:.6}
.anima .glandmap-svg .gm-skin{fill:var(--gm-skin)}
.anima .glandmap-svg .gm-lip{fill:var(--gm-lip);stroke:var(--gm-lipl);stroke-width:.7}
.anima .glandmap-svg .gm-frame{fill:none;stroke:var(--anatomy-mid);stroke-width:.9}
.anima .glandmap-svg .gm-f0{fill:var(--gm-f0)}
.anima .glandmap-svg .gm-fb{fill:var(--gm-fb)}
.anima .glandmap-svg .gm-fg{fill:none;stroke:#707070;stroke-width:1.2;stroke-dasharray:1 3}
.anima .glandmap-svg .gm-fd{fill:var(--gm-fd)}
.anima .glandmap-svg .gm-fe{fill:var(--gm-fe)}
.anima .glandmap-svg .gm-fp{fill:var(--gm-fp)}
.anima .glandmap-svg .gm-ft{fill:var(--gm-ft);stroke:#474747;stroke-width:1.2}
.anima .glandmap-svg .gm-fbox{fill:none;stroke:var(--anatomy-mid);stroke-width:.9}
`,
  });
}
