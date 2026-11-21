// Fig: a block of thin skin (MSK Exam 4, L28 Histology of Skin), for the in-class review picture question rv-gland.
// Drawn from the hub's L28 notes: epidermis over dermal papillae, papillary and reticular dermis, hypodermis (fat);
// a hair follicle with its sebaceous gland and arrector pili (follicle base to superficial dermis), an eccrine
// (merocrine) sweat gland coiled deep in the dermis whose duct opens at a surface pore, the subpapillary and deep
// vascular plexuses with capillary loops in the papillae, and a Pacinian corpuscle (deep dermis / hypodermis).
// Schematic: layer thicknesses are not to scale (the notes give epidermis ≪ dermis 1.5-4 mm).
import { fitProjection, iso, figureSvg, plateHtml, f1, esc } from "./shared.mjs";

const W = 600, H = 380;
const BW = 300, BD = 90;                    // block width (x) and depth (y), schematic units
const Z = { corn: -2.6, epi: -10, pap: -38, ret: -132, hyp: -190 };
const P = fitProjection([[0, 0, 0], [BW, 0, 0], [0, BD, 0], [BW, BD, 0], [0, BD, Z.hyp], [BW, BD, Z.hyp], [BW, 0, Z.hyp], [150, BD, 46]], W - 130, H, { pad: 14, azimuth: 66, elevation: 22 });
const pt = (x, y, z) => iso([x, y, z], P).map(f1);
const F = (x, z) => pt(x, BD, z);            // front cut face
const R = (y, z) => pt(BW, y, z);            // right cut face
const T = (x, y) => pt(x, y, 0);             // skin surface
const K = Math.hypot(F(1, 0)[0] - F(0, 0)[0], F(1, 0)[1] - F(0, 0)[1]); // screen px per world unit along x
const M = (p) => `M${p[0]} ${p[1]}`, L = (p) => `L${p[0]} ${p[1]}`;
const poly = (pts) => pts.map((p, i) => (i ? L(p) : M(p))).join("") + "Z";
const open = (pts) => pts.map((p, i) => (i ? L(p) : M(p))).join("");
const range = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);

// Dermal papillae: the epidermis' lower edge rises and dips (rete ridges between papillae).
const PAPW = 25;
const epiZ = (x) => Z.epi - 7 * (0.5 - 0.5 * Math.cos((2 * Math.PI * x) / PAPW)) ** 1.6;
const epiLine = range(0, BW, 360).map((x) => [x, epiZ(x)]);

// ---- right face (x = BW): layer bands, fat cells, the cut plexus vessels
const rf = (z0f, z1f, cls) => `<path class="${cls}" d="${poly([R(0, z0f), R(BD, z0f), R(BD, z1f), R(0, z1f)])}"/>`;
const rightFace = [
  rf(0, Z.epi - 3, "sk-epi"),
  rf(Z.epi - 3, Z.pap, "sk-pap"),
  rf(Z.pap, Z.ret, "sk-ret"),
  rf(Z.ret, Z.hyp, "sk-hyp"),
  `<path class="sk-shade" d="${poly([R(0, 0), R(BD, 0), R(BD, Z.hyp), R(0, Z.hyp)])}"/>`,
  ...[[18, Z.ret + 2], [70, Z.ret + 4]].flatMap(([y, z]) => [`<ellipse class="sk-art" cx="${R(y, z)[0]}" cy="${R(y, z)[1]}" rx="${f1(2.2 * K * 0.5)}" ry="${f1(2.2 * K)}"/>`, `<ellipse class="sk-vein" cx="${R(y + 8, z)[0]}" cy="${R(y + 8, z)[1]}" rx="${f1(2.6 * K * 0.5)}" ry="${f1(2.6 * K)}"/>`]),
  fatCells((y, z) => R(y, z), BD, Z.ret - 3, Z.hyp, 0.48, "rf"),
  `<path class="sk-edge" d="${poly([R(0, 0), R(BD, 0), R(BD, Z.hyp), R(0, Z.hyp)])}"/>`,
].join("");

// Fat cells: a packed field of rounded polygons (closed shapes, so no loose line ends), on a face given by map(u, z).
function fatCells(map, U, zTop, zBot, squash, seed) {
  let out = "", row = 0, r = 7.2;
  for (let z = zTop - r; z > zBot + r * 0.7; z -= r * 1.62, row++) {
    for (let u = (row % 2 ? r * 1.0 : r * 0.05) + 1.5; u < U - r * 0.6; u += r * 1.9) {
      const j = Math.sin((u * 12.9898 + z * 78.233 + seed.length) * 0.37) * 0.9;
      const pts = range(0, 2 * Math.PI, 9).slice(0, 9).map((a) => map(u + Math.cos(a) * (r - 0.9 + j * 0.3), z + Math.sin(a) * (r - 1.2)));
      out += `<path class="sk-fat" d="${poly(pts)}"/>`;
      if (((u * 7 + row * 3) | 0) % 3 === 0) { const n = map(u + r * 0.55, z - r * 0.45); out += `<circle class="sk-nuc" cx="${n[0]}" cy="${n[1]}" r="1"/>`; }
    }
  }
  return `<g class="sk-fatfield">${out}</g>`;
}

// ---- top face: the skin surface with fine furrows, pores and hairs
const furrows = [[0.22, 0.95], [0.55, 0.25], [0.9, 0.6]].map(([a, b]) => `<path class="sk-furrow" d="${open(range(0, 1, 16).map((t) => { const x = t * BW, y = BD * (a + (b - a) * t) + 2.5 * Math.sin(t * 9); return T(x, Math.max(0, Math.min(BD, y))); }))}"/>`).join("");
const pores = [[60, 30], [175, 22], [262, 52], [130, 62]].map(([x, y]) => { const c = T(x, y); return `<ellipse class="sk-pore" cx="${c[0]}" cy="${c[1]}" rx="1.9" ry="1.1"/>`; }).join("");
function hairAt(x, y, lean, len) {
  const pts = range(0, 1, 10).map((t) => pt(x + lean * len * t, y - 0.12 * len * t, len * (t - 0.18 * t * t)));
  const b = T(x, y);
  return `<g class="sk-hair"><ellipse class="sk-pore" cx="${b[0]}" cy="${b[1]}" rx="2.4" ry="1.3"/><path class="sk-shaft-o" d="${open(pts)}"/><path class="sk-shaft" d="${open(pts)}"/></g>`;
}
const topFace = [
  `<path class="sk-top" d="${poly([T(0, 0), T(BW, 0), T(BW, BD), T(0, BD)])}"/>`,
  furrows, pores,
  hairAt(35, 20, 0.45, 34), hairAt(205, 45, 0.5, 30), hairAt(270, 15, 0.4, 26),
  `<path class="sk-edge" d="${poly([T(0, 0), T(BW, 0), T(BW, BD), T(0, BD)])}"/>`,
].join("");

// ---- front face (y = BD): the cut through every structure
const frontOutline = poly([F(0, 0), F(BW, 0), F(BW, Z.hyp), F(0, Z.hyp)]);
const band = (topPts, botPts, cls) => `<path class="${cls}" d="${poly([...topPts.map(([x, z]) => F(x, z)), ...botPts.slice().reverse().map(([x, z]) => F(x, z))])}"/>`;
const flat = (z) => [[0, z], [BW, z]];
const layers = [
  band(flat(0), epiLine, "sk-epi"),
  band(epiLine, flat(Z.pap), "sk-pap"),
  band(flat(Z.pap), flat(Z.ret), "sk-ret"),
  band(flat(Z.ret), flat(Z.hyp), "sk-hyp"),
  `<path class="sk-corn" d="${open([F(0, Z.corn), F(BW, Z.corn)])}"/>`,
  `<path class="sk-basal" d="${open(epiLine.map(([x, z]) => F(x, z)))}"/>`,
].join("");

// Collagen bundles in the reticular dermis: closed spindles, coarse and wavy.
const collagen = (() => {
  let out = "";
  for (let i = 0; i < 46; i++) {
    const x = 8 + ((i * 53.7) % (BW - 16)), z = Z.pap - 8 - ((i * 37.3) % (Z.pap - Z.ret - 16));
    const a = Math.sin(i * 1.7) * 0.35, l = 9 + (i % 4) * 2.5, w = 1.1 + (i % 3) * 0.35;
    const c = [Math.cos(a), Math.sin(a)], n = [-c[1], c[0]];
    const pts = [...range(-1, 1, 6).map((t) => [x + c[0] * l * t + n[0] * w * (1 - t * t), z + c[1] * l * t + n[1] * w * (1 - t * t)]),
      ...range(1, -1, 6).map((t) => [x + c[0] * l * t - n[0] * w * (1 - t * t), z + c[1] * l * t - n[1] * w * (1 - t * t)])];
    out += `<path class="sk-col" d="${poly(pts.map(([u, v]) => F(u, v)))}"/>`;
  }
  return `<g clip-path="url(#sk-retclip)">${out}</g>`;
})();
const fatFront = `<g clip-path="url(#sk-hypclip)">${fatCells((x, z) => F(x, z), BW, Z.ret - 3, Z.hyp, 1, "front")}</g>`;

// Tubes (vessels, ducts, the gland coil): an outline stroke then a fill stroke, in short segments so a tube that
// crosses itself shows which loop is in front. Interior joints are butt-capped; only real ends are round.
function tube(pts, w, cls, seg = 0) {
  const scr = pts.map(([x, z]) => F(x, z));
  if (!seg) return `<g class="${cls}"><path class="tb-o" style="stroke-width:${f1(w * K + 1.8)}" d="${open(scr)}"/><path class="tb-i" style="stroke-width:${f1(w * K)}" d="${open(scr)}"/></g>`;
  let out = "";
  for (let i = 0; i < scr.length - 1; i += seg) {
    const part = scr.slice(i, Math.min(scr.length, i + seg + 1));
    const cap = `stroke-linecap:${i === 0 || i + seg >= scr.length - 1 ? "round" : "butt"}`;
    // the fill starts a point early so it covers the joint (no hairline seam where two segments meet)
    const fill = scr.slice(Math.max(0, i - 1), Math.min(scr.length, i + seg + 1));
    out += `<path class="tb-o" style="stroke-width:${f1(w * K + 1.8)};${cap}" d="${open(part)}"/><path class="tb-i" style="stroke-width:${f1(w * K)};${cap}" d="${open(fill)}"/>`;
  }
  return `<g class="${cls}">${out}</g>`;
}

// Vessels: deep plexus at the dermis-hypodermis border, subpapillary plexus, ascending links, capillary loops.
const papX = Array.from({ length: Math.floor(BW / PAPW) - 1 }, (_, i) => (i + 1) * PAPW);
const SUB = Z.pap + 7;
const vessels = [
  tube([[0, Z.ret - 2], [BW, Z.ret - 3]], 2.4, "sk-art"),
  tube([[0, Z.ret + 4], [BW, Z.ret + 3.5]], 2.8, "sk-vein"),
  tube([[0, SUB - 1.5], [BW, SUB - 1.5]], 1.3, "sk-art"),
  tube([[0, SUB + 2.2], [BW, SUB + 2.2]], 1.5, "sk-vein"),
  tube([[150, Z.ret - 2], [152, (Z.ret + SUB) / 2], [156, SUB - 1.5]], 1.4, "sk-art"),
  tube([[284, Z.ret + 4], [282, (Z.ret + SUB) / 2], [279, SUB + 2.2]], 1.6, "sk-vein"),
  ...papX.filter((x) => Math.abs(x - 112) > 14 && Math.abs(x - 218) > 12).map((x) => {
    const top = epiZ(x) - 2.2;
    return tube([[x - 2.2, SUB - 1.5], [x - 2.2, top + 2], [x - 1.2, top + 0.3], [x + 1.2, top + 0.3], [x + 2.2, top + 2], [x + 2.2, SUB + 2.2]], 0.8, "sk-cap");
  }),
].join("");

// Hair follicle: bulb in the deep dermis, leaning so the hair exits at the surface toward the right.
const FB = [88, -113], FT = [112, 0];
const fd = [FT[0] - FB[0], FT[1] - FB[1]], fl = Math.hypot(...fd), fu = [fd[0] / fl, fd[1] / fl], fn = [-fu[1], fu[0]];
const along = (t, o = 0) => [FB[0] + fd[0] * t + fn[0] * o, FB[1] + fd[1] * t + fn[1] * o];
const follicleSheath = poly([...range(0.06, 1, 14).map((t) => along(t, -7)), ...range(1, 0.06, 14).map((t) => along(t, 7))].map(([x, z]) => F(x, z)));
const bulb = range(0, 2 * Math.PI, 28).slice(0, 28).map((a) => along(0.05 + Math.sin(a) * 0.075, Math.cos(a) * 10.5));
const papilla = [along(-0.02, -4.5), along(0.03, -3.2), along(0.075, -1.8), along(0.085, 0), along(0.075, 1.8), along(0.03, 3.2), along(-0.02, 4.5)];
const shaft = [...range(0.09, 1, 10).map((t) => along(t, -2)), ...range(1, 0.09, 10).map((t) => along(t, 2))];
const hairOut = (() => { const top = F(...FT); const pts = range(0, 1, 10).map((t) => pt(FT[0] + 16 * t, BD + 4 * t, 44 * (t - 0.15 * t * t))); return pts; })();
const follicle = [
  // the connective-tissue sheath and outer root sheath, unioned with the bulb (outline pass, then fill pass)
  `<path class="sk-fol-o" d="${follicleSheath}"/><path class="sk-fol-o" d="${poly(bulb.map(([x, z]) => F(x, z)))}"/>`,
  `<path class="sk-fol" d="${follicleSheath}"/><path class="sk-fol" d="${poly(bulb.map(([x, z]) => F(x, z)))}"/>`,
  `<path class="sk-fpap" d="${poly(papilla.map(([x, z]) => F(x, z)))}"/>`,
  `<path class="sk-shaftcut" d="${poly(shaft.map(([x, z]) => F(x, z)))}"/>`,
  tube([along(-0.02, 0), along(0.05, 0)], 0.7, "sk-cap"),
].join("");
const hairAbove = `<g class="sk-hair"><path class="sk-shaft-o" d="${open(hairOut)}"/><path class="sk-shaft" d="${open(hairOut)}"/></g>`;

// Sebaceous gland: lobules on the follicle's left (obtuse) side, short duct into the follicle's upper third.
const SG = [along(0.69, 17), along(0.6, 21), along(0.75, 25)];
const sebLobes = [[SG[0], 8.2], [SG[1], 7], [SG[2], 6.2]];
const circle = ([x, z], r, n = 18) => poly(range(0, 2 * Math.PI, n).slice(0, n).map((a) => F(x + Math.cos(a) * r, z + Math.sin(a) * r)));
const sebaceous = [
  sebLobes.map(([c, r]) => `<path class="sk-seb-o" d="${circle(c, r)}"/>`).join(""),
  `<path class="sk-seb-o" d="${poly([along(0.69, 12), along(0.74, 12), along(0.745, 6.8), along(0.695, 6.8)].map(([x, z]) => F(x, z)))}"/>`,
  sebLobes.map(([c, r]) => `<path class="sk-seb" d="${circle(c, r)}"/>`).join(""),
  `<path class="sk-seb" d="${poly([along(0.69, 12), along(0.74, 12), along(0.745, 6.8), along(0.695, 6.8)].map(([x, z]) => F(x, z)))}"/>`,
  sebLobes.flatMap(([c, r]) => range(0, 2 * Math.PI, 5).slice(0, 5).map((a) => { const p = F(c[0] + Math.cos(a + r) * r * 0.5, c[1] + Math.sin(a + r) * r * 0.5); return `<circle class="sk-sebcell" cx="${p[0]}" cy="${p[1]}" r="1.1"/>`; })).join(""),
].join("");

// Arrector pili: smooth muscle from the follicle below the gland up to the papillary dermis.
const AP0 = along(0.5, 6.5), AP1 = [44, Z.pap + 14];
const apd = [AP1[0] - AP0[0], AP1[1] - AP0[1]], apl = Math.hypot(...apd), apn = [-apd[1] / apl, apd[0] / apl];
const apPts = [...range(0, 1, 8).map((t) => { const w = 2.6 * Math.sin(Math.PI * (0.15 + 0.7 * t)); return [AP0[0] + apd[0] * t + apn[0] * w, AP0[1] + apd[1] * t + apn[1] * w]; }),
  ...range(1, 0, 8).map((t) => { const w = 2.6 * Math.sin(Math.PI * (0.15 + 0.7 * t)); return [AP0[0] + apd[0] * t - apn[0] * w, AP0[1] + apd[1] * t - apn[1] * w]; })];
const arrector = `<path class="sk-ap" d="${poly(apPts.map(([x, z]) => F(x, z)))}"/>` + [0.3, 0.5, 0.7].map((t) => { const c = F(AP0[0] + apd[0] * t, AP0[1] + apd[1] * t); return `<ellipse class="sk-apnuc" cx="${c[0]}" cy="${c[1]}" rx="2.2" ry=".8" transform="rotate(${f1((Math.atan2(F(...AP1)[1] - F(...AP0)[1], F(...AP1)[0] - F(...AP0)[0]) * 180) / Math.PI)} ${c[0]} ${c[1]})"/>`; }).join("");

// Eccrine (merocrine) sweat gland: a coiled secretory tube deep in the dermis, a straight duct up through the dermis,
// a corkscrew through the epidermis, and a pore at the surface.
const EC = [206, -112];
const coil = range(0, 1, 160).map((s) => { const t = s * 6.6 * Math.PI; return [EC[0] + 15 * Math.sin(t) + 5.5 * Math.sin(2.3 * t + 0.6), EC[1] + 8.5 * Math.cos(1.21 * t) + 3.6 * Math.sin(3.1 * t)]; });
const cEnd = coil[coil.length - 1];
const duct = [cEnd, ...range(0, 1, 14).map((t) => [cEnd[0] + (220 - cEnd[0]) * (1 - (1 - t) ** 2) + 2.5 * Math.sin(t * 5), cEnd[1] + (epiZ(220) - 1 - cEnd[1]) * t]),
  ...range(0, 1, 18).map((t) => [221 + 3.4 * Math.sin(t * 3 * Math.PI), epiZ(220) - 1 + (Z.corn + 1 - (epiZ(220) - 1)) * t]), [221, -0.6]];
const eccrine = [tube(coil, 3.4, "sk-gl", 5), tube(duct, 1.7, "sk-duct")].join("");
const PORE = T(221, BD - 2);
const pore = `<ellipse class="sk-pore sk-pore-ec" cx="${PORE[0]}" cy="${PORE[1]}" rx="2.4" ry="1.3"/>`;

// Pacinian corpuscle in the hypodermis, with its nerve fiber running in from the block's left edge.
const PC = [52, -160];
const pacinian = [
  tube([[0, -174], [22, -170], [38, -164], [PC[0] - 9, PC[1] - 0.8]], 1.5, "sk-nerve"),
  ...[9, 7.2, 5.4, 3.6].map((r, i) => { const pts = range(0, 2 * Math.PI, 24).slice(0, 24).map((a) => F(PC[0] + Math.cos(a) * r * 1.7, PC[1] + Math.sin(a) * r)); return `<path class="sk-pc${i ? "" : " sk-pc-out"}" d="${poly(pts)}"/>`; }),
  `<path class="sk-pccore" d="${open([F(PC[0] - 9, PC[1] - 0.8), F(PC[0] + 4, PC[1] - 0.2)])}"/><circle class="sk-pcend" cx="${F(PC[0] + 4, PC[1] - 0.2)[0]}" cy="${F(PC[0] + 4, PC[1] - 0.2)[1]}" r="1.1"/>`,
].join("");

// Labels. Layer names sit on the right; the question's "1." tag points at the eccrine coil.
const layerTag = (z0, z1, name) => { const a = R(BD, z0), b = R(BD, z1), x = R(0, 0)[0] + 12; return `<g class="sk-layer"><path class="sk-brace" d="M${f1(a[0] + 5)} ${a[1]}H${f1(x - 4)}V${b[1]}H${f1(b[0] + 5)}"/><circle class="am-dot" cx="${f1(a[0] + 5)}" cy="${a[1]}" r="1.6"/><circle class="am-dot" cx="${f1(b[0] + 5)}" cy="${b[1]}" r="1.6"/><text class="sk-layer-t" x="${f1(x + 4)}" y="${f1((a[1] + b[1]) / 2 + 4)}">${name}</text></g>`; };
const layerTags = layerTag(0, Z.epi - 3, "Epidermis") + layerTag(Z.epi - 3 - 1, Z.ret + 1, "Dermis") + layerTag(Z.ret - 1, Z.hyp, "Hypodermis");
const Q1 = (() => { const a = F(EC[0] + 14, EC[1] + 2), t = F(252, EC[1] + 10); return `<g class="sk-q1"><path class="sk-q1-line" d="M${a[0]} ${a[1]}L${t[0]} ${f1(t[1])}"/><circle class="sk-q1-dot" cx="${a[0]}" cy="${a[1]}" r="2.2"/><rect class="sk-q1-tag" x="${t[0]}" y="${f1(t[1] - 10)}" width="26" height="20" rx="3"/><text class="sk-q1-t" x="${f1(t[0] + 13)}" y="${f1(t[1] + 4.5)}">1.</text></g>`; })();

const clipFront = (id, top, bot) => `<clipPath id="${id}"><path d="${poly([...top.map(([x, z]) => F(x, z)), ...bot.slice().reverse().map(([x, z]) => F(x, z))])}"/></clipPath>`;
const defs = `<defs><clipPath id="sk-frontclip"><path d="${frontOutline}"/></clipPath>${clipFront("sk-retclip", flat(Z.pap), flat(Z.ret))}${clipFront("sk-hypclip", flat(Z.ret), flat(Z.hyp))}</defs>`;
const halo = `<path class="iso-halo" d="${poly([pt(-6, -6, Z.hyp), pt(BW + 6, -6, Z.hyp), pt(BW + 6, BD + 6, Z.hyp), pt(-6, BD + 6, Z.hyp)])}"/>`;

const body = [
  defs, halo,
  `<g class="sk-rf">${rightFace}</g>`,
  `<g class="sk-tf">${topFace}</g>`,
  `<g class="sk-ff" clip-path="url(#sk-frontclip)">${layers}${collagen}${fatFront}${vessels}${pacinian}`,
  `<g class="hot" data-part="eccrine">${eccrine}</g>`,
  `<g class="hot" data-part="arrector">${arrector}</g>`,
  `<g class="hot" data-part="follicle">${follicle}</g>`,
  `<g class="hot" data-part="sebaceous">${sebaceous}</g>`,
  `</g><path class="sk-edge" d="${frontOutline}"/>`,
  pore, hairAbove,
  layerTags, Q1,
].join("");

const svgFig = figureSvg({ width: W, height: H, className: "sk-fig",
  label: "Schematic block of thin skin: epidermis over dermal papillae, papillary and reticular dermis, and fatty hypodermis. A hair follicle leans up to the surface with a sebaceous gland and an arrector pili muscle on one side; a coiled sweat gland deep in the dermis, marked 1, sends a duct that spirals through the epidermis to a pore on the surface; blood vessel plexuses and a Pacinian corpuscle are also shown.",
  body });

const plate = plateHtml({ fig: "Fig 1", title: "A block of skin", hint: "schematic, not to scale", readout: "L28", body: `<div class="am-svg">${svgFig}</div>` });

const CSS = `
.anima .sk-top{fill:var(--anatomy-shade-2);stroke:none}
.anima .sk-furrow{fill:none;stroke:var(--anatomy-faint);stroke-width:.8}
.anima .sk-pore{fill:var(--anatomy-shade-0);stroke:var(--anatomy-mid);stroke-width:.6}
.anima .sk-edge{fill:none;stroke:var(--anatomy-hi);stroke-width:1.1;stroke-linejoin:round}
.anima .sk-shade{fill:#000;opacity:.06}
.anima .sk-epi{fill:var(--anatomy-shade-1);stroke:none}
.anima .sk-corn{fill:none;stroke:var(--anatomy-mid);stroke-width:.7}
.anima .sk-basal{fill:none;stroke:var(--anatomy-hi);stroke-width:1.2}
.anima .sk-pap{fill:var(--anatomy-face);stroke:none}
.anima .sk-ret{fill:var(--anatomy-shade-3);stroke:none}
.anima .sk-hyp{fill:var(--anatomy-shade-2);stroke:none}
.anima .sk-col{fill:var(--anatomy-shade-1);stroke:var(--anatomy-lo);stroke-width:.5}
.anima .sk-fat{fill:color-mix(in srgb,var(--tag-amber,#d6a640) 14%,var(--anatomy-face));stroke:var(--anatomy-lo);stroke-width:.6}
.anima .sk-nuc{fill:var(--anatomy-mid)}
.anima .tb-o{fill:none;stroke:var(--anatomy-hi);stroke-linecap:round;stroke-linejoin:round}
.anima .tb-i{fill:none;stroke-linecap:round;stroke-linejoin:round}
.anima .sk-art .tb-i{stroke:color-mix(in srgb,var(--anatomy-red) 70%,var(--anatomy-face))}
.anima .sk-vein .tb-i{stroke:color-mix(in srgb,var(--anatomy-blue) 65%,var(--anatomy-face))}
.anima .sk-cap .tb-o{stroke:color-mix(in srgb,var(--anatomy-red) 60%,var(--anatomy-hi))}
.anima .sk-cap .tb-i{stroke:color-mix(in srgb,var(--anatomy-red) 45%,var(--anatomy-face))}
.anima ellipse.sk-art{fill:color-mix(in srgb,var(--anatomy-red) 70%,var(--anatomy-face));stroke:var(--anatomy-hi);stroke-width:.8}
.anima ellipse.sk-vein{fill:color-mix(in srgb,var(--anatomy-blue) 65%,var(--anatomy-face));stroke:var(--anatomy-hi);stroke-width:.8}
.anima .sk-nerve .tb-i{stroke:color-mix(in srgb,var(--tag-amber,#d6a640) 55%,var(--anatomy-face))}
.anima .sk-gl .tb-i{stroke:var(--anatomy-shade-0)}
.anima .sk-duct .tb-i{stroke:var(--anatomy-face)}
.anima .sk-fol-o{fill:none;stroke:var(--anatomy-hi);stroke-width:2.4;stroke-linejoin:round}
.anima .sk-fol{fill:var(--anatomy-shade-1);stroke:none}
.anima .sk-fpap{fill:var(--anatomy-face);stroke:var(--anatomy-hi);stroke-width:.8}
.anima .sk-shaftcut{fill:var(--anatomy-hi);stroke:var(--anatomy-hi);stroke-width:.6;opacity:.8}
.anima .sk-shaft-o{fill:none;stroke:var(--anatomy-hi);stroke-width:3.2;stroke-linecap:round}
.anima .sk-shaft{fill:none;stroke:var(--anatomy-mid);stroke-width:1.6;stroke-linecap:round}
.anima .sk-seb-o{fill:none;stroke:var(--anatomy-hi);stroke-width:2.2;stroke-linejoin:round}
.anima .sk-seb{fill:color-mix(in srgb,var(--tag-amber,#d6a640) 22%,var(--anatomy-face));stroke:none}
.anima .sk-sebcell{fill:var(--anatomy-mid)}
.anima .sk-ap{fill:color-mix(in srgb,var(--anatomy-red) 28%,var(--anatomy-shade-1));stroke:var(--anatomy-hi);stroke-width:.8}
.anima .sk-apnuc{fill:var(--anatomy-mid)}
.anima .sk-pc{fill:var(--anatomy-face);stroke:var(--anatomy-mid);stroke-width:.6}
.anima .sk-pc-out{stroke:var(--anatomy-hi);stroke-width:.9}
.anima .sk-pccore{fill:none;stroke:var(--anatomy-hi);stroke-width:1.1}
.anima .sk-pcend{fill:var(--anatomy-hi)}
.anima .sk-brace{fill:none;stroke:var(--anatomy-mid);stroke-width:.8}
.anima .sk-layer-t{fill:var(--anatomy-text);font:12px var(--anatomy-mono)}
.anima .sk-q1-line{fill:none;stroke:var(--anatomy-strong);stroke-width:1.2}
.anima .sk-q1-dot{fill:var(--anatomy-strong)}
.anima .sk-q1-tag{fill:var(--anatomy-lit);stroke:none}
.anima .sk-q1-t{fill:var(--anatomy-card);font:700 13px var(--anatomy-mono);text-anchor:middle}
`;

export function skin() {
  const narrow = (() => { const a = pt(0, BD, 0), b = F(BW, 0); return `${f1(Math.max(0, a[0] - 8))} 0 ${f1(W - Math.max(0, a[0] - 8))} ${H}`; })();
  return {
    id: "skin",
    title: "A block of skin",
    caption: "Schematic, not to scale; structures from the L28 (Histology of Skin) notes.",
    html: `<div class="anima" data-anima="skin">${plate}</div>`,
    css: CSS,
    live: (function skinLive(){}).toString(),
    data: { wide: `0 0 ${W} ${H}`, narrow },
    still: { svg: svgFig },
  };
}
