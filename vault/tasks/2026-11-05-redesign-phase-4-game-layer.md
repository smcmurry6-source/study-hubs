---
type: task
status: in-progress
hub: widget
created: 2026-11-05
requested-by: Sam
due: 
waiting-on:
agent: Claude Code
pr: https://github.com/smcmurry6-source/study-hubs/pull/332
---

# Redesign phase 4: the game layer's presentation

## Goal

Put the ranks, trophies and celebrations on the design system without changing their model: drawn mastery medals and trophy icons in place of emoji and the ??? grid (secret trophies as a silhouette with a one-line riddle), the rank name in flat metal, the tier cutscene and the level, trophy and mock cards on the site's type with their motion kept, one "you" panel shared by the hub and the dashboard, the arcade lobby redrawn by hand with one game up front.

## Context

- The plan and Sam's decisions: [the redesign audit and plan](done/2026-11-05-redesign-audit-and-plan.md), section 4.
- Rules that matter most here: [preview-and-release-test](../rules/preview-and-release-test.md) (every phase is tier 2 or 3:
  preview link first, screenshots, the release suites, Sam's look), [about-page](../rules/about-page.md),
  [learner-data-privacy](../rules/learner-data-privacy.md), the taste skill in full (Sam, 2026-11-04).
- `widget/ranks.js`, `widget/rankup.js`, `widget/games.js`/`games.css`, each hub's skin, `widget/eggs.js` (pop-ups stay as they are: Sam).
- Timmy's HP model stays as it is (Sam, 2026-11-05), except that the shop's snacks and floss now restore HP (Sam, 2026-11-06).
- **Four more parts, agreed 2026-11-06 (Sam)**, each its own PR and art review, on top of the presentation work above:
  - **A**: [three journeys, more XP and the Dark Matter unlock](2026-11-06-redesign-progression-journeys.md) (the client side);
  - **B**: [Timmy's shop](2026-11-06-redesign-timmy-shop.md) (Shiny Gold Crowns, the rotating shop, rarity, snacks and floss, XP boosts,
    rare costumes);
  - **C**: [Timmy's place](2026-11-06-redesign-timmys-place.md) (the house card redrawn as a scene you build);
  - **D**: [the bowling egg](2026-11-06-redesign-bowling-egg.md).
  - **E** (Sam, 2026-11-12): [Ask Timmy](2026-11-12-redesign-ask-timmy.md), Timmy as every hub's study assistant. Its
    part 4, **everyone has Timmy** ("adopting timmy is no longer an option"), changes `widget/pet.js`: do it with parts B
    and C, or right after them, so it doesn't collide with their work on Timmy.
  Their server side is [phase 5](2026-11-05-redesign-phase-5-backend.md), part 3. This changes "without changing their
  model" in the goal: XP rules, the ladder, the house and HP change as those notes say.
- **Released with the rest** (Sam, 2026-11-06, [decisions](../decisions.md)): these widget files are shared with the
  live hubs, so the new look goes in files or styles only the new versions load (see
  [phase 1](done/2026-11-05-redesign-phase-1-hub-engine.md)), and the live hubs keep today's cards until
  [the release](2026-11-06-redesign-release.md).

## From here to the release (planned with Sam, 2026-11-12)

Sam answered every open call for what is left of this phase on 2026-11-12 ([decisions](../decisions.md)). Each session
below has a **build spec** in its own note, written so a fresh session can start without asking Sam anything, and each
spec ends with the prompt that starts it. One session each, in this order ([run-a-redesign-session](../how-to/run-a-redesign-session.md)):

| # | Session | Its spec | Needs first |
|---|---|---|---|
| 1 | **The shop's art**: the coin, snacks, boosts, rarity frames, the five undrawn outfits, the five rare costumes, and Timmy's door spot moved off the rank statue (BUG-089) | [the shop](2026-11-06-redesign-timmy-shop.md), "Build spec, session 1" | [#335](https://github.com/smcmurry6-source/study-hubs/pull/335) merged |
| 2 | **The shop's client** (part B): the shop, the balance, buying, snacks and HP, boosts, rare costumes | [the shop](2026-11-06-redesign-timmy-shop.md), "Build spec, session 2" | 1 |
| 3 | **Timmy everywhere** (part E's part 4): everyone has Timmy, and he wears what you put on, on the bar, at his place, in the classroom and on the stage | [Ask Timmy](2026-11-12-redesign-ask-timmy.md), "Build spec, part 4" | 2 (both edit `widget/pet.js`) |
| 4 | **Visiting**: a row on the new dashboard's boards opens that person's place | [visiting](2026-11-12-redesign-visiting.md) | 3 |
| 5 | **The bowling egg** (part D) | [the bowling egg](2026-11-06-redesign-bowling-egg.md), "Build spec" | 2 (it hooks into `widget/place.js`'s lane) |
| 6 | **The trophy case and the cards**: this note's original goal; Full Arch retired (Sam, 2026-11-12) | [the trophy case and the cards](2026-11-12-redesign-trophy-case-and-cards.md) | 5 (so the case lists the bowling trophy and the journey trophies once) |
| 7 | **Ask Timmy, part 2** (the chat) | [Ask Timmy](2026-11-12-redesign-ask-timmy.md), its code map; its prompt is at the end of that note | 3 |
| 8 | **The game layer's wiring** left by part A: the arcade's sessions, Timmy Time's minutes, the service worker's lists | [the wiring](2026-11-12-redesign-game-layer-wiring.md) | 6 |
| 9 | **Phase 5, part 2**: bundles, one stylesheet, the font, budgets lowered | [phase 5](2026-11-05-redesign-phase-5-backend.md) | every session that adds a file (1 to 8) |
| 10 | **The release** | [the release](2026-11-06-redesign-release.md) | all of the above, and Sam's look at the whole thing on its preview |

Beside any of them, because they touch other files: **Ask Timmy, part 3** (the admin page's Timmy tab, `review/`) and
**[Learn and Flashcards](2026-11-06-redesign-learn-and-flashcards.md)** (`widget/hub-bank.js`; its note wants a server
part in the pending migration, which is Sam's call at the start of that session). After the release:
[the later journeys' rank sets](2026-11-12-redesign-later-journeys-rank-sets.md).

**No date** (Sam, 2026-11-06, kept on 2026-11-12): one release with everything. Heme & Endo Exam 2's exam is Nov 13,
Occlusion's final Nov 16 and Perio's Nov 19 (`HUBS` in `index.html`); ten sessions will not land by then, so the
release switches the dashboard and whichever hub is live at that point, and a hub whose exam has passed keeps its old
page ([the release](2026-11-06-redesign-release.md), Context).

### For every session above

These hold for each spec; a spec only adds to them.

- **Start** from a fresh `origin/main`. Read `AGENTS.md`, this section, the spec and the notes it links. Grep the big
  files (`widget/hub.js`, `widget/v3.js`, `widget/pet.js`, `widget/dash.js`, `migration_v54.sql`), never read them whole.
  No subagents.
- **Nothing students see changes before the release.** New code goes in files only the redesign's pages load
  (`hubs/<id>/next/`, `next/`), or runs only there (the engine, `data-game="v2"` on the widget's tag, a `mount` option
  the new pages pass). `widget/pet.js`, `eggs.js`, `ranks.js`, `rankup.js`, `games.js`, `podcast.js` and `v3.js` are
  shared with the live hubs and the live dashboard: a change there must leave a live page behaving exactly as it does
  today, and the smoke test on every hub is the proof. What the old pages do after the release doesn't matter (Sam,
  2026-11-12: "Old pages arent accessible so they dont matter").
- **`migration_v54.sql` and `migration_v55.sql` are not applied and not changed.** Where the client and the server as
  written disagree, the client follows the server; the known cases and how each is worked around are in
  [game-server](../reference/game-server.md) ("Where the client works around the server as written"). A new one: stop
  and tell Sam, don't change the migration.
- **Request budgets** (`tools/release/budgets.json`, measured by `node tools/release/perf.js`): the new Occlusion is at
  20 of 21 requests, the new Heme & Endo Exam 2 at 20 of 22, the new Perio at 18 of 21, the new dashboard at its 30.
  **Nothing new loads with a page**: fetch a new file the first time it is used (`loadScript` in the engine, the way
  `HX.morePlace` fetches `widget/place.js`; on the dashboard the way `placeStart` waits for the first scroll, tap or
  key), and make the smoke test fail if it loads with a page. No budget is raised.
- **The preview's made-up data**: `tools/preview/runtime/preview.js` answers every database call in `rpc()`'s switch
  from the six test accounts (`new`, `returning`, `high-xp`, `missed`, `archived`, `admin`; `?persona=`, `?xp=`,
  `?now=`). A call a session adds gets its case there, shaped exactly as the migration returns it. Never a production
  row, never the real admin secret.
- **No hosted preview** (Sam, 2026-11-12, until the release's own). Use the change in a scripted browser on the
  preview's made-up data (`node tools/preview/serve.js`), on a phone (390 px) and a laptop (1280 px), light and dark,
  reduced motion too. Sam looks, doesn't test: send screenshots (`deviceScaleFactor: 2`), and a short recording for
  anything that moves. **New art goes to Sam as a contact sheet, light and dark, and gets a yes before it goes into
  the engine.**
- **Clicks never record words**: every button in new UI carries a fixed `data-*` name (as `data-tp` in the place and
  `data-shi` on the idea board), and the smoke test checks that none is missing. Names, item names and typed text are
  drawn as text, never as markup.
- **Tracking**: a new feature event gets its row in [event-taxonomy](../reference/event-taxonomy.md) and its line in
  [analytics-retention](../reference/analytics-retention.md) in the same PR; never an item's name, a person's name or
  typed text in a kind ([learner-data-privacy](../rules/learner-data-privacy.md)).
- **Tests**: while building, what you touched (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, the smoke test,
  `node tools/release/xp.js` when the client meets the server); once on the finished code, `node tools/release/run.js`
  ([long-tests-once](../rules/long-tests-once.md)). The spec lists the checks to add.
- **The About page and `tools/podcast/LORE.md`'s student-facing lines land at the release**: write them into
  [the release note](2026-11-06-redesign-release.md)'s drafts ("From phase 4, ..."), as parts A and C did, and fix any
  draft there that your session makes untrue.
- **Write back** in the same PR: the spec's Done when ticked, a hand-off entry in this note's Log (what was built, what
  the next session can call), [decisions](../decisions.md) for anything Sam said, the bug log, `DEPLOY_NOTES.md`. Then
  a draft PR with a test report; Sam's "merge" merges it.

## Done when

- [x] First, before parts A-D grow it: `widget/hub.js` split into its core and the parts each session changes (the
  bank and study toggle, rewards and cards, Timmy and his place), loaded as now, with no behavior change and the
  smoke, a11y and perf suites passing ([run-a-redesign-session](../how-to/run-a-redesign-session.md), step 4) ([#330](https://github.com/smcmurry6-source/study-hubs/pull/330), 2026-11-12)
- [ ] The trophy case and the cards on the design system ([its note](2026-11-12-redesign-trophy-case-and-cards.md)),
      reviewed by Sam in a recording from a scripted browser on made-up data, reduced motion too, and once more on the
      release's own preview (Sam, 2026-11-12: no hosted preview before that one)
- [ ] Part A, B, C and D done as their notes say (each note's "Done when"), and part E's "everyone has Timmy"
- [ ] Visiting from the new dashboard's boards ([its note](2026-11-12-redesign-visiting.md); Sam, 2026-11-12: in the release)
- [x] The arcade lobby of each live hub redrawn; game mechanics unchanged (done outside this phase: Occlusion's in
      [phase 1](done/2026-11-05-redesign-phase-1-hub-engine.md), Heme & Endo Exam 2's and Perio's in
      [phase 2](2026-11-05-redesign-phase-2-live-hubs.md), Perio's drawings approved 2026-11-11; the arcade's part of
      the game layer is in [the wiring](2026-11-12-redesign-game-layer-wiring.md))
- [ ] The About page's trophy and rank entries updated
- [ ] CI passes (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`, `node tools/release/run.js`)
- [ ] Preview link, phone and laptop screenshots, and Sam's look, then Sam's "merge"
- [ ] Vault written back (hub notes, decisions, `DEPLOY_NOTES.md`, the About page, this note's Outcome)

## Log

- 2026-11-05: written from the agreed plan.
- 2026-11-06: parts A-D added (Sam's calls on the journeys, the shop, Timmy's place and the bowling egg).
- 2026-11-06: part C's art drawn on the design page for Sam's look ([Timmy's place](2026-11-06-redesign-timmys-place.md), its log).
- 2026-11-12 (Claude Code, **the split; hand-off**). `widget/hub.js` (2,064 lines, 188 KB, one closure) is now four
  files, in [#330](https://github.com/smcmurry6-source/study-hubs/pull/330). Nothing students see changes, migration_v54 is still pending, and no other step of this note is started.
  - **The files**, loaded by each new hub's page as four deferred scripts in this order:
    - `widget/hub-rewards.js` (17 KB): the one answer path (`recordAnswer`, `xpFor`, the daily goal, the streak,
      `achievements`), the rank (`RANK`, `rankName`, `rankXp`, `rankArt`, the `sh:rank-profile` listener), the bar's
      meters (`paintMeters`), `reward` with the flying XP, the ring of teeth, the Today panel, the session recap.
    - `widget/hub-timmy.js` (2 KB): `say`, `petHp`, `timmyReact` (his cheer or flinch on the bar, taken out of
      `reward`) and `petFromBadges` (loading him when he was adopted on another device, taken out of the rank
      listener). Small on purpose: it is where parts B and C put the shop and Timmy's place.
    - `widget/hub-bank.js` (62 KB): the question card (`card`, `wireCard`, `result`, `whyHTML`, `classPicks`), the
      bank with its panel and presets (`drawQuestions`, `filtered`, `SETS`, `fill`, `page`) and the mock.
    - `widget/hub.js` (116 KB), the core, last: helpers, drawings, state, content, the frame, routing, Home, Notes,
      Follow along, More (Timmy Time's page stays here: it is the podcast's player), the shared widget's hooks, boot.
  - **How they share names** (written at the top and the end of `hub.js`, and at the top of each part): a part
    registers a function in `window.SH_HUB_PARTS`; the core runs the three, in the order rewards, Timmy, bank, just
    before it boots, and hands each one `HX`. A part takes the core's helpers and lookups under their own names in the
    `var` list at its top (`esc`, `$`, `STATE`, `QBY`); what the core replaces after the page loads it reads as
    `HX.CORE`, `HX.QS`, `HX.LECS`, `HX.IDX`, `HX.FIG`, `HX.view`; what a part has for the other files it puts on `HX`
    at its end, and they call it as `HX.card(...)`. To use one more of the core's names in a part: add it to the `HX`
    object in `hub.js` (most helpers are already there) and to the part's list. A name used but not taken is an error
    only when that line runs, so click the new thing in the smoke test.
  - **Every place the engine is listed**: the three pages' script tags, `tools/ci/syntax.js`, the smoke test's `ENGINE`
    (it fails a page that doesn't load the four, deferred, in order), the service worker's list in
    [the release note](2026-11-06-redesign-release.md) ("The engine's files"), [repo-map](../reference/repo-map.md). The
    preview copies `widget/` whole, so it needed nothing.
  - **Request budgets**: three more requests a page. Occlusion 20 of 21, Heme & Endo Exam 2 20 of 22, Perio 18 of 21:
    under, not raised. **A new file that loads with the page doesn't fit on Occlusion more than once**: load anything
    new when it is first used (`loadScript`), or put it in the part it belongs to.
  - **Checked**: a parser moved the code and confirmed that every name in the four files resolves, each of the 119
    shared names is defined and no function was lost or doubled. The same scripted visit (both test accounts, phone
    and laptop with reduced motion, every view, every page in More, every question format, the sets, the mock, the
    widget's hooks, and Timmy's cheer, "Goal met!" and loading) on `main`'s copy and on the split, on the preview's
    made-up data with the clock and the shuffles fixed: identical markup, saved state and events at all 368 steps,
    once what differs between two runs of `main` itself was left out (the preview's own label, random ids, animated
    figures' frames, the made-up live count, Timmy's idle chatter). One earlier run of the split drew the rank badge
    one time fewer in one of its six visits, which changes an internal id and nothing shown; two repeats matched
    `main` exactly, so it reads as load timing in the shared widget, not the split. The release suites: `node
    tools/release/run.js` once on the finished code, all 14 passing (accessibility run by itself with `AXE_CORE_PATH`,
    since this machine has no axe-core): the smoke test on every hub, accessibility at 37 screens with nothing new,
    the performance budgets, the device matrix, the preview-safety and database suites.
  - **The next session starts from**: this entry and the part it works in. **Part A**
    ([journeys](2026-11-06-redesign-progression-journeys.md)): `widget/hub-rewards.js` (`xpFor`, `recordAnswer`, the
    rank functions, `paintMeters`, `reward`, the recap), with `widget/ranks.js`, `rankup.js` and `pet.js` as its note
    says. **Parts B and C with the bowling egg** ([shop](2026-11-06-redesign-timmy-shop.md),
    [place](2026-11-06-redesign-timmys-place.md), [egg](2026-11-06-redesign-bowling-egg.md)): `widget/hub-timmy.js` for
    what the engine shows of Timmy, `widget/pet.js` for the renderer; a new page in More also needs its row in the
    core's `MORE` list and its entry in `renderMore`'s map (call the part's function as `HX.<name>`).
    [Learn and Flashcards](2026-11-06-redesign-learn-and-flashcards.md): `widget/hub-bank.js`.
- 2026-11-12: [#330](https://github.com/smcmurry6-source/study-hubs/pull/330) merged as `56a1fd9`, and `node tools/release/postcheck.js` passed (7 of 7 changed files live and identical to `main`; the dashboard and the three live hubs open with no errors).
- 2026-11-12 (Claude Code, **part A, the journeys' client; hand-off**, [#332](https://github.com/smcmurry6-source/study-hubs/pull/332);
  the split was [#330](https://github.com/smcmurry6-source/study-hubs/pull/330)). What was built, the calls Sam
  answered and the five points where the client meets the server are in [the journeys note](2026-11-06-redesign-progression-journeys.md)
  (its Log and "Open calls"). Nothing students see changes, and migration_v54 is still pending.
  - **What every later part can use**:
    - `window.shGame` (`widget/v3.js`, only where the page's widget tag has `data-game="v2"`, which the engine writes):
      `v2()` (true once the database answered with a v2 profile), `boost()` (the running double XP or null),
      `startSession(kind, game)` and `finishSession(id, score, total)` (a promise of the session's id, then of what
      the finish paid; the finish waits for that session's answers to arrive). In the engine: `HX.gameOn()`, `HX.boost()`.
    - **An answer under the game layer is `HX.recordAnswer(qid, lec, right, ctx, choice, picks, { order, session })`**:
      give a one-choice question its pick index, select-all its picks, a sequence its order. The server's reply comes
      as the `sh:answer-paid` event (`{ qid, ctx, session, res }`; `res` is `record_answer_v2`'s answer); a finished
      session's as `sh:session-paid`. `widget/hub-rewards.js` already turns both into the pill's total, today's XP and
      a toast, so a part that pays something new (a purchase, a game) only needs its own line there.
    - **Ranks past the Handpiece**: `shRanks.nameOf(profile)`, `artOf(journey, tier, px, opt)`, `miniOf(journey, tier,
      level)`, `legacy(profile)` (the Handpiece's own rank, for anything that reads tiers 0 to 6), `needJourneyArt(cb)`
      and `journeys(cb)` (load the drawings, or the scenes too, on first use). `HX.rankArt(px)` draws your medallion;
      any element with `data-rankart="<px>"` is repainted with it.
    - **Scenes**: `shJourneys.handoff(d, done)`, `dark(d, done)`, `road(profile)`, `still(kind, d)`; ranks.js queues a
      scene behind the rank-up cards with `rankup.js`'s new `scene(run)`. A full-screen moment for the shop or the
      place can be queued the same way so two never overlap.
    - The preview answers the game layer's calls from made-up data (`tools/preview/runtime/preview.js`: `answer2`,
      `rank2`, sessions, the unlock mark) and takes `?xp=<n>`.
  - **Request budgets are where the split left them** (Occlusion 20 of 21, Heme & Endo Exam 2 20 of 22, Perio 18 of
    21): the journeys' two files load on first use. The same goes for anything parts B to D add.
  - **Parts B and C with the bowling egg start from**: this entry; `widget/hub-timmy.js` (what the engine shows of
    Timmy) and `widget/pet.js` (the renderer). For **the shop** ([note](2026-11-06-redesign-timmy-shop.md)): the
    bootstrap already carries `shop` when the game layer is on (`window.shBootstrap.data.shop`); a shop boost comes back
    in the profile's `boost` and the pill's chip shows it with no more work (`src` says which kind); a rank-up's +20
    crowns is the server's. For **Timmy's place** ([note](2026-11-06-redesign-timmys-place.md)): the old house card
    reads `sh_rank_tier`, which stays at 6 past 125,000 (`legacy()`), so the journey's pieces (the ModuPro on the porch,
    Timmy in loupes, the rank sets for the later journeys) are drawn from the v2 profile's `journey` and `gtier`
    (0 to 20), which `sh:rank-profile` hands every listener. For **the bowling egg** ([note](2026-11-06-redesign-bowling-egg.md)):
    nothing here is in its way; if it pays XP it needs a session or an award on the server, which would be a change to
    the migration, so ask Sam first.
  - **Still open in this note**: parts B, C and D, the arcade lobby, the cards' and the cutscene's recording on a
    preview, the About page (drafted in [the release note](2026-11-06-redesign-release.md), "From phase 4, part A").
- 2026-11-12: [#332](https://github.com/smcmurry6-source/study-hubs/pull/332) merged as `048bcdb`, and `node tools/release/postcheck.js` passed (10 of 10 changed files live and identical to `main`; the dashboard and the three live hubs open with no errors).
- 2026-11-12 (Claude Code): **part C is built: Timmy's place as a real client**
  ([#335](https://github.com/smcmurry6-source/study-hubs/pull/335)); what it is and what it does is in
  [the place's note](2026-11-06-redesign-timmys-place.md) (its Log). Nothing students see changes: only the new pages
  load it, `widget/pet.js` is untouched, migration_v54 is still not applied and wasn't changed. Flame levels 4 and 5
  (blue from 10 days, Dark Matter from 30) are in the new hubs' and the new dashboard's flame.
  - **Request budgets are unchanged**: the new hubs' pages 20, 20 and 18 of 21, 22 and 21, the new dashboard 30 of
    30. The place's renderer, kit and set files all load on first use; the smoke test fails if one loads with a page.
  - **Part B (the shop) starts from**: `window.shPlace` (`widget/place.js`): `setup({ shop })` takes the bootstrap's
    `shop` or a fresh `get_my_shop` answer (call it again after a purchase and `repaint()`), `open({ customize: true })`
    opens the customizer, and `state()` says what's owned and equipped. The customizer lists what `shop.inventory`
    owns and nothing else; its "Get more in the shop" link is left out until there is a shop to open (the drawer's
    foot in `side()`, beside "Surprise me"). The kit's thumbnails (`SH_PLACE.thumb(kind, key)`, `setInfo(id)` for a
    set piece's name, rarity and price) and `dress()` are what the shop's cards need; load the kit with
    `shPlace.ready()`. The preview's `shop2()` already carries a wallet and empty shelves to fill
    (`tools/preview/runtime/preview.js`). Still the shop's: `buy_item`, the balance on the "you" panel, snacks and
    their HP (`get_pet_days_v2`'s `hp`, which `widget/pet.js` doesn't read yet), the rare costumes' art, and **the
    five everyday outfits with no drawing** ([task](2026-11-12-five-outfits-without-a-drawing.md), Sam's call).
  - **Part D (the bowling egg) starts from**: the bowling lane is a yard piece (`bowling-lane`, wide: the side yard
    and the front corner), drawn by the kit with its own tap surprise (`EGGS.lane`: it rolls a mint, "Strike! Well,
    close."). In the full view every tappable thing is a `.tp-egg[data-egg]` inside the stage's shadow root and
    `playEgg(n)` in `widget/place.js` plays it; a clip for the lane hooks in there. Whether someone has the lane out
    is `shPlace.state().equipped["yard-side"] === "bowling-lane"`. If the egg pays XP it needs something on the
    server, which is a change to the migration: ask Sam first.
  - **Visiting and "everyone has Timmy" start from**: `shPlace.open({ place })` draws what `get_place` returns (the
    name in the title, no HP, Timmy always well, no customizer); nothing calls it yet. Timmy on a hub's bar doesn't
    wear his place's outfit: that is pet.js's, for "everyone has Timmy" ([the release](2026-11-06-redesign-release.md),
    "From phase 4, part C").
  - **Still open in this note**: parts B and D, part E, the arcade lobby, the recording on a preview, the About page.
- 2026-11-12: [#335](https://github.com/smcmurry6-source/study-hubs/pull/335) merged as `a529c0f` (Sam: "Merge"; `main` with Occlusion L10, #336, was brought into the branch first, which moved the place's three bug rows up one: BUG-088 the card's name, BUG-089 the statue, BUG-090 the five outfits), and `node tools/release/postcheck.js` passed (23 of 23 changed files live and identical to `main`; the dashboard and the live hubs open with no errors).
- 2026-11-12 (Claude Code, **planning only, no code**): what is left of this phase turned into build specs. Sam
  answered one list of 23 calls ([decisions](../decisions.md)); the order, what holds for every session and the link to
  each spec are in "From here to the release" above. Found while reading: this note's original goal (the trophy case
  and the cards) was never built, so it has [its own note](2026-11-12-redesign-trophy-case-and-cards.md) now; visiting
  had no session ([its note](2026-11-12-redesign-visiting.md)); the bowling egg's eight clips were already drawn on
  [#291](https://github.com/smcmurry6-source/study-hubs/pull/291) and are carried over, not redrawn; and the server
  refuses a new trophy kind as written, so the bowling trophy is kept on the device until the first migration after
  the release ([game-server](../reference/game-server.md)). The arcade lobby box is ticked: phases 1 and 2 did it.
  **Next: session 1, the shop's art.**
- 2026-11-12 (Claude Code), **session 1, the shop's art**
  ([#339](https://github.com/smcmurry6-source/study-hubs/pull/339)). Art only: no client code, nothing students
  see, `migration_v54.sql` unchanged (nothing disagreed with it). **Hand-off for session 2**: "What session 1 built"
  in [the shop's note](2026-11-06-redesign-timmy-shop.md) (read it before the spec). In short:
  - new `widget/hub-art/shop.js`, `window.SH_SHOP_ART` (from `tools/figures/site/shop.mjs`): `coin(px)`,
    `coinBody(small)`, `thumb(id)` for the four snacks and two boosts, `frame(rarity)`, `RARITIES`, `ITEMS`, `CSS`.
    The frames and the coin left the place's kit (`SH_PLACE.frame`, `.coin` and `.RARITIES` are gone; `.burst` stays);
  - the ten outfits are `SH_PLACE.OUTFITS` entries keyed by the shop's id, a costume marked `costume: true`; four
    are on `NO_LOUPES` (safety glasses, pirate, astronaut, Captain Enamel);
  - Timmy's door spot moved in all 22 homes (BUG-089 closed), with the left yard spot, the path's lamp and nine
    statues; BUG-090 closed; BUG-091 opened (a tall piece right of the path now stands in front of Timmy's gum at
    the door: Sam's call);
  - sizes, compressed: the kit 77.1 to 80.6 KB, `outfits.js` 29.7 to 33.6 KB, `shop.js` 7.9 KB, none loaded with a
    page; `tools/release/xp.js` 358 checks; `widget/hub-art/shop.js` is in `tools/ci/syntax.js`'s list. Session 2's
    smoke test checks that it never loads with a page (its spec); the service worker's lists are session 8's.
  **Next: session 2, the shop's client.**

## Outcome

## Opening prompts

Each session's prompt is at the end of its own note; in order:
1 and 2, [the shop](2026-11-06-redesign-timmy-shop.md) (the art, then the client) ·
3, [Ask Timmy](2026-11-12-redesign-ask-timmy.md) (part 4, Timmy everywhere) ·
4, [visiting](2026-11-12-redesign-visiting.md) ·
5, [the bowling egg](2026-11-06-redesign-bowling-egg.md) ·
6, [the trophy case and the cards](2026-11-12-redesign-trophy-case-and-cards.md) ·
7, [Ask Timmy](2026-11-12-redesign-ask-timmy.md) (part 2, the chat) ·
8, [the wiring](2026-11-12-redesign-game-layer-wiring.md) ·
9, [phase 5](2026-11-05-redesign-phase-5-backend.md) (part 2) ·
10, the release:

> Work in smcmurry6-source/study-hubs. Read `AGENTS.md`, then `RELEASE_TEST_PLAN.md` and
> `vault/tasks/2026-11-06-redesign-release.md` (its Done when, and every "From ..." draft). Before anything else,
> check that each session in "From here to the release" in `vault/tasks/2026-11-05-redesign-phase-4-game-layer.md`
> is merged, and tell me what isn't. Then ask me which hubs are live and get switched, and whether I want the
> preview now. Nothing is applied, deployed or merged before I say so. Grep the big files, never read them whole.
> No subagents.
