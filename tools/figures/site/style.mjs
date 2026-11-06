/* The site's drawing style: one ink, one set of flat fills, the hub tints.
   Every piece of site art (icons, hub emblems, masthead scenes, medals, trophies, rewards) imports these, so it all
   matches Timmy (widget/pet.js draws him with OUT = "#3B2E3A"). Drawn by hand in SVG: no gradients, no filters, no
   <text>, no <style>, no ids (an id would collide when a drawing is repeated on a page), no emoji, no icon library.

   How a drawing is inked (the house style):
   - Every filled shape has an ink outline (INK), stroke-linejoin and stroke-linecap round.
     Outline widths: 64-box art (emblems, medals, trophies) 2.5 outer / 1.5 inner detail; 600x200 mastheads 3 / 2;
     24-box UI icons 2 (and they use currentColor, not INK, so they follow the text color in light and dark).
   - Fills are flat. Form comes from one darker flat shade shape on the side away from the light (light from the top
     left) and short white highlight strokes (stroke="#fff", width 2, opacity .6, round caps) on the lit side, the way
     the roof of Timmy's house is lit.
   - Lines are drawn, not ruled: gentle curves, slightly uneven, never a perfect machine circle where a hand would
     wobble. Keep shapes chunky and readable at small sizes.                                                          */

export const INK = "#3B2E3A";          // Timmy's outline: the ink of every drawing
export const HI = 'stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none" opacity=".6"';

/* flat fills, light then its shade */
export const C = {
  enamel: "#FFFDF6", enamelShade: "#E9DFCC",
  gum: "#F78FA8", gumShade: "#E07090", gumLight: "#FFC0CD",
  pink: "#F7A3BA",
  metal: "#D5DBE1", metalShade: "#8E98A3", metalLight: "#EEF2F5",
  gold: "#F2C94C", goldShade: "#C9971C", goldLight: "#FFF0B3",
  bronze: "#D08A52", bronzeShade: "#9A5A2A", bronzeLight: "#F2C49A",
  silver: "#D9DFE5", silverShade: "#8E98A3", silverLight: "#F6F8FA",
  paper: "#FFFFFF", paperShade: "#ECE6EA",
  wood: "#C4915F", woodShade: "#8A5A3A",
  sky: "#CFEAF8", grass: "#A7DE93", grassShade: "#6CBB68",
  red: "#E5484D", blue: "#3FA7E0", yellow: "#FFE27A", green: "#3ECF7E", orange: "#F59A1E",
  plum: "#6B5A68", plumLight: "#ECE6EA"
};

/* one tint per hub (strip, tabs, emblem, dashboard tab), with a light and a mid step for drawings */
export const TINTS = {
  "occlusion":            { name: "Occlusion",            ink: "#2747a3", mid: "#6F86CF", light: "#DCE3F6", dark: "#8FA6EC" },
  "perio":                { name: "Perio",                ink: "#b4466f", mid: "#D97FA0", light: "#F6DDE6", dark: "#EC93B5" },
  "pcd-implants-exam1":   { name: "PCD Implants",         ink: "#2f6f84", mid: "#6FA9BB", light: "#D7E9EF", dark: "#7CC0D6" },
  "heme-endo-exam2":      { name: "Heme & Endo 2",        ink: "#a83232", mid: "#D86F6F", light: "#F5DADA", dark: "#EE8A8A" },
  "special-patient-care": { name: "Special Patient Care", ink: "#2e7d4f", mid: "#6DB58A", light: "#D7EEDF", dark: "#76CB98" },
  "generic":              { name: "A new hub",            ink: "#6B5A68", mid: "#A897A4", light: "#ECE6EA", dark: "#C4B3C0" }
};
export const HUBS = Object.keys(TINTS);

/* wrap inner markup in an svg element (the build and the preview page use this) */
export function svg(inner, vb, opt = {}){
  const a = opt.label ? `role="img" aria-label="${opt.label.replace(/"/g, "&quot;")}"` : 'aria-hidden="true"';
  const cls = opt.cls ? ` class="${opt.cls}"` : "";
  const size = opt.px ? ` width="${opt.px}" height="${Math.round(opt.px * vb[3] / vb[2])}"` : "";
  return `<svg${cls} viewBox="${vb.join(" ")}"${size} ${a} focusable="false">${inner}</svg>`;
}
