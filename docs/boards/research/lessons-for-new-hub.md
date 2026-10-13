# Lessons for the boards hub (INBDE + ADEX)

What the class's use of the existing hubs says about designing a new, long-lived hub with notes, a large question
bank and one deep game. Written 2026-10-04 from `LESSONS.md` (refreshed the same day) and a fresh read of all
Supabase data (pulled the evening of 2026-10-03 Central).

## Data sources and caveats

- Hubs with data: **perio** (live; midterm 10-01, final 11-19), **MSK Exam 3** (exam 10-02, now archived), **GI Exam 2**
  (`hepatobiliary`, exam 09-18, archived; no section or click data). A `genetics` hub has 1,907 answers from 29 people.
- Time = `activity_pings` (25 s each, stops after 15 min idle since 09-25). Section data from 09-23, clicks from 09-25,
  mock scores from 09-28, per-option picks from 10-01. **Each hub was live about 9-12 days**, so there is no data
  at all on how this class uses a hub over months. That is the biggest unknown for a 22-month hub.
- People = browser visitor ids. 139 ids were active since 09-23 for a class of about 120, so some people count twice
  (two devices; only 4 device links were ever made).
- **Device mix isn't recorded** (no user-agent or screen size anywhere). The only hint: the desktop Daily Drill chip
  was tapped by 18 people, the phone-bar drill tab by 7. Treat that as weak. A coarse device class (phone / tablet /
  desktop) on the visit is worth logging in the new hub.
- `arcade_scores` rows undercount plays: perio Flappy had 10 players and 30 minutes but 1 saved score, so some games
  only save some runs. Use the minutes (pings) for reach and the score rows for replays.
- Small n everywhere for the written voice: 24 perio check-ins, 3 MSK, 8 GI2; 8 survey answers; 6 searches.

## Game usage (arcades)

Each hub had a multi-game arcade: MSK's Bone Zone (9 games, from 09-23) and perio's Pocket Arcade (9 games, from
09-24). GI Exam 2 had an illustrated "Game" scene mode (59 mode opens in its retro; no time data).

**Share of time: MSK 19 people, 172 min, 1.4% of all MSK time; perio 30 people, 221 min, 1.7%.** Opening the Arcade
tab: 22 people (MSK) and 26 (perio). The heaviest players were also heavy studiers (top five: 31-61 arcade minutes
each, inside 191-631 total minutes in the hub).

| Hub | Game | People (time) | Minutes | People on 2+ days (time) | Score rows | People with a score | People with 2+ runs | People with scores on 2+ days |
|---|---|---|---|---|---|---|---|---|
| MSK | Sort Storm (`sort`) | 7 | 32 | 3 | 50 | 9 | 7 | 2 |
| MSK | Hangman | 4 | 51 | 0 | 2 | 2 | 0 | 0 |
| MSK | Bone Search (word search) | 2 | 19 | 0 | 5 | 1 | 1 | 0 |
| MSK | Osteo Snake (answers count) | 5 | 10 | 1 | 2 | 1 | 1 | 1 |
| MSK | Marrow Match | 2 | 5 | 0 | 2 | 2 | 0 | 0 |
| MSK | Stack Attack | 2 | 2 | 0 | 2 | 1 | 1 | 0 |
| MSK | Fact or Fracture | 4 | 2 | 0 | 2 | 2 | 0 | 0 |
| MSK | Whack-a-Clast | 1 | 1 | 0 | 1 | 1 | 0 | 0 |
| MSK | Clast Blaster | 1 | 1 | 0 | 1 | 1 | 0 | 0 |
| MSK | lobby + untagged | 16 + 6 | 20 + 25 | 6 + 2 | | | | |
| perio | Crossword (`cross`) | 7 | 38 | 0 | 12 | 6 | 4 | 0 |
| perio | Perdle (Wordle-style) | 8 | 30 | 1 | 1 | 1 | 0 | 0 |
| perio | Flappy | 10 | 30 | 1 | 1 | 1 | 0 | 0 |
| perio | Smile | 4 | 24 | 0 | 5 | 3 | 1 | 0 |
| perio | Quadrants | 5 | 16 | 1 | 2 | 2 | 0 | 0 |
| perio | Crusher | 10 | 12 | 0 | 10 | 8 | 2 | 0 |
| perio | Probe | 3 | 5 | 0 | 3 | 3 | 0 | 0 |
| perio | Sweeper | 4 | 3 | 0 | 1 | 1 | 0 | 0 |
| perio | Planer | 2 | 1 | 0 | 0 | 0 | 0 | 0 |
| perio | lobby | 28 | 58 | 6 | | | | |

Reading it: the most-played game in either hub was a fast sort-the-fact game built straight from the bank (Sort Storm:
50 runs, 9 people, 7 replayed). The two word games (Crossword, Perdle) held people longest per person. Only 3
people ever saved a score in the same game on two different days. Players per game top out at 10, about a tenth of
the visitors. "Play again" was tapped by 13 people in perio and 6 in MSK.

## Mock exams and Daily Drill

- **Mocks** (`mock_scores`): perio 47 mocks from 26 people (38 of 20+ questions; 26 from 14 people on the exam eve at
  86%, 15 from 10 people on exam morning at 91%). MSK 25 from 15 people, all 40 questions, **20 of them on the eve**
  (13 people, 84%). Mock time: perio 13 h (36 people), MSK 8 h (23). Mocks are an exam-eve tool, and hub mock scores
  (84-91%) ran well above how people felt the exam went.
- **Daily Drill** (from 09-28): MSK 17 people, 356 min (231 of them on the eve, 12 people), 8 people on 2+ days;
  perio 20 people, 247 min, 8 on 2+ days. It was the only thing asked for in writing in the survey ("a daily drill
  where I practice questions that I missed / high-yield questions so that they stay fresh"). Weak Spots: 7 h MSK
  (22 people), 3 h perio (21).

## Bounce, return visits, devices, time of day

- **Cramming**: 42% of all perio time was the day before the midterm (57 people), 44% of MSK time the day before Exam 3
  (61 of 87 people); GI2 35%. **26 of MSK's 61 eve visitors opened the hub for the first time that evening.** More than
  half of MSK's 17,008 answers came on the eve and exam morning.
- **After the exam, nothing**: perio, still live for a final 7 weeks away, had 63 people on midterm day, 2 on 10-02
  and 1 on 10-03.
- **Bounce** (< 5 min, all time): GI2 31 of 78, MSK 23 of 87, perio 46 of 120. One day only: 37 of 78, 40 of 87, 65 of
  120. 3+ days: 27, 29, 36. Median minutes per person: 32, 53, 37. Bounces are lowest on the exam eve (3 of 57,
  5 of 61) and highest on exam morning (MSK 15 of 47). Perio's one-tap quick-start row is used: practice=<lecture>
  buttons 14-20 clicks each, "Practice questions (midterm)" 8, its Daily drill button 5.
- **Time of day** (Central, since 09-23): busiest at 5 pm (59 people) and 9 pm (1,938 min); a 7-9 am spike on exam
  mornings (9 am: 69 people); 23 people studied between midnight and 1 am, a handful until 5 am.
- **Devices**: unknown (see caveats).

## Searches, surveys and check-ins

- **Search** is nearly unused: 6 searches ever, all MSK, one each. Zero results: "keratin", "keratinocyte", "produced
  by", "this bod" (a partial phrase).
- **Survey** (n = 8): most helpful = Question bank 5, Lecture notes 2, Review tables 1; usefulness 4.9 / 5.
- **Exam check-ins**: perio midterm n = 24: ready 4-5 of 5 for 23 of them, yet went worse than expected for 10 (as
  expected 11, better 3). Hub vs exam: About right 11, **Hub was easier 9**, Exam asked different things 4. Heavy users
  called the hub easier too (168-616 min). What they said the hub missed: **images** (suture techniques; 5 of the first
  14 mentioned pictures), **two-statement** and **"all of the following EXCEPT / NOT true"** questions, staging and
  grading **diagnosed from a patient case** and recall of the full criteria lists, suture material names written out
  (the hub abbreviated). MSK n = 3: "more complex patient box style questions", "basic understanding of functional
  aspects ... how certain diseases work", "location of bone formation and differentiation" (the weakest lecture), "some
  except questions", "labeling image", "more details on RA". GI2 n = 8: 5 About right, 2 easier, 1 harder; missed
  "patient box style questions".
- **Reports and suggestions**: 12 question reports and 3 suggestions in all, all now resolved with replies. Each
  real report exposed a pattern (giveaway choices, an explanation using facts not in the case, a wrong EXCEPT key,
  invisible feedback on a question type). Suggestions: memory cues on missed questions, undo on ordering questions.

## The lessons that matter for a long-lived notes + bank + game hub

1. **Notes and the bank are the hub.** Bank and notes were 70-80% of all time in both data-rich hubs (MSK 99 h +
   62 h of 204 h; perio 98 h + 51 h of 217 h) and 7 of 8 survey answers. Build those first and best.
2. **A side arcade of many small games doesn't get played.** 18 games across two hubs drew 1.4-1.7% of time and at most
   10 players each. If the game is meant to matter, its core loop has to *be* answering bank questions (so game time
   counts as studying, recorded through the normal answer path), not a separate distraction.
3. **What did get replayed was fast and bank-driven.** Sort Storm (sorting facts from the bank) had 50 runs from 9
   people, 7 of them replaying; the word games held people longest per person. Short rounds built on real content beat
   action mini-games with a quiz bolted on (Whack, Blaster, Stack, Flappy: 1-10 people, 1-30 min).
4. **Nothing has yet brought anyone back to a game.** Only 3 people saved a score in the same game on two different
   days. Long-term progression is untested in this class: build its first slice small, measure second-day return from
   day one (per-visitor game days, runs, questions answered in-game), and don't stake the hub on it.
5. **Use is exam-driven, and stops the day after.** 42-44% of each hub's time was the exam eve; perio dropped from 63
   people to 2 the day after its midterm with the final 7 weeks away. A 22-month boards hub won't get steady use
   without a reason to come back. The strongest one available: line its units up with the course exams the class is
   taking (each course exam is a cram wave the hub can serve), plus a short daily set.
6. **Expect a first-visit cram crowd, and serve it in one tap.** 26 of MSK's 61 eve visitors were new that night;
   26-40% of visitors leave within 5 minutes and about half come on one day only. The landing view must reach a question
   or the notes in one tap (perio's quick-start row is used: 14-20 clicks per lecture button).
7. **The Daily Drill is the return mechanic students asked for**, but it only ran in exam week: 17-20 people per hub,
   8 of them on 2+ days. For a two-year hub it needs long spaced-review intervals (1/3/7/14/30/60/120 days, per
   `DECISIONS.md`) and should be the default home of a returning visitor.
8. **Mocks are an eve-of-exam tool** (MSK: 20 of 25 on the eve; perio: 41 of 47 in the last two days), and hub mock
   scores (84-91%) ran above how the exams went. A boards hub needs timed, exam-format blocks late in the run, and
   its readiness measure shouldn't rest on easy items.
9. **Write in the exam's formats from day one.** Perio's bank had no two-statement or EXCEPT items and no images;
   10 of 24 said the midterm went worse than expected despite feeling ready, and 9 of 24 called the hub easier. For
   the INBDE that means case-based Patient Box items as the core format, plus the formats the official outline and
   sample items actually use (other agents are researching those).
10. **Plan images early.** Pictures were the single most-named gap (suture techniques; image labeling on MSK). Boards
    items lean on radiographs, clinical photos and charts. Within the no-AI-art rule, that means accurate drawn
    diagrams and openly licensed real images with attribution, budgeted from the start.
11. **Case explanations may only use facts in the case.** Report #10: an explanation leaned on bone loss the Patient
    Box never gave. Put every finding the answer rests on in the case, then walk the reasoning from it.
12. **Every explanation names the class's favorite wrong answer.** It works: five MSK MCQs went from 35-52% to 67-82%
    within a day of that fix (`q2-03` in perio went 30% to 61% earlier). Record per-option picks from launch.
13. **Add a memory cue to every item.** Students asked for "a way to remember it" on a miss (suggestion #2); the cue
    shown after a wrong answer (`q.cue`) is now standard. Write it with the item, not afterward.
14. **Keep orderings at 4-5 steps and select-alls at 4-5 options; avoid long matching.** 7 of MSK's 11 items under 50%
    were orderings (17-48% over 48-68 tries); a 7-option select-all sat at 20%; a better explanation didn't lift a
    matching item (46% to 34%). Never repeat a right-hand answer in matching. Give orderings undo / start over.
15. **Distractors must be same-category and length-matched.** An audit found 25 giveaway choices; 73 MSK items were
    90%+ over 30+ tries. The CI lint already fails a bank where the key is the longest choice in over 40% of MCQs.
16. **Every question type needs unmistakable right/wrong feedback, checked on a phone.** Two of the first four reports
    were feedback that looked like nothing happened (self-graded cards, orderings).
17. **The report button and reply loop earn trust; plan for volume.** 12 reports in about two weeks on ~660 items, each
    exposing a bank-wide pattern. At 1,200 items over 22 months, budget for reviewing reports, and store the outline
    version on each item so yearly outline changes can be re-checked.
18. **Content added last gets practiced least.** GI2's last lectures got ~17 tries per question vs ~30 for the early
    ones. With staged releases, announce each new unit and route the drill toward it.
19. **Tag sources and high-yield.** Items from class quizzes and polls were practiced most (32-38 tries vs 22) and
    PollEv items scored 91%. For the boards, tag each item with its outline area (INBDE Domain / ADEX section) and a
    high-yield flag the drill can use.
20. **Look-alikes need side-by-side tables.** GI2's Crohn vs UC matching items were the hardest in its bank (5-7%).
    Review tables drew a steady minority (perio ~28 h, MSK ~10 h): use them for comparisons, not as a separate mode.
21. **Plain English gets used; narration is a maintenance cost.** MSK: 22 people used Plain English vs 16 "As
    taught"; Listen 11 (MSK) and 8 (perio) people. Every text edit must regenerate its mp3, which is expensive for notes
    that will grow and be revised for two years. Plain-English notes yes; narration only for stable units.
22. **Search barely matters; synonyms do.** 6 searches ever. Don't build around search, but index synonyms and
    abbreviations (the zero-result "keratin" / "keratinocyte" are the kind of term people expect to find).
23. **Social features reach a minority.** 10 custom names, 4 device links, 2 nuke launches; 19 adopted Timmy; trophy
    and easter-egg taps came from 2-4 people each. The game must be fun solo; leaderboards are optional garnish.
24. **Progress over two years needs identity that survives devices.** 139 visitor ids for ~120 students and only 4
    device links: long-term game progress or spaced-review history tied to one browser will be lost. Make linking (or a
    simple sign-in) part of the first-run flow if progression is meant to last months.
25. **Design for short evening sessions, often on a phone.** Use peaks at 5 pm and 9 pm, exam-morning spikes from 7 am,
    23 people after midnight. Game rounds of a few minutes, playable silent, and resumable.
