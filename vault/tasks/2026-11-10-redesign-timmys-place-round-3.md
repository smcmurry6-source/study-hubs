---
type: task
status: review
hub: widget
created: 2026-11-10
requested-by: Sam
due: 
waiting-on: Sam
agent: Claude Code
pr: https://github.com/smcmurry6-source/study-hubs/pull/299
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
- [x] Make "Why each choice" collapsed by default. (`widget/hub.js` already folds it; the design page's own card,
      `design.js` around `var whys`, draws it open.)
- [x] An animation when you tap the thumbs up or down on "Good question?".
- [x] The XP text color a shiny gold.
- [x] The streak flame turns blue at 10 days and Dark Matter at 30 days.
- [x] The tooth in the Perio hub emblem looks odd: redraw it (an exception to the live hubs' art approved on 2026-11-06).
- [x] The gold crown currency logo looks closer to a chef's hat: redraw it as a dental crown.

**Timmy himself:**
- [x] Timmy waves now and then, and when you tap him.
- [x] His speech bubbles come from Timmy, not the top middle of the picture.

**The scenes:**
- [x] The land around the house rises in a gradual hill, not a semicircle poking up from the ground; the seaside scene
      the same, more like an island.
- [x] Seaside: the sun sits in the middle of the sky, and the water-to-sky transition looks wrong.
- [x] Above the clouds: the cloud looks more like snow than a cloud.
- [x] Starlight: the planet doesn't make sense.

**The homes:**
- [x] The cottage is labeled "Default", not "Free".
- [x] The castle looks off and could be better; the treehouse roof doesn't line up; the beach hut's roof the same; the
      observatory's telescope looks odd.
- [x] The igloo has grass on top of it.
- [x] The house upgrades must not break what's already there: they mess up the handpiece and the toothbrush. And the
      handpiece doesn't look like a handpiece.

**The yard:**
- [x] The garden more detailed.
- [x] The swimming pool's water overlaps the side of the pool.
- [x] The hammock's pillow doesn't mesh.
- [x] The mint fountain becomes a **mouthwash fountain**, and its water stops abruptly at the top.
- [x] A dog when you have the doghouse; the chew toy more detailed.
- [x] The tooth used on the bowling lane, the mailbox and the pennant has a chunk taken out and looks squished.
- [x] The mailbox's flowers better.
- [x] The sandcastle's towers don't look right.
- [x] The beach chair doesn't look like a beach chair.
- [x] The bowling lane decoration uses the sugar-free mint as its ball (as the bowling egg does).

**Hub mastery:**
- [x] A better way to show hub mastery that scales to many more hubs; the pennants don't show up well.

**Unlocks, seasons and the shop:**
- [x] Every **full rank-up** (not the I, II, III tiers) unlocks a decoration, an outfit and a house. (Sam's answer
      below: an outfit and a decoration only.)
- [x] Every season gets a full set of cosmetics in the shop: **1 house and 1 scene per season (both Legendary)**, and a
      Rare, Epic and Legendary of everything else. They're limited time; at rare intervals a random selection of
      seasonal items comes back to the shop. **Seasons that have already passed are unlocked for everyone by default**
      (Sam: "i think this only includes halloween").
- [x] The shop has **daily and weekly items**, and a **seasonal section** while a season is on.
- [x] Overall: more outfits, scenes, houses and everything.

**Visiting:**
- [x] Users can visit someone else's Timmy.

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

- [x] Every item in Sam's list done on the design page (or answered, where it's a question), with screenshots to Sam in
      light and dark, laptop and phone, and the hosted preview if Sam asks for one
- [x] The server follows: `migration_v54.sql` (still unapplied; check `supabase/pending-migrations.txt`) gets the rank
      unlocks, the seasonal sets and their rotation, the shop's daily, weekly and seasonal shelves, the mouthwash
      fountain's id, the visiting function, and their tests in `tools/release/xp.js` (and `rls.js` for visiting)
- [x] `node tools/figures/site/build.mjs --check`, `node tools/ci/syntax.js`, `node tools/ci/vault.js`, the database
      suites, and the smoke test pass
- [x] Vault written back: this note's Log and Outcome, [decisions](../decisions.md),
      [Timmy's place](2026-11-06-redesign-timmys-place.md), [the shop](2026-11-06-redesign-timmy-shop.md),
      [game-server](../reference/game-server.md), `DEPLOY_NOTES.md`

## Log

- 2026-11-10: written from Sam's list in chat (Claude Code, the session that made PRs #289 and #291), so the next chat
  can start from it.

- 2026-11-10 (Claude Code, a second session): asked Sam the five calls and the seasons question (answers above), then
  worked the list on the design page, from PR #289's branch. Nothing is wired into `widget/pet.js`, `widget/eggs.js`,
  `widget/hub.js` or `widget/ranks.js`.
  - **Quick fixes**: "Why each choice" folded; a pop and sparks on the "Good question?" thumbs; XP text in a shiny
    gold; the streak flame has five levels (blue at 10 days, Dark Matter at 30); the coin redrawn as a gold dental crown;
    Perio's emblem tooth redrawn; the cottage reads "Default".
  - **Timmy**: he waves now and then and when tapped (tap again and he flips); the speech bubble sits over his head, with
    a tail, and follows him.
  - **Scenes and homes**: the hill and the island rise gradually; the seaside's sun and horizon, the cloud scene's cloud
    and starlight's planet redrawn; the castle, the treehouse and beach hut roofs and the observatory's telescope
    redrawn; the igloo sits on snow; upgrades no longer cover the statue or the toothbrush; the statue is a handpiece.
  - **Yard**: the garden, pool, hammock, **mouthwash fountain** (id `mouthwash-fountain`), doghouse with its dog,
    mailbox, sandcastle, sun loungers and the lane (a mint for a ball) redrawn; the little tooth mark redrawn.
  - **Mastery**: the pennants are gone. Two displays beside the house for Sam to pick from, each good for 20 hubs: a
    **trophy case** (a cup per hub) and a **gem plaque** (a gem per hub in the hub's color); the metal is the medal.
  - **Sets**: `tools/figures/site/sets.mjs` lists 14 seasonal sets of 8 pieces (Spring, Summer, Tooth Fairy week, Mardi
    Gras and the Fourth of July are new) and the Handpiece's six rank sets; each is drawn in its own pack
    (`tools/figures/site/packs/`, [how-to](../how-to/draw-a-seasonal-set.md)).
  - **Server** (`migration_v54.sql`, still pending): the catalog (180 rows), seasonal windows, two throwback days a
    month, rank sets earned by rank, Halloween's set as a gift, the shop's shelves in `get_my_shop`, and visiting
    (`get_place` by a board's visit key, on by default, `set_visiting`); `tools/release/xp.js` has 348 checks.
  - **The design page**: galleries for the mastery options, the rank sets and the seasonal sets, and designs of the
    shop's shelves and of visiting from the boards.
- 2026-11-10 (Claude Code, the same session, after Sam looked at the first screenshots): Sam's second list, all on the
  design page and in the kit; still nothing wired into the live widgets.
  - **Mastery**: Sam picked the plaque, then asked for the board and the pop-up to show the same medals. The trophy
    case and the gems are gone: the **medal board** beside the house hangs each hub's own mastery medal in miniature
    (the hub's ribbons, Bronze, Silver or Gold, a crown on a Crown), up to 20, and tapping it opens the **big view**:
    every hub's medal at full size with its name and level, and a count per level. The board is kept small and stands
    low at the wall's front end so it covers little of the house.
  - **The Fourth of July** set is on sale June 28 to July 4 (Sam: "Let's do June 28 through July 4").
  - **Holiday content before its dates**: checked. A seasonal piece is refused outside its window (`not-today`), the
    daily and weekly picks never include one, and the one gap (a throwback day bringing back a holiday that has not had
    its first run yet) is closed: `shop_items.added_on` and `sh_season_was_on`, four more tests (348 checks).
  - **The daily goal ring** was never lost: the ring of 20 teeth lives in `widget/hub.js`; the design page's mock Today
    panel drew the older plain ring. It draws the ring of teeth now.
  - **The rank board**: every name has its rank's handpiece emblem; your own row carries your board name (never "You")
    on a gold nameplate with a sheen, Timmy peeking over it and a "That's you" flag.
  - **Visiting**: a Visit button with a porthole of the person's home, **Visit someone random**, next and back arrows
    while visiting ("Place n of N"), and a cloud trip: soft separate clouds drift in from every side, cover the screen,
    the place changes behind them and they scatter (Sam: not two curtains; less harsh clouds). A plain swap under
    reduced motion.
  - **The shop** is a storefront (an awning, a hanging sign, Timmy as the keeper, wooden shelves). Any piece opens in
    its own window: a display case with rays in the rarity's color, "The piece" / "At my place" views, the set it
    belongs to, the price against your crowns, Buy and "Try it at my place". **Back for today** is a corner "Today
    only" stamp and a tag in the window, not a banner across the card (it read as unavailable).
  - **Buying** plays out by rarity (coins fly in, a flash, rings, confetti; a Legendary charges up first) with sound
    cues synthesized in the page (no audio files), a sound switch in the shop, silent and still under reduced motion.
  - **The customizer**: a dock of picture tiles (Home, Scene, Timmy and the five yard spots), a drawer with Classics,
    Seasonal and Rank tabs on shelves (outfits on a wardrobe rail), a camera that moves in on what you're changing,
    "Surprise me" and a close-up.
  - **The statue**: the handpiece stands upright in a socket in the middle of its pedestal.
  - **Polish pass**: every home rendered in its own scene with a full yard, day and night, and every thumbnail. Fixed:
    the igloo's doorway (no snow on or in front of the tunnel, the statue and snow lanterns clear of the door), and the
    emerald hills' walls (one boundary wall with a gateway, pillars and a field gate; the loose wall pieces on the grass
    are mossy boulders).
  - **Timmy's podcast studio** is a yard decoration (Sam: "i also want timmys podcast studio to be a decoration"): a
    sound booth on a deck with a studio window, an on-air lamp, the show's poster, an antenna, his mic and a stool. Kit
    key `studio`, shop id `podcast-studio`, one of the classics (goes in any scene), Epic, 2,400 crowns (Sam: "podcast
    studio price is good"). Tapped, it goes on air (the lamp lights, the antenna sends rings) and Timmy says the
    show's opening line. The catalog is 181 rows now (57 everyday).
  - **Sam's third look** ("why does only gold get the three tiers of steps? also, i want there to be a wooden theme to
    timmys shop. the medal switch is good. podcast studio price is good"): every rank has three levels and its statue a
    step for each; the "Your rank" gallery showed the steps for Gold only, so it now shows I, II and III for every
    rank. The shop is wooden: plank walls in a timber frame, each shelf a cabinet with thick boards, Timmy behind a
    counter, the sign carved and hung on chains, the crowns and the sound switch on wooden plaques, and a timber frame
    round a piece's window. The same wood in light and dark (deeper in dark).
  - **Timmy's health shows at his place** (Sam: "timmys behavior, movement, and appearance at his house should also
    reflect his health level"). The kit has one table, `HEALTH` (`TP.healthFor(hp)`), eight levels with the same
    cut-offs as `conditions()` in `widget/pet.js`: Sparkling (90+), Healthy (70+), a little plaque (55+), stains and
    puffy gums (40+), a cavity (25+), periodontitis (12+), a cracked cusp (1+), needs treatment (0). Each row says which
    of the pet's drawings he is, how long, high and far he hops, how much he wanders (and whether he keeps near the
    door), how big his wave is, whether a second tap flips him, how he stands (a bounce, a droop and sway, a shiver)
    and what he says. At 0 HP he stays on the doorstep, turns to look at what's tapped and says what he needs. The
    design page's Build it has a health slider with a chip per level (a preview: in the hubs his HP is the pet's), and a
    gallery of the eight levels. A visited Timmy is always drawn healthy: `get_place` returns no HP, and it must stay
    that way ([learner-data-privacy](../rules/learner-data-privacy.md)).
  - The vendored `taste-skill` was not run in full: its house rules are for work screens and marketing pages (no
    decorative shapes), which fights a decorative game screen in Timmy's ink style. Its look-and-fix loop on
    screenshots is what the polish pass did.

## Outcome

Waiting for Sam's look at the second set of screenshots (PR above). Left for after it:

- **Wiring** (not done, by instruction): the place, the sets, the wave and the bubble into `widget/pet.js`; the new
  seasons and holidays into `holidayId()` / `isFall()` (the server's `sh_shop_seasons` already has them); flame levels
  4 and 5 into `widget/hub.js` (it picks levels 1-3 today); the shop (its window, the purchase animation and sounds),
  the customizer, the rank board's emblems and nameplate and visiting as real clients; then the About page (visiting,
  the sets, the medal board, the sound switch, the podcast studio) and `tools/podcast/LORE.md` (the studio in the yard is
  where Timmy Time is recorded: nothing in the lore says otherwise yet).
- **Health, when wired**: `widget/pet.js` passes its own HP to the kit's `healthFor()` and uses the row for the art,
  the hops and the idle loop; the design page's stage code (`hops()`, `wave()`, `tapTimmy()`, `wanderOn()` in
  `tools/preview/design/design.js`) is the reference. The About page's Timmy entry gets a line on it.
- **For the wiring agent**: the design page's shop, customizer, rank board and cloud trip are mock-ups in
  `tools/preview/design/design.js` on made-up names and a made-up wallet; the sounds are Web Audio tones (`sfx()`), the
  setting is `sh_design_sound` in localStorage. The kit side (the medal board, `MEDALS`, `EGGS.mastery`) is real.
- Only the Handpiece's six rank sets exist; the ModuPro's and the Loupes' are drawn before anyone reaches them.
- A tall yard piece in the front spot (the wishing well, the swing) stands in front of the door, and one in the side
  yard or the front corner can cover part of the medal board: that is the player's choice of spot, not a drawing fault.

Related: [Timmy's place](2026-11-06-redesign-timmys-place.md) · [Timmy's shop](2026-11-06-redesign-timmy-shop.md) ·
[the bowling egg](2026-11-06-redesign-bowling-egg.md) · [the journeys](2026-11-06-redesign-progression-journeys.md) ·
[phase 4](2026-11-05-redesign-phase-4-game-layer.md) · [game-server](../reference/game-server.md)
