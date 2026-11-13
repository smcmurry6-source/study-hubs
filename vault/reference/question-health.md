---
type: reference
tags: [questions, widget, supabase, admin]
---

# Question health

Every hub's questions are watched for likely quality problems (a wrong key, wording that trips up stronger students, a
question people give up on, an explanation nobody reads, what students say), and the suspects are listed for Sam on the
admin page (`review/`, the **Question health** view under *Study data*). Built 2026-11-04 at Sam's request. **Nothing in it changes, hides or
deletes a question**: a flag is a lead for a person to check against the hub's notes
([question-health-flags-are-leads](../rules/question-health-flags-are-leads.md)).

## The parts

- **Stable ids**: a question is `(hub, id)`, and its id never changes or gets reused
  ([question-ids-are-permanent](../rules/question-ids-are-permanent.md); the registry is `tools/question-ids/<hub>.txt`,
  checked by `tools/ci/smoke.js`).
- **Versions**: `shQH.version(q)` fingerprints what `window.SH_EXPORT` shows of a question (stem, choices, key,
  explanation; cyrb53 of its sorted fields minus `id`/`lec`). An edited question starts a new version, so its numbers
  start fresh instead of mixing old and new wording. Editing only a `QUESTION_WHY` line, which SH_EXPORT doesn't carry,
  keeps the version. `question_versions` keeps each version's type, choice count and key.
- **The tracker**, `widget/qhealth.js` (loaded by `widget/v3.js` for every hub, no hub code needed): it watches every
  `.qcard[data-qid]` and listens for the hub's answered event. Per answer it records which try it was for that person
  (from their synced history), whether their previous try was right and how long ago, the choice picked, the active time
  on the card before answering and on the explanation after, and taps inside the explanation. A card read for 3 s or
  more without an answer is a `view` (abandonment). Active time stops when the tab is hidden, the card leaves the
  reading line, or nobody has touched anything for two minutes. Rows go in batches to `record_qh` (`question_events`).
  The context (`bank`, `drill`, `mock`, ...) is stored too. Off for automated browsers and without Supabase.
- **"Good question?"**: under each explanation, once answered, a thumbs up / down; a thumbs down asks why (answer looks
  wrong, confusing wording, not in the notes, explanation didn't help, gives the answer away) and offers the Report form
  for anything else (`qh_vote`, `question_feedback`, one vote per person per question). Tracked as `qrate:up`,
  `qrate:down`, `qrate:undo`, `qrate:why=<reason>`. On the About page under the question bank. A redesign flashcard
  (`widget/study-modes.js`) isn't a `.qcard`, so it's never timed or counted as a view; its back asks for the vote alone
  with `shQH.rate(el, qid)`, and for "Find this in the notes" with `window.shNoteJump(el, qid)` (`widget/v3.js`).
- **Reports** (`question_flags`) are joined to their question through the "— question <id>" tag the widget writes.
- **The report**, `qh_report(hub, days, current)`: per question, its numbers and flags. The admin page calls it through
  `get_question_health` (admin secret), passing every live question's version, key, choice count and type worked out
  from the hub's SH_EXPORT. Sam's call on a question goes in `question_reviews` through `admin_review_question`:
  **Looks fine**, **Needs a fix** or **Fixed**, with a note. That is metadata only.
- Schema and functions: `migration_v51.sql` (applied 2026-11-04 through the connector as `v49_question_health` and three
  follow-ups; the file was renumbered twice as the analytics change took v49 and the admin page change v50 on `main`).

## The flags

Accuracy, the miskey check, retries and the top-vs-bottom check use the live version's first tries once 10 people have
answered it (8 for the choice and top/bottom checks). Until then they use every answer ever (`personal_answers`, the
synced history, all versions; picks from `question_choices`), but only while Sam hasn't made a call, and the admin page tags them "all answers
ever". Time, abandonment, the explanation and the thumbs exist from 2026-11-04, for the live version only.

| Flag | Severity | When |
|---|---|---|
| Below chance | high | multiple choice, first-try accuracy under 1 / number of choices |
| Very hard | medium | first-try accuracy under 40% |
| Possible miskey | high | one wrong choice picked more than the key and by 35% or more (8+ first tries, or 12+ picks ever) |
| Stronger students miss it more | high | the top half of the class (first-try accuracy over the hub, people with 20+ questions) 15+ points below the bottom half, z ≤ -1.65, 8+ people in each |
| Missed again | medium | of 6+ people who missed it, under half got it right on their next try |
| Reported | high | an open student report |
| Says the answer is wrong | high | 2+ thumbs down with that reason |
| Confusing / not in the notes | medium | 2+ thumbs down with that reason |
| Explanation didn't help / gives it away | low | 2+ thumbs down with that reason |
| Disliked | medium | 3+ thumbs down, half the votes or more, with no reason flag |
| Slow | low | median first try 45 s or more and twice the hub's median for that kind of question (8+ timed) |
| Often left unanswered | low | of 10+ people who read it 8 s or more, 30% never answered, and twice the hub's rate |
| Explanation skipped | low | of 10+ misses, 70% left the explanation within 3 s |
| Id not in the hub | low | class data under an id the hub no longer has (renamed or deleted) |

High counts 3, medium 2, low 1; the list is sorted by that score. States: **To review** (`new`: flagged and no call yet,
or a new flag since the call), **Needs a fix** (`todo`), **Changed** (`changed`: marked "Needs a fix" and the question
has since been edited, so check the fix), **Reviewed** (Looks fine or Fixed, on this version, covering every flag),
`clear` (no flags). A call covers the flags it was made on: a new kind of flag, or a new version, brings it back.

## Acting on a flag

1. Read the question against the hub's notes (and, for a report, the report itself in the Inbox). The numbers say where
   to look, never what's true: a hard question about a hard topic is a good question.
2. If it's right, mark **Looks fine** (a note says why). If it needs work, mark **Needs a fix**, then fix it in the
   hub's source in a PR like any content change: same id, every choice's why, the
   [graded-coursework](../rules/graded-coursework.md) and [text-and-audio-never-drift](../rules/text-and-audio-never-drift.md)
   rules. Then mark **Fixed**. Removing a question is Sam's call, and its id is then retired, not reused.
3. Agents read the same report with the Supabase connector (read-only SQL):
   `select qid, state, score, flags from qh_report('<hub>') where state in ('new', 'changed') order by score desc;`
   and bring Sam the list (the admin page's **Copy list** gives the same in plain text, with no report text and groups
   under 5 people written as "a few": [learner-data-privacy](../rules/learner-data-privacy.md)). The lessons refresh does this
   (`tools/lessons-refresh.md`).

Known gaps: "Link my devices" merges a person's answers but not their question-health rows, so a second device's first
try counts as a first try. Thumbs and timing need the live site (Supabase), not a `file://` copy.

Related: [question-ids-are-permanent](../rules/question-ids-are-permanent.md) ·
[question-health-flags-are-leads](../rules/question-health-flags-are-leads.md) ·
[read-usage-data](../how-to/read-usage-data.md) · [reply-to-reports](../how-to/reply-to-reports.md) ·
[shared-infrastructure](shared-infrastructure.md) · [release test report](../release/reports/2026-11-04-question-health.md)
