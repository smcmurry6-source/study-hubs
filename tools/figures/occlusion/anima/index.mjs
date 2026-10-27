// The Occlusion hub's anima figures (approved by Sam in the 2026-10-20 diagram review), in build order.
import { tmj } from "./tmj.mjs";
import { cuspmotion } from "./cuspmotion.mjs";
import { interferences } from "./interferences.mjs";
import { muscles } from "./muscles.mjs";
import { cuspheight } from "./cuspheight.mjs";
import { envelope } from "./envelope.mjs";
import { crslide } from "./crslide.mjs";
import { guidance } from "./guidance.mjs";
import { swallow } from "./swallow.mjs";
import { implant } from "./implant.mjs";
// L6 (final), approved by Sam 2026-10-27
import { mounterr } from "./mounterr.mjs";
import { hingearc } from "./hingearc.mjs";
import { scirec } from "./scirec.mjs";
import { bennett } from "./bennett.mjs";
export const FIGURES = [tmj(), cuspmotion(), interferences(), muscles(), cuspheight(), envelope(), crslide(), guidance(), swallow(), implant(), mounterr(), hingearc(), scirec(), bennett()];
