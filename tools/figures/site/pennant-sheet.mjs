/* A contact sheet of the weekly pennants (pennant.mjs), for whoever draws them (needs Playwright; not part of the build or CI).

     node tools/figures/site/pennant-sheet.mjs <out.png> [dark] [from] [to]

   Every Monday from <from> to <to> (default: the school year 2026-27, August 3 to July 26), one card each with its date,
   then the same pennant small (the size Home's Today and the place's pole draw it), and a dimmed one (a week still to
   earn). Look at it whenever a pennant changes: the build can't tell that a badge doesn't read as its name. */
import { createRequire } from "node:module";
import { pathToFileURL, fileURLToPath } from "node:url";
import path from "node:path";
const here = path.dirname(fileURLToPath(import.meta.url));
const [out = "pennants.png", dark = "", from = "2026-08-03", to = "2027-07-26"] = process.argv.slice(2);
let chromium; try { ({ chromium } = createRequire(import.meta.url)("playwright")); } catch (e) { ({ chromium } = createRequire("/opt/node-tools/")("playwright")); }
const bust = "?t=" + Date.now(), imp = (f) => import(pathToFileURL(path.join(here, f)).href + bust);
const { INK, C } = await imp("style.mjs"), { pennantKit } = await imp("pennant.mjs");
const K = pennantKit(INK, C), weeks = K.mondays(from, to);
const bg = dark === "dark" ? "#14181d" : "#f4f1ea", fg = dark === "dark" ? "#eee" : "#222", card = dark === "dark" ? "#1d232a" : "#fff";
const cell = (k) => { const g = K.design(k); return `<div class=c>${K.svg(k, 150)}<div class=s>${K.svg(k, 36)}${K.svg(k, 22)}${K.svg(k, 36, { dim: true })}</div><div>${k}</div><small>${g.name} #${g.nth} · ${g.badge} · ${g.year}-${String(g.year + 1).slice(2)}</small></div>`; };
const html = `<!doctype html><meta charset=utf-8><style>body{margin:12px;background:${bg};color:${fg};font:12px sans-serif}
.g{display:grid;grid-template-columns:repeat(8,168px);gap:8px}.c{background:${card};border-radius:8px;padding:6px}.s{display:flex;gap:6px;align-items:end;margin:4px 0}
small{opacity:.7;display:block}</style><div class=g>` + weeks.map(cell).join("") + "</div>";
const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 8 * 176 + 24, height: 600 }, deviceScaleFactor: 1 });
await p.setContent(html); await p.screenshot({ path: out, fullPage: true }); await b.close();
console.log("wrote " + out + ": " + weeks.length + " pennants");
