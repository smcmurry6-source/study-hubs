---
type: task
status: open
hub: widget
created: 2026-11-06
requested-by: Sam
due: 
waiting-on: 
agent: 
pr: 
---

# Timmy's shop: Shiny Gold Crowns, a rotating shop, rarity, seasonal outfits and rare costumes

## Goal

Sam's idea (2026-11-06, workshopped in chat and decided the same day): students earn **Shiny Gold Crowns** and spend them in a Timmy
shop that rotates (some items every 24 hours, some every week), with limited-time seasonal outfits and rarity tiers whose
prices reflect the rarity. It sells outfits, cosmetics for Timmy's house and yard, snacks and floss that restore his health,
and XP boosts. Purchases and inventory are kept on the server across devices and are safe from refresh or replay. On days
with no holiday, Timmy now and then wears a rare costume, the same one all day. Ships with the redesign.

## Context

- The redesign plan: [the audit and plan](done/2026-11-05-redesign-audit-and-plan.md) (section 4.10). Client:
  [phase 4](2026-11-05-redesign-phase-4-game-layer.md) (part B); server: [phase 5](2026-11-05-redesign-phase-5-backend.md)
  (part 3); live at [the release](2026-11-06-redesign-release.md).
- What the house items go into: [Timmy's place](2026-11-06-redesign-timmys-place.md) (the house card, redrawn). XP and its
  boosts: [the journeys note](2026-11-06-redesign-progression-journeys.md). Bowling: [its own note](2026-11-06-redesign-bowling-egg.md).
- Rules that matter most here: [podcast-reactions](../rules/podcast-reactions.md) (the lore rules: never contradict
  `tools/podcast/LORE.md` or `widget/pet.js`), [every-hub-gets-its-own-art](../rules/every-hub-gets-its-own-art.md) (drawn in
  SVG in Timmy's ink style, nothing generated), [about-page](../rules/about-page.md) (spoilers for secrets),
  [learner-data-privacy](../rules/learner-data-privacy.md).
- **This changes an earlier call**: on 2026-11-05 Sam kept Timmy's HP model as it is. Its decay and moods stay, but
  snacks and floss from the shop now restore HP (Sam, 2026-11-06).
- Code: `widget/pet.js` (`OUTFITS`, `holidayId()`, `isFall()`, `houseSvg`), `widget/eggs.js` (`HOLIDAYS`).

## Sam's calls (2026-11-06, [decisions](../decisions.md))

Shiny Gold Crowns is the name (Sam changed it from Mints the same day). The shop rotates daily and weekly, has limited-time seasonal outfits and rarity tiers priced by rarity,
sells house cosmetics, snacks and floss that boost health, and XP boosts. The house card gets a full redesign
([its note](2026-11-06-redesign-timmys-place.md)). Ships with the redesign.

## Shiny Gold Crowns

- **The name**: Shiny Gold Crowns in full, "gold crowns" for short, never just "crowns", because the top mastery medal is
  the Crown. The coin is drawn as a shiny gold dental crown (the restoration, with its occlusal anatomy and a glint), never a
  king's crown, so it never looks like the Crown medal. In code and the database: `gold_crowns`.
- **Worked out by the server from XP**: 1 gold crown per 10 XP of base XP (the extra from a double-XP boost earns none, so
  boosts can't feed themselves), plus one-time grants: each trophy 25, each mastery medal 50, each rank-up 20. It follows
  XP, so it inherits XP's server checks and adds no new way to farm. Spending never lowers XP or rank.
- **Back pay**: on release day everyone has the gold crowns their XP already earned (median about 120, the most active about
  1,450), so the shop opens with something to spend.
- The balance is earned minus spent, always computed on the server; the browser only shows it.

## The shop

- **Where**: More, and a button on the "you" panel and on Timmy's place.
- **What rotates** (the same shop for everyone, worked out from the date in Central time, so classmates can talk about
  today's shop):
  - **Daily**: 4 items, new at midnight.
  - **Weekly**: 3 featured items, new every Monday.
  - **Seasonal**: limited-time outfits and house props for each holiday and the fall weeks, on sale only in their season
    (`holidayId()`, `isFall()`); owned for good once bought. They don't replace the free holiday outfits he already wears.
    (**Changed 2026-11-12**: on the redesign's pages he wears only what the student put on; see "Sam's calls
    (2026-11-12)".)
  - **Always on the shelf**: snacks, floss and XP boosts.
- **Rarity tiers**, each with a price band and how often it comes up in the rotation: Common 100-200 gold crowns, Uncommon
  250-500, Rare 600-1,200, Epic 1,500-3,000, Legendary 4,000-8,000 (the castle, the giant mushroom, the treehouse). The rarer
  the item, the less often it shows; the tier has its own frame color on the card.
- **What it sells**:
  - **Outfits** for Timmy (a scrub cap, a white coat, safety glasses, a bow tie, a beanie, a graduation cap...), worn one at a time.
  - **Cosmetics for his place**: a new house, scene upgrades and yard items ([Timmy's place](2026-11-06-redesign-timmys-place.md)).
  - **Snacks and floss that restore HP**: for example an apple +10 HP, a cheese cube +15, floss +25, a fluoride rinse +40, each
    used at once; at most one a day of each kind, so studying stays the main way he stays healthy. Never sugar: Timmy is a tooth.
  - **XP boosts**: 2x XP for 1 hour (Rare) or 3 hours (Epic). A boost starts when you buy it; a second one extends the time
    instead of stacking, and the larger of a shop boost and a mastery boost applies.
- Every item is drawn by the agent in SVG, in Timmy's ink style, and approved by Sam the way phase 0's art was.

## On the server (phase 5, part 3)

- `shop_items` (the catalog: id, kind, rarity, price, season, art key) and a rotation function that gives the day's and the
  week's items from the date, so the browser can't pick its own.
- `buy_item(visitor, item, request_id)` checks the item is on sale today, the price and the balance, writes
  `pet_inventory (visitor, item)` with a unique key for things you own once, and is idempotent on `request_id` (a double tap or
  a replayed call buys once). Snacks, floss and boosts are used at once and logged in `pet_purchases`.
- `equip_item` keeps what Timmy wears and where his things stand on the server, so every linked device shows the same.
  The bootstrap carries the balance, the inventory, what's worn and placed, and today's shop.
- HP from snacks and floss goes through the same place HP is computed today (`get_pet_days`), so the house and the bar agree.
- Link my devices merges inventories and spending.

## Rare costumes

**Changed 2026-11-12** (Sam: "if someone doesnt have a costume applied, they are naked. What you put wins"): five
costumes, not a dozen, and Timmy never puts one on by himself; a costume *turns up* at the shop on its day. The list
below is the 2026-11-06 design, kept for its reasons; where it differs, "Sam's calls (2026-11-12)" and session 2's
spec win.

- About a dozen drawn costumes (a pirate, an astronaut, a detective, a chef, "Captain Enamel" with a cape...), each with its
  lines, added to `tools/podcast/LORE.md` in the same PR.
- **Picked from the visitor's id and the day** (Central time): on about 1 day in 12 that has no holiday or fall outfit (most
  of January to mid-September), the same costume on every reload and every linked device that day. No server call needed.
- **What wins**: a holiday or fall outfit, then the rare costume of the day, then the outfit the student wears from the shop.
  A first sighting goes in the "you" panel's costume log ("Spotted: the pirate") and puts it in the shop's rotation for them.
- Holiday costumes keep changing each page load (canon in `LORE.md`: "he can't pick one").

## Sam's calls (2026-11-12, [decisions](../decisions.md))

Asked as one list before any of the shop was built; Sam: "Your recommendations are good otherwise", with one answer of
his own (what Timmy wears).

- **Two sessions**: the art first (contact sheets, Sam's yes), then the client.
- **The five undrawn everyday outfits are drawn** (`scrub-cap`, `bow-tie`, `safety-glasses`, `white-coat`,
  `graduation-cap`), in the art session ([their note](done/2026-11-12-five-outfits-without-a-drawing.md)).
- **Five rare costumes**, the ones in the migration (`pirate`, `astronaut`, `detective`, `chef`, `captain-enamel`), not
  "about a dozen". More can join after the release with `admin_upsert_shop_item`, no migration.
- **Prices stay as the migration has them** for the release. Any Sam wants changed when he sees the art go on a list
  in this note ("Prices to change after the release") and are changed after the release with `admin_upsert_shop_item`.
- **What Timmy wears** (Sam's own words): "Since we are moving to the shop, if someone doesnt have a costume applied,
  they are naked. What you put wins." So on the redesign's pages **Timmy wears only what the student put on him, and
  nothing when nothing is on.** This replaces "What wins" under Rare costumes below, and the line under "The shop"
  that the seasonal outfits "don't replace the free holiday outfits he already wears". What follows from it (the
  agent's reading, told to Sam the same day; Sam, asked again with #337: "Sounds good"):
  - Timmy no longer dresses himself for a holiday or the fall weeks on the redesign's pages. The hubs' holiday themes,
    the eggs and the place's own seasons and holiday props are untouched (`holidayId()`, `isFall()` and the server's
    `sh_season` stay as they are).
  - **A rare costume is never worn by itself.** On its day it *turns up*: Timmy says so once ("Something rare came in
    at the shop today: the pirate costume"), it is logged (`record_costume_sighting`) and stays on that student's
    "Spotted" shelf until bought, exactly as the server already does it. Worn only once bought and put on.
  - The build of this rule on Timmy himself (the bar, his place, the classroom, the stage) is
    [Timmy everywhere](2026-11-12-redesign-ask-timmy.md) ("Build spec, part 4"), the session after the shop's client.
- **Where the balance shows**: the new dashboard's "you" card, the shop's header and the Shop row in a hub's More. Not
  on a hub's top bar (it already runs past the screen on the longest hub name, BUG-083).
- **The rank statue hidden behind Timmy at the door** (BUG-089): Timmy's door spot moves to the open side of the door,
  home by home, and the spot left of the path is nudged so the statue's base shows; in the art session, on one sheet
  of every home ([Timmy's place](2026-11-06-redesign-timmys-place.md)).
- **Where the server as written and the client differ**, nothing in the migration changes
  ([game-server](../reference/game-server.md) has the list): an answer's reply carries no balance, so the balance
  refreshes at page load, when the shop or the "you" card opens and after a purchase, with no ticking counter; the
  server sells a snack at 100 HP, so the shop greys it out ("He's full"); `get_my_shop` sends no end date for a
  season, so a season's shelf says "Limited time" with no countdown.
- **No hosted preview**: screenshots and a recording from a scripted browser on made-up data.

### Prices to change after the release

None yet. (The art session adds a line for each price Sam wants changed: the item's id, the old and the new price.)

## Build spec, session 1: the shop's art

Read first: "For every session above" in [phase 4](2026-11-05-redesign-phase-4-game-layer.md), this note,
[draw-a-seasonal-set](../how-to/draw-a-seasonal-set.md), [every-hub-gets-its-own-art](../rules/every-hub-gets-its-own-art.md),
the lore rules in [podcast-reactions](../rules/podcast-reactions.md). Art only: no client code.

**What to draw** (SVG, Timmy's ink style, the kit's palette in `tools/figures/site/style.mjs`; nothing generated):

1. **The Shiny Gold Crown**: a gold dental crown (the restoration: cusps, a groove, a glint), never a king's crown, so
   it can't be taken for the Crown mastery medal. It must read at 16 px beside a number, and at 24 and 48 px.
2. **Four snacks**, as shop thumbnails: `apple`, `cheese-cube`, `floss`, `fluoride-rinse`. Never sugar.
3. **Two boosts**: `boost-1h`, `boost-3h` (a "2x" the eye reads first; the longer one clearly the bigger).
4. **Five rarity frames** for a shop card: common, uncommon, rare, epic, legendary. Told apart by shape or ornament
   as well as color (the rarity's name is always printed too).
5. **Five everyday outfits** on Timmy: `scrub-cap`, `bow-tie`, `safety-glasses`, `white-coat`, `graduation-cap`. Each
   an entry of the kit's `OUTFITS` with `id` equal to the catalog's id, its name, rarity and price as in
   `migration_v54.sql` (grep the id). Decide for each how it sits with the loupes of the Loupes journey: eyewear goes
   on the kit's `NO_LOUPES` list (the safety glasses), the rest leave room.
6. **Five rare costumes** on Timmy: `pirate`, `astronaut`, `detective`, `chef`, `captain-enamel` (a cape). Kit
   `OUTFITS` entries too (the server lets a `costume` into the `outfit` slot), each marked so the client can tell a
   costume from an outfit, each with three lines for Timmy to say in it.
7. **The door** (BUG-089): in `tools/figures/site/place.mjs` every home has `door`, `statue` and `spots.door`
   (where Timmy stands; grep `spots: { door:`), and each seasonal set's home has the same in its
   `tools/figures/site/packs/<set>.mjs`. Move `spots.door` to the side of the door away from the statue, home by
   home, so the statue, its steps and the later journeys' pedestal are in full view with Timmy at the door, and the
   card (which always shows him at the door) shows both. Nudge the statue or the yard's left spot only where a piece
   there (the garden is the widest) still hides the statue's base. The statue stays by the door.

**Files to touch**: `tools/figures/site/place.mjs` (`OUTFITS`, `NO_LOUPES`, the homes), `tools/figures/site/packs/*.mjs`
(only a home's `spots.door` or `statue`), a new `tools/figures/site/shop.mjs` (the coin, snacks, boosts, frames),
`tools/figures/site/build.mjs` (build `shop.mjs` into a new `widget/hub-art/shop.js`, `window.SH_SHOP_ART`, which the
client session will fetch on first use; keep the build's own checks), the generated files the build rewrites
(`widget/hub-art/place.js`, `widget/hub-art/place/*.js`, `widget/hub-art/outfits.js`, `tools/preview/design/*`), the
design page (`tools/preview/design/`: a "The shop" section showing the coin, the cards in each frame, the snacks and
boosts, and the ten outfits on Timmy), `tools/release/xp.js` (below), the vault.

**Not to touch**: `widget/place.js`, `widget/pet.js`, the engine (`widget/hub*.js`), `widget/dash.js`,
`migration_v54.sql`, `tools/preview/runtime/preview.js`. If a drawing seems to need a change in `widget/place.js`
(a new kit function), stop: write what it needs into session 2's spec instead.

**What it calls**: the kit, `placeKit(INK, C, PACKS, SETS)` in `place.mjs` (`dress(svg, key, opt)`, `thumb(kind, key)`,
`layout(o)`, `OUTFITS`, `HOMES`), and `tools/figures/site/pack-preview.mjs` for a sheet of one set (it draws Timmy at
the door; add what you need to make the sheets below, without changing what the build ships).

**Sam's look, before the generated files are committed as final**: contact sheets as PNGs, light and dark:
(a) the coin at three sizes, the six shelf items and one sample card in each of the five frames; (b) the ten outfits
on Timmy, large, and each again with loupes in the Loupes journey; (c) every home (the everyday ones and the fourteen
sets') with Timmy at the door, the statue at Dark Matter with three steps, the ModuPro on the pedestal, and the
garden in the yard's left spot, as the card draws it. Sam says yes or what to change; a price he wants changed goes
on the list above, never into the migration.

**Budgets**: nothing here loads with a page. Report the kit's new size (it was 77 KB compressed) and
`widget/hub-art/outfits.js`'s; `widget/hub-art/shop.js` should stay under about 15 KB compressed.

**Tests to add or change**:
- `tools/release/xp.js`: the line that expects exactly five undrawn outfits (grep `bow-tie', 'graduation-cap'`)
  expects none; add the same check for `kind = 'costume'` (every costume row has a drawing, every kit costume a row).
- The build fails if a shop thumbnail, a frame or the coin is missing, in either theme.
- `node tools/ci/smoke.js` still passes its Timmy's place steps (the place draws, the card shows Timmy and the statue).

**Out of scope**: any client code; prices; more than five costumes; the later journeys' rank sets; the bowling
clips; the About page.

**Done when** (session 1):
- [x] The three sheets sent, light and dark, and Sam's yes (his words in [decisions](../decisions.md):
      "Everything looks good. Merge when ready")
- [x] The ten outfits in the kit with the catalog's ids; `node tools/figures/site/build.mjs` passes and the generated
      files are committed
- [x] `widget/hub-art/shop.js` built, with the coin, four snacks, two boosts and five frames
- [x] Timmy at the door hides the statue in no home; BUG-089 retested and closed in [the bug log](../release/bug-log.md)
- [x] `tools/release/xp.js` expects no undrawn outfit or costume and passes; BUG-090 closed; the
      [five outfits' note](done/2026-11-12-five-outfits-without-a-drawing.md) done and moved to `done/`
- [x] `node tools/release/run.js` once; the hand-off in [phase 4](2026-11-05-redesign-phase-4-game-layer.md)'s Log
      (the kit's new names, sizes, anything session 2 must know). 16 of 17 suites passed; accessibility needs
      `axe-core`, which the cloud container doesn't have, so CI's "Release tests" ran it

### What session 1 built (read before session 2)

- **`window.SH_SHOP_ART`** (`widget/hub-art/shop.js`, built from `tools/figures/site/shop.mjs`; 11.4 KB compressed; no
  page loads it, only the design page):
  - `coin(px)`: the Shiny Gold Crown as an `<svg class="ts-coin">` of that size. Under 20 px it draws the small cut
    (heavier ink, no sparkle), so it reads at 16 px beside a number. `coinBody(small)` is the drawing alone, in a 24
    box, for a caller that writes its own `<svg>` (the dashboard's inline coin: copy `coinBody(true)`'s output).
  - `thumb(id)`: a 64-box `<svg class="ts-thumb">` for `apple`, `cheese-cube`, `floss`, `fluoride-rinse`, `boost-1h`
    and `boost-3h`; `""` for any other id (an outfit, a costume or a place piece is `SH_PLACE.thumb(kind, key)`).
  - `ITEMS`: those six with the catalog's `id`, `n`, `kind`, `rarity`, `price`, `hp` or `minutes` and `mult`, and a
    one-line `note` for the card. `tools/release/xp.js` fails if one differs from `shop_items`.
  - `frame(rarity, w, h)`: the card's frame (160 x 200 unless told), drawn behind what the card shows; `rarity` in
    any letter case, so the server's lowercase value works. `RARITIES`: each one's `k`, price `band` and colors
    (`fill`, `edge`, `deep`, `ink`; the name's pill is `ink`). `CSS`: the frames' motion (classes `ts-r-*`), still
    under reduced motion and inside `.ts-still`; the shop adds it once.
  - `store("back")` and `store("front")`: the storefront, the shop's masthead, 600 x 200, in two layers so the live
    Timmy stands between them (he is centered, about 80% of its height, his gum just behind the counter's top). No
    wall is drawn, so the page's wooden wall shows through in both themes; a narrow page crops the sides and keeps
    the arch, Timmy, the till and the bell. `stand(rarity)`: the showcase's stand, 200 x 64. Their motion (turning
    rays, swaying lanterns, glints) is in `CSS` under `ts-s-*`, still under reduced motion.
  - No drawing takes a color from the page (the build fails on `currentColor` or a `var(`): a shop card is paper on
    the light page and on the dark one, as on the design page, so one drawing serves both.
- **The shop's look** (Sam, 2026-11-12: "I want the shop ui to be more epic"; then, on the result: "Actually its
  good", "i like the redesign") is the design page's "The shop" (`shopMock()` in `tools/preview/design/design.js`, the `.tp-store` rules in
  `design.css`). Session 2 builds the real page to it, top to bottom:
  1. **The storefront**: the awning, bunting and lanterns, Timmy at the counter in the bow tie under the arch of
     light, the sign ("Timmy's Shop" with the coin), and on the counter's front the balance on a gold plaque (the
     coin, the number, "Shiny Gold Crowns"). On a phone the plaque is centered on the counter.
  2. **Today's showcase**: the rarest piece on sale that the student doesn't own (the dearest among equals), large,
     on `stand()` in its rarity's colors with rays turning behind it; beside it its name in large type, its rarity
     and kind, one sentence, the price and one button that opens it. Left out when everything on sale is owned.
  3. **The shelves**, each a cabinet whose cards fill its width: Today's picks alone (four large cards); This week
     beside Back for today (on a day with no throwback, This week takes the row); the season with a picture of the
     whole set at Timmy's place beside its cards; Spotted, all five costumes, the unseen ones as grey shapes that
     say "Not spotted yet"; Always here, each snack and boost with what it does on the card ("+10 HP", "2x XP · 1 h").
     On a phone every shelf is one row that scrolls sideways, as on the design page.
- **The frames and the coin moved out of the place's kit.** They are the round 3 drawings Sam approved on 2026-11-10,
  unchanged; only the coin's 16 px cut is new. `SH_PLACE.frame`, `SH_PLACE.coin` and `SH_PLACE.RARITIES` are gone
  (`widget/place.js` never used them); `SH_PLACE.burst(rarity)` stays.
- **The ten outfits** are `SH_PLACE.OUTFITS` entries whose key is the shop's id (`scrub-cap`, `bow-tie`,
  `safety-glasses`, `white-coat`, `graduation-cap`; `pirate`, `astronaut`, `detective`, `chef`, `captain-enamel`),
  with the catalog's rarity and price. A costume has `costume: true` and three `say` lines; the everyday five are in
  the classics theme. `dress(svg, key, { loupes: tier })` draws all ten, and `widget/hub-art/outfits.js` carries
  them. Four cover the eyes themselves, so they are on `NO_LOUPES` and the loupes aren't drawn with them: the safety
  glasses, the pirate (an eye patch), the astronaut (a helmet) and Captain Enamel (a mask). The kit's names carry an
  article ("A scrub cap", "The pirate"), as its other outfits do; the catalog's don't ("Scrub cap", "Pirate"): a
  shop card prints the catalog's `name`.
- **The door** (BUG-089): Timmy's door spot moved in all 22 homes, to the side of the door away from the statue;
  nine statues moved a little to the left; the yard's left spot moved forward (`SLOTS.left`) and the path's lamp
  moved down the path (`FIX.lamp`). The lamp was a third thing in front of the statue's steps, not named in the bug.
  The build still walks every route (4,500).
- **Accepted as it is** (BUG-095; Sam was shown it and said "Everything looks good"): a tall piece in "By the path, right" (the mailbox, the fountain, the
  telescope) now stands in front of Timmy's gum when he is at the door, where before it stood beside him. His face
  stays clear. That spot was not this session's to move (only the left one was), and it borders the path and the lane.
- **Sizes**, compressed: the kit `widget/hub-art/place.js` 77.1 to 80.6 KB; `widget/hub-art/outfits.js` 29.7 to
  33.6 KB; `widget/hub-art/shop.js` 11.4 KB (the spec's limit is about 15). None loads with a page.
- **The sheets** can be made again: `node tools/figures/site/shop-sheets.mjs <out-dir> [shelf|outfits|homes|ui]`
  (needs Playwright; each in light and dark; `ui` is the design page's shop at 1280 and 390 px, after a build).

## Build spec, session 2: the shop's client

Read first: "For every session above" in [phase 4](2026-11-05-redesign-phase-4-game-layer.md), this note,
[game-server](../reference/game-server.md) ("Shiny Gold Crowns and the shop", "Where the client works around the
server as written"), session 1's hand-off in phase 4's Log, and `widget/place.js`'s top comment.

**What gets built**: the shop as a page students can open, buying, the balance, snacks that heal, boosts, and rare
costumes that turn up. Only on the redesign's pages.

**Files to touch**:
- New: `widget/shop.js` + `widget/shop.css` (`window.shShop`: `setup({ sb, visitor, shop })`, `mount(el)`,
  `open()`, `balance()`), fetched on first use, never with a page. It fetches `widget/hub-art/shop.js` (session 1)
  and the place's kit (`shPlace.ready()`) itself.
- `widget/hub.js`: only a `["shop", ...]` row in `MORE` (after `place`) and `shop: HX.moreShop` in `renderMore`'s map.
- `widget/hub-timmy.js`: `HX.moreShop(body)`, written like `morePlace` (it loads `shop.js`, waits for the bootstrap,
  calls `shShop.setup` and `mount`); the costume of the day's check (below).
- `widget/dash.js` + `widget/dash.css`: the balance (the coin and a number) and a "Shop" button on the "you" card;
  the button fetches `shop.js` on its first tap and opens the shop as a dialog. The balance is drawn from the
  bootstrap's `shop.wallet.balance` (grep `shPlace.setup` in `dash.js`: the same `d.shop`); the coin there is one
  small inline drawing in `dash.js` (`SH_SHOP_ART.coinBody(true)`'s output, copied), so no request is added.
- `widget/place.js`: the "Get more in the shop" link in the customizer's drawer (`side()`, beside "Surprise me";
  `data-tp="shop"`), which opens the shop; nothing else there.
- `widget/pet.js`: **only** `simulate()`: a server row that carries `hp` (the v2 bootstrap's `pet_days` and
  `get_pet_days_v2` do; today's `get_pet_days` doesn't, so the live pages compute exactly what they do now) adds that
  HP on that day, capped at 100. And where it loads the days itself (`loadRemote`), it asks `get_pet_days_v2` only
  when the page is on the game layer (`window.shGame && shGame.v2()`). Everything else in `pet.js` is session 3's.
- `tools/preview/runtime/preview.js`, the tests, the vault.

**Not to touch**: `migration_v54.sql`; `widget/eggs.js`, `ranks.js`, `rankup.js`, `games.js`; `widget/v3.js` (the
bootstrap already carries `shop`: `window.shBootstrap.data.shop`); the rest of `pet.js` (what Timmy wears, adoption).

**The calls and their shapes** (all in `migration_v54.sql`, section 5; anon may run them):
- `get_my_shop({ p_visitor })` → `{ day, seasons: [season], throwback: bool, wallet: { earned, spent, balance,
  from_xp, trophies, medals, rankups }, items: [{ id, name, kind, rarity, price, season, slot, hp, boost_minutes,
  boost_mult, shelf, gift, owned }], inventory: [{ id, at, how: "bought"|"gift"|"rank" }], locked: [{ id, name, kind,
  rarity, rank_tier }], equipped: { <slot>: <item id> }, costumes: [{ id, day }], snacks_today: [item id], boost:
  null | { mult, until, src } }`. `shelf` is one of `spotted`, `daily`, `weekly`, `season`, `throwback`, `always`;
  `kind` one of `outfit`, `costume`, `home`, `scene`, `yard`, `upgrade`, `snack`, `boost`. The same object is the
  bootstrap's `shop`.
- `buy_item({ p_visitor, p_item, p_request })` → `{ ok: true, item, kind, price, balance, hp, boost_until }`
  (`repeat: true` when the same request id was already paid), or `{ ok: false, error }` with `error` one of `bad`,
  `dup`, `unknown`, `owned`, `rank` (+ `rank_tier`), `not-today`, `today` (that snack was bought today), `balance`
  (+ `balance`, `price`). `p_request` matches `^[A-Za-z0-9_-]{8,64}$`: make one id when the confirm sheet opens and
  send that same id for every tap and retry of that purchase, so a double tap buys once.
- `record_costume_sighting({ p_visitor, p_costume })` → `{ ok: true, first: bool }`, or `error` `bad` or `today` (one
  new sighting a day).
- `get_pet_days_v2({ p_visitor })` → rows `{ d, attempts, correct, hp }`.
- From the place (`widget/place.js`, `window.shPlace`): `setup({ shop })` with a fresh `get_my_shop` answer, then
  `repaint()`; `open({ customize: true })`; `ready()` (a promise: the kit is loaded); `state()`. From the kit
  (`window.SH_PLACE`): `thumb(kind, key)` for a home, scene, yard piece, upgrade or outfit, `setInfo(id)` for a set
  piece's name, rarity and price, the lists `HOMES`, `SCENES`, `YARD`, `OUTFITS`, `UPGRADES`, `PAINTS` (each entry has
  `id`, the shop's id), `dress(svg, key)`. From session 1: `window.SH_SHOP_ART` (`coin(px)`, `thumb(id)` for a snack or a boost,
  `frame(rarity)`, `ITEMS`, `CSS`; "What session 1 built", above).

**How it behaves**:
- **The page** looks like the design page's shop ("The shop's look" in "What session 1 built", above; Sam,
  2026-11-12: "more epic"): the storefront with the balance on the counter (the coin, the number, and a line that
  opens "How you earn gold crowns": 1 for every 10 XP, 25 a trophy, 50 a mastery medal, 20 a rank-up; "Shiny Gold
  Crowns" in full once, "gold crowns" after, never just "crowns"), then Today's showcase, then the shelves, an empty
  one left out: **Today** ("New at midnight"), **This week** ("New Monday") beside **Back for today**, **In
  season** ("Limited time"; a gift shows as "Yours"), **Spotted** (rare costumes that turned up; the others as
  shapes), **Always here** (snacks, boosts). Midnight and Monday are Central time, worked out on the device.
- **A card**: the thumbnail in its rarity's frame, the name, the rarity's name, the price with the coin, and one
  state: Buy, Owned, "N more to go" (the balance is short), "Bought today" (a snack in `snacks_today`), "He's full"
  (a snack while `shPet.hp()` is 100).
- **Buying**: Buy opens a confirm sheet (the item large, the price, the balance after). Yes sends `buy_item`. On
  `ok`: the balance becomes `res.balance`, the shop is read again once (`get_my_shop`), handed to the place
  (`shPlace.setup({ shop })`, `shPlace.repaint()`), and the sheet says what happened: a place piece or an outfit
  offers "Put it on" / "Place it" (`shPlace.open({ customize: true })`); a snack heals Timmy at once
  (`shPet.refresh()`, and he says a line); a boost starts the 2x chip on the rank pill (ask `widget/ranks.js` for a
  fresh profile so `sh:rank-profile` fires: grep `get_rank_profile_v2`). On a refusal the sheet says why in plain
  words, one line per `error`, and nothing changes; if the call fails, nothing was charged and the same request id
  goes again on retry.
- **Rare costumes**: `costumeOfDay(visitor, day)`, a small pure function in `widget/hub-timmy.js` (and the same in
  `dash.js`): from the visitor id and the Central day, on about 1 day in 12 among the days when
  `shPet.holidayId()` is empty and it isn't the fall weeks (Sep 22 to Nov 30, Central: `pet.js` doesn't hand out its
  `isFall`, so write the same test), it names one of the five costumes; the same on every
  reload and every linked device that day. On such a day, if the bootstrap's `shop.costumes` doesn't have it yet:
  call `record_costume_sighting`, and on `first: true` Timmy says once that it came in at the shop, and the Shop row
  and button get a dot. The shop page shows the costume log ("Spotted: 2 of 5", the others as silhouettes). No file
  is fetched for this: it is one call on those days.
- **Without the game layer** (no `shop` in the bootstrap, today's database): no Shop row, no button, no balance.
- **Tracking** (`window.shTrack`): `shop:open`, `shop:buy:<kind>` (the kind only, never the item), `shop:spotted`.
  Every button carries a fixed `data-shop` name.

**The preview's made-up data** (`tools/preview/runtime/preview.js`; `shop2`, `equip2`, `PLACE_BOUGHT` and
`PLACE_START` are there since part C): fill `shop2`'s shelves from the kit's own ids, rarities and prices so they
match the catalog (four daily, three weekly, the season on sale at `?now=`, the always shelf); a wallet per test
account (`new` 0, `returning` about 300, `missed` about 80, so a purchase is refused for balance, `high-xp` about
20,000); `buy2(visitor, item, request)` answering `buy_item` with the server's checks in the server's order (`bad`,
a replay or `dup`, `unknown`, `owned`, `rank`, `not-today`, `today`, `balance`); `record_costume_sighting`; a snack's
`hp` in `get_pet_days_v2` and the bootstrap's `pet_days` the same day; a boost in `rank2`'s profile.

**Budgets**: the three new hubs stay at 20, 20 and 18 requests and the new dashboard at its 30: `shop.js`,
`shop.css` and `hub-art/shop.js` load on first use, and the smoke test fails if one loads with a page.

**Tests to add**:
- `node tools/ci/smoke.js`: on a new hub with a made-up shop in the bootstrap, More has Shop and none of the shop's
  files loaded with the page; the shelves draw; a purchase through a stubbed `buy_item` lowers the balance, turns the
  card to Owned and puts the piece in the place's customizer; a double tap sends one request id; a refused purchase
  says why and changes nothing; a snack at 100 HP can't be bought; no button is without a `data-shop` name; an item's
  name is never drawn as markup. On the new dashboard: the balance shows from the bootstrap, and the Shop button
  fetches the shop only when tapped. On a live hub: nothing changed.
- `tools/release/xp.js`: as part C did for `equip_item`, run one list of purchases (a replay, a double tap, a
  balance too low, an item not on sale today, a second snack the same day, a boost bought twice) through the
  preview's `buy2` and the server's `sh_buy` and fail if an answer differs; `costumeOfDay` names only costumes in the
  catalog and never lands on a day `sh_season` or `sh_is_fall` is set, for every day of three years.
- `tools/release/a11y.js`: the shop page and the confirm sheet, added to the baseline with no issues.

**Out of scope**: what Timmy wears on the bar and "everyone has Timmy" (session 3); visiting; the bowling egg;
price changes; a sixth costume; gold crowns on a hub's top bar or a counter that ticks after an answer; gifting;
editing the About page (draft it in [the release note](2026-11-06-redesign-release.md), "From phase 4, part B",
with the rare costumes in a spoiler, and finish part C's "What you own" line there).

**Done when** (session 2):
- [x] The shop opens from a new hub's More, from the new dashboard's "you" card and from the place's customizer
- [x] Buying works end to end on the preview's made-up data, for each kind; every refusal has its line
- [x] The balance shows where Sam chose, and changes after a purchase
- [x] A snack heals Timmy the same on the bar, at his place and on the dashboard (`simulate()` reads `hp`), and a
      live page computes his HP exactly as before
- [x] A rare costume turns up, is logged once, and sits on the Spotted shelf until bought
- [x] The tests above added and passing; `node tools/release/run.js` once; budgets unchanged (2026-11-12: all 17 suites passed, `perf.js` within budget)
- [x] Screenshots (phone and laptop, light and dark) and a short recording of one purchase sent to Sam
- [x] `tools/podcast/LORE.md` (the five costumes and their lines), the About draft, the event taxonomy and
      retention rows, [game-server](../reference/game-server.md), the hand-off in phase 4's Log

## Done when

- [x] The catalog drawn and approved by Sam (light and dark): the coin, the outfits, the snacks, the boosts, the
      rare costumes, the rarity frames (session 1's Done when, above; the seasonal sets were approved in round 3).
      Sam, 2026-11-12: "Everything looks good" ([#339](https://github.com/smcmurry6-source/study-hubs/pull/339))
- [x] Server: gold crowns, the catalog and rotation, `buy_item`, `equip_item`, the inventory and purchases, HP from snacks, the boosts,
      tested on a throwaway copy (a double tap, a replayed call, a balance too low, an item not on sale today, a linked device)
- [ ] Client: the shop in More, the balance on the "you" card, rare costumes (session 2's Done when, above), shown to
      Sam in screenshots and a recording from a scripted browser on made-up data (no hosted preview: Sam, 2026-11-12)
      - [x] from part C of phase 4 (2026-11-12, [its hand-off](2026-11-05-redesign-phase-4-game-layer.md)): the place's
            customizer gets its "Get more in the shop" link; `widget/pet.js` reads snack HP (`get_pet_days_v2`'s `hp`);
            after a purchase the place is told (`shPlace.setup({ shop })`, `shPlace.repaint()`)
      - [x] the five everyday outfits with no drawing are drawn (Sam, 2026-11-12: draw them; session 1;
            [task](done/2026-11-12-five-outfits-without-a-drawing.md))
- [x] `LORE.md`, the About page (Shiny Gold Crowns, the shop, rarity, boosts, health items; rare costumes in a spoiler), the event taxonomy
      and retention rows (session 2; the About page's entry is drafted in [the release note](2026-11-06-redesign-release.md),
      "From phase 4, part B", and goes on the page with the release)
- [ ] CI and the release suites pass (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`, `node tools/release/run.js`)
- [ ] Vault written back (decisions, `DEPLOY_NOTES.md`, this note's Outcome)

## Log

- 2026-11-06: workshop of Sam's idea.
- 2026-11-06: Sam's calls (above). Bowling moved to [its own note](2026-11-06-redesign-bowling-egg.md) as an Easter egg; the
  house card's redesign to [Timmy's place](2026-11-06-redesign-timmys-place.md).
- 2026-11-06: the currency renamed from Mints to Shiny Gold Crowns (Sam).
- 2026-11-06 (Claude Code): the server is written and tested on a throwaway copy (`migration_v54.sql`, phase 5 part 3;
  [game-server](../reference/game-server.md)): `sh_wallet`, `shop_items` with the price bands checked, the daily, weekly,
  seasonal and always shelves (`sh_season` / `sh_is_fall` match `widget/pet.js` on every day of 2026-2028), `buy_item`,
  `equip_item`, `pet_inventory`, `pet_purchases`, snack HP in `get_pet_days_v2`, shop boosts that extend, the costume log
  (`record_costume_sighting`; a spotted costume joins that visitor's shop), Link my devices merging all of it. The 48-item
  catalog is a draft for phase 4's art and Sam's look. The gold crowns' one-time grants (trophies, medals, rank-ups) count
  from the release on; the XP from before counts (the note's "median about 120").
- 2026-11-06 (Claude Code): the catalog follows Timmy's place's art (Sam: "upgrade the names"): 68 rows, the homes,
  scenes, yard things, paints, upgrades and the six theme outfits with the kit's ids, rarities and prices; five yard spots
  and `wide` for the bowling lane ([Timmy's place](2026-11-06-redesign-timmys-place.md), PR #289). The outfits not drawn
  yet, the snacks, boosts and seasonal items are still drafts.
- 2026-11-10: Sam's new calls for the shop (daily and weekly items plus a seasonal section; a full seasonal set per season
  with a Legendary house and scene; past seasons unlocked for everyone; rank-up unlocks) are in [round 3](done/2026-11-10-redesign-timmys-place-round-3.md).
- 2026-11-10 (Claude Code): round 3 ([its note](done/2026-11-10-redesign-timmys-place-round-3.md)): the catalog is 180 rows
  (181 later that day, with Timmy's podcast studio, `podcast-studio`)
  (56 everyday, 112 seasonal in 14 sets, 12 rank pieces); `get_my_shop` returns the daily and weekly picks, the seasons
  on sale and a "Back for today" shelf on two throwback days a month; rank sets are earned, Halloween's set is a gift;
  visiting is `get_place` from a board's visit key. `tools/release/xp.js`: 344 checks. The design page shows the shelves.
- 2026-11-12 (Claude Code, planning only): Sam's calls for the shop and two build specs, the art and the client
  (above); the order of every session left is in [phase 4](2026-11-05-redesign-phase-4-game-layer.md) ("From here to
  the release"). What Timmy wears changed: only what the student put on.
- 2026-11-12 (Claude Code), session 1, the art ([#339](https://github.com/smcmurry6-source/study-hubs/pull/339)):
  the coin (with its own cut for 16 px), four snacks, two boosts, the five frames, the five everyday outfits and the
  five rare costumes, and Timmy's door spot in all 22 homes; what it built and what session 2 needs from it is "What
  session 1 built", above. The frames and the regular coin are round 3's drawings, moved from the place's kit into
  `shop.mjs`. Nothing disagreed with `migration_v54.sql`, and it is unchanged. `tools/release/xp.js`: 358 checks (no
  undrawn outfit, the five costumes, the shelf's thumbnails against the catalog). One thing left open: BUG-095.
- 2026-11-12 (Claude Code), same session, after the sheets: Sam: "I want the shop ui to be more epic". The design
  page's shop is redrawn as a storefront, a showcase and fuller shelves (new art: `store()` and `stand()` in
  `shop.mjs`; "The shop's look", above), still no client code. Sent to Sam as screenshots at 1280 and 390 px, light
  and dark (`node tools/figures/site/shop-sheets.mjs <out-dir> ui`).
- 2026-11-12: Sam's yes for all of it: "Actually its good. Everything looks good. Merge when ready", "i like the
  redesign" ([decisions](../decisions.md)). No price to change. Session 1 is done; `main` (Ask Timmy's chat, #338)
  was brought in before the merge, and this branch's new bug became BUG-095. **Next: session 2, the client.**
- 2026-11-12 (Claude Code), **session 2, the shop's client** (this PR): `widget/shop.js` + `widget/shop.css`
  (`window.shShop`), built to the design page's shop; the hub engine's Shop row in More, the new dashboard's balance and
  Shop button, the place's "Get more in the shop"; snacks heal through `get_pet_days_v2` (`widget/pet.js`); boosts start
  the 2x chip; the rare costume of the day. `migration_v54.sql` unchanged, and nothing in it disagreed with the client.
  What it built, the tests and what's left: phase 4's Log (the hand-off for session 3). Screenshots and a recording sent
  to Sam. Found and fixed while testing: BUG-098 to BUG-104 ([the bug log](../release/bug-log.md)).

## Outcome

Related: [Timmy's place](2026-11-06-redesign-timmys-place.md) · [the journeys](2026-11-06-redesign-progression-journeys.md) ·
[phase 4](2026-11-05-redesign-phase-4-game-layer.md) · [podcast-reactions](../rules/podcast-reactions.md)

## Opening prompts

Session 1 (the art):

> Work in smcmurry6-source/study-hubs. Read `AGENTS.md`, then "From here to the release" in
> `vault/tasks/2026-11-05-redesign-phase-4-game-layer.md`, then do **"Build spec, session 1: the shop's art"** in
> `vault/tasks/2026-11-06-redesign-timmy-shop.md`. Art only, no client code. Grep the big files, never read them
> whole. No subagents. `migration_v54.sql` is not applied and is not to be changed: if something disagrees with it,
> tell me. Send me the three contact sheets, light and dark, and wait for my yes before you finish. No hosted preview.

Session 2 (the client), after session 1 is merged:

> Work in smcmurry6-source/study-hubs. Read `AGENTS.md`, then "From here to the release" in
> `vault/tasks/2026-11-05-redesign-phase-4-game-layer.md` and its Log's last entries, then do **"Build spec, session
> 2: the shop's client"** in `vault/tasks/2026-11-06-redesign-timmy-shop.md`. Grep the big files, never read them
> whole. No subagents. `migration_v54.sql` is not applied and is not to be changed: if the client disagrees with it,
> tell me. No hosted preview: screenshots and a recording from a scripted browser on the preview's made-up data.
> Open a draft PR with the test report; I'll say "merge".
