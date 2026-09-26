# study-hubs — instructions for Claude Code sessions

Interactive study hubs for UAB dental school exams, served by GitHub Pages at
https://smcmurry6-source.github.io/study-hubs/ from branch `main`.
Pushing to `main` IS deploying — classmates see it within a minute or two.

@DEPLOY_NOTES.md

The notes above are shared with Cowork/Claude Project sessions. Everything in
them applies here too, except where this file says how a Claude Code session
does it differently.

## Repo map

- `index.html` — dashboard. Hub cards come from the `HUBS` / `CLASSES`
  arrays near the top of the script; add or archive a hub there, not in markup.
- `hubs/<hub-id>/index.html` — one single-file hub each. `hubs/<hub-id>/audio/` holds
  its Kokoro narration (`<lecture>-full.mp3`, `<lecture>-plain.mp3`).
- `widget/v3.js` + `widget/v3.css` (+ `widget/eggs.js`, the easter eggs, `widget/clicks.js`, click analytics, and `widget/ranks.js`, handpiece ranks) — shared cross-hub layer (search, class stats,
  streaks, leaderboard, analytics, `shTTS`, `shMindMap`). Cross-hub features go
  here, never hand-patched into one hub.
- `review/` — admin analytics page (its **Recap** tab makes the shareable end-of-hub image; offer Sam one
  whenever a hub is archived, and add the hub to `ARCHIVE_BANK` there once its bank is in `question-banks/`).
  `question-banks/` — archived hubs' banks.
- `migration_v*.sql` — Supabase schema history (project `thytmzsgymydbzcqdnix`).
  New migrations are run once, by hand, in the Supabase SQL editor.
- `deploy_rollout.py` / `.ps1` — the Cowork-era API deploy scripts. A Claude Code
  session doesn't need them: use git.

## How to ship a change (Claude Code)

1. Start from a fresh `main` (`git fetch && git rebase origin/main` before pushing if
   the session has run a while — other Claude Projects push here too).
2. Make the change on your branch. Cloud sessions can only push their own
   `claude/...` branch; that's fine — open a PR and Sam merges it to publish.
   In a local session, still prefer a branch + PR over pushing `main` directly.
3. Verify before pushing (see below).
4. In the PR description, write what changed in plain, student-facing language.
5. After merge, add a line to "Recent major changes" in `DEPLOY_NOTES.md` for
   anything non-trivial, and log it to the site changelog (below) if students
   would notice it.

Never force-push `main`. If a PR conflicts, rebase and resolve deliberately —
don't take one side wholesale; the other side is usually another session's work.

## Verify before pushing

GitHub Actions runs `.github/workflows/check.yml` on every PR: `node tools/ci/syntax.js`
(every inline script parses, no conflict markers) and `node tools/ci/smoke.js` (headless click-through
of the dashboard and every hub on desktop and phone, plus a question-bank lint: duplicate ids, answer
ranges, missing explanations, missing narration files, and the correct answer being the longest choice
in more than 40% of MCQs). Run both locally before pushing; the smoke test needs Playwright
(`PLAYWRIGHT_PATH`/`CHROMIUM_PATH` env vars point it at a preinstalled copy). The lint reads a hub's
data by injecting a hook just before `window.SH_EXPORT = {`, so keep that line at the end of each hub script.

- `node --check` on each hub's extracted `<script>` block(s) and on `widget/v3.js` / `widget/eggs.js` / `widget/clicks.js` / `widget/ranks.js`.
- Question / lecture counts match what you expect; no duplicate ids.
- Grep that the feature you added (and anything from a merged-in branch) is present.
- Conflict markers: search line-anchored (`^<<<<<<<`, `^=======$`, `^>>>>>>>`) —
  the hubs' CSS uses long `====` comment dividers.
- If both `widget/v3.js` and `widget/v3.css` changed, make sure both are committed.
- Smoke test with Playwright against the file (`file://.../hubs/<id>/index.html`),
  clicking through each mode tab. The Supabase-backed widget parts only work live.

## Text and audio must never drift

Hubs with pre-generated narration (see `hubs/*/audio/`): editing a lecture's
text at either level (As taught / Plain English) means regenerating that
level's mp3 in the same PR.

Kokoro TTS setup (cloud sessions can only download GitHub release files from
repos attached to the session, so the model is re-hosted on this repo):

```bash
pip install kokoro-onnx soundfile
mkdir -p /tmp/kokoro && cd /tmp/kokoro
gh release download kokoro-model-v1.0 -R smcmurry6-source/study-hubs \
  || for f in kokoro-v1.0.onnx voices-v1.0.bin; do
       curl -fL -o "$f" "https://github.com/smcmurry6-source/study-hubs/releases/download/kokoro-model-v1.0/$f"; done
```

```python
from kokoro_onnx import Kokoro
k = Kokoro("/tmp/kokoro/kokoro-v1.0.onnx", "/tmp/kokoro/voices-v1.0.bin")
samples, sr = k.create(text, voice="af_heart", speed=1.0, lang="en-us")
```

Encode to mp3 (ffmpeg or lameenc). ~20–30 chars/sec on one CPU — for many
lectures, shard the job and skip files that already exist. Keep the job in the
foreground/polled; an idle cloud VM is reclaimed and background work is lost.

## Usage data and surveys

To decide what to improve or cut, read the data before guessing (Supabase connector, read-only SQL):
`activity_pings` (time per `<mode>/<sub-view>`, 25 s per ping), `ui_clicks` + `ui_click_reach` (clicks per
button/tab and distinct people, per day), `question_stats` / `question_choices` (accuracy, popular wrong answers),
`mode_stats`. The admin page (`review/`) shows the same under Time by section, Clicks and Questions.
Surveys: one live at a time on the dashboard, shown once per visitor. Publish from `review/` → Surveys, or
`admin_upsert_survey(p_secret, p_slug, p_title, p_questions, p_active)` with 1-3 questions
(`kind`: choice | multi | scale | text). Results: `get_survey_results(p_secret)`. Ask Sam before a survey goes live.

## Secrets

This repo is public. Never commit keys or tokens, and never put the admin
secret in client-side JS. In cloud sessions they come from the environment:

- `SB_KEY` — Supabase publishable key (also fine as an API credential on
  `thytmzsgymydbzcqdnix.supabase.co`, which opens network access to it).
- `ADMIN_SECRET` — for gated RPCs such as `log_changelog(p_secret, p_hub, p_message)`.

If they're missing, skip the changelog step and tell Sam rather than hunting
for them. Check Supabase reachability first:
`curl -sS -o /dev/null -w "%{http_code}" https://thytmzsgymydbzcqdnix.supabase.co/rest/v1/`
(401 = reachable, no key).

## Content from lecture materials

Lecture slides, PDFs and recordings are NOT in this repo and must not be
committed (public repo, course material). If a task needs them, ask Sam to
run it as a local session or provide the text.
