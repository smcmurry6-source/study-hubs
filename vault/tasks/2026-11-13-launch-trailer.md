---
type: task
status: open
hub: site
created: 2026-11-13
requested-by: Sam
due:
waiting-on:
agent:
pr:
---

# A launch trailer for the redesign, narrated by Timmy

## Goal

Sam, 2026-11-13, while the redesign's release PR waited for "merge": "I want to make a trailer/intro video for when it
launches thats around 60-90 second to showcase updates and new features. It will open with an up close of timmy in the
timmy time studio and he will narrate the trailer."

A 60 to 90 second video for the day the redesign goes live: it opens close on Timmy in the Timmy Time studio, and he
narrates a tour of what is new.

## Context

- **What it shows** is the redesign: [the release](2026-11-06-redesign-release.md) (its PR's "What changed" is the
  list, round 2 included) and the About page (`about/index.html`), which lists every feature students can see.
- **Timmy's voice** already exists: the Timmy Time episodes are made with Kokoro, a pronunciation lexicon, synthesized
  music and mastering in `tools/podcast/` (its `README.md`; `LORE.md` is who Timmy is and how he talks;
  [narrate-with-kokoro](../how-to/narrate-with-kokoro.md)). Use the same voice and the same lexicon, so the trailer
  sounds like the show. Read [podcast-intro](../rules/podcast-intro.md) and
  [podcast-reactions](../rules/podcast-reactions.md) first: they say how Timmy opens and sounds.
- **The studio doesn't exist as a drawing yet.** Timmy in headphones is drawn (the Timmy Time card on the dashboard and
  on a hub's Home, `widget/pet.js`'s Timmy, the site art in `tools/figures/site/`), but there is no studio scene: it has
  to be drawn, in the site's style, with the site art's tools
  ([every-hub-gets-its-own-art](../rules/every-hub-gets-its-own-art.md) says how the site's art is made).
- **Footage comes from a preview, never the live site** ([preview-and-release-test](../rules/preview-and-release-test.md),
  [learner-data-privacy](../rules/learner-data-privacy.md)): `node tools/preview/serve.js` runs the whole site on
  made-up data with made-up names (`?persona=returning`, `high-xp`...). The live leaderboard, classroom and idea board
  show real classmates' names, which must not be in a video. A scripted browser (Playwright, preinstalled) can record
  the screen, and `ffmpeg` is installed for cutting it together with the voice and music.
- **No course material in it** ([graded-coursework](../rules/graded-coursework.md)): a question or a page of notes on
  screen is the hub's own writing, which is fine; slides and recordings are not.
- **Size:** GitHub Pages stops at 1 GB and the site is at 526 MB after the release
  ([archived-hubs-drop-their-audio](../rules/archived-hubs-drop-their-audio.md)). A 90 second video at phone quality is
  10 to 20 MB, which fits; check with `node tools/ci/size.js`.

## Sam's calls to ask for before building (one message, then go)

1. **Where it plays:** a card on the dashboard (plays on a tap, never by itself), a link to send the class, or both? If it
   is on the site it gets an About page entry ([about-page](../rules/about-page.md)) and, like every page, works with
   sound off (captions) and with reduced motion (a still with a Play button).
2. **Shape:** wide (16:9, a laptop) or tall (9:16, a phone, the way most of the class opens the site)?
3. **The script:** Sam reads and approves Timmy's lines before the voice is rendered (the list of features to show, in
   the order Sam wants them).
4. **Music:** the Timmy Time theme under it, or new?

## Done when

- [ ] Sam has answered the four calls above, and they are in [decisions](../decisions.md)
- [ ] The script is written (60 to 90 seconds read aloud) and Sam has approved it
- [ ] The studio scene is drawn, with Timmy close up for the opening
- [ ] The feature shots are recorded from a preview on made-up data, phone and laptop as the shape needs
- [ ] Timmy's narration is rendered in the show's voice, with captions that match it word for word
- [ ] The video is cut (60 to 90 seconds), and Sam has watched it and said yes
- [ ] It is where Sam asked for it (on the site: the About page entry, reduced motion, the size check; a link: the file
      handed to Sam)
- [ ] `DEPLOY_NOTES.md`, and this note's Outcome

## Log

- 2026-11-13 (Claude Code, the release session). Written from Sam's ask, as a task for a session of its own: the
  release session is holding for Sam's "merge" and its PR should stay the release and nothing else. Nothing built.

## Outcome
