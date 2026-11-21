// The Heme & Endo Exam 3 hub's anima figures (Sam, 2026-11-16: "yes to all diagrams and figures"), in build order.
// Each module here default-exports a function returning makeFig({...}) (see shared.mjs). Every .mjs file in this folder
// except shared, build, index and preview is a figure: ORDER sets their order (by lecture), the rest follow by name.
import { readdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
const NOT = new Set(["shared", "build", "index", "preview"]);
export const ORDER = [];
const names = readdirSync(HERE).filter((f) => f.endsWith(".mjs")).map((f) => f.slice(0, -4)).filter((n) => !NOT.has(n))
  .sort((a, b) => ((ORDER.indexOf(a) + 1 || 999) - (ORDER.indexOf(b) + 1 || 999)) || a.localeCompare(b));
const mods = [];
for (const name of names) {
  const f = (await import("./" + name + ".mjs")).default();
  if (f.id !== name) throw new Error(`tools/figures/heme-endo-exam3/${name}.mjs builds a figure with id "${f.id}": name the file after its id`);
  mods.push(f);
}
export const FIGURES = mods;
