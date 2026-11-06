---
type: how-to
tags: [how-to, hubs]
---

# Build a hub, or add a lecture to one

The checklist for a new hub, gathered from how the last ones were built (PCD Implants Exam 1 and Special Patient Care:
grep their "new hub" entries in `DEPLOY_NOTES.md` for the details). Every note in `vault/rules/` applies; this note says
where each piece goes. Adding a lecture to a live hub: the last section.

## Before you start

1. `LESSONS.md`: if its "Last refreshed" date isn't today, run steps 1-3 of `tools/lessons-refresh.md` first, then read
   it ([archiving-is-a-retrospective](../rules/archiving-is-a-retrospective.md)). It holds what the class used and where it
   struggled.
2. Sources: the course's Drive folder (recordings, slides, handouts, the professor's hint list, in-class reviews), or a
   Claude Project's docs. Read them; never commit them. Graded quizzes, crosswords, take-homes and exams are never copied,
   closed ones are context only, open ones aren't used at all, previous years' never
   ([graded-coursework](../rules/graded-coursework.md)). Questions are written by the hub, in new wording.
3. The exam: date, time, window, format, question count, counts per lecture if announced.

## Build it

- **Start from the shared engine.** Copy an extracted hub shell, not its old inline engine. Keep the hub's markup,
  identity, configuration and small bridge in `hubs/<hub-id>/index.html`; load `../../widget/hub.css` after the
  hub's token/preamble styles and before its local tail styles, and `../../widget/hub.js` before the strict hub IIFE.
  Bind the hub's local configuration and data through `window.shHubBind`; do not fork the shared renderer or styles.
  It already has: Home first ([hub-home-page](../rules/hub-home-page.md)), the filter panel
  ([question-bank-filter-panel](../rules/question-bank-filter-panel.md)), the question helpers `mq()`, `mm()`, `two()`,
  `tf()`, `nums()` with a why for every choice ([every-choice-gets-a-why](../rules/every-choice-gets-a-why.md)),
  `LIKELY_TOPICS` ([high-likelihood-topics](../rules/high-likelihood-topics.md)), Try it again, the mock, and the hooks
  the shared widget needs (`SH_SYNC`, `SH_DRILL`, `SH_PINS`, `SH_GOTO`, `SH_EXPORT`).
- **Its own identity:** a new palette and type trio (tokens in the light, OS-dark and `[data-theme="dark"]` blocks), a
  plain name ("<Subject> Hub"), a new state key (`<slug>-state-v1`) and answered event (`<slug>:answered`). The widget's
  script tag carries `data-hub="<hub-id>"`, `data-answered-event` and `data-default-mode="home"`.
- **Data:** use `hubs/<hub-id>/content/manifest.json` and its `core.json`, `questions.json`, `whys.json`,
  `notes.json`, `review.json`, `study.json`, `cases.json` and `figures.json` files. `core.json` carries
  `LECTURES` (`id`, `num`, `title`, `who`, `status` taught / slides / upcoming, `tag`), exam settings and the
  compact question index that lets Home load quickly; the full bank stays in `questions.json` and loads when a bank,
  mock, arcade or drill needs it. Keep every question id exactly as registered. Put notes at both levels
  (`readings`, `readingsPlain`) in `notes.json`; put hints, `LIKELY_TOPICS` and cram in `study.json`; put Review
  tables and sequences in `review.json`. Let `window.shHubContent` load a group on demand instead of adding an
  inline copy of it.
- **Questions per taught lecture:** about 5 two-statement, 8 true/false and 3-5 numbered-statement items
  ([two-statement-and-true-false](../rules/two-statement-and-true-false.md), [numbered-statements](../rules/numbered-statements.md));
  the correct answer is the longest choice in no more than 40% of MCQs.
- **Narration:** `tools/narrate.py` reads `content/notes.json`; keep a Kokoro mp3 for every lecture at both levels
  in `hubs/<hub-id>/audio/` and regenerate it whenever either note level changes
  ([narrate-with-kokoro](narrate-with-kokoro.md)).
- **Diagrams:** a diagram review, each candidate put to Sam separately before anything is drawn
  ([diagram-review](../rules/diagram-review.md)); approved figures are built in `tools/figures/<hub-id>/` and their
  generated marker blocks land in `hubs/<hub-id>/figures/`, listed as `figureAssets` in the content manifest so the
  engine loads them with the figures, not with Home ([diagrams-anima](../rules/diagrams-anima.md)).
- **Arcade:** load `widget/games.js` and build the context like Occlusion's (`CTX` in its ARCADE), with the hub's own
  skin, names and art ([arcade-skins](../rules/arcade-skins.md)).
- **Keep the widget's hooks** and a new hub gets the shared features (answer animations, Daily Drill, sync, pins, tours,
  highlighter, Listen dock, ranks, eggs) with no extra work: `window.SH_EXPORT = {` as the last statement of the script
  (lectures with `who` and `status`, questions, hints, exams, sections), `.qcard` / `.qcard-choice` and their state
  classes, `#countdownPill`, `.notes-layout` with `.lec-nav` and `article.reading`, `.reading-prose`, `.sh-tts-btn`,
  `.btn.primary` and `.bar i`, and `sh:mock-done` with `byLec`.

## Wire it into the site, in the same PR

- `index.html` (the dashboard): a `HUBS` entry (exams and dates, `stateKey`, modes; `checkinHour` / `promptHour` /
  `archiveHour` when the exam closes late), its class in `CLASSES` (and ring), `ARCADES`, `HUB_LABEL` and `HUB_RING`,
  and the `<noscript>` list of hubs.
- `review/index.html`: `HUB_LABEL`, `HUB_COLOR`, `HUB_TITLE`. `tools/publish-recap.js`: `HUB_COLOR`, `HUB_TITLE`.
- `widget/ranks.js`: its name in `HUB_NAMES` and its medal (emblem and ribbon colors) in `HUB_MEDAL`.
- `sw.js`: the hub in the precache list, and bump `VERSION`.
- `about/index.html`: anything students can see that's new: a mode, a game, a question type, a kind of figure
  ([about-page](../rules/about-page.md)).
- Optional: `assets/og-<hub-id>.png`, the link-preview image.
- Only for new arcade game ids: a migration adding them to `submit_arcade_score`'s list (as `migration_v40.sql` did).

## Write back, in the same PR

- `vault/hubs/<hub-id>.md` from [the hub template](../templates/hub.md), and a line under Live in [home](../home.md).
  (CI fails a hub folder without its note.)
- Sam's diagram calls in [decisions](../decisions.md); lectures or figures still to come as task notes.
- A "Recent major changes" entry in `DEPLOY_NOTES.md`.

## Check

`node tools/ci/syntax.js`, `node tools/ci/vault.js` and `node tools/ci/smoke.js`: the smoke test waits for an
extracted hub's content promise, then clicks through every hub on desktop and phone and fails on missing formats, whys,
`LIKELY_TOPICS` or narration files. Run `node tools/hub-content/extract.mjs --check` and the applicable
`tools/figures/<hub-id>/build.mjs --check` too. Its first local run writes the hub's question-id registry,
`tools/question-ids/<hub-id>.txt`: commit it ([question-ids-are-permanent](../rules/question-ids-are-permanent.md)).
Then run the release suite for a shared-engine change and open a draft PR ([ship-a-change](ship-a-change.md)).

## Adding a lecture

Adding a lecture to a live hub, or taking one from slides-only to taught, needs all of this in one PR:
- its `LECTURES` entry and `status` (a `note` explains anything partial);
- notes at both levels and both mp3s ([text-and-audio-never-drift](../rules/text-and-audio-never-drift.md));
- exam hints quoted from the recording, and its `LIKELY_TOPICS` entries ranked with the rest;
- questions in all three extra formats, each choice with its why;
- Review tables, cram lines, arcade words or sort sets;
- `MOCK_BLUEPRINT`, `EXAM_INFO` and `COURSE_DATES` if the exam's scope or dates change;
- a diagram review for the new lecture, put to Sam;
- the hub note's pending work, and the task note if there was one.

## Gotchas from earlier builds

- **Text in the data is plain text** (`&`, not `&amp;`): the same title often goes through both `innerHTML` and an
  escaping helper, and an entity typed into the data shows up as `&amp;` in the second.
- **Compute any total from its array** (`QUESTIONS.length`, a lecture's count), never type it: the next added question
  makes a typed number wrong. Grep for the old number when you add items.
- **One answer path.** Every answer goes through the engine's choke point (it records stats, spaced review, XP and
  class data, and fires the answered event); a new mode or game calls it rather than keeping its own progress.
- **Phones:** at 390 px wide the page must not scroll sideways. The usual cause is a grid or flex child without
  `min-width:0`. Don't size a fixed overlay with `vh`/`vw`: the text-size setting zooms the page and they overshoot.
- **Controls of a figure inside the notes** never use `data-go`, `data-view`, `data-tab`, `data-sub`, `data-mode`,
  `data-lec` or `data-group`: the notes and the widget read those as navigation.
- **One-time flags that move returning visitors** stay out of `defaultState()` ([hub-home-page](../rules/hub-home-page.md)).
- **A painted backdrop** (escape room, stage) means measuring every hotspot onto it again (`api.spot()`).
- **Motion:** keep the reduced-motion rule the engine has; never add an animation that ignores it.

Related: [home](../home.md) · [ship-a-change](ship-a-change.md) · [hub template](../templates/hub.md)
