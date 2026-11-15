// Builds the Occlusion hub's drawing kit into its content: hubs/occlusion/content/figures.js (between its od:kit and
// anima:js markers; the rest of that file is the engine's wrapper) and hubs/occlusion/content/figures.css (all of it).
//   node tools/figures/occlusion/build.mjs          rebuild them from the files here
//   node tools/figures/occlusion/build.mjs --check  exit 1 if they are out of date
// The kit (od.js: occlusal teeth, fence posts, contact maps, the redrawn FIGS), the case images (cases.js), the
// "What cusp hits where?" game (game.js) and their CSS (od.css) are plain browser JS/CSS: edit them here, never the
// built blocks in the hub's content. Standing rules: CLAUDE.md -> "Diagrams (the anima skill)".
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { baseCss } from "./anima/shared.mjs";
import { FIGURES } from "./anima/index.mjs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const JS = join(HERE, "../../../hubs/occlusion/content/figures.js"), CSS = join(HERE, "../../../hubs/occlusion/content/figures.css");
const read = (f) => readFileSync(join(HERE, f), "utf8").trimEnd() + "\n";
const JB = "/* od:kit begin (built from tools/figures/occlusion; edit there) */\n", JE = "/* od:kit end */\n";
const AJB = "/* anima:js begin (built from tools/figures/occlusion/anima; edit there) */\n", AJE = "/* anima:js end */\n";
/* the stylesheet is built whole. No label under 11px on the engine (the taste skill's floor; the kit draws some at
   9 to 10.5px): everything else about the figures' look is restyled in widget/hub.css, under html.shx. */
const CSS_HEAD = "/* Built by tools/figures/occlusion/build.mjs from od.css and the anima figures in tools/figures/occlusion/. Do not edit: change those and rebuild. */\n";
const floor = (css) => css.replace(/font-size:\s*(?:9|9\.5|10|10\.5)px/g, "font-size:11px");

/* the anima figures: static SVG + a live function per figure; helpers are declared inside the figure's data scope so
   the live code and the build share one model */
function animaJs(){
  const figs = FIGURES.map((f) => {
    /* an alias: another lecture's copy of a figure, its own title, caption and lecture, the same drawing and live code,
       with data overrides (where it opens); its markup names the alias so mount() finds this entry */
    if (f.alias) return `  FIGS[${JSON.stringify(f.id)}] = { title: ${JSON.stringify(f.title)}, caption: ${JSON.stringify(f.caption)}, lec: ${JSON.stringify(f.lec)},
    html: FIGS[${JSON.stringify(f.alias)}].html.split(${JSON.stringify(`data-anima="${f.alias}"`)}).join(${JSON.stringify(`data-anima="${f.id}"`)}),
    data: Object.assign({}, FIGS[${JSON.stringify(f.alias)}].data, ${JSON.stringify(f.data || {})}),
    live: FIGS[${JSON.stringify(f.alias)}].live };`;
    const helpers = (f.helpers || []).map((fn) => fn.toString()).join("\n    ");
    const names = (f.helpers || []).map((fn) => `d.${fn.name} = ${fn.name};`).join(" ");
    return `  FIGS[${JSON.stringify(f.id)}] = { title: ${JSON.stringify(f.title)}, caption: ${JSON.stringify(f.caption)}, lec: ${JSON.stringify(f.lec)},
    html: ${JSON.stringify(f.html)},
    data: (function(){ var d = ${JSON.stringify(f.data)};
    ${helpers}
    ${names} return d; })(),
    live: ${f.live} };`;
  }).join("\n");
  return `var ANIMA = (function(){
  var FIGS = {};
${figs}
  function esc(s){ return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  /* noTitle: the caller heads it (Review sections use their own h3). The figures use no SVG ids, so copies can repeat. */
  function html(key, noTitle){ var f = FIGS[key]; if(!f) return ""; return '<figure class="lec-fig">' + (noTitle ? '' : '<h4>' + esc(f.title) + '</h4>') + '<p class="lec-fig-cap">' + esc(f.caption) + '</p>' + f.html + '</figure>'; }
  function mount(scope){ Array.prototype.forEach.call(scope.querySelectorAll("[data-anima]"), function(el){ if(el.__animaOn) return; var f = FIGS[el.getAttribute("data-anima")]; if(!f) return; el.__animaOn = 1; try { f.live(el, f.data); } catch(e){ if(window.console) console.error("anima figure failed", e); } }); }
  function meta(key){ var f = FIGS[key]; return f ? { title: f.title, caption: f.caption, lec: f.lec } : null; }
  return { html: html, mount: mount, meta: meta };
})();
`;
}
const animaCss = () => baseCss() + FIGURES.map((f) => f.css || "").join("") + "\n";

function between(src, b, e, body){
  const i = src.indexOf(b), j = src.indexOf(e);
  if (i < 0 || j < i) throw new Error("markers not found: " + b.trim());
  return src.slice(0, i) + b + body + src.slice(j);
}
const js = readFileSync(JS, "utf8"), css = readFileSync(CSS, "utf8");
let out = between(js, JB, JE, read("od.js") + read("cases.js") + read("game.js"));
out = between(out, AJB, AJE, animaJs());
const outCss = CSS_HEAD + floor("\n" + read("od.css") + "\n" + animaCss());
if (process.argv.includes("--check")) {
  if (out !== js || outCss !== css) { console.error("hubs/occlusion/content/figures." + (out !== js ? "js" : "css") + " is stale; run node tools/figures/occlusion/build.mjs"); process.exit(1); }
  console.log("occlusion's figures are up to date");
} else {
  writeFileSync(JS, out); writeFileSync(CSS, outCss);
  console.log("wrote", JS, "and figures.css (anima: " + FIGURES.map((f) => f.id).join(", ") + ")");
}
if (process.argv.includes("--preview")) {
  // standalone pages on the engine's stylesheet (widget/site.bundle.css), for anima's capture and line checks
  mkdirSync(join(HERE, "dist"), { recursive: true });
  for (const theme of ["light", "dark"]) for (const f of FIGURES) {
    const page = `<!doctype html><html lang="en" class="shx" data-hx-hub="occlusion" data-theme="${theme}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${f.title}</title><link rel="stylesheet" href="../../../../widget/site.bundle.css"><style>
main{max-width:760px;margin:24px auto;padding:0 16px}
${outCss}</style></head><body><main id="figs"></main><script>${animaJs()}
document.getElementById("figs").innerHTML = ANIMA.html(${JSON.stringify(f.id)}); ANIMA.mount(document);
</script></body></html>`;
    writeFileSync(join(HERE, "dist", `${f.id}-${theme}.html`), page);
  }
  console.log("wrote dist/*-light.html, dist/*-dark.html");
}
