---
type: inbox
tags: [tasks]
---

# Inbox

Quick ideas and requests, one line each. An agent asked to go through the inbox turns each line into a task note in
this folder (deleting the line: the note carries it) or just does it, if it's small and clear, and ticks it with its PR
(`- [x] ... (#123)`); ticked lines are cleared the next time someone goes through the inbox. Anything left to do from a chat
lands here or in a task note ([to-dos-go-in-the-vault](../rules/to-dos-go-in-the-vault.md)). See [README](README.md).

- [ ] **The rank pill while the bootstrap times out** (2026-11-18, found with BUG-183, #427). `widget/ranks.js` asks
  `get_rank_profile_v2` only when `shGame.v2()` is true, so on a page whose bootstrap timed out in a busy minute it reads the
  old `get_rank_profile` until the first answer's reply. Check whether that draws the wrong rank or journey, and if so ask
  `shGame.live()` there too, as `widget/hub-rewards.js` and `widget/games.js` do since #427.
- [ ] **The reward card on the dashboard too** (2026-11-18, from the hubs' reward card: Sam, "i want it to look much cooler and
  communicate that you just got xp and crowns better"). A hub shows what a bonus paid on a gold card (`drawPrize` in
  `widget/hub-rewards.js`, its styles inside it); the dashboard's prizes (the daily visit, the leaderboard name, trophies:
  `toast()` in `widget/dash.js`) are still the dark toast. The dashboard measured 342 of its 345 KB budget on 2026-11-18, so
  the card would go in a file the dashboard fetches when a prize first pays (not `dash.bundle.js`), or with Sam's OK to raise
  the budget.
- [ ] **The dashboard is at 344 of its 345 KB** (2026-11-19, after the What's new box and the stage's foot added about 2.7 KB
  gzipped; `node tools/release/perf.js --page index.html`). The next change that adds to `dash.bundle.js` or
  `site.bundle.css` won't fit: move something the first screen doesn't need into a file fetched on first use (as Timmy's
  place and the trophy case are), or ask Sam to raise the budget in `tools/release/budgets.json`.
- [x] **An index for recording an answer, if the database-load work doesn't already cover it** (done: `migration_v71.sql`, both indexes built live 2026-11-18, [#423](https://github.com/smcmurry6-source/study-hubs/pull/423)) (2026-11-18, found while
  tracing the Today card's missing crowns, BUG-182). The most frequent statement timeout in that day's `postgres_logs` (103 of
  about 436) was `sh_answer`'s speed limit, `select max(a.answered_at) from personal_answers a where a.visitor_id = ... and
  a.id <> aid and a.answered_at <= v_at`, with its neighbors (the answers in the last 60 seconds, the latest one for a double
  tap). `personal_answers` has only `(visitor_id, hub)`, so each reads every answer the person ever gave: about 0.4 s for the
  heaviest visitor on a quiet database, three times an answer. Candidates: `(visitor_id, answered_at desc, id desc)`, and
  `(visitor_id, hub, qid, answered_at desc, id desc)` for the per-question reads and `sh_medal_check`. Written and tested
  (`tools/release/xp.js` passed), then left out of the reward-card PR because #421 took v70 and owns the database work; check
  its task note (`vault/tasks/2026-11-18-database-load.md`) first, and measure on a throwaway copy, never the live database.
- [x] **Re-price the middle of the shop, if Sam agrees** (decided: Sam, 2026-11-18, "lets keep all the prices for now"; the next audit reads it again, [decisions](../decisions.md)) (the 2026-11-18 lessons audit, [earn-rates-stay-enjoyable](../rules/earn-rates-stay-enjoyable.md)):
  since studying pays 5 crowns per 10 XP and 100 an hour (#403's crowns migration, live since 11-18), the median study day earns about 700 crowns, so a Rare
  costs 1-2 study days, an Epic 2-4 and a Legendary 6-12, and half the class could buy anything today (4% of crowns spent). Proposed:
  Rare 1,500-2,500, Epic 3,500-6,000, Legendary 7,000-12,000, the boosts 300 and 800, the rest as they are (a migration: the rarity
  bands are checked in the database). Or wait and read `tools/economy.sql` again at the next audit, with the prizes in and the back
  pay out. Sam's call.
- [x] **A statement item reorders its statements on a retry** (Perio reports #55, #56, 2026-11-17: "the order of the statements as
  well as the order of the question answers should change so you dont just remember the answer was 1, 2 and 4"). The new wordings
  (`variants.json`) reword but keep the order. A wording could renumber the statements and relabel each choice to the same set
  (choice k still means the same statements, so the keys and the class's picks hold), but `numbered-statements`' canonical order and
  `two-statement`'s fixed choices would need an exception for a reordered wording. **Sam said yes, 2026-11-18** ("yes to the two ideas"): done (`widget/statements.js`, #417).
- [x] **A High likelihood chip says why** (Perio report #57, 2026-11-17: "what is the rationale for this being high likelihood"):
  the chip on a card could name its topic and basis (the hint, the review, the check-ins), the way Exam Hints' "Most likely
  questions" list already does (`widget/hub.js`). **Sam said yes, 2026-11-18**: done (the tag opens why, #417).
- [x] **Tap a word in the notes to jump the narration there** (Sam, 2026-11-17; done, on phones too, with the Highlight button's phone fix, BUG-157: #391): in Listen / Follow along, clicking a word
  skips the recording to that word (each recording's `.words.json` has the timings).
- [x] **Let Ask Timmy use outside sources** (Sam, 2026-11-17; done: when the notes don't cover it, he looks it up on trusted
  medical and dental sites and adds a "Not in your notes" box with the sources, #399; [ask-timmy](../reference/ask-timmy.md)).
  Sam: "the outside source would only be used when there was something about the content that ask timmy doesnt have an
  answer for ... just to fill in the gaps", then "we can do web search, the sites and others like them are good to go on
  the list, no limit on gap answers".
- [x] **Show the Shiny Gold Crowns you've earned on Home's Today card** (Sam, 2026-11-17). Done: a Crowns tile with the balance (what's left to spend; "earned in all" in its tooltip) that opens the shop (#391).
- [ ] **More ways to earn crowns, if Sam wants them** (2026-11-17; Sam, with the prizes of `migration_v68.sql`: "im open to
  other ways too"). Ideas offered, none built: catching the Tooth Fairy or the Golden Probe, a perfect mock, Yesterday's
  misses all right, an idea of yours marked done on the idea board, the first day back after a week away. Each would be one
  `xp_awards` row with a key that pays once and an amount in `sh_prizes()` ([game-server](../reference/game-server.md)).
  (Studying's rate was raised to 5 crowns per 10 XP the same day, Sam: "lets increase it to 5 crowns per 10xp".)
- [x] **More cosmetics for Timmy and Timmy's place** (Sam, 2026-11-17): new outfits and place pieces
  ([draw-a-seasonal-set](../how-to/draw-a-seasonal-set.md), `tools/figures/site/`). Sam brought it back on 2026-11-18 ("Go
  crazy"): now [its task](done/2026-11-18-more-cosmetics.md).
- [ ] **A tall piece in the front yard slot covers Timmy at the door** (2026-11-18, seen on the collection sheets): the
  `front` slot (`SLOTS` in `tools/figures/site/place.mjs`, x 6.7, y 10.2) is in front of every home's `spots.door`, so a tall
  piece there (Desert ranch's windmill, July 4's fireworks stand, Thanksgiving's balloon) hides him on the card. Ideas: draw
  Timmy over a front-slot piece when he's at the door, or nudge the door spot when the front slot holds a tall piece. Ask Sam.
- [ ] **Kit niceties the collection drawers asked for** (2026-11-18, [the task](done/2026-11-18-more-cosmetics.md)): a yard egg
  can only animate its `.tp-eb` group, so the moon rover can't roll, the dish can't turn and the windmill's and wagon's wheels
  only blur (a hook that moves the whole piece while its egg plays, within [motion-cost](../reference/motion-cost.md)); a coral
  or kelp `treeKind` for the reef and a plain one for the moon (both use the crystal tree); no snow on an underwater scene.
- [x] **A different way to mark retries in the Question Bank** (Sam, 2026-11-17; done: a tinted card with a dashed edge and a "Second try" / "Third try" band, #391): a missed question that comes back a few
  cards later should look clearly different from a new one (`widget/hub-bank.js`; see also the `bank:retry-shown` line below).
- [x] **Refine what double XP boosts cost** (Sam, 2026-11-17; done: 150 and 400 crowns, from the class's earning rate, `migration_v62.sql`, #394): the shop's boosts were 600 crowns for 1 hour (`boost-1h`)
  and 1,500 for 3 hours (`boost-3h`), set in the shop's items (`supabase/schema.sql`); retune them against how fast crowns
  are earned (1 per 10 XP, plus trophies, medals and rank-ups), in a migration ([the shop](done/2026-11-06-redesign-timmy-shop.md)).
- [ ] **A Timmy Time episode for Heme & Endo Exam 3** (2026-11-16) Exam 2 had one; Exam 3's hub shipped without (`core.json` `podcast: null`). Sam, 2026-11-17: "wait for timmy time until we have all the lectures for exam 3": make it (`/podcast`) once every Exam 3 lecture is in the hub, not before ([the hub](../hubs/heme-endo-exam3.md)). All in since 2026-11-18; Sam: "after you finish, start a new session for timmy time": handed to its own session, which ticks this with its PR.
- [ ] **Check Heme & Endo Exam 3's L21 and L22 against their slides** (2026-11-18). Both were written from their recordings because the connector couldn't read the decks (Drive, Exam 3 folder: over its 10 MB limit, no text). When they can be read (Sam opens them as Google Slides, or puts a smaller copy there), compare each slide with the notes (`hubs/heme-endo-exam3/content/notes.json`, `mpath` and `fpath`): add what's only on a slide, fix what disagrees, take out the "not checked against the slides" reading-note and the lectures' `note` in `core.json`, re-check the questions, and narrate again ([the hub](../hubs/heme-endo-exam3.md)). Before Fri 11/20, 8 am, or not at all.
- [x] **Deploy Ask Timmy's function again for the Occlusion final's episode** (2026-11-15, #366). `supabase/functions/timmy/site.json`
  gained the episode (rebuilt from the About page), but the live function is still version 4, from the Perio final's merge:
  `node tools/timmy/deploy.mjs` (needs `SUPABASE_ACCESS_TOKEN`). #366's session didn't, because its permission check stopped
  the deploy; it waits for Sam's OK. Until then, asked about Timmy Time, Ask Timmy doesn't list the Occlusion final's episode.
  Done on Sam's OK: version 5 (#369).
- [x] **Sam: give the After merge workflow its secrets** (2026-11-15, [after-a-merge](../how-to/after-a-merge.md)). GitHub →
  the repo's Settings → Environments → New environment `after-merge` → Deployment branches: "Selected branches", add
  `main` → Environment secrets: `SB_KEY`, `ADMIN_SECRET`, `SUPABASE_ACCESS_TOKEN`. Until then each merge's run shows its
  steps as "blocked" (red on `main`), and an agent runs `node tools/after-merge/run.js` by hand after the merge.
  Done 2026-11-15: the re-run of #373's merge had all three and did every step (Ask Timmy deployed, version 8, and
  answered; both changelog lines logged; the post-release check passed).
- [x] **After Occlusion's final bank audit merges** (2026-11-15, [#370](https://github.com/smcmurry6-source/study-hubs/pull/370); the hub note's "The final's bank audit"). In order:
  - [x] Load the answer keys: `node tools/xp/keys.js occlusion --load` (156 questions edited, 4 new, 3 retired).
  - [x] Run `tools/data-fixes/2026-11-15-occlusion-audit.sql` once, right after the merge (Sam, or the connector with Sam's
    OK; it writes to the class's data). It recounts 73 rewritten choices' picks, and 8 re-aimed questions' "% right", from
    the new versions' answers. If one of its questions is edited again first, read its new version (the file says how).
    A select-all choice it touches starts again from 0 (its ticks aren't in `question_events`).
  - [x] Deploy Ask Timmy's function again (`node tools/timmy/deploy.mjs`, needs `SUPABASE_ACCESS_TOKEN` and Sam's OK):
    `supabase/functions/timmy/site.json` gained the mock's High likelihood line from the About page.
  - [x] `log_changelog` for `occlusion` (needs `ADMIN_SECRET`), then `node tools/release/postcheck.js`.
  Done 2026-11-15 right after the merge, with `tools/after-merge/run.js` (Sam: "lets make all of that automatic"): 845
  keys loaded, Ask Timmy version 6 (its test question answered), both data fixes run once Pages served the push (this one
  and the 11-14 Bennett fix), the post-release check passed, and the changelog line logged.
  - [x] Sam: two questions the notes don't settle. Decided 2026-11-15: follow Dr. Givan's slides on the splint (irreversible);
    L10 keeps "Miller", which is what Dr. Abou-Arraj's slide says ([decisions](../decisions.md)). No change needed.
- [x] **After the Perio bank audit merges** (2026-11-15, [its note](done/2026-11-15-perio-bank-audit.md)): load Perio's
  answer keys in the same sitting (`node tools/xp/keys.js perio --load`: 670 questions, 103 retired, 23 new, 263
  edited) and log the changelog line (`log_changelog`). Until the keys load, the new questions earn no XP and edited
  keys grade against the old ones. Done at the merge of #371: 670 loaded, 103 retired, the changelog logged.
- [x] **Sam's call: notes the Perio bank audit flagged** (2026-11-15, the list in [its note](done/2026-11-15-perio-bank-audit.md)'s
  Outcome, "For Sam"). Eight spots in the S1-S8 notes that disagree with each other or with current teaching (S2's
  chromic gut, S3's "#14", S6's contained defect...). No question turns on any; a fix means narrating that session
  again (and Timmy Time if it covers it). Also there: the low-yield retirements Sam may want back.
  Decided (Sam, 2026-11-15): leave the eight spots as they are; the 27 retirements stand ([decisions](../decisions.md), #371).
- [x] **Sam's own look at the live site after the release** (done: Sam, 2026-11-18, "i did my own look"; nothing reported) (2026-11-14, [the release](done/2026-11-06-redesign-release.md)).
  What an agent can't check without writing to the class's data as a made-up student: one Ask Timmy question from a
  phone (a "From the notes" link opens the paragraph; the admin page's Ask Timmy tab shows it with its cost); one Learn
  round and a flashcard; a random visit; the dashboard with a hub open in another tab (your Timmy walks into the
  classroom in his outfit, his desk says "You"); and scrolling on a real phone (BUG-147 is `fixed`; it is `retested`
  when Sam says it's smooth). Anything wrong goes in [the bug log](../release/bug-log.md).
- [x] **Sam: the Bennett data fix from #361** (2026-11-14). `tools/data-fixes/2026-11-14-in-bennett.sql` clears the
  class's old picks on Occlusion's reworded Bennett choice, "run once, right after the PR merges". The release session
  couldn't tell from a read-only look whether it ran, and didn't run it (it writes to the class's data). Run it, or say
  it was run.
- [x] ~~**Ask Timmy's key is saved as `TIMMY_EVAL_KEY`** (2026-11-14, BUG-150). It works: the function reads that name
  when there is no `ANTHROPIC_API_KEY`. If Sam saves the key again under `ANTHROPIC_API_KEY` (Supabase, Edge Functions,
  Secrets), the fallback line in `supabase/functions/timmy/index.ts` can come out.~~ Not needed (Sam, 2026-11-18: "yes
  strike it"): the fallback stays for good, and the eval reads the same name. The admin page's Ask Timmy tab also
  shows the release's test chat (visitor `release-check-2026-11-14`, one failed and one answered question, $0.60).
- [x] **The redesign's other task notes are still open** (2026-11-14; done 2026-11-17, #401): [phase 2](done/2026-11-05-redesign-phase-2-live-hubs.md),
  [phase 3](done/2026-11-05-redesign-phase-3-dashboard.md), [phase 4](done/2026-11-05-redesign-phase-4-game-layer.md),
  [the journeys](done/2026-11-06-redesign-progression-journeys.md), [the shop](done/2026-11-06-redesign-timmy-shop.md) and
  [Timmy's place](done/2026-11-06-redesign-timmys-place.md) are ticked, given their Outcome and moved to `done/`: all of
  it shipped with the release. The one thing left, BUG-076, is the next line.
- [x] **The dashboard at 320 px with the largest text: BUG-076, and the report-reply pop-up** (2026-11-17, from
  [phase 3](done/2026-11-05-redesign-phase-3-dashboard.md); done the same day, #401). The week's dots shrink to fit and
  "Start studying" wraps; the pop-up needed nothing (it was wider only because the page scrolled sideways). Looking at the
  large sizes found BUG-163 too, fixed in the same PR: the rank card stacks its medallion above the words from X-Large up,
  and the hub card's title fits at 320 px ([bug log](../release/bug-log.md)).
- [x] **`supabase/schema.sql` against the live database's text** (2026-11-14, the release's look before the migrations;
  done 2026-11-17, #401). Every difference was text only. With comments, line endings, layout and the secret left out,
  all but three functions already matched. `get_display_name` was laid out on four lines live and one in the file.
  `get_nuke_by_hub` and `get_nuke_recent` have column labels live (`as hub`, `as display_name`), which change nothing in
  a `returns table` function. The file now has those, and `question_flags_visitor_idx` (migration_v25; its twin on
  `hub_suggestions` was dropped by migration_v53). The same 210 functions and 114 indexes now hash the same on both sides.
  Compared by hash only; the file's header says how to check again. Left as is: the release's five migrations missing from
  Supabase's own migration list (bookkeeping only).
- [ ] **After the redesign's release: what the old pages still hold up** (2026-11-13, [the release](done/2026-11-06-redesign-release.md)).
  When the last single-file hub's page comes down (the archived ones and Heme & Endo Exam 2): take out the `NEW` (`html.shx`)
  branches in `widget/ranks.js` and `widget/rankup.js` (the old cards, the 23-trophy list), the old house picture and
  `sh_rank_tier`'s use in `widget/pet.js` (`houseSvg`: today only the fallback under the place on the dashboard), the
  `rpc2` fallbacks in `widget/dash.js` for a database without the game layer, `legacy` and the unused `modes` in `hubs.js`,
  and any separate widget file or the full client (`widget/vendor/supabase-2.117.2.js`) that `grep` finds no page loading
  by name (`review/` keeps the full client). The sources of a bundle are never deleted.
- [x] **Load a hub's answer keys by itself after a question change** (2026-11-15: the After merge workflow, [after-a-merge](../how-to/after-a-merge.md)) (2026-11-13, the release; since 2026-11-14 the step
  is one command, `node tools/xp/keys.js <hub> --load`). Today it is a step by hand
  after every merge that changes `hubs/<hub>/content/questions.json` ([build-a-hub](../how-to/build-a-hub.md), "The answer
  keys"): until it's done a new question earns nothing and a re-keyed one is graded on its old key. Make it hard to
  forget: a check that compares the bank with the server's keys (an admin function that returns each hub's ids and
  versions, read by `tools/release/postcheck.js`), or a workflow on `main` that loads them (it would need the admin
  secret as a repository secret: Sam's call).
- [x] **Deploy Ask Timmy's function by itself when it changes** (2026-11-15: the After merge workflow deploys it and asks one question, [after-a-merge](../how-to/after-a-merge.md)) (2026-11-13, the release). `supabase/functions/timmy/site.json`
  is rebuilt from the About page in every PR that changes it, but the `timmy` Edge Function is deployed by hand
  ([ask-timmy](../reference/ask-timmy.md), "At the release", step 3; one command since 2026-11-14,
  `node tools/timmy/deploy.mjs`), so Timmy's site help lags the About page until
  someone deploys. Until this is automated, a session that changes `supabase/functions/timmy/` deploys it after the merge.
- [x] **A migration after the release** (2026-11-13; done: `migration_v63.sql`, #395) counts the **Bowling** trophy on the server (add `bowling`
  to the achievement kinds; until then it is kept on the device and shows no share of the class:
  [the bowling egg](done/2026-11-06-redesign-bowling-egg.md)). The first one after the release, `migration_v59.sql`
  (2026-11-16, [#381](https://github.com/smcmurry6-source/study-hubs/pull/381)), took Learn's context and the sections (the two lines ticked below); this one is still open.
- [x] **Sam's call: retire Perio's `q7-07`** (Sam: "retire it"; done in [#380](https://github.com/smcmurry6-source/study-hubs/pull/380)) (2026-11-15, the lessons audit; report #44, "too many details for a non-MC question"). A
  self-graded recall card (the final has none) on the immune changes smoking causes, which `q7-03` asks and statement 2 of `q7-N03`
  tests: the third ask that [the Perio bank audit](done/2026-11-15-perio-bank-audit.md)'s own rule retires ("a recall card was retired
  wherever it repeated a fact asked in a scored format"). With a yes: `q7-07 retired` in `tools/question-ids/perio.txt`, out of
  `questions.json` and out of the smoking topic's `ids` in every question that carries a copy of it, the build, and S7's High yield
  recorded again (its topic then counts 7 questions). Then resolve #44 with its reply.
- [x] **`sh_surface()` doesn't place the redesign's sections** (2026-11-15, the lessons audit; `sh_data_quality()`'s
  `unmapped_sections`): `compendium/drill` and `compendium/misses` (the bank's Daily drill and Yesterday's misses sets) and
  `more/stats`, `more/timmy`, `more/settings`, `more/place`, `more/menu`, `more/ideas`, `more/shop` all read as `other`, so the
  admin page's Insights undercounts the drill on Occlusion and Perio. Add them in the first migration after the release (the line
  above): the two sets as `drill`, `more/timmy` as `podcast`, the rest as a new `more`
  ([analytics-data-quality](../reference/analytics-data-quality.md)). Done in `migration_v59.sql`, with Learn and Flashcards
  as their own sections ([#381](https://github.com/smcmurry6-source/study-hubs/pull/381)).
- [x] **The redesign's bank doesn't send `bank:retry-shown`** (2026-11-15, the lessons audit; sent again from #391, with one waiting retry per question as on the old pages): `widget/hub-bank.js` tracks
  `bank:retry-right` and `-missed` when a missed question comes back a few cards later, but not when it is shown (the old pages did:
  20 people on 11-14, 3 on 11-15, all from old pages), so how many people a re-ask reaches can't be read. One `track()` where the
  retry card is put in the list, then the bundles.
- [x] **Sam's call: the hub trophies in the trophy case** (2026-11-13: "Each hub should get a shelf"; built in #359) (2026-11-13, from [the trophy case](done/2026-11-12-redesign-trophy-case-and-cards.md)).
  The 8 trophies each hub has (the mastery levels, every question answered, mock exams, the boss) aren't in the new case:
  they are behind its Leaderboards button, in the shared widget's panel. A shelf for them in the case, or leave them there?
- [x] **Heme & Endo Exam 2's retrospective and recap** (2026-11-13, from the release's PR #359): done on `main` by the
  lessons audit ([#361](https://github.com/smcmurry6-source/study-hubs/pull/361)): the retrospective is in `LESSONS.md` and
  the recap is on the dashboard.
- [x] **Recaps missing from Past hubs** (2026-11-13, Sam: "There are a lot of past hubs missing from the recap card"):
  **Heme & Endo Exam 2**'s went up with its retrospective ([#361](https://github.com/smcmurry6-source/study-hubs/pull/361));
  **Special Patient Care** gets none (Sam, 2026-11-14: "Dont worry about special patient care at all for a recap"). Hubs archived before recaps existed (GI Exam 1, Genetics, Fixed
  Pros and older) have no bank dump to draw one from: say so to Sam if he asks for them.
- [ ] **Learn: a typed answer** (2026-11-13, idea from making Learn "more like quizlet"): Quizlet's Learn ends on written
  questions. Ours ends on recall before the choices show (Sam's call 5, 2026-11-06), because a typed answer can't be
  graded against a bank question's choice. Only if Sam asks for it.
- [ ] **Flashcards: undo the last rating** (2026-11-13, same): not built, because a rating is paid and sent to the server
  at once; it needs the rating held back a few seconds first. Only if Sam asks for it.
- [ ] **Visiting from a hub's boards** (2026-11-13, [visiting](done/2026-11-12-redesign-visiting.md)): the leaderboards in a
  hub's own panel (`widget/v3.js`) don't open anyone's place yet (Sam, 2026-11-12: the dashboard's boards first).
- [ ] **Sound for the hand-off and the Dark Matter unlock**, only if the redesign ever gets a sound setting (it has none; the
  scenes are silent on purpose: [the journeys](done/2026-11-06-redesign-progression-journeys.md)).
- [x] **Special Patient Care's retrospective and audio** (2026-11-13, the lessons audit): ~~retrospective and recap~~ dropped (Sam,
  2026-11-14: "Dont worry about special patient care at all for a recap"); the whole hub, audio included, came off the site
  ([#361](https://github.com/smcmurry6-source/study-hubs/pull/361), [hub note](../hubs/special-patient-care.md)).

- [x] **The bank's page size** (2026-11-13, the lessons audit; [LESSONS.md](../../LESSONS.md)'s Heme & Endo Exam 2 retrospective: 47
  of its 61 bank users pressed "Show more" 287 times): Sam, 2026-11-14, "Show more questions in the question bank at a time": 100 a
  page in the single-file engines (`BANK_PAGE`, was 30), 50 in the redesign's bank (`PAGE`, was 20)
  ([#361](https://github.com/smcmurry6-source/study-hubs/pull/361)).
- [x] **Run `tools/data-fixes/2026-11-14-in-bennett.sql` in the Supabase SQL editor** (run 2026-11-15 with #370's after-merge steps, `tools/after-merge/run.js --fix`; the card now counts only the new choice's picks) (Sam approved it: "Run it", 2026-11-14). Until it
  runs, Occlusion's `in-bennett` card shows the old "Cusp height" picks beside the new choice. The connector's `execute_sql` asks
  for approval before a write, and that prompt timed out unanswered three times (11-14 and 11-15), so Sam runs it by hand. It sets
  choice 1's count to the new version's picks from `question_events` (a plain delete would also drop the picks made since the change).
- [x] **Numbering the questions in a bank set, Sam's call** (the same check-in asked for it; Sam's 11-14 answer covered only the page
  size): a number on each card of the current set, in the redesign's bank (`widget/hub-bank.js`) and the live engines. Sam, 2026-11-15:
  "Lets implement the numbering", then "intervals of 100", then "50/100/200/all": At a time in the panel, the bank in sets of that
  size, "Question 12 of 100" on every card of the bank, its sets and the mock. The single-file engines
  weren't touched: every hub on one is archived ([#373](https://github.com/smcmurry6-source/study-hubs/pull/373)).

- [ ] **Perio's page weight is near its budget** (2026-11-14, [#362](https://github.com/smcmurry6-source/study-hubs/pull/362)): `perf.js`
  measured the live Perio page at 1167 KB of its 1180 KB budget (`tools/release/budgets.json`) after Figs 6-8 (+38 KB gzipped), and its
  first paint warns at 1.6 s on the slow phone (budget 1.5 s; CI passed). The next figure or big content change needs room: trim
  what the anima blocks repeat (each figure's static SVG is drawn again by its live code), or ask Sam before raising the budget.
  **On the engine (the release, #359) it is the same story with other numbers:** 812 KB of its 830 KB budget with Figs 6-8
  in `content/figures.js` (178 KB by the load event; the figures load with Notes), first paint inside its budget.
  **2026-11-18:** 834 of 850 after the final's bank audit (BUG-176), then 864 of 885 with S6 taught (BUG-180, [#419](https://github.com/smcmurry6-source/study-hubs/pull/419));
  the [S6 diagrams](done/2026-11-18-perio-s6-diagrams.md) took none of it (still 864 of 885: `figures.js` loads with Notes, not on a Home
  visit; it is 157 KB gzipped with S6's five, was 121), so the next change to the notes, questions or hints needs room: trim first or ask Sam.

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
  16 ([the release](done/2026-11-06-redesign-release.md), "From phase 4, session 6"). Found 2026-11-13. Done with the release's About page
  (27, 16 secret).

- [x] Learn's answers are filed as context `other` because `migration_v54.sql`'s `record_answer_v2` doesn't list `learn` (v54 isn't
  changed without Sam's word). In the first migration after the release, add `learn` to its context list (the `case` in `sh_answer`),
  so the admin page can tell Learn's answers from the bank's (2026-11-12, [Learn and Flashcards](done/2026-11-06-redesign-learn-and-flashcards.md),
  [game-server](../reference/game-server.md)). Done in `migration_v59.sql` ([#381](https://github.com/smcmurry6-source/study-hubs/pull/381)).

- [ ] Ask Timmy's "What should I study tonight?" on the new dashboard reads each hub's progress from this device's saved state
  (`progressFrom` in `widget/ask.js`), so on a new or linked device it sees nothing until a hub page has synced the answers. Read the
  student's own answers from the server there instead (their own rows, like the v2 bootstrap), or say "open a hub first" when every
  hub's state is empty (2026-11-12, [Ask Timmy](done/2026-11-12-redesign-ask-timmy.md) part 2).

- [x] Class picks on each choice ignore question versions: `question_choices` (and `question_stats`) are keyed by position, so when
  an edit moves or rewrites choices, last week's percentages show beside a different choice until someone moves or clears the rows by
  hand (2026-11-04 evening lessons audit). Record the version with each pick (`record_choice`, `question_versions.v`) and read only the
  current one, as question health already does. Done (#408, migration_v66): the picks follow the version of a question's choices (`question_keys.cv`, its choices and key), and old versions' picks move to `question_choices_past`; `question_stats` (% right per question, not per choice) stays as it is.

- [ ] Anima figures on phones: at 390 px their in-drawing labels scale down to about 6-7 px. A plain bigger font for narrow screens clipped labels at the edges in about half the PCD Implants figures (tried 2026-11-04, reverted); it needs a per-figure phone layout (labels moved inside the drawing) or tap-to-zoom. Heme & Endo Exam 3's 22 (2026-11-17) mostly draw them at 10-15 px; its four L17 figures after the oocyte are the smallest (labels about 8 px on the timeline, implantation, estriol and breastfeeding figures). 
- [x] The site is near GitHub Pages' 1 GB cap: 960 MB on 2026-11-12, most of it narration (430 MB of it from archived hubs:
  Heme & Endo Exam 1, PCD Implants, MSK Exam 3 and 4, Special Patient Care, PCD Fixed Pros Exam 3). Ask Sam what can come down
  (for example archived hubs' mp3s, their pages falling back to the device voice) before adding more big files; the High yield
  narration waits on it ([task](done/2026-11-12-high-yield-narration.md)). Check whether the size is behind the slow publishes of
  11-06 and 11-10. Done 2026-11-12 ([#328](https://github.com/smcmurry6-source/study-hubs/pull/328)): Sam kept the bitrates and had the five archived hubs' audio
  taken off (958 → 589 MB), and every hub's at its archiving ([rule](../rules/archived-hubs-drop-their-audio.md),
  [next ones](2026-11-12-audio-off-at-archiving.md)). The publishes take 1-3 minutes at 958 MB; 11-10's timeout was a one-off.
- [ ] Retention, the part not built yet (approved 2026-11-04, [analytics-retention](../reference/analytics-retention.md)): before the school year ends (spring 2027), collapse `activity_hourly` / `activity_visits` older than the school year to hub × section × day with people counts and no ids, as one more step in `sh_retention_run`. **Since migration_v68 the wallet pays 100 crowns per hour of hub time from `activity_hourly`** (`sh_time_crowns`): before the collapse deletes a visitor's hours, keep what they paid (each visitor's capped ping total in a small table `sh_time_crowns` reads, or the crowns as a row), or balances drop. Also ask Sam about the two rows the question-health work proposed (`question_events`, `question_feedback`).
- [x] A hub's Home on a 320px-wide phone at the XX-Large text size scrolls sideways by about 40px (fixed in #391: the ring's caption drops under the ring when there's no room, the timeline's words wrap): the course timeline's rows (`.tl-what`) and the goal ring's caption (`.ring-cap`) don't wrap that narrow. Found 2026-11-13 while fixing BUG-143; not one of the sizes the smoke test checks (320px at the default size and 390px at the largest both fit).
- [x] **A medal won during a shop boost runs over the rest of it** (2026-11-17, seen in #394; done: `sh_boost_bump`, `migration_v63.sql`, #395): since `migration_v62.sql` a boost
  bought during a medal's 24 hours waits for them, but a medal won while a shop boost is running starts its 24 hours on top of
  it, and the boost's remaining time (up to 3 hours) doubles nothing (never more than 2x). The fix is in the medal function
  (`sh_medal_check`'s `insert into xp_boosts ... 'medal'`): move the unused part of a running or waiting shop boost to after the
  medal's 24 hours (end the running row now, add the rest after), with a test in `tools/release/xp.js` and the preview's medal.
- [x] **320px phone at XX-Large, two more spots** (2026-11-17, seen while fixing Home's sideways scroll; done: #397, BUG-161, which found
  both wider than this: the tabs at XX-Large on any phone, the hand-off scene too): the hub's tab bar labels
  (Home, Notes, Questions, More) run into each other, and the Dark Matter unlock scene (`widget/journeys.js`) cuts off its "Rank 7 of 7"
  line and its sentence at the right edge. Neither scrolls the page; both only at that size.
- [x] **CI back on the newest Ubuntu** (2026-11-18, found on #402; done: #407, Playwright 1.63.0 on `ubuntu-latest`, the a11y
  baseline re-recorded, the perf budgets unchanged because they pass): the workflows are pinned to `runs-on: ubuntu-24.04` because
  `ubuntu-latest` became Ubuntu 26.04, which Playwright 1.56.1 doesn't support. Before 24.04 is retired: upgrade Playwright in
  `.github/workflows/*.yml` (and `PLAYWRIGHT_PATH` setups) to one that supports 26.04, re-record the a11y and perf baselines
  (`node tools/release/a11y.js --update`, `perf.js`), check the smoke test and the device matrix, then go back to `ubuntu-latest`.
- [ ] **The workflows' actions off Node.js 20** (2026-11-18, seen in #407's After merge run): every run warns "Node.js 20 is
  deprecated" for `actions/checkout@v4` and `actions/setup-node@v4` (8 uses each in `.github/workflows/*.yml`) and runs them
  on Node 24 for now; `actions/upload-artifact@v4` (3) and `actions/github-script@v7` (2) are likely the same. Before GitHub
  drops Node 20 entirely: move each to the major version that runs on Node 24, and let CI run every job once ("Check hubs" and
  "Release tests" both run when a workflow changes).
- [ ] **Sam's call: Ask Timmy's first question after an idle hour** (2026-11-18, found while answering why Heme & Endo Exam 3 had 21
  identical questions): writing a hub's content to the API's cache is most of what students' questions cost (about $14 of their
  $20 from 11-14 to 11-18), and most of it is the first question on a hub after nobody asked for an hour (about $0.60 each; the
  cache lasts an hour). The deploys that broke the cache are fixed ([ask-timmy](../reference/ask-timmy.md), "Limits and money").
  What's left would mean sending less: for example only the exam facts, Exam Hints and the lecture the student is on, with the
  rest of the notes only when the question needs them. That changes what Timmy can answer, so it needs the eval ($6) and Sam's OK.
