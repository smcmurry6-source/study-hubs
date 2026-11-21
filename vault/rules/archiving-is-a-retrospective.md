---
type: rule
tags: [archiving, lessons]
---

# Archiving a hub = retrospective

Every time a hub is archived, all the data gathered on it (time by section, clicks, engagement, questions, exam
check-ins, search terms, reports, surveys) is used to improve the next hubs: run `tools/retro.sql`, then record the
findings and resulting changes in `LESSONS.md`. **Any session building or restructuring a hub reads `LESSONS.md`
first** (hub Projects included: it holds what the class actually used and where they struggled).

It is also refreshed between archivings, by hand when Sam asks a Claude Code session to "run the lessons refresh"
(`tools/lessons-refresh.md`; no scheduled routine): it reads all tracked data, student reports and suggestions since the last run
(`tools/lessons-daily.sql`), rewrites the "Live signals" section, and opens a PR with small, data-backed fixes to the
live hubs. **Before building a new hub** (any session, hub Projects included), if `LESSONS.md`'s "Last refreshed"
date isn't today, do steps 1-3 of that runbook first so the new hub is built from current data.
