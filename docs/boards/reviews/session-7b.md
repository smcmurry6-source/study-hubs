# Session 7b reviews (2026-10-14, a second Claude session): the 12 new Codex PRs

Sam asked for #94-#106 (Codex prompts written in a parallel session the same day), so they are in scope. Session 7 (`session-7.md`) covered #80, #81, #83, #87 and #91; this file covers the rest. Scripted checks first on every
branch (own tests, `build-boards.js --check`, `syntax.js`, `lint-items.mjs`), then the walk-throughs, then reading.

| PR | What | State |
|---|---|---|
| #80 | T-05 readiness + plan | **Merged by this session** before it saw Session 7's stale-`finalReview` bug: follow-up prompt below |
| #81 | T-04 cards | All 10 walk steps pass (desktop + phone). Needs: merge `claude/boards-hub` (now has #80), rebuild, phone nit below |
| #102 | int-mock (stacked on #81) | `walk-mock.js` passes on desktop and phone. Merge after #81; rebuild after #81 lands. Code not read line by line yet |
| #99 | check-items.mjs | Works, dry run fine, parser test passes. Bench score is inflated (below) |
| #94 | item-sheet.js | Works; too noisy and too long (below) |
| #97 | migration v34 draft | Read in full for safety. One bug, one gap (below). Not applied (needs int-widget first) |
| #95 | game core | Tests pass; `--check` fails (bundle not committed) |
| #100 | perio chart figure | Test passes; `--check` fails (page not rebuilt). Sam: look at the screenshots in the PR |
| #101 | game art | `--check` fails (bundles not committed). Sam: look at the screenshots in the PR |
| #98 | task helper | Test passes; not read yet |
| #103, #104, #106 | endo / gaps / anes facts | Build and lint clean. Need the independent fact check (next session) |

## Fix prompts

### #99 checker

```text
Revise PR #99 (codex/boards-checker). Two fixes, then rerun the dry run and the test.

1. The --bench catch rate counts any non-pass verdict on a seeded item as a catch. The benchmark (docs/boards/bench/REPORT.md, "Seeded copies caught for the planted defect") only counted a catch when the checker flagged the planted defect. key.json gives each seeded item a `type` (wrong-key, defensible-distractor, missing-qualifier, rationale-contradicts, length-cue, outdated, ...). Map each type to the checker `check` values that count as finding it (e.g. wrong-key -> key; defensible-distractor -> distractor or ambiguity; missing-qualifier -> key, current or rationale; rationale-contradicts -> rationale; length-cue -> giveaway; outdated -> current) and print both lines: "flagged anything" and "flagged the planted defect", with a per-type breakdown like REPORT.md's. Put the map at the top of the file. Extend the test with a canned verdict that flags the wrong thing.
2. The default model id must be one OpenRouter actually lists. On startup (non-dry runs), GET https://openrouter.ai/api/v1/models once, fail early with a clear message and 5 close matches if --model isn't listed, and print the model's price per million tokens. Don't hardcode a model you haven't seen in that list; document the pick in the PR.
```

### #94 item sheet

```text
Revise PR #94 (codex/boards-item-sheet). On the 60 T-06 medcx items it writes ~300 KB with 125 flags, most of them noise.

1. Drop the "Explanation sentence N has no inline fact citation" flag: BUILD_SPEC 4.3 puts citations in the item's `refs`, not inline (the brief was wrong). Instead flag: a `refs` entry that is missing or unverified, an item whose refs are all `partial`, and a `why` line count that doesn't match the choices.
2. Never truncate a fact's claim or quotes (the reviewer has to read them in full).
3. Print each fact once per output file, in a "Facts" appendix at the end (claim, status, risk, conditions, quotes, source), and under each item only the fact ids with their status. Target: under 120 KB for the 60 medcx items.
4. Print `conditions` from the facts' real field (several facts show "Conditions: —"; check the README's field name and print nothing when empty).
Rerun on src/boards/units/medcx/items.js from #91 (--items) and put the new size and flag counts in the PR.
```

### #95, #100, #101 (one Codex session)

```text
PRs #95 (codex/boards-game-core), #100 (codex/boards-perio-chart) and #101 (codex/boards-game-art) fail `node tools/build-boards.js --check`: the build bundles src/boards/game/* into hubs/boards/game/<bundle>.js and embeds figures, and those outputs weren't committed. On each branch: merge origin/claude/boards-hub, run node tools/build-boards.js, commit the generated files, rerun node tools/build-boards.js --check && node tools/ci/syntax.js plus the branch's own test, push. If a bundle now ships to the page before the hub adapter exists, say so in the PR (it should be lazy-loaded only; nothing should run on page load).
```

### #97 migration draft

```text
Revise PR #97 (codex/boards-migration-draft). Don't apply anything.

0. main already has migration_v34.sql (get_my_answers). Rename yours to the next free number (fetch origin/main; v35 today), and fix the number in BUILD_SPEC 1.7 and the PR title.

1. upsert_srs keeps a row only when excluded.t > current.t, so a later change on the same day is lost (right answer in the morning, miss in the afternoon: the miss resets b to 0 locally, but the server keeps the old b, and a new device schedules the item as if it were known). Use >= for t in upsert_srs and in redeem_link_code's srs move (latest call wins within a day), and add a SQL comment saying why.
2. game_saves has no cap on slots: any visitor id can create unlimited 200 KB rows with new slot names. In save_game, refuse a new slot when that visitor already has 8 slots for that hub (updates to an existing slot still allowed). Mention it in BUILD_SPEC 1.7 item 3.
Update supabase/schema.sql to match.
```

### #81 then #102

```text
#80 is merged into claude/boards-hub. On codex/boards-t04-int-cards (#81): merge origin/claude/boards-hub, resolve hubs/boards/index.html by rebuilding (node tools/build-boards.js), never by picking a side. Phone nit: with the chart open, question 1's stem still starts below the fold at 390x844 (top y=808). On phones cap the open chart at about 40vh (it already scrolls inside), and tighten the walk step to assert the stem's top is under 700 px. Rerun walk-cards.js (10 steps), --check, syntax, smoke, push.
Then on codex/boards-int-mock (#102): merge the updated codex/boards-t04-int-cards, rebuild, rerun walk-mock.js, push.
```

### #80 follow-up (merged with a known bug; new branch from claude/boards-hub)

```text
Branch codex/boards-plan-finalreview from origin/claude/boards-hub; draft PR into claude/boards-hub. Touch only src/boards/app/45-readiness-plan.js, tools/ci/boards-plan.test.js and the rebuilt page.

Bug (found in Session 7, docs/boards/reviews/session-7.md, #80): a missed final review leaves STATE.ui.finalReview[qid] set. Months later, when the item climbs back to the last step, sr.t is after that old day and lastCorrect is true, so it retires the moment it reaches the last step, without the final review being asked. Fix: a finalReview mark only counts while the item has stayed at the last step since it was set. In the core, ignore (and return in a new `clearFinal` list) any finalReview id whose srs b is below steps.length; the wrapper deletes those marks. Add a test: final review planned, missed (b back to 0), climbs back to the last step, must be planned for its final review again, not retired. Rerun the plan tests, --check, syntax; paste the pass lines in the PR.
```
