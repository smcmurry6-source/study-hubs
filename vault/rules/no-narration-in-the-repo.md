---
type: rule
tags: [audio, repo, site]
since: 2026-11-22
---

# No narration or Timmy Time in this repo

Sam's standing rule, 2026-11-22 ("Okay all that is good to me", agreeing to the plan in
[the sustainability task](../tasks/2026-11-22-sustainable-for-years.md)): **no recording a hub's narration or Timmy Time
produces is committed to this repo again.** That covers a lecture's `<lecture>-full.mp3`, `-plain.mp3` and `-hy.mp3`, a
study guide's `guide.mp3`, their `.words.json`, and `timmy-time.mp3`.

**Why:** git keeps every file it was ever given. Taking a hub's audio off the site
([archived-hubs-drop-their-audio](archived-hubs-drop-their-audio.md)) emptied the published site, but not the history: on
2026-11-21 GitHub counted the repo at about 2.4 GB, about 95% of it mp3s, over GitHub's 1 GB recommendation for a site's
repo and halfway to the 5 GB it "strongly recommends". Taking them out of the history means rewriting it, which changes
every commit id, breaks every pull request's diff and the vault's commit links, and would probably not shrink GitHub's
count anyway (merged pull requests keep read-only refs to the old commits, which GitHub removes only for leaked secrets).
Sam's call: leave the history as it is, and stop the growth.

- **Until narration comes back,** a hub ships without recordings, as Review of Systems does: Listen reads with the
  device's own voice and there is no Timmy Time. `tools/narrate.py` and `tools/podcast/` still work for a local listen;
  their output stays out of git: `.gitignore` leaves out `hubs/*/audio/` and `timmy-time.mp3`, and CI's public-repo check
  (`node tools/release/secrets.js`, in "Check hubs") fails a change that adds a file under `hubs/<hub>/audio/` or a
  `timmy-time.mp3` anywhere, even one added with `git add -f` (2026-11-22).
- **When narration comes back,** it lives in a second repo whose Pages site the hubs fetch it from (a project site under
  the same account is served from the same address, `smcmurry6-source.github.io/<repo>/`, so the page can fetch its words
  files without any cross-site setup). Nothing points at that repo's history, so it can be wiped at every archiving.
  Building it is a package of [the sustainability task](../tasks/2026-11-22-sustainable-for-years.md).
- **Not covered:** the widget's own fixed sounds (`widget/audio/`, the study-music loops; `widget/sfx/`, the nuke), about
  11 MB that don't change. They stay.
- [Text and audio must never drift](text-and-audio-never-drift.md) still holds, wherever the recordings live.

Related: [archived-hubs-drop-their-audio](archived-hubs-drop-their-audio.md) ·
[narrate-with-kokoro](../how-to/narrate-with-kokoro.md) · [shared-infrastructure](../reference/shared-infrastructure.md) ·
[repo-is-the-vault](repo-is-the-vault.md)
