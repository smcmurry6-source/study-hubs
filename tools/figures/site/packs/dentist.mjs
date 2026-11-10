/* The Dentist's Day set of Timmy's place (tools/figures/site/sets.mjs lists its eight pieces; the shop's catalog has the
   same rows). One self-contained function: the build hands it the kit's tools (place.mjs, TOOLS) and pastes its source
   into tools/preview/design/place.js, so it may use nothing from outside itself but T. Structure: packs/thanksgiving.mjs.

   The instruments are drawn as they are: a mouth mirror is a small round mirror on a thin handle, its head set at an
   angle to the shank; an explorer is a thin probe that ends in a hook (the shepherd's hook); cotton pliers are a long
   pair of tweezers with bent tips. The egg lines' facts: the first reclining dental chair is James Snell's, 1832;
   enamel is the hardest tissue in the body.
   Never sugar (Timmy is a tooth). No ids, gradients, filters, text, images or emoji: flat fills and ink outlines. */
export function pack(T){
  var K = T.K, P = T.P, D = T.D, f = T.f, F = T.F, O = T.O, L = T.L, FO = T.FO, G = T.G, circ = T.circ, ell = T.ell, box = T.box, cyl = T.cyl, INK = T.INK;
  var p = T.p, O2 = T.O2, O3 = T.O3, onY = T.onY, onX = T.onX, rectUV = T.rectUV;
  var TEAL = ["#5CCFC0", "#3BA89C", "#2B857C"], UPH = { top: "#9BE8DC", left: "#5CCFC0", right: "#3BA89C" }, STEEL = { top: "#EEF2F6", left: "#D9DFE5", right: "#A9B3BE" };

  /* a molar standing on its two roots: (0, 0) is between the root tips, the cusps top out at -30k */
  function molarD(k, dx, dy){
    var q = function(a, b){ return f((dx || 0) + a * k) + " " + f((dy || 0) + b * k); };
    return "M" + q(-12, -16) + " C" + q(-13, -25) + " " + q(-9, -30) + " " + q(-5, -29) + " C" + q(-3, -28.5) + " " + q(-1.5, -27.2) + " " + q(0, -27.2) + " C" + q(1.5, -27.2) + " " + q(3, -28.5) + " " + q(5, -29) +
      " C" + q(9, -30) + " " + q(13, -25) + " " + q(12, -16) + " C" + q(11.5, -11) + " " + q(10, -8) + " " + q(9.5, -2) + " C" + q(9.2, 1) + " " + q(6, 1.2) + " " + q(5.4, -2) + " L" + q(4, -9) + " C" + q(3, -12) + " " + q(-3, -12) + " " + q(-4, -9) +
      " L" + q(-5.4, -2) + " C" + q(-6, 1.2) + " " + q(-9.2, 1) + " " + q(-9.5, -2) + " C" + q(-10, -8) + " " + q(-11.5, -11) + " " + q(-12, -16) + " Z";
  }
  /* a flat drawing laid on a wall: on one turned left (y = const) or one turned right (x = const) */
  function shY(x, y, z, s){ var q = P(x, y, z); return '<g transform="matrix(.866 .5 0 1 ' + f(q[0]) + " " + f(q[1]) + ')">' + s + "</g>"; }
  function shX(x, y, z, s){ var q = P(x, y, z); return '<g transform="matrix(.866 -.5 0 1 ' + f(q[0]) + " " + f(q[1]) + ')">' + s + "</g>"; }
  /* a shape cut from its side view (points [x, z], clockwise seen from the front left) and pulled from y = ya to y = yb */
  function slabY(pts, ya, yb, c){
    var n = pts.length, quads = [], s = "", i;
    for (i = 0; i < n; i++){
      var a = pts[i], b = pts[(i + 1) % n], nx = a[1] - b[1], nz = b[0] - a[0];
      if (nx + nz > .001) quads.push({ k: a[0] + b[0] + a[1] + b[1], d: D([[a[0], ya, a[1]], [b[0], ya, b[1]], [b[0], yb, b[1]], [a[0], yb, a[1]]]), top: nz > nx * .5 });
    }
    quads.sort(function(m, q){ return m.k - q.k; });
    quads.forEach(function(q){ s += FO(q.d, q.top ? c.top : c.right, 1.1); });
    return s + FO(D(pts.map(function(q){ return [q[0], yb, q[1]]; })), c.left, 1.6);
  }
  /* a thin steel rod through 3D points */
  function rod(pts, w, col){ var d = D(pts, true); return L(d, w + 1.4) + L(d, w, col || "#EEF2F6"); }
  /* a plate-glass window with upright bars; extra(night) draws what shows through it */
  function glass(face, plane, u0, u1, v0, v1, night, n, extra){
    var on = face === "y" ? onY : onX, d = D(on(plane, rectUV(u0, u1, v0, v1))), bars = "", i;
    for (i = 1; i < n; i++){ var uu = u0 + (u1 - u0) * i / n; bars += D(on(plane, [[uu, v0], [uu, v1]]), true); }
    var body = function(fill, nt){ return FO(d, fill, 1.6) + (extra ? extra(nt) : "") + (bars ? L(bars, 1.1) : "") + O(d, 1.6); };
    var c = P.apply(null, face === "y" ? [(u0 + u1) / 2, plane, (v0 + v1) / 2] : [plane, (u0 + u1) / 2, (v0 + v1) / 2]);
    var s = body(night ? K.lit : face === "y" ? K.glassDay : K.glass, night);
    if (!night) s += T.HI(D(on(plane, [[u0 + .18, v1 - .25], [u0 + .5, v1 - .7]]), true), 1.4);
    return { s: s, lights: night ? T.glowAt(c[0], c[1], 6 + (u1 - u0) * 3) + body(K.lit, true) : "" };
  }
  /* mix two #rrggbb colors */
  function mix(h, to, t){
    var a = parseInt(h.slice(1), 16), b = parseInt(to.slice(1), 16), out = "#", i;
    for (i = 16; i >= 0; i -= 8){ var x = a >> i & 255, y = b >> i & 255; out += ("0" + Math.round(x + (y - x) * t).toString(16)).slice(-2); }
    return out;
  }
  /* a four-point sparkle */
  function spark(x, y, r, fill, sw){
    var d = "M" + f(x) + " " + f(y - r) + " Q" + f(x + r * .2) + " " + f(y - r * .2) + " " + f(x + r) + " " + f(y) + " Q" + f(x + r * .2) + " " + f(y + r * .2) + " " + f(x) + " " + f(y + r) +
      " Q" + f(x - r * .2) + " " + f(y + r * .2) + " " + f(x - r) + " " + f(y) + " Q" + f(x - r * .2) + " " + f(y - r * .2) + " " + f(x) + " " + f(y - r) + " Z";
    return sw ? FO(d, fill, sw) : F(d, fill);
  }

  /* ------------------------------------------------------------------ the home: a dental office --------------------- */
  var homes = {
    "dental-office": {
      note: "A neat white clinic: plate-glass windows, a striped awning and a tooth for a sign over the door",
      ups: ["flag", "paint"], upn: { flag: "A Timmy flag on the roof", paint: "Wall paint" },
      door: [5.5, 8.6], brush: [7.55, 9.15], statue: [3.2, 9.5], spots: { door: [5.5, 10.6] }, h: 8.4,
      eaves: [[2.42, 8.78, 3.7], [8.58, 8.78, 3.7]], foot: [2.6, 3.0, 8.4, 8.6], base: [[2.6, 8.6], [8.4, 8.6], [8.4, 3.0]], block: [2.4, 2.7, 8.8, 9.0],
      draw: function(o){
        var u = o.up, wp = o.paint && o.paint !== "cream" ? T.PAINTS[o.paint] : { c: "#FDFEFF", s: "#DCE4EC" }, s = "", lights = "", w, i;
        var x0 = 2.6, x1 = 8.4, y0 = 3.0, y1 = 8.6, z1 = 3.7, zs = z1 + .25;
        var slab = o.snow ? { top: "#FFFFFF", left: "#F4F8FB", right: "#D6E2EC" } : { top: "#E4EAF0", left: "#EEF2F6", right: "#C3CED9" };
        /* the ground floor: white walls, a gray kick band, a teal fascia with a pinstripe */
        s += box(x0, y0, 0, x1 - x0, y1 - y0, z1, { top: slab.top, left: wp.c, right: wp.s });
        s += F(D(onY(y1, rectUV(x0, x1, 0, .3))), "#C9D3DC") + F(D(onX(x1, rectUV(y0, y1, 0, .3))), "#AEBAC6");
        s += FO(D(onY(y1, rectUV(x0, x1, 3.2, z1))), TEAL[0], 1.2) + FO(D(onX(x1, rectUV(y0, y1, 3.2, z1))), TEAL[1], 1.2);
        s += L(D(onY(y1, [[x0 + .12, 3.45], [x1 - .12, 3.45]]), true), 1, "#FFFFFF", .95) + L(D(onX(x1, [[y0 + .12, 3.45], [y1 - .12, 3.45]]), true), 1, "#FFFFFF", .7);
        s += O(D(onY(y1, rectUV(x0, x1, 0, z1)))) + O(D(onX(x1, rectUV(y0, y1, 0, z1))));
        /* the side wall: one long plate-glass window, a tooth on its middle pane */
        var inside = function(nt){ return shX(x1, 5.8, 1.0, FO(molarD(.4), nt ? "#FFFDF6" : "#FFFFFF", 1)); };
        w = glass("x", x1, 3.7, 7.9, .8, 2.25, o.night, 3, inside); s += w.s; lights += w.lights;
        /* the front wall: a window each side of the glass doors */
        [[2.95, 4.5], [6.5, 8.05]].forEach(function(q){ w = glass("y", y1, q[0], q[1], .8, 2.25, o.night, 2); s += w.s; lights += w.lights; });
        var leaves = function(fill){ return FO(D(onY(y1, rectUV(4.93, 5.46, .14, 2.12))), fill, 1.1) + FO(D(onY(y1, rectUV(5.54, 6.07, .14, 2.12))), fill, 1.1) + L(D(onY(y1, [[5.36, .9], [5.36, 1.35]]), true) + D(onY(y1, [[5.64, .9], [5.64, 1.35]]), true), 1.5); };
        s += FO(D(onY(y1, rectUV(4.8, 6.2, 0, 2.25))), TEAL[2], 1.6) + leaves(o.night ? K.lit : K.glassDay);
        if (o.night){ var dc = P(5.5, y1, 1.2); lights += T.glowAt(dc[0], dc[1], 9) + leaves(K.lit); }
        var mat = [[4.95, y1 + .12, 0], [6.05, y1 + .12, 0], [6.05, y1 + .62, 0], [4.95, y1 + .62, 0]]; s += FO(D(mat), TEAL[0], 1) ;
        /* the awning along the front: teal and white stripes, a valance, its end */
        var ax0 = 2.85, ax1 = 8.15, ad = .5, za = 3.15, zb = 2.9, zv = 2.72, n = 13, aw = (ax1 - ax0) / n;
        for (i = 0; i < n; i++){
          var a = ax0 + i * aw, b = a + aw;
          s += F(D([[a, y1, za], [b, y1, za], [b, y1 + ad, zb], [a, y1 + ad, zb]]), i % 2 ? "#FFFFFF" : TEAL[0]) + F(D([[a, y1 + ad, zb], [b, y1 + ad, zb], [b, y1 + ad, zv], [a, y1 + ad, zv]]), i % 2 ? "#E4EAF0" : TEAL[1]);
        }
        s += FO(D([[ax1, y1, za], [ax1, y1 + ad, zb], [ax1, y1 + ad, zv], [ax1, y1, zv + .1]]), TEAL[2], 1.2);
        s += O(D([[ax0, y1, za], [ax1, y1, za], [ax1, y1 + ad, zb], [ax0, y1 + ad, zb]]), 1.4) + O(D([[ax0, y1 + ad, zb], [ax1, y1 + ad, zb], [ax1, y1 + ad, zv], [ax0, y1 + ad, zv]]), 1.2);
        /* the roof slab, then the upper floor set back on it, its ribbon windows and its own slab */
        s += box(x0 - .18, y0 - .18, z1, x1 - x0 + .36, y1 - y0 + .36, .25, slab, { sw: 1.6, si: 1 });
        var ux = 4.1, uy = 6.3, zu = 6.0;
        s += box(ux, y0, zs, x1 - ux, uy - y0, zu - zs, { top: slab.top, left: wp.c, right: wp.s });
        s += FO(D(onY(uy, rectUV(ux, x1, zu - .38, zu))), TEAL[0], 1.2) + FO(D(onX(x1, rectUV(y0, uy, zu - .38, zu))), TEAL[1], 1.2);
        w = glass("y", uy, 5.25, 7.95, 4.55, 5.35, o.night, 4); s += w.s; lights += w.lights;
        w = glass("x", x1, 3.5, 5.8, 4.55, 5.35, o.night, 3); s += w.s; lights += w.lights;
        s += box(ux - .16, y0 - .16, zu, x1 - ux + .32, uy - y0 + .32, .22, slab, { sw: 1.6, si: 1 });
        /* on the top roof: the air unit, and the flag if there is one */
        s += box(5.0, 3.6, zu + .22, 1.0, .9, .45, STEEL, { sw: 1.3, si: .9 }) + L(D(onY(4.5, [[5.15, zu + .36], [5.85, zu + .36]]), true) + D(onY(4.5, [[5.15, zu + .52], [5.85, zu + .52]]), true), .8, INK, .5);
        if (u.flag) s += T.flagOn(7.9, 3.4, zu + .22, 2.1);
        /* on the terrace: a planter of clipped shrubs */
        s += box(6.55, 7.35, zs, 1.6, .55, .34, { top: K.soilShade, left: "#FFFDF6", right: "#D6DDE4" }, { sw: 1.3, si: .9 });
        [6.85, 7.35, 7.85].forEach(function(xx, k){ var c = P(xx, 7.62, zs + .62); s += T.canopy(c[0], c[1], 4.6, o.snow ? ["#F7FBFF", "#DCEAF6"] : o.night ? ["#3F7550", "#336244"] : ["#7CC46A", "#4F9A52"], 70 + k); });
        /* the sign over the door: a tooth-shaped board on two posts at the roof's edge. It lights up at night */
        s += rod([[5.12, y1, zs], [5.12, y1, zs + .42]], 1.3, K.stone) + rod([[5.88, y1, zs], [5.88, y1, zs + .42]], 1.3, K.stone);
        var sign = function(fill){ return shY(5.5, y1, zs + .2, F(molarD(.7, 0, -4.4), fill)); };
        s += shY(5.5, y1, zs + .2, FO(molarD(.98), TEAL[0], 1.8)) + sign(o.night ? K.litHot : "#FFFFFF");
        if (o.night){ var sc = P(5.5, y1, zs + 1.7); lights += T.glowAt(sc[0], sc[1], 17) + sign(K.litHot); }
        if (o.snow){ var sn = P(5.5, y1, zs + 3.0); s += ell(sn[0] - 4.6, sn[1] + 2.2, 3.6, 1.5, "#FFFFFF", 0) + ell(sn[0] + 4.4, sn[1] + 4.6, 3.6, 1.5, "#FFFFFF", 0); }
        return { body: s, lights: lights };
      }
    }
  };

  /* ------------------------------------------------------------------ the scene: Main Street ------------------------ */
  var BASE = 128;
  /* one shopfront, seen square on: wall, roofline (0 a cornice, 1 a gable, 2 a stepped top), upstairs windows, a shop
     window and a door under a striped awning */
  function shop(x, w, h, col, aw, kind, o){
    var t = BASE - h, n = o.night, wall = n ? mix(col, "#232A54", .58) : o.snow ? mix(col, "#FFFFFF", .22) : col, s = "", r, c;
    var trim = n ? "#7C80A6" : "#FFFDF6", roof = n ? "#4A4468" : o.snow ? "#FFFFFF" : mix(col, "#3B2E3A", .45);
    s += FO("M" + x + " " + BASE + " V" + t + " H" + (x + w) + " V" + BASE + " Z", wall, 1.4);
    if (kind === 1) s += FO("M" + (x - 1.5) + " " + t + " L" + f(x + w / 2) + " " + (t - 9) + " L" + (x + w + 1.5) + " " + t + " Z", roof, 1.4) + circ(x + w / 2, t - 3.4, 1.4, trim, .7);
    else if (kind === 2) s += FO("M" + (x - 1) + " " + (t + 1) + " v-3.4 h" + f(w * .28) + " v-4 h" + f(w * .44 + 2) + " v4 h" + f(w * .28) + " v3.4 z", o.snow ? "#FFFFFF" : wall, 1.4);
    else s += FO("M" + (x - 1.5) + " " + (t + 1) + " v-4 h" + (w + 3) + " v4 z", o.snow ? "#FFFFFF" : trim, 1.3);
    var rows = Math.max(1, Math.floor((h - 24) / 13));
    for (r = 0; r < rows; r++) for (c = 0; c < 2; c++){
      var on = (r * 2 + c + Math.round(x / 7)) % 3 !== 0;
      s += FO("M" + f(x + w * (.17 + c * .42)) + " " + f(t + 6 + r * 13) + " h" + f(w * .24) + " v8 h-" + f(w * .24) + " z", n ? (on ? K.lit : "#39406B") : "#CFEFFC", 1);
    }
    s += FO("M" + f(x + 2.5) + " " + (BASE - 2) + " v-11 h" + f(w * .5) + " v11 z", n ? K.lit : "#CFEFFC", 1.1);
    s += FO("M" + f(x + w * .5 + 5.5) + " " + BASE + " v-12.5 h" + f(w * .5 - 8.5) + " v12.5 z", n ? "#4A4468" : mix(col, "#3B2E3A", .4), 1.1);
    var ay = BASE - 19.5, awc = n ? mix(aw, "#232A54", .5) : aw, ad = "M" + f(x + 1) + " " + ay + " h" + f(w - 2) + " l1.6 5 h-" + f(w + 1.2) + " z";
    s += F(ad, awc);
    for (c = 0; c * 6 + 3 < w - 2; c++) s += F("M" + f(x + 1 + c * 6 + 3) + " " + ay + " h3 l.3 5 h-3.2 z", n ? "#9A9DBE" : "#FFFFFF");
    return s + O(ad, 1.2);
  }
  /* a street lamp in the row: a post, an arm and a globe (lit at night, with its glow) */
  function farLamp(x, o){
    var y = BASE + 2, s = L("M" + x + " " + y + " v-25", 3) + L("M" + x + " " + y + " v-25", 1.4, o.night ? "#6E7396" : "#59647A") + L("M" + (x - 2.4) + " " + y + " h4.8", 2) + L("M" + (x - 2.6) + " " + (y - 24) + " h5.2", 1.6);
    s += circ(x, y - 27.6, 3.3, o.night ? K.litHot : "#FFFDF6", 1.1) + L("M" + (x - 1.6) + " " + (y - 31.4) + " h3.2", 1.4);
    if (o.night) s += circ(x, y - 27.6, 10, K.glow, 0).replace("/>", ' opacity=".32"/>');
    return s;
  }
  var scenes = {
    "main-street": T.hillScene({
      note: "Shopfronts, awnings and street lamps along Main Street, a water tower behind, a clear sky",
      path: "stones", treeKind: "round", lamp: "post", grade: ["#FFF1C4", .04],
      ground: function(o){ return o.snow ? ["#F7FBFF", "#E8F0F8", "#D6E4F1", "#BCD2E6"] : o.night ? ["#5E9E6A", "#528F5E", "#467E52", "#3A6C46"] : ["#B4E29A", "#A2D889", "#8CCB78", "#6DB062"]; },
      sky: function(o){
        if (o.night) return T.bands(["#141E46", "#1B2858", "#24346A", "#2E4178"], 0, 300) + T.moon(322, 28) + T.starField(11, 28, 140);
        return T.bands(["#9FD8F7", "#B3E1F9", "#C7EAFB", "#DBF2FC"], 0, 300) + T.sun(150, 28) + T.cloud(318, 30, .6);
      },
      far: function(o){
        var c = o.snow ? ["#EEF5FB", "#DCEAF6"] : o.night ? ["#3D6B5A", "#335C4C"] : ["#C9E9B6", "#B2DC9C"], s = "", n = o.night;
        s += F("M0 124 Q60 104 130 114 Q200 96 286 110 Q340 98 400 112 V300 H0 Z", c[0]) + L("M0 124 Q60 104 130 114 Q200 96 286 110 Q340 98 400 112", 1.4, INK, .5);
        /* the water tower, standing behind the hill's right shoulder */
        var tx = 284, tk = n ? ["#8E98A3", "#737D8A", "#6A4A58"] : o.snow ? ["#EEF2F6", "#C9D3DC", "#FFFFFF"] : ["#E4EAF0", "#B9C4CF", "#D9735B"];
        s += '<g opacity="' + (n ? ".85" : ".95") + '">' + L("M" + (tx - 8) + " 88 l-3 30 M" + (tx + 8) + " 88 l3 30 M" + tx + " 90 v28 M" + (tx - 9.6) + " 104 h19.2 M" + (tx - 9) + " 98 l18 12 M" + (tx + 9) + " 98 l-18 12", 1.3) +
          FO("M" + (tx - 11) + " 73 h22 v15 q-11 4.4 -22 0 z", tk[0], 1.5) + F("M" + (tx + 4) + " 73 h7 v15 q-3.4 1.4 -7 2 z", tk[1]) + L("M" + (tx - 11) + " 80 h22", 2.2, n ? "#4E8F86" : TEAL[0]) +
          FO("M" + (tx - 12.6) + " 73 L" + tx + " 64.4 L" + (tx + 12.6) + " 73 Z", tk[2], 1.5) + L("M" + tx + " 64.4 v-3.6", 1.3) + "</g>";
        /* the two ends of the street */
        s += '<g opacity="' + (n ? ".9" : ".96") + '">';
        s += shop(22, 27, 43, "#E08A6E", TEAL[0], 0, o) + shop(49, 27, 56, "#F6E7BE", "#E5484D", 2, o) + shop(76, 27, 46, "#9CC3E6", "#F2C94C", 1, o) + shop(103, 24, 58, "#C9B3E6", TEAL[0], 0, o);
        s += shop(298, 27, 50, "#A9DFC6", "#F59A6E", 1, o) + shop(325, 27, 41, "#F4D06F", "#3FA7E0", 0, o) + shop(352, 27, 54, "#F2A9B8", TEAL[0], 2, o);
        s += "</g>";
        /* the sidewalk and the road in front of them, a car parked on it, the lamps, then the land rolling up to the hill */
        s += F("M0 " + BASE + " H400 V" + (BASE + 4) + " H0 Z", n ? "#7C80A6" : o.snow ? "#FFFFFF" : "#EAE4D6") + F("M0 " + (BASE + 4) + " H400 V" + (BASE + 17) + " H0 Z", n ? "#3C4266" : "#9AA3AE") + L("M0 " + BASE + " H400", 1.2, INK, .7) + L("M0 " + (BASE + 4) + " H400", 1, INK, .45);
        for (var i = 0; i < 40; i++) s += F("M" + (i * 10 + 2) + " " + (BASE + 10) + " h5 v1.2 h-5 z", n ? "#8C90B4" : "#FFFFFF", .9);
        var car = function(x, col){ var y = BASE + 12; return FO("M" + x + " " + y + " v-4.4 q0 -1.6 1.6 -1.6 h2.4 l2.4 -3.6 h7 l2.6 3.6 h2.4 q1.6 0 1.6 1.6 v4.4 z", n ? mix(col, "#232A54", .5) : col, 1.2) + F("M" + (x + 5.4) + " " + (y - 6.2) + " l1.6 -2.4 h5.4 l1.8 2.4 z", n ? K.lit : "#CFEFFC") + circ(x + 4.6, y, 2.1, "#3B2E3A", 0) + circ(x + 15.4, y, 2.1, "#3B2E3A", 0) + circ(x + 4.6, y, .8, "#D9DFE5", 0) + circ(x + 15.4, y, .8, "#D9DFE5", 0); };
        s += car(331, "#E5484D") + farLamp(50, o) + farLamp(77, o) + farLamp(326, o) + farLamp(353, o);
        s += F("M0 " + (BASE + 17) + " H400 V300 H0 Z", c[1]) + L("M0 " + (BASE + 17) + " H400", 1, INK, .4);
        return s;
      },
      flat: function(o, on){
        if (o.snow) return "";
        var tc = o.night ? "#3D7449" : "#6DB062";
        return T.scatter(151, 40, on, function(sx, sy){ return T.tuft(sx, sy, tc, .8); }).join("") +
          T.scatter(152, 14, on, function(sx, sy, i){ return circ(sx, sy, 1.9, o.night ? "#9C8FB0" : ["#FFFFFF", "#FFE27A", "#FFFFFF", "#FF8FB1"][i % 4], .7) + circ(sx, sy, .7, o.night ? "#B9A66A" : "#F2C230", 0); }).join("");
      },
      props: function(o, on){
        var n = o.night;
        return T.scatter(153, 8, on, function(sx, sy, i, R, x, y){
          var s, k = i % 4;
          if (k === 0){
            /* a fire hydrant */
            var red = n ? "#8A4A58" : o.snow ? "#E5686C" : "#E5484D";
            s = ell(sx, sy + .4, 6, 1.8, "#000", 0, .12) + FO("M" + f(sx - 5) + " " + f(sy - 6.4) + " h10 v3 h-10 z", red, 1.1) + FO("M" + f(sx - 3) + " " + f(sy) + " v-8.4 q0 -3.4 3 -3.4 q3 0 3 3.4 v8.4 z", red, 1.3) +
              L("M" + f(sx - 4.2) + " " + f(sy) + " h8.4 M" + f(sx - 3.6) + " " + f(sy - 8.6) + " h7.2", 1.6) + circ(sx, sy - 4.8, 1.3, n ? "#B9A66A" : "#F2C94C", .7) + L("M" + f(sx) + " " + f(sy - 11.8) + " v-1.6", 1.6);
            if (o.snow) s += ell(sx, sy - 11.6, 3, 1.3, "#FFFFFF", 0);
          } else if (k === 2){
            /* a park bench */
            var wd = n ? ["#8A7A66", "#6E6052"] : [K.woodLight, K.wood];
            s = ell(sx, sy + .6, 11, 2, "#000", 0, .1) + L("M" + f(sx - 7.4) + " " + f(sy) + " v-11 M" + f(sx + 7.4) + " " + f(sy) + " v-11 M" + f(sx - 7.4) + " " + f(sy - 4.6) + " l-2.2 4.6 M" + f(sx + 7.4) + " " + f(sy - 4.6) + " l2.2 4.6", 1.5) +
              FO("M" + f(sx - 9.6) + " " + f(sy - 6.4) + " h19.2 v2.4 h-19.2 z", wd[0], 1.1) + FO("M" + f(sx - 9) + " " + f(sy - 12.4) + " h18 v2.2 h-18 z", wd[1], 1.1) + FO("M" + f(sx - 9) + " " + f(sy - 9.4) + " h18 v2 h-18 z", wd[1], 1.1);
            if (o.snow) s += F("M" + f(sx - 9.4) + " " + f(sy - 7.4) + " h18.8 v1.4 h-18.8 z", "#FFFFFF");
          } else {
            /* a clipped shrub, or two */
            var g = o.snow ? ["#F7FBFF", "#DCEAF6"] : n ? ["#3F7550", "#336244"] : ["#7CC46A", "#4F9A52"];
            s = ell(sx, sy + .6, 9, 2.2, "#000", 0, .1) + T.canopy(sx, sy - 6, 7 + R() * 2, g, 80 + i) + (k === 3 ? T.canopy(sx + 9, sy - 3.4, 4.6, g, 90 + i) : "");
          }
          return { x: x, y: y, s: s };
        });
      }
    })
  };

  /* ------------------------------------------------------------------ the yard -------------------------------------- */
  var yard = {
    "dental-chair": {
      note: "A reclining dental chair on its pedestal, with the dentist's stool beside it", spot: [3.3, 3.45],
      egg: { n: "The dental chair", does: "a teddy bear hops up for a checkup", say: "Lean back! The first reclining dental chair dates to 1832." }, anim: "tp-peek 2.4s",
      draw: function(o){
        var s = ell.apply(null, P(1.9, 2.0, 0).concat([31, 11, "#1B2A3A", 0, .1])), ya = 1.2, yb = 2.3;
        /* the pedestal: a round foot and a square column */
        s += cyl(1.95, 1.75, 0, .9, .16, .84, K.stone, K.stoneShade, "#EEF2F6") + box(1.62, 1.42, .16, .66, .66, 1.0, STEEL, { sw: 1.4, si: .9 });
        /* the headrest on its stalk, then the cushion in one piece: backrest, seat, leg rest and the turned-up toe */
        s += rod([[.46, 1.75, 2.34], [.3, 1.75, 2.56]], 1.6, K.stone);
        s += slabY([[.04, 2.52], [.26, 2.86], [.56, 2.68], [.36, 2.36]], 1.42, 2.08, UPH);
        s += slabY([[.3, 2.2], [.52, 2.42], [1.65, 1.5], [2.4, 1.42], [3.2, 1.12], [3.42, 1.3], [3.58, 1.16], [3.3, .84], [2.46, 1.12], [1.52, 1.16]], ya, yb, UPH);
        s += L(D([[1.65, yb, 1.5], [1.52, yb, 1.16]], true) + D([[2.4, yb, 1.42], [2.46, yb, 1.12]], true), 1, INK, .55);
        s += L(D([[1.65, ya, 1.5], [1.65, yb, 1.5]], true) + D([[2.4, ya, 1.42], [2.4, yb, 1.42]], true), .9, INK, .4);
        /* the near armrest */
        s += rod([[1.9, yb + .04, 1.42], [1.86, yb + .04, 1.92]], 1.5, K.stone) + rod([[1.42, yb + .04, 2.0], [2.3, yb + .04, 1.88]], 2.2, "#EEF2F6");
        if (o.snow) s += ell.apply(null, P(2.0, 1.75, 1.5).concat([6, 2.4, "#FFFFFF", 0]));
        /* the stool */
        s += cyl(.72, 3.05, 0, .38, .07, .36, K.stone, K.stoneShade, "#EEF2F6", { sw: 1.3 }) + rod([[.72, 3.05, .07], [.72, 3.05, .78]], 1.6, K.stone) + cyl(.72, 3.05, .74, .42, .94, .42, UPH.left, UPH.right, UPH.top, { sw: 1.4 });
        return s;
      },
      bits: function(){
        var m = P(1.98, 1.75, 1.52), x = m[0], y = m[1], br = "#C68B59";
        return circ(x - 3.6, y - 8.4, 2, br, .9) + circ(x + 3.6, y - 8.4, 2, br, .9) + ell(x, y - 1, 4.6, 3.6, br, 1) + circ(x, y - 5.4, 4.4, br, 1.1) + ell(x, y - 4.2, 2.2, 1.6, "#F1D2AE", 0) +
          circ(x - 1.6, y - 6.2, .6, INK) + circ(x + 1.6, y - 6.2, .6, INK) + circ(x, y - 4.6, .6, INK) + FO("M" + f(x - 3) + " " + f(y - 1.6) + " q3 1.6 6 0 l-.6 3.4 q-2.4 1 -4.8 0 z", "#FFFFFF", .8);
      }
    },
    "operatory-light": {
      note: "The overhead light on its jointed arm, and a tray laid with a mouth mirror, an explorer and cotton pliers", spot: [3.5, 3.55],
      egg: { n: "The operatory light", does: "the light switches on", say: "Mirror to see, explorer to feel. Every groove gets checked." }, anim: "tp-pop 2.2s",
      head: function(lit){
        /* the lamp head, tipped toward us: housing, lens, a handle each side */
        var c = P(2.55, 1.45, 3.3);
        return '<g transform="translate(' + f(c[0]) + " " + f(c[1]) + ') rotate(-16) scale(.82)">' + L("M-15 0 q-4.4 .4 -4.4 4 q0 3 3.4 3 M15 0 q4.4 .4 4.4 4 q0 3 -3.4 3", 1.6) +
          FO("M-14 -5 q0 -3 3 -3 h22 q3 0 3 3 v6 q0 5 -5 5 h-18 q-5 0 -5 -5 z", "#E9EEF3", 1.9) + FO("M-10.6 -3.4 h21.2 v4.6 q0 3 -3 3 h-15.2 q-3 0 -3 -3 z", lit ? K.litHot : "#FFF3C4", 1.3) +
          L("M-3.6 -3.4 v7.6 M3.6 -3.4 v7.6", .9, INK, .4) + "</g>";
      },
      beam: function(op){
        var c = P(2.55, 1.45, 3.3), a = P(1.3, 3.05, 1.4), b = P(3.2, 2.0, 1.4);
        return F("M" + f(c[0] - 8) + " " + f(c[1] + 5) + " L" + f(a[0]) + " " + f(a[1]) + " L" + f(b[0]) + " " + f(b[1]) + " L" + f(c[0] + 8.6) + " " + f(c[1] + 1) + " Z", K.glow, op);
      },
      draw: function(o){
        var s = ell.apply(null, P(1.9, 2.0, 0).concat([31, 11, "#1B2A3A", 0, .1])), zt = 1.4, px = .8, py = 1.0;
        /* the stand: a weighted foot and the pole */
        s += cyl(px, py, 0, .6, .16, .54, K.stone, K.stoneShade, "#EEF2F6") + cyl(px, py, .16, .14, 3.62, .12, K.stone, K.stoneShade, "#EEF2F6", { sw: 1.5 });
        /* the bracket tray on its arm: steel, a blue liner, and the instruments laid out */
        s += rod([[px, py, 1.3], [1.5, 1.55, 1.3], [1.9, 2.1, 1.3]], 2.2, K.stone);
        s += box(1.2, 1.9, 1.26, 2.1, 1.25, .12, STEEL, { sw: 1.5, si: 1 }) + FO(D([[1.3, 2.0, 1.385], [3.2, 2.0, 1.385], [3.2, 3.05, 1.385], [1.3, 3.05, 1.385]]), o.night ? "#9CC3DA" : "#BFE3F5", .8);
        /* the mouth mirror: a thin handle, the neck bent, a small round mirror */
        s += rod([[1.45, 2.22, zt], [2.68, 2.22, zt], [2.86, 2.15, zt + .05]], 1.2);
        var mh = P(3.0, 2.12, zt + .06); s += ell(mh[0], mh[1], 4.2, 2.8, "#D9DFE5", 1.1) + ell(mh[0], mh[1], 2.8, 1.8, "#CFEFFC", 0) + L("M" + f(mh[0] - 1.6) + " " + f(mh[1] - .2) + " l1.6 -1", .8, "#FFFFFF");
        /* the explorer: its thin tip curls back into a hook */
        s += rod([[1.45, 2.54, zt], [2.5, 2.54, zt]], 1.2) + L(D([[2.5, 2.54, zt], [2.98, 2.54, zt], [3.12, 2.6, zt], [3.12, 2.74, zt], [3.0, 2.82, zt]], true), 1);
        /* the cotton pliers: two long arms joined at one end, the tips bent */
        s += L(D([[1.45, 2.86, zt], [2.86, 2.78, zt], [3.08, 2.85, zt]], true) + D([[1.45, 2.86, zt], [2.86, 2.95, zt], [3.08, 2.9, zt]], true), 2.4) +
          L(D([[1.45, 2.86, zt], [2.86, 2.78, zt]], true) + D([[1.45, 2.86, zt], [2.86, 2.95, zt]], true), 1, "#EEF2F6");
        /* the light's arm: up from the pole, an elbow, down to the head */
        var e = [1.9, 1.05, 3.95], h = [2.5, 1.4, 3.62];
        s += rod([[px, py, 3.6], e], 2.4, K.stone) + rod([e, h], 2.4, K.stone);
        [P(px, py, 3.6), P.apply(null, e)].forEach(function(q){ s += circ(q[0], q[1], 2.5, "#EEF2F6", 1.2); });
        var hp = P.apply(null, h); s += L("M" + f(hp[0]) + " " + f(hp[1]) + " v3", 2.6);
        s += yard["operatory-light"].head(o.night);
        return s;
      },
      lights: function(){ var me = yard["operatory-light"], c = P(2.55, 1.45, 3.3); return me.beam(.2) + T.glowAt(c[0], c[1] + 2, 12) + me.head(true); },
      bits: function(){ var me = yard["operatory-light"], a = P(2.25, 2.5, 1.4); return me.beam(.42) + me.head(true) + spark(a[0] - 9, a[1] - 2, 3.4, "#FFFFFF") + spark(a[0] + 10, a[1] + 1, 2.6, "#FFFFFF"); }
    },
    "molar-monument": {
      note: "A big polished molar on a marble plinth, a gold plaque on its front and a lamp at each corner", spot: [3.4, 3.45],
      egg: { n: "The molar monument", does: "it gleams all over", say: "Enamel: the hardest thing in your whole body. Keep it shining!" }, anim: "tp-sparks 2s ease-out",
      draw: function(o){
        var s = ell.apply(null, P(1.85, 1.95, 0).concat([32, 12, "#1B2A3A", 0, .1])), mar = { top: "#F7F9FB", left: "#E9EEF3", right: "#BFC8D2" }, st = { top: "#E4EAF0", left: K.stone, right: K.stoneShade };
        /* the plinth: a step, the block with its plaque, a cap */
        s += box(.5, .5, 0, 2.6, 2.6, .32, st) + box(.82, .82, .32, 1.96, 1.96, .8, mar) + box(.72, .72, 1.12, 2.16, 2.16, .14, st, { sw: 1.6, si: 1 });
        s += FO(D(onY(2.78, rectUV(1.3, 2.3, .52, .94))), K.gold, 1.1) + T.star5.apply(null, P(1.8, 2.78, .73).concat([2.4, "#FFF0B3"])).replace('stroke-width="1.2"', 'stroke-width=".7"') +
          L(D(onX(2.78, [[1.2, .62], [2.4, .62]]), true) + D(onX(2.78, [[1.2, .84], [2.4, .84]]), true), .8, INK, .3);
        /* a lamp at each front corner of the step */
        [[.78, 2.82], [2.82, 2.82], [2.82, .78]].forEach(function(q){ s += cyl(q[0], q[1], .32, .13, .5, .16, "#59647A", "#3F4A5E", o.night ? K.litHot : "#FFF3C4", { sw: 1.1, si: .8 }); });
        /* the molar: a gold collar round its roots, the crown's two cusps, a long shine down its lit side */
        var b = P(1.8, 1.8, 1.26), k = 1.12, x = b[0], y = b[1] + 1.5, q = function(a, c){ return f(x + a * k) + " " + f(y + c * k); };
        s += ell(b[0], b[1], T.RX(.74), T.RY(.74), K.gold, 1.3) + ell(b[0], b[1] - .8, T.RX(.56), T.RY(.56), K.goldShade, 0);
        s += FO(molarD(k, x, y), "#FFFDF6", 2);
        s += F("M" + q(6, -28.7) + " C" + q(9.5, -29.6) + " " + q(12.6, -25) + " " + q(11.6, -16) + " C" + q(11.2, -11) + " " + q(9.8, -8) + " " + q(9.3, -2.4) + " C" + q(9.1, -.4) + " " + q(7.4, .2) + " " + q(6.6, -.8) +
          " C" + q(7.4, -7) + " " + q(8.6, -11) + " " + q(8.8, -16.5) + " C" + q(9.2, -22) + " " + q(8.2, -26.6) + " " + q(6, -28.7) + " Z", "#E6DCC8") +
          F("M" + q(-9, -3) + " C" + q(-8.6, -.4) + " " + q(-6.6, -.2) + " " + q(-6, -2.4) + " L" + q(-5, -8) + " C" + q(-6.6, -7) + " " + q(-8.4, -6) + " " + q(-9, -3) + " Z", "#E6DCC8", .7);
        s += L("M" + q(0, -27) + " q" + f(-.6 * k) + " " + f(2.4 * k) + " 0 " + f(4.4 * k), 1.1, "#C9B998") + O(molarD(k, x, y), 2);
        s += T.HI("M" + q(-9.4, -17) + " C" + q(-10, -23) + " " + q(-8, -26.6) + " " + q(-5, -26.8), 2.4) + circ(x - 9.6 * k, y - 12.6 * k, 1.3, "#FFFFFF", 0) + T.HI("M" + q(-7.6, -9) + " L" + q(-7.2, -4), 1.6);
        s += G("tp-twinkle", spark(x + 15 * k, y - 29 * k, 4, "#FFFFFF", .8)) + G("tp-twinkle", spark(x - 16 * k, y - 20 * k, 2.8, "#FFF0B3", .7));
        if (o.snow) s += ell(x - 5.6 * k, y - 29.4 * k, 4.4, 1.6, "#FFFFFF", 0) + ell(x + 5.6 * k, y - 29.4 * k, 4.4, 1.6, "#FFFFFF", 0);
        return s;
      },
      lights: function(){
        var b = P(1.8, 1.8, 1.26), s = T.glowAt(b[0], b[1] - 17, 24);
        [[.78, 2.82], [2.82, 2.82], [2.82, .78]].forEach(function(q){ var c = P(q[0], q[1], .52); s += T.glowAt(c[0], c[1], 5); });
        return s;
      },
      bits: function(){
        var b = P(1.8, 1.8, 1.26), s = "";
        [[-20, -30, 4.4, "#FFFFFF"], [19, -22, 3.6, "#FFF0B3"], [-13, -42, 3, "#FFF0B3"], [12, -44, 4, "#FFFFFF"], [-24, -12, 2.8, "#FFFFFF"], [23, -6, 2.6, "#FFFFFF"], [0, -50, 3, "#FFF0B3"]].forEach(function(q){ s += spark(b[0] + q[0], b[1] + q[1], q[2], q[3], .7); });
        return s;
      }
    }
  };

  /* ------------------------------------------------------------------ the outfits ----------------------------------- */
  var GOLD = "#F2C94C", GOLDS = "#C9971C", SCRUB = "#4DBFB0", SCRUBS = "#2E9488";
  var ln = function(d, col, w){ return '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"/>'; };
  /* what both the scrub top and the coat follow: Timmy's sides from the shoulder down, and the gum's edge along the hem */
  var HEM = "Q149.6 121 146.6 131 Q140 132 135 143 Q120 156 100 157 Q80 156 65 143 Q60 132 53.4 131 Q50.4 121 50.6 110";
  var outfits = {
    "gold-mirror": {
      note: "A golden mouth mirror in his hand: a knurled handle, the neck bent, a round mirror with a tooth in it",
      face: ln("M161 130 L178 70", INK, 9) + ln("M161 130 L178 70", GOLD, 5) + ln("M163.6 119.6 L169.9 97.9", INK, 12.5) + ln("M163.6 119.6 L169.9 97.9", GOLD, 8.5) +
        ln("M162.6 111.6 l6.6 1.9 M164.3 105.8 l6.6 1.9 M166 100 l6.6 1.9", GOLDS, 1.8) + ln("M176.6 74.6 L177.4 71.8", "#FFF0B3", 2) +
        ln("M178 70 Q180 62 175 58", INK, 7) + ln("M178 70 Q180 62 175 58", GOLD, 3.2) +
        '<circle cx="170" cy="43" r="16" fill="' + GOLD + '" ' + O3 + '/><circle cx="170" cy="43" r="11.6" fill="#DFF4FF" stroke="' + GOLDS + '" stroke-width="1.8"/>' +
        T.tinyTooth(171, 44.6, 1.05, "#FFFFFF") + ln("M162.4 40 Q163.6 34.6 168.4 33.4", "#FFFFFF", 2.4) +
        p("M157.4 113 C160 106.6 171 107.6 173.6 113.4 C175.6 119.6 170.6 125 163.6 124.2 C158.4 123.4 155.6 118 157.4 113 Z", "#FBF7EE", O3) + ln("M163 110.6 Q167 109.6 170.4 111.6", "#D9CDB6", 1.6) +
        spark(190, 24, 6, "#FFF0B3", 1.2) + spark(150, 30, 3.6, "#FFFFFF", 1),
      say: ["Mirror, mirror, in my hand: who has the cleanest molars in the land?", "A mouth mirror shows the backs of your teeth. No hiding back there!", "Say ahh. I only want a quick look."]
    },
    "surgical-scrubs": {
      note: "A scrub cap with loupes pushed up on it, a scrub top, and a mask pulled down under his chin",
      face: p("M57 101 C50 99 45 101 41.6 105.4 L46 121.6 C50 119.4 53 118 57 118 Z", SCRUB, O3) + p("M143 101 C150 99 155 101 158.4 105.4 L154 121.6 C150 119.4 147 118 143 118 Z", SCRUB, O3) +
        p("M50.6 110 Q66 107 82 112 L100 131 L118 112 Q134 107 149.4 110 " + HEM + " Z", SCRUB, O3) + ln("M82 113.6 L100 132.6 L118 113.6", SCRUBS, 2.2) +
        ln("M74 122 Q58 117 51.6 101 M126 122 Q142 117 148.4 101", INK, 4.2) + ln("M74 122 Q58 117 51.6 101 M126 122 Q142 117 148.4 101", "#FFFFFF", 1.8) +
        p("M72 118 Q100 128 128 118 L126 137 Q100 151 74 137 Z", "#A9DBF2", O3) + ln("M74.6 125.4 Q100 135.4 125.4 125.4 M75 131.4 Q100 142.6 125 131.4", "#6FB4D6", 1.6) + ln("M74.6 120.6 Q100 130.2 125.4 120.6", "#FFFFFF", 2),
      top: p("M152 50 q13 -8 19 1 q-10 1 -13 7 z", SCRUBS, O2) + p("M153 57 q13 1 14 12 q-8 -4 -14 -4 z", SCRUBS, O2) +
        p("M46 66 C39 34 62 13 100 13 C138 13 161 34 154 66 Q100 50 46 66 Z", SCRUB) + p("M46 66 Q100 50 154 66 L153 57.4 Q100 41.4 47 57.4 Z", SCRUBS, O3) +
        T.tinyTooth(66, 36, 1.05, "#FFFFFF") + T.tinyTooth(100, 26, 1.05, "#FFFFFF") + T.tinyTooth(134, 36, 1.05, "#FFFFFF") +
        ln("M72 50 L49 58 M128 50 L151 58", INK, 4.4) + ln("M91 48 Q100 43 109 48", INK, 4.4) +
        '<circle cx="81" cy="50" r="11" fill="#CFEFFC" ' + O3 + '/><circle cx="119" cy="50" r="11" fill="#CFEFFC" ' + O3 + "/>" +
        '<circle cx="83.6" cy="53" r="6" fill="#59647A" ' + O2 + '/><circle cx="116.4" cy="53" r="6" fill="#59647A" ' + O2 + '/><circle cx="83.6" cy="53" r="2.6" fill="#BFE7FA"/><circle cx="116.4" cy="53" r="2.6" fill="#BFE7FA"/>' +
        ln("M73.6 46 Q75 42.4 78.4 41.4 M111.6 46 Q113 42.4 116.4 41.4", "#FFFFFF", 2),
      say: ["Scrubbed in! Mask ready, loupes up.", "Clean hands, clean teeth, clean notes.", "Loupes make small things big. Studying makes big things small."]
    },
    "dr-timmy": {
      note: "A long white coat over a shirt and tie, a stethoscope, a head mirror, and a pocket with a mouth mirror and an explorer",
      face: p("M57 101 C50 99 43 100 38.6 105 L43.6 123 C48 120 52 118 57 118 Z", "#FFFFFF", O3) + p("M143 101 C150 99 157 100 161.4 105 L156.4 123 C152 120 148 118 143 118 Z", "#FFFFFF", O3) +
        ln("M41.6 108.6 L45.6 121.4 M158.4 108.6 L154.4 121.4", "#C9D3DC", 1.8) +
        /* the shirt and tie in the coat's opening */
        p("M80 112 Q100 122 120 112 L101 143 L99 143 Z", "#8FD3F5", O2) + p("M96 119.4 h8 l-1.8 4.6 l3 11 l-5.2 6 l-5.2 -6 l3 -11 z", "#E5484D", O2) +
        /* the coat: two panels that meet below the tie, their lapels folded back */
        p("M50.6 110 Q64 107 80 112 L99 143 L99 157 Q80 156 65 143 Q60 132 53.4 131 Q50.4 121 50.6 110 Z", "#FFFFFF", O3) +
        p("M149.4 110 Q136 107 120 112 L101 143 L101 157 Q120 156 135 143 Q140 132 146.6 131 Q149.6 121 149.4 110 Z", "#FFFFFF", O3) +
        p("M80 112 L68.6 118 L85 131 L99 143 Z", "#EEF2F6", O2) + p("M120 112 L131.4 118 L115 131 L101 143 Z", "#EEF2F6", O2) +
        '<circle cx="106.4" cy="150" r="2.2" fill="#C9D3DC" stroke="' + INK + '" stroke-width="1.2"/>' +
        /* the stethoscope: the tube down one side to the chest piece, the ear tubes on the other */
        ln("M57.6 109 C55 121 60 131 70 136", INK, 6) + ln("M57.6 109 C55 121 60 131 70 136", "#59647A", 2.8) +
        '<circle cx="74" cy="138.4" r="6.6" fill="#D9DFE5" ' + O2 + '/><circle cx="74" cy="138.4" r="3" fill="#FFFFFF" stroke="#8E98A3" stroke-width="1.2"/>' +
        ln("M142.4 109 C144.6 114 144.4 119 142.6 123", INK, 6) + ln("M142.4 109 C144.6 114 144.4 119 142.6 123", "#59647A", 2.8) +
        /* the pocket's instruments: a mouth mirror (round head on a bent neck) and an explorer (hooked tip) */
        ln("M123.6 136 L123.6 120 Q123.6 117.6 122.4 116.6", INK, 3.6) + ln("M123.6 136 L123.6 120 Q123.6 117.6 122.4 116.6", "#D9DFE5", 1.4) +
        '<circle cx="121.4" cy="113" r="4.6" fill="#CFEFFC" stroke="' + INK + '" stroke-width="1.6"/><path d="M119.2 112.2 q.6 -1.8 2.4 -2" fill="none" stroke="#FFFFFF" stroke-width="1.2"/>' +
        ln("M131.6 136 L131.6 119", INK, 3.6) + ln("M131.6 136 L131.6 119", "#D9DFE5", 1.4) + ln("M131.6 119 L131.6 114 Q131.8 109.6 135.8 109.8 Q138.6 110.4 138 113.4", INK, 1.7) +
        p("M118 127 h18 v9.6 q-9 4.4 -18 0 z", "#FFFFFF", O2) + ln("M118 130.4 h18", "#C9D3DC", 1.4),
      top: p("M47 63 Q100 49 153 63 L153 71 Q100 57 47 71 Z", "#59647A", O3) +
        '<circle cx="100" cy="44" r="17" fill="#D9DFE5" ' + O3 + '/><circle cx="100" cy="44" r="12.4" fill="#F4F8FB" stroke="#A9B3BE" stroke-width="1.6"/><circle cx="100" cy="44" r="3.6" fill="#59647A" ' + O2 + "/>" +
        ln("M90.6 40 Q92 34.6 97.4 33.4", "#FFFFFF", 2.6) + ln("M106 52.4 Q109 51 110.2 47.6", "#C9D3DC", 2) + p("M96 57 h8 v6.4 h-8 z", "#3F4A5E", O2),
      say: ["Dr. Timmy will see you now. Open wide!", "My diagnosis: one more practice round. Doctor's orders.", "Mirror, explorer, and a whole lot of studying."]
    }
  };

  return { k: "dentist", homes: homes, scenes: scenes, yard: yard, outfits: outfits };
}
