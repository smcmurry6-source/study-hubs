/* Hub emblems: one drawn object per hub, in Timmy's ink (style.mjs). viewBox 0 0 64 64, transparent ground: the page
   sets each on a disc of its hub's light tint, at 64 px on Home and about 28 px in a tab, so every one is a chunky
   silhouette first and detail second. No ids, gradients, filters, <text> or <style>.                                */
import { INK, C, TINTS } from "./style.mjs";

/* ink helpers: a filled shape with its outline, a bare line, a highlight, and a shape drawn in three layers
   (flat fill, a flat shade inside it, then the outline on top) */
const P = (d, fill, sw = 2.5) => `<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>`;
const F = (d, fill) => `<path d="${d}" fill="${fill}"/>`;
const O = (d, sw = 2.5) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>`;
const L = (d, sw = 1.5, color = INK, op = 1) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"${op < 1 ? ` opacity="${op}"` : ""}/>`;
const H = (d, w = 2) => `<path d="${d}" stroke="#fff" stroke-width="${w}" stroke-linecap="round" fill="none" opacity=".6"/>`;
const S = (d, fill, shade, shadeFill, sw = 2.5) => F(d, fill) + F(shade, shadeFill) + O(d, sw);
/* a rod: a wide ink stroke under a narrower colored one, so a handle or shank is outlined without a polygon */
const ROD = (d, w, color) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + 2.6}" stroke-linecap="round" stroke-linejoin="round"/>` +
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

/* Timmy's own molar outline (widget/pet.js TOOTH, 200-unit frame), scaled into place */
const TOOTH = "M48 86 C42 56 56 34 78 34 C90 34 94 44 100 44 C106 44 110 34 122 34 C144 34 158 56 152 86 C149 106 146 122 144 140 C142 166 138 192 130 210 C126 218 116 218 114 208 C111 190 108 172 100 168 C92 172 89 190 86 208 C84 218 74 218 70 210 C62 192 58 166 56 140 C54 122 51 106 48 86 Z";
function scaled(d, s, cx, top){
  const n = d.match(/-?\d+(\.\d+)?/g).map(Number); let i = 0;
  return d.replace(/-?\d+(\.\d+)?/g, () => { const v = n[i], isX = i % 2 === 0; i++; return (isX ? (v - 100) * s + cx : (v - 34) * s + top).toFixed(2).replace(/\.?0+$/, ""); });
}
function molar(s, cx, top){
  const d = scaled(TOOTH, s, cx, top), k = (x, y) => `${((x - 100) * s + cx).toFixed(1)} ${((y - 34) * s + top).toFixed(1)}`;
  /* shade: the right flank of the crown and the right root, away from the light */
  const shade = `M${k(132, 40)} C${k(146, 46)} ${k(154, 62)} ${k(152, 86)} C${k(149, 106)} ${k(146, 122)} ${k(144, 140)} C${k(142, 166)} ${k(138, 192)} ${k(130, 210)} C${k(126, 218)} ${k(118, 216)} ${k(116, 206)} C${k(130, 180)} ${k(136, 140)} ${k(138, 104)} C${k(140, 76)} ${k(138, 54)} ${k(132, 40)} Z`;
  return S(d, C.enamel, shade, C.enamelShade, 2.5) + H(`M${k(62, 72)} C${k(62, 56)} ${k(70, 46)} ${k(80, 45)}`, 2);
}

const T = TINTS;

/* ---------------- Occlusion: a semi-adjustable articulator, casts meeting in front ---------------- */
function occlusion(){
  const t = T["occlusion"];
  /* a row of five teeth along the occlusal plane at y0 (dir 1 = hanging down, -1 = standing up) */
  const teeth = (y0, dir) => { let d = ""; for (let i = 0; i < 5; i++) { const a = 21.4 + i * 5.2, b = a + 5.2, tip = y0 + dir * 5.6;
    d += `M${a} ${y0} C${a} ${tip} ${b} ${tip} ${b} ${y0} `; } return d; };
  return [
    /* base plate */
    S("M6 50 Q6 47.6 8.4 47.6 L56.4 47.6 Q58.6 47.6 58.6 50 L58.6 55 Q58.6 57.6 56 57.6 L8.6 57.6 Q6 57.6 6 55 Z", t.mid, "M7 54 L57.6 54 L57.6 55 Q57.6 56.6 56 56.6 L8.6 56.6 Q7 56.6 7 55 Z", t.ink),
    /* rear upright with the condylar seat cut into its top */
    S("M8.6 48 L8.6 15.4 C8.6 13.4 10 12.6 11 13.6 C12 15.6 13.6 15.6 14.6 13.6 C15.6 12.6 17 13.4 17 15.4 L17 48 Z", t.mid, "M14.4 17 L16.2 16.4 L16.2 47.6 L14.4 47.6 Z", t.ink),
    /* incisal table on the base, and the incisal pin running down to it */
    S("M48.6 47.8 L49.6 44.4 L58.6 45.8 L58.6 48 Z", C.metal, "M50 46.6 L58 47.2 L58 47.8 L49.6 47.8 Z", C.metalShade, 2),
    S("M52.4 9 L55.6 9 L55.6 45.6 L52.4 45.2 Z", C.metal, "M54.4 10 L55 10 L55 45 L54.4 45 Z", C.metalShade, 2),
    /* upper member: rides on the condyle at the back, wraps the pin at the front */
    S("M10.6 9 Q10.6 7 12.6 7 L55 7 Q59.4 7 59.4 11.4 Q59.4 15.6 55 15.6 L12.6 15.6 Q10.6 15.6 10.6 13.6 Z", t.mid, "M11.6 12.8 L58.2 12.8 C57.6 14.2 56.6 14.7 55 14.7 L12.6 14.7 Q11.6 14.7 11.6 13.6 Z", t.ink),
    H("M15 9.4 L42 9.4"),
    /* the condyle in its seat, and the pin's knob above the member */
    P("M12.8 10.4 a4.4 4.4 0 1 0 .01 0 Z", C.metal, 2.2),
    P("M54 2.4 a2.7 2.7 0 1 0 .01 0 Z", C.metal, 1.8),
    /* upper cast: mounting stone, gums, teeth hanging down to the occlusal plane */
    P("M20 15.4 L48.6 15.4 L47.6 22.6 L21 22.6 Z", C.paper, 2),
    P("M20.6 22.2 L48 22.2 L47.6 26.4 L21 26.4 Z", C.gum, 2),
    P(teeth(26, 1), C.enamel, 1.6),
    /* lower cast */
    P("M21 41 L47.6 41 L48.6 47.8 L20 47.8 Z", C.paper, 2),
    P("M21 36.8 L47.6 36.8 L48 41.2 L20.6 41.2 Z", C.gum, 2),
    P(teeth(37.2, -1), C.enamel, 1.6)
  ].join("");
}

/* ---------------- Perio: a probe in the sulcus at the gumline of a molar ---------------- */
function perio(){
  const t = T["perio"];
  /* a molar's crown (redrawn 2026-11-10: Sam, "the tooth looks odd"): two cusps and the groove between them, the bulge of
     the contact in its upper third, then the taper to the neck, which the gum covers */
  const tooth = "M10.4 25.6 C8.6 18.2 11.6 11 17.8 10.4 C21 10.1 22.4 13 24.4 13 C26.4 13 27.8 10.1 31 10.4 C37.2 11 40.2 18.2 38.4 25.6 " +
    "C37.4 29.8 35.9 33 35.6 37.4 L35 56 L14 56 L13.2 37.4 C12.9 33 11.4 29.8 10.4 25.6 Z";
  return [
    S(tooth, C.enamel, "M31.4 11.4 C36.6 12.6 39 18.8 37.4 25.4 C36.4 29.6 34.9 33 34.6 37.4 L34.2 54 L30.6 54 C32.4 41 35.4 24 31.4 11.4 Z", C.enamelShade),
    L("M24.4 13.4 V17.4", 1.5),
    H("M13.2 22.6 C12.9 18.4 14.6 14.9 17.4 13.6"),
    /* the probe: handle, angled shank, and the banded tip down in the pocket on the distal side */
    ROD("M60 4.5 L48.5 16", 5.2, t.ink),
    H("M57.2 5.9 L50.6 12.4", 1.4),
    ROD("M48.5 16 L42.2 22.2 L39.4 45", 1.9, C.metal),
    L("M41.4 27.6 L41.1 30.2 M40.8 32.6 L40.5 35.2 M40.2 37.6 L39.9 40.2", 2.6),
    /* the gum over the root, margin scalloped across the crown; the papillae rise at each side */
    S("M4.5 41 C5 36.5 8 33.4 10.8 33.6 C13.5 37.2 18.5 39.6 24.4 39.6 C30.4 39.6 35.2 37.2 38 33.6 C41 33.4 44.4 36.4 45 41 C46 49 41 57.5 24.6 57.5 C8.5 57.5 3.6 49 4.5 41 Z",
      C.gum, "M9 52 C16 55.6 33 55.8 41 51 C39 55 33 57 24.6 57 C15 57 10.4 54.8 9 52 Z", C.gumShade),
    H("M8 41 C8.6 38.6 9.6 37 10.8 36.6", 1.6),
    /* a bleeding point where the probe went in */
    P("M40.6 33 C41.4 34.6 42.4 35.6 42.4 36.6 C42.4 37.6 41.6 38.3 40.6 38.3 C39.6 38.3 38.8 37.6 38.8 36.6 C38.8 35.6 39.8 34.6 40.6 33 Z", C.red, 1.3)
  ].join("");
}

/* ---------------- PCD Implants: crown, abutment and threaded fixture in gum and bone ---------------- */
function implants(){
  const t = T["pcd-implants-exam1"];
  const threads = [];
  for (let y = 38.4; y < 53; y += 3.3) {
    const f = (y - 35) / 15, xl = 25 + f * 1.1 - 1.1, xr = 39 - f * 1.1 + 1.1;
    threads.push(`M${xl.toFixed(1)} ${(y + .9).toFixed(1)} L${xr.toFixed(1)} ${(y - .9).toFixed(1)}`);
  }
  return [
    /* bone, with its trabeculae */
    S("M6 36 C14 33.5 50 33.5 58 36 L58 52 C58 56 55.5 58 51.5 58 L12.5 58 C8.5 58 6 56 6 52 Z", C.enamelShade,
      "M7 51 L57 51 L57 52 C57 55.4 55 57 51.5 57 L12.5 57 C9 57 7 55.4 7 52 Z", "#D7C8AA"),
    `<g fill="${C.woodShade}" opacity=".35"><circle cx="12" cy="42" r="1.3"/><circle cx="17" cy="48" r="1"/><circle cx="11" cy="52" r=".9"/><circle cx="48" cy="41.5" r="1.1"/><circle cx="53" cy="47" r="1.3"/><circle cx="46" cy="52" r=".9"/><circle cx="19.5" cy="39.5" r=".8"/><circle cx="44" cy="46" r=".8"/></g>`,
    /* the fixture */
    S("M25 34.6 L39 34.6 L38 50 C37.6 54 35.2 56.6 32 56.6 C28.8 56.6 26.4 54 26 50 Z", t.mid, "M35.6 35.4 L38.2 35.4 L37.3 50 C37 53.4 35.4 55.4 33.6 55.8 C35.4 52 35.8 44 35.6 35.4 Z", t.ink),
    L(threads.join(" "), 1.5),
    H("M28 37.2 L28.4 47", 1.4),
    /* gum collar, then the abutment through it */
    S("M6 34.6 C10 28.6 18 28 24 31.4 C28 33.2 36 33.2 40 31.4 C46 28 54 28.6 58 34.6 C58 37 55 38.2 50 37.6 C40 36.4 24 36.4 14 37.6 C9 38.2 6 37 6 34.6 Z",
      C.gum, "M10 36.2 C20 35 44 35 54 36.2 C50 37.2 44 36.6 32 36.4 C20 36.6 14 37.2 10 36.2 Z", C.gumShade, 2.2),
    S("M27.4 23.5 L36.6 23.5 L37.6 35.2 L26.4 35.2 Z", C.metal, "M34.6 24.2 L35.9 24.2 L36.8 34.6 L35.4 34.6 Z", C.metalShade, 2.2),
    /* the crown */
    S("M21 19.5 C19 12 22 6 27 5.5 C29.6 5.2 30.6 7.6 32 7.6 C33.4 7.6 34.4 5.2 37 5.5 C42 6 45 12 43 19.5 C42.2 23 39.6 25 36.4 25 L27.6 25 C24.4 25 21.8 23 21 19.5 Z",
      C.enamel, "M37.6 6.6 C42 7.6 44 13 42.2 19.4 C41.4 22.4 39.4 24 36.6 24.2 C39.4 19 40 12 37.6 6.6 Z", C.enamelShade),
    H("M23.6 16 C23.4 11.4 24.8 8.6 27.2 8")
  ].join("");
}

/* ---------------- Heme & Endo 2: the thyroid on the trachea, and a drop of blood ---------------- */
function hemeEndo(){
  const t = T["heme-endo-exam2"];
  const rings = []; for (let y = 10; y <= 56; y += 5.2) rings.push(`M26.4 ${y.toFixed(1)} C29 ${(y + 1.6).toFixed(1)} 35 ${(y + 1.6).toFixed(1)} 37.6 ${y.toFixed(1)}`);
  const gland = "M32 37.4 C28 37.4 25.6 35 24 31 C22 25 20 15.6 16 16 C11 16.5 8 27 8 37 C8 46 9.6 53 14 53.5 C19 54 23 48 25.5 45 C27.5 44 30 45.4 32 45.4 C34 45.4 36.5 44 38.5 45 C41 48 45 54 50 53.5 C54.4 53 56 46 56 37 C56 27 53 16.5 48 16 C44 15.6 42 25 40 31 C38.4 35 36 37.4 32 37.4 Z";
  return [
    /* trachea behind it */
    S("M26 6.5 Q26 5 27.5 5 L36.5 5 Q38 5 38 6.5 L38 58 Q38 59.5 36.5 59.5 L27.5 59.5 Q26 59.5 26 58 Z", C.paper, "M35 6 L37 6 L37 58.5 L35 58.5 Z", C.paperShade, 2.2),
    L(rings.join(" "), 1.4, INK, .55),
    /* the gland: two lobes and the isthmus across the trachea */
    S(gland, t.mid, "M44.6 30 C46 38 49 48 53.6 50.2 C52.4 52.6 51.2 53.4 50 53.5 C45 54 41 48 38.5 45 C37.8 44.6 37 44.6 36.4 44.8 C41.4 41 44 36 44.6 30 Z M13.6 50.6 C17.6 50 22 46 25.4 41.6 C26.2 43 26 44.2 25.5 45 C23 48 19 54 14 53.5 C13 53.4 12.2 52.6 11.6 51.6 Z", t.ink),
    H("M11.6 36 C11.6 29 13.2 22 15.6 19.8"),
    H("M44.8 22.4 C46 20 47 19.4 48 19.6", 1.6),
    L("M27 41.2 C30 42.4 34 42.4 37 41.2", 1.2, INK, .4),
    /* the drop */
    S("M54.5 3.5 C56.6 7.4 59.6 10 59.6 12.8 C59.6 15.7 57.4 17.6 54.5 17.6 C51.6 17.6 49.4 15.7 49.4 12.8 C49.4 10 52.4 7.4 54.5 3.5 Z", C.red,
      "M57.2 9.8 C58.6 11 59 12 59 12.8 C59 15.3 57.2 17 54.8 17 C57 15.4 57.8 12.8 57.2 9.8 Z", t.ink, 2.2),
    H("M51.6 12.6 C51.6 11.2 52.2 10.2 53 9.4", 1.5)
  ].join("");
}

/* ---------------- Special Patient Care: a molar cradled in a gloved hand ---------------- */
function spc(){
  const t = T["special-patient-care"];
  /* an open hand, palm up: the sleeve at the left, the fingers reaching right and curling up at their tips, the thumb
     rising in front; the molar rests on the palm */
  const hand = "M12 42.4 C20 44.8 30 45.2 40 44.8 C48 44.4 53.6 43 56.8 40.6 C59.4 38.8 61.2 40.8 60.4 43.6 C59.6 48.6 55.4 53.4 48 55.6 " +
    "C40 57.8 28 58 20 56.8 L12.2 57.2 Z";
  const thumb = "M14.8 47.4 C14 42.4 16 37.4 19.6 35.2 C22 33.8 24.8 35 24.6 37.6 C24.4 39.8 22.8 41.2 22.2 43.6 C21.8 45.4 22.2 46.6 22.8 47.8 Z";
  return [
    molar(.2, 37.4, 8.4),
    S(hand, t.mid, "M60.2 45.4 C59 49.4 54.8 53.6 48 55.6 C40 57.8 28 58 20 56.8 L19.6 54.6 C28 55.8 40 55.6 47.4 53.6 C53.4 52 58 48.8 60.2 45.4 Z", t.ink),
    L("M58.6 45.8 C54.8 48 49.4 49 44 49.2 M56.6 50.4 C52.6 52.2 47.4 53 42 53", 1.4),
    S(thumb, t.mid, "M23.6 39.4 C22.6 40.8 22 42 21.6 43.6 C21.3 45 21.5 46.4 22 47.6 L22.8 47.8 C22.2 46.6 21.8 45.4 22.2 43.6 C22.6 41.8 23.4 40.6 23.6 39.4 Z", t.ink, 2.2),
    H("M17.4 43 C17.2 40.4 18 38.2 19.6 37", 1.6),
    H("M26 47.6 L38 47.8", 1.6),
    /* the glove's rolled cuff */
    P("M5 40.6 L13.4 41.6 L13.4 58 L5 58.8 Z", t.ink, 2.2),
    H("M8.6 44 L8.6 54.6", 1.4)
  ].join("").replace(/^/, '<g transform="translate(0 -2.4)">') + "</g>";
}

/* ---------------- A new hub: a molar standing on an open book ---------------- */
function generic(){
  const t = T["generic"];
  return [
    /* the cover, then the two pages fanning from the spine */
    S("M3.5 42 L3.5 55 C14 52.4 25 52.6 32 57.4 C39 52.6 50 52.4 60.5 55 L60.5 42 C50 40 39 40.4 32 44 C25 40.4 14 40 3.5 42 Z", t.ink, "M4.5 53.6 C14 51.2 25 51.4 32 56 L32 57 C25 52.6 14 52.4 4.5 54.6 Z", "#4F424C", 2.4),
    S("M32 41.6 C25.4 37.4 14 37 6 39.4 L6 52.4 C14 50 25.4 50.4 32 54.4 Z", C.paper, "M6 49.6 C14 47.4 25.4 47.8 32 51.6 L32 54.4 C25.4 50.4 14 50 6 52.4 Z", C.paperShade, 2.2),
    S("M32 41.6 C38.6 37.4 50 37 58 39.4 L58 52.4 C50 50 38.6 50.4 32 54.4 Z", C.paper, "M58 49.6 C50 47.4 38.6 47.8 32 51.6 L32 54.4 C38.6 50.4 50 50 58 52.4 Z", C.paperShade, 2.2),
    L("M10 43.4 C15 42.4 20 42.6 24.4 44 M10 47 C15 46 20 46.2 24.4 47.6 M39.6 44 C44 42.6 49 42.4 54 43.4 M39.6 47.6 C44 46.2 49 46 54 47", 1.2, INK, .4),
    molar(.215, 32, 2.6),
    /* a small four-point sparkle by its crown */
    P("M53 5.6 C53.6 9.2 54.4 10 58 10.6 C54.4 11.2 53.6 12 53 15.6 C52.4 12 51.6 11.2 48 10.6 C51.6 10 52.4 9.2 53 5.6 Z", C.yellow, 1.6)
  ].join("");
}

export const EMBLEMS = {
  "occlusion":            { label: "An articulator with two casts meeting in front", body: occlusion() },
  "perio":                { label: "A periodontal probe in the pocket at a molar's gumline", body: perio() },
  "pcd-implants-exam1":   { label: "An implant: crown, abutment and threaded fixture in gum and bone", body: implants() },
  "heme-endo-exam2":      { label: "The thyroid gland on the trachea, with a drop of blood", body: hemeEndo() },
  "special-patient-care": { label: "A molar cradled in a gloved hand", body: spc() },
  "generic":              { label: "A molar standing on an open book", body: generic() }
};
