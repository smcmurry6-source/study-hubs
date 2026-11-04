// Checks the Perio hub's Patient Box cases against their own numbers: every case in PCASES with an `expect` is run
// through the shared kit's derive() (the 2018 staging and grading tables, recession types, peri-implant states), and
// the key the case was written for must come out. node tools/figures/perio/cases-check.mjs (or build.mjs --check).
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const KB = "/* pcase:kit begin (built from tools/figures/shared/dental-cases.js; edit there) */\n", KE = "/* pcase:kit end */\n";
const PB = "/* pcases begin */\n", PE = "/* pcases end */\n";

function slice(src, b, e, what) {
  const i = src.indexOf(b), j = src.indexOf(e);
  if (i < 0 || j < i) throw new Error("markers not found: " + what);
  return src.slice(i + b.length, j);
}
export function checkCases(hubSrc) {
  const kit = slice(hubSrc, KB, KE, "pcase kit"), cases = slice(hubSrc, PB, PE, "pcases");
  const ctx = {}; vm.createContext(ctx);
  vm.runInContext(kit + "\n" + cases + "\nthis.DCASE = DCASE; this.PCASES = PCASES;", ctx);
  const { DCASE, PCASES } = ctx;
  let bad = 0, n = 0;
  for (const [id, c] of Object.entries(PCASES)) {
    const d = DCASE.derive(c.spec), e = c.expect || {};
    const got = { kind: d.kind, stage: d.stage, grade: d.grade, extent: d.extent, dx: d.dx, rt: d.rt, impl: d.impl, triggers: d.triggers, ratio: d.ratio, maxInterdental: d.maxInterdental.v, maxRBL: d.maxRBL.pct, bopPct: d.bopPct };
    const problems = [];
    for (const k of Object.keys(e)) {
      const want = e[k], have = k === "rt" || k === "impl" ? got[k] : got[k];
      const same = typeof want === "object" ? Object.keys(want).every((kk) => JSON.stringify(have && have[kk]) === JSON.stringify(want[kk]) || (have && have[kk] && typeof have[kk] === "object" && Object.keys(want[kk]).every((k3) => have[kk][k3] === want[kk][k3]))) : have === want;
      if (!same) problems.push(`${k}: expected ${JSON.stringify(want)}, the numbers give ${JSON.stringify(have)}`);
    }
    n++;
    const line = `${id}: ${d.dx}${d.extent == null ? " (no extent given)" : ""}; worst interdental CAL ${d.maxInterdental.v} mm, bone loss ${d.maxRBL.pct}%, ratio ${d.ratio}, BOP ${d.bopPct}%` +
      (d.triggers.length ? `; triggers: ${d.triggers.join(", ")}` : "") + (Object.keys(d.rt).length ? `; recession ${JSON.stringify(d.rt)}` : "") + (Object.keys(d.impl).length ? `; implants ${JSON.stringify(d.impl)}` : "");
    if (problems.length) { bad++; console.error("PCASES " + line + "\n  DISAGREES: " + problems.join("; ")); } else console.log("PCASES ok  " + line);
  }
  if (bad) console.error(`${bad} of ${n} perio cases disagree with their own numbers`); else console.log(`${n} perio cases agree with their numbers`);
  return !bad;
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const ok = checkCases(readFileSync(join(HERE, "../../../hubs/perio/index.html"), "utf8"));
  process.exit(ok ? 0 : 1);
}
