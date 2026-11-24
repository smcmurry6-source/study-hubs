# Lessons from archived hubs

Sam's standing rule (2026-09-29): **every time a hub is archived, use all the data gathered on it to improve the
next hubs.** This file is where that lands. It is shared by every session (Claude Code, Cowork, each hub's Claude
Project): read it before building or restructuring a hub, and add to it whenever one is archived.

**Last refreshed: 2026-11-24** (7 to 9 am Central, Review of Systems' second week, nine days before its Mock 1; it found 52 answer keys one choice off and fixed them; the game economy is read too, Sam's rule since 11-18). Sam
runs the lessons refresh by hand (`tools/lessons-refresh.md`): it updates this file from all tracked data, reports and suggestions
and ships small fixes to the live hubs. **Before building a new hub, if this date isn't today, run steps 1-3 of
`tools/lessons-refresh.md` first.**

## When a hub is archived: the retrospective

Do this in the same session that archives the hub (while its page is still up, so `tools/dump-banks.js` can read the bank
locally; banks are no longer committed), and tell Sam
what you found.

1. **Pull everything.** Run the queries in `tools/retro.sql` with the Supabase connector (read-only) for that hub
   and its exam date. Use all of it, not just question accuracy:
   - **Time by section** (`activity_hourly`, n pings of 25 s per hour; raw pings are kept 30 days): which modes and sub-views people actually studied in,
     and how that shifted as the exam got closer.
   - **Clicks and reach** (`ui_clicks`, `ui_click_reach`): which buttons, tabs and widget tools people used and how
     many people found each one. Pair with time: lots of time + few clicks = being read; a feature with under 3
     people = hard to find or not wanted.
   - **Engagement**: people, study days per person, bounces (< 5 min), answers per person, who came back,
     Daily Drill (`drill/daily`), mock scores (`mock_scores`), arcade plays.
   - **Questions**: accuracy by lecture, type and source (join `question_stats` to the saved bank locally),
     the hardest items, the most-picked wrong answers (`question_choices`), questions nobody reached.
   - **Student voice**: exam check-ins (`exam_debriefs`: readiness, how it went, hub vs exam, what the hub missed,
     each next to that person's time and answers), searches with 0 results (`search_terms`), reports
     (`question_flags`, `hub_suggestions`) and survey answers.
   - Perio and MSK Exam 3 are the first hubs with full data (clicks from 2026-09-25, per-section time, the
     15-minute idle rule, Daily Drill, mock scores); GI Exam 2 had no section data and no clicks.
2. **Decide what changes.** Turn findings into concrete changes for the live and next hubs, split into
   *cross-hub* (widget, dashboard, the hub template) and *content/authoring* (question style, which lectures need
   more, what the exam asked that the hub didn't). Things that are clearly bugs or small fixes: fix them (branch +
   PR as usual). Bigger ones: list them for Sam.
   Then turn it into **better questions and better lecture summaries** (see "Using the data for questions and
   notes" below): the retro is only done when the findings are written as authoring guidance, not just numbers.
3. **Write it down here**: a new section under "Hub retrospectives" (numbers + what they mean + what to do), and
   fold anything durable into "Standing lessons" below so the next build sees it without reading every retro.
4. Add a line to `DEPLOY_NOTES.md` "Recent major changes" pointing here.

If the data contradicts a standing lesson, update the lesson; don't keep both.

## Using the data for questions and notes

What each signal tells an author, and what to do with it in the next hub (and in live hubs of the same course):

**Writing questions**
- **Most-picked wrong answer** (`question_choices`): that choice is the class's real misconception. Keep it as a
  distractor (it works), make the explanation say why it's wrong in one sentence, and write a second question that
  tests the same distinction from another angle.
- **Correct 90%+ with many attempts**: the question is too easy or gives itself away (check the length/label
  giveaways fixed on 2026-09-29). Rewrite the distractors to be same-category and length-matched, or drop it.
- **Under ~30% with 20+ attempts**: first rule out a bug, a wrong key or an ambiguous stem (read the reports for
  that id). If it is fair, the concept is hard: add it to exam hints / the cram sheet and to the Daily Drill's
  high-yield pool, and cover it more clearly in the notes.
- **By type**: matching and sequence items score far lower (see below); use them sparingly and grade per pair.
- **Two sources, two wordings** (question health, 2026-11-05): when the exam-review guide and the class word a concept
  differently, a distractor taken from one source's wording can be the other source's right answer. Perio's guide gives
  "likelihood of retaining the tooth" to Miller & McEntire, but the class notes call McGuire & Nunn "tooth retention" and
  say it can be given for the whole dentition, so `q3-04` (25% first try) and `q3-08` (stronger students missed it more)
  had a second defensible answer. Tell things apart by what both sources agree on (Miller & McEntire: molars, a number).
- **The stem's word in one choice only** pulls picks to it: perio `q4-06` asked "Which scaler..." and only the wrong
  "H6/7 sickle scaler" said scaler, while the key was a bare "S204SD9". Name every choice the same way.
- **A picture must sit where the thing sits**: PCD Implants' subperiosteal drawing had its lattice 12 px below the crest,
  so it read as set into the bone, and half of the recent tries picked "Blade". Draw on-the-bone parts on the crest line.
- **A second wording doesn't change difficulty** (Perio's A/B versions, 11-18 to 11-19, half the class starting each question on B):
  first tries 78.7% on A (6,313) and 78.3% on B (6,466). Item gaps with 10-17 people a side are mostly noise; read one only when a
  version has a visible flaw, like `q7-L27`'s A, whose choices paired the same two numbers both ways unlabeled (A 8% of 12, B with
  "Smokers 11.3%, nonsmokers 4.76%" 63% of 16). Label both numbers in a choice that pairs them.
- **A flag on 8-10 recent first tries**: read it beside the all-time numbers before acting. The night before the PCD
  Implants exam, most of its "possible miskey" flags were small recent groups on keys the notes confirm (`ev-pic-sub` 2 of
  8 since 11-04, 21 of 32 ever).
- **Say why the patient fits** (Heme & Endo Exam 3, report #67): a student read `dc-acro`'s 47-year-old man as the wrong patient
  for growth hormone excess, though it is when acromegaly is usually found. When a case's age or sex is part of the answer (GH
  excess after puberty, a disease of children or of older adults), the explanation says so in one line.
- **By source**: what the professor put in class quizzes and polls is what students practice most and what exams
  echo. Mine those first; tag `src`.
- **Exam check-ins** ("Hub was harder/easier", "Exam asked different things", and what it missed): calibrate
  difficulty and question style to the exam, and add the missed topics to the next hub for the same course/professor.
- **Searches with 0 results**: terms students expected to find. Each is a missing fact, synonym or abbreviation;
  add it to the notes (and a question if it's testable).

**Writing lecture summaries**
- **Time and lecture picks in notes** (`compendium/notes`, `lec=` / `goto-lecture=` clicks): the lectures people
  open most are the ones they find hardest or most tested; give them the most careful summaries, tables and
  mind maps. Lectures nobody opens may be too long to start; lead them with a short "what's tested" list.
- **Plain English vs As taught** (`level=plain` / `level=full`) and **Listen** (`#sh-tts-btn`): if Plain English
  gets used a lot, write it for every lecture from the start; if Listen is used, keep narration current.
- **Low accuracy on a lecture's questions** after people read its notes: the summary isn't landing. Rewrite the
  weakest sections around the misconceptions above (name the trap, then the right answer), add a comparison table
  for look-alikes (e.g. Crohn vs UC), and move exam hints into the relevant paragraph.
- **What the exam asked that the hub missed** (check-ins): add those topics to that lecture's summary, and note the
  professor's emphasis for the next course they teach.

## Live signals (rewritten by each refresh)

**2026-11-24, morning (data read 7 to 9 am Central).** "Since" = the last audit (11-20, 3 pm). Live hub: **Review of Systems** alone
(two mock boards, Thu Dec 3 and Thu Dec 10). **The database is 287 MB** of the Free plan's 500 MB (358 at the last audit: the shorter
analytics windows, `migration_v95`, and the archived hubs' answers packed, `v96`, took about 70 MB off; `personal_answers` 69 MB,
`activity_pings` 34, `xp_seen` 32, `answer_xp` 27, `xp_awards` 20); **the repo 2.39 GB** as GitHub counts it (2.4 GB on 11-21: no
growth); **the site 42 MB** of 1 GB. **Data quality** (the admin page's kept copy, 1 am today): no test rows in clicks, events, time or
answers.

**Review of Systems has started, slowly** (the week after back-to-back exams, Thanksgiving week): 21 people ever, 16 hours, 7 under 5
minutes, 10 on one day only, a median 11 minutes each; **Monday 11-23 was its first real day** (14 people, 651 minutes). 613 answers
from 14 people, 68% right; no mocks yet. Time: notes 452 minutes (15 people), the bank 385 (11), Learn 57 (a couple), Home 40 (20).
Reading levels: High yield 6 people, As taught 6, Plain English 4; one-page sheets 5; Ask Timmy a few. The bank opens on Head & Neck,
the first course, so that is where the answers went: **12 of the 14 answerers, 328 answers**.

**52 answer keys were one choice off, and the class found them** (fixed in this audit). On 11-23 and this morning students reported 10
Head & Neck questions and one Fundamentals I question as keyed wrong (two of the reports drafted by Ask Timmy from the notes). Each key
pointed one choice past the right answer, the one its own explanation and why lines describe. Seven agents then read all 1,369 keys
against their explanations and why lines, one or two courses each: **51 of Head & Neck's 68 single-answer items** (plain, EXCEPT,
which-is-true and which-is-false) were shifted, every one by exactly one place, plus `f1-biomol-03`; Head & Neck's true/false,
two-statement and numbered items and every other course were right. The keys were wrong from the build (11-19, #480), not from #541.
The data says the class knew better: on **first tries** (before any explanation) 39 of 63 answers to these questions picked the true
answer and were marked wrong, 11 picked the old key; on **retries** 25 of 35 switched to the hub's wrong key. The 52 keys are fixed,
`tools/data-fixes/2026-11-24-review-of-systems-keys.sql` recounts their class numbers after the merge, and the After merge workflow
loads the new keys. A question someone answered right and was told was wrong stays among their misses until they answer it again (an
answer's pick isn't kept per person). The lesson is a standing one now ("A bank built by many drafting sessions"). The same read found
a few slips, fixed: when troponin reaches the blood (`f2-genpath-20`, its notes and cram line said at 20-30 minutes, about when the
cells die; it is a few hours later), the panoramic chin-down error (`rd-anatomy-07` and its notes said a "frown"; it is an exaggerated
smile), two why lines swapped (`em-prevent-08`), a case about a woman that said "him" and "the extraction" at a scaling visit
(`em-cardiac-02`), a why line that started "Also" though the choices are shuffled (`em-cardiac-15`), a cusp named wrong in a why line
(`da-posterior-08`), a number that didn't match its stem (`f1-cells-18`), a typo, and an explanation that named a classmates' guide
(`f1-molbio-02`).

**Listen** (report #68): on F1-1 the device voice "won't play or give options to speed up or slow down". The hub has no recordings, so
Listen is the device's voice, which has a voice picker but no speed control, and reads a whole part as one utterance (up to about
27,000 characters at As taught); started 6 times by a couple of people since 11-20. Not reproduced here (a headless browser has no
voices): [BUG-199](vault/release/bug-log.md). Every new hub reads this way now ([no-narration-in-the-repo](vault/rules/no-narration-in-the-repo.md)).

**Check-ins:** Heme & Endo Exam 3 has **16** (13 since the retrospective's first few): About right 13, Hub was harder 3, none "easier" or
"different"; Better than expected 13, About what I expected 3, none worse; readiness median 3 of 5; their median 215 minutes in the hub
against 68 for everyone (the standing lesson on heavy users holds). A few more for the Perio final and the Occlusion final, nothing
written that names a topic. No survey answers. Searches: two in Review of Systems, nothing to add.

**Did the last refresh work?** Nothing to measure: the last audit changed no question. **Read next time:** Head & Neck's first tries
on the 52 fixed keys against the rest of the bank's (they should go from 17% "right" to about the bank's average), and whether the
reports stop.

**The game economy** (Sam's standing rule since 2026-11-18, [earn-rates-stay-enjoyable](vault/rules/earn-rates-stay-enjoyable.md);
`tools/economy.sql` over 11-21 to this morning, the first quiet days with today's rules: v92's seven prizes from 11-20, v97 to v99's
eve boss, weekly pennant and mystery box from 11-22; prices unchanged since 11-18). **Skews:** a small sample of the heaviest users (13
people, 18 study days), short days in a quiet week, and v92's and v89's back pay (11-20) still in the wallets.
- **Earning:** the median study day earned **about 300 crowns** (25th percentile 90, 75th 600, 90th 875) in a median 24 minutes; per
  hour **625 crowns and 920 XP** (exam week, 11-19 and 11-20: 650 and 1,195). The class's rhythm (E2, 28 days, 116 people): the median
  student has 8 study days in four weeks (the middle half 2 to 14).
- **The ladder in median study days** (at 300; a heavy day of 600 in brackets): Common 0.3-0.6 (0.2-0.3), Uncommon 0.8-1.5 (0.4-0.7),
  Rare 2.3-4.0 (1.2-2.0), Epic 5.0-9.2 (2.5-4.6), Legendary 13-26 (6.6-13). **In a normal week every band sits on the yardstick** (Rare
  2-4, Epic 5-10, Legendary 10-20); exam week's 950-crown days put every band under it. The prices fit the quiet weeks and run fast in
  exam weeks.
- **Wallets** (the 13 who answered since 11-21): median **16,840 crowns** (10th percentile 7,360, 90th 32,480); 11 of 13 could buy the
  priciest piece (8,000), all 13 a Rare. **31% of what they earned has been spent** (12% across 74 people in exam week: a different,
  heavier group). Since 11-21: 48 purchases, about 54,600 crowns, from a few people each day; 16 mystery boxes (12,000 crowns) since it
  opened on 11-22; 7 people opened the shop and 7 their place. All time: 126 purchases from 24 people, about 177,500 crowns.
  **Signs seen: too fast by the wallet test only** (the median wallet of these heavy users holds more than the priciest piece and
  most could buy anything; an Epic takes 5-9 median days, not under 3); **not hoarding** (31%), not "too slow".
- **The leaderboards** (E7a, totals): 50 names. The rank board's top ten hold 35,470-56,770 XP (median 42,320) against everyone's
  middle half 17,260-34,550 (median 22,580). **Study streaks broke over the quiet weekend**: a couple of the 50 keep 3+ days (47 a week
  ago). Arcade boards with 5+ players: the same eight, all archived hubs'.
- **For Sam** (the last audit said a normal week proposes again only if the too-fast sign holds; it holds for wallets, not for the
  ladder): in the PR, keep the prices, or add a shelf above Legendary for the full wallets, with numbers.

**Older feature readings (kept for reference; the standing lessons carry what they mean):**
- Heme & Endo (10-27 to 10-30): "Try it again" reached 63 of its 67 answerers (4,258 retries shown, 79% right); High likelihood order
  23 people and "High likelihood only" 21; the likely-tagged questions took 40% of all tries (10,133 of 25,399) at the bank's average 82%.
- All hubs to 10-19: **Timmy Time** (MSK 4, from the eve): 21 people pressed play, 287 min in all, 15 on the eve (of 58 MSK 4 visitors
  that day) and 7 on exam morning; 10 listened under 5 minutes and a few heard the whole 42 minutes; speed button 16 people, chapters 13.
  **Timmy Tooth**: 35 adopted (15 on launch day, 10-01), 33 of them studied in the last week, 25 tapped him after 10-13, 16 earned the
  perfect-health trophy; a few turned him off. Almost nobody said "No thanks" in his introduction, so the ~50 dashboard users who haven't
  adopted him never opened it (Sam, 10-20: he stays on their name and keeps asking to be tapped). **Listen** 23 people ever (MSK 3 11,
  perio 9, Occlusion 7, PCD 6, MSK 4 6), **mind maps** 36 (MSK 3 23, PCD 14, perio 11), **highlighter** 12 (most in Occlusion and
  MSK 4), own names 12 (47 opened the name editor). MSK 4's interactive diagrams: 18 of 71 visitors; its 8 picture questions got 19-45
  tries each, 62-89% right.
- Tracking (`feature_events`, `window.shTrack` in `widget/clicks.js`, from 10-20): page loads, a daily settings snapshot, settings
  changes, easter eggs, how Timmy Tooth's introduction ends, podcast and Listen minutes and progress, diagrams, mind maps and names;
  `notes-jump:*` and `qrate:*` from 11-04. Read it in `review/` -> Clicks -> Features, or
  `select hub, kind, count(distinct visitor_id), sum(n) from feature_events group by 1, 2`.

## Standing lessons (read before building a hub)

- **Almost all studying happens in the last 3-4 days.** GI Exam 2: 35% of all time was the day before the exam
  (53 of 78 people); days 5+ out were small. Perio midterm: 42% of all perio time was the day before (57 people, 91 h). MSK Exam 3: 44% (61 of 87 people, 89 h),
  and 26 of those 61 opened the hub for the first time that evening; PCD Implants: 40% (73 of 88 people, 20 of them new that evening); Heme & Endo Exam 2: 37% (62 of 86, 12 new that evening); over half of all MSK answers came on the eve and
  exam morning. **For an evening exam the exam day is the eve**: the Occlusion final (6:30 pm) took 42% of its time on
  exam day (83 people, nearly all of it before the exam) and the day before only 30%. **The Perio final** (cumulative, a morning exam) had the biggest eve
  of any hub: 52% of the final's time on the day before (87 people, 283 h, 57% of its answers), after seven quiet weeks. **Back-to-back
  exams leave the second hub one evening**: Heme & Endo Exam 3 was the morning after the Perio final, 75 of its 88 people had studied for
  Perio in its last three days, and it took 74% of its time in that one afternoon and evening (76 people, 124 h; 53 first visits that
  day), for half Exam 2's hours. Finish such a hub, and cut it to its highest yield, before the first exam. Have every lecture's questions in the hub by ~4 days before the exam,
  and put the quickest high-yield review (Daily Drill, cram sheet, exam hints) where the night-before crowd lands.
- **Lecture notes and the question bank are the hub.** In perio and MSK (per-section data, 2026-09-23 on) notes +
  bank are ~80% of time; the first survey's "most helpful" answers were Question bank 4, Lecture notes 1. Arcade,
  review tables, mock exams and Atlas-style extras each get a few people. Build and polish notes + bank first. Final numbers: MSK bank 99 h + notes 62 h of
  204 h; perio bank 98 h + notes 51 h of 217 h; PCD 3 bank 106 h + notes 77 h of 212 h; MSK 4 bank 60 h + notes 45 h of 131 h; PCD Implants bank 159 h + notes 136 h of 339 h, the notes
  leading the first two of its three days (when a hub opens days ahead, people read first and drill on the eve). Heme & Endo Exam 2
  again: bank 174 h + notes 144 h of 360 h, the notes ahead until two days out. **High yield is the reading level people pick**
  once it's there: Perio's final, the first hub with it for a whole run, High yield 32 people, As taught 23, Plain English 11; Heme &
  Endo Exam 3, 42, 19 and 15. **A professor's study guide is read first when there is one**: Exam 3's guide page (the guide's items with
  what was said in class) reached 38 people and its bank filter, On the study guide, 34, of about 75 who studied that evening; give it
  both from the day it arrives.
  **The extras each reach a minority**: across all hubs to 10-19, Listen 23 people ever, mind maps 36, the highlighter 12,
  MSK 4's interactive diagrams 18 of 71, the Timmy Time podcast 20 (a third of the MSK 4 eve crowd; a few heard it all; the Perio
  final's, made four days out, 20 people and about 650 minutes, the most of any episode, three quarters of its time on exam morning). The widget's
  search panel is used least of all (8 searches from 10-01 to 11-04, across every hub), so don't wait on zero-result searches to find
  missing content. **Both arcades together got 1.4-1.7% of hub time** (MSK 19 people, 3 h;
  perio 30 people, 4 h), and the people who played most were heavy studiers anyway (top 5 arcade players: 31-61 arcade
  minutes each inside 191-631 total). Of 18 arcade games, the most-played had 9 people and 50 runs (MSK Sort Storm);
  only 3 people saved a score in the same game on two different days.
- **Matching and sequence questions score ~30 points lower than MCQ** (GI2: 53% vs 84% MCQ, 74% recall) and are
  over-practiced because people retry them. Grade them per pair/step (perio does since 2026-09-26), keep them short
  (4-5 pairs), and check any item under ~15% with 20+ attempts for a grading or wording bug before assuming it is
  just hard (GI2 `gp26`/`mt10`, Crohn vs UC matching, 5-7% over 39 and 67 attempts). **Ordering questions longer than 4-5 steps
  barely work:** MSK's six-step sequences sat at 16-23% over 17-30 attempts each (09-30) even with per-step feedback,
  because one misplaced step makes the whole item wrong. Final MSK numbers: 7 of the 11 items under 50% (15+ tries) were
  orderings, 17-48% over 48-68 tries each, and they dragged Bone Development to the lowest lecture (71%). **Select-all questions with many options are the same trap**
  (perio `q3-M01`, 5 of 7 options correct: 20%); keep them to 4-5 options, and name every option in the explanation. Patient Box select-alls are the worst of all under exam pressure (perio `q1-P05` 3 of 15 right, `q2-P01`
  11 of 34 on midterm eve), and until 2026-10-01 their per-option picks weren't recorded. From then on `question_choices` has one row per ticked
  option (`record_choices`), and the three 7-option perio items are down to 5 options, 3 correct: compare after the final. **But only perio's
  engine sent them**: the Occlusion engine and every hub copied from it (Heme & Endo, Special Patient Care, PCD Implants) recorded no
  select-all ticks until 2026-11-04, so PCD Implants' 39% `tm-mm-1` couldn't be diagnosed. A hub's answered event carries `picks` for a
  select-all (its `recordAnswer`); after adding a question type, check that a `question_choices` row lands for it. **Never give two left items
  the same right-hand answer** unless grading compares text: perio `q4-L27` had "4-6 weeks" twice, and picking
  the other copy was marked wrong (20% correct; grading compares text since 2026-09-29).
- **The last lectures before the exam get the least practice and score lowest.** GI2's GI Pharm and GI Path were
  answered ~17 times per question vs ~30 for the early lectures, at 71-73% vs 81-84%. Still true: MSK 4's last lecture
  (NMJ) got 26 tries per question vs 38-45, and Occlusion's Applying Occlusion 7.7 vs 25.5 for Lecture 1 on its eve-1. The Daily Drill and mock
  exams should lean toward late-added lectures; say on Course Home when new questions land. **It is bank order too, not only arrival:**
  PCD Implants had all nine lectures from its first day, and two days out practice still fell lecture by lecture (23 of 31 answerers on
  L1-L2, 6-7 on each of the last four, 1.5-5 tries per question vs 18), because the bank opens "In order" and people start at lecture 1.
  Point Home's "Where to next", the drill and the mock at the lectures with the fewest answers, whenever they were added.
  **The lag closes by itself when there are days to spare**: PCD Implants' last four lectures went from 7-9 answerers each to 12-16 on
  day two (18% -> 35% of answers), while Home's new "Practiced least" row got no taps ("Where to next" got 2 in two days). Have every
  lecture in the bank from the start; the pointers matter most for a hub that opens 1-3 days out, or a lecture added last.
  **Final reading, PCD Implants:** on the eve and exam day every lecture had 43-47 answerers (the last four 12-17 before) and the last
  four took the most answers; the quick start's least-practiced button reached 7 people, the row none. The class fixes the lag itself. **Steer
  through what people already tap**: the quick-start row and the bank's own filters (bank order, the lecture picker, "Not answered
  yet") are where a nudge lands, not a row lower on Home. Heme & Endo Exam 2 again (11-12): L14 and L16 went from 5-6 tries per
  question to 23-26 on the eve. **What the default bank leaves out doesn't catch up**: its Exam 1 Refresher (review only, ticked by
  hand) reached 13 of 59 answerers by the eve and 18 of 64 in the end (3.2 tries per question), for 5 of the exam's 50 questions;
  none of its 9 check-ins named it, so whether that cost anything can't be told.
- **Questions from class quizzes/polls are practiced most.** GI2's exam-2 quiz and PollEv items averaged 32-38
  attempts per question vs 22 for hub-written ones. Tag the source (`src`) and label them. The same goes for the
  professors' own hints: PCD 3's `hint` items (from the course's exam-hint email) got 49 tries per question vs 35-40, and
  a check-in said "the exam followed the hints a lot". When a course sends hints, build the blueprint and questions on them.
  Heme & Endo Exam 2's in-class review questions (asked as given, each with a twin) were the most practiced and best answered in
  its bank: 41.5 tries per question, 55 people, 86%.
- **Look-alike conditions need a side-by-side table, not just paragraphs.** GI2's two Crohn vs UC matching items
  were the hardest in the bank (5-7%) and its GIST/interstitial-cell items were all under 35%. Notes for any
  lecture with paired look-alikes should have a comparison table and a question per distinguishing feature.
  Students ask for them too (survey round 2: "comparative summary charts of related material to help recognize
  patterns"), so every hub's Review gets a **Side by side** group of comparison charts built from its hardest items
  (Occlusion has the first, 2026-10-20), and every Review group is labeled with its lecture ("Review section should
  match lecture titles"): name a group after its lecture when it covers one lecture.
- **Many visitors bounce.** All time, 26-40% of each hub's visitors spent under 5 minutes in it (GI2 31 of 78, MSK 23
  of 87, perio 46 of 120), and about half came on one day only (37 of 78, 40 of 87, 65 of 120). Bounces are lowest on
  the exam eve (perio 3 of 57, MSK 5 of 61) and highest on exam morning (MSK 15 of 47). The landing view should get someone to a question or the notes in one tap.
  Perio (2026-09-29): 47 of 58 people saw Course Home, ~30 reached notes or the bank, 23 left within 5 minutes.
  Perio now opens with a one-tap row (Practice questions, Daily drill, Lecture notes); check next refresh whether
  the under-5-minute share drops and which button gets used (`practice=midterm`, `sh-drill=quick`). First read
  (09-30, midterm eve): 6 of 36 under 5 minutes, and "Practice questions" is the button people use.
- **Write questions in the exam's formats, not just its content.** The perio midterm used two-statement items
  (two numbered statements; choices: both true / both false / 1 true 2 false / 1 false 2 true), "all of the following
  EXCEPT" and "which is NOT true", and suture pictures; the hub had none of them, and 6 of 14 check-ins said it went
  worse than expected despite everyone feeling ready (4-5 of 5), heavy users included. Final perio count, n = 25 check-ins: Hub was easier 10, Exam asked different
  things 4, About right 11; MSK Exam 3's check-ins (n = 8: About right 4, harder 2, easier 1, different 1) asked for EXCEPT items, image labeling and Patient Box items that test mechanisms. A late perio check-in (n = 27) asked for "cases with pictures, charts and radiographs":
  Patient Box items should show the chart or radiograph finding, not only describe it. Every hub gets a share of
  two-statement and EXCEPT/NOT items from the start (render two-statement choices in that fixed order:
  `fmt:'2stmt'` in perio), and asks Sam early whether the professor uses images. When a class table simplifies a
  published standard (staging/grading), put the full standard beside it and say where they differ.
- **Two-statement items weren't enough on their own: add numbered-statement items and the professor's wording.** Occlusion
  midterm check-ins (n = 14, 7 "worse than expected"): the exam had two-statement true/false, "pick the numbers" items (four to
  seven numbered statements, choices are combinations) and "tricky wording". Every hub from Heme/Endo Exam 1 on gets a few
  numbered-statement items per lecture besides the two-statement and true/false rule, and stems phrased the way that
  professor asks (NOT/EXCEPT, "most likely", "best explains"), drawn from how they word their own slide questions. A PCD Implants check-in
  (2026-11-07) asked for one more: "which statement is correct" items whose four choices are four different statements; add a few beside the other formats. **A standing
  rule since 2026-10-28** (`vault/rules/numbered-statements.md`: at least 2 per taught lecture, CI-checked); Occlusion got
  16 (`nums()`), and the final will show whether they close the "Exam asked different things" gap. **First read, Heme & Endo Exam 1**
  (the first hub built with numbered items, the professors' focus lists and an in-class review set from the start): of 10 people who
  checked in, 8 said "About right", 1 "Hub was harder", **none "Exam asked different things"** (13 by 11-04: 10 About right, 2 harder). The
  same people moved: of the 7 who said the Occlusion midterm "asked different things", 5 checked in after Heme & Endo too, and most of
  them said About right (two courses and professors, so a pointer, not proof). Final Heme & Endo count, n = 13 people: About right 10,
  Hub was harder a couple, none "different"; the Occlusion midterm stood at 18 check-ins by 11-11 (About right 9, different 7, easier 2). Statement formats are the hardest in its
  bank (two-statement 73%, numbered 75%, true/false 84%, plain MCQ 83%): keep them, they are where the practice is.
- **The exam is harder than the hub, and case questions matter.** GI Exam 2 check-ins: 2 of 4 said the hub was
  easier than the exam, and one said it missed "patient box style questions". The Occlusion final (n = 22): **10 said the hub was
  easier**, 7 that it went worse than expected, though nobody said the formats were missing any more. Every new hub gets case-based
  (Patient Box) questions from the start and some harder two-step items, not only one-fact recall.

- **Draw a figure the way the professor's slide draws it.** A view can be correct and still the opposite of the slide:
  Occlusion's horizontal envelope had anterior at the top (true from above), Dr. Givan's slide has it at the bottom, and on exam
  day a student wrote that it was confusing because "he's more likely to ask questions from his version" (suggestion #11).
  Before a figure ships, put it next to the slide: same orientation, same sides, same numbering where possible, and say in the
  caption which way it faces. Fix figures in their build source, never only in the built hub.
- **Dates live in two places; check both.** A hub's own `EXAM_DATE` / `SH_EXPORT.exams` and its dashboard `HUBS` entry
  must agree: the dashboard entry drives the auto-archive (10 pm on the last exam day) and check-ins. On 10-08 a PCD
  date fix moved MSK Exam 4's dashboard date a day early by mistake, which would have archived its card on exam eve
  (caught in the 10-10 audit). After any `HUBS` date edit, compare each hub's two dates.
- **Use stops the day after the exam, even when the next exam is weeks away.** Perio had 63 people on midterm day, then
  2 on 10-02 and 1 on 10-03, with a cumulative final 7 weeks out. Nothing in these hubs pulls people back between exams
  (the Daily Drill reached 17-20 people per hub, 8 of them on 2+ days, all in exam week). A hub meant for steady use
  needs its own reason to return (a short daily set, new content announced, a goal per week), and should expect to be
  measured by exam-week use regardless. **A cumulative final needs its own push on the old material**: Perio's final (about 15% from
  the midterm's S1-S4) got practice in proportion (S1-S4 19-27 tries per question, S5-S9 65-72), and seven weeks after the midterm
  S1-S4 had the lowest first tries (67-78% against 77-81%; S3, the risk tools and prognosis systems, the lowest). Put the old
  sessions' High likelihood items in the drill and the cram for the last three days, and say on Home how much of the exam they are.
- **Name the favorite wrong answer in every explanation, but don't expect a number to prove it worked.** Earlier readings
  credited these fixes: MSK 10-01, five MCQs 35-52% -> 67-82% within a day (`h-nut-vitA-epith`, `h-tu-gct-demo`, `h-ai-mikulicz`,
  `qz-rickets`, `sl-calcitriol`); Heme & Endo 10-29, MCQs and numbered items up 10-28 points (`pa-num-1` 52% -> 80%); PCD Implants
  11-04 (`ev-misch` 50% -> 68%, `im-template-vdo` 59% -> 83%). **A check with a comparison group (2026-11-12) says most of that is
  regression to the mean**: on Heme & Endo Exam 2, of the items under 40% on 8+ first tries, the 8 given an explanation fix rose 27% ->
  60% on first tries and the 10 left alone rose 32% -> 57%, while the bank went 70% -> 72%; the final reading (11-13) of that hub's last five fixes was 38% -> 36% on first tries, against
  36% -> 42% for the 28 unfixed items as low. An explanation can't reach a first try
  (`try` counts a person's whole history, so the first try comes before they've seen it), same-session retries are about 92% right
  with or without a fix, and next-day retries, where a fix would show, are few (114 over that hub's run, 61% right). So: keep writing
  explanations and why lines that name each trap (they cost nothing, retries read them, and every-choice-gets-a-why requires them);
  judge any fix against unfixed items that were as low, never by before and after alone (`tools/lessons-daily.sql`, section 6); and
  put the effort where a first try is decided: the notes, Exam Hints and cram the class reads first, a wrong key, a stem that hides
  its assumption. Matching, two-statement and true/false items stayed low after explanation fixes even before the control
  (`h-tu-match` 46% -> 34%, `ca-2s-4` 41%, `pa-tf-3` 53-55%): shorten a matching item or split it into MCQs, and for a statement item
  make the false detail plainer (one taught number or name) or add a plain MCQ on the same fact. **A false half that swaps one word
  inside a true-sounding sentence is read as true by nearly everyone**: Heme & Endo Exam 3's `hi-2s-immunity` (the cellular arm
  "works through antibodies that mark invaders") was 1 of 29 on first tries, 27 picking "Both statements are true", and 28 of 29 right
  on the second try; the plain MCQ on the same fact, `hi-humoral`, 10 of 12. That tests reading, not the fact: make the swapped word
  the subject of the statement, and keep the plain MCQ beside it.

- **A report that says the key contradicts the case moves accuracy more than an added sentence.** 10-13 evening: the two
  keys rewritten from reports went 47% -> 14/14 (`ce-isolation`) and 48% -> 70% (`ve-pbox-3`); of five explanations that
  only added a line about the favorite wrong answer, two rose 20 points and three stayed flat while the bank rose 5. And the
  matching item `ce-cure-match` (52%) did better as two MCQs (72-75%), as the 10-01 MSK data predicted.
- **The heaviest users are the ones who say "Exam asked different things"; read their "missed" first.** MSK 3: the one
  such check-in was the heaviest user. MSK 4: all three (215-450 min, 504-653 answers, 77-87%). PCD 3: the person with the
  most answers (933 at 91%). What they ask for is consistent: **application questions** (PCD: "what cement for what type of
  crown"; Occlusion suggestion #7; perio "more diagnostic questions"; MSK 3 and GI 2 Patient Box items that test how
  things work) and the lecture's emphasis over its details (MSK 4: "more specific definitions, pathways", "the hub asked
  more low-yield questions"). Write fewer product-trivia items and more decision items (this patient, this restoration,
  which material or drug and why).
- **A miss re-asked soon is almost always right; a day later, a fifth to a third are missed again.** Every answer after a miss,
  by the gap (10-27): within 30 minutes 88-96% right (Heme/Endo 96% of 305, Occlusion 91% of 568, PCD 3 94%, MSK 4 88%), 30
  minutes to 12 hours 79-85%, **12 hours or more 69-80%** (Occlusion 80% of 963, PCD 3 80% of 459, MSK 4 69% of 373; Heme & Endo
  Exam 2 60% of 177). "Try it again"
  (95% right) and Weak Spots in the same sitting show the explanation was read, not that it stuck. The next-day re-ask is what
  catches the rest: in exam week, put yesterday's misses first in the Daily Drill and on Home, and say so ("you missed these
  yesterday"), rather than adding more same-session retries.
- **Track the last step of a flow, and send it before the page moves on.** The "Is this your other device?" prompt (10-21) logged
  its shown / yes / code clicks but its `linked` event fired just before a reload, so it never arrived, and Stats → Link my devices
  logged nothing: a week later we could not tell whether any link came from it (none did, by `visitor_links`). Any feature that
  ends in a reload or a page change calls `shClicks.flush()` after its last `shTrack`, and every path to the same outcome tracks it.
  A prompt that needs two devices and a code completes rarely (0 of 2 "Yes" in a week); if it matters, make the second device's
  step shorter rather than asking more often.
- **Exclude automated visitors before counting people.** Browser sessions that test or screenshot the live site make a new
  visitor id per page and log one 25 s ping each (24 in ten minutes on MSK 4, 10-14). They inflate people and bounce rates;
  the widget ignores automated browsers from 2026-10-15; drop bursts of one-ping visitors in data before that.
- **Check-ins and surveys speak for the heavy users.** Every check-in group so far studied several times its hub's median
  (GI 2: respondents' median 177 minutes against 29 for everyone; PCD Implants: 361 against 199, n = 5; Heme & Endo Exam 2: 475 against 169, n = 14), and 169 of 190 people shown a survey said "No thanks"
  (to 11-04). Read "About right" next to the use data, never as the class's verdict; the people who bounced aren't in it.
  **A reward brings many more, from the same people**: after the check-in and survey reward went up (1,000 XP and 1,000 crowns,
  11-17), 30 check-ins came in a day against 8 the day before (the Occlusion final 3 -> 22), and their median was still 775 minutes in
  the hub. Advertise the reward; still read the answers as the heavy users'.
- **People decline a tour offered on arrival, but finish one they choose.** Dashboard tour: 12 of 97 shown the prompt
  started it, 8 finished; hub tours 11 of 118, 9 finished (10-21 to 11-04). Teach a feature where it's used (a one-line
  tip), and keep the full tour in the menu.
- **Cross-hub numbers go through the governance notes.** Sections are named differently per hub (`sh_surface()`), a
  "person" is a browser, `question_stats` counts retries, and coverage starts on different dates:
  [analytics-data-quality](vault/reference/analytics-data-quality.md). The admin page's Insights tab puts every hub side by
  side ([insights-dashboard](vault/reference/insights-dashboard.md), first reading 2026-11-04: cramming rose to 83-90% of
  pre-exam time in the last 3 days for MSK 4, Occlusion and Heme & Endo, from 65-76% before).

## What student reports and surveys have taught (keep adding)

Reports come in through each question's Report button (`question_flags`, with the question id and section), the
suggestion box (`hub_suggestions`) and dashboard surveys (`survey_responses`). Read all of them in every retro;
each one is usually a pattern, not a one-off, so fix the pattern across the bank and write it down here.

- **A bank built by many drafting sessions needs its keys read before it ships.** Review of Systems was drafted by 13 sessions and
  merged by a script that checked answer ranges, a why for every choice, the fixed statement choices and ids; all of it passed, and
  51 of Head & Neck's 68 single-answer items (and `f1-biomol-03`) were still keyed one choice past the answer their own explanation
  and why lines name, from the build (11-19) to the 11-24 audit. Its fixed-order formats (true/false, two-statement, numbered) were
  all right: a label like "Both statements are true" carries its meaning, an index into shuffled choices doesn't. The class caught it
  (first tries picked the true answer 39 of 63 times and were marked wrong, retries then took the hub's wrong key 25 of 35 times, 10
  reports in a day), but only after a week of learning wrong anatomy. Reading every key against its explanation and why lines, one
  agent per course of about 200 questions, took 2 to 4 minutes a course and found every reported item. Do that before a new bank or
  a batch of drafted questions ships, and when the first reports of one bank say "keyed wrong", check the whole course, not the one
  item: a fault that comes from how a draft was merged repeats.
- **Every question type needs obvious right/wrong feedback.** Two of the first four real reports were about this:
  self-graded recall cards looked unchanged after tapping "I got it" (perio, fixed 2026-09-28), and ordering
  questions didn't say clearly whether the order was right (perio `q4-49`, fixed 2026-09-29 in #19: finished
  sequences turn green/red, show where each misplaced step belongs and a verdict line; the "picked" style had been
  overriding the result colours). Before shipping a new question type, answer one right
  and one wrong on a phone and check the result is unmistakable. The same goes for the state **before** grading: PCD report #14 (select-all `ce-reqs`)
  said it wasn't clear which options were picked (only a thin accent border); select-all options now show a tick box
  that fills when picked (PCD, MSK 4, Occlusion, 2026-10-13).
- **A multi-step item must say which step missed.** Occlusion report #28 (exam morning): the cusp game's Movements round
  scores only when both the movement and the cusp are right, so a right cusp after a wrong movement lit green under "Not
  quite." and the explanation named the cusp the student had picked, which read as being marked wrong. Any item with
  steps (two-part rounds, orderings, case sets) gets a verdict per step, and the final line says what counted.
- **A stem must state the assumption its key depends on.** Occlusion `fp-post` ("which cusp makes the posterior contact on
  the maxillary first molar?") left out "cusp-fossa", which its siblings say; under the cusp-marginal ridge reading the fence
  post suggests, the favorite wrong answer (21 of 50) is defensible, and a student reported it as confusing (#27, exam eve).
  When a question's answer rests on a convention (Class I, cusp-fossa, the patient's right side), put it in the stem.
- **A short stem with a coined term reads as unclear.** PCD `co-afterimage` ("The color opponent afterimage is:") was
  reported as hard to understand (#13); stems now say where the idea comes up ("During shade matching, what is...").
- **Answer choices must not give the answer away.** Perio `q2-02` labelled the wrong choices "(… monofilament)"
  while the stem asked for the braided suture. An audit then found 24 more giveaways (labels that rule a choice out,
  stem words echoed only by the answer, throwaway distractors). Write distractors that are the same category,
  length and form as the answer, and keep qualifiers in the explanation, not the choices. It still happens in new
  hubs: PCD `on-crack-types` asked which crack type is non-treatable with a choice labeled "Cracked tooth (treatable)"
  (report #18, 2026-10-13). Before shipping, grep the choices for parentheses. Numbers do it too: PCD Implants `bm-goodacre` asked which
  complication was most common and printed each one's percentage in its choice (report #37, 2026-11-04: 9 of 9 right before the fix, 9 of 14 after); put the numbers in the why lines. The reverse also happens: **a choice that names the key's own category is a second right answer.**
  Perio `q4-06` keyed the S204SD9 over "Sickle scaler", but the hub's notes call the S204SD9 the posterior sickle (7 of 17 picked
  "Sickle scaler"; fixed 10-27 to "H6/7 sickle scaler"). Check each wrong choice against the notes: is the key a kind of it? **So does a category word repeated in two choices**:
  Occlusion `mo-repos-irrev` (report #39, 2026-11-10) asked how a repositioning splint is classed, with "Reversible" in two choices and
  "Irreversible" in one, so the odd one out was the key. When the answer is one side of a pair (reversible or irreversible, primary or
  secondary), put each side in two choices and make the reason the test.
- **The key's position can give the answer away too, and students notice.** PCD Implants suggestion #14 (2026-11-04, two days out):
  "the statement questions all seem to have the same answer", and the numbered ones keep coming out "1, 2 and 4". True: 36 of 46
  two-statement keys were "1 true, 2 false" and statement 1 was true in all 30 numbered items (17 keyed "1, 2 and 4", the second choice
  in 23); Special Patient Care, on the same engine, had statement 1 true in 24 of 24. Written one at a time, the first statement tends
  to come out true. Heme & Endo Exam 1 and Occlusion spread theirs (two-statement keys 11-18 of 60 and 9-15 of 43 per choice), so it
  can be done. In fixed-order formats, decide where the key goes after writing the statements, and check the spread before shipping:
  CI fails it since 2026-11-04 (each two-statement choice keyed in 10-40% of items, no numbered key position over 45%, no statement
  number true in over 90%). Give the key a size another choice shares ("1, 3 and 4" next to "2, 3 and 4", not next to two pairs and
  "1, 2, 3 and 4"), and key some items "all four" or "two". Also expect the "True" lean: false-keyed true/false items score lower
  (Heme & Endo 80% vs 87%, PCD Implants 88% vs 93%, Heme & Endo Exam 2 77% vs 88%), and so does "Both statements are false" (Heme & Endo 68%, the lowest key). The
  false half is where the practice is; keep it honest (one taught detail changed). **Balancing costs nothing:** after PCD Implants'
  keys were spread on its eve, two-statement accuracy went 83% -> 82% and numbered 87% -> 85% (1,141 and 952 answers), so nobody had
  been leaning on the pattern; balance from the start rather than wait for a student to notice.
- **Students notice one fact asked again and again.** Occlusion report #40 (2026-11-10): "this question has been asked a bunch already",
  about the 10% of people whose MIP coincides with CR closure, which the final's lectures asked four times (`in-90`, `mo-10`, `mo-tf-3`, and
  a statement in `in-2s-4`, plus one in `in-num-3`). Checking the whole final the same way (2026-11-11) found 58 facts asked three to five
  times, mostly a plain question, then its two-statement, true/false and numbered versions; 58 questions came out (Occlusion's hub note).
  Heme & Endo Exam 2's bank went to one question per fact for the same reason (Sam, 2026-11-08: "they need to be higher yield"), keeping
  one question for each point a High Likelihood topic names. Sam's bar (2026-11-10, `mo-10` retired): "it is okay to test the same concept multiple ways. just
  not for every single question and not more than twice." Before shipping a lecture, list the fact each question tests, and keep at
  most two questions per fact, across lectures too.
- **A bank that lists 30 questions at a time gets paged through on the eve.** Heme & Endo Exam 2: 47 of its 61 bank users pressed
  "Show more" 287 times, and a check-in asked to "number the question, have an option to show more than 30 questions at a time"
  (2026-11-13). Show a bigger page (or load more on scroll) and number the cards, so a student knows where they are in a set. (Done: the
  redesign's bank shows 50, 100, 200 or all at a time, every card "Question n of N", from 2026-11-15.)
- **Every explanation should name the class's favourite wrong answer and say why it's wrong.** The most-picked
  wrong choices (`question_choices`) on the hardest items were ones the explanation didn't mention: perio `q2-03`
  (silk), `q4-15` (Class 1), MSK `sl-calcitriol` (cholecalciferol). Fixed 2026-09-29; write explanations this way
  from the start: key fact, then one sentence per tempting distractor. (`q2-03` went from 30% to 61% right after its explanation
  named silk, 09-30, but low items also rise on their own: see the standing lesson on naming the favorite wrong answer.)
- **The key must fit the case and not contradict its own words.** PCD `ve-pbox-3`'s key said "Bleach first" while the
  Patient Box said bleaching had been tried (report #15); `ce-isolation`'s key said "RMGI: resin needs isolation" about a
  resin-modified cement, and accuracy fell from 58% to 1 of 5 once the explanation drew attention to it (report #16).
  Read the key choice on its own against the stem and the box; put the reasoning in the explanation, not the choice.
- **A case question's explanation may only use facts in the case.** Perio `q3-P02` (report #10, midterm morning)
  explained Grade C by "bone loss this young", but the Patient Box gave pockets only. Put every finding the answer
  rests on in the box (radiographs included), then walk the stage, extent and grade from it. **A drawn case needs its findings in
  words too**: the Perio final's last reports (#61, #63, #64) asked for the visit a chart shows, where the loss is, and the film's bone
  level ("it's just a sketch"); since 11-19 every implant case has a "Today's film, in words" row. Write the reading the key rests on
  into the box, beside the picture.
- **Explanations must agree with the key and show the number.** Perio `q3-47`'s explanation didn't match its answer
  and mixed up two slide figures. When a question tests a figure, the explanation states it and names which figure
  it is, and separates it from look-alike numbers.
- **Brand and admin details with no exam signal get reported as "too much detail".** PCD Implants #35/#36 on its first day (CONELOG's
  taper, Straumann RC's grooves). Before shipping a bank, check every brand-specific number or part and every billing or clinic-policy
  item for a hint, focus list or "this will be on the exam"; without one, leave it in the notes, not the bank.
- **Low-value questions get reported.** "Not a super helpful question" (`q4-49`, disclosing-plaque order). Trivial
  procedural orderings aren't worth a slot; test the decision or the reason instead. Questions about what the professor said rather than about the subject
  get reported too: Heme/Endo `h1-mag` ("Dr. Herr said he would NOT expect you to be able to:") drew two reports on its first
  afternoon ("not an exam-style question"). A lecturer's "you won't need this" belongs in the notes or Exam Hints, never in the
  bank; and a stem that quotes the lecture ("the pairing he said ties into the pancreas lecture") can cue a wrong choice
  (`gr-muscle`: 4 of 12 picked the insulin/glucagon distractor). Ask about the content; credit the professor in the explanation. **A self-graded recall card gets reported when the exam is multiple
  choice**: Perio #44 (2026-11-15, `q7-07`, a list of immune changes as its answer): "too many details for a non-MC question". It was
  also the third ask of its fact. Ask a recall point as a scored item in the exam's format; keep a recall card only for a fact no
  scored item asks.
- **Students asked for spaced, missed-question review.** The first survey's only written answer asked for a daily
  drill of missed and high-yield questions, which became the Daily Drill (2026-09-28). The same survey: Question
  bank most helpful (5 of 8 answers by 10-03; Lecture notes 2, Review tables 1), usefulness 4.9/5 average.
- **Students ask for ways to remember, not just to be told.** Suggestion #2 (MSK, exam eve): "when you missed a
  question, the explanation gave you a way to remember it... a mnemonic or cue" (memory cues shipped 10-02 for perio and
  MSK). Suggestion #3: an undo / start-over button for ordering questions (shipped 10-02). Build both in from the start.
- **A diagram with letters or numbers needs a key somewhere you study.** Occlusion suggestion #6 asked for a key to the
  cusp-pathway arrows; the picture questions must hide it, but the copies under the notes and in Review now fold one out
  ("Show the key", 2026-10-20). Draw new lettered figures with a key from the start.
- **Test the formula, not only a piece of it.** Occlusion report #26: a stem that gives Thielmann's formula and asks what
  CC stands for "would be better if it asked us what the formula is". When the lecture teaches a formula or a rule, ask for
  the whole thing too.
- **Survey round 2** (live 10-15, n = 9 answers by 10-19): question formats: "good the way they are" 6, Quizlet flashcards
  or Learn 3, Anki 1, one loves the lecture notes most; a guided tutorial: yes 3, no 2. Asks: a place to ask questions about
  confusing topics, comparative summary charts, highlight colors, drills longer than 10 (the drill's "10 more" exists:
  make it easier to find), Review titles that match the lecture titles, no recall/flashcard items when the exam is all
  MCQ, cloze (fill-in-the-blank), and on games: filter by lecture or missed questions, quiz-based games, or get rid of
  them. Sam opened separate work for highlight colors, the tutorial, Patient Box questions, games and a place to ask
  questions (10-20). Done the same day: the Daily Drill takes 10, 20 or 30 questions; Review groups carry their lecture
  number and title; Occlusion's Review has a Side by side group of comparison charts. Cloze items: not now (Sam).
- **Interruptions get dismissed, not switched off.** Of the people who met a Plaque Boss from 10-20 on, Occlusion 53 of 89 (and 61
  people all time) and Heme/Endo 10 of 30 on its first day closed it with "Hide the boss"; every older hub had 28-41 people do the
  same. Yet none of 67 people with a settings snapshot since 10-22 has turned bosses off in Settings -> Extras. A survey answer:
  "a lot of features which are fun but sometimes distracting. Features like the tactical nuke should be an opt-in thing". When most
  people close something, offer the switch right there, or keep it out of the way in exam week. Sam (2026-10-28): it blocked
  questions, so the boss now docks as a slim strip in the hub's sticky top bar. **It worked**: on the first day docked, 4 of 55
  Heme/Endo people who met one hid it (10 of 30 the day before). Move an interruption out of the way before adding an off switch.
- **What check-ins say the hub missed lines up with the weakest data.** MSK's check-ins asked for "location of bone
  formation and differentiation", the lowest lecture (Bone Development 71%, its orderings 18-48%); perio's asked for
  staging/grading and EXCEPT items, the formats the bank lacked. Read the check-ins next to accuracy by lecture.
- **A professor's exception, asked as a bare true/false, reads as contradicting the course.** Perio report #62 (2026-11-18, the
  final's eve): `q6-T02` asked whether Dr. Geurs sometimes regenerates without initial therapy first (he said so in class), while S4,
  S5 and his own decision tree put initial therapy first; the report said it contradicted other lectures, and 9 of 18 answers were
  "False" (Sam retired it: it tested an aside). Ask about the rule, not a professor's aside from it; if an exception is worth an
  item, put the rule in the stem beside it ("normally X, but he sometimes Y") and say in the explanation that the rule still stands.

## Hub retrospectives

### Heme & Endo Exam 3 (`heme-endo-exam3`), exam 2026-11-20 (8:00-9:30 am, the morning after the Perio final), archived 2026-11-20 (written that morning)

The third Heme & Endo hub and the first built on the engine from the start. It opened 11-15 with Lecture A (carried over from
Exam 2) and L17-L20 from their slides; L19 and L20 went to taught on 11-18, L21 and L22 went in the evening of 11-18, and
Dr. Herr's study guide (11-17) set the High Likelihood topics, then got its own page (11-19), and the **On the study guide** filter
went in on the eve. Data: **88 people, 169 h**, half of Exam 2's 360; 38 came on one day only, 16 on 3+ days, median **68 min** each
(Exam 2's 169), 11 under 5 min. **11,126 answers from 57 people** (median 123, most 1,107; 20 answered on 2+ days), 77% (**first
tries 67% of 6,728**, the lowest of any hub: Perio's final 78%). Recap on the dashboard since 11-20 (featured: `ll-num-bsx`, the B
symptoms). Its narration and Timmy Time came off the site with this audit (283 MB, the site 327 -> 44 MB). Check-ins: **a few by 3 pm on exam
day** (fewer than 5; the button opened at 10 am, the morning after back-to-back exams), every one "About right" and "Better than I
expected"; later ones go into the next audit (**16 by 11-24**: About right 13, Hub was harder 3; Better than expected 13, About what I expected 3; their median 215 minutes).

**The hub got one evening.** The Perio final was the morning before, and 75 of this hub's 88 people had studied for it in its last
three days. Until then the hub was nearly empty: 11-17 97 min (20 people), 11-18 455 (14). Then **11-19, from the Perio final's
afternoon: 7,461 min from 76 people (124 h, 74% of all the hub's time; 8,623 answers, 78% of them)**, the busiest hour 8 to 9 pm
(41 people); 53 people opened the hub for the first time that day and 9 more on exam morning; 13 studied between midnight and
4 am; exam morning 2,111 min from 48 (4 to 8 am). 61 of Exam 2's 81 people came back for this one.

| Section | Minutes | People |
|---|---|---|
| Question bank | 4,667 | 51 |
| Lecture notes (the study guide page among them) | 4,327 | 69 |
| Learn | 292 | a few |
| Timmy Time | 232 | 9 (10 pressed play, about 320 min heard) |
| Home | 152 | 82 |
| Cram sheet | 131 | 18 |
| Exam hints | 92 | 22 |
| Mock exam | 83 | 6 (4 mocks from a few people) |
| Daily drill | 76 | a few |
| Side by side | 20 | 5 |
| Arcade (all) | ~5 | almost no one |

**The eve was the bank's (3,667 min against the notes' 3,126); exam morning was the notes' (974 against 756) and Timmy Time's**
(191 of its 232 minutes, from 8 people, as Perio's final's was). **The fast tools carried it:** High yield 42 people (As taught 19,
Plain English 15); **Dr. Herr's study guide page 38 people** (152 opens; its "jump to" 22); **On the study guide 34 people** (74
times; High likelihood 31); the guide's Practice buttons 7. In the notes' list: A 39 people (Home's "the notes you were on"
first), L17 39, L20 30, L19 24, L18 22, L21 20, L22 14. Listen 9 people (about 110 min; the guide's recording among them). Figures:
8-22 people each, A's and L17's the most seen (the lecture-order lean). Used in the bank: "Try it again" shown to 49 (2,239
retries, 79% right), "Why each choice" 31, "Not answered yet" 24, the lecture picker 22, pins 8 people (156), the highlighter 11
(767 marks), Ask Timmy 6 who asked. Plaque bosses: 64 met one.

| By lecture (exam's count) | All tries | First tries | People | Tries per question |
|---|---|---|---|---|
| L20 Lymphomas and Leukemias (6) | 70% | **55%** | 39 | 20.8 |
| L19 Introduction to Hematology (8) | 75% | 61% | 44 | 28.1 |
| L22 Female Reproductive Pathology (4) | 77% | 64% | 32 | 15.8 |
| L18 Estrogens and Androgens (6) | 77% | 66% | 49 | 37.4 |
| L17 Pregnancy and Lactation (4) | 80% | 72% | 50 | 36.1 |
| L21 Male Reproductive Pathology (4) | 82% | 74% | 35 | 13.8 |
| A Dental Endocrinology Clinical Application (3) | 81% | 76% | 50 | 21.4 |

**The hematology lectures were the hardest, and the last two the least practiced**: L19 and L20 (14 of the exam's 35) had the lowest
first tries, and L21 and L22, in the bank two days out, got 14-16 tries per question against 36-37 for L17 and L18 (bank order
again), though L21 scored best. By format (all tries): select-all 58% (10 items), two-statement 67% (39), which-false 73%, "which is
true" 75%, numbered 76%, plain MCQ 79%, EXCEPT 79%, true/false 83%. By source: the slides 72% (58 items, L21-L22's slide checks),
the recordings 77%, hub-written 78%. **Hardest on first tries** (14+ in the bank): `hi-2s-immunity` **1 of 29** (27 picked "Both
statements are true": statement 2 gave the cellular arm the antibodies), `hi-2s-node` 1 of 14 (9 "Both true": a primary follicle
has no germinal center), `ea-avoid-t` 2 of 24 (a six-choice select-all; liver disease the one missed), `hi-2s-activation` 6 of 26,
`hi-plasma` 3 of 14 (11 put plasma cell maturation in the marrow), `ea-tf-proscar` 5 of 17, `dc-2s-brown` 4 of 18, `ll-num-cll` 6
of 21, `hi-wf-lymph` 8 of 27, `fr-multi-neo` 6 of 20, `ea-2s-ec` 10 of 30, `ll-aggr` 6 of 21. The two near zero were read against
the notes and drawn in a browser (the card, its order and its grading are right): **a word-swap trap**, not a missing fact. The
plain MCQ on the same fact, `hi-humoral`, was 10 of 12 on first tries, and on `hi-2s-immunity`'s second try 28 of 29 picked the key.

Reports: one (#67, `dc-acro`, fixed the same evening) and suggestion #17 (a question bank from the study guide alone, answered the
same evening by the On the study guide filter, then its 115 picks). Searches: 14, among them "study guide" three times and a
platelet disorder the hub never covered (Bernard-Soulier: no lecture taught it). Test runs in the data, both cleaned: the smoke
test's (BUG-192, out since 11-19) and, found by this audit, `tools/ci/quiet.js`'s mock check from older branches (13 made-up
visitors, two `pq-` rows each in question health; `tools/data-fixes/2026-11-20-quiet-test-rows.sql`).

What changes because of it: (1) **back-to-back exams give the second hub one evening**: it must be finished, narrated and cut to
its highest yield before the first exam, because the class arrives the afternoon of the first one and reads only what's fastest;
(2) **a professor's study guide gets its own page and its own bank filter on the first day**: they were the most used new parts of
this hub (38 and 34 people, from about 75 who studied that evening), and the suggestion asked for exactly that; (3) **a two-statement
item whose false half swaps one word is read as true by nearly everyone on a first try** (the cellular arm with the antibodies, a
primary follicle with a germinal center): the standing lesson on statement items, in its plainest form; pair each with a plain
MCQ on the fact (`hi-humoral` 83%) and make the swapped word the point of the statement, not a detail inside a true-sounding one;
(4) **a lecture of many look-alike diseases is the hardest on a first try** (L20's lymphomas and leukemias, 55%): a side-by-side
table per category and a "which category" item for each disease, from the start; (5) **exam morning is the notes', High yield's and
Timmy Time's** (two morning exams in a row now): Home's exam-day view should lead with them; (6) the extras (Learn, the mock, the
drill, the arcade) reached a few people each in a one-evening hub. Cleanup: done the same morning (Sam: "Yes come down. Merge"): its page came down, it archives
at 9 am (`archiveOn`) and left `HUBS` in `sw.js`; moving its entry into `archived` in `hubs.js` is optional.

### Periodontology (`perio`), midterm 2026-10-01, final 2026-11-19 (cumulative, in the morning: studying stopped at 10 am), archived 2026-11-19 (written that afternoon)

The longest-running hub (09-12 to 11-19), the first built, and the second to carry two exams. The midterm half is in the standing
lessons (the formats gap that started the two-statement and EXCEPT rules; its check-ins, **n = 27 people**: About right 11, Hub was
easier 11, Exam asked different things 6, went worse than expected 11). This section is the final (10-02 to 11-19: S1-S9, about 15%
from S1-S4). Moved onto the engine at the redesign's release (11-14), five days before the final. Data, final: **119 people, 541 h**;
34 came on one day only, **64 on 3+ days**, median **195 min** each, 20 under 5 min. **38,596 answers from 84 people** (median 392,
most 1,583; 61 answered on 2+ days), 83% (first tries 78% of 23,120 since 11-04). The whole hub, both exams: 173 people, 759 h,
53,710 answers, the most of any hub. 65 of the midterm's 118 people came back for the final. Recap on the dashboard since 11-19
(featured: `q3-S02`, an S3 two-statement item on the slide's three percentages). Its narration and Timmy Time came off the site with this
audit (289 MB, the site 656 -> 367 MB).

**The biggest eve any hub has had.** Seven quiet weeks after the midterm (10-02 to 11-14: about 2,600 minutes in all, never more than 19
people on a day), then 11-15 673 min (15 people), 11-16 1,076 (29), 11-17 6,113 (64), **11-18 16,969 min from 87
people (283 h, 52% of the final's time; 21,820 answers, 57% of the final's)**, exam morning 5,049 (86, 4 to 10 am, 61 people in the
9 o'clock hour). 15 people studied after midnight. 43 people opened the hub for the first time in the last five days, 16 of them on the
eve and 11 on exam morning. 22 mocks from 17 people, 78% (the final's format: 62 questions in 90 minutes; the midterm's 47 from 26, 86%).
The daily drill 15 people on 24 person-days. Arcade 63 runs in all, from a few people each (Cross 29 from 8); Stage & Grade (11-17) 95
min from 11 people.

| Section (final) | Minutes | People |
|---|---|---|
| Question bank | 17,870 | 82 on the engine (30 on the old page) |
| Lecture notes | 10,030 | 72 on the engine (38 on the old page) |
| Cram sheet | 982 | about 30 |
| Learn | 836 | 13 (15 started a round, 6 finished one) |
| Mock exam | 594 | 21 |
| Home | 545 | 104 |
| Daily drill | 433 | 15 |
| Timmy Time | 388 | 20 pressed play (about 650 min heard) |
| Exam hints | 335 | about 20 |
| Arcade (all) | ~155 | about 15 |
| Weak spots and Yesterday's misses | 121 | about 15 |
| Flashcards | 6 | 8 |

**The notes led until two days out, then the bank** (11-16 583 notes vs 379 bank; 11-17 2,044 vs 3,350; the eve 4,477 vs 10,094).
**Exam morning was the cram sheet's and Timmy Time's**: the cram 430 min that morning (392 on the eve) and Timmy Time 286 of its 388
minutes, from about half its listeners. Reading levels: **High yield 32 people, As taught 23, Plain English 11**: the first hub with High
yield for its whole run, and the level most people picked. Listen 9 people (about 350 min). Figures: the S8 host-response and biofilm
figures were each seen by 31 people, S6's five by 19-22.

| By session (final, answers 11-04 to 11-19) | All tries | First tries | Tries per question |
|---|---|---|---|
| S3 Risk Assessment | 77% | **67%** | 21 |
| S2 Incisions, Flaps & Sutures | 79% | 73% | 25 |
| S1 Diagnosis, Classification & Treatment Planning | 82% | 76% | 27 |
| S6 Periodontal Regeneration (taught 11-18) | 82% | 77% | 70 |
| S9 Plastic Therapy & Esthetics | 82% | 77% | 66 |
| S4 Phase I Therapy & Instrumentation | 81% | 78% | 19 |
| S8 Antibiotics & Host Modulation | 83% | 78% | 72 |
| S5 Furcation & Resective Surgery | 85% | 81% | 66 |
| S7 Implants | 85% | 81% | 65 |

**The midterm's sessions were practiced in proportion to the final (S1-S4 19-27 tries per question, S5-S9 65-72) and scored lowest
on first tries** (67-78% against 77-81%): seven weeks after the midterm, S1-S4 had faded, and S3 (the risk tools and prognosis
systems) was the weakest of all. By format (first tries): which-false 61%, select-all 68%, matching 68%, two-statement 71%, EXCEPT 77%,
numbered 79%, plain MCQ 80%, true/false 83%. **Hardest on first tries** (20+): `q8-F04` 5 of 38 (a five-option select-all on the
aggressive-periodontitis regimen: clindamycin and azithromycin ticked), `q8-M03` 5 of 34 (the dosing chart's under-16 rows), `q6-N01`
8 of 35 and `q6-N03` 10 of 38 (numbered items: "1, 2 and 3" and "1, 2 and 4" picked over "2 and 3 only" and "2 and 4 only", the extra
statement taken as true), `pc-d3` 16 of 48 and `pc-i2` 15 of 45 (drawn cases), `q7-T08` 17 of 50 (mobility from peri-implantitis
called common), `q6-L37` 16 of 47 (concave root taken as high risk; two fused roots is), `q8-T07` 11 of 31, `q9-L04` 12 of 33. Every key
matched the notes (the 11-18 audits and this one). **The A/B versions** (11-18 on, half the class starting each question on its second
wording): first tries 78.7% on A (6,313) and 78.3% on B (6,466), so a second wording is as hard as the first; item gaps of 10-17
people a side are mostly noise, but `q7-L27`'s A (8% of 12) had two choices with the same two numbers swapped and unlabeled, and B,
which labels them "Smokers 11.3%, nonsmokers 4.76%", got 63% of 16.

Used (11-14 on, the engine): "Try it again" shown to 79 people (4,876 retries, 89% right); the lecture picker 64; the High likelihood
chip 50, "Not answered yet" 49, Random 39, "Missed last time" 23; "Why each choice" 56 people (779 taps); pins 20 (692); the
highlighter 17; "Find this in the notes" shown after a miss to 82 and opened by 25. The bank's sets: All 20 people, 50 12, 200 6, 100 3;
Weak spots 14, the mock set 13, the drill set 11, Yesterday's misses 8. **Ask Timmy**: opened by about 35, 18 sent a question (60
messages). Plaque bosses: 89 met one.

Check-ins for the final: **n = 9** by 4:30 pm (the pop-up went out from 1 pm, `promptHour`; later ones go into the next audit).
**About right 7**, Hub was easier and Hub was harder one each; it went better than expected for 4, as expected for 4, worse for
none (one left it blank); ready 3 or 4 out of 5 for all nine. They studied a median 16.5 hours in the hub (the middle half 8 to
19), with a median 1,051 answers (the middle half 76-86% right), and the two who said easier or harder studied about as much as the
rest. One asked for **more application: which
flap for which surgery**, a format for the next perio course (a case that names the procedure and asks the flap, the incision or
the healing to expect). **Later check-ins** (to 7:30 am on 11-20): **n = 29**, About right 23 (their median 486 minutes in the hub),
Hub was easier 3, Hub was harder 2, Exam asked different things 1; better than expected 11, as expected 16, worse none; readiness
3.8 of 5 on average. One more wrote that some questions were "too far in the weeds" for exam purposes, because the hub takes every
detail from the recordings, which the rule of 2026-11-20 now covers ([dont-ask-what-professors-skip](vault/rules/dont-ask-what-professors-skip.md)).
Reports during the final: 16, all
fixed (most within hours), 1 suggestion. **What the late reports had in common**: the drawn cases. #61 (two-visit charts that didn't
say which visit), #63 (the case box didn't say the loss was at the margin, which the explanation leaned on) and #64 (the implant film is
a sketch, so say the bone level in words) all asked for the finding the key rests on to be written in the box.

What changes because of it: (1) **for a cumulative final, the old sessions need their own push**: practice follows the exam's weights,
and after seven weeks the midterm's sessions were the weakest; put S1-S4's High likelihood items in the drill and the cram for the last
three days, and say on Home how much of the exam they are; (2) **a hub carries two exams well, but only exam weeks count**: 65 of 118
came back, and between the exams almost nobody studied (the standing lesson on use stopping the day after holds for a seven-week
gap); (3) **High yield is the reading level people choose** once it exists: build it, and its recording, for every lecture from the start;
(4) **an episode made four days out gets used, mostly on exam morning** (20 people, about 650 minutes, the most of any episode): for a
morning exam, Home's exam-day view should lead with Timmy Time and the cram; (5) **a drawn case must say in words what the key rests
on** (the film's bone level, the visit, where the loss is), since a sketch can't be read the way a radiograph is; (6) **a second
wording doesn't change difficulty**, so A/B versions can stay in every hub where there's time to write them; label every number in a
choice that pairs two of them; (7) numbered items again trap on the extra statement: make the false statement's detail plain (one
number or name), as the standing lesson says. Cleanup: done the same afternoon. Sam had the page taken down ("you can take perio
down now"), so `hubs.js` archives it at 1 pm (`archiveOn`), it left `HUBS` in `sw.js`, and its About entries and tests went with it
([the hub note](vault/hubs/perio.md)); moving its entry into `archived` in `hubs.js` is optional.

### Occlusion (`occlusion`), midterm 2026-10-21, final 2026-11-16 (6:30-7:45 pm), archived 2026-11-16 (written 2026-11-17)

The first hub that served two exams and the first archived on the engine (the redesign's release, 11-14, two days before its final).
The midterm half is in the standing lessons (the formats gap, n = 19 check-ins by now: About right 10, "Exam asked different things"
7, easier 2); this section is the final (10-22 to 11-16, L6-L10). Data, final: **104 people, 439 h**; 26 came on one day only, 56 on
3+ days, median **153 min** each, 18 under 5 min. **29,177 answers from 78 people** (median 336, most 1,570; 51 answered on 2+ days),
85%. The whole hub, both exams: 137 people, 815 h, 49,515 answers. Recap on the dashboard since 11-17 (featured: `cs-pro-incline`, a
midterm item). Its narration and Timmy Time came off the site with this audit (211 MB).

**Exam day was the eve**: the final was at 6:30 pm, so the day before was a normal study day and the exam day took its place. Quiet
until 11-13 (1,130 min, 23 people), then 11-14 3,472 (51), 11-15 7,814 (63), **11-16 11,033 min from 83 people (42% of the final's
time), 10,926 of them before 6:30 pm**; 9 people studied after midnight. 21 people opened the hub for the first time in the last
four days, 6 of them on exam day. 14 mocks from 13 people, 88% (the midterm's 45 from 33, 82%). Arcade 12 runs from a few people.

| Section (final) | Minutes | People |
|---|---|---|
| Question bank | 14,198 | 81 |
| Lecture notes | 8,792 | 75 |
| Cram sheet | 870 | 31 |
| Home | 599 | 99 |
| Exam hints | 336 | 21 |
| Daily drill (old and new) | ~510 | 16 |
| Mock exam | 298 | 15 |
| Learn | 290 | 9 |
| Timmy Time (the final's) | 113 | 7 (8 pressed play, about 260 min heard) |
| Weak spots | 95 | 19 |
| Review tables (all) | ~100 | about 12 |
| Flashcards | 16 | 4 |

| By lecture (final, answers 10-22 to 11-16) | All tries | First tries | People | Tries per question |
|---|---|---|---|---|
| L8 Denture Occlusion | 82% | **77%** | 62 | 58 |
| L6 Occlusal Instrumentation | 86% | 80% | 70 | 62 |
| L10 Occlusal Trauma (Dr. Abou-Arraj) | 84% | 80% | 57 | 66 |
| L7 Malocclusion and Dysfunction | 88% | 85% | 68 | 51 |
| L9 Noncarious Cervical Lesions (Dr. Lawson) | 87% | 85% | 61 | 49 |

**The lecture lag closed on exam day, as it does**: on 11-14 9-16 people answered each final lecture; on 11-16, 47-51 each, and L10,
taught last (11-12), took more answers that day than L6. By format (the whole bank, both exams): true/false 91%, "which is true" 87%,
plain MCQ 84%, numbered 84%, EXCEPT 81%, two-statement 79%, "which is false" 75%, select-all 74%, matching 75%, ordering 60%. By
source: handout and hub-written 85% each, the help sheet 72% (the midterm's fence post and cusp pathways). **Hardest on first tries,
final**: `in-seq-prog` 3 of 34 (a 5-step ordering), `dn-quint` 7 of 43 ("steepen the compensating curve" 21 of 90 picks: the
balanced-denture determinants run backward from intuition), `ot-sel-clin` 8 of 45 (select-all; "A widened PDL space", radiographic,
ticked 37 times), `cs-dn-bal-marks` 11 of 43 ("The balance is perfect" 29 of 86), `in-locator` 13 of 38 and `in-cbd` 18 of 37 and
`in-level` 15 of 35 (the facebow and pantograph parts mixed up with one another: tracing tables, hinge axis, the Slidematic's level),
`nc-2s-5` 15 of 47, `mo-seq-grind` 14 of 27 (ordering), `mo-57` 17 of 32, `mo-bell` 17 of 36, `mo-splint-cause` 18 of 41. Every key
matched the notes at the 11-15 audit. The bank audit two days out (156 edited, 4 new, 3 retired) left first tries where they were.

Used: "Try it again" 64 people (2,899 right on the retry); the lecture picker 53; the High likelihood chip 40, "Not answered yet" 37,
Random 30; **the bank's sets** (#373, 11-15): All 16 people, 50 9, 100 7, 200 4; Weak spots 19 and the drill set 12; Learn 14
started, 9 finished a round; Flashcards 4; **Ask Timmy** opened by 31, 17 sent a question; reading levels As taught 18, High yield 17,
Plain English 9; Listen 8 people (about 420 min); "Find this in the notes" shown to 70 after a miss, opened by about 20. Figures: the
mounting-error, Sci-Rec and Bennett figures were each seen by 41-45 people. Plaque bosses: 83 met one.

Check-ins for the final, **n = 22** by 11-18 (3 the morning after; the 1,000 XP and crowns reward brought the rest within a day):
**Hub was easier 10**, About right 8, Exam asked different things 4; went worse than expected 7, about as expected 12, better 2;
readiness 3.5 of 5 on average (Heme & Endo Exam 2's: 3.9). Still heavy users (median 775 minutes; the "easier" group 618, "different"
1,005). One wrote "nothing! the questions were very comparable." **The most "Hub was easier" answers of any hub so far**: Dr. Givan's
final asked harder than the bank, even after the midterm's formats gap was closed (no one said the formats were missing). Later
check-ins go into the next audit. Reports during the final: 12 (#39-#52), no suggestions; the last four, on exam day
(#49-#52), were left open by Sam's call once the exam was over. **Later check-ins** (to 11-19 evening): **n = 36**, About right 13,
**Exam asked different things 12**, Hub was easier 11; the later ones leaned to "different things" (4 of the 5 on 11-18). Written:
that the exam's questions couldn't be predicted and were poorly worded, and "more detailed questions". So the final's verdict is a
harder, differently worded exam than the bank, not a missing format: for Dr. Givan's next course, more two-step application items.

What changes because of it: (1) **for an evening exam, exam day is the eve**: Home's exam-day view, the drill and the cram sheet are
what the class uses that day, all day; put the night-before tools there, not only the night before; (2) **instrument parts and
look-alike devices need a side-by-side table**, not paragraphs: three of the hardest L6 items were one facebow or pantograph part
taken for another (the standing lesson on look-alikes, again); (3) **"turn the dial" rules (Hanau's quint) need a worked table**: one
factor changed, which way each other one moves; `dn-quint` was the hardest MCQ of the final; (4) the hub carried two exams well: 68 of
the midterm's 108 people came back for the final (5+ minutes in each), and the bank's new formats held at 79-84%; (5) Timmy Time made the day before reached 8
people, as the standing lesson says; (6) the bank's sets: given the choice, most people take "All". Cleanup still to do by hand: the
hub page stays up for now; moving its entry into `archived` in `hubs.js` is optional.

### Heme & Endo Exam 2 (`heme-endo-exam2`), exam 2026-11-13 (10 am), archived 2026-11-13 (written that evening)

Data: **86 people, 360 h**, the most of any hub (Heme & Endo Exam 1 341 h, PCD Implants 339 h); 26 came on one day only, **45 on 3+
days**, median **169 min** each, 13 under 5 min. **18,800 answers from 64 people** (median 183, most 1,064; 43 answered on 2+ days), 78%.
The hub opened 11-05 with every lecture (the first three from their recordings, the rest from slides until each was taught; L16 on 11-11); it was small until four days out: 11-09 1,786 min (24
people), 11-10 3,634 (46), 11-11 5,299 (58), **night before 7,929 min from 62 (37% of all time)**, 12 of them first-time visitors; exam
morning 2,609 (49; the exam at 10 am); 15 studied after midnight. 13 mocks, 64% as stored (50 questions each; a few look ended early).
Daily Drill 8 people on 18 person-days. Arcade about 26 runs (Sort 21, from a few people). Timmy Time (from 11-11) 6 people pressed play, 135
min heard, the fewest of any episode. Recap on the dashboard since the evening of 11-13 (featured: `mh-num-glands`).

| Section | Minutes | People |
|---|---|---|
| Question bank | 10,442 | 61 |
| Lecture notes | 8,658 | 62 |
| Cram sheet | 762 | 18 |
| Review (all) | ~470 | 25 (diabetes drugs; the others a few to 11) |
| Home | 371 | 85 |
| Mock exam | 360 | 15 |
| Daily Drill | 184 | 8 |
| Exam hints | 153 | 15 |
| Weak Spots | 82 | 6 |
| Arcade (all) | ~75 | about 5 |
| Timmy Time | 67 | a few (6 pressed play) |

**The notes led until the eve again**: 1,936 vs 1,512 min three days out, about even two days out (2,600 vs 2,498), then the bank on the
eve (4,448 vs 2,496); exam morning about even (874 notes, 802 bank). Plain English 14 people, As taught 10; Listen 9 people (about 120
min); mind map a few. **The cram sheet grew at the end** (418 min from 9 on the eve, 303 from 13 on exam morning) and drew the only
suggestion: "I LOVE the cram sheet" (#15). Figures: the drug-site and insulin figures were each seen by 46 people.

| By lecture | Accuracy | Tries per question |
|---|---|---|
| Female Reproductive Histology (L14) | 75% | 29.4 |
| Endocrine Pathology, Part 1 (L12a) | 76% | 53.5 |
| Male Reproductive Histology (L13) | 76% | 36.2 |
| Endocrine Pathology, Part 2 (L12b) | 78% | 39.7 |
| Female Reproductive Physiology (L16) | 78% | 33.5 |
| Pharmacology of Diabetes Mellitus (L11) | 79% | 55.1 |
| Male Reproductive Physiology (L15) | 81% | 37.4 |
| Exam 1 Refresher (review only) | 82% | 3.2 |

By format: true/false 83% (77; **False-keyed 77%, True-keyed 88%**), plain MCQ 79% (305), EXCEPT 77% (25), ordering 74% (4), numbered 73%
(43), two-statement 72% (52), "which is true" 70% (17), "which is false" 69% (14), select-all 68% (8), matching 62% (2). By source: slides
73%, recordings 78%, hub-written 80%, the in-class review's twins 81%, **the in-class review's own questions 86%** (41.5 tries per question;
55 people answered one, 49 on the eve). Hardest (20+ tries): `mh-num-glands` 46% ("1, 3 and 4" x14: the bulbourethral glands empty into
the penile urethra), `mh-wf-vas` 50%, `fh-mm-lh` 50% (select-all), `fh-2s-5` 50% (LH, not FSH, makes the corpus luteum), `fh-2s-4` 51%,
`fh-seq-menses` 52%, `p2-tf-2` 52% ("True" x21: most hyperparathyroidism is found on routine labs), `fh-ampulla` 52%, `p1-wf-hypopit` 54%,
`fp-2s-hormones` 54%, `p1-mtc-2` 55% (BRAF x11), `fh-zp-contact` 55% (desmosomes x13), `fh-capacitation` 56%. **The lecture lag closed on
the eve**: 32-37 people answered each Exam 2 lecture that day (L14 and L16 went from 5-6 tries per question to about 30). **The
review-only Exam 1 Refresher didn't**: 18 of 64 answerers ever tried one (313 answers, 3.2 tries per question), for 5 of the exam's 50
questions.

Used: "Try it again" shown to 60 people (3,805 retries, 76% right); "Why each choice" opened by 45 (964 taps); the High likelihood chip
34 people (Exam 1 High likelihood 11), "Not answered yet" 31, Random 21, "Missed last time" 12; pins 14 people (386); the highlighter 14;
"Find this in the notes" shown after a miss to 63 and opened by 18. **"Show more" in the bank** (it lists 30 questions at a time): 47
people pressed it 287 times. Little used: the hub tour (10 of 11 offered declined), the search panel (none), mind maps. Plaque bosses: 70
met one, 14 hid it.

Check-ins, **n = 14 people** by 11-15 (9 at the retrospective; later ones go into the next audit), all heavy users: their median 475
min (the hub's 169), 177-1,268 min each. **About right 10, Hub was harder 3, Hub was easier 1, none "Exam asked different things"**;
went better than expected 9, as expected 4, worse 1; readiness 3-5 (median 4). The five who checked in later wrote nothing. Written: number the questions, and let the bank show more than
30 at a time (a feature, not a topic). Reports: one (#38, `mh-fig-seq`: show the slide's picture without labels; fixed within a day) and
suggestion #15 (the cram sheet). **Later check-ins** (to 11-18 evening, after the 1,000 XP and crowns reward): **n = 24 people**, About right
19, Hub was harder 4, Hub was easier 1, still none "Exam asked different things"; the three on 11-18 all went better than expected.

What changes because of it: (1) **the recipe held again**: one question per fact (Sam, 11-08), High Likelihood from the professors'
Exam 2 breakdown, and the in-class review set with a twin for each gave the most hours and none "Exam asked different things"; nobody
said "too many questions" this time (Exam 1's check-ins did); (2) **the in-class review's questions were the most practiced and best
answered** (55 people, 86%): when a course has a review session, put its questions first in their lectures, as here; (3) **a review-only
set reaches a fifth of the class**: if old material is on the exam, put it in the default bank or the drill, or accept the reach (it is
Sam's call per course; Heme & Endo Exam 3's carry-over is [its own task](vault/tasks/2026-11-10-heme-endo-exam3-carry-lecture-a.md));
(4) **the cram sheet is the exam-morning tool**: keep one in every hub and point Home at it on exam day; (5) **the bank's page is too
short for the eve**: 47 of 61 bank users pressed "Show more" (the redesign's bank shows 20): a proposal for Sam in this audit's PR; (6)
Timmy Time made two days out reached 6 people: make an episode only when there is time to spare, and early; (7) the "True" lean held
(77% vs 88%), so keep the false half honest and plain. Its audio came off the site with this audit; the hub page stays. Cleanup still to
do by hand: remove `hubs/heme-endo-exam2/` once nothing needs it (its card leaves the dashboard 11-23) and optionally move its entry into
`ARCHIVED_HUBS`.

### Special Patient Care (`special-patient-care`), Canvas window 2026-11-06 to 11-14, archived 2026-11-06, removed 2026-11-14

No retrospective and no recap, by Sam's call (2026-11-14: "Dont worry about special patient care at all for a recap. Go ahead an
remove everything for it"); its page, audio and images came off the site with it. In all: 17 people, 9 h, 261 answers, almost all
from a handful of people, and no check-ins by design: the least use of any hub. It closed when the exam window opened (Sam's call of
11-05, with its card), so it was never up during the week the class took the exam.

### PCD Implants Exam 1 (`pcd-implants-exam1`), exam 2026-11-06 (Canvas, 7 am-8 pm), archived 2026-11-06 (written 2026-11-10)

Data: 88 people, 339 h, level with Heme & Endo Exam 1 for the most of any hub; 25 came on one day only, **54 on 3+ days** and the
median was **199 min** each (both the most yet), 13 under 5 min. **25,392 answers from 66 people** (median 334, most 1,225; 45 answered
on 2+ days), 87%. The hub went up 11-03, three days out, with all nine lectures: 11-03 3,625 min (50 people), 11-04 4,946 (59), **night
before 8,183 min from 73 (40% of all time)**, 20 of them first-time visitors; exam day 3,315 (52; the Canvas window ran all day); 8
studied after midnight. 29 mocks from 15 people: 75% as stored, but four exam-day mocks were ended after a few questions (1-5 of 40)
and count as full ones; without them about 86%. Daily Drill 12 people on 18 person-days. Arcade about 33 runs (Sort 14 from 5
people). Timmy Time 11 people pressed play, 258 min heard. Recap on the dashboard since 11-10.

| Section | Minutes | People |
|---|---|---|
| Question bank | 9,539 | 65 |
| Lecture notes | 8,172 | 64 |
| Cram sheet | 588 | 23 |
| Home | 488 | 87 |
| Mock exam | 452 | 17 |
| Review (all) | ~440 | 17 (Evolution; the others 4-8) |
| Exam hints | 205 | 27 |
| Daily Drill | 135 | 12 |
| Timmy Time | 125 | 9 |
| Weak Spots | 122 | 10 |
| Arcade (all) | ~75 | 9 |

**The notes did more of the work than in any hub so far** (40% of all time; PCD 3 36%, MSK 4 34%, Heme & Endo 1 32%), and led the bank
three and two days out (1,881 vs 1,421 min, then 2,561 vs 2,086) before the bank took over on the eve (4,513 vs 2,511). Plain English
12 people, As taught 8; Listen 6; mind map a few. 62 people saw an interactive figure and 26 moved one.

| By lecture | Accuracy | Tries per question |
|---|---|---|
| CBCT 101: Basic Science | 84% | 42.4 |
| Introduction to Implant Surgery | 85% | 42.4 |
| Evolution of Dental Implants | 85% | 48.5 |
| Implant Terminology and Basics | 86% | 50.5 |
| Imaging for Implant Diagnosis | 87% | 47.7 |
| Introduction to Implants and the Implant-Tissue Interface | 89% | 51.8 |
| Biomechanics in Implant Dentistry | 89% | 45.0 |
| Prefabricated Abutments | 91% | 41.7 |
| Guided Surgery vs Freehand | 93% | 37.2 |

By format: select-all 72% (11), two-statement 82% (46), matching 83% (11), numbered 85% (30), plain MCQ 88% (370), true/false 91% (77).
By source: slides 87%, recordings 88%. Hardest (12+ tries): `ev-2s-4` 47% (who designed the TMI and the blade; "Both statements are
true" x5; the recap's featured question), `su-match` 51% (vertical space per prosthesis), `tm-mm-3` 55% (the 7 mm; "4 mm for the
screw head" ticked 17 times), `tm-2s-6` 56%, `tm-mm-1` 57% ("More passive fit for an FPD" ticked 14), `su-mm-1` 59% ("Implant
malpositioning", a surgical factor, ticked 14), `su-def-bran` 60% (Albrektsson's wording x30), `su-bar` 60%, `ev-misch` 60% (Ford
Turner x21), `bm-moment` 61% (force / area x25), `im-process` 61% ("Plan in the software" x19), `im-motion` 62% (beam hardening x18).
**The lecture lag closed by itself**: before the eve the last four lectures had 12-17 answerers each (27-38 on the first three); on
the eve and exam day every lecture had 43-47, and the last four took the most answers. Tries per question ended at 37-52 for every
lecture. The four drawn Patient Box cases (`su-pb-1` to `su-pb-4`, from 11-05): 40 people answered at least one, 84-100% right.

Used: "Try it again" shown to 63 people (2,965 retries, 78% right); the High likelihood chip 39 people, "Not answered yet" 37, Random
27, "Missed last time" 17, a lecture's "Only" button 16; "Why each choice" opened by 18 (401 taps); pins 12 people (142); the
highlighter 13 (1,590 marks). "Find this in the notes" appeared after a miss for 58 people and was opened by 17; 48 met a miss it
couldn't place. Little used: the quick start's least-practiced "Practice questions" (7 people, the eve only), Home's "Practiced least"
row (none), the hub tour (all 12 shown it on arrival declined; a few started it from the menu), the search panel (none). Plaque bosses: 71 met one, 16 hid it.

Check-ins, **n = 6 people** by 11-11 (5 at the retrospective; later ones go into the next audit), all heavy users: at the retrospective their median was 361 min and 737 answers (the hub's
199 and 334), 77-95% right. Hub vs exam: most said About right, none "Exam asked different things"; most went better than expected,
none worse; readiness 3.7 of 5. The new questions: the drawn Patient Box cases rated 4 of 5 against the old text boxes by everyone who
rated them (one hadn't reached them); the diagrams and implant-type drawings about 4.5 of 5 (the Occlusion midterm's diagrams: 4.6, n = 17);
**every one of them ticked High likelihood questions** as a help, most "Why each choice", a few each the class's picks per choice, pins, the
least-practiced button and Timmy Time; most said "keep improving it right up to the exam" (one said it was too much). Written: more "which statement is
correct" items where each choice is a different statement (a format, not a topic). Reports: four and suggestion #14, all fixed and
answered within a day (brand detail #35/#36, a choice set #34, the percentages in `bm-goodacre` #37, the statement-key pattern #14).

What changes because of it: (1) **the recipe held**: three days of hub with every lecture in from the first day, the recordings, the
course's hint list and a bank checked against every hint gave the deepest use per person yet; (2) **when a hub opens days ahead, the
notes come first**: polish them before the bank's extras, since they carried the first two days; (3) the lag behind bank order closed
on its own on the eve, so the Home pointers aren't worth more work (keep the quick-start one, it costs nothing); (4) High Likelihood is
what the check-ins name first again: keep it in every hub; (5) explanation fixes that name the favorite wrong answer kept working for
MCQs (`im-template-vdo` 59% to 83%) and stayed weaker for select-alls; (6) rebalancing the statement keys cost nothing (two-statement 83%
to 82%), so balance them from the start; (7) add a few "which of these statements is true" MCQs (four full statements as the choices)
beside the two-statement and numbered formats; (8) read mock averages without the mocks ended after a few questions (the data-quality
note). Cleanup still to do by hand: remove `hubs/pcd-implants-exam1/` (its card leaves the dashboard 11-16) and optionally move its
entry into `ARCHIVED_HUBS`.

### Heme & Endo Exam 1 (`heme-endo-exam1`), exam 2026-10-30, reopened for a late exam, archives 2026-11-03 (written 2026-11-03)

Data: 92 people, 341 h, the most of any hub so far; 22 came on one day only, **50 on 3+ days**, median **183 min** each (also the most),
12 under 5 min. **25,399 answers from 67 people** (median 302, most 1,541; 52 answered on 2+ days), 82%. The hub went up 10-27, three days
out: 10-27 2,204 min (39 people), 10-28 5,874 (61), **night before 9,875 min from 73 (48% of all time)**, only 12 of them first-time
visitors; exam morning 2,350 (58), 18 studied after midnight. 20 mocks from 14 people, 75%. Daily Drill 10 people. Arcade: Feedback Sort
34 runs from 6 people, the other games 1 each. Timmy Time 9 people, 212 min heard, 2 heard 95%. Recap on the dashboard since 10-30
(keep it: Sam reopened the hub for a late exam, 11-03).

| Section | Minutes | People |
|---|---|---|
| Question bank | 11,483 | 67 |
| Lecture notes | 6,655 | 66 |
| Mock exam | 514 | 16 |
| Home | 325 | 92 |
| Exam hints | 232 | 28 |
| Daily Drill | 200 | 10 |
| Cram sheet | 199 | 32 |
| Review (all) | ~620 | 23 (histology 1) |
| Weak Spots | 122 | 17 |
| Timmy Time | 117 | 8 |
| Arcade (all) | ~55 | 8 |

| By lecture | Accuracy | Tries per question |
|---|---|---|
| Endocrine Pancreas | 79% | 42.8 |
| Corticosteroids | 80% | 30.8 |
| Adrenal Gland | 80% | 39.9 |
| Growth | 81% | 42.1 |
| Thyroid Physiology | 81% | 42.9 |
| Calcium and Phosphate | 82% | 32.5 |
| Thyroid Drugs | 83% | 31.7 |
| Hypothalamus and Pituitary | 83% | 49.3 |
| Histology 2 (adrenal, pancreas) | 84% | 28.8 |
| Histology 1 (pituitary, thyroid, parathyroid) | 85% | 63.6 |

By format: plain MCQ 83% (427), EXCEPT 82% (15), true/false 84% (101), **numbered 75% (25), two-statement 73% (60)**, ordering 67% (3).
By source: recordings 80%, slides 82%, in-class review 83% (51 tries each, the most), focus lists 85%, the professors' class cases 90%.
Hardest: `ca-2s-4` 41% (calcitonin; "1 true, 2 false" x13), `cs-2s-3` 44%, `gr-r-plate` 47% (growth-plate ordering), `pa-2s-2` 48%,
`td-inducers` 48% (methimazole/PTU x11), `h2-r-2s-1` 50%, `ca-r-vdr` 50% (Gq receptor x14), `pa-insulin-fat` 51% (lipoprotein lipase x26),
`cs-mitotane` 51%, `h2-islet-origin` 52% (neural crest x14), and the true/false `h1-tf-5` 54% (follicle size; "True" x32) and `pa-tf-3`
54% (islet blood flow; "True" x27). Late lectures were not the weakest this time: the pancreas lecture was (79%), the calcium and drug
lectures got the fewest tries (31-33 per question vs 43-64).

Check-ins, **n = 13 people** (14 rows by 11-04; the final count, after the check-in closed 11-06, is 14 people, the one more About
right): **About right 10**, Hub was harder 2 (93-94% accurate,
83-295 min), one left it blank, none "Exam asked different things"; went better than expected 8, as expected 4, worse 1; readiness 3-5 (median
4). The three after the late exam (11-03): About right twice (520-783 min, 75-79%), Hub was harder once. Against use: the one
"worse than expected" answered the most of anyone (1,541 at 84%, 732 min) and still called the hub about right; the two lowest-accuracy
people (67% and 77%) both went better or as expected. Written: "can we single out the high yield questions (not just first in the line
up) and fully shuffle them? it was a nice review before taking the exam" (the bank then had a sort menu with "High likelihood only";
the newer engine's status filter + Random does exactly this), and "this hub was very accurate for the exam, it just had a lot of
questions". Reports: 4 (`h1-mag` twice, `th-r-nis`, `h2-r-origin`), all fixed and answered within a day; one suggestion (counts per
lecture and predicted topics), which became High Likelihood Exam Questions (now a standing rule).

What changes because of it: (1) **the recipe worked**: recordings + the professors' focus lists + the in-class review set + the
official counts per lecture as the mock blueprint and `LIKELY_TOPICS` gave the best check-ins yet; build every hub this way, and ask Sam
early for counts and focus lists; (2) High Likelihood got used (23 people ordered by it, 21 filtered to it, 40% of all tries): make
"High likelihood only" + Random one obvious path in the bank; (3) statement formats are the hardest and the least helped by explanation
fixes (standing lesson above); (4) "a lot of questions": 631 for 55 exam questions was more than people finished (median 302 answers);
High Likelihood is the answer to that, not a smaller bank (but Sam on Exam 2, 2026-11-08: "803 is way too many questions.
They need to be higher yield": that bank was cut to 339, about 6 per expected exam question, and High Likelihood made
selective; see `vault/decisions.md`); (5) three days of hub was enough for 50 people to use it on 3+ days, but the
calcium and drug lectures, added or finished last, got the fewest tries again. Cleanup still to do by hand, after the late exam: remove
`hubs/heme-endo-exam1/` and optionally move its entry into `ARCHIVED_HUBS`.

### MSK Exam 4 (`msk-exam4`), exam 2026-10-16, archived 2026-10-16 (written 2026-10-20)

Data (28 automated one-ping visitors from 10-14 dropped): 71 people, 131 h; 26 came on one day only, 25 on 3+ days, median 59
min each, 13 under 5 min. **8,969 answers from 43 people** (median 180, most 653; 26 answered on 2+ days), 78% overall.
Night before (10-15): 3,795 min from 58 people (**48% of all time**), **31 of them first-time visitors**; exam morning
1,926 min from 47; 13 studied after midnight. 17 mocks from 12 people, 80% average. Daily Drill 11 people. Arcade 14 runs
from ~5 people. Recap on the dashboard since 10-16.

| Section | Minutes | People |
|---|---|---|
| Question bank | 3,583 | 42 |
| Lecture notes | 2,689 | 71 |
| Timmy Time podcast | 287 | 20 |
| Cram sheet | 220 | 25 |
| Daily Drill | 191 | 11 |
| Review: drugs | 186 | 13 |
| Weak Spots | 183 | 11 |
| Mock exam | 174 | 13 |
| Exam hints | 103 | 14 |
| Review: rest | ~170 | 9 (skin) |

Notes: lecture picks Derm Pharm 119, Dermpath 100, Muscle 97, NMJ 83, Skin 82 opens; Plain English 17 vs As taught 16;
Listen 6 people, mind map 2, highlighter 6. Interactive diagrams 18 people (above).

| By lecture | Accuracy | Tries per question |
|---|---|---|
| Dermatological Pharmacology | 69% | 37.5 |
| Pathology of the Skin | 77% | 37.8 |
| Pharmacology of the NMJ | 78% | 26.1 |
| Skeletal Muscle | 81% | 40.5 |
| Histology of Skin | 83% | 44.7 |

By type: MCQ 80%, matching 69% (8), sequence 57% (7, all 3-5 steps), select-all 43% (2, both Patient Box drug picks). By
source: lecture self-checks 72%, hub-written 76%, recording 78%, classmate's deck 84%, in-class review 90%. Hardest:
`dp-ecto-malathion` 34% (ivermectin lotion picked 12 times), `pa-blister-match` 40%, `dp-clinda` 40% (cell wall 13),
`dp-toenail` 41% and `dp-impetigo` 44% (select-alls), `mu-hierarchy` 43% (ordering), `dp-contact-urticaria` 44% (allergic
contact dermatitis 21), `sk-lamellar` 45% (Langerhans cells 21).

Check-ins, **n = 8** (later ones go into the next audit): About right 5, Exam asked different things 3; went as expected 5,
better 1, worse 2; readiness 3-5 (average 3.9). Against each person's use: the three "different things" were heavy users
(215-450 min, 504-653 answers, 77-87%); the two "worse than expected" called the hub about right and had the lowest hub
accuracy of the eight (68-70%; 83 and 526 min). Missed (as topics): "more specific definitions, pathways"; "the hub tended
to ask more low-yield questions based on the lectures; it was good to read over".

What changes because of it: (1) in drug lectures, fewer product details (how each lice product is applied, which ointment
goes in the nose) and more mechanism, pathway and definition items, weighted by what the lecture stresses (standing lesson
above); (2) the last lecture again got the least practice: put late lectures first in the Daily Drill and mock; (3) the
podcast reached a third of the eve crowd: repeat it only when there's a session to spare for it; (4) select-all Patient Box
drug picks stay the weakest format: keep them few, 5 options, 3 correct. Cleanup still to do by hand: remove
`hubs/msk-exam4/` (its card leaves the dashboard 10-26) and optionally move its entry into `ARCHIVED_HUBS`.

### PCD Fixed Pros Exam 3 (`pcd-exam3`), exam 2026-10-15 (Canvas, 8 am-8 pm), archived 2026-10-15 (written 2026-10-20)

Data (12 automated one-ping visitors from 10-13 dropped): 79 people, 212 h; 26 came on one day only, **37 on 3+ days**,
median 95 min each, 10 under 5 min. **14,092 answers from 72 people** (median 117, most 933; 36 answered on 2+ days), 84%.
Studying started earlier than in other hubs: 25 people and 32 h three days out (10-12), 40 people two days out. Night
before (10-14): 3,648 min from 55 (29% of all time), 15 of them first-time visitors; exam day 3,097 min from 62 (24%: the
Canvas exam was open all day); 9 studied after midnight. 16 mocks from 14 people, 79%. **Daily Drill 24 people on 42
person-days**, the most of any hub. Arcade ~24 runs from ~7 people. Recap on the dashboard since the evening of 10-15.

| Section | Minutes | People |
|---|---|---|
| Question bank | 6,377 | 59 |
| Lecture notes | 4,598 | 77 |
| Daily Drill | 411 | 24 |
| Cram sheet | 398 | 28 |
| Weak Spots | 329 | 16 |
| Mock exam | 297 | 16 |
| Review (all) | ~160 | 16 (cements) |
| Exam hints | 78 | 27 |

Notes: Plain English 26 clicks (15 people) vs As taught 19 (13); mind map 14 people; Listen 6 people (57 clicks).

| By lecture | Accuracy | Tries per question |
|---|---|---|
| Cement & Cementation | 80% | 47.0 |
| Bonding Dental Ceramics | 82% | 42.4 |
| Glaze & add contacts (video) | 83% | 35.3 |
| Color | 85% | 42.2 |
| Onlays | 86% | 40.9 |
| Laminate Veneers | 88% | 39.4 |
| Removing a Crown | 92% | 40.2 |

By type: MCQ 85%, matching 85% (8 items of 4 pairs), select-all 83% (5 options, 3 correct, with tick boxes), sequence 76%
(3-5 steps). By source: slides 82%, recordings 82%, **hint email 87% with the most practice (49 tries per question)**.
Hardest: `on-telio` 48% (bis-acryl 13), `bo-zprime` 50% (eugenol 14), `ce-irm` 51% (RMGI 13), `on-materials-list` 51%,
`bo-adh-thick` 52%, `co-uranium` 53% (cobalt 10), `ce-sbu` 57%.

Check-ins, **n = 7** (two more on 10-20, n = 9: one About right, 325 min at 83%, went better; one Hub was easier, 384 min at 88%, as expected): About
right 4, Hub was harder 2, Exam asked different things 1; went better 3, as expected 3, worse 1; readiness 3-5 (average 3.9). Against use: the one "different things" had the most answers of anyone (933 at 91%, 377 min)
and asked for application ("what cement for what type of crown"); both "Hub was harder" were 91-93% accurate (64-245 min);
the one "worse than expected" studied the most (682 min, 86%) and still called the hub about right. One wrote that the
exam "followed the hints a lot so the questions around those were very helpful."

What changes because of it: (1) for Fixed Pros, build again from the course's hint email (blueprint, `hint` source, Exam
Hints tab): it matched the exam; (2) add decision items (which cement for this crown and situation, which material for this
onlay), the most common ask across courses (standing lesson above); (3) short select-alls with tick boxes worked (83%), as
did 4-pair matching; (4) a Canvas exam open all day puts a quarter of the time on exam day, so keep fixes and the Daily
Drill fresh through that day. Cleanup still to do by hand: remove `hubs/pcd-exam3/` (its card leaves the dashboard 10-25)
and optionally move its entry into `ARCHIVED_HUBS`.

### MSK Exam 3 (`msk-exam3`), exam 2026-10-02, archived 2026-10-02 (written 2026-10-10)

Data: 87 people, ~203 h (12,182 min); 39 came on one day only, 32 on 3+ days, median 52 min each, 23 under 5 min.
**17,008 answers from 68 people** (median 189 each, most 1,095; 35 answered on 2+ days), 81% overall. Night before
(10-01): 5,342 min from 61 people (44% of all time), 26 of them first-time visitors; exam morning 1,582 min from 47.
14 people studied after midnight. 25 mocks from 15 people, 86% average (20 of them on the eve). Recap published to the
dashboard 2026-10-09.

| Section | Minutes | People |
|---|---|---|
| Question bank | 5,953 | 61 |
| Lecture notes | 3,707 | 80 |
| Mock exam | 458 | 23 |
| Weak Spots | 419 | 22 |
| Cram sheet | 385 | 38 |
| Daily Drill | 356 | 17 |
| Review tables (all) | ~570 | 28 (drugs) |
| Exam hints | 186 | 25 |
| Arcade (all) | ~160 | 16 |

Notes: lecture picks were even (68-107 opens each; Cartilage, Joints and Bone most), Plain English 61 vs As taught 48,
mind map 54, Listen 44 clicks. Arcade: Sort Storm 50 runs from 9 people, every other game 1-5 runs.

| By lecture (current bank, `rv-*` items removed) | Accuracy | Tries per question |
|---|---|---|
| Bone Development, Remodeling & Homeostasis | 75% | 57 |
| Tumors of Bone & Soft Tissue | 76% | 44 |
| Drugs Affecting Bone Mineral Homeostasis | 77% | 46 |
| Cartilage | 77% | 64 |
| Bone: Composition & Cells | 80% | 60 |
| Nutritional Diseases | 81% | 60 |
| Joint Diseases | 81% | 56 |
| Hereditary & Acquired; Bone Repair | 82% | 53 |
| Autoimmune Diseases | 84% | 50 |

By type: MCQ 81%, matching 73%, **sequence 36%** (9 items). By source: hub-written 76%, class quiz 79%, lecture quiz 81%,
Slido 86%, definition-to-term 87% (PollEv review set 91% before it was removed). Hardest: six orderings
(`h-jt-ra-seq` 17%, `h-bd-endo-seq` 18%, `h-ca-collagen-seq` 25%, `h-he-fx-seq` 30%, `h-bd-remodel` 30%,
`h-bd-oc-diff` 40%, over 48-68 tries), the tumor-location matching item `h-tu-match` 38%, then EXCEPT items `ex-zinc`
43% (night blindness picked 11 times: it is a vitamin A sign) and `ex-osteosarc` 48% (the age peak picked as the false
one). Every question got 23+ tries.

Check-ins, **n = 8** (later ones go into the next audit): hub vs exam About right 4, Hub was harder 2, Hub was easier 1,
Exam asked different things 1; went better than expected 4, as expected 3, worse 1; readiness 3-5. Against each
person's use: the one "Exam asked different things" was the heaviest user (853 min, 1,095 answers, 71%); the two "Hub
was harder" were among the most accurate (84-87%, 277-476 min); the one "Hub was easier" studied 560 min at 77%. Unlike
GI Exam 2, calling the hub easier didn't go with less study. Missed (as topics): Patient Box questions that test how
structures and diseases work (twice), where bone forms and how cells differentiate, EXCEPT items, image labeling, RA.

What changes because of it: (1) orderings capped at 5 steps (already in the MSK 4, PCD and Occlusion builds: all their
orderings are 3-5 steps); (2) Patient Box, EXCEPT and diagram questions from the start (all three new hubs have them);
(3) the night-before landing matters most: 26 of 61 eve visitors were new, so the quick-start row and Daily Drill stay
at the top of Course Home; (4) arcades stay a small reskin, not new work (under 2% of time again). Cleanup still to do
by hand: remove `hubs/msk-exam3/` (its card leaves the dashboard 10-12) and optionally move its entry into
`ARCHIVED_HUBS`.

### GI Exam 2 (`hepatobiliary`), exam 2026-09-18, archived 2026-09-23 (written 2026-09-29, after the fact)

Data: 78 people, ~170 h (10,197 min in the recap, capped at 3 h per sitting); 37 came on one day only, 26 on 3+
days, median 32 min each, 31 under 5 min; 9,974 answers from 53 people, all 404 questions answered at least once.
Night before: 3,588 min from 53 people; 14 people studied after midnight. No section, click, mock or search data
(section tracking only started working for this hub after it was archived).

| By lecture | Accuracy | Attempts per question |
|---|---|---|
| GI Pharmacology | 71% | 17 |
| GI Pathology | 73% | 17 |
| Liver Physiology | 73% | 26 |
| Liver & Biliary Pathology | 75% | 20 |
| Clinical Applications for Dentistry | 75% | 21 |
| Fluid & Electrolytes | 76% | 30 |
| Liver & GB Histology | 79% | 24 |
| Digestion & Absorption | 81% | 30 |
| Intestine Histology | 82% | 26 |
| Pancreatic & Biliary Secretion | 84% | 34 |

By type: MCQ 84%, recall 74%, matching 53%, sequence 53%. Hardest: `gp26` and `mt10` (Crohn vs UC matching,
5% and 7%), `hb89` (hepatic iron-transport glycoprotein, 23%), `fl13` (vomiting reflex sequence, 28%), `hb19`
(methotrexate, 30%), `gp31` (GIST KIT mutation, 30%). Mode opens: Compendium 426, Game 59, Atlas 32, Quest 27.

What changed because of it: the standing lessons above (per-pair grading and the late-lecture gap feed the Daily
Drill and future banks). Check-ins (n = 6 by 10-01, against each person's own time in the hub): the three "About right" studied 631-980 min
(598-813 answers) and felt ready (4, 4, 5); the two "Hub was easier" studied 166-176 min (187-260 answers), readiness
4 and 2, one "worse than expected"; one "Hub was harder" studied 85 min (290 answers), readiness 3, "better than
expected". Small numbers, but who calls the hub easier isn't who used it most. Missed: "patient box style questions".
A seventh (10-01): About right, readiness 3, better than expected. An eighth (10-01 evening): About right,
readiness 4, as expected, 37 min in the hub. Later check-ins go into the next refresh.

Exam check-ins and search-term tracking were added so the next retro can answer what this
one couldn't: did the hub match the exam, and what were people looking for that wasn't there.
