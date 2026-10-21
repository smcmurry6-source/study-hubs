// The Occlusion hub's anima figures (approved by Sam in the 2026-10-20 diagram review), in build order.
import { tmj } from "./tmj.mjs";
import { cuspmotion } from "./cuspmotion.mjs";
import { interferences } from "./interferences.mjs";
import { muscles } from "./muscles.mjs";
import { cuspheight } from "./cuspheight.mjs";
import { envelope } from "./envelope.mjs";
export const FIGURES = [tmj(), cuspmotion(), interferences(), muscles(), cuspheight(), envelope()];
