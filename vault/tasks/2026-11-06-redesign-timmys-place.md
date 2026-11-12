---
type: task
status: in-progress
hub: widget
created: 2026-11-06
requested-by: Sam
due: 
waiting-on: Sam (the open calls, 2026-11-12)
agent: Claude Code
pr: https://github.com/smcmurry6-source/study-hubs/pull/289
---

# Timmy's place: the house card, redrawn as a scene you build

## Goal

Sam's idea (2026-11-06): a full redesign of Timmy's house card, more detailed and with a 3D look, where students upgrade the
scene, the house itself and what's around it (a swimming pool, a garden...) and can buy a whole new home: a castle, a giant
mushroom, a treehouse. The shop sells the pieces ([Timmy's shop](2026-11-06-redesign-timmy-shop.md)). Ships with the redesign.

## Context

- Today's card: `houseSvg` in `widget/pet.js`, a 240 x 150 SVG cottage on a hill with a toothbrush by the door and a tree out
  front; decorations grow with the handpiece rank, mastered hubs fly pennants, the yard follows the seasons and holidays.
  The redesign plan puts Timmy and the house on one SVG symbol sheet and on the dashboard's "you" card
  ([the audit and plan](done/2026-11-05-redesign-audit-and-plan.md), 4.5, 4.7; [phase 3](2026-11-05-redesign-phase-3-dashboard.md)).
- Rules that matter most here: [every-hub-gets-its-own-art](../rules/every-hub-gets-its-own-art.md) (drawn by the agent in
  SVG in Timmy's ink style; nothing generated, no emoji), [podcast-reactions](../rules/podcast-reactions.md) (the lore
  rules), [preview-and-release-test](../rules/preview-and-release-test.md), [about-page](../rules/about-page.md).
- Lore: the cottage on a hill is canon (`tools/podcast/LORE.md`). It stays every Timmy's starting home and the podcast's
  Timmy keeps it; a student's own Timmy can move up. Add a line to `LORE.md` saying so.

## The design

- **A 3D look, drawn in SVG**: an isometric scene (the way the anima figures are drawn), in Timmy's ink outline with flat
  tones and depth from overlap and shading, not a 3D engine. It stays in the site's style, stays sharp on a phone and loads
  as fast as a drawing. A little life: smoke from the chimney, water in the pool, leaves, Timmy walking between spots; a
  slight tilt when you drag or tilt the phone. Reduced motion: still.
- **Built from slots, not free placement**, so every combination looks right and nothing overlaps:
  - **The home**: the cottage (free, the start), then shop homes: a castle, a giant mushroom, a treehouse, and more later
    (a lighthouse, a houseboat...). Each home has its own spots for Timmy and its own night lights.
  - **The scene**: the hill (free), then a beach, a forest, a snowy mountain, a night sky with the Dark Matter stars.
  - **The yard**: four to six spots by the home for a garden, a swimming pool, a hammock, a mailbox, a bowling lane (the
    [bowling egg](2026-11-06-redesign-bowling-egg.md) lives there), a doghouse...
  - **Upgrades of the home itself**: windows, a porch, a chimney, a flag, a paint color.
- **What students already earned still shows** on any home and scene: the rank decorations (now one set per journey: the
  ModuPro on the porch, Timmy in loupes: [the journeys](2026-11-06-redesign-progression-journeys.md)), the mastery
  pennants, the seasons and the holiday props, Timmy's mood and HP.
- **Two sizes**: a card on the "you" panel (the dashboard and a hub's More), and a full view where you tap a spot to change
  what's there, from what you own, with "Get more in the shop".
- **Light and dark**, and the scene's own day and night by the student's clock.
- **Weight**: the art loads only when the house is on screen (phase 5's on-demand bundle), not with every page.

## Done when

- [ ] The homes, scenes, yard items and upgrades drawn and approved by Sam in a preview (phone and laptop, light and dark),
      starting with the cottage redrawn, the castle, the giant mushroom, the treehouse, the pool and the garden
- [ ] The scene renderer (slots, depth order, the rank and season layers) and the full view built in phase 4, recorded on the
      preview with reduced motion too
- [x] What's placed is kept on the server (`equip_item`, [the shop note](2026-11-06-redesign-timmy-shop.md)) and the same on
      every linked device (the server side, phase 5 part 3; the full view that calls it is phase 4); its five yard spots and
      names follow the art (Sam, 2026-11-06)
- [ ] `LORE.md` and the About page (Timmy's place) updated
- [ ] CI and the release suites pass, perf budgets met (`node tools/release/run.js`)
- [ ] Vault written back (decisions, `DEPLOY_NOTES.md`, this note's Outcome)

## Open calls (2026-11-12, asked before part C, the place as a real client)

Asked in chat on 2026-11-12, before any code; each has the recommendation that gets built if Sam says "yes to all".
Part C is the renderer and the full view (the box above) and the place's share of
[round 3's wiring list](done/2026-11-10-redesign-timmys-place-round-3.md). The shop (part B), the bowling egg (part D),
visiting and "everyone has Timmy" are their own sessions, and none of them blocks part C.

**Where it lives**

- [ ] **The dashboard's "you" card**: the place takes the house picture's spot. Timmy's name, HP bar, status line and
      the three buttons (joke, checkup, secret tip) stay beside it as today; tapping the picture opens the full view.
- [ ] **In a new hub**: a "Timmy's place" tile in More (the card, and the full view from it). Timmy on the bar stays
      as he is.
- [ ] **Only once Timmy is adopted**, as the house card is today, until "everyone has Timmy"
      ([Ask Timmy](2026-11-12-redesign-ask-timmy.md), part 4).

**`widget/pet.js`**

- [ ] **Not touched at all.** The renderer is a new file (`widget/place.js`) that reads what `pet.js` already hands
      out (`shPet.hp()`, `art()`, `fit()`, `holidayId()`), and the new dashboard swaps the picture inside the card.
      What that leaves: Timmy on a hub's bar doesn't wear the outfit he has on at his place until `pet.js` changes,
      which is "everyone has Timmy"'s session (a to-do there).

**Where the notes and the server disagree** (the migration is not changed without Sam's word)

- [ ] **The new seasons and holidays.** Round 3's wiring list says to put them into `holidayId()` / `isFall()`. The
      server's `sh_season` and `sh_is_fall` were left as they are, and `tools/release/xp.js` checks them against
      `pet.js` for every day of three years, so changing `holidayId()` fails that test unless the migration changes
      too. And the kit only draws props by itself for today's eight holidays: Tooth Fairy week, Mardi Gras and the
      Fourth of July exist as shop sets, and spring is a look of the scene. Recommended: leave `holidayId()`,
      `isFall()` and the migration alone; the place gets its own small season function (spring March 20 to May 31,
      summer, fall, the winter look), checked against `sh_shop_seasons` in `xp.js`; the three new holidays show
      nothing by themselves (their sets are the shop's, part B). Or: draw props for them and have Timmy dress up
      (new art, and `sh_season` changes in the migration).
- [ ] **The later journeys' rank sets** (tiers 7 to 20): the catalog's rank rows must be exactly `sets.mjs`
      (`xp.js` fails otherwise), so drawing them means 28 new rows in `migration_v54.sql`. See "Where to cut".
- [ ] **Snack HP** (`get_pet_days_v2`'s `hp`): `pet.js` works HP out from the days and doesn't read that column
      yet; reading it is a change to `pet.js`, and snacks are the shop's. Recommended: part B. At his place Timmy's
      health is the pet's HP as it is today.

**What Timmy owns, with no shop yet**

- [ ] **The customizer shows what you own** (bought, a gift, a rank piece reached) and the free defaults, and the
      rank pieces not reached yet as locked, with the rank that opens each (`locked`). "Get more in the shop" stays
      hidden until part B.
- [ ] **The preview's made-up inventory** (`tools/preview/runtime/preview.js`, answering `get_my_shop`,
      `equip_item` and the bootstrap's `shop` as the migration writes them): Halloween's gift set, the rank sets up
      to the account's rank, and a different handful of bought pieces per test account (one with nothing bought,
      one with a lot, the bowling lane included, for the wide spot).
- [ ] **His outfit**: what's put on at his place wins there; with nothing on he wears what he wears that day by
      himself (a holiday's outfit, a rare costume).
- [ ] **Saving**: each change saves at once through `equip_item` and shows at once; if the server refuses, it goes
      back and Timmy says so. On a database without the game layer (today's) the place shows the defaults with your
      rank and medals, and the customizer isn't offered.

**The journeys' pieces (new art: a contact sheet on the design page first, light and dark, then Sam's yes)**

- [ ] **How a journey shows.** Handpiece: the statue by the door, as approved. ModuPro: the handpiece statue stays,
      in Dark Matter (it's finished), and a ModuPro stands on the porch side of the door in the rank's material, one
      to three steps for the level. Loupes: both stand in Dark Matter and Timmy wears loupes in the rank's material
      (an outfit with its own eyewear wins over them).

**Loading and the budgets**

- [ ] **The kit in pieces.** With every set it is 744 KB (224 KB compressed). Split: the kit itself (about a third)
      and one file per set, fetched only when a piece of that set stands at your place or you open its drawer. All
      of it on first use, never with a page: the hubs' budgets stay at 20, 20 and 18.
- [ ] **The new dashboard is at 30 of 30 requests**, so the place can't draw itself with the page. Recommended: the
      card shows a still of your place kept on the device from last time (today's house picture the very first
      time), and the live place loads at the first scroll, tap or key, or when it's opened. Or: raise the
      dashboard's budget by three requests and about 90 KB (not recommended).

**Tracking**

- [ ] Two feature events, no words and no item names: the place opened, a piece changed (the slot only), with
      their rows in [event-taxonomy](../reference/event-taxonomy.md) and [analytics-retention](../reference/analytics-retention.md).
      Every button carries a fixed label, as the idea board's do.

**A preview?**

- [ ] The box above wants the full view recorded on a preview, reduced motion too. Asked once, here.

**Where to cut**, if part C is too much for one session

- [ ] **First: the ModuPro's and the Loupes' rank sets** (an outfit and a yard piece for each of 14 ranks, 28
      drawings, as much art as three and a half seasonal sets) go to their own art session, with their catalog rows
      then. Nobody is within reach of 125,000 XP, the renderer draws any rank piece the catalog names, so nothing in
      the client waits for them. The ModuPro on the porch and Timmy in loupes stay in part C.
- [ ] **Second, only if it still runs long**: the customizer's camera moves, close-up and "Surprise me" (the dock,
      the drawer and saving stay).

Not calls, how it will work: flame levels 4 and 5 (blue at 10 days, Dark Matter at 30) go into the new hubs' and
the new dashboard's flame; the medal board's big view draws each hub's medal with the hub's tint; the full view is
one dialog the visiting session can open with someone else's place (always drawn healthy); the tilt is by drag, as on
the design page; the About page's and `LORE.md`'s lines are drafted in [the release note](2026-11-06-redesign-release.md)
and land at the release; BUG-083 is left alone unless the bar is opened.

## Log

- 2026-11-06: written from Sam's calls in chat.
- 2026-11-06 (Claude Code): `equip_item` and `pet_equipped` keep the home, the scene, six yard spots and the home's upgrades
  (windows, porch, chimney, flag, paint) on the server; a yard item moves between spots; on Link my devices the newer
  choice per slot wins (`migration_v54.sql`, [game-server](../reference/game-server.md)). The slot names are a draft for
  phase 4's renderer.
- 2026-11-06 (Claude Code): the art, drawn first on the design page, for Sam's look before anything goes into
  `widget/pet.js`. One kit, `tools/figures/site/place.mjs`, built by `build.mjs` into `tools/preview/design/place.js`
  (`window.SH_PLACE`): an isometric 14 x 14 plot with five yard slots (a wide one for the lane), drawn back to front.
  Four homes (the cottage redrawn, the castle, the giant mushroom, the treehouse), each with its own Timmy spots, door,
  toothbrush and night lights, and four to five upgrades (windows, a porch or landing, a chimney, a flag, a paint color);
  five scenes (the hill, with thirty-one's house on the next hill and the rabbit by its burrow; a beach, a forest, a snowy
  mountain, the night sky with the Dark Matter stars); six yard items (a garden, a pool, a hammock, a mint fountain, a
  doghouse, a bowling lane). The rank layers, the pennants, the Crown, the seasons and the holiday props draw on every
  home and scene. The design page's "Timmy's place" section has the full view (tap a spot, Timmy walks there, drag or
  tilt) and the card, light and dark, at 390 px, reduced motion still. The build checks 188 combinations. Waiting for
  Sam's look; then the renderer goes into `widget/pet.js`, and `LORE.md` and the About page get their lines when a
  student's Timmy can really move.
- 2026-11-06 (Claude Code): the art against the server draft above: its rarity tags now follow `shop_items` in
  `migration_v54.sql`. Two differences are Sam's call (PR #289): the server keeps six yard spots, the art draws five
  (the lane takes two); the server sells a mailbox, the art keeps the mailbox as the Bronze rank's and has a mint fountain
  instead. The upgrades' names differ too (round windows and a brick chimney there; shutters, window boxes and a stone
  chimney here): whichever Sam picks, the other side follows.
- 2026-11-06 (Claude Code): redrawn from Sam's feedback, with free rein. **No plot square**: each scene's ground fills the
  picture (a hilltop, dunes into the sea, a pine clearing, a snowy ledge over the clouds, a little planet, a cloud bank),
  and the homes sit in it with a soft shadow and the scene's own ground, path, tree and lamp. **Eight homes** (the cottage,
  the castle, the giant mushroom, the treehouse, and new: a beach hut, a lighthouse, an igloo, an observatory), **six
  scenes** (new: above the clouds), **twelve yard things** (new: a sandcastle, a beach umbrella, a campfire, a hot spring,
  a telescope, the mailbox back in the shop) and **seven theme outfits** for Timmy, in six themes (hilltop, seaside,
  woodland, snowy, starlight, clouds) plus the classics. **Earned things are part of the place**: the rank is a statue of
  the handpiece by the door (the rank's material, one to three steps for the level), each mastered hub a pennant in the
  bunting (gold with a crown mark for a Crown). **Rarity art**: each rarity has its own animated card frame, placing burst
  and coin. **Timmy hops** on the ground between spots, round the house and the yard things (a route over a visibility
  graph; he climbs the treehouse ladder and the beach hut's steps), never floats. **Eggs**: tapping the sun or moon, the
  house, the yard things and each scene's critter plays a small animation with a line from Timmy. The design page has Play
  and Customize, rarity cards with prices, and the galleries; the build checks 648 drawings and 1872 walks.
- 2026-11-06 (Claude Code): Sam's calls on the redraw: five yard spots, the mint fountain stays, the server's names follow
  the art. `migration_v54.sql` now has the five spots (`yard-left`, `yard-front`, `yard-corner`, `yard-side`,
  `yard-right`), `wide` for the bowling lane (`equip_item` keeps it in the side yard and clears the front corner), the
  upgrades renamed (`fancy-windows`, `chimney`, Timmy flag) and every new piece with the kit's id, rarity and price (68
  rows); `tools/release/xp.js` tests the spots and the lane (247 checks pass). Still waiting for Sam's look at the art;
  then the renderer goes into `widget/pet.js`, and `LORE.md` (the new critters: the rabbit, a crab, an owl, a yeti, a
  friend in a crater, a whale, the dog) and the About page get their lines.
- 2026-11-10: Sam's third round of feedback (the art, the scenes, the yard, mastery, rank-up unlocks, seasonal sets, the
  shop's shelves, visiting someone's Timmy) is its own task: [round 3](done/2026-11-10-redesign-timmys-place-round-3.md). PR #289 stays open for it.
- 2026-11-10 (Claude Code): round 3 is built on the design page ([its note](done/2026-11-10-redesign-timmys-place-round-3.md)):
  the scenes, homes and yard redrawn, Timmy's wave and his bubble, two mastery displays for Sam to pick from, and the
  seasonal and rank sets as packs (`tools/figures/site/packs/`). Still nothing in `widget/pet.js`.
- 2026-11-10 (Claude Code): Sam's second look: hub mastery is one **medal board** (each hub's own medal, a big view on
  tap), the statue stands upright, and the design page has the shop's window, the customizer, the rank board and
  visiting ([round 3's note](done/2026-11-10-redesign-timmys-place-round-3.md)). Still nothing in `widget/pet.js`.

## Outcome

Related: [round 3](done/2026-11-10-redesign-timmys-place-round-3.md) · [Timmy's shop](2026-11-06-redesign-timmy-shop.md) · [the bowling egg](2026-11-06-redesign-bowling-egg.md) ·
[phase 4](2026-11-05-redesign-phase-4-game-layer.md) · [diagrams-anima](../rules/diagrams-anima.md)
