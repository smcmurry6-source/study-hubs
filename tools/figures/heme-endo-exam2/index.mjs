// The Heme & Endo Exam 2 hub's anima figures (Sam, 2026-11-05: "yes to all animations"), in build order.
// Each module here default-exports a function returning makeFig({...}) (see shared.mjs); a figure is listed in ORDER.
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
export const ORDER = ["drugsites", "insulins", "axislab", "cah", "tubule", "ducts", "follicle", "cycle", "hpg"];
const mods = [];
for (const name of ORDER) if (existsSync(join(HERE, name + ".mjs"))) mods.push((await import("./" + name + ".mjs")).default());
export const FIGURES = mods;
