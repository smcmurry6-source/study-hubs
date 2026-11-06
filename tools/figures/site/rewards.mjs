/* The reward art that moves on every answer: the streak flame (three sizes as a streak grows) and the XP spark that
   floats from the picked choice to the rank pill. Ink style from style.mjs. The flame's parts carry classes so the page
   can make them flicker (.fl-out, .fl-in, .fl-spark); the drawing is complete without the motion. */
import { INK, C } from "./style.mjs";

const OUTER = "M20 3.5 C23.6 11 33.5 16.4 33.8 28.6 C34 38.4 27.8 45 20 45 C12.2 45 6 38.8 6.2 30 C6.4 23.6 9.6 19.2 13 15.2 " +
  "C12.6 20.4 14.6 24 17.6 25.2 C16.4 17.6 16.6 9.8 20 3.5 Z";
const INNER = "M20.4 21.6 C23.4 26.6 27.6 29.8 27.4 35.2 C27.2 40 24 42.6 20.2 42.6 C16.2 42.6 13 40 13.2 35.6 C13.4 31.6 15.8 29.6 17.4 26.6 " +
  "C18 29.2 19.2 30.4 20.6 30.6 C19.6 27.6 19.6 24.6 20.4 21.6 Z";
const SMALL = "M20 18 C22.6 23.4 28 26.8 28 34 C28 40 24.4 44 20 44 C15.6 44 12 40.4 12 35 C12 31 14.2 28.4 16.2 26 C16.4 29 17.6 30.6 19.2 31 C18.2 26.6 18.4 21.8 20 18 Z";
const SMALL_IN = "M20.2 30 C22 32.6 24.4 34.4 24.2 37.6 C24 40.4 22.4 42 20.2 42 C17.8 42 16.2 40.4 16.4 37.8 C16.6 35.8 17.8 34.6 18.6 33.2 C19 34.4 19.6 35 20.4 35.2 C19.8 33.6 19.8 31.6 20.2 30 Z";

const stroke = `stroke="${INK}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"`;

/* level 1: an ember (a 1-2 day streak), 2: a flame (3-6), 3: a blaze with sparks (7+) */
export const FLAME = {
  1: `<g class="fl-out"><path d="${SMALL}" fill="${C.orange}" ${stroke}/></g><g class="fl-in"><path d="${SMALL_IN}" fill="${C.yellow}"/></g>` +
     `<path d="M15.4 33.6 C15.6 31.4 16.6 29.8 17.6 28.6" stroke="#fff" stroke-width="1.6" stroke-linecap="round" fill="none" opacity=".7"/>`,
  2: `<g class="fl-out"><path d="${OUTER}" fill="${C.orange}" ${stroke}/></g><g class="fl-in"><path d="${INNER}" fill="${C.yellow}"/></g>` +
     `<path d="M10.4 30.6 C10.6 26.8 12.2 23.6 14 21.4" stroke="#fff" stroke-width="1.8" stroke-linecap="round" fill="none" opacity=".7"/>`,
  3: `<g class="fl-spark"><path d="M5 12 l1.2 2.6 2.6 1.2 -2.6 1.2 -1.2 2.6 -1.2 -2.6 -2.6 -1.2 2.6 -1.2 Z" fill="${C.yellow}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>` +
     `<circle cx="35" cy="9" r="1.8" fill="${C.orange}" stroke="${INK}" stroke-width="1.1"/></g>` +
     `<g class="fl-out"><path d="M28.6 13.2 C31.2 16.6 34.6 18 35.6 22.6 C34.2 21.4 32.6 20.8 31 20.8" fill="${C.red}" ${stroke}/>` +
     `<path d="${OUTER}" fill="${C.red}" ${stroke}/></g>` +
     `<g class="fl-in"><path d="M20.2 13.6 C24 20 30.4 23.4 30.2 31.8 C30 39.2 25.6 43.4 20 43.4 C14.4 43.4 10 39.6 10.2 33.2 C10.4 28.6 13 25.8 15.2 22.6 C15.6 26 17 27.8 18.8 28.4 C17.8 23.2 18.2 18 20.2 13.6 Z" fill="${C.orange}"/>` +
     `<path d="${INNER}" fill="${C.yellow}"/></g>` +
     `<path d="M10.4 30.6 C10.6 26.8 12.2 23.6 14 21.4" stroke="#fff" stroke-width="1.8" stroke-linecap="round" fill="none" opacity=".7"/>`
};
export const FLAME_VIEWBOX = [0, 0, 40, 48];

/* the XP spark: a four-point twinkle in gold */
export const XP = `<path d="M12 1.8 C12.9 7.6 15.6 10.6 22.2 12 C15.6 13.4 12.9 16.4 12 22.2 C11.1 16.4 8.4 13.4 1.8 12 C8.4 10.6 11.1 7.6 12 1.8 Z" ` +
  `fill="${C.gold}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>` +
  `<path d="M10.2 8.4 C10.8 7.4 11.2 6.4 11.5 5.4" stroke="#fff" stroke-width="1.3" stroke-linecap="round" fill="none" opacity=".8"/>`;
export const XP_VIEWBOX = [0, 0, 24, 24];
