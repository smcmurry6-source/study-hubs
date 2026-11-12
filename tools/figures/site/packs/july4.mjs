/* The Fourth of July set of Timmy's place (tools/figures/site/sets.mjs lists its eight pieces; the shop's catalog has the
   same rows), in red, white and blue. One self-contained function: the build hands it the kit's tools (place.mjs, TOOLS)
   and pastes its source into tools/preview/design/place.js, so it uses nothing from outside itself but T.
   (packs/thanksgiving.mjs is the worked example and says what each kind of piece needs.)
   Never sugar (Timmy is a tooth): the picnic is watermelon, corn and water. No ids, gradients, filters, text, images or
   emoji: flat fills and ink outlines. */
export function pack(T){
  var K = T.K, P = T.P, D = T.D, f = T.f, F = T.F, O = T.O, L = T.L, FO = T.FO, G = T.G, circ = T.circ, ell = T.ell, box = T.box, cyl = T.cyl, INK = T.INK;
  var p = T.p, O2 = T.O2, O3 = T.O3;
  var RED = "#D9423B", REDS = "#B33029", WHT = "#FFFDF6", WHTS = "#E3DCCB", BLU = "#2F5FA8", BLUS = "#234A86", SKY = "#6FA0DE", GOLD = "#F2C94C";
  var RWB = [RED, WHT, BLU];
  function ring(x, y, r, c, w, op){ return '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(r) + '" fill="none" stroke="' + c + '" stroke-width="' + w + '"' + (op ? ' opacity="' + op + '"' : "") + "/>"; }
  function rot(x, y, deg, s){ return '<g transform="translate(' + f(x) + " " + f(y) + ") rotate(" + f(deg) + ')">' + s + "</g>"; }
  /* a firework: rays out from a middle, a dot at each tip */
  function burst(x, y, r, c, n, cls){
    var d = "", dots = "";
    for (var i = 0; i < n; i++){
      var a = i / n * Math.PI * 2 + .3, ca = Math.cos(a), sa = Math.sin(a);
      d += "M" + f(x + ca * r * .3) + " " + f(y + sa * r * .3) + " L" + f(x + ca * r * .84) + " " + f(y + sa * r * .84 + r * .04);
      dots += circ(x + ca * r, y + sa * r + r * .08, Math.max(.9, r * .075), i % 2 ? "#FFFFFF" : c);
      if (r > 14) dots += circ(x + ca * r * .58 - sa * 1.6, y + sa * r * .58 + ca * 1.6, .8, "#FFFFFF");
    }
    return G(cls || "", L(d, Math.max(1, r * .075), c) + dots + circ(x, y, Math.max(1.2, r * .1), "#FFFFFF"));
  }
  /* a string of pennants between two points on screen */
  function pennants(x0, y0, x1, y1, sag, n, k){
    var mx = (x0 + x1) / 2, my = (y0 + y1) / 2 + sag * 2, s = L("M" + f(x0) + " " + f(y0) + " Q" + f(mx) + " " + f(my) + " " + f(x1) + " " + f(y1), .9, INK, .85);
    for (var i = 0; i < n; i++){
      var t = (i + .5) / n, u = 1 - t, px = u * u * x0 + 2 * u * t * mx + t * t * x1, py = u * u * y0 + 2 * u * t * my + t * t * y1;
      s += FO("M" + f(px - 2.3 * k) + " " + f(py - .4) + " h" + f(4.6 * k) + " l" + f(-2.3 * k) + " " + f(5.4 * k) + " z", RWB[i % 3], .7);
    }
    return s;
  }
  /* a striped tent, upright on screen: x, y is the middle of its foot */
  function tent(x, y, w, h, c1, c2, fc){
    var hw = w / 2, yt = y - h * .42, n = 6, i, s = "", bw = w * 1.12, b0 = x - bw / 2, top = y - h;
    s += F("M" + f(x - hw) + " " + f(y) + " V" + f(yt) + " H" + f(x + hw) + " V" + f(y) + " Z", c2);
    for (i = 0; i < n; i += 2) s += F("M" + f(x - hw + w * i / n) + " " + f(yt) + " h" + f(w / n) + " V" + f(y) + " h" + f(-w / n) + " Z", c1);
    s += O("M" + f(x - hw) + " " + f(y) + " V" + f(yt) + " H" + f(x + hw) + " V" + f(y), 1.4);
    s += FO("M" + f(x - w * .1) + " " + f(y) + " V" + f(y - h * .26) + " q" + f(w * .1) + " " + f(-h * .1) + " " + f(w * .2) + " 0 V" + f(y) + " Z", "#4A3550", 1);
    for (i = 0; i < n; i++) s += F("M" + f(x) + " " + f(top) + " L" + f(b0 + bw * i / n) + " " + f(yt) + " L" + f(b0 + bw * (i + 1) / n) + " " + f(yt) + " Z", i % 2 ? c2 : c1);
    for (i = 0; i < n; i++) s += FO("M" + f(b0 + bw * i / n) + " " + f(yt) + " q" + f(bw / n / 2) + " " + f(h * .1) + " " + f(bw / n) + " 0 z", i % 2 ? c1 : c2, .8);
    s += O("M" + f(x) + " " + f(top) + " L" + f(b0) + " " + f(yt) + " H" + f(b0 + bw) + " Z", 1.4);
    s += L("M" + f(x) + " " + f(top) + " v" + f(-h * .22), 1.1) + FO("M" + f(x) + " " + f(top - h * .22) + " l" + f(w * .2) + " " + f(h * .06) + " l" + f(-w * .2) + " " + f(h * .06) + " z", fc, .8);
    return s;
  }
  /* a Ferris wheel far off, flat to the viewer */
  function farWheel(cx, cy, R, night){
    var legs = "M" + f(cx) + " " + f(cy) + " L" + f(cx - R * .62) + " " + f(cy + R * 1.9) + " M" + f(cx) + " " + f(cy) + " L" + f(cx + R * .62) + " " + f(cy + R * 1.9), s, d = "", i, a;
    s = L(legs, 3.4) + L(legs, 1.6, night ? "#A9B3BE" : "#E9EEF2") + ring(cx, cy, R, INK, 3.2) + ring(cx, cy, R, night ? "#C2575B" : RED, 1.6) + ring(cx, cy, R * .7, INK, .8, ".6");
    for (i = 0; i < 8; i++){ a = (i * 45 + 22.5) * Math.PI / 180; d += "M" + f(cx) + " " + f(cy) + " L" + f(cx + Math.cos(a) * R) + " " + f(cy + Math.sin(a) * R); }
    s += L(d, .9, INK, .7);
    for (i = 0; i < 8; i++){
      a = (i * 45 + 22.5) * Math.PI / 180; var gx = cx + Math.cos(a) * R, gy = cy + Math.sin(a) * R;
      s += FO("M" + f(gx - 3) + " " + f(gy + 1.6) + " h6 l-.7 4.6 h-4.6 z", RWB[i % 3], .8) + FO("M" + f(gx - 3.4) + " " + f(gy + 1.6) + " q3.4 -4 6.8 0 z", i % 3 === 1 ? RED : WHT, .7);
    }
    s += circ(cx, cy, 3, GOLD, 1);
    if (night) for (i = 0; i < 16; i++){ a = i / 16 * Math.PI * 2; s += circ(cx + Math.cos(a) * R, cy + Math.sin(a) * R, 1.2, i % 2 ? "#FFF3C4" : "#FFD86B"); }
    return s;
  }
  function pinwheel(x, y, k){
    var s = L("M" + f(x) + " " + f(y) + " v" + f(-12 * k), 2.2) + L("M" + f(x) + " " + f(y) + " v" + f(-12 * k), 1, WHT), b = "";
    for (var i = 0; i < 4; i++) b += '<g transform="rotate(' + (i * 90 + 20) + ')">' + FO("M0 0 L0 " + f(-5.6 * k) + " L" + f(4.4 * k) + " " + f(-4.2 * k) + " Z", i % 2 ? BLU : RED, .7) + "</g>";
    return s + '<g transform="translate(' + f(x) + " " + f(y - 12 * k) + ')">' + b + circ(0, 0, 1.1 * k, WHT, .6) + "</g>";
  }
  function balloons(x, y, k){
    var s = "", q = [[-5, -19, RED], [1, -24, WHT], [6.4, -18, BLU]];
    q.forEach(function(b){ s += L("M" + f(x) + " " + f(y) + " Q" + f(x + b[0] * k * .3) + " " + f(y + b[1] * k * .5) + " " + f(x + b[0] * k) + " " + f(y + (b[1] + 5) * k), .7, INK, .8); });
    q.forEach(function(b){ s += ell(x + b[0] * k, y + b[1] * k, 3.9 * k, 4.9 * k, b[2], .9) + L("M" + f(x + (b[0] - 1.8) * k) + " " + f(y + (b[1] - 1.6) * k) + " q.6 -1.6 1.8 -2", .8, "#FFFFFF", .8); });
    return s;
  }
  /* a rocket standing on its tail at 0, 0 (upright on screen): c is its body, t its nose */
  function rocket(c, t, k){
    k = k || 1;
    return L("M0 " + f(3 * k) + " V" + f(-6 * k), 1.2, K.woodShade) + FO("M" + f(-2.7 * k) + " " + f(-5 * k) + " v" + f(-11 * k) + " h" + f(5.4 * k) + " v" + f(11 * k) + " z", c, 1.1) +
      F("M" + f(-2.7 * k) + " " + f(-11.6 * k) + " h" + f(5.4 * k) + " v" + f(2.4 * k) + " h" + f(-5.4 * k) + " z", c === WHT ? RED : WHT, .95) +
      FO("M" + f(-3.6 * k) + " " + f(-16 * k) + " L0 " + f(-24 * k) + " L" + f(3.6 * k) + " " + f(-16 * k) + " z", t, 1.1);
  }

  /* ------------------------------------------------------------------ the home: an A-frame cabin -------------------- */
  var homes = {
    "a-frame-cabin": {
      note: "A tall A-frame, its whole front glass, bunting along the deck and a star on the roof",
      ups: ["flag", "paint"], upn: { flag: "A Timmy flag on the peak", paint: "Roof paint" },
      door: [5.5, 8.6], brush: [7.7, 9.2], statue: [3.2, 9.5], spots: { door: [6.5, 10.2] }, h: 9.0,
      eaves: [[3.85, 9.6, 3.6], [7.15, 9.6, 3.6]], foot: [2.2, 4.4, 8.8, 8.6], base: [[2.2, 8.6], [8.8, 8.6], [8.8, 4.4]], block: [2.0, 4.1, 9.2, 9.0],
      draw: function(o){
        var u = o.up, rp = o.paint && o.paint !== "cream" ? T.BOLD[o.paint] : { c: "#3F6FB8", s: "#2C5490" }, s = "", lights = "", i;
        var x0 = 2.2, x1 = 8.8, xm = 5.5, y0 = 4.4, y1 = 8.6, zr = 8.4, ov = .35, yf = y1 + ov, e = .4, HB = 3.3, zt = zr + .3, xe = x1 + .15;
        var hw = function(z){ return HB * (1 - z / zr); }, le = function(z){ return xm - hw(z) + e; }, re = function(z){ return xm + hw(z) - e; };
        var sl = function(t, y){ return [xe - (xe - xm) * t, y, zt * t]; }, SL = Math.sqrt((xe - xm) * (xe - xm) + zt * zt), sp = function(v, y){ return sl(v / SL, y); };
        var glass = o.night ? K.lit : K.glassDay, wall = function(pts){ return D(T.onY(y1, pts)); }, wl = function(pts){ return D(T.onY(y1, pts), true); };
        /* the front: a wood frame, all of it glass */
        s += FO(wall([[x0, 0], [x1, 0], [xm, zr]]), "#C98F5A");
        var panes = [
          [[le(.2), .2], [4.55, .2], [4.55, 3.0], [le(3.0), 3.0]], [[6.45, .2], [re(.2), .2], [re(3.0), 3.0], [6.45, 3.0]], [[4.85, 2.74], [6.15, 2.74], [6.15, 3.0], [4.85, 3.0]],
          [[le(3.75), 3.75], [xm - .1, 3.75], [xm - .1, 5.6], [le(5.6), 5.6]], [[xm + .1, 3.75], [re(3.75), 3.75], [re(5.6), 5.6], [xm + .1, 5.6]],
          [[le(5.8), 5.8], [re(5.8), 5.8], [xm, zr * (1 - e / HB)]]
        ];
        panes.forEach(function(q){ s += FO(wall(q), glass, 1.3); });
        s += L(wl([[3.7, .2], [3.7, 2.66]]) + wl([[le(1.5), 1.5], [4.55, 1.5]]) + wl([[7.3, .2], [7.3, 2.66]]) + wl([[6.45, 1.5], [re(1.5), 1.5]]) + wl([[le(4.75), 4.75], [xm - .1, 4.75]]) + wl([[xm + .1, 4.75], [re(4.75), 4.75]]), 1.1);
        if (!o.night) s += T.HI(wl([[3.1, .7], [3.4, 1.15]]) + wl([[6.7, .7], [7.0, 1.15]]) + wl([[4.6, 4.95], [4.9, 5.4]]) + wl([[5.3, 6.1], [5.5, 6.5]]), 1.4);
        /* the door, red, with its own little window */
        s += FO(wall(T.rectUV(4.85, 6.15, 0, 2.58)), RED, 1.8) + FO(wall(T.rectUV(5.12, 5.88, 1.45, 2.25)), glass, 1.1) + L(wl([[5.5, 1.45], [5.5, 2.25]]), .9) + O(wall(T.rectUV(5.12, 5.88, .3, 1.15)), .9);
        var kn = P(5.98, y1, 1.3); s += circ(kn[0], kn[1], 1.3, GOLD, .8);
        s += box(4.7, y1, 0, 1.6, .45, .14, { top: K.woodLight, left: K.wood, right: K.woodShade }, { sw: 1.3, si: .9 });
        /* the roof's near side comes right down to the ground: shingle rows, a skylight and one big star */
        s += FO(D([sl(0, y0 - ov), sl(0, yf), sl(1, yf), sl(1, y0 - ov)]), rp.c, 1.8) + F(D([sl(0, y0 - ov), sl(0, yf), sl(.1, yf), sl(.1, y0 - ov)]), rp.s, .7);
        for (i = 1; i < 10; i++) s += L(D([sl(i / 10, y0 - ov), sl(i / 10, yf)], true), .8, INK, .28);
        var star = []; for (i = 0; i < 10; i++){ var a = i * Math.PI / 5, rd = i % 2 ? .56 : 1.4; star.push(sp(6.0 + rd * Math.cos(a), 6.35 + rd * Math.sin(a))); }
        s += FO(D(star), WHT, 1.2);
        var sky = [sp(1.4, 6.9), sp(1.4, 8.4), sp(3.0, 8.4), sp(3.0, 6.9)], skp = [sp(1.6, 7.08), sp(1.6, 8.22), sp(2.8, 8.22), sp(2.8, 7.08)], skl = L(D([sp(2.2, 7.08), sp(2.2, 8.22)], true), .9);
        s += FO(D(sky), WHT, 1.3) + FO(D(skp), glass, 1) + skl;
        if (o.night){ var sc = P.apply(null, sp(2.2, 7.65)); lights += T.glowAt(sc[0], sc[1], 9) + FO(D(skp), K.lit, 1) + skl; }
        if (o.snow) s += FO(D([sl(.84, y0 - ov), sl(.84, yf), sl(1, yf), sl(1, y0 - ov)]), "#FFFFFF", 1.2);
        /* white barge boards up both edges of the front */
        s += FO(D(T.onY(yf, [[x0 - .15, 0], [xm, zt], [xe, 0], [x1 - .32, 0], [xm, zr - .45], [x0 + .32, 0]])), WHT, 1.6);
        /* the deck: a balcony across the front with a white rail, and bunting hung along it */
        var bx0 = 3.85, bx1 = 7.15, by = y1 + 1.0, bz = 3.5, bt = bz + .16, rz = bt + .9;
        var rail = function(a, b, w){ return L(D([a, b], true), w || 2.8) + L(D([a, b], true), (w || 2.8) / 2, WHT); };
        [bx0 + .3, bx1 - .3].forEach(function(bx){ var br = D([[bx, y1, bz - .85], [bx, by - .15, bz]], true); s += L(br, 2.8) + L(br, 1.4, K.wood); });
        s += rail([bx0, y1, rz], [bx0, by, rz]);
        s += box(bx0, y1, bz, bx1 - bx0, 1.0, .16, { top: K.woodLight, left: K.wood, right: K.woodShade }, { sw: 1.5, si: 1 });
        [4.975, 6.025].forEach(function(bx){ s += rail([bx, by, bt], [bx, by, rz], 2.2); });
        s += L(D([[bx1, y1 + .5, bt], [bx1, y1 + .5, rz]], true), 1.6) + rail([bx1, y1, rz], [bx1, by, rz]) + rail([bx0, by, bt], [bx0, by, rz]) + rail([bx1, by, bt], [bx1, by, rz]) + rail([bx0, by, rz], [bx1, by, rz]);
        [4.45, 5.5, 6.55].forEach(function(uc){
          var half = function(r){ var pts = []; for (var j = 0; j <= 10; j++){ var q = Math.PI * j / 10; pts.push([uc + Math.cos(q) * r, by + .02, rz - .02 - Math.sin(q) * r]); } return D(pts); };
          s += FO(half(.54), RED, 1.2) + F(half(.38), WHT) + F(half(.21), BLU);
        });
        /* on the peak: the Timmy flag, or a gold star */
        var pk = P(xm, yf, zt);
        s += u.flag ? T.flagOn(xm, yf, zt - .1, 2.2) : L("M" + f(pk[0]) + " " + f(pk[1]) + " v-4", 1.6) + T.star5(pk[0], pk[1] - 7.4, 4.6, GOLD);
        /* planters by the door, in red, white and blue */
        [4.3, 6.7].forEach(function(px){
          s += box(px - .28, y1 + .06, 0, .56, .4, .34, { top: K.soilShade, left: WHT, right: WHTS }, { sw: 1.2, si: .8 });
          [[-.17, RED], [0, "#FFFFFF"], [.17, SKY]].forEach(function(q, j){ var c = P(px + q[0], y1 + .26, .46 + (j === 1 ? .12 : 0)); s += circ(c[0], c[1], 1.8, q[1], .7); });
        });
        if (o.night){
          var g1 = P(xm, y1, 5.1), g2 = P(3.9, y1, 1.4), g3 = P(7.1, y1, 1.4);
          lights += T.glowAt(g1[0], g1[1], 17) + T.glowAt(g2[0], g2[1], 9) + T.glowAt(g3[0], g3[1], 9);
          [[[le(4.5), 4.5], [xm - .1, 4.5], [xm - .1, 5.6], [le(5.6), 5.6]], [[xm + .1, 4.5], [re(4.5) - .12, 4.5], [re(5.6) - .12, 5.6], [xm + .1, 5.6]], [[le(5.8), 5.8], [re(5.8) - .12, 5.8], [xm, zr * (1 - e / HB) - .2]]].forEach(function(q){ lights += FO(wall(q), K.lit, 1.3); });
          lights += L(wl([[le(4.75), 4.75], [xm - .1, 4.75]]) + wl([[xm + .1, 4.75], [re(4.75) - .12, 4.75]]), 1.1) + T.firefly(124, 152, .4) + T.firefly(262, 150, 1.5);
        }
        return { body: s, lights: lights };
      }
    }
  };

  /* ------------------------------------------------------------------ the scene: the fairgrounds -------------------- */
  var scenes = {
    fairgrounds: T.hillScene({ farLift: 15,
      note: "Striped tents, strings of pennants and a Ferris wheel; fireworks at night",
      path: "dirt", treeKind: "round", lamp: "post", grade: ["#FFE7B0", .05],
      ground: function(o){ return o.snow ? ["#F7FBFF", "#E8F0F8", "#D6E4F1", "#BCD2E6"] : o.night ? ["#5C8F5E", "#518154", "#467249", "#38603C"] : ["#B4DC84", "#A3D075", "#8FC265", "#6FA44C"]; },
      sky: function(o){
        if (o.night){
          var s = T.bands(["#121848", "#1A225C", "#262E6E", "#363A80"], 0, 300) + T.starField(7, 22, 130);
          [[100, 30, 22], [306, 48, 23], [256, 20, 12], [150, 20, 11], [58, 60, 9]].forEach(function(q){ s += L("M" + f(q[0] + 2) + " " + f(q[1] + q[2] * 2.4) + " Q" + f(q[0] + 3) + " " + f(q[1] + q[2] * 1.4) + " " + f(q[0]) + " " + f(q[1] + q[2] * .5), .9, "#FFFFFF", .3); });
          return s + burst(100, 30, 22, "#FF7A70", 12, "tp-twinkle") + burst(306, 48, 23, "#8FB8FF", 12) + burst(256, 20, 12, "#FFD86B", 10, "tp-twinkle") + burst(150, 20, 11, "#FFFFFF", 10) + burst(58, 60, 9, "#FFD86B", 8);
        }
        return T.bands(["#9CD3F5", "#B2DDF7", "#C9E8FA", "#E0F2FC"], 0, 300) + T.sun(322, 38) + T.cloud(126, 32, .8) + T.cloud(250, 22, .6) + G("tp-float", balloons(272, 72, 1));
      },
      far: function(o){
        var c = o.snow ? "#EEF5FB" : o.night ? "#4E7A5C" : "#CBE8A6", s = "", w = o.night ? "#D9D4CC" : WHT;
        s += F("M0 156 Q60 140 130 146 Q200 124 286 140 Q340 128 400 142 V300 H0 Z", c) + L("M0 156 Q60 140 130 146 Q200 124 286 140 Q340 128 400 142", 1.4, INK, .5);
        /* the Ferris wheel, a little tent under it, and a string of pennants across */
        s += '<g opacity=".96">' + farWheel(84, 82, 29, o.night) + "</g>";
        s += tent(64, 152, 28, 32, o.night ? "#2A4F8C" : BLU, w, RED);
        s += L("M118 112 V88", 2.6) + L("M118 112 V88", 1.2, w) + pennants(118, 89, 64, 119, 5, 9, 1);
        /* the big top, pennants from its peak to a pole on each side */
        s += L("M296 122 V100 M354 136 V96", 2.6) + L("M296 122 V100 M354 136 V96", 1.2, w);
        s += tent(326, 138, 50, 54, o.night ? "#B5383A" : RED, w, BLU) + pennants(326, 86, 296, 101, 2.5, 5, 1) + pennants(326, 86, 354, 97, 2.5, 5, 1);
        return s;
      },
      flat: function(o, on){
        if (o.snow) return "";
        var tc = o.night ? "#3F7448" : "#6FA44C";
        return T.scatter(151, 34, on, function(sx, sy){ return T.tuft(sx, sy, tc, .8); }).join("") +
          T.scatter(152, 26, on, function(sx, sy, i){ return '<path d="M' + f(sx) + " " + f(sy) + ' l2.6 .9 -.9 2.6 -2.6 -.9 z" fill="' + (o.night ? ["#A8575A", "#C9C9D6", "#5670A8"] : ["#E5625C", "#FFFFFF", "#4F7FC8"])[i % 3] + '"/>'; }).join("");
      },
      props: function(o, on){
        return T.scatter(153, 9, on, function(sx, sy, i, R, x, y){
          var k = i % 4, s;
          if (k === 0) s = ell(sx, sy, 12, 3.4, "#1B2A3A", 0, .1) + tent(sx, sy, 20, 24, i % 8 ? BLU : RED, WHT, i % 8 ? RED : BLU);
          else if (k === 1) s = pinwheel(sx - 5, sy, 1) + pinwheel(sx + 4, sy + 2, .8);
          else if (k === 2) s = L("M" + f(sx - 13) + " " + f(sy) + " v-15 M" + f(sx + 13) + " " + f(sy + 3) + " v-15", 2.6) + L("M" + f(sx - 13) + " " + f(sy) + " v-15 M" + f(sx + 13) + " " + f(sy + 3) + " v-15", 1.2, WHT) + pennants(sx - 13, sy - 14.4, sx + 13, sy - 11.4, 2.5, 5, .9);
          else s = L("M" + f(sx) + " " + f(sy) + " v-5", 2) + circ(sx, sy, 1.4, K.woodShade, .7) + balloons(sx, sy - 3, .9);
          return { x: x, y: y, s: s };
        });
      }
    })
  };

  /* ------------------------------------------------------------------ the yard -------------------------------------- */
  var WZ = 2.5, WR = 1.75, WY = 1.7;
  function wheelPt(a, r, y){ return P(1.8 + Math.cos(a) * r, y, WZ + Math.sin(a) * r); }
  var yard = {
    "picnic-blanket": {
      note: "A checked blanket with a basket, watermelon, corn and a jug of water", spot: [3.4, 3.45],
      egg: { n: "The picnic blanket", does: "ants march in for a crumb", say: "Ants! Guard the corn. And floss after it: kernels love to hide." }, anim: "tp-peek 2.4s",
      draw: function(o){
        var a = .2, b = .3, c = .4, n = 7, z = .03, e = a + n * c, g = b + n * c, i, j, s = ell.apply(null, P(1.7, 1.8, 0).concat([33, 11, "#1B2A3A", 0, .08]));
        s += F(D([[a, b, z], [e, b, z], [e, g, z], [a, g, z]]), WHT);
        for (i = 0; i < n; i++) for (j = 0; j < n; j++) if ((i + j) % 2 === 0) s += F(D([[a + i * c, b + j * c, z], [a + (i + 1) * c, b + j * c, z], [a + (i + 1) * c, b + (j + 1) * c, z], [a + i * c, b + (j + 1) * c, z]]), RED, .94);
        s += L(D([[a + .13, b + .13, z], [e - .13, b + .13, z], [e - .13, g - .13, z], [a + .13, g - .13, z]]), 1.1, BLU) + O(D([[a, b, z], [e, b, z], [e, g, z], [a, g, z]]), 1.5);
        /* the basket, lid open a crack, a cloth over its side */
        var wk = ["#E8C27A", "#D9A857", "#B98537"], hd = []; for (i = 0; i <= 10; i++){ var q = Math.PI * i / 10; hd.push([1.02 + Math.cos(q) * .5, .98, .66 + Math.sin(q) * .62]); }
        s += L(D(hd, true), 3.2) + L(D(hd, true), 1.6, wk[1]);
        s += box(.45, .58, z, 1.15, .8, .64, { top: wk[0], left: wk[1], right: wk[2] }, { sw: 1.4, si: .9 });
        s += L(D([[.45, 1.38, .26], [1.6, 1.38, .26]], true) + D([[.45, 1.38, .46], [1.6, 1.38, .46]], true) + D([[1.6, .58, .26], [1.6, 1.38, .26]], true) + D([[1.6, .58, .46], [1.6, 1.38, .46]], true) + D([[1.02, .58, .67], [1.02, 1.38, .67]], true), .8, "#8A6226", .8);
        s += FO(D(T.onY(1.39, [[.62, .68], [1.18, .68], [.9, .2]])), WHT, 1) + L(D(T.onY(1.39, [[.74, .58], [1.06, .58]]), true) + D(T.onY(1.39, [[.82, .44], [.98, .44]]), true), 1.1, BLU);
        /* watermelon: a big slice and a wedge */
        var w = P(2.35, .95, z), wx = w[0], wy = w[1];
        s += FO("M" + f(wx - 10) + " " + f(wy - 9) + " a10 10 0 0 0 20 0 z", "#3E9B4F", 1.3) + F("M" + f(wx - 8.5) + " " + f(wy - 9) + " a8.5 8.5 0 0 0 17 0 z", "#EEF5D6") + F("M" + f(wx - 7.3) + " " + f(wy - 9) + " a7.3 7.3 0 0 0 14.6 0 z", "#F0525A") + L("M" + f(wx - 10) + " " + f(wy - 9) + " h20", 1.2);
        [[-4, -6.6], [0, -4.4], [4, -6.6], [-1.6, -7.4], [2, -7]].forEach(function(q){ s += ell(wx + q[0], wy + q[1], .7, 1, "#3B2E3A"); });
        var v = P(2.75, 1.55, z); s += FO("M" + f(v[0] - 5) + " " + f(v[1]) + " h10 l-5 -10.4 z", "#F0525A", 1.1) + L("M" + f(v[0] - 4.6) + " " + f(v[1] - .2) + " h9.2", 2.2, "#3E9B4F") + ell(v[0] - 1, v[1] - 4, .6, .9, "#3B2E3A") + ell(v[0] + 1.2, v[1] - 6, .6, .9, "#3B2E3A");
        /* corn on a plate, and a jug of water with two cups */
        var pl = P(.95, 2.3, z); s += ell(pl[0], pl[1], 7.6, 3.6, WHT, 1) + '<ellipse cx="' + f(pl[0]) + '" cy="' + f(pl[1]) + '" rx="6" ry="2.7" fill="none" stroke="' + SKY + '" stroke-width=".9"/>';
        var cob = function(dx, dy, r){ return rot(pl[0] + dx, pl[1] + dy, r, FO("M4 -1.8 q4.6 -1 6 1.8 q-3.6 2 -6 0 z", "#7DB84F", .7) + ell(0, 0, 5.4, 2.1, "#F2C230", .9) + L("M-3.2 -1.2 v2.4 M-1 -1.7 v3.4 M1.2 -1.7 v3.4 M3.2 -1.2 v2.4 M-4.6 0 h9", .5, "#C9971C")); };
        s += cob(-.6, -1.6, -16) + cob(.8, .8, 10);
        var jg = P(2.2, 2.5, z); s += FO("M" + f(jg[0] - 3) + " " + f(jg[1]) + " v-7.6 l-.9 -1.8 h5.8 v9.4 q-2.5 1.3 -4.9 0 z", "#CFEFFC", 1) + L("M" + f(jg[0] + 2.8) + " " + f(jg[1] - 7) + " q3.4 .6 2.6 3.8 q-.6 1.8 -2.6 1.6", 1) + F("M" + f(jg[0] - 2.6) + " " + f(jg[1] - .6) + " v-4.6 h5.2 v4.6 q-2.6 1.1 -5.2 0 z", K.water, .85);
        var cup = function(q, col){ return FO("M" + f(q[0] - 2) + " " + f(q[1] - 4.4) + " h4 l-.5 4.4 q-1.5 .7 -3 0 z", col, .9); };
        s += cup(P(1.55, 2.95, z), RED) + cup(P(2.0, 3.0, z), SKY);
        if (o.snow) s += ell.apply(null, P(1.0, 1.0, .72).concat([7, 2.6, "#FFFFFF", 0]));
        return s;
      },
      bits: function(){
        var s = ""; [.35, .85, 1.35, 1.85].forEach(function(x, i){ var q = P(x, 3.42, 0), a = q[0], b = q[1]; s += L("M" + f(a - .6) + " " + f(b) + " l-1 1.6 M" + f(a + 1.6) + " " + f(b + .6) + " l0 1.8 M" + f(a + 3.6) + " " + f(b + 1.2) + " l1 1.6 M" + f(a + 4.6) + " " + f(b - .6) + " l1.6 -1.4", .7) + circ(a, b - .4, 1.2, INK) + circ(a + 2, b + .3, .95, INK) + circ(a + 4, b + 1, 1.3, INK) + (i === 3 ? circ(a + 5.6, b - 1, 1.3, "#F2C230", .6) : ""); });
        return s;
      }
    },
    "fireworks-launcher": {
      note: "A rack of rockets in their tubes, a bucket of water standing by", spot: [3.45, 3.45],
      egg: { n: "The fireworks launcher", does: "fireworks burst overhead", say: "Boom! Enamel is the hardest stuff in your body. Stand back anyway." }, anim: "tp-pop 2.2s",
      draw: function(o){
        var wood = { top: K.woodLight, left: K.wood, right: K.woodShade }, thin = { sw: 1.3, si: .8 }, s = ell.apply(null, P(1.9, 1.9, 0).concat([31, 10, "#1B2A3A", 0, .1])), i;
        s += box(.3, 1.2, 0, 3.1, 1.1, .28, wood);
        s += box(.36, 1.26, .28, .16, .16, 1.55, wood, thin) + box(3.18, 1.26, .28, .16, .16, 1.55, wood, thin) + box(.36, 1.3, 1.5, 2.98, .09, .16, wood, thin);
        var cols = [[RED, REDS], [WHT, WHTS], [BLU, BLUS], [WHT, WHTS], [RED, REDS]], tilt = [-12, -5, 0, 6, 12], rk = [[BLU, RED], [RED, BLU], [WHT, RED], [RED, BLU], [BLU, RED]];
        for (i = 0; i < 5; i++){
          var tx = .78 + i * .56, tp = P(tx, 1.75, 1.72);
          s += cyl(tx, 1.75, .28, .21, 1.72, .21, cols[i][0], cols[i][1], "#3B2E3A", { sw: 1.4, si: .9 });
          s += L(D([[tx - .2, 1.96, 1.2], [tx + .2, 1.96, 1.2]], true), 1.6, i % 2 ? BLU : WHT, .9);
          s += rot(tp[0], tp[1] + 1, tilt[i], rocket(rk[i][0], rk[i][1], 1));
        }
        s += box(.36, 2.02, .28, .16, .16, .86, wood, thin) + box(3.18, 2.02, .28, .16, .16, .86, wood, thin) + box(.36, 2.05, .98, 2.98, .09, .16, wood, thin);
        /* the fuse, a spare rocket on the grass and a bucket of water, just in case */
        var f0 = P(1.9, 2.3, .1), f1 = P(2.45, 3.05, 0);
        s += L("M" + f(f0[0]) + " " + f(f0[1]) + " q-5 4 0 6 q6 2 " + f(f1[0] - f0[0]) + " " + f(f1[1] - f0[1] - 6), 1.2, "#5E4A3A");
        s += o.night ? T.dmStar(f1[0], f1[1], 4.4, "#FFD86B", "tp-twinkle") + circ(f1[0], f1[1], 1.2, "#FFFFFF") : circ(f1[0], f1[1], 1.1, "#5E4A3A");
        var sr = P(1.35, 3.0, .12); s += rot(sr[0], sr[1], 118, rocket(WHT, BLU, .9));
        s += cyl(.62, 2.95, 0, .26, .58, .36, SKY, "#4878B8", K.water, { sw: 1.4, si: .9 });
        var bk = P(.62, 2.95, .58); s += L("M" + f(bk[0] - 4.4) + " " + f(bk[1]) + " q4.4 -9 8.8 0", 1.1);
        if (o.snow) s += ell.apply(null, P(1.9, 1.35, 1.68).concat([13, 2.4, "#FFFFFF", 0]));
        return s;
      },
      lights: function(){ var f1 = P(2.45, 3.05, 0); return T.glowAt(f1[0], f1[1], 7); },
      bits: function(){ var c = P(1.9, 1.75, 1.72); return burst(c[0] - 17, c[1] - 40, 11, "#FF6A60", 10) + burst(c[0] + 16, c[1] - 36, 10, "#6FA8FF", 10) + burst(c[0] - 1, c[1] - 52, 13, "#FFD23F", 12); }
    },
    "ferris-wheel": {
      note: "A little Ferris wheel, six seats in red, white and blue, its lights on at night", spot: [3.45, 3.45],
      egg: { n: "The little Ferris wheel", does: "the lights flash and the music plays", say: "Round and round! Brush in little circles too, two minutes a ride." }, anim: "tp-pop 2.2s",
      draw: function(o){
        var s = ell.apply(null, P(1.9, 1.9, 0).concat([32, 11, "#1B2A3A", 0, .1])), i, a, q;
        var leg = function(y){ var d = D([[1.8, y, WZ], [.62, y, .2]], true) + D([[1.8, y, WZ], [2.98, y, .2]], true); return L(d, 3) + L(d, 1.4, y < WY ? "#C9D2DB" : WHT); };
        s += box(.25, 1.0, 0, 3.1, 1.5, .2, { top: "#E9EEF2", left: BLU, right: BLUS }, { sw: 1.5, si: 1 });
        for (i = 0; i < 5; i++){ q = P(.6 + i * .6, 2.5, .1); s += T.star5(q[0], q[1], 1.9, WHT).replace(/ stroke="[^"]*" stroke-width="[^"]*"/, ""); }
        s += leg(WY - .5);
        /* the wheel: two rims, twelve spokes, six seats */
        var rim = function(r){ var pts = []; for (var j = 0; j < 32; j++){ var t = j / 32 * Math.PI * 2; pts.push([1.8 + Math.cos(t) * r, WY, WZ + Math.sin(t) * r]); } return D(pts); }, sp = "";
        for (i = 0; i < 12; i++){ a = i * 30 * Math.PI / 180; q = wheelPt(a, WR, WY); var c = wheelPt(0, 0, WY); sp += "M" + f(c[0]) + " " + f(c[1]) + " L" + f(q[0]) + " " + f(q[1]); }
        s += L(sp, .9, INK, .7) + L(rim(WR * .62), 1, INK, .7) + L(rim(WR), 4) + L(rim(WR), 2, RED);
        for (i = 0; i < 16; i++){ q = wheelPt(i / 16 * Math.PI * 2, WR, WY); s += circ(q[0], q[1], 1.15, o.night ? K.litHot : "#FFFFFF", .5); }
        for (i = 0; i < 6; i++){
          a = i * 60 * Math.PI / 180; q = wheelPt(a, WR, WY);
          s += L("M" + f(q[0]) + " " + f(q[1]) + " v2.4", 1) + FO("M" + f(q[0] - 3.9) + " " + f(q[1] + 3.4) + " h7.8 l-.9 5.4 q-3 1.2 -6 0 z", RWB[i % 3], 1) + FO("M" + f(q[0] - 4.4) + " " + f(q[1] + 3.4) + " q4.4 -5 8.8 0 z", i % 3 === 1 ? RED : WHT, .9);
        }
        s += leg(WY + .5);
        var br = D([[1.21, WY + .5, 1.35], [2.39, WY + .5, 1.35]], true); s += L(br, 2.6) + L(br, 1.2, WHT);
        var h = P(1.8, WY + .5, WZ); s += circ(h[0], h[1], 4.2, GOLD, 1.3) + T.star5(h[0], h[1], 2.8, WHT);
        if (o.snow) s += ell.apply(null, wheelPt(Math.PI / 2, WR + .08, WY).concat([8, 2, "#FFFFFF", 0]));
        return s;
      },
      lights: function(){
        var s = "", i, q, h = P(1.8, WY + .5, WZ);
        for (i = 0; i < 16; i++){ q = wheelPt(i / 16 * Math.PI * 2, WR, WY); s += (i % 2 ? "" : T.glowAt(q[0], q[1], 4.6)) + circ(q[0], q[1], 1.3, i % 2 ? K.litHot : "#FFE08A"); }
        return s + T.glowAt(h[0], h[1], 8);
      },
      bits: function(){
        var t = wheelPt(Math.PI / 2, WR, WY), s = "";
        [[-26, 2, "#FFD23F", 4], [25, -2, "#FFFFFF", 3.4], [-15, -9, "#FF6A60", 3], [16, -11, "#6FA8FF", 3.6]].forEach(function(q){ s += T.dmStar(t[0] + q[0], t[1] + q[1], q[3], q[2], ""); });
        [[-32, 22], [30, 18]].forEach(function(q){ var x = t[0] + q[0], y = t[1] + q[1]; s += ell(x, y, 2, 1.5, INK) + L("M" + f(x + 1.8) + " " + f(y) + " v-7 l3.4 1.4", 1.1); });
        return s;
      }
    }
  };

  /* ------------------------------------------------------------------ the outfits ----------------------------------- */
  var VG = "#8ED1BE", VGS = "#62B49E", VGD = "#3F8F7B";
  var hatStripes = (function(){
    var s = "", xt = function(t){ return 64 + 72 * t; }, yt = function(t){ return -18 - 20 * t * (1 - t); }, xb = function(t){ return 66.5 + 67 * t; }, yb = function(t){ return 18 + 16 * t * (1 - t); };
    for (var i = 0; i < 7; i += 2){ var a = i / 7, b = (i + 1) / 7, m = (a + b) / 2; s += '<path d="M' + f(xt(a)) + " " + f(yt(a)) + " L" + f(xt(m)) + " " + f(yt(m)) + " L" + f(xt(b)) + " " + f(yt(b)) + " L" + f(xb(b)) + " " + f(yb(b) + 1) + " L" + f(xb(m)) + " " + f(yb(m) + 1) + " L" + f(xb(a)) + " " + f(yb(a) + 1) + ' Z" fill="' + RED + '"/>'; }
    return s;
  })();
  var crown = (function(){
    var s = "";
    [-75, -50, -25, 0, 25, 50, 75].forEach(function(dg){
      var a = dg * Math.PI / 180, ux = Math.sin(a), uy = -Math.cos(a), r1 = dg === 0 ? 66 : 61, bx = 100 + ux * 15, by = 52 + uy * 15, px = -uy * 6.6, py = ux * 6.6;
      s += p("M" + f(bx - px) + " " + f(by - py) + " L" + f(100 + ux * r1) + " " + f(52 + uy * r1) + " L" + f(bx + px) + " " + f(by + py) + " Z", dg > 0 ? VGS : VG, O3);
    });
    s += p("M56 50 Q100 22 144 50 L144 61 Q100 35 56 61 Z", VG, O3) + '<path d="M60 52 Q100 27 140 52" fill="none" stroke="#C6EDE1" stroke-width="2.4"/>';
    [.2, .35, .5, .65, .8].forEach(function(t){ var u = 1 - t, x = u * u * 56 + 2 * u * t * 100 + t * t * 144, y = u * u * 56.5 + 2 * u * t * 30 + t * t * 56.5; s += '<ellipse cx="' + f(x) + '" cy="' + f(y) + '" rx="2.8" ry="3.2" fill="' + VGD + '" stroke="' + INK + '" stroke-width="1.2"/>'; });
    return s;
  })();
  var stick = function(x0, y0, x1, y1){ return '<path d="M' + x0 + " " + y0 + " L" + x1 + " " + y1 + '" stroke="' + INK + '" stroke-width="6.4" stroke-linecap="round"/><path d="M' + x0 + " " + y0 + " L" + x1 + " " + y1 + '" stroke="#E2B887" stroke-width="3" stroke-linecap="round"/><circle cx="' + x1 + '" cy="' + y1 + '" r="3.6" fill="#E2B887" ' + O2 + "/>"; };
  var outfits = {
    "stars-top-hat": {
      note: "A tall striped top hat, white stars round its blue band",
      top: '<ellipse cx="100" cy="42" rx="57" ry="11.5" fill="' + WHT + '" ' + T.O4 + "/>" + p("M68 40 L64 -18 Q100 -28 136 -18 L132 40 Q100 49 68 40 Z", WHT) + hatStripes +
        p("M66.5 18 Q100 26 133.5 18 L132 40 Q100 49 68 40 Z", BLU, O3) + T.star5(81, 30.5, 5.4, "#FFFFFF") + T.star5(100, 34.6, 5.4, "#FFFFFF") + T.star5(119, 30.5, 5.4, "#FFFFFF") +
        '<path d="M68 40 L64 -18 Q100 -28 136 -18 L132 40" fill="none" ' + T.O4 + '/><path d="M46 45 Q100 62 154 45" fill="none" stroke="' + RED + '" stroke-width="2.6"/><path d="M72 -8 L74 12" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".7"/>',
      say: ["Hats off to healthy teeth! Well, hat on.", "Red, white and blue. Mostly white: I brush.", "Stars on my hat, sparkle on my enamel."]
    },
    "drum-major": {
      note: "A tall blue hat with a red plume, a drum on a strap and two sticks",
      face: '<path d="M54 108 Q62 124 76 130 M146 108 Q138 124 124 130" fill="none" stroke="' + INK + '" stroke-width="7" stroke-linecap="round"/><path d="M54 108 Q62 124 76 130 M146 108 Q138 124 124 130" fill="none" stroke="' + WHT + '" stroke-width="3.6" stroke-linecap="round"/>' +
        p("M72 127 L72 145 Q100 157 128 145 L128 127 Z", RED, O3) + '<path d="M74 133 L83 147 L91.5 137 L100 152 L108.5 137 L117 147 L126 133" fill="none" stroke="' + WHT + '" stroke-width="2"/>' +
        '<path d="M72 143 Q100 155 128 143" fill="none" stroke="' + GOLD + '" stroke-width="3.4"/>' + '<ellipse cx="100" cy="127" rx="28" ry="7.4" fill="' + WHT + '" ' + O3 + '/><ellipse cx="100" cy="127" rx="28" ry="7.4" fill="none" stroke="' + GOLD + '" stroke-width="1.6"/>' +
        '<path d="M72 127 L72 145 Q100 157 128 145 L128 127" fill="none" ' + O3 + "/>" + stick(40, 108, 88, 125) + stick(160, 108, 112, 125),
      top: p("M94 4 C82 -10 88 -30 103 -36 C116 -28 120 -10 108 4 Z", RED, O3) + '<path d="M101 -28 Q98 -12 101 2 M94 -14 q4 2 6 6 M110 -16 q-4 2 -6 6" fill="none" stroke="' + REDS + '" stroke-width="2"/>' +
        p("M67 40 L71 2 Q100 -6 129 2 L133 40 Q100 48 67 40 Z", BLU) + '<path d="M72 8 Q100 0 128 8" fill="none" stroke="' + GOLD + '" stroke-width="4"/>' +
        p("M68 30 Q100 22 132 30 L133 40 Q100 48 67 40 Z", WHT, O3) + p("M61 42 Q100 62 141 42 Q128 55 100 57 Q74 55 61 42 Z", "#2B2230", O3) +
        '<circle cx="100" cy="4" r="6" fill="' + WHT + '" ' + O2 + "/>" + T.star5(100, 19, 8, GOLD) + '<path d="M69 40 Q100 56 131 40" fill="none" stroke="' + GOLD + '" stroke-width="3"/>',
      say: ["Rat-a-tat-tat! That's the sound of good study habits.", "March in place while you brush: two whole minutes.", "I lead the band. The molars bring up the rear."]
    },
    "lady-liberty": {
      note: "A spiked crown, a green robe, a tablet and a torch held high",
      face: p("M54 126 Q100 130 130 112 Q144 103 151 88 L147 120 L144 138 Q134 148 100 157 Q66 148 56 138 Z", VG, O3) + '<path d="M58 131 Q100 135 131 117 Q143 109 148 97" fill="none" stroke="#C6EDE1" stroke-width="3"/>' +
        '<path d="M132 120 Q112 138 106 154 M112 130 Q94 140 86 150 M90 135 Q78 140 70 146 M143 110 Q140 126 136 142" fill="none" stroke="' + VGD + '" stroke-width="2.2" stroke-linecap="round"/>' +
        p("M21 100 L45 93 L52 126 L28 133 Z", VG, O3) + '<path d="M29 107 l13 -3.8 M31 115 l13 -3.8 M33 123 l13 -3.8" fill="none" stroke="' + VGD + '" stroke-width="2.2" stroke-linecap="round"/>' +
        p("M161 121 L165 80 L175 80 L172 122 Z", VGS, O3) + p("M155 80 L185 80 L181 68 L159 68 Z", VG, O3) + '<path d="M158 74 H182" fill="none" stroke="' + VGD + '" stroke-width="2"/>' +
        p("M170 68 C157 57 164 45 171 32 C174 45 187 54 181 68 Z", "#F5B93A", O3) + '<path d="M171 66 C165 60 168 53 171 46 C173 53 178 58 176 66 Z" fill="#FFF0B3"/>',
      top: crown,
      say: ["Give me your tired, your poor, your unflossed molars.", "Liberty and floss for all!", "I hold my torch up by a golden crown. Porcelain works too."]
    }
  };

  return { k: "july4", homes: homes, scenes: scenes, yard: yard, outfits: outfits };
}
