# Boards hub: what the next session does (handoff, updated 2026-10-14 after Session 7)

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

## Session 7 (done 2026-10-14)

- **Re-reviews** (verdicts and fix prompts, verbatim, in `reviews/session-7.md`):
  - **#83 (T-02 pharm): ready to merge.** Every Session 6 point done, acceptance passes, the new PK paragraphs stay
    inside PK-3 to PK-6. Two leftovers for Claude after merge: Deep's methamphetamine line still lacks "rampant caries,
    often called meth mouth"; the c-pharm-0005 TX-6 note goes into the T-07 brief (the blueprint has no note field).
  - **#80 (T-05):** all 7 points done, 12 tests pass; one new bug, reproduced: a stale `finalReview` mark (left after
    a missed final review) retires the item the moment it climbs back to the last step. One small fix.
  - **#81 (T-04):** all 6 points done; Codex's walk-through 10/10, plus Claude's phone check of question 2 (chart
    collapsed, summary shows the patient). One small fix: Practice and Missed share `bankAt`.
  - **#87 (T-03):** all points done; new giveaway in c-perio-0005's box ("After regenerative surgery") and one
    subjectless Deep sentence. One small fix.
- **#91 (T-06, 60 medcx items), stage 4a done:** code checks pass; checker = fresh Sonnet agent per batch of 10, two
  passes on all six batches (`verify/medcx-r1/`), union of flags, every medium/high flag adjudicated. 16 clean, 44 to
  fix, 7 with a high flag (two defensible keys on 0124, box states the key on 0140/0159/0124, an anaphylaxis box with
  an "elective care" stem on 0120, 0132 in BP-3's forbidden diastolic band, 0144 hinging on 70 vs 72 mg/dL). Main
  pattern: throwaway distractors in ~30 items (T-06 rule 6). Fix prompt sent via Sam. **Budget note:** the 12 agents
  hit the account's session limit right after writing their files; 2 passes x 60 items is about the most one session
  can run.
- **PG-5:** nitrous oxide quote added (ADA, exact), conditions updated.
- **Merged 2026-10-14:** #80 (before its stale-mark fix; the fix goes in a follow-up PR) and #83 (Deep "meth mouth"
  leftover fixed on the Session 7 branch).
- **#94-#106** are Codex tasks Sam asked for, reviewed in another thread (not here). Note for that thread:
  `migration_v34.sql` already exists on main (`get_my_answers`), so #97's v34 must be renumbered.

## Session 8: merge what's ready, stage 4b

1. The #80 follow-up PR (stale `finalReview` fix), revised #81 and #87: check only the fix in `reviews/session-7.md`;
   merge #80's fix, then #81 (rebuild the page), then #87.
2. Revised #91: rerun lint/build/count check, then **stage 4b**: two fresh checker passes on every changed item only
   (`bench.mjs render --ids <changed>`; batches of ~10). Items clean in 4a and unchanged are done. Then T-06 can merge.
3. Briefs: T-07 `items-pharm` (after #83; add the c-pharm-0005 TX-6 note), `int-notes-home` (after #80 and #81).
   `int-mock` may already be #102: check before writing it.

## Session 7b (2026-10-14, parallel Claude session; details in `reviews/session-7b.md`)

- Sam asked for #94-#106 (Codex prompts from this session), so step 4's "ask Sam" is answered: review them.
- Scripted checks on every branch; walk-throughs for #81 (10/10) and #102 (pass, desktop and phone); reads of #97,
  #99, #94. #95, #100, #101 fail `--check` (generated bundles not committed; rebuild only).
- **#80 was merged by this session** (39db637) before it saw Session 7's stale-`finalReview` bug. Follow-up prompt
  in `session-7b.md`; don't revert. Merges now need Sam's OK per PR (auto-mode flagged the merge).
- #97: renumber to v35 (main has v34); `upsert_srs` drops same-day changes (`>` should be `>=`); cap game-save slots.
- #99: bench catch rate counts any flag as a catch; must count the planted defect. #94: drop the inline-citation flag
  (spec puts cites in `refs`), stop truncating facts, print each fact once.
- Not yet read: #98 and #102's code; facts PRs #103, #104, #106 (step 4 applies).

## Release 1

R1a, R1b, R1c as in `BUILD_SPEC.md` 8.2, with the `PLAN_V2.md` changes (local-first storage with server backup,
review page for Sam, risk-tiered checking, item provenance). Before shipping each drop: About page entry, dashboard
card (`exams: []` plus the "~Aug 2028" note, no auto-archive), DEPLOY_NOTES line, PR description in student-facing
words, CI green, then PR #70 out of draft for Sam to merge.

## Still open (ask Sam when it matters, don't block on it)

- UAB course calendar from D2 spring to D4 (unit order, cram windows).
- A D4 or faculty member willing to look at high-risk questions.
- Names: "Chairside" and "Boards Hub: INBDE + ADEX" are the working names.
