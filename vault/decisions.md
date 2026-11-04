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
| 2026-11-04 | Timmy Time: likes, dislikes and comments under every episode, with 1-3 lore comments (a random count) per episode; class comments show at once, reportable, Sam can hide any | every episode | chat, [rule](rules/podcast-reactions.md) |
| 2026-11-04 | Timmy Time's cold open leaves out per-lecture question counts, the exact exam time and LockDown Browser | every episode | chat, [rule](rules/podcast-intro.md) |
| 2026-11-04 | Implants episode: about 45 minutes; lore: Timmy's ligament, number thirty-one thinks he's failing, Brånemark's rabbit, the Thanksgiving costumes. Gemini TTS was asked about; the episode stays on Kokoro until a `GEMINI_API_KEY` is set in the environment | `pcd-implants-exam1` | chat |
| 2026-11-04 | Special Patient Care: the exam email's dates (Fri Nov 17, Sat Nov 18) are left over from an earlier year; the hub keeps opens Fri Nov 6, due Fri Nov 13 11:59 pm, Canvas closes Sat Nov 14 11:59 pm | special-patient-care | chat, [hub note](hubs/special-patient-care.md) |
| 2026-11-04 | Special Patient Care: add multiple-answer (select all) practice only; no ordering, fill-in-the-blank or Hot Spot practice, though the exam has them | special-patient-care | chat, [hub note](hubs/special-patient-care.md) |
| 2026-11-04 | The taste skill (`.claude/skills/taste-skill/`) is used in full, its house rules and gates included, when Sam asks to redesign a hub or page; the vault's content and feature rules still hold, and nobody restyles a live page unasked | every hub, dashboard, About | chat, PR #217 |
| 2026-11-04 | Holiday themes: Thanksgiving runs Nov 1 to the day after Thanksgiving, then Christmas (id `winter`) to Dec 26 | every hub, dashboard (`widget/eggs.js`, `widget/pet.js`) | chat, PR #216 |
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
