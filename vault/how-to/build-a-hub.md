---
type: how-to
tags: [how-to, hubs]
---

# Build a hub, or add a lecture to one

The checklist for a new hub on the engine (Heme & Endo Exam 3, a course-exam hub with figures, an arcade, a study guide and narration, is the one to read: its page came down 2026-11-20 and is in git, `git worktree add <dir> b0057d1`, [its note](../hubs/heme-endo-exam3.md); Review of Systems, `hubs/review-of-systems/`, is the one on the site, a review hub of many courses with no figures, arcade or recordings; Perio's, the first, came down 2026-11-19: [its note](../hubs/perio.md)). Every note in `vault/rules/` applies; this note says
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

Since the redesign's release (2026-11) every hub runs on the shared engine (`widget/hub.js` and its three parts,
`widget/hub.css`); nobody copies a hub file any more. A hub is **a small page of settings and its content as JSON**.

- **The page**, `hubs/<hub-id>/index.html`: copy `hubs/review-of-systems/index.html` (or Exam 3's, from git, for a hub with figures and an arcade) and change its words. It holds the head
  tags, `window.SH_HUB` (hub id, name, a new state key `<slug>-state-v1` and answered event `<slug>:answered`, the exam,
  and the hub's own wording for Home, Notes, hints, the mock and the arcade), then `widget/hub-art/<hub-id>.js` and
  `widget/hub.bundle.js`. Nothing else goes in the page.
- **The content**, `hubs/<hub-id>/content/`: `core.json` (lectures with `id`, `num`, `title`, `who`, `status` taught /
  slides / upcoming, `tag`, and `from` when the lecture's line under its title shouldn't read "recording and slides" or
  "slides only", e.g. "recording only" for a lecture whose slides couldn't be read; `examInfo`, `courseDates`, `likelyTopics`, the mock blueprint (and, if you want it, `mock.likelyShare`, 0-1:
  about that share of each lecture's mock questions from its High likelihood ones; Occlusion's final used 0.75), `examCounts` if counts per
  lecture were announced, the podcast), `questions.json` (every question, each with `src` and its `why`),
  `notes.json` (`full` and `plain`), `study.json` (hints quoted from the recordings, the cram sheet, the Side by side
  tables and processes, the arcade's sort sets), `figures.js/css` and `arcade.js/css`. **The JSON is the source**: edit
  it by hand or with a script, then run `node tools/hub-next/build.mjs`, which rebuilds the question index and each
  lecture's High yield and writes the files in one layout (CI's `--check` fails on a stale one). Its header lists every
  file.
- **The engine owns** the frame, Home ([hub-home-page](../rules/hub-home-page.md)), the question card, the bank and its
  filter panel ([question-bank-filter-panel](../rules/question-bank-filter-panel.md)), Learn and Flashcards, the rewards,
  the mock, More and the settings. A hub never copies or patches them: a change for every hub goes in the engine (the
  top of `widget/hub.js` says which file holds what), then `node tools/bundle/build.mjs`
  ([bundles](../reference/bundles.md)).
- **Its own drawn art** ([every-hub-gets-its-own-art](../rules/every-hub-gets-its-own-art.md)): an emblem, a masthead
  scene, a mastery medal set and the arcade lobby's drawings unique to the hub, plus its tint (the hub's color: there is
  no palette or type trio to pick any more), drawn in SVG in Timmy's ink in `tools/figures/site/` (then
  `node tools/figures/site/build.mjs`, which writes `widget/hub-art/<hub-id>.js` once `hubs/<hub-id>/index.html` exists,
  and deletes it when the page comes down). Never another hub's art, a recolored
  copy or the generic placeholder; Sam sees it in screenshots (and the hub's preview, if Sam asks for one).
  **The page takes the tint from `widget/hub.css`**, not from the art: add the hub's line beside Review of Systems'
  (`:root[data-hx-hub="<hub-id>"], .hx[data-hub="<hub-id>"]` with its `--hub`, `--hub-mid`, `--hub-light`, `--hub-dark` from
  `style.mjs`; the ink 4.5:1 or more on its light, or a deeper `--hub-text`), then the bundles. Without it the page draws in
  the default grey-purple, as Review of Systems did for its first three days ([BUG-198](../release/bug-log.md)).
- **Questions:** every choice with its why ([every-choice-gets-a-why](../rules/every-choice-gets-a-why.md)),
  `likelyTopics` ([high-likelihood-topics](../rules/high-likelihood-topics.md)), and per taught lecture about 5
  two-statement, 8 true/false and 3-5 numbered-statement items
  ([two-statement-and-true-false](../rules/two-statement-and-true-false.md), [numbered-statements](../rules/numbered-statements.md));
  the correct answer is the longest choice in no more than 40% of MCQs.
- **Narration:** a Kokoro mp3 for every lecture at all three levels in `hubs/<hub-id>/audio/`
  ([narrate-with-kokoro](narrate-with-kokoro.md)): As taught and Plain English, then High yield
  (`python3 tools/narrate.py hubs/<hub-id>/content/notes.json --level hy`) and the content build again, which notes
  which lectures' High yield is recorded ([text-and-audio-never-drift](../rules/text-and-audio-never-drift.md)).
- **Diagrams:** a diagram review, each candidate put to Sam separately before anything is drawn
  ([diagram-review](../rules/diagram-review.md)); approved figures are built in `tools/figures/<hub-id>/`
  ([diagrams-anima](../rules/diagrams-anima.md)), which writes `content/figures.js` and `figures.css`. Figure text is
  11 px at the smallest.
- **Arcade:** the games list is `SH_HUB.arcade.games`, the hub's pick `arcade.first`, and its skin `content/arcade.js`
  and `arcade.css`, with the hub's own names, story and art ([arcade-skins](../rules/arcade-skins.md)).
  Starting from Exam 3's `content/arcade.js` (git, `b0057d1`): **leave out its own lobby**, which the engine never shows
  (checked 2026-11-20). More's Arcade is drawn by `moreArcade()` in `widget/hub.js`, and every game's Back, the game-over
  card's Arcade button included, goes to that lobby (the engine takes the click before the game's own handler), so
  `renderLobby()`, `renderBoards()` (the per-game top-ten boards, `.ar-board-grid`; Perio's `.ar-board-tabs`),
  `thumbTile()`, the lobby's mute button and their `.ar-hero` / `.ar-board*` / `.ar-tile` styles in `arcade.css` are dead
  code there; `startGame()`'s "still loading" fallback toasts without drawing a lobby, and `bindCommon()`'s Back only has
  to leave full screen. The only class board a game shows is the game-over card's top five (`.gm-lb`), where a name opens
  that classmate's place. The return value the engine needs is `{ startGame, stopAll, current }`.
  **A small phone:** `widget/games.css` keeps every game inside a 320 px phone at XX-Large (220 px of layout; the 2026-11-20
  sweep of Exam 3's six games): the dark panel bleeds by the page's gutter, not `arcade.css`'s 20 px; a sort game's two
  bins (`.ss-bins`) stay equal halves; the crossword sizes its cells from its stage (`cqi`, not `100vw`, which the text
  size's zoom makes too wide); Showdown's columns show only the lecture's tag; Smile's marquee stacks and a long intro
  keeps its Play button in view. A hub's own game in `arcade.js` needs the same care: a grid of `1fr` columns is
  `minmax(0, 1fr)`, a size from `vw` is from the stage. `tools/ci/smoke.js` opens and starts every game at that size
  and fails on sideways scroll, and checks a visit from the game-over board.
- **Patient Box cases** go in `core.json`'s `pcases` ([draw-a-patient-box-case](draw-a-patient-box-case.md)).

## Wire it into the site, in the same PR

- `hubs.js` (the dashboard's hubs, edited by hand): the hub's entry under `hubs` (its class, title, exams and dates,
  what it covers; `checkinHour` / `archiveHour` when an exam closes late), its class under `classes` if it's new, and
  its short name under `labels`.
- `sw.js`: the hub in `HUBS`, and bump `VERSION` (`node tools/ci/syntax.js` fails a live engine hub that isn't there).
- `review/index.html`: `HUB_LABEL`, `HUB_COLOR`, `HUB_TITLE`. `tools/publish-recap.js`: `HUB_COLOR`, `HUB_TITLE`.
- `widget/ranks.js`: its name in `HUB_NAMES` and its medal (emblem and ribbon colors) in `HUB_MEDAL`.
- `tools/release/budgets.json`: a row for `hubs/<hub-id>/`.
- `about/index.html`: anything students can see that's new: a game, a question type, a kind of figure
  ([about-page](../rules/about-page.md)); then `node tools/timmy/build.mjs` (Ask Timmy's site help).
- Optional: `assets/og-<hub-id>.png`, the link-preview image.
- Only for new arcade game ids: a migration adding them to the arcade's list of games (as `migration_v40.sql` did).
- **After the merge, the hub's answer keys load by themselves** (below): until they do, its answers are recorded but earn no XP.

## The answer keys (after every merged change to a hub's questions)

The server grades answers and pays XP from its own copy of each hub's keys ([game-server](../reference/game-server.md)).
After a PR that adds, edits, retires or re-keys a question is merged, the **After merge** workflow loads that hub's keys
again by itself ([after-a-merge](after-a-merge.md), since 2026-11-15); check its result on `main`. By hand (a failed run, a
session that can't wait for it): **`node tools/xp/keys.js <hub-id> --load`** loads them (it needs `SB_KEY` and `ADMIN_SECRET` in the environment and
prints the count, which should be the hub's question count); without them, `--sql` prints one statement for the
Supabase connector (put the admin secret in by hand, never in a file: [secrets](../rules/secrets.md)). Until it's loaded a new question is recorded but earns nothing,
and an edited one is graded against the key it had before, so do it in the same sitting as the merge. A page a
student still has open from before the edit is graded against the key it showed.

## Write back, in the same PR

- `vault/hubs/<hub-id>.md` from [the hub template](../templates/hub.md), and a line under Live in [home](../home.md).
  (CI fails a hub folder without its note.)
- Sam's diagram calls in [decisions](../decisions.md); lectures or figures still to come as task notes.
- A "Recent major changes" entry in `DEPLOY_NOTES.md`.

## Check

`node tools/ci/syntax.js`, `node tools/ci/vault.js` and `node tools/ci/smoke.js`: the smoke test clicks through the
hubs you changed (all of them when a shared file changed) on desktop and phone and fails on missing formats, whys, predicted topics or narration files; `node tools/hub-next/build.mjs --check` fails on content that wasn't rebuilt. Its first local run
writes the hub's question-id registry, `tools/question-ids/<hub-id>.txt`: commit it
([question-ids-are-permanent](../rules/question-ids-are-permanent.md)).

**Read every answer key before the PR** (Sam, 2026-11-24: "adding the answer key step is good"). The lint checks that a key
is in range and that every choice has a why, but not that the key points at the right choice: Review of Systems shipped
with 51 of Head & Neck's 68 single-answer keys one choice past the answer their own explanations gave, and the class found
them in its first two days ([LESSONS.md](../../LESSONS.md)). For every new or redrafted question, read the stem, the keyed
choice, the explanation and every why together, and check that the keyed choice is the one they call right (for EXCEPT
and which-is-false items, the false one). Give it to agents, one per course or about 200 questions, each asked only to
read keys against explanations and whys and list the ids that disagree with the right choice (2-4 minutes a course); read
each listed question yourself before changing a key. Single-answer formats need it most: a true/false, two-statement or
numbered choice says what it means in its own words, an index doesn't. A key fixed after students answered also needs the
class's numbers recounted after the merge, as `tools/data-fixes/2026-11-24-review-of-systems-keys.sql` did.

Then a draft PR ([ship-a-change](ship-a-change.md)).

## Adding a lecture

Adding a lecture to a live hub, or taking one from slides-only to taught, needs all of this in one PR, in the hub's
`content/` (then `node tools/hub-next/build.mjs`):
- its entry in `core.json`'s `lectures` and its `status` (a `note` explains anything partial);
- notes at both written levels and all three mp3s (High yield is built from the notes, then recorded:
  [text-and-audio-never-drift](../rules/text-and-audio-never-drift.md));
- exam hints quoted from the recording, and its `likelyTopics` entries ranked with the rest;
- questions in all three extra formats, each choice with its why, and every key read against its explanation and whys (Check, above);
- Side by side tables, cram lines, arcade words or sort sets (`study.json`);
- the mock blueprint, `examInfo` and `courseDates` if the exam's scope or dates change (and the exam's date in `hubs.js`);
- a diagram review for the new lecture, put to Sam;
- the hub note's pending work, and the task note if there was one;
- after the merge, the hub's answer keys (above).

## Gotchas from earlier builds

- **Text in the data is plain text** (`&`, not `&amp;`): the same title often goes through both `innerHTML` and an
  escaping helper, and an entity typed into the data shows up as `&amp;` in the second.
- **Never type a total** (how many questions, a lecture's count) into the hub's wording: the next added question makes
  it wrong. Grep for the old number when you add items.
- **One answer path.** Every answer goes through the engine's choke point (it records stats, spaced review, XP and
  class data, and fires the answered event); a new mode or game calls it rather than keeping its own progress.
- **Phones:** at 390 px wide the page must not scroll sideways. The usual cause is a grid or flex child without
  `min-width:0`, or a fixed minimum (`minmax(300px, 1fr)`, `min-width: 220px`): write `min(300px, 100%)`. Don't size
  anything with `vw`, `vh` or `dvh` (an overlay, a dialog, a menu): the text-size setting zooms `<html>`, and they come out
  up to 45% bigger than the screen. Use `%` for a fixed box or a modal dialog (its box is the screen) and a container's
  `cqw`/`cqh` inside one, then check at 320 px with XX-Large text (BUG-168 and BUG-184 to BUG-188 in the
  [bug log](../release/bug-log.md)).
- **Controls of a figure inside the notes** never use `data-go`, `data-view`, `data-tab`, `data-sub`, `data-mode`,
  `data-lec` or `data-group`: the notes and the widget read those as navigation.
- **One-time flags that move returning visitors** stay out of `defaultState()` ([hub-home-page](../rules/hub-home-page.md)).
- **A painted backdrop** (escape room, stage) means measuring every hotspot onto it again (`api.spot()`).
- **Motion:** keep the reduced-motion rule the engine has; never add an animation that ignores it.

Related: [home](../home.md) · [ship-a-change](ship-a-change.md) · [hub template](../templates/hub.md) ·
[repo map](../reference/repo-map.md) · [game-server](../reference/game-server.md)
