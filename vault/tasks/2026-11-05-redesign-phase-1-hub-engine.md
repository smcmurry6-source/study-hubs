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

Extract one shared hub engine (`widget/hub.js` + `hub.css`) from the four byte-identical hubs, split a hub's content into JSON loaded on demand, and build the agreed layout (Home · Notes · Questions · More, Timmy on the bar, drill/misses/weak/mock as bank presets, the question card with its rewards, the daily goal ring, the session recap card, three Check-yourself questions per lecture, side-by-side charts next to their lecture). Built on a preview of Occlusion; Sam picks which hub goes live first when he sees it.

## Context

- The plan and Sam's decisions: [the redesign audit and plan](done/2026-11-05-redesign-audit-and-plan.md), section 4.
- Rules that matter most here: [preview-and-release-test](../rules/preview-and-release-test.md) (every phase is tier 2 or 3:
  preview link first, screenshots, the release suites, Sam's look), [about-page](../rules/about-page.md),
  [learner-data-privacy](../rules/learner-data-privacy.md), the taste skill in full (Sam, 2026-11-04).
- Hub note: [occlusion](../hubs/occlusion.md). The engine audit (what is identical, what CI depends on): the audit note, section 3.
- Rules edited in this PR: [hub-home-page](../rules/hub-home-page.md) (Home stays, as a landing page with the quick links on the first phone screen; drill, weak spots and mock as bank presets), [arcade-skins](../rules/arcade-skins.md) (one game up front, the rest behind more games), [question-bank-filter-panel](../rules/question-bank-filter-panel.md) (the presets as chips).
- Keep: `window.SH_EXPORT = {` last, the question-id registry, the lint's question shape and format minimums, the smoke test's selectors (update `tools/ci/smoke.js` with the engine), the `od:kit`/`anima:js` marker blocks (or their new per-figure files), narrate.py's READINGS format (or its new JSON reader), the preview transform's literal strings.
- Settings cut: font choice, background music, accent metal (text size and theme stay). Tour prompt cut; one-line first-use tips.

- **A parallel agent (Codex) can take the engine extraction and the content split** (`widget/hub.js`, the JSON files, CI,
  narrate.py and the preview transform) while the design session does the layout, the card and the art on top of it: agree
  the engine's module boundaries first (one PR for the extraction with no visual change, then the redesign PR on it).

## Done when

- [ ] `widget/hub.js` + `hub.css`; `hubs/occlusion/` is configuration, data (JSON), tint, emblem, masthead and arcade skin
- [ ] First load of Occlusion well under the perf budget (target: under 400 KB over the wire before the bank's data)
- [ ] Every mode, every question format, the mock, the arcade, narration, the podcast card, pins, reports, the drill, the eggs and Timmy work on the preview (UAT checklist), phone and laptop, light and dark
- [ ] The inspector passes with 0 FAIL on Home, Notes, Questions and More
- [ ] Rules and About page updated; the hub note says how a hub is built on the engine ([build-a-hub](../how-to/build-a-hub.md) rewritten)
- [ ] CI passes (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`, `node tools/release/run.js`)
- [ ] Preview link, phone and laptop screenshots, and Sam's look ("Sam approved this release" ticked by Sam)
- [ ] Vault written back (hub notes, decisions, `DEPLOY_NOTES.md`, the About page, this note's Outcome)

## Log

- 2026-11-05: written from the agreed plan.
- 2026-11-06: Sam asked for "Why each choice" to start folded after answering (it took up too much of the screen), and
  all six live hubs now do. The engine's question card keeps the whole list folded until tapped, not the plan's "your
  pick's line opened" ([decisions](../decisions.md)).

## Outcome
