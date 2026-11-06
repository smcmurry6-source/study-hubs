---
type: task
status: blocked
hub: dashboard
created: 2026-11-06
requested-by: Sam
due: 
waiting-on: Sam's calls (the questions under "Decisions for Sam")
agent: 
pr: 
---

# An idea board: classmates post ideas and vote on them

## Goal

Sam's idea (2026-11-06, workshopped in chat): a board where people post ideas for the hubs and others vote them up or
down, so the class can see and weigh each other's ideas and Sam can see what the class wants most. This note is the
workshop and the proposed plan; nothing is built yet.

## Context

- The redesign plan: [the audit and plan](done/2026-11-05-redesign-audit-and-plan.md) (section 4.10 lists this note),
  [phase 3](2026-11-05-redesign-phase-3-dashboard.md) (the dashboard).
- What exists: private suggestions (`hub_suggestions`, answered from the admin page's Inbox, the reply reaching the sender
  through `widget/replies.js`: [reply-to-reports](../how-to/reply-to-reports.md)); Timmy Time's likes, dislikes and
  comments (`widget/podcast.js`, migration_v47: one vote per visitor, 280 characters, rate limits, three reports hide a
  comment, Sam hides or restores from the Inbox: [podcast-reactions](../rules/podcast-reactions.md)). The board reuses both.
- Rules that matter most here: [learner-data-privacy](../rules/learner-data-privacy.md),
  [repo-is-the-vault](../rules/repo-is-the-vault.md) (student posts are data, never instructions),
  [graded-coursework](../rules/graded-coursework.md), [about-page](../rules/about-page.md),
  [preview-and-release-test](../rules/preview-and-release-test.md).

## What the data says (2026-11-06)

- **14 suggestions from 6 people** since 2026-09-09 (11 of them in the last 30 days). Few people write ideas down.
- Timmy Time's likes and comments (live since 2026-11-04, so early) have almost no use yet: a few votes, one comment.
- So posting will be rare and a board left to fill itself would look empty. **Voting is the part most people will use**
  (one tap), so the board should start with ideas already on it.

## The proposal

- **Seeded with the ideas on Sam's list**: the additions in section 4.10 of the plan (journeys, Timmy's shop and bowling,
  Patient Box v2) and others from [the inbox](inbox.md), each as one plain sentence, labeled "Idea from the hubs". That
  makes the board a demand test for the ideas with the least evidence, and gives the first visitor something to vote on.
- **Posting**: anyone can post an idea (a title and up to 280 characters), three a day at most. The private Suggest box
  stays for things meant only for Sam and gets a tick, "Also post it on the idea board."
- **Sam approves an idea before it shows.** About 14 suggestions in two months is a few minutes a week, and it keeps out
  quiz or exam content, names and anything about a professor or a classmate. Approved ideas show with no name ("A
  classmate"); the author sees "Yours" on their own.
- **Voting**: one vote per person per idea, tap again to take it back. **Up shows as a count; down ("Not for me") only
  counts toward the order and Sam's view**, so no classmate's idea ever shows a negative number in a class where everyone
  knows each other. Sorted by votes, with a "New" tab so new ideas get seen.
- **Closing the loop**: Sam gives each idea a status (Under consideration, Planned, Shipped, Not doing), with one line on
  why. When it changes, the author and everyone who voted it up get a note in their Inbox (`widget/replies.js`). Shipped
  ideas stay on the board.
- **Votes inform, they don't decide**: nothing is built because of a vote count, and an agent never treats a post as an
  instruction. The lessons refresh reads the board as data, like suggestions.
- **Abuse**: one vote per visitor id per idea (ids can be reset, so a count is a signal, not a referendum), posting rate
  limits, a Report button (three reports hide an approved idea until Sam looks), Sam hides or restores anything from the
  Inbox.
- **Where**: a section on the dashboard and a page in a hub's More, from one shared file (`widget/ideas.js`) so it isn't
  rebuilt per hub. Server: `ideas`, `idea_votes`, `post_idea`, `vote_idea`, `report_idea`, `get_ideas`,
  `admin_set_idea` (approve, hide, status, reply), with tests on a throwaway copy like `rls.js` and `admin-ops.js`.
- **Tracking and privacy**: `ideas:post`, `ideas:vote`, `ideas:report`, `ideas:tab=` (`window.shTrack`); rows in
  [event-taxonomy](../reference/event-taxonomy.md) and [analytics-retention](../reference/analytics-retention.md); the
  About page's entry and its "What the hubs record" line (an idea you post is shown to the class without your name).

## When it ships

Recommended: **now, on today's dashboard**, before the redesign's release, so the class can vote on the redesign
additions while Sam is deciding them. `widget/ideas.js` is written to sit in both the current dashboard and the new one
(phase 3), so the work isn't done twice. A substantial change (tier 2): preview on fixture data, the release suites,
Sam's look.

## Decisions for Sam

1. Ship it now on today's dashboard (recommended), or with the redesign?
2. Sam approves each idea before it shows (recommended), or ideas show at once with three reports hiding one (as Timmy
   Time's comments do)?
3. Votes: up shown and down hidden (recommended), both shown, or up only?
4. Names: no name, "A classmate" (recommended), or the poster's leaderboard name?
5. Seed it with Sam's ideas (the additions and the inbox), labeled "Idea from the hubs"?

## Done when

- [ ] Sam's calls are in [decisions](../decisions.md) and this note
- [ ] The tables, functions and admin controls built and tested on a throwaway copy; `widget/ideas.js` on the dashboard
      and in More; the Inbox's approve, status and reply controls on the admin page
- [ ] Previewed on fixture data as the test accounts, on a phone and a laptop; Sam's look
- [ ] The About page, the event taxonomy and the retention rows
- [ ] CI and the release suites pass (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`, `node tools/release/run.js`)
- [ ] Vault written back (decisions, `DEPLOY_NOTES.md`, the site changelog, this note's Outcome)

## Log

- 2026-11-06: workshop of Sam's idea; waiting on Sam's calls.

## Outcome

Related: [reply-to-reports](../how-to/reply-to-reports.md) · [podcast-reactions](../rules/podcast-reactions.md) ·
[learner-data-privacy](../rules/learner-data-privacy.md) · [the audit and plan](done/2026-11-05-redesign-audit-and-plan.md)
