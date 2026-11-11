#!/usr/bin/env node
/*
 * The redesign's content step (phase 1, built side by side: vault/tasks/2026-11-05-redesign-phase-1-hub-engine.md).
 *
 * Until the redesign is released, a live hub's single file stays where its content is edited. This script reads that
 * file and writes the new version's content next to it, in hubs/<hub>/next/content/:
 *
 *   core.json       the hub's facts for Home: lectures, exam info, course dates, likely topics, mock blueprint, the
 *                   podcast, and a compact question index ([id, lec, likely]) so Home draws before the bank loads
 *   questions.json  every question in its final shape (the helpers two(), tf(), nums(), pc() already run), whys on it
 *   notes.json      the notes at both reading levels
 *   study.json      hints, the cram sheet, the Review tables and processes (Side by side), the arcade's sort sets
 *   figures.js/.css the hub's drawing kit and anima figures, copied from its od:kit / anima:js / od:css / anima:css
 *                   marker blocks and wrapped so the engine hands them what they used from the hub (a hub without
 *                   od:kit, like Heme & Endo Exam 2, gets its FIGS and FIG_PLACE as data and no-op kit hooks)
 *   arcade.js/.css  the hub's arcade (its games list and skin), wrapped the same way
 *
 * It evaluates the hub's own script in a small sandbox (stub DOM, no network, timers off) and reads the values just
 * before `window.SH_EXPORT = {`, the same place the CI lint hooks in. Nothing in the live hub changes.
 *
 *   node tools/hub-next/build.mjs              write every hub in HUBS
 *   node tools/hub-next/build.mjs --check      fail if any written file is stale (CI runs this)
 *   node tools/hub-next/build.mjs --hub occlusion
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
/* hubs with a new version beside the live one */
const HUBS = {
  occlusion: { exam: "final" },
  /* phase 2 (vault/tasks/2026-11-05-redesign-phase-2-live-hubs.md): one exam, which the live hub keeps in EXAM_DATE */
  "heme-endo-exam2": { examLabel: "Exam 2" }
};

const args = process.argv.slice(2);
const CHECK = args.includes("--check");
const only = args.includes("--hub") ? args[args.indexOf("--hub") + 1] : null;

/* a DOM that swallows everything: any property is a callable stub, so the hub's boot() and render calls run harmlessly */
function stub(){
  const fn = function(){ return p; };
  const p = new Proxy(fn, {
    get(t, k){
      if (k === Symbol.toPrimitive) return () => "";
      if (k === Symbol.iterator) return function*(){};
      if (k === "length") return 0;
      if (k === "then") return undefined;
      if (k === "toString" || k === "valueOf") return () => "";
      return p;
    },
    set(){ return true; },
    apply(){ return p; },
    construct(){ return p; },
    has(){ return true; }
  });
  return p;
}

function sandbox(){
  const store = new Map();
  const localStorage = {
    getItem: k => store.has(String(k)) ? store.get(String(k)) : null,
    setItem: (k, v) => { store.set(String(k), String(v)); },
    removeItem: k => { store.delete(String(k)); }, clear: () => store.clear(), key: () => null, length: 0
  };
  const document = stub();
  const win = {
    document, localStorage, sessionStorage: localStorage, console: { log(){}, warn(){}, error(){}, info(){} },
    location: { hash: "", search: "", href: "http://localhost/hubs/x/", pathname: "/hubs/x/", protocol: "http:", host: "localhost" },
    navigator: { userAgent: "node" }, screen: { width: 1440, height: 900 },
    setTimeout: () => 0, clearTimeout(){}, setInterval: () => 0, clearInterval(){}, requestAnimationFrame: () => 0, cancelAnimationFrame(){},
    addEventListener(){}, removeEventListener(){}, dispatchEvent(){ return true; },
    matchMedia: () => ({ matches: false, addEventListener(){}, removeEventListener(){}, addListener(){}, removeListener(){} }),
    getComputedStyle: () => stub(), fetch: () => Promise.reject(new Error("no network")),
    CustomEvent: class { constructor(t, i){ this.type = t; Object.assign(this, i || {}); } },
    Event: class { constructor(t){ this.type = t; } }, IntersectionObserver: class { observe(){} disconnect(){} },
    MutationObserver: class { observe(){} disconnect(){} }, ResizeObserver: class { observe(){} disconnect(){} },
    Image: class {}, Audio: class { play(){ return Promise.resolve(); } pause(){} }, scrollTo(){}, scrollBy(){},
    innerWidth: 1440, innerHeight: 900, devicePixelRatio: 1, performance: { now: () => 0 }, crypto: { randomUUID: () => "x" }
  };
  win.window = win; win.self = win; win.globalThis = win;
  return vm.createContext(win);
}

function between(text, a, b, file){
  const i = text.indexOf(a), j = text.indexOf(b, i + a.length);
  if (i < 0 || j < 0) throw new Error(`${file}: can't find the block between "${a}" and "${b}"`);
  return text.slice(i + a.length, j);
}

const DATA = ["LECTURES", "EXAM_INFO", "COURSE_DATES", "EXAM_DATE", "FINAL_DATE", "EXAM_TIME", "EXAM_CLOSES", "FINAL_TIME", "FINAL_CLOSES",
  "LIKELY_TOPICS", "EXAM_COUNTS", "MOCK_BLUEPRINT", "MOCK_LIMIT", "SRC_LABEL", "DRILL_HY", "ACHIEVEMENTS", "STATE_KEY",
  "QUESTIONS", "READINGS", "READINGS_PLAIN", "REVIEW", "SEQUENCES", "HINTS", "CRAM", "SORT_SETS", "FIG_BY_LEC", "PCASES",
  /* a hub without the drawing kit (od:kit) keeps its drawn figures and their places as data */
  "FIGS", "FIG_PLACE",
  /* Heme & Endo Exam 2: review-only lectures (its Exam 1 Refresher), lectures the exam counts together, and lectures
     whose mock questions are High likelihood only */
  "COUNT_SKIP", "EXAM_GROUPS", "MOCK_LIKELY_ONLY"];

function build(hub){
  const cfg = HUBS[hub] || {};
  const file = join(ROOT, "hubs", hub, "index.html");
  const html = readFileSync(file, "utf8");
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
  const main = scripts.find(s => s.includes("var QUESTIONS = []") && s.includes("window.SH_EXPORT = {"));
  if (!main) throw new Error(`${file}: no inline hub script`);
  const hook = "window.__NEXT = {" + DATA.map(n => `${n}: typeof ${n} === "undefined" ? undefined : ${n}`).join(", ") +
    ", PODCAST: window.SH_PODCAST };\n";
  const at = main.lastIndexOf("window.SH_EXPORT = {");
  const ctx = sandbox();
  vm.runInContext(main.slice(0, at) + hook + main.slice(at), ctx, { filename: file, timeout: 20000 });
  const D = ctx.__NEXT;
  if (!D || !Array.isArray(D.QUESTIONS) || !D.QUESTIONS.length) throw new Error(`${file}: the sandbox produced no questions`);
  const clean = v => JSON.parse(JSON.stringify(v === undefined ? null : v));

  const likely = {};
  (D.LIKELY_TOPICS || []).forEach((t, k) => (t.ids || []).forEach(id => { if (!(id in likely)) likely[id] = k; }));
  const core = {
    hub, title: (html.match(/<title>([^<]*)<\/title>/) || [])[1] || hub, stateKey: D.STATE_KEY,
    exams: [
      D.EXAM_DATE ? { id: "midterm", label: cfg.examLabel || "Midterm", date: D.EXAM_DATE, time: D.EXAM_TIME, closes: D.EXAM_CLOSES } : null,
      D.FINAL_DATE ? { id: "final", label: "Final", date: D.FINAL_DATE, time: D.FINAL_TIME, closes: D.FINAL_CLOSES } : null
    ].filter(Boolean),
    examInfo: clean(D.EXAM_INFO), courseDates: clean(D.COURSE_DATES), lectures: clean(D.LECTURES),
    likelyTopics: clean(D.LIKELY_TOPICS), examCounts: clean(D.EXAM_COUNTS),
    mock: Object.assign({ blueprint: clean(D.MOCK_BLUEPRINT), limit: D.MOCK_LIMIT },
      D.EXAM_GROUPS && Object.keys(D.EXAM_GROUPS).length ? { groups: clean(D.EXAM_GROUPS) } : {},
      D.MOCK_LIKELY_ONLY && Object.keys(D.MOCK_LIKELY_ONLY).length ? { likelyOnly: clean(D.MOCK_LIKELY_ONLY) } : {}),
    srcLabel: clean(D.SRC_LABEL), drillHy: clean(D.DRILL_HY), achievements: clean(D.ACHIEVEMENTS), podcast: clean(D.PODCAST),
    figByLec: clean(D.FIG_BY_LEC),
    /* the drawn Patient Box cases (widget/cases.js draws them; empty for a hub that has none) */
    pcases: D.PCASES && Object.keys(D.PCASES).length ? clean(D.PCASES) : null,
    index: D.QUESTIONS.map(q => [q.id, q.lec, q.likely ? 1 : 0, q.src || ""])
  };
  /* review-only lectures: in the bank only when ticked, never in the totals (widget/hub.js, isReview) */
  if (D.COUNT_SKIP && Object.keys(D.COUNT_SKIP).length) core.reviewOnly = Object.keys(D.COUNT_SKIP).filter(k => D.COUNT_SKIP[k]);
  const out = {
    "core.json": JSON.stringify(core),
    "questions.json": JSON.stringify(clean(D.QUESTIONS)),
    "notes.json": JSON.stringify({ full: clean(D.READINGS), plain: clean(D.READINGS_PLAIN) }),
    "study.json": JSON.stringify({ hints: clean(D.HINTS), cram: clean(D.CRAM), review: clean(D.REVIEW), sequences: clean(D.SEQUENCES), sortSets: clean(D.SORT_SETS) })
  };

  /* figures: the marker blocks, verbatim, inside a factory that gets what they used from the hub */
  const style = (html.match(/<style>([\s\S]*?)<\/style>/) || [])[1] || "";
  const hasKit = main.includes("/* od:kit begin");
  const anima = between(main, "/* anima:js begin", "/* anima:js end */", file).replace(/^[^\n]*\n/, "");
  const head = "/* Generated by tools/hub-next/build.mjs from hubs/" + hub + "/index.html. Do not edit: change the live hub (or its figure build) and rebuild. */\n";
  if (hasKit) {
    const odKit = between(main, "/* od:kit begin", "/* od:kit end */", file).replace(/^[^\n]*\n/, "");
    out["figures.js"] = head + "window.SH_FIGURES = function(env){\n'use strict';\nvar escHtml = env.esc, shuffled = env.shuffled, saveState = env.save, STATE = env.state;\n" +
      odKit + anima + "\nreturn { OD: OD, FIGS: FIGS, FIG_PLACE: typeof FIG_PLACE === 'undefined' ? {} : FIG_PLACE, CASE_IMG: CASE_IMG, caseImgHTML: caseImgHTML, cuspMapHTML: cuspMapHTML, wireCuspMaps: wireCuspMaps, CUSP_GAME: CUSP_GAME, ANIMA: ANIMA };\n};\n";
  } else {
    /* no drawing kit (Heme & Endo Exam 2): the hub's drawn FIGS (built by its own figure build) and FIG_PLACE as data, the
       anima block as is, and the kit's case-picture and cusp-map hooks as no-ops */
    out["figures.js"] = head + "window.SH_FIGURES = function(env){\n'use strict';\nvar escHtml = env.esc, shuffled = env.shuffled, saveState = env.save, STATE = env.state;\n" +
      "var FIGS = " + JSON.stringify(clean(D.FIGS) || {}) + ";\nvar FIG_PLACE = " + JSON.stringify(clean(D.FIG_PLACE) || {}) + ";\n" + anima +
      "\nreturn { OD: null, FIGS: FIGS, FIG_PLACE: FIG_PLACE, CASE_IMG: {}, caseImgHTML: function(){ return ''; }, cuspMapHTML: function(){ return ''; }, wireCuspMaps: function(){}, CUSP_GAME: { mount: function(){} }, ANIMA: ANIMA };\n};\n";
  }
  /* the figures' own CSS, with one change for the redesign: no label under 11px (the taste skill's floor; the live
     hub draws some at 10 and 10.5px). Everything else about their look is restyled in widget/hub.css, under html.shx. */
  out["figures.css"] = head + ((hasKit ? between(style, "/* od:css begin */", "/* od:css end */", file) : "") + between(style, "/* anima:css begin */", "/* anima:css end */", file))
    .replace(/font-size:\s*(?:9|9\.5|10|10\.5)px/g, "font-size:11px");

  /* the arcade: its games, skin and leaderboards, with the hub's icon set */
  const icons = main.slice(main.indexOf("var ICON_PATHS"), main.indexOf("var EXAM_DATE"));
  const arcadeStart = main.indexOf("var ARCADE = (function(){"), arcadeEnd = main.indexOf("/* ---------- theme toggle");
  if (arcadeStart < 0 || arcadeEnd < arcadeStart) throw new Error(`${file}: can't find the arcade`);
  out["arcade.js"] = head + "window.SH_ARCADE = function(env){\n'use strict';\n" +
    "var escHtml = env.esc, STATE = env.state, saveState = env.save, toast = env.toast, QUESTIONS = env.questions, LECTURES = env.lectures, LECTURE_BY_ID = env.lectureById,\n" +
    "  shuffled = env.shuffled, recordAnswer = env.record, lecLabel = env.lecLabel, SORT_SETS = env.sortSets, READINGS = env.readings, REVIEW = env.review;\n" +
    /* the page sits one folder down (hubs/<id>/next/), so the hub's pictures are one folder up */
    (icons + main.slice(arcadeStart, arcadeEnd)).replace(/href="img\//g, 'href="../img/').replace(/href=\\"img\//g, 'href=\\"../img/').replace(/bg:'img\//g, "bg:'../img/") +
    "\nreturn { arcade: ARCADE, icon: icon };\n};\n";
  const arcCss = style.slice(style.indexOf("/* ===================================================================\n   ARCADE"), style.indexOf("/* ---------- responsive ---------- */")) +
    style.slice(style.indexOf("/* ---------- arcade leaderboards ---------- */"), style.indexOf("/* ---------- Listen (shared widget TTS) ---------- */"));
  /* and the stylesheet sits in content/, two folders below the hub's img/ */
  out["arcade.css"] = head + ":root{" + (style.match(/--ar-bg:[^}]*?--ar-violet:[^;]*;/) || [""])[0] + "--font-arcade:'Press Start 2P','Courier New',monospace}\n" + arcCss.replace(/url\((["']?)img\//g, "url($1../../img/");

  /* every file parses before it's written */
  for (const k of Object.keys(out)) if (k.endsWith(".js")) new vm.Script(out[k], { filename: k });
  return { dir: join(ROOT, "hubs", hub, "next", "content"), out, n: D.QUESTIONS.length };
}

let stale = 0;
for (const hub of Object.keys(HUBS)) {
  if (only && hub !== only) continue;
  const { dir, out, n } = build(hub);
  if (!CHECK) mkdirSync(dir, { recursive: true });
  for (const [name, text] of Object.entries(out)) {
    const path = join(dir, name), cur = existsSync(path) ? readFileSync(path, "utf8") : null;
    if (cur === text) continue;
    if (CHECK) { stale++; console.error(`stale: hubs/${hub}/next/content/${name} (run: node tools/hub-next/build.mjs)`); }
    else { writeFileSync(path, text); console.log(`wrote hubs/${hub}/next/content/${name} (${(text.length / 1024).toFixed(0)} KB)`); }
  }
  console.log(`${hub}: ${n} questions${CHECK ? "" : ", content up to date"}`);
}
if (stale) { console.error(`${stale} file(s) stale: the live hub changed since its new version's content was built.`); process.exit(1); }
