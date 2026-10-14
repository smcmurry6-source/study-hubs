// Builds the MSK Exam 4 anima figures and pastes them into hubs/msk-exam4/index.html between the anima markers.
//   node tools/figures/msk-exam4/build.mjs            rebuild and inject into the hub
//   node tools/figures/msk-exam4/build.mjs --preview  also write standalone pages to tools/figures/msk-exam4/dist/
//   node tools/figures/msk-exam4/build.mjs --check    exit 1 if the hub's generated blocks are out of date
// Standing rules: CLAUDE.md → "Diagrams (the anima skill)". Edit the figure modules, never the generated blocks.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { baseCss } from "./shared.mjs";
import { nmj } from "./nmj.mjs";
import { sarcomere } from "./sarcomere.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const HUB = join(HERE, "../../../hubs/msk-exam4/index.html");
const FIGS = [nmj(), sarcomere()];
const BY_LEC = { muscle: ["sarcomere"], nmj: ["nmj"] };
// Picture questions: a still of a figure with one part highlighted and the labels hidden (q.img = key).
const STILLS = {
  "nmj-ache": { fig: "nmj", part: "ache" },
  "nmj-rec": { fig: "nmj", part: "rec" },
  "nmj-ves": { fig: "nmj", part: "ves" },
  "nmj-na": { fig: "nmj", part: "na", rep: [['class="nm-na"', 'class="nm-na" data-st="inact"'], ['class="iso-svg nm-fig"', 'class="iso-svg nm-fig" data-drug="sux"']] },
  "sarc-h": { fig: "sarcomere", part: "band-H" },
  "sarc-a": { fig: "sarcomere", part: "band-A" },
};

const STILL_CSS = `
.anima.am-still{margin:0}
.anima.am-still svg{display:block;width:100%;max-width:560px;height:auto;margin:0 auto;overflow:hidden}
.anima.am-still .am-callout,.anima.am-still .nm-particles,.anima.am-still .sc-band-t,.anima.am-still .sc-sarc-t{display:none}
.anima.am-still [data-part]{opacity:.55}
.anima.am-still[data-q="ache"] [data-part="ache"],.anima.am-still[data-q="rec"] [data-part="rec"],.anima.am-still[data-q="ves"] [data-part="ves"],.anima.am-still[data-q="na"] [data-part="na"]{opacity:1;filter:drop-shadow(0 0 2.5px var(--anatomy-lit)) drop-shadow(0 0 1px var(--anatomy-lit))}
.anima.am-still[data-q^="band"] [data-part]{opacity:1}
.anima.am-still[data-q="band-H"] [data-band="H"],.anima.am-still[data-q="band-A"] [data-band="A"]{fill:var(--anatomy-lit);stroke:var(--anatomy-lit);opacity:.85}
.anima.am-still[data-q="band-H"] [data-band-bg="H"],.anima.am-still[data-q="band-A"] [data-band-bg="A"]{fill:color-mix(in srgb,var(--anatomy-lit) 22%,var(--anatomy-card))}
`;
const SECTION_CSS = `
.lec-figs{margin:26px 0 6px}
.lec-figs > h3{margin:0 0 10px}
.lec-fig{margin:0 0 26px}
.lec-fig > h4{margin:0 0 4px;font-size:1rem}
.lec-fig > .lec-fig-cap{margin:0 0 10px;font-size:.86rem;color:var(--ink-soft)}
.qcard-figure{margin:0 0 12px;border:1px solid var(--line);border-radius:10px;background:var(--surface);padding:8px 6px}
.qcard-figure-after{margin:10px 0 12px}
`;

const css = baseCss() + FIGS.map((f) => f.css).join("") + STILL_CSS + SECTION_CSS;

const js = (() => {
  const figs = FIGS.map((f) => {
    const svg = f.still.svg;
    if (!f.html.includes(svg)) throw new Error(`${f.id}: figure markup doesn't contain its svg`);
    const shell = f.html.replace(svg, "@@SVG@@");
    const helpers = Object.entries(f.helpers || {}).map(([k, src]) => `d.${k} = ${src};`).join(" ");
    return `  FIGS[${JSON.stringify(f.id)}] = { title: ${JSON.stringify(f.title)}, caption: ${JSON.stringify(f.caption)},\n    svg: ${JSON.stringify(svg)},\n    shell: ${JSON.stringify(shell)},\n    data: (function(){ var d = ${JSON.stringify(f.data)}; ${helpers} return d; })(),\n    live: ${f.live} };`;
  }).join("\n");
  return `var ANIMA = (function(){
  var FIGS = {};
${figs}
  var BY_LEC = ${JSON.stringify(BY_LEC)};
  var STILLS = ${JSON.stringify(STILLS)};
  // Each copy gets its own SVG ids and radio group: the same figure can sit in Notes and Review at once (the hidden
  // panel stays in the page), and url(#id) would otherwise point into whichever copy comes first.
  var copies = 0;
  function uniq(s){ var k = "-" + (++copies); return s.replace(/(id="|url\\(#|href="#)((?:nm|sc)-[a-z0-9-]+)/g, "$1$2" + k).replace(/name="((?:nm|sc)-[a-z0-9-]+)"/g, 'name="$1' + k + '"'); }
  function esc(s){ return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  // noTitle: the caller heads it (Review sections use their own h3)
  function html(key, noTitle){ var f = FIGS[key]; if(!f) return ""; return '<figure class="lec-fig">' + (noTitle ? '' : '<h4>' + esc(f.title) + '</h4>') + '<p class="lec-fig-cap">' + esc(f.caption) + '</p>' + uniq(f.shell.replace("@@SVG@@", f.svg)) + '</figure>'; }
  function still(key){ var s = STILLS[key]; if(!s || !FIGS[s.fig]) return ""; var f = FIGS[s.fig], svg = f.svg.replace('viewBox="' + f.data.wide + '"', 'viewBox="' + f.data.narrow + '"'); (s.rep || []).forEach(function(r){ svg = svg.split(r[0]).join(r[1]); }); return '<div class="anima am-still" data-q="' + s.part + '">' + uniq(svg) + '</div>'; }
  function mount(scope){ Array.prototype.forEach.call(scope.querySelectorAll("[data-anima]"), function(el){ if(el.__animaOn) return; var f = FIGS[el.getAttribute("data-anima")]; if(!f) return; el.__animaOn = 1; try { f.live(el, f.data); } catch(e){ if(window.console) console.error("anima figure failed", e); } }); }
  function meta(key){ var f = FIGS[key]; return f ? { title: f.title, caption: f.caption } : null; }
  return { byLec: BY_LEC, html: html, still: still, mount: mount, meta: meta, has: function(k){ return !!STILLS[k]; } };
})();`;
})();

const MARK = { css: ["/* anima:css:start (generated by tools/figures/msk-exam4/build.mjs; edit the build, not this block) */", "/* anima:css:end */"],
  js: ["/* anima:js:start (generated by tools/figures/msk-exam4/build.mjs; edit the build, not this block) */", "/* anima:js:end */"] };
function replaceBlock(src, [a, b], body) {
  const i = src.indexOf(a), j = src.indexOf(b);
  if (i < 0 || j < i) throw new Error(`marker not found: ${a}`);
  return src.slice(0, i) + a + "\n" + body + "\n" + src.slice(j);
}

const hub = readFileSync(HUB, "utf8");
let out = replaceBlock(hub, MARK.css, css.trim());
out = replaceBlock(out, MARK.js, js);
if (process.argv.includes("--check")) {
  if (out !== hub) { console.error("hubs/msk-exam4: anima blocks are out of date; run node tools/figures/msk-exam4/build.mjs"); process.exit(1); }
  console.log("anima blocks up to date");
} else {
  if (out !== hub) writeFileSync(HUB, out);
  console.log(`hubs/msk-exam4: anima css ${(css.length / 1024).toFixed(1)} KB, js ${(js.length / 1024).toFixed(1)} KB${out === hub ? " (unchanged)" : ""}`);
}

if (process.argv.includes("--preview")) {
  // Standalone pages with the hub's own tokens, for anima's capture and line checks.
  const tokens = hub.slice(hub.indexOf(":root{"), hub.indexOf("html,body{"));
  mkdirSync(join(HERE, "dist"), { recursive: true });
  for (const theme of ["light", "dark"]) {
    for (const f of FIGS) {
      const stills = Object.keys(STILLS).filter((k) => STILLS[k].fig === f.id).map((k) => `<h3>${k}</h3><figure class="qcard-figure">@@STILL:${k}@@</figure>`).join("");
      const page = `<!doctype html><html lang="en" data-theme="${theme}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${f.title}</title><style>${tokens}
html,body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.55 system-ui,sans-serif}main{max-width:760px;margin:24px auto;padding:0 16px}h3{font:600 12px monospace;color:var(--ink-faint)}
${css}</style></head><body><main><div class="lec-figs" id="figs"></div><div id="stills">${stills}</div></main><script>${js}
document.getElementById("figs").innerHTML = ANIMA.html(${JSON.stringify(f.id)});
document.getElementById("stills").innerHTML = document.getElementById("stills").innerHTML.replace(/@@STILL:([a-z-]+)@@/g, function(m, k){ return ANIMA.still(k); });
ANIMA.mount(document);
</script></body></html>`;
      writeFileSync(join(HERE, "dist", `${f.id}-${theme}.html`), page);
    }
  }
  console.log("wrote dist/*-light.html, dist/*-dark.html");
}
