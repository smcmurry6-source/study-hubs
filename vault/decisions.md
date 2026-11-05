---
type: decisions
tags: [decisions]
---

# Sam's decisions

Calls Sam made that an agent would otherwise get wrong: what was approved, skipped, kept or left alone. Newest first,
one line each, with where it applies and where it came from. Standing rules have their own notes in
`vault/rules/` (listed in [home](home.md)); a call that becomes a rule moves there.

**Add a line whenever Sam decides something** in a task, a PR or a chat ([repo-is-the-vault](rules/repo-is-the-vault.md)).
This log was started on 2026-11-03 from the change log; older calls not listed here may still be in "Recent major
changes" in `DEPLOY_NOTES.md` (grep it before re-proposing something).

| Date | Decision | Applies to | Source |
|---|---|---|---|
| 2026-11-05 | Heme & Endo Exam 2: "Yes to all animations" (every diagram candidate approved without a one-by-one review), "no need to verify before release" (no preview or approval gate; CI still runs) and "merge when ready" (the agent merges once the checks pass) | heme-endo-exam2 | chat, [hub note](hubs/heme-endo-exam2.md) |
| 2026-11-05 | The analytics retention schedule is in force (Sam: "Yes to the data retention suggestions", 2026-11-04, then "go ahead" for the migration and "merge when ready" for the release): raw pings 30 days, who-tapped-what 90, feature events 180 then daily totals, report/suggestion ids 120 days after the reply, check-in ids a year, survey ids 90 days after it closes, link attempts 7 days, test rows none. It runs as a weekly pg_cron job (the agent's choice; Sam can switch it to by hand). The `question_events` / `question_feedback` rows the question-health work added later are not approved yet | analytics, Supabase | [analytics-retention](reference/analytics-retention.md), [PR #241](https://github.com/smcmurry6-source/study-hubs/pull/241) |
| 2026-11-05 | No post-release monitoring, now or for future releases: the 1, 24 and 48 hour checks (`tools/release/monitor.sql`, removed) and scheduled check-ins for them are dropped. The post-release check (`postcheck.js`), the changelogs and rollback stay | every release | chat, [preview-and-release-test](rules/preview-and-release-test.md) |
| 2026-11-05 | Question health: "Merge when ready": Sam's approval of the release, so the agent merges once "Check hubs" and "Release tests" pass | every hub, `review/` | chat, [test report](release/reports/2026-11-04-question-health.md) |
| 2026-11-05 | The admin page redesign and admin operations (PR #236) approved for release: "Merge when ready". Sam asked the session to merge it, so the agent applied `migration_v50.sql` and merged once its checks passed (the release plan's "agents never merge" otherwise stands) | admin page, dashboard | chat, [PR #236](https://github.com/smcmurry6-source/study-hubs/pull/236) |
| 2026-11-04 | The drawn Patient Box case system (`widget/cases.js`) is for every hub's Patient Box questions, not only Perio; every tooth anatomically correct, every variable realistic (CI validates); Sam approved the first PR in chat ("Merge when ready") | every hub | [how-to](how-to/draw-a-patient-box-case.md), [task](tasks/done/2026-11-04-perio-visual-case-engine.md) |
| 2026-11-04 | A hub's manual archive state (Live, Archived or Hidden on the admin page's Hubs tab) lasts until Sam sets it back to Automatic, or until an optional end time; then the dates decide again. It never deletes a hub's page, link, questions, analytics or progress | dashboard, every hub, admin page | chat, [admin-operations](reference/admin-operations.md) |
| 2026-11-04 | Admin information stays off the About page: it doesn't mention the admin page's Live tab or setting a hub's state by hand (Sam's later call the same day, replacing "the About page says Sam can see who is studying now") | About, admin page | chat |
| 2026-11-04 | The admin page's Live tab names people by their leaderboard name (the name they chose, else their random class name), never an id or email | admin page | chat, [admin-operations](reference/admin-operations.md) |
| 2026-11-04 | The admin-operations work (live presence, archive overrides, newest-first check-ins) was stacked on PR #233 and retargeted to `main` once #233 merged | admin page | chat |
| 2026-11-04 | Question health for every hub: stable ids that never change or get reused, and per-question tracking (accuracy, retries, time, giving up, the explanation, thumbs and reports) that flags likely problems for Sam's review; nothing changes or deletes a question automatically (now rules: [question-ids-are-permanent](rules/question-ids-are-permanent.md), [question-health-flags-are-leads](rules/question-health-flags-are-leads.md)) | every hub, `review/` | chat, [reference](reference/question-health.md) |
| 2026-11-04 | Preview links on Cloudflare Pages (option A), chosen the same day after "neither": every site-changing PR gets a pages.dev link in a PR comment; Timmy Time episodes are left out of that copy (they play the live site's); a token with only Cloudflare Pages: Edit, never the Global API Key; no Cloudflare Access for now | every PR | chat, [plan](../RELEASE_TEST_PLAN.md), [task](tasks/done/2026-11-04-preview-hosting-and-staging.md) |
| 2026-11-04 | Sam's part of a release is a look, not testing ("i dont need to do extensive testing, just see if i like something before it ships"): the agent tests in its own scripted browser and shows Sam the change (the PR's preview link on its own line, screenshots, a short recording). No staging database for now; hosting: the line above | every change, every agent | chat, [plan](../RELEASE_TEST_PLAN.md) |
| 2026-11-04 | Every substantial change gets an interactive preview on made-up data, the release tests and Sam's explicit approval before release, then post-release checks; previews never write to the class's data or analytics. Hosting and staging: the lines above | every change, every agent | chat, [rule](rules/preview-and-release-test.md) |
| 2026-11-04 | Occlusion: vet, audit and improve every figure (fix in place, no new figures; open content questions go to Sam in the PR and the hub note), merged when ready | `occlusion` | chat, [PR #232](https://github.com/smcmurry6-source/study-hubs/pull/232) |
| 2026-11-04 | PCD Implants: redraw all seven implant-type drawings to be more accurate and add the missing intramucosal insert; outside sources are fine for accuracy (now a rule: [figures-teach-the-lecture](rules/figures-teach-the-lecture.md)) | `pcd-implants-exam1` | chat |
| 2026-11-04 | After answering, every choice shows the % of the class that picked it (shared widget, `question_choices`) | every hub | chat, change log |
| 2026-11-04 | `/reddit-scout`'s first run: build "Find this in the notes" (shipped in the widget) and the Supabase fix; skip a CI check for narration drift, don't re-propose it | widget, `/reddit-scout` | chat, `tools/reddit-scout/log.md` |
| 2026-11-04 | Timmy Time comments open folded: only the first comment shows, with a button to show the rest | every episode | chat, [rule](rules/podcast-reactions.md) |
| 2026-11-04 | PCD Implants: Home's "Where to next" points to the lectures you've practiced least (under half tried, up to four, fewest first) and opens the bank on their unanswered questions; approved from the lessons audit | pcd-implants-exam1 | chat, PR #222 |
| 2026-11-04 | Timmy Time: likes, dislikes and comments under every episode, with 1-3 lore comments (a random count) per episode; class comments show at once, reportable, Sam can hide any | every episode | chat, [rule](rules/podcast-reactions.md) |
| 2026-11-04 | Timmy Time's cold open leaves out per-lecture question counts, the exact exam time and LockDown Browser | every episode | chat, [rule](rules/podcast-intro.md) |
| 2026-11-04 | Implants episode: about 45 minutes; lore: Timmy's ligament, number thirty-one thinks he's failing, Brånemark's rabbit, the Thanksgiving costumes. Gemini TTS was asked about; the episode stays on Kokoro until a `GEMINI_API_KEY` is set in the environment | `pcd-implants-exam1` | chat |
| 2026-11-04 | Special Patient Care: the exam email's dates (Fri Nov 17, Sat Nov 18) are left over from an earlier year; the hub keeps opens Fri Nov 6, due Fri Nov 13 11:59 pm, Canvas closes Sat Nov 14 11:59 pm | special-patient-care | chat, [hub note](hubs/special-patient-care.md) |
| 2026-11-04 | Special Patient Care: add multiple-answer (select all) practice only; no ordering, fill-in-the-blank or Hot Spot practice, though the exam has them | special-patient-care | chat, [hub note](hubs/special-patient-care.md) |
| 2026-11-04 | The taste skill (`.claude/skills/taste-skill/`) is used in full, its house rules and gates included, when Sam asks to redesign a hub or page; the vault's content and feature rules still hold, and nobody restyles a live page unasked | every hub, dashboard, About | chat, PR #217 |
| 2026-11-04 | Holiday themes: Thanksgiving runs Nov 1 to the day after Thanksgiving, then Christmas (id `winter`) to Dec 26 | every hub, dashboard (`widget/eggs.js`, `widget/pet.js`) | chat, PR #216 |
| 2026-11-04 | Sam's claude.ai skills replaced: they point at the vault instead of restating it; Cowork ships a branch and a draft PR, never `main`; `study-hub-git-workflow` deleted (`CLAUDE.md` covers it) | claude.ai skills, Cowork | [task](tasks/done/2026-11-03-update-claude-ai-skills.md) |
| 2026-11-03 | The repo is used like an Obsidian vault that any agent can be pointed at; agents write back what they learn | every agent | [rule](rules/repo-is-the-vault.md) |
| 2026-11-03 | Occlusion L7: all five diagram candidates approved (tolerance model, orthopedic vs occlusal stability, splint designs, rule of thirds, erosion pattern map) | occlusion | [task](tasks/done/2026-11-03-occlusion-l7-diagrams.md) |
| 2026-11-03 | Perio S7/S8: all six diagram candidates approved (built) | perio | change log |
| 2026-11-03 | Perio's single file is the source; the split-source Perio Project is retired | perio | [hub note](hubs/perio.md) |
| 2026-11-03 | No "Likely first" order in the Question Bank: High likelihood is a filter | every live hub | [rule](rules/question-bank-filter-panel.md) |
| 2026-11-03 | Heme & Endo Exam 1's Question Bank filters stay as they are | heme-endo-exam1 | [rule](rules/question-bank-filter-panel.md) |
| 2026-11-03 | Heme & Endo reopened for a late exam: archives 11-03 10 pm, card and check-in stay until 11-06 10 pm | heme-endo-exam1 | change log |
| 2026-11-03 | PCD Implants: remove brand and admin details with no exam signal (reports #35/#36) | pcd-implants-exam1 | [hub note](hubs/pcd-implants-exam1.md) |
| 2026-11-03 | PCD Implants: "Yes to all animations and figures" (eleven built) | pcd-implants-exam1 | change log |
| 2026-10-28 | Special Patient Care: no figures or animations, no diagram review | special-patient-care | [hub note](hubs/special-patient-care.md) |
| 2026-10-28 | Special Patient Care: no check-in and no archiving until the exam closes (Nov 13, 11:59 pm; since 2026-11-04 the card stays live through Sat Nov 14 and check-in waits for Nov 19, see the hub note) | special-patient-care | change log |
| 2026-10-27 | Occlusion L6: four diagram candidates approved (built); Heme & Endo: "Yes to all animations" (six built) | occlusion, heme-endo-exam1 | change log |
| 2026-10-20 | Occlusion: ten anima candidates approved for L1-L5 (all built) | occlusion | change log |
| 2026-10-20 | The archived hub folders stay up; Timmy Tooth keeps asking unadopted visitors to tap him; no cloze question items for now | site | change log |
| 2026-10-14 | First diagram review: skipped all four PCD Exam 3 candidates, MSK 4's melanin unit and blister split, all four Occlusion and all four Perio candidates of that review; don't re-propose them | pcd-exam3, msk-exam4, occlusion, perio | change log |
| 2026-10-14 | Perio S5: skipped the Glickman grades, furcation entrance map and CEP grades diagrams; don't re-propose | perio | [hub note](hubs/perio.md) |
| 2026-10-14 | MSK Exam 4: Dr. Taylor's clinical application lecture is not on the exam; removed | msk-exam4 | [hub note](hubs/msk-exam4.md) |
| 2026-10-01 | `/lessons-audit` publishes an archived hub's recap to the dashboard without asking | lessons audit | [repo map](reference/repo-map.md) (`review/`) |
| 2026-09-29 | The widget's Search stays, even though few people open it | widget | change log |
| 2026-09-29 | The lessons refresh runs by hand when Sam asks; no scheduled routine | lessons audit | `tools/lessons-refresh.md` |
| 2026-09-25 | Perio's Atlas mode removed: its diagrams were inaccurate. Accuracy is the bar for every figure | every hub | [rule](rules/diagram-review.md) |

Related: [home](home.md) · [tasks](tasks/README.md)
