/* The winter holidays set of Timmy's place (tools/figures/site/sets.mjs lists its eight pieces; the shop's catalog has the
   same rows). One self-contained function: the build hands it the kit's tools (place.mjs, TOOLS) and pastes its source
   into tools/preview/design/place.js, so it may use nothing from outside itself but T. Structure: packs/thanksgiving.mjs.

   Secular winter trimmings only: logs, snow, pines, lights, a star, presents, skates. Never sugar (Timmy is a tooth): no
   candy canes, cookies or cocoa. No ids, gradients, filters, text, images or emoji: flat fills and ink outlines. */
export function pack(T){
  var K = T.K, P = T.P, D = T.D, f = T.f, F = T.F, O = T.O, L = T.L, FO = T.FO, G = T.G, circ = T.circ, ell = T.ell, box = T.box, cyl = T.cyl, INK = T.INK;
  var p = T.p, O2 = T.O2, O3 = T.O3;
  var LOG = { lit: "#C98F56", hi: "#E6B680", shade: "#9C6638", seam: "#6E4526", end: "#F0D2A0" };
  var RED = "#D9483B", REDS = "#B5382E", GRN = "#2F8F5B", GOLD = "#F2C94C", BULBS = ["#E5484D", "#F5D21E", "#3FA7E0", "#FF8FB1", "#7FE3C4"];
  var PINE = ["#4A9164", "#357A50"], PINE_N = ["#2F5A4A", "#244A3D"];
  /* a circle on a wall: face "y" (the wall turned left, u = x) or "x" (the wall turned right, u = y) */
  function ring(face, plane, u, v, r, n){ var out = []; n = n || 14; for (var q = 0; q < n; q++){ var th = q / n * Math.PI * 2; out.push(face === "y" ? [u + Math.cos(th) * r, plane, v + Math.sin(th) * r] : [plane, u + Math.cos(th) * r, v + Math.sin(th) * r]); } return out; }
  /* the sawn end of a log, with a growth ring */
  function logEnd(face, plane, u, v, r){ return FO(D(ring(face, plane, u, v, r)), LOG.end, 1.1) + (r > .2 ? L(D(ring(face, plane, u, v, r * .5, 8)), .6, LOG.seam, .55) : ""); }
  function stone(d, fill){ return F(d, fill) + L(d, .7, INK, .4); }

  /* ------------------------------------------------------------------ the home: a snowy log cabin ------------------- */
  var homes = {
    "log-cabin": {
      note: "Round logs notched at the corners, a fieldstone chimney, snow on the roof and windows that are always warm",
      ups: ["flag", "paint"], upn: { flag: "A Timmy flag on the ridge", paint: "Door and shutter paint" },
      door: [5.5, 8.4], brush: [7.4, 9.1], statue: [3.0, 9.4], spots: { door: [5.5, 10.4] }, h: 8.4, skirt: "snow",
      eaves: [[2.05, 8.95, 3.4], [8.6, 8.95, 3.4]], foot: [2.5, 3.2, 8.9, 8.4],
      base: [[2.5, 8.4], [8.3, 8.4], [8.8, 8.0], [8.8, 6.6], [9.05, 6.4], [9.05, 5.2], [8.3, 5.0], [8.3, 3.2]], block: [2.3, 2.9, 9.2, 8.8],
      draw: function(o){
        var u = o.up, bp = o.paint && o.paint !== "cream" ? T.BOLD[o.paint] : null, door = bp || { c: RED, s: REDS }, trim = bp ? bp.c : "#3F8A62", s = "", lights = "", i, j, z, zc;
        var x0 = 2.5, x1 = 8.3, y0 = 3.2, y1 = 8.4, zf = .3, zw = 3.3, ym = 5.8, zg = 6.15, e0 = 2.05, e1 = 8.6, ye = 8.95, ze = 3.4, zr = 6.4, yb = 2.65;
        s += box(x0 - .12, y0 - .12, 0, x1 - x0 + .24, y1 - y0 + .24, zf, { top: K.stone, left: "#D5D0C6", right: "#B0A99C" }, { sw: 1.5, si: 1 });
        /* the shaded wall and its gable, logs all the way up */
        s += FO(D([[x1, y0, zf], [x1, y1, zf], [x1, y1, zw], [x1, ym, zg], [x1, y0, zw]]), LOG.shade);
        for (i = 1; i < 12; i++){ z = zf + i * .5; var hw = z <= zw ? 2.6 : 2.6 * (1 - (z - zw) / (zg - zw)); if (hw > .2) s += L(D([[x1, ym - hw, z], [x1, ym + hw, z]], true), .9, LOG.seam, .7); }
        [[3.5, 4.35], [7.0, 7.85]].forEach(function(q){
          var w = T.win("x", x1, q[0], q[1], 1.4, 2.55, { night: true }); s += w.s; if (o.night) lights += w.lights;
          s += FO(D(T.onX(x1 + .02, T.rectUV(q[0] - .1, q[1] + .1, 1.27, 1.45))), "#FFFFFF", .9);
        });
        for (i = 0; i < 6; i += 2){ zc = zf + .25 + i * .5; s += FO(D([[x1, y0 + .5, zc - .25], [x1 + .3, y0 + .5, zc - .25], [x1 + .3, y0 + .5, zc + .25], [x1, y0 + .5, zc + .25]]), LOG.lit, 1) + logEnd("x", x1 + .3, y0 + .25, zc, .25); }
        /* the front wall: each log a seam and a highlight, so it reads round */
        s += FO(D(T.onY(y1, T.rectUV(x0, x1, zf, zw))), LOG.lit);
        for (i = 0; i < 6; i++){ z = zf + i * .5; if (i) s += L(D([[x0, y1, z], [x1, y1, z]], true), 1, LOG.seam, .75); s += L(D([[x0 + .15, y1, z + .36], [x1 - .15, y1, z + .36]], true), 1.6, LOG.hi, .75); }
        [[3.3, 4.1], [6.9, 7.7]].forEach(function(q){
          var w = T.win("y", y1, q[0], q[1], 1.4, 2.55, { night: true, shutters: trim }); s += w.s; if (o.night) lights += w.lights;
          s += FO(D(T.onY(y1 + .02, T.rectUV(q[0] - .1, q[1] + .1, 1.27, 1.45))), "#FFFFFF", .9);
        });
        /* the plank door with its wreath, a lantern beside it and a snowy step */
        s += FO(D(T.onY(y1, T.rectUV(4.85, 6.15, zf, 2.8))), LOG.end, 1.5) + FO(D(T.onY(y1, T.rectUV(4.98, 6.02, zf, 2.67))), door.c, 1.3);
        [5.24, 5.5, 5.76].forEach(function(x){ s += L(D([[x, y1, zf + .08], [x, y1, 2.6]], true), .8, door.s); });
        var kn = P(5.86, y1, 1.3); s += circ(kn[0], kn[1], 1.1, K.gold, .7);
        var wr = D(ring("y", y1, 5.5, 2.02, .36)), bw = P(5.5, y1, 1.66);
        s += L(wr, 3.8) + L(wr, 2.4, "#3F9A5E") + FO("M" + f(bw[0]) + " " + f(bw[1]) + " l-2.8 -1.8 v3.6 z M" + f(bw[0]) + " " + f(bw[1]) + " l2.8 -1.4 v3.6 z", RED, .7) + circ(bw[0], bw[1], 1, RED, .6);
        var ln = P(6.3, y1, 2.25), lan = "M" + f(ln[0] - 1.8) + " " + f(ln[1] - 2.6) + " h3.6 v5.2 h-3.6 z";
        s += L("M" + f(ln[0]) + " " + f(ln[1] - 4.8) + " v2", 1.2) + FO(lan, K.lit, 1) + L("M" + f(ln[0] - 2.5) + " " + f(ln[1] - 2.6) + " h5", 1.5);
        if (o.night) lights += T.glowAt(ln[0], ln[1], 10) + FO(lan, K.litHot, 1);
        s += box(4.8, y1, 0, 1.4, .5, .2, { top: "#FFFFFF", left: "#D5D0C6", right: "#B0A99C" }, { sw: 1.3, si: .9 });
        /* the notched corners: every other log pokes out, its sawn end showing */
        for (i = 0; i < 6; i++){
          zc = zf + .25 + i * .5;
          if (i % 2 === 0){
            s += FO(D([[x1, y1, zc - .25], [x1 + .3, y1, zc - .25], [x1 + .3, y1, zc + .25], [x1, y1, zc + .25]]), LOG.lit, 1) + logEnd("x", x1 + .3, y1 - .25, zc, .25);
            s += FO(D([[x0 - .3, y1, zc - .25], [x0, y1, zc - .25], [x0, y1, zc + .25], [x0 - .3, y1, zc + .25]]), LOG.lit, 1);
          } else {
            s += FO(D([[x1, y1, zc - .25], [x1, y1 + .3, zc - .25], [x1, y1 + .3, zc + .25], [x1, y1, zc + .25]]), LOG.shade, 1) + logEnd("y", y1 + .3, x1 - .25, zc, .25);
            s += FO(D([[x0 + .5, y1, zc - .25], [x0 + .5, y1 + .3, zc - .25], [x0 + .5, y1 + .3, zc + .25], [x0 + .5, y1, zc + .25]]), LOG.shade, 1) + logEnd("y", y1 + .3, x0 + .25, zc, .25);
          }
        }
        /* the roof: green shingles, a barge board over the gable, then the snow */
        var slope = [[e0, ye, ze], [e1, ye, ze], [e1, ym, zr], [e0, ym, zr]], rc = ["#4E8C6C", "#3B6E54", "#2C5741"];
        s += F(D(slope), rc[0]);
        for (i = 1; i < 5; i++){ var t = i / 5; s += L(D([[e0, ye - (ye - ym) * t, ze + (zr - ze) * t], [e1, ye - (ye - ym) * t, ze + (zr - ze) * t]], true), 1, rc[2], .6); }
        s += FO(D([[e1, ye, ze], [e1, ym, zr], [e1, yb, ze], [e1, yb, ze - .32], [e1, ym, zr - .38], [e1, ye, ze - .32]]), rc[1]) + O(D(slope));
        var st = o.snow ? .9 : .62, ys = ym + (ye - ym) * st, zs = zr - (zr - ze) * st, ybs = ym - (ym - yb) * st, xe = e1 + .08, wd = e1 - e0 + .16, n = 8, w = wd / n;
        s += FO(D([[xe, ym, zr + .26], [xe, ybs, zs + .12], [xe, ybs, zs - .04], [xe, ym, zr - .04]]), "#C9DDEE", 1.1);
        s += FO(D([[xe, ym, zr + .26], [xe, ys, zs + .12], [xe, ys, zs - .04], [xe, ym, zr - .04]]), "#DCEAF6", 1.1);
        var a = P(e0 - .08, ym, zr + .26), d = "M" + f(a[0]) + " " + f(a[1]), q = P(xe, ys, zs + .12);
        for (i = 1; i <= 4; i++){ var m = P(e0 - .08 + wd * (i - .5) / 4, ym, zr + .26), e = P(e0 - .08 + wd * i / 4, ym, zr + .26); d += " Q" + f(m[0]) + " " + f(m[1] - (i % 2 ? 2.4 : 1)) + " " + f(e[0]) + " " + f(e[1]); }
        d += " L" + f(q[0]) + " " + f(q[1]);
        for (i = 1; i <= n; i++){ var xx = xe - w * i, e2 = P(xx, ys, zs + .12), m2 = P(xx + w / 2, ys, zs + .12); d += " Q" + f(m2[0]) + " " + f(m2[1] + (i % 2 ? 4.8 : 2.8)) + " " + f(e2[0]) + " " + f(e2[1]); }
        s += FO(d + " Z", "#FFFFFF", 1.3);
        s += L(D([[e0 + .5, ym + .5, zr - .2], [e0 + 2.6, ym + .5, zr - .2]], true) + D([[e0 + 3.4, ym + 1.5, zr - 1.2], [e0 + 5.6, ym + 1.5, zr - 1.2]], true), 1.1, "#DCEAF6");
        if (o.snow) for (i = 0; i < 11; i++){ var ic = P(e0 + .35 + i * .6, ye, ze - .04), len = 3.4 + (i * 7 % 5); s += FO("M" + f(ic[0] - 1.2) + " " + f(ic[1] - .7) + " l1.2 " + f(len + .7) + " l1.2 " + f(-len + .7) + " z", "#EAF6FF", .6); }
        /* the fieldstone chimney up the gable end, smoke rising */
        var cx1 = x1 + .75, cy0 = 5.2, cy1 = 6.4, ct = 7.5, R = T.rng(7);
        s += box(x1, cy0, 0, .75, 1.2, ct, { top: "#8E98A3", left: "#DDD7CB", right: "#B5AEA1" });
        for (i = 0; i < 15; i++){
          var z0 = i * .5, cut = cy0 + .4 + R() * .4;
          s += stone(D(T.onX(cx1, T.rectUV(cy0 + .05, cut - .03, z0 + .05, z0 + .46))), ["#BDB6A8", "#A8A193", "#C8C1B3", "#9F988B"][i % 4]) + stone(D(T.onX(cx1, T.rectUV(cut + .03, cy1 - .05, z0 + .05, z0 + .46))), ["#A8A193", "#C8C1B3", "#9F988B", "#BDB6A8"][i % 4]);
          s += stone(D(T.onY(cy1, T.rectUV(x1 + .05, cx1 - .05, z0 + .05, z0 + .46))), ["#E4DED2", "#D4CEC2", "#ECE6DA"][i % 3]);
        }
        s += box(x1 - .1, cy0 - .1, ct, .95, 1.4, .3, { top: "#8E98A3", left: "#E4DED2", right: "#A8A193" }, { sw: 1.5, si: 1 });
        var cz = ct + .3, tp = P(x1 + .37, cy0 + .6, cz + .1);
        s += FO(D([[x1 - .14, cy0 - .14, cz], [cx1 + .14, cy0 - .14, cz], [cx1 + .14, cy1 + .14, cz], [x1 - .14, cy1 + .14, cz]]), "#FFFFFF", 1.1) + ell(tp[0], tp[1], 3.6, 1.9, "#5A4A54", 0) + T.smoke(tp[0], tp[1] - 7);
        /* firewood stacked against the wall, snow on top */
        s += box(x1, 6.65, 0, .5, 1.3, .98, { top: "#FFFFFF", left: LOG.lit, right: LOG.shade }, { sw: 1.4, si: 1 });
        for (i = 0; i < 3; i++) for (j = 0; j < 4; j++) s += logEnd("x", x1 + .5, 6.82 + j * .32, .17 + i * .32, .15);
        if (u.flag) s += T.flagOn(e0 + .55, ym, zr + .2, 2.4);
        return { body: s, lights: lights };
      }
    }
  };

  /* ------------------------------------------------------------------ the scene: a frozen lake under the aurora ----- */
  /* one curtain of the northern lights: three flat veils, each taller and fainter, and rays that shimmer */
  function aurora(base, amp, ph, cols, k){
    var lo = [], x, s = "", rays = "";
    for (x = -10; x <= 410; x += 10) lo.push([x, base + amp * Math.sin(x / 46 + ph) + amp * .5 * Math.sin(x / 19 + ph * 2)]);
    [[58, .16, 2], [36, .26, 1], [15, .5, 0]].forEach(function(q){
      var up = lo.map(function(pt){ return [pt[0] + 6, pt[1] - q[0] * (.75 + .25 * Math.sin(pt[0] / 31 + ph))]; }).reverse();
      s += F(T.D2(lo.concat(up)), cols[q[2]], Math.round(q[1] * k * 100) / 100);
    });
    for (x = 6; x < 400; x += 9 + Math.round(7 * Math.abs(Math.sin(x * .7 + ph)))){ var pt = lo[Math.min(lo.length - 1, Math.round((x + 10) / 10))], h = 14 + 34 * Math.abs(Math.sin(x * .37 + ph)); rays += L("M" + f(x) + " " + f(pt[1] - 1) + " v" + f(-h), 3, cols[0], Math.round(.3 * k * 100) / 100); }
    return s + G("tp-water", rays) + L(T.D2(lo, true), 1.6, "#E9FFF2", Math.round(.6 * k * 100) / 100);
  }
  var scenes = {
    "aurora-lake": T.hillScene({
      note: "Snow, pines and a frozen lake, the northern lights rippling over the far peaks",
      path: "snow", treeKind: "pine", lamp: "iron", skirt: "snow", grade: ["#8FB6E8", .07], snowy: true,
      ground: function(o){ return o.night ? ["#C9D6EA", "#B4C3DC", "#9FB0CC", "#8394B4"] : ["#F7FBFF", "#E8F0F8", "#D6E4F1", "#BCD2E6"]; },
      sky: function(o){
        if (o.night) return T.bands(["#0A1136", "#101B48", "#17295A", "#1E376A"], 0, 300) + T.starField(23, 30, 120) + aurora(38, 6, 2.1, ["#A99BFF", "#6FD9E8", "#B48CFF"], .8) + aurora(76, 9, .4, ["#7CF5B0", "#4FE0C0", "#8C8CF5"], 1) + T.moon(332, 28);
        /* the short polar day: a dusky sky, the lights already out, the sun low */
        return T.bands(["#6272BC", "#8C8ECC", "#C6A6CE", "#F2C2B8"], 0, 300) + aurora(40, 6, 2.1, ["#C9B8FF", "#9FE6EE", "#C9A6FF"], .6) + aurora(76, 9, .4, ["#9BF7C4", "#7FE9D2", "#A9A9F7"], .8) + T.sun(84, 40);
      },
      far: function(o){
        var m = o.night ? ["#33427A", "#283668", "#C9D6EA"] : ["#8F9CD2", "#7584C0", "#FFFFFF"], ice = o.night ? ["#2C5C86", "#3D749C", "#7FB0D0"] : ["#C6E6F6", "#E4F4FB", "#FFFFFF"], pn = o.night ? "#1F3F3A" : "#3E7A5C", s = "", x;
        s += FO("M-10 106 L28 68 L52 88 L84 54 L118 94 L150 80 L176 106 Z", m[0], 1.5) + F("M84 54 L96 70 L88 68 L82 75 L75 68 L69 72 Z", m[2]) + F("M28 68 L36 78 L29 77 L24 82 L20 77 Z", m[2]);
        s += FO("M226 106 L262 76 L286 94 L322 52 L352 86 L372 72 L410 106 Z", m[1], 1.5) + F("M322 52 L334 68 L326 66 L320 73 L313 66 L308 70 Z", m[2]) + F("M372 72 L380 81 L374 80 L369 84 Z", m[2]);
        /* the lake: ice to the far shore, a line of pines along it */
        s += F("M0 103 H400 V300 H0 Z", ice[0]) + F("M0 103 H400 V109 H0 Z", ice[1], .8);
        for (x = 34; x < 372; x += 7){ if (x > 150 && x < 252) continue; var h = 7 + (x * 13 % 5); s += F("M" + f(x - 3.2) + " 104 l3.2 " + f(-h) + " l3.2 " + f(h) + " z", pn); }
        s += L("M0 103.6 H400", 1.3, INK, .6);
        /* the lights mirrored in the ice, wind-swept streaks, a skater's loops */
        [[50, 26], [56, 34], [62, 22], [84, 18], [90, 24], [298, 20], [304, 28], [334, 32], [340, 38], [346, 26]].forEach(function(q){ s += L("M" + q[0] + " 109 v" + q[1], 3, o.night ? "#7CF5B0" : "#8CEFC0", o.night ? .4 : .55); });
        s += L("M46 116 h20 M64 128 h24 M46 142 h14 M296 114 h22 M330 127 h24 M344 142 h12", 1.5, ice[2], .9);
        s += L("M72 120 q7 -5 12 0 q-5 6 -11 2 q-6 -4 -1 -8", 1, o.night ? "#9CC7E0" : "#8FBFDD", .9);
        /* an ice-fishing shack out on the lake, its window warm */
        s += ell(321, 124.5, 10, 2.6, o.night ? "#1F4668" : "#A9D3EA", 0) + FO("M313 124 v-9 l7.5 -5.5 l7.5 5.5 v9 z", o.night ? "#A8463E" : RED, 1.2) + F("M311.6 115.4 l8.9 -6.6 l8.9 6.6 l-2.2 .4 l-6.7 -4.8 l-6.7 4.8 z", "#FFFFFF") + L("M311.6 115.4 l8.9 -6.6 l8.9 6.6", 1) +
          FO("M318.4 124 v-6 h4.2 v6 z", K.lit, .8) + L("M334 124 v-12", 1.2) + F("M334 112 l5 1.8 l-5 1.8 z", GOLD) + ell(338, 126.5, 2.6, 1, o.night ? "#16324E" : "#5F9CC0", .7);
        return s;
      },
      flat: function(o, on){
        var c = o.night ? "#AFC0DA" : "#E1ECF6";
        return T.scatter(151, 16, on, function(sx, sy, i){ return ell(sx, sy, 7, 2.4, c, 0) + (i % 3 ? "" : T.dmStar(sx + 3, sy - 3, 2.2, "#FFFFFF", "tp-twinkle", i * .4)); }).join("");
      },
      props: function(o, on){
        return T.scatter(152, 9, on, function(sx, sy, i, R, x, y){
          var r = o.night ? ["#5A6585", "#47506E"] : ["#B7C2CE", "#97A3B1"];
          var s = i % 4 === 3 ? FO("M" + f(sx - 8) + " " + f(sy) + " L" + f(sx - 5) + " " + f(sy - 7) + " L" + f(sx + 3) + " " + f(sy - 9) + " L" + f(sx + 8) + " " + f(sy) + " Z", r[0], 1.4) + F("M" + f(sx - 5.6) + " " + f(sy - 6.4) + " L" + f(sx + 3) + " " + f(sy - 9.4) + " L" + f(sx + 6.4) + " " + f(sy - 4.6) + " L" + f(sx) + " " + f(sy - 5.6) + " Z", "#FFFFFF")
            : ell(sx + 1, sy + 1, 9, 3, "#1B2A3A", 0, .1) + T.pine(sx, sy + 1, 28 + R() * 14, o.night ? PINE_N : PINE, true);
          return { x: x, y: y, s: s };
        });
      },
      fg: function(){ var R = T.rng(41), s = ""; for (var i = 0; i < 18; i++) s += '<circle class="tp-flake" cx="' + f(R() * 400) + '" cy="' + f(R() * 260) + '" r="' + (i % 3 ? 1.2 : 1.8) + '" fill="#fff" style="animation-delay:' + f(i * .41 % 4) + 's"/>'; return s; }
    })
  };

  /* ------------------------------------------------------------------ the yard -------------------------------------- */
  function rinkBulbs(){
    var tops = [P(.25, 3.25, 2.5), P(.25, .25, 2.5), P(3.25, .25, 2.5)], out = [], k = 0;
    for (var sp = 0; sp < 2; sp++) for (var i = 1; i <= 4; i++){ var t = i / 5, a = tops[sp], b = tops[sp + 1]; out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t + Math.sin(t * Math.PI) * 4 + 1.8, BULBS[k++ % BULBS.length]]); }
    return { tops: tops, bulbs: out };
  }
  function treeGeo(){ var g = P(1.7, 1.7, 0), x = g[0], y = g[1]; return { x: x, y: y, tiers: [[y - 26, y - 4.5, 20], [y - 35, y - 15, 15.5], [y - 43, y - 24.5, 11.5], [y - 50, y - 33.5, 7.6]] }; }
  function treeBulbs(){
    var t = treeGeo(), out = [];
    t.tiers.forEach(function(q, i){
      var n = 5 - i, hw = q[2] * .62, a = [t.x - hw, q[1] - 4.5], c = [t.x, q[1] + 2.5], b = [t.x + hw, q[1] - 5.5];
      for (var j = 0; j < n; j++){ var u = (j + .5) / n, v = 1 - u; out.push([v * v * a[0] + 2 * u * v * c[0] + u * u * b[0], v * v * a[1] + 2 * u * v * c[1] + u * u * b[1] + 1.5, BULBS[(i * 2 + j) % BULBS.length]]); }
    });
    return out;
  }
  function present(x, y, w, h, c, rib){
    var s = box(x, y, 0, w, w, h, { top: c[0], left: c[0], right: c[1] }, { sw: 1.3, si: .9 }), t = P(x + w / 2, y + w / 2, h);
    s += L(D([[x + w / 2, y, h], [x + w / 2, y + w, h], [x + w / 2, y + w, 0]], true) + D([[x, y + w / 2, h], [x + w, y + w / 2, h], [x + w, y + w / 2, 0]], true), 1.5, rib);
    return s + FO("M" + f(t[0]) + " " + f(t[1]) + " q-4 -4.4 -3.4 -.6 z M" + f(t[0]) + " " + f(t[1]) + " q4 -4.4 3.4 -.6 z", rib, .7);
  }
  var yard = {
    "snow-globe": {
      note: "A glass globe on a wooden stand: a tiny cabin, a pine and snow waiting for a shake", spot: [3.3, 3.4],
      egg: { n: "The snow globe", does: "it gets a shake and the snow swirls", say: "Shake it! Snow is only water. Water is my favorite drink." }, anim: "tp-sparks 2s ease-out",
      draw: function(o){
        var g0 = P(1.8, 1.8, 0), c = P(1.8, 1.8, 2.15), r = 16.5, s = ell(g0[0] + 2, g0[1] + 1.5, 21, 7.4, "#1B2A3A", 0, .1);
        s += cyl(1.8, 1.8, 0, 1.08, .3, 1.08, RED, REDS, "#E86A5C", { sw: 1.6 }) + cyl(1.8, 1.8, .3, .86, .66, .74, LOG.lit, LOG.shade, LOG.hi, { sw: 1.6 });
        var bd = P(1.8, 1.8, .15); s += L("M" + f(bd[0] - T.RX(1.08) + 1) + " " + f(bd[1] + 1) + " A" + f(T.RX(1.08)) + " " + f(T.RY(1.08)) + " 0 0 0 " + f(bd[0] + T.RX(1.08) - 1) + " " + f(bd[1] + 1), 1.4, GOLD);
        s += circ(c[0], c[1], r, o.night ? "#3B5A8C" : "#BFE3F7", 0);
        var fy = c[1] + r * .46, fx = Math.sqrt(r * r - r * .46 * r * .46);
        s += F("M" + f(c[0] - fx) + " " + f(fy) + " Q" + f(c[0] - 3) + " " + f(fy - 6) + " " + f(c[0] + fx) + " " + f(fy) + " A" + r + " " + r + " 0 0 1 " + f(c[0] - fx) + " " + f(fy) + " Z", "#FFFFFF");
        /* inside: a pine and a little cabin with a lit window */
        var hx = c[0] + 4.4, hy = fy - 1.6;
        s += T.pine(c[0] - 6.4, fy - 1.4, 15, o.night ? PINE_N : PINE, true);
        s += FO("M" + f(hx - 5) + " " + f(hy) + " v-5 l5 -4.4 l5 4.4 v5 z", LOG.lit, 1) + L("M" + f(hx - 5) + " " + f(hy - 2.4) + " h10", .6, LOG.seam, .7) + FO("M" + f(hx - 6.2) + " " + f(hy - 4.6) + " l6.2 -5.6 l6.2 5.6 l-1.8 .8 l-4.4 -4 l-4.4 4 z", "#FFFFFF", .8) + FO("M" + f(hx - 1.3) + " " + f(hy) + " v-3.4 h2.6 v3.4 z", K.lit, .6);
        [[-9, -8], [-3, -11], [4, -9], [10, -5], [-11, -1], [0, -5], [8, 2], [-6, 3]].forEach(function(q, i){ s += circ(c[0] + q[0], c[1] + q[1], i % 3 ? .9 : 1.3, "#FFFFFF").replace("/>", ' class="tp-twinkle" style="animation-delay:' + f(i * .35) + 's"/>'); });
        s += L("M" + f(c[0] - r * .66) + " " + f(c[1] - r * .28) + " A" + f(r * .74) + " " + f(r * .74) + " 0 0 1 " + f(c[0] - r * .2) + " " + f(c[1] - r * .7), 2.2, "#FFFFFF", .85) + circ(c[0], c[1], r, "none", 1.9);
        if (o.snow) s += FO("M" + f(c[0] - 8) + " " + f(c[1] - r + 2.6) + " Q" + f(c[0]) + " " + f(c[1] - r - 3.6) + " " + f(c[0] + 8) + " " + f(c[1] - r + 2.6) + " q-2 2.6 -4 .6 q-2 2.4 -4 .4 q-2 2.4 -4 0 q-2 1.8 -4 -1 z", "#FFFFFF", 1);
        return s;
      },
      lights: function(){ var c = P(1.8, 1.8, 2.15); return T.glowAt(c[0] + 4.4, c[1] + 4.4, 8); },
      bits: function(){ var c = P(1.8, 1.8, 2.15), s = ""; [[-10, 2], [-7, -6], [-2, 4], [1, -10], [5, -2], [9, 4], [11, -6], [-4, -2], [3, 8], [-9, 9], [7, -11], [-1, -6]].forEach(function(q, i){ s += circ(c[0] + q[0], c[1] + q[1] + 2, i % 2 ? 1.5 : 1.1, "#FFFFFF", .5); }); return s; }
    },
    "ice-rink": {
      note: "A pond rink in a ring of snow, strung with lights, a pair of skates on the post", spot: [3.4, 3.45],
      egg: { n: "The ice rink", does: "a penguin glides out for a lap", say: "Skate on ice, never chew it. Ice can crack a tooth." }, anim: "tp-pop 2.2s",
      draw: function(o){
        var c = P(1.8, 1.9, 0), s = "", rb = rinkBulbs(), bank = T.lumps(c[0], c[1], 33, 5, 13, .56), ice = T.lumps(c[0], c[1] + .5, 25.5, 9, 12, .54);
        s += F(T.lumps(c[0] + 2, c[1] + 2.6, 33, 5, 13, .56), o.night ? "#8C9DBD" : "#BFD4E8") + FO(bank, o.night ? "#DCE6F4" : "#FFFFFF", 1.5);
        s += FO(ice, o.night ? "#6FA9CF" : "#A5DBF4", 1.3) + F(T.lumps(c[0] + 5, c[1] + 3.6, 15, 3, 9, .5), o.night ? "#5C97BF" : "#8DCDEC", .7);
        s += G("tp-water", L("M" + f(c[0] - 17) + " " + f(c[1] - 3) + " l9 -3.4 M" + f(c[0] - 12) + " " + f(c[1] + 1) + " l5 -1.9 M" + f(c[0] + 8) + " " + f(c[1] + 8) + " l9 -3.4", 1.5, "#FFFFFF", .9));
        /* a figure eight cut by skates */
        s += L("M" + f(c[0] - 1) + " " + f(c[1] + 1) + " c-4 -5 -13 -3 -11 2 c2 5 9 2 11 -2 c2 -4 10 -7 13 -2 c2 5 -8 7 -13 2", 1, o.night ? "#3F7CA6" : "#5FA9D0", .9);
        /* three posts and two strings of lights round the back */
        var feet = [P(.25, 3.25, 0), P(.25, .25, 0), P(3.25, .25, 0)];
        feet.forEach(function(q, i){ var t = rb.tops[i]; s += L(T.seg(q, t), 3.2) + L(T.seg(q, t), 1.5, K.wood) + ell(q[0], q[1], 3.4, 1.5, "#FFFFFF", .8) + FO("M" + f(t[0] - 2.4) + " " + f(t[1] + .6) + " q2.4 -4.4 4.8 0 z", "#FFFFFF", .8); });
        for (var sp = 0; sp < 2; sp++){ var a = rb.tops[sp], b = rb.tops[sp + 1]; s += L("M" + f(a[0]) + " " + f(a[1] + 1.4) + " Q" + f((a[0] + b[0]) / 2) + " " + f((a[1] + b[1]) / 2 + 9) + " " + f(b[0]) + " " + f(b[1] + 1.4), .9, INK, .8); }
        rb.bulbs.forEach(function(q, i){ s += circ(q[0], q[1], 1.9, q[2], .7).replace("/>", ' class="tp-twinkle" style="animation-delay:' + f(i * .3) + 's"/>'); });
        /* skates hung on the left post by their laces */
        var hk = [rb.tops[0][0], rb.tops[0][1] + 7], boot = function(x, y){ return L("M" + f(hk[0]) + " " + f(hk[1]) + " L" + f(x + 1.8) + " " + f(y - 7), .8) + FO("M" + f(x) + " " + f(y - 7) + " h3.6 v3.6 l4.4 1.6 q2 1 1.2 2.8 h-9.2 z", RED, 1) + L("M" + f(x) + " " + f(y - 5.6) + " h3.6", 1.2, "#FFFFFF") + L("M" + f(x - 1) + " " + f(y + 3) + " h11.6", 2.6) + L("M" + f(x - 1) + " " + f(y + 3) + " h11.6", 1.2, "#D9DFE5"); };
        s += boot(hk[0] - 9, hk[1] + 12) + boot(hk[0] + 1, hk[1] + 16);
        return s;
      },
      lights: function(){ var s = ""; rinkBulbs().bulbs.forEach(function(q){ s += circ(q[0], q[1], 5, q[2], 0).replace("/>", ' opacity=".3"/>') + circ(q[0], q[1], 1.9, q[2], .5); }); return s; },
      bits: function(){
        var c = P(1.8, 1.9, 0), x = c[0] + 9, y = c[1] + 2;
        return ell(x, y + 5, 5.4, 1.6, "#1B2A3A", 0, .18) + FO("M" + f(x - 4.4) + " " + f(y + 4) + " q-1 -11 4.4 -11.6 q5.4 .6 4.4 11.6 q-4.4 1.6 -8.8 0 z", "#2B2230", 1) + ell(x - .4, y - .4, 2.7, 4, "#FFFFFF", 0) + circ(x - 1.4, y - 5, .7, "#FFFFFF") + circ(x + 1.2, y - 5, .7, "#FFFFFF") +
          F("M" + f(x - 1.4) + " " + f(y - 3.8) + " h2.8 l-1.4 2 z", K.orange) + F("M" + f(x - 3.6) + " " + f(y + 4.2) + " h3 v1.4 h-3.6 z M" + f(x + .8) + " " + f(y + 4.2) + " h3 l.6 1.4 h-3.6 z", K.orange) + L("M" + f(x - 3.6) + " " + f(y - 2) + " q3.4 1.6 7 0 M" + f(x + 2.6) + " " + f(y - 1.4) + " l2.4 3", 1.5, RED);
      }
    },
    "holiday-tree": {
      note: "A tall evergreen: a gold star, strings of lights that glow at night, presents underneath", spot: [3.4, 3.45],
      egg: { n: "The decorated tree", does: "the star throws sparkles", say: "My favorite ornament? The little tooth. Obviously." }, anim: "tp-sparks 2s ease-out",
      draw: function(o){
        var t = treeGeo(), x = t.x, y = t.y, c = o.night ? PINE_N : ["#3F9A5E", "#2E7D4A"], s = ell(x + 2, y + 2, 25, 8.6, "#1B2A3A", 0, .1);
        s += present(.5, 1.35, .62, .5, ["#3ECF9E", "#239A72"], RED);
        s += FO("M" + f(x - 2.4) + " " + f(y + 1) + " v-8 h4.8 v8 z", K.woodShade, 1.3);
        t.tiers.forEach(function(q, i){
          var hw = q[2], d = "M" + f(x) + " " + f(q[0]) + " L" + f(x + hw) + " " + f(q[1]) + " Q" + f(x + hw * .5) + " " + f(q[1] + 4.6) + " " + f(x) + " " + f(q[1] + 1.6) + " Q" + f(x - hw * .5) + " " + f(q[1] + 4.6) + " " + f(x - hw) + " " + f(q[1]) + " Z";
          s += F(d, c[0]) + F("M" + f(x) + " " + f(q[0]) + " L" + f(x + hw) + " " + f(q[1]) + " Q" + f(x + hw * .5) + " " + f(q[1] + 4.6) + " " + f(x + 1.5) + " " + f(q[1] + 1.6) + " Z", c[1]) + O(d, 1.6);
          if (o.snow) s += F("M" + f(x) + " " + f(q[0]) + " L" + f(x - hw * .5) + " " + f(q[0] + (q[1] - q[0]) * .5) + " q2.4 2.8 4.4 -.4 q2 3 4 -.6 q1.6 2.4 " + f(hw * .5 - 6) + " -2 Z", "#FFFFFF", .95);
          s += L("M" + f(x - hw * .62) + " " + f(q[1] - 4.5) + " Q" + f(x) + " " + f(q[1] + 2.5) + " " + f(x + hw * .62) + " " + f(q[1] - 5.5), 1.2, GOLD);
        });
        /* ornaments, a little tooth among them, then the lights and the star */
        [[-9, -12, RED], [7, -11, "#3FA7E0"], [-4, -22, "#FFFFFF"], [5, -31, RED], [11, -9.5, GOLD], [-2, -40, "#3FA7E0"]].forEach(function(q){ s += circ(x + q[0], y + q[1], 2.1, q[2], .8); });
        s += T.tinyTooth(x + 3.4, y - 19.4, .5, "#FFFFFF");
        treeBulbs().forEach(function(q, i){ s += circ(q[0], q[1], 1.6, q[2], .6).replace("/>", ' class="tp-twinkle" style="animation-delay:' + f(i * .27) + 's"/>'); });
        s += T.star5(x, y - 53, 6, GOLD);
        s += present(.75, 2.45, .8, .62, ["#E5484D", "#B8323A"], GOLD) + present(2.3, 1.75, .66, .86, ["#3FA7E0", "#2378B0"], "#FFFFFF") + present(1.75, 2.75, .56, .42, ["#9B7BE0", "#6E50B8"], GOLD);
        return s;
      },
      lights: function(){
        var t = treeGeo(), s = T.glowAt(t.x, t.y - 53, 10) + T.star5(t.x, t.y - 53, 6, "#FFE27A");
        treeBulbs().forEach(function(q){ s += circ(q[0], q[1], 4.6, q[2], 0).replace("/>", ' opacity=".32"/>') + circ(q[0], q[1], 1.6, q[2], .4); });
        return s;
      },
      bits: function(){ var t = treeGeo(), s = ""; [[-11, -56, 3.4], [10, -60, 2.8], [-5, -66, 2.4], [14, -48, 2.2], [3, -70, 3], [-15, -46, 2]].forEach(function(q, i){ s += T.dmStar(t.x + q[0], t.y + q[1], q[2], i % 2 ? "#FFFFFF" : "#FFE27A", ""); }); return s; }
    }
  };

  /* ------------------------------------------------------------------ the outfits ----------------------------------- */
  var flip = function(s){ return s + '<g transform="translate(200 0) scale(-1 1)">' + s + "</g>"; };
  /* what covers his body below the face: the same cut for the sweater and the jacket; neck is how far the neckline dips */
  var torso = function(neck){ return "M46 " + neck[0] + " Q100 " + neck[1] + " 154 " + neck[0] + " L149 131 Q142 134 136 144 C123 155 111 157.5 100 157.5 C89 157.5 77 155 64 144 Q58 134 51 131 Z"; };
  var sleeve = function(col, cuff){ return flip(p("M54 101 C47 98.4 41.6 99.4 37 102.6 L42.4 126 C46 122.6 50 121 54 120 Z", col, O3) + p("M32 105.4 L37.6 102 L43 125.6 L37.4 128.6 Z", cuff, O2)); };
  var zig = (function(){ var d = ""; for (var i = 0; i <= 12; i++){ var x = 64 + i * 6, t = (x - 48) / 104, y = 107 + 2 * t * (1 - t) * 44 + (i % 2 ? 7.4 : 2.8); d += (i ? " L" : "M") + f(x) + " " + f(y); } return d; })();
  var outfits = {
    "ugly-sweater": {
      note: "A loud knitted sweater: zigzags, snow and a tree with a star, sleeves and all",
      face: sleeve(RED, GRN) + p(torso([100, 144]), RED) + p("M46 100 Q100 144 154 100 L152 107 Q100 151 48 107 Z", GRN, O2) +
        '<path d="' + zig + '" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>' +
        p("M100 138.6 l5.4 6 h-2.6 l5 6.4 h-15.6 l5 -6.4 h-2.6 z", "#3FB56F", 'stroke="' + INK + '" stroke-width="1.5"') + T.star5(100, 138.4, 3.4, GOLD) +
        [[72, 135], [128, 135], [82, 144.6], [118, 144.6], [64, 127], [136, 127]].map(function(q){ return '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="2" fill="#FFFFFF"/>'; }).join("") +
        '<path d="M70 150 Q100 162 130 150" fill="none" stroke="' + GRN + '" stroke-width="2.6" stroke-linecap="round"/>',
      say: ["Knitted it myself. Purl, purl, pearly white.", "Warm sweater, cold water, clean teeth.", "Is it loud? Good. So is my smile."]
    },
    "elf-suit": {
      note: "A pointed hat with a bell on the end, pointy ears, a jagged collar hung with bells",
      back: flip(p("M52 62 C38 60 26 50 18 36 C18 58 30 78 52 86 Z", "#FBF7EE") + '<path d="M46 72 C38 68 31 60 26 51" fill="none" stroke="#F2B8A8" stroke-width="2.6" stroke-linecap="round"/>'),
      face: flip(p("M38 102.4 L44.4 100 L49.4 123 L43 125.6 Z", GRN, O2) + '<path d="M40.4 107 l6 -2.4 M42.6 117 l6 -2.4" stroke="#FFFFFF" stroke-width="2"/>') +
        p("M60 128 Q100 148 140 128 L136 141 L126 136 L117 147 L108.5 140 L100 151 L91.5 140 L83 147 L74 136 L64 141 Z", RED, O3) +
        [[117, 148.6], [100, 152.6], [83, 148.6]].map(function(q){ return '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="3.6" fill="' + GOLD + '" ' + O2 + '/><path d="M' + (q[0] - 1.6) + " " + (q[1] + .8) + ' h3.2" stroke="' + INK + '" stroke-width="1.2"/>'; }).join(""),
      top: p("M58 42 C56 16 76 -10 104 -18 C126 -24 148 -20 162 -4 C150 -8 138 -6 129 3 C138 14 142 28 142 42 Q100 52 58 42 Z", GRN) +
        '<path d="M129 3 C122 8 116 16 114 26" fill="none" stroke="#1F6B43" stroke-width="2.6" stroke-linecap="round"/><path d="M68 30 Q74 8 96 -6" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".45"/>' +
        p("M54 34 Q100 22 146 34 L148 47 L139 43 L131 52 L122 46 L113 55 L100 48 L87 55 L78 46 L69 52 L61 43 L52 47 Z", RED, O3) +
        '<circle cx="165" cy="0" r="6.4" fill="' + GOLD + '" ' + O3 + '/><path d="M161.6 1.6 h6.8 M165 1.6 v3.6" stroke="' + INK + '" stroke-width="1.6" stroke-linecap="round"/>',
      say: ["Elf Timmy, reporting to the workshop!", "Workshop rule one: brush before bed.", "Small helper. Big smile."]
    },
    "nutcracker": {
      note: "A tall black hat with gold braid, white hair, a curled mustache and a red jacket with gold frogging",
      back: flip(p("M52 54 C38 54 32 66 36 80 C31 90 38 101 50 98 Z", "#FFFFFF", O3) + '<path d="M42 66 q-2 8 1 14 M46 84 q-2 5 0 9" fill="none" stroke="#C9D1D9" stroke-width="1.8" stroke-linecap="round"/>'),
      face: sleeve(RED, "#2B2230") + p(torso([108, 136]), RED) + p("M46 108 Q100 136 154 108 L152.6 114 Q100 142 47.4 114 Z", GOLD, O2) +
        '<path d="M100 127 V155 M87 133 H113 M89 141.4 H111 M92 149.6 H108" fill="none" stroke="' + INK + '" stroke-width="5.4" stroke-linecap="round"/><path d="M100 127 V155 M87 133 H113 M89 141.4 H111 M92 149.6 H108" fill="none" stroke="' + GOLD + '" stroke-width="2.8" stroke-linecap="round"/>' +
        flip(p("M36 99 Q46 87 61 95 L59 105 Q47 99 39 108 Z", GOLD, O3) + '<path d="M41 106 v6 M47 103 v6 M53 102.6 v6" stroke="#C9971C" stroke-width="2.4" stroke-linecap="round"/>') +
        '<path d="M100 97.6 C95 92.6 87 93.4 84 98.4 C81 102.6 76 101 76 96.6 M100 97.6 C105 92.6 113 93.4 116 98.4 C119 102.6 124 101 124 96.6" fill="none" stroke="#2B2230" stroke-width="4" stroke-linecap="round"/>',
      top: p("M64 42 L59 -14 Q100 -24 141 -14 L136 42 Q100 52 64 42 Z", "#2B2230") + p("M59 -14 Q100 -24 141 -14 L140.2 -4 Q100 -14 59.8 -4 Z", GOLD, O2) +
        p("M62.6 28 Q100 19 137.4 28 L136 42 Q100 52 64 42 Z", GOLD, O3) + '<path d="M68 38 l6 -6 l6 7 l6 -8 l7 8 l7 -9 l7 9 l7 -8 l6 8 l6 -7 l6 6" fill="none" stroke="' + RED + '" stroke-width="2.4" stroke-linejoin="round"/>' +
        T.tinyTooth(100, 8, 1.7, "#FFFFFF") + '<path d="M70 22 L68 -2" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".3"/>',
      say: ["Nutcracker Timmy, standing guard!", "Never crack nuts with your teeth. That's my job.", "Chins up, brushes out, forward march!"]
    }
  };

  return { k: "winter", homes: homes, scenes: scenes, yard: yard, outfits: outfits };
}
