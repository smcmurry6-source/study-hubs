# Boards hub: what the next session does (handoff, updated 2026-10-11 after Session 1)

Start here. Branch `claude/boards-hub`, draft PR #70. Read, in order: `DECISIONS.md`, `PLAN_V2.md` (approved), then
only the parts of `BUILD_SPEC.md` and `research/*.md` the current step needs (grep headings; never read big files
whole). Nothing on the live site has changed yet.

## Interim mode: Claude only

Sam will set up Codex and opencode later. Until then Claude does every role in `PLAN_V2.md`, keeping its principles:

- **Be frugal.** This account hit its weekly limit during planning. One drop per session; short, fresh sessions; no
  multi-agent research sweeps; batch shell commands; effort `high` for judgment, `medium` for routine edits.
- **Keep checking independent.** The writer never checks its own questions in the same context:
  - If `OPENROUTER_API_KEY` is set in the environment, run the scripted adversarial checker on a non-Anthropic model
    (Qwen or another family on OpenRouter; pick by the benchmark).
  - Otherwise use a separate Claude subagent with the adversarial prompt from `PLAN_V2.md` item 4 as the interim
    checker (weaker on independence; say so in the PR).
- **Code checks first:** never spend model tokens on what a script can prove.
- When Codex/opencode arrive, switch drafting and building to them per `PLAN_V2.md` "Who does what".

## Session 1 (done 2026-10-11)

- `DEPLOY_NOTES.md` trimmed: entries from 2026-09-26 and earlier moved to `DEPLOY_HISTORY.md` (not imported).
  Root `AGENTS.md` written for Codex/opencode.
- **Fact records:** `src/boards/facts/` (`sources.json` + `pharm`, `medcx`, `anes`, `perio`, `endo`; schema in its
  README), 152 facts with 266 verbatim quotes confirmed in their sources by `tools/boards/check-quotes.mjs`. Not yet
  quoted: the AHA 2021 statement (ahajournals blocks scripts; 10 cites). Errata: LA-11 (phentolamine age), FM-4
  (Miller grade 2, marked partial). New: EM-1 to EM-3 (EpiPen, nitroglycerin, naloxone labels).
- **Scripts:** `tools/boards/check-quotes.mjs` (fetch, cache, verify quotes; `--grep`/`--propose` to add new ones),
  `tools/boards/lint-items.mjs` (PLAN_V2 item 9 + BUILD_SPEC 4.7 checks, fact schema), `tools/boards/bench.mjs`.
- **Benchmark:** `docs/boards/bench/REPORT.md`. Sonnet subagent checker caught 19/20 planted defects (code checks got
  the 20th), 0 false alarms; my first-pass item quality was 55-70%; 9 real defects found and fixed. Recommendation:
  go, with the conditions in the report. **Waiting on Sam's go/no-go.**

## Session 2: close the benchmark loop, then facts for release 1

1. **Re-verify** the 9 repaired items in `docs/boards/bench/items.js` with a fresh checker (stage 4b; only the changed
   items). If an OpenRouter key exists by then, also run `run1/` through a non-Anthropic checker and add a run-2 row
   to the report.
2. **Lint additions** from the benchmark: a fact field naming the guideline a stem must cite (BP-4, CH-2), a wider
   hedging/absolutes check.
3. **Fill fact gaps** for the release-1 units, quotes checked as you go (`check-quotes.mjs --grep/--propose`):
   medcx (asthma/COPD, kidney, liver, thyroid/adrenal, infectious disease, sickle cell and transplant; emergencies:
   syncope, seizure, stroke, chest pain, anaphylaxis follow-up, BLS; the AHA is blocked, so look for open
   alternatives), pharm (pharmacokinetics/CYP, opioids and substance use, tobacco cessation, drug effects with oral
   signs), perio (nonsurgical therapy and reevaluation, adjuncts, supportive therapy intervals, necrotizing disease
   and abscesses, endo-perio lesions, prognosis, perio-systemic links). Also an ORN definition fact (the benchmark
   item needs one).
4. **AHA 2021 quotes:** if Sam puts the PDF in Google Drive, a session can save it as
   `.cache/boards-sources/aha-ie-2021.local.pdf` (never committed) and add the 10 missing quotes with `--propose`.

## Session 3 onward: release 1

R1a, R1b, R1c as in `BUILD_SPEC.md` 8.2, with the `PLAN_V2.md` changes (local-first storage with server backup,
review page for Sam, risk-tiered checking, item provenance). Before shipping each drop: About page entry, dashboard
card (`exams: []` plus the "~Aug 2028" note, no auto-archive), DEPLOY_NOTES line, PR description in student-facing
words, CI green, then PR #70 out of draft for Sam to merge.

## Still open (ask Sam when it matters, don't block on it)

- UAB course calendar from D2 spring to D4 (unit order, cram windows).
- A D4 or faculty member willing to look at high-risk questions.
- Names: "Chairside" and "Boards Hub: INBDE + ADEX" are the working names.
