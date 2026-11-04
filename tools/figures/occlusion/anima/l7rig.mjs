// The side-view rig shared by three L7 figures (stability.mjs, splints.mjs, tolerance.mjs): the skull (cranium,
// orbit, nasal aperture, maxilla, zygoma and zygomatic arch, the temporal bone's fossa, eminence, ear canal, mastoid and
// styloid), the mandible with its condyle, neck, sigmoid notch, coronoid process, ramus, angle and chin, the disc, and
// both dental arches, seen from the side with anterior to the left (as in hingearc.mjs), which is the patient's left
// side. Units are millimeters, y up; the seated condyle's center is the origin, and the occlusal plane is
// level. The geometry is built here in Node; the poses (where the condyle is and how far the jaw has hinged open) are
// solved here too and stored as data, so the browser only transforms and draws.
// Schematic: the posterior teeth are a lateral view with the cusps as a regular zigzag (about 26-degree inclines), the
// canines are seen from the side and the incisors in profile, all in one row (the arch laid out flat, so the front teeth
// sit a little farther forward than in a true side view); the skull and mandible are drawn to typical adult proportions
// around that row, and the joint is drawn for clarity, not traced from imaging.

const r1 = (v) => Math.round(v * 100) / 100;
const P2 = (pts) => pts.map((p) => [r1(p[0]), r1(p[1])]);

/* the articular surface: postglenoid process, the fossa roof, the posterior slope of the eminence, the crest. Close to
   the seated condyle (r 4) along the slope (where the disc's thin intermediate zone goes), farther over the top and in
   front (the posterior and anterior bands) */
const ART = [[8.2, -1.6], [7.5, 2.6], [5.6, 5.5], [2.6, 6.7], [-0.5, 6.6], [-2.8, 5.2], [-4.4, 3.4], [-6, 1.4], [-8, -0.8], [-10, -2.2], [-12.5, -2.9], [-15.5, -2.4], [-18.5, -0.6], [-21.5, 1.9]];
const CR = 4; /* condyle radius */

/* the eminence direction the condyle travels when it comes off its seat (forward and down) */
const EMI = (() => { const a = 60 * Math.PI / 180; return [-Math.cos(a), -Math.sin(a)]; })();

/* sample the smoothed articular curve as a polyline (for the disc and for clipping) */
function sampleSmooth(pts, n) {
  const out = []; const N = pts.length;
  for (let i = 0; i < N - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(N - 1, i + 2)];
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[N - 1]);
  return out;
}
const ARTS = sampleSmooth(ART, 8);

/* distance from the origin to the articular curve along a ray at angle a (radians, 0 = posterior (+x), pi/2 = up) */
function rayToArt(a) {
  const dx = Math.cos(a), dy = Math.sin(a); let best = Infinity;
  for (let i = 0; i < ARTS.length - 1; i++) {
    const [x1, y1] = ARTS[i], [x2, y2] = ARTS[i + 1], ex = x2 - x1, ey = y2 - y1, den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-9) continue;
    const t = (x1 * ey - y1 * ex) / den, u = (x1 * dy - y1 * dx) / den;
    if (t > 0 && u >= 0 && u <= 1 && t < best) best = t;
  }
  return best;
}
/* the disc, relative to the condyle's center: its thickness (mm) by angle around the condyle (0 = straight back,
   90 = straight up, 180 = straight forward). The posterior band (about 3 mm) sits on top of the condyle, the thin
   intermediate zone (about 1 mm) between the condyle and the eminence's posterior slope, the anterior band (about 2 mm)
   in front; both ends taper (the bilaminar zone behind and the anterior attachment in front aren't drawn). Wherever the
   joint space is narrower than that, the disc fills it */
const DISC_T = [[40, 0.5], [46, 1.6], [54, 2.8], [62, 3.1], [88, 3.1], [116, 1.7], [136, 1.1], [150, 1.3], [163, 1.95], [171, 1.9], [178, 1.3], [184, 0.5]];
function discT(d) { for (let i = 1; i < DISC_T.length; i++) if (d <= DISC_T[i][0]) { const [a0, t0] = DISC_T[i - 1], [a1, t1] = DISC_T[i]; return t0 + (t1 - t0) * (d - a0) / (a1 - a0); } return DISC_T[DISC_T.length - 1][1]; }
function discPoly() {
  const outer = [], inner = [], r0 = CR + 0.08;
  for (let d = 40; d <= 184; d += 2) { const a = d * Math.PI / 180, R = r0 + Math.min(rayToArt(a) - 0.12 - r0, discT(d)); outer.push([R * Math.cos(a), R * Math.sin(a)]); }
  for (let d = 184; d >= 40; d -= 4) { const a = d * Math.PI / 180; inner.push([r0 * Math.cos(a), r0 * Math.sin(a)]); }
  return P2(outer.concat(inner));
}

/* ---------- the teeth (MIP, skull coordinates) ---------- */
const PER = 5.4, HP = PER / 2, YT = -42, YB = -43.3; /* cusp period, the interface's high and low points */
const U0 = -35; /* distal of the upper second molar */
/* upper posterior crowns: [name, periods]; lower ones start half a period mesial (Class I) */
const UPW = [["M2", 2], ["M1", 2], ["PM2", 1], ["PM1", 1]];
function zig(x) { /* the MIP interface: upper valleys (= lower cusp tips) at U0 - k*PER, upper cusp tips half a period on */
  const k = (U0 - x) / HP; const i = Math.floor(k), f = k - i;
  const yi = (i % 2 === 0) ? YT : YB, yj = (i % 2 === 0) ? YB : YT;
  return yi + (yj - yi) * f;
}
/* cementoenamel junctions (crown heights: upper molars about 7 mm, premolars 8, lower molars 7.5, premolars 8) */
const CEJ = { up: { M: -36, PM: -35.2 }, lo: { M: -49.4, PM: -50 } };
/* a posterior crown: the occlusal zigzag (shared with the solver), the contact areas in the occlusal third, the
   crown narrowing to the CEJ and a little root (hidden under the alveolar bone) */
function crownUp(xa, xp, kind) { /* xa anterior (more negative), xp posterior */
  const nx = Math.round((xp - xa) / HP), cej = CEJ.up[kind], inC = kind === "M" ? 1.2 : 0.9; /* make sure the zigzag hits each cusp tip exactly */
  const z = [[xa + 0.25, zig(xa + 0.25)]]; for (let k = 1; k < nx; k++) z.push([xa + k * HP, zig(xa + k * HP)]); z.push([xp - 0.25, zig(xp - 0.25)]);
  return P2([[xp - inC - 0.4, -29], [xa + inC + 0.4, -29], [xa + inC, cej], [xa + 0.4, -38.4], [xa + 0.03, -40.8]].concat(z, [[xp - 0.03, -40.8], [xp - 0.4, -38.4], [xp - inC, cej]]));
}
function crownLo(xa, xp, kind) {
  const nx = Math.round((xp - xa) / HP), cej = CEJ.lo[kind], inC = kind === "M" ? 1.2 : 0.9;
  const z = [[xp - 0.25, zig(xp - 0.25)]]; for (let k = nx - 1; k >= 1; k--) z.push([xa + k * HP, zig(xa + k * HP)]); z.push([xa + 0.25, zig(xa + 0.25)]);
  return P2([[xa + inC + 0.4, -56], [xp - inC - 0.4, -56], [xp - inC, cej], [xp - 0.4, -46.9], [xp - 0.03, -44.7]].concat(z, [[xa + 0.03, -44.7], [xa + 0.4, -46.9], [xa + inC, cej]]));
}
/* an incisor in profile (labiolingual section), in its own frame: u toward the labial, v along the long axis from the
   incisal edge toward the apex. Upper central: crown 10.5 mm, root 13; lower central: crown 9, root 12 */
const PROF_UP = [[0.35, 0], [1.5, 1.8], [2.6, 4.6], [3.3, 7.6], [3.55, 10.4], [3.3, 13], [2.6, 17.5], [1.4, 21.5], [0, 23.5], [-1.4, 21.5], [-2.5, 17.5], [-3.1, 13], [-3.3, 10.3], [-3.0, 8.3], [-2.3, 6.6], [-1.8, 5.2], [-1.4, 4], [-0.9, 2], [-0.35, 0]];
const PROF_LO = [[0.3, 0], [1.2, 2], [2.0, 4.5], [2.6, 7], [2.8, 9], [2.6, 11], [2.0, 15], [1.0, 19.5], [0, 21], [-1.0, 19.5], [-2.1, 15], [-2.8, 11], [-3.0, 9], [-2.9, 8], [-2.2, 6.6], [-1.4, 4.5], [-0.85, 2], [-0.3, 0]];
/* place a profile: tip, the axis's tilt from vertical (crown forward), up or down, and a size */
function place(tip, deg, up, pts, su = 1, sv = 1) {
  const a = deg * Math.PI / 180, s = Math.sin(a), c = Math.cos(a);
  const ax = up ? [s, c] : [s, -c], lab = up ? [-c, s] : [-c, -s];
  return pts.map(([u, v]) => [tip[0] + u * su * lab[0] + v * sv * ax[0], tip[1] + u * su * lab[1] + v * sv * ax[1]]);
}
const INC_UP = [-89.6, -43.4], INC_LO = [-86, -39.3]; /* the central incisors' tips: 4.1 mm overbite, about 3 mm overjet */
const UC_TIP = [-72.2, -44.7], LC_TIP = [-74.6, -41.1]; /* the canine tips */
function teeth() {
  const up = [], lo = [], cuspLo = [], cuspUp = [];
  let x = U0;
  for (const [n, w] of UPW) { const xa = x - w * PER; up.push({ n, g: "post", pts: crownUp(xa, x, n[0] === "M" ? "M" : "PM") }); for (let k = 0; k < w; k++) cuspUp.push([r1(x - HP - k * PER), YB]); x = xa; }
  x = U0 - HP;
  for (const [n, w] of UPW) { const xa = x - w * PER; lo.push({ n, g: "post", pts: crownLo(xa, x, n[0] === "M" ? "M" : "PM") }); for (let k = 0; k < w; k++) cuspLo.push([r1(x - HP - k * PER), YT]); x = xa; }
  /* the front teeth: the laterals (drawn faint, so the centrals' overjet and overbite read through them), the centrals
     in profile, then the canines nearest the viewer. The upper canine's tip sits between the lower canine and first
     premolar */
  up.push({ n: "I2", g: "ant", pts: P2(place([-82.2, -42.6], 24, true, PROF_UP, 0.9, 0.88)) });
  lo.push({ n: "I2", g: "ant", pts: P2(place([-82.7, -39.6], 16, false, PROF_LO, 1, 1.03)) });
  up.push({ n: "I1", g: "ant", pts: P2(place(INC_UP, 22, true, PROF_UP)) });
  lo.push({ n: "I1", g: "ant", pts: P2(place(INC_LO, 18, false, PROF_LO)) });
  up.push({ n: "C", g: "ant", pts: [UC_TIP, [-73.6, -43.4], [-75, -42], [-75.9, -40.8], [-76.1, -39.2], [-75.6, -37], [-74.9, -34.8], [-74.6, -31], [-73.8, -25], [-72.4, -19.5], [-71.2, -17.6], [-70.2, -19.5], [-69.2, -25], [-68.6, -31], [-68.7, -34.5], [-68, -37], [-67.48, -40.5], [-68.4, -41.8], [-69.8, -43.1], [-71.1, -44.3]] });
  lo.push({ n: "C", g: "ant", pts: [LC_TIP, [-73.4, -42], [-72, -43.2], [-70.18, -44.7], [-70.1, -46.5], [-70.6, -49.5], [-71.3, -51.6], [-71.6, -56], [-72.4, -62], [-73.6, -66.5], [-74.9, -62], [-75.8, -56], [-76.3, -51.8], [-77.1, -49], [-77.4, -46.2], [-77.2, -43.8], [-76.4, -42.5], [-75.5, -41.6]] });
  /* where splints meet the front teeth: a point on the upper central's lingual surface near its edge, and the labial
     surfaces of the two centrals (for the splints' labial flanges) */
  const uLing = place(INC_UP, 22, true, [[-0.95, 1.6]])[0];
  const uLab = place(INC_UP, 22, true, [[0.35, 0], [1.5, 1.8], [2.4, 3.6]]), lLab = place(INC_LO, 18, false, [[0.3, 0], [1.2, 2], [2.0, 4.5]]);
  return { up, lo, cuspLo, cuspUp, inc: INC_LO, incUp: INC_UP, uLing: P2([uLing])[0], uLab: P2(uLab), lLab: P2(lLab) };
}

/* the alveolar margins, front to back: over each root the bone sits about 2 mm from the CEJ, between the teeth the
   septum rises into the embrasure */
const ALV_UP = [[-84.6, -31.9], [-80.8, -31.6], [-76.4, -32.9], [-72, -32.7], [-67.5, -34], [-64.7, -33.4], [-62, -34.5], [-59.3, -33.4], [-56.6, -34.8], [-51.2, -34.1], [-45.8, -35.2], [-40.4, -34.1], [-35.4, -34.6]];
const ALV_LO = [[-80.6, -50.2], [-77.2, -49.6], [-73.9, -53.2], [-70.1, -51], [-67.4, -51.8], [-64.7, -50.6], [-62, -51.8], [-59.3, -50.4], [-53.9, -51.2], [-48.5, -50], [-43.1, -51.2], [-38.4, -50.4]];

/* the mandible in side view, condyle center at its origin (MIP); its condylar head is drawn as the circle over the
   neck. Gonial angle about 117 degrees, the lower border about 13 degrees to the occlusal plane; the ramus is long
   because the rig's teeth sit 42 mm below the condyle */
function jawPoly() {
  const T = teeth(), lab = place(INC_LO, 18, false, [[3.0, 11], [2.9, 12.5]]); /* infradentale, on the labial plate */
  return P2([[3.3, -2.3], [3.9, -6.5], [4.1, -11], [3.8, -18], [3.2, -27], [2.4, -36], [1.3, -44], [-0.4, -51],
    [-2.8, -56.6], [-6.4, -61.2], [-11, -64.2], [-16, -65.6], [-21, -66], [-27, -67.2], [-36, -69.6], [-48, -72.8], [-60, -75.8], [-70, -78.4], [-76.5, -80.4],
    [-80.8, -81.2], [-84.4, -79.6], [-86.4, -75.8], [-87, -70.6], [-86.3, -65.5], [-84.6, -60.5], [-84, -56.5], lab[1], lab[0]]
    .concat(ALV_LO, [[-36.2, -50.2], [-33.6, -48.6], [-31.6, -45.4], [-30.4, -39], [-29.6, -30], [-29.4, -20], [-29.8, -10], [-30.6, -2.5], [-31, 2], [-30.2, 3.6], [-28.6, 3],
      [-25.5, -1], [-21.5, -6.5], [-17, -10.6], [-12.5, -12.4], [-8.6, -11.6], [-5.8, -8.6], [-4.4, -5.4], [-3.3, -2.3]]));
}

/* ---------- the skull ---------- */
/* the face's front: prosthion (on the upper central's labial plate), A point, the anterior nasal spine, the nasal notch */
function faceFront() {
  const pr = place(INC_UP, 22, true, [[3.9, 12.2]])[0];
  return [pr, [-87.1, -27.4], [-86.3, -23.8], [-86.9, -19.8], [-91.6, -16.4], [-89, -15.4], [-86.6, -14.2], [-85.3, -9.5], [-84.9, -2], [-85.2, 3]];
}
/* behind the eminence: the arch's lower border, then the maxilla's posterior surface down to the tuberosity */
const ARCH_LO = [[-26.5, 1.2], [-32, 0.4], [-37.4, -0.6], [-40.4, -3.4], [-41.6, -9], [-41.4, -16], [-39.8, -22.4], [-37.6, -27.4], [-35.6, -30.6], [-34.6, -33.2]];
/* the whole skull's outline (the layer behind the mandible), counterclockwise from the prosthion */
function backPoly() {
  const F = faceFront();
  return P2(F.concat([[-85.8, 7], [-87.4, 13], [-89.4, 18.6], [-91.2, 22.5], [-88.6, 28.5], [-85.2, 35], [-82.4, 39.5], [-84.8, 45], [-86.4, 51],
    [-85.6, 60], [-81, 75], [-72, 90], [-57, 104], [-37, 115], [-12, 121], [12, 122], [36, 116], [56, 103], [72, 84], [82, 62], [86, 42], [85, 30], [82, 20], [79, 14],
    [70, 6], [56, -1.5], [42, -7.5], [33, -11], [29.2, -15.2], [24.6, -22.2], [21.2, -19.6], [19.6, -14], [18.2, -8.8], [15.6, -5.6], [11.6, -4.2], [8.8, -2.6]],
  ART, ARCH_LO, ALV_UP.slice().reverse()));
}
/* the zygomatic arch, the zygoma and the maxilla: drawn over the coronoid process and the upper roots */
function frontPoly() {
  const F = faceFront();
  return P2([[8.8, -2.6]].concat(ART, ARCH_LO, ALV_UP.slice().reverse(), F,
    [[-79.5, 10.5], [-74, 13.2], [-66, 13.6], [-60, 14.8], [-56, 13.4], [-50.6, 9.6], [-46, 8.6], [-36, 8.2], [-26, 8.4], [-16, 9.2], [-7, 10.6], [2, 11.8], [9, 12], [10.4, 8], [9.8, 3.5], [9.3, 0]]));
}
/* its outlines: the lower edge (fossa, eminence, arch, maxilla, alveolar margin, face) and the zygoma's back edge
   running into the arch's upper border, which ends on the ear canal */
function frontEdges() {
  const F = faceFront();
  return [P2([[8.8, -2.6]].concat(ART, ARCH_LO, ALV_UP.slice().reverse(), F)),
    P2([[-57.8, 27], [-52.5, 29.5], [-49.2, 24], [-48.6, 16], [-46.5, 10.4], [-40, 8.4], [-30, 8.2], [-18, 8.8], [-8, 10.4], [2, 11.9], [8.6, 11.6], [10.6, 8.6], [11.06, 4.83]])];
}
/* the maxilla's posterior surface, in shadow behind the key ridge (the zygoma's lower border running down to the
   alveolar process over the first molar) */
const SHADE = [[-37.4, -0.6], [-42, -2.6], [-47, -6.5], [-50.4, -12], [-51.6, -18], [-52.4, -24], [-52.2, -29.4], [-46, -32.2], [-40, -32.6], [-35.6, -30.6], [-37.6, -27.4], [-39.8, -22.4], [-41.4, -16], [-41.6, -9], [-40.4, -3.4]];
/* the deep space seen through the sigmoid notch, in front of the coronoid and behind the ramus */
const DEEP = [[-37.6, -27.4], [-39.8, -22.4], [-41.4, -16], [-41.6, -9], [-40.4, -3.4], [-37.4, -0.6], [-32, 0.4], [-26.5, 1.2], [-21.5, 1.9]]
  .concat(ART.slice().reverse(), [[8.8, -2.6], [11.6, -4.2], [15.6, -5.6], [18.2, -8.8], [19.6, -14], [21.2, -19.6], [16, -22.5], [8, -25.5], [-2, -28.5], [-14, -31], [-26, -33.4], [-33, -34.4], [-35.2, -33.6], [-35.6, -30.6]]);
const STYLOID = [[10.4, -6.2], [12, -6.9], [8.2, -17.8], [5.5, -25.6], [4.9, -25.3], [6.7, -17.4]];
const ORBIT = [[-58.4, 18], [-57.8, 27], [-59, 37], [-62.5, 45], [-68.5, 49.5], [-75, 49], [-79.4, 43.5], [-80.6, 34], [-79.6, 24.5], [-76.2, 17.6], [-70, 14.6], [-63.4, 15.2]];
/* the nasal aperture, seen edge-on: the notch between its lateral margin and the line from the spine to the nasal bones */
const NASAL = [[-91.6, -16.4], [-89, -15.4], [-86.6, -14.2], [-85.3, -9.5], [-84.9, -2], [-85.2, 3], [-85.8, 7], [-87.4, 13], [-89.4, 18.6], [-91.2, 22.5], [-92.2, 12], [-92.6, 0], [-92.3, -9]];
/* where the temporalis takes origin (the temporal line) */
const TEMPLINE = [[-55.8, 33], [-52, 50], [-40, 68], [-18, 81], [8, 86], [32, 80], [50, 66], [58, 48], [56, 30], [46, 17], [30, 11.6]];
const EAM = { c: [13.6, 2], rx: 3.4, ry: 4.4 };

/* BACK: the whole skull's outline; FRONT: the layer drawn over the mandible (the temporal bone's fossa and eminence, the
   zygomatic arch, the zygoma and the maxilla). SKULL is the same outline as FRONT, kept under its old name for figures
   that draw the skull as one shape around the joint and ray-cast the articular surface from the condyle (crslide) */
export function rig() {
  const T = teeth(), front = frontPoly();
  return { BACK: backPoly(), FRONT: front, SKULL: front, EDGES: frontEdges(), SHADE: P2(SHADE), DEEP: P2(DEEP), STYLOID: P2(STYLOID), ORBIT: P2(ORBIT), NASAL: P2(NASAL), TEMPLINE: P2(TEMPLINE), EAM,
    IOF: [-71.5, 7.6], MF: [-62.5, -64],
    CR, EMI: P2([EMI])[0], JAW: jawPoly(), DISC: discPoly(),
    UP: T.up, LO: T.lo, CUSP_LO: T.cuspLo, CUSP_UP: T.cuspUp, INC: T.inc, INC_UP: T.incUp, U_LING: T.uLing, U_LAB: T.uLab, L_LAB: T.lLab, UC_TIP, LC_TIP, PER, YT, YB };
}

/* rigid pose: a point of the MIP-referenced jaw goes to C + R(th)(p - Cm) */
function tf(p, P) { const x = p[0] - P.Cm[0], y = p[1] - P.Cm[1], c = Math.cos(P.th), s = Math.sin(P.th); return [P.C[0] + x * c - y * s, P.C[1] + x * s + y * c]; }
/* the upper interface's height at x (posterior teeth) */
function upperAt(x) { return zig(x); }
/* closing on the hinge with the condyle at C, the smallest opening th with no lower posterior point above the uppers */
function contactTh(C, Cm, T) {
  const samples = [];
  for (const t of T.lo) if (t.g === "post") for (const p of t.pts) if (p[1] > -44.5) samples.push(p);
  const pen = (th) => { let m = -Infinity; for (const q of samples) { const r = tf(q, { C, Cm, th }); if (r[0] > -67.2 && r[0] < -35.2) m = Math.max(m, r[1] - upperAt(r[0])); } return m; };
  /* close from wide open until the first touch (the pen curve isn't monotonic: closing carries the lower cusps up and
     forward over the upper inclines), then refine */
  let hi = 0.3, lo = hi; const step = 0.0005;
  while (lo > 0 && pen(lo - step) < 0) lo -= step;
  if (lo <= step) return 0;
  hi = lo; lo = lo - step; for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (pen(mid) >= 0) lo = mid; else hi = mid; }
  return hi;
}
/* with the condyle at C, the opening at which the lower cusp tips sit `gap` mm below the upper cusp tips (a splint's
   thickness), measured at the thinnest place */
function splintTh(C, Cm, T, gap, arch) {
  const f = (th) => {
    const P = { C, Cm, th }, lt = T.cuspLo.map((q) => tf(q, P));
    /* a maxillary splint's flat plane runs through the lower cusp tips; a mandibular one's through the upper cusp tips */
    const a = lt[0], b = lt[lt.length - 1], k = (b[1] - a[1]) / (b[0] - a[0]);
    let m = Infinity;
    if (arch === "max") for (const u of T.cuspUp) m = Math.min(m, u[1] - (a[1] + k * (u[0] - a[0])));
    else for (const l of lt) m = Math.min(m, YB - l[1]);
    return m;
  };
  let lo = 0, hi = 0.4; for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (f(mid) < gap) lo = mid; else hi = mid; }
  return hi;
}
/* where the first contact is, at a pose */
function contactPt(P, T) {
  let m = -Infinity, at = null;
  for (const t of T.lo) if (t.g === "post") for (const p of t.pts) { const r = tf(p, P); if (r[0] > -67.2 && r[0] < -35.2) { const v = r[1] - upperAt(r[0]); if (v > m) { m = v; at = r; } } }
  return P2([at])[0];
}
export const rigSolve = { contactTh, splintTh, contactPt, upperAt, tf, EMI, teeth };

/* ---------- browser helpers (stringified into each figure; they use only their arguments and each other) ---------- */
/* the pose transform, as above */
function rgT(p, P) { var x = p[0] - P.Cm[0], y = p[1] - P.Cm[1], c = Math.cos(P.th), s = Math.sin(P.th); return [P.C[0] + x * c - y * s, P.C[1] + x * s + y * c]; }
/* polygon or polyline to a path in screen space; V = {OX, OY, S} */
function rgD(pts, V, closed) { var f = function (n) { return Math.round(n * 10) / 10; }; return "M" + pts.map(function (p) { return f(V.OX + p[0] * V.S) + " " + f(V.OY - p[1] * V.S); }).join("L") + (closed ? "Z" : ""); }
/* clip a polygon to an axis-aligned box (Sutherland-Hodgman), skull coordinates */
function rgClip(pts, b) {
  function side(arr, inside, cut) { var out = []; for (var i = 0; i < arr.length; i++) { var a = arr[i], c = arr[(i + 1) % arr.length], ia = inside(a), ic = inside(c); if (ia) out.push(a); if (ia !== ic) out.push(cut(a, c)); } return out; }
  function lerp(a, c, t) { return [a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t]; }
  var r = pts;
  r = side(r, function (p) { return p[0] >= b[0]; }, function (a, c) { return lerp(a, c, (b[0] - a[0]) / (c[0] - a[0])); }); if (!r.length) return r;
  r = side(r, function (p) { return p[0] <= b[2]; }, function (a, c) { return lerp(a, c, (b[2] - a[0]) / (c[0] - a[0])); }); if (!r.length) return r;
  r = side(r, function (p) { return p[1] >= b[1]; }, function (a, c) { return lerp(a, c, (b[1] - a[1]) / (c[1] - a[1])); }); if (!r.length) return r;
  r = side(r, function (p) { return p[1] <= b[3]; }, function (a, c) { return lerp(a, c, (b[3] - a[1]) / (c[1] - a[1])); });
  return r;
}
/* Catmull-Rom through points, sampled; closed outlines wrap around, open ones end on their end points */
function rgSamp(A, n, open) {
  var out = [], N = A.length, last = open ? N - 1 : N;
  for (var i = 0; i < last; i++) { var p0 = A[open ? Math.max(0, i - 1) : (i - 1 + N) % N], p1 = A[i], p2 = A[(i + 1) % N], p3 = A[open ? Math.min(N - 1, i + 2) : (i + 2) % N];
    for (var k = 0; k < n; k++) { var t = k / n, t2 = t * t, t3 = t2 * t;
      var g = function (a, b, c, d) { return 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3); };
      out.push([g(p0[0], p1[0], p2[0], p3[0]), g(p0[1], p1[1], p2[1], p3[1])]); } }
  if (open) out.push(A[N - 1]);
  return out;
}
/* a circle as a polygon */
function rgCirc(c, r, n) { var o = []; for (var i = 0; i < n; i++) { var a = i / n * Math.PI * 2; o.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]); } return o; }
/* a fade into the page: side-by-side bands of the page's color from mm a to mm b (top: y, right: x), each one more
   opaque than the last, then the page's color beyond b, so the skull dissolves instead of being cut off by the frame.
   The bands don't overlap: every pixel is painted once, so the color can't drift (stacked translucent layers darken in
   the dark theme) */
function rgFog(V, W, H, side, a, b, n) {
  var s = "", f = function (v) { return Math.round(v * 10) / 10; };
  for (var k = 0; k <= n; k++) { var m0 = a + (b - a) * k / n, m1 = k === n ? 1e4 : a + (b - a) * (k + 1) / n, op = k === n ? 1 : Math.round(1000 * (k + 0.5) / n) / 1000;
    /* round the edges first, so a band's far edge is exactly its neighbor's near edge (no seam) */
    if (side === "top") { var y0 = f(Math.max(-2, V.OY - m1 * V.S)), y1 = f(V.OY - m0 * V.S); if (y1 > 0) s += '<rect class="rg-fog" x="-2" y="' + y0 + '" width="' + (W + 4) + '" height="' + f(y1 - y0) + '" style="fill-opacity:' + op + '"/>'; }
    else { var x0 = f(V.OX + m0 * V.S), x1 = f(Math.min(W + 2, V.OX + m1 * V.S)); if (x0 < W) s += '<rect class="rg-fog" x="' + x0 + '" y="-2" width="' + f(x1 - x0) + '" height="' + (H + 4) + '" style="fill-opacity:' + op + '"/>'; } }
  return s;
}
/* a soft card of the page's color behind a block of text (screen box b = [x0, y0, x1, y1]): rings of rounded rects
   from pad px out to the box itself, ramping to opaque, then the box itself, so the drawing fades out under the words
   (rings, not stacked rects, so each pixel is painted once) */
function rgCard(b, pad, n) {
  var s = "", f = function (v) { return Math.round(v * 10) / 10; };
  function rr(e) { var x0 = b[0] - e, y0 = b[1] - e, x1 = b[2] + e, y1 = b[3] + e, r = 4 + e; return "M" + f(x0 + r) + " " + f(y0) + "H" + f(x1 - r) + "A" + f(r) + " " + f(r) + " 0 0 1 " + f(x1) + " " + f(y0 + r) + "V" + f(y1 - r) + "A" + f(r) + " " + f(r) + " 0 0 1 " + f(x1 - r) + " " + f(y1) + "H" + f(x0 + r) + "A" + f(r) + " " + f(r) + " 0 0 1 " + f(x0) + " " + f(y1 - r) + "V" + f(y0 + r) + "A" + f(r) + " " + f(r) + " 0 0 1 " + f(x0 + r) + " " + f(y0) + "Z"; }
  for (var k = 0; k < n; k++) s += '<path class="rg-fog" style="fill-rule:evenodd;fill-opacity:' + Math.round(1000 * (k + 0.5) / n) / 1000 + '" d="' + rr(pad * (1 - k / n)) + rr(pad * (1 - (k + 1) / n)) + '"/>';
  return s + '<path class="rg-fog" d="' + rr(0) + '"/>';
}
/* the whole side view. P: the jaw pose; o.mv: {ua, up, la, lp} mm of vertical tooth movement (intrusion and
   extrusion) for the upper and lower anterior and posterior groups; o.cls: extra class on the condyle group; o.mid:
   SVG drawn over the mandible, under the upper teeth and the zygomatic arch (a mandibular splint, the temporalis);
   o.temp: draw the temporal line; o.styloid: false leaves the styloid process out (where a label's leader runs);
   o.fog: {top: [a, b], right: [a, b], W, H} */
function rgScene(P, V, D, o) {
  o = o || {}; var mv = o.mv || { ua: 0, up: 0, la: 0, lp: 0 }, s = "";
  function shift(pts, dy) { return dy ? pts.map(function (p) { return [p[0], p[1] + dy]; }) : pts; }
  function ell(e, cls, info) { return '<ellipse class="' + cls + '"' + (info ? ' data-info="' + info + '"' : "") + ' cx="' + Math.round((V.OX + e.c[0] * V.S) * 10) / 10 + '" cy="' + Math.round((V.OY - e.c[1] * V.S) * 10) / 10 + '" rx="' + Math.round(e.rx * V.S * 10) / 10 + '" ry="' + Math.round(e.ry * V.S * 10) / 10 + '"/>'; }
  var skullInfo = "The skull: the maxilla holding the upper teeth, the cheekbone (malar process) and the zygomatic arch, and the temporal bone with the glenoid fossa and the articular eminence.";
  /* the skull behind the mandible, its openings, the deep space and the styloid process */
  s += '<path class="rg-bone hot" data-info="' + skullInfo + '" d="' + rgD(rgSamp(D.BACK, 4), V, true) + '"/>';
  if (o.temp) s += '<path class="rg-line" d="' + rgD(rgSamp(D.TEMPLINE, 4, true), V) + '"/>';
  s += '<path class="rg-void" d="' + rgD(rgSamp(D.ORBIT, 4), V, true) + '"/><path class="rg-void rg-nose" d="' + rgD(rgSamp(D.NASAL, 3), V, true) + '"/>';
  s += ell(D.EAM, "rg-void hot", "The ear canal, close to the jaw's hinge (a facebow's earpieces go in the ear canals).");
  s += '<path class="rg-deep" d="' + rgD(rgSamp(D.DEEP, 3), V, true) + '"/>' + (o.styloid === false ? "" : '<path class="rg-bone" d="' + rgD(rgSamp(D.STYLOID, 2), V, true) + '"/>');
  /* lower teeth, then the mandible over their roots */
  D.LO.forEach(function (t) { s += '<path class="rg-tooth' + (t.n === "I2" ? " rg-behind" : "") + '" d="' + rgD(rgSamp(shift(t.pts, t.g === "ant" ? mv.la : mv.lp), 3).map(function (p) { return rgT(p, P); }), V, true) + '"/>'; });
  var jaw = rgSamp(D.JAW, 4).map(function (p) { return rgT([p[0] + P.Cm[0], p[1] + P.Cm[1]], P); }), mf = rgT([D.MF[0] + P.Cm[0], D.MF[1] + P.Cm[1]], P);
  s += '<g class="hot" data-info="The mandible: condyle, condylar neck, coronoid process (under the zygomatic arch), ramus, angle, body and chin. It hinges about the condyles and, when they come off their seats, slides with them."><path class="rg-jaw" d="' + rgD(jaw, V, true) + '"/>' + ell({ c: mf, rx: 0.9, ry: 0.7 }, "rg-void") + "</g>";
  if (o.mid) s += o.mid;
  /* upper teeth, then the arch, zygoma and maxilla over their roots */
  D.UP.forEach(function (t) { s += '<path class="rg-tooth' + (t.n === "I2" ? " rg-behind" : "") + '" d="' + rgD(rgSamp(shift(t.pts, t.g === "ant" ? mv.ua : mv.up), 3), V, true) + '"/>'; });
  s += '<g class="hot" data-info="' + skullInfo + ' Seated, the condyle rests up and forward against the eminence\'s posterior slope, with the disc between."><path class="rg-bone-f" d="' + rgD(rgSamp(D.FRONT, 4), V, true) + '"/><path class="rg-shade" d="' + rgD(rgSamp(D.SHADE, 4), V, true) + '"/>';
  s += D.EDGES.map(function (e) { return '<path class="rg-edge" d="' + rgD(rgSamp(e, 4, true), V) + '"/>'; }).join("") + ell({ c: D.IOF, rx: 1, ry: 0.8 }, "rg-void") + "</g>";
  /* condyle and disc */
  var c = P.C;
  s += '<g class="hot' + (o.cls ? " " + o.cls : "") + '" data-info="The condyle, with the articular disc on it. Orthopedic stability: both condyles seated superior-anterior against the eminences, the discs properly between condyle and fossa."><path class="rg-disc" d="' + rgD(D.DISC.map(function (p) { return [p[0] + c[0], p[1] + c[1]]; }), V, true) + '"/><path class="rg-condyle" d="' + rgD(rgCirc(c, D.CR, 40), V, true) + '"/></g>';
  if (o.fog) { if (o.fog.top) s += rgFog(V, o.fog.W, o.fog.H, "top", o.fog.top[0], o.fog.top[1], 28); if (o.fog.right) s += rgFog(V, o.fog.W, o.fog.H, "right", o.fog.right[0], o.fog.right[1], 28); }
  return s;
}
/* the joint magnified in a box: B = [x0, y0, x1, y1] in skull mm, W = {x, y, w, h} on screen; th turns the neck */
function rgJoint(c, B, W, D, label, th) {
  var sx = W.w / (B[2] - B[0]), V = { OX: W.x - B[0] * sx, OY: W.y + B[3] * sx, S: sx }, s = "", cs = Math.cos(th || 0), sn = Math.sin(th || 0);
  function clipD(pts) { var r = rgClip(pts, B); return r.length > 2 ? rgD(r, V, true) : ""; }
  s += '<rect class="rg-win" x="' + W.x + '" y="' + W.y + '" width="' + W.w + '" height="' + W.h + '" rx="6"/>';
  s += '<path class="rg-deep" d="' + clipD(rgSamp(D.DEEP, 3)) + '"/><path class="rg-bone" d="' + clipD(rgSamp(D.FRONT, 4)) + '"/>';
  var neck = [[3.3, -2.3], [3.9, -6.5], [4.1, -11], [3.9, -14], [-9.6, -14], [-8.6, -11.6], [-5.8, -8.6], [-4.4, -5.4], [-3.3, -2.3]].map(function (p) { return [c[0] + p[0] * cs - p[1] * sn, c[1] + p[0] * sn + p[1] * cs]; });
  s += '<path class="rg-jaw" d="' + clipD(neck) + '"/>';
  s += '<path class="rg-disc" d="' + clipD(D.DISC.map(function (p) { return [p[0] + c[0], p[1] + c[1]]; })) + '"/>';
  s += '<path class="rg-condyle" d="' + clipD(rgCirc(c, D.CR, 48)) + '"/>';
  s += '<rect class="rg-win-edge" x="' + W.x + '" y="' + W.y + '" width="' + W.w + '" height="' + W.h + '" rx="6"/>';
  if (label) s += '<text class="rg-cap" x="' + (W.x + W.w / 2) + '" y="' + (W.y + W.h + 13) + '" text-anchor="middle">' + label + "</text>";
  return { svg: s, V: V };
}
export const RIG_HELPERS = [rgT, rgD, rgClip, rgSamp, rgCirc, rgFog, rgCard, rgScene, rgJoint];
export const RIG_CSS = (p) => `
.anima .${p}-svg .rg-bone,.anima .${p}-svg .rg-bone-f{fill:var(--tm-bone)}
.anima .${p}-svg .rg-bone{stroke:var(--anatomy-mid);stroke-width:.9;stroke-linejoin:round}
.anima .${p}-svg .rg-edge{fill:none;stroke:var(--anatomy-mid);stroke-width:.9;stroke-linejoin:round;stroke-linecap:round}
.anima .${p}-svg .rg-shade{fill:var(--tm-trab);fill-opacity:.55}
.anima .${p}-svg .rg-void{fill:var(--tm-air);fill-opacity:.42;stroke:var(--anatomy-mid);stroke-width:.7}
.anima .${p}-svg .rg-void.rg-nose{fill-opacity:.24}
.anima .${p}-svg .rg-deep{fill:var(--tm-air);fill-opacity:.2}
.anima .${p}-svg .rg-line{fill:none;stroke:var(--anatomy-lo);stroke-width:.8;stroke-linecap:round}
.anima .${p}-svg .rg-jaw{fill:var(--tm-bone);stroke:var(--anatomy-hi);stroke-width:1.1;stroke-linejoin:round}
.anima .${p}-svg .rg-tooth{fill:var(--anatomy-face);stroke:var(--anatomy-hi);stroke-width:.9;stroke-linejoin:round}
.anima .${p}-svg .rg-tooth.rg-behind{fill-opacity:.45;stroke-opacity:.45}
.anima .${p}-svg .rg-disc{fill:var(--tm-disc);stroke:var(--anatomy-mid);stroke-width:.8;stroke-linejoin:round}
.anima .${p}-svg .rg-condyle{fill:var(--tm-bone-in);stroke:var(--anatomy-hi);stroke-width:1.1}
.anima .${p}-svg .rg-fog{fill:var(--surface);stroke:none;pointer-events:none;shape-rendering:crispEdges}
.anima .${p}-svg .rg-win{fill:var(--anatomy-shade-2)}
.anima .${p}-svg .rg-win-edge{fill:none;stroke:var(--anatomy-lo);stroke-width:1}
.anima .${p}-svg .rg-cap{fill:var(--anatomy-muted);font:10.5px var(--anatomy-mono)}
`;
