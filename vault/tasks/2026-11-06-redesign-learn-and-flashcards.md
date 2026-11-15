---
type: task
status: blocked
hub: widget
created: 2026-11-06
requested-by: Sam
due: 
waiting-on: "the redesign's release (migration_v56 applied after v54 and v55, sw.js's PRECACHE, the About page entries)"
agent: Claude Code (2026-11-12)
pr: https://github.com/smcmurry6-source/study-hubs/pull/344
---

# Learn and Flashcards: a toggle that changes how the Question Bank is studied

## Goal

Still wanted (Sam, 2026-11-11, on the new Heme & Endo Exam 2: "i had previously asked for a quizlet learn mode and an anki
flashcard mode ... did that get lost"). It wasn't built in phase 1 or 2; it's this task, in a session of its own
([run-a-redesign-session](../how-to/run-a-redesign-session.md)).

Sam's idea (2026-11-06): "a toggle in the question bank to switch the format to Quizlet Learn or Anki flashcards." The
Questions view gets a three-way toggle, **Study as: Questions · Learn · Flashcards**. It changes how the questions the
filter panel picked are studied: as the cards they are now, in rounds that end when every question is mastered (like
Quizlet's Learn), or as flashcards you flip and rate, scheduled to come back (like Anki). Part of the redesign: built side
by side in the engine and **ships with the redesign's release**.

## Context

- The redesign plan: [the audit and plan](done/2026-11-05-redesign-audit-and-plan.md) (section 4.4, the question card and the
  core loop; section 4.10, the additions), [the release](2026-11-06-redesign-release.md) (the drafts for the rule and About
  page edits), [phase 2](2026-11-05-redesign-phase-2-live-hubs.md) (every hub that switches gets it from the engine).
- The engine, four files since 2026-11-12 (the top of `widget/hub.js` says how they fit): `widget/hub-bank.js` (`card()`
  and `wireCard()`, the bank's `drawQuestions()` and `filtered()`, the sets in `SETS`), `widget/hub-rewards.js`
  (`recordAnswer()`) and `widget/hub.js` (`SH_SYNC`); the server: [game-server](../reference/game-server.md) (`record_answer_v2`, its `ctx`
  list, the guardrails, self-graded pay) in `migration_v54.sql`, which is still pending, so it can still change.
- Rules that matter most here: [question-bank-filter-panel](../rules/question-bank-filter-panel.md) (the panel stays as
  written; the toggle is added to it at the release), [every-choice-gets-a-why](../rules/every-choice-gets-a-why.md),
  [two-statement-and-true-false](../rules/two-statement-and-true-false.md) and [numbered-statements](../rules/numbered-statements.md)
  (fixed choice order, kept here), [question-ids-are-permanent](../rules/question-ids-are-permanent.md) (all saved progress is
  keyed by id), [question-health-flags-are-leads](../rules/question-health-flags-are-leads.md),
  [learner-data-privacy](../rules/learner-data-privacy.md) (a new per-person log), [about-page](../rules/about-page.md),
  [preview-and-release-test](../rules/preview-and-release-test.md) (tier 3, with the redesign).

## What the data says (2026-11-06, read-only, totals only)

- **The class was asked this.** Survey round 2 (Oct 15 to Nov 5) asked "Which question format do you prefer?" (pick any).
  15 people answered: **10 picked a new format**: Quizlet Learn 7, Quizlet or Anki flashcards 7 between them (a few each).
  8 picked "The questions are good the way they are" (some picked both); 6 picked a new format and not that one. A small
  sample, but it leans toward Learn first, flashcards second.
- **The bank is where studying happens** (51% of all study time; notes 32%), and extras in More are opened and left
  (audit findings 1-2). So the toggle sits on the bank itself, not on a page of its own.
- **Re-asking soon overstates what sticks**: a miss re-asked within 30 minutes is 88-96% right, a day later 69-80% (finding
  8). "Try it again" covers the first; Learn's later rounds and the flashcards' next-day reviews add the second.
- **A hub lives about a week**, and almost all studying happens in the last 3-4 days (finding 10). Anki's schedule of days to
  months can't be copied: the flashcards' schedule is squeezed into the time left before the exam.
- **Most questions can be recalled without their choices**: about 7 in 10 of Occlusion's 773 (its plain one-answer
  questions whose stem doesn't lean on "which of the following", "except", "not" and the like). The rest show their
  choices on the front.

## The design

### The toggle

- At the top of the Questions view, above the filter panel: **Study as** with three segments, **Questions · Learn ·
  Flashcards**, each with a small drawn icon (two new icons for the set in `tools/figures/site/icons.mjs`). Full width on a
  phone. Saved as `STATE.ui.qview` (`questions`, `learn`, `cards`), so the bank opens the way it was left, like the panel.
- **The panel picks which questions; the toggle picks how.** Lectures, Show, the High likelihood toggle, More filters and
  search work the same in all three, and the `.qsum` line keeps its tags and Clear all ("Learning 42 of 773 questions",
  "42 cards: 12 due now"). **Order** (In order / Random) shows only for Questions: Learn and Flashcards set their own order.
- **Sets**: Daily drill, Yesterday's misses and Weak spots work in all three (the set is what you learn or flip). **The mock
  is always questions** (timed, no feedback): while it runs the toggle is hidden, and it comes back after the results card.
- Pin, Report and "Good question?" are on every Learn card and every flashcard, as on the bank's cards.
- First time each is opened: a one-line tip (the redesign's first-use tips), e.g. "Learn asks each question until you get it
  right twice. Your progress is saved." / "Flip the card, then say how well you knew it. It comes back when you're about to
  forget it."

### Learn (like Quizlet's Learn)

- **Rounds of 7** from the panel's set: first the questions still being learned, then new ones in the bank's order (by
  lecture). A miss comes back at the end of the same round, and again in the next one. No "Try it again" button: the
  re-ask is built in.
- **Two steps to Mastered**:
  1. **Pick it**: the card as it is in the bank (choices, the class's picks, the explanation, "Why each choice", "Find this
     in the notes" on a miss).
  2. **Recall it first** (a later round): the stem alone, with "Think of your answer, then show the choices"; then you pick
     from the choices as usual, so it's still graded by the key. Questions that need their choices (true/false,
     two-statement, numbered, select-all, EXCEPT, put-in-order, match, and stems that lean on their choices) skip the hidden
     step and need to be right in two different rounds instead.
  A miss at step 2 sends the question back to step 1.
- **Progress** at the top: a bar in three parts, **Not started · Learning · Mastered**, with counts.
- **End of a round**: a small card (right this round, mastered so far, what's left, **Next round** / **Take a break**), with
  the recap card's count-up motion. The session recap (on leaving with 5 or more answered) still covers the whole visit.
- **All mastered**: Timmy cheers, and two ways on: **Start over** (clears Learn's progress for these questions only) and
  **Flashcards for these** (switches the toggle, same set).
- Progress is kept **per question**, not per set: a question mastered while learning one lecture is mastered when you learn
  all of them.

### Flashcards (like Anki)

- **Front**: the stem, with its figure, Patient box and numbered statements. A stem that stands alone hides its choices
  (with **Show the choices** if you want them); one that leans on its choices shows them, plain and not tappable, in the
  card's usual order. Tap **Show the answer**, the card itself, or the space bar on a laptop.
- **Back** (the card turns over; a fade when motion is off): the answer at full ink (the right choice; every right one for
  select-all; the steps in order; the pairs; True or False; the two-statement or numbered key), the explanation, "Why each
  choice" folded, "Find this in the notes".
- **Rate it**: **Again · Hard · Good · Easy**, each showing when the card comes back ("1 min", "10 min", "Tomorrow", "In 2
  days"), keys 1-4 on a laptop, four big buttons along the bottom of the card on a phone.
- **The schedule** (Anki's, squeezed to fit the hub; new cards start at ease 2.5, never below 1.3):

  | The card is | Again | Hard | Good | Easy |
  |---|---|---|---|---|
  | New, or being learned | 1 min | 6 min | 10 min; at the second Good in a row, tomorrow | tomorrow |
  | In review (comes back every *n* days) | 10 min, ease −0.2 | *n* × 1.2, ease −0.15 | *n* × ease | *n* × ease × 1.3, ease +0.15 |

  - **Never past the exam**: a card whose next date would land after the day before the exam comes back on the day before
    instead (`SH_HUB.exam`; no cap when the date isn't announced). So every card you've rated comes back once on exam eve.
  - "Tomorrow" starts at 4 am Central, so a 1 am session still counts as the same night.
- **The deck** is the panel's set: due cards first (most overdue first), then new ones in the bank's order. Counts at the
  top: **Due now · Learning · New**, plain numbers.
- **When nothing is due**: "All caught up. The next card is back at 9:40 pm." with **Study new cards** and **Study ahead**
  (brings the soonest ones forward; those ratings move the schedule but earn no XP).
- **Home**: when you have cards due, "n flashcards due" is one of Where to next's rows (still at most three).

### What counts where

| | Questions | Learn | Flashcards |
|---|---|---|---|
| The class's picks, class stats, question health | yes | yes | no: a rating isn't a pick |
| Your answers (Last time, Missed last time, Weak spots, readiness, mastery medals) | yes | yes | no |
| XP | as now | as an answer, checked by the server | a flat 2 for a due or new card; a card's first 3 ratings a day; the speed limit |
| The daily goal ring, streak and Today | yes | yes | yes (Today shows cards beside answers) |
| The session recap | yes | yes | yes (cards rated, how many Again) |

- Learn's picks go through `recordAnswer()` and `record_answer_v2` with `ctx: "learn"`. The server's `ctx` list needs
  `learn` (today it would file them as `other`).
- A rating is not an answer: it never reaches `question_stats`, the class's picks, `personal_answers` or question health,
  because nothing checks it and the miskey and below-chance flags need real picks. It pays like the server's self-graded
  cards (a flat 2), but only for a card that was due or new, so tapping Easy over and over earns nothing after the first time.
  The usual speed limit applies (2 seconds since the last, 30 a minute). Medals and readiness stay about answers.

### Saved and synced

- On the device in the hub's state, keyed by question id: `STATE.learn[id]` (the step, the rounds it was right in) and
  `STATE.cards[id]` (when it's due, the interval, the ease, the learning step, lapses). An edited question keeps its id, so
  it keeps its progress.
- **Across devices** (Link my devices included): a small server log of ratings and Learn steps (`card_reviews`: visitor, hub,
  question id, what happened, when), replayed with the same scheduling code to rebuild the schedule on another device, the
  way answers already are. Functions: `record_card_v2` (records, pays, idempotent on a request id like `record_answer_v2`)
  and `get_my_cards`; your own rows only, never anyone else's.
- The server part is added to the pending game-layer server (a section in `migration_v54.sql` while it's unapplied, or
  `migration_v55.sql` listed in `supabase/pending-migrations.txt`), with checks in `tools/release/xp.js` (pay, a replayed call,
  a double tap, a linked device, Study ahead paying nothing) and `tools/release/rls.js` (no other visitor's rows), and a section
  in [game-server](../reference/game-server.md).

### Tracking, privacy and the About page

- `bank:view=questions|learn|cards` (the toggle), `learn:round-done`, `learn:all-mastered`, `learn:start-over`,
  `cards:caught-up`, `cards:ahead`, `cards:new` (`window.shTrack`); the ratings themselves are in `card_reviews`, not clicks.
- `card_reviews` is per-person: its row in [event-taxonomy](../reference/event-taxonomy.md), its line in
  [analytics-retention](../reference/analytics-retention.md) (kept like `personal_answers`), and "What the hubs record" on the
  About page ("how you rated each flashcard, so your schedule follows you to your other devices").
- About page, Questions: a new entry for **Study as** with Learn and Flashcards (what each does, the schedule ending on exam
  eve, what earns XP), tagged new.

## Sam's calls (2026-11-06, [decisions](../decisions.md))

Proposed as the defaults above and confirmed by Sam, all six ("1, 2, 3, 4, 5, 6 are all good with me"):

1. **Names**: "Learn" and "Flashcards" on the site, not "Quizlet Learn" or "Anki" (they're other companies' product names,
   and these work differently). The About page may say they're "like Quizlet's Learn or Anki".
2. **Flashcards count toward the daily goal ring and the streak**, but not as answers (no class stats, no "Last time", no
   medals).
3. **Flashcard XP**: a flat 2 for a due or new card, as self-graded cards get today; Learn's answers pay like any answer.
4. **The schedule ends on exam eve**: every rated card comes back the day before the exam, whatever its interval.
5. **Rounds of 7** in Learn, and Mastered after two rights (the second without the choices when the question allows it).
6. **The mock stays questions only.**

## Done when

- [x] Sam has confirmed or changed the calls above (all six confirmed, 2026-11-06)
- [x] The toggle, Learn and Flashcards built: the toggle in `widget/hub-bank.js` / `hub.css`, Learn and Flashcards in
      `widget/study-modes.js` + `widget/study-modes.css`, loaded the first time either is opened (no request added to
      any page's first load), in every hub on the engine (Occlusion, Heme & Endo Exam 2, Perio)
- [x] The two icons drawn in `tools/figures/site/icons.mjs` and built into `widget/hub-art.js` (Sam: "Yes, both")
- [x] The server part: `migration_v56.sql`, pending after v54 and v55 (Sam: "B"), with its `xp.js` and `rls.js` checks, and
      [game-server](../reference/game-server.md) updated
- [x] Every format checked in both views on a phone and a laptop: one-answer, select-all, true/false, two-statement,
      numbered, EXCEPT, which-is-true and which-is-false, put-in-order, match, Patient box, figure questions, self-graded
      recall (light and dark, motion on and off)
- [x] The drafts in [the release note](2026-11-06-redesign-release.md) (the panel rule, the About page) match what was built
- [x] Event taxonomy, analytics retention; the About page's "What the hubs record" is in the release note's drafts
- [x] CI and the release suites pass (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`, `node tools/release/run.js`)
- [x] Vault written back (`DEPLOY_NOTES.md`, this note's Outcome)
- [ ] At the release: `migration_v56.sql` applied after v54 and v55, `widget/study-modes.js` and `.css` in `sw.js`'s
      `PRECACHE`, the About page entries (the steps are in [the release note](2026-11-06-redesign-release.md), "From the
      Learn and Flashcards toggle")

## Log

- 2026-11-06: written from Sam's request in chat, with the survey's answers, the retry data and the engine and server as
  they are; the calls above are proposals until Sam confirms them.
- 2026-11-06: Sam confirmed all six calls; ready to build.
- 2026-11-12 (Claude Code, planning the rest of phase 4): not built yet. It touches `widget/hub-bank.js` and can run
  beside the phase 4 sessions ([phase 4](2026-11-05-redesign-phase-4-game-layer.md), "From here to the release"). Its
  "server part in the pending migration" is a change to `migration_v54.sql`, which Sam has said not to change without
  his word: ask him at the start of the session (or build it with no server part).

- 2026-11-12 (Claude Code): asked Sam first, as the session's prompt said, what the server part is and whether the toggle
  could ship without it, with three options (A: no server part, B: a new pending `migration_v56.sql`, C: a section in
  v54). Sam: "B, go ahead". Built and tested in [#344](https://github.com/smcmurry6-source/study-hubs/pull/344). Sam also asked mid-session (2026-11-12): "make sure learn has
  similar progress bar filling animations and such so it is very satisfying to use like quizlet": the overall bar now
  fills instead of jumping (a shine along it when a question is mastered, its numbers counting to their new value, the
  percent counting a question right once as halfway), the round's track fills a step per answer (red for a miss, a
  dashed step for its second try) and stays under the top bar while you answer, a right answer gets a word of praise
  and a streak chip from 3 in a row, Mastered pops with a small burst, the round's end fills the bar from where the
  round began (+n%) and lists the round's questions, and "You mastered all" ends in a burst. Motion off: the end states
  only.
  - How it's built: [game-server](../reference/game-server.md), "Learn and Flashcards"; `widget/study-modes.js`'s header.
    Learn's step and the flashcard schedule are kept per question on the device (`STATE.learn`, `STATE.cards`); each
    rating or step goes to `card_reviews` (queued in `STATE.cardq` while offline or before the migration) and
    `get_my_cards` replays them on another device. A flashcard is drawn as `.qc.fcard` with `data-fqid`, never a
    `.qcard`, so question health and the class's picks leave it alone; "Good question?" and "Find this in the notes"
    come through two small hooks (`shQH.rate`, `window.shNoteJump`) that nothing on a live hub calls.
  - Decided while building (no call needed from Sam, all inside the six calls above): Learn's answers go through
    `record_answer_v2` as context `other` (v54's list has no `learn`, and v54 isn't changed); the four ratings sit at the
    bottom of the screen while a turned-over card is longer than it, on a laptop only (on a phone the corner buttons
    would cover Again and Easy, so they stay at the card's end); the hidden-choices step uses a conservative test (a
    stem with "which", "the following", "not", "true", "statements" and the like keeps its choices); Study new cards gives
    20 at a time.
- 2026-11-12 (Claude Code): Sam: "Merge". `main` with #343 (vault only) was brought in first (one conflict in
  `vault/decisions.md`, both lines kept); merged as `7efb1ad` once "Check hubs" and "Release tests" passed on its last
  commit; `node tools/release/postcheck.js` passed (9 files live and identical to `main`, the dashboard and the three hubs
  with 0 errors). The note is `blocked` on the release, its last box. No preview was asked for.

- 2026-11-13 (Claude Code, the release's PR #359): Sam, after using the preview: "Make the learn mode function and look more
  like it does on quizlet. Make the flashcards function better too". Both now open from a **launcher** in the bank (how
  far along, Start; it comes before the "Which questions" panel) into a **session over the whole screen**
  (`openFocus()`: its own top row with Close, the progress and today's XP; Escape closes; a hash change closes it).
  Learn: the choices as numbered tiles (keys 1 to 9), "Don't know?" (the answer with no guess recorded, the question
  back like a miss), and Auto-next after a right answer (`STATE.ui.smAuto`, on unless switched off; touching the card
  stops it). Flashcards: a tall card, the ratings stuck to the bottom of the screen, swipe left for Again and right for
  Good on a phone, the arrow keys, choices never opened stay folded on the back, and "All caught up" shows the session
  by rating. The six calls above stand (rounds of 7, two rights, the schedule, what pays). Not built: a typed answer and
  an undo for a rating ([inbox](inbox.md)).

## Outcome

Built and merged ([#344](https://github.com/smcmurry6-source/study-hubs/pull/344), `7efb1ad`), not released: the Question Bank's **Study as: Questions · Learn · Flashcards** in the three new hubs, with the
server part as `migration_v56.sql` (pending, after v54 and v55, which are unchanged). Nothing students see changes until
the release; the release note says what goes in then.

Related: [the audit and plan](done/2026-11-05-redesign-audit-and-plan.md) · [the release](2026-11-06-redesign-release.md) ·
[phase 2](2026-11-05-redesign-phase-2-live-hubs.md) · [question-bank-filter-panel](../rules/question-bank-filter-panel.md) ·
[game-server](../reference/game-server.md)

## Opening prompt

> Work in smcmurry6-source/study-hubs. Read `AGENTS.md`, then "For every session above" in
> `vault/tasks/2026-11-05-redesign-phase-4-game-layer.md`, then do the task in
> `vault/tasks/2026-11-06-redesign-learn-and-flashcards.md`. Its note asks for a server part in the pending
> migration: before any code, tell me in one message what that part is and whether the toggle can ship without it,
> and wait for my answer. `migration_v54.sql` is not applied and is not changed without my word. Grep the big files,
> never read them whole. No subagents. No hosted preview. Open a draft PR with the test report.
