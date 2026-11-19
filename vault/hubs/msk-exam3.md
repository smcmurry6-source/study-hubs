---
type: hub
tags: [hub, archived]
hub: msk-exam3
status: archived
---

# MSK Exam 3 (GI & MSK Exam 3)

**Its page came down 2026-11-19**, with the other five old single-file hub pages (Sam: "lets go ahead and take down all
old pages", [decisions](../decisions.md)). Its `hubs.js` entry (the check-ins, the recap),
`tools/question-ids/msk-exam3.txt`, its art and the class's data in Supabase stay. The page is still in git:
`git show a897c0c:hubs/msk-exam3/index.html` (the last `main` commit with it); its questions and lectures as JSON:
`tools/dump-banks.js` on a copy of that commit ([repo map](../reference/repo-map.md)).

Nutrition, joints, cartilage, bone, autoimmune disease, hereditary bone disorders, bone drugs and tumors (L19-L27); exam
Fri Oct 2. Archived. Retrospective: `LESSONS.md` → Hub retrospectives.

- The first hub with full data (clicks, per-section time, the idle rule, Daily Drill, mock scores).
- Its PollEv exam-review items were removed after the exam; they're in git history (`git show 1e6b580:hubs/msk-exam3/index.html`).
- Exempt from the "why for every choice" lint (`WHY_EXEMPT`).
- Its exam check-in is closed (Sam, 2026-11-16; `checkinClosed:true` on the exam in `hubs.js`). Answers already sent stay on `review/`.

**Audio off (2026-11-12):** its narration came off the site when it was archived, to keep the site under GitHub Pages' 1 GB limit ([archived-hubs-drop-their-audio](../rules/archived-hubs-drop-their-audio.md)). The widget tag says `data-audio="off"`, so Listen reads in the device's voice. To bring it back: `git checkout <the commit before> -- hubs/msk-exam3/audio` and take the attribute out.

Related: [home](../home.md)
