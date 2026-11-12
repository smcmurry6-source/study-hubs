---
type: task
status: blocked
hub: dashboard
created: 2026-11-06
requested-by: Sam
due: 
waiting-on: "#318 merging (then the board's look is redone)"
agent: Claude Code
pr: https://github.com/smcmurry6-source/study-hubs/pull/324
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
Later the same day: ideas from the exam check-ins go on the board too, under the writer's name. New check-ins post with a
tick that starts ticked; the check-ins already sent become starter ideas with no names (below). And every idea says which
hub it's for (one hub, or all hubs) and its category, picked while writing it.

## What the data says (2026-11-06)

- 14 suggestions from 6 people since 2026-09-09 (11 of them in the last 30 days): few people write ideas down.
- Timmy Time's likes and comments (live since 2026-11-04, so early) have almost no use yet.
- So voting, one tap, is the part most people will use, and the board starts with ideas already on it.
- Exam check-ins: 97 so far, 30 with a written answer to "Anything the hub could do better?" from 17 people; 19 of the 30
  mention the exam, and only a few of the 17 have a leaderboard name.

## The design

- **Posting**: anyone can post an idea (a title and up to 280 characters) under their leaderboard name; someone with no name
  is asked for one first, as Timmy Time's comments do. Three ideas a day per person, one every 20 seconds. The private Suggest
  box stays for things meant only for Sam, with a tick: "Also post it on the idea board."
- **Which hub and what kind** (Sam, 2026-11-06), both picked while writing the idea, both required:
  - **For**: "All hubs" or one live hub (from `HUBS`, archived hubs left out). Posting from a hub's More starts on that hub;
    from the dashboard, on "All hubs". An archived hub's ideas keep its name.
  - **Category**, one of: **New feature** (something the hubs don't do yet), **Make something work better** (how something
    that's there works), **Questions and notes** (more questions, notes, figures, cases), **Games and fun** (the arcade,
    Timmy, trophies, ranks, Easter eggs), **Look and feel** (design, layout, colors), **Something else**. Chips with a
    one-line hint each; Sam may rename them.
  - On the board: each card shows its hub and category as tags, and the board filters by hub and by category on top of the
    Top / New / Shipped tabs (the filters say how many ideas each would show). In a hub's More, the board opens on that hub's
    ideas and the all-hub ones.
- **From an exam check-in** (Sam, 2026-11-06): under "Anything the hub could do better?", a tick, already ticked: "Also post
  this on the idea board as <name>". Ticked, the answer shows as a preview of the post (a title prefilled from its first
  words and the text cut to 280 characters, both editable, its hub set to the check-in's and its category starting on
  Questions and notes, changeable) with the reminder above the box: no exam questions or answers. On
  send, the check-in goes to Sam as now and the post goes up, tagged "From a check-in". Unticked, it stays private. Someone
  with no leaderboard name is asked for one first (or can untick). It counts as one of the day's three ideas; the scale and
  choice answers are never posted.
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
  `ideas` (with `hub`, null for all hubs, and `category` from the fixed list, both checked by the server), `idea_votes`,
  `post_idea`, `vote_idea`, `report_idea`, `delete_my_idea`, `get_ideas`, `admin_set_idea` (hide,
  restore, status, reply), tested on a throwaway copy like `rls.js` and `admin-ops.js`.
- **Tracking and privacy**: `ideas:post` (with where it came from: `=board`, `=suggest`, `=checkin`), `ideas:vote`,
  `ideas:report`, `ideas:tab=`, `ideas:filter=hub` and `ideas:filter=cat` (with the hub or category id), `ideas:checkin-private` (the tick turned off) (`window.shTrack`); `post_idea` records the
  same source; rows in
  [event-taxonomy](../reference/event-taxonomy.md) and [analytics-retention](../reference/analytics-retention.md); the About
  page's entry and its "What the hubs record" line (an idea you post shows to the class under your leaderboard name, and so
  does a check-in's "Anything the hub could do better?" unless you untick it).

## The starting ideas

Written by the agent, posted by Timmy and his neighbors (tagged "Starter idea", their names as in `tools/podcast/LORE.md`).
None is in the redesign plan or on the About page (checked 2026-11-06; check again before posting).

**More from the check-ins already sent** (Sam, 2026-11-06): at the release, the agent reads every check-in's "Anything the
hub could do better?" (read-only SQL) and turns the ideas in them into more starter ideas, posted by Timmy and his neighbors
with no names, in new words, each with its hub and category. Leave out anything about an exam (what it asked, its questions or answers, its wording), anything
that points to who wrote it ([learner-data-privacy](../rules/learner-data-privacy.md)), and anything already built, on the
About page or in the redesign plan. Their writers didn't write them to be public, so nothing is quoted.

Each gets a hub and a category when it's posted (most are for all hubs; the arcade and Timmy ones are Games and fun).

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

- [x] The tables, functions and admin controls built and tested on a throwaway copy; `widget/ideas.js` on the new dashboard and
      in More; the Inbox's "Idea board" with hide, restore, status and reply
- [x] The hub and category pickers, their tags on each card and the board's filters, in both places
- [x] The check-in's tick, preview and name prompt on the new dashboard's check-in
- [ ] The starting ideas posted at the release, with the ones from the past check-ins, checked against the About page first
- [ ] Previewed on fixture data as the test accounts, on a phone and a laptop (done by the agent, 2026-11-12, on the local
      preview); Sam's look (screenshots sent; a hosted preview only if Sam asks)
- [ ] The About page (drafted below, lands at the release), the event taxonomy (done) and the retention rows (the row is
      there; the 90-day delete of hidden ideas is approved and not built)
- [x] CI and the release suites pass (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`, `node tools/release/run.js`)
- [ ] Vault written back (`DEPLOY_NOTES.md` and this note: done; the site changelog and the Outcome's last word at the release)

## The About page's entries (a draft; they land at the release)

The live About page describes the live site, so these go in with the redesign's switch ([the release](2026-11-06-redesign-release.md)).

- **On the dashboard and in every hub: "Idea board"** (new). Post an idea for the hubs and vote on your classmates'. An
  idea has a title and up to 280 characters, the hub it's for (or all hubs) and what kind it is: a new feature, making
  something work better, questions and notes, games and fun, look and feel, or something else. It shows to the class right
  away under your leaderboard name, with its up and down votes. One vote per idea, tap again to take it back. Top, New and
  Shipped tabs, and filters by hub and by kind. Three ideas a day. Report hides an idea after three reports until Sam
  looks; you can delete your own, and its votes go with it. Sam marks ideas Under consideration, Planned, Shipped or Not
  doing with a line on why, and you get that in your Inbox if it's yours or you voted it up. Votes show what the class
  wants; they don't decide what gets built. No quiz or exam questions or answers, and nothing about a classmate. On the
  dashboard it's its own section; in a hub it's under More.
- **Exam check-in**, added to its entry: under "Anything the hub could do better?" a box, ticked to start, also posts
  your answer on the idea board under your name. You see the post first (its title, text and kind, all yours to change);
  untick it and the answer goes only to Sam, as before. The other answers are never posted.
- **Suggest something**, added to its entry: still private, to Sam. Tick "Also post this on the idea board" to put it on
  the board too.
- **What the hubs record**, added: an idea you post shows to the class under your leaderboard name, and so does a
  check-in's "Anything the hub could do better?" unless you untick the box. Your votes and reports on ideas are kept so
  each person counts once; nobody else sees who voted or reported.

## Log

- 2026-11-06: workshop of Sam's idea.
- 2026-11-06: Sam's calls (above): no approval, both votes and names shown, not seeded with the redesign's ideas, ships with the
  redesign. Starting ideas written.
- 2026-11-06: Sam: ideas from the check-ins go on the board too, under the writer's name (the tick, on by default); the past
  check-ins become starter ideas with no names.
- 2026-11-06: Sam: every idea picks its hub (one hub or all hubs) and a category; the six categories written from Sam's
  examples (gamification, fun, functionality, feature).
- 2026-11-06 (Claude Code): the server side is written and tested on a throwaway copy (`migration_v54.sql`, phase 5 part 3;
  [game-server](../reference/game-server.md)): `ideas`, `idea_votes`, `idea_reports`, `idea_notes`, `post_idea` (with
  `source` for the board, Suggest and a check-in), `vote_idea`, `report_idea`, `delete_my_idea`, `get_ideas` (tabs, both
  filters and their counts, no visitor ids), `admin_ideas`, `admin_set_idea`, `admin_post_starter_idea`, the Inbox notes
  (`get_my_inbox_v2`). Still to build: `widget/ideas.js`, the admin page's "Idea board", the check-in's tick. Calls made
  while building, for Sam: an idea's hub must be one whose keys are loaded (the release loads them for the live hubs), and
  an author's delete keeps an empty row so it still counts toward the day's three.
- 2026-11-11 (Claude Code): Sam's answers ([decisions](../decisions.md)): an idea names a hub with keys or "All hubs" (yes);
  an author's delete **removes the idea completely**, so `delete_my_idea` now deletes the row and, with it, its votes,
  reports and Inbox notes (it no longer counts toward the day's three or the 20 seconds); hidden ideas are kept 90 days
  ([analytics-retention](../reference/analytics-retention.md), not built yet). `xp.js` checks it.

- 2026-11-12 (Claude Code, **the board, the admin card and the tick built; hand-off**). On the branch of [#324](https://github.com/smcmurry6-source/study-hubs/pull/324) (a draft),
  stacked on [#318](https://github.com/smcmurry6-source/study-hubs/pull/318) (the new dashboard), which wasn't merged yet:
  the branch starts from `claude/phase-3-dashboard-redesign-n7r4m9` with `origin/main` merged in. Nothing students see
  changes; migration_v54 is **not applied** and the starting ideas are **not posted** (both at the release).
  - **`widget/ideas.js` + `widget/ideas.css`** (`window.shIdeas`), one file for both places. On the new dashboard
    (`widget/dash.js` loads it late and mounts it in `#ideas`, which stays hidden until `get_ideas` answers) and in a new
    hub's More (`widget/hub.js`: a row under "Talk to us", first, opening `#more/ideas`). Cards with both vote counts,
    the hub and kind as tags, "Starter idea" / "From a check-in", the status and Sam's line; Top / New / Shipped; a hub
    filter and a kind filter that say how many each shows; Post an idea (name if none, title, details, For, the six kinds
    with a hint each, the rules line); Report; Delete on your own. Six cards then "Show more" on the dashboard, eight in More.
  - **The check-in's tick** (`openDebrief` in `widget/dash.js`; the live `index.html`'s check-in is untouched): under
    "Anything the hub could do better?", ticked to start, "Also post this on the idea board as <name>". With something
    written it shows the post: a title from the first sentence, the rest as details (cut to 280), both editable, "For
    <the check-in's hub>" and the kind, starting on Questions and notes. The honor-code reminder moved above the box. On
    Send the check-in goes first; the post follows, tagged From a check-in, and the thanks says whether it went up.
    Unticked: private, counted as `ideas:checkin-private`.
  - **The Suggest box's tick** (`widget/v3.js`, live file, a small change): "Also post this on the idea board", unticked
    to start, with the same preview. It only appears where `ideas.js` is loaded, which the new hubs do when Suggest opens,
    and only once the board answers; on a live hub the Suggest box is unchanged.
  - **Inbox notes** (`widget/replies.js`, live file, a small change): a row of kind `idea` reads "An idea you posted or
    voted for is planned", with the idea's title and Sam's line, once as a pop-up and then in the Inbox. No such row
    exists until migration_v54. The new dashboard gets them (its bootstrap is the `_v2` one); **the hubs get them when
    `v3.js` moves to `get_widget_bootstrap_v2`** ([phase 5](2026-11-05-redesign-phase-5-backend.md), part 2).
  - **The admin page**: Inbox → "Idea board", under the podcast comments: every idea of the last 90 days with its votes
    and reports, Hide / Restore, a status with one line on why ("Saved. N people told in their Inbox."), and an "All /
    Reported or hidden" switch. Before migration_v54 the card says the board opens with the redesign.
  - **The preview** (`tools/preview/runtime/preview.js`): a made-up board (ten ideas, none of the starting ones) that
    follows the real functions' rules; what a test account posts, votes, reports or deletes is kept in its own preview
    data. Also taken out, as Sam asked: the "classmate with visiting off" in the `get_place` stub and in `dash.js`'s
    comment above `loadFits` (migration_v54 has no visiting opt-out).
  - **No new art**: thumbs up, thumbs down and the rest are the icon set's. A tile for the board in More, or a drawing
    for the section, would be new art: contact sheet first.
  - **Calls I made** (say if any is wrong):
    1. In a hub, "For" offers that hub or All hubs (a hub page doesn't know which other hubs are live); the dashboard
       offers every live hub. In More the hub filter is "This hub and all hubs" or "Every hub's ideas".
    2. The filters are two drop-downs, not chips: with six kinds and every hub they didn't fit a phone.
    3. Someone who hasn't picked a name **in this browser** gets a "Your name" box that starts on the name the boards
       show for them now (their random one, or one picked on another device), to keep or change; posting saves it.
    4. The Suggest tick asks for the kind (it has no starting kind); the check-in's starts on Questions and notes.
    5. Starter ideas have no Report button. After you post, the board switches to New so you see it.
    6. The board isn't on the admin Overview's "Waiting on you" yet: it would ask the database for a function that isn't
       there on every load until the release. Add "Ideas reported" there at the switch.
  - **Found on the way**: BUG-072 (phase 3's stage: the day before an exam, at the largest text on a phone, the luck row
    pushed Start studying past the screen's edge; `tools/ci/smoke.js` failed on it today, the day before Heme & Endo 2)
    and BUG-073 (the form's name box), both fixed ([bug log](../release/bug-log.md)).
  - **Checked**: `node tools/release/run.js`, all 14 suites passing (results in the PR; `a11y.js` needs `axe-core`,
    which a cloud session installs outside the repo and names in `AXE_CORE_PATH`), and axe on the board's own screens,
    which `a11y.js` doesn't open (the post form with an error showing, the check-in's tick, a hub's More page, the admin
    card; laptop, phone and dark), clean; `tools/ci/smoke.js` now draws a made-up board on the new
    dashboard and in each new hub's More and fails if a card, a status, a vote, the hub and kind pickers or the tags are
    missing, if an idea's words are drawn as markup, or if any button in the board has no fixed `data-shi` name; a
    scripted walk on the local preview, 110 checks, laptop and iPhone 13, as the returning, new and admin accounts (post,
    the limits, votes, report to three, delete, filters, the check-in ticked and unticked, the name box, Suggest's tick,
    the admin card, the Inbox note), all passing. **Not checked**: against a database with migration_v54 applied (the
    preview answers for it, and `xp.js` tests the SQL by itself): the first real run is a staging database or the release.
  - **Left**, in order: Sam's look; at the release, apply migration_v54, load the hubs' keys, **post the starting ideas**
    (the table above plus the ones from the past check-ins, checked against the About page), put the About entries in
    (drafted above), add `widget/ideas.js` and `widget/ideas.css` to `sw.js`, and the Overview line. Not built: the 90-day
    delete of hidden ideas ([analytics-retention](../reference/analytics-retention.md)), a job for the retention migration.
- **2026-11-12, later (Claude Code, same session)**:
  - **`main` merged in again** (the 2026-11-11 lessons refresh, #322): the change log conflicted; both entries kept.
  - **BUG-074**, found by the PR's Release tests in WebKit and fixed ([bug log](../release/bug-log.md)): the recap's
    `ResizeObserver` in `widget/dash.js` measured the card inside its callback, and with the board's stylesheet still
    loading that raised WebKit's "ResizeObserver loop" error. It takes the width from its entry now. **A cloud session
    can run WebKit**: `PLAYWRIGHT_BROWSERS_PATH=<a scratch folder> node <the global playwright>/cli.js install webkit`,
    the system libraries it lists with `apt-get`, then `SH_ENGINES=webkit PLAYWRIGHT_BROWSERS_PATH=<that folder> node
    tools/release/matrix.js`. The error only shows on a busy machine, so run several loads at once to see it.
  - **Sam, after the screenshots: redo the board's look** ([decisions](../decisions.md)): "make the board UI way more
    interesting and decorative to match the vibe of the rest of the dashboard", then "these decorative changes are on PR
    318. wait for it to merge before redesigning so you can see the rest of the dashboard as it stands now". **Not started,
    on Sam's word**: this session is subscribed to #318 and takes it up when it merges.
  - **Next step, for whoever takes it up** (this session, or a new one from this note): once #318 is merged, start
    `claude/wonderful-fermi-2ypk03` again from `main` if #324 has merged too, or merge `main` into it if not; open the
    new dashboard in a local preview (`node tools/preview/serve.js`, `next/?persona=returning`) and look at the stage,
    the classroom, the leaderboard's stage and the recap, which are what the board has to sit beside; then restyle
    `widget/ideas.css` (and the markup in `widget/ideas.js` where it needs hooks) with the dashboard's own parts: its
    tints, panels and drawn kits (`widget/hub-art/`). Anything newly drawn goes to Sam as a contact sheet before it goes
    in. Keep every `data-shi` name, the smoke test's checks and the 110-check walk passing, and send Sam new screenshots.

## Outcome

Built, not released ([#324](https://github.com/smcmurry6-source/study-hubs/pull/324)). Sam asked for a more decorative look, to be done after #318 merges (the Log's last entry). The board is on the new dashboard and in the new hubs' More from one file, with the
check-in's and Suggest's ticks, the Inbox notes and the admin page's Idea board. It ships with the redesign: migration_v54,
the starting ideas and the About entries go in at the release.

Related: [phase 3](2026-11-05-redesign-phase-3-dashboard.md) · [reply-to-reports](../how-to/reply-to-reports.md) ·
[podcast-reactions](../rules/podcast-reactions.md) · [learner-data-privacy](../rules/learner-data-privacy.md)
