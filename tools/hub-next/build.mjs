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
 *   notes.json      the notes at both reading levels, and the High yield level built from them (high-yield.mjs), with
 *                   hyAudio: the lectures whose High yield narration matches it (hyRecorded below)
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
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { highYield } from "./high-yield.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
/* hubs with a new version beside the live one */
const HUBS = {
  occlusion: { exam: "final" },
  /* phase 2 (vault/tasks/2026-11-05-redesign-phase-2-live-hubs.md): one exam, which the live hub keeps in EXAM_DATE */
  "heme-endo-exam2": { examLabel: "Exam 2" },
  /* phase 2: Perio, whose own engine keeps its content under other names (EXAM_HINTS, CRAM_CONTENT, REF_SECTIONS, the
     suture pictures, EXAM_FORMAT, MIDTERM_DATE): adaptPerio() below turns them into the shapes the other hubs give */
  perio: { adapt: "perio", lecPrefix: "S", iconsEnd: "/* ---------- exam calendar",
    arcade: { from: "/* ====================================================================\n   POCKET ARCADE", to: "/* ====================================================================\n   BOOT / MODE SWITCHING",
      css: [["/* ===================================================================\n   POCKET ARCADE", "/* ---------- tabs: phones get"]],
      fonts: "--font-arcade:'Bungee','Arial Black',Impact,sans-serif;--font-mono:'IBM Plex Mono',ui-monospace,Menlo,monospace",
      /* its games call recordAnswer(qid, lec, ok, choice) and showToast, and read its sessions' labels and the midterm's last session */
      env: (main, D) => "var recordAnswer = function(qid, lec, ok, choice){ return env.record(qid, lec, ok, 'arcade', choice); }, showToast = function(m){ toast(String(m).replace(/<[^>]*>/g, '')); },\n" +
        "  MIDTERM_AFTER = " + JSON.stringify(D.MIDTERM_AFTER) + ", sessChip = function(l){ return l ? '<span class=\"gm-sess' + env.lc(l.id) + '\">' + lecLabel(l) + '</span>' : ''; };\n" +
        main.match(/function shortTitle\(l\)\{[\s\S]*?\n\}/)[0] + "\n"} }
};

/* High yield's narration (vault/tasks/2026-11-12-high-yield-narration.md): hubs/<hub>/audio/<lecture>-hy.mp3, made by
   tools/narrate.py from notes.json's hy, with its words file beside it saying which text it was spoken from ("h", the
   first 12 hex digits of the SHA-1 of the HTML: narrate.py's text_hash). High yield changes whenever the notes, predicted
   topics, hints or questions do, so the page is offered the recording only while it was spoken from today's High yield;
   otherwise Listen reads it in the device's voice, and tools/ci/smoke.js fails until it's recorded again
   (vault/rules/text-and-audio-never-drift.md). Record or re-record it, then run this build again. */
const textHash = (html) => createHash("sha1").update(html, "utf8").digest("hex").slice(0, 12);
function hyRecorded(hub, lec, html){
  const mp3 = join(ROOT, "hubs", hub, "audio", lec + "-hy.mp3"), wf = mp3.replace(/\.mp3$/, ".words.json");
  if (!existsSync(mp3) || !existsSync(wf)) return false;
  try { const d = JSON.parse(readFileSync(wf, "utf8")); return d.v === 1 && d.h === textHash(html) && d.bytes === statSync(mp3).size; } catch (e) { return false; }
}

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
  "COUNT_SKIP", "EXAM_GROUPS", "MOCK_LIKELY_ONLY",
  /* Perio's own names (adaptPerio) */
  "EXAM_HINTS", "CRAM_CONTENT", "MIDTERM_DATE", "MIDTERM_AFTER", "EXAM_FORMAT", "SUTURE_DIAGRAMS", "SUTURE_DEFS"];

/* Perio's Review tables are functions that write HTML (REF_SECTIONS[i].body()). The hook runs each one with its figures
   swapped for tokens (@@FIG:key@@), so the build can cut the figures out into the engine's figure sections. */
const REF_HOOK = `REF: (function(){
  if (typeof REF_SECTIONS === "undefined") return undefined;
  var ah = ANIMA.html, sd = typeof SUTURE_DIAGRAMS === "undefined" ? null : SUTURE_DIAGRAMS;
  ANIMA.html = function(k){ return "@@FIG:" + k + "@@"; };
  if (sd) { var tok = {}; Object.keys(sd).forEach(function(k){ tok[k] = ["@@FIG:" + k + "@@", sd[k][1]]; }); SUTURE_DIAGRAMS = tok; }
  try { return REF_SECTIONS.map(function(s){ return { id: s.id, lec: s.lec, title: s.title, html: s.body() }; }); }
  finally { ANIMA.html = ah; if (sd) SUTURE_DIAGRAMS = sd; }
})()`;

/* Perio's names and shapes, as the other hubs give them */
function adaptPerio(D){
  const label = (l) => "S" + l.num;
  D.LECTURES = D.LECTURES.map((l) => Object.assign({}, l, { label: label(l) }));
  D.EXAM_DATE = D.MIDTERM_DATE;
  D.HINTS = (D.EXAM_HINTS || []).map((x) => ({ lec: x.lec, kind: x.type, quote: x.quote, take: x.takeaway }));
  D.CRAM = {}; (D.CRAM_CONTENT || []).forEach((c) => { D.CRAM[c.lec] = c.points; });
  D.DRILL_HY = { "exam-review": "on the class exam-review guide" };
  /* its trophies: the same ids (progress is keyed on them), in the engine's terms */
  const byId = {}; D.LECTURES.forEach((l) => { byId[l.id] = l; });
  D.ACHIEVEMENTS = (D.ACHIEVEMENTS || []).map((a) => {
    const c = a.cond, n = c.value;
    if (c.type === "totalCorrect") return { id: a.id, name: a.name, desc: n === 1 ? "Your first question right" : n + " questions right", cond: { type: "totalCorrect", n } };
    if (c.type === "streak") return { id: a.id, name: a.name, desc: n + " right in a row", cond: { type: "streak", n } };
    return { id: a.id, name: a.name, desc: "Every " + label(byId[c.lec]) + " question right at least once", cond: { type: "lecRight", lec: c.lec, pct: n } };
  });
  /* the exam-format mock: its shape, with the time in seconds */
  if (D.EXAM_FORMAT) D.MOCK_FORMAT = Object.assign({}, D.EXAM_FORMAT);
  /* the suture pictures, as drawn figures (q.img names one); their gradients go in the page once */
  if (D.SUTURE_DIAGRAMS) {
    D.FIGS = {};
    Object.keys(D.SUTURE_DIAGRAMS).forEach((k) => { D.FIGS[k] = { title: k === "_strands" ? "Monofilament vs braided" : k, svg: D.SUTURE_DIAGRAMS[k][0], caption: D.SUTURE_DIAGRAMS[k][1] }; });
    D.FIG_DEFS = D.SUTURE_DEFS || "";
  }
  /* Review: one group per session, each table its own section; a figure inside a table's HTML becomes a figure section */
  const groups = {};
  (D.REF || []).forEach((r) => {
    const g = groups[r.lec] = groups[r.lec] || { id: "rv-" + r.lec, lec: r.lec, title: byId[r.lec] ? byId[r.lec].title : r.lec, sections: [] };
    let html = r.html
      .replace(/<div class="sut-grid">([\s\S]*?)<\/div>(?=$|<)/, (m, inner) => "@@FIGS:" + [...inner.matchAll(/@@FIG:([^@]+)@@/g)].map((x) => x[1]).join(",") + "@@")
      .replace(/<div class="lec-fig-card">@@FIG:([^@]+)@@<\/div>/g, "@@FIGS:$1@@")
      .replace(/@@FIGS:([^@]+)@@@@FIGS:/g, "@@FIGS:$1,")
      .replace(/<div class="table-wrap"><table class="chart-table">/g, '<div class="tbl-wrap" tabindex="0" role="region" aria-label="' + r.title.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]) + ' (table)"><table>')
      .replace(/<th>/g, '<th scope="col">').replace(/<h5>/g, "<h4>").replace(/<\/h5>/g, "</h4>").replace(/ style="[^"]*"/g, "");
    const parts = html.split(/@@FIGS:([^@]+)@@/);
    let first = true;
    parts.forEach((part, i) => {
      if (i % 2) { g.sections.push({ title: first ? r.title : "", type: "figs", figs: part.split(",") }); first = false; }
      else if (part.trim()) { g.sections.push({ title: first ? r.title : "", type: "html", html: part }); first = false; }
    });
  });
  D.REVIEW = D.LECTURES.map((l) => groups[l.id]).filter(Boolean);
}

function build(hub){
  const cfg = HUBS[hub] || {};
  const file = join(ROOT, "hubs", hub, "index.html");
  const html = readFileSync(file, "utf8");
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
  const main = scripts.find(s => s.includes("var QUESTIONS = [") && s.includes("window.SH_EXPORT = {"));
  if (!main) throw new Error(`${file}: no inline hub script`);
  const hook = "window.__NEXT = {" + DATA.map(n => `${n}: typeof ${n} === "undefined" ? undefined : ${n}`).join(", ") +
    ", PODCAST: window.SH_PODCAST, " + REF_HOOK + " };\n";
  const at = main.lastIndexOf("window.SH_EXPORT = {");
  const ctx = sandbox();
  /* a hub that loads the dental case kit uses it while its script runs (Perio's shCases.foldBox) */
  if (/<script[^>]*src="[^"]*widget\/cases\.js"/.test(html)) vm.runInContext(readFileSync(join(ROOT, "widget/cases.js"), "utf8"), ctx, { filename: "widget/cases.js" });
  vm.runInContext(main.slice(0, at) + hook + main.slice(at), ctx, { filename: file, timeout: 20000 });
  const D = ctx.__NEXT;
  if (!D || !Array.isArray(D.QUESTIONS) || !D.QUESTIONS.length) throw new Error(`${file}: the sandbox produced no questions`);
  const clean = v => JSON.parse(JSON.stringify(v === undefined ? null : v));
  if (cfg.adapt === "perio") adaptPerio(D);

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
    mock: Object.assign({ blueprint: clean(D.MOCK_BLUEPRINT), limit: D.MOCK_FORMAT ? D.MOCK_FORMAT.minutes * 60 : D.MOCK_LIMIT },
      /* an exam-format mock (Perio's EXAM_FORMAT): so many Patient Box, select-all and ordering items, the rest multiple
         choice, drawn round-robin across the lectures (widget/hub-bank.js, buildMock) */
      D.MOCK_FORMAT ? { format: clean(D.MOCK_FORMAT) } : {},
      D.EXAM_GROUPS && Object.keys(D.EXAM_GROUPS).length ? { groups: clean(D.EXAM_GROUPS) } : {},
      D.MOCK_LIKELY_ONLY && Object.keys(D.MOCK_LIKELY_ONLY).length ? { likelyOnly: clean(D.MOCK_LIKELY_ONLY) } : {}),
    srcLabel: clean(D.SRC_LABEL), drillHy: clean(D.DRILL_HY), achievements: clean(D.ACHIEVEMENTS), podcast: clean(D.PODCAST),
    figByLec: clean(D.FIG_BY_LEC),
    /* the drawn Patient Box cases (widget/cases.js draws them; empty for a hub that has none) */
    pcases: D.PCASES && Object.keys(D.PCASES).length ? clean(D.PCASES) : null,
    index: D.QUESTIONS.map(q => [q.id, q.lec, q.likely ? 1 : 0, q.src || ""])
  };
  /* review-only lectures: in the bank only when ticked, never in the totals (widget/hub.js, isReview) */
  /* Perio's live export put each Patient Box before its stem and listed a multi's keys: question health fingerprints
     that export, so the new version exports the same (widget/hub.js exportQuestions) */
  if (cfg.adapt === "perio") core.exportCase = true;
  /* every chart belongs to one lecture (Perio's): More's Side by side has nothing to show */
  if (Array.isArray(D.REVIEW) && D.REVIEW.length && !D.REVIEW.some((g) => g && !g.lec)) core.noSide = true;
  if (D.COUNT_SKIP && Object.keys(D.COUNT_SKIP).length) core.reviewOnly = Object.keys(D.COUNT_SKIP).filter(k => D.COUNT_SKIP[k]);
  const hy = highYield({ notes: clean(D.READINGS), topics: clean(D.LIKELY_TOPICS), hints: clean(D.HINTS), questions: clean(D.QUESTIONS) });
  const out = {
    "core.json": JSON.stringify(core),
    "questions.json": JSON.stringify(clean(D.QUESTIONS)),
    /* hy: the third reading level, each lecture's predicted topics with the paragraphs of its notes that teach them
       (tools/hub-next/high-yield.mjs; Sam, 2026-11-12) */
    "notes.json": JSON.stringify({ full: clean(D.READINGS), plain: clean(D.READINGS_PLAIN), hy,
      hyAudio: Object.keys(hy).filter((lec) => hyRecorded(hub, lec, hy[lec])) }),
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
      "var FIGS = " + JSON.stringify(clean(D.FIGS) || {}) + ";\nvar FIG_PLACE = " + JSON.stringify(clean(D.FIG_PLACE) || {}) + ";\n" +
      /* drawn figures that share gradients (Perio's suture pictures): their defs go in the page once */
      (D.FIG_DEFS ? "var FIG_DEFS = " + JSON.stringify(D.FIG_DEFS) + ";\nif (typeof document !== 'undefined' && document.body && !document.body.querySelector('[data-fig-defs]')) document.body.insertAdjacentHTML('beforeend', FIG_DEFS.replace('<svg ', '<svg data-fig-defs ')); \n" : "") + anima +
      "\nreturn { OD: null, FIGS: FIGS, FIG_PLACE: FIG_PLACE, CASE_IMG: {}, caseImgHTML: function(){ return ''; }, cuspMapHTML: function(){ return ''; }, wireCuspMaps: function(){}, CUSP_GAME: { mount: function(){} }, ANIMA: ANIMA };\n};\n";
  }
  /* the figures' own CSS, with one change for the redesign: no label under 11px (the taste skill's floor; the live
     hub draws some at 10 and 10.5px). Everything else about their look is restyled in widget/hub.css, under html.shx. */
  out["figures.css"] = head + ((hasKit ? between(style, "/* od:css begin */", "/* od:css end */", file) : "") + between(style, "/* anima:css begin */", "/* anima:css end */", file) +
    /* labels in a suture picture that give its answer away hide while it sits above the question (Perio's .sd-hint) */
    (D.FIG_DEFS ? "\nhtml.shx .qfig:not(.qfig-after) .sd-hint{display:none}\nhtml.shx .fig-card svg{display:block;width:100%;height:auto}\n" : ""))
    .replace(/font-size:\s*(?:9|9\.5|10|10\.5)px/g, "font-size:11px");

  /* the arcade: its games, skin and leaderboards, with the hub's icon set */
  const AR = cfg.arcade || {};
  const icons = main.slice(main.indexOf("var ICON_PATHS"), main.indexOf(cfg.iconsEnd || "var EXAM_DATE"));
  const arcadeStart = main.indexOf(AR.from || "var ARCADE = (function(){"), arcadeEnd = main.indexOf(AR.to || "/* ---------- theme toggle");
  if (arcadeStart < 0 || arcadeEnd < arcadeStart) throw new Error(`${file}: can't find the arcade`);
  out["arcade.js"] = head + "window.SH_ARCADE = function(env){\n'use strict';\n" +
    "var escHtml = env.esc, STATE = env.state, saveState = env.save, toast = env.toast, QUESTIONS = env.questions, LECTURES = env.lectures, LECTURE_BY_ID = env.lectureById,\n" +
    "  shuffled = env.shuffled, recordAnswer = env.record, lecLabel = env.lecLabel, SORT_SETS = env.sortSets, READINGS = env.readings, REVIEW = env.review;\n" + (AR.env ? AR.env(main, D) : "") +
    /* the page sits one folder down (hubs/<id>/next/), so the hub's pictures are one folder up */
    (icons + main.slice(arcadeStart, arcadeEnd)).replace(/href="img\//g, 'href="../img/').replace(/href=\\"img\//g, 'href=\\"../img/').replace(/bg:'img\//g, "bg:'../img/") +
    "\nreturn { arcade: ARCADE, icon: icon };\n};\n";
  const arcCss = (AR.css || [["/* ===================================================================\n   ARCADE", "/* ---------- responsive ---------- */"],
    ["/* ---------- arcade leaderboards ---------- */", "/* ---------- Listen (shared widget TTS) ---------- */"]]).map(([a, b]) => {
    const i = style.indexOf(a), j = style.indexOf(b, i); if (i < 0 || j < 0) throw new Error(`${file}: can't find the arcade's CSS between "${a.split("\n").pop()}" and "${b}"`); return style.slice(i, j); }).join("");
  /* and the stylesheet sits in content/, two folders below the hub's img/ */
  /* the arcade's own colors (--ar-*; Perio's end in --ar-lilac, not --ar-violet: every --ar- declaration of that block) and
     its fonts (AR.fonts: Perio's chunky Bungee and mono; the page loads no web font for them, so they fall back as listed) */
  const arVars = (style.match(/--ar-bg:[^}]*?--ar-violet:[^;]*;/) || [])[0] ||
    (style.indexOf("--ar-bg:") < 0 ? "" : (style.slice(style.indexOf("--ar-bg:"), style.indexOf("}", style.indexOf("--ar-bg:"))).match(/--ar-[\w-]+:[^;]*;/g) || []).join(""));
  out["arcade.css"] = head + ":root{" + arVars + (AR.fonts || "--font-arcade:'Press Start 2P','Courier New',monospace") + "}\n" + arcCss.replace(/url\((["']?)img\//g, "url($1../../img/");

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
if (stale) { console.error(`${stale} file(s) stale: the live hub changed since its new version's content was built (or a lecture's High yield narration was recorded since).`); process.exit(1); }
