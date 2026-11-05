// The hubs' house style (the 2026-11 redesign): one shared stylesheet, pasted into every hub between its markers so
// each hub stays a single file with no extra request. Edit tools/house/house.css (and a hub's ink in hubs.json),
// never the pasted copies.
//   node tools/house/build.mjs            paste the current house.css into every hub listed in hubs.json
//   node tools/house/build.mjs --check    exit 1 if any hub's copy is stale (CI runs this)
//   node tools/house/build.mjs occlusion  one hub only
// Notes: vault/release/reports/2026-11-05-redesign-design-notes.md, vault/tasks/2026-11-05-site-redesign-taste.md.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "../..");
const START = "/* sh-house:start (built from tools/house/house.css; edit there, then node tools/house/build.mjs) */\n";
const END = "/* sh-house:end */\n";
const cfg = JSON.parse(readFileSync(join(HERE, "hubs.json"), "utf8"));
const css = readFileSync(join(HERE, "house.css"), "utf8").trimEnd() + "\n";
const check = process.argv.includes("--check");
const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));
let stale = [], done = 0;

for (const [id, hub] of Object.entries(cfg.hubs)) {
  if (only.length && !only.includes(id)) continue;
  const file = join(ROOT, "hubs", id, "index.html");
  if (!existsSync(file)) continue;
  const src = readFileSync(file, "utf8");
  const block = START + `:root{--sh-ink:${hub.ink};--sh-ink-deep:${hub.deep};}\n` + css + END;
  let out;
  const i = src.indexOf(START), j = src.indexOf(END);
  if (i >= 0 && j > i) out = src.slice(0, i) + block + src.slice(j + END.length);
  else {
    const k = src.indexOf("</style>");
    if (k < 0) throw new Error(id + ": no </style> to paste before");
    out = src.slice(0, k) + block + src.slice(k);
  }
  if (out === src) { done++; continue; }
  if (check) { stale.push(id); continue; }
  writeFileSync(file, out);
  done++;
  console.log(`hubs/${id}/index.html: house block ${i >= 0 ? "updated" : "added"}`);
}
if (check) {
  if (stale.length) { console.error("stale house blocks: " + stale.join(", ") + "; run node tools/house/build.mjs"); process.exit(1); }
  console.log(`house blocks up to date in ${done} hubs`);
}
