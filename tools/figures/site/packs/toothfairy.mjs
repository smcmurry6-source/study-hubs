/* The Tooth Fairy week set of Timmy's place (tools/figures/site/sets.mjs lists its eight pieces; the shop's catalog has
   the same rows). One self-contained function: the build hands it the kit's tools (place.mjs, TOOLS) and pastes its
   source into tools/preview/design/place.js, so it may use nothing from outside itself but T. See packs/thanksgiving.mjs
   for what each kind of piece needs.

   - home:    pillow-palace, two box cushions under two plump tasseled pillows, bolster towers in nightcap roofs.
   - scene:   fairy-glen, night only: a big full moon, giant glowing toadstools behind the hill, fireflies and sparkles.
   - yard:    coin-pile, tooth-pillow, fairy-ring.
   - outfits: fairy-wand, fairy-wings, tooth-fairy.
   Never sugar (Timmy is a tooth). No ids, gradients, filters, text, images or emoji: flat fills and ink outlines. */
export function pack(T){
  var K = T.K, P = T.P, f = T.f, F = T.F, O = T.O, L = T.L, FO = T.FO, G = T.G, circ = T.circ, ell = T.ell, cyl = T.cyl, INK = T.INK;
  var p = T.p, O2 = T.O2, O3 = T.O3;
  var GOLD = ["#F6CF55", "#D9A62A", "#FFE58A", "#B8860B"];
  /* toadstool colors: by day, and glowing by night (cap, spots, cap shade) */
  var DAYC = [["#E5484D", "#FFFFFF", "#B8323A"], ["#F28FB5", "#FFFFFF", "#D96C96"], ["#9B7BE0", "#FFFFFF", "#6E50B8"]];
  var GLO = [["#7FF0D2", "#F1FFFB", "#3FBFA3"], ["#FF9FD6", "#FFEAF6", "#D96BAE"], ["#B79CFF", "#F3EEFF", "#8468D6"]];
  var soft = function(s, op){ return s.replace("/>", ' opacity="' + op + '"/>'); };

  /* curved edges in the yard's space: M(a) starts at a 3D point, Q(a, b, off) curves to b through their middle moved by off */
  function M(a){ var q = P(a[0], a[1], a[2]); return "M" + f(q[0]) + " " + f(q[1]); }
  function Q(a, b, off){ off = off || [0, 0, 0]; var c = P((a[0] + b[0]) / 2 + off[0], (a[1] + b[1]) / 2 + off[1], (a[2] + b[2]) / 2 + off[2]), q = P(b[0], b[1], b[2]); return " Q" + f(c[0]) + " " + f(c[1]) + " " + f(q[0]) + " " + f(q[1]); }
  /* a tassel hanging from a screen point */
  function tassel(q, k){
    k = k || 1; var x = q[0], y = q[1];
    return L("M" + f(x) + " " + f(y) + " v" + f(2.4 * k), 1.1) + FO("M" + f(x - 1.4 * k) + " " + f(y + 2.8 * k) + " L" + f(x - 2.6 * k) + " " + f(y + 8.6 * k) + " L" + f(x + 2.6 * k) + " " + f(y + 8.6 * k) + " L" + f(x + 1.4 * k) + " " + f(y + 2.8 * k) + " Z", GOLD[0], .9) +
      L("M" + f(x - .9 * k) + " " + f(y + 5 * k) + " v" + f(3 * k) + " M" + f(x + .9 * k) + " " + f(y + 5 * k) + " v" + f(3 * k), .6, GOLD[3]) + circ(x, y + 2.2 * k, 1.8 * k, GOLD[2], .9);
  }
  /* a box cushion: a box whose edges bulge, with piping along its top seam. c: { top, left, right } */
  function cushion(x, y, z, w, d, h, c, b){
    b = b == null ? .3 : b;
    var t00 = [x, y, z + h], t10 = [x + w, y, z + h], t11 = [x + w, y + d, z + h], t01 = [x, y + d, z + h], b10 = [x + w, y, z], b11 = [x + w, y + d, z], b01 = [x, y + d, z], up = [0, 0, b * .5], fr = [b * .25, b * .25, 0];
    var top = M(t00) + Q(t00, t10, [0, -b, b * .4]) + Q(t10, t11, up) + Q(t11, t01, up) + Q(t01, t00, [-b, 0, b * .4]) + " Z";
    var left = M(t01) + Q(t01, t11, up) + Q(t11, b11, fr) + Q(b11, b01, [0, b * .5, 0]) + Q(b01, t01, [-b * .8, 0, 0]) + " Z";
    var right = M(t11) + Q(t11, t10, up) + Q(t10, b10, [0, -b * .8, 0]) + Q(b10, b11, [b * .5, 0, 0]) + Q(b11, t11, fr) + " Z";
    var seam = M(t01) + Q(t01, t11, up) + Q(t11, t10, up);
    return F(top, c.top) + F(left, c.left) + F(right, c.right) + T.T(0, 2.2, L(seam, 1.6, GOLD[0])) + O(top, 1.7) + O(left, 1.8) + O(right, 1.8);
  }
  /* a plump pillow lying flat: pinched corners at its seam, a domed top, the under side showing along the front.
     c: { top, bot, shade }; o.tassels: which corners get one ("l", "f", "r") */
  function pillow(x, y, z, w, d, hB, hT, c, o){
    o = o || {};
    var zc = z + hB, c00 = [x, y, zc], c10 = [x + w, y, zc], c11 = [x + w, y + d, zc], c01 = [x, y + d, zc], n = Math.min(w, d) * .05, cc = [x + w * .5, y + d * .5, zc + hT];
    var bot = M(c01) + Q(c01, c11, [0, n * 1.4, -hB * 2]) + Q(c11, c10, [n * 1.4, 0, -hB * 2]) + Q(c10, c11, [-n, 0, 0]) + Q(c11, c01, [0, -n, 0]) + " Z";
    var top = M(c01) + Q(c01, c11, [0, -n, 0]) + Q(c11, c10, [-n, 0, 0]) + Q(c10, c00, [0, 0, hT * 1.5]) + Q(c00, c01, [0, 0, hT * 1.5]) + " Z";
    var shade = M(c11) + Q(c11, c10, [-n, 0, 0]) + Q(c10, cc, [0, 0, hT * .7]) + Q(cc, c11, [0, 0, hT * .35]) + " Z";
    var s = FO(bot, c.bot, 1.7) + F(top, c.top) + F(shade, c.shade, .75) + O(top, 1.8);
    s += L(M(c01) + Q(c01, c11, [0, -n, 0]) + Q(c11, c10, [-n, 0, 0]), 1.2);
    /* creases running in from the corners, and a highlight on the dome */
    [c01, c11, c10, c00].forEach(function(q){ s += L(M(q) + Q(q, [q[0] + (cc[0] - q[0]) * .3, q[1] + (cc[1] - q[1]) * .3, zc + hT * .45], [0, 0, .05]), .9, INK, .35); });
    s += T.HI(M([x + w * .1, y + d * .62, zc + hT * .5]) + Q([x + w * .1, y + d * .62, zc + hT * .5], [x + w * .3, y + d * .2, zc + hT * .6], [0, 0, hT * .35]), 1.8);
    var tk = o.k || 1, ts = o.tassels || "";
    if (ts.indexOf("r") >= 0) s += tassel(P(c10[0], c10[1], zc), tk);
    if (ts.indexOf("l") >= 0) s += tassel(P(c01[0], c01[1], zc), tk);
    if (ts.indexOf("f") >= 0) s += tassel(P(c11[0], c11[1], zc), tk);
    return s;
  }
  /* a stripe round an upright cylinder, between heights za and zb */
  function band(cx, cy, r, za, zb, fill){
    var a = P(cx, cy, za), b = P(cx, cy, zb), rx = T.RX(r), ry = T.RY(r);
    return FO("M" + f(b[0] - rx) + " " + f(b[1]) + " A" + f(rx) + " " + f(ry) + " 0 0 0 " + f(b[0] + rx) + " " + f(b[1]) + " L" + f(a[0] + rx) + " " + f(a[1]) + " A" + f(rx) + " " + f(ry) + " 0 0 1 " + f(a[0] - rx) + " " + f(a[1]) + " Z", fill, .9);
  }
  /* a toadstool in screen space, its foot at (x, y): about 16k wide and 17k tall; glow adds a halo behind it */
  function toad(x, y, k, c, glow, sw){
    var s = "", q = function(a, b){ return f(x + a * k) + " " + f(y + b * k); };
    if (glow) s += soft(circ(x, y - 11 * k, 13 * k, c[0], 0), ".16") + soft(circ(x, y - 11 * k, 8.6 * k, c[0], 0), ".2");
    s += FO("M" + q(-2.4, 0) + " Q" + q(-1.1, -5) + " " + q(-1.7, -9) + " L" + q(1.7, -9) + " Q" + q(1.1, -5) + " " + q(2.4, 0) + " Q" + q(0, 1.3) + " " + q(-2.4, 0) + " Z", glow ? "#F4EEFF" : "#FFF7EC", sw || 1.3);
    var cap = "M" + q(-8, -8.4) + " C" + q(-8, -17.4) + " " + q(8, -17.4) + " " + q(8, -8.4) + " Q" + q(0, -5.8) + " " + q(-8, -8.4) + " Z";
    s += F(cap, c[0]) + F("M" + q(3, -14.7) + " C" + q(6.6, -13.2) + " " + q(8, -10.8) + " " + q(8, -8.4) + " Q" + q(5.2, -7.3) + " " + q(2.4, -6.9) + " Q" + q(5.4, -10.4) + " " + q(3, -14.7) + " Z", c[2], .6) + O(cap, sw || 1.3);
    s += ell(x - 3.6 * k, y - 12 * k, 1.8 * k, 1.3 * k, c[1], 0) + ell(x + 2.4 * k, y - 13.5 * k, 1.4 * k, 1 * k, c[1], 0) + ell(x + 5 * k, y - 10 * k, 1.1 * k, .8 * k, c[1], 0) + ell(x - .4 * k, y - 9.6 * k, 1.1 * k, .75 * k, c[1], 0) + ell(x - 6 * k, y - 9.4 * k, .9 * k, .7 * k, c[1], 0);
    return s;
  }
  /* a chubby five-point star in an outfit's box */
  function starP(x, y, r, fill, st){ var d = ""; for (var i = 0; i < 10; i++){ var a = Math.PI / 5 * i - Math.PI / 2, q = i % 2 ? r * .52 : r; d += (i ? " L" : "M") + f(x + q * Math.cos(a)) + " " + f(y + q * Math.sin(a)); } return '<path d="' + d + ' Z" fill="' + fill + '" ' + (st || O3) + "/>"; }

  /* ------------------------------------------------------------------ the home: a pillow palace -------------------- */
  var homes = {
    "pillow-palace": {
      note: "Two cushions under two plump tasseled pillows, with bolster towers in nightcap roofs",
      ups: ["flag", "paint"], upn: { flag: "A Timmy flag on the top tower", paint: "The big cushion's color" },
      door: [5.5, 8.6], brush: [7.45, 9.2], statue: [3.35, 9.9], spots: { door: [6.65, 10.6] }, h: 9.2,
      eaves: [[2.6, 8.8, 2.75], [8.4, 8.8, 2.75]], foot: [2.6, 3.0, 8.4, 8.6], base: [[2.6, 8.6], [8.4, 8.6], [8.4, 3.0]], block: [2.3, 2.6, 8.9, 9.1],
      draw: function(o){
        var u = o.up || {}, bp = o.paint && o.paint !== "cream" && T.PAINTS[o.paint] ? T.PAINTS[o.paint] : { c: "#FBD3E0", s: "#EDA9C2" }, s = "", lights = "";
        var x0 = 2.6, x1 = 8.4, y0 = 3.0, y1 = 8.6, zb = 2.5;
        var roofA = o.snow ? { top: "#F7FBFF", bot: "#C9D8E8", shade: "#DCEAF6" } : { top: "#C9CFFA", bot: "#9AA4E6", shade: "#AEB6F0" };
        var roofB = o.snow ? { top: "#F7FBFF", bot: "#C9D8E8", shade: "#DCEAF6" } : { top: "#FBC4D8", bot: "#EE9DBB", shade: "#F3AFC8" };
        var cap = ["#B9A6EE", "#9683D6"], wn = { night: o.night, arch: true }, w;
        /* a bolster standing on end, striped, under a nightcap with a pompom; a slit window that is lit at night */
        var tower = function(cx, cy, z0, r, z1, zt, wall, stripes){
          var t = cyl(cx, cy, z0, r, z1, r, wall[0], wall[1], wall[0], { sw: 1.7 });
          stripes.forEach(function(q){ t += band(cx, cy, r, q[0], q[0] + .3, q[1]); });
          var wq = P(cx, cy, z0 + (z1 - z0) * .62), wx = wq[0] - T.RX(r) * .28, wy = wq[1] + T.RY(r) * .9;
          t += FO("M" + f(wx - 2) + " " + f(wy + 3.6) + " v-5 a2 2 0 0 1 4 0 v5 z", o.night ? K.lit : "#6F63A6", 1);
          if (o.night) lights += T.glowAt(wx, wy, 6) + FO("M" + f(wx - 2) + " " + f(wy + 3.6) + " v-5 a2 2 0 0 1 4 0 v5 z", K.lit, 1);
          t += T.cone(cx, cy, z1 - .04, r * 1.3, zt, cap[0], cap[1]);
          if (o.snow) t += T.cone(cx, cy, z1 + (zt - z1) * .5, r * .65, zt, "#FFFFFF", "#DCEAF6", { sw: 1.2 });
          var tp = P(cx, cy, zt); return t + circ(tp[0], tp[1] - 1.6, 2.8, "#FFFFFF", 1.1);
        };
        /* the big cushion: the door and its windows */
        s += cushion(x0, y0, 0, x1 - x0, y1 - y0, zb, { top: bp.c, left: bp.c, right: bp.s });
        [[6.8, 7.65]].forEach(function(q){ w = T.win("y", y1, q[0], q[1], .95, 1.95, wn); s += w.s; lights += w.lights; });
        [[4.55, 5.4], [6.35, 7.2]].forEach(function(q){ w = T.win("x", x1, q[0], q[1], .95, 1.95, wn); s += w.s; lights += w.lights; });
        s += T.doorArch("y", y1, 4.85, 6.15, 2.1, { color: "#9AA4E6" });
        /* tufting buttons either side of the door */
        [[4.35, 1.3], [6.45, 1.3]].forEach(function(q){ var bq = P(q[0], y1, q[1]); s += circ(bq[0], bq[1], 1.3, GOLD[0], .8); });
        s += tassel(P(x1, y1, zb - .1), .9);
        /* the first pillow, the corner towers, then the upper cushion in its hollow */
        s += pillow(2.5, 2.9, zb, 6.0, 5.8, .3, .8, roofA, { tassels: "f" });
        s += tower(8.05, 3.35, 0, .62, 4.0, 5.5, ["#FFF7EC", "#E9DACB"], [[1.0, "#F9B8CE"], [2.5, "#BFE3FA"]]);
        s += tower(2.95, 8.25, 0, .62, 4.0, 5.5, ["#FFF7EC", "#E9DACB"], [[1.0, "#F9B8CE"], [2.5, "#BFE3FA"]]);
        s += cushion(3.7, 4.1, 3.15, 3.6, 3.6, 1.65, { top: "#FFFDF6", left: "#FFFDF6", right: "#E6DCEB" }, .26);
        w = T.win("y", 7.7, 5.05, 5.95, 3.55, 4.45, wn); s += w.s; lights += w.lights;
        w = T.win("x", 7.3, 5.45, 6.35, 3.55, 4.45, wn); s += w.s; lights += w.lights;
        s += pillow(3.45, 3.85, 4.8, 4.1, 4.1, .28, .7, roofB, { tassels: "lfr", k: .85 });
        /* the top tower: a butter bolster, a nightcap, and a star (or the flag) on its tip */
        s += tower(5.5, 5.9, 5.45, .78, 6.9, 8.5, ["#FFF0B3", "#E8CF73"], [[5.75, "#C3E9D6"]]);
        var tip = P(5.5, 5.9, 8.5);
        if (u.flag) s += T.flagOn(5.5, 5.9, 8.45, 1.7);
        else { s += L("M" + f(tip[0]) + " " + f(tip[1] - 3) + " v-5", 1.4) + T.star5(tip[0], tip[1] - 11, 5.4, GOLD[0]); if (o.night) lights += T.glowAt(tip[0], tip[1] - 11, 8) + T.star5(tip[0], tip[1] - 11, 5.4, "#FFF3C4"); }
        /* a little cushion and a baby tooth by the door */
        var cu = P(6.75, y1 + .42, 0);
        s += FO("M" + f(cu[0] - 6) + " " + f(cu[1] - 4.4) + " Q" + f(cu[0]) + " " + f(cu[1] - 6.4) + " " + f(cu[0] + 6) + " " + f(cu[1] - 4.4) + " Q" + f(cu[0] + 4.8) + " " + f(cu[1] - 1.6) + " " + f(cu[0] + 6) + " " + f(cu[1] + 1.4) + " Q" + f(cu[0]) + " " + f(cu[1] + 3.2) + " " + f(cu[0] - 6) + " " + f(cu[1] + 1.4) + " Q" + f(cu[0] - 4.8) + " " + f(cu[1] - 1.6) + " " + f(cu[0] - 6) + " " + f(cu[1] - 4.4) + " Z", "#BFE3FA", 1.2) + T.tinyTooth(cu[0], cu[1] - 4.6, .5, "#FFFFFF");
        if (o.night) lights += T.firefly(132, 128, .3) + T.firefly(276, 118, 1.4) + T.dmStar(238, 56, 3, "#FFF3C4", "tp-twinkle", .8) + T.dmStar(160, 70, 2.4, "#FFFFFF", "tp-twinkle", 1.7);
        return { body: s, lights: lights };
      }
    }
  };

  /* ------------------------------------------------------------------ the scene: a moonlit fairy glen -------------- */
  var scenes = {
    "fairy-glen": T.hillScene({
      note: "Always night: a big moon, giant glowing toadstools, fireflies and sparkles",
      alwaysNight: true, path: "stones", treeKind: "round", lamp: "lantern", grade: ["#8E7CFF", .07],
      ground: function(o){ return o.snow ? ["#F7FBFF", "#E8F0F8", "#D6E4F1", "#BCD2E6"] : ["#55AD9F", "#499A8D", "#3C8580", "#2B6669"]; },
      sky: function(){
        var s = T.bands(["#2A1D60", "#33297A", "#34458C", "#2F6690", "#2B7C8C", "#2B7C8C"], 0, 300) + T.starField(21, 34, 128);
        /* the moon: big, full and low, in a soft halo */
        s += soft(circ(298, 54, 46, "#CFF3FF", 0), ".1") + soft(circ(298, 54, 37, "#CFF3FF", 0), ".14") + circ(298, 54, 28, "#FFF6D2", 2);
        s += circ(288, 46, 5.4, "#F1E3A6") + circ(308, 62, 4.2, "#F1E3A6") + circ(302, 40, 2.6, "#F1E3A6") + circ(286, 64, 2.8, "#F1E3A6") + circ(313, 48, 1.8, "#F1E3A6") + T.HI("M277 46 a22 22 0 0 1 12 -13", 2);
        [[92, 30, 5, "#BFFFF0", 0], [150, 52, 3.4, "#FFD6F0", .9], [222, 24, 4.4, "#FFFFFF", 1.6], [248, 76, 3, "#BFFFF0", 2.2], [66, 70, 3.2, "#FFFFFF", .5], [338, 104, 3, "#FFD6F0", 1.2]].forEach(function(q){ s += T.dmStar(q[0], q[1], q[2], q[3], "tp-twinkle", q[4]); });
        return s;
      },
      far: function(o){
        var s = F("M0 152 Q60 120 130 136 Q200 106 286 132 Q340 112 400 134 V300 H0 Z", o.snow ? "#C9DDEE" : "#2F6189") + L("M0 152 Q60 120 130 136 Q200 106 286 132 Q340 112 400 134", 1.4, INK, .5);
        /* tall dark trees at the glen's edges, and the giant toadstools between them and the hill */
        s += L("M54 150 V96 M350 150 V98", 5, "#1E3460") + T.canopy(54, 88, 20, ["#2B4C80", "#213B68"], 71) + T.canopy(352, 92, 17, ["#2B4C80", "#213B68"], 72);
        s += toad(96, 143, 1.5, GLO[1], true, 1.5) + toad(74, 146, 2.5, GLO[0], true, 1.7) + toad(318, 150, 1.4, GLO[0], true, 1.5) + toad(338, 158, 2.3, GLO[2], true, 1.7);
        s += F("M0 190 Q70 168 140 180 Q230 166 300 184 Q360 172 400 182 V300 H0 Z", o.snow ? "#DCEAF6" : "#2A5A7C");
        /* mist lying in the hollows */
        s += soft(ell(70, 152, 44, 7, "#CFF3FF", 0), ".16") + soft(ell(334, 160, 40, 6, "#CFF3FF", 0), ".16");
        return s;
      },
      flat: function(o, on){
        var s = "";
        if (!o.snow) s += T.scatter(231, 40, on, function(sx, sy){ return T.tuft(sx, sy, "#2F7F7A", .8); }).join("");
        /* little flowers that glow */
        s += T.scatter(232, 18, on, function(sx, sy, i){ var c = ["#BFFFF0", "#FFC6EC", "#D9CCFF", "#FFF3C4"][i % 4]; return soft(circ(sx, sy - 2, 4.6, c, 0), ".22") + L("M" + f(sx) + " " + f(sy) + " v-2", 1, "#2F7F7A") + circ(sx, sy - 2.6, 1.7, c, .6); }).join("");
        return s;
      },
      props: function(o, on){
        return T.scatter(233, 9, on, function(sx, sy, i, R, x, y){
          var k = .85 + R() * .35, s = toad(sx + 9 * k, sy - 2, k * .62, GLO[(i + 1) % 3], true) + toad(sx, sy, k, GLO[i % 3], true);
          if (i % 3 === 0) s += toad(sx - 8 * k, sy + 2, k * .5, GLO[(i + 2) % 3], true);
          return { x: x, y: y, s: s };
        });
      },
      fg: function(){
        var s = "";
        [[72, 122, .2], [104, 208, 1.1], [152, 250, 2.0], [262, 238, .6], [318, 198, 1.6], [330, 136, 2.4], [228, 62, .9], [128, 74, 1.9], [196, 228, 2.8]].forEach(function(q){ s += T.firefly(q[0], q[1], q[2]); });
        [[86, 184, 3, "#FFFFFF", .4], [288, 216, 2.6, "#BFFFF0", 1.3], [60, 236, 2.4, "#FFD6F0", 2.1], [340, 236, 2.8, "#FFFFFF", .9]].forEach(function(q){ s += T.dmStar(q[0], q[1], q[2], q[3], "tp-twinkle", q[4]); });
        return s;
      }
    })
  };

  /* ------------------------------------------------------------------ the yard -------------------------------------- */
  /* a stack of n coins, a tooth stamped on the top one */
  function coins(cx, cy, r, n, stamp){
    var h = n * .17, s = cyl(cx, cy, 0, r, h, r, GOLD[0], GOLD[1], GOLD[2], { sw: 1.5, si: 1 }), rx = T.RX(r), ry = T.RY(r);
    for (var i = 1; i < n; i++){ var q = P(cx, cy, i * .17); s += L("M" + f(q[0] - rx) + " " + f(q[1]) + " A" + f(rx) + " " + f(ry) + " 0 0 0 " + f(q[0] + rx) + " " + f(q[1]), .7, GOLD[3], .75); }
    var t = P(cx, cy, h);
    if (stamp) s += '<g transform="translate(' + f(t[0]) + " " + f(t[1] + .4) + ') scale(1 .58)">' + T.tinyTooth(0, 0, r * 1.25, "#FFF6CC") + "</g>";
    return s;
  }
  var ringToads = (function(){
    var out = [], ks = [1.7, 1.25, 1.25, 1.0, 1.0, .82, .82, .7, .7], as = [225, 185, 265, 145, 305, 105, 345, 68, 22];
    as.forEach(function(a, i){ var t = a * Math.PI / 180; out.push({ x: 1.8 + Math.cos(t) * 1.42, y: 1.8 + Math.sin(t) * 1.42, k: ks[i], c: i % 3 }); });
    return out.sort(function(a, b){ return a.x + a.y - b.x - b.y; });
  })();
  var yard = {
    "coin-pile": {
      note: "Stacks of gold coins, each stamped with a tooth, and one big one on its edge", spot: [3.35, 3.45],
      egg: { n: "The coin pile", does: "a coin flips into the air", say: "Twenty baby teeth, twenty visits. The fairy keeps busy!" }, anim: "tp-jump 1.8s",
      draw: function(o){
        var s = ell.apply(null, P(1.8, 1.9, 0).concat([30, 11, "#1B2A3A", 0, .12]));
        [[.95, 1.0, 7], [.7, 2.15, 3], [2.1, .85, 4], [1.6, 1.65, 11], [2.7, 1.7, 6]].forEach(function(q){ s += coins(q[0], q[1], .54, q[2], true); });
        s += coins(1.05, 3.05, .46, 1, false) + coins(2.85, 2.75, .46, 2, false);
        /* the big coin, standing on its edge against the stacks */
        var g = P(1.85, 2.6, 0), x = g[0], y = g[1] - 11.4;
        s += circ(x + 2.4, y + .5, 11, GOLD[1], 1.5) + circ(x, y, 11, GOLD[0], 1.6) + ell(x, y, 8.2, 8.2, "none", 0).replace('fill="none"', 'fill="none" stroke="' + GOLD[3] + '" stroke-width="1"') + T.tinyTooth(x, y + .5, 1.15, "#FFF6CC") + T.HI("M" + f(x - 8.6) + " " + f(y - 2.6) + " a9 9 0 0 1 5.4 -5.8", 1.6);
        if (o.snow) s += ell.apply(null, P(1.6, 1.65, 1.9).concat([5.6, 2.2, "#FFFFFF", 0]));
        var t = P(1.6, 1.65, 1.87);
        return s + T.dmStar(t[0] - 4, t[1] - 5, 3.6, "#FFFFFF", "tp-twinkle", 0) + T.dmStar(x + 10, y - 9, 3, "#FFFFFF", "tp-twinkle", 1.2) + T.dmStar(x - 15, y + 8, 2.4, "#FFFFFF", "tp-twinkle", 2);
      },
      lights: function(){ var g = P(1.85, 2.6, 0); return T.glowAt(g[0], g[1] - 11.4, 9); },
      bits: function(){ var g = P(1.9, 1.4, 0), x = g[0] + 4, y = g[1] - 38; return ell(x, y, 6.4, 3.2, GOLD[0], 1.2) + ell(x, y - .6, 3.6, 1.5, GOLD[2], 0) + T.dmStar(x + 9, y - 6, 3, "#FFFFFF", "") + T.dmStar(x - 9, y - 3, 2.4, "#FFE58A", ""); }
    },
    "tooth-pillow": {
      note: "A big pillow propped on a cushion, a baby tooth tucked in its pocket", spot: [3.35, 3.45],
      egg: { n: "The tooth pillow", does: "a shiny coin lands by the pocket", say: "Baby teeth save the spot for grown-up teeth. Brush them too!" }, anim: "tp-pop 2.2s",
      draw: function(o){
        var g = P(1.8, 1.8, 0), s = ell(g[0], g[1] + 1, 30, 11, "#1B2A3A", 0, .12);
        s += pillow(.5, .5, 0, 2.6, 2.6, .28, .5, { top: "#E3D5FA", bot: "#B9A6DD", shade: "#CDBBEF" }, { tassels: "lfr", k: .8 });
        var d = "M-22 -19 Q0 -14.6 22 -19 Q17.6 0 22 19 Q0 14.6 -22 19 Q-17.6 0 -22 -19 Z", b = "";
        b += FO(d, "#BFE3FA", 2) + F("M22 -19 Q17.6 0 22 19 Q0 14.6 -22 19 Q-4 11 10 6 Q16 -4 22 -19 Z", "#93C6EA", .7) + O(d, 2);
        b += T.HI("M-17 -6 Q-17.6 -11 -16 -14.6", 2) + tassel([-21.4, 18.4], .8) + tassel([21.4, 18.4], .8);
        b += T.dmStar(-13, -9, 2.8, "#FFFFFF", "tp-twinkle", .4) + T.dmStar(15, -10, 2.4, "#FFFFFF", "tp-twinkle", 1.4) + T.dmStar(-15, 8, 2, "#FFFFFF", "tp-twinkle", 2.2);
        /* the baby tooth, then the pocket in front of its roots */
        b += T.tinyTooth(0, -3.6, 1.75, "#FFFFFF") + circ(-2.4, -8.6, .9, INK) + circ(2.4, -8.6, .9, INK) + L("M-1.8 -6.2 q1.8 1.5 3.6 0", .9);
        b += FO("M-11 -2.4 Q0 -5.6 11 -2.4 V8 Q11 14 0 14 Q-11 14 -11 8 Z", "#FFFDF6", 1.5) + L("M-9 0 Q0 -3 9 0", .8, "#F28FB5") + FO("M0 11 q-5 -3.2 -4.4 -6.2 q.6 -2.4 2.6 -2 q1.2 .2 1.8 1.4 q.6 -1.2 1.8 -1.4 q2 -.4 2.6 2 q.6 3 -4.4 6.2 z", "#FF8FB1", .8);
        s += '<g transform="translate(' + f(g[0]) + " " + f(g[1] - 27.5) + ') rotate(-6)">' + b + "</g>";
        if (o.snow) s += ell(g[0] - 2, g[1] - 47.4, 12, 2.6, "#FFFFFF", 0);
        return s;
      },
      lights: function(){ var g = P(1.8, 1.8, 0); return T.glowAt(g[0] - 1, g[1] - 36, 10); },
      bits: function(){ var g = P(1.8, 1.8, 0), x = g[0] + 13, y = g[1] - 46; return circ(x, y, 5.4, GOLD[0], 1.2) + T.tinyTooth(x, y + .3, .55, "#FFF6CC") + T.dmStar(x + 8, y - 6, 3, "#FFFFFF", "") + T.dmStar(x - 7, y - 8, 2.4, "#FFE58A", ""); }
    },
    "fairy-ring": {
      note: "A ring of toadstools, the tallest at the back; at night every cap glows", spot: [3.4, 3.45],
      egg: { n: "The fairy ring", does: "sparkles swirl up from the ring", say: "A fairy ring is one fungus growing outward. No teeth, all gills." }, anim: "tp-sparks 2s ease-out",
      draw: function(o){
        var c = P(1.8, 1.8, 0), cols = o.night ? GLO : DAYC, s = "";
        s += ell(c[0], c[1], T.RX(1.78), T.RY(1.78), o.snow ? "#E3EDF7" : o.night ? "#3C8580" : "#8BCB78", 0, .7);
        s += ell(c[0], c[1], T.RX(1.42), T.RY(1.42), "none", 0).replace('fill="none"', 'fill="none" stroke="' + (o.snow ? "#C9DDEE" : o.night ? "#2B6669" : "#5DA45A") + '" stroke-width="3.4" opacity=".7"');
        if (!o.snow) [[1.5, 1.4], [2.2, 1.7], [1.7, 2.2], [1.25, 1.95]].forEach(function(q, i){ var a = P(q[0], q[1], 0); s += i % 2 ? T.flower(a[0], a[1], o.night ? "#FFF3C4" : "#FFE27A", .8) : T.tuft(a[0], a[1], o.night ? "#2F7F7A" : "#5DA45A", .8); });
        ringToads.forEach(function(t){ var a = P(t.x, t.y, 0); s += toad(a[0], a[1], t.k, cols[t.c], o.night, 1.4); });
        if (o.night) s += T.dmStar(c[0] - 3, c[1] - 12, 3, "#FFFFFF", "tp-twinkle", .2) + T.dmStar(c[0] + 7, c[1] - 4, 2.4, "#BFFFF0", "tp-twinkle", 1.2) + T.dmStar(c[0] - 9, c[1] + 2, 2.2, "#FFD6F0", "tp-twinkle", 2);
        return s;
      },
      lights: function(){
        var s = "";
        ringToads.forEach(function(t){ var a = P(t.x, t.y, 0), col = GLO[t.c]; s += soft(circ(a[0], a[1] - 11 * t.k, 11 * t.k, col[0], 0), ".2") + toad(a[0], a[1], t.k, col, false, 1.4).replace(/^<path[^>]*\/>/, ""); });
        return s + T.firefly(P(1.8, 1.8, 0)[0] + 4, P(1.8, 1.8, 0)[1] - 16, .6);
      },
      bits: function(){ var c = P(1.8, 1.8, 0), s = ""; [[-8, -6, 3, "#FFFFFF"], [2, -14, 3.6, "#BFFFF0"], [9, -4, 2.6, "#FFD6F0"], [-3, -24, 3, "#FFF3C4"], [7, -30, 2.4, "#FFFFFF"], [-10, -34, 2.2, "#BFFFF0"]].forEach(function(q){ s += T.dmStar(c[0] + q[0], c[1] + q[1], q[2], q[3], ""); }); return s; }
    }
  };

  /* ------------------------------------------------------------------ the outfits ----------------------------------- */
  var mirror = function(s){ return '<g transform="translate(200 0) scale(-1 1)">' + s + "</g>"; };
  /* a pair of fairy wings behind him: c = [upper, lower, vein, shimmer] */
  var wings = function(c, dots){
    var one = p("M58 100 C38 98 6 106 2 132 C0 150 18 157 32 147 C48 135 58 120 62 106 Z", c[1]) + p("M62 96 C44 86 2 66 -4 30 C-8 4 10 -14 28 -6 C52 6 64 50 68 84 Z", c[0]) +
      '<path d="M60 90 C46 70 28 42 20 10 M60 92 C44 82 20 64 6 38 M58 104 C42 110 24 124 14 142" fill="none" stroke="' + c[2] + '" stroke-width="2.6" stroke-linecap="round"/>' +
      '<path d="M8 20 C6 6 16 -4 26 2 C20 4 12 10 8 20 Z M10 128 C10 118 20 112 30 110 C22 116 14 122 10 128 Z" fill="' + c[3] + '"/>' +
      (dots ? '<circle cx="14" cy="-2" r="3" fill="' + dots + '" ' + O2.replace("2.2", "1.4") + '/><circle cx="1" cy="34" r="2.6" fill="' + dots + '" ' + O2.replace("2.2", "1.4") + '/><circle cx="14" cy="148" r="2.6" fill="' + dots + '" ' + O2.replace("2.2", "1.4") + "/>" : "");
    return one + mirror(one);
  };
  /* a star wand in his hand */
  var wand = function(star, stick, big){
    var r = big ? 17 : 14, s = '<path d="M159 126 L181 60" stroke="' + INK + '" stroke-width="7.6" stroke-linecap="round"/><path d="M159 126 L181 60" stroke="' + stick + '" stroke-width="3.6" stroke-linecap="round"/>';
    if (big) s += p("M178 66 q-12 4 -16 16 q8 -2 12 -8 q-2 8 2 14 q6 -8 4 -22 z", "#FF8FB1", O2);
    s += starP(183, 48, r, star) + '<path d="M176 42 q2 -5 7 -6" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"/>';
    return s + T.dmStar(162, 32, 5, "#FFD23F", "tp-twinkle", .2) + T.dmStar(196, 76, 4, "#8FD3F5", "tp-twinkle", 1.1) + (big ? T.dmStar(166, 62, 3.4, "#FF8FB1", "tp-twinkle", 1.8) : "");
  };
  var bloom = function(x, y, r, c, mid){ var s = ""; for (var i = 0; i < 5; i++){ var a = i * Math.PI * 2 / 5 - Math.PI / 2; s += '<circle cx="' + f(x + Math.cos(a) * r * .62) + '" cy="' + f(y + Math.sin(a) * r * .62) + '" r="' + f(r * .5) + '" fill="' + c + '" ' + O2.replace("2.2", "1.6") + "/>"; } return s + '<circle cx="' + x + '" cy="' + y + '" r="' + f(r * .42) + '" fill="' + (mid || "#FFD23F") + '" ' + O2.replace("2.2", "1.4") + "/>"; };
  var outfits = {
    "fairy-wand": {
      note: "A gold tiara with a tooth on it, and a star wand",
      face: wand("#FFD23F", "#FFFDF6", false),
      top: p("M64 47 Q100 34 136 47 L141 29 L125 37 L118 19 L108 33 L100 8 L92 33 L82 19 L75 37 L59 29 Z", "#F2C94C", O3) + '<path d="M67 43 Q100 31 133 43" fill="none" stroke="#C9971C" stroke-width="2.2"/>' +
        '<circle cx="100" cy="8" r="4.8" fill="#FF8FB1" ' + O2 + '/><circle cx="118" cy="19" r="3.4" fill="#8FD3F5" ' + O2.replace("2.2", "1.8") + '/><circle cx="82" cy="19" r="3.4" fill="#8FD3F5" ' + O2.replace("2.2", "1.8") + '/><circle cx="141" cy="29" r="2.8" fill="#FFFFFF" ' + O2.replace("2.2", "1.6") + '/><circle cx="59" cy="29" r="2.8" fill="#FFFFFF" ' + O2.replace("2.2", "1.6") + "/>" + T.tinyTooth(100, 27, .95, "#FFFFFF"),
      say: ["One wave of the wand and... you still have to brush.", "A tiara on a crown. I am double royalty.", "Sparkle, sparkle! That's clean enamel for you."]
    },
    "fairy-wings": {
      note: "Sky-blue wings behind him and a crown of flowers",
      back: wings(["#D6F4FF", "#C6EEDD", "#8CCFEA", "#FFFFFF"], ""),
      top: '<path d="M56 53 Q100 30 144 53" fill="none" stroke="' + INK + '" stroke-width="8.4" stroke-linecap="round"/><path d="M56 53 Q100 30 144 53" fill="none" stroke="#6CB060" stroke-width="4.2" stroke-linecap="round"/>' +
        p("M70 40 q-9 -6 -5 -14 q9 3 5 14 z", "#7CC46A", O2) + p("M130 40 q9 -6 5 -14 q-9 3 -5 14 z", "#7CC46A", O2) + p("M90 32 q-4 -9 2 -14 q6 6 -2 14 z", "#7CC46A", O2) + p("M110 32 q4 -9 -2 -14 q-6 6 2 14 z", "#7CC46A", O2) +
        bloom(59, 51, 8.6, "#FF8FB1") + bloom(141, 51, 8.6, "#FF8FB1") + bloom(79, 41, 9.6, "#FFFFFF") + bloom(121, 41, 9.6, "#FFE27A", "#F28C28") + bloom(100, 35, 11.6, "#B08CFF"),
      say: ["Flutter, flutter. Don't forget to floss.", "These wings are for show. I mostly sit.", "Flowers on my crown. The good kind of crown."]
    },
    "tooth-fairy": {
      note: "Wings, a tall tiara, a tutu, a star wand and a pouch of coins",
      back: wings(["#F1DEFF", "#FFD6EC", "#C79BEA", "#FFFFFF"], "#F6CF55"),
      face: p("M46 116 Q100 132 154 116 L172 137 Q164 146 154 140 Q148 151 138 145 Q131 156 120 150 Q111 160 100 153 Q89 160 80 150 Q69 156 62 145 Q52 151 46 140 Q36 146 28 137 Z", "#FFD3E8", O3) +
        p("M48 116 Q100 132 152 116 L162 131 Q154 139 146 133 Q139 143 130 137 Q122 147 112 141 Q106 149 100 144 Q94 149 88 141 Q78 147 70 137 Q61 143 54 133 Q46 139 38 131 Z", "#FF9CC8", O2) +
        p("M48 113 Q100 129 152 113 L151 121 Q100 137 49 121 Z", "#B58CE0", O2) + T.star5(100, 129, 5.4, GOLD[0]) +
        /* the coin pouch in his other hand */
        '<circle cx="27" cy="117" r="6" fill="' + GOLD[0] + '" ' + O2 + '/><circle cx="36" cy="121" r="4.6" fill="' + GOLD[2] + '" ' + O2.replace("2.2", "1.8") + "/>" +
        p("M16 131 Q10 150 27 152 Q44 150 38 131 Q32 126 27 128 Q22 126 16 131 Z", "#B58CE0", O3) + p("M17 131 L13 121 L21 125 L27 119 L33 125 L41 121 L37 131 Q27 126 17 131 Z", "#CDB0EE", O2) +
        '<path d="M17 131 Q27 126 37 131" fill="none" stroke="' + GOLD[0] + '" stroke-width="2.6" stroke-linecap="round"/>' + T.tinyTooth(27, 141, .9, "#FFFFFF") +
        wand("#FFE27A", "#FF9CC8", true),
      top: p("M61 48 Q100 34 139 48 L146 25 L129 36 L121 12 L110 31 L100 -2 L90 31 L79 12 L71 36 L54 25 Z", "#F2C94C", O3) + '<path d="M64 44 Q100 31 136 44" fill="none" stroke="#FFF0B3" stroke-width="2.4"/>' +
        '<circle cx="121" cy="12" r="3.8" fill="#FFFFFF" ' + O2.replace("2.2", "1.8") + '/><circle cx="79" cy="12" r="3.8" fill="#FFFFFF" ' + O2.replace("2.2", "1.8") + '/><circle cx="146" cy="25" r="3" fill="#FF8FB1" ' + O2.replace("2.2", "1.6") + '/><circle cx="54" cy="25" r="3" fill="#FF8FB1" ' + O2.replace("2.2", "1.6") + "/>" +
        p("M100 36 q-8 -5 -7 -10 q1 -4 4.2 -3.2 q2 .4 2.8 2.2 q.8 -1.8 2.8 -2.2 q3.2 -.8 4.2 3.2 q1 5 -7 10 z", "#FF8FB1", O2) + starP(100, -6, 10, "#FFFFFF", O2),
      say: ["Tooth under the pillow? I'm on my way!", "I trade coins for baby teeth. Clean ones shine brightest.", "Twenty baby teeth each. I keep very busy."]
    }
  };

  return { k: "toothfairy", homes: homes, scenes: scenes, yard: yard, outfits: outfits };
}
