// The Periodontology hub's anima figures (Sam approved all six on 2026-11-03), in build order.
import { pistates } from "./pistates.mjs";
import { meffert } from "./meffert.mjs";
import { bop } from "./bop.mjs";
import { xrays } from "./xrays.mjs";
import { biofilm } from "./biofilm.mjs";
import { targets } from "./targets.mjs";
// S8 host modulation, approved by Sam 2026-11-06 ("Build all proposed figures")
import { hostmod } from "./hostmod.mjs";
// S9 plastic therapy and esthetics, approved by Sam 2026-11-10 ("Yes to all diagrams")
import { cairo } from "./cairo.mjs";
import { palate } from "./palate.mjs";
import { grafts } from "./grafts.mjs";
import { ape } from "./ape.mjs";
import { egd } from "./egd.mjs";
export const FIGURES = [pistates(), meffert(), bop(), xrays(), biofilm(), targets(), hostmod(), cairo(), palate(), grafts(), ape(), egd()];
