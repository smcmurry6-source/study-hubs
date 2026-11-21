// Fig 19: erosion pattern map (Occlusion L7, "Dental wear": erosion patterns). Both arches in occlusal view, second molar
// to second molar (the maxillary seen from below, incisors up; the mandibular from above, incisors down; the patient's
// right on the viewer's left, as in a chart), each tooth split into its facial, occlusal (incisal) and lingual surfaces.
// Pick a cause and the surfaces it erodes shade by how much, as the notes give them: GERD (the lingual of every
// maxillary tooth to the second molars and the mandibular molar occlusals, worse on the side slept on), bulimia
// (maxillary anteriors, sometimes to the first premolar; mandibular anteriors spared), carbonated drinks swished (all
// teeth, satin, islands of dentin) or pooled at the back (very severe, back and front, high caries), citrus sucked
// through the front teeth (screwdriver) or chewed on the molars (more posterior wear), and, for contrast, NCCLs (facial
// of maxillary premolars, multifactorial). Beside it (under it on a phone: the two drawings are separate SVGs), the
// pattern's name and key, and a worn molar with attrition vs erosion, each an enamel cap over dentin with its roots fading out. Severity is drawn in three
// steps to show the pattern, not measured; tooth sizes are typical, the arch form schematic. Static geometry is built
// here; the browser only switches classes, so the shading crossfades.
import { figureSvg, plateHtml } from "./shared.mjs";

const W = 300, H = 400; /* the arches */
const r1 = (v) => Math.round(v * 10) / 10;
/* [name, mesiodistal width, buccolingual depth] mm, central incisor to second molar */
const MAXT = [["central incisor", 8.5, 7], ["lateral incisor", 6.5, 6], ["canine", 7.5, 8], ["first premolar", 7, 9], ["second premolar", 6.5, 9], ["first molar", 10, 11], ["second molar", 9, 11]];
const MANT = [["central incisor", 5, 6], ["lateral incisor", 5.5, 6], ["canine", 7, 7.5], ["first premolar", 7, 7.5], ["second premolar", 7, 8], ["first molar", 11, 10.5], ["second molar", 10.5, 10]];
/* the arch curve (right half, mm; y toward the back) through the middle of the teeth */
const CURVE = { max: [[0, 0], [8, 1.6], [14.6, 6], [19, 12.5], [22.4, 21], [25, 30.5], [27, 41], [28, 50]], man: [[0, 0], [5.8, 1.2], [11, 4.6], [15.4, 10.4], [18.8, 19], [21.4, 28.6], [23.4, 39.4], [24.4, 49]] };
function sampleCurve(P) {
  const out = [];
  for (let i = 0; i < P.length - 1; i++) { const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    for (let k = 0; k < 20; k++) { const t = k / 20, t2 = t * t, t3 = t2 * t, g = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3); out.push([g(p0[0], p1[0], p2[0], p3[0]), g(p0[1], p1[1], p2[1], p3[1])]); } }
  out.push(P[P.length - 1]);
  let L = 0; return out.map((p, i) => { if (i) L += Math.hypot(p[0] - out[i - 1][0], p[1] - out[i - 1][1]); return { p, L }; });
}
function atLen(S, L) { for (let i = 1; i < S.length; i++) if (S[i].L >= L) { const a = S[i - 1], b = S[i], t = (L - a.L) / (b.L - a.L), d = [b.p[0] - a.p[0], b.p[1] - a.p[1]], n = Math.hypot(d[0], d[1]); return { p: [a.p[0] + d[0] * t, a.p[1] + d[1] * t], tg: [d[0] / n, d[1] / n] }; } const b = S[S.length - 1]; return { p: b.p, tg: [0, 1] }; }
/* a rounded rectangle in the tooth's own frame (u along the arch, v from lingual (-) to facial (+)) */
function rrect(w, d, r) {
  const pts = [], c = [[w / 2 - r, d / 2 - r, 0], [-w / 2 + r, d / 2 - r, 90], [-w / 2 + r, -d / 2 + r, 180], [w / 2 - r, -d / 2 + r, 270]];
  for (const [cx, cy, a0] of c) for (let k = 0; k <= 6; k++) { const a = (a0 + k * 15) * Math.PI / 180; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
  return pts;
}
function clipV(pts, lo, hi) {
  const cut = (arr, inside, v) => { const out = []; for (let i = 0; i < arr.length; i++) { const a = arr[i], b = arr[(i + 1) % arr.length], ia = inside(a), ib = inside(b); if (ia) out.push(a); if (ia !== ib) { const t = (v - a[1]) / (b[1] - a[1]); out.push([a[0] + (b[0] - a[0]) * t, v]); } } return out; };
  return cut(cut(pts, (p) => p[1] >= lo, lo), (p) => p[1] <= hi, hi);
}
/* the static geometry: tooth outlines and surface zones in screen coordinates */
function build() {
  const S = 3.1, CX = 150, teeth = [], zones = [], spots = { dentin: [], caries: [] };
  for (const arch of ["max", "man"]) {
    const T = arch === "max" ? MAXT : MANT, C = sampleCurve(CURVE[arch]);
    const scr = (p) => arch === "max" ? [CX + p[0] * S, 34 + p[1] * S] : [CX + p[0] * S, 386 - p[1] * S];
    for (const side of [1, -1]) { /* +1: patient's right (viewer's left) */
      let L = 0;
      T.forEach(([name, w, d], i) => {
        const g = 0.35, mid = atLen(C, L + g + w / 2); L += w + 2 * g;
        const tg = [mid.tg[0], mid.tg[1]], nf = [tg[1], -tg[0]]; /* outward (facial) normal, for the right half */
        const toLocal = (u, v) => [mid.p[0] + tg[0] * u + nf[0] * v, mid.p[1] + tg[1] * u + nf[1] * v];
        const place = (q) => { const m = toLocal(q[0], q[1]); return scr([-side * m[0], m[1]]); };
        const r = Math.min(w, d) * (i < 3 ? 0.42 : 0.3), out = rrect(w, d, r);
        const num = arch === "max" ? (side > 0 ? 8 - i : 9 + i) : (side > 0 ? 25 + i : 24 - i);
        const ti = teeth.length;
        teeth.push({ n: num, name: (arch === "max" ? "maxillary " : "mandibular ") + (side > 0 ? "right " : "left ") + name, d: "M" + out.map(place).map((p) => r1(p[0]) + " " + r1(p[1])).join("L") + "Z", arch, side, i });
        const band = i < 2 ? 0.1 : i === 2 ? 0.14 : 0.18; /* the occlusal/incisal band, as a share of the depth on each side */
        [["l", -d / 2 - 1, -band * d], ["o", -band * d, band * d], ["f", band * d, d / 2 + 1]].forEach(([z, a, b]) => {
          const poly = clipV(out, a, b);
          zones.push({ t: ti, z, d: "M" + poly.map(place).map((p) => r1(p[0]) + " " + r1(p[1])).join("L") + "Z" });
        });
        if (i >= 3) { spots.dentin.push(place([-w * 0.18, 0.02 * d]).map(r1), place([w * 0.2, -0.03 * d]).map(r1)); spots.caries.push(place([w * 0.12, d * 0.36]).map(r1)); }
      });
    }
  }
  return { teeth, zones, spots };
}
const G = build();

/* severity (0-3) for every zone, per pattern */
function sev(fn) { return G.zones.map((z) => { const t = G.teeth[z.t]; return fn(t.arch, t.side, t.i, z.z); }); }
const ant = (i) => i < 3, post = (i) => i >= 3, molar = (i) => i >= 5;
function gerd(sleep) { /* sleep: +1 right, -1 left, 0 back */
  const w = (side) => sleep === 0 ? 2 : side === sleep ? 3 : 1;
  return sev((a, s, i, z) => a === "max" && z === "l" ? w(s) : a === "man" && molar(i) && z === "o" ? w(s) : 0);
}
const PAT = {
  gerdR: gerd(1), gerdL: gerd(-1), gerdB: gerd(0),
  bulimia: sev((a, s, i, z) => a === "max" && ant(i) ? (z === "l" ? 3 : z === "o" ? 2 : 0) : a === "max" && i === 3 && z === "l" ? 1 : 0),
  soda1: sev(() => 1),
  soda2: sev((a, s, i, z) => post(i) ? (z === "o" ? 3 : 2) : z === "f" ? 1 : 2),
  citrus1: sev((a, s, i, z) => ant(i) ? (z === "o" ? 3 : z === "f" ? 2 : 1) : 0),
  citrus2: sev((a, s, i, z) => post(i) ? (z === "o" ? 3 : 1) : z === "o" ? 1 : 0),
  nccl: sev((a, s, i, z) => z !== "f" ? 0 : a === "max" && (i === 3 || i === 4) ? 3 : a === "max" && (i === 2 || i === 5) ? 1 : a === "man" && (i === 3 || i === 4) ? 1 : 0),
};
const TEXT = {
  gerd: "GERD: the classic appearance is erosion on the lingual of all the maxillary teeth to the second molars and on the occlusal surfaces of the mandibular molars. It is often asymmetrical: in sleep the refluxed acid rolls off the tongue onto the lingual surfaces, and the side the patient prefers to sleep on gets more (on the back, both sides).",
  bulimia: "Bulimia nervosa: mostly the maxillary anterior teeth, sometimes to the first premolar (posterior teeth only when long-standing). The maxillary anteriors can be completely destroyed while the mandibular anteriors are not, protected by the tongue and saliva; GERD doesn't do this.",
  soda1: "Carbonated drinks, pattern 1: swish, hold in the vestibule to fizz, then swallow. Generalized erosion on all the teeth, with a satin appearance and islands of exposed dentin.",
  soda2: "Carbonated drinks, pattern 2: pool the drink in the back of the mouth to fizz and cool. Very severe, with high caries, and more wear on the back teeth and the front teeth.",
  citrus1: "Citrus, type 1: bite the fruit and suck the juice through the teeth. The front teeth erode to a \"screwdriver\" appearance.",
  citrus2: "Citrus, type 2: bite and chew on the molars. It looks like a patient who pools drinks on the back teeth: more posterior wear than anterior.",
  nccl: "For contrast, noncarious cervical lesions (not one erosion pattern): notches at the CEJ found throughout the mouth, most often on the facial of the maxillary premolars; lingual ones occur but are rarely severe. Their cause is multifactorial: horizontal toothbrushing, acidic food and drink, reflux, with occlusal factors associated but not enough alone.",
  more: " Less common causes: drug abuse (aspirin, meth), swimming in chlorinated water (on the side they breathe on) and occupational exposure (battery and galvanizing workers).",
};
const NAME = { gerd: "GERD", bulimia: "bulimia nervosa", soda1: "soda, swished", soda2: "soda, pooled at the back", citrus1: "citrus, sucked", citrus2: "citrus, chewed on the molars", nccl: "cervical notches (NCCLs)" };

/* the worn molar close-up: attrition vs erosion, mesiodistal sections (local units, about 9 to a millimeter, y down,
   occlusal surface near y 30): an enamel cap over dentin, the CEJ at y 71, two roots fading out below. The attrition
   molar meets its opposing molar (the same shape upside down) on matching flat facets */
const MOL_SIDES = { r: [[94, 40], [95.5, 50], [93.5, 61], [87, 71], [86.5, 80], [84.5, 90], [82, 99], [66, 99], [63, 88], [57, 80], [50, 77], [43, 80], [37, 88], [34, 99], [18, 99], [15.5, 90], [13.5, 80], [13, 71], [6.5, 61], [4.5, 50], [6, 40]] };
/* the dentin: inside the crown, then the roots themselves below the CEJ */
const MOL_DENT = [[87, 40], [88.6, 50], [86.4, 61], [87, 71], [86.5, 80], [84.5, 90], [82, 99], [66, 99], [63, 88], [57, 80], [50, 77], [43, 80], [37, 88], [34, 99], [18, 99], [15.5, 90], [13.5, 80], [13, 71], [13.6, 61], [11.4, 50], [13, 40]];
function erClose(x0, y0, k) {
  const P = (pts, flip) => "M" + pts.map((p) => r1(x0 + p[0] * k) + " " + r1(y0 + (flip ? 60 - p[1] : p[1]) * k)).join("L") + "Z";
  const attTop = [[9, 30.4], [91, 30.4]], attDTop = [[17, 30.6], [83, 30.6]];
  const eroTop = [[91.4, 31], [87.6, 25.6], [84, 26.4], [79, 31.4], [72, 33.2], [65, 30], [60.6, 27], [58, 27], [58, 19], [44, 19], [44, 27], [41.4, 27], [37, 30], [30, 33.2], [22, 31.6], [16.6, 26.4], [12.4, 25.6], [8.6, 31]];
  const eroDTop = [[84.4, 27.4], [83, 27.8], [78.6, 32], [72, 33.8], [65, 30.6], [60.6, 27.8], [58, 28], [44, 28], [41.4, 27.8], [37.2, 30.6], [30, 33.8], [22.2, 32.2], [17.6, 27.8], [16, 27.4]];
  /* the outlines run clockwise from the occlusal surface's distal end: the top (left to right), then the sides and roots */
  const att = attTop.concat(MOL_SIDES.r), attD = attDTop.concat(MOL_DENT);
  const ero = eroTop.slice().reverse().concat(MOL_SIDES.r), eroD = eroDTop.slice().reverse().concat(MOL_DENT);
  return { att: P(att), attD: P(attD), opp: P(att, true), oppD: P(attD, true), shine: `M${r1(x0 + 12 * k)} ${r1(y0 + 31.8 * k)}L${r1(x0 + 52 * k)} ${r1(y0 + 31.8 * k)}`, ero: P(ero), eroD: P(eroD), resto: P([[44, 19], [58, 19], [58, 30], [44, 30]]) };
}
const SW = 250, SH = 356; /* the side panel */
const CL = { x: [4, 136], y: 184, k: 1, a: erClose(4, 184, 1.0), e: erClose(136, 184, 1.0) };

/* a fade: side-by-side page-colored bands from the clear edge c to the opaque edge o (local y), then solid page color
   to yEnd (each pixel painted once, so the color can't drift in the dark theme) */
function erFog(x0, x1, c, o, yEnd) {
  let s = ""; const n = 12, Yl = (m) => CL.y + m * CL.k;
  for (let k = 0; k <= n; k++) { const m0 = c + (o - c) * k / n, m1 = k === n ? yEnd : c + (o - c) * (k + 1) / n, op = k === n ? 1 : Math.round(1000 * (k + 0.5) / n) / 1000;
    const ya = r1(Math.min(Yl(m0), Yl(m1))), yb = r1(Math.max(Yl(m0), Yl(m1))); /* edges rounded first: no seams */
    s += `<rect class="er-fog" x="${r1(x0)}" y="${ya}" width="${r1(x1 - x0)}" height="${r1(yb - ya)}" style="fill-opacity:${op}"/>`; }
  return s;
}
const tx = (x, y, t, cls, a) => `<text class="er-t${cls ? " " + cls : ""}" x="${r1(x)}" y="${r1(y)}"${a ? ` text-anchor="${a}"` : ""}>${t}</text>`;
/* the arches */
function erArch() {
  let o = "";
  o += tx(150, 128, "maxillary", "er-cap", "middle") + tx(150, 141, "seen from below", "er-cap", "middle");
  o += tx(150, 288, "mandibular", "er-cap", "middle") + tx(150, 301, "seen from above", "er-cap", "middle");
  o += tx(6, 214, "patient's right", "er-cap", "start") + tx(294, 214, "patient's left", "er-cap", "end");
  G.teeth.forEach((t) => { o += `<path class="er-tooth hot" data-info="#${t.n}, ${t.name}" d="${t.d}"/>`; });
  G.zones.forEach((z, i) => { o += `<path class="er-z er-s0" data-zi="${i}" d="${z.d}"/>`; });
  G.teeth.forEach((t) => { o += `<path class="er-edge" d="${t.d}"/>`; });
  G.spots.dentin.forEach((p) => { o += `<ellipse class="er-dent" cx="${p[0]}" cy="${p[1]}" rx="2.2" ry="1.5"/>`; });
  G.spots.caries.forEach((p) => { o += `<circle class="er-car" cx="${p[0]}" cy="${p[1]}" r="1.9"/>`; });
  return o;
}
/* the side panel: the pattern's name, the legend, the close-up */
function erSide() {
  let o = "";
  const xa = CL.x[0], xe = CL.x[1], ca = xa + 50 * CL.k, ce = xe + 50 * CL.k;
  /* the teeth first, their root ends faded, then every word over them */
  o += `<path class="er-enamel er-oppt hot" data-info="The opposing molar. With attrition the facets match: tooth grinding on tooth wears both flat at the contact." d="${CL.a.opp}"/><path class="er-dentin er-oppt" d="${CL.a.oppD}"/>`;
  o += `<path class="er-enamel hot" data-info="Attrition: tooth-to-tooth grinding. The facets match the opposing tooth and are only at the occlusal contacts; shiny, with sharp edges; enamel and dentin in the facet at the same height." d="${CL.a.att}"/><path class="er-dentin" d="${CL.a.attD}"/><path class="er-shine" d="${CL.a.shine}"/>`;
  o += `<path class="er-enamel hot" data-info="Erosion: chemically assisted wear. It extends beyond the occlusal contacts; the facets are dull; the dentin cups out (it wears faster than enamel); restorations stand proud of the dissolved tooth." d="${CL.e.ero}"/><path class="er-dentin" d="${CL.e.eroD}"/><path class="er-resto hot" data-info="A proud restoration: the acid dissolves the tooth around it, not the restoration." d="${CL.e.resto}"/>`;
  o += erFog(xa - 2, xa + 100 * CL.k, -16, -32, -42) + erFog(0, SW, 84, 98, 101);
  o += `<text class="er-t er-head er-name" x="0" y="26">GERD</text>`;
  o += tx(0, 42, "pick a cause below", "er-cap er-sub", "start");
  [["none", 0, 0], ["mild", 1, 58], ["marked", 2, 114], ["severe", 3, 184]].forEach(([n, s, x]) => { o += `<rect class="er-sw er-s${s}" x="${x}" y="58" width="14" height="10" rx="2"/>` + tx(x + 18, 67, n, "er-cap", "start"); });
  o += tx(0, 86, "each tooth: facial band outside,", "er-cap er-sm", "start") + tx(0, 98, "occlusal in the middle, lingual inside", "er-cap er-sm", "start");
  o += `<g class="er-dkey"><ellipse class="er-dent" cx="4" cy="114" rx="2.2" ry="1.5"/>${tx(12, 117, "islands of exposed dentin", "er-cap", "start")}</g>`;
  o += `<g class="er-ckey"><circle class="er-car" cx="4" cy="114" r="1.9"/>${tx(12, 117, "caries", "er-cap", "start")}</g>`;
  o += tx(0, 140, "a worn molar, close up", "er-head", "start");
  o += `<g class="er-call"><path class="am-leader" d="M${r1(ce + 1)} ${r1(CL.y - 18)}L${r1(ce + 1)} ${r1(CL.y + 19 * CL.k)}"/><circle class="am-dot" cx="${r1(ce + 1)}" cy="${r1(CL.y + 19 * CL.k)}" r="1.8"/>${tx(ce + 1, CL.y - 22, "restoration", "", "middle")}</g>`;
  o += tx(ca, 296, "attrition", "er-head", "middle") + ["shiny facets,", "sharp edges,", "enamel = dentin", "matches opposing"].map((t, k) => tx(ca, 310 + k * 12.5, t, "er-cap er-sm", "middle")).join("");
  o += tx(ce, 296, "erosion", "er-head", "middle") + ["dull facets,", "cupped dentin,", "proud restoration,", "beyond contacts"].map((t, k) => tx(ce, 310 + k * 12.5, t, "er-cap er-sm", "middle")).join("");
  return o;
}

/* the pattern on the teeth, its name and the keys; box holds both drawings */
function erApply(box, key, D) {
  var s = D.PAT[key], g = key.slice(0, 4) === "gerd" ? "gerd" : key;
  Array.prototype.forEach.call(box.querySelectorAll("[data-zi]"), function (el) { el.setAttribute("class", "er-z er-s" + s[+el.getAttribute("data-zi")]); });
  box.setAttribute("data-er", key);
  var n = box.querySelector(".er-name"); if (n) n.textContent = D.NAME[g];
  var sub = box.querySelector(".er-sub"); if (sub) sub.textContent = { gerdR: "sleeps on the right side", gerdL: "sleeps on the left side", gerdB: "sleeps on the back", bulimia: "mandibular anteriors spared", soda1: "generalized, satin", soda2: "very severe, high caries", citrus1: "screwdriver incisors", citrus2: "more posterior than anterior", nccl: "not one erosion pattern" }[key];
}

const svgArch = figureSvg({ width: W, height: H, className: "er-svg er-arch", label: "Occlusal views of both arches with each tooth's facial, occlusal and lingual surfaces shaded by how much a chosen cause erodes them.", body: erArch() });
const svgSide = figureSvg({ width: SW, height: SH, className: "er-svg er-side", label: "The chosen cause, the severity key, and a worn molar with attrition beside one with erosion.", body: erSide() });
const plate = plateHtml({ fig: "Fig 19", title: "Erosion patterns", hint: "pick a cause", readout: "", body: `<div class="am-svg er-box">${svgArch}${svgSide}</div>` });
const controls = `<div class="am-controls" role="group" aria-label="Cause"><button type="button" class="am-btn" data-erk="gerd" aria-pressed="true">GERD</button><button type="button" class="am-btn" data-erk="bulimia" aria-pressed="false">Bulimia</button><button type="button" class="am-btn" data-erk="soda1" aria-pressed="false">Soda: swish</button><button type="button" class="am-btn" data-erk="soda2" aria-pressed="false">Soda: pool</button><button type="button" class="am-btn" data-erk="citrus1" aria-pressed="false">Citrus: suck</button><button type="button" class="am-btn" data-erk="citrus2" aria-pressed="false">Citrus: chew</button><button type="button" class="am-btn" data-erk="nccl" aria-pressed="false">NCCLs</button></div>
<div class="am-controls er-sleep" role="group" aria-label="GERD: the side the patient sleeps on"><button type="button" class="am-btn" data-ers="R" aria-pressed="true">Sleeps on the right</button><button type="button" class="am-btn" data-ers="L" aria-pressed="false">On the left</button><button type="button" class="am-btn" data-ers="B" aria-pressed="false">On the back</button></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Hover or tap a tooth, or the worn molars.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From the L7 notes (Dr. Givan's Occ Lec6 slides and the 10/29 recording): the erosion patterns of GERD, bulimia nervosa, carbonated beverage abuse (patterns 1 and 2) and citrus fruit abuse (types 1 and 2), the less common causes, where NCCLs are found, and the signs of attrition (matching, shiny facets with sharp edges, only at contacts, enamel and dentin level) and erosion (beyond the contacts, dull, cupped, proud restorations).</li>
<li>The slides and the recording differ on whether erosion facets match each other, so the close-up doesn't say.</li>
<li>Schematic: severity is drawn in three steps to show where each pattern goes, not measured; surfaces the notes don't name are left unshaded (the bulimia lingual-and-incisal split follows the hub's case); tooth sizes are typical values and the arch form is drawn, not traced. Educational, not clinical guidance.</li></ul></details>`;

function erLive(root, D) {
  var box = root.querySelector(".er-box"), sum = root.querySelector(".am-summary"), info = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]"), sleepRow = root.querySelector(".er-sleep");
  /* a copy placed under another lecture can open on another cause (D.start) and add that lecture's point (D.extra) */
  var st = { k: D.start || "gerd", side: "R" };
  root.querySelectorAll("[data-erk]").forEach(function (x) { x.setAttribute("aria-pressed", String(x.getAttribute("data-erk") === st.k)); });
  function key() { return st.k === "gerd" ? "gerd" + st.side : st.k; }
  function apply() {
    D.erApply(box, key(), D);
    sleepRow.hidden = st.k !== "gerd";
    sum.textContent = D.TEXT[st.k] + ((D.extra && D.extra[st.k]) || "") + (st.k === "nccl" ? "" : D.TEXT.more);
    if (readout) readout.textContent = { gerd: "lingual maxillary, mandibular molars", bulimia: "maxillary anteriors", soda1: "all teeth", soda2: "back and front, severe", citrus1: "front teeth", citrus2: "back teeth", nccl: "facial, maxillary premolars" }[st.k];
  }
  root.querySelectorAll("[data-erk]").forEach(function (b) { b.addEventListener("click", function () { st.k = b.getAttribute("data-erk"); root.querySelectorAll("[data-erk]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); apply(); }); });
  root.querySelectorAll("[data-ers]").forEach(function (b) { b.addEventListener("click", function () { st.side = b.getAttribute("data-ers"); root.querySelectorAll("[data-ers]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); apply(); }); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && box.contains(el)) info.textContent = el.getAttribute("data-info"); }
  box.addEventListener("pointerover", hot); box.addEventListener("click", hot);
  apply();
}

const CSS = `
.anima .er-box{max-width:600px;margin:0 auto;display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:6px 18px}
.anima .am-svg.er-box svg.er-arch{flex:300 1 280px;width:auto;max-width:380px}
.anima .am-svg.er-box svg.er-side{flex:250 1 230px;width:auto;max-width:300px}
.anima .er-svg .er-fog{fill:var(--surface);stroke:none;pointer-events:none;shape-rendering:crispEdges}
.anima .er-svg .er-oppt{fill-opacity:.7;stroke-opacity:.8}
.anima .am-controls.er-sleep[hidden]{display:none}
.anima .er-svg .er-t{fill:var(--anatomy-text);font:11.5px var(--anatomy-mono);paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round}
.anima .er-svg .er-head{fill:var(--anatomy-strong);font-weight:700;stroke:none}
.anima .er-svg .er-cap{fill:var(--anatomy-muted);font-size:10.5px;stroke:none}
.anima .er-svg .er-sm{font-size:10px}
.anima .er-svg .er-tooth{fill:var(--tm-disc-mid);stroke:none}
.anima .er-svg .er-edge{fill:none;stroke:var(--anatomy-hi);stroke-width:1;stroke-linejoin:round;pointer-events:none}
.anima .er-svg .er-z{fill:var(--tm-vessel);stroke:var(--anatomy-faint);stroke-width:.4;pointer-events:none;transition:fill-opacity .45s ease}
.anima .er-svg .er-s0{fill-opacity:0}.anima .er-svg .er-s1{fill-opacity:.28}.anima .er-svg .er-s2{fill-opacity:.58}.anima .er-svg .er-s3{fill-opacity:.92}
.anima .er-svg .er-sw{fill:var(--tm-vessel);stroke:var(--anatomy-lo);stroke-width:.8}
.anima .er-svg rect.er-s0{fill:var(--tm-disc-mid);fill-opacity:1}
.anima .er-svg .er-dent,.anima .er-svg .er-car,.anima .er-svg .er-dkey,.anima .er-svg .er-ckey{opacity:0;transition:opacity .45s ease}
.anima .er-svg .er-dent{fill:#d6b25e;stroke:var(--anatomy-hi);stroke-width:.5}
.anima .er-svg .er-car{fill:#5b3a22;stroke:none}
.anima .er-box[data-er="soda1"] .er-dent,.anima .er-box[data-er="soda1"] .er-dkey,.anima .er-box[data-er="soda2"] .er-car,.anima .er-box[data-er="soda2"] .er-ckey{opacity:1}
.anima .er-svg .er-dkey .er-dent,.anima .er-svg .er-ckey .er-car{opacity:1}
.anima .er-svg .er-enamel{fill:var(--tm-disc-mid);stroke:var(--anatomy-hi);stroke-width:1.2;stroke-linejoin:round}
.anima .er-svg .er-dentin{fill:#e3c98a;stroke:var(--anatomy-lo);stroke-width:.8;stroke-linejoin:round;pointer-events:none}
.anima .er-svg .er-shine{stroke:#fff;stroke-width:2;stroke-linecap:round;opacity:.9}
.anima .er-svg .er-resto{fill:var(--anatomy-mid);stroke:var(--anatomy-hi);stroke-width:1}
@media (prefers-reduced-motion: reduce){.anima .er-svg .er-z,.anima .er-svg .er-dent,.anima .er-svg .er-car{transition:none}}
`;

export function erosion() {
  return {
    id: "erosion", lec: "malocclusion",
    title: "Erosion patterns",
    caption: "Pick a cause and see which surfaces of which teeth it erodes: GERD (and the side slept on), bulimia, soda swished or pooled, citrus sucked or chewed, with cervical notches for contrast; beside it, attrition vs erosion on a worn molar.",
    html: `<div class="anima" data-anima="erosion">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: erLive.toString(),
    helpers: [erApply],
    data: { PAT, TEXT, NAME },
  };
}
