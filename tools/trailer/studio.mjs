/* The inside of Timmy's podcast studio, for the launch trailer (vault/tasks/2026-11-13-launch-trailer.md).

   The studio is a yard piece at Timmy's place (tools/figures/site/place.mjs, YARD.studio): a padded purple booth with
   a cream-trimmed window, a red on-air lamp, the show's yellow poster (the tooth in red headphones) and his
   microphone. This is the same booth from the inside, drawn in the site's ink style (tools/figures/site/style.mjs:
   one ink, flat fills, a darker flat shade away from the light, short white highlights), in a 1920 x 1080 frame.
   Nothing here says where the booth stands or what Timmy wears (tools/podcast/LORE.md): the window shows sky.

   Timmy himself is the live drawing (widget/pet.js, shPet.art) under the Timmy Time headphones
   (tools/figures/site/spots.mjs), as on the Timmy Time card. His mouth is taken out and left as an empty
   <g class="tm-mouth">, which compose.mjs redraws every frame from how loud his voice is (mouth() below).

   Parts that move carry a class and nothing else (compose.mjs moves them from the timeline, so a frame is the same
   every time it is rendered): tm-timmy (he bobs), tm-arm-r (a gesture), shpet-eye (blinks), tm-lamp-on and tm-glow
   (the on-air lamp), tm-seg (the mixer's meters), tm-steam, tm-cloud. */
import vm from "node:vm";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { INK, C, HI } from "../figures/site/style.mjs";
import { HEADPHONES } from "../figures/site/spots.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const ink = (w) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

/* the booth's colors, from the yard piece */
const WALL = "#8A76D6", WALL_SHADE = "#6452AE", FOAM = "#7765C4", FOAM_DARK = "#5B4A9E", TRIM = "#FFFDF6", LAMP_OFF = "#B7474D", LAMP_ON = "#FF5A5F",
  POSTER = "#FFD95A", DOOR = "#F29E4C", SKY = "#BFE6F5", CONSOLE = "#5A4A5E", CONSOLE_DARK = "#3B2E3A";

/* ---------- Timmy, as the site draws him (the same sandbox as tools/figures/site/build.mjs) ---------- */
function petArt(){
  const store = {};
  const el = () => ({ style: {}, setAttribute(){}, appendChild(){}, addEventListener(){}, classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    querySelector(){ return null; }, querySelectorAll(){ return []; } });
  const win = {
    localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } },
    matchMedia: () => ({ matches: false, addEventListener(){} }), addEventListener(){}, setTimeout, clearTimeout, setInterval(){}, console,
    document: { createElement: el, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], addEventListener(){},
      head: el(), body: el(), documentElement: el(), readyState: "complete" },
    navigator: { userAgent: "node" }, location: { href: "http://localhost/", search: "", hostname: "localhost" }, Intl, Date, Math, JSON
  };
  win.window = win; win.self = win;
  vm.runInContext(fs.readFileSync(path.join(root, "widget/pet.js"), "utf8"), vm.createContext(win), { filename: "widget/pet.js" });
  return (state) => win.shPet.art(Object.assign({ hat: "" }, state), 200);
}
const pet = petArt();

/* Timmy in his headphones, mouth left empty. `id` keeps two of him on a page apart (his gradients' ids).
   He is drawn in pet.js's frame, "0 -30 200 262": the caller places and scales the <g>. */
const CLOSED = '<path d="M89 104 Q100 113 111 104" stroke="' + INK + '" stroke-width="3.6" fill="none" stroke-linecap="round"/>';
export function timmy(id){
  let s = pet({ hp: 100, mood: "ok" }).replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "").replace(/shpt\d+-/g, "tm" + id + "-");
  if (!s.includes(CLOSED)) throw new Error("studio.mjs: widget/pet.js draws Timmy's mouth differently now; update CLOSED");
  s = s.replace(CLOSED, '<g class="tm-mouth">' + CLOSED + "</g>");
  s = s.replace('class="shpet-arm shpet-arm-r"', 'class="shpet-arm shpet-arm-r tm-arm-r"');
  return '<g class="tm-timmy">' + s + HEADPHONES + "</g>";
}

/* His mouth at an openness of 0 (shut, the smile) to 1, with `wob` (-1..1) varying its width so it doesn't pump.
   Runs in the page too (compose.mjs sends its source), so it uses nothing from this file but its arguments. */
export function mouth(o, wob, INK){
  if (o < 0.07) return '<path d="M89 104 Q100 113 111 104" stroke="' + INK + '" stroke-width="3.6" fill="none" stroke-linecap="round"/>';
  var w = 10.5 - 3.2 * o + 1.6 * wob, h = 2.5 + 10.5 * o, y = 103.5, f = function(n){ return n.toFixed(1); };
  var s = '<path d="M' + f(100 - w) + " " + y + " Q100 " + f(y - 1.5 - 1.5 * o) + " " + f(100 + w) + " " + y + " Q" + f(100 + w * .9) + " " + f(y + h * 1.25) + " 100 " + f(y + h * 1.3) +
    " Q" + f(100 - w * .9) + " " + f(y + h * 1.25) + " " + f(100 - w) + " " + y + ' Z" fill="#6B2B3A" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>';
  if (o > 0.4) s += '<ellipse cx="100" cy="' + f(y + h * .95) + '" rx="' + f(w * .5) + '" ry="' + f(h * .3) + '" fill="#FF7A8E"/>';
  return s;
}

/* ---------- the booth ---------- */
/* one acoustic foam tile: a padded square with three wedges, running across or down */
function tile(x, y, s, across, dark){
  let t = `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="10" fill="${dark ? FOAM_DARK : FOAM}" stroke="${INK}" stroke-width="3" opacity=".95"/>`;
  for (let i = 1; i <= 3; i++) {
    const p = (s * i) / 4;
    t += across
      ? `<path d="M${x + 14} ${y + p} L${x + s - 14} ${y + p}" fill="none" stroke="${dark ? FOAM : WALL}" stroke-width="7" stroke-linecap="round" opacity=".55"/>`
      : `<path d="M${x + p} ${y + 14} L${x + p} ${y + s - 14}" fill="none" stroke="${dark ? FOAM : WALL}" stroke-width="7" stroke-linecap="round" opacity=".55"/>`;
  }
  return t;
}
function wall(){
  let s = `<rect x="-300" y="-400" width="2520" height="1160" fill="${WALL}"/>`;
  for (let r = -2; r < 6; r++) for (let c = -2; c < 17; c++) s += tile(c * 128 - 20, r * 128 - 44, 120, (r + c + 4) % 2 === 0, (r * 3 + c * 5 + 16) % 4 === 0);
  /* the wall falls into shade toward the right, away from the window's light */
  s += `<path d="M1340 -400 L2220 -400 L2220 760 L1500 760 Z" fill="${INK}" opacity=".1"/>`;
  return s;
}
function windowLeft(){
  const x = 150, y = 170, w = 380, h = 300;
  let s = `<rect x="${x - 18}" y="${y - 18}" width="${w + 36}" height="${h + 36}" rx="14" fill="${TRIM}" ${ink(6)}/>`;
  s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${SKY}" ${ink(4)}/>`;
  /* sky only: a sun's corner and two clouds that drift */
  s += `<g clip-path="inset(0)"><circle cx="${x + 320}" cy="${y + 50}" r="34" fill="${C.yellow}" ${ink(4)}/>` +
    `<g class="tm-cloud"><path d="M${x + 50} ${y + 170} c-22 0 -26 -30 -2 -34 c2 -26 40 -30 48 -6 c22 -8 40 14 24 30 c10 6 4 14 -8 12 Z" fill="#fff" ${ink(4)}/></g>` +
    `<g class="tm-cloud tm-cloud2"><path d="M${x + 210} ${y + 250} c-18 0 -20 -24 -2 -27 c2 -20 32 -24 38 -5 c18 -6 32 11 19 24 c8 5 3 11 -6 9 Z" fill="#fff" ${ink(4)}/></g></g>`;
  /* the cross bars, then the sill */
  s += `<path d="M${x + w / 2} ${y} V${y + h} M${x} ${y + h / 2} H${x + w}" fill="none" stroke="${TRIM}" stroke-width="14"/><path d="M${x + w / 2 - 7} ${y} V${y + h} M${x + w / 2 + 7} ${y} V${y + h} M${x} ${y + h / 2 - 7} H${x + w} M${x} ${y + h / 2 + 7} H${x + w}" fill="none" ${ink(3)} opacity=".5"/>`;
  s += `<path d="M${x - 34} ${y + h + 18} H${x + w + 34} L${x + w + 26} ${y + h + 44} H${x - 26} Z" fill="${TRIM}" ${ink(6)}/><path d="M${x - 26} ${y + h + 36} H${x + w + 26}" fill="none" stroke="${C.enamelShade}" stroke-width="8" stroke-linecap="round"/>`;
  s += `<path d="M${x + 16} ${y + 30} L${x + 60} ${y + 14}" ${HI} stroke-width="6"/>`;
  return s;
}
/* ON AIR, lettered in strokes (the house style has no <text>) */
function lamp(){
  const x = 790, y = 62, w = 340, h = 112;
  const L = (d, dx) => `<path transform="translate(${x + dx} ${y + 34})" d="${d}" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`;
  const letters = L("M14 0 C4 0 0 10 0 22 C0 34 4 44 14 44 C24 44 28 34 28 22 C28 10 24 0 14 0 Z", 46) + L("M0 44 V0 L26 44 V0", 92) +
    L("M0 44 L14 0 L28 44 M6 29 H22", 164) + L("M0 0 V44", 214) + L("M0 44 V0 H13 C28 0 28 24 13 24 H0 M13 24 L27 44", 240);
  let s = `<radialGradient id="tmGlowFill"><stop offset="0" stop-color="${LAMP_ON}" stop-opacity=".55"/><stop offset="1" stop-color="${LAMP_ON}" stop-opacity="0"/></radialGradient><circle class="tm-glow" cx="${x + w / 2}" cy="${y + h / 2}" r="330" fill="url(#tmGlowFill)" opacity="0"/>`;
  s += `<path d="M${x + 60} ${y - 400} V${y} M${x + w - 60} ${y - 400} V${y}" fill="none" ${ink(8)}/>`;
  s += `<rect x="${x - 14}" y="${y - 14}" width="${w + 28}" height="${h + 28}" rx="26" fill="${CONSOLE_DARK}" ${ink(6)}/>`;
  s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="${LAMP_OFF}" ${ink(4)}/><g opacity=".45">${letters}</g>`;
  s += `<g class="tm-lamp-on" opacity="0"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="${LAMP_ON}" ${ink(4)}/>${letters}<path d="M${x + 22} ${y + 20} H${x + 110}" ${HI} stroke-width="6"/></g>`;
  return s;
}
/* the show's poster: the tooth in red headphones on yellow, as on the booth's outside wall */
function poster(){
  const x = 1420, y = 120, w = 270, h = 350;
  let s = `<rect x="${x + 10}" y="${y + 12}" width="${w}" height="${h}" rx="8" fill="${INK}" opacity=".18"/>`;
  s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${POSTER}" ${ink(6)}/>`;
  /* rays behind the tooth */
  for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4 + .2, cx = x + w / 2, cy = y + 160; s += `<path d="M${(cx + Math.cos(a) * 92).toFixed(0)} ${(cy + Math.sin(a) * 92).toFixed(0)} L${(cx + Math.cos(a) * 118).toFixed(0)} ${(cy + Math.sin(a) * 118).toFixed(0)}" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" opacity=".8"/>`; }
  /* a small molar: crown, two roots */
  s += `<g transform="translate(${x + w / 2 - 62} ${y + 92})"><path d="M14 44 C8 20 20 4 38 4 C50 4 54 12 62 12 C70 12 74 4 86 4 C104 4 116 20 110 44 C106 62 104 70 100 96 C98 112 86 114 82 100 C78 86 74 72 62 72 C50 72 46 86 42 100 C38 114 26 112 24 96 C20 70 18 62 14 44 Z" fill="${C.enamel}" ${ink(6)}/>` +
    `<path d="M100 30 C106 44 100 60 98 80" fill="none" stroke="${C.enamelShade}" stroke-width="8" stroke-linecap="round"/><path d="M26 30 C28 20 34 16 42 15" ${HI} stroke-width="6"/>` +
    `<circle cx="46" cy="42" r="5" fill="${INK}"/><circle cx="78" cy="42" r="5" fill="${INK}"/><path d="M52 56 Q62 64 72 56" fill="none" ${ink(4)}/>` +
    `<path d="M6 46 C0 14 28 -12 62 -12 C96 -12 124 14 118 46" fill="none" ${ink(11)}/><path d="M6 46 C0 14 28 -12 62 -12 C96 -12 124 14 118 46" fill="none" stroke="${C.red}" stroke-width="5" stroke-linecap="round"/>` +
    `<rect x="-6" y="30" width="22" height="34" rx="8" fill="${C.red}" ${ink(5)}/><rect x="108" y="30" width="22" height="34" rx="8" fill="${C.red}" ${ink(5)}/></g>`;
  /* where the title would be: two inked bars, and sound bars under them */
  s += `<path d="M${x + 50} ${y + 256} H${x + w - 50}" fill="none" stroke="${INK}" stroke-width="16" stroke-linecap="round"/><path d="M${x + 86} ${y + 290} H${x + w - 86}" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round" opacity=".6"/>`;
  [18, 30, 14, 26, 20].forEach((b, i) => { s += `<path d="M${x + 95 + i * 20} ${y + 330} v${-b}" fill="none" stroke="${C.red}" stroke-width="9" stroke-linecap="round"/>`; });
  s += `<path d="M${x + 16} ${y + 22} V${y + 70}" ${HI} stroke-width="6"/>`;
  /* two pins */
  s += `<circle cx="${x + 24}" cy="${y + 20}" r="8" fill="${C.red}" ${ink(4)}/><circle cx="${x + w - 24}" cy="${y + 20}" r="8" fill="${C.red}" ${ink(4)}/>`;
  return s;
}
/* a shelf under the poster: a trophy cup, a floss box and a plant */
function shelf(){
  const x = 1360, y = 560, w = 400;
  let s = `<path d="M${x} ${y} H${x + w} V${y + 22} H${x} Z" fill="${C.wood}" ${ink(6)}/><path d="M${x + 6} ${y + 16} H${x + w - 6}" fill="none" stroke="${C.woodShade}" stroke-width="8" stroke-linecap="round"/>`;
  s += `<path d="M${x + 40} ${y + 22} L${x + 40} ${y + 64} L${x + 84} ${y + 22} M${x + w - 40} ${y + 22} L${x + w - 40} ${y + 64} L${x + w - 84} ${y + 22}" fill="none" ${ink(6)}/>`;
  /* the cup */
  s += `<g transform="translate(${x + 56} ${y - 112})"><path d="M10 6 H70 C70 44 58 62 40 62 C22 62 10 44 10 6 Z" fill="${C.gold}" ${ink(6)}/><path d="M56 12 C56 36 50 50 42 56 C56 54 64 36 64 12 Z" fill="${C.goldShade}"/>` +
    `<path d="M10 14 C-6 14 -6 40 16 42 M70 14 C86 14 86 40 64 42" fill="none" ${ink(6)}/><path d="M34 62 V84 M46 62 V84" fill="none" ${ink(6)}/><path d="M18 86 H62 V110 H18 Z" fill="${C.wood}" ${ink(6)}/><path d="M20 16 V34" ${HI} stroke-width="6"/></g>`;
  /* floss */
  s += `<g transform="translate(${x + 176} ${y - 70})"><rect x="0" y="0" width="74" height="68" rx="14" fill="#8FE3D9" ${ink(6)}/><rect x="0" y="0" width="74" height="24" rx="12" fill="${C.paper}" ${ink(6)}/><circle cx="37" cy="44" r="12" fill="${C.paper}" ${ink(4)}/>` +
    `<path d="M74 14 C92 10 96 26 110 22" fill="none" stroke="${C.paper}" stroke-width="5" stroke-linecap="round"/><path d="M10 34 V54" ${HI} stroke-width="5"/></g>`;
  /* the plant */
  s += `<g transform="translate(${x + 296} ${y - 60})"><path d="M30 6 C10 -28 -14 -24 -14 -24 C-12 -2 4 12 30 6 Z M36 4 C40 -44 70 -52 70 -52 C76 -24 62 -4 36 4 Z M40 8 C62 -14 92 -8 92 -8 C86 12 64 20 40 8 Z" fill="${C.grass}" ${ink(5)}/>` +
    `<path d="M36 4 C46 -14 56 -30 66 -44" fill="none" stroke="${C.grassShade}" stroke-width="4" stroke-linecap="round"/><path d="M4 6 H72 L64 58 H12 Z" fill="${DOOR}" ${ink(6)}/><path d="M58 12 L52 54 H64 L70 12 Z" fill="#D9803A"/><path d="M14 16 L18 40" ${HI} stroke-width="5"/></g>`;
  return s;
}
/* the desk across the front, and what is on it */
function desk(){
  let s = `<path d="M-200 716 H2120 V800 H-200 Z" fill="#DDAE7E" ${ink(7)}/><path d="M-200 792 H2120 V1300 H-200 Z" fill="${C.wood}" ${ink(7)}/>`;
  s += `<path d="M-200 800 H2120 V836 H-200 Z" fill="${C.woodShade}" opacity=".7"/>`;
  for (let i = 0; i < 9; i++) s += `<path d="M${i * 250 - 60} 730 h${90 + (i * 37) % 60}" fill="none" stroke="${C.wood}" stroke-width="5" stroke-linecap="round" opacity=".8"/>`;
  s += `<path d="M40 880 H520 M700 960 H1300 M1500 900 H1900" fill="none" stroke="${C.woodShade}" stroke-width="5" stroke-linecap="round" opacity=".5"/>`;
  return s;
}
function mixer(){
  const x = 170, y = 610;
  let s = `<path d="M${x} ${y + 140} H${x + 430} V${y + 172} H${x} Z" fill="${CONSOLE_DARK}" ${ink(6)}/>`;
  s += `<path d="M${x + 34} ${y} H${x + 396} L${x + 430} ${y + 140} H${x} Z" fill="${CONSOLE}" ${ink(6)}/><path d="M${x + 372} ${y + 8} L${x + 396} ${y + 8} L${x + 422} ${y + 134} L${x + 398} ${y + 134} Z" fill="${CONSOLE_DARK}" opacity=".5"/>`;
  /* six channels: a knob, then a fader in its slot */
  for (let i = 0; i < 6; i++) {
    const cx = x + 62 + i * 44, k = [C.red, C.yellow, "#8FE3D9", C.paper, C.yellow, C.red][i], f = [78, 58, 92, 66, 84, 60][i];
    s += `<circle cx="${cx}" cy="${y + 28}" r="10" fill="${k}" ${ink(4)}/><path d="M${cx} ${y + 28} l5 -6" fill="none" ${ink(3)}/>`;
    s += `<path d="M${cx} ${y + 54} V${y + 122}" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><rect x="${cx - 13}" y="${y + f}" width="26" height="16" rx="4" fill="${C.metal}" ${ink(4)}/>`;
  }
  /* two meters, eight lamps each, lit from the bottom by his voice */
  for (let m = 0; m < 2; m++) for (let i = 0; i < 8; i++) {
    const c = i > 6 ? C.red : i > 4 ? C.yellow : C.green;
    s += `<rect class="tm-seg" data-m="${m}" data-i="${i}" x="${x + 332 + m * 30}" y="${y + 112 - i * 13}" width="20" height="9" rx="3" fill="${c}" stroke="${INK}" stroke-width="2.5" opacity=".22"/>`;
  }
  s += `<path d="M${x + 46} ${y + 10} H${x + 150}" ${HI} stroke-width="5"/>`;
  return s;
}
function mug(){
  const x = 1500, y = 596;
  let s = `<g class="tm-steam"><path d="M${x + 36} ${y - 14} c-10 -16 10 -24 0 -42 M${x + 66} ${y - 10} c-10 -16 10 -24 0 -42" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".7"/></g>`;
  s += `<path d="M${x + 96} ${y + 30} C${x + 150} ${y + 26} ${x + 150} ${y + 96} ${x + 92} ${y + 92}" fill="none" ${ink(18)}/><path d="M${x + 96} ${y + 30} C${x + 150} ${y + 26} ${x + 150} ${y + 96} ${x + 92} ${y + 92}" fill="none" stroke="${C.enamel}" stroke-width="8" stroke-linecap="round"/>`;
  s += `<path d="M${x} ${y} H${x + 104} L${x + 96} ${y + 124} C${x + 96} ${y + 134} ${x + 8} ${y + 134} ${x + 8} ${y + 124} Z" fill="${C.enamel}" ${ink(6)}/><path d="M${x + 82} ${y + 6} L${x + 76} ${y + 126} C${x + 90} ${y + 126} ${x + 94} ${y + 124} ${x + 96} ${y + 118} L${x + 102} ${y + 6} Z" fill="${C.enamelShade}"/>`;
  s += `<ellipse cx="${x + 52}" cy="${y + 2}" rx="52" ry="10" fill="#7A4A2A" ${ink(6)}/>`;
  /* a tooth on the mug */
  s += `<path transform="translate(${x + 26} ${y + 40}) scale(.42)" d="M14 44 C8 20 20 4 38 4 C50 4 54 12 62 12 C70 12 74 4 86 4 C104 4 116 20 110 44 C106 62 104 70 100 96 C98 112 86 114 82 100 C78 86 74 72 62 72 C50 72 46 86 42 100 C38 114 26 112 24 96 C20 70 18 62 14 44 Z" fill="${C.red}" stroke="${INK}" stroke-width="9" stroke-linejoin="round"/>`;
  s += `<path d="M${x + 14} ${y + 22} V${y + 70}" ${HI} stroke-width="6"/>`;
  return s;
}
/* the script: a few sheets, the top one's lines */
function pages(){
  const x = 1120, y = 742;
  let s = `<path d="M${x + 6} ${y + 6} L${x + 300} ${y - 4} L${x + 330} ${y + 50} L${x + 20} ${y + 58} Z" fill="${C.paperShade}" ${ink(5)}/>`;
  s += `<path d="M${x - 10} ${y} L${x + 280} ${y - 12} L${x + 316} ${y + 40} L${x + 10} ${y + 54} Z" fill="${C.paper}" ${ink(5)}/>`;
  s += `<path d="M${x + 22} ${y + 8} L${x + 150} ${y + 2}" fill="none" stroke="${C.red}" stroke-width="7" stroke-linecap="round"/>`;
  for (let i = 0; i < 3; i++) s += `<path d="M${x + 28 + i * 6} ${y + 20 + i * 10} L${x + 262 + i * 8 - (i === 2 ? 70 : 0)} ${y + 10 + i * 10}" fill="none" stroke="${C.plum}" stroke-width="4" stroke-linecap="round" opacity=".55"/>`;
  return s;
}
/* the microphone on its boom arm, a pop filter between it and him. Drawn over Timmy. */
function mic(){
  const base = [664, 724], elbow = [604, 318], head = [762, 664];
  const seg = (a, b) => `<path d="M${a[0]} ${a[1]} L${b[0]} ${b[1]}" fill="none" ${ink(20)}/><path d="M${a[0]} ${a[1]} L${b[0]} ${b[1]}" fill="none" stroke="${C.metalShade}" stroke-width="10" stroke-linecap="round"/><path d="M${a[0] - 3} ${a[1] - 3} L${b[0] - 3} ${b[1] - 3}" fill="none" stroke="${C.metalLight}" stroke-width="3" stroke-linecap="round" opacity=".8"/>`;
  let s = `<path d="M${base[0] - 46} ${base[1] + 4} H${base[0] + 46} V${base[1] + 30} H${base[0] - 46} Z" fill="${CONSOLE_DARK}" ${ink(6)}/>`;
  s += seg(base, elbow) + seg(elbow, head);
  s += `<circle cx="${elbow[0]}" cy="${elbow[1]}" r="17" fill="${C.metal}" ${ink(6)}/><circle cx="${elbow[0]}" cy="${elbow[1]}" r="5" fill="${INK}"/>`;
  /* the mic: a capsule with a grille, on a shock mount, tipped toward his mouth */
  s += `<g transform="translate(${head[0]} ${head[1]}) rotate(-42)">` +
    `<rect x="-22" y="-20" width="20" height="40" rx="6" fill="${CONSOLE_DARK}" ${ink(5)}/>` +
    `<rect x="-6" y="-30" width="112" height="60" rx="30" fill="#E3E7EB" ${ink(6)}/>` +
    `<path d="M40 -27 H76 C96 -27 104 -12 104 0 C104 12 96 27 76 27 H40 Z" fill="${C.metalShade}" ${ink(5)}/>` +
    `<path d="M52 -24 V24 M64 -26 V26 M76 -26 V26 M88 -22 V22 M42 -9 H102 M42 9 H102" fill="none" stroke="${INK}" stroke-width="3" opacity=".55"/>` +
    `<path d="M4 -18 H30" ${HI} stroke-width="6"/><circle cx="16" cy="8" r="5" fill="${C.red}" ${ink(3)}/></g>`;
  /* the pop filter: a hoop of mesh on a gooseneck, between the mic and his mouth */
  const px = head[0] + 118, py = head[1] - 104;
  s += `<path d="M${head[0] - 8} ${head[1] + 30} C${head[0] + 40} ${head[1] + 40} ${head[0] + 110} ${head[1] - 10} ${px + 4} ${py + 40}" fill="none" ${ink(7)}/>`;
  s += `<ellipse cx="${px}" cy="${py}" rx="27" ry="42" transform="rotate(48 ${px} ${py})" fill="${INK}" fill-opacity=".14" ${ink(7)}/>`;
  s += `<path d="M${px - 22} ${py - 18} L${px + 16} ${py + 24} M${px - 12} ${py - 30} L${px + 26} ${py + 10} M${px - 28} ${py - 2} L${px + 4} ${py + 32}" fill="none" stroke="${INK}" stroke-width="2.5" opacity=".3"/>`;
  return s;
}

/* The whole scene, inner markup for viewBox "0 0 1920 1080" (it is drawn past the frame on every side, so the camera
   can move). Timmy stands at TIMMY (x, y, scale) in his own frame. */
export const TIMMY = { x: 700, y: 262, s: 2.6 }, DOWN = 96;
export const FACE = { x: TIMMY.x + 100 * TIMMY.s, y: TIMMY.y + 92 * TIMMY.s + DOWN };   // between his eyes and his mouth: where the camera starts
export function studio(){
  return `<g transform="translate(0 ${DOWN})">` + wall() + windowLeft() + lamp() + poster() + shelf() +
    `<g transform="translate(${TIMMY.x} ${TIMMY.y}) scale(${TIMMY.s})">${timmy("a")}</g>` +
    desk() + mixer() + pages() + mug() + mic() + "</g>";
}
export const STYLE = { INK, WALL, WALL_SHADE, FOAM, FOAM_DARK, RED: C.red };
