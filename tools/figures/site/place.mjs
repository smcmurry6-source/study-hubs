/* Timmy's place: the house card redrawn as a scene you build (redesign phase 4, part C;
   vault/tasks/2026-11-06-redesign-timmys-place.md). Drawn in Timmy's ink (style.mjs): flat fills, one shade on the side
   away from the light (light from the top left: faces turned left are lit, faces turned right shaded), ink outlines,
   depth from overlap. No ids, gradients, filters, <text>, <style> or images, so a page can draw it many times.

   Round two (Sam, 2026-11-06: the homes didn't blend in, no flat square, free rein):
     - no plot square: each scene's ground fills the picture (a hilltop, dunes running into the sea, a forest clearing, a
       snowy ledge over the clouds, a little planet, a cloud bank); the yard is the flat middle of it, never outlined;
     - every home sits in its scene: a contact shadow, the scene's own things tucked round its base (grass, sand drifts,
       moss, snow, crystals, cloud puffs), snow on its roof where it snows, the scene's path, tree and lamp, and one color
       grade over the whole picture;
     - six themes (a scene, its homes, yard things and outfits for Timmy that belong together) and the classics;
     - what students earn meshes with the place: the rank is a statue of the journey's object by the door, in the tier's
       material, on one to three steps for the level; each hub's mastery medal is a pennant in the bunting on the home;
       Dark Matter brings its stars;
     - Timmy hops on the ground between spots (route()), drawn in the scene's depth order, never floating over things;
     - tapping things plays small easter eggs (EGGS), and each rarity has its own card art (frame()) and placing burst.

   It is a kit, not a picture: slots, not free placement, so every combination looks right and nothing overlaps.
     - a 14 x 14 yard in isometric projection (P(): x runs down to the right, y down to the left, z up), never drawn;
     - the home on the back of it (HOMES), its door always at x 5.5 on its front face, so one path serves them all;
     - five yard spots along the front (SLOTS), each 3.6 x 3.6; the bowling lane takes "side" and "corner" together;
     - fixed spots: the scene's tree and lamp, the toothbrush and the rank statue by the door, the holiday prop.
   The whole kit is one function, placeKit(INK, C): build.mjs writes its source into the files that draw it
   (tools/preview/design/place.js now; the widget's on-demand bundle when it is wired), so what a page runs is what the
   build checked.                                                                                                       */
export function placeKit(INK, C){
  "use strict";

  /* ------------------------------------------------------------------ geometry ------------------------------------- */
  var VB = [44, 0, 312, 276], CARD = [52, 4, 296, 262];
  var U = 10.5, OX = 200, OY = 84, CX = 0.8660254;
  var SW = 2, SI = 1.3;                          // ink: outer outline, inner detail
  function f(n){ return Math.round(n * 10) / 10; }
  function P(x, y, z){ return [OX + (x - y) * CX * U, OY + (x + y) * 0.5 * U - (z || 0) * U]; }
  function D(list, open){ return "M" + list.map(function(p){ var q = P(p[0], p[1], p[2]); return f(q[0]) + " " + f(q[1]); }).join(" L") + (open ? "" : " Z"); }
  function D2(list, open){ return "M" + list.map(function(q){ return f(q[0]) + " " + f(q[1]); }).join(" L") + (open ? "" : " Z"); }
  function RX(r){ return r * U * 1.2247; }      // an iso circle of radius r: its ellipse's half width
  function RY(r){ return r * U * 0.7071; }      // and half height
  function rng(seed){ var s = (seed * 9301 + 49297) % 233280 || 1; return function(){ s = (s * 9301 + 49297) % 233280; return s / 233280; }; }

  /* ------------------------------------------------------------------ ink ------------------------------------------ */
  function F(d, fill, op){ return '<path d="' + d + '" fill="' + fill + '"' + (op != null && op < 1 ? ' opacity="' + op + '"' : "") + "/>"; }
  function O(d, sw, fill){ return '<path d="' + d + '" fill="' + (fill || "none") + '" stroke="' + INK + '" stroke-width="' + (sw || SW) + '"/>'; }
  function L(d, sw, color, op){ return '<path d="' + d + '" fill="none" stroke="' + (color || INK) + '" stroke-width="' + (sw || SI) + '"' + (op != null && op < 1 ? ' opacity="' + op + '"' : "") + "/>"; }
  function FO(d, fill, sw){ return O(d, sw, fill); }
  function HI(d, w){ return '<path d="' + d + '" stroke="#fff" stroke-width="' + (w || 1.6) + '" fill="none" opacity=".6"/>'; }
  function G(cls, s, extra){ return "<g" + (cls ? ' class="' + cls + '"' : "") + (extra || "") + ">" + s + "</g>"; }
  function T(dx, dy, s){ return '<g transform="translate(' + f(dx) + " " + f(dy) + ')">' + s + "</g>"; }
  function circ(x, y, r, fill, sw){ return '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(r) + '" fill="' + fill + '"' + (sw ? ' stroke="' + INK + '" stroke-width="' + sw + '"' : "") + "/>"; }
  function ell(x, y, rx, ry, fill, sw, op){ return '<ellipse cx="' + f(x) + '" cy="' + f(y) + '" rx="' + f(rx) + '" ry="' + f(ry) + '" fill="' + fill + '"' + (sw ? ' stroke="' + INK + '" stroke-width="' + sw + '"' : "") + (op != null && op < 1 ? ' opacity="' + op + '"' : "") + "/>"; }
  function seg(a, b){ return "M" + f(a[0]) + " " + f(a[1]) + " L" + f(b[0]) + " " + f(b[1]); }
  /* shift a drawing made at the yard's origin to (x, y, z) on it (the projection is linear, so a move is a translate) */
  function at(x, y, z, s){ var a = P(x, y, z), o = P(0, 0, 0); return T(a[0] - o[0], a[1] - o[1], s); }
  /* an easter egg: something you can tap. Its hidden bits (.tp-eb) show while it plays (.tp-on, set by the page). */
  var EGGS_SEEN = [];
  function egg(k, inner, bits, extra){ if (EGGS_SEEN.indexOf(k) < 0) EGGS_SEEN.push(k); return '<g class="tp-egg" data-egg="' + k + '"' + (extra || "") + ">" + inner + (bits ? '<g class="tp-eb" opacity="0">' + bits + "</g>" : "") + "</g>"; }

  /* a box: its top, the face turned left (+y) and the face turned right (+x), each flat, then one outline */
  function box(x, y, z, w, d, h, c, o){
    o = o || {};
    var t00 = [x, y, z + h], t10 = [x + w, y, z + h], t11 = [x + w, y + d, z + h], t01 = [x, y + d, z + h], b10 = [x + w, y, z], b11 = [x + w, y + d, z], b01 = [x, y + d, z];
    var s = F(D([t00, t10, t11, t01]), c.top) + F(D([b01, b11, t11, t01]), c.left) + F(D([b10, b11, t11, t10]), c.right);
    s += O(D([t00, t10, b10, b11, b01, t01]), o.sw || SW) + L(D([t01, t11, t10], true) + D([t11, b11], true), o.si || SI);
    return s;
  }
  /* a vertical cylinder or frustum (radius r0 at z0, r1 at z1), lit on the left; top drawn unless o.open */
  function cyl(cx, cy, z0, r0, z1, r1, fill, shade, top, o){
    o = o || {};
    var b = P(cx, cy, z0), t = P(cx, cy, z1), ax = RX(r0), ay = RY(r0), bx = RX(r1), by = RY(r1), k = .36;
    var body = "M" + f(t[0] - bx) + " " + f(t[1]) + " L" + f(b[0] - ax) + " " + f(b[1]) + " A" + f(ax) + " " + f(ay) + " 0 0 0 " + f(b[0] + ax) + " " + f(b[1]) +
      " L" + f(t[0] + bx) + " " + f(t[1]) + " A" + f(bx) + " " + f(by) + " 0 0 1 " + f(t[0] - bx) + " " + f(t[1]) + " Z";
    var sh = "M" + f(t[0] + k * bx) + " " + f(t[1] + by * Math.sqrt(1 - k * k)) + " L" + f(b[0] + k * ax) + " " + f(b[1] + ay * Math.sqrt(1 - k * k)) +
      " A" + f(ax) + " " + f(ay) + " 0 0 0 " + f(b[0] + ax) + " " + f(b[1]) + " L" + f(t[0] + bx) + " " + f(t[1]) + " A" + f(bx) + " " + f(by) + " 0 0 1 " +
      f(t[0] + k * bx) + " " + f(t[1] + by * Math.sqrt(1 - k * k)) + " Z";
    var s = F(body, fill) + F(sh, shade) + O(body, o.sw || SW);
    if (!o.open) s += ell(t[0], t[1], bx, by, top || fill, o.si || SI);
    return s;
  }
  /* a cone (base radius r at z0, tip at z1), lit on the left */
  function cone(cx, cy, z0, r, z1, fill, shade, o){
    o = o || {};
    var b = P(cx, cy, z0), t = P(cx, cy, z1), ax = RX(r), ay = RY(r);
    var d = "M" + f(t[0]) + " " + f(t[1]) + " L" + f(b[0] - ax) + " " + f(b[1]) + " A" + f(ax) + " " + f(ay) + " 0 0 0 " + f(b[0] + ax) + " " + f(b[1]) + " Z";
    var k = .3, sh = "M" + f(t[0]) + " " + f(t[1]) + " L" + f(b[0] + k * ax) + " " + f(b[1] + ay * Math.sqrt(1 - k * k)) + " A" + f(ax) + " " + f(ay) + " 0 0 0 " + f(b[0] + ax) + " " + f(b[1]) + " Z";
    return F(d, fill) + F(sh, shade) + O(d, o.sw || SW) + (o.hi ? HI("M" + f(t[0] - 2) + " " + f(t[1] + 6) + " L" + f(b[0] - ax * .6) + " " + f(b[1] - 2)) : "");
  }
  /* a dome (a half ellipsoid on a rim of radius r at z0, h tall), lit on the left, with its shade crescent */
  function dome(cx, cy, z0, r, h, fill, shade, o){
    o = o || {};
    var b = P(cx, cy, z0), ax = RX(r), ay = RY(r), hy = h * U + ay * .2;
    var d = "M" + f(b[0] - ax) + " " + f(b[1]) + " A" + f(ax) + " " + f(hy) + " 0 0 1 " + f(b[0] + ax) + " " + f(b[1]) + " A" + f(ax) + " " + f(ay) + " 0 0 1 " + f(b[0] - ax) + " " + f(b[1]) + " Z";
    var sh = "M" + f(b[0] + ax * .1) + " " + f(b[1] - hy) + " A" + f(ax) + " " + f(hy) + " 0 0 1 " + f(b[0] + ax) + " " + f(b[1]) + " A" + f(ax) + " " + f(ay) + " 0 0 1 " +
      f(b[0] + ax * .1) + " " + f(b[1] + ay) + " A" + f(ax * .62) + " " + f((hy + ay) / 2) + " 0 0 0 " + f(b[0] + ax * .1) + " " + f(b[1] - hy) + " Z";
    return F(d, fill) + F(sh, shade) + O(d, o.sw || SW) + HI("M" + f(b[0] - ax * .62) + " " + f(b[1] - hy * .42) + " A" + f(ax * .8) + " " + f(hy * .8) + " 0 0 1 " + f(b[0] - ax * .18) + " " + f(b[1] - hy * .86), 2.2);
  }
  /* a lumpy disc in screen space (a canopy, a cloud, a pool of water): sy squashes it for lying on the ground */
  function lumps(cx, cy, r, seed, n, sy){
    var R = rng(seed), k = n || 9, pts = [], q = sy || .92;
    for (var i = 0; i < k; i++){ var a = i / k * Math.PI * 2 - Math.PI / 2, j = r * (.9 + R() * .14); pts.push([cx + Math.cos(a) * j, cy + Math.sin(a) * j * q]); }
    var d = "M" + f(pts[0][0]) + " " + f(pts[0][1]);
    for (i = 0; i < k; i++){
      var p = pts[i], o = pts[(i + 1) % k], mx = (p[0] + o[0]) / 2, my = (p[1] + o[1]) / 2, ox = mx - cx, oy = (my - cy) / q, l = Math.sqrt(ox * ox + oy * oy) || 1;
      d += " Q" + f(mx + ox / l * r * .26) + " " + f(my + oy / l * r * .26 * q) + " " + f(o[0]) + " " + f(o[1]);
    }
    return d + " Z";
  }
  function canopy(cx, cy, r, c, seed){
    var d = lumps(cx, cy, r, seed);
    var sh = lumps(cx + r * .22, cy + r * .2, r * .74, seed + 3, 7);
    var s = F(d, c[0]) + F(sh, c[1], .9) + O(d);
    var R = rng(seed + 11);
    for (var i = 0; i < 4; i++){ var x = cx + (R() - .6) * r * 1.1, y = cy + (R() - .5) * r * 1.0; s += L("M" + f(x) + " " + f(y) + " q2 -2 4 0", 1.1, INK, .55); }
    return s + HI("M" + f(cx - r * .6) + " " + f(cy - r * .25) + " Q" + f(cx - r * .45) + " " + f(cy - r * .7) + " " + f(cx - r * .05) + " " + f(cy - r * .78), 2);
  }
  /* a flat plane on a wall: points given as (u, v) on the wall turned left (y = Y, u = x) or right (x = X, u = y) */
  function onY(Y, list){ return list.map(function(q){ return [q[0], Y, q[1]]; }); }
  function onX(X, list){ return list.map(function(q){ return [X, q[0], q[1]]; }); }
  function rectUV(u0, u1, v0, v1){ return [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]; }
  function archUV(u0, u1, v0, v1, n){ var r = (u1 - u0) / 2, c = u0 + r, out = [[u0, v0], [u1, v0], [u1, v1 - r]]; for (var i = 1; i < (n || 8); i++){ var a = Math.PI * i / (n || 8); out.push([c + Math.cos(a) * r, v1 - r + Math.sin(a) * r * 1.0]); } out.push([u0, v1 - r]); return out; }
  /* points round a circle on the ground, from angle a0 to a1 (degrees; 0 = +x, 90 = +y, the front is -45 to 135) */
  function arcPts(cx, cy, r, a0, a1, n){ var out = []; for (var i = 0; i <= n; i++){ var a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return out; }
  /* snow on a gable's front slope, on a cone and on a dome */
  function snowSlope(e0, e1, ye, ym, ze, zr, t){
    t = t || .58;
    var y1 = ym + (ye - ym) * t, z1 = zr - (zr - ze) * t, a = P(e0 - .05, ym, zr + .06), b = P(e1 + .05, ym, zr + .06), w = (e1 - e0 + .1) / 7;
    var d = "M" + f(a[0]) + " " + f(a[1]) + " L" + f(b[0]) + " " + f(b[1]), q = P(e1 + .05, y1, z1);
    d += " L" + f(q[0]) + " " + f(q[1]);
    for (var i = 1; i <= 7; i++){ var x = e1 + .05 - w * i, e = P(x, y1, z1), m = P(x + w / 2, y1, z1); d += " Q" + f(m[0]) + " " + f(m[1] + (i % 2 ? 4.4 : 2.6)) + " " + f(e[0]) + " " + f(e[1]); }
    return FO(d + " Z", "#FFFFFF", 1.2) + L(seg(P(e0 + .4, ym + .25, zr - .08), P(e1 - .4, ym + .25, zr - .08)), 1, "#DCEAF6");
  }
  function snowCone(cx, cy, z0, r, z1){
    var zt = z0 + (z1 - z0) * .5, rt = r * .5, t = P(cx, cy, z1), b = P(cx, cy, zt), ax = RX(rt), ay = RY(rt);
    var d = "M" + f(t[0]) + " " + f(t[1]) + " L" + f(b[0] + ax) + " " + f(b[1]);
    for (var i = 1; i <= 5; i++){ var a = Math.PI * i / 5, x = b[0] + Math.cos(a) * ax, y = b[1] + Math.sin(a) * ay, am = Math.PI * (i - .5) / 5; d += " Q" + f(b[0] + Math.cos(am) * ax) + " " + f(b[1] + Math.sin(am) * ay + 3) + " " + f(x) + " " + f(y); }
    return FO(d + " Z", "#FFFFFF", 1.2);
  }
  function snowDome(cx, cy, z0, r, h, k){
    k = k || .5;
    var b = P(cx, cy, z0), ax = RX(r), ay = RY(r), hy = h * U + ay * .2, yy = b[1] - hy * k, xx = ax * Math.sqrt(1 - k * k), w = 2 * xx / 6;
    var d = "M" + f(b[0] - xx) + " " + f(yy) + " A" + f(ax) + " " + f(hy) + " 0 0 1 " + f(b[0] + xx) + " " + f(yy);
    for (var i = 1; i <= 6; i++){ var x = b[0] + xx - w * i; d += " Q" + f(x + w / 2) + " " + f(yy + (i % 2 ? 5 : 3)) + " " + f(x) + " " + f(yy + (i % 2 ? 1.2 : 0)); }
    return FO(d + " Z", "#FFFFFF", 1.2);
  }

  /* ------------------------------------------------------------------ colors --------------------------------------- */
  var K = {
    ink: INK, white: "#FFFFFF", cream: C.enamel, creamShade: C.enamelShade,
    roof: "#F7A3BA", roofShade: "#E07090", roofDark: "#C4587A",
    wood: C.wood, woodShade: C.woodShade, woodLight: "#E2B887", plank: "#D9A877",
    stone: "#D9DFE5", stoneShade: "#A9B3BE", stoneDark: "#8E98A3",
    glass: "#BFE7FA", glassDay: "#CFEFFC", lit: "#FFE08A", litHot: "#FFF3C4", glow: "#FFD86B",
    door: "#8FD3F5", doorShade: "#5FB6E0",
    gold: "#F2C94C", goldShade: "#C9971C", goldLight: "#FFF0B3",
    diamond: "#CFF1FF", diamondLine: "#7FCDEB",
    grass: C.grass, grassShade: C.grassShade, leaf: "#7CC46A", leafShade: "#4F9A52",
    soil: "#B98559", soilShade: "#8A5A3A",
    red: C.red, redShade: "#B8323A", blue: C.blue, yellow: C.yellow, green: C.green, orange: C.orange, pink: C.pink,
    mint: "#7FE3C4", mintShade: "#43B894", water: "#5DBDEB", waterShade: "#3FA7E0", waterLight: "#A9E1F7",
    dm: "#7A3CFF", dmLight: "#B57BFF", dmDeep: "#2A0F5C", dmTeal: "#7FF0D2"
  };
  /* the paint colors a home's walls (or cap, or banners) can take */
  var PAINTS = {
    cream:  { n: "Cream",  c: "#FFF7EC", s: "#E9DACB" },
    mint:   { n: "Mint",   c: "#C9F0DD", s: "#93D3B4" },
    sky:    { n: "Sky",    c: "#CFEAF8", s: "#9CCBE6" },
    butter: { n: "Butter", c: "#FFF0B3", s: "#E8CF73" },
    lilac:  { n: "Lilac",  c: "#E6DAF7", s: "#B9A6DD" },
    peach:  { n: "Peach",  c: "#FFD9C2", s: "#EDAE8C" }
  };
  /* the mushroom's cap, the castle's roofs and the lighthouse's stripes take a bolder set */
  var BOLD = {
    cream:  { n: "Classic red", c: "#E5484D", s: "#B8323A" },
    mint:   { n: "Green",       c: "#3ECF9E", s: "#239A72" },
    sky:    { n: "Blue",        c: "#3FA7E0", s: "#2378B0" },
    butter: { n: "Gold",        c: "#F2C94C", s: "#C9971C" },
    lilac:  { n: "Purple",      c: "#9B7BE0", s: "#6E50B8" },
    peach:  { n: "Orange",      c: "#F59A6E", s: "#C96A44" }
  };
  var PEN = ["", "#C47A3E", "#C9D1D9", "#E8BE45", "#F2C230"];
  var NIGHT = "#141A40";

  /* ------------------------------------------------------------------ the yard and its fixed spots ----------------- */
  var N = 14, S = 3.6;
  var SLOTS = {
    left:   { n: "By the path, left",  x: .3,   y: 10.1 },
    front:  { n: "By the path, right", x: 6.7,  y: 10.2 },
    corner: { n: "The front corner",   x: 10.3, y: 10.3 },
    side:   { n: "The side yard",      x: 10.3, y: 6.4 },
    right:  { n: "The back corner",    x: 10.2, y: .8 }
  };
  var SLOT_ORDER = ["right", "side", "left", "front", "corner"];
  var FIX = { tree: [.7, 9.1], lamp: [6.6, 13.5], holiday: [9.8, 8.8], lawn: [8.4, 9.9], statue: [3.1, 9.6], brush: [7.3, 9.3] };
  /* where nothing else grows: the home, the path, the slots and the fixed pieces */
  function busy(x, y){
    if (x > 1.2 && x < 9.8 && y > 1.2 && y < 10.4) return true;
    if (x > 4.3 && x < 6.7 && y > 8) return true;
    for (var k in SLOTS){ var sl = SLOTS[k]; if (x > sl.x - .3 && x < sl.x + S + .3 && y > sl.y - .3 && y < sl.y + S + .3) return true; }
    if (Math.abs(x - FIX.lamp[0]) < .7 && Math.abs(y - FIX.lamp[1]) < .7) return true;
    if (Math.abs(x - FIX.tree[0]) < 1.1 && Math.abs(y - FIX.tree[1]) < 1.1) return true;
    return false;
  }
  function inYard(x, y){ return x > -1.4 && y > -1.4 && x < 15.8 && y < 15.6; }
  /* the plot point under a screen point (on the ground) */
  function unP(sx, sy){ var a = (sx - OX) / (CX * U), b = (sy - OY) / (.5 * U); return [(a + b) / 2, (b - a) / 2]; }

  /* ------------------------------------------------------------------ the sky -------------------------------------- */
  function bands(cols, y0, y1){
    var s = "", h = (y1 - y0) / cols.length;
    /* the first band reaches well above the picture, so a tall crop never runs out of sky */
    cols.forEach(function(c, i){ s += '<rect x="0" y="' + f(y0 + i * h - (i ? 0 : 80)) + '" width="400" height="' + f(h + .6 + (i ? 0 : 80)) + '" fill="' + c + '"/>'; });
    return s;
  }
  function sun(x, y){
    var r = "", i; for (i = 0; i < 8; i++){ var a = i * Math.PI / 4; r += "M" + f(x + Math.cos(a) * 15) + " " + f(y + Math.sin(a) * 15) + " L" + f(x + Math.cos(a) * 19.5) + " " + f(y + Math.sin(a) * 19.5); }
    var face = G("tp-sun", L(r, 2.4, "#FFD24A") + circ(x, y, 10.5, K.yellow, 1.6) + HI("M" + f(x - 6) + " " + f(y - 2) + " a6 6 0 0 1 5 -5", 1.6));
    /* tap: it puts on its shades */
    var shades = FO("M" + f(x - 9.4) + " " + f(y - 3) + " h7.6 q0 6 -3.8 6 q-3.8 0 -3.8 -6 z M" + f(x + 1.8) + " " + f(y - 3) + " h7.6 q0 6 -3.8 6 q-3.8 0 -3.8 -6 z", "#2B2230", 1.2) +
      L("M" + f(x - 1.8) + " " + f(y - 2.4) + " h3.6", 1.4) + L("M" + f(x - 4) + " " + f(y + 5.4) + " q4 2.6 8 0", 1.4) + L("M" + f(x - 7.6) + " " + f(y - 1.6) + " l2 -1", 1, "#fff");
    return egg("sun", face + circ(x, y, 18, "#000", 0).replace("/>", ' opacity="0"/>'), shades);
  }
  function moon(x, y){
    var m = G("tp-moon", FO("M" + x + " " + (y - 12) + " A12 12 0 1 0 " + (x + 11) + " " + (y + 5) + " A9.4 9.4 0 1 1 " + x + " " + (y - 12) + " Z", "#FFF3C4", 1.6));
    /* tap: a cow jumps over it */
    var cow = T(x - 4, y - 18, FO("M-6 0 q0 -5 5 -5 h6 q4 0 4 4 v2 h-15 z", "#FFFFFF", 1.1) + F("M-2 -4.4 q2 1 1 3 q-2 0 -1 -3 z M3 -4 q2 2 0 3 z", "#3B2E3A") +
      FO("M9 -5 q3 -1 4 1.6 q.4 2 -2 2.4 h-2 z", "#FFFFFF", 1) + L("M-4 1 v3 M-1 1 v3 M4 1 v3 M7 1 v3 M-6 -2 q-3 0 -3 3", 1.1));
    return egg("moon", m + circ(x, y, 15, "#000", 0).replace("/>", ' opacity="0"/>'), cow);
  }
  function cloud(x, y, k){
    k = k || 1;
    var d = "M" + f(x - 18 * k) + " " + f(y + 5 * k) + " q-1 -9 9 -9 q3 -9 13 -7 q8 -4 13 4 q9 0 8 8 q0 4 -4 4 z";
    var rain = L("M" + f(x - 10 * k) + " " + f(y + 9) + " l-1.4 5 M" + f(x - 2 * k) + " " + f(y + 10) + " l-1.4 5 M" + f(x + 6 * k) + " " + f(y + 9) + " l-1.4 5 M" + f(x + 14 * k) + " " + f(y + 10) + " l-1.4 5", 1.6, K.blue);
    return egg("cloud", G("tp-cloud", FO(d, "#FFFFFF", 1.4)), G("tp-rain", rain));
  }
  function stars(R, n, y1, cls){
    var s = "";
    for (var i = 0; i < n; i++){
      var x = 8 + R() * 384, y = 6 + R() * (y1 - 6), r = i % 4 ? .9 : 1.5;
      s += '<circle class="' + cls + '" cx="' + f(x) + '" cy="' + f(y) + '" r="' + r + '" fill="#fff" style="animation-delay:' + f(i * .37 % 3) + 's"/>';
    }
    return s;
  }
  /* the night's stars, tappable as one: a shooting star */
  function starField(seed, n, y1){
    var shoot = L("M300 26 l26 -13", 2.2, "#FFF3C4") + circ(300, 26, 2.2, "#FFFFFF");
    return egg("stars", '<rect x="0" y="0" width="400" height="' + y1 + '" fill="#000" opacity="0"/>' + stars(rng(seed), n, y1, "tp-star"), G("tp-shoot", shoot));
  }
  /* a four-point Dark Matter star */
  function dmStar(x, y, r, fill, cls, delay){
    var d = "M" + f(x) + " " + f(y - r) + " Q" + f(x + r * .18) + " " + f(y - r * .18) + " " + f(x + r) + " " + f(y) + " Q" + f(x + r * .18) + " " + f(y + r * .18) + " " + f(x) + " " + f(y + r) +
      " Q" + f(x - r * .18) + " " + f(y + r * .18) + " " + f(x - r) + " " + f(y) + " Q" + f(x - r * .18) + " " + f(y - r * .18) + " " + f(x) + " " + f(y - r) + " Z";
    return '<path class="' + (cls || "tp-twinkle") + '" d="' + d + '" fill="' + fill + '"' + (delay != null ? ' style="animation-delay:' + f(delay) + 's"' : "") + "/>";
  }
  function pine(x, y, h, c, snow){
    var w = h * .42, s = F("M" + f(x - 1.6) + " " + f(y) + " h3.2 v-" + f(h * .2) + " h-3.2 z", K.woodShade);
    for (var i = 0; i < 3; i++){
      var top = y - h * (.38 + i * .26), bot = y - h * (.12 + i * .24), ww = w * (1 - i * .24);
      var d = "M" + f(x) + " " + f(top - h * .12) + " L" + f(x + ww) + " " + f(bot) + " Q" + f(x) + " " + f(bot + 3) + " " + f(x - ww) + " " + f(bot) + " Z";
      s += F(d, c[0]) + F("M" + f(x) + " " + f(top - h * .12) + " L" + f(x + ww) + " " + f(bot) + " Q" + f(x + ww * .4) + " " + f(bot + 1.6) + " " + f(x + 2) + " " + f(bot + 1) + " Z", c[1]) + O(d, 1.6);
      if (snow) s += F("M" + f(x) + " " + f(top - h * .12) + " L" + f(x + ww * .45) + " " + f(top + (bot - top) * .3) + " q-2 3 -4 0 q-2 3 -4 0 q-2 3 -3 0 Z", "#FFFFFF");
    }
    return s;
  }
  function flakes(R, n){ var s = ""; for (var i = 0; i < n; i++) s += '<circle class="tp-flake" cx="' + f(R() * 400) + '" cy="' + f(R() * 260) + '" r="' + (i % 3 ? 1.2 : 1.8) + '" fill="#fff" style="animation-delay:' + f(i * .41 % 4) + 's"/>'; return s; }
  function rock(x, y, w, h){ return FO("M" + (x - w) + " " + y + " L" + (x - w * .5) + " " + (y - h) + " L" + (x + w * .6) + " " + (y - h * .8) + " L" + (x + w) + " " + y + " L" + x + " " + (y + h * 1.8) + " Z", "#4A3A6E", 1.6) + F("M" + x + " " + (y + h * 1.8) + " L" + (x + w) + " " + y + " L" + (x + w * .6) + " " + (y - h * .8) + " L" + (x + w * .2) + " " + y + " Z", "#382A58"); }
  function crystal(x, y, k, c){ k = k || 1; c = c || [K.dmTeal, "#43C8A8"]; return FO("M" + f(x) + " " + f(y - 7 * k) + " l" + f(3 * k) + " " + f(5 * k) + " " + f(-3 * k) + " " + f(6 * k) + " " + f(-3 * k) + " " + f(-6 * k) + " z", c[0], 1) + F("M" + f(x) + " " + f(y - 7 * k) + " l" + f(3 * k) + " " + f(5 * k) + " " + f(-3 * k) + " " + f(6 * k) + " z", c[1]); }
  function rabbit(night){
    var c = night ? "#C9C1B4" : "#FFFFFF";
    return FO("M-4 4 q0 -8 7 -8 q6 0 6 6 q0 4 -4 4 z", c, 1.3) + FO("M1 -3 q-1 -8 1 -10 q2 2 1 10 z M4 -3 q1 -8 4 -9 q1 3 -2 10 z", c, 1.2) + circ(6, -1.4, .7, INK) + circ(-4, 2, 2, c, 1.1);
  }
  function fern(x, y, night){
    var c = night ? "#2E5546" : "#4F9A52", s = "";
    [[-14, -10], [-6, -18], [4, -20], [12, -12]].forEach(function(t){ s += L("M" + x + " " + y + " q" + (t[0] / 2) + " " + (t[1] - 4) + " " + t[0] + " " + t[1], 3, c); });
    return s;
  }
  function tuft(x, y, c, k){ k = k || 1; return F("M" + f(x - 3 * k) + " " + f(y) + " L" + f(x - 2.2 * k) + " " + f(y - 4.6 * k) + " L" + f(x - .9 * k) + " " + f(y - 1.4 * k) + " L" + f(x) + " " + f(y - 6.2 * k) + " L" + f(x + .9 * k) + " " + f(y - 1.4 * k) + " L" + f(x + 2.4 * k) + " " + f(y - 4.8 * k) + " L" + f(x + 3 * k) + " " + f(y) + " Z", c); }
  function flower(x, y, c, k){ k = k || 1; return L("M" + f(x) + " " + f(y) + " v" + f(-4 * k), 1.1, K.leafShade) + circ(x, y - 5 * k, 2 * k, c, .8) + circ(x, y - 5 * k, .7 * k, "#FFE27A"); }

  /* ------------------------------------------------------------------ the ground ----------------------------------- */
  /* Each scene's land fills the picture below its top edge, a function of x (a hill's crest, the dunes, a planet's
     rim), and above its bottom edge where it has one (a cliff, a cloud bank). */
  function arcTop(cx, top, rx, base){
    return function(x){ var d = (x - cx) / rx, a = Math.abs(d); return a >= 1 ? base + (Math.abs(x - cx) - rx) * .8 : base - (base - top) * Math.sqrt(1 - d * d); };
  }
  function trace(fn, x0, x1, step){ var pts = []; for (var x = x0; x < x1; x += step || 6) pts.push([x, fn(x)]); pts.push([x1, fn(x1)]); return pts; }
  function landD(top, bot){ var a = trace(top, 30, 370), b = bot ? trace(bot, 30, 370).reverse() : [[370, 300], [30, 300]]; return D2(a.concat(b)); }
  /* things scattered over the ground: ok(sx, sy, x, y) says where they may go */
  function scatter(seed, n, ok, draw){
    var R = rng(seed), out = [], tries = 0;
    while (out.length < n && tries < n * 30){
      tries++;
      var x = -9 + R() * 32, y = -9 + R() * 34, q = P(x, y, 0);
      if (q[0] < 48 || q[0] > 352 || q[1] < 4 || q[1] > 272 || !ok(q[0], q[1], x, y)) continue;
      out.push(draw(q[0], q[1], out.length, R, x, y));
    }
    return out;
  }

  var HILL_TOP = arcTop(200, 74, 142, 172);
  var BEACH_TOP = arcTop(198, 80, 150, 170);
  function shoreX(y){ return 384 - (y - 140) * .95 + 7 * Math.sin(y / 13); }
  var FOREST_TOP = arcTop(200, 72, 168, 156);
  var MTN_TOP = arcTop(200, 70, 172, 150);
  function cliffY(x){ var d = (x - 200) / 160; return 256 - 24 * d * d + 3.5 * Math.sin(x / 7); }
  function planetTop(x){ var d = x - 200; return 400 - Math.sqrt(Math.max(0, 326 * 326 - d * d)); }
  var CLOUD_ARC = arcTop(200, 78, 166, 160);
  function cloudTop(x){ return CLOUD_ARC(x) - 5 * Math.abs(Math.sin(x / 9)); }
  function cloudBot(x){ var d = (x - 200) / 160; return 262 - 26 * d * d + 6 * Math.abs(Math.sin(x / 11)); }

  /* the bits a scene tucks round a home's walls, so the walls meet the ground instead of standing on it */
  function skirtBit(kind, x, y, i, R, o){
    var k = .8 + R() * .5;
    if (kind === "snow") return ell(x, y + .6, 6 * k, 3 * k, "#DCEAF6", 0) + ell(x - .6, y - .4, 5.2 * k, 2.8 * k, "#FFFFFF", 0) + (i % 3 ? "" : L("M" + f(x - 5 * k) + " " + f(y + 1) + " q5 2.4 10 0", 1, "#B9CCDD"));
    if (kind === "sand") return ell(x, y + .4, 6.4 * k, 2.8 * k, o.night ? "#A08F66" : "#EBD39A", 0) + ell(x - .8, y - .2, 5 * k, 2.2 * k, o.night ? "#B9A67C" : "#F7E4B2", 0) + (i % 4 === 1 ? tuft(x + 2, y, o.night ? "#6E7A4E" : "#A8B868", .9) : "") + (i % 5 === 3 ? ell(x - 2, y, 1.6, 1.1, "#FFD9C2", .7) : "");
    if (kind === "moss") return F(lumps(x, y - .6, 4.6 * k, i + 3, 6, .55), o.night ? "#3F7550" : "#5DA45A") + (i % 3 === 0 ? fern(x, y + .4, o.night).replace(/stroke-width="3"/g, 'stroke-width="2"') : "") + (i % 4 === 2 ? L("M" + f(x + 2) + " " + f(y) + " v-3", 1.2, "#FFF7EC") + ell(x + 2, y - 3.4, 2.4, 1.4, K.red, .8) : "");
    if (kind === "space") return tuft(x, y + .4, o.night ? "#3E9A80" : "#4FB394", k) + (i % 3 === 1 ? crystal(x + 2, y + 1, .7) : "");
    if (kind === "cloud") return circ(x, y - 1, 4.6 * k, "#FFFFFF", 0) + circ(x + 4 * k, y + .2, 3.6 * k, "#F1EEFA", 0) + L("M" + f(x - 4.4 * k) + " " + f(y + .6) + " q4.4 2.6 9 0", 1, "#C9C1E6");
    /* grass, with a flower now and then */
    return tuft(x, y + .6, o.night ? "#3D7449" : "#5DA45A", k) + tuft(x + 2.6, y + 1, o.night ? "#4A8457" : "#6CB060", k * .8) + (i % 4 === 2 ? flower(x + 1, y + .8, ["#FF8FB1", "#FFE27A", "#B08CFF"][i % 3], .8) : "");
  }

  var SCENES = {
    hill: {
      n: "The hill", note: "Free: the hilltop where every Timmy starts", rarity: "", theme: "hilltop", price: 0, id: "",
      top: HILL_TOP, skirt: "grass", path: "stones", treeKind: "round", lamp: "post", grade: ["#FFE7B0", .05],
      chip: function(o){ return o.night ? ["#5E9E6A", "#3F7550"] : [K.grass, K.grassShade]; },
      sky: function(o){ return o.night ? bands(["#141E46", "#1B2858", "#24346A", "#2E4178"], 0, 300) + moon(330, 44) + starField(5, 30, 150)
        : bands(["#BFE5FA", "#CBEAF9", "#D8F0FB", "#E5F5FC"], 0, 300) + sun(78, 40) + cloud(306, 34) + cloud(156, 22, .7); },
      far: function(o){
        var c1 = o.snow ? "#EEF5FB" : o.night ? "#3D6B5A" : "#C4E6B2", c2 = o.snow ? "#DCEAF6" : o.night ? "#335C4C" : "#AFD99B";
        var s = F("M0 162 Q50 124 120 140 Q200 106 280 134 Q330 110 400 136 V300 H0 Z", c1) + L("M0 162 Q50 124 120 140 Q200 106 280 134 Q330 110 400 136", 1.4, INK, .5);
        /* number thirty-one's place, right behind Timmy's, small and pale on the next hill over. Tap: he takes his temperature */
        var fr = o.snow ? "#EAF1F8" : o.night ? "#8E7A93" : "#F9C9D6", fw = o.night ? "#A8A3A0" : "#FFFDF8", fs = o.night ? "#8C8784" : "#EFE6DA";
        var house = '<g opacity="' + (o.night ? ".8" : ".88") + '">' + T(338, 120, '<g transform="scale(.62)">' + T(-OX, -OY,
          box(0, 0, 0, 1.6, 1.4, 1.3, { top: fr, left: fw, right: fs }, { sw: 1.6, si: 1.1 }) +
          FO(D([[-.15, 1.55, 1.25], [1.75, 1.55, 1.25], [1.75, .7, 2.3], [-.15, .7, 2.3]]), fr, 1.6) +
          FO(D([[1.75, -.15, 1.25], [1.75, 1.55, 1.25], [1.75, .7, 2.3]]), fs, 1.6) +
          F(D(onY(1.4, rectUV(.55, 1.0, .35, .8))), o.night ? K.lit : "#CFEFFC")) + "</g>") + "</g>";
        var w = P(.78, 1.4, .58), wx = 338 - OX + (w[0] - OX) * .62, wy = 120 - OY + (w[1] - OY) * .62;
        var therm = T(OX + wx, OY + wy, F("M-1.6 -1.4 h3.2 v2.8 h-3.2 z", K.lit) + L("M0 0 l7 -5", 2.6) + L("M0 0 l7 -5", 1.2, "#FFFFFF") + circ(7.4, -5.3, 1.8, K.red, .8));
        s += egg("neighbor", house + circ(338, 112, 14, "#000", 0).replace("/>", ' opacity="0"/>'), therm);
        s += F("M0 190 Q70 168 140 180 Q230 166 300 184 Q360 172 400 182 V300 H0 Z", c2);
        return s;
      },
      land: function(o){
        var g = o.snow ? ["#F7FBFF", "#E8F0F8", "#D6E4F1", "#BCD2E6"] : o.night ? ["#5E9E6A", "#528F5E", "#467E52", "#3A6C46"] : ["#A9DD94", "#97D383", "#82C472", "#64A85C"];
        var s = F(landD(HILL_TOP), g[0]);
        /* past the yard the hill falls away: the slope on the light's side a little darker, the far slope darker still */
        s += F("M30 " + f(HILL_TOP(30)) + " L30 300 L200 300 L200 266 C150 262 96 240 62 208 C48 194 38 178 30 " + f(HILL_TOP(30)) + " Z", g[1], .7);
        s += F("M370 " + f(HILL_TOP(370)) + " L370 300 L200 300 L200 266 C256 262 318 236 346 204 C358 190 366 178 370 " + f(HILL_TOP(370)) + " Z", g[2]);
        s += L(D2(trace(HILL_TOP, 30, 370), true), SW);
        s += F("M30 266 Q112 246 200 262 Q290 276 370 252 V300 H30 Z", g[2]) + L("M30 266 Q112 246 200 262 Q290 276 370 252", 1.4, g[3]);
        s += L("M70 226 Q100 216 128 222 M270 248 Q298 238 328 242 M52 200 Q66 194 80 196", 1.3, g[3], .7);
        /* the rabbit down the hill, by its burrow. Tap: down it goes, and back up */
        if (!o.snow) s += egg("rabbit", T(318, 252, ell(0, 6, 12, 4.4, o.night ? "#24402E" : "#3B2E3A", 0, .85) + G("tp-eo", rabbit(o.night)) + circ(0, 0, 13, "#000", 0).replace("/>", ' opacity="0"/>')));
        return s;
      },
      flat: function(o){
        var tc = o.snow ? "" : o.night ? "#3D7449" : "#64A85C", s = "";
        var on = function(sx, sy, x, y){ return sy > HILL_TOP(sx) + 5 && !busy(x, y); };
        if (tc) s += scatter(90, 40, on, function(sx, sy){ return tuft(sx, sy, tc, .8); }).join("");
        if (!o.snow) s += scatter(91, o.spring ? 22 : 12, on, function(sx, sy, i){ return circ(sx, sy, 1.9, o.night ? "#9C8FB0" : ["#FF8FB1", "#FFE27A", "#B08CFF", "#FFFFFF"][i % 4], .7); }).join("");
        return s;
      },
      props: function(o){
        var night = o.night;
        return scatter(92, 7, function(sx, sy, x, y){ return sy > HILL_TOP(sx) + 8 && !inYard(x, y) && !busy(x, y); }, function(sx, sy, i, R, x, y){
          var s = i % 3 === 0 ? FO(D2([[sx - 6, sy], [sx - 4, sy - 4], [sx + 2, sy - 5], [sx + 6, sy]]), night ? "#8E98A3" : "#C9C1B4", 1.3)
            : canopy(sx, sy - 7, 8 + R() * 3, o.snow ? ["#F7FBFF", "#DCEAF6"] : night ? ["#3F7550", "#336244"] : o.fall ? ["#E8A33D", "#C2410C"] : ["#7CC46A", "#4F9A52"], 40 + i);
          return { x: x, y: y, s: s };
        });
      },
      fg: function(){ return ""; }
    },
    beach: {
      n: "The beach", note: "Dunes, a palm and the sea lapping in", rarity: "Rare", theme: "seaside", price: 1000, id: "beach",
      top: BEACH_TOP, wet: true, skirt: "sand", path: "boards", treeKind: "palm", lamp: "tiki", grade: ["#FFD28A", .07],
      chip: function(o){ return o.night ? ["#B9A67C", "#86774F"] : ["#F7E4B2", "#D6B676"]; },
      sky: function(o){ return o.night ? bands(["#16204A", "#1E2C5C", "#283B70", "#33497F"], 0, 300) + moon(84, 40) + starField(9, 28, 116)
        : bands(["#BDE6FA", "#CDEDFB", "#DDF3FC", "#ECF8FD"], 0, 300) + sun(318, 38) + cloud(118, 30) + G("tp-gull", L("M240 52 q4 -4 8 0 q4 -4 8 0 M268 70 q3 -3 6 0 q3 -3 6 0", 1.4)); },
      far: function(o){
        var w = o.night ? ["#28507A", "#22466C", "#1D3D5F"] : ["#8FD3F2", "#7FCDEB", "#6FC3EA"];
        var s = bands(w, 116, 300) + L("M0 116 H400", 1.6);
        s += G("tp-wave", L("M20 132 q8 -4 16 0 M340 128 q8 -4 16 0 M362 150 q8 -4 16 0", 1.4, "#fff", .8));
        /* a far island with a palm, on the left */
        s += FO("M28 117 Q46 104 64 117 Z", o.night ? "#7C6A48" : "#F3DDA8", 1.4) + L("M48 108 q1 -10 -2 -16", 1.6) +
          L("M46 92 q-8 -2 -12 4 M46 92 q8 -3 12 3 M46 92 q-2 -7 -8 -9 M46 92 q4 -7 10 -6", 1.6, o.night ? "#3D6B5A" : "#4F9A52");
        return s;
      },
      land: function(o){
        var sand = o.night ? ["#B9A67C", "#A08F66", "#86774F"] : ["#F7E4B2", "#ECD49C", "#D6B676"];
        var s = F(landD(BEACH_TOP), sand[0]);
        s += F("M30 " + f(BEACH_TOP(30)) + " L30 300 L170 300 C130 272 82 244 52 210 Z", sand[1], .8);
        s += L(D2(trace(BEACH_TOP, 30, 370), true), SW);
        /* beach grass along the dune tops */
        trace(BEACH_TOP, 54, 346, 15).forEach(function(q, i){ if (q[0] > 120 && q[0] < 300) return; s += tuft(q[0], q[1] + 5, o.night ? "#6E7A4E" : "#A8B868", 1.2 + (i % 3) * .2); });
        /* the sea comes in at the front: wet sand, then foam, then the water */
        var sh = []; for (var y = 128; y <= 300; y += 5) sh.push([shoreX(y), y]);
        s += F(D2(sh.map(function(q){ return [q[0] - 10, q[1]]; }).concat([[400, 300], [400, 128]])), sand[2], .6);
        var w = o.night ? ["#2C5A86", "#22466C", "#4A7BA8"] : ["#8FD3F2", "#6FC3EA", "#BDE6F7"];
        s += F(D2(sh.concat([[400, 300], [400, 128]])), w[0]);
        s += F(D2(sh.map(function(q){ return [q[0] + 18, q[1]]; }).concat([[400, 300], [400, 128]])), w[1]);
        s += G("tp-foam", L(D2(sh, true), 3.2, "#FFFFFF", .95));
        s += L(D2(sh.map(function(q){ return [q[0] + 1.6, q[1]]; }), true), 1.2, INK, .6);
        s += G("tp-wave", L("M304 214 q6 -3 12 0 M334 238 q6 -3 12 0 M318 266 q6 -3 12 0 M352 196 q6 -3 12 0", 1.4, "#FFFFFF", .85));
        /* a whale out there (tap: it spouts) */
        var wh = FO("M322 252 q12 -10 26 -2 q-6 6 -14 6 q-8 0 -12 -4 z", o.night ? "#2C3E66" : "#3C5A8A", 1.4) + L("M318 252 q-3 -4 -6 -2 M318 252 q-2 4 -5 4", 1.6) +
          L("M336 240 q-2 -8 -6 -12 M336 240 q0 -9 0 -14 M336 240 q2 -8 6 -12", 1.8, "#FFFFFF");
        s += egg("whale", '<rect x="300" y="230" width="56" height="32" fill="#000" opacity="0"/>' + G("tp-wave", L("M314 256 q6 -3 12 0 M332 258 q6 -3 12 0", 1.4, "#FFFFFF", .8)), wh);
        return s;
      },
      flat: function(o){
        var on = function(sx, sy, x, y){ return sy > BEACH_TOP(sx) + 6 && sx < shoreX(sy) - 14 && !busy(x, y); };
        var s = scatter(93, 22, on, function(sx, sy){ return L("M" + f(sx - 4) + " " + f(sy) + " q2 -1.4 4 0 q2 1.4 4 0", 1.1, o.night ? "#86774F" : "#D6B676"); }).join("");
        s += scatter(94, 7, on, function(sx, sy, i){ return i % 3 === 2 ? F("M" + f(sx) + " " + f(sy - 4) + " l1.2 2.8 3 .2 -2.3 1.9 .8 2.9 -2.7 -1.6 -2.7 1.6 .8 -2.9 -2.3 -1.9 3 -.2 z", "#F59A6E") : ell(sx, sy, 2, 1.4, ["#FFD9C2", "#FFFFFF"][i % 2], .7); }).join("");
        /* a crab on the sand (tap: off it scuttles) */
        var cb = G("tp-eo", ell(0, 0, 4.6, 3, K.red, 1.2) + L("M-4 1 l-3 2 M-4 -1 l-3 -1 M4 1 l3 2 M4 -1 l3 -1", 1.1) + FO("M-5 -3 q-3 -4 0 -5 q1 2 1 3 z M5 -3 q3 -4 0 -5 q-1 2 -1 3 z", K.red, .9) + circ(-1.4, -3, .8, INK) + circ(1.4, -3, .8, INK));
        s += egg("crab", T(258, 248, cb + circ(0, 0, 10, "#000", 0).replace("/>", ' opacity="0"/>')));
        return s;
      },
      props: function(o){
        return scatter(95, 4, function(sx, sy, x, y){ return sy > BEACH_TOP(sx) + 10 && sx < shoreX(sy) - 22 && !inYard(x, y) && !busy(x, y); }, function(sx, sy, i, R, x, y){
          var s = i === 1 ? circ(sx, sy - 5, 5, "#FFFFFF", 1.3) + F("M" + f(sx - 5) + " " + f(sy - 5) + " a5 5 0 0 1 5 -5 v5 z", K.red) + F("M" + f(sx) + " " + f(sy - 10) + " a5 5 0 0 1 5 5 h-5 z", K.blue) + O("M" + f(sx - 5) + " " + f(sy - 5) + " a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0", 1.3)
            : tuft(sx, sy, o.night ? "#6E7A4E" : "#A8B868", 1.4) + tuft(sx + 4, sy + 1, o.night ? "#5C6840" : "#8EA050", 1.1);
          return { x: x, y: y, s: s };
        });
      },
      fg: function(){ return ""; }
    },
    forest: {
      n: "The forest", note: "A clearing among the pines", rarity: "Rare", theme: "woodland", price: 800, id: "forest",
      top: FOREST_TOP, skirt: "moss", path: "dirt", treeKind: "pine", lamp: "lantern", grade: ["#1F6B4A", .06],
      chip: function(o){ return o.night ? ["#5A9465", "#3F7550"] : ["#93CF7F", "#5DA45A"]; },
      sky: function(o){ return o.night ? bands(["#121C3E", "#18264E", "#20325E", "#283D6C"], 0, 300) + moon(86, 40) + starField(13, 26, 110)
        : bands(["#CBE8E6", "#D6EEEA", "#E1F3EE", "#ECF8F2"], 0, 300) + sun(330, 40) + cloud(170, 30, .8); },
      far: function(o){
        var c1 = o.snow ? ["#DDE9F2", "#C9D9E6"] : o.night ? ["#264B44", "#1D3D37"] : ["#86C29A", "#6AAE83"], c2 = o.night ? ["#2F5A4A", "#244A3D"] : ["#5FA779", "#4A9164"];
        var s = "", R = rng(21), x;
        for (x = 30; x < 380; x += 16 + R() * 8) s += pine(x, FOREST_TOP(x) - 10 - R() * 8, 50 + R() * 22, c1, o.snow);
        for (x = 26; x < 380; x += 22 + R() * 10) s += pine(x, FOREST_TOP(x) + 8, 64 + R() * 24, c2, o.snow);
        /* an owl in the pines (tap: it looks round) */
        var ox = 344, oy = FOREST_TOP(344) - 26;
        var owl = FO("M" + (ox - 6) + " " + (oy + 8) + " q-1 -12 6 -13 q7 1 6 13 q-6 3 -12 0 z", o.night ? "#8A6A4E" : "#A9825A", 1.3) +
          G("tp-owlhead", FO("M" + (ox - 6.4) + " " + (oy - 3) + " q6 -6 12.8 0 q0 6 -6.4 6 q-6.4 0 -6.4 -6 z", o.night ? "#9C7C5E" : "#B99068", 1.2) + circ(ox - 2.6, oy - 2, 2.2, "#FFF3C4", .8) + circ(ox + 2.6, oy - 2, 2.2, "#FFF3C4", .8) + circ(ox - 2.6, oy - 2, .9, INK) + circ(ox + 2.6, oy - 2, .9, INK) + F("M" + ox + " " + (oy - .4) + " l-1 1.8 h2 z", K.orange) +
            G("tp-eb", F("M" + (ox - 4.8) + " " + (oy - 4.2) + " h4.4 v2.4 h-4.4 z M" + (ox + .4) + " " + (oy - 4.2) + " h4.4 v2.4 h-4.4 z", o.night ? "#9C7C5E" : "#B99068"), ' opacity="0"'));
        s += egg("owl", L("M" + (ox - 12) + " " + (oy + 8) + " h24", 2.4, K.woodShade) + owl + circ(ox, oy, 12, "#000", 0).replace("/>", ' opacity="0"/>'));
        return s;
      },
      land: function(o){
        var g = o.snow ? ["#F7FBFF", "#E6EEF6", "#D3E2EF"] : o.night ? ["#5A9465", "#4C845A", "#3F7550"] : ["#9AD487", "#88C776", "#74B466"];
        var s = F(landD(FOREST_TOP), g[0]) + L(D2(trace(FOREST_TOP, 30, 370), true), SW);
        s += F("M30 " + f(FOREST_TOP(30)) + " L30 300 L180 300 C140 272 90 248 56 214 Z", g[1], .8) + F("M370 " + f(FOREST_TOP(370)) + " L370 300 L230 300 C270 274 320 248 350 214 Z", g[2], .9);
        /* dappled shade under the pines */
        [[96, 150, 30, 9], [300, 178, 34, 10], [240, 250, 40, 10], [120, 236, 30, 8]].forEach(function(q){ s += ell(q[0], q[1], q[2], q[3], o.snow ? "#B9CCDD" : o.night ? "#2F5A40" : "#5E9E58", 0, .22); });
        return s;
      },
      flat: function(o){
        var on = function(sx, sy, x, y){ return sy > FOREST_TOP(sx) + 5 && !busy(x, y); }, s = "";
        if (!o.snow) s += scatter(96, 30, on, function(sx, sy, i){ return ell(sx, sy, 2.2, 1.1, o.night ? "#6B5A3A" : ["#C2913E", "#B5652B", "#8A6A3A", "#D9A24A"][i % 4], 0); }).join("");
        s += scatter(97, 24, on, function(sx, sy){ return tuft(sx, sy, o.snow ? "#C9D9E6" : o.night ? "#2F5A40" : "#4F9A52", .8); }).join("");
        return s;
      },
      props: function(o){
        return scatter(98, 8, function(sx, sy, x, y){ return sy > FOREST_TOP(sx) + 8 && !inYard(x, y) && !busy(x, y); }, function(sx, sy, i, R, x, y){
          var s;
          if (i % 4 === 0) s = FO("M" + f(sx - 12) + " " + f(sy) + " q0 -6 4 -6 h16 q4 0 4 6 z", K.wood, 1.4) + ell(sx + 12, sy - 3, 3, 3.2, K.woodLight, 1.2) + F("M" + f(sx - 8) + " " + f(sy - 5) + " q8 -3 14 0", o.night ? "#3F7550" : "#5DA45A");
          else if (i % 4 === 1) s = [0, 5, -4].map(function(dx, j){ return L("M" + f(sx + dx) + " " + f(sy) + " v" + (-4 - j), 1.6, "#FFF7EC") + ell(sx + dx, sy - 5 - j, 3.4 - j * .4, 2, K.red, 1) + circ(sx + dx - 1, sy - 5.6 - j, .6, "#FFFFFF"); }).join("");
          else s = fern(sx, sy, o.night);
          return { x: x, y: y, s: s };
        });
      },
      fg: function(o){
        var c = o.night ? ["#2F5A4A", "#244A3D"] : ["#4A9164", "#357A50"], s = "";
        if (!o.night) s += F("M58 0 L96 0 L198 240 L150 240 Z", "#FFF8D6", .16) + F("M150 0 L174 0 L264 214 L228 214 Z", "#FFF8D6", .12);
        return s + pine(50, 300, 110, c, o.snow) + pine(352, 304, 118, c, o.snow) + fern(72, 280, o.night) + fern(330, 282, o.night);
      }
    },
    mountain: {
      n: "The snowy mountain", note: "A ledge above the clouds, snow all year", rarity: "Epic", theme: "snowy", price: 1800, id: "snowy-mountain",
      top: MTN_TOP, bot: cliffY, snowy: true, skirt: "snow", path: "snow", treeKind: "pine", lamp: "iron", grade: ["#9CC3E6", .07],
      chip: function(o){ return o.night ? ["#C9D6EA", "#7F8A97"] : ["#F7FBFF", "#97A3B1"]; },
      sky: function(o){ return o.night ? bands(["#121A40", "#1A2552", "#233265", "#2D3F76"], 0, 300) + moon(328, 40) + starField(17, 34, 120)
        : bands(["#C9E0F4", "#D6E8F7", "#E2EFF9", "#EEF5FB"], 0, 300) + sun(84, 40) + cloud(286, 30, .9); },
      far: function(o){
        var r = o.night ? ["#4B5A7E", "#3D4B6C"] : ["#AFC2D8", "#93A9C4"], sn = o.night ? "#C9D6EA" : "#FFFFFF";
        var s = FO("M-10 170 L60 76 L120 148 L170 100 L230 170 Z", r[0], 1.6) + F("M60 76 L80 104 L70 102 L62 112 L52 100 L44 106 Z", sn) + F("M170 100 L188 126 L176 122 L168 130 L158 120 Z", sn);
        s += FO("M200 176 L300 64 L360 130 L380 108 L420 156 V176 Z", r[1], 1.6) + F("M300 64 L322 92 L310 88 L300 100 L290 88 L280 94 Z", sn) + F("M380 108 L392 122 L384 120 L376 126 Z", sn);
        return s;
      },
      land: function(o){
        var g = o.night ? ["#C9D6EA", "#B4C3DC", "#9FB0CC"] : ["#F7FBFF", "#E6EFF8", "#D3E2EF"], r = o.night ? ["#5A6585", "#47506E", "#39405A"] : ["#B7C2CE", "#97A3B1", "#7F8A97"];
        /* the rock face under the ledge, then the snow on top, then the clouds below */
        var face = D2(trace(cliffY, 30, 370).concat([[370, 300], [30, 300]]));
        var s = F(face, r[0]) + F(D2(trace(cliffY, 200, 370).concat([[370, 300], [200, 300]])), r[1]);
        s += L("M70 260 L90 280 M150 268 L170 290 M250 266 L236 288 M320 252 L340 274", 1.4, r[2]);
        s += F(landD(MTN_TOP, cliffY), g[0]) + F("M370 " + f(MTN_TOP(370)) + " L370 " + f(cliffY(370)) + " L240 " + f(cliffY(240)) + " C280 230 330 200 352 176 Z", g[1], .8);
        s += O(landD(MTN_TOP, cliffY));
        /* snow dripping over the edge */
        trace(cliffY, 40, 360, 22).forEach(function(q, i){ s += F("M" + f(q[0] - 7) + " " + f(q[1] - .5) + " q7 " + (6 + (i % 3) * 3) + " 14 0 z", g[0]); });
        /* the cloud bank below */
        var R = rng(29); for (var x = 20; x < 390; x += 22){ var y = 288 + R() * 8, rr = 14 + R() * 8; s += circ(x, y, rr, o.night ? "#9FB0CC" : "#FFFFFF", 1.3) + circ(x + 4, y + 3, rr * .7, o.night ? "#8D9EBB" : "#EEF3FA", 0); }
        /* a big rock with something behind it (tap: a yeti peeks out and waves) */
        var yeti = FO("M310 214 q0 -16 12 -16 q12 0 12 16 z", "#FFFFFF", 1.4) + F("M314 206 q8 -5 16 0 q-2 6 -8 6 q-6 0 -8 -6 z", "#A9C6E0") + circ(319, 205, 1.2, INK) + circ(325, 205, 1.2, INK) + L("M319 209 q3 2 6 0", 1.1) +
          FO("M334 210 q6 -8 8 -12 q2 3 -2 9 z", "#FFFFFF", 1.2);
        s += egg("yeti", FO("M300 224 L306 206 L322 200 L340 208 L346 224 Z", r[0], 1.6) + F("M306 206 L322 200 L340 208 L330 210 L318 205 L308 210 Z", g[0]) + F("M322 224 L340 208 L346 224 Z", r[1]), yeti);
        return s;
      },
      flat: function(o){
        var on = function(sx, sy, x, y){ return sy > MTN_TOP(sx) + 5 && sy < cliffY(sx) - 6 && !busy(x, y); };
        return scatter(99, 12, on, function(sx, sy, i){ return ell(sx, sy, 7, 2.4, o.night ? "#AFC0DA" : "#E1ECF6", 0) + (i % 3 ? "" : circ(sx + 2, sy - 1, 1, "#FFFFFF")); }).join("");
      },
      props: function(o){
        return scatter(100, 6, function(sx, sy, x, y){ return sy > MTN_TOP(sx) + 10 && sy < cliffY(sx) - 12 && !inYard(x, y) && !busy(x, y) && !(sx > 292 && sx < 352 && sy > 190); }, function(sx, sy, i, R, x, y){
          var r = o.night ? ["#5A6585", "#47506E"] : ["#B7C2CE", "#97A3B1"];
          var s = i % 2 ? pine(sx, sy + 1, 30 + R() * 10, o.night ? ["#2F5A4A", "#244A3D"] : ["#4A9164", "#357A50"], true)
            : FO("M" + f(sx - 8) + " " + f(sy) + " L" + f(sx - 5) + " " + f(sy - 7) + " L" + f(sx + 3) + " " + f(sy - 9) + " L" + f(sx + 8) + " " + f(sy) + " Z", r[0], 1.4) + F("M" + f(sx - 5) + " " + f(sy - 7) + " L" + f(sx + 3) + " " + f(sy - 9) + " L" + f(sx + 6) + " " + f(sy - 5) + " L" + f(sx) + " " + f(sy - 6) + " Z", "#FFFFFF");
          return { x: x, y: y, s: s };
        });
      },
      fg: function(){ return G("tp-snowfall", flakes(rng(31), 16)); }
    },
    space: {
      n: "The night sky", note: "A little planet under the Dark Matter stars", rarity: "Epic", theme: "starlight", price: 2500, id: "night-sky", alwaysNight: true,
      top: planetTop, skirt: "space", path: "crystal", treeKind: "crystal", lamp: "crystal", grade: ["#5B2BC0", .08],
      chip: function(){ return ["#7CCBA4", "#4A9A74"]; },
      sky: function(o){
        var s = bands(["#0E0726", "#140B33", "#1D0F45", "#2A1458", "#341B66"], 0, 300);
        s += F("M-10 120 Q80 70 170 104 Q260 136 410 70 V120 Q300 168 190 140 Q90 116 -10 160 Z", "#5B2BC0", .22) + F("M-10 136 Q100 96 200 124 Q300 150 410 104 V118 Q300 160 200 140 Q100 116 -10 150 Z", K.dmTeal, .12);
        s += starField(41, 46, 120);
        [[40, 40, 6], [120, 22, 4], [250, 34, 5], [352, 60, 7], [300, 100, 4], [70, 110, 5], [160, 66, 3.6]].forEach(function(p, i){ s += dmStar(p[0], p[1], p[2], i % 3 ? K.dmLight : K.dmTeal, "tp-twinkle", i * .4); });
        s += G("tp-planet", ell(330, 30, 26, 6, "none", 0) + FO("M308 30 A22 22 0 0 1 352 30", "#E07090", 1.6) + circ(330, 30, 15, "#F7A3BA", 1.6) + F("M336 18 a15 15 0 0 1 0 25 a12 15 0 0 0 0 -25 z", "#E07090") +
          L("M304 32 Q330 44 356 32", 2.2, "#FFE9A8") + L("M304 32 Q330 44 356 32", 1, INK));
        s += moon(90, 80);
        return s;
      },
      far: function(){ return G("tp-float", rock(64, 132, 12, 5) + rock(338, 120, 10, 4.4)); },
      land: function(o){
        var g = ["#86D4AC", "#72C29A", "#5EAE88", "#4A9A74"];
        var s = F(landD(planetTop), g[0]);
        /* the planet curves away: a darker band along its rim, its thin air glowing */
        var rim = trace(planetTop, 30, 370), inner = trace(function(x){ var d = x - 200; return 400 - Math.sqrt(Math.max(0, 312 * 312 - d * d)) + 6; }, 30, 370).reverse();
        s += F(D2(rim.concat(inner)), g[2], .7);
        s += F("M30 " + f(planetTop(30)) + " L30 300 L170 300 C120 270 70 236 40 190 Z", g[1], .7) + F("M370 " + f(planetTop(370)) + " L370 300 L230 300 C280 270 330 236 360 190 Z", g[2], .8);
        s += L(D2(rim, true), 9, K.dmTeal, .22) + L(D2(rim, true), SW);
        /* a crater with a friend in it (tap: it pops up and waves) */
        var alien = FO("M300 238 q0 -12 8 -12 q8 0 8 12 z", "#9BE36A", 1.3) + circ(304.6, 231, 1.6, "#FFFFFF", .8) + circ(311.4, 231, 1.6, "#FFFFFF", .8) + circ(304.8, 231.3, .7, INK) + circ(311.6, 231.3, .7, INK) +
          L("M304 226 l-3 -6 M312 226 l3 -6", 1.2) + circ(301, 219.6, 1.4, "#FFE27A", .8) + circ(315, 219.6, 1.4, "#FFE27A", .8) + FO("M316 232 q6 -4 7 -9 q2 2 -1 7 z", "#9BE36A", 1);
        s += egg("alien", ell(308, 240, 16, 5.4, g[3], 1.4) + ell(308, 241, 12, 3.6, "#3B7A5E", 0), alien);
        return s;
      },
      flat: function(o){
        var on = function(sx, sy, x, y){ return sy > planetTop(sx) + 8 && !busy(x, y); };
        var s = scatter(101, 7, on, function(sx, sy, i){ var r = 5 + (i % 3) * 2; return ell(sx, sy, r, r * .42, "#5EAE88", 1.1) + ell(sx + .6, sy + .4, r * .7, r * .26, "#4A9A74", 0); }).join("");
        s += scatter(102, 16, on, function(sx, sy, i){ return circ(sx, sy, 1.2, i % 2 ? K.dmTeal : "#FFE9A8").replace("/>", ' class="tp-twinkle" style="animation-delay:' + f(i * .3 % 2.6) + 's"/>'); }).join("");
        return s;
      },
      props: function(o){
        return scatter(103, 6, function(sx, sy, x, y){ return sy > planetTop(sx) + 12 && !inYard(x, y) && !busy(x, y) && !(sx > 288 && sx < 330 && sy > 214 && sy < 250); }, function(sx, sy, i, R, x, y){
          return { x: x, y: y, s: crystal(sx, sy, 1.3 + R() * .5, i % 2 ? [K.dmLight, "#8F5BE8"] : [K.dmTeal, "#43C8A8"]) + crystal(sx + 5, sy + 1, .8) };
        });
      },
      fg: function(){ return ""; }
    },
    clouds: {
      n: "Above the clouds", note: "A cloud bank in the sky, a rainbow behind", rarity: "Epic", theme: "clouds", price: 2800, id: "clouds",
      top: cloudTop, bot: cloudBot, skirt: "cloud", path: "gold", treeKind: "cloud", lamp: "gold", grade: ["#FFC9D9", .06],
      chip: function(o){ return o.night ? ["#D9D4EF", "#A99FD0"] : ["#FFFFFF", "#D9D4EF"]; },
      sky: function(o){
        if (o.night) return bands(["#1A2558", "#22306A", "#2C3C7A", "#3A4888", "#4A5496"], 0, 300) + moon(320, 44) + starField(61, 34, 150);
        var s = bands(["#A9CFF7", "#BCD9F8", "#CFE3FA", "#E2EBFB", "#F4E9F6", "#FCE4EC"], 0, 300);
        ["#E5484D", "#F59A1E", "#F5D21E", "#3ECF7E", "#3FA7E0", "#9B7BE0"].forEach(function(c, i){ s += L("M" + (226 + i * 5) + " 150 A" + (78 - i * 5) + " " + (78 - i * 5) + " 0 0 1 " + (382 - i * 5) + " 150", 4.4, c, .6); });
        return s + sun(80, 40) + cloud(150, 30, .8);
      },
      far: function(o){
        var c = o.night ? ["#6C74A8", "#5A6296"] : ["#FFFFFF", "#EEE9F8"], s = "", R = rng(63);
        /* the tops of the clouds far off, and a few below */
        for (var x = -10; x < 410; x += 26){ var y = 150 + R() * 10; s += circ(x, y, 16 + R() * 8, c[1], 0); }
        for (x = 0; x < 410; x += 34){ s += circ(x, 296 + R() * 6, 18 + R() * 8, c[0], 1.2); }
        /* a hot-air balloon drifting by (tap: up it goes) */
        var b = G("tp-eo", FO("M318 62 q-14 0 -14 -15 q0 -15 14 -15 q14 0 14 15 q0 15 -14 15 z", "#F7A3BA", 1.6) + F("M318 32 q6 1 8 15 q-1 14 -8 15 z", "#E07090") + L("M318 32 V62", 1, INK, .6) +
          L("M312 62 l2 8 M324 62 l-2 8", 1) + FO("M313 70 h10 v6 h-10 z", K.wood, 1.2) + G("tp-float", ""));
        s += egg("balloon", G("tp-float", b) + circ(318, 54, 18, "#000", 0).replace("/>", ' opacity="0"/>'));
        return s;
      },
      land: function(o){
        var g = o.night ? ["#D9D4EF", "#C3BBE3", "#A99FD0"] : ["#FFFFFF", "#F1EEFA", "#DCD6F0"];
        var s = "";
        /* puffs along the bottom first, then the cloud's top over them, so only their round bellies show */
        trace(cloudBot, 30, 370, 13).forEach(function(q, i){ s += circ(q[0], q[1] - 4, 10 + (i % 3) * 2.4, g[2], 1.4); });
        s += F(landD(cloudTop, function(x){ return cloudBot(x) - 4; }), g[0]);
        s += F("M370 " + f(cloudTop(370)) + " L370 " + f(cloudBot(370) - 4) + " L240 " + f(cloudBot(240) - 4) + " C282 236 330 206 352 180 Z", g[1]);
        s += L(D2(trace(cloudTop, 30, 370), true), SW);
        return s;
      },
      flat: function(o){
        var on = function(sx, sy, x, y){ return sy > cloudTop(sx) + 6 && sy < cloudBot(sx) - 12 && !busy(x, y); };
        return scatter(104, 14, on, function(sx, sy, i){ return i % 2 ? L("M" + f(sx - 5) + " " + f(sy) + " q5 2.6 10 0", 1.1, o.night ? "#A99FD0" : "#DCD6F0") : dmStar(sx, sy - 2, 2.2, o.night ? "#FFF3C4" : "#FFE27A", "tp-twinkle", i * .3); }).join("");
      },
      props: function(o){
        return scatter(105, 5, function(sx, sy, x, y){ return sy > cloudTop(sx) + 10 && sy < cloudBot(sx) - 16 && !inYard(x, y) && !busy(x, y); }, function(sx, sy, i, R, x, y){
          return { x: x, y: y, s: circ(sx, sy - 5, 7, "#FFFFFF", 1.3) + circ(sx + 6, sy - 3, 5, "#FFFFFF", 1.3) + circ(sx - 5, sy - 2, 4.4, "#FFFFFF", 1.2) + F("M" + f(sx - 9) + " " + f(sy) + " h20 v-3 h-20 z", "#FFFFFF") };
        });
      },
      fg: function(){ return ""; }
    }
  };
  function sceneOn(sc, sx, sy){ return sy > sc.top(sx) + 2 && (!sc.bot || sy < sc.bot(sx) - 2) && (!sc.wet || sx < shoreX(sy) - 10); }

  /* ------------------------------------------------------------------ the scene's own pieces ------------------------ */
  function roundTree(b, o){
    var s = "", cy = b[1] - 40;
    s += FO("M" + f(b[0] - 3.4) + " " + f(b[1]) + " q1 -14 -1 -26 l8 0 q-2 12 -1 26 q-3 1.4 -6 0 z", K.wood, 1.6) + F("M" + f(b[0] + 1) + " " + f(b[1]) + " q-1 -14 1 -26 l2.4 0 q-2 12 -1 26 z", K.woodShade);
    s += L("M" + f(b[0] + 1) + " " + f(b[1] - 18) + " l8 -8 M" + f(b[0] - 1) + " " + f(b[1] - 22) + " l-7 -7", 3.4) + L("M" + f(b[0] + 1) + " " + f(b[1] - 18) + " l8 -8 M" + f(b[0] - 1) + " " + f(b[1] - 22) + " l-7 -7", 1.8, K.wood);
    if (o.season === "winter"){
      s += L("M" + f(b[0]) + " " + f(b[1] - 26) + " q-4 -10 -12 -14 M" + f(b[0]) + " " + f(b[1] - 26) + " q6 -10 14 -12 M" + f(b[0] + 1) + " " + f(b[1] - 28) + " q0 -10 2 -18", 3.6) +
        L("M" + f(b[0]) + " " + f(b[1] - 26) + " q-4 -10 -12 -14 M" + f(b[0]) + " " + f(b[1] - 26) + " q6 -10 14 -12 M" + f(b[0] + 1) + " " + f(b[1] - 28) + " q0 -10 2 -18", 2, K.wood) +
        F("M" + f(b[0] - 14) + " " + f(b[1] - 41) + " q4 -2 6 2 z M" + f(b[0] + 9) + " " + f(b[1] - 39) + " q4 -3 7 1 z M" + f(b[0]) + " " + f(b[1] - 46) + " q3 -2 5 1 z", "#FFFFFF");
      return { s: s, bits: "" };
    }
    var c = o.season === "fall" ? ["#E8A33D", "#C2410C"] : o.night ? ["#4F8E58", "#3A6E46"] : [K.leaf, K.leafShade];
    s += canopy(b[0] - 8, cy + 8, 16, c, 21) + canopy(b[0] + 9, cy + 6, 15, c, 22) + canopy(b[0], cy - 6, 17, c, 23);
    var LV = ["#F5D21E", "#C2410C", "#E8A33D", "#9B2D1F"];
    if (o.season === "fall"){
      [[-12, 4], [6, -10], [12, 10], [-4, 14], [-14, -8]].forEach(function(q, i){ s += circ(b[0] + q[0], cy + q[1], 2.6, LV[i % 4]); });
      [[18, 24, 0], [-22, 30, 1.4], [6, 40, 2.8]].forEach(function(q, i){ s += '<path class="tp-leaf" style="animation-delay:' + q[2] + 's" d="M' + f(b[0] + q[0]) + " " + f(cy + q[1]) + ' q2.6 -3.2 5.2 0 q-2.6 3.2 -5.2 0z" fill="' + LV[i % 4] + '" stroke="' + INK + '" stroke-width=".6"/>'; });
    }
    if (o.season === "spring") [[-10, 0], [8, -4], [2, 10], [-2, -14], [12, 8]].forEach(function(q){ s += circ(b[0] + q[0], cy + q[1], 2.2, "#FFC0CD", .7); });
    /* tap: it shakes and a few leaves come down */
    var bits = [[-10, 12], [6, 18], [14, 6]].map(function(q, i){ return '<path d="M' + f(b[0] + q[0]) + " " + f(cy + q[1]) + ' q2.6 -3.2 5.2 0 q-2.6 3.2 -5.2 0z" fill="' + c[i % 2] + '" stroke="' + INK + '" stroke-width=".6"/>'; }).join("");
    return { s: s, bits: G("tp-drop", bits) };
  }
  function palmTree(b, o){
    var tr = o.night ? "#7E5E3E" : "#C4915F", lf = o.night ? ["#3D6B5A", "#2E5546"] : ["#5DB15C", "#3E8E45"], tx = b[0] - 16, ty = b[1] - 52;
    var trunk = "M" + f(b[0]) + " " + f(b[1]) + " Q" + f(b[0] + 3) + " " + f(b[1] - 30) + " " + f(tx) + " " + f(ty);
    var s = L(trunk, 8.4) + L(trunk, 5.4, tr);
    for (var i = 1; i < 6; i++){ var t = i / 6, x = (1 - t) * (1 - t) * b[0] + 2 * (1 - t) * t * (b[0] + 3) + t * t * tx, y = (1 - t) * (1 - t) * b[1] + 2 * (1 - t) * t * (b[1] - 30) + t * t * ty; s += L("M" + f(x - 2.6) + " " + f(y) + " h5.2", 1, "#8A5A3A"); }
    var fr = "";
    ["M0 0 q-26 -10 -44 6 q20 -4 44 -6 z", "M0 0 q-10 -24 -34 -26 q18 10 34 26 z", "M0 0 q18 -22 42 -16 q-24 2 -42 16 z", "M0 0 q28 -2 40 18 q-18 -12 -40 -18 z", "M0 0 q2 -28 20 -36 q-14 16 -20 36 z", "M0 0 q-24 6 -30 28 q8 -20 30 -28 z"]
      .forEach(function(p, i){ fr += FO(p, lf[i % 2], 1.6 / .72); });
    s += '<g transform="translate(' + f(tx) + " " + f(ty) + ') scale(.72)">' + G("tp-fronds", fr) + "</g>";
    s += circ(tx - 2, ty + 3, 3, "#8A5A3A", 1.1) + circ(tx + 4, ty + 3.4, 3, "#8A5A3A", 1.1);
    var bits = circ(tx + 1, ty + 4, 3, "#8A5A3A", 1.1);
    return { s: s, bits: G("tp-coco", bits) };
  }
  function crystalTree(b, o){
    var s = FO("M" + f(b[0] - 3) + " " + f(b[1]) + " q1 -14 -1 -28 l7 0 q-2 14 -1 28 q-2.6 1.2 -5 0 z", "#5B3FA0", 1.6);
    s += L("M" + f(b[0]) + " " + f(b[1] - 20) + " l-9 -8 M" + f(b[0] + 1) + " " + f(b[1] - 24) + " l8 -9", 3.2) + L("M" + f(b[0]) + " " + f(b[1] - 20) + " l-9 -8 M" + f(b[0] + 1) + " " + f(b[1] - 24) + " l8 -9", 1.6, "#5B3FA0");
    [[-10, -30, 1.7, 0], [9, -34, 1.6, 1], [0, -40, 2.1, 0], [-4, -34, 1.2, 1], [6, -44, 1.2, 0]].forEach(function(q){ s += crystal(b[0] + q[0], b[1] + q[1], q[2], q[3] ? [K.dmLight, "#8F5BE8"] : [K.dmTeal, "#43C8A8"]); });
    return { s: s, bits: dmStar(b[0] + 12, b[1] - 50, 4, "#FFFFFF", "") + dmStar(b[0] - 12, b[1] - 44, 3, K.dmTeal, "") };
  }
  function cloudTree(b, o){
    var s = FO("M" + f(b[0] - 2.4) + " " + f(b[1]) + " q1 -12 -1 -24 l6 0 q-2 12 -1 24 q-2 1 -4 0 z", "#C4915F", 1.4);
    var c = o.night ? ["#D9D4EF", "#A99FD0"] : ["#FFFFFF", "#E6E1F5"];
    s += canopy(b[0] - 7, b[1] - 34, 13, c, 51) + canopy(b[0] + 8, b[1] - 32, 12, c, 52) + canopy(b[0], b[1] - 44, 14, c, 53);
    return { s: s, bits: dmStar(b[0] + 10, b[1] - 56, 3.4, "#FFE27A", "") };
  }
  function sceneTree(sc, o){
    var b = P(FIX.tree[0], FIX.tree[1], 0), sh = ell(b[0] + 2, b[1] + 1, 12, 4.4, "#000", 0, .12), t;
    if (sc.treeKind === "palm") t = palmTree(b, o);
    else if (sc.treeKind === "pine") t = { s: pine(b[0], b[1] + 2, 52, o.night ? ["#2F5A4A", "#244A3D"] : ["#4A9164", "#357A50"], o.snow), bits: "" };
    else if (sc.treeKind === "crystal") t = crystalTree(b, o);
    else if (sc.treeKind === "cloud") t = cloudTree(b, o);
    else t = roundTree(b, o);
    return egg("tree", sh + t.s, t.bits);
  }
  /* the lamp at the end of the path, in the scene's own style */
  function lampFor(kind, o){
    var b = P(FIX.lamp[0], FIX.lamp[1], 0), s = ell(b[0], b[1], 5, 1.8, "#000", 0, .12), lights = "", x = b[0], y = b[1];
    if (kind === "tiki"){
      s += L("M" + f(x) + " " + f(y) + " v-30", 4.4) + L("M" + f(x) + " " + f(y) + " v-30", 2.6, "#C9A066") + L("M" + f(x - 1.6) + " " + f(y - 10) + " h3.2 M" + f(x - 1.6) + " " + f(y - 20) + " h3.2", 1, "#8A6A3A");
      s += FO("M" + f(x - 4.4) + " " + f(y - 34) + " h8.8 l-1.6 5 h-5.6 z", "#8A6A3A", 1.4) + G("tp-flame", FO("M" + f(x) + " " + f(y - 44) + " q5 5 3.6 9 h-7.2 q-1.4 -4 3.6 -9 z", K.orange, 1.1) + F("M" + f(x) + " " + f(y - 40) + " q2.4 3 1.6 5 h-3.2 q-.6 -2 1.6 -5 z", K.yellow));
      if (o.night) lights = circ(x, y - 38, 16, K.glow, 0).replace("/>", ' opacity=".25"/>');
    } else if (kind === "lantern"){
      s += L("M" + f(x) + " " + f(y) + " v-32 h8", 4.4) + L("M" + f(x) + " " + f(y) + " v-32 h8", 2.4, K.wood) + L("M" + f(x + 7) + " " + f(y - 32) + " v3", 1.2);
      var lb = "M" + f(x + 4) + " " + f(y - 29) + " h6 v8 h-6 z";
      s += FO(lb, o.night ? K.lit : "#FFE9A8", 1.4) + L("M" + f(x + 3.4) + " " + f(y - 29) + " h7.2 M" + f(x + 3.4) + " " + f(y - 21) + " h7.2", 1.6);
      if (o.night) lights = circ(x + 7, y - 25, 14, K.glow, 0).replace("/>", ' opacity=".26"/>') + FO(lb, K.litHot, 1.4);
    } else if (kind === "crystal"){
      s += box(FIX.lamp[0] - .3, FIX.lamp[1] - .3, 0, .6, .6, 1.4, { top: "#7A5AA6", left: "#9B7BE0", right: "#6E50B8" }, { sw: 1.4, si: .9 });
      var t = P(FIX.lamp[0], FIX.lamp[1], 1.4); s += G("tp-twinkle", crystal(t[0], t[1], 1.6));
      lights = circ(t[0], t[1] - 5, 14, K.dmTeal, 0).replace("/>", ' opacity=".2"/>');
    } else if (kind === "gold"){
      s += L("M" + f(x) + " " + f(y) + " v-30", 4) + L("M" + f(x) + " " + f(y) + " v-30", 2, K.gold) + circ(x, y - 34, 4.6, o.night ? K.lit : "#FFF3C4", 1.4) + F("M" + f(x - 4) + " " + f(y - 38) + " q4 -5 8 0 z", K.gold) + O("M" + f(x - 4) + " " + f(y - 38) + " q4 -5 8 0", 1.2);
      if (o.night) lights = circ(x, y - 34, 15, K.glow, 0).replace("/>", ' opacity=".26"/>');
    } else {
      s += L("M" + f(x) + " " + f(y) + " v-30", 4) + L("M" + f(x) + " " + f(y) + " v-30", 2, "#8E98A3");
      s += FO("M" + f(x - 5) + " " + f(y - 38) + " h10 l-2 8 h-6 z", o.night ? K.lit : "#FFE9A8", 1.6) + FO("M" + f(x - 6) + " " + f(y - 38) + " l6 -5 6 5 z", "#B6BEC7", 1.6);
      if (kind === "iron" || o.snow) s += F("M" + f(x - 6.4) + " " + f(y - 38) + " l6.4 -5.4 6.4 5.4 q-6.4 -2 -12.8 0 z", "#FFFFFF");
      if (o.night) lights = circ(x, y - 34, 16, K.glow, 0).replace("/>", ' opacity=".26"/>') + FO("M" + f(x - 5) + " " + f(y - 38) + " h10 l-2 8 h-6 z", K.litHot, 1.6);
    }
    return { s: s, lights: lights };
  }
  /* the path from the door, in the scene's material, until the ground runs out */
  function pathAll(sc, home, o){
    var s = "", R = rng(77), y0 = home.door[1] + .9, kind = o.snow && sc.path === "stones" ? "snow" : sc.path;
    if (kind === "dirt"){
      var l = [], r = [], y;
      for (y = y0 - .2; y < 26; y += .5){ var q = P(5.5, y, 0); if (!sceneOn(sc, q[0], q[1])) break; l.push([4.7 + Math.sin(y * 1.3) * .12, y, 0]); r.push([6.3 + Math.sin(y * 1.1 + 1) * .12, y, 0]); }
      if (l.length < 2) return "";
      var band = D(l.concat(r.reverse()));
      s += F(band, o.night ? "#6E5A44" : "#C9A27A") + L(D(l, true), 1.2, o.night ? "#4E3E30" : "#A07E58") + L(D(r.slice().reverse(), true), 1.2, o.night ? "#4E3E30" : "#A07E58");
      for (y = y0; y < l[l.length - 1][1]; y += .9){ var p = P(5.2 + R() * .6, y, 0); s += ell(p[0], p[1], 1.6, 1, o.night ? "#8C7A64" : "#E7DCC8", .6); }
      return s;
    }
    for (var yy = y0; yy < 26; yy += kind === "boards" ? .7 : 1.15){
      var x = 5.5 + (kind === "boards" ? 0 : (R() - .5) * .4), a = P(x, yy, 0);
      if (!sceneOn(sc, a[0], a[1])) break;
      if (kind === "boards") s += FO(D([[x - .9, yy - .3, 0], [x + .9, yy - .3, 0], [x + .9, yy + .3, 0], [x - .9, yy + .3, 0]]), o.night ? "#A08260" : K.woodLight, 1.2) + L(D([[x - .9, yy + .3, 0], [x + .9, yy + .3, 0]], true), .9, K.woodShade);
      else if (kind === "crystal") s += FO(D2([[a[0] - 6, a[1]], [a[0] - 3, a[1] - 2.8], [a[0] + 3, a[1] - 2.8], [a[0] + 6, a[1]], [a[0] + 3, a[1] + 2.8], [a[0] - 3, a[1] + 2.8]]), "#B9F5E4", 1.2) + ell(a[0], a[1], 3, 1.2, K.dmTeal, 0, .7);
      else if (kind === "gold") s += ell(a[0], a[1], 6.6, 3.2, o.night ? "#D9C27A" : "#FFE9A8", 1.2) + ell(a[0] + 1.2, a[1] + .7, 4.4, 1.8, o.night ? "#B9A15A" : "#F2C94C", 0, .7);
      else if (kind === "snow") s += ell(a[0], a[1], 6.8, 3.2, o.night ? "#AFC0DA" : "#E3ECF5", 0) + ell(a[0] - 2, a[1] - .4, 1.4, .9, o.night ? "#8D9EBB" : "#C9DDEE", 0) + ell(a[0] + 2.4, a[1] + .6, 1.4, .9, o.night ? "#8D9EBB" : "#C9DDEE", 0);
      else s += ell(a[0], a[1], 6.8, 3.4, o.night ? "#A8A090" : "#E7DCC8", 1.2) + ell(a[0] + 1.4, a[1] + .8, 4.6, 2, o.night ? "#7F786A" : "#CFC2A8", 0, .7);
    }
    return s;
  }

  /* ------------------------------------------------------------------ the homes ------------------------------------ */
  /* Each home: n, note, rarity, theme, price, id (the shop's), ups (the upgrades it takes) and upn (what each is on it),
     door [x, y] (the path starts there), brush and statue (by the door), spots (Timmy's, [x, y, z]), climbs (a raised spot's
     way up), eaves (where the bunting hangs), h (how tall), foot or round (its footprint: the shadow), base (the line where
     its walls meet the ground: the skirt), block (where Timmy can't go), draw(o) -> { body, lights } */
  function smoke(x, y){ return G("tp-smoke", circ(x, y, 3.4, "#FFFFFF", 0) + circ(x + 4, y - 7, 4.4, "#FFFFFF", 0) + circ(x + 10, y - 15, 5.4, "#FFFFFF", 0), ' opacity=".9"'); }
  function glowAt(x, y, r){ return circ(x, y, r, K.glow, 0).replace("/>", ' opacity=".28"/>') + circ(x, y, r * .6, K.glow, 0).replace("/>", ' opacity=".28"/>'); }
  /* a window on a wall: frame, panes (lit or day glass), cross bars; on the wall turned left (Y) or right (X) */
  function win(face, plane, u0, u1, v0, v1, o){
    var pts = o.arch ? archUV(u0, u1, v0, v1) : rectUV(u0, u1, v0, v1), on = face === "y" ? onY : onX;
    var pane = o.night ? K.lit : (face === "y" ? K.glassDay : K.glass);
    var s = FO(D(on(plane, pts)), pane, 1.6), lights = "";
    var um = (u0 + u1) / 2, vm = (v0 + v1) / 2;
    if (o.stained){
      var arc = archUV(u0, u1, v0, v1).filter(function(t){ return t[1] > vm + .001; });
      var quads = [
        [rectUV(u0, um, v0, vm), K.red], [rectUV(um, u1, v0, vm), K.blue],
        [o.arch ? [[u0, vm], [um, vm], [um, v1]].concat(arc.filter(function(t){ return t[0] < um; }).reverse()) : rectUV(u0, um, vm, v1), K.yellow],
        [o.arch ? [[um, vm], [u1, vm]].concat(arc.filter(function(t){ return t[0] >= um; })).concat([[um, v1]]) : rectUV(um, u1, vm, v1), K.green]
      ];
      var glass = quads.map(function(c){ return F(D(on(plane, c[0])), c[1], o.night ? 1 : .85); }).join("");
      var bars = L(D(on(plane, [[um, v0], [um, v1]]), true) + D(on(plane, [[u0, vm], [u1, vm]]), true), 1.2);
      s += glass + O(D(on(plane, pts)), 1.6) + bars;
      if (o.night) lights = glowAt.apply(null, P.apply(null, face === "y" ? [um, plane, vm] : [plane, um, vm]).concat([10])) + glass + O(D(on(plane, pts)), 1.6) + bars;
      return { s: s, lights: lights };
    }
    if (!o.night) s += HI(D(on(plane, [[u0 + .2, v1 - .3], [u0 + .5, v1 - .7]]), true), 1.4);
    s += L(D(on(plane, [[um, v0], [um, v1]]), true) + D(on(plane, [[u0, vm], [u1, vm]]), true), 1.2);
    if (o.night){ var c = P.apply(null, face === "y" ? [um, plane, vm] : [plane, um, vm]); lights = glowAt(c[0], c[1], 10) + FO(D(on(plane, pts)), K.lit, 1.6) + L(D(on(plane, [[um, v0], [um, v1]]), true) + D(on(plane, [[u0, vm], [u1, vm]]), true), 1.2); }
    if (o.shutters){
      var w = (u1 - u0) * .42;
      s += FO(D(on(plane, rectUV(u0 - w - .08, u0 - .08, v0, v1))), o.shutters, 1.3) + FO(D(on(plane, rectUV(u1 + .08, u1 + w + .08, v0, v1))), o.shutters, 1.3);
      s += L(D(on(plane, [[u0 - w * .5 - .08, v0 + .2], [u0 - w * .5 - .08, v1 - .2]]), true) + D(on(plane, [[u1 + w * .5 + .08, v0 + .2], [u1 + w * .5 + .08, v1 - .2]]), true), .9);
    }
    if (o.box){
      var bz = v0 - .45, b = face === "y" ? box(u0 - .15, plane, bz, u1 - u0 + .3, .35, .42, { top: K.soilShade, left: K.wood, right: K.woodShade }, { sw: 1.3, si: .9 })
        : box(plane, u0 - .15, bz, .35, u1 - u0 + .3, .42, { top: K.soilShade, left: K.wood, right: K.woodShade }, { sw: 1.3, si: .9 });
      s += b;
      var fl = ["#FF8FB1", "#FFE27A", "#B08CFF", "#FF8FB1"];
      for (var i = 0; i < 4; i++){ var t = u0 + (u1 - u0) * (i + .5) / 4, p = P.apply(null, face === "y" ? [t, plane + .2, bz + .5] : [plane + .2, t, bz + .5]); s += circ(p[0], p[1], 1.7, fl[i], .8); }
    }
    return { s: s, lights: lights };
  }
  /* a round window (a porthole) on a wall */
  function porthole(face, plane, uc, vc, r, o){
    var ring = function(rr){ var out = []; for (var q = 0; q < 18; q++){ var th = q / 18 * Math.PI * 2; out.push(face === "y" ? [uc + Math.cos(th) * rr, plane, vc + Math.sin(th) * rr] : [plane, uc + Math.cos(th) * rr, vc + Math.sin(th) * rr]); } return out; };
    var s = FO(D(ring(r + .12)), "#E8BE45", 1.4) + FO(D(ring(r)), o.night ? K.lit : K.glass, 1.1), c = P.apply(null, face === "y" ? [uc, plane, vc] : [plane, uc, vc]);
    if (!o.night) s += L("M" + f(c[0] - 2.4) + " " + f(c[1] - 1) + " l2 -2", 1.2, "#FFFFFF");
    return { s: s, lights: o.night ? glowAt(c[0], c[1], 9) + FO(D(ring(r)), K.lit, 1.1) : "" };
  }
  function doorArch(face, plane, u0, u1, v1, o){
    var on = face === "y" ? onY : onX, pts = archUV(u0, u1, 0, v1, 10);
    var s = FO(D(on(plane, pts)), o.color || K.door, 1.8);
    s += L(D(on(plane, [[(u0 + u1) / 2, .1], [(u0 + u1) / 2, v1 - .3]]), true), 1, INK, .45);
    var k = P.apply(null, face === "y" ? [u1 - .3, plane, v1 * .45] : [plane, u1 - .3, v1 * .45]);
    return s + circ(k[0], k[1], 1.3, INK);
  }
  /* an upright arched door in screen space, for round homes (x, y: the middle of its sill) */
  function roundDoor(x, y, w, h, fill, line){
    var s = FO("M" + f(x - w / 2) + " " + f(y + 1) + " v" + f(-(h - w / 2)) + " a" + f(w / 2) + " " + f(w / 2) + " 0 0 1 " + f(w) + " 0 v" + f(h - w / 2) + " q" + f(-w / 2) + " 2.4 " + f(-w) + " 0 z", fill, 1.8);
    return s + L("M" + f(x - w * .28) + " " + f(y - h + w * .6) + " v" + f(h - w * .6) + " M" + f(x) + " " + f(y - h + 2) + " v" + f(h - 1) + " M" + f(x + w * .28) + " " + f(y - h + w * .6) + " v" + f(h - w * .6), .9, line || K.woodShade) + circ(x + w * .33, y - h * .45, 1.3, INK);
  }
  /* a pennant flag on a pole, the Timmy flag: a tooth on blue */
  function flagOn(x, y, z, h){
    var b = P(x, y, z), t = P(x, y, z + h);
    var s = L("M" + f(b[0]) + " " + f(b[1]) + " L" + f(t[0]) + " " + f(t[1]), 3.4) + L("M" + f(b[0]) + " " + f(b[1]) + " L" + f(t[0]) + " " + f(t[1]), 1.6, K.stone) + circ(t[0], t[1] - 1, 2, K.gold, 1);
    var fl = "M" + f(t[0] + .8) + " " + f(t[1] + 1) + " Q" + f(t[0] + 9) + " " + f(t[1] - 2) + " " + f(t[0] + 17) + " " + f(t[1] + 2) + " L" + f(t[0] + 17) + " " + f(t[1] + 12) + " Q" + f(t[0] + 9) + " " + f(t[1] + 8) + " " + f(t[0] + .8) + " " + f(t[1] + 11) + " Z";
    return s + G("tp-flag", FO(fl, K.blue, 1.4) + tinyTooth(t[0] + 9, t[1] + 6.4, .55, "#FFFFFF"));
  }
  function tinyTooth(x, y, k, fill){
    return '<path d="M' + f(x - 4 * k) + " " + f(y - 4 * k) + " c0 -3 " + f(3 * k) + " -3 " + f(4 * k) + " -1.6 c" + f(1 * k) + " -1.4 " + f(4 * k) + " -1.4 " + f(4 * k) + " 1.6 c0 3 " + f(-1 * k) + " 4 " + f(-1.4 * k) + " 7 c-.3 1.6 " + f(-1.6 * k) + " 1.6 " + f(-1.8 * k) + " 0 l-.4 -2.4 c-.2 -.6 -.8 -.6 -1 0 l-.4 2.4 c-.2 1.6 " + f(-1.5 * k) + " 1.6 " + f(-1.8 * k) + " 0 c" + f(-.4 * k) + " -3 " + f(-1.4 * k) + " -4 " + f(-1.4 * k) + ' -7 z" fill="' + fill + '" stroke="' + INK + '" stroke-width=".8"/>';
  }
  function firefly(x, y, d){ return '<g class="tp-firefly" style="animation-delay:' + d + 's">' + circ(x, y, 4, "#F6F2A0", 0).replace("/>", ' opacity=".35"/>') + circ(x, y, 1.4, "#FFFBD0", 0) + "</g>"; }

  var HOMES = {
    cottage: {
      n: "The cottage", note: "Free: the cottage on the hill, every Timmy's first home", rarity: "", theme: "hilltop", price: 0, id: "",
      ups: ["windows", "porch", "chimney", "flag", "paint"],
      upn: { windows: "Shutters and window boxes", porch: "A porch with a lamp", chimney: "A stone chimney", flag: "A Timmy flag on the gable", paint: "Wall paint" },
      door: [5.5, 8.4], brush: [7.5, 9.0], statue: [3.0, 9.3], spots: { door: [5.5, 10.6] }, h: 7.4,
      eaves: [[2.1, 8.9, 3.55], [8.9, 8.9, 3.55]], foot: [2.4, 3.0, 8.6, 8.6], base: [[2.4, 8.6], [8.6, 8.6], [8.6, 3.0]], block: [2.2, 2.6, 9.0, 9.0], porchBlock: [3.6, 8.4, 7.5, 10.2],
      draw: function(o){
        var p = PAINTS[o.paint] || PAINTS.cream, u = o.up, s = "", lights = "";
        s += box(2.4, 3.0, 0, 6.2, 5.6, .4, { top: K.stone, left: K.stoneShade, right: K.stoneDark });
        /* the chimney, behind the ridge (drawn before the roof so the roof covers its foot) */
        var ch = u.chimney ? [6.6, 3.7, 1.2, 1.2, 4.2] : [6.8, 3.9, .9, .9, 3.4];
        if (u.chimney){
          s += box(ch[0], ch[1], 3.6, ch[2], ch[3], ch[4], { top: "#8E98A3", left: "#C9C1B4", right: "#A39C90" });
          s += box(ch[0] - .15, ch[1] - .15, 3.6 + ch[4], ch[2] + .3, ch[3] + .3, .35, { top: "#8E98A3", left: "#D5DBE1", right: "#A9B3BE" }, { sw: 1.6, si: 1 });
          var R = rng(3); for (var i = 0; i < 5; i++){ var zz = 4.6 + i * .7, yy = ch[1] + ch[3]; s += L(D([[ch[0] + .1 + R() * .5, yy, zz], [ch[0] + .5 + R() * .5, yy, zz]], true), .9, "#8E8678"); }
        } else {
          s += box(ch[0], ch[1], 3.6, ch[2], ch[3], ch[4], { top: "#B5476A", left: "#D96C8C", right: "#B5476A" });
          s += L(D([[ch[0], ch[1] + ch[3], 5.6], [ch[0] + ch[2], ch[1] + ch[3], 5.6]], true) + D([[ch[0], ch[1] + ch[3], 6.4], [ch[0] + ch[2], ch[1] + ch[3], 6.4]], true), .9, "#9C3A5A");
        }
        var cz = 3.6 + ch[4] + (u.chimney ? .35 : 0);
        if (o.snow) s += FO(D([[ch[0] - .1, ch[1] - .1, cz], [ch[0] + ch[2] + .1, ch[1] - .1, cz], [ch[0] + ch[2] + .1, ch[1] + ch[3] + .1, cz], [ch[0] - .1, ch[1] + ch[3] + .1, cz]]), "#FFFFFF", 1.2);
        var top = P(ch[0] + ch[2] / 2, ch[1] + ch[3] / 2, cz);
        s += smoke(top[0], top[1] - 6);
        s += box(2.6, 3.2, .4, 5.8, 5.2, 3.2, { top: p.c, left: p.c, right: p.s });
        s += L(D([[2.6, 8.4, .5], [2.6, 8.4, 3.5]], true) + D([[8.4, 8.4, .5], [8.4, 8.4, 3.5]], true), 2.2, "#FFFFFF", .9);
        var gE = [[8.4, 3.2, 3.6], [8.4, 8.4, 3.6], [8.4, 5.8, 6.3]];
        s += FO(D(gE), p.s);
        /* round window with a tooth, in the gable */
        var rw = P(8.4, 5.8, 4.65);
        var ring = []; for (var q = 0; q < 20; q++){ var th = q / 20 * Math.PI * 2; ring.push([8.4, 5.8 + Math.cos(th) * .62, 4.65 + Math.sin(th) * .62]); }
        s += FO(D(ring), o.night ? K.lit : "#FFFFFF", 1.6);
        s += tinyTooth(rw[0], rw[1] - .4, .62, o.night ? "#FFF3C4" : "#F7F1E4");
        if (o.night) lights += glowAt(rw[0], rw[1], 10);
        var wo = { night: o.night, shutters: u.windows ? "#6CB060" : "", box: true };
        [[3.1, 4.3], [6.7, 7.9]].forEach(function(xx){ var w = win("y", 8.4, xx[0], xx[1], 1.6, 2.9, wo); s += w.s; lights += w.lights; });
        [[3.8, 4.9], [6.4, 7.5]].forEach(function(yy){ var w = win("x", 8.4, yy[0], yy[1], 1.6, 2.9, { night: o.night, shutters: u.windows ? "#6CB060" : "" }); s += w.s; lights += w.lights; });
        s += doorArch("y", 8.4, 4.85, 6.15, 2.75, {});
        s += FO(D(onY(8.4, rectUV(5.0, 6.0, 2.95, 3.4))), "#FFFDF6", 1.2) + tinyTooth.apply(null, P(5.5, 8.4, 3.2).concat([.32, "#FFFFFF"]));
        var e0 = 2.1, e1 = 8.9, ye = 8.9, ze = 3.55, zr = 6.65, ym = 5.8, yb = 2.7;
        var slope = [[e0, ye, ze], [e1, ye, ze], [e1, ym, zr], [e0, ym, zr]];
        s += F(D(slope), K.roof) + F(D([[e0 + 4.4, ye, ze], [e1, ye, ze], [e1, ym, zr], [e0 + 5.6, ym, zr]]), K.roofShade, .35);
        for (var r = 1; r < 4; r++){ var t = r / 4; s += L(D([[e0, ye - (ye - ym) * t, ze + (zr - ze) * t], [e1, ye - (ye - ym) * t, ze + (zr - ze) * t]], true), 1, K.roofDark, .6); }
        s += HI(D([[e0 + .4, ye - .3, ze + .35], [e0 + .9, ym + .5, zr - .35]], true), 2);
        var barge = [[e1, ye, ze], [e1, ym, zr], [e1, yb, ze], [e1, yb, ze - .35], [e1, ym, zr - .4], [e1, ye, ze - .35]];
        s += FO(D(barge), K.roofShade) + O(D(slope));
        if (o.snow) s += snowSlope(e0, e1, ye, ym, ze, zr);
        if (u.porch){
          s += box(3.7, 8.4, 0, 3.6, 1.6, .38, { top: K.woodLight, left: K.wood, right: K.woodShade });
          for (var b = 1; b < 4; b++) s += L(D([[3.7 + b * .9, 8.4, .38], [3.7 + b * .9, 10.0, .38]], true), .9, K.woodShade);
          s += box(3.9, 9.7, .38, .22, .22, 2.6, { top: "#FFFFFF", left: "#FFFFFF", right: "#E9DACB" }, { sw: 1.4, si: .9 });
          s += box(6.9, 9.7, .38, .22, .22, 2.6, { top: "#FFFFFF", left: "#FFFFFF", right: "#E9DACB" }, { sw: 1.4, si: .9 });
          s += FO(D([[3.6, 8.4, 3.35], [7.4, 8.4, 3.35], [7.4, 10.1, 2.95], [3.6, 10.1, 2.95]]), K.roof, 1.8) + FO(D([[7.4, 8.4, 3.35], [7.4, 10.1, 2.95], [7.4, 10.1, 2.7], [7.4, 8.4, 3.1]]), K.roofShade, 1.4);
          if (o.snow) s += FO(D([[3.6, 8.4, 3.4], [7.4, 8.4, 3.4], [7.4, 9.5, 3.18], [3.6, 9.5, 3.18]]), "#FFFFFF", 1.1);
          if (o.night){ var lp = P(5.5, 10.0, 2.7); lights += glowAt(lp[0], lp[1] + 3, 12) + FO("M" + f(lp[0] - 2) + " " + f(lp[1]) + " h4 l-.6 5 h-2.8 z", K.lit, 1); }
        }
        if (u.flag) s += flagOn(8.9, 5.8, 6.4, 2.6);
        return { body: s, lights: lights };
      }
    },
    castle: {
      n: "The castle", note: "Legendary: towers, a gate and banners", rarity: "Legendary", theme: "clouds", price: 8000, id: "castle",
      ups: ["windows", "porch", "flag", "paint"],
      upn: { windows: "Stained glass", porch: "A stone landing", flag: "A Timmy flag on the keep", paint: "Roofs and banners" },
      door: [5.5, 7.6], brush: [8.6, 8.4], statue: [7.4, 9.0], spots: { door: [5.5, 9.6], tower: [2.4, 9.8] }, h: 10.4,
      eaves: [[3.0, 7.6, 4.7], [8.0, 7.6, 4.7]], foot: [1.6, 1.9, 9.4, 9.2],
      base: arcPts(2.7, 8.0, 1.25, -10, 150, 6).concat([[4.0, 7.6], [8.0, 7.6], [8.0, 4.3]]).concat(arcPts(8.3, 3.1, 1.25, 60, -20, 4)), block: [1.3, 1.6, 9.8, 9.4],
      draw: function(o){
        var u = o.up, bp = BOLD[o.paint] || BOLD.cream, roof = o.paint && o.paint !== "cream" ? bp : { c: K.roof, s: K.roofShade }, s = "", lights = "";
        var st = { top: K.stone, left: K.stone, right: K.stoneShade };
        s += cyl(5.0, 4.6, 0, 1.1, 7.4, 1.1, K.stone, K.stoneShade, K.stone, { open: true });
        s += cone(5.0, 4.6, 7.4, 1.35, 9.9, roof.c, roof.s, { hi: true });
        if (o.snow) s += snowCone(5.0, 4.6, 7.4, 1.35, 9.9);
        s += box(3.0, 3.4, 0, 5.0, 4.2, 4.8, st);
        if (o.snow) s += F(D([[3.0, 3.4, 4.8], [8.0, 3.4, 4.8], [8.0, 7.6, 4.8], [3.0, 7.6, 4.8]]), "#FFFFFF", .95);
        for (var i = 0; i < 5; i++){ s += box(3.0 + i * 1.05, 7.15, 4.8, .5, .45, .55, st, { sw: 1.4, si: .9 }); }
        for (i = 0; i < 4; i++){ s += box(7.55, 3.4 + i * 1.05, 4.8, .45, .5, .55, st, { sw: 1.4, si: .9 }); }
        var R = rng(7);
        for (var z = 1; z < 4.8; z += .8){ for (var x = 3.3 + R() * .6; x < 7.8; x += 1.4 + R() * .6) s += L(D([[x, 7.6, z], [x + .6, 7.6, z]], true), .9, K.stoneDark, .7); for (var y = 3.7 + R() * .6; y < 7.4; y += 1.4 + R() * .6) s += L(D([[8, y, z], [8, y + .6, z]], true), .9, K.stoneDark, .6); }
        var ban = o.paint && o.paint !== "cream" ? bp.c : K.blue;
        [[3.95, 4.55], [6.45, 7.05]].forEach(function(xx){
          s += FO(D(onY(7.6, [[xx[0], 4.4], [xx[1], 4.4], [xx[1], 2.5], [(xx[0] + xx[1]) / 2, 2.1], [xx[0], 2.5]])), ban, 1.4);
          s += tinyTooth.apply(null, P((xx[0] + xx[1]) / 2, 7.6, 3.4).concat([.42, "#FFFFFF"]));
        });
        s += doorArch("y", 7.6, 4.7, 6.3, 2.9, { color: K.wood });
        s += L(D(onY(7.6, [[4.95, .1], [4.95, 2.4]]), true) + D(onY(7.6, [[5.25, .1], [5.25, 2.6]]), true) + D(onY(7.6, [[5.75, .1], [5.75, 2.6]]), true) + D(onY(7.6, [[6.05, .1], [6.05, 2.4]]), true), .9, K.woodShade);
        [[4.2, 5.0], [6.0, 6.8]].forEach(function(yy){ var w = win("x", 8.0, yy[0], yy[1], 2.6, 3.9, { night: o.night, arch: true, stained: !!u.windows }); s += w.s; lights += w.lights; });
        [[2.7, 8.0], [8.3, 3.1]].forEach(function(c){
          s += cyl(c[0], c[1], 0, 1.2, 6.0, 1.2, K.stone, K.stoneShade, K.stone, { open: true });
          for (var zz = 1.2; zz < 6; zz += 1.2){ var a = P(c[0], c[1], zz); s += L("M" + f(a[0] - RX(1.2) * .7) + " " + f(a[1] + RY(1.2) * .7) + " q" + f(RX(1.2) * .35) + " 2 " + f(RX(1.2) * .5) + " 2.5", .9, K.stoneDark, .7); }
          var w = P(c[0] + .6, c[1] + .9, 3.6);
          s += FO("M" + f(w[0] - 2) + " " + f(w[1] + 4) + " v-6 a2 2 0 0 1 4 0 v6 z", o.night ? K.lit : K.glass, 1.3);
          if (o.night) lights += glowAt(w[0], w[1], 9) + FO("M" + f(w[0] - 2) + " " + f(w[1] + 4) + " v-6 a2 2 0 0 1 4 0 v6 z", K.lit, 1.3);
          s += cyl(c[0], c[1], 6.0, 1.45, 6.5, 1.45, K.stone, K.stoneShade, o.snow ? "#FFFFFF" : K.stoneShade);
          s += cone(c[0], c[1], 6.5, 1.55, 9.2, roof.c, roof.s, { hi: true });
          if (o.snow) s += snowCone(c[0], c[1], 6.5, 1.55, 9.2);
        });
        if (u.porch) s += box(4.3, 7.6, 0, 2.4, 1.0, .3, st, { sw: 1.6, si: 1 }) + box(4.1, 8.6, 0, 2.8, .7, .15, st, { sw: 1.4, si: .9 });
        [[4.2, 7.7], [6.8, 7.7]].forEach(function(t){
          var a = P(t[0], t[1], 2.4);
          s += L("M" + f(a[0]) + " " + f(a[1]) + " v6", 2.6) + L("M" + f(a[0]) + " " + f(a[1]) + " v6", 1.2, K.woodShade) + G("tp-flame", FO("M" + f(a[0]) + " " + f(a[1] - 6) + " q3 3 0 6 q-3 -3 0 -6 z", K.orange, 1));
          if (o.night) lights += glowAt(a[0], a[1] - 3, 11) + G("tp-flame", F("M" + f(a[0]) + " " + f(a[1] - 6) + " q3 3 0 6 q-3 -3 0 -6 z", K.yellow));
        });
        if (u.flag) s += flagOn(5.0, 4.6, 9.9, 1.6);
        return { body: s, lights: lights };
      }
    },
    mushroom: {
      n: "The giant mushroom", note: "Legendary: round windows, a spotted cap", rarity: "Legendary", theme: "woodland", price: 6000, id: "giant-mushroom",
      ups: ["windows", "porch", "chimney", "flag", "paint"],
      upn: { windows: "Window boxes", porch: "A doorstep and flower pots", chimney: "A crooked stovepipe", flag: "A flag on the cap", paint: "Cap color" },
      door: [5.5, 7.6], brush: [8.3, 7.4], statue: [2.7, 9.4], spots: { door: [5.5, 9.4] }, h: 8.8,
      eaves: [[2.74, 8.26, 3.95], [8.26, 2.74, 3.95], 27], round: [5.5, 5.5, 2.3], base: arcPts(5.5, 5.5, 2.35, -40, 135, 14), block: [2.4, 2.6, 8.6, 8.9],
      draw: function(o){
        var u = o.up, cap = BOLD[o.paint] || BOLD.cream, s = "", lights = "";
        s += cyl(2.6, 7.0, 0, .32, .9, .28, K.cream, K.creamShade, K.cream, { sw: 1.4, si: 1 }) + dome(2.6, 7.0, .9, .7, .55, cap.c, cap.s, { sw: 1.4 });
        s += cyl(5.5, 5.5, 0, 2.3, 4.4, 1.95, K.cream, K.creamShade, K.creamShade);
        [[-.55, .25], [.62, .3], [1.1, .1]].forEach(function(g){ var a = P(5.5 + g[0], 5.5 + 2.1, .5), b = P(5.5 + g[0] * .9, 5.5 + 1.9, 4.0); s += L("M" + f(a[0]) + " " + f(a[1]) + " Q" + f(a[0] + g[1] * 4) + " " + f((a[1] + b[1]) / 2) + " " + f(b[0]) + " " + f(b[1]), .9, "#D8CCB4"); });
        [[5.5 + 2.0, 5.5 + .7, 2.6], [5.5 - .7, 5.5 + 2.0, 3.0]].forEach(function(w){
          var c = P(w[0], w[1], w[2]);
          s += ell(c[0], c[1], 4.4, 4.8, o.night ? K.lit : K.glass, 1.6) + L("M" + f(c[0] - 4.4) + " " + f(c[1]) + " h8.8 M" + f(c[0]) + " " + f(c[1] - 4.8) + " v9.6", 1);
          if (u.windows) s += FO("M" + f(c[0] - 5.4) + " " + f(c[1] + 5.4) + " h10.8 v2.4 h-10.8 z", K.wood, 1.2) + circ(c[0] - 3, c[1] + 4.6, 1.6, "#FF8FB1", .8) + circ(c[0] + .4, c[1] + 4.2, 1.6, "#FFE27A", .8) + circ(c[0] + 3.6, c[1] + 4.6, 1.6, "#B08CFF", .8);
          if (o.night) lights += glowAt(c[0], c[1], 10) + ell(c[0], c[1], 4.4, 4.8, K.lit, 1.6) + L("M" + f(c[0] - 4.4) + " " + f(c[1]) + " h8.8 M" + f(c[0]) + " " + f(c[1] - 4.8) + " v9.6", 1);
        });
        var dp = P(5.5, 7.75, 0);
        s += roundDoor(dp[0], dp[1], 14, 19, K.wood);
        if (u.porch) s += cyl(5.5, 8.4, 0, .9, .3, .9, K.stone, K.stoneShade, K.stone, { sw: 1.4, si: 1 }) + cyl(3.7, 8.3, 0, .45, .7, .45, "#E07A5F", "#B8553D", K.soilShade, { sw: 1.3, si: .9 }) + circ(P(3.7, 8.3, 1.2)[0], P(3.7, 8.3, 1.2)[1], 3, K.leaf, 1.1) + cyl(7.7, 8.0, 0, .45, .7, .45, "#E07A5F", "#B8553D", K.soilShade, { sw: 1.3, si: .9 }) + circ(P(7.7, 8.0, 1.2)[0], P(7.7, 8.0, 1.2)[1], 3, "#FF8FB1", 1.1);
        s += dome(5.5, 5.5, 4.0, 3.9, 3.6, cap.c, cap.s);
        [[-.55, .42, 3.6], [.1, .7, 2.6], [.5, .25, 3.0], [-.15, .1, 2.4], [.78, .55, 2.0], [-.8, .62, 2.2]].forEach(function(sp){ var c0 = P(5.5, 5.5, 4.0), x = c0[0] + sp[0] * RX(3.9), y = c0[1] - (1 - sp[1]) * 3.6 * U * .78 + sp[1] * 4; s += ell(x, y, sp[2] * 1.5, sp[2] * 1.05, "#FFFFFF", 1.2); });
        if (o.snow) s += snowDome(5.5, 5.5, 4.0, 3.9, 3.6, .55);
        if (u.chimney){
          var a = P(6.9, 4.6, 6.6);
          s += L("M" + f(a[0]) + " " + f(a[1]) + " v-12 l5 -4", 6.4) + L("M" + f(a[0]) + " " + f(a[1]) + " v-12 l5 -4", 3.4, K.stoneDark) + smoke(a[0] + 6, a[1] - 22);
        }
        if (u.flag) s += flagOn(4.6, 4.6, 7.4, 2.4);
        if (o.night) lights += firefly(150, 190, 0) + firefly(260, 150, 1.1) + firefly(120, 120, 2);
        return { body: s, lights: lights };
      }
    },
    treehouse: {
      n: "The treehouse", note: "Legendary: up in the branches, a rope ladder down", rarity: "Legendary", theme: "woodland", price: 5000, id: "treehouse",
      ups: ["windows", "porch", "flag", "paint"],
      upn: { windows: "Shutters and a window box", porch: "A railing and lanterns", flag: "A Timmy flag on the roof", paint: "Cabin paint" },
      door: [5.5, 8.3], brush: [7.4, 8.9], statue: [3.3, 9.4], spots: { door: [5.5, 10.2], deck: [6.7, 7.6, 4.75] }, h: 10.6,
      climbs: { deck: [[5.5, 8.95, 0], [5.5, 8.3, 4.4], [6.7, 7.6, 4.75]] },
      eaves: [[3.2, 7.6, 7.2], [7.6, 7.6, 7.2]], round: [5.4, 5.2, 1.3], base: arcPts(5.4, 5.2, 1.4, -40, 135, 8), block: [2.6, 2.8, 8.4, 8.7],
      draw: function(o){
        var u = o.up, p = PAINTS[o.paint] || PAINTS.cream, s = "", lights = "";
        var leaf = o.fall ? ["#E8A33D", "#C2410C"] : o.snow ? ["#7CB98A", "#5A9A6A"] : o.night ? ["#4F8E58", "#3A6E46"] : [K.leaf, K.leafShade];
        var c1 = P(3.8, 3.4, 8.6), c2 = P(7.8, 3.6, 8.2), c3 = P(5.4, 3.8, 9.6);
        s += canopy(c1[0], c1[1], 27, leaf, 3) + canopy(c2[0], c2[1], 25, leaf, 5) + canopy(c3[0], c3[1], 24, leaf, 9);
        if (o.snow) [c1, c2, c3].forEach(function(c, i){ s += ell(c[0] - 2, c[1] - 14 - i * 2, 14, 5, "#FFFFFF", 0); });
        s += cyl(5.4, 5.2, 0, 1.25, 7.2, .85, K.wood, K.woodShade, K.woodShade, { open: true });
        var r0 = P(5.4, 5.2, 0);
        s += FO("M" + f(r0[0] - 16) + " " + f(r0[1] + 2) + " q8 -2 10 -10 l6 2 q-4 8 -16 8 z", K.wood, 1.6) + FO("M" + f(r0[0] + 16) + " " + f(r0[1] + 4) + " q-8 -2 -9 -10 l-6 1 q3 9 15 9 z", K.woodShade, 1.6);
        s += L("M" + f(r0[0] - 4) + " " + f(r0[1] - 20) + " q2 -10 0 -20 M" + f(r0[0] + 5) + " " + f(r0[1] - 14) + " q-2 -8 0 -16", 1, "#8A5A3A", .8);
        var br = P(5.4, 5.2, 2.6), bt = P(7.6, 7.4, 4.3);
        s += L("M" + f(br[0]) + " " + f(br[1]) + " L" + f(bt[0]) + " " + f(bt[1]), 5) + L("M" + f(br[0]) + " " + f(br[1]) + " L" + f(bt[0]) + " " + f(bt[1]), 2.6, K.wood);
        s += box(2.8, 3.0, 4.3, 5.4, 5.0, .45, { top: K.woodLight, left: K.wood, right: K.woodShade });
        for (var b = 1; b < 6; b++) s += L(D([[2.8 + b * .9, 8.0, 4.75], [2.8 + b * .9, 3.0, 4.75]], true), .8, K.woodShade, .7);
        s += box(3.4, 3.4, 4.75, 4.0, 3.7, 2.5, { top: p.c, left: p.c, right: p.s });
        for (var z = 5.3; z < 7.2; z += .5) s += L(D([[3.4, 7.1, z], [7.4, 7.1, z]], true) + D([[7.4, 3.4, z], [7.4, 7.1, z]], true), .7, p.s, .8);
        var w = win("x", 7.4, 4.4, 5.6, 5.6, 6.6, { night: o.night, shutters: u.windows ? "#E07A5F" : "", box: !!u.windows }); s += w.s; lights += w.lights;
        var dz = 4.75, dd = archUV(4.9, 6.0, dz, dz + 1.95, 10);
        s += FO(D(onY(7.1, dd)), K.door, 1.6) + circ(P(5.75, 7.1, dz + .85)[0], P(5.75, 7.1, dz + .85)[1], 1.2, INK);
        var e0 = 3.0, e1 = 7.8, ye = 7.6, ze = 7.2, zr = 8.7, ym = 5.25, yb = 2.9;
        var slope = [[e0, ye, ze], [e1, ye, ze], [e1, ym, zr], [e0, ym, zr]];
        s += F(D(slope), "#E8866A") + F(D([[e0 + 3, ye, ze], [e1, ye, ze], [e1, ym, zr], [e0 + 3.8, ym, zr]]), "#B8553D", .3) + O(D(slope));
        s += FO(D([[e1, ye, ze], [e1, ym, zr], [e1, yb, ze], [e1, yb, ze - .3], [e1, ym, zr - .35], [e1, ye, ze - .3]]), "#B8553D");
        s += FO(D([[7.4, 3.4, 7.25], [7.4, 7.1, 7.25], [7.4, 5.25, 8.4]]), p.s, 1.4);
        for (var r = 1; r < 3; r++){ var t = r / 3; s += L(D([[e0, ye - (ye - ym) * t, ze + (zr - ze) * t], [e1, ye - (ye - ym) * t, ze + (zr - ze) * t]], true), .9, "#B8553D", .8); }
        if (o.snow) s += snowSlope(e0, e1, ye, ym, ze, zr);
        var c4 = P(2.4, 6.6, 7.2);
        s += canopy(c4[0], c4[1], 16, leaf, 13);
        if (o.snow) s += ell(c4[0] - 1, c4[1] - 9, 9, 3.4, "#FFFFFF", 0);
        var la = P(5.0, 8.0, 4.3), lb = P(5.0, 8.4, 0), lc = P(6.0, 8.0, 4.3), ld = P(6.0, 8.4, 0);
        s += L("M" + f(la[0]) + " " + f(la[1]) + " L" + f(lb[0]) + " " + f(lb[1]) + " M" + f(lc[0]) + " " + f(lc[1]) + " L" + f(ld[0]) + " " + f(ld[1]), 1.6, "#8A5A3A");
        for (var k = 1; k < 7; k++){ var tt = k / 7; s += L("M" + f(la[0] + (lb[0] - la[0]) * tt) + " " + f(la[1] + (lb[1] - la[1]) * tt) + " L" + f(lc[0] + (ld[0] - lc[0]) * tt) + " " + f(lc[1] + (ld[1] - lc[1]) * tt), 2.4) + L("M" + f(la[0] + (lb[0] - la[0]) * tt) + " " + f(la[1] + (lb[1] - la[1]) * tt) + " L" + f(lc[0] + (ld[0] - lc[0]) * tt) + " " + f(lc[1] + (ld[1] - lc[1]) * tt), 1.2, K.woodLight); }
        if (u.porch){
          var rail = function(a, b){ return L(D([a, b], true), 2.6) + L(D([a, b], true), 1.2, K.woodLight); };
          s += rail([2.8, 8.0, 5.6], [4.7, 8.0, 5.6]) + rail([6.3, 8.0, 5.6], [8.2, 8.0, 5.6]) + rail([8.2, 8.0, 5.6], [8.2, 3.0, 5.6]);
          [[2.8, 8], [3.8, 8], [4.7, 8], [6.3, 8], [7.3, 8], [8.2, 8], [8.2, 6.4], [8.2, 4.7], [8.2, 3.0]].forEach(function(q){ s += L(D([[q[0], q[1], 4.75], [q[0], q[1], 5.6]], true), 2.2) + L(D([[q[0], q[1], 4.75], [q[0], q[1], 5.6]], true), 1, K.woodLight); });
          var lantern = [[3.2, 8.0, 6.2], [4.3, 8.0, 6.0], [6.7, 8.0, 6.0], [7.8, 8.0, 6.2]];
          s += L(D(lantern, true), .8, INK, .7);
          lantern.forEach(function(q, i){ var a = P(q[0], q[1], q[2] - .1); s += circ(a[0], a[1] + 1.6, 1.8, o.night ? K.lit : ["#FF8FB1", "#FFE27A", "#8FD3F5", "#B08CFF"][i], .8); if (o.night) lights += glowAt(a[0], a[1] + 1.6, 7) + circ(a[0], a[1] + 1.6, 1.8, K.litHot, .8); });
        }
        if (u.flag) s += flagOn(7.8, 5.25, 8.4, 2.4);
        if (o.night) lights += firefly(110, 150, .4) + firefly(290, 120, 1.6);
        return { body: s, lights: lights };
      }
    },
    hut: {
      n: "The beach hut", note: "Epic: up on stilts, with steps down to the sand", rarity: "Epic", theme: "seaside", price: 2600, id: "beach-hut",
      ups: ["windows", "porch", "flag", "paint"],
      upn: { windows: "Porthole windows", porch: "A railing and a life ring", flag: "A pennant on the roof", paint: "Plank paint" },
      door: [5.5, 7.6], brush: [8.0, 10.0], statue: [3.5, 8.6, 1.2], spots: { door: [5.5, 11.2], deck: [7.4, 8.7, 1.2] }, h: 6.4,
      climbs: { deck: [[5.5, 11.0, 0], [5.5, 9.4, 1.2], [7.4, 8.7, 1.2]] },
      eaves: [[2.9, 7.95, 3.6], [8.1, 7.95, 3.6]], foot: [2.8, 3.0, 8.4, 9.2], base: [[2.8, 9.2], [4.6, 9.2], [6.4, 9.2], [8.4, 9.2], [8.4, 3.0]], block: [2.6, 2.8, 8.7, 10.8],
      draw: function(o){
        var u = o.up, p = PAINTS[o.paint] || PAINTS.cream, s = "", lights = "", DZ = 1.2;
        var post = { top: K.woodLight, left: K.wood, right: K.woodShade };
        [[3.0, 3.2], [5.6, 3.2], [8.2, 3.2], [3.0, 6.1], [8.2, 6.1], [3.0, 9.0], [5.6, 9.0], [8.2, 9.0]].sort(function(a, b){ return a[0] + a[1] - b[0] - b[1]; })
          .forEach(function(q){ s += box(q[0] - .16, q[1] - .16, 0, .32, .32, DZ - .25, post, { sw: 1.4, si: .9 }); });
        s += box(2.8, 3.0, DZ - .25, 5.6, 6.2, .25, { top: K.woodLight, left: K.wood, right: K.woodShade });
        for (var b = 1; b < 7; b++) s += L(D([[2.8, 3.0 + b * .885, DZ], [8.4, 3.0 + b * .885, DZ]], true), .8, K.woodShade, .7);
        /* the cabin, in stripes of its paint and white */
        s += box(3.3, 3.4, DZ, 4.6, 4.2, 2.5, { top: p.c, left: p.c, right: p.s });
        for (var i = 1; i < 8; i += 2){ var x = 3.3 + i * .575; s += F(D(onY(7.6, rectUV(x, x + .575, DZ, DZ + 2.5))), "#FFFFFF", .7); }
        for (i = 1; i < 8; i += 2){ var y = 3.4 + i * .525; s += F(D(onX(7.9, rectUV(y, y + .525, DZ, DZ + 2.5))), "#FFFFFF", .45); }
        s += O(D([[3.3, 7.6, DZ], [7.9, 7.6, DZ], [7.9, 3.4, DZ], [7.9, 3.4, DZ + 2.5], [7.9, 7.6, DZ + 2.5], [3.3, 7.6, DZ + 2.5]])) + L(D([[7.9, 7.6, DZ], [7.9, 7.6, DZ + 2.5]], true));
        s += FO(D(onY(7.6, archUV(4.95, 6.05, DZ, DZ + 1.95, 10))), K.door, 1.6) + L(D(onY(7.6, [[5.5, DZ + .1], [5.5, DZ + 1.5]]), true), 1, INK, .45);
        var dk = P(5.85, 7.6, DZ + .9); s += circ(dk[0], dk[1], 1.2, INK);
        var ws = u.windows ? [porthole("y", 7.6, 6.9, DZ + 1.35, .4, o), porthole("x", 7.9, 4.6, DZ + 1.35, .4, o), porthole("x", 7.9, 6.6, DZ + 1.35, .4, o)]
          : [win("y", 7.6, 6.45, 7.35, DZ + .9, DZ + 1.8, { night: o.night }), win("x", 7.9, 4.2, 5.2, DZ + .9, DZ + 1.8, { night: o.night }), win("x", 7.9, 6.0, 7.0, DZ + .9, DZ + 1.8, { night: o.night })];
        ws.forEach(function(w){ s += w.s; lights += w.lights; });
        /* a tin roof, its ridge along the cabin */
        var e0 = 3.0, e1 = 8.2, ye = 7.95, ze = DZ + 2.45, zr = DZ + 3.9, ym = 5.5, yb = 3.05;
        s += FO(D([[7.9, 3.4, DZ + 2.5], [7.9, 7.6, DZ + 2.5], [7.9, 5.5, zr - .25]]), p.s);
        var slope = [[e0, ye, ze], [e1, ye, ze], [e1, ym, zr], [e0, ym, zr]];
        s += F(D(slope), "#5FB6CC") + F(D([[e0 + 3.4, ye, ze], [e1, ye, ze], [e1, ym, zr], [e0 + 4.4, ym, zr]]), "#3E95AE", .35);
        for (var r = 1; r < 9; r++){ var xx = e0 + (e1 - e0) * r / 9; s += L(D([[xx, ye, ze], [xx, ym, zr]], true), .9, "#3E95AE", .8); }
        s += FO(D([[e1, ye, ze], [e1, ym, zr], [e1, yb, ze], [e1, yb, ze - .3], [e1, ym, zr - .32], [e1, ye, ze - .3]]), "#3E95AE") + O(D(slope));
        if (o.snow) s += snowSlope(e0, e1, ye, ym, ze, zr);
        /* the steps down to the sand */
        for (var k = 0; k < 3; k++) s += box(4.85, 9.2 + k * .5, 0, 1.3, .5, DZ * (1 - k / 3) - .02, { top: K.woodLight, left: K.wood, right: K.woodShade }, { sw: 1.3, si: .8 });
        /* a surfboard leaning on the deck */
        var sb = seg(P(8.75, 6.9, 0), P(8.1, 6.5, 2.9));
        s += L(sb, 9.4) + L(sb, 6.6, K.yellow) + L(sb, 1.4, K.red);
        if (u.porch){
          var rail = function(a, c){ return L(D([a, c], true), 2.6) + L(D([a, c], true), 1.2, "#FFFFFF"); };
          s += rail([2.8, 9.2, DZ + .75], [4.75, 9.2, DZ + .75]) + rail([6.25, 9.2, DZ + .75], [8.4, 9.2, DZ + .75]) + rail([8.4, 9.2, DZ + .75], [8.4, 3.0, DZ + .75]);
          [[2.8, 9.2], [3.8, 9.2], [4.75, 9.2], [6.25, 9.2], [7.3, 9.2], [8.4, 9.2], [8.4, 7.6], [8.4, 6.0], [8.4, 4.5], [8.4, 3.0]].forEach(function(q){ s += L(D([[q[0], q[1], DZ], [q[0], q[1], DZ + .75]], true), 2.2) + L(D([[q[0], q[1], DZ], [q[0], q[1], DZ + .75]], true), 1, "#FFFFFF"); });
          var lr = P(3.95, 7.6, DZ + 1.35);
          s += ell(lr[0], lr[1], 6, 6.4, "#FFFFFF", 1.6) + ell(lr[0], lr[1], 2.6, 2.8, p.c, 1.2) + L("M" + f(lr[0] - 6) + " " + f(lr[1]) + " h3.4 M" + f(lr[0] + 2.6) + " " + f(lr[1]) + " h3.4 M" + f(lr[0]) + " " + f(lr[1] - 6.4) + " v3.6 M" + f(lr[0]) + " " + f(lr[1] + 2.8) + " v3.6", 2.6, K.red);
          if (o.night){ var lp = P(8.4, 9.2, DZ + 1.0); lights += glowAt(lp[0], lp[1], 10) + circ(lp[0], lp[1], 2, K.litHot, .9); }
        }
        if (u.flag) s += flagOn(8.2, 5.5, zr - .1, 2.0);
        return { body: s, lights: lights };
      }
    },
    lighthouse: {
      n: "The lighthouse", note: "Legendary: red and white, its lamp sweeps the night", rarity: "Legendary", theme: "seaside", price: 7000, id: "lighthouse",
      ups: ["windows", "porch", "flag", "paint"],
      upn: { windows: "Round windows", porch: "The keeper's cottage", flag: "A flag on the lantern", paint: "Stripe color" },
      door: [5.5, 7.0], brush: [7.5, 8.4], statue: [3.6, 9.2], spots: { door: [5.5, 9.0] }, h: 12,
      eaves: [[3.8, 6.4, 8.35], [6.6, 3.6, 8.35], 5], round: [5.5, 5.0, 2.3], base: arcPts(5.5, 5.0, 2.35, -40, 135, 14), block: [3.0, 2.6, 8.0, 7.6], porchBlock: [1.0, 5.0, 3.9, 8.8],
      draw: function(o){
        var u = o.up, bp = BOLD[o.paint] || BOLD.cream, s = "", lights = "", cx = 5.5, cy = 5.0;
        if (u.porch){
          s += box(1.2, 5.4, 0, 2.4, 3.0, 2.0, { top: "#FFF7EC", left: "#FFF7EC", right: "#E9DACB" });
          s += FO(D([[1.2, 8.4, 2.0], [3.6, 8.4, 2.0], [2.4, 8.4, 2.95]]), "#FFF7EC");
          s += FO(D([[2.4, 5.2, 3.05], [2.4, 8.65, 3.05], [3.85, 8.65, 1.9], [3.85, 5.2, 1.9]]), bp.s);
          s += FO(D([[2.4, 8.65, 3.05], [.95, 8.65, 1.9], [.95, 8.65, 1.65], [2.4, 8.65, 2.8], [3.85, 8.65, 1.65], [3.85, 8.65, 1.9]]), bp.c, 1.4);
          if (o.snow) s += snowSlope(2.4, 3.85, 8.65, 5.2, 1.9, 3.05).replace(/^/, "");
          var kw = win("y", 8.4, 1.75, 2.65, .7, 1.5, { night: o.night }); s += kw.s; lights += kw.lights;
        }
        s += cyl(cx, cy, 0, 2.3, .4, 2.3, K.stone, K.stoneShade, K.stone);
        [[.4, 2.05, 2.4, 1.92, "#FFFFFF", "#E3E6EA"], [2.4, 1.92, 4.4, 1.79, bp.c, bp.s], [4.4, 1.79, 6.4, 1.66, "#FFFFFF", "#E3E6EA"], [6.4, 1.66, 8.2, 1.54, bp.c, bp.s]]
          .forEach(function(g){ s += cyl(cx, cy, g[0], g[1], g[2], g[3], g[4], g[5], g[4], { open: true }); });
        /* windows up the tower, facing the path */
        [[3.3, 1.86], [5.4, 1.72]].forEach(function(w){ var a = 100 * Math.PI / 180, c = P(cx + Math.cos(a) * w[1], cy + Math.sin(a) * w[1], w[0]);
          var pane = u.windows ? ell(c[0], c[1], 2.8, 2.8, o.night ? K.lit : K.glass, 1.3) + L("M" + f(c[0] - 2.8) + " " + f(c[1]) + " h5.6", 1) : FO("M" + f(c[0] - 2.2) + " " + f(c[1] + 3) + " v-5 a2.2 2.2 0 0 1 4.4 0 v5 z", o.night ? K.lit : K.glass, 1.3);
          s += pane; if (o.night) lights += glowAt(c[0], c[1], 8) + pane; });
        var dp = P(cx, cy + 2.05, .4);
        s += roundDoor(dp[0], dp[1], 10, 15, K.door, K.doorShade);
        var gz = 8.2;
        s += cyl(cx, cy, gz, 2.0, gz + .28, 2.0, "#5B5560", "#3F3A45", "#7A7480");
        var rc = P(cx, cy, gz + 1.0), rx = RX(1.95), ry = RY(1.95);
        s += L("M" + f(rc[0] - rx) + " " + f(rc[1]) + " A" + f(rx) + " " + f(ry) + " 0 0 1 " + f(rc[0] + rx) + " " + f(rc[1]), 1.4);
        s += cyl(cx, cy, gz + .28, 1.1, gz + 1.75, 1.1, o.night ? K.lit : K.glassDay, o.night ? K.glow : K.glass, null, { open: true });
        for (var m = -1; m <= 3; m++){ var a = (m * 40 + 10) * Math.PI / 180; s += L(seg(P(cx + Math.cos(a) * 1.1, cy + Math.sin(a) * 1.1, gz + .28), P(cx + Math.cos(a) * 1.1, cy + Math.sin(a) * 1.1, gz + 1.75)), 1.1); }
        var lc = P(cx, cy, gz + 1.0); s += circ(lc[0], lc[1], 3.4, o.night ? K.litHot : "#FFE9A8", 1.1);
        s += cyl(cx, cy, gz + 1.75, 1.3, gz + 1.95, 1.3, bp.c, bp.s, bp.c, { sw: 1.6 });
        s += dome(cx, cy, gz + 1.95, 1.15, .95, bp.c, bp.s, { sw: 1.8 });
        if (o.snow) s += snowDome(cx, cy, gz + 1.95, 1.15, .95, .4);
        var fin = P(cx, cy, gz + 3.05); s += L("M" + f(fin[0]) + " " + f(fin[1] + 4) + " v-5", 2.2) + circ(fin[0], fin[1] - 2, 2, K.gold, 1.1);
        s += L("M" + f(rc[0] - rx) + " " + f(rc[1]) + " A" + f(rx) + " " + f(ry) + " 0 0 0 " + f(rc[0] + rx) + " " + f(rc[1]), 1.8);
        for (var pp = 0; pp <= 6; pp++){ var aa = (-45 + 30 * pp) * Math.PI / 180; s += L(seg(P(cx + Math.cos(aa) * 1.95, cy + Math.sin(aa) * 1.95, gz + .28), P(cx + Math.cos(aa) * 1.95, cy + Math.sin(aa) * 1.95, gz + 1.0)), 1.3); }
        if (o.night){
          var beam = F("M" + f(lc[0]) + " " + f(lc[1]) + " L" + f(lc[0] + 150) + " " + f(lc[1] - 20) + " L" + f(lc[0] + 150) + " " + f(lc[1] + 20) + " Z", "#FFF3C4", .3) + F("M" + f(lc[0]) + " " + f(lc[1]) + " L" + f(lc[0] - 150) + " " + f(lc[1] - 20) + " L" + f(lc[0] - 150) + " " + f(lc[1] + 20) + " Z", "#FFF3C4", .22);
          lights += '<g class="tp-beam" style="transform-origin:' + f(lc[0]) + "px " + f(lc[1]) + 'px">' + beam + "</g>" + glowAt(lc[0], lc[1], 16) + circ(lc[0], lc[1], 3.4, K.litHot, 1.1);
        }
        if (u.flag) s += flagOn(cx, cy, gz + 3.05, 1.4);
        return { body: s, lights: lights };
      }
    },
    igloo: {
      n: "The igloo", note: "Epic: snow blocks, a tunnel door and a warm glow", rarity: "Epic", theme: "snowy", price: 2200, id: "igloo",
      ups: ["windows", "porch", "chimney", "flag", "paint"],
      upn: { windows: "Ice windows", porch: "Snow lanterns", chimney: "A stovepipe", flag: "A flag on top", paint: "Ice tint" },
      door: [5.5, 9.55], brush: [7.6, 9.8], statue: [3.1, 9.0], spots: { door: [5.5, 10.9] }, h: 5.2,
      eaves: [[2.7, 7.4, 1.7], [7.8, 2.4, 1.7], 8], round: [5.5, 5.3, 3.0],
      base: arcPts(5.5, 5.3, 3.05, -40, 62, 8).concat([[6.65, 8.1], [6.65, 9.55], [4.35, 9.55], [4.35, 8.1]]).concat(arcPts(5.5, 5.3, 3.05, 118, 135, 2)), block: [2.3, 2.1, 8.7, 10.0],
      draw: function(o){
        var u = o.up, p = PAINTS[o.paint] || PAINTS.cream, ice = o.paint && o.paint !== "cream" ? p : { c: "#FBFDFF", s: "#D6E6F4" }, s = "", lights = "", cx = 5.5, cy = 5.3;
        /* its own patch of snow, whatever the scene */
        var sp0 = P(cx + .5, cy + 1.4, 0);
        s += F(lumps(sp0[0] + 4, sp0[1] + 3, RX(3.6), 17, 12, .58), "#E2ECF5") + F(lumps(sp0[0], sp0[1], RX(3.6), 19, 12, .58), "#F7FAFD") + L(lumps(sp0[0], sp0[1], RX(3.6), 19, 12, .58), 1.1, "#C9DDEE");
        if (u.chimney){ var cp = P(cx + 1.0, cy - 1.0, 2.2); s += L("M" + f(cp[0]) + " " + f(cp[1]) + " v-16", 6.4) + L("M" + f(cp[0]) + " " + f(cp[1]) + " v-16", 3.6, K.stoneDark) + FO("M" + f(cp[0] - 4) + " " + f(cp[1] - 16) + " h8 l-1 -3 h-6 z", K.stoneDark, 1.2) + smoke(cp[0] + 2, cp[1] - 24); }
        s += dome(cx, cy, 0, 3.0, 2.9, ice.c, ice.s);
        [.75, 1.5, 2.2].forEach(function(z, i){
          var rz = 3.0 * Math.sqrt(1 - Math.pow(z / 3.05, 2)), c = P(cx, cy, z), rx = RX(rz), ry = RY(rz), z2 = i ? [.75, 1.5, 2.2][i - 1] : 0, r2 = 3.0 * Math.sqrt(1 - Math.pow(z2 / 3.05, 2));
          s += L("M" + f(c[0] - rx) + " " + f(c[1]) + " A" + f(rx) + " " + f(ry) + " 0 0 0 " + f(c[0] + rx) + " " + f(c[1]), 1.1, "#B9CCDD");
          for (var j = 0; j < 6; j++){ var a = (-36 + j * 30 + (i % 2) * 15) * Math.PI / 180; s += L(seg(P(cx + Math.cos(a) * rz, cy + Math.sin(a) * rz, z), P(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2, z2)), 1, "#B9CCDD"); }
        });
        /* ice windows: one on the shaded side, a second with the upgrade */
        var iw = function(a, z){ var c = P(cx + Math.cos(a) * 2.75, cy + Math.sin(a) * 2.75, z), d = "M" + f(c[0] - 4) + " " + f(c[1] - 3) + " h8 l1 6 h-10 z"; return { s: FO(d, o.night ? K.lit : "#CFEFFC", 1.3) + L("M" + f(c[0] - 2) + " " + f(c[1] - 1) + " l2 2 2 -2", .9, "#FFFFFF"), l: o.night ? glowAt(c[0], c[1], 9) + FO(d, K.lit, 1.3) : "" }; };
        [iw(15 * Math.PI / 180, 1.3)].concat(u.windows ? [iw(120 * Math.PI / 180, 1.2), iw(60 * Math.PI / 180, 2.0)] : []).forEach(function(w){ s += w.s; lights += w.l; });
        /* the tunnel to the door */
        var tY0 = 7.6, tY1 = 9.55, x0 = 4.4, x1 = 6.6, front = archUV(x0, x1, 0, 1.55, 12);
        s += F(D(onX(x1, rectUV(tY0, tY1, 0, .45))), ice.s) + O(D(onX(x1, rectUV(tY0, tY1, 0, .45))), 1.4);
        var topPts = front.slice(2).map(function(q){ return [q[0], tY1, q[1]]; });
        s += FO(D(topPts.concat(topPts.map(function(q){ return [q[0], tY0, q[2]]; }).reverse())), ice.c, 1.6);
        s += FO(D(onY(tY1, front)), ice.c, 1.8);
        var dw = onY(tY1 + .01, archUV(4.85, 6.15, 0, 1.25, 10));
        s += FO(D(dw), o.night ? K.lit : "#3D5A80", 1.4);
        if (o.night){ var dc = P(5.5, tY1, .6); lights += glowAt(dc[0], dc[1], 14) + FO(D(dw), K.lit, 1.4); }
        if (u.porch) [[4.0, 9.8], [7.0, 9.8]].forEach(function(q){ s += box(q[0] - .3, q[1] - .3, 0, .6, .6, .7, { top: "#FFFFFF", left: "#F4F8FC", right: "#D6E6F4" }, { sw: 1.3, si: .8 }); var c = P(q[0], q[1] + .3, .35); s += circ(c[0], c[1], 1.4, o.night ? K.litHot : "#FFE9A8", .8); if (o.night) lights += glowAt(c[0], c[1], 8); });
        if (u.flag) s += flagOn(cx, cy, 2.95, 2.0);
        return { body: s, lights: lights };
      }
    },
    observatory: {
      n: "The observatory", note: "Legendary: a dome that opens on the stars", rarity: "Legendary", theme: "starlight", price: 7500, id: "observatory",
      ups: ["windows", "porch", "flag", "paint"],
      upn: { windows: "Star windows", porch: "Steps and star lamps", flag: "A flag on the dome", paint: "Dome color" },
      door: [5.5, 8.0], brush: [7.7, 8.9], statue: [3.3, 9.5], spots: { door: [5.5, 9.9] }, h: 9.0,
      eaves: [[3.4, 7.6, 3.4], [7.6, 3.4, 3.4], 6], round: [5.5, 5.5, 2.5], base: arcPts(5.5, 5.5, 2.55, -40, 135, 14), block: [2.7, 2.7, 8.4, 8.8],
      draw: function(o){
        var u = o.up, p = PAINTS[o.paint] || PAINTS.cream, dc = o.paint && o.paint !== "cream" ? p : { c: "#F4F6FA", s: "#C9D1DE" }, s = "", lights = "", cx = 5.5, cy = 5.5;
        s += cyl(cx, cy, 0, 2.5, 3.4, 2.5, K.stone, K.stoneShade, K.stone, { open: true });
        for (var z = .7; z < 3.3; z += .7){ var c = P(cx, cy, z), rx = RX(2.5), ry = RY(2.5); s += L("M" + f(c[0] - rx) + " " + f(c[1]) + " A" + f(rx) + " " + f(ry) + " 0 0 0 " + f(c[0] + rx) + " " + f(c[1]), .9, K.stoneDark, .6); }
        [[100, 2.0], [35, 2.0]].forEach(function(w){ var a = w[0] * Math.PI / 180, c = P(cx + Math.cos(a) * 2.5, cy + Math.sin(a) * 2.5, w[1]);
          var pane = u.windows ? FO("M" + f(c[0]) + " " + f(c[1] - 4.4) + " l1.3 2.9 3.1 .3 -2.4 2 .8 3.1 -2.8 -1.7 -2.8 1.7 .8 -3.1 -2.4 -2 3.1 -.3 z", o.night ? K.lit : "#FFE9A8", 1.1)
            : ell(c[0], c[1], 2.8, 3, o.night ? K.lit : K.glass, 1.3) + L("M" + f(c[0] - 2.8) + " " + f(c[1]) + " h5.6", 1);
          s += pane; if (o.night) lights += glowAt(c[0], c[1], 8) + pane; });
        var dp = P(cx, cy + 2.5, 0);
        s += roundDoor(dp[0], dp[1], 11, 16, "#5B3FA0", "#3F2A78") + dmStar(dp[0], dp[1] - 10, 2.6, "#FFE27A", "");
        s += cyl(cx, cy, 3.4, 2.65, 3.75, 2.65, "#8E98A3", "#6F7984", "#8E98A3");
        s += dome(cx, cy, 3.75, 2.55, 2.5, dc.c, dc.s);
        if (o.snow) s += snowDome(cx, cy, 3.75, 2.55, 2.5, .45);
        /* the slit, open, the telescope out of it */
        var a = 32 * Math.PI / 180, rim = P(cx + Math.cos(a) * 2.5, cy + Math.sin(a) * 2.5, 3.8), top = P(cx + .15, cy + .05, 6.2), mid = [(top[0] + rim[0]) / 2, (top[1] + rim[1]) / 2];
        var slit = "M" + f(top[0] - 3) + " " + f(top[1] + 1) + " Q" + f(mid[0] - 6) + " " + f(mid[1] - 2) + " " + f(rim[0] - 4.6) + " " + f(rim[1] - .6) + " L" + f(rim[0] + 4.6) + " " + f(rim[1] + .6) + " Q" + f(mid[0] + 4) + " " + f(mid[1] + 1) + " " + f(top[0] + 3) + " " + f(top[1] - 1) + " Z";
        var inner = "M" + f(top[0] - 1.4) + " " + f(top[1] + 2) + " Q" + f(mid[0] - 3.6) + " " + f(mid[1]) + " " + f(rim[0] - 2.4) + " " + f(rim[1]) + " L" + f(rim[0] + 2.4) + " " + f(rim[1] + .6) + " Q" + f(mid[0] + 2) + " " + f(mid[1] + 1.4) + " " + f(top[0] + 1.4) + " " + f(top[1]) + " Z";
        var tele = function(){ var t0 = [mid[0] + 1, mid[1] + 3], te = [mid[0] + 13, mid[1] - 9];
          return L(seg(t0, te), 6.4) + L(seg(t0, te), 3.8, "#E8BE45") + L(seg([t0[0] + 4, t0[1] - 4], [t0[0] + 5.4, t0[1] - 5.4]), 6.4) + L(seg([t0[0] + 4, t0[1] - 4], [t0[0] + 5.4, t0[1] - 5.4]), 3.8, "#C9971C") + ell(te[0] + 1, te[1] - 1, 2, 2.4, "#7FCDEB", 1.2); };
        s += FO(slit, "#2B2550", 1.5) + tele();
        if (o.night) lights += glowAt(mid[0], mid[1], 12) + FO(slit, "#2B2550", 1.5) + F(inner, "#FFD86B", .55) + tele();
        if (u.porch){
          s += cyl(cx, cy + 3.0, 0, .9, .25, .9, K.stone, K.stoneShade, K.stone, { sw: 1.4, si: 1 });
          [[4.0, 8.9], [7.0, 8.6]].forEach(function(q){ var b0 = P(q[0], q[1], 0); s += L("M" + f(b0[0]) + " " + f(b0[1]) + " v-18", 3.6) + L("M" + f(b0[0]) + " " + f(b0[1]) + " v-18", 1.8, "#7A5AA6") + G("tp-twinkle", dmStar(b0[0], b0[1] - 21, 4, "#FFE27A", "")); if (o.night) lights += glowAt(b0[0], b0[1] - 21, 9); });
        }
        if (u.flag) s += flagOn(cx - .5, cy + .2, 6.05, 1.8);
        if (o.night) lights += dmStar(140, 60, 3, "#FFFFFF", "tp-twinkle", .2) + dmStar(260, 50, 2.6, K.dmTeal, "tp-twinkle", 1.1);
        return { body: s, lights: lights };
      }
    }
  };
  Object.keys(HOMES).forEach(function(k){ HOMES[k].k = k; });
  function baseOf(h){ return h.base || [[h.foot[0], h.foot[3]], [h.foot[2], h.foot[3]], [h.foot[2], h.foot[1]]]; }
  function shadowOf(h){
    if (h.round){ var r = h.round, c = P(r[0] + .5, r[1] + .4, 0); return ell(c[0], c[1], RX(r[2] + .7), RY(r[2] + .7), "#1B2A3A", 0, .08) + ell(c[0], c[1], RX(r[2] + .35), RY(r[2] + .35), "#1B2A3A", 0, .1); }
    var b = h.foot, sh = function(e){ return F(D([[b[0] + .2 - e, b[1] - e, 0], [b[2] + 1.2 + e, b[1] + .3 - e, 0], [b[2] + 1.2 + e, b[3] + .6 + e, 0], [b[0] + .3 - e, b[3] + .6 + e, 0]]), "#1B2A3A", .09); };
    return sh(.35) + sh(0);
  }
  function skirt(sc, h, o){
    var pts = baseOf(h), s = "", R = rng(31 + h.k.length), d = h.door, kind = o.snow ? "snow" : sc.skirt, n = 0;
    for (var i = 0; i < pts.length - 1; i++){
      var a = pts[i], b = pts[i + 1], len = Math.sqrt((b[0] - a[0]) * (b[0] - a[0]) + (b[1] - a[1]) * (b[1] - a[1])), m = Math.max(1, Math.round(len / .62));
      for (var j = i ? 1 : 0; j <= m; j++){
        var t = j / m, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
        if (Math.abs(x - d[0]) < 1.0 && Math.abs(y - d[1]) < 1.3) continue;
        var q = P(x + .1, y + .1, 0); s += skirtBit(kind, q[0], q[1], n++, R, o);
      }
    }
    return s;
  }

  /* ------------------------------------------------------------------ the yard items ------------------------------- */
  /* Each draws in a 3.6 x 3.6 footprint at the yard's origin (the long lane in 3.6 x 8.2); at() moves it to its slot.
     spot = where Timmy stands for it, relative to the footprint; bits = what shows while its egg plays (.tp-eb). */
  function pin(x, y){
    return FO("M" + f(x - 1.6) + " " + f(y) + " q-1.4 -3 -.6 -5.4 q.6 -1.4 .2 -2.6 q-.4 -1.6 1 -2.2 q1.4 .6 1 2.2 q-.4 1.2 .2 2.6 q.8 2.4 -.6 5.4 z", "#FFFFFF", 1.1) + L("M" + f(x - 1) + " " + f(y - 7.2) + " h2", .9, K.red);
  }
  function mintBall(x, y, r){
    return circ(x, y, r, "#FFFFFF", 1.4) + L("M" + f(x - r * .9) + " " + f(y - r * .3) + " q" + f(r * .4) + " " + f(-r * .6) + " " + f(r * .9) + " " + f(-r * .7) +
      " M" + f(x + r * .3) + " " + f(y - r * .9) + " q" + f(r * .6) + " " + f(r * .3) + " " + f(r * .6) + " " + f(r * .9) + " M" + f(x + r * .9) + " " + f(y + r * .3) + " q" + f(-r * .4) + " " + f(r * .6) + " " + f(-r * .9) + " " + f(r * .7) +
      " M" + f(x - r * .3) + " " + f(y + r * .9) + " q" + f(-r * .6) + " " + f(-r * .3) + " " + f(-r * .6) + " " + f(-r * .9), 1.4, K.green);
  }
  var YARD = {
    garden: {
      n: "A garden", note: "Raised beds of flowers and carrots", rarity: "Uncommon", theme: "hilltop", price: 300, id: "garden", spot: [1.8, 3.5],
      draw: function(o){
        var s = "";
        [[.3, .3], [.3, 2.0]].forEach(function(b, k){
          s += box(b[0], b[1], 0, 3.0, 1.3, .55, { top: o.snow ? "#F7FBFF" : K.soil, left: K.wood, right: K.woodShade });
          for (var i = 0; i < 5; i++){
            var x = b[0] + .35 + i * .58, y = b[1] + .65, p = P(x, y, .55);
            if (o.snow) { s += ell(p[0], p[1] - 1, 3, 1.4, "#FFFFFF", 0); continue; }
            if (k === 0) s += L("M" + f(p[0]) + " " + f(p[1]) + " v-6", 1.3, "#4F9A52") + circ(p[0], p[1] - 7, 2.6, ["#FF8FB1", "#FFE27A", "#B08CFF", "#FF7A5C", "#8FD3F5"][i], 1) + circ(p[0], p[1] - 7, .9, "#FFE27A");
            else s += L("M" + f(p[0]) + " " + f(p[1]) + " l-2 -5 M" + f(p[0]) + " " + f(p[1]) + " l0 -6 M" + f(p[0]) + " " + f(p[1]) + " l2 -5", 1.4, o.fall ? "#9FB54A" : "#4F9A52") + FO("M" + f(p[0] - 1.6) + " " + f(p[1]) + " h3.2 l-1.6 3 z", K.orange, .8);
          }
        });
        var w = P(3.3, 3.5, 0);
        s += FO("M" + f(w[0] - 4) + " " + f(w[1]) + " v-6 h8 v6 q-4 2 -8 0 z", K.blue, 1.3) + L("M" + f(w[0] + 4) + " " + f(w[1] - 3) + " l5 -5", 2.6) + L("M" + f(w[0] + 4) + " " + f(w[1] - 3) + " l5 -5", 1.2, K.blue) + L("M" + f(w[0] - 3) + " " + f(w[1] - 6) + " q3 -5 6 0", 1.2);
        return s;
      },
      bits: function(){ var p = P(1.5, 2.65, .55); return FO("M" + f(p[0] - 2.4) + " " + f(p[1] - 6) + " h4.8 l-2.4 10 z", K.orange, 1) + L("M" + f(p[0]) + " " + f(p[1] - 6) + " l-2 -5 M" + f(p[0]) + " " + f(p[1] - 6) + " l0 -6 M" + f(p[0]) + " " + f(p[1] - 6) + " l2 -5", 1.4, "#4F9A52"); }
    },
    pool: {
      n: "A swimming pool", note: "With a ladder and a mint float", rarity: "Epic", theme: "seaside", price: 2000, id: "swimming-pool", spot: [3.45, 2.3],
      draw: function(o){
        var x0 = .2, y0 = .3, x1 = 3.4, y1 = 3.4, r = .32, s = "";
        s += F(D([[x0, y0, .18], [x1, y0, .18], [x1, y1, .18], [x0, y1, .18]]), "#FFFFFF") + F(D([[x0, y1, .18], [x1, y1, .18], [x1, y1, 0], [x0, y1, 0]]), "#E3EEF5") + F(D([[x1, y0, .18], [x1, y1, .18], [x1, y1, 0], [x1, y0, 0]]), "#C9DCE8");
        s += O(D([[x0, y0, .18], [x1, y0, .18], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0], [x0, y1, .18]]));
        var a = x0 + r, b = y0 + r, c = x1 - r, d = y1 - r;
        s += F(D([[a, b, .18], [c, b, .18], [c, b, -.5], [a, b, -.5]]), "#7FCDEB") + F(D([[a, b, .18], [a, d, .18], [a, d, -.5], [a, b, -.5]]), "#A9E1F7");
        s += F(D([[a, b, -.12], [c, b, -.12], [c, d, -.12], [a, d, -.12]]), o.snow ? "#DCEFFA" : K.water) + F(D([[a + 1.4, b, -.12], [c, b, -.12], [c, d, -.12], [a + 2.4, d, -.12]]), o.snow ? "#C9E3F3" : K.waterShade, .5);
        s += O(D([[a, b, .18], [c, b, .18], [c, d, .18], [a, d, .18]]), 1.6);
        for (var i = 1; i < 5; i++){ s += L(D([[x0 + i * .64, y1, .18], [x0 + i * .64, d, .18]], true), .7, "#B9CFDC") + L(D([[x1, y0 + i * .62, .18], [c, y0 + i * .62, .18]], true), .7, "#B9CFDC"); }
        if (!o.snow){
          s += G("tp-water", L(D([[a + .4, b + .7, -.12], [a + 1.2, b + .7, -.12]], true) + D([[a + 1.5, b + 1.6, -.12], [a + 2.3, b + 1.6, -.12]], true) + D([[a + .6, b + 2.2, -.12], [a + 1.4, b + 2.2, -.12]], true), 1.4, "#FFFFFF", .8));
          var m = P(a + 1.8, b + 1.0, -.08);
          s += G("tp-bob", ell(m[0], m[1], 9, 5.2, "#FFFFFF", 1.6) + ell(m[0], m[1] - .6, 3.6, 2, K.water, 1.2) +
            L("M" + f(m[0] - 8) + " " + f(m[1] - 2) + " q2 -2 5 -2.6 M" + f(m[0] + 3) + " " + f(m[1] - 4.6) + " q4 .4 5.6 2.4 M" + f(m[0] + 7.4) + " " + f(m[1] + 2.6) + " q-3 2 -6 2.2 M" + f(m[0] - 3) + " " + f(m[1] + 4.6) + " q-4 -.6 -5.6 -2.4", 1.8, K.green));
        } else s += L(D([[a + .4, b + .6, -.12], [a + 2, b + 2.2, -.12]], true), 1, "#FFFFFF", .8);
        var l1 = P(c - .1, d - .7, .18), l2 = P(c - .1, d - 1.5, .18);
        s += L("M" + f(l1[0]) + " " + f(l1[1] + 6) + " v-9 q0 -3 -3 -3 M" + f(l2[0]) + " " + f(l2[1] + 6) + " v-9 q0 -3 -3 -3", 2.8) + L("M" + f(l1[0]) + " " + f(l1[1] + 6) + " v-9 q0 -3 -3 -3 M" + f(l2[0]) + " " + f(l2[1] + 6) + " v-9 q0 -3 -3 -3", 1.3, K.stone);
        return s;
      },
      bits: function(){ var m = P(2.32, 1.62, -.08); return G("tp-splash", ell(m[0], m[1], 14, 7, "none", 0).replace('fill="none"', 'fill="none" stroke="#FFFFFF" stroke-width="2"') + circ(m[0] - 10, m[1] - 8, 1.6, "#FFFFFF", .8) + circ(m[0] + 9, m[1] - 10, 1.8, "#FFFFFF", .8) + circ(m[0] + 2, m[1] - 13, 1.4, "#FFFFFF", .8)); }
    },
    hammock: {
      n: "A hammock", note: "Striped, on a wooden frame", rarity: "Uncommon", theme: "woodland", price: 350, id: "hammock", spot: [2.9, 3.1],
      draw: function(o){
        var s = "", h = 2.1, A = [.55, 3.05], B = [3.05, .55], w = .3;
        var leg = function(c){ var a = [c[0] - .32, c[1] - .32, 0], b = [c[0] + .32, c[1] + .32, 0], t = [c[0], c[1], h]; return L(D([a, t, b], true), 3.6) + L(D([a, t, b], true), 1.8, K.wood); };
        s += ell.apply(null, P(1.8, 1.8, 0).concat([30, 6, "#000", 0, .1]));
        s += leg(A) + L(D([[A[0], A[1], h], [B[0], B[1], h]], true), 3.6) + L(D([[A[0], A[1], h], [B[0], B[1], h]], true), 1.8, K.wood);
        var sag = function(off, z0, dip){ var out = []; for (var i = 0; i <= 14; i++){ var t = i / 14, x = A[0] + (B[0] - A[0]) * (.1 + .8 * t), y = A[1] + (B[1] - A[1]) * (.1 + .8 * t); out.push([x + off, y + off, z0 - dip * Math.sin(t * Math.PI)]); } return out; };
        var e1 = sag(-w, h - .45, .95), e2 = sag(w, h - .45, .95), cloth = D(e1.concat(e2.slice().reverse()));
        s += L(D([[A[0], A[1], h - .05], e1[0]], true) + D([[A[0], A[1], h - .05], e2[0]], true) + D([[B[0], B[1], h - .05], e1[14]], true) + D([[B[0], B[1], h - .05], e2[14]], true), 1.1);
        var cl = F(cloth, o.night ? "#E8D5E0" : "#FFFFFF") + L(D(sag(-w * .35, h - .45, .95), true), 2.6, K.red) + L(D(sag(w * .35, h - .45, .95), true), 2.6, K.blue) + F(D(e2.concat(sag(w * .7, h - .45, .95).reverse())), "#E9DFCC", .9) + O(cloth, 1.6);
        var pw = P(A[0] + .55, A[1] - .55, h - .75);
        s += G("tp-cloth", cl + FO("M" + f(pw[0] - 6) + " " + f(pw[1]) + " q5 -5 11 -2 q1 4 -2 6 q-6 1 -9 -4 z", K.yellow, 1.2));
        return s + leg(B);
      }
    },
    fountain: {
      n: "A mint fountain", note: "Mouthwash-green water, a tooth on top", rarity: "Rare", theme: "clouds", price: 900, id: "mint-fountain", spot: [3.3, 3.3],
      draw: function(o){
        var s = "", c = [1.8, 1.8];
        s += cyl(c[0], c[1], 0, 1.55, .7, 1.55, K.stone, K.stoneShade, K.stoneShade);
        var t = P(c[0], c[1], .7);
        s += ell(t[0], t[1], RX(1.25), RY(1.25), o.snow ? "#DCEFFA" : K.mint, 1.3);
        if (!o.snow) s += G("tp-water", L("M" + f(t[0] - 10) + " " + f(t[1]) + " q4 -2 8 0 M" + f(t[0] + 2) + " " + f(t[1] + 3) + " q4 -2 8 0", 1.2, "#FFFFFF", .8));
        s += cyl(c[0], c[1], .5, .3, 2.0, .3, K.stone, K.stoneShade, K.stone, { sw: 1.6, si: 1 });
        s += cyl(c[0], c[1], 2.0, .8, 2.25, .8, K.stone, K.stoneShade, o.snow ? "#DCEFFA" : K.mint, { sw: 1.6, si: 1 });
        var top = P(c[0], c[1], 2.25);
        s += tinyTooth(top[0], top[1] - 6, 1, "#FFFDF6");
        if (!o.snow) s += G("tp-spout", '<circle cx="' + f(top[0] - 8) + '" cy="' + f(top[1] - 2) + '" r="1.4" fill="' + K.mint + '"/><circle cx="' + f(top[0] + 8) + '" cy="' + f(top[1] - 2) + '" r="1.4" fill="' + K.mint + '"/>' +
          L("M" + f(top[0] - 4) + " " + f(top[1] - 6) + " q-6 0 -8 12 M" + f(top[0] + 4) + " " + f(top[1] - 6) + " q6 0 8 12", 1.6, K.mint));
        return s;
      },
      bits: function(){ var top = P(1.8, 1.8, 2.25); return G("tp-geyser", L("M" + f(top[0]) + " " + f(top[1] - 12) + " v-22", 3.2, K.mint) + circ(top[0], top[1] - 36, 2.6, K.mint, 0) + circ(top[0] - 5, top[1] - 30, 1.6, K.mint, 0) + circ(top[0] + 5, top[1] - 31, 1.6, K.mint, 0)); }
    },
    doghouse: {
      n: "A doghouse", note: "A bowl, a chew toy and a name plate", rarity: "Uncommon", theme: "", price: 400, id: "doghouse", spot: [3.35, 3.35],
      draw: function(o){
        var s = "", x0 = .6, y0 = .7, w = 2.4, d = 2.2, h = 1.5;
        s += box(x0, y0, 0, w, d, h, { top: K.woodLight, left: K.woodLight, right: K.wood });
        for (var z = .35; z < h; z += .35) s += L(D([[x0, y0 + d, z], [x0 + w, y0 + d, z]], true) + D([[x0 + w, y0, z], [x0 + w, y0 + d, z]], true), .7, K.woodShade, .7);
        s += FO(D(onY(y0 + d, archUV(x0 + .7, x0 + 1.7, 0, 1.2, 8))), "#3B2E3A", 1.4);
        var ym0 = y0 - .25, ym1 = y0 + d + .25, xm = x0 + w / 2;
        var sl = [[x0 + w + .25, ym0, h - .1], [x0 + w + .25, ym1, h - .1], [xm, ym1, h + 1.2], [xm, ym0, h + 1.2]];
        s += FO(D([[x0, y0 + d, h], [x0 + w, y0 + d, h], [xm, y0 + d, h + 1.1]]), K.woodLight, 1.4);
        s += FO(D(sl), K.red) + F(D([[x0 + w + .25, ym0, h - .1], [x0 + w + .25, ym1, h - .1], [x0 + w + .25, ym1, h - .3], [x0 + w + .25, ym0, h - .3]]), K.redShade) +
          FO(D([[xm, ym1, h + 1.2], [x0 - .25, ym1, h - .1], [x0 - .25, ym1, h - .32], [xm, ym1, h + .95], [x0 + w + .25, ym1, h - .32], [x0 + w + .25, ym1, h - .1]]), K.redShade, 1.4);
        if (o.snow) s += FO(D([[xm, ym0, h + 1.25], [xm, ym1, h + 1.25], [x0 + w - .2, ym1, h + .3], [x0 + w - .2, ym0, h + .3]]), "#FFFFFF", 1.1);
        s += FO(D(onY(y0 + d, rectUV(x0 + .75, x0 + 1.65, 1.35, 1.65))), "#FFFDF6", 1);
        var b = P(x0 + .8, y0 + d + .45, 0);
        s += ell(b[0], b[1], 5, 2.4, K.blue, 1.3) + ell(b[0], b[1] - 1, 3.6, 1.4, "#8A5A3A", 0);
        var t = P(x0 + 2.1, y0 + d + .45, 0);
        s += L("M" + f(t[0] - 5) + " " + f(t[1] + 1) + " l9 -3", 3.4) + L("M" + f(t[0] - 5) + " " + f(t[1] + 1) + " l9 -3", 1.8, "#FF8FB1") + FO("M" + f(t[0] + 3) + " " + f(t[1] - 4) + " h3.6 v2.4 h-3.6 z", "#FFFFFF", .9);
        return s;
      },
      bits: function(){ var c = P(1.8, 2.9, .55); return FO("M" + f(c[0] - 5) + " " + f(c[1] - 2) + " q-1 -6 2 -7 q1 3 1 6 z M" + f(c[0] + 5) + " " + f(c[1] - 2) + " q1 -6 -2 -7 q-1 3 -1 6 z", "#C4915F", 1.1) + circ(c[0] - 2, c[1] - 1, .9, "#FFFFFF") + circ(c[0] + 2, c[1] - 1, .9, "#FFFFFF") + circ(c[0], c[1] + 1.4, 1.3, INK); }
    },
    lane: {
      n: "A bowling lane", note: "Takes the side yard and the front corner; tap it to bowl", rarity: "Rare", theme: "", price: 1200, id: "bowling-lane", wide: true, spot: [1.8, 6.9],
      draw: function(o){
        var s = "", x0 = .5, x1 = 3.1, y0 = .3, y1 = 7.4;
        s += box(x0, y0, 0, x1 - x0, y1 - y0, .22, { top: "#8E98A3", left: "#C9D1D9", right: "#A9B3BE" });
        var lx0 = x0 + .38, lx1 = x1 - .38;
        s += F(D([[lx0, y0, .22], [lx1, y0, .22], [lx1, y1, .22], [lx0, y1, .22]]), o.snow ? "#F2F6FA" : "#EBC991");
        for (var i = 1; i < 6; i++) s += L(D([[lx0 + i * (lx1 - lx0) / 6, y0 + 1.2, .22], [lx0 + i * (lx1 - lx0) / 6, y1, .22]], true), .6, o.snow ? "#D6E2EC" : "#C9A26A", .8);
        s += O(D([[lx0, y0, .22], [lx1, y0, .22], [lx1, y1, .22], [lx0, y1, .22]]), 1.2);
        [.25, .5, .75].forEach(function(t, k){ var x = lx0 + (lx1 - lx0) * t, y = y1 - 2.4 - (k === 1 ? .3 : 0); s += FO(D([[x, y - .35, .22], [x + .12, y, .22], [x - .12, y, .22]]), K.red, .8); });
        s += L(D([[lx0, y1 - .9, .22], [lx1, y1 - .9, .22]], true), 1.6, K.red);
        s += box(x0, y0 - .3, 0, x1 - x0, .3, 1.9, { top: "#6B5A68", left: "#3B2E3A", right: "#2B2230" });
        s += FO(D(onY(y0, rectUV(x0 + .3, x1 - .3, 1.2, 1.8))), "#E0457B", 1.2) + tinyTooth.apply(null, P((x0 + x1) / 2, y0, 1.5).concat([.42, "#FFFFFF"]));
        var cx = (lx0 + lx1) / 2, rows = [[0], [-.5, .5], [-1, 0, 1], [-1.5, -.5, .5, 1.5]], pins = [];
        rows.forEach(function(r, k){ r.forEach(function(px){ pins.push([cx + px * .36, y0 + 1.6 - k * .34]); }); });
        pins.sort(function(a, b){ return a[1] - b[1] || a[0] - b[0]; });
        s += G("tp-pins", pins.map(function(q){ var p = P(q[0], q[1], .22); return pin(p[0], p[1]); }).join(""));
        var bp = P(cx + .3, y1 - .5, .22);
        s += G("tp-ball", mintBall(bp[0], bp[1] - 4.4, 4.6));
        s += box(x1 + .05, y1 - 1.6, 0, .4, 1.2, .55, { top: "#6B5A68", left: "#8E98A3", right: "#6B5A68" }, { sw: 1.4, si: .9 });
        var rb = P(x1 + .25, y1 - 1.0, .55);
        return s + circ(rb[0], rb[1] - 2.4, 2.8, K.blue, 1.2);
      }
    },
    mailbox: {
      n: "A mailbox", note: "Its flag goes up when there's a letter", rarity: "Common", theme: "hilltop", price: 100, id: "mailbox", spot: [3.0, 3.3],
      draw: function(o){
        var b = P(1.7, 1.9, 0), x = b[0], y = b[1], s = "";
        s += ell(x, y, 15, 6.4, o.snow ? "#FFFFFF" : K.soil, 1.3);
        if (!o.snow) [[-9, -1, "#FF8FB1"], [-4, 3, "#FFE27A"], [6, 2.4, "#B08CFF"], [10, -1.6, "#FF8FB1"], [1, -3.6, "#FFE27A"]].forEach(function(q){ s += flower(x + q[0], y + q[1], q[2], 1); });
        s += L("M" + f(x) + " " + f(y) + " v-22", 4.4) + L("M" + f(x) + " " + f(y) + " v-22", 2.4, K.wood);
        var bx = "M" + f(x - 9) + " " + f(y - 20) + " v-7 a9 6.4 0 0 1 18 0 v7 z";
        s += F(bx, K.blue) + F("M" + f(x + 3) + " " + f(y - 20) + " v-9.6 a9 6.4 0 0 1 6 3 v6.6 z", "#2378B0") + O(bx, 1.6);
        if (o.snow) s += F("M" + f(x - 9) + " " + f(y - 27) + " a9 6.4 0 0 1 18 0 q-9 -2 -18 0 z", "#FFFFFF");
        s += tinyTooth(x - 3, y - 24, .5, "#FFFFFF");
        return s + G("tp-mflag", FO("M" + f(x + 9) + " " + f(y - 21) + " v-9 l6 2.4 -6 2.4", K.red, 1.1));
      },
      bits: function(){ var b = P(1.7, 1.9, 0); return FO("M" + f(b[0] - 6) + " " + f(b[1] - 38) + " h12 v8 h-12 z", "#FFFFFF", 1.2) + L("M" + f(b[0] - 6) + " " + f(b[1] - 38) + " l6 4.4 6 -4.4", 1) + circ(b[0], b[1] - 33.6, 1.2, K.red); }
    },
    sandcastle: {
      n: "A sandcastle", note: "Four towers, a flag and a bucket", rarity: "Common", theme: "seaside", price: 150, id: "sandcastle", spot: [3.3, 3.2],
      draw: function(o){
        var sand = o.snow ? ["#FFFFFF", "#DCEAF6"] : o.night ? ["#B3A27A", "#958560"] : ["#F3D99C", "#D9B970"], s = "", c = P(1.8, 1.8, 0), st = { top: sand[0], left: sand[0], right: sand[1] };
        s += ell(c[0], c[1] + 2, 31, 13.4, sand[1], 1.6) + ell(c[0], c[1], 28, 11.4, sand[0], 0);
        var tw = function(x, y, h){ var t = P(x, y, h), out = cyl(x, y, 0, .42, h, .4, sand[0], sand[1], sand[0], { sw: 1.4, si: 1 }); for (var k = 0; k < 3; k++){ var a = (20 + k * 50) * Math.PI / 180, q = P(x + Math.cos(a) * .36, y + Math.sin(a) * .36, h); out += FO("M" + f(q[0] - 1.4) + " " + f(q[1]) + " v-2.6 h2.8 v2.6 z", sand[0], .9); } return out; };
        s += tw(.95, 1.0, 1.2) + tw(2.65, 1.0, 1.1);
        s += box(1.0, 1.05, 0, 1.7, 1.6, .75, st, { sw: 1.4, si: .9 });
        s += FO(D(onY(2.65, archUV(1.6, 2.1, 0, .55, 6))), o.night ? "#6B5A3A" : "#8A6A3A", 1);
        s += tw(.95, 2.65, 1.0) + tw(2.65, 2.65, 1.45);
        var fp = P(2.65, 2.65, 1.45); s += L("M" + f(fp[0]) + " " + f(fp[1] - 2) + " v-10", 1.2) + FO("M" + f(fp[0]) + " " + f(fp[1] - 12) + " l6 2 -6 2 z", K.red, .9);
        var bk = P(3.15, 3.05, 0); s += FO("M" + f(bk[0] - 4) + " " + f(bk[1]) + " l-1 -6 h10 l-1 6 q-4 1.6 -8 0 z", K.blue, 1.2) + L("M" + f(bk[0] - 4.6) + " " + f(bk[1] - 6) + " q4.6 -5 9.4 0", 1) + L("M" + f(bk[0] + 6) + " " + f(bk[1] - 1) + " l5 -9", 2.4) + L("M" + f(bk[0] + 6) + " " + f(bk[1] - 1) + " l5 -9", 1.1, K.yellow);
        return s;
      },
      bits: function(){ var c = P(.6, 2.6, 0); return T(c[0], c[1], ell(0, 0, 4, 2.6, K.red, 1.1) + circ(-1.3, -2.4, .7, INK) + circ(1.3, -2.4, .7, INK) + L("M-4 0 l-2 1.6 M4 0 l2 1.6", 1)); }
    },
    umbrella: {
      n: "A beach umbrella", note: "Striped, with two deck chairs and a towel", rarity: "Uncommon", theme: "seaside", price: 350, id: "beach-umbrella", spot: [3.3, 3.2],
      draw: function(o){
        var s = "", stripe = o.night ? "#B8323A" : K.red;
        s += FO(D([[.4, 2.3, 0], [2.1, 2.3, 0], [2.1, 3.4, 0], [.4, 3.4, 0]]), K.yellow, 1.2) + L(D([[.8, 2.3, 0], [.8, 3.4, 0]], true) + D([[1.7, 2.3, 0], [1.7, 3.4, 0]], true), 1.4, "#FFFFFF");
        var chair = function(x, y){ var seat = [[x, y, .3], [x + .85, y, .3], [x + .85, y - 1.1, 1.1], [x, y - 1.1, 1.1]];
          return L(D([[x, y + .2, 0], [x, y, .3], [x, y - 1.1, 1.1], [x, y - 1.4, 0]], true), 2.4) + L(D([[x + .85, y + .2, 0], [x + .85, y, .3], [x + .85, y - 1.1, 1.1], [x + .85, y - 1.4, 0]], true), 2.4) +
            F(D(seat), "#FFFFFF") + F(D([[x + .28, y, .3], [x + .56, y, .3], [x + .56, y - 1.1, 1.1], [x + .28, y - 1.1, 1.1]]), K.blue) + O(D(seat), 1.4); };
        s += chair(2.4, 2.0) + chair(2.6, 3.3);
        var cx = 1.5, cy = 1.4, z1 = 3.4, z0 = 2.7, r = 1.6, pb = P(cx, cy, 0), pt = P(cx, cy, z1);
        s += L(seg(pb, pt), 3) + L(seg(pb, pt), 1.4, "#FFFFFF");
        s += cone(cx, cy, z0, r, z1, "#FFFFFF", "#E3E6EA");
        var tip = P(cx, cy, z1);
        for (var k = 0; k < 6; k++){ var a0 = (-45 + 30 * k) * Math.PI / 180, a1 = (-45 + 30 * k + 15) * Math.PI / 180, q0 = P(cx + Math.cos(a0) * r, cy + Math.sin(a0) * r, z0), q1 = P(cx + Math.cos(a1) * r, cy + Math.sin(a1) * r, z0); s += F("M" + f(tip[0]) + " " + f(tip[1]) + " L" + f(q0[0]) + " " + f(q0[1]) + " L" + f(q1[0]) + " " + f(q1[1]) + " Z", stripe); }
        var b = P(cx, cy, z0), ax = RX(r), ay = RY(r);
        s += O("M" + f(tip[0]) + " " + f(tip[1]) + " L" + f(b[0] - ax) + " " + f(b[1]) + " A" + f(ax) + " " + f(ay) + " 0 0 0 " + f(b[0] + ax) + " " + f(b[1]) + " Z") + circ(tip[0], tip[1] - 1, 1.6, K.yellow, 1);
        return s;
      }
    },
    campfire: {
      n: "A campfire", note: "A ring of stones, logs to sit on, a crackling fire", rarity: "Uncommon", theme: "woodland", price: 400, id: "campfire", spot: [3.2, 3.2],
      draw: function(o){
        var c = P(1.8, 1.8, 0), s = "";
        var log = function(a, b){ var p = P(a[0], a[1], .25), q = P(b[0], b[1], .25); return L(seg(p, q), 8) + L(seg(p, q), 5.6, K.wood) + L(seg(p, q), 1, K.woodShade) + ell(q[0], q[1], 3, 2.6, K.woodLight, 1.1); };
        s += log([.3, .6], [1.6, .3]) + log([.4, 2.4], [.5, 3.5]);
        var st = []; for (var i = 0; i < 9; i++){ var a = i / 9 * Math.PI * 2; st.push([1.8 + Math.cos(a) * .78, 1.8 + Math.sin(a) * .78]); }
        st.sort(function(p, q){ return p[0] + p[1] - q[0] - q[1]; });
        var back = st.slice(0, 4), front = st.slice(4);
        back.forEach(function(q){ var p = P(q[0], q[1], 0); s += ell(p[0], p[1] - 1, 3.6, 2.6, o.snow ? "#E3ECF5" : "#B6BEC7", 1.1); });
        s += ell(c[0], c[1], 9, 4.4, "#3B2E3A", 0, .55);
        s += L("M" + f(c[0] - 7) + " " + f(c[1] + 1) + " L" + f(c[0] + 6) + " " + f(c[1] - 3), 4) + L("M" + f(c[0] - 7) + " " + f(c[1] + 1) + " L" + f(c[0] + 6) + " " + f(c[1] - 3), 2.2, K.woodShade) + L("M" + f(c[0] - 6) + " " + f(c[1] - 3) + " L" + f(c[0] + 7) + " " + f(c[1] + 1), 4) + L("M" + f(c[0] - 6) + " " + f(c[1] - 3) + " L" + f(c[0] + 7) + " " + f(c[1] + 1), 2.2, K.wood);
        s += G("tp-flame", FO("M" + f(c[0]) + " " + f(c[1] - 22) + " q9 9 4 18 q-4 3 -8 0 q-5 -8 4 -18 z", K.orange, 1.2) + F("M" + f(c[0]) + " " + f(c[1] - 14) + " q4 5 2 10 h-4 q-2 -5 2 -10 z", K.yellow));
        front.forEach(function(q){ var p = P(q[0], q[1], 0); s += ell(p[0], p[1] - 1, 3.6, 2.6, o.snow ? "#E3ECF5" : "#B6BEC7", 1.1); });
        return s;
      },
      lights: function(){ var c = P(1.8, 1.8, 0); return glowAt(c[0], c[1] - 10, 22) + G("tp-flame", F("M" + f(c[0]) + " " + f(c[1] - 22) + " q9 9 4 18 q-4 3 -8 0 q-5 -8 4 -18 z", K.orange) + F("M" + f(c[0]) + " " + f(c[1] - 14) + " q4 5 2 10 h-4 q-2 -5 2 -10 z", K.yellow)); },
      bits: function(){ var c = P(1.8, 1.8, 0); return G("tp-sparks", circ(c[0] - 4, c[1] - 24, 1.3, K.yellow) + circ(c[0] + 3, c[1] - 28, 1.1, K.orange) + circ(c[0], c[1] - 32, 1.4, K.yellow) + circ(c[0] + 6, c[1] - 22, 1, K.yellow)); }
    },
    hotspring: {
      n: "A hot spring", note: "Warm water in a ring of rocks, steaming", rarity: "Epic", theme: "snowy", price: 2200, id: "hot-spring", spot: [3.4, 2.6],
      draw: function(o){
        var c = P(1.8, 1.8, 0), s = "";
        s += F(lumps(c[0], c[1] + 2, 33, 5, 11, .56), o.night ? "#5A6585" : "#8E98A3") + O(lumps(c[0], c[1] + 2, 33, 5, 11, .56), 1.6);
        var rk = []; for (var i = 0; i < 11; i++){ var a = i / 11 * Math.PI * 2; rk.push([c[0] + Math.cos(a) * 28, c[1] + Math.sin(a) * 14]); }
        rk.forEach(function(q, i){ if (q[1] < c[1]) s += ell(q[0], q[1], 6, 4, i % 2 ? "#B6BEC7" : "#C9D1D9", 1.2); });
        s += FO(lumps(c[0], c[1], 24, 7, 10, .52), o.night ? "#4FA3A8" : "#8FE3D9", 1.4);
        s += G("tp-water", L("M" + f(c[0] - 12) + " " + f(c[1] - 1) + " q4 -2 8 0 M" + f(c[0] + 2) + " " + f(c[1] + 3) + " q4 -2 8 0", 1.2, "#FFFFFF", .8));
        s += G("tp-bob", FO("M" + f(c[0] + 6) + " " + f(c[1] - 1) + " q0 -4 4 -4 q2 -4 5 -1 q1 2 -1 3 l1 2 q0 3 -4 3 q-5 0 -5 -3 z", K.yellow, 1.1) + F("M" + f(c[0] + 15) + " " + f(c[1] - 4) + " l3 .6 -3 1 z", K.orange) + circ(c[0] + 12.6, c[1] - 5.4, .6, INK));
        rk.forEach(function(q, i){ if (q[1] >= c[1]) s += ell(q[0], q[1], 6.4, 4.2, i % 2 ? "#B6BEC7" : "#C9D1D9", 1.2) + (o.snow ? F("M" + f(q[0] - 5) + " " + f(q[1] - 2) + " q5 -4 10 0 z", "#FFFFFF") : ""); });
        var tw = P(3.2, .6, 0); s += box(3.0, .4, 0, .7, .5, .32, { top: K.red, left: "#E5484D", right: K.redShade }, { sw: 1.2, si: .8 }) + L("M" + f(tw[0] - 3) + " " + f(tw[1] - 4) + " h6", 1, "#FFFFFF");
        s += G("tp-steam", L("M" + f(c[0] - 10) + " " + f(c[1] - 6) + " c-4 -5 4 -8 0 -13", 2.2, "#FFFFFF", .8) + L("M" + f(c[0]) + " " + f(c[1] - 8) + " c-4 -5 4 -8 0 -13", 2.2, "#FFFFFF", .8) + L("M" + f(c[0] + 10) + " " + f(c[1] - 6) + " c-4 -5 4 -8 0 -13", 2.2, "#FFFFFF", .8));
        return s;
      },
      bits: function(){ var c = P(1.8, 1.8, 0); return G("tp-sparks", circ(c[0] - 6, c[1] - 4, 1.6, "#FFFFFF", .7) + circ(c[0] + 1, c[1] - 6, 1.2, "#FFFFFF", .7) + circ(c[0] - 2, c[1] - 9, 1.4, "#FFFFFF", .7)); }
    },
    telescope: {
      n: "A telescope", note: "Brass, on a tripod, pointed at the stars", rarity: "Rare", theme: "starlight", price: 1000, id: "telescope", spot: [3.3, 3.0],
      draw: function(o){
        var c = P(1.7, 1.7, 0), s = "", top = [c[0], c[1] - 24];
        s += ell(c[0], c[1], 27, 12.4, "#6E50B8", 1.4) + ell(c[0], c[1], 21, 9, "#9B7BE0", 0) + dmStar(c[0] - 10, c[1] + 1, 2.4, "#FFE27A", "") + dmStar(c[0] + 12, c[1] - 2, 2, "#FFFFFF", "");
        s += L("M" + f(top[0]) + " " + f(top[1]) + " L" + f(c[0] - 13) + " " + f(c[1] + 3) + " M" + f(top[0]) + " " + f(top[1]) + " L" + f(c[0] + 12) + " " + f(c[1] + 4) + " M" + f(top[0]) + " " + f(top[1]) + " L" + f(c[0] + 2) + " " + f(c[1] - 7), 3) +
          L("M" + f(top[0]) + " " + f(top[1]) + " L" + f(c[0] - 13) + " " + f(c[1] + 3) + " M" + f(top[0]) + " " + f(top[1]) + " L" + f(c[0] + 12) + " " + f(c[1] + 4) + " M" + f(top[0]) + " " + f(top[1]) + " L" + f(c[0] + 2) + " " + f(c[1] - 7), 1.4, K.wood);
        var t0 = [top[0] - 12, top[1] + 7], t1 = [top[0] + 16, top[1] - 11];
        s += L(seg(t0, t1), 9.4) + L(seg(t0, t1), 6.8, "#E8BE45") + L(seg([t0[0] + 2, t0[1] - 2.6], [t1[0] - 4, t1[1] - .4]), 1.4, "#FFF0B3");
        s += L(seg([t0[0] + 9, t0[1] - 9], [t0[0] + 12.6, t0[1] - 4]), 1.6, K.goldShade) + ell(t1[0], t1[1], 3.4, 4.4, "#7FCDEB", 1.3) + circ(t0[0], t0[1], 2.4, "#3B2E3A", 1);
        s += circ(top[0], top[1], 2.4, K.goldShade, 1);
        return s;
      },
      bits: function(){ var c = P(1.7, 1.7, 0); return dmStar(c[0] + 30, c[1] - 52, 6, "#FFE27A", "tp-twinkle") + dmStar(c[0] + 40, c[1] - 44, 3, "#FFFFFF", "tp-twinkle", .4); }
    }
  };
  Object.keys(YARD).forEach(function(k){ YARD[k].k = k; });

  /* ------------------------------------------------------------------ what students earn --------------------------- */
  /* the rank: a statue of the journey's object by the door, in the tier's material, on one step per level */
  var MATS = [
    { k: "stone",   n: "Stone",       c: "#C4BEB4", s: "#968F84", h: "#E3DFD8" },
    { k: "antique", n: "Antique",     c: "#B5874E", s: "#83592C", h: "#DDBB8A", pat: "#7FA38A" },
    { k: "bronze",  n: "Bronze",      c: "#D08A4E", s: "#9C5C28", h: "#F0B98A" },
    { k: "silver",  n: "Silver",      c: "#DCE2E8", s: "#9FAAB6", h: "#FFFFFF" },
    { k: "gold",    n: "Gold",        c: "#F2C94C", s: "#C9971C", h: "#FFF0B3" },
    { k: "diamond", n: "Diamond",     c: "#CFF1FF", s: "#7FCDEB", h: "#FFFFFF" },
    { k: "dark",    n: "Dark Matter", c: "#4A2A8C", s: "#2A0F5C", h: "#B57BFF" }
  ];
  /* a high-speed handpiece standing on its end: the handle, the neck bent forward, the head with its bur (24 px tall) */
  function handpiece(m, o){
    var s = "", body = "M-3.4 0 L-2.8 -14 Q-2.6 -18 -1.8 -20 L1.9 -20 Q2.7 -18 2.8 -14 L3.4 0 Z";
    if (m.k === "dark") s += circ(0, -12, 15, m.h, 0).replace("/>", ' opacity=".22" class="tp-twinkle"/>');
    s += F(body, m.c) + F("M.8 0 L1 -14 Q1.1 -18 1 -20 L1.9 -20 Q2.7 -18 2.8 -14 L3.4 0 Z", m.s) + O(body, 1.4);
    s += L("M-3 -5.4 h6.2 M-2.9 -7.6 h5.9", .9, INK, .55);
    var neck = "M-1.6 -20 L1.8 -20 L5.6 -25.6 L2.6 -27.4 Z";
    s += FO(neck, m.c, 1.3) + F("M1.8 -20 L5.6 -25.6 L4.2 -26.5 L.8 -20.6 Z", m.s);
    /* the head: a short drum across the neck's end, its bur pointing down and forward */
    var head = "M2.6 -27.4 L5.6 -25.6 L7.2 -28.2 L4.2 -30 Z";
    s += FO("M1.6 -27 Q1.4 -30.8 4.6 -31.6 Q8.4 -31.8 8.4 -28.2 L7.2 -26 Q4 -24.6 1.6 -27 Z", m.c, 1.4) + F("M5.6 -25.8 L8 -28.4 Q8.4 -30.6 6.6 -31.4 Q8.6 -29 7.2 -26 Z", m.s) + head.replace(/.*/, "");
    s += L("M7 -26.4 L10.4 -22.4", 1.6) + circ(10.6, -22.2, .9, m.k === "dark" ? m.h : "#E8BE45");
    s += L("M-1.6 -3 L-1.2 -16", 1, m.h, .9);
    if (m.k === "antique") s += circ(-1.4, -9, .9, m.pat) + circ(1.6, -4, .7, m.pat);
    if (m.k === "diamond") s += L("M-2.4 -2 L2 -12 M-1 -15 L2.4 -6", .7, "#FFFFFF");
    if (m.k === "dark") s += circ(-1, -6, .5, "#FFFFFF") + circ(1.4, -12, .6, K.dmTeal) + circ(-.6, -16, .4, "#FFFFFF");
    if (m.k === "gold" || m.k === "diamond" || m.k === "dark") s += dmStar(-6, -22, 2.6, "#FFFFFF", "tp-twinkle", .6);
    return s;
  }
  function statue(x, y, z, tier, level, o){
    var m = MATS[tier] || MATS[0], s = "", lv = Math.max(1, Math.min(3, level || 1)), st = { top: K.stone, left: "#E3E8EC", right: K.stoneShade };
    s += ell.apply(null, P(x + .3, y + .2, z).concat([12, 4.2, "#000", 0, .12]));
    for (var i = 0; i < lv; i++){ var w = 1.1 - i * .24; s += box(x - w / 2, y - w / 2, z + i * .28, w, w, .28, st, { sw: 1.3, si: .8 }); }
    var zt = z + lv * .28;
    if (o.snow) s += F(D([[x - .3, y - .3, zt], [x + .3, y - .3, zt], [x + .3, y + .3, zt], [x - .3, y + .3, zt]]), "#FFFFFF");
    var t = P(x, y, zt);
    s += T(t[0], t[1] - 1, handpiece(m, o));
    var glint = L("M" + f(t[0] - 4) + " " + f(t[1] - 6) + " l6 -14", 2.2, "#FFFFFF") + dmStar(t[0] + 6, t[1] - 30, 4, "#FFFFFF", "");
    return { s: egg("statue", s, glint), lights: o.night && tier >= 4 ? glowAt(t[0], t[1] - 14, 12) : "" };
  }
  /* mastery: one pennant per hub medal in the bunting along the home's eaves (Bronze, Silver, Gold; a Crown is gold with
     a white crown mark), the hub's tint as a dot when the page gives it */
  function bunting(h, flair, o){
    var e = h.eaves; if (!e || !flair.length) return "";
    var a = P.apply(null, e[0]), b = P.apply(null, e[1]), sag = (e[2] || 4) + 6, list = flair.slice().sort(function(p, q){ return q.lvl - p.lvl; }).slice(0, 6), n = list.length;
    var pt = function(t){ return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t + Math.sin(t * Math.PI) * sag]; };
    var line = []; for (var i = 0; i <= 20; i++) line.push(pt(i / 20));
    var s = L(D2(line, true), 1, "#5B4A57");
    list.forEach(function(fl, i){
      var t = (i + 1) / (n + 1), p = pt(t - .04), q = pt(t + .04), m = pt(t), lvl = Math.max(1, Math.min(4, fl.lvl | 0));
      var d = "M" + f(p[0]) + " " + f(p[1]) + " L" + f(q[0]) + " " + f(q[1]) + " L" + f(m[0]) + " " + f(m[1] + 10) + " Z";
      var g = FO(d, PEN[lvl], 1);
      if (lvl >= 4) g += '<path d="M' + f(m[0] - 2.6) + " " + f(m[1] + 4.4) + ' l.4 -2.4 1 1.1 .8 -1.8 .8 1.8 1 -1.1 .4 2.4 Z" fill="#fff"/>';
      else if (fl.tint) g += circ(m[0], m[1] + 3.4, 1.4, fl.tint, .6);
      s += '<g class="tp-pen" style="animation-delay:' + f(i * .25) + 's">' + g + "</g>";
    });
    return egg("bunting", s);
  }

  /* ------------------------------------------------------------------ the fixed pieces ----------------------------- */
  function toothbrush(x, y){
    var b = P(x, y, 0);
    var s = T(b[0], b[1], '<g transform="rotate(-6) scale(.62)">' +
      FO("M-4.4 0 C-4.8 -16 -4.2 -30 -2.4 -42 L-1.6 -54 L1.6 -54 L2.4 -42 C4.2 -30 4.8 -16 4.4 0 Z", "#8FD3F5", 2.4) + F("M-2.8 -12 C-3 -20 -2.6 -26 -1.8 -32 L1.8 -32 C2.6 -26 3 -20 2.8 -12 Z", K.blue) +
      FO("M-3 -54 L-3 -73 Q-3 -76.6 0 -76.6 Q3 -76.6 3 -73 L3 -54 Z", "#8FD3F5", 2.4) +
      [-74, -70, -66, -62, -58].map(function(yy, i){ return FO("M3 " + yy + " h9.5 v3.2 h-9.5 z", i % 2 ? K.green : "#FFFFFF", 1.3); }).join("") +
      FO("M4.5 -74.4 C3.8 -77.4 6.2 -79.6 8.4 -78.4 C9.4 -80.8 13 -80.4 13.2 -77.8 C15.2 -77.4 15 -74.6 13 -74.2 Z", "#FFFFFF", 1.5) + "</g>");
    return egg("brush", s, dmStar(b[0] + 12, b[1] - 50, 3.4, "#FFFFFF", "") + dmStar(b[0] - 8, b[1] - 40, 2.6, K.blue, ""));
  }
  function snowman(x, y){
    var b = P(x, y, 0);
    return T(b[0], b[1], ell(0, 0, 11, 2, "#C9DDEE", 0) +
      L("M-6 -20 L-15 -27 M6 -20 L15 -27", 1.3, "#6B4A2B") + circ(0, -8, 8.4, "#FFFFFF", 1.6) + circ(0, -19.4, 6.4, "#FFFFFF", 1.6) + circ(0, -29, 5, "#FFFFFF", 1.6) +
      FO("M-4.6 -24.8 Q0 -22.4 4.6 -24.8 L4.6 -22.6 Q0 -20.4 -4.6 -22.6 Z M2.6 -23 L4.6 -17 L1.2 -17.4 Z", "#D6363C", .9) +
      circ(-1.7, -30, .75, INK) + circ(1.7, -30, .75, INK) + circ(0, -18.8, .8, INK) + circ(0, -15.4, .8, INK) + F("M0 -28.4 L5.4 -27.4 L0 -26.8 Z", K.orange) +
      FO("M-5.6 -34.4 h11.2 v1.6 h-11.2 z M-3.6 -40.4 h7.2 v6.4 h-7.2 z", "#2B2B2B", .6) + F("M-3.6 -36.6 h7.2 v1.3 h-7.2 z", "#D6363C"));
  }
  function holidayGround(h){
    var b = P(FIX.holiday[0], FIX.holiday[1], 0), s = "", W = function(x, y, inner){ return '<g transform="translate(' + f(x) + " " + f(y) + ') scale(1.35)">' + inner + "</g>"; };
    if (h === "halloween") s = W(b[0], b[1], FO("M-8 -1 a8 6.4 0 1 0 16 0 a8 6.4 0 1 0 -16 0 z", K.orange, 1.6) + L("M-3 -7 Q0 -3 3 -7", 1.2, "#C2650E") + L("M0 -7 L1 -10", 2, "#3B7A2A") +
      F("M-4.6 -2.6 L-2.4 -4.4 L-1.4 -2 Z M4.6 -2.6 L2.4 -4.4 L1.4 -2 Z M-4 1 Q0 4 4 1 L2.6 1.8 L1.4 .8 L0 2 L-1.4 .8 L-2.6 1.8 Z", K.yellow));
    if (h === "thanksgiving") s = W(b[0], b[1], ell(-3, -3, 7, 5.4, "#E58E26", 1.4) + ell(7, -2, 5.4, 4.2, "#D9A441", 1.4) + L("M-3 -8.4 v-3 M7 -6.2 v-2.6", 1.6, "#5B3A1A") + ell(-10, 0, 4, 3, "#C2410C", 1.2));
    if (h === "easter") s = W(b[0], b[1], [[-8, 0, "#FFB3C7"], [0, 2, "#B5E3FF"], [8, -1, "#FFE58F"], [14, 3, "#C3F0CA"]].map(function(e){ return ell(e[0], e[1] - 4, 3.4, 4.4, e[2], 1.2) + L("M" + (e[0] - 3.2) + " " + (e[1] - 4) + " q1.6 -1.4 3.2 0 t3.2 0", 1, "#FFFFFF"); }).join(""));
    if (h === "stpatrick") s = W(b[0], b[1], FO("M-8 -4 Q-9 6 0 6 Q9 6 8 -4 Z", "#2B2B2B", 1.4) + FO("M-8.4 -4 a8.4 2.6 0 1 0 16.8 0 a8.4 2.6 0 1 0 -16.8 0 z", "#F6CD55", 1.2) + circ(-3, -6, 1.6, "#F6CD55") + circ(2, -6.4, 1.6, "#F6CD55"));
    if (h === "valentine" || h === "dentist") s = W(b[0], b[1], L("M0 0 Q-2 -16 4 -26", .9, "#555") + (h === "valentine" ? FO("M4 -26 c-6 -4 -9 -8 -9 -11 a4.5 4.5 0 0 1 9 -2 a4.5 4.5 0 0 1 9 2 c0 3 -3 7 -9 11 z", "#E0457B", 1.4)
      : FO("M4 -40 a6.4 7.6 0 1 0 .1 0 z", "#8FD3F5", 1.4) + tinyTooth(4, -32, .7, "#FFFFFF")));
    if (h === "newyear") s = W(b[0], b[1], FO("M-4 0 v-12 h8 v12 z", "#2B2B2B", 1.2) + F("M-4 -9 h8 v3 h-8 z", "#F6CD55") + L("M0 -12 v-4", 1.6, "#F6CD55"));
    return s;
  }
  function holidaySky(h){
    if (h === "stpatrick") return G("", ["#E5484D", "#F59A1E", "#F5D21E", "#3ECF7E", "#3FA7E0"].map(function(c, i){ return L("M" + (20 + i * 6) + " 150 A" + (90 - i * 6) + " " + (90 - i * 6) + " 0 0 1 " + (200 - i * 6) + " 150", 5, c, .75); }).join(""));
    if (h === "newyear") return G("tp-fw", L("M300 40 v-10 M300 40 l7 -6 M300 40 l9 3 M300 40 l3 9 M300 40 l-6 7 M300 40 l-9 1 M300 40 l-6 -7", 1.8, "#F6CD55") + L("M240 60 v-8 M240 60 l6 -5 M240 60 l7 3 M240 60 l2 8 M240 60 l-5 6 M240 60 l-8 1 M240 60 l-5 -6", 1.8, "#E0457B"));
    if (h === "halloween") return G("tp-bat", F("M120 40 c2 -3 4 -3 5 -1 l1 -2 1 2 c1 -2 3 -2 5 1 c-2 0 -3 1 -3 3 c-1 -1 -2 -1 -3 0 c-1 -1 -2 -1 -3 0 c0 -2 -1 -3 -3 -3 z M280 64 c2 -3 4 -3 5 -1 l1 -2 1 2 c1 -2 3 -2 5 1 c-2 0 -3 1 -3 3 c-1 -1 -2 -1 -3 0 c-1 -1 -2 -1 -3 0 c0 -2 -1 -3 -3 -3 z", "#2B1B3D"));
    if (h === "winter") return G("tp-snowfall", flakes(rng(51), 22));
    return "";
  }
  function eaveLights(eaves){
    if (!eaves) return "";
    var a = P.apply(null, eaves[0]), b = P.apply(null, eaves[1]), sag = eaves[2] || 4, n = sag > 10 ? 16 : 10, line = [];
    for (var j = 0; j <= 24; j++){ var tt = j / 24; line.push([a[0] + (b[0] - a[0]) * tt, a[1] + (b[1] - a[1]) * tt + Math.sin(tt * Math.PI) * sag]); }
    var s = L(D2(line, true), .8, "#333");
    for (var i = 0; i <= n; i++){ var t = i / n, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t + Math.sin(t * Math.PI) * sag + 1.6; s += '<circle class="tp-twinkle" cx="' + f(x) + '" cy="' + f(y) + '" r="1.7" fill="' + ["#E5484D", "#F5D21E", "#3ECF7E", "#3FA7E0"][i % 4] + '" style="animation-delay:' + f(i * .2) + 's"/>'; }
    return s;
  }
  function slotPoly(k, wide){ var sl = SLOTS[k], d = wide ? 7.5 : S; return D([[sl.x, sl.y, 0], [sl.x + S, sl.y, 0], [sl.x + S, sl.y + d, 0], [sl.x, sl.y + d, 0]]); }
  function emptySlot(k){
    var sl = SLOTS[k], c = P(sl.x + S / 2, sl.y + S / 2, 0);
    return '<ellipse class="tp-mark" cx="' + f(c[0]) + '" cy="' + f(c[1]) + '" rx="' + f(RX(1.55)) + '" ry="' + f(RY(1.55)) + '" fill="#FFFFFF" fill-opacity=".18" stroke="#FFFFFF" stroke-width="1.6" stroke-dasharray="3 4" opacity=".8"/>';
  }

  /* ------------------------------------------------------------------ the layout and Timmy's way round it ---------- */
  function normYard(y){
    var yard = {}, k; for (k in (y || {})) yard[k] = y[k];
    if (yard.side && YARD[yard.side] && YARD[yard.side].wide) delete yard.corner;
    if (yard.corner && YARD[yard.corner] && YARD[yard.corner].wide){ yard.side = yard.corner; delete yard.corner; }
    for (k in yard) if (!SLOTS[k] || !YARD[yard[k]] || (YARD[yard[k]].wide && k !== "side")) delete yard[k];
    return yard;
  }
  function layout(o){
    o = o || {};
    var home = HOMES[o.home] || HOMES.cottage, sc = SCENES[o.scene] || SCENES.hill, yard = normYard(o.yard), spots = {}, obs = [], k;
    for (k in home.spots){ var p = home.spots[k]; spots[k] = [p[0], p[1], p[2] || 0]; }
    spots.lawn = [FIX.lawn[0], FIX.lawn[1], 0];
    SLOT_ORDER.forEach(function(k){ var id = yard[k]; if (!id) return; var it = YARD[id], sl = SLOTS[k]; spots[k] = [sl.x + it.spot[0], sl.y + it.spot[1], 0];
      obs.push([sl.x + .45, sl.y + .45, sl.x + S - .45, sl.y + (it.wide ? 7.5 : S) - .45]); });
    obs.push(home.block);
    if (home.porchBlock && o.up && o.up.porch) obs.push(home.porchBlock);
    var st = home.statue || FIX.statue, br = home.brush || FIX.brush;
    if (!st[2]) obs.push([st[0] - .55, st[1] - .55, st[0] + .55, st[1] + .55]);
    obs.push([br[0] - .25, br[1] - .25, br[0] + .25, br[1] + .25], [FIX.lamp[0] - .3, FIX.lamp[1] - .3, FIX.lamp[0] + .3, FIX.lamp[1] + .3], [FIX.tree[0] - .5, FIX.tree[1] - .5, FIX.tree[0] + .5, FIX.tree[1] + .5]);
    if (o.holiday) obs.push([FIX.holiday[0] - .5, FIX.holiday[1] - .5, FIX.holiday[0] + .5, FIX.holiday[1] + .5]);
    return { home: home, sc: sc, yard: yard, spots: spots, obs: obs };
  }
  var RING = [[5.5, 10.8], [5.5, 12.3], [5.5, 14.4], [8.6, 14.5], [12.1, 14.8], [14.8, 12.2], [14.7, 8.4], [14.6, 5.0], [14.4, 1.4], [9.95, 4.8], [9.95, 7.6], [8.5, 10.05], [3.0, 10.1], [2.0, 14.4], [-.4, 12.0], [-.3, 9.4],
    [10.3, 10.2], [10.3, 14.5], [12.1, 5.4], [10.1, 1.2]];
  function inRect(p, r){ return p[0] > r[0] && p[0] < r[2] && p[1] > r[1] && p[1] < r[3]; }
  function hits(a, b, r){
    /* does the segment a-b cross the rectangle r? (Liang-Barsky) */
    var t0 = 0, t1 = 1, dx = b[0] - a[0], dy = b[1] - a[1], pp = [-dx, dx, -dy, dy], qq = [a[0] - r[0], r[2] - a[0], a[1] - r[1], r[3] - a[1]];
    for (var i = 0; i < 4; i++){ if (pp[i] === 0){ if (qq[i] < 0) return false; } else { var t = qq[i] / pp[i]; if (pp[i] < 0){ if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; } } }
    return t1 - t0 > 1e-6;
  }
  /* Timmy's way from one spot to another: on the ground round the home and the yard things, up a ladder or steps for a
     raised spot. Points are on the yard ([x, y, z]); the page hops him along them. */
  function route(o, from, to){
    var Lo = layout(o), sp = Lo.spots, cl = Lo.home.climbs || {};
    var a = sp[from] || sp.door, b = sp[to] || sp.door, ca = cl[from], cb = cl[to];
    var start = ca ? ca[0] : a, end = cb ? cb[0] : b;
    var nodes = [start, end].concat(RING.filter(function(q){ return !Lo.obs.some(function(r){ return inRect(q, r); }); }));
    var clear = function(p, q){ return Lo.obs.every(function(r){ return inRect(p, r) || inRect(q, r) || !hits(p, q, r); }); };
    var n = nodes.length, dist = [], prev = [], done = [], i, j;
    for (i = 0; i < n; i++){ dist[i] = Infinity; prev[i] = -1; done[i] = false; }
    dist[0] = 0;
    for (var it = 0; it < n; it++){
      var u = -1; for (i = 0; i < n; i++) if (!done[i] && (u < 0 || dist[i] < dist[u])) u = i;
      if (u < 0 || dist[u] === Infinity) break; done[u] = true; if (u === 1) break;
      for (j = 0; j < n; j++){ if (done[j]) continue; var dx = nodes[j][0] - nodes[u][0], dy = nodes[j][1] - nodes[u][1], d = Math.sqrt(dx * dx + dy * dy);
        if (d > 8.5 || !clear(nodes[u], nodes[j])) continue; if (dist[u] + d < dist[j]){ dist[j] = dist[u] + d; prev[j] = u; } }
    }
    var path = [], blocked = false;
    if (prev[1] < 0 && start !== end){ path = [start, end]; blocked = true; }
    else { for (var v = 1; v >= 0; v = prev[v]){ path.unshift(nodes[v]); if (v === 0) break; } }
    path = path.map(function(q){ return [q[0], q[1], q[2] || 0]; });
    if (ca) path = ca.slice(1).reverse().map(function(q){ return [q[0], q[1], q[2] || 0]; }).concat(path);
    if (cb) path = path.concat(cb.slice(1).map(function(q){ return [q[0], q[1], q[2] || 0]; }));
    var out = []; path.forEach(function(q){ var l = out[out.length - 1]; if (!l || Math.abs(l[0] - q[0]) + Math.abs(l[1] - q[1]) + Math.abs(l[2] - q[2]) > .01) out.push(q); });
    if (blocked) out.blocked = true;
    return out;
  }

  /* ------------------------------------------------------------------ the render ----------------------------------- */
  /* o = { home, scene, night, yard: { left: "garden", ... }, up: { windows, porch, chimney, flag: true }, paint,
           tier 0-6 and level 1-3 (the rank: the statue's material and steps), flair [{ hub, lvl 1-4, tint }] (the bunting),
           season "", "fall", "winter", "spring", holiday (holidayId()), marks (dash the empty spots: the full view),
           timmy: { g: markup, at: spot } (a still picture with Timmy in it), viewBox, bare (a yard item on its own) }
     returns { svg, spots (screen [x, y]), plot (yard [x, y, z]), slots { name: path d }, homeHit, eggs [keys] }        */
  function render(o){
    o = o || {};
    EGGS_SEEN = [];
    var Lo = layout(o), home = Lo.home, sc = Lo.sc, yard = Lo.yard;
    var night = !!(o.night || sc.alwaysNight), H = o.holiday || "", tier = Math.max(0, Math.min(6, o.tier | 0)), flair = o.flair || [];
    var season = o.season || (H === "winter" ? "winter" : "");
    var snow = !!(sc.snowy || H === "winter");
    var up = {}; (home.ups || []).forEach(function(k){ if (o.up && o.up[k]) up[k] = true; });
    var so = { night: night, snow: snow, season: season, fall: season === "fall", spring: season === "spring" };
    var s = sc.sky(so);
    if (tier >= 6) s += G("", [[150, 30, 5], [196, 16, 7], [246, 30, 4.4], [118, 54, 3.4], [276, 54, 3.6]].map(function(p, i){ return dmStar(p[0], p[1], p[2], i % 2 ? K.dmTeal : K.dmLight, "tp-twinkle", i * .5); }).join("") +
      (night ? F("M70 84 Q140 40 200 58 Q262 76 330 40 L330 50 Q262 88 200 70 Q140 52 70 96 Z", K.dmLight, .22) + F("M70 98 Q140 58 200 74 Q262 90 330 58 L330 64 Q262 98 200 82 Q140 66 70 104 Z", K.dmTeal, .2) : ""));
    s += holidaySky(H === "winter" ? "" : H);
    s += sc.far(so) + sc.land(so) + sc.flat(so);
    if (season === "fall" && !snow && (sc === SCENES.hill || sc === SCENES.forest)) s += scatter(66, 12, function(sx, sy, x, y){ return sceneOn(sc, sx, sy) && !busy(x, y); }, function(sx, sy, i){ return F("M" + f(sx) + " " + f(sy) + " q2.4 -2.4 4.8 0 q-2.4 2.4 -4.8 0z", ["#E8A33D", "#D9622B", "#C2410C", "#F2C230"][i % 4], .9); }).join("");
    if (!o.bare) s += shadowOf(home) + pathAll(sc, home, so);
    if (o.marks) SLOT_ORDER.forEach(function(k){ if (!yard[k] && !(k === "corner" && yard.side && YARD[yard.side].wide)) s += emptySlot(k); });

    /* what stands on the ground, back to front */
    var items = [], lights = "";
    if (!o.bare){
      var drawn = home.draw({ night: night, up: up, paint: o.paint || "cream", fall: season === "fall", snow: snow });
      var hb = drawn.body + (H === "winter" ? eaveLights(home.eaves) : "") + bunting(home, flair, so);
      items.push({ z: 11, s: egg("home", hb, G("", dmStar.apply(null, P(5.5, 5.5, home.h - .6).concat([4, "#FFFFFF", ""])) + dmStar.apply(null, P(3.4, 6.6, home.h - 2).concat([3, "#FFE27A", ""])) + dmStar.apply(null, P(7.4, 4.4, home.h - 1.6).concat([3, "#FFFFFF", ""])))) });
      items.push({ z: 11.05, s: skirt(sc, home, so) });
      lights += drawn.lights;
      items.push({ z: FIX.tree[0] + FIX.tree[1], s: sceneTree(sc, so) });
      var st = home.statue || FIX.statue, stt = statue(st[0], st[1], st[2] || 0, tier, o.level || 1, so); items.push({ z: st[0] + st[1] + (st[2] ? 1.2 : .3), s: stt.s }); lights += stt.lights;
      var br = home.brush || FIX.brush; items.push({ z: br[0] + br[1], s: toothbrush(br[0], br[1]) });
      var lamp = lampFor(snow && sc.lamp === "post" ? "iron" : sc.lamp, so); items.push({ z: FIX.lamp[0] + FIX.lamp[1], s: lamp.s }); lights += lamp.lights;
      if (H && H !== "winter") items.push({ z: FIX.holiday[0] + FIX.holiday[1], s: holidayGround(H) });
      if (H === "winter") items.push({ z: FIX.holiday[0] + FIX.holiday[1], s: snowman(FIX.holiday[0], FIX.holiday[1]) });
      sc.props(so).forEach(function(p){ items.push({ z: p.x + p.y, s: p.s }); });
    }
    var spots = {}, plot = Lo.spots;
    function scr(q){ var a = P(q[0], q[1], q[2] || 0); return [f(a[0]), f(a[1])]; }
    for (var k in plot) spots[k] = scr(plot[k]);
    SLOT_ORDER.forEach(function(k){
      var id = yard[k]; if (!id) return;
      var it = YARD[id], sl = SLOTS[k];
      items.push({ z: sl.x + sl.y + S + (it.wide ? 2.4 : 0), s: '<g class="tp-item" data-slot="' + k + '">' + egg(id, at(sl.x, sl.y, 0, it.draw(so)), it.bits ? at(sl.x, sl.y, 0, it.bits(so)) : "") + "</g>" });
      if (it.lights && night) lights += at(sl.x, sl.y, 0, it.lights(so));
    });
    if (o.timmy && o.timmy.g){ var tp = plot[o.timmy.at] || plot.door, tq = P(tp[0], tp[1], tp[2] || 0); items.push({ z: tp[0] + tp[1] + .3, s: '<g class="tp-timmy" transform="translate(' + f(tq[0]) + " " + f(tq[1]) + ')">' + o.timmy.g + "</g>" }); }
    items.sort(function(a, b){ return a.z - b.z; });
    s += '<g class="tp-depth">' + items.map(function(x){ return '<g class="tp-d" data-z="' + f(x.z) + '">' + x.s + "</g>"; }).join("") + "</g>";
    s += sc.fg(so);
    if (H === "winter") s += holidaySky("winter");
    s += '<rect class="tp-grade" x="0" y="0" width="400" height="300" fill="' + sc.grade[0] + '" opacity="' + sc.grade[1] + '"/>';
    if (night) s += '<rect class="tp-night" x="0" y="0" width="400" height="300" fill="' + NIGHT + '" opacity=".26"/>' + G("tp-lights", lights);
    var slots = {};
    SLOT_ORDER.forEach(function(k){ if (k === "corner" && yard.side && YARD[yard.side].wide) return; slots[k] = slotPoly(k, k === "side" && yard.side && YARD[yard.side].wide); });
    var svg = '<svg class="tp-scene" viewBox="' + (o.viewBox || VB).join(" ") + '" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true" focusable="false">' + s + "</svg>";
    var b = home.block, hp = []; [[b[0], b[1]], [b[2], b[1]], [b[2], b[3]], [b[0], b[3]]].forEach(function(q){ hp.push(P(q[0], q[1], 0), P(q[0], q[1], home.h)); });
    hp.sort(function(a, c){ return a[0] - c[0] || a[1] - c[1]; });
    var hull = function(pts){ var cr = function(o, a, c){ return (a[0] - o[0]) * (c[1] - o[1]) - (a[1] - o[1]) * (c[0] - o[0]); }, lo = [], hi = [], i;
      for (i = 0; i < pts.length; i++){ while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], pts[i]) <= 0) lo.pop(); lo.push(pts[i]); }
      for (i = pts.length - 1; i >= 0; i--){ while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], pts[i]) <= 0) hi.pop(); hi.push(pts[i]); }
      return lo.slice(0, -1).concat(hi.slice(0, -1)); };
    return { svg: svg, spots: spots, plot: plot, slots: slots, homeHit: D2(hull(hp)), eggs: EGGS_SEEN.slice() };
  }

  /* ------------------------------------------------------------------ the customizer's art ------------------------- */
  /* a thumbnail: one thing on a little round of its scene's ground (kind "yard", "home" or "up" with o.up), or a scene */
  function thumb(kind, k, o){
    o = o || {};
    if (kind === "scene") return render({ home: "cottage", scene: k, viewBox: CARD, night: o.night, tier: 0 }).svg;
    var sc = SCENES[o.scene] || SCENES.hill, so = { night: !!(o.night || sc.alwaysNight), snow: !!sc.snowy, season: "" }, g = sc.chip(so), s = "", vb;
    var chip = function(cx, cy, r){ var c = P(cx, cy, 0); return ell(c[0], c[1] + 5, RX(r), RY(r), g[1], SW) + ell(c[0], c[1], RX(r), RY(r), g[0], SW); };
    if (kind === "yard"){
      var it = YARD[k] || YARD.garden, d = it.wide ? 7.5 : S;
      s = chip(S / 2, d / 2, it.wide ? 4.6 : 2.7) + it.draw(so);
      var a = P(-.6, d + .6, 0), b = P(S + .6, -.6, 0), t = P(0, 0, it.wide ? 2.4 : 3.6);
      vb = [f(a[0] - 4), f(t[1] - 10), f(b[0] - a[0] + 8), f(P(S + .4, d + .4, 0)[1] + 12 - (t[1] - 10))];
    } else {
      var h = HOMES[k] || HOMES.cottage, up = {}; (h.ups || []).forEach(function(u){ if (o.up && o.up[u]) up[u] = true; });
      var dr = h.draw({ night: so.night, up: up, paint: o.paint || "cream", snow: so.snow });
      s = chip(5.6, 6.0, 5.4) + shadowOf(h) + dr.body + skirt(sc, h, so) + (so.night ? dr.lights : "");
      var l = P(-.2, 11.6, 0), r = P(11.6, -.2, 0), tp = P(5.5, 5.5, h.h + 1);
      vb = [f(l[0] - 6), f(tp[1] - 8), f(r[0] - l[0] + 12), f(P(11.4, 11.4, 0)[1] + 14 - (tp[1] - 8))];
    }
    return '<svg class="tp-thumb" viewBox="' + vb.join(" ") + '" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true" focusable="false">' + s + "</svg>";
  }
  /* the rarity tiers: each its own card art, an animated frame drawn in the ink style */
  var RARITIES = [
    { k: "Common",    band: [100, 200],   fill: "#FFFDF6", edge: "#D9D2C6", deep: "#8E98A3", ink: "#5F5A55" },
    { k: "Uncommon",  band: [250, 500],   fill: "#E9F8EF", edge: "#3ECF9E", deep: "#239A72", ink: "#1C6E52" },
    { k: "Rare",      band: [600, 1200],  fill: "#E4F3FC", edge: "#3FA7E0", deep: "#2378B0", ink: "#1C5C88" },
    { k: "Epic",      band: [1500, 3000], fill: "#F0E8FD", edge: "#9B7BE0", deep: "#6E50B8", ink: "#4E3492" },
    { k: "Legendary", band: [4000, 8000], fill: "#FFF6D6", edge: "#F2C94C", deep: "#C9971C", ink: "#7A5600" }
  ];
  function rar(k){ for (var i = 0; i < RARITIES.length; i++) if (RARITIES[i].k === k) return RARITIES[i]; return RARITIES[0]; }
  function frame(k, w, h){
    w = w || 160; h = h || 200;
    var R = rar(k), cx = w / 2, cy = h * .4, s = "";
    var rr = function(i, rad){ return "M" + f(i + rad) + " " + f(i) + " H" + f(w - i - rad) + " Q" + f(w - i) + " " + f(i) + " " + f(w - i) + " " + f(i + rad) + " V" + f(h - i - rad) + " Q" + f(w - i) + " " + f(h - i) + " " + f(w - i - rad) + " " + f(h - i) +
      " H" + f(i + rad) + " Q" + f(i) + " " + f(h - i) + " " + f(i) + " " + f(h - i - rad) + " V" + f(i + rad) + " Q" + f(i) + " " + f(i) + " " + f(i + rad) + " " + f(i) + " Z"; };
    var rays = function(n, r, fill, cls){ var d = ""; for (var i = 0; i < n; i++){ var a0 = i / n * Math.PI * 2, a1 = a0 + Math.PI / n; d += "M" + f(cx) + " " + f(cy) + " L" + f(cx + Math.cos(a0) * r) + " " + f(cy + Math.sin(a0) * r) + " L" + f(cx + Math.cos(a1) * r) + " " + f(cy + Math.sin(a1) * r) + " Z "; }
      return '<g class="' + cls + '" style="transform-origin:' + f(cx) + "px " + f(cy) + 'px">' + F(d, fill) + "</g>"; };
    s += F(rr(2, 14), R.fill);
    if (k === "Legendary") s += rays(22, 74, "#FFE89A", "tp-r-spin2") + circ(cx, cy, 46, "#FFF3C4", 0) + circ(cx, cy, 40, "#FFFBE8", 0);
    else if (k === "Epic") s += rays(16, 72, "#E3D5FB", "tp-r-spin") + circ(cx, cy, 40, "#F6F0FE", 0);
    else if (k === "Rare") s += circ(cx, cy, 44, "#D3EBFA", 0) + circ(cx, cy, 34, "#EAF6FD", 0);
    else if (k === "Uncommon") s += circ(cx, cy, 42, "#D5F2E2", 0);
    else s += circ(cx, cy, 40, "#F2EDE4", 0);
    /* the name plate */
    s += F("M14 " + f(h * .62) + " H" + f(w - 14) + " V" + f(h - 18) + " Q" + f(w - 14) + " " + f(h - 12) + " " + f(w - 20) + " " + f(h - 12) + " H20 Q14 " + f(h - 12) + " 14 " + f(h - 18) + " Z", "#FFFFFF", .72);
    if (k === "Common"){
      s += L(rr(2, 14), 2.4) + L(rr(7, 10), 1.2, R.edge) + circ(14, 14, 1.6, R.deep) + circ(w - 14, 14, 1.6, R.deep) + circ(14, h - 14, 1.6, R.deep) + circ(w - 14, h - 14, 1.6, R.deep);
    } else if (k === "Uncommon"){
      var vine = function(sx, sy, dx, dy){ var d = "M" + f(sx) + " " + f(sy + dy * 40) + " Q" + f(sx) + " " + f(sy) + " " + f(sx + dx * 40) + " " + f(sy);
        var lf = [[.3, .55], [.62, .2], [.12, .85]].map(function(t){ var x = sx + dx * 40 * t[0] * (t[1] < .5 ? 1 : .4), y = sy + dy * 40 * (t[1] < .5 ? .15 : t[1]); return FO("M" + f(x) + " " + f(y) + " q" + f(dx * 6) + " " + f(-dy * 6) + " " + f(dx * 10) + " 0 q" + f(-dx * 5) + " " + f(dy * 5) + " " + f(-dx * 10) + " 0 z", "#7CC46A", 1); }).join("");
        return '<g class="tp-r-sway" style="transform-origin:' + f(sx) + "px " + f(sy) + 'px">' + L(d, 2, R.deep) + lf + "</g>"; };
      s += L(rr(4, 13), 4.4, R.edge) + L(rr(2, 14), 2.2) + L(rr(8, 9), 1.1, INK, .35) + vine(11, 11, 1, 1) + vine(w - 11, h - 11, -1, -1);
      s += FO("M" + f(cx) + " 0 q8 6 0 14 q-8 -8 0 -14 z", "#7CC46A", 1.4) + L("M" + f(cx) + " 2 v10", 1, R.deep);
    } else if (k === "Rare"){
      s += '<g class="tp-r-shine">' + F("M-60 16 L-34 16 L-70 " + (h - 16) + " L-96 " + (h - 16) + " Z", "#FFFFFF", .55) + F("M-26 16 L-18 16 L-54 " + (h - 16) + " L-62 " + (h - 16) + " Z", "#FFFFFF", .4) + "</g>";
      s += L(rr(5, 12), 6, R.edge) + L(rr(2, 14), 2.2) + L(rr(8.6, 9), 1.3);
      [[12, 12], [w - 12, 12], [12, h - 12], [w - 12, h - 12]].forEach(function(q){ s += circ(q[0], q[1], 3, R.deep, 1.1) + circ(q[0] - .8, q[1] - .8, .8, "#FFFFFF"); });
      s += FO("M" + f(cx - 10) + " 4 L" + f(cx - 6) + " -1 L" + f(cx + 6) + " -1 L" + f(cx + 10) + " 4 L" + f(cx) + " 16 Z", "#8FD3F5", 1.6) + L("M" + f(cx - 10) + " 4 H" + f(cx + 10) + " M" + f(cx - 4) + " 4 L" + f(cx) + " 16 M" + f(cx + 4) + " 4 L" + f(cx) + " 16 M" + f(cx - 6) + " -1 L" + f(cx - 4) + " 4 M" + f(cx + 6) + " -1 L" + f(cx + 4) + " 4", 1, "#FFFFFF");
    } else if (k === "Epic"){
      s += L(rr(5, 12), 6, R.edge) + L(rr(5, 12), 1.2, R.deep) + L(rr(2, 14), 2.2) + L(rr(10, 7), 1.3, R.deep);
      [[22, 26, 5, 0], [w - 24, 30, 4, .6], [26, h * .62, 3.6, 1.2], [w - 22, h * .6, 4.6, .3], [cx - 36, cy - 30, 3, 1.6], [cx + 38, cy - 22, 3.4, .9]].forEach(function(q){ s += dmStar(q[0], q[1], q[2], q[3] > 1 ? "#FFFFFF" : K.dmLight, "tp-r-tw", q[3]); });
      s += '<g class="tp-r-orbit" style="transform-origin:' + f(cx) + "px " + f(cy) + 'px">' + dmStar(cx + 52, cy, 4, "#FFE27A", "") + "</g>";
      s += FO("M" + f(cx) + " -2 l3.4 7.2 7.8 .9 -5.8 5.2 1.6 7.7 -7 -4 -7 4 1.6 -7.7 -5.8 -5.2 7.8 -.9 z", "#B57BFF", 1.4);
    } else {
      s += L(rr(6, 11), 9, R.edge) + L(rr(6, 11), 2, R.deep, .7) + L(rr(2, 14), 2.4) + L(rr(10.6, 7), 1.4);
      var curl = function(x, y, dx, dy){ return L("M" + f(x) + " " + f(y + dy * 30) + " C" + f(x) + " " + f(y + dy * 12) + " " + f(x + dx * 12) + " " + f(y) + " " + f(x + dx * 30) + " " + f(y) +
        " M" + f(x + dx * 8) + " " + f(y + dy * 18) + " c" + f(dx * 0) + " " + f(-dy * 6) + " " + f(dx * 4) + " " + f(-dy * 10) + " " + f(dx * 10) + " " + f(-dy * 10) + " c" + f(dx * 3) + " 0 " + f(dx * 5) + " " + f(dy * 2) + " " + f(dx * 5) + " " + f(dy * 5) + " c0 " + f(dy * 2) + " " + f(-dx * 2) + " " + f(dy * 3) + " " + f(-dx * 3) + " " + f(dy * 3), 2, R.deep); };
      s += curl(15, 15, 1, 1) + curl(w - 15, 15, -1, 1) + curl(15, h - 15, 1, -1) + curl(w - 15, h - 15, -1, -1);
      [[cx, 9], [9, h / 2], [w - 9, h / 2]].forEach(function(q, i){ s += FO("M" + f(q[0]) + " " + f(q[1] - 5) + " l4 5 -4 5 -4 -5 z", i ? "#E0457B" : "#7FCDEB", 1.2); });
      s += circ(cx, 4, 9, R.edge, 1.6) + rays(12, 0, "none", "").replace(/.*/, "") + dmStar(cx, 4, 6, "#FFFFFF", "tp-r-tw");
      s += '<g class="tp-r-glint">' + dmStar(24, 6, 4.4, "#FFFFFF", "") + "</g>" + '<g class="tp-r-glint" style="animation-delay:1.4s">' + dmStar(24, h - 6, 4.4, "#FFFFFF", "") + "</g>";
      [[30, 0], [60, .8], [100, 1.6], [128, 2.4]].forEach(function(q){ s += '<g class="tp-r-rise" style="animation-delay:' + q[1] + 's">' + dmStar(q[0] * w / 160, h * .58, 2.6, "#FFF3C4", "") + "</g>"; });
    }
    return '<svg class="tp-frame" viewBox="0 0 ' + w + " " + h + '" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true" focusable="false">' + s + "</svg>";
  }
  /* the burst when something is placed, in its rarity's style (80 x 80, centered on 0 0) */
  function burst(k){
    var s = "", R = rng(k.length * 7 + 3), part = function(dx, dy, inner, delay){ return '<g class="tp-b-p" style="--dx:' + f(dx) + "px;--dy:" + f(dy) + "px;animation-delay:" + f(delay || 0) + 's">' + inner + "</g>"; };
    if (k === "Common") for (var i = 0; i < 6; i++){ var a = i / 6 * Math.PI * 2; s += part(Math.cos(a) * 22, Math.sin(a) * 10 - 4, circ(0, 0, 4 + R() * 3, "#E3DFD8", 0)); }
    if (k === "Uncommon") for (i = 0; i < 8; i++){ a = i / 8 * Math.PI * 2; s += part(Math.cos(a) * 28, Math.sin(a) * 20 - 8, FO("M-4 0 q4 -4 8 0 q-4 4 -8 0 z", i % 2 ? "#7CC46A" : "#3ECF9E", .9)); }
    if (k === "Rare" || k === "Epic" || k === "Legendary"){
      var col = k === "Rare" ? ["#3FA7E0", "#8FD3F5", "#FFFFFF"] : k === "Epic" ? ["#9B7BE0", "#B57BFF", "#FFFFFF"] : ["#F2C94C", "#FFE27A", "#FFFFFF"], n = k === "Rare" ? 8 : 12;
      s += '<g class="tp-b-ring">' + ell(0, 0, 26, 14, "none", 0).replace('fill="none"', 'fill="none" stroke="' + col[0] + '" stroke-width="3"') + "</g>";
      if (k === "Legendary"){ var d = ""; for (i = 0; i < 16; i++){ var a0 = i / 16 * Math.PI * 2, a1 = a0 + .12; d += "M0 0 L" + f(Math.cos(a0) * 40) + " " + f(Math.sin(a0) * 40) + " L" + f(Math.cos(a1) * 40) + " " + f(Math.sin(a1) * 40) + " Z "; } s += '<g class="tp-b-rays">' + F(d, "#FFE89A", .8) + "</g>"; }
      for (i = 0; i < n; i++){ a = i / n * Math.PI * 2; s += part(Math.cos(a) * 34, Math.sin(a) * 24 - 10, dmStar(0, 0, 3 + R() * 2.6, col[i % 3], ""), i * .03); }
      if (k === "Legendary") for (i = 0; i < 10; i++) s += part((R() - .5) * 60, 18 + R() * 20, '<rect x="-1.6" y="-3" width="3.2" height="6" fill="' + ["#E5484D", "#3FA7E0", "#3ECF7E", "#F2C94C", "#9B7BE0"][i % 5] + '"/>', .2 + R() * .3);
    }
    return '<svg class="tp-burst" viewBox="-40 -40 80 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' + s + "</svg>";
  }
  /* a Shiny Gold Crown: a gold dental crown (the restoration, never a king's crown), its cusps and a glint. 24 box. */
  function coin(){
    return FO("M5 10.5 C4.6 6.4 7 4.4 9.2 5.4 C10.4 3.6 13.6 3.6 14.8 5.4 C17 4.4 19.4 6.4 19 10.5 C18.7 14 17.6 17.4 16.8 19.6 Q12 21 7.2 19.6 C6.4 17.4 5.3 14 5 10.5 Z", "#F2C94C", 1.6) +
      F("M14.6 6 C16.6 5.4 18.8 7 18.6 10.5 C18.3 14 17.3 17.2 16.6 19.4 Q14.8 20 13.4 20.2 C14.8 16 15.6 11 14.6 6 Z", "#C9971C") + L("M8.4 8.6 Q12 10.6 15.6 8.6 M12 9.8 V12.6", 1.1, "#9C7414") + L("M7.2 19.6 Q12 21 16.8 19.6", 1.2, "#9C7414") +
      dmStar(8.4, 7.6, 2.2, "#FFFFFF", "");
  }

  /* ------------------------------------------------------------------ Timmy's theme outfits ------------------------ */
  /* drawn in Timmy's own box (widget/pet.js art(): 200 wide, the crown's top near y 40, the eyes at y 84), in the same
     layers as his holiday outfits: back (behind him), face (on his face or body), top (hats) */
  var O4 = 'stroke="' + INK + '" stroke-width="4"', O3 = 'stroke="' + INK + '" stroke-width="3"', O2 = 'stroke="' + INK + '" stroke-width="2.2"';
  function p(d, fill, st){ return '<path d="' + d + '" fill="' + fill + '" ' + (st || O4) + "/>"; }
  function daisy(x, y){ var s = ""; for (var i = 0; i < 6; i++){ var a = i / 6 * Math.PI * 2; s += '<ellipse cx="' + f(x + Math.cos(a) * 4.4) + '" cy="' + f(y + Math.sin(a) * 4.4) + '" rx="3" ry="3" fill="#FFFFFF" ' + O2.replace("2.2", "1.4") + "/>"; } return s + '<circle cx="' + x + '" cy="' + y + '" r="3" fill="#FFE27A" ' + O2.replace("2.2", "1.4") + "/>"; }
  function star5(x, y, r, fill){ var d = ""; for (var i = 0; i < 10; i++){ var a = Math.PI / 5 * i - Math.PI / 2, q = i % 2 ? r * .45 : r; d += (i ? " L" : "M") + f(x + q * Math.cos(a)) + " " + f(y + q * Math.sin(a)); } return '<path d="' + d + ' Z" fill="' + fill + '" ' + O2.replace("2.2", "1.2") + "/>"; }
  var OUTFITS = {
    sunhat: { n: "A straw sun hat", note: "With a daisy in the band", rarity: "Common", theme: "hilltop", price: 150, id: "sun-hat",
      top: '<ellipse cx="100" cy="40" rx="68" ry="12" fill="#EBC77A" ' + O4 + "/>" + p("M66 40 C64 10 82 2 100 2 C118 2 136 10 134 40 Q100 50 66 40 Z", "#F2D58E") +
        '<path d="M70 24 Q100 16 130 24 M68 32 Q100 25 132 32" fill="none" stroke="#C9A35A" stroke-width="2.2"/>' + p("M66 34 Q100 26 134 34 L134 41 Q100 49 66 41 Z", "#E5484D", O2) +
        '<path d="M34 44 Q100 64 166 44" fill="none" stroke="#C9A35A" stroke-width="2.4"/>' + daisy(124, 36),
      say: ["Sun hat on. I burn easily. Enamel is not sunscreen.", "Gardening hat! The carrots are coming in nicely."] },
    sunnies: { n: "Sunglasses and a lei", note: "Beach day, every day", rarity: "Uncommon", theme: "seaside", price: 350, id: "sunglasses-lei",
      face: p("M64 76 Q64 70 70 70 L90 70 Q96 70 95 77 Q93 92 80 92 Q66 92 64 76 Z", "#2B2230", O3) + p("M136 76 Q136 70 130 70 L110 70 Q104 70 105 77 Q107 92 120 92 Q134 92 136 76 Z", "#2B2230", O3) +
        '<path d="M95 76 Q100 72 105 76 M64 76 L52 72 M136 76 L148 72" fill="none" ' + O3 + "/>" + '<path d="M70 76 l8 -4 M110 76 l8 -4" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>' +
        (function(){ var s = ""; for (var i = 0; i < 9; i++){ var t = i / 8, x = 46 + 108 * t, y = 130 + 20 * Math.sin(Math.PI * t), c = ["#FF8FB1", "#FFE27A", "#B08CFF", "#FF7A5C"][i % 4]; for (var j = 0; j < 5; j++){ var a = j / 5 * Math.PI * 2; s += '<circle cx="' + f(x + Math.cos(a) * 4) + '" cy="' + f(y + Math.sin(a) * 4) + '" r="3.6" fill="' + c + '" stroke="' + INK + '" stroke-width="1.2"/>'; } s += '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="2" fill="#FFFFFF"/>'; } return s; })(),
      say: ["Sunglasses, a lei and zero sunburn. Peak beach.", "These shades are polarized. Like enamel prisms. Sort of."] },
    captain: { n: "A captain's hat", note: "For the keeper of the lighthouse", rarity: "Rare", theme: "seaside", price: 800, id: "captain-hat",
      top: p("M58 38 C54 20 70 10 100 10 C130 10 146 20 142 38 Z", "#FFFFFF") + p("M60 33 L140 33 L142 46 L58 46 Z", "#1F3A68", O3) + p("M62 46 Q100 64 138 46 Q120 57 100 58 Q80 57 62 46 Z", "#1E1E24", O3) +
        '<path d="M64 43 Q100 38 136 43" fill="none" stroke="#F2C94C" stroke-width="2.6"/>' + '<ellipse cx="100" cy="24" rx="10" ry="8" fill="#1F3A68" ' + O2 + "/>" +
        '<path d="M100 18.6 V30 M95.4 21.6 H104.6 M93.6 26 Q100 33 106.4 26" fill="none" stroke="#F2C94C" stroke-width="2"/><circle cx="100" cy="17.6" r="1.6" fill="none" stroke="#F2C94C" stroke-width="1.4"/>',
      say: ["Captain Timmy, keeper of the light. Ships, stay away from the rocks. And sugar.", "Aye aye. That's sailor for 'brush twice a day'."] },
    ranger: { n: "A ranger hat", note: "For camping in the woods", rarity: "Uncommon", theme: "woodland", price: 300, id: "ranger-hat",
      top: '<ellipse cx="100" cy="40" rx="64" ry="10" fill="#B98A4E" ' + O4 + "/>" + p("M70 40 C70 22 78 8 88 6 L100 14 L112 6 C122 8 130 22 130 40 Q100 48 70 40 Z", "#C9A066") +
        '<path d="M100 14 L100 30 M88 6 Q92 20 90 34 M112 6 Q108 20 110 34" fill="none" stroke="#9A7340" stroke-width="2"/>' + p("M71 34 Q100 42 129 34 L130 40 Q100 48 70 40 Z", "#6B4A2B", O2) +
        p("M118 36 l4 -8 4 8 z", "#4F9A52", O2.replace("2.2", "1.4")),
      say: ["Ranger Timmy reporting. Only you can prevent cavities.", "I'm a forest ranger now. I keep the trees and the teeth healthy."] },
    beanie: { n: "A beanie and scarf", note: "Warm up on the peak", rarity: "Common", theme: "snowy", price: 180, id: "beanie",
      top: p("M58 48 C56 14 78 2 100 2 C122 2 144 14 142 48 Z", "#3FA7E0") + '<path d="M72 12 Q70 30 72 44 M86 5 Q85 26 86 44 M100 3 V44 M114 5 Q115 26 114 44 M128 12 Q130 30 128 44" fill="none" stroke="#2378B0" stroke-width="2.2"/>' +
        p("M54 40 Q100 26 146 40 L147 54 Q100 40 53 54 Z", "#2378B0") + '<path d="M66 36 L64 49 M80 32 L79 45 M94 30 V43 M108 30 V43 M122 32 L123 45 M136 36 L138 49" fill="none" stroke="#1C5C88" stroke-width="1.8"/>' +
        '<circle cx="100" cy="-4" r="10" fill="#FFFFFF" ' + O3 + '/><path d="M95 -6 l2 2 M102 -8 l2 2 M99 0 l2 2" stroke="#C9D1D9" stroke-width="1.6"/>',
      face: p("M44 122 Q100 146 156 122 L158 135 Q100 160 42 135 Z", "#E5484D", O3) + '<path d="M60 130 L58 142 M80 135 L79 148 M120 135 L121 148 M140 130 L142 142" stroke="#FFFFFF" stroke-width="3.4"/>' +
        p("M126 138 L136 170 L122 172 L114 142 Z", "#E5484D", O3) + '<path d="M123 172 v6 M128 171.4 v6 M133 170.8 v6" stroke="' + INK + '" stroke-width="2"/>',
      say: ["Beanie and scarf. It's cold up here, and teeth hate cold.", "Sensitive teeth? Not today. Today I have a scarf."] },
    nightcap: { n: "A starry nightcap", note: "For the little planet", rarity: "Rare", theme: "starlight", price: 900, id: "nightcap",
      top: p("M56 46 C54 16 78 2 102 2 C132 2 158 18 172 46 C178 58 180 70 178 80 L170 78 C168 62 160 50 146 44 Z", "#2B3A7A") +
        star5(80, 24, 6, "#FFE27A") + star5(110, 14, 5, "#FFE27A") + star5(136, 28, 5.6, "#FFE27A") + star5(162, 54, 4.6, "#FFE27A") +
        p("M54 40 Q100 28 148 40 L148 50 Q100 38 54 50 Z", "#F2E6C9", O3) + p("M176 80 A8 8 0 1 0 184 94 A6.4 6.4 0 1 1 176 80 Z", "#FFE08A", O2),
      say: ["Starry nightcap on. The stars are out, and so am I. Soon.", "I study under the Dark Matter stars. Very motivating."] },
    aviator: { n: "An aviator cap and goggles", note: "For flying above the clouds", rarity: "Rare", theme: "clouds", price: 1000, id: "aviator-cap",
      back: p("M70 128 C50 134 30 124 10 134 C24 120 36 116 22 106 C44 112 60 116 72 118 Z", "#FFFFFF", O3),
      top: p("M56 52 C54 18 76 4 100 4 C124 4 146 18 144 52 L138 64 C134 58 132 52 130 46 L70 46 C68 52 66 58 62 64 Z", "#8A5A3A") + '<path d="M100 4 V44" stroke="#6B4128" stroke-width="2.2"/>' +
        '<path d="M58 38 Q100 26 142 38" fill="none" stroke="#3B2E3A" stroke-width="5"/>' + '<circle cx="84" cy="32" r="10.6" fill="#C9971C" ' + O3 + '/><circle cx="116" cy="32" r="10.6" fill="#C9971C" ' + O3 + "/>" +
        '<circle cx="84" cy="32" r="7.6" fill="#9FD8F2" ' + O2.replace("2.2", "1.6") + '/><circle cx="116" cy="32" r="7.6" fill="#9FD8F2" ' + O2.replace("2.2", "1.6") + '/><path d="M79 29 l4 -3 M111 29 l4 -3" stroke="#FFFFFF" stroke-width="2"/><path d="M94.6 31 Q100 28 105.4 31" fill="none" ' + O3 + "/>",
      say: ["Goggles down, scarf out. Next stop: above the clouds.", "Pilot Timmy. Cleared for takeoff, flossed for landing."] }
  };
  /* put a theme outfit on a Timmy drawing from widget/pet.js art() (a string): back after his shadow, the rest on top */
  function dress(svg, k){
    var o = OUTFITS[k]; if (!o || !svg) return svg;
    if (o.back) svg = svg.replace(/(<ellipse cx="100" cy="226"[^>]*\/>)/, "$1" + '<g class="shpet-back">' + o.back + "</g>");
    var add = (o.face ? '<g class="shpet-garb">' + o.face + "</g>" : "") + (o.top ? '<g class="shpet-wobble"><g class="shpet-hat">' + o.top + "</g></g>" : "");
    return svg.replace(/<\/g><\/svg>\s*$/, add + "</g></svg>");
  }
  var THEMES = [
    { k: "hilltop", n: "Hilltop", note: "Where every Timmy starts: the cottage on the hill, number thirty-one on the next one", scene: "hill", homes: ["cottage"], yard: ["garden", "mailbox"], outfits: ["sunhat"], color: "#6CB060" },
    { k: "seaside", n: "Seaside", note: "Dunes, a beach hut on stilts and a lighthouse", scene: "beach", homes: ["hut", "lighthouse"], yard: ["pool", "sandcastle", "umbrella"], outfits: ["sunnies", "captain"], color: "#3FA7E0" },
    { k: "woodland", n: "Woodland", note: "A clearing in the pines: up a tree or under a mushroom", scene: "forest", homes: ["treehouse", "mushroom"], yard: ["hammock", "campfire"], outfits: ["ranger"], color: "#4F9A52" },
    { k: "snowy", n: "Snowy peak", note: "An igloo on a ledge above the clouds, a hot spring to warm up in", scene: "mountain", homes: ["igloo"], yard: ["hotspring"], outfits: ["beanie"], color: "#5FA3D9" },
    { k: "starlight", n: "Starlight", note: "A little planet under the Dark Matter stars", scene: "space", homes: ["observatory"], yard: ["telescope"], outfits: ["nightcap"], color: "#7A3CFF" },
    { k: "clouds", n: "Above the clouds", note: "A castle in the sky, a mint fountain in its yard", scene: "clouds", homes: ["castle"], yard: ["fountain"], outfits: ["aviator"], color: "#E07090" },
    { k: "classics", n: "The classics", note: "They go anywhere", scene: "", homes: [], yard: ["doghouse", "lane"], outfits: [], color: "#8E98A3" }
  ];
  /* the upgrades and paints in the shop: one item each; every home draws it its own way (HOMES[k].upn) */
  var UPGRADES = [
    { k: "windows", n: "Fancy windows", rarity: "Uncommon", price: 250, id: "fancy-windows" },
    { k: "porch", n: "A porch", rarity: "Rare", price: 700, id: "porch" },
    { k: "chimney", n: "A chimney", rarity: "Uncommon", price: 300, id: "chimney" },
    { k: "flag", n: "A Timmy flag", rarity: "Common", price: 120, id: "flag" }
  ];
  /* what a tap on each thing does, and what Timmy says about it */
  var EGGS = {
    sun: { n: "The sun", does: "puts on its shades", say: "The sun put on its shades. Bright idea." },
    moon: { n: "The moon", does: "a cow jumps over it", say: "Did a cow just jump over the moon?" },
    cloud: { n: "A cloud", does: "rains a little", say: "A little rain for the garden." },
    stars: { n: "The stars", does: "a shooting star", say: "A shooting star! I wished for an easy exam." },
    neighbor: { n: "Number thirty-one's house", does: "he takes his temperature", say: "Thirty-one is taking his temperature again." },
    rabbit: { n: "The rabbit down the hill", does: "pops down its burrow and back", say: "The rabbit down the hill says hi. Its teeth never stop growing." },
    whale: { n: "The sea", does: "a whale spouts", say: "A whale! Its teeth are baleen. Not my department." },
    crab: { n: "A crab", does: "scuttles off", say: "Crabs walk sideways. I floss sideways." },
    owl: { n: "An owl", does: "looks round and blinks", say: "Who studies at night? We do." },
    yeti: { n: "A rock", does: "a yeti peeks out and waves", say: "Was that a yeti? Very white teeth." },
    alien: { n: "A crater", does: "a friend pops up and waves", say: "A friend from the next planet over." },
    balloon: { n: "A hot-air balloon", does: "rises and dips", say: "Up, up and away." },
    home: { n: "Home", does: "a happy wobble", say: "Home sweet home. No sweets, though." },
    brush: { n: "The toothbrush", does: "wiggles", say: "My toothbrush says hi. It talks now, apparently." },
    statue: { n: "Your rank", does: "it gleams", say: "" },
    tree: { n: "The tree", does: "shakes", say: "Whoa, the tree is ticklish." },
    bunting: { n: "The bunting", does: "flutters", say: "One pennant for every hub you've mastered." },
    garden: { n: "The garden", does: "a carrot pops up", say: "Carrots: crunchy, and they scrub your teeth." },
    pool: { n: "The pool", does: "a splash", say: "Cannonball!" },
    hammock: { n: "The hammock", does: "swings", say: "Five minutes. Then back to studying." },
    fountain: { n: "The mint fountain", does: "spouts high", say: "Minty fresh!" },
    doghouse: { n: "The doghouse", does: "someone peeks out", say: "Who's a good dog? Not sure. It's shy." },
    lane: { n: "The bowling lane", does: "rolls a mint", say: "Strike! Well, close." },
    mailbox: { n: "The mailbox", does: "a letter", say: "A letter! It's from thirty-one. He's worried about a bump." },
    sandcastle: { n: "The sandcastle", does: "a crab peeks out", say: "Someone moved into my sandcastle." },
    umbrella: { n: "The umbrella", does: "a wobble", say: "Shade first. Enamel doesn't tan." },
    campfire: { n: "The campfire", does: "sparks fly up", say: "No marshmallows. Just stories." },
    hotspring: { n: "The hot spring", does: "bubbles", say: "Ahh. Warm water, sensitive teeth: careful." },
    telescope: { n: "The telescope", does: "finds a star", say: "Found one! Calling it Molar Major." },
    timmy: { n: "Timmy", does: "a flip", say: "Wheee!" }
  };
  var EGG_ANIM = { sun: "tp-pop 2.6s", moon: "tp-cow 2.4s ease-in-out", cloud: "tp-pop 2.2s", stars: "tp-shoot 1.4s ease-out", neighbor: "tp-pop 2.6s", whale: "tp-peek 2.6s", yeti: "tp-peek 2.6s", alien: "tp-peek 2.6s",
    home: "tp-pop 1.8s", statue: "tp-pop 2s", tree: "tp-drop 2s ease-in", brush: "tp-pop 1.8s", garden: "tp-jump 1.8s", pool: "tp-splash 1.2s ease-out", fountain: "tp-geyser 2s", doghouse: "tp-peek 2.4s",
    mailbox: "tp-jump 2.2s", sandcastle: "tp-peek 2.4s", campfire: "tp-sparks 1.6s ease-out", hotspring: "tp-sparks 2s ease-out", telescope: "tp-pop 2.4s" };
  var BOING = ["home", "statue", "garden", "pool", "hammock", "fountain", "doghouse", "mailbox", "sandcastle", "umbrella", "campfire", "hotspring", "telescope", "sun"];

  /* the motion: smoke rises, water shimmers, leaves fall, flags wave, stars twinkle, eggs play. Reduced motion: still,
     and an egg shows its bits without moving. */
  var CSS = [
    ".tp-scene{display:block;width:100%;height:auto}.tp-thumb,.tp-frame,.tp-burst{display:block;width:100%;height:100%}",
    ".tp-grade,.tp-night,.tp-lights,.tp-eb,.tp-mark{pointer-events:none}.tp-egg{cursor:pointer;transform-box:fill-box;transform-origin:50% 100%}.tp-eb{opacity:0}",
    "@keyframes tp-rise{0%{transform:translateY(4px);opacity:0}30%{opacity:.9}100%{transform:translateY(-10px);opacity:0}}",
    ".tp-smoke circle{animation:tp-rise 3.2s ease-out infinite;transform-box:fill-box}.tp-smoke circle:nth-child(2){animation-delay:1s}.tp-smoke circle:nth-child(3){animation-delay:2s}",
    "@keyframes tp-shim{0%,100%{transform:translateX(0);opacity:.8}50%{transform:translateX(3px);opacity:.35}}.tp-water{animation:tp-shim 2.6s ease-in-out infinite}",
    "@keyframes tp-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(1.4px)}}.tp-bob,.tp-float{animation:tp-bob 3s ease-in-out infinite}",
    "@keyframes tp-wave{0%,100%{transform:scaleX(1)}50%{transform:scaleX(.82)}}.tp-flag{transform-box:fill-box;transform-origin:left center;animation:tp-wave 1.8s ease-in-out infinite}",
    "@keyframes tp-tw{0%,100%{opacity:1}50%{opacity:.25}}.tp-twinkle,.tp-star{animation:tp-tw 2.8s ease-in-out infinite}",
    "@keyframes tp-fall{0%{transform:translate(0,-6px) rotate(0);opacity:0}15%{opacity:1}100%{transform:translate(10px,40px) rotate(200deg);opacity:0}}.tp-leaf{transform-box:fill-box;transform-origin:center;animation:tp-fall 5s linear infinite}",
    "@keyframes tp-snow{0%{transform:translateY(-8px);opacity:0}20%{opacity:1}100%{transform:translateY(40px);opacity:0}}.tp-flake{animation:tp-snow 6s linear infinite}",
    "@keyframes tp-fly{0%,100%{transform:translate(0,0);opacity:.3}50%{transform:translate(6px,-5px);opacity:1}}.tp-firefly{animation:tp-fly 3.4s ease-in-out infinite}",
    "@keyframes tp-flick{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.82)}}.tp-flame{transform-box:fill-box;transform-origin:center bottom;animation:tp-flick .9s ease-in-out infinite}",
    "@keyframes tp-sway{0%,100%{transform:rotate(0)}50%{transform:rotate(2deg)}}.tp-fronds{transform-box:fill-box;transform-origin:50% 100%;animation:tp-sway 4.4s ease-in-out infinite}",
    "@keyframes tp-drift{0%,100%{transform:translateX(0)}50%{transform:translateX(8px)}}.tp-cloud{animation:tp-drift 9s ease-in-out infinite}",
    ".tp-foam{animation:tp-shim 3.4s ease-in-out infinite}.tp-wave{animation:tp-drift 4s ease-in-out infinite}",
    "@keyframes tp-spout{0%,100%{opacity:1}50%{opacity:.5}}.tp-spout{animation:tp-spout 1.4s ease-in-out infinite}",
    "@keyframes tp-pen{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(6deg)}}.tp-pen{transform-box:fill-box;transform-origin:50% 0;animation:tp-pen 2.6s ease-in-out infinite}",
    "@keyframes tp-spin{to{transform:rotate(360deg)}}.tp-beam{animation:tp-spin 8s linear infinite}",
    "@keyframes tp-steam{0%{transform:translateY(4px);opacity:0}40%{opacity:.85}100%{transform:translateY(-12px);opacity:0}}.tp-steam path{animation:tp-steam 3s ease-out infinite}.tp-steam path:nth-child(2){animation-delay:1s}.tp-steam path:nth-child(3){animation-delay:2s}",
    /* the eggs */
    "@keyframes tp-boing{0%,100%{transform:none}18%{transform:scale(1.07,.9)}40%{transform:scale(.95,1.08)}62%{transform:scale(1.03,.97)}80%{transform:scale(.99,1.01)}}",
    "@keyframes tp-pop{0%{opacity:0;transform:translateY(5px) scale(.7)}14%,82%{opacity:1;transform:none}100%{opacity:0;transform:none}}",
    "@keyframes tp-peek{0%,100%{opacity:0;transform:translateY(14px)}20%,78%{opacity:1;transform:translateY(0)}}",
    "@keyframes tp-jump{0%,100%{opacity:0;transform:translateY(6px)}25%{opacity:1;transform:translateY(-12px)}50%{opacity:1;transform:translateY(-14px)}85%{opacity:1;transform:translateY(0)}}",
    "@keyframes tp-cow{0%{opacity:0;transform:translate(-26px,8px)}12%{opacity:1}50%{transform:translate(0,-22px)}88%{opacity:1}100%{opacity:0;transform:translate(26px,8px)}}",
    "@keyframes tp-shoot{0%{opacity:0;transform:translate(0,0)}10%{opacity:1}100%{opacity:0;transform:translate(-130px,64px)}}",
    "@keyframes tp-drop{0%{opacity:0;transform:translateY(0)}10%{opacity:1}100%{opacity:0;transform:translateY(40px) rotate(120deg)}}",
    "@keyframes tp-splash{0%{opacity:0;transform:scale(.3)}20%{opacity:1}100%{opacity:0;transform:scale(1.6)}}",
    "@keyframes tp-geyser{0%,100%{opacity:0;transform:scaleY(.2)}20%,70%{opacity:1;transform:scaleY(1)}}",
    "@keyframes tp-sparks{0%{opacity:0;transform:translateY(0)}20%{opacity:1}100%{opacity:0;transform:translateY(-24px)}}",
    "@keyframes tp-burrow{0%,100%{transform:none;opacity:1}20%,62%{transform:translateY(6px) scaleY(.15);opacity:0}80%{transform:translateY(-5px);opacity:1}}",
    "@keyframes tp-scuttle{0%,100%{transform:none}25%{transform:translateX(12px)}55%{transform:translateX(-8px)}80%{transform:translateX(4px)}}",
    "@keyframes tp-turn{0%,100%{transform:none}30%{transform:rotate(-24deg)}65%{transform:rotate(22deg)}}",
    "@keyframes tp-blink{0%,30%,40%,100%{opacity:0}33%,37%{opacity:1}}",
    "@keyframes tp-rise2{0%,100%{transform:none}50%{transform:translateY(-30px)}}",
    "@keyframes tp-wiggle{0%,100%{transform:none}20%{transform:rotate(-9deg)}40%{transform:rotate(8deg)}60%{transform:rotate(-6deg)}80%{transform:rotate(4deg)}}",
    "@keyframes tp-shake{0%,100%{transform:none}20%{transform:rotate(-3deg)}40%{transform:rotate(3deg)}60%{transform:rotate(-2deg)}80%{transform:rotate(1.5deg)}}",
    "@keyframes tp-roll{0%{transform:none}70%{transform:translate(48px,-28px)}100%{transform:translate(48px,-28px);opacity:0}}",
    "@keyframes tp-tip{0%,55%{transform:none}75%,100%{transform:rotate(-70deg) translateY(3px);opacity:.3}}",
    "@keyframes tp-flip{0%,100%{transform:none}30%,80%{transform:rotate(-80deg)}}",
    "@keyframes tp-swing{0%,100%{transform:none}25%{transform:translateX(4px)}75%{transform:translateX(-4px)}}",
    "@keyframes tp-flutter{0%,100%{transform:rotate(-14deg)}50%{transform:rotate(16deg)}}",
    BOING.map(function(k){ return "[data-egg='" + k + "'].tp-on"; }).join(",") + "{animation:tp-boing .8s ease}",
    Object.keys(EGG_ANIM).map(function(k){ return "[data-egg='" + k + "'].tp-on .tp-eb{animation:" + EGG_ANIM[k] + " both}"; }).join(""),
    "[data-egg='rabbit'].tp-on .tp-eo{transform-box:fill-box;transform-origin:50% 100%;animation:tp-burrow 1.8s ease}[data-egg='crab'].tp-on .tp-eo{animation:tp-scuttle 1.6s ease}",
    "[data-egg='owl'].tp-on .tp-owlhead{transform-box:fill-box;transform-origin:50% 100%;animation:tp-turn 1.6s ease}[data-egg='owl'].tp-on .tp-owlhead .tp-eb{animation:tp-blink 1.6s}[data-egg='balloon'].tp-on .tp-eo{animation:tp-rise2 3s ease-in-out}",
    "[data-egg='brush'].tp-on{animation:tp-wiggle .9s ease}[data-egg='tree'].tp-on{transform-origin:50% 100%;animation:tp-shake .8s ease}[data-egg='lane'].tp-on .tp-ball{animation:tp-roll 1.4s ease-in both}[data-egg='lane'].tp-on .tp-pins{transform-box:fill-box;transform-origin:50% 100%;animation:tp-tip 1.4s ease both}",
    "[data-egg='mailbox'].tp-on .tp-mflag{transform-box:fill-box;transform-origin:0 100%;animation:tp-flip 2.2s ease}[data-egg='hammock'].tp-on .tp-cloth{animation:tp-swing 1.6s ease-in-out}[data-egg='bunting'].tp-on .tp-pen{animation:tp-flutter .3s ease-in-out 5}",
    "[data-egg='fountain'].tp-on .tp-eb,[data-egg='geyser'] .tp-eb{transform-box:fill-box;transform-origin:50% 100%}[data-egg='pool'].tp-on .tp-eb{transform-box:fill-box;transform-origin:center}",
    /* the rarity frames and the placing burst */
    "@keyframes tp-r-shine{0%,58%{transform:translateX(0)}100%{transform:translateX(340px)}}.tp-r-shine{animation:tp-r-shine 3.8s ease-in-out infinite}",
    ".tp-r-spin{animation:tp-spin 26s linear infinite}.tp-r-spin2{animation:tp-spin 44s linear infinite}.tp-r-orbit{animation:tp-spin 6s linear infinite}",
    "@keyframes tp-r-tw{0%,100%{opacity:.2;transform:scale(.6)}50%{opacity:1;transform:scale(1)}}.tp-r-tw{transform-box:fill-box;transform-origin:center;animation:tp-r-tw 2.2s ease-in-out infinite}",
    "@keyframes tp-r-rise{0%{opacity:0;transform:translateY(0)}20%{opacity:1}100%{opacity:0;transform:translateY(-70px)}}.tp-r-rise{animation:tp-r-rise 3.2s ease-in infinite}",
    "@keyframes tp-r-sway{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}.tp-r-sway{animation:tp-r-sway 4s ease-in-out infinite}",
    "@keyframes tp-r-glint{0%{transform:translateX(0);opacity:0}10%,90%{opacity:1}100%{transform:translateX(110px);opacity:0}}.tp-r-glint{animation:tp-r-glint 2.8s ease-in-out infinite}",
    "@keyframes tp-b-out{0%{opacity:0;transform:translate(0,0) scale(.4)}15%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(1)}}.tp-b-p{animation:tp-b-out 1.1s ease-out both}",
    "@keyframes tp-b-ring{0%{opacity:.9;transform:scale(.2)}100%{opacity:0;transform:scale(1.5)}}.tp-b-ring,.tp-b-rays{transform-box:fill-box;transform-origin:center;animation:tp-b-ring 1s ease-out both}.tp-b-rays{animation-duration:1.4s}",
    "@media (prefers-reduced-motion: reduce){.tp-scene *,.tp-frame *,.tp-burst *{animation:none!important}.tp-egg.tp-on .tp-eb{opacity:1}.tp-burst{display:none}}",
    ".tp-still .tp-scene *,.tp-still .tp-frame *{animation:none!important}.tp-still .tp-egg.tp-on .tp-eb{opacity:1}"
  ].join("\n");

  function meta(list, keys){ return Object.keys(list).map(function(k){ var x = list[k], o = { k: k }; keys.forEach(function(q){ if (x[q] !== undefined) o[q] = x[q]; }); return o; }); }
  return {
    VIEWBOX: VB, CARD: CARD, CSS: CSS, render: render, route: route, project: P, layout: layout,
    onLand: function(scene, x, y){ var q = P(x, y, 0); return sceneOn(SCENES[scene] || SCENES.hill, q[0], q[1]); }, unproject: unP, N: N, S: S, FIX: FIX, SLOT_AT: SLOTS,
    HOMES: meta(HOMES, ["n", "note", "rarity", "theme", "price", "id", "ups", "upn", "climbs"]),
    SCENES: meta(SCENES, ["n", "note", "rarity", "theme", "price", "id", "alwaysNight"]),
    YARD: meta(YARD, ["n", "note", "rarity", "theme", "price", "id", "wide"]),
    SLOTS: SLOT_ORDER.map(function(k){ return { k: k, n: SLOTS[k].n }; }),
    PAINTS: Object.keys(PAINTS).map(function(k){ return { k: k, n: PAINTS[k].n, c: PAINTS[k].c, bold: BOLD[k].c, boldName: BOLD[k].n, rarity: k === "cream" ? "" : "Common", price: k === "cream" ? 0 : 150, id: k === "cream" ? "" : "paint-" + k }; }),
    UPGRADES: UPGRADES, MATS: MATS.map(function(m){ return { k: m.k, n: m.n, c: m.c }; }),
    OUTFITS: meta(OUTFITS, ["n", "note", "rarity", "theme", "price", "id", "say"]), dress: dress,
    THEMES: THEMES, RARITIES: RARITIES, EGGS: EGGS, frame: frame, burst: burst, coin: coin, thumb: thumb,
    outfitParts: function(k){ var o = OUTFITS[k]; return o ? { back: o.back || "", face: o.face || "", top: o.top || "" } : null; }
  };
}
