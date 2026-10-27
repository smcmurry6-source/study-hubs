// The Heme & Endo Exam 1 hub's anima figures (Sam, 2026-10-27: "Yes to all animations"), in build order.
// calcium uses the lab-panel CSS (.hp-wrap, .hp-labs, .hp-row...) that hpa defines.
import { beta } from "./beta.mjs";
import { thyroid } from "./thyroid.mjs";
import { hpa } from "./hpa.mjs";
import { calcium } from "./calcium.mjs";
import { pituitary } from "./pituitary.mjs";
import { adrenal } from "./adrenal.mjs";
export const FIGURES = [beta(), thyroid(), hpa(), calcium(), pituitary(), adrenal()];
