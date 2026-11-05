# Deploy Notes — the change log

This repo is edited from several different Claude Projects (one per hub, plus a
"hub index" / overarching project for cross-hub UI and shared functionality),
from Claude Code sessions and from other agents (Codex and others).
They don't share context with each other — a session in one Project has no idea
what a session in another Project just changed. **This file is the one place every
session can check for what shipped.** Add an entry whenever you make a non-trivial
change, and read the recent entries before you deploy.

## Start at AGENTS.md: the rules are notes in vault/ (2026-11-03)

Since 2026-11-03 the repo is a vault ([vault/rules/repo-is-the-vault.md](vault/rules/repo-is-the-vault.md)): start at
[`AGENTS.md`](AGENTS.md), then [vault/home.md](vault/home.md). The rules that used to open this file, and the sections of
`CLAUDE.md`, are notes now, one per rule, with the same titles. **Hub Projects and Cowork sessions: fetch and read them
the way you read this file; they are the rules.** Where they went:

| Was | Now |
|---|---|
| The core rule: GitHub is the source of truth | [vault/rules/github-is-the-source-of-truth.md](vault/rules/github-is-the-source-of-truth.md) |
| The About page lists everything | [vault/rules/about-page.md](vault/rules/about-page.md) |
| Shared infrastructure | [vault/reference/shared-infrastructure.md](vault/reference/shared-infrastructure.md) |
| Perio: the single file is the source | [vault/hubs/perio.md](vault/hubs/perio.md) |
| Archiving a hub = retrospective | [vault/rules/archiving-is-a-retrospective.md](vault/rules/archiving-is-a-retrospective.md) |
| Building a hub = diagram review | [vault/rules/diagram-review.md](vault/rules/diagram-review.md) |
| Ship it now; Home page; two-statement and true/false; numbered statements; High Likelihood; the Question Bank panel | their notes in `vault/rules/` (listed in [vault/home.md](vault/home.md)) |
| `CLAUDE.md` → "<section>" (in older entries below) | the note with that title in `vault/rules/`, `vault/how-to/` or `vault/reference/` |

Hub-specific knowledge (sources, build steps, quirks, what's pending) is in `vault/hubs/<hub-id>.md`; Sam's calls are in
[vault/decisions.md](vault/decisions.md); open work is in `vault/tasks/`. This file keeps the change log below.


## Recent major changes (newest first — add a line when you ship something)

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
  newest check-in (they sorted by hub name, BUG-015), rows and survey answers newest first with an id tie-break.
  `migration_v50.sql` (numbered v49 until #237 took that number; tier 3, **applied 2026-11-05** after Sam's written
  approval, "Merge when ready"; the live permission audit found nothing after it): `hub_archive_overrides`, `hub_archive_log`, `get_hub_overrides`, `admin_hub_overrides`,
  `admin_set_hub_archive`, `admin_hub_archive_log`, `admin_live_presence`, and `get_exam_debriefs` / `get_survey_results`
  in order; `supabase/schema.sql` now also records the `activity_hourly` version of `get_exam_debriefs` applied on 10-30
  (PR #205, never merged). `sw.js` sh-v54. No About page entry (Sam: admin information stays off it). Preview fixtures
  for every admin view. Tests: `tools/release/admin-ops.js` and `tools/ci/archive.js` (in CI), `tools/release/admin-ui.js`
  (`run.js`, as `adminui`). How it works: [vault/reference/admin-operations.md](vault/reference/admin-operations.md).

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

- **2026-10-30 (pins sync across devices; the bank remembers its filters, Claude Code)** — Sam: pins should follow you, and hubs
  should open the bank with the filter you used last. `migration_v46.sql`: `question_pins` (visitor, hub, qid, pinned, t = the
  device's change time in ms; an unpin is kept so it beats an older pin), public `set_pins(p_visitor, p_hub, p_pins)` and
  `get_my_pins(p_visitor, p_hub)`, and `redeem_link_code` moves a device's pins (newer change wins). `widget/v3.js`: each Pin tap
  saves at once; `shPins.sync()` runs with the answer sync (hub load, and back after 3+ minutes), merges per question by time,
  uploads anything newer and fires `sh:pins {synced:true}` so an open Pinned view redraws. Change times in `sh_pins_t_<hub>`.
  Perio's bank now saves its sessions, type and status (`STATE.ui.qbank`) like Occlusion and Special Patient Care already did
  (the search box still starts empty). About page. **Perio Project: carry `STATE.ui.qbank` into the split sources.**

- **2026-10-30 (High Likelihood Exam Questions in every live hub, Claude Code)** — Sam: carry Heme & Endo's feature to all current and
  future hubs (now a standing rule in `CLAUDE.md`). `LIKELY_TOPICS` + `EXAM_COUNTS` (empty: no hub has announced counts per lecture),
  `likelyChip()`, `likelyHTML()` (top of Exam Hints, "Practice these" opens the bank on that lecture with status "High likelihood only"),
  a **Likely first** button in the bank's order toggle and a **High likelihood only** status. Topics, each with its evidence: **Occlusion**
  11 for L6 (the final's only lecture so far; Dr. Givan's hints from the recording, 52 questions); **Special Patient Care** 50 over the 8
  units (Dr. Mitchell's hints first, then module / reading / lecture; 174 questions); **Perio** 52 over S1-S9 (recording hints, the midterm
  check-ins, the exam-review guide and the slides; 212 questions; S7-S9 from the guide until they are lectured). No graded quiz content
  used. Tracked as `bank:order=likely`, `hints:likely-practice`. About page. No schema change.
  **Perio Project: carry `LIKELY_TOPICS` and its code into the split sources. Re-rank a hub's topics when hints, reviews or counts arrive.**

- **2026-10-30 (Question Bank: pick your lectures, in order or random, pinned questions, Claude Code)** — Sam's request, for
  Occlusion, Perio and Special Patient Care and every future hub (not Heme & Endo Exam 1: its exam has passed). The lecture
  dropdown is now a tick-box list (`lecPickHTML()`/`wireLecPick()`, all ticked by default, Select all / Clear; Occlusion adds For the
  final / Midterm lectures; `STATE.ui.qlec` takes an array; Perio keeps `QBANK_FILTER.lec` in memory as before). Shuffle became an
  **In order / Random** toggle (`STATE.ui.qorder`; In order = by lecture then bank order, patient sets kept together). **Pins**:
  `widget/v3.js` adds a Pin button beside Report on every card in hubs that set `window.SH_PINS = true` (`window.shPins`,
  `sh_pins_<hub>`, `sh:pins`, tracked `pin:add`/`pin:remove`, `bank:order=`); the bank has a Pinned (n) button and a "Pinned" status.
  Occlusion's default lecture pick is now all lectures, and everyone starts once with all ticked (`STATE.ui.qpickOn`). New standing
  rule in `CLAUDE.md`. About page, `sw.js` -> `sh-v47`. Pins are per device (no sync yet). No schema change.
  **Perio Project: carry the picker, order toggle and `SH_PINS` into the split sources.**

- **2026-10-30 (Heme & Endo Exam 1 check-in live, Claude Code)** — Sam: open the check-in now. The exam ended at 9:30 am, so its
  `HUBS` entry sets `checkinHour:9, promptHour:9`: the card's "Check in" button and the dashboard pop-up both go out on exam day
  instead of the button at 10 am and the pop-up at 10 pm. No schema change.

- **2026-10-30 (database timeouts on exam day: XP and activity summaries, Claude Code)** — On Heme & Endo exam morning the
  dashboard's handpiece rank board stopped loading and the admin page's Time by section kept failing, even after #200's index.
  Cause: `sh_visitor_xp(null)` recomputed everyone's XP from all of `personal_answers` (~0.9 s, a window sort spilling to disk),
  and `get_rank_profile` (every hub and dashboard load: 15k calls), `get_trophy_stats`, `get_rank_board`, `get_leaderboard` and
  `get_correct_streak_stats` all call it, so the database was saturated and every RPC near the 3 s anon limit failed.
  `migration_v44.sql` (**applied via the connector**): a trigger on `personal_answers` keeps `xp_seen` (first try per
  visitor/hub/qid/correct, which decides 10 vs 2 XP) and `xp_days` (per visitor and Central-time day: answers, right, raw XP)
  in step; updates/deletes (Link my devices) rebuild the affected visitors. `sh_visitor_xp` keeps its signature and rules and
  reads `xp_days` (3 ms; all 151 visitors' XP, days, answers and right answers checked identical to the old formula);
  `get_rank_profile` 1.1 s -> 8 ms. `get_rank_board` and `get_leaderboard` now name only the rows they return (leaderboard reads
  days and totals from `xp_days`; same output). `migration_v45.sql` (**applied**): the admin page sends 16 RPCs at once and the
  three time queries each counted ~190k raw pings (~1.1 s), so a trigger on `activity_pings` keeps `activity_hourly` (pings per
  hour, hub, section, visitor; null section stored as '') and `activity_visits` (first/last ping per visit);
  `get_visitor_by_hub`, `get_visitor_by_section` and `get_visitor_summary` read those (6-19 ms; 30-day sections and ping counts
  checked identical) and now use `sh_admin_ok()`. The range now starts on a whole hour. Still slow: `anon_name()` (~65 ms per
  call; it computes every streak holder's base name), which keeps the boards at ~0.5 s. **Anything new that totals answers or
  pings per visitor: read `xp_days` / `activity_hourly` / `activity_visits`, not the raw tables.** No site change.

- **2026-10-29 afternoon (lessons audit, Heme & Endo exam eve, Claude Code)** — `hubs/heme-endo-exam1`, same ids and answer
  positions, explanations only plus one stem: `td-num-2`, `ca-2s-4`, `ad-11bhsd`, `td-inducers` and `ca-r-vdr` now answer their
  favorite wrong choice; `cs-triam`'s stem asks "Which corticosteroid is the popular intermediate-acting one?" instead of what
  Dr. Fasinu named (same choices and key). No notes text changed, so no narration or Timmy Time rebuild. `LESSONS.md` refreshed
  (this morning's cue on `pa-insulin-fat`: 43% -> 11 of 17). No schema change.

- **2026-10-29 (Heme & Endo Exam 1: professors' focus lists for L3 and L4, Claude Code)** — Sam passed on the professors' hints the
  night before Exam 1. L3 (Growth): regulation of GH secretion, GH and IGF-1, major metabolic effects of GH, effects of GH excess or
  deficiency, changes in GH with aging. L4 (Thyroid): synthesis, storage and release, T4 to T3 conversion, regulation of the
  thyroid axis, major metabolic and cardiovascular effects, hyper- vs hypothyroidism including Graves; both: understand the major
  relationships and physiologic effects. The notes already covered every item, so **no notes text changed and no narration or
  Timmy Time rebuild**. `hubs/heme-endo-exam1`: 21 new questions (`gr-f-*` 9, `th-f-*` 12, new src `focus`, "Professor's focus list"),
  written as relationship questions (block somatostatin, give IGF-1; where hormone
  is stored and how it is released, where T3 comes from, why the heart races) with a why for every choice; per lecture
  2 two-statement, 2-3 true/false, 2-3 numbered. Bank 610 -> 631. Only what the slides and the recordings say: nothing beyond them was added (Sam). `LIKELY_TOPICS` for L3 and L4 rewritten around the focus lists (L3's 6
  = the five hints with feedback split out; L4's 4 Patient Box topics kept, so its other 4 = synthesis/storage/release, T4 to T3, the
  axis, metabolic and CV effects), a new hint entry at the top of each lecture in Exam Hints, an exam-card line, cram lines. No schema change.

- **2026-10-29 early morning (lessons audit, Heme & Endo exam eve, Claude Code)** — `hubs/heme-endo-exam1`, same ids and answer
  positions, explanations and memory cues only: "Remember it" cues on `pa-insulin-fat` (lipoprotein lipase still picked 7 of 19
  after yesterday's explanation fix), `gr-ghrelin` and `h1-enzyme-linked`; `pa-num-1`, `pa-tf-3` and `ad-angII-gq` now answer their
  favorite wrong choice. No notes text changed, so no narration regenerated. `LESSONS.md` refreshed (the docked Plaque Boss is hidden
  by 4 of 55 people, against 10 of 30 when it floated). No schema change.

- **2026-10-29 (arcade crossword layout fix, Claude Code, #194)** — A student said the crossword was unplayable ("the window is
  compressed where you can't see anything"). Its three tool buttons set the grid column's width, so the grid's columns stretched and
  the clue list was crushed to about 130 px (or cut off) at tablet and small-laptop widths. `widget/games.css`: fixed-size cells
  (`--cx`, up to 34 px, scaled to the screen; the grid gets `--cols` from `games.js`), the clue panel (`.cx-right`) wraps under the
  grid below 280 px, Across/Down stack when narrow, and the buttons fit inside the grid's width. All four live hubs (shared file).
  `sw.js` -> `sh-v46`. No schema change.

- **2026-10-28 night (Timmy Time: Heme & Endo Exam 1 episode, and a /podcast skill, Claude Code)** — A 53-minute last-minute
  review for Exam 1 (Fri Oct 30, 8:00 am), hosted by Timmy Tooth: `hubs/heme-endo-exam1/audio/timmy-time.mp3` (38 MB,
  -16 LUFS), script `tools/podcast/heme-endo-exam1/script.md`, written from the hub's notes (As taught), exam hints, cram
  sheet, `LIKELY_TOPICS` and the 10/28 review items, gland by gland (signals and feedback, pituitary, growth, thyroid in two
  parts, thyroid drugs, pancreas, adrenal, corticosteroids, calcium), with time weighted by the official counts and a
  34-question lightning round. No quiz content (Quizzes 1-2 are open until 10/29). Lore (Sam picked all four): his four
  Halloween costumes, one per page load (as `widget/pet.js` does); a neighbor, number thirty-one, the hypochondriac second
  molar; TIMMY as a fight-or-flight surge with no adrenal medulla; enamel isn't a calcium bank. `lexicon.json` gains 105
  endocrine words (hormones, drugs, eponyms, `GLUT`, `JAK`, `D-H-E-A`, `zona`). Every segment was transcribed back with
  faster-whisper and diffed against the script (it caught "It isn't" heard as "it is an" and a run-together
  "beta-endorphin"). Hub: `window.SH_PODCAST` (id `exam1-review`), the episode card on **Home** under the quick-start row,
  a Timmy Time link in Home's "Also here", `#timmy` opens Home; dashboard card gets `podcast` and "Timmy Time" in modes;
  About page updated. **New for every episode:** `tools/podcast/LORE.md` (the canon: read it, add to it),
  `tools/podcast/extract_hub.js` (a hub's notes, hints, cram and exam facts as text; works on every live hub, perio
  included), `render_podcast.py --words` (hard words and heteronyms in context), and the **`/podcast` skill**
  (`.claude/skills/podcast/SKILL.md`): ask Sam the length and lore, write, fix pronunciations, render, wire in, verify, PR.
  **When the notes change, fix the script and rebuild the episode in the same PR.** No schema change.

- **2026-10-28 evening (device-link prompt streamlined, Claude Code)** — The "Is this your other device?" prompt linked nobody in its
  first week (2 "Yes", 0 links). `widget/linkask.js`: "Yes, link them" now makes the code at once (no make-or-enter choice) and offers
  **Send the link** (share sheet) / **Copy the link**: `<site>/?link=CODE` opens a "Link this device?" card on the other device and
  links in one tap (the `link` param is removed from the address first). Typing a code links at the sixth character; the Link button
  stays. Tracked as `link-ask:share`, `link-ask:url-open`, plus the existing `code` / `linked` / `fail`. About page, `sw.js` -> `sh-v45`.
  Report #32 resolved with its reply. No schema change.

- **2026-10-28 afternoon (lessons audit + Timmy and device-link tracking, Claude Code)** — Two days before Heme/Endo Exam 1.
  `hubs/heme-endo-exam1`, same ids and answer positions, explanations only: report #32 (`th-r-nis`: "an ATP dependent
  symporter... wouldn't it directly use ATP?"): `th-nis` no longer calls NIS "ATP-dependent active transport", and both say NIS
  doesn't split ATP, the Na+/K+-ATPase keeps the sodium gradient (the notes' "ultimately ATP-dependent" stays; narration unchanged);
  `th-r-2s-1`, `pa-insulin-fat`, `gr-ghrelin`, `pa-liver-glut` and `h1-enzyme-linked` now answer their favorite wrong choice.
  **Tracking** (no schema change, `feature_events`): `widget/pet.js` `pet:tap-hub|dashboard`, `pet:joke|checkup|tip` and a daily
  `state:pet-hp=<band>`; `widget/ranks.js` (Stats → Link my devices) `link:code|linked|fail`; `widget/linkask.js` `link-ask:fail`;
  `widget/clicks.js` exposes `shClicks.flush()`, called after `linked` in both flows (the event was lost to the reload, so the
  prompt's outcome was invisible). `sw.js` -> `sh-v44`. `LESSONS.md` refreshed (names, device links and Timmy Tooth numbers).
  **A feature that reloads or leaves the page: call `shClicks.flush()` after its last `shTrack`.**
- **2026-10-28 (patient pictures and arcade art in Heme & Endo, Special Patient Care arcade art, Claude Code)** — More of Sam's Argon art.
  **Heme & Endo patient pictures**: `CASE_IMG` + `caseImgHTML(q)` (the stub is now real, Occlusion's pattern with `<img>`): a
  question's `pimg:[keys]` draws painted illustrations inside its Patient Box, labeled as illustrations, not patient images.
  Three so far (`img/case-*.webp`): `ad-addison-gums` (pigmented attached gingiva), `gr-acro-dental` (face and hands),
  `cs-asthma-bone` (moon face, central obesity, thin bruised forearm skin). Each shows only findings its box already lists; the
  arcade already skips `pimg` questions. **Special Patient Care arcade**: Sparks After Hours now draws a painted operatory
  (`img/after-hours-escape.webp`, 1280x714 drawn to 800x450) with every hotspot measured onto its props (`SPC_SKIN.escape.scene`:
  panoramic viewer dark until solved, charting computer, consent form clipboard, padlocked supply drawer, visual-schedule poster
  the curing light reveals, sink and mirror, door + keypad; the clock hand rides the painted clock); the hero banner, the Sparks
  Superstar stage (`smile.bg`) and the escape/Superstar lobby tiles (`thumbImg`) are painted too; the other four tiles keep their
  icon tiles. **Perio**: Mind the Pocket's lobby tile is painted (`img/thumb-gap.webp`), so every Perio tile is now art.
  **Heme & Endo arcade**: Endo Lab Escape draws a painted lab (`img/lab-escape.webp`, hotspots measured onto the microscope with
  its lamp off until solved, the analyzer, the lab report clipboard, the padlocked reagent cabinet, the starch paper on the
  corkboard, the eyewash sink and mirror, the door keypad; the clock hand rides the painted clock), replacing the drawn room; the
  hero banner, the Golden Gland stage (`smile.bg`) and the escape/Golden Gland lobby tiles are painted. About page,
  `sw.js` -> `sh-v43`. No schema change.

- **2026-10-28 (Heme & Endo Exam 1: in-class review, official counts, High Likelihood tags, Claude Code)** — From the 10/28 review
  PollEv doc (Drive: Heme/Endo Exam 1, "Endocrine Exam 1 PollEv"; its comments are classmates' notes on what the professors said):
  20 items `rv-*`, new src `review` ("In-class review", Daily drill high-yield), stems and keys as given, typos fixed, explanations
  from the class notes. `rv-sst`'s last choice now reads "stimulated by ... amino acids and fatty acids" (the doc's "inhibited by ...
  ketoacids" would have made a second choice untrue). Sam gave the exam's count per lecture (6/6/6/8/6/5/3/5/4/6) and said the
  four Patient Box questions are all on L4: `EXAM_COUNTS` = `MOCK_BLUEPRINT`, `MOCK_PBOX = { thyroid:4 }` (the mock takes Patient Box
  items only there), `EXAM_INFO` line; 8 new L4 Patient Box cases (`th-pb-*`, two shared-patient pairs). Bank 582 -> 610.
  **High Likelihood Exam Question** tag: `LIKELY_TOPICS` (as many topics per lecture as exam questions, ranked by review + hints,
  each with 2-4 question ids, 171 tagged) sets `q.likely`; `likelyChip()` in the bank and drill (not the mock); bank sort menu
  (`STATE.ui.qsort`: bank order / High likelihood first / High likelihood only); Exam Hints opens with a folded "Most likely
  questions" list (`likelyHTML()`). About page. No notes text changed, so no narration regenerated. No schema change.

- **2026-10-28 (arcade art, round 2: Showdown stages and painted lobby pictures, Claude Code)** — More of Sam's Argon art.
  **Showdown stage**: a skin's `board.bg` paints a stage behind the quiz board (`.sg-stage` in `widget/games.css`, dimmed so the
  tiles stay readable): Occlusion's Freeway Showdown stage, Perio's Pocket Showdown stage (`img/showdown-stage.webp`).
  **Lobby pictures** are now painted (`thumbImg(f)` in each hub, files in `img/`): Occlusion Cusp Sort, Freeway Showdown,
  Mind the Gap and Cross-Section; Perio Pocket Showdown, Cross-Section and Calculus Crusher (each Showdown picture is
  cropped from its stage). Perio's Mind the Pocket keeps its drawn picture until it has art. The pictures now fill Perio's
  wider frames (`preserveAspectRatio` slice; they sat between side bars). `sw.js` -> `sh-v42`. No schema change.

- **2026-10-28 (Special Patient Care check-in and archiving wait for the exam to close, Claude Code)** — Sam: no check-in until the exam
  closes. The exam is due Fri Nov 13 at 11:59 pm, so its `HUBS` entry sets `checkinHour:24, promptHour:24` (`setHours(24)` = midnight
  starting Sat Nov 14): no "Check in" button at 8 am and no pop-up at 10 pm on the due date. The card also stays live until then:
  new optional per-exam `archiveHour` (dashboard `archiveAt()`, and `widget/v3.js`'s "This hub is archived" notice, read from the
  hub's `SH_EXPORT.exams`), 24 for this exam in both places, so the Open button doesn't disappear at 10 pm while the exam is still
  open. `sw.js` -> `sh-v41`. No schema change.

- **2026-10-28 (new hub: Special Patient Care, Claude Code)** — `hubs/special-patient-care/` for Dr. Mitchell's Special Patient
  Care exam (Canvas, opens Fri Nov 6 12:00 am, due Fri Nov 13 11:59 pm; format not announced, so the bank is multiple choice,
  true/false and matching, plus the two-statement and numbered-statement items the standing rules require). Sources (Drive:
  Special Patient Care/hubs): the recorded lectures and handouts for the introduction, behavior guidance, Down syndrome, cerebral
  palsy, syndromes and prevention; the autism module's pages (what is autism, characteristics, stimming, meltdowns, sensory
  defensiveness, dental conditions, appointment prep, operatory, communication, the successful appointment, advanced treatment);
  and the mental illness reading (SAID Module 9) with Dr. Mitchell's video introduction. No graded quiz or exam content used.
  Eight units (`intro`, `behavior`, `down`, `cp`, `syndromes`, `autism`, `prevention`, `mental`), all `status:'taught'`. Built on
  the Heme & Endo Exam 1 engine (Home first, why for every choice, retries, sync, drill) with a new palette ("Sparks": clinic teal
  and coral; DM Serif Text / Source Sans 3 / JetBrains Mono). **No figures or animations** (Sam): `FIGS`/`ANIMA` are empty stubs,
  no diagram review, and the arcade has no drawn art (lobby tiles are an icon and a word; the escape room uses the shared operatory
  with this hub's labels and story). 452 questions (src `rec` / `module` / `reading`), each MCQ with a why for every choice written
  inline (`mq(id, lec, src, stem, [[choice, why], ...], ex)`, so `QUESTION_WHY` is empty); per unit 5 two-statement, 8
  true/false, 3 numbered-statement and 1-2 matching; correct answer longest in 34%; true/false 53% True; numbered keys 6/7/5/6.
  Notes at two levels with Kokoro narration for all eight, 41 exam hints quoted from the recordings (plus the autism module's and
  the reading's own notes), cram sheet, Review (each unit's note tables plus written ones, and a Side by side tab: Down syndrome vs
  CP vs autism, look-alike pairs), a 50-question / 75-minute mock (`MOCK_BLUEPRINT`; no official counts), and the Sparks Arcade
  (`SPC_SKIN`, `[data-sg-skin="spc"]`: Chairside Sort, Chart Showdown, Sparks After Hours, Say It Once, Sparks Superstar,
  Cross-Check). Home counts down to the window opening, then to the due time (`EXAM_DATE`/`EXAM_END`); `SH_EXPORT.exams` and the
  dashboard's `HUBS` use the due date, so the card archives itself at 10 pm on Nov 13. Dashboard `HUBS`/`CLASSES` (`spc`, on the
  free `genetics` ring), `ARCADES`, `HUB_LABEL`/`HUB_RING`; `review/` and `tools/publish-recap.js` labels; `widget/ranks.js` name and
  medal ribbons (the shared tooth emblem); `sw.js` -> `sh-v40`; About page (Home, arcade table). The build sources and script stay
  in the session (the hub is a single file: edit it directly from here on). No schema change.

- **2026-10-28 (admin Surveys tab: exam check-ins load the first time, Claude Code)** — Sam: the Surveys tab often said
  "Couldn't load exam check-ins (migration_v23)" and worked after a refresh. `get_exam_debriefs` hit the API's 3 s anon
  timeout on a cold load (~2.5 s warm): three subqueries per check-in, and `activity_pings` had no `(visitor_id, hub)` index.
  `migration_v42.sql` (**applied via the connector**) adds `activity_pings_visitor_hub_idx` and counts each (hub, person)
  pair once: ~100 ms, same rows and numbers (checked against the old query). `supabase/schema.sql` updated. No site change.

- **2026-10-28 (tablet-width top bar, Claude Code)** — Sam spotted the Heme & Endo top bar cut off on a tablet. Between about
  561 and 1000 px every hub's one-row top bar overflowed (Heme & Endo, Occlusion, Perio and the archived three): the Arcade (and
  sometimes Review) tab was cut off, the theme button sat off screen and the page scrolled sideways. One rule in `widget/v3.css`
  (`@media (min-width:561px) and (max-width:1000px)`, scoped to `header.hub-header`) wraps the mode tabs onto their own
  full-width row under the title, as phones already do (all labels shown). Checked at 561-1001 px in all six hubs: nothing past
  the edge, no sideways scroll; at 1001 px and up the one-row bar is unchanged. `sw.js` -> `sh-v38`. No hub file changed.

- **2026-10-28 (numbered-statement rule, Occlusion items, the boss moves to the top bar, Claude Code)** — Sam: add the "which
  statements are true" questions to Occlusion and keep it as a rule; move the bosses widget, which blocked questions. **Rule**
  (above, `CLAUDE.md` → "Numbered-statement questions"): `tools/ci/smoke.js` adds `numbered: 2` to `FORMAT_MIN` and checks each
  numbered item's stem lines, choice wording and canonical order. **Occlusion**: new helper `nums()` (with `numList()`,
  `numLabel()`) builds the stem, sorted combinations, key and "why each choice" lines from one reason per statement;
  `choiceOrder()` keeps them in order, `arcadeQ` skips them, the bank's format filter gains "Numbered statements". 16 items
  written from the notes (`rv-num-1..3`, `an-num-1..2`, `fn-num-1..2`, `cc-num-1..2`, `ap-num-1..2`, `in-num-1..5`; keys
  spread 3/5/4/4 over the four positions); bank 510 -> 526. **Heme & Endo**: `th-num-2`, `h2-num-2`, `ca-num-2` (the three lectures that had one);
  bank 579 -> 582. **Plaque boss** (`widget/eggs.js` `bossDock()`, `widget/v3.css` `.sh-egg-boss.is-docked`): it now docks as a
  solid band along the bottom edge of the hub's sticky `header.hub-header` (`fitDock()` bleeds it to the bar's edges and flush
  with its bottom border, from the header's own padding, so nothing scrolls through behind it; icon, name, HP bar, HP, the line it
  says on desktop, ×; hit numbers stay inside the band) instead of a card floating over the bottom of the screen, where it covered answer choices (53 of 89 Occlusion students who met
  one hid it). A page without a sticky header still floats it. About page, `sw.js` -> `sh-v37`. No schema change.
  **Perio Project: add `nums()` and numbered items before S6 goes taught.**

- **2026-10-27 evening (lessons audit, Claude Code)** — Heme & Endo Exam 1's first day (39 people, 29 h). `hubs/heme-endo-exam1`:
  `h1-mag` ("Dr. Herr said he would NOT expect you to be able to:") removed after two reports on its first afternoon (#30, #31: "not
  an exam-style question"; the notes already say the pars distalis stains aren't tested; bank 580 -> 579); `h1-downreg`'s explanation
  and why line say both routes start in an endosome and the lysosome decides it (sequestration picked 12 of 26); `gr-muscle`'s stem
  no longer quotes the lecture ("Apart from its effects on growth, which pairing of GH effects is correct?", same choices) and its
  explanation says GH opposes insulin. `hubs/perio`: `q4-06` had two right answers (the S204SD9 *is* the posterior sickle, per the
  hub's notes), so "Sickle scaler" is now "H6/7 sickle scaler" (same position; older `question_choices` rows for that slot mean the old
  text); `q3-04`'s explanation says why "likelihood of retaining the tooth" (Miller & McEntire) sounds like McGuire & Nunn's
  maintainability. No notes text changed, so no narration regenerated. `LESSONS.md` refreshed (new lessons: misses re-asked a day
  later; questions about what the professor said; a choice that contains the key; the Plaque Boss gets hidden, never switched off).
  **Perio Project: carry the `q4-06` and `q3-04` changes into the split sources.**

- **2026-10-27 (every hub opens on a Home page, Claude Code)** — Sam: "build a home page into each hub as a rule going forward".
  New standing rule (above, and `CLAUDE.md`). **Occlusion** gets a Home mode (first tab, default, `home/dashboard`): the final's
  countdown (days; `FINAL_TIME`/`FINAL_CLOSES` are null until the time is announced, then it counts hours and minutes), chips,
  a ring for the final's questions right on the latest try, a "more lectures are coming" note, quick start (practice, drill,
  notes, the 20-question mock), the exam card (moved from Compendium, along with the quick-start row; the Timmy Time card stays
  on Compendium), Where to next (final lectures first, then midterm misses), progress by lecture grouped "On the final" /
  "Midterm lectures", `COURSE_DATES` (L1-L6, the midterm, the final), the last two weeks and links. **Perio**: Compendium's Course
  Home is now the Home mode (same content, plus Where to next and the last two weeks); `course-info` is gone from
  `COMPENDIUM_VIEWS` and old saved views fall back to Lecture Notes. Returning visitors open on Home once (`STATE.ui.homeOn`).
  **Fix**: #173's `finalOn` flag sat in Occlusion's `defaultState()`, which `loadState()` merges into saved state, so the
  switch to the final never ran for returning visitors; it's out of the defaults now (visitors who opened the hub since
  then already saved the flag). Heme & Endo's Home now redraws after a sync. Time on Perio's Course Home was logged as
  `compendium/course-info`; from today it's `home/dashboard`. About page, `sw.js` -> `sh-v36`. No schema change.

- **2026-10-27 (Occlusion L6: four animated diagrams, Claude Code)** — From L6's diagram review (Sam approved all four):
  `mounterr` (the maxillary cast at the facebow position or too far back / high / forward / low; in the mouth the most anterior
  or most posterior teeth hit, the slide's rule), `hingearc` (one model, `hgModel`: the patient's arc about PHA vs the articulator's
  about an AHA 5 mm off; a thicker CR record leaves the molar farther off, shown magnified with no number; "restore at this
  vertical" and "kinematic facebow" zero it), `scirec` (protrusive vs lateral reading vs arbitrary 30°/20°; a crown built at the
  setting discludes or hits when the patient protrudes along their real eminence; the lateral reading is drawn 8° steeper only to
  show "steeper") and `bennett` (the orbiting path bows medially, so a record at 3-5 mm reads a larger angle than at 7-10 mm, and
  the fossa built from the smaller one is too narrow). Built in `tools/figures/occlusion/anima/`; placed with `FIG_PLACE.instruments`
  in `od.js` (FIG_PLACE lives in the generated kit block: edit it there, not in the hub) and a Review `figs` section. About page.

- **2026-10-27 (Heme & Endo Exam 1: L3, L4, L9, L10 from their recordings, Claude Code)** — Sam posted the missing
  recordings to the Drive Heme/Endo folder: `Growth_Hormone.mp3` and `Thyroid_Hormone.mp3` (transcribed in-session with
  faster-whisper small.en) and the 10/27 Zoom VTTs (`GMT20261027-180303` = L9, `-183636` = L10). **L3's recording is Dr.
  Madison giving the lecture** (he signs off for male reproductive physiology; this year's slides are Dr. Galin's) and both
  mp3s look like another year's run (morning times), so L3's notes say so and quote "the recording", not Dr. Galin. All four
  go to `status:'taught'`: both reading levels rewritten (status banners gone; where recording and slides differ the notes
  give both: GH's sleep pulses REM vs deep sleep, NIS 20-50x vs "tens to hundreds", zone shares 15/65-80/10 vs the slides'
  ranges; Dr. Herr calling the somatostatin cell "gamma" is noted, the table keeps delta) and all eight mp3s regenerated.
  `NOTE_TABLES` rebuilt for the four lectures (growth gains a GH-by-tissue table). 72 new questions (`gr-r-*`, `th-r-*`,
  `h2-r-*`, `ca-r-*`, src `rec`: 8 two-statement, 16 true/false, 1 ordering; each MCQ with its `QUESTION_WHY` row); bank
  508 → 580. `h2-dual` and `h2-spongio` now quote Dr. Herr ("the question that's going to be on your exam"; spongiocytes
  "the thing to remember for the exam") and carry src `rec`. 36 exam hints, cram lines, `EXAM_INFO` and `COURSE_DATES` gain
  the Wed 10/28 1:00-1:50 review with Dr. Galin and Dr. Madison. Figures (`tools/figures/heme-endo-exam1`, rebuilt): thyroid
  adds sodium riding in through NIS, the TSH receptor with its NADPH → H2O2 supply, the deiodinases and a **Low iodide**
  case; calcium adds **High phosphate (soda)** and **Menopause** cases, estrogen's brake in the panel, the recording's
  wording on the kidney exception and the osteoblast's PTH receptor; adrenal adds a **Dual blood supply** view, the three
  arterial sources and the T1-L2 preganglionic fiber; the pituitary's GHRH row adds Gs/Gi and somatostatin feedback.
  About page (Diagrams). No schema change.

- **2026-10-27 (arcade art: painted rooms, banners and stages, Claude Code)** — More of Sam's Argon art. **Perio Clinic Escape**
  now draws `hubs/perio/img/clinic-escape.webp` (stretched to the 800x450 scene) with every hotspot measured onto the painted
  props (`PERIO_SKIN.escape.scene`): panoramic viewer (dark "VIEWER OFF" overlay until solved), charting computer, perio chart on
  the clipboard, instrument cassette, typodont (the tablets stain its digit pink), corkboard, door; the clock hand rides the
  painted clock. The drawn `perioTooth` room is gone. **Arcade hero banners** (`img/arcade-hero.webp`, `.ar-hero` background in
  both hubs). **Million-Dollar Smile**: a skin's `smile.bg` paints the marquee with a stage picture (`img/smile-stage.webp`,
  `.ms-banner--art`) instead of the drawn grin; `smile.art()` (Heme & Endo's gland) still works, and `bg` wins if both are set.
  **Lobby thumbnails** for Smile and the escape room are painted too (`img/thumb-smile.webp`, `img/thumb-escape.webp`). A new
  backdrop means re-measuring every `api.spot()` rectangle. `sw.js` -> `sh-v35`. No schema change.

- **2026-10-27 (Occlusion switches to the final: L6 Occlusal Instrumentation, Claude Code)** — Sam: "Occlusion can now
  switch to final exam." The final (Thu Nov 19) is not comprehensive: Dr. Givan's lectures from 10/22 on, building on the
  midterm material; its time and format aren't announced yet (update `EXAM_INFO` and the mock clock when they are). New
  **L6 `instruments`**, "Occlusal Instrumentation: Articulators, Facebows and Records" (`exam:'final'`; L1-L5 now carry
  `exam:'midterm'`), from the Drive Final folder (Occ Lec4 slides + handout, the 10/22 lecture capture): notes at both levels
  and both mp3s (`audio/instruments-full.mp3`, 27.6 min; `-plain`, 9.3 min), 92 questions (`in-*`, `cs-in-*` on 3 new Patient
  Box cases `incrown`/`inrehab`/`inhigh`, 8 two-statement, 10 true/false (6 True), 1 select-all, 1 ordering, 2 EXCEPT; each with
  its why; correct answer longest in 26% of L6's MCQs), 17 exam hints quoted from the recording (two de-emphasized: the slide's
  "Not on test" Handulator, and balanced-denture SCI), a cram list, a Review tab (articulator kinds, the records, where mounting
  errors show, MIP record rules, Dr. Givan's selection table, 3 processes) and 2 sort sets. Bank 418 → 510. **The hub now leans to
  the final**: `isFinalLec()` / `lecOrder()`; notes and hints list the final's lectures first under "Final" / "Midterm" labels;
  the bank's lecture filter gains "For the final" (default) and "Midterm lectures"; the quick-start count, Daily Drill pool and
  mock (`MOCK_BLUEPRINT = { instruments:20 }`, clock at the midterm's 80 s a question) use the final's lectures only; the exam
  card and hints banner describe the final. Returning visitors are moved once (`STATE.ui.finalOn`: L6, bank scope final, the
  closed-card flag and any old mock cleared). Titles: "Occlusion Final Hub" (dashboard card, `<title>`, ribbon); recap label
  "Occlusion". The midterm Timmy Time episode stays (dashboard row now "The midterm review"). **Each new final lecture: add it
  with `exam:'final'` and to `MOCK_BLUEPRINT`, and update `EXAM_INFO`.** Diagram review for L6 still to be put to Sam.

- **2026-10-27 (Heme & Endo Exam 1: six animated diagrams, Claude Code)** — Sam: "Yes to all animations." Built with the
  anima skill in `tools/figures/heme-endo-exam1/` (`build.mjs` fills the hub's `anima:js` / `anima:css` markers; `--check`,
  `--preview`), each from the hub's own notes: **beta** (L5: glucose → GLUT2 → ATP → K-ATP closes → depolarization → Ca2+ →
  insulin, low glucose and sulfonylurea toggles), **thyroid** (L4: the seven synthesis steps in a follicular cell; methimazole/PTU
  and an iodide load show where they block), **hpa** (L2/L6/L7: normal, Addison's, Cushing's disease, adrenal tumor, prednisone
  on / stopped suddenly / tapered; feedback loops, α-MSH on the skin, an HTML lab panel that reads primary vs secondary),
  **calcium** (L10: calcium falls / rises / primary hyperparathyroidism; CaSR on chief cells, PTH on kidney and bone, 1α- vs
  24-hydroxylase, calcitriol in the enterocyte, calcitonin on osteoclasts), **pituitary** (L1/L2: the portal route with a
  releasing-hormone picker lighting its target cell, and the long-axon route with Herring bodies and pituicytes) and **adrenal**
  (L6/L9: zones with their shares, cortex-to-medulla blood flow, a stress response turning on PNMT). In the notes via `FIG_PLACE`
  (each at the end of the section it explains, both levels; `data-sh-noread`, so narration is unchanged) and in Review (a `figs`
  section in each lecture's tab). Levels are qualitative (no lab values); `calcium` reuses the lab-panel CSS `hpa` defines. No
  SVG ids, so copies don't clash. About page (Diagrams). No questions or notes text changed; no schema change.

- **2026-10-27 (new hub: Heme & Endo Exam 1, with its own Home page, Claude Code)** — `hubs/heme-endo-exam1/` for DENT 2160
  Hematology & Endocrinology Exam 1 (Fri Oct 30, 8:00-9:30 am dental, 55 MCQ, in person on Canvas with LockDown Browser,
  lectures 1-10), built on the Occlusion engine (without its figure kit: `FIGS`/`ANIMA` are empty stubs) with a new palette
  ("H&E"; Young Serif / Atkinson Hyperlegible / Spline Sans Mono). Sources (Drive, Heme/Endo Exam 1 folder): every slide deck,
  the 10/20 (L1, L2) and 10/23 (L5-L8) recordings, transcribed in-session. **The 10/21 recordings (L3 Growth, L4 Thyroid) have
  no sound**, so those two and L9/L10 (10/27) are `status:'slides'` ("Slides only"): when their recordings arrive, flip to
  `taught`, add exam hints, rewrite the notes and regenerate both mp3s. **Not used, by the syllabus rule:** last year's D3
  "Endocrinology Exam 1" study doc and D3 Anki deck (they reproduce last year's graded quizzes and crossword), this year's
  Quizzes 1-2 (open until Oct 29), and the password-protected Quizlet folder (quizlet.com blocks this container). 508 questions
  (src `slides` / `rec` / `class` = the professors' own in-class cases, rewritten / `hub`), each with its why; 49 two-statement,
  80 true/false (46 True) and 17 **numbered-statement** items (`fmt:'numbered'`, "Which statements are true? 1-4", combinations
  in a fixed canonical order via `choiceOrder`, keys spread over all four positions; Question Bank format filter), Patient Box
  cases (Dr. Fasinu's lab-value style), EXCEPT items; correct answer longest in 19%. Notes at two levels with Kokoro narration
  for all 10, 36 exam hints quoted from the recordings, cram sheet, Review (each lecture's own note tables via `NOTE_TABLES`
  plus written tables, a Side by side tab: reading labs, which receptor, look-alikes), a 55-question / 90-minute mock.
  **Home mode** (Sam: "its own dashboard/homepage"): a fourth mode, the default, `renderHome()`: live countdown, exam facts,
  the quiz-deadline alert (until `QUIZ_DUE`), a readiness ring (right on latest try), quick start, the exam card, Where to next
  (weakest lecture, misses, unstarted lecture), progress by lecture, course timeline (`COURSE_DATES`), last 14 days. Section
  `home/dashboard`. `widget/tour.js` gains Home steps (skipped in hubs without `#panel-home`). Arcade: the **Feedback Loop
  Arcade** with its own skin (`ENDO_SKIN`, `[data-sg-skin="endo"]`): Axis Showdown (glass slides stained purple/pink; Hormone
  Surge, Final Feedback), Endo Lab Escape (drawn endocrine lab; Lugol's iodine turns starch paper blue-black), Fill the Receptor,
  The Golden Gland (a thyroid that turns gold), Cross-Stain, Feedback Sort. `widget/games.js` lets a skin draw the quiz-ladder
  marquee (`skin.smile.art`, `winTitle`). Dashboard `HUBS` (`checkinHour:10`: the exam ends at 9:30), new class `hemeendo` on a
  new `endo` ring (`--c-endo`), `ARCADES`; `review/` and `tools/publish-recap.js` labels; `widget/ranks.js` name and medal;
  `sw.js` -> `sh-v34`; About page (Home page, numbered statements, the arcade table); `assets/og-heme-endo-exam1.png`. Build sources and
  the build script stay in the session (the hub is a single file; edit it directly from here on). **Diagram review still to be
  put to Sam.** No schema change.

- **2026-10-22 (Settings → Extras: every optional feature has its own switch, Claude Code)** — Sam asked to be able to turn the
  bosses, nukes, Tooth Fairy, rank-up animations and the rest off one by one, plus one button that turns everything optional off.
  Each hub's Settings panel (`EXTRAS` / `extrasHTML()` in `widget/v3.js`) and the dashboard's Settings (`EXTRAS` in `index.html`;
  **keep the two lists in step**) now end with an **Extras** section: **All on / All off** at the top (lit only when every extra
  matches), then one row per feature, each its own localStorage key (default `on`): `sh_pref_boss` (Plaque bosses), `sh_pref_fairy`,
  `sh_pref_probe` (Golden Probe), `sh_pref_arch` (Full Arch), `sh_pref_nuke` (`on` | `mine` = no classmates' strikes | `off` = no
  unlock at all; replaces `sh_pref_nuke_alerts`), `sh_pref_celebrate` (rank-up cutscene, level-up, trophy and medal cards in
  `widget/ranks.js`; the mock results card goes quiet), `sh_pref_cheers` (confetti + toast every 5 in a row), `sh_pref_flame`,
  `sh_pref_fx` (Answer animations: `widget/fx.js` treats it like reduced motion, so marks stay), `sh_pref_pet` (unchanged) and
  `sh_pref_eggs`, now **"Hidden secrets"**: only the eggs without a switch of their own (holidays, magic words, TIMMY, Night Owl,
  professor quotes, root canal, Cavity Search, Floss Chain). `widget/eggs.js` gates the four with `feat(k)` instead of
  `ok()`. One-time carry-over (`sh_pref_extras_v`): Surprises off sets the six keys it used to cover off; nuke alerts off becomes
  `mine`. Turning a feature off hides it at once (boss, arch, nuke badge, flame). `widget/clicks.js` snapshots the new keys. About
  page, `sw.js` -> `sh-v33`. No schema change. **A new optional feature: give it a key and a row in both `EXTRAS` lists.**

- **2026-10-22 (rule: every lecture gets two-statement and true/false questions, Claude Code)** — Sam: follow the
  Occlusion question formats for the upcoming lectures. New standing rule (above, and `CLAUDE.md`). `tools/ci/smoke.js`
  now fails a taught lecture with fewer than 3 two-statement or 5 true/false items (`FORMAT_MIN`; exempt: archived hubs and
  perio S1-S5 via `FORMAT_GRANDFATHERED`), a two-statement item whose choices or "1. / 2." stem lines differ from the
  standard, a true/false item not choosing True / False, and a hub whose true/false keys are under 35% or over 65% True.
  No site change.

- **2026-10-21 night (MSK Exam 4 and PCD Exam 3 check-ins closed, cards off the dashboard, Claude Code)** — Sam: close both
  check-ins (`checkinClosed:true` on each exam in `HUBS`) and take both archived cards off the dashboard now
  (`hideCardOn:"2026-10-21"`, ahead of the usual `CARD_DAYS`). Answers already sent stay on `review/`. The hub pages
  stay up; retrospective and folder cleanup are still manual.

- **2026-10-22 (GI and PCD cards off the dashboard, Claude Code)** — Sam: take the MSK Exam 4 (GI & MSK) and PCD
  Exam 3 cards off now. Both were already archived; `hideCardOn:"2026-10-22"` on their `HUBS` entries removes the
  archived cards today instead of Oct 26 / Oct 25. Hub pages, arcade high scores and check-in data are unchanged.

- **2026-10-22 (Occlusion: two-statement and true/false questions, Claude Code)** — Sam asked for both formats in
  `hubs/occlusion`. New helpers `two(id, lec, src, s1, s2, t1, t2, ex, r1, r2)` (`fmt:'2stmt'`, the four fixed choices in
  `TWO_CHOICES`, answer computed from t1/t2, its "why each choice" lines built from one reason per statement) and
  `tf(id, lec, src, statement, isTrue, ex, whyTrue, whyFalse)` (`fmt:'tf'`, stem "True or false: …", choices True/False);
  both set `q.why` themselves instead of a `QUESTION_WHY` row. `choiceOrder(q)` keeps their choices unshuffled in the bank,
  drill, Weak Spots and the mock; the arcade skips them (`arcadeQ`); `.qcard-stem` keeps line breaks. 27 two-statement and
  42 true/false items written from the L1-L5 notes (`*-2s-*`, `*-tf-*`; keys balanced, 21 true / 21 false); bank 349 → 418.
  Question Bank gains a **format filter** (`STATE.ui.qfmt`: two statements, true or false, EXCEPT / NOT, Patient Box, select
  all). About page updated. No notes text changed, so no narration or podcast rebuild.

- **2026-10-21 evening (perio midterm check-in closed, Claude Code)** — Sam: the Periodontology midterm's check-in is closed

- **2026-10-21 evening (perio midterm and PCD Exam 3 check-ins closed, Claude Code)** — Sam: the Periodontology midterm's and PCD Exam 3's check-ins are closed
  (`checkinClosed:true` on that exam in `HUBS`; `pastExams()` skips it, so no card button and no pop-up). The perio final's
  check-in will still open on Nov 19. Answers already sent (perio 28, PCD 10) stay on `review/`.

- **2026-10-21 evening (exam check-in changes, Claude Code, #160-#162, #164)** — Sam: the Occlusion midterm check-in opened at 7 pm
  (`checkinHour`/`promptHour` 19). An exam in `HUBS` can carry `extraQs`, inserted before the closing text question
  (`debriefQs()`); Occlusion's midterm asks 1-5 `diagrams` ("How helpful were the hub's diagrams?") and `pbox_img` (the
  Patient Box questions with pictures), shown as averages on `review/`. **Every check-in's last question is now "Anything the
  hub could do better?"** (still saved as `missed`; before today it asked what topics or formats the hub missed). About page
  and `/lessons-audit` updated. No schema change.

- **2026-10-21 (Try it again in every hub's Question Bank, Claude Code)** — Sam: apply #156's missed-question retry
  everywhere. `pcd-exam3`, `msk-exam4` and `msk-exam3` (same engine as Occlusion) get the identical change: `RETRY_GAP`,
  `list.__retry` in `renderBank`, the hook at the end of `finishCard`, `qCardHTML(q, {retry:true})` and the CSS. **Perio**
  (its own engine): `markMissed` hands the miss to `list.__retry` (set in `renderQuestionBank`), which renders `qCardHTML(q)`,
  adds `is-retry` and the chip; a copy counts as pending until its explanation is shown, and a second click listener counts
  `bank:retry-right` / `-missed` once (recall cards when graded); new `cycle` icon. The chip wraps on phones in every hub.
  Tested in all five: miss, retry 5 cards down; miss the retry, another; right, none. About page now says every hub.
  **A new hub: copy the retry from `occlusion`. Perio and MSK Projects: carry it into the split sources.**

- **2026-10-21 ("Is this your other device?", Claude Code)** — Sam: 16 ids had a custom name but only 13 names (Dr Winters
  on 3, LeSunshine on 2), likely the same people on unlinked devices. New `widget/linkask.js` (loaded by v3.js and the dashboard):
  saving a name another, unlinked id already uses keeps the name and opens a card ("Yes, link them" → get a code or enter one
  right there, same RPCs as Stats → Link my devices; "No, that's someone else", remembered per name in `sh_link_ask_no`; "Not
  now", 3 days in `sh_link_ask_later`). A device whose saved name is shared is also asked once a day on load (`sh_link_ask_day`),
  never during a mock, the tour, a survey or the Inbox. `migration_v41.sql` (**applied via the connector**): public
  `name_shared(p_visitor, p_name)` (case-insensitive, follows `visitor_links`). The random class names aren't checked (computing
  `anon_name` for everyone is too slow). Tracked as `link-ask:shown|yes|no|later|code|linked`. About page, CI syntax check,
  `sw.js` -> `sh-v32`.

- **2026-10-21 afternoon (lessons audit: horizontal envelope matches the slide, Claude Code)** — Occlusion exam day.
  Suggestion #11: the horizontal envelope of motion was upside down and mirrored compared with Dr. Givan's slide 71. Codex's
  #155 swapped left and right in the built hub only (CR stayed at the bottom, and a rebuild would revert it); now `envHoriz`
  (`tools/figures/occlusion/od.js`) and the envelope tracer's horizontal tab (`anima/envelope.mjs`) draw CR at the top,
  maximum protrusion at the bottom and the patient's left on your right, as the slide does, rebuilt with `build.mjs` (same
  A-D letters, so `fig-hor-b`/`fig-hor-d` are unchanged). `cs-pro-incline`'s key now reads "Distal inclines of the maxillary
  palatal cusps against mesial inclines of the mandibular cusps" (same position; 8/20 since this morning's explanation fix),
  with its explanation and `QUESTION_WHY` row. No notes text changed, so no narration regenerated. `LESSONS.md` refreshed
  (first read of the guided tours: 5 students took one on exam day).
  **Missed it? Try it again** (suggestion #10, at Sam's request): in the Occlusion Question Bank a missed question comes back
  as a fresh card `RETRY_GAP` (5) cards further down (`list.__retry` in `renderBank`, called from `finishCard`; `qCardHTML(q,
  {retry:true})` draws a dashed card with a "Try it again" chip). Missed again, it comes back again; one pending retry per
  question; never inside a patient's case set. Answers count as normal bank answers (ctx `bank`); tracked as
  `bank:retry-shown` / `bank:retry-right` / `bank:retry-missed`. About page updated. Perio's bank doesn't have it yet.

- **2026-10-21 (arcade skins: every hub's games look like that hub, Claude Code)** — Sam: copy the new games to Perio but not as a
  copy-paste; same ideas, visually unique, and the same for every new hub (now a standing rule in `CLAUDE.md` → "Every hub's arcade
  looks like that hub"). `widget/games.js` takes `C.skin` (`{ id, board, cloze, escape }`) and tags each game root
  `data-sg-skin="<id>"`. The escape room's plain room is now a set of parts (`BASE_PARTS`: room, clock, decor, xray, poster, door,
  monitor, chair, chart, cabinet, drawer, sink) that a skin replaces whole (`escape.scene(api)`) or in part (`escape.parts`), with
  helpers `api.spot / hand / digit / check / keypad / padlock / slotColor / digitOf`; spot labels, flavor text, the item and its
  reveal, the intro and the wager-round names come from the skin. **Perio** (`PERIO_SKIN` + `[data-sg-skin="perio"]` CSS): Perio Clinic
  Escape (panoramic film, charting computer, perio chart on the bracket table, a sealed instrument cassette holding disclosing tablets
  that stain the hidden digit onto a typodont, corkboard hint, frosted PERIO door), Pocket Showdown drawn as a perio chart whose
  teeth bleed on a miss (Deep Pocket, Final Probe), Mind the Pocket with a UNC-15 probe as its clock. **Occlusion** (`OCCL_SKIN`): Lab
  Escape (an occlusion lab; articulating paper from the drawer marks the digit on casts mounted on an articulator), articulating-paper
  board strips (Centric Double, Final Contact). New lobby thumbnails per hub. **Million-Dollar Smile art redrawn** (Sam: "terrible"): a
  quiz-show marquee above the question (chasing bulbs, `grinSVG()`: lips, gums, two rows of teeth, a gold tooth that sparkles from
  rung 6), colored by `skin.smile`; Perio's thumbnail is a spotlit studio stage, Occlusion's a pixel-art grin. **Painted escape rooms**: Sam makes backdrops with an image model
  (Argon); Occlusion's Lab Escape now draws `hubs/occlusion/img/lab-escape.webp` (1024x572, stretched to the 800x450 scene) with
  invisible hotspots placed over the painted props (`OCCL_SKIN.escape.scene`; a dark overlay switches the view box and computer off
  until solved, a red countdown hand rides the painted clock). A new backdrop means re-measuring every `api.spot()` rectangle on a grid
  overlay. Perio's Clinic Escape got its own painted backdrop on 2026-10-27 (entry above). Game-over cards in the shared games scroll instead of
  squashing the missed list. Dashboard `ARCADES` and About page names updated. **Perio Project: carry `PERIO_SKIN` and its CSS into the split sources.**

- **2026-10-21 (perio S5: Resective Osseous Surgery from the Oct 15 class, Claude Code)** — Drive: Periodontology/hubs,
  `en-FA2026_DENT2145-VT_Lecturecapture_AVLC.txt` (the Oct 15 class capture, base64 text: Dr. Litz's in-person review of
  furcations, then Resective Osseous Surgery) and `Resective Periodontal Surgery_Dr. Litz.pdf` (text only: 16 MB is over the
  connector's 10 MB download limit; its picture slides are the surgical cases he talked through). Session 5's resective half
  is no longer the exam-review stub: status note gone, source updated, both reading levels rewritten from "In class: the
  furcation points he repeated" to the end (Phase I and re-evaluation paths, the 11 surgery indications, the 1981 SRP
  study, why bone must follow the scalloped gingiva, positive/flat/negative architecture, 0.6 mm and the 1-year mobility,
  indications and contraindications, ostectomy vs osteoplasty, the 4 steps, sparing furcation bone) and both mp3s
  regenerated. 30 new questions (`q5-R01`-`R24`, 2 two-statement `q5-RS*`, 2 select-all `q5-RM*`, 2 Patient Box `q5-RP*`;
  `q5-R05`/`R08` are EXCEPT; src `lecture`; bank 479 → 509), 7 exam hints quoted from the capture, 2 Review sections
  (phases + re-evaluation, resective osseous surgery), cram lines, a mind-map branch and 4 arcade words. Not changed: in
  class another instructor described Hamp as "three millimeter increments" (1-3, 4-6, >6 mm), which is Tarnow and
  Fletcher's vertical scale; the hub keeps Hamp as under 3 / over 3 / through. **Perio Project: carry all of this into the
  split sources.**

- **2026-10-21 (boss costumes match their seasonal names, Claude Code)** — `widget/eggs.js`: the one-costume-per-holiday
  block in `bossIcon` is replaced by `COSTUMES[holiday][boss]`, 64 outfits that match each seasonal name (Strep
  Mummy-tans in bandages instead of the vampire cape, Tartar-stein's bolts, the Gingi-witch's hat, Tartar the Snowman,
  the Red-Nosed Complex's antlers, etc.). `FIT` places hats, glasses and noses per body. `bossIcon(k, hid)` takes an
  optional holiday id for previewing. About page Part 8 note updated.
- **2026-10-21 (perio S6: Periodontal Regeneration slide deck, Claude Code)** — Dr. Geurs' slide deck (Drive:
  Periodontology/hubs, `Periodontal_regeneration_Dr. Geurs.pdf`; downloaded through the Drive connector and its
  pages rendered with `pdftoppm`, so the image-only slides were read too) is in `hubs/perio` ahead of the lecture. Session 6 goes from `upcoming` to
  `preview` ("Slides only so far"). Both reading levels rewritten (definition vs repair, the four factors, defect
  morphology with the slide's odds ratios and Nibali's pooled numbers, the strategy map (tissue engineering vs
  endogenous regeneration), Levine's regeneration risk assessment, the AAP (Reynolds 2015) decision tree, the toolbox, the open-flap-debridement table, evaluation and subtraction
  radiography; the exam-review guide's EMD / rhPDGF-BB / β-TCP kept) and both mp3s regenerated. The angle is now
  "≤25°" as on the slides (`q6-01`, `q6-06` choice text; same ids and positions). 54 new questions (`q6-L01`-`L38`,
  4 two-statement `q6-S*`, 4 EXCEPT `q6-E*`, 3 select-all `q6-M*`, 4 Patient Box `q6-P*`, 1 matching `q6-X01`; bank
  425 → 479), each with its `QUESTION_WHY` row; 4 Review sections (definition and case selection, risk assessment +
  decision tree, toolbox + graft sources, OFD baseline + evaluation), cram sheet, mind map and 5 arcade words
  (the Quadrants group was dropped in the merge with #151, which retired that game). `NEXT_QUIZ` not set
  (date unknown). No diagrams drawn; the diagram review is still to be put to Sam. **When the recording arrives: flip to
  `taught`, add what the lecture emphasizes, exam hints, and regenerate both mp3s. Perio Project: carry all of this
  into the split sources.**

- **2026-10-21 (arcade revamp: six games, shared `widget/games.js`, Claude Code)** — Sam: the games were a bust; cut nine to six and
  make them playable. Data behind the pick: the arcade was under 2% of study time in every hub; only the sort game (Sort Storm 50
  plays/9 people, Split Decision, Silane Sort), Perio's Cross-Section (12/6), Calculus Crusher (10/8) and Million-Dollar Smile got
  repeat plays; snake, flappy, whack, blaster, search, sweeper, perdle and planer each got about one. Survey 3's games question asked
  for fewer games, a Jeopardy board by lecture with wagers, cloze fill-in-the-blank, quiz-based games and a lecture / missed-question
  filter. New **`widget/games.js`** (+ `widget/games.css`, linked by the script; each hub loads it with `<script defer>` before v3.js):
  `shGames.make(id, g, C)` for **board** (Showdown: one column per lecture, $100-$500 sorted by class accuracy via
  `shGetClassStats`, 2 Daily Doubles, a Final wager on one of the hardest leftovers), **cloze** (Mind the Gap: a sentence from the
  notes with a bolded term blanked out, typed answer, `grade()` allows a letter or two of typos and plurals, 3 lives, clock tightens
  from 32 s to 16 s), **escape** (Operatory Escape: an SVG operatory with hotspots; X-ray viewer, patient chart and drawer are MCQ
  locks, the computer's password is a cloze term, the drawer gives a curing light that reveals the poster's digit; 4 colored digits
  open the door; 6 min, -20 s per wrong answer), plus **smile** and **cross** moved out of Perio. Cloze items come from
  `clozePool(notes)`: `<b>` terms in `p`/`li` (not the "What's tested" box or tables), 3-36 chars, at most 4 words, with a stop list
  for emphasis words. Each hub passes a context `C` (contract at the top of games.js): bank/terms/notes pools, the scope select
  (now with **Questions I missed**: last answer wrong), shell, HUD, finish (best score + leaderboard) and `record` (its answer choke
  point, so class stats and Weak Spots update). **Occlusion**: Cusp Sort + Freeway Showdown, Operatory Escape, Mind the Gap,
  Million-Dollar Smile, Cross-Section (crossword words = one-word bank answers + one-word bolded terms); snake, stack, match, hangman,
  fact, blaster, search and whack removed with their CSS. **Perio**: Calculus Crusher + Pocket Showdown, Operatory Escape, Mind the
  Gap, Smile, Cross-Section; flappy, probe, quadrants, perdle, planer and sweeper removed (and `QUAD_GROUPS`); the category filter row
  is gone. Archived MSK 3/4 and PCD 3 keep their nine games. `migration_v40.sql` (**applied via the connector**) whitelists `board`,
  `cloze`, `escape`. Dashboard `ARCADES`, About page Part 4, `widget/tour.js` arcade step, CI syntax check, `sw.js` -> `sh-v30`.
  **A new hub: load `widget/games.js` and build `C` like Occlusion's (`CTX` in its ARCADE). Perio Project: carry the arcade into the
  split sources.**

- **2026-10-21 (tour fixes and a faster streak board, Claude Code)** — `widget/tour.js`: the dim layer is one element with a
  rounded `clip-path` hole matching the spotlight ring (the four panels showed seams and square corners when zoomed in); short
  screens (under 560 px tall, e.g. a laptop at 200%+ zoom) get compact card type, and a docked card may use up to 60% of the
  height. The dashboard tour no longer explains hub features (the five "Inside every hub" cards are gone); one step on a hub's
  Open button points to the hub's own tour. `sw.js` -> `sh-v29`. `migration_v39.sql`: `get_correct_streak_stats` timed out
  (57014) because it ran `sh_visitor_xp` for every `correct_streaks` row before `limit 1`; it now picks the two top rows first (applied to the live database 2026-10-21).
- **2026-10-21 (Occlusion + Perio: outside fact-check fixes, Claude Code)** — Sam ran both banks past a second model (Gemini); each flag was checked against the hub's notes. Same ids and answer positions throughout. **Occlusion**: `fn-fricative` / `cs-fricative` no longer call the wet-dry line the "vermilion border"; `cs-crown3-plunger`'s #30 cusp rises above the plane (matches `ap-pb-crown`); `cc-step5` says envelope of function. Kept as taught: Stuart/D'Amico attribution, plunger-cusp definition, help-sheet cusp-fossa contacts, stylo-/sphenomandibular ligaments. **Perio**: the Grade C smoking modifier is "10 or more cigarettes a day" in every question (`q1-19`, `q1-O01`, `q1-P02`, `q1-M01`, `q1-S02`, arcade clue; the notes still say "more than 10", as the class did, and are narrated, so unchanged); `q1-M04` RT2/RT3 wording matches `q1-08`; PGCL is poly(glycolide-co-caprolactone), not "poly-glycolide" (same polymer as PGA) in the suture chart and `q2-02`/`03`/`04`/`M01`; `q2-05` asks for the natural braided suture; `q4-07` names the H6/7 sickle; `q4-L36` asks about a Gracey; `q5-L17`/`S02`/`E01`/`E04` say no connective-tissue attachment forms on enamel (junctional epithelium does attach); `q8-04` no longer says food speeds ciprofloxacin; `q8-09`'s low-dose doxycycline choice (also avoided in pregnancy) is now Penicillin V, so `question_choices` rows for that slot before today mean the old choice. Kept as taught: molar-area CTG harvest, Kwok & Caton whole-dentition, stage regression only by regenerating the defect, clinic piezo can't root plane, lingual furcation entrance wider. **Perio Project: carry these into the split sources.**

- **2026-10-21 (guided tours: dashboard and every hub, Claude Code)** — New `widget/tour.js`, loaded by `index.html` and by
  `widget/v3.js` in every hub (`shTour.mount({where:"hub"})`). Each place asks once, "Want a quick tour?" (Show me around / No thanks),
  remembered in `sh_tour` (dashboard) and `sh_tour_hub` (all hubs together): `done` | `skipped` | `no`. Tour buttons: `#tourBtn` in
  the dashboard top bar; in a hub, `.sh-ribbon-tour` in the top bar (hidden under 1000 px, the bar is full) and "Take the tour"
  (`#shstat-tour-pill`) in the widget menu / phone More sheet; any `[data-sh-tour]` starts it. Dashboard: up to 16 steps (a spotlight on
  each part; what's inside a hub is left to the hub's own tour). Hub: up to 19 steps found by shared markup (`#modeSwitch`, `#countdownPill`,
  `#sh-ribbon-name`, `[data-sh-podcast]`, `.quick-start`, `#examCard`, the Compendium `.subtabs` buttons by label, `.sh-tts-btn`,
  `.reading-prose`, `.qcard`, `#panel-review`, `#panel-arcade`, the launcher menu, `.shpet-home`, `#sh-ribbon-back`); a step can
  switch mode/tab or open the menu first, missing parts are skipped, and the hub goes back to its starting mode, tab and scroll at
  the end. The hub question is not asked on an archived hub, a page opened with a #hash, during a mock, or with the drill open.
  While a question or tour is up, the survey/check-in pop-up and `widget/replies.js` pop-ups wait (`shTour.whenIdle`), and an open
  survey or reply card is hidden (`html.sh-touring`). The dimming is one full-screen layer with a rounded hole cut by `clip-path: path(evenodd, …)`
  (a huge box-shadow didn't paint on hub pages; four panels left seams and square corners when zoomed). Tracked as `tour:` / `tour-hub:` + `prompt`, `start`, `decline`, `done`, `quit@<step>`.
  **A new dashboard section, hub mode, Compendium tab or widget tool: add a step or a line in `dashSteps()` / `hubSteps()` /
  `SUB_INFO` in `widget/tour.js`.** About page, CI syntax check, `sw.js` -> `sh-v28`. No schema change.

- **2026-10-21 (mastery medals: one per row, unique per hub, Claude Code, #145)** — Leaderboard rows showed up to three 16px medals that got cut off (in the hub arcade boards they sat inside the name's ellipsis). `shRanks.flair()` in `widget/ranks.js` now draws one tappable medal per row (this page's hub first, else the best) plus "+N"; tapping opens a card with every medal (`openFlair`, a fixed inset:0 layer, tracked `flair:open`). `{ list:true }` gives the rank cards one chip per hub with its name. `medalSvg(lvl, px, hub)`: the metal is the tier, the emblem and ribbons are the hub's (`HUB_MEDAL`; unknown hubs get the tooth), Crown wears a crown on top; the mastery card uses it. Hubs' arcade `row()` puts the flair after `.lb-nm`. **A new hub: add its emblem and ribbons to `HUB_MEDAL`. Perio and MSK Projects: carry the arcade row change into the split sources.** About page, `sw.js` -> `sh-v27`. No schema change.

- **2026-10-21 morning (lessons audit, Claude Code)** — Occlusion midterm day. **"What cusp hits where?" Movements**
  (`tools/figures/occlusion/game.js`, rebuilt into the hub's `od:kit` block): the round's verdict now says which step missed
  ("Right cusp, but step 1 missed. The arrow shows ...", "Right movement, wrong cusp.", "Both missed.") instead of a bare
  "Not quite." (report #28: a right cusp after a wrong movement lit green under "Not quite."). Scoring unchanged (both steps
  needed). `cs-record-best`'s stem now reads "prefer over using any registration material" (was "prefer to", readable as
  "prefer for"; 13 of 26 picked Aluwax); `cs-pro-incline`'s explanation and `QUESTION_WHY` row say why streaks on the
  palatal cusps are still protrusive. Same ids and answer positions. No notes text changed, so no narration regenerated.
  `LESSONS.md` refreshed.

- **2026-10-21 (Timmy Time: Occlusion midterm episode, Claude Code)** — A 45-minute last-minute review for the Occlusion
  midterm, hosted by Timmy Tooth: `hubs/occlusion/audio/timmy-time.mp3` (~32 MB, -16 LUFS), script
  `tools/podcast/occlusion/script.md`, written from the hub's notes (As taught), exam hints and cram sheet, in exam-weight order
  (L1 split into terms, what cusp hits where with the fence post walked through, and guidance/determinants/envelope), 28-question
  lightning round. Light lore building on the MSK 4 episode (his house, his costume, he's a lower first molar, the other TIMMY).
  `lexicon.json` gains 49 occlusion/anatomy words (condyle, pterygoid, masseter, temporalis, the hyoid muscles, mesio-/disto-
  words, Givan with a hard G, Schuyler, D'Amico, ginglymoarthrodial). Hub: `window.SH_PODCAST` (id `midterm-review`) and a
  `data-sh-podcast` slot at the top of Compendium, `#timmy` opens Compendium; dashboard card gets `podcast`; About page updated.
  **When the notes change, fix the script and rebuild the episode in the same PR.**

- **2026-10-20 evening (lessons audit, Claude Code)** — Occlusion midterm eve. `hubs/occlusion`, same ids and answer
  positions: `fp-post`'s stem now says "Class I, cusp-fossa" and names the anterior/posterior contacts on #3 (report #27; its
  favorite wrong answer, the MB cusp of #31, is right in a cusp-marginal ridge reading), and its explanation says why that cusp
  tempts; `cc-parfitt` (Monson, picked 20 times: no condyles, so no condylar paths) and `ap-quad` (root canal therapy is on the
  lecture's list) answer their favorite wrong choice; `QUESTION_WHY` rows updated to match. `question_choices` rows for
  `fp-post` before today go with the old stem. No notes text changed, so no narration regenerated. `LESSONS.md` refreshed.

- **2026-10-21 (Occlusion anima 10 of 10: tooth vs implant under load, Claude Code)** — In the L5 notes at 'Implants' (both levels;
  a heading anchor, so after the table and the anterior/posterior paragraph) and in Review (L5 tab, before Registration). A tooth in its
  PDL beside an osseointegrated implant: Under load (push down: about 28 µm vs about 2-3 µm; sideways: 56-75 vs 10-50 µm; the PDL's
  "felt" signal), drawn ×500 (0.5 px/µm) with the notes' numbers at full load; Shimstock check (12 µm): light closure holds on the tooth
  and pulls through the implant, clench holds on both. Controls use `data-imtab`/`data-imdir`/`data-implay`. Built by
  `tools/figures/occlusion/anima/implant.mjs`. About page updated. **This completes the 10 Occlusion figures Sam approved on 2026-10-20.**

- **2026-10-21 (Occlusion anima 9 of 10: swallowing, stage by stage, Claude Code)** — In the L3 notes after 'Part 2: swallowing'
  (plain 'Swallowing'; new `FIG_PLACE.function` / `FIG_BY_LEC.function`) and in Review (L3 tab, after Swallowing stages). Schematic
  midline section: tongue, palates, pharynx, epiglottis, hyoid, trachea, esophagus, cervical spine. A stage slider (0-3) blends
  keyframes (`swState`): stage 1 tongue presses the bolus back; stage 2 soft palate up, hyoid up and forward, epiglottis over the
  inlet, Eustachian tube opening opens; stage 3 down the esophagus. Somatic vs visceral toggle (tongue tip between the incisors,
  teeth apart). Only the notes' numbers (66.5 lb / 683 ms, 590 a day, 1 s, 6-7 s). Controls use `data-swstep`/`data-swplay`/`data-swmode`.
  Built by `tools/figures/occlusion/anima/swallow.mjs`. About page updated.

- **2026-10-21 (Occlusion anima 8 of 10: canine guidance vs group function, Claude Code)** — In the L1 notes at 'Guidance and the
  goals of ideal occlusion' (plain 'Guidance and the ideal'), in the L5 notes at 'Schemes and guidance' (plain 'Guidance and MIP'; new
  `FIG_PLACE.applying` and `FIG_BY_LEC.applying`), and in Review in both tabs (L1 Guidance and determinants after Schemes; L5 before
  Conformative vs reorganized). The patient's right side from the cheek in a right working move plus a front view of the canines; canine
  guidance (#6 with #27, steep) vs group function (#7-6-5 with #26-27-28, flatter, the notes' example). The lower jaw is one rigid piece
  that drops by slope × travel at the canine, less toward the back (turning about the working condyle). Slopes and gaps schematic.
  Controls use `data-gumode`/`data-guplay`. Built by `tools/figures/occlusion/anima/guidance.mjs`. About page updated.

- **2026-10-21 (Occlusion anima 7 of 10: CR to MIP slide, Claude Code)** — In the L1 notes at 'MIP, centric occlusion and centric
  relation' (plain 'Three positions people confuse'; a heading anchor, so it lands at the end of that section) and in Review (L1 tab,
  Positions and terms, before Terms). Side view: hinge closure with the condyle seated (CR) until the first contact, then the slide up the
  inclines into MIP while the condyle comes off its seat along the eminence; toggle for CO = MIP (the 10%). One model: lower teeth drawn
  in MIP, any pose = condyle offset + rotation about it, the rotation solved by bisection so the teeth just touch (`crContactRot`); the
  first contact falls on the second molars (asserted at build time, matching `pb-slide`). The slide is to scale (1.25 mm at 6 px/mm)
  with ×4 zoom panels that reuse the same markup in a zoomed viewBox. **Lesson: exaggerating a slide past half a cusp pitch lands cusps
  tip on tip; keep the teeth far enough from the hinge (here M2 about 140 px from the condyle) or the CO rotation balloons.** Built by
  `tools/figures/occlusion/anima/crslide.mjs`. About page updated.

- **2026-10-21 (Occlusion anima 6 of 10: envelope of motion tracer, Claude Code)** — In the L1 notes after the static envelope
  figures (`FIG_PLACE` second entry on 'Horizontal view (from above)', plain 'The envelope of motion') and in Review (L1 tab, Envelope
  of motion, after Diagrams). A pen on the lower incisor traces each border of the static `envSag`/`envHoriz`/`envFront` outlines
  (copied, same A-F/A-D points) in the notes' order; sagittal: A→E rotation, E→F rotation + translation, F→D closing protruded, D→C,
  C→B up the guidance, B→A the CO-MIP slide. A joint view uses `tmjModel` (now exported from `tmj.mjs` with `TMJ_D`) for the opening
  steps. **Lesson: the anima kit sets `vector-effect:non-scaling-stroke` on every path, which measures dashes in screen pixels; a
  path drawn with `stroke-dasharray`/`getTotalLength` needs `vector-effect:none`.** Controls use `data-entab`/`data-enstep`/`data-enplay`.
  About page updated.

- **2026-10-21 (Occlusion anima 5 of 10: determinants of cusp height, Claude Code)** — In the L1 notes after the determinants
  section (`FIG_PLACE` 'The determinants of posterior morphology', plain 'How tall can back cusps be?') and in Review (L1 tab, Guidance
  and determinants, after the vertical determinants table). Side view: condyle on the eminence, M2-PM1, canines, central incisors.
  Sliders for CG, VO, HO, plane of occlusion and curve of Spee, plus protrusion (Play). One model (`chModel`): the jaw's path at each
  tooth blends the condylar slope and the incisor slope (VO/HO) by distance from the condyle; allowed incline = path angle minus the
  local occlusal angle (plane + Spee). Solid teeth are built from the starting settings, the dashed outline is the cusp that would just
  clear, too-tall cusps turn red, and in protrusion the gap (Christensen) and any overlap are filled per column. All numbers schematic;
  the module throws at build time if the trends ever stop matching the notes' table. Controls use `data-ch`/`data-chplay`.
  Built by `tools/figures/occlusion/anima/cuspheight.mjs`. About page updated.

- **2026-10-21 (Occlusion anima 4 of 10: muscles by movement, Claude Code)** — In the L2 notes after the exam-slide table
  (`FIG_PLACE` 'The exam slide: muscles for each movement', plain 'The exam chart') and in Review (Functional TMJ Anatomy, a
  "Muscles by movement" `figs` section after the exam-slide table). Schematic side view of the right side (superficial:
  temporalis anterior/middle/posterior, masseter superficial/deep, digastric, hyoid, infrahyoids; deep, cropped to the jaw, arch
  removed: lateral pterygoid superior and inferior heads, medial pterygoid). Pick a movement and the exam slide's muscles light up
  with an arrow along each line of pull (`D.LIT`, exactly the slide; the superior head shows dashed as "also active" in closing, per
  the notes); a toggle mirrors to the left side for the lateral moves. Controls use `data-mumove`/`data-muside-btn`. Built by
  `tools/figures/occlusion/anima/muscles.mjs`. About page updated.

- **2026-10-20 (Occlusion anima 3 of 10: working and non-working interferences, Claude Code)** — In the L1 notes right after the
  static frontal-section figure (`FIG_PLACE` 'Help sheet method for interferences', both levels) and in Review (L1 tab, What cusp
  hits where, Diagrams). Front view: the same #3/#30 section as `inclines` (outlines copied from `od.js`); a slider slides the lower
  molar toward the cheek (right working: 2-6 and 4-5 light up) or the tongue (left move: 1-3); side tab: protrusive in a schematic
  Class I buccal view (mandibular mesial on maxillary distal inclines). One model (`ixRide`, sampled crown profiles) rides the lower
  tooth down whatever it touches and marks the contact; "Let the guidance lift the teeth apart" removes all contact. Built by
  `tools/figures/occlusion/anima/interferences.mjs`. **Inside the notes a figure's controls must not use `data-go`, `data-view`,
  `data-tab`, `data-sub`, `data-mode`, `data-lec` or `data-group`**: the notes wire every `[data-go]` as navigation and
  `widget/fx.js`/`v3.js` read the others (this one uses `data-ixgo`/`data-ixv`/`data-ixtab`). About page updated.

- **2026-10-20 (Occlusion anima 2 of 10: cusp pathways in motion, Claude Code)** — In the L1 notes after the static
  pathway figures (`FIG_PLACE` 'Cusp pathways:', both levels) and in Review (L1 tab, part What cusp hits where, Diagrams). Fig 2: #3 and
  #30 drawn by the hub's own kit (`od.js` loaded at build time with `vm`, so teeth and arrows match `pathMax`/`pathMand`);
  pick A-D and the opposing cusp leaves its MIP contact on both teeth at once (+d on the upper tooth, -d on the lower).
  Fig 2b: the mandible from above rotating about the working condyle (`jawMove`/`jawAngles`/`jawFrame`), sliders for
  distance from the rotating condyle, from the midline and intercondylar distance plus a Bennett side-shift toggle; the
  angle between the paths follows the L1 horizontal-determinants rule (schematic distances, so it shows the trend). Built by
  `tools/figures/occlusion/anima/cuspmotion.mjs`; `build.mjs --preview` now includes `od.css`. About page updated.

- **2026-10-20 (Occlusion anima 1 of 10: TMJ opening, Claude Code)** — First of the 10 approved Occlusion figures, in the L2
  notes after the disc/compartments paragraph (plain: end of "The jaw joint") and in Review → Functional TMJ Anatomy. Slider
  0-50 mm and Play: pure rotation in the lower joint space to 25 mm (outer TM ligament taut from about 20-22 mm), then
  rotation + translation down the eminence in the upper joint space with the disc rotating posteriorly on the condyle and the
  retrodiscal tissue filling the fossa; LP inferior head lit while opening, superior head while closing; tap-to-explain
  parts. Built by `tools/figures/occlusion/anima/` (one model, `tmjModel`/`tmjFrame`, drives the built SVG and the live
  figure; the temporal bone's articular surface is molded to the disc along the path) via the same `build.mjs`, which now
  also fills the hub's `anima:js`/`anima:css` markers (`--preview` writes dist pages). No SVG ids. About page updated.

- **2026-10-20 (Occlusion: several questions per patient, Claude Code)** — At Sam's suggestion, every Patient Box case is now
  a shared patient: `CASES` (defined once, after the question helpers) holds each box and its drawn findings, and
  `pc('<key>')` gives a question that box plus `pcase`. `pboxHTML` shows "Same patient · k of n" (`caseSet()`), and the
  bank's Shuffle keeps a set together in its own order. 18 cases, 30 new questions written from the L1-L5 notes (bank
  319 -> 349), e.g. `cs-div2-vo`/`-teeth`/`-molar`, `cs-nw-side`/`-incline`, `cs-pro-incline`/`-christ`, `cs-worn-vdo`/`-weeks`,
  `cs-record-best`/`-check`; each explanation answers every wrong choice, and each has its `QUESTION_WHY` row (#129's rule). `cs-upright` and `cs-reorg` now show the full
  shared box, so their stems no longer say "the previous case" (same ids, keys and answer positions). About page updated.
  No notes text changed, so no narration regenerated.

- **2026-10-20 (Occlusion Review: one tab per lecture, Claude Code)** — Sam asked for one Review tab per lecture. L1's
  four groups (Positions and terms, What cusp hits where, Guidance and determinants, Envelope of motion) are now one
  tab, "Review of Basic Occlusion" (id still `positions`, so saved picks and `review/positions` time carry over; old
  `contacts`/`guidance`/`motion` picks fall back to it). A section's `part` field draws a part heading, and a tab with
  2+ parts opens with jump links (`partNavHTML()`). The "Processes (all lectures)" tab is gone: each lecture's tab ends
  with its own processes (a `flows` section with `lec`, filtered by `seqsOf()`). Side by side stays as the one
  cross-lecture tab. Content unchanged. About page, `sw.js` -> `sh-v26`. No schema change.
- **2026-10-20 (why each choice, highlighter colors, egg refresh, hub trophies, Claude Code)** — Sam's list.
  **Why each choice**: every mcq/multi in `occlusion` (317, incl. #128's 11 new cases) and `perio` (388) has a `QUESTION_WHY` row (one line per
  choice, same order as `choices`, written from each question's explanation and the hub's notes), applied as `q.why`
  and drawn by `whyHTML()` under the explanation after answering (bank, drill, Weak Spots, mock review), right choices
  first, the student's pick marked (a document click listener marks it). **Standing rule** (`CLAUDE.md` → "Every choice
  gets a why"): new questions need their row; the CI lint fails without it, except the archived `WHY_EXEMPT` hubs
  (msk-exam3, msk-exam4, pcd-exam3). **Highlighter** (`widget/highlight.js`): five pens (yellow, green, blue, pink,
  orange; `sh_hl_pen` remembers the last), saved ranges may carry a color key (`[s, e, "g"]`; none = yellow, so old
  highlights still load), a new stroke paints over what it covers, tapping a highlight can recolor it. **Mock exams**:
  a second Submit (with the answered count) after the last question (`.mock-foot`, all hub engines incl. perio).
  **Eggs** (`widget/eggs.js`): a drawn gold periodontal probe (`probeArt()`, also on the dashboard's Golden Probe line);
  a redrawn Tooth Fairy (`fairyArt()`, 5 looks + a rare Golden Fairy 1 in 10, 5 flight paths, sparkle trail, varied
  catch lines; still one `record_fairy` per catch); **8 bosses** (`BOSSES`: Plaque Boss, Tartar Titan, Biofilm Blob,
  Strep Mutans Swarm, Cavity Creep, Gingivitis Goblin, Halitosis Haze, The Red Complex), one per 2-hour window picked
  from the window id so everyone fights the same one, own HP and lines by health, floating damage, a crit for 2 on
  every 5th right in a row; each boss has a regular and a seasonal version (`SEASONAL`: per holiday, a name for every boss plus an opening line, worn with that holiday's costume). Console previews record nothing: `shEggs.preview("boss", 0-7)`,
  `("fairy", look 0-5, "wave|loop|zigzag|swoop|back")`, `("golden")`. **Hub trophies** (`widget/ranks.js`
  `HUB_TROPHIES`): the trophy case gains a section per hub (this hub open first, then every hub you studied or earned
  in): Bronze/Silver/Gold Mastery, Crown, Seen It All (new), Full Arch, Mock Ace, Perfect Mock (new), Final Blow, plus
  "Secrets found here". `migration_v38.sql` (**applied via the connector**) whitelists `seen-all` and `mock-perfect` in
  `record_achievement`. About page, `sw.js` -> `sh-v25`. **Perio Project: carry `QUESTION_WHY`, `whyHTML` and the mock
  footer into the split sources.**

- **2026-10-20 (Occlusion: accurate diagrams in the notes, cusp game, image cases, Claude Code)** — Midterm eve. All seven
  Occlusion figures redrawn from Dr. Givan's help sheet (Drive: Occlusion/Hubs, `Occ Lec0 help`) by one plain-JS kit,
  `tools/figures/occlusion/` (`build.mjs` pastes it between the hub's `od:kit`/`od:css` markers; `--check`): real occlusal
  anatomy, #3/#30 cusp pathways with a movement **key** (A protrusive, B working leaning slightly mesial on the upper tooth as
  the help sheet's pathway pictures draw it, C non-working, D retrusive and short; a student asked for the key), the
  help-sheet zigzag fence post, colored inclines in the frontal section, labeled envelopes. Keys use the folded
  `figKeyHTML` from #125 (each FIG's `key`); after answering, the explanation now shows the figure again with its key open
  (`figAfterHTML`, which also handles `imgAfter`); in-picture `fg-hint` labels hide above a question stem.
  New **fence post + contact map** widget with Class I/II/III tabs (`OD.CONTACTS`, read off the help sheet's three contact
  pictures). Figures now sit **inside the L1 notes** next to their paragraph (`FIG_PLACE`, both reading levels) in a
  `data-sh-noread` wrapper: `widget/v3.js` (browser-voice word wrapping) and `widget/highlight.js` (text, hash, offsets) skip
  it, `SH_GOTO` note jumps too, and READINGS text is unchanged, so no narration was regenerated. **"What cusp hits where?"**
  game at the top of the Question Bank (`CUSP_GAME`; Contacts and Movements, 10 rounds, best in `STATE.cusp`; not bank
  questions, no class stats). **Patient cases with drawn findings** (`pimg:[CASE_IMG keys]` inside the Patient Box): perio
  charts, periapical/bitewing/TMJ films (maxillary films crown-down), intraoral views, articulating paper, shimstock, mounted
  casts, a PVS record. 9 Patient Box items enriched (same ids and keys: `pb-div2`, `pb-upright`, `pb-slide`, `an-pb-lock`,
  `fn-pb-aob`, `cc-pb-sda`, `ap-pb-crown`, `ap-pb-agt`, `ap-pb-c4`) and 11 new (`cs-upright`, `cs-reorg`, `cs-trauma`, `cs-nw`,
  `cs-pro`, `cs-implant`, `cs-implant6`, `cs-worn`, `cs-record`, `cs-group6`, `cs-fricative`); bank 308 -> 319. Diagram-question
  stems name #3/#30 (same ids and keys). Sam approved all 10 anima candidates for Occlusion (TMJ opening, cusp pathways in
  motion, inclines, muscles by movement, cusp-height determinants, envelope tracer, CR-MIP slide, guidance, swallowing, tooth vs
  implant); they ship in follow-up PRs. About page, `CLAUDE.md` (inline-figure rule), `sw.js` -> `sh-v22`.

- **2026-10-20 (longer drill, Review by lecture, comparison charts, Claude Code)** — From survey round 2, at Sam's
  request. **Daily Drill length** (`widget/drill.js`): 10, 20 or 30 questions, picked on the intro screen before the day's
  first set starts (`sh_drill_size`, every hub); switching grows the saved set (keeps the picks, adds more) or trims it;
  the caps scale with the length (spaced review up to 60%, misses 80%, 30% per lecture); the finish screen offers 10, 20
  or 30 more. Tracked as `drill:size=<n>` / `drill:more=<n>`. **Occlusion Review**: each group has a `lec` and shows that
  lecture's L-number in its color on the chip and heading (`groupLecTag()`); groups that cover one lecture take its title
  (L2-L5), the L1 ones say "From L1 · Review of Basic Occlusion". New group **Side by side** (`compare`): the four
  movements from every angle, Class I vs II vs III cusp by cusp, joint words, the four curves, and the pairs the class
  mixes up (from the hardest items), all from the hub's notes. Perio's Review already filters by session title, so it
  is unchanged. About page (Daily drill, Review), perio's drill button text, `sw.js` -> `sh-v23`. No schema change.
  Sam's calls the same day: the archived hub folders stay; Timmy Tooth keeps asking unadopted visitors to tap him;
  no cloze items for now.

- **2026-10-20 (lessons audit + feature events, Claude Code)** — `LESSONS.md` refreshed: retrospectives for **PCD Exam 3**
  and **MSK Exam 4** (both recaps were already on the dashboard), the 10-15 fixes checked, Occlusion's eve signals, a
  feature-use summary (podcast, Timmy Tooth, Listen, mind maps, names, diagrams) and new standing lessons (heaviest users
  ask for application questions; build on a course's hint email; the extras each reach a minority). **New tracking**:
  `migration_v37.sql` (**applied via the connector**) adds `feature_events` (one row per day, page, kind and visitor, `n`
  summed), public `record_events` and admin `get_feature_events`. `widget/clicks.js` defines `window.shTrack(kind, n)`
  (lowercase kinds, sent with the click batch; automated browsers send nothing) and counts on every page: `view`, a daily
  `state:<setting>=<value>` snapshot (pet, pet-adopted, eggs, theme, font, size, music, accent, nuke, own-name),
  `pref:<setting>=<value>` on change (`sh:pref`, never the display name; the dashboard's Settings call it directly),
  `egg:<t>` from `sh:egg-local`, `fig-seen:` / `fig:` / `fig-part:` for diagrams (`[data-anima]`, `figure.fig-card`).
  Hooks: `widget/timmy.js` `egg:timmy-start` on every summon; `widget/pet.js` `pet:intro`, `pet:adopt-button`,
  `pet:adopt-closed-stepN`, `pet:no-thanks-stepN`; `widget/podcast.js` `pod:<id>:play`, `:secs` (content seconds heard, seeks
  excluded) and `:q1`-`:q4` (25/50/75/95% heard, once per device, `sh_pod_heard:<hub>:<id>`); `shTTS` in `widget/v3.js`
  `tts:start-full|plain|voice`, `tts:lec=<file>`, `tts:secs`, `tts:end`; `mmap:open`; `name:set` / `name:reset`. The About
  page now loads `clicks.js` too (hub `about`, `about:spoilers=on|off`). `review/` -> Clicks opens with a **Features**
  section. `supabase/schema.sql` updated, `sw.js` -> `sh-v22`. Not student-visible. **A new feature: add a `shTrack` call
  for whatever a click can't show.**

- **2026-10-20 (Occlusion midterm eve, Claude Code, #125)** — From the lessons audit, the day before the midterm.
  `hubs/occlusion`, same ids and answer positions: explanations now answer the class's favorite wrong choice on
  `an-compound` (4/27; "hinge and gliding" is the ginglymoarthrodial definition), `fp-m2`, `fp-post`, `fp-c2-pm`,
  `rv-ch-spee`, `fig-pmand-a`, `fig-incl-w`, `fp-arrow`, `cc-parfitt`, `cc-cingulum`. **Diagram keys** (suggestion #6): a
  FIGS entry can carry `key:[[label, text], ...]`, drawn by `figKeyHTML()` as a folded "Show the key" under the copies in
  the notes and Review (`figCardHTML`) only, never on a question's picture (`figHTML`); envSag, envHoriz, envFront,
  pathMax, pathMand and inclines have one. New `rv-thielmann-f` asks for Thielmann's formula itself (report #26). 11 more
  help-sheet items (suggestion #8; the help-sheet source was the weakest at 60%): `fp-pm1b`, `fp-pm2l`, `fp-l-pm2b`,
  `fp-l-ml`, `fp-l-m2`, `fp-c2-pm1b`, `fp-c2-pm1l`, `fp-l-c2`, `fp-c3-pm1l` (fence post: other cusps, the left side, Class
  II/III) and `fp-facet`, `fp-path14` (inclines and cusp paths applied). Bank 296 -> 308. About page: the diagram key. No
  notes text changed, so no narration regenerated.
- **2026-10-20 (Occlusion midterm: Dr. Givan's exam email, Claude Code)** — The email: Wed Oct 21, 6:30 pm, Canvas with
  LockDown Browser + Monitor, 40-45 multiple-choice questions on the first three sessions (9/17, 9/24, 10/1, i.e. all five
  lectures already in the hub; the Drive Midterm folder holds exactly those three recordings), one hour, log in from 6:25,
  window closes 7:45, one blank sheet shown on both sides in the environmental scan. `hubs/occlusion`: a collapsible
  **exam card** under the quick-start row on Compendium (`EXAM_INFO`, `examCardHTML()`; closing it is remembered in
  `STATE.ui.examCard`; gone once the window closes at `EXAM_CLOSES`), with a button to the mock; the ribbon countdown counts
  calendar days and says "Midterm tonight" on exam day, switching to the final at 7:45 pm (was 10 pm); the Exam Hints banner
  and header tooltip give the time. **Mock is now 45 questions** (`MOCK_BLUEPRINT` 15/8/7/8/7, 15 per session; no official
  per-lecture counts) and its clock reads against 60:00, turning red past the hour (`MOCK_LIMIT`). Dashboard: the midterm's
  Check in button and pop-up wait for 8 pm (`checkinHour:20, promptHour:20`). No notes text changed, so no narration
  regenerated. No schema change.

- **2026-10-15 (unanswered survey waits in the Inbox, Claude Code)** — The dashboard survey pop-up's "No thanks" is now
  **Later** (it still records a null row so the pop-up doesn't come back, then says "Saved to your Inbox"). The live survey
  the visitor hasn't answered sits at the top of the Inbox on every hub and the dashboard (`widget/replies.js`,
  `get_my_survey`), unread (badge/dot) until the Inbox is opened (`sh_survey_seen`), and is answered right there with the
  same question kinds (Other included). `migration_v36.sql` (**applied via the connector**): `get_my_survey`, and
  `submit_survey` now lets answers replace an earlier null "Later" row. `shReplies.refresh()`; `sh:survey-done` closes the
  dashboard card if it was answered from the Inbox. About page, `sw.js` -> `sh-v21`.

- **2026-10-15 (surveys: 5 questions + Other, Claude Code, #120)** — `migration_v35.sql` (**applied via the connector**):
  `admin_upsert_survey` takes 1-5 questions (was 3); the dashboard card shows up to 5. A pick-one / pick-any question with
  `"other": true` gets an **Other** button that opens a text box, saved as `answers["<id>_other"]` (300 chars); `review/` →
  Surveys lists those answers and its form has 5 rows. Survey 3, "Help shape the hubs, round 2" (question formats incl.
  Quizlet/Anki, routine on the hub, guided tutorial yes/no, what's annoying, what to do about the games), is live and
  replaced survey 2. About page updated.

- **2026-10-15 (Timmy Time podcast, Claude Code)** — A last-minute audio review episode for MSK Exam 4, hosted by Timmy
  Tooth: `hubs/msk-exam4/audio/timmy-time.mp3` (~42 min, 96 kbps stereo, -16 LUFS), built by the new `tools/podcast/`
  (script `tools/podcast/msk-exam4/script.md`, written from the hub's notes and exam hints; Kokoro voice
  `am_michael:0.6,am_onyx:0.4` with `lexicon.json` for ~100 drug/anatomy words espeak mispronounces; synthesized lo-fi
  music, stingers, a bell on each lightning-round answer, ducking and mastering in `produce.py`; see its README). Player:
  new shared `widget/podcast.js` (loaded by v3.js when the hub defines `window.SH_PODCAST`): an episode card in any
  `[data-sh-podcast]` slot (MSK 4: top of Compendium), one `<audio>` on `<body>` so playback survives tab/mode switches,
  a pinned player when no card is on screen, chapters, 1-2× speed, ±15/30 s, resume (`sh_pod_pos:<hub>:<id>`, speed
  `sh_pod_rate`), Media Session lock-screen controls, preload none. `#timmy` opens the hub on Compendium at the card; the
  widget menu gains a Timmy Time item; the dashboard's MSK 4 card gets a Timmy Time row and the hero a button (`hub.podcast`).
  Listening counts as study time (idle rule) and logs as `podcast/<id>`. A lecture's Listen pauses the episode.
  About page, CI syntax check, `sw.js` -> `sh-v20` (the mp3 is never cached). **When the notes change, fix the script and
  rebuild the episode in the same PR.** No schema change.

- **2026-10-15 (Listen dock + highlighter, Claude Code)** — Two student suggestions, built at Sam's request.
  **Listen dock** (#4): `shTTS` in `widget/v3.js` now remembers the current narration (`cur`) and, while it plays or is
  paused and the lecture's Listen row and player are out of view (IntersectionObserver), shows `.sh-tts-dock` pinned to the
  bottom of the screen (above the phone bar via `--sh-tabbar-h`): play/pause, the lecture title (tap to scroll back),
  a seek bar (narration files; read-only progress for the browser voice), the time and a stop button. It also shows if
  the hub re-renders and the Listen button leaves the page while audio keeps going. **Highlighter** (#5): new
  `widget/highlight.js`, loaded by v3.js (`shHighlight.mount(HUB)`): selecting text inside any `.reading-prose` shows a
  "Highlight" button; highlights are `<mark class="sh-hl">` wrapped around existing text nodes (notes text and narration
  unchanged; Listen word-highlighting still works inside them), saved per device in `sh_hl:<hub>:<hash of the notes
  text>` as merged [start, end] offsets, redrawn by a MutationObserver whenever a hub renders notes, and dropped if the
  text changes (the hash). Tapping a highlight offers Remove / Clear all. Works in every hub with no hub changes; a new
  hub gets both if its notes use `.reading-prose` and its Listen button `.sh-tts-btn`. About page, CI syntax check,
  `sw.js` precache -> `sh-v19`. No schema change.

- **2026-10-15 morning (lessons audit, Claude Code)** — MSK Exam 4 eve-1; PCD Exam 3 is open today. `hubs/msk-exam4`,
  same ids and answer positions: `sk-keratinization`'s key reworded (report #21: "Programmed cell death that removes the
  nucleus but leaves the cell intact"); `sk-ex-func`'s throwaway key "Producing bile" is now "Activating vitamin D to
  calcitriol" (report #22, "too easy"; the explanation says the kidney does that step, as `sk-vitd` already teaches);
  explanations now answer the favorite wrong choice on `dp-clinda` (gramicidin = membrane), `dp-terb-pk` (not converted to
  an azole), `mu-dhpr` (SERCA pumps calcium back) and `nm-sux-cv` (no beta-1 block; hyperkalemia). Picture questions
  `mu-fig-h` and `mu-fig-a` (report #25, "can't tell what is highlighted"): the lit band gets a dashed outline and a stronger
  fill, the A-band still now lights its H zone too, and the H-band still drops the A-band tint (`STILL_CSS` in
  `tools/figures/msk-exam4/build.mjs`, rebuilt). `question_choices` rows before today for `sk-keratinization` and
  `sk-ex-func` refer to the old key wording. No reading text changed, so no narration regenerated. `LESSONS.md` refreshed.
  **At Sam's request (same audit):** MSK 4's two weakest matching items are now MCQs: `pa-warts-match` (2/10) became
  `pa-wart-plana`, `pa-wart-plantar` and `pa-wart-condyloma` (verruca vulgaris already had `pa-wart-hpv`), and `dp-ecto`
  (4/15) became `dp-ecto-malathion`, `dp-ecto-spinosad` and `dp-ecto-ivermectin` (crotamiton is already in `dp-ex-ecto`);
  bank 232 -> 236, matching 10 -> 8 (the Melanin Match arcade blurb no longer promises warts). **PCD Exam 3**: `gl-email`
  removed (reports #23, #24; bank 335 -> 334), and explanations now answer the favorite wrong choice on `on-telio`,
  `on-materials-list`, `ve-same-day`, `ce-short-prep`, `on-isthmus`, `gl-system`, `ve-zenith` and `gl-c-shade`.
  **Automated browsers are no longer tracked**: when `navigator.webdriver` is true (Playwright, Puppeteer, Selenium),
  `widget/v3.js` skips every `record_*` RPC and the online-now presence (`window.shAutomated`), `widget/clicks.js` sends
  no clicks and `widget/ranks.js` saves no mock score. Test sessions on the live site no longer add fake visitors.
  `sw.js` -> `sh-v18`. **MSK Project: carry these into the split sources.**

- **2026-10-15 (MSK 4: in-class review questions, Claude Code)** — The 12 in-class review questions (Drive, Exam 4
  folder, "Exam 4 Practice questions") are in `hubs/msk-exam4` as `rv-*` with a new source `review` ("In-class review"),
  stems and choices as given (typos fixed). The two picture items use the hub's own drawings instead of the slide
  images (public repo): `rv-gland` shows a new anima **skin block** (`tools/figures/msk-exam4/skin.mjs`, still
  `skin-gland`: layers, follicle + sebaceous gland + arrector pili, eccrine coil labeled "1." with its duct to a pore,
  plexuses, a Pacinian corpuscle; still only, not under the notes), `rv-mline` the sarcomere with the M line lit
  (`sarc-m`). Approved by Sam 2026-10-15; About page Diagrams entry updated. The shared doc's marks were wrong on two (spasm: keyed
  Baclofen, not cisatracurium; "-curonium" reversal: Sugammadex, not pyridostigmine) and blank on the sun-exposed-tumor
  one, keyed SCC as Dr. Dababneh's slide says (`pa-scc-common`). The bank's source filter drops "10/13 recording" (those
  items keep their chip) and gains "In-class review" first (`SRC_FILTER`; a saved pick of `rec` resets); the Daily Drill
  counts the set as high-yield. Bank 220 -> 232. No notes text changed, so no narration regenerated.
  **MSK Project: carry these into the split sources.**

- **2026-10-14 (PCD Exam 3: staining recommendations, Claude Code)** — A course email says the two exam questions from
  James Bradley's glaze video are on its staining recommendations. Checked the hub against the video transcript (Drive,
  `13 Glaze and Add Porcelain Contacts ... .txt`): the notes already covered every step. 7 new questions (`gl-email`,
  `gl-c-shade`, `gl-occlusal`, `gl-white`, `gl-texture`, `gl-ln-thin`, `gl-gingival-where`; bank 328 -> 335), the email
  and 3 video quotes as exam hints, 3 Review rows and 2 cram lines. Notes text unchanged, so no narration regenerated.

- **2026-10-14 (MSK 4: clinical lecture off, official exam counts, Claude Code)** — Sam: Dr. Taylor's MSK & Skin
  Clinical Application lecture (`clinical`, label `CA`) is not on Exam 4, so it is gone from `hubs/msk-exam4`: the
  lecture, its 29 `ca-*` questions (bank 249 → 220), both reading levels and their mp3s, the "Dental clinic" Review
  group, its cram lines, the MRONJ ordering and the osteoporosis/osteomalacia sort. Three dermpath explanations no
  longer cite Dr. Taylor's slides (same answers). The mock now uses the official counts, **30 questions: L28 6, L29 3,
  L30 6, L31 11, L32 4**. Saved views or an unfinished mock pointing at the lecture reset on load. Dashboard card text
  updated. Recover the lecture from git history (`git show ed35097:hubs/msk-exam4/index.html`) if a later exam needs it.
  **MSK Project: carry this into the split sources.**

- **2026-10-14 (perio S5: Furcation Management recording, Claude Code)** — Dr. Litz's recorded Furcation Management
  lecture (Drive: Periodontology/hubs, `Furcation_Management_Dr. Litz.mp4` + slide PDF; transcribed in-session with
  faster-whisper) is in `hubs/perio` before the Oct 15 quiz on it. Session 5 keeps its id `resective-furcation` (audio
  file names) and is now "Furcation Management & Resective Surgery", status `taught`, with a new lecture field `note`
  (shown as the notes banner instead of the status notice): only the furcation half is lectured; Resective Osseous
  Surgery is taught in class after the quiz and its short section still comes from the exam-review guide. Both reading
  levels rewritten and both mp3s regenerated. Entrance depths now follow the lecture (Bower: maxillary 3.6 / 4.2 /
  4.8 mm, mandibular 2.4 / 2.5 mm; the guide's 3 / 3.5 / 5 mm noted). 68 new questions (`q5-L01`-`q5-L50`, 4 Patient
  Box `q5-P*`, 3 select-all `q5-M*`, 5 two-statement `q5-S*`, 5 EXCEPT `q5-E*`, 1 matching `q5-X01`; bank 357 → 425);
  `q5-01`/`02`/`04` explanations and `q5-07` (stem and choices) updated to match the lecture. 10 exam hints quoted from
  the recording, 6 Review sections (terms, anatomy + root depressions, contributing factors, CEPs, classifications +
  detection, treatment options), cram sheet, mind map, 6 arcade words and 2 Quadrants groups. Course Home shows a
  **quiz card** until `NEXT_QUIZ.date` passes (set the next one there). Diagram review: Sam skipped all three candidates
  (Glickman grades, entrance map, CEP grades); don't re-propose them. **Perio Project: carry all of this into the
  split sources.**

- **2026-10-14 (PCD Exam 3 check-in waits for 8 pm, Claude Code)** — PCD Exam 3 is a Canvas exam open 8 am-8 pm, so
  its dashboard "Check in" button now appears at 8 pm, not 8 am. New optional per-exam `checkinHour` in `HUBS` (default
  `CHECKIN_HOUR`); the pop-up still goes out from `ARCHIVE_HOUR` (10 pm). About page updated. No schema change.

- **2026-10-14 (MSK 4: L31 and L32 recordings, Claude Code)** — Sam added the 10/13 class recordings of L31 Skeletal
  Muscle and L32 NMJ Pharmacology to the Drive (Exam 4 folder; both VTTs are labeled "Michael Herr", the room's Zoom
  account). Both lectures go from "Slides only" to "Recording + slides". Notes at both levels gain what the lectures
  added (muscle: adult regeneration and satellite cells with age, M line and the overlap zone, the weak/strong
  cross-bridge cycle, actin sliding toward the M line, twitch vs AP and tetany, ~80% of glucose kept as glucose-6-phosphate,
  fiber types by job and IIx switching, myokine modes, sarcopenia and innervation; NMJ: "paralytics", pseudocholinesterase
  genetics (up to ~8 h, dibucaine), bradycardia far more common, tubocurarine from curare, train-of-four thresholds,
  glycopyrrolate first for heart, airways and gut, sugammadex only for -curonium drugs plus backup contraception,
  tizanidine tried first, Botox for migraine via CGRP, descending botulism). Where the recording and slides differ
  (where the T tubules sit) the notes give both and no question turns on it. All four L31/L32 mp3s regenerated.
  20 exam hints quoted from the recordings, 20 new questions (src `rec`, "10/13 recording"; bank 229 → 249), new cram
  lines. No other lecture changed. **MSK Project: carry these into the split sources.**

- **2026-10-14 (MSK 4 diagrams in Review, Claude Code)** — Sam asked for the drawn figures in Review too, in the
  sections they belong to. `hubs/msk-exam4` Review: **The neuromuscular junction and its drugs (L32)** sits in Drugs right
  after the L32 drug cards, **The sliding sarcomere (L31)** in Muscle right after the Sarcomere bands table, both live.
  New section type `figs` (`{ title, type:'figs', lec, figs:[ANIMA keys], find:'extra search words' }`; not counted in
  the chip totals); Review search and the widget's site search find them (e.g. "sugammadex"). Because the hidden Notes
  panel stays in the page, the build now gives every copy of a figure its own SVG ids and radio group (`uniq()` in
  `build.mjs`; `ANIMA.html(key, true)` leaves the title to the caller; the sarcomere's live code and CSS no longer
  hard-code `#sc-…` ids). Side effects, both fixes: troponin C now lights up when Ca2+ is bound (an id selector was
  outranking that rule), and on phones the cropped figures no longer draw past their frame (the sarcomere's crop keeps
  its full height so its labels show). No question or notes text changed. About page updated.

- **2026-10-14 (diagrams after answering, Claude Code)** — Sam: in the question bank, don't show a diagram before the
  question is answered unless it's needed, so it can't give the answer away (standing rule, now in `CLAUDE.md` →
  "Diagrams"). New question field `imgAfter:true`: the diagram opens inside the explanation (after the verdict) instead
  of above the stem, in the bank, the Daily Drill and the mock review. Applied to every picture question that can be
  answered from its stem: MSK 4 `nm-fig-ache`, `nm-fig-rec`, `nm-fig-ves`, `nm-fig-na`, `mu-fig-a` (stems reworded to
  stand alone; `mu-fig-h` keeps its picture first), PCD `ve-dogleg`, `ve-papilla`, `co-munsell-coords`, `co-specular`,
  and perio `q2-D14` (stem reworded; its "Diagram" chip hides too). Occlusion's 20 and the rest of PCD's and perio's ask
  you to read the diagram, so they keep it above the stem. Same ids and answers. **Perio Project: carry `figAfter`,
  `imgAfter` on `q2-D14` and its new stem into the split sources.**

- **2026-10-14 (first anima figures: MSK Exam 4, Claude Code)** — From the first diagram review (Sam approved 2 of 16
  candidates across the live hubs; skipped: all 4 PCD Exam 3, MSK 4's melanin unit and blister split, all 4 Occlusion and
  all 4 Perio, so don't re-propose them for those exams). `hubs/msk-exam4` gets two interactive figures under the notes
  (outside `.reading-prose`, so no narration change): **the neuromuscular junction** (L32; selector for no drug /
  succinylcholine / rocuronium / roc + neostigmine / roc + sugammadex / botulinum toxin, with end plate, Na+ channel
  inactivation gates, a qualitative train of four and a small particle model) and **the sliding sarcomere** (L31; slider
  and Play; A band constant, I and H shrink, cross-bridges when Ca2+ is on troponin C). Six picture questions
  (`nm-fig-ache`, `nm-fig-rec`, `nm-fig-ves`, `nm-fig-na`, `mu-fig-h`, `mu-fig-a`; `img:` = an `ANIMA` still with one part
  highlighted, labels hidden) render above the stem in the bank, drill and mock; arcade pools skip `q.img`. Bank 223 → 229.
  Built by `tools/figures/msk-exam4/build.mjs` (kit tokens mapped onto the hub palette in `shared.mjs`), which rewrites the
  `anima:css` / `anima:js` blocks in the hub: edit the build, never those blocks. About page Diagrams entry updated.

- **2026-10-14 (calmer right-answer feedback, Claude Code)** — Sam found the right-answer "pop" shaky: `pop()` in
  `widget/fx.js` scaled the whole option (1 -> 1.035 -> .997 -> 1), which wobbles its text, and the check badge
  overshot. Now the option never moves: a `.sh-fx-sweep` wash in the option's own (green) color sweeps left to right in
  ~230 ms, holds, and fades by 720 ms, with a smaller, shorter glow; the check badge scales in from .4 with only a slight
  settle and draws faster. Wrong answers still shake. About page wording, `sw.js` -> `sh-v17`. No hub changes.

- **2026-10-14 (motion pass, Claude Code)** — New `widget/fx.js` (loaded by v3.js, `shFx.mount(shEggHooks)`), one
  MutationObserver plus a capture-phase click listener, so **hubs need no changes**: **answer feedback** (right after a tap
  inside a `.qcard`, an option that turns `.is-correct`/`.is-matched`/`data-state="correct"` pops with a ring and gets a
  `.sh-fx-mark` check that draws itself; `.is-wrong`/`incorrect` shakes and gets an X; the right answer then lights up;
  select-all and ordering cards mark each option in turn; the explanation grows open; cards drawn already answered stay
  still), **streak flame** (`#sh-flame`, from v3.js's new `sh:streak {n, prev}` event: 3+ in a row, ring toward 100,
  colors at 5/10/25/50/100, fizzles on a miss; Surprises off hides it; hidden on the mock tab), **bar fills** (`.bar`,
  `.weak-meter`, rank, mastery and drill bars animate from their last width, keyed by container), **view fades** (after a
  `[data-mode]`/`[data-sub]`/`[data-view]`/... click, the largest redrawn area without that row of tabs fades in) and the
  **countdown pill** (`#countdownPill` gets `.sh-cd-eve`/`.sh-cd-day` from `SH_EXPORT.exams`). `widget/rankup.js` gains a
  **queue** (cards take turns), **`shRankUp.trophy`** (coin-spin medal card with rarity) and **`shRankUp.mock`** (results
  card: count-up ring, verdict, best in this hub from `sh_mock_best_<hub>`, bars from the hubs' new `sh:mock-done`
  `byLec`, celebration at 90%+, "See what I missed" clicks `#mockMissed` or scrolls to perio's `#examMissedList`).
  `widget/ranks.js`: `track()` announces newly seen **non-secret trophies** (`sh_trophy_seen`; the first look only records;
  secret ones keep their egg/Timmy moment), the mastery toast is now a trophy card, celebrations wait only while a mock is
  **in progress** (open `[data-mock-pick]`/perio exam choices), `shRanks.celebrate(kind, d)`, previews
  `shRanks.preview("trophy", i)`, `("mastery", 0-3)`, `("mock", right, total)`, and `HUB_NAMES` gains MSK 4, Occlusion and
  PCD 3 (they showed as "Pcd Exam3"). `widget/drill.js`: animated finish screen (check draws, count-up, rows tick in,
  streak rolls up). Dashboard: the hero countdown flips like a departure board (`heroFlap`, `sh_dash_flap`). Hubs
  (`pcd-exam3`, `occlusion`, `msk-exam4`, `perio`) pass `byLec` with `sh:mock-done`. `sw.js` -> `sh-v16`, CI syntax check
  and About page updated. No schema change. **A new hub gets all of this** if its cards use `.qcard` / `.qcard-choice`
  with those state classes, its countdown pill is `#countdownPill`, and its `sh:mock-done` carries `byLec`.

- **2026-10-14 (question progress syncs across devices, Claude Code)** — Every answer was already saved per person
  (`personal_answers`) and "Link my devices" moves a device's rows onto the linked id, but nothing read them back, so a
  hub's own progress stayed per device. `migration_v34.sql` (**applied 2026-10-14 via the connector**) adds public
  `get_my_answers(p_visitor, p_hub)` (one jsonb array `[[qid, epoch s, 1/0], ...]`, oldest first, latest 5000).
  `widget/v3.js` calls it when a hub opens (and when the tab comes back after 3+ minutes), replays the history into
  spaced review (`sh_srs_<hub>`, so the Daily Drill sees misses from every device) and hands per-question totals
  `{qid: {n, c, last, t}}` plus local study days to the hub's **`window.SH_SYNC.merge(byQid, days)`**. The hub keeps
  whichever copy has more tries (nothing local is lost; re-opening doesn't double count), updates its totals, lecture
  stats and days, toasts "Synced N questions from your other devices" and redraws Compendium only in the first 8 s
  (never during a mock or narration). In `occlusion`, `pcd-exam3`, `msk-exam4` and `perio` (its `answered` shape).
  **A new hub gets sync by defining `SH_SYNC` (copy it from `occlusion`).** Link-devices text, About page, `sw.js` →
  `sh-v15`. **Perio Project: carry `SH_SYNC` into the split sources.**

- **2026-10-13 evening (lessons audit, Claude Code)** — A day and a half before PCD Exam 3. Three PCD reports fixed
  (same ids and answer positions): `on-crack-types` no longer labels a choice "Cracked tooth (treatable)" (#18);
  `ve-pbox-3`'s key is now "Plan a more opaque all-ceramic crown", since the Patient Box says bleaching was already
  tried (#15); `ce-isolation`'s key reads "RMGI, because it tolerates moisture and its excess cleans off easily" and the
  explanation says why RMGI counts as moisture tolerant despite its resin (#16). Explanations now answer the class's
  favorite wrong choice on PCD `ce-sbu`, `co-translucent`, `bo-zprime`, `bo-adh-thick`, `co-correct-high`; MSK 4
  `dp-impetigo` no longer quotes the lecture's "option B and D" (not this hub's letters). `question_choices` rows before
  today for the three keys refer to the old wording. **At Sam's request:** `rm-why-now` removed (report #17, "not
  relevant"), and the two matching items `on-cement-match` and `ce-cure-match` (48-50%) split into MCQs: each pair already
  had its own MCQ except two, now `ce-cure-emax` (dual-cured) and `ce-cure-zr` (retentive zirconia: RMGI). Bank 329 -> 328,
  matching 10 -> 8 (the arcade's Shade Match uses the 8 left). No reading text changed, so no narration regenerated.
  `LESSONS.md` refreshed.

- **2026-10-13 (diagram review rule, Claude Code)** — New standing rule above ("Building a hub = diagram review"):
  every hub build, or new lectures added to a hub, includes a review for diagram candidates, and each one goes to Sam
  for approval before it is drawn. `CLAUDE.md` → "Diagrams (the anima skill)" says how a Claude Code session asks.
  No site change.

- **2026-10-13 (anima diagram skill, Claude Code)** — `.claude/skills/anima/`, vendored from Garinmckayl/anima (MIT;
  commit and what was trimmed in its `UPSTREAM.md`), so Claude Code sessions can draw accurate isometric SVG figures
  (anatomy, cells, receptors, drug mechanisms) for the hubs' lecture notes and Review. `CLAUDE.md` → "Diagrams (the
  anima skill)" says how a figure gets into a single-file hub. Cowork/Claude Projects don't load repo skills. No site
  change.

- **2026-10-13 (rank-up and level-up celebrations, Claude Code)** — New `widget/rankup.js`, fetched by `widget/ranks.js`
  the first time it's needed. **A new rank** (Silver -> Gold) is a full-screen cutscene (`shRankUp.tier`): letterbox bars,
  the old medallion shakes and charges while light streams in (canvas sparks), flickers between old and new, then a
  white flash, shockwave rings and a spark burst reveal the new one in front of turning light rays; "RANK UP" ("MAX
  RANK" for Dark Matter) slams in with the new name, old -> new, XP and class place, and what it unlocked (accent
  metal swatch, Timmy Tooth's house upgrade if adopted, next rank). Synthesized riser, boom and fanfare. A tap during
  the build-up skips to the reveal; "Let's go", Esc or a tap outside closes it. **A new level** (Gold I -> Gold II) is
  a non-blocking card (`shRankUp.level`): coin-flip medallion, rolling numeral, the level's bar segment fills, a few
  sparks and a chime; gone after ~6 s or on tap. Both carry their own CSS (the dashboard doesn't load `v3.css`; the old
  `.sh-rankup` rules are gone) and keep only fades under reduced motion. **`shRanks.track(profile)`** now owns the
  "did the rank change?" check (`sh_rank_tier` + `sh_rank_step`) for the hub widget **and the dashboard**, which used to
  overwrite `sh_rank_tier` silently and swallow the celebration if you went there first. It waits for a visible tab and
  for a hub's mock exam to end; Surprises off skips it, as before. Try them from the console:
  `shRanks.preview("tier", 3)` (Silver -> Gold), `shRanks.preview("level", 4, 2)` (Gold I -> II). `sw.js` -> `sh-v14`,
  CI syntax check and About page updated. No schema change.

- **2026-10-13 (Timmy Tooth: holiday outfits and a lot more to say, Claude Code)** — `widget/pet.js`. **Outfits**: every
  holiday has 3 outfits (Halloween 4) and the fall weeks between holidays have 3, replacing the single hat (`OUTFITS`,
  28 in all). He wears the next one each time a page loads (`sh_pet_outfit_<season>`; first visit random). An outfit can
  draw four layers in `art()`: `back` (cape, wings, tail feathers), `face` (glasses, a nose, fangs; may depend on mood),
  `top` (hats; tips with `do-hat`, now wobbles with him) and `prop` (in his left hand, swings with that arm on
  `do-cheer`). Each has `say` lines. **Lines**: 73 jokes (was 32), 30 true tooth facts, 30 musings, greetings and
  small talk by time of day / weekday / month, situational lines (streak, big day, sharp day, second visit, away 3+ days
  via `simulate().away`, exam in 2-7 days, adoption milestones once that day `sh_pet_anniv`, his house upgrades),
  larger holiday pools, comeback / streak-over / long-session / nap / tickle pools. Everything is dealt from shuffled
  decks (`deal()`), and hellos pick by weight (`smallTalk()`/`choose()`), so he talks no more often than before.
  `tools/ci/syntax.js` now checks `widget/pet.js`. About page Parts 6 and 8 updated. No schema change.

- **2026-10-13 (lessons audit, Claude Code)** — Two days before PCD Exam 3. **Select-all options now show a tick box**
  that fills when picked and stays after grading (green right, red wrong), in `pcd-exam3`, `msk-exam4` and `occlusion`
  (CSS only, `.qcard-choice[data-act="multi"]`), from PCD report #14 ("not very clear what options you have selected";
  the picked state was only a thin accent border). PCD `co-afterimage` stem reworded (report #13; same answer and
  choices). Explanations now name the favorite wrong answer on PCD `ce-irm` (TempBond NE), `ve-pbox-3` (light try-in
  paste), `ce-contact-open`, `ce-burnish`, `ce-isolation` and MSK 4 `sk-lamellar` (Langerhans), `dp-clinda`
  (bacitracin). No reading text changed, so no narration regenerated. `LESSONS.md` refreshed.

- **2026-10-10 (lessons audit + MSK Exam 4 dashboard date, Claude Code)** — The 10-08 PCD date fix (9d3463d) also moved
  **MSK Exam 4's** `HUBS` date to 2026-10-15; the hub itself says Fri Oct 16. Back to `2026-10-16` in `index.html`, so
  the card no longer auto-archives (no Open button) at 10 pm on MSK 4's exam eve and check-ins open on the real exam
  day. `LESSONS.md` refreshed: MSK Exam 3 retrospective written (its recap was already on the dashboard since 10-09),
  Live signals for PCD Exam 3 / MSK Exam 4 / Occlusion, new standing lesson on keeping a hub's two exam dates in step.
  **Cleanup still manual:** `hubs/msk-exam3/` (card leaves the dashboard 10-12).

- **2026-10-09 (graded course work rule, Claude Code)** — Standing rule in `CLAUDE.md` → "Content from lecture
  materials": graded quiz, crossword, take-home and exam questions are never copied into a hub; once closed they are
  used as context so every topic they test is covered by hub-written questions; nothing still open is used at all;
  previous years' graded quiz, take-home or exam content is never used, even as context;
  and Sam is asked before any content is removed or excluded for these reasons. MSK Exam 4 already works this way.
  MSK Exam 3 is unchanged (its exam has passed). No site change.

- **2026-10-07 (new hub: PCD Fixed Pros Exam 3, Claude Code)** — `hubs/pcd-exam3/` for the D2 PCD Fixed Pros didactic Exam 3
  (Thu Oct 15, Canvas 8 am-8 pm, 40 questions: 1 multiple answer, 4 matching, the rest MCQ). Built from the Drive folder
  PCD Fixed Pros/Hubs/Exam 3: L1 Cement & Cementation (Dr. Fu; 2026 lecture capture + 2021 recording, which adds crown
  try-in/delivery), L2 Bonding Dental Ceramics (Dr. Lawson), L3 Removing a Crown (Dr. Fu, 2026 capture), L4 Onlays
  (Dr. Robles), L5 Laminate Veneers (Dr. Fu), L6 Color (Dr. Givan) and James Bradley's glaze/add-contact video (labeled `V`),
  plus the course's Exam 3 hint email, which drives src `hint`, the mock blueprint (8/7/3/6/7/7/2) and the Exam Hints tab
  (new hint kind `list`, shown as "exam list"). Built on the Occlusion engine with a new palette/type ("porcelain &
  cement"; DM Serif Display / Figtree / DM Mono). 329 questions (src `slides` / `rec` / `hint`): 309 MCQ, 10 matching
  (4 pairs, unique answers), 5 select-all (5 options, 3 correct), 5 orderings (3-5 steps), 12 EXCEPT, 6 Patient Box,
  9 diagram questions, 40 memory cues; correct answer longest in 33% of MCQs. No two-statement items. 8 drawn figures
  (Munsell solid, additive vs subtractive, specular vs diffuse, veneer prep designs, dog leg, papilla rule, PFM vs zirconia
  cut paths, the bonding "Lego" chain) under the notes and in Review. As taught + Plain English notes with Kokoro
  narration for all 7, review tables, cram sheet, and the arcade reskinned as the Bond Street Arcade (same nine game
  ids, `p_hub:'pcd-exam3'`). Dashboard: new `fixedpros` class on the `pros` ring, `HUBS` + `ARCADES`; `review/` labels,
  `tools/publish-recap.js`, `sw.js` (VERSION sh-v13), About page (arcade table, Diagrams), `assets/og-pcd-exam3.png`.
  Where the 2021 and 2026 recordings disagree (whether to cure the adhesive before seating; whether the patient bites to
  seat), the notes give both and no question turns on it. No schema change.

- **2026-10-07 (new hub: Occlusion Midterm, Claude Code)** — `hubs/occlusion/` for the D2 Occlusion midterm (Wed Oct 21):
  Dr. Givan's five lectures (L1 Review of Basic Occlusion with his "What cusp hits where?" help sheet, L2 TMJ anatomy and
  muscles, L3 mastication/deglutition/speech, L4 occlusal concepts, L5 applying occlusion), built on the MSK Exam 4
  engine with a new palette/type ("articulating paper"; Bricolage Grotesque / Public Sans / JetBrains Mono). 296
  questions (src `handout` / `hub` / `help`), including 20 **drawn diagram questions** (`img:'<FIGS key>'`, rendered by
  `figHTML()` in the bank card and the mock; arcade pools skip them) on the envelope of motion in three planes, cusp
  pathways on a maxillary and a mandibular molar, which inclines collide, and the fence post; 9 Patient Box and 15
  EXCEPT items; no two-statement items. Every figure also sits under its lecture's notes (`FIG_BY_LEC`, outside the
  narrated `.reading-prose`) and in Review (new section type `figs`). Board-exam items in last year's class deck were
  not reproduced. As taught + Plain English notes with Kokoro narration, exam hints quoted from the 9/17, 9/24 and 10/1
  recordings, a 40-question mock (12/8/7/7/6), review tables, and the arcade reskinned as the Freeway Space Arcade (same
  nine game ids, `p_hub:'occlusion'`). Dashboard: new `occlusion` class on the unused `pros` ring, `HUBS` + `ARCADES`;
  `review/` labels, `tools/publish-recap.js`, `sw.js` (VERSION sh-v12) and the About page (arcade table, Diagrams)
  updated. No schema change. **Two exams** (midterm Oct 21, final Thu Nov 19, both in `HUBS.exams` and the hub's
  `SH_EXPORT.exams`), so the hub archives itself the night of the final, not the midterm; the ribbon counts down to
  the midterm, then to the final (`FINAL_DATE`). The final is not cumulative; its new lectures aren't in this hub yet.

- **2026-10-07 (new hub: MSK Exam 4, Claude Code)** — `hubs/msk-exam4/` for GI & MSK Exam 4 (Fri Oct 16): L28 skin
  histology (Herr), L29 derm pharm (Fasinu), L30 dermpath (Dababneh), L31 skeletal muscle (Latimer), L32 NMJ pharm
  (Wilborn) and Dr. Taylor's MSK & skin clinical application (labeled `CA` via a new `label` field and `lecLabel()`).
  Built on the MSK Exam 3 engine with a new palette/type ("dermis & myoglobin"; Newsreader / Instrument Sans / IBM Plex
  Mono). 223 questions: 11 lecture self-checks, 44 rewritten from a classmate's study deck, 168 hub-written, including
  13 EXCEPT, 7 Patient Box (`pbox`) and 2 select-all (`type:'multi'`, perio-style partial credit) items, ported into this
  engine (qCardHTML, the mock exam; arcade pools skip `pbox` items). **No two-statement items in this hub** (Sam, 10-07).
  **Last year's graded Canvas quiz screenshots in the Exam 4 study deck were deliberately left out** (syllabus rule, as in
  #64); their concepts are covered by new questions. As taught + Plain English notes for all six lectures with Kokoro
  narration, a "what's tested" box and comparison tables per lecture, a one-tap quick-start row on Compendium, 35 exam
  hints quoted from the 9/25 recordings, a 40-question mock (7/7/8/7/7/4), review tables, and the arcade reskinned as the
  Skin Deep Arcade (same nine game ids, `p_hub:'msk-exam4'`). Dashboard `HUBS` + `ARCADES`, `review/` labels,
  `tools/publish-recap.js`, `sw.js` precache (VERSION sh-v11) and the About page's arcade table updated. Also fixed in
  this hub only: the bank's search debounce threw after leaving the tab (same bug is in `msk-exam3`, now archived).

- **2026-10-04 (Timmy Tooth is scared of TIMMY, Claude Code)** — After the TIMMY show (`sh:egg-local` `t:"timmy"`),
  `widget/pet.js` sets `sh_pet_scared_until` (now + 5 min, so it carries across the dashboard and hubs) and draws mood
  `scared`: wide eyes with darting pupils, worried brows, a wavy mouth, pale cheeks, a sweat drop and a constant tremble
  (`.is-scared`, off under reduced motion). While it lasts his hellos and most joke taps are `SCARED` lines and he glances
  around when idle; when it ends he says a `CALM` line. The dashboard pet now reacts to TIMMY too (hubs already did).

- **2026-10-04 (TIMMY curses instead of blessing, Claude Code)** — The TIMMY show ended with "TIMMY HAS BLESSED THIS STUDY
  SESSION", which contradicted the setup (the whisper "you shouldn't have said his name", Timmy Tooth's "do NOT type my
  name"). It now reads "TIMMY HAS CURSED THIS STUDY SESSION" with one of six harmless curses (`CURSES` in
  `widget/timmy.js`, picked by the device's summon count, so each summon gets the next one) and "He will return."; the
  closing chord now descends. Timmy Tooth's `EGG_LINES.timmy` gains two lines about it. About page reworded.

- **2026-10-03 (nuke unlocks tracked, Claude Code)** — `widget/v3.js` now calls `record_nuke_unlock` when the nuke badge
  appears (100 right in a row on one page load); before this only launches were saved, so "unlocked but never used"
  could only be guessed. `migration_v33.sql` (**applied 2026-10-03 via the connector**): `nuke_unlocks`, public
  `record_nuke_unlock` (one per person per hub per 5 min), admin `get_nuke_unlocks` (per hub: unlocks, never used =
  no launch before their next unlock, people). `review/` → Engagement shows a "Nukes unlocked" tile and Unlocked /
  Never used columns in Nukes by hub. Not student-visible.

- **2026-10-02 (Timmy Tooth holiday talk, Claude Code, #63)** — `HOLIDAY_TALK` in `widget/pet.js` replaces the single
  `HOLIDAY_HELLO` line per holiday: greetings, right/wrong-answer quips and jokes for each holiday, plus a `fall` pool for
  autumn weeks without one (`isFall()`). `deal(key, arr)` hands lines out from a shuffled deck per pool
  (`sh_pet_deck_<pool>` in localStorage): every line before a repeat, never twice in a row; the regular jokes use it too.
  Seasonal greetings now show in hubs (40% of hub hellos in a holiday, 15% in fall), 75% of dashboard hellos in a
  holiday; 40% of answer quips and 50% of jokes are seasonal in a holiday. About page updated.

- **2026-10-02 (Timmy Tooth "do NOT type my name", Claude Code, #61)** — Reverse-psychology hint for the TIMMY egg:
  `DONT_SAY` lines in `widget/pet.js`, used in ~20% of dashboard hellos (when no holiday/HP line takes the slot) and ~12%
  of hub hellos, plus the last entry of `TIPS`. Never with Surprises off (`eggsOn()`).
- **2026-10-02 (archived banks and the MSK PollEv set off the public site, Claude Code)** — `question-banks/` (GI Exam 1
  and 2 banks plus their extract scripts) deleted and gitignored, so past banks aren't publicly downloadable by later
  classes; `review/`'s `ARCHIVE_BANK` is gone (an archived hub's recap there has no question text; publish with
  `tools/publish-recap.js --bank <local file>` before the page comes down). The 23 MSK PollEv exam-review items
  (`rv-*`, `src:'review'`) removed after Exam 3; the bank's "Exam review set" callout hides itself when empty, and the
  source filter lists only sources that have questions. **To recover them** (they stay in git history):
  `git checkout 1e6b580 -- question-banks` restores the folder; `git show 1e6b580:hubs/msk-exam3/index.html` has the
  `rv-*` items (the block after "Exam review (PollEv review session"). Copy them somewhere private first if this repo
  is ever recreated with fresh history. **MSK Project: drop the
  `rv-*` items from the split sources too.**
- **2026-10-02 (check-ins ask for topics, not exam questions, Claude Code)** — The exam check-in's last question is now
  "Any topics or question formats the hub missed or barely covered?" with a note asking people not to write out exam
  questions or answers (the honor code keeps exam content private; the DENT 2155 syllabus bans copying any part of an
  exam). Answer key `missed` unchanged, so `review/` and the audit queries still read it. `/lessons-audit` now says to
  use a check-in only as a topic or format, never to rebuild an exam question from one. About page entry updated.

- **2026-10-02 (TIMMY easter egg, Claude Code, #59)** — `widget/timmy.js`: typing TIMMY (outside a text field, or into a
  hub's Search box) runs a 15-second overlay show (dark fade, page crumbles, crowned Timmy with cursor-tracking eyes,
  letters slam in, mini-Timmy rain, "blessed this study session" banner, page restored). Esc / corner button ends it;
  reduced-motion skips crumble, starfield and rain. Separate from Timmy Tooth (`pet.js`), who gets an `EGG_LINES.timmy`
  reaction via `sh:egg-local` when the show ends. Off with Surprises (`sh_pref_eggs`), never during a mock. Loaded by
  `v3.js` in every hub and by `<script>` on the dashboard and review page. Per-device counter in `sh_timmy_count`.
  On the About page (Part 7, behind spoilers; added in #60). No trophy.

- **2026-10-02 (MSK `nq-folate-case` explanation, Claude Code)** — Report #12: "is trouble concentrating not a neurologic
  symptom?" The stem lists trouble concentrating while the explanation said "without neurologic symptoms". Answer and
  stem unchanged; the explanation now says the concentrating trouble comes from the anemia (like the fatigue) and names
  the B12 signs that do separate it (numbness/tingling, lost vibration/position sense, gait: subacute combined
  degeneration). **MSK Project: carry this into the split sources.**

- **2026-10-02 (undo on ordering questions, Claude Code)** — From suggestion #3 (MSK). Ordering (sequence) cards gain
  **Undo last step** and **Start over** under the steps, shown once a step is tapped and hidden once graded (the last
  step is forced, so it still grades on the final tap). MSK: `data-act="seq-undo"/"seq-clear"` in
  `wireQuestionContainer`, `[data-role="seq-tools"]`; perio: `.qcard-seq-tools [data-seq-tool]`, which restores each
  step's text. About page entry added. **Perio and MSK Projects: carry this into the split sources.**

- **2026-10-02 (memory cues on missed questions, Claude Code)** — From a student suggestion ("when you miss a question, give
  a way to remember it"). A perio question can carry `cue:"..."`, a mnemonic or hook drawn inside the explanation as
  **Remember it:** (`cueHTML(q)`, `.qx-cue`), shown only after a miss: a wrong MCQ pick, a partly wrong select-all, a
  sequence or matching with a mistake, or "I missed it" on a recall card (`markMissed()` adds `.missed` to the
  explanation). Works in the bank, the daily drill and the mock's missed-question review, which all use `qCardHTML`.
  80 cues written for every perio item under 80% class accuracy with 8+ attempts (plus q5-01/q5-06). **MSK** too: its
  88 cues (items under 75%, 8+ attempts) live in one `QUESTION_CUES` map applied to `QUESTIONS` (its bank is built by
  `mcq()`/`seq()` calls); `finishCard()` adds `.is-missed`, and the submitted mock marks missed cards the same way.
  No reading text changed, so no narration regenerated. **Perio and MSK Projects: carry the cues, `cueHTML` and the
  CSS into the split sources. A new hub gets cues by rendering `q.cue` the same way.**

- **2026-10-02 (Timmy + trophy follow-ups, Claude Code)** — `migration_v32.sql` (**applied 2026-10-02 via the connector**):
  `get_trophy_stats()` (public: people per trophy out of everyone who has answered, same rules as `get_rank_profile`),
  shown as a % pill under each trophy in the trophy case and in its detail line; `record_achievement` accepts
  `pet-adopt` (hub = the adoption day), so **adopting Timmy follows you to your other devices** (`shPet.syncBadges`,
  called from the dashboard's `loadMyRank` and `widget/ranks.js`; existing adopters are backfilled once,
  `sh_pet_adopt_sent`). Closing his introduction any way but "No thanks" now adopts him (he could stay stuck on your
  name). **Secret tips**: a "Secret tip" button on his house, every 4th tap, and some hub greetings walk through how to
  find each egg (`TIPS` in `widget/pet.js`; the current holiday's word first). **House**: mastery pennants fly from a
  flagpole in the yard (were strung across the sky from nothing), the TIMMY nameplate is a plaque above the door,
  winter covers the whole yard in snow with a snowman, and **fall** (Sep 22 - Nov 30, `isFall()`) adds a tree with
  turning leaves (try `localStorage.sh_egg_holiday_test = "fall"`). **Full Arch fix**: the teeth after #16 drew below
  the chart (the pop animation's CSS transform replaced each tooth's flip); each tooth now sits in a positioned group.
  **About the hubs** (`about/index.html`, linked from an "About" button in the dashboard top bar and the footer): every
  feature, easter egg, holiday and trophy with how to find it. Easter-egg walkthroughs and secret trophy names sit behind a
  "Show spoilers" switch (`sh_about_spoilers`); trophy rates load live from `get_trophy_stats`. **When you add a feature,
  egg or trophy, add it to this page too.** On phones under 430 px the dashboard wordmark shows only its rings so the top
  bar fits on one line. `tools/ci/syntax.js` now checks `about/index.html`.

- **2026-10-01 (mastery flair, new eggs, Timmy Tooth, Claude Code)** — `migration_v31.sql` (**applied 2026-10-01 via the connector**):
  the leaderboards (`get_leaderboard`, `get_correct_streak_stats`, `get_arcade_leaderboard`, `get_rank_board`, `get_fairy_board`) gain a
  `flair` column ("perio:3,msk-exam3:1"; 1 bronze … 4 crown, from the mastery-* achievements via `sh_mastery_flair`), drawn as
  medals by `shRanks.flair()` next to names on every dashboard board, both hub arcade boards and the rank cards; a new mastery tier
  gets a toast. New eggs in `widget/eggs.js` (all announce a `sh:egg-local` event): **mirror** (type it; flips the in-flow body
  children, `.sh-mirror-flip`), **Full Arch** (a 32-tooth chart bottom-left; right answers add a tooth, misses knock one out;
  **once per hub**, `sh_egg_arch_done_<hub>`, and ranks.js retires it when the server badge `fullarch:<hub>` exists),
  **Floss Chain** (3+ people type floss in the same hub within 60 s, over the presence `egg` broadcast), **Cavity Search**
  (weekly, one paragraph of each hub's Lecture Notes picked from `SH_EXPORT.sections` kind Notes; first 5 to tap it,
  `claim_cavity`/`get_cavity_week`, shown in the Stats egg board), **holidays** (Halloween, Thanksgiving, winter, New Year,
  Valentine's, Dentist's Day, St Patrick's, Easter: themed confetti via `window.shConfettiTheme`, a costumed Plaque Boss and a
  magic word each; Halloween runs all of October (Oct 1-31; the others keep their short windows); try one with `localStorage.sh_egg_holiday_test = "halloween"`). Magic words also work typed into the hub Search
  box (phones). 7 new secret trophies (24 total). **Timmy Tooth** (`widget/pet.js`, loaded by v3.js and the dashboard): an
  optional cartoon tooth (Settings → Timmy Tooth: Everywhere / Dashboard only / Off, `sh_pref_pet`). Before adoption he perches
  on your name; tapping opens the intro; afterwards he lives in his house card (`#petHome`) and in each hub's bottom-left corner
  (hidden during mock exams). HP comes from `get_pet_days` merged with the device tally `sh_pet_log` (heal per right answer +
  streak bonus, decay per missed day, half-speed healing after 0 until 50); ailments drawn by HP: plaque, stains + gingivitis,
  caries, periodontitis, fracture, bandage. `prefSet` in v3.js now fires `sh:pref`. **His house** (`houseSvg`) is decorated
  by what you earn (`UPGRADES`: one item per handpiece tier from `sh_rank_tier`; a pennant per mastered hub and a roof crown
  from `sh_rank_flair`, which ranks.js and the dashboard write and announce with `sh:rank`) and by the holiday calendar.

- **2026-10-01 (MSK `ex-mets` fix, Claude Code, #51)** — Report #11: the bone-metastasis EXCEPT question keyed
  "Colon", but the notes list colon as a source ("BLT with a Kosher Pickle, plus colon"). The exception is now "Brain"
  (same position); explanation updated. Earlier `question_choices` rows for it refer to "Colon". Report resolved with a
  reply. **MSK Project: carry this into the split sources.**

- **2026-10-01 (suture-diagram questions, Claude Code)** — 14 perio picture questions (`q2-D01`-`q2-D14`): a question
  with `img:'<SUTURE_DIAGRAMS key>'` draws that diagram above the stem (`figHTML()`, in the bank card and the mock exam;
  "Diagram" chip; bank type filter "Suture diagrams"; arcade games skip them). Labels that would give the answer away
  carry `class="sd-hint"` and are hidden inside `.qcard-figure` (still shown in Review). `SUTURE_DEFS` (gradients) is
  now added to the page once in `boot()`. Bank 343 → 357. **Perio Project: carry these into the split sources.**

- **2026-10-01 (suture diagrams, Claude Code)** — Perio Review → Incisions, Flaps & Sutures gains **Suture diagrams**:
  illustrated inline-SVG figures (`SUTURE_DIAGRAMS`, shared gradients in `SUTURE_DEFS`, fixed illustration colours on a
  light plate, captioned): simple loop and figure-of-eight as interdental cross-sections, sling and criss-cross as
  occlusal views, mattress sutures as surface + section, continuous/locking on a ridge, periosteal anchorage in
  section, plus monofilament vs braided, because 5 of 14 midterm check-ins said the exam showed suture
  pictures. Drawn for the hub, not from the slides; Sam reviewed them before merge. **Perio Project: carry these into
  the split sources.**

- **2026-10-01 (fourth lessons refresh: exam formats, midterm settings out, Claude Code)** — From the perio midterm
  check-ins (n = 14): the exam used two-statement and "all EXCEPT / NOT" questions, suture pictures and staging details
  the class charts left out. **Perio**: 20 two-statement items (`fmt:'2stmt'`, `q1-S01`-`q4-S04`; choices always in
  the fixed order both true / both false / 1 true 2 false / 1 false 2 true, via `choiceOrder()` in the card and the
  mock exam; arcade games skip them) and 21 EXCEPT/NOT items (`fmt:'except'`, `q1-E01`-`q4-E06`, plus `q1-A02`); a
  **"Staging and grading: the full 2018 AAP/EFP tables"** review table (`AAP_STAGING`, `AAP_GRADING`) and 12 items with
  the new source `aap` ("2018 AAP/EFP tables", `q1-A01`-`q1-A08`, `q1-S06`-`q1-S09`); bank type filter gains
  "Two-statement" and "EXCEPT / NOT"; `.qcard-stem` keeps line breaks (`white-space:pre-line`). Bank 296 → 343.
  **Midterm-only settings removed** (Sam: the final is cumulative): "Not on midterm" chips, the bank's Midterm-scope
  option, the mock exam's scope toggle (always all 9 sessions), the Course Home midterm card/stat/milestone, the
  notes nav "Midterm" divider, arcade "Midterm · S1-4" scopes, the drill's midterm scope and the ribbon's midterm
  countdown; `MIDTERM_INFO` deleted. Kept: `MIDTERM_DATE` (SH_EXPORT exams, dashboard check-ins), the `mid:false`
  fields (now unused) and the notes' "(not on the midterm)" headings, which are narrated reading text (edit them only
  with new narration). Explanations: perio `q3-M01` (plaque index), `q4-M05` (motile bacteria); MSK `h-tu-mdm2`,
  `h-nut-vitA-epith`, `h-tu-gct-demo`, `h-tu-match`. **MSK**: 15 EXCEPT/NOT items (`ex-*`), bank 287 → 302. No reading
  text changed, so no narration regenerated. **Perio and MSK Projects: carry these into the split sources.**

- **2026-10-01 (recaps no longer time out + Perio Midterm recap, Claude Code)** — `get_hub_recap` timed out for perio
  (the API stops anon calls at 3 s): it counted each person's answers and days by re-scanning all pings/answers once per
  person, and ran the slow `anon_name()` (~15 ms) for all 118 people when the recap names 3. `migration_v30.sql` (applied
  via the connector) aggregates once and names only the people shown: same output, perio ~1.6 s, MSK 1.1 s. **Perio
  Midterm** recap published (`tools/publish-recap.js perio --exam 2026-10-01 --title "Perio Midterm"`, names on,
  featured question limited to midterm scope by passing a bank without `mid:false` items). `hub_recaps` holds one recap
  per hub, so publishing the perio final's recap will replace this one.

- **2026-10-01 (exam check-ins save on exam day, Claude Code, #46)** — `submit_exam_debrief` refused any exam dated
  today, but the dashboard opens check-ins on exam day (button from 8 am, perio midterm pop-up from 10 am), so the 2
  perio midterm check-ins sent that morning were dropped (answers not recoverable; the request logs hold no bodies).
  `migration_v29.sql` (applied via the connector) accepts exam day, never a future date. The dashboard's check-in
  pop-up now waits for the save and says "That didn't save" instead of always thanking.

- **2026-10-01 (nuke stays local on exam day, Claude Code)** — On the day of any of a hub's exams
  (`SH_EXPORT.exams`, local date), a tactical nuke plays only for the person who launched it: `launchNuke` in
  `widget/v3.js` skips the `nuke` broadcast and the receiver ignores one too (`isExamDay()`), so stale clients can't
  interrupt classmates either. The launch is still recorded (`record_nuke_launch`). No schema change.

- **2026-10-01 (select-all picks + shorter select-alls, Claude Code)** — **Select-all questions now record which options
  were ticked**: perio's `recordAnswer` passes the ticked indexes (practice and mock exam) as `detail.picks`, and
  `widget/v3.js` sends them in one call to `record_choices` (`migration_v28.sql`, applied via the connector), one
  `question_choices` row per option. For a multi item a row's `picks` = times that option was ticked (none before
  today). Perio's `SH_EXPORT` questions carry `correct` for multi items; `review/` shows a select-all's key and its
  most-ticked wrong option; `tools/lessons-join.py` lists ticks per option (+ key, - wrong). **Any hub with select-alls:
  pass the ticked array as the 4th argument of its answer call.** The three 7-option select-alls are now 5 options with
  3 correct (standing lesson): perio `q3-M01` (UniFe), `q2-P01` (augmentation flap), `q1-M03` (Phase I); ids kept, so
  their `question_stats` mix both versions from today. `sw.js` → `sh-v10`. **Perio Project: carry these into the split
  sources.**

- **2026-10-01 (third lessons refresh, Claude Code)** — Midterm-morning refresh. Perio `q3-P02` (report #10): the Patient
  Box now lists the radiographs ("Deep, narrow vertical bone defects on those teeth", as the notes describe the case) and
  the explanation walks stage, extent and grade from the box. Explanations now name the tempting wrong option on perio
  `q4-L11` (tooth extruding after losing its antagonist), `q1-M02`, `q4-M05`, `q2-P01` (split-thickness) and MSK
  `h-ai-mikulicz` (sicca), `qz-rickets` (unmineralized osteoid goes up). No reading text changed, so no narration
  regenerated. `LESSONS.md` refreshed. **Perio and MSK Projects: carry these into the split sources.**

- **2026-10-01 (lessons-audit skill, Claude Code)** — `/lessons-audit` (`.claude/skills/lessons-audit/SKILL.md`) runs the
  lessons refresh on demand in a Claude Code session: all data plus "since last time", a check of whether the last
  refresh's fixes worked, reading every hard question, safe explanation edits, `LESSONS.md`, a draft PR and draft replies
  to reports. Helpers: `tools/dump-banks.js <dir>` (each live hub's QUESTIONS/LECTURES as JSON, the CI lint's hook) and
  `tools/lessons-join.py` (accuracy by lecture/type/source and the hardest items with their favourite wrong answer).
  The audit also reads **check-ins against each person's study time**, and when a hub's last exam has passed it writes
  that hub's full retrospective and **publishes its recap to the dashboard** without asking (Sam, 2026-10-01) via
  `tools/publish-recap.js <hub> --bank <file> [--dry-run]` (same snapshot as `review/` → Recap; needs `SB_KEY` +
  `ADMIN_SECRET`; exam date from `index.html`, since `get_hub_recap` can time out without one). **CI lint**: a matching
  item that repeats an answer now fails (`SAME_ANSWER_OK` lists perio `q4-L27`, which perio grades by text), and 6+
  step orderings / 7+ option select-alls are listed as a heads-up. No site change.

- **2026-09-30 (bronze without patina, Claude Code)** — The green patina specks are gone from the Bronze handpiece
  medallion too (`filters()` in `widget/ranks.js`); Sam found them ugly. Accent tiles were already clean.

- **2026-09-30 (accent textures fixed + Stone/Antique, Claude Code)** — The metal accents are now **pre-rendered PNGs**
  (`assets/tex/<key>.png`, made by `tools/make-accent-tex.js` from `shRanks.accentSvg()`; bump `TEX_V` in
  `widget/ranks.js` when you regenerate): the SVG-filter data URIs didn't show up for students (Safari/phones). Bronze
  lost its green patina specks; new **Stone** (everyone) and **Antique** accents with quieter grain than the medallions.
  The texture also covers the ribbon's exam countdown pill, and the **dashboard** now applies the accent to its primary
  buttons (it never applied it before).

- **2026-09-30 (luck moves to the dashboard + metal accents, Claude Code)** — The hubs' exam "luck wall" pop-up
  (`widget/eggs.js`) is gone (#35: it got in the way of last-minute studying). The dashboard's next-exam card now has a
  **Send luck** row the day before and the morning (before 2 pm) of the exam: one per person per exam, with the class
  count and the latest names (`exam_luck`, `get_exam_luck`, `send_exam_luck`; `migration_v27.sql`, applied via the
  connector). **Unlocked accents are now metals**: `widget/ranks.js` `accentTex(key)` draws the medallions' own
  gradient + texture filter on a stretchable SVG tile, and `applyAccent` sets `data-sh-accent` and `--sh-tex` on
  `<html>`; `widget/v3.css` paints it on primary buttons, switches, multi-answer boxes, untagged progress bars and the
  drill badge (text/borders keep the flat `--accent`). Settings swatches (hub widget and dashboard) show the metal.
  **A new hub gets the textures if its primary buttons use `.btn.primary` / `.qs-btn.primary` and its bars `.bar i`.**

- **2026-09-30 (second lessons refresh, Claude Code)** — `LESSONS.md` refreshed with all data to date (last refresh's
  fixes checked: `q2-03` 30% → 61%, `q4-L27` 20% → 44%, perio under-5-minute visits 40% → 17% on midterm eve). New
  standing lesson: ordering questions over 4-5 steps and select-all questions with many options barely work.
  Explanations now name the favourite wrong answer on MSK `h-dr-hypoCa` (hyporeflexia), `h-tu-gct-arthritis`
  (osteochondroma), `h-ai-sle-ab` (anti-Ro/La) and perio `q3-M01` (UniFe inputs). No reading text changed, so no
  narration regenerated. **Perio and MSK Projects: carry these into the split sources.**

- **2026-09-29 (first lessons refresh, Claude Code)** — `LESSONS.md` refreshed from all data since 09-25 (Live signals
  written; new lessons on duplicate matching answers, explanations that name the favourite wrong answer, exam harder
  than hub + Patient Box questions). Perio: matching questions now grade by answer text in practice and mock
  (`q4-L27` listed "4-6 weeks" twice, so the other copy was marked wrong); `q2-03` and `q4-15` explanations cover the
  most-picked wrong answer. MSK: `sl-calcitriol` explanation covers cholecalciferol; a wrong ordering question now
  says "Not quite: k of n in the right spot". Perio Course Home gets a **quick-start row** at the very top (`.quick-start`:
  Practice questions (midterm scope until the midterm, with an untried count), Daily drill, Lecture notes), because
  23 of 58 visitors left within 5 minutes of landing there; clicks show as `practice=`, `sh-drill=quick`. Widget Search
  stays (Sam, 2026-09-29) though nobody has opened it yet. No reading text changed, so no narration regenerated.
  **Perio and MSK Projects: carry these into the split sources, or the next single-file build reverts them.**

- **2026-09-30 (one inbox, Claude Code)** — The Inbox is now the same on every hub and the dashboard: notices are no
  longer filtered by hub (`site_notices.hub` only labels which hub a notice is about), and pop-ups go out on whichever
  page someone opens first. Read state was already shared (server for replies, `sh_notice_seen` for notices).
  An **Inbox button now sits in each hub's top bar** beside the name (`.sh-ribbon-inbox`, added by `widget/v3.js`
  before `#themeBtn`), so it's reachable from every page. **Text size fix:** the size setting zooms `<html>`, and
  `vh`/`vw` inside a zoomed page overshoot the screen, so the inbox now sizes inside its fixed `inset:0` layer and the
  pop-up measures the real viewport (`fitViewport`); only the pop-up's message scrolls, so its buttons stay visible.
  `sw.js` → `sh-v9`. **Any new fixed overlay: don't size it with `vh`/`vw`.**

- **2026-09-29 (student inbox, Claude Code)** — Replies to your reports/suggestions (90 days) and notices to everyone
  (60 days) now stay in an **Inbox**: an item in the hub widget menu (unread count; a dot on the desktop launcher and the
  phone More tab) and an inbox button in the dashboard top bar (`[data-sh-inbox]` opens it, `.sh-inbox-badge` shows
  unread). Opening it marks everything read. The one-time pop-up moved from top-center to the **bottom-right** (above
  the phone bar). `get_my_inbox` (`migration_v26.sql`, applied via the connector). Admin Inbox: "Tell everyone" now has
  its own title + message box, started from the reply so it can be reworded for the class. `sw.js` → `sh-v8`.

- **2026-09-29 (replies to reports + notices to everyone, Claude Code, #29)** — Reports and suggestions now store the
  sender's `visitor_id`, and resolving one can carry a `reply`. `widget/replies.js` (loaded by v3.js and the dashboard)
  shows it to the sender once on their next visit (`get_my_replies`, `mark_reply_seen`). **Always write the reply when
  resolving** (for a question report: what was wrong and what changed). Admin Inbox: reply box, "Resolve & notify", and
  "Tell everyone", which posts a **notice** every visitor sees once (`site_notices`, `get_notices`, `admin_post_notice`;
  hub null = every page, 14 days; seen per device in `sh_notice_seen`). The student insert policies now refuse a
  reply/resolved row. Rows from before today have no sender, so only a notice reaches them. `migration_v25.sql` (applied
  via the connector). First notice: the `cw-osteosarcoma` fix (report #7; its stem now says "Malignant", Osteoma →
  Ewing sarcoma). `sw.js` → `sh-v7`. **MSK Project: carry the `cw-osteosarcoma` change into the split sources.**

- **2026-09-29 (daily lessons refresh, Claude Code)** — New routine "Daily lessons refresh" (fresh cloud session
  each day) runs `tools/lessons-refresh.md`: queries in `tools/lessons-daily.sql` (every report, suggestion, check-in,
  survey answer and zero-result search since the last run, use per hub, hardest/easiest questions, popular wrong
  answers, mocks, drill), rewrites `LESSONS.md`'s new "Live signals" section and "Last refreshed" date, and opens a
  draft PR with small data-backed fixes to live hubs (bigger ideas go to Sam in the PR). New hubs: refresh first if
  the date isn't today. No site change by itself.

- **2026-09-29 (automatic archiving, Claude Code)** — The dashboard (`index.html`) archives a hub by itself at 10 pm on
  the day of its last exam (`ARCHIVE_HOUR`) and removes the archived card 10 days later (`CARD_DAYS`; `hideCardOn`
  overrides; GI Exam 2's goes 2026-10-06). "Check in" buttons show from 8 am on exam day (`CHECKIN_HOUR`); the pop-up
  goes out from 10 pm, or an exam's `promptHour` (perio midterm: 10 am), and still reaches first visits up to
  `DEBRIEF_DAYS` (60) after. `widget/v3.js` shows an "This hub is archived" notice once per visit on a hub page opened
  after that time (from `SH_EXPORT.exams`). Retrospective and removing the hub folder are still manual.

- **2026-09-29 (MSK exam review set, Claude Code)** — The 23 PollEv exam-review questions (Sam: the professor said six
  are verbatim on Exam 3 and the rest very similar) added to `hubs/msk-exam3` as `rv-*` with a new source `review`
  ("Exam review (PollEv)"), stems/choices as given (typos fixed only). Question Bank has an "Exam review set" callout
  with a one-tap filter; the Daily Drill counts them as high-yield (`DRILL_HY.review`). They overlap older `sl-*` Slido
  items on purpose (the wording matters). Bank 264 → 287. No reading text changed, so no narration regenerated.
  **MSK Project: carry these into the split sources, or the next single-file build drops them.**

- **2026-09-29 (Anki deck vetting, Claude Code)** — Vetted the class Anki decks (Drive: 7 "MSK & GI Exam 3" decks + last
  year's Exam 3 practice deck; the D2 Perio Midterm and Practice Questions decks) card by card against each bank and the
  lecture notes; only real gaps were added, nothing imported wholesale. MSK +5 (`h-jt-oa-case`, `h-nut-vitA-epith`,
  `h-nut-iron-us`, `h-ai-sjogren-lymph`, `h-dr-teri-limit`), perio +2 (`q1-31` Stage 3 vs 4, `q1-32` grading vs staging).
  PerioChip corrected from 1.5 mg to **2.5 mg** chlorhexidine (review table, `q8-11`, arcade clue). The D2 Perio Final
  Exam deck (S5-S9) is on hold until those sessions are taught. No reading text changed, so no narration regenerated.
  **MSK and Perio Projects: carry these into the split sources, or the next single-file build reverts them.**

- **2026-09-29 (retrospectives + new tracking, Claude Code)** — New standing rule: archiving a hub includes a
  retrospective from all its data; `LESSONS.md` (standing lessons + a GI Exam 2 retro written from its data) and
  `tools/retro.sql` (the queries). Two new data sources (`migration_v23.sql`, applied via the connector):
  **exam check-ins** (how ready they felt, how it went, hub vs exam, what the hub missed, with a line saying answers
  go to the AI that builds the hubs), stored in `exam_debriefs` via `submit_exam_debrief`. Pop-up once on a person's
  first dashboard visit after an exam they studied for, however late (`sh_debrief_<hub>_<date>` = shown; replaces that
  visit's survey). Every hub card with an exam in the last 60 days (`DEBRIEF_DAYS`) has a **Check in** button, and
  people can send several (up to 10 per exam, `migration_v24.sql`, applied). **Archived hubs** now go into
  `ARCHIVED_HUBS` in `index.html` (move the `HUBS` entry, keep `exams` + `stateKey`): a greyed "Archived" card with
  the check-in button, shown for 60 days after its last exam. GI Exam 2 is the first one. **Search terms** — the widget's Search sends the term (lowercased, 3-60 chars, 1.5 s
  after typing stops, once per term per page load) and its result count to `record_search` → `search_terms`.
  Admin page Surveys tab shows both (`get_exam_debriefs`, `get_search_terms`, admin only).
- **2026-09-29 (perio: ordering-question feedback + q4-49, Claude Code)** — From student report #6. Finished sequence
  questions never showed right/wrong: `.qcard-seq-steps .qcard-choice[data-picked]` out-ranked the `data-state` colours.
  Now the steps re-sort into the tapped order, turn green/red, wrong ones say "Belongs in step N", and a verdict line
  ("Correct" / "Not quite: k of n in the right spot") sits under them. `q4-49` (a trivial 4-step disclosing-tablet order)
  is now an MCQ on why the rinse is brief (same id, so its old `question_stats` rows were a sequence). **Perio Project:
  carry both into the split sources, or the next single-file build reverts them.**
- **2026-09-29 (MSK mock exam blueprint, Claude Code, #21)** — `MOCK_BLUEPRINT` in `hubs/msk-exam3` now uses the official
  Exam 3 question counts per lecture: L19 4, L20 4, L21 6, L22 4, L23 4, L24 5, L25 4, L26 5, L27 4 (40). Intro text updated.
  **MSK Project: carry this into the split sources, or the next single-file build reverts it.**
- **2026-09-29 (answer choices that gave the answer away, Claude Code)** — From a student report on perio `q2-02` (wrong
  choices were labeled "(… monofilament)" while the stem asked for the braided suture). Audited all 499 MCQ/multi items in
  both hubs for the same kind of giveaway: labels on choices that rule themselves out, stem wording echoed only by the
  answer, and wrong choices nobody would pick. Fixed 16 perio items (`q1-12`, `q1-14`, `q1-19` (stem reworded), `q1-27`,
  `q2-02`, `q2-21`, `q2-22`, `q7-01`, `q7-04`, `q7-06`, `q7-09`, `q8-01`, `q8-07`, `q8-10`, `q9-02`, `q9-04`) and 8 MSK
  items (`dq-ckd`, `h-jt-gout-chronic`, `h-ca-stickler`, `h-bo-oi-ar`, `h-bd-ccd`, `h-tu-alveolar`, `h-he-paget-tx`,
  `h-jt-reactive-time`). Where a label was removed, the explanation now says it instead. Answer positions are unchanged;
  `question_choices` rows recorded before today for these ids refer to the old wording. **Perio and MSK Projects: carry
  these into the split sources, or the next single-file build reverts them.**
- **2026-09-28 (Daily Drill, Claude Code)** — From a survey answer ("a daily drill of questions I missed + high-yield so
  they stay fresh"); the old "Due today" list in Weak Spots had 1 click per hub. `widget/drill.js` (loaded by v3.js) picks
  10 questions a day per hub, frozen for the day in `sh_drill_<hub>`: spaced-review items due (`sh_srs_<hub>`, up to 6),
  older misses (latest try wrong, up to 8 with those), then high-yield ones from lectures you've studied (lowest class
  accuracy in `question_stats` with 5+ attempts, plus the hub's own flag), max 3 per lecture; shortfalls filled from the
  rest. **Spaced review gaps shortened** (hubs are live ~a week before the exam): right answers come back after 1, 2, 4,
  then 7 days (was 1/3/7/14/30), never later than the day before the hub's next exam (`SH_EXPORT.exams`), and only the
  first right answer of a day moves a question along (`t` = last day); a one-time pass (`sh_srs_<hub>_v` = 2) pulls in
  reviews scheduled under the old gaps. One question at a time in a full-screen sheet with a reason tag ("You missed this last time", "High-yield: the class
  gets this right 41%..."), a done screen with results, **10 more**, and a drill streak (`sh_drill_days`, any hub). Hubs
  provide `window.SH_DRILL = { pool(), render(el, qid), scope }` (just before `SH_EXPORT`); answers go through the hub's own
  handler, so class stats, SRS, XP and Weak Spots update as usual. Entry points: a Drill tab in the phone bar (badge = due
  count or progress), a desktop chip beside the launcher (hidden once done), `[data-sh-drill]` buttons (perio Course Home
  and both Weak Spots tabs, where it replaces "Due today"), and `hubs/<id>/#drill`, which the dashboard's new drill row on
  each hub card and the hero's "Daily drill" button link to. Time in it logs as `drill/daily`. Perio stays in midterm scope
  until Oct 1 and flags `exam-review` questions; MSK flags `quiz`/`lecture-quiz`/`slido`. Perio's `markExplain` now reveals
  the answered card's own explanation (the same question can be on screen twice). `sw.js` → `sh-v6`. No schema change.
  **A new hub gets the drill by defining `SH_DRILL`. Perio and MSK Projects: carry the `SH_DRILL` block, the Daily drill
  buttons, the `bolt` icon (MSK) and `explainOf` (perio) into the split sources, or the next single-file build drops them.**
- **2026-09-28 (perio: two student reports fixed, Claude Code, #15)** — Self-graded cards (recall questions via
  `qCardHTML`, and Active Recall) now keep the tapped grade button highlighted (`data-picked`, `--good-soft`/`--bad-soft`),
  dim the other and add a "Saved as right / missed" note (`markGraded()`). The grade was always saved, but the buttons
  looked unchanged, so it read as broken (report #3). `q3-47`'s explanation now states the 10% "resistant" figure and
  separates it from the slide's 10-15% / 20-25% numbers; unused choice "About 35%" → "About 25%" (report #4). Both reports
  marked resolved. **Perio Project: carry these into the split sources, or the next single-file build reverts them.**
- **2026-09-28 (hub recap slideshow, Claude Code)** — Published recaps play on the dashboard in a **Hub recaps** section
  (after Hubs; hidden until one is published): image on the left, title/summary, prev/next, Save image, and a list whose
  active item's bar times the 8 s autoplay (pauses on hover/focus/hidden tab; swipe and arrow keys; slide + fade
  transition, opacity-only under reduced motion). The Recap tab's **Publish to dashboard** stores a snapshot
  (`shRecap.snapshot`: only the fields `draw()` reads, names dropped when unticked) via `admin_publish_recap`;
  `admin_unpublish_recap` removes it; the dashboard reads `get_published_recaps()` (public) and draws each with the same
  renderer, lazily loading it plus Fraunces/Work Sans only when there's something to show. `migration_v22.sql` (table
  `hub_recaps`, applied via the connector). **`review/recap.js` moved to `widget/recap.js`.** GI Exam 2 published
  2026-09-28 (names on).
- **2026-09-28 (recap awards + saved mock scores, Claude Code)** — The Recap image gains an **Awards** panel: Question
  machine (most answers), Unbreakable (longest correct streak), Bookworm (most time in lecture notes: sections ending in
  `notes`/`lecture-notes`), Arcade champion (most time in `arcade/*`) and Mock exam ace (best score on a 20+ question mock,
  up to the exam day). Each only shows when the data exists; the image height grows with the number of awards
  (~1,970 px with all five). New `mock_scores` table + public `record_mock_score` (validated, one per person per hub per
  minute), called from `widget/ranks.js` on `sh:mock-done`, so mock scores are saved from 2026-09-28 on (none before).
  `migration_v21.sql` (applied via the connector) also replaces `get_hub_recap` to return `awards` and `mocks_taken`.
- **2026-09-26 (hub recap, dashboard rank + settings, Claude Code)** — **Recap tab** on `review/`: pick a hub (live or
  archived) and it draws a 1080x1640 shareable image (`review/recap.js`, canvas; Download PNG, or Share on phones) with
  hours studied, classmates, answers, class accuracy, hours per day up to the exam, the day before the exam, peak hour,
  people studying after midnight, regulars (3+ days), the hardest multiple-choice question with its answer, and a hall of
  fame (most answers, longest correct streak). Data from `get_hub_recap(p_secret, p_hub, p_exam)` (`migration_v20.sql`,
  admin-gated via `sh_admin_ok`, applied via the connector). Pings before 2026-09-25 count only the first 3 h of each
  visit (no idle rule back then). Question text: `ARCHIVE_BANK` → `question-banks/*.json` for archived hubs, `SH_EXPORT`
  for live ones. **Dashboard**: a "your rank" card under the greeting (handpiece, XP, animated bar to the next level,
  `get_rank_profile`); a Settings sheet (gear in the top bar) that edits the same localStorage keys as the hub widget's
  Settings (theme, font, size, accent, music, surprises, nuke alerts; font/size also apply on the dashboard). "Add exams
  to my calendar" removed (everyone has them already). `widget/ranks.js` exposes `ACCENTS` and re-applies the chosen
  accent once the rank loads.
- **2026-09-26 (easier name change, Claude Code)** — The hub top-bar name badge now always shows (your custom name, or
  the random class name like "Gleaming Molar") with a pencil; tapping it opens a small editor (`window.shEditName()` in
  `widget/v3.js`) that explains where the name shows, saves on Enter, and offers "Go back to a random name"
  (`clear_display_name`, `migration_v19.sql`, applied via the connector). The rank card in Stats has a "Shown as NAME ·
  change" link and the dashboard greeting a "Pick your name / Change name" button. One save path (`saveName`/`resetName`)
  keeps the Settings and Stats name boxes in sync and fires `sh:name`. Before this only 1 of 77 visitors had set a name.
- **2026-09-26 (home-screen icon, Claude Code)** — App icons are now the Gold handpiece medallion (rendered from
  `widget/ranks.js`) on a solid dark ground: `assets/apple-touch-icon.png` (180), `icon-192/512.png`, `icon-maskable-512.png`
  (extra safe-zone margin), `favicon-32/64.png`. All opaque; the old ones had transparent corners, and iPhones were
  showing a generic "S" tile. Every page links them with `?v=2` (bump it when the art changes, phones cache icons hard) and
  sets `apple-mobile-web-app-title` = "Study Hubs". `assets/icon.svg` (the old bars) is no longer linked.
- **2026-09-25 (nuke countdown key fix, Claude Code, #5)** — `runNukeCountdownKeyCanvas` in `widget/v3.js` now keys each
  frame against its own background (sampled at the crop's four corners; falls back to the fixed green if they disagree)
  instead of one fixed green. The countdown clip whites out on its own from ~12.25 s, so the fixed key left a pale green
  square around the icon until the 13 s blast; now the icon swells into a soft white disc as the clip whitens. Timing
  and `nuke-countdown.mp3` unchanged (its build-up peaks ~12-12.5 s, which is why the blast stays at 13 s).
- **2026-09-26 (perio: midterm format, Perio Project/Cowork)** — From Dr. Abou-Arraj's midterm email (Oct 1,
  10:00 am, rooms 220/222, ~40 questions: mostly MCQ, a few Patient Box cases, a few multiple-answer with
  partial credit, matching, no essays). `hubs/perio` gains a `pbox` question field (case table rendered
  above the stem) and a `multi` type (`correct:[...]`, Canvas-style partial credit: +1/n per right pick,
  −1/n per wrong pick, floor 0). 29 new items (13 Patient Box, 19 multiple-answer, some overlap). Mock Exam
  gets a 40-question exam-format option (5 Patient Box, 5 multi, 3 matching, rest MCQ, spread across
  sessions); matching is scored per pair; `sh:mock-done` counts full-credit items. Course Home has a
  "Midterm day" card. Arcade bank games skip `pbox` items. Three-way merged onto the 28 commits since
  6f97c09 (explanations, Report button, CLASS_ROW, choice tracking); CI smoke + lint pass locally.
  No reading text changed, so no narration was regenerated.

- **2026-09-25 (rank order + phone panel, Claude Code)** — Stone is now the first rank (0 XP) and Antique the second
  (300 XP): only the order of the first two `TIERS` entries in `widget/ranks.js` changed; server tier numbers are the same.
  Dashboard ranks panel fits phones (grid columns `minmax(0,1fr)`).
- **2026-09-25 (rank numerals, Claude Code)** — Every handpiece icon shows its level: large medallions get an engraved
  I/II/III plaque on the rim (replacing the pips), small ones a text tag in the corner (`shRanks.mini(tier, level)`,
  `.sh-rank-lv`), and the name badge appends the numeral. `migration_v18.sql` (applied via the connector) adds `level`
  to `get_leaderboard`, `get_correct_streak_stats` and `get_arcade_leaderboard`.
- **2026-09-25 (easter-egg clues, Claude Code)** — Hints for the hidden extras live in the trophy case: three new secret
  trophies (`konami` Cheat Code, `floss` Floss Boss, `prof` Office Hours; `migration_v17.sql` adds them to
  `record_achievement`'s whitelist, applied via the connector), every secret `TROPHIES` entry in `widget/ranks.js` has a
  `clue`, trophies are buttons (tap to read; a secret shows its clue), and a "Psst" line under the grid shows a random
  clue for a secret you haven't found. 17 trophies total. The Surprises setting points at the clues.
- **2026-09-25 (idle rule for study time, Claude Code)** — `widget/v3.js` activity tracking now stops banking time after
  15 minutes without input (pointerdown/keydown/wheel/touchstart/scroll/mousemove; `IDLE_MS`), unless
  `shTTS.listening()` is true (narration or browser TTS playing). Before this, any visible tab counted, so time from a hub
  left open on a desk inflated `activity_pings`. Minutes before 2026-09-25 were recorded under the old rule; compare trends
  across that date with care.
- **2026-09-25 (rank scale, nuke audio, card edge, Claude Code)** — **Ranks rescaled** (`migration_v16.sql`, applied via
  the connector): tier floors 0 / 300 / 1,500 / 5,000 / 12,000 / 25,000 / 50,000, each split into levels I-III
  (`sh_step`, `sh_step_floor`; Dark Matter I-III at 50k/75k/100k). v15's scale let a daily studier pass Dark Matter in
  ~5 weeks. `get_rank_profile` adds `level`/`step`/`step_at` (next_at is now the next level); `get_rank_board` adds
  `level`. The medallions show 1-3 pips on the rim; a level-up is a toast, a new tier keeps the full celebration.
  **Nuke countdown audio**: the countdown video's soundtrack only existed in its muted .mp4 (the .webm Chrome plays has
  no audio), so it's now `widget/sfx/nuke-countdown.mp3` (first 13 s of that track), played by `shNukeSfx` with the
  countdown and stopped at the blast. **Dashboard hub cards**: the colour stripe is now a full-card `::before` with
  `border-radius:inherit` painting only the left 7px, so it follows the card's corners.
- **2026-09-25 (handpiece ranks, trophies, link devices, Claude Code)** — `widget/ranks.js` (loaded by v3.js and the
  dashboard) draws seven tiers of handpiece medallions in inline SVG (Antique, Stone, Bronze, Silver, Gold, Diamond,
  Dark Matter; textures are SVG filters, the glint/sparkles animate only at large sizes) and mounts the rank card,
  per-hub mastery bar (Bronze 50 / Silver 75 / Gold 90 / Crown 100% of the bank right on the latest try), a 14-trophy
  case (6 secret ones read "???" until earned), unlockable accent colours in Settings (`sh_pref_accent`; injects
  `--accent/--accent-ink/--accent-soft` for light + dark) and **Link my devices** into the hub widget. XP is computed
  on the server from `personal_answers` (`sh_visitor_xp`, private): 10 first-time right, 2 repeat right, 1 miss, 600/day
  cap on answer XP, +20 per study day; tiers at 150/600/1500/3000/6000/12000 (`sh_tier`). Public RPCs:
  `get_rank_profile`, `get_rank_board`, `get_hub_mastery`, `record_achievement` (whitelisted kinds: boss, owl,
  rootcanal, mock90, mastery-*), `create_link_code`/`redeem_link_code` (6-char, 10 min, 10 tries/hour; redeeming moves
  the device's rows onto the code maker's id, `visitor_links` records it). `get_leaderboard`,
  `get_correct_streak_stats` and `get_arcade_leaderboard` gained a `tier` column (dropped + recreated). Hubs fire
  `sh:mock-done {correct,total}` when a mock is submitted. Dashboard: "Handpiece ranks" panel (top 10 + ladder) and tier
  icons on every board. `migration_v15.sql` **applied 2026-09-25 via the connector**. First dashboard survey
  ("Help shape the hubs") published live the same day.
- **2026-09-25 (Atlas retired; clicks + surveys, Claude Code)** — **Perio Atlas mode removed** at Sam's request (the
  diagrams were inaccurate; it had ~2 minutes of use from 5 people in two weeks). Removed from `hubs/perio/index.html`
  (tab, panel, `ATLAS_VIEWS`, `ATLAS_RENDERERS`, CSS) and the dashboard card. **Perio Project: drop Atlas from the split
  sources too, or the next single-file build brings it back.** Click analytics: `widget/clicks.js` (loaded by v3.js and
  the dashboard) batches clicks as `{section, target, count}` into `record_clicks` → `ui_clicks`/`ui_click_reach`;
  targets are named from `id`, the first `data-*` attribute (question-level ones skipped, numbers collapsed) or the
  label, and answer choices are grouped by class. Dashboard survey card: `get_active_survey`/`submit_survey`, one survey
  live at a time, shown once per visitor (answer or "No thanks" both count, plus `sh_survey_done_<id>` locally).
  Admin page gained **Clicks** and **Surveys** tabs (results, on/off, publish form). `migration_v14.sql` **applied
  2026-09-25 via the connector**; its admin functions call `sh_admin_ok()`, which copies the secret check from
  `get_nuke_summary` at migration time, so no secret is in the repo.
- **2026-09-25 (audit batch 2 + easter eggs, Claude Code)** — Widget: new launcher/menu (desktop) and a 3-item bottom
  bar with a "More" sheet (phones), redrawn icons, **full-content search** over each hub's `SH_EXPORT.sections` (notes
  paragraphs, review rows, hints, cram lines) that jumps to the spot via the hub's `window.SH_GOTO(go)`; a **Report**
  button on every question (`window.shOpenFlag(qid)`); `record_choice` stores which option was picked
  (`question_choices`, migration_v12, applied) and `review/` shows question text + the most-picked wrong answer (it
  reads each hub's `SH_EXPORT` through a hidden `?sh_export=1` iframe). Listen player: seek, ±15 s, speed, resume,
  lock-screen controls. Spaced review (`sh_srs_<hub>`, `window.shSrsDue()`) feeds a "due today" drill in both hubs'
  Weak Spots tab (new in MSK). Dashboard "Add exams to my calendar" (.ics). PWA: `manifest.webmanifest`, `sw.js`
  (network-first; bump `VERSION` when you change what it precaches), icons/OG images in `assets/`. 136 explanations
  added and distractors rebalanced in both banks. CI: `.github/workflows/check.yml`. `supabase/schema.sql` is a full
  schema snapshot (admin secret as a `<ADMIN_SECRET>` placeholder) — refresh it with every migration.
  **Easter eggs** live in `widget/eggs.js` (loaded by v3.js, which hands it `window.shEggHooks`): Golden Probe (one
  taught question per hub per Central-time day; `claim_golden_probe`/`get_golden_today`, shown on the dashboard),
  Tooth Fairy (`record_fairy`/`get_fairy_board`, board in the Stats panel) — both in `migration_v13.sql`, **applied
  2026-09-25 via the connector**; Plaque Boss (5+ online, shared HP over the `presence:<hub>` channel's `egg`
  broadcast), exam luck wall (evening before / morning of each date in `SH_EXPORT.exams`), professor quotes (tap a
  name 5x; `SH_EXPORT.lectures[].who` + `SH_EXPORT.hints`), Night Owl, Through the Root Canal, Konami 8-bit mode (phones: swipe ↑↑↓↓←→←→ then tap twice),
  "floss". Off via Settings → Surprises (`sh_pref_eggs`) and never during a mock exam (section matching `mock`). A new
  hub gets them for free if its `SH_EXPORT` carries `who`/`status` on lectures, `hints` and `exams`.
- **2026-09-25 (exam-week fixes, Claude Code)** — Dashboard `HUBS` entries now take `exams:[{name,label,date,code}]`
  (several per hub; perio has midterm + final) instead of `examDate`/`examName`; the hero lists every exam in the next
  14 days and has a real "no exams" state. Perio accuracy on the dashboard uses each question's latest try (perio's
  `totalCorrect` counts unique questions). supabase-js is **self-hosted and pinned** at
  `widget/vendor/supabase-2.117.2.js`, loaded with `defer` everywhere (no jsdelivr dependency); hubs call `boot()`
  directly instead of waiting for DOMContentLoaded, and the class-stats wiring runs on DOMContentLoaded. The widget no
  longer returns early without Supabase (search, settings, mind maps keep working) and exposes `window.shSupabase`,
  which the arcades reuse. Light/dark is one shared key, `sh_theme` (old per-page keys still read). Phones: mode tabs
  get their own labeled row in both hubs; MSK lecture chips wrap. Perio's class % now sits inside the explanation
  (hidden until answered). MSK mock exam is exam-style (pick all, submit, review; `STATE.mock.picks/order/submitted`).
  The dashboard no longer groups hubs by term (`TERMS` and each class's `term` field are gone); every class with a
  live hub shows in one grid, since old exams get archived.
- **2026-09-25** — Added `CLAUDE.md` (imports this file) so Claude Code sessions
  start with the repo rules; Claude Code deploys go through branches + PRs.
  Kokoro model re-hosted as release `kokoro-model-v1.0`. No site changes.
- **2026-09-25 (perio: midterm date + Session 4 lectured)** — Midterm set to **Thu Oct 1** (sessions 1-4):
  `MIDTERM_DATE = '2026-10-01'` in the perio hub (ribbon countdown, course home, course map) and
  `examDate:"2026-10-01"` on the dashboard's perio HUBS entry (it now leads the next-exam hero, a day
  before MSK Exam 3). Session 4 (Phase I) flipped from `preview` to `taught` from the class recording:
  both reading levels rewritten, 42 lecture questions (`q4-L01`-`q4-L42`), 17 verbatim exam hints, 6
  new review tables (Glickman furcations, CAL/Salud trap, tissue modifiers, prophy vs D4346 vs SRP vs
  maintenance vs debridement, healing timeline, radiograph reads + SRP limits), new cram sheet and mind
  map, 8 arcade terms and 3 Quadrants groups. Both `phase1-therapy` narration files regenerated.
  Midterm scope from Dr. Kaur's email (no instruments/ultrasonics/polishing; slides up to failure of
  therapy): 31 S4 questions carry `mid:false` (a "Not on midterm" chip; excluded from the midterm mock
  exam and from the new "Midterm scope" question-bank filter), and the matching notes sections, review
  tables, cram lines, mind-map branch and Atlas diagram are labeled.

- **2026-09-24 (perio revamp + Pocket Arcade)** — `hubs/perio/index.html` rebuilt (Perio Project) to
  match the revamped site: compact one-row ribbon (back, title, icon mode pills, countdown, progress,
  theme toggle), inline-SVG icon set (no emoji), Instrument Serif/Sans + IBM Plex Mono. Modes are now
  **Compendium · Review · Atlas · Arcade**; the Understory game + cutscenes were retired at Sam's
  request (replaced by the Arcade). Reference tables moved to a Review mode (data-driven `REF_SECTIONS`,
  search + hide-answers). New content: Session 4 (Phase I, Dr. Kaur slide deck, status `preview`) and
  the Session 3 in-class case review; bank 150 → 216. **Pocket Arcade**: nine new games (flappy,
  crusher, probe, quadrants, perdle, planer, smile, sweeper, cross) posting to `arcade_scores` with
  `p_hub='perio'`; `migration_v11.sql` (whitelists those ids) **was applied 2026-09-24 via the
  connector**. Bank-based games call `recordAnswer`, so they fire `perio:answered`. The state key and
  `answered/totalSeen/activeDates` shape are unchanged (dashboard `readProgress` still works); new
  `STATE.ui`/`STATE.arcade` sub-objects. The hub was then built from split sources in the Perio Project
  session (no longer: since 2026-11-03 the single file is the source; see "Perio: the single file is the source" above). Lecture Notes now have an **As taught / Plain English** toggle (`READINGS_PLAIN`, `STATE.ui.level`); each level has
  its own narration file, `audio/<id>-full.mp3` and `audio/<id>-plain.mp3` (all 9 plain files new; full regenerated for
  `phase1-therapy` and `risk-assessment`) — **edit either level's text and you must regenerate that file**. The Listen
  button is re-skinned with hub tokens in `hubs/perio` (the widget's `var(--card,#fff)` fallback made it white-on-white
  in dark mode; any hub without a `--card` token has the same issue). Dashboard: perio `HUBS` entry updated, and the arcade
  high-score panel is now data-driven by an `ARCADES` array (Bone Zone + Pocket Arcade, hub switcher).
- **2026-09-24** — msk-exam3: Listen button on Lecture Notes (shared `window.shTTS`, same
  markup as perio) plus Kokoro narration `hubs/msk-exam3/audio/<lec>-full.mp3` for all 9
  lectures (af_heart). **msk-exam3 now has pre-generated audio: any READINGS text edit must
  regenerate that lecture's mp3** (text-and-audio-must-not-drift rule).
- **2026-09-24 (later)** — msk-exam3: As Taught / Plain English toggle on Lecture Notes
  (`READINGS_PLAIN`, `STATE.ui.level`), each level with its own narration
  (`audio/<lec>-full.mp3`, `audio/<lec>-plain.mp3`). Edits to either text need that level's mp3 remade.
- **2026-09-23 (dashboard revamp)** — `index.html` rebuilt (hub index Project). Hub cards
  are now rendered from a `HUBS` array (+ `CLASSES`, `TERMS`) near the top of the script:
  **to add or archive a hub on the dashboard, edit that array, not markup.** Each entry's
  `examDate` drives the hero countdown and card "Exam in N days"; `stateKey` is the hub's own
  localStorage key, read-only, used to show personal progress (supports the msk-style
  `seen/totalAnswered/days` and perio-style `answered/totalSeen/activeDates` shapes; if a
  hub changes its state shape or key, update `readProgress()`). New: next-exam hero, personal
  14-day activity strip (`get_personal_stats` across live hubs), greeting via
  `sh_display_name`/`get_display_name`, light/dark/system toggle (`sh_dash_theme`), arcade
  high-score panel (`get_arcade_leaderboard`, hub `msk-exam3`), changelog as a timeline.
  Hub links now open in the same tab (hubs have their own back button). Fonts: Instrument
  Sans/Serif. Kept: presence count, busiest hours, streak boards, update-available prompt,
  changelog-driven "Updated" labels, class easter eggs, collapse state keys.
- **2026-09-23 (latest)** — msk-exam3: arcade grows to nine games (Clast Blaster shooter,
  Bone Search word search, Whack-a-Clast). `migration_v10.sql` updated in place to accept the
  new game ids (`blaster`, `search`, `whack`). **migration_v10 was applied to Supabase on
  2026-09-23 via the Supabase connector**; arcade leaderboards are live for all nine games.
- **2026-09-23 (later)** — msk-exam3: 40-question Mock Exam; emoji replaced by a
  hub-local inline-SVG icon set (`ICON_PATHS`/`icon()`); compact one-row
  ribbon; Arcade grew to six games (added Marrow Match, Bone to Pick, Fact or
  Fracture) with a fullscreen toggle and an easier Snake. **Class-wide arcade
  leaderboards** via `migration_v10.sql` (`arcade_scores` table,
  `submit_arcade_score`, `get_arcade_leaderboard`): run it once in the Supabase
  SQL editor. Until then the hub shows "leaderboard warming up" and keeps
  working. Other hubs can reuse the same two RPCs with their own `p_hub`.

- **2026-09-23** — Archived GI Exam 2 (`hubs/hepatobiliary/`, incl. its
  narration audio) off the live site after the exam, same pattern as GI
  Exam 1: the full 404-question bank + lecture list was saved first to
  `question-banks/gi2-question-bank.json` (hub's own field names; see
  `question-banks/README.md`, regenerate with `extract_gi2.js`). Dashboard
  card removed; `hepatobiliary` stays in `HUB_LABEL` so old changelog/stats
  rows still label correctly. **Widget time tracking is now per section:**
  `record_activity_ping`'s `p_section` is `"<mode>/<sub-view>"` (e.g.
  `compendium/bank`, `review/drugs`, `compendium/exam-hints`) instead of
  only the top-level mode. Mode detection accepts `aria-selected="true"` OR
  an `is-active`/`active` class (hepatobiliary only set the class, so all of
  its ~12k minutes had logged as `(unspecified)`); sub-view = first visible
  active element outside `#modeSwitch` carrying `data-view|sub|ctab|gtab|
  dtab|tab|group|section|pane|panel`. A hub can override with
  `window.SH_SECTION = () => "mode/sub"`. Time is banked per section each
  second and a ping only fires once a section has earned a full 25s, so
  switching mid-interval no longer credits the wrong section. No schema
  change. `review/` rebuilt as a tabbed admin (Overview / Time by section /
  Questions / Engagement / Inbox) with a 7/30/90-day range, an "include
  archived hubs" toggle (archived list is `ARCHIVED` in `review/index.html`
  — add a hub there when you archive it), and "active time per visit"
  (total ping minutes ÷ visits) replacing the old span-based average, which
  counted hours of backgrounded tabs.

- **2026-09-23** — New hub: `hubs/msk-exam3/` ("Musculoskeletal Exam 3 Hub", widget
  `data-hub="msk-exam3"`, event `msk3:answered`, localStorage `msk3-state-v1`),
  built from the GI 3 Claude Project (L19-L27; L26 drugs and L27 tumors are
  slides-only until their recordings are uploaded). Modes: Compendium, Review
  (grouped reference: drugs, hormones, cells, matrix, genes, diseases, tumors,
  processes, superlatives; with a recall/blur toggle), and an Arcade that
  REPLACES the illustrated-scene game pattern at Sam's request: three
  cool-math-games-style mini games (Sort Storm, Osteo Snake, Stack Attack).
  Osteo Snake answers go through the normal answered event, so they count in
  class stats. Hub source is built from split files (css/js) in that Project's
  session; the deployed `index.html` is the single-file build. Added the hub to
  the dashboard GI group, `HUB_LABEL`/`ALL_HUBS`, and `review/` `HUB_LABEL`.

- **2026-09-18** — Tactical nuke: raised the streak requirement from 50 to
  100 correct answers in a row, per request. Also replaced the generic
  "Someone has called in a tactical strike" banner with the visitor's
  actual resolved name — the same deterministic name (e.g. "Gleaming
  Molar") the leaderboard and nuke/streak analytics already fall back to
  when a visitor hasn't set a custom display name, instead of a generic
  placeholder word. Added `get_display_name(p_visitor)` (`migration_v9.sql`,
  public, no secret) so the client can resolve it once on load; degrades
  gracefully back to "Someone" if the RPC isn't reachable.

- **2026-09-18** — Wired up analytics that had been silently no-op-ing:
  `widget/v3.js` was already calling `record_nuke_launch` on every tactical-
  nuke strike (since the feature shipped 2026-09-17), but the backing
  Supabase table/function never existed, so every call failed silently and
  the review page showed nothing. `migration_v8.sql` adds `nuke_launches` +
  `record_nuke_launch`/`get_nuke_summary`/`get_nuke_by_hub`/`get_nuke_recent`,
  and a new "Tactical nuke" section on the review page (launches, unique
  launchers, by hub, recent activity). Also added persisted correct-answer
  streak tracking (`correct_streaks` table + `record_correct_streak`, called
  from the same answered-question handler as `record_answer` — separate from
  the in-page-only counter that gates the nuke badge, which still resets on
  reload by design) and `get_correct_streak_stats()` (public, no secret,
  same pattern as `get_leaderboard`) showing the longest streak currently
  still standing and the all-time record. Shown in two places per request:
  a "Correct-answer streaks" section on the review page, and a matching
  card on the public dashboard (`index.html`) next to Study Streaks.

- **2026-09-16** — Perio: Session 3 (Risk Assessment, Dr. Geisinger) ingested
  from its lecture recording transcript + slide deck — flipped from
  exam-review-guide-only to fully lectured (new reading, 2 reference tables,
  17 new lecture-sourced questions, rewritten cram-sheet entry and mind map).
  Session 2 (Incisions/Flaps/Sutures) enriched with a supplementary in-class
  Q&A transcript (sub-marginal incisions, flap-thickness-by-procedure,
  palatal graft harvesting) — 9 new questions, 1 new incision type, 1 new
  reference table, 3 new exam hints. Question bank grew from 124 to 150.
  Regenerated Kokoro narration (`audio/risk-assessment-full.mp3`,
  `audio/incisions-flaps-sutures-full.mp3`) to match, per the
  text-and-audio-must-not-drift rule above. Also fixed two pre-existing bugs
  surfaced by testing against the larger bank (neither introduced by this
  content work — both date from the earlier Game-mode/gameplay-progress-split
  change, and both are general fixes in the shared `qCardHTML`/
  `wireQuestionContainer` pattern, not perio-specific): `recordGameAnswer`
  never dispatched the event the cutscene-trigger listener watches for, so
  clearing a lecture by actually playing through Understory never played its
  reward cutscene; and `SEQ_STATE`/`MATCH_STATE` (sequence/match
  click-tracking) were keyed globally by question id instead of per-render,
  so a sequence or match question could only ever be completed once per page
  load, in whichever mode/view reached it first — re-encountering the same
  question in a second context (Question Bank, then a Game encounter)
  silently could never be completed there. Worth checking other hubs that
  share this rendering pattern for the same two issues.

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

Since 2026-11-03 the same fix covers knowledge, not just code: rules, decisions, hub notes and tasks live in
`vault/` as linked notes any agent can read and write back to (`vault/rules/repo-is-the-vault.md`).
