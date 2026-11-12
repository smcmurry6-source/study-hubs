---
type: rule
tags: [archiving, audio, site]
since: 2026-11-12
---

# An archived hub's audio comes off the site

Sam's standing rule, 2026-11-12: **when a hub is archived, its narration and Timmy Time come off the site.** Its page
stays up, as decided 2026-10-20 ([decisions](../decisions.md)): notes, questions, the mock, the arcade and everything else
stay, Listen reads with the device's own voice, and Timmy Time is gone.

**Why:** GitHub Pages stops publishing a site over 1 GB, and big publishes are the slow ones. On 2026-11-12 the site was
958 MB, and 909 MB of it was mp3s: 100-180 MB a hub. With only the live hubs' audio up, the site stays around 400-600 MB.
`node tools/ci/size.js` (in "Check hubs") prints the size and the hubs that still carry audio; it warns from 750 MB and
fails from 900 MB.

**Bitrates stay as they are** (Sam, 2026-11-12, after hearing samples at 48, 40 and 32 kbps): narration 64 kbps mono
24 kHz (`tools/narrate.py`), Timmy Time 96 kbps stereo (`tools/podcast/produce.py`). Don't re-encode to save room.

## How, at each archiving

When: once the hub's last exam is over, its archiving hour passed (10 pm on exam day, `ARCHIVE_HOUR`), or, for a take-home
open past the day its card came down, once it's due. `/lessons-audit` does it with the hub's retrospective; any session
that sees an archived hub in `size.js`'s list does it too. No need to ask Sam.

1. `git rm hubs/<hub>/audio/*.mp3` (and any `*.words.json` there).
2. Add `data-audio="off"` to the hub's `<script ... src="../../widget/v3.js" ...>` tag. `widget/v3.js` then sends Listen
   to the device's voice instead of the missing files, doesn't load Timmy Time, and `widget/v3.css` hides the hub's
   "Timmy Time" links (`[data-sh-podcast-open]`). Leave the hub's own code, `SH_PODCAST` and `tools/podcast/<hub>/` as
   they are.
3. `node tools/ci/smoke.js` for the hub: it fails if `data-audio="off"` is set and audio is still there, and skips the
   narration checks otherwise.
4. A line in the hub's note and in `DEPLOY_NOTES.md`.

**A redesigned hub** (on `widget/hub.js`) isn't wired for this yet: the engine writes v3.js's tag itself, and its notes
and Timmy Time page read `core.json`. Its box is in [the redesign release](../tasks/2026-11-06-redesign-release.md).

**To bring audio back** (Sam asks): `git checkout <the commit before it came off> -- hubs/<hub>/audio`, take
`data-audio="off"` out, and check the site's size. Git keeps every file it ever had.

Related: [archiving-is-a-retrospective](archiving-is-a-retrospective.md) · [repo map](../reference/repo-map.md) ·
[shared-infrastructure](../reference/shared-infrastructure.md) · [narrate-with-kokoro](../how-to/narrate-with-kokoro.md) ·
[the to-do for the next archivings](../tasks/2026-11-12-audio-off-at-archiving.md)
