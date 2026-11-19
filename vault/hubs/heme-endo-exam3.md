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
  Herr, 1 pm, and `GMT20261117-194905`, Dr. Borak, the 2 pm lecture; the captions name no speaker). **L21 and L22** (Dr. Dal Zotto, 11/18) went in the same evening, written from
  their recordings (Drive, Exam 3 folder: `GMT20261118-190020`, 1 pm, male, and `GMT20261118-200153`, 2 pm, female; the
  captions say "Michael Herr" throughout). Their slides were too big for the connector at first (over its 10 MB limit); on
  2026-11-19 Sam put smaller copies in the same folder (the course numbers the decks 20 and 21: `20-Pathology of Lowe Urinary
  Tract and Male reproductive System-Dal Zotto-STU`, a Google Slides copy, and `21-Pathology of Female Reproductive
  System-Dal Zotto-STU.pdf`), and **both lectures were checked against them slide by slide** the same morning: what only a
  slide says is in the notes at both levels and says so ("the slide"), the review tables, cram lines, hints' takes, topics and
  the study guide page carry it too, 23 questions were written from the slides (`src: "slides"`), two were fixed
  (`mr-tf-pein30`, `fr-tf-ls-only`), and both lectures' `source` says "+ slides". Slides 16-20 of the male deck are images
  only (no text came back).
- **Dr. Herr's Exam 3 study guide** (Sam, 2026-11-17: no in-class review; the guide is "very indicative" and "everything on the study
  guide should be high likelihood questions"; Drive, Exam 3 folder, `Exam 3 Study Guide (1).docx`): a focus list and key terms for
  each of L17-L22, nothing for Lecture A. Each lecture's Exam Hints open with its list (a `focus` hint, the guide's words, then the
  hub's take), and each guide item has a `likelyTopics` entry with basis "study guide + ...", ranked first;
  topics from a recorded hint that the guide doesn't list (L17's fertilization and implantation, L21's urothelial carcinoma,
  L22's lichen planus and breast) stay High Likelihood, ranked after. **Since 2026-11-19 only the questions on what a guide
  item or a hint names are High Likelihood** (Sam: "make sure that those need to be high likelihood ... a little bit higher
  yield", [decisions](../decisions.md)): a question on a detail neither names stays in the bank without the tag, and a topic
  that rests on neither (L17's capacitation and maternal hormones, L19's splenic sinuses and MALT and tonsils, L20's plasma
  cell neoplasms) is gone. Hold new questions to that when adding them to a topic. Five questions were written for the thinner items (`hi-sg-platelets`, `hi-tf-sg-neut`,
  `ll-sg-classify`, `ll-num-sg-leuk`, `ea-sg-pop`). L21 and L22's lists (in [their task](../tasks/done/2026-11-16-heme-endo-exam3-l19-l22.md))
  are those lectures' focus hints and first topics (basis "study guide + recording"), since 2026-11-18. Lecture A's topics weren't changed, and stay that way (Sam: "lecture a shouldnt be ranked lower").
  **The guide's own page in Notes** (Sam, 2026-11-19, [decisions](../decisions.md)): `study.json`'s `guide`, one entry per
  lecture (`{ lec, items: [{ h, body }], more: [{ h, body }], terms: [{ t, d }] }`), each `h` the guide's words exactly, each `body`
  written from this hub's notes and keys. **Since the evening of 2026-11-19 it is short and carries the in-class hints** (Sam: "the
  study guide is really long. can we combine the study guide with in class exam hints to make it much higher yield"; 14,000 words
  to about 6,500): each item is a `gd-said` "Said in class" box (short quotes, trimmed with "...", from `study.json`'s hints for that
  item), a `hy-know` "Know this" of 3 to 7 bullets, a table only where it is the shortest way (L19's organs, L20's translocations,
  L22's lichens) and a one-line `gd-trap` "Watch for"; then each lecture's `more`: "Also stressed in class" (emphasize hints the
  guide doesn't list: L17's ZP3 and ZP2, L21's urothelial carcinoma and smoking, L22's ovary, breast receptors and Paget) and
  "Said not needed" (its deemphasize hints); key terms are one line each. A new hint on a guide topic goes into that item's
  quotes, one not on the guide into "Also stressed in class". `index.html`'s `SH_HUB.notes.guide` names it. No Lecture A (the guide skips it). It's hand-written, not built: **when a lecture's
  notes or a key changes, check its guide entry too**. **Its narration** (Sam, 2026-11-19: "add kokoro") is `audio/guide.mp3`
  with its words file, spoken from the page's readable part (`tools/hub-next/guide.mjs`), so the
  [text-and-audio](../rules/text-and-audio-never-drift.md) rule binds it: **a change to `study.json`'s `guide` (or to the title of
  a lecture on it) is recorded again in the same PR**, `python3 tools/narrate.py heme-endo-exam3 --level guide --force` (12
  minutes on 4 cores since the short guide of 2026-11-19; the recording is 56 minutes, 27 MB; the long one was 112), then `node tools/hub-next/build.mjs --hub heme-endo-exam3`. Until then the build sets `guideAudio`
  false, Listen reads the page in the device's voice, and the smoke test fails naming it.
- **Sources:** Drive, "Hematology and Endocrinology" → "Hubs" → "Exam 3" (L17-L20's slides and the two transcripts), and the
  course's learning objectives ("Exam 1" folder). **Not used**, by the [graded-coursework](../rules/graded-coursework.md) rule:
  the Exam 3 Anki deck in that folder (a previous year's practice questions), everything in "Resources from D3s", Quiz 4 (open
  until 11/19), the crosswords and the take-home.
- **The exam's count per lecture** (Sam, 2026-11-17): Clinical application (A) 3, Pregnancy and lactation (L17) 4, Estrogens and
  androgens (L18) 6, Introduction to hematology (L19) 8, Lymphomas and leukemias (L20) 6, Male reproductive pathology (L21) 4,
  Female reproductive pathology (L22) 4: 35. `core.json` `examCounts` has all seven ("n on the exam" beside each lecture under
  Most likely questions; Ask Timmy reads the exam facts), and the mock's `blueprint` has the lectures in the hub, at the exam's
  pace: since L21 and L22 went in (2026-11-18) it is the exam's 35 in 90 minutes (`mpath: 4`, `fpath: 4`, `limit` 5400),
  and `index.html`'s mock blurb lists all seven counts. **The counts never trim
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
  `nodespread` (L20, how lymphoma spreads and its stages, prefix `ya-`). **L21 and L22 have no figures**: Sam, 2026-11-18,
  "no to all diagrams" ([decisions](../decisions.md)), which replaces the 11-16 yes for those two, so they got no diagram
  review. A figure added later numbers on from Fig 25.
- **Narration:** `hubs/heme-endo-exam3/audio/<lecture>-full|plain|hy.mp3` with their words files
  (`python3 tools/narrate.py heme-endo-exam3 --lec <id> --level <level> --force`). Every lecture has all three levels (High
  yield for L17-L20 recorded 2026-11-17, after the study guide's rebuild; L19 and L20's three levels again 2026-11-18, taught; L21 and L22's the same day, and again 2026-11-19 after the slides). High yield again after any change to a lecture's
  notes, topics, hints or questions, then the content build. L21 and L22 added 29 words to `tools/podcast/lexicon.json`
  (cryptorchidism, leiomyoma, urothelial, botryoides, Trichomonas, PeIN...) and `tools/narrate.py` reads "WHO" as W H O.
  **Timmy Time:** "Exam 3: the last-minute review" (`exam3-review`, 52 minutes, 2026-11-19), all seven lectures, each of
  L17-L22 opening on Dr. Herr's study guide list; script `tools/podcast/heme-endo-exam3/script.md`, audio
  `audio/timmy-time.mp3`, wired in `content/core.json`'s `podcast` and `hubs.js`. It says nothing as fact that the content
  flags below keep out of the keys (the script's header lists what it steers around). **A change to the notes means fixing
  the script and rebuilding the episode in the same PR** (`tools/podcast/README.md`;
  [text-and-audio-never-drift](../rules/text-and-audio-never-drift.md)). When the hub is archived, the episode comes off with
  the narration ([archived-hubs-drop-their-audio](../rules/archived-hubs-drop-their-audio.md)).
- **Quirks:** `SH_HUB` has no `exam` key on purpose: with one, the engine counts only lectures whose `exam` matches, so
  nothing would count. Lecture A's id is `dental` and its label "A".

## Content flags (kept as taught; check when a recording or review lands)

No question's key depends on any of these, except L22's LCIS (below).

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
- **L21 (Dr. Dal Zotto; recording and slides):** bladder cancer "the fourth cause of death in men" right after "it doesn't cause
  many deaths": the slide settles it, fourth in incidence and eighth as a cause of death in men (the questions use the incidence
  rank); Leydig cells "secrete testosterone and dihydrotestosterone" (most DHT is made in target tissues, L18) and the vas
  deferens "ends up in the ureter" (the urethra), both in reading-notes; cryptorchidism in "1 in 10" newborns aloud, but the
  slide's "3% term infants, 30% premature" matches the texts (`mr-crypto-rate` keys the slide's), corrected at about 2 years
  (guidelines: by 18 months; no key on the age); the periurethral zone called the "central zone" and the "transitional zone"
  in one breath, and the slides do both (the zonal slide: transitional; the BPH slide: "central zone"; questions say "around
  the urethra" or "transition zone"). PeIN's "30 percent" is, on the slide, the HPV-associated kind's (the HPV-independent
  kind, 2-8 percent): `mr-tf-pein30` says "HPV-associated" since 2026-11-19. The slides' non-seminoma details (yolk sac
  tumor's AFP, embryonal carcinoma's numbers, the 2016 WHO classification) are in a reading-note only, as "general
  information". Said not needed (hints, no key on them): retroperitoneal
  fibrosis, the WHO classifications, FGFR3 and TP53, the testicular tumor classification, the seminoma's histology and the
  nonseminomas' details ("general information").
- **L22 (Dr. Dal Zotto, from the recording):** the paramesonephric ducts "about the first week of gestation" and the
  mesonephros "the future kidney" (texts: about the sixth week; a temporary kidney); leiomyomas' age not keyed. **LCIS** called
  benign, with no treatment needed (the WHO's wording, as taught): unlike the flags above, the questions follow the lecture
  here (`fr-dcis` and the breast numbered and except items key it), since the lecture's points are what the exam tests; texts
  also call LCIS a marker of higher breast cancer risk, followed with surveillance (a reading-note says so). Said not needed:
  the new cervical screening's details (know it's risk-based), the ovarian tumor classification, DCIS vs LCIS under the
  microscope. From the slides (2026-11-19): the lecture called lichen sclerosus "the single non-infectious inflammatory
  disorder that can lead to carcinomas", but the vulvar squamous cell carcinoma slide puts the HPV-independent kind on
  "lichen sclerosus or lichen planus" (long-standing inflammation). No key depends on whether lichen planus can lead to
  carcinoma: `fr-tf-ls-only` now asks about lichen simplex chronicus (keyed False), the hints, guide and tables say "the one she
  said" with the slide beside it, and Timmy Time's lightning question was reworded. The aggressive endometrial type is "over
  65" aloud and 70-80 on the slide, which names it (serous and clear cell carcinoma); both are in the notes.

## Pending

Open tasks for this hub: `vault/tasks/` notes with `hub: heme-endo-exam3` (none open since 2026-11-18;
[L19 and L20 to taught, L21 and L22 in](../tasks/done/2026-11-16-heme-endo-exam3-l19-l22.md) is done). Shipped with 285 questions
(A 58, L17 58, L18 59, L19 55, L20 55) and 53 High Likelihood topics; after the study guide (2026-11-17), 290 questions
(L17 58, L18 60, L19 57, L20 57) and 62 topics, 260 questions High Likelihood; 22 figures since 2026-11-17. After L19 and L20
went taught (2026-11-18), 313 questions (L19 72, L20 65), 64 topics, 285 High Likelihood, 83 hints, 24 figures; three L20
questions retired (`ll-hl-case`, `ll-2s-scatter`, `ll-specimen`: Hodgkin subtypes and flow cytometry, said not needed).
With L21 and L22 (2026-11-18): 437 questions (L21 64, L22 60, 13 of them Patient Box cases), 86 topics, 387 High
Likelihood, 122 hints, 24 figures. After the slides (2026-11-19): 460 questions (L21 75, L22 72), 86 topics, 410 High
Likelihood. Nothing left open from the slides. After the High Likelihood review (2026-11-19): 81 topics, 284 High Likelihood
(A 42 unchanged, L17 33, L18 42, L19 39, L20 45, L21 43, L22 40), High yield recorded again for L17-L22. The evening lessons audit (2026-11-19)
fixed four explanations (`ea-tf-ratio`, `pg-no-milk`, `ea-tf-proscar`, `dc-acro` for report #67) and, with Sam's yes, reworded `ea-tf-proscar`'s
stem ("have different active ingredients", not "two different drugs"; [decisions](../decisions.md)). **For the retrospective:** on 11-19 every arcade click in this hub, 67 of Timmy Time's
69 plays from More and 134 question-health answers were the smoke test's (BUG-192 in [the bug log](../release/bug-log.md)), not
students; `tools/data-fixes/2026-11-19-test-runs.sql` takes them out after its PR merges, so check it ran before reading them.

## History

Grep "Recent major changes" in `DEPLOY_NOTES.md` for `heme-endo-exam3`. Retrospective (once archived): `LESSONS.md`.

Related: [home](../home.md) · [heme-endo-exam2](heme-endo-exam2.md) · [heme-endo-exam1](heme-endo-exam1.md)
