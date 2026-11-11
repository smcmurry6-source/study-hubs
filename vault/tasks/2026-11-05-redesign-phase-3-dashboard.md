---
type: task
status: in-progress
hub: dashboard
created: 2026-11-05
requested-by: Sam
due: 
waiting-on: Sam's yes on the recap's redrawn contact sheet, and Sam's look at the classroom and the stage; the idea board (a second session)
agent: Claude Code
pr: https://github.com/smcmurry6-source/study-hubs/pull/318
---

# Redesign phase 3: the dashboard and the About page

## Goal

Rebuild `index.html` on the design system: the next exam and Start studying first, the hubs as tabs with their emblems and tints, one "you" card (Timmy's house, rank, mastery; the rank card and the house merged), the class board with When people study as a line under it, the recaps slideshow for archived hubs, the podcast card per hub; "Correct in a row" cut. The About page rewritten for every feature that changed.

## Context

- The plan and Sam's decisions: [the redesign audit and plan](done/2026-11-05-redesign-audit-and-plan.md), section 4.
- Rules that matter most here: [preview-and-release-test](../rules/preview-and-release-test.md) (every phase is tier 2 or 3:
  preview link first, screenshots, the release suites, Sam's look), [about-page](../rules/about-page.md),
  [learner-data-privacy](../rules/learner-data-privacy.md), the taste skill in full (Sam, 2026-11-04).
- The dashboard today: `HUBS`/`CLASSES`/`ARCHIVED_HUBS`/`ARCADES` arrays, `#petHome`, `widget/archive.js`, the check-in and survey flows, `widget/tour.js` (the full tour stays in the menu; no prompt on arrival).
- The About page rule: [about-page](../rules/about-page.md).
- **Added 2026-11-06 (Sam)**: [the idea board](2026-11-06-idea-board.md) is part of this phase (a dashboard section and a
  page in a hub's More, `widget/ideas.js`), and the "you" card shows [Timmy's place](2026-11-06-redesign-timmys-place.md)
  (drawn in phase 4, part C). The server side of both is in [phase 5](2026-11-05-redesign-phase-5-backend.md), part 3.
- **Built beside the live dashboard, released with the rest** (Sam, 2026-11-06, [decisions](../decisions.md)): the new
  dashboard is a page next to `index.html` (for example `next/index.html`) that links to the new hub versions, and it
  replaces `index.html` at [the release](2026-11-06-redesign-release.md). The About page's rewrite is drafted in the
  release note and lands with it, since the live About page describes the live site until then.

## Done when

- [ ] The idea board on the new dashboard and in More, with its starting ideas ready to post at the release

- [x] The dashboard on the design system, inspector 0 FAIL at three widths, light and dark
- [x] Check-ins, surveys, notices, luck, the leaderboard, streaks, archive rules and the tour all work on the preview
- [ ] About page lists every changed feature, counts true (drafted in [the release note](2026-11-06-redesign-release.md), "From phase 3"; it lands at the release)
- [ ] CI passes (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`, `node tools/release/run.js`)
- [ ] Preview link, phone and laptop screenshots, and Sam's look ("Sam approved this release" ticked by Sam): the second pass's screenshots sent 2026-11-11, then a third pass asked for; no preview link (on request only)
- [x] Vault written back (hub notes, decisions, `DEPLOY_NOTES.md`, the About page, this note's Outcome)

## Log

- 2026-11-05: written from the agreed plan.
- 2026-11-06: the idea board and Timmy's place added (Sam).
- 2026-11-11 (Claude Code, everything except the idea board): first pass built beside the live dashboard: `next/index.html`
  (sends visitors to the live dashboard outside a preview), `widget/dash.js` + `widget/dash.css` on the design system,
  `next/hubs.js` (the hub list, copied from `index.html` by `tools/dash-next/build.mjs`, checked in CI) and
  `widget/hub-art/dash.js` (every hub's emblem and tint). migration_v54's functions are called through a fallback and
  stubbed in the preview; nothing was applied. Then Sam asked (same day) for a second pass: familiar, but much more
  visually interesting; a better way to show the recaps and who is studying; the What's new log, the arcade scores and
  the When people study card out ([decisions](../decisions.md), four rows dated 2026-11-11).
- 2026-11-11 (Claude Code, **hand-off of the second pass**). The second pass is built and in the PR. Everything on the
  page except the idea board works; Sam has since asked for a third pass (next entry).
  - **What's on the page**, top to bottom: the top bar (studying-now count, streak, rank, Inbox, Settings, menu); the
    hubs as tabs; the open hub as a stage (its masthead scene, the days left on a flip tile, a bead for each day up to
    14, a progress ring, Start studying, Daily drill, luck, then the hub's blurb, Timmy Time card and check-in buttons);
    "You" (name, Timmy's house, rank, medals, streak with the week as dots) beside "The class" (the studying-right-now
    tile with a chip per hub, then the leaderboard: ranks or streaks, top three on a podium); the idea board's slot;
    Past hubs (each finished exam's recap as a live infographic with Save image, then the hubs that just closed).
  - **Left for others.** The idea board: its section is `section#ideas[data-sh-ideas]`, hidden until something fills it,
    between the two cards and Past hubs; `widget/dash.js` adds a tour step for it when it is visible, and the smoke test
    expects it to exist. Phase 4: Timmy's place goes where `#petHome` is in the "You" card, and visiting hangs off
    `data-visit` on each board row (the podium included). Journeys and the shop aren't on the page.
  - **Calls I made** (say if any is wrong): the two-weeks study strip became seven dots; Font, Background sound and
    Accent are not in the dashboard's Settings (one typeface in the redesign; Focus mode is); the tour never asks on
    arrival, it is in the menu with the page's own steps (`window.SH_TOUR.steps`, a small hook in `widget/tour.js`); the
    class's easter egg moved from the class icon to the hub's scene; the sections are in a new order (Sam: "we don't
    necessarily need to keep the same order"); the shared widgets load after the page is drawn (`LATE` in `dash.js`).
  - **No new art was drawn**, so there was no contact sheet: the page uses the hubs' mastheads and emblems, the flame,
    the rank art, Timmy's house and the Timmy Time spot. Drawn art for the sections (a podium, the studying-now tile) is
    a possible follow-up, contact sheet first.
  - **Inspector** (`inspect.mjs --app --allow rainbow-chart`, desktop, tablet and phone, light and dark): 0 FAIL, 1 WARN.
    `rainbow-chart` is allowed because the inspector counts Timmy's house, an inline drawing, as a chart. The WARN is
    `below-fold` (3 of 7 blocks start on the first laptop screen): the hub's scene is big on purpose, and the first
    screen holds what the page is for (which exam is next, how long, Start studying).
  - **Not as good as the live page:** first paint on the slow-phone profile is about 2.3 s (the live dashboard's budget
    is 1.5 s; `next/` has its own budget of 3.5 s in `tools/release/budgets.json`). It was 3.1 s before the shared
    widgets moved to late loading. Worth another look before the release.
  - **Bugs** found and fixed while building: BUG-060 to BUG-064 in the [bug log](../release/bug-log.md).
  - **The switch and the About page draft** are in [the release note](2026-11-06-redesign-release.md), "From phase 3".
  - **Checks** on the second pass (commit f1264f6): `node tools/release/run.js`, all 14 suites passed (syntax, vault,
    archive, secrets, the smoke test on every hub, preview safety, the four database suites on a throwaway copy, the
    admin page, accessibility with 0 axe issues on the dashboard's three new screens, performance, devices). A scripted
    walk-through on the preview, 41 checks, all passed. The three `dashboard/next` screens aren't in the a11y baseline
    yet (`a11y.js --update` at the release).
- 2026-11-11 (Claude Code, **third pass, waiting on Sam**). After the second pass's screenshots Sam asked for three more
  things ([decisions](../decisions.md)): the studying-now tile as a fully drawn, animated classroom (the total shown;
  a Timmy for each person studying, wearing what that person has him dressed as; they walk in and sit, or get up and
  leave); the leaderboard and its pedestals "more epic"; and the recap infographics are "boring". New art goes to Sam
  as a contact sheet first, so nothing of this is in the page yet. Sent as three contact sheets, made-up data:
  1. **The classroom**: a room kit (board with the total and a count per hub, clock, windows that turn to night by the
     viewer's clock, poster, door, lamps, plant), desks whose fronts take their hub's color, rows that grow with the
     crowd (two big rows, then three, four; past that the board says how many more are in the hall), the walk-in frame
     by frame. Two sizes: today's height (Timmy about 26 px wide) or 50 px taller (about 38 px, my pick).
  2. **The leaderboard as a stage**: curtains, spotlights, a sunburst, gold, silver and bronze blocks with drawn
     numerals and wreaths, a crown over first place, torches, confetti; the top three as their own Timmys in their
     outfits; places 4 to 10 as dark rows with a bar against first place.
  3. **The recap as an illustrated poster**: the hub's scene across the top, hours per day as a mountain range with the
     exam's flag on the last peak, the classmates as a crowd of teeth, the facts as badges (existing trophy art).
  - **Where the art is**: not in the repo until Sam says yes. The scratch kits are written the way `tools/figures/site/`
    kits are (`classroomKit`, `stageKit`, `recapKit`: one function each, Timmy's ink, no ids, gradients or `<text>`), so
    they move in as `tools/figures/site/classroom.mjs`, `stage.mjs` and `recap.mjs` and get built into
    `widget/hub-art/dash.js` (or a file of their own, loaded late). If this session ends first, the next agent redraws
    from the three sheets (Sam has them) and this description.
  - **What the classroom needs beyond art** (not built yet):
    - *Each studier's outfit.* The dashboard already listens to each hub's presence channel (`presence:<hub>`,
      `widget/v3.js` tracks `{ online_at }` under a random key). The plan: the hub adds its Timmy's outfit id to that
      payload (nothing else: no name, no visitor id), and the dashboard draws one Timmy per presence key. Until the shop
      is released (migration_v54, phase 5) the only outfit anyone has is the day's holiday look; after it, it is
      `pet_equipped.outfit`. Timmy off or Focus mode: a plain tooth. That is a change to the live shared widget and a
      new thing shared between browsers, so it needs its line in [event-taxonomy](../reference/event-taxonomy.md) and
      the About page's "What the hubs record" ([learner-data-privacy](../rules/learner-data-privacy.md)), and Sam's OK.
    - *The outfit art at run time.* The 55 outfits are in the place kit (`tools/figures/site/place.mjs`, `OUTFITS`,
      `dress()`), which so far is only built into the design page (`tools/preview/design/place.js`). The dashboard needs
      `dress()` and the outfits in a widget file (phase 4 wires the whole kit; the classroom needs only that part).
    - *The podium's Timmys* need the top three's outfits: the `_v2` boards (pending migration_v54) would return each
      row's outfit id, null for someone who turned visiting off. A change to a pending migration: phase 5's to make, or
      this session's with Sam's OK.
    - Motion: the walk is a hop (Timmy has no legs: he sits in his gum cushion); reduced motion and "Answer animations"
      off show people at their desks with no walk.

- 2026-11-11 (Claude Code, **third pass built: the classroom and the stage**). Sam on the sheets: "b, yes, yes, the
  mountain range doesnt read as a bar graph and it also also needs to fit in a smaller card, yes"
  ([decisions](../decisions.md)). So the classroom (50 px taller) and the stage are in the page; the recap is not.
  - **The classroom** (`#now`, `syncRoom()` and its helpers in `widget/dash.js`; art `tools/figures/site/classroom.mjs`):
    150 px tall, 170 on a phone. The count and the three busiest hubs are HTML laid over the drawn chalkboard
    (`placeBoard()`; a narrow board stacks them), so screen readers get the same words as before, every hub included. One
    Timmy per presence key, at the next free desk from the front row's middle outward, the desk's front in the hub's
    tint. Coming and going is `walk()`: a wrapper group moved with the Web Animations API from the door along the
    aisle in hops, then an arc into the seat (the reverse to leave), the door open while someone is in it, 450 ms
    apart. The count changes at once, the Timmy catches up. More than six changes at once, a hidden tab, reduced
    motion or "Answer animations" off: no walk. Focus mode on the viewer's side: the plain count tile. Rows are added
    when needed and taken away only with two desks to spare; past six rows (or desks too small) a sign by the door says
    "+N in the hall". Night is 7 pm to 6 am by the viewer's clock.
  - **Whose outfit.** Each hub tab sends `fit` with its presence (`trackPresence()` in `widget/v3.js`, `shPet.fit()` in
    `widget/pet.js`): `<holiday>:<outfit>` today, empty before Timmy is adopted, with him off or in Focus mode. No name,
    no id, not stored. **This is the one live change in the PR**; it is on the live About page ("What the hubs
    record"), in [event-taxonomy](../reference/event-taxonomy.md) and [analytics-retention](../reference/analytics-retention.md).
    The dashboard treats `fit` as untrusted: `cleanFit()` keeps only `[a-z0-9:-]`, and it is used only to look an outfit
    up (`fitOutfit()` in pet.js for a holiday one, `SH_OUTFITS.parts` for a shop one), never written as markup. The
    smoke test sends markup as an outfit and fails if it is drawn. After the shop's release `fit()` should send the
    equipped shop outfit's id ([release note](2026-11-06-redesign-release.md), step 9); the dashboard already draws those.
  - **The stage** (`stageSvg()`, `paintBoard()`; art `stage.mjs`): the top three stand on drawn blocks as Timmys; their
    outfits come from `get_place` through each row's visit key (`loadFits()`), only when the game layer exists, so no
    change to migration_v54 was needed. Someone with visiting off, and everyone until v54 is applied, is a plain Timmy.
    Names, ranks and XP are HTML under the stage; places 4 to 10 are rows on the dark floor with a bar against first.
    The streaks board uses the same stage with flames. The board is drawn again when the card's width changes.
  - **The art files**: `tools/figures/site/classroom.mjs`, `stage.mjs`, `recap.mjs` (kits: one function each, checked in
    `build.mjs`), written into `widget/hub-art/class.js` (the room and the stage; **not** the recap until Sam's yes) and
    `widget/hub-art/outfits.js` (the shop's 55 outfits and `dress()` from `place.mjs`; loaded when first needed).
  - **The preview** has a made-up class of 4 to 16 that comes and goes every 7 seconds on the dashboard, some in shop
    outfits, and a `get_place` stub; `shDash.setLive(by, list)` is how it (and the smoke test) feed the room.
  - **The recap** is as the second pass left it. Sam on the poster: the mountain range "doesnt read as a bar graph" and
    it "needs to fit in a smaller card". Redrawn as chunky day columns in a compact card (`recap.mjs`: `bars()`,
    `crowd()`) and sent as a new sheet; **waiting for Sam's yes before it goes into the page**. To build it: draw
    `CA.recap.bars()` in place of `.rc-bars` in `drawRecap`'s body, shrink `.rc-body`, add `recap:` back to
    `class.js` in `build.mjs`.
  - **"You" and the class no longer share a bottom edge.** With the stage the class card is about 360 px taller, and
    the streak and answers tiles stretched to match it were mostly empty, so each card ends where its content ends. The
    taste inspector says so as a second warning (`ragged-row`, beside `below-fold`); 0 FAIL, light and dark.
  - **Checked**: see the PR's test report. BUG-065 and BUG-066 found and fixed.
- 2026-11-11 (Claude Code, **preview and UAT**). Sam: "preview". The PR has the `preview` label (the hosted link is in
  the PR's preview comment). UAT in the preview as the returning, new and high-XP accounts, on an emulated iPhone 13
  and a laptop, 25 checks, all passed after two fixes: the classroom fills and empties while you watch; the largest
  text size (too narrow for the drawings: the plain count, and now every name in full, BUG-067); a reload; class data
  Slow and Unreachable (the board now says it couldn't reach the data, BUG-068); keyboard; dark with reduce motion;
  every live hub's old and new page and one archived hub (the outfit that goes out is a holiday look or nothing, and
  nothing with Timmy off); "No request has reached production" at the end.


## Outcome

Not finished. The new dashboard is built beside the live one (`next/`), on the design system, with everything from the
plan except the idea board, and with Sam's second-pass changes; nothing students see has changed
([#318](https://github.com/smcmurry6-source/study-hubs/pull/318), a draft). The third pass's classroom and stage are built
too; the recap's redraw waits for Sam's yes on its contact sheet. One change in the PR is live at merge: each hub sends
its Timmy's outfit with the studying-now presence, with no name or id.
