// Pastes the Occlusion hub's drawing kit into hubs/occlusion/index.html between its markers.
//   node tools/figures/occlusion/build.mjs          rebuild the hub's kit blocks from the files here
//   node tools/figures/occlusion/build.mjs --check  exit 1 if the hub's blocks are out of date
// The kit (od.js: occlusal teeth, fence posts, contact maps, the redrawn FIGS), the case images (cases.js), the
// "What cusp hits where?" game (game.js) and their CSS (od.css) are plain browser JS/CSS: edit them here, never the
// generated blocks in the hub. Standing rules: CLAUDE.md -> "Diagrams (the anima skill)".
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { baseCss } from "./anima/shared.mjs";
import { FIGURES } from "./anima/index.mjs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const HUB = join(HERE, "../../../hubs/occlusion/index.html");
const read = (f) => readFileSync(join(HERE, f), "utf8").trimEnd() + "\n";
const JB = "/* od:kit begin (built from tools/figures/occlusion; edit there) */\n", JE = "/* od:kit end */\n";
const CB = "/* od:css begin */\n", CE = "/* od:css end */\n";
const AJB = "/* anima:js begin (built from tools/figures/occlusion/anima; edit there) */\n", AJE = "/* anima:js end */\n";
const ACB = "/* anima:css begin */\n", ACE = "/* anima:css end */\n";

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
const hub = readFileSync(HUB, "utf8");
let out = between(hub, JB, JE, read("od.js") + read("cases.js") + read("game.js"));
out = between(out, CB, CE, read("od.css"));
out = between(out, AJB, AJE, animaJs());
out = between(out, ACB, ACE, animaCss());
if (process.argv.includes("--check")) {
  if (out !== hub) { console.error("hubs/occlusion/index.html: the kit blocks are stale; run node tools/figures/occlusion/build.mjs"); process.exit(1); }
  console.log("occlusion kit blocks are up to date");
} else {
  writeFileSync(HUB, out);
  console.log("wrote", HUB, "(anima: " + FIGURES.map((f) => f.id).join(", ") + ")");
}
if (process.argv.includes("--preview")) {
  // standalone pages with the hub's tokens, for anima's capture and line checks
  const tokens = hub.slice(hub.indexOf(":root{"), hub.indexOf("html,body{") > 0 ? hub.indexOf("html,body{") : hub.indexOf(":root{") + 4000);
  mkdirSync(join(HERE, "dist"), { recursive: true });
  for (const theme of ["light", "dark"]) for (const f of FIGURES) {
    const page = `<!doctype html><html lang="en" data-theme="${theme}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${f.title}</title><style>${tokens}
html,body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.55 system-ui,sans-serif}main{max-width:760px;margin:24px auto;padding:0 16px}
${animaCss()}</style></head><body><main id="figs"></main><script>${animaJs()}
document.getElementById("figs").innerHTML = ANIMA.html(${JSON.stringify(f.id)}); ANIMA.mount(document);
</script></body></html>`;
    writeFileSync(join(HERE, "dist", `${f.id}-${theme}.html`), page);
  }
  console.log("wrote dist/*-light.html, dist/*-dark.html");
}
