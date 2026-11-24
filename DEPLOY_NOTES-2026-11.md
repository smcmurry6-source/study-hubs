# Deploy Notes, November 2026: the change log's older entries

Entries of [DEPLOY_NOTES.md](DEPLOY_NOTES.md)'s "Recent major changes" dated November 2026, moved here unchanged by
`node tools/deploy-notes/trim.mjs` once they were more than a week old, newest first. New entries go at the top of
`DEPLOY_NOTES.md`, never here. Search the whole log with `grep -n "<hub or feature>" DEPLOY_NOTES*.md`.

## Entries

- **2026-11-16 (Occlusion Question Bank, Codex)** — Restored **What cusp hits where?** at the top of the base Question Bank (`/hubs/occlusion/#questions`): students can choose **Contacts** or **Movements**, and the existing best-score behavior remains. The game had survived the redesign in the generated figures code, but its mount point had been removed. It is intentionally absent from Learn, Flashcards, Daily drill, Yesterday's misses, Weak spots and the mock; the Occlusion-only `SH_HUB.bank.cuspGame` configuration makes that explicit. `tools/ci/smoke.js` now holds that placement and launcher behavior.
- **2026-11-16 (Occlusion, Claude Code)** — Sam: "fix the open reports in occlusion, send the replies, and merge." The
  drawn figures' base styles (letter pins, lines, labels: `.fg-pin`, `.fg-line`, `.fg-t`...) had been left behind on the old
  page at the redesign's release, so the A-D pins were black dots (unreadable in dark mode); restored in
  `tools/figures/occlusion/od.css` and rebuilt. `mo-orth-occ` rewritten (two choices were the same words swapped) and
  `nc-tf-4` reworded to Dr. Lawson's "night guard". Reports 45-48 resolved with replies.
- **2026-11-16 (Heme & Endo Exam 3 hub, Claude Code, #379)** — Sam: "create the hub for endo exam 3. you can reuse the art
  that was made for endo exam 2. also, the lecture from dr taylor was moved from exam 2 to exam 3. you can reuse what was
  made for his lecture for this exam". New hub `hubs/heme-endo-exam3/` on the engine (Exam 3, Fri 11/20, 8:00-9:30 am, 35
  questions, new material only), **285 questions** over five lectures: **A** Dental endocrinology (Dr. Taylor) brought over
  whole from Exam 2 (58 questions, same `dc-` ids, hints, topics, tables; `vault/tasks/done/2026-11-10-heme-endo-exam3-carry-lecture-a.md`),
  **L17** Pregnancy and lactation and **L18** Estrogens and androgens from their slides and recordings (58 and 59 questions,
  16 quoted hints each), **L19** Introduction to hematology and **L20** Lymphomas and leukemias from their slides (55 each;
  taught Tue 11/17). Every format the rules ask for, every choice with its why, 53 High Likelihood topics, review tables,
  Side by side, processes and Lab Sort sets, a 25-question mock (5 per lecture, at the exam's pace). Narration: As taught and
  Plain English for all five, High yield for A. **Art and arcade are Exam 2's, reused** (Sam's exception to
  every-hub-gets-its-own-art): `tools/figures/site/` gives the hub Exam 2's tint, emblem, masthead and medal
  (`widget/hub-art/heme-endo-exam3.js`), `widget/ranks.js` its medal, and Exam 2's Cycle Arcade is `content/arcade.js` with
  this hub's scores (the Path Lab Escape moved to the week of Exam 3). Wired into `hubs.js` (first card), `sw.js` (`HUBS`,
  `sh-v61`), the admin page's and recap's labels, `budgets.json`, the About page's arcade entries, and CI's figure check.
  **Not done, merged early because Sam was running out of usage** ("merge before i run out of usage, we can finish the rest
  when it resets"): the 22 figures Sam approved (drafts in `tools/figures/heme-endo-exam3/drafts/`) and High yield
  narration for L17-L20 (`vault/tasks/2026-11-16-heme-endo-exam3-figures.md`); L19 and L20 to taught and L21 and L22, whose
  slides weren't posted (`vault/tasks/done/2026-11-16-heme-endo-exam3-l19-l22.md`). Not used (graded-coursework): the Exam 3 Anki
  deck in Drive, "Resources from D3s", Quiz 4 (open until 11/19). Hub note: `vault/hubs/heme-endo-exam3.md`.
- **2026-11-16 (Time in Learn and in Flashcards, told apart from the Question Bank, Claude Code, [#381](https://github.com/smcmurry6-source/study-hubs/pull/381))** — Sam asked
  "do we have tracking for how people do questions between the bank, learn, and flashcards", then "i want to see where people
  spend the most time between the three", then "yes do it. merge when ready". Nothing students see changes. The engine logged
  all three as `compendium/bank`, so the admin page's time by section couldn't split them (a first day's estimate from answer
  and rating timing: about 94% of the time in the bank, 5% in Learn, under 1% in Flashcards). Now `section()` in
  `widget/hub.js` sends `compendium/learn` or `compendium/cards` while the bank is studied as Learn or Flashcards (on any set
  but the mock, the launcher and the full-screen session alike), and `migration_v59.sql` (applied through the connector)
  replaces `sh_surface()` with the surfaces `learn` and `cards`, and places the redesign's other sections the lessons audit
  found unplaced (`compendium/drill` and `compendium/misses` as `drill`, `more/timmy` as `podcast`, the rest of More as a
  new `more`; days already recorded are placed too). It also keeps Learn's answers as context `learn` in `answer_xp`
  (they were `other`; nothing pays by it). The admin page's Insights → "Where time goes" has Learn, Flashcards and More
  columns. Tests: `tools/release/admin-ops.js` checks 26 section names, `tools/release/xp.js` Learn's context and pay.
  Bundles rebuilt; the event taxonomy, game-server, Insights notes, decisions and the inbox (two lines ticked) updated.
- **2026-11-15 (Perio: `q7-07` retired, Claude Code, the lessons audit's follow-up)** — Report #44 ("too many details for a
  non-MC question"): `q7-07` was a self-graded recall card listing the immune changes smoking causes, which `q7-03` and
  statement 2 of `q7-N03` already ask; the final has no recall items, and the bank audit's own rule retires a recall card that
  repeats a scored item's fact. Sam: "retire it". Out of `questions.json` and the smoking topic's `ids` (core.json and the seven
  questions that carry a copy); `q7-07 retired` in `tools/question-ids/perio.txt`; 670 → 669 questions. S7's High yield
  ("8 questions in the bank" → 7) recorded again (`audio/implants-perio-hy.mp3` and its words file). The class's numbers on
  the other questions are untouched (nothing moved).
- **2026-11-16 (PCD Implants Exam 1, MSK Exam 3 and GI Exam 2 check-ins closed, Claude Code)** — Sam: "close the check
  ins for implants, musculoskeletal 3, and gi 2". `checkinClosed:true` on each exam in `hubs.js` (`pcd-implants-exam1`,
  `msk-exam3`, `hepatobiliary`); `pastExams()` in `widget/dash.js` skips them, so they leave the Exam check-ins panel in
  Past hubs and the pop-up no longer goes out. Answers already sent stay on `review/` → Check-ins. The hub pages, their
  recaps and the other open check-ins (Heme & Endo Exam 2, the Occlusion midterm and final) are unchanged.
- **2026-11-15 (Question Bank: 50, 100, 200 or all at a time, every card numbered, Claude Code, #373)** — Sam: "Lets implement the numbering of
  the questions in the question bank idea" (a classmate: "adding question numbers so we know how many more are left ... if
  it's like 80+ questions I'm not just scrolling forever and I could maybe take a break when I hit #40"; also on the idea
  board), then "I want the questions to be shown in intervals of 100 unless there are less questions than that in the
  filter. Showing all 844 feels unmanageable", then "an option by the filters with how many questions to show at a time.
  50/100/200/all questions". **At a time**, beside Order in the panel: 50, 100 (to start), 200 or All (`STATE.ui.qsize`). A
  longer list is shown a set of that size at a time: above it, "Questions [101–200] of 845" with Previous, Next and a
  picker for any set (`.qsets`); at the end of a set, "That's questions 1–100 of 845" and **Next 100 questions**, which goes
  to the top of the next set. Every card starts with **"Question 12 of 100"**, its place in the set (fewer than the size,
  one set: "of 84"; All: "of 845"). Inside a set the cards still come fifty at a time and
  load by themselves (Sam's 11-14 call). The bank keeps its place while the filters stay the same (`STATE.ui.qpage`, the
  set's first question, so a new size keeps it: 101–200 becomes 101–150), except
  Not answered yet and Missed last time, which start at their first set. The Daily drill counts the ones done today (with 5
  done, its first card left is "Question 6 of 20"); Yesterday's misses and Weak spots count from 1; the mock's existing
  "Question n" gains "of N". "Try it again" keeps the number; the missed question that comes back a few cards later has
  none; Learn and Flashcards keep their own progress. New events `bank:size=` and `bank:page=next|prev|pick|end`. `widget/hub-bank.js`
  (`qNum()`, `setsBar()`, `toSet()`, `page()`), `widget/hub.css` (`.qc-n`, `.qsets`, `.qset-end`), bundles rebuilt.
  Found in testing and fixed: BUG-154 (the number crowded the lecture chip on a narrow phone) and BUG-155 (Next 100 left a
  phone at the bottom of the new set: scroll anchoring). The single-file engines weren't touched: every hub still on one is
  archived. About page ("Questions"), the bank's rule note, decisions, the event taxonomy and the inbox updated. **After the
  merge** (the After merge workflow, #375): Ask Timmy deployed again for the About page's new words
  (`supabase/functions/timmy/site.json`), the post-check, and the changelog lines for Occlusion and Perio
  (`tools/after-merge/changelog.txt`).
- **After merge: the after-merge steps run by themselves (2026-11-15, Claude Code)** — Sam: "for the after the merge, lets
  make all of that automatic." A new workflow, **After merge** (`.github/workflows/after-merge.yml`), runs
  `tools/after-merge/run.js` on every push to `main`. The script works out from git what the push changed and does only
  what that needs:
  - **answer keys:** a changed hub bank's keys load;
  - **Ask Timmy:** the function deploys when `supabase/functions/timmy/` changed, then gets one real question (it fails on
    a nap);
  - **Timmy Time:** a new episode (or a new length) is registered;
  - **pages:** it waits up to 15 minutes for GitHub Pages to serve the push;
  - **data fixes:** a fix the push added to `tools/data-fixes/` runs once, after the pages are live;
  - **changelog:** each line the push added to `tools/after-merge/changelog.txt` (`<hub> | <message>`, the new home of
    the changelog line) is logged;
  - **post-release check:** `postcheck.js` runs.

  Each run's summary is a table of the steps. A missing secret shows as "blocked", and either a blocked or a failed step
  turns `main` red. The secrets go in the repository's `after-merge` environment, limited to `main`, so no pull request's
  workflow can read them; **Sam adds them once** (the inbox). The logs are public, so it prints no secret and no row of
  data. `tools/after-merge/test.js` checks the plan on made-up pushes in "Check hubs". It was dry-run on #361, #366, #369
  and #371, and every plan matched what those merges needed.
  **First real run, by hand, for #370:** 845 Occlusion keys loaded, Ask Timmy version 6 (its question answered), Pages
  live in 61 s, both data fixes run (#370's and the 11-14 `in-bennett` one, which had never run), the post-release check
  passed, and the changelog line logged. Docs: [after-a-merge](vault/how-to/after-a-merge.md), ship-a-change steps 3, 7
  and 8, build-a-hub's answer keys, ask-timmy, secrets, the release plan, the PR template, and the podcast and
  lessons-audit skills. **Not automated:** migrations.
- **2026-11-15 (the Plaque Boss gets its own band on the redesign's hubs, Claude Code)** — Sam: "Refine the question bank
  monsters ui appearance. It looks like its messing up other buttons." Since the release, the boss docked itself inside the
  engine's top bar (`widget/eggs.js` `bossDock()` found the page's sticky `<header>`, the bar's one row of buttons): on a
  phone it squeezed the bottom tabs to 4-11 px with their labels piled up, on a laptop it ran off the screen
  ([BUG-153](vault/release/bug-log.md)). Now, on Occlusion and Perio, it is a band of its own right after the top bar (laptop,
  tablet) or the top strip (phone), sticky under it and moved when a phone turns (`placeBoss()`), tinted with the boss's
  own color in the engine's type and tokens (`widget/hub.css` `.sh-egg-boss.is-band`: face, name, HP bar, HP, its line on
  a laptop, a 32 px ×). While it's up, eggs.js sets `--boss-h` on the page, and what sticks under the bar moves down by it
  (the lecture list, the bank's side panel, the mock's clock, a pinned figure, Ask Timmy's panel in `widget/ask.css`). The old
  single-file hubs' docked strip is unchanged. Bundles rebuilt; About page's Plaque Boss line reworded. No schema change.
- **Occlusion: the final's question bank audited, and a mock that leans on High likelihood (2026-11-15, Claude Code, [#370](https://github.com/smcmurry6-source/study-hubs/pull/370))** — Sam:
  "audit occlusions question bank to see if we can make it higher yield ... accurate, with good answer options and sufficient
  explanations", then "make sure the exam hints are utilized as best as possible". Every L6-L10 question checked against the
  notes and the Exam Hints. **156 questions fixed** in place (ids kept): 4 that the notes contradict ([BUG-152](vault/release/bug-log.md):
  `cs-in-crown-lab`'s case, `nc-sel-acid`, `mo-histo`, `ot-sel-clin`), keys that were the longest choice trimmed, giveaway and
  arguable distractors rewritten, whys and explanations completed, professors' words quoted where a hint backs the point. **Every
  emphasized hint is now tested**: 4 new questions (`in-worth`, `mo-joint-load`, `mo-splint-cause`, `dn-wf-skel`), weak ones
  re-aimed, 3 new High likelihood topics for L7's orphan hints (the splint as an environment of healing, painless wear, a
  traumatic force), and topics renamed, added to and trimmed across L6-L10 (63 in all). **Retired** on Sam's call: `mo-better-q`,
  `mo-swim`, `in-2s-4` (kept: `mo-bell`, `mo-occupational`, `ot-tf-4`, `ot-tf-5`, `dn-tf-6`). 845 questions. **The mock**: 7 of each
  lecture's 9 from its High likelihood questions (Sam: "mostly high likelihood. Like 75%"): `core.mock.likelyShare` (0-1),
  read by `buildMock()` in `widget/hub-bank.js` for any hub that sets it, each side unseen and missed first, topped up from the
  other side when short (L10 is all High likelihood: 9 of 9). The mock's blurb and the About page's High Likelihood entry say
  so; Ask Timmy's site help rebuilt. High yield rebuilt and **recorded again for all five final lectures**. Class data:
  `tools/data-fixes/2026-11-15-occlusion-audit.sql` (73 rewritten choices' picks, 8 re-aimed questions' "% right", recounted
  from the new versions' answers) runs once after the merge. Sam's calls on its two open questions: the splint follows Dr. Givan's slides, and L10 keeps "Miller" as
  Dr. Abou-Arraj's slide has it ([decisions](vault/decisions.md)); after-merge steps: [the inbox](vault/tasks/inbox.md);
  what the next audit needs to know: "The final's bank audit" in [the hub note](vault/hubs/occlusion.md).
- **2026-11-15 (Perio: the question bank audited for the final, Claude Code)** — Sam: "audit perios question bank to see
  if we can make it higher yield ... accurate, with good answer options and sufficient explanations. Make sure the exam
  hints are utilized as best as possible." Every question was read against its session's notes, hints, review tables
  and cram lines (one reviewer per session, every proposal checked against the notes before it went in). **750 → 670
  questions**: 263 edited in place (30 accuracy fixes to explanations, why lines or choices, e.g. `q8-03`'s second right
  answer, `q9-07`'s Type 1B treatment, `q6-L07`'s "well contained"; 113 answer-choice fixes for giveaways and
  throwaways; 85 thin explanations; 22 clarity; 13 format, such as 2- and 3-pair matching items brought to 4), 103
  retired under Sam's "not more than twice" bar (76 repeats, counting statements and across sessions; 27 trivia with no
  exam signal), 23 new (`q<n>-F01`..., 8 select-all and 5 matching, the final's formats) where an emphasize hint had no
  question on its own point. Two new High likelihood topics (S4), none removed; 460 questions tagged (was 424). The
  key is the longest choice in 15% of MCQs (was 24%). Notes, hints and review tables unchanged, so As taught, Plain
  English and Timmy Time stand; **High yield changed in all nine sessions and was narrated again**
  (`audio/<lecture>-hy.mp3` and words files). Every retired id is listed with its reason in
  [the audit's note](vault/tasks/done/2026-11-15-perio-bank-audit.md), with eight notes issues for Sam (none changes a key).
  Merged as #371 (Sam: "Merge when ready"; and on the notes: "Leave the 8 spots", the 27 retirements stand). **Done at
  the merge:** `node tools/xp/keys.js perio --load` (670 keys loaded, 103 retired), `log_changelog` for Perio, and
  `node tools/release/postcheck.js` passed (21 of 21 files live, the dashboard and Perio with no errors).
- **Occlusion: Timmy Time for the final, in the midterm episode's place (2026-11-15, Claude Code)** — Sam: "Podcast for occlusion final. Replace the midterm with it." A 48-minute episode (`final-review`, 11 chapters) on L6-L10: articulators and the facebow, the records, functional disturbances and TMD, splints, mobility, wear and bruxism, keeping a denture in, balanced, non-balanced and lingualized, Dr. Lawson's NCCLs and Dr. Abou-Arraj's occlusion and the periodontium, then a 27-question lightning round. Written from the hub's own notes, Exam Hints (quoted word for word), cram sheet, High Likelihood topics and LESSONS.md's live signals (the Bennett angle and the fossae, the facebow's level, "less bone, but a bigger arch", both Miller scales). Script `tools/podcast/occlusion/script.md`; the midterm's moved to `midterm.md`; mp3 `hubs/occlusion/audio/timmy-time.mp3` (replaced, 34 MB, -16.4 LUFS); `podcast` in `content/core.json` with one lore comment (the toothbrush by the door); the dashboard's `sub` and the About page's episode list. Lexicon: A-D-A, R-D-A, N-C-C-L(s), Abou-Arraj's, kinematic, periodontitis, periodontics, Realeff, orofacial, and the verbs "ever use" and "don't use". Lore (LORE.md): thirty-one's one-tooth night guard, his self-checked mobility, the toothbrush vindicated by L9. Merged as #366 (Sam: "Merge"), after a rebase onto #367: both PRs' About lines, lore, lexicon entries and decision rows kept. **Done at the merge:** `admin_set_podcast_episode(..., 'occlusion', 'final-review', 2863)` (listening earns XP), `log_changelog` for Occlusion, and `node tools/release/postcheck.js` passed (4 of 4 files live, the dashboard and Occlusion with no errors). Then, on Sam's OK ("Merge and ok"), the `timmy` function was deployed again for the new site help (`node tools/timmy/deploy.mjs`, version 5), which the session's permission check had first stopped.
- **2026-11-15 (Timmy Time: the Perio final episode, Claude Code)** — Sam: "Podcast for perio final. Replace the midterm
  with it." Perio never had an episode, so this is its first, for the final (Thu Nov 19); Occlusion's midterm episode
  stays (Sam's answer, [decisions](vault/decisions.md)). A 49-minute (49.1) review: `hubs/perio/audio/timmy-time.mp3`
  (35 MB, -16.4 LUFS, 96 kbps), script `tools/podcast/perio/script.md`, from the hub's notes (As taught), Exam Hints (every
  professor quote word for word; Dr. Kaur's final focus as a paraphrase, as the hub has it), the cram sheet, the High
  Likelihood topics and LESSONS.md's live signals (the select-all on what SRP aims for, the closest furcation entrance
  mixed up with the narrowest). 13 chapters: S1-S3, S4 (with the instruments, in for the final), furcations, resective
  surgery, regeneration, implants (health, mucositis and peri-implantitis read case by case), antibiotics, host
  modulation, recession and grafts, gingival excess with crown lengthening and the esthetic norms, a 32-question
  lightning round and the sign-off. S1-S4 take 16% of it, as the final's split does. Left out on the Nov 12 review's word:
  suture techniques and pictures, Miller & McEntire, entrance widths and the doses (it says Dr. Litz's "know the chart" was
  superseded). Lore (Sam took all four): Timmy's own furcation (a lower first molar's two entrances, about 2.5 mm down, and
  its mesial root concavity), thirty-one stages himself with a toothpick ("You're not staged. You're anxious."), may have
  an enamel projection and wasn't Dr. Kaur's thirty-one, the toothbrush's big episode, and the pie after the release.
  Two lore comments (rolled): thirty-one and the toothbrush by the door. `lexicon.json` gains 43 entries (gingiva,
  gingival, gingivitis, gingivectomy and mucogingival, which espeak read with a hard g; Kaur, Geurs, Caton, McGuire,
  Salud, debride, digoxin, the cyclines, PerioChip, Periostat, Arestin, and `C-A-L`, `P-G-A`, `E-D-T-A`, `F-D-A`,
  `D-F-D-B-A`, whose final A read "uh"; narration made from now on gets them too). Hub: `content/core.json`'s `podcast`
  (id `final-review`), so Home's Timmy Time quick link and More's tile appear; dashboard card gets `podcast` and "Timmy
  Time" in modes; About page's episode list, `supabase/functions/timmy/site.json`, `LORE.md` and the hub note updated.
  The title is "Perio final: ..." ("Periodontology" broke mid-word on Home's phone tile). Shared fix with it
  ([BUG-151](vault/release/bug-log.md)): the small line on a hub's Timmy Time tiles (Home and More, `widget/hub.css`) is full
  white, since 86-88% white on Perio's pink failed the 4.5:1 contrast check.
  Merged as #367 (Sam: "Merge"). **Done at the merge:** `admin_set_podcast_episode(..., 'perio', 'final-review', 2948)`
  (listening earns XP), the `timmy` function deployed again for the new site help (version 4), `log_changelog` for Perio,
  and `node tools/release/postcheck.js` passed (6 of 6 files live, the dashboard, Occlusion and Perio with no errors).
- **The redesign is live (#359 merged 2026-11-14, about 6:46 pm Central; Claude Code)** — Sam: "Merge". The dashboard,
  Occlusion and Perio are on the redesign at their old addresses (`d86f134`); Heme & Endo Exam 2 keeps its old page.
  Done at the merge, in the release note's order ([the release](vault/tasks/done/2026-11-06-redesign-release.md); its Log's
  last entry has the detail): `FULL_FROM` in `widget/pet.js` is `"2026-11-14"`; **`migration_v54.sql` to
  `migration_v58.sql` are applied** to the live project (each file sent whole, as one transaction, through Supabase's
  management API with the access token in the session's environment, because the connector can't take a file: so they
  aren't in Supabase's own migration list, and `supabase/schema.sql` is the record); the switch time
  (`game_config.v2_at`) is 2026-11-15 00:39 UTC; **the answer keys** are loaded (Occlusion 844, Perio 750);
  Occlusion's episode is registered (2688 s); **eight starting ideas** are on the board; **the `timmy` function is
  deployed** (JWT verification off); the live permissions audit is clean; `node tools/release/postcheck.js` passed;
  the site changelog has the release.
  **BUG-150, found after the merge and fixed in about four minutes:** Ask Timmy answered "I nodded off" to every
  question, because the key Sam saved in the function's secrets is named `TIMMY_EVAL_KEY`, not `ANTHROPIC_API_KEY`.
  `supabase/functions/timmy/index.ts` now reads that name when the first isn't set.
  **Two new commands for the two steps that are by hand after a merge:** `node tools/xp/keys.js <hub> --load` (a hub's
  answer keys, after every merged change to its questions) and `node tools/timmy/deploy.mjs` (Ask Timmy's function,
  after every merged change to `supabase/functions/timmy/`, which the About page's site help is part of).
  **To roll back:** revert #359 with a new PR and leave the database as it is
  ([roll-back-a-release](vault/how-to/roll-back-a-release.md)); Ask Timmy has his own switch on the admin page.
- **The release PR takes in `main` (#359, 2026-11-14, Claude Code; live from the merge)** — Sam: "I believe I updated
  the occlusion hub and the perio hub". #361 (the lessons refresh), #362 (Perio's Nov 12 class, the review for the
  final and Figs 6-8) and #363 (Ask Timmy on Sonnet 5.5) were written for the old pages and `next/`; they are now in
  the switched tree. **Occlusion's and Perio's content** (`hubs/<hub>/content/`) is `main`'s, key for key (the 22 new
  and 36 retired Perio questions, the session notes, the hints, `in-bennett`, `dn-support`, `dn-resorb-mand`), with
  Perio's three new figures in `content/figures.js` and its re-recorded audio. **The engine's exam-format mock** learned
  what Perio's final needs (`formatMock` in `widget/hub-bank.js`): **matching items** (`mock.format.match`; a list
  beside each row, every pair scored by itself, kept in `STATE.mock.picks[id]` by row) and **the midterm's share**
  (`midShare` of each kind from the lectures numbered up to `midThrough`; Perio: 0.15 and 4). Special Patient Care is
  in `archived` in `hubs.js` and out of the About page, the budgets and the baselines, as on `main`. The bank's page
  is 50 (`main`'s change to `hub-bank.js`). `sw.js` is `sh-v60` (`main` shipped `sh-v59`). Both branches had logged a
  BUG-130 and a BUG-131: `main`'s keep the numbers, the release's are BUG-148 and BUG-149.
- **The release PR's fourth round: smooth scrolling (#359, 2026-11-14, Claude Code; live from the merge)** — Sam on
  the preview: "scrolling and things are kind of sluggish and jittery" (BUG-147; what was measured and what was
  learned: [motion-cost](vault/reference/motion-cost.md)).
  - **The dashboard's drawn pictures move when you arrive, then rest** (`lifeWatch` in `widget/dash.js`): the "you"
    card's place, the classroom, the stage, the road, the idea board's header and Past hubs are alive for 8 s (`LIFE`)
    when they come on screen, when a scroll ends on them and under a mouse; they rest at once when a scroll or a touch
    starts, behind an open window and off screen. `.is-rest` takes the animations inside a drawing away
    (`widget/dash.css`), which frees their layers (310 on the page before, 23 at rest now); `.is-away` stops
    everything else in a part that is off screen. Nobody walks in or out of the classroom while it rests.
  - **The picture of Timmy's place** on a card is a still with the moving one drawn over it in a shadow root
    (`.tpc-live`; it was one animated image). A page puts `.is-rest` on `.tpc-live` to take it away; its stars hold
    still. **The full view's stage** holds while anything in the window scrolls and, in Customize, rests 5 s after the
    last change. **The customizer's rarity frames are stills.**
  - **The shop** (`widget/shop.js`, `shopLife`): every moving frame and the storefront's two layers have a still under
    them; the moving ones show for 6 s after it opens, after a scroll ends and under a mouse.
  - **A crown medal's glint** (`widget/ranks.js`) is a glow whose opacity moves; it was an animated filter.
  - The little Timmys in the classroom and on the stage no longer blink or sparkle (63 layers nobody could see).
  - Scrolling the whole dashboard under a 4x slower processor: 59 → 17 ms a frame (phone-size), 81 → 19 (laptop-size).
- **The release PR's third round (#359, 2026-11-14, Claude Code; live from the merge)** — two more of Sam's calls
  from the preview ([decisions](vault/decisions.md), 2026-11-14):
  - **Timmy's place, the full view** (`widget/place.js`, `widget/place.css`): one theater-look window for your own
    place and a visit. The dialog sets the design tokens for everything inside (`--ground`, `--row`, `--text`...), so
    it is dark in both themes; the stage and its Close-up chip sit in `.tpv-frame`; your own panel is `hostCard()`
    (Timmy today with an HP meter, Customize and Shop, the rank plate, the medals); the customizer's foot is sticky on
    a laptop and has Done (`data-tp="done"`). The window is larger (1240 by 820 at most) and stacks on an upright
    tablet. Every button still carries a fixed `data-tp`. `.tpv button { color: inherit }` beats a one-class rule, so
    a button inside the window that needs its own color is written `.tpv .name`.
  - **The customizer's cards are in the shop's rarity frames** (Sam: "reuse the rarity art instead of just having
    'legendary' in yellow"): `shopArt()` in `widget/place.js` fetches `widget/hub-art/shop.js` the first time
    Customize opens and `rframe()` draws `SH_SHOP_ART.frame(rarity)` behind each card (`.tpv-card.is-framed`, laid
    out like the shop's `.tsh-card`); without the art the cards are plain, as before. Nothing more loads with a page.
  - **The Preview workflow** no longer fails when a deploy that worked prints no alias address (BUG-146).
  - **The dashboard's closed-hub cards are gone** (`widget/dash.js`: `renderArchived()` only draws the check-ins and
    Past hubs' note; `#archived` and the `.dx-arch*` styles are removed). Past hubs is the exam check-ins and the
    recaps. `tools/release/admin-ui.js` now expects no tab and no link for an archived hub.
- **The release PR's second round (#359, 2026-11-13, Claude Code; live from the merge)** — what Sam asked for after
  using the preview ([decisions](vault/decisions.md), 2026-11-13), all in the same PR:
  - **Dashboard:** the You card's rank is a hero on dark plum (`renderMyRank()`), the wallet and stats match, and
    **The road** (`#road`, `renderRoad()`) lays out the three journeys rank by rank in place of the folded ladder; one
    **Exam check-ins** panel at the top of Past hubs (`renderCheckins()`; archived rows no longer carry the button); the
    Timmy Time card is animated again; the idea board has a banner; the pedestals' wreath sits around the numeral
    (`tools/figures/site/stage.mjs`); a hub's panel slides in on a tab change.
  - **Trophy case:** a shelf per hub with its eight (`widget/trophies.js`; badges stay `"<trophy>:<hub>"`).
  - **Hubs on the engine:** "All hubs" in the bar and "Hubs" on a phone's top strip (`.hx-back`, `.hx-home`); pages
    slide in from their tab's side (`route()` in `widget/hub.js`).
  - **Learn and Flashcards** (`widget/study-modes.js` + `.css`, `widget/hub-bank.js`): a launcher in the bank, above
    the "Which questions" panel, and a **session over the whole screen** (`openFocus()`): numbered tiles, "Don't
    know?" and Auto-next in Learn; swipe, arrows and a session summary in Flashcards. Tests that drive them click
    `[data-sm="start"]` first.
  - **Motion:** the block at the end of `widget/hub.css` (pop-ups rise, pages slide; zero-specificity `:where()` rules
    with `translate` / `scale`, so a pop-up's own transform and entrance are left alone; `html.hx-still` turns it off,
    set by `widget/hub.js` and now `widget/dash.js`).
  - **Heme & Endo Exam 2:** archived (`archiveOn` noon Nov 13 in `hubs.js`) and its audio off the site (173 MB).
- **THE REDESIGN'S RELEASE (the switch PR, #359, opened 2026-11-13, Claude Code; live from the merge)** — **Read this before
  touching the dashboard, Occlusion or Perio: the files moved.** One PR switches the site to the redesign
  ([the release](vault/tasks/done/2026-11-06-redesign-release.md)); reverting it brings the old site back
  ([roll-back-a-release](vault/how-to/roll-back-a-release.md); the database stays as it is, the old pages run on it).
  - **The pages:** `index.html` is the new dashboard (its hub list is **`hubs.js`**, edited by hand: add, date or archive
    a hub there, not in `index.html`); `hubs/occlusion/` and `hubs/perio/` are on the engine, their old single-file pages
    gone. `next/` and every `hubs/<hub>/next/` are gone. **Heme & Endo Exam 2 keeps its old page** (Sam: its exam was the
    13th) and its new version was deleted, with the 59 MB of High yield recordings only that version played.
  - **A hub's content is its JSON** (`hubs/<hub>/content/`): edit it there, then `node tools/hub-next/build.mjs`
    (the question index, High yield, one layout; CI's `--check`). `tools/narrate.py`, `narration_words.py`, the figure
    builds (they write `content/figures.js/css`), `tools/ci/cases.js`, the smoke lint, `tools/xp/keys.js`,
    `tools/podcast/extract_hub.js`, `dump-banks.js`, `publish-recap.js`, the preview and Ask Timmy all read it.
    `tools/dash-next/` is gone. New hubs: [build-a-hub](vault/how-to/build-a-hub.md), rewritten.
  - **After a merge that changes a hub's questions, load its answer keys** (`node tools/xp/keys.js <hub> --sql`): the
    server grades and pays from its own copy. A new Timmy Time episode is registered with `admin_set_podcast_episode`.
  - **The database:** `migration_v54.sql` to `migration_v58.sql` (the game layer, Ask Timmy, Learn and Flashcards, the
    random visit, and v58, new: hidden ideas are deleted after 90 days by the weekly retention job) are applied at the
    merge and are in `supabase/schema.sql` after a marker line; `supabase/pending-migrations.txt` is empty.
  - **Shared widget files, on every page (the archived hubs' too):** **Full Arch is retired** (the chart, its switch
    and its code are gone; 23 trophies on an old page, 27 on the redesign; whoever won it keeps it as "retired").
    **Everyone has Timmy**: no adoption, introduction, "Tap me!" or holiday outfits in `widget/pet.js`; he wears what
    is on at his place (on an old hub's page, the outfit kept on the device, or nothing). `FULL_FROM` in `pet.js` is
    the release day. BUG-112 fixed (the medal button's label for two or more medals). The run flame has its own
    switch in the new Settings.
  - **`sw.js`** (`sh-v60`): precaches the dashboard, the bundles, the files fetched on first use and each engine hub in
    its `HUBS` list; a hub's content JSON is served from the cache and refreshed behind it (**a content edit shows on the
    load after the one that fetched it**). A new engine hub adds itself to `HUBS`; `tools/ci/syntax.js` checks it.
  - **The About page** is rewritten for all of it (27 trophies, 16 secret), and Ask Timmy's site help rebuilt from it.
    Rules and how-tos rewritten for the engine: hub-home-page, arcade-skins, question-bank-filter-panel,
    every-choice-gets-a-why, archived-hubs-drop-their-audio (`"audio": "off"` in `core.json`), build-a-hub,
    narrate-with-kokoro, the repo map, shared-infrastructure, `/podcast`, `tools/podcast/LORE.md` (his place).
  - Tests: the smoke test on every hub, `node tools/release/run.js` (the report is in the PR). Left to do:
    [the inbox](vault/tasks/inbox.md) (what the old pages still hold up, keys and the function loaded by hand, the
    first migration after the release, the hub trophies' shelf: Sam's call).
- **2026-11-14 (Ask Timmy's model, Claude Code)** — Nothing students see changes (Ask Timmy starts at the redesign's
  release). Sam: "Lets do sonnet": the `timmy` function's model is Sonnet 5.5, not Opus 5.5, after the eval ran the whole
  test set on Sonnet 5.5 and Haiku 5.5 (`--model`, new): Sonnet matched Opus at half the cost and twice the speed; Haiku
  deflected more. `core.js` also prices both models for the day's cap. [#363](https://github.com/smcmurry6-source/study-hubs/pull/363),
  [Ask Timmy](vault/tasks/done/2026-11-12-redesign-ask-timmy.md).
- **2026-11-14 (Perio: the Nov 12 live class and the review for the final, Claude Code)** — Sam: "Update the perio hub with the
  added google drive contents", with Dr. Abou-Arraj's furcation email. **S9** now has the live class: its notes' slides-only tail
  became 15 paragraphs from the class at both levels (gingival excess and drug enlargement, the gummy smile, altered passive
  eruption with A as 1.5-2 mm, crown lengthening by type and his Patient 1, the esthetic evaluation, the tattoo), his answers on
  the recording went into their paragraphs, both S9 mp3s were regenerated, 22 questions were added (`q9-L37`-`L52`, `T11`-`T14`,
  `S06`-`S07`, `N05`), 9 hints, the topics re-ranked, Review, cram, mind map and Figs 4-5 brought in line, and the task moved to
  done. **The review for the final**: the format (60-65 questions, about 15% from S1-S4, an hour and a half that can be two, no
  suture images, few or no Patient Box) in an S1 hint, a new final card on Home (`FINAL_FACTS`), `COURSE_GRADING` and the mock
  (`EXAM_FORMAT` 62 in 90 minutes, 3 matching, `midShare` 0.15 via `drawSplit()`); what to know and skip as hints and session
  `note`s for S1-S5 and S8; **36 questions retired** under dont-ask-what-professors-skip (S2 suture techniques and pictures, S3
  Miller & McEntire, S5 entrance widths, S8 doses; Dr. Litz's "know dosing" hint marked superseded), `q3-07`, `q2-P01`, `q2-P02`
  rewritten (same ids). High yield re-recorded for S1-S5, S8 and S9; `next/` rebuilt with the final's chips, banner and blurb.
  Engine mock's matching and 15% split: a box in the release task. Then Sam: "Yes to all figures and anima": three new S9
  figures (`tools/figures/perio/`, under the S9 notes and in Review): Fig 6 `excess` (pseudopocket or drug enlargement,
  then hygiene or a gingivectomy), Fig 7 `clsteps` (crown lengthening step by step, or a gingivectomy alone that grows back),
  Fig 8 `smile` (the esthetic checklist on an ideal smile and Patient 1 before and after); the About page's Perio diagrams
  entry lists 15. Dr. Kaur's word for her part of the final (peri-implant health, mucositis and peri-implantitis) is a
  line on Home's final card. ([hub note](vault/hubs/perio.md))
- **2026-11-14 (Lessons refresh follow-up, Claude Code, same PR)** — Sam: "do another sweep", then the calls below. **Special Patient
  Care is off the site** ("remove everything for it"; no recap, no retrospective): `hubs/special-patient-care/` (page, audio, images)
  deleted, its precache line out of `sw.js` (`VERSION` sh-v59), its arcade board out of the dashboard's `ARCADES`, its `HUBS` entry
  moved to `ARCHIVED_HUBS` (no card, no check-in), its About page entries out (the arcade table's column, Home, check-ins, filters,
  pins), `next/hubs.js` and Timmy's `site.json` rebuilt, its perf budget and accessibility baselines dropped; its question-id list and
  drawn art stay, and a stub in `LESSONS.md` says why it has no retrospective. **The Question Bank shows more at a time**: 100 a page
  in every single-file hub (`BANK_PAGE`, was 30; opening the bank on a throttled phone: about 0.2-0.3 s against 0.15 s) and 50 in
  the redesign's bank (`widget/hub-bank.js`, was 20; bundles rebuilt). **Occlusion `in-bennett`**: "Cusp height" became "How
  steep the cusps can be in protrusion" (data fix after the merge). The sweep found no new reports, no new question-health flags
  on the live hubs and the live site identical to `main`; it closed the finished Heme & Endo Exam 2 L17-L18 task and added a 9th
  check-in to that hub's retrospective.
- **2026-11-13 (Lessons refresh, Claude Code)** — `/lessons-audit`, data read 9 pm Central, the evening of Heme & Endo Exam 2.
  **Heme & Endo Exam 2 is archived** (10 pm tonight): its retrospective is in `LESSONS.md` (86 people and 360 h, the most of any hub;
  9 check-ins, 5 "About right", none "Exam asked different things"), its recap went up on the dashboard (`tools/publish-recap.js`),
  and its narration, High yield recordings and Timmy Time came off the site (232 MB; the site is 533 MB): `data-audio="off"` on its
  widget tag, its `next/` content rebuilt with no `hyAudio`. **Occlusion**, three days before its final: reports #42 (`dn-support`,
  the stem now asks which force a complete denture's support resists) and #43 (`dn-resorb-mand`: "less
  bone, but a bigger arch" in the explanation and whys, the stem asks about the arch's outline), and `in-bennett` (54% picked "Cusp
  height", which the midterm's determinants table supports for Bennett movement: that choice became "How steep the cusps can be in
  protrusion", and its 9 old picks are cleared by `tools/data-fixes/2026-11-14-in-bennett.sql` after the merge). Ids, keys and
  choice order unchanged, so the class's picks on the other choices stay right; no
  High yield text changed (checked with `tools/hub-next/build.mjs`). Occlusion's page was 93 bytes under its 1480 KB budget on `main`,
  so the new wording is trimmed to fit (`tools/release/perf.js`: 1,516,026 bytes, 1480 KB). In `tools/ci/smoke.js`, the redesigned-page checks skip a hub whose exam
  has passed (the release never switches one in) and the live click-through waits for "This hub is archived" on an archived hub:
  Heme & Endo Exam 2 counts as archived on a UTC runner from 4 pm Central 11-13, and every all-hub run failed on it (BUG-131).
  **The redesign's new dashboard** (not live): on a phone, two closed hubs sat side by side and made the page 434 px wide on a 390 px
  screen (BUG-130); `widget/dash.css`'s phone rule now wins (one column), `site.bundle.css` rebuilt, and the smoke test's sideways
  check counts a layout wider than the screen.
  Special Patient Care's retrospective waits for Canvas to close (Sat 11-14).
- **2026-11-13 (the redesign's bundles, phase 5 part 2, Claude Code)** — Nothing students see changes: the live
  dashboard and hubs load exactly the files they loaded (the smoke test fails if one asks for a bundle). A redesigned
  page (`next/`, `hubs/<hub>/next/`) now loads the widget as **built files** instead of one request per source file:
  `widget/hub.bundle.js` or `widget/dash.bundle.js` with the page, then `widget/rest.bundle.js` (a slim database
  client, 23 KB gzipped where the full one is 55, and the widgets every page shares) and, on a hub,
  `widget/hub-rest.bundle.js` (`v3.js`, `v3.css` and what v3.js loads); one stylesheet, `widget/site.bundle.css`; no
  font from another site (`assets/fonts/vt323.woff2` for the 8-bit code; the new dashboard's saved recap image is in
  Nunito Sans). **The bundles are generated and committed: after changing a widget file listed in
  `tools/bundle/bundles.json`, run `node tools/bundle/build.mjs` and commit both** (CI's `--check` fails on a stale
  one). `widget/v3.js`'s thirteen script loaders are one function, `widgetFile()`; on a live page it does what they
  did. `tools/release/perf.js` now measures a page's whole load (it stopped 3 s after the load event and missed about
  a third of a new hub: BUG-128), and the redesign's budgets are set on it: the new dashboard 22 requests and 416 KB
  to 9 and 332 KB, a new hub 28-29 requests to 11 and about 100 KB lighter. How it works:
  [vault/reference/bundles.md](vault/reference/bundles.md); for the release:
  [the release note](vault/tasks/done/2026-11-06-redesign-release.md), "From phase 5, part 2"
  ([phase 5](vault/tasks/done/2026-11-05-redesign-phase-5-backend.md), PR #358).
- **2026-11-13 (the game layer's wiring, phase 4 session 8, Claude Code)** — Nothing students see changes: every new call
  runs only on a page on the game layer (`shGame.v2()`), which no live page is, and the smoke test plays two arcade games
  and Timmy Time on a live hub with this change's files and with `main`'s and fails unless the calls are identical. On
  the redesign's pages, once migration_v54 is applied: **the arcade** starts and finishes a session per game
  (`xp_session_start` / `xp_session_finish`: the +50, and the server posts the score, so no `submit_arcade_score`), its
  answers carry the session, and the toast says "<game> finished: +50 XP." (`widget/games.js`: `shGames.played`, `over`,
  `session`, `ran`; a hub's own games get the hooks from `tools/hub-next/build.mjs`'s `gameHooks`, so the three hubs'
  `next/content/arcade.js` were rebuilt); **Timmy Time** sends each minute heard as `pod_minute_v2` and its XP reaches the
  pill (`widget/podcast.js`, `sh:pod-paid`, `widget/hub-rewards.js`; minutes sent kept in `sh_pod_min:<hub>:<episode>`);
  **the admin page's Inbox** reads `get_reports_v2` and resolves as "Fixed" (+100 to the sender) or "No change needed"
  with `admin_resolve_report_v2` (`review/index.html`), today's Inbox without them. The preview answers all of it
  (BUG-122: its made-up reports now stay resolved). Neither pending migration was applied or changed. Left for the
  release: the episode lengths (`admin_set_podcast_episode`: 2688 s and 3101 s) and `sw.js` (no new file).
  [The task](vault/tasks/done/2026-11-12-redesign-game-layer-wiring.md), [#357](https://github.com/smcmurry6-source/study-hubs/pull/357).
- **2026-11-13 (the trophy case and the cards, phase 4 session 6, Claude Code)** — One live fix (Sam: "ship the BUG-116 live fix
  too"): after a level-up card, later cards (a rank-up, a trophy, a medal, a mock result) play again; until now none
  did until the page reloaded. Otherwise nothing students see changes: the live hubs and dashboard keep 24 trophies, Full Arch, the old Stats panel and today's cards. On the redesign's pages
  (`html.shx`): **the trophy case** (`widget/trophies.js` + `widget/trophies.css`, `window.shTrophies`; its drawings in
  the new `widget/hub-art/trophies.js`, `window.SH_TROPHY_ART`, 128 KB, 23 KB compressed, built by
  `tools/figures/site/build.mjs`), all three fetched on first use through `widget/ranks.js` (`trophyCase`, `trophyCss`,
  `trophyStats`). 27 trophies, 16 secret: the rank on top with the road ahead, a showcase stand, a cabinet with "Won by
  studying", "The journeys" and "Secrets" shelves, and "Full Arch (retired)" only for someone who won it. In a new hub's
  More, Stats and trophies (with the rest of that page redrawn: a scoreboard, a card per lecture, the achievements as
  rosettes; Sam: "make it more epic") and from the new dashboard's "you" card. **The cards** (`widget/rankup.js`) in
  the new look: drawn trophies, the class share and a "what's next" line, Timmy's place pieces on a rank-up; they wait
  for their styles and drawings (2.5 s at most). **Full Arch retired** on the redesign (`ARCH_OFF` in `widget/eggs.js`,
  out of the Extras and both trophy lists). Found: BUG-116, a level-up card stopped later cards (fixed everywhere, above). Tests: the smoke test's trophy-case block, `a11y.js`'s case and
  card. [#356](https://github.com/smcmurry6-source/study-hubs/pull/356), [the task](vault/tasks/done/2026-11-12-redesign-trophy-case-and-cards.md).
- **2026-11-13 (Visit someone random, from the whole class, Claude Code)** — Nothing students see changes (the new
  dashboard, on the game layer). Sam: "i want random to be for the whole class". A new pending migration,
  **`migration_v57.sql`** (`get_random_place`; `migration_v54.sql` unchanged), picks on the server from everyone a place
  can be opened for, never you or your linked device, and gives the place and its key, never an id; the class comes
  round once before anyone twice (`p_skip`). Applied at the release after v56 (listed in
  `supabase/pending-migrations.txt`). `widget/dash.js` (`visitRandom`, `getRandom`, `placeOf`), `widget/place.js` (a
  `nav` with `more()`: Next rolls the die in the clouds, then the name; Previous goes back through the trip),
  `widget/place.css`, the preview's stub. Without the function the button picks among the board's rows as before.
  Then Sam: "skip people with zero customization" (only places with something chosen; "No one else has decorated their
  place yet" when none) and a **number badge for the top ten** on a visit (gold, silver, bronze, then purple to #10).
  Tests: `xp.js` 14a, `rls.js`, the smoke test's random trip, the badge, nobody customized and the fallback.
  [Visiting](vault/tasks/done/2026-11-12-redesign-visiting.md), [game-server](vault/reference/game-server.md), [#355](https://github.com/smcmurry6-source/study-hubs/pull/355).
- **2026-11-13 (visiting's tour, Claude Code)** — Nothing students see changes (the new dashboard, on the game layer).
  Sam: "build the random visit and next/back", the rest of round 3's visiting. **Visit someone random** under the board
  picks one of its rows (never your own); in a visit, round arrows go to the previous and next person on that board and
  **Back to mine** goes home, each through the round-3 clouds, one window giving way to the next under them; the guest
  card says where on the board you are. `widget/dash.js` (`visitList`, `visitNav`, the die button), `widget/dash.css`,
  `widget/place.js` (`open({ nav, covered })`, `hop()`), `widget/place.css`. Nothing on the server (a key still comes only
  on a board row). Tests: the smoke test's visiting block walks a tour (next, a place that can't be read, Back to mine,
  focus) and a random visit. [Visiting](vault/tasks/done/2026-11-12-redesign-visiting.md).
- **2026-11-13 (visiting, phase 4 session 4, Claude Code)** — Nothing students see changes: it runs only on the new
  dashboard (`next/`), on the game layer (the `_v2` boards' visit keys and `get_place`, migration_v54, not applied and
  not changed). A row of Ranks or Study streaks, each of the stage's top three and a winner's Timmy on the stage open
  that person's Timmy's place; your own row opens yours. `widget/dash.js`: the name is a button (`data-dash="visit"`,
  "Visit <name>'s place"; the key stays on the row) stretched over the row in `widget/dash.css`; `getPlace()` asks
  `get_place` once a page per person and `loadFits` shares it; a null place or a failed call is one plain line on the
  row; closing gives focus back to the row. Sam, seeing it: "this window should be more epic": `widget/place.js` and
  `place.css` open a visit in the leaderboard's theater look (dark in both themes, "Welcome to" over the name in gold,
  chasing marquee bulbs, a gold-framed stage under spotlights, a guest card
  with their rank drawn big and their medals) and count `place:visit`; your own place is unchanged. Then "there should
  be a clouds animation" ("i already approved a cloud animation before"): a visit plays the design page's trip through
  the clouds, ported as approved in round 3 (soft clouds over the whole screen, "Off to <name>'s place", then they
  scatter; none with reduced motion). The preview's
  classmates have places of their own (one a ModuPro, one that can't be read), one rank on every board, and your own
  row stays on the rank board below the top ten. Tests: the smoke test's "visiting" block, `a11y.js`'s boards and
  visited place (light and dark, zero issues, in the baseline). BUG-112 (`widget/ranks.js`'s "+1" medal button's name,
  shared with the live pages) waits for the release. [Visiting](vault/tasks/done/2026-11-12-redesign-visiting.md).
- **2026-11-13 (faster CI, Claude Code)** — Nothing students see changes. Sam, after #349 waited most of an hour while
  `main` moved three times: "merge now, then do 1 and 2 in their own PR". (1) **Parallel jobs.** "Check hubs" is now
  `scope`, `fast` (the fast checks and the database suites), `smoke (desktop)` and `smoke (phone)`
  (`SMOKE_PART=desktop|phone` in `tools/ci/smoke.js`; a local run still does both halves) and `check`, the one result to
  read. "Release tests" is `scope`, one `suite (...)` job each for accessibility, performance and the admin page, one
  per browser for the device matrix, and `release`. Release tests no longer repeats Ask Timmy's suites, which Check hubs
  runs. (2) **A notes-only change keeps the green result.** New `tools/ci/reuse.js`: on a PR, when every file that
  changed since a run whose long jobs passed is a `.md` file (or `.obsidian/`), the long jobs are skipped and the run's
  summary links the run it kept. The comparison uses the merge commit being tested, so code that came in from `main`
  still runs everything; a run that kept a result is never itself kept. (3) A stale run steps aside: Check hubs cancels
  an older run of the same PR, and Release tests' scope starts no suite when a newer push has come in (it had cancelled
  the head's suites once that day). `RELEASE_TEST_PLAN.md`, [verify-before-pushing](vault/how-to/verify-before-pushing.md)
  and [long-tests-once](vault/rules/long-tests-once.md) say so. Measured on #351: Check hubs about 7 minutes (was about
  13) and Release tests about 5 (was about 17), both at once; a notes-only commit about 3, its long jobs kept.
- **2026-11-13 (the bowling egg, phase 4 part D, Claude Code)** — Nothing students see changes: it runs only on the
  redesign's pages, with no XP and nothing on the server (neither pending migration touched). The eight clips drawn in
  #291 (never merged, closed) carried over unchanged as `tools/figures/site/bowling.mjs`, built into
  `widget/hub-art/bowling.js` (`window.SH_BOWL`) and the design page's "The bowling egg" section (with the Bowling
  trophy, "Lane Legend", drawn in `medals.mjs` as `EGG_TROPHIES.bowling`). New `widget/bowling.js` (`window.shBowl`,
  fetched at the first strike or the first tap on the lane): a small card docked at the bottom, 3 to 5 seconds, a tap
  or Esc closes it, the still and its word with reduced motion, queued behind rank-up and trophy cards. The run of
  first-try right answers is counted in the engine's answer path (`widget/hub-rewards.js`, kept on the device across
  hubs): strikes at 50 and 100, the turkey at 150; not in the mock or the arcade, nor with the eggs off or in Focus
  mode. The bowling lane at Timmy's place plays a random clip (`widget/place.js`). Sightings and the trophy are kept
  on the device. Tracked as `egg:bowling=<clip>`. Tests: the smoke test (the run, strike, retry, miss, turkey, mock,
  eggs off, Focus, reduced motion, the lane, a live hub untouched), `a11y.js` (the clip card). BUG-110 and BUG-111
  found and fixed in testing.
- **2026-11-13 (Ask Timmy part 4, "Timmy everywhere", phase 4 session 3, Claude Code)** — Nothing students see
  changes: only the redesign's pages pass the new option. `widget/pet.js` takes `mount({ everyone: true })`: no
  adoption (a first visit sets `sh_pet_born` to today and sends the `pet-adopt` badge; linked devices keep the earliest
  day), no introduction or "Tap me!", one hello instead; a Timmy met on or after `FULL_FROM` (far future until the
  release sets it) starts at 100 HP, and Pearly Whites then needs a day under 100 first; he wears only the shop outfit on
  at his place (the v2 bootstrap's `shop.equipped.outfit`), never a holiday's, nothing when nothing is on: on the bar, the
  dashboard's card, the chat's avatar, his place, the classroom (`fit()` is the outfit's id) and the stage. The drawing
  is kept on the device (`sh_pet_outfit`); `widget/hub-art/outfits.js` loads only after the first scroll, tap or key,
  when the outfit on isn't the kept one. `shPet.setOutfit()` (called by `widget/place.js` when the outfit slot changes).
  `widget/v3.js` loads and mounts him for everyone on `data-game="v2"` pages and resends the presence on `sh:pet-fit`;
  `widget/dash.js` mounts with `everyone` and drops the porch line; `widget/hub-timmy.js` drops the adoption waits
  (Timmy's place and the shop for everyone); `widget/ask.js` no longer waits for adoption. The preview: `FULL_FROM` is the
  test account's start (`tools/preview/transform.js`, the runtime's `SH_PREVIEW_TIMMY_FROM`), and "returning" wears the
  sun hat. `tools/ci/smoke.js`: "everyone has Timmy" on a new hub and the new dashboard, and the live hub and dashboard
  as before; the Ask checks turn Timmy off first. `tools/podcast/LORE.md`: from the redesign on, the student dresses him.
  [Ask Timmy](vault/tasks/done/2026-11-12-redesign-ask-timmy.md), [ask-timmy](vault/reference/ask-timmy.md).
- **2026-11-12 (Timmy's shop, the client, phase 4 part B, Claude Code)** — Nothing students see changes: the shop
  runs only on the redesign's pages, on the game layer (`migration_v54.sql`, not applied, unchanged). New
  `widget/shop.js` + `widget/shop.css` (`window.shShop`, fetched on first use): the storefront with the balance, Today's
  showcase, Today's picks, This week, Back for today, the seasons' sets, Spotted (the rare costumes) and Always here;
  an item's sheet with Buy, every refusal's line, one request id per sheet, "Put it on" / "Place it" into the
  customizer. Opened from a new hub's More (`widget/hub.js`, `widget/hub-timmy.js`), the new dashboard's "you" card
  (the balance and a Shop button, `widget/dash.js`/`.css`) and the place's "Get more in the shop" (`widget/place.js`).
  `widget/pet.js`: on the game layer only, snacks' HP from `get_pet_days_v2` count in `simulate()`, and
  `refresh(true)` reads his days again; live pages compute HP exactly as before. The rare costume of the day. The
  preview sells the catalog read from the migration and answers `buy_item` in the server's order of checks. Tests:
  the smoke test (the shop on a new hub and the new dashboard; a live hub never asks for it), `xp.js` (367 checks:
  the preview's purchases against `sh_buy`, the costume of the day over three years), `a11y.js` (the shop, its sheet,
  dark mode; no issues). BUG-098 to BUG-104 found and fixed in testing.
- **2026-11-12 (Learn and Flashcards, Claude Code)** — Nothing students see changes yet: the redesign's Question Bank gets
  **Study as: Questions · Learn · Flashcards** ([the task](vault/tasks/done/2026-11-06-redesign-learn-and-flashcards.md)), in
  the three new hubs only. Learn asks the panel's questions in rounds of 7 until each is right twice (the second time
  without the choices when the question allows it), with a bar that fills, a round track, praise and a streak, and a
  round recap (Sam asked for it to feel like Quizlet's). Flashcards turn over and are rated Again, Hard, Good or Easy on
  an Anki-like schedule that ends on exam eve; Home shows "n flashcards due". `widget/study-modes.js` + `.css` load the
  first time either is opened. The server part is a new pending migration, `migration_v56.sql` (`card_reviews`,
  `record_card_v2`, `reset_my_learn`, `get_my_cards`, a `card` award: a flat 2 XP for a due or new card's first three
  ratings a day), applied at the release after v54 and v55, which are unchanged; `xp.js` and `rls.js` check it, the
  preview answers it. Two icons (`learn`, `cards`), approved by Sam from a contact sheet. `widget/qhealth.js` and
  `widget/v3.js` gain two hooks nothing on a live hub calls (`shQH.rate`, `window.shNoteJump`).
- **2026-11-12 (Ask Timmy's admin tab, part 3, Claude Code)** — Nothing students see changes: the admin page
  (`review/index.html`) gets an **Ask Timmy** tab for [Ask Timmy](vault/tasks/done/2026-11-12-redesign-ask-timmy.md): figures for
  the range, by hub and by day (questions, estimated cost, not covered, declined, errors, thumbs, quotes, reports), his
  switch and daily limits (Save asks first, then `admin_timmy_config`), the answers students reported, the questions the
  notes don't cover, the quotes that didn't check out and every chat, each opening in place; the Inbox links a Timmy report
  to its chat. Every student's or Timmy's word is drawn as text, and no visitor id is drawn. migration_v55 isn't applied
  until the release, so until then the tab says Ask Timmy starts then. The preview answers the `admin_timmy_*` calls with
  made-up chats and can show a page as it is before a migration (`missing` in its settings); `tools/release/admin-ui.js`
  covers the tab (and its Hubs form touch-target check now measures the form, which it hadn't been). How it works:
  [ask-timmy](vault/reference/ask-timmy.md).
- **2026-11-12 (the redesign's shop, session 1: its art; Claude Code, #339)** — Art only: no client code, nothing
  students see (the redesign isn't live), `migration_v54.sql` unchanged. New `tools/figures/site/shop.mjs`, built by
  `build.mjs` into **`widget/hub-art/shop.js`** (`window.SH_SHOP_ART`, 11.4 KB compressed, loaded by no page yet): the
  Shiny Gold Crown coin (`coin(px)`, with its own cut for 16 px), thumbnails for the four snacks and two boosts
  (`thumb(id)`), and the five rarity frames (`frame(rarity)`), which moved here with the coin from the place's kit
  (`SH_PLACE.frame`, `.coin`, `.RARITIES` are gone; nothing used them). **Ten new outfits** in the kit's `OUTFITS`
  (`tools/figures/site/place.mjs`), keyed by the shop's ids: the five everyday ones that had no drawing (BUG-090:
  scrub cap, bow tie, safety glasses, white coat, graduation cap) and the five rare costumes (pirate, astronaut,
  detective, chef, Captain Enamel; `costume: true`, three lines each). **Timmy's door spot moved in all 22 homes**
  (BUG-089) so he no longer hides the rank statue, with the yard's left spot, the path's lamp and nine statues.
  `tools/release/xp.js` now fails on any catalog piece without a drawing and checks the shelf's thumbnails against
  the catalog (358 checks). The design page shows them ("The shop's own art: the coin and the shelf", "The shop's ten outfits");
  `node tools/figures/site/shop-sheets.mjs <dir>` makes the contact sheets. **The shop's look, "more epic"** (Sam,
  after the sheets): the design page's shop is redrawn as a storefront (Timmy at the counter under an arch of light;
  `SH_SHOP_ART.store()`), "Today's showcase" (`stand()`) and shelves whose cards fill them, with Spotted and Always
  here; the client session builds the page to it. Left open: BUG-095. Hand-off for
  the shop's client session: `vault/tasks/2026-11-06-redesign-timmy-shop.md`, "What session 1 built".
- **2026-11-12 (Ask Timmy's chat, part 2, Claude Code)** — Nothing students see changes yet: the chat half of
  [Ask Timmy](vault/tasks/done/2026-11-12-redesign-ask-timmy.md), in the redesign's pages only. `widget/ask.js` + `ask.css`
  (a bottom sheet on a phone, a side panel on a laptop) open from Timmy's "Ask me" (his bubble, the dashboard house), from
  an Ask icon in his spot when he isn't shown (a hub's bottom-left corner, the dashboard's "you" card; a plain "Ask the
  hub" voice), and from "Ask Timmy" on an answered question card (`widget/hub-bank.js`). Answers draw as text with "From
  the notes" links to the paragraph, thumbs, Report (`timmy_report`), and drafted reports and ideas the student edits and
  sends (an idea posts as `board`: neither pending migration is changed). Paused during a mock,
  off on an archived hub. `widget/pet.js` adds "Ask me" only where `window.shAsk` exists, so the live hubs' Timmy is
  unchanged. The preview answers the function with canned replies; `tools/ci/smoke.js` checks the chat on every new hub
  (phone and laptop) and the new dashboard. How it works: [ask-timmy](vault/reference/ask-timmy.md); release steps and
  the About page's entries: [the release](vault/tasks/done/2026-11-06-redesign-release.md). Parts 3 (the admin tab) and 4
  (everyone has Timmy) are next.
- **2026-11-12 (the rest of the redesign's phase 4, planned: vault only, Claude Code)** — No code and nothing students
  see. Sam answered one list of calls, and what is left of phase 4 is now ten sessions in order, each with a build
  spec a fresh session can follow (files to touch and not to, the calls and their shapes, the preview's made-up data,
  the request budgets, the tests to add, what is out of scope, a Done when and an opening prompt):
  `vault/tasks/2026-11-05-redesign-phase-4-game-layer.md`, "From here to the release". New task notes: visiting, the
  trophy case and the cards (phase 4's first goal, found unbuilt), the game layer's wiring. Sam's calls are in
  `vault/decisions.md`; the biggest: Timmy wears only what the student put on ("if someone doesnt have a costume
  applied, they are naked"), the five undrawn outfits are drawn, the bowling egg uses the clips already drawn on
  #291, `migration_v54.sql` is not changed (`vault/reference/game-server.md` lists where the client works around it), and
  the Full Arch chart and its trophy are retired with the redesign. #335 (Timmy's place) was merged in the same session.
- **2026-11-12 (the redesign's Timmy's place, client side: phase 4, part C, Claude Code)** — Nothing students see
  changes: it runs only on the new pages (`hubs/<id>/next/`, `next/`, shown in a preview), `widget/pet.js` is
  untouched, and migration_v54 is still **not applied** and wasn't changed. New: `widget/place.js` + `widget/place.css`
  (`window.shPlace`: the place as a card and a full view, Timmy's hops, wave and bubble, his health in how he moves,
  the medal board's big view, the rank statue with the ModuPro and Timmy's loupes in the later journeys, and a
  customizer that saves each change through `equip_item`), its kit `widget/hub-art/place.js` and one file per set in
  `widget/hub-art/place/` (generated by `tools/figures/site/build.mjs`). All of it loads on first use: a new hub from
  More, "Timmy's place"; the new dashboard on the first scroll, tap or key (its "you" card shows a still kept on the
  device until then, because the page is at its request budget). `widget/hub.js`, `widget/hub-timmy.js`,
  `widget/dash.js` and their styles carry the wiring and flame levels 4 and 5. The preview answers `get_my_shop`,
  `equip_item` and `get_pet_days_v2` from made-up data. `tools/release/xp.js` now checks the client against the server
  as written (the customizer's rules against `equip_item`, the place's seasons against `sh_shop_seasons`, the kit's ids
  against the catalog) and found one gap: five everyday outfits in the catalog have no drawing
  (`vault/tasks/2026-11-12-five-outfits-without-a-drawing.md`, Sam's call). Hand-off for the shop and the bowling egg:
  `vault/tasks/2026-11-05-redesign-phase-4-game-layer.md` (Log). About-page and lore lines are drafted in the release
  note and land at the release.
- **2026-11-12 (Occlusion L10: Occlusion and the Periodontium, Dr. Abou-Arraj; L9 checked against Dr. Lawson's slides, Claude Code)**
  — Sam: "i just added the last occlusion materials to the folder" and "yes to all figures and anima". **L10 `occtrauma`** (the first
  hour of the 11/12 session; `nov 12 occ.txt` and `Dr. Abou-Arraj Occlusion and Periodontal Correlations.pdf` in Drive, not in the repo),
  the last lecture on the final: notes at both levels, 59 questions (`ot-*`, `cs-ot-*`) in every format with every choice's why,
  three Patient Box cases (`otcrown`, `otperio`, `otfrem`), 19 hints, 11 likely topics, Review, cram, sort sets `primsec` and
  `otsigns`, two side-by-side rows, tag `plum` (a tenth tag color), the mock at 9 each from L6-L10, and the exam card, timeline,
  banner, Home notice and dashboard card. His mobility degrees differ from Dr. Givan's L7 handout: L10's questions say "on
  Dr. Abou-Arraj's scale", and the notes, Review and `mo-miller2` point out the difference. Five figures (`tools/figures/occlusion/anima/`,
  in the notes at both levels and in Review): Fig 27 `otsupport` (primary vs secondary, the fence post), Fig 28 `otjiggle` (unilateral
  vs jiggling, the hourglass), Fig 29 `otxray` (the radiographic signs on a film), Fig 30 `otmobility` (degrees 0-3 to scale, fremitus)
  and Fig 31 `otanimal` (the 1970s animal experiments); Figs 27, 28 and 30 share `anima/l10tooth.mjs`. **L9** checked against
  `Dr. Lawson Non-carious cervical lesions.pdf`: RDA below 250 for the seal, the sensor, acid vs plaque sites, the drinks' pH and
  bicarbonate, mouth rinses, the summary slide; `nc-rda-seal` and `nc-erosion-sites` are new; the "Recording" badge is gone. Narration:
  L10 and L9 at all three levels from `next/content/notes.json`; the lexicon gained Abou-Arraj, Waerhaug and others. The new
  Occlusion's hint headings say "the professors". About page: an L10 sentence in Diagrams. Occlusion's page is 1470 KB over the
  wire, so its budget went from 1395 to 1480 KB (BUG-087; Sam's "merge when ready"). The site is 760 MB, past `size.js`'s 750 MB warning; no
  archived hub still has audio. Task: [done](vault/tasks/done/2026-11-10-occlusion-l9-follow-ups.md).
- **2026-11-12 (Ask Timmy's server, part 1, Claude Code)** — Nothing students see changes yet: this is the server half of
  [Ask Timmy](vault/tasks/done/2026-11-12-redesign-ask-timmy.md), which goes live with the redesign. The Supabase Edge Function
  `timmy` (`supabase/functions/timmy/`: the logic in `core.js`, the Deno wrapper in `index.ts`, the site help in
  `site.json`, built from the About page by `tools/timmy/build.mjs` with the spoilers left out) answers from a hub's own
  notes, review tables, cram sheet, Exam Hints and High likelihood topics with Claude Opus 5.5, every point linked to the
  paragraph it came from and every quote checked against it; it declines graded quiz questions and unanswered practice
  questions, offers a report or an idea-board post, and naps at 40 questions a person a day or the site's $10 a day.
  `migration_v55.sql` (pending until the release, with v54) stores the chats and adds the students' calls (history,
  thumbs, what they did with an offer, and the Report button Sam asked for, which sends a usual report the Inbox answers)
  and the admin tab's reads. Tests: `tools/timmy/test.mjs` (paragraph links against the engine's own numbering in
  Chromium), `tools/release/timmy.js` (the database), and `tools/timmy/eval.mjs` with a 134-case test set (`--dry` in CI;
  the real-API run, all 134 cases for $11.71, passed once its fixes were in: choices named by their words, not letters,
  since the card shuffles them; a short exam fact quotable whole). How it all works: [ask-timmy](vault/reference/ask-timmy.md).
- **2026-11-12 (the redesign's three journeys, client side: phase 4, part A, Claude Code)** — Nothing students see
  changes: it runs only on the new pages (`hubs/<id>/next/`, `next/`, shown in a preview) and only once the database
  has migration_v54, which is still **not applied**. The rank ladder becomes three journeys (Handpiece, then the
  ModuPro at 125,000 XP, then the Loupes at 250,000). New: `widget/journeys.js` (the hand-off to the next journey and
  the Dark Matter unlock, two full-screen scenes with a still card for reduced motion, and the road ahead) and
  `widget/hub-art/journeys.js` (the ModuPro and the loupes drawn in the handpiece's medallion, from
  `tools/figures/site/journeys.mjs`), **both loaded on first use, never with a page**. **Shared files changed, inert
  for the live hubs**: `widget/v3.js` has a switch, `data-game="v2"` on its script tag (only the engine writes it):
  with it, the page asks for the v2 bootstrap and sends each answer as one `record_answer_v2` call, falling back to
  today's calls while the function isn't there; without it nothing differs. `widget/ranks.js` draws and names a rank
  past the Handpiece only for a v2 profile, and its `art()` without a shape is byte for byte what it was;
  `widget/rankup.js` takes the journey's object for its cards. The engine (`widget/hub-rewards.js`, `hub-bank.js`,
  `hub.js`) shows XP by the new rules when the game layer is on (no daily cap, double XP after a mastery medal as a
  chip on the rank pill), runs a mock inside a server session and shows the road ahead in More, Stats; the new
  dashboard (`widget/dash.js`) knows the journeys. The preview answers the new calls from made-up data and takes
  `?xp=<n>`. **Before changing how an answer is recorded, or the rank art, read
  [the journeys note](vault/tasks/done/2026-11-06-redesign-progression-journeys.md) and
  [game-server](vault/reference/game-server.md).** Left for the release, written in
  [its note](vault/tasks/done/2026-11-06-redesign-release.md): the arcade's and Timmy Time's XP, the journey trophies in
  the trophy case, the About entries (drafted there).
- **2026-11-12 (High yield narration for the redesign, Claude Code)** — Nothing students see changes until the redesign's
  release. The notes' third reading level, High yield, now has Kokoro narration like the other two: `<lecture>-hy.mp3` and
  its word timings for all 21 lectures that have it (Heme & Endo Exam 2's 8, Occlusion's 4 final lectures, Perio's 9; Sam
  asked for Heme & Endo too though it archives Nov 13), 148 MB at 64 kbps (about 5 hours 20 minutes); the site is 738 MB of the 1 GB limit, under `size.js`'s 750 MB warning. `tools/narrate.py` reads the
  redesign's `notes.json` (`--level hy`), says a topic's number as "Topic 2." and the "·" as a pause, stamps each words file
  with the text it was spoken from (`"h"`), and spreads lectures over `--jobs` longest first. `tools/hub-next/build.mjs`
  lists in `notes.json`'s `hyAudio` the lectures whose recording matches today's High yield, and only those get the
  recording (with Follow along) in `widget/hub.js`; the rest read in the device's voice, so a stale one never plays.
  `tools/ci/smoke.js` fails on a recording made from another version of a lecture's High yield and checks the page offers
  exactly the listed ones. The drift rule now covers High yield: it changes whenever a lecture's notes, predicted topics,
  hints or questions do, so a question edit on these three hubs can mean recording that lecture's High yield again in the
  same PR ([rule](vault/rules/text-and-audio-never-drift.md), [task](vault/tasks/done/2026-11-12-high-yield-narration.md)).
- **2026-11-12 (the redesign's hub engine split into four files, Claude Code)** — Nothing students see changes: only the
  new hubs (`hubs/<id>/next/`, shown in a preview only) load the engine, and no live file changed. `widget/hub.js` was
  one 188 KB closure; it is now the core (`widget/hub.js`, 116 KB) and three parts, each holding what one kind of
  session changes: `widget/hub-rewards.js` (the answer path, XP, the rank, the bar's meters, Today, the recap),
  `widget/hub-timmy.js` (what the engine asks of Timmy) and `widget/hub-bank.js` (the question card, the bank, the
  mock). **A new hub's page loads all four, deferred, the core last**; the smoke test fails a page that doesn't. The
  parts share the core's names through one object, `HX` (how: the top and the end of `hub.js`). Before editing the
  engine, find the function's file first (`grep -n "function name" widget/hub*.js`). Three more requests a page (20,
  20 and 18 against budgets of 21, 22 and 21, not raised). No behavior change: the same scripted visit on `main`'s copy
  and on the split gave identical pages and saved state at all 368 steps. Hand-off for parts A to D:
  [phase 4's note](vault/tasks/done/2026-11-05-redesign-phase-4-game-layer.md). ([#330](https://github.com/smcmurry6-source/study-hubs/pull/330))
- **2026-11-12 (archived hubs' audio off the site, Claude Code)** — The site was 958 MB of GitHub Pages' 1 GB limit, 909 MB
  of it mp3s. Sam kept the bitrates (narration 64 kbps, Timmy Time 96 kbps) and made it a standing rule that an archived
  hub's narration and Timmy Time come off the site ([rule](vault/rules/archived-hubs-drop-their-audio.md)). Done now for
  MSK Exam 3 and 4, PCD Fixed Pros Exam 3, Heme & Endo Exam 1 and PCD Implants Exam 1: 83 mp3s, 368 MB, site 958 → 589 MB.
  Their pages stay up. `widget/v3.js` reads `data-audio="off"` on a hub's widget tag: Listen reads in the device's voice
  without requesting the missing file (voice picker included), Timmy Time isn't loaded, and `widget/v3.css` hides the hub's
  Timmy Time links (`html.sh-audio-off`). `tools/ci/smoke.js` skips the narration checks for such a hub and fails if any
  audio is left behind; new `tools/ci/size.js` in "Check hubs" prints the site's size, warns from 750 MB and fails from
  900 MB. The next four (Special Patient Care after Nov 13, Heme & Endo Exam 2, Occlusion, Perio) are a
  [to-do](vault/tasks/done/2026-11-12-audio-off-at-archiving.md); the engine's version is a box in the redesign release. The
  High yield narration is no longer waiting for room. About page: Listen and Timmy Time say so.
- **2026-11-12 (Occlusion: `in-locator`'s explanation names the pantograph, Claude Code)** — About half of the people who
  tried it picked "Trace protrusive and lateral paths on six recording tables" as how the hinge axis is found. Its why
  row named the pantograph; now the explanation does too (L6's notes: the kinematic facebow finds the axis, the
  pantograph then records how the jaw moves). Approved on the 2026-11-11 lessons refresh's list; it waited for #319.
  Explanation only; `next/content` rebuilt.
- **2026-11-12 (the idea board, built for the redesign, Claude Code)** — Nothing students see changes: the board is on
  the new dashboard (`next/`) and in the new hubs' More, which only a preview shows, and its server (migration_v54) is
  still not applied. New: `widget/ideas.js` + `widget/ideas.css` (`window.shIdeas`: the board, its post form with the hub
  and the six kinds, votes, Report, Delete, Top / New / Shipped and two filters; and `shIdeas.tick()`, the "Also post this
  on the idea board" box). `widget/dash.js` mounts the board in `#ideas` and puts the tick under the check-in's last
  question (ticked to start; the live `index.html` check-in is untouched); `widget/hub.js` adds the page `#more/ideas`
  and a row under "Talk to us". **Two live files change, both inert until the release**: `widget/v3.js` (the Suggest
  box gets the tick only where `ideas.js` is loaded, which no live hub does) and `widget/replies.js` (it can show an
  idea's status note, kind `idea`, which no server sends yet; `get_my_inbox_v2` only where the page says so). The admin
  page's Inbox has an "Idea board" card (hide, restore, a status with one line on why); until migration_v54 it says the
  board opens with the redesign. The preview answers the board from made-up ideas; the release's starting ideas are not
  posted.
  `tools/ci/smoke.js` draws a made-up board and checks votes, the pickers, that words never become markup and that every
  button has a fixed `data-shi` name. BUG-078 (WebKit only: a "ResizeObserver loop" error on the new dashboard while
  the board's stylesheet loads) fixed in `widget/dash.js`. Sam then asked for a more decorative board, done after
  #318 merged and approved from a contact sheet: **a cork board in a wood frame, every idea a pinned paper note** (the
  paper's color and a picture for its kind, a pushpin in the hub's tint, Sam's answer as a stamp, a rosette on the top
  idea, Timmy looking over the frame, the form as a page of a pad). The drawings are a kit, `tools/figures/site/board.mjs`,
  built into `widget/hub-art/board.js`, which `ideas.js` loads itself. Hand-off: [the idea board's note](vault/tasks/done/2026-11-06-idea-board.md). ([#324](https://github.com/smcmurry6-source/study-hubs/pull/324))
- **2026-11-12 (a standing rule: run the long tests once, Claude Code)** — Notes only. Sam asked why the dashboard's
  merge took two hours; part of it was the agent running the every-hub smoke test again on its own machine each time
  `main` moved. New rule, `vault/rules/long-tests-once.md`: the long suites run once on the finished code, then the
  fast checks and a push, and CI is the check. The dashboard PR (#318) was merged on Sam's word the same day;
  `node tools/release/postcheck.js` after it: passed.
- **2026-11-12 (No approval checkbox: Sam's "merge" is the approval, Claude Code)** — Sam: "Remove the sam approval
  tick stuff entirely. If i say merge, merge. We are adding too many steps." The "Sam approved this release" box is gone
  from the PR template and the test report template, and [preview-and-release-test](vault/rules/preview-and-release-test.md),
  `RELEASE_TEST_PLAN.md` (sections 10-12), `AGENTS.md`, `CLAUDE.md`, ship-a-change, roll-back-a-release, home and the
  redesign task notes now say it: when Sam says "merge", the agent merges (a draft is marked ready first), waiting only
  for checks still running and fixing a failing one first; Sam can still merge it. Nothing in CI read the box.
- **2026-11-12 (A standing rule: anything left to do goes on the to-do list, Claude Code)** — Sam: "make it a standing rule
  to add things like that to a to do so things dont get lost in chats that need to be done. check them off as they are
  done." New rule [to-dos-go-in-the-vault](vault/rules/to-dos-go-in-the-vault.md), loaded in every Claude Code session and
  linked from `AGENTS.md`: deferred, held or blocked work and found follow-ups go in a task note, the inbox or a task's Done
  when (never only in a chat), and are ticked off in the PR that does them. The inbox's done lines are now ticked with their
  PR and cleared on the next pass. Its first entries: the High yield narration task and an inbox line on the site nearing
  GitHub Pages' 1 GB cap; the redesign release's checklist now names every rule it has a draft for.
- **2026-11-12 (High yield: the redesign's notes get a third reading level, Claude Code)** — Sam: "a toggle in the lecture
  notes that only explains the high likelihood/high yield points that are hinted to be tested ... As taught, plain english,
  and high yield", for the redesign only for now. The notes' level switch in the engine is **As taught · Plain English · High
  yield** (`widget/hub.js` `drawNotes`, `widget/hub.css` `.hy-*`) on every lecture with predicted topics: the "What's tested"
  box, then each `LIKELY_TOPICS` topic in order as a numbered heading in the lecture's color, why it's on the list and its
  question count, the Exam Hints' takeaways that go with it ("Know this"), and the paragraphs (or list items) of the As taught
  notes that teach it, with their figures; then the other flagged hints and the "You can skip" ones. Nothing is written by
  hand: `tools/hub-next/high-yield.mjs` picks each topic's paragraphs with the BM25 match "Find this in the notes" uses, each
  of the topic's questions voting for the paragraph that answers it (two at most, a second only where two signals agree; no
  repeats), and `tools/hub-next/build.mjs` writes the result into `notes.json` as `hy` (21 lectures: Heme & Endo Exam 2's 8,
  Occlusion's 4 final lectures, Perio's 9), so CI's `--check` keeps it current. `node tools/hub-next/high-yield.mjs <hub>
  [<lecture>]` lists every pick. In High yield, Listen uses the device's voice, the end-of-notes button opens the lecture's
  High likelihood questions (`notes:practice-likely`), and reading to the end doesn't mark the notes done. The smoke test
  opens High yield on each redesigned hub. **Narration held**: about 135 MB of Kokoro would take the site (960 MB) past
  GitHub Pages' 1 GB cap; Sam chose to hold it ([task](vault/tasks/done/2026-11-12-high-yield-narration.md)). The About page text
  and the rule edits wait in the [redesign release](vault/tasks/done/2026-11-06-redesign-release.md) note;
  [high-likelihood-topics](vault/rules/high-likelihood-topics.md) now says the topics build it.
- **2026-11-12 (Follow along: the redesign highlights the word being read, Claude Code)** — The survey's "highlight the words
  being read when listening to the lecture notes voiceover", approved by Sam for the redesign. While Listen plays a lecture's
  narration in a redesigned hub (`hubs/<id>/next/`), the word being read is highlighted in the notes and its sentence shaded
  more softly (CSS Custom Highlights, `::highlight(sh-read)` / `(sh-read-line)` in `widget/hub.css`: the notes' text and the
  student's own highlights are never touched); the page scrolls to keep it in view while the reader follows along, stops
  following when they scroll away, and jumps to the new place on a seek. A **Follow along** toggle beside Listen
  (`sh_pref_follow`, `notes:follow=on|off`). The times: `hubs/<hub>/audio/<lecture>-<level>.words.json` beside each mp3, for all
  52 narrations of Heme & Endo Exam 2, Occlusion and Perio, made from the recordings by the new `tools/narration_words.py`
  (Kokoro's duration model cut to that output, aligned to each mp3's loudness; median error 20-40 ms, 96-100% of words within
  0.2 s against exact timings). `tools/narrate.py` now writes the file from Kokoro's own timings whenever it renders, and the
  smoke lint fails a redesigned hub whose narration has no words file or one made from another recording.
  `tools/kokoro-setup.sh` installs kokoro-onnx 0.6.1+ and `onnx`. **Live on Perio:** Session 5's narration (both levels)
  is regenerated: its middle (minutes 5-9 Plain English, 6-15 As taught) no longer said what the notes say, found by the
  timings' fit check and confirmed by comparing a fresh rendering minute by minute (`narration_words.py --render`). `widget/v3.js`: `shTTS.audio()` and the `sh:tts-audio` /
  `sh:tts-stop` events for it, and the Listen dock's title no longer repeats a hidden lecture badge ("L11L11 · ...", every
  hub). The About page text waits in the [redesign release](vault/tasks/done/2026-11-06-redesign-release.md) note, like the
  redesign's other features. [Task](vault/tasks/done/2026-11-12-redesign-follow-along.md).
- **2026-11-11 (Lessons refresh, Claude Code)** — Data read 5:30 pm Central, two days before Heme & Endo Exam 2. The 11-10
  evening's six explanation fixes worked (first tries 29% before, 81% since, against the bank's 70% -> 74%), and the Cushing labs
  no longer read backwards (`p1-corticotroph` 1 of 12 -> 6 of 10). Five more Heme & Endo Exam 2 explanations now name the class's
  favorite wrong answer, from the notes: `dm-pb-cpep-2` (the three drugs that still work without beta cells), `mh-wall` (Leydig
  cells sit between the tubules, not in the wall), `mp-e2-role` (inhibin is the brake on FSH), `dm-pb-hf-1` (glipizide has no
  heart failure warning) and `p1-hashi-3` (diffuse hyperplasia is Graves). Perio `q3-S02` (report #41): its explanation now says
  what each statement claims and which of the slide's three numbers belongs to which group. Explanations only: ids, keys,
  choices and their order are unchanged, so no picks move; `next/content` rebuilt for both hubs. `LESSONS.md` Live signals
  rewritten; the PCD Implants retrospective now counts 6 check-ins.
- **2026-11-11 (migration_v54: no visiting opt-out, an idea delete removes the idea, Claude Code)** — Nothing students see
  changes, and the migration is still not applied (it waits for the redesign's release). Sam's two "no" answers on the open
  calls, made in `migration_v54.sql`: **visiting can't be turned off** (`set_visiting`, `pet_visit_off`, `visiting` in
  `get_my_shop`, Link my devices' move of it and `sh_visit_link` are gone; every board row has a visit key), and **an
  author's delete removes their idea completely** (`delete_my_idea` deletes the row; its votes, reports and Inbox notes go by
  cascade, so it no longer counts toward the day's three or the 20 seconds; `hidden_by` has no `self`). `xp.js` (344 checks),
  `rls.js`, `rls-expectations.json`, `rls-audit.sql`, the design page's rank board (no switch, no "Visits off" row) and the
  notes follow. [The open calls](vault/tasks/done/2026-11-11-redesign-open-calls.md) are done.
- **2026-11-11 (Timmy Time: Heme & Endo Exam 2 episode, Claude Code)** — A 52-minute (51.7) last-minute review for Heme &
  Endo Exam 2 (Fri Nov 13): `hubs/heme-endo-exam2/audio/timmy-time.mp3` (37 MB, -16 LUFS), script
  `tools/podcast/heme-endo-exam2/script.md`, from the hub's notes (As taught), Exam Hints (every professor quote word for
  word), cram sheet, `LIKELY_TOPICS` and LESSONS.md's live signals for the hub (the Cushing labs read backwards,
  meglitinides and hypoglycemia, metformin vs the disulfiram reaction, secondary hyperparathyroidism on dialysis,
  follicular carcinoma's spread). 14 chapters: insulin and diagnosis, the non-insulin drugs, primary or secondary and the
  pituitary, thyroid, parathyroid, adrenal, male and female reproductive histology and physiology, a short Exam 1
  refresher, a 31-question lightning round and the sign-off. It follows #320 (merged while it rendered): the refresher
  covers only L2, L3, L6 and L10 and starts with the class's split of the five (two from L2, the synergy pairs, how PTH
  keeps calcium up), the histology segments say the exam's two picture questions are the Sertoli cell and the follicle
  stages, and each of the 11/11 in-class review's 20 questions has its point in the episode. Lecture A, L17 and L18 (not on this exam) are left out; no graded quiz content (Quiz 3 is still open). Where the notes
  give two numbers it says whose is whose. Lore (Sam picked three): thirty-one bought a glucose meter and checks it after
  every meal, yours ("You don't have a pancreas"); Timmy came from a dental follicle too (it made his cementum, ligament
  and the bone around his roots); the Thanksgiving pie is "a postprandial event". Two lore comments (rolled): number
  thirty-one and the toothbrush by the door. `lexicon.json` gains 69 entries (the gliptins, gliflozins and glitazones,
  semaglutide, oxytocin, oophorus, Leydig, Sertoli, Mullerian, Wolffian, Zellballen, sestamibi, Dababneh, Fasinu, and `C-E-A`, `P-S-A`,
  `I-G-A`, `D-A-G`, `S-I-A-D-H`, `type-A`, whose final A read "uh"). Hub: `SH_PODCAST` (id `exam2-review`), card on Home
  under the quick-start row, "Also here" link, `#timmy` opens Home; `next/content/` rebuilt so the new version carries
  it; dashboard card gets `podcast` and "Timmy Time" in modes; About page's episode list and `LORE.md` updated.
- **2026-11-11 (Heme & Endo Exam 2: Exam 2's review questions with twins, the Exam 1 breakdown, the two pictures, Claude Code)** —
  Sam sent the in-class review's 20 PollEv questions: "add these exact questions and then use each question to make a similar
  question with a different option as the answer". All 20 are in the bank as given (`rv-*`, src `review2`, "Exam 2 in-class
  review", one typo fixed), each with a twin (`rv-*-twin`, src `twin`, "Like an Exam 2 review question") keyed on a different
  choice, every choice with its why, all from the hub's notes; each lecture gets an "Exam 2 in-class review (11/11)" High
  Likelihood topic. Sam on the five Exam 1 questions: "2 questions from l2, question on which hormones synergize, and pth
  maintenance": three new R topics (PTH and calcitriol synergize; how PTH maintains blood calcium; T3 synergizes with GH on bone)
  with three new questions and three Exam 1 copies, R's notes (both levels, narration regenerated), cram and a focus hint, and the
  mock's five now follow the split (`MOCK_PLAN`: 2 from L2, 1 synergy, 1 PTH, 1 any). "The two images on the exam are sertoli and
  female reproductive stages": focus hints and an `EXAM_INFO` "Pictures" row, and (Sam: "Yes, draw it", then a screenshot of the slide: "This is
  actually the female question he was talking about") an unlabeled drawing laid out like Dr. Herr's five-stage slide
  (`FIGS.follicles`, `tools/figures/heme-endo-exam2/follicles.mjs`: his numbers 1-5, his labels as letters A-K) under L14's
  notes with six picture questions. 547 questions (52 new ids in the registry); `next/` rebuilt. About page's High Likelihood and Diagrams entries updated.
- **2026-11-11 (Heme & Endo Exam 2: the five Exam 1 questions come from L2, L3, L6 and L10, Claude Code)** — Sam: "the exam 1
  questions for heme and endo exam 2 will come from l2,6,3, and 10". The Exam 1 Refresher's `LIKELY_TOPICS` keep only those four
  Exam 1 lectures' 23 topics (93 questions; 32 topics dropped), so the mock's five Exam 1 questions, **Exam 1 High likelihood** in the
  Question Bank and the drill draw on them alone. Then Sam: "cut the refresher questions that arent from tested lectures": the
  other six lectures' 114 questions (`r-pa-2s-2` among them) are retired in `tools/question-ids/heme-endo-exam2.txt`, so R holds
  93 and the hub 495. R's notes, both levels, and its cram sheet now cover only L2, L3, L6 and L10 (the plain level gains PNMT, Addison's and
  four L10 lines from the full notes), so `refresh-full.mp3` and `refresh-plain.mp3` were regenerated. An R `focus` Exam Hint, Home's
  chips and exam card, `EXAM_INFO`, the hints banner, the mock's intro and the About page say which four. `next/` rebuilt (its
  `SH_HUB` words too). No schema change.
- **2026-11-11 (redesign phase 3, third pass: a classroom and a stage; the hubs share each Timmy's outfit, Claude Code)** —
  Sam: "make a fully drawn classroom with the timmys of the people studying and make them wear what the user has their
  timmy dressed as. it should be animated. timmys should walk in and sit at a desk or get up and leave as people join or
  leave. Also i want the leaderboards and pedestals to be more epic". **One live change:** each hub tab now sends what its
  Timmy is wearing with its studying-now presence (`widget/v3.js` `trackPresence()`, `shPet.fit()` in `widget/pet.js`:
  `<holiday>:<outfit>`, empty before he's adopted, with Timmy off or in Focus mode), with no name or id; it isn't stored.
  The About page's "What the hubs record", [event-taxonomy](vault/reference/event-taxonomy.md) and
  [analytics-retention](vault/reference/analytics-retention.md) say so. **On the new dashboard** (still beside the live
  one): the studying-now tile is a drawn classroom (`tools/figures/site/classroom.mjs`), 150 px tall (170 on a phone),
  the count and the three busiest hubs on its chalkboard, a Timmy at a desk for each presence key in that outfit
  (`shPet.art({ fit })`; an outfit is only ever a lookup key), desks in the hub's tint, day or night by the viewer's
  clock, rows added as it fills, "+N in the hall" on a sign past a full room; people hop in through the door and jump
  into a desk, or get up and leave (the Web Animations API on wrapper groups; more than six changes at once, a hidden
  tab, reduced motion or answer animations off seat them without the walk; Focus mode keeps the plain count). The
  leaderboard is a stage (`stage.mjs`): curtains, lights, torches, confetti, gold, silver and bronze blocks, a crown, the
  top three as Timmys (their outfit from `get_place` through the row's visit key once migration_v54 is applied; plain
  until then), places 4 to 10 as dark rows with a bar against first. Both kits are written into
  `widget/hub-art/class.js` (`window.SH_CLASS_ART`, 26 KB) by `tools/figures/site/build.mjs`, which also writes the
  shop's 55 outfits and `dress()` to `widget/hub-art/outfits.js` (168 KB, loaded only when someone on the page wears
  one). The preview has a made-up class that comes and goes (`shDash.setLive(by, list)`) and a `get_place` stub. The
  smoke test seats eight made-up people and checks the count, the stage and that markup sent as an outfit is never
  drawn. **The recap** (Sam: the first redraw "doesnt read as a bar graph and it also also needs to fit in a smaller
  card") is a compact drawn card: the hours, the classmates as a crowd of teeth, hours per day as drawn columns with
  the exam day's flag and Timmy on one (`recap.mjs`, drawn by `recapArt()` at the card's width), fact chips with trophy
  drawings, beside the hubs that just closed on a laptop. `class.js` carries the recap kit, its six icons and the hat
  (55 KB). BUG-068 to BUG-073 found and fixed (two in the preview's UAT, two on the recap). **Your own Timmy is
  marked** (Sam: "Mark your timmy"): a "You" plate on his desk, on your own screen only. A hub tab keeps its random
  presence key in the browser (`sh_presence_mine`, `rememberMine()` in the live `widget/v3.js`) and the dashboard's
  `paintMe()` finds that desk; nothing new is sent or stored on the server (BUG-074). Merged 2026-11-12 on Sam's word ("merge"), after a rebase
  and one more fix the smoke test found the day before an exam (BUG-075: "Send luck" at the largest text on a phone).
- **2026-11-11 (redesign phase 3: the new dashboard, beside the live one, Claude Code)** — Nothing students see changes.
  `next/index.html` is the dashboard on the design system (`widget/dash.js`, `widget/dash.css`); outside a preview it sends
  visitors to the live dashboard, and it takes `index.html`'s place at the redesign's release. The hubs are tabs with their
  emblems and colors; the open hub is a stage (its drawn scene, the days left on a flip tile with a bead for each day, a
  progress ring, Start studying, Daily drill, luck); one "you" card (Timmy's house, rank, mastery medals, streak with the
  week as dots); the class panel has the live "studying right now" count with a chip for each hub and the leaderboard
  (ranks or streaks, the top three on a podium); Past hubs shows each finished exam's recap as a live infographic (Save
  image still draws the picture with `widget/recap.js`) and the hubs that just closed. **Out, on Sam's calls:** correct in
  a row, the What's new log, the arcade scores and the When people study chart. Check-ins, surveys, the Inbox, luck, the
  name picker, Settings with Focus mode and the tour (from the menu, its own steps through `window.SH_TOUR.steps`) are the
  live dashboard's logic, moved over. Its hub list is `next/hubs.js`, copied from `index.html` by
  `tools/dash-next/build.mjs` (`--check` in CI) until the release; `widget/hub-art/dash.js` holds every hub's emblem and
  tint (from `tools/figures/site/build.mjs`). `migration_v54.sql` is still pending: the page calls the `_v2` functions with
  a fallback to today's, and the preview stubs them. The smoke test, `a11y.js`, `perf.js`, `matrix.js` and the syntax check
  cover the page; the new hubs' Back button goes to it. The idea board is a second session's (its slot is `#ideas`); Timmy's
  place and visiting (`data-visit` on the board's rows) are phase 4's. Drafts for the About page and the switch are in the
  [release note](vault/tasks/done/2026-11-06-redesign-release.md); bugs BUG-063 to BUG-067 found and fixed while building.
- **2026-11-11 (Occlusion: the final's repeat questions retired, Claude Code)** — Sam: "merge it and check the rest of the
  final questions", with the bar from `mo-10` (a concept may be asked two ways, never more than twice; no new questions).
  Every L6-L9 question's facts were listed, counting each statement of a two-statement or numbered item and facts shared
  across lectures (the bulimia pattern and cupping are in both L7 and L9): 58 facts were asked three to five times. 58
  questions came out (L6 17, L7 15, L8 13, L9 13: mostly the plain repeat, plus the two-statement and numbered items whose
  every statement was asked elsewhere), so each fact is now asked at most twice, in two formats where possible, with Patient
  Box questions kept over plain ones. No fact is left unasked, each lecture keeps its format minimums, and the bank is
  783 questions. Ids marked `retired` in `tools/question-ids/occlusion.txt`; their why rows and High Likelihood ids went
  with them; `next/content` rebuilt. The kept/retired list per fact is in the PR.
- **2026-11-11 (Occlusion: `mo-10` retired, Claude Code)** — Sam: "Retire mo-10 if it is redundant ... it is okay to test the
  same concept multiple ways. just not for every single question and not more than twice." It was (report #40): the final's
  lectures asked the same fact, about 10% of people have MIP coincident with CR closure, three times. `mo-10` came out with its
  why row and its place in the orthopedic-instability High Likelihood topic, and is `retired` in `tools/question-ids/occlusion.txt`;
  `in-90` (L6) and `mo-tf-3` (L7) keep the fact. The final's lectures hold 412. `next/content/` rebuilt. No questions added.
- **2026-11-11 (Perio S7: Dr. Kaur's final focus, peri-implant health, mucositis and peri-implantitis, Claude Code)** — Sam: "Dr. Kaur
  said for her part of the perio final to really know peri-implant health, mucositis, and implantitis. The clinical questions will be
  based on that." `hubs/perio`: **three new drawn Patient Box cases**, one per 2017 state, each read against its own baseline
  (`implant-19`, health that probes 5 mm with 1 mm of first-year remodeling; `implant-5`, mucositis in a smoker; `implant-14`,
  peri-implantitis in a former smoker treated for periodontitis, with poorly controlled diabetes and suppuration), validated by
  `tools/ci/cases.js`, and **14 case questions** (`pc-g1`-`g4`, `pc-h1`-`h5`, `pc-i1`-`i5`: the diagnosis, why a 5 mm implant can be
  healthy, remodeling vs pathologic loss, why the pockets deepened, treat mucositis now, the one finding that makes it
  peri-implantitis, when a film is indicated, suppuration, the cause, the risk-factor list, the susceptible host), each choice with
  its why and "In the notes" links; bank 749 -> 763. An S7 **Exam Hint** (new `src:'relay'`, shown as "Paraphrased", since it
  isn't her exact words), an S7 **notice** at the top of its notes (`note`, not narrated, so no audio change), S7's **High
  Likelihood** list re-ranked with five "final focus" topics first (the new basis is explained in the list's intro), Review's
  **Reading an implant case, step by step** under the 2017 table, and a cram line. The notes' text is unchanged (no narration to
  regenerate; perio has no Timmy Time episode). No schema change.
- **2026-11-11 (redesign phase 2: the new Perio, beside the live one, Claude Code)** — Nothing students see changes.
  `hubs/perio/next/` is Perio on the shared engine, with no engine of its own: settings in `window.SH_HUB`, content in
  `next/content/` written from the live hub by `tools/hub-next/build.mjs --hub perio` (its `adaptPerio()` maps Perio's own
  names: hints, cram, trophies, the exam format, the suture pictures, each session's Review tables), and outside a preview it
  sends visitors to the live hub. Same hub id, state key, answered event, all 749 question ids and **Perio's own saved shape**
  (`stateShape: "answered"`; the live page reads a save the new one wrote), and the same export, so question health keeps
  every version. The engine (`widget/hub.js`, gated) learned recall cards, case links, HTML review sections under the notes,
  the exam-format mock (46 in 80, partial credit, an ordering question) and Perio's arcade API; for every new hub, the games
  keep their own button style (BUG-058) and tag questions with the lecture's color. Perio's text takes a deeper pink for
  contrast (`widget/hub.css`). Its six arcade lobby drawings are in (`tools/figures/site/arcade.mjs`, Sam's look on
  2026-11-11; Pocket Showdown's board redrawn after the first one's teeth). The games' icons on the engine are sized as on the live hubs
  (BUG-059: Occlusion's and Heme & Endo's Back and Full screen buttons had grown). Budgets and the accessibility baseline
  gain the page. Hub note: `vault/hubs/perio.md`, "The new version".
- **2026-11-11 (redesign phase 2: the new Heme & Endo Exam 2, beside the live one, Claude Code)** — Nothing students see
  changes. `hubs/heme-endo-exam2/next/` is the hub on the shared engine, built the way phase 1 built Occlusion's: settings in
  `window.SH_HUB`, content in `next/content/` written from the live hub by `tools/hub-next/build.mjs` (now with
  `heme-endo-exam2`; CI's `--check` covers it), and outside a preview it sends visitors to the live hub. Same hub id, state
  key, answered event and all 609 question ids. The engine (`widget/hub.js`, gated so Occlusion's new version is unchanged)
  learned what this hub needs: **review-only lectures** (the Exam 1 Refresher out of every total and out of the bank until
  ticked, `SH_EXPORT.uncounted` for the medal), **a toggle tied to a lecture** (Exam 1 High likelihood ticks R and unticks it
  again), **the mock's grouped L12 and the Refresher's five High Likelihood picks**, "which statement" type filters, focus-list
  hints and a plural "In the professors' words". The build handles a hub without the Occlusion drawing kit (its `FIGS` and
  `FIG_PLACE` as data). Its six arcade lobby drawings are new (`tools/figures/site/arcade.mjs`, from `HEE2_SKIN`). After Sam's
  look ("more color ... to distinguish each lecture"): **each lecture has its own color** on every hub on the engine (question
  cards' lecture chip and top edge, the notes' list, Home's rows, the picker, hints, cram, mock and stats; a review-only
  lecture grey; `LCOL`/`lc()`, `.lc-0` to `.lc-9`), and **Notes done** (a button at the end of the notes, or reading to the
  end after a minute; `STATE.read`, this device) fills a lecture's badge. **BUG-056**, fixed: on the new hubs the Timmy Time
  player's Play and Post buttons were in the default color with dark labels (each hub's tint now on the page root too,
  `data-hx-hub`). `/podcast` now rebuilds a hub's new version. **Live:** the About page's High Likelihood entry now says the
  mock's five Exam 1 questions are drawn at random (Sam: "draw at random"). Round 3 (Sam: "Redesign the timmy time
  ui/card"): on every hub on the engine, More > Timmy Time is one page: the episode on a field of the hub's color with Timmy
  in headphones (he bobs while it plays), a big Play, round skip and speed buttons and a progress bar on it, the chapters as
  a track list (always open, two columns on a laptop, the one playing marked with a small equalizer), then "What the class
  thinks"; the pinned player is in the hub's color too. The engine only lays out and restyles the shared player
  (`podDress` in `widget/hub.js`, `.pod-x` in `widget/hub.css`), so the live hubs' player looks the same. Home's animated
  Timmy Time card stays where it was. **Live, no look change: BUG-057**, fixed in `widget/podcast.js`: the speed and
  like/dislike buttons' spoken names now include what they show ("Playback speed 1×", "Like this episode, 7 likes").
  Notes: [hub note](vault/hubs/heme-endo-exam2.md), [phase 2](vault/tasks/done/2026-11-05-redesign-phase-2-live-hubs.md).
- **2026-11-11 (CI: the test browsers install when Ubuntu's mirror is down, Claude Code)** — Three "Check hubs" runs on
  #312 in a row failed before any browser test ran: the GitHub runner couldn't resolve `azure.archive.ubuntu.com`, so
  `npx playwright install --with-deps` failed on optional font packages and never downloaded Chromium. Both workflows
  (`check.yml`, `release.yml`) now fall back to installing the browsers alone (the runner image already has the
  libraries they need) and put a warning on the run's page. Nothing students see changes. Sam asked for it in its own PR.
- **2026-11-11 (cheaper sessions for the rest of the redesign, Claude Code)** — Sam: "implement these changes". The eight
  question-writing rules (every choice's why, two-statement and true/false, numbered, which-statement, high likelihood, what
  professors skip, the bank's panel, question-health flags) are `load: on-demand`: the new `hubs/CLAUDE.md` loads them whenever
  a session opens a hub file, and `CLAUDE.md` lists them under "Feature rules". The narration, usage-data and reports how-tos
  are links. Every session now starts with about 58 KB of notes instead of 81 KB (about 5.6k tokens less on every turn). New:
  [run-a-redesign-session](vault/how-to/run-a-redesign-session.md) and [the open calls](vault/tasks/done/2026-11-11-redesign-open-calls.md)
  for Sam in one list; phase 4 starts by splitting `widget/hub.js`.
- **2026-11-10 (migration_v54 applied by mistake, then undone, Claude Code)** — After Sam's "also apply the sql", a
  session applied `migration_v54.sql` (the game layer's server) to the live project, though it was meant to wait for the
  redesign's release. No page called it and no student data reached its tables. Sam: "dont run the migration if it wasnt
  supposed to yet". `supabase/rollback-v54.sql` (tested on a throwaway copy: schema + v54 + rollback = schema) drops what v54
  added and restores today's three replaced functions; Sam OK'd it and it ran on the live project the same night (none of v54's
  tables or functions left, the three functions back with today's grants, no migration-history row, today's bootstrap
  answers). v54 stays in `supabase/pending-migrations.txt` for the release.
  Lesson: a migration listed as pending waits for its release, even when someone asks to "apply the sql"; ask which one.
- **2026-11-11 (Heme & Endo Exam 2: L16 taught from its recording, Claude Code)** — Sam uploaded the L16 transcript
  (Dr. Madison, Tue 11/10). Female Reproductive Physiology goes from slides-only to taught: notes at both levels checked
  against what he said (a "What he stressed" box; DHT and the external genitalia, leptin and what inhibits GnRH, theca cells
  with no aromatase, oocyte maturation inhibitor, the luteal phase's glycogen and slight rise in temperature, Turner
  syndrome as his primary amenorrhea example, prolactin turning GnRH down), 17 Exam Hints quoted from the recording (he
  called comparing the follicular and luteal phases "high yield for exam" and the two-cell slide "very important"; he
  won't test the other steroid enzymes, the in-between follicle names or the whole-body actions slide, and no question
  depended on them), 7 new questions and 2 back (`fp-2s-default`, `fp-lh-block`; L16 43 to 52, the Exam 2 lectures 402),
  `src` relabeled `rec` on 28, High Likelihood re-ranked from the recording (40 questions under 10 topics, none dropped),
  cram, a follicular versus luteal table in Review, the sequences and sort set, and both mp3s. **Midcycle FSH is settled:**
  he said FSH rises too, far less than LH, because inhibin holds it back, as in Dr. Herr's L14 graph; the `cycle` figure's
  hover text and sources say so (`tools/figures/heme-endo-exam2/cycle.mjs`). The pronunciation lexicon reads KNDy as
  "candy" and OMI as letters.
- **2026-11-10 (Lessons refresh, evening, Claude Code)** — `/lessons-audit`, data read 9:45 pm Central. Heme & Endo Exam 2: six
  explanations now name the class's favorite wrong answer and why it's wrong: `p2-case4-a` (an adrenal tumor, not a pituitary one,
  with ACTH under 5), `p2-case6-a` (Addison's high ACTH is lost feedback, not a tumor), `p2-shpt-dialysis` (primary hyperplasia raises
  calcium), `dm-meg` (meglitinides still cause hypoglycemia), `dm-met-lactic` (the disulfiram-like reaction is the sulfonylureas') and
  `p1-fc-mets` (follicular carcinoma reaches the lung by the blood). Occlusion: report #39, `mo-repos-irrev`'s choices no longer give the
  answer away (two said "Reversible", one "Irreversible"): now two of each, each with a reason, and its why lines and explanation
  match; positions 0 and 2 keep their meaning, and no class picks sat on 1 or 3, so nothing is stale. `next/content/` rebuilt. Same ids
  and answer positions everywhere. `LESSONS.md` Live signals rewritten; two report lessons added (a category word repeated in two
  choices; one fact asked three times, report #40; Sam kept `mo-10`). Reports #39 and #40 answered at merge.
- **2026-11-10 (Occlusion L9 diagrams: abfraction, cupped cusp tips, pH vs buffering capacity, Fig 19 again, Claude Code)**
  — Sam: "Approve the budget, make all diagrams, merge when ready". All four L9 candidates are built in
  `tools/figures/occlusion/anima/`, in the L9 notes at both levels next to the paragraph each explains (`FIG_PLACE.nccl`
  in `od.js`) and in L9's Review (three `figs` sections). **Fig 24 `abfract`**: a mandibular premolar in its bone; move the
  load from the long axis onto the buccal cusp's incline and the tooth bends about the crest like the pushed stop sign
  beside it (compression lingual, tension buccal); "Load it again and again" grows the notch on the tensile side just
  above the bone. **Fig 26 `cupping`**: a mandibular first molar's crown in section; wear the cusp tips down until a
  pinpoint of dentin shows, then wear alone (a flat facet, L7) or wear plus acid (the dentin cups out below an enamel rim),
  beside a pH scale with dentin's critical pH above enamel's. **Fig 25 `buffer`**: two drinks at pH 4 with pH probes; add
  bicarbonate a drop at a time (A neutral after 5, B, a citric acid buffer, after 40) or water (the pH barely moves), with
  a pH vs drops chart. **`erosion9`**: L7's Fig 19 again under L9, opened on bulimia with L9's reasons (the lip, the
  tongue) and the NCCL view one tap away, as an **alias**, a new `build.mjs` entry type that reuses a figure's drawing and
  live code under another lecture with data overrides (`erLive` reads `D.start` and `D.extra`). About page: an L9 sentence
  in Diagrams. Occlusion's page is 1379 KB over the wire, so its budget went from 1370 to 1395 KB (BUG-055; BUG-053's raise
  approved).
- **2026-11-10 (Timmy's place, round 3: on the design page and in the pending migration only, Claude Code)** — Sam's
  third round of feedback ([task](vault/tasks/done/2026-11-10-redesign-timmys-place-round-3.md), PR #299, stacked on #289).
  **Students see nothing yet**: nothing is wired into `widget/pet.js`, `widget/eggs.js`, `widget/hub.js` or
  `widget/ranks.js`, and `migration_v54.sql` is still unapplied. (1) Art fixes: "Why each choice" folded, a pop on the
  "Good question?" thumbs, shiny gold XP text, a five-level streak flame (blue at 10 days, Dark Matter at 30), the coin
  as a dental crown, Perio's emblem tooth, "Default" on the cottage; the hill and island rise gradually; the seaside,
  cloud and starlight scenes, the castle, treehouse, beach hut, observatory and igloo, and most of the yard redrawn (a
  **mouthwash fountain**, id `mouthwash-fountain`, a dog with the doghouse, a mint for the lane's ball). Timmy waves and
  his speech bubble follows him. (2) Hub mastery: the pennants are gone; a **medal board** beside the house hangs each
  hub's own mastery medal in miniature (up to 20), and tapping it opens a big view of every medal (Sam picked the plaque,
  then asked for the same medals on the board and in the pop-up; no trophy case, no gems, no `mastery` option).
  (3) **Sets**: `tools/figures/site/sets.mjs`
  lists 14 seasonal sets of 8 pieces (new: Spring, Summer, Tooth Fairy week, Mardi Gras, the Fourth of July) and the
  Handpiece's six rank sets (an outfit and a yard piece per full rank-up, earned, never sold); each is one file in
  `tools/figures/site/packs/` ([how-to](vault/how-to/draw-a-seasonal-set.md)); the build checks 1,436 drawings and 3,384
  walks and `--strict` fails on a set with no pack. (4) Server, still pending: the catalog is 181 rows; seasonal windows
  (`sh_shop_seasons`), two throwback days a month, rank sets by rank, Halloween's set as a gift, the shop's shelves in
  `get_my_shop`, and visiting (`get_place` by a board's visit key, on by default, `set_visiting`); `tools/release/xp.js`
  348 checks; nothing seasonal is sold before its season's first run (`added_on`, `sh_season_was_on`); the Fourth of
  July's set is June 28 to July 4 (Sam confirmed). (5) The design page shows all of it as mock-ups on made-up names: a
  **wooden shop** (plank walls, cabinets, a counter; any piece opens in its own window; "Back for today" is a corner stamp; buying plays out by rarity
  with synthesized sound cues), a **customizer** (a picture dock, shelves, a wardrobe rail, a camera that moves in), the
  **rank board** with each rank's handpiece emblem and your own name on a gold nameplate, and **visiting** (Visit, a
  random visit, next and back, a trip through soft clouds). (6) Polish: the statue's handpiece stands upright; the
  igloo's doorway is clear; the emerald hills have one gated wall. (7) **Timmy's podcast studio** is a yard piece (kit
  key `studio`, shop id `podcast-studio`, Epic, 2,400): a sound booth with an on-air lamp, an antenna, the show's poster
  and his mic; tapped, it goes on air. (8) **Timmy's health at his place**: the kit's `HEALTH` table (eight levels, the
  cut-offs of `conditions()` in `widget/pet.js`) sets his drawing, how he hops, how much he wanders, his wave, whether he
  flips and what he says; at 0 HP he stays on the doorstep. A visitor never sees it. (9) **Gentler ground**: every
  scene's contour is a wider, flatter bell (`arcTop(cx, top, edge)`; Sam: "too extreme and pointy"), and each scene
  raises its backdrop to match (`farLift`). Sam: "Looks good", "its good to merge when youre ready" (#299, with #289's
  commits). Next: the wiring into the live widgets.
- **2026-11-10 (Heme & Endo Exam 2: the exam's own count per lecture, Claude Code)** — Sam, from Dr. Herr: 5 on Exam 1, 8
  on L11, 9 on L12, 7 each on L13-L16, and L16 is the last lecture on the exam. `EXAM_COUNTS` (= `MOCK_BLUEPRINT`, with
  `EXAM_GROUPS` letting L12's two hours share their 9, drawn at random) drives the mock, the "Most likely questions" box,
  Home's exam facts and the Exam Hints banner. High Likelihood keeps every topic (Sam: "Dont remove any high likelihood
  questions"; the High Likelihood rule now says counts never trim topics, for every hub). L17 and
  L18 aren't added to this hub (they go to Exam 3 with Lecture A). Also fixes two places #304 missed that still said
  Lecture A was on the exam (BUG-054).
- **2026-11-10 (Occlusion L9: Noncarious Cervical Lesions, Dr. Lawson's prerecorded lecture, Claude Code)** — Sam added
  the transcript of Dr. Lawson's prerecorded lecture for the 11/12 session ("i dont have his slides yet or the other
  lecture from thursday"), so L9 `nccl` went live from the recording alone, the way L8 did. It has its own notes at both
  levels with both mp3s (`audio/nccl-full.mp3`, `-plain.mp3`), 57 questions (`nc-*`, `cs-nc-*`: 22 multiple-choice, 10
  Patient Box case items on three pbox-only cases, 5 two-statement, 9 true/false, 4 numbered, 2 which-true, 2
  which-false, 2 select-all, 1 match, every choice with its why), 16 emphasize and 2 de-emphasize Exam Hints, 10 High
  Likelihood topics, a Review group and two side-by-side rows, cram lines and two sort sets. The bank grows from 785 to
  842. The mock stays 45 questions in an hour, now 12 each from L6-L8 and 9 from L9. A ninth tag color, slate, was
  added to the tag CSS (light and both dark blocks). The exam card, hints banner, mock intro, Home notice, page
  description, footer and dashboard card list L9 and no longer say the final is only Dr. Givan's lectures; the
  redesign (`next/`) copy matches and its content was rebuilt. Lexicon: NCCLs, Dzakovich, chelator, exostoses, tori,
  subgingivally, CEJ. The notes give both views where L9 meets L7 (Lawson: abfraction is a cause, treat it with a night
  guard; Givan: not yet proven clinically). Pending in [the follow-up task](vault/tasks/done/2026-11-10-occlusion-l9-follow-ups.md):
  Sam's answers on four diagram candidates, the check against Dr. Lawson's slides (names spelled by ear) and the other
  11/12 lecture as L10. Occlusion's performance budget 1350 -> 1370 KB (L9 adds about 25 KB over the wire; BUG-053),
  for Sam to approve with the PR. No schema change.
- **2026-11-10 (Heme & Endo Exam 2: Dr. Taylor's Lecture A out, saved for Exam 3, Claude Code)** — Sam asked Dr. Herr:
  he forgot Lecture A when he wrote Exam 2, so it will likely be on the next exam ("i guess save all that for exam 3").
  A came out of the hub whole: its notes at both levels and both mp3s, 58 questions (`dc-*`, retired in the hub's
  registry), 15 Exam Hints, its Review group and three side-by-side tables, cram lines, 3 sequences, 1 sort set and 11
  High Likelihood topics. The mock's 45 new questions now come from L11-L16 (A's 5 went one each to L12a and L13-L16).
  The exam facts on Home say A isn't on Exam 2, and the timeline marks it for Exam 3. A mock started before the change
  drops A's questions instead of counting them unanswered. Everything A had waits in
  `vault/tasks/2026-11-10-heme-endo-exam3-carry-lecture-a.md` (from commit `43ece52`) for the Exam 3 hub.
- **2026-11-10 (Heme & Endo Exam 2: the two-Sertoli-cell figure, Claude Code)** — Report #38 and Sam's "Draw the figure":
  the hub's own unlabeled version of Dr. Herr's L13 drawing he said is on the exam (`tools/figures/heme-endo-exam2/sertoli.mjs`),
  laid out like his slide (Sam's screenshot, matched and not committed): his ten labels numbered in scrambled order and the
  two compartments lettered, with the key after answering. It sits above
  `mh-fig-seq` and `mh-fig-label` and under the notes' "Sertoli cells" heading; `build.mjs` now writes the hub's `FIGS` line.
- **2026-11-10 (Perio S9: five drawn diagrams, Claude Code, #301)** — Sam: "Yes to all diagrams. Merge when ready". The five
  S9 candidates, built with the anima kit in `tools/figures/perio/` (`cairo.mjs`, `palate.mjs`, `grafts.mjs`, `ape.mjs`,
  `egd.mjs`; `build.mjs` pastes them into the hub): **Fig 1 The Cairo recession types** (one canine with 4 mm of
  recession as RT1, RT2 and RT3, the buccal and interproximal CAL, and a toggle for what a graft can cover), **Fig 2 The
  palate as a donor site** (a section through a premolar and the palate: epithelium, lamina propria, submucosa, and the
  greater palatine bundle at about 7, 12 or 17 mm for a shallow, average or high vault, with FGG and CTG outlines),
  **Fig 3 Covered or exposed: which graft** (a CTG under a coronally advanced flap and an FGG left exposed above an
  apically positioned flap, four steps each, from his two recorded cases), **Fig 4 Altered passive eruption** (Coslet's
  Types 1/2 and A/B, before and after their crown lengthening) and **Fig 5 A gummy smile: find the cause** (lip length
  and mobility sliders, the lower facial third and short crowns, each pointing to its cause and treatment). Under the S9
  notes and in the Review section each illustrates; Figs 4 and 5 follow the slides until the live class is posted. Each
  cites its outside sources. About page: the Perio diagrams sentence. No notes, questions or audio changed.
- **2026-11-10 ("Which statement" questions, Claude Code)** — Sam: "add which statement questions" and "also do the inverse".
  Two new formats with their own Question Bank filter entries: **Which statement is true** (`which`, one true of four) and
  **Which statement is false** (`whichf`, one false of four), built by `which()` / `whichf()` in Heme & Endo Exam 2 and Occlusion.
  42 new items written from the hubs' notes (30 in Heme & Endo Exam 2, 12 in Occlusion), so each of Heme & Endo Exam 2's eight
  lectures (not the Exam 1 Refresher) and Occlusion L6-L8 has at least two of each; nine older items tagged `which`. New standing rule `vault/rules/which-statement-questions.md`;
  `tools/ci/smoke.js` checks the shape and needs one of each per lecture taught from now on (`WHICH_MIN`, with exempt hubs and
  grandfathered lectures). About page: the Question types entry. Same PR as the lessons refresh (#297).
- **2026-11-10 (Lessons refresh, Claude Code)** — `/lessons-audit`, data read 5:50 am Central. PCD Implants Exam 1 is archived: its
  retrospective is in `LESSONS.md` (88 people, 339 h, median 199 min each; the notes carried the first two days; the lecture lag closed
  by itself on the eve; 5 check-ins) and its recap was published to the dashboard. Four explanations fixed in live hubs: Heme & Endo
  Exam 2 `p2-cah-17` and `p1-corticotroph` now name the class's favorite wrong answer (21-hydroxylase; ACTH low with cortisol high);
  perio `q4-44` gives its number (4 µm, not 0.4 mm) and `q4-M02` lists the three goals of SRP. Same ids and choice order, so the
  class picks stay put. `LESSONS.md` Live signals rewritten and the standing lessons updated; the data-quality note adds
  early-ended mocks and cleared class counters; PCD Implants and Special Patient Care move to Archived in `vault/home.md`.
- **2026-11-10 (Heme & Endo Exam 2: every Exam 1 High Likelihood question, fuller gaps, focus slides from the decks,
  Claude Code)** — Sam: "include all of the exam 1 high likelihood questions. do not cut them. pull randomly from them for
  the mock. do not include them in the default question bank filter unless you click to include them"; "fill in the gaps
  a little more"; "38-39 for l14 is the layers of the endometrium during menstruation". (1) The Refresher holds all 206
  Exam 1 High Likelihood questions again (207 with `r-pa-2s-2`); the mock draws its five Exam 1 questions at random from
  them (`mockLikelyPick`). (2) The Question Bank's default lectures are the 8 Exam 2 ones (`bankDefaultIds`): R joins only
  when ticked, with Exam 1 High likelihood on (which unticks it again when turned off) or on a search jump that matches it.
  (3) A key-term gap pass: 68 more cut questions back (the rule of 10s and Dr. Taylor's metformin example among them) and 2
  new (`mh-sertoli-fridge`, `fh-tf-atresia`): the Exam 2 lectures hold 421, 300 High Likelihood. (4) L13 and L14 topics
  re-ranked from the decks' real slide order, with a new L14 topic for the uterine wall (33-34); the focus hints say what
  each slide range covers.
- **2026-11-10 (Perio: Session 9 taught, from Dr. Abou-Arraj's recording, Claude Code, #298)** — Sam: "Update perio hub".
  Dr. Abou-Arraj's recorded first part of S9 (posted Nov 9) and his 2026 slides were in Drive, so S9 (Periodontal
  Plastic Therapy & Esthetics) went from `upcoming` straight to `taught`. Notes rewritten at both levels (40 aligned
  paragraphs; the gingival excess, altered passive eruption, esthetics and tattoo sections are labeled "(slides; the
  live session)" until the live class is posted) and both mp3s regenerated; 59 new questions (`q9-L01`-`L36`, `E`, `M`,
  five two-statement, ten true/false, four numbered) plus four drawn Patient Box items on two new cases (`no-kg-24`,
  `recession-11`); 12 Exam Hints and 12 ranked `LIKELY_TOPICS`; Review, cram, mind map and arcade words redone; ten
  names in `tools/podcast/lexicon.json`. The teal and amber session chips are a shade darker in light mode, for AA
  contrast (BUG-050, caught by `a11y.js`). Still to come: the live class's part, and the diagram candidates for Sam
  ([task](vault/tasks/done/2026-11-03-perio-s9-plastic-esthetics.md)). S6 still waits on its recording.
- **2026-11-10 (Heme & Endo Exam 2: coverage over count, Dr. Herr's FSH and his focus slides, Claude Code)** — Sam: "be
  sure the emphasized points are covered, deemphasized points are left out ... be sure that the high likelihood questions
  are sufficient. I dont know what you took out from them. Go with dr herrs version", then Dr. Herr's in-class focus
  slides for L13 and L14. (1) Midcycle FSH peaks with LH just before ovulation, as on Dr. Herr's L14 graph, everywhere:
  L14 and L16 notes (both levels), cram, note tables, the ovulation sequence, the `cycle` figure (`cycle.mjs`) and
  `fh-tf-fshpeak`; L16's slide is noted as differing; `fhisto-full`, `fphys-full` and `fphys-plain` regenerated.
  (2) A `focus` Exam Hint kind ("focus list", no quotation marks) at the top of L13 and L14, and the topics on those
  slides rank first ("focus list + recording"). (3) Every lecture audited for coverage: 90 cut questions back (ids
  un-retired), 2 new (`dm-met-lactic`, `mh-spermio-phases`), five topic lines reworded; 339 → 431 (L11 53, L12a 44, L12b
  45, A 43, L13 44, L14 45, L15 42, L16 35, R 80), 369 High Likelihood. Hub note: "Coverage, not a count".
- **2026-11-08 (Heme & Endo Exam 2: a high-yield bank, and a standing rule on what professors skip, Claude Code)** — Sam:
  "That should be a standing rule. Also 803 is way too many questions. They need to be higher yield". (1) New standing
  rule for every hub, `vault/rules/dont-ask-what-professors-skip.md`: no question tests what a professor said you don't
  need; check every recording, review and focus list; retire what tests it (Sam's standing OK). (2) The bank is cut from
  803 to 339: L11 70 → 48, L12a 66 → 38, L12b 70 → 42, A 84 → 32, L13 79 → 32, L14 78 → 32, L15 79 → 32, L16 58 → 28 and
  the Exam 1 Refresher 219 → 55 (one per Exam 1 predicted topic), about 6 per expected exam question (the median student
  answered about 300 before Exam 1). Kept: what a professor stressed, the predicted topics and each lecture's core, one
  question per fact. Cut: near-duplicates in other formats, minor details and slide numbers, long ordering, matching and
  select-all items, stained-section identification, and points a professor played down (alpha-glucosidase inhibitors,
  pramlintide, the SGLT2 inhibitors' rare trial findings, the pheochromocytoma rule of 10s, empty sella, spermiation).
  464 ids retired in `tools/question-ids/heme-endo-exam2.txt`; no question was reworded. `LIKELY_TOPICS` keep every
  topic, each with its 1-3 best questions (156 of 284 lecture questions High Likelihood, all 55 of R's). Format minimums
  and key balance hold (two-statement keys 26/23/26/26%, true/false 49% True, numbered positions 10/6/8/7, longest choice
  10%). Notes and narration unchanged. Hub note, task note, decisions and `LESSONS.md` updated.
- **2026-11-08 (Heme & Endo Exam 2: no questions on what a professor said you don't need, Claude Code)** — Sam: "2 should
  come out along with any questions that professors say we dont need to know". `mh-2s-6` (the erectile blood-supply
  figure Dr. Herr said you don't need) is removed and retired in `tools/question-ids/heme-endo-exam2.txt`. Every recording
  (L11, L12a, L12b, A, L13-L15) was searched for what a professor said you don't need, and the Refresher was checked
  against Exam 1's de-emphasis hints; no other question tests such a point. L13 has 79 questions, the hub 803.
- **2026-11-08 (Heme & Endo Exam 2: Lecture A and L13-L15 taught from their recordings, Claude Code)** — Sam: "update the
  heme and endo exam 2 hub with the transcripts i just added to the drive folder" (the four 11/6 recordings), then "merge
  when ready". Dr. Taylor's A, Dr. Herr's L13 and L14 (his re-recording, posted that afternoon) and Dr. Madison's L15 go
  from slides-only to taught: notes at both levels checked against what was said (what each professor stressed added,
  what he said you don't need marked, slips and contradictions kept as taught and listed in the hub note's content
  flags), 57 new questions (A 62 to 84, L13 68 to 80, L14 70 to 78, L15 64 to 79; same ids for every edited question;
  `src` relabeled `rec` where the point was said aloud), 58 Exam Hints quoted from the recordings, High Likelihood
  re-ranked from what each flagged (Dr. Herr: the labeled Sertoli cell drawing "is actually on your exam"), cram and
  tables, and both mp3s for all four lectures. Dr. Madison's in-class correction (aromatase mostly in the Sertoli cells)
  now drives the notes, `mp-2s-2` and the `hpg` figure (`tools/figures/heme-endo-exam2/hpg.mjs`: its hover text and the
  estradiol mark moved to the tubule). The pronunciation lexicon reads "Class II/III" as two and three. Open: the `cycle`
  figure's FSH at midcycle (L14 says it peaks with LH; L16's slide says inhibin holds it down), L16 on 11/10, L17, L18.
- **2026-11-06 (redesign phase 4 part C: Timmy's place, the art, Claude Code)** — Nothing students see changes. Timmy's
  house card redrawn as a little isometric world you build, on the design page only (`tools/preview/design/`, "Timmy's
  place"), then redrawn again from Sam's feedback: no plot square (each scene's ground fills the picture and the homes sit
  in it), eight homes (new: a beach hut, a lighthouse, an igloo, an observatory), six scenes (new: above the clouds),
  twelve yard things in five spots, seven theme outfits in six themes, the rank as a handpiece statue by the door and
  mastery as pennants in the bunting, animated art per rarity (card frames, a placing burst), Timmy hopping on the ground
  round things instead of floating, and small eggs on what you tap. Play and Customize on the design page. One kit,
  `tools/figures/site/place.mjs`, built into `tools/preview/design/place.js` by `build.mjs` (`--check` covers it; 648
  drawings and 1872 walks checked). `migration_v54.sql` (still unapplied) follows Sam's calls: five yard spots, the
  bowling lane `wide`, the art's names and ids in the catalog (68 rows); `tools/release/xp.js` 247 checks.
  `widget/pet.js` is unchanged until Sam approves the art
  ([task](vault/tasks/done/2026-11-06-redesign-timmys-place.md)).
- **2026-11-06 (redesign phase 5, part 3: the game layer's server, written and tested, not applied, Claude Code)** — Nothing
  changes for students and nothing reaches the live database: `migration_v54.sql` waits in `supabase/pending-migrations.txt`
  for the redesign's release ([vault/reference/game-server.md](vault/reference/game-server.md)). It adds, beside today's
  functions: server-graded answers (`question_keys`, `record_answer_v2`), XP with no daily cap as award rows with
  guardrails and every new source (the day's 20th answer, a fixed miss, mocks, mastery medals with 24 hours of double XP,
  Timmy Time minutes, the arcade, fixed reports), the 63-step ladder (Handpiece, ModuPro, Loupes), Shiny Gold Crowns and
  Timmy's shop (`buy_item`, `equip_item`, the rotation, snack HP), and the idea board. No XP back pay. Tests:
  `tools/release/xp.js` (new, 243 checks: a replayed call, a double tap, a linked device, the rebuild against the live
  calls), `rls.js` (now also calls every function a visitor can run and fails if another visitor's id comes back),
  `admin-ops.js` and `retention.js`, all with the pending migration applied; CI runs `xp.js` too. `tools/xp/keys.js` builds a
  hub's keys from its content JSON. Found **BUG-049, live since v53**: today's bootstrap sent Timmy's days as bare dates,
  so his HP counted only the device's own log. Its fix, the migration's section 0, **was applied live on its own** (Sam's OK,
  about 20:25 UTC) and appended to `supabase/schema.sql`; checked on five active visitors, `rls-audit.sql` clean, site
  changelog posted. The rest of v54 is not applied.
- **2026-11-06 (redesign phase 1: the hub engine and the new Occlusion, beside the live one, Claude Code)** — Nothing
  students see changes. `widget/hub.js` + `widget/hub.css` are the one engine every redesigned hub will use (Home, Notes,
  Questions, More; the bar at the top on a laptop and at the bottom on a phone, with a Settings button; Timmy stays
  bottom-left; drill, misses, weak spots and the mock as sets of the bank; the question card with its rewards, the daily
  goal ring and streak, the session recap, Check yourself under each lecture's notes). `hubs/occlusion/next/` is the new
  Occlusion: a page of settings (`window.SH_HUB`), its art (`widget/hub-art/occlusion.js`) and content JSON written from
  the live hub by `tools/hub-next/build.mjs` (CI's "generated files are current" step runs its `--check`). Outside a
  preview the page sends visitors to the live hub. Same hub id, state key, answered event and question ids, so progress
  carries over at the release. First load 371 KB over the wire before the bank's data (the live hub: 1317 KB with it).
  Shared-widget changes are gated to the new versions: `window.shPet.say`/`hp`, `sh:rank-profile`, `SH_TOUR.steps`/`prompt`,
  `shDrill.set`, and in `v3.js` Timmy's script loads only once he's adopted and the tour's only when it's started, for
  pages with `SH_HUB`. `tools/ci/smoke.js` clicks through every `hubs/*/next/` page; `tools/release/perf.js` measures it.
  The new bank follows #273's rule (High likelihood is an Only toggle on top of any Show chip; a hub adds its own in
  `SH_HUB.bank.only`). Sam's calls: the streak counts any study day (the goal ring is today's target), the session recap
  shows only on leaving the questions, Cusp Sort leads the arcade, "Why each choice" opens on your pick. Sam's second look,
  all built: Focus mode in Settings (every extra off, then back to what you had), every arcade game in the lobby with its
  own drawn art (`tools/figures/site/arcade.mjs`), the answered card in one row (no "Notes for <lecture>"), no "Your last
  two weeks", Today and Timmy Time decorated (`spots.mjs`), four soft colors, previous / next lecture and "Report a mistake
  in these notes", More as colored tiles, and a live "studying now" count in the bar and on Home (`v3.js` sends
  `sh:online` with its presence count; nothing else changes on the live hubs). Sam's third look: Today's goal is a ring of
  20 teeth, Timmy Time is an animated card among Home's quick starts (on the first screen), and Home's spacing is fixed
  (BUG-047: the reset now uses `:where()`). Rule, About page and build-a-hub changes are drafted in `vault/tasks/done/2026-11-06-redesign-release.md`. Timmy's secret-tip line now readable in light mode (BUG-048). Approved by Sam ("Looks good. Merge when ready") and merged;
  the bugs found and fixed are BUG-040 to 048 in `vault/release/bug-log.md` (#281 took 037 to 039 while this was open).
- **2026-11-06 (Pages didn't publish #285 and #281, Claude Code)** — Both publishes ("pages build and deployment")
  ended in "Deployment failed, try again later" after a few minutes queued, and a re-run of #281's failed the same way,
  so the live site stayed on #282 (`postcheck.js`: the four files #281 changed differed from `main`). This notes-only PR
  is the new commit that publishes both. [shared-infrastructure](vault/reference/shared-infrastructure.md) now says so.
- **2026-11-06 (PCD Implants check-in: how the class felt about the week's changes, Claude Code)** — Sam: "for the
  implants check in, develop some questions to see how the class feels about changes in this hub like the improved patient
  boxes". The PCD Implants Exam 1 check-in (button and pop-up from 8 pm tonight) now has eight steps: after readiness, how it
  went and hub vs exam, it asks whether the **new drawn Patient Box cases** were better than the Patient Box questions
  students had before (Sam: "i want to know if they are better than the previous pt box questions"; 1 worse, 3 about the
  same, 5 better; `pbox_better`) and how
  helpful the **diagrams and the seven implant-type drawings** were (1-5, `diagrams`, the id Occlusion's midterm used); each has an
  "I didn't get to them" / "I didn't use them" button, saved as `"none"` and kept out of the average (half the people who
  answered anything never reached a case). Then **which study tools helped** (tick any, `helped`: how the class answered each
  choice, Why each choice, Practice questions by least practiced, High likelihood, Pinned, Timmy Time, None of these) and **how
  the changes up to exam day felt** (`changes`: keep improving / hardly noticed / rather it held still). The text box stays
  last. `index.html`'s `openDebrief` learned a scale's `none` button, a third label under its middle (`ends:[low, middle,
  high]`) and a `multi` (tick any) kind, with an `only` option that
  clears the others; the admin page's Check-ins view tallies 1-5 ratings with "didn't use it" apart, choices and tick-any lists.
  Found in testing and fixed: a comment with apostrophes inside `HUBS` broke `widget/archive.js`'s reading of the list (BUG-037,
  never shipped; `literalAt()` now skips comments), and the Quick survey could open on top of a check-in started from a card in
  the first 4 seconds (BUG-038; it now waits for the next visit). No schema change: `submit_exam_debrief` already takes any
  answers. About page, event taxonomy, lessons-audit skill, hub note.
- **2026-11-06 (Release tests trimmed, Claude Code)** — Sam asked whether the 18-minute Release tests were necessary, then
  chose "Trim it". `.github/workflows/release.yml`: a few-second `scope` job runs the suites only when a PR changes shared
  code or has the `full-tests` label (a tier 2 or 3 change inside hubs gets it); on a PR they skip syntax, vault, archive,
  secrets, smoke, preview safety, database permissions, admin operations and retention, which Check hubs already ran on
  the same commit, leaving the admin page in a preview, accessibility, performance and the device matrix. By hand it
  runs every suite. What the suites had caught: about 20 bugs, all S3/S4, most when the baselines were set on Nov 4; both
  S2s automated tests found came from `rls.js` in Check hubs. Documented in `RELEASE_TEST_PLAN.md` section 6,
  `verify-before-pushing` and `preview-and-release-test`.
- **2026-11-06 (previews on request, Claude Code)** — Sam: "can i make the preview site an option that you ask to do
  instead of something you do by default. for the majority of cases i dont need it". `vault/rules/preview-and-release-test.md`
  (now "Release-test every substantial change; preview it on request"), `RELEASE_TEST_PLAN.md` (tiers, the flow, sections
  3, 7, 10, 13), `preview-a-change`, `ship-a-change`, `AGENTS.md`, the UAT checklist, the test-report and PR templates:
  an agent asks once for a tier 2 or 3 change and makes a preview only with a yes. **CI**: the preview build, the
  `preview-site` artifact and the Cloudflare link moved out of "Release tests" into `.github/workflows/preview.yml`, which
  runs only for a PR with the `preview` label (and each push after) or by hand (it finds the branch's PR for the `pr-<n>`
  link and comment). Release tests still run every suite. Without a preview, screenshots come from a stubbed browser;
  never the plain page as a test account (it would save to the class's data). Nothing students see changed.
- **2026-11-06 (faster sessions and CI, Claude Code)** — Sam asked why every task takes longer, then "do these".
  **Feature rules load on demand**: `arcade-skins`, `podcast-intro`, `podcast-reactions`, `diagram-review`, `diagrams-anima`,
  `figures-teach-the-lecture`, `outside-sources-for-figures` and `every-hub-gets-its-own-art` carry `load: on-demand`;
  `CLAUDE.md` lists them under "Feature rules" (when to read each) instead of importing them, `tools/figures/CLAUDE.md`
  and `tools/podcast/CLAUDE.md` import them so Claude Code loads them when it opens those folders, and the `/podcast` and
  `anima` skills name them. `tools/ci/vault.js` enforces it (an on-demand rule must be linked there, not imported).
  **Smoke test checks only the hubs a PR touches** (`tools/ci/smoke.js`, `pickHubs()`): every hub when a shared file
  changes (`widget/`, the dashboard, `sw.js`, assets, a workflow, the test), on `main`, with `--all`/`SMOKE_ALL=1`, or when
  git can't tell; Check hubs fetches the PR's base (`fetch-depth: 2`) and both workflows set `SMOKE_CHANGED_FROM=HEAD^1`
  on pull requests. A one-hub change: 32 s locally instead of a full run. **Kokoro installs itself on first use**: `tools/narrate.py` and
  `render_podcast.py` run the new `tools/kokoro-setup.sh` (via `tools/podcast/kokoro_ready.py`) when kokoro-onnx or the
  model is missing; tested from a clean machine. No setup script on the cloud environment (one was tried and taken off:
  most sessions never narrate and it made each one wait about 70 s). Nothing students see changed.
- **2026-11-06 (admin page: light only, Claude Code)** — Sam: "i dont want the admin page to be dark mode. its hard to
  see". `review/index.html` drops its two `prefers-color-scheme: dark` blocks (the page's colors and the switch knob) and sets
  `color-scheme: light` plus `<meta name="color-scheme" content="only light">`, so a laptop or phone in dark mode still gets
  the light page, form controls and scrollbars included (and Chrome's auto-dark leaves it alone). `tools/release/admin-ui.js`
  now fails if the page turns dark on a dark-mode phone. Admin only: students see no change. No schema change.
- **2026-11-06 (question health: PCD Implants on exam day, Claude Code)** — Sam: "review implants question health, fix the
  issues, mark them in the admin page, and merge". The 10 questions flagged since #267 were checked against the notes; every
  key matches; same ids; no notes text changed, so no narration or podcast change. **New wording**: `ev-tmi-bone` (its key
  said "distal to the plate"; the notes say the bone *behind* the plate grew thicker) and `bm-goodacre` (the stem names
  Goodacre's review instead of "the slide", and the porcelain choice's why says the veneer that fractured often was resin).
  **New explanations and why lines**: `im-crest` (the crest as the early warning sign; the stability dip isn't on a film),
  `su-esth-span` (the table's span row: a wide single space is low risk), `su-bar` (her table by the space available),
  `su-mm-1` (each risk factor's group: malpositioning is surgical-related) and `su-match` (a matching card shows only its
  explanation after answering, so it now lists the four pairs). These seven start fresh numbers. **Looks fine**:
  `bm-moment`, `im-pa-follow`, `tm-2s-6`. All ten marked on the admin page (`admin_review_question`; the seven as Fixed
  once the new versions were live). Then three more flagged while #277 shipped ("stronger students miss it more"; keys
  match): `ev-2s-5` (statement 2 uses the notes' white, yellow, red instead of "grippier colors"), and new explanations and
  why lines for `in-num-3` (the JE does attach to titanium; the hemidesmosomes are the false part) and `su-voxel` (more
  dose with smaller voxels; "choose the smallest voxel" is about detail). Marked Fixed once live. Then two more:
  `in-1stage` (the most-picked wrong choice, "Brånemark (1985); it avoids a cover screw", was half true, since one-stage
  surgery skips the cover screw; it now reads "avoids a healing abutment", with an explanation that sets the two
  techniques side by side) and `cb-hu-ref` (the explanation now gives the values, air -1000 and water 0, instead of
  "know both definitions").
- **2026-11-06 (Question Bank: High likelihood on top of any Show chip, Claude Code)** — Sam: "when im filtering questions in the
  bank, i want to be able to filter by both high likelihood and not answered yet or missed last time or pinned". In Occlusion,
  Perio, Special Patient Care, PCD Implants and Heme & Endo Exam 2, High likelihood leaves the Show chips (now All, Not answered
  yet, Missed last time, Pinned) and becomes a tick-box toggle on its own **Only** line under Show (`STATE.ui.qlikely`,
  `BANK_LIKELY`; Perio `QBANK_FILTER.likely`), which works on top of whichever Show chip is on. Its count follows the Show chip,
  the chips' counts follow it, and the line under the panel gets a "High likelihood" tag. A saved Show "High likelihood" from
  before becomes the toggle (`bankNormShow()`, Perio `qbankNorm()`); Exam Hints' "Practice these" turns it on, Home's buttons into
  the bank turn it off. Heme & Endo Exam 2's **Exam 1 High likelihood** is a second toggle (one on at a time; it still ticks R).
  The empty state says "You haven't missed any High likelihood questions in these lectures" and the like. Tracked as before
  (`bank:show=likely`), plus `bank:show=likely-off` / `likely1-off` and `bank:tag-off=lk`. About page, both rules. No schema change.
- **2026-11-06 (Occlusion L8 checked against the slides, and the Home timeline contrast in every hub, Claude Code)** —
  Sam: "Ive added the slides and lecture study guide. Fix the timeline contrast in the other hubs too." **Occlusion L8**
  (`dentures`), checked against `Occ Lec7 RDP Occlusion` (slides and handout, Drive Occlusion/Final): Hanau's term is
  the **Realeff** (was "resilient-like effect"), the formula **Thielemann's** (L8 only; the Review lecture and podcast keep
  "Thielmann"), semi-anatomic teeth **12-22°**, anatomic **30-33°**, the porcelain history fixed; added the slides'
  retention factors, what resists tipping, support, the neutrocentric concept, lingualized's definition and advantages,
  Hanau's first-molar contacts and remounts, Thielemann's fixed and variable factors, materials, the posterior selection
  criteria, the tooth forms' names and pros and cons, the four-scheme comparison table and the Abduo 2013 review. Both
  note levels and both mp3s; 17 new questions (`handout` source), every why; LIKELY_TOPICS re-ranked (hint, then slides;
  the history slides say "No test questions", so a de-emphasize hint, and on Sam's word the seven history questions
  retired and the history rows out of L8's Review; the notes keep the history, as narrated); Review, cram sheet and Figs
  22-23 updated. `tools/narrate.py` reads rating marks (+++, ++, +, −) aloud; the podcast lexicon gained Thielemann,
  Duchâteau, Gysi, Trubyte, Fauchard, Boucher, Abduo and bizygomatic. **Home timeline (BUG-031):** Heme & Endo 1 and 2,
  PCD Implants, Special Patient Care and Occlusion dim past and far-off course-timeline rows with the soft ink color
  instead of opacity, so their text keeps 4.5:1 contrast as rows turn past each day.
  [Task](vault/tasks/done/2026-11-05-occlusion-l8-follow-ups.md).
- **2026-11-06 ("Why each choice" starts folded, every live hub, Claude Code)** — Sam: "after you answer a question,
  have the 'why each choice' be collapsed by default. it takes up a lot of screen space". `whyHTML` no longer opens its
  `<details class="qx-why">`, so after answering a student sees the explanation and one "Why each choice" bar, and taps it
  for the list (with their pick marked, as before). On a phone the folded bar is 43 px tall, against 430-590 px open. The
  bar is now the whole tap target (padding moved from the box to the `summary`). In Occlusion, Perio, Special Patient Care,
  Heme & Endo Exams 1 and 2 and PCD Implants: Question Bank, Daily Drill, Weak Spots and mock review. Opening it is
  counted by `widget/clicks.js` as the "Why each choice" click (no new tracking). About page entry rewritten.
- **2026-11-06 (question health: the newly flagged PCD Implants questions, Claude Code)** — Sam had the agent mark the 33
  questions reviewed in #258 on the admin page (12 Fixed, 21 Looks fine, through `admin_review_question` with the admin page's
  versions and flags; recorded in `vault/decisions.md`), then said yes to reviewing the PCD Implants questions flagged since
  (19 over the evening, the night before the exam). Every key matches the notes; same ids; no notes text changed, so no
  narration or podcast change. **New wording**: `in-3weeks` ("after the healing abutment is placed" also fits a one-stage
  case, where the bone needs months, so "3 months" was defensible: the stem now asks how long the soft tissue needs),
  `tm-mm-3` (it asked which "make" the crown need 7 mm, but the subgingival margin subtracts 1: it now asks which go into the
  7 mm) and `tm-early-place` ("after an extraction": most misses picked immediate loading, which counts from placement).
  **New explanations and why lines**: `im-tf-3` (metal does scatter the beam, but the starburst comes from sampling
  limits), `im-flapless` (CT shows the sinus but doesn't make bone; the old why was "Not his point"), `im-software` (DICOM is
  the file format the software reads), `cb-num-3` (beam hardening vs motion fixes), `su-def-bran` (the surgery lecture's two
  definitions; many textbooks credit the "structural and functional" wording to Brånemark, the slides to Albrektsson and
  Sennerby, and the question follows the slides). These eight start fresh numbers (PCD's versions include the explanation).
  **Why lines only** (numbers kept): `bm-moment`, `su-edent`. **Looks fine**: `in-collagen`, `im-num-2`, `im-medct`,
  `tm-2s-1`, `cb-num-2`. **Removed on purpose** (Sam's 11-03 call on reports #35/#36): `tm-code-6010`, `tm-code-6058`,
  `tm-conelog`, `tm-rc-grooves` show as "gone"; `tm-conelog`, `tm-rc-grooves` and `gs-credit` are now retired in
  `tools/question-ids/pcd-implants-exam1.txt`. Sam asked the agent to mark them all on the admin page after the merge.
- **2026-11-06 (Heme & Endo Exam 2: every Exam 1 High Likelihood question, in the mock and the bank, Claude Code)** — Sam:
  "have the 5 exam 1 questions come from the high likelihood question bank". The mock's five Exam 1 questions now come only
  from the Exam 1 Refresher's High Likelihood questions: one per topic, each from a different Exam 1 lecture, questions not seen or missed last time first
  (`MOCK_LIKELY_ONLY`, `mockLikelyPick` in `hubs/heme-endo-exam2/index.html`). The Refresher's "Exam 1's hardest questions
  for the class" entry came out of `LIKELY_TOPICS`: it was class data, not a predicted topic, so those 10 questions stay
  in the Refresher without the High Likelihood tag. The mock's intro, the exam facts and the About page say so.
  Then "also have the exam 1 high likelihood questions available in the exam 2 question bank filter": the Question Bank's
  Show row gains **Exam 1 High likelihood** (`likely1` in `BANK_SHOW`), only the Refresher's High Likelihood questions;
  tapping it ticks R if it isn't ticked, and with R unticked the empty list says so. Tracked as `bank:show=likely1`.
  Then "yes all exam 1 high likelihood questions": the Refresher held 68 of them (Exam 1's top two topics per lecture);
  the other 138 came in, so it has **all 206, over all 55 of Exam 1's predicted topics** (219 questions in R, 747 in the
  hub), copied unchanged except id `r-<id>`, lecture R and "(Exam 1 · L#)" after the explanation, and its `LIKELY_TOPICS`
  are Exam 1's. The Refresher's notes say so at both levels, so both narration mp3s were regenerated.
  Then "do not count the exam 1 questions in the overall count. they are just available for review": R is review only.
  The header's progress, Home's readiness ring and "you haven't tried", Where to next and the bank's "of N" count the
  528 Exam 2 questions (the bank adds "+ n Exam 1 review"), and the mastery medal leaves R out too: a hub may now export
  `SH_EXPORT.uncounted()` and `widget/ranks.js` takes those questions off both sides of the medal. R's answers still
  earn XP and streaks.
- **2026-11-06 (redesign phase 5, part 1: one request per page load and a cached XP total, Codex and Claude Code, #266)** — Codex's draft (#261) rebased onto `main` by Claude Code with its conflicts resolved, and finished. A hub now reads everything it needs on load in one `get_widget_bootstrap` call (besides realtime presence and the changelog): 12 reads become 1 on a hub and 19 become 1 on the dashboard (fixture preview). The class-wide rank board, leaderboards and trophy rarity load when Stats opens or the dashboard panel scrolls into view. **Each visitor's own rank and hub mastery ride in the bootstrap** (Sam, 2026-11-06) and refresh every 10 answers, so the badge by the name, the rank-up, level-up, trophy and mastery cards and the medals work as before (Codex's draft loaded them only with Stats, which 17 of 108 people in a hub opened in 14 days). `migration_v53.sql`: the `xp_visitors` cache, kept by the existing answer trigger, so ranks stop summing the whole class (BUG-032, the cache dropping each day's first answer, fixed before it was applied); the advisor fixes (six `search_path`s, a `link_attempts` primary key, two unused indexes); `get_pet_days` no longer polled; clicks and question health share one flush timer; a class percentage is fetched when its question is answered or its class line comes into view, not for every card on the page (BUG-034: in Codex's draft, Perio's "Show answer" cards stayed on "Loading class data…"). Every part falls back to its old call while the migration isn't applied, so merge order doesn't matter. Also: Timmy on the dashboard at the largest text no longer sits past the screen's edge (BUG-033), `perf.js` no longer counts the preview's own runtime against a page's budget, `sw.js` `sh-v58`. **Live 2026-11-06** with Sam's OK ("Go ahead", then "apply it"): merged as 04c4b3a, and `postcheck.js` passed (11 of 11 changed files live, the dashboard and 4 hubs with no errors). `migration_v53.sql` was applied at about 01:55 UTC while students were answering. Afterward the cache matched the per-day XP for all 158 visitors, and its answer total matched the answer table. `get_rank_profile` takes about 2 ms (it was about 0.9 s), the bootstrap about 115 ms on a hub and 170 ms on the dashboard for the most active visitor, and `get_trophy_stats` 5 ms. The live permissions audit (`rls-audit.sql`) is clean, and the advisors' `search_path`, primary-key and unused-index warnings are gone. Site changelog posted. Still open in phase 5: the two widget bundles, one stylesheet, one font, the thinner client and sw.js precaching ([task](vault/tasks/done/2026-11-05-redesign-phase-5-backend.md)).
- **2026-11-06 (outside sources for every figure, and Perio S8 Fig 3, Claude Code)** — Sam's new standing rule
  ([outside-sources-for-figures](vault/rules/outside-sources-for-figures.md)): outside sources are encouraged on every
  figure, for accuracy and for how it works, and cited in the figure; what it names and tests still follows the lecture.
  The same message ("Build all proposed figures") approved the one figure proposed but never put to Sam: **Perio S8 · Fig 3
  The host response, and host modulation** (`tools/figures/perio/hostmod.mjs`, under the S8 notes and in Review):
  Dr. Litz's flowchart as a cycle, with No bacteria, SRP, NSAIDs, bisphosphonates and Periostat. The L8 figures now cite
  theirs: Fig 20's maxilla resorbs less, so the mandible loses about twice its height (Tallgren 1972 and 1980; Cawood &
  Howell 1988 for the basal bone staying put), and Figs 21-23 cite the Glossary of Prosthodontic Terms and the usual mold
  angles. About page: the Perio diagrams sentence. No schema change, no text or audio change.
- **2026-11-05 (Occlusion L8: four drawn figures, Claude Code)** — Sam approved all four L8 diagram candidates ("Build" to
  each). Built with the anima kit from the L8 notes and placed after the paragraph each explains, at both note levels, and
  in L8's Review: **Fig 20 How the ridges resorb** (`resorb`: a side view at the midline and a section through the first
  molars; a slider from natural teeth to long edentulous, Play, and "Set denture teeth" near the ridges: posterior
  crossbite, pseudo-Class III), **Fig 21 Support, stability and retention** (`ssr`: the force each resists on a pair of
  complete dentures, the dentures moving with it, and what resists it), **Fig 22 Balanced, non-balanced, lingualized**
  (`schemes`: five setups, closed / right working / protrusion, contact lamps per side and the front teeth, and "contact on
  one side only" tipping the lower denture off its ridge) and **Fig 23 Posterior tooth forms** (`toothforms`: anatomic,
  semi-anatomic, flat and lingualized pairs; "Slide sideways" draws the contact force square to the surfaces in contact).
  `tools/figures/occlusion/anima/l8den.mjs` is the frontal section Figs 21 and 22 share (and the tooth profiles Fig 20 and
  23 use). Occlusion's performance budget 1320 -> 1350 KB (the figures add about 21 KB over the wire), approved
  by Sam on 2026-11-06 (BUG-030). About page: the Diagrams entry. No schema change, no text or audio change.
- **2026-11-06 (redesign phase 0: the design system preview page, Claude Code)** — Nothing students see changes yet. The
  redesign's design system is a preview page, `tools/preview/design/` (`node tools/preview/serve.js`, then
  `/tools/preview/design/`; `PREVIEW_PAGES` in `tools/preview/transform.js` lets the preview server and build include it).
  It shows the tokens, both candidate typefaces, 49 hand-drawn icons, an emblem and a masthead scene for each live hub and
  a placeholder pair for a future one, the mastery medals (24) and trophies (26), Timmy and his house as drawn today
  (rendered by `widget/pet.js` and `widget/ranks.js`), and the question card in all nine formats waiting and answered, with
  the new rewards (the XP spark, Timmy's cheer and flinch, the streak flame, the daily-goal ring, the session recap), in
  light and dark, on made-up data. Every drawing is SVG in Timmy's ink in `tools/figures/site/`; `build.mjs` writes
  `tools/preview/design/art.js` (`--check` fails if it's stale; Timmy's holiday outfit is pinned so the build repeats).
  **Sam's picks (2026-11-06):** Nunito Sans for the whole site (Fraunces has no tabular figures); the icons, emblems,
  masthead scenes, trophies and rewards art approved; the five live hubs keep the shared medal design; and a new rule,
  [every-hub-gets-its-own-art](vault/rules/every-hub-gets-its-own-art.md): every new hub gets its own emblem, scene and
  unique medals. The taste inspector (`--app`) shows 0 FAIL at 1440, 768 and 390 in Nunito light, Fraunces and dark.
  Next: phase 1, Occlusion on a preview
  ([task](vault/tasks/done/2026-11-05-redesign-phase-0-design-system.md)).
- **2026-11-05 (question health: every flagged question reviewed, Claude Code)** — Sam: "review and fix all questions flagged
  for question health". `qh_report` listed 33 to review on the live hubs (PCD Implants 14, Perio 10, Occlusion 9; none on
  Special Patient Care or Heme & Endo Exam 2). Each was read against its hub's notes: **every key matches the notes**, and
  no question was removed. Same ids throughout; no notes text changed, so no narration or podcast change.
  **PCD Implants** (exam tomorrow): `in-bh` stem ("the three implant systems the school's clinic uses"), `bm-25lb`,
  `bm-occ-two` and `im-process` explanations now say why the popular wrong answer is wrong (the lever's 25 + 50 = 75 lb;
  pull-through is the single-implant check in MI; the radiographic guide is worn during the scan); why lines only for
  `ev-blade`, `ev-hader`, `ev-frialit` (versions kept). The subperiosteal drawing `ty-sub` (`ev-pic-sub`) had its lattice
  12 px below the crest, so it read as in the bone (half the recent tries picked "Blade"): it now rides the crest
  (`tools/figures/pcd-implants-exam1/types.mjs`, rebuilt). **Perio**: `q3-04` and `q3-08` had a second defensible answer
  because the exam-review guide and the class notes word the prognosis systems differently (the notes call McGuire &
  Nunn "tooth retention" and say it can be given for the whole dentition): `q3-04`'s distractor is now Miller & McEntire's
  own ("A numeric score of how likely a molar is to be retained", same slot), `q3-08` asks about prognosis systems and says
  McGuire & Nunn is also given tooth by tooth, and `q3-S03` (not flagged, same problem) has a statement 1 that is false by
  both sources; `q4-06`'s key reads "S204SD9 sickle scaler" (only the wrong H6/7 said "scaler"); `q4-15`'s explanation no
  longer says "don't read the class off the millimeters". Every changed choice keeps its slot's meaning, so no
  `question_choices` rows need clearing. **Looks fine, no change** (for Sam to mark on the admin page): PCD `bm-sizes`,
  `bm-occ-goals`, `tm-2s-6`, `tm-mm-1`, `ev-misch` (keys confirmed; small recent groups), `tm-mm-2` (fixed in #252);
  Perio `q3-M01` and `q2-P01` (their low numbers are the 7-option versions cut to 5 on 10-01), `q1-P05`, `q4-M05`,
  `q4-02`, `q4-L34` (kept as taught); Occlusion all nine (midterm lectures, all-time data, explanations already name the
  favorite wrong choice since the 10-20 and 10-27 audits). `LESSONS.md`: four question-writing lessons. Hub notes updated.
  **Live**: merged on Sam's "Merge" at 23:52 UTC, live about two minutes later; `postcheck.js --from 46eafd8 --to d145a46`
  passed (both files live and identical to `main`, no errors on the dashboard or either hub); site changelog lines logged for
  both hubs (ids 288, 289). Marking each question Looks fine / Fixed on the admin page is Sam's.
- **2026-11-05 (perio S8: host modulation from the Nov 5 class, and the dosing chart, Claude Code)** — Sam: "update the perio
  hub with the files I added": `litz nov5.txt` in Drive, Periodontology/hubs, Dr. Litz's Nov 5 class (a short antibiotics recap,
  then all of host modulation). `hubs/perio`, S8 only: the host modulation section rewritten at both levels from the class (what
  it means; bacteria the key, the host response the engine, not autoimmune, the vicious cycle; pellicle, complement, neutrophils
  24-48 h then macrophages, IL-1; "step lightly"; NSAIDs; bisphosphonates and why BRONJ is so hard to treat; Periostat as a fifth
  of the antibiotic dose; Caton 2000 as statistically, not clearly clinically, significant) and a new **dosing chart** section
  from the slides' last table, which he said to know for the exam (where it differs from the drug slides, both are given; its
  meal column was left out because the PDF text couldn't place it). The recap's emphases added. Both
  `audio/antibiotics-host-mod-*.mp3` regenerated. The lecture's `note`/`source` updated. 10 exam hints from the class; S8
  `LIKELY_TOPICS` re-ranked to 13. **21 new questions** (`q8-L49..L59`, `q8-M03`, `q8-T09..T12`, `q8-S06..S08`, `q8-N05`,
  `q8-N06`), each choice with its why; bank 665 -> 686 (statement keys still spread: two-statement 25/14/36/25%, true/false 50%
  True). Review: host modulation rows and a dosing-chart table (`abx-doses`); cram, mind map, arcade word COMPLEMENT.
  `tools/narrate.py` reads perio's template-literal readings and says mg/po/qd/bid/tid/qid/q6h/IL-1 properly; lexicon:
  Epocrates, osteonecrosis. Task: `vault/tasks/done/2026-11-03-perio-s8-host-modulation-class.md`. No schema change.
- **2026-11-05 (Occlusion L8: Denture Occlusion, Claude Code)** — Sam: "Update the occlusion hub with the files i added": `occ nov 5.txt` in Drive Occlusion/Hubs/Final, the 11/5 lecture capture (no slides or handout there yet; the transcript is not in the repo). New lecture `dentures` (L8, `exam:'final'`, tag `sage`, taught): notes at both levels and both mp3s (`audio/dentures-full.mp3`, `-plain.mp3`): why denture occlusion is about keeping the prosthesis in (one upper tooth, one lower tooth; balance = resisting tipping), the history (Fauchard, Washington and Greenwood, Bonwill the father of articulation, Gysi), how a denture stays in (suction, fit, muscle control above all), what makes it harder (anatomy, all removable is movable, the resilient-like effect, resorption up and in / down and out, crossbite, pseudo-Class III, the tongue, interarch space), support / stability / retention, CR and centric occlusion (not MIP), the balanced, non-balanced and lingualized schemes, Hanau's quint, denture tooth materials, choosing a mold, tooth forms and the evidence. 92 questions (`dn-*`, `cs-dn-*` on 3 new Patient Box cases `dnflat`/`dnbal`/`dnret`; 8 two-statement (keys 2/2/2/2), 11 true/false (5 True), 6 numbered, 3 EXCEPT, 2 select-all, 1 matching; each with its why; correct answer longest in 25% of L8's MCQs), 18 exam hints quoted from the capture (one de-emphasized: setting the teeth is the January denture course), 14 `LIKELY_TOPICS`, a Review tab, two Side by side rows, cram lines and 2 sort sets. `MOCK_BLUEPRINT` = `{ instruments:15, malocclusion:15, dentures:15 }` (45 questions at 80 s each, a placeholder until the final's format is announced), and the mock's tab and clock are fixed: since L7 the tab said "(20)" and the clock turned red at 27 minutes for 40 questions (BUG-028; now "Mock Exam (45)" and 60 minutes). `EXAM_INFO`, `COURSE_DATES`, the hints banner, the mock intro and the dashboard card updated. A lecture can now carry its own status `badge` (L8's says "Recording", not "Recording + slides"), and the light-mode sage tag is darker for contrast (BUG-029). `tools/podcast/lexicon.json` gains "ala-to-ala". Bank 671 -> 763. Diagram review: four candidates went to Sam, none built ([task](vault/tasks/done/2026-11-05-occlusion-l8-follow-ups.md), with the slides check; [PR #259](https://github.com/smcmurry6-source/study-hubs/pull/259)). No schema change.
- **2026-11-05 (arcade crossword clues no longer give each other away; arcade sentences start where they should, Claude Code, BUG-026, BUG-027)** — Sam: "fix the clue issues too" (the two noticed in BUG-024's retest). Both fixes are in `widget/games.js`, so every hub's crossword and Mind the Gap get them; no hub file changed. **Clashing clues:** each hub's `termPool` cuts note clues from sentences, so two clues could be one sentence with different words blanked ("The adrenal ___ … the medulla" beside "The adrenal cortex … the ___"), and a question stem could name another answer: 47% of test puzzles had such a pair. `build()` now skips a word when its clue shows an answer already in the puzzle or a placed clue shows its answer (`cluesClash`: the word or its plural, whole word, any case), and draws 24 candidate words per try instead of 16 to keep puzzles full: 0 of 2,680 test builds clash, 8.2-8.4 words on average. Lectures with only 9-12 crossword words (PCD Implants L1 Evolution and L2 Introduction, Special Patient Care L1 Introduction, Heme & Endo's diabetes pharmacology) now often give 6-7 words instead of 8, since several of their words come from one sentence. **Sentences:** `sentencesOf()` cut at any period not followed by a space and threw away what came before, so "U.S.", "et al.", decimals ("3.08 mm") and a period inside parentheses produced fragments such as ") The not-necessarily-conscious decision to swallow…" and ", 1969: an intimate bone-to-implant contact…". It now ends a sentence at . ! or ? (with a closing bracket or quote) before a space, unless the period ends an abbreviation (`ABBR`) or the next word is a plain lower-case word (so "rhPDGF-BB" or "kVp" can still open a sentence); Mind the Gap has 2,689 items over the five live hubs, up from 2,600. Noticed, not changed: `termPool` blanks the answer inside longer words too ("Intra___l insert" for MUCOSA), in each hub's own copy.
- **2026-11-05 (Special Patient Care archives when the exam opens, no check-in, Claude Code)** — Sam: archive the hub when the
  exam opens and skip check-ins for this hub only; take the card off when it's archived. `index.html` `HUBS`: `archiveOn` and
  `hideCardOn` both `{date:"2026-11-06", hour:0}` (so it goes straight from live to no card), the exam's `checkinFrom`
  replaced by `checkinClosed:true`. The hub's `SH_EXPORT.exams` / `archiveOn` now use `EXAM_DATE` hour 0 so its own
  "archived" notice agrees; Home's done message no longer mentions a check-in. About page's check-in entry updated.
- **2026-11-05 (PCD Implants: Practice questions goes to the lectures practiced least; `tm-mm-2` is 3 of 5, Claude Code)** — The two optional items left open by #245 (Sam: "fix both of the optional suggestions"). `hubs/pcd-implants-exam1`: Home's quick-start **Practice questions** button, the part of Home people tap, now does what the untapped "Practiced least" row does: while some lectures have under half their questions tried, it names them ("Practiced least: L1, L2, L5, L6 · 129 to try", by lecture number) and opens the Question Bank on them with "Not answered yet"; otherwise it opens every unanswered question as before. Both use the new `lecsBehind(rows)`. Clicks log as `qs=practice-least` / `qs=practice`. The subtitle wraps only on that button (`.qs-wrap`, the count kept whole by `.qs-nw`), since the laptop's four-across row cut it off. **`tm-mm-2`** (platform switching, 7% on a first try with 4 of 5 options right): "Increases soft tissue volume" (right) became "Decreases soft tissue volume" (wrong), so it is 3 of 5; explanation and every why updated, same id, no notes text changed (no narration). Its class picks and accuracy went stale (option 4 changed meaning). **Live:** #252 merged at 19:35 UTC (rebased twice onto #251 and #250, CI green each time), live at 19:39; then (Sam: "yes, run the SQL") `tm-mm-2`'s 5 `question_choices` rows (68 ticks) and its `question_stats` row (34 attempts) were deleted, `postcheck.js --from c8a49d1 --to f5aaf51` passed, and the changelog line was logged. About page, hub note, `vault/decisions.md` and `LESSONS.md` updated.
- **2026-11-05 (Occlusion final moves to Mon Nov 16, 6:30-7:45 pm, Claude Code)** — Sam: the final moves up from Thu Nov 19,
  same time window as the midterm. `hubs/occlusion`: `FINAL_DATE` `2026-11-16`, `FINAL_TIME` / `FINAL_CLOSES` `'18:30'` / `'19:45'`
  (Home now counts down days, hours and minutes, then "on now" until 7:45, then done), `EXAM_INFO`, the Home hero, exam card, hints
  banner, timeline, header title and header pill ("Final tonight", "Exams done" after 7:45). Dashboard `HUBS`: the final's date,
  `checkinHour:20, promptHour:20` (check-in after the window closes, not from 8 am before an evening exam) and the card text. No
  notes text changed, so no narration. Still waiting on the format: [task](vault/tasks/2026-11-03-occlusion-final-time-and-format.md).
- **2026-11-05 (arcade crossword can be started again, Claude Code, BUG-024)** — Sam: "the arcade crossword is broken." Opening
  the crossword (Cross-Section; Crossing Over, Cross-Slice and the other skins) showed an empty 30 px strip on every hub, laptop
  and phone: before a puzzle starts the stage holds only the intro overlay, which is absolutely placed, so the stage had no
  height and the intro and its "New puzzle" button were clipped. The clicks show students opening it, trying Full screen and
  leaving; `arcade_scores` had no crossword score in 30 days. `widget/games.css`: `.cx-stage{min-height:380px}` (a started
  puzzle is taller than that, so its layout is unchanged). Checked in the preview on all five live hubs: every arcade game's
  start button takes a real tap, and every crossword types through to "Solved!". No `sw.js` bump (styles are network-first).
  Noticed, not changed: two clues can come from the same note sentence with different blanks, so each gives the other's
  answer away, and a clue can start with a stray ")".
- **2026-11-05 (the 11-04 lessons refresh is live, Claude Code)** — #245 merged at 15:03 UTC, but its GitHub Pages deploy timed out ("Deploy to GitHub Pages" failed after 10 minutes), so #248 (vault only: Sam's calls in `vault/decisions.md`) gave `main` the new commit that publishes; the hubs were live at 15:30. At 15:31 `tools/data-fixes/2026-11-04-statement-keys.sql` ran (Sam's OK) with a guard that rolled everything back unless each reordered item's new key held exactly its correct count: it passed, nothing was left mid-move, and the rewritten items start fresh. `postcheck.js` passed (both hubs identical to main, 0 errors), a changelog line for each hub, and suggestion #14 got Sam's reply. BUG-022 retested; BUG-023 done for these items (version-aware picks still in the inbox).
- **2026-11-04 evening (lessons audit: statement keys no longer a pattern, Claude Code)** — Suggestion #14 (PCD Implants, two days
  out): "a lot of the statement questions seem to all have the same answer... select all being options 1,2,4 a lot." True:
  `hubs/pcd-implants-exam1` keyed 36 of 46 two-statement items "Statement 1 is true; statement 2 is false", had statement 1 true in
  all 30 numbered items and keyed the second choice in 23; `hubs/special-patient-care` had statement 1 true in all 24 numbered items.
  Same ids. **Two-statement:** 7 PCD items swap their two statements, 8 have the false statement made true and 10 the true one made
  false by one taught detail (facts from each item's explanation and the hub's notes), now 12 / 11 / 11 / 12 over the four choices;
  SPC 4 swaps and 2 made "both false" (12 / 6 / 10 / 12). **Numbered:** statements reordered so the false one sits at every number
  and the key at every position (PCD 7 / 8 / 8 / 7, SPC 6 / 6 / 6 / 6), the key's size shared by another choice, and in PCD three
  items keyed "all four" and two "two true" (`ev-num-1`, `pf-num-1`, `cb-num-1`; `su-num-4`, `bm-num-1`). Every why line is rebuilt by
  `two()` / `nums()`. The class's picks on each choice (`question_choices`, by position) would show beside the wrong choices: 
  `tools/data-fixes/2026-11-04-statement-keys.sql`, tested on a throwaway Postgres, that moves the picks of 43 reordered items with their choices and clears the 25
  rewritten ones (`question_stats` too), to run at merge with Sam's OK; question health starts the new versions by itself. Also `im-template-vdo`'s explanation and whys now say why "room for the drill and the guide
  sleeves" (6 of 15) is wrong. **CI:** `tools/ci/smoke.js` fails a hub whose statement keys form a pattern (a two-statement choice
  keyed in over 40% or under 10% of items, a numbered key position over 45%, a statement number true in over 90%); rule notes
  [two-statement-and-true-false](vault/rules/two-statement-and-true-false.md) and [numbered-statements](vault/rules/numbered-statements.md)
  say so. `LESSONS.md` refreshed (Live signals; lessons on the key's position and on steering through what people tap). No reading
  text, audio or schema change.
- **2026-11-05 (new hub: Heme & Endo Exam 2, `hubs/heme-endo-exam2/`, Claude Code)** — Sam: "build a hub for heme and endo
  exam 2. yes to all animations. no need to verify before release. merge when ready", then "use extra effort" and "also vet
  all questions for accuracy and effectiveness" (the waived preview gate and the merge are in [decisions](vault/decisions.md)).
  DENT 2160 Exam 2, Fri 11/13, 10:00-11:30 am, 50 questions (45 on L11-L18 and Lecture A, 5 on Exam 1). Built on the PCD
  Implants Exam 1 engine (Home, the labeled Question Bank panel, pins, High Likelihood, the mock), palette "Luteal". **609
  questions in 9 lectures:** L11 diabetes pharmacology and L12a/L12b endocrine pathology written from their recordings;
  Dr. Taylor's Lecture A and L13-L16 reproductive histology and physiology from slides and speaker notes (`status:'slides'`
  until their recordings); R, an Exam 1 Refresher of 81 questions copied from `heme-endo-exam1` (`r-<id>`). Every new lecture
  has two-statement, true/false and numbered items, a why for every choice, High Likelihood topics, notes at both levels and
  both narration levels (new `tools/narrate.py`: a hub's READINGS to Kokoro mp3s, [narrate-with-kokoro](vault/how-to/narrate-with-kokoro.md)).
  **Vetting:** a second reviewer checked each of the 528 new questions against its slides and recording; 131 were rewritten
  (wrong or doubtful keys, give-aways, duplicates, a distractor that was also true), and numbered-statement keys were spread
  out. Where a lecture contradicts a textbook or itself the hub keeps what was taught; the list is in the hub note
  ([heme-endo-exam2](vault/hubs/heme-endo-exam2.md)). **Nine animated figures** (`tools/figures/heme-endo-exam2/`, placed
  by its `place.json` under a notes heading and in Review): diabetes drug sites, insulin curves, primary vs secondary labs
  (L12a and L12b), CAH on the steroid pathway, the seminiferous tubule, the duct system, follicle stages, the 28-day cycle
  (L14 and L16) and the male HPG axis. The Cycle Arcade (`HEE2_SKIN`), the dashboard card and arcade, its medal
  (`widget/ranks.js`), the admin and recap lists, `sw.js` sh-v57, the About page (Home, Arcade, Diagrams). Light-mode tag
  colors darkened for contrast; its accessibility baseline (0 issues) and performance budget are new. For every hub, the
  shared Stats launcher's spoken name now starts with the count it shows (`widget/v3.js`, BUG-003 in part), and the admin
  page test names Heme & Endo Exam 1's card in full now that two Heme & Endo cards exist. Not yet in it: L17
  and L18 (no slides on 11/5) and the recordings of A and L13-L16:
  [the task](vault/tasks/2026-11-05-heme-endo-exam2-l17-l18-and-recordings.md).
- **2026-11-05 (analytics retention in force: `migration_v52.sql`, Claude Code)** — Sam approved the retention schedule ("Yes to the data retention suggestions", 2026-11-04); [vault/reference/analytics-retention.md](vault/reference/analytics-retention.md) says what is kept and for how long. **Applied live on 2026-11-05** after Sam's "go ahead" (numbered v50, then v51, while #236 and #240 took those numbers). It drops the unused `activity_pings_visit_idx` (27 MB); lets a retention delete or a device link skip the rollup rebuild (`sh.keep_rollups`), so `activity_hourly` / `activity_visits` keep hours whose raw pings are gone; `redeem_link_code` moves the rollups itself; `get_hub_recap` reads `activity_hourly` (the pre-09-25 idle cap went with the raw pings: only Hepatobiliary's already-published recap had it); new `feature_daily` and `retention_runs`; `sh_retention_run(p_apply)` (counts only by default) and `sh_retention_status()`, closed to visitors; `get_data_quality` returns the status; and a weekly pg_cron job `sh-retention-weekly` (Sundays 09:23 UTC). **First run:** 89,387 raw pings older than 2026-10-06, 81 "No thanks" rows of closed surveys, 14 link attempts, 3 test rows; every hub's hourly totals and every archived hub's recap identical before and after; database about 221 → 200 MB; live `rls-audit.sql` clean. Repo: `tools/retro.sql`, `tools/lessons-daily.sql` and the lessons-audit skill read `activity_hourly`; `tools/analytics-quality.sql` gains the retention checks; the admin page's Insights → Data quality has a **Retention** row (flagged when the job misses a week) and its storage growth comes from the runs' sizes; the About page's "What the hubs record" says how long each kind of data is kept; `tools/release/retention.js` tests it in CI ("Check hubs") and `run.js`. Left: the school-year collapse of the hourly rollup and Sam's call on the question-health rows (inbox). Task: [vault/tasks/done/2026-11-04-analytics-retention.md](vault/tasks/done/2026-11-04-analytics-retention.md).
- **2026-11-05 (Settings rows and Timmy's bubble fit a phone at the largest text: BUG-013, Claude Code)** — the follow-up to the top-bar PR (#235). **Settings sheet** (dashboard `index.html` `.set-x .set-seg`, hubs `widget/v3.css` `.shset-x .shset-seg`): a row of buttons beside its label was `flex:none`, so Timmy Tooth's Everywhere / Dashboard only / Off ran past the sheet at XX-Large on a phone; rows now shrink to their line and wrap (unchanged at normal text). **Timmy's speech bubble** (`widget/pet.js`, the dashboard perch): `place()` flipped it to his left whenever the right had under 200 px without checking the left, so at 320 px with the largest text it started 95 px off screen. It now measures both sides (rects against the page's own rect, turned into CSS px by the perch's offsetWidth), takes the roomier one, caps its width to that room (`--pet-room`), and goes above him, kept on screen, when neither side has 120 px. Its `100vw` caps use `--pet-vw` (the screen in zoomed px, set when he talks), the house bubble is capped to its scene (260% of his spot). **CI:** `tools/ci/smoke.js` opens the Settings sheet on the dashboard and every hub at 390 px with the largest text and fails a button past the sheet's edge (fails on `main`, passes here). The other two follow-ups from #235 (Perio's arcade 6 px, the Review table's keyboard stop) were already fixed by PR 239. `sw.js` sh-v56.
- **2026-11-05 (no post-release monitoring, Claude Code)** — Sam: "take out all of the monitoring instructions now and
  for the future". The 1, 24 and 48 hour checks after a release are gone from `RELEASE_TEST_PLAN.md` (section 11 is now
  "Release and post-release verification"), the [preview-and-release-test](vault/rules/preview-and-release-test.md) rule,
  [ship-a-change](vault/how-to/ship-a-change.md), the PR template, the test-report template and the repo map;
  `tools/release/monitor.sql` is deleted, and the open "Monitored" boxes came off the current reports. The pending
  1-hour check for the admin page release was cancelled before it ran. `postcheck.js`, the changelogs and rollback stay.
- **2026-11-04 (Question health for every hub, Claude Code)** — Sam: "Build a question-health system for all hubs. Create
  stable question IDs, track accuracy, retries, time/abandonment, explanation engagement, and feedback; flag likely-quality
  problems for admin review without automatically deleting or changing educational content." How it works and every
  threshold: [vault/reference/question-health.md](vault/reference/question-health.md). In short:
  - **Stable ids**: `tools/question-ids/<hub>.txt` registers every id each hub has shipped (written from the live banks,
    plus ids with class data that are no longer in a hub, marked retired); `tools/ci/smoke.js` fails a renamed or deleted
    id and a retired id that comes back, and a local run adds new ids. New rule:
    [question-ids-are-permanent](vault/rules/question-ids-are-permanent.md). Versions: a fingerprint of what SH_EXPORT
    shows of a question, so an edited question starts fresh numbers.
  - **Tracking**, `widget/qhealth.js` (loaded by v3.js, no hub code): per answer, which try it was for that person, the
    previous result and gap, the choice, active time before answering and on the explanation after, and taps in the
    explanation; a card read 3 s or more and left unanswered is a view (abandonment). Batched to `record_qh`
    (`migration_v51.sql`, applied 2026-11-04: `question_versions`, `question_events`, `question_feedback`,
    `question_reviews`). `sw.js` → `sh-v55`.
  - **"Good question?"**: a thumbs up/down under every explanation, with a reason on a thumbs down (`qh_vote`); on the
    About page.
  - **Flags for review**: `qh_report(hub)` (SQL connector) and the admin page's new **Question health** tab (`review/`):
    below chance, very hard, possible miskey, stronger students missing it more, missed again, open reports, thumbs
    reasons, disliked, slow, often left unanswered, explanation skipped, ids not in the hub. Sam marks each Looks fine /
    Needs a fix / Fixed with a note (`admin_review_question`, metadata only); a new flag or a new version brings it back.
    New rule: [question-health-flags-are-leads](vault/rules/question-health-flags-are-leads.md): **nothing changes,
    hides or deletes a question automatically.** The lessons refresh now reads the list (`tools/lessons-refresh.md`).
  - Timing, abandonment, the explanation and thumbs count from today; accuracy, miskey, retries and top-vs-bottom fall
    back to every answer ever (`personal_answers`, `question_choices`) until a version has 10 first tries. First run on
    the live data: 10 Perio questions to review (one possible miskey, q4-06).
- **2026-11-04 (admin page redesign; who's studying now, hub archive overrides, newest-first check-ins, Claude Code)** — Sam's
  asks: safer admin operations, then "a full optimization of the admin page. Its clunky and not user friendly". **The page**
  (`review/`) is rebuilt with the taste-skill's app-screen run: a sidebar of views (Overview, Live, Inbox; Insights, Time by
  section, Questions, Clicks and features, Searches, Engagement; Exam check-ins, Surveys; Hubs on the dashboard, Recap),
  each with its own address, title, a one-line finding and only the controls that apply; data loads per view instead of
  18 queries at once; Overview says what is waiting on Sam; check-ins and searches have their own views; on a phone the
  sidebar is a Menu sheet. #237's Insights tab moved in as a view, unchanged in what it computes. **Live view**: how many
  people used a hub in the last 3 minutes and, hub by hub, their leaderboard names (Sam's call), never an id, email or
  section; it asks every 30 s only while open and visible. **Hubs view:** set any hub Live, Archived or Hidden on the
  dashboard by hand, until set back to Automatic or until an optional end time (Sam's call), with a confirmation, a note,
  an audit log and a stale-tab check; nothing is deleted. The rules live once in `widget/archive.js` (loaded by
  `index.html` and `review/`; `widget/v3.js`'s archived notice follows them). **Exam check-ins:** groups sort by their
  newest check-in (they sorted by hub name, BUG-019), rows and survey answers newest first with an id tie-break.
  `migration_v50.sql` (numbered v49 until #237 took that number; tier 3, **applied 2026-11-05** after Sam's written
  approval, "Merge when ready"; the live permission audit found nothing after it): `hub_archive_overrides`, `hub_archive_log`, `get_hub_overrides`, `admin_hub_overrides`,
  `admin_set_hub_archive`, `admin_hub_archive_log`, `admin_live_presence`, and `get_exam_debriefs` / `get_survey_results`
  in order; `supabase/schema.sql` now also records the `activity_hourly` version of `get_exam_debriefs` applied on 10-30
  (PR #205, never merged). `sw.js` sh-v54. No About page entry (Sam: admin information stays off it). Preview fixtures
  for every admin view. Tests: `tools/release/admin-ops.js` and `tools/ci/archive.js` (in CI), `tools/release/admin-ui.js`
  (`run.js`, as `adminui`). How it works: [vault/reference/admin-operations.md](vault/reference/admin-operations.md).
- **2026-11-05 (small-screen fixes from the first full release test, Claude Code)** — The first full "Release tests"
  run on GitHub (WebKit and Firefox for the first time) found pages that scroll sideways. Most were the top bars, which
  the measured top bar (PR 235, its entry below) fixes for every hub and the dashboard. The rest, fixed here: **Perio's arcade** no
  longer wiggles 6 px sideways on phones (its full-bleed margin follows the page's 14 px padding at 520 px and below), and
  **Perio Review's** tables that scroll sideways take keyboard focus and are named for screen readers ("Antibiotics
  (table)"). The device matrix (`tools/release/matrix.js`) now measures against the layout width, because a phone browser
  zooms out to fit a page that's too wide, which hid the overflow from Chromium's phone emulation; it also names the
  element that sticks out. Bug log BUG-015 to BUG-018.
- **2026-11-05 (The drawn Patient Box case system for every hub; anatomy and realism, Claude Code)** — Sam: "I also want
  this system to be called for patient box questions in other hubs", "All teeth need to be anatomically correct. All
  variables need to be realistic", "Merge when ready". The case kit moved out of the Perio hub into **`widget/cases.js` +
  `widget/cases.css`** (`window.shCases`; a hub loads both and calls `shCases.pboxFigures(q, PCASES)` from its
  `pboxHTML`, `shCases.refHTML(q)` for the "In the notes" buttons). **Every tooth type is redrawn from Wheeler's anatomy**:
  crown shapes with the right cusps (two buccal cusps on upper molars, three on the lower first molar, two on the second),
  contact heights and incisal angles, the canine's long root, the upper first premolar's two roots, the upper molars'
  palatal root behind the buccal pair, the lower molars' broad mesial and narrower distal roots curving distally, root
  trunks above the furcations, the cervical line dipping at mid-facial. **`shCases.validate()`** rejects unrealistic or
  inconsistent numbers (ranges for probing depths, recession, CAL, bone loss, mobility, furcations, implants, age,
  cigarettes, HbA1c; the pocket base and the bone crest must agree unless a vertical defect is declared; a furcation
  needs a molar and bone loss to the trunk; a Class III is through and through), and **`node tools/ci/cases.js`** (new
  CI step) runs it on every hub's `PCASES` and checks each case's `expect` against `derive()`. **PCD Implants** (exam Nov
  6): its four L8 Patient Box items now draw their cases (mucositis, peri-implantitis under a cement-retained crown with
  the cement fleck on the film, a new patient with no baseline, an early failure under a cover screw with the radiolucent
  line) with "In the notes" buttons. **Occlusion** has the hook and an empty `PCASES`. How-to:
  `vault/how-to/draw-a-patient-box-case.md`. Sam approved the release in chat.
- **2026-11-04 (Perio: Patient Box cases drawn from their numbers, Claude Code)** — Sam: upgrade the Perio Patient Box into a
  visual diagnostic-case engine (the midterm check-ins asked for "cases with pictures, charts and radiographs" and more
  staging/grading cases). A **shared kit**, `tools/figures/shared/dental-cases.js` + `.css` (the Occlusion case-picture
  tooth model generalized; pasted into the hub between the `pcase` markers by `tools/figures/perio/build.mjs`), draws a
  **periodontal chart** (an SVG strip per surface like a probing chart, blue margin line, red pocket line, bleeding dots,
  furcation triangles, mobility, implants, missing teeth, with the numbers as a table), a **periapical radiograph**
  (per-side bone levels as % of root length, angular defects, furcation radiolucency, calculus, crowns, root fillings,
  amalgams, implants against a baseline) and a **drawn buccal view** (recession, swollen or fibrotic gingiva, bleeding,
  suppuration, plaque, calculus), all from one case model, and `derive()` works the 2018 stage, grade and extent,
  recession types and peri-implant states out of the same numbers; `tools/figures/perio/cases-check.mjs` fails the build
  when a case's `expect` disagrees. **Six cases, 16 questions** (`PCASES`, `pc-*`: staging and grading, gingivitis vs
  periodontitis with D4346, RT1-3, a Class II furcation with the stage trigger and the smoking modifier, a deep narrow
  defect for regeneration, peri-implantitis and Meffert), each with a why per choice, memory cue, and **"In the notes"**
  buttons (`q.ref`, through `SH_GOTO`; tracked `case:ref`). A question's `pfig` hides the row that would give its answer
  away (CAL, furcation). `LIKELY_TOPICS` updated (two new topics); About page. No notes text, narration or schema change.
  Tier 2: a draft PR for Sam's look; the expansion waits for approval ([task](vault/tasks/done/2026-11-04-perio-visual-case-engine.md)).
- **2026-11-04 (top bars fit their content: no more clipped Arcade tab, Claude Code)** — Sam: the dashboard top bar is cramped and
  the Arcade tab gets cut off. **Root cause:** every hub picked its top-bar layout from a stack of screen-width breakpoints
  (380/520/560/760/860 in each hub, plus the 561-1000 px patch of 2026-10-28 in `widget/v3.css`), but whether the bar fits
  depends on what's in it: the hub's name, your name and rank, the countdown's wording, the streak and tour buttons, the font,
  and the text-size setting, which zooms `<html>` where media queries can't see it. When a guess was wrong, `#modeSwitch`
  (`min-width:0; overflow-x:auto` with a hidden scrollbar) shrank and **clipped Arcade** with nothing to show it was there (1001-1280
  px in six hubs), or the tabs ran past the edge (320 px, four hubs, the page scrolled sideways); under 760 px some tab labels were
  `display:none`, leaving tabs with no spoken name. **Fix (shared):** `widget/v3.js` measures the bar (ResizeObserver, a
  MutationObserver for names and pills filling in, font loading) and keeps the first layout that fits: `data-sh-head` = `row` (one
  line, every tab at full size), `stack` (title and pills on top, full-width tabs below) or `stack3` (phones and large text: title
  and the round buttons on top, your name and the pills next, then the tabs; your name shortens with an ellipsis before the
  countdown wraps); `data-sh-tabs` = `inline`, `tall` (icon over label) or `grid` (two columns). `widget/v3.css` draws them, scoped
  to `header.hub-header[data-sh-head]` so they outrank each hub's own breakpoints; labels always show, the hub's name shows on
  phones (with an ellipsis), touch screens get 40 px tabs and 32 px round buttons. It also keeps `--sh-head-h` current. **Dashboard**
  (`index.html`): the top bar's buttons are one group (`.tb-actions`) that wraps onto its own row when it doesn't fit beside the
  wordmark and live count; the Arcade high scores' hub and game rows wrap instead of scrolling past the edge (the game row is now a
  group of `aria-pressed` buttons, not a tablist without arrow keys). **Perio:** the arcade leaderboard tabs wrap. CI:
  `tools/ci/smoke.js` checks the dashboard and every hub at 320 px, 1001 px and 390 px with the largest text: no sideways scroll,
  every top-bar control and tab fully on screen and not clipped, every mode tab labeled. About page: "A top bar that fits your
  screen"; Hub modes now says four modes. The largest text also showed Home's "Where to next" rows wider than a phone in
  five hubs (a shared guard in `widget/v3.css`: the column may shrink, the button drops below) and Perio's course-map titles
  (`overflow-wrap`). Bug log BUG-010-013; report `vault/release/reports/2026-11-04-responsive-top-bars.md`.
  `sw.js` -> `sh-v53`.
- **2026-11-04 (analytics governance and learner insights, Claude Code)** — Sam asked for an analytics governance and
  learner-insights layer over every live and archived hub. **Admin page**: a new **Insights** tab (`review/`) puts every hub
  side by side (scorecard, where time goes by canonical surface, spacing of retries, feature reach, student voice, data
  quality); each number past its threshold (`INSIGHT_RULES`) turns orange and the card lists the decision it drives. Hubs
  with fewer than 5 people are left out. The admin page now reads hub names, exam dates and live/archived status from
  `HUBS` / `ARCHIVED_HUBS` in `index.html` instead of its own lists. **Database**: `migration_v49.sql` (applied; read-only:
  `sh_surface`, `sh_insights`, `sh_insight_retries`, `sh_data_quality`, and admin wrappers `get_insights`,
  `get_insight_retries`, `get_data_quality`); `supabase/schema.sql` refreshed. **Vault**: [analytics-governance](vault/reference/analytics-governance.md)
  (start there), [event-taxonomy](vault/reference/event-taxonomy.md), [analytics-data-quality](vault/reference/analytics-data-quality.md),
  [analytics-retention](vault/reference/analytics-retention.md) (a proposed schedule, nothing deleted: the free plan's 500 MB
  is about 7 weeks away at the current rate; task `vault/tasks/2026-11-04-analytics-retention.md` waits on Sam),
  [insights-dashboard](vault/reference/insights-dashboard.md) (the cards, the first reading, proposals for Sam), and a new
  rule, [learner-data-privacy](vault/rules/learner-data-privacy.md). **About page**: "What the hubs record". Also
  `tools/analytics-quality.sql`, a format breakdown and stale-id list in `tools/lessons-join.py`, and three standing
  lessons in `LESSONS.md`. The preview answers the three admin calls with made-up numbers (`synthInsights()` in
  `tools/preview/runtime/preview.js`), and `tools/release/rls-audit.sql` checks the new internal functions stay closed
  to visitors (the live audit returned no findings after the migration).
- **2026-11-04 (a permanent preview and release-test process, Claude Code)** — Sam's ask, now a standing rule
  ([vault/rules/preview-and-release-test.md](vault/rules/preview-and-release-test.md)); the whole process is
  [`RELEASE_TEST_PLAN.md`](RELEASE_TEST_PLAN.md) (tiers, previews, data isolation, test accounts, gates, UAT, device matrix,
  bug log, Sam's approval, release, monitoring, rollback). **Previews:** `tools/preview/serve.js` (this checkout, on the fly)
  and `build.js` (a static copy; the "Release tests" workflow attaches it to every site-changing PR as `preview-site`). A
  preview runs on fixture data in the browser and can't reach the class's data: production Supabase URLs and keys are
  rewritten to `fixtures.preview.invalid`, a connect/img/media CSP leaves production out, and `runtime/preview.js` (loaded
  first, previews only) answers PostgREST-style from synthetic data, blocks and counts anything aimed at Supabase, and logs
  every write; pages are noindex (meta, X-Robots-Tag, `_headers`, robots.txt) and titled "Preview ·". Its Preview button
  has six synthetic test accounts (`fixtures/personas.json`: new, returning, high-XP, missed-question, archived-hub, admin
  with the secret `preview-admin`), time travel, a class-data switch (normal, slow, unreachable) and the write log.
  **CI ("Check hubs")** adds `tools/release/secrets.js` (keys, course material, data files), `tools/release/rls.js`
  (RLS, grants and secret-gated functions as anon on a throwaway PostgreSQL built from `supabase/schema.sql`, against
  `rls-expectations.json`) and `tools/ci/preview.js` (every page as every account, real write paths into fixtures, and
  production attempted five ways without one request leaving the browser). **"Release tests"** (new workflow) runs
  `tools/release/run.js`: those plus `a11y.js` (axe WCAG 2.2 AA, keyboard focus, reduced motion, against
  `baselines/a11y.json`), `perf.js` (slow-4G phone budgets, `budgets.json`) and `matrix.js` (7 device sizes in Chromium,
  WebKit and Firefox; refresh, history, offline, class data down, slow 3G). After a merge: `postcheck.js` (live files
  identical to `main`, live pages load, every Supabase request blocked) and `monitor.sql` (read-only counts). Also
  `rls-audit.sql` for the live database (run read-only today: no findings, 38 tables and 98 functions, matching the
  snapshot). **Fixed:** `supabase/schema.sql`'s migration_v31 section had `$` for `$$` and couldn't rebuild the database.
  Vault: rule, `vault/how-to/preview-a-change.md`, `roll-back-a-release.md`, `vault/release/` (UAT checklist, bug log with
  the known accessibility and slow-3G issues, the dry-run report), a report template and a PR template. Sam looks at a change
  and doesn't test it: every site-changing PR gets a Cloudflare Pages link in a PR comment (once the token is in GitHub;
  no Timmy Time episodes in that copy), plus screenshots; no staging database for now (Sam, 2026-11-04). No site change: nothing students see changed.
- **2026-11-04 (Occlusion: every figure vetted, audited and fixed, Claude Code, [PR #232](https://github.com/smcmurry6-source/study-hubs/pull/232))** —
  Sam: "vet, audit, and improve all occlusion figures." Every drawn figure in the hub (the kit drawings, contact map and cusp
  game, the 19 anima figures and the case pictures) was checked against the hub's notes and questions, at 390 px and in both
  themes, and fixed in its source in `tools/figures/occlusion/` (no new figures, no notes or audio changed).
  - **Kit and game (L1):** #30's anatomy (MB widest, D smallest), the inclines figure, the sagittal envelope's E, the contact
    map's straight contact lines and variable band, the cusp game's reveal. Class III #4 stays on #30's mesial fossa (the
    help sheet's picture). The pathway questions `fig-pmax-*`/`fig-pmand-*` no longer give the arrow's direction in the stem.
  - **L1 anima:** `crslide` (Fig 7) worked out at true scale on the shared skull rig (second-molar contact, a 1.25 mm slide,
    the condyle 0.39 mm off its seat); `envelope` (Fig 6) step text describes the border just traced, and the frontal letters
    follow Dr. Givan's handout (C = right lateral opening, D = right lateral superior; `fig-front-d` now asks about C, same
    border and answer); `interferences`, `guidance`, `cuspmotion` and `cuspheight` redrawn so inclines sit on their cusps,
    Class I positions are right and the cusp stays on the jaw.
  - **L2, L3, L5:** the TMJ (Fig 1) gets a real ramus and coronoid under the arch and a lateral pterygoid that runs below the
    eminence; muscles (Fig 4), swallowing (Fig 9, a full midline section) and the implant figure (Fig 10, the wrong "x500"
    readout fixed) corrected.
  - **L6:** `hingearc` (Fig 12) drawn on the rig with the magnified molar miss; `scirec` (Fig 13) shows real molars whose
    cusps grow with the setting; `bennett` (Fig 14) the lower left molar the right way round, with the non-working cusp
    leaving the central fossa distobuccally.
  - **L7:** `l7rig.mjs` now draws a whole skull and a real mandible with the disc's true profile (Figs 7, 12, 15-17 use it;
    cropped edges fade); labels moved off the teeth; thirds numbered from the central fossa; erosion stacks on a phone.
  - **Case pictures:** radiographs rebuilt on one tooth model in mm (PDL, lamina dura, osseointegrated implants), the TMJ film,
    the Div 2 and right buccal views, articulating-paper marks and wider perio charts.
  - **Labels and hover text name only what the lecture teaches** ([figures-teach-the-lecture](vault/rules/figures-teach-the-lecture.md)):
    "ear canal" for EAM; no orbit, mastoid, sigmoid notch or postglenoid process.
  - Open questions for Sam are in the PR and [vault/hubs/occlusion.md](vault/hubs/occlusion.md) → Pending.
- **2026-11-04 (PCD Implants: the seven implant types redrawn, the intramucosal insert added, Claude Code)** — Sam: "there
  are only 6 drawn and i feel like they could be better and more accurate." The L1 drawings (`FIGS` `ty-*`) were hand-pasted
  boxes: teeth as teardrops, a subperiosteal frame sunk into the bone, transosteal posts that missed the bar, a blade's bar
  floating in the air, and no intramucosal insert. They are now built from `tools/figures/pcd-implants-exam1/types.mjs` (by
  `build.mjs`, which also rewrites the `var FIGS` line; `--check` covers it), in the lecture's order A-G: subperiosteal,
  endodontic stabilizer, transosseous (Bosker's TMI: base plate, four posts, cortical screws, bar), intramucosal insert
  (buttons on a palateless upper denture), blade, ramus frame, root form. Each is drawn the way it turns up (a panoramic or
  periapical radiograph, or the denture's tissue side) with numbered parts and a key, plus a section through the jaw
  showing where it sits. Above a question the section is hidden (`.qcard-figure:not(.qcard-figure-after) .ty-sec`) until
  it's answered, so it can't give the answer away. Checked against Linkow (1970, 1977), Bosker's patent 4,516,937, the
  intramucosal insert patents and the ICOI glossary for accuracy, but under Sam's new rule
  ([figures-teach-the-lecture](vault/rules/figures-teach-the-lecture.md): outside sources for accuracy, the lecture for
  what's shown and named) the keys name only what L1 teaches (no strut types, cortical screws or blade depths). Same rule
  applied to `attach` (tooth vs implant): still drawn to Gargiulo's and Cochran's layers, but its labels now give only the
  lecture's 2.04 and 3.08 mm, not each layer's thickness. Two new picture questions, `ev-pic-mucosal` and `ev-pic-root`,
  added to the types' High Likelihood topic. About page updated. No notes text, narration or schema change.
- **2026-11-04 (Perio: all figures audited and fixed, Claude Code)** — Sam: "vet, audit, and improve all perio
  figures." Six anima figures (`tools/figures/perio/`, rebuilt into the hub) and the suture diagrams (`SUTURE_DIAGRAMS`):
  - **Peri-implant health, mucositis, peri-implantitis** (S7): redrawn from scratch to scale (15 px/mm) as a section
    through the ridge. Threaded implant, abutment and crown with emergence profiles; a buccal and lingual plate that
    remodels about 2 mm and then craters in peri-implantitis; mucosa that reddens and swells; a probe that bows around
    the crown and reads 4, 5.5 and 8 mm against the baseline; bleeding and pus; brackets for the remodeling line and
    the bone lost beyond it; a 5 mm scale bar.
  - **Ailing, failing, failed** (S7): redrawn as three radiographs with the neighbor teeth. Each film's crest is
    compared with a dashed line for the crest on the previous film. The failed implant wobbles, with a radiolucent band.
    A key says a film shows bone, not inflammation or mobility. On a phone it shows one film at a time.
  - **BOP over four visits** (S7): the axis says "losing 2 mm or more of attachment"; tooth sites, Lang 1986 (cited).
    Fixed the bars' grow animation (negative heights in the console).
  - **When to take implant radiographs** (S7): a brace shows the extra film can come at any maintenance visit. Phone
    layout as a vertical list.
  - **Biofilm** (S8): the barrier step works again after β-lactamase (the test never reached exactly 0).
  - **Antibiotic targets** (S8): mRNA drawn on the 30S, drug dots on the lit target, simplification note.
  - All: the title corner hides on phones so it no longer runs into the readout.
  - **Suture diagrams** (S2): one proximal tooth behind the interdental section, not two crowns; periosteal anchorage
    labeled apical and coronal, with the flap margin; the horizontal mattress strand now ends at a cut, not running off
    the picture; braided thread as herringbone. Figure-eight caption and q2-D03 explanation keep only what the notes
    say (flaps that won't meet closely, as with apically positioned flaps).
- **2026-11-04 (PCD Implants: all eleven figures checked against the notes and fixed, Claude Code)** — Sam: "vet, audit, and
  improve all implants figures." Each figure in `tools/figures/pcd-implants-exam1/` was rendered in every state, both themes and
  at 390 px, and read against its lecture's notes. **Content fixes:** `attach` (tooth vs implant) drew the tooth's junctional
  epithelium about 2.4 mm long, starting above the CEJ, and the implant's layers didn't add up to its 3.08 mm mark; now the
  sulcus, JE and connective tissue are to scale on both (tooth 0.69 / 0.97 / 1.07 mm, Gargiulo 1961; implant 0.16 / 1.88 /
  1.05 mm, Cochran 1997, the averages behind the lecture's 2.04 and 3.08), with enamel, dentin, pulp, PDL and lamina dura,
  and the implant's circular fibers shown cut across. `zones` drew the B zone convex (the notes: concave) and said the margin
  "creeps down (coronally)" while it moved up; it is now an upper incisor in section (coronal down), B zone concave, the facial
  E zone on the slider, the palatal side following the natural tooth, with the straight-E-zone margin marked. `retention`
  (screw or cement?) had the crown floating on the gum with nothing reaching the implant, and its facial tilt showed nothing;
  now a lower molar in section in occlusion: one-piece screw-retained crown on a titanium base with the abutment screw and
  access channel, the channel coming out through the buccal when the implant is tilted, and an angled abutment with a
  cemented crown when that forces cement. `position`'s section labeled "2 mm+" on a gap drawn at 6.6 mm (it claimed 16 px
  per mm); every distance is now measured at the crest and to scale (3 / 1 mm anterior, 1.5 / 1.5 mm posterior), the
  proximal values sit in a row with what the rule needs, the tooth-implant papilla is drawn, and touching a slider switches
  to the proximal view. **Drawing fixes:** `connection` (the external hex was hidden behind the abutment; every connection now
  shows the abutment screw), `stages` (white gaps around the final abutment, the crown sitting on the gum, floating sutures,
  and surgery 2 now closed around the healing abutment), `guided` (freehand drew a 28-degree tilt poking out of the bone;
  fully guided and dynamic now land 1.1 mm / 1.3 mm off, the L8 averages, freehand and pilot marked as illustrations; the
  pilot template comes off after the pilot drill; the screen no longer covers a tooth), `misch` (the marrow spaces formed a
  diagonal stripe; now both arches in occlusal view and a trabecular pattern whose marrow spaces grow from D1 to D4),
  `stability` (a kink in the total curve; the inset labels old bone, the resorbed gap and new bone), `cantilever` (the bridge
  is drawn unit by unit, a clipped label, the 0 lb wording), `cbct` (two clipped labels), and leader lines that crossed their
  own labels. `shared.mjs`: `amLive` calls `D[D.ONSET]` after a button or slider sets a key. Checked: `build.mjs --check`,
  every figure mounted in the hub's notes (light 1200 px, dark 390 px), anima's line check (0 of 0: these figures use no
  `.iso-line`), `syntax.js`, `vault.js`, `smoke.js`. About page (the Diagrams entry). No question, notes text, audio or
  schema change. Phone labels are still small (inbox).
- **2026-11-04 (Occlusion L6: the mounting-error figure redrawn and made accurate, Claude Code)** — Sam: "the articulator
  anima is not accurate." `mounterr` (L6 notes at "The facebow transfer" and Review) is rebuilt in
  `tools/figures/occlusion/anima/mounterr.mjs`. What was wrong: the casts didn't meet (a gap between the arches), only the
  maxillary cast moved (the mandibular cast is mounted to it with the CR record, so both carry the error), the condylar
  element hung outside its housing, there was no incisal guide table, the lit teeth were drawn to the rule rather than
  worked out, and "Move to the side" showed the same side view as protrusion. Now: a semi-adjustable arcon articulator to
  scale (condylar elements on the lower member, housings with a 35° condylar guidance on the upper, the incisal pin on the
  upper member lifting off a flat incisal guide table as the casts' own front teeth guide, mounting plates and stone),
  both casts in Class I occlusion moving together, a slider for the size of the error (1-15 mm) and a chart of how many
  microns more or less each lower posterior tooth drops on the articulator than in the mouth after 1 mm of protrusion.
  One closed-form model (`meModel`: condyle down 35°, lower incisal edge down the upper central's 50° lingual surface, 3 mm
  overbite, incisal edge 82 mm in front of and 43 mm below the axis) drives both panels. It reproduces the slide's rule
  for all four errors: too far back or too high puts the teeth closer to the axis, the back teeth separate less there
  (−19 / −13 µm at the second molar for 10 mm), so work built there leans on the anterior teeth; too far forward or too low,
  they separate more (+16 / +11 µm), cusps are built too tall and the most posterior teeth hit. An arbitrary facebow's 2-5 mm
  gives 2-9 µm, in line with the notes' "clinically insignificant". The direction reverses if the anterior guidance is
  flatter than the condylar guidance (said in the figure's sources). Laterotrusion is no longer drawn: a 3-D check of right
  laterotrusion matched the slide for back/forward errors but not cleanly for high/low on the non-working side, so the figure
  states the slide's rule for it instead of showing a side view that can't. Checked with anima's line check (both themes),
  at 390 px and in dark mode, in the hub's notes; caption and About page updated. No question, notes text or audio change.
- **2026-11-04 (site down: repo made private, Claude Code)** — The repo was made private for a while; on GitHub's free
  plan that unpublishes Pages, so the whole site returned "Site not found" from about 16:24 to the next publish. Making it
  public again didn't turn Pages back on: Sam re-enabled it in Settings → Pages (`main`, `/ (root)`). That publish timed
  out during GitHub's Actions/Pages incident, and its re-run failed with "Deployment cancelled" (same commit, same
  deployment ID), so this notes-only PR is the new commit that publishes the site again. What to do next time:
  `vault/reference/shared-infrastructure.md` (GitHub Pages deploy).
- **2026-11-04 (class picks on each choice, Sam's ask, Claude Code)** — `widget/v3.js` + `widget/v3.css`, every hub, no hub
  changes: once a question card is answered, each choice shows the share of the class that picked it (a % at the right, a fill
  behind the choice as wide as its share, the top pick in bold) and a line under "% of the class got this right" says how many
  answers it's from. Reads `question_choices` (by authored index) through `shGetClassStats(qids, cb, true)`, which now also returns
  `byQid[qid].choices`; choice buttons are found by `data-idx`, `data-multi-idx`, `data-mock-pick`, `data-mock-multi` or
  `data-exam-choice` (`CP_ATTRS`), so a new hub that keeps those attributes gets it for free. A card drawn unanswered fetches the
  counts as it renders and adds your own pick from the answered event (no race with `record_choice`); a card drawn already answered
  (mock results) waits 1.2 s and uses the server's numbers. Multiple choice: picks / all picks; select-all: ticks /
  `question_stats.attempts`. Shown from 2 answers. Nothing shows during a mock exam. About page: "Class accuracy on every question".
- **2026-11-04 (Supabase: `admin_reset_changelog` refuses a missing secret, Claude Code)** — Found by `/reddit-scout`'s
  first run, Sam's go. The function checked `p_secret <> '...'`; with `p_secret = null` that comparison is NULL, so the
  check was skipped and any visitor with the publishable key could have emptied the site changelog and written their own
  entries. `migration_v48.sql` checks it with `sh_admin_ok()` like every other admin function (`is not distinct from`, so
  NULL fails); applied to the live database through the connector and checked, and `supabase/schema.sql` updated. The
  other secret-gated functions use `sh_admin_ok()` or `is distinct from`, so none has the same hole. Nothing in the repo
  calls this function. No site change.
- **2026-11-04 ("Find this in the notes" after a missed question, Claude Code)** — From `/reddit-scout`'s first run, Sam's
  go. `widget/v3.js` (`njAttach` and helpers, after `findQuestionMeta`) + `widget/v3.css` (`.sh-nj*`), so every hub gets it:
  when the student misses a question they just tapped, a **Find this in the notes** button appears under the explanation
  (inside `.qcard-explain`, before the class-accuracy row). It opens the best-matching notes paragraph in the card, its six
  most telling words marked, and **Open this in the notes** jumps there through the hub's `window.SH_GOTO` (the search's jump:
  opens the lecture at As taught and flashes the paragraph), closing the Daily drill first if it's open. The match is BM25
  over that lecture's `Notes` entries in `SH_EXPORT.sections` (50+ characters), weighting the right answer 2, the
  explanation 1.5 and the stem 1 (numbers a third), from `SH_EXPORT.questions[].hint`; below a score of 14 or with fewer
  than two shared words there is no button (`NJ_MIN_SCORE`). On the current banks 90-97% of questions get one (Occlusion
  649/671, Perio 633/650, PCD Implants 486/543). Only the card the student just tapped (capture-phase click/keydown), so the
  mock's submit and the arcade never get one; also skipped for `ctx` `mock` / `arcade`. Tracked `notes-jump:shown`, `:none`,
  `:show`, `:open`. Checked in Playwright on Occlusion, Perio, PCD Implants and Special Patient Care, desktop and phone,
  plus the drill and dark mode. About page ("In every hub"); `sw.js` -> `sh-v52`. No hub, notes, audio or schema change.
- **2026-11-04 (Timmy Time comments open folded, Claude Code)** — Sam: under every episode the comment thread now shows
  only its first comment (the first lore comment when there are any), with "Show n more comments" / "Show fewer
  comments" (`aria-expanded`; `pod:<id>:comments-all` still tracks opening it). Posting a comment opens the thread so
  the new one shows. `widget/podcast.js` only (`SHOW_FOLDED`); rule note and About page updated.
- **2026-11-04 (PCD Implants: "Practiced least" on Home, Claude Code)** — Sam approved the lessons audit's proposal. Two days out,
  practice in `pcd-implants-exam1` fell off in bank order (the last four lectures had 6-7 answerers each vs 23 on L1-L2), so Home's
  "Where to next" now lists up to four lectures with under half their questions tried, fewest first, and its Practice button opens
  the Question Bank on them with "Not answered yet" (`homeGo('least:<ids>')`, `STATE.ui.qlec` as an array). It replaces the "Not
  started" row once you've answered anything; a brand-new visitor still sees "Not started". About page (PCD Implants' Home line),
  `vault/decisions.md`, hub note. No question, notes, audio or schema change.
- **2026-11-04 (reddit scout, Claude Code)** — New `/reddit-scout` skill (`.claude/skills/reddit-scout/`, model
  invocation off, so it runs only when Sam calls it): reads r/ClaudeAI, r/ClaudeCode, r/Anthropic and r/claude through
  `tools/reddit-scout/scout.py` (Atom feeds, since Reddit's JSON API answers 403 to cloud sessions; standard library
  only, paced for Reddit's 429s), checks each idea against the repo, Sam's decisions and the docs, and reports only what
  clears the bar; no suggestions is a normal result. Every run is logged in `tools/reddit-scout/log.md`, which also
  tells the next run what was already judged. Unfixed security findings go to Sam in chat, never into the public repo.
  First run (past month, 728 posts) logged there. Listed in `CLAUDE.md`, `vault/home.md` and the repo map. No site change.
- **2026-11-04 morning (lessons audit, PCD Implants two days out, Claude Code)** — `hubs/pcd-implants-exam1`, same ids and answer
  positions: report #37 (`bm-goodacre` printed each complication's percentage in its choice, so the biggest number was the key): the
  choices are now plain names and the numbers are in the why lines. Explanations name the favorite wrong answer on `ev-misch` (Ford
  Turner), `bm-moment` (force / area is stress) and `ev-blade` (screws through both plates are transosteal), and the select-alls `tm-mm-1`,
  `tm-mm-2`, `tm-mm-3` explain every option (explanation and why lines). **Select-all ticks are recorded** in `pcd-implants-exam1`,
  `occlusion` and `special-patient-care`: their `recordAnswer` passes the ticked options as `picks` in the answered event, so
  `widget/v3.js` sends `record_choices` (until now only perio did; `question_choices` has no select-all rows for these hubs before
  today). `LESSONS.md` refreshed (Live signals; standing lessons on bank order, select-all tracking, numbers as giveaways, and the
  Occlusion-then-Heme & Endo check-ins; Heme & Endo retrospective now n = 13). No reading text, audio or schema change.
- **2026-11-04 (Timmy Time: PCD Implants Exam 1 episode, and likes, dislikes and comments on every episode, Claude Code)** —
  A 48-minute last-minute review for PCD Implants Exam 1 (Fri Nov 6): `hubs/pcd-implants-exam1/audio/timmy-time.mp3`
  (35 MB, -16 LUFS), script `tools/podcast/pcd-implants-exam1/script.md`, from the hub's notes (As taught), Exam Hints
  (the course's hint list, every professor quote, Dr. Givan's study guide), cram sheet and `LIKELY_TOPICS`, 14 chapters
  (L1-L9, with Dr. Chen's terms split in two) and a 25-question lightning round. No graded quiz content; no CDT codes,
  clinic credits or brand details without an exam signal (reports #35/#36). Where lectures give different numbers (the 5 mm
  rule vs the 7 mm count from bone vs Dr. Geisinger's table) it says whose is whose. **New rule
  ([podcast-intro](vault/rules/podcast-intro.md)):** the cold open skips the minutiae (no question counts, exam time or
  LockDown Browser); the `/podcast` skill now says so. Lore (Sam picked all four): three Thanksgiving costumes, one per page
  load; Timmy is proud of his ligament (never splint him to an implant); thirty-one thinks he's a failing implant;
  Brånemark's rabbit. `lexicon.json` gains 34 entries (Brånemark, Geisinger, Chavali, Mueninghoff, Straumann, DICOM, ALARA,
  Bremsstrahlung, endosteal/eposteal/endosseous/subperiosteal, periapical, trabeculae, and `S-L-A`, `U-C-L-A`, `U-A-B`,
  whose final A read "uh"). Hub: `SH_PODCAST` (id `exam1-review`), card on Home under the quick-start row, "Also here"
  link, `#timmy` opens Home; dashboard card gets `podcast` and "Timmy Time" in modes. **New rule
  ([podcast-reactions](vault/rules/podcast-reactions.md)), for every episode:** `widget/podcast.js` + `widget/v3.css` add a
  like and a dislike (one per visitor, tap again to undo), the episode's 1-3 lore comments (`SH_PODCAST.fans`, a random
  count; this one has three: number thirty-one, the rabbit down the hill, the toothbrush by the door, all in `LORE.md`) and
  the class's comments (post at once under the leaderboard name, 280 characters, 5 per episode a day, delete your own,
  report anyone's, three reports hide one). `migration_v47.sql` (applied through the connector): `podcast_reactions`,
  `podcast_comments`, `podcast_comment_reports`, `pod_feed`, `pod_react`, `pod_comment`, `pod_delete_comment`,
  `pod_report_comment`, `admin_pod_comments`, `admin_hide_pod_comment`. Admin page: Inbox → "Podcast comments", hide or
  restore any. Tracked as `pod:<id>:like|dislike|unvote|comment|report|comments-all`. About page updated. Older episodes
  get the buttons and the class's comments too, but no lore comments (their hubs are archived). Sam asked about Gemini
  TTS: no `GEMINI_API_KEY` in the environment, so this episode is Kokoro.
- **2026-11-04 (Special Patient Care: the exam's format, 45-question mock, multiple-answer questions, Claude Code)** — Dr.
  Mitchell's exam email: 45 questions, 135 minutes, open notes and lecture materials, no other people, a mix of multiple
  choice, multiple answer, ordering, matching, Hot Spot, fill-in-the-blank and true/false, and no discussing the exam until
  after November 18. Its dates (Fri Nov 17, Sat Nov 18) are an earlier year's calendar; Sam kept opens Fri Nov 6, due Fri
  Nov 13 11:59 pm, and Canvas closes Sat Nov 14 11:59 pm. The hub: `EXAM_INFO` (new Rules and Practice rows), the exam card's
  summary, a Canvas-closes line in `COURSE_DATES`, `EXAM_LAST` / `TALK_FROM`, the header pill ("Past due · Canvas closes
  tonight") and Home's done message (no discussing until after Nov 18; check-in opens Nov 19). The mock is now 45 questions
  in 135 minutes (`MOCK_BLUEPRINT` 5/6/6/6/6/6/6/4, `MOCK_LIMIT`), with one multiple-answer item per unit (`MOCK_MULTI`):
  tick boxes, all-or-nothing for the score, the bank's partial credit and the why list in review; its clock label read
  "/ 90:00" against a 75-minute limit and now reads the limit. 24 new multiple-answer questions, three per unit (`mm()`,
  copied from PCD Implants, inline whys); bank 452 -> 476. Sam chose no ordering, fill-in-the-blank or Hot Spot practice.
  Dashboard: new per-exam `checkinFrom:{date,hour}` (holds the Check in button and pop-up), set to Nov 19 for this exam; the
  card stays live through Saturday (hub-level `archiveOn` Nov 14 hour 24, mirrored in `SH_EXPORT.archiveOn`); the card text
  gives the format. About page (check-in line), hub note, decisions; `sw.js` -> `sh-v51`. No schema change.
- **2026-11-04 (Occlusion L7: five interactive diagrams, Claude Code)** — The five figures Sam approved on 2026-11-03,
  built with anima in `tools/figures/occlusion/anima/` and placed in the L7 notes at both levels (`FIG_PLACE.malocclusion`
  and `FIG_BY_LEC.malocclusion` in `od.js`, in `data-sh-noread` wrappers; READINGS and the mp3s unchanged) and in L7's
  Review tab (`figs` sections next to the matching tables): `tolerance` (normal function + events against a movable
  tolerance line; above it the slides' signs a-g light on a side view with the masseter and temporalis; "Monday, then
  Tuesday"; two SVGs that stack on a phone), `stability` (seat the joints and close to the first contact, bite into MIP
  and the condyle comes off its seat, 1-2 mm / > 3 mm / the 10% with MIP = CR, bruxer loading, a flat plane splint),
  `splints` (maxillary or mandibular, full or partial, stabilizing or repositioning, protrude on the ramp, months of
  partial-coverage wear), `thirds` (slide the lower molar: first third grinding, middle third minor ortho and fixed pros,
  beyond that major ortho, surgery, pros) and `erosion` (both arches, GERD with the side slept on, bulimia, soda swished or
  pooled, citrus sucked or chewed, NCCLs, plus an attrition vs erosion close-up that doesn't say whether erosion facets
  match). `stability` and `splints` share a side-view rig, `anima/l7rig.mjs` (skull, mandible, disc, teeth, a contact
  solver; poses solved in Node). About page "Diagrams" entry updated. No question, notes or audio change; no schema change.
- **2026-11-04 (taste skill, Claude Code)** — `.claude/skills/taste-skill/` (install name `design-taste-frontend`),
  vendored from Leonxlnx/taste-skill (MIT; commit and what was left out in its `UPSTREAM.md`): art direction for web
  pages and app screens, with a library of directions, a source linter and a real-browser inspector. Sam's call: when
  Sam asks for a redesign, the skill is used in full, its house rules included (no monospace, eyebrows, gradients, index
  numbers), even where they differ from a hub's current look; the vault's content and feature rules still hold, and
  nobody restyles a live page unasked (the local box at the top of its `SKILL.md`, `vault/decisions.md`). New
  `tools/chrome-no-sandbox.sh`: set it as `CHROME_PATH` so Chrome-driven scripts run as root in cloud sessions.
  Listed in `CLAUDE.md` → Claude Code specifics; `.taste-skill/` (its working files) is gitignored. Cowork/Claude
  Projects don't load repo skills. No site change.
- **2026-11-04 (Thanksgiving all November, then Christmas to Dec 26, Claude Code)** — Sam: Thanksgiving was only Nov 20-27, after most hubs archive. `widget/eggs.js` (`tgSeason`, `xmasSeason`) and `widget/pet.js` (`holidayId`, kept in step): Thanksgiving now runs Nov 1 to the day after Thanksgiving, and the `winter` holiday (renamed "Christmas"; id unchanged, so costumes, outfits and lines carry over) from then to Dec 26 (was Dec 10-30). Dec 27-30 has no holiday; New Year unchanged. About page dates, `sw.js` -> `sh-v50`. No schema change.
- **2026-11-03 (the repo is a vault: AGENTS.md, vault/ notes, tasks, Claude Code)** — Sam's new standing rule: use the repo
  like an Obsidian vault that any AI agent can be pointed at to do tasks (`vault/rules/repo-is-the-vault.md`). New
  `AGENTS.md` at the root is the entry point for every agent (Claude Code loads it through `CLAUDE.md`). New `vault/`:
  `home.md` (the map), `rules/` (every standing rule as its own note: the `CLAUDE.md` sections and this file's rule
  sections, moved word for word, plus new `repo-is-the-vault` and `american-english`), `how-to/` (new: `build-a-hub`,
  the checklist and every file a new hub or lecture touches), `reference/`, a note per hub (`hubs/`: sources, build
  steps, quirks, diagram calls, pending work; `boards` for the hub on its own branch), `decisions.md` (Sam's calls,
  started from this log), `tasks/` (one note per task with a status, an inbox, `done/`; six open or waiting tasks:
  Occlusion L7 diagrams and final time/format, perio S6, S8 host modulation, S9, and merging `main` into
  `claude/boards-hub`, whose own older `AGENTS.md` will conflict with the new one) and `templates/`. `CLAUDE.md` is now
  short and `@`-imports `AGENTS.md` and every rule, how-to and reference note, so Claude Code sessions load the same
  rules as before. **It no longer loads this file** (over 200 KB, about 50k of the 65k tokens a session started with):
  read its first entries and grep it before you change a hub. When a skill, Project doc or memory disagrees with the
  vault, the vault wins. This file's opening sections became the redirect table above. Notes link with relative
  markdown links (GitHub, Obsidian and agents all follow them); `.obsidian/app.json` sets that up for opening the repo
  root in Obsidian. **New CI check** `node tools/ci/vault.js` (last step of `check.yml`): every relative link in the
  vault, `AGENTS.md`, `CLAUDE.md` and `README.md` resolves, no `[[wikilinks]]`, every vault note has frontmatter, task
  notes have a valid status (done ones in `done/`), every rule note is listed in `vault/home.md` and imported by
  `CLAUDE.md`, and every hub folder has its note on the map. References to `CLAUDE.md` sections in the skills, `tools/`,
  `LESSONS.md` and the CI messages now point at the notes. The repo's skills, checked against the vault:
  `/lessons-audit` drops the retired "carry into the split sources" step, keeps each edited question's why lines in
  step and checks `vault/decisions.md` before proposing; `/podcast` and `/lessons-audit` run `vault.js` and write back
  to the vault; the anima skill opens with a box saying the house rules override it (no figure without Sam's approval).
  No site change.
  **Every agent: write back what you learn to the vault in the same PR** (task outcome, decisions, hub note, new rules).
- **2026-11-03 (lecture notes: scrolling list, Previous / Next, Report, figures that fit, Claude Code)** — Sam: the lecture list
  scrolled with the notes (Occlusion's list is 790 px tall, so on a 768 px laptop L7 was only reachable at the bottom of the notes),
  there was no way to the next lecture from the end of the notes, interactive figures didn't fit on screen with their controls, and
  each lecture needs a flag button. All in the shared widget, so every hub gets it: a "lecture notes" block in `widget/v3.js` sets
  `--sh-head-h` (the sticky top bar's height) and `--sh-vh` (screen height divided by the text-size zoom) on `<html>`, and watches
  for a `.notes-layout` with a `.lec-nav` and an `article.reading`. `widget/v3.css` (wide screens, 861 px+): the list sticks under
  the top bar and scrolls on its own (`max-height` from those vars; the open lecture is scrolled into view, also across the top on
  phones). Under each lecture's notes, `.sh-lec-pager`: Previous / Next (they click the hub's own nav buttons, then scroll to the
  top of the notes) and **Report a problem with these notes**, which opens the Report panel with `shOpenFlag({lec, label})`; the
  report lands in `question_flags` with "lecture notes L2 · Title (id)" in its note, so Inbox replies work as for questions. Perio's
  own "Next:" button is gone (the pager replaces it). **Figures**: an anima drawing's height is capped to about 62% of the screen
  (the SVG letterboxes), and a figure with one drawing and controls (`.anima > figure.iso-figure` + `.am-controls`) gets
  `sh-fig-pin` (sticky under the top bar) when it fits in 70% of the screen, so the drawing stays put while its options and
  explanation scroll under it. Tracked `notes:prev`, `notes:next`, `notes:report`. About page, `sw.js` -> `sh-v49`. No schema change.
  **A new hub gets all of this by keeping that notes markup.**
- **2026-11-03 (Question Bank filters redone in Occlusion, Perio, Special Patient Care and PCD Implants, Claude Code)** — Sam: "it
  doesn't seem like people know how to use it". The data: in Occlusion 66 people opened the bank and 2 ever opened the lecture
  picker; in PCD Implants 5 of the 8 who used it tapped Clear first just to get one lecture; select changes weren't tracked at all;
  and since 10-30 the bank reopens with the last filters with nothing on screen saying so. Each bank now opens with one labeled
  panel (`.qbar`): **Lectures** (Perio: Sessions; the tick list, every row with **Only**, All lectures / Untick all, Occlusion's
  final/midterm presets) beside the search box; **Show** chips with live counts (`BANK_SHOW`: All, High likelihood, Not answered
  yet, Missed last time, Pinned; replaces the status dropdown and the separate Pinned button); **Order** In order / Random; **More
  filters** (folded, "n on" badge): question type (only the formats that bank has, with counts; new: Matching, Put in order,
  Diagram questions in the three shared-engine hubs) and where it's from (new in Perio). Under it, "Showing n of N questions" with a
  tag per filter (tap to remove) and Clear all; an empty result names the filter in the way and offers "Show all N questions".
  **"Likely first" is gone** at Sam's request (High likelihood is a filter: those questions or the whole bank); a saved
  `qorder:'likely'` falls back to In order. Perio's rarely reachable "Mastered" status is gone (a saved one falls back to All).
  Fixed on the way: "In order" stayed highlighted beside "Likely first" after a reload. New tracking (`feature_events`):
  `bank:show=`, `bank:lec-only`, `bank:lec-all|none|final|midterm`, `bank:type=`, `bank:src=`, `bank:more`, `bank:search`,
  `bank:tag-off=`, `bank:clear`, `bank:empty-clear`. Heme & Endo Exam 1 unchanged (Sam). New standing rule (above and `CLAUDE.md`).
  About page. No schema change.
- **2026-11-03 midday (lessons audit + Heme & Endo Exam 1 retrospective, Claude Code)** — `hubs/pcd-implants-exam1`, same ids and key
  positions: report #34 (`cb-pe`: each wrong choice named only one of the two variables, so the key was the only complete answer) now has
  all four atomic-number / photon-energy combinations, each with its why; `cb-atten-z` had the same giveaway and gets the same treatment.
  No notes text changed, so no narration rebuilt; `question_choices` rows before today for both ids refer to the old choices.
  `tools/publish-recap.js`: the exam date it reads from `index.html` skipped exams after an `extraQs` list (Occlusion's final would have
  been recapped as of the midterm) and took a reopened hub's `archiveOn` date as an exam (Heme & Endo as of 11-03); both fixed. The Heme &
  Endo recap published 10-30 is unchanged (Sam reopened the hub for a late exam). `LESSONS.md`: Heme & Endo Exam 1 retrospective (the best
  check-ins yet: 8 of 10 "About right", none "Exam asked different things"), the last refresh checked (MCQ fixes worked, two-statement
  and true/false ones didn't), new Live signals. **Reports #35/#36 (Sam: remove those and ones like them)**: removed from PCD Implants
  the brand and admin details with no exam signal (no hint, focus list, "on my exam" or example question): `tm-conelog` (CONELOG's taper),
  `tm-rc-grooves` (Straumann RC's grooves, plus its card in the engaging sort), `tm-code-6010` and `tm-code-6058` (CDT codes) and
  `gs-credit` (clinic crown credits); bank 548 -> 543. Kept, because the hint list or the professor flags them: each system's surface,
  alloy and torques, conical vs non-conical, and `pf-systems` (Dr. Chavali's own example question). **Heme & Endo** (Sam reopened it for a
  late exam): it still archives tonight at 10 pm (`archiveOn`), but its card stays on the dashboard with the Check in button until
  **Fri 11-06 10 pm** (new `hideCardOn:{date,hour}` and per-exam `checkinUntil:{date,hour}` in `index.html`). No schema change.
- **2026-11-03 (perio S7 and S8 taught, true/false and numbered items, six diagrams, Claude Code)** — Sam: update perio with
  the new files in Drive (Periodontology/hubs, added Nov 2): `perio oct 29.txt` (the Oct 29 class capture of S7) and
  `D2 Implants in periodontally compromised patients 2026 updated.pdf` (**S7 is Dr. Kaur's**, not Dr. Carr's), plus Dr. Litz's
  `Antibiotics in Periodontics recording_Dr. Litz_03252024.mp3` (a 2024 recording he gives every year; `litz antibiotics.txt` is its
  transcript) and `Antibiotics and Host Modulation in Periodontics_Dr. Litz.pdf`. Both sessions go from `upcoming` to `taught`
  (S8 carries a `note`: host modulation comes from the slides until its class part is posted). Both reading levels rewritten for
  both, and all four mp3s regenerated. **Engine**: perio gets Occlusion's `two()`, `tf()` and `nums()` (plus `mq()`/`mm()`,
  which build an item from [choice, why] pairs); `choiceOrder()` keeps tf/numbered in order, `arcadeQ` skips them, and the bank's
  type filter gains "True or false" and "Numbered statements". **Questions**: 68 S7 (`q7-L*`, `-M*`, `-E01`, `-P01..04` on the
  #31 case and others, 5 two-statement `q7-S*`, 8 true/false `q7-T*`, 4 numbered `q7-N*`) and 73 S8 (`q8-L*`, `-M*`, `-E*`,
  `-P01..04`, `q8-S*`, `q8-T*`, `q8-N*`), each choice with its why; bank 509 -> 650. **Fix**: the hub said ciprofloxacin is
  absorbed better with food; the slides and recording say most rapidly 1 hour before or 2 hours after meals (`q8-04` reworded,
  same id and key position; its `question_choices` rows before today mean the old wording; the antibiotics table and cram line
  corrected). 25 exam hints quoted from the capture and the recording; `LIKELY_TOPICS` re-ranked for S7 (10) and S8 (10) from
  those hints (Dr. Kaur's own end-of-class list: smoking, mucositis vs peri-implantitis, bone loss as the difference,
  physiologic vs pathologic bone loss, risk assessment at every stage); Review (diagnoses, Meffert, risk factors, BOP and
  radiographs; prescribing, the full antibiotics table with doses, local delivery, host modulation); cram, mind maps, 5 arcade
  words. **Diagrams** (Sam approved all six): new `tools/figures/perio/` (copied from heme-endo's build: `build.mjs` fills the
  hub's `anima:js`/`anima:css` markers, `--check`, `--preview`): peri-implant states, Meffert, BOP over 4 visits, the radiograph
  schedule (S7), why a biofilm beats antibiotics, where each antibiotic acts (S8); under the notes (`FIG_BY_LEC`/`figsHTML`,
  outside `.reading-prose`, `data-sh-noread`) and in Review. About page. No schema change.
- **2026-11-03 (Occlusion L7: Malocclusion and Dysfunction, Claude Code)** — From the Drive Occlusion/Final folder (Occ Lec6 malocc slides + handout, `Occ oct29.txt`, the 10/29 lecture capture). New lecture `malocclusion` (L7, `exam:'final'`, tag `rose`, taught): notes at both levels and both mp3s (`audio/malocclusion-full.mp3`, `-plain.mp3`): the functional disturbance model, TMD (Bell's classification; muscles ~50%, joints ~35%; not orofacial pain), the five etiologies, orthopedic vs occlusal stability and its risk factors, interferences and the high crown, occlusal therapy (reversible vs irreversible, splints, the rule of thirds), trauma, mobility, wear and erosion patterns, NCCLs, stress, deep pain and bruxism. 145 questions (`mo-*`, `cs-mo-*` on 4 new Patient Box cases `mohigh`/`mobrux`/`moeros`/`momob`; 8 two-statement, 12 true/false (6 True), 6 numbered (keys 2/1/1/2 over the four positions), 5 EXCEPT, 2 select-all, 1 ordering, 1 matching; each with its why; correct answer longest in 33% of L7's MCQs), 17 exam hints quoted from the capture (one de-emphasized: the TMD classification list is the third-year course), 12 `LIKELY_TOPICS`, a Review tab, cram lines, 2 sort sets and a process. Where slides and recording differ (whether erosion facets match; how long a splint stops bruxism) the notes give both and no question turns on it. `MOCK_BLUEPRINT` = `{ instruments:20, malocclusion:20 }`; `EXAM_INFO`, `COURSE_DATES`, the hints banner, the mock intro and the dashboard card updated. Bank 526 -> 671. Diagram review: Sam approved all five candidates (the tolerance model, orthopedic vs occlusal stability, splint designs, the rule of thirds, an erosion pattern map); they ship in a follow-up PR. No schema change.
- **2026-11-03 (new hub: PCD Implants Exam 1, with 11 interactive diagrams, Claude Code)** — `hubs/pcd-implants-exam1/` for
  PCD Implants Exam 1 (Fri Nov 6, Canvas 7:00 am-8:00 pm, 40 questions in one hour: 3 multiple-answer, 3 matching, the rest
  MCQ). Nine lectures, all `status:'taught'`: L1 Evolution of Dental Implants (Dr. Mueninghoff), L2 Introduction and the
  Implant-Tissue Interface, L3 Biomechanics, L5 Prefabricated Abutments (Dr. Chavali; L2's recording is an earlier year's run),
  L4 Implant Terminology and L9 Guided vs Freehand (Dr. Chen), L6 Imaging for Implant Diagnosis and L7 CBCT 101 (Dr. Givan's
  study guide and handouts), L8 Introduction to Implant Surgery (Dr. Geisinger). Sources (Drive, PCD Implants): the recordings
  (transcribed in-session), slides and handouts, the course's hint list; a prior class's answers to the hint list and a
  diagram-aids doc were used only as a checklist against the lectures. No graded quiz or previous years' exam content used.
  Built on the Special Patient Care engine (Home first, why for every choice, lecture picker, pins, retries, sync, drill) with a new
  palette ("Anodized": titanium blue-gray; Sora / Manrope / Red Hat Mono). 548 questions (src `rec` / `slides` / `hub`): 373 MCQ,
  11 multiple-answer (`mm()`, a new helper: one `[choice, isCorrect, why]` per option), 11 matching, 46 two-statement, 77 true/false
  (38 True), 30 numbered-statement; correct answer longest in 37% of MCQs; 5 picture questions name an old implant type from a
  drawn radiograph (`FIGS` `ty-*`). Notes at two levels with Kokoro narration for all nine, 68 exam hints (the hint list plus
  recording quotes), 53 `LIKELY_TOPICS` (263 questions tagged), cram sheet, Review (each lecture's note tables, a Side by side tab:
  the space numbers that sound alike (Chavali's 5 mm on the casts vs the 7 mm from bone vs Geisinger's 7-8 / 7.5 mm), torque and
  stability numbers, osseointegration definitions, health vs mucositis vs peri-implantitis), a 40-question / 60-minute mock (MCQ
  only, `MOCK_BLUEPRINT` 3/6/5/9/3/4/3/5/2; no official counts per lecture). **11 anima figures** (Sam: "Yes to all animations and
  figures"; `tools/figures/pcd-implants-exam1/`, one generic live controller `amLive` in `shared.mjs`, `build.mjs --check`,
  `--preview`): tooth vs implant attachment, one- vs two-stage, Misch D1-D4, cantilever (25 lb -> 75/50 lb), ideal position
  (papilla and black triangle under 3 mm), connections / platform switching / microgap, the stability dip, the E/B/C zones,
  screw vs cement (the 5 mm rule), CBCT beam and detector, freehand vs pilot vs fully guided vs dynamic; placed in the notes
  (`FIG_PLACE`, both levels) and Review (`figs` sections). Arcade: the **Osseo Arcade** (`IMPL_SKIN`, `[data-sg-skin="impl"]`, drawn
  implant lab: CBCT unit, light box, planning computer, order form, kit drawer; the scan template's gutta-percha markers show the
  last digit): Osseo Sort, Platform Showdown (Torque Check, Final Torque), Implant Lab Escape, Mind the Microgap, The Golden Fixture,
  Cross-Slice. Dashboard `HUBS` (`checkinHour:20, promptHour:20`: the window closes at 8 pm), new class `implants` on the `pros`
  ring, `ARCADES`, `HUB_LABEL`/`HUB_RING`; `review/` and `tools/publish-recap.js` labels; `widget/ranks.js` name and medal (an
  implant emblem); `sw.js` -> `sh-v48`; About page (Home, pick/pins lists, Diagrams, arcade table). `LESSONS.md` refreshed first
  (steps 1-3). The build sources stay in the session (the hub is a single file: edit it directly, but edit the figures in
  `tools/figures/pcd-implants-exam1/` and rerun its `build.mjs`). No schema change.
