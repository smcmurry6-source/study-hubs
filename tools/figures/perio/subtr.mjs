// Fig: subtraction radiography (Periodontology S6, Dr. Geurs's class and the notes' "What can you achieve, and how do
// you know?"). Two standardized periapical films of the same intrabony defect, the presurgical one and the one at
// 6 months, then digital subtraction: the presurgical film inverted, laid over the 6-month film, so everything that
// stayed the same cancels to an even gray and only the bone gained shows.
// Drawn films, 9 px = 1 mm: a lower second premolar and first molar (with the neighbors cut by the film's edges) and a
// vertical defect on the molar's mesial root. Every film color is a neutral gray, and the inverted film is the same
// markup with each gray replaced by its complement (255 - v), so the overlay step is exact: half the 6-month film plus
// half the inverted presurgical film is 127.5 wherever the films match (within a gray level, since alpha is 8-bit). The 6-month film is the presurgical film plus
// one shape (the new bone), so nothing else can differ. The live code clones the films from the one in the markup.
// How deep the defect is and how much fills are illustrative.
import { figureSvg, plateHtml, f1 } from "./shared.mjs";

const W = 360, H = 272, K = 9, FX = 6, FY = 24, FW = 256, FH = 224, FMM = 30.2, Y0 = 0.8, CEJ = 9.5;
/* film mm (x from the premolar end, unflipped; y down from the film's top edge) to px: the film is drawn mirrored, so
   the molar sits on the left and its mesial defect faces the premolar on the right */
const X = (mm) => f1(FX + K * (FMM - mm)), Y = (mm) => f1(FY + K * (mm - Y0));

/* outlines (x from the tooth's axis, y in film mm, CEJ at 9.5) */
const PM = {
  out: [[-2.5, 9.5], [-3.15, 7.8], [-3.5, 5.6], [-3.35, 3.9], [-2.7, 2.8], [-1.4, 2.0], [0, 1.6], [1.4, 2.0], [2.7, 2.8], [3.35, 3.9], [3.5, 5.6], [3.15, 7.8], [2.5, 9.5],
    [2.5, 11], [2.35, 14], [2.05, 17], [1.6, 20.2], [1.05, 22.4], [0.2, 23.4], [-0.75, 22.4], [-1.4, 20.2], [-1.9, 17], [-2.25, 14], [-2.45, 11]],
  ena: [[-2.5, 9.5], [-3.15, 7.8], [-3.5, 5.6], [-3.35, 3.9], [-2.7, 2.8], [-1.4, 2.0], [0, 1.6], [1.4, 2.0], [2.7, 2.8], [3.35, 3.9], [3.5, 5.6], [3.15, 7.8], [2.5, 9.5],
    [2.42, 9.2], [2.55, 7.6], [2.6, 5.5], [2.25, 4.1], [1.2, 3.35], [0, 3.1], [-1.2, 3.35], [-2.25, 4.1], [-2.6, 5.5], [-2.55, 7.6], [-2.42, 9.2]],
  pul: [[0.1, 23.0], [0.28, 20.5], [0.36, 16.5], [0.45, 12.5], [0.7, 10.0], [1.0, 8.2], [0.85, 6.0], [0.4, 6.9], [0, 6.8], [-0.4, 6.9], [-0.85, 6.0], [-1.0, 8.2],
    [-0.7, 10.0], [-0.45, 12.5], [-0.36, 16.5], [-0.28, 20.5], [-0.1, 23.0]],
};
const MO = {
  out: [[-4.5, 9.5], [-5.2, 7.6], [-5.6, 5.3], [-5.45, 3.9], [-4.85, 2.85], [-3.7, 2.25], [-2.5, 2.5], [-1.2, 2.2], [0.1, 2.5], [1.4, 2.2], [2.7, 2.45], [3.9, 2.3], [4.9, 2.95],
    [5.45, 3.95], [5.6, 5.3], [5.2, 7.6], [4.5, 9.5], [4.5, 11], [4.45, 13.5], [4.25, 16.5], [3.9, 19.5], [3.35, 21.5], [2.6, 22.2], [1.85, 21.6], [1.5, 19.5], [1.3, 17],
    [1.25, 14.6], [0.7, 12.7], [0.1, 12.35], [-0.5, 12.7], [-0.9, 14.6], [-0.95, 17], [-0.95, 19.8], [-1.35, 22.3], [-2.2, 23.0], [-3.05, 22.3], [-3.7, 20], [-4.2, 17], [-4.5, 14], [-4.6, 11.5]],
  ena: [[-4.5, 9.5], [-5.2, 7.6], [-5.6, 5.3], [-5.45, 3.9], [-4.85, 2.85], [-3.7, 2.25], [-2.5, 2.5], [-1.2, 2.2], [0.1, 2.5], [1.4, 2.2], [2.7, 2.45], [3.9, 2.3], [4.9, 2.95],
    [5.45, 3.95], [5.6, 5.3], [5.2, 7.6], [4.5, 9.5], [4.4, 9.2], [4.6, 7.4], [4.5, 5.1], [3.8, 3.75], [2.6, 3.6], [1.3, 3.45], [0.1, 3.7], [-1.2, 3.45], [-2.5, 3.65],
    [-3.8, 3.6], [-4.5, 5.1], [-4.6, 7.4], [-4.4, 9.2]],
  pul: [[-2.25, 22.3], [-2.5, 19.8], [-2.75, 17], [-2.88, 14.6], [-2.9, 12.2], [-2.45, 10.3], [-2.4, 8.4], [-2.0, 6.6], [-1.4, 7.25], [0, 7.3], [1.4, 7.25], [2.0, 6.6],
    [2.4, 8.4], [2.5, 10.3], [3.0, 12.2], [3.05, 14.6], [3.0, 17], [2.9, 19.5], [2.62, 21.8], [2.45, 19.5], [2.5, 17], [2.55, 14.6], [2.45, 12.2], [1.75, 10.6], [0, 10.25],
    [-1.75, 10.6], [-2.4, 12.2], [-2.38, 14.6], [-2.28, 17], [-2.18, 19.8]],
};
/* the four teeth: shape, axis (film mm), size */
const TEETH = [[PM, 0.88, 0.92], [PM, 7.6, 1], [MO, 16.7, 1], [MO, 27.6, 0.94]];
/* a closed Catmull-Rom curve as one cubic and then smooth cubics (exact: its tangents are symmetric), relative, 1 px */
const r1 = (v) => Math.round(v), num = (v) => String(r1(v));
const nums = (a) => a.map((v, i) => (i && r1(v) >= 0 ? " " : "") + num(v)).join("");
function csmooth(pts) {
  const n = pts.length, Q = pts.map((p) => [r1(p[0]), r1(p[1])]);
  let d = "M" + nums(Q[0]);
  for (let i = 0; i < n; i++) {
    const p0 = Q[(i - 1 + n) % n], p1 = Q[i], p2 = Q[(i + 1) % n], p3 = Q[(i + 2) % n];
    const c2 = [r1(p2[0] - (p3[0] - p1[0]) / 6) - p1[0], r1(p2[1] - (p3[1] - p1[1]) / 6) - p1[1]], e = [p2[0] - p1[0], p2[1] - p1[1]];
    d += i ? "s" + nums([...c2, ...e]) : "c" + nums([r1(p1[0] + (p2[0] - p0[0]) / 6) - p1[0], r1(p1[1] + (p2[1] - p0[1]) / 6) - p1[1], ...c2, ...e]);
  }
  return d + "z";
}
const local = (pts) => csmooth(pts.map((p) => [p[0] * K, (p[1] - CEJ) * K]));
const SHAPE = new Map([PM, MO].map((t) => [t, { out: local(t.out), ena: local(t.ena), pul: local(t.pul) }]));
const grp = (t, c, s, inner) => `<g transform="translate(${X(c)} ${Y(CEJ)}) scale(${-s} ${s})">${inner(SHAPE.get(t))}</g>`;
const teeth = (inner) => TEETH.map(([t, c, s]) => grp(t, c, s, inner)).join("");
/* a tooth's outline in film mm, for the marrow test */
const absPts = (t, c, s) => t.out.map((p) => [c + s * p[0], CEJ + s * (p[1] - CEJ)]);
function inPoly(x, y, P) { let a = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) a = !a; } return a; }

/* the crest is level (1.7 mm below the CEJs) except the vertical defect on the molar's mesial: its bony wall runs from
   the septum's crest beside the premolar down to the base on the molar's root, 5.5 mm deep and narrow */
const WALL = [[10.3, 11.6], [10.65, 12.6], [11.05, 13.7], [11.45, 14.9], [11.88, 16.0], [12.25, 16.8], [12.55, 17.2]];
const CREST = 11.2;
const P = (pts) => pts.map((p, i) => (i ? "L" : "M") + X(p[0]) + " " + Y(p[1])).join("") + "Z";
const soft = P([[-1, -1], [33, -1], [33, CREST], [13.6, CREST], [12.8, 17.35], ...WALL.slice().reverse(), [10.1, CREST], [-1, CREST]]);
/* the new bone at 6 months: the defect filled to 12.75 mm (about 80 percent), its root side tucked under the root */
const lerpWall = (y) => { for (let i = 1; i < WALL.length; i++) if (y <= WALL[i][1]) { const a = WALL[i - 1], b = WALL[i], t = (y - a[1]) / (b[1] - a[1]); return [a[0] + (b[0] - a[0]) * t, y]; } };
const FILL_TOP = 12.75, wallUp = WALL.filter((p) => p[1] > FILL_TOP).reverse();
const fill = P([...wallUp, lerpWall(FILL_TOP), [11.4, 12.9], [12.0, 13.0], [12.9, 13.0], [13.0, 17.35], [12.8, 17.35]]);
/* the molar's mesial root surface (film mm), so the subtraction image's gain stops at the root */
const ROOT = [[12.16, 13.0], [12.2, 14], [12.3, 15], [12.4, 16], [12.5, 17]];
const gain = P([...wallUp, lerpWall(FILL_TOP), [11.4, 12.9], [12.0, 13.0], ...ROOT]);
const defect = P([...WALL, [12.5, 17], [12.4, 16], [12.3, 15], [12.2, 14], [12.12, 12.5], [12.1, 11.6]]);

/* marrow spaces: short round-capped strokes, horizontal-ish as in the mandible, only in bone (off the roots, the
   defect and the crest) */
function marrow() {
  let s = 11, a = "", b = "", n = 0;
  const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const polys = TEETH.map(([t, c, sz]) => absPts(t, c, sz));
  const clear = (x, y) => { for (const [dx, dy] of [[0, 0], [.6, 0], [-.6, 0], [0, .6], [0, -.6], [.45, .45], [-.45, .45], [.45, -.45], [-.45, -.45]]) for (const q of polys) if (inPoly(x + dx, y + dy, q)) return false; return true; };
  for (let i = 0; i < 4000 && n < 84; i++) {
    const x = 1.4 + r() * 29.2, y = 12.3 + r() * 13.5;
    if (x > 9.4 && x < 13.6 && y < 18.3) continue;
    if (!clear(x, y)) continue;
    const len = 0.12 + r() * 0.55, sl = (r() - 0.5) * 0.4, seg = `M${Math.round(X(x))} ${Math.round(Y(y))}l${Math.round(-len * K)} ${Math.round(sl * K)}`;
    if (r() < 0.45) a += seg; else b += seg; n++;
  }
  return `<path class="sb-mar sb-mar1" d="${a}"/><path class="sb-mar sb-mar2" d="${b}"/>`;
}

const FILM = `<rect class="sb-bone" x="${FX - 3}" y="${FY - 3}" width="${FW + 6}" height="${FH + 6}"/>${marrow()}`
  + teeth((t) => `<path class="sb-ld" d="${t.out}"/><path class="sb-pdl" d="${t.out}"/>`)
  + `<path class="sb-soft" d="${soft}"/>`
  + teeth((t) => `<path class="sb-den" d="${t.out}"/><path class="sb-ena" d="${t.ena}"/><path class="sb-pul" d="${t.pul}"/>`)
  + `<circle class="sb-dimple" cx="${FX + 10}" cy="${FY + 10}" r="2.2"/>`;

/* labels: a column to the right of the film, one set per step; leaders end on a dot on the part */
const T = { def: [X(11.35), Y(14.3)], fill: [X(11.55), Y(15.3)], bone: [X(4.2), Y(18.5)], tooth: [X(7.6), Y(5.2)] };
const LX = 272;
function lab(y, lines, to) {
  const t = lines.split("|").map((s, i) => `<tspan x="${LX}" dy="${i ? 14 : 0}">${s}</tspan>`).join("");
  const d = `M${LX - 4} ${y - 4}L${T[to][0]} ${T[to][1]}`;
  return `<path class="sb-halo" d="${d}"/><path class="sb-lead" d="${d}"/><circle class="sb-ldot" cx="${T[to][0]}" cy="${T[to][1]}" r="2.4"/><text class="sb-t sb-lab" x="${LX}" y="${y}">${t}</text>`;
}
const HEAD = ["Film 1: presurgical", "Film 2: 6 months, taken the same way", "Film 1, inverted", "Film 2 + inverted film 1, half strength each", "Subtraction: film 2 minus film 1"];
const LABS = [
  lab(124, "intrabony|defect: bone|lost, dark", "def") + lab(186, "bone: light", "bone"),
  lab(56, "teeth, bone:|unchanged", "tooth") + lab(130, "bone has|filled in", "fill"),
  lab(130, "defect now|bright", "def") + lab(186, "bone now|dark", "bone"),
  lab(56, "same on both|films: gray", "tooth") + lab(130, "what changed|is left", "fill"),
  lab(56, "no change:|even gray", "tooth") + lab(130, "bone gained|lights up", "fill"),
];
const keys = LABS.map((l, i) => `<g class="sb-k sb-k${i}"><text class="sb-t sb-head" x="${FX}" y="16">${HEAD[i]}</text>${l}</g>`).join("")
  + `<g class="sb-k sb-k4"><rect class="sb-sw sb-sw0" x="${FX}" y="256" width="11" height="11" rx="2"/><text class="sb-t" x="${FX + 16}" y="265">no change</text>`
  + `<rect class="sb-sw sb-sw1" x="${FX + 104}" y="256" width="11" height="11" rx="2"/><text class="sb-t" x="${FX + 120}" y="265">bone gained</text>`
  + `<rect class="sb-sw sb-sw2" x="${FX + 222}" y="256" width="11" height="11" rx="2"/><text class="sb-t" x="${FX + 238}" y="265">bone lost</text></g>`;

/* the subtraction image: an even gray, the gain bright (tinted green as on the class slide); the dashed outline only
   marks where the teeth are */
const SUB = `<g class="sb-S"><rect class="sb-gray" x="${FX - 3}" y="${FY - 3}" width="${FW + 6}" height="${FH + 6}"/><path class="sb-gain" d="${gain}"/>`
  + `<g class="sb-orient">${teeth((t) => `<path d="${t.out}"/>`)}</g></g>`;
const r5 = 5, frame = `M0 0H${W}V${H}H0ZM${FX + r5} ${FY}H${FX + FW - r5}A${r5} ${r5} 0 0 1 ${FX + FW} ${FY + r5}V${FY + FH - r5}A${r5} ${r5} 0 0 1 ${FX + FW - r5} ${FY + FH}H${FX + r5}A${r5} ${r5} 0 0 1 ${FX} ${FY + FH - r5}V${FY + r5}A${r5} ${r5} 0 0 1 ${FX + r5} ${FY}Z`;

const INFO = {
  film: "Two standardized periapical films of the same site, taken at different times: standardized means taken the same way each time, so every tooth and every bit of bone lands in the same place on both. Each is still a flat, 2-D picture.",
  teeth: "The teeth didn't change between the films, so once one film is inverted and laid over the other they cancel to an even gray: enamel, dentin, root canals and all.",
  defect: "The intrabony defect beside the molar's mesial root: dark before surgery, where bone was lost, and mostly filled with bone at 6 months. That difference is all the subtraction image keeps. It shows bone fill, not attachment (only histology shows new cementum and PDL), and the defect's walls are counted at surgery, not on a film.",
};
const D = {
  SUM: [
    "Film 1, the presurgical radiograph: a vertical (intrabony) defect beside the molar's mesial root. Bone shows light; the defect, where bone was lost, shows dark.",
    "Film 2, 6 months after regenerative surgery (in Dr. Geurs's study, a bioresorbable membrane), taken the same way so everything lands in the same place. Flip back to film 1: only the defect has changed, filled with bone.",
    "Subtraction starts by inverting one film. Film 1 inverted, like a negative: light becomes dark and dark becomes light, so the bone is dark now and the defect bright.",
    "Then the inverted film 1 is laid over film 2. Wherever the two films are the same (the teeth, the pattern of the bone), light and dark cancel to an even gray. Only what changed is left: the bone gained, a little lighter than the gray.",
    "The subtraction image: everything that stayed the same is one even gray, and the bone gained between the presurgical film and the one at 6 months lights up (bone lost would show darker). It shows bone change on a flat film, not attachment: only histology proves regeneration.",
  ],
  RD: ["film 1 · presurgical", "film 2 · 6 months", "film 1 · inverted", "overlay", "subtraction image"],
};

const svg = figureSvg({ width: W, height: H, className: "sb-svg", label: "Drawn radiographs of a vertical defect on a lower molar, before surgery and at 6 months, and their subtraction: the inverted presurgical film over the 6-month film cancels what stayed the same to gray, leaving only the bone gained, bright.",
  body: `<g class="sb-L sb-A">${FILM}</g><g class="sb-hide"><path class="sb-fill" d="${fill}"/></g>${SUB}<path class="sb-frame" d="${frame}"/>`
    + `<rect class="sb-edge" x="${FX}" y="${FY}" width="${FW}" height="${FH}" rx="${r5}"/>`
    + `<g class="hot" data-info="${INFO.film}"><rect class="sb-hit" x="${FX}" y="${FY}" width="${FW}" height="${FH}"/></g>`
    + `<g class="hot" data-info="${INFO.teeth}">${teeth((t) => `<path class="sb-hit" d="${t.out}"/>`)}</g>`
    + `<g class="hot" data-info="${INFO.defect}"><path class="sb-hit" d="${defect}"/></g>${keys}` });
const plate = plateHtml({ fig: "S6 · Fig 5", title: "Subtraction radiography", hint: "step through · tap the film", readout: D.RD[0], body: `<div class="am-svg sb-box">${svg}</div>` });
const STEPS = ["Presurgical", "6 months", "Inverted", "Overlaid", "Subtraction"];
const controls = `<div class="am-controls" role="group" aria-label="Step">${STEPS.map((s, i) => `<button type="button" class="am-btn" data-sbs="${i}" aria-pressed="${i ? "false" : "true"}">${i + 1}. ${s}</button>`).join("")}</div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Tap the defect, a tooth or the bone.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From Dr. Geurs's class and the notes ("What can you achieve, and how do you know?"): two standardized radiographs from different times, one inverted and laid over the other, so what stayed the same cancels and only what changed shows. His study (Chaves, Geurs, Reddy and Jeffcoat, 1996: a bioresorbable membrane) lit up the bone gained between the presurgical film and the one at 6 months (green on his slide). Regeneration is evaluated by histology, clinical measurements and radiographs; only histology proves it.</li>
<li>Outside sources, for how it works: a reversed copy of one film laid over the other is the original, photographic subtraction (Ziedses des Plantes, 1935). Webber, Ruttimann and Gröndahl ("X-ray image subtraction as a basis for assessment of periodontal changes", J Periodontal Res 1982) and Gröndahl, Gröndahl and Webber ("A digital subtraction technique for dental radiography", Oral Surg Oral Med Oral Pathol 1983) did it digitally, pixel by pixel: no change an even gray, a gain brighter, a loss darker. They also give the reason the films are standardized (context; the class didn't go into it): a difference in projection geometry or exposure between the two films shows up as a false change.</li>
<li>Drawn films, not real ones: a lower second premolar and first molar; the defect's depth and how much fills by 6 months are illustrative. The overlay step is exact (half of each film); the subtraction step turns up its contrast. A real subtraction image is grainier, with faint edges where the films don't match perfectly. The dashed outline only marks the teeth. Educational, not medical advice.</li></ul></details>`;

function sbLive(root, D) {
  var svg = root.querySelector(".sb-svg"), A = svg.querySelector(".sb-A"), sum = root.querySelector(".am-summary"), info = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]");
  /* film 2 = film 1 plus the new bone; the inverted film 1 is the same markup, its grays complemented in the CSS */
  var B = A.cloneNode(true), I = A.cloneNode(true), soft = B.querySelector(".sb-soft");
  B.setAttribute("class", "sb-L sb-B"); I.setAttribute("class", "sb-L sb-I");
  soft.parentNode.insertBefore(svg.querySelector(".sb-fill"), soft.nextSibling);
  A.parentNode.insertBefore(B, A.nextSibling); A.parentNode.insertBefore(I, B.nextSibling);
  var btns = root.querySelectorAll("[data-sbs]");
  function set(i) {
    svg.setAttribute("data-st", String(i)); sum.textContent = D.SUM[i]; if (readout) readout.textContent = D.RD[i];
    for (var k = 0; k < btns.length; k++) btns[k].setAttribute("aria-pressed", String(+btns[k].getAttribute("data-sbs") === i));
  }
  for (var k = 0; k < btns.length; k++) btns[k].addEventListener("click", function () { set(+this.getAttribute("data-sbs")); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && svg.contains(el)) info.textContent = el.getAttribute("data-info"); }
  svg.addEventListener("pointerover", hot); svg.addEventListener("click", hot);
  set(0);
}

/* the film's grays and their complements (255 - v): fixed in both themes, since a film is dark in both */
const G = { bone: 140, mar: 121, ld: 168, pdl: 82, soft: 46, den: 185, ena: 228, pul: 95, dim: 190 };
const hex = (v) => "#" + v.toString(16).padStart(2, "0").repeat(3);
const film = (sel, f) => Object.entries({ bone: "fill", mar: "stroke", ld: "stroke", pdl: "stroke", soft: "fill", den: "fill", ena: "fill", pul: "fill", dim: "fill" })
  .map(([k, p]) => `.anima .sb-svg ${sel}.sb-${k === "dim" ? "dimple" : k}{${p}:${hex(f(G[k]))}}`).join("\n");
const CSS = `
.anima .sb-box{max-width:540px;margin:0 auto}
.anima .sb-svg path,.anima .sb-svg circle{vector-effect:none}
.anima .sb-svg .sb-hide{display:none}
.anima .sb-svg .sb-mar,.anima .sb-svg .sb-ld,.anima .sb-svg .sb-pdl{fill:none;stroke-linecap:round;stroke-linejoin:round}
.anima .sb-svg .sb-mar1{stroke-width:3}.anima .sb-svg .sb-mar2{stroke-width:2}
.anima .sb-svg .sb-ld{stroke-width:5.2}.anima .sb-svg .sb-pdl{stroke-width:2.9}
${film("", (v) => v)}
${film(".sb-I ", (v) => 255 - v)}
.anima .sb-svg .sb-fill{fill:#7c7c7c}
.anima .sb-svg .sb-gray{fill:#808080}
.anima .sb-svg .sb-gain{fill:#d6f2dd}
.anima .sb-svg .sb-orient path{fill:none;stroke:#f2f2f2;stroke-opacity:.5;stroke-width:1;stroke-dasharray:3 3}
.anima .sb-svg .sb-B,.anima .sb-svg .sb-I,.anima .sb-svg .sb-S{opacity:0;transition:opacity .9s ease}
.anima .sb-svg[data-st="1"] .sb-B,.anima .sb-svg[data-st="2"] .sb-B,.anima .sb-svg[data-st="3"] .sb-B,.anima .sb-svg[data-st="4"] .sb-B,.anima .sb-svg[data-st="2"] .sb-I,.anima .sb-svg[data-st="4"] .sb-S{opacity:1}
.anima .sb-svg[data-st="3"] .sb-I,.anima .sb-svg[data-st="4"] .sb-I{opacity:.5}
.anima .sb-svg .sb-frame{fill:var(--surface);fill-rule:evenodd}
.anima .sb-svg .sb-edge{fill:none;stroke:var(--anatomy-lo);stroke-width:1}
.anima .sb-svg .sb-hit{fill:transparent}
.anima .sb-svg .sb-k{display:none;pointer-events:none}
.anima .sb-svg[data-st="0"] .sb-k0,.anima .sb-svg[data-st="1"] .sb-k1,.anima .sb-svg[data-st="2"] .sb-k2,.anima .sb-svg[data-st="3"] .sb-k3,.anima .sb-svg[data-st="4"] .sb-k4{display:inline}
.anima .sb-svg .sb-t{fill:var(--anatomy-text);font:12px var(--anatomy-mono)}
.anima .sb-svg .sb-lab{fill:var(--anatomy-strong);font-weight:600;font-size:12.5px}
.anima .sb-svg .sb-head{fill:var(--anatomy-strong);font-weight:600}
.anima .sb-svg .sb-halo{fill:none;stroke:var(--sb-halo);stroke-width:3.2;stroke-linecap:round}
.anima .sb-svg .sb-lead{fill:none;stroke:var(--sb-lead);stroke-width:1.1;stroke-linecap:round}
.anima .sb-svg .sb-ldot{fill:var(--sb-lead);stroke:var(--sb-halo);stroke-width:1.2}
.anima .sb-svg .sb-sw{stroke:var(--anatomy-mid);stroke-width:1}
.anima .sb-svg .sb-sw0{fill:#808080}.anima .sb-svg .sb-sw1{fill:#d6f2dd}.anima .sb-svg .sb-sw2{fill:#383838}
@media (prefers-reduced-motion: reduce){.anima .sb-svg .sb-B,.anima .sb-svg .sb-I,.anima .sb-svg .sb-S{transition:none}}
.anima[data-anima="subtr"]{--sb-lead:#fbfbfb;--sb-halo:rgba(20,16,18,.78)}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]) .anima[data-anima="subtr"]{--sb-lead:#f6f6f6;--sb-halo:rgba(0,0,0,.85)} }
:root[data-theme="dark"] .anima[data-anima="subtr"]{--sb-lead:#f6f6f6;--sb-halo:rgba(0,0,0,.85)}
`;

export function subtr() {
  return { id: "subtr", lec: "periodontal-regeneration", title: "Subtraction radiography",
    caption: "Two standardized films of the same intrabony defect, before surgery and at 6 months. Invert one and lay it over the other, and everything that stayed the same cancels to gray: only the bone gained shows. From Dr. Geurs's class and the notes.",
    html: `<div class="anima" data-anima="subtr">${plate}${controls}${SOURCES}</div>`, css: CSS, live: sbLive.toString(), helpers: [], data: D };
}
