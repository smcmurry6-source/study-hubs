# The launch trailer

A 94 second video for the day the redesign goes live: it opens on the ON AIR lamp coming on in the dark Timmy Time
studio, drops to Timmy close up, and he narrates a tour of what is new.
[The task](../../vault/tasks/2026-11-13-launch-trailer.md) has Sam's calls (a file to send the class, wide 16:9, new
music, "professional and polished like it could have been released as a real trailer", a little longer so each
feature is explained).

**Nothing here is on the site.** The video, the working files (`out/`) and the list of leaderboard names the footage
shows (`names.local.json`) are never committed (`.gitignore`): the site publishes every file in `main`, and
per-person names stay out of the repo ([learner-data-privacy](../../vault/rules/learner-data-privacy.md)). This
folder is the script and the tools that make the video again.

## How it is put together

1. **The cold open** (letterboxed): black, the lamp flickers on, the camera drops to Timmy as the lights come up, the
   wall soft behind him, then pulls back through the studio while he talks.
2. **The title card**, "Rebuilt.", on the music's first hit.
3. **Six chapters**. A chapter card wipes across (its number and name), then the recorded page plays on a screen the
   camera pushes in on, with Timmy talking in a round booth cam and his line in a bar beside him, only as wide as
   the words (Sam, on the second cut: "the subtitles gradient takes up too much of the screen").
4. **The sign-off** back in the studio; the lamp goes off; **the end card** on the last chord.

## What is in it

| File | What it does |
|---|---|
| `script.md` | Timmy's lines, in the Timmy Time script format. A `##` heading is a shot; each paragraph is one caption. |
| `voice.py` | Renders each caption in the show's voice (Kokoro, the show's blend and lexicon, a touch brisker) to `out/voice/`. |
| `audio.py` | Lays the lines end to end, writes the new music cue under them (the show's own synthesized instruments) and the sound effects (the lamp, the title's hit, a pass of air under each chapter card), masters `out/audio.wav` and writes `out/timeline.json`: when every caption is spoken, every shot is on screen, the title and end cards land. Everything else is cut to that file. |
| `studio.mjs` | The studio's inside, drawn in the site's ink style, in layers (the wall, Timmy, the desk, the lamp) with its light: the dark room, the lamp's red, daylight from the window, a key light on Timmy. Timmy is `widget/pet.js`'s Timmy with a mouth that can talk. |
| `shots.mjs` | What is on screen in each chapter: a script of taps and scrolls timed to Timmy's words, where the camera looks (`K.cam`), and the chapter cards' names and colors. |
| `record.mjs` | Plays `shots.mjs` in a preview (`tools/preview/serve.js`, made-up data, production blocked) and records each shot to `out/footage/<shot>/` at 2560 x 1440, with its camera moves in `<shot>.cam.json`. **A frame at a time**: the page's clock is stopped and moved on exactly 1/30 s for each frame, so scrolls, taps and animations land evenly (Sam, on the first cut: "the scrolling in the demo looked a little jittery"). The Listen shot plays sound, so it alone is recorded in real time (`REALTIME` in `shots.mjs`). |
| `compose.mjs` | Draws every frame of the picture in one page, from the timeline alone: the studio and its camera, the title and end cards, the chapter cards, the recorded screen with its camera, the booth cam, the captions. To `out/frames/`. |
| `cut.mjs` | Puts the frames and the sound together: `out/study-hubs-trailer.mp4` (1920 x 1080, 30 fps), with `.vtt` and `.srt` captions beside it. |

## Make it again

Needs what a Timmy Time episode needs (`tools/podcast/README.md`: Kokoro and its model files, `ffmpeg`) and
Playwright with Chromium.

```bash
python3 tools/trailer/voice.py        # the lines             (a minute)
python3 tools/trailer/audio.py        # the sound, the timeline
node tools/trailer/record.mjs         # the footage           (12 minutes; --shot notes,ask for some, --sheet for a contact sheet)
node tools/trailer/compose.mjs        # every frame           (25 minutes on 4 cores, 1.5 GB in out/)
node tools/trailer/cut.mjs            # the video
```

Run `record.mjs` with nothing else busy on the machine: its one real-time shot plays against the clock. Change a line in `script.md` and
run all five again: the timeline moves, so the picture is cut again to the voice. `node tools/trailer/compose.mjs --at
3.2,14` draws single frames to `out/stills/` while working on the drawing, and `--from 64 --to 78.4` a stretch.

## What the footage shows, and what is staged

- **A preview, never the live site**: the high-XP test account on fixtures, with the clock set (`NOW` in `shots.mjs`)
  to the afternoon before the Occlusion final. It writes nothing to the class's data.
- **Names**: the preview's boards show made-up names. Sam said the class's real leaderboard names may be in the video
  (2026-11-14: "Its okay to use real usernames from the class. They arent real names"), so `record.mjs` swaps the
  made-up ones for the names in `names.local.json`, in the browser only: a JSON list of display names, read from the
  leaderboard with read-only SQL, kept on the machine that records and never committed. Leave out any that reads like
  a person's real name. Without the file, the made-up names stay.
- **The idea board's notes are made up**: the preview's fixture ideas, without their "Fixture idea:" labels, under
  made-up names (`IDEA_NAMES` in `record.mjs`), never classmates' names, because nobody posted them. The top one
  carries no answer from Sam, which would read as a promise.
- **Ask Timmy's answer is staged**: the preview has no model behind it, so `record.mjs` puts a two-sentence answer
  written from the hub's own notes (`ASK` in `shots.mjs`) where the preview's canned reply would be, with the real
  citation chip and the real jump to the paragraph. Keep it true to the notes if the question changes.
- **No course material**: what is on screen is the hubs' own notes and questions.
- A take is thrown away and recorded again when Timmy's random tap line would give away a secret (`K.retake`).

## Rules that apply

Timmy sounds like the show (`tools/podcast/LORE.md`; the trailer is not an episode, and he says so). The captions are
his words exactly (the letters he spells, "X-P", are shown plain). American English. If the video ever goes on the
site, it needs an About page entry, a still with a Play button for reduced motion, and the size check
(`node tools/ci/size.js`).
