#!/usr/bin/env node
// Builds supabase/functions/timmy/site.json, the site help Ask Timmy answers "how do I ..." questions from: the About page
// (about/index.html), one entry per feature, with every spoiler (.spoil and its placeholder) and "new" tag left out, so
// Timmy never gives away an easter egg the page keeps hidden.
//   node tools/timmy/build.mjs           write it
//   node tools/timmy/build.mjs --check   fail if it's out of date (CI: "The redesign's generated files are current")
// Rebuild it whenever about/index.html changes; the function reads it at deploy time.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseHTML, textOf, clean, walk } from "../../supabase/functions/timmy/core.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "supabase/functions/timmy/site.json");
const DROP = ["spoil", "spoil-ph", "tag", "eyebrow", "spoil-toggle"];

const cls = el => " " + (el.attrs.class || "") + " ";
function prune(n){
  n.children = n.children.filter(c => typeof c === "string" || !(c.name === "script" || c.name === "style" || DROP.some(d => cls(c).includes(" " + d + " "))));
  n.children.forEach(c => { if (typeof c !== "string") prune(c); });
  return n;
}
const txt = n => clean(textOf(n));
function find(n, test){ const out = []; walk(n, el => { if (test(el)) out.push(el); }); return out; }

export function build(){
  const root = prune(parseHTML(fs.readFileSync(path.join(ROOT, "about/index.html"), "utf8")));
  const sections = [];
  for (const sec of find(root, el => el.name === "section" && el.attrs.id)) {
    const h2 = find(sec, el => el.name === "h2")[0];
    const title = h2 ? txt(h2) : sec.attrs.id, items = [], seen = new Set();
    const push = t => { t = clean(t); if (t.length > 3 && !seen.has(t)) { seen.add(t); items.push(t); } };
    const inItem = new Set();
    for (const head of find(sec, el => el.name === "header")) for (const p of find(head, el => el.name === "p")) push(txt(p));
    for (const it of find(sec, el => cls(el).includes(" item "))) {
      walk(it, el => inItem.add(el));
      const h3 = find(it, el => el.name === "h3")[0], body = find(it, el => el.name === "p" || el.name === "li").map(txt).filter(Boolean).join(" ");
      push((h3 ? txt(h3) + ": " : "") + body);
    }
    for (const tr of find(sec, el => el.name === "tr" && !inItem.has(el))) {
      const cells = tr.children.filter(c => typeof c !== "string" && (c.name === "td" || c.name === "th")).map(txt).filter(Boolean);
      if (cells.length) push(cells.join(" · "));
    }
    for (const p of find(sec, el => (el.name === "p" || el.name === "li") && !inItem.has(el))) if (!find(sec, el => el.name === "header").some(h => { let f = false; walk(h, e => { if (e === p) f = true; }); return f; })) push(txt(p));
    if (items.length) sections.push({ id: sec.attrs.id, title, items });
  }
  return { built: "from about/index.html by tools/timmy/build.mjs (spoilers left out); rebuild when the About page changes", sections };
}

const json = JSON.stringify(build(), null, 1) + "\n";
if (process.argv.includes("--check")) {
  const now = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
  if (now !== json) { console.error("✗ supabase/functions/timmy/site.json is out of date: run node tools/timmy/build.mjs"); process.exit(1); }
  console.log("✓ supabase/functions/timmy/site.json is current");
} else {
  fs.writeFileSync(OUT, json);
  const s = JSON.parse(json).sections;
  console.log(`wrote supabase/functions/timmy/site.json: ${s.length} sections, ${s.reduce((a, x) => a + x.items.length, 0)} entries, ${json.length} bytes`);
}
