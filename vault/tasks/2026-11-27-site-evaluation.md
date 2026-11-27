---
type: task
status: blocked
hub: site
created: 2026-11-27
requested-by: Sam
due:
waiting-on: Sam picks which findings become work
agent: Claude Code
pr:
---

# The whole-site evaluation of 2026-11-27: what is weakest and what is missing

## Goal

Sam asked for "a comprehensive evaluation of the repo, the database, the hub website, its features, design,
functionality", and "what areas are weakest, missing". This note keeps the findings so they don't live only in that chat
([to-dos-go-in-the-vault](../rules/to-dos-go-in-the-vault.md)). Nothing here is decided: each box is a finding Sam can
turn into work, change or drop.

## Context

- How it was done: four read-only reviews (the widget's code, the schema and Ask Timmy's server from the repo, the
  tooling and process, Review of Systems' content and learning design), the live database's advisors, sizes, pg_cron runs
  and one day of edge logs (catalog reads only, at 9 am Central), the admin page's kept Insights (`admin_cache`), and
  screenshots of the dashboard, the hub and the About page from `node tools/preview/serve.js` on a 390 px phone and a
  1280 px laptop. Nothing was changed on the site or the database.
- **The security findings are not in this note** (the repo is public:
  [preview-and-release-test](../rules/preview-and-release-test.md)). Sam has them in the chat.
- Already on the list, so not repeated as boxes: the database's room and the Free plan
  ([sustainable-for-years](2026-11-22-sustainable-for-years.md)), the real-phone scroll check and "Delete my data"
  ([the inbox](inbox.md)).
- Numbers are totals from the admin page's Insights as worked out on 2026-11-26 and from `LESSONS.md`
  ([learner-data-privacy](../rules/learner-data-privacy.md)).

## What held up

No box needed: the answer save (one at a time, the same request id, kept across a closed tab), escaping of everything
students type, row-level security on every table, the generated files' `--check` gates, retention and its tests, the
question-id registry, a why for every choice, the design system (one look across the dashboard and the hub, light and
dark, no accessibility baseline exceptions), report replies within a day, pg_cron (no failed run in 7 days), and a day of
edge logs without one failed request.

## Done when (Sam picks; unticked means not decided)

### 1. Nothing sits under the class's data

- [ ] **A backup.** The Free plan keeps none and the repo has no export: `supabase/schema.sql` rebuilds the tables, not
      the rows. A scheduled dump to private storage, and one practice restore.
- [ ] **Agents write to the live database without asking.** `.claude/settings.json` pre-approves every Supabase tool and
      `.claude/hooks/supabase-confirm.js` answers yes to the connector's destructive-SQL question, in sessions that also
      read what students typed. A session that only reads (an audit, an evaluation like this one) could run with the
      write tools asking.
- [ ] **A student's identity is one value in the browser's storage** (`sh_visitor_id`): clearing site data, or a browser
      that evicts it, strands XP, crowns, purchases and the streak, and Link my devices only helps when done beforehand.
      A recovery code shown in Settings, and `navigator.storage.persist()`.

### 2. Review of Systems, before Mock 1 on Dec 3

- [ ] **No picture anywhere, for an exam the course describes as "with images & patient boxes"**
      ([the hub note](../hubs/review-of-systems.md); Sam's call at the build: "i dont think we do any figures"). No
      question has a figure, there are no drawn cases, and Radiology's 44 questions name the landmark in words. A small
      set for Radiology, Dental Anatomy and Head & Neck would reverse that call.
- [ ] **Practice doesn't match the exam's spread.** The bank opens "In order", and by `LESSONS.md`'s last refresh four
      fifths of the answers were in the first 3 of 14 courses, with nobody having sat the hub's mock. A mixed default
      order, or "20 mixed questions you haven't seen" on Home, and a short timed block (the only timed mode is 200
      questions in 200 minutes).
- [ ] **About a third of the bank is in formats the INBDE doesn't use** (true/false, two-statement, numbered,
      which-statement), enforced per course by CI because past professors' exams used them. For this hub, loosen the
      minimums and turn true/false items into vignettes.
- [ ] **Depth follows what sources there were, not the mock's weight:** Fundamentals I has about 12 questions per mock
      slot, Oral Micro and Radiology about 3, so the thin courses repeat by the second mock.
- [ ] **Half the courses rest on classmates' study guides, drafted and vetted by agents.** 52 wrong keys were fixed in
      the live bank on 11-24, five days after it opened. Where the hub follows a current guideline against the lecture
      (the wait after an MI, the INR limit, choking), say both on the question: the mock is written by faculty. One human
      spot-check per guide-sourced course.
- [ ] **No readiness number.** Home and the medals count "right on the latest try", which Retry flips in a minute; the
      class is right on about 70% of all its answers and about 61% of its first tries. First-try percent by course against the pass line.
- [ ] **The spaced review exists and almost nobody reaches it** (Daily drill and Learn: about an hour each of the hub's
      first week, against over 20 hours each in the bank and the notes). Put due and missed items at the front of the
      default queue.
- [ ] Item flaws from the sample of about 60: professor or school trivia (`em-prevent-09`, `em-loc-05`,
      `rd-geometry-02`), throwaway true/false (`rd-anatomy-08`, `rn-disease-09`, `em-airway-15`), weak distractors
      (`em-cardiac-17`, `hn-itf-13`), near-duplicates (`hn-skull-09` and `ns-anat-13`, `da-tmj-16` and
      `da-anomalies-11`), and two to check against current guidance (`rd-biosafety-08` thyroid collars,
      `om-caries-08`). No wrong key was found in the sample.

### 3. The hubs against the real exams

- [ ] **"The exam asked different things" and "the hub was easier" keep coming back** in the check-ins (the Occlusion
      final: about two thirds of 33 said one or the other; the Perio midterm likewise), while hub mocks average 75 to 86%.
      The check-ins come from the heaviest users, so the class as a whole is probably less well matched than they say.
- [ ] **Where the building went against where the time goes.** On every hub about nine tenths of the minutes are in the
      bank and the notes. Arcades took about 1%, tours were declined by about nine in ten of those offered one, and Learn, Flashcards, mind maps and Timmy Time each reach a small minority. Much of November's
      work was the game layer (the place, the shop, the journeys).

### 4. Nobody is told when the site breaks

- [ ] **No error reporting from the page** (no `window.onerror` or `unhandledrejection` handler anywhere) and **no
      scheduled check of the live site against the live database** (`postcheck.js` blocks every Supabase request). The
      2026-11-18 outage and Ask Timmy being down at the release were both found by hand.
- [ ] **Nothing compares `supabase/schema.sql` with the live database.** Migrations go in by hand under other names; a
      scheduled read-only job that hashes the live functions, policies and grants against a build of the file.
- [ ] **CI doesn't notice a new function left open to visitors:** `tools/release/rls.js` checks a list of functions that
      must be closed, not a list of the ones meant to be open.
- [ ] **The same agent writes the code, the tests and the budgets, at about 15 PRs a day**, and the bug log took about
      200 rows in three weeks, some three dozen of them already live when found. Required checks on `main`, and a second
      reviewer for `widget/`, SQL and the workflows.

### 5. On a phone

- [ ] **Things pile up over the page.** In the preview at 390 px, Timmy's bubble covered the correct choice and the
      "Not quite" line right after a miss, with a level-up card and a reply card over the top third; on a laptop a sync
      toast, a pennant card, a reply card and Timmy sat over the choices together. One thing at a time, and never over
      the question just answered.
- [ ] **Long pages:** the hub's Home is about 20 phone screens, a page of 100 questions about 36, the About page about
      69; the Questions page's filters fill the first screen before the first question.
- [ ] **iPhones are the class's phones and the least tested:** the smoke test and the quiet-spell test run in Chromium
      only, and WebKit runs a layout check that doesn't block. Nothing tests highlighting, Link my devices or Listen in
      the device's voice (now the only Listen), each of which has had bugs.

### 6. The code and the process

- [ ] **2.5 MB of hand-written JavaScript with no modules, linter or type check:** files of 2,000 to 3,400 lines in one
      closure each, a 759-line function (`widget/study-modes.js`), `esc()` copied into 21 files and `ls()` into 17,
      about 70 `window.sh*` globals, 114 storage keys with no list. A shared util file in the bundles and ESLint's
      `no-undef` would be a start.
- [ ] **The tests are few large files that sleep and read the clock:** `tools/ci/smoke.js` is 2,372 lines with 177
      fixed waits, and the database suites have no clock to set (BUG-203, 204 and 205 each failed around midnight).
- [ ] **A session loads about 26,000 tokens of rules before it starts,** and the notes tell their history (127 dates in
      the always-loaded ones). Stale lines: `check.yml`'s step names, `RELEASE_TEST_PLAN.md` on previews' mp3s,
      `verify-before-pushing.md` on old hubs' scripts, `shared-infrastructure.md` on `migration_v5.sql` and
      `deploy_rollout.ps1`. Seven fixed bugs wait for a retest and 22 ticked inbox lines to be cleared.
- [ ] **Housekeeping:** 97 migration files and six unused `flow-*.png` at the root (the pictures are published),
      `deploy_rollout.*` (a path that writes `main` with no PR), no `package.json` (tool versions pinned line by line in
      the workflows, `wrangler@4` floating), no LICENSE.
- [ ] **Content is one page load behind every release** (the service worker answers a hub's JSON from its cache and
      refreshes behind it), so a corrected key needs two loads, and "A newer version is live, Reload" reloads the old
      copy. Pages wait for the network to fail before using the cache on a weak signal. A first hub visit moves about
      1.6 MB compressed, the notes and questions whole.
- [ ] Small bugs seen: `#notes/constructor` ends in the offline message; searching "amp", "lt" or "quot" shows broken
      entities; `admin_cache` still keeps two down hubs' question health; the old-hub `ANSWERED` branches in
      `widget/hub.js` are dead; five dialogs say `aria-modal` without holding focus (`replies.js`, `v3.js`,
      `linkask.js`, `pet.js`, `ranks.js`).

### 7. If Sam steps away

- [ ] **No handover page** (what to pay, where the secrets are, how to hand the site to the next class), **no privacy
      page**, and nothing on the site saying the notes and questions are written by AI from course material and aren't
      official. The About page and the admin page load Google's fonts, the site's only third-party requests.

## Log

- 2026-11-27: written by the session that ran the evaluation (Claude Code). Vault only; no code changed.

## Outcome
