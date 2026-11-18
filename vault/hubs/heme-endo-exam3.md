---
type: hub
tags: [hub, live]
hub: heme-endo-exam3
status: live
---

# Heme & Endo Exam 3

DENT 2160 Hematology & Endocrinology, Exam 3: **35 multiple-choice questions, new material only** (the syllabus), Fri Nov 20,
8:00-9:30 am (the dental sitting; optometry at 10:00), in person on Canvas with LockDown Browser. Its lectures (the course
schedule): **A** Dental endocrinology clinical application (Dr. Taylor, taught 11/6, moved here from Exam 2), **L17** Pregnancy
and lactation (Dr. Madison, 11/10), **L18** Estrogens and androgens (Dr. Fasinu, 11/11), **L19** Introduction to hematology
(Dr. Herr, 11/17), **L20** Lymphomas and leukemias (Dr. Borak, 11/17), **L21** and **L22** Pathology of the male and female
reproductive systems (Dr. Dal Zotto, 11/18). Exam date and check-in hours: its
entry in `hubs.js`.

## Before you work on it

- **Source of truth:** `hubs/heme-endo-exam3/content/` (the JSON is where it is edited; then
  `node tools/hub-next/build.mjs --hub heme-endo-exam3`), and `index.html`'s `SH_HUB` for the hub's own wording (Home, hints,
  mock, arcade). Built on the engine from the start ([build-a-hub](../how-to/build-a-hub.md)).
- **Art: Heme & Endo Exam 2's, reused** (Sam, 2026-11-15: "you can reuse the art that was made for endo exam 2"; an exception
  to [every-hub-gets-its-own-art](../rules/every-hub-gets-its-own-art.md)): `tools/figures/site/` gives `heme-endo-exam3` Exam
  2's tint, emblem (the thyroid on the trachea with a drop of blood), masthead (thyroid chart, insulin, glucose meter, blood
  tubes, red cells) and medal glyph, and `widget/ranks.js` its medal; `widget/hub-art/heme-endo-exam3.js` is the same art as
  `heme-endo-exam2.js` under this hub's id. The arcade is Exam 2's **Cycle Arcade** (`content/arcade.js` and `arcade.css`,
  copied from Exam 2's redesign version; `HUB_ID` is this hub's, so its scores are its own), with the Path Lab Escape's story
  moved to the week of Exam 3.
- **Lecture A came over whole** from Exam 2 ([the carry-over task](../tasks/done/2026-11-10-heme-endo-exam3-carry-lecture-a.md)):
  the Exam 2 page at `43ece52` (the last commit with A) was run through the old converter (`tools/hub-next/build.mjs` as of
  `d86f134^`, which read a single-file hub) and A's pieces were kept unchanged: its notes at both levels, its 58 questions
  (same `dc-` ids, retired in Exam 2's registry, live in this hub's), 15 hints, 11 High Likelihood topics, review tables, three
  Side by side tables, three processes and its sort set. Its narration was made again for this hub (all three levels). Its
  content flags (kept as taught) are in that task note.
- **L17 and L18** were written from their slides and recordings (Drive transcripts `GMT20261110-195437`, 1:54 pm, and
  `GMT20261111-190049`, 1 pm; every caption is labeled "Michael Herr", the room's Zoom account). **L19 and L20** were written
  from their slides, then taken to taught on 2026-11-18 from their recordings (Drive, Exam 3 folder: `GMT20261117-190158`, Dr.
  Herr, 1 pm, and `GMT20261117-194905`, Dr. Borak, the 2 pm lecture; the captions name no speaker). **L21 and L22 aren't in the hub
  yet**: their slides weren't posted when it was built, or by 11/18 at 4 am UTC. Both are
  [a task](../tasks/2026-11-16-heme-endo-exam3-l19-l22.md).
- **Dr. Herr's Exam 3 study guide** (Sam, 2026-11-17: no in-class review; the guide is "very indicative" and "everything on the study
  guide should be high likelihood questions"; Drive, Exam 3 folder, `Exam 3 Study Guide (1).docx`): a focus list and key terms for
  each of L17-L22, nothing for Lecture A. Each lecture's Exam Hints open with its list (a `focus` hint, the guide's words, then the
  hub's take), and every question on a guide item is in a `likelyTopics` entry with basis "study guide + ...", ranked first;
  topics from a recorded hint that the guide doesn't list (L17's fertilization, implantation, capacitation, the maternal hormones)
  stay High Likelihood, ranked after. Five questions were written for the thinner items (`hi-sg-platelets`, `hi-tf-sg-neut`,
  `ll-sg-classify`, `ll-num-sg-leuk`, `ea-sg-pop`). L21 and L22's lists are in [their task](../tasks/2026-11-16-heme-endo-exam3-l19-l22.md):
  they become those lectures' focus hints and topics when the lectures go in. Lecture A's topics weren't changed, and stay that way (Sam: "lecture a shouldnt be ranked lower").
- **Sources:** Drive, "Hematology and Endocrinology" → "Hubs" → "Exam 3" (L17-L20's slides and the two transcripts), and the
  course's learning objectives ("Exam 1" folder). **Not used**, by the [graded-coursework](../rules/graded-coursework.md) rule:
  the Exam 3 Anki deck in that folder (a previous year's practice questions), everything in "Resources from D3s", Quiz 4 (open
  until 11/19), the crosswords and the take-home.
- **The exam's count per lecture** (Sam, 2026-11-17): Clinical application (A) 3, Pregnancy and lactation (L17) 4, Estrogens and
  androgens (L18) 6, Introduction to hematology (L19) 8, Lymphomas and leukemias (L20) 6, Male reproductive pathology (L21) 4,
  Female reproductive pathology (L22) 4: 35. `core.json` `examCounts` has all seven ("n on the exam" beside each lecture under
  Most likely questions; Ask Timmy reads the exam facts), and the mock's `blueprint` has the lectures in the hub, at the exam's
  pace (35 in 90 minutes): 27 questions in 69 minutes now. When L21 and L22 go in, add `mpath: 4` and `fpath: 4` to the
  blueprint and set its `limit` to 5400 (35 in 90 minutes), and fix the mock's wording in `index.html`. **The counts never trim
  High Likelihood** ([high-likelihood-topics](../rules/high-likelihood-topics.md)).
- **Figures:** 22 anima figures (Sam said yes to every candidate, 2026-11-16), two for A and five for each of L17-L20, numbered
  Fig 1-22 in lecture order; shipped 2026-11-17, after the hub ([the figures task](../tasks/done/2026-11-16-heme-endo-exam3-figures.md)
  has each one's plan, where it went and its judgment calls). One module each in `tools/figures/heme-endo-exam3/`
  (`index.mjs` builds every `.mjs` there; `node tools/figures/heme-endo-exam3/build.mjs` writes `content/figures.js` and
  `figures.css`; `preview.mjs <id>` draws one on its own). Each is placed three times: `FIG_PLACE` in `content/figures.js`
  (the start of the text of the heading, or with `end` the paragraph, it follows, at each level), `figByLec` in `core.json`
  and the `figs` section ("Diagrams") of its lecture's Review group in `study.json`. Helpers and palette are Exam 2's
  (`shared.mjs`, `makeFig`); each figure's CSS classes carry its own prefix (`lm-` is the lamina dura's, `ld-` the letdown's).
  L19's and L20's were checked against the recordings on 2026-11-18, and each lecture got one more, built under Sam's "yes to
  all diagrams" (2026-11-18): **Fig 23** `nkcheck` (L19, how an NK cell decides to kill, prefix `xa-`) and **Fig 24**
  `nodespread` (L20, how lymphoma spreads and its stages, prefix `ya-`). L21 and L22 get a diagram review when they go in
  ([diagram-review](../rules/diagram-review.md)); new figures number on from Fig 25.
- **Narration:** `hubs/heme-endo-exam3/audio/<lecture>-full|plain|hy.mp3` with their words files
  (`python3 tools/narrate.py heme-endo-exam3 --lec <id> --level <level> --force`). Every lecture has all three levels (High
  yield for L17-L20 recorded 2026-11-17, after the study guide's rebuild; L19 and L20's three levels again 2026-11-18, taught). High yield again after any change to a lecture's
  notes, topics, hints or questions, then the content build. No Timmy Time episode yet: Sam, 2026-11-17, "wait for timmy time until we have all the lectures for exam 3" ([inbox](../tasks/inbox.md)).
- **Quirks:** `SH_HUB` has no `exam` key on purpose: with one, the engine counts only lectures whose `exam` matches, so
  nothing would count. Lecture A's id is `dental` and its label "A".

## Content flags (kept as taught; check when a recording or review lands)

No question's key depends on any of these.

- **A:** in [the carry-over task](../tasks/done/2026-11-10-heme-endo-exam3-carry-lecture-a.md).
- **L17 (Dr. Madison):** she ties meiosis II to ZP2 binding (textbooks: sperm entry); estrogen "raises" vaginal pH (slide:
  "buffers"); the deck uses "corona radiata" for the whole cumulus; she credits hCG itself with lowering LH and FSH (Costanzo:
  the steroids it maintains); she and the slide name only progesterone as prolactin's antagonist in pregnancy (textbooks add
  estrogen); the baby's sounds and sight "lower dopamine" (textbooks: oxytocin); speaker notes swapped on slides 7 and 8.
  Said not needed (no question on them): the cleavage stages' names, the adhesion molecules' names, the methods that keep
  sperm and egg apart, and fetal development.
- **L18 (Dr. Fasinu):** slide 5 labels DHEA "dihydrotestosterone" (he corrected it); testosterone in children "absolutely
  contraindicated" aloud vs "caution" on the slide, and estrogen in pregnancy used "in a few cases" aloud vs contraindicated
  on the slide; cypionate and ethinyl estradiol called "salts", a 3-month cypionate interval, unsure of Proscar and Propecia
  strengths; his clomiphene receptor split; two slides disagree on estrogen and LDL; brand and route errors on slide 30.
  Said not needed: the other androgen analogs (23:37), the second estrogen-effects slide (32:04), the rarely used SERMs
  (43:21). The notes write clotting factors as 2, 7, 9 and 10 so the voice reads them; questions use II, VII, IX and X.
- **L19 (Dr. Herr, taught 2026-11-18):** he said NK cells "function as killer T cells" (4:35) but that they lack B and T
  markers (12:41): a reading-note says NK cells aren't T cells. He read slide 6's granule labels aloud as they are; the notes
  say what histology texts call them and no question asks which is azurophilic. He gave no sizes (slide 10's "mm") and no
  lymph node size. He used "IgG" for any antibody aloud too; questions key IgM and IgD on B cells. He put the PALS around the
  central artery (35:25, 36:58), not on the sheathed capillaries, and didn't take up open vs closed circulation ("associate
  this PALS with the spleen", 35:52). New ones: he spoke of the spleen's "cortex ... kind of a medulla" (34:15; the texts say
  it has neither: `hi-tf-spleen-cm` was rewritten to the white and red pulp, now keyed True), reticulin as "type 2 collagen"
  once (17:57; type III elsewhere), "MHC class 2" once for MHC class I (14:01), and he struck GALT from the primary organs
  (16:19). Said not needed (no key depends on them): stained images, cell concentrations, the list of lymphoid organs, the
  CFU-Ly sentence, how helper and cytotoxic T cells respond differently.
- **L20 (Dr. Borak, taught 2026-11-18):** no CD markers or flow cytometry ("Do not waste a second learning what these
  antigens are", 15:08; "You don't need to know the flow cytometry stuff, CD5, CD33", 62:43), no AML or ALL subtypes, no
  Hodgkin subtypes (52:26), little on peripheral T-cell lymphoma, mycosis fungoides or ALL past its demographics. Know each
  disease's category and the underlined molecular associations (62:35); cyclin D1 stays (he called it a test clue, 47:17).
  He corrected himself aloud that acute leukemia in children is ALL, AML in adults (32:47); said "greater than 20%" blasts
  (the WHO's 20% or more in a reading-note); didn't give Hodgkin's cell of origin or the Auer rods' stain; gave Ann Arbor
  stage 4 and CRAB aloud. New ones: he swapped Burkitt's endemic and sporadic forms once (50:02; `ll-2s-bl` rewritten so no
  key depends on it) and put Hodgkin's start in the chest's central nodes (22:08; the slide says the neck). He grouped
  mantle cell with the indolent lymphomas once (46:16; textbooks: aggressive; no key on its grade). Its 10 Patient Box cases
  are written for the hub.

## Pending

Open tasks for this hub: `vault/tasks/` notes with `hub: heme-endo-exam3`:
[L19 and L20 to taught, L21 and L22 in](../tasks/2026-11-16-heme-endo-exam3-l19-l22.md). Shipped with 285 questions
(A 58, L17 58, L18 59, L19 55, L20 55) and 53 High Likelihood topics; after the study guide (2026-11-17), 290 questions
(L17 58, L18 60, L19 57, L20 57) and 62 topics, 260 questions High Likelihood; 22 figures since 2026-11-17. After L19 and L20
went taught (2026-11-18), 313 questions (L19 72, L20 65), 64 topics, 285 High Likelihood, 83 hints, 24 figures; three L20
questions retired (`ll-hl-case`, `ll-2s-scatter`, `ll-specimen`: Hodgkin subtypes and flow cytometry, said not needed).

## History

Grep "Recent major changes" in `DEPLOY_NOTES.md` for `heme-endo-exam3`. Retrospective (once archived): `LESSONS.md`.

Related: [home](../home.md) · [heme-endo-exam2](heme-endo-exam2.md) · [heme-endo-exam1](heme-endo-exam1.md)
