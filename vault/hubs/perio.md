---
type: hub
tags: [hub, live]
hub: perio
status: live
---

# Periodontology (perio)

The D2 Periodontology course (DENT 2145), nine sessions with different professors. Midterm Oct 1 (S1-S4, done, check-in
closed); **final Thu Nov 19, cumulative**. Dates: `HUBS` in `index.html` (and `MIDTERM_DATE` / `FINAL_DATE` in the hub).

## Before you work on it

- **Source:** `hubs/perio/index.html` is the source; edit it directly. The old Perio Claude Project's split sources are
  retired (Sam, 2026-11-03), so every "Perio Project: carry ... into the split sources" line in the change log is obsolete.
- **Its own engine**, not the shared Occlusion one: the bank keeps its filters in `STATE.ui.qbank`, matching grades by
  answer text, picture questions use `figAfter`, `recordAnswer` passes select-all picks. Since 2026-11-03 it has `two()`,
  `tf()`, `nums()`, `mq()` and `mm()`.
- **Sessions** (`status`): S1-S5 taught (exempt from the format minimums, taught before the rules), S6 `preview`
  (slides only), S7 taught (Dr. Kaur), S8 taught (antibiotics from Dr. Litz's 2024 recording; host modulation and his
  dosing chart from the Nov 5 class, [task](../tasks/done/2026-11-03-perio-s8-host-modulation-class.md)), S9 taught (2026-11-10)
  from Dr. Abou-Arraj's recorded first part (posted Nov 9) plus his slides: gingival excess, altered passive eruption,
  esthetics and tattoos are from the slides and the guide until the live class is posted ([task](../tasks/2026-11-03-perio-s9-plastic-esthetics.md)). Any session going
  to taught needs the full set: [two-statement-and-true-false](../rules/two-statement-and-true-false.md),
  [numbered-statements](../rules/numbered-statements.md), [high-likelihood-topics](../rules/high-likelihood-topics.md).
- **Sources:** Drive, Periodontology/hubs (class captures, sometimes as base64 `.txt`; slide PDFs; recordings). The Drive
  connector can't download over 10 MB, so a big PDF may be text only.
- **Quiz card:** `NEXT_QUIZ` shows on Home until its date passes; set the next one there.
- **Figures:** `tools/figures/perio/` (`build.mjs` fills the `anima:js`/`anima:css` markers; `--check`, `--preview`),
  placed with `FIG_BY_LEC` / `figsHTML`. The suture diagrams are hand-drawn SVG in the hub (`SUTURE_DIAGRAMS`).
- **Patient Box cases drawn from their numbers** (since 2026-11-04, [task](../tasks/done/2026-11-04-perio-visual-case-engine.md)):
  `PCASES` in the hub (between the `pcases` markers) holds each case's box rows, its spec (per-tooth probing depths,
  recession, bleeding, suppuration, plaque, mobility, furcation, bone loss, vertical defects, calculus, crowns, root
  fillings, implants with a baseline, missing teeth), its default pictures and an `expect`. The shared kit is
  `widget/cases.js` + `widget/cases.css` (loaded in the hub's head; since 2026-11-05 it is no longer pasted into the
  hub, and `build.mjs` only handles the anima figures). It draws the chart, radiograph and buccal view from the spec,
  `derive()` works out the stage, grade, extent, recession types and peri-implant state, and `validate()` checks every
  number is realistic; `node tools/ci/cases.js` (CI, and `build.mjs --check`) fails when a case's numbers are
  unrealistic or its `expect` disagrees with them. A question names its case in `pcase`, picks its pictures with
  `pfig` (and hides a row that would give its answer away: `hide.cal`, `hide.furc`, `hide.mob`) and lists its `ref`
  links ("In the notes"). Write every new Patient Box item this way: [draw-a-patient-box-case](../how-to/draw-a-patient-box-case.md).
- **Narration:** both levels for every session, made with `python3 tools/narrate.py hubs/perio/index.html --lec <id>
  --force` (it reads perio's template-literal `READINGS['<id>']` blocks since 2026-11-05; `--text` shows what it will say); **Arcade:** the Pocket Arcade, skin `PERIO_SKIN`, painted Clinic Escape
  (`img/clinic-escape.webp`).
- **Kept as taught** after an outside fact check (2026-10-21), so don't "fix" them: molar-area CTG harvest, Kwok & Caton
  whole-dentition prognosis, stage regression only by regenerating the defect, clinic piezo can't root plane, lingual
  furcation entrance wider, Hamp as under 3 / over 3 mm / through (in class it was called "three millimeter increments").
- **The prognosis systems: two sources that disagree** (found by question health, 2026-11-05). The exam-review guide
  (`RISK_SYSTEMS`) gives McGuire & Nunn "individual teeth" and gives "likelihood of retaining the tooth" to Miller &
  McEntire; the in-class session (the notes, `PROGNOSIS_COMPARE`) says McGuire & Nunn "can be given per tooth or for the
  whole dentition" and is about whether a tooth can be maintained, "meaning kept in the mouth" ("tooth retention"). So
  don't make "retention" or "per tooth" the line between them: Miller & McEntire is molars and a number, Kwok & Caton is
  stability and the whole dentition, McGuire & Nunn is maintainability. `q3-04`, `q3-08` and `q3-S03` were rewritten that
  way (same ids); `q3-01` and `q3-05` still call McGuire & Nunn the per-tooth system, which their stems allow.

## Diagram decisions

- 2026-09-25: the Atlas mode's diagrams were removed for being inaccurate. Accuracy is the bar.
- 2026-10-14: all four candidates of the first review skipped; S5's Glickman grades, entrance map and CEP grades skipped.
  Don't re-propose these.
- 2026-11-03: six S7/S8 figures approved and built.
- 2026-11-04: all perio figures audited against the S2, S7 and S8 notes and fixed ("vet, audit, and improve all perio
  figures"). Peri-implant states: drawn to scale (15 px/mm) in a buccolingual section, with crater bone, a probe that
  bows around the crown and measured PD. Meffert: each film read against a dashed previous crest. BOP: tooth sites, Lang
  1986. Meffert and the radiograph timeline switch to a phone layout below 470 px (ResizeObserver in `live`). Strokes
  inside a `scale()` group need `vector-effect:none`, because the kit CSS makes every path non-scaling. Suture diagrams
  (`SUTURE_DIAGRAMS`): one proximal tooth behind the interdental section, periosteal anchorage labeled apical/coronal
  with the flap margin, and the horizontal mattress strand ending at a cut, not running off. The braided-thread pattern
  is now herringbone. The figure-eight "nonscalloped incisions" clause was removed because it couldn't be confirmed;
  the figure now says only "flaps will not meet closely (apically positioned flaps)". Kept after checking: sling,
  criss-cross, vertical mattress, continuous, continuous locking, and the materials chart.
- 2026-11-06: the S8 host-response flowchart, the one candidate never put to Sam, approved with "Build all proposed
  figures" and built as S8 · Fig 3 (`tools/figures/perio/hostmod.mjs`, under the S8 notes and in Review's `abx-figs`):
  Dr. Litz's flowchart as a cycle, with a no-bacteria view and where SRP, NSAIDs, bisphosphonates and Periostat act.
  Outside sources (Page & Kornman 1997, Vane 1971, Golub 1998, Caton 2000, Russell 2011) are cited in its "What's
  simplified" ([outside-sources-for-figures](../rules/outside-sources-for-figures.md)); what it names is the class's.

- 2026-11-10: all five S9 candidates approved ("Yes to all diagrams. Merge when ready") and built in
  `tools/figures/perio/` (`cairo`, `palate`, `grafts`, `ape`, `egd`), under the S9 notes (`FIG_BY_LEC`) and in the Review
  section each one illustrates: `cairo` in `s9-recession`, `palate` and `grafts` in `grafts`, `ape` in `ape`, `egd` in
  `esthetics`. Figs 4 and 5 (altered passive eruption, the gummy smile) follow the slides and the review guide: check
  them against the live class with the rest of that part of S9. Their positions in mm (where the margin, MGJ and crest
  sit; how far a longer lower third moves the teeth) are illustrative, and their labels give only the notes' relations
  and numbers. Each cites its outside sources in "What this shows, and what's simplified".

## The new version (the redesign, not live yet)

`hubs/perio/next/` is the redesigned hub on the shared engine (`widget/hub.js`), built beside this one
([phase 2](../tasks/2026-11-05-redesign-phase-2-live-hubs.md), the way Occlusion's and [Heme & Endo Exam 2's](heme-endo-exam2.md)
were) and switched in at the [release](../tasks/2026-11-06-redesign-release.md). Perio needs no engine of its own there: its
old one goes at the release. Nothing students see changes until then: outside a preview the page sends the visitor to the
live hub. Until then **edit content in the live file only**:
- `node tools/hub-next/build.mjs` rewrites `next/content/` from `hubs/perio/index.html`. Run it after any change to the live
  hub (a question, a note, a hint, a case, a figure) and commit the JSON; CI's "generated files are current" step fails when
  it's stale. Its `adaptPerio()` turns Perio's own names into the engine's shapes: `EXAM_HINTS` (hints, `type` → kind),
  `CRAM_CONTENT`, the achievements (`topicPercent` → `lecRight`, "every question of a session right once"), `EXAM_FORMAT`
  (the mock), the suture pictures (`SUTURE_DIAGRAMS`, `SUTURE_DEFS` → figures), and each session's `REF_SECTIONS` into the
  Review tables under that session's notes (the live hub's own HTML; More's Side by side has nothing left, so it's hidden,
  `core.noSide`). The sandbox runs `widget/cases.js` first, so the Patient Box rows (`foldBox`) come out as the live hub draws them.
- **Progress carries over:** same hub id, state key `perio-d2-compendium-state-v1`, answered event `perio:answered`, all 749
  question ids (`tools/question-ids/perio.txt`), and **Perio's own saved shape** (`SH_HUB.stateShape: "answered"`:
  `answered`, `totalSeen`, `activeDates`, `achievements` as `true`), which the dashboard reads as it is. The engine reads and
  writes it only through `ansOf()`, `putAnswer()`, `studyDayList()` and `achMap()`, so the live page reads a save the new
  one wrote (checked: a rollback keeps every answer). It adds `nx` (the daily goal) and `read` (Notes done), which the live
  page ignores. The bank's saved filters (`ui.qbank`) move into the engine's once (`ui.qbankIn`).
- **Question health keeps every version:** the export (`SH_EXPORT.questions`) matches the live hub's for all 749 (the
  Patient Box rows before the stem, a multi's keys: `core.exportCase`).
- The engine learned, gated to the hubs that have them: **recall cards** (reveal, then "I got it" / "I missed it"),
  **case links** ("In the notes", `shCases.refHTML`), a lecture's **note** under its title, **HTML review sections**, and the
  **exam-format mock** (`EXAM_FORMAT`: 46 in 80 minutes, 5 Patient Box, 5 multiple-answer with partial credit, 1 ordering,
  points per session). Its arcade (`POCKET ARCADE` to `BOOT`, with `PERIO_SKIN`) is the live hub's, wrapped like the others';
  its `start` / `stop` are mapped to the engine's `startGame` / `stopAll`, and its colors and fonts come through the build
  (`--ar-*` ending in `--ar-lilac`; Bungee, which the new page doesn't load, so it falls back to Arial Black).
- The page (`next/index.html`) is settings only: `window.SH_HUB` holds the words the live hub writes in its own code (Home's
  final card and chips, the hints banner, the mock's blurb, the arcade's games with their current names, Pocket Showdown
  first). When one changes in the live hub, change it there too. Perio has no Timmy Time episode, so More has no Timmy tile.
- Its text color is a deeper pink than its art's ink (`#9e3a60`, 5.1:1 on its light pink; the ink is 4.05:1), in `widget/hub.css`.
- Its art: tint `#b4466f`, emblem and masthead (phase 0), and the arcade lobby drawings (`tools/figures/site/arcade.mjs`,
  `pBoard()` to `pCrusher()`, built into `widget/hub-art/perio.js`). Sam approved five on 2026-11-11 ("the other drawings
  look good"); **Pocket Showdown's** first teeth "look terrible", so `pBoard()` was redrawn as the game's own board (molars
  in their gums, a column per session, like Heme & Endo's approved Showdown), and Sam approved the redraw the same day. All
  six are in. A change to one: edit it in `arcade.mjs`, run `node tools/figures/site/build.mjs`, commit
  `widget/hub-art/perio.js` and `tools/preview/design/art.js`, and show Sam before it goes in.
- Not carried over (on purpose): the MCQ sprint and the midterm's scope (the midterm is over), the live lobby's daily
  rotating first game (Pocket Showdown is first), hints' slide and email source tags. Active recall is the
  [Learn and Flashcards](../tasks/2026-11-06-redesign-learn-and-flashcards.md) task's.

## Pending

- [The visual case engine](../tasks/done/2026-11-04-perio-visual-case-engine.md): the first six cases are in for Sam's
  look; the expansion (every session's Patient Box items as drawn cases, S3 and S4 cases) waits for approval.
- [S6 to taught](../tasks/2026-11-03-perio-s6-regeneration-taught.md) (still no recording in Drive, 2026-11-10) ·
  [S9](../tasks/2026-11-03-perio-s9-plastic-esthetics.md): the live class's part (gingival excess, abnormal color),
  and a check of Figs 4 and 5 against it.
- S9's two sources differ on recession prevalence (the recording vs the slide's 88% / 50%) and on ADM (a slide says
  comparable or superior to autografts, the exam-review guide says it doesn't work as well): the notes give both and
  no question turns on either. S9's drawn cases, modeled on two of his recorded cases, are `no-kg-24` and
  `recession-11` in `PCASES`.
- S8's dosing chart (the last table in Dr. Litz's slides, which he said to know for the exam) differs from his
  drug-by-drug slides for clindamycin (qid × 10 days vs tid × 7), doxycycline (a double first-day dose) and Augmentin
  (250 or 500 mg tid vs 500 or 875 mg): the notes give both and no question turns on the difference. Its meal-timing
  column couldn't be read reliably from the PDF text, so it isn't in the hub.

History: grep `perio` in "Recent major changes" (`DEPLOY_NOTES.md`).

Related: [home](../home.md) · [occlusion](occlusion.md) (same final day)
