/* The bowling egg: eight short clips like the odd cartoons a bowling alley's screens play after a strike or a spare,
   Timmy style (redesign phase 4, part D; vault/tasks/done/2026-11-06-redesign-bowling-egg.md). The pins are the Plaque crew
   from the boss egg (widget/eggs.js: their colors and faces), never teeth; the ball is a giant sugar-free mint.

   Drawn in Timmy's ink (style.mjs): flat fills, one shade on the side away from the light, ink outlines. No ids,
   gradients, filters, <text>, <style> or images, so a page can draw it many times. The words ("Strike!", "Spare!",
   "Turkey!") are the page's own text over the picture, so they're real, readable text.

   Motion is CSS keyframes (CSS below, kept apart from the drawing): every clip is one timeline of D seconds, and every
   animation in it starts at 0 and lasts D, so a clip frozen at any moment is the same CSS with a negative delay. That is
   how the still versions (for reduced motion) are made: the last frame, paused (.bw-still).

   Actors move in screen space. Each one is placed (translate and scale) and its inner group gets
   "translate(u) rotate(r) scale(k) translate(-q)", which puts its pivot q at a screen point, turned and scaled about the
   pivot. Every keyframe of an actor has the same list of functions, so browsers interpolate the numbers (a spin of 720
   degrees spins twice) instead of decomposing matrices.

   The whole kit is one function, bowlingKit(INK, C): build.mjs writes its source into tools/preview/design/bowling.js
   (and, when it is wired, the widget's on-demand bundle), so the clips the page plays are the ones checked here.      */
export function bowlingKit(INK, C){
  "use strict";

  var W = 320, H = 180;
  var SW = 2, SI = 1.3;
  function f(n){ return Math.round(n * 10) / 10; }
  function n2(n){ return String(Math.round(n * 100) / 100); }
  function n3(n){ return String(Math.round(n * 1000) / 1000); }
  function rng(seed){ var s = (seed * 9301 + 49297) % 233280 || 1; return function(){ s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
  function hex(c){ c = c.replace("#", ""); return [0, 2, 4].map(function(i){ return parseInt(c.slice(i, i + 2), 16); }); }
  function mix(a, b, t){ var x = hex(a), y = hex(b); return "#" + x.map(function(v, i){ var m = Math.round(v + (y[i] - v) * t); return (m < 16 ? "0" : "") + m.toString(16); }).join("").toUpperCase(); }
  function lerp(a, b, t){ return a + (b - a) * t; }

  /* ------------------------------------------------------------------ ink ------------------------------------------ */
  function F(d, fill, op){ return '<path d="' + d + '" fill="' + fill + '"' + (op != null && op < 1 ? ' opacity="' + op + '"' : "") + "/>"; }
  function O(d, sw, fill){ return '<path d="' + d + '" fill="' + (fill || "none") + '" stroke="' + INK + '" stroke-width="' + (sw || SW) + '"/>'; }
  function FO(d, fill, sw){ return O(d, sw, fill); }
  function L(d, sw, color, op){ return '<path d="' + d + '" fill="none" stroke="' + (color || INK) + '" stroke-width="' + (sw || SI) + '"' + (op != null && op < 1 ? ' opacity="' + op + '"' : "") + "/>"; }
  function circ(x, y, r, fill, sw, op){ return '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(r) + '" fill="' + fill + '"' + (sw ? ' stroke="' + INK + '" stroke-width="' + sw + '"' : "") + (op != null && op < 1 ? ' opacity="' + op + '"' : "") + "/>"; }
  function ell(x, y, rx, ry, fill, sw, op){ return '<ellipse cx="' + f(x) + '" cy="' + f(y) + '" rx="' + f(rx) + '" ry="' + f(ry) + '" fill="' + fill + '"' + (sw ? ' stroke="' + INK + '" stroke-width="' + sw + '"' : "") + (op != null && op < 1 ? ' opacity="' + op + '"' : "") + "/>"; }
  function T(dx, dy, s){ return '<g transform="translate(' + f(dx) + " " + f(dy) + ')">' + s + "</g>"; }
  function TS(dx, dy, k, s){ return '<g transform="translate(' + f(dx) + " " + f(dy) + ") scale(" + k + ')">' + s + "</g>"; }
  function TR(deg, s){ return '<g transform="rotate(' + f(deg) + ')">' + s + "</g>"; }
  function G(cls, s, hidden){ return '<g class="' + cls + '"' + (hidden ? ' opacity="0"' : "") + ">" + s + "</g>"; }
  /* a ring of n points, alternating radii: bursts and stars */
  function burst(r1, r2, n, rot){
    var d = "";
    for (var i = 0; i < n * 2; i++){ var a = (i / (n * 2)) * Math.PI * 2 + (rot || 0), r = i % 2 ? r2 : r1; d += (i ? " L" : "M") + f(Math.cos(a) * r) + " " + f(Math.sin(a) * r); }
    return d + " Z";
  }
  /* a four-point sparkle (the Dark Matter star of the rank and Timmy's place) */
  function spark(r){ var q = r * .2; return "M0 " + f(-r) + " Q" + f(q) + " " + f(-q) + " " + f(r) + " 0 Q" + f(q) + " " + f(q) + " 0 " + f(r) + " Q" + f(-q) + " " + f(q) + " " + f(-r) + " 0 Q" + f(-q) + " " + f(-q) + " 0 " + f(-r) + " Z"; }

  /* ------------------------------------------------------------------ colors --------------------------------------- */
  var K = {
    wall: "#EFE6EE", mask: C.plum, curtain: "#4B4F72", pleat: "#5A5F86", deck: "#F2D9AE", lane: "#EBC994", board: "#D9AF74",
    arrow: "#B98450", gutter: "#A2AAB3", gutterIn: "#87909A", kick: "#DCCDE5", kickIn: "#C9B6D5", mint: "#7FD6B5",
    night: "#1B1730", dm: "#B9A7FF", seat: C.orange
  };
  /* the Plaque crew, in the boss egg's colors (widget/eggs.js BOSSES) */
  var CREW = {
    plaque: { n: "Plaque Boss", c: "#B8A04A", mad: 1 }, tartar: { n: "Tartar Titan", c: "#A8946A", mad: 1 },
    biofilm: { n: "Biofilm Blob", c: "#6DBE5B" }, mutans: { n: "Strep Mutans Swarm", c: "#9B6BD6", mad: 1 },
    caries: { n: "Cavity Creep", c: "#8C5A3C", mad: 1 }, gingivitis: { n: "Gingivitis Goblin", c: "#D9534F", mad: 1 },
    halitosis: { n: "Halitosis Haze", c: "#8FA37A" }, redcomplex: { n: "The Red Complex", c: "#A3263A", mad: 1 }
  };
  /* the rack: the head pin first, then the rows behind it; [x, y of the base, scale] */
  var PINS = [[160, 116, .96], [146, 112, .9], [174, 112, .9], [132, 108, .84], [160, 108, .84], [188, 108, .84],
    [118, 104, .78], [146, 104, .78], [174, 104, .78], [202, 104, .78]];
  var KINDS = ["plaque", "tartar", "biofilm", "mutans", "caries", "gingivitis", "halitosis", "redcomplex", "biofilm", "plaque"];
  var BACK_TO_FRONT = [6, 7, 8, 9, 3, 4, 5, 1, 2, 0];

  /* ------------------------------------------------------------------ the lane ------------------------------------- */
  function wall(){
    var s = F("M0 0 H320 V122 H0 Z", K.wall) + F("M70 40 H250 V100 H70 Z", K.curtain);
    for (var x = 79; x < 250; x += 12) s += L("M" + x + " 40 V100", 2.4, K.pleat);
    return s + F("M70 40 H250 V45 H70 Z", mix(K.curtain, "#000000", .25)) + O("M70 40 H250 V100 H70 Z", 1.6);
  }
  function floor(){
    var s = F("M70 100 H250 L256 118 H64 Z", K.deck) + L("M70 100 H250", 1.3);
    s += F("M64 118 H78 L28 180 H4 Z", K.gutter) + F("M242 118 H256 L316 180 H292 Z", K.gutter) +
      L("M73 118 L18 180 M247 118 L302 180", 1.6, K.gutterIn);
    s += F("M78 118 H242 L292 180 H28 Z", K.lane);
    for (var i = 1; i < 10; i++) s += L("M" + f(78 + i * 16.4) + " 118 L" + f(28 + i * 26.4) + " 180", .9, K.board);
    for (var k = -3; k <= 3; k++){ var x = 160 + k * 21, y = 152 + Math.abs(k) * 3.4; s += F("M" + f(x) + " " + f(y - 4.4) + " L" + f(x + 2.8) + " " + f(y + 2) + " L" + f(x - 2.8) + " " + f(y + 2) + " Z", K.arrow); }
    return s + L("M78 118 L28 180 M242 118 L292 180", 1.3) + L("M64 118 H256", 1.4);
  }
  /* the kickbacks, the side walls at the deck: what pins run behind when they go "around the corner" */
  function kick(){
    return F("M0 30 H70 V100 L64 118 L4 180 H0 Z", K.kick) + L("M61 30 V102 L0 172", 3, K.kickIn) +
      F("M320 30 H250 V100 L256 118 L316 180 H320 Z", K.kick) + L("M259 30 V102 L320 172", 3, K.kickIn) +
      O("M70 30 V100 L64 118 L4 180", 1.8) + O("M250 30 V100 L256 118 L316 180", 1.8);
  }
  /* the masking panel over the pins, with its chasing bulbs; the turkey puts its scoreboard on it */
  function mask(){
    var s = F("M0 0 H320 V30 H0 Z", K.mask);
    for (var i = 0; i < 16; i++) s += G(i % 2 ? "bulb-b" : "bulb-a", circ(10 + i * 20, 24.6, 2.3, C.goldLight, 1));
    return s + L("M0 30.2 H320", 2, C.gold) + L("M0 31.6 H320", 1.2);
  }

  /* ------------------------------------------------------------------ the mint ------------------------------------- */
  /* a sugar-free mint: white, with a pinwheel of mint-green wedges; it spins as it rolls (mint-spin) */
  function mint(r){
    var w = "", rr = r * .9;
    for (var i = 0; i < 6; i++){
      var a1 = i * Math.PI / 3, a2 = a1 + Math.PI / 6;
      w += F("M0 0 Q" + f(Math.cos(a1 - .55) * r * .55) + " " + f(Math.sin(a1 - .55) * r * .55) + " " + f(Math.cos(a1) * rr) + " " + f(Math.sin(a1) * rr) +
        " A" + f(rr) + " " + f(rr) + " 0 0 1 " + f(Math.cos(a2) * rr) + " " + f(Math.sin(a2) * rr) +
        " Q" + f(Math.cos(a2 - .55) * r * .55) + " " + f(Math.sin(a2 - .55) * r * .55) + " 0 0 Z", K.mint);
    }
    var shade = "M" + f(r * .72) + " " + f(-r * .7) + " A" + f(r) + " " + f(r) + " 0 0 1 " + f(-r * .7) + " " + f(r * .72) + " A" + f(r * 1.15) + " " + f(r * 1.15) + " 0 0 0 " + f(r * .72) + " " + f(-r * .7) + " Z";
    return G("mint-spin", circ(0, 0, r, "#FFFFFF") + w + circ(0, 0, r * .2, "#FFFFFF")) + F(shade, INK, .12) +
      L("M" + f(-r * .66) + " " + f(-r * .3) + " A" + f(r * .72) + " " + f(r * .72) + " 0 0 1 " + f(-r * .2) + " " + f(-r * .69), 1.6, "#FFFFFF", .95) + circ(0, 0, r, "none", 1.8);
  }

  /* ------------------------------------------------------------------ a pin ---------------------------------------- */
  /* drawn with its base at 0,0 and 40 tall; o.face / o.mouth say which face shows first (the clips switch them) */
  var PIN = "M-5.2 0 C-8.6 -4 -10.4 -10 -9.6 -15 C-8.8 -20 -4.6 -23 -3.8 -27 C-3.4 -29.5 -5.8 -31 -5.6 -35 C-5.4 -38.6 -2.8 -40.4 0 -40.4 " +
    "C2.8 -40.4 5.4 -38.6 5.6 -35 C5.8 -31 3.4 -29.5 3.8 -27 C4.6 -23 8.8 -20 9.6 -15 C10.4 -10 8.6 -4 5.2 0 Z";
  var PIN_SHADE = "M0 -40.4 C2.8 -40.4 5.4 -38.6 5.6 -35 C5.8 -31 3.4 -29.5 3.8 -27 C4.6 -23 8.8 -20 9.6 -15 C10.4 -10 8.6 -4 5.2 0 L2.2 0 " +
    "C5.4 -4 6.6 -10 6.2 -15 C5.6 -20 1.8 -23 1.4 -27 C1.2 -29.6 3.2 -31.4 3 -35 C2.8 -38.4 1.6 -40 0 -40.4 Z";
  function hands(d){ return L(d, 1.5) + d.replace(/M[^L]+L/g, "|").split("|").slice(1).map(function(p){ var q = p.trim().split(/\s+/); return circ(+q[0], +q[1], 1.15, INK); }).join(""); }
  function pin(kind, o){
    o = o || {};
    var cr = CREW[kind], c = cr.c, sh = mix(c, INK, .28), dk = mix(c, INK, .5), face = o.face || "open", mouth = o.mouth || (cr.mad ? "smirk" : "smile0");
    var s = "";
    /* legs (two frames, alternating) and arms, hidden until a clip wants them; drawn first so they tuck under */
    s += G("legs", G("lg-a", L("M-2.6 -.6 L-5 3.8 M2.6 -.6 L3.4 4.4", 1.6) + ell(-5.6, 4.4, 2, 1.1, INK) + ell(4, 4.9, 2, 1.1, INK)) +
      G("lg-b", L("M-2.6 -.6 L-3.4 4.4 M2.6 -.6 L5 3.8", 1.6) + ell(-4, 4.9, 2, 1.1, INK) + ell(5.6, 4.4, 2, 1.1, INK), 1), 1);
    s += G("arms", hands("M-8.8 -17.5 L-13.2 -12.6 M8.8 -17.5 L13.2 -12.6"), 1) +
      G("arms-c", hands("M-8.8 -18.4 L-16 -21 M-8.6 -13.6 L-15.8 -15.6"), 1) +
      G("arms-u", T(0, -19, G("wave", T(0, 19, hands("M-8.4 -19 L-12.8 -27 M8.4 -19 L12.8 -27")))), 1) +
      G("arms-f", hands("M-8.4 -19 L-12.6 -26.6 M8.8 -17.5 L13.2 -12.6"), 1);
    /* the body */
    s += F(PIN, c) + F(PIN_SHADE, sh);
    if (kind === "plaque") s += circ(-4.2, -7.6, .8, dk) + circ(5, -10.4, .7, dk) + circ(1.8, -4.4, .7, dk) + circ(-1.6, -33.6, .6, dk);
    if (kind === "tartar") s += L("M-6.2 -20.4 l2.2 2.6 -2 2.4 M5.4 -8.2 l-1.8 2.2 1.4 1.8 M2 -36.6 l-1.4 2", 1, INK, .6);
    if (kind === "caries") s += ell(1.8, -35.6, 2, 1.5, "#2B1A10") + ell(-5.2, -6.4, 1.3, 1, "#2B1A10", 0, .8);
    if (kind === "biofilm") s += circ(-3.6, -32.6, 1.1, "#FFFFFF", 0, .5) + circ(5.8, -21, .9, "#FFFFFF", 0, .45);
    s += L("M-4.2 -25.4 Q0 -24.6 4.2 -25.4", 1.2, "#FFFFFF", .92) + L("M-5 -22.9 Q0 -22.1 5 -22.9", 1.2, "#FFFFFF", .92) +
      L("M-7 -18 C-8 -14 -7.8 -10 -6.4 -6.5", 1.4, "#FFFFFF", .5) + circ(-2.6, -37.2, 1, "#FFFFFF", 0, .7) + O(PIN, 1.8);
    /* what sets each one apart, from its boss egg drawing */
    if (kind === "biofilm") s += FO("M-6.4 -3.2 q-1.2 3 .4 4.6 q1.6 .4 1.6 -1.6 z M4.4 -2.4 q-.6 2.6 .8 3.4 q1.4 0 1 -2 z", c, 1);
    if (kind === "mutans") s += circ(9.4, -23, 1.9, mix(c, "#FFFFFF", .3), .9) + circ(10.6, -26.6, 1.7, mix(c, "#FFFFFF", .3), .9) + circ(10.8, -30.2, 1.5, mix(c, "#FFFFFF", .3), .9) + circ(-9.6, -6, 1.6, mix(c, "#FFFFFF", .3), .9);
    if (kind === "gingivitis") s += FO("M-4.8 -35 L-9.4 -39.4 L-4.4 -37.6 Z M4.8 -35 L9.4 -39.4 L4.4 -37.6 Z", c, 1);
    if (kind === "halitosis") s += L("M-3 -43.4 q-1.6 -2 0 -4 q1.6 -2 0 -4 M3 -44.4 q-1.6 -2 0 -4 q1.6 -2 0 -4", 1.1, dk, .8);
    if (kind === "redcomplex") s += L("M-9.6 -11.6 q-1.8 -1.6 -3.4 0 q-1.6 1.6 -3.2 0 M9.6 -11.6 q1.8 -1.6 3.4 0 q1.6 1.6 3.2 0", 1.1, c) + L("M-9.6 -11.6 q-1.8 -1.6 -3.4 0 q-1.6 1.6 -3.2 0 M9.6 -11.6 q1.8 -1.6 3.4 0 q1.6 1.6 3.2 0", .5, INK, .6);
    /* the face: open eyes (with pupils that look), wide, knocked out, happy; brows; three mouths */
    var eo = circ(-3.3, -16.4, 2.5, "#FFFFFF", .9) + circ(3.3, -16.4, 2.5, "#FFFFFF", .9);
    s += G("f-eo", eo + G("f-pu", circ(-3, -16, 1.2, INK) + circ(3.6, -16, 1.2, INK)), face !== "open");
    s += G("f-ew", circ(-3.4, -16.8, 3.3, "#FFFFFF", .9) + circ(3.4, -16.8, 3.3, "#FFFFFF", .9) + G("f-pw", circ(-3.4, -16.4, .8, INK) + circ(3.4, -16.4, .8, INK)), face !== "wide");
    s += G("f-ex", L("M-5 -18.4 l3 3 m0 -3 l-3 3 M2 -18.4 l3 3 m0 -3 l-3 3", 1.2), face !== "x");
    s += G("f-ec", L("M-5.2 -15.6 q1.9 -2.2 3.8 0 M1.4 -15.6 q1.9 -2.2 3.8 0", 1.3), face !== "happy");
    if (cr.mad) s += G("f-br", L("M-6.2 -20.8 L-1.6 -19.4 M6.2 -20.8 L1.6 -19.4", 1.3), face !== "open");
    s += G("f-m", L(cr.mad ? "M-2.8 -11.2 Q0 -9.4 2.8 -11.6" : "M-2.6 -11.4 Q0 -9.4 2.6 -11.4", 1.2), mouth !== "smirk" && mouth !== "smile0");
    s += G("f-mo", ell(0, -10.4, 2.1, 2.5, "#5A2430", .9), mouth !== "open");
    s += G("f-ms", FO("M-3.2 -12 Q0 -7.6 3.2 -12 Z", "#5A2430", .9), mouth !== "smile");
    s += G("f-sw", FO("M7.6 -36.6 q2.6 3.6 0 5.2 q-2.6 -1.6 0 -5.2 Z", "#8FD3F5", .9), 1);
    s += T(0, -45, G("f-bang", L("M0 -9 L0 -3.6", 2.4) + circ(0, -.4, 1.3, INK), 1));
    return s;
  }
  /* a pin lying down where it fell (for the back of a scene): rotated about its base, lifted to rest on the floor */
  function lying(kind, x, y, s, dir, o){ return TS(x, y - 7.4 * s, s, TR(dir * 88, pin(kind, o))); }

  /* ------------------------------------------------------------------ props ---------------------------------------- */
  function puff(k){ k = k || 1; return FO("M" + f(-12 * k) + " " + f(4 * k) + " q" + f(-3 * k) + " " + f(-8 * k) + " " + f(5 * k) + " " + f(-9 * k) + " q" + f(2 * k) + " " + f(-7 * k) + " " + f(9 * k) + " " + f(-5 * k) +
    " q" + f(6 * k) + " " + f(-4 * k) + " " + f(9 * k) + " " + f(3 * k) + " q" + f(7 * k) + " " + f(1 * k) + " " + f(4 * k) + " " + f(9 * k) + " q" + f(-3 * k) + " " + f(6 * k) + " " + f(-9 * k) + " " + f(4 * k) +
    " q" + f(-5 * k) + " " + f(5 * k) + " " + f(-11 * k) + " " + f(1 * k) + " q" + f(-6 * k) + " " + f(2 * k) + " " + f(-7 * k) + " " + f(-3 * k) + " z", "#FFFFFF", 1.4); }
  function boom(){ return FO(burst(28, 15, 12, .13), C.yellow, 2) + F(burst(15, 8.4, 10, .3), C.orange) + F(burst(7, 4, 8), C.goldLight); }
  function arcs(){ return L("M34 -12 Q41 0 34 12 M42 -19 Q53 0 42 19 M-34 -12 Q-41 0 -34 12 M-42 -19 Q-53 0 -42 19", 2); }
  function sparkle(r, fill){ return FO(spark(r), fill || "#FFFFFF", 1); }
  function note(){ var st = "M2.8 -.6 V-12.6 Q7 -10.6 6.6 -6"; return L(st, 3) + L(st, 1.4, C.goldLight) + ell(0, 0, 3.2, 2.3, C.goldLight, 1); }
  /* the high-speed handpiece, the rank's own tool, standing on its back end: the head and bur at the top, the coupling
     at the bottom, and a jet flame under it (hidden until it lights) */
  function handpiece(){
    var body = FO("M-3.4 -24 L3.4 -24 L5.6 18 L-5.6 18 Z", C.metal, 1.6) + F("M1 -24 L3.4 -24 L5.6 18 L2.2 18 Z", C.metalShade, .55) +
      L("M-4.4 -6 H4.4 M-4.7 0 H4.7 M-5 6 H5", 1, C.metalShade) + L("M-1.6 -20 L-2.8 12", 1.4, "#FFFFFF", .7);
    var head = FO("M-9 -35.4 H4.6 Q7.4 -35.4 7.4 -32.4 V-28.4 Q7.4 -25.4 4.6 -25.4 H-9 Q-11.6 -25.4 -11.6 -28.4 V-32.4 Q-11.6 -35.4 -9 -35.4 Z", C.metalLight, 1.6) +
      F("M2 -35.4 H4.6 Q7.4 -35.4 7.4 -32.4 V-28.4 Q7.4 -25.4 4.6 -25.4 H2 Z", C.metalShade, .45) + L("M-11.6 -30.4 L-18.4 -30.4", 2.2) + L("M-11.6 -30.4 L-18.4 -30.4", 1, C.gold);
    var back = FO("M-6.2 18 H6.2 V24 H-6.2 Z", C.metalShade, 1.6) + FO("M-4.2 24 H4.2 L5.6 28 H-5.6 Z", "#5B6570", 1.4);
    var flame = T(0, 28, G("flame", FO("M-5.4 0 Q-7.4 13 0 27 Q7.4 13 5.4 0 Z", C.orange, 1.6) + F("M-2.8 0 Q-3.6 8 0 17 Q3.6 8 2.8 0 Z", C.yellow)));
    return G("hp-flame", flame, 1) + body + head + back;
  }
  /* the toothbrush by Timmy's front door (canon since Occlusion; the same colors as Timmy's place), turned over to sweep:
     its bristle tips at 0,0 */
  function brush(){
    var s = FO("M-2.6 -12 L-2 -27 L2 -27 L2.6 -12 Z", "#8FD3F5", 1.8) +
      FO("M-2.4 -27 C-3.6 -40 -4.6 -52 -4.4 -66 L4.4 -66 C4.6 -52 3.6 -40 2.4 -27 Z", "#8FD3F5", 2) + F("M-2.6 -40 C-3.2 -48 -3.4 -54 -3.2 -60 L3.2 -60 C3.4 -54 3.2 -48 2.6 -40 Z", C.blue) +
      FO("M-8.6 -12 H8.6 V-8.4 H-8.6 Z", "#8FD3F5", 1.8);
    for (var i = 0; i < 5; i++) s += FO("M" + f(-8.2 + i * 3.4) + " -8.4 h3 v8.4 h-3 z", i % 2 ? C.green : "#FFFFFF", 1.1);
    return s + L("M-1.4 -30 L-2.6 -60", 1.2, "#FFFFFF", .7);
  }
  /* a dustpan, side on: its far wall before the pins, its near wall after, so swept pins show over its rim */
  function dustBack(){ return FO("M80 117 L82 95 L88 95 L114 112 L114 117 Z", mix(K.seat, "#FFFFFF", .25), 1.4) + L("M84 95 L77 76", 3.4) + L("M84 95 L77 76", 1.8, K.seat); }
  function dustFront(){ return FO("M80 117.6 L81.6 104 L86 104 L114 114 L114 117.6 Z", K.seat, 1.6) + F("M100 109.6 L114 114 L114 117.6 L100 117.6 Z", mix(K.seat, INK, .25)); }
  /* the gallery: three molded seats in the foreground */
  function seats(){
    var s = "";
    [40, 78, 116].forEach(function(x){
      s += FO("M" + (x - 17) + " 168 L" + (x - 16) + " 145 Q" + (x - 16) + " 139 " + (x - 10) + " 139 H" + (x + 10) + " Q" + (x + 16) + " 139 " + (x + 16) + " 145 L" + (x + 17) + " 168 Z", K.seat, 1.8) +
        F("M" + (x + 8) + " 139.4 H" + (x + 10) + " Q" + (x + 15.4) + " 139.4 " + (x + 15.4) + " 145 L" + (x + 16.4) + " 167.4 H" + (x + 9) + " Z", mix(K.seat, INK, .22));
    });
    s += L("M20 175 V180 M58 175 V180 M96 175 V180 M134 175 V180", 2.4, C.metalShade) + L("M14 177.4 H140", 2.6, C.metalShade);
    [40, 78, 116].forEach(function(x){ s += FO("M" + (x - 19.4) + " 166 H" + (x + 19.4) + " Q" + (x + 20.6) + " 172 " + (x + 16) + " 173.6 H" + (x - 16) + " Q" + (x - 20.6) + " 172 " + (x - 19.4) + " 166 Z", mix(K.seat, "#FFFFFF", .18), 1.8); });
    return s;
  }
  /* number thirty-one, the second molar who lives right behind Timmy (tools/podcast/LORE.md): a little smaller and
     creamier than Timmy, worried brows, and a thermometer, because he is sure he has whatever was on the last lecture.
     Drawn in Timmy's 200 frame with his seat (the CEJ) at 100,150 */
  var T31 = "M50 92 C46 62 58 44 78 44 C90 44 94 52 100 52 C106 52 110 44 122 44 C142 44 154 62 150 92 C148 110 145 126 142 142 " +
    "C139 162 134 180 126 194 C122 202 113 202 111 193 C109 181 106 171 100 167 C94 171 91 181 89 193 C87 202 78 202 74 194 C66 180 61 162 58 142 C55 126 52 110 50 92 Z";
  function thirtyOne(){
    var en = "#FFF8EA", s = "";
    s += FO("M54 108 C42 110 35 118 37 126 C39 132 46 132 49 127 C51 123 54 119 57 119", en, 4.5);
    s += F(T31, en) + F("M58 142 C61 162 66 180 74 194 C78 202 87 202 89 193 C91 181 94 171 100 167 C106 171 109 181 111 193 C113 202 122 202 126 194 C134 180 139 162 142 142 Q100 154 58 142 Z", "#EFD9A7") +
      F("M150 92 C148 110 145 126 142 142 Q132 146 120 147.6 C134 128 140 98 132 60 C144 64 152 76 150 92 Z", "#EADCC0") + L("M58 142 Q100 154 142 142", 1.8, "#C9A86A", .8) +
      L("M62 68 C63 59 69 53 77 52", 6, "#FFFFFF", .95) + circ(59, 77, 3, "#FFFFFF", 0, .95) + O(T31, 4.5);
    s += FO("M146 108 C158 110 165 118 163 126 C161 132 154 132 151 127 C149 123 146 119 143 119", en, 4.5);
    s += ell(68, 112, 8, 4.6, "#FF8FA3", 0, .45) + ell(132, 112, 8, 4.6, "#FF8FA3", 0, .45);
    s += G("e31o", ell(81, 93, 9, 10, "#FFFFFF", 3.4) + ell(119, 93, 9, 10, "#FFFFFF", 3.4) + G("p31", circ(82, 95, 4.4, INK) + circ(120, 95, 4.4, INK) + circ(83.6, 93.4, 1.4, "#FFFFFF") + circ(121.6, 93.4, 1.4, "#FFFFFF")));
    s += G("e31w", ell(81, 92, 12.4, 13.4, "#FFFFFF", 3.4) + ell(119, 92, 12.4, 13.4, "#FFFFFF", 3.4) + circ(81, 92, 2.6, INK) + circ(119, 92, 2.6, INK), 1);
    s += G("e31c", L("M70 95 Q81 103 92 95 M108 95 Q119 103 130 95", 4), 1);
    s += L("M68 80 L89 72 M132 80 L111 72", 4.2);
    s += G("m31", L("M86 120 Q93 115 100 120 Q107 125 114 120", 3.6));
    s += G("m31o", ell(100, 121, 7, 8.4, "#7A2E3C", 3.4), 1);
    /* the thermometer, pivoting at the corner of his mouth */
    s += T(111, 120, G("a-th", L("M0 0 L30 14", 8.4) + L("M0 0 L30 14", 5, "#FFFFFF") + L("M14 6.5 L30 14", 2.2, C.red) + circ(32, 15, 4.8, C.red, 3)));
    return s;
  }
  /* the scorecard number thirty-one is fanned with: held at its handle */
  function scorecard(){
    var s = FO("M-12 -22 H12 V-4 H-12 Z", "#FFFFFF", 1.4) + L("M-12 -13 H12 M-7.2 -22 V-4 M-2.4 -22 V-4 M2.4 -22 V-4 M7.2 -22 V-4", .8, INK, .7) +
      L("M-11 -21 l3 3 m0 -3 l-3 3 M-6.2 -21 l3 3 m0 -3 l-3 3 M3.4 -21 l3 3 m-3 0 l3 -3", .9) + L("M8.2 -18 l3 -3", .9, C.red) + L("M0 -4 V1", 2.2);
    return s;
  }
  /* a turkey in Timmy's pilgrim hat (widget/pet.js: its colors), facing right, feet at 0,0 */
  function turkey(){
    var fc = ["#8C4A1E", "#C0392B", "#E67E22", "#F1C40F", "#E67E22", "#C0392B", "#8C4A1E"], tail = "";
    [-66, -44, -22, 0, 22, 44, 66].forEach(function(a, i){ tail += TR(a, ell(0, -14, 5.2, 14.4, fc[i], 1.4) + ell(0, -24, 2.4, 3, INK, 0, .25)); });
    var legS = function(d){ return L(d, 3.6) + L(d, 2, "#E58E26"); };
    var walkA = legS("M-2 -12 L-7 -1 M-7 -1 L-10 0 M3 -12 L5 0 M5 0 L8.4 .6"), walkB = legS("M-2 -12 L1 0 M1 0 L4.4 .6 M3 -12 L8 -1 M8 -1 L11 0");
    var stand = legS("M-2.6 -12 L-3.6 0 M-3.6 0 L-6.8 .8 M-3.6 0 L-.8 1 M2.6 -12 L3.6 0 M3.6 0 L.8 1 M3.6 0 L6.8 .8");
    var hat = ell(15.4, -51, 8.8, 1.9, "#2E2A28", 1.4) + FO("M10.4 -51.4 L11.6 -60.4 L19.2 -60.4 L20.4 -51.4 Z", "#3A3532", 1.4) +
      F("M10.9 -55 L19.9 -55 L20.2 -52.8 L10.6 -52.8 Z", "#8C6B3E") + '<rect x="13.9" y="-55.4" width="3" height="3" fill="none" stroke="#F6CD55" stroke-width=".9"/>';
    var head = FO("M7 -30 Q12 -36 12.6 -44 L18.8 -44 Q18.2 -34 13 -26 Z", "#E9EEF5", 1.6) + circ(16, -46, 5.4, "#E9EEF5", 1.8) +
      FO("M20.8 -47.2 L27.4 -45.4 L20.8 -43.6 Z", C.gold, 1.2) + FO("M20.4 -48.8 Q24.4 -48.2 23.8 -42.4 Q22.4 -44.2 20.4 -45.2 Z", "#D6363C", 1) +
      FO("M17.8 -42.2 Q20.2 -36 16.6 -34.6 Q15 -37.6 15.8 -41.4 Z", "#D6363C", 1.2) + circ(17.2, -47.6, 1.1, INK) + circ(17.6, -48, .4, "#FFFFFF") + hat;
    var body = ell(0, -22, 15.4, 12.6, "#8A5A33", 2) + F("M12 -30 Q17 -22 12.6 -14 Q4 -8.6 -6 -10.6 Q8 -14 12 -30 Z", "#6E4426") +
      FO("M-9 -24 Q-1 -32 8 -25 Q4 -16 -8 -17 Q-11 -20 -9 -24 Z", "#6E4426", 1.4) + L("M-5 -21 Q0 -24 5 -23 M-6 -18.6 Q-1 -20.4 3 -19.6", 1, "#4E2E18");
    return G("tk-walk", G("tk-a", walkA) + G("tk-b", walkB, 1)) + G("tk-stand", stand, 1) +
      G("tk-body", G("tk-tail", T(-8, -24, TR(-12, tail))) + body + G("tk-head", head));
  }

  /* ------------------------------------------------------------------ the timeline --------------------------------- */
  var EASE = { in: "cubic-bezier(.5,0,.9,.6)", out: "cubic-bezier(.1,.5,.4,1)", io: "cubic-bezier(.45,0,.55,1)" };
  function Clip(k, D){ this.k = k; this.D = D; this.css = []; this.n = 0; }
  Clip.prototype.pc = function(t){ return String(Math.max(0, Math.min(100, Math.round(t / this.D * 10000) / 100))) + "%"; };
  /* one animation: frames [t, declarations, easing to the next frame] */
  Clip.prototype.anim = function(sel, frames, timing){
    var name = "bw" + this.k.slice(0, 3) + (++this.n), self = this;
    /* hold the first pose from 0 and the last to the end: a missing 0% or 100% would fall back to the resting place */
    frames = frames.slice().sort(function(a, b){ return a[0] - b[0]; });
    if (frames[0][0] > 0) frames.unshift([0, frames[0][1]]);
    if (frames[frames.length - 1][0] < this.D) frames.push([this.D, frames[frames.length - 1][1]]);
    var body = frames.map(function(fr){ return self.pc(fr[0]) + "{" + fr[1] + (fr[2] ? ";animation-timing-function:" + (EASE[fr[2]] || fr[2]) : "") + "}"; }).join("");
    this.css.push("@keyframes " + name + "{" + body + "}.bw-" + this.k + " " + sel + "{animation:" + name + " " + this.D + "s " + (timing || "linear") + " both}");
  };
  /* show and hide: frames [t, opacity]; it jumps unless smooth */
  Clip.prototype.op = function(sel, frames, smooth){ this.anim(sel, frames.map(function(fr){ return [fr[0], "opacity:" + fr[1]]; }), smooth ? "linear" : "steps(1,end)"); };
  /* move an actor: frames [t, {x, y, r, k, o}, easing], x and y where its pivot goes on screen (default: where it
     stands), r its turn, k its scale (a number or [kx, ky]) relative to how it is placed, o its opacity */
  Clip.prototype.move = function(a, frames){
    var rx = a.b[0] + a.s * a.q[0], ry = a.b[1] + a.s * a.q[1], useO = frames.some(function(fr){ return fr[1].o != null; });
    this.anim(a.sel, frames.map(function(fr){
      var p = fr[1], x = p.x == null ? rx : p.x, y = p.y == null ? ry : p.y, k = p.k == null ? 1 : p.k;
      var kx = Array.isArray(k) ? k[0] : k, ky = Array.isArray(k) ? k[1] : k;
      return [fr[0], "transform:translate(" + n2((x - a.b[0]) / a.s) + "px," + n2((y - a.b[1]) / a.s) + "px) rotate(" + n2(p.r || 0) + "deg) scale(" + n3(kx) + "," + n3(ky) +
        ") translate(" + n2(-a.q[0]) + "px," + n2(-a.q[1]) + "px)" + (useO ? ";opacity:" + (p.o == null ? 1 : p.o) : ""), fr[2]];
    }));
  };
  /* actors: a pin of the rack (pivot at its base unless q says), the mint, anything placed at the origin */
  function pinA(i, q){ return { sel: ".a-p" + i, b: [PINS[i][0], PINS[i][1]], s: PINS[i][2], q: q || [0, 0] }; }
  function at(cls){ return { sel: "." + cls, b: [0, 0], s: 1, q: [0, 0] }; }
  var MINT = at("a-mint");
  function rack(ids, o, cls){
    return BACK_TO_FRONT.filter(function(i){ return !ids || ids.indexOf(i) >= 0; }).map(function(i){ var p = PINS[i]; return TS(p[0], p[1], p[2], G("a-p" + i + (cls ? " " + cls : ""), pin(KINDS[i], o && o[i]))); }).join("");
  }
  function pinCenter(i){ return [PINS[i][0], PINS[i][1] - 20 * PINS[i][2]]; }
  /* a quick pop: hidden, then in at t with a little overshoot, held, and (if t2) gone again */
  function pop(c, sel, t, t2, k){
    k = k || 1;
    var fr = [[0, "opacity:0;transform:scale(0)"], [t, "opacity:0;transform:scale(0)"], [t + .08, "opacity:1;transform:scale(" + n3(1.3 * k) + ")"], [t + .16, "opacity:1;transform:scale(" + n3(k) + ")"]];
    if (t2) fr.push([t2, "opacity:1;transform:scale(" + n3(k) + ")"], [t2 + .14, "opacity:0;transform:scale(" + n3(k * 1.1) + ")"]);
    c.anim(sel, fr);
  }
  /* faces of every pin at once: [t, face, mouth] */
  function faces(c, sel, list){
    var F_ = { open: ".f-eo", wide: ".f-ew", x: ".f-ex", happy: ".f-ec" }, M_ = { smirk: ".f-m", open: ".f-mo", smile: ".f-ms" };
    Object.keys(F_).forEach(function(k){ c.op(sel + F_[k], list.map(function(l){ return [l[0], l[1] === k ? 1 : 0]; })); });
    Object.keys(M_).forEach(function(k){ c.op(sel + M_[k], list.map(function(l){ return [l[0], l[2] === k ? 1 : 0]; })); });
    c.op(sel + ".f-br", list.map(function(l){ return [l[0], l[1] === "open" && l[3] !== "nobrow" ? 1 : 0]; }));
  }

  /* ------------------------------------------------------------------ the clips ------------------------------------ */
  var CLIPS = [], BY = {};
  function clip(k, n, word, D, wordAt, note, alt, build){
    var c = new Clip(k, D), svg = build(c);
    /* where the word goes, in percent of the screen: low over the lane, which every ending leaves empty, except the
       neighbor's, which happens in the gallery, so its word goes over the curtain */
    var pos = k === "neighbor" ? [64, 40] : [50, 79];
    var meta = { k: k, n: n, word: word, D: D, wordAt: wordAt, wordPos: pos, note: note, alt: alt, svg: svg, css: c.css.join("\n") };
    CLIPS.push(meta); BY[k] = meta;
  }

  /* 1. The panic: the pins see the mint coming, scream and scatter; the mint follows one around the corner */
  clip("panic", "The panic", "Strike!", 4.4, 3.5, "The pins see the mint coming, scream and scatter; the mint follows one around the corner.",
    "The Plaque crew pins see a giant mint rolling at them, scream and run off in every direction; the mint chases the head pin around the corner, and it peeks back out.",
    function(c){
      c.move(MINT, [[0, { x: 160, y: 206, k: 2.1 }, "out"], [1.2, { x: 160, y: 134, k: 1.25 }], [1.9, { x: 160, y: 106, k: 1 }], [2.3, { x: 212, y: 106, k: .98 }], [2.8, { x: 292, y: 104, k: .95 }],
        [3.6, { x: 292, y: 62, k: .9 }], [3.85, { x: 245, y: 63, k: .9 }, "out"]]);
      var runs = { 6: [1.05, 1.6, 36], 3: [1.1, 1.7, 26], 1: [1.15, 1.75, 18], 9: [1.05, 1.6, 292], 5: [1.1, 1.65, 300], 2: [1.15, 1.7, 306], 7: [1.1, 1.45, 0, 1], 8: [1.22, 1.56, 0, 1], 4: [1.3, 1.64, 2, 1], 0: [1.5, 2.3, 300] };
      for (var i = 0; i < 10; i++){
        var p = PINS[i], r = runs[i], fr = [[0, {}]], lean = r[2] < p[0] ? -9 : 9;
        [.72, .78, .84, .9, .96, 1.02, 1.08, 1.14, 1.2, 1.26, 1.32, 1.38, 1.44].forEach(function(t, j){ if (t < r[0] - .03) fr.push([t, { x: p[0] + (j % 2 ? .9 : -.9) }]); });
        fr.push([r[0], {}]);
        if (r[3]){ fr.push([r[0] + .06, { k: [1.14, .8] }], [r[0] + .12, { y: p[1] - 22, k: [.88, 1.16] }, "in"], [r[1], { y: r[2], k: [.92, 1.1] }]); }
        else for (var j = 1; j <= 4; j++){ var u = j / 4, t = r[0] + (r[1] - r[0]) * u, h = (r[1] - r[0]) / 8; fr.push([t - h, { x: lerp(p[0], r[2], u - .125), y: p[1] - 3, r: lean }], [t, { x: lerp(p[0], r[2], u), y: p[1], r: lean }]); }
        if (i === 0) fr.push([3.2, { x: 300, y: 116, r: lean }], [3.42, { x: 244, y: 116, r: -5 }, "out"], [3.6, { x: 244, y: 116, r: 0 }]);
        c.move(pinA(i), fr);
        pop(c, ".a-p" + i + " .f-bang", .56 + i * .025, i === 0 ? 1.4 : r[0] + .05);
      }
      faces(c, "", [[0, "open", "smirk"], [.5, "wide", "smirk"], [.68, "wide", "open"]]);
      c.op(".legs", [[0, 0], [1.0, 1]]);
      c.op(".a-p0 .f-sw", [[0, 0], [3.45, 1]]);
      c.anim(".a-p0 .f-pw", [[0, "transform:translate(0px,0px)"], [3.5, "transform:translate(0px,0px)"], [3.6, "transform:translate(-1.2px,0px)"], [3.95, "transform:translate(-1.2px,0px)"], [4.05, "transform:translate(1.4px,-.6px)"]]);
      [[132, 104, 1.08], [190, 106, 1.12], [160, 112, 1.5]].forEach(function(q, i){ c.anim(".a-pf" + i, [[0, "opacity:0;transform:scale(.2)"], [q[2], "opacity:0;transform:scale(.2)"], [q[2] + .05, "opacity:1;transform:scale(.55)"], [q[2] + .45, "opacity:0;transform:scale(1.25)"]]); });
      var puffs = [[132, 104], [190, 106], [160, 112]].map(function(q, i){ return T(q[0], q[1], G("a-pf" + i, puff(.8), 1)); }).join("");
      return wall() + floor() + puffs + rack() + G("a-mint", mint(12)) + kick() + mask();
    });

  /* 2. The conga: the pins dance a conga line straight into the gutter */
  clip("conga", "The conga", "Strike!", 4.8, 4.0, "The pins dance a conga line straight into the gutter.",
    "Music starts; the pins line up, hands on shoulders, and conga off the deck and down the gutter, the last one waving.",
    function(c){
      var line = function(i){ return 112 + i * 14.5; }, Y = 113, KS = .9, G0 = [70, 115], G1 = [-30, 230], v = 60, t0 = 1.4;
      for (var i = 0; i < 10; i++){
        var p = PINS[i], fr = [[0, {}]], d = line(i) - G0[0], tg = t0 + d / v;
        [.15, .3, .45, .6].forEach(function(t, j){ fr.push([t, { y: p[1] - (j % 2 ? 0 : 2.6) }]); });
        fr.push([.9, { x: (p[0] + line(i)) / 2, y: (p[1] + Y) / 2 - 8, k: (KS + p[2]) / 2 / p[2] }], [1.2, { x: line(i), y: Y, k: KS / p[2] }]);
        for (var t = t0; t <= 4.8001; t += .15){
          var prog = v * (t - t0), beat = Math.round((t - t0) / .15) % 2, pos;
          if (prog < d) pos = { x: line(i) - prog, y: Y - (beat ? 2.2 : 0), r: beat ? -6 : 6, k: KS / p[2] };
          else { var u = (prog - d) / 45; if (i === 9) u = Math.min(u, .3); var e = Math.pow(Math.min(u, 1), 1.5);
            pos = { x: lerp(G0[0], G1[0], e), y: lerp(G0[1], G1[1], e) - (i === 9 && beat ? 1.4 : 0), r: -14 * Math.min(1, u * 3), k: (KS + 1.1 * e) / p[2] }; }
          fr.push([Math.round(t * 100) / 100, pos]);
        }
        c.move(pinA(i), fr);
        c.op(".a-p" + i + " .arms-c", [[0, 0], [1.25, 1], [tg, 0]]);
        c.op(".a-p" + i + " .arms-u", [[0, 0], [tg, 1]]);
      }
      faces(c, "", [[0, "open", "smirk"], [.25, "happy", "smile"]]);
      c.op(".legs", [[0, 0], [1.25, 1]]);
      c.op(".a-notes", [[0, 0], [.2, 1]]);
      var notes = G("a-notes", [[128, 70], [168, 62], [206, 72], [146, 58]].map(function(q, i){ return T(q[0], q[1], G("nt nt" + i, note())); }).join(""), 1);
      return wall() + floor() + kick() + rack() + notes + mask();
    });

  /* 3. The floss lasso: a strand of floss lassos all ten and yanks them off screen (and they swing back, bundled) */
  clip("floss", "The floss lasso", "Strike!", 4.6, 3.8, "A strand of floss lassos all ten and yanks them off screen.",
    "A loop of floss twirls over the pins, drops around all ten, pulls tight and yanks them off the top of the screen; they swing back into view tied up in a bundle, dizzy.",
    function(c){
      var B = [160, 96], A1 = [340, -40], A2 = [196, -60], HANG = [196, 64];
      var LP = [[0, 330, -10, 1, 1], [.45, 168, 50, 1, 1], [.58, 165, 48, .35, 1], [.71, 162, 50, 1, 1], [.84, 161, 48, .35, 1], [.97, 160, 50, 1, 1], [1.08, 160, 50, 1, 1],
        [1.4, 160, 98, 2.8, 2.3], [1.65, 160, 96, 1.45, 1.5], [1.8, 160, 96, 1.45, 1.5]];
      var YK = [[1.8, 0, 0, 0], [1.95, 6, -10, 4], [2.1, 40, -70, 12], [2.3, 190, -240, 28]];
      /* the hang: [t, bundle offset y from the hanging spot, swing in degrees about A2] */
      var HG = [[2.9, -100, 0], [3.22, 0, 0], [3.3, 6, 0], [3.42, -3, 0], [3.52, 0, 0], [3.72, 0, 11], [3.98, 0, -8], [4.22, 0, 5.5], [4.44, 0, -3], [4.6, 0, -1.4]];
      function rot(pt, o, deg){ var a = deg * Math.PI / 180, dx = pt[0] - o[0], dy = pt[1] - o[1]; return [o[0] + dx * Math.cos(a) - dy * Math.sin(a), o[1] + dx * Math.sin(a) + dy * Math.cos(a)]; }
      var ropeFr = function(anchor, end){ var vx = end[0] - anchor[0], vy = end[1] - anchor[1]; return "transform:rotate(" + n2(Math.atan2(-vx, vy) * 180 / Math.PI) + "deg) scale(1," + n3(Math.hypot(vx, vy) / 100) + ")"; };
      var loopFr = [], rope1 = [], rope2 = [];
      LP.forEach(function(l){ loopFr.push([l[0], { x: l[1], y: l[2], k: [l[3], l[4]] }]); rope1.push([l[0], ropeFr(A1, [l[1], l[2] - 6 * l[4]])]); });
      YK.slice(1).forEach(function(y){ var cpt = rot([160, 96], B, y[3]); loopFr.push([y[0], { x: cpt[0] + y[1], y: cpt[1] + y[2], r: y[3], k: [1.45, 1.5] }, y[0] < 2.2 ? "in" : null]); rope1.push([y[0], ropeFr(A1, [cpt[0] + y[1], cpt[1] + y[2] - 9])]); });
      var hangAt = function(h, pt){ return rot([pt[0] + HANG[0] - B[0], pt[1] + HANG[1] - B[1] + h[1]], A2, h[2]); };
      HG.forEach(function(h){ var cpt = hangAt(h, [160, 96]); loopFr.push([h[0], { x: cpt[0], y: cpt[1], r: h[2], k: [1.45, 1.5] }, h[0] === 2.9 ? "in" : null]); rope2.push([h[0], ropeFr(A2, rot([HANG[0], HANG[1] + h[1] - 9], A2, h[2]))]); });
      c.move(at("a-loopb"), loopFr); c.move(at("a-loopf"), loopFr);
      c.anim(".a-rope1", rope1.concat([[2.36, rope1[rope1.length - 1][1]]]));
      c.op(".a-r1", [[0, 1], [2.36, 0]]);
      c.anim(".a-rope2", [[0, rope2[0][1]]].concat(rope2));
      c.op(".a-r2", [[0, 0], [2.9, 1]]);
      for (var i = 0; i < 10; i++){
        var p = PINS[i], sq = [160 + (p[0] - 160) * .5, p[1] - 3], fr = [[0, {}], [1.45, {}], [1.65, { x: sq[0], y: sq[1] }, "out"], [1.8, { x: sq[0], y: sq[1] }]];
        YK.slice(1).forEach(function(y){ var q = rot(sq, B, y[3]); fr.push([y[0], { x: q[0] + y[1], y: q[1] + y[2], r: y[3] }, y[0] < 2.2 ? "in" : null]); });
        HG.forEach(function(h){ var q = hangAt(h, sq); fr.push([h[0], { x: q[0], y: q[1], r: h[2] }, h[0] === 2.9 ? "in" : null]); });
        c.move(pinA(i), fr);
        pop(c, ".a-p" + i + " .f-bang", 1.5 + i * .02, 1.95);
      }
      faces(c, "", [[0, "open", "smirk"], [1.45, "wide", "open"], [2.9, "x", "open"]]);
      c.anim(".f-pu", [[0, "transform:translate(0px,0px)"], [.3, "transform:translate(0px,0px)"], [.45, "transform:translate(.4px,-1px)"]]);
      var arcB = L("M-24 0 A24 6 0 0 1 24 0", 3.2) + L("M-24 0 A24 6 0 0 1 24 0", 1.6, "#F4FBFF");
      var arcF = L("M24 0 A24 6 0 0 1 -24 0", 3.2) + L("M24 0 A24 6 0 0 1 -24 0", 1.6, "#F4FBFF");
      var rope = L("M0 0 L0 100", 3.2) + L("M0 0 L0 100", 1.6, "#F4FBFF");
      return wall() + floor() + G("a-loopb", arcB) + rack() + G("a-loopf", arcF) + kick() + mask() +
        G("a-r1", T(A1[0], A1[1], G("a-rope1", rope))) + G("a-r2", T(A2[0], A2[1], G("a-rope2", rope)), 1);
    });

  /* 4. The handpiece rocket: the ball turns out to be a handpiece with a jet flame; the pins go into orbit */
  clip("rocket", "The handpiece rocket", "Strike!", 4.8, 3.9, "The ball turns out to be a handpiece with a jet flame; the pins are flung into orbit.",
    "The mint stops, wobbles and pops into a high-speed handpiece, which lights a jet flame and blasts through the pins; the screen turns to night and the pins orbit among the Dark Matter stars.",
    function(c){
      c.move(MINT, [[0, { x: 160, y: 206, k: 2.1 }, "out"], [.9, { x: 160, y: 140, k: 1.45 }], [.97, { x: 160, y: 140, k: 1.45, r: 12 }], [1.04, { x: 160, y: 140, k: 1.45, r: -12 }],
        [1.11, { x: 160, y: 140, k: 1.45, r: 8 }], [1.18, { x: 160, y: 140, k: 1.45 }], [1.25, { x: 160, y: 140, k: 0 }]]);
      c.anim(".a-puff", [[0, "opacity:0;transform:scale(.2)"], [1.17, "opacity:0;transform:scale(.2)"], [1.22, "opacity:1;transform:scale(.8)"], [1.62, "opacity:0;transform:scale(1.5)"]]);
      c.move(at("a-hp"), [[0, { x: 160, y: 140, k: 0 }], [1.25, { x: 160, y: 140, k: 0 }], [1.36, { x: 160, y: 136, k: 1.15 }], [1.45, { x: 160, y: 138, k: 1.1 }, "in"],
        [1.85, { x: 160, y: 96, k: .55 }], [2.3, { x: 160, y: 26, k: .18 }], [2.36, { x: 160, y: 22, k: 0 }]]);
      c.op(".hp-flame", [[0, 0], [1.42, 1]]);
      c.anim(".a-boom", [[0, "opacity:0;transform:scale(0)"], [1.84, "opacity:0;transform:scale(0)"], [1.95, "opacity:1;transform:scale(1.25)"], [2.1, "opacity:1;transform:scale(1)"], [2.35, "opacity:0;transform:scale(1.1)"]]);
      c.op(".a-flash", [[0, 0], [1.85, 0], [1.88, .85], [2.15, 0]], true);
      c.op(".a-night", [[0, 0], [1.95, 0], [2.5, .92]], true);
      c.op(".a-stars", [[0, 0], [2.2, 0], [2.7, 1]], true);
      c.op(".a-ring", [[0, 0], [2.5, 0], [2.9, .7]], true);
      var O_ = [160, 64], RX = 118, RY = 28, W_ = 70;
      for (var i = 0; i < 10; i++){
        var p = PINS[i], q = [0, -20], st = pinCenter(i), phi0 = 200 + i * 36, spin0 = (i % 2 ? -1 : 1) * 170, fr = [[0, {}], [1.84, {}]];
        var orb = function(t){ var a = (phi0 + W_ * (t - 2.6)) * Math.PI / 180; return { x: O_[0] + RX * Math.cos(a), y: O_[1] + RY * Math.sin(a), ks: .56 + .14 * Math.sin(a) }; };
        for (var t = 1.98; t <= 4.8001; t += .14){
          var r = spin0 * (t - 1.84), pos;
          if (t <= 2.6){ var u = (t - 1.84) / .76, e = 1 - (1 - u) * (1 - u), end = orb(2.6); pos = { x: lerp(st[0], end.x, e), y: lerp(st[1], end.y, e) - 34 * Math.sin(Math.PI * u), r: r, k: lerp(p[2], end.ks, e) / p[2] }; }
          else { var ob = orb(t); pos = { x: ob.x, y: ob.y, r: r, k: ob.ks / p[2] }; }
          fr.push([Math.round(t * 100) / 100, pos]);
        }
        c.move(pinA(i, q), fr);
      }
      faces(c, "", [[0, "open", "smirk"], [1.4, "wide", "open"], [2.6, "x", "open"]]);
      var R = rng(7), stars = "";
      for (var s = 0; s < 34; s++) stars += circ(6 + R() * 308, 4 + R() * 150, s % 5 ? .8 : 1.3, "#FFFFFF", 0);
      [[30, 22, 5], [92, 40, 3.4], [278, 30, 5.6], [236, 128, 3.6], [52, 120, 4.4], [298, 92, 3], [140, 150, 3], [200, 16, 3.4]].forEach(function(q, i){ stars += T(q[0], q[1], G("tw", F(spark(q[2]), i % 2 ? K.dm : "#FFFFFF"))); });
      var ring = '<ellipse cx="160" cy="64" rx="118" ry="28" fill="none" stroke="' + K.dm + '" stroke-width="1.2" stroke-dasharray="3 4"/>';
      return wall() + floor() + kick() + mask() + G("a-night", F("M0 0 H320 V180 H0 Z", K.night), 1) + G("a-stars", stars, 1) + G("a-ring", ring, 1) +
        rack() + G("a-mint", mint(12)) + T(160, 140, G("a-puff", puff(1.1), 1)) + G("a-hp", handpiece()) + T(160, 94, G("a-boom", boom(), 1)) + G("a-flash", F("M0 0 H320 V180 H0 Z", "#FFFFFF"), 1);
    });

  /* 5. The clean sweep: the toothbrush by the door sweeps the pins into a dustpan */
  clip("sweep", "The clean sweep", "Strike!", 4.8, 3.9, "The toothbrush by the door sweeps the pins into a dustpan.",
    "The mint knocks all ten down; the toothbrush from Timmy's front door hops in and sweeps them into a dustpan, and the deck sparkles.",
    function(c){
      c.move(MINT, [[0, { x: 160, y: 206, k: 2.1, o: 1 }], [.85, { x: 160, y: 106, k: 1, o: 1 }], [1.25, { x: 160, y: 96, k: .8, o: 0 }]]);
      /* where each lands in the pan (its base), and how it leans in the pile */
      var FIN = [[96, 116], [104, 116], [89, 115], [100, 114], [109, 116], [93, 113], [106, 112], [88, 112], [99, 111], [111, 113]];
      var RF = [-28, 22, -48, 38, -14, 58, 10, -38, 26, -62];
      for (var i = 0; i < 10; i++){
        var p = PINS[i], dir = p[0] < 160 ? -1 : p[0] > 160 ? 1 : i === 0 ? 1 : -1, row = i === 0 ? 0 : i < 3 ? 1 : i < 6 ? 2 : 3, t0 = .85 + row * .05;
        var lx = p[0] + dir * 7, ly = p[1] - 7.4 * p[2], fr = [[0, {}], [t0, {}], [t0 + .18, { x: lx - dir, y: ly, r: dir * 98 }, "out"], [t0 + .26, { x: lx, y: ly, r: dir * 84 }], [t0 + .34, { x: lx, y: ly, r: dir * 88 }]];
        for (var j = 0; j < 5; j++){
          var a = 1.8 + .3 * j, u = (j + 1) / 5, u0 = j / 5, ex = lerp(lx, FIN[i][0], u), ey = lerp(ly, FIN[i][1], u);
          fr.push([a, { x: lerp(lx, FIN[i][0], u0), y: lerp(ly, FIN[i][1], u0), r: lerp(dir * 88, RF[i], u0), k: lerp(1, .84, u0) }],
            [a + .24, { x: ex, y: ey, r: lerp(dir * 88, RF[i], u) + (j < 4 ? (j % 2 ? 14 : -14) : 0), k: lerp(1, .84, u) }, "out"]);
        }
        c.move(pinA(i), fr);
      }
      faces(c, "", [[0, "open", "smirk"], [.82, "wide", "open"], [1.05, "x", "open"]]);
      var BR = at("a-brush"), bf = [[0, { x: 292, y: 118 }], [1.3, { x: 292, y: 118 }], [1.42, { x: 270, y: 108 }], [1.54, { x: 254, y: 118 }], [1.64, { x: 242, y: 111 }], [1.76, { x: 232, y: 118 }]];
      for (var s = 0; s < 5; s++){ var x0 = 232 - 20.8 * s; bf.push([1.8 + .3 * s, { x: x0, y: 118, r: 16 }], [2.04 + .3 * s, { x: x0 - 20.8, y: 118, r: -18 }, "out"]); }
      bf.push([3.36, { x: 128, y: 118, r: 0 }], [3.52, { x: 128, y: 109, r: 0 }], [3.66, { x: 128, y: 118 }], [3.74, { x: 128, y: 118, k: [1.12, .88] }], [3.86, { x: 128, y: 118 }]);
      c.move(BR, bf);
      var pf = [[0, { x: 220, y: 116, k: .2, o: 0 }]];
      for (var q = 0; q < 5; q++){ var bx = 232 - 20.8 * q - 10; pf.push([1.84 + .3 * q, { x: bx, y: 114, k: .25, o: 0 }], [1.88 + .3 * q, { x: bx, y: 114, k: .4, o: .95 }], [2.08 + .3 * q, { x: bx - 6, y: 110, k: .75, o: 0 }]); }
      c.move(at("a-dust"), pf);
      var SP = [[140, 104, 5], [178, 99, 4], [208, 109, 5.4], [160, 113, 3.6], [226, 101, 4.2], [128, 76, 4]];
      SP.forEach(function(q, i){ pop(c, ".a-sp" + i, 3.45 + i * .1); });
      var sparks = SP.map(function(q, i){ return T(q[0], q[1], G("a-sp" + i, G("tw", sparkle(q[2])), 1)); }).join("");
      return wall() + floor() + dustBack() + rack() + G("a-mint", mint(12)) + dustFront() + G("a-dust", puff(1)) + G("a-brush", brush()) + sparks + kick() + mask();
    });

  /* 6. The neighbor: number thirty-one watches from the gallery, faints at the noise, and is fanned with a scorecard */
  clip("neighbor", "The neighbor", "Strike!", 5.0, 4.0, "Number thirty-one watches from the gallery, faints at the noise, and is fanned with a scorecard.",
    "Number thirty-one, a nervous molar with a thermometer in his mouth, watches from a seat in the gallery; the strike goes off with a boom, he faints across the seats, and the head pin lands beside him and fans him with a scorecard.",
    function(c){
      var sh = [[0, 0, 0], [1.0, 0, 0]];
      for (var t = 1.04; t < 1.46; t += .05) sh.push([Math.round(t * 100) / 100, (Math.round(t * 100) % 2 ? 2.4 : -2.4) * (1.5 - t), (Math.round(t * 20) % 2 ? -1.6 : 1.6) * (1.5 - t)]);
      sh.push([1.5, 0, 0]);
      c.anim(".a-shake", sh.map(function(s){ return [s[0], "transform:translate(" + n2(s[1]) + "px," + n2(s[2]) + "px)"]; }));
      c.move(MINT, [[0, { x: 160, y: 206, k: 2.1, o: 1 }, "out"], [1.0, { x: 160, y: 106, k: 1, o: 1 }], [1.3, { x: 160, y: 96, k: .85, o: 0 }]]);
      var R = rng(11);
      for (var i = 1; i < 10; i++){
        var p = PINS[i], vx = (p[0] - 160) * 6 + (R() - .5) * 160, vy = -240 - R() * 120, sp = (R() > .5 ? 1 : -1) * (500 + R() * 400), fr = [[0, {}], [1.0, {}]], cc = pinCenter(i);
        [.1, .22, .36, .52, .7].forEach(function(tau){ fr.push([1.0 + tau, { x: cc[0] + vx * tau, y: cc[1] + vy * tau + 80 * tau * tau, r: sp * tau }]); });
        c.move(pinA(i, [0, -20]), fr);
      }
      c.move(pinA(0), [[0, {}], [1.0, {}], [1.12, { y: 66, r: 80 }], [1.3, { x: 150, y: -46, r: 260 }], [2.25, { x: 118, y: -60, r: 0, k: 1.25 }, "in"], [2.6, { x: 118, y: 178, k: 1.25 }],
        [2.66, { x: 118, y: 178, k: [1.45, 1.06] }], [2.8, { x: 118, y: 170, k: 1.25 }, "in"], [2.92, { x: 118, y: 178, k: 1.25 }]]);
      faces(c, ".a-p0 ", [[0, "open", "smirk"], [1.0, "x", "open"], [2.95, "wide", "open", "nobrow"]]);
      faces(c, "", [[0, "open", "smirk"], [1.0, "x", "open"]]);
      c.op(".a-p0 .arms-f", [[0, 0], [3.0, 1]]);
      c.anim(".a-boom", [[0, "opacity:0;transform:scale(0)"], [.99, "opacity:0;transform:scale(0)"], [1.1, "opacity:1;transform:scale(1.3)"], [1.25, "opacity:1;transform:scale(1)"], [1.5, "opacity:0;transform:scale(1.1)"]]);
      c.anim(".a-arcs", [[0, "opacity:0;transform:scale(.6)"], [1.02, "opacity:0;transform:scale(.6)"], [1.08, "opacity:1;transform:scale(.8)"], [1.55, "opacity:0;transform:scale(1.6)"]]);
      var A31 = { sel: ".a-31", b: [40, 170], s: .32, q: [0, 0] }, f31 = [[0, {}], [.3, { r: 5 }], [.95, { r: 7 }], [1.04, { r: 0 }]];
      for (var t2 = 1.1; t2 < 1.62; t2 += .06) f31.push([Math.round(t2 * 100) / 100, { x: 40 + (Math.round(t2 * 100) % 2 ? 1.2 : -1.2), r: (Math.round(t2 * 50) % 2 ? 2 : -2) }]);
      f31.push([1.7, {}, "in"], [2.15, { r: 84 }], [2.25, { r: 76 }], [2.36, { r: 80 }]);
      c.move(A31, f31);
      c.anim(".p31", [[0, "transform:translate(2px,7px)"], [.5, "transform:translate(4px,4px)"], [1.0, "transform:translate(8px,-2px)"]]);
      c.op(".e31o", [[0, 1], [1.05, 0]]); c.op(".e31w", [[0, 0], [1.05, 1], [1.8, 0]]); c.op(".e31c", [[0, 0], [1.8, 1]]);
      c.op(".m31", [[0, 1], [1.05, 0]]); c.op(".m31o", [[0, 0], [1.05, 1]]);
      c.anim(".a-th", [[0, "opacity:1;transform:translate(0px,0px) rotate(0deg)"], [1.07, "opacity:1;transform:translate(0px,0px) rotate(0deg)"], [1.35, "opacity:1;transform:translate(36px,-96px) rotate(-220deg)"],
        [1.62, "opacity:0;transform:translate(60px,-30px) rotate(-340deg)"]]);
      c.op(".a-dz", [[0, 0], [2.3, 0], [2.5, 1]], true);
      c.op(".a-card", [[0, 0], [3.02, 1]]);
      c.op(".a-wind", [[0, 0], [3.1, 1]]);
      var dz = T(70, 146, '<g transform="scale(1 .4)">' + G("spin", [0, 120, 240].map(function(a){ var r = a * Math.PI / 180; return T(14 * Math.cos(r), 14 * Math.sin(r), '<g transform="scale(1 2.5)">' + FO(burst(3.6, 1.6, 5, -Math.PI / 2), C.yellow, .8) + "</g>"); }).join("")) + "</g>");
      var wind = [[86, 150], [82, 158], [88, 165]].map(function(q, i){ return T(q[0], q[1], G("wind w" + i, L("M0 0 q-4 -2 -8 0 q-4 2 -8 0", 1.3, INK, .7))); }).join("");
      var card = T(102.9, 146.1, G("a-card", G("fan", scorecard()), 1));
      var him = TS(40, 170, .32, G("a-31", T(-100, -150, thirtyOne())));
      return '<g transform="translate(160 90) scale(1.03) translate(-160 -90)">' + G("a-shake", wall() + floor() + rack([1, 2, 3, 4, 5, 6, 7, 8, 9]) + G("a-mint", mint(12)) + T(160, 92, G("a-boom", boom(), 1)) + T(160, 92, G("a-arcs", arcs(), 1)) +
        kick() + mask() + seats() + him + G("a-dz", dz, 1) + rack([0]) + card + G("a-wind", wind, 1)) + "</g>";
    });

  /* 7. The turkey (three strikes in a row): a turkey in Timmy's pilgrim hat struts across and takes a bow */
  clip("turkey", "The turkey", "Turkey!", 4.8, 3.8, "Three strikes in a row: a turkey in Timmy's pilgrim hat struts across and takes a bow.",
    "Three strike marks light up on the scoreboard; a turkey wearing Timmy's pilgrim hat struts across the deck past the fallen pins, fans its tail and takes a bow in a spotlight.",
    function(c){
      [124, 149, 174].forEach(function(x, i){ pop(c, ".a-x" + i, .25 + i * .3); });
      var tk = at("a-tk"), tf = [[0, { x: 34, y: 117 }], [.9, { x: 34, y: 117 }]];
      for (var j = 1; j <= 7; j++){ var t = .9 + .3 * j, x = 34 + (160 - 34) * j / 7; tf.push([t - .15, { x: x - 9, y: 114.4 }], [t, { x: x, y: 117 }]); }
      c.move(tk, tf);
      var hf = [[0, "transform:translate(0px,0px)"]];
      for (var h = 0; h < 14; h++) hf.push([.9 + .15 * h, "transform:translate(" + (h % 2 ? "-.8" : "2.6") + "px,0px)"]);
      hf.push([3.05, "transform:translate(0px,0px)"]);
      c.anim(".tk-head", hf);
      c.op(".tk-walk", [[0, 1], [3.0, 0]]); c.op(".tk-stand", [[0, 0], [3.0, 1]]);
      var tl = function(r, s){ return "transform:translate(-8px,-24px) rotate(" + r + "deg) scale(" + s + ") translate(8px,24px)"; };
      c.anim(".tk-tail", [[0, tl(0, 1)], [3.0, tl(0, 1)], [3.25, tl(0, 1.3)], [3.35, tl(4, 1.3)], [3.45, tl(-4, 1.3)], [3.55, tl(3, 1.3)], [3.65, tl(0, 1.3)]]);
      var bw = function(r){ return "transform:translate(0px,-12px) rotate(" + r + "deg) translate(0px,12px)"; };
      c.anim(".tk-body", [[0, bw(0)], [3.7, bw(0), "io"], [4.05, bw(30)]]);
      c.op(".a-spot", [[0, 0], [3.0, 0], [3.3, 1]], true);
      var down = lying("plaque", 126, 104, .74, -1, { face: "x", mouth: "open" }) + lying("biofilm", 152, 102, .7, 1, { face: "x", mouth: "open" }) +
        lying("mutans", 178, 104, .74, -1, { face: "x", mouth: "open" }) + lying("caries", 204, 102, .7, 1, { face: "x", mouth: "open" });
      var board = [124, 149, 174].map(function(x){ return FO("M" + x + " 4 h22 v18 h-22 z", "#FFFFFF", 1.4); }).join("") +
        [124, 149, 174].map(function(x, i){ return T(x + 11, 13, G("a-x" + i, L("M-6 -6 L6 6 M6 -6 L-6 6", 2.6, C.red), 1)); }).join("");
      var spot = F("M140 30 H180 L196 118 H124 Z", C.goldLight, .28) + ell(160, 118, 26, 4.6, C.goldLight, 0, .7);
      return wall() + floor() + down + G("a-spot", spot, 1) + G("a-tk", turkey()) + kick() + mask() + board;
    });

  /* 8. The spare: one pin wobbles for a long time, then a tiny mint rolls in and taps it over */
  clip("spare", "The spare", "Spare!", 5.2, 4.6, "One pin wobbles for a long time, then a tiny mint rolls in and taps it over.",
    "One pin is left standing; it wobbles and wobbles, sweating, then steadies and smiles with relief, until a tiny mint rolls up, taps it, and it slowly tips over.",
    function(c){
      var w = [[0, 0], [.3, 7], [.6, -6], [.9, 9], [1.2, -8], [1.5, 11], [1.75, -4], [2.0, 13], [2.3, -9], [2.6, 5], [2.9, -3], [3.1, 1.5], [3.25, 0], [4.36, 0], [4.46, 5]];
      var fr = w.map(function(q){ return [q[0], { r: q[1] }, "io"]; });
      fr.push([4.86, { x: 162, y: 107, r: 92 }, "in"], [4.96, { x: 162, y: 107, r: 84 }], [5.06, { x: 162, y: 107, r: 90 }]);
      fr[fr.length - 4][2] = "in";
      c.move(pinA(0), fr);
      var pu = [[0, "transform:translate(0px,0px)"]];
      for (var k = 1; k <= 7; k++) pu.push([.4 * k, "transform:translate(" + (k % 2 ? "-1" : ".9") + "px,0px)"]);
      pu.push([3.1, "transform:translate(0px,0px)"]);
      c.anim(".f-pu", pu);
      faces(c, "", [[0, "open", "smirk", "nobrow"], [.6, "open", "open", "nobrow"], [1.9, "wide", "open"], [2.45, "open", "open", "nobrow"], [3.3, "happy", "smile"], [4.32, "wide", "open"], [4.92, "x", "open"]]);
      c.anim(".f-sw", [[0, "opacity:0;transform:translate(0px,0px)"], [1.4, "opacity:0;transform:translate(0px,0px)"], [1.5, "opacity:1;transform:translate(0px,0px)"], [2.1, "opacity:0;transform:translate(0px,6px)"],
        [2.16, "opacity:0;transform:translate(0px,0px)"], [2.3, "opacity:1;transform:translate(0px,0px)"], [2.9, "opacity:0;transform:translate(0px,6px)"]]);
      c.anim(".a-sigh", [[0, "opacity:0;transform:scale(.2)"], [3.32, "opacity:0;transform:scale(.2)"], [3.38, "opacity:1;transform:scale(.35)"], [3.8, "opacity:0;transform:scale(.6)"]]);
      c.move(MINT, [[0, { x: 134, y: 200, k: .9 }], [3.4, { x: 134, y: 200, k: .9 }], [4.3, { x: 150.6, y: 112.6, k: .36 }]]);
      pop(c, ".a-tink", 4.3, 4.55, .7);
      return wall() + floor() + rack([0]) + T(156, 102, G("a-sigh", puff(1), 1)) + G("a-mint", mint(12)) + T(155, 111, G("a-tink", sparkle(6, C.goldLight), 1)) + kick() + mask();
    });

  /* ------------------------------------------------------------------ CSS ------------------------------------------ */
  var CSS = [
    ".bw .mint-spin{animation:bwspin .55s linear infinite}@keyframes bwspin{to{transform:rotate(360deg)}}",
    ".bw .lg-a,.bw .lg-b,.bw .tk-a,.bw .tk-b{animation:bwleg .24s steps(1,end) infinite}.bw .lg-b,.bw .tk-b{animation-name:bwleg2}.bw .tk-a,.bw .tk-b{animation-duration:.3s}",
    "@keyframes bwleg{0%{opacity:1}50%{opacity:0}}@keyframes bwleg2{0%{opacity:0}50%{opacity:1}}",
    ".bw .bulb-a{animation:bwleg .5s steps(1,end) infinite}.bw .bulb-b{animation:bwleg2 .5s steps(1,end) infinite}",
    ".bw .tw{animation:bwtw 1.4s ease-in-out infinite}@keyframes bwtw{50%{opacity:.35}}",
    ".bw .flame{animation:bwflick .1s ease-in-out infinite alternate}@keyframes bwflick{to{transform:scale(.8,1.28)}}",
    ".bw .wave{animation:bwwave .28s ease-in-out infinite alternate}@keyframes bwwave{from{transform:rotate(-14deg)}to{transform:rotate(14deg)}}",
    ".bw .fan{animation:bwfan .2s ease-in-out infinite alternate}@keyframes bwfan{from{transform:rotate(-30deg)}to{transform:rotate(16deg)}}",
    ".bw .spin{animation:bwspin 1s linear infinite}",
    ".bw .wind{animation:bwwind .6s linear infinite}@keyframes bwwind{0%{opacity:0;transform:translate(6px,-3px)}40%{opacity:1}100%{opacity:0;transform:translate(-8px,4px)}}",
    ".bw .nt{animation:bwnote 1.4s linear infinite}.bw .nt1{animation-duration:1.1s}.bw .nt2{animation-duration:1.7s}.bw .nt3{animation-duration:1.3s}",
    "@keyframes bwnote{0%{opacity:0;transform:translate(0px,6px)}20%{opacity:1}100%{opacity:0;transform:translate(6px,-22px)}}",
    /* the still version: every clip frozen on its last frame */
    ".bw-still *{animation-delay:-60s!important;animation-play-state:paused!important}"
  ].join("\n");

  /* ------------------------------------------------------------------ render --------------------------------------- */
  /* one clip as an <svg>: o.still for the last frame, o.at (seconds) for any moment (it reads the clip's CSS) */
  function render(k, o){
    o = o || {};
    var c = BY[k];
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + " " + H + '" class="bw bw-' + k + (o.still ? " bw-still" : "") + '" stroke-linejoin="round" stroke-linecap="round" role="img">' + c.svg + "</svg>";
  }
  /* the CSS one clip needs (the shared rules and its own timeline), and a rule that freezes it at t seconds */
  function css(k){ return CSS + "\n" + BY[k].css; }
  function frozenAt(t){ return ".bw *{animation-delay:-" + t + "s!important;animation-play-state:paused!important}"; }

  /* the cast on its own, for the page that introduces them: a pin of each crew member, the mint, and the rest */
  var PARTS = { mint: ["-14 -14 28 28", function(){ return mint(12); }], thirtyOne: ["28 38 144 168", thirtyOne], brush: ["-12 -70 24 74", brush],
    turkey: ["-36 -64 68 70", turkey], handpiece: ["-22 -40 34 72", handpiece] };
  function wrap(vb, inner){ return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '" stroke-linejoin="round" stroke-linecap="round">' + inner + "</svg>"; }
  function part(k){ return CREW[k] ? wrap("-17 -50 34 58", pin(k)) : wrap(PARTS[k][0], PARTS[k][1]()); }

  return { VIEWBOX: [0, 0, W, H], PARTS: Object.keys(PARTS), part: part, CLIPS: CLIPS.map(function(c){ return { k: c.k, n: c.n, word: c.word, D: c.D, wordAt: c.wordAt, wordPos: c.wordPos, note: c.note, alt: c.alt }; }),
    CREW: Object.keys(CREW).map(function(k){ return { k: k, n: CREW[k].n, c: CREW[k].c }; }), render: render, css: css, frozenAt: frozenAt };
}
