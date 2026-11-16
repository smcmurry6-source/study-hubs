// One figure on its own, for checking it while it's drawn: node tools/figures/heme-endo-exam3/preview.mjs <id>
// writes dist/<id>-light.html and dist/<id>-dark.html (standalone pages on the engine's stylesheet) and touches nothing
// in the hub. The full build (build.mjs) puts every figure into the hub's content.
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { baseCss } from "./shared.mjs";
const HERE = dirname(fileURLToPath(import.meta.url)), id = process.argv[2];
if (!id) { console.error("usage: node preview.mjs <figure id>"); process.exit(1); }
const f = (await import("./" + id + ".mjs")).default();
const helpers = (f.helpers || []).map((fn) => fn.toString()).join("\n    "), names = (f.helpers || []).map((fn) => `d.${fn.name} = ${fn.name};`).join(" ");
const js = `var FIG = { html: ${JSON.stringify(f.html)}, data: (function(){ var d = ${JSON.stringify(f.data)};\n    ${helpers}\n    ${names} return d; })(), live: ${f.live} };
document.getElementById("figs").innerHTML = '<figure class="lec-fig"><h4>' + ${JSON.stringify(f.title)} + '</h4><p class="lec-fig-cap">' + ${JSON.stringify(f.caption)} + '</p>' + FIG.html + '</figure>';
FIG.live(document.querySelector("[data-anima]"), FIG.data);`;
const css = (baseCss() + f.css).replace(/font-size:\s*(?:9|9\.5|10|10\.5)px/g, "font-size:11px");
mkdirSync(join(HERE, "dist"), { recursive: true });
for (const theme of ["light", "dark"]) writeFileSync(join(HERE, "dist", `${id}-${theme}.html`), `<!doctype html><html lang="en" class="shx" data-hx-hub="heme-endo-exam3" data-theme="${theme}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${f.title}</title><link rel="stylesheet" href="../../../../widget/site.bundle.css"><style>
main{max-width:760px;margin:24px auto;padding:0 16px}
${css}</style></head><body><main id="figs"></main><script>${js}</script></body></html>`);
console.log(`wrote dist/${id}-light.html and dist/${id}-dark.html (${f.title}; lecture ${f.lec})`);
