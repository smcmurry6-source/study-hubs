---
type: rule
tags: [audio, notes]
---

# Text and audio must never drift

Hubs with pre-generated narration (see `hubs/*/audio/`): editing a lecture's
text at either level (As taught / Plain English) means regenerating that
level's mp3 in the same PR.

If you can't regenerate the audio (no Kokoro, no time), don't edit the text: say so in the PR or the task note instead.
How: [narrate-with-kokoro](../how-to/narrate-with-kokoro.md). The same goes for a hub's Timmy Time episode: when the
notes change, fix the script and rebuild the episode in the same PR (`tools/podcast/README.md`).
