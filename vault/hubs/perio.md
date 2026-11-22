---
type: hub
tags: [hub, archived, removed]
hub: perio
status: archived
---

# Periodontology (perio)

The D2 Periodontology course (DENT 2145), nine sessions with different professors. Midterm Oct 1 (S1-S4, done, check-in
closed); **final Thu Nov 19, cumulative: done** (the class sat it that morning). Dates: its entry in `hubs.js` (and `exams` in
`content/core.json`).

**Its page came down 2026-11-19**, the afternoon of its final (Sam: "you can take perio down now. merge when ready";
[decisions](../decisions.md)): `hubs/perio/` (the page, its content JSON, `variants.json` and its images) and
`assets/og-perio.png` are gone, with its About page entries (its mock's format, Stage & Grade, the A/B wordings, its
twenty diagrams, its redesign entry and its arcade column), Ask Timmy's 41 test cases for it (`tools/timmy/test-set.json`;
the dashboard case that pointed at Perio points at Heme & Endo Exam 3), its budget line in `tools/release/budgets.json` and
its figure build in "Check hubs". So the dashboard doesn't link to a missing page before 10 pm, `hubs.js` archives it at
1 pm that day (`archiveOn`), and the final's check-in pop-up goes out from 1 pm (`promptHour: 13`: the exam was that
morning). Then, once more to anyone who had opened it and not sent it (Sam, 2026-11-19: "repush the perio check in pop up
for everyone"; `askAgain: "2026-11-19"`). What stays: its entry in `hubs.js` (no card; its exam check-ins under Past hubs until `debriefDays` runs out),
`tools/question-ids/perio.txt` so its ids are never reused, its drawn art (`widget/hub-art/perio.js`, `tools/figures/site/`),
the figure kit in `tools/figures/perio/` (its `build.mjs` has nothing to write to now; `tools/figures/heme-endo-exam3/` was
copied from it), `tools/podcast/perio/` and the class's data in Supabase. The last version of the page is in git:
`git log --diff-filter=D -- hubs/perio/index.html` names the commit that removed it, and its parent has everything. The
tests that used its bank or page use Heme & Endo Exam 3's now (`tools/release/xp.js` grades the newest engine hub's real
bank, with a made-up ordering and matching item; `tools/release/admin-ui.js`; `tools/ci/quiet.js`). The A/B wordings
(`variants.json`) were Perio's alone: the engine and the smoke test still handle them, so a hub that gets them again puts
its entry back on the About page. The notes below describe the hub as it was.

**Archived 2026-11-19.** The retrospective of both exams is in [LESSONS.md](../../LESSONS.md) ("Periodontology" under Hub
retrospectives, written 2026-11-19 by the lessons audit), and the recap is on the dashboard since that afternoon (featured:
`q3-S02`). **Its narration and Timmy Time came off the site** with that audit
([archived-hubs-drop-their-audio](../rules/archived-hubs-drop-their-audio.md)): the 28 mp3s and their words files (289 MB),
and the `podcast`, Listen and Timmy Time out of its `hubs.js` entry; it left `HUBS` in `sw.js` with the page (`VERSION`
sh-v66). Its later check-ins go into the next audit.

## Before you work on it

- **On the shared engine since the redesign's release** (2026-11): the page, `hubs/perio/index.html`, is settings only
  (`window.SH_HUB`), and **the source is `hubs/perio/content/`** (`core.json`, `questions.json`, `notes.json`,
  `study.json`, `arcade.js/css`, and `figures.js/css`, built below). Edit the JSON, then
  `node tools/hub-next/build.mjs --hub perio`; after a merge that changed questions, load the hub's answer keys
  ([build-a-hub](../how-to/build-a-hub.md)). Perio's own engine and single-file page went at the release (git keeps
  them: the commit before the release's merge), so the old page's names in this note and in the change log (`REF_SECTIONS`,
  `EXAM_HINTS`, `PCASES`, `two()`, `STATE.ui.qbank`...) are history: the same data is in the JSON (a session's `review`
  sections, `hints`, `pcases`, a question's `fmt`). The old Perio Claude Project's split sources were retired earlier (Sam,
  2026-11-03).
- **Sessions** (`status`): S1-S5 taught (exempt from the format minimums, taught before the rules), S6 taught (since
  2026-11-18, from the class recording: below), S7 taught (Dr. Kaur), S8 taught (antibiotics from Dr. Litz's 2024 recording; host modulation and his
  dosing chart from the Nov 5 class, [task](../tasks/done/2026-11-03-perio-s8-host-modulation-class.md)), S9 taught (2026-11-10)
  from Dr. Abou-Arraj's recorded first part (posted Nov 9), and since 2026-11-14 from the Nov 12 live class too: gingival
  excess, altered passive eruption and crown lengthening, the esthetic evaluation and the tattoo ([task](../tasks/done/2026-11-03-perio-s9-plastic-esthetics.md)). Any session going
  to taught needs the full set: [two-statement-and-true-false](../rules/two-statement-and-true-false.md),
  [numbered-statements](../rules/numbered-statements.md), [high-likelihood-topics](../rules/high-likelihood-topics.md).
- **Sources:** Drive, Periodontology/hubs (class captures, sometimes as base64 `.txt`; slide PDFs; recordings). The Drive
  connector can't download over 10 MB, so a big PDF may be text only. **Lecture-capture transcripts have generic names**
  (`en-FA2026_DENT2145-VT_Lecturecapture_AVLC (1).txt` is S6): search Drive for a session's words, not its title, before
  calling one missing.
- **Quiz card:** `NEXT_QUIZ` shows on Home until its date passes; set the next one there.
- **Figures:** `tools/figures/perio/` (`build.mjs` writes the anima figures into `hubs/perio/content/figures.js` and
  `figures.css`; `--check`, `--preview`),
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
  Since Patient Box v2 (2026-11-20) the kit reads `widget/teeth.js` and cases can be built from modules; the eleven old
  cases (in git before 6b32460) still draw byte for byte as before, and move onto modules if the page ever returns
  ([next steps](../tasks/2026-11-20-patient-box-v2-next-steps.md)).
- **Session 6, Dr. Geurs** (taught since 2026-11-18, [task](../tasks/done/2026-11-03-perio-s6-regeneration-taught.md)): the
  notes follow the class recording (Drive: `en-FA2026_DENT2145-VT_Lecturecapture_AVLC (1).txt`, uploaded 2026-10-25, found
  2026-11-18; it opens "Good morning, so you've had a day of occlusion") with his deck
  (`Periodontal_regeneration_Dr. Geurs.pdf`) and the exam-review guide. 21 Exam Hints, quoted: he said to **study the
  decision tree** in the handout, and that the studies on the defect-morphology slide (deck slide 11: Klein, Tonetti,
  Cortellini, Garrett, Cosyn) are "not there for you to read" (the one `deemphasize` hint), so `q6-L38` (which feature of the
  2021 meta-analysis had the strongest evidence) was retired and `q6-L06`, `q6-L08` lost their study names (same ids). Three
  of his points (the three tissues, 3-wall defects, no root canal needed) he made while looking at the S6 quiz, which closed
  in October: the hints quote only his teaching words, never the quiz. New ids: `q6-T01`-`T08` (true/false), `q6-S05`,
  `S06`, `q6-N01`-`N04`, `q6-W01`-`W04` (which / which-false), `q6-F02`-`F07`; 79 questions, every one with its version B.
  Not in the hub on purpose: his asides (peak bone mass and diet soda, the witch scale, Gouda, fluoride and the
  congressional visit). His five diagrams were approved and built the same day (S6 · Figs 1-5, "Diagram decisions" below).
  **`q6-T02` is retired** (Sam, 2026-11-18: "it can go"): a true/false on his aside that he sometimes skips initial therapy
  before regeneration (root planing tightens the tissue), while S4, S5 and his decision tree put initial therapy first. Report
  #62 said it contradicted the other lectures, and half the class answered False. The aside stays in the S6 notes. Don't write
  an item on an exception without the rule beside it ([LESSONS.md](../../LESSONS.md), reports section).
- **Dr. Kaur's focus for her part of the final** (Sam passed it on 2026-11-11): "really know" peri-implant health,
  peri-implant mucositis and peri-implantitis; her clinical questions are based on them. In the hub: an S7 Exam Hint
  (`src:'relay'`, labeled "Paraphrased": not her exact words), the S7 `note` at the top of its notes, S7's
  `LIKELY_TOPICS` led by "final focus" topics, Review's "Reading an implant case, step by step" (`PI_CASE_STEPS`), a cram
  line, and one drawn case per state: `implant-19` (health that probes 5 mm, with first-year remodeling), `implant-5`
  (mucositis) and `implant-14` (peri-implantitis; risk factors, suppuration, cause), questions `pc-g1`-`g4`, `pc-h1`-`h5`,
  `pc-i1`-`i5`. If she sends anything more about the final, add it beside these.
- **Dr. Abou-Arraj's review for the final** (the end of the Nov 12 class, in Drive with the class's capture; added
  2026-11-14). The format: 60-65 questions, about 15% (20% at most) from S1-S4, an hour and a half that he said can be
  two, multiple choice, multiple answers, maybe categorization, some matching, images and radiographs but no suture
  images, few or no Patient Box cases. It is in an S1 Exam Hint, Home's chips, the hints banner and the mock's blurb
  (`window.SH_HUB` in the page) and the mock (`mock.format` in `content/core.json`: 62 in 90 minutes, 2 Patient Box, 6
  multiple-answer, 3 matching, 1 ordering, and `midShare` 0.15 with `midThrough` 4: `formatMock` in `widget/hub-bank.js`
  takes about 15% of each kind from S1-S4). What he said to know
  and to skip is an Exam Hint per session (S1-S5, S8) and a line in each session's `note`. **36 questions came out**
  under [dont-ask-what-professors-skip](../rules/dont-ask-what-professors-skip.md) (`retired` in
  `tools/question-ids/perio.txt`): S2's suture techniques and suture pictures ("not techniques, but the different
  materials... no images of suture": `q2-10`-`12`, `q2-31`, `q2-E02`, `q2-D01`-`D13`; the diagrams and the technique
  notes stay for clinic), S3's Miller & McEntire ("I would not worry about learning the McIntyre one": `q3-03`, `05`, `06`,
  `33`, `36`, `37`), S5's entrance widths (his email: "This will NOT be a question on the exam": `q5-01`, `q5-04`) and S8's
  doses ("no specific, like, dosing": `q8-L10`, `L17`, `L25`, `L27`, `L45`, `L53`, `L57`-`L59`, `q8-S07`). Kept, same ids:
  `q3-07` (now McGuire & Nunn vs Kwok & Caton), `q2-P01` and `q2-P02` (the suture choice is now PGA, a material), and the
  questions that read a dose's meaning or a drug's use without asking the number (`q8-L11`, `q8-M03`). The chart-reading
  recession items (`pc-c1`, `pc-c2`, `q9-P02`, `q9-P04`) stay: "I don't think I'm going to ask numbers that way" is about
  the format, and they test the RT types he said to know.
- **Two calls that follow his later word** (flagged to Sam in the PR): Dr. Litz said in the Nov 5 class to know his dosing
  chart for the exam; Dr. Abou-Arraj's review a week later said not to, so Dr. Litz's hint is now a de-emphasis that
  says it was superseded, and the chart stays in the notes and Review. And his furcation email corrects what he said at
  the review (the maxillary buccal entrance is the narrowest, mesial and distal about the same and wider, as the notes
  have it from Dr. Litz); its aside that the mandibular buccal entrance is the widest disagrees with Dr. Litz's slide
  (lingual wider, kept as taught below), and since width won't be asked, the notes keep the slide.
- **Narration:** all three levels for every session, made with `python3 tools/narrate.py perio --lec <id>
  --force` (`--text` shows what it will say; it writes the word timings for Follow along beside each mp3 too). Session 5's two mp3s were regenerated on 2026-11-12: their
  middle (minutes 5-9 of Plain English, 6-15 of As taught) no longer said what the notes say, found while making the
  word timings ([narrate-with-kokoro](../how-to/narrate-with-kokoro.md)). **High yield** (the third level) is
  narrated too, since 2026-11-12: `audio/<id>-hy.mp3` for all nine sessions, made from `content/notes.json`. It changes
  whenever a session's notes, predicted topics, hints or questions do, so a question edit can mean recording that session's
  High yield again in the same PR: the smoke lint says which ([text-and-audio-never-drift](../rules/text-and-audio-never-drift.md)).
- **Timmy Time** (since 2026-11-15, for the final; Perio's first episode): `audio/timmy-time.mp3`, its script
  `tools/podcast/perio/script.md`, registered in `content/core.json`'s `podcast` (id `final-review`, chapters, the lore
  comments in `fans`) and `hubs.js`. It follows the final's split (S1-S4 about a sixth of it), leaves out what the Nov 12
  review said to skip (suture techniques, Miller & McEntire, entrance widths, doses) and quotes the hints word for word,
  so **a change to the notes or hints it covers means fixing the script and rebuilding the episode in the same PR**
  (`/podcast`, [text-and-audio-never-drift](../rules/text-and-audio-never-drift.md)). After its merge the server needs
  `admin_set_podcast_episode('<admin secret>', 'perio', 'final-review', <seconds>)` for listening to earn XP. At archiving it
  comes off with the narration ([archived-hubs-drop-their-audio](../rules/archived-hubs-drop-their-audio.md)). Rebuilt
  2026-11-18 with section 6 from S6's class recording: 52 min (3130.7 s, was 49); the After merge workflow registers the length.
- **Arcade:** the Pocket Arcade, skin `PERIO_SKIN`, painted Clinic Escape
  (`img/clinic-escape.webp`).
- **Stage & Grade** (2026-11-17; Sam: "add an interactive visualization/game for staging and grading using all of the
  criteria ... accessible on the home of perio hub, top of the question bank, and in the arcade"): one game in three places.
  Its source is `tools/figures/perio/stagegame.js` + `stagegame.css`, built into `content/figures.js` (between the `stage:js`
  markers) and `figures.css` by `node tools/figures/perio/build.mjs`; never edit the built copy. The bank shows it through
  `SH_HUB.bank.cuspGame` (the hook Occlusion's cusp game uses: `CUSP_GAME` is `STAGE_GAME` here), Home through
  `SH_HUB.home.links` (`#more/arcade/stage`), the arcade through `GAME_IMPL.stage` in `content/arcade.js` (game id `stage`,
  whitelisted by migration_v64; its lobby drawing is `pStage()` in `tools/figures/site/arcade.mjs`). Its rules (`rules()`)
  follow Session 1's notes and Review tables word for word; the generator avoids the class-vs-2018 disagreements (exactly
  10 cigarettes, a light modifier on a Grade A ratio, a 6 mm pocket in a Stage 2 mouth) and cases on a cutoff; Explore
  follows the 2018 table there and says so. A rule change in S1's notes means a change in `rules()` too.
- **Kept as taught** after an outside fact check (2026-10-21), so don't "fix" them: molar-area CTG harvest, Kwok & Caton
  whole-dentition prognosis, stage regression only by regenerating the defect, clinic piezo can't root plane, lingual
  furcation entrance wider, Hamp as under 3 / over 3 mm / through (in class it was called "three millimeter increments").
- **The prognosis systems: two sources that disagree** (found by question health, 2026-11-05). The exam-review guide
  (`RISK_SYSTEMS`) gives McGuire & Nunn "individual teeth" and gives "likelihood of retaining the tooth" to Miller &
  McEntire; the in-class session (the notes, `PROGNOSIS_COMPARE`) says McGuire & Nunn "can be given per tooth or for the
  whole dentition" and is about whether a tooth can be maintained, "meaning kept in the mouth" ("tooth retention"). So
  don't make "retention" or "per tooth" the line between them: Miller & McEntire is molars and a number, Kwok & Caton is
  stability and the whole dentition, McGuire & Nunn is maintainability. `q3-04` and `q3-08` were rewritten that way (same
  ids); since the bank audit (2026-11-15) `q3-01` asks which system can be used diagnostically (McGuire & Nunn only, the
  in-class poll) and `q3-S03` tests poor vs questionable, so neither leans on "per tooth" any more (`q3-05` was retired
  with Miller & McEntire, 2026-11-14).
- **The question bank: no fact more than twice** (the audit of 2026-11-15, [its note](../tasks/done/2026-11-15-perio-bank-audit.md)).
  Sam's bar from Occlusion holds here too: a fact may be asked two ways, never more than twice in the bank, counting a
  statement inside a two-statement, true/false or numbered item and counting across sessions. 750 → 670 questions (103
  retired, 23 new, 263 edited); that evening `q7-07` came out too (report #44: a recall card, the third ask of smoking's
  immune changes; Sam: "retire it"), so 669. When you add a question, check the fact isn't already asked twice. Who owns a shared
  fact: S9 the recession types' treatment (S1 keeps the RT definitions, `q1-08`, and the chart readings `pc-c1`,
  `pc-c2`), S9 the palate's layers, S4 the Glickman definitions and S5 reading one on a case, S5 the re-evaluation
  timing (`q5-R02`) with S4 the reason for it (`q4-L28`). New ids since the audit use `q<session>-F01`, `-F02`...
  Every emphasize hint has a question on its own point; the audit's note lists, by hint, which ones.
  A second audit on 2026-11-17 ([its note](../tasks/done/2026-11-17-perio-final-hints-audit.md)) read the bank against the
  final's hints and the 28 midterm check-ins: 111 fixed in place, `q3-20` and `q1-E03` retired, 8 new (the suture
  materials, `q2-F04`-`F06`: the final asks the materials, not the techniques or pictures), 675.

- **Every question with choices has a second wording** (`content/variants.json`, since 2026-11-18,
  [task](../tasks/done/2026-11-17-reworded-question-variants.md)): a later try shows it. **When you edit a question, edit its
  wording too** (same choices in the same order, a why for each); a new question can get one, or the build is fine without.
  `node tools/hub-next/build.mjs` checks them. They are **A/B versions** (Sam, 2026-11-18): about half the class starts each
  question on B, and question health's `ab_gap` flags a pair whose first tries differ ([question-health](../reference/question-health.md)):
  fix the version that's off, A in `questions.json`, B in `variants.json`. A card shows the letter of the version on screen
  beside its number (`verTag` in `widget/hub-bank.js`; Sam, 2026-11-18: the letter, not "reworded"), and a report says
  "(version A)" or "(version B)".

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
  `esthetics`. Figs 4 and 5 (altered passive eruption, the gummy smile) were checked against the live class on
  2026-11-14: Fig 4's subcategory labels now give A as 1.5-2 mm and B as within about 1 mm, and both captions cite the
  class. Their positions in mm (where the margin, MGJ and crest sit; how far a longer lower third moves the teeth) are
  illustrative, and their labels give only the notes' relations and numbers. Each cites its outside sources in "What
  this shows, and what's simplified".
- 2026-11-14: "Yes to all figures and anima" for the Nov 12 live class: three more S9 figures, built in
  `tools/figures/perio/` and listed after `egd` in `FIG_BY_LEC`. Fig 6 `excess` (pseudopocket or enlargement: Fig 4's
  incisor section with a probe, gingivitis or drug-induced enlargement, as found, after hygiene and scaling or after a
  gingivectomy; in Review's `s9-excess`). Fig 7 `clsteps` (crown lengthening step by step in Type 1B, as in Patient 1:
  sound to bone, trim the gingiva, take off as much bone, or a gingivectomy alone that grows back; in Review's `ape`).
  Fig 8 `smile` (the esthetic checklist from the front: smile line with a lip slider, gingival line, zeniths and
  proportions, for an ideal smile and Patient 1 before and after crown lengthening; in Review's `esthetics`, before
  `egd`). `excess` and `clsteps` import Fig 4's section helpers from `ape.mjs` (exported for them). Patient 1's numbers
  come from the notes (#7 the reference, laterals 1 mm apical before and 1 mm coronal after, 2 mm for 2 mm on the
  centrals); how far #6 and #11 sat, the papillae and the lips are illustrative.
- 2026-11-18: S6's five candidates approved ("yes to all diagrams. merge when ready") and built as S6 · Figs 1-5:
  the race for the space (`race.mjs`), counting the walls (`walls.mjs`), the decision tree step by step (`dtree.mjs`),
  vertical to horizontal (`vtoh.mjs`) and subtraction radiography (`subtr.mjs`), each at the end of its section in the S6
  notes (`FIG_PLACE`, both reading levels) and not in Review (a Review `figs` section draws under the notes too, so it would
  show twice). Sources and what's simplified: [the task](../tasks/done/2026-11-18-perio-s6-diagrams.md).

## On the engine (since the redesign's release)

Built as `hubs/perio/next/` beside the old page ([phase 2](../tasks/done/2026-11-05-redesign-phase-2-live-hubs.md)) and moved to
`hubs/perio/` at the [release](../tasks/done/2026-11-06-redesign-release.md).
- It is in `sw.js`'s `HUBS`, so its page, art and content are precached; a content edit shows on the page load after the
  one that fetched it.
- **The page's weight budget** is `hubs/perio/` in `tools/release/budgets.json`: 850 KB since 2026-11-18 (BUG-176), when
  `node tools/release/perf.js --page hubs/perio/` measured 834 KB, most of it `questions.json` (190 KB gzipped) and
  `notes.json` (167 KB). 885 KB since S6 went taught (2026-11-18, BUG-180: 864 KB measured, S6's notes, questions, version Bs and
  hints +28 KB gzipped). Check it after a big addition; raise it only with a reason in the PR that Sam approves.
- Each session's Review tables sit under that session's notes (`core.noSide`: More's Side by side has nothing left, so
  it's hidden). The Patient Box cases are `core.json`'s `pcases`, checked by `node tools/ci/cases.js`. A chart that
  draws both surfaces labels each one above its strip and says they are one visit (report #61, 2026-11-18); a figure's
  `title` should say which visit it is ("today", "at the baseline") when the case has more than one.
- **Progress carries over:** same hub id, state key `perio-d2-compendium-state-v1`, answered event `perio:answered`, every
  question id (`tools/question-ids/perio.txt`), and **Perio's own saved shape** (`SH_HUB.stateShape: "answered"`:
  `answered`, `totalSeen`, `activeDates`, `achievements` as `true`), which the dashboard reads as it is. The engine reads and
  writes it only through `ansOf()`, `putAnswer()`, `studyDayList()` and `achMap()`, so the old page reads a save the
  engine wrote (checked: a rollback keeps every answer). It adds `nx` (the daily goal) and `read` (Notes done), which the old
  page ignores. The bank's saved filters (`ui.qbank`) move into the engine's once (`ui.qbankIn`).
- **Question health keeps every version:** the export (`SH_EXPORT.questions`) matches the old page's for every question (the
  Patient Box rows before the stem, a multi's keys: `core.exportCase`).
- The engine learned, gated to the hubs that have them: **recall cards** (reveal, then "I got it" / "I missed it"),
  **case links** ("In the notes", `shCases.refHTML`), a lecture's **note** under its title, **HTML review sections**, and the
  **exam-format mock** (`mock.format` in `core.json`, since 2026-11-14 the final's: 62 in 90 minutes, 2 Patient Box, 6
  multiple-answer with partial credit, 3 matching scored pair by pair, 1 ordering, about 15% of each kind from S1-S4
  (`midShare`, `midThrough`), points per session). Its arcade (`content/arcade.js`, with `PERIO_SKIN`) is the old page's, wrapped like the others';
  its `start` / `stop` are mapped to the engine's `startGame` / `stopAll` (`--ar-*` colors ending in `--ar-lilac`; Bungee,
  which the page doesn't load, so it falls back to Arial Black).
- `window.SH_HUB` in the page holds the hub's own words (Home's final card and chips, the hints banner, the mock's blurb,
  the arcade's games with their current names, Pocket Showdown first). Its Timmy Time episode is `content/core.json`'s
  `podcast` ("Timmy Time" above), so Home has the Timmy Time quick link and More its tile.
- Its text color is a deeper pink than its art's ink (`#9e3a60`, 5.1:1 on its light pink; the ink is 4.05:1), in `widget/hub.css`.
- Its art: tint `#b4466f`, emblem and masthead (phase 0), and the arcade lobby drawings (`tools/figures/site/arcade.mjs`,
  `pBoard()` to `pCrusher()`, built into `widget/hub-art/perio.js`). Sam approved five on 2026-11-11 ("the other drawings
  look good"); **Pocket Showdown's** first teeth "look terrible", so `pBoard()` was redrawn as the game's own board (molars
  in their gums, a column per session, like Heme & Endo's approved Showdown), and Sam approved the redraw the same day. All
  six are in. A change to one: edit it in `arcade.mjs`, run `node tools/figures/site/build.mjs`, commit
  `widget/hub-art/perio.js` and `tools/preview/design/art.js`, and show Sam before it goes in.
- Not carried over (on purpose): the MCQ sprint and the midterm's scope (the midterm is over), the old lobby's daily
  rotating first game (Pocket Showdown is first), hints' slide and email source tags. Active recall is the
  [Learn and Flashcards](../tasks/done/2026-11-06-redesign-learn-and-flashcards.md) task's.

## Pending

Nothing: the page came down 2026-11-19. What follows was pending when it did, kept for the next Perio hub.

- Question health was read after the final (2026-11-19, the retrospective): every possible miskey it flags matches the notes
  (`q6-L37`, `q5-L43`, `q3-S02`, `q6-N01`, `q6-N03`, `q7-T08`, `q8-T07`, `q9-L38` and the twelve the 11-18 audit read). Reports
  #55/#56 (statements reordered on a retry) were done in #417.
- [The visual case engine](../tasks/done/2026-11-04-perio-visual-case-engine.md): the first six cases are in for Sam's
  look; the expansion (every session's Patient Box items as drawn cases, S3 and S4 cases) waits for approval.
- S9's two sources differ on recession prevalence (the recording vs the slide's 88% / 50%) and on ADM (a slide says
  comparable or superior to autografts, the exam-review guide says it doesn't work as well): the notes give both and
  no question turns on either. S9's drawn cases, modeled on two of his recorded cases, are `no-kg-24` and
  `recession-11` in `PCASES`.
- S8's dosing chart (the last table in Dr. Litz's slides, which he said to know for the exam) differs from his
  drug-by-drug slides for clindamycin (qid × 10 days vs tid × 7), doxycycline (a double first-day dose) and Augmentin
  (250 or 500 mg tid vs 500 or 875 mg): the notes give both and no question turns on the difference. Since 2026-11-14
  the doses aren't on the final at all (Dr. Abou-Arraj's review), and the dose questions are retired. Its meal-timing
  column couldn't be read reliably from the PDF text, so it isn't in the hub.
- The bank audit's list of things in the notes that read wrong or disagree (S1 "more than 10" vs "10 or more", S2's
  chromic gut, S3's "#14", S4's long junctional epithelium, S5's stale cram line, S6's contained defect, S7's B.
  forsythus, S8's cephalosporin claim), in [the audit's note](../tasks/done/2026-11-15-perio-bank-audit.md): Sam said
  leave them (2026-11-15, [decisions](../decisions.md)). No question turns on any of them; don't re-propose them for this final.

History: grep `perio` in the change log (`DEPLOY_NOTES*.md`, its monthly archives included).

Related: [home](../home.md) · [occlusion](occlusion.md) (same final day)
