/* The Fall set of Timmy's place (tools/figures/site/sets.mjs lists its eight pieces; the shop's catalog has the same
   rows). One self-contained function: the build hands it the kit's tools (place.mjs, TOOLS) and pastes its source into
   tools/preview/design/place.js, so it may use nothing from outside itself but T. Structure: packs/thanksgiving.mjs.

   - home:    acorn-house, a giant acorn: the nut is the house, the scaly cap its roof, the stem its chimney.
   - scene:   autumn-woods, a clearing with red, orange and gold woods on both sides, leaves coming down.
   - yard:    leaf-pile (Rare), cider-stand (Epic), apple-tree (Legendary).
   - outfits: flannel (Rare), fox-hood (Epic), tweed-professor (Legendary).
   Never sugar (Timmy is a tooth): the cider is fresh-pressed apples, nothing added. No ids, gradients, filters, text,
   images or emoji: flat fills and ink outlines. */
export function pack(T){
  var K = T.K, P = T.P, D = T.D, f = T.f, F = T.F, O = T.O, L = T.L, FO = T.FO, G = T.G, circ = T.circ, ell = T.ell, box = T.box, cyl = T.cyl, INK = T.INK;
  var p = T.p, O2 = T.O2, O3 = T.O3, O4 = T.O4;
  var LV = ["#E8A33D", "#D9622B", "#C2410C", "#F2C230", "#B5382E"], NLV = ["#9A7A50", "#8A5E48", "#7C4E40", "#9C8C58", "#7A4648"];
  /* a leaf: a pointed oval about 7 long, turned by rot degrees (the turn is in the path, so a falling leaf still falls down) */
  function leafD(x, y, k, rot){
    var a = rot * Math.PI / 180, c = Math.cos(a), n = Math.sin(a), q = function(u, v){ return f(x + (u * c - v * n) * k) + " " + f(y + (u * n + v * c) * k); };
    return "M" + q(-3.4, 0) + " Q" + q(0, -3.6) + " " + q(3.4, 0) + " Q" + q(0, 3.6) + " " + q(-3.4, 0) + " Z";
  }
  function leaf(x, y, k, rot, col, sw){ return FO(leafD(x, y, k, rot), col, sw || .6); }
  function fallLeaf(x, y, k, rot, col, delay){ return '<path class="tp-leaf" style="animation-delay:' + delay + 's" d="' + leafD(x, y, k, rot) + '" fill="' + col + '" stroke="' + INK + '" stroke-width=".7"/>'; }
  function apple(x, y, r, col){ return circ(x, y, r, col || "#D9483B", .9) + L("M" + f(x) + " " + f(y - r * .7) + " q.3 " + f(-r * .7) + " " + f(r * .6) + " " + f(-r), .9) + circ(x - r * .36, y - r * .3, r * .24, "#FFFFFF"); }
  function shroom(x, y, k, cap){
    return FO("M" + f(x - 1.5 * k) + " " + f(y) + " q" + f(-.5 * k) + " " + f(-3 * k) + " " + f(.3 * k) + " " + f(-5 * k) + " h" + f(2.4 * k) + " q" + f(.8 * k) + " " + f(2 * k) + " " + f(.3 * k) + " " + f(5 * k) + " q" + f(-1.5 * k) + " " + f(.8 * k) + " " + f(-3 * k) + " 0 z", "#FFF3D6", .9) +
      FO("M" + f(x - 5 * k) + " " + f(y - 4.4 * k) + " q" + f(5 * k) + " " + f(-9.6 * k) + " " + f(10 * k) + " 0 q" + f(-5 * k) + " " + f(1.8 * k) + " " + f(-10 * k) + " 0 z", cap, 1) +
      circ(x - 1.8 * k, y - 7 * k, .9 * k, "#FFFFFF") + circ(x + 2 * k, y - 6.2 * k, .7 * k, "#FFFFFF");
  }
  /* a tree of the woods: a trunk (a birch's is white, with ticks) and a round canopy */
  function tree(x, cy, r, c, by, birch, night, seed){
    var d = "M" + f(x) + " " + f(by) + " V" + f(cy), s = L(d, birch ? 5 : 4.6) + L(d, birch ? 3 : 2.6, birch ? (night ? "#B9B4C4" : "#FFFDF6") : (night ? "#5E4C48" : "#8A5A3A"));
    if (birch) s += L("M" + f(x - 1.4) + " " + f(by - 5) + " h2 M" + f(x - .4) + " " + f(by - 10) + " h1.8", .9);
    return s + T.canopy(x, cy, r, c, seed);
  }

  /* ------------------------------------------------------------------ the home: a giant acorn ----------------------- */
  var homes = {
    "acorn-house": {
      note: "A giant acorn: a round door and round windows in the nut, its scaly cap for a roof and the stem for a chimney",
      ups: ["flag", "paint"], upn: { flag: "A Timmy flag on the cap", paint: "Shell paint" },
      door: [5.5, 7.6], brush: [8.7, 6.9], statue: [2.7, 9.4], spots: { door: [5.5, 9.4] }, h: 9.6,
      eaves: [[3.24, 7.76, 5.3], [7.76, 3.24, 5.3], 23], round: [5.5, 5.5, 2.4], base: T.arcPts(5.5, 5.5, 2.15, -40, 135, 14), block: [2.4, 2.6, 8.6, 8.9],
      draw: function(o){
        var u = o.up, nut = o.paint && o.paint !== "cream" && T.PAINTS[o.paint] ? T.PAINTS[o.paint] : { c: "#E9B972", s: "#C48C48" }, s = "", lights = "", i;
        var c0 = P(5.5, 5.5, 0), cx = c0[0], gy = c0[1], a0 = T.RX(2), b0 = T.RY(2);
        var q = function(dx, dy){ return f(cx + dx) + " " + f(gy + dy); };
        /* the nut: narrow at the ground, widest under the cap, lit from the left */
        var nutD = "M" + q(-a0, 0) + " C" + q(-40, -14) + " " + q(-42, -40) + " " + q(-34, -58) + " L" + q(34, -58) + " C" + q(42, -40) + " " + q(40, -14) + " " + q(a0, 0) + " A" + f(a0) + " " + f(b0) + " 0 0 1 " + q(-a0, 0) + " Z";
        s += F(nutD, nut.c) + F("M" + q(10, -58) + " L" + q(34, -58) + " C" + q(42, -40) + " " + q(40, -14) + " " + q(a0, 0) + " A" + f(a0) + " " + f(b0) + " 0 0 1 " + q(8, b0 * .95) + " C" + q(21, -8) + " " + q(23, -36) + " " + q(10, -58) + " Z", nut.s) + O(nutD);
        s += L("M" + q(-15, 11) + " C" + q(-27, -10) + " " + q(-28, -34) + " " + q(-21, -50), .9, nut.s, .8) + L("M" + q(-3, 14) + " C" + q(-8, -6) + " " + q(-8, -26) + " " + q(-5, -36), .9, nut.s, .6) + T.HI("M" + q(-34, -34) + " Q" + q(-37, -21) + " " + q(-32, -8), 2);
        /* round windows: one by the door, one round the side */
        [[cx + 3, gy - 15, 6.4, 7], [cx + 29, gy - 26, 4.2, 6.2]].forEach(function(w){
          var g = ell(w[0], w[1], w[2] - 1.8, w[3] - 1.8, o.night ? K.lit : K.glass, 1.1) + L("M" + f(w[0] - w[2] + 1.8) + " " + f(w[1]) + " h" + f(2 * w[2] - 3.6) + " M" + f(w[0]) + " " + f(w[1] - w[3] + 1.8) + " v" + f(2 * w[3] - 3.6), 1);
          s += ell(w[0], w[1], w[2], w[3], "#FFF3D6", 1.5) + g;
          if (o.night) lights += T.glowAt(w[0], w[1], 10) + g;
        });
        /* the round door, on a stone step */
        var dp = P(5.5, 7.55, 0), dx = dp[0], dy = dp[1];
        s += ell(dx, dy + 2, 11, 4, K.stone, 1.2);
        s += ell(dx, dy - 10, 9.6, 10.8, "#7A4E2E", 1.8) + ell(dx, dy - 10, 7.4, 8.6, "#C4553A", 1.2) + L("M" + f(dx - 3.4) + " " + f(dy - 17.4) + " v14.8 M" + f(dx) + " " + f(dy - 18.4) + " v16.8 M" + f(dx + 3.4) + " " + f(dy - 17.4) + " v14.8", .9, "#8E3A2A") + circ(dx + 4.2, dy - 9.4, 1.6, K.gold, .8);
        /* the cap: a shallow dome with a scalloped rim that hangs over the nut, rows of scales on it */
        var ry0 = gy - 55.6, ax = T.RX(3.2), ay = T.RY(3.2), hy = 29, ty = ry0 - hy, n = 10;
        s += F("M" + f(cx - 33) + " " + f(ry0 + 14.2) + " A" + f(ax) + " " + f(ay) + " 0 0 0 " + f(cx + 33) + " " + f(ry0 + 14.2) + " v6 A" + f(ax) + " " + f(ay) + " 0 0 1 " + f(cx - 33) + " " + f(ry0 + 20.2) + " Z", INK, .16);
        var capD = "M" + f(cx - ax) + " " + f(ry0) + " A" + f(ax) + " " + f(hy) + " 0 0 1 " + f(cx + ax) + " " + f(ry0);
        for (i = 1; i <= n; i++){ var a = Math.PI * i / n, am = Math.PI * (i - .5) / n; capD += " Q" + f(cx + Math.cos(am) * (ax + 1.2)) + " " + f(ry0 + Math.sin(am) * (ay + 4)) + " " + f(cx + Math.cos(a) * ax) + " " + f(ry0 + Math.sin(a) * ay); }
        capD += " Z";
        s += F(capD, "#9A6A42") + F("M" + f(cx + ax * .12) + " " + f(ty) + " A" + f(ax) + " " + f(hy) + " 0 0 1 " + f(cx + ax) + " " + f(ry0) + " A" + f(ax) + " " + f(ay) + " 0 0 1 " + f(cx + ax * .12) + " " + f(ry0 + ay) + " A" + f(ax * .62) + " " + f((hy + ay) / 2) + " 0 0 0 " + f(cx + ax * .12) + " " + f(ty) + " Z", "#7A4E2E");
        var rows = "";
        [[.18, 9], [.42, 8], [.64, 6], [.84, 4]].forEach(function(r){
          var rho = Math.sqrt(1 - r[0] * r[0]), yy = ry0 - r[0] * hy * .88, m = r[1];
          rows += "M" + f(cx + ax * rho) + " " + f(yy);
          for (var j = 1; j <= m; j++){ var a1 = Math.PI * j / m, a2 = Math.PI * (j - .5) / m; rows += " Q" + f(cx + Math.cos(a2) * ax * rho) + " " + f(yy + Math.sin(a2) * ay * rho + 3.6) + " " + f(cx + Math.cos(a1) * ax * rho) + " " + f(yy + Math.sin(a1) * ay * rho); }
        });
        s += L(rows, 1.1, "#5E3A22", .8) + O(capD) + T.HI("M" + f(cx - ax * .7) + " " + f(ry0 - hy * .5) + " Q" + f(cx - ax * .5) + " " + f(ry0 - hy * .82) + " " + f(cx - ax * .2) + " " + f(ry0 - hy * .93), 2);
        if (o.snow) s += T.snowDome(5.5, 5.5, 5.3, 3.2, 2.3, .55);
        /* a little round attic window in the cap */
        var aw = [cx - 16, ry0 + 4], ag = ell(aw[0], aw[1], 3.9, 4.5, o.night ? K.lit : K.glass, 1) + L("M" + f(aw[0] - 3.9) + " " + f(aw[1]) + " h7.8 M" + f(aw[0]) + " " + f(aw[1] - 4.5) + " v9", .9);
        s += ell(aw[0], aw[1], 5.7, 6.3, "#FFF3D6", 1.4) + ag;
        if (o.night) lights += T.glowAt(aw[0], aw[1], 9) + ag;
        /* the stem is the chimney, with one last oak leaf on it */
        s += '<g transform="translate(' + f(cx + 4.4) + " " + f(ty + 3.2) + ') rotate(16) scale(1.15)">' + FO("M0 0 q3 -4 6 -2.6 q1.4 -3.4 5 -1.6 q2.6 -2.6 5.4 .4 q3 .6 3.6 3.2 q-2.6 2.6 -5.6 1.4 q-2 2.8 -5.2 1.2 q-3 2 -5.4 -.2 q-2.4 .4 -3.8 -1.8 z", "#E8A33D", 1) + L("M1.4 -.3 L18 -.5", .7, "#C2410C") + "</g>";
        s += FO("M" + f(cx - 4) + " " + f(ty + 3.4) + " C" + f(cx - 4.6) + " " + f(ty - 4) + " " + f(cx - 2) + " " + f(ty - 9) + " " + f(cx + 2) + " " + f(ty - 13) + " L" + f(cx + 8.6) + " " + f(ty - 10.4) + " C" + f(cx + 5.6) + " " + f(ty - 6) + " " + f(cx + 4.8) + " " + f(ty - 2) + " " + f(cx + 5.2) + " " + f(ty + 3.4) + " Q" + f(cx + .6) + " " + f(ty + 5.6) + " " + f(cx - 4) + " " + f(ty + 3.4) + " Z", "#7A4E2E", 1.6);
        s += '<g transform="translate(' + f(cx + 5.3) + " " + f(ty - 11.7) + ') rotate(22)">' + ell(0, 0, 3.7, 2, "#C9A27A", 1.1) + ell(0, 0, 1.6, .8, "#5E3A22", 0) + "</g>";
        s += T.smoke(cx + 8, ty - 19);
        if (u.flag) s += T.flagOn(4.1, 5.7, 6.9, 2.3);
        /* by the wall: mushrooms and a couple of leaves */
        s += shroom(cx + 33, gy + 2, .95, "#D9483B") + shroom(cx + 39, gy + 5, .65, "#D9483B") + leaf(cx - 31, gy + 13, 1.1, 20, LV[1]) + leaf(cx - 37, gy + 9, 1, -35, LV[3]);
        if (o.night) lights += T.firefly(150, 172, .2) + T.firefly(262, 118, 1.3) + T.firefly(240, 178, 2.1);
        return { body: s, lights: lights };
      }
    }
  };

  /* ------------------------------------------------------------------ the scene: autumn woods ----------------------- */
  var scenes = {
    "autumn-woods": T.hillScene({
      note: "A clearing in the fall woods: red, orange and gold trees all round, leaves coming down, mushrooms underfoot",
      path: "dirt", treeKind: "pine", lamp: "lantern", grade: ["#FFB25A", .06],
      ground: function(o){ return o.snow ? ["#F7FBFF", "#E8F0F8", "#D6E4F1", "#BCD2E6"] : o.night ? ["#6F865C", "#647B52", "#586E48", "#435838"] : ["#C3D083", "#B2C270", "#9EB05E", "#7B8F45"]; },
      sky: function(o){
        var c = o.night ? NLV : LV, lv = "";
        [[86, 46, 30, 0], [136, 70, -40, 1.2], [178, 30, 70, 2.4], [234, 56, 10, .6], [262, 26, -60, 3.1], [150, 20, 120, 3.8], [108, 22, -15, 2]].forEach(function(q, i){ lv += fallLeaf(q[0], q[1], 1.15, q[2], c[i % 5], q[3]); });
        if (o.night) return T.bands(["#191C44", "#22265A", "#2E316C", "#403C7A"], 0, 300) + T.moon(92, 40) + T.starField(17, 24, 104) + lv;
        return T.bands(["#BFE0EE", "#D0E8EE", "#E4EFE6", "#F7F1DA"], 0, 300) + T.sun(300, 34) + T.cloud(120, 30, .8) + T.cloud(216, 18, .55) + lv;
      },
      far: function(o){
        var night = o.night, snow = o.snow, s = "";
        var pal = snow ? [["#F7FBFF", "#DCEAF6"]] : night ? [["#94586A", "#774556"], ["#A0704E", "#82583E"], ["#A6945C", "#877748"], ["#9A644C", "#7C4E3C"]] : [["#D9483B", "#B5382E"], ["#F28C28", "#D46A12"], ["#F2C230", "#D9A21B"], ["#E8703A", "#C2410C"]];
        var haze = snow ? ["#EEF5FB", "#E3EDF6"] : night ? ["#4C4A72", "#57486C", "#4F5070"] : ["#F3C894", "#EDB184", "#F6DCA0"];
        var hill = snow ? "#EEF5FB" : night ? "#66704E" : "#D2C57C";
        /* the far woods: a hazy bank of treetops, tall at the edges and low behind the clearing */
        var tops = [[30, 86, 22], [62, 74, 20], [92, 84, 18], [120, 92, 16], [146, 100, 13], [168, 106, 11], [238, 106, 11], [260, 100, 13], [284, 92, 16], [310, 84, 18], [340, 72, 20], [372, 82, 22]], back = "", fillD = "M0 " + f(tops[0][1] + 10);
        tops.forEach(function(q, i){ back += FO(T.lumps(q[0], q[1], q[2], 90 + i, 8), haze[i % haze.length], 1.2); fillD += " L" + q[0] + " " + f(q[1] + q[2] * .45); });
        s += '<g opacity="' + (night ? ".9" : ".8") + '">' + back + F(fillD + " L400 92 V300 H0 Z", haze[0]) + "</g>";
        /* the ground under the near trees, then the trees themselves, back to front */
        s += F("M0 152 Q60 134 124 138 Q200 118 280 136 Q340 128 400 148 V300 H0 Z", hill) + L("M0 152 Q60 134 124 138 Q200 118 280 136 Q340 128 400 148", 1.3, INK, .5);
        [[52, 100, 15, 0, 142], [80, 90, 14, 2, 140], [104, 100, 12, 3, 139], [66, 124, 11, 2, 148, 1], [126, 98, 10, 0, 139], [42, 126, 12, 1, 153],
          [348, 100, 15, 1, 142], [322, 92, 14, 0, 140], [298, 100, 12, 2, 139], [334, 124, 11, 3, 150, 1], [276, 100, 10, 3, 139], [358, 128, 12, 0, 154]]
          .sort(function(a, b){ return a[4] - b[4]; }).forEach(function(q, i){ s += tree(q[0], q[1], q[2], pal[q[3] % pal.length], q[4], q[5], night, 70 + i); });
        return s;
      },
      flat: function(o, on){
        if (o.snow) return "";
        var c = o.night ? NLV : LV;
        return T.scatter(151, 16, on, function(sx, sy){ return T.tuft(sx, sy, o.night ? "#566C44" : "#8FA552", .8); }).join("") +
          T.scatter(152, 48, on, function(sx, sy, i){ return F(leafD(sx, sy, .8 + (i % 3) * .16, (i * 47) % 180), c[i % 5], .95); }).join("");
      },
      props: function(o, on){
        return T.scatter(153, 9, on, function(sx, sy, i, R, x, y){
          var night = o.night, wood = night ? ["#8A7260", "#665244"] : ["#C9A27A", "#8A5A3A"], red = night ? "#A0504E" : "#D9483B", s;
          if (i % 4 === 0) s = shroom(sx, sy, 1.15, red) + shroom(sx + 8, sy + 2, .75, red);
          else if (i % 4 === 1) s = T.canopy(sx, sy - 7, 8 + R() * 2, o.snow ? ["#F7FBFF", "#DCEAF6"] : night ? ["#9A644C", "#7C4E3C"] : [["#E8703A", "#C2410C"], ["#F2C230", "#D9A21B"], ["#D9483B", "#B5382E"]][i % 3], 50 + i);
          else if (i % 4 === 2) s = FO("M" + f(sx - 5.4) + " " + f(sy) + " q-.4 -5 .8 -8 h9.2 q1.2 3 .8 8 q-5.4 2.2 -10.8 0 z", wood[1], 1.3) + ell(sx, sy - 8, 4.7, 2.1, wood[0], 1.1) + L("M" + f(sx - 2) + " " + f(sy - 8) + " a2 .9 0 1 0 4 0 a2 .9 0 1 0 -4 0", .7, wood[1]) + leaf(sx + 8, sy + 1, 1, 25, night ? NLV[0] : LV[0]);
          else s = FO("M" + f(sx - 9) + " " + f(sy - 7.2) + " h16 a3 3.6 0 0 1 0 7.2 h-16 z", wood[1], 1.3) + ell(sx - 9, sy - 3.6, 3, 3.6, wood[0], 1.2) + circ(sx - 9, sy - 3.6, 1, wood[1]) + L("M" + f(sx - 3) + " " + f(sy - 5) + " h5 M" + f(sx + 1) + " " + f(sy - 2.4) + " h4", .7, INK, .4) + shroom(sx + 3, sy - 6.6, .62, night ? "#B09A70" : "#E8C27A");
          return { x: x, y: y, s: s };
        });
      },
      fg: function(o){
        if (o.snow) return "";
        var c = o.night ? NLV : LV;
        return fallLeaf(72, 170, 1.25, 30, c[1], .8) + fallLeaf(334, 188, 1.25, -50, c[3], 2.2) + fallLeaf(304, 236, 1.15, 80, c[0], 3.4) + fallLeaf(98, 246, 1.15, -20, c[2], 1.6);
      }
    })
  };

  /* ------------------------------------------------------------------ the yard -------------------------------------- */
  var yard = {
    "leaf-pile": {
      note: "A big raked-up pile of leaves, the rake still standing in it", spot: [3.3, 3.4],
      egg: { n: "The leaf pile", does: "leaves fly up", say: "Whee! Baby teeth are called deciduous: they fall out, like leaves." }, anim: "tp-jump 1.8s",
      draw: function(o){
        var g = P(1.7, 1.9, 0), x = g[0], y = g[1], c = o.night ? NLV : LV, R = T.rng(7), s = ell(x + 2, y + 3, 31, 12, "#1B2A3A", 0, .1), i;
        /* the rake, its fan of tines up */
        var r0 = P(2.9, .9, 0), r1 = P(2.2, .9, 3.4), hd = "";
        s += L(T.seg(r0, r1), 3.2) + L(T.seg(r0, r1), 1.6, K.wood);
        for (i = 0; i < 7; i++){ var a = (-152 + i * 20) * Math.PI / 180; hd += "M" + f(r1[0]) + " " + f(r1[1]) + " l" + f(Math.cos(a) * 11) + " " + f(Math.sin(a) * 11) + " "; }
        s += L(hd, 1.2) + L("M" + f(r1[0] - 6.2) + " " + f(r1[1] - 3.4) + " Q" + f(r1[0] - .6) + " " + f(r1[1] - 9.4) + " " + f(r1[0] + 5.4) + " " + f(r1[1] - 4.4), 1.2) + FO("M" + f(r1[0] - 3) + " " + f(r1[1] - 1.6) + " l2.6 -3.4 l3 2.6 l-2 3.4 z", "#5E8A3A", 1);
        /* the pile */
        var d = "M" + f(x - 27) + " " + f(y + 2) + " q-2 -10 6 -14 q2 -8 12 -9 q6 -6 14 -1 q10 0 13 9 q8 4 6 13 q-12 9 -27 8 q-15 0 -24 -6 z";
        s += F(d, c[0]) + F("M" + f(x + 5) + " " + f(y - 22) + " q13 -1 13 9 q8 4 6 13 q-12 9 -27 8 q14 -8 8 -30 z", c[1], .6) + O(d, 1.8);
        for (i = 0; i < 30; i++){ var lx = -24 + R() * 46, ly = -20 + R() * 25, e = (lx + 1) / 24, h = (ly + 7) / 13; if (e * e + h * h > .78) continue; s += leaf(x + lx, y + ly, 1.05 + R() * .5, R() * 180, c[(i + 1) % 5], .6); }
        s += leaf(x - 14, y + 11, 1.1, 15, c[3]) + leaf(x + 27, y + 4, 1.1, -30, c[1]) + leaf(x + 14, y + 11, 1, 60, c[0]) + leaf(x - 30, y + 5, 1, -20, c[4]);
        if (o.snow) s += ell(x + 2, y - 19, 12, 4, "#FFFFFF", 0);
        return s;
      },
      bits: function(){
        var g = P(1.7, 1.9, 0), s = "";
        [[-18, -34, 20], [-8, -45, 70], [4, -38, -30], [15, -47, 110], [23, -33, 0], [-2, -56, 45], [11, -28, -60], [-15, -24, 90]].forEach(function(q, i){ s += leaf(g[0] + q[0], g[1] + q[1], 1.35, q[2], LV[i % 5], .7); });
        return s;
      }
    },
    "cider-stand": {
      note: "A little wooden stand under a striped awning: jugs of fresh-pressed cider, a basket of apples and the press", spot: [3.3, 3.45],
      egg: { n: "The cider stand", does: "steam curls up from the warm cider", say: "Fresh-pressed apples, nothing added. Sip, then swish with water." }, anim: "tp-sparks 2s ease-out",
      draw: function(o){
        var s = ell.apply(null, P(1.9, 2.0, 0).concat([31, 11, "#1B2A3A", 0, .1])), wood = { top: K.woodLight, left: K.wood, right: K.woodShade }, pc = { top: K.woodLight, left: K.woodLight, right: K.wood }, i;
        var po = function(x, y, h){ return box(x, y, 0, .16, .16, h, pc, { sw: 1.2, si: .8 }); };
        var jug = function(q, k){ var x = q[0], y = q[1], t = function(a, b){ return f(a * k) + " " + f(b * k); };
          return FO("M" + f(x - 3.2 * k) + " " + f(y) + " q" + t(-1, -1) + " " + t(-1, -3) + " v" + f(-3 * k) + " q" + t(0, -2.6) + " " + t(2.6, -3.2) + " v" + f(-2.2 * k) + " h" + f(3.2 * k) + " v" + f(2.2 * k) + " q" + t(2.6, .6) + " " + t(2.6, 3.2) + " v" + f(3 * k) + " q" + t(0, 2) + " " + t(-1, 3) + " q" + t(-3.2, 1) + " " + t(-6.4, 0) + " z", "#D98E2B", 1) +
            FO("M" + f(x - 1.3 * k) + " " + f(y - 11.2 * k) + " h" + f(2.6 * k) + " v" + f(-1.9 * k) + " h" + f(-2.6 * k) + " z", "#C9A27A", .8) + L("M" + f(x + 1.7 * k) + " " + f(y - 9.4 * k) + " q" + t(3.6, .2) + " " + t(2.8, 3.2), 1) + L("M" + f(x - 2.4 * k) + " " + f(y - 6 * k) + " v" + f(3.4 * k), 1, "#FFE3A8", .9); };
        /* the back posts, the counter with an apple on its board, what's for sale, the front posts */
        s += po(.3, .95, 4.05) + po(3.14, .95, 4.05);
        s += box(.3, 1.2, 0, 3.0, 1.1, 1.15, wood);
        for (i = 1; i < 5; i++) s += L(D([[.3 + i * .6, 2.3, .05], [.3 + i * .6, 2.3, 1.1]], true), .8, K.woodShade, .8);
        var sg = P(2.2, 2.3, .58); s += circ(sg[0], sg[1], 5, "#FFF3D6", 1.2) + apple(sg[0], sg[1] + .8, 2.9);
        s += jug(P(.7, 1.8, 1.15), .95) + jug(P(1.25, 1.65, 1.15), .8);
        var bk = P(2.7, 1.7, 1.15);
        s += apple(bk[0] - 2.8, bk[1] - 4, 2.4) + apple(bk[0] + 2.6, bk[1] - 3.8, 2.4, "#9CCB5A") + apple(bk[0], bk[1] - 6.2, 2.4) + FO("M" + f(bk[0] - 6) + " " + f(bk[1] - 3) + " q.6 4.8 6 4.8 q5.4 0 6 -4.8 z", "#C99A5B", 1) + L("M" + f(bk[0] - 4.6) + " " + f(bk[1] - .6) + " q4.6 1.6 9.2 0", .7, "#8A6A3A");
        s += po(.3, 2.2, 3.5) + po(3.14, 2.2, 3.5);
        /* the awning: stripes, a scalloped edge, a lantern under it */
        var x0 = .05, x1 = 3.55, yb = .85, yf = 2.75, zb = 4.2, zf = 3.6, w = (x1 - x0) / 7, col = ["#C4553A", "#FFF3D6"];
        for (i = 0; i < 7; i++) s += F(D([[x0 + i * w, yb, zb], [x0 + (i + 1) * w, yb, zb], [x0 + (i + 1) * w, yf, zf], [x0 + i * w, yf, zf]]), col[i % 2]);
        s += O(D([[x0, yb, zb], [x1, yb, zb], [x1, yf, zf], [x0, yf, zf]]), 1.6) + FO(D([[x1, yb, zb], [x1, yf, zf], [x1, yf, zf - .3], [x1, yb, zb - .3]]), "#A8402E", 1.1);
        var ln = P(2.95, yf, zf - .3); s += L("M" + f(ln[0]) + " " + f(ln[1]) + " v4.6", 1.1) + FO("M" + f(ln[0] - 2.3) + " " + f(ln[1] + 4.4) + " h4.6 l-.7 5 h-3.2 z", o.night ? K.lit : "#FFF3C4", 1);
        for (i = 0; i < 7; i++){ var a = P(x0 + i * w, yf, zf), b = P(x0 + (i + 1) * w, yf, zf), a2 = P(x0 + i * w, yf, zf - .28), b2 = P(x0 + (i + 1) * w, yf, zf - .28), m = P(x0 + (i + .5) * w, yf, zf - .5);
          s += FO("M" + f(a[0]) + " " + f(a[1]) + " L" + f(b[0]) + " " + f(b[1]) + " L" + f(b2[0]) + " " + f(b2[1]) + " Q" + f(m[0]) + " " + f(m[1] + 1) + " " + f(a2[0]) + " " + f(a2[1]) + " Z", col[i % 2], 1); }
        if (o.snow) s += FO(D([[x0, yb, zb + .04], [x1, yb, zb + .04], [x1, yb + .8, zb - .22], [x0, yb + .8, zb - .22]]), "#FFFFFF", 1);
        /* the press out front: a tub of apples under a screw */
        var b0 = P(.75, 3.0, 0), bx = b0[0], by = b0[1];
        s += L("M" + f(bx - 8.4) + " " + f(by - 1) + " v-24 M" + f(bx + 8.4) + " " + f(by + 1) + " v-24", 3.4) + L("M" + f(bx - 8.4) + " " + f(by - 1) + " v-24 M" + f(bx + 8.4) + " " + f(by + 1) + " v-24", 1.8, K.wood);
        s += cyl(.75, 3.0, 0, .5, .78, .56, K.woodLight, K.wood, "#E0B060", { sw: 1.4, si: 1 });
        s += L("M" + f(bx - 3.4) + " " + f(by + 3.6) + " v-7.4 M" + f(bx) + " " + f(by + 4.2) + " v-7.6 M" + f(bx + 3.4) + " " + f(by + 3.6) + " v-7.4", .8, K.woodShade) + L("M" + f(bx - 6.4) + " " + f(by - 3.6) + " q6.4 4 12.8 0", 1.3, "#8E98A3");
        s += ell(bx, by - 9, 5, 2.2, K.wood, 1) + L("M" + f(bx) + " " + f(by - 9.6) + " v-18", 2.6) + L("M" + f(bx) + " " + f(by - 9.6) + " v-18", 1.2, "#C9D2DA");
        s += L("M" + f(bx - 10) + " " + f(by - 25.4) + " L" + f(bx + 10) + " " + f(by - 23.4), 4.4) + L("M" + f(bx - 10) + " " + f(by - 25.4) + " L" + f(bx + 10) + " " + f(by - 23.4), 2.4, K.woodLight);
        s += L("M" + f(bx - 6) + " " + f(by - 29.4) + " h12", 2.8) + L("M" + f(bx - 6) + " " + f(by - 29.4) + " h12", 1.3, "#C9D2DA") + circ(bx - 6, by - 29.4, 1.5, K.red, .7) + circ(bx + 6, by - 29.4, 1.5, K.red, .7);
        s += apple(bx + 12, by + 5, 2.3) + apple(bx - 9.6, by + 6.4, 2.2, "#9CCB5A");
        return s;
      },
      lights: function(){ var ln = P(2.95, 2.75, 3.3); return T.glowAt(ln[0], ln[1] + 7, 11); },
      bits: function(){ var a = P(.7, 1.8, 1.15), b = P(1.25, 1.65, 1.15); return L("M" + f(a[0] - 1) + " " + f(a[1] - 15) + " q-2 -3 0 -6 q2 -3 0 -6 M" + f(b[0] + 1) + " " + f(b[1] - 13) + " q-2 -3 0 -6 q2 -3 0 -6", 1.4, "#FFFFFF", .9); }
    },
    "apple-tree": {
      note: "An apple tree heavy with red apples, a rope swing on its branch and a basket for the windfalls", spot: [3.3, 3.4],
      egg: { n: "The apple tree", does: "an apple drops into the basket", say: "Crunch! An apple gets your saliva flowing, and saliva guards your enamel." }, anim: "tp-pop 2.2s",
      draw: function(o){
        var g = P(1.3, 1.6, 0), x = g[0], y = g[1], lf = o.snow ? ["#7CB98A", "#5A9A6A"] : o.night ? ["#4F8E58", "#3A6E46"] : ["#7CC46A", "#4F9A52"], s = ell(x + 6, y + 3, 31, 11, "#1B2A3A", 0, .1), rope = "#D9C7A0";
        /* the branch and its swing, then the trunk and the leaves over them */
        var br = D([[1.3, 1.6, 2.25], [3.3, 1.6, 2.6]], true), zr = function(bx){ return 2.25 + (bx - 1.3) * .175; };
        s += L(br, 5) + L(br, 3, K.wood);
        var sw = "";
        [2.45, 2.95].forEach(function(bx){ var d = D([[bx, 1.6, zr(bx)], [bx, 1.6, .82]], true); sw += L(d, 2) + L(d, .9, rope); });
        sw += box(2.28, 1.4, .72, .84, .4, .1, { top: K.woodLight, left: K.wood, right: K.woodShade }, { sw: 1.3, si: .8 });
        s += G("tp-bob", sw);
        var bd = P(3.2, 1.6, 2.62); s += ell(bd[0], bd[1] - 3.4, 3.4, 2.7, o.night ? "#6E8FB0" : "#5DBDEB", 1) + circ(bd[0] + 2, bd[1] - 5.6, 2, o.night ? "#6E8FB0" : "#5DBDEB", 1) + circ(bd[0] + 2.7, bd[1] - 6, .5, INK) + FO("M" + f(bd[0] + 3.8) + " " + f(bd[1] - 5.8) + " l2.4 .6 l-2.4 .9 z", K.orange, .6) + L("M" + f(bd[0] - 3) + " " + f(bd[1] - 3.2) + " l-2.6 -1.6", 1.3);
        s += FO("M" + f(x - 3.8) + " " + f(y) + " q1 -13 -1 -26 l9 0 q-2 13 -1.2 26 q-3.4 1.4 -6.8 0 z", K.wood, 1.6) + F("M" + f(x + .6) + " " + f(y) + " q-1 -13 1 -26 l2.6 0 q-2 13 -1.2 26 z", K.woodShade) + L("M" + f(x - 1.6) + " " + f(y - 6) + " q.8 -4 0 -8", .9, K.woodShade);
        s += T.canopy(x - 10, y - 33, 13, lf, 31) + T.canopy(x + 11, y - 35, 13, lf, 32) + T.canopy(x, y - 45, 14, lf, 33);
        if (o.snow) s += ell(x - 1, y - 55, 11, 3.6, "#FFFFFF", 0);
        [[-17, -31], [-7, -39], [3, -29], [14, -43], [20, -32], [-2, -52], [-15, -42], [9, -51]].forEach(function(q){ s += apple(x + q[0], y + q[1], 2.5); });
        /* the basket, and a few windfalls */
        var bk = P(.7, 2.95, 0);
        s += apple(bk[0] - 3, bk[1] - 7.4, 2.4) + apple(bk[0] + 2.6, bk[1] - 7.2, 2.4) + apple(bk[0], bk[1] - 9.4, 2.4) + FO("M" + f(bk[0] - 6.4) + " " + f(bk[1] - 6.4) + " l1.5 6.2 q4.9 1.7 9.8 0 l1.5 -6.2 q-6.4 2.4 -12.8 0 z", "#C99A5B", 1.1) + L("M" + f(bk[0] - 5.6) + " " + f(bk[1] - 3) + " q5.6 2 11.2 0", .7, "#8A6A3A");
        s += apple(x + 9, y + 8, 2.3) + apple(x + 22, y + 13, 2.3) + leaf(x - 2, y + 12, 1, 30, LV[3]);
        return s;
      },
      bits: function(){ var bk = P(.7, 2.95, 0); return apple(bk[0] + .6, bk[1] - 21, 2.8) + L("M" + f(bk[0] - 2.4) + " " + f(bk[1] - 27) + " v-5 M" + f(bk[0] + 3.6) + " " + f(bk[1] - 27) + " v-5", 1, INK, .5); }
    }
  };

  /* ------------------------------------------------------------------ the outfits ----------------------------------- */
  var CAP = "M54 48 C50 18 72 0 100 0 C128 0 150 18 146 48 Q100 58 54 48 Z", TW = "#A68A66", TWD = "#8A6E50";
  var chev = function(y, x0, x1){ var d = ""; for (var x = x0; x <= x1; x += 12) d += "M" + x + " " + y + " l3 -3.4 l3 3.4 "; return d; };
  var outfits = {
    "flannel": {
      note: "A buffalo-plaid cap and a chunky knit scarf",
      face: p("M118 132 L137 128 L143 162 L124 166 Z", "#E8A33D", O3) + '<path d="M120.6 148 L140 144" stroke="#FFF3D6" stroke-width="4.4"/><path d="M126 166 l1 7 M131 165 l1 7 M136 164 l1 7 M141 163 l1 7" stroke="' + INK + '" stroke-width="2.2" stroke-linecap="round"/>' +
        p("M54 116 Q100 136 146 116 L148 130 Q100 152 52 130 Z", "#E8A33D", O3) + '<path d="M69 124 l-2 11.4 M85 128.4 l-1 12.4 M100 130 v13 M115 128.4 l1 12.4" stroke="#FFF3D6" stroke-width="4.4"/>' +
        p("M119 121 Q130 114 139 122 Q144 132 133 137 Q121 137 119 121 Z", "#D98E2B", O3),
      top: p(CAP, "#D9483B") + '<path d="M77 49 C75 29 80 13 88 5 M100 51 V3 M123 49 C125 29 120 13 112 5" fill="none" stroke="#2B2230" stroke-width="7" opacity=".42"/><path d="M58 35 Q100 44 142 35 M64 18 Q100 26 136 18" fill="none" stroke="#2B2230" stroke-width="7" opacity=".42"/>' +
        '<path d="' + CAP + '" fill="none" ' + O4 + "/>" + p("M60 47 Q100 57 140 47 Q152 56 138 62 Q100 71 62 62 Q48 56 60 47 Z", "#2B2230", O3) + '<path d="M72 60 Q100 66 128 60" fill="none" stroke="#5E5062" stroke-width="2" stroke-linecap="round"/>' +
        '<circle cx="100" cy="1" r="5" fill="#2B2230" ' + O2 + "/>",
      say: ["Flannel season! Cozy outside, minty inside.", "This scarf is hand-knit. So are my study habits.", "Sweater weather is flossing weather. So is all weather."]
    },
    "fox-hood": {
      note: "A fox hood with ears up top, white cheeks round his face and a bushy tail behind",
      back: p("M148 128 C174 134 196 114 194 86 C193 68 188 56 180 52 C175 63 171 76 160 86 C152 93 148 102 148 112 Z", "#E8742C") + p("M194 86 C193 68 188 56 180 52 C176 61 173 69 168 77 C178 74 187 78 194 86 Z", "#FFFDF6", O3),
      top: p("M44 54 L28 -20 L94 14 Z", "#E8742C") + p("M50 40 L39 -5 L80 17 Z", "#FFE9D2", O2) + p("M28 -20 L32.4 1 L47 -10.2 Z", "#3B2E3A", O2) +
        p("M156 54 L172 -20 L106 14 Z", "#E8742C") + p("M150 40 L161 -5 L120 17 Z", "#FFE9D2", O2) + p("M172 -20 L167.6 1 L153 -10.2 Z", "#3B2E3A", O2) +
        '<path d="M46 118 C36 96 34 60 46 38 C58 14 78 6 100 6 C122 6 142 14 154 38 C166 60 164 96 154 118 C140 134 120 138 100 138 C80 138 60 134 46 118 Z M56 90 C56 70 74 60 100 60 C126 60 144 70 144 90 C144 108 126 118 100 118 C74 118 56 108 56 90 Z" fill="#E8742C" fill-rule="evenodd" ' + O4 + "/>" +
        p("M36 98 L46 104 C50 124 66 136 100 138 C134 136 150 124 154 104 L164 98 L146 96 C142 110 126 118 100 118 C74 118 58 110 54 96 Z", "#FFFDF6", O3) +
        '<path d="M60 34 Q74 16 94 12" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".5"/>',
      say: ["What does the fox say? Floss!", "Sly as a fox, sharp as a canine.", "A fox has 42 teeth. I am just the one."]
    },
    "tweed-professor": {
      note: "A tweed cap and jacket with elbow patches, a bow tie, round glasses and a good book",
      face: p("M72 113 L100 136 L128 113 Q100 121 72 113 Z", "#FFFDF6", O3) +
        p("M46 106 Q45 120 51 131 Q100 160 149 131 Q155 120 154 106 L128 113 L100 136 L72 113 Z", TW, O3) + '<path d="' + chev(128, 56, 80) + chev(128, 114, 138) + chev(140, 76, 124) + '" fill="none" stroke="' + TWD + '" stroke-width="1.6"/>' +
        p("M72 113 L100 136 L89 139 L66 120 Z", "#BFA47E", O2) + p("M128 113 L100 136 L111 139 L134 120 Z", "#BFA47E", O2) +
        p("M100 122 L87 114 L87 130 Z", "#B5382E", O2) + p("M100 122 L113 114 L113 130 Z", "#B5382E", O2) + '<circle cx="100" cy="122" r="3.8" fill="#D9483B" ' + O2 + "/>" +
        p("M57 104 Q46 98 37 104 Q32 113 37 123 Q47 127 57 120 Z", TW, O3) + '<ellipse cx="45.6" cy="113.4" rx="4.8" ry="4.2" fill="#C99A5B" ' + O2 + "/>" +
        p("M143 104 Q154 98 163 104 Q168 113 163 123 Q153 127 143 120 Z", TW, O3) + '<ellipse cx="154.4" cy="113.4" rx="4.8" ry="4.2" fill="#C99A5B" ' + O2 + "/>" +
        '<g transform="translate(179 121) rotate(-12)">' + p("M-8 -12.6 h20 v27 h-20 z", "#FFFDF6", O2) + p("M-11 -14 h20 v27 h-20 z", "#2F7FD0", O3) + '<path d="M-7 -14 v27" stroke="#1C5C88" stroke-width="2"/>' + T.tinyTooth(1.6, -.6, 1.3, "#FFFDF6") + "</g>" +
        '<circle cx="80" cy="85" r="13.5" fill="#FFFFFF" fill-opacity=".2" ' + O3 + '/><circle cx="120" cy="85" r="13.5" fill="#FFFFFF" fill-opacity=".2" ' + O3 + '/><path d="M93 82 Q100 77 107 82 M66.6 83 L50 79 M133.4 83 L150 79" fill="none" ' + O3 + ' stroke-linecap="round"/>',
      top: p("M52 46 C48 24 70 8 104 8 C134 8 152 22 150 44 Q100 54 52 46 Z", TW) + '<path d="' + chev(24, 76, 124) + chev(36, 62, 134) + '" fill="none" stroke="' + TWD + '" stroke-width="1.6"/>' +
        p("M58 46 Q100 55 146 44 Q154 54 140 59 Q100 67 64 60 Q50 55 58 46 Z", TWD, O3) + '<circle cx="103" cy="9" r="4.4" fill="' + TWD + '" ' + O2 + "/>",
      say: ["Class is in session. Today's topic: the first molar. That's me.", "Tweed, elbow patches and a good book. Open to chapter one: enamel.", "Any questions? No? Then go brush."]
    }
  };

  return { k: "fall", homes: homes, scenes: scenes, yard: yard, outfits: outfits };
}
