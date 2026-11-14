---
type: reference
tags: [widget, bundles, loading, performance, redesign]
---

# The redesign's bundles

A page on the redesign (the dashboard, `index.html`, and every hub on the engine, `hubs/<hub>/index.html`) loads the widget in a few built files instead of one request per source
file ([phase 5, part 2](../tasks/done/2026-11-05-redesign-phase-5-backend.md), 2026-11-13). The old single-file hub pages are not
part of this: they keep loading `widget/v3.js` and the rest by name, exactly as before.

## What is built

`tools/bundle/bundles.json` is the list; `node tools/bundle/build.mjs` writes the files into `widget/`, beside their
sources, so an address worked out from a script's own (`new URL("x", script.src)`) or a stylesheet's `url(...)` stays
right. The site has no build step on GitHub Pages, so **the built files are committed**.

| File | Holds | Loads |
|---|---|---|
| `widget/hub.bundle.js` | a hub's engine: `hub-art.js`, `hub-rewards.js`, `hub-timmy.js`, `hub-bank.js`, `hub.js` | with the page (`defer`) |
| `widget/dash.bundle.js` | the dashboard: `hub-art.js`, `hub-art/dash.js`, `archive.js`, `dash.js` | with the page (`defer`) |
| `widget/rest.bundle.js` | the slim database client, and `clicks.js`, `replies.js`, `linkask.js`, `ranks.js`, `ask.js`, `pet.js`, `timmy.js`, `ideas.js` | once the page is drawn; the same file on a hub and on the dashboard, so going from one to the other downloads it once |
| `widget/hub-rest.bundle.js` | a hub's own widget layer: `v3.css`, `v3.js`, and `eggs.js`, `fx.js`, `highlight.js`, `podcast.js`, `qhealth.js`, `drill.js` | on a hub, right after `rest.bundle.js` |
| `widget/site.bundle.css` | `hub.css`, `dash.css`, `ask.css`, `ideas.css`, in that order | the page's one stylesheet |

Everything fetched on first use stays its own file (the place, the shop, the trophy case, Learn and Flashcards, the
arcade, the journeys, bowling, the tour, the celebration cards, the case kit, the recap, a hub's own art and content).

## How a bundle runs its files

- A **`run`** file runs as the bundle loads, in the listed order, in the same script (the engine's files, `v3.js`, the
  client).
- A **`hold`** file is wrapped in a function and kept until the page asks for it: `window.SH_BUNDLE.run("pet.js")`
  runs it once, at the moment the page would have added that file's own `<script>`. So the order and timing each
  widget file starts in are what they were. `SH_BUNDLE.has(name)` says whether a bundle on the page holds the file.
- The loaders ask the bundle first and fall back to a `<script>`: `widgetFile()` in `widget/v3.js` (every file v3.js
  loads), `loadScript()` in `widget/hub.js`, `loadLate()` in `widget/dash.js`. On a live page there is no
  `SH_BUNDLE`, so `widgetFile()` adds the `<script>` as v3.js always has.
- A held file that reads `document.currentScript` (to find its neighbors) is handed a stand-in whose `src` is the
  address its own file would have had; the build makes that swap and refuses a file that uses `currentScript` any
  other way.
- **`v3.css` rides in `hub-rest.bundle.js`**, not in the shared stylesheet: it is put in as a `<style id="sh-css-v3">`
  ahead of the stylesheet's `<link>`, the place a hub has always had it. In the shared sheet it restyled the new
  dashboard's rank badge (BUG-127), because the dashboard never loaded it before.
- The build only takes out comments, indentation and blank lines (about a quarter off the gzipped size). No renaming
  and no rewriting: it compares every file's tokens before and after and fails on any difference. The parser is
  vendored (`tools/bundle/vendor/acorn.cjs`), so the build and its check need no `npm install`.

## The slim database client

`widget/vendor/supabase-lite-2.117.2.js` (23 KB gzipped; the full one is 55 KB) is built by
`tools/bundle/client/build.mjs` from the official `@supabase/postgrest-js` and `@supabase/realtime-js`, the same
version as the full client: it keeps `from`, `rpc` and realtime (`channel`, presence, broadcast) and leaves out auth,
storage and functions, which no page uses (Ask Timmy calls its function with `fetch`). The global is still `supabase`
and `createClient(url, key)` returns the same shape. `node tools/bundle/client/wire-check.mjs` runs both clients
against the project, read-only, and compares what comes back (run by hand; it needs the network). Rebuilding the
client needs npm; nothing else does.

## When you change a widget file

1. Edit the source in `widget/` as before (never a `.bundle.` file).
2. If the file is in `tools/bundle/bundles.json`: `node tools/bundle/build.mjs`, and commit the rebuilt bundles with
   the source. `node tools/bundle/build.mjs --check` (in CI's "Check hubs") fails when a bundle isn't what its sources
   build; `--sizes` prints each bundle's size.
3. A new file that should load with a redesigned page, or right after it: add it to a bundle's list. A file for first
   use stays out and is fetched by `loadScript`.

The smoke test checks, on every redesigned page: the bundles are what the page asked for, no bundled file was fetched
by itself (during the whole walk), `site.bundle.css` holds exactly its sources' rules in order, `v3.css` sits ahead of
it and matches, none of the dashboard's rules reaches a hub, the 8-bit face comes from `assets/fonts/vt323.woff2` and
nothing is asked of Google Fonts. On every live page: no bundle is requested and `SH_BUNDLE` doesn't exist.

## Budgets

`node tools/release/perf.js` measures a page's whole load since 2026-11-13: every request until the network has been
quiet for 2 s (it used to stop 3 s after the load event, which left out whatever arrived later; on a slow-4G phone that
was about a third of a new hub). It also prints how much had arrived by the load event. `tools/release/budgets.json`
holds the limits.

Related: [repo map](repo-map.md) · [shared-infrastructure](shared-infrastructure.md) ·
[verify-before-pushing](../how-to/verify-before-pushing.md) · [the release](../tasks/2026-11-06-redesign-release.md) ·
[phase 5](../tasks/done/2026-11-05-redesign-phase-5-backend.md)
