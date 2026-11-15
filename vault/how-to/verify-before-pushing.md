---
type: how-to
tags: [shipping, ci]
---

# Verify before pushing

GitHub Actions runs `.github/workflows/check.yml` on every PR: `node tools/ci/syntax.js`
(every inline script parses, no conflict markers, and the service worker's precache list names files that exist and
every live hub on the engine), `node tools/ci/vault.js` (vault links resolve, task notes and
rule notes in order; see [repo-is-the-vault](../rules/repo-is-the-vault.md)) and `node tools/ci/smoke.js` (headless click-through
of the dashboard and, since 2026-11-06, only the hubs your change touches: every hub when a shared file changes
(`widget/`, the dashboard, `sw.js`, assets, a workflow, the test itself), on `main`, or with `--all`; notes, tools, SQL
and the vault don't count. It works this out from git (on a PR, against its base) and prints which hubs it checked.
On desktop and phone, plus a question-bank lint of those hubs: duplicate ids, answer
ranges, missing explanations, a missing "why" for any choice, missing narration files, the correct answer being the longest choice
in more than 40% of MCQs, statement keys that form a pattern (a two-statement choice keyed in over 40% or under 10% of a hub's items, a
numbered key in one position over 45%, a statement number true in over 90%), and question ids against `tools/question-ids/<hub>.txt`: a renamed or deleted id fails,
and a local run adds new ids to the file, so commit it; see [question-ids-are-permanent](../rules/question-ids-are-permanent.md)).
Since 2026-11-04 it also runs `node tools/release/secrets.js` (no keys, course material or
data files), `node tools/release/rls.js` (database permissions on a throwaway copy of `supabase/schema.sql`; needs
PostgreSQL's server binaries), `node tools/release/admin-ops.js` (the admin page's database functions on the same kind of
throwaway copy: who's studying now, archive overrides, newest-first check-ins), `node tools/release/retention.js` (the
weekly retention job's deletes on the same kind of copy: the hourly totals, device linking and the recap survive them), `node tools/release/xp.js`
(the game layer's server, [game-server](../reference/game-server.md): XP, a replayed call, a double tap, a linked device, the
shop and the idea board; all four database suites apply `supabase/pending-migrations.txt` on top of the schema), `node tools/ci/archive.js` (the hub archive
rules against the old date logic), `node tools/ci/size.js` (the published site against GitHub Pages' 1 GB limit: warns
from 750 MB, fails from 900 MB, and lists the hubs still carrying audio; [archived-hubs-drop-their-audio](../rules/archived-hubs-drop-their-audio.md)), `node tools/ci/preview.js` (the preview never reaches production; needs Playwright) and
`node tools/ci/cases.js` (every drawn Patient Box case, in an engine hub's `core.json` or an old hub's page, has realistic numbers that agree with its key,
[how-to](draw-a-patient-box-case.md)), and
a second workflow, "Release tests", runs accessibility, performance and the device matrix when a PR changes shared code
(the dashboard, `widget/`, the service worker, the admin page, the database...) or has the `full-tests` label (since
2026-11-06: hub content and notes skip it; a tier 2 or 3 change inside hubs gets the label)
([RELEASE_TEST_PLAN.md](../../RELEASE_TEST_PLAN.md); `node tools/release/run.js` runs everything). Both run in
parallel jobs since 2026-11-13, each read as one result (`check`, `release`), and on a PR both keep an earlier green
result when only notes changed since it (`tools/ci/reuse.js`; `node tools/ci/reuse.js --diff <sha>` says whether a
change would). Run them locally before pushing; the smoke test needs Playwright
(`PLAYWRIGHT_PATH`/`CHROMIUM_PATH` env vars point it at a preinstalled copy). The lint reads a hub on the engine from
its content JSON (`hubs/<hub>/content/`), and an old single-file hub by injecting a hook just before
`window.SH_EXPORT = {`, so that line stays at the end of each old hub's script.

- After changing a hub's content (`hubs/<hub>/content/*.json`): `node tools/hub-next/build.mjs`, and commit what it
  rewrites (the question index, High yield, the layout). After changing the About page: `node tools/timmy/build.mjs`
  (Ask Timmy's site help). "Check hubs" runs both with `--check`, with the site art's and the figure builds'.
- After changing a file in `widget/` that `tools/bundle/bundles.json` lists: `node tools/bundle/build.mjs`, and commit
  the rebuilt `widget/*.bundle.*` with it ([bundles](../reference/bundles.md)). "Check hubs" runs
  `node tools/bundle/build.mjs --check` with the other generated-file checks and fails on a stale bundle.
- `node --check` on each hub's extracted `<script>` block(s) and on `widget/v3.js` / `widget/eggs.js` / `widget/clicks.js` / `widget/replies.js` / `widget/ranks.js` / `widget/rankup.js` / `widget/drill.js` / `widget/fx.js` / `widget/podcast.js` / `widget/archive.js` / `widget/cases.js`.
- Question / lecture counts match what you expect; no duplicate ids.
- Grep that the feature you added (and anything from a merged-in branch) is present.
- Conflict markers: search line-anchored (`^<<<<<<<`, `^=======$`, `^>>>>>>>`) —
  the hubs' CSS uses long `====` comment dividers.
- If both `widget/v3.js` and `widget/v3.css` changed, make sure both are committed.
- Look at the page in a scripted browser with the class's data stubbed (the way `tools/ci/smoke.js` and
  `node tools/preview/serve.js` do it), clicking through Home, Notes, Questions and More. Never use the plain page as a
  test account: it saves to the class's real data.
- If CI's runner can't reach Ubuntu's package mirror, both workflows install the test browsers without their system
  packages and say so in a warning on the run's page (2026-11-11). A "Check hubs" that still fails at "Install headless
  Chromium" is the browser download itself: re-run it once, then say so in the PR.
- The long suites (the smoke test on every hub, `node tools/release/run.js`) run once on the finished code; after
  that, and after bringing `main` in, CI is the check ([long-tests-once](../rules/long-tests-once.md)).
