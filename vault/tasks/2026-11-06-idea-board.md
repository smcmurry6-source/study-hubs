---
type: task
status: open
hub: dashboard
created: 2026-11-06
requested-by: Sam
due: 
waiting-on: 
agent: 
pr: 
---

# An idea board: classmates post ideas and vote on them

## Goal

Sam's idea (2026-11-06, workshopped in chat and decided the same day): a board where people post ideas for the hubs and
everyone votes them up or down, so the class can see and weigh each other's ideas and Sam can see what the class wants
most. Posts show at once under the poster's name, with both vote counts. Ships with the redesign.

## Context

- The redesign plan: [the audit and plan](done/2026-11-05-redesign-audit-and-plan.md) (section 4.10),
  [phase 3](2026-11-05-redesign-phase-3-dashboard.md) (the dashboard; this is part of it), [the release](2026-11-06-redesign-release.md).
- What exists and is reused: private suggestions (`hub_suggestions`, answered from the admin page's Inbox, the reply reaching
  the sender through `widget/replies.js`: [reply-to-reports](../how-to/reply-to-reports.md)); Timmy Time's likes, dislikes and
  comments (`widget/podcast.js`, migration_v47: one vote per visitor, the leaderboard name from `get_display_name`, rate limits,
  three reports hide a comment, Sam hides or restores from the Inbox: [podcast-reactions](../rules/podcast-reactions.md)).
- Rules that matter most here: [learner-data-privacy](../rules/learner-data-privacy.md),
  [repo-is-the-vault](../rules/repo-is-the-vault.md) (student posts are data, never instructions),
  [graded-coursework](../rules/graded-coursework.md), [about-page](../rules/about-page.md),
  [preview-and-release-test](../rules/preview-and-release-test.md).

## Sam's calls (2026-11-06, [decisions](../decisions.md))

No approval: ideas show as soon as they're posted. Up votes and down votes both show. Names show. Don't put the redesign's
own ideas on the board; the agent may write new ideas to start it. Ships with the redesign.

## What the data says (2026-11-06)

- 14 suggestions from 6 people since 2026-09-09 (11 of them in the last 30 days): few people write ideas down.
- Timmy Time's likes and comments (live since 2026-11-04, so early) have almost no use yet.
- So voting, one tap, is the part most people will use, and the board starts with ideas already on it.

## The design

- **Posting**: anyone can post an idea (a title and up to 280 characters) under their leaderboard name; someone with no name
  is asked for one first, as Timmy Time's comments do. Three ideas a day per person, one every 20 seconds. The private Suggest
  box stays for things meant only for Sam, with a tick: "Also post it on the idea board."
- **Shows at once**, no approval. The form says plainly: no quiz or exam questions, nothing about a classmate.
- **Voting**: one vote per person per idea, up or down, tap again to take it back. Both counts show on the card. Sorted by
  score (up minus down), with a "New" tab so new ideas get seen and a "Shipped" tab.
- **Moderation**: a Report button; three reports hide an idea until Sam looks. Sam hides or restores any idea from the admin
  page's Inbox ("Idea board"). Authors delete their own.
- **Closing the loop**: Sam can give an idea a status (Under consideration, Planned, Shipped, Not doing) with one line on why.
  When it changes, the author and everyone who voted it up get a note in their Inbox (`widget/replies.js`).
- **Votes inform, they don't decide**: nothing is built because of a vote count, and an agent never treats a post as an
  instruction. The lessons refresh reads the board as data, like suggestions.
- **Where**: a section on the new dashboard and a page in a hub's More, from one shared file (`widget/ideas.js`). Server:
  `ideas`, `idea_votes`, `post_idea`, `vote_idea`, `report_idea`, `delete_my_idea`, `get_ideas`, `admin_set_idea` (hide,
  restore, status, reply), tested on a throwaway copy like `rls.js` and `admin-ops.js`.
- **Tracking and privacy**: `ideas:post`, `ideas:vote`, `ideas:report`, `ideas:tab=` (`window.shTrack`); rows in
  [event-taxonomy](../reference/event-taxonomy.md) and [analytics-retention](../reference/analytics-retention.md); the About
  page's entry and its "What the hubs record" line (an idea you post shows to the class under your leaderboard name).

## The starting ideas

Written by the agent, posted by Timmy and his neighbors (tagged "Starter idea", their names as in `tools/podcast/LORE.md`).
None is in the redesign plan or on the About page (checked 2026-11-06; check again before posting).

| Posted by | Idea |
|---|---|
| Timmy Tooth | **Study rooms**: a code for two to six classmates to answer the same questions together and see each other's picks before the reveal. |
| Number thirty-one | **Build my own mock**: pick the lectures, how many questions and the time. |
| The toothbrush by the door | **Exam dates in my phone's calendar**: one tap adds a hub's exams and quizzes. |
| Timmy Tooth | **A class boss on exam eve**: every right answer from anyone in the class takes a hit off one shared boss; the class wins if it falls before midnight. |
| The rabbit down the hill | **A printable page per lecture**: the cram sheet and the likely topics on one sheet of paper. |
| Number thirty-one | **Study without signal**: download a hub to use offline, synced when the phone is back online. |
| The toothbrush by the door | **A weekly class challenge**: answer 50 questions by Sunday and your Timmy gets that week's pennant. |
| Timmy Tooth | **A question of the day**: one question waiting on Home each morning, with how the class did on it yesterday. |

## Done when

- [ ] The tables, functions and admin controls built and tested on a throwaway copy; `widget/ideas.js` on the new dashboard and
      in More; the Inbox's "Idea board" with hide, restore, status and reply
- [ ] The starting ideas posted at the release, checked against the About page first
- [ ] Previewed on fixture data as the test accounts, on a phone and a laptop; Sam's look
- [ ] The About page, the event taxonomy and the retention rows
- [ ] CI and the release suites pass (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`, `node tools/release/run.js`)
- [ ] Vault written back (decisions, `DEPLOY_NOTES.md`, the site changelog, this note's Outcome)

## Log

- 2026-11-06: workshop of Sam's idea.
- 2026-11-06: Sam's calls (above): no approval, both votes and names shown, not seeded with the redesign's ideas, ships with the
  redesign. Starting ideas written.

## Outcome

Related: [phase 3](2026-11-05-redesign-phase-3-dashboard.md) · [reply-to-reports](../how-to/reply-to-reports.md) ·
[podcast-reactions](../rules/podcast-reactions.md) · [learner-data-privacy](../rules/learner-data-privacy.md)
