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
 *                   hyAudio: the lectures whose High yield narration matches it (hyRecorded below)
 *   study.json      hints, the cram sheet, the Review tables and processes (Side by side), the arcade's sort sets
 *   figures.js/.css the hub's drawings (built by its figure build, tools/figures/<hub>/build.mjs, where it has one)
 *   arcade.js/.css  the hub's arcade (its games list and skin)
 *
 * This script rebuilds the two parts that are worked out from the rest, so nobody edits them by hand:
 *
 *   core.json's index   from questions.json
 *   notes.json's hy     from the As taught notes, core.json's likelyTopics, study.json's hints and the questions
 *                       (tools/hub-next/high-yield.mjs; Sam, 2026-11-12), and hyAudio from the recordings on disk
 *
 * and writes the four JSON files in one layout (a question, a lecture, a hint, a topic to a line), so a change shows up
 * in a diff as the lines it touched. Edit the JSON (by hand or with a script), then run this.
 *
 *   node tools/hub-next/build.mjs              rebuild every hub on the engine
 *   node tools/hub-next/build.mjs --check      fail if a file isn't what this would write (CI runs this)
 *   node tools/hub-next/build.mjs --hub occlusion
 */
import { readFileSync, writeFileSync, existsSync, statSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
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
function hyRecorded(hub, lec, html){
  const mp3 = join(ROOT, "hubs", hub, "audio", lec + "-hy.mp3"), wf = mp3.replace(/\.mp3$/, ".words.json");
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
  /* the question index: [id, lecture, High likelihood, source] */
  core.index = questions.map((q) => [q.id, q.lec, q.likely ? 1 : 0, q.src || ""]);
  /* High yield, the third reading level: each lecture's predicted topics with the paragraphs of its notes that teach them */
  const hy = highYield({ notes: notes.full, topics: core.likelyTopics, hints: study.hints, questions });
  const out = {
    "core.json": layout("core.json", core),
    "questions.json": layout("questions.json", questions),
    "notes.json": layout("notes.json", Object.assign({}, notes, { hy, hyAudio: Object.keys(hy).filter((lec) => hyRecorded(hub, lec, hy[lec])) })),
    "study.json": layout("study.json", study)
  };
  /* the layout never changes what a file says */
  for (const f of ["core.json", "questions.json", "study.json"]) if (one(JSON.parse(out[f])) !== one(D[f])) throw new Error(`hubs/${hub}/content/${f}: the layout changed its data (tools/hub-next/build.mjs, layout)`);
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
  if (stale) { console.error(`${stale} file(s) stale: the content changed since its High yield and question index were built (or a lecture's High yield narration was recorded since, or a file was saved in another layout).`); process.exit(1); }
}
