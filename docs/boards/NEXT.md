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
  the 20th), 0 false alarms; my first-pass item quality was 55-70%; 9 real defects found, 8 fixed. Sam said **go** on 2026-10-11.

## Session 2 (done 2026-10-11)

- Sam said **go**. Repaired bench items re-checked twice (two passes each, `bench/REPORT.md`): 8 verified;
  `b-pharm-0003` fixed a third time but not counted (failed two rounds); `b-medcx-0008` open (archived NIDCR source).
- Lint: `stem_names` (BP-3 ADA, CH-2 NIDCR, AB-3/AB-5 ADA) and the hedged-key warning.
- **33 new facts, 185 in all, 338 quotes confirmed**, from 27 new open sources: perio therapy (EFP S3 2020),
  abscess / necrotizing disease / endo-perio lesions and drug-influenced enlargement (2017 World Workshop papers,
  mirrored at umw.edu.pl), perio-systemic; emergencies (ADA, Red Cross CPR, CDC stroke and seizure, albuterol,
  diphenhydramine, NHLBI); hepatitis, HIV, TB, cardiac devices; tobacco cessation, methamphetamine, xerostomia,
  stewardship, CYP3A interactions (FDA table).

## Session 3: last fact gaps, then the build tool

1. **Remaining fact gaps** (no ADA topic page covers these; use open guidelines or reviews, quotes checked):
   asthma and COPD, kidney disease and dialysis, liver disease beyond HEP-2, thyroid and adrenal disease (steroid
   cover), sickle cell disease, transplant and immunosuppression; opioid prescribing beyond RX-3/RX-6 and opioid use
   disorder; periodontal prognosis (PMC5900888 is open); a current (not archived) source for dental thresholds during
   chemotherapy, then fix `b-medcx-0008`; an osteoradionecrosis definition; syncope management.
2. **Second checker pass** for the 10 bench items checked once, plus `b-pharm-0003`, in **one** batch (overhead).
3. Then R1a as below: `tools/build-boards.js` and the hub shell (BUILD_SPEC 2), units medcx and pharm.

## Session 4 onward: release 1

R1a, R1b, R1c as in `BUILD_SPEC.md` 8.2, with the `PLAN_V2.md` changes (local-first storage with server backup,
review page for Sam, risk-tiered checking, item provenance). Before shipping each drop: About page entry, dashboard
card (`exams: []` plus the "~Aug 2028" note, no auto-archive), DEPLOY_NOTES line, PR description in student-facing
words, CI green, then PR #70 out of draft for Sam to merge.

## Still open (ask Sam when it matters, don't block on it)

- UAB course calendar from D2 spring to D4 (unit order, cram windows).
- A D4 or faculty member willing to look at high-risk questions.
- Names: "Chairside" and "Boards Hub: INBDE + ADEX" are the working names.
