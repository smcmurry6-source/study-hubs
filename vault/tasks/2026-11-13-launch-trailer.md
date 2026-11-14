---
type: task
status: review
hub: site
created: 2026-11-13
requested-by: Sam
due:
waiting-on: Sam (watch the first cut and say yes, or what to change)
agent: Claude Code
pr: https://github.com/smcmurry6-source/study-hubs/pull/360
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

- [x] Sam has answered the four calls above, and they are in [decisions](../decisions.md)
- [x] The script is written (60 to 90 seconds read aloud) and Sam has approved it (Sam read the draft and said "Make it
      shorter, but just spend less time on the cosmetic extras", then on the first cut "you can make it a bit longer to
      explain things a little better": `tools/trailer/script.md`, 70 seconds of speech; Sam's yes to the video is the
      yes to its final wording)
- [x] The studio scene is drawn, with Timmy close up for the opening (`tools/trailer/studio.mjs`)
- [x] The feature shots are recorded from a preview on made-up data, phone and laptop as the shape needs (laptop: Sam
      chose wide)
- [x] Timmy's narration is rendered in the show's voice, with captions that match it word for word
- [ ] The video is cut (60 to 90 seconds), and Sam has watched it and said yes (the second cut, 90 seconds, went to
      Sam on 2026-11-14 and waits for the yes)
- [ ] It is where Sam asked for it (a link: the file handed to Sam). The second cut is handed over; the final file
      follows Sam's yes
- [x] `DEPLOY_NOTES.md`, and this note's Outcome

## Log

- 2026-11-13 (Claude Code, the release session). Written from Sam's ask, as a task for a session of its own: the
  release session is holding for Sam's "merge" and its PR should stay the release and nothing else. Nothing built.
- 2026-11-14 (Claude Code). Sam's four calls, asked in one message: **a link/file only** (nothing on the site), **wide
  16:9**, the script **"Make it shorter, but just spend less time on the cosmetic extras"**, **new music**; and, with
  the task: "Its okay to use real usernames from the class. They arent real names". Built `tools/trailer/` (its
  `README.md` says how each step works) and sent Sam the first cut: 70 seconds, 1920 x 1080, 16.6 MB, captions burned
  in, with `.vtt` and `.srt` files beside it. The branch starts from the release branch, because the pages the trailer
  shows aren't on `main` until the release merges.
- 2026-11-14 (Claude Code), the second cut. Sam on the first: "This needs to feel professional and polished like it
  could have been released as a real trailer", then "I just redesigned the customize timmy window. Everything else in
  the hubs should be the same. Also you can make it a bit longer to explain things a little better". The release
  branch was brought in (the new place window), the script got a line on what each feature does, and the picture was
  rebuilt: every frame is now drawn in one page (`compose.mjs`), with the recorded pages inside it at 2560 x 1440 so a
  camera can push in on each feature. 90 seconds, sent to Sam.
- 2026-11-14 (Claude Code). Sam, on the first cut again: "Also the scrolling in the demo looked a little jittery". The
  recorder played the pages against the clock and caught 20 to 23 frames a second on the heavy ones. It now records
  **a frame at a time**: the page's clock is stopped and moved on exactly 1/30 s for each frame, and scrolls and the
  pointer are set once a frame, so every move lands evenly (`record.mjs`; only the Listen shot, which plays sound, is
  still recorded in real time). Every chapter was recorded again for the second cut.

## Outcome

**The second cut is with Sam; the task stays open until Sam says yes** (or says what to change).

- **What it is** (90 seconds, 1920 x 1080, 23 MB): black; the ON AIR lamp flickers on in the dark studio; the camera drops to
  Timmy close up as the lights come up ("Hey. It's Timmy. And this is not Timmy Time."), the wall soft behind him, and
  pulls back while he talks; a "Rebuilt." title card on the music's first hit; then six chapters, each behind a
  chapter card (The dashboard; Inside a hub; Notes, three ways; Learn + Flashcards; Ask Timmy; XP + Crowns, Timmy's
  place), the recorded page on a screen the camera pushes in on, Timmy talking in a round booth cam with his line
  beside him; the sign-off back in the studio; the lamp goes off; an end card with the site's address on the last
  chord. The cosmetic extras share one chapter, as Sam asked, and it shows the redesigned place window and customizer.
- **How it is made:** everything is cut to one timeline that comes from the rendered voice, so the captions, his mouth,
  every tap and every camera move follow the words; change a line and run the five steps again
  ([README](../../tools/trailer/README.md)). The voice is the show's (Kokoro, the same blend, lexicon and voice chain,
  read a touch brisker to fit 90 seconds); the music and the sound effects are new, from the show's own synthesized
  instruments, with nothing to license.
- **Not in the repo:** the video and its working files (`tools/trailer/out/`) and the list of leaderboard names
  (`tools/trailer/names.local.json`), both in `.gitignore`. The names on the boards in the video are the class's
  leaderboard names, with Sam's OK; three that read like a person's real name were left out.
- **Staged, and said so:** Ask Timmy's answer on screen. The preview has no model behind it, so the recorder shows a
  two-sentence answer written from Occlusion's own notes (the Bennett angle), with the real citation chip and the real
  jump to the paragraph.
- **Even motion:** the pages are recorded a frame at a time (Sam: "the scrolling in the demo looked a little
  jittery"), so a scroll moves the same amount every frame.
- **Checked:** contact sheets of every shot and of the whole cut, the cuts frame by frame; the captions against the
  script; the sound by its numbers only. **Not checked: how it sounds.** The agent can't hear it, so the balance of
  voice, music and effects is Sam's to judge.
- **Left:** Sam's yes or changes; then the final file to Sam, the last two boxes above, and this note moves to
  `done/`. If Sam later wants it on the dashboard too, that is a new piece of work: an About page entry, a still with
  a Play button for reduced motion, and the size check (the site has room: under 750 MB).
