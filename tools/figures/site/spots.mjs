/* Spot art for the hub engine's Home cards (Sam, 2026-11-06: "the Today and the Timmy Time card more decorative").
   Ink style from style.mjs. Each spot is inner markup for its own viewBox; parts that take the hub's tint carry a
   class (the page colors them: .sp-tint and .sp-tint-light fill, .sp-tint-line strokes), everything else is the flat house fills.

   - HEADPHONES: drawn in Timmy's own frame (pet.js draws him in "0 -30 200 262"), so the build lays them over the
     live Timmy drawing: Timmy Time's host, on the Timmy Time card.
   - NOTES: two music notes and a sound wave, for the same card.
   - TODAY: a desk calendar page with a check, for the Today card. */
import { INK, C, HI } from "./style.mjs";

const ink = (w) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

/* the band arcs over his crown (crown top at y 32, sides at x 45 and 151); the cups sit at eye level */
export const HEADPHONES =
  `<path d="M38 104 C30 52 60 16 98 15 C138 14 168 50 158 104" fill="none" ${ink(11)}/>` +
  `<path d="M38 104 C30 52 60 16 98 15 C138 14 168 50 158 104" fill="none" class="sp-tint-line" stroke-width="5" stroke-linecap="round"/>` +
  `<path d="M60 34 C70 26 82 22 94 21" ${HI}/>` +
  /* left cup, then its pad against the tooth */
  `<path d="M24 86 C24 76 30 72 38 72 L44 72 C48 72 50 75 50 79 L50 113 C50 117 48 120 44 120 L38 120 C30 120 24 116 24 106 Z" class="sp-tint" ${ink(4.5)}/>` +
  `<path d="M30 84 C30 80 32 78 35 78" ${HI}/>` +
  `<path d="M44 76 L50 76 L50 116 L44 116 Z" fill="${C.plum}" ${ink(3)}/>` +
  /* right cup */
  `<path d="M172 86 C172 76 166 72 158 72 L152 72 C148 72 146 75 146 79 L146 113 C146 117 148 120 152 120 L158 120 C166 120 172 116 172 106 Z" class="sp-tint" ${ink(4.5)}/>` +
  `<path d="M152 76 L146 76 L146 116 L152 116 Z" fill="${C.plum}" ${ink(3)}/>` +
  `<path d="M166 84 C166 80 164 78 161 78" ${HI}/>`;

/* in a 120 x 120 box: a beamed pair of eighth notes, a single note and a sound wave */
export const NOTES =
  `<path d="M30 40 C30 40 30 78 30 80" fill="none" ${ink(3.5)}/>` +
  `<path d="M62 32 L62 72" fill="none" ${ink(3.5)}/>` +
  `<path d="M30 40 C40 36 52 34 62 32 L62 42 C52 44 40 46 30 50 Z" fill="${C.gold}" ${ink(3)}/>` +
  `<path d="M18 84 C18 77 24 74 30 76 C34 77 35 82 33 86 C30 91 18 92 18 84 Z" fill="${C.gold}" ${ink(3)}/>` +
  `<path d="M50 76 C50 69 56 66 62 68 C66 69 67 74 65 78 C62 83 50 84 50 76 Z" fill="${C.gold}" ${ink(3)}/>` +
  `<path d="M22 82 C22 80 24 79 26 79" ${HI}/>` +
  `<path d="M94 62 L94 92" fill="none" ${ink(3.5)}/>` +
  `<path d="M94 62 C100 64 104 68 106 74" fill="none" ${ink(3.5)}/>` +
  `<path d="M82 96 C82 89 88 86 94 88 C98 89 99 94 97 98 C94 103 82 104 82 96 Z" class="sp-tint-light" ${ink(3)}/>` +
  `<path d="M80 30 C86 24 86 16 80 10" fill="none" class="sp-tint-line" stroke-width="3.5" stroke-linecap="round"/>` +
  `<path d="M90 36 C100 26 100 12 90 2" fill="none" class="sp-tint-line" stroke-width="3.5" stroke-linecap="round" opacity=".6"/>`;
export const NOTES_VIEWBOX = [0, 0, 120, 110];

/* in a 96 x 96 box: a page torn from a desk calendar, its rings, a check in the hub's tint */
export const TODAY =
  `<path d="M14 24 C14 18 18 15 24 15 L72 15 C78 15 82 18 82 24 L82 80 C82 86 78 89 72 89 L24 89 C18 89 14 86 14 80 Z" fill="${C.paper}" ${ink(3)}/>` +
  `<path d="M74 22 L74 82 C74 85 72 86 70 86 L78 86 C80 85 82 83 82 80 L82 24 C82 21 80 19 78 18 Z" fill="${C.paperShade}"/>` +
  `<path d="M14 24 C14 18 18 15 24 15 L72 15 C78 15 82 18 82 24 L82 36 L14 36 Z" class="sp-tint" ${ink(3)}/>` +
  `<path d="M22 22 C24 20 26 19 30 19" ${HI}/>` +
  `<path d="M30 8 L30 22 M48 8 L48 22 M66 8 L66 22" fill="none" stroke="${C.metalShade}" stroke-width="6" stroke-linecap="round"/>` +
  `<path d="M30 8 L30 22 M48 8 L48 22 M66 8 L66 22" fill="none" stroke="${C.metal}" stroke-width="3" stroke-linecap="round"/>` +
  `<path d="M30 60 C35 65 39 69 42 72 C50 60 58 52 68 46" fill="none" class="sp-tint-line" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`;
export const TODAY_VIEWBOX = [0, 0, 96, 96];
