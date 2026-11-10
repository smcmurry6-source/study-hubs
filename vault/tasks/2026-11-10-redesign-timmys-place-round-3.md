---
type: task
status: in-progress
hub: widget
created: 2026-11-10
requested-by: Sam
due: 
waiting-on: 
agent: Claude Code
pr: 
---

# Timmy's place, the shop and the rewards art: Sam's third round of feedback

## Goal

Sam looked at the design page after the second round ([Timmy's place](2026-11-06-redesign-timmys-place.md), PR #289, and
[the bowling egg](2026-11-06-redesign-bowling-egg.md), PR #291) and sent the list below. Fix the art, add what's missing
and change how unlocks, seasons and the shop work, on the design page first, then show Sam before anything goes into
`widget/pet.js`, `widget/eggs.js` or the live hubs.

## Where the work stands (2026-11-10)

- **PR #289** (`claude/timmys-place-art-design-r3inwl`): Timmy's place on the design page, plus the shop catalog in
  `migration_v54.sql` (unapplied) aligned with the art. Green, not merged, waiting for Sam.
- **PR #291** (`claude/bowling-egg-r3inwl`, stacked on #289): the bowling egg's eight clips. Green, not merged; its
  hosted preview is `https://pr-291.study-hubs-preview.pages.dev/tools/preview/design/` (the whole design page, both
  sections).
- **Start from #289's branch** (or from `main` once #289 is merged). Other chats work in `widget/hub.js` and
  `widget/ranks.js`: check `git log` on `main` before touching them.
- The kit: `tools/figures/site/place.mjs` (homes, scenes, yard, outfits, rank statue, pennants, rarity frames, the coin),
  built by `node tools/figures/site/build.mjs` into `tools/preview/design/place.js`; the page code is the place block in
  `tools/preview/design/design.js` and the `tp-*` rules in `design.css`. The rewards art (the streak flame, the XP spark)
  is `tools/figures/site/rewards.mjs`; the emblems are `emblems.mjs`; the bowling clips are `bowling.mjs`.
- Rules that matter most: the house style in [every-hub-gets-its-own-art](../rules/every-hub-gets-its-own-art.md)
  (drawn SVG in Timmy's ink style, no emoji, nothing generated), [preview-and-release-test](../rules/preview-and-release-test.md),
  [learner-data-privacy](../rules/learner-data-privacy.md) (visiting someone's Timmy), [about-page](../rules/about-page.md),
  and the lore rules in [podcast-reactions](../rules/podcast-reactions.md) (`tools/podcast/LORE.md`).

## Sam's list (2026-11-10, in Sam's words where they're short)

**Questions and rewards (the design page's question card and rewards art):**
- [ ] Make "Why each choice" collapsed by default. (`widget/hub.js` already folds it; the design page's own card,
      `design.js` around `var whys`, draws it open.)
- [ ] An animation when you tap the thumbs up or down on "Good question?".
- [ ] The XP text color a shiny gold.
- [ ] The streak flame turns blue at 10 days and Dark Matter at 30 days.
- [ ] The tooth in the Perio hub emblem looks odd: redraw it (an exception to the live hubs' art approved on 2026-11-06).
- [ ] The gold crown currency logo looks closer to a chef's hat: redraw it as a dental crown.

**Timmy himself:**
- [ ] Timmy waves now and then, and when you tap him.
- [ ] His speech bubbles come from Timmy, not the top middle of the picture.

**The scenes:**
- [ ] The land around the house rises in a gradual hill, not a semicircle poking up from the ground; the seaside scene
      the same, more like an island.
- [ ] Seaside: the sun sits in the middle of the sky, and the water-to-sky transition looks wrong.
- [ ] Above the clouds: the cloud looks more like snow than a cloud.
- [ ] Starlight: the planet doesn't make sense.

**The homes:**
- [ ] The cottage is labeled "Default", not "Free".
- [ ] The castle looks off and could be better; the treehouse roof doesn't line up; the beach hut's roof the same; the
      observatory's telescope looks odd.
- [ ] The igloo has grass on top of it.
- [ ] The house upgrades must not break what's already there: they mess up the handpiece and the toothbrush. And the
      handpiece doesn't look like a handpiece.

**The yard:**
- [ ] The garden more detailed.
- [ ] The swimming pool's water overlaps the side of the pool.
- [ ] The hammock's pillow doesn't mesh.
- [ ] The mint fountain becomes a **mouthwash fountain**, and its water stops abruptly at the top.
- [ ] A dog when you have the doghouse; the chew toy more detailed.
- [ ] The tooth used on the bowling lane, the mailbox and the pennant has a chunk taken out and looks squished.
- [ ] The mailbox's flowers better.
- [ ] The sandcastle's towers don't look right.
- [ ] The beach chair doesn't look like a beach chair.
- [ ] The bowling lane decoration uses the sugar-free mint as its ball (as the bowling egg does).

**Hub mastery:**
- [ ] A better way to show hub mastery that scales to many more hubs; the pennants don't show up well.

**Unlocks, seasons and the shop:**
- [ ] Every **full rank-up** (not the I, II, III tiers) unlocks a decoration, an outfit and a house.
- [ ] Every season gets a full set of cosmetics in the shop: **1 house and 1 scene per season (both Legendary)**, and a
      Rare, Epic and Legendary of everything else. They're limited time; at rare intervals a random selection of
      seasonal items comes back to the shop. **Seasons that have already passed are unlocked for everyone by default**
      (Sam: "i think this only includes halloween").
- [ ] The shop has **daily and weekly items**, and a **seasonal section** while a season is on.
- [ ] Overall: more outfits, scenes, houses and everything.

**Visiting:**
- [ ] Users can visit someone else's Timmy.

**A question for the agent to answer Sam:** "Are there any more seasons or holidays we need to incorporate?" Today's
are in `holidayId()` and `isFall()` in `widget/pet.js` (Halloween, Thanksgiving, winter, New Year, Valentine's, Dentist's
Day, St. Patrick's, Easter, fall), matched by `sh_season` / `sh_is_fall` in `migration_v54.sql`. Propose candidates that
fall in the school year (with their dates), and ask Sam which to add before drawing their sets.

## Calls to bring to Sam before building

- **Visiting**: how a student finds someone (the leaderboard name, a link, friends?), whether it's opt-in, and what a
  visitor sees. Per-person rows never leave the database except the person's own, so the server needs a function that
  returns only what a place shows (the home, scene, yard, outfit, rank, mastery) for someone who chose to be visitable,
  by their leaderboard name, and nothing that identifies them further ([learner-data-privacy](../rules/learner-data-privacy.md)).
- **Rank-up unlocks**: which decoration, outfit and house each full rank gives (the ladder is in
  [game-server](../reference/game-server.md) and [the journeys](2026-11-06-redesign-progression-journeys.md)); whether
  they're free unlocks or also in the shop.
- **Seasonal returns**: how often "rare intervals" is (for example one seasonal item in the daily picks a few times a
  month), and whether a returning item keeps its price.
- **Mastery**: the new display (for example a trophy shelf or a wall plaque by the door with one gem per hub, or a
  banner that lists them on tap) and what a Crown adds.
- **Past seasons unlocked**: whether that means every past season since the game layer's release, or only Halloween
  2026, as Sam said.

## Sam's answers (2026-11-10, AskUserQuestion)

- **New seasons**: Spring (Mar 20 - May 31, when no holiday is on) and Summer (Jun 1 - Sep 21), each with a full set, the
  way fall has one. No deep-winter season.
- **New holidays**: Tooth Fairy week (Feb 22-28), Mardi Gras (the week through Fat Tuesday) and the Fourth of July
  (Jul 1-4), each with a full set.
- **A full set** is 1 house and 1 scene (both Legendary) and a Rare, an Epic and a Legendary outfit and yard thing:
  8 pieces a season (the agent's reading of "everything else"; Sam didn't change it).
- **Short holidays** (Dentist's Day, New Year, St. Patrick's, Valentine's): the set is on sale for the 7 days ending on
  the holiday's last day. Timmy's own outfit days stay as they are.
- **Past seasons**: only Halloween 2026's set is free for everyone, whenever the release is.
- **Visiting**: "Its on by default and you visit from the boards". Anyone on the boards can be visited from their name
  there, with a switch to turn it off. A visitor sees only the place under the leaderboard name.
- **Rank-up unlocks**: "I want it to be timmy outfit and a decoration only. Do rank only": each full rank-up gives an
  outfit and a decoration (no house), earned by rank and never sold.
- **Seasonal returns**: two throwback days a month, the same for everyone: a "Back for today" shelf of 3 random
  out-of-season items at their usual price.
- **Mastery**: draw two (a trophy case by the door and a wall plaque with gems) and Sam picks from screenshots.

## Done when

- [ ] Every item in Sam's list done on the design page (or answered, where it's a question), with screenshots to Sam in
      light and dark, laptop and phone, and the hosted preview if Sam asks for one
- [ ] The server follows: `migration_v54.sql` (still unapplied; check `supabase/pending-migrations.txt`) gets the rank
      unlocks, the seasonal sets and their rotation, the shop's daily, weekly and seasonal shelves, the mouthwash
      fountain's id, the visiting function, and their tests in `tools/release/xp.js` (and `rls.js` for visiting)
- [ ] `node tools/figures/site/build.mjs --check`, `node tools/ci/syntax.js`, `node tools/ci/vault.js`, the database
      suites, and the smoke test pass
- [ ] Vault written back: this note's Log and Outcome, [decisions](../decisions.md),
      [Timmy's place](2026-11-06-redesign-timmys-place.md), [the shop](2026-11-06-redesign-timmy-shop.md),
      [game-server](../reference/game-server.md), `DEPLOY_NOTES.md`

## Log

- 2026-11-10: written from Sam's list in chat (Claude Code, the session that made PRs #289 and #291), so the next chat
  can start from it.

## Outcome

Related: [Timmy's place](2026-11-06-redesign-timmys-place.md) · [Timmy's shop](2026-11-06-redesign-timmy-shop.md) ·
[the bowling egg](2026-11-06-redesign-bowling-egg.md) · [the journeys](2026-11-06-redesign-progression-journeys.md) ·
[phase 4](2026-11-05-redesign-phase-4-game-layer.md) · [game-server](../reference/game-server.md)
