# Boards hub: what the next session does (handoff, updated 2026-10-13 after Session 3)

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

## Session 3 (done 2026-10-13)

- **132 new facts, 317 in all, 1,076 cites (1,063 exact, 0 missing)**, from 67 new open sources: asthma and COPD
  (RES), syncope (SYN), kidney disease (CKD), liver disease (LIV), inherited bleeding disorders (BLD), thyroid and
  adrenal (END), sickle cell (SCD), transplant (TX), opioids and opioid use disorder (OPI), periodontal prognosis (PR),
  osteoradionecrosis (ORN-4 to 9), chemotherapy thresholds from current sources (CH-5 to 14, AAPD 2022 and NCI).
  Pipeline: a drafter per topic group, an independent verifier per group (40 records rewritten, none dropped), then a
  third check of every rewrite (9 more fixes: missing supporting quotes, two dropped qualifiers, `stem_names` on
  SYN-9 and END-2). Weak sources the verifiers flagged are named in each record's `conditions`.
- **int-build done:** `tools/build-boards.js`, the `src/boards/` skeleton (five modes, minimal MCQ card), the lint
  refactor into `tools/boards/lint-core.cjs`, CI wiring; three independent reviews (spec, robustness, integration),
  8 findings fixed. Build `--check`, syntax and the full smoke test pass locally. `--unit <id>` now validates a unit
  folder that isn't in `UNITS` yet (writes nothing).
- **Bench:** `b-medcx-0009` verified (two passes). `b-medcx-0008` rewritten to key the AAPD 2022 counts for a
  15-year-old (the archived NIDCR guide is gone from it), repaired once more after recheck 4 and passed both recheck-5 passes. **All 20 bench items are
  now verified** (`bench/REPORT.md`).
- **Codex connected** (DECISIONS 2026-10-13). First brief: `docs/boards/tasks/T-01.md` (medcx notes + blueprint).
- **Lesson:** two reviewer agents deleted the whole scratchpad while "cleaning up" and took unverified drafts with
  them (rebuilt by replaying the drafters' commands). Every agent prompt now names its own scratch subfolder and forbids
  touching anything else.

## Session 4: Codex PRs in, next briefs out

1. Review Codex's T-01 PR: notes against the fact records (every `data-ref` supports its sentence; `conditions` and
   `stem_names` respected), blueprint quotas. Fix notes go in the PR; merge into `claude/boards-hub` when clean.
2. Write the next briefs in one batch: T-02 pharm notes + blueprint, T-03 perio notes + blueprint, T-04 `int-cards`,
   T-05 `int-plan` (BUILD_SPEC 9). Briefs name exact files, acceptance commands and what not to touch, like T-01.
3. medcx items from the merged blueprint (Codex drafts, `checked:null`), then the Claude-subagent checker, two passes
   on high-risk items, per `bench/REPORT.md`.
4. `int-v33` (next free migration number; `migration_v33.sql` is taken) and `int-widget` stay with Claude.

## Release 1

R1a, R1b, R1c as in `BUILD_SPEC.md` 8.2, with the `PLAN_V2.md` changes (local-first storage with server backup,
review page for Sam, risk-tiered checking, item provenance). Before shipping each drop: About page entry, dashboard
card (`exams: []` plus the "~Aug 2028" note, no auto-archive), DEPLOY_NOTES line, PR description in student-facing
words, CI green, then PR #70 out of draft for Sam to merge.

## Still open (ask Sam when it matters, don't block on it)

- UAB course calendar from D2 spring to D4 (unit order, cram windows).
- A D4 or faculty member willing to look at high-risk questions.
- Names: "Chairside" and "Boards Hub: INBDE + ADEX" are the working names.
