---
type: rule
tags: [diagrams]
---

# Diagrams (the anima skill)

`.claude/skills/anima/` (vendored from Garinmckayl/anima, see its `UPSTREAM.md`) draws accurate isometric SVG
figures of anatomy, cells, receptors and drug mechanisms. Use it for hub diagrams, with these house rules:

- **Building a hub, or adding lectures to one, includes a diagram review** ([diagram-review](diagram-review.md); Sam's standing rule,
  2026-10-13). Once the notes are written, list the candidates, ranked by what
  the questions test and where the class struggles (`question_stats` for a live hub). Ask Sam about **each one
  separately** with AskUserQuestion: one question per candidate, with the options Build / Skip / Change it, up to 4
  per call. Draw only what Sam approves.

- Hubs are single files, so a figure is built offline and pasted in: keep its Node build script in
  `tools/figures/<hub>/` (importing `.claude/skills/anima/kit/`) and put the static SVG and the CSS it needs into the
  hub, the way the existing drawn figures are (`FIGS`/`figHTML()`, `FIG_BY_LEC` in `occlusion` and `pcd-exam3`).
  Never load anything from `.claude/` at runtime.
- The kit's CSS switches themes on `.iso[data-theme="light"]`; hubs set `data-theme` on `<html>`, so scope it to that.
- The first ones are in MSK Exam 4: copy `tools/figures/msk-exam4/` (`shared.mjs` maps the kit's tokens onto the hub's
  palette; `build.mjs` rewrites the hub's `anima:css`/`anima:js` blocks, `--preview` writes standalone pages for anima's
  checks, `--check` fails if the blocks are stale). As root, anima's Chrome scripts need a `--no-sandbox` wrapper as `CHROME_PATH`.
  Every copy a page draws gets its own SVG ids (`uniq()` in the build), because hidden mode panels stay in the page and
  `url(#id)` would point into the first copy: give new ids the figure's prefix (`nm-`, `sc-`), and in live code or CSS
  never hard-code one (read it from the markup, or match `[id^="sc-actin-p"]`). In Review a figure goes in the group it
  belongs to, as a section of type `figs` (MSK 4: the NMJ under Drugs, the sarcomere under Muscle).
- Under a lecture's notes, figures go outside `.reading-prose` (the narrated text), so the narration doesn't drift, or
  inside the notes next to the paragraph they explain, inserted at render time in a wrapper with `data-sh-noread`
  (Occlusion's `FIG_PLACE`, 2026-10-20): the browser voice, the highlighter and note-search jumps skip it, and the
  READINGS text itself never changes. Never paste a figure into the READINGS strings.
- Occlusion's figures, case images (drawn perio charts, radiographs, intraoral views) and the "What cusp hits where?"
  game come from one plain-JS kit in `tools/figures/occlusion/` (`build.mjs` pastes it between the hub's `od:kit` /
  `od:css` markers, and the anima figures from `anima/` between the `anima:js` / `anima:css` markers; `--check` fails if
  any block is stale; `--preview` writes standalone pages for anima's checks). Contacts per Angle class are read off the help sheet's own
  pictures (`CONTACTS`). A figure's `key` is folded under the notes/Review copy (`figKeyHTML`) and opens in the explanation
  after answering (`figAfterHTML`); in-picture labels with class `fg-hint` hide while the figure sits above a question stem.
- **Picture questions never give the answer away** (Sam's standing rule, 2026-10-14). The diagram sits above the stem only
  when the question can't be answered without it (name the highlighted part, read arrow B, which suture is shown).
  Otherwise write a stem that stands on its own and set `imgAfter:true`: the diagram then opens with the explanation,
  after answering (`figAfterHTML` in `msk-exam4`/`pcd-exam3`, `figAfter` in `perio`). Also check that a diagram shown
  first doesn't draw or label the answer.
- Draw from the hub's own lecture notes: labels and numbers match what was taught, and the caption names the lecture.
  Outside sources are encouraged, for accuracy and for how the figure works, and cited
  ([outside-sources-for-figures](outside-sources-for-figures.md)); what it shows and names stays with what the lecture
  teaches ([figures-teach-the-lecture](figures-teach-the-lecture.md)).
- Run anima's own checks, look at it at 390 px wide and in both themes, and give Sam the screenshots in the PR:
  drawn figures get Sam's look before merge, as the suture diagrams did. A new kind of figure goes on the About page.
