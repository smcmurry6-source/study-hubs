---
type: how-to
tags: [how-to, art, timmys-place, shop, redesign]
---

# Draw a seasonal set or a rank set for Timmy's place

Since 2026-11-10 (Sam's third round on Timmy's place) every season and holiday has a **full set** in the shop, and every
full rank-up gives a **rank set**. A season's set is eight pieces: 1 home and 1 scene (both Legendary) and a Rare, an
Epic and a Legendary outfit and yard piece. A rank set is an outfit and a yard piece, earned and never sold.

## One list, three readers

`tools/figures/site/sets.mjs` names every piece (id, name, rarity, price; `SEASONS` and `RANKS`). Three things follow it:

- **the art**: `tools/figures/site/packs/<season>.mjs` (and `packs/ranks.mjs`) draws exactly those ids;
- **the catalog**: `shop_items` in `migration_v54.sql` has exactly those rows ([game-server](../reference/game-server.md));
- **the build**: `node tools/figures/site/build.mjs` fails if a pack draws a piece the list doesn't have, misses one, or
  gives it the wrong kind. `--strict` also fails when a set has no pack yet.

To add a season: add it to `SEASONS`, its window to `sh_shop_seasons` and its rows to `shop_items` (the server), and
draw its pack. The dates people read (`when`) are in `sets.mjs`; the dates that count are the server's.

## A pack

One file exporting `function pack(T)` that returns `{ k, homes, scenes, yard, outfits }`, keyed by the shop ids. `T` is
the kit's toolbox (`TOOLS` in `place.mjs`: the projection, the ink and fill helpers, solids, windows, plants, sky,
`hillScene`). The pack's source is pasted into `tools/preview/design/place.js`, so it uses nothing from outside itself
but `T`. Names, rarities and prices come from `sets.mjs`, never from the pack.

`packs/thanksgiving.mjs` is the worked example: its header says what each kind of piece needs (a home's door, brush and
statue spots and what Timmy walks round; a scene through `T.hillScene`; a yard piece's footprint, spot and easter egg;
an outfit's `back`, `face` and `top` in Timmy's box).

The house style holds ([every-hub-gets-its-own-art](../rules/every-hub-gets-its-own-art.md)): drawn SVG in Timmy's ink
style, flat fills and ink outlines, no ids, gradients, filters, text, images or emoji. **Never sugar**: Timmy is a tooth,
so no candy, cake or soda as something good. Holidays are drawn by their secular trimmings.

## Check and look

```bash
node tools/figures/site/build.mjs --pack <set> --dry      # one set: house style, every piece drawn, Timmy's walks; writes nothing
node tools/figures/site/pack-preview.mjs <set> out.png     # a contact sheet of the set (needs Playwright); add "dark", or home|scene|yard|outfits
node tools/figures/site/build.mjs                          # everything, and writes tools/preview/design/place.js
node tools/figures/site/build.mjs --check                  # CI: fails if place.js is stale
```

Look at the sheet every round: the build can't tell that a piece doesn't read as what it's named, that the door, the
statue or the toothbrush is covered, or that an outfit hides Timmy's face. When several agents draw sets at once, each
edits only its own pack and runs only `--pack <set> --dry`, because the plain build writes files they share.

The design page (`tools/preview/design/`, "The seasonal sets" and "Rank sets") shows every set; Sam looks before any of it
is wired into `widget/pet.js` ([preview-and-release-test](../rules/preview-and-release-test.md)).

Related: [game-server](../reference/game-server.md) · [Timmy's place, round 3](../tasks/2026-11-10-redesign-timmys-place-round-3.md) ·
[Timmy's shop](../tasks/2026-11-06-redesign-timmy-shop.md) · [every-hub-gets-its-own-art](../rules/every-hub-gets-its-own-art.md) ·
[repo-map](../reference/repo-map.md)
