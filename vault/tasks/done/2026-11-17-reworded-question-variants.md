---
type: task
status: done
hub: perio
created: 2026-11-17
requested-by: Sam
due: 
waiting-on: 
agent: Claude Code
pr: 
---

# Two or more wordings of every question

## Goal

Sam, 2026-11-17: "each question and answer is reworded two or potentially more ways. it still counts as the same
question, but fights against memorizing the answers so you have to actually think about what the answer is. how much
extra size, processing, token usage, etc would this use?"

Each question gets one or two extra wordings of its stem and choices (with their whys). A student sees a different
wording on a later try, so a remembered sentence or choice shape stops giving the answer away. It stays **the same
question**: same id, same key, same class stats ([question-ids-are-permanent](../../rules/question-ids-are-permanent.md)).

## What it costs (worked out 2026-11-17, from the live banks)

| Hub | Questions | `questions.json` now | Stem + choices + whys | Two extra wordings add |
|---|---|---|---|---|
| Perio | 675 | 772 KB (185 KB gzipped) | 412 KB | about 820 KB raw, about 200 KB gzipped |
| Occlusion | 845 | 861 KB (197 KB gzipped) | 493 KB | about 990 KB raw, about 220 KB gzipped |
| Heme & Endo Exam 3 | 290 | 347 KB (77 KB gzipped) | 184 KB | about 370 KB raw, about 80 KB gzipped |

- **Size:** a bank roughly doubles (one extra wording: +50-60%). Next to the site's 1 GB limit it is nothing (the mp3s are
  nearly all of it: [archived-hubs-drop-their-audio](../../rules/archived-hubs-drop-their-audio.md)). What students feel is
  the download: put the wordings in their own file (`content/variants.json`), fetched the first time the bank, the mock or
  a bank game opens, so Home and the notes don't pay for it, and keep it out of the service worker's first precache.
- **Processing on the page:** none to speak of. Picking a wording is a lookup (the try count, or a seed of the id and the
  day). Nothing changes on the server **if every wording keeps the same choices in the same order** (choice k of a
  wording is choice k reworded): the answer keys (`question_keys`), XP and the mock's scoring stay as they are. Choices are
  already shuffled on screen for ordinary MCQs, so the order never shows.
- **Tokens, once, to write them:** about 300-400 output tokens a wording (stem, 4-5 choices, a why for each), so about
  470K output tokens for Perio's two extra wordings, 600K for Occlusion's, 200K for Heme & Endo 3's. Reading the notes and
  questions lecture by lecture adds about as much input. Every wording then needs the same accuracy check as a new
  question (the 2026-11-17 Perio audit was six reviewers, one per one or two sessions): count about **1.5-2 million tokens a
  hub** in all, a few hours of agent time, most of it in checking, not writing. Keeping them up costs a little more on every
  later question edit: a fix to a question is a fix to each of its wordings.
- **Tokens while studying:** none. Nothing is generated live; Ask Timmy is unchanged (it gets the wording on screen).

## How it should work

- **Data:** `variants.json` maps a question id to a list of wordings, each `{ stem, choices, why }` (and `ex` only if the
  explanation quotes the stem). `tools/hub-next/build.mjs` checks every wording: same number of choices, every choice has a
  why, the key isn't the longest choice in more than 40% of a hub's wordings, two-statement and numbered keys keep their
  truth values (a reworded statement says the same thing). Smoke's lint runs on each wording.
- **Which wording:** the first try uses the original; each later try (the drill, misses, weak spots, the mock, the arcade's
  bank games, Learn and Flashcards) takes the next wording. Search and Find-this-in-the-notes use the original.
- **Question health** ([question-health](../../reference/question-health.md)) fingerprints what a question shows, so as it
  stands each wording would count as a new version and split its numbers three ways (each needs 10 people before a
  flag). Fingerprint the original wording plus the list of wordings instead, and record which wording was shown on each
  answer (a small column on the answer row: a migration). That also gives a free check: a wording much harder or easier
  than its siblings is a wording problem, a new kind of question-health flag.
- **Reports:** a report says which wording the student saw.
- **Which questions first:** the ones students answer most and get right on repeat tries fastest (the ones most likely
  memorized: `question_stats`), then the rest. Matching, ordering and recall items can wait (their items are short terms).
- **Rules that apply to each wording:** [every-choice-gets-a-why](../../rules/every-choice-gets-a-why.md),
  [two-statement-and-true-false](../../rules/two-statement-and-true-false.md),
  [numbered-statements](../../rules/numbered-statements.md), [graded-coursework](../../rules/graded-coursework.md) (never a
  graded item's wording), [american-english](../../rules/american-english.md).

## Done when

- [x] Sam has picked the first hub (a live hub before its exam, or the next hub as it is built) and one or two extra wordings (Perio, one: 2026-11-18)
- [x] `variants.json` format, its build checks and the smoke lint on every wording
- [x] The engine shows the next wording on later tries (bank, drill, misses, weak spots, mock, arcade bank games, Learn, Flashcards)
- [x] Question health: the fingerprint ignores wordings (it fingerprints the original, SH_EXPORT, as before)
- [x] The wording shown is recorded on each answer (a migration, its tests, the event taxonomy row), then a question-health flag for a wording much harder or easier than its sibling (`migration_v65.sql`, 2026-11-18: A/B, the class split by device)
- [x] The first hub's wordings written and checked against its notes and hints
- [x] About page entry ("Questions come back reworded")
- [x] CI passes (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`), release suites (a tier 2 change)
- [x] Vault written back (hub note, decisions, this note's Outcome)

## Log

- 2026-11-17: written from Sam's request, with the estimate above (bank sizes measured from `hubs/*/content/questions.json`).
- 2026-11-18: Sam settled the scope: "lets also do the reworded questions. do one extra wording and only do it for perio"
  ([decisions](../../decisions.md)). Built and shipped for Perio before its final (2026-11-19) (#405).
- 2026-11-18: Sam: "Do the database change. They are A/B versions of questions", and "Split the class": the A/B split,
  `migration_v66.sql` and the `ab_gap` flag.

## Outcome

Perio, 2026-11-18 (stacked on #402). `hubs/perio/content/variants.json`: one extra wording of each of the 652 questions with
choices (`{ id: { stem, choices, why } }`; the format also takes a list of wordings, and `ex` when needed). Matching,
ordering and recall keep their one wording. Written session by session from `notes.json` and the hints by 14 writer
agents, then checked by 14 independent reviewers against the notes (same key and truth values, accurate, not giving the
answer away): they changed 97. 447 KB raw, 134 KB gzipped.

- **Engine:** `worded(q, n)` in `widget/hub.js`: try 1 the original, then the next wording (n = the tries so far; Flashcards
  pass their review count). `card()` calls it (bank, drill, misses, weak spots, mock, Learn); so do Flashcards
  (`widget/study-modes.js`), the shared games (`widget/games.js` through `window.shHub.worded`) and Perio's own
  (`arcade.js` `dealMCQ`). A worded copy carries `_base` and `_w`; the card has `data-wording` and says "reworded" on its top line.
  `variants.json` is fetched with the Questions view or the arcade (`needVariants`, only when `core.json` has `variants`),
  never with Home or the notes, and isn't in `sw.js`'s precache.
- **Kept on the original:** search, Find this in the notes, `SH_EXPORT`, question health's fingerprint, the answer keys.
- **Reports** carry "reworded: wording 2" (`widget/v3.js`); **Ask Timmy** sends `ask.w`, and the function swaps the wording in
  (`wordingOf`, `loadVariants`; test in `tools/timmy/test.mjs`). The function changed, so After merge deploys it.
- **Checks:** `checkVariants` in `tools/hub-next/build.mjs` (choice and why counts, statement labels and counts, a changed
  stem, the key-longest rate) and `lintWordings` in `tools/ci/smoke.js`. No High yield changed.
- **A/B** (the second PR, `migration_v66.sql`): each device starts each question on A or B (`abStart()`), later tries
  alternate, and a mock keeps its versions until submitted. The card's `data-wording` (0 = A, 1 = B) goes with each
  question-health row (`question_events.w`); `qh_report`'s `wordings` splits first tries by version, and `ab_gap` flags a
  pair 20+ points apart (z ≥ 1.96, 10+ people a version). The admin page shows both versions' numbers and B's text.
- **Editing a Perio question from now on** means editing its wording in `variants.json` too (the hub note says so).

Related: [question-health](../../reference/question-health.md) · [build-a-hub](../../how-to/build-a-hub.md) ·
[question-ids-are-permanent](../../rules/question-ids-are-permanent.md) · [how tasks work](../README.md)
