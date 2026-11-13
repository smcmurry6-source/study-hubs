---
type: inbox
tags: [tasks]
---

# Inbox

Quick ideas and requests, one line each. An agent asked to go through the inbox turns each line into a task note in
this folder (deleting the line: the note carries it) or just does it, if it's small and clear, and ticks it with its PR
(`- [x] ... (#123)`); ticked lines are cleared the next time someone goes through the inbox. Anything left to do from a chat
lands here or in a task note ([to-dos-go-in-the-vault](../rules/to-dos-go-in-the-vault.md)). See [README](README.md).

- [ ] **After the redesign's release: what the old pages still hold up** (2026-11-13, [the release](2026-11-06-redesign-release.md)).
  When the last single-file hub's page comes down (the archived ones and Heme & Endo Exam 2): take out the `NEW` (`html.shx`)
  branches in `widget/ranks.js` and `widget/rankup.js` (the old cards, the 23-trophy list), the old house picture and
  `sh_rank_tier`'s use in `widget/pet.js` (`houseSvg`: today only the fallback under the place on the dashboard), the
  `rpc2` fallbacks in `widget/dash.js` for a database without the game layer, `legacy` and the unused `modes` in `hubs.js`,
  and any separate widget file or the full client (`widget/vendor/supabase-2.117.2.js`) that `grep` finds no page loading
  by name (`review/` keeps the full client). The sources of a bundle are never deleted.
- [ ] **Load a hub's answer keys by itself after a question change** (2026-11-13, the release). Today it is a step by hand
  after every merge that changes `hubs/<hub>/content/questions.json` ([build-a-hub](../how-to/build-a-hub.md), "The answer
  keys"): until it's done a new question earns nothing and a re-keyed one is graded on its old key. Make it hard to
  forget: a check that compares the bank with the server's keys (an admin function that returns each hub's ids and
  versions, read by `tools/release/postcheck.js`), or a workflow on `main` that loads them (it would need the admin
  secret as a repository secret: Sam's call).
- [ ] **Deploy Ask Timmy's function by itself when it changes** (2026-11-13, the release). `supabase/functions/timmy/site.json`
  is rebuilt from the About page in every PR that changes it, but the `timmy` Edge Function is deployed by hand
  ([ask-timmy](../reference/ask-timmy.md), "At the release", step 3), so Timmy's site help lags the About page until
  someone deploys. Until this is automated, a session that changes `supabase/functions/timmy/` deploys it after the merge.
- [ ] **The first migration after the release** (2026-11-13) also counts the **Bowling** trophy on the server (add `bowling`
  to the achievement kinds; until then it is kept on the device and shows no share of the class:
  [the bowling egg](done/2026-11-06-redesign-bowling-egg.md)), with Learn's `learn` context (the line below).
- [x] **Sam's call: the hub trophies in the trophy case** (2026-11-13: "Each hub should get a shelf"; built in #359) (2026-11-13, from [the trophy case](done/2026-11-12-redesign-trophy-case-and-cards.md)).
  The 8 trophies each hub has (the mastery levels, every question answered, mock exams, the boss) aren't in the new case:
  they are behind its Leaderboards button, in the shared widget's panel. A shelf for them in the case, or leave them there?
- [ ] **Heme & Endo Exam 2's retrospective and recap** (2026-11-13, from the release's PR #359): Sam had it archived and its
  audio taken off in the PR; its retrospective (`/lessons-audit`: `tools/retro.sql`, `LESSONS.md`) and its recap on the
  dashboard (`tools/publish-recap.js`, which writes to the live database, so after the merge) are still to do. Read the
  check-ins as late as you can.
- [ ] **Recaps missing from Past hubs** (2026-11-13, Sam: "There are a lot of past hubs missing from the recap card"): the
  live site has 8 published recaps; **Special Patient Care** (its exam closes Nov 13, 11:59 pm) and **Heme & Endo Exam 2**
  have none yet. Publish each with its retrospective. Hubs archived before recaps existed (GI Exam 1, Genetics, Fixed
  Pros and older) have no bank dump to draw one from: say so to Sam if he asks for them.
- [ ] **Learn: a typed answer** (2026-11-13, idea from making Learn "more like quizlet"): Quizlet's Learn ends on written
  questions. Ours ends on recall before the choices show (Sam's call 5, 2026-11-06), because a typed answer can't be
  graded against a bank question's choice. Only if Sam asks for it.
- [ ] **Flashcards: undo the last rating** (2026-11-13, same): not built, because a rating is paid and sent to the server
  at once; it needs the rating held back a few seconds first. Only if Sam asks for it.
- [ ] **Visiting from a hub's boards** (2026-11-13, [visiting](done/2026-11-12-redesign-visiting.md)): the leaderboards in a
  hub's own panel (`widget/v3.js`) don't open anyone's place yet (Sam, 2026-11-12: the dashboard's boards first).
- [ ] **Sound for the hand-off and the Dark Matter unlock**, only if the redesign ever gets a sound setting (it has none; the
  scenes are silent on purpose: [the journeys](2026-11-06-redesign-progression-journeys.md)).

- [ ] **A new hub's blocking time after the bundles** (2026-11-13, [phase 5, part 2](done/2026-11-05-redesign-phase-5-backend.md), [#358](https://github.com/smcmurry6-source/study-hubs/pull/358)):
  on `perf.js`'s slow phone a new hub's total blocking time was 230-365 ms on `main` and is 310-540 ms with the bundles
  across runs (350-385 in the final run; budget 500, fails past 750). The same scripts run, in fewer and longer tasks.
  Not looked into: a trace of the first seconds to see which tasks are long (the engine's start, or `widget/v3.js`'s,
  which is shared with the live hubs). Worth a look at the release, when v3.js no longer has to stay as it is for the old pages.

- [x] Visiting's other two parts from round 3 ([decisions](../decisions.md), 2026-11-10): **Visit someone random**, and **next and back**
  while visiting (the design page has both). The 2026-11-13 session built only what [its task](done/2026-11-12-redesign-visiting.md) asked: a board
  row opens that person's place. Both would reuse `widget/place.js`'s `tripIn`/`tripOut` (the round-3 clouds) and the board's visit keys;
  `migration_v54.sql` has no random-visit call (a key comes only on a board row), so "random" would pick among the boards' rows,
  or need a new function after the release: Sam's call. Sam, 2026-11-13: "build the random visit and next/back": built, picking among
  the board's own rows, nothing on the server ([#354](https://github.com/smcmurry6-source/study-hubs/pull/354)).

- [x] **A live bug, Sam's call** (BUG-116 in [the bug log](../release/bug-log.md), 2026-11-13): on the live hubs and dashboard, after a
  level-up card no later card plays until the page reloads (a rank-up, a trophy, a medal, a mock result; the trophy itself is still
  recorded). In `levelNow`'s `close()` in `widget/rankup.js`, a local `var done` hides the queue's `done`. The redesign's pages have the
  fix ([the trophy case](done/2026-11-12-redesign-trophy-case-and-cards.md)); the live fix is to call the queue's `done` there too (the `NEW`
  branch's code for every page). Left out of that PR because Sam asked for the live pages to behave exactly as today. A tier 1 fix.
  Sam: "ship the BUG-116 live fix too": fixed live in the same PR ([#356](https://github.com/smcmurry6-source/study-hubs/pull/356)).

- [x] The live About page says the trophy case has "24 trophies ... 14 of them secret", but today's list has 16 secret (Timmy's two
  trophies came later). Fix the number on the live page (a tier 1 text fix), or leave it to the release, whose About draft says 27 and
  16 ([the release](2026-11-06-redesign-release.md), "From phase 4, session 6"). Found 2026-11-13. Done with the release's About page
  (27, 16 secret).

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
