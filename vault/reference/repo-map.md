---
type: reference
tags: [map]
---

# Repo map

- `AGENTS.md` — the entry point for every AI agent; `CLAUDE.md` loads it for Claude Code sessions.
- `vault/` — the notes: rules, how-tos, reference, one note per hub, Sam's decisions and the task list. Start at
  [home](../home.md). Open the repo root in Obsidian to browse it as a vault ([repo-is-the-vault](../rules/repo-is-the-vault.md)).
- `DEPLOY_NOTES.md` — the change log ("Recent major changes", newest first): what every session shipped. Grep it for a
  hub or feature; don't read it whole.
- `index.html` — dashboard. Hub cards come from the `HUBS` / `CLASSES`
  arrays near the top of the script; add or archive a hub there, not in markup.
- `hubs/<hub-id>/index.html` — one single-file hub each, and it is the source (perio included: its old split-source
  Claude Project is retired; edit the file directly). `hubs/<hub-id>/audio/` holds
  its Kokoro narration (`<lecture>-full.mp3`, `<lecture>-plain.mp3`).
- `widget/v3.js` + `widget/v3.css` (+ `widget/eggs.js`, the easter eggs, `widget/clicks.js`, click analytics and feature events (`window.shTrack`), `widget/replies.js`, report replies and notices, `widget/ranks.js`, handpiece ranks, `widget/rankup.js`, the rank-up, level-up, trophy and mock-results cards, `widget/drill.js`, the Daily Drill, and `widget/fx.js`, the motion layer: answer feedback, the streak flame, bar fills, tab fades, and `widget/podcast.js`, the Timmy Time player with its likes, dislikes and comments; `widget/tour.js`, the guided tours of the dashboard and of a hub, loaded by `index.html` and v3.js) — shared cross-hub layer (search, class stats,
  streaks, leaderboard, analytics, `shTTS`, `shMindMap`). Cross-hub features go
  here, never hand-patched into one hub.
- `review/` — admin analytics page. Its **Recap** tab makes the shareable end-of-hub image (drawn by
  `widget/recap.js`) and **publishes** it to the dashboard's "Hub recaps" slideshow. When a hub is archived, publish its
  recap (`tools/publish-recap.js --bank <file>`; Sam's standing OK since 2026-10-01, `/lessons-audit` does it) **before**
  the hub page comes down, while `tools/dump-banks.js` can still read its bank.
  **Archived hubs' question banks are not kept in this public repo** (`question-banks/` is gitignored, removed
  2026-10-02): the syllabus keeps quiz and exam content from later classes. Keep a dump locally if you need one.
- `tools/podcast/` — Timmy Time, a hub's audio review episode hosted by Timmy Tooth: the script (`<hub>/script.md`),
  Kokoro voice with a pronunciation lexicon, synthesized music and mastering (its `README.md`). The mp3 goes in
  `hubs/<hub-id>/audio/timmy-time.mp3`; the hub defines `window.SH_PODCAST` and a `<div data-sh-podcast>` slot.
  Like narration, the episode must not drift from the notes: fix both in the same PR.
- `tools/reddit-scout/` — `scout.py` reads the Claude subreddits' feeds into one digest for `/reddit-scout`
  (`.claude/skills/reddit-scout/`); `log.md` keeps every run's suggestions, Sam's answers and the posts judged.
- `LESSONS.md` — what archived hubs taught us. Read it before building or restructuring a hub; **before building a new
  hub, if its "Last refreshed" date isn't today, run steps 1-3 of `tools/lessons-refresh.md` first**. Sam runs the whole
  runbook by hand whenever Sam asks for a lessons refresh, usually as `/lessons-audit` (the skill in
  `.claude/skills/lessons-audit/`; there is no scheduled routine): it refreshes `LESSONS.md` from all data, reports and suggestions
  (`tools/lessons-daily.sql`) and opens a PR with small data-backed fixes to the live hubs. **Archiving a hub
  always includes a retrospective** (Sam's standing rule): run `tools/retro.sql` for that hub (time by section,
  clicks and reach, engagement, questions, exam check-ins, search terms, reports), write the findings and the
  resulting changes into `LESSONS.md`, fix what's small, and tell Sam the rest. The dashboard archives a hub **by itself** at 10 pm on the day of
  its last exam (`ARCHIVE_HOUR`): its card turns into an archived card with no Open button, which disappears 10 days
  later (`CARD_DAYS`; `hideCardOn` overrides). "Check in" buttons show from 8 am on exam day; the pop-up only goes out
  from 10 pm and still reaches first visits up to 60 days after (`DEBRIEF_DAYS`). The hub's page itself stays up until
  someone removes it, so the retrospective and cleanup are still manual; moving the entry into `ARCHIVED_HUBS` then is optional. Read the check-ins as late as you can.
- `migration_v*.sql` — Supabase schema history (project `thytmzsgymydbzcqdnix`).
  New migrations are run once, by hand, in the Supabase SQL editor, or by a Claude Code session through the
  Supabase connector (`apply_migration` is pre-approved in `.claude/settings.json`). Commit the `.sql` file and
  refresh `supabase/schema.sql` either way.
- `deploy_rollout.py` / `.ps1` — the Cowork-era API deploy scripts. A Claude Code
  session doesn't need them: use git.
