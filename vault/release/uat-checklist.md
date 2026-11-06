---
type: checklist
tags: [testing, release]
---

# UAT checklist

Manual user-acceptance testing for a substantial change ([RELEASE_TEST_PLAN.md](../../RELEASE_TEST_PLAN.md), sections
7 and 8), in a preview ([preview-a-change](../how-to/preview-a-change.md)), so only when Sam asked for one
([preview-and-release-test](../rules/preview-and-release-test.md)). Copy the core pass and the sections that fit
the change into the PR's test report, tick what you did, and write what you saw. Every problem goes in the
[bug log](bug-log.md). The agent runs it with the scripted browser on emulated devices; Sam doesn't (Sam only looks,
[RELEASE_TEST_PLAN.md](../../RELEASE_TEST_PLAN.md) section 10). Say under Not covered what needs a real device.

## Core pass (every substantial change)

- [ ] The preview's button says "No request has reached production" at the end (it turns red otherwise: an S1).
- [ ] As **returning** on a phone: the dashboard, then each hub the change touches; every mode opens; nothing overlaps,
      nothing scrolls sideways; text is readable at the largest text size in Settings.
- [ ] The change does what the PR says, as a student would find it (from Home, not by a direct link).
- [ ] As **new**: the first-visit tour and empty states still make sense with the change.
- [ ] Reload in the middle of using it: you land where you were, nothing lost.
- [ ] Back and Forward, and the hub's back button, go where you expect.
- [ ] Class data **Slow**, then **Unreachable**: it still works, or says plainly what it can't do.
- [ ] Keyboard only on a computer: you can reach and use the change with Tab, Enter, Space and Escape, and you can always
      see where focus is.
- [ ] Dark mode, and reduce motion on (the phone's setting or the browser's): still readable, nothing flashes or spins.
- [ ] Wording is American English, plain, and right; the About page lists any new feature ([about-page](../rules/about-page.md)).
- [ ] Sam was shown the change before approval: the PR's preview link on its own line, screenshots (phone and
      laptop), a recording if it moves.

## Questions, notes and lectures

- [ ] Every new question answered both right and wrong: the key, the explanation and every "why" line are right and
      match the notes ([every-choice-gets-a-why](../rules/every-choice-gets-a-why.md)).
- [ ] As **missed**: the new questions show up in Questions I missed, the Daily Drill and "Find this in the notes".
- [ ] Filters and High likelihood counts in the Question Bank include the new questions.
- [ ] Narration plays the new text, both levels ([text-and-audio-never-drift](../rules/text-and-audio-never-drift.md)).
- [ ] The mock exam draws from the new lecture.

## A new hub or a lecture added to one

- [ ] The dashboard card, countdown and dates are right; Home's exam card, timeline and "Where to next" are right.
- [ ] **Pretend it's** exam morning, exam evening, the night it archives (10 pm), and ten days later: the card, check-in
      and archived notice change at the right times. As **archived**, an archived hub still opens.
- [ ] The arcade's games all start and end, with the hub's own look ([arcade-skins](../rules/arcade-skins.md)).
- [ ] Diagrams are accurate, labeled and readable at 390 px and in both themes.

## The shared widget (`widget/`) or anything in every hub

- [ ] Every live hub and one archived hub, not only the one you changed.
- [ ] Search, Daily Drill, Stats, Settings, Inbox, Report and Pin work in each.
- [ ] As **high-xp**: rank, trophies and the leaderboard still draw.

## Saving, sync, profiles

- [ ] Answer, pin and rename; the write log shows each save; reload and they're still there.
- [ ] Switch to another account and back: each keeps its own progress.
- [ ] Link my devices still opens and makes a code.

## Ranks, XP, trophies, easter eggs

- [ ] As **high-xp** and **new**: the rank card, level-up and trophy cards, mastery badges.
- [ ] Settings → Extras off really turns it off; none of it appears in a mock exam.

## Admin page (`review/`)

- [ ] As **admin**: every tab loads; resolve a report with a reply (as **returning**, it shows in the Inbox); post a
      notice; hide and restore a comment; publish a survey draft.
- [ ] A wrong secret is refused. The real admin secret was never typed into the preview.

## A Supabase migration (tier 3)

- [ ] `node tools/release/rls.js` passes on the new `supabase/schema.sql`; `rls-expectations.json` changed only if the
      PR says why.
- [ ] On staging, when there is one: the migration applies, the site works on it, and the reverse migration is written.
- [ ] After applying it live: `tools/release/rls-audit.sql` returns no findings.

## The service worker, offline

- [ ] Visit, go offline (airplane mode), reload the dashboard and a hub: they open. Back online: the new version loads.
- [ ] `VERSION` in `sw.js` changed if precached files changed.

## A redesign or a new screen

- [ ] Phone (small and large), tablet both ways, laptop, wide screen; both themes; the largest text size.

Related: [bug-log](bug-log.md) · [release test report template](../templates/release-test-report.md)
