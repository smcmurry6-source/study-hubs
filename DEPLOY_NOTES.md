# Deploy Notes — read this before touching the repo

This repo is edited from several different Claude Projects (one per hub, plus a
"hub index" / overarching project for cross-hub UI and shared functionality).
Those Projects don't share context with each other or with plain Claude Code
sessions — a session in one Project has no idea what a session in another
Project just changed. **This file is the one place every session, regardless
of which Project spawned it, can check.** Update it whenever you make a
non-trivial change, and read it before you deploy.

## The core rule: GitHub is the source of truth

Never trust a locally-cached or previously-read copy of a hub file across
sessions. Before editing or publishing anything in `hubs/*/index.html` or
`widget/`:

1. Fetch the file fresh from `main` (raw GitHub content, not a cached Read/Artifact
   snapshot from an earlier turn) and diff it against whatever you were about to
   publish over it.
2. If it changed since your working copy's common ancestor, don't blind-overwrite.
   Do a real three-way merge (`git merge-file -p <mine> <ancestor> <theirs>`),
   then check the result for conflict markers with a line-anchored pattern
   (`^<<<<<<<`, `^=======$`, `^>>>>>>>`) — this file's own CSS uses long `====`
   dividers as comments, which false-positive on a naive substring search.
3. After merging, verify before publishing: `node --check` on the extracted
   `<script>` block, structural counts (question/lecture/drug counts match what
   you expect), a duplicate-id check, a check that the feature you were adding
   is actually present, and ideally a live smoke test (Playwright or the browser
   pane) before it goes out.
4. Check the entries below **and** the site's own changelog (Supabase
   `changelog` table, shown on the dashboard) for anything recent before you
   deploy — if someone else's change isn't reflected in your working copy yet,
   that's your signal to go back to step 1.

## Shared infrastructure (touch once, not per-hub)

- **`widget/v3.js` + `widget/v3.css`** — loaded by every hub (`fixed-pros`,
  `genetics`, `gi-exam1`, `hepatobiliary`, `perio`) via
  `<script src="../../widget/v3.js" data-hub="<hub-id>" data-answered-event="<hub>:answered" data-default-mode="...">`.
  Cross-hub functionality (search, class-wide correctness, streaks, activity
  pulse, leaderboard, analytics) belongs here — never hand-patched into one
  hub's own `index.html`. Each hub publishes `window.SH_EXPORT =
  {lectures, questions}` after its own IIFE closes, which is what the widget
  reads for search and "toughest questions" — if you add a hub or change its
  question shape, make sure `SH_EXPORT` still reflects it.
- **Supabase project `thytmzsgymydbzcqdnix`** backs the widget: changelog,
  leaderboard, study streaks, activity pulse, and visitor analytics (see
  `migration_v4.sql`/`v5.sql`/`v6.sql` at repo root for schema history — run
  new migrations once each, by hand, in the Supabase SQL editor). The API key
  and the `log_changelog`/admin RPC secret live only in local ops scripts on
  Sam's machine (`deploy_rollout.ps1`, `check_leaderboard.ps1`) — **never**
  commit them here or hardcode them into a hub's client-side JS.
- **GitHub Pages deploy** — `github.com/smcmurry6-source/study-hubs`, branch
  `main`, served at `smcmurry6-source.github.io/study-hubs/`. Deploy via the
  GitHub Git Data API (blob → tree → commit → ref update); a GitHub PAT is
  needed for this and should only ever be used transiently (env var for one
  script run), never written into a committed file.

## Recent major changes (newest first — add a line when you ship something)

- **2026-09-16** — Added data-driven lecture mind maps: a new shared
  `window.shMindMap.render()` renderer in `widget/v3.js` (generic
  hierarchical tree layout, inline SVG, horizontally scrollable) plus a
  `MINDMAPS` data object per hub (10 hepatobiliary lectures, 9 perio
  sessions, content grounded in each hub's own lecture notes/reading
  text). A "Show mind map" toggle now appears under the lecture-notes
  reading pane in both hubs, following the same shared-renderer/
  hub-local-data pattern as `shGetClassStats`/`qCardHTML` — a future hub
  only needs its own `MINDMAPS` object, not new rendering code. Also
  fixed a spacing bug in the renderer itself: `layout()` was assigning
  leaf rows a fixed height while `nodeBoxHTML()` sized each box to its
  actual wrapped-line count, so any 2-3-line label produced a box taller
  than its row and visually spilled into the node below it. **Follow-up
  fix, same day:** the first deploy of this feature shipped
  `widget/v3.js` and both hub HTML files but forgot `widget/v3.css` —
  the mind maps went live as unstyled black SVG silhouettes (no fill/
  stroke/font rules) until a second deploy an hour later added the
  missing CSS file. Lesson: when a change touches both `widget/v3.js`
  and `widget/v3.css`, double-check FILES in `deploy_rollout.py`
  includes both before running it — it's easy to edit both files and
  only remember to list one.

- **2026-09-16** — Hub index: integrated the universal back button into each
  live hub's own sticky ribbon instead of a separate fixed bar above it
  (perio, hepatobiliary); removed a redundant duplicate background-music
  system inside Hepatobiliary's own Lounge panel; converted all 60
  originally free-recall questions in the archived GI Exam 1 question bank
  (question-banks/gi1-question-bank.json) to multiple-choice with curated
  distractors, so all 89 GI1 questions are now MCQ, and expanded
  Hepatobiliary Mock Exam's embedded EXAM1_REVIEW_POOL from a 27-question
  curated subset to the full 89.


- **2026-09-15** — Hepatobiliary: GI Pharmacology + Clinical Applications for
  Dentistry lecture transcripts mined into Lecture Notes/Exam Hints/Questions
  (now 10/10 lectures, 363 questions), reconciled via 3-way merge with a
  parallel session's Active Recall tab + `widget/v3.js` integration work,
  republished to the Claude Artifact and deployed to GitHub Pages.
- **2026-09-12** *(approx, from widget history)* — Active Recall flashcard
  mode added (hide-and-reveal cards pulled from Cram Sheet/reference content,
  deliberately excluding direct-quote Exam Hints cards since a raw quote makes
  a weak recall prompt); `widget/v3.js` v3 rollout across all 5 hubs.
- **2026-09-09** *(approx, from Supabase changelog)* — Study streaks, live
  class activity pulse, opt-in leaderboard, question flag/suggest-fix; search
  across every hub; class-wide correctness shown automatically; Listen
  (text-to-speech) button with word-by-word highlighting; mobile redesign.

This list is intentionally short — it's an orientation aid, not a full
changelog (that's the Supabase `changelog` table / dashboard "What's New"
box) or a per-hub history (that's each hub's own manifest doc, kept in its
Claude Project).

## Why this file exists

Sam runs one Claude Project per hub plus a separate "hub index" Project for
cross-hub/UI work. A change made in the index Project (e.g. adding the Active
Recall tab and the shared widget) can silently collide with a change made the
same week in a single hub's own Project (e.g. mining a new lecture transcript
into Hepatobiliary), because neither session has any way to know the other
ran. There's no mechanism to make Claude Projects "talk to each other" — the
fix is procedural: treat this repo as the single source of truth, always
re-pull before you push, and put anything cross-hub here or in `widget/`
instead of copy-pasted into individual hubs.
