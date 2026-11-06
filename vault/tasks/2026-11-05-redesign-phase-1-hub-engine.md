---
type: task
status: open
hub: occlusion
created: 2026-11-05
requested-by: Sam
due: 2026-11-19
waiting-on:
agent:
pr:
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
- **From phase 0** ([task](2026-11-05-redesign-phase-0-design-system.md)): the typeface is **Nunito Sans**
  (`assets/fonts/nunito-sans-*.woff2`); the tokens, the question card and the reward logic are on the design page
  (`tools/preview/design/design.css`, `design.js`); the approved art is in `tools/figures/site/` (`build.mjs` writes
  `art.js` today; add the symbol sheets for the widget). Occlusion's emblem, masthead and medals are there already.

- **A parallel agent (Codex) can take the engine extraction and the content split** (`widget/hub.js`, the JSON files, CI,
  narrate.py and the preview transform) while the design session does the layout, the card and the art on top of it: agree
  the engine's module boundaries first (one PR for the extraction with no visual change, then the redesign PR on it).

## Done when

- [ ] `widget/hub.js` + `hub.css`; the new Occlusion (beside the live one) is configuration, data (JSON), tint, emblem, masthead and arcade skin; the live Occlusion unchanged
- [ ] First load of Occlusion well under the perf budget (target: under 400 KB over the wire before the bank's data)
- [ ] Every mode, every question format, the mock, the arcade, narration, the podcast card, pins, reports, the drill, the eggs and Timmy work on the preview (UAT checklist), phone and laptop, light and dark
- [ ] The inspector passes with 0 FAIL on Home, Notes, Questions and More
- [ ] The rule, About page and [build-a-hub](../how-to/build-a-hub.md) changes written into the [release note](2026-11-06-redesign-release.md); the hub note says how the new version is built and kept in step with the live one
- [ ] CI passes (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`, `node tools/release/run.js`)
- [ ] Preview link, phone and laptop screenshots, and Sam's look ("Sam approved this release" ticked by Sam)
- [ ] Vault written back (hub notes, decisions, `DEPLOY_NOTES.md`, the About page, this note's Outcome)

## Log

- 2026-11-05: written from the agreed plan.

## Outcome
