#!/usr/bin/env node
/* Builds the site's art into the files that draw it:
   - tools/preview/design/art.js (window.SH_ART): everything, for the design preview page;
   - widget/hub-art.js (window.SH_HUB_ART): what the hub engine (widget/hub.js) draws on every page: the icon set, the
     streak flame, the XP spark and Home's spot art (spots.mjs: Timmy Time's host in headphones, the notes, the Today
     calendar) (redesign phase 1);
   - widget/hub-art/<hub>.js: one hub's tint, emblem, masthead scene and arcade lobby art (arcade.mjs), loaded by that
     hub's page only.

     node tools/figures/site/build.mjs           write them all
     node tools/figures/site/build.mjs --check   fail if any is stale (CI-friendly)

   What goes in:
   - the drawings in this folder: icons.mjs, emblems.mjs, mastheads.mjs, medals.mjs, rewards.mjs (all hand-drawn SVG in
     Timmy's ink style, style.mjs);
   - Timmy, his house and the handpiece medallions AS THEY ARE DRAWN TODAY, rendered by the live code itself
     (shPet.art and shPet.house in widget/pet.js, shRanks.art in widget/ranks.js) inside a sandbox with no network and
     no page, so the preview shows exactly what students see. Holiday outfits and the season are passed in explicitly,
     so the output doesn't change with the date. */
import vm from "node:vm";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const OUT = path.join(root, "tools/preview/design/art.js");
const check = process.argv.includes("--check");
const draft = process.argv.includes("--draft");   // while drawings are in progress: missing modules become empty (never commit a draft build)
async function load(f, empty){ try { return await import(f); } catch (e) { if (draft && e.code === "ERR_MODULE_NOT_FOUND") return empty; throw e; } }

const { INK, C, TINTS, HUBS } = await import("./style.mjs");
const { ICONS } = await load("./icons.mjs", { ICONS: {} });
const { EMBLEMS } = await load("./emblems.mjs", { EMBLEMS: {} });
const { MASTHEADS } = await load("./mastheads.mjs", { MASTHEADS: {} });
const { medal, TROPHIES, silhouette, MEDAL_LEVELS } = await load("./medals.mjs", { medal: () => "", TROPHIES: {}, silhouette: () => "", MEDAL_LEVELS: ["Bronze", "Silver", "Gold", "Crown"] });
const { FLAME, XP } = await import("./rewards.mjs");
const { arcadeArt, ARCADE_VIEWBOX } = await load("./arcade.mjs", { arcadeArt: () => null, ARCADE_VIEWBOX: [0, 0, 320, 170] });
const { HEADPHONES, NOTES, NOTES_VIEWBOX, TODAY, TODAY_VIEWBOX } = await load("./spots.mjs", { HEADPHONES: "", NOTES: "", NOTES_VIEWBOX: [0, 0, 1, 1], TODAY: "", TODAY_VIEWBOX: [0, 0, 1, 1] });

/* ---------- the live widget code, in a sandbox ---------- */
function sandbox(){
  const store = {};
  const el = () => ({ style: {}, setAttribute(){}, appendChild(){}, addEventListener(){}, classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    querySelector(){ return null; }, querySelectorAll(){ return []; } });
  const win = {
    /* pet.js picks a holiday's outfit at random on first sight (sh_pet_outfit_<holiday>); "-1" makes it the first one, so
       the build is the same every run */
    localStorage: { getItem: (k) => (k in store ? store[k] : /^sh_pet_outfit_/.test(k) ? "-1" : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } },
    matchMedia: () => ({ matches: false, addEventListener(){} }), addEventListener(){}, setTimeout, clearTimeout, setInterval(){}, console,
    document: { createElement: el, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], addEventListener(){},
      head: el(), body: el(), documentElement: el(), readyState: "complete" },
    navigator: { userAgent: "node" }, location: { href: "http://localhost/", search: "", hostname: "localhost" }, Intl, Date, Math, JSON
  };
  win.window = win; win.self = win;
  const ctx = vm.createContext(win);
  for (const f of ["widget/pet.js", "widget/ranks.js"]) vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx, { filename: f });
  return win;
}
const W = sandbox();
const pet = (state) => W.shPet.art(Object.assign({ hat: "" }, state), 200);
const house = (deco) => W.shPet.house(Object.assign({ flair: [], holiday: "", fall: false }, deco));

const timmy = {
  moods: ["happy", "ok", "sad", "sick", "sleep", "scared"].map((m) => ({ k: m, svg: pet({ hp: 85, mood: m }) })),
  hp: [100, 65, 50, 35, 20, 8, 0].map((hp) => ({ hp, conditions: W.shPet.conditions(hp), svg: pet({ hp }) })),
  outfits: ["thanksgiving", "winter", "halloween"].map((h) => ({ k: h, svg: pet({ hp: 85, hat: h }) })),
  bar: { happy: pet({ hp: 82, mood: "happy" }), ok: pet({ hp: 82, mood: "ok" }), scared: pet({ hp: 82, mood: "scared" }), sad: pet({ hp: 82, mood: "sad" }) }
};
const houses = [
  { k: "Stone", note: "A new tooth buddy", deco: { tier: 0 } },
  { k: "Bronze", note: "Picket fence and mailbox, one pennant", deco: { tier: 2, flair: [{ hub: "perio", lvl: 2 }] } },
  { k: "Gold", note: "Gold trim and door, in the fall", deco: { tier: 4, flair: [{ hub: "occlusion", lvl: 3 }, { hub: "perio", lvl: 1 }], fall: true } },
  { k: "Dark Matter", note: "A night sky of his own, crowned", deco: { tier: 6, flair: [{ hub: "occlusion", lvl: 4 }, { hub: "pcd-implants-exam1", lvl: 3 }, { hub: "perio", lvl: 2 }] } }
].map((h) => ({ k: h.k, note: h.note, svg: house(h.deco), timmy: pet({ hp: 90, mood: "happy" }) }));
/* Timmy Time's host for the Home card: the live Timmy drawing with the headphones from spots.mjs over him. His
   gradients' ids are renamed so they can't collide with the Timmy pet.js draws on the same page (shpt<n>-). */
const host = pet({ hp: 90, mood: "happy" });
const spots = {
  timmyTime: { vb: host.match(/viewBox="([^"]+)"/)[1], body: host.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "").replace(/shpt\d+-/g, "shxtt-") + HEADPHONES },
  notes: { vb: NOTES_VIEWBOX.join(" "), body: NOTES },
  today: { vb: TODAY_VIEWBOX.join(" "), body: TODAY }
};
const handpieces = W.shRanks.TIERS.map((t, i) => ({ k: t.key, name: t.name, at: t.at, svg: W.shRanks.art(i, 96) }));

/* ---------- trophies: names and clues from the live lists ---------- */
const meta = {};
for (const t of [].concat(W.shRanks.TROPHIES, W.shRanks.HUB_TROPHIES)) if (!meta[t.k]) meta[t.k] = { name: t.n, desc: t.d, secret: !!t.secret, clue: t.clue || "" };
const trophies = {};
for (const k of Object.keys(TROPHIES)) {
  if (!meta[k]) throw new Error("medals.mjs draws a trophy ranks.js doesn't have: " + k);
  trophies[k] = Object.assign({ body: TROPHIES[k].body, sil: silhouette(k) }, meta[k]);
}
const missing = Object.keys(meta).filter((k) => !/^mastery-/.test(k) && !trophies[k]);
if (missing.length && !draft) throw new Error("medals.mjs is missing trophies: " + missing.join(", "));
const medals = {};
for (const h of HUBS) medals[h] = [1, 2, 3, 4].map((l) => medal(l, h));

/* ---------- checks: the house style holds ---------- */
const all = [];
const add = (where, s) => all.push([where, s]);
for (const [k, v] of Object.entries(ICONS)) add("icon " + k, v.body);
for (const [k, v] of Object.entries(EMBLEMS)) add("emblem " + k, v.body);
for (const [k, v] of Object.entries(MASTHEADS)) add("masthead " + k, v.body);
for (const [h, ms] of Object.entries(medals)) ms.forEach((m, i) => add("medal " + h + " " + (i + 1), m));
for (const [k, v] of Object.entries(trophies)) { add("trophy " + k, v.body); add("silhouette " + k, v.sil); }
for (const [k, v] of Object.entries(FLAME)) add("flame " + k, v);
add("xp", XP);
const arcades = {};
for (const h of HUBS) { const a = arcadeArt(h, TINTS[h]); if (a) arcades[h] = a; }
for (const [h, g] of Object.entries(arcades)) for (const [k, v] of Object.entries(g)) add("arcade " + h + " " + k, v.body);
add("spot headphones", HEADPHONES); add("spot notes", NOTES); add("spot today", TODAY);
const bad = [];
for (const [w, s] of all) {
  if (/\sid=|url\(#|Gradient|<filter|<text|<style|<image|<script|on[a-z]+=/i.test(s)) bad.push(w + ": ids, gradients, filters, text, images or script");
  if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(s)) bad.push(w + ": emoji");
}
if (!draft) for (const h of HUBS) { if (!EMBLEMS[h]) bad.push("no emblem for " + h); if (!MASTHEADS[h]) bad.push("no masthead for " + h); }
if (bad.length) { console.error(bad.join("\n")); process.exit(1); }

const data = {
  ink: INK, fills: C, tints: TINTS, hubs: HUBS,
  icons: ICONS, emblems: EMBLEMS, mastheads: MASTHEADS,
  medalLevels: MEDAL_LEVELS, medals, trophies,
  flame: FLAME, xp: XP,
  timmy, houses, handpieces, spots, arcades, arcadeViewBox: ARCADE_VIEWBOX
};
const text = "/* Generated by tools/figures/site/build.mjs from the drawings in tools/figures/site/ and the live widget code\n" +
  "   (Timmy, his house and the handpieces). Do not edit: change the drawing and run the build. */\n" +
  "window.SH_ART = " + JSON.stringify(data) + ";\n";

/* the hub engine's art: shared pieces once, each hub's own in its own file */
const outs = [[OUT, text]];
const engineHead = "/* Generated by tools/figures/site/build.mjs from the drawings in tools/figures/site/. Do not edit: change the drawing and run the build. */\n";
outs.push([path.join(root, "widget/hub-art.js"), engineHead + "window.SH_HUB_ART = " + JSON.stringify({ ink: INK, icons: ICONS, flame: FLAME, xp: XP, spots: spots }) + ";\n"]);
for (const h of HUBS) {
  if (!EMBLEMS[h] || !MASTHEADS[h]) continue;
  outs.push([path.join(root, "widget/hub-art/" + h + ".js"), engineHead + "window.SH_HUB_ART_HUB = " +
    JSON.stringify(Object.assign({ hub: h, tint: TINTS[h], emblem: EMBLEMS[h], masthead: MASTHEADS[h] }, arcades[h] ? { games: arcades[h], gamesViewBox: ARCADE_VIEWBOX.join(" ") } : {})) + ";\n"]);
}
if (check) {
  const stale = outs.filter(([f, t]) => !fs.existsSync(f) || fs.readFileSync(f, "utf8") !== t).map(([f]) => path.relative(root, f));
  if (stale.length) { console.error("stale: " + stale.join(", ") + "\nrun node tools/figures/site/build.mjs"); process.exit(1); }
  console.log("art.js, widget/hub-art.js and widget/hub-art/ are up to date");
} else {
  fs.mkdirSync(path.join(root, "widget/hub-art"), { recursive: true });
  for (const [f, t] of outs) fs.writeFileSync(f, t);
  console.log("wrote " + path.relative(root, OUT) + " (" + Math.round(text.length / 1024) + " KB): " +
    Object.keys(ICONS).length + " icons, " + Object.keys(EMBLEMS).length + " emblems, " + Object.keys(MASTHEADS).length + " mastheads, " +
    Object.keys(trophies).length + " trophies, " + HUBS.length * 4 + " medals, " + (timmy.moods.length + timmy.hp.length + timmy.outfits.length) + " Timmys, " +
    houses.length + " houses, " + handpieces.length + " handpieces; and the hub engine's art (" + (outs.length - 1) + " files)");
}
