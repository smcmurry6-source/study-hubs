/* A contact sheet of one set of Timmy's place, for whoever is drawing it (needs Playwright; not part of the build or CI).

     node tools/figures/site/pack-preview.mjs <set> <out.png> [dark] [only]

   <set> is a season's key in sets.mjs or "ranks". The sheet: the set's home in its scene by day and by night (every
   upgrade on, Timmy at the door in the first outfit), the home alone, each yard piece (its thumbnail, and placed in the
   yard), and each outfit on Timmy, large. [only] narrows it: "scene", "home", "yard" or "outfits". */
import { createRequire } from "node:module";
import { pathToFileURL, fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, "../../..");
const [set, out = "pack.png", dark = "", only = ""] = process.argv.slice(2);
if (!set) { console.error("usage: node pack-preview.mjs <set> <out.png> [dark] [scene|home|yard|outfits]"); process.exit(1); }
let chromium; try { ({ chromium } = createRequire(import.meta.url)("playwright")); } catch (e) { ({ chromium } = createRequire("/opt/node-tools/")("playwright")); }
const bust = "?t=" + Date.now(), imp = (f) => import(pathToFileURL(path.join(here, f)).href + bust);
const { INK, C } = await imp("style.mjs"), { placeKit } = await imp("place.mjs"), { SEASONS, RANKS } = await imp("sets.mjs");
const { pack } = await imp("packs/" + set + ".mjs");
const SETS = { seasons: SEASONS.map((s) => ({ k: s.k, n: s.n, when: s.when, gift: !!s.gift, items: s.items })), ranks: RANKS };
const K = placeKit(INK, C, [pack], SETS);
const art = JSON.parse(fs.readFileSync(path.join(root, "tools/preview/design/art.js"), "utf8").replace(/^[\s\S]*?window\.SH_ART = /, "").replace(/;\s*$/, ""));
const timmy = (art.timmy.moods.find((m) => m.k === "happy") || art.timmy.moods[0]).svg;
const inner = (svg) => svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const timmyG = (o) => '<g class="tp-tface"><svg x="-18" y="-46.1" width="36" height="47.2" viewBox="0 -30 200 262" overflow="visible">' + inner(o ? K.dress(timmy, o) : timmy) + "</svg></g>";
const mine = (list) => list.filter((x) => x.set === (set === "ranks" ? "rank" : set));
const homes = mine(K.HOMES), scenes = mine(K.SCENES), yard = mine(K.YARD), outfits = mine(K.OUTFITS);
const home = homes[0] ? homes[0].k : "cottage", scene = scenes[0] ? scenes[0].k : "hill", ups = Object.fromEntries(((homes[0] || {}).ups || []).map((k) => [k, true]));
const cells = [], add = (t, svg, w) => cells.push({ t, svg, w: w || 1 });
const want = (k) => !only || only === k;
if (want("scene") || want("home")) {
  add(scene + " + " + home + ", day", K.render({ home, scene, up: ups, tier: 3, timmy: { g: timmyG(outfits[0] && outfits[0].k), at: "door" } }).svg, 2);
  add("night", K.render({ home, scene, up: ups, night: true, tier: 5, timmy: { g: timmyG(outfits[1] && outfits[1].k), at: "door" } }).svg, 2);
  add(home + " bare, on the hill", K.render({ home, scene: "hill", tier: 1 }).svg, 2);
  if (scenes[0]) add(scene + " with the cottage", K.render({ home: "cottage", scene, tier: 1 }).svg, 2);
}
if (want("yard") && yard.length) {
  yard.forEach((y) => add("yard: " + y.k + " (" + y.rarity + ")", K.thumb("yard", y.k, { scene })));
  const slots = ["left", "front", "corner", "side", "right"], put = {}; yard.forEach((y, i) => { put[slots[i]] = y.k; });
  add("in the yard, day", K.render({ home, scene, yard: put, tier: 2, timmy: { g: timmyG(outfits[2] && outfits[2].k), at: "door" } }).svg, 2);
  add("in the yard, night", K.render({ home, scene, yard: put, night: true, tier: 2 }).svg, 2);
}
if (want("outfits")) outfits.forEach((o) => add("outfit: " + o.k + " (" + o.rarity + ")", '<svg viewBox="-10 -40 220 282" xmlns="http://www.w3.org/2000/svg">' + inner(K.dress(timmy, o.k)) + "</svg>"));
const bg = dark ? "#14181d" : "#f4f1ea", fg = dark ? "#eee" : "#222";
const html = `<!doctype html><meta charset=utf-8><style>body{margin:12px;background:${bg};color:${fg};font:12px sans-serif}
.g{display:grid;grid-template-columns:repeat(4,300px);gap:10px}.c{background:${dark ? "#1d232a" : "#fff"};border-radius:8px;padding:6px}.w2{grid-column:span 2}
.c svg{width:100%;height:auto;display:block}${K.CSS}</style><div class=g>` + cells.map((c) => `<div class="c${c.w > 1 ? " w2" : ""}"><div>${c.t}</div>${c.svg}</div>`).join("") + "</div>";
const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 4 * 322 + 24, height: 600 }, deviceScaleFactor: 1 });
await p.emulateMedia({ reducedMotion: "reduce" });
await p.setContent(html); await p.screenshot({ path: out, fullPage: true }); await b.close();
console.log("wrote " + out + ": " + homes.length + " home, " + scenes.length + " scene, " + yard.length + " yard, " + outfits.length + " outfits");
