/* Each hub's arcade lobby art: one drawing per game, in that hub's own world (the arcade-skins rule: "lobby thumbnails
   ... are the hub's own"). Sam, 2026-11-06: "make actual art for the arcade games". Ink style from style.mjs, drawn
   by hand in SVG, 320 x 170 (the live lobby's thumbnail box), no text, ids, gradients or filters.
   The build writes a hub's set into widget/hub-art/<hub>.js (games), and the engine draws it on each lobby tile.

   Occlusion (from its games and its arcade skin):
   - sort:   Cusp Sort. Cards with a cusp on them rain into two bins; one is being flung.
   - board:  Freeway Showdown. The board of articulating-paper strips, blue and red, a column per lecture, one strip
             already used (its contact marks), a Centric Double star.
   - escape: Lab Escape. The occlusion lab: the mounted casts on the articulator, the clock, the locked drawer, the door
             and its keypad.
   - cloze:  Mind the Gap. A page of the notes with one term missing, the caret waiting, a pencil.
   - smile:  Million-Dollar Smile. Twelve rungs up to a gold-crowned smile, three lifelines.
   - cross:  Cross-Section. A mini crossword beside a molar cut in section: enamel, dentin, pulp, the gum and the bone. */
import { INK, C, HI } from "./style.mjs";

const ink = (w = 2.5) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const line = (d, w = 2.5, col = INK) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const hi = (d) => `<path d="${d}" ${HI}/>`;
const ground = (fill) => `<rect x="0" y="0" width="320" height="170" fill="${fill}"/>`;

/* a molar crown in profile, its cusps up, centered on 0,0, about 26 wide */
const CROWN = "M-13 6 C-13.5 -3 -10 -9 -5.5 -4 C-2.5 -9 2.5 -9 5.5 -4 C10 -9 13.5 -3 13 6 C12.6 11.5 7.5 13.5 0 13.5 C-7.5 13.5 -12.6 11.5 -13 6 Z";

function card(x, y, rot, band){
  return `<g transform="translate(${x} ${y}) rotate(${rot})">` +
    `<rect x="-22" y="-29" width="44" height="58" rx="8" fill="${C.paper}" ${ink(2.5)}/>` +
    `<path d="M-22 -18 L-22 -21 C-22 -26 -19 -29 -14 -29 L14 -29 C19 -29 22 -26 22 -21 L22 -18 Z" fill="${band}" ${ink(2)}/>` +
    `<path d="${CROWN}" transform="translate(0 6)" fill="${C.enamel}" ${ink(2)}/>` +
    hi("M-8 4 C-7.5 1 -6.5 -0.5 -5 -1") + `</g>`;
}

function sort(T){
  const bin = (x, fill, shade, mark) =>
    `<path d="M${x} 102 L${x + 100} 102 L${x + 92} 152 L${x + 8} 152 Z" fill="${fill}" ${ink(3)}/>` +
    `<path d="M${x + 78} 104 L${x + 98} 104 L${x + 91} 150 L${x + 74} 150 Z" fill="${shade}" opacity=".55"/>` +
    `<rect x="${x - 5}" y="94" width="110" height="12" rx="6" fill="${fill}" ${ink(3)}/>` +
    hi(`M${x + 6} 99 L${x + 40} 99`) + mark;
  return ground(C.goldLight) +
    `<path d="M0 152 L320 152 L320 170 L0 170 Z" fill="${C.wood}"/>` + line("M0 152 L320 152", 3) +
    /* bin marks: a cusp seated in a fossa (left), a cusp riding past one (right) */
    bin(28, T.ink, INK, `<path d="M60 128 C66 118 74 118 80 128" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/><circle cx="70" cy="124" r="4" fill="#fff"/>`) +
    bin(192, C.orange, C.bronzeShade, `<path d="M224 130 C230 120 238 120 244 130" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/><circle cx="256" cy="118" r="4" fill="#fff"/>`) +
    card(160, 34, 8, T.mid) +
    card(250, 46, -10, C.orange) +
    /* the one being flung toward the left bin, with its trail */
    line("M150 84 C138 80 128 78 118 78", 3) + line("M154 96 C142 94 134 93 124 94", 3) + line("M146 70 C138 66 132 65 126 65", 2.5) +
    card(96, 72, -24, T.ink) +
    `<path d="M300 22 l2.4 5.2 5.2 2.4 -5.2 2.4 -2.4 5.2 -2.4 -5.2 -5.2 -2.4 5.2 -2.4 Z" fill="${C.yellow}" ${ink(1.6)}/>` +
    `<circle cx="22" cy="30" r="4" fill="${C.orange}" ${ink(1.6)}/>`;
}

function board(T){
  const strips = [];
  const cols = [54, 125, 196, 267], rows = [64, 98, 132];
  cols.forEach((x, c) => rows.forEach((y, r) => {
    const used = c === 1 && r === 0, star = c === 2 && r === 1;
    const fill = used ? C.paper : (c + r) % 2 ? C.red : C.blue;
    strips.push(`<rect x="${x - 30}" y="${y - 13}" width="60" height="26" rx="6" fill="${fill}" ${ink(2.5)}/>`);
    if (!used) strips.push(hi(`M${x - 20} ${y - 6} L${x - 4} ${y - 6}`));
    if (used) strips.push(`<circle cx="${x - 12}" cy="${y + 1}" r="3.2" fill="${C.blue}"/><circle cx="${x + 2}" cy="${y - 3}" r="2.6" fill="${C.blue}"/><circle cx="${x + 13}" cy="${y + 3}" r="3" fill="${C.red}"/>`);
    if (star) strips.push(`<path d="M${x} ${y - 9} l3 6.2 6.8 1 -4.9 4.8 1.2 6.8 -6.1 -3.2 -6.1 3.2 1.2 -6.8 -4.9 -4.8 6.8 -1 Z" fill="${C.gold}" ${ink(1.8)}/>`);
  }));
  /* the column heads: a tooth for each lecture */
  const heads = cols.map((x) => `<path d="${CROWN}" transform="translate(${x} 26) scale(.9)" fill="${C.enamel}" ${ink(2)}/>`).join("");
  return ground(T.light) +
    `<rect x="10" y="8" width="300" height="154" rx="16" fill="${T.ink}" ${ink(3)}/>` +
    `<path d="M18 44 L302 44" stroke="${T.mid}" stroke-width="2" stroke-linecap="round"/>` +
    heads + strips.join("");
}

function escape(T){
  return ground(T.light) +
    /* wall pegboard dots, floor */
    [40, 80, 120, 160].map((x) => [24, 50].map((y) => `<circle cx="${x}" cy="${y}" r="2.6" fill="${T.mid}" opacity=".6"/>`).join("")).join("") +
    `<path d="M0 154 L320 154 L320 170 L0 170 Z" fill="${C.wood}"/>` + line("M0 154 L320 154", 3) +
    /* the clock */
    `<circle cx="198" cy="34" r="17" fill="${C.paper}" ${ink(2.5)}/>` + line("M198 34 L198 23", 2.5) + line("M198 34 L206 38", 2.5) + `<circle cx="198" cy="34" r="2" fill="${INK}"/>` +
    /* the bench and its locked drawer */
    `<rect x="14" y="104" width="196" height="12" rx="4" fill="${C.woodShade}" ${ink(2.5)}/>` +
    `<rect x="22" y="116" width="180" height="38" fill="${T.mid}" ${ink(2.5)}/>` +
    line("M112 116 L112 154", 2.5) +
    `<rect x="54" y="126" width="34" height="8" rx="4" fill="${C.metal}" ${ink(2)}/><rect x="136" y="126" width="34" height="8" rx="4" fill="${C.metal}" ${ink(2)}/>` +
    `<path d="M147 136 C147 130 159 130 159 136" fill="none" ${ink(2.5)}/><rect x="143" y="136" width="20" height="15" rx="3" fill="${C.gold}" ${ink(2.2)}/><circle cx="153" cy="143" r="2" fill="${INK}"/>` +
    /* the articulator with the mounted casts */
    `<rect x="40" y="96" width="120" height="9" rx="4" fill="${T.ink}" ${ink(2.5)}/>` +
    `<rect x="136" y="36" width="12" height="62" rx="5" fill="${T.ink}" ${ink(2.5)}/>` +
    `<path d="M52 42 C52 38 55 36 59 36 L144 36 C148 36 150 39 150 42 L150 46 L52 46 Z" fill="${T.ink}" ${ink(2.5)}/>` +
    `<rect x="62" y="46" width="62" height="12" rx="3" fill="${C.paper}" ${ink(2)}/>` +
    `<rect x="62" y="56" width="62" height="9" rx="3" fill="${C.gum}" ${ink(2)}/>` +
    [70, 82, 94, 106, 117].map((x) => `<path d="M${x - 5} 65 L${x - 5} 70 C${x - 5} 74 ${x + 5} 74 ${x + 5} 70 L${x + 5} 65" fill="${C.enamel}" ${ink(1.8)}/>`).join("") +
    [70, 82, 94, 106, 117].map((x) => `<path d="M${x - 5} 81 L${x - 5} 76 C${x - 5} 72 ${x + 5} 72 ${x + 5} 76 L${x + 5} 81" fill="${C.enamel}" ${ink(1.8)}/>`).join("") +
    `<rect x="62" y="80" width="62" height="9" rx="3" fill="${C.gum}" ${ink(2)}/>` +
    `<rect x="62" y="88" width="62" height="9" rx="3" fill="${C.paper}" ${ink(2)}/>` +
    hi("M66 60 L86 60") +
    /* the door and its keypad */
    `<path d="M236 154 L236 40 C236 34 240 30 246 30 L290 30 C296 30 300 34 300 40 L300 154 Z" fill="${C.wood}" ${ink(3)}/>` +
    `<rect x="246" y="42" width="44" height="40" rx="5" fill="${C.woodShade}" opacity=".5"/>` +
    `<circle cx="290" cy="102" r="4.5" fill="${C.gold}" ${ink(2)}/>` +
    `<rect x="214" y="78" width="16" height="24" rx="3" fill="${INK}"/>` +
    [0, 1, 2].map((r) => [0, 1].map((c) => `<circle cx="${219 + c * 6}" cy="${84 + r * 6}" r="1.6" fill="${r === 2 && c === 1 ? C.green : "#fff"}"/>`).join("")).join("");
}

function cloze(T){
  const bars = [
    [64, 46, 150], [64, 62, 186], [64, 78, 70], [190, 78, 60], [64, 94, 172], [64, 110, 120], [64, 126, 160]
  ].map(([x, y, w]) => `<path d="M${x} ${y} L${x + w} ${y}" stroke="${C.metalShade}" stroke-width="6" stroke-linecap="round" opacity=".55"/>`).join("");
  return ground(C.gumLight) +
    `<g transform="rotate(-3 160 85)">` +
    `<rect x="40" y="16" width="232" height="140" rx="10" fill="${C.paper}" ${ink(3)}/>` +
    `<path d="M54 16 L54 156" stroke="${C.red}" stroke-width="2" opacity=".6"/>` +
    bars +
    /* the gap, waiting for the term */
    `<rect x="138" y="70" width="46" height="17" rx="5" fill="${T.light}" stroke="${T.ink}" stroke-width="2.5" stroke-dasharray="5 4"/>` +
    line("M146 73 L146 84", 2.5, T.ink) +
    /* a tooth doodle in the margin */
    `<path d="${CROWN}" transform="translate(248 34) scale(.8)" fill="${C.enamel}" ${ink(2)}/>` +
    `</g>` +
    /* the pencil */
    `<g transform="rotate(38 262 120)">` +
    `<rect x="214" y="112" width="74" height="16" rx="3" fill="${C.yellow}" ${ink(2.5)}/>` +
    `<path d="M214 112 L198 120 L214 128 Z" fill="${C.enamel}" ${ink(2.2)}/><path d="M203 117.6 L198 120 L203 122.4 Z" fill="${INK}"/>` +
    `<rect x="284" y="111" width="10" height="18" rx="2" fill="${C.metal}" ${ink(2.2)}/>` +
    `<path d="M294 111 L300 111 C304 111 306 114 306 120 C306 126 304 129 300 129 L294 129 Z" fill="${C.pink}" ${ink(2.2)}/>` +
    hi("M220 116 L270 116") + `</g>`;
}

function smile(T){
  const rungs = [];
  for (let i = 0; i < 12; i++) {
    const y = 150 - i * 11, x = 30 + i * 6, top = i === 11;
    rungs.push(`<rect x="${x}" y="${y - 4}" width="${64}" height="8" rx="4" fill="${top ? C.gold : i === 4 || i === 9 ? C.goldLight : T.mid}" ${ink(2)}/>`);
  }
  /* the three lifelines: halves, a call, the crowd */
  const life = (x, inner) => `<circle cx="${x}" cy="26" r="13" fill="${C.paper}" ${ink(2.5)}/>` + inner;
  return ground(T.ink) +
    line("M25 160 L101 20", 3, T.mid) + line("M89 160 L165 20", 3, T.mid) +
    rungs.join("") +
    life(196, `<path d="M196 16 A10 10 0 0 0 196 36 Z" fill="${T.ink}"/>`) +
    life(230, `<path d="M224 20 C222 26 226 33 233 34 L235 31 L232 28 L230 29 C228 27 227 26 227 24 L228 22 L225 19 Z" fill="${T.ink}"/>`) +
    life(264, `<circle cx="259" cy="23" r="3" fill="${T.ink}"/><circle cx="269" cy="23" r="3" fill="${T.ink}"/><path d="M253 33 C254 28 264 28 265 33 M263 33 C264 28 274 28 275 33" fill="${T.ink}"/>`) +
    /* the smile at the top: a tooth in a gold crown */
    `<path d="M214 150 C206 150 204 140 205 128 C200 112 198 92 204 80 C210 68 226 66 240 74 C254 66 270 68 276 80 C282 92 280 112 275 128 C276 140 274 150 266 150 C258 150 256 138 252 126 C248 120 232 120 228 126 C224 138 222 150 214 150 Z" fill="${C.enamel}" ${ink(3)}/>` +
    `<path d="M262 78 C270 84 272 100 268 116 C266 106 264 92 258 82 Z" fill="${C.enamelShade}"/>` +
    hi("M212 88 C212 82 216 78 222 77") +
    `<circle cx="226" cy="98" r="4.2" fill="${INK}"/><circle cx="254" cy="98" r="4.2" fill="${INK}"/>` +
    `<circle cx="227.4" cy="96.6" r="1.4" fill="#fff"/><circle cx="255.4" cy="96.6" r="1.4" fill="#fff"/>` +
    `<path d="M228 108 C234 116 246 116 252 108" fill="${INK}" ${ink(2)}/>` +
    `<path d="M202 72 L206 50 L219 62 L240 44 L261 62 L274 50 L278 72 Z" fill="${C.gold}" ${ink(2.8)}/>` +
    `<circle cx="240" cy="58" r="3.6" fill="${C.red}" ${ink(1.6)}/>` +
    `<path d="M292 34 l2.4 5.2 5.2 2.4 -5.2 2.4 -2.4 5.2 -2.4 -5.2 -5.2 -2.4 5.2 -2.4 Z" fill="${C.yellow}" ${ink(1.6)}/>` +
    `<path d="M186 120 l1.8 4 4 1.8 -4 1.8 -1.8 4 -1.8 -4 -4 -1.8 4 -1.8 Z" fill="${C.yellow}" ${ink(1.4)}/>`;
}

function cross(T){
  /* a 6 x 5 grid; 1 = a block, 2 = a letter cell of the word being solved */
  const G = ["000100", "222220", "010010", "000100", "100001"];
  const cells = [];
  G.forEach((row, r) => row.split("").forEach((v, c) => {
    const x = 22 + c * 24, y = 22 + r * 24;
    cells.push(`<rect x="${x}" y="${y}" width="24" height="24" fill="${v === "1" ? INK : v === "2" ? T.light : C.paper}" stroke="${INK}" stroke-width="2"/>`);
  }));
  /* the solved word's letters, drawn as small marks (no text) */
  const marks = [0, 1, 2, 3, 4].map((c) => `<path d="M${28 + c * 24} 60 L${34 + c * 24} 52 L${40 + c * 24} 60" fill="none" stroke="${T.ink}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`).join("");
  return ground(C.sky) +
    `<rect x="16" y="16" width="156" height="132" rx="8" fill="${C.paper}" ${ink(3)}/>` +
    cells.join("") + marks +
    `<rect x="22" y="22" width="144" height="120" fill="none" ${ink(3)}/>` +
    /* the molar in section: bone, gum, two roots with their canals, dentin, enamel, the pulp chamber */
    `<path d="M186 120 C196 112 278 112 300 120 L300 162 L186 162 Z" fill="${C.wood}" ${ink(2.5)}/>` +
    [[200, 140], [226, 150], [264, 148], [288, 136]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="${C.woodShade}"/>`).join("") +
    `<path d="M202 70 C200 50 214 36 230 44 C236 36 250 36 256 44 C272 36 286 50 284 70 C282 92 276 102 272 112 C270 128 268 146 262 156 C256 158 252 150 250 136 C248 124 246 118 243 118 C240 118 238 124 236 136 C234 150 230 158 224 156 C218 146 216 128 214 112 C210 102 204 92 202 70 Z" fill="${C.goldLight}" ${ink(3)}/>` +
    `<path d="M202 70 C200 50 214 36 230 44 C236 36 250 36 256 44 C272 36 286 50 284 70 C278 62 270 60 262 62 C256 56 250 56 243 60 C236 56 230 56 224 62 C216 60 208 62 202 70 Z" fill="${C.enamel}" ${ink(2.5)}/>` +
    `<path d="M226 78 C226 70 236 68 243 72 C250 68 260 70 260 78 C260 88 256 96 254 100 C254 112 252 126 250 140 C248 126 246 110 243 104 C240 110 238 126 236 140 C234 126 232 112 232 100 C230 96 226 88 226 78 Z" fill="${C.pink}" ${ink(2)}/>` +
    `<path d="M196 104 C206 96 214 100 216 108 M290 104 C280 96 272 100 270 108" fill="none" stroke="${C.gumShade}" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="M188 112 C196 100 208 100 215 108 L216 124 C206 118 196 118 188 124 Z" fill="${C.gum}" ${ink(2.2)}/>` +
    `<path d="M298 112 C290 100 278 100 271 108 L270 124 C280 118 290 118 298 124 Z" fill="${C.gum}" ${ink(2.2)}/>` +
    hi("M210 56 C212 50 216 46 222 46");
}

const build = (T) => ({
  sort: { label: "Cusp Sort: cards with a cusp on them falling into two bins", body: sort(T) },
  board: { label: "Freeway Showdown: a board of blue and red articulating-paper strips", body: board(T) },
  escape: { label: "Lab Escape: the occlusion lab, with the mounted casts, a locked drawer and the door's keypad", body: escape(T) },
  cloze: { label: "Mind the Gap: a page of notes with one term missing", body: cloze(T) },
  smile: { label: "Million-Dollar Smile: twelve rungs up to a smiling tooth in a gold crown", body: smile(T) },
  cross: { label: "Cross-Section: a mini crossword beside a molar cut in section", body: cross(T) }
});

export const ARCADE_VIEWBOX = [0, 0, 320, 170];
/* only Occlusion's arcade is drawn so far; Heme & Endo 2 and Perio get their own in redesign phase 2 */
export function arcadeArt(hub, tint){ return hub === "occlusion" ? build(tint) : null; }
