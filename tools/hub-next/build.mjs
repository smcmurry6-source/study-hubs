#!/usr/bin/env node
/*
 * The content step for the hubs on the engine (widget/hub.js).
 *
 * A hub on the engine keeps its content in hubs/<hub>/content/, and since the redesign's release (2026-11) those files
 * are where the content is edited: there is no single-file hub to copy from any more.
 *
 *   core.json       the hub's facts for Home: lectures, exam info, course dates, likely topics, mock blueprint, the
 *                   podcast, and a compact question index ([id, lec, likely, src]) so Home draws before the bank loads
 *                   ("audio": "off" once the hub is archived and its mp3s came off the site: the engine then offers
 *                   no Timmy Time and Listen reads in the device's voice; vault/rules/archived-hubs-drop-their-audio.md)
 *   questions.json  every question in its final shape, its whys on it
 *   notes.json      the notes at both reading levels (full, plain), the High yield level built from them (hy), and
 *                   hyAudio: the lectures whose High yield narration matches it (hyRecorded below), and on a hub with
 *                   a professor's study guide, guideAudio: whether audio/guide.mp3 was spoken from today's guide
 *   study.json      hints, the cram sheet, the Review tables and processes (Side by side), the arcade's sort sets
 *   figures.js/.css the hub's drawings (built by its figure build, tools/figures/<hub>/build.mjs, where it has one)
 *   arcade.js/.css  the hub's arcade (its games list and skin)
 *   variants.json   (optional) a question's other wordings, shown on later tries: checked here (checkVariants) and
 *                   counted in core.json's "variants"
 *
 * This script rebuilds the two parts that are worked out from the rest, so nobody edits them by hand:
 *
 *   core.json's index   from questions.json
 *   notes.json's hy     from the As taught notes, core.json's likelyTopics, study.json's hints and the questions
 *                       (tools/hub-next/high-yield.mjs; Sam, 2026-11-12), and hyAudio from the recordings on disk
 *   notes.json's guideAudio  from audio/guide.mp3's words file and study.json's guide (tools/hub-next/guide.mjs)
 *
 * and writes the four JSON files in one layout (a question, a lecture, a hint, a topic to a line), so a change shows up
 * in a diff as the lines it touched. Edit the JSON (by hand or with a script), then run this.
 *
 *   node tools/hub-next/build.mjs              rebuild every hub on the engine
 *   node tools/hub-next/build.mjs --check      fail if a file isn't what this would write (CI runs this)
 *   node tools/hub-next/build.mjs --hub perio
 */
import { readFileSync, writeFileSync, existsSync, statSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { guideSpoken } from "./guide.mjs";
import { highYield } from "./high-yield.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
/* the hubs on the engine: every hub with content beside its page */
export const engineHubs = () => readdirSync(join(ROOT, "hubs")).filter((h) => existsSync(join(ROOT, "hubs", h, "content", "core.json"))).sort();

/* High yield's narration (vault/tasks/done/2026-11-12-high-yield-narration.md): hubs/<hub>/audio/<lecture>-hy.mp3, made by
   tools/narrate.py from notes.json's hy, with its words file beside it saying which text it was spoken from ("h", the
   first 12 hex digits of the SHA-1 of the HTML: narrate.py's text_hash). High yield changes whenever the notes, predicted
   topics, hints or questions do, so the page is offered the recording only while it was spoken from today's High yield;
   otherwise Listen reads it in the device's voice, and tools/ci/smoke.js fails until it's recorded again
   (vault/rules/text-and-audio-never-drift.md). Record or re-record it, then run this build again. */
const textHash = (html) => createHash("sha1").update(html, "utf8").digest("hex").slice(0, 12);
function hyRecorded(hub, lec, html){ return recorded(hub, lec + "-hy.mp3", html); }
/* the same for a professor's study guide: audio/guide.mp3, spoken from tools/hub-next/guide.mjs's text of the page */
function recorded(hub, file, html){
  const mp3 = join(ROOT, "hubs", hub, "audio", file), wf = mp3.replace(/\.mp3$/, ".words.json");
  if (!existsSync(mp3) || !existsSync(wf)) return false;
  try { const d = JSON.parse(readFileSync(wf, "utf8")); return d.v === 1 && d.h === textHash(html) && d.bytes === statSync(mp3).size; } catch (e) { return false; }
}

/* One layout for the four files. questions.json: a question to a line. The others: a key to a line, and under it a
   line for each item of a list of things (lectures, topics, hints) or each key of a map (a lecture's notes); the
   question index stays on one line (it is rebuilt, never read by a person). */
const one = (v) => JSON.stringify(v);
function layout(name, d){
  if (name === "questions.json") return "[\n" + d.map(one).join(",\n") + "\n]\n";
  const val = (k, v) => {
    if (k !== "index" && Array.isArray(v) && v.some((x) => x && typeof x === "object")) return "[\n" + v.map((x) => "  " + one(x)).join(",\n") + "\n ]";
    if (v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length) return "{\n" + Object.keys(v).map((x) => "  " + one(x) + ": " + one(v[x])).join(",\n") + "\n }";
    return one(v);
  };
  return "{\n" + Object.keys(d).map((k) => " " + one(k) + ": " + val(k, d[k])).join(",\n") + "\n}\n";
}

/* A question's other wordings (content/variants.json: { id: { stem, choices, why[, ex] } or a list of them; Perio since
   2026-11-18, vault/tasks/done/2026-11-17-reworded-question-variants.md). A later try shows the next wording, so each must be
   the same question: choice k is choice k reworded (the key, the server's answer keys, XP and the mock's scoring are the
   original's), a why for every choice, a statement question keeps its labels and its statements, and the reworded key may
   not be the longest choice in more than 40% of the hub's wordings. Nothing in it feeds High yield. Returns the problems. */
export function checkVariants(questions, V){
  const by = new Map(questions.map((q) => [q.id, q])), bad = [], LABELS = new Set(["2stmt", "tf", "numbered"]);
  const stm = (s) => String(s).split("\n").filter((l) => /^\s*\d+\.\s+/.test(l)).length;
  let mc = 0, longest = 0;
  for (const [id, raw] of Object.entries(V)) {
    const q = by.get(id); if (!q) { bad.push(`${id}: no such question`); continue; }
    for (const [k, v] of (Array.isArray(raw) ? raw : [raw]).entries()) {
      const at = `${id} (wording ${k + 2})`;
      if (!v || typeof v.stem !== "string" || !v.stem.trim()) { bad.push(`${at}: no stem`); continue; }
      if (v.stem.trim() === String(q.stem).trim()) bad.push(`${at}: the stem is the original's`);
      if (q.fmt === "2stmt" && !/^read the two statements/i.test(v.stem)) bad.push(`${at}: a two-statement stem starts "Read the two statements."`);
      if (q.fmt === "tf" && !/^true or false/i.test(v.stem)) bad.push(`${at}: a true/false stem starts "True or false:"`);
      if ((q.fmt === "2stmt" || q.fmt === "numbered") && stm(v.stem) !== stm(q.stem)) bad.push(`${at}: ${stm(v.stem)} statements, the original has ${stm(q.stem)}`);
      if (!Array.isArray(q.choices)) { if (v.choices || v.why) bad.push(`${at}: the question has no choices to reword`); continue; }
      if (!Array.isArray(v.choices) || v.choices.length !== q.choices.length) { bad.push(`${at}: ${(v.choices || []).length} choices, the original has ${q.choices.length}`); continue; }
      if (v.choices.some((c) => !String(c).trim())) bad.push(`${at}: an empty choice`);
      const low = v.choices.map((c) => String(c).trim().toLowerCase()); if (new Set(low).size !== low.length) bad.push(`${at}: duplicate choices`);
      if (LABELS.has(q.fmt) && JSON.stringify(v.choices) !== JSON.stringify(q.choices)) bad.push(`${at}: a ${q.fmt} question keeps its choice labels`);
      if (!Array.isArray(v.why) || v.why.length !== q.choices.length || v.why.some((w) => !String(w || "").trim())) bad.push(`${at}: needs a why for every choice`);
      if (q.type === "mcq" && q.choices.length >= 3) { mc++; const len = v.choices.map((c) => String(c).length); if (len[q.answer] > Math.max(...len.filter((_, i) => i !== q.answer))) longest++; }
    }
  }
  if (mc && longest / mc > 0.4) bad.push(`the reworded key is the longest choice in ${Math.round(100 * longest / mc)}% of MCQ wordings (keep it under 40%)`);
  return bad;
}

const FILES = ["core.json", "questions.json", "notes.json", "study.json"];
function build(hub){
  const dir = join(ROOT, "hubs", hub, "content");
  const cur = {}, D = {};
  for (const f of FILES) {
    const path = join(dir, f);
    if (!existsSync(path)) throw new Error(`hubs/${hub}/content/${f} is missing`);
    cur[f] = readFileSync(path, "utf8");
    try { D[f] = JSON.parse(cur[f]); } catch (e) { throw new Error(`hubs/${hub}/content/${f} is not valid JSON: ${e.message}`); }
  }
  const core = D["core.json"], questions = D["questions.json"], notes = D["notes.json"], study = D["study.json"];
  if (!Array.isArray(questions) || !questions.length) throw new Error(`hubs/${hub}/content/questions.json has no questions`);
  if (core.hub !== hub) throw new Error(`hubs/${hub}/content/core.json says its hub is "${core.hub}"`);
  /* a question's High likelihood flag (likely: the first predicted topic that lists it, which the bank's filter and tag,
     the mock's share and the drill read) is worked out from core.json's likelyTopics, so it can't fall behind them
     (BUG-164: re-ranking Exam 3's topics left 77 questions in a topic unflagged). Set in place, so its key keeps its spot. */
  const firstTopic = {};
  /* a topic's picks (Sam, 2026-11-20, Heme & Endo Exam 3: "can we make it higher yield with less redundant questions"): the
     questions a bank toggle with a basis shows from it (SH_HUB.bank.only's { basis }), each point the topic names asked
     once; its ids stay High likelihood and keep writing High yield. Picks are some of the topic's own ids, and a question's
     likely flag carries the topic without them, so picking changes nothing in questions.json. */
  for (const t of core.likelyTopics || []) {
    if (!t.picks) continue;
    const bad = t.picks.filter((id) => !(t.ids || []).includes(id));
    if (bad.length || new Set(t.picks).size !== t.picks.length) throw new Error(`hubs/${hub}/content/core.json: the topic "${t.t.slice(0, 60)}" picks ${bad.length ? bad.join(", ") + ", not among its ids" : "a question twice"}`);
  }
  (core.likelyTopics || []).forEach((t) => (t.ids || []).forEach((id) => { if (!firstTopic[id]) firstTopic[id] = t; }));
  const flag = (t) => { if (!t.picks) return t; const { picks, ...rest } = t; return rest; };
  questions.forEach((q) => { if (firstTopic[q.id]) q.likely = flag(firstTopic[q.id]); else delete q.likely; });
  /* the other wordings: checked, laid out a question to a line, and counted in core.json (the engine fetches the file only
     when the count is there) */
  const vPath = join(dir, "variants.json");
  if (existsSync(vPath)) {
    cur["variants.json"] = readFileSync(vPath, "utf8");
    try { D["variants.json"] = JSON.parse(cur["variants.json"]); } catch (e) { throw new Error(`hubs/${hub}/content/variants.json is not valid JSON: ${e.message}`); }
    const bad = checkVariants(questions, D["variants.json"]);
    if (bad.length) throw new Error(`hubs/${hub}/content/variants.json:\n  ` + bad.join("\n  "));
    core.variants = Object.keys(D["variants.json"]).length;
  } else delete core.variants;
  /* the question index: [id, lecture, High likelihood, source] */
  core.index = questions.map((q) => [q.id, q.lec, q.likely ? 1 : 0, q.src || ""]);
  /* High yield, the third reading level: each lecture's predicted topics with the paragraphs of its notes that teach them */
  const hy = highYield({ notes: notes.full, topics: core.likelyTopics, hints: study.hints, questions });
  const notesOut = Object.assign({}, notes, { hy, hyAudio: Object.keys(hy).filter((lec) => hyRecorded(hub, lec, hy[lec])) });
  /* the study guide's recording, offered only while it was spoken from today's guide (widget/guide.js) */
  delete notesOut.guideAudio;
  if ((study.guide || []).length) notesOut.guideAudio = recorded(hub, "guide.mp3", guideSpoken(core.lectures, study.guide));
  const out = {
    "core.json": layout("core.json", core),
    "questions.json": layout("questions.json", questions),
    "notes.json": layout("notes.json", notesOut),
    "study.json": layout("study.json", study)
  };
  if (D["variants.json"]) { const V = D["variants.json"]; out["variants.json"] = "{\n" + Object.keys(V).map((id) => one(id) + ": " + one(V[id])).join(",\n") + "\n}\n"; }
  /* the layout never changes what a file says */
  for (const f of ["core.json", "questions.json", "study.json", "variants.json"]) if (out[f] && one(JSON.parse(out[f])) !== one(D[f])) throw new Error(`hubs/${hub}/content/${f}: the layout changed its data (tools/hub-next/build.mjs, layout)`);
  /* the hub's scripts parse */
  for (const f of ["figures.js", "arcade.js"]) if (existsSync(join(dir, f))) new vm.Script(readFileSync(join(dir, f), "utf8"), { filename: `hubs/${hub}/content/${f}` });
  return { dir, cur, out, n: questions.length };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const CHECK = args.includes("--check");
  const only = args.includes("--hub") ? args[args.indexOf("--hub") + 1] : null;
  const hubs = engineHubs();
  if (only && !hubs.includes(only)) { console.error(`${only} is not a hub on the engine (no hubs/${only}/content/core.json); the hubs on it: ${hubs.join(", ")}`); process.exit(1); }
  let stale = 0;
  for (const hub of hubs) {
    if (only && hub !== only) continue;
    const { dir, cur, out, n } = build(hub);
    for (const [name, text] of Object.entries(out)) {
      if (cur[name] === text) continue;
      if (CHECK) { stale++; console.error(`stale: hubs/${hub}/content/${name} (run: node tools/hub-next/build.mjs)`); }
      else { writeFileSync(join(dir, name), text); console.log(`wrote hubs/${hub}/content/${name} (${(text.length / 1024).toFixed(0)} KB)`); }
    }
    console.log(`${hub}: ${n} questions${CHECK ? "" : ", content up to date"}`);
  }
  if (stale) { console.error(`${stale} file(s) stale: the content changed since its High yield and question index were built (or a lecture's High yield or the study guide's narration was recorded since, or a file was saved in another layout).`); process.exit(1); }
}
