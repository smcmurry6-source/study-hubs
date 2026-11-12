#!/usr/bin/env node
/* Builds the site's art into the files that draw it:
   - tools/preview/design/art.js (window.SH_ART): everything, for the design preview page;
   - widget/hub-art.js (window.SH_HUB_ART): what the hub engine (widget/hub.js) draws on every page: the icon set, the
     streak flame, the XP spark and Home's spot art (spots.mjs: Timmy Time's host in headphones, the notes, the Today
     calendar) (redesign phase 1);
   - widget/hub-art/<hub>.js: one hub's tint, emblem, masthead scene and arcade lobby art (arcade.mjs), loaded by that
     hub's page only;
   - widget/hub-art/dash.js (window.SH_DASH_ART): every hub's tint and emblem, for the new dashboard (widget/dash.js);
   - widget/hub-art/class.js (window.SH_CLASS_ART): the new dashboard's drawn parts, as kits the page draws at its own
     size: the classroom of the studying-now tile (classroom.mjs), the leaderboard's stage (stage.mjs) and the recap's
     bar graph and crowd (recap.mjs), with the recap's icons (six trophy drawings) and its climber's hat;
   - widget/hub-art/board.js (window.SH_BOARD_ART): the idea board's drawings as a kit (board.mjs): the cork, the pins,
     the six kinds, the rosette, the bulb, the pad's binding. Loaded by widget/ideas.js;
   - widget/hub-art/outfits.js (window.SH_OUTFITS): the shop's 55 outfits and dress(), from place.mjs, so the dashboard
     can put one on a Timmy from widget/pet.js. Loaded only when someone on the page wears one.

     node tools/figures/site/build.mjs           write them all
     node tools/figures/site/build.mjs --check   fail if any is stale (CI-friendly)

   What goes in:
   - the drawings in this folder: icons.mjs, emblems.mjs, mastheads.mjs, medals.mjs, rewards.mjs (all hand-drawn SVG in
     Timmy's ink style, style.mjs);
   - Timmy's place (place.mjs, redesign phase 4 part C): a kit, not a picture, so its source goes into
     tools/preview/design/place.js (window.SH_PLACE) as is, after every combination it can draw is checked here;
   - Timmy, his house and the handpiece medallions AS THEY ARE DRAWN TODAY, rendered by the live code itself
     (shPet.art and shPet.house in widget/pet.js, shRanks.art in widget/ranks.js) inside a sandbox with no network and
     no page, so the preview shows exactly what students see. Holiday outfits and the season are passed in explicitly,
     so the output doesn't change with the date. */
import vm from "node:vm";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

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
const { placeKit } = await load("./place.mjs", { placeKit: null });
/* the new dashboard's drawn parts (kits, like the place: the page draws them at its own size) */
const { classroomKit } = await import("./classroom.mjs");
const { boardKit } = await import("./board.mjs");
const { stageKit } = await import("./stage.mjs");
const { recapKit } = await import("./recap.mjs");
/* the sets of Timmy's place: sets.mjs lists every piece (the shop's catalog has the same rows), and each set's drawings
   are one pack in packs/<set>.mjs (a function handed the kit's tools). A set with no pack yet isn't drawn; --strict fails on one. */
const { SEASONS, RANKS } = await import("./sets.mjs");
const SETS = { seasons: SEASONS.map((s) => ({ k: s.k, n: s.n, when: s.when, gift: !!s.gift, items: s.items })), ranks: RANKS };
const PACKS = [], onlyPack = process.argv.includes("--pack") ? process.argv[process.argv.indexOf("--pack") + 1] : "";   // --pack <set> --dry: check one set while drawing it, write nothing
for (const k of SEASONS.map((s) => s.k).concat(["ranks"]).filter((k) => !onlyPack || k === onlyPack)) {
  const file = path.join(path.dirname(fileURLToPath(import.meta.url)), "packs", k + ".mjs");
  if (fs.existsSync(file)) PACKS.push({ k, pack: (await import(pathToFileURL(file).href)).pack });
}

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
const all = [], bad = [];
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
/* Timmy's place: draw every home in every scene, day and night, bare and fully dressed, every holiday and season, the
   customizer's thumbnails, rarity frames, placing bursts and Timmy's outfits, and hold each to the house style (the root
   <svg> is the kit's own, so it is checked without it). Then walk Timmy: from his door to every spot and back, in every
   home and scene with the yard empty, full and with the lane, his way must go round everything and stay on the ground. */
let placeCount = 0, routeCount = 0;
if (placeKit) {
  const K = placeKit(INK, C, PACKS.map((x) => x.pack), SETS), items = K.YARD.filter((y) => !y.wide && !y.set).map((y) => y.k), slots = K.SLOTS.map((x) => x.k);
  /* every piece a set lists is drawn by its pack, as the kind the list says, and a pack draws nothing the list doesn't have */
  const want = {}, kinds = { home: K.HOMES, scene: K.SCENES, yard: K.YARD, outfit: K.OUTFITS };
  for (const se of SEASONS) for (const it of se.items) want[it.id] = { kind: it.kind, set: se.k };
  for (const r of RANKS) { want[r.outfit[0]] = { kind: "outfit", set: "ranks" }; want[r.yard[0]] = { kind: "yard", set: "ranks" }; }
  const drawnSets = new Set(PACKS.map((x) => x.k)), missing = [...new Set(Object.values(want).map((w) => w.set))].filter((k) => !drawnSets.has(k));
  for (const [id, w] of Object.entries(want)) if (drawnSets.has(w.set) && !kinds[w.kind].some((x) => x.k === id)) bad.push("set " + w.set + ": " + w.kind + " " + id + " isn't drawn (packs/" + w.set + ".mjs)");
  for (const [kind, list] of Object.entries(kinds)) for (const x of list) if (x.set && !(want[x.k] && want[x.k].kind === kind)) bad.push("pack piece " + x.k + " (" + kind + ") isn't in sets.mjs");
  if (missing.length && process.argv.includes("--strict")) bad.push("sets not drawn yet: " + missing.join(", "));
  if (missing.length && !onlyPack) console.log("sets not drawn yet: " + missing.join(", "));
  const builtIn = (x) => !x.set;
  const fill = (shift) => { const y = {}; slots.forEach((k, i) => { y[k] = items[(i + shift) % items.length]; }); return y; };
  const ups = (h) => Object.fromEntries(h.ups.map((k) => [k, true]));
  const flair = [{ hub: "a", lvl: 4 }, { hub: "b", lvl: 3 }, { hub: "c", lvl: 2 }, { hub: "d", lvl: 1 }, { hub: "e", lvl: 3, tint: "#3FA7E0" }, { hub: "f", lvl: 2 }];
  const combos = [];
  /* the built-in homes in every built-in scene; a set's home in the hill and in its own scene, a set's scene with the cottage and its own home */
  const pairs = [];
  K.HOMES.forEach((h, hi) => K.SCENES.forEach((sc, si) => { if ((builtIn(h) && builtIn(sc)) || (h.set && (sc.k === "hill" || sc.set === h.set)) || (sc.set && h.k === "cottage")) pairs.push([h, sc, hi, si]); }));
  pairs.forEach(([h, sc, hi, si]) => [false, true].forEach((night) => {
    combos.push({ home: h.k, scene: sc.k, night, tier: 0 });
    combos.push({ home: h.k, scene: sc.k, night, tier: 6, level: 3, up: ups(h), paint: K.PAINTS[(hi + si) % K.PAINTS.length].k, yard: fill(hi + si), flair, marks: true });
    combos.push({ home: h.k, scene: sc.k, night, tier: (hi + si) % 6, level: 1 + (hi % 3), yard: Object.assign(fill(hi), { side: "lane" }), flair: flair.slice(0, 2) });
  }));
  /* a set's yard pieces, in the yard of their own scene (or the hill), day and night */
  K.YARD.filter((y) => y.set).forEach((y, i) => { const sc = K.SCENES.find((x) => x.set === y.set) || { k: "hill" }, hm = K.HOMES.find((x) => x.set === y.set) || { k: "cottage" };
    [false, true].forEach((night) => combos.push({ home: hm.k, scene: sc.k, night, tier: 2, yard: { [slots[i % slots.length]]: y.k, [slots[(i + 2) % slots.length]]: y.k } })); });
  ["", "halloween", "thanksgiving", "winter", "newyear", "valentine", "dentist", "stpatrick", "easter"].forEach((hol) => ["", "fall", "spring"].forEach((season) =>
    K.HOMES.filter(builtIn).forEach((h) => combos.push({ home: h.k, scene: "hill", holiday: hol, season, tier: 3, yard: fill(1) }))));
  for (const c of combos) {
    const r = K.render(c), body = r.svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
    if (/NaN|undefined|Infinity/.test(r.svg)) bad.push("place " + JSON.stringify(c) + ": NaN or undefined in the drawing");
    add("place " + [c.home, c.scene, c.night ? "night" : "day", c.holiday || "", c.season || ""].join(" "), body);
    placeCount++;
  }
  const art = [];
  K.YARD.forEach((y) => K.SCENES.forEach((sc) => { if (builtIn(sc) || sc.set === y.set) art.push(["thumb " + y.k + " " + sc.k, K.thumb("yard", y.k, { scene: sc.k })]); }));
  pairs.forEach(([h, sc]) => art.push(["thumb " + h.k + " " + sc.k, K.thumb("home", h.k, { scene: sc.k, up: ups(h) })]));
  K.SCENES.forEach((sc) => art.push(["thumb " + sc.k, K.thumb("scene", sc.k)]));
  K.RARITIES.forEach((r) => { art.push(["frame " + r.k, K.frame(r.k)]); art.push(["burst " + r.k, K.burst(r.k)]); });
  art.push(["coin", K.coin()]);
  K.OUTFITS.forEach((o) => { const p = K.outfitParts(o.k); art.push(["outfit " + o.k, p.back + p.face + p.top]); });
  for (const [w, svg] of art) {
    if (/NaN|undefined|Infinity/.test(svg)) bad.push(w + ": NaN or undefined in the drawing");
    add(w, svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, ""));
    placeCount++;
  }
  /* every outfit goes on the live Timmy: its layers land inside his drawing */
  for (const o of K.OUTFITS) { const t = pet({ hp: 85 }), d = K.dress(t, o.k); if (d === t || !/<\/g><\/svg>$/.test(d)) bad.push("outfit " + o.k + ": dress() didn't fit Timmy's drawing"); }
  /* Timmy's walks */
  for (const [h, sc] of pairs) for (const yard of [{}, fill(0), fill(3), Object.assign(fill(2), { side: "lane" })]) {
    const o = { home: h.k, scene: sc.k, yard, up: ups(h), holiday: "halloween" }, L = K.layout(o);
    const inR = (p, r, e) => p[0] > r[0] + (e || 0) && p[0] < r[2] - (e || 0) && p[1] > r[1] + (e || 0) && p[1] < r[3] - (e || 0);
    for (const k of Object.keys(L.spots)) for (const [a, b] of [["door", k], [k, "door"]]) {
      if (a === b) continue;
      const path = K.route(o, a, b), where = h.k + " " + sc.k + " " + a + "->" + b + " " + JSON.stringify(yard);
      routeCount++;
      if (path.blocked) { bad.push("place route " + where + ": no way round"); continue; }
      path.forEach((q) => { if (!(q[2] > 0) && !K.onLand(sc.k, q[0], q[1])) bad.push("place route " + where + ": off the ground at " + q.map((v) => v.toFixed(1)).join(",")); });
      for (let i = 1; i < path.length; i++) {
        const p = path[i - 1], q = path[i];
        if (p[2] > 0 || q[2] > 0) continue;
        for (let t = .1; t < 1; t += .1) {
          const m = [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
          const hit = L.obs.find((r) => inR(m, r, .02) && !inR(p, r) && !inR(q, r));
          if (hit) { bad.push("place route " + where + ": through " + JSON.stringify(hit)); break; }
        }
      }
    }
  }
}
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
if (placeKit) outs.push([path.join(root, "tools/preview/design/place.js"), "/* Generated by tools/figures/site/build.mjs from tools/figures/site/place.mjs (Timmy's place: the kit itself, checked in the build).\n" +
  "   Do not edit: change place.mjs and run the build. */\nwindow.SH_PLACE = (" + placeKit.toString() + ")(" + JSON.stringify(INK) + ", " + JSON.stringify(C) + ", [\n" +
  PACKS.map((x) => "/* the " + x.k + " set: tools/figures/site/packs/" + x.k + ".mjs */\n" + x.pack.toString()).join(",\n") + "\n], " + JSON.stringify(SETS) + ");\n"]);
for (const h of HUBS) {
  if (!EMBLEMS[h] || !MASTHEADS[h]) continue;
  outs.push([path.join(root, "widget/hub-art/" + h + ".js"), engineHead + "window.SH_HUB_ART_HUB = " +
    JSON.stringify(Object.assign({ hub: h, tint: TINTS[h], emblem: EMBLEMS[h], masthead: MASTHEADS[h] }, arcades[h] ? { games: arcades[h], gamesViewBox: ARCADE_VIEWBOX.join(" ") } : {})) + ";\n"]);
}
/* the new dashboard (widget/dash.js, redesign phase 3) shows every hub at once, so it gets every tint and emblem in one
   file; a hub's masthead still comes from that hub's own file, loaded when its tab is opened */
outs.push([path.join(root, "widget/hub-art/dash.js"), engineHead + "window.SH_DASH_ART = " +
  JSON.stringify({ tints: Object.fromEntries(HUBS.filter((h) => EMBLEMS[h]).map((h) => [h, TINTS[h]])), emblems: Object.fromEntries(HUBS.filter((h) => EMBLEMS[h]).map((h) => [h, EMBLEMS[h]])) }) + ";\n"]);
/* the dashboard's kits: the class's room (studying right now), the leaderboard's stage, the recap's columns and crowd.
   Loaded after the page is drawn (widget/dash.js). Each is checked here by drawing it at a laptop's and a phone's size. */
{
  const room = classroomKit(INK, C, TINTS), stage = stageKit(INK, C), recap = recapKit(INK, C), bad = (s) => typeof s !== "string" || !s || /NaN|undefined|<text|<style| id="/.test(s);
  for (const o of [{ w: 720, h: 150 }, { w: 330, h: 170 }, { w: 720, h: 150, night: true, open: true }]) {
    if (bad(room.room(o))) throw new Error("classroom.mjs: the room doesn't draw at " + o.w + " x " + o.h);
    for (const n of [0, 1, 9, 27, 60]) { const st = room.seats(Object.assign({ n }, o)); if (!st.length || st.some((q) => !(q.x > 0 && q.x < o.w && q.y > 0 && q.y <= o.h && q.s > 0))) throw new Error("classroom.mjs: a desk is off the floor at " + o.w + " x " + o.h + " with " + n); }
  }
  if (bad(room.desk("perio", 2)) || bad(room.desk(null, null)) || bad(room.chair())) throw new Error("classroom.mjs: a desk doesn't draw");
  for (const o of [{ w: 720, h: 300 }, { w: 330, h: 262 }]) if (bad(stage.stage(o)) || bad(stage.confetti(o))) throw new Error("stage.mjs: the stage doesn't draw at " + o.w);
  for (const p of [1, 2, 3]) if (bad(stage.pedestal(p, 150, [108, 74, 54][p - 1])) ) throw new Error("stage.mjs: block " + p + " doesn't draw");
  if (bad(stage.crown()) || bad(stage.torch(74))) throw new Error("stage.mjs: the crown or the torch doesn't draw");
  if (bad(recap.bars({ w: 400, h: 150, days: [3, 5, 0, 9, 28], tint: TINTS.perio }).svg) || bad(recap.crowd({ n: 58, w: 236, tint: TINTS.perio }).svg)) throw new Error("recap.mjs: the columns or the crowd don't draw");
  /* the recap's icons are trophy drawings that say the same thing (hours: Mock Ace's stopwatch; right: the target; ...) */
  const recapIcons = {};
  for (const [k, t] of Object.entries({ hours: "mock90", right: "run-100", prime: "mock-perfect", owls: "owl", regulars: "days-7", tough: "boss" })) {
    if (!trophies[t] || bad(trophies[t].body)) throw new Error("the recap's " + k + " icon: no trophy drawing " + t);
    recapIcons[k] = trophies[t].body;
  }
  let recapHat = null;
  if (placeKit) { const q = placeKit(INK, C, PACKS.map((x) => x.pack), SETS).outfitParts("ranger"); if (!q) throw new Error("place.mjs: no ranger outfit for the recap"); recapHat = Object.fromEntries(Object.entries(q).filter(([, v]) => v)); }
  outs.push([path.join(root, "widget/hub-art/class.js"), "/* Generated by tools/figures/site/build.mjs from classroom.mjs, stage.mjs and recap.mjs in tools/figures/site/ (the new dashboard's drawn\n" +
    "   parts: the kits themselves, checked in the build). Do not edit: change the drawing and run the build. */\nwindow.SH_CLASS_ART = {\n  room: (" + classroomKit.toString() + ")(" + JSON.stringify(INK) + ", " + JSON.stringify(C) + ", " + JSON.stringify(TINTS) + "),\n" +
    "  stage: (" + stageKit.toString() + ")(" + JSON.stringify(INK) + ", " + JSON.stringify(C) + "),\n" +
    "  /* the recap: the kit for the bar graph and the crowd, its facts' icons (trophy drawings, 64 x 64) and the hat on the\n     Timmy who climbs the columns (the shop's ranger hat, put on with dress() as in outfits.js) */\n" +
    "  recap: (" + recapKit.toString() + ")(" + JSON.stringify(INK) + ", " + JSON.stringify(C) + "),\n" +
    "  recapIcons: " + JSON.stringify(recapIcons) + ",\n  recapHat: " + JSON.stringify(recapHat) + "\n};\n"]);
}
/* the idea board's drawings (widget/ideas.js loads the file itself): the cork, a pushpin per hub tint, the six kinds
   of idea, the top idea's rosette, the bulb over Timmy and the pad's binding. Checked here by drawing every piece. */
{
  const K = boardKit(INK, C), bad = (s) => typeof s !== "string" || !s || /NaN|undefined|<text|<style| id="/.test(s);
  const pieces = [K.cork(), K.ring(), K.spiral(260), K.bulb(40), K.rosette(42), K.check(14), K.pin(null, 26)].concat(K.kinds.map((k) => K.kind(k, 40)), HUBS.filter((h) => TINTS[h]).map((h) => K.pin(TINTS[h], 26)));
  if (K.kinds.length !== 6 || pieces.some(bad)) throw new Error("board.mjs: a piece of the idea board doesn't draw");
  outs.push([path.join(root, "widget/hub-art/board.js"), "/* Generated by tools/figures/site/build.mjs from tools/figures/site/board.mjs (the idea board's drawings: the kit itself,\n" +
    "   checked in the build). Do not edit: change the drawing and run the build. */\nwindow.SH_BOARD_ART = (" + boardKit.toString() + ")(" + JSON.stringify(INK) + ", " + JSON.stringify(C) + ");\n"]);
}
/* Timmy's outfits from the place kit, keyed by the shop's item id, with the function that puts one on a Timmy drawn by
   widget/pet.js art(). The dashboard loads it only when someone in the classroom or on the stage wears one. */
if (placeKit) {
  const K = placeKit(INK, C, PACKS.map((x) => x.pack), SETS), parts = {};
  for (const o of K.OUTFITS) { const q = K.outfitParts(o.k); if (!o.id || !q) throw new Error("place.mjs: outfit " + o.k + " has no shop id or no drawing"); parts[o.id] = Object.fromEntries(Object.entries(q).filter(([, v]) => v)); }
  outs.push([path.join(root, "widget/hub-art/outfits.js"), engineHead + "window.SH_OUTFITS = { parts: " + JSON.stringify(parts) + ",\n  /* put outfit `id` on a Timmy drawing from widget/pet.js art() (place.mjs dress()) */\n" +
    "  dress: function(svg, id){ var o = this.parts[id]; if (!o || !svg) return svg;\n" +
    "    if (o.back) svg = svg.replace(/(<ellipse cx=\"100\" cy=\"226\"[^>]*\\/>)/, \"$1\" + '<g class=\"shpet-back\">' + o.back + \"</g>\");\n" +
    "    var add = (o.face ? '<g class=\"shpet-garb\">' + o.face + \"</g>\" : \"\") + (o.top ? '<g class=\"shpet-wobble\"><g class=\"shpet-hat\">' + o.top + \"</g></g>\" : \"\");\n" +
    "    return svg.replace(/<\\/g><\\/svg>\\s*$/, add + \"</g></svg>\"); } };\n"]);
}
if (process.argv.includes("--dry")) {
  console.log("checked, nothing written: Timmy's place (" + placeCount + " drawings and " + routeCount + " walks)" + (onlyPack ? ", with only the " + onlyPack + " set" : ""));
} else if (onlyPack) {
  console.error("--pack is for checking one set: add --dry (a build with one set would drop the others from place.js)"); process.exit(1);
} else if (check) {
  const stale = outs.filter(([f, t]) => !fs.existsSync(f) || fs.readFileSync(f, "utf8") !== t).map(([f]) => path.relative(root, f));
  if (stale.length) { console.error("stale: " + stale.join(", ") + "\nrun node tools/figures/site/build.mjs"); process.exit(1); }
  console.log("art.js, place.js, widget/hub-art.js and widget/hub-art/ are up to date");
} else {
  fs.mkdirSync(path.join(root, "widget/hub-art"), { recursive: true });
  for (const [f, t] of outs) fs.writeFileSync(f, t);
  console.log("wrote " + path.relative(root, OUT) + " (" + Math.round(text.length / 1024) + " KB): " +
    Object.keys(ICONS).length + " icons, " + Object.keys(EMBLEMS).length + " emblems, " + Object.keys(MASTHEADS).length + " mastheads, " +
    Object.keys(trophies).length + " trophies, " + HUBS.length * 4 + " medals, " + (timmy.moods.length + timmy.hp.length + timmy.outfits.length) + " Timmys, " +
    houses.length + " houses, " + handpieces.length + " handpieces; Timmy's place (" + placeCount + " drawings and " + routeCount + " walks checked); and the hub engine's art (" + (outs.length - 1) + " files)");
}
