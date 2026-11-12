---
type: hub
tags: [hub, archived]
hub: msk-exam4
status: archived
---

# MSK Exam 4 (GI & MSK Exam 4)

Skin histology, derm pharm, dermpath, skeletal muscle and NMJ pharm (L28-L32); exam Fri Oct 16. Archived; the page is
still up. Retrospective: `LESSONS.md` → Hub retrospectives.

- **The first anima figures** (the neuromuscular junction, the sliding sarcomere): `tools/figures/msk-exam4/` is the
  reference build new hubs copy (`shared.mjs` maps the kit onto a hub palette, `uniq()` gives every copy its own SVG ids).
- Dr. Taylor's MSK & Skin Clinical Application lecture was removed (not on the exam, Sam 2026-10-14); recover it with
  `git show ed35097:hubs/msk-exam4/index.html` if a later exam needs it.
- Timmy Time's first episode: `tools/podcast/msk-exam4/`.
- Exempt from the "why for every choice" lint (`WHY_EXEMPT`, archived before the rule).

**Audio off (2026-11-12):** its narration and Timmy Time came off the site when it was archived, to keep the site under GitHub Pages' 1 GB limit ([archived-hubs-drop-their-audio](../rules/archived-hubs-drop-their-audio.md)). The widget tag says `data-audio="off"`, so Listen reads in the device's voice and its Timmy Time card and links are hidden (the script stays in `tools/podcast/msk-exam4/`). To bring it back: `git checkout <the commit before> -- hubs/msk-exam4/audio` and take the attribute out.

Related: [home](../home.md) · [diagrams-anima](../rules/diagrams-anima.md)
