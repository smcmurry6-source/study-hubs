# Open Practice: a career-campaign RPG for the boards hub (design)

Status: design draft, 2026-10-04. Owner: boards hub. Read with `docs/boards/DECISIONS.md`, `LESSONS.md` and
`docs/boards/research/architecture.md` (the hub contract this plugs into: hub id `boards`, event `boards:answered`,
item ids `b-<unit>-NNNN`, game files loaded on demand from `hubs/boards/game/`). Exam facts come from
`docs/boards/research/inbde.md` and `adex.md`.

Working title **Open Practice**: you open a practice, and every appointment is practice. The town is **Crown Harbor**.

## 1. Elevator pitch

Crown Harbor's only dentist, Dr. Abe Linwood, has retired, and the town has gone a year without care. The dental
school's community program hands you, a second-year student-doctor, the keys to his shuttered storefront on Main
Street, one working chair, and fifteen specialists around town who agree to supervise you. Over a real two-year
career (D2, D3, D4, then licensure) you fill your schedule, bring the town back district by district, earn each
mentor's trust, and finally take the ferry across the bay to the State Board for the Licensure Gauntlet. Pass, and
the practice is yours.

Every patient is a bank item:

- a **walk-in** is a standalone single-best-answer item;
- a **booked patient** arrives with a chart (an INBDE patient box) and stays for a 2-6 item case;
- a **recall patient** (the same face every visit) is an item your spaced review says is due;
- a **callback** is an item you missed last time;
- a **referral** is an item the class gets wrong most (`question_stats`);
- a **Code Blue** at Harbor General is a medical-emergency case on a clock;
- a **lab case** on Restoration Row is an ADEX "spot the critical error" on a to-scale drawn preparation, with a
  probe you drag to measure.

The town is the readiness report. Each district's buildings, gardens and window lights come back as your readiness
in that unit rises, and slowly gather weeds when you stop reviewing it. At night, only the districts you know are lit.

It is the Daily Drill with a world around it: one tap on the hub's landing view opens today's clinic, the first
patient is in the chair within two seconds, and ten patients take about twelve minutes. The game grades nothing
itself: the hub's card renderer grades, `boards:answered` fires, and class stats, spaced review, the Daily Drill, XP,
ranks, mastery and Weak Spots update exactly as they do in the question bank.

Three rules hold the rest up:

1. **The game never hides a question.** Story, decor and areas unlock; items never do. A student who needs
   pharmacology on Tuesday gets pharmacology on Tuesday, in or out of the game.
2. **One answer, one truth.** No hints or lifelines inside an item, each item answered at most once per encounter, no
   instant retries. `question_stats`, `question_choices` and XP stay honest.
3. **Exam formats, not game formats.** INBDE: single best answer with 3-5 options, patient boxes, 3-6 item sets,
   images (no zoom under exam conditions). ADEX: DLOSCE "select one or more" (any wrong pick scores 0), prescription
   tasks, and the clinical criteria (ACC / SUB / DEF, critical errors) read off drawn preparations. No orderings, no
   matching, no self-graded recall inside the game.

## 2. What the data says, and the rules it sets for this game

| Finding (`LESSONS.md`, `research/lessons-for-new-hub.md`) | Rule for Open Practice |
|---|---|
| Notes + bank are ~80% of hub time; both arcades got 1.4-1.7% (19 and 30 people); at most 10 players per game; 3 people ever saved a score in the same game on two days. | The core verb is answering bank items. No action mini-games. Game time is study time by construction, and the game sends people to the notes (every chart note has "Read this in the notes"). |
| What got replayed was fast and bank-built (Sort Storm: 50 runs, 9 people, 7 replays). | First item on screen within 2 s of the tap; at most ~1.5 s of non-question time per standalone item; every animation skippable with a tap; at most two sentences of story between items. |
| Use is exam-driven: 35-44% of all hub time on the exam eve; perio fell to 2 people the day after its midterm. | **Cram Clinic** events tied to course exam dates; the game must be at its best in exam week. Daily play is rewarded when it happens, never demanded (no streak-loss guilt). |
| The Daily Drill is the return mechanic students asked for (17-20 people per hub, 8 on 2+ days). | **Today's clinic is today's drill**: same set, same streak, dressed as recall patients, callbacks and referrals. Long review steps (1/3/7/14/30/60/120 days) through `window.SH_SRS`. |
| 26-40% of visitors leave within 5 minutes; half come on one day only; 26 of 61 MSK eve visitors were first-timers. | No account, no name entry, no tutorial screen: the first patient is the tutorial. One tap from the hub landing to a question. |
| Orderings over 4-5 steps (17-48%), 7-option select-alls (20%) and long matching (34%) fail; the INBDE uses none of these. | The game serves single-answer and multi-answer items only. Multi-answer items stay at 4-6 options; long-list single answers (DLOSCE differentials of 10-15 options) are fine, since only one pick is made. |
| The exam felt harder than the hub (9 of 24 perio check-ins: "hub was easier"); check-ins asked for patient boxes, EXCEPT items, images. | Cases and images are first-class; readiness weights harder and case items more; bosses are built from cognitive level 2-3 items. |
| Explanations that name the favorite wrong answer lifted items from 35-52% to 67-82%; students asked for memory cues. | After every answer: the chart note (explanation), the class's most-picked wrong option, and on a miss the district mentor "says" the item's `cue`. |
| The last-added content gets the least practice. | New units arrive as "new patients" for 14 days; the scheduler boosts under-practiced items. |
| Reports expose bank-wide patterns; feedback must be unmistakable on phones. | The Report button rides on every in-game card (it is the hub's own card); every verdict is icon + word + color + sound. |
| Arcade score rows undercounted plays; device mix isn't recorded. | Measure the game from day one: time in `clinic/*` sections, answers by source, seconds per item, second-day return. |

