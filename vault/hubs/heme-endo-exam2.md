---
type: hub
tags: [hub]
hub: heme-endo-exam2
status: live
---

# Heme & Endo Exam 2

DENT 2160 Hematology & Endocrinology Exam 2: 50 questions, **5 on Exam 1 material, 8 on L11, 9 on L12 (both hours), 7 each on
L13-L16** (Sam, 2026-11-10, from Dr. Herr: `EXAM_COUNTS`). **L16 is the last lecture on it**, so L17 and L18 aren't either
(they go to Exam 3 with A). **Dr. Taylor's Lecture A is not on it** (Sam, 2026-11-10: Dr. Herr said he forgot about it, so it will likely be on the next exam; "i guess save all
that for exam 3"): the hub's A came out whole that day, and everything it had (notes, narration, 58 questions, hints,
tables, topics) waits for the Exam 3 hub in [the carry-over task](../tasks/2026-11-10-heme-endo-exam3-carry-lecture-a.md). Fri Nov 13, 10:00-11:30 am (the dental sitting). Exam date and check-in hours: its `HUBS` entry in `index.html`.

## Before you work on it

- **Source of truth:** `hubs/heme-endo-exam2/index.html` (single file; edit it directly). It was generated once by a
  build script from per-lecture data files; that script isn't kept, so edit the hub itself.
- **Built on:** the PCD Implants Exam 1 engine (Home, the labeled Question Bank panel, pins, High Likelihood, the mock),
  without the Patient Box case kit (`PCASES` is empty; Patient Box questions are text boxes). Palette "Luteal" (aubergine
  ink, blush paper, a berry accent and corpus-luteum gold); Literata / Hanken Grotesk / Overpass Mono. State key
  `hee2-state-v1`, answered event `hee2:answered`.
- **Lectures:** L11 Diabetes pharmacology (`dmpharm`), L12a and L12b Endocrine pathology (`path1`, `path2`), L13 and L14 Male and female reproductive histology (`mhisto`, `fhisto`), L15 and L16 Male and
  female reproductive physiology (`mphys`, `fphys`) and R, the **Exam 1 Refresher** (`refresh`): 207 questions copied
  from `heme-endo-exam1` with ids `r-<exam1 id>`, for the exam's five Exam 1 questions: **every Exam 1 High Likelihood
  question** (206, under Exam 1's 55 predicted topics, in Exam 1's topic order) plus `r-pa-2s-2`, untagged. **Never cut
  them** (Sam, 2026-11-10: "include all of the exam 1 high likelihood questions. do not cut them"). (It held 219 from
  2026-11-06, every Exam 1 High Likelihood question plus 13 of its hardest; 55, then 80, after the high-yield cut below,
  until Sam's call.) A copy is the Exam 1 question unchanged except its id, `lec: 'refresh'`, "(Exam 1 · L#
  Title)" after the explanation and `pcase` prefixed `r-`; the Refresher's `LIKELY_TOPICS` are Exam 1's, "L# Title: "
  before each topic and "Exam 1 " before its basis. Its notes are Exam 1's cram sheet. **The mock's five Exam 1
  questions come only from R's High Likelihood questions** (Sam, 2026-11-06), **drawn at random** (Sam, 2026-11-10: "pull
  randomly from them for the mock"): `MOCK_LIKELY_ONLY` and `mockLikelyPick`.
  **The Question Bank leaves R out by default** (Sam, 2026-11-10: "do not include them in the default question bank filter
  unless you click to include them"): `qlec: 'all'` means the Exam 2 lectures (`bankDefaultIds`); R joins when it is ticked
  in the Lectures list, when Exam 1 High likelihood is turned on (which ticks R, and unticks it again when turned off:
  `STATE.ui.qE1auto`), or when a search jump matches a Refresher question; a tag "Exam 2 lectures + R" shows it's in.
  The Question Bank's Only line has an extra toggle for them, **Exam 1 High likelihood** (`likely1`, Sam, 2026-11-06): only R's
  High Likelihood questions; turning it on ticks R if it isn't ticked, and turns "High likelihood" (every lecture's) off. Either
  one works on top of the Show chip (Missed last time, Not answered yet, Pinned).
  **R is review only and not in the hub's totals** (Sam, 2026-11-06: "they are just available for review since the exam 2
  will have 5 questions from that pool"): `COUNT_SKIP` / `COUNTED_QS` keep it out of the header's progress, Home's
  readiness ring and "you haven't tried" (whose button opens the other lectures), Where to next, the bank's "of N" (which
  adds "+ n Exam 1 review") and, through `SH_EXPORT.uncounted()`, the mastery medal in `widget/ranks.js`. Its answers
  still count for XP, streaks and leaderboards, and the bank, mock, drill and search still use its questions.
- **Taught or slides-only:** L11 and L12 were written from their class recordings (11/3, 11/4). A (since removed), L13,
  L14 and L15 went to taught on 2026-11-08 from their 11/6 recordings (Drive, the four `GMT20261106-*` transcripts: 8 am A, 9 am L13,
  10 am L15, and 1:42 pm L14, which Dr. Herr re-recorded and posted after class, so its in-class emphasis isn't on it).
  Every Zoom caption is labeled "Michael Herr" because the room's account is his: A is Dr. Taylor and L15 Dr. Madison.
  Their questions' `src` is `rec` where the point was said aloud. **L16 went taught on 2026-11-11** from its 11/10 recording (Drive,
  `GMT20261110-190013`, 1 pm; Dr. Madison, captioned "Michael Herr" like the rest): see L16 in the content flags. L17 and L18
  aren't on Exam 2 (Sam, 2026-11-10: "L16 is the last lecture on the test"), so this hub doesn't get them:
  [the task](../tasks/2026-11-05-heme-endo-exam2-l17-l18-and-recordings.md).
- **Sources:** Drive, "Hematology and Endocrinology" → "Exam 2" (slides, schedule, syllabus, the recordings'
  transcripts). **Not used**, by the [graded-coursework](../rules/graded-coursework.md) rule: everything in "Resources
  from D3s" (last year's Exam 2 study guide, Anki deck of practice questions, a female repro study doc), Quiz 3 (open
  until 11/12), Quiz 4, the take-home.
- **Figures:** `tools/figures/heme-endo-exam2/` (`node tools/figures/heme-endo-exam2/build.mjs`; `--check` fails if
  the hub's `anima:css`/`anima:js` blocks are stale). Sam said yes to every animation (2026-11-05). Nine, each under a notes
  heading and in its lecture's Review: `drugsites` and `insulins` (L11), `axislab` (L12a and L12b), `cah` (L12b), `tubule`
  and `ducts` (L13), `follicle` (L14), `cycle` (L14 and L16), `hpg` (L15). Where each goes is in the hub's `FIG_PLACE` /
  `FIG_BY_LEC` (matched by heading text, both levels; `place.json` keeps the same list): renaming a heading unplaces its
  figure. The slide images were too large to read, so curve shapes, histology and the steroid chart follow the slide text
  and standard textbook layout; each figure's "What this shows, and what's simplified" says what was assumed (detemir
  drawn without a peak, hCG unnamed because the slides don't name it). Check them against the slides when the recordings land. `hpg` follows Dr. Madison's in-class
  correction since 2026-11-08 (aromatase mostly in the Sertoli cells, some in the Leydig cells; its slide said Leydig from
  puberty on). **Midcycle FSH follows Dr. Herr** (Sam, 2026-11-08: "Go with dr herrs version"): in L14 he walks his
  graph with FSH dipping, then peaking alongside LH just before ovulation, the smaller peak (10:52, 20:39), so `cycle`
  (`cycle.mjs`) draws that peak, and the L14 and L16 notes, both levels, the cram sheet, the note tables, the ovulation
  sequence and `fh-tf-fshpeak` say it. In L16's recording (2026-11-11) Dr. Madison said the same: FSH rises, far less than LH, because
  inhibin holds it back (his slide's "FSH is suppressed by production of inhibin"). No question's key depends on FSH falling at midcycle (`fp-inhibin` and `fp-lhr-granulosa` stay retired).
- **Narration:** `hubs/heme-endo-exam2/audio/<lecture>-full.mp3` and `-plain.mp3`, made with `tools/narrate.py`
  (`python3 tools/narrate.py hubs/heme-endo-exam2/index.html --lec <id> --force`). No Timmy Time episode yet.
- **Arcade:** the Cycle Arcade, skin `HEE2_SKIN` (sample tubes, the pathology lab escape room with a glucose meter, a
  follicle that ripens into a corpus luteum).
- **The bank is high yield** (Sam, 2026-11-08: "803 is way too many questions. They need to be higher yield"): it was cut
  from 803 to 339, one question per fact: near-duplicates in other formats, minor details and slide numbers nobody
  stressed, long ordering, matching and select-all items, stained-section identification (Dr. Herr: stained images aren't
  tested) and points a professor played down came out, and their ids are retired.
- **Coverage, not a count, decides what's in it** (Sam, 2026-11-08: "be sure the emphasized points are covered,
  deemphasized points are left out ... other content is sufficiently covered without being overwhelming ... the rest of the
  questions should be filling in the gaps ... be sure that the high likelihood questions are sufficient"; 2026-11-10: "i
  definitely want the stressed topics to be the core of the bank, but i do think its important to fill in the gaps a
  little more"). Audited twice on 2026-11-10: each `emphasize` hint and each of Dr. Herr's focus slides has a question; no
  question's key depends on a `deemphasize` hint ("the numbers may not be accurate" is not one: the rule of 10s,
  `p2-num-4`, and Dr. Taylor's metformin example, `dc-metformin-skip`, are back); **each High Likelihood topic has one HL
  question for each point it names** (no two on the same fact); and then **each testable key term in the notes** (not only
  each section) has a question, the untagged questions filling those gaps (about 5-10 more per lecture; stained-section
  identification, near-duplicates and slide trivia stay out). On the Exam 2 lectures, 133 cut questions came back as they were (ids
  un-retired; the Refresher's 206 are counted on their own) and 4 were written for points nothing tested (`dm-met-lactic`, `mh-spermio-phases`, `mh-sertoli-fridge`,
  `fh-tf-atresia`). With the "which statement" items and without Lecture A (2026-11-10), the Exam 2 lectures held 393
  (451 before; A had 58): L11 67, L12a 56, L12b 58, L13 55, L14 62, L15 52, L16 43. L16 going taught (2026-11-11) brought it to
  402: L16 52 (7 new for what Dr. Madison stressed, and `fp-2s-default` and `fp-lh-block` back as they were).
- **The exam's count per lecture** (Sam, 2026-11-10, from Dr. Herr: "5 review, 8 for l11, 9 for l12, and 7 for the rest"):
  `EXAM_COUNTS = { dmpharm 8, L12 9, mhisto 7, fhisto 7, mphys 7, fphys 7, refresh 5 }`, and `MOCK_BLUEPRINT` is the same
  object, so the mock is the exam's 50. L12's two hours share their 9 (`EXAM_GROUPS`): the mock draws the 9 from L12a and
  L12b together, at random, and the "Most likely questions" box says "9 on the exam for L12a and L12b together".
  **The counts never trim High Likelihood** (Sam, 2026-11-10: "Dont remove any high likelihood questions. If they were
  hinted to be exam questions, they need to be high likelihood"; now in [high-likelihood-topics](../rules/high-likelihood-topics.md)):
  every lecture keeps all its topics (74 on the Exam 2 lectures, 269 questions since L16 went taught; the Refresher's 55), and the box only
  shows the count beside each lecture. When the 11/11 review flags a topic, add it or rank it higher. L16's ten topics
  were re-ranked from its recording on 2026-11-11 (basis "recording"; every question that was High Likelihood stayed so):
  follicular versus luteal first ("high yield for exam"), then the two-cell slide ("very important slide").
- **Dr. Herr's in-class focus list** (Sam, 2026-11-09: "He wanted us to focus on slides 8-10, 12, 19-21 for male repro
  histology. And slides 18-21, 30-31, 33-34, 38-39, and 31 for female repro histology"): a `focus` Exam Hint at the top of
  L13 and L14 (drawn as "focus list", no quotation marks, since it came from the class) that says what is on those slides,
  and the topics on them rank first, basis "focus list + recording". What is on the slides comes from the decks' own slide
  order (Drive copies of 2026-11-04; L13 46 slides, L14 50; Sam confirmed L14 38-39): **L13** 8-10 the Sertoli cell (shape,
  occluding junctions and the blood-testis barrier, FSH, its functions, on the labeled seminiferous-epithelium drawing), 12
  the Leydig cells outside the tubules, 19 the three spermatogonia and the clonal path to sperm, 20 a vascular cast (image
  only), 21 a labeled tubule; **L14** 18-21 the secondary (antral) and Graafian follicles, 30-31 the uterine tube's cells
  (ciliated and peg cells), 33-34 the uterine wall's layers and the endometrium's structure, 38-39 the endometrium's layers
  and menstruation. Not on them: spermiogenesis (L13 22), the uterus's regions (L14 32), the cycle graphs (23-25, 35), the
  cervix and vagina (41-44). L14 has a topic for 33-34, "The uterine wall".
- **What a professor says you don't need isn't asked** (Sam, 2026-11-08; now a standing rule for every hub,
  [dont-ask-what-professors-skip](../rules/dont-ask-what-professors-skip.md)): no question tests it. On 2026-11-08 every
  recording (L11, L12a, L12b, A, L13-L15) and Exam 1's de-emphasis hints (for the Refresher) were checked; only `mh-2s-6`
  tested such a point, and it was retired. Questions that only mention a skipped point in a wrong choice or an
  explanation stay. L16 was checked on 2026-11-11 (the other steroid enzymes, the in-between follicle names, the whole-body actions slide 33,
  which has no text): no question's key depended on them. When the review comes in, check its "you don't need" remarks the same way.
- **Vetted:** every question was checked against its slides and recording by a second reviewer on 2026-11-05 (about
  1 in 4 rewritten). Where the lecture disagrees with a textbook or with itself, the hub keeps what was taught; those
  places are listed below so whoever takes a lecture to taught can check them against its recording.

## Content flags (kept as taught; check when the recording or review lands)

- **L11:** at about 1:29 the answer read aloud to slide practice question 4 (glucose-dependent insulin release) was
  sulfonylureas; the summary slide says GLP-1 agonists / DPP-4 inhibitors, and the hub follows the slide (the notes
  mention the mix-up). The fluoroquinolone slide has the K-ATP effect backwards (not tested). Dulaglutide half-life:
  slide 5 days, said 7 (hub: 5).
- **L12a:** Hashimoto's taught as TSH-receptor-blocking antibodies (slide and recording 23:42; textbooks say anti-TPO /
  anti-thyroglobulin); no key depends on it. Calcitonin "might" cause hypercalcemia in medullary carcinoma (said 33:20,
  against his own slide; not tested).
- **L12b:** the pheochromocytoma rule of 10s is taught with his warning that the numbers are dated. CAH: the slide's
  "1/3 of cases have sodium wasting" may be inverted (references say most classic cases); p2-tf-12 is keyed True to the
  slide. Adrenal cortical carcinoma "> 2 cm" on the slide (likely meant larger).
- **A:** no longer in this hub (2026-11-10); its content flags moved with it to
  [the carry-over task](../tasks/2026-11-10-heme-endo-exam3-carry-lecture-a.md).
- **L13 (taught, 11/6 recording):** he said "lower" for the testis temperature (3:58), so 35 °C stays from the slide;
  74 days said aloud (14:59). Slips the hub doesn't follow: "gap junctions" for the Sertoli occluding junctions (7:09),
  "ductus deferens" for the efferent ductules (1:45), "seminiferous tubules" for the seminal vesicles (33:35). His
  release order is bulbourethral, prostate, then seminal vesicles with the sperm (36:01; textbooks put most sperm in the
  prostatic fraction). He said the labeled Sertoli cell drawing "is actually on your exam" (5:19) and stained images won't
  be tested (18:29). `mh-2s-6`, on the erectile blood-supply figure he said you don't need, was removed and retired on 2026-11-08 (Sam).
- **L15 (taught, 11/6 recording):** 34 °C said three times (L13's slide: 35); each lecture's questions use its own.
  "Two months" for sperm maturation is only on his slide (L13 says 74 days aloud). At 26:42 he had the class cross out
  his slide's "aromatase in the Leydig cells from puberty on": the Sertoli cells carry most of it from fetal development
  on, the Leydig cells some; the notes, questions (`mp-2s-2` rewritten, same key) and `hpg` follow him. He tied the testes
  dropping in warmth to the cremaster, and put each meiotic division one step early (18:41); the notes keep the standard
  order and say so. The speaker note that the right testis hangs lower stays out (anatomy texts say the left).
- **L14 (taught, posted recording):** he read the LH-driven edema as "theca externa" (22:48) and the secondary oocyte
  as "entering prophase" (23:06); the hub keeps the slides' theca interna and metaphase II. Cycle length: slide 28-30
  days, said 28-33 (no key depends on it). FSH peaks with LH before ovulation in his lecture, which the whole hub
  follows (above); in class L16's Dr. Madison agreed (inhibin keeps FSH's peak small). Lactation "activated by estrogen and progesterone surges
  during pregnancy and after childbirth" (35:48; check against L17). He calls the corpus luteum "more translucent" (not
  used). ZP1-3: "you don't need to know those".
- **L14 / L16:** follicle names (L16's slides call any follicle with an antrum Graafian; in class Dr. Madison called the
  in-between one tertiary or antral and said not to worry about those names) and day counts (L16 ovarian 0-14 / 14-28, L14
  uterine 1-5 / 5-14 / 15-28) differ; each lecture's questions use its own.
- **L16 (taught, 11/10 recording):** **midcycle FSH is settled**: he said FSH rises too, far less than LH, because inhibin
  "is going to preferentially inhibit FSH ... that's why we don't call it an LH-FSH surge" (28:38-29:29), which agrees
  with Dr. Herr's graph; the notes, cram, `fp-inhibin-peak` and the `cycle` figure's text say so (`fp-inhibin` and
  `fp-lhr-granulosa` stay retired). He put the switch to positive feedback "in the hypothalamus" (28:06; the slides: the
  pituitary is sensitized); no key depends on where. Turner syndrome is his example of primary amenorrhea (43:16; the
  slide files it under disorders of sexual differentiation); both are in the notes, and `fp-x-amen` still holds. Hot
  flashes: linked to the GnRH peak, "still a lot of research to be done" (42:05); `fp-meno-2` stays. Caption slips the
  hub doesn't follow: "20-day cycle" (20:18, his 14 + 14 is 28), "abruptly start producing" (35:43, stop),
  "hypoprolactinemia" (44:23, hyper). The slide 30 effects on the myometrium weren't said aloud (`src` stays `slides`).

- **Static drawn figures** (`FIGS`): `tools/figures/heme-endo-exam2/sertoli.mjs` (Dr. Herr's two-Sertoli-cell drawing,
  report #38, drawn for the hub and laid out like his slide, which Sam sent as a screenshot (not kept in the repo): his ten
  labels numbered (type A dark, type A pale and type B pale spermatogonia, the peritubular myoid cells and "pachytene" come
  from the slide; the notes say only type A and type B) and the two compartments lettered, numbers deliberately out of order
  so `mh-fig-seq` isn't given away). `build.mjs` writes the hub's `var FIGS = {...};` line along with the anima blocks; edit
  the module, never the line. It sits above `mh-fig-seq` and `mh-fig-label` and under L13's "Sertoli cells" heading.
- **"Which statement" items** (2026-11-10, [rule](../rules/which-statement-questions.md)): `which()` and `whichf()` sit right
  after `mq()`, followed by one block of two of each per lecture (ids `<prefix>-ws-*` and `<prefix>-wf-*`; A's four,
  `dc-*`, left with it). L16's (`fphys`)
  four were checked against its recording on 2026-11-11. Six older items are
  tagged `which` too (`p1-graves-2`, `p2-pth-fragments`, `p2-cortex-adenoma`, `mh-cilia-stereo`, `r-h1-ccell`,
  `r-ca-calcitonin`).

## The new version (the redesign, not live yet)

`hubs/heme-endo-exam2/next/` is the redesigned hub on the shared engine (`widget/hub.js`), built beside this one
([phase 2](../tasks/2026-11-05-redesign-phase-2-live-hubs.md), the way [phase 1](../tasks/done/2026-11-05-redesign-phase-1-hub-engine.md)
built Occlusion's) and switched in at the [release](../tasks/2026-11-06-redesign-release.md). Nothing students see changes
until then: outside a preview the page sends the visitor to the live hub. Until then **edit content in the live file only**:
- `node tools/hub-next/build.mjs` rewrites `next/content/` from `hubs/heme-endo-exam2/index.html`. Run it after any change
  to the live hub (a question, a note, a hint, a figure build) and commit the JSON; CI's "generated files are current" step
  fails when it's stale. This hub has no drawing kit (`od:kit`), so the build writes its `FIGS` (the Sertoli drawing) and
  `FIG_PLACE` into `figures.js` as data, with its `anima:js` block as is.
- **Progress carries over:** same hub id, state key `hee2-state-v1`, answered event `hee2:answered`, and all 609 question
  ids (402 on the Exam 2 lectures, the Refresher's 207).
- **The Exam 1 Refresher stays review only** (Sam, 2026-11-06 and 2026-11-10, above): the build copies the live hub's
  `COUNT_SKIP` into `core.json` as `reviewOnly`, and the engine (`isReview()`) keeps R out of Home's totals and "you
  haven't tried", Where to next, the bank's "of N" ("+ n Exam 1 review") and the mastery medal (`SH_EXPORT.uncounted`),
  and out of the bank until it is ticked (`bankAll()`); the drill, the mock and a search jump still use it. The picker's and
  the tag's words are `SH_HUB.review` in `next/index.html`.
- **Exam 1 High likelihood** is `SH_HUB.bank.only`'s third field, `{ prop: "likely", lec: "refresh" }`: on, it shows R's
  High Likelihood questions and ticks R; off, it unticks R again if it ticked it (`STATE.ui.qE1auto`, the live hub's flag).
- **The mock** is the live hub's: `EXAM_GROUPS` (L12a and L12b share their 9) and `MOCK_LIKELY_ONLY` (R's five from its
  High Likelihood questions, at random) reach `core.json` as `mock.groups` and `mock.likelyOnly`. "Most likely questions"
  says "9 on the exam for L12a and L12b together".
- The page (`next/index.html`) is settings only: `window.SH_HUB` holds the words the live hub writes in its own code (Home's
  exam card and chips, the hints banner, the mock's blurb, the arcade's games, Lab Sort up front). When one changes in the
  live hub, change it there too. "What the professors said to know" and "In the professors' words" (`hints.words`), since
  four professors teach the lectures.
- Its art: tint `#a83232`, emblem and masthead (phase 0) and the six arcade lobby drawings (phase 2: `tools/figures/site/arcade.mjs`,
  `heSort()` to `heCross()`, from `HEE2_SKIN`), built into `widget/hub-art/heme-endo-exam2.js` by `node tools/figures/site/build.mjs`.
- **Switched in only if the release beats 11/13** (Sam, 2026-11-11): its exam is Friday, November 13, 10 am; if the release
  comes later, the live page stays to the end.
- **Each lecture has its own color** (Sam, 2026-11-11: "more color"), from the engine (`LCOL`, `lc()`, `.lc-0` to `.lc-9` in
  `widget/hub.css`, by the lecture's place in `LECTURES`): L11 blue, L12a orange, L12b teal, L13 magenta, L14 olive, L15
  violet, L16 mustard, and the Refresher grey (review only). Adding a lecture at the end keeps the others' colors; one
  inserted earlier shifts the rest. **Notes done** (`STATE.read`, this device only) fills a lecture's badge.
- No Timmy Time yet, so the new Home and More have no episode card. When one is made, `/podcast` wires the live hub and
  then runs `node tools/hub-next/build.mjs --hub heme-endo-exam2`, so `SH_PODCAST` (its lore comments included) reaches
  `core.json`; the engine draws the Home card, the More tile and the player with likes, dislikes and comments.
- Test it only through the preview (`node tools/preview/serve.js`, then `/hubs/heme-endo-exam2/next/`).

## Pending

Open tasks for this hub: `vault/tasks/` notes with `hub: heme-endo-exam2`.

## History

Grep "Recent major changes" in `DEPLOY_NOTES.md` for `heme-endo-exam2`. Retrospective (once archived): `LESSONS.md`.

Related: [home](../home.md) · [heme-endo-exam1](heme-endo-exam1.md) · [high-likelihood-topics](../rules/high-likelihood-topics.md)
