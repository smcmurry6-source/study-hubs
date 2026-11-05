// The seven basic implant types (L1 Evolution, Dr. Mueninghoff: "out of this entire lecture, that's something that you
// really need to know"). Static drawings for the hub's FIGS (the notes, Review and the "Which type of implant is drawn
// here?" questions), written into the hub by build.mjs.
//
// Each figure is two SVGs side by side: the main view, drawn the way the type turns up (a panoramic or periapical
// radiograph, or for the intramucosal insert the tissue side of the denture), and a section through the jaw showing
// where it sits. Above a question's stem the section is hidden (CSS: .qcard-figure:not(.qcard-figure-after) .ty-sec),
// so it can't give the answer away; the numbered markers are explained by the key, folded under the notes copy and
// open only after answering. No SVG ids, so copies can repeat in hidden panels.
//
// Drawn from the hub's L1 notes, checked against:
// - Linkow, Theories and Techniques of Oral Implantology (1970) and Mandibular Implants (1977), linkowlibrary.org:
//   subperiosteal frames (primary struts cross the crest and carry the posts, secondary struts tie buccal to lingual,
//   peripheral struts outline it; four posts spread around the arch; the posterior posts rise from the mylohyoid strut);
//   blade-vents (thin, wedge-shaped, broad mesiodistally, shoulder 1-2 mm below the crest, a narrow neck through the
//   tissue thickening into the post); Dahl's mushroom-shaped intramucosal inserts (1940s).
// - Bosker, US patent 4,516,937 (the transmandibular implant): a base plate under the anterior mandible, four
//   transosseous posts through the full height, cortical screws beside each post into the lower border, and a
//   superstructure bar joining the posts.
// - US patents 4,382,791 and 4,500,292: intramucosal inserts with a base, neck and mushroom head, in offset rows on the
//   tissue side of the denture along the ridge crest and palatal slope.
// - ICOI glossary: the ramus frame engages both rami and the symphysis, joined by a bar along the tissue (a U from above).
// - Endodontic stabilizer reviews (e.g. PMC4316349): a smooth or tapered rod cemented in the canal and carried past the
//   apex into bone, to steady a periodontally weakened tooth.
// The sources make the drawings accurate; what they show and name stays with what L1 teaches (rule:
// vault/rules/figures-teach-the-lecture.md), so the keys leave out strut types, screws and depths the lecture never mentions.
// Proportions are schematic; the periapical views are drawn at about 6 px per mm.

const C = {
  bg: "#0f171d", film: "#0a1014", filmEdge: "#26333a", soft: "#172127",
  bone: "#56656d", boneDot: "#47555c", cort: "#a6b3ba", cortIn: "#83929a", canalWall: "#8f9da5", canal: "#2f3d45",
  metal: "#f3f7f9", metalEdge: "#c3ced4", crown: "#e7edf0",
  enamel: "#e2e9ec", dentin: "#a4b0b7", dentinCr: "#b7c2c8", pulp: "#2a3840", pdl: "#141d22", lamina: "#c6d1d6", fib: "#162026",
  muc: "#7c5662", mucEdge: "#a87a87", peri: "#d8a8b4", acr: "#c08692", acrDark: "#9a6371", acrEdge: "#dcaab4",
  ink: "#d6dfe4", mut: "#93a2ab", mark: "#f0b44c", markInk: "#1d1406",
};
const FONT = "system-ui, -apple-system, 'Segoe UI', sans-serif";
const f = (n) => +(+n).toFixed(1);
const P = (pts, close) => pts.map((p, i) => (i ? "L" : "M") + f(p[0]) + " " + f(p[1])).join("") + (close ? "Z" : "");
const txt = (x, y, s, o = {}) => `<text x="${f(x)}" y="${f(y)}" font-size="${o.size || 10}" fill="${o.fill || C.ink}" text-anchor="${o.anchor || "start"}"${o.weight ? ` font-weight="${o.weight}"` : ""} font-family="${FONT}">${s}</text>`;
const range = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => a + (b - a) * i / n);
function rng(seed) { return function () { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* a numbered marker at (x, y) with a leader to the part at (tx, ty); explained by the figure's key */
function mark(n, x, y, tx, ty) {
  const dx = tx - x, dy = ty - y, d = Math.hypot(dx, dy) || 1, sx = x + dx / d * 7.5, sy = y + dy / d * 7.5;
  return `<path d="M${f(sx)} ${f(sy)}L${f(tx)} ${f(ty)}" stroke="${C.mark}" stroke-width="1.3" fill="none"/><circle cx="${f(tx)}" cy="${f(ty)}" r="2" fill="${C.mark}"/>` +
    `<circle cx="${f(x)}" cy="${f(y)}" r="7.5" fill="${C.mark}"/><text x="${f(x)}" y="${f(y + 3.7)}" font-size="10.5" font-weight="700" fill="${C.markInk}" text-anchor="middle" font-family="${FONT}">${n}</text>`;
}
const mainSvg = (view, body) => `<svg class="ty-main" viewBox="0 0 330 270" role="img" aria-label="${view}" xmlns="http://www.w3.org/2000/svg"><rect width="330" height="270" rx="10" fill="${C.bg}"/>${body}${txt(14, 20, view, { size: 10, fill: C.mut })}</svg>`;
/* the section panel: title, drawing, which side is which, and two lines saying where it sits */
/* (the section is drawn about x = 75 and shifted 10 right, so its labels have room on both sides) */
const secSvg = (body, where, sides = ["buccal", "lingual"]) => `<svg class="ty-sec" viewBox="0 0 170 270" role="img" aria-label="In section: ${where.join(" ")}" xmlns="http://www.w3.org/2000/svg"><rect width="170" height="270" rx="10" fill="${C.bg}"/>${txt(85, 20, "in section", { size: 10, fill: C.mut, anchor: "middle" })}<g transform="translate(10 0)">${body}</g>` +
  txt(10, 228, sides[0], { size: 9, fill: C.mut }) + txt(160, 228, sides[1], { size: 9, fill: C.mut, anchor: "end" }) +
  txt(85, 246, where[0], { size: 9.5, anchor: "middle", weight: 600 }) + txt(85, 259, where[1], { size: 9.5, anchor: "middle", weight: 600 }) + `</svg>`;
/* a section label with a leader to (tx, ty); "a|b" sets it on two lines */
const label = (x, y, s, tx, ty, anchor = "start") => `<path d="M${f(anchor === "start" ? x - 3 : x + 3)} ${f(y - 3.5)}L${f(tx)} ${f(ty)}" stroke="${C.mut}" stroke-width="0.8" fill="none"/>` +
  s.split("|").map((line, i) => txt(x, y + i * 10, line, { size: 9, fill: C.mut, anchor })).join("");

/* ------------------------------------------------------------------ the panoramic mandible (A, C, F) */
const crestY = (x) => 182 - 20 * ((x - 165) / 57) ** 2;      // the resorbed edentulous ridge, x 108-222
const infY = (x) => 238 - 26 * ((x - 165) / 113) ** 2;       // the lower border, x 52-278
function pano(seed) {
  const crest = range(108, 222, 38).map((x) => [x, crestY(x)]);
  const inf = range(278, 52, 56).map((x) => [x, infY(x)]);
  const d = P(crest) + "Q228 110 242 52Q256 92 270 64C272 50 290 46 292 60Q286 120 298 186Q302 206 278 212" +
    inf.map((p) => "L" + f(p[0]) + " " + f(p[1])).join("") + "Q28 206 32 186Q44 120 38 60C40 46 58 50 60 64Q74 92 88 52Q102 110 108 162Z";
  const r = rng(seed); let dots = "";
  for (let i = 0; i < 90; i++) { const x = 112 + r() * 106, y0 = crestY(x) + 7, y1 = infY(x) - 9, y = y0 + r() * (y1 - y0); dots += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(1.4 + r() * 2.2)}" ry="${f(1.1 + r() * 1.6)}" fill="${C.boneDot}"/>`; }
  for (let i = 0; i < 24; i++) { const s = i % 2 ? 1 : -1, x = 165 + s * (60 + r() * 40), y = 150 + r() * 50; if (y < infY(x) - 8 && y > crestY(Math.min(222, Math.max(108, x))) + 8) dots += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(1.4 + r() * 2)}" ry="${f(1.1 + r() * 1.4)}" fill="${C.boneDot}"/>`; }
  const canal = (dd) => `<path d="${dd}" stroke="${C.canalWall}" stroke-width="6.5" fill="none"/><path d="${dd}" stroke="${C.canal}" stroke-width="3.6" fill="none"/>`;
  return `<path d="${d}" fill="${C.bone}"/>` + dots +
    `<path d="${P(range(70, 260, 40).map((x) => [x, infY(x) - 6]))}" stroke="${C.cortIn}" stroke-width="1.4" fill="none" opacity=".8"/>` +
    canal("M70 120Q80 190 124 202") + canal("M260 120Q250 190 206 202") +
    `<ellipse cx="127" cy="201" rx="5" ry="4" fill="${C.canal}" stroke="${C.canalWall}" stroke-width="1.3"/><ellipse cx="203" cy="201" rx="5" ry="4" fill="${C.canal}" stroke="${C.canalWall}" stroke-width="1.3"/>` +
    `<ellipse cx="70" cy="119" rx="4" ry="5" fill="${C.canal}"/><ellipse cx="260" cy="119" rx="4" ry="5" fill="${C.canal}"/>` +
    `<path d="${d}" stroke="${C.cort}" stroke-width="3" fill="none" stroke-linejoin="round"/>`;
}

/* ------------------------------------------------------------------ the section through the jaw (insets) */
/* the bone in buccolingual section: a closed contour (buccal side up from the bottom, over the crest, down the lingual
   side) with outward normals, so the soft tissue can be laid on it as offset bands */
function section(T, B, w = 1, lean = 0) {
  const hw = (s) => s < 0.22 ? 7 + 19 * Math.sqrt(s / 0.22) : s < 0.8 ? 26 + 5 * (s - 0.22) / 0.58 : 31 * Math.sqrt(Math.max(0, 1 - ((s - 0.8) / 0.2) ** 2)) + 0.01;
  const ys = range(B, T, 60), L = ys.map((y) => { const s = (y - T) / (B - T); return [75 - hw(s) * w + lean * s, y]; });
  const R = ys.slice().reverse().map((y) => { const s = (y - T) / (B - T); return [75 + hw(s) * w + lean * s, y]; });
  const pts = L.concat([[75 + lean * 0, T - 1.5]], R), cx = 75, cy = (T + B) / 2;
  const nrm = pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]; let nx = b[1] - a[1], ny = -(b[0] - a[0]); const d = Math.hypot(nx, ny) || 1; nx /= d; ny /= d; if (nx * (p[0] - cx) + ny * (p[1] - cy) < 0) { nx = -nx; ny = -ny; } return [nx, ny]; });
  const off = (d, keep) => pts.map((p, i) => [p[0] + nrm[i][0] * d, p[1] + nrm[i][1] * d]).filter((p, i) => keep(pts[i]));
  return { pts, off, T, B };
}
function boneSec(S, seed) {
  const r = rng(seed); let dots = "";
  for (let i = 0; i < 26; i++) { const y = S.T + 14 + r() * (S.B - S.T - 26), x = 58 + r() * 34; dots += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(1.2 + r() * 1.8)}" ry="${f(1 + r() * 1.3)}" fill="${C.boneDot}"/>`; }
  return `<path d="${P(S.pts, true)}" fill="${C.bone}"/>` + dots + `<path d="${P(S.pts, true)}" fill="none" stroke="${C.cort}" stroke-width="3.2" stroke-linejoin="round"/>`;
}
/* periosteum and mucosa over the top of the section, down to y = yEnd on both sides */
function softSec(S, yEnd, mucT = 9) {
  const keep = (p) => p[1] <= yEnd;
  const inner = S.off(3.2, keep), outer = S.off(3.2 + mucT, keep), per = S.off(1.6, keep);
  return `<path d="${P(outer.concat(inner.slice().reverse()), true)}" fill="${C.muc}"/><path d="${P(outer)}" fill="none" stroke="${C.mucEdge}" stroke-width="1"/>` +
    `<path d="${P(per)}" fill="none" stroke="${C.peri}" stroke-width="2.2"/>`;
}

/* ------------------------------------------------------------------ teeth (periapical views) */
function tooth(o) {
  const H = o.ch, cej = o.cej, cx = o.cx;
  const hwC = (h) => {
    const k = Math.min(1, h / (0.62 * H)), base = o.vw / 2 + (o.cw / 2 - o.vw / 2) * Math.sin(k * Math.PI / 2);
    if (h <= 0.62 * H) return base;
    const u = (h - 0.62 * H) / (0.38 * H);
    if (o.kind === "inc") return o.cw / 2 * (1 - 0.14 * u * u);
    if (o.kind === "can") return o.cw / 2 * Math.sqrt(Math.max(0, 1 - u ** 1.35));
    return o.cw / 2 * Math.sqrt(Math.max(0, 1 - u * u));
  };
  const hwR = (t) => o.vw / 2 * (1 - 0.7 * t) * Math.sqrt(Math.max(0, 1 - t ** 8));
  const hs = range(0, H, 30), ts = range(0, 1, 40);
  const crownL = hs.map((h) => [cx - hwC(h), cej - h]), crownR = hs.slice().reverse().map((h) => [cx + hwC(h), cej - h]);
  const rootL = ts.slice().reverse().map((t) => [cx - hwR(t), cej + t * o.rl]), rootR = ts.map((t) => [cx + hwR(t), cej + t * o.rl]);
  const outline = rootL.concat(crownL, crownR, rootR);
  const e = (h) => 1 + 5 * Math.min(1, h / (0.35 * H)), hd = range(0, H - 7, 24);
  const dent = hd.map((h) => [cx - Math.max(0.5, hwC(h) - e(h)), cej - h]).concat(hd.slice().reverse().map((h) => [cx + Math.max(0.5, hwC(h) - e(h)), cej - h]));
  const ph = range(0, 0.5 * H, 12), hwP = (h) => o.vw * 0.17 * Math.sqrt(Math.max(0, 1 - (h / (0.5 * H)) ** 2)) + 0.6;
  const tc = range(0, 0.97, 30), hwK = (t) => Math.max(0.7, hwR(t) * 0.2);
  const pulp = tc.slice().reverse().map((t) => [cx - hwK(t), cej + t * o.rl]).concat(ph.map((h) => [cx - hwP(h), cej - h]), ph.slice().reverse().map((h) => [cx + hwP(h), cej - h]), tc.map((t) => [cx + hwK(t), cej + t * o.rl]));
  const tCrest = Math.max(0, (o.crest - cej) / o.rl), tb = range(tCrest, 1, 30);
  const halo = P(tb.map((t) => [cx - hwR(t), cej + t * o.rl]).concat(tb.slice().reverse().map((t) => [cx + hwR(t), cej + t * o.rl])));
  return {
    halo: `<path d="${halo}" fill="none" stroke="${C.lamina}" stroke-width="6.5"/><path d="${halo}" fill="none" stroke="${C.pdl}" stroke-width="3.6"/>`,
    body: `<path d="${P(outline, true)}" fill="${C.dentin}"/><path d="${P(crownL.concat(crownR), true)}" fill="${o.restored ? C.crown : C.enamel}"/>` +
      (o.restored ? "" : `<path d="${P(dent, true)}" fill="${C.dentinCr}"/>`) + (o.noPulp ? "" : `<path d="${P(pulp, true)}" fill="${C.pulp}"/>`),
    apex: cej + o.rl, hwR, hwC,
  };
}
/* a two-rooted lower molar */
function molar(o) {
  const H = o.ch, cej = o.cej, cx = o.cx, hw = o.cw / 2, vw = o.vw / 2, furc = cej + 17;
  const side = (s) => { // s = -1 left, +1 right; the crown's side from the CEJ up to the occlusal corner
    return range(0, 1, 16).map((k) => [cx + s * (vw + (hw - vw) * Math.sin(Math.min(1, k / 0.6) * Math.PI / 2) - (k > 0.85 ? (k - 0.85) * 18 : 0)), cej - k * (H - 6)]);
  };
  const occl = [[cx - hw * 0.62, cej - H + 1], [cx - hw * 0.3, cej - H + 7], [cx + hw * 0.05, cej - H + 2], [cx + hw * 0.38, cej - H + 7], [cx + hw * 0.66, cej - H + 1]];
  const crown = side(-1).concat(occl, side(1).reverse());
  const root = (s) => { // one root: outer edge from the CEJ out to the apex, inner edge back to the furcation
    const ax = cx + s * vw * 0.55 + (o.curve || 0), ap = cej + o.rl, outer = range(0, 1, 20).map((t) => [cx + s * (vw - t * t * (vw - Math.abs(ax - cx) - 3)) + (o.curve || 0) * t * t, cej + t * o.rl]);
    const inner = range(1, 0, 20).map((t) => [ax - s * 3 * (1 - t * 0.6) + (o.curve || 0) * 0 - s * (1 - t) * (vw * 0.42), furc + t * (ap - furc)]);
    return { outer, inner, ap };
  };
  const Lr = root(-1), Rr = root(1);
  const trunk = [[cx - vw, cej], [cx + vw, cej], [cx + vw * 0.95, furc], [cx - vw * 0.95, furc]];
  const rootPoly = (rt) => P(rt.outer.concat(rt.inner, [[cx, furc - 2]]), true);
  const below = (pts) => pts.filter((p) => p[1] >= o.crest);
  const halo = P(below(Lr.outer).concat(Lr.inner, Rr.inner.slice().reverse(), below(Rr.outer).reverse()));
  const pulpCh = [[cx - vw * 0.55, cej + 4], [cx - vw * 0.6, cej - H * 0.32], [cx - vw * 0.2, cej - H * 0.4], [cx + vw * 0.2, cej - H * 0.4], [cx + vw * 0.6, cej - H * 0.32], [cx + vw * 0.55, cej + 4]];
  const canal = (rt) => P(rt.outer.map((p, i) => { const q = rt.inner[rt.inner.length - 1 - i] || p; return [(p[0] + q[0]) / 2, p[1] * 0.5 + (q[1]) * 0.5]; }).filter((p) => p[1] > cej + 2 && p[1] < rt.ap - 4));
  return {
    halo: `<path d="${halo}" fill="none" stroke="${C.lamina}" stroke-width="6.5"/><path d="${halo}" fill="none" stroke="${C.pdl}" stroke-width="3.6"/>`,
    body: `<path d="${rootPoly(Lr)}" fill="${C.dentin}"/><path d="${rootPoly(Rr)}" fill="${C.dentin}"/><path d="${P(trunk, true)}" fill="${C.dentin}"/>` +
      `<path d="${P(crown, true)}" fill="${C.enamel}"/><path d="${P(crown.map((p) => [cx + (p[0] - cx) * 0.82, cej - (cej - p[1]) * 0.86]), true)}" fill="${C.dentinCr}"/>` +
      `<path d="${P(pulpCh, true)}" fill="${C.pulp}"/><path d="${canal(Lr)}" stroke="${C.pulp}" stroke-width="2" fill="none"/><path d="${canal(Rr)}" stroke="${C.pulp}" stroke-width="2" fill="none"/>`,
  };
}
/* a periapical film: dark air, a soft-tissue band above the bone, bone below the crest line */
function film(crest, seed, x0 = 22, x1 = 308) {
  const r = rng(seed); let dots = "";
  for (let i = 0; i < 120; i++) { const x = x0 + 6 + r() * (x1 - x0 - 12), y = crest(x) + 6 + r() * (262 - crest(x) - 12); dots += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(1.4 + r() * 2.4)}" ry="${f(1.1 + r() * 1.6)}" fill="${C.boneDot}"/>`; }
  const top = range(x0, x1, 60).map((x) => [x, crest(x)]);
  return `<rect x="${x0}" y="30" width="${x1 - x0}" height="234" rx="12" fill="${C.film}" stroke="${C.filmEdge}" stroke-width="1.5"/>` +
    `<path d="${P(range(x0 + 1, x1 - 1, 60).map((x) => [x, crest(x) - 16]).concat([[x1 - 1, crest(x1 - 1)], [x0 + 1, crest(x0 + 1)]]), true)}" fill="${C.soft}"/>` +
    `<path d="${P(top.concat([[x1, 262], [x0, 262]]), true)}" fill="${C.bone}"/>` + dots +
    `<path d="${P(top)}" fill="none" stroke="${C.cortIn}" stroke-width="1.6"/>`;
}

/* ================================================================== A. Subperiosteal */
function sub() {
  /* the lattice lies ON the ridge: its top rail rides the crest (T) and the lower rail (B) is the frame draped down over
     the bone, so it can't be read as something set into the bone (ev-pic-sub, 2026-11-05: half picked "Blade") */
  const T = -1, B = 12, M = (T + B) / 2;
  const posts = [120, 146, 184, 210], strut = (dy, a, b) => P(range(a, b, 30).map((x) => [x, crestY(x) + dy]));
  let fr = `<path d="${strut(T, 113, 217)}" stroke="${C.metal}" stroke-width="2.6" fill="none"/><path d="${strut(B, 116, 214)}" stroke="${C.metal}" stroke-width="2.6" fill="none"/>`;
  fr += `<path d="M113 ${f(crestY(113) + T)}Q108 ${f(crestY(113) + M)} 116 ${f(crestY(116) + B)}" stroke="${C.metal}" stroke-width="2.6" fill="none"/><path d="M217 ${f(crestY(217) + T)}Q222 ${f(crestY(217) + M)} 214 ${f(crestY(214) + B)}" stroke="${C.metal}" stroke-width="2.6" fill="none"/>`;
  [132, 158, 172, 197].forEach((x) => { fr += `<path d="M${x} ${f(crestY(x) + T)}L${x + 3} ${f(crestY(x) + B)}" stroke="${C.metal}" stroke-width="2" fill="none"/>`; });
  posts.forEach((x) => { const c = crestY(x); fr += `<path d="M${x} ${f(c + B)}L${x} ${f(c - 1)}" stroke="${C.metal}" stroke-width="3" fill="none"/><rect x="${x - 3.2}" y="${f(c - 19)}" width="6.4" height="19" rx="1.5" fill="${C.metal}"/><circle cx="${x}" cy="${f(c - 21)}" r="4.8" fill="${C.metal}"/>`; });
  const body = pano(7) + fr + mark(1, 165, 120, 147, crestY(146) - 24) + mark(2, 165, 258, 165, crestY(165) + B + 0.5);
  const S = section(104, 212);
  let sec = boneSec(S, 11) + softSec(S, 150);
  const onB = S.off(3, (p) => p[1] <= 168);
  sec += `<path d="${P(onB)}" stroke="${C.metal}" stroke-width="2.8" fill="none"/>` + `<rect x="72" y="62" width="6" height="41" rx="1.5" fill="${C.metal}"/><circle cx="75" cy="60" r="6" fill="${C.metal}"/>`;
  sec += label(108, 72, "post", 79, 70) + label(108, 98, "mucosa", 92, 108) + label(108, 128, "periosteum", 99, 134) + label(108, 186, "bone", 98, 190) + label(42, 182, "frame", 47, 166, "end");
  return {
    title: "Implant drawing A",
    caption: "Subperiosteal (eposteal): a metal lattice draped over the ridge, on the bone under the periosteum, with posts through the mucosa. Two surgeries: one to take an impression of the bone, one to set the lattice. L1 Evolution; schematic.",
    key: [["1", "Posts come up through the mucosa to hold the denture."], ["2", "A metal lattice draped over the ridge. It lies on the bone, under the periosteum: none of it is inside the bone. When one failed, it destroyed a lot of bone."]],
    svg: `<div class="ty-fig">${mainSvg("panoramic radiograph", body)}${secSvg(sec, ["on the bone, under", "the periosteum"])}</div>`,
  };
}

/* ================================================================== B. Endodontic stabilizer */
function endo() {
  const crest = (x) => 131 + Math.sin(x / 9) * 1.5;
  const T = [
    tooth({ cx: 96, cej: 92, cw: 32, vw: 22, ch: 54, rl: 75, kind: "inc", crest: 131 }),
    tooth({ cx: 129, cej: 92, cw: 34, vw: 24, ch: 57, rl: 84, kind: "inc", crest: 131 }),
    tooth({ cx: 167, cej: 94, cw: 42, vw: 32, ch: 66, rl: 96, kind: "can", crest: 131, noPulp: true }),
    tooth({ cx: 208, cej: 96, cw: 40, vw: 28, ch: 51, rl: 84, kind: "pm", crest: 131 }),
    tooth({ cx: 249, cej: 96, cw: 42, vw: 28, ch: 48, rl: 87, kind: "pm", crest: 131 }),
  ];
  const can = T[2], tip = can.apex + 50, pin = [];
  range(52, tip - 3, 30).forEach((y) => pin.push([167 - (2.3 - 0.7 * (y - 52) / (tip - 52)), y]));
  const pinR = pin.slice().reverse().map((p) => [334 - p[0], p[1]]);
  let body = film(crest, 21, 60, 288) + T.map((t) => t.halo).join("") + T.map((t) => t.body).join("");
  body += `<path d="${P(pin.concat([[167, tip + 1]], pinR), true)}" fill="${C.metal}"/><ellipse cx="167" cy="54" rx="6" ry="4.5" fill="${C.crown}"/>`;
  body += mark(1, 214, 232, 168.5, can.apex + 32) + mark(2, 124, 186, 166, 150) + mark(3, 274, 112, 262, 131) + mark(4, 118, 226, 165.5, can.apex - 1);
  const S = section(104, 212, 1.05);
  const tx = 75, cej = 96, rl = 66, hwR = (t) => 13 * (1 - 0.66 * t) * Math.sqrt(Math.max(0, 1 - t ** 8));
  const ts = range(0, 1, 30), tb = ts.filter((t) => cej + t * rl >= 130);
  const root = ts.slice().reverse().map((t) => [tx - hwR(t), cej + t * rl]).concat(ts.map((t) => [tx + hwR(t), cej + t * rl]));
  const crownS = [[tx - 13, cej], [tx - 16, cej - 20], [tx - 9, cej - 44], [tx - 2, cej - 54], [tx + 4, cej - 50], [tx + 12, cej - 28], [tx + 13, cej]];
  const halo = P(tb.map((t) => [tx - hwR(t), cej + t * rl]).concat(tb.slice().reverse().map((t) => [tx + hwR(t), cej + t * rl])));
  const sec = boneSec(section(130, 212, 1.05), 5) +
    softSec(section(130, 212, 1.05), 160, 8) +
    `<path d="${halo}" fill="none" stroke="${C.lamina}" stroke-width="5.5"/><path d="${halo}" fill="none" stroke="${C.pdl}" stroke-width="3"/>` +
    `<path d="${P(root, true)}" fill="${C.dentin}"/><path d="${P(crownS, true)}" fill="${C.enamel}"/>` +
    `<path d="M${tx - 1.8} 58L${tx - 1.3} 200Q${tx} 204 ${tx + 1.3} 200L${tx + 1.8} 58Z" fill="${C.metal}"/>` +
    label(108, 70, "crown", 86, 68) + label(108, 140, "root canal", 78, 140) + label(108, 166, "apex", 78, 162) + label(108, 196, "rod in|the bone", 78, 192) + label(42, 120, "bone|level", 51, 131, "end");
  return {
    title: "Implant drawing B",
    caption: "Endodontic stabilizer: a metal rod cemented in a treated root canal and carried out past the apex into the bone, to steady a weak tooth. L1 Evolution; schematic.",
    key: [["1", "A long metal rod runs out past the apex into the bone (the ones Dr. Mueninghoff saw were stainless steel, not titanium)."], ["2", "It goes through the tooth's treated root canal."], ["3", "Bone lost around the teeth: the stabilizer was meant to steady a weak tooth."], ["4", "Where the rod leaves the root the seal was poor, so the root canal failed."]],
    svg: `<div class="ty-fig">${mainSvg("periapical radiograph", body)}${secSvg(sec, ["through the root canal,", "out into the bone"], ["labial", "lingual"])}</div>`,
  };
}

/* ================================================================== C. Transosseous (transmandibular implant) */
function trans() {
  const plate = range(124, 206, 30).map((x) => [x, infY(x) + 3.5]), posts = [136, 155, 175, 194];
  let fr = `<path d="${P(plate)}" stroke="${C.metal}" stroke-width="6" stroke-linecap="round" fill="none"/>`;
  posts.forEach((x) => { const top = crestY(x) - 20; fr += `<rect x="${x - 2.8}" y="${f(top)}" width="5.6" height="${f(infY(x) + 3 - top)}" rx="1.2" fill="${C.metal}"/>`; });
  fr += `<path d="${P(range(132, 198, 24).map((x) => [x, crestY(x) - 21]))}" stroke="${C.metal}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
  const body = pano(13) + fr + mark(1, 112, 256, 140, infY(140) + 4) + mark(2, 125, 128, 155, crestY(155) - 8) + mark(3, 205, 128, 186, crestY(186) - 21) + mark(4, 85, 230, 124, 202);
  const S = section(84, 206, 0.86);
  let sec = boneSec(S, 17) + softSec(S, 130);
  sec += `<rect x="47" y="208" width="56" height="7" rx="3" fill="${C.metal}"/><rect x="72" y="58" width="6" height="152" rx="1.2" fill="${C.metal}"/>`;
  sec += `<rect x="66" y="50" width="18" height="10" rx="2" fill="${C.metal}"/>`;
  sec += label(108, 52, "bar", 85, 55) + label(108, 92, "mucosa", 93, 94) + label(108, 150, "bone", 96, 150) + label(108, 214, "plate", 103, 212) + label(42, 168, "post", 71, 168, "end");
  return {
    title: "Implant drawing C",
    caption: "Transosseous (transosteal; Bosker's transmandibular implant, in a soft high-gold alloy): a plate under the chin with posts through the full height of the anterior mandible into the mouth, joined by a bar. L1 Evolution; schematic.",
    key: [["1", "A plate under the chin, placed in the operating room through the chin."], ["2", "Posts run through the full height of the bone and come out into the mouth."], ["3", "A bar joins the posts, delivered within a day; the denture clips on with Hader clips."], ["4", "Mental foramen: it stays in the anterior mandible, because the inferior alveolar nerve rules out the back."]],
    svg: `<div class="ty-fig">${mainSvg("panoramic radiograph", body)}${secSvg(sec, ["through the full height", "of the bone"], ["labial", "lingual"])}</div>`,
  };
}

/* ================================================================== D. Intramucosal insert */
function mucosal() {
  const cx = 165, y0 = 66, a = 112, b = 128, th = range(-106, 106, 64).map((d) => d * Math.PI / 180);
  const at = (t, off) => { const x = cx + a * Math.sin(t), y = y0 + b * (1 - Math.cos(t)), dx = a * Math.cos(t), dy = b * Math.sin(t), d = Math.hypot(dx, dy); return [x + off * dy / d, y - off * dx / d]; };
  const band = (o1, o2) => P(th.map((t) => at(t, o1)).concat(th.slice().reverse().map((t) => at(t, o2))), true);
  let body = `<path d="${band(-30, 30)}" fill="${C.acr}" stroke="${C.acrEdge}" stroke-width="2" stroke-linejoin="round"/>` +
    `<path d="${band(22, 30)}" fill="${C.acrEdge}" opacity=".55"/><path d="${band(-11, 9)}" fill="${C.acrDark}"/>`;
  const btn = (t, o) => { const p = at(t, o); return `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="5.6" fill="#7b8790"/><circle cx="${f(p[0])}" cy="${f(p[1])}" r="4.6" fill="${C.metal}"/><circle cx="${f(p[0] - 1.4)}" cy="${f(p[1] - 1.5)}" r="1.5" fill="#ffffff" opacity=".9"/>`; };
  [-92, -74, -56, -38, 38, 56, 74, 92].forEach((d) => { body += btn(d * Math.PI / 180, 1); });
  [-83, -65, -47, 47, 65, 83].forEach((d) => { body += btn(d * Math.PI / 180, -19); });
  const b1 = at(-56 * Math.PI / 180, 1), b2 = at(65 * Math.PI / 180, -19), g = at(-20 * Math.PI / 180, 1), pl = at(0, -30);
  body += txt(165, 142, "palate left open", { size: 9.5, fill: C.mut, anchor: "middle" });
  body += mark(1, 28, 86, b1[0] - 3, b1[1] - 2) + mark(2, 165, 116, pl[0], pl[1] + 2); void b2; void g;
  body += txt(165, 258, "front of the mouth at the top", { size: 9, fill: C.mut, anchor: "middle" });
  /* the section: maxillary ridge, bone above, mucosa, then the denture base, with a button in a hole in the mucosa */
  const S = section(100, 210, 0.8), Y = 272, flip = (p) => [p[0], Y - p[1]];
  const bone = S.pts.map(flip), keep = (p) => p[1] <= 128, per = S.off(1.6, keep).map(flip), mi = S.off(3.2, keep).map(flip), mo = S.off(13.2, keep).map(flip), dO = S.off(23, keep).map(flip);
  let sec = `<path d="${P(bone, true)}" fill="${C.bone}"/><path d="${P(bone, true)}" fill="none" stroke="${C.cort}" stroke-width="3.2"/>` +
    `<path d="${P(dO.concat(mo.slice().reverse()), true)}" fill="${C.acr}" stroke="${C.acrEdge}" stroke-width="1"/>` +
    `<path d="${P(mo.concat(mi.slice().reverse()), true)}" fill="${C.muc}"/><path d="${P(per)}" fill="none" stroke="${C.peri}" stroke-width="2.2"/>`;
  const cr = Y - 100 + 1.5, hy = cr + 8.5;   // the crest of the ridge, and the insert's head in the mucosa, clear of the bone
  sec += `<ellipse cx="75" cy="${hy}" rx="7.6" ry="4.6" fill="${C.pulp}"/><rect x="73" y="${hy}" width="4" height="${f(cr + 13.2 - hy + 1)}" fill="${C.metal}"/><ellipse cx="75" cy="${hy}" rx="6" ry="3.4" fill="${C.metal}"/>`;
  sec += label(118, 104, "bone", 90, 112) + label(118, 158, "mucosa", 97, 166) + label(118, 180, "insert", 81.5, hy) + label(118, 204, "denture", 88, 194);
  return {
    title: "Implant drawing D",
    caption: "Intramucosal insert: little buttons on the tissue side of a denture, usually a palateless upper, that snap into holes drilled in the mucosa. Nothing goes into the bone. L1 Evolution; schematic.",
    key: [["1", "Buttons on the tissue side of the denture snap into holes drilled in the mucosa; the denture stays in for two weeks while the tissue heals around them."], ["2", "No palate: a palateless upper denture, so it caused less gagging. Out more than a few hours, the holes start to close."]],
    svg: `<div class="ty-fig">${mainSvg("upper denture, tissue side", body)}${secSvg(sec, ["in holes in the mucosa,", "never into the bone"], ["buccal", "palatal"])}</div>`,
  };
}

/* ================================================================== E. Blade (plate form) */
function blade() {
  const crest = (x) => 116 + 8 / (1 + Math.exp(-(x - 106) / 6));
  const pm = tooth({ cx: 70, cej: 104, cw: 40, vw: 28, ch: 50, rl: 84, kind: "pm", crest: 116, restored: true });
  let body = film(crest, 31) +
    `<path d="M24 222Q170 214 306 226" stroke="${C.canalWall}" stroke-width="7" fill="none"/><path d="M24 222Q170 214 306 226" stroke="${C.canal}" stroke-width="4" fill="none"/>` + pm.halo + pm.body;
  const bl = [[128, 132], [240, 132], [245, 140], [237, 174], [226, 180], [142, 180], [131, 174], [123, 140]];
  body += `<path d="${P(bl, true)}" fill="none" stroke="${C.fib}" stroke-width="8" stroke-linejoin="round"/><path d="M180 133L180 122L188 122L188 133" fill="none" stroke="${C.fib}" stroke-width="6"/>`;
  body += `<path d="${P(bl, true)}" fill="${C.metal}"/>`;
  [146, 167, 205, 226].forEach((x) => { body += `<rect x="${x - 6}" y="142" width="12" height="26" rx="6" fill="${C.bone}" stroke="${C.fib}" stroke-width="1.5"/>`; });
  body += `<rect x="179.5" y="100" width="9" height="34" fill="${C.metal}"/><path d="M174 102L176 76L192 76L194 102Z" fill="${C.metal}"/>`;
  const unit = (x0, x1, top, bot, pont) => { const w = x1 - x0, m = (x0 + x1) / 2; return [[x0 + 4, bot], [x0, bot - 12], [x0 - 1, top + 12], [x0 + w * 0.12, top + 2], [x0 + w * 0.3, top], [m, top + 7], [x1 - w * 0.3, top], [x1 - w * 0.12, top + 2], [x1 + 1, top + 12], [x1, bot - 12], [x1 - 4, bot]].concat(pont ? [[m + 10, bot + 4], [m - 10, bot + 4]] : []); };
  body += `<path d="${P(unit(48, 92, 56, 106), true)}" fill="${C.crown}"/><path d="${P(unit(94, 156, 58, 104, true), true)}" fill="${C.crown}"/><path d="${P(unit(158, 210, 58, 104), true)}" fill="${C.crown}"/>` +
    `<path d="M88 66H98V88H88ZM152 66H162V88H152Z" fill="${C.crown}"/>`;
  body += mark(1, 186, 214, 196, 176) + mark(2, 262, 166, 231, 158) + mark(3, 220, 112, 189, 112) + mark(4, 125, 44, 125, 64) + mark(5, 36, 188, 64, 168);
  const S = section(100, 212, 0.95);
  let sec = boneSec(S, 23) + softSec(S, 150);
  sec += `<path d="M71 108L79 108L76.5 168L73.5 168Z" fill="none" stroke="${C.fib}" stroke-width="5" stroke-linejoin="round"/><path d="M71 108L79 108L76.5 168L73.5 168Z" fill="${C.metal}"/>`;
  sec += `<rect x="73.5" y="80" width="3" height="29" fill="${C.metal}"/><path d="M68 82L69 56L81 56L82 82Z" fill="${C.metal}"/>`;
  sec += label(108, 60, "post", 82, 64) + label(108, 136, "blade", 80, 136) + label(42, 160, "fibrous|tissue", 71, 156, "end") + label(108, 196, "bone", 97, 196);
  return {
    title: "Implant drawing E",
    caption: "Blade (plate form): a flat metal blade set in a slot cut in the bone, with holes (Linkow's Blade-Vent), usually hooked to a natural tooth by a bridge. Soft tissue, not bone, lay against the metal. L1 Evolution; schematic.",
    key: [["1", "A flat blade set in a slot cut in the bone (the early ones weren't titanium)."], ["2", "Holes in the blade: Linkow's Blade-Vent."], ["3", "A post through the gum carries a crown."], ["4", "Hooked to a natural tooth, which is what really held it."], ["5", "Dark line around the blade: a soft tissue layer between the metal and the bone, not osseointegration."]],
    svg: `<div class="ty-fig">${mainSvg("periapical radiograph", body)}${secSvg(sec, ["in a slot in the bone,", "fibrous tissue around it"])}</div>`,
  };
}

/* ================================================================== F. Mandibular ramus frame */
function ramus() {
  const barY = (x) => crestY(Math.min(222, Math.max(108, x))) - 15;
  let fr = `<path d="${P(range(106, 224, 40).map((x) => [x, barY(x)]))}" stroke="${C.metal}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
  [[106, -1], [224, 1]].forEach(([x, s]) => {
    const neck = `M${x} ${f(barY(x))}Q${x - s * 3} ${f(barY(x) + 10)} ${x - s * 2} ${f(barY(x) + 20)}`;
    fr += `<path d="${neck}" stroke="${C.metal}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    /* front-bottom, front-top, back-top, back-bottom (s = -1 on the left, so "back" is toward the ramus) */
    const blade = [[x - s * 2, 174], [x + s * 12, 104], [x + s * 23, 107], [x + s * 10, 177]];
    fr += `<path d="${P(blade, true)}" fill="${C.metal}" stroke="${C.metalEdge}" stroke-width="1" stroke-linejoin="round"/>`;
    [0.3, 0.62].forEach((k) => { const q = [(blade[0][0] + blade[3][0]) / 2 + ((blade[1][0] + blade[2][0]) / 2 - (blade[0][0] + blade[3][0]) / 2) * k, (blade[0][1] + blade[3][1]) / 2 + ((blade[1][1] + blade[2][1]) / 2 - (blade[0][1] + blade[3][1]) / 2) * k]; fr += `<ellipse cx="${f(q[0])}" cy="${f(q[1])}" rx="3" ry="5" transform="rotate(${s * 18} ${f(q[0])} ${f(q[1])})" fill="${C.bone}"/>`; });
  });
  fr += `<rect x="162" y="${f(barY(165))}" width="6" height="${f(193 - barY(165))}" fill="${C.metal}"/><path d="M150 192L180 192L183 222Q165 228 147 222Z" fill="${C.metal}" stroke="${C.metalEdge}" stroke-width="1"/><ellipse cx="158" cy="207" rx="3.5" ry="6" fill="${C.bone}"/><ellipse cx="172" cy="207" rx="3.5" ry="6" fill="${C.bone}"/>`;
  const body = pano(19) + fr + mark(1, 136, 128, 140, barY(140) - 2) + mark(2, 50, 166, 92, 132) + mark(3, 208, 250, 179, 214);
  const S = section(100, 212);
  let sec = boneSec(S, 29) + softSec(S, 150);
  sec += `<path d="M70 110L80 110L77 172L73 172Z" fill="${C.metal}"/><rect x="73" y="70" width="4" height="42" fill="${C.metal}"/><rect x="62" y="60" width="26" height="11" rx="3" fill="${C.metal}"/>`;
  sec += `<path d="M38 78Q40 44 75 40Q110 44 112 78" fill="none" stroke="${C.acrEdge}" stroke-width="1.6" stroke-dasharray="4 3"/>`;
  sec += label(118, 36, "denture", 104, 50) + label(118, 66, "bar", 89, 66) + label(118, 96, "mucosa", 93, 102) + label(118, 150, "blade", 79, 150) + label(32, 92, "space", 66, 84, "end");
  return {
    title: "Implant drawing F",
    caption: "Mandibular ramus frame: one piece, with blades in both rami and in the symphysis, joined by a bar that runs above the ridge to hold a lower denture. L1 Evolution; schematic.",
    key: [["1", "A bar over the ridge; the lower denture snaps onto it (a Lew attachment)."], ["2", "The frame runs back into both rami..."], ["3", "...and into the symphysis, all one piece. Infection in the ramus area was the problem, and big implants fail big."]],
    svg: `<div class="ty-fig">${mainSvg("panoramic radiograph", body)}${secSvg(sec, ["bar above the gum,", "blades in the bone"], ["labial", "lingual"])}</div>`,
  };
}

/* ================================================================== G. Root form */
function root() {
  const crest = (x) => 106 + Math.sin(x / 11) * 1.2;
  const T = [tooth({ cx: 74, cej: 96, cw: 46, vw: 30, ch: 50, rl: 88, kind: "pm", crest: 106 }), tooth({ cx: 120, cej: 96, cw: 46, vw: 30, ch: 48, rl: 90, kind: "pm", crest: 106 })];
  const M = molar({ cx: 247, cej: 96, cw: 64, vw: 48, ch: 47, rl: 84, crest: 106, curve: 4 });
  let body = film(crest, 41) + `<path d="M24 228Q170 220 306 232" stroke="${C.canalWall}" stroke-width="7" fill="none"/><path d="M24 228Q170 220 306 232" stroke="${C.canal}" stroke-width="4" fill="none"/>` +
    T.map((t) => t.halo).join("") + M.halo + T.map((t) => t.body).join("") + M.body;
  const cx = 179, top = 106, len = 66, hw = (y) => { const k = (y - top) / len; return k < 0.75 ? 14.5 : 14.5 - 4.5 * (k - 0.75) / 0.25; };
  const L = [], R = [];
  for (let y = top; y <= top + len; y += 1) { const ph = ((y - top - 5) % 6 + 6) % 6, th = y > top + 4 && y < top + len - 3 ? (ph < 3 ? ph : 6 - ph) * 0.9 : 0; L.push([cx - hw(y) - th, y]); R.push([cx + hw(y) + th, y]); }
  body += `<path d="${P(L.concat([[cx - 6, top + len + 3], [cx + 6, top + len + 3]], R.reverse()), true)}" fill="${C.metal}"/>`;
  body += `<path d="M${cx - 4} ${top + 4}L${cx - 3} ${top + 40}L${cx + 3} ${top + 40}L${cx + 4} ${top + 4}Z" fill="${C.metalEdge}"/>`;
  body += `<path d="M${cx - 13} ${top}L${cx - 11} 84L${cx + 11} 84L${cx + 13} ${top}Z" fill="${C.metal}"/>`;
  const cr = [[cx - 20, 94], [cx - 30, 80], [cx - 34, 58], [cx - 26, 50], [cx - 13, 56], [cx, 50], [cx + 13, 56], [cx + 26, 50], [cx + 34, 58], [cx + 30, 80], [cx + 20, 94]];
  body += `<path d="${P(cr, true)}" fill="${C.crown}"/><path d="M${cx - 11} 84L${cx - 9} 66L${cx + 9} 66L${cx + 11} 84" fill="none" stroke="#b8c3c9" stroke-width="1.2"/>`;
  body += mark(1, 230, 196, 194, 150) + mark(2, 120, 222, cx - 13, 166) + mark(3, 214, 46, 205, 60) + mark(4, 222, 114, cx + 12, 92);
  const S = section(104, 212);
  let sec = boneSec(S, 37) + softSec(S, 150);
  const sx = 75, st = 106, sl = 74, shw = (y) => { const k = (y - st) / sl; return k < 0.75 ? 11 : 11 - 4 * (k - 0.75) / 0.25; }, sL = [], sR = [];
  for (let y = st; y <= st + sl; y += 1) { const ph = ((y - st - 5) % 6 + 6) % 6, th = y > st + 4 && y < st + sl - 3 ? (ph < 3 ? ph : 6 - ph) * 0.9 : 0; sL.push([sx - shw(y) - th, y]); sR.push([sx + shw(y) + th, y]); }
  sec += `<path d="${P(sL.concat([[sx - 5, st + sl + 3], [sx + 5, st + sl + 3]], sR.reverse()), true)}" fill="${C.metal}"/><path d="M65 106L67 84L83 84L85 106Z" fill="${C.metal}"/>`;
  sec += `<path d="M66 86L58 72L60 44L75 38L90 44L92 72L84 86Z" fill="${C.crown}"/>`;
  sec += label(108, 50, "crown", 92, 54) + label(108, 92, "abutment", 85, 96) + label(108, 128, "mucosa", 98, 124) + label(108, 166, "bone", 98, 170) + label(42, 150, "threads", 62, 150, "end");
  return {
    title: "Implant drawing G",
    caption: "Root form: a threaded titanium screw in the bone (endosteal), with an abutment and crown. Bone lies right on the threads, with no PDL around it. Today's standard. L1 Evolution and L2 Introduction; schematic.",
    key: [["1", "A screw-shaped titanium cylinder in the bone."], ["2", "Bone right against it: osseointegration (the bone bonds to the titanium oxide), with no PDL line like the teeth have."], ["3", "The crown."], ["4", "The abutment through the gum."]],
    svg: `<div class="ty-fig">${mainSvg("periapical radiograph", body)}${secSvg(sec, ["in the bone (endosteal),", "bone right on the threads"])}</div>`,
  };
}

/* the hub's FIGS, in the order the lecture lists them */
export const TYPE_ORDER = ["ty-sub", "ty-endo", "ty-trans", "ty-mucosal", "ty-blade", "ty-ramus", "ty-root"];
export function types() {
  const all = { "ty-sub": sub(), "ty-endo": endo(), "ty-trans": trans(), "ty-mucosal": mucosal(), "ty-blade": blade(), "ty-ramus": ramus(), "ty-root": root() };
  const out = {}; TYPE_ORDER.forEach((k) => { out[k] = all[k]; }); return out;
}
