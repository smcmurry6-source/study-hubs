// Builds the Occlusion hub's lazy drawing-kit assets from the files here.
//   node tools/figures/occlusion/build.mjs          rebuild the hub's assets and marker placeholders
//   node tools/figures/occlusion/build.mjs --check  exit 1 if the assets or placeholders are out of date
// The kit (od.js: occlusal teeth, fence posts, contact maps, the redrawn FIGS), the case images (cases.js), the
// "What cusp hits where?" game (game.js) and their CSS (od.css) are plain browser JS/CSS: edit them here, never the
// generated blocks in the hub. Standing rules: CLAUDE.md -> "Diagrams (the anima skill)".
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { baseCss } from "./anima/shared.mjs";
import { FIGURES } from "./anima/index.mjs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Script, createContext } from "node:vm";

const HERE = dirname(fileURLToPath(import.meta.url));
const HUB = join(HERE, "../../../hubs/occlusion/index.html");
const FIGURES_DIR = join(HERE, "../../../hubs/occlusion/figures");
const CONTENT_DIR = join(HERE, "../../../hubs/occlusion/content");
const OD_JS_OUT = join(FIGURES_DIR, "od.js");
const OD_CSS_OUT = join(FIGURES_DIR, "od.css");
const ANIMA_JS_OUT = join(FIGURES_DIR, "anima.js");
const ANIMA_CSS_OUT = join(FIGURES_DIR, "anima.css");
const FIGURES_JSON = join(CONTENT_DIR, "figures.json");
const FIGURES_FALLBACK = join(CONTENT_DIR, "figures.js");
const read = (f) => readFileSync(join(HERE, f), "utf8").trimEnd() + "\n";
const JB = "/* od:kit begin (built from tools/figures/occlusion; edit there) */\n", JE = "/* od:kit end */\n";
const CB = "/* od:css begin */\n", CE = "/* od:css end */\n";
const AJB = "/* anima:js begin (built from tools/figures/occlusion/anima; edit there) */\n", AJE = "/* anima:js end */\n";
const ACB = "/* anima:css begin */\n", ACE = "/* anima:css end */\n";
const KIT_PLACEHOLDER = "/* Loaded on demand from figures/od.js by widget/hub.js. */\nvar OD = {};\nvar FIGS = {};\nvar FIG_PLACE = {};\nvar FIG_BY_LEC = {};\nfunction cuspMapHTML(){ return ''; }\nvar CMAP_NOTE = {};\nfunction wireCuspMaps(){}\nvar CASE_IMG = {};\nfunction caseImgHTML(){ return ''; }\nvar CUSP_GAME = { mount:function(){} };\n";
const OD_CSS_PLACEHOLDER = "/* Loaded on demand from figures/od.css by widget/hub.js. */\n";
const ANIMA_JS_PLACEHOLDER = "/* Loaded on demand from figures/anima.js by widget/hub.js. */\nvar ANIMA = { html:function(){ return ''; }, mount:function(){}, meta:function(){ return null; } };\n";
const ANIMA_CSS_PLACEHOLDER = "/* Loaded on demand from figures/anima.css by widget/hub.js. */\n";

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
  const begin = src.includes(b) ? b : b.replace(/\n/g, "\r\n");
  const end = src.includes(e) ? e : e.replace(/\n/g, "\r\n");
  const i = src.indexOf(begin), j = src.indexOf(end);
  if (i < 0 || j < i) throw new Error("markers not found: " + b.trim());
  return src.slice(0, i) + begin + body + src.slice(j);
}
function same(file, text){
  try { return readFileSync(file, "utf8").replace(/\r\n/g, "\n") === text.replace(/\r\n/g, "\n"); }
  catch { return false; }
}
function writeIfChanged(file, text){ if (!same(file, text)) writeFileSync(file, text); }
function odRuntime(){
  const od = read("od.js"), cases = read("cases.js"), game = read("game.js");
  const figures = od.indexOf("/* ---------- FIGURES ----------"), tail = od.indexOf("/* fence post + contact map");
  const caseHtml = cases.indexOf("function caseImgHTML");
  if (figures < 0 || tail < figures || caseHtml < 0) throw new Error("could not split static occlusion figures from their runtime helpers");
  return (od.slice(0, figures) + od.slice(tail) + cases.slice(caseHtml) + game)
    .replace(/^var OD =/m, "window.OD =")
    .replace(/^function cuspMapHTML\(/m, "window.cuspMapHTML = function cuspMapHTML(")
    .replace(/^var CMAP_NOTE =/m, "window.CMAP_NOTE =")
    .replace(/^function wireCuspMaps\(/m, "window.wireCuspMaps = function wireCuspMaps(")
    .replace(/^function caseImgHTML\(/m, "window.caseImgHTML = function caseImgHTML(")
    .replace(/^var CUSP_GAME =/m, "window.CUSP_GAME =");
}
function staticFigures(){
  const context = createContext({});
  new Script(read("od.js") + read("cases.js") + "\nglobalThis.__figures = { FIGS: FIGS, FIG_PLACE: FIG_PLACE, FIG_BY_LEC: FIG_BY_LEC, CASE_IMG: CASE_IMG };\n", { filename: "tools/figures/occlusion/static-figures.js" }).runInContext(context);
  return context.__figures;
}
function figurePayload(){ return { ...JSON.parse(readFileSync(FIGURES_JSON, "utf8")), ...staticFigures() }; }
function figureFallback(data){ return `window.shHubContent.receive("figures",${JSON.stringify(data)});\n`; }
const hub = readFileSync(HUB, "utf8");
const odJs = JB + odRuntime() + JE;
const odCss = CB + read("od.css") + CE;
const animaJsOut = AJB + animaJs()
  .replace(/[ \t]+(?=\n)/g, "")
  .replace(/^var ANIMA = /, "window.ANIMA = ") + AJE;
const animaCssOut = ACB + animaCss() + ACE;
const figures = figurePayload();
const figuresJson = JSON.stringify(figures) + "\n";
const figuresFallback = figureFallback(figures);
let out = between(hub, JB, JE, KIT_PLACEHOLDER);
out = between(out, CB, CE, OD_CSS_PLACEHOLDER);
out = between(out, AJB, AJE, ANIMA_JS_PLACEHOLDER);
out = between(out, ACB, ACE, ANIMA_CSS_PLACEHOLDER);
if (process.argv.includes("--check")) {
  if (!same(HUB, out) || !same(OD_JS_OUT, odJs) || !same(OD_CSS_OUT, odCss) || !same(ANIMA_JS_OUT, animaJsOut) || !same(ANIMA_CSS_OUT, animaCssOut) || !same(FIGURES_JSON, figuresJson) || !same(FIGURES_FALLBACK, figuresFallback)) {
    console.error("hubs/occlusion: the lazy figure assets, static figures, or hub placeholders are stale; run node tools/figures/occlusion/build.mjs");
    process.exit(1);
  }
  console.log("occlusion lazy figure assets and static figures are up to date");
} else {
  mkdirSync(FIGURES_DIR, { recursive: true });
  writeIfChanged(HUB, out); writeIfChanged(OD_JS_OUT, odJs); writeIfChanged(OD_CSS_OUT, odCss);
  writeIfChanged(ANIMA_JS_OUT, animaJsOut); writeIfChanged(ANIMA_CSS_OUT, animaCssOut);
  writeIfChanged(FIGURES_JSON, figuresJson); writeIfChanged(FIGURES_FALLBACK, figuresFallback);
  console.log("wrote lazy figure assets and static figures for occlusion (anima: " + FIGURES.map((f) => f.id).join(", ") + ")");
}
if (process.argv.includes("--preview")) {
  // standalone pages with the hub's tokens, for anima's capture and line checks
  const tokens = hub.slice(hub.indexOf(":root{"), hub.indexOf("html,body{") > 0 ? hub.indexOf("html,body{") : hub.indexOf(":root{") + 4000);
  mkdirSync(join(HERE, "dist"), { recursive: true });
  for (const theme of ["light", "dark"]) for (const f of FIGURES) {
    const page = `<!doctype html><html lang="en" data-theme="${theme}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${f.title}</title><style>${tokens}
html,body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.55 system-ui,sans-serif}main{max-width:760px;margin:24px auto;padding:0 16px}
${read("od.css")}${animaCss()}</style></head><body><main id="figs"></main><script>${animaJs()}
document.getElementById("figs").innerHTML = ANIMA.html(${JSON.stringify(f.id)}); ANIMA.mount(document);
</script></body></html>`;
    writeFileSync(join(HERE, "dist", `${f.id}-${theme}.html`), page);
  }
  console.log("wrote dist/*-light.html, dist/*-dark.html");
}
