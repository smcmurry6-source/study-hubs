// Builds the Periodontology hub's anima figures into its content: hubs/perio/content/figures.js (between its anima:js
// markers; the rest of that file is the engine's wrapper and the suture pictures, edited there) and
// hubs/perio/content/figures.css (all of it).
//   node tools/figures/perio/build.mjs            rebuild them from the files here
//   node tools/figures/perio/build.mjs --check    exit 1 if they are out of date
//   node tools/figures/perio/build.mjs --preview  also write standalone pages to dist/ for anima's checks
// --check also runs node tools/ci/cases.js, so every drawn Patient Box case (PCASES; the kit is widget/cases.js)
// stays realistic and agrees with its own numbers.
// Each figure is one module here (static SVG + a live function sharing one model); edit them, never the built
// blocks in the hub's content. Standing rules: CLAUDE.md -> "Diagrams (the anima skill)".
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { baseCss } from "./shared.mjs";
import { FIGURES } from "./index.mjs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const JS = join(HERE, "../../../hubs/perio/content/figures.js"), CSS = join(HERE, "../../../hubs/perio/content/figures.css");
const read = (f) => readFileSync(join(HERE, f), "utf8").trimEnd() + "\n";
const AJB = "/* anima:js begin (built from tools/figures/perio; edit there) */\n", AJE = "/* anima:js end */\n";
/* the stylesheet is built whole. No label under 11px on the engine (the taste skill's floor); the last two rules are
   the suture pictures': labels that give a picture's answer away hide while it sits above its question (.sd-hint). */
const CSS_HEAD = "/* Built by tools/figures/perio/build.mjs from the anima figures in tools/figures/perio/. Do not edit: change those and rebuild. */\n";
const CSS_TAIL = "\nhtml.shx .qfig:not(.qfig-after) .sd-hint{display:none}\nhtml.shx .fig-card svg{display:block;width:100%;height:auto}\n";
const floor = (css) => css.replace(/font-size:\s*(?:9|9\.5|10|10\.5)px/g, "font-size:11px");

/* the anima figures: static SVG + a live function per figure; helpers are declared inside the figure's data scope so
   the live code and the build share one model */
function animaJs(){
  const figs = FIGURES.map((f) => {
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
const animaCss = () => baseCss() + FIGURES.map((f) => f.css).join("") + "\n";

function between(src, b, e, body){
  const i = src.indexOf(b), j = src.indexOf(e);
  if (i < 0 || j < i) throw new Error("markers not found: " + b.trim());
  return src.slice(0, i) + b + body + src.slice(j);
}
const js = readFileSync(JS, "utf8"), css = readFileSync(CSS, "utf8");
const out = between(js, AJB, AJE, animaJs());
const outCss = CSS_HEAD + floor("\n" + animaCss() + CSS_TAIL);
if (process.argv.includes("--check")) {
  if (out !== js || outCss !== css) { console.error("hubs/perio/content/figures." + (out !== js ? "js" : "css") + " is stale; run node tools/figures/perio/build.mjs"); process.exit(1); }
  console.log("perio's figures are up to date");
  const { spawnSync } = await import("node:child_process");
  if (spawnSync(process.execPath, [join(HERE, "../../ci/cases.js")], { stdio: "inherit" }).status) process.exit(1);
} else {
  writeFileSync(JS, out); writeFileSync(CSS, outCss);
  console.log("wrote", JS, "and figures.css (anima: " + FIGURES.map((f) => f.id).join(", ") + ")");
  const { spawnSync } = await import("node:child_process");
  spawnSync(process.execPath, [join(HERE, "../../ci/cases.js")], { stdio: "inherit" });
}
if (process.argv.includes("--preview")) {
  // standalone pages on the engine's stylesheet (widget/site.bundle.css), for anima's capture and line checks
  mkdirSync(join(HERE, "dist"), { recursive: true });
  for (const theme of ["light", "dark"]) for (const f of FIGURES) {
    const page = `<!doctype html><html lang="en" class="shx" data-hx-hub="perio" data-theme="${theme}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${f.title}</title><link rel="stylesheet" href="../../../../widget/site.bundle.css"><style>
main{max-width:760px;margin:24px auto;padding:0 16px}
${outCss}</style></head><body><main id="figs"></main><script>${animaJs()}
document.getElementById("figs").innerHTML = ANIMA.html(${JSON.stringify(f.id)}); ANIMA.mount(document);
</script></body></html>`;
    writeFileSync(join(HERE, "dist", `${f.id}-${theme}.html`), page);
  }
  console.log("wrote dist/*-light.html, dist/*-dark.html");
}
