# Chairside: the boards hub's game (complete design)

Status: design, 2026-10-06. Owner: boards hub. Supersedes the partial drafts `roguelite-clinic.md` (Chairside) and
`rpg-campaign.md` (Open Practice), whose best parts are grafted in here. Read with `docs/boards/DECISIONS.md`,
`LESSONS.md`, `docs/boards/research/architecture.md` (build contract), `inbde.md` and `adex.md` (exam facts) and
`lessons-for-new-hub.md` (usage data).

Contents

1. Elevator pitch
2. What the data says, and the rules it sets
3. Core loop at every time scale
4. How items are used
5. The shift (one run): structure, scoring, flow, perks
6. Bosses
7. Progression and economy (months to years): the career and the clinic wings
8. Coming back: steady, spaced practice over 22 months
9. Social layer (async first)
10. Licensure Gauntlet (ADEX and the INBDE simulation)
11. Art direction (drawn in code, premium)
12. Key screens (ASCII, phone first)
13. Audio
14. Accessibility
15. Integration with the repo's widget
16. Technical architecture
17. Release 1 vertical slice vs the full version
18. Risks and mitigations
Appendix A. Data contracts
Appendix B. Tuning tables
Appendix C. Perk list (release 1)

---

## 1. Elevator pitch

**Chairside** is a short-session roguelite set in a teaching clinic, where every action is a real board item.

You are a D2 student-doctor in a clinic that is mostly dark. Each **shift** (8-15 minutes, made to fit a phone between
classes) you see three to five patients. A patient arrives as an INBDE-style **patient box** (Patient, Chief
Complaint, Background and/or Patient History, Current Findings) and stays for a **visit**: a chain of linked
single-best-answer items that follow the visit the way the exam's case sets do, for example *medical clearance ->
diagnosis -> treatment plan -> complication at the follow-up*. Answer well and your **Flow** builds; answer "Sure" and
miss, and you lose **Composure**. Between patients you draft one of three **protocols** (perks) that change how a shift
scores and flows, never what the right answer is. Each shift ends with an attending's **boss case**: a long, hard,
image-heavy case from that wing's discipline.

Around the runs sits a **career** that lasts as long as the class does: D2 fall to licensure, about 22 months. The
clinic has eleven **wings** (Perio, Endo, Pharmacy, the Medical Floor, Imaging...), one per group of study units.
A wing lights up as your readiness in its units rises and dims, gently, when you stop reviewing them. Your recall
patients come back when spaced review says they are due. Late in the career the ferry leaves for the **Licensure
Gauntlet**: an INBDE simulation and the ADEX floor, with spot-the-critical-error challenges on to-scale drawn
preparations and radiograph reads.

The class plays together without having to be online together: a weekly seeded **Board Day** everyone plays once,
ghosts of classmates on the same patients, a monthly class **census** per unit, and, when several people happen to
be in the hub at once, an optional live **Grand Rounds** raid.

Three sentences that hold the design up:

- **The game is the Daily Drill with a world around it.** Today's shift *is* today's drill. Every answer goes through
  the hub's own card and `recordAnswer`, so class stats, spaced review, XP, ranks and Weak Spots move exactly as in the
  question bank.
- **Knowledge is the only power.** No item is ever made easier, timed for points or skippable for profit. Perks change
  stakes, structure and information about *you*, never about the answer.
- **Coming back is the win condition.** The game is tuned for a student who plays 10 minutes on 4 days a week for
  two years, not one who plays 4 hours the night before an exam (though it serves that student too).

## 2. What the data says, and the rules it sets

| Finding (`LESSONS.md`, `lessons-for-new-hub.md`) | Rule for Chairside |
|---|---|
| Notes + bank were 70-80% of hub time; 18 side-arcade games got 1.4-1.7% of time and at most 10 players each. | The core verb is answering bank items. No action mini-games. Game time is study time by construction. |
| What got replayed was fast and bank-built (Sort Storm: 50 runs, 9 people, 7 replays). | First item on screen within 2 s of the tap; at most ~1.5 s of non-question animation per item; everything skippable. |
| Only 3 people ever saved a score in the same game on two days. | Second-day return is the north-star metric, instrumented from day one (Section 8.6). Long-term progression starts small and is gated on data. |
| 35-44% of time was the exam eve; perio fell to 2 people the day after its midterm. | Course exams are waves the game serves (Cram Clinic); the day after an exam opens a "keep it" plan instead of going silent. |
| The Daily Drill is the return mechanic students asked for (17-20 people per hub, 8 on 2+ days). | Today's shift is built from the drill's set; long spaced-review steps 1/3/7/14/30/60/120 days via `window.SH_SRS`. |
| 26-40% of visitors leave within 5 minutes; half come on one day only. | No tutorial screen and no sign-up: the first patient is the tutorial. One tap from the hub landing to an item. |
| Hub mocks scored 84-91%; exams felt harder (9 of 24 perio check-ins). | Readiness weights hard, case and image items; bosses are cognitive level 2-3. Readiness can't be earned on easy items. |
| Explanations that name the favorite wrong answer lifted items 35-52% -> 67-82%; students asked for memory cues. | After every answer: the explanation, the class's most-picked wrong option and, on a miss, the item's `cue` spoken by the wing's mentor. |
| Long orderings, big select-alls and long matching failed, and the INBDE uses none of them. | The game serves single-best-answer items only (Section 4.1). |
| Pictures were the most-named gap. | Image items and drawn preparations are first-class, not an add-on. |

Design pillars, in priority order:

1. **Honest data.** One answer per item per encounter, no instant retries, no hints inside an item, the authored
   choice index always passed. `question_stats` and `question_choices` stay trustworthy.
2. **Guessing never pays; speed never pays.** Proven in Section 5.3 and Appendix B.
3. **Exam formats only.** INBDE style: 3-5 options (usually 4), one best answer, EXCEPT/NOT/LEAST in capitals, never
   all/none of the above, patient boxes, 2-6 item sets. ADEX: the same, plus spot-the-error regions on drawn work.
4. **Short and resumable.** State saved after every item; a shift can be left mid-patient and resumed days later.
5. **Kind.** No guilt, no loss of anything earned, no countdown pressure, no notifications by default.

## 3. Core loop at every time scale

| Scale | Loop | What the player does | What the game gives back |
|---|---|---|---|
| ~60-100 s | **Item** | Read the chart and stem, pick an option, lock in **Sure** or **Unsure** (or **Refer**). | Verdict (icon + word + color + sound), explanation, class split and favorite wrong answer, mentor cue on a miss, Care and Flow change. |
| 3-6 min | **Patient** (one visit) | Work 1 item (walk-in) or a 2-6 item case set as the visit unfolds. | Patient outcome (Delighted / Stable / Referred / Complication), a portrait in the day sheet, the protocol draft. |
| 8-15 min | **Shift** (the run) | Choose 3-5 patients from a branching day sheet, draft protocols, face the attending's boss case. | Shift grade, Care banked, wing readiness update, unlocks, a one-line "what to read" list linked to the notes. |
| A day | **Today's shift** | One shift built from today's drill set: due recall patients, callbacks, new patients in the focus wing. | Practice day marked, recall patients cleared, the wing lights brighten. |
| A week | **Board Day** + practice goal | One seeded run shared by the class; a weekly "4 practice days" goal. | Ghost splits, class board, a forgiving weekly ribbon. |
| A month / course | **Wing focus** + census + Cram Clinic | Follow the course the class is taking; push the class census for that unit; cram on the eve. | Wing level-ups, class decorations, mentor stories, "keep it" reviews after the course exam. |
| A semester | **Season** | A seasonal theme and featured wings matching the semester's courses. | Seasonal cosmetics, a season recap card. |
| 22 months | **Career** | D2 -> D3 -> D4 -> Licensure, all wings to Board-ready. | The Licensure Gauntlet, the final Board Week, the class's "opening day" recap. |

The loops nest so that every scale is satisfied by the same act, answering items, and the smallest useful session
(one patient, about 4 minutes) still moves every larger loop.

## 4. How items are used

### 4.1 Which items the game serves

The game reads the hub's bank (`BOARDS_GAME_API.questions(filter)`); it never holds questions of its own. An item is
**game-eligible** when:

- `type` is `mcq` (single best answer) with 3-5 choices, or `spot` (Section 4.5: a single-best-answer item whose
  options are regions of a drawing), and
- `fmt` is absent, `except`, `not` or `least` (negatives render in capitals as authored), and
- its unit is open in the hub (`LECTURES[].status !== 'preview'`).

Not served: `multi`, `match`, `seq`, self-graded recall, two-statement items and anything with "all/none of the
above" (the bank lint already refuses those for boards). If DLOSCE-style "select one or more" items are added to the
bank later, they belong in the hub's ADEX mock block; the Gauntlet (Section 10) may serve them only with the
DLOSCE's own rule (any wrong pick scores 0), never with partial credit for guessing.

### 4.2 A patient is a case set; a visit is its item chain

The bank's case sets (about 40% of items, as on the exam) are the game's booked patients. A case object (Appendix
A) holds the four-part patient box, optional stimuli (image keys), 2-6 item ids in visit order and optional **beats**,
one or two sentences the case author writes between items ("Two weeks later she returns with...", as the official
model cases move the story on). Every item also carries a `phase` tag, so the visit reads as a visit:

| Phase tag | Visit moment | Typical CCs (INBDE) | Example stem pattern (described) |
|---|---|---|---|
| `clear` | Intake, medical clearance | CC1, CC8, CC9, CC11, CC16 | Which finding in the history must be addressed before treatment? |
| `dx` | Examination, diagnosis | CC2-CC7, CC10, CC20, CC22 | What is the most likely diagnosis? Which test best confirms it? |
| `plan` | Treatment plan, consent | CC12, CC13, CC29-CC31 | What is the most appropriate treatment? How to explain the prognosis? |
| `tx` | Treatment, materials, drugs | CC18-CC21, CC25-CC28, CC38 | Which material, technique, drug or dose? |
| `fu` | Follow-up, complication, outcome | CC17, CC27, CC37 | At the follow-up, what explains the new sign? What should be done next? |
| `prev` | Prevention, maintenance, community | CC52-CC54 | What recall interval or preventive measure fits? |
| `prof` | Ethics, law, communication, infection control | CC42-CC51, CC55 | What must the dentist do now? |

Rules for how a visit plays:

- **The chart is always there.** Desktop: the box sits in a left column beside the item, as on the exam. Phone: a
  pinned "Chart" tab above the stem opens the box as a sheet; the first item of a case opens with the chart expanded,
  later items with it collapsed to one line ("F 62 · 'My gums bleed...' · 6 history lines · 4 findings"). Headings and
  order are exactly the INBDE's four.
- **The box includes realistic but irrelevant data**, written that way in the bank; the game never highlights
  "relevant" lines (that would be a hint).
- **Items in a visit are answered in order, each once.** A miss on the `clear` item does not change later items (the
  bank item is the bank item); the game only colors the story. If a `clear` item is missed, the `fu` item's beat can
  frame the complication as the consequence ("The bleeding didn't stop..."), but only when the case author wrote an
  alternate beat for that branch. Branching changes words, never which item is asked.
- **Walk-ins** are standalone items, with their own mini-box when the item has one; a walk-in takes about 1 minute.
- **Explanations may only use facts in the case** (LESSONS #11), and the case renderer shows the box beside the
  explanation so the reasoning can be traced.

### 4.3 Image items

- Images come only from the bank's `img` field: code-drawn diagrams from `src/boards/diagrams/` (labeled "Diagram")
  and openly licensed real radiographs or photos with attribution (CC0/CC-BY, credited under the image). Never
  AI-made.
- Radiographs carry R/L markers and no tooth numbers, as on the exam. INBDE CC7 items (interpret diagnostic results)
  should use real images; a drawing used there is flagged in the bank and the lint reports the share.
- Viewing: tap to open a full-screen viewer with pinch zoom and pan in normal play. In the Gauntlet's simulation
  blocks the viewer follows exam conditions (no zoom tool on INBDE items; rotate/zoom on DLOSCE 3D-style items).
- **Image options** (a few INBDE items have graphs or images as options) render as a 2x2 grid of tiles; each tile is
  a button with an authored text label for screen readers.

### 4.4 Radiograph reads ("tap the finding")

A `spot` item over a radiograph: "Which labeled area shows the periapical radiolucency?" becomes the image with 3-5
lettered hot regions (A-E) and the same letters as buttons below it. It is a single-best-answer item in every respect
(one key, `choice` = region index). Regions are authored shapes in the image's coordinate space, so they scale with
the viewer. Letters sit on the image like exam labels; the buttons below make it keyboard and screen-reader usable.

### 4.5 ADEX critical-error items ("Lab Bench")

ADEX's clinical exam is hands-on (typodont preparations graded ACC / SUB / DEF, with critical errors and penalty
points; `adex.md` section 4). The game cannot train hand skill; it trains the **examiner's eye**, which also carries
over to the DLOSCE's "which describes this preparation on tooth N" items. Each Lab Bench item is a `spot` item on a
**to-scale, parametric drawing** of a preparation:

- **Drawings.** `gfx/preps.js` draws a tooth outline and preparation in SVG from parameters in millimeters: occlusal
  view and proximal or facial section, a 1 mm scale bar and grid, enamel/dentin/pulp layers, adjacent teeth, the
  simulated free gingival margin. Kinds at launch of the Gauntlet: Class II prep (mandibular molar/premolar), Class III
  prep (maxillary incisor), all-ceramic and zirconia crown preps, anterior and posterior endodontic access, a
  periodontal chart page. Each criterion in `adex.md` 4.1-4.8 maps to parameters (isthmus width as a share of
  intercuspal width, marginal ridge width, pulpal floor depth, axial depth, gingival clearance, box wall divergence,
  margin position relative to the gingiva, total taper, margin form such as bevel or J-margin).
- **Fault injection at build time, not at play time.** `tools/build-boards.js` (game step) takes a reviewed template
  and a seed, pushes exactly one criterion into its SUB or DEF range (or none: "within acceptable limits"), renders
  the parameters into the item and freezes it into the bank with a permanent id (`b-adex-0001`...). Items are then
  reviewed like any other item; `question_stats` accumulate per frozen item. The thresholds are cited to
  `adex.md` rows (with the manual year in the item's outline-version tag) and re-checked each ADEX season.
- **Two linked items per drawing** (a mini case): (1) *spot*: "Which labeled area, if any, would an examiner grade
  as deficient?" with 3-5 regions plus an option "All criteria acceptable"; (2) *grade*: "How would that criterion be
  graded?" ACC / SUB / DEF, or "What is the critical error in this procedure?" for automatic-failure scenarios (wrong
  tooth or surface, unreported pulp exposure, gross damage to the adjacent tooth). Both are single-best-answer.
- **The probe.** A draggable measuring probe (snaps to the drawing, reads in 0.5 mm steps) is a reading aid, like a
  ruler on the exam's 3D model: it shows a distance, never a verdict. Using it is free and never scored.
- **Radiograph reads for ADEX** (lesion diagnosis before a restorative procedure, endo test tables with percussion,
  palpation, cold and EPT) use 4.4 and ordinary case items.
- **Prescription tasks** (DLOSCE: antibiotic and analgesic, scored 0-4) become a 4-item case chain of single best
  answers: drug -> tablet strength -> number dispensed -> sig. Honest, exam-shaped and drawn as a prescription pad.

### 4.6 Item selection and adaptivity (`sched/selector.js`)

Every item the game shows comes from one selector, deterministic for a seed so a shift can be resumed and a Board Day
is the same for everyone.

**Inputs.** The player's history (`STATE.answered`, latest result per item, from the hub), spaced review
(`window.shSrsDue()` and the SRS map from `shEggHooks.srs()`), today's drill set (Section 15), class-wide
`question_stats` (accuracy and attempts per item, fetched through one RPC that returns only the needed columns, paged,
because the bank passes 1,000 items; `architecture.md` section 8), the open units, the player's chosen focus wing and
the seed.

**Candidate pools**, each tagged with the patient type it becomes:

| Pool | Becomes | Source | Share cap per shift |
|---|---|---|---|
| Due reviews | **Recall patient** (same portrait each time the item returns) | SRS due today or overdue | up to 50% |
| Recent misses not yet due | **Callback** | latest try wrong, last seen >= 20 h ago | up to 20% |
| Never-seen items in studied/focus units | **New patient** | open units, not attempted | at least 20% |
| Class-hard items | **Referral** ("Dr. X sent this one over") | `question_stats` accuracy < 55% with >= 8 attempts | up to 15% |
| Under-practiced items (added in the last 14 days, or few class attempts) | **New patient** with a "new in clinic" tag | bank `added` date, attempts | fills gaps |

**Ability and difficulty.** Each unit has a player ability `theta_u` (logit scale, starts at 0), updated after every
recorded answer with an Elo step: `theta_u += K * (o - p)`, `p = 1 / (1 + exp(-(theta_u - b_i)))`, `K = 0.4`
decaying to 0.15 after 40 answers in the unit. Item difficulty `b_i = logit(1 - acc_i)` from class accuracy shrunk
toward a prior by attempts (`acc_i = (correct + 2 * prior) / (attempts + 2)`; prior from the item's cognitive level:
L1 0.75, L2 0.62, L3 0.50). The selector aims each new or referral item at a **target success of about 70%**
(desirable difficulty), mixing 60% in band (`p` between 0.6 and 0.8), 25% harder, 15% easier. Due and callback items
are not difficulty-filtered (they are due).

**Case assembly.** When a case is picked, all its items come with it, in order. A case is eligible when at least one
of its items is due, missed or new for the player; already-mastered items inside it are still asked (the case is the
unit of practice) but count as repeats for XP, as the server already does (2 XP for a repeat right answer).

**Spacing rules.** No item twice in one shift. No item shown again within 20 h unless due. No more than 3 items from
the same concept tag in a shift. Interleave units: no more than 3 consecutive patients from one wing unless the
player chose a single-wing shift (cram).

**Never-reward-speed, never-let-guessing-pay, in the selector.** The selector never chooses easier items to make a
streak continue, and Flow (Section 5) never feeds back into which items appear.

### 4.7 One answer, one truth (the honesty rules)

- Each item is answered **once per encounter** through the hub's card; `api.answer` is called once with the authored
  `choice` index; the hub's `recordAnswer` fires `boards:answered`.
- **No hints inside an item.** Notes, mentor cues and the class split appear only after the answer.
- **In-shift re-asks are practice only.** The "Second look" protocol can re-ask a missed item later in the same shift
  to restore Composure; that re-ask is labeled "Practice: not recorded" and does not call `recordAnswer`, so stats,
  XP and SRS are untouched.
- **Replays are unrecorded.** Replaying a past Board Day or a finished boss case is labeled practice and does not
  record answers or scores.
- **Refer** ("I don't know") reveals the answer, scores 0, keeps Flow, and is recorded as incorrect with no choice
  (`api.answer(qid, false, null)`) so spaced review brings it back tomorrow, which is what an honest "I don't know"
  should do.

## 5. The shift (one run): structure, scoring, flow, perks

### 5.1 Shape of a shift

A shift is a small branching **day sheet** (think a three-lane appointment book, not a dungeon):

```
 08:00   [Walk-in]      [Booked: Perio]      [Recall x2]
             \              |                    /
 09:30    [Booked: Pharm]   [Lab Bench]    [Break Room]
                   \            |            /
 11:00             [Booked: Medical]   [Callback]
                          \              /
 12:30                [ATTENDING: boss case]
```

- **Lengths.** *Quick visit* (one patient, about 4 min), *Half shift* (3 patients + boss, about 10 min, the phone
  default) and *Full shift* (5 patients + boss, about 18 min). *Today's shift* is the half shift built from the drill.
- **Slots** the player chooses between (2-3 per row): Walk-in (1 standalone), Booked (a 2-6 item case), Recall (2-3
  due items as one familiar patient), Callback (missed items), Referral (class-hard items), Lab Bench (spot items,
  from D4 season or when the Gauntlet opens, earlier as a preview), **Break Room** (no item: re-read one explanation
  from a miss earlier this shift; restores 1 Composure; reading is healing), and **Mentor's Office** (a rare protocol
  draft). Each slot shows its unit, patient type and item count before you choose, so choosing is a study decision
  ("I need pharm") as much as a game one.
- The day sheet is generated by `run/shift.js` from the selector's pools and the seed; it always contains every due
  item the shift promised (due items are never hidden behind a branch you didn't take: a Recall slot not taken rolls
  them into the boss case's waiting room or the next shift).

### 5.2 Resources

| Resource | Range | Moves when | Purpose |
|---|---|---|---|
| **Care** (score) | 0+ | Every answer (5.3) | The run score; banks to the career; leaderboards. |
| **Flow** | tiers 0-4 | Sure-correct raises; any wrong answer drops to 0; Unsure-correct and Refer hold | Multiplies the stakes of every answer, both ways. Music and visuals intensify. |
| **Composure** | 3 (max 4 via protocols) | Sure-wrong costs 1; Break Room and Second Look restore 1 | Calibration pressure. At 0 the attending "takes over the scoring": you finish your patients and every answer is still recorded, but Care stops accruing for the run. Practice is never cut short. |
| **Chart time** | none | | There is deliberately no clock in normal play. |

### 5.3 Scoring: calibrated confidence, a proper scoring rule

After picking an option the player locks it in as **Sure** or **Unsure** (two large buttons; Sure is the primary),
or taps **Refer**. Base Care:

| Lock-in | Correct | Wrong |
|---|---|---|
| Sure | +3 | -3 (and -1 Composure) |
| Unsure | +1 | -0.5 |
| Refer | 0 | 0 |

Flow multiplies **both** gains and losses: x1, x1.5, x2, x2.5, x3 at tiers 0-4.

Why guessing never pays: with `k` options a blind guess is right with probability `1/k <= 1/3`.
Expected Care for a blind Sure is `m(3/k - 3(1 - 1/k)) = m(6/k - 3) < 0`; for a blind Unsure it is
`m(1/k - 0.5(1 - 1/k)) = m(1.5/k - 0.5) <= 0` (exactly 0 only for 3-option items). Refer is 0. And a wrong answer
also costs Flow. Partial knowledge is rewarded honestly: eliminating two of four options (p = 0.5) makes Unsure worth
+0.25 m, and Sure pays more than Unsure only when the player's real chance of being right is above about 56%
(`6p - 3 > 1.5p - 0.5`). The game teaches this in one line on the first Unsure ("Pick Sure when you'd bet on it").
Calibration itself is shown at the end of each shift ("When you said Sure you were right 84% of the time; when Unsure,
41%"), which is useful exam self-knowledge.

Why speed never pays: no score, multiplier, grade or leaderboard uses time. Board Day ties are broken by calibration,
then by fewer Refers, never by time. A soft **skim guard** exists only to protect the data: an answer locked in faster
than a plausible reading time (stem + options at about 15 words per second, minimum 2 s) earns no positive Care (losses still apply, so fast tapping can never dodge a penalty) and shows
"Too quick to have read it: take your time"; it is still recorded, because it is still the student's answer.

### 5.4 Patient outcomes

Each patient leaves with an outcome drawn on the day sheet: **Delighted** (all correct), **Stable** (most correct),
**Referred** (a Refer or two), **Complication** (the `clear` or `tx` item missed). Outcomes are story and color only;
they feed a "patients helped" career counter, not item selection.

### 5.5 Protocols (the draft)

After each patient the player picks 1 of 3 **protocols** for the rest of the shift. Protocols are drawn as small
instrument tiles (a probe, a mirror, a stethoscope...). Hard rule for every protocol: **it may change stakes,
structure, resources or information about the player's own history, never information about the answer**. The
validator in `run/perks.js` rejects any protocol that reads an item's key before the answer is locked.

Families (release 1 has 12; Appendix C lists them):

- **Stakes:** Steady Hands (the first Sure-wrong per patient costs no Composure), Conviction (Sure-correct gives +1
  extra, Sure-wrong costs 1 extra), Hedge (Unsure-correct +1.5).
- **Structure:** Triage Nurse (3 choices per day-sheet row instead of 2), Extended Hours (+1 patient slot), Recall
  Desk (Recall patients give x2 Care), Open Door (a Walk-in after every Booked patient).
- **Recovery:** Second Look (re-ask a missed item later in the shift, unrecorded, to restore 1 Composure), Coffee
  (Break Room restores 2).
- **Information about you:** Loupes (before answering, show *your* last result on this item and when it was), Chart
  Review (after the shift, add every missed item's notes paragraph to a "read next" list), Mentor's Ear (mentor cues
  also on correct-but-Unsure answers).

Protocols unlock over the career (Section 7.4) so drafts stay fresh for months: about 12 at release 1, about 40 by the
full version, each tied to the wing that teaches it.

## 6. Bosses

Every shift ends with the **attending's case**: a longer case (4-6 items) of cognitive level 2-3 from the wing that
appeared most on the day sheet (or the player's focus wing). A boss is "beaten" at 60% or better; losing a boss costs
nothing but the boss's Care bonus. Each wing's boss has a **presentation gimmick that is itself an exam skill**; the
gimmick changes framing and visuals, never the items' difficulty or correctness.

| Wing (units) | Boss | Gimmick (presentation rule) | Exam skill it trains | Item constraints |
|---|---|---|---|---|
| Medical Floor (U16) | **Code Blue in Chair 4** | The emergency unfolds between items: the vitals monitor (drawn) changes with each beat; calm music drops to a heartbeat bass. No clock, no score for speed. | Recognize and manage emergencies; medically complex patients. | U16 case, >= 4 items, `clear` -> `dx` -> `tx` -> `fu`. |
| Pharmacy (U15) | **The Brown Bag** | The patient empties a bag of 8-10 medications into the box; the history is long and noisy. | Interactions, contraindications, finding the signal in a noisy box. | Box with >= 8 history lines; drug items with a `clear` or `tx` phase. |
| Oral Medicine (U5) | **The Great Imitator** | The lesion is seen at 3 visits; the image changes between them. | Differential diagnosis over time. | Case with >= 2 images. |
| Imaging (U6) | **Shadow Play** | Every item is an image read; each correct read "develops" the drawn radiograph a little more (visual only). | Radiographic interpretation. | `img` on every item; `spot` reads allowed. |
| Periodontics (U7) | **The Long Haul** | The same patient over five years of maintenance; the timeline at the top jumps forward between items. | Diagnosis, prognosis, maintenance, outcomes (CC37). | Case with `dx`, `plan`, `fu`, `prev`. |
| Endodontics (U8) | **Phantom Pain** | The pain "moves": test tables (percussion, palpation, cold, EPT) arrive one by one. | Pulpal and periapical diagnosis from tests. | Items with test tables. |
| Restorative (U9) | **The Failing Margin** | A restoration seen at placement, at recall and at failure. | Materials, caries management, failure analysis. | Case with `tx` and `fu`. |
| Prosthodontics (U10) | **The Rebuild** | A full plan where several items ask which step comes FIRST (single best answer, not ordering). | Sequencing and planning in single-best-answer form. | `plan` items. |
| Ortho and Pediatrics (U11, U12) | **Growth Spurt** | The same child at ages 7, 9 and 12; the portrait ages between items. | Growth, eruption, space management, behavior. | Case spanning ages. |
| Surgery and Anesthesia (U13, U14) | **The Third Molar** | Local anesthesia -> extraction -> post-op complication. | Anesthesia, surgery, complications. | `tx` and `fu` items. |
| Front Office (U17, U18, U19) | **The Audit** / **The Outbreak** | An inspector (infection control, records, consent) or an epidemiologist with a data table. | Ethics, law, infection control, biostatistics. | `prof` and U19 items with tables. |
| Foundations Lab (U1-U4) | **Grand Rounds** | Each item hides a basic-science step inside a clinical decision, as `inbde.md` 4.3 asks. | Integration of FK1-FK7 into clinical items. | Items with a primary FK1-FK7 inside a clinical case. |

**Weekly boss**: Board Day's last patient is the "Case of the Week", the same for the whole class (Section 9.1).
**Final boss**: the Licensure Gauntlet (Section 10).

## 7. Progression and economy (months to years)

### 7.1 The career

The career runs on the real calendar, not on play time, so a student who starts late is placed where the class is:

| Chapter | Real time (approx.) | What opens | Story frame |
|---|---|---|---|
| **D2: White Coat** | fall 2026 - spring 2027 | The wings whose units the hub has released; Half shifts; Board Day; first bosses. | You get the keys to a dark teaching clinic and one working chair. |
| **D3: Clinic Floor** | summer 2027 - spring 2028 | More wings as units land; Full shifts; Lab Bench preview; seasons; Grand Rounds raids. | The clinic fills; mentors hand you harder patients. |
| **D4: Senior** | spring - summer 2028 | Licensure Gauntlet stations open one by one; INBDE simulation blocks. | You start supervising the new D2s' cases (a new-content tag on recent items). |
| **Licensure** | ~Aug 2028 (shown as "~Aug 2028" until real dates exist) | Board Week (the final gauntlet); afterwards the clinic becomes a museum of the class's two years. | The ferry to the State Board. |

The chapter is set from a hub config date table (`CAREER` in `src/boards/game/data/career.js`), adjusted by Sam when
dates firm up; it never depends on the guessed exam date for archiving (DECISIONS.md).

### 7.2 Wings and readiness

The clinic has **eleven wings plus the Foundations Lab** in the basement (whose lights run up the stairs into every
wing, since basic science sits inside clinical items). Wings: Oral Medicine (U5), Imaging (U6), Periodontics (U7),
Endodontics (U8), Restorative (U9), Prosthodontics (U10), Ortho and Pediatrics (U11, U12), Surgery and Anesthesia
(U13, U14), Pharmacy (U15), Medical Floor (U16), Front Office (U17-U19); Foundations Lab: U1-U4.

**Readiness per unit** (0-100) is the one number the game shows for progress, and it can't be bought:

```
R_u = 100 * sum_i( w_i * c_i * r_i ) / sum_i( w_i )      over every open item i in unit u
  c_i = 1 if the latest recorded answer to i is correct, else 0 (unattempted = 0, so coverage is built in)
  r_i = exp( -days_since_last_correct_i / S_i )          memory strength; S_i = stability in days from the
                                                          item's SRS step (1,3,7,14,30,60,120 -> S = 2x step)
  w_i = 1 + d_i + 0.5*case_i + 0.5*img_i + 0.25*(cog_i - 1)
  d_i = class difficulty (1 - acc_i), shrunk as in 4.6
```

Bands give the wing its level and its lighting: **I Introduced** (>= 15), **II Practiced** (>= 35), **III Solid**
(>= 55), **IV Board-ready** (>= 70), **V Mastered** (>= 85). Board-ready additionally needs at least 30% of the unit's
case items and level 2-3 items answered correctly in the last 60 days, because hub mock scores ran above real exam
results. Readiness decays smoothly through `r_i` when a unit isn't reviewed: the wing's lights dim and a few chairs
gather dust covers, never more than one band per two weeks, and nothing earned is ever taken away (levels reached are
recorded as "best"; current readiness is shown beside it).

The hub's home view shows the same readiness bars per unit (the game owns the formula in a small shared function the
hub also calls), so a student who never plays sees their readiness too.

### 7.3 Economy

One soft currency, **Care**, earned only from scoring (5.3). Care is spent only on:

- **Clinic decor and cosmetics**: wall art, plants, lamps, operatory colors, a mascot statue of Timmy in the lobby,
  scrub colors for your avatar, day-sheet themes. All drawn in code.
- **Protocol unlocks** that are already earned by milestones can be *previewed* for Care (cosmetic flavor text);
  no protocol is buyable before its milestone.

Care is never spent on anything that changes which items appear, their difficulty, or readiness. There are no daily
Care caps, no streak multipliers on Care and no "double Care weekend" scarcity events; Care per item is the same at
item 1 and item 200 of a day (the server's own XP cap of 600/day still applies to XP). The decor prices are tuned so
a 10-minute shift buys something small about every third shift and a big piece about every month (Appendix B).

### 7.4 Unlocks and mentors

- Each wing has a **mentor**, a fictional faculty character (drawn as an abstract geometric portrait; no real faculty
  names or likenesses). The mentor speaks the item's authored `cue` on a miss and gives one short story line per wing
  level. Mentors never explain beyond the bank's explanation (no unreviewed facts).
- **Milestones unlock protocols**: e.g. 10 Perio patients Delighted unlocks *Loupes*; Endo level III unlocks
  *Second Look*; a beaten Code Blue unlocks *Steady Hands*. About 40 protocols over the career.
- **Wing level-ups** unlock that wing's boss variants, a wing-specific Board Day theme and one decor set.
- **Trophies**: a handful of site trophies (Section 15) and many game badges (`bd-*` kinds, shown in the game's own
  badge wall).

### 7.5 Seasons

Each semester is a **season** whose featured wings match the courses the class is taking (from the hub's unit release
plan). A season brings a palette accent for the clinic, two or three new protocols and boss variants, and a season
recap card (patients helped, readiness gained, the class census results). Seasons never expire anything: cosmetics
from a season stay owned; the season's Board Days stay replayable as practice.

## 8. Coming back: steady, spaced practice over 22 months

This is the problem the data set: use is exam-driven and stops the day after; nothing has yet brought anyone back to a
game. The design answers it with five mechanisms, each kept free of manipulation.

### 8.1 Today's shift is the Daily Drill

- Opening the hub (or the game) on a new day offers **Today's shift**: a Half shift whose items are today's drill set
  (`widget/drill.js`), dressed as recall patients, callbacks, referrals and new patients. Finishing it completes the
  drill (the drill sheet shows it done), and doing the drill in the sheet counts as today's shift (no double work).
- With long SRS steps (1/3/7/14/30/60/120) the daily due count stays small (typically 4-12 items for a steady
  player), so Today's shift fits in 8-12 minutes on a phone.
- The dashboard's hub card and the hub's quick-start row get one button: **Today's shift (N recall patients)**.

### 8.2 Weekly practice days, not a fragile daily streak

- The visible habit is **practice days this week** (goal: 4 of 7, adjustable 2-7), shown as seven small chairs that
  fill. Missing a day breaks nothing.
- A longer **weeks-kept** count (weeks with the goal met) is the only streak. It has forgiveness built in:
  one **rest week** is earned automatically every 4 kept weeks (max 3 banked), applied automatically when needed,
  and school breaks and the week after a course exam are auto-forgiven from the hub's calendar table.
- Coming back after an absence opens a **Welcome back** shift: short, due-focused, with no counts of what was missed,
  only "12 recall patients are waiting; here are the 6 most important."

### 8.3 Hooks that aren't manipulative

Allowed: a quiet morning line ("3 recall patients in Perio today"), the wing lights, mentor story lines at level-ups,
the class census, Board Day. Not used anywhere: loss-framed countdowns, expiring rewards, notifications (the site has
none and the game won't ask), streak-break shaming, randomized loot boxes, pay-to-skip, or comparing a student's
rank to named classmates without opt-in.

### 8.4 Spaced review surfaces as patients

A due item returns as a **recall patient** with the same generated face, name and chart as when it was first seen, so
returning to it feels like seeing a patient again ("Mr. Okafor is back for his 3-month recall"). This is the memory
palace effect working for the student: faces and stories make retrieval cues. A missed item returns next day as a
**callback**.

### 8.5 Course-exam waves, and the day after

- **Cram Clinic** (exam eve): from the hub's course calendar, the evening before a course exam that maps to units, the
  home offers a single-wing Full shift for those units with the most-missed and class-hard items first; the music
  calms down; no social prompts.
- **Keep it** (the day after): the home shows "You studied Pharmacology for Tuesday's exam. Keep it: 3 patients from
  it on day 3, day 7 and day 14", which is just the SRS schedule made visible. This is the direct answer to "use
  stops the day after the exam".
- **Readiness per unit**, not a countdown to a date two years out, is the long-range motivator (DECISIONS.md).

### 8.6 What we measure (from release 1)

Sections `arcade/chairside/<area>` for time; a `game_runs` row per shift (release 2) or local counters (release 1)
for: per-visitor game days, shifts started and finished, items answered in game vs bank, share of due items cleared,
median session minutes, Sure/Unsure/Refer mix. **North-star: share of players who play on a second day within 14
days** (past games: about 3 of 19-30). Release gates in Section 17 use these numbers.

## 9. Social layer (async first)

A class of about 120, spread across schedules: the social layer must work when nobody else is online and must never
show anyone another person's answer before they have answered.

### 9.1 Board Day (weekly seeded run)

- Opens Monday 06:00 Central, playable any time that week. Seed = ISO week + `'boards'`. Everyone gets the same day
  sheet: 3 patients + the **Case of the Week** (about 12 items, 12-15 minutes), chosen by the selector from units open
  to the class, weighted toward the units the class is studying this month and items the class finds hard.
- **One recorded attempt.** Answers record normally; the score posts once to `arcade_scores` as game id
  `bd-<yy>w<ww>` (e.g. `bd-27w05`) under the boards pattern whitelist (Section 15). Later replays are practice.
- Score = Care. Tie-breaks: calibration, then fewer Refers. Never time.
- **Ghosts.** After you finish each patient (never before), you see the class split for each item and up to three
  **ghosts**: classmates who played this week with scores near yours, plus the class median, drawn as small markers
  that walk the day sheet beside yours ("Gleaming Molar: 3 of 4, all Sure"). Names follow the site's existing rules
  (random class name unless a person set one); a Settings switch hides you from others' ghosts.
- A dashboard card shows "Board Day: 41 classmates played. Case of the Week: class 58%." and a weekly recap line.

### 9.2 Class census (co-op per unit)

- Each month the census targets the unit(s) of the course the class is taking: **"Cover the bank"** (every item in the
  unit answered by at least 5 classmates) and **"Class readiness"** (median readiness of active players in the unit
  reaches III). Both goals are pure practice: they push coverage of the bank and surface which items are hard.
- Progress bar in the wing and on the dashboard; on success the wing gets a shared decoration for everyone (a class
  plaque with the month) and the hub posts one line to its own home (not a site-wide notice, which needs Sam's OK).
- Data: an RPC `get_unit_census(p_hub, p_since)` aggregating `personal_answers` by unit (release 2).

### 9.3 Grand Rounds (optional live raid)

- Appears only when the hub's presence channel (`presence:boards`) shows 3 or more people online; any of them can
  open it; others see a small "Grand Rounds starting: join (60 s)" chip, never a modal.
- A shared 5-item case (a boss-tier case none of the joiners has seen recently). Each player answers privately and
  locks in; the reveal happens when all have locked in or after 90 s of the last lock-in (the timer only paces the
  reveal, it never scores). The reveal shows the group split and the explanation together.
- The case has a shared "complexity" bar that each correct answer wears down; the group wins at 60% correct overall.
  Everyone gets the same Grand Rounds badge; individual answers are recorded normally through `recordAnswer`.
- Messages go over the existing presence channel as small `raid` broadcasts (`{t:'raid', id, step, lock:true}`),
  carrying **lock-ins without choices** until the reveal; choices are computed locally and only the split counts are
  broadcast after the reveal. Works with 2 people too, labeled **Consult**.
- Stands down in mock sections, like the eggs.

### 9.4 What the social layer never does

No chat, no free text between students (moderation burden, public repo), no public per-person accuracy, no "X beat
you" pings, no showing a classmate's pick before you lock in.

## 10. Licensure Gauntlet (ADEX and the INBDE simulation)

Opens station by station in D4 (or earlier as previews once a station's items exist), and culminates in **Board
Week**, a five-day event in the final month before the exams.

| Station | What it is | Item source | Scoring |
|---|---|---|---|
| **INBDE simulation** | Timed blocks in exam format: standalone blocks (about 63 s per item) and case blocks (about 90-105 s per item), patient box beside the item, no zoom on images. Section `arcade/chairside/mock-inbde` so eggs, Timmy and the pet stand down; fires `sh:mock-done {correct,total}`. | Bank, all units, blueprint-weighted. | Correct count only. The clock is exam pacing, shown, not scored for points. |
| **Restorative bench** | Class II and Class III preparations: spot the deficient criterion, grade it, name the critical error. | `spot` items (4.5). | Care, no multiplier for speed. |
| **Endo station** | Access drawings (tooth 8, tooth 14), radiograph reads, test tables. | `spot` + case items. | Care. |
| **Fixed pros station** | Crown preps: margin position against the gingiva, margin form (bevel, J-margin), total taper (over 16 degrees is critically deficient), common path of insertion for the bridge abutments. | `spot` items. | Care. |
| **Perio station** | Charts and probing: read a drawn periodontal chart, classify, plan. | Case items. | Care. |
| **DLOSCE patients** | DLOSCE-style patients across its nine areas (restorative 24% ... prescriptions 5%), test tables and the prescription chain (4.5). | Case items tagged `exam:['adex']`. | Care. |

The Gauntlet's look changes: the State Board building across the bay at dawn, examiner tables, numbered typodont
stations. Passing a station at 70%+ lights its window; Board Week's final day is a full simulation plus one pass
through every station, with a class recap card.

## 11. Art direction (drawn in code, premium)

**Concept: "a clinic at blue hour".** Calm, warm and clinical-modern, like a well-lit architectural model of a dental
school at dusk: matte surfaces, soft shadows, small warm lights coming on as you learn. Everything is vector shapes,
gradients and light drawn in code; nothing is illustrated by hand-drawn assets, and nothing is AI-made.

### 11.1 Palette (tokens, light and dark)

Game tokens are defined on the game root and follow the site theme (`sh_theme`); the map itself always renders at
blue hour, and the item UI follows light/dark.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--cs-ink` | #14232B | #E9EEF0 | Text |
| `--cs-paper` | #F5F2EC (porcelain) | #0F1A20 | Item surface |
| `--cs-card` | #FFFDF8 (enamel) | #16242C | Cards, chart |
| `--cs-line` | #D9D3C7 | #2A3A43 | Hairlines |
| `--cs-night` | #0B1E2A -> #1D3A4C | same | Map sky gradient |
| `--cs-lamp` | #FFC56B | #FFC56B | Lit windows, Care |
| `--cs-good` | #0072B2 (blue) | #56B4E9 | Correct (with check icon + "Correct") |
| `--cs-bad` | #D55E00 (vermillion) | #E69F00 | Wrong (with cross icon + "Not quite") |
| `--cs-flow` | #009E73 -> #56B4E9 | same | Flow meter ramp |
| `--cs-calm` | #CC79A7 | #CC79A7 | Composure |

Correct/wrong use the Okabe-Ito blue/vermillion pair (safe for the common color-vision deficiencies) and are never
signaled by color alone. Each wing has one accent from a muted set (sage, terracotta, slate blue, ochre, plum,
teal...) used for its window light and boss intro.

### 11.2 Shapes, lighting, depth

- **The clinic map** is a 2.5D isometric cutaway (30-degree projection) of a three-floor building, drawn on Canvas 2D:
  extruded rounded boxes for rooms, chairs as three-part capsules, lamps as circles with radial-gradient glows. A
  window's light = the wing's readiness band (off, ember, warm, bright, bright with a soft bloom). Light spills onto
  the floor as a cached radial gradient composited with `globalCompositeOperation='lighter'`.
- **Soft shadows**: pre-rendered blurred ellipses (offscreen canvas, cached per size). Ambient occlusion faked with
  inner gradients at room corners.
- **Time of day**: the sky gradient moves from dusk to night across a shift; the map darkens slightly and lamps get
  warmer as you go, so a finished shift feels like "lights on".
- **Optional WebGL layer** (`gfx/bg-gl.js`, about 250 lines, one fragment shader): slow volumetric light shafts and
  bokeh behind the map, enabled only on capable devices and never under reduced motion; Canvas 2D gradient fallback.
- **Patient portraits** (`gfx/portraits.js`): generated from the case's age/sex fields and a seed as flat, friendly
  geometric busts (head shape, hair shape from 14 templates, skin tones from a 10-step range, glasses, clothes color),
  drawn in SVG so they are crisp at any size. A recall patient's seed is stored, so the same face returns. Portraits
  never show clinical signs (no fake pathology art); clinical images come only from the bank's vetted `img`.
- **Item UI** is HTML/CSS (for accessibility and the hub's card renderer), styled to the game tokens: a 12 px radius
  card on the paper surface, the chart as a tabbed "clipboard" with a clip drawn in SVG.

### 11.3 Motion

- Easing: entrances `cubic-bezier(.2,.8,.2,1)` 220 ms; exits `cubic-bezier(.4,0,1,1)` 140 ms; the Flow meter uses a
  critically damped spring (stiffness 220, damping 26); Care numbers count up over 400 ms with ease-out.
- Choreography per answer (all skippable, under 1.2 s total): option press (scale 0.98, 80 ms) -> verdict icon draws
  its stroke (180 ms) -> Care "ticks" fly to the HUD (300 ms) -> explanation slides up (220 ms).
- **Particles** (`gfx/particles.js`, pooled, max 120 live): on correct, a ring of 12 small blue "sparkle" quads
  expanding with drag; on Flow tier-up, warm motes rise from the chair; on wrong, nothing explodes: the card does a
  4 px horizontal settle and a soft desaturation pulse. Wins are celebrated; misses are calm.
- The render loop runs only while something animates (render on demand), pauses on `visibilitychange`, clamps dt to
  50 ms, caps device pixel ratio at 2.

### 11.4 Typography (OFL fonts already used by the site)

- **Instrument Serif** for display: wing names, boss titles, big numbers (Care, readiness).
- **Instrument Sans** for UI and item text (stems at 17 px phone / 18 px desktop, line-height 1.5; options 16/17 px).
- **IBM Plex Mono** for the chart's vitals and lab values, tooth numbers and the probe readout.
- Respect the widget's font and text-size settings (the size setting zooms `<html>`, so nothing is sized in vh/vw).

### 11.5 Grid

- Phone: 4-column grid, 16 px side gutters, 8 px base spacing; HUD 48 px high; bottom 90 px kept clear of game
  controls on both corners (Timmy bottom-left, widget launcher and phone bar bottom-right); touch targets >= 44 px.
- Desktop (>= 960 px): 12 columns; during a case the chart takes 5 columns on the left and the item 7 (exam layout);
  the map can sit as a 3-column rail.

## 12. Key screens (ASCII, phone first, 360-430 px wide)

**A. Clinic home** (`arcade/chairside/home`)

```
+--------------------------------------+
| <  Chairside            Care 1,240 * |
|--------------------------------------|
|        .  *     (blue-hour sky)      |
|   [Front Office]   [Pharmacy]#####   |   # = lit window (readiness)
|   [Endo]##   [Perio]####  [Imaging]  |
|   [Medical Floor]###   [Restor.]#    |
|   ~~~~ Foundations Lab (stairs) ~~~~ |
|--------------------------------------|
|  TODAY'S SHIFT                       |
|  6 recall patients · 2 new · ~10 min |
|  [        Start today's shift      ] |
|--------------------------------------|
|  This week  [x][x][ ][x][ ][ ][ ] 3/4|
|  Board Day: Case of the Week  [Play] |
|  Quick visit (1 patient)      [Go]   |
+--------------------------------------+
   (bottom 90 px kept clear)
```

**B. Day sheet** (`arcade/chairside/sheet`)

```
+--------------------------------------+
| Shift 2/4   Flow ==--  Calm (o)(o)( )|
|--------------------------------------|
|  09:30  choose your next patient     |
|  +-----------+  +-----------+        |
|  | BOOKED    |  | RECALL    |        |
|  | Pharmacy  |  | Perio x2  |        |
|  | 4 items   |  | Mr. Okafor|        |
|  | case      |  | is back   |        |
|  +-----------+  +-----------+        |
|  +-----------+                       |
|  | BREAK ROOM| re-read 1 miss, +1    |
|  +-----------+ composure             |
|  ...  12:30  ATTENDING: Brown Bag    |
+--------------------------------------+
```

**C. Patient visit, item** (`arcade/chairside/case`)

```
+--------------------------------------+
| Ms. R · visit 2 of 4   Flow x1.5     |
| [ Chart v ] F 62 · "My gums bleed.." |
|--------------------------------------|
| Which finding in the history should  |
| be addressed BEFORE scaling and root |
| planing?                             |
|                                      |
| ( A ) .............................. |
| ( B ) .............................. |
| (*C ) ..............................|   <- picked
| ( D ) .............................. |
|                                      |
| [   Lock in: Sure   ] [ Unsure ]     |
|                 Refer (I don't know) |
+--------------------------------------+
```

**D. After the answer**

```
+--------------------------------------+
|  (check) Correct        +4.5 Care    |
|--------------------------------------|
|  Explanation (from the bank) ......  |
|  ..................................  |
|  Class: 61% chose C. Most-picked     |
|  wrong answer: A (24%), because ...  |
|  [Report]           [Read in notes]  |
|--------------------------------------|
|  "Two weeks later she returns..."    |
|  [            Continue            ]  |
+--------------------------------------+
```

On a miss the header reads "(cross) Not quite: the answer is B", and a mentor portrait adds the item's cue
("Remember it: ...").

**E. Lab Bench** (`arcade/chairside/lab`)

```
+--------------------------------------+
| Lab Bench · Class II prep, tooth 30  |
|--------------------------------------|
|   occlusal view        1 mm |-|      |
|    ____________________              |
|   /  [A]   ____   [B]  \             |
|  |  ___  /    \  ___    |  [C]       |
|   \_____/  [D] \______ /             |
|   proximal section                   |
|     |   |__[E]__|   |   probe: 1.5 mm|
|--------------------------------------|
| Which labeled area, if any, would an |
| examiner grade as deficient?         |
| [A] [B] [C] [D] [E] [All acceptable] |
|        [ Sure ]  [ Unsure ]          |
+--------------------------------------+
```

**F. Shift summary**

```
+--------------------------------------+
|  Shift complete          Care +86    |
|  4 patients · 13 items · 10 correct  |
|  Sure: right 9 of 10 (90%)           |
|  Unsure: right 1 of 3                |
|  Perio readiness 48 -> 52 (II)       |
|  Read next: [Anticoagulants] [Furc.] |
|  [ Another shift ]  [ Back to hub ]  |
+--------------------------------------+
```

**G. Board Day results** (ghosts)

```
+--------------------------------------+
| Board Day 27w05 · Case of the Week   |
|  you    *-----*-----*-----*  71 Care |
|  ghost  o-----o-----o--o     68      |
|  ghost  o-----o--o--o-----o  74      |
|  class median ..............  55     |
|  Item 3: class 38% · you: correct    |
|  [ Class board ]   [ Replay (practice)]
+--------------------------------------+
```

Desktop: A and B become a two-pane view (map left, day sheet right); C puts the chart in a fixed left column (5/12)
and the item on the right (7/12), like the exam.

## 13. Audio

All sound is synthesized with WebAudio in `audio/synth.js` and `audio/music.js`; optional CC0 packs (e.g. a CC0 UI
click set, verified license file kept beside it) only for a few foley sounds. The AudioContext starts only after a
user gesture, follows the hub's mute setting (`api.sfxMuted()`), and has two sliders in the game's settings (effects,
music). **Defaults: effects on at low volume, music off** (people study in libraries); everything is optional and no
information is carried by sound alone.

### 13.1 Signal chain

`voices -> per-bus gain (sfx, music, ambience) -> master gain -> DynamicsCompressor (threshold -18 dB, ratio 3) ->
destination`. Music ducks by 6 dB for 400 ms under feedback sounds. Peak output kept around -6 dBFS.

### 13.2 Patches

| Event | Patch |
|---|---|
| Tap / select | Sine 1,200 Hz, 25 ms, exponential decay; pitch varies +/-3% so repeats don't fatigue. |
| Lock in | Two soft clicks (filtered noise bursts, bandpass 2.5 kHz, Q 4), like a clipboard. |
| Correct | FM bell: carrier sine, modulator ratio 3.5, index 2 decaying to 0 over 300 ms; two notes a major third apart; the pitch steps up a pentatonic scale with Flow tier. |
| Wrong | Low triangle "thud" at 110 Hz with a lowpass sweep 800 -> 200 Hz over 200 ms; gentle, never a buzzer. |
| Flow tier up | Rising 4-note arpeggio on a soft square through a lowpass (cutoff 2 kHz), with a short convolver room. |
| Composure lost | A single detuned sine pair beating slowly (2 Hz) for 500 ms. |
| Boss intro | Filtered saw pad swelling over 1.2 s (cutoff 300 -> 1,800 Hz), the wing's mode. |
| Window lights up | Glassy sine with a long (2 s) tail and a subtle shimmer (two sines 0.5 Hz apart). |

### 13.3 Adaptive music (`audio/music.js`)

A generative, tempo-free clinic bed at 70-84 BPM in the wing's mode (Perio Dorian, Endo Aeolian, Pharmacy Lydian,
Medical Floor Mixolydian, ...). Four layers fade in with state:

- Layer 0 (always, when music is on): ambience, pink noise through a lowpass at 400 Hz like ventilation, plus a slow
  two-chord pad (detuned saws, lowpass 900 Hz, 8 s attack).
- Layer 1 (Flow >= 1): a soft pulse (sine bass on beats 1 and 3).
- Layer 2 (Flow >= 2): plucked notes (Karplus-Strong) on a seeded pentatonic pattern.
- Layer 3 (Flow >= 3): light percussion (filtered noise ticks, swing 12%).

Bosses swap the pad for the boss patch and a slower heartbeat bass for Code Blue. Under reduced motion the music still
plays (it is not motion), but feedback sounds lose their pitch sweeps. Cram Clinic forces layers 0-1 only (calm).

## 14. Accessibility

- **Item content is always real DOM**, rendered by the hub's card code: headings, buttons, `aria-pressed` on the picked
  option, the verdict in a polite live region ("Correct. Plus 4.5 Care. Flow 3."). The canvas map is `aria-hidden`
  and mirrored by a plain list of wings with readiness ("Periodontics, readiness 52, level Practiced, 3 recall patients
  due"), which is also the keyboard map.
- **Patient box** is a `<section>` with the four exam headings as `<h3>`, readable in order by screen readers.
- **Images**: every image has authored alt text that describes what is needed to answer *without giving the answer
  away*; for radiograph reads where any description would be the answer, the item carries `a11yAlt: 'none'` and the
  game offers a different item of the same unit to screen-reader users. Lab Bench regions are focusable SVG elements
  with labels ("Region C, the isthmus") and the probe can be operated with arrow keys (0.5 mm steps) with a spoken
  readout.
- **Keyboard**: 1-5 or A-E pick an option; Enter = Lock in Sure; Shift+Enter = Unsure; R = Refer; C = toggle chart;
  N = open the notes (after answering); Space = continue; Esc = pause. Shortcuts ignore events from inputs. Focus moves
  to the stem on each new item and to the verdict after answering.
- **Reduced motion** (`prefers-reduced-motion` or the hub's setting): no particles, camera moves, WebGL layer or
  scale effects; crossfades of 120 ms only; the map is static.
- **Color**: Okabe-Ito pair for correct/wrong, always with icon + word; Flow and Composure carry numbers as well as
  bars; tested with a deuteranopia/protanopia/tritanopia simulation in CI screenshots (manual check per release).
- **Text**: honors the widget's size and font settings; no text in canvas except decorative labels that are mirrored
  in the DOM.
- **Time**: nothing in normal play is timed; the Gauntlet's INBDE simulation shows an exam clock that can be hidden
  or extended (x1.5, x2) in settings for students with accommodations, as the real exam can allow.
- **Haptics**: off by default; optional short `navigator.vibrate` on lock-in where supported.

## 15. Integration with the repo's widget

Everything below follows `architecture.md` sections 2, 7-9, 11 and 14; the game adds no new path for answers.

| Contract | How Chairside uses it |
|---|---|
| **Mode and entry** | The hub's game mode is `data-mode="arcade"` (visible label "Clinic"), so `tools/ci/smoke.js` enters it with its existing steps: the lobby (`#panel-arcade .ar-grid`) is rendered synchronously from inline metadata with one tile `button.ar-tile[data-game="chairside"]`; `[data-start]` injects `game/chairside-core.js?v=<hash>` and mounts on load; `[data-back]` calls `stop()`. The game root sets `data-ready="1"` when its first screen is up. Load failure shows a message and the rest of the hub keeps working. |
| **Adapter** | `window.BOARDS_GAME_API` (hub side, inline) as in `architecture.md` 14, extended with: `renderItem(el, qid, {lockIn:true})` -> `{picked(), submit(), destroy()}` (the hub's own card with Report button, class %, explanation and cue; with `lockIn` the card stages the pick and grades on `submit()`); `cases()`; `units()`; `srsDue()` (wraps `window.shSrsDue`); `drillToday()`; `classStats(ids)`; `readiness(unit)`; `presence()`. The game never touches hub internals otherwise. |
| **Answered event** | `submit()` -> hub `recordAnswer(qid, lec, correct, choice)` -> `boards:answered {qid, lec, correct, choice}`. The game listens for that event to read the verdict, so class stats, `question_choices`, SRS, XP, ranks, mastery, Weak Spots, Timmy's HP and the eggs see game answers exactly like bank answers. Refer passes `choice: null`. Unrecorded practice (replays, Second Look) never calls it. |
| **Spaced review** | The hub sets `window.SH_SRS = {steps:[1,3,7,14,30,60,120], examCap:false, v:'boards-1'}` (the opt-in ~10-line change in `widget/v3.js` described in `architecture.md` 8). The game reads due items; the widget updates SRS from the answered event. |
| **Daily Drill** | The hub defines `SH_DRILL` (pool, render, scope, `size: 12`). One opt-in addition to `widget/drill.js`: `window.shDrill = { today(hub) -> [qid], done(hub, qid) }`, so Today's shift serves the drill's frozen set and finishing either marks both. Drill items that aren't game-eligible stay in the drill sheet. |
| **XP, ranks, mastery** | Free (server XP from `personal_answers`). Nothing extra. |
| **Trophies and badges** | Three site trophies in `widget/ranks.js` `TROPHIES` (with About page rows): `cs-shift` (finish your first shift), `cs-codeblue` (beat Code Blue in Chair 4, secret, with a clue), `cs-boardweek` (finish Board Week). Game badges use the bounded kind pattern `cs-*` with `hub='boards'` and show only in the game's badge wall. |
| **Arcade scores** | `submit_arcade_score` once per run: `chairside` (best shift, Care x10 as an integer), `bd-<yy>w<ww>` (Board Day, first recorded attempt only), `gauntlet` (Board Week total). Leaderboards via `get_arcade_leaderboard`. Dashboard `ARCADES` gets a Chairside entry only once Board Day exists. |
| **Sections** | `window.SH_SECTION` reports `arcade/chairside/<area>` with areas `home`, `sheet`, `case`, `walkin`, `lab`, `boss`, `boardday`, `raid`, `summary`; the INBDE simulation reports `arcade/chairside/mock-inbde` (eggs, Timmy and the pet stand down; `sh:mock-done` fires). No other area starts with `mock`. |
| **Presence and raids** | Online count from `shEggHooks.online()`; raid messages on a separate realtime channel `chairside:boards` through `window.shSupabase` (so the eggs' `egg` broadcasts are untouched). |
| **Timmy and corners** | Controls stay out of the bottom-left 90 x 90 px and the bottom-right launcher area. In full screen the game sets `data-sh-fullscreen` on `<html>`; a 3-line addition to `widget/pet.js` hides the pet while it is set. |
| **Clicks** | Every control has a stable `id` or first `data-cs="..."` attribute (`lock-sure`, `lock-unsure`, `refer`, `slot-recall`...), so `ui_clicks` names them; no per-item ids in click targets. |
| **Service worker** | `sw.js` caches game files on first use (network-first); bump `VERSION` when the precache list changes; do not precache the game (most visits never open it). |
| **About page** | Same PR as each student-visible feature: a "Chairside" entry (how a shift works, Sure/Unsure, Board Day, Grand Rounds), the trophies (secret ones behind `spoil`), the settings (music, effects, ghosts), with "new" tags. |

**Migration v33** (release 1; applied through the Supabase connector, committed as `migration_v33.sql`, `supabase/schema.sql`
refreshed):

1. `submit_arcade_score`: keep v11's list, throttle and range, and add
   `or (p_hub = 'boards' and p_game ~ '^[a-z][a-z0-9-]{1,23}$')`.
2. `record_achievement` (replace whole, from v32): add `or (p_hub = 'boards' and p_kind ~ '^cs-[a-z0-9-]{1,30}$')`.
3. `game_saves (visitor_id text, hub text, slot text, data jsonb, updated_at timestamptz, primary key (visitor_id, hub,
   slot))` with `save_game(p_visitor, p_hub, p_slot, p_data)` (length cap 200,000 chars, one write per 5 s) and
   `load_game(p_visitor, p_hub, p_slot)`; add the table to `redeem_link_code` so "Link my devices" carries the career.
4. `get_question_stats_lite(p_hub)` returning `(question_id, attempts, correct)` for all rows (no 1,000-row cut), used by
   the selector, the drill and v3.js "toughest questions" for boards.

**Migration v34** (release 2): `game_runs (id, visitor_id, hub, game, seed, score, calib, splits jsonb, created_at)`,
`record_game_run`, `get_game_ghosts(p_hub, p_game, p_visitor, p_limit)` (scores near the caller's plus the median; no
choices), and `get_unit_census(p_hub, p_since)`.

## 16. Technical architecture

### 16.1 Files and bundles

Source in `src/boards/game/`, built by `tools/build-boards.js` (game step: concatenate classic scripts per bundle into
one IIFE that registers on `window.BoardsGame`, validate content data, hash for `?v=`) into `hubs/boards/game/`.
No ES modules (`architecture.md` 14, option 3), no dependencies.

| Bundle (loaded) | Modules | Est. lines |
|---|---|---|
| `chairside-core.js` (on Start) | `core/boot.js` mount/stop, adapter checks, loader for other bundles (250); `core/fsm.js` state machine (220); `core/loop.js` render-on-demand rAF, dt clamp, visibility pause (150); `core/rng.js` xmur3 + mulberry32, seeded streams (60); `core/store.js` save schema, migrations, autosave, server sync, merge (320); `core/bus.js` events (60); `sched/selector.js` pools, spacing, seeding (480); `sched/ability.js` Elo, difficulty shrinkage, readiness (260); `sched/cases.js` case assembly, beats, branches (200); `run/shift.js` day-sheet generation (380); `run/scoring.js` Care, Flow, Composure, skim guard, calibration (220); `run/perks.js` protocol defs, draft, validator (420); `run/bosses.js` boss rules and framing (380); `meta/career.js` chapters, wings, seasons, unlocks (340); `meta/habit.js` week goal, rest weeks, welcome back, keep-it plans (200); `meta/economy.js` decor catalog, prices (160); `ui/screens.js` home, sheet, summary, settings (650); `ui/visit.js` chart panel, item host, lock-in row, feedback (420); `ui/hud.js` (180); `ui/a11y.js` live region, keyboard map, focus (220); `gfx/canvas.js` layers, DPR, resize via ResizeObserver (160); `gfx/clinic.js` isometric map, lights, time of day (750); `gfx/portraits.js` (360); `gfx/particles.js` pooled (200); `gfx/tween.js` easings, springs (130); `data/content.js` mentors, beats library, protocol and boss text (600) | ~7,800 |
| `chairside-audio.js` (after first gesture, if sound on) | `audio/synth.js` (360), `audio/music.js` (420) | ~780 |
| `chairside-lab.js` (Lab Bench / Gauntlet) | `gfx/preps.js` parametric preparations, probe (850), `gfx/charts.js` perio chart, test tables, Rx pad (420), `run/gauntlet.js` stations, Board Week, simulation blocks (480) | ~1,750 |
| `chairside-social.js` (Board Day, raids) | `social/boardday.js` (260), `social/ghosts.js` (220), `social/raid.js` (420), `social/census.js` (160) | ~1,060 |
| `chairside-gl.js` (capable devices only) | `gfx/bg-gl.js` shader background with fallback (250) | ~250 |
| Build and tests | `tools/build-boards.js` game step + content validation (300); `tools/ci/game-tests.js` selector/scoring/readiness determinism tests in plain Node (450); spot-item generator `tools/boards-spot-gen.js` (350) | ~1,100 |
| **Total** | | **~12,700** |

Budgets: core bundle at most 110 KB gzipped; first interactive frame under 400 ms after load on a mid-range phone;
first item within 2 s of the Start tap; steady state 0% CPU when nothing animates; memory under 40 MB.

### 16.2 State machine (`core/fsm.js`)

```
BOOT -> HOME
HOME -> SHIFT_SETUP (today | half | full | quick | cram | boardday) -> SHEET
SHEET -> PATIENT_INTRO -> CHART -> ITEM -> LOCKED -> FEEDBACK
FEEDBACK -> ITEM            (next item in the visit; a beat may play first)
FEEDBACK -> OUTCOME -> DRAFT -> SHEET
SHEET -> BOSS_INTRO -> CHART -> ITEM ... -> BOSS_OUTCOME -> SUMMARY -> HOME
SHEET -> BREAK -> SHEET
HOME -> LAB | GAUNTLET (stations) | RAID_LOBBY -> RAID_ITEM -> RAID_REVEAL ... -> SUMMARY
any  -> PAUSED (visibility hidden, Esc) -> previous
any  -> RESUME (from save at boot, if a run is in progress)
```

Each state has `enter(ctx)`, `exit()`, `onEvent(e)` and a `section` string (for `SH_SECTION`). Transitions are pure
functions of `(state, event, save)` so the selector, scoring and transitions are unit-tested in Node without a DOM.
Every transition that changes the run writes the save (debounced 300 ms, flushed on `pagehide`).

### 16.3 Rendering

- Two layers: a `<canvas>` backdrop (map, lights, particles, portraits are SVG overlays) and the DOM UI (items,
  chart, HUD, menus). Only the canvas has a loop; it runs while tweens or particles are alive or the map is panned,
  then stops.
- Canvas sized from its container with `ResizeObserver` (never `vh/vw`), `devicePixelRatio` capped at 2; static map
  layers cached in offscreen canvases and recomposed only when readiness or time of day changes.
- The item host is a plain container in which `api.renderItem` draws the hub's card; the game styles it through
  tokens only.

### 16.4 Persistence

- Local: `localStorage['boards-game-v1']` (JSON, schema version `v`, migrations in `core/store.js`), wrapped in
  try/catch; the game runs (without saving) if storage is unavailable.
- Server: `save_game` every 10 s while changed and on `pagehide` (fetch keepalive), `load_game` at boot. Merge rule:
  monotonic counters take the max, sets union, the run in progress takes the newest `updatedAt`, spent Care is
  merged by event log ids so Care can't be double-spent across devices.
- The game stores no item content and no answers; answers live in the existing tables via `recordAnswer`. Readiness is
  recomputed from the hub's `STATE.answered` and SRS map, so it is always consistent with the bank.

### 16.5 Data contracts with the bank

Summarized here; field-level detail in Appendix A. The game requires per item: `id`, `lec` (unit id), `q`,
`choices` (3-5), `a`, `exp`, `cue` (optional), `img` (optional), `pbox` (optional, for standalones), `case`
(case id, optional), `phase`, `cog` (1-3), `fk`, `cc`, `exam` (`['inbde']`, `['adex']` or both), `fmt`, `added`
(date), `ov` (outline version), and for `spot` items `draw` (drawings) or `img` (images) plus `regions`. Case objects live in `CASES` (inline, exported
via `SH_EXPORT.cases` for the review page). The build fails if a case references a missing item, if a case's items
are not all game-eligible, or if a `spot` item has a region count outside 3-6 or no key.

### 16.6 Testing

- `tools/ci/game-tests.js` (runs in CI): seeded selector produces identical shifts for identical inputs; no item twice
  per shift; due items always present; Board Day seed stable across devices; scoring EV for random guessing <= 0 for
  3, 4 and 5 options at every Flow tier (the proof in 5.3 as a test); readiness formula fixtures; save migrations.
- `smoke.js` enters the arcade, clicks Start, waits for `data-ready`, answers one item by keyboard, opens the chart,
  and leaves; `pageerror` covers runtime errors in the game files. `syntax.js` globs `hubs/*/game/*.js`.

## 17. Release 1 vertical slice vs the full version

### 17.1 Release 1 (ships with or soon after the hub's first units, D2 spring 2027)

Goal: prove the one thing past games never did, **a second day**, with the smallest complete slice.

In:

- Home with the clinic map (only the wings whose units are released are built; the rest are dark shells with "opens
  with Unit N"), Today's shift, Quick visit, Half shift, Full shift.
- Booked patients from at least 20 authored case sets, walk-ins, recall patients, callbacks, referrals.
- The chart panel in exam layout, image items with the viewer, radiograph reads (`spot` on images).
- Sure / Unsure / Refer scoring, Flow, Composure, skim guard, calibration summary.
- 12 protocols (Appendix C), 3 bosses (the released wings'), patient outcomes.
- Readiness per unit (shared with the hub home), wing lights, weekly practice days with rest weeks, Welcome back,
  Keep it plans after course exams, Cram Clinic.
- Generated portraits, the blue-hour map (Canvas 2D only), particles, motion; effects synth (music: layer 0-1 only).
- Full accessibility (Section 14).
- Widget integration (Section 15): adapter, `SH_SRS`, `shDrill` hook, `chairside` score, 3 trophies, sections, pet
  hide, About entries; migration v33; CI tests.
- Instrumentation for Section 8.6.

Out of release 1: Board Day, ghosts, census, raids, Lab Bench, Gauntlet, seasons, decor shop (Care banks from day one so
nothing is lost), WebGL layer, music layers 2-3.

Size: about 6,000 lines of the 12,700 (core bundle minus Gauntlet, social, GL), plus content (cases, beats, mentor
lines). Build order: selector + scoring + tests -> item host and chart -> shift flow -> map and art -> audio -> polish.

### 17.2 Gates and the road to the full version

Each release ships only if the previous one's numbers justify it (measured over the 4 weeks after launch, outside
exam eves):

| Release | When (approx.) | Adds | Gate to start it |
|---|---|---|---|
| R1 | D2 spring 2027 | The slice above | none |
| R2 | D2 late spring 2027 | Board Day, ghosts, class census, `game_runs` (v34), decor shop, music layers 2-3 | >= 25% of hub visitors open the game, and >= 30% of players play on a second day within 14 days |
| R3 | D3 fall 2027 | All released wings and bosses, seasons, protocols to ~30, Grand Rounds raids, WebGL layer | R2: >= 40 Board Day players per week on average |
| R4 | D3 spring 2028 | Lab Bench, Gauntlet stations, INBDE simulation blocks, protocols to ~40 | ADEX items written and reviewed; spot generator validated |
| R5 | summer 2028 | Board Week, the final recap, the museum after licensure | none |

If R1 misses its gate, the game stays as is (it is still the drill with a world), and effort goes back to notes and
the bank, which are 80% of the hub's value (LESSONS #1).

## 18. Risks and mitigations

| Risk | Why it matters | Mitigation |
|---|---|---|
| Nobody plays it (as with every past game) | Months of work for 2% of time. | The game is the Daily Drill, entered from the hub's main button; R1 is small; release gates in 17.2; the hub never depends on the game. |
| Not enough case sets | Booked patients are the heart of the visit. | The game works with standalones (walk-ins, recalls) from day one; a case template and per-unit case quota in the build; R1 needs only 20 cases. |
| Game answers corrupt class data | `question_stats` drive explanations, the drill and readiness. | One answer per encounter, the authored choice index, unrecorded practice clearly labeled, skim guard, no in-item hints. |
| Score exploits (Refer spam, Unsure everything, rapid replays) | Leaderboards feel unfair; data gets noisy. | Proper scoring rule (5.3, tested in CI); Refer scores 0; leaderboards require >= 8 recorded answers per run; one recorded Board Day attempt; 20 h repeat block. |
| Speed creeps in through social features | Rewards cramming habits the exam punishes. | No time in any score or tie-break; raids pace only the reveal. |
| Social comparison hurts weaker students | Drop-off and stress. | Ghosts near your own score, class median, opt-out; no public accuracy; no chat. |
| Factual drift in ADEX criteria and INBDE guidelines | ADEX changes yearly (DSE OSCE retired for the DLOSCE); INBDE updates guideline versions. | Every item carries its outline version; thresholds cited to `adex.md` rows; yearly re-check; ADEX stations ship late (R4) when the class is closest to that season's manual. |
| Losing a 22-month career to a cleared phone | SRS and saves are per device. | `game_saves` on the server (v33) and in Link my devices; a later server-side SRS table is noted for the hub. |
| Big bank breaks client queries | Supabase returns 1,000 rows by default. | `get_question_stats_lite` RPC in v33. |
| Performance and battery on old phones | Students study on phones. | Render on demand, DPR cap, cached layers, WebGL optional, bundle budgets, lazy bundles. |
| Accessibility regressions | Screen-reader users can't play a canvas game. | Items and chart are DOM from the hub's card; canvas is decorative and mirrored by lists; keyboard map tested in smoke. |
| Uncertain exam date | Countdown and archiving would be wrong. | Career runs on a `CAREER` date table; `exams: []` until real dates; readiness, not a countdown. |
| Image licensing | Public repo; no AI art allowed. | Only code-drawn diagrams and verified CC0/CC-BY images with attribution; license file per pack; lint for missing credits. |
| Many sessions edit the hub | Split sources get reverted. | All game code and content in `src/boards/game/`; built files are generated; DEPLOY_NOTES line per release. |
| Scope creep | 12,700 lines is a lot. | Bundles are independent; every release is useful alone; gates stop work that the data doesn't support. |

## Appendix A. Data contracts

**Item (bank, game-relevant fields)**

```js
{ id:'b-perio-0042', lec:'perio', type:'mcq', q:'Which finding ... BEFORE ...?', choices:['...','...','...','...'],
  a:2, exp:'... (names the favorite wrong answer)', cue:'Remember it: ...',
  case:'c-perio-007', phase:'clear', cog:2, fk:'FK8', cc:'CC8', exam:['inbde','adex'], fmt:'except'|undefined,
  img:'rad-pa-0012'|undefined, pbox:{...}|undefined, added:'2027-01-12', ov:'INBDE DoD 2018 / CG 2026-08' }
```

**Case**

```js
{ id:'c-perio-007', units:['perio','pharm'],
  box:{ patient:'Female, 62 years old', cc:'"My gums bleed when I brush." (3 months)',
        hx:['Atrial fibrillation','<generic> (<Brand>®)','Allergy: ...','Former smoker'],
        findings:['BP 138/86','Generalized bleeding on probing', '...'] },
  stim:['chart-perio-0007','rad-bw-0031'],
  items:['b-perio-0042','b-perio-0043','b-pharm-0110','b-perio-0044'],
  beats:{ 'b-perio-0044':{ text:'Two weeks later she returns ...', ifMissed:{ 'b-perio-0042':'...' } } },
  portrait:{ seed: 81723 } }
```

**Spot item (Lab Bench or radiograph read)**

```js
{ id:'b-adex-0007', lec:'restor', type:'spot', exam:['adex'], phase:'dx', cog:2,
  q:'Which labeled area, if any, would an examiner grade as deficient?',
  draw:{ kind:'class2-prep', tooth:30, view:['occlusal','proximal'],
         params:{ isthmusShare:0.55, marginalRidgeMm:1.4, pulpalMm:2.0, axialMm:1.5, gingivalClearMm:0.6, boxDiverge:0 } },
  regions:[ {id:'A', label:'Isthmus', path:'M...'}, {id:'B', label:'Marginal ridge', path:'...'}, ... ],
  choices:['A','B','C','D','All criteria acceptable'], a:0,
  exp:'Isthmus over half the intercuspal width is deficient (ADEX RP1) ...', src:'adex.md 4.3', ov:'ADEX CM 2026-27' }
```

**Adapter** (hub -> game): see Section 15. **Game -> hub**: `api.answer` is never called directly by the game for
recorded items; recording always happens in the hub card's `submit()`.

**Save** (`boards-game-v1`, also `game_saves.data`)

```js
{ v:1, updatedAt, care:{earned, spentLog:[{id, amt}]}, decor:{}, unlocks:{protocols:[], badges:[]},
  wings:{ perio:{best:3} }, theta:{ perio:0.42 }, faces:{ 'c-perio-007':81723 },
  habit:{ week:'2027-W05', days:['2027-02-01'], goal:4, weeksKept:6, restWeeks:1 },
  run:{ seed, mode:'today', sheet:[...], pos:3, patient:'c-perio-007', idx:2, care:41, flow:2, comp:2,
        protocols:['loupes'], seen:['b-perio-0042'], startedAt },
  boardday:{ '27w05':{ done:true, score:71 } }, settings:{ music:false, sfx:true, ghosts:true },
  stats:{ gameDays:[], shifts:{started:0, finished:0}, items:0, sure:[0,0], unsure:[0,0], refer:0 } }
```

**game_runs row** (v34): `{visitor_id, hub:'boards', game:'chairside'|'bd-27w05'|'gauntlet', seed, score, calib,
splits:[{patient:'c-...', n:4, correct:3, sure:3}], created_at}` (no item choices).

## Appendix B. Tuning tables

| Parameter | Value |
|---|---|
| Base Care (Sure / Unsure / Refer) | +3 / -3, +1 / -0.5, 0 |
| Flow multipliers (tiers 0-4) | x1, x1.5, x2, x2.5, x3 (on gains and losses) |
| Flow tier up | every 2 consecutive Sure-correct answers |
| Composure | 3 (max 4); Sure-wrong -1; Break Room +1 |
| Boss bonus | +15 Care x Flow if >= 60% correct |
| Skim guard | max(2 s, words / 15 per second) |
| Shift lengths | Quick 1 patient; Half 3 + boss; Full 5 + boss; Today = Half from drill set |
| Selector shares | due <= 50%, callbacks <= 20%, new >= 20%, referrals <= 15% |
| Target success | 0.70 (band 0.6-0.8; 60/25/15 in band / harder / easier) |
| Elo K | 0.4 -> 0.15 after 40 answers per unit |
| Difficulty prior by cognitive level | L1 0.75, L2 0.62, L3 0.50 accuracy |
| Repeat block | 20 h unless due |
| SRS steps (days) | 1, 3, 7, 14, 30, 60, 120 |
| Readiness bands | I 15, II 35, III 55, IV 70 (+30% case/L2-3 in last 60 days), V 85 |
| Readiness decay display | at most one band per 14 days |
| Weekly goal | 4 of 7 days (2-7 adjustable); rest week every 4 kept weeks, max 3 |
| Decor prices | small 150-300 Care (about every third shift), large 2,500-4,000 (about monthly at 4 shifts a week) |
| Board Day | Monday 06:00 Central; 3 patients + Case of the Week (~12 items); 1 recorded attempt |
| Grand Rounds | >= 3 online to offer (2 = Consult); join window 60 s; reveal 90 s after last lock-in; win at 60% |
| Leaderboard eligibility | >= 8 recorded answers in the run |

## Appendix C. Perk list (release 1 protocols)

| Protocol | Family | Effect | Unlock |
|---|---|---|---|
| Steady Hands | Stakes | First Sure-wrong per patient costs no Composure. | Start |
| Conviction | Stakes | Sure-correct +1; Sure-wrong -1 extra. | Start |
| Hedge | Stakes | Unsure-correct +1.5 instead of +1. | Start |
| Triage Nurse | Structure | 3 choices per day-sheet row. | Start |
| Extended Hours | Structure | +1 patient slot this shift. | Finish 3 shifts |
| Recall Desk | Structure | Recall patients give x2 Care. | Clear 25 due items |
| Open Door | Structure | A Walk-in follows every Booked patient. | 10 walk-ins Delighted |
| Second Look | Recovery | Re-ask one missed item later (unrecorded practice); correct restores 1 Composure. | Any wing level III |
| Coffee | Recovery | Break Room restores 2 Composure. | Use the Break Room 5 times |
| Loupes | Info about you | Before answering, see your own last result on this item and when. | 10 Perio patients Delighted |
| Chart Review | Info about you | Summary adds every missed item's notes paragraph to "Read next". | Start |
| Mentor's Ear | Info about you | Mentor cues also after Unsure-correct answers. | Beat any boss |

Validator rule (in `run/perks.js` and its test): a protocol's hooks receive the item's key only after `LOCKED`;
any protocol reading `a` earlier fails the build.
