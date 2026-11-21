/* A professor's study guide's narration (hubs/<hub>/audio/guide.mp3): the text it is spoken from.

   widget/guide.js draws the guide's page (#notes/guide) from study.json's guide; this is the same page's readable part,
   as HTML, in the same order: each lecture's heading ("L17 · Pregnancy and Lactation"), its items (the heading, then the
   explainer), the sections that aren't on the guide (more: "Also stressed in class", "Said not needed"), then its key terms. What the page marks data-sh-noread (the lecture's badge, "Dr. Herr · 9 questions on the
   exam", the buttons) isn't in it, so a new question never changes the recording. tools/narrate.py speaks it
   (python3 tools/narrate.py <hub> --level guide), Follow along matches its words to the page's, and
   tools/hub-next/build.mjs offers the recording to the page (notes.json's guideAudio) only while its words file says it
   was spoken from today's text ("h", the first 12 hex digits of the SHA-1 of this HTML), as for High yield
   (vault/rules/text-and-audio-never-drift.md). Change how widget/guide.js draws the readable part and this must change
   with it.

   node tools/hub-next/guide.mjs <hub>   prints the HTML (nothing when the hub has no guide); tools/narrate.py reads it so */
import { readFileSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/* lectures: core.json's; guide: study.json's. The page's lecture order, and only lectures the hub has (widget/guide.js secs()). */
export function guideSpoken(lectures, guide){
  const L = lectures || [], by = Object.fromEntries(L.map((l) => [l.id, l]));
  const secs = (guide || []).filter((g) => by[g.lec]).sort((a, b) => L.indexOf(by[a.lec]) - L.indexOf(by[b.lec]));
  return secs.map((g) => {
    const l = by[g.lec], title = String(l.title).split(":")[0];
    /* "L17" is said "Lecture 17" (narrate.py: data-say is spoken, the text inside is what the page shows) */
    const label = l.label ? esc(l.label) : '<span data-say="Lecture ' + esc(l.num) + '">L' + esc(l.num) + "</span>";
    return "<h2>" + label + " · " + esc(title) + "</h2>" +
      (g.items || []).concat(g.more || []).map((it) => "<h3>" + esc(it.h) + "</h3>" + (it.body || "")).join("") +
      ((g.terms || []).length ? "<h3>Key terms</h3><dl>" + g.terms.map((t) => "<div><dt>" + esc(t.t) + "</dt><dd>" + t.d + "</dd></div>").join("") + "</dl>" : "");
  }).join("");
}

/* the hub's guide narration text, or "" without a guide */
export function hubGuide(dir){
  const read = (f) => JSON.parse(readFileSync(join(dir, f), "utf8"));
  if (!existsSync(join(dir, "study.json"))) return "";
  const study = read("study.json");
  return (study.guide || []).length ? guideSpoken(read("core.json").lectures, study.guide) : "";
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const a = process.argv[2];
  if (!a) { console.error("usage: node tools/hub-next/guide.mjs <hub>"); process.exit(2); }
  const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
  const dir = existsSync(join(a, "core.json")) ? a : existsSync(join(a, "content", "core.json")) ? join(a, "content") : join(ROOT, "hubs", a, "content");
  if (!existsSync(join(dir, "core.json"))) { console.error("no content/core.json for " + a); process.exit(2); }
  process.stdout.write(hubGuide(dir));
}
