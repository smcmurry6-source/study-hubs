// The PCD Implants Exam 1 hub's anima figures (Sam, 2026-11-03: "Yes to all animations and figures"), in build order.
import { attach } from "./attach.mjs";
import { stages } from "./stages.mjs";
import { misch } from "./misch.mjs";
import { cantilever } from "./cantilever.mjs";
import { position } from "./position.mjs";
import { connection } from "./connection.mjs";
import { stability } from "./stability.mjs";
import { zones } from "./zones.mjs";
import { retention } from "./retention.mjs";
import { cbct } from "./cbct.mjs";
import { guided } from "./guided.mjs";
export const FIGURES = [attach(), stages(), misch(), cantilever(), position(), connection(), stability(), zones(), retention(), cbct(), guided()];
