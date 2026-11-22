/* The exam-eve boss (migration_v97, idea board #4): the Midnight Plaque, a giant Plaque Boss that shows up from 3 pm to
   midnight the night before an exam, crowned in tartar and sitting on a molar under the night sky, the clock ticking toward
   midnight. Every right answer from anyone in the class takes a hit; the class wins if it falls before midnight.
   A kit, like the idea board's (board.mjs): the page (widget/eggs.js) draws it at its own size.

     scene(state, opts)  the whole picture, box 0 0 320 220: the sky, the moon, the clock, the molar and the boss
     boss(state, opts)   the boss alone, in the scene's coordinates
     icon(state, opts)   the boss alone, cropped for the band in the top bar (box 52 36 216 148; down: 60 112 200 82)
     pick(st, f)         which drawing a moment calls for: the server's state (soon, up, down, lost) and the HP left (0-1)

   States: "soon" (asleep, before 3 pm), "up" (more than 60% HP: grinning, flexing), "hurt" (25-60%: a bandage, a squint),
   "low" (25% or less: cracked and crumbling), "down" (it fell: a puddle with a toothbrush planted in it, the tooth shining)
   and "away" (midnight came first: it strolls off smirking). opts.hat: "santa" swaps the tartar crown for a Santa hat (the
   winter holidays, when the other bosses wear their costumes).
   Drawn in Timmy's ink (style.mjs): flat fills, ink outlines, a darker shade away from the light, white highlights; no ids,
   gradients, filters, <text> or <style>, so a copy can repeat on a page. */
export function evebossKit(INK, C){
  "use strict";
  var SW = 2.6, SI = 1.6;
  var BODY = "#C9AE4F", BODY_SHADE = "#A38A32", BODY_LIGHT = "#E6D68C", SPECK = "#8F7A2A";
  var TARTAR = "#DCCFA6", TARTAR_SHADE = "#B4A273", MOUTH = "#5A2E3A", TONGUE = "#F28AA0";
  var SKY = "#2B2550", SKY_LIGHT = "#3B3470";
  function f(n){ return Math.round(n * 10) / 10; }
  function P(d, fill, sw){ return '<path d="' + d + '" fill="' + (fill || "none") + '" stroke="' + INK + '" stroke-width="' + (sw || SW) + '" stroke-linejoin="round" stroke-linecap="round"/>'; }
  function F(d, fill, op){ return '<path d="' + d + '" fill="' + fill + '"' + (op != null ? ' opacity="' + op + '"' : "") + "/>"; }
  function L(d, sw, col, op){ return '<path d="' + d + '" fill="none" stroke="' + (col || INK) + '" stroke-width="' + (sw || SI) + '" stroke-linecap="round" stroke-linejoin="round"' + (op != null ? ' opacity="' + op + '"' : "") + "/>"; }
  function circ(x, y, r, fill, sw){ return '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(r) + '" fill="' + fill + '"' + (sw ? ' stroke="' + INK + '" stroke-width="' + sw + '"' : "") + "/>"; }
  function ell(x, y, rx, ry, fill, op){ return '<ellipse cx="' + f(x) + '" cy="' + f(y) + '" rx="' + f(rx) + '" ry="' + f(ry) + '" fill="' + fill + '"' + (op != null ? ' opacity="' + op + '"' : "") + "/>"; }
  function hi(d){ return L(d, 2.4, "#fff", .6); }
  function star(x, y, r, fill){ return F("M" + f(x) + " " + f(y - r) + " Q" + f(x + r * .18) + " " + f(y - r * .18) + " " + f(x + r) + " " + f(y) + " Q" + f(x + r * .18) + " " + f(y + r * .18) + " " + f(x) + " " + f(y + r) + " Q" + f(x - r * .18) + " " + f(y + r * .18) + " " + f(x - r) + " " + f(y) + " Q" + f(x - r * .18) + " " + f(y - r * .18) + " " + f(x) + " " + f(y - r) + " Z", fill); }
  function wrap(inner, vb, px, label){
    var p = vb.split(" ");
    return '<svg viewBox="' + vb + '"' + (px ? ' width="' + px + '" height="' + f(px * p[3] / p[2]) + '"' : "") +
      (label ? ' role="img" aria-label="' + String(label).replace(/[&<>"]/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }) + '"' : ' aria-hidden="true"') + ' focusable="false">' + inner + "</svg>";
  }

  /* ---- the body: a heap of plaque with three lumps on top, sitting on the tooth (its bottom at y 178) ---- */
  var BODY_D = "M90 176 C82 150 86 120 100 101 C102 85 116 73 132 77 C138 63 154 57 166 67 C178 57 196 63 202 79 C218 81 232 97 228 117 C240 137 238 160 230 176 C200 184 120 184 90 176 Z";
  var BODY_SH = "M228 117 C240 137 238 160 230 176 C214 180 198 182 182 182 C206 170 218 148 214 122 C212 106 206 94 202 79 C218 81 232 97 228 117 Z";
  function speckles(){
    return [[116, 150, 4, 2.6], [204, 142, 5, 3], [150, 164, 3.4, 2.2], [192, 100, 3, 2], [118, 122, 2.6, 1.8], [178, 160, 3.6, 2.4], [212, 164, 2.4, 1.6], [104, 160, 2.2, 1.6]]
      .map(function(s){ return ell(s[0], s[1], s[2], s[3], SPECK, .55); }).join("");
  }
  function drips(){
    return P("M110 180 C110 186 106 190 108 193 C110 196 114 194 114 190 C114 186 112 183 112 180", BODY, 2) +
      P("M206 180 C207 184 204 188 206 190 C208 192 211 190 210 187 C210 184 209 182 208 180", BODY, 2);
  }
  /* the arms: "flex" (both up), "rest" (down at the sides), "brace" (one up, one holding its side) */
  function arms(pose){
    var Lup = "M104 118 C98 110 86 109 79 116 C76 110 75 104 75 99 C81 96 81 85 72 83 C63 81 57 88 59 96 C57 105 57 117 60 125 C63 133 71 135 81 135 L104 135 Z",
        Rup = "M216 118 C222 110 234 109 241 116 C244 110 245 104 245 99 C239 96 239 85 248 83 C257 81 263 88 261 96 C263 105 263 117 260 125 C257 133 249 135 239 135 L216 135 Z",
        Ldn = "M102 128 C90 132 80 142 76 155 C72 166 80 173 87 167 C91 161 95 152 104 148 Z",
        Rdn = "M218 128 C230 132 240 142 244 155 C248 166 240 173 233 167 C229 161 225 152 216 148 Z";
    var up = pose === "flex", l = pose === "rest" ? Ldn : Lup, r = up ? Rup : Rdn;
    return P(l, BODY, 2.4) + P(r, BODY, 2.4) + (pose === "rest" ? hi("M80 158 q2 -6 7 -9") : hi("M63 92 q2 -5 7 -5") + L("M66 104 q4 2 8 0", 1.4, INK, .5)) +
      (up ? hi("M249 88 q4 -2 7 2") + L("M246 104 q4 2 8 0", 1.4, INK, .5) : "");
  }
  /* the eyes: "mad" (pupils in, brows down), "sleep" (closed), "squint" (one lid half down), "scared" (wide, small pupils),
     "x" (out), "smug" (lids half down, looking back over its shoulder) */
  function eyes(kind){
    var lx = 138, rx = 182, y = 112, r = 15, s = "";
    if (kind === "sleep") return L("M124 114 q14 9 28 0", 3) + L("M168 114 q14 9 28 0", 3) + L("M128 100 q10 -4 20 -2", 2.4) + L("M172 98 q10 -2 20 2", 2.4);
    if (kind === "x") return L("M128 104 l18 18 M146 104 l-18 18", 3.6) + L("M172 104 l18 18 M190 104 l-18 18", 3.6);
    s += circ(lx, y, r, "#fff", 2.4) + circ(rx, y, r, "#fff", 2.4);
    if (kind === "scared") {
      s += circ(lx + 1, y + 1, 3.6, INK) + circ(rx - 1, y + 1, 3.6, INK) + circ(lx + 2.2, y - .2, 1.2, "#fff") + circ(rx + .2, y - .2, 1.2, "#fff") +
        L("M122 92 q14 -8 26 -2", 3.4) + L("M198 92 q-14 -8 -26 -2", 3.4);
      return s;
    }
    if (kind === "smug") {
      s += circ(lx - 6, y + 3, 6, INK) + circ(rx - 6, y + 3, 6, INK) + circ(lx - 4, y + 1, 1.8, "#fff") + circ(rx - 4, y + 1, 1.8, "#fff") +
        P("M123 110 C123 100 130 97 138 97 C146 97 153 100 153 110 Z", BODY, 2.2) + P("M167 110 C167 100 174 97 182 97 C190 97 197 100 197 110 Z", BODY, 2.2) +
        L("M122 92 l30 4", 3.6) + L("M168 96 l30 -6", 3.6);
      return s;
    }
    s += circ(lx + 3, y + 3, 6.4, INK) + circ(rx - 3, y + 3, 6.4, INK) + circ(lx + 5, y + 1, 2, "#fff") + circ(rx - 1, y + 1, 2, "#fff");
    if (kind === "squint") s += P("M167 109 C167 99 174 96 182 96 C190 96 197 99 197 109 Z", BODY, 2.2) + L("M122 90 l30 10", 4.2) + L("M170 98 l26 -4", 4.2);
    else s += L("M120 90 l32 10", 5) + L("M200 90 l-32 10", 5);
    return s;
  }
  /* the mouth: "grin" (fangs), "snore" (a little o), "grit" (teeth clenched), "wobble" (an open frown), "tongue" (out, defeated),
     "smirk" (tongue out to one side) */
  function mouth(kind){
    if (kind === "snore") return P("M156 146 C156 141 164 141 164 146 C164 151 156 151 156 146 Z", MOUTH, 2.2);
    if (kind === "grit") return P("M132 142 C150 150 170 150 188 142 C186 154 134 154 132 142 Z", "#fff", 2.4) + L("M142 146 v6 M152 148 v6 M162 148 v6 M172 148 v6 M181 146 v5", 1.6);
    if (kind === "wobble") return P("M136 156 C140 142 150 138 160 140 C170 138 180 142 184 156 C176 150 168 150 160 152 C152 150 144 150 136 156 Z", MOUTH, 2.4) + ell(160, 150, 6, 2.4, TONGUE);
    if (kind === "tongue") return L("M134 146 q26 10 52 0", 3) + P("M152 149 C152 160 168 160 168 149", TONGUE, 2.2) + L("M160 151 v5", 1.4, "#B4566A");
    if (kind === "smirk") return L("M134 146 C150 152 166 150 184 140", 3) + P("M140 148 C138 158 150 160 152 150", TONGUE, 2.2);
    return P("M128 138 C146 160 174 160 192 138 C176 148 144 148 128 138 Z", MOUTH, 2.6) +
      P("M139 142 l4 9 l4 -7.4 Z", "#fff", 1.6) + P("M173 142.6 l4 7.4 l4 -9 Z", "#fff", 1.6) + ell(160, 151, 9, 3, TONGUE);
  }
  /* the tartar crown, a gem in red and blue; or, with opts.hat "santa", a Santa hat flopping to the right */
  function crown(fallen){
    var g = '<g' + (fallen ? ' transform="translate(92 158) rotate(-26)"' : ' transform="translate(0 -2)"') + ">";
    var d = fallen ? "M-26 22 L-30 -2 L-16 8 L-6 -10 L4 6 L14 -10 L20 8 L32 -2 L26 22 Z" : "M136 72 L132 50 L146 60 L156 42 L164 58 L174 42 L180 60 L192 50 L186 72 Z";
    var sh = fallen ? "M8 22 L14 -10 L20 8 L32 -2 L26 22 Z" : "M168 72 L174 42 L180 60 L192 50 L186 72 Z";
    var gems = fallen ? circ(-12, 14, 3.2, C.red, 1.6) + circ(4, 15, 3.2, C.blue, 1.6) + circ(18, 14, 3, C.red, 1.6) : circ(146, 64, 3.4, C.red, 1.6) + circ(161, 65, 3.6, C.blue, 1.6) + circ(176, 64, 3.4, C.red, 1.6);
    return g + P(d, TARTAR) + F(sh, TARTAR_SHADE, .8) + gems + (fallen ? "" : hi("M138 56 l2 10")) + P(d, "none") + "</g>";
  }
  function santa(){
    return P("M132 74 C134 56 148 42 166 42 C186 42 200 54 208 64 C214 70 222 76 228 86 C220 84 212 80 204 76 C198 74 194 72 190 74 Z", C.red) +
      F("M190 74 C194 72 198 74 204 76 C212 80 220 84 228 86 C222 76 214 70 208 64 C200 56 192 50 184 46 C192 56 194 66 190 74 Z", "#B02A32", .7) +
      P("M126 76 C128 66 190 64 194 74 C196 84 128 86 126 76 Z", C.paper) + F("M160 82 C176 82 192 80 194 74 C194 80 178 86 160 86 Z", C.paperShade) +
      circ(230, 88, 8, C.paper, 2.4) + hi("M142 58 q6 -8 14 -10");
  }
  function cracks(){
    return L("M118 96 l8 10 l-4 8 l8 8", 2) + L("M206 104 l-8 8 l4 6 l-8 10", 2) + L("M150 168 l6 -8 l6 4 l6 -6", 2) +
      P("M232 168 C240 166 244 172 240 178 C236 182 228 180 228 174 Z", BODY, 2) + P("M84 170 C78 170 76 178 82 180 C88 182 92 176 88 172 Z", BODY, 2) +
      ell(246, 184, 3, 2, BODY_SHADE) + ell(72, 186, 2.6, 1.8, BODY_SHADE);
  }
  function sweat(x, y, s){ s = s || 1; return P("M" + x + " " + y + " C" + (x - 5 * s) + " " + (y + 8 * s) + " " + (x - 5 * s) + " " + (y + 13 * s) + " " + x + " " + (y + 13 * s) + " C" + (x + 5 * s) + " " + (y + 13 * s) + " " + (x + 5 * s) + " " + (y + 8 * s) + " " + x + " " + y + " Z", C.sky, 1.8) + hi("M" + (x - 1.6 * s) + " " + (y + 7 * s) + " v3"); }
  function bandage(){
    return '<g transform="rotate(-24 122 88)">' + P("M104 82 H140 Q144 82 144 86 V90 Q144 94 140 94 H104 Q100 94 100 90 V86 Q100 82 104 82 Z", "#F6DCC0", 2) +
      F("M116 83 h12 v10 h-12 Z", "#EAC39C") + circ(111, 88, .9, INK) + circ(133, 88, .9, INK) + "</g>";
  }
  function zzz(){
    function z(x, y, w){ return L("M" + x + " " + y + " h" + w + " l" + (-w) + " " + f(w * 1.1) + " h" + w, f(w / 4.6), "#fff"); }
    return z(208, 84, 12) + z(226, 64, 9) + z(240, 48, 7);
  }
  function toothbrush(){
    return '<g>' + P("M164 158 L166 92 C166 88 172 88 172 92 L172 158 Z", C.blue, 2.2) + hi("M167.4 100 v40") +
      P("M160 78 H178 Q181 78 181 81 V92 H157 V81 Q157 78 160 78 Z", C.blue, 2.2) +
      P("M158 62 h22 v16 h-22 Z", C.paper, 2) + L("M162 62 v16 M166.5 62 v16 M171 62 v16 M175.5 62 v16", 1.2, C.metalShade) + "</g>";
  }

  /* ---- the boss in one of its states ---- */
  function boss(state, opts){
    opts = opts || {};
    var hat = opts.hat === "santa";
    if (state === "down") {
      var puddle = "M64 182 C60 162 90 150 116 152 C130 138 188 138 204 152 C230 150 260 162 256 182 C222 190 98 190 64 182 Z";
      return P(puddle, BODY) + F("M256 182 C260 162 230 150 204 152 C220 158 232 168 234 186 C244 186 250 184 256 182 Z", BODY_SHADE, .8) +
        ell(96, 172, 4, 2.4, SPECK, .55) + ell(226, 172, 4.4, 2.6, SPECK, .55) + ell(196, 178, 3, 2, SPECK, .5) + ell(118, 180, 2.6, 1.8, SPECK, .5) +
        L("M128 150 l14 14 M142 150 l-14 14", 3.4) + L("M178 150 l14 14 M192 150 l-14 14", 3.4) +
        L("M140 172 q20 7 40 0", 3) + P("M153 175 C153 186 167 186 167 175", TONGUE, 2.2) + L("M160 177 v5", 1.4, "#B4566A") +
        hi("M78 170 q8 -9 22 -11") + '<g transform="translate(52 10) rotate(12 168 158)">' + toothbrush() + "</g>" +
        (hat ? '<g transform="translate(-60 96) rotate(-26 160 64) scale(.62)">' + santa() + "</g>" : crown(true));
    }
    var pose = state === "soon" || state === "low" ? "rest" : state === "hurt" ? "brace" : "flex";
    var face = state === "soon" ? eyes("sleep") + mouth("snore") : state === "hurt" ? eyes("squint") + mouth("grit")
      : state === "low" ? eyes("scared") + mouth("wobble") : state === "away" ? eyes("smug") + mouth("smirk") : eyes("mad") + mouth("grin");
    var s = arms(pose) + drips() + P(BODY_D, BODY) + F(BODY_SH, BODY_SHADE, .75) + speckles() +
      hi("M106 110 C110 98 118 90 128 88") + hi("M142 72 q8 -6 16 -4") + F("M112 132 C118 128 124 130 124 136", BODY_LIGHT, .9) +
      face + P(BODY_D, "none");
    if (state === "hurt") s += bandage() + sweat(232, 96, 1);
    if (state === "low") s += cracks() + sweat(84, 96, 1) + sweat(236, 90, .8);
    s += hat ? santa() : crown(false);
    if (state === "away" && !opts.still) s = '<g transform="translate(206 176) rotate(6) scale(.74) translate(-160 -176)">' + s + "</g>";
    return s;
  }

  /* ---- the night: sky, moon, stars, the clock (its hands at h:m) ---- */
  function clock(h, m){
    var cx = 46, cy = 46, R = 22, ticks = "";
    for (var i = 0; i < 12; i++){ var a = i * Math.PI / 6, r1 = i % 3 ? 17.6 : 15.6; ticks += "M" + f(cx + Math.sin(a) * r1) + " " + f(cy - Math.cos(a) * r1) + " L" + f(cx + Math.sin(a) * 19.4) + " " + f(cy - Math.cos(a) * 19.4) + " "; }
    var ha = ((h % 12) + m / 60) * Math.PI / 6, ma = m * Math.PI / 30;
    return P("M" + (cx - R) + " " + cy + " a" + R + " " + R + " 0 1 0 " + (2 * R) + " 0 a" + R + " " + R + " 0 1 0 " + (-2 * R) + " 0 Z", C.paper, 2.6) +
      F("M" + (cx + R) + " " + cy + " a" + R + " " + R + " 0 0 1 " + (-R * 1.4) + " " + (R * .72) + " a" + (R * .9) + " " + (R * .9) + " 0 0 0 " + (R * 1.4) + " " + (-R * .72) + " Z", C.paperShade, .9) +
      L(ticks, 1.6) + L("M" + cx + " " + cy + " L" + f(cx + Math.sin(ha) * 10) + " " + f(cy - Math.cos(ha) * 10), 3.2) +
      L("M" + cx + " " + cy + " L" + f(cx + Math.sin(ma) * 15.4) + " " + f(cy - Math.cos(ma) * 15.4), 2.2, C.red) + circ(cx, cy, 2.4, INK) +
      P("M38 22 C36 16 40 12 46 12 C52 12 56 16 54 22", "none", 2.4);
  }
  function night(state){
    var s = '<rect x="0" y="0" width="320" height="220" fill="' + SKY + '"/>' + F("M0 150 C60 132 120 140 160 136 C210 132 260 128 320 146 V220 H0 Z", SKY_LIGHT, .8);
    [[92, 22, 3.4, C.goldLight], [128, 40, 2.4, "#fff"], [214, 26, 3, "#fff"], [246, 70, 2.2, C.goldLight], [104, 64, 1.8, "#fff"], [298, 96, 2.6, "#fff"], [18, 104, 2.2, C.goldLight], [70, 92, 1.6, "#fff"], [190, 46, 1.6, C.goldLight]]
      .forEach(function(t){ s += star(t[0], t[1], t[2], t[3]); });
    s += P("M276 18 A24 24 0 1 0 300 52 A19 19 0 1 1 276 18 Z", C.goldLight, 2.4) + F("M300 52 A24 24 0 0 1 262 58 A22 22 0 0 0 296 50 Z", C.gold, .7);
    var t = { soon: [5, 55], up: [8, 40], hurt: [9, 50], low: [11, 15], down: [10, 5], away: [12, 0] }[state] || [9, 0];
    return s + clock(t[0], t[1]);
  }
  /* the molar the boss sits on: enamel with its cusps, the gum along the bottom; shining once the boss is gone */
  function tooth(state){
    var e = "M-4 186 C24 174 50 176 72 184 C98 194 126 180 160 182 C196 184 224 194 250 184 C272 176 296 174 324 186 V222 H-4 Z";
    var s = P(e, C.enamel) + F("M250 184 C272 176 296 174 324 186 V222 H238 C262 214 270 200 250 184 Z", C.enamelShade, .9) +
      hi("M18 186 q18 -8 36 -4") + hi("M180 190 q20 2 34 -2") +
      P("M-4 210 C60 204 100 214 160 208 C220 202 262 214 324 206 V224 H-4 Z", C.gum) + F("M200 206 C240 202 280 212 324 206 V224 H220 Z", C.gumShade, .6);
    if (state === "down") s += star(40, 170, 7, "#fff") + star(286, 166, 6, "#fff") + star(120, 196, 4, "#fff") + star(236, 200, 4.4, "#fff");
    if (state === "away") s += F("M120 188 C150 192 170 186 196 190 C200 194 160 198 120 194 Z", BODY, .5);
    return s;
  }
  function scene(state, opts){
    opts = opts || {};
    return wrap(night(state) + tooth(state) + boss(state, opts) + (state === "soon" ? zzz() : ""), "0 0 320 220", opts.px, opts.label);
  }
  function icon(state, opts){
    opts = opts || {};
    var o = { hat: opts.hat, still: true };
    return wrap(boss(state, o), state === "down" ? "60 112 200 82" : "52 36 216 148", opts.px, opts.label);
  }
  function pick(st, frac){
    if (st === "soon" || st === "down") return st;
    if (st === "lost") return "away";
    return frac > .6 ? "up" : frac > .25 ? "hurt" : "low";
  }
  return { NAME: "The Midnight Plaque", STATES: ["soon", "up", "hurt", "low", "down", "away"], scene: scene, boss: boss, icon: icon, pick: pick, color: BODY, sky: SKY };
}
