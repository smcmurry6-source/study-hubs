# Boards hub sources

Everything students see at `hubs/boards/` comes from this folder. The hub is drawn by the engine (`widget/hub.js`, like
every hub on `main`), and its content, **`hubs/boards/content/` (`core.json`, `questions.json`, `notes.json`,
`study.json`, `facts.json`), is generated** by `tools/build-boards.js` from the units and fact records here: never edit
that JSON by hand. Edit the files here, run the build, and commit both the sources and the rebuilt content. A merge
conflict in `hubs/boards/content/` is resolved in the sources, then by rebuilding (never by picking a side of the JSON).
`hubs/boards/index.html` is the hand-written settings page (`window.SH_HUB`: the hub's wording, its answered event).

The plan and the rules behind it: `docs/boards/ENGINE_PLAN.md` (how each part maps onto the engine, and the briefs T-07
to T-17), `docs/boards/BUILD_SPEC.md` (sections 3, 4 and 5 for this folder) and `docs/boards/PLAN_V2.md`.

## Build

Node 22, no dependencies, from the repo root (Windows paths and CRLF checkouts work too):

```bash
node tools/build-boards.js                  # validate, then write hubs/boards/content/
node tools/build-boards.js --check          # what CI runs: build in memory, fail if the committed content is stale
node tools/build-boards.js --unit medcx     # validate one unit and print its counts (writes nothing)
node tools/build-boards.js --report         # also print the blueprint report (FK x CC, case share, cue/negative rates)
node tools/build-boards.js --include-drafts --out /tmp/boards-preview   # unchecked items and preview units, into a scratch folder
node tools/build-boards.js --help
```

It writes the content in two steps: the converter turns the units into the engine's shape (one lecture per unit, Core
notes as the engine's `plain` and Deep dive as its `full`, a patient box as rows, the public part of each cited fact in
`facts.json`), then `tools/hub-next/build.mjs` (its `buildFrom`) lays it out and works out the question index, as for
every hub on the engine. `--check` runs both in memory.

The build fails, and writes nothing, on any lint error (the BUILD_SPEC 4.7 rules, shared with
`tools/boards/lint-items.mjs` through `tools/boards/lint-core.cjs`), on a notes problem (unknown section, Core and
Deep dive with different section ids, a `data-ref` to a missing or unverified fact, unbalanced tags, British
spelling), on a published unit in no group (`config.js` `GROUPS`), or when the content is over 3.5 MB. Warnings are
printed for the author and the verifier.

Before handing off a change, run the same chain as CI:

```bash
node tools/build-boards.js --check && node tools/hub-next/build.mjs --check && node tools/ci/syntax.js && node tools/ci/smoke.js
node tools/boards/lint-items.mjs          # item and fact checks on their own (all units, or pass item files)
```

## What is here

| Path | What it is |
|---|---|
| `config.js` | Hub id `boards`, title, exam note, state key, `UNITS` (teaching order; a unit is built only when it is listed), `GROUPS` (the INBDE's three components and Foundation knowledge, with their units), `ENABLED_TYPES` (`['mcq']` in release 1), spaced-review and daily-plan settings (for T-12), exam-block timing, size limits |
| `app/45-readiness-plan.js` | The readiness and daily-plan core, tested by `tools/ci/boards-plan.test.js`; T-12 moves it to `widget/plan.js`. The rest of the old page (its app, CSS and shell) was retired by T-07: the engine draws the hub |
| `facts/` | The fact records questions cite in `refs` (`facts/README.md`). A cited fact must exist and must not be `unverified`. Only each cited fact's sources (name, publisher, link, date) reach `content/facts.json`; claims and quotes stay here |
| `units/<unit>/` | One folder per unit (added as units are written): `unit.js`, `items.js`, `notes.core.html`, `notes.deep.html`, `blueprint.json` |
| `figures/<key>.js` | Code-drawn SVG figures (`module.exports = {key, alt, svg(opts)}`), when the first ones are drawn (the build fails on a published one until it writes `content/figures.js`) |
| `game/<bundle>/*.js` | Chairside sources, built into `hubs/boards/game/<bundle>.js` (none yet; T-16) |

## Units and publishing

A unit folder holds:

- `unit.js`: `module.exports = { id, num, title, short, status: 'taught' | 'preview', audio: false, added: 'YYYY-MM-DD' }`.
  No exam tags: the hub is INBDE only since 2026-11-26 (`docs/boards/DECISIONS.md`), and the build notes a unit that still has one
- `items.js`: `module.exports = { items: [...], cases: [...] }`, one item per block, schema in BUILD_SPEC 4.4. Item ids
  are `b-<unit>-NNNN` and cases `c-<unit>-NNNN`; ids are never reused.
- `notes.core.html` and `notes.deep.html`: HTML fragments, markup in BUILD_SPEC 5.2. Both have the same
  `<section id="<unit>-<slug>" data-sec="<unit>-<slug>">` blocks in the same order.

What reaches the hub: every unit listed in `config.UNITS` as a lecture (a `preview` unit as `upcoming`: its title only),
the notes of the `taught` ones, and only the items and cases that passed verification (`checked` set). A case is
published only when it and all of its items are checked. Drafts stay in the sources. The engine needs at least one
lecture to draw Home and Notes, so `UNITS` lists release 1's first units (pharm, medcx) while they are still `preview`.

To add a unit: create its folder, add its id to `UNITS` and to its group in `GROUPS`, run
`node tools/build-boards.js --unit <id>` until it is clean, then rebuild.

## Test fixtures

`tools/ci/fixtures/boards/units/` re-exports the benchmark items as five units so the item, case and notes pipeline
can be built without publishing them (see its README). Build them to a scratch folder, never over the real hub (the build refuses `--units-dir` without `--out`):

```bash
node tools/build-boards.js --units-dir tools/ci/fixtures/boards/units --include-drafts --out /tmp/boards-fixture
```

## Rules that apply here

- American English everywhere (color, center, labeled, anesthesia, pediatric); the build fails on British spellings.
- No copied exam, prep-company or course material; every question cites a fact record or an `https://` source.
- No narration recordings (`core.json`'s `"audio": "off"`: Listen reads in the device's voice); no High Likelihood for now
  (`likelyTopics` is empty, and the smoke test's check skips boards).
- Student-visible changes also go on the About page (`about/index.html`) in the same PR (CLAUDE.md).
