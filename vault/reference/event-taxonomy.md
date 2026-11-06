---
type: reference
tags: [analytics, supabase, widget]
---

# Event taxonomy: what the hubs record, and how it's named

Every analytics row the site writes, where it comes from, what one row means and how its names are built. Part of the
[analytics governance](analytics-governance.md) layer. The schema itself lives in `supabase/schema.sql` and the
`migration_v*.sql` files (code is the home of column lists); this note explains them. Who may see what is in
[learner-data-privacy](../rules/learner-data-privacy.md); how long rows are kept is in [analytics-retention](analytics-retention.md).

## Identity and time (read this first)

- **`visitor_id`**: a random UUID (36 characters) the widget makes on first visit and keeps in `localStorage`
  (`sh_visitor_id`, `getVisitorId()` in `widget/v3.js`), shared by every hub and the dashboard on the same browser. No
  account, email, IP or device detail is stored with it. **A "person" in every number is a browser**: a phone and a
  laptop are two people until "Link my devices" (`redeem_link_code`) moves the second id's rows onto the first and records
  the pair in `visitor_links` (18 links by 2026-11-04, out of 285 ids). Clearing site data makes a new id.
- **`visit_id`**: a random UUID per page load (`VISIT_ID` in `widget/v3.js`).
- **Display names** (`visitor_names`) are optional, chosen by the student, shown on leaderboards. Never join them to
  analytics in anything written down ([learner-data-privacy](../rules/learner-data-privacy.md)).
- **Timestamps** (`*_at`) are UTC `timestamptz`. **`day` columns are Central-time dates** (`America/Chicago`), written by
  the database. Convert `*_at` the same way before grouping by day.
- **One activity ping = 25 seconds of active time**: sent while the tab is visible and someone has touched it in the
  last 15 minutes (the idle rule, from 2026-09-25; Listen and Timmy Time keep it awake). Minutes = pings × 25 / 60.
- **Automated browsers send nothing** (`navigator.webdriver`: Playwright, Puppeteer) from 2026-10-15; before that, test
  runs against the live site inflated people and bounce counts.
- **Writes never fail loudly**: every `record_*` function swallows errors so a student never sees analytics break. The
  price is that broken tracking is silent; the "Tracking alive" check in [analytics-data-quality](analytics-data-quality.md)
  catches it.

## Tables

Grain = what one row is. "Visitor" = the row carries a `visitor_id` (pseudonymous, never leaves the database; see the
privacy rule). Written by = the RPC and the client file that calls it.

### Time and navigation

| Table | Grain | Visitor | Written by | Since | Notes |
|---|---|---|---|---|---|
| `activity_pings` | one 25 s ping: visitor, visit, hub, section | yes | `record_activity_ping`, `widget/v3.js` | 2026-09-12 | Raw, **kept 30 days** ([analytics-retention](analytics-retention.md)); read only for the last few minutes (Live) and the data-quality checks. `section` is `<mode>/<sub-view>` (below); `hepatobiliary` and `gi-exam1` sent none |
| `activity_hourly` | visitor × hub × section × hour, `n` pings | yes | trigger on `activity_pings` (v45) | 2026-09-12 (rebuilt from all pings in v45) | What the admin RPCs and `sh_insights()` read. The source of time for everything else since migration_v52 (recap, retro, lessons audit); a retention delete keeps it, an ordinary ping delete rebuilds it |
| `activity_visits` | one visit: first and last ping | yes | same trigger | same | Visit length for `get_visitor_summary` |
| `presence_hourly` | hub × hour of day, ping count | no | `record_presence_ping` | early | "Who's studying now" on the dashboard |
| `mode_stats` | hub × mode, opens | no | `record_mode_open` | early | All-time counter, no date: can't be split by period |
| `ui_clicks` | day × hub × section × target, `clicks` | no | `record_clicks`, `widget/clicks.js` | 2026-09-25 | Batched once a minute; max 80 targets a batch |
| `ui_click_reach` | day × hub × target × visitor | yes | same | 2026-09-25 | Distinct people per button per day; kept 90 days |
| `feature_events` | day × hub × kind × visitor, `n` summed | yes | `record_events`, `window.shTrack` in `widget/clicks.js` | 2026-10-20 | Kept 180 days, then collapsed into `feature_daily`. `hub` is a page: a hub id, `dashboard` or `about`. Kinds below |
| `feature_daily` | day × hub × kind: `people`, `n` | no | `sh_retention_run` (v52) | rows older than 180 days | `feature_events` after 180 days; `people` is the distinct ids that day |
| `search_terms` | day × hub × term, searches, last hit count | no | `record_search`, `widget/v3.js` | 2026-09-29 | The widget's Search only; terms trimmed to 3-60 characters, no visitor |

### Questions

| Table | Grain | Visitor | Written by | Since | Notes |
|---|---|---|---|---|---|
| `question_stats` | hub × qid, attempts and correct | no | `record_answer`, `widget/v3.js` on the hub's answered event | 2026-09-08 | Every try counts, retries included. Public read (class accuracy on each question) |
| `question_choices` | hub × qid × choice index, picks | no | `record_choice` / `record_choices` | v21-v28 | Index is the **authored** order (0 = the key), not the shuffled one. Select-alls one row per ticked option (perio from 10-01, Occlusion-engine hubs from 11-04) |
| `personal_answers` | one answer: visitor, hub, qid, correct, time | yes | `record_personal_answer` | 2026-09-08 | Feeds XP (`xp_seen`/`xp_days` triggers), progress sync, retries and spacing. Deleting rows lowers XP and ranks |
| `correct_streaks` | visitor, current and best run | yes | `record_correct_streak` | early | The streak flame and record |
| `mock_scores` | one finished mock: visitor, hub, correct, total | yes | `record_mock_score`, `widget/ranks.js` | 2026-09-28 | One a minute at most |
| `question_pins` | visitor × hub × qid, pinned, device time | yes | `set_pins`, `widget/v3.js` | 2026-11-02 (v46) | Sync, not analytics; `pin:add` events count use |
| `question_events` | one answer or one unanswered read: visitor, visit, hub, qid, version, context, which try, previous result and gap, choice, active ms before answering and on the explanation, taps in it | yes | `record_qh`, `widget/qhealth.js` (batched) | 2026-11-04 (v50) | Question health ([question-health](question-health.md)). A `view` row is a card read 3 s or more and left unanswered. Mock answers carry no timing |
| `question_feedback` | visitor × hub × qid: thumbs up/down and a fixed reason | yes | `qh_vote`, "Good question?" under the explanation | 2026-11-04 (v50) | One vote per person per question; reasons are a fixed list, never free text |
| `question_versions` | hub × qid × version fingerprint, type, choice count, key | no | `record_qh` | 2026-11-04 (v50) | An edited question gets a new version, so its numbers start fresh |
| `question_reviews` | hub × qid: Sam's call (ok, fix, fixed), the flags it covered, a note | no | `admin_review_question`, admin page | 2026-11-04 (v50) | Metadata only; never changes a question |

### Student voice

| Table | Grain | Visitor | Written by | Notes |
|---|---|---|---|---|
| `question_flags` | one report, free text | yes (from v25; removed 120 days after the reply) | Report button (widget) | Reply goes back to the sender ([reply-to-reports](../how-to/reply-to-reports.md)) |
| `hub_suggestions` | one suggestion, free text | yes (from v25; removed 120 days after the reply) | Suggest (widget) | Same |
| `exam_debriefs` | one check-in: hub, exam ('YYYY-MM-DD label'), answers json | yes (`anon-<row id>` after a year) | `submit_exam_debrief`, `index.html` | `answers`: `ready` 1-5, `went`, `match` (choices) and `missed` (free text), plus an exam's `extraQs`: a 1-5 rating (a number, or `"none"` from its "didn't use it" button), a choice (text) or a tick-any list (an array of the option texts); PCD Implants Exam 1 adds `pbox_better` (the new drawn cases vs the Patient Box questions students had before: 1 worse, 3 the same, 5 better), `diagrams`, `helped` and `changes` (2026-11-06). Up to 10 per person per exam, 90 days |
| `surveys` / `survey_responses` | survey; one response (null answers = "No thanks") | yes (answers lose it 90 days after the survey closes; "No thanks" rows go when it closes) | `submit_survey`, `index.html`, `widget/replies.js` | 169 of 190 responses by 11-04 were "No thanks" |
| `podcast_reactions` / `podcast_comments` / `podcast_comment_reports` | one like or dislike; one comment; one report | yes | `pod_react` / `pod_comment` / `pod_report_comment`, `widget/podcast.js` | Comments are public to the class under the poster's leaderboard name |

### Game layer and identity (not analytics, but they hold visitor ids)

`achievements`, `arcade_scores`, `egg_events`, `nuke_launches`, `nuke_unlocks`, `exam_luck`, `xp_seen`, `xp_days`,
`visitor_names`, `visitor_links`, `link_codes`, `link_attempts`. Read them for feature use (who plays, who earns what),
never for anything about a person. `link_attempts` are kept 7 days. Content and ops: `changelog`, `site_notices`, `hub_recaps`,
`retention_runs` (what each weekly retention run removed and the database size then, v52) (no visitor ids).

### The game layer's server (migration_v54, from the redesign's release; [game-server](game-server.md))

Not analytics either: the records that pay XP, keep what students own and run the idea board. Read them for totals over 5 or
more people, never for anything about a person.

| Table | Grain | Visitor | Written by | Notes |
|---|---|---|---|---|
| `question_keys` | hub × qid × version: kind, answer, counted, retired | no | `admin_load_question_keys` (`tools/xp/keys.js`) | The bank's keys, so the server grades answers |
| `answer_xp` | one v2 answer: its request id, context, mock or game session, kind, the result sent back | via `personal_answers` | `record_answer_v2` | One row per `personal_answers` row the new pages write; deleted with it |
| `xp_awards` | visitor × award key: source, hub, base and paid XP, time, Central day | yes | `record_answer_v2`, `xp_session_finish`, `pod_minute_v2`, `admin_resolve_report_v2` | The XP ledger. Sources: `answer`, `goal20`, `fix`, `mock`, `medal`, `pod-min`, `pod-done`, `arcade`, `report` |
| `xp_boosts` | visitor × boost: source (`medal`, `shop`), 2x, start and end | yes | medals, `buy_item` | Double XP |
| `xp_sessions` | one mock or arcade game: visitor, hub, game, start and finish | yes | `xp_session_start` / `xp_session_finish` | Lets a mock's answers arrive together, and times a game |
| `game_baseline` | visitor: XP and badges at the switch | yes | the migration, once | Why no medal or trophy from before the switch pays twice |
| `game_config` | one row: the switch time | no | the migration | |
| `podcast_episodes` | hub × episode: length in seconds | no | `admin_set_podcast_episode` | How many minutes an episode pays |
| `report_outcomes` | report or suggestion × outcome (`fixed`, `no-change`) | no (the report has it) | `admin_resolve_report_v2` | "Fixed" pays the sender +100 |
| `shop_items` | one item: kind, rarity, price, season, slot, HP or boost | no | the migration, `admin_upsert_shop_item` | The catalog |
| `pet_purchases` | one purchase: visitor, item, price, request id, Central day, HP | yes | `buy_item` | Spending, snacks' HP, boosts bought |
| `pet_inventory` / `pet_equipped` | visitor × item; visitor × slot | yes | `buy_item`, `equip_item` | What Timmy has, wears and where his things stand |
| `costume_log` | visitor × rare costume: first day seen | yes | `record_costume_sighting` | The "you" panel's costume log |
| `ideas` | one idea: visitor (none for starters), leaderboard name, title, body, hub, category, source, status, hidden | yes | `post_idea`, `admin_post_starter_idea` | **Public to the class under the poster's name** (no id is ever sent back). `source`: `board`, `suggest`, `checkin`, `starter` |
| `idea_votes` / `idea_reports` / `idea_notes` | visitor × idea: up or down; a report; a status note for the Inbox | yes | `vote_idea`, `report_idea`, `admin_set_idea` | Three reports hide an idea |

## Naming conventions

### Sections (`activity_pings.section`, `ui_clicks.section`)

`<mode>/<sub-view>`, read by the widget from the hub's `#modeSwitch [data-mode]` and its active sub-view. Hubs name the same
view differently (`compendium/bank` and `compendium/question-bank`; `compendium/notes` and `compendium/lecture-notes`;
`compendium/mock` and `compendium/mock-exam`), so **cross-hub numbers go through `sh_surface(section)`**
(`migration_v49.sql`, the one home of the mapping), which returns one of: `notes`, `bank`, `mock`, `cram`, `hints`,
`weak-spots`, `recall`, `home` (incl. perio's `compendium/course-info`), `review`, `drill`, `arcade`, `podcast`, `retired`
(Atlas), `other`, `unknown` (no section). A new mode or sub-view either uses an existing name or gets a line in
`sh_surface()` in its own migration; the data-quality check lists sections it can't place. **New hubs: use the names
`home`, `compendium/notes`, `compendium/bank`, `compendium/mock`, `compendium/hints`, `compendium/cram`,
`compendium/weak`, `review/<group>`, `arcade/<game>`, `drill/daily`, `podcast/<episode>`.**

### Click targets (`ui_clicks.target`)

Built by `nameOf()` in `widget/clicks.js`, in this order: `#<id>` (ids with 3+ digits skipped); the first `data-*`
attribute as `<name>=<value>` (numbers and question-like ids collapsed to `#`; per-question attributes such as
`data-qid` skipped, so answer choices never log one by one); a choice-like class as `.<class>`; else the visible label with
digits as `#`. Anything inside the shared widget is prefixed `widget:`. `act=*` (answer buttons) is by far the biggest
family. Because names come from markup, **renaming a `data-` attribute or id renames the metric**: keep them stable, or
note the change in the change log.

### Feature-event kinds (`feature_events.kind`)

`<family>:<detail>` or `<family>=<value>`, lowercase `[a-z0-9:=_.+-]`, at most 64 characters, sent with
`window.shTrack(kind, n)` (`n` defaults to 1; seconds for `*:secs`). One row per day, page, kind and person, `n` summed.
**Every family has a row here**; the Insights tab's data-quality card lists families first seen in the last 14 days so a
new one can't go undocumented.

| Family | Examples | `n` means | Emitted by | Since |
|---|---|---|---|---|
| `view` | `view` | page loads | `widget/clicks.js`, every page | 10-20 |
| `state` | `state:pet=dash`, `state:theme=dark` | once a day per page: a snapshot of each setting | `widget/clicks.js` `snapshot()` | 10-20 |
| `pref` | `pref:fx=off` | a setting changed | `widget/clicks.js` (`sh:pref`) | 10-20 |
| `egg` | `egg:timmy-start`, `egg:boss` | an easter egg showed itself | `widget/clicks.js` on `sh:egg-local` (`widget/eggs.js`), `widget/timmy.js` | 10-20 |
| `fig-seen` / `fig` / `fig-part` | `fig-seen:sarcomere`, `fig:attach` | a diagram half on screen once / a control moved / a part tapped | `widget/clicks.js` | 10-20 |
| `pod` | `pod:<episode>:play`, `:q1`-`:q4` (25/50/75/95% heard), `:secs`, `:like`, `:dislike`, `:unvote`, `:comment`, `:report`, `:comments-all` | count; seconds for `:secs` | `widget/podcast.js` | 10-20 (reactions 11-04) |
| `tts` | `tts:start-<plain\|full\|voice>`, `tts:lec=<lecture>-<level>`, `tts:secs`, `tts:end` | starts; seconds heard; finishes | Listen, `widget/v3.js` | 10-20 |
| `tour` / `tour-hub` | `:prompt`, `:start`, `:done`, `:decline`, `:quit-<step>` | the dashboard's and a hub's guided tour | `widget/tour.js` | 10-21 |
| `bank` | `bank:show=<chip>` (a Show chip, or a High likelihood toggle turned on: `likely`, Heme & Endo 2 `likely1`), `bank:show=<toggle>-off` (from 11-06), `bank:lec-only`, `bank:type=`, `bank:src=`, `bank:order=`, `bank:search`, `bank:tag-off=`, `bank:clear`, `bank:more`, `bank:retry-shown`, `bank:retry`; `bank:sort=` (Heme & Endo only) | Question Bank filter panel use ([rule](../rules/question-bank-filter-panel.md)), "Try it again" | each hub's bank (`track()` adds `bank:`) | 10-21 |
| `hints` | `hints:likely-practice` | "Practice these" on Exam Hints | hubs | 10-29 |
| `drill` | `drill:size=20`, `drill:more=10` | Daily Drill size chosen, "more" | `widget/drill.js` | 10-20 |
| `pin` | `pin:add`, `pin:remove` | pinned questions | `widget/v3.js` | 11-02 |
| `qrate` | `qrate:up`, `qrate:down`, `qrate:undo`, `qrate:why=<reason>` (`wrong-key`, `confusing`, `not-in-notes`, `explanation`, `giveaway`, `other`, `none`) | "Good question?" taps | `widget/qhealth.js` | 11-04 |
| `hl` | `hl:y`, `hl:g` | highlights made, by color | `widget/highlight.js` | 10-20 |
| `mmap` | `mmap:open` | mind map opened | `widget/v3.js` | 10-20 |
| `notes-jump` | `:shown`, `:show`, `:none` | "Find this in the notes" offered / tapped / no match | `widget/v3.js` | 11-04 |
| `notes` | `notes:next`, `notes:report` | notes navigation and Report under notes | `widget/v3.js` | 11-03 |
| `pet` | `pet:intro`, `pet:adopt-*`, `pet:no-thanks-step*`, `pet:tap-*`, `pet:checkup`, `pet:joke` | Timmy Tooth's intro and use | `widget/pet.js` | 10-20 |
| `arcade` | `arcade:board:start`, `arcade:escape:win` | arcade game starts and wins | `widget/games.js` | 10-21 |
| `link` / `link-ask` | `link:code`, `link:linked`, `link:fail`; `link-ask:shown`/`yes`/`no`/`later`/`code`/`fail`/`share`/`url-open` | Link my devices; the "is this your other device?" prompt | `widget/ranks.js`, `widget/linkask.js` | 10-21 |
| `name` | `name:set`, `name:reset` | leaderboard name changed | `index.html` (dashboard) | 10-20 |
| `flair` | `flair:open` | mastery flair panel | `widget/ranks.js` | 10-21 |
| `about` | `about:spoilers=on` | About page spoilers | `about/index.html` | 10-20 |

Hub `zz-test` holds three rows from a test on 10-20; every read leaves out hubs starting `zz-`.

## Adding something to track

1. Prefer what's already recorded: time (sections), clicks (any button with an id or `data-` attribute is counted) or an
   existing family. Add an event only for what a click and a ping can't show (time heard, how far, what was on screen,
   a setting's state).
2. Name it `<family>:<detail>` from the table above, or a new family with a row added here in the same PR.
3. Never put free text, a question id per student, a name or anything typed into a kind or a target
   ([learner-data-privacy](../rules/learner-data-privacy.md)).
4. Send the last step of a flow before the page moves on (LESSONS: the `link:linked` event fired just before a reload and
   never arrived; `shClicks.flush()` sends at once).
5. A new table: a migration (`record_*` security definer, fails silently, size limits on every argument), a row in this
   note and in [analytics-retention](analytics-retention.md), `supabase/schema.sql` refreshed, and the About page's
   "What the hubs record" entry if students would not expect it.

Related: [analytics-governance](analytics-governance.md) · [analytics-data-quality](analytics-data-quality.md) ·
[insights-dashboard](insights-dashboard.md) · [read-usage-data](../how-to/read-usage-data.md)
