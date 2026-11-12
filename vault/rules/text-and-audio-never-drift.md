---
type: rule
tags: [audio, notes]
---

# Text and audio must never drift

Hubs with pre-generated narration (see `hubs/*/audio/`): editing a lecture's
text at any level (As taught / Plain English / High yield) means regenerating that
level's mp3 in the same PR.

**High yield** (the redesign's third reading level, `<lecture>-hy.mp3`, narrated since 2026-11-12) is never edited by hand:
`tools/hub-next/build.mjs` rebuilds it from the lecture's notes, predicted topics, Exam Hints and questions, so a change to
any of those can change it (a question added to a topic changes its "4 questions in the bank"). When a lecture's `hy` in
`hubs/<hub>/next/content/notes.json` changes, record it again in the same PR, then rebuild:

```bash
python3 tools/narrate.py hubs/<hub>/next/content/notes.json --level hy --lec <id> --force
node tools/hub-next/build.mjs --hub <hub>
```

`node tools/ci/smoke.js` fails and names each lecture whose recording no longer matches its High yield. Until it's
recorded again the page doesn't offer the recording (Listen reads High yield in the device's voice), so a stale one never
plays.

If you can't regenerate the audio (no Kokoro, no time), don't edit the text: say so in the PR or the task note instead.
How: [narrate-with-kokoro](../how-to/narrate-with-kokoro.md). The same goes for a hub's Timmy Time episode: when the
notes change, fix the script and rebuild the episode in the same PR (`tools/podcast/README.md`).
