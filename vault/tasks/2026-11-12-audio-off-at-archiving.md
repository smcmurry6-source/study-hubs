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

- [x] **Special Patient Care** (`special-patient-care`, 57 MB): its card came down 2026-11-06. Done 2026-11-14: Sam had the whole
  hub come off the site, audio included ([#361](https://github.com/smcmurry6-source/study-hubs/pull/361)).
- [x] **Heme & Endo Exam 2** (`heme-endo-exam2`, 232 MB with High yield): done 2026-11-13, by the lessons audit on `main`
  ([#361](https://github.com/smcmurry6-source/study-hubs/pull/361); the site went to 533 MB) and in the release's PR (#359;
  Sam: "You can also remove the audio for heme and endo 2 and archive it"), which agree: the files removed and
  `data-audio="off"` on its v3.js tag (the old steps: it kept its old single-file page at the redesign's release).
- [x] **Occlusion** (`occlusion`, 211 MB with High yield): archived after the final, Mon Nov 16 at 10 pm. Done 2026-11-17 by the lessons audit (the site 638 -> 427 MB). On the engine:
  `"audio": "off"` in `content/core.json`, the content build, and out of `HUBS` in `sw.js` (the rule's step 2).
- [x] **Perio** (`perio`, 289 MB with High yield and the final's Timmy Time): its final was the morning of Thu Nov 19; done that
  afternoon by the lessons audit (Sam: "perio is over"): the 55 files, `"audio": "off"` in `content/core.json`, the content build,
  and the `podcast`, Listen and Timmy Time out of its `hubs.js` entry (the site 656 -> 367 MB).
- [x] **Perio out of `HUBS` in `sw.js`** (and `VERSION` bumped) once the dashboard has archived it: done the same afternoon
  (`sh-v65`, [#464](https://github.com/smcmurry6-source/study-hubs/pull/464)), when Sam had its page taken down and `hubs.js` archived it at 1 pm.
- [x] `node tools/ci/size.js` lists no archived hub among those with audio (2026-11-19: only Heme & Endo Exam 3, live, carries any).

## Log

- 2026-11-12: written with the first five's removal ([#328](https://github.com/smcmurry6-source/study-hubs/pull/328)); sizes are their audio at 64 kbps (narration) and 96 kbps (Timmy Time).
- 2026-11-12: the three redesigned hubs gained High yield narration (`<lecture>-hy.mp3`,
  [task](done/2026-11-12-high-yield-narration.md)): Heme & Endo Exam 2, Occlusion and Perio each carry more than the sizes
  above (`node tools/ci/size.js` lists them). Step 1's `git rm hubs/<hub>/audio/*.mp3` takes those too.

- 2026-11-13: Heme & Endo Exam 2's audio came off with its retrospective (the lessons audit's PR): the narration, High yield and
- 2026-11-13: the redesign's release wired the engine for it (`core.json`'s `"audio": "off"`: no recording, no Follow
  along, no Timmy Time; the smoke test checks it) and wrote the engine's steps into the rule. Heme & Endo Exam 2 kept its
  old page, and its 59 MB of High yield recordings went with its deleted new version.
  Timmy Time mp3s and their words files, `data-audio="off"` on its widget tag, and its `next/` content rebuilt (no `hyAudio`). The
  live page wasn't on the redesign, so the engine's box didn't apply. Special Patient Care waits for Canvas to close (Sat 11-14, 11:59 pm).
- 2026-11-14: Special Patient Care's page came off with its audio (Sam: "remove everything for it"), in the same PR.
- 2026-11-17: Occlusion's audio came off with its retrospective (the lessons audit): the 51 files, `"audio": "off"` in its `core.json`, the content build, and out of `HUBS` in `sw.js` (`sh-v62`).
- 2026-11-19: Perio's audio came off with its retrospective (the lessons audit, the afternoon of its final): the 55 files, `"audio": "off"`, the build and its `hubs.js` entry's podcast. Later that day its page came down (Sam: "you can take perio down now"), and it left `HUBS` in `sw.js` (`sh-v65`).

## Outcome

Related: [archived-hubs-drop-their-audio](../rules/archived-hubs-drop-their-audio.md) ·
[the High yield narration](done/2026-11-12-high-yield-narration.md), which was waiting for room on the site
