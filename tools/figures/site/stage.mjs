/* The leaderboard's stage: curtains, spotlights, a sunburst, three pedestals in gold, silver and bronze, torches,
   confetti and a crown for first place (Sam, 2026-11-11: "more epic"). A kit: stage() is the set, pedestal() one block,
   and the page stands each winner's Timmy on top. Timmy's ink: flat fills, ink outlines, no ids, gradients or <text>. */
export function stageKit(INK, C){
  "use strict";
  var SW = 2.4, SI = 1.4;
  function f(n){ return Math.round(n * 10) / 10; }
  function P(d, fill, sw){ return '<path d="' + d + '" fill="' + (fill || "none") + '" stroke="' + INK + '" stroke-width="' + (sw || SW) + '" stroke-linejoin="round" stroke-linecap="round"/>'; }
  function F(d, fill, op){ return '<path d="' + d + '" fill="' + fill + '"' + (op != null ? ' opacity="' + op + '"' : "") + "/>"; }
  function L(d, sw, col, op){ return '<path d="' + d + '" fill="none" stroke="' + (col || INK) + '" stroke-width="' + (sw || SI) + '" stroke-linecap="round" stroke-linejoin="round"' + (op != null ? ' opacity="' + op + '"' : "") + "/>"; }
  function G(x, y, s, inner, cls){ return "<g" + (cls ? ' class="' + cls + '"' : "") + ' transform="translate(' + f(x) + " " + f(y) + ")" + (s && s !== 1 ? " scale(" + Math.round(s * 1000) / 1000 + ")" : "") + '">' + inner + "</g>"; }
  function rng(seed){ var s = (seed * 9301 + 49297) % 233280 || 1; return function(){ s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
  var NIGHT = "#2A2233", NIGHT2 = "#372C44", RED = "#9A2F43", RED3 = "#C04A5E";
  var MAT = {
    1: { top: C.goldLight, face: C.gold, side: C.goldShade, mark: "#A9770F" },
    2: { top: C.silverLight, face: C.silver, side: C.silverShade, mark: "#6F7A86" },
    3: { top: C.bronzeLight, face: C.bronze, side: C.bronzeShade, mark: "#7A4520" }
  };
  /* a four-point sparkle */
  function spark(x, y, r, fill){ return F("M" + f(x) + " " + f(y - r) + " Q" + f(x + r * .18) + " " + f(y - r * .18) + " " + f(x + r) + " " + f(y) + " Q" + f(x + r * .18) + " " + f(y + r * .18) + " " + f(x) + " " + f(y + r) + " Q" + f(x - r * .18) + " " + f(y + r * .18) + " " + f(x - r) + " " + f(y) + " Q" + f(x - r * .18) + " " + f(y - r * .18) + " " + f(x) + " " + f(y - r) + " Z", fill || C.goldLight); }
  /* chunky numerals for the blocks, drawn (no <text>) in a 30 x 40 box round the origin */
  var NUM = {
    1: "M-7 -11 L3 -19 H9 V13 H16 V20 H-11 V13 H-1 V-8 L-7 -4 Z",
    2: "M-13 -8 C-13 -16 -5 -20 1 -20 C9 -20 14 -15 14 -8 C14 0 7 6 -1 13 H14 V20 H-13 V14 C-4 6 5 -1 5 -8 C5 -11.6 3 -13 1 -13 C-2 -13 -4.4 -11 -4.4 -8 Z",
    3: "M-12 -14 C-9 -18 -4 -20 1 -20 C9 -20 13 -15.4 13 -10 C13 -5 10 -2 6 -1 C11 0 14 4 14 9 C14 16 8 20 0 20 C-6 20 -11 17 -13 13 L-7 8 C-5 11 -3 13 0 13 C4 13 6 11 6 8 C6 4 3 3 -3 3 V-4 C2 -4 5 -6 5 -9 C5 -12 3 -13 0 -13 C-3 -13 -5 -12 -7 -9 Z"
  };
  /* a laurel branch curving up from the origin (mirror it for the other side) */
  function laurel(col, shade){
    var s = L("M0 0 C-14 -4 -22 -18 -20 -34", 1.6, shade);
    [[-6, -2, -40], [-13, -8, -60], [-18, -16, -78], [-20.6, -25, -96], [-20, -33, -118]].forEach(function(q){
      s += '<g transform="translate(' + q[0] + " " + q[1] + ") rotate(" + q[2] + ')">' + P("M0 0 C3 -4 9 -4 12 0 C9 4 3 4 0 0 Z", col, 1.1) + "</g>";
    });
    return s;
  }
  /* the crown that floats over first place */
  function crown(){
    return P("M-22 8 L-26 -12 L-13 -2 L0 -20 L13 -2 L26 -12 L22 8 Z", C.gold) + F("M8 -9 L13 -2 L26 -12 L22 8 H10 Z", C.goldShade, .7) + P("M-22 8 H22 V14 H-22 Z", C.goldLight, 2) +
      '<circle cx="0" cy="-20" r="3.4" fill="' + C.red + '" stroke="' + INK + '" stroke-width="1.6"/><circle cx="-26" cy="-12" r="2.8" fill="' + C.blue + '" stroke="' + INK + '" stroke-width="1.6"/><circle cx="26" cy="-12" r="2.8" fill="' + C.blue + '" stroke="' + INK + '" stroke-width="1.6"/>' +
      '<circle cx="0" cy="11" r="2" fill="' + C.red + '"/><circle cx="-12" cy="11" r="1.6" fill="' + C.blue + '"/><circle cx="12" cy="11" r="1.6" fill="' + C.blue + '"/>' + L("M-18 -1 L-16 6", 1.6, "#fff", .7);
  }
  /* one block: place 1, 2 or 3; w wide, h tall, standing on y 0, its top at -h. The numeral sits in a wreath on its face. */
  function pedestal(place, w, h){
    var m = MAT[place], x = -w / 2, s = "";
    s += P("M" + f(x - 8) + " -10 H" + f(-x + 8) + " V0 H" + f(x - 8) + " Z", m.side);                                         // plinth
    s += P("M" + f(x) + " " + f(-h + 10) + " H" + f(-x) + " V-10 H" + f(x) + " Z", m.face);                                      // the block
    s += F("M" + f(-x - 16) + " " + f(-h + 10) + " H" + f(-x) + " V-10 H" + f(-x - 16) + " Z", m.side, .55);                       // its shaded side
    s += L("M" + f(x + 7) + " " + f(-h + 18) + " V-18", 2.4, "#fff", .55);
    s += P("M" + f(x - 6) + " " + f(-h) + " H" + f(-x + 6) + " V" + f(-h + 10) + " H" + f(x - 6) + " Z", m.top);                   // the top slab
    s += L("M" + f(x) + " " + f(-h + 3.4) + " H" + f(-x - 14), 2, "#fff", .7);
    var cy = -10 - (h - 20) / 2, k = Math.min(1, (h - 26) / 44, w / 110);
    s += G(0, cy, k, P(NUM[place], m.mark, 2) + L("M-3 -14 l5 -4", 1.8, "#fff", .5));
    if (h > 60) s += G(-2, cy + 20 * k, k, laurel(m.top, m.mark)) + '<g transform="translate(2 ' + f(cy + 20 * k) + ") scale(" + (-k) + " " + k + ')">' + laurel(m.top, m.mark) + "</g>";
    return s;
  }
  /* a torch on a stand: the page puts the flame on top (its foot at y -h) */
  function torch(h){
    return P("M-3 0 H3 L2 " + f(-h + 12) + " H-2 Z", C.metalShade, 1.8) + P("M-12 0 H12 L9 -6 H-9 Z", C.metalShade, 1.8) +
      P("M-13 " + f(-h + 12) + " H13 L9 " + f(-h + 22) + " H-9 Z", C.gold, 2) + L("M-9 " + f(-h + 15) + " H4", 1.6, "#fff", .6);
  }
  /* the set: W x H, the floor line at o.floor (default H - 44). Sunburst behind the middle, curtains, lights, confetti. */
  function stage(o){
    var W = o.w, H = o.h, fl = o.floor || H - 44, cx = W / 2, s = "", r = rng(o.seed || 7), i;
    s += F("M0 0 H" + W + " V" + H + " H0 Z", NIGHT);
    /* the sunburst: wedges fanning out from behind first place */
    var cy = fl - 96, R = Math.max(W, H);
    for (i = 0; i < 18; i += 2){
      var a0 = i / 18 * 2 * Math.PI - Math.PI / 2 - .09, a1 = (i + 1) / 18 * 2 * Math.PI - Math.PI / 2 - .09;
      s += F("M" + f(cx) + " " + f(cy) + " L" + f(cx + Math.cos(a0) * R) + " " + f(cy + Math.sin(a0) * R) + " L" + f(cx + Math.cos(a1) * R) + " " + f(cy + Math.sin(a1) * R) + " Z", NIGHT2);
    }
    s += '<circle class="st-halo" cx="' + f(cx) + '" cy="' + f(cy) + '" r="62" fill="#FFE9A8" opacity=".10"/><circle cx="' + f(cx) + '" cy="' + f(cy) + '" r="40" fill="#FFE9A8" opacity=".10"/>';
    /* three spotlights from the rig */
    s += '<g class="st-lights">' + F("M" + f(W * .16) + " 0 L" + f(cx - 150) + " " + fl + " H" + f(cx - 40) + " L" + f(W * .16 + 16) + " 0 Z", "#FFE9A8", .09) +
      F("M" + f(W * .84) + " 0 L" + f(cx + 150) + " " + fl + " H" + f(cx + 40) + " L" + f(W * .84 - 16) + " 0 Z", "#FFE9A8", .09) +
      F("M" + f(cx - 10) + " 0 L" + f(cx - 86) + " " + fl + " H" + f(cx + 86) + " L" + f(cx + 10) + " 0 Z", "#FFE9A8", .12) + "</g>";
    /* stars and sparkles on the backdrop */
    for (i = 0; i < 16; i++){ var sx = 60 + r() * (W - 120), sy = 34 + r() * (fl - 150); if (Math.abs(sx - cx) < 60 && sy > cy - 70) continue; s += '<g class="st-twinkle" style="animation-delay:' + f(r() * 3) + 's">' + spark(sx, sy, 2.4 + r() * 4, i % 3 ? C.goldLight : "#fff") + "</g>"; }
    /* the floor: boards, a lit pool under the blocks */
    s += F("M0 " + fl + " H" + W + " V" + H + " H0 Z", "#5B4038") + F("M0 " + fl + " H" + W + " V" + f(fl + 6) + " H0 Z", "#7A5648");
    for (i = 1; i < 9; i++) s += L("M" + f(W * i / 9 + (i - 4.5) * 10) + " " + f(fl + 6) + " L" + f(W * i / 9 + (i - 4.5) * 34) + " " + H, 1.2, "#3F2B27", .6);
    s += '<ellipse cx="' + f(cx) + '" cy="' + f(fl + 12) + '" rx="' + f(Math.min(300, W * .42)) + '" ry="16" fill="#FFE9A8" opacity=".14"/>';
    s += L("M0 " + fl + " H" + W, SW);
    /* the curtains: a drape each side, tied back with a gold cord, and a scalloped valance with a gold fringe */
    function drape(flip){
      var d = "M0 0 H86 C80 40 70 78 46 104 C60 132 66 190 70 " + f(fl + 10) + " H0 Z", t = P(d, RED);
      t += F("M0 0 H22 C24 60 20 120 26 " + f(fl + 10) + " H0 Z", "#7B2335", .7) + F("M50 0 H64 C62 40 54 76 40 100 C44 70 50 34 50 0 Z", "#7B2335", .6);
      t += L("M36 4 C36 50 32 86 28 110 M70 4 C66 40 58 72 46 98", 1.4, INK, .35) + L("M12 8 C14 70 10 150 14 " + f(fl), 2, RED3, .7);
      t += P("M22 98 C32 92 44 96 50 104 C44 112 30 114 22 108 Z", C.gold, 1.8) + L("M34 112 q-2 12 2 20 M40 111 q0 12 4 19", 1.6, C.goldShade);
      return flip ? '<g transform="translate(' + W + ' 0) scale(-1 1)">' + t + "</g>" : t;
    }
    s += drape(false) + drape(true);
    var n = Math.max(6, Math.round(W / 80)), sw = W / n, v = "M0 0 H" + W + " V22";
    for (i = n - 1; i >= 0; i--) v += " Q" + f(sw * (i + .5)) + " 46 " + f(sw * i) + " 22";
    s += P(v + " Z", RED) + F("M0 0 H" + W + " V8 H0 Z", "#7B2335", .7);
    var fr = "M" + W + " 22"; for (i = n - 1; i >= 0; i--) fr += " Q" + f(sw * (i + .5)) + " 46 " + f(sw * i) + " 22";
    s += L(fr, 3, C.gold);
    for (i = 0; i <= n; i++) s += '<circle cx="' + f(sw * i) + '" cy="23" r="3.2" fill="' + C.gold + '" stroke="' + INK + '" stroke-width="1.4"/>';
    return s;
  }
  /* confetti and streamers over the stage (its own layer, so the page can let it fall) */
  function confetti(o){
    var W = o.w, H = o.h, r = rng(o.seed || 3), s = "", cols = [C.gold, C.red, C.blue, C.green, C.pink, "#fff", C.orange], i;
    for (i = 0; i < (o.n || 46); i++){
      var x = 70 + r() * (W - 140), y = 46 + r() * (H - 150), c = cols[i % cols.length], a = Math.round(r() * 180), k = r();
      s += '<g class="st-conf" style="animation-delay:' + f(-r() * 6) + 's">' + (k < .55 ? '<rect x="' + f(x) + '" y="' + f(y) + '" width="7" height="3.6" rx="1" fill="' + c + '" transform="rotate(' + a + " " + f(x) + " " + f(y) + ')"/>' :
        k < .8 ? '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="2.2" fill="' + c + '"/>' : L("M" + f(x) + " " + f(y) + " q4 -5 8 0 t8 0", 2, c)) + "</g>";
    }
    return s;
  }
  return { stage: stage, pedestal: pedestal, crown: crown, torch: torch, confetti: confetti, spark: spark, laurel: laurel, G: G };
}
