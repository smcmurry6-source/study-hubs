---
type: rule
tags: [students, about]
---

# The About page lists everything

`about/index.html` (the dashboard's "About" button) is the students' guide to every feature, easter egg, trophy,
holiday and setting. **Every Project and session that ships something students can see adds it to that page in the
same change** (or updates/removes the entry when a feature changes or goes away). Secrets go inside a `spoil` element
so they stay hidden until someone ticks "Show spoilers". Hub-only content (new questions, notes, review tables) doesn't
need an entry; a new hub mode, tab, game or question type does.

How (Sam's standing rule, 2026-10-02): add or update its entry in the right part of `about/index.html` (with a "new"
tag), keep counts like "All 24 trophies" true, and put anything that gives away a secret inside a `spoil` element
(secret trophy rows carry `data-k` and the `spoil`/`spoil-ph` pair). Removed or changed features come off or get
rewritten there too.

Related: [ship-a-change](../how-to/ship-a-change.md)
