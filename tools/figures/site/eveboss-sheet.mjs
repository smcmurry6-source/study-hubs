/* A contact sheet of the exam-eve boss (eveboss.mjs), for Sam's look (needs Playwright; not part of the build or CI).

     node tools/figures/site/eveboss-sheet.mjs <out-dir>

   Writes eveboss-light.png and eveboss-dark.png (deviceScaleFactor 2): every state's scene (soon, up, hurt, low, down,
   away), the same states in the winter holidays' Santa hat, and the band's icon of each at 28, 40 and 64 px, on the light
   page and on the dark one. Draws from the source, so a sheet shows a drawing before the build is run. */
import { createRequire } from "node:module";
import { pathToFileURL, fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
const here = path.dirname(fileURLToPath(import.meta.url));
const [outDir = "."] = process.argv.slice(2);
let chromium; try { ({ chromium } = createRequire(import.meta.url)("playwright")); } catch (e) { ({ chromium } = createRequire("/opt/node-tools/")("playwright")); }
const imp = (f) => import(pathToFileURL(path.join(here, f)).href + "?t=" + Date.now());
const { INK, C } = await imp("style.mjs"), { evebossKit } = await imp("eveboss.mjs");
const K = evebossKit(INK, C);
const WHAT = { soon: "Soon: asleep until 6 pm", up: "Up: over 60% HP", hurt: "Hurt: 25 to 60%", low: "Low: 25% or less", down: "Down: the class won", away: "Away: midnight came first" };
function page(dark){
  const bg = dark ? "#17131c" : "#faf7f2", fg = dark ? "#efe9f2" : "#3B2E3A", card = dark ? "#231d2b" : "#fff";
  const cell = (st, hat) => `<figure><div class="sc">${K.scene(st, { hat })}</div><figcaption><b>${WHAT[st]}</b>${hat ? " · Santa hat" : ""}</figcaption></figure>`;
  const icons = K.STATES.map((st) => `<div class="ic">${[28, 40, 64].map((px) => `<span style="width:${px}px">${K.icon(st, {})}</span>`).join("")}<small>${st}</small></div>`).join("");
  return `<!doctype html><meta charset="utf-8"><style>
    body{margin:0;padding:28px;background:${bg};color:${fg};font:14px/1.4 system-ui,sans-serif}
    h1{font-size:20px;margin:0 0 4px}p{margin:0 0 18px;opacity:.8}
    .grid{display:grid;grid-template-columns:repeat(3,320px);gap:18px}
    figure{margin:0;background:${card};border-radius:14px;padding:8px;box-shadow:0 1px 3px rgba(0,0,0,.15)}
    .sc svg{display:block;width:320px;height:220px;border-radius:10px}
    figcaption{padding:6px 4px 2px;font-size:13px}
    .icons{display:flex;gap:18px;margin-top:22px;flex-wrap:wrap}
    .ic{display:flex;align-items:flex-end;gap:8px;background:${card};padding:10px;border-radius:12px}
    .ic span{display:inline-block}.ic svg{display:block;width:100%;height:auto}.ic small{opacity:.7;margin-left:4px}
  </style><h1>${K.NAME}: the exam-eve boss</h1><p>Every state as the Home card draws it (320 × 220), then in the winter holidays' Santa hat, then the band's icon at 28, 40 and 64 px.</p>
  <div class="grid">${K.STATES.map((s) => cell(s)).join("")}${K.STATES.map((s) => cell(s, "santa")).join("")}</div><div class="icons">${icons}</div>`;
}
fs.mkdirSync(outDir, { recursive: true });
const b = await chromium.launch();
for (const dark of [false, true]) {
  const p = await b.newPage({ viewport: { width: 1080, height: 800 }, deviceScaleFactor: 2 });
  await p.setContent(page(dark));
  const out = path.join(outDir, `eveboss-${dark ? "dark" : "light"}.png`);
  await p.screenshot({ path: out, fullPage: true }); await p.close();
  console.log("wrote " + out);
}
await b.close();
