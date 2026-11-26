---
type: inbox
tags: [tasks]
---

# Inbox

Quick ideas and requests, one line each. An agent asked to go through the inbox turns each line into a task note in
this folder (deleting the line: the note carries it) or just does it, if it's small and clear, and ticks it with its PR
(`- [x] ... (#123)`); ticked lines are cleared the next time someone goes through the inbox. Anything left to do from a chat
lands here or in a task note ([to-dos-go-in-the-vault](../rules/to-dos-go-in-the-vault.md)). See [README](README.md).

- [ ] **Timmy's place, after the quicker Customize** (2026-11-25): the design system page's customizer mock
  (`tools/preview/design/design.js`) still shows the old dock and drawer; a home, scene or yard pick still draws the whole
  stage once after the tap's frame (the kit could swap the one piece, as an outfit swaps only Timmy:
  [motion-cost](../reference/motion-cost.md)); the launch trailer's place shot (`tools/trailer/shots.mjs`) taps the new tabs
  but hasn't been recorded again to check it.
- [ ] **Review of Systems' narration, when Sam asks** (2026-11-26, Sam: "we can handle the review of systems recordings later"):
  the hub has no recordings (`"audio": "off"`), and none can go in this repo ([no-narration-in-the-repo](../rules/no-narration-in-the-repo.md)).
  When Sam asks: Sam creates an empty public repo for the audio with Pages on `main` (for example `study-hubs-audio`, served
  from the same address), then one session builds what [the sustainability task](2026-11-22-sustainable-for-years.md)'s
  "When narration comes back" box says (narrate.py writing there, the engine fetching from it, wiping its history at each
  archiving) and records the levels Sam picks (the recommendation: Plain English and High yield, which High yield's build
  keeps in step with the notes). Not before Sam says so ([decisions](../decisions.md)).
- [ ] **Review of Systems: Sam's calls from the full read of the bank** (2026-11-24, every question vetted). **Changed from
  current references, say if the course's own wording should come back:** choking is back blows and abdominal thrusts (AHA
  2025; the lecture: abdominal thrusts); the do-not-use list is µg and q.o.d. (the notes had mcg and q.a.d.); `om-caries-15`
  now tests that the caries and periodontal floras antagonize each other (it taught that the two diseases are inversely
  related, which current reviews don't find); renal cell carcinoma's cystic risk is the acquired cystic disease of dialysis
  (the notes had adult polycystic disease); the antibiotics the notes gave for acute bronchitis are for a bacterial flare of
  chronic bronchitis. **Left as taught, right enough to stand:** teriparatide's 2-year limit (`mg-bone-03`; off the FDA label
  since 2020); an umbilical polyp as a urachal remnant (`mg-gianat-30`; texts say urachal sinus); the alanine cycle's 6-8 ATP
  (`f1-carbmet-22`; 5-7 by the 2.5/1.5 count the hub uses elsewhere); H2-blocker tolerance in 2-6 weeks (`mg-gipath-04`;
  references say days); HPV in "more than 30%" of oropharyngeal cancers (`f2-virology-14`; about 70% in the United States);
  "partial agonists" for butorphanol, nalbuphine and pentazocine (`f2-painrx-19`; boards say mixed agonist-antagonists);
  HbA1c control on two scales (Heme & Endo: above 7% poor; Emergencies' lecture: 7 good, 8.5-10 fair, over 10 poor).
  **Could be better, not wrong:** `em-cardiac-17`'s INR choices (2.4 against 4.6, 5.2, 6.0) never test the 3.5 line;
  `ns-sens-14`'s distractors are easy; `da-tmj-16` nearly repeats `da-anomalies-11`; three Dental Anatomy explanations
  mention a class guide that disagrees.
- [x] **The dashboard's progress ring reads only this device's copy of the hub** (2026-11-24, found fixing BUG-107; done
  in #564: the bootstrap brought no answers to the dashboard, which asked for no hub, so it now asks for the open tab's hub
  when this device has none of it, and draws the ring from those answers):
  `readProgress()` in `widget/dash.js` reads the hub's saved state on the device, so on a new or linked device (and in the
  preview before a hub is opened) the open hub's card says "Your progress in this hub shows here" and 0 tried, though the
  bootstrap already brings the account's answers. Draw the ring from those answers when the device has none? Live, minor.
- [ ] **Scroll the dashboard and the shop on a real phone** (2026-11-22, the no-pausing change): an iPhone in Safari and an
  Android phone in Chrome, a long scroll of the dashboard top to bottom and of the shop's shelves, then Timmy's place at
  night. The cloud browser draws without a graphics card, so the compositor's part (the stage's sparkles and confetti, the
  place card's layer) couldn't be measured there ([motion-cost](../reference/motion-cost.md)), and a Diamond or Dark Matter
  medal moving in the place's panel (its sparkles, stars and glow are CSS inside the drawing since 2026-11-25, which WebKit
  may still draw on its main thread). Jitter that is left goes in
  the bug log with what was on screen. At night, look at the place's stars on the iPhone too: they still twinkle one by
  one (2026-11-24: in Chromium they cost 2-3% of a slowed phone, and twinkling them in three groups cost more, but WebKit
  draws every shape that moves inside a drawing on its main thread, so an iPhone may differ).
- [x] **Timmy's place at night: about 60 stars twinkle one by one inside the stage's drawing** (2026-11-22): the open
  place view keeps a slowed phone's main thread about half busy (`main` about nine-tenths, so not new). Draw the night sky's
  stars as a layer over the scene, the way the leaderboard's stage does its sparkles (`tools/figures/site/place.mjs`,
  `widget/place.js`), or twinkle them in a few groups, and measure again ([motion-cost](../reference/motion-cost.md)).
  Done 2026-11-24 (#550): measured, the stars were 2-3% of it (three groups cost more); the rest was the rank medal's shine
  in the place's panel, SMIL that drew the page every frame. Now a CSS transform, same look: 95-97% busy → 11% (phone size,
  4x), 87-90% → 33-38% (laptop size). The stars stay as they were.
- [ ] **What else moves inside a dashboard drawing** (2026-11-22): the classroom's Timmys bob (`rm-bob`, up to 10), the
  hub card's megaphone waves (`dx-wn-wave`, `dx-wn-spark`), the idea board's and the recap's Timmys blink. Each is small;
  lift one out of its drawing like the stage if a real phone shows it.
- [x] **The shop takes about 4 s to open on a slowed phone** (2026-11-22, measured at 4x): the dashboard draws itself again
  on `sh:shop`, a set's art file loads, and the room's size is worked out again. Find which of the three is most of it.
  Done 2026-11-24 (#550): most of it was none of the three: the shop drew every shelf twice on each first open (about
  600 ms); then the dashboard's `focus()` behind the shop on `sh:shop` (about 200 ms), the page's width changing when its
  scrollbar went (about 250 ms, desktops with classic scrollbars), and the set's file fetched after the shop's art (one
  round trip). All four cut: long tasks 1.4 s → 0.9 s (phone size, 4x), settled 1.85 s → 1.45 s.
- [x] **Timmy's place and Focus mode hide the page's scrollbar the way the shop did** (2026-11-24, the shop's opening; done
  in #564, the other way round: measured, keeping the room restyles the whole page and costs more than the new width, so
  the place and the figure zoom, `hx-fz-open`, stay as they were and the shop's `tsh-gut` came out; [motion-cost](../reference/motion-cost.md)):
  `html.tpv-open` (`widget/place.css`) and `html.hx-fz-open` (`widget/hub.css`) set `overflow: hidden`, so on a desktop
  with classic scrollbars the page behind is laid out again at a new width. Do as the shop now does (`tsh-gut` in
  `widget/shop.js` and `widget/shop.css`: `scrollbar-gutter: stable` when the page had a scrollbar) and measure.
- [x] **The Diamond and Dark Matter medals still move with SMIL** (2026-11-24, the place at night; done in #564: CSS, the
  nebula still, a hub's Stats 94-95% → 5-13% busy): `widget/ranks.js`
  `art()` with `animate` gives them SMIL sparkles, stars, a glow and (Dark Matter) a moving texture filter, which no
  stylesheet stops and which draw the page on every frame wherever an animated medal is (the place's panel, a hub's Stats,
  the trophy case, the cards). Make the sparkles, stars and glow CSS like the shine (`sh-rank-gl…`), hold the texture still,
  and measure with a Diamond and a Dark Matter test account ([motion-cost](../reference/motion-cost.md)).
- [ ] **What is left of the shop's opening** (2026-11-24, a lead): on a slowed phone the dialog's opening restyles the page
  behind (about 160 ms, the modal makes it inert) and the first draw of about 25 pieces takes about 770 ms, then its paint
  about 300 ms. If a real phone still feels slow, draw the shelves below the first screen as they come near it.
- [ ] **Read how the first Midnight Plaque went, the morning of Dec 3** (2026-11-22, idea board #4): `select * from
  eve_bosses where day = '2026-12-02'` (fell or not, when, how many people, what it paid), and the pg_cron runs of
  `sh-eve-boss` that night (any over a second, any failed). If it fell before 6 pm (from 3 pm, the past eves' middle one would have fallen about 8 pm) or got away with over a quarter left,
  tell Sam and suggest a new HP for Dec 9 (`eveBoss: <hp>` on mock2 in `hubs.js`, which the After merge step writes before
  the eve). Totals only, over 5 or more people ([learner-data-privacy](../rules/learner-data-privacy.md)).
- [ ] **The weekly pennant's first week, read after a Monday sweep** (2026-11-22): once `migration_v98` has run a week, how
  many pennants were made and how many by the sweep (`select how, count(*) from week_pennants group by 1`, totals only): a
  large sweep share means the page's claim is missing them (`widget/pet.js` `weekClaim`).
- [x] **The boards order people tied on a place by chance** (done in #563, `migration_v103`, applied after the merge: a tie
  by the name shown, case aside, then the id, on the Ranks, streaks, right-in-a-row, arcade and fairy boards, at a board's
  limit too; the Crowns board had it already; `tools/release/xp.js` section 21, and section 16 compares the boards as they
  come back) (2026-11-22, #533's CI): `get_rank_board_v2`,
  `get_leaderboard_v2` and the others end `order by rnk` alone, so tied people can trade places between loads (and at a
  board's limit, who shows can change). Cosmetic and older than v96: add a stable second key (the name, then the id) when
  someone next changes a board function.
- [x] **Does Link my devices time out for someone with thousands of answers?** (yes: done in #563, `migration_v103`,
  applied after the merge. The Postgres logs held 24 links that ran out of the 3 s from 2026-11-18, 19 of them that
  overloaded day, 4 on the 19th and 1 on the 23rd, and the 7 that finished took 2.0 s on average, up to 2.7 s. A link rebuilt
  XP twice (the answers' update trigger, then its own rebuild); now once, and the replay looks a boost up inline: 770 → 350
  ms on a throwaway copy with a 10,000-answer visitor, the same results row for row
  ([game-server](../reference/game-server.md)). The rebuild timed on the live database at 1-5 am Central, rolled back:
  #563's Release section) (2026-11-22, applying `migration_v96`): on
  the live database `sh_xp_rebuild` took 25 s for 10 people the first time (cold cache), then about 1 s for 4 others.
  `redeem_link_code` runs a rebuild under anon's 3 s `statement_timeout`, so time one rebuild of a heavy visitor (read-only:
  inside a transaction that rolls back, under `set local statement_timeout`, while the class is quiet) or look for
  `redeem_link_code` timeouts in the Postgres logs. A lead, not a confirmed bug.
- [ ] **Link my devices says "That code didn't work" when the server ran out of time** (2026-11-25, found in #563): both
  callers (`widget/ranks-hub.js`'s Link my devices and `widget/linkask.js`'s "Is this your other device?") turn a failed
  call into null, so a call the database stopped (anon's 3 s, a busy spell) reads as a wrong code and the person makes a
  fresh one. After a timeout the code still works (the whole call rolls back, the code's delete with it). Tell the two
  apart: on an error, something like "The server was slow just now. Try the same code again in a minute.", and a
  `link:busy` / `link-ask:busy` event instead of `fail` ([event-taxonomy](../reference/event-taxonomy.md)'s `link` row too).
- [ ] **Read Link my devices' times a week after `migration_v103` is applied** (2026-11-25, #563): before it, the 7 links
  that finished from 2026-11-18 took 2.0 s on average (2.7 s at most) and the logs held 24 timeouts. A week after: the
  week's calls and mean time (`select calls, total_exec_time, max_exec_time from extensions.pg_stat_statements where
  toplevel and query ilike '%redeem_link_code%'`, less what it read at the apply: 7 calls, 14,274 ms in all, 2,686 ms at
  most, counted since the 2026-11-18 20:57 UTC stats reset; v103 went in on 2026-11-25 at 08:13 UTC, so read it from
  2026-12-02), and the Postgres logs for `canceling statement due to statement timeout` with `redeem_link_code` in
  `parsed.context` (one 24-hour slice a call). Totals only. If a link still runs out of time, the next cut is the line
  below.
- [ ] **Link my devices can still run out of time on a heavy visitor's first, cold link after `migration_v103`** (2026-11-25): one
  `sh_xp_rebuild` of the visitor with the most answers took over 5 s on the live database at 1:36 am Central (rolled back,
  nothing else running), against anon's 3 s and 324 ms on a throwaway copy, and after v103 (08:14 UTC) it still did. The
  rebuild timed statement by statement right after took 1.2 s warm (the replay's insert into `xp_awards` 0.61 s, the
  `xp_days` insert 0.32 s, the `xp_seen` insert 0.19 s: [game-server](../reference/game-server.md)), and one full warm call
  0.80 s, so a warm link fits and a first, cold one for a heavy visitor may not. First tell cold pages from the shared CPU: at a quiet hour, one full
  `sh_xp_rebuild` twice in a row in one rolled-back call, with `explain (analyze, buffers)` on the replay's insert for its
  shared reads. Then the cut: answer the link at once and rebuild in a pg_cron job a minute later, or move the second
  device's awards instead of rebuilding when their days don't overlap, or rebuild only the rows that change. The
  week-after read of the link times (the line above) says how many people this hits.
- [ ] **The mastery read is slower a call than before the optimization pass** (2026-11-20, its readout): `get_hub_mastery`
  236 → 349 ms on the server on average (673 calls since phase 1), the evening's median 242 → 709 ms on 77 calls, 11% of the
  database's time. Since #459 the page works out the rank between answers, so the reads left are the ones when a hub's page
  opens (`loadOwn()` in `widget/ranks-hub.js`), beside the bootstrap: likely the cold ones, not a slower body, but not checked.
  Read it again a busy evening after `migration_v84.sql` (live 2026-11-20) with the bootstrap; if it's still slow, time it on
  a throwaway copy first-of-page against warmed, and against the body before `migration_v76.sql`, before changing anything
  ([the pass](done/2026-11-18-database-optimization-pass.md), its Log).
  **Read 2026-11-21 (Claude Code, read-only): no busy evening yet, so nothing changed.** Friday night (Nov 20, 6-10 pm Central,
  the edge logs) had 398 requests, 5 answer saves and **no** mastery reads: Heme & Endo Exam 3 was over that morning and
  Review of Systems is the only live hub, its Mock 1 on Thu Dec 3. Since v84 (Nov 20, 2:45 am to Nov 21, 2:45 am Central)
  all 33 mastery reads came on exam morning (3 am to 9 am Central), median 433 ms, 95th percentile 1.2 s at the edge, beside
  209 bootstraps (median 439 ms, 1.7 s). `pg_stat_statements` (still no reset since 2026-11-18 20:57 UTC): 2,240 calls,
  613 s, so 21 calls and about 13 s since the 2:30 am readout of Nov 20 (about 620 ms each, too few to read). A lead for the
  copy: about 5,600 buffer pages touched a call on average (12.6 million over 2,240, 44 MB read from memory each), where
  `get_rank_profile_v2` touches 73. **Read it next on Thu Dec 3, 1-5 am Central**, for Wed Dec 2's evening (the eve of Mock
  1): the edge logs for Dec 3 00:00-04:00 UTC, `pg_stat_statements` less the totals above; if a few people or more opened
  the hub and the median is still over about 250 ms, time it on the copy as above.
- [x] **A key read before any drafted bank ships: Sam's call** (done in #552: Sam, "adding the answer key step is good"; the step is in build-a-hub's Check) (2026-11-24, the lessons audit that found 52 shifted keys in Review of Systems): add a step to [build-a-hub](../how-to/build-a-hub.md) (and the drafting brief for a lecture added later): before the PR, one agent per course of about 200 questions reads every key against its explanation and why lines and lists the ones that disagree (2 to 4 minutes a course; the brief this audit used is in its PR). Proposed in the PR's "For Sam"; write it in once Sam says yes.
- [x] **Review of Systems: two facts to check against the slides** (fixed in #552 from standard references: Sam, "fix 5") (2026-11-24, the audit's key read; not changed, both may be how the course teaches it): Gold's agar is "MS + 15% sucrose + bacitracin" in `om-viral-01` and the Oral Microbiology notes, where Gold, Jordan and van Houte's recipe (MSB) has 20%; and `f1-innate-12` keys "B cells complete their development in the bone marrow" as true while `f1-hyper-10`'s explanation says naive B cells finish maturing in the spleen and lymph nodes. If a slide settles either, change the question, its why lines and the notes together.
- [x] **Review of Systems: a notice to the class about the 52 fixed keys? Sam's call** (2026-11-24, #552; sent 2026-11-24 at 20:13 UTC as notice #8, Sam: "You can send the notice"; #555). Draft in #552's description ("Head & Neck in the Review of Systems hub had 51 answer keys that were one choice off ..."); send with `insert into site_notices (hub, title, message)` or the admin page's Inbox → "Tell everyone" only on Sam's yes ([reply-to-reports](../how-to/reply-to-reports.md)).
- [ ] **Review of Systems: weigh the mock by what Mock 1 asked** (2026-11-19, the hub's build): the hub's 200-question mock
  spreads its questions by the size of each course (`core.json` `mock.blueprint`), a guess: the course announced no counts.
  After Mock 1 (Thu Dec 3, noon), read its exam check-ins (which courses felt heavy, what surprised people) and, before Mock 2
  (Dec 10), move the blueprint toward that, and add High likelihood topics for what the check-ins say came up
  ([hub note](../hubs/review-of-systems.md)).
- [x] **Retest BUG-197 a day after #524 merges** (2026-11-21): count `select count(*) from question_events where qid like 'pq-%'` (read-only, under `statement_timeout = '5s'`); 0 means the guard proxy holds: set BUG-197 to retested. Any rows: add a data fix like `tools/data-fixes/2026-11-20-quiet-test-rows.sql` and look for the path the guard missed. Done 2026-11-24 (#544): 2 rows, both from 12 minutes before #524 merged, none since; BUG-197 retested, and `tools/data-fixes/2026-11-24-bug-197-last-rows.sql` takes the two after the merge.
- [ ] **The smoke test's game-layer wiring check runs again on the next hub with an arcade** (2026-11-20, Exam 3's page down):
  `tools/ci/smoke.js`'s `wiringCheck` (Million-Dollar Smile's sessions and answers, Timmy Time's minutes) needs a live engine hub
  with Smile in its `content/arcade.js`, and Review of Systems has no arcade, so it is skipped until one is built. When the next
  hub with an arcade ships, check its smoke run prints "the game layer's wiring" for it (nothing to change: it picks the hub itself).
- [x] **Learn: a typed answer** (2026-11-13, idea from making Learn "more like quizlet"): Quizlet's Learn ends on written
  questions. Ours ends on recall before the choices show (Sam's call 5, 2026-11-06), because a typed answer can't be
  graded against a bank question's choice. Only if Sam asks for it. (#549, Sam: "Do typed answers in learn and undo in
  flashcards too": a short answer's second, mastering step is typed; a forgiving match marks a clear one right, otherwise
  the student says; a match pays as an answer, a self-mark like a recall card, neither in the class's numbers;
  migration_v102, applied live.)
- [x] **Flashcards: undo the last rating** (2026-11-13, same): not built, because a rating is paid and sent to the server
  at once; it needs the rating held back a few seconds first. Only if Sam asks for it. (#549: a rating is held 5 seconds
  under the next card with an Undo, or U, or Ctrl+Z; saved at the next rating, Close, or when the page is hidden or
  closed, and one still queued is sent by the next page, paid once.)
- [ ] **Learn's typed answer: read how it goes after a week or two** (2026-11-24, from building it): how often a typed
  answer is matched by itself and how often the student has to say ("I had it" / "I missed it"): `answer_xp` rows with
  `ctx = 'typed'`, `kind` `one` (matched or a wrong choice typed) against `self` (marked by hand). If most are marked by
  hand, the match may need to forgive more (`SH_STUDY.match` in `widget/study-modes.js`, checked by `tools/ci/typed.js`),
  or the six-word limit on which answers are typed may need to move. Totals only ([learner-data-privacy](../rules/learner-data-privacy.md)).
- [x] **Cut `widget/v3.css` to the rules a hub on the engine draws** (2026-11-21, left from #525's restyle fix): about 20 ms of putting the sheet in is still matching its 789 rules against the page, and much of it styled the old single-file pages. A static check finds almost nothing dead yet, because `widget/v3.js` still draws those old parts; once the game layer's last fallbacks are out of `widget/v3.js` (another session, 2026-11-21), find the rules nothing left can draw, drop them, and diff every element's computed style before and after as #525 did. Small gain: do it with the next v3.js cleanup, not on its own. Done (#548): cut to the rules for something a hub on the engine draws: the old pages' launcher, menu, phone bar and More sheet, Settings panel, name badge, top bars, update banner, streak toast, Daily Drill dialog, inbox ribbon, countdown pill, accent swatches, docked boss, lecture pager, class picks and answer marks came out. 107 to 72 KB, 826 to 543 style rules (928 to 616 selectors), 46 to 31 `@keyframes` (every one left is used); nothing new on `:root`. Putting the sheet in on the slow phone (CPU 4x, median of 8): about 22 to about 15 ms. Computed styles of every element (and its `::before`, `::after`), 130 states (Home, Notes, Questions after an answer, More and its Settings and Stats, the class stats panel, the name editor, search, Suggest, Report, the inbox; laptop and phone; light, dark by the system and dark set on the page; 130 with a pair meant to add an accent metal, which turned out not to turn it on, because the stubbed data has no rank, so the stored tier fell to 0 and the metal was refused; the metal is gone since, the line after next), about 2.67 million compared: the only differences on anything drawn are what two copies of `main` also differ by (running animations), plus two races of the test itself (the notes' three random check questions, and a "+XP" flight its snapshot cancels), neither from CSS (the trimmed copy against itself: none). Everything else that changed is inside what the engine always hides (the Settings panel, the menu, the launcher row, the name badge and the old ribbon's Inbox and Tour buttons). Left: `widget/v3.js` still builds those parts (the next line), and Sam's call on the accent metal (the line after it).
- [x] **Take the old pages' parts out of `widget/v3.js`** (2026-11-24, left from the line above, #548): v3.js still builds parts that a hub on the engine hides for good or never opens, and since #548 they have no styles. They are the desktop launcher and its menu (`#shstat-menu`, `.shstat-launchrow`), the name badge (`#shname-badge`), the inbox ribbon and its tour button (`body > .sh-ribbon-inbox`), the old Settings panel (`#shstat-settingspanel`) and the Daily Drill dialog (`widget/drill.js`'s `.sh-drill`; `#drill` goes to `#questions/drill`). It also keeps paths for the old pages: the top-bar fitter for `header.hub-header`, the class picks' paint (`.sh-cp`), the lecture pager, `reserveTopClearance` and `#sh-topbar`, and the streak toast and update banner for a page without `shToast`. `widget/fx.js`'s answer marks (`.qcard-choice`) and countdown pill (`#countdownPill`) look for old markup too. `widget/hub.js` clicks three of the hidden launcher pills to open their panels (`#shstat-search-pill`, `#shstat-stats-pill`, `#shstat-suggest-pill`), so give it a direct call first. Then `widget/hub.css`'s rules that hide those parts (`#shstat-menu, .shstat-launchrow, #sh-topbar, #shname-badge, body > .sh-ribbon-inbox`) and its other selectors for parts that are gone (`.sh-update-toast`, `.shstat-streaktoast`) can go too. Diff every element's computed style before and after, as #548 did. Sam, 2026-11-24: "The cleanup sounds good" ([decisions](../decisions.md)). (#568: all of it, with the hub's Search, Class stats and Suggest called straight (`window.shWidgetPanel`) and the stats panel's rank loaded on `sh:stats-open`; the computed styles of every element on the dashboard and the hub's Home, Notes, Questions, an answered question, the drill, More, Settings, Stats, Search, Suggest, Report and the boards, light, dark and the device's dark, phone and laptop, matched `main`'s, apart from what two runs of `main` differ by, the removed `--sh-head-h` (0px) and the rank pictures' gradient ids. Fixed on the way: the mock card's "See what I missed", BUG-202.)
- [ ] **Take the old pages' parts out of the rest of the widget** (2026-11-25, left from #568): with v3.js's old parts gone, a few other files still look for them and find nothing, so nothing breaks, but the code is dead. `widget/tour.js` keeps the old single-file hub's steps and their helpers (`launcherOpen()`, the steps for `#sh-ribbon-name`, `.sh-ribbon-inbox` and `#shstat-menu`, `pointAtButton()`'s `#shstat-more-pill`, `#shstat-launch` and `.sh-ribbon-tour`, the `.sh-drill` check), though a hub on the engine gives its own steps (`window.SH_TOUR.steps()`); `widget/linkask.js` waits while `#sh-drill:not([hidden])` is open; `widget/clicks.js` lists `#shstat-settingspanel` among the widget's roots; `widget/eggs.js` looks for `header.hub-header`. `widget/clicks.js`'s daily settings snapshot still records `music` (`sh_pref_music`), a setting nothing has been able to change since 2026-11-05 and nothing plays since #568 (its loops were deleted 2026-11-26); take it out like the font and the metal (its `state:music=…` events; the `state` row in [event-taxonomy](../reference/event-taxonomy.md) names no setting, so it stays as it is). Take them out and check the dashboard's and a hub's tours still run the same, step by step.
- [x] **Sam's call: the study-music loops** (2026-11-25, found in #568): `widget/audio/` (cafe, lo-fi, piano, rain and waves, 9.7 MB) was played only by the old Settings panel's background music, cut from Settings on 2026-11-05 and out of `widget/v3.js` since #568; nothing loads them now. [no-narration-in-the-repo](../rules/no-narration-in-the-repo.md) keeps them as fixed sounds. Delete them (git keeps them, the published site drops 9.7 MB), or keep them for a comeback? Done (#572; Sam, 2026-11-26: "Delete study music loops", [decisions](../decisions.md)): the five loops are deleted, and the public-repo check (`tools/release/secrets.js`) no longer allows media in `widget/audio/`. Git keeps them: `git checkout f5daf2d0 -- widget/audio`.
- [x] **Sam's call: the accent metal still shows for whoever picked one** (2026-11-24, found in #548): the accent-metal setting was cut on 2026-11-05 ([decisions](../decisions.md)), but `widget/ranks-hub.js` still applies a metal saved on the device before then (`sh_pref_accent`): the hub's accent color in that metal, and its texture on the progress bars. Nothing on a hub can change or clear it now. Keep it as something they earned (the release said the accent metals "come with you"), or stop applying it? #548 kept its rules for what a hub still draws (the progress bars, the archived notice's button). Done (#548; Sam, 2026-11-24: "Accent metal should stop being applied", [decisions](../decisions.md)): nothing applies a metal now, and a hub clears a saved one; `widget/ranks.js`'s metals (`ACCENTS`, `applyAccent`, the texture code), their textures (`assets/tex/`), `tools/make-accent-tex.js`, the swatches in the old Settings panel, v3.css's accent rules and the metal in the daily settings snapshot (`widget/clicks.js`) came out.
- [x] **Sam's call: a saved font choice still applies** (2026-11-24, found in #548): Font was cut from Settings with the accent metal on 2026-11-05, but `applyFontPref()` in `widget/v3.js` still sets `--font-body` from a font saved on the device before then (`sh_pref_font`), on every hub, and nothing on a hub can change it. Stop it like the metal (clear the saved one)? Background music doesn't come back the same way: it resumes only when the old Settings panel opens, which a hub never does. Done (Sam, 2026-11-24: "For font, stop applying"; [decisions](../decisions.md)): `applyFontPref()` now clears the saved font and leaves `--font-body` to the page, and the font is out of the daily settings snapshot (`widget/clicks.js`).
- [x] **Before the first collapse (about 2027-09-13), point the year-spanning readers at the totals** (2026-11-21, migration_v93):
  `sh_insights` (the admin page's Insights, every hub side by side), `get_hub_recap`, `tools/retro.sql` and `tools/lessons-daily.sql` read
  `activity_hourly` only, so a hub older than a year would show no time. Read `activity_daily` / `activity_visits_daily` (people per day,
  no ids) for days past the school year, or decide those hubs' numbers are only in their published recaps and `LESSONS.md`.
  **Done** (2026-11-24, `migration_v101`, #545): all four read `activity_daily` for the collapsed days' minutes; the per-person
  numbers, which totals can't give, are kept per hub (`insight_cards_kept`) by the nightly job the night a hub's first day is
  collapsed, and the Insights tab reads them from there ([insights-dashboard](../reference/insights-dashboard.md)). The migration
  is applied after the merge, at 1-5 am Central (`supabase/pending-migrations.txt` until it is).
- [ ] **A week after `migration_v85` is applied (2026-11-19), so on 2026-11-26, check what the part saved** (2026-11-19): the admin page's Ask Timmy tab (cost by
  day against 11-14 to 11-18's) and the edge logs' `turn` lines (`content`: `part`, `part+full`, `full`). In the eval, 16 of 50
  first questions were asked again with the whole content; if real students' share is much higher, the part costs more than it
  saves: send more with it (another lecture, the review tables) or turn it off (`WARM_MS` in `supabase/functions/timmy/core.js`).
- [ ] **Ask Timmy's quote check fails a table cell under three words** (2026-11-19, the eval's pe-02 on the whole content):
  he cited R1.3 with "≥10 cigarettes/day", which is in the table, but `quoteIn` wants at least three words or the whole unit, so
  the link was dropped and the eval failed. Either accept a whole table cell (the text between two ` · `) as a quote, or say in
  `RULES` that a table quote takes the row's label with it.
- [ ] **A "Delete my data" button, only if Sam asks** (2026-11-04, left unticked in [the retention task](done/2026-11-04-analytics-retention.md),
  moved here 2026-11-20): a button in Settings that deletes every row for this browser's id, and the id shown in Stats so a
  deletion request can be honored ([analytics-retention](../reference/analytics-retention.md)). Not asked for; build it only
  when Sam asks.
- [ ] **Parked: a second free Supabase project for the analytics, when it's needed** (Sam, 2026-11-18: "i think adding the
  second database may be necessary at some point"; "Not now"; moved here from [the database-load task](done/2026-11-18-database-load.md),
  2026-11-20): pings, clicks, feature events and question health (about a third of the requests, over half the storage) move
  to their own free project; answers, XP and the shop stay. Due once the database nears about 420 MB of its 500 MB (every
  lessons audit reads the size, `tools/lessons-refresh.md` step 1; 323 MB on 2026-11-19).
  **2026-11-22:** Sam plans to make it; it is package 4 of [the sustainability task](2026-11-22-sustainable-for-years.md),
  and after packages 1 and 2 (shorter analytics windows, archived hubs' answers packed away) it's about load more than room
  (359 MB on 2026-11-21).
- [ ] **The open boards PRs, as the engine plan splits them** (2026-11-20; rewritten 2026-11-24 to section 6 of
  [the engine plan](https://github.com/smcmurry6-source/study-hubs/blob/claude/boards-hub/docs/boards/ENGINE_PLAN.md), on
  `claude/boards-hub`, which says each one's step): **#81, #97, #100 and #102 are closed as replaced** (2026-11-22: the
  engine's card and bank, T-13's `item_state`, `widget/cases.js`'s charts, T-14's mock blocks). **#95 and #101 land through
  T-16 and T-17** (Chairside's core, then its art and sound, each rebased onto the engine move), then close as landed. **The
  other ten are finished as they are**: #87, #91, #94, #98, #99, #103, #104, #106, #110 and #111, each with the small fix,
  checker or quote pass, or read section 6 gives it. None merges `main` in on its own, and once T-07 has landed they merge
  without a page rebuild. **T-07 landed 2026-11-25 (#562).** Of the twelve still open, only #111 touches a file T-07 replaced
  (the generated `hubs/boards/index.html`): take `claude/boards-hub`'s settings page and run `node tools/build-boards.js`. Merging any of them is Sam's call ([boards](../hubs/boards.md),
  [the task](2026-11-22-boards-onto-the-engine.md)).
- [x] **Boards: the High Likelihood check skips boards when its first unit is published** (Sam, 2026-11-21: "I have no idea so
  maybe just take it out for now"): on `claude/boards-hub`, `tools/ci/smoke.js`'s check for a lecture with questions but no
  topics skips the boards hub, and `LIKELY_TOPICS` stays empty ([boards](../hubs/boards.md)). Done in T-07 (#562): `boards` is
  in `LIKELY_SKIP`, and the build writes `"likelyTopics": []`.
- [ ] **Boards: which INBDE component anat, physio, micro and gpath go under** (2026-11-25, T-07, #562): Sam's call, needed
  before the first of them is published. The engine groups the units by the INBDE's three components (`GROUPS` in
  `src/boards/config.js` on `claude/boards-hub`: D&TP, OHM, P&P, from each unit's home CCs), and these four foundation units
  have no home CC. The build refuses to publish a unit in no group ([boards](../hubs/boards.md)).
- [ ] **Boards: the T-06 brief's `--out` command** (2026-11-25, T-07, #562): `docs/boards/tasks/T-06.md` on `claude/boards-hub`
  still says `--out /tmp/boards-medcx/index.html`; since T-07, `--out` takes a folder (`--out /tmp/boards-medcx`, which gets
  `content/` and `game/`). Fix it in the next PR that touches that brief.
- [ ] **Boards: bring T-07's shared-tool changes to `main`** (2026-11-25, #562): on `claude/boards-hub`, `tools/hub-next/build.mjs`
  exports `buildFrom()` and lets a hub whose lectures are all still coming have no questions; `tools/ci/smoke.js` takes its
  one-hub checks from the first hub with questions (`firstHub`); `tools/timmy/test.mjs` picks a hub with published content.
  Each keeps Review of Systems the same. They come to `main` with the boards merge, or sooner in their own PR. Either way,
  merge them by hand, not by taking one side.
