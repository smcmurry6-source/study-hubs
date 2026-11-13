---
type: reference
tags: [map]
---

# Repo map

- `AGENTS.md` — the entry point for every AI agent; `CLAUDE.md` loads it for Claude Code sessions.
- `vault/` — the notes: rules, how-tos, reference, one note per hub, Sam's decisions and the task list. Start at
  [home](../home.md). Open the repo root in Obsidian to browse it as a vault ([repo-is-the-vault](../rules/repo-is-the-vault.md)).
- `RELEASE_TEST_PLAN.md` — how a substantial change is previewed, tested, approved by Sam, released and
  rolled back ([preview-and-release-test](../rules/preview-and-release-test.md)). Its tools: `tools/preview/` (`serve.js`
  and `build.js` make a production-safe preview on fixture data; `runtime/preview.js` is injected into previews only;
  `fixtures/personas.json` holds the six test accounts; `design/` is the redesign's design system page, which a preview
  serves at `/tools/preview/design/`, its art built from `tools/figures/site/` by `build.mjs`) and `tools/release/` (the suites: `secrets.js`, `rls.js` with
  `rls-expectations.json` and the live `rls-audit.sql`, `a11y.js` and `perf.js` with their `baselines/` and `budgets.json`,
  `matrix.js`, `postcheck.js`, the database suites `admin-ops.js`, `retention.js` and `xp.js` (the game layer's server) on
  a throwaway copy built by `pg.js`; `run.js` runs them all). The bug log and UAT checklist are in `vault/release/`.
- `tools/figures/site/` — the site's drawn art, built by `build.mjs`: emblems, mastheads, medals, the rewards art, and
  Timmy's place (`place.mjs`, the kit; `sets.mjs`, the list of seasonal and rank sets; `packs/<set>.mjs`, one file per
  set; `pack-preview.mjs`, a contact sheet of one set: [draw-a-seasonal-set](../how-to/draw-a-seasonal-set.md)), and
  the shop's own art (`shop.mjs`: the Shiny Gold Crown coin, the snack and boost thumbnails, the rarity frames, built
  into `widget/hub-art/shop.js`, `window.SH_SHOP_ART`; `shop-sheets.mjs`, its contact sheets:
  [the shop](../tasks/2026-11-06-redesign-timmy-shop.md)).
- `DEPLOY_NOTES.md` — the change log ("Recent major changes", newest first): what every session shipped. Grep it for a
  hub or feature; don't read it whole.
- `index.html` — dashboard. Hub cards come from the `HUBS` / `CLASSES`
  arrays near the top of the script; add or archive a hub there, not in markup.
- `next/` — the redesign's dashboard, built beside the live one until [the release](../tasks/2026-11-06-redesign-release.md):
  `index.html` (its settings in `window.SH_DASH`; outside a preview it sends visitors to the live dashboard) and `hubs.js`
  (the hub list and archive hours, **generated** from `index.html` by `tools/dash-next/build.mjs`; CI's `--check` fails
  when it is stale, so run the build after changing `HUBS`). The page is drawn by `widget/dash.js` + `widget/dash.css` on
  the hub engine's design system (`widget/hub.css`), with `widget/hub-art/dash.js` (every hub's emblem and tint, from
  `tools/figures/site/build.mjs`). Its drawn parts are kits the page draws at its own size: `widget/hub-art/class.js`
  (the studying-now classroom, the leaderboard's stage and the recap's bar graph and crowd, from `classroom.mjs`,
  `stage.mjs` and `recap.mjs` in `tools/figures/site/`)
  and `widget/hub-art/outfits.js` (the shop's outfits and `dress()`, loaded only when someone on the page wears one).
  The three journeys (Handpiece, ModuPro, Loupes: [task](../tasks/2026-11-06-redesign-progression-journeys.md)):
  `widget/journeys.js` (the hand-off and the Dark Matter unlock, full-screen scenes, and the road ahead) and
  `widget/hub-art/journeys.js` (the ModuPro's and the loupes' shapes for `shRanks.art` and the three journey trophies,
  from `tools/figures/site/journeys.mjs` and `medals.mjs`), both fetched by `widget/ranks.js` on first use.
  Timmy's place ([task](../tasks/2026-11-06-redesign-timmys-place.md)): `widget/place.js` + `widget/place.css`
  (`window.shPlace`: the card, the full view, Timmy's hops, the medal view and the customizer, which saves through
  `equip_item`), with its kit `widget/hub-art/place.js` (`window.SH_PLACE`, from `tools/figures/site/place.mjs`) and
  one file per set in `widget/hub-art/place/` (`<season>.js` and `ranks.js`, each fetched only when a piece of that set
  is drawn). None of it loads with a page: a new hub fetches it from More, Timmy's place, and the new dashboard on the
  first scroll, tap or key (until then its "you" card shows a still kept on the device). [Phase 3](../tasks/2026-11-05-redesign-phase-3-dashboard.md) says what is on it.
- `hubs/<hub-id>/next/` — the redesign's new version of a hub, beside the live one until the release: a small page of
  settings (`window.SH_HUB`), its content as JSON in `content/` (written by `tools/hub-next/build.mjs`) and the shared
  engine. The engine is four scripts the page loads in order, with `widget/hub.css`: `widget/hub-rewards.js` (the answer
  path, XP, rank, the recap), `widget/hub-timmy.js` (Timmy), `widget/hub-bank.js` (the question card, the bank, the mock),
  then the core, `widget/hub.js` (its top says how they fit together). The Question Bank's Learn and Flashcards are
  `widget/study-modes.js` + `widget/study-modes.css`, fetched by `hub-bank.js` the first time either is opened
  ([the task](../tasks/2026-11-06-redesign-learn-and-flashcards.md); their server part is the pending `migration_v56.sql`).
  The bowling egg ([the task](../tasks/done/2026-11-06-redesign-bowling-egg.md)) is `widget/bowling.js` (`window.shBowl`, its
  styles inside), with its eight clips in `widget/hub-art/bowling.js` (`window.SH_BOWL`, built from
  `tools/figures/site/bowling.mjs`): `hub-rewards.js` counts the run and fetches it at a strike, and the place's bowling
  lane fetches it on a tap; nothing on the server.
  The trophy case ([the task](../tasks/done/2026-11-12-redesign-trophy-case-and-cards.md)) is `widget/trophies.js`
  (`window.shTrophies.mount`) + `widget/trophies.css` (the case, the rest of More, Stats and trophies, and the
  celebration cards' redesign look under `html.shx`), with its drawings in `widget/hub-art/trophies.js`
  (`window.SH_TROPHY_ART`, built by `tools/figures/site/build.mjs` from `medals.mjs`): `widget/ranks.js` fetches all
  three on first use (`trophyCase`, `trophyCss`), from More, Stats and trophies, the new dashboard's "you" card, or a card.
- `hubs/<hub-id>/index.html` — one single-file hub each, and it is the source (perio included: its old split-source
  Claude Project is retired; edit the file directly). `hubs/<hub-id>/audio/` holds
  its Kokoro narration (`<lecture>-full.mp3`, `<lecture>-plain.mp3`).
- `widget/v3.js` + `widget/v3.css` (+ `widget/eggs.js`, the easter eggs, `widget/clicks.js`, click analytics and feature events (`window.shTrack`), `widget/replies.js`, report replies and notices, `widget/ranks.js`, handpiece ranks, `widget/rankup.js`, the rank-up, level-up, trophy and mock-results cards, `widget/drill.js`, the Daily Drill, and `widget/fx.js`, the motion layer: answer feedback, the streak flame, bar fills, tab fades, and `widget/podcast.js`, the Timmy Time player with its likes, dislikes and comments; `widget/tour.js`, the guided tours of the dashboard and of a hub, loaded by `index.html` and v3.js; `widget/qhealth.js`, question health: per-question timing, retries and the "Good question?" thumbs, [question-health](question-health.md); `widget/cases.js` + `widget/cases.css`, the dental case kit behind every hub's drawn Patient Box cases, loaded by the hubs that have them, [how-to](../how-to/draw-a-patient-box-case.md); `widget/ideas.js` + `widget/ideas.css`, the idea board (the redesign: a section on the new dashboard, a page in a new hub's More, and the "Also post it on the idea board" tick under the check-in and the Suggest box; [task](../tasks/2026-11-06-idea-board.md), [server](game-server.md)); `widget/archive.js`, which hubs
  are live, archived or hidden: the dates and Sam's overrides, loaded by `index.html` and `review/`) — shared cross-hub layer (search, class stats,
  streaks, leaderboard, analytics, `shTTS`, `shMindMap`). Cross-hub features go
  here, never hand-patched into one hub.
- `review/` — admin analytics page. Its **Insights** tab puts every hub (live and archived) side by side and pairs each
  number with the decision it drives ([insights-dashboard](insights-dashboard.md), data from `migration_v49.sql`;
  [analytics governance](analytics-governance.md)). Its **Live** view shows who is studying now and its **Hubs** view sets a
  hub live, archived or hidden by hand, with an audit log ([admin-operations](admin-operations.md), `migration_v50.sql`;
  `widget/archive.js` holds the archive rules the dashboard, hubs and admin page share). Its **Ask Timmy** tab reads
  Timmy's chats, costs, gaps and reports and holds his switch and limits (`migration_v55.sql`, from the redesign's release;
  [ask-timmy](ask-timmy.md)). Its **Recap** tab makes the shareable end-of-hub image (drawn by
  `widget/recap.js`) and **publishes** it to the dashboard's "Hub recaps" slideshow. When a hub is archived, publish its
  recap (`tools/publish-recap.js --bank <file>`; Sam's standing OK since 2026-10-01, `/lessons-audit` does it) **before**
  the hub page comes down, while `tools/dump-banks.js` can still read its bank.
  **Archived hubs' question banks are not kept in this public repo** (`question-banks/` is gitignored, removed
  2026-10-02): the syllabus keeps quiz and exam content from later classes. Keep a dump locally if you need one.
- `tools/question-ids/<hub>.txt` — every question id each hub has ever shipped (`<id> retired` for deleted ones), checked by
  `tools/ci/smoke.js` ([question-ids-are-permanent](../rules/question-ids-are-permanent.md)).
- `tools/podcast/` — Timmy Time, a hub's audio review episode hosted by Timmy Tooth: the script (`<hub>/script.md`),
  Kokoro voice with a pronunciation lexicon, synthesized music and mastering (its `README.md`). The mp3 goes in
  `hubs/<hub-id>/audio/timmy-time.mp3`; the hub defines `window.SH_PODCAST` and a `<div data-sh-podcast>` slot.
  Like narration, the episode must not drift from the notes: fix both in the same PR.
- `supabase/functions/timmy/` — Ask Timmy's server, the Supabase Edge Function `timmy` (deployed at the redesign's release):
  `core.js` (the logic, run under Node by the tests), `index.ts` (the Deno wrapper), `site.json` (the site help, built from
  the About page by `tools/timmy/build.mjs`; rebuild it when `about/index.html` changes). Its tests and eval are in
  `tools/timmy/` (`test.mjs`, `test-set.json`, `eval.mjs`), its database suite is `tools/release/timmy.js`, its tables are
  `migration_v55.sql`. Its chat is `widget/ask.js` + `widget/ask.css` (`window.shAsk`), loaded only by the
  redesign's pages (a new hub through `widget/hub-timmy.js`, the new dashboard through `widget/dash.js`): [ask-timmy](ask-timmy.md).
- `tools/reddit-scout/` — `scout.py` reads the Claude subreddits' feeds into one digest for `/reddit-scout`
  (`.claude/skills/reddit-scout/`); `log.md` keeps every run's suggestions, Sam's answers and the posts judged.
- `LESSONS.md` — what archived hubs taught us. Read it before building or restructuring a hub; **before building a new
  hub, if its "Last refreshed" date isn't today, run steps 1-3 of `tools/lessons-refresh.md` first**. Sam runs the whole
  runbook by hand whenever Sam asks for a lessons refresh, usually as `/lessons-audit` (the skill in
  `.claude/skills/lessons-audit/`; there is no scheduled routine): it refreshes `LESSONS.md` from all data, reports and suggestions
  (`tools/lessons-daily.sql`) and opens a PR with small data-backed fixes to the live hubs. **Archiving a hub
  always includes a retrospective** (Sam's standing rule): run `tools/retro.sql` for that hub (time by section,
  clicks and reach, engagement, questions, exam check-ins, search terms, reports), write the findings and the
  resulting changes into `LESSONS.md`, fix what's small, and tell Sam the rest. The dashboard archives a hub **by itself** at 10 pm on the day of
  its last exam (`ARCHIVE_HOUR`), unless Sam set it by hand on the admin page's Hubs tab (that wins until it's cleared or ends:
  [admin-operations](admin-operations.md)): its card turns into an archived card with no Open button, which disappears 10 days
  later (`CARD_DAYS`; `hideCardOn` overrides). "Check in" buttons show from 8 am on exam day; the pop-up only goes out
  from 10 pm and still reaches first visits up to 60 days after (`DEBRIEF_DAYS`). The hub's page itself stays up until
  someone removes it, so the retrospective and cleanup are still manual; its narration and Timmy Time come off the site then
  ([archived-hubs-drop-their-audio](../rules/archived-hubs-drop-their-audio.md)); moving the entry into `ARCHIVED_HUBS` then is optional. Read the check-ins as late as you can.
- `migration_v*.sql` — Supabase schema history (project `thytmzsgymydbzcqdnix`).
  New migrations are run once, by hand, in the Supabase SQL editor, or by a Claude Code session through the
  Supabase connector (`apply_migration` is pre-approved in `.claude/settings.json`). Commit the `.sql` file and
  refresh `supabase/schema.sql` either way. A migration written ahead of its release (`migration_v54.sql`, the game layer's
  server: [game-server](game-server.md)) is listed in `supabase/pending-migrations.txt` until it's applied; the database
  suites apply the listed ones on top of `supabase/schema.sql`. At the release: apply it, append it to `supabase/schema.sql`
  and take its line out of the list, in the same PR. `tools/xp/keys.js <hub>` builds a hub's `question_keys` from its content JSON.
- `deploy_rollout.py` / `.ps1` — the Cowork-era API deploy scripts. A Claude Code
  session doesn't need them: use git.
