// Pastes the Occlusion hub's drawing kit into hubs/occlusion/index.html between its markers.
//   node tools/figures/occlusion/build.mjs          rebuild the hub's kit blocks from the files here
//   node tools/figures/occlusion/build.mjs --check  exit 1 if the hub's blocks are out of date
// The kit (od.js: occlusal teeth, fence posts, contact maps, the redrawn FIGS), the case images (cases.js), the
// "What cusp hits where?" game (game.js) and their CSS (od.css) are plain browser JS/CSS: edit them here, never the
// generated blocks in the hub. Standing rules: CLAUDE.md -> "Diagrams (the anima skill)".
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const HUB = join(HERE, "../../../hubs/occlusion/index.html");
const read = (f) => readFileSync(join(HERE, f), "utf8").trimEnd() + "\n";
const JB = "/* od:kit begin (built from tools/figures/occlusion; edit there) */\n", JE = "/* od:kit end */\n";
const CB = "/* od:css begin */\n", CE = "/* od:css end */\n";

function between(src, b, e, body){
  const i = src.indexOf(b), j = src.indexOf(e);
  if (i < 0 || j < i) throw new Error("markers not found: " + b.trim());
  return src.slice(0, i) + b + body + src.slice(j);
}
const hub = readFileSync(HUB, "utf8");
let out = between(hub, JB, JE, read("od.js") + read("cases.js") + read("game.js"));
out = between(out, CB, CE, read("od.css"));
if (process.argv.includes("--check")) {
  if (out !== hub) { console.error("hubs/occlusion/index.html: the kit blocks are stale; run node tools/figures/occlusion/build.mjs"); process.exit(1); }
  console.log("occlusion kit blocks are up to date");
} else {
  writeFileSync(HUB, out);
  console.log("wrote", HUB);
}
