# Boards hub sources

Everything students see at `hubs/boards/` is built from this folder. **`hubs/boards/index.html` is generated:** never
edit it by hand. Edit the files here, run the build, and commit both the sources and the rebuilt page. A merge conflict
in `hubs/boards/index.html` is resolved in the sources, then by rebuilding (never by picking a side of the page).

The plan and the rules behind it: `docs/boards/BUILD_SPEC.md` (sections 1, 2, 4 and 5 for this folder) and
`docs/boards/PLAN_V2.md`.

## Build

Node 22, no dependencies, from the repo root (Windows paths and CRLF checkouts work too):

```bash
node tools/build-boards.js                  # validate, then write hubs/boards/index.html
node tools/build-boards.js --check          # what CI runs first: build in memory, fail if the committed page is stale
node tools/build-boards.js --unit medcx     # validate one unit and print its counts (writes nothing)
node tools/build-boards.js --report         # also print the blueprint report (FK x CC, case share, cue/negative rates)
node tools/build-boards.js --include-drafts # local preview with unchecked items and preview units; never commit it
node tools/build-boards.js --help
```

The build fails, and writes nothing, on any lint error (the BUILD_SPEC 4.7 rules, shared with
`tools/boards/lint-items.mjs` through `tools/boards/lint-core.cjs`), on a notes problem (unknown section, Core and
Deep dive with different section ids, a `data-ref` to a missing or unverified fact, unbalanced tags, British
spelling), or when the page is over 3.5 MB. Warnings are printed for the author and the verifier.

Before handing off a change, run the same chain as CI:

```bash
node tools/build-boards.js --check && node tools/ci/syntax.js && node tools/ci/smoke.js
node tools/boards/lint-items.mjs          # item and fact checks on their own (all units, or pass item files)
```

## What is here

| Path | What it is |
|---|---|
| `config.js` | Hub id `boards`, title, `UNITS` (teaching order; a unit is built only when it is listed), `ENABLED_TYPES` (`['mcq']` in release 1), spaced-review settings (copied to `window.SH_SRS`), daily budget, exam-block timing, the five modes and their sub-views, size limits |
| `shell.html` | The page skeleton with `{{SLOT}}` placeholders the build fills: banner, head, mode tabs, panels, one `<style>`, one `<script>`, the widget tag |
| `css/` | `tokens.css` (light and dark colors, fonts; token names the shared widget reads), `base.css`, then the rest in name order, `phone.css` last |
| `app/` | Concatenated in name order into the page's one inline script, after the data. `99-export.js` must stay last: it ends with `window.SH_EXPORT = {`, which the CI lint hook looks for (exactly once in the page) |
| `facts/` | The fact records questions cite in `refs` (`facts/README.md`). A cited fact must exist and must not be `unverified` |
| `units/<unit>/` | One folder per unit (added as units are written): `unit.js`, `items.js`, `notes.core.html`, `notes.deep.html` |
| `figures/<key>.js` | Code-drawn SVG figures (`module.exports = {key, alt, svg(opts)}`), when the first ones are drawn |
| `game/<bundle>/*.js` | Chairside sources, built into `hubs/boards/game/<bundle>.js` (none yet) |

## Units and publishing

A unit folder holds:

- `unit.js`: `module.exports = { id, num, title, short, exam: ['inbde', 'adex'], status: 'taught' | 'preview', audio: false, added: 'YYYY-MM-DD' }`
- `items.js`: `module.exports = { items: [...], cases: [...] }`, one item per block, schema in BUILD_SPEC 4.4. Item ids
  are `b-<unit>-NNNN` and cases `c-<unit>-NNNN`; ids are never reused.
- `notes.core.html` and `notes.deep.html`: HTML fragments, markup in BUILD_SPEC 5.2. Both have the same
  `<section id="<unit>-<slug>" data-sec="<unit>-<slug>">` blocks in the same order.

What reaches the page: units listed in `config.UNITS` with `status: 'taught'`, and only the items and cases that
passed verification (`checked` set). A case is published only when it and all of its items are checked. Drafts stay
in the sources. With no published units the hub shows its "first units coming soon" state in every mode.

To add a unit: create its folder, add its id to `UNITS`, run `node tools/build-boards.js --unit <id>` until it is
clean, then rebuild the page.

## Test fixtures

`tools/ci/fixtures/boards/units/` re-exports the benchmark items as five units so the item, case and notes pipeline
can be built without publishing them (see its README). Build them to a scratch file, never over the real hub:

```bash
node tools/build-boards.js --units-dir tools/ci/fixtures/boards/units --out /tmp/boards-fixture/index.html
```

## Rules that apply here

- American English everywhere (color, center, labeled, anesthesia, pediatric); the build fails on British spellings.
- No copied exam, prep-company or course material; every question cites a fact record or an `https://` source.
- No narration in release 1 (`audio: false`); the smoke test skips narration checks for those units.
- Student-visible changes also go on the About page (`about/index.html`) in the same PR (CLAUDE.md).
