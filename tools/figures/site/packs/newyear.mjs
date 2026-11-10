/* The New Year set of Timmy's place (tools/figures/site/sets.mjs lists its eight pieces; the shop's catalog has the same
   rows). One self-contained function: the build hands it the kit's tools (place.mjs, TOOLS) and pastes its source into
   tools/preview/design/place.js, so it may use nothing from outside itself but T. Structure: packs/thanksgiving.mjs.

   The set: a clock tower a few minutes from midnight, the city's rooftops under fireworks (a night-only scene), a
   confetti cannon, a countdown clock and the midnight ball for the yard, and a sparkly bow tie, a tuxedo and Father Time
   for Timmy. Never sugar, nothing to drink but water: the party is confetti, lights and the clock.
   No ids, gradients, filters, text, images or emoji: flat fills and ink outlines. */
export function pack(T){
  var K = T.K, P = T.P, D = T.D, f = T.f, F = T.F, O = T.O, L = T.L, FO = T.FO, G = T.G, circ = T.circ, ell = T.ell, box = T.box, cyl = T.cyl, INK = T.INK;
  var p = T.p, O2 = T.O2, O3 = T.O3;
  var GOLD = ["#F2C94C", "#C9971C", "#FFF0B3"], PARTY = ["#FF7DB6", "#FFD84A", "#6FE8D0", "#9DB4FF", "#FFFFFF", "#FFA860"], NAVY = "#262A58";
  /* a scrap of confetti, a curl of streamer */
  function bit(x, y, c, i){ return '<path d="M' + f(x) + " " + f(y) + (i % 2 ? " l2.6 1 -1 2.6 -2.6 -1 z" : " l2.8 -.8 .8 2.6 -2.8 .8 z") + '" fill="' + c + '"/>'; }
  function curl(x, y, c){ return L("M" + f(x) + " " + f(y) + " q3 -2.6 0 -5.2 q-3 -2.6 0 -5.2 q3 -2.6 0 -5.2", 1.3, c); }
  /* a firework: rays that droop a little, a dot on each end, a white heart; it twinkles */
  function burst(x, y, r, c, n, delay, c2){
    var d = "", d2 = "", dots = "", i, a;
    for (i = 0; i < n; i++){
      a = i / n * Math.PI * 2 - Math.PI / 2;
      var ex = x + Math.cos(a) * r, ey = y + Math.sin(a) * r + r * .16;
      d += "M" + f(x + Math.cos(a) * r * .34) + " " + f(y + Math.sin(a) * r * .34) + " Q" + f(x + Math.cos(a) * r * .74) + " " + f(y + Math.sin(a) * r * .74) + " " + f(ex) + " " + f(ey);
      dots += circ(ex, ey + .4, r > 16 ? 1.5 : 1.1, c2 || c);
      a += Math.PI / n;
      d2 += "M" + f(x + Math.cos(a) * r * .16) + " " + f(y + Math.sin(a) * r * .16) + " L" + f(x + Math.cos(a) * r * .5) + " " + f(y + Math.sin(a) * r * .5 + r * .04);
    }
    return G("tp-twinkle", L(d, r > 16 ? 1.6 : 1.2, c) + L(d2, 1, "#FFFFFF", .9) + dots + circ(x, y, r > 16 ? 1.8 : 1.2, "#FFFFFF"), ' style="animation-delay:' + f(delay || 0) + 's"');
  }
  /* a clock face on a wall (the wall turned left: "y", or right: "x"), its hands at five to midnight */
  function clock(face, plane, uc, vc, r, night){
    var on = face === "y" ? T.onY : T.onX, sg = face === "y" ? 1 : -1, i;
    var ring = function(rr){ var out = []; for (var q = 0; q < 24; q++){ var a = q / 24 * Math.PI * 2; out.push([uc + Math.cos(a) * rr, vc + Math.sin(a) * rr]); } return on(plane, out); };
    var at = function(deg, rr){ var a = deg * Math.PI / 180; return [uc + sg * Math.sin(a) * rr, vc + Math.cos(a) * rr]; };
    var s = FO(D(ring(r + .17)), GOLD[0], 1.6) + FO(D(ring(r)), night ? K.litHot : "#FFFDF6", 1.1), ticks = "", big = "";
    for (i = 0; i < 12; i++){ if (i % 3) ticks += D(on(plane, [at(i * 30, r * .82), at(i * 30, r * .92)]), true); else big += D(on(plane, [at(i * 30, r * .7), at(i * 30, r * .92)]), true); }
    s += L(ticks, .9, INK, .8) + L(big, 1.6);
    s += L(D(on(plane, [[uc, vc], at(357, r * .5)]), true), 2.4) + L(D(on(plane, [[uc, vc], at(330, r * .8)]), true), 1.6);
    var c = P.apply(null, face === "y" ? [uc, plane, vc] : [plane, uc, vc]);
    return { s: s + circ(c[0], c[1], 1.5, GOLD[0], .9), c: c };
  }

  /* ------------------------------------------------------------------ the home: a clock tower ----------------------- */
  var homes = {
    "clock-tower": {
      note: "A tall stone tower with a spire; its big clock stands at five to midnight",
      ups: ["flag", "paint"], upn: { flag: "A Timmy flag on the spire", paint: "Wall paint" },
      door: [5.5, 8.6], brush: [7.8, 9.1], statue: [3.3, 9.6], spots: { door: [5.5, 10.6] }, h: 12,
      eaves: [[3.15, 8.8, 3.0], [7.85, 8.8, 3.0]], foot: [3.3, 4.2, 7.7, 8.6], base: [[3.3, 8.6], [7.7, 8.6], [7.7, 4.2]], block: [3.1, 3.9, 8.1, 9.0],
      draw: function(o){
        var u = o.up, wp = o.paint && o.paint !== "cream" ? T.PAINTS[o.paint] : { c: "#F1E3C6", s: "#D2BE98" }, s = "", lights = "", w, i;
        var wall = { top: wp.c, left: wp.c, right: wp.s }, trim = { top: "#FFFDF6", left: "#FFFDF6", right: "#DDD3BF" }, roof = o.snow ? ["#F7FBFF", "#DCEAF6"] : ["#5362B4", "#3A4585"];
        var mix = function(a, b, t){ return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; };
        var pin = function(x, y, z){ return box(x - .2, y - .2, z, .4, .4, .5, trim, { sw: 1.2, si: .8 }) + FO(D([[x - .28, y + .28, z + .5], [x + .28, y + .28, z + .5], [x, y, z + 1.2]]), roof[0], 1.2) + FO(D([[x + .28, y - .28, z + .5], [x + .28, y + .28, z + .5], [x, y, z + 1.2]]), roof[1], 1.2); };
        /* stone courses: short dashes on the lit wall (y = Y) and the shaded one (x = X) */
        var courses = function(x0, x1, Y, y0, y1, X, z0, z1, seed){ var R = T.rng(seed), d = "", n = Math.round((z1 - z0) / .55); for (var k = 1; k < n; k++){ var z = z0 + (z1 - z0) * k / n, a = x0 + .2 + R() * (x1 - x0 - 1), b = y0 + .2 + R() * (y1 - y0 - 1); d += D([[a, Y, z], [a + .6, Y, z]], true) + D([[X, b, z], [X, b + .6, z]], true); } return L(d, .9, INK, .22); };

        /* the lower stage: the door in its white arch, a window on the side */
        s += box(3.3, 4.2, 0, 4.4, 4.4, 3.0, wall) + courses(3.3, 7.7, 8.6, 4.2, 8.6, 7.7, 0, 3.0, 5);
        w = T.win("x", 7.7, 5.8, 7.0, 1.1, 2.45, { night: o.night, arch: true }); s += w.s; lights += w.lights;
        s += FO(D(T.onY(8.6, T.archUV(4.66, 6.34, 0, 2.68, 10))), "#FFFDF6", 1.5) + T.doorArch("y", 8.6, 4.85, 6.15, 2.45, { color: "#5B78E0" });
        s += box(3.12, 4.02, 3.0, 4.76, 4.76, .25, trim, { sw: 1.5, si: 1 });
        /* the shaft: a tall arched window on each wall, a gold tooth over the front one */
        s += box(3.7, 4.6, 3.25, 3.6, 3.6, 3.05, wall) + courses(3.7, 7.3, 8.2, 4.6, 8.2, 7.3, 3.25, 6.3, 9);
        w = T.win("y", 8.2, 5.02, 5.98, 3.85, 5.5, { night: o.night, arch: true }); s += w.s; lights += w.lights;
        w = T.win("x", 7.3, 5.92, 6.88, 3.85, 5.5, { night: o.night, arch: true }); s += w.s; lights += w.lights;
        s += T.tinyTooth.apply(null, P(5.5, 8.2, 5.9).concat([.36, K.gold]));
        /* the clock stage on its ledge, a face on each wall you can see */
        s += box(3.3, 4.2, 6.3, 4.4, 4.4, .22, trim, { sw: 1.5, si: 1 });
        s += box(3.45, 4.35, 6.52, 4.1, 4.1, 2.8, wall);
        var c1 = clock("y", 8.45, 5.5, 7.92, 1.14, o.night), c2 = clock("x", 7.55, 6.4, 7.92, 1.14, o.night);
        s += c1.s + c2.s;
        if (o.night) lights += T.glowAt(c1.c[0], c1.c[1], 17) + T.glowAt(c2.c[0], c2.c[1], 14) + c1.s + c2.s;
        var zt = 9.54, apex = [5.5, 6.4, 11.75], A = [3.9, 8.0, zt], B = [7.1, 8.0, zt], C = [7.1, 4.8, zt];
        s += box(3.3, 4.2, 9.32, 4.4, 4.4, .22, trim, { sw: 1.5, si: 1 });
        /* the spire, a pinnacle on each corner */
        s += pin(3.58, 4.48, zt);
        s += FO(D([A, B, apex]), roof[0], 1.8) + FO(D([C, B, apex]), roof[1], 1.8);
        for (i = 1; i < 4; i++) s += L(D([mix(A, apex, i / 4), mix(B, apex, i / 4)], true), .9, INK, .3) + L(D([mix(C, apex, i / 4), mix(B, apex, i / 4)], true), .9, INK, .3);
        if (o.snow) s += FO(D([mix(A, apex, .55), mix(B, apex, .62), mix(C, apex, .55), apex]), "#FFFFFF", 1.1);
        else s += T.HI(D([mix(A, apex, .12), mix(A, apex, .8)], true).replace(/M([\d.-]+) /, function(m, x){ return "M" + f(+x + 3) + " "; }), 1.6);
        s += pin(3.58, 8.32, zt) + pin(7.42, 4.48, zt) + pin(7.42, 8.32, zt);
        var ft = P(5.5, 6.4, 11.75);
        if (u.flag) s += T.flagOn(5.5, 6.4, 11.7, 1.5);
        else s += L("M" + f(ft[0]) + " " + f(ft[1] + 1) + " v-7", 1.6) + circ(ft[0], ft[1] - 1, 1.9, GOLD[0], 1) + T.star5(ft[0], ft[1] - 10, 4.8, GOLD[0]);
        return { body: s, lights: lights };
      }
    }
  };

  /* ------------------------------------------------------------------ the scene: midnight rooftops ------------------ */
  /* one building of the skyline: its block, lit windows, snow on its roof */
  function bldg(R, x, w, top, fill, sw, pr, snow){
    var d = "M" + f(x) + " 300 V" + f(top) + " H" + f(x + w) + " V300 Z", s = sw ? FO(d, fill, sw) : F(d, fill), d1 = "", d2 = "", cols = Math.floor((w - 3) / 5), x0 = x + (w - cols * 5 + 2.2) / 2;
    for (var r = 0; top + 5 + r * 6.4 < 170; r++) for (var q = 0; q < cols; q++){ var v = R(); if (v < pr){ var m = "M" + f(x0 + q * 5) + " " + f(top + 5 + r * 6.4) + " h2.8 v3.6 h-2.8 z"; if (v < pr * .7) d1 += m; else d2 += m; } }
    if (d1) s += F(d1, "#FFE08A");
    if (d2) s += F(d2, sw ? "#FFF6D0" : "#9FE8F0");
    if (snow) s += L("M" + f(x + 1) + " " + f(top) + " h" + f(w - 2), 2.6, "#FFFFFF");
    return s;
  }
  var scenes = {
    "midnight-rooftops": T.hillScene({ farLift: 8,
      note: "Always midnight: the city's rooftops and lit windows behind the hill, fireworks overhead",
      alwaysNight: true, path: "stones", treeKind: "round", lamp: "iron", grade: ["#7A5CFF", .05],
      ground: function(o){ return o.snow ? ["#EEF4FB", "#DEE8F4", "#CCDAEA", "#B0C4DA"] : ["#63A08C", "#57927F", "#4A8271", "#3A6B5C"]; },
      sky: function(){
        var s = T.bands(["#0B0F33", "#10164A", "#1A2162", "#2B2B7A", "#44388C", "#44388C"], 0, 300) + T.starField(27, 30, 112) + T.moon(136, 22);
        /* the rockets' trails, then the bursts */
        s += L("M104 74 q3 26 -4 60 M318 80 q-3 24 4 56 M254 44 q2 30 -3 70", .9, "#FFFFFF", .3);
        s += burst(100, 46, 25, PARTY[0], 14, 0, "#FFD3E6") + burst(318, 50, 27, PARTY[1], 16, .9, "#FFF3C4") + burst(254, 28, 14, PARTY[2], 10, 1.7) + burst(56, 26, 11, PARTY[3], 9, 2.3) + burst(346, 14, 9, PARTY[5], 8, .5);
        return s;
      },
      far: function(o){
        var R = T.rng(77), s = "", x, w, top, i = 0;
        /* the glow of the streets, then two rows of buildings: far ones pale, near ones dark with warm windows */
        s += F("M0 104 H400 V300 H0 Z", "#5A4496", .45) + F("M0 128 H400 V300 H0 Z", "#7A5296", .4);
        for (x = 26; x < 376; x += w + 1.5){ w = 15 + R() * 15; top = 50 + R() * 40; s += bldg(R, x, w, top, "#3B4190", 0, .26, o.snow); if (i++ % 4 === 1) s += L("M" + f(x + w / 2) + " " + f(top) + " v-11", 1.2, "#3B4190") + circ(x + w / 2, top - 12, 1.3, "#FF7A7A").replace("/>", ' class="tp-twinkle"/>'); }
        i = 0;
        for (x = 28; x < 374; x += w + 2){
          w = 19 + R() * 13; top = 86 + R() * 40;
          if (x + w > 152 && x < 248){ R(); continue; }
          var m = x + w / 2, kind = i++ % 4;
          /* on the roof: a water tank on legs, a stair hut, an aerial */
          if (kind === 0) s += L("M" + f(m - 4) + " " + f(top) + " v-5 M" + f(m + 4) + " " + f(top) + " v-5", 1.3) + FO("M" + f(m - 5.4) + " " + f(top - 4) + " v-8 h10.8 v8 z", "#5A456A", 1.3) + FO("M" + f(m - 6.4) + " " + f(top - 12) + " L" + f(m) + " " + f(top - 17) + " L" + f(m + 6.4) + " " + f(top - 12) + " Z", "#7A5A7C", 1.3) + L("M" + f(m - 5.4) + " " + f(top - 8) + " h10.8", .8, INK, .5);
          else if (kind === 1) s += FO("M" + f(x + 3) + " " + f(top) + " v-6 h8 v6 z", "#242A62", 1.3) + F("M" + f(x + 5.4) + " " + f(top - 4) + " h3 v4 h-3 z", "#FFE08A");
          else if (kind === 2) s += L("M" + f(m) + " " + f(top) + " v-14 M" + f(m - 4) + " " + f(top - 9) + " h8 M" + f(m - 2.6) + " " + f(top - 12) + " h5.2", 1.2);
          s += bldg(R, x, w, top, "#1C2152", 1.5, .5, o.snow);
        }
        /* a string of party lights from roof to roof, on each side */
        [[34, 96, 112, 92], [286, 94, 366, 98]].forEach(function(q){
          s += L("M" + q[0] + " " + q[1] + " Q" + f((q[0] + q[2]) / 2) + " " + f((q[1] + q[3]) / 2 + 12) + " " + q[2] + " " + q[3], .7, "#0E1238");
          for (var j = 1; j < 9; j++){ var t = j / 9, bx = (1 - t) * (1 - t) * q[0] + 2 * t * (1 - t) * (q[0] + q[2]) / 2 + t * t * q[2], by = (1 - t) * (1 - t) * q[1] + 2 * t * (1 - t) * ((q[1] + q[3]) / 2 + 12) + t * t * q[3]; s += '<circle class="tp-twinkle" cx="' + f(bx) + '" cy="' + f(by + 1.2) + '" r="1.5" fill="' + PARTY[j % 4] + '" style="animation-delay:' + f(j * .3) + 's"/>'; }
        });
        return s;
      },
      flat: function(o, on){
        var s = o.snow ? "" : T.scatter(151, 36, on, function(sx, sy){ return T.tuft(sx, sy, "#427A68", .8); }).join("");
        /* confetti has drifted down over the grass */
        return s + T.scatter(152, 30, on, function(sx, sy, i){ return bit(sx, sy, PARTY[i % 6], i); }).join("");
      },
      props: function(o, on){
        return T.scatter(153, 8, on, function(sx, sy, i, R, x, y){
          var s;
          if (i === 1 || i === 6){
            /* a bunch of balloons tied to a weight */
            var bl = [[-7, -24, PARTY[1]], [8, -22, PARTY[0]], [1, -31, PARTY[2]]];
            s = ell(sx, sy, 4, 2.4, "#3A3F72", 1.1);
            bl.forEach(function(q){ s += L("M" + f(sx) + " " + f(sy - 1) + " L" + f(sx + q[0]) + " " + f(sy + q[1] + 6.4), .8, "#FFFFFF", .8); });
            s += G("tp-float", bl.map(function(q){ return ell(sx + q[0], sy + q[1], 5.2, 6.4, q[2], 1.3) + L("M" + f(sx + q[0] - 2.4) + " " + f(sy + q[1] - 2) + " q.6 -2.2 2.4 -2.8", 1.2, "#FFFFFF", .8); }).join(""));
          } else {
            /* a shrub strung with little lights */
            s = T.canopy(sx, sy - 7, 8.5 + R() * 2.5, o.snow ? ["#F7FBFF", "#DCEAF6"] : ["#3F8A70", "#2F6E5A"], 50 + i);
            for (var j = 0; j < 6; j++) s += '<circle class="tp-twinkle" cx="' + f(sx - 6 + j * 2.5 + (j % 2)) + '" cy="' + f(sy - 10 + (j * 5 % 8)) + '" r="1.3" fill="' + PARTY[(i + j) % 4] + '" style="animation-delay:' + f(j * .4) + 's"/>';
          }
          return { x: x, y: y, s: s };
        });
      }
    })
  };

  /* ------------------------------------------------------------------ the yard -------------------------------------- */
  /* a seven-segment digit on a wall turned left (y = Y): u, z is its lower left corner */
  function digit(n, u, Y, z, w, h, col, sw){
    var m = ["abcdef", "bc", "abged", "abgcd", "fgbc", "afgcd", "afgedc", "abc", "abcdefg", "abfgcd"][n], g = .07, d = "";
    var S = { a: [[u + g, z + h], [u + w - g, z + h]], b: [[u + w, z + h - g], [u + w, z + h / 2 + g]], c: [[u + w, z + h / 2 - g], [u + w, z + g]], d: [[u + g, z], [u + w - g, z]], e: [[u, z + h / 2 - g], [u, z + g]], f: [[u, z + h - g], [u, z + h / 2 + g]], g: [[u + g, z + h / 2], [u + w - g, z + h / 2]] };
    for (var i = 0; i < m.length; i++) d += D(T.onY(Y, S[m.charAt(i)]), true);
    return L(d, sw || 1.7, col);
  }
  var DIG = [.68, 2.2];
  function readout(nums, col, sw){
    var s = "";
    nums.forEach(function(n, i){ s += digit(n, DIG[i], 2.2, 1.36, .92, 1.28, col, sw || 2.6); });
    return s;
  }
  /* the glittering ball: facets in a few pale colors, the lines between them */
  function ball(x, y, r, night){
    var cols = night ? ["#FFFFFF", "#FFF6D0", "#FFD84A", "#9FD8F5", "#FF9CC4"] : ["#FFFFFF", "#E6F4FF", "#9FD8F5", "#FFD84A", "#FF9CC4"], s = circ(x, y, r, cols[1], 0), n = 6, m = 5, k, j, d = "";
    for (k = 0; k < n; k++){
      var ya = -r + 2 * r * k / n, yb = -r + 2 * r * (k + 1) / n, wa = Math.sqrt(Math.max(0, r * r - ya * ya)), wb = Math.sqrt(Math.max(0, r * r - yb * yb));
      for (j = 0; j < m; j++){
        if ((j + k) % 2) continue;
        var a0 = -1 + 2 * j / m, a1 = -1 + 2 * (j + 1) / m;
        s += F("M" + f(x + a0 * wa) + " " + f(y + ya) + " L" + f(x + a1 * wa) + " " + f(y + ya) + " L" + f(x + a1 * wb) + " " + f(y + yb) + " L" + f(x + a0 * wb) + " " + f(y + yb) + " Z", cols[(j * 2 + k * 3) % 5 === 1 ? 0 : (j * 2 + k * 3) % 5]);
      }
      if (k){ d += "M" + f(x - wa) + " " + f(y + ya) + " h" + f(2 * wa); }
    }
    for (j = 1; j < m; j++){ var a = -1 + 2 * j / m; d += "M" + f(x) + " " + f(y - r) + " A" + f(Math.abs(a) * r) + " " + f(r) + " 0 0 " + (a > 0 ? 1 : 0) + " " + f(x) + " " + f(y + r); }
    return s + L(d, .7, INK, .45) + circ(x, y, r, "none", 1.7) + L("M" + f(x - r * .62) + " " + f(y - r * .3) + " A" + f(r * .72) + " " + f(r * .72) + " 0 0 1 " + f(x - r * .2) + " " + f(y - r * .68), 1.8, "#FFFFFF", .9);
  }
  var yard = {
    "confetti-cannon": {
      note: "A party cannon on two wheels, loaded with paper confetti", spot: [3.3, 3.4],
      egg: { n: "The confetti cannon", does: "it fires a cloud of confetti", say: "Boom! Confetti gets everywhere. Floss gets everywhere that matters." }, anim: "tp-sparks 2s ease-out",
      draw: function(o){
        var g = P(1.8, 2.0, 0), x = g[0], y = g[1], s = ell(x, y + 1, 27, 9.4, "#1B2A3A", 0, .1);
        var wheel = function(cx, cy, r){ var d = ""; for (var i = 0; i < 4; i++){ var a = i * Math.PI / 4 + .3; d += "M" + f(cx - Math.cos(a) * r * .74) + " " + f(cy - Math.sin(a) * r * .74) + " L" + f(cx + Math.cos(a) * r * .74) + " " + f(cy + Math.sin(a) * r * .74); } return circ(cx, cy, r, K.wood, 1.6) + circ(cx, cy, r * .74, "#F7E9CF", 1) + L(d, 1.3, K.woodShade) + circ(cx, cy, r * .26, GOLD[0], 1); };
        var hw = function(q){ return 6 + (q + 15) * 3 / 34; }, band = function(a, b){ return F("M" + a + " " + f(-hw(a)) + " L" + b + " " + f(-hw(b)) + " L" + b + " " + f(hw(b)) + " L" + a + " " + f(hw(a)) + " Z", GOLD[0]) + L("M" + a + " " + f(-hw(a)) + " V" + f(hw(a)) + " M" + b + " " + f(-hw(b)) + " V" + f(hw(b)), .9); };
        s += wheel(x + 8, y - 13, 9);
        s += FO("M" + f(x - 1) + " " + f(y - 13) + " L" + f(x - 23) + " " + f(y - 2) + " l2.4 3.6 L" + f(x + 3) + " " + f(y - 8) + " Z", K.wood, 1.4);
        s += '<g transform="translate(' + f(x + 1) + " " + f(y - 17) + ') rotate(-36)">' + F("M-15 -6 Q-19 0 -15 6 L19 9 L19 -9 Z", "#5B78E0") + F("M-16.6 2 L19 3.4 L19 9 L-15 6 Z", "#4059B8") + band(-9, -5) + band(9, 13) +
          O("M-15 -6 Q-19 0 -15 6 L19 9 L19 -9 Z", 1.6) + T.star5(2, -.6, 4, "#FFFFFF") + circ(-19.6, 0, 2.8, GOLD[0], 1.3) + ell(19, 0, 3.6, 9.6, GOLD[0], 1.5) + ell(19.8, 0, 2.2, 7, "#2B2230", 0) + "</g>";
        s += wheel(x - 4, y - 9, 9.6);
        /* a few scraps already in the air, and on the ground */
        var mz = [x + 17.4, y - 28.6];
        [[5, -5, 0], [11, -11, 1], [3, -13, 2], [14, -3, 3], [9, -19, 5]].forEach(function(q, i){ s += bit(mz[0] + q[0], mz[1] + q[1], PARTY[q[2]], i); });
        [[-20, 6, 0], [12, 5, 1], [22, -4, 2], [-10, 10, 3], [4, 9, 5]].forEach(function(q, i){ s += bit(x + q[0], y + q[1], PARTY[q[2]], i); });
        if (o.snow) s += ell(x - 8, y - 23, 5, 1.6, "#FFFFFF", 0);
        return s;
      },
      bits: function(){
        var g = P(1.8, 2.0, 0), mx = g[0] + 17.4, my = g[1] - 28.6, s = "";
        [[2, -8, 0], [9, -4, 1], [16, -9, 2], [6, -17, 3], [14, -20, 4], [22, -15, 5], [-3, -18, 1], [10, -28, 0], [20, -27, 2], [27, -6, 3], [0, -28, 5], [17, -35, 1]].forEach(function(q, i){ s += bit(mx + q[0], my + q[1], PARTY[q[2]], i); });
        return s + curl(mx + 4, my - 20, PARTY[0]) + curl(mx + 24, my - 16, PARTY[2]) + T.dmStar(mx + 12, my - 13, 4, "#FFFFFF", "");
      }
    },
    "countdown-clock": {
      note: "A big number board on two posts, ten seconds to go, bulbs along the top", spot: [3.4, 3.45],
      egg: { n: "The countdown clock", does: "it runs down to zero and stars pop out", say: "Ten, nine, eight... Brushing has a countdown too: two minutes." }, anim: "tp-pop 2.4s",
      draw: function(o){
        var s = ell.apply(null, P(1.9, 2.1, 0).concat([31, 10, "#1B2A3A", 0, .1])), metal = { top: K.stone, left: K.stone, right: K.stoneShade }, i;
        [.62, 2.88].forEach(function(q){ s += box(q - .12, 1.63, 0, .54, .54, .16, metal, { sw: 1.2, si: .8 }) + box(q, 1.75, .16, .3, .3, .9, metal, { sw: 1.3, si: .8 }); });
        /* the cabinet: a gold case, a dark face, the dim "8"s behind the lit numbers */
        s += box(.2, 1.6, 1.0, 3.4, .6, 2.0, { top: GOLD[2], left: GOLD[0], right: GOLD[1] });
        s += FO(D(T.onY(2.2, T.rectUV(.36, 3.44, 1.16, 2.84))), NAVY, 1.3);
        s += readout([8, 8], "#3A4078", 2) + readout([1, 0], o.night ? K.litHot : "#FFC84A");
        for (i = 0; i < 8; i++){ var b = P(.44 + i * .42, 2.2, 3.0); s += '<circle class="tp-twinkle" cx="' + f(b[0]) + '" cy="' + f(b[1] - 1.4) + '" r="1.7" fill="' + PARTY[i % 4] + '" stroke="' + INK + '" stroke-width=".8" style="animation-delay:' + f(i * .3) + 's"/>'; }
        /* a star on top, a little bell each side of it */
        var t = P(1.9, 1.9, 3.0);
        s += L("M" + f(t[0]) + " " + f(t[1]) + " v-5", 1.8) + T.star5(t[0], t[1] - 10, 6.2, GOLD[0]);
        if (o.snow) s += ell.apply(null, P(1.2, 1.9, 3.02).concat([8, 2.6, "#FFFFFF", 0]));
        return s;
      },
      lights: function(){ var c = P(1.9, 2.2, 2.0); return T.glowAt(c[0], c[1], 17) + readout([1, 0], K.litHot); },
      bits: function(){
        var t = P(1.9, 1.9, 3.0), s = FO(D(T.onY(2.2, T.rectUV(.36, 3.44, 1.16, 2.84))), NAVY, 1.3) + readout([8, 8], "#3A4078", 2) + readout([0, 0], "#FFF3C4");
        return s + T.star5(t[0] - 17, t[1] - 13, 4.4, PARTY[0]) + T.star5(t[0] + 17, t[1] - 4, 4.4, PARTY[2]) + T.star5(t[0] - 7, t[1] - 24, 3.6, PARTY[1]) + T.star5(t[0] + 9, t[1] - 22, 3.4, "#FFFFFF") + T.dmStar(t[0] + 24, t[1] - 18, 3.4, "#FFFFFF", "") + T.dmStar(t[0] - 25, t[1] - 2, 3, "#FFE27A", "");
      }
    },
    "ball-drop": {
      note: "A glittering ball at the top of its pole, on a stage ringed with bulbs; it glows at night", spot: [3.35, 3.45],
      egg: { n: "The midnight ball", does: "sparks fly as it drops", say: "Three, two, one... Happy New Year! My resolution: floss every night." }, anim: "tp-sparks 2.2s ease-out",
      draw: function(o){
        var c0 = P(1.8, 1.8, 0), s = ell(c0[0] + 2, c0[1] + 3, 29, 10.4, "#1B2A3A", 0, .1), i, a, q;
        s += cyl(1.8, 1.8, 0, 1.6, .2, 1.6, K.stone, K.stoneShade, "#E9EDF1") + cyl(1.8, 1.8, .2, 1.3, .62, 1.3, "#5B78E0", "#4059B8", "#7C95EE");
        for (i = 0; i < 6; i++){ a = (-32 + i * 39) * Math.PI / 180; q = P(1.8 + Math.cos(a) * 1.3, 1.8 + Math.sin(a) * 1.3, .4); s += '<circle class="tp-twinkle" cx="' + f(q[0]) + '" cy="' + f(q[1]) + '" r="1.7" fill="' + (o.night ? K.litHot : PARTY[i % 4]) + '" stroke="' + INK + '" stroke-width=".8" style="animation-delay:' + f(i * .35) + 's"/>'; }
        s += cyl(1.8, 1.8, .62, .56, .95, .46, GOLD[0], GOLD[1], GOLD[2], { sw: 1.5 });
        /* the pole, its stops, the ball near the top and a star above it */
        var p0 = P(1.8, 1.8, .95), p1 = P(1.8, 1.8, 5.0), b = P(1.8, 1.8, 3.8);
        s += L(T.seg(p0, p1), 4.4) + L(T.seg(p0, p1), 2.2, "#E3E8EC");
        [1.5, 2.1, 2.7].forEach(function(z){ var t = P(1.8, 1.8, z); s += L("M" + f(t[0] - 3) + " " + f(t[1]) + " h6", 1.6); });
        s += ball(b[0], b[1], 12, o.night) + T.star5(p1[0], p1[1] - 4.6, 5.4, GOLD[0]);
        s += T.dmStar(b[0] - 17, b[1] - 8, 3.8, o.night ? "#FFFFFF" : "#FFD84A", "tp-twinkle", .2) + T.dmStar(b[0] + 17, b[1] + 5, 3.2, o.night ? "#FFE27A" : "#FFD84A", "tp-twinkle", 1.1) + T.dmStar(b[0] + 13, b[1] - 14, 2.6, o.night ? "#FFFFFF" : "#F5A8C8", "tp-twinkle", 1.8);
        if (o.snow) s += ell(b[0], b[1] - 10.8, 6, 1.9, "#FFFFFF", 0);
        return s;
      },
      lights: function(){ var b = P(1.8, 1.8, 3.8); return T.glowAt(b[0], b[1], 26) + ball(b[0], b[1], 12, true) + T.dmStar(b[0] - 17, b[1] - 8, 3.8, "#FFFFFF", "tp-twinkle", .2) + T.dmStar(b[0] + 17, b[1] + 5, 3.2, "#FFE27A", "tp-twinkle", 1.1) + T.dmStar(b[0] + 13, b[1] - 14, 2.6, "#FFFFFF", "tp-twinkle", 1.8); },
      bits: function(){ var m = P(1.8, 1.8, 2.0); return burst(m[0] - 17, m[1] - 2, 9, PARTY[0], 8, 0) + burst(m[0] + 18, m[1] - 8, 10, PARTY[1], 8, 0) + burst(m[0] - 9, m[1] - 26, 7, PARTY[2], 7, 0) + bit(m[0] + 8, m[1] + 6, PARTY[3], 0) + bit(m[0] - 6, m[1] + 10, PARTY[5], 1); }
    }
  };

  /* ------------------------------------------------------------------ the outfits ----------------------------------- */
  /* a four-point sparkle with a thin ink edge */
  var sp4 = function(x, y, r, fill){ return '<path d="M' + f(x) + " " + f(y - r) + " Q" + f(x + r * .2) + " " + f(y - r * .2) + " " + f(x + r) + " " + f(y) + " Q" + f(x + r * .2) + " " + f(y + r * .2) + " " + f(x) + " " + f(y + r) + " Q" + f(x - r * .2) + " " + f(y + r * .2) + " " + f(x - r) + " " + f(y) + " Q" + f(x - r * .2) + " " + f(y - r * .2) + " " + f(x) + " " + f(y - r) + ' Z" fill="' + fill + '" stroke="' + INK + '" stroke-width="1.2"/>'; };
  var dots = function(list, fill, r){ return list.map(function(q){ return '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="' + (r || 1.4) + '" fill="' + fill + '"/>'; }).join(""); };
  var ROBE = "#4A4FA6", ROBE_S = "#363A82";
  var outfits = {
    "sparkle-bow-tie": {
      note: "A purple bow tie covered in glitter",
      face: p("M97 134 L66 119 Q60 134 66 149 Z", "#8A5CF0", O3) + p("M103 134 L134 119 Q140 134 134 149 Z", "#8A5CF0", O3) +
        '<path d="M70 127 L90 134 L70 142 M130 127 L110 134 L130 142" fill="none" stroke="#6A3FD0" stroke-width="2"/>' +
        dots([[72, 124], [80, 131], [74, 138], [86, 137], [70, 145], [128, 124], [120, 131], [126, 138], [114, 137], [130, 145]], "#FFFFFF") + dots([[77, 135], [68, 131], [84, 127], [123, 135], [132, 131], [116, 127]], "#FFE27A", 1.6) +
        p("M92 126 Q100 123 108 126 L108 142 Q100 145 92 142 Z", "#A983FF", O3) + dots([[97, 131], [103, 137]], "#FFFFFF") +
        sp4(56, 122, 5.4, "#FFE27A") + sp4(146, 126, 4.6, "#FFFFFF") + sp4(142, 146, 3.6, "#FFE27A") + sp4(60, 144, 3.4, "#FFFFFF"),
      say: ["Bow tie on. I clean up nicely. Twice a day, in fact.", "It sparkles like enamel after a good polish.", "Dressed for midnight. Don't study that late, though."]
    },
    "tuxedo": {
      note: "A top hat with a gold band, a black jacket, a white shirt front and a black bow tie",
      face: p("M48 112 L82 117 L100 150 L118 117 L152 112 L150 131 L135 144 Q100 158 65 144 L50 131 Z", "#2B2230", O3) +
        p("M82 117 Q100 123 118 117 L100 150 Z", "#FFFFFF", O2) +
        p("M82 117 L69 115 L76 130 L71 134 L98 148 Z", "#4A4058", O2) + p("M118 117 L131 115 L124 130 L129 134 L102 148 Z", "#4A4058", O2) +
        dots([[100, 134], [100, 141]], INK, 1.7) +
        p("M100 121 L88 115 Q86 121 88 127 Z", "#2B2230", O2) + p("M100 121 L112 115 Q114 121 112 127 Z", "#2B2230", O2) + '<circle cx="100" cy="121" r="3.2" fill="#4A4058" ' + O2 + "/>" +
        p("M128 131 l5 -6 l5 5 l-3 4 z", "#FFFFFF", O2.replace("2.2", "1.6")),
      top: '<ellipse cx="100" cy="40" rx="54" ry="9.4" fill="#2B2230" ' + T.O4 + "/>" + p("M70 40 L73 -12 Q100 -20 127 -12 L130 40 Q100 48 70 40 Z", "#2B2230") +
        p("M70.6 28 Q100 36 129.4 28 L130 40 Q100 48 70 40 Z", "#F2C94C", O2) + '<ellipse cx="100" cy="-12" rx="27" ry="5" fill="#4A4058" ' + O2 + "/>" +
        '<path d="M79 -4 Q77 10 78 22" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".5"/><path d="M52 40 Q62 46 76 48" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity=".35"/>',
      say: ["Black tie tonight. White enamel always.", "Top hat, tuxedo and not a cavity in sight.", "May I have this dance? I only know the molar shuffle."]
    },
    "father-time": {
      note: "A hooded midnight-blue robe, a long white beard, bushy brows and an hourglass in his hand",
      back: p("M34 136 C22 70 48 12 100 10 C152 12 178 70 166 136 Z", ROBE_S),
      face: p("M48 110 Q100 128 152 110 L150 131 L135 144 Q100 158 65 144 L50 131 Z", ROBE, O3) +
        p("M58 99 Q46 95 37 102 L33 129 Q46 124 58 124 Z", ROBE, O3) + '<path d="M38 106 L35 126" stroke="#F2C94C" stroke-width="2.6" stroke-linecap="round"/>' +
        p("M142 99 Q154 95 163 102 L167 129 Q154 124 142 124 Z", ROBE, O3) + '<path d="M162 106 L165 126" stroke="#F2C94C" stroke-width="2.6" stroke-linecap="round"/>' +
        /* the beard: from cheek to cheek under his mouth, down in three locks */
        p("M60 102 C56 120 64 136 74 141 C76 150 86 155 92 152 C94 161 106 161 108 152 C114 155 124 150 126 141 C136 136 144 120 140 102 C132 110 124 113 116 111 Q100 127 84 111 C76 113 68 110 60 102 Z", "#FFFFFF", O3) +
        '<path d="M72 120 q5 7 2 15 M88 124 q5 10 2 22 M112 124 q-5 10 -2 22 M128 120 q-5 7 -2 15 M100 130 v18" fill="none" stroke="#C9C6D8" stroke-width="2" stroke-linecap="round"/>' +
        p("M68 70 Q78 60 92 67 Q80 66 71 74 Z", "#FFFFFF", O2) + p("M132 70 Q122 60 108 67 Q120 66 129 74 Z", "#FFFFFF", O2) +
        /* the hourglass: gold caps, two glass bulbs, the sand most of the way down */
        p("M164 93 h20 q0 9 -7.4 14 q7.4 5 7.4 14 h-20 q0 -9 7.4 -14 q-7.4 -5 -7.4 -14 z", "#DFF3FB", O2) +
        '<path d="M168.4 97 h11.2 q-1 5 -5.6 8.4 q-4.6 -3.4 -5.6 -8.4 z M166.6 121 q7.4 -11 14.8 0 z" fill="#F2C94C"/><path d="M174 106 V114" stroke="#F2C94C" stroke-width="1.6"/>' +
        p("M160 87 h28 v6 h-28 z", "#C9971C", O2) + p("M160 121 h28 v6 h-28 z", "#C9971C", O2),
      top: p("M40 80 C34 30 64 6 100 6 C136 6 166 30 160 80 L150 72 C152 44 130 26 100 26 C70 26 48 44 50 72 Z", ROBE) +
        '<path d="M47 72 C46 42 68 22 100 22 C132 22 154 42 153 72" fill="none" stroke="#F2C94C" stroke-width="3"/>' + T.star5(100, 13, 5, "#F2C94C"),
      say: ["Another year older. Teeth don't have to show it: brush and floss.", "Time flies. Two minutes of brushing doesn't, but do it anyway.", "The sand is running. One more practice question before midnight?"]
    }
  };

  return { k: "newyear", homes: homes, scenes: scenes, yard: yard, outfits: outfits };
}
