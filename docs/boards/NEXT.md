# Boards hub: what the next session does (handoff, updated 2026-10-13 after Session 6)

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

## Session 5 (done 2026-10-13, #82)

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
- **Codex at the end of Session 5:** T-02 pharm notes = draft #83, T-04 cards = draft #81, T-05 readiness/plan =
  draft #80 (all into `claude/boards-hub`, none reviewed or merged). T-03 perio notes sent to Codex 2026-10-13 (expect
  a draft PR from `codex/boards-perio-t03`). #80 and #81 both regenerate `hubs/boards/index.html`: merge one, then
  have Codex rebase the other and rerun `node tools/build-boards.js` instead of resolving that file by hand.

## Session 6 (done 2026-10-13)

- **Reviews, no merges** (fix prompts for Codex, verbatim, in `reviews/session-6.md`; check the revised PRs against
  them). All three PRs were branched before #82/#86 and are behind `claude/boards-hub`; merged together with it they
  build, pass `--check`, `syntax.js`, the plan tests and the full `smoke.js`. The only conflict is the generated page.
  - **#83 (T-02 pharm):** scripted acceptance passes and no fact is wrong, but ~10 author-facing sentences, 13
    claims pushed past their facts (END-11 "routine dental care" instead of procedures under local anesthesia, AC-4
    implying antiplatelets may be stopped, "weak / very low quality" attached to the wrong END advice, CDC on
    benzodiazepines inverted, a dropped "probably", "meth mouth" discouraged...), no PK-3-PK-6 yet, and Deep gaps
    (codeine/tramadol in children, AB-5 doses, SSRIs vs epinephrine). Blueprint: a duplicated PG-7 concept, no PK,
    MME or codeine-in-children concepts, and 5 of 7 cases with a problem (an allergy that rules out the AB-3 key, a
    pregnant patient whose allergy key rests on facts we don't have, a dose-ceiling item at 26 weeks, a dry-mouth
    item with no dry-mouth finding, two same-concept items that give each other away).
  - **#81 (T-04 cards):** Playwright walk-through (desktop and 390 px phone, fixture build). Works: reshuffle with
    authored-index recording, "Recorded" only until Rounds, resume at item 3, one event per item, Cover options.
    Bugs: Practice jumps into Cases on a case item and then can't get back; New only skips the next item; Missed is
    read-only; a done case can't be redone and a first attempt skips items answered elsewhere; on phones the open
    chart pushes question 1 to ~1,300 px down.
  - **#80 (T-05 plan):** 10 tests pass, core pure, CI step added. Logic fixes: retirement skips the 120-day review;
    new case items are planned piecemeal; the monthly sample only fires on the 1st; band "Started" with nothing seen;
    ability replays only the latest try; same-day plans can differ (async class stats).
  - **Merge order:** #80, then #81 (Codex merges `claude/boards-hub` and reruns the build instead of resolving the
    page). #83 and #87 touch only their unit folders and can merge any time after their fixes. Each only after its
    fix round.
- **#87 (T-03 perio, arrived during the session):** reviewed the same way (`tools/boards/notes-sheet.js`). Scripted
  checks pass and the notes keep their qualifiers, but one statement is wrong (Cairo recession types "do not predict
  root coverage"), ~15 author-facing lines, and overlapping concepts (three on PH-5). Cases: two outlines where an
  item keyed on access flap or one furcation technique conflicts with EFP's regeneration rule for mandibular molars
  with Class II furcations (SX-1/SX-2/PR-6), an abscess and necrotizing disease in one box, a gingivitis case keyed on
  the periodontitis steps, a missing enlargement finding. Fix prompt in `reviews/session-6.md`. Branched from current
  `claude/boards-hub`; touches only `src/boards/units/perio/`, so it merges any time after its fixes.
- **T-06 brief written** (`tasks/T-06.md`): the 60 medcx items from the merged blueprint, cases first, ids
  `b-medcx-0101`-`0160` (0001-0009 are the benchmark's), `checked: null`, a count-check script for quotas, siblings,
  case order, extra refs and key spread.
- **Fact and spec notes:** the medcx blueprint's `warfarin-simple-extraction` cites `AC-2` (partial: the 2-3 range is
  verified, INR-check timing is not; T-06 says so). `PG-5`'s nitrous oxide advice still has no quote (Codex flagged
  it; add one). `DM-7` now lists `perio` in its `units` (T-03 assigns it to perio-systemic; done in Session 6). A
  mucogingival fact on Cairo types and expected root coverage (open source) would let the notes say what #87 had to
  delete. If #80's fix keeps `likely` averaged over practiced items, update BUILD_SPEC 6.4 to say so.

## Session 7: re-review the four PRs, check T-06

1. **Revised #80, #81, #83:** check each against its list in `reviews/session-6.md` (only the changed parts; rerun the
   acceptance commands and, for #81, the walk-through: `docs/boards/reviews/walk-cards.js`, extended for Practice /
   New only / Missed / Do it again / phone chart). Tell Sam which are ready, in the order above.
2. **T-06 (medcx items)** when its PR arrives: code checks first (lint, build `--unit medcx`, the count check), then
   the checker: `node tools/boards/bench.mjs render --items src/boards/units/medcx/items.js --ids <ids> --out
   docs/boards/verify/medcx-r1 --name <batch>` in batches of ~10 items (smaller batches cost less: most checker tokens
   are re-reads of the batch file), a fresh Sonnet subagent per batch with `checker-prompt.md`, and **two passes on
   every high-risk item** (56 of the 60 slots cite a high-risk fact), taking the union of flags. Budget: ~8.6k tokens
   per item check at the benchmark's batch size, so up to ~1M for two passes. The writer is Codex (OpenAI) and the
   checker Claude, so this is the first cross-family check (the benchmark was Claude checking Claude). Then one fix
   prompt for Codex, and stage 4b (two fresh passes) on every changed item.
3. **Revised #87 (perio notes)**: check against its list in `reviews/session-6.md` (`node tools/boards/notes-sheet.js
   perio` makes the sentence and fact sheets). Small fact edit for Claude: the `PG-5` quote.
4. Next briefs once these land: T-07 `items-pharm` (after #83 merges), `int-notes-home` (after #80 and #81), and
   `int-mock`. `int-v33` and `int-widget` stay with Claude.

## Release 1

R1a, R1b, R1c as in `BUILD_SPEC.md` 8.2, with the `PLAN_V2.md` changes (local-first storage with server backup,
review page for Sam, risk-tiered checking, item provenance). Before shipping each drop: About page entry, dashboard
card (`exams: []` plus the "~Aug 2028" note, no auto-archive), DEPLOY_NOTES line, PR description in student-facing
words, CI green, then PR #70 out of draft for Sam to merge.

## Still open (ask Sam when it matters, don't block on it)

- UAB course calendar from D2 spring to D4 (unit order, cram windows).
- A D4 or faculty member willing to look at high-risk questions.
- Names: "Chairside" and "Boards Hub: INBDE + ADEX" are the working names.
