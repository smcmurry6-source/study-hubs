---
type: hub
tags: [hub, archived]
hub: pcd-exam3
status: archived
---

# PCD Fixed Pros Exam 3

**Its page came down 2026-11-19**, with the other five old single-file hub pages (Sam: "lets go ahead and take down all
old pages", [decisions](../decisions.md)). Its `hubs.js` entry (the check-ins, the recap),
`tools/question-ids/pcd-exam3.txt`, its art and the class's data in Supabase stay. The page is still in git:
`git show a897c0c:hubs/pcd-exam3/index.html` (the last `main` commit with it); its questions and lectures as JSON:
`tools/dump-banks.js` on a copy of that commit ([repo map](../reference/repo-map.md)).

Cement and cementation, bonding ceramics, removing a crown, onlays, laminate veneers, color and James Bradley's glaze
video; exam Thu Oct 15 on Canvas. Archived. Retrospective: `LESSONS.md` → Hub retrospectives.

- Built on the Occlusion engine; its drawn figures use `FIGS` / `figHTML()` / `FIG_BY_LEC`.
- Built around the course's Exam 3 hint email (src `hint`, the Exam Hints "exam list").
- Exempt from the "why for every choice" lint (`WHY_EXEMPT`).

**Audio off (2026-11-12):** its narration came off the site when it was archived, to keep the site under GitHub Pages' 1 GB limit ([archived-hubs-drop-their-audio](../rules/archived-hubs-drop-their-audio.md)). The widget tag says `data-audio="off"`, so Listen reads in the device's voice. To bring it back: `git checkout <the commit before> -- hubs/pcd-exam3/audio` and take the attribute out.

Related: [home](../home.md)
