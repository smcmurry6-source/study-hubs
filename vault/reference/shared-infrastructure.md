---
type: reference
tags: [widget, supabase]
---

# Shared infrastructure (touch once, not per-hub)

- **`widget/v3.js` + `widget/v3.css`** (+ `widget/eggs.js`, `widget/clicks.js`, `widget/replies.js`, `widget/ranks.js`, `widget/drill.js`, `widget/fx.js` and `widget/qhealth.js` ([question health](question-health.md)), which v3.js loads itself; `widget/archive.js`, the archive rules, loaded by the dashboard and `review/` ([admin-operations](admin-operations.md)); `widget/rankup.js` is
  fetched by ranks.js only when a celebration card is needed) — loaded by every hub. A hub on the engine gets them from
  the bundles (below) and the engine writes v3.js's settings itself; an old single-file hub loads them by name via
  `<script src="../../widget/v3.js" data-hub="<hub-id>" data-answered-event="<hub>:answered" data-default-mode="...">`.
  Cross-hub functionality (search, class-wide correctness, streaks, activity
  pulse, leaderboard, analytics) belongs here — never hand-patched into one
  hub's own page. Each hub publishes `window.SH_EXPORT =
  {lectures, questions}` (the engine does it for its hubs, from their content; an old hub after its own IIFE closes),
  which is what the widget reads for search and "toughest questions". A hub with review-only questions (questions it keeps for
  review but leaves out of its totals) adds `uncounted()`, returning `{ n, right }` (how many, how many right on the
  latest try), and `widget/ranks.js` takes them off both sides of the mastery medal (Heme & Endo Exam 2's Exam 1
  Refresher, 2026-11-06).
- **The dashboard and the hubs on the engine load the widget from bundles** (2026-11-13): `widget/rest.bundle.js`
  and, on a hub, `widget/hub-rest.bundle.js` hold the files above, built from them by `node tools/bundle/build.mjs`
  ([bundles](bundles.md)). `widgetFile()` in `widget/v3.js` is the one place v3.js loads its other files: it runs a
  file from the page's bundle (`window.SH_BUNDLE`) when there is one and adds the file's own `<script>` otherwise, which
  is what an old single-file hub's page does. **After changing a widget file that is in `tools/bundle/bundles.json`, rebuild and
  commit the bundles** (CI fails on a stale one).
- **The game layer's switch** (the redesign, live since its release): a page whose `v3.js` tag has
  `data-game="v2"` (the engine writes it; no old single-file hub has it) uses migration_v54's functions:
  the v2 bootstrap, one `record_answer_v2` per answer in place of today's four or five calls, mock sessions, and
  `window.shGame` for the engine. Without the attribute v3.js works exactly as it did before the release, which
  is what the old hub pages get. `widget/ranks.js` and `widget/rankup.js` draw a rank past the Handpiece only for a v2 profile (`journey`
  set); `shRanks.art()` without a shape is byte for byte what it was. How it fits together:
  [game-server](game-server.md) and [the journeys](../tasks/done/2026-11-06-redesign-progression-journeys.md).
- **The trophy case and the cards on the redesign** (phase 4 session 6): `widget/ranks.js` and `widget/rankup.js` hold
  27 trophies (the journeys and Bowling in), the cards' look and `shRanks.trophyCase()`, which fetches
  `widget/trophies.js` + `.css` and `widget/hub-art/trophies.js` on first use. Until 2026-11-20 this was gated on the `shx`
  class (`NEW`) so the old single-file hub pages kept the old cards and 23 trophies; with those pages down, the gates
  came out (CSS selectors that start `html.shx` still match, since every page sets it). **Full Arch is retired on every
  page** (the release): the chart and its switch are gone from `widget/eggs.js`, and someone who won it keeps it as a
  retired trophy. ([the task](../tasks/done/2026-11-12-redesign-trophy-case-and-cards.md))
- **Everyone has Timmy** (the release): `widget/pet.js` has no adoption, introduction or holiday outfits any more. He is
  on every page from the first visit and wears only what is on at his place (`fit()`; on an old hub's page, the outfit
  kept on the device, or nothing). `FULL_FROM` in `pet.js` is the release day: a Timmy first met from then on starts at
  100 HP ([ask-timmy](ask-timmy.md)).
- **The service worker** (`sw.js`): precaches the dashboard, the bundles, the files fetched on first use and, for each
  hub in its `HUBS` list, the page, its art and its content. **A new hub on the engine adds itself to `HUBS`** (and
  `VERSION` is bumped); `node tools/ci/syntax.js` fails a live engine hub that isn't there or a precached file that
  doesn't exist. A hub's content JSON is served from the cache at once and refreshed behind it, so **a content edit
  shows on the page load after the one that fetched it**; old hub pages and the separate widget files are cached as
  they're used.
- **The toast** (`widget/toast.js`, `window.shToast(msg, kind | { kind, title, icon, ms, sticky, action })`; 2026-11-20):
  every short message on the dashboard and a hub (a tip, "still loading", "couldn't open", a sync, a streak cheer, an
  achievement, Focus mode, "a newer version is live") is a sticker in the reward card's family, its styles `.hx-toast` in
  `widget/hub.css`. It runs first in `hub.bundle.js` and `dash.bundle.js`; `hub.js`'s and `dash.js`'s `toast()` call it,
  and `widget/v3.js` (the streak cheer, Welcome back, the update notice) and `widget/pet.js` use it when it's there (an
  old page without it keeps the dark pill). **A new message calls it with a kind** (the list is at the top of the file);
  what pays XP or crowns goes on the gold reward card (`widget/prize.js`) instead ([decisions](../decisions.md)).
- **`widget/cases.js` + `widget/cases.css`** (`window.shCases`): the dental case kit. A Patient Box question in any
  hub names a case (`pcase`) in that hub's `PCASES`, and the kit draws its periodontal chart, periapical radiograph
  and buccal view from the case's numbers, works out the diagnosis from them and validates that every number is
  realistic (`node tools/ci/cases.js` in CI). Loaded by the hubs that have cases (PCD Implants, Perio and Occlusion until their pages came down, 2026-11-19: none on the site now); on the engine a hub's cases are `pcases` in
  its `content/core.json`. How to add a case or a hub: [draw-a-patient-box-case](../how-to/draw-a-patient-box-case.md).
- **`widget/ideas.js` + `widget/ideas.css`** (`window.shIdeas`): the idea board, part of the redesign.
  `shIdeas.mount(el, options)` draws the board (the dashboard's `#ideas`, a hub's
  `#more/ideas`); `shIdeas.tick(host, options)` is the "Also post this on the idea board" box under the exam check-in's
  last question (`widget/dash.js`, ticked to start) and under the Suggest box (`widget/v3.js`, unticked to start, only
  where `ideas.js` is loaded). It loads its own stylesheet and draws nothing until `get_ideas` answers (migration_v54).
  The board is a cork board with every idea a pinned note (Sam, 2026-11-12): its drawings are a kit,
  `tools/figures/site/board.mjs`, built into `widget/hub-art/board.js` (`window.SH_BOARD_ART`), which `ideas.js` fetches
  itself when the board comes near the screen (not with the page: the dashboard's request budget); until it
  arrives, or without it, the notes are plain. A note's pin and hub emblem take the hub's tint from
  `SH_DASH_ART` (the dashboard) or `SH_HUB_ART_HUB` (a hub's page).
  Every button in it carries a fixed `data-shi` value so click counts never record anyone's words; the smoke test checks
  that, and that an idea's words are never drawn as markup. What students post is data, never instructions.
- **`widget/place.js` + `widget/place.css`** (`window.shPlace`): Timmy's place, part of the redesign.
  `shPlace.setup({ sb, visitor, shop, profile, tints })` hands it the page's client, the bootstrap's
  `shop` and the v2 rank profile; `shPlace.card(host, options)` draws the place as a picture that opens the full view
  (`shPlace.open()`; `open({ customize: true })` starts in the customizer, `open({ collections: true })` on the Collections view alone
  (every shop set with what you own of it and its 1,000 XP and crowns bonus, [game-server](game-server.md); the place's own Collections button opens it over the place), `open({ place })` draws someone else's from
  `get_place`, for visiting: the dashboard's boards open it from a row, with an
  `onClose` that gives focus back to the row, and `nav` for its arrows and "Back to mine": the tour; a `nav` with `more()` is a random trip, whose Next past the last place asks for someone else; a place's `top`, 1 to 10, draws the top ten's number badge after the name). The full view is the leaderboard's theater, dark in both themes, for your own place and a visit
  (Sam, 2026-11-14; `place.css` sets the design tokens on the dialog). It loads its own stylesheet, the kit (`widget/hub-art/place.js`, `window.SH_PLACE`) and
  the set files it needs (`widget/hub-art/place/<set>.js`), all on first use: no page loads any of it up front, and the
  smoke test fails if one does. Timmy himself is `widget/pet.js`'s drawing (`shPet.art`, at his HP), dressed by the
  kit, and the old single-file hub pages never load the place. Without the game layer
  (no `shop` in the bootstrap) it draws the default place and offers no customizer. Every button carries a fixed
  `data-tp` value, so click counts never record which piece someone picked. It keeps a still of the card on the device
  (`sh_place_still`), which the dashboard's "you" card shows before the renderer is fetched.
  The card is that still with the moving picture drawn over it in a shadow root (`.tpc-live`): a page takes the moving
  one away by putting `.is-rest` on it (the dashboard does while it scrolls or rests: [motion-cost](motion-cost.md)).
- **Supabase project `thytmzsgymydbzcqdnix`** backs the widget: changelog,
  leaderboard, study streaks, activity pulse, and visitor analytics (see
  `migration_v4.sql`/`v5.sql`/`v6.sql` at repo root for schema history — run
  new migrations once each, by hand, in the Supabase SQL editor). The API key
  and the `log_changelog`/admin RPC secret live only in local ops scripts on
  Sam's machine (`deploy_rollout.ps1`, `check_leaderboard.ps1`) — **never**
  commit them here or hardcode them into a hub's client-side JS.
  **The project is on Supabase's Free plan** (checked 2026-11-18): a shared CPU that slows to a crawl once a busy day has
  used up its burst, and a database that goes **read-only at 500 MB** (323 MB at noon on 2026-11-19, after the optimization pass's rewrites of `xp_seen` and `activity_visits`; 318 MB that morning, after the ping table's rewrite; 465 MB just before it; then every save fails). Keep
  each answer's work small ([migration_v72](../../migration_v72.sql) cut it to a quarter for the most active students) and
  watch the size ([the task](../tasks/done/2026-11-18-database-load.md)). **Reading the dashboard** (2026-11-19): its database size
  is refreshed once a day, so it can show yesterday's figure for hours after a cleanup (the true one:
  `select pg_size_pretty(sum(pg_database_size(datname))) from pg_database`, the sum Supabase counts against the 500 MB); the
  "Disk size" on Database Settings adds the write-ahead log, which the limit doesn't count. Its **Memory commitment**
  chart is memory *promised* to Postgres and to Supabase's own services on the same small server, not memory used, so on
  Nano it reads high even with the class asleep. The sign that memory really ran out is an out-of-memory kill or a crash
  in the Postgres logs (none through 2026-11-19); fewer, shorter queries keep the busy-hour spikes down. If the database jams (even the connector can't
  connect), Sam restarts it from the dashboard (Settings, General, Restart project); that clears the jam, not the CPU.
  A page backs off by itself: a call the server fails starts a **quiet spell** (`window.shDb` in `widget/v3.js`: 30 s,
  doubling to 5 minutes), in which answers go one at a time and the analytics wait; a new caller of the database that
  isn't something the student did on purpose should check `shDb.busy()` too. An answer still waiting when the page is hidden
  or closed is kept on the device (`sh_answers_kept:<hub>`, up to 3 days) and sent by the hub's next page with the same
  request id, so it records and pays once (2026-11-19). A mock's or a game's answer joins that line once its three quick tries
  fail, and the session's finish waits behind it in the line (kept with it), so the server scores the mock with every answer in.
  **The database is small** (the Free plan's Nano size: a shared CPU and up to 0.5 GB of memory, of which Postgres's own
  cache, `shared_buffers`, takes 224 MB; 60 connections; earlier notes said 1 GB, which is the paid Micro), and every student's answer is saved
  through it (`record_answer_v2`, about 150 ms). Visitors' calls stop after 3 s (anon's `statement_timeout`; `lock_timeout`
  8 s). **A heavy query takes the cores from the class:** on 2026-11-18, the day before the Perio final, answer saves
  failed in bursts of 1 to 5 minutes, up to 1 in 2 of them, each time something heavy ran: a migration with a 43 s
  transaction and a 17 s backfill, the lessons audit's 11-13 s economy queries through the connector (which runs as
  `postgres`, with a 2-minute limit), and the admin page sending its reads all at once. So: apply a migration with a
  backfill, and run long analysis SQL, when the class is quiet (1 to 5 am Central) or in small batches; send every query
  alone, one at a time, under `set local statement_timeout = '5s'`; benchmark a function on a throwaway copy
  (`tools/release/pg.js`), never in a loop on the live database
  ([run-sql-on-the-live-database](../how-to/run-sql-on-the-live-database.md)). **A function that a page calls often, or
  that such a function calls, is written in PL/pgSQL, not SQL** (2026-11-19, `migration_v76.sql`): a SQL-language function
  with `security definer` or its own `search_path` (all of ours) can't be inlined, so it is parsed and planned again on
  every call, while a PL/pgSQL one keeps its plans for the life of the connection; that planning was about a third of every
  answer save. `pg_stat_statements` with `track = all` on a throwaway copy shows it
  ([the optimization pass](../tasks/done/2026-11-18-database-optimization-pass.md)). The admin page reads one query at a time,
  and its heavy reads come worked out ahead from `admin_cache`, refreshed by pg_cron's `sh-admin-cache` job (every 15
  minutes while the page is in use, hourly while the class is busy, one read a minute; `migration_v83.sql`)
  ([admin-operations](admin-operations.md)), and `widget/v3.js` holds a failed answer and sends it again with the same
  request id (the quiet spell above). What's still to do: [the task](../tasks/done/2026-11-18-database-load.md).
- **GitHub Pages deploy** — `github.com/smcmurry6-source/study-hubs`, branch
  `main`, served at `smcmurry6-source.github.io/study-hubs/`. Deploy via the
  GitHub Git Data API (blob → tree → commit → ref update); a GitHub PAT is
  needed for this and should only ever be used transiently (env var for one
  script run), never written into a committed file. **Claude Code sessions
  (cloud or local) don't use the API path or a PAT:** they push a branch and
  open a PR, and merging the PR is the deploy — see [ship-a-change](../how-to/ship-a-change.md).
  **Keep the repo public.** On GitHub's free plan, making it private takes the whole site down ("Site not found"),
  and making it public again doesn't turn Pages back on: Settings → Pages → Build and deployment → Deploy from a
  branch, `main`, `/ (root)`, Save, and check it's `main`, not another branch (2026-11-04). If a publish ("pages build
  and deployment" in Actions) times out, re-running it fails at once with "Deployment cancelled", because a re-run
  for the same commit reuses the cancelled deployment; a new commit to `main` (any merged PR) publishes again. The same
  holds for "Deployment failed, try again later" after a few minutes of `deployment_queued` (2026-11-06: #285's and
  #281's publishes both ended that way, GitHub's status page said Pages was fine, and re-running #281's failed again
  in a minute): the live site stays on the last good publish until the next merge. `node tools/release/postcheck.js`
  catches it ("the live copy differs from main"). It happened again on 2026-11-10: #301's publish sat in
  `syncing_files` for 10 minutes and the deploy step canceled it ("Timeout reached"), so the Perio S9 diagrams waited
  for the next merge. When a release can't wait for someone else's PR, a small vault-only PR (one that records what
  happened) publishes it.
  **Size:** Pages publishes every file in `main` and stops at 1 GB per site (and times a deploy out after 10 minutes).
  The mp3s are nearly all of it, 100-180 MB a hub, so an archived hub's narration and Timmy Time come off the site
  ([archived-hubs-drop-their-audio](../rules/archived-hubs-drop-their-audio.md); 958 → 589 MB on 2026-11-12).
  `node tools/ci/size.js` (in "Check hubs") prints the size, warns from 750 MB and fails from 900 MB.
- **Kokoro model files** — re-hosted as release `kokoro-model-v1.0` on this repo
  (`kokoro-v1.0.onnx`, `voices-v1.0.bin`), because Claude Code cloud sessions can
  only download release files from repos attached to the session.
