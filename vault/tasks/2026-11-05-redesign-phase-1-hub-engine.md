---
type: task
status: review
hub: occlusion
created: 2026-11-05
requested-by: Sam
due: 2026-11-19
waiting-on:
agent: Claude Code (cloud)
pr: https://github.com/smcmurry6-source/study-hubs/pull/275
---

# Redesign phase 1: the shared hub engine, on a preview of Occlusion

## Goal

Extract one shared hub engine (`widget/hub.js` + `hub.css`) from the four byte-identical hubs, split a hub's content into JSON loaded on demand, and build the agreed layout (Home · Notes · Questions · More, Timmy on the bar, drill/misses/weak/mock as bank presets, the question card with its rewards, the daily goal ring, the session recap card, three Check-yourself questions per lecture, side-by-side charts next to their lecture). Built side by side with the live Occlusion and released with the rest of the redesign ([the release](2026-11-06-redesign-release.md)); nothing goes live in this phase.

## Context

- The plan and Sam's decisions: [the redesign audit and plan](done/2026-11-05-redesign-audit-and-plan.md), section 4.
- **Built side by side, released all at once** (Sam, 2026-11-06, [decisions](../decisions.md)). This phase sets up how
  every later phase works:
  - The engine (`widget/hub.js`, `hub.css`) is loaded only by the new versions; the live hubs keep `widget/v3.js` and
    their own code as they are. A change to a shared widget file that would change how a live hub looks goes in a file
    (or a scope) only the new versions load.
  - The new Occlusion lives next to the old one (for example `hubs/occlusion/next/`, its page and its content JSON),
    and nothing links to it. On the live site it doesn't run for the class: outside a preview it sends the visitor to
    the live hub, so nobody studies in a half-built version and nothing is counted twice.
  - Until the release, content is still edited in the live hub file. A build step writes the new version's JSON from
    it, and CI's `--check` fails when the JSON is stale, so the daily question and note fixes reach both versions.
    `narrate.py`, the figure builds and the lint keep reading the live file until the release.
  - Same hub ids and question ids, so everyone's answers, XP, ranks, pins and question health carry over at the release.
  - Sam looks on each PR's preview link. For a look at everything merged so far, the preview job also deploys a
    branch when "Release tests" is run by hand on it (Actions, Release tests, Run workflow, `main`); making it run on
    every push to `main` would keep a standing preview of the redesign.
- Rules that matter most here: [preview-and-release-test](../rules/preview-and-release-test.md) (every phase is tier 2 or 3:
  preview link first, screenshots, the release suites, Sam's look), [about-page](../rules/about-page.md),
  [learner-data-privacy](../rules/learner-data-privacy.md), the taste skill in full (Sam, 2026-11-04).
- Hub note: [occlusion](../hubs/occlusion.md). The engine audit (what is identical, what CI depends on): the audit note, section 3.
- Rules edited at the release, not in this PR (until then they describe the live hubs; write the changes into the
  [release note](2026-11-06-redesign-release.md)): [hub-home-page](../rules/hub-home-page.md) (Home stays, as a landing page with the quick links on the first phone screen; drill, weak spots and mock as bank presets), [arcade-skins](../rules/arcade-skins.md) (one game up front, the rest behind more games), [question-bank-filter-panel](../rules/question-bank-filter-panel.md) (the presets as chips).
- Keep: `window.SH_EXPORT = {` last, the question-id registry, the lint's question shape and format minimums, the smoke test's selectors (update `tools/ci/smoke.js` with the engine), the `od:kit`/`anima:js` marker blocks (or their new per-figure files), narrate.py's READINGS format (or its new JSON reader), the preview transform's literal strings.
- Settings cut: font choice, background music, accent metal (text size and theme stay). Tour prompt cut; one-line first-use tips.
- **From phase 0** ([task](done/2026-11-05-redesign-phase-0-design-system.md)): the typeface is **Nunito Sans**
  (`assets/fonts/nunito-sans-*.woff2`); the tokens, the question card and the reward logic are on the design page
  (`tools/preview/design/design.css`, `design.js`); the approved art is in `tools/figures/site/` (`build.mjs` writes
  `art.js` today; add the symbol sheets for the widget). Occlusion's emblem, masthead and medals are there already.

- **A parallel agent (Codex) can take the engine extraction and the content split** (`widget/hub.js`, the JSON files, CI,
  narrate.py and the preview transform) while the design session does the layout, the card and the art on top of it: agree
  the engine's module boundaries first (one PR for the extraction with no visual change, then the redesign PR on it).

## Done when

- [x] `widget/hub.js` + `hub.css`; the new Occlusion (beside the live one) is configuration, data (JSON), tint, emblem, masthead and arcade skin; the live Occlusion unchanged
- [x] First load of Occlusion well under the perf budget (target: under 400 KB over the wire before the bank's data)
- [x] Every mode, every question format, the mock, the arcade, narration, the podcast card, pins, reports, the drill, the eggs and Timmy work on the preview (UAT checklist), phone and laptop, light and dark
- [x] The inspector passes with 0 FAIL on Home, Notes, Questions and More
- [x] The rule, About page and [build-a-hub](../how-to/build-a-hub.md) changes written into the [release note](2026-11-06-redesign-release.md); the hub note says how the new version is built and kept in step with the live one
- [x] CI passes (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`, `node tools/release/run.js`): locally, and "Check hubs" and "Release tests" green on PR #275 after the BUG-040 fix
- [ ] Preview link, phone and laptop screenshots, and Sam's look ("Sam approved this release" ticked by Sam)
- [x] Vault written back (hub notes, decisions, `DEPLOY_NOTES.md`, the About page, this note's Outcome)

## Log

- 2026-11-05: written from the agreed plan.
- 2026-11-06: Sam asked for "Why each choice" to start folded after answering (it took up too much of the screen), and
  all six live hubs now do ([decisions](../decisions.md)). The design page (`tools/preview/design/`) opens the why for
  your pick on an answered card: ask Sam whether the engine's card folds that line too before building it.
- 2026-11-06: built (Claude Code). Sam's look mid-build: Timmy back in the bottom-left corner with a Settings button on the
  bar, plain answer rows like the live hubs (no circles), more design on the Notes lecture list ([decisions](../decisions.md)).
  The engine's "Why each choice" now folds under one bar like the live hubs; inside it the pick's reason is open (asked Sam).
- 2026-11-06: rebased onto [PR #273](https://github.com/smcmurry6-source/study-hubs/pull/273) (High likelihood works on top of
  any Show chip). The engine's bank follows the new rule: Show is All, Not answered yet, Missed last time, Pinned, and an
  **Only** line under it holds the High likelihood toggle (`STATE.ui.qlikely`), with its own tag, the live hubs' empty-state
  words, a saved Show "likely" moved to the toggle, Exam hints' "Practice these" turning it on and Home's Practice questions
  turning it off. A hub adds its own toggle in `SH_HUB.bank.only` (Heme & Endo Exam 2's Exam 1 High likelihood, phase 2).
- 2026-11-06: Sam's answers ([decisions](../decisions.md)): keep "Why each choice" with the pick's reason open inside the
  fold, and Cusp Sort up front; the streak counts any study day (built as goal days: changed, `studyDays()` reads the live
  hub's `STATE.days`, so nobody's streak changes at the release); the session recap only on leaving the questions with 5
  or more answered (the 25-answer card is gone).
- 2026-11-06: Sam's second look, all built ([decisions](../decisions.md)): Focus mode in Settings (`setFocus()`: saves the
  extras in `sh_pref_focus_prev`, sets each to off, puts them back); every arcade game in the lobby with its own drawing
  (`tools/figures/site/arcade.mjs` → `widget/hub-art/occlusion.js` `games`); the More icon's dots straightened; the answered
  card's one row (Try it again, the widget's Find this in the notes and Good question? moved in beside it, no "Notes for"
  link) and tighter spacing; Home without "Your last two weeks", Today on a gold field with the calendar spot, flame and XP
  spark, Timmy Time on the hub's color with Timmy in headphones (`tools/figures/site/spots.mjs`; the live Timmy drawing,
  its gradient ids renamed); four soft fields (`--sun`, `--mint`, `--peach`, `--lilac` and their inks); prev / next lecture
  and Report a mistake (`shOpenFlag({ lec, label })`) in the notes; More as colored tiles; the live count in the bar, the
  strip and Home (`sh:online` from `widget/v3.js`'s presence count; the preview sends a made-up one). Fixed on the way:
  BUG-041 (v3's old Inbox and Tour buttons at the page's foot) and BUG-042 (pop-ups stacked in the phone's corner). The
  preview's returning test accounts now have Timmy adopted (`petDaysAgo` in `personas.json`). Then BUG-043 (the music
  notes over the Timmy Time text, the notes tip at the lecture's end) and the notes page's two columns centered at 1440.
- 2026-11-06: Sam's third look ([decisions](../decisions.md)): BUG-044 (the notice and the tip flush against the quick
  starts: the reset now uses `:where()`, so a component's own margin wins), Today's goal as a ring of 20 teeth
  (`teethRing()`), and Timmy Time as an animated card among the quick starts (`podMiniHTML()`; `hx-still` on `<html>`
  stops its motion with reduced motion or Answer animations off). Home's masthead and exam card now stay side by side
  down to 861 px, and a phone shows the whole 3:1 masthead, so Practice questions and Timmy Time are on the first screen
  from a 360 px phone to a 1920 laptop (not on an iPhone SE's 568 px).

## Outcome

Built side by side, nothing students see changes ([PR #275](https://github.com/smcmurry6-source/study-hubs/pull/275)):
- **The engine**: `widget/hub.js` + `widget/hub.css` (its header says how a hub plugs in). The art: `widget/hub-art.js` (the
  shared icons, flame and medals) and `widget/hub-art/<hub>.js` (tint, emblem, masthead), built by `tools/figures/site/build.mjs`.
- **The new Occlusion**: `hubs/occlusion/next/` (settings in `window.SH_HUB`; content in `content/`, written by
  `tools/hub-next/build.mjs`; how it's kept in step: [the hub note](../hubs/occlusion.md)). The guard sends visitors to the
  live hub outside a preview.
- **Gated hooks in the shared widget** (the live hubs behave as before): `shPet.say`/`hp`, the `sh:rank-profile` event
  (`ranks.js`), `SH_TOUR.steps`/`prompt` (`tour.js`), `shDrill.set` (`drill.js`), and in `v3.js` `shLoadPet` / `shLoadTour`:
  on a page with `SH_HUB`, Timmy's script loads once he's adopted and the tour's when it's started.
- **First load**: 371 KB over the wire before the bank's data (target 400), 536 KB with it; FCP 1.8 s, LCP 1.9 s, TBT 0.2 s
  on the slow-4G phone (the live Occlusion: 1317 KB, LCP 1.2 s, TBT 0.8 s, load 8.4 s). Budget added in `budgets.json`.
- **Inspector**: 0 FAIL on Home, Notes, Questions and More at 1440, 768 and 390 (WARNs left: ragged rows on Home and in
  the bank's side column, below-the-fold notes, one empty panel inside an anima figure).
- **CI**: `smoke.js` clicks through every `hubs/*/next/` page (four views, every More page and set, an answer, the arcade)
  and checks its bar at 320 px and at the largest text; `check.yml` runs both builds' `--check`; `perf.js` measures the page;
  `a11y.js` audits the four views (0 axe issues, light and dark; baseline added). Bugs found and fixed: BUG-037 to BUG-040
  in the [bug log](../release/bug-log.md).
- The rule, About page and build-a-hub changes are drafted in the [release note](2026-11-06-redesign-release.md).
- **For phase 2**: `PCASES` and the case kit are wired (Perio, PCD Implants); the figure 11 px floor is in the content
  build; anything a hub writes in its own code goes in its `SH_HUB`; a hub's own bank toggle goes in `SH_HUB.bank.only`
  (`[[key, label]]`, the key a question property), as Heme & Endo Exam 2's Exam 1 High likelihood will. Each hub's arcade
  lobby art is drawn in `tools/figures/site/arcade.mjs` (`arcadeArt()` returns only Occlusion's set so far): Heme & Endo 2
  and Perio need their six each, from their own skins.
