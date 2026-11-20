---
type: rule
load: on-demand
tags: [arcade]
---

# Every hub's arcade looks like that hub

Sam's rule, 2026-10-21: arcade games are never copied and pasted from one hub to the next. The rules of a game live once in
`widget/games.js` (Showdown, Mind the Gap, the escape room, Smile, Cross-Section; contract at the top of the file); each hub
gives them **its own look and story** through `skin` in the context its arcade passes to `shGames.make` (Occlusion: `OCCL_SKIN`, Perio:
`PERIO_SKIN`):
- **Escape room**: its own room and props drawn for that course (`escape.scene(api)` for a whole room, or `escape.parts` to swap
  single parts), its own spot labels and flavor text, and its own key item and reveal (Occlusion: articulating paper on the
  mounted casts; Perio: disclosing tablets on a typodont). Every hotspot goes through `api.spot()`, the clock hand through `api.hand()`.
  A room can be a painted backdrop (`hubs/<hub>/img/*.webp`, Sam generates them from prompts) with the hotspots measured onto it
  (Occlusion's `lab-escape.webp`); keep the overlays that show a lock's state (dark screen until solved, the digit badges).
- **Board, Mind the Gap**: names for the wager rounds (`board.dd`, `board.final`), intros and button labels, and CSS keyed on
  `[data-sg-skin="<hub>"]` in the hub's own stylesheet (Occlusion: articulating-paper strips; Perio: a perio chart whose teeth bleed,
  a probe-ruler clock).
- Game names in the hub's games list and its lobby drawings are the hub's own too.
**On the engine** (every hub since the redesign's release, 2026-11): the arcade lives in More. Its lobby shows **every
game** (Sam, 2026-11-06), the hub's pick first and full width (`SH_HUB.arcade.first`, Occlusion: Cusp Sort; Perio: Pocket
Showdown), each tile on its own field of color with **the game's own drawing** across its top: SVG in the house ink
style, drawn from the hub's own world in `tools/figures/site/arcade.mjs` and built into `widget/hub-art/<hub>.js`
(`games`); a hub without drawings yet shows each game's icon. The old lobbies' painted thumbnails (`img/thumb-*.webp`)
aren't used. The hub's games list is `SH_HUB.arcade.games` in its page, and its skin is `content/arcade.js` and
`content/arcade.css` beside it. The skin rules above are unchanged.

A new hub builds its skin from its own material before it ships; reuse the mechanics, never another hub's art or wording. Game
ideas Sam wants considered for future hubs: quiz games, typing games, point-and-click and escape rooms.
