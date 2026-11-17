// Fig: the head and neck map (L20 Lymphomas and Leukemias, Dr. Borak, from the slides). Where this lecture meets
// dentistry: a face and neck (front view) beside the inside of an open mouth, with nine numbered sites, each a
// presentation the notes teach: the eye (ocular lymphoma), the nose and hard palate (extranodal NK/T-cell lymphoma), the
// parotid (salivary MALT lymphoma after Sjögren syndrome), the tonsils (Waldeyer ring), swollen gums (AML in the
// gingiva) and bleeding gums with petechiae (marrow failure, DIC in APL), a child's jaw mass (endemic Burkitt), punched-
// out jaw holes (myeloma) and the cervical and supraclavicular nodes (classic Hodgkin). Every finding is drawn at once,
// as a map, not one patient. Pick a site (or step through them): its badge lights, a ring marks it, and the card under
// the drawing shows a close-up of the finding with what to look for, the disease and the clue. "Quiz me" hides the
// disease until it is asked for. Badge colors sort the sites: lymphoma, leukemia, plasma cell. Schematic, not to scale.
import { makeFig, f1, T, L, HOT } from "./shared.mjs";

const W = 420, H = 528;
const CU = [14, 344];                              // the close-up's top left corner in the card (it is 162 x 160)

/* ---------- build-time geometry ---------- */
/* closed (or open) smooth path through points: Catmull-Rom as cubic Beziers */
function sm(p, c = true) {
  const n = p.length, last = c ? n : n - 1;
  let d = "M" + f1(p[0][0]) + " " + f1(p[0][1]);
  for (let i = 0; i < last; i++) {
    let a = p[(i - 1 + n) % n], b = p[i], e = p[(i + 1) % n], g = p[(i + 2) % n];
    if (!c) { if (i === 0) a = b; if (i + 2 >= n) g = e; }
    d += "C" + f1(b[0] + (e[0] - a[0]) / 6) + " " + f1(b[1] + (e[1] - a[1]) / 6) + " " + f1(e[0] - (g[0] - b[0]) / 6) + " " + f1(e[1] - (g[1] - b[1]) / 6) + " " + f1(e[0]) + " " + f1(e[1]);
  }
  return d + (c ? "Z" : "");
}
const P = (cls, d, extra = "") => `<path class="${cls}" d="${d}"${extra}/>`;
const E = (cls, cx, cy, rx, ry, rot) => `<ellipse class="${cls}" cx="${f1(cx)}" cy="${f1(cy)}" rx="${f1(rx)}" ry="${f1(ry)}"${rot ? ` transform="rotate(${f1(rot)} ${f1(cx)} ${f1(cy)})"` : ""}/>`;
const Cc = (cls, cx, cy, r) => `<circle class="${cls}" cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r)}"/>`;
const ellD = (cx, cy, rx, ry) => `M${f1(cx - rx)} ${f1(cy)}A${f1(rx)} ${f1(ry)} 0 1 0 ${f1(cx + rx)} ${f1(cy)}A${f1(rx)} ${f1(ry)} 0 1 0 ${f1(cx - rx)} ${f1(cy)}Z`;
/* a tooth crown, w wide and h tall around (x, y): the free (incisal or occlusal) edge rounded, at the bottom when down */
function crown(x, y, w, h, down, rot, cls = "hn-tooth") {
  const r = Math.min(w * 0.32, h * 0.4), x0 = x - w / 2, x1 = x + w / 2, yt = y - h / 2, yb = y + h / 2;
  const d = down
    ? `M${f1(x0)} ${f1(yt)}L${f1(x1)} ${f1(yt)}L${f1(x1)} ${f1(yb - r)}Q${f1(x1)} ${f1(yb)} ${f1(x1 - r)} ${f1(yb)}L${f1(x0 + r)} ${f1(yb)}Q${f1(x0)} ${f1(yb)} ${f1(x0)} ${f1(yb - r)}Z`
    : `M${f1(x0)} ${f1(yb)}L${f1(x1)} ${f1(yb)}L${f1(x1)} ${f1(yt + r)}Q${f1(x1)} ${f1(yt)} ${f1(x1 - r)} ${f1(yt)}L${f1(x0 + r)} ${f1(yt)}Q${f1(x0)} ${f1(yt)} ${f1(x0)} ${f1(yt + r)}Z`;
  return `<path class="${cls}" d="${d}"${rot ? ` transform="rotate(${f1(rot)} ${f1(x)} ${f1(y)})"` : ""}/>`;
}
/* teeth along an arch in the open-mouth view: phi from the midline, sizes shrink toward the back */
const TW = [13, 11.5, 11, 10, 9.5, 11, 10], TH = [17, 16, 17, 13, 12, 11, 9.5];
function arch(cx, cy, rx, ry, down) {
  const out = [];
  for (const s of [-1, 1]) for (let i = 0; i < 7; i++) {
    const phi = s * (0.11 + i * 0.205), x = cx + rx * Math.sin(phi), y = cy + (down ? 1 : -1) * ry * (1 - Math.cos(phi));
    out.push({ x, y, w: TW[i] * (1 - 0.06 * i), h: TH[i], rot: (down ? 1 : -1) * phi * 32, i });
  }
  return out.sort((a, b) => b.i - a.i);                // the back teeth first, so the front ones sit over them
}

/* ---------- the face and neck (left view, box x 6..196) ---------- */
const FX = 101;
const F = (dx, y) => [FX + dx, y];
/* the head outline: endemic Burkitt swells the viewer's left jaw, the parotid swells in front of the viewer's right ear */
const HEAD = [F(0, 34), F(32, 38), F(52, 58), F(60, 88), F(59, 120), F(66, 146), F(61, 172), F(30, 202), F(0, 214), F(-34, 210), F(-60, 194),
  F(-64, 172), F(-57, 148), F(-59, 120), F(-60, 88), F(-52, 58), F(-32, 38)];
function face() {
  let o = "";
  o += `<rect class="hn-view" x="6" y="6" width="190" height="290" rx="10"/>`;
  /* shoulders and neck, behind the head */
  const body = [[8, 296], [8, 270], [30, 256], [62, 246], [77, 236], [78, 196], [124, 196], [125, 236], [140, 246], [172, 256], [194, 270], [194, 296]];
  o += P("hn-skin", "M8 296L8 270C24 260 50 250 76 240L77 196L125 196L126 240C152 250 178 260 194 270L194 296Z");
  /* the ears, then the head over them */
  o += E("hn-skin", FX - 61, 108, 8, 19) + E("hn-skin", FX + 61, 108, 8, 19);
  o += P("hn-ear", `M${FX - 63} 96Q${FX - 67} 108 ${FX - 62} 120M${FX + 63} 96Q${FX + 67} 108 ${FX + 62} 120`);
  o += P("hn-skin", sm(HEAD));
  o += P("hn-hair", sm([F(-61, 96), F(-63, 66), F(-48, 40), F(-20, 28), F(20, 28), F(48, 40), F(63, 66), F(61, 96), F(56, 96), F(53, 66), F(32, 54), F(0, 52), F(-32, 54), F(-53, 66), F(-56, 96)]));
  /* the swollen parotid: a soft fullness in front of the ear and over the angle of the jaw */
  o += P("hn-swell", sm([F(46, 124), F(57, 126), F(65, 140), F(66, 160), F(60, 176), F(48, 180), F(40, 166), F(40, 142)]));
  /* the mandible seen through the skin, faintly: a U from ear to ear; Burkitt's mass expands its left body */
  o += P("hn-bone", sm([F(-50, 170), F(-40, 190), F(-22, 203), F(0, 208), F(22, 203), F(40, 190), F(50, 170), F(43, 167), F(35, 182), F(20, 193), F(0, 197), F(-20, 193), F(-35, 182), F(-43, 167)]));
  o += P("hn-mass", sm([F(-58, 158), F(-46, 150), F(-34, 164), F(-28, 186), F(-38, 202), F(-54, 196), F(-61, 178)]));
  /* myeloma's punched-out holes in the right body of the mandible */
  o += Cc("hn-hole", FX + 22, 200, 2.6) + Cc("hn-hole", FX + 32, 194, 2.2) + Cc("hn-hole", FX + 40, 184, 2.4);
  /* brows, eyes, nose, lips */
  o += P("hn-line", `M${FX - 34} 84Q${FX - 22} 78 ${FX - 10} 83M${FX + 10} 83Q${FX + 22} 78 ${FX + 34} 84`);
  for (const s of [-1, 1]) {
    const ex = FX + s * 22;
    o += P("hn-eye", `M${ex - 12} 96Q${ex} 87 ${ex + 12} 96Q${ex} 104 ${ex - 12} 96Z`) + Cc("hn-iris", ex, 96, 4.4) + Cc("hn-pupil", ex, 96, 1.9);
  }
  o += P("hn-line", `M${FX - 2} 100Q${FX - 6} 116 ${FX - 9} 127Q${FX - 6} 133 ${FX} 132Q${FX + 6} 133 ${FX + 9} 127`);
  o += P("hn-lip", `M${FX - 17} 160Q${FX - 8} 153 ${FX} 156Q${FX + 8} 153 ${FX + 17} 160Q${FX} 170 ${FX - 17} 160Z`) + P("hn-line", `M${FX - 17} 160Q${FX} 162 ${FX + 17} 160`);
  /* neck: the sternocleidomastoids, then the clavicles */
  o += P("hn-faint", `M${FX - 26} 204Q${FX - 14} 236 ${FX - 6} 268M${FX + 26} 204Q${FX + 14} 236 ${FX + 6} 268`);
  o += P("hn-clav", `M${FX - 4} 270C${FX - 20} 262 ${FX - 50} 268 ${FX - 80} 258M${FX + 4} 270C${FX + 20} 262 ${FX + 50} 268 ${FX + 80} 258`);
  /* Hodgkin's nodes: a cervical chain down the neck and a node above the clavicle, one group to the next */
  o += P("hn-chain", `M${FX + 24} 210Q${FX + 28} 232 ${FX + 34} 246Q${FX + 40} 254 ${FX + 46} 258`);
  o += E("hn-node", FX + 24, 212, 5.2, 4.4, 70) + E("hn-node", FX + 28, 226, 5.6, 4.6, 70) + E("hn-node", FX + 33, 240, 5.4, 4.6, 60) + E("hn-node", FX + 46, 257, 7, 5, 20);
  o += T(14, 24, "face and neck", "s mut", "start");
  return o;
}

/* ---------- inside the open mouth (right view, box x 202..414) ---------- */
const MX = 308, MY = 164;
function mouth() {
  let o = "";
  o += `<rect class="hn-view" x="202" y="6" width="212" height="290" rx="10"/>`;
  o += `<rect class="hn-skin" x="203" y="30" width="210" height="265" rx="9"/>`;
  /* the cavity, then the palate (hard in front, soft behind) down to its free edge, the arch with the uvula */
  o += P("hn-cav", ellD(MX, MY, 72, 88));
  const pal = `M228 70L388 70L388 200C376 170 360 150 ${MX + 10} 146C${MX + 7} 158 ${MX + 6} 172 ${MX} 178C${MX - 6} 172 ${MX - 7} 158 ${MX - 10} 146C256 150 240 170 228 200Z`;
  o += HOT("The roof of the mouth: the hard palate in front, then the soft palate, whose free edge arches down on each side and hangs the uvula in the middle.",
    P("hn-soft", pal) + P("hn-hard", `M228 70L388 70L388 128C360 136 330 139 ${MX} 139C286 139 256 136 228 128Z`) + P("hn-faint", `M${MX} 104L${MX} 136`));
  /* the extranodal NK/T-cell perforation: a necrotic rim around a hole into the nose */
  o += P("hn-necr", sm([[MX - 12, 119], [MX - 4, 109], [MX + 9, 111], [MX + 14, 121], [MX + 8, 133], [MX - 6, 133]]));
  o += P("hn-perf", sm([[MX - 7, 120], [MX - 2, 114], [MX + 6, 115], [MX + 9, 122], [MX + 4, 128], [MX - 4, 128]]));
  /* petechiae on the soft palate (marrow failure, or APL's DIC) */
  [[270, 154, 1.6], [280, 147, 1.3], [287, 156, 1.6], [262, 162, 1.3], [292, 148, 1.2], [336, 152, 1.4], [344, 146, 1.2], [350, 156, 1.5], [328, 148, 1.2], [357, 163, 1.3], [276, 161, 1.2]]
    .forEach(([x, y, r]) => { o += Cc("hn-pet", x, y, r); });
  /* the pillars and the tonsils between them; the right one is enlarged, crowding the midline */
  o += P("hn-pillar", `M262 162Q258 184 256 206M282 156Q278 180 278 204M354 156Q358 180 358 204M374 164Q378 186 380 206`);
  o += HOT("The tonsils sit between the pillars on each side of the throat: part of Waldeyer ring, the ring of lymphoid tissue around the throat.",
    E("hn-tonsil", 269, 182, 7.5, 13) + E("hn-tonsil", 352, 182, 15, 21, -8) + Cc("hn-crypt", 348, 176, 1.3) + Cc("hn-crypt", 355, 188, 1.2) + Cc("hn-crypt", 346, 192, 1.1));
  /* the tongue */
  o += P("hn-tongue", `M226 262C236 222 266 198 ${MX} 196C350 198 380 222 390 262Z`) + P("hn-tline", `M${MX} 204L${MX} 222`);
  /* lower arch: swollen gingiva (AML in the gums) rises over the crowns */
  const lo = arch(MX, 236, 62, 16, false);
  o += HOT("The lower front teeth.", lo.map((t) => crown(t.x, t.y, t.w, t.h, false, t.rot)).join(""));
  /* the swollen gums climb halfway up the crowns, papillae bulging between the teeth */
  const gl = []; for (let k = -13; k <= 13; k++) { const ph = k * 0.1025 * (k % 2 ? 1 : 1), pap = k % 2 === 0, x = MX + 63 * Math.sin(ph), y = 236 - 16 * (1 - Math.cos(ph)) + (pap ? -4 : 0.5); gl.push([x, y]); }
  o += HOT("The lower gums.", P("hn-gumsw", "M226 262L" + f1(gl[0][0] - 6) + " " + f1(gl[0][1] + 4) + sm(gl, false).replace(/^M/, "L") + "L" + f1(gl[gl.length - 1][0] + 6) + " " + f1(gl[gl.length - 1][1] + 4) + "L390 262Z") +
    P("hn-gumhi", sm(gl.filter((q, i) => i % 2 === 1).map((q) => [q[0], q[1] + 6]), false)));
  /* upper arch: the gingiva over the crowns, oozing at the margins on the left (marrow failure) */
  const up = arch(MX, 92, 62, 20, true);
  o += P("hn-gum", `M228 70L388 70L388 110C370 94 340 81 ${MX} 81C276 81 246 94 228 110Z`);
  o += HOT("The upper front teeth and their gums.", up.map((t) => crown(t.x, t.y, t.w, t.h, true, t.rot)).join(""));
  [[MX - 20, 84], [MX - 33, 87], [MX - 45, 93]].forEach(([x, y]) => { o += P("hn-blood", `M${f1(x - 3)} ${f1(y)}Q${f1(x)} ${f1(y - 1.5)} ${f1(x + 3)} ${f1(y)}C${f1(x + 3)} ${f1(y + 3)} ${f1(x + 1.8)} ${f1(y + 5.5)} ${f1(x)} ${f1(y + 6.5)}C${f1(x - 1.8)} ${f1(y + 5.5)} ${f1(x - 3)} ${f1(y + 3)} ${f1(x - 3)} ${f1(y)}Z`); });
  /* the lips over everything, and the skin around them */
  o += P("hn-skin", `M203 30L413 30L413 295L203 295Z${ellD(MX, MY, 86, 100)}`, ' fill-rule="evenodd"');
  o += P("hn-lipr", `${ellD(MX, MY, 86, 100)}${ellD(MX, MY, 72, 88)}`, ' fill-rule="evenodd"');
  o += `<rect class="hn-view hn-edge" x="202" y="6" width="212" height="290" rx="10"/>`;
  o += T(212, 24, "inside the open mouth", "s mut", "start");
  return o;
}

/* ---------- the close-ups (162 x 160, drawn at CU) ---------- */
const CUF = `<rect class="hn-cub" x="0" y="0" width="162" height="160" rx="8"/>`;
/* over every close-up: the card's own color in the four corners outside the rounded frame, then the frame's line */
const CUT = P("hn-corner", "M-1 -1L9 -1L8 0A8 8 0 0 0 0 8L-1 9ZM163 -1L153 -1L154 0A8 8 0 0 1 162 8L163 9ZM-1 161L9 161L8 160A8 8 0 0 1 0 152L-1 151ZM163 161L153 161L154 160A8 8 0 0 0 162 152L163 151Z") +
  `<rect class="hn-cuf" x="0" y="0" width="162" height="160" rx="8"/>`;
function cuEye() {
  let o = CUF;
  o += P("hn-fat", sm([[40, 22], [100, 10], [150, 28], [162, 80], [150, 134], [100, 150], [40, 140], [70, 80]]));
  o += Cc("hn-sclera", 92, 80, 46);
  o += P("hn-ret", "M108 37A44 44 0 0 1 108 123");
  o += P("hn-cornea", "M53 57Q30 80 53 103");
  o += E("hn-lens", 60, 80, 6.5, 16);
  o += P("hn-line", "M50 58L58 64M50 102L58 96");
  o += P("hn-nerve", "M134 72L162 68L162 92L134 88Z");
  o += P("hn-skin", "M58 22Q30 34 30 58L38 58Q40 40 62 32Z") + P("hn-skin", "M58 138Q30 126 30 104L38 104Q40 120 62 128Z");
  o += P("hn-gland", sm([[64, 16], [76, 11], [90, 14], [92, 22], [80, 27], [66, 25]]));
  [[96, 62], [100, 66], [93, 68], [104, 61], [86, 96], [91, 100], [84, 102], [114, 90], [118, 95], [111, 96], [120, 87]].forEach(([x, y]) => { o += Cc("hn-cell", x, y, 1.9); });
  return o;
}
function cuPalate() {
  let o = CUF;
  /* an occlusal view of the upper arch: the incisors at the top, the molars at the bottom, the palate inside the U */
  const N = 120, side = [];
  for (let k = 0; k <= N; k++) { const u = k / N; side.push([81 + 54 * Math.sin(1.45 * u), 16 + 106 * Math.pow(u, 1.25)]); }
  const len = [0]; for (let k = 1; k <= N; k++) len.push(len[k - 1] + Math.hypot(side[k][0] - side[k - 1][0], side[k][1] - side[k - 1][1]));
  const at = (d) => { let k = 1; while (k < N && len[k] < d) k++; const w = (d - len[k - 1]) / (len[k] - len[k - 1]); return [side[k - 1][0] + (side[k][0] - side[k - 1][0]) * w, side[k - 1][1] + (side[k][1] - side[k - 1][1]) * w, Math.atan2(side[k][1] - side[k - 1][1], side[k][0] - side[k - 1][0])]; };
  const wd = [14, 11, 12, 11, 11, 16, 15], dp = [7, 7, 10, 12, 12, 16, 16], gap = 1.2, sc = (len[N] - 4) / (wd.reduce((a, b) => a + b) + gap * 6);
  const both = side.slice().reverse().map((q) => [162 - q[0], q[1]]).concat(side.slice(1));
  o += P("hn-soft", "M8 126Q81 112 154 126L154 151Q154 157 148 157L14 157Q8 157 8 151Z");
  o += `<path class="hn-gumband" d="${sm(both.filter((q, i) => i % 6 === 0), false)}"/>`;
  const inner = side.filter((q, i) => i % 6 === 0).map((q, i, a) => { const nx = (a[Math.min(i + 1, a.length - 1)][1] - a[Math.max(i - 1, 0)][1]), ny = -(a[Math.min(i + 1, a.length - 1)][0] - a[Math.max(i - 1, 0)][0]), m = Math.hypot(nx, ny) || 1; return [q[0] - 13 * nx / m, q[1] - 13 * ny / m]; });
  o += P("hn-hard", sm(inner.slice().reverse().map((q) => [162 - q[0], q[1]]).concat(inner.slice(1)).concat([[81, 128]]), true));
  o += P("hn-faint", "M81 34L81 120M66 44Q72 48 70 54M96 44Q90 48 92 54M62 58Q70 62 68 68M100 58Q92 62 94 68");
  let d = 2;
  wd.forEach((w0, i) => {
    const w = w0 * sc, q = at(d + w / 2), a = q[2] * 180 / Math.PI;
    for (const s of [1, -1]) {
      const x = s > 0 ? q[0] : 162 - q[0], ang = s > 0 ? a : 180 - a, h = dp[i];
      o += `<rect class="hn-tooth" x="${f1(x - w / 2 + 0.6)}" y="${f1(q[1] - h / 2)}" width="${f1(w - 1.2)}" height="${f1(h)}" rx="${f1(Math.min(w, h) * 0.38)}" transform="rotate(${f1(ang)} ${f1(x)} ${f1(q[1])})"/>`;
    }
    d += w + gap * sc;
  });
  o += P("hn-necr", sm([[66, 80], [76, 66], [94, 68], [102, 82], [96, 100], [74, 102]]));
  o += P("hn-perf", sm([[72, 82], [80, 72], [92, 75], [96, 85], [90, 96], [76, 95]]));
  return o;
}
function cuParotid() {
  let o = CUF;
  /* a profile facing left: the parotid swells in front of the ear and over the angle of the jaw */
  const prof = sm([[34, 0], [30, 24], [24, 34], [10, 60], [22, 70], [20, 80], [24, 88], [20, 96], [28, 108], [32, 120], [50, 128], [56, 150], [58, 160]], false);
  o += P("hn-skinf", prof + "L162 160L162 0Z") + P("hn-line", prof);
  o += P("hn-line", "M34 120C60 124 92 124 108 118C116 108 118 90 118 76");
  o += P("hn-eye", "M34 40Q42 35 50 40Q42 44 34 40Z") + P("hn-line", "M30 32Q40 27 52 31");
  o += P("hn-swell", sm([[104, 76], [120, 66], [138, 74], [146, 102], [138, 128], [116, 136], [100, 118], [100, 94]]));
  o += E("hn-skin", 132, 64, 10, 19) + P("hn-ear", "M128 52Q138 54 136 66Q134 74 130 76");
  o += P("hn-line", "M22 80Q30 84 38 82");
  return o;
}
function cuTonsil() {
  let o = CUF;
  o += P("hn-cav", "M6 20Q81 4 156 20L156 156L6 156Z");
  o += P("hn-soft", "M6 6L156 6L156 70C140 46 112 34 90 34C88 46 86 58 81 64C76 58 74 46 72 34C50 34 22 46 6 70Z");
  o += P("hn-pillar", "M18 62Q12 100 10 140M40 46Q34 92 34 140M122 46Q128 92 128 140M144 62Q150 100 152 140");
  o += E("hn-tonsil", 24, 98, 7, 16) + E("hn-tonsil", 112, 98, 22, 30, -8);
  [[106, 86], [116, 96], [104, 108], [120, 112], [110, 120]].forEach(([x, y]) => { o += Cc("hn-crypt", x, y, 1.6); });
  o += P("hn-tongue", "M0 160C10 132 44 118 81 116C118 118 152 132 162 160Z");
  return o;
}
function lowerTeeth(gumTop) {
  const xs = [-46, -27, -9, 9, 27, 46], ws = [19, 17, 16, 16, 17, 19];
  let o = "";
  xs.forEach((dx, i) => { o += crown(81 + dx, 68, ws[i] - 1.5, 72, false); });
  const g = []; xs.forEach((dx, i) => { g.push([81 + dx, gumTop + 9]); if (i < xs.length - 1) g.push([81 + (dx + xs[i + 1]) / 2, gumTop]); });
  const edge = "M0 " + f1(gumTop + 14) + "L" + f1(g[0][0] - 12) + " " + f1(gumTop + 8) + sm(g, false).replace(/^M/, "L") + "L" + f1(g[g.length - 1][0] + 12) + " " + f1(gumTop + 8) + "L162 " + f1(gumTop + 14);
  return { teeth: o, gum: edge + "L162 160L0 160Z", edge };
}
function cuGums() {
  let o = CUF + P("hn-cav", "M0 0L162 0L162 76L0 76Z");
  const t = lowerTeeth(62);
  o += t.teeth + P("hn-gumswf", t.gum) + P("hn-gumswe", t.edge);
  o += P("hn-lipf", "M0 138Q81 128 162 138L162 160L0 160Z") + P("hn-lipe", "M0 138Q81 128 162 138");
  return o;
}
function cuBleed() {
  let o = CUF + P("hn-cav", "M0 60L162 60L162 160L0 160Z");
  o += P("hn-soft", "M0 74Q81 66 162 74L162 128C140 112 108 104 88 104C86 114 84 126 81 132C78 126 76 114 74 104C54 104 22 112 0 128Z");
  [[22, 96], [34, 88], [46, 98], [58, 90], [30, 108], [108, 92], [120, 98], [132, 90], [142, 102], [116, 108], [64, 98], [98, 96]].forEach(([x, y], i) => { o += Cc("hn-pet", x, y, 1.6 + (i % 3) * 0.35); });
  const xs = [-46, -27, -9, 9, 27, 46], ws = [19, 17, 16, 16, 17, 19];
  o += P("hn-gum", "M0 0L162 0L162 26Q81 22 0 26Z");
  xs.forEach((dx, i) => { o += crown(81 + dx, 46, ws[i] - 1.5, 38, true); });
  const g = []; xs.forEach((dx, i) => { g.push([81 + dx, 28]); if (i < xs.length - 1) g.push([81 + (dx + xs[i + 1]) / 2, 34]); });
  o += P("hn-gum", "M-2 -2L164 -2L164 30L" + f1(g[g.length - 1][0] + 12) + " 28" + sm(g.slice().reverse(), false).replace(/^M/, "L") + "L" + f1(g[0][0] - 12) + " 28L-2 30Z");
  [[81 - 27, 30], [81 - 9, 29], [81 + 27, 30], [81 + 46, 30]].forEach(([x, y], i) => { const b = 7 + (i % 2) * 3; o += P("hn-blood", `M${f1(x - 3.5)} ${y}Q${x} ${y - 2} ${f1(x + 3.5)} ${y}C${f1(x + 3.5)} ${y + b * 0.5} ${f1(x + 2.2)} ${y + b * 0.85} ${x} ${y + b}C${f1(x - 2.2)} ${y + b * 0.85} ${f1(x - 3.5)} ${y + b * 0.5} ${f1(x - 3.5)} ${y}Z`); });
  o += P("hn-lip", "M0 0L162 0L162 8Q81 13 0 8Z");
  return o;
}
function film(holes, burkitt) {
  let o = `<rect class="hn-film" x="0" y="0" width="162" height="160" rx="8"/>`;
  /* the body of the mandible, its lower cortex brighter, with molars and premolars in it */
  const bone = "M0 70C40 66 120 64 162 62L162 128C120 136 40 138 0 132Z";
  o += P("hn-xbone", bone) + P("hn-xcort", "M0 126C40 132 120 130 162 122L162 128C120 136 40 138 0 132Z") + P("hn-xcanal", "M0 112C50 116 110 114 162 108");
  if (burkitt) o += P("hn-xlucent", sm([[44, 76], [70, 66], [100, 70], [122, 84], [118, 112], [94, 124], [62, 120], [42, 104]]));
  holes.forEach(([x, y, r]) => { o += Cc("hn-xhole", x, y, r); });
  const teeth = [[16, 0, 0], [40, 0, 0], [66, burkitt ? -10 : 0, burkitt ? -16 : 0], [96, burkitt ? -14 : 0, burkitt ? 14 : 0], [130, 0, 0]];
  teeth.forEach(([x, dy, rot], i) => {
    const w = i > 2 ? 22 : 15, g = `<g transform="translate(${x} ${dy}) rotate(${rot} 0 70)">`;
    o += g + P("hn-xroot", i > 2 ? "M-8 70L-6 102L-2 102L0 80L2 102L6 102L8 70Z" : "M-5 70L-3 104L3 104L5 70Z") + P("hn-xenam", `M${-w / 2} 70L${-w / 2} 52Q${-w / 2} 44 ${-w / 4} 44Q0 48 ${w / 4} 44Q${w / 2} 44 ${w / 2} 52L${w / 2} 70Z`) + "</g>";
  });
  return o;
}
function cuNodes() {
  let o = CUF;
  o += P("hn-skinf", "M44 0L118 0L116 60C124 74 140 84 162 92L162 160L0 160L0 92C22 84 38 74 46 60Z") + P("hn-line", "M44 0L46 60C38 74 22 84 0 92M118 0L116 60C124 74 140 84 162 92");
  o += P("hn-faint", "M52 4Q64 54 74 98M110 4Q98 54 88 98");
  o += P("hn-clav", "M76 100C62 92 36 98 4 90M86 100C100 92 126 98 158 90");
  o += P("hn-medi", sm([[66, 108], [81, 104], [98, 110], [102, 132], [96, 156], [66, 156], [60, 132]]));
  o += P("hn-chain", "M100 18Q104 44 110 62Q118 78 128 84M128 84Q112 96 96 112");
  o += E("hn-node", 100, 20, 7, 5.6, 75) + E("hn-node", 104, 40, 7.5, 6, 75) + E("hn-node", 109, 59, 7, 5.8, 65) + E("hn-node", 128, 84, 9, 6.5, 20);
  return o;
}
const MYH = [[30, 104, 6], [58, 96, 5], [84, 108, 7], [112, 98, 5.5], [142, 104, 6.5], [70, 118, 3.5]];

/* ---------- the nine sites ---------- */
const FAM = { ly: "lymphoma", le: "leukemia", pc: "plasma cell" };
const SITES = [
  { k: "eye", btn: "1 Eye", site: "Eye and orbit", fam: "ly", badge: [22, 62], tgt: [FX - 31, 95], ring: [FX - 22, 96, 17, 11],
    dz: ["Ocular lymphoma"], clue: ["painless loss of vision,", "floaters"], cu: cuEye(),
    labs: [[["cells in the vitreous:", "inside the eye"], [100, 66]], [["lids, lacrimal gland, orbit:", "around the eye (adnexa)"], [78, 18]]],
    info: "the eye and orbit", say: "ocular lymphoma. Ocular adnexal lymphoma involves the orbit, eyelids, conjunctiva, lacrimal gland or lacrimal sac; vitreoretinal and uveal lymphoma are inside the eye. Both cause a painless decrease in vision or floaters; patients without symptoms are often found on eye screening, and when the brain is involved, personality changes are a common first sign. In the ocular adnexa, MALT lymphoma is linked to Chlamydia psittaci.",
    q: "a painless decrease in vision or floaters, or a mass of the eyelids, orbit or lacrimal gland." },
  { k: "pal", btn: "2 Palate", site: "Nose and hard palate", fam: "ly", badge: [262, 44], tgt: [MX - 4, 117], ring: [MX + 1, 121, 18, 15],
    dz: ["Extranodal NK/T-cell", "lymphoma"], clue: ["a necrotic hole in the", "palate, from the nose"], cu: cuPalate(),
    labs: [[["hole through the palate", "into the nose"], [84, 84]], [["necrosis around it"], [99, 90]]],
    info: "the nose and hard palate", say: "extranodal NK/T-cell lymphoma. It begins in the nasal cavity, nasopharynx, oropharynx, Waldeyer ring or epiglottis, grows around and into vessel walls with prominent necrosis, and is very strongly linked to EBV. From the nose it can erode the nasal floor and perforate the hard palate, the picture once called lethal midline granuloma, so a dentist may be the first to see it. It occurs mainly in eastern Asia and among the Indigenous peoples of Central and South America.",
    q: "a necrotic hole through the hard palate, from a tumor that began in the nose and destroys vessels." },
  { k: "par", btn: "3 Parotid", site: "Parotid gland", fam: "ly", badge: [182, 126], tgt: [FX + 56, 150], ring: [FX + 54, 152, 13, 27],
    dz: ["Salivary MALT lymphoma"], clue: ["a parotid that enlarges", "after Sjögren syndrome"], cu: cuParotid(),
    labs: [[["parotid swelling, in front", "of the ear and over the", "angle of the jaw"], [118, 104]]],
    info: "the parotid gland", say: "salivary MALT lymphoma (extranodal marginal zone lymphoma). The salivary one is linked to Sjögren syndrome, which commonly comes first: in a patient with Sjögren syndrome, a parotid that starts to enlarge should be checked for lymphoma. It is indolent, with small to medium cells and lymphoepithelial lesions, and B symptoms are rare.",
    q: "a parotid that starts to enlarge in a patient who has had Sjögren syndrome for years." },
  { k: "ton", btn: "4 Tonsils", site: "Tonsils (Waldeyer ring)", fam: "ly", badge: [402, 186], tgt: [365, 184], ring: [352, 182, 21, 27],
    dz: ["Non-Hodgkin lymphoma"], clue: ["one tonsil enlarged, in", "the ring around the throat"], cu: cuTonsil(),
    labs: [[["one tonsil enlarged"], [120, 100]]],
    info: "the tonsils, part of Waldeyer ring", say: "non-Hodgkin lymphoma of Waldeyer ring, the ring of lymphoid tissue around the throat. Lymphoma can involve the tonsils, and the non-Hodgkin lymphomas often start outside the nodes: sporadic Burkitt lymphoma lists Waldeyer ring among its sites and enlarged tonsils among its symptoms, and extranodal NK/T-cell lymphoma can begin there. Classic Hodgkin lymphoma rarely starts here; it starts in nodes.",
    q: "one tonsil enlarged, in the ring of lymphoid tissue around the throat." },
  { k: "gsw", btn: "5 Gums: swollen", site: "Swollen gums", fam: "le", badge: [262, 284], tgt: [MX - 36, 243], ring: [MX, 236, 62, 15],
    dz: ["AML in the gingiva"], clue: ["gums swollen over the", "crowns: infiltration"], cu: cuGums(),
    labs: [[["gingiva swollen over", "the crowns"], [72, 82]], [["crowns half hidden"], [35, 46]]],
    info: "the gums", say: "AML in the gingiva. Leukemic cells growing in the gums make them swell over the teeth: an organ infiltration, not marrow failure. AML that forms a mass outside the marrow is a myeloid sarcoma, and acute monocytic leukemia, with its kidney-shaped nuclei, is the one his slides show in the gums. Swollen gums in a patient who is tired, pale and bruising call for a blood count.",
    q: "firm gums swollen over the crowns, in a patient who is tired, pale and bruising." },
  { k: "gbl", btn: "6 Gums: bleeding", site: "Bleeding gums, petechiae", fam: "le", badge: [214, 154], tgt: [262, 162], ring: [278, 154, 26, 13],
    dz: ["Marrow failure;", "DIC in APL"], clue: ["oozing gums, petechiae:", "too few platelets"], cu: cuBleed(),
    labs: [[["oozing gum margins"], [127, 35]], [["petechiae on the", "soft palate"], [132, 90]]],
    info: "the gum margins and the soft palate", say: "marrow failure. Leukemic cells crowd out normal blood-making, so too few platelets bring bleeding gums, petechiae and bruising, and the anemia makes the mucosa pale. In acute promyelocytic leukemia, a coagulopathy with a risk of DIC adds to it and can cause early death; all-trans retinoic acid with arsenic trioxide is largely curative.",
    q: "gums that ooze at the margins and pinpoint bleeds on the soft palate, in a patient who bruises easily." },
  { k: "bur", btn: "7 Jaw: child", site: "A child's jaw", fam: "ly", badge: [22, 206], tgt: [FX - 56, 186], ring: [FX - 45, 178, 20, 25],
    dz: ["Endemic Burkitt", "lymphoma"], clue: ["a jaw mass in a child,", "fast, loosening teeth"], cu: film([], true),
    labs: [[["one destructive mass"], [84, 96]], [["teeth pushed loose"], [96, 50]]],
    info: "the jaw", say: "endemic Burkitt lymphoma. In equatorial Africa and Papua New Guinea it is the most common childhood cancer, more than 90 percent linked to EBV, and it traditionally involves the mandible, maxilla and other facial bones. Its cells double so fast that the tumor grows quickly, with dental or jaw pain and loss of teeth. Its t(8;14) moves MYC next to IGH, and the microscope shows a starry sky.",
    q: "a jaw mass that grows over weeks in a child from equatorial Africa, loosening the teeth." },
  { k: "mm", btn: "8 Jaw: holes", site: "Punched-out jaw holes", fam: "pc", badge: [182, 180], tgt: [FX + 40, 184], ring: [FX + 32, 193, 16, 12],
    dz: ["Multiple myeloma"], clue: ["punched-out holes,", "high calcium"], cu: film(MYH, false),
    labs: [[["round, punched-out", "lytic holes"], [84, 108]]],
    info: "the jaw", say: "multiple myeloma. Its lytic bone lesions are punched-out radiolucencies on radiographs, and its calcium is high, so in the jaw it can look like the brown tumors of hyperparathyroidism; the M-spike, the rouleaux and the anemia point to myeloma. Its CRAB features are hypercalcemia, renal insufficiency, anemia and bone lesions.",
    q: "round, punched-out radiolucencies in the jaw, with high calcium and anemia." },
  { k: "hl", btn: "9 Neck nodes", site: "Neck nodes", fam: "ly", badge: [182, 230], tgt: [FX + 28, 226], ring: [FX + 35, 234, 20, 31],
    dz: ["Classic Hodgkin", "lymphoma"], clue: ["painless, firm nodes", "above the diaphragm"], cu: cuNodes(),
    labs: [[["cervical nodes"], [104, 40]], [["supraclavicular node"], [128, 84]], [["mediastinal mass"], [98, 128]]],
    info: "the cervical and supraclavicular nodes", say: "classic Hodgkin lymphoma. More than 70 percent of patients with early-stage disease present with enlarged cervical or supraclavicular nodes, and more than 60 percent have mediastinal involvement. The nodes are painless and firm, and the disease spreads from one node group to the next contiguous group; B symptoms come in about 20 percent of localized and 70 percent of advanced disease, and rarely the nodes hurt after drinking alcohol. Reed-Sternberg cells, with their owl's-eye nucleoli, make the diagnosis.",
    q: "painless, firm nodes in the neck and above the collarbone, with a mass in the chest." },
];

/* ---------- page helpers (serialized into the page) ---------- */
function hnBadge(S, i, on, D) {
  var x = S.badge[0], y = S.badge[1], o = "";
  if (S.tgt) o += '<path class="lead hn-lead' + (on ? " is-on" : "") + '" d="M' + x + " " + y + "L" + S.tgt[0] + " " + S.tgt[1] + '"/><circle class="dot" cx="' + S.tgt[0] + '" cy="' + S.tgt[1] + '" r="1.8"/>';
  o += '<circle class="hn-b hn-' + S.fam + (on ? " is-on" : "") + '" cx="' + x + '" cy="' + y + '" r="9.5"/>' + T(x, y + 4.5, String(i + 1), "b hn-bt" + (on ? " is-on" : ""), "middle");
  return o;
}
function hnOn(st, k) {
  if (k === "rv") { st.rs = st.s; st.rv = 0; }
  if (k === "qz") st.rs = -1;
}
function hnRender(st, D) {
  var o = D.BASE, S = D.SITES[st.s], rev = !st.qz || st.rs === st.s, i, y, x0 = 190, cx = D.CU[0], cy = D.CU[1];
  /* the ring on the picked site, then every badge */
  o += '<ellipse class="hn-ring" cx="' + S.ring[0] + '" cy="' + S.ring[1] + '" rx="' + S.ring[2] + '" ry="' + S.ring[3] + '"/>';
  for (i = 0; i < D.SITES.length; i++) {
    var B = D.SITES[i];
    o += HOT((i + 1) + " · " + B.site + (st.qz ? ". Which disease shows here? Pick " + (i + 1) + " under the drawing for the clue." : ": " + B.dz.join(" ") + ". Pick " + (i + 1) + " under the drawing for the close-up."), hnBadge(B, i, i === st.s, D));
  }
  /* the legend: what the badge colors mean */
  o += '<circle class="hn-b hn-ly" cx="104" cy="306" r="5"/>' + T(113, 310, "lymphoma", "s mut", "start") + '<circle class="hn-b hn-le" cx="196" cy="306" r="5"/>' + T(205, 310, "leukemia", "s mut", "start") + '<circle class="hn-b hn-pc" cx="282" cy="306" r="5"/>' + T(291, 310, "plasma cell", "s mut", "start");
  /* the card: the site, a close-up of the finding, the disease (hidden in a quiz until asked for), the clue, what to look for */
  o += '<rect class="hn-card" x="6" y="318" width="408" height="' + (D.H - 324) + '" rx="10"/>';
  o += T(16, 337, (st.s + 1) + " · " + S.site, "b", "start");
  o += HOT("Close-up: " + S.site.toLowerCase() + ", drawn as a schematic.", '<g transform="translate(' + cx + " " + cy + ')">' + S.cu + D.CUT + "</g>");
  y = 362;
  if (rev) S.dz.forEach(function (s) { o += T(x0, y, s, "b hn-dz hn-" + S.fam, "start"); y += 18; });
  else { o += T(x0, y, "Which disease?", "b mut", "start"); y += 18; }
  y += 4;
  S.clue.forEach(function (s) { o += T(x0, y, s, "s", "start"); y += 16; });
  y += 14;
  S.labs.forEach(function (l) {
    o += L(x0, y, l[0][0], cx + l[1][0], cy + l[1][1], "start", "b");
    for (var j = 1; j < l[0].length; j++) o += T(x0, y + 18 * j, l[0][j], "b", "start");
    y += 30 + 18 * (l[0].length - 1);
  });
  return o;
}
function hnSay(st, D) {
  var S = D.SITES[st.s], rev = !st.qz || st.rs === st.s, n = st.s + 1, s;
  if (rev) s = "Site " + n + ", " + S.info + ": " + S.say;
  else s = "Site " + n + ", " + S.info + ": " + S.q + " Which disease is it? Pick Show the disease to check.";
  return [s, n + " of 9 · " + (st.qz ? "quiz" : D.FAM[S.fam])];
}

export default function hnmap() {
  const D = {
    BASE: face() + mouth(), CUT, SITES: SITES.map(({ k, btn, ...s }) => Object.assign(s, { labs: s.labs.slice().sort((a, b) => a[1][1] - b[1][1]) })), FAM, CU, H,
    ANIM: false, ONSET: "hnOn", STEPKEY: "s", STEPMAX: 8, PLAYMS: 4200,
    INIT: { s: 0, qz: 0, rv: 0, rs: -1 },
  };
  const btn = (k, v, s, aria) => `<button type="button" class="am-btn" data-amk="${k}" data-amv="${v}"${aria ? ` aria-label="${aria}"` : ""}>${s}</button>`;
  return makeFig({
    id: "hnmap", lec: "lymleuk", fig: "Fig 21", short: "Head and neck map", hint: "pick a site · hover",
    title: "Head and neck map",
    caption: "Where the lymphomas and leukemias show in the head, the neck and the mouth: nine sites, each with its close-up, its disease and its clue. A map, not one patient.",
    W, H,
    label: "A face and neck in front view beside the inside of an open mouth, with nine numbered sites: the eye, the hard palate with a necrotic perforation, a swollen parotid, an enlarged tonsil, gums swollen over the lower teeth, oozing upper gums with petechiae on the soft palate, a mass expanding a child's jaw, punched-out holes in the jaw, and enlarged cervical and supraclavicular nodes. Below, a card with a close-up of the picked site, its disease and its clue.",
    D, render: hnRender, say: hnSay, helpers: [hnBadge, hnOn],
    controls: `<div class="am-controls" role="group" aria-label="Pick a site">${SITES.map((s, i) => btn("s", i, s.btn, "Site " + (i + 1) + ": " + s.site)).join("")}</div>` +
      `<div class="am-controls"><button type="button" class="am-btn" data-amstep="1">Next site</button><button type="button" class="am-btn" data-amplay aria-pressed="false">Play</button>` +
      `<span class="hn-sep" role="group" aria-label="Mode">${btn("qz", 0, "Learn")}${btn("qz", 1, "Quiz me")}</span>${btn("rv", 1, "Show the disease")}</div>`,
    sources: [
      "From the L20 notes (Dr. Borak's slides): every site, disease and clue, in the notes' words: ocular adnexal (orbit, eyelids, conjunctiva, lacrimal gland or sac) and vitreoretinal lymphoma with a painless decrease in vision or floaters, and the ocular adnexa's link to Chlamydia psittaci; extranodal NK/T-cell lymphoma from the nose, angiodestructive with necrosis and EBV, eroding the nasal floor and perforating the hard palate; salivary MALT lymphoma after Sjögren syndrome; the tonsils as part of Waldeyer ring (sporadic Burkitt's sites and symptoms, NK/T-cell lymphoma's starting sites, and classic Hodgkin's rare extranodal start); gingival hypertrophy as organ infiltration by AML (myeloid sarcoma; acute monocytic leukemia on his slides) against bleeding gums and petechiae from marrow failure and APL's DIC; endemic Burkitt in the jaw with loss of teeth; myeloma's punched-out lytic lesions and high calcium; classic Hodgkin's painless cervical and supraclavicular nodes, mediastinal involvement and contiguous spread.",
      "Standard head and neck anatomy (Netter, Atlas of Human Anatomy; Moore, Clinically Oriented Anatomy) for where each part sits: the parotid in front of the ear and over the angle of the mandible; the tonsils between the palatoglossal and palatopharyngeal arches; the hard palate in front of the soft palate and uvula; the cervical chain along the sternocleidomastoid and the supraclavicular nodes above the clavicle. Neville, Damm, Allen and Chi, Oral and Maxillofacial Pathology, for how the oral findings look: leukemic gingival enlargement over the crowns, gingival oozing and palatal petechiae, the necrotic midline palatal perforation of NK/T-cell lymphoma, Burkitt's destructive jaw radiolucency with displaced teeth, and myeloma's sharply punched-out radiolucencies. They set the drawing only; every label is the lecture's.",
      "Schematic: drawn anew in code, not traced from photographs or radiographs, and not to scale. Every finding is drawn at once, so the face and mouth are a map, not one patient. The structures are named only where the lecture names them; the lecture's objectives say the individual CD markers aren't needed, so none are shown. Educational, not medical advice.",
    ],
    css: `
.anima[data-anima="hnmap"] .am-svg{max-width:540px}
.anima[data-anima="hnmap"] .hn-sep{display:inline-flex;gap:8px}
.anima .hnmap-svg{--hn-skin:#f6e1d4;--hn-skinl:#c49a85;--hn-bone:#f8ebe1;--hn-hair:#6e4c3c;--hn-lip:#c9827f;--hn-lipl:#94514f;--hn-cav:#4a1c27;--hn-tooth:#fdf8ee;--hn-toothl:#b5a68e;
  --hn-gum:#f4b1b9;--hn-guml:#c4646f;--hn-gumsw:#ee7f96;--hn-gumswl:#b23c58;--hn-muc:#f4bcc2;--hn-mucl:#c97a84;--hn-tongue:#e4838c;--hn-tonsil:#e7929c;--hn-red:#c8202c;
  --hn-film:#18131a;--hn-xb:#8e8790;--hn-xc:#d6d0d8;--hn-xe:#f3f0f4;--hn-xr:#bdb6bf;--hn-necr:#d9c79a;--hn-perf:#2a1016}
:root[data-theme="dark"] .anima .hnmap-svg{--hn-skin:#6f544a;--hn-skinl:#b08f80;--hn-bone:#7c6156;--hn-hair:#2e211c;--hn-lip:#94585a;--hn-lipl:#d08a86;--hn-cav:#1a0c10;--hn-tooth:#e8e1d3;--hn-toothl:#8c806c;
  --hn-gum:#b45f6b;--hn-guml:#e3929c;--hn-gumsw:#d0607a;--hn-gumswl:#ff9db2;--hn-muc:#9a5560;--hn-mucl:#d18d97;--hn-tongue:#a8525d;--hn-tonsil:#c06a76;--hn-red:#ff6b73;--hn-necr:#a99560;--hn-perf:#0d0507}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]) .anima .hnmap-svg{--hn-skin:#6f544a;--hn-skinl:#b08f80;--hn-bone:#7c6156;--hn-hair:#2e211c;--hn-lip:#94585a;--hn-lipl:#d08a86;--hn-cav:#1a0c10;--hn-tooth:#e8e1d3;--hn-toothl:#8c806c;
  --hn-gum:#b45f6b;--hn-guml:#e3929c;--hn-gumsw:#d0607a;--hn-gumswl:#ff9db2;--hn-muc:#9a5560;--hn-mucl:#d18d97;--hn-tongue:#a8525d;--hn-tonsil:#c06a76;--hn-red:#ff6b73;--hn-necr:#a99560;--hn-perf:#0d0507} }
.anima .hnmap-svg .hn-view{fill:var(--bx-lumen);stroke:var(--anatomy-lo);stroke-width:1}
.anima .hnmap-svg .hn-view.hn-edge{fill:none}
.anima .hnmap-svg .hn-card{fill:var(--bx-lumen);stroke:var(--anatomy-lo);stroke-width:1}
.anima .hnmap-svg .hn-cub{fill:var(--anatomy-shade-1);stroke:var(--anatomy-lo);stroke-width:1}
.anima .hnmap-svg .hn-skin{fill:var(--hn-skin);stroke:var(--hn-skinl);stroke-width:1}
.anima .hnmap-svg .hn-skinf{fill:var(--hn-skin)}
.anima .hnmap-svg .hn-gumswf{fill:var(--hn-gumsw)}
.anima .hnmap-svg .hn-gumswe{fill:none;stroke:var(--hn-gumswl);stroke-width:1.2;stroke-linejoin:round}
.anima .hnmap-svg .hn-lipf{fill:var(--hn-lip)}
.anima .hnmap-svg .hn-lipe{fill:none;stroke:var(--hn-lipl);stroke-width:.8}
.anima .hnmap-svg .hn-corner{fill:var(--bx-lumen)}
.anima .hnmap-svg .hn-cuf{fill:none;stroke:var(--anatomy-lo);stroke-width:1}
.anima .hnmap-svg .hn-ear{fill:none;stroke:var(--hn-skinl);stroke-width:1}
.anima .hnmap-svg .hn-line{fill:none;stroke:var(--hn-skinl);stroke-width:1.1;stroke-linecap:round}
.anima .hnmap-svg .hn-faint{fill:none;stroke:var(--hn-skinl);stroke-width:.8;opacity:.6;stroke-linecap:round}
.anima .hnmap-svg .hn-eye{fill:var(--hn-tooth);stroke:var(--hn-skinl);stroke-width:1}
.anima .hnmap-svg .hn-iris{fill:var(--bx-blue)}
.anima .hnmap-svg .hn-pupil{fill:var(--hn-perf)}
.anima .hnmap-svg .hn-lip{fill:var(--hn-lip);stroke:var(--hn-lipl);stroke-width:.8}
.anima .hnmap-svg .hn-lipr{fill:var(--hn-lip);stroke:var(--hn-lipl);stroke-width:1}
.anima .hnmap-svg .hn-swell{fill:color-mix(in srgb,var(--bx-violet) 14%,var(--hn-skin));stroke:var(--bx-violet);stroke-width:1}
.anima .hnmap-svg .hn-bone{fill:var(--hn-bone);stroke:var(--hn-skinl);stroke-width:.6;opacity:.85}
.anima .hnmap-svg .hn-mass{fill:color-mix(in srgb,var(--bx-violet) 14%,var(--hn-skin));stroke:var(--bx-violet);stroke-width:1}
.anima .hnmap-svg .hn-hole{fill:var(--hn-skin);stroke:var(--bx-gold);stroke-width:1.2}
.anima .hnmap-svg .hn-clav{fill:none;stroke:var(--hn-skinl);stroke-width:1.6;stroke-linecap:round}
.anima .hnmap-svg .hn-chain{fill:none;stroke:var(--bx-violet);stroke-width:1;opacity:.7}
.anima .hnmap-svg .hn-node{fill:color-mix(in srgb,var(--bx-violet) 35%,var(--hn-skin));stroke:var(--bx-violet);stroke-width:1}
.anima .hnmap-svg .hn-medi{fill:color-mix(in srgb,var(--bx-violet) 22%,var(--hn-skin));stroke:var(--bx-violet);stroke-width:1}
.anima .hnmap-svg .hn-cav{fill:var(--hn-cav)}
.anima .hnmap-svg .hn-hard{fill:color-mix(in srgb,var(--hn-muc) 70%,var(--hn-tooth));stroke:var(--hn-mucl);stroke-width:.6}
.anima .hnmap-svg .hn-soft{fill:var(--hn-muc);stroke:var(--hn-mucl);stroke-width:.8}
.anima .hnmap-svg .hn-pillar{fill:none;stroke:var(--hn-mucl);stroke-width:3;stroke-linecap:round;opacity:.9}
.anima .hnmap-svg .hn-tonsil{fill:var(--hn-tonsil);stroke:var(--hn-mucl);stroke-width:1}
.anima .hnmap-svg .hn-crypt{fill:var(--hn-mucl)}
.anima .hnmap-svg .hn-tongue{fill:var(--hn-tongue);stroke:var(--hn-mucl);stroke-width:1}
.anima .hnmap-svg .hn-tooth{fill:var(--hn-tooth);stroke:var(--hn-toothl);stroke-width:.8}
.anima .hnmap-svg .hn-gum{fill:var(--hn-gum);stroke:var(--hn-guml);stroke-width:.9}
.anima .hnmap-svg .hn-gumband{fill:none;stroke:var(--hn-gum);stroke-width:30;stroke-linecap:round;stroke-linejoin:round}
.anima .hnmap-svg .hn-gumsw{fill:var(--hn-gumsw);stroke:var(--hn-gumswl);stroke-width:1.2}
.anima .hnmap-svg .hn-blood{fill:var(--hn-red)}
.anima .hnmap-svg .hn-pet{fill:var(--hn-red)}
.anima .hnmap-svg .hn-necr{fill:var(--hn-necr);stroke:color-mix(in srgb,var(--hn-necr) 60%,var(--hn-perf));stroke-width:.8}
.anima .hnmap-svg .hn-perf{fill:var(--hn-perf)}
.anima .hnmap-svg .hn-fat{fill:var(--bx-fat);stroke:var(--bx-fat-line);stroke-width:1}
.anima .hnmap-svg .hn-sclera{fill:var(--hn-tooth);stroke:var(--hn-toothl);stroke-width:1.2}
.anima .hnmap-svg .hn-ret{fill:none;stroke:var(--bx-blood);stroke-width:2.4}
.anima .hnmap-svg .hn-cornea{fill:color-mix(in srgb,var(--bx-blue) 18%,var(--hn-tooth));stroke:var(--hn-toothl);stroke-width:1}
.anima .hnmap-svg .hn-lens{fill:color-mix(in srgb,var(--bx-blue) 25%,var(--hn-tooth));stroke:var(--bx-blue);stroke-width:.8}
.anima .hnmap-svg .hn-nerve{fill:var(--bx-gold-soft);stroke:var(--bx-gold);stroke-width:1}
.anima .hnmap-svg .hn-gland{fill:color-mix(in srgb,var(--bx-violet) 25%,var(--hn-skin));stroke:var(--bx-violet);stroke-width:1}
.anima .hnmap-svg .hn-cell{fill:var(--bx-violet)}
.anima .hnmap-svg .hn-film{fill:var(--hn-film)}
.anima .hnmap-svg .hn-xbone{fill:var(--hn-xb)}
.anima .hnmap-svg .hn-xcort{fill:var(--hn-xc)}
.anima .hnmap-svg .hn-xcanal{fill:none;stroke:var(--hn-film);stroke-width:2.2;opacity:.45}
.anima .hnmap-svg .hn-xlucent{fill:var(--hn-film);opacity:.88}
.anima .hnmap-svg .hn-xhole{fill:var(--hn-film);stroke:var(--hn-xc);stroke-width:.6}
.anima .hnmap-svg .hn-xroot{fill:var(--hn-xr);stroke:var(--hn-xc);stroke-width:.5}
.anima .hnmap-svg .hn-xenam{fill:var(--hn-xe);stroke:var(--hn-xc);stroke-width:.5}
.anima .hnmap-svg .hn-b{stroke-width:1.4}
.anima .hnmap-svg .hn-b.hn-ly{fill:var(--bx-violet-soft);stroke:var(--bx-violet)}
.anima .hnmap-svg .hn-b.hn-le{fill:var(--bx-blood-soft);stroke:var(--bx-blood)}
.anima .hnmap-svg .hn-b.hn-pc{fill:var(--bx-gold-soft);stroke:var(--bx-gold)}
.anima .hnmap-svg .hn-b.is-on.hn-ly{fill:var(--bx-violet)}
.anima .hnmap-svg .hn-b.is-on.hn-le{fill:var(--bx-blood)}
.anima .hnmap-svg .hn-b.is-on.hn-pc{fill:var(--bx-gold)}
.anima .hnmap-svg .t.hn-bt{font-size:12.5px;stroke:none}
.anima .hnmap-svg .t.hn-bt.is-on{fill:var(--surface)}
.anima .hnmap-svg .t.hn-dz.hn-ly{fill:var(--bx-violet)}
.anima .hnmap-svg .t.hn-dz.hn-le{fill:var(--bx-blood)}
.anima .hnmap-svg .t.hn-dz.hn-pc{fill:color-mix(in srgb,var(--bx-gold) 70%,var(--anatomy-strong))}
.anima .hnmap-svg .hn-lead.is-on{stroke:var(--anatomy-strong);stroke-width:1.2}
.anima .hnmap-svg .dot{stroke:var(--surface);stroke-width:1}
.anima .hnmap-svg .hn-ring{fill:none;stroke:var(--anatomy-strong);stroke-width:2.2}
.anima .hnmap-svg .hn-hair{fill:var(--hn-hair);stroke:var(--hn-skinl);stroke-width:.8}
.anima .hnmap-svg .hn-tline{fill:none;stroke:var(--hn-mucl);stroke-width:1;stroke-linecap:round;opacity:.7}
.anima .hnmap-svg .hn-gumhi{fill:none;stroke:var(--hn-tooth);stroke-width:1.2;stroke-linecap:round;opacity:.45}
@media (max-width:560px){.anima .hnmap-svg .t{font-size:14px}.anima .hnmap-svg .t.s,.anima .hnmap-svg .t.hn-bt{font-size:13.6px}}
`,
  });
}
