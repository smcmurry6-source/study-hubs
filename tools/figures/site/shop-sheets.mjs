/* Contact sheets of the shop's art, for Sam's look (needs Playwright; not part of the build or CI).

     node tools/figures/site/shop-sheets.mjs <out-dir> [shelf|outfits|homes]

   Writes each sheet twice, on the light page and on the dark one (deviceScaleFactor 2):
     shop-shelf-{light,dark}.png     the Shiny Gold Crown at 16, 24 and 48 px, the four snacks and two boosts, and one
                                     sample card in each of the five rarity frames (shop.mjs);
     shop-outfits-{light,dark}.png   the five everyday outfits and the five rare costumes on Timmy, large, and each
                                     again with the Loupes journey's loupes (place.mjs: OUTFITS, NO_LOUPES);
     shop-homes-{light,dark}.png     every home (the everyday ones and each set's) as the card draws it: Timmy at the
                                     door, the statue at Dark Matter on three steps and again as the ModuPro on its
                                     pedestal, the garden in the yard's left spot, each beside a close-up of the door.
   It draws from the sources (place.mjs, shop.mjs, the packs), not from the built files, so a sheet shows a drawing
   before the build is run. Timmy is the live one from tools/preview/design/art.js (widget/pet.js's drawing). */
import { createRequire } from "node:module";
import { pathToFileURL, fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, "../../..");
const [outDir = ".", only = ""] = process.argv.slice(2);
let chromium; try { ({ chromium } = createRequire(import.meta.url)("playwright")); } catch (e) { ({ chromium } = createRequire("/opt/node-tools/")("playwright")); }
const bust = "?t=" + Date.now(), imp = (f) => import(pathToFileURL(path.join(here, f)).href + bust);
const { INK, C } = await imp("style.mjs"), { placeKit } = await imp("place.mjs"), { SEASONS, RANKS } = await imp("sets.mjs");
let shopKit = null; try { ({ shopKit } = await imp("shop.mjs")); } catch (e) { if (e.code !== "ERR_MODULE_NOT_FOUND") throw e; }
const SETS = { seasons: SEASONS.map((s) => ({ k: s.k, n: s.n, when: s.when, gift: !!s.gift, items: s.items })), ranks: RANKS };
const PACKS = [];
for (const k of SEASONS.map((s) => s.k).concat(["ranks"])) { const f = path.join(here, "packs", k + ".mjs"); if (fs.existsSync(f)) PACKS.push((await imp("packs/" + k + ".mjs")).pack); }
const K = placeKit(INK, C, PACKS, SETS), SHOP = shopKit ? shopKit(INK, C) : null;
const art = JSON.parse(fs.readFileSync(path.join(root, "tools/preview/design/art.js"), "utf8").replace(/^[\s\S]*?window\.SH_ART = /, "").replace(/;\s*$/, ""));
const timmy = (art.timmy.moods.find((m) => m.k === "happy") || art.timmy.moods[0]).svg;
const inner = (svg) => svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const big = (k, x) => '<svg viewBox="-10 -44 220 286" xmlns="http://www.w3.org/2000/svg">' + inner(K.dress(timmy, k, x)) + "</svg>";
const timmyG = (k) => '<g class="tp-tface"><svg x="-18" y="-46.1" width="36" height="47.2" viewBox="0 -30 200 262" overflow="visible">' + inner(k ? K.dress(timmy, k) : timmy) + "</svg></g>";
const price = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const coinSvg = (px) => SHOP ? SHOP.coin(px) : "";

const sheets = {};
/* (a) the shelf: the coin, the six shelf items, a card in each frame */
if (SHOP) sheets.shelf = () => {
  const coins = [16, 24, 48].map((px) => `<div class="coin"><span class="num" style="font-size:${Math.max(13, px * .62)}px">${coinSvg(px)}<b>${px === 16 ? "1,250" : px === 24 ? "320" : "20"}</b></span><small>${px} px</small></div>`).join("") +
    `<div class="coin"><span>${coinSvg(120)}</span><small>large</small></div>`;
  const items = SHOP.ITEMS.map((it) => `<figure><div class="thumb">${SHOP.thumb(it.id)}</div><figcaption><b>${esc(it.n)}</b><span>${esc(it.note)}</span><span class="pr">${coinSvg(16)}${price(it.price)} · ${esc(it.rarity)}</span></figcaption></figure>`).join("");
  const sample = { Common: ["shop", "apple"], Uncommon: ["shop", "floss"], Rare: ["shop", "boost-1h"], Epic: ["outfit", "pirate"], Legendary: ["outfit", "captain-enamel"] };
  const cards = SHOP.RARITIES.map((r) => {
    const s = sample[r.k], it = s[0] === "shop" ? SHOP.ITEMS.find((x) => x.id === s[1]) : K.OUTFITS.find((x) => x.k === s[1]) || { n: s[1], price: r.band[0] };
    const th = s[0] === "shop" ? SHOP.thumb(s[1]) : big(s[1]);
    return `<figure class="cardfig"><div class="card">${SHOP.frame(r.k)}<span class="cprice">${coinSvg(16)}${price(it.price)}</span><span class="cthumb">${th}</span><span class="ctext"><b>${esc(String(it.n).replace(/^(The|A|An) /, "").replace(/^./, (c) => c.toUpperCase()))}</b><i style="background:${r.ink}">${r.k}</i></span></div><figcaption><b>${r.k}</b><span>${price(r.band[0])} to ${price(r.band[1])}</span></figcaption></figure>`;
  }).join("");
  return `<h1>The shop's shelf art</h1><h2>The Shiny Gold Crown, beside a number</h2><div class="row coins">${coins}</div><h2>Always on the shelf: four snacks, two boosts</h2><div class="row items">${items}</div><h2>A card in each rarity's frame</h2><div class="row cards">${cards}</div>`;
};
/* (b) the ten outfits, large, and each again with loupes */
sheets.outfits = () => {
  const want = ["scrub-cap", "bow-tie", "safety-glasses", "white-coat", "graduation-cap", "pirate", "astronaut", "detective", "chef", "captain-enamel"];
  const list = want.map((k) => K.OUTFITS.find((o) => o.k === k)).filter(Boolean);
  if (!list.length) return "<h1>The ten outfits</h1><p>None drawn yet.</p>";
  const cell = (o, lp) => `<figure><div class="tim">${big(o.k, lp ? { loupes: 4 } : null)}</div><figcaption><b>${esc(o.n)}</b><span>${o.costume ? "Rare costume" : "Everyday outfit"} · ${esc(o.rarity)} · ${price(o.price)}</span>${lp ? `<span>${K.NO_LOUPES.indexOf(o.k) < 0 ? "with the loupes (Gold)" : "its own eyewear: no loupes"}</span>` : ""}</figcaption></figure>`;
  const half = (a, title) => `<h2>${title}</h2><div class="row tims">${a.map((o) => cell(o, false)).join("")}</div><div class="row tims">${a.map((o) => cell(o, true)).join("")}</div>`;
  return "<h1>Ten outfits on Timmy</h1>" + half(list.filter((o) => !o.costume), "Five everyday outfits, then the same in the Loupes journey") + half(list.filter((o) => o.costume), "Five rare costumes, then the same in the Loupes journey");
};
/* (c) every home as the card draws it, Timmy at the door, each beside a close-up of the door */
sheets.homes = () => {
  const view = (h, journey, close) => {
    const scene = (K.SCENES.find((s) => h.set && s.set === h.set) || { k: h.theme && (K.THEMES.find((t) => t.k === h.theme) || {}).scene || "hill" }).k;
    const o = { home: h.k, scene, viewBox: K.CARD, tier: 6, level: 3, journey, yard: { left: "garden" }, timmy: { g: timmyG(""), at: "door" } };
    if (close) { const L = K.layout(o), d = K.project(L.spots.door[0], L.spots.door[1], 0); o.viewBox = [d[0] - 68, d[1] - 74, 126, 111.5]; }
    return `<div class="pic${close ? " close" : ""}">${K.render(o).svg}</div>`;
  };
  const cell = (h) => `<figure><div class="quad">${view(h, 0)}${view(h, 0, true)}${view(h, 1)}${view(h, 1, true)}</div><figcaption><b>${esc(h.n)}</b><span>The card and a close-up of its door: Dark Matter on three steps, then the ModuPro on its pedestal with the finished handpiece at its corner</span></figcaption></figure>`;
  return "<h1>Timmy at the door of every home</h1><h2>As the card draws it, the garden in the yard's left spot. Each home twice: the rank statue at Dark Matter on three steps, then past the Handpiece</h2><div class=\"row homes\">" + K.HOMES.map(cell).join("") + "</div>";
};

const page = (body, dark) => `<!doctype html><meta charset=utf-8><style>
body{margin:0;padding:22px 24px 28px;background:${dark ? "#14181d" : "#f4f1ea"};color:${dark ? "#ECEEF1" : "#2B2230"};font:13px/1.35 "Nunito Sans",system-ui,sans-serif}
h1{font-size:22px;margin:0 0 4px}h2{font-size:14px;font-weight:700;margin:18px 0 10px;color:${dark ? "#AEB6C0" : "#6B5A68"}}
.row{display:flex;flex-wrap:wrap;gap:12px}figure{margin:0}figcaption{display:flex;flex-direction:column;gap:1px;margin-top:6px}figcaption span{color:${dark ? "#AEB6C0" : "#6B5A68"};font-size:12px}
svg{display:block}
.coins{gap:34px;align-items:flex-end}.coin{display:flex;flex-direction:column;gap:6px;align-items:flex-start}.coin .num{display:inline-flex;align-items:center;gap:.28em;font-weight:800;font-variant-numeric:tabular-nums}.coin small{color:${dark ? "#AEB6C0" : "#6B5A68"}}
.items figure{width:150px}.thumb{background:${dark ? "#1d232a" : "#fff"};border-radius:12px;padding:10px}.thumb svg{width:100%;height:auto}.pr{display:inline-flex!important;flex-direction:row;align-items:center;gap:4px;font-weight:700}
.cards figure{width:172px}.card{position:relative;aspect-ratio:4/5;color:#3B2E3A}.card>svg{position:absolute;inset:0;width:100%;height:100%}
.cprice{position:absolute;left:5%;top:4.5%;display:inline-flex;align-items:center;gap:3px;padding:2px 7px 2px 4px;border-radius:999px;background:#fff;border:1.5px solid #3B2E3A;font-weight:800;font-size:12px;z-index:1}
.cthumb{position:absolute;left:14%;right:14%;top:9%;height:50%}.cthumb svg{width:100%;height:100%}
.ctext{position:absolute;left:8%;right:8%;top:63%;bottom:7%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;text-align:center}.ctext b{font-size:13px;line-height:1.1}.ctext i{font-style:normal;font-size:11px;font-weight:800;color:#fff;border-radius:999px;padding:1px 7px}
.tims figure{width:188px}.tim{background:${dark ? "#1d232a" : "#fff"};border-radius:12px;padding:6px}.tim svg{width:100%;height:auto}
.homes{gap:18px 24px}.homes figure{width:914px}.quad{display:flex;gap:6px}.pic{border-radius:10px;overflow:hidden;width:222px;flex:none}.pic svg{width:100%;height:auto}
${K.CSS}${SHOP && SHOP.CSS ? SHOP.CSS : ""}</style>${body}`;

const b = await chromium.launch();
for (const [name, make] of Object.entries(sheets)) {
  if (only && only !== name) continue;
  const body = make();
  for (const dark of [false, true]) {
    const p = await b.newPage({ viewport: { width: name === "homes" ? 1900 : 1060, height: 600 }, deviceScaleFactor: 2 });
    await p.emulateMedia({ reducedMotion: "reduce", colorScheme: dark ? "dark" : "light" });
    await p.setContent(page(body, dark));
    const out = path.join(outDir, "shop-" + name + "-" + (dark ? "dark" : "light") + ".png");
    await p.screenshot({ path: out, fullPage: true }); await p.close();
    console.log("wrote " + out);
  }
}
await b.close();
