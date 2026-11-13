---
type: task
status: open
hub: site
created: 2026-11-12
requested-by: Sam
due: 2026-11-20
waiting-on: each hub's archiving (dates below)
agent:
pr:
---

# Take the audio off the next hubs to be archived

## Goal

Sam's rule from 2026-11-12, [archived-hubs-drop-their-audio](../rules/archived-hubs-drop-their-audio.md): an archived hub's
narration and Timmy Time come off the site so it stays under GitHub Pages' 1 GB limit. The first five came off on
2026-11-12 (MSK Exam 3 and 4, PCD Fixed Pros Exam 3, Heme & Endo Exam 1, PCD Implants Exam 1). These four are next, each
after its date. Do each one on its own (a small PR), with the steps in the rule.

## Done when

- [ ] **Special Patient Care** (`special-patient-care`, 57 MB): its card came down 2026-11-06, but the exam is open on
  Canvas until Fri Nov 13, 11:59 pm, so its audio comes off after that.
- [ ] **Heme & Endo Exam 2** (`heme-endo-exam2`, 172 MB): archived Fri Nov 13 at 10 pm. It kept its old single-file
  page at the redesign's release, so it is the old steps (`data-audio="off"` on its v3.js tag). Its High yield
  recordings (59 MB) already went with its new version, in the release's PR.
- [ ] **Occlusion** (`occlusion`, 206 MB with High yield): archived after the final, Mon Nov 16 at 10 pm. On the engine:
  `"audio": "off"` in `content/core.json`, the content build, and out of `HUBS` in `sw.js` (the rule's step 2).
- [ ] **Perio** (`perio`, 216 MB with High yield): archived after the final, Thu Nov 19 at 10 pm. On the engine, the same.
- [ ] `node tools/ci/size.js` lists no archived hub among those with audio.

## Log

- 2026-11-12: written with the first five's removal ([#328](https://github.com/smcmurry6-source/study-hubs/pull/328)); sizes are their audio at 64 kbps (narration) and 96 kbps (Timmy Time).
- 2026-11-12: the three redesigned hubs gained High yield narration (`<lecture>-hy.mp3`,
  [task](done/2026-11-12-high-yield-narration.md)): Heme & Endo Exam 2, Occlusion and Perio each carry more than the sizes
  above (`node tools/ci/size.js` lists them). Step 1's `git rm hubs/<hub>/audio/*.mp3` takes those too.

- 2026-11-13: the redesign's release wired the engine for it (`core.json`'s `"audio": "off"`: no recording, no Follow
  along, no Timmy Time; the smoke test checks it) and wrote the engine's steps into the rule. Heme & Endo Exam 2 kept its
  old page, and its 59 MB of High yield recordings went with its deleted new version.

## Outcome

Related: [archived-hubs-drop-their-audio](../rules/archived-hubs-drop-their-audio.md) ·
[the High yield narration](done/2026-11-12-high-yield-narration.md), which was waiting for room on the site
