#!/usr/bin/env node
/*
 * Extract the data currently authored inside a hub's single-file app into
 * normalized JSON without changing the hub itself.
 *
 * Usage:
 *   node tools/hub-content/extract.mjs
 *   node tools/hub-content/extract.mjs --hub occlusion --check
 *   node tools/hub-content/extract.mjs --migrate
 *
 * The question banks are authored through helper calls (mq(), two(), pc(),
 * and friends), so reading their source text is not enough. This script
 * evaluates only the data-building prefix of the inline hub script in a
 * deliberately tiny VM sandbox, then serializes the resulting plain values.
 * Current hubs first bind their local data through widget/hub.js, so the VM
 * loads that shared engine too; it never executes boot(), network calls, or a
 * hub's DOM wiring.
 * Dynamic figure functions are intentionally not serialized; figure builds
 * own those modules and will move them in the engine-extraction change.
 */
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const HUB_ENGINE = resolve(ROOT, "widget", "hub.js");
const TARGETS = ["occlusion", "heme-endo-exam2", "pcd-implants-exam1", "special-patient-care"];
const DATA_NAMES = [
  "LECTURES", "EXAM_INFO", "COURSE_DATES", "QUESTIONS", "QUESTION_WHY",
  "READINGS", "READINGS_PLAIN", "NOTE_TABLES", "REVIEW", "HINTS", "CRAM",
  "LIKELY_TOPICS", "CASES", "PCASES", "SEQUENCES", "SORT_SETS", "CASE_SETS",
  "MOCK_BLUEPRINT", "MOCK_MULTI", "MOCK_LIMIT", "EXAM_COUNTS", "SRC_LABEL",
  "DRILL_HY", "FIGS", "FIG_PLACE", "FIG_BY_LEC", "CASE_IMG", "ANIMA", "OD"
];
const EXTERNAL_MARKER = "/* sh:content-external */";
/* Dynamic figures stay out of the first-load content payload. These descriptors
 * resolve from each hub's content/ directory after figures.json has hydrated
 * the static drawings it depends on. Keep the CSS before the scripts and the
 * Occlusion drawing kit before anima. */
const FIGURE_ASSETS = {
  occlusion: [
    { type: "style", src: "../figures/od.css" },
    { type: "style", src: "../figures/anima.css" },
    { type: "script", src: "../figures/od.js" },
    { type: "script", src: "../figures/anima.js" }
  ],
  "heme-endo-exam2": [
    { type: "style", src: "../figures/anima.css" },
    { type: "script", src: "../figures/anima.js" }
  ],
  "pcd-implants-exam1": [
    { type: "style", src: "../figures/anima.css" },
    { type: "script", src: "../figures/anima.js" }
  ]
};
function figureAssetsFor(hub) { return FIGURE_ASSETS[hub] || []; }

function usage(message) {
  if (message) console.error(message);
  console.error("Usage: node tools/hub-content/extract.mjs [--hub <id>] [--check] [--dry-run] [--migrate]");
  process.exit(message ? 1 : 0);
}

function parseArgs(argv) {
  const out = { hubs: [], check: false, dryRun: false, migrate: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--hub") {
      const hub = argv[++i];
      if (!hub) usage("--hub needs a hub id");
      out.hubs.push(hub);
    } else if (arg === "--check") out.check = true;
    else if (arg === "--dry-run") out.dryRun = true;
    else if (arg === "--migrate") out.migrate = true;
    else if (arg === "--help" || arg === "-h") usage();
    else usage(`Unknown option: ${arg}`);
  }
  if (!out.hubs.length) out.hubs = TARGETS.slice();
  for (const hub of out.hubs) if (!TARGETS.includes(hub)) usage(`Unsupported hub: ${hub}. Expected one of ${TARGETS.join(", ")}`);
  if (out.check && out.migrate) usage("--check and --migrate cannot be used together");
  return out;
}

function emptyElement() {
  const classList = { add() {}, remove() {}, toggle() {}, contains() { return false; } };
  return {
    style: {}, classList, dataset: {}, children: [], hidden: false,
    appendChild() {}, append() {}, remove() {}, focus() {}, blur() {}, click() {},
    addEventListener() {}, removeEventListener() {}, setAttribute() {}, removeAttribute() {},
    getAttribute() { return null; }, hasAttribute() { return false; },
    querySelector() { return null; }, querySelectorAll() { return []; },
    closest() { return null; }, matches() { return false; },
    getBoundingClientRect() { return { top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0 }; },
    innerHTML: "", textContent: "", value: "", id: ""
  };
}

function sandboxFor() {
  const storage = new Map();
  const document = {
    body: emptyElement(), documentElement: emptyElement(),
    createElement: emptyElement, getElementById() { return null; },
    querySelector() { return null; }, querySelectorAll() { return []; },
    addEventListener() {}, removeEventListener() {}, readyState: "loading"
  };
  const localStorage = {
    getItem(key) { return storage.has(String(key)) ? storage.get(String(key)) : null; },
    setItem(key, value) { storage.set(String(key), String(value)); },
    removeItem(key) { storage.delete(String(key)); }, clear() { storage.clear(); }
  };
  // The browser's global object is window. Keeping them identical here is
  // important: shHubBind installs global accessors that let widget/hub.js
  // read the data variables retained inside the hub IIFE.
  const window = {
    document, localStorage, console: { log() {}, warn() {}, error() {} },
    location: { hash: "", search: "", href: "http://localhost/" }, navigator: {},
    setTimeout() { return 0; }, clearTimeout() {}, setInterval() { return 0; }, clearInterval() {},
    requestAnimationFrame() { return 0; }, cancelAnimationFrame() {},
    addEventListener() {}, removeEventListener() {}, matchMedia() { return { matches: false, addEventListener() {}, removeEventListener() {} }; },
    getComputedStyle() { return {}; }, fetch() { return Promise.reject(new Error("content extractor never fetches")); },
    CustomEvent: class CustomEvent { constructor(type, init = {}) { this.type = type; Object.assign(this, init); } },
    Event: class Event { constructor(type) { this.type = type; } },
    scrollTo() {}
  };
  window.window = window;
  window.self = window;
  window.localStorage = localStorage;
  document.defaultView = window;
  return vm.createContext(window, { name: "hub-content-extractor" });
}

function inlineHubScriptMatch(html, file) {
  const matches = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
  const match = matches.find((m) => m[1].includes("var QUESTIONS = []") && m[1].includes("window.SH_EXPORT ="));
  if (!match) throw new Error(`${file}: could not find the hub's inline data script`);
  return { script: match[1], start: match.index + match[0].indexOf(match[1]), end: match.index + match[0].indexOf(match[1]) + match[1].length };
}

function inlineHubScript(html, file) {
  const script = inlineHubScriptMatch(html, file).script;
  const marker = "/* Published for the shared widget";
  const stop = script.lastIndexOf(marker);
  if (stop < 0) throw new Error(`${file}: could not find the SH_EXPORT marker`);
  const prefix = script.slice(0, stop);
  // The data is complete before boot(), but boot wires the real page DOM.
  // Remove only the final call, never the function declaration or helper calls.
  const boot = prefix.lastIndexOf("\nboot();");
  if (boot < 0) throw new Error(`${file}: could not find the final boot() call`);
  return prefix.slice(0, boot) + "\n/* hub-content extractor: boot skipped */" + prefix.slice(boot + "\nboot();".length);
}

function captureProgram(prefix) {
  const capture = DATA_NAMES.map((name) => `${name}: typeof ${name} === "undefined" ? undefined : ${name}`).join(",\n  ");
  // The retained prefix begins inside the hub's `(function(){ ...` wrapper.
  return `${prefix}\nwindow.__HUB_CONTENT__ = {\n  ${capture}\n};\n})();\n`;
}

function validateHubData(hub, result) {
  if (!result || !Array.isArray(result.QUESTIONS) || !result.READINGS || !result.READINGS_PLAIN) {
    throw new Error(`${hub}: the content model did not expose questions and both readings levels`);
  }
  const ids = new Set();
  for (const question of result.QUESTIONS) {
    if (!question || typeof question.id !== "string" || !question.id) throw new Error(`${hub}: a normalized question has no string id`);
    if (ids.has(question.id)) throw new Error(`${hub}: duplicate normalized question id ${question.id}`);
    ids.add(question.id);
  }
  for (const id of Object.keys(result.QUESTION_WHY || {})) {
    if (!ids.has(id)) throw new Error(`${hub}: QUESTION_WHY has no matching question ${id}`);
  }
  return result;
}

function evaluateHub(hub) {
  const file = resolve(ROOT, "hubs", hub, "index.html");
  const source = readFileSync(file, "utf8");
  const context = sandboxFor();
  try {
    // In the shared-engine version, factories such as mcq() are defined in
    // widget/hub.js and obtain local data through the preceding shHubBind().
    // Keep legacy hubs usable too: their factories remain in the inline prefix.
    if (source.includes("window.shHubBind(")) {
      const engine = readFileSync(HUB_ENGINE, "utf8");
      new vm.Script(engine, { filename: HUB_ENGINE, displayErrors: true }).runInContext(context, { timeout: 10_000 });
    }
    new vm.Script(captureProgram(inlineHubScript(source, file)), { filename: file, displayErrors: true }).runInContext(context, { timeout: 10_000 });
  } catch (error) {
    throw new Error(`${hub}: could not evaluate its data prefix: ${error && error.stack || error}`);
  }
  const result = context.window.__HUB_CONTENT__;
  return validateHubData(hub, result);
}

function unsafePaths(value, path = "$", seen = new Set(), issues = [], inArray = false) {
  if (value === null) return issues;
  const kind = typeof value;
  // JSON drops an undefined object property. That preserves every current hub
  // lookup (`q.pimg` is still undefined), while an undefined array item would
  // turn into null and is therefore rejected.
  if (kind === "undefined") { if (inArray) issues.push(`${path} is undefined in an array`); return issues; }
  if (kind === "function") { issues.push(`${path} is a function`); return issues; }
  if (kind === "symbol" || kind === "bigint") { issues.push(`${path} is ${kind}`); return issues; }
  if (kind === "number" && !Number.isFinite(value)) { issues.push(`${path} is not a finite number`); return issues; }
  if (kind !== "object") return issues;
  if (seen.has(value)) { issues.push(`${path} is circular`); return issues; }
  seen.add(value);
  const array = Array.isArray(value);
  for (const key of Object.keys(value)) unsafePaths(value[key], array ? `${path}[${key}]` : `${path}.${key}`, seen, issues, array);
  seen.delete(value);
  return issues;
}

function cloneJson(value, name) {
  const issues = unsafePaths(value);
  if (issues.length) throw new Error(`${name} cannot be represented as JSON: ${issues.slice(0, 8).join("; ")}${issues.length > 8 ? `; and ${issues.length - 8} more` : ""}`);
  return JSON.parse(JSON.stringify(value));
}

function available(data, name, fallback) {
  return data[name] === undefined ? fallback : cloneJson(data[name], name);
}

function reportFigureValues(data) {
  const values = {};
  const unsupported = {};
  for (const name of ["FIGS", "FIG_PLACE", "FIG_BY_LEC", "CASE_IMG", "ANIMA", "OD"]) {
    if (data[name] === undefined) continue;
    const issues = unsafePaths(data[name]);
    if (issues.length) unsupported[name] = issues;
    else values[name] = cloneJson(data[name], name);
  }
  return { values, unsupported };
}

function compactQuestionIndex(data) {
  return (data.QUESTIONS || []).map((q) => {
    const item = { id: q.id, lec: q.lec };
    if (q.src !== undefined) item.src = q.src;
    return item;
  });
}

function filesFor(hub, data) {
  const figures = reportFigureValues(data);
  const report = {
    format: 1,
    hub,
    source: `Generated from hubs/${hub}/index.html by tools/hub-content/extract.mjs. Do not edit this report by hand.`,
    files: {
      core: "core.json", questions: "questions.json", whys: "whys.json", notes: "notes.json",
      review: "review.json", study: "study.json", cases: "cases.json", figures: "figures.json"
    },
    fileFallbacks: {
      manifest: "manifest.js", core: "core.js", questions: "questions.js", whys: "whys.js",
      notes: "notes.js", review: "review.js", study: "study.js", cases: "cases.js", figures: "figures.js"
    },
    figureAssets: figureAssetsFor(hub),
    figures: Object.keys(figures.values),
    unsupportedFigureValues: figures.unsupported
  };
  const files = new Map([
    ["manifest.json", report],
    ["core.json", {
      lectures: available(data, "LECTURES", []),
      examInfo: available(data, "EXAM_INFO", []),
      courseDates: available(data, "COURSE_DATES", []),
      mockBlueprint: available(data, "MOCK_BLUEPRINT", {}),
      mockMulti: available(data, "MOCK_MULTI", null),
      mockLimit: available(data, "MOCK_LIMIT", null),
      examCounts: available(data, "EXAM_COUNTS", {}),
      sourceLabels: available(data, "SRC_LABEL", {}),
      drillHighYield: available(data, "DRILL_HY", {}),
      questionIndex: compactQuestionIndex(data)
    }],
    ["questions.json", { questions: available(data, "QUESTIONS", []) }],
    ["whys.json", { questionWhy: available(data, "QUESTION_WHY", {}) }],
    ["notes.json", {
      readings: available(data, "READINGS", {}),
      readingsPlain: available(data, "READINGS_PLAIN", {}),
      noteTables: available(data, "NOTE_TABLES", {})
    }],
    ["review.json", {
      review: available(data, "REVIEW", []),
      sequences: available(data, "SEQUENCES", []),
      sortSets: available(data, "SORT_SETS", []),
      caseSets: available(data, "CASE_SETS", {})
    }],
    ["study.json", {
      hints: available(data, "HINTS", []),
      cram: available(data, "CRAM", {}),
      likelyTopics: available(data, "LIKELY_TOPICS", [])
    }],
    ["cases.json", {
      cases: available(data, "CASES", {}),
      patientCases: available(data, "PCASES", {})
    }],
    ["figures.json", figures.values]
  ]);
  for (const [name, value] of [...files]) {
    const key = name === "manifest.json" ? "manifest" : name.replace(/\.json$/, "");
    const fallback = report.fileFallbacks[key];
    if (fallback) files.set(fallback, value);
  }
  return files;
}

function contentDir(hub) { return resolve(ROOT, "hubs", hub, "content"); }

function readJSONFile(file, label) {
  try { return JSON.parse(readFileSync(file, "utf8")); }
  catch (error) { throw new Error(`${label}: invalid or missing JSON (${error.message})`); }
}

function externalModel(hub) {
  const dir = contentDir(hub);
  const manifest = readJSONFile(resolve(dir, "manifest.json"), `hubs/${hub}/content/manifest.json`);
  if (!manifest || manifest.format !== 1 || manifest.hub !== hub || !manifest.files || !manifest.fileFallbacks) {
    throw new Error(`${hub}: content manifest needs format 1, its hub id, files, and fileFallbacks`);
  }
  /* The source figure build owns these paths; normalize this generated field
     before rendering/checking the external content files. */
  manifest.figureAssets = figureAssetsFor(hub);
  const names = ["core", "questions", "whys", "notes", "review", "study", "cases", "figures"];
  const payloads = new Map([["manifest.json", manifest]]);
  const value = {};
  for (const name of names) {
    const expected = `${name}.json`;
    if (manifest.files[name] !== expected) throw new Error(`${hub}: manifest must map ${name} to ${expected}`);
    if (manifest.fileFallbacks[name] !== `${name}.js`) throw new Error(`${hub}: manifest must map file fallback ${name} to ${name}.js`);
    value[name] = readJSONFile(resolve(dir, expected), `hubs/${hub}/content/${expected}`);
    payloads.set(expected, value[name]);
  }
  if (manifest.fileFallbacks.manifest !== "manifest.js") throw new Error(`${hub}: manifest must map its local fallback to manifest.js`);
  const core = value.core, questions = value.questions, whys = value.whys, notes = value.notes;
  const data = {
    LECTURES: core.lectures, EXAM_INFO: core.examInfo, COURSE_DATES: core.courseDates,
    QUESTIONS: questions.questions, QUESTION_WHY: whys.questionWhy,
    READINGS: notes.readings, READINGS_PLAIN: notes.readingsPlain, NOTE_TABLES: notes.noteTables,
    REVIEW: value.review.review, HINTS: value.study.hints, CRAM: value.study.cram, LIKELY_TOPICS: value.study.likelyTopics,
    CASES: value.cases.cases, PCASES: value.cases.patientCases, SEQUENCES: value.review.sequences,
    SORT_SETS: value.review.sortSets, CASE_SETS: value.review.caseSets, MOCK_BLUEPRINT: core.mockBlueprint,
    MOCK_MULTI: core.mockMulti, MOCK_LIMIT: core.mockLimit, EXAM_COUNTS: core.examCounts,
    SRC_LABEL: core.sourceLabels, DRILL_HY: core.drillHighYield, FIGS: value.figures.FIGS,
    FIG_PLACE: value.figures.FIG_PLACE, FIG_BY_LEC: value.figures.FIG_BY_LEC, CASE_IMG: value.figures.CASE_IMG
  };
  validateHubData(hub, data);
  const index = core.questionIndex;
  if (!Array.isArray(index) || index.length !== data.QUESTIONS.length) throw new Error(`${hub}: core questionIndex must contain every question exactly once`);
  const byId = new Map(data.QUESTIONS.map((q) => [q.id, q]));
  for (const item of index) {
    const q = item && byId.get(item.id);
    if (!q || item.lec !== q.lec || item.src !== q.src) throw new Error(`${hub}: core questionIndex does not match question ${item && item.id}`);
  }
  return { data, manifest, payloads };
}

function externalFilesFor(model) {
  const files = new Map(model.payloads);
  for (const [name, value] of [...model.payloads]) {
    const key = name === "manifest.json" ? "manifest" : name.replace(/\.json$/, "");
    const fallback = model.manifest.fileFallbacks[key];
    if (fallback) files.set(fallback, value);
  }
  return files;
}

function isExternalHub(hub) {
  return readFileSync(resolve(ROOT, "hubs", hub, "index.html"), "utf8").includes(EXTERNAL_MARKER);
}

function rendered(value, name) {
  // Data is generated and checked, not hand-edited. Compact payloads keep a deferred
  // fetch small; keep the tiny manifest legible for people and tooling.
  if (name.endsWith(".js")) {
    const key = name === "manifest.js" ? "@manifest" : name.replace(/\.js$/, "");
    return `window.shHubContent.receive(${JSON.stringify(key)},${JSON.stringify(value)});\n`;
  }
  return JSON.stringify(value, null, name === "manifest.json" ? 2 : undefined) + "\n";
}

function sameFile(file, text) {
  try { return statSync(file).isFile() && readFileSync(file, "utf8").replace(/\r\n/g, "\n") === text.replace(/\r\n/g, "\n"); }
  catch { return false; }
}

/* Find one complete `var NAME = …;` statement without mistaking semicolons
 * inside strings, comments, arrays, objects, or function bodies for its end.
 * The four hub files use this deliberately conservative shape for authored
 * data; if that changes, migration stops instead of deleting a guess. */
function varStatement(source, name, from = 0) {
  const re = new RegExp(`(^|\\n)[\\t ]*var\\s+${name}\\b`, "g");
  re.lastIndex = from;
  const match = re.exec(source);
  if (!match) return null;
  const start = match.index + match[0].lastIndexOf("var");
  let quote = "", line = false, block = false, paren = 0, square = 0, brace = 0;
  for (let i = start; i < source.length; i++) {
    const ch = source[i], next = source[i + 1];
    if (line) { if (ch === "\n") line = false; continue; }
    if (block) { if (ch === "*" && next === "/") { block = false; i++; } continue; }
    if (quote) {
      if (ch === "\\") { i++; continue; }
      if (ch === quote) quote = "";
      continue;
    }
    if (ch === "/" && next === "/") { line = true; i++; continue; }
    if (ch === "/" && next === "*") { block = true; i++; continue; }
    if (ch === "'" || ch === '"' || ch === "`") { quote = ch; continue; }
    if (ch === "(") paren++;
    else if (ch === ")") paren--;
    else if (ch === "[") square++;
    else if (ch === "]") square--;
    else if (ch === "{") brace++;
    else if (ch === "}") brace--;
    else if (ch === ";" && !paren && !square && !brace) return { start, end:i + 1 };
  }
  throw new Error(`Could not find the end of var ${name}`);
}

function replaceVar(source, name, replacement) {
  const spans = [];
  for (let from = 0;;) {
    const span = varStatement(source, name, from);
    if (!span) break;
    spans.push(span); from = span.end;
  }
  for (let i = spans.length - 1; i >= 0; i--) {
    const span = spans[i]; source = source.slice(0, span.start) + replacement + source.slice(span.end);
  }
  return source;
}

function replaceExport(source, replacement) {
  const start = source.lastIndexOf("window.SH_EXPORT = {");
  if (start < 0) throw new Error("Could not find final window.SH_EXPORT assignment");
  let quote = "", line = false, block = false, paren = 0, square = 0, brace = 0;
  for (let i = start; i < source.length; i++) {
    const ch = source[i], next = source[i + 1];
    if (line) { if (ch === "\n") line = false; continue; }
    if (block) { if (ch === "*" && next === "/") { block = false; i++; } continue; }
    if (quote) { if (ch === "\\") { i++; continue; } if (ch === quote) quote = ""; continue; }
    if (ch === "/" && next === "/") { line = true; i++; continue; }
    if (ch === "/" && next === "*") { block = true; i++; continue; }
    if (ch === "'" || ch === '"' || ch === "`") { quote = ch; continue; }
    if (ch === "(") paren++;
    else if (ch === ")") paren--;
    else if (ch === "[") square++;
    else if (ch === "]") square--;
    else if (ch === "{") brace++;
    else if (ch === "}") brace--;
    else if (ch === ";" && !paren && !square && !brace) return source.slice(0, start) + replacement + source.slice(i + 1);
  }
  throw new Error("Could not find the end of final window.SH_EXPORT assignment");
}

const EXPORT_EXAMS = {
  occlusion: "[ { label:'Midterm', date:EXAM_DATE }, { label:'Final', date:FINAL_DATE } ]",
  "heme-endo-exam2": "[ { label:'Heme & Endo Exam 2', date:EXAM_END } ]",
  "pcd-implants-exam1": "[ { label:'PCD Implants Exam 1', date:EXAM_END } ]",
  "special-patient-care": "[ { label:'Special Patient Care exam', date:EXAM_DATE, archiveHour:0 } ]"
};

function externalExport(hub) {
  return `function shExportQuestion(q){
  var hint = '';
  if(q && q.type === 'mcq' && q.choices) hint = q.choices[q.answer] || '';
  else if(q && q.type === 'multi' && q.correct && q.choices) hint = q.correct.map(function(k){ return q.choices[k]; }).join('; ');
  else if(q && q.type === 'sequence' && q.steps) hint = q.steps.join(' → ');
  else if(q && q.pairs) hint = q.pairs.map(function(p){ return p.join(': '); }).join('; ');
  if(q && q.ex) hint += (hint ? ' — ' : '') + q.ex;
  return { id:q && q.id, lec:q && q.lec, text:(q && q.stem) || '', hint:hint, choices:(q && q.choices) || null, answer:(q && q.type === 'mcq' ? q.answer : null) };
}
window.SH_EXPORT = {
  get lectures(){ return (LECTURES || []).map(function(l){ return { id:l.id, title:''+lecLabel(l)+' ' + l.title, who:l.who, status:l.status }; }); },
  get questions(){ return (QUESTIONS || []).map(shExportQuestion); },
  get sections(){ return shSearchSections(); },
  get hints(){ return (HINTS || []).map(function(x){ return { lec:x.lec, quote:x.quote }; }); },
  get exams(){ return ${EXPORT_EXAMS[hub]}; }
};`;
}

function migrateScript(source, hub) {
  if (source.includes(EXTERNAL_MARKER)) throw new Error(`${hub}: already migrated`);
  const questionStart = source.indexOf("var QUESTIONS = []");
  const readingsStart = source.indexOf("/* ---------- READINGS", questionStart);
  if (questionStart < 0 || readingsStart < 0) throw new Error(`${hub}: could not isolate its authored question factory block`);
  const questionPlaceholder = `${EXTERNAL_MARKER}
/* Final question objects live in content/questions.json. Keep these lexical
   declarations: shHubBind setters hydrate the existing local runtime names. */
var QUESTIONS = [];
var QUESTION_WHY = {};
var TWO_CHOICES = ['Both statements are true','Both statements are false','Statement 1 is true; statement 2 is false','Statement 1 is false; statement 2 is true'];
var CASES = {}, PCASES = {};
function pc(key){ var c = CASES[key] || {}; return { pcase:key, pbox:c.pbox, pimg:c.pimg }; }

`;
  let out = source.slice(0, questionStart) + questionPlaceholder + source.slice(readingsStart);
  const placeholders = {
    EXAM_INFO: "var EXAM_INFO = [];", COURSE_DATES: "var COURSE_DATES = [];", LECTURES: "var LECTURES = [];",
    FIGS: "var FIGS = {};", FIG_PLACE: "var FIG_PLACE = {};", FIG_BY_LEC: "var FIG_BY_LEC = {};", CASE_IMG: "var CASE_IMG = {};",
    READINGS: "var READINGS = {};", READINGS_PLAIN: "var READINGS_PLAIN = {};", NOTE_TABLES: "var NOTE_TABLES = {};",
    REVIEW: "var REVIEW = [];", SEQUENCES: "var SEQUENCES = [];", SORT_SETS: "var SORT_SETS = [];", CASE_SETS: "var CASE_SETS = {};",
    HINTS: "var HINTS = [];", CRAM: "var CRAM = {};", LIKELY_TOPICS: "var LIKELY_TOPICS = [];",
    PCASES: "var PCASES = {};", QUESTION_WHY: "var QUESTION_WHY = {};", SRC_LABEL: "var SRC_LABEL = {};", DRILL_HY: "var DRILL_HY = {};",
    MOCK_BLUEPRINT: "var MOCK_BLUEPRINT = {};", MOCK_MULTI: "var MOCK_MULTI = null;", MOCK_LIMIT: "var MOCK_LIMIT = null;", EXAM_COUNTS: "var EXAM_COUNTS = {};"
  };
  Object.keys(placeholders).forEach((name) => { out = replaceVar(out, name, placeholders[name]); });
  const drill = "render: function(el, qid){ var q = QUESTIONS_BY_ID[qid]; if(!q) return false; el.innerHTML = qCardHTML(q, { ctx:'drill' }); wireQuestionContainer(el); return true; }";
  const drillReplacement = "render: function(el, qid){ return window.shHubContent.renderQuestion(el, function(){ var q = QUESTIONS_BY_ID[qid]; if(!q) return false; el.innerHTML = qCardHTML(q, { ctx:'drill' }); wireQuestionContainer(el); return true; }); }";
  if (!out.includes(drill)) throw new Error(`${hub}: could not find its daily-drill renderer`);
  out = out.replace(drill, drillReplacement);
  const boot = out.lastIndexOf("\nboot();");
  if (boot < 0) throw new Error(`${hub}: could not find final boot() call`);
  out = out.slice(0, boot) + "\n/* The compact core/index is ready before Home renders; every larger set stays deferred. */\nwindow.shHubContent.configure({ base:'content/' });\nwindow.shHubContent.guardViews();\nwindow.SH_CONTENT_READY.then(function(){ boot(); }, window.shHubContent.report);" + out.slice(boot + "\nboot();".length);
  return replaceExport(out, externalExport(hub));
}

function migrateHub(hub, options) {
  const file = resolve(ROOT, "hubs", hub, "index.html"), html = readFileSync(file, "utf8"), found = inlineHubScriptMatch(html, file);
  const script = migrateScript(found.script, hub), next = html.slice(0, found.start) + script + html.slice(found.end);
  if (next === html) return 0;
  if (!options.dryRun) writeFileSync(file, next, "utf8");
  if (!options.dryRun) console.log(`${hub}: inline content migrated to content/`);
  else console.log(`${hub}: inline content would migrate to content/`);
  return 1;
}

function emitHub(hub, options) {
  const external = isExternalHub(hub);
  if (options.migrate && external) throw new Error(`${hub}: is already migrated`);
  const model = external ? externalModel(hub) : null;
  const data = model ? model.data : evaluateHub(hub);
  const dir = contentDir(hub);
  const outputs = model ? externalFilesFor(model) : filesFor(hub, data);
  let changed = 0;
  for (const [name, value] of outputs) {
    const file = resolve(dir, name);
    const text = rendered(value, name);
    if (sameFile(file, text)) continue;
    changed++;
    if (options.check) console.error(`${hub}: stale or missing hubs/${hub}/content/${name}`);
    else if (!options.dryRun) { mkdirSync(dir, { recursive: true }); writeFileSync(file, text, "utf8"); }
  }
  if (options.migrate) changed += migrateHub(hub, options);
  const q = data.QUESTIONS.length;
  const notes = Object.keys(data.READINGS).length;
  if (!options.check) console.log(`${hub}: ${q} normalized questions, ${notes} narrated lectures${changed ? `; ${changed} content file(s) ${options.dryRun ? "would change" : "written"}` : "; content is current"}`);
  return changed;
}

const options = parseArgs(process.argv.slice(2));
let changed = 0;
for (const hub of options.hubs) changed += emitHub(hub, options);
if (options.check) {
  if (changed) process.exitCode = 1;
  else console.log(`hub content: ${options.hubs.length} hub(s) current`);
}
