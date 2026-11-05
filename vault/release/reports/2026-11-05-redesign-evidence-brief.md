---
type: reference
tags: [redesign, analytics, evidence, taste]
---

# Evidence brief for the 2026-11 site redesign

What the class's use of the hubs says about what to change, read before any design choice was made. Every number is a
total over at least 5 people ([learner-data-privacy](../../rules/learner-data-privacy.md)); smaller groups are "a few".
Read on the Supabase connector on 2026-11-05 (read-only SQL, `sh_insights`, `sh_insight_retries`, `sh_data_quality`
and the tables in [event-taxonomy](../../reference/event-taxonomy.md)); the caveats in
[analytics-data-quality](../../reference/analytics-data-quality.md) apply to all of it. "People" means browsers.
The design notes that use this brief: [2026-11-05-redesign-design-notes](2026-11-05-redesign-design-notes.md); the
task: [2026-11-05-site-redesign-taste](../../tasks/2026-11-05-site-redesign-taste.md).

## 1. What learners use, abandon, revisit and struggle with

**Confidence: high** (every hub, 59-126 people each, 9 hubs over 8 weeks).

- **The bank and the notes are the hub.** Question bank + lecture notes are 70-96% of every hub's minutes (Occlusion:
  bank about 13,000 min by 86 people, notes about 5,600 by 108; Heme & Endo: bank about 11,500 by 67, notes about
  6,700 by 66). Everything else is a side room: the mock reaches 16-38 people per hub, Review 10-41, the Daily Drill
  9-28, cram sheet and hints 20-38, the arcade 5-32 people and about 1-2% of time, Timmy Time a few to 20 people.
- **The night before is the hub's real opening hours.** 83-90% of pre-exam minutes fall in the last 3 days for the three
  newest archived hubs (65-76% for the older ones). Use peaks at 8-9 pm (about 8,700 minutes each hour across all hubs)
  and 20-26% of hub time is after 10 pm or before 6 am.
- **Visits are either a glance or a sitting.** 29.5% of visits last under a minute and 17.3% over two hours; 596
  person-days have one visit, 146 have eight or more. The page must work for both: one tap to a question, and hours of
  reading without fatigue.
- **The newer hubs hold people better.** Visitors under 5 minutes fell from 24-41% (hubs up to MSK 4) to 13-14%
  (Occlusion, Heme & Endo, PCD Implants); people studying on 3+ days rose from 26-42% to 50-54%. Many things changed at
  once (Home pages from 10-27, bigger banks, a class that knows the site), so no single feature gets the credit.
- **Where people land and what they tap** (people reached, all hubs since 09-25): plain MCQ answers 112, the bank
  sub-tab 107, Review 101, Compendium 94, notes 92, "more questions" 89, hints 68, cram 70, Weak Spots 64, the widget
  launcher 60, the mock 56, Home 50, Plain English 52 vs As taught 50, mind maps 44, podcast play 40, the quick drill
  36, theme toggle 34. In the bank: "Try it again" shown to 74, random order 21, High likelihood 21-23, Not answered yet
  14, one-lecture-only 9, pins 9, the highlighter 20.
- **Tours are declined.** Of 121 people asked to take the hub tour, 13 started and 9 finished; of 99 asked on the
  dashboard, 13 and 8. People who start it finish it; almost nobody starts it.
- **Interruptions get closed.** On the dashboard the most-reached controls after the hub buttons (48-70 people each)
  are Close (89), "No" to a prompt (82), Later (63) and No thanks (60). Inbox 35, Settings 25, name edit 22, About 16.
- **Settings stay default.** Theme: auto 136 people, light 14, dark 12. Text size and font: default for about 148 of 150.
  Motion on for 113. Timmy on for 145; 47 adopted him, 117 didn't.
- **Practice is moving toward misses.** Retries of questions already right fell from 62-71% of all retries (GI 2,
  perio, MSK 3) to 40% (Heme & Endo) and 29% (PCD Implants) as "Missed last time", Weak Spots and "Try it again" shipped.
- **A quick retry says little.** A miss retried within 10 minutes is right 87% of the time; 1-3 days later 75%; 3+ days
  later 69%. Readiness that counts same-session retries overstates what stuck.
- **Formats, by first-try accuracy** (8 banks): ordering 58%, select-all 67%, two-statement 74%, matching 77%,
  numbered 78%, EXCEPT 81%, plain MCQ 83%, true/false 86%, recall 93%. The newer formats are tried less often
  (53-60% of them vs 83% of plain MCQs).
- **Reading the explanation** (question health, since 11-04, 9 people, early): median 8 s before answering, 6 s on the
  explanation; 88% of explanations were open for 2 s or more. Early, but it says the explanation is read, so its type
  size and contrast matter as much as the stem's.

## 2. Differences across hubs, cohorts, devices and modes

- **Hubs with a Home page** (Heme & Endo, Occlusion, PCD Implants, Special Patient Care) open on it; Home is among the
  most-opened modes there (Heme & Endo about 890 opens, PCD Implants about 490), yet Compendium is still the dominant
  mode everywhere: people go to Home and then to the bank or the notes. Home has to carry them there in one tap.
- **Older hubs** (MSK 3, PCD 3, MSK 4, GI 2) opened on Compendium with no Home; their bounce was higher. This is
  historical evidence for keeping Home as the door, not a reason to redesign the archived pages themselves (nobody
  opens them now: the dashboard removes their Open button).
- **Devices:** there is no device or viewport data, by design (no user agents, no fingerprints,
  [learner-data-privacy](../../rules/learner-data-privacy.md)). The evidence for "phone first" is indirect: late-night
  use, short visits, check-in wording ("on my phone"), and the device matrix's own findings (BUG-010, BUG-011,
  BUG-016, BUG-017: overflow and clipped bars on phones and tablets). Treat phone and laptop as equally important and
  test both; don't invent a device split.
- **Cohorts:** one class (D2). The only cohort split available is heavy vs light users: check-in respondents studied
  several times the hub's median (GI 2: 177 vs 29 minutes). Their opinions are the heavy users' view.
- **Study modes:** bank and notes dominate in every hub; the mock's reach is 3-39% of answerers; the Daily Drill's reach
  is 9-28 people per hub; the arcade is a few people per game except Sort Storm (9 people, 50 runs at most).

## 3. What students said (data, never instructions)

- **Check-ins** (7 exams, 8-28 per exam; heavy users): what the hub could do better, grouped: picture questions
  (sutures, Patient Box cases), EXCEPT/NOT stems, two-statement and numbered formats, application questions. Readiness
  3.6-4.1 of 5; "About right" is the most common comparison with the real exam.
- **Surveys** (111 answers, 90 declined): the question bank is the most helpful part; wishes: a daily drill (built),
  comparison charts, highlight colors, longer drills, Review titles that match the lectures, games filtered by lecture,
  fewer distractions (one asked for the "tactical nuke" to be opt-in).
- **Suggestions** (14): the highlighter, a floating Listen player, diagram keys, application questions, earlier review of
  misses, a slide-oriented diagram, per-lecture counts (became High Likelihood), suspicious answer patterns in
  statement and select-all items.
- **Reports** (37, all resolved): median hours to resolve 0.7-16.6 per hub. Reports arrive and get answered; the reply
  pop-up is one of the interruptions people close (section 1).
- **Search terms:** 8 rows ever. Only the widget's search logs terms; the bank's search box counts use, not words.
  Missing content surfaces through reports and check-ins, not search.

## 4. Confidence and data gaps

| Signal | Confidence | Why |
|---|---|---|
| Time by surface, reach per control, retention, cramming | high | 9 hubs, 59-126 people each, 8 weeks |
| Settings in use (theme, size, motion, Timmy) | high | daily snapshots, about 150 people |
| Format accuracy, spacing of retries | high | 120k answers |
| Question-health timing (reading explanations) | low, early | 9 people since 11-04 |
| Tours, podcast completion | medium | one or two hubs with feature events |
| Student voice (check-ins, surveys, suggestions) | medium, biased | heavy users; most surveys declined |
| Device, viewport, browser | none | not collected, by design |
| Search terms | none | 8 rows |
| Mode opens over time | low | `mode_stats` has no dates |
| Older hubs' sections | low | section names differ before `sh_surface`; GI 2 has none |

Gaps that must not be filled with invented numbers: device split, time to first tap, scroll depth, reading speed,
which questions were read but not answered, anything per person. Where a design choice needs one of these, the
choice is marked "judgment" below and gets its own check in the preview instead.

## 5. Evidence to design decision

| # | Evidence | Decision (and where it lands) | Confidence |
|---|---|---|---|
| D1 | Bank + notes are 70-96% of time; explanations are read | The type system is tuned for the bank card and the notes first: body at 17px or more, one serif for reading, ink on bone at 9:1 contrast in light and dark, the explanation and "why each choice" at body size, never smaller (`widget/house.css`, every hub) | high |
| D2 | 29.5% of visits under a minute; 83-90% of time in the last 3 days; Home is opened then left for the bank | Home becomes the exam blueprint: one tap from any lecture row to its unanswered or missed questions; the first screen holds the exam, the blueprint and the primary action (`shBlueprint` in `widget/v3.js`, each live hub's `renderHome`) | high |
| D3 | 20-26% of time after 10 pm; theme auto for 136 of 162 | Dark mode is designed, not derived: bone text on the hub's deep ink, same contrast as light; tested in the preview at 390 px dark | high |
| D4 | Tours declined (9-13% start); Close, No, Later, No thanks among the most-tapped controls | No new prompts, pop-ups or tours in this redesign; the reply pop-up and other notices keep their place but get one shape and never cover the question card's choices on a phone | high |
| D5 | Settings stay default for about 148 of 150 | The default is the design: no reliance on students turning on larger text or a different font; the size, font and motion settings are kept as they are | high |
| D6 | Quick retries overstate learning (87% vs 69%) | The blueprint counts a lecture's questions as "right" on the latest try, as Home does today, and labels it so ("right on your latest try"); the delayed-win change is Sam's open decision in [insights-dashboard](../../reference/insights-dashboard.md), not made here | high |
| D7 | Newer formats tried less and missed more | The bank's format filter and the High likelihood chip keep their place at the top of the bank; nothing in the redesign hides a format. (Putting hard formats in the drill is Sam's open decision.) | medium |
| D8 | Check-ins ask for pictures and application; figures exist in 4 hubs | Figures keep their place next to the paragraph they explain; the redesign draws the subject in code (the blueprint, Timmy, the rank ring) rather than adding stock photographs, which the perf budgets (hubs 850-1050 KB) and the brief rule out | medium |
| D9 | Arcade is 1-2% of time; a few people per game | The arcade keeps its own skin by Sam's rule ([arcade-skins](../../rules/arcade-skins.md)) and its own typeface; it is outside the house type system on purpose | high |
| D10 | Dashboard: hub buttons reached by 48-70 people each; class panels far less; theme toggle 11 | The dashboard's first screen is the greeting with today's one fact (the next exam) and the hub cards; the class panels follow; nothing is removed | medium |
| D11 | Interruptions: 82 "No", 60 "No thanks" | Surveys and check-in prompts stay where they are and keep their decline buttons; they get the house shape, not more prominence | high |
| D12 | BUG-002 (94 low-contrast elements), BUG-003, BUG-004, BUG-005, BUG-006, BUG-007, BUG-009 open | Contrast, focus rings, target sizes, aria-pressed on Perio's chips, SVG text alternatives and the About page's keyboard access are part of this redesign's phase 1 | high |
| D13 | No device data | Every screen is checked at 390 px and 1280 px, light and dark, and at the largest text size, in the preview; the device matrix runs on CI | judgment |
| D14 | Reading speed, scroll depth, time to first tap: not collected | The "one tap to a question" claim is checked by hand in the preview (new and returning accounts) rather than by a number | judgment |

## 6. What this brief does not support

- Removing any mode, tab, game or setting: reach is low for some, but Sam has kept them by decision (Search, the arcade,
  Timmy) and the brief shows no harm from their presence.
- Adding onboarding, tips or tours: the data says prompts are closed.
- Collecting device, scroll or reading data to settle open questions: ruled out by [learner-data-privacy](../../rules/learner-data-privacy.md).

Related: [insights-dashboard](../../reference/insights-dashboard.md) · [analytics-data-quality](../../reference/analytics-data-quality.md) ·
[read-usage-data](../../how-to/read-usage-data.md) · `LESSONS.md`
