---
type: inbox
tags: [tasks]
---

# Inbox

Quick ideas and requests, one line each. An agent asked to go through the inbox turns each line into a task note in
this folder (deleting the line: the note carries it) or just does it, if it's small and clear, and ticks it with its PR
(`- [x] ... (#123)`); ticked lines are cleared the next time someone goes through the inbox. Anything left to do from a chat
lands here or in a task note ([to-dos-go-in-the-vault](../rules/to-dos-go-in-the-vault.md)). See [README](README.md).

- [x] Visiting's other two parts from round 3 ([decisions](../decisions.md), 2026-11-10): **Visit someone random**, and **next and back**
  while visiting (the design page has both). The 2026-11-13 session built only what [its task](done/2026-11-12-redesign-visiting.md) asked: a board
  row opens that person's place. Both would reuse `widget/place.js`'s `tripIn`/`tripOut` (the round-3 clouds) and the board's visit keys;
  `migration_v54.sql` has no random-visit call (a key comes only on a board row), so "random" would pick among the boards' rows,
  or need a new function after the release: Sam's call. Sam, 2026-11-13: "build the random visit and next/back": built, picking among
  the board's own rows, nothing on the server ([#354](https://github.com/smcmurry6-source/study-hubs/pull/354)).

- [ ] **A live bug, Sam's call** (BUG-116 in [the bug log](../release/bug-log.md), 2026-11-13): on the live hubs and dashboard, after a
  level-up card no later card plays until the page reloads (a rank-up, a trophy, a medal, a mock result; the trophy itself is still
  recorded). In `levelNow`'s `close()` in `widget/rankup.js`, a local `var done` hides the queue's `done`. The redesign's pages have the
  fix ([the trophy case](2026-11-12-redesign-trophy-case-and-cards.md)); the live fix is to call the queue's `done` there too (the `NEW`
  branch's code for every page). Left out of that PR because Sam asked for the live pages to behave exactly as today. A tier 1 fix.

- [ ] The live About page says the trophy case has "24 trophies ... 14 of them secret", but today's list has 16 secret (Timmy's two
  trophies came later). Fix the number on the live page (a tier 1 text fix), or leave it to the release, whose About draft says 27 and
  16 ([the release](2026-11-06-redesign-release.md), "From phase 4, session 6"). Found 2026-11-13.

- [ ] Learn's answers are filed as context `other` because `migration_v54.sql`'s `record_answer_v2` doesn't list `learn` (v54 isn't
  changed without Sam's word). In the first migration after the release, add `learn` to its context list (the `case` in `sh_answer`),
  so the admin page can tell Learn's answers from the bank's (2026-11-12, [Learn and Flashcards](2026-11-06-redesign-learn-and-flashcards.md),
  [game-server](../reference/game-server.md)).

- [ ] Ask Timmy's "What should I study tonight?" on the new dashboard reads each hub's progress from this device's saved state
  (`progressFrom` in `widget/ask.js`), so on a new or linked device it sees nothing until a hub page has synced the answers. Read the
  student's own answers from the server there instead (their own rows, like the v2 bootstrap), or say "open a hub first" when every
  hub's state is empty (2026-11-12, [Ask Timmy](2026-11-12-redesign-ask-timmy.md) part 2).

- [ ] Class picks on each choice ignore question versions: `question_choices` (and `question_stats`) are keyed by position, so when
  an edit moves or rewrites choices, last week's percentages show beside a different choice until someone moves or clears the rows by
  hand (2026-11-04 evening lessons audit). Record the version with each pick (`record_choice`, `question_versions.v`) and read only the
  current one, as question health already does.

- [ ] Anima figures on phones: at 390 px their in-drawing labels scale down to about 6-7 px. A plain bigger font for narrow screens clipped labels at the edges in about half the PCD Implants figures (tried 2026-11-04, reverted); it needs a per-figure phone layout (labels moved inside the drawing) or tap-to-zoom. 
- [x] The site is near GitHub Pages' 1 GB cap: 960 MB on 2026-11-12, most of it narration (430 MB of it from archived hubs:
  Heme & Endo Exam 1, PCD Implants, MSK Exam 3 and 4, Special Patient Care, PCD Fixed Pros Exam 3). Ask Sam what can come down
  (for example archived hubs' mp3s, their pages falling back to the device voice) before adding more big files; the High yield
  narration waits on it ([task](done/2026-11-12-high-yield-narration.md)). Check whether the size is behind the slow publishes of
  11-06 and 11-10. Done 2026-11-12 ([#328](https://github.com/smcmurry6-source/study-hubs/pull/328)): Sam kept the bitrates and had the five archived hubs' audio
  taken off (958 → 589 MB), and every hub's at its archiving ([rule](../rules/archived-hubs-drop-their-audio.md),
  [next ones](2026-11-12-audio-off-at-archiving.md)). The publishes take 1-3 minutes at 958 MB; 11-10's timeout was a one-off.
- [ ] Retention, the part not built yet (approved 2026-11-04, [analytics-retention](../reference/analytics-retention.md)): before the school year ends (spring 2027), collapse `activity_hourly` / `activity_visits` older than the school year to hub × section × day with people counts and no ids, as one more step in `sh_retention_run`. Also ask Sam about the two rows the question-health work proposed (`question_events`, `question_feedback`).
