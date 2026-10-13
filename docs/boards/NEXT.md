# Boards hub: what the next session does (handoff, updated 2026-10-13 during Session 5)

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

## Session 4 (done 2026-10-13)

- **T-01 reviewed** (Codex PR #78, medcx notes + blueprint). Every cited sentence of Core (3,356 words) and Deep
  (6,834) was read against its fact: no wrong facts. Fixed on `claude/eloquent-cerf-7v4iqg` (PR into
  `claude/boards-hub`, which carries Codex's commit too, so merging it also lands #78): about 25 author-facing
  phrases ("the fact record says", "not verified") rewritten for students; missing `stem_names` (WFH, Endocrine
  Society, NIDCR/AAPD, BTS); 5 near-verbatim phrases; three claims pulled back inside their facts (prilocaine
  "relatively" contraindicated, the HIV lab values and unit, no "do not restrain" in seizure first aid). Blueprint:
  section quotas didn't match concept siblings in 10 of 14 sections; one case used the ADA table's self-contradicting
  diastolic range; one keyed pediatric AAPD counts for a 59-year-old. All fixed; still 60 items, 30 in 8 cases.
- **Briefs out:** T-02 pharm notes + blueprint (with the T-01 lessons and two check scripts as acceptance), T-03
  perio notes + blueprint (**blocked on `facts-perio`**), T-04 `int-cards`, T-05 `int-plan`. T-02, T-04 and T-05
  can run in parallel.
- **Fact gaps found:** seizure first aid has no "do not restrain / nothing in the mouth" fact (EM-7 is CDC's short
  list); pharm has only PK-1/PK-2 for pharmacokinetics; perio lacks the healthy periodontium, biofilm and calculus,
  radiographs, surgery, local delivery and host modulation. Codex's T-01 fact problems (BP-2 crisis numbers, HIV-2
  units, IE-5 doses, DM-6, PG-2, ORN-3) are all already in those facts' `conditions`; nothing to change.

## Session 5 (2026-10-13, in progress)

- **`facts-perio` done (step 2):** 15 new perio facts (`BF-1`-`BF-5`, `RAD-1`-`RAD-2`, `PT-8`-`PT-11`, `SX-1`-`SX-2`,
  `LD-1`-`LD-2`), plus `EM-11` (CDC seizure "what to avoid") and `PK-3`-`PK-6` (half-life, bioavailability and first
  pass, protein binding, liver/kidney and the lidocaine label). 337 facts, 1,179 cites (0 missing). 6 new sources (Arestin and
  PerioChip labels, ADA/FDA 2012 radiograph guide, 2025 J Clin Periodontol imaging review, 2024 calculus review, OpenStax
  *Pharmacology* 2.2). Pipeline: drafted by Claude; an independent verifier (5 pass, 15 fixed: dropped qualifiers,
  causal links no source states, missing pregnancy/abscess/kidney warnings); a third check of the rewrites (14 pass, 6
  fixed: BF-2 menstrual-cycle caution, BF-4/BF-5 wording, RAD-2 leaned on one study's table cell, LD-2 abscess
  caution, PK-5 "some drugs"); quote check 105/105 exact on the new records. Weaknesses are in each record's
  `conditions`.
- **Gaps left (no open source good enough):** probing technique and the CAL arithmetic (CAL from probing depth and
  recession; NCBI Bookshelf/PMC copies block scripts), peri-implant treatment (the EFP 2023 peri-implant S3 guideline
  is not open on Europe PMC). Listed in T-03.
- **Quote check fix:** fda.gov now answers Node's fetch with HTTP 401 (it serves curl), and the headless-browser
  fallback dropped the FDA CYP table, so `PK-1`/`PK-2` showed 9 missing quotes. `check-quotes.mjs` now retries with
  `curl` before the browser; both FDA sources read fine again.
- **T-03 unblocked.** Follow-ups: when reviewing T-02, check the notes use `PK-3`-`PK-6` (they arrived after the brief);
  the medcx notes' seizure paragraph can now cite `EM-11` (T-01 had to drop "do not restrain").
- **Codex at the time of writing:** T-04 draft #81, T-05 draft #80 (CI green); no T-02 branch pushed yet. #80 and #81
  both regenerate `hubs/boards/index.html`: whichever merges second rebuilds it with `node tools/build-boards.js`
  instead of resolving the conflict by hand.

## Session 5 plan: facts, then medcx items

1. Sam merges this session's PR into `claude/boards-hub` (it includes #78) and starts T-02, T-04 and T-05 in Codex.
2. Claude: `facts-perio` (BUILD_SPEC 9) plus the small top-ups above (seizure first aid from CDC; pharmacokinetics
   basics from FDA labeling or an open pharmacology text with a stable URL), same pipeline as Session 3 (drafter,
   independent verifier, quote check). Then lift the block in T-03.
3. Brief T-06 `items-medcx` (60 items from `src/boards/units/medcx/blueprint.json`, `checked:null`) for Codex, then
   the Claude-subagent checker with two passes on high-risk items (`bench/REPORT.md`).
4. Review T-02/T-04/T-05 PRs as they arrive (same method as T-01: a sheet of each cited sentence beside its fact;
   for code, run the fixture build in Playwright on desktop and phone).
5. `int-v33` and `int-widget` stay with Claude.

## Release 1

R1a, R1b, R1c as in `BUILD_SPEC.md` 8.2, with the `PLAN_V2.md` changes (local-first storage with server backup,
review page for Sam, risk-tiered checking, item provenance). Before shipping each drop: About page entry, dashboard
card (`exams: []` plus the "~Aug 2028" note, no auto-archive), DEPLOY_NOTES line, PR description in student-facing
words, CI green, then PR #70 out of draft for Sam to merge.

## Still open (ask Sam when it matters, don't block on it)

- UAB course calendar from D2 spring to D4 (unit order, cram windows).
- A D4 or faculty member willing to look at high-risk questions.
- Names: "Chairside" and "Boards Hub: INBDE + ADEX" are the working names.
