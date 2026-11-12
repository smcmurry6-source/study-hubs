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
// L7 (final), approved by Sam 2026-11-03
import { tolerance } from "./tolerance.mjs";
import { stability } from "./stability.mjs";
import { splints } from "./splints.mjs";
import { thirds } from "./thirds.mjs";
import { erosion } from "./erosion.mjs";
// L8 (final), approved by Sam 2026-11-05
import { resorb } from "./resorb.mjs";
import { ssr } from "./ssr.mjs";
import { schemes } from "./schemes.mjs";
import { toothforms } from "./toothforms.mjs";
// L9 (final), approved by Sam 2026-11-10
import { abfract } from "./abfract.mjs";
import { buffer } from "./buffer.mjs";
import { cupping } from "./cupping.mjs";
// L10 (final), approved by Sam 2026-11-12
import { otsupport } from "./otsupport.mjs";
import { otjiggle } from "./otjiggle.mjs";
import { otmobility } from "./otmobility.mjs";
/* L7's Fig 19 again under L9, opened on vomiting, with L9's reasons; an alias (build.mjs), so no second copy of the drawing */
const erosion9 = {
  id: "erosion9", alias: "erosion", lec: "nccl",
  title: "Where acid erodes: vomiting and NCCLs",
  caption: "L7's erosion map, opened on vomiting: the lingual of the maxillary teeth, mostly the anteriors. Tap NCCLs for the cervical notches, or any other cause to compare.",
  data: {
    start: "bulimia",
    extra: {
      bulimia: " Dr. Lawson (L9) gives the reason: the lip protects the facial surfaces, and the tongue the lingual of the mandibular teeth.",
      nccl: " L9: when acidic fluids sit at the cervical area, they make NCCLs; erosion is one of the three causes, with abrasion and abfraction, alone or together.",
    },
  },
};
export const FIGURES = [tmj(), cuspmotion(), interferences(), muscles(), cuspheight(), envelope(), crslide(), guidance(), swallow(), implant(), mounterr(), hingearc(), scirec(), bennett(), tolerance(), stability(), splints(), thirds(), erosion(), resorb(), ssr(), schemes(), toothforms(), abfract(), buffer(), cupping(), erosion9, otsupport(), otjiggle(), otmobility()];
