/* The rank sets of Timmy's place (tools/figures/site/sets.mjs, RANKS): an outfit and a yard piece for each full rank-up
   of the Handpiece, in that rank's material (MATS in place.mjs): Antique brass, Bronze, Silver, Gold, Diamond, Dark
   Matter. Earned by rank, never sold, so each is drawn as a prize and they get grander up the ladder. No home, no scene.
   One self-contained function: nothing from outside it but T (see packs/thanksgiving.mjs for what each kind needs).

   The treadle dental engine is drawn from what the sources say one looked like, not from anyone's picture:
   - J. B. Morrison's US patent 111,667 (February 1871, "Improvement in dental engines"): a treadle linked by a rod to a
     crank on the driving wheel, the joint letting the treadle work at an angle to the wheel.
   - Museum catalog descriptions of surviving engines (Victorian Collections; the Leeds dental histories "treadle
     drill"; UNMC's "Dental Drill, 1871"): a three-footed cast-iron base with one foot longer than the others carrying
     the pedal, a wide-rimmed metal driving wheel, an upright pole, a belt up to a pulley at its top, and an arm with a
     flexible shaft ending in the handpiece; cast iron with steel and brass parts.
   Proportions are schematic.
   Never sugar (Timmy is a tooth). No ids, gradients, filters, text, images or emoji: flat fills and ink outlines. */
export function pack(T){
  var K = T.K, P = T.P, D = T.D, f = T.f, F = T.F, O = T.O, L = T.L, FO = T.FO, G = T.G, circ = T.circ, ell = T.ell, box = T.box, cyl = T.cyl, INK = T.INK;
  var p = T.p, O2 = T.O2, O3 = T.O3, O4 = T.O4;
  /* the six materials, as MATS has them */
  var BR = { c: "#B5874E", s: "#83592C", h: "#DDBB8A", pat: "#7FA38A" }, BZ = { c: "#D08A4E", s: "#9C5C28", h: "#F0B98A" }, SV = { c: "#DCE2E8", s: "#9FAAB6", h: "#FFFFFF" };
  var GD = { c: K.gold, s: K.goldShade, h: K.goldLight }, DI = { c: K.diamond, s: K.diamondLine, h: "#FFFFFF" }, DM = { c: "#4A2A8C", s: K.dmDeep, h: K.dmLight, v: K.dm, teal: K.dmTeal };
  var IRON = ["#6A6474", "#4E4858"], WHITE = "#FFFFFF";
  function shadow(x, y, rx, ry){ return ell.apply(null, P(x, y, 0).concat([rx, ry, "#1B2A3A", 0, .1])); }
  /* a rod between two screen points: ink under, color on top */
  function rod(a, b, w, c){ return L(T.seg(a, b), w + 1.8) + L(T.seg(a, b), w, c); }
  function tube(d, w, c){ return L(d, w + 1.8) + L(d, w, c); }
  /* a still four-point star (the kit's dmStar twinkles; this one is for outfits, which have no motion of their own) */
  function star4(x, y, r, fill, op){
    var d = "M" + f(x) + " " + f(y - r) + " Q" + f(x + r * .18) + " " + f(y - r * .18) + " " + f(x + r) + " " + f(y) + " Q" + f(x + r * .18) + " " + f(y + r * .18) + " " + f(x) + " " + f(y + r) +
      " Q" + f(x - r * .18) + " " + f(y + r * .18) + " " + f(x - r) + " " + f(y) + " Q" + f(x - r * .18) + " " + f(y - r * .18) + " " + f(x) + " " + f(y - r) + " Z";
    return F(d, fill, op);
  }
  /* a molar, k times the kit's tinyTooth, with a shade side and a shine: (x, y) is its middle */
  function molar(x, y, k, m, sw){
    var q = function(a, b){ return f(x + a * k) + " " + f(y + b * k); };
    var d = "M" + q(-4, -3.1) + " C" + q(-4, -5.7) + " " + q(-1.3, -6) + " " + q(0, -4.7) + " C" + q(1.3, -6) + " " + q(4, -5.7) + " " + q(4, -3.1) + " C" + q(4, -.5) + " " + q(3, .7) + " " + q(2.75, 3.7) +
      " C" + q(2.6, 5.1) + " " + q(1.2, 5.1) + " " + q(1.05, 3.7) + " L" + q(.8, 2) + " C" + q(.6, 1.2) + " " + q(-.6, 1.2) + " " + q(-.8, 2) + " L" + q(-1.05, 3.7) + " C" + q(-1.2, 5.1) + " " + q(-2.6, 5.1) + " " + q(-2.75, 3.7) +
      " C" + q(-3, .7) + " " + q(-4, -.5) + " " + q(-4, -3.1) + " Z";
    var sh = "M" + q(2.3, -5.25) + " C" + q(4.4, -5.2) + " " + q(4.1, -1) + " " + q(3.3, .4) + " C" + q(3, 1.6) + " " + q(2.9, 2.8) + " " + q(2.75, 3.7) + " C" + q(2.6, 5.1) + " " + q(1.2, 5.1) + " " + q(1.05, 3.7) +
      " L" + q(.9, 2.4) + " C" + q(2.4, 0) + " " + q(2.9, -3) + " " + q(2.3, -5.25) + " Z";
    return F(d, m.c) + F(sh, m.s) + O(d, sw || 1.8) + L("M" + q(-2.9, -3.4) + " Q" + q(-3.1, -1.4) + " " + q(-2.4, .4), 1.8, WHITE, .8) + L("M" + q(-2.3, -4.6) + " L" + q(-1.8, -4.9), 1.8, WHITE, .8);
  }
  /* a crystal shard in screen space: base at (x, y), its tip len away at angle a (degrees; -90 is straight up), w wide */
  function shard(x, y, a, len, w, c){
    c = c || [DI.c, DI.s];
    var r = a * Math.PI / 180, ux = Math.cos(r), uy = Math.sin(r), nx = -uy, ny = ux, k = .62;
    var tip = [x + ux * len, y + uy * len], l = [x + ux * len * k + nx * w / 2, y + uy * len * k + ny * w / 2], rr = [x + ux * len * k - nx * w / 2, y + uy * len * k - ny * w / 2];
    var bl = [x + nx * w * .36, y + ny * w * .36], br = [x - nx * w * .36, y - ny * w * .36], mid = [x + ux * len * k, y + uy * len * k];
    return F(T.D2([bl, l, tip, rr, br]), c[0]) + F(T.D2([[x, y], mid, tip, l, bl]), c[1]) + L(T.D2([[x, y], mid, tip], true), .7, WHITE, .9) + O(T.D2([bl, l, tip, rr, br]), 1.1);
  }
  function confetti(x, y, list){ var s = ""; list.forEach(function(q){ s += '<path d="M' + f(x + q[0]) + " " + f(y + q[1]) + ' l2.6 1 -1 2.6 -2.6 -1 z" fill="' + q[2] + '"/>'; }); return s; }

  /* ------------------------------------------------------------------ the yard -------------------------------------- */
  var yard = {
    /* Antique: the foot-pedal drill of the 1870s */
    "rank-antique-yard": {
      note: "The foot-pedal drill of the 1870s: a cast-iron stand, a brass flywheel and a belt up to the handpiece", spot: [3.4, 3.45],
      egg: { n: "The treadle engine", does: "the flywheel whirs", say: "Antique rank, earned! In 1871 a dentist ran the drill by pedaling. Keep pedaling." }, anim: "tp-pop 2.2s",
      draw: function(o){
        var s = shadow(1.8, 2.0, 27, 10), cx = 1.7, yc = 1.3, yw = 1.62, zc = 1.48, r = 1.06, i, a;
        var hub = P(cx, yc, .34);
        /* the three-footed base: the long foot comes forward and carries the pedal */
        [[.5, .95], [2.95, .8], [1.85, 3.25]].forEach(function(q){ var e = P(q[0], q[1], 0); s += rod(hub, e, 2.6, IRON[0]) + ell(e[0], e[1], 2.6, 1.4, IRON[1], 1); });
        /* the upright pole, with a brass collar */
        var top = P(cx, yc, 4.2), col = P(cx, yc, 3.05);
        s += rod(hub, top, 2.4, IRON[0]) + ell(col[0], col[1], 3, 1.7, BR.c, 1);
        /* the driving wheel: spokes, a wide brass rim (a little verdigris on it), the hub and its crank */
        var pts = [], C = P(cx, yw, zc), ring = function(a0, a1, n, rr){ var out = []; for (var j = 0; j <= n; j++){ var t = (a0 + (a1 - a0) * j / n) * Math.PI / 180; out.push([cx + Math.cos(t) * rr, yw, zc + Math.sin(t) * rr]); } return out; };
        for (i = 0; i < 6; i++){ a = (i * 60 + 12) * Math.PI / 180; s += L(D([[cx, yw, zc], [cx + Math.cos(a) * r * .92, yw, zc + Math.sin(a) * r * .92]], true), 1.5); }
        pts = ring(0, 360, 28, r); pts.pop();
        s += L(D(pts), 5.4) + L(D(pts), 3, BR.c) + L(D(ring(214, 238, 4, r), true), 3, BR.pat, .8) + L(D(ring(100, 165, 8, r + .04), true), 1, BR.h);
        var pin = P(cx + .32, yw, zc - .26);
        s += circ(C[0], C[1], 3, BR.c, 1.2) + rod(C, pin, 1.2, IRON[0]) + circ(pin[0], pin[1], 1.3, BR.h, .8);
        /* the belt, from the rim up to the pulley at the top of the pole */
        var pl = P(cx, yc + .1, 4.2), bl = P(cx - r * .97, yw, zc + .28), br = P(cx + r * .97, yw, zc + .28);
        s += L("M" + f(bl[0]) + " " + f(bl[1]) + " L" + f(pl[0] - 2.4) + " " + f(pl[1]) + " M" + f(br[0]) + " " + f(br[1]) + " L" + f(pl[0] + 2.4) + " " + f(pl[1]), 1.3, "#6B4128");
        /* the arm, the flexible shaft hanging from it and the handpiece */
        var arm = P(3.0, yc + .1, 4.62);
        s += rod(pl, arm, 1.8, IRON[0]) + circ(pl[0], pl[1], 3.1, BR.c, 1.2) + circ(pl[0], pl[1], 1, IRON[1]) + circ(arm[0], arm[1], 2, BR.c, 1);
        s += tube("M" + f(arm[0]) + " " + f(arm[1]) + " q7 6 2.4 15", 1, "#5A4D5C");
        var h0 = [arm[0] + 2.4, arm[1] + 15], h1 = [arm[0] - 1.6, arm[1] + 26.6], h2 = [h1[0] - 1.5, h1[1] + 4.4];
        s += L(T.seg(h2, [h2[0] - .9, h2[1] + 2.8]), 1) + rod(h1, h2, 1.1, SV.c) + rod(h0, h1, 2.8, BR.c) + L(T.seg([h0[0] - 1, h0[1] + 2], [h0[0] - 2.6, h0[1] + 7]), .9, BR.h);
        /* the pedal on the long foot, hinged at the heel, and the rod from its toe up to the crank */
        var toe = P(1.8, 2.15, .58);
        s += FO(D([[1.42, 2.1, .6], [2.2, 2.1, .6], [2.2, 3.2, .1], [1.42, 3.2, .1]]), IRON[0], 1.4);
        for (i = 1; i < 5; i++) s += L(D([[1.42, 2.1 + i * .22, .6 - i * .1], [2.2, 2.1 + i * .22, .6 - i * .1]], true), .8, BR.h, .8);
        s += rod(toe, pin, 1.2, IRON[0]) + circ(toe[0], toe[1], 1.2, BR.c, .8);
        if (o.snow) s += ell(pl[0], pl[1] - 3, 3.4, 1.4, WHITE, 0);
        return s;
      },
      bits: function(){
        var C = P(1.7, 1.62, 1.48), a = P(3.0, 1.4, 4.62), x = a[0] - 4, y = a[1] + 35;
        return L("M" + f(C[0] - 15) + " " + f(C[1] - 12) + " q-4 8 -1 16 M" + f(C[0] + 15) + " " + f(C[1] + 10) + " q4 -8 1 -16 M" + f(C[0] - 4) + " " + f(C[1] - 18) + " q8 -3 14 2", 1.5, INK, .7) +
          L("M" + f(x - 4) + " " + f(y) + " l-3 2 M" + f(x) + " " + f(y + 2) + " v3.4 M" + f(x + 4) + " " + f(y) + " l3 2", 1.4, BR.s);
      }
    },
    /* Bronze: a bell on its wooden frame */
    "rank-bronze-yard": {
      note: "A bronze bell hung in a timber frame, a tooth cast on its side", spot: [3.4, 3.45],
      egg: { n: "The bronze bell", does: "it rings", say: "Ding! That's the Bronze rank. Bell bronze is copper and tin. Ring it, you earned it." }, anim: "tp-pop 2.2s",
      draw: function(o){
        var s = shadow(1.8, 1.95, 30, 10), wood = { top: K.woodLight, left: K.wood, right: K.woodShade }, yb = 1.6, o2 = { sw: 1.5, si: 1 };
        s += box(.25, 1.05, 0, .62, 1.5, .22, wood, o2) + box(.4, yb, .22, .32, .32, 3.2, wood, o2);
        /* the bell: its clapper and pull rope first, then the body with its shade and a cast tooth */
        var c = P(1.8, yb + .16, 3.42), cx = c[0], y0 = c[1] + 4;
        s += L("M" + f(cx - 2.6) + " " + f(c[1]) + " v5 M" + f(cx + 2.6) + " " + f(c[1]) + " v5", 1.6) + tube("M" + f(cx) + " " + f(y0 + 28) + " q2.4 6 0 11", .9, "#D9C49A") + circ(cx, y0 + 40, 1.5, "#D9C49A", .9) +
          L("M" + f(cx) + " " + f(y0 + 20) + " v6", 1.8) + circ(cx, y0 + 27, 2.7, BZ.s, 1.2);
        var body = "M" + f(cx - 5) + " " + f(y0 + 3) + " q0 -4 5 -4 q5 0 5 4 q.5 8 4 12 q3 3.4 5 5 l0 2.4 q-14 4.4 -28 0 l0 -2.4 q2 -1.6 5 -5 q3.5 -4 4 -12 z";
        s += F(body, BZ.c) + F("M" + f(cx + 1) + " " + f(y0 - .8) + " q4 .2 4 3.8 q.5 8 4 12 q3 3.4 5 5 l0 2.4 q-5 1.6 -10 2.4 q3.4 -12 -3 -25.6 z", BZ.s) + O(body, 1.8) +
          L("M" + f(cx - 14) + " " + f(y0 + 20) + " q14 4.4 28 0", 1.1) + L("M" + f(cx - 4.2) + " " + f(y0 + 4.4) + " q-.6 6 -3.8 10", 1.6, WHITE, .65) + T.tinyTooth(cx - .6, y0 + 12.4, .72, BZ.h);
        s += box(2.9, yb, .22, .32, .32, 3.2, wood, o2) + box(2.75, 1.05, 0, .62, 1.5, .22, wood, o2);
        /* the beam across the top and the braces under it */
        [[.72, 1.36], [2.9, 2.26]].forEach(function(q){ s += rod(P(q[0], yb + .32, 2.62), P(q[1], yb + .32, 3.42), 1.6, K.wood); });
        s += box(.1, yb - .06, 3.42, 3.42, .44, .3, wood, o2);
        if (o.snow) s += ell.apply(null, P(1.8, yb + .16, 3.76).concat([15, 3, WHITE, 0]));
        return s;
      },
      bits: function(){
        var c = P(1.8, 1.76, 3.42), x = c[0], y = c[1] + 10;
        return L("M" + f(x - 19) + " " + f(y) + " q-5 7 0 14 M" + f(x - 25) + " " + f(y - 3) + " q-8 10 0 20 M" + f(x + 19) + " " + f(y) + " q5 7 0 14 M" + f(x + 25) + " " + f(y - 3) + " q8 10 0 20", 1.6, BZ.s);
      }
    },
    /* Silver: a trophy cup */
    "rank-silver-yard": {
      note: "A two-handled silver cup on a wooden plinth, a tooth engraved on it", spot: [3.4, 3.45],
      egg: { n: "The silver cup", does: "confetti pops out", say: "Silver rank! This cup is yours. Silver fights germs too: silver diamine fluoride stops a cavity in its tracks." }, anim: "tp-sparks 2s ease-out",
      draw: function(o){
        var s = shadow(1.8, 1.95, 28, 10), o2 = { sw: 1.5, si: 1 };
        s += box(.75, .75, 0, 2.1, 2.1, .32, { top: K.stone, left: K.stone, right: K.stoneShade }, o2) + box(1.0, 1.0, .32, 1.6, 1.6, .75, { top: "#A26E48", left: "#8A5A3A", right: "#6B4128" }, o2);
        s += FO(D(T.onY(2.6, T.rectUV(1.3, 2.3, .5, .9))), SV.c, 1) + L(D(T.onY(2.6, [[1.48, .76], [2.12, .76]]), true) + D(T.onY(2.6, [[1.6, .63], [2.0, .63]]), true), .8, SV.s);
        s += cyl(1.8, 1.8, 1.07, .66, 1.24, .5, SV.c, SV.s, SV.h, o2) + cyl(1.8, 1.8, 1.24, .17, 1.8, .17, SV.c, SV.s, null, { open: true, sw: 1.4 });
        var kn = P(1.8, 1.8, 1.52), b = P(1.8, 1.8, 1.78), bx = b[0], ry = b[1] - 22;
        s += ell(kn[0], kn[1], 4.2, 2.6, SV.c, 1.2);
        var hl = "M" + f(bx - 12.6) + " " + f(ry + 3) + " q-10.4 -1 -9.6 6.6 q.6 6.6 9 7.2", hr = "M" + f(bx + 12.6) + " " + f(ry + 3) + " q10.4 -1 9.6 6.6 q-.6 6.6 -9 7.2";
        s += tube(hl, 2.2, SV.c) + tube(hr, 2.2, SV.s);
        var bowl = "M" + f(bx - 13.6) + " " + f(ry) + " q-.6 16 9.6 20.6 q4 1.6 8 0 q10.2 -4.6 9.6 -20.6 z";
        s += F(bowl, SV.c) + F("M" + f(bx + 5.6) + " " + f(ry) + " q.4 14 -5 21.6 q1.8 .2 3.4 -1 q10.2 -4.6 9.6 -20.6 z", SV.s) + O(bowl, 1.8) + ell(bx, ry, 13.6, 4.4, "#AEB8C4", 1.5) + ell(bx - 1, ry + .9, 9.6, 2.5, "#8E98A3", 0) +
          L("M" + f(bx - 10.4) + " " + f(ry + 6) + " q.6 7.4 4.6 11.4", 1.7, WHITE, .9) + T.tinyTooth(bx - .4, ry + 12.4, .86, WHITE);
        s += T.dmStar(bx + 12, ry - 6, 4, WHITE, "tp-twinkle", .4) + T.dmStar(bx - 15, ry + 1, 2.6, WHITE, "tp-twinkle", 1.5);
        if (o.snow) s += ell(bx, ry + .4, 9, 2.4, WHITE, 0);
        return s;
      },
      bits: function(){ var b = P(1.8, 1.8, 1.78); return confetti(b[0], b[1] - 26, [[-10, -8, K.red], [-3, -16, "#F2C230"], [5, -10, "#5E8A3A"], [11, -18, "#3FA7E0"], [-14, -20, "#B08CFF"], [1, -4, "#F28C28"], [15, -6, "#F78FA8"]]); }
    },
    /* Gold: a golden tooth on a marble plinth */
    "rank-gold-yard": {
      note: "A golden molar, polished bright, on a marble plinth with a gold plaque", spot: [3.4, 3.45],
      egg: { n: "The golden tooth", does: "it gleams", say: "Gold rank! A gold crown can last for decades. So will what you learned to get here." }, anim: "tp-sparks 2s ease-out",
      draw: function(o){
        var s = shadow(1.8, 1.95, 30, 11), o2 = { sw: 1.5, si: 1 }, mar = { top: "#FFFDF6", left: "#FFFDF6", right: "#E3DCCB" };
        s += box(.6, .6, 0, 2.4, 2.4, .3, { top: K.stone, left: K.stone, right: K.stoneShade }, o2) + box(.9, .9, .3, 1.8, 1.8, .85, mar, o2);
        s += L(D(T.onX(2.7, [[1.3, .5], [1.7, .9]]), true) + D(T.onX(2.7, [[1.9, .45], [2.4, 1.0]]), true), .8, "#B9AF9C", .8);
        s += FO(D(T.onY(2.7, T.rectUV(1.25, 2.35, .5, .98))), GD.c, 1) + L(D(T.onY(2.7, [[1.45, .82], [2.15, .82]]), true) + D(T.onY(2.7, [[1.58, .66], [2.02, .66]]), true), .8, GD.s);
        s += box(.78, .78, 1.15, 2.04, 2.04, .2, mar, o2);
        var t = P(1.8, 1.8, 1.35), k = 3.05;
        s += ell(t[0], t[1], 12, 4.4, "#1B2A3A", 0, .12) + molar(t[0], t[1] - 5.1 * k + .6, k, GD, 1.9);
        s += T.dmStar(t[0] - 13, t[1] - 31, 4.4, WHITE, "tp-twinkle", .2) + T.dmStar(t[0] + 14, t[1] - 16, 3, WHITE, "tp-twinkle", 1.3);
        if (o.snow) s += ell(t[0], t[1] - 32.6, 9, 2.2, WHITE, 0);
        return s;
      },
      bits: function(){ var t = P(1.8, 1.8, 1.35), x = t[0], y = t[1] - 18; return star4(x - 18, y + 4, 4.6, GD.h) + star4(x + 18, y - 12, 5.4, GD.h) + star4(x + 2, y - 26, 4, WHITE) + star4(x - 12, y - 20, 3, WHITE) + star4(x + 14, y + 8, 3, WHITE); }
    },
    /* Diamond: a geode split open */
    "rank-diamond-yard": {
      note: "A rock split in two, full of diamond-bright crystals that sparkle", spot: [3.4, 3.45],
      egg: { n: "The diamond geode", does: "the crystals flash", say: "Diamond rank! Diamond burs cut enamel, the hardest thing in your body. You're harder to stop." }, anim: "tp-sparks 2s ease-out",
      draw: function(o){
        var s = shadow(1.9, 1.95, 31, 11), g = P(1.55, 1.75, 0), x = g[0], y = g[1], rock = o.night ? ["#7E7690", "#5E5772"] : ["#9A9088", "#74695F"], deep = "#33407F";
        /* the standing half: a rough shell, a pale band, a blue band, and the hollow full of crystals */
        var shell = "M" + f(x - 21) + " " + f(y + 1) + " q-5.4 -15 1 -28 q6 -13 20 -14 q15 -.4 21.6 12 q6.4 13 1 30 q-22 7 -43.6 0 z";
        s += F(shell, rock[0]) + F("M" + f(x + 8) + " " + f(y - 40) + " q10 2 14.6 11 q6.4 13 1 30 q-9 3 -18 4.4 q11 -18 2.4 -45.4 z", rock[1]) + O(shell, 1.9) +
          L("M" + f(x - 19) + " " + f(y - 22) + " l3 2 M" + f(x - 21) + " " + f(y - 8) + " l3.4 -1 M" + f(x + 19.6) + " " + f(y - 14) + " l-3 1.4", 1.1, INK, .5);
        s += ell(x - 1, y - 19, 17.4, 16.8, "#F4FBFF", 1.3) + ell(x - 1, y - 19, 14.8, 14.2, DI.s, 0) + ell(x - 1, y - 18.6, 12.2, 11.6, deep, 1);
        [[-11, -14, -20, 8, 5], [9, -13, -160, 8, 5], [-9, -26, 35, 7, 4.4], [7, -27, 140, 7.4, 4.4], [-1, -29.4, 90, 6, 4]].forEach(function(q){ s += shard(x + q[0], y + q[1], q[2], q[3], q[4], [DI.s, "#5BB4D9"]); });
        [[-8.6, -9, -108, 11, 5.4], [5.4, -8.6, -70, 12, 5.6], [-1.6, -7.6, -90, 16, 6.6]].forEach(function(q){ s += shard(x + q[0], y + q[1], q[2], q[3], q[4]); });
        /* the other half, lying cut side up, and a few loose crystals */
        var h = P(3.05, 1.3, 0), hx = h[0], hy = h[1];
        var half = "M" + f(hx - 11.6) + " " + f(hy - 5) + " q-.6 6 4.6 7.6 q7 2 13.4 0 q5.4 -1.8 4.8 -7.6 z";
        s += F(half, rock[0]) + F("M" + f(hx + 3) + " " + f(hy - 5) + " q0 5 -2 8.6 q3 0 5.4 -.6 q5.4 -1.8 4.8 -7.6 z", rock[1]) + O(half, 1.6) + ell(hx - .2, hy - 5, 11.4, 4.6, "#F4FBFF", 1.3) + ell(hx - .2, hy - 5, 8.8, 3.3, DI.s, 0) + ell(hx - .2, hy - 4.8, 6.6, 2.3, deep, 0);
        [[-4.4, -4.6, -104, 8.6, 4.4], [4, -4.4, -74, 9.4, 4.6], [0, -3.6, -90, 12.6, 5.4]].forEach(function(q){ s += shard(hx + q[0], hy + q[1], q[2], q[3], q[4]); });
        var c1 = P(.6, 3.0, 0), c2 = P(2.4, 3.1, 0);
        s += shard(c1[0], c1[1], -70, 9, 4.6) + shard(c1[0] - 4, c1[1] + 1, -116, 6, 3.6) + shard(c2[0], c2[1], -98, 7, 4);
        s += T.dmStar(x - 9, y - 27, 3.2, WHITE, "tp-twinkle", .1) + T.dmStar(x + 8.4, y - 14, 2.6, WHITE, "tp-twinkle", 1.2) + T.dmStar(hx + 6, hy - 17, 3.4, WHITE, "tp-twinkle", 2) + T.dmStar(c1[0] + 2, c1[1] - 10, 2.6, WHITE, "tp-twinkle", .8);
        if (o.snow) s += ell(x - 2, y - 41, 9, 2.4, WHITE, 0);
        return s;
      },
      lights: function(){ var g = P(1.55, 1.75, 0), h = P(3.05, 1.3, 0); return circ(g[0] - 1, g[1] - 19, 22, DI.c, 0).replace("/>", ' opacity=".2"/>') + circ(g[0] - 1, g[1] - 19, 13, DI.c, 0).replace("/>", ' opacity=".22"/>') + circ(h[0], h[1] - 9, 10, DI.c, 0).replace("/>", ' opacity=".2"/>'); },
      bits: function(){ var g = P(1.55, 1.75, 0), x = g[0], y = g[1]; return star4(x - 14, y - 34, 5.4, WHITE) + star4(x + 12, y - 30, 4.4, DI.c) + star4(x - 1, y - 46, 4.6, WHITE) + star4(x + 24, y - 12, 4, WHITE) + star4(x - 24, y - 12, 3.4, DI.c); }
    },
    /* Dark Matter: an orb that floats over its stand and glows at night */
    "rank-dark-yard": {
      note: "A floating orb of deep violet, stars inside it and a teal ring around it, over a dark stone stand", spot: [3.4, 3.45],
      egg: { n: "The Dark Matter orb", does: "stars spin out of it", say: "Dark Matter: the top rank. Like plaque, you can't always see it. Unlike plaque, you earned it." }, anim: "tp-sparks 2.2s ease-out",
      draw: function(o){
        var s = shadow(1.8, 1.95, 28, 10), o2 = { sw: 1.5, si: 1 }, st = ["#5A4A86", "#3A2C62", "#6E5EA0"];
        s += cyl(1.8, 1.8, 0, 1.32, .3, 1.2, st[0], st[1], st[2], o2) + cyl(1.8, 1.8, .3, .86, .82, .7, st[0], st[1], st[2], o2);
        var tp = P(1.8, 1.8, .82), g0 = P(1.8, 1.8, 0);
        s += ell(tp[0], tp[1], 6, 3.4, DM.teal, .9) + ell(tp[0], tp[1], 3, 1.6, "#EFFFFA", 0);
        [[-10.4, -2.2], [-4, -.4], [3.4, -.6], [9.6, -2.6]].forEach(function(q){ s += L("M" + f(g0[0] + q[0]) + " " + f(g0[1] + q[1] + 6) + " v-2.6", 1.3, DM.teal); });
        var c1 = P(.55, 2.45, 0), c2 = P(3.0, 1.0, 0), c3 = P(2.55, 2.95, 0);
        s += T.crystal(c1[0], c1[1] - 1, 1.2) + T.crystal(c2[0], c2[1] - 1, 1) + T.crystal(c3[0], c3[1] - 1, .8, [DM.h, "#8F5BE8"]);
        /* the orb: its halo, the back of the ring, the globe with a swirl of stars, the front of the ring */
        var c = P(1.8, 1.8, 2.85), x = c[0], y = c[1], R = 13.4, orb = "";
        orb += circ(x, y, R + 6.4, DM.teal, 0).replace("/>", ' opacity=".2"/>') + circ(x, y, R + 3, DM.teal, 0).replace("/>", ' opacity=".28"/>');
        orb += L("M" + f(x - 19.6) + " " + f(y + 5.2) + " A20.4 6 -15 0 1 " + f(x + 19.6) + " " + f(y - 5.2), 1.8, DM.teal);
        orb += circ(x, y, R, DM.s, 2) + F("M" + f(x - 11) + " " + f(y + 4) + " q2 -13 15 -14.6 q-8.4 5 -8 13.6 q.4 7 7.4 9 q-11 1 -14.4 -8 z", DM.c) + F("M" + f(x + 2) + " " + f(y - 4) + " q7 -1.4 9.4 4.4 q-5 -2.4 -9 1 q-3.4 3.4 -.6 7.6 q-5.4 -2.6 -4.6 -7.6 q.6 -4.4 4.8 -5.4 z", DM.v, .85) +
          L("M" + f(x - 9.4) + " " + f(y - 5.4) + " q2.4 -4.6 7 -6.2", 1.7, WHITE, .6);
        [[-6, -1, .9], [5.6, -7, .8], [7.6, 5.6, .9], [-3, 8.6, .7], [0, -9.4, .6], [-8.6, 4.6, .6]].forEach(function(q){ orb += circ(x + q[0], y + q[1], q[2], WHITE, 0); });
        orb += T.dmStar(x + 3.4, y + 1.6, 3.6, WHITE, "tp-twinkle", .2) + T.dmStar(x - 4.6, y - 5, 2.4, DM.teal, "tp-twinkle", 1.4);
        orb += L("M" + f(x - 19.6) + " " + f(y + 5.2) + " A20.4 6 -15 0 0 " + f(x + 19.6) + " " + f(y - 5.2), 1.8, DM.teal) + circ(x + 12.6, y + 4.2, 2, DM.h, .9);
        s += G("tp-float", orb);
        s += T.dmStar(tp[0] - 9, tp[1] - 9, 2.6, DM.teal, "tp-twinkle", .6) + T.dmStar(tp[0] + 10, tp[1] - 6, 2.2, DM.h, "tp-twinkle", 1.8) + T.dmStar(x + 20, y - 15, 2.6, WHITE, "tp-twinkle", 2.4);
        if (o.snow) s += ell(x - 1, y - R + 1.4, 7, 2, WHITE, 0);
        return s;
      },
      lights: function(){
        var c = P(1.8, 1.8, 2.85), tp = P(1.8, 1.8, .82), g = function(x, y, r, op){ return circ(x, y, r, K.dmTeal, 0).replace("/>", ' opacity="' + op + '"/>'); };
        return g(c[0], c[1], 31, ".14") + g(c[0], c[1], 22, ".12") + g(tp[0], tp[1], 11, ".28");
      },
      bits: function(){ var c = P(1.8, 1.8, 2.85), x = c[0], y = c[1]; return star4(x - 22, y - 8, 4.6, DM.teal) + star4(x + 22, y - 14, 5, WHITE) + star4(x - 10, y - 24, 4, DM.h) + star4(x + 8, y - 26, 3.4, DM.teal) + star4(x + 26, y + 8, 3.4, DM.h) + star4(x - 26, y + 10, 3, WHITE); }
    }
  };

  /* ------------------------------------------------------------------ the outfits ----------------------------------- */
  var thin = O2.replace("2.2", "1.4"), EO = ' fill-rule="evenodd"';
  function hi(d, w, op){ return '<path d="' + d + '" fill="none" stroke="#FFFFFF" stroke-width="' + (w || 3) + '" stroke-linecap="round" opacity="' + (op || .6) + '"/>'; }
  function line(d, c, w){ return '<path d="' + d + '" fill="none" stroke="' + c + '" stroke-width="' + (w || 2) + '" stroke-linecap="round" stroke-linejoin="round"/>'; }
  function mirror(s){ return s + '<g transform="translate(200 0) scale(-1 1)">' + s + "</g>"; }
  /* a pointed leaf at (x, y), turned a degrees */
  function leaf(x, y, a, k, fill, vein){ return '<g transform="translate(' + f(x) + " " + f(y) + ") rotate(" + f(a) + ") scale(" + (k || 1) + ')">' + p("M-10 0 Q0 -7 10 0 Q0 7 -10 0 Z", fill, O2) + '<path d="M-6 0 H6" stroke="' + vein + '" stroke-width="1.4" stroke-linecap="round"/></g>'; }
  /* a gem (a kite with a table facet) at (x, y), w wide and h tall */
  function gem(x, y, w, h, c){ return p("M" + f(x) + " " + f(y - h * .45) + " L" + f(x + w / 2) + " " + f(y - h * .12) + " L" + f(x) + " " + f(y + h * .55) + " L" + f(x - w / 2) + " " + f(y - h * .12) + " Z", c[0], O2) +
    '<path d="M' + f(x) + " " + f(y - h * .45) + " L" + f(x + w / 2) + " " + f(y - h * .12) + " L" + f(x) + " " + f(y + h * .55) + ' Z" fill="' + c[1] + '"/>' + line("M" + f(x - w / 2) + " " + f(y - h * .12) + " H" + f(x + w / 2), INK, 1.2) + p("M" + f(x) + " " + f(y - h * .45) + " L" + f(x + w / 2) + " " + f(y - h * .12) + " L" + f(x) + " " + f(y + h * .55) + " L" + f(x - w / 2) + " " + f(y - h * .12) + " Z", "none", O2); }
  /* an ice shard for the tiara and collar: base (x, y) and tip (tx, ty), w wide at the base */
  function ice(x, y, tx, ty, w){ var a = "M" + f(x - w / 2) + " " + f(y) + " L" + f(tx) + " " + f(ty) + " L" + f(x + w / 2) + " " + f(y) + " Z"; return p(a, DI.c, O3) + '<path d="M' + f(x) + " " + f(y) + " L" + f(tx) + " " + f(ty) + " L" + f(x + w / 2) + " " + f(y) + ' Z" fill="' + DI.s + '"/>' + p(a, "none", O3); }
  var gear = (function(){ var s = "", i, a, x = 124, y = 37; for (i = 0; i < 8; i++){ a = i / 8 * Math.PI * 2; s += line("M" + f(x + Math.cos(a) * 5) + " " + f(y + Math.sin(a) * 5) + " L" + f(x + Math.cos(a) * 9) + " " + f(y + Math.sin(a) * 9), INK, 5.4) + line("M" + f(x + Math.cos(a) * 5) + " " + f(y + Math.sin(a) * 5) + " L" + f(x + Math.cos(a) * 9) + " " + f(y + Math.sin(a) * 9), BR.h, 2.6); } return s + '<circle cx="' + x + '" cy="' + y + '" r="6.4" fill="' + BR.h + '" ' + O2 + '/><circle cx="' + x + '" cy="' + y + '" r="2.2" fill="' + BR.s + '" ' + thin + "/>"; })();
  var chain = (function(){ var s = "", i, t, x, y; for (i = 0; i < 9; i++){ t = i / 8; x = (1 - t) * (1 - t) * 132 + 2 * t * (1 - t) * 158 + t * t * 150; y = (1 - t) * (1 - t) * 92 + 2 * t * (1 - t) * 100 + t * t * 124; s += '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="2.3" fill="' + BR.h + '" ' + thin + "/>"; } return s; })();
  var crest = (function(){ var s = "", i, a; for (i = 0; i < 9; i++){ a = (-160 + i * 17.5) * Math.PI / 180; s += line("M" + f(100 + Math.cos(a) * 26) + " " + f(26 + Math.sin(a) * 22) + " L" + f(100 + Math.cos(a) * 42) + " " + f(26 + Math.sin(a) * 46), "#B5382E", 2.2); } return s; })();
  var wreath = (function(){
    var s = "", i, t, x, y;
    for (i = 0; i < 6; i++){ t = i / 5; x = 44 + 44 * t; y = 64 - 20 * t - 9 * Math.sin(Math.PI * t); s += leaf(x - 1, y - 6, -62 + 24 * t, 1, i % 2 ? GD.c : GD.h, GD.s) + leaf(x + 5, y + 3, -12 + 18 * t, .92, GD.c, GD.s); }
    return mirror(s) + '<circle cx="100" cy="42" r="5" fill="' + GD.h + '" ' + O2 + "/>";
  })();
  var capeIce = (function(){
    var half = [[100, 40], [52, 44], [26, 34], [32, 62], [12, 100], [2, 142], [-8, 190], [10, 174], [8, 216], [24, 196], [32, 228], [46, 206], [100, 214]];
    var all = half.concat(half.slice(0, -1).reverse().slice(0, -1).map(function(q){ return [200 - q[0], q[1]]; }));
    var d = "M" + all.map(function(q){ return q[0] + " " + q[1]; }).join(" L") + " Z";
    var facets = '<path d="M32 62 L12 100 L34 110 Z M2 142 L10 174 L26 150 Z" fill="#FFFFFF" opacity=".75"/><path d="M26 34 L32 62 L52 44 Z M2 142 L-8 190 L10 174 Z M8 216 L24 196 L10 174 Z M32 228 L46 206 L24 196 Z M12 100 L2 142 L26 150 L34 110 Z" fill="' + DI.s + '" opacity=".6"/>' +
      line("M32 62 L34 110 L26 150 L24 196 M12 100 L34 110 M2 142 L26 150 M10 174 L24 196 L46 206", "#5BB4D9", 1.6);
    return p(d, DI.c, O3) + mirror(facets) + p(d, "none", O3) + star4(14, 124, 6, WHITE) + star4(188, 150, 5, WHITE) + star4(180, 96, 4, WHITE);
  })();
  var lens = function(cx){ var q = function(a, b){ return f(cx + a) + " " + f(84 + b); }, hex = "M" + q(-17, -4) + " L" + q(-9, -13) + " L" + q(9, -13) + " L" + q(17, -4) + " L" + q(11, 11) + " L" + q(-11, 11) + " Z", tab = "M" + q(-9, -3) + " L" + q(-5, -8) + " L" + q(5, -8) + " L" + q(9, -3) + " L" + q(6, 5) + " L" + q(-6, 5) + " Z";
    return '<path d="' + hex + '" fill="' + DI.s + '" fill-opacity=".5" ' + O3 + "/>" + line(tab + " M" + q(-17, -4) + " L" + q(-9, -3) + " M" + q(-9, -13) + " L" + q(-5, -8) + " M" + q(9, -13) + " L" + q(5, -8) + " M" + q(17, -4) + " L" + q(9, -3) + " M" + q(11, 11) + " L" + q(6, 5) + " M" + q(-11, 11) + " L" + q(-6, 5), "#FFFFFF", 1.3).replace("/>", ' opacity=".85"/>') + star4(cx - 10, 74, 4, WHITE); };
  var cloakStars = function(list){ var s = ""; list.forEach(function(q){ s += star4(q[0], q[1], q[2], q[3] || WHITE); }); return s; };
  var HOOD = "M100 -10 C142 -8 174 34 171 94 C170 112 165 124 158 132 L42 132 C35 124 30 112 29 94 C26 34 58 -8 100 -10 Z";
  var hole = function(g){ return "M100 " + (46 - g) + " C" + (130 + g) + " " + (46 - g) + " " + (147 + g) + " " + (62 - g * .4) + " " + (147 + g) + " 86 C" + (147 + g) + " " + (108 + g * .5) + " " + (128 + g) + " " + (121 + g * .6) + " 100 " + (121 + g * .6) + " C" + (72 - g) + " " + (121 + g * .6) + " " + (53 - g) + " " + (108 + g * .5) + " " + (53 - g) + " 86 C" + (53 - g) + " " + (62 - g * .4) + " " + (70 - g) + " " + (46 - g) + " 100 " + (46 - g) + " Z"; };

  var outfits = {
    "rank-antique-outfit": {
      note: "A bowler with a brass band and gear, and a brass monocle on its chain",
      face: '<circle cx="120" cy="85" r="13.4" fill="#FFFFFF" fill-opacity=".28" stroke="' + INK + '" stroke-width="6.4"/><circle cx="120" cy="85" r="13.4" fill="none" stroke="' + BR.c + '" stroke-width="3.2"/>' +
        '<path d="M110 80 Q113 75 118 74" fill="none" stroke="' + BR.h + '" stroke-width="1.6" stroke-linecap="round"/>' + hi("M124 78 l5 5", 2.4, .9) + chain + '<circle cx="150" cy="124" r="3.6" fill="' + BR.c + '" ' + thin + "/>",
      top: '<ellipse cx="100" cy="42" rx="63" ry="11.4" fill="#4E3A2C" ' + O4 + "/>" + p("M38 40 Q34 34 40 32 M162 40 Q166 34 160 32", "none", O3) +
        p("M64 42 C58 12 76 -6 100 -6 C124 -6 142 12 136 42 Q100 52 64 42 Z", "#6B4A32") + '<path d="M118 -2 C132 6 138 22 136 40 Q128 44 120 45 C124 28 124 12 118 -2 Z" fill="#553A26"/>' +
        p("M64.6 31 Q100 41 135.4 31 L136 42 Q100 52 64 42 Z", BR.c, O3) + line("M70 36.4 Q100 45 112 43.4", BR.h, 1.8) + gear + hi("M72 22 Q76 8 90 1", 3, .35) + line("M40 46 Q100 62 160 46", "#3A2A20", 2.2),
      say: ["A monocle! Now I can inspect one molar very closely.", "Antique rank. A tip of the bowler to you.", "Brass never goes out of style. Neither does flossing."]
    },
    "rank-bronze-outfit": {
      note: "A bronze helmet with a red crest, a wide brow and cheek guards",
      top: p("M58 34 C54 -6 78 -26 100 -26 C122 -26 146 -6 142 34 Q100 10 58 34 Z", "#D9483B") + crest + p("M62 32 Q100 4 138 32 L134 40 Q100 16 66 40 Z", BZ.s, O3) +
        p("M42 72 C34 34 62 12 100 12 C138 12 166 34 158 72 Q100 54 42 72 Z", BZ.c) + '<path d="M128 18 C150 28 162 48 158 72 Q150 68 141 65 C144 46 140 30 128 18 Z" fill="' + BZ.s + '"/>' + line("M100 12 V58", BZ.s, 2.4) +
        p("M44 74 L59 70 Q61 92 57 104 Q53 114 45 117 Q38 100 40 80 Z", BZ.c, O3) + p("M156 74 L141 70 Q139 92 143 104 Q147 114 155 117 Q162 100 160 80 Z", BZ.s, O3) +
        p("M38 66 Q100 46 162 66 L164 77 Q100 58 36 77 Z", BZ.h, O3) + '<circle cx="52" cy="70" r="2.4" fill="' + BZ.s + '" ' + thin + '/><circle cx="76" cy="64" r="2.4" fill="' + BZ.s + '" ' + thin + '/><circle cx="100" cy="62" r="2.4" fill="' + BZ.s + '" ' + thin + '/><circle cx="124" cy="64" r="2.4" fill="' + BZ.s + '" ' + thin + '/><circle cx="148" cy="70" r="2.4" fill="' + BZ.s + '" ' + thin + "/>" +
        hi("M54 46 Q62 28 80 20", 3.4, .5) + '<circle cx="49" cy="92" r="2" fill="' + BZ.h + '" ' + thin + '/><circle cx="151" cy="92" r="2" fill="' + BZ.c + '" ' + thin + "/>",
      say: ["Bronze rank! Are you not entertained? Then do ten more questions.", "Gladiator Timmy, champion of the arena. And of the back molars.", "My helmet has cheek guards. Very on brand."]
    },
    "rank-silver-outfit": {
      note: "A silver helm with the visor up and a blue plume, a shield and a sword",
      back: '<path d="M166 124 L186 44" stroke="' + INK + '" stroke-width="10" stroke-linecap="round"/><path d="M166 124 L186 44" stroke="' + SV.c + '" stroke-width="5.6" stroke-linecap="round"/><path d="M167.6 116 L185 46" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round"/>' +
        p("M154 116 L178 124 L176.4 130 L152.4 122 Z", GD.c, O3) + '<circle cx="163" cy="134" r="4.6" fill="' + GD.c + '" ' + O2 + "/>",
      face: p("M4 98 L40 98 L40 120 Q40 134 22 142 Q4 134 4 120 Z", "#3FA7E0", O3) + '<path d="M22 98 L40 98 L40 120 Q40 134 22 142 Z" fill="#2378B0"/>' + p("M4 98 L40 98 L40 120 Q40 134 22 142 Q4 134 4 120 Z", "none", O3) + line("M9 103 H35 V120 Q35 130 22 136.4 Q9 130 9 120 Z", SV.c, 2) + T.tinyTooth(22, 118, 1.7, "#FFFFFF"),
      top: p("M102 8 C96 -18 110 -34 130 -28 C148 -22 154 -4 146 8 C140 -6 128 -10 118 -4 C112 0 108 6 108 14 Z", "#3FA7E0", O3) + line("M108 6 C108 -10 118 -20 132 -20", "#2378B0", 2) +
        '<path d="M40 70 C34 30 62 6 100 6 C138 6 166 30 160 70 L160 112 Q160 126 146 128 L54 128 Q40 126 40 112 Z M58 72 Q58 64 66 64 L134 64 Q142 64 142 72 L142 106 Q142 116 132 116 L68 116 Q58 116 58 106 Z" fill="' + SV.c + '"' + EO + "/>" +
        '<path d="M130 14 C152 26 164 46 160 70 L160 112 Q160 126 146 128 L143 128 L143 72 C143 66 140 63 134 63 C140 46 140 28 130 14 Z" fill="' + SV.s + '"/>' +
        '<path d="M40 70 C34 30 62 6 100 6 C138 6 166 30 160 70 L160 112 Q160 126 146 128 L54 128 Q40 126 40 112 Z M58 72 Q58 64 66 64 L134 64 Q142 64 142 72 L142 106 Q142 116 132 116 L68 116 Q58 116 58 106 Z" fill="none" ' + O4 + "/>" +
        line("M100 6 V26", SV.s, 2.4) + line("M76 121 v4 M88 122 v4 M100 122.4 v4 M112 122 v4 M124 121 v4", INK, 2.2) +
        p("M48 64 L53 30 Q100 14 147 30 L152 64 Q100 49 48 64 Z", "#F3F6F9", O3) + '<path d="M124 24 Q138 27 147 30 L152 64 Q140 58 128 55 Z" fill="' + SV.c + '"/>' + p("M48 64 L53 30 Q100 14 147 30 L152 64 Q100 49 48 64 Z", "none", O3) +
        line("M64 44 Q80 38 94 38 M106 38 Q120 38 136 44", INK, 3.4) + line("M70 54 l0 .1 M80 51.6 l0 .1 M90 50.2 l0 .1 M110 50.2 l0 .1 M120 51.6 l0 .1 M130 54 l0 .1", INK, 2.6) +
        '<circle cx="48" cy="66" r="5.4" fill="' + SV.c + '" ' + O3 + '/><circle cx="152" cy="66" r="5.4" fill="' + SV.s + '" ' + O3 + "/>" + hi("M48 90 V110", 3, .8) + hi("M60 34 Q70 27 82 24", 2.6, .9),
      say: ["Sir Timmy of the Silver Rank, at your service.", "Visor up, so I can read the notes. And smile.", "A knight guards the castle. I guard the enamel."]
    },
    "rank-gold-outfit": {
      note: "A golden laurel wreath, a white toga with a gold border and clasp, and a gold cuff",
      face: p("M45 111 Q72 117 100 123 Q128 129 155 126 L155 131 Q100 180 45 131 Z", "#FFFDF6", O3) + p("M44 113 L43 98 Q47 91 54 97 L66 115 Z", "#FFFDF6", O3) +
        line("M52 106 Q68 124 96 134 M50 120 Q70 138 98 146 M112 130 Q132 134 150 131 M120 140 Q134 141 144 138", "#D9CDB8", 2) + line("M49 115.6 Q74 121 100 127 Q128 133 152 130.4", GD.c, 3.6) +
        '<circle cx="53" cy="104" r="6.4" fill="' + GD.c + '" ' + O2 + "/>" + '<circle cx="53" cy="104" r="2.4" fill="' + GD.h + '"/>' + p("M150 105 L161 101.6 L163.6 110 L152.6 113.4 Z", GD.c, O2) + line("M153 107.4 l8 -2.4", GD.h, 1.6),
      top: wreath,
      say: ["Gold rank! Friends, Romans, classmates: lend me your molars.", "I came, I saw, I flossed.", "Laurels are for resting on. Later. After the exam."]
    },
    "rank-diamond-outfit": {
      note: "Faceted diamond shades, a cape and collar of pale blue ice, and a crystal tiara",
      back: capeIce,
      face: p("M44 116 Q100 142 156 116 L156 125 Q100 152 44 125 Z", "#EAF9FF", O3) + line("M60 124 l4 7 M78 130 l3 8 M122 130 l-3 8 M140 124 l-4 7", DI.s, 1.8) + gem(100, 136, 17, 21, [DI.c, DI.s]) +
        line("M63 80 L50 76 M137 80 L150 76", INK, 3.4) + lens(80) + lens(120) + '<path d="M97 80 Q100 76.6 103 80" fill="none" ' + O3 + "/>",
      top: ice(80, 40, 73, 8, 13) + ice(120, 40, 127, 8, 13) + ice(100, 46, 100, -4, 17) + p("M66 38 Q100 52 134 38 L134 46 Q100 60 66 46 Z", DI.s, O3) + line("M72 43 Q100 55 128 43", "#FFFFFF", 1.8) + star4(92, 14, 4, WHITE),
      say: ["Diamond rank. Under pressure, we shine.", "My shades are cut like a diamond bur: all sparkle.", "Ice cape on. Stay cool. The exam is only questions."]
    },
    "rank-dark-outfit": {
      note: "A deep violet cloak full of stars, its hood drawn round his face, held by a teal clasp",
      back: p("M100 4 C56 4 30 34 26 76 C12 116 -2 164 -6 214 Q8 226 22 214 Q34 228 48 216 L100 220 L152 216 Q166 228 178 214 Q192 226 206 214 C202 164 188 116 174 76 C170 34 144 4 100 4 Z", DM.s) +
        line("M-3 206 Q8 216 22 205 Q34 218 46 208 M203 206 Q192 216 178 205 Q166 218 154 208", DM.teal, 2.2) +
        cloakStars([[22, 112, 5.4], [8, 156, 4.4, DM.teal], [12, 190, 3.4, DM.h], [28, 86, 3, DM.h], [16, 134, 2.4], [178, 110, 4.6, DM.teal], [192, 156, 5.4], [188, 192, 3.4, DM.h], [172, 86, 3], [184, 134, 2.4, DM.h]]),
      face: p("M42 126 Q100 150 158 126 L160 133 Q100 178 40 133 Z", DM.c, O3) + cloakStars([[62, 138, 3.4], [136, 138, 3, DM.h], [80, 146, 2.2, DM.teal], [122, 148, 2.2]]) +
        '<circle cx="100" cy="140" r="7.4" fill="' + DM.teal + '" ' + O3 + "/>" + star4(100, 140, 4.6, WHITE),
      top: '<path d="' + HOOD + " " + hole(0) + '" fill="' + DM.s + '"' + EO + "/>" + '<path d="' + HOOD + " " + hole(7) + '" fill="' + DM.c + '"' + EO + "/>" +
        '<path d="M136 2 C160 20 174 52 171 94 C170 112 165 124 158 132 L146 132 C156 112 160 60 136 2 Z" fill="#3A1F74"/>' +
        '<path d="' + hole(7) + '" fill="none" stroke="' + DM.teal + '" stroke-width="2.4"/>' + '<path d="' + HOOD + " " + hole(0) + '" fill="none" ' + O4 + "/>" +
        cloakStars([[56, 22, 5.4], [84, 6, 3.4, DM.teal], [124, 12, 4.4, DM.h], [150, 40, 3.4], [40, 62, 3.4, DM.h], [160, 80, 4, DM.teal], [38, 100, 4.4, DM.teal], [162, 112, 2.6], [70, 30, 2.2, DM.h], [104, 24, 2.6], [140, 22, 2], [44, 122, 2.2]]) +
        hi("M44 60 Q48 34 68 16", 3, .3),
      say: ["Dark Matter rank. You studied your way off the chart.", "From in here I see every star. And every missed spot.", "Most of the universe is dark matter. Most of me is dentin."]
    }
  };

  return { k: "ranks", yard: yard, outfits: outfits };
}
