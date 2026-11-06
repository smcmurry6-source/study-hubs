/* Hub masthead scenes: the top of each hub's Home, drawn in Timmy's ink (style.mjs). viewBox 0 0 600 200, a complete
   scene with its own backdrop in the hub's light tint, so it reads the same on a light or a dark page. Shown about
   1100 x 367 on a laptop and cropped to the middle (x 120-480) on a phone, so the middle carries the scene's main
   object. No people, no Timmy, no words or numbers; no ids, gradients, filters, <text> or <style>.                  */
import { INK, C, TINTS } from "./style.mjs";

/* ---- ink helpers (outer outline 3, detail 2) ---- */
const P = (d, fill, sw = 3) => `<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>`;
const F = (d, fill, op) => `<path d="${d}" fill="${fill}"${op ? ` opacity="${op}"` : ""}/>`;
const O = (d, sw = 3) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>`;
const L = (d, sw = 2, color = INK, op = 1) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"${op < 1 ? ` opacity="${op}"` : ""}/>`;
const H = (d, w = 2.4) => `<path d="${d}" stroke="#fff" stroke-width="${w}" stroke-linecap="round" fill="none" opacity=".6"/>`;
const S = (d, fill, shade, shadeFill, sw = 3) => F(d, fill) + F(shade, shadeFill) + O(d, sw);
const ROD = (d, w, color) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + 3}" stroke-linecap="round" stroke-linejoin="round"/>` +
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const CIRC = (cx, cy, r, fill, sw = 3) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${INK}" stroke-width="${sw}"/>`;
const G = (t, s) => `<g transform="${t}">${s}</g>`;

/* rounded rectangle path, and the bands that shade one side of it (band width s >= radius r) */
const rr = (x, y, w, h, r) => `M${x + r} ${y} H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} H${x + r} Q${x} ${y + h} ${x} ${y + h - r} V${y + r} Q${x} ${y} ${x + r} ${y} Z`;
const bandB = (x, y, w, h, r, s) => `M${x} ${y + h - s} H${x + w} V${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} H${x + r} Q${x} ${y + h} ${x} ${y + h - r} Z`;
const bandR = (x, y, w, h, r, s) => `M${x + w - s} ${y} H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} H${x + w - s} Z`;
const box = (x, y, w, h, r, fill, shade, s, side = "b", sw = 3) => S(rr(x, y, w, h, r), fill, (side === "r" ? bandR : bandB)(x, y, w, h, r, Math.max(s, r)), shade, sw);

/* Timmy's molar outline (widget/pet.js TOOTH, 200-unit frame), scaled into place, with its shade and highlight */
const TOOTH = "M48 86 C42 56 56 34 78 34 C90 34 94 44 100 44 C106 44 110 34 122 34 C144 34 158 56 152 86 C149 106 146 122 144 140 C142 166 138 192 130 210 C126 218 116 218 114 208 C111 190 108 172 100 168 C92 172 89 190 86 208 C84 218 74 218 70 210 C62 192 58 166 56 140 C54 122 51 106 48 86 Z";
function molar(s, cx, top, sw = 3){
  const k = (x, y) => `${((x - 100) * s + cx).toFixed(1)} ${((y - 34) * s + top).toFixed(1)}`;
  const d = TOOTH.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (m, x, y) => k(+x, +y));
  const shade = `M${k(132, 40)} C${k(146, 46)} ${k(154, 62)} ${k(152, 86)} C${k(149, 106)} ${k(146, 122)} ${k(144, 140)} C${k(142, 166)} ${k(138, 192)} ${k(130, 210)} C${k(126, 218)} ${k(118, 216)} ${k(116, 206)} C${k(130, 180)} ${k(136, 140)} ${k(138, 104)} C${k(140, 76)} ${k(138, 54)} ${k(132, 40)} Z`;
  return S(d, C.enamel, shade, C.enamelShade, sw) + H(`M${k(62, 74)} C${k(62, 56)} ${k(70, 46)} ${k(82, 45)}`, 3) + H(`M${k(66, 96)} L${k(67, 106)}`, 3);
}
const ground = (t) => `<rect x="0" y="0" width="600" height="200" fill="${t.light}"/>`;
/* a bench: the top edge-on, then a cabinet front with doors and pulls */
function bench(y, t, top = C.wood, topShade = C.woodShade){
  let s = S(`M-4 ${y} H604 V${y + 9} H-4 Z`, top, `M-4 ${y + 6} H604 V${y + 9} H-4 Z`, topShade);
  s += S(`M-4 ${y + 9} H604 V204 H-4 Z`, t.mid, `M-4 ${y + 9} H604 V${y + 15} H-4 Z`, t.ink);
  [150, 300, 450].forEach(x => { s += L(`M${x} ${y + 16} V204`, 2.4); });
  [[128, 172], [278, 322], [428, 472]].forEach(([a, b]) => { s += P(rr(a + 8, y + 26, 28, 6, 3), C.metal, 2); });
  return s;
}
/* a pushpin: a domed head and the shadow of its point */
const pin = (x, y, c = C.red) => P(`M${x - 6} ${y + 2} C${x - 6} ${y - 6} ${x + 6} ${y - 6} ${x + 6} ${y + 2} C${x + 6} ${y + 5} ${x - 6} ${y + 5} ${x - 6} ${y + 2} Z`, c, 2) + H(`M${x - 3} ${y - 1} L${x - 1} ${y - 3}`, 2);

const T = TINTS;

/* ======================= Occlusion: the lab bench ======================= */
function occlusion(){
  const t = T["occlusion"];
  let s = ground(t);
  /* a faint pegboard on the wall */
  let dots = ""; for (let x = 24; x < 600; x += 36) for (let y = 18; y < 140; y += 36) dots += `<circle cx="${x}" cy="${y}" r="2.2"/>`;
  s += `<g fill="${t.mid}" opacity=".28">${dots}</g>`;

  /* the facebow, hung flat on a hook: the bow, the ear plugs at the back of its arms, the bite fork with its wax */
  s += P(rr(104, 3, 16, 8, 2), C.metal, 2) + L("M112 11 V20 C112 25 118 25 118 20", 2.6);
  s += ROD("M60 108 L56 52 C55 34 72 26 112 26 C152 26 170 34 168 52 L164 108", 7, t.mid);
  s += H("M62 92 L59 54 C59 40 72 33 98 31", 2);
  s += P(rr(48, 104, 22, 14, 6), C.paper, 2.4) + P(rr(154, 104, 22, 14, 6), C.paper, 2.4);
  s += P(rr(102, 22, 20, 14, 3), C.metal, 2.4);
  s += ROD("M112 36 L112 66", 3, C.metal);
  s += P("M94 70 C94 92 130 92 130 70 L123 70 C123 84 101 84 101 70 Z", C.metal, 2.4);
  s += P("M96 74 C99 86 125 86 128 74 C124 80 100 80 96 74 Z", C.pink, 1.8);

  /* the bench */
  s += bench(150, t);

  /* a rubber mixing bowl of mounting stone with its spatula */
  s += ROD("M70 112 L40 76", 5, C.wood);
  s += S("M30 120 C30 150 42 150 70 150 C98 150 110 150 110 120 Z", t.ink, "M90 121 C104 121 106 130 104 138 C102 148 96 150 70 150 C92 146 98 136 90 121 Z", "#1C3478");
  s += P("M28 120 C28 112 112 112 112 120 C112 128 28 128 28 120 Z", C.paper, 3);
  s += H("M38 136 C40 142 46 145 54 146", 2.4);

  /* the articulator: base, rear upright, upper member, incisal pin and table, casts mounted on plates */
  const A = [];
  A.push(box(204, 134, 200, 16, 5, t.mid, t.ink, 6));
  A.push(box(214, 56, 22, 80, 3, t.mid, t.ink, 6, "r"));
  A.push(S("M368 134 L373 124 L406 128 L406 134 Z", C.metal, "M372 131 L405 132 L405 134 L369 134 Z", C.metalShade, 2.4));
  /* the casts, in Class I: teeth interdigitate at the occlusal plane (y 92), molars at the back (left), incisors in
     front with the upper incisor overlapping the lower one */
  const crown = (a, w, y0, y1, kind) => {
    const b = a + w, m = a + w / 2, d = Math.sign(y1 - y0);
    const side = (x0, x1) => `M${x0} ${y0} L${x1} ${y1 - d * 5}`;
    let occ;
    if (kind === "m") occ = `Q${a} ${y1} ${a + w * .27} ${y1} Q${m} ${y1 - d * 4} ${b - w * .27} ${y1} Q${b} ${y1} ${b} ${y1 - d * 5}`;
    else if (kind === "p") occ = `C${a} ${y1 - d} ${m - 2} ${y1} ${m} ${y1} C${m + 2} ${y1} ${b} ${y1 - d} ${b} ${y1 - d * 5}`;
    else if (kind === "c") occ = `C${a + 1} ${y1 - d * 2} ${m - 1.6} ${y1 + d * .6} ${m} ${y1 + d * 1.2} C${m + 1.6} ${y1 + d * .6} ${b - 1} ${y1 - d * 2} ${b} ${y1 - d * 5}`;
    else occ = `Q${a} ${y1} ${a + 2.5} ${y1} H${b - 2.5} Q${b} ${y1} ${b} ${y1 - d * 5}`;
    return `${side(a + 1.2, a)} ${occ} L${b - 1.2} ${y0} Z`;
  };
  const LO = [[266, 17.4, "m"], [284, 17.4, "m"], [302, 11.4, "p"], [314, 11.4, "p"], [326, 10.4, "c"], [337, 10, "i"]];
  const UP = [[262, 16.4, "m"], [279, 17.4, "m"], [297, 11.4, "p"], [309, 11.4, "p"], [321, 11.4, "c"], [333, 12.4, "i"]];
  A.push(P(rr(262, 128, 98, 7, 2), C.metal, 2.4));
  A.push(box(264, 114, 94, 15, 3, C.paper, C.paperShade, 5));
  A.push(S("M262 104 H360 V116 H262 Z", C.gum, "M262 112 H360 V116 H262 Z", C.gumShade, 2.4));
  LO.forEach(([a, w, k]) => A.push(P(crown(a, w, 105, 92, k), C.enamel, 2)));
  A.push(P(rr(262, 46, 98, 7, 2), C.metal, 2.4));
  A.push(box(264, 52, 94, 16, 3, C.paper, C.paperShade, 5));
  A.push(S("M262 66 H360 V79 H262 Z", C.gum, "M262 75 H360 V79 H262 Z", C.gumShade, 2.4));
  UP.forEach(([a, w, k]) => A.push(P(crown(a, w, 78, k === "i" ? 96 : 92, k), C.enamel, 2)));
  A.push(H("M268 70 H330", 2) + H("M268 108 H330", 2));
  /* upper member, the incisal pin through its front, the condylar housing at its back with the slanted guide */
  A.push(S("M228 30 H388 Q402 30 402 38 Q402 46 388 46 H228 Q222 46 222 40 V36 Q222 30 228 30 Z", t.mid, "M223 41 H401 Q399 46 388 46 H228 Q223 46 223 41 Z", t.ink));
  A.push(H("M232 34 H330", 2.4));
  A.push(box(386, 18, 8, 116, 3, C.metal, C.metalShade, 3, "r", 2.4));
  A.push(CIRC(390, 14, 6, C.metal, 2.4));
  A.push(S("M208 32 Q208 24 216 24 H240 Q248 24 248 32 V58 Q248 66 240 66 H216 Q208 66 208 58 Z", t.mid, "M240 25 Q247 26 247 32 V58 Q247 65 240 65 H236 V25 Z", t.ink));
  A.push(L("M214 38 L242 52", 6, t.ink));
  A.push(CIRC(221, 41, 6.5, C.metal, 2.4));
  A.push(H("M218 39 L220 37", 2));
  s += A.join("");

  /* articulating paper: its little box with strips peeking out, and two loose strips leaning on it */
  s += P("M428 128 L434 104 L442 104 L436 128 Z", C.blue, 2) + P("M440 128 L448 106 L456 107 L448 128 Z", C.red, 2);
  s += box(418, 122, 60, 28, 3, C.paper, C.paperShade, 6);
  s += F(`M418 132 H478 V138 H418 Z`, t.mid) + O(rr(418, 122, 60, 28, 3), 3);
  s += G("rotate(-18 492 150)", P(rr(486, 112, 9, 38, 2), C.blue, 2.2));
  s += G("rotate(-6 508 150)", P(rr(504, 116, 9, 34, 2), C.red, 2.2));
  /* a pencil on the bench */
  s += P("M518 145 H572 L580 148.5 L572 152 H518 Z", C.yellow, 2.2) + P("M510 145 H518 V152 H510 Q506 152 506 148.5 Q506 145 510 145 Z", C.pink, 2.2) + F("M576 147.4 L580 148.5 L576 149.6 Z", INK);

  /* a TMJ sketch pinned to the wall: fossa and eminence, the condyle, and the disc between them */
  let k = "";
  k += box(452, 16, 118, 92, 3, C.paper, C.paperShade, 6);
  k += L("M466 74 C468 52 476 40 492 38 C506 36 514 48 522 60 C528 68 538 70 548 64 L560 58", 2.6);
  k += P("M483 56 C484 46 492 42 500 43 C508 44 514 50 515 58 C510 54 506 52 499 52 C492 52 487 54 483 56 Z", t.mid, 2);
  k += P("M490 102 C491 92 489 82 487 74 C484 64 490 54 499 54 C508 54 514 62 511 72 C509 80 504 90 503 102", C.enamel, 2.4);
  k += L("M466 90 C470 94 476 96 482 96", 1.6, INK, .5);
  s += G("rotate(4 511 62)", k + pin(511, 22));
  return s;
}

/* ======================= Perio: a probe in the pocket ======================= */
function perio(){
  const t = T["perio"];
  let s = ground(t);
  /* the teeth, front view, centrals in the middle */
  const teeth = [
    [-24, 64, 114, "m"], [40, 58, 110, "m"], [98, 34, 106, "p"], [132, 36, 102, "p"], [168, 42, 94, "c"], [210, 40, 100, "i"], [250, 50, 92, "i"],
    [300, 50, 92, "i"], [350, 40, 100, "i"], [390, 42, 94, "c"], [432, 36, 102, "p"], [468, 34, 106, "p"], [502, 58, 110, "m"], [560, 64, 114, "m"]
  ];
  const side = 18;
  const shape = (a, w, tip, k) => {
    const b = a + w, m = a + w / 2, st = tip + side;
    if (k === "m") return `M${a} 190 V${st} C${a} ${tip} ${a + w * .1} ${tip} ${a + w * .28} ${tip} C${a + w * .42} ${tip} ${m - 3} ${tip + 5} ${m} ${tip + 5} C${m + 3} ${tip + 5} ${b - w * .42} ${tip} ${b - w * .28} ${tip} C${b - w * .1} ${tip} ${b} ${tip} ${b} ${st} V190 Z`;
    if (k === "p") return `M${a} 190 V${st} C${a} ${tip + 6} ${m - 5} ${tip} ${m} ${tip} C${m + 5} ${tip} ${b} ${tip + 6} ${b} ${st} V190 Z`;
    if (k === "c") return `M${a} 190 V${st} C${a + 3} ${tip + 9} ${m - 3} ${tip} ${m} ${tip - 1} C${m + 3} ${tip} ${b - 3} ${tip + 9} ${b} ${st} V190 Z`;
    return `M${a} 190 V${st} C${a} ${tip + 4} ${a + 3} ${tip} ${a + 8} ${tip} H${b - 8} C${b - 3} ${tip} ${b} ${tip + 4} ${b} ${st} V190 Z`;
  };
  teeth.forEach(([a, w, tip, k]) => {
    s += S(shape(a, w, tip, k), C.enamel, `M${a + w * .82} 190 V${tip + side + 16} Q${a + w * .82} ${tip + side + 6} ${a + w} ${tip + side + 2} V190 Z`, C.enamelShade, 3);
    s += H(`M${a + w * .22} ${tip + 22} V${tip + 34}`, 3);
  });

  /* the probe, walked in at mid-facial on the right central: handle to the top right, banded tip in the pocket */
  s += ROD("M326 176 L327 114 C328 104 334 98 346 92", 3.4, C.metal);
  s += ROD("M346 92 L452 28", 12, t.ink);
  s += L("M372 77 L378 87 M384 70 L390 80 M396 63 L402 73 M408 56 L414 66 M420 49 L426 59", 2, "#fff", .45);
  s += H("M358 80 L440 31", 2.4);
  s += L("M326.4 122 V128 M326.3 134 V140", 4.2);
  s += P("M448 30 L462 22 C468 20 472 26 466 30 L452 38 Z", C.metal, 2.4);

  /* the gum: papillae between the teeth, the margin dipping at each tooth's middle */
  const edges = [-24, 40, 98, 132, 168, 210, 250, 300, 350, 390, 432, 468, 502, 560, 624];
  let g = "M-6 204 V150";
  for (let i = 0; i < edges.length - 1; i++) {
    const a = edges[i], b = edges[i + 1], w = b - a, m = a + w / 2, zen = 154, pap = 130;
    g += ` C${a + w * .12} ${pap} ${m - w * .3} ${zen} ${m} ${zen} C${m + w * .3} ${zen} ${b - w * .12} ${pap} ${b} ${pap}`;
  }
  g += " V204 Z";
  s += S(g, C.gum, "M-6 186 C150 180 450 180 606 186 V204 H-6 Z", C.gumShade, 3);
  for (let i = 1; i < edges.length - 1; i++) s += H(`M${edges[i] - 5} ${142} C${edges[i] - 3} ${138} ${edges[i] - 1} ${136} ${edges[i]} ${135}`, 2.2);
  /* the bleeding point the probe raised */
  s += P("M334 147 C336 151 339 153 339 156 C339 158.6 337 160.4 334.4 160.4 C331.8 160.4 330 158.6 330 156 C330 153 332.6 151 334 147 Z", C.red, 2);

  /* the perio chart on its clipboard: tooth row, margin and attachment lines, bleeding points */
  let c = box(40, 14, 106, 100, 6, C.wood, C.woodShade, 8);
  c += box(48, 26, 90, 82, 2, C.paper, C.paperShade, 5, "b", 2.4);
  c += P(rr(74, 8, 38, 16, 4), C.metal, 2.4) + H("M80 13 H104", 2);
  for (let i = 0; i < 6; i++) { const x = 56 + i * 13; c += P(`M${x} 50 C${x} 40 ${x + 1} 36 ${x + 5} 36 C${x + 9} 36 ${x + 10} 40 ${x + 10} 50 L${x + 8} 60 L${x + 2} 60 Z`, C.enamel, 1.6); }
  c += L("M54 52 C60 49 66 55 72 52 C78 49 84 55 90 52 C96 49 102 55 108 52 C114 49 120 55 130 52", 2, C.blue);
  c += L("M54 58 C60 56 66 61 72 58 C78 56 84 62 90 59 C96 57 102 63 108 60 C114 57 120 62 130 59", 2, C.red);
  let grid = ""; for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) grid += rr(56 + i * 13, 70 + r * 11, 10, 8, 1.5) + " ";
  c += L(grid, 1.2, INK, .4);
  [[0, 0], [2, 0], [3, 1], [1, 2], [4, 2], [5, 0]].forEach(([i, r]) => { c += `<circle cx="${61 + i * 13}" cy="${74 + r * 11}" r="2.8" fill="${C.red}"/>`; });
  s += G("rotate(-6 93 64)", c);

  /* a mouth mirror */
  let mi = ROD("M212 70 L262 110", 6, C.metal) + L("M232 86 L236 89 M240 92 L244 95 M248 99 L252 102", 1.6, INK, .5);
  mi += CIRC(196, 56, 22, C.metal, 3) + CIRC(196, 56, 15, C.sky, 2.2) + H("M186 50 C188 45 192 42 197 42", 3);
  s += mi;
  /* a curette: knurled handle, bent shank, curved blade */
  s += ROD("M500 72 L588 40", 9, C.metal);
  s += L("M516 61 L512 71 M530 56 L526 66 M544 51 L540 61 M558 46 L554 56 M572 41 L568 51", 1.6, INK, .5);
  s += ROD("M500 72 C490 76 486 82 486 90 C486 96 482 100 476 101", 3, C.metal);
  s += P("M478 98 C470 99 468 106 474 108 C477 106 478 103 480 101 Z", C.metal, 2);
  return s;
}

/* ======================= PCD Implants: the cutaway model ======================= */
function implants(){
  const t = T["pcd-implants-exam1"];
  let s = ground(t);

  /* the lightbox with two CBCT cross-sections, an implant planned in each */
  s += box(30, 14, 156, 98, 8, C.metalLight, C.metalShade, 9);
  s += P(rr(40, 22, 136, 80, 3), C.paper, 2.4);
  s += P(rr(46, 28, 124, 68, 2), "#2B2230", 2);
  const slice = (cx, tilt) => {
    const out = `M${cx - 5} 36 C${cx + 5} 35 ${cx + 9} 44 ${cx + 13} 56 C${cx + 18} 72 ${cx + 16} 90 ${cx} 90 C${cx - 16} 90 ${cx - 19} 72 ${cx - 14} 56 C${cx - 11} 46 ${cx - 12} 37 ${cx - 5} 36 Z`;
    const inn = `M${cx - 4} 41 C${cx + 3} 41 ${cx + 6} 48 ${cx + 9} 58 C${cx + 13} 72 ${cx + 11} 85 ${cx} 85 C${cx - 11} 85 ${cx - 14} 72 ${cx - 10} 58 C${cx - 8} 49 ${cx - 9} 42 ${cx - 4} 41 Z`;
    return `<path d="${out}" fill="#CFC9D2"/><path d="${inn}" fill="#857E8A"/>` +
      `<circle cx="${cx + 1}" cy="76" r="4.6" fill="#2B2230" stroke="#CFC9D2" stroke-width="1.4"/>` +
      G(`rotate(${tilt} ${cx} 52)`, `<rect x="${cx - 4.5}" y="40" width="9" height="24" rx="2" fill="none" stroke="${t.dark}" stroke-width="2.2"/>`);
  };
  s += slice(84, -4) + slice(132, 6);
  s += P(rr(70, 8, 10, 8, 2), C.metal, 2) + P(rr(136, 8, 10, 8, 2), C.metal, 2);

  s += bench(152, t);

  /* a surgical guide lying on the bench: the clear resin horseshoe, seen from a little above, with its metal sleeves */
  { let g = "";
  g += S("M44 146 C40 124 80 112 120 112 C160 112 200 124 196 146 C194 154 178 155 172 148 C168 134 148 128 120 128 C92 128 72 134 68 148 C62 155 46 154 44 146 Z", "#F2FAFC",
    "M44 146 C44 152 50 154 56 152 C60 151 64 150 68 148 C64 152 58 155 52 155 C47 155 44 151 44 146 Z M196 146 C196 152 190 154 184 152 C180 151 176 150 172 148 C176 152 182 155 188 155 C193 155 196 151 196 146 Z", "#CFE5EC");
  g += F("M50 143 C52 136 60 131 70 127 L72 132 C64 135 58 140 56 146 Z", "#CFE5EC");
  [[62, 136], [92, 120], [148, 120], [178, 136]].forEach(([x, y]) => { g += `<ellipse cx="${x}" cy="${y}" rx="8" ry="4.6" fill="${C.metal}" stroke="${INK}" stroke-width="2.4"/><ellipse cx="${x}" cy="${y}" rx="3.6" ry="2" fill="${INK}"/>`; });
  g += H("M56 128 C70 120 88 116 104 115", 2.4);
  s += G("translate(0 33) scale(1 .78)", g); }

  /* the model: plinth, bone with its cortical shell, two natural teeth, the implant between them, the gum */
  s += box(204, 140, 192, 13, 4, C.paper, C.paperShade, 5);
  s += P("M214 90 H386 V130 Q386 141 375 141 H225 Q214 141 214 130 Z", "#D7C8AA", 3);
  s += F("M222 96 H378 V128 Q378 134 372 134 H228 Q222 134 222 128 Z", C.enamelShade);
  s += `<g fill="${C.woodShade}" opacity=".3">` + [[232, 104, 2.4], [244, 122, 2], [256, 110, 1.6], [268, 126, 2.2], [330, 106, 2], [344, 124, 2.4], [356, 112, 1.6], [370, 126, 2], [262, 98, 1.4], [338, 98, 1.4], [228, 128, 1.6], [372, 104, 1.8]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join("") + "</g>";
  const tooth = (cx) => {
    const d = `M${cx - 19} 70 C${cx - 21} 52 ${cx - 15} 38 ${cx - 6} 37 C${cx - 2} 37 ${cx} 41 ${cx} 41 C${cx} 41 ${cx + 2} 37 ${cx + 6} 37 C${cx + 15} 38 ${cx + 21} 52 ${cx + 19} 70 C${cx + 18} 78 ${cx + 15} 84 ${cx + 13} 90 C${cx + 10} 104 ${cx + 6} 120 ${cx} 126 C${cx - 6} 120 ${cx - 10} 104 ${cx - 13} 90 C${cx - 15} 84 ${cx - 18} 78 ${cx - 19} 70 Z`;
    return S(d, C.enamel, `M${cx + 8} 39 C${cx + 16} 42 ${cx + 21} 54 ${cx + 19} 70 C${cx + 18} 78 ${cx + 15} 84 ${cx + 13} 90 C${cx + 10} 104 ${cx + 6} 120 ${cx} 126 C${cx + 6} 112 ${cx + 12} 84 ${cx + 12} 64 C${cx + 12} 52 ${cx + 11} 44 ${cx + 8} 39 Z`, C.enamelShade, 3) + H(`M${cx - 13} 60 C${cx - 13} 52 ${cx - 10} 45 ${cx - 6} 43`, 2.4);
  };
  s += tooth(240) + tooth(360);
  /* the fixture, threaded, sitting straight in bone */
  let th = ""; for (let y = 102; y < 136; y += 6) { const f = (y - 96) / 42, xl = 284 + f * 4 - 2, xr = 316 - f * 4 + 2; th += `M${xl.toFixed(1)} ${y + 1.6} L${xr.toFixed(1)} ${y - 1.6} `; }
  s += S("M284 96 H316 L312 128 C311 135 306 139 300 139 C294 139 289 135 288 128 Z", t.mid, "M308 97 H316 L312 128 C311 134 308 137 304 138.6 C307 128 308.6 110 308 97 Z", t.ink, 3);
  s += L(th, 2.2) + H("M290 102 L291 122", 2.4);
  /* the gum over the crest, scalloped around each crown */
  s += S("M214 96 V82 C214 76 222 72 230 76 C236 80 244 80 250 76 C258 70 264 68 270 72 C278 78 292 82 300 82 C308 82 322 78 330 72 C336 68 342 70 350 76 C356 80 364 80 370 76 C378 72 386 76 386 82 V96 C340 99 260 99 214 96 Z",
    C.gum, "M214 92 C260 95 340 95 386 92 V96 C340 99 260 99 214 96 Z", C.gumShade, 3);
  /* abutment through the gum, then the crown */
  s += S("M290 70 H310 L313 97 H287 Z", C.metal, "M305 70 H310 L313 97 H308 Z", C.metalShade, 2.6);
  s += S("M274 64 C271 46 278 32 290 31 C295 31 297 35 300 35 C303 35 305 31 310 31 C322 32 329 46 326 64 C325 71 319 75 312 75 H288 C281 75 275 71 274 64 Z",
    C.enamel, "M311 32 C321 34 328 46 326 64 C325 70 320 74 313 75 C318 64 318 44 311 32 Z", C.enamelShade, 3);
  s += H("M280 58 C279 48 283 39 290 37", 2.6);

  /* a torque wrench: ratchet head, beam and its scale, grip */
  s += ROD("M452 140 L562 136", 9, C.metal);
  s += ROD("M532 138.4 L566 137", 9, t.ink);
  s += L("M456 132 L540 124", 2.6);
  s += P(rr(538, 114, 20, 12, 2), C.paper, 2.2) + L("M542 118 V122 M546 118 V122 M550 118 V122 M554 118 V122", 1.4, INK, .7);
  s += CIRC(442, 140, 13, C.metal, 3) + P(rr(437, 135, 10, 10, 1.5), t.ink, 2) + H("M434 134 C436 131 439 129 442 129", 2.2);
  /* the implant's sterile vial */
  s += box(568, 112, 24, 41, 5, C.metalLight, C.paperShade, 6);
  s += P(rr(565, 102, 30, 12, 3), t.ink, 2.4) + F(`M568 128 H592 V142 H568 Z`, C.paper) + L("M568 128 H592 M568 142 H592", 2) + F(`M568 134 H592 V137 H568 Z`, t.mid);
  return s;
}

/* ======================= Heme & Endo 2: the bench ======================= */
function hemeEndo(){
  const t = T["heme-endo-exam2"];
  let s = ground(t);
  /* red cells drifting by: face-on discs with their pale centers, and one seen edge-on */
  const rbc = (cx, cy, rx, ry, rot) => G(`rotate(${rot} ${cx} ${cy})`, `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${C.red}" stroke="${INK}" stroke-width="2.6"/>` +
    `<ellipse cx="${cx + rx * .08}" cy="${cy + ry * .08}" rx="${rx * .48}" ry="${ry * .44}" fill="${t.mid}"/>` + H(`M${cx - rx * .7} ${cy - ry * .2} C${cx - rx * .6} ${cy - ry * .6} ${cx - rx * .3} ${cy - ry * .8} ${cx} ${cy - ry * .82}`, 2.2));
  s += rbc(100, 40, 18, 12, -18) + rbc(160, 66, 12, 8, 16) + rbc(450, 40, 16, 11, 10) + rbc(530, 28, 11, 8, -24) + rbc(560, 72, 18, 12, 22);

  /* the chart, front view of the neck: jaw line, hyoid, thyroid cartilage, cricoid, the trachea's C-shaped rings, and
     the thyroid's two lobes joined by the isthmus over the upper rings */
  let c = box(234, 14, 132, 112, 3, C.paper, C.paperShade, 7);
  c += L("M252 32 C262 46 280 52 300 52 C320 52 338 46 348 32 M270 54 C268 76 266 98 262 120 M330 54 C332 76 334 98 338 120", 2.4, t.mid, .8);
  c += P("M286 56 C290 60 310 60 314 56 L316 52 C318 50 321 51 320 54 L316 62 C310 65 290 65 284 62 L280 54 C279 51 282 50 284 52 Z", C.paper, 2);
  c += P("M281 66 L319 66 C319 76 315 83 309 87 L291 87 C285 83 281 76 281 66 Z", t.light, 2.4) + L("M294 66 L300 72 L306 66", 2) + L("M300 72 V85", 1.6, INK, .4);
  c += P("M290 87 H310 V93 H290 Z", t.light, 2.2);
  c += P(rr(291, 92, 18, 30, 4), C.paper, 2.4);
  let rings = ""; for (let y = 97; y < 121; y += 5) rings += `M292 ${y} C295.5 ${y + 2.6} 304.5 ${y + 2.6} 308 ${y} `;
  c += L(rings, 2, t.mid);
  c += G("translate(0 20) scale(1 .86) translate(0 -2)", S("M300 86 C296 86 293 84 291 80 C289 74 288 64 282 63 C274 62 268 72 268 86 C268 98 271 108 278 108 C284 108 288 100 291 96 C294 95 297 96 300 96 C303 96 306 95 309 96 C312 100 316 108 322 108 C329 108 332 98 332 86 C332 72 326 62 318 63 C312 64 311 74 309 80 C307 84 304 86 300 86 Z",
    t.mid, "M323 72 C326 80 328 94 328 101 C327 105 325 107 322 108 C316 108 312 100 309 96 C308.4 95.6 307.6 95.6 307 95.6 C315 90 320 82 323 72 Z", t.ink, 2.6) + H("M272 86 C272 78 274 71 278 68", 2.2));
  s += G("rotate(-2 300 70)", c + pin(300, 22));

  s += bench(156, t);

  /* a test-tube rack: lavender, red, gold and grey tops */
  const caps = ["#B9A3D6", C.red, C.gold, C.metalShade], fills = [116, 124, 110, 130];
  caps.forEach((cap, i) => {
    const x = 54 + i * 30;
    s += P(`M${x} 102 V146 C${x} 153 ${x + 14} 153 ${x + 14} 146 V102 Z`, C.metalLight, 2.4);
    s += F(`M${x + 1.5} ${fills[i]} H${x + 12.5} V146 C${x + 12.5} 151 ${x + 1.5} 151 ${x + 1.5} 146 Z`, "#8E1F2B");
    s += O(`M${x} 102 V146 C${x} 153 ${x + 14} 153 ${x + 14} 146 V102`, 2.4);
    s += P(rr(x - 2, 90, 18, 14, 3), cap, 2.4);
    s += H(`M${x + 4} 108 V${fills[i] - 4}`, 2);
  });
  s += box(40, 116, 140, 9, 2, C.wood, C.woodShade, 4);
  s += P("M44 125 V156 H52 V125 Z M168 125 V156 H176 V125 Z", C.wood, 2.4);

  /* an insulin pen on the bench: cap, barrel with its dose window, dial */
  s += box(260, 144, 92, 12, 6, C.metalLight, C.paperShade, 6);
  s += P(rr(318, 146, 16, 8, 2), C.paper, 1.8);
  s += box(206, 143, 58, 14, 7, t.ink, "#6E1F1F", 7);
  s += P(rr(216, 139, 30, 5, 2), "#6E1F1F", 2);
  s += P(rr(350, 142, 22, 16, 4), C.metalShade, 2.4) + L("M356 144 V156 M361 144 V156 M366 144 V156", 1.4, INK, .5);

  /* a glucose meter with its strip and a drop on the strip */
  s += box(392, 98, 56, 58, 10, C.paper, C.paperShade, 10);
  s += P(rr(400, 106, 40, 24, 4), "#CFE3D2", 2.4);
  s += P("M420 110 C422 114 425 116 425 119 C425 122 423 124 420 124 C417 124 415 122 415 119 C415 116 418 114 420 110 Z", t.ink, 1.6);
  s += CIRC(410, 142, 5, C.metalShade, 2.2) + CIRC(430, 142, 5, C.metalShade, 2.2);
  s += P(rr(414, 78, 12, 22, 2), C.paper, 2.2) + F("M416 92 H424 V98 H416 Z", C.gold);
  s += P("M420 64 C423 69 426 72 426 75.6 C426 79 423.4 81 420 81 C416.6 81 414 79 414 75.6 C414 72 417 69 420 64 Z", C.red, 2.2);
  /* a vial of insulin */
  s += P(rr(470, 102, 26, 12, 3), C.orange, 2.4);
  s += P("M474 114 H492 V118 H474 Z", C.metal, 2);
  s += box(466, 118, 34, 38, 6, "#F7FBFF", C.metalLight, 8);
  s += F("M466 128 H500 V146 H466 Z", C.paper) + F("M466 134 H500 V139 H466 Z", t.mid) + L("M466 128 H500 M466 146 H500", 2) + O(rr(466, 118, 34, 38, 6), 3);
  s += H("M472 122 V126", 2.2);
  return s;
}

/* ======================= Special Patient Care: a calm corner of the operatory ======================= */
function spc(){
  const t = T["special-patient-care"];
  let s = ground(t);
  /* a wooden floor */
  s += S("M-4 166 H604 V204 H-4 Z", C.wood, "M-4 166 H604 V172 H-4 Z", C.woodShade);
  s += L("M-4 182 H604 M-4 194 H604 M90 172 V182 M260 182 V194 M410 172 V182 M540 182 V194", 1.8, C.woodShade);

  /* the visual schedule, hung on a nail: chair, mirror, toothbrush, then the star; the first two checked off */
  s += L("M44 26 L105 8 L166 26", 2.2) + CIRC(105, 8, 3, C.metal, 2);
  s += box(26, 24, 158, 84, 8, t.ink, "#1E5A37", 9);
  s += P(rr(34, 32, 142, 68, 4), C.paper, 2.4);
  s += F("M34 52 H176 V82 H34 Z", t.light);
  const card = (x, art) => P(rr(x, 46, 30, 36, 3), C.paper, 2.2) + art;
  /* chair */
  s += card(40, P("M46 70 L60 70 L62 64 L50 64 L47 54 L44 55 Z", t.mid, 1.6) + L("M54 70 V76 M50 76 H58", 1.6));
  /* mirror */
  s += card(74, L("M90 64 L96 76", 2.4) + CIRC(87, 58, 6, C.sky, 1.8));
  /* toothbrush */
  s += card(108, L("M113 74 L131 58", 3, C.blue) + P("M128 54 L136 62 L133 65 L125 57 Z", C.paper, 1.6));
  /* the reward star */
  s += card(142, P("M157 52 L159.6 58.6 L166.6 59 L161.2 63.6 L163 70.4 L157 66.6 L151 70.4 L152.8 63.6 L147.4 59 L154.4 58.6 Z", C.gold, 1.6));
  s += L("M50 90 L54 94 L62 86 M84 90 L88 94 L96 86", 2.6, t.ink);

  /* a plant */
  s += P("M60 134 C52 124 42 118 32 118 C36 126 46 132 58 136 Z", C.grass, 2.4) + P("M64 134 C68 122 78 116 90 114 C88 124 78 132 66 136 Z", C.grassShade, 2.4) + P("M62 134 C58 126 60 118 66 112 C71 120 70 128 64 136 Z", C.grass, 2.4);
  s += S("M44 132 H82 L78 166 H48 Z", t.mid, "M70 132 H82 L78 166 H68 Z", t.ink);

  /* the operatory light on its arm, turned low */
  s += ROD("M420 -6 V20 L380 30", 6, C.metal);
  s += S("M352 30 C352 22 390 22 390 30 L386 42 C384 48 358 48 356 42 Z", C.paper, "M380 26 C387 26 390 28 390 30 L386 42 C385 45 380 47 374 47 C380 40 382 32 380 26 Z", C.paperShade);
  s += P("M360 44 C360 40 382 40 382 44 C382 48 360 48 360 44 Z", C.yellow, 2.2);

  /* the chair: base, column, reclined back and headrest, seat, leg rest, armrest */
  s += S("M258 162 C258 156 356 156 356 162 C356 168 258 168 258 162 Z", C.metalShade, "M300 163 C330 163 352 164 356 162 C356 168 300 168 258 162 Z", "#6F7882");
  s += box(296, 126, 22, 36, 3, C.metal, C.metalShade, 6, "r");
  s += S("M246 122 L212 64 C208 56 212 50 220 48 L234 46 C242 45 246 50 250 58 L276 118 Z", t.ink, "M244 50 C248 52 250 56 252 62 L276 118 L266 120 L240 60 Z", "#1E5A37");
  s += S("M204 50 C200 40 206 32 216 30 L232 28 C242 27 246 34 244 42 C242 48 236 50 228 51 L214 53 C210 54 206 54 204 50 Z", t.ink, "M240 31 C245 34 246 38 244 42 C242 48 236 50 228 51 L222 52 C232 46 238 40 240 31 Z", "#1E5A37");
  s += S("M238 116 H382 C390 116 392 128 384 132 H240 C232 132 230 116 238 116 Z", t.ink, "M240 126 H388 C387 129 386 131 384 132 H240 C236 132 234 129 234 126 Z", "#1E5A37");
  s += S("M378 116 L428 138 C436 142 436 152 428 154 L420 156 L372 132 Z", t.ink, "M432 144 C434 150 432 153 428 154 L420 156 L376 134 L384 130 Z", "#1E5A37");
  s += P(rr(262, 100, 60, 8, 4), C.metalShade, 2.4) + L("M290 108 V116", 3);
  s += H("M220 62 L244 110", 2.6) + H("M246 120 H330", 2.4);
  /* the soft blanket over the seat and leg rest, folds hanging at the side */
  const bl = "M262 112 C290 108 340 108 378 112 L426 132 C432 136 432 142 426 144 C418 148 410 146 404 150 C398 152 392 148 386 148 L370 146 C360 152 344 154 330 150 C316 154 296 152 284 146 C274 146 266 140 264 132 Z";
  s += S(bl, C.sky, "M386 148 C392 148 398 152 404 150 C410 146 418 148 426 144 C432 142 432 136 426 132 L420 130 C422 138 412 142 400 142 C392 142 384 140 376 142 Z M284 146 C296 152 316 154 330 150 C344 154 360 152 370 146 C356 146 344 148 330 145 C316 148 298 148 284 146 Z", "#A7CFE2", 3);
  s += L("M276 122 C310 120 346 120 380 124 M282 134 C314 132 348 132 376 136 M386 122 L420 138", 1.8, t.ink, .35);
  s += L("M300 114 C298 124 300 136 304 146 M340 114 C340 124 342 136 346 148", 1.8, t.ink, .35);
  s += H("M270 118 C290 115 320 114 350 115", 2.4);

  /* the tray on its stand: tinted sunglasses and a toothbrush with a big foam grip */
  s += P(rr(508, 124, 10, 40, 2), C.metal, 2.4);
  s += P("M484 166 H544 M492 166 V162 H536 V166", "none", 3) + CIRC(486, 168, 4, C.metalShade, 2) + CIRC(542, 168, 4, C.metalShade, 2);
  s += box(448, 116, 136, 10, 3, C.metal, C.metalShade, 4);
  s += P("M462 104 C462 98 486 98 486 104 C486 112 480 116 474 116 C466 116 462 112 462 104 Z", "#3F6E55", 2.4) + P("M492 104 C492 98 516 98 516 104 C516 112 510 116 504 116 C496 116 492 112 492 104 Z", "#3F6E55", 2.4);
  s += L("M486 103 C488 100 490 100 492 103 M462 102 L456 106 M516 102 L522 106", 2.4);
  s += H("M466 104 L469 101 M496 104 L499 101", 2.2);
  s += box(524, 102, 36, 14, 7, C.orange, "#C9741A", 7);
  s += `<g fill="#C9741A">${[[532, 107], [540, 110], [548, 106], [536, 112], [552, 111]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.3"/>`).join("")}</g>`;
  s += ROD("M560 109 L574 107", 3.4, C.blue);
  s += P("M572 104 H584 V109 H572 Z", C.blue, 2) + P("M573 96 V104 H583 V96 Z", C.paper, 2) + L("M576 97 V103 M580 97 V103", 1.2, INK, .5);
  return s;
}

/* ======================= A new hub: the study desk ======================= */
function generic(){
  const t = T["generic"];
  let s = ground(t);
  /* an exam calendar pinned up, one day circled */
  let cal = box(492, 12, 96, 76, 3, C.paper, C.paperShade, 6) + F("M492 12 H588 V28 H492 Z", t.mid) + O(rr(492, 12, 96, 76, 3), 3);
  let gd = ""; for (let r = 0; r < 4; r++) for (let i = 0; i < 6; i++) gd += rr(500 + i * 14, 34 + r * 13, 10, 9, 1.5) + " ";
  cal += L(gd, 1.2, INK, .4) + L("M554 55 C548 55 546 60 548 64 C550 69 561 69 563 63 C565 57 558 52 552 54", 2.6, C.red);
  s += G("rotate(3 540 50)", cal + pin(540, 18));
  /* the desk: its top seen from a little above, then its edge */
  s += S("M-4 140 H604 V172 H-4 Z", C.wood, "M-4 140 H604 V146 H-4 Z", C.woodShade);
  s += S("M-4 172 H604 V204 H-4 Z", C.woodShade, "M-4 172 H604 V178 H-4 Z", "#6E4A2E");
  s += L("M60 156 H160 M330 162 H460", 1.6, C.woodShade, .7);

  /* the lamp: weighted base, two arms, shade, and its pool of light */
  s += F("M166 82 L178 76 L300 148 L176 148 Z", C.yellow, ".28");
  s += S("M44 152 C44 144 96 144 96 152 C96 158 44 158 44 152 Z", t.ink, "M70 155 C84 155 94 154 96 152 C96 158 70 158 44 153 Z", "#4F424C");
  s += ROD("M70 148 L96 72 L156 46", 6, t.mid);
  s += CIRC(96, 72, 6, t.ink, 2.4) + CIRC(70, 148, 5, t.ink, 2.4);
  s += S("M150 34 L186 58 L174 80 C164 86 150 78 146 66 Z", t.mid, "M172 52 L186 58 L174 80 C170 82 166 82 162 80 Z", t.ink);
  s += P("M162 82 C170 86 178 82 176 76 Z", C.yellow, 2);

  /* the books: one in each live hub's color */
  const bk = [["occlusion", 196, 132, 146, 18], ["perio", 204, 116, 132, 16], ["pcd-implants-exam1", 200, 100, 128, 16], ["heme-endo-exam2", 210, 84, 114, 16], ["special-patient-care", 214, 68, 104, 16]];
  bk.forEach(([h, x, y, w, hh]) => {
    s += box(x, y, w, hh, 3, T[h].ink, T[h].mid, 4);
    s += F(`M${x + w - 12} ${y + 3} H${x + w - 3} V${y + hh - 3} H${x + w - 12} Z`, C.paper) + L(`M${x + w - 10} ${y + 6} H${x + w - 4} M${x + w - 10} ${y + 10} H${x + w - 4}`, 1, INK, .4);
    s += L(`M${x + 16} ${y + 3} V${y + hh - 3} M${x + 22} ${y + 3} V${y + hh - 3}`, 1.8, C.gold);
    s += O(rr(x, y, w, hh, 3), 3);
  });

  /* the molar model on its stand */
  s += S("M356 152 C356 144 444 144 444 152 C444 160 356 160 356 152 Z", C.wood, "M400 156 C424 156 442 155 444 152 C444 160 400 160 356 153 Z", C.woodShade);
  s += P(rr(394, 136, 12, 12, 2), C.metalShade, 2.4);
  s += molar(.46, 400, 54, 3);

  /* a mug with its steam */
  s += L("M476 99 C473 95 479 93 476 88 M488 99 C485 95 491 93 488 88", 2.4, INK, .4);
  s += P("M508 112 C520 112 522 132 508 134", "none", 4);
  s += box(466, 104, 44, 46, 8, C.paper, C.paperShade, 9);
  s += F("M466 116 H510 V124 H466 Z", t.mid) + O(rr(466, 104, 44, 46, 8), 3);
  /* the notebook, open, with its spiral */
  s += P("M500 168 L516 148 L554 150 L540 170 Z", C.paper, 2.6) + P("M540 170 L554 150 L594 152 L582 172 Z", C.paper, 2.6);
  s += L("M514 160 L536 161 M518 155 L540 156 M550 163 L574 164 M554 158 L580 159", 1.4, INK, .4);
  s += `<g fill="none" stroke="${INK}" stroke-width="1.6">${[0, 1, 2, 3, 4].map(i => `<circle cx="${552.6 - i * 3.6}" cy="${152 + i * 4}" r="2.2"/>`).join("")}</g>`;
  return s;
}

export const MASTHEADS = {
  "occlusion":            { label: "A lab bench: a semi-adjustable articulator holding mounted casts, articulating paper, a facebow on its hook, a bowl of mounting stone and a TMJ sketch pinned to the wall", body: occlusion() },
  "perio":                { label: "A row of teeth in their gums with a probe walked into a pocket and a bleeding point beside it, a perio chart on a clipboard, a mouth mirror and a curette", body: perio() },
  "pcd-implants-exam1":   { label: "A cutaway model of an implant between two natural teeth in gum and bone, CBCT cross-sections on a lightbox, a surgical guide, a torque wrench and an implant vial", body: implants() },
  "heme-endo-exam2":      { label: "A chart of the thyroid on the trachea, an insulin pen and vial, a glucose meter with a drop on its strip, a rack of blood tubes and red cells drifting by", body: hemeEndo() },
  "special-patient-care": { label: "A calm operatory corner: the chair under a soft blanket, a picture schedule on the wall, the light turned low, tinted sunglasses and a foam-grip toothbrush on the tray", body: spc() },
  "generic":              { label: "A study desk: a lamp, a stack of books in the hubs' colors, a molar model, a mug, an open notebook and an exam calendar with a day circled", body: generic() }
};
