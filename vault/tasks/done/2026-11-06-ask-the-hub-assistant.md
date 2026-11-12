---
type: task
status: dropped
hub: site
created: 2026-11-06
requested-by: Sam
due: 
waiting-on: 
agent: 
pr: 
---

# Ask the Hub: a study assistant grounded in the hub's own notes

## Goal

Sam's idea (2026-11-06, workshopped in chat): an "Ask the Hub" assistant answers a student's question ("How do staging and
grading differ?") from the hub's approved material only, links each point back to the lesson, and says plainly when the
material doesn't cover it. It never sees the question bank, raw course documents, survey answers, other students' data or
admin information. The AI provider is called from the server, so no key is in the public site, with rate limits and
privacy controls. This note is the workshop and the proposed plan; nothing is built yet.

## Context

- The redesign plan: [the audit and plan](2026-11-05-redesign-audit-and-plan.md) (section 4.10 lists this note),
  [phase 1](2026-11-05-redesign-phase-1-hub-engine.md) (the content JSON and the Notes toolbar).
- Rules that matter most here: [secrets](../../rules/secrets.md), [learner-data-privacy](../../rules/learner-data-privacy.md),
  [graded-coursework](../../rules/graded-coursework.md), [preview-and-release-test](../../rules/preview-and-release-test.md),
  [about-page](../../rules/about-page.md).

## What the data says (the [audit](2026-11-05-redesign-audit-and-plan.md), section 1)

- Students ask for **content and formats, not features**: check-ins asked for pictures and cases (17) and exam wording (12);
  in survey 2 a guided tutorial got No 6, Yes 3. The look-it-up features get little use: bank search 2 people, "Find this
  in the notes" opened 16 times in 940 offers.
- The use case is the exam-eve phone session (median visit 12 minutes, 8-10 pm). A one-paragraph answer with a link into
  the notes fits it, if students try it. Nothing in the data shows they will, and this is the only idea with a running
  cost, so it starts as a pilot on one hub.

## The design

- **No search index.** A hub's notes, review tables, hints and cram sheet are about 40,000-80,000 tokens, small enough to
  give the model whole in a cached prompt. Each paragraph carries its address (`lec` and paragraph `k`, the form
  `SH_GOTO` already takes: `{ v:'notes', lec, k }`), so every point can link back. The source is the content JSON from
  phase 1: nothing new to keep up to date.
- **What it reads**: the notes (both levels), the review tables, the exam hints, the cram sheet, the High likelihood topics.
  **Never**: the question bank, its keys, whys or the mock (so it can't become an answer key), anything from `review/`, any
  table with per-person rows, surveys, reports, suggestions, check-ins, lecture files.
- **Answers it can prove.** The model returns structured output: short paragraphs, each with the paragraph ids it used and
  a word-for-word quote from each. The server checks every quote is really in the paragraph it cites; a point whose quote
  doesn't match is dropped, and when nothing is left the answer is "The notes don't cover that," with the closest lecture.
  The student sees the answer, "From the notes" links that jump to the paragraph, and a thumbs up or down.
- **One Supabase Edge Function** (`ask-hub`) holds the provider key as a secret. Sam creates the key and saves it in the
  Supabase dashboard, never in chat or the repo. The function takes `{ hub, question }`, loads the hub's content, calls the
  model, checks the quotes and returns the answer.
- **The model and the cost** (Anthropic's list prices as of 2026-10; check them before building): the default is Claude Opus
  5.5, about 3 cents a question with the notes cached, roughly $25-50 for 1,000 questions with the cache writes. Claude
  Sonnet 5.5 is about 2 cents a question and Claude Haiku 5.5 about a tenth of a cent. Which one is Sam's call, after the
  same test questions run on all three in the preview. The API's server-side refusal fallback is on.
- **Limits**: 20 questions per person per day (visitor ids are easy to reset, so this is a courtesy), a site-wide daily cap
  in the database (for example 1,000), and a monthly spending limit in the provider's console, the real backstop. At a
  limit: "Ask the Hub is resting until tomorrow," with the notes one tap away. No IP addresses.
- **Privacy**: the question goes to the AI provider to be answered, and the About page's "What the hubs record" says so in
  plain words. By default nothing typed is stored: only counts per hub and day, the "not covered" rate and the thumbs.
  Keeping the question text (trimmed, with no id, like `search_terms`) to learn what students ask is Sam's call; if yes,
  it gets its rows in [event-taxonomy](../../reference/event-taxonomy.md) and [analytics-retention](../../reference/analytics-retention.md).
- **Graded quizzes**: the syllabus allows no AI on an open quiz. Proposed: Ask the Hub switches itself off on a hub while
  one of its graded quizzes is open. That needs each quiz's open and close times in `COURSE_DATES` (today an entry has one
  date and no times). It's also off during the mock and once the hub is archived.
- **Where students find it**: the Notes toolbar ("Ask") and More. Not on a question card before it's answered.
- **Tests**: a fixed set of about 40 questions per pilot hub (covered by the notes, not covered, half covered, attempts to
  get bank answers, attempts to make it ignore its rules), run in the preview with each model, plus the release suites. No
  production data in the preview.

## Where it goes

After the redesign's release, as its own track: it needs the content JSON and the new Notes toolbar, and it shouldn't hold
the release up. A pilot on one hub for one exam; then Sam decides from the numbers (people who asked, asks per person, the
"not covered" rate, thumbs, cost).

## Decisions for Sam

1. Build the pilot after the release (recommended), start it now on today's hubs, or not at all?
2. Switch it off while a graded quiz is open (and add quiz windows to `COURSE_DATES`)?
3. Keep the question text, with no id, to learn what students ask, or only the counts?
4. The model, after the side-by-side test in the preview (Opus 5.5 by default)?

## Done when

- [ ] Sam's calls are in [decisions](../../decisions.md) and this note
- [ ] The key saved by Sam in Supabase; the `ask-hub` function deployed with its limits and the spending limit set
- [ ] The test set passes in the preview: every answer's quotes check out, "not covered" when it should be, no bank answers
- [ ] The About page's entry and "What the hubs record" updated; event taxonomy and retention rows
- [ ] CI and the release suites pass; Sam's look on the preview
- [ ] After the pilot exam: the numbers in this note, and Sam's call to keep, change or drop it

## Log

- 2026-11-06: workshop of Sam's idea; waiting on Sam's calls.
- 2026-11-06: Sam, in chat: "i think we ditch the ask the hub idea". Dropped.
- 2026-11-12: Sam brought it back as part of the redesign, in Timmy's voice: [Ask Timmy](../2026-11-12-redesign-ask-timmy.md).
  The design below is its starting point; where the two differ, that note wins.

## Outcome

**Dropped** (Sam, 2026-11-06, [decisions](../../decisions.md)): not built, now or after the redesign. The design above
stays here in case it comes back; don't propose it again unless Sam asks.

Related: [secrets](../../rules/secrets.md) · [learner-data-privacy](../../rules/learner-data-privacy.md) ·
[graded-coursework](../../rules/graded-coursework.md) · [the audit and plan](2026-11-05-redesign-audit-and-plan.md)
