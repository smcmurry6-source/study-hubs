/* The recap's drawings (Sam, 2026-11-11: "the infographics are boring"; then "the mountain range doesn't read as a bar
   graph and it also needs to fit in a smaller card"): hours per day as drawn columns, and the classmates as a crowd of
   teeth. Timmy's ink: flat fills, ink outlines, no ids, gradients or <text>. */
export function recapKit(INK, C){
  "use strict";
  function f(n){ return Math.round(n * 10) / 10; }
  function P(d, fill, sw){ return '<path d="' + d + '" fill="' + (fill || "none") + '" stroke="' + INK + '" stroke-width="' + (sw || 2) + '" stroke-linejoin="round" stroke-linecap="round"/>'; }
  function F(d, fill, op){ return '<path d="' + d + '" fill="' + fill + '"' + (op != null ? ' opacity="' + op + '"' : "") + "/>"; }
  function L(d, sw, col, op, dash){ return '<path d="' + d + '" fill="none" stroke="' + (col || INK) + '" stroke-width="' + (sw || 1.3) + '" stroke-linecap="round" stroke-linejoin="round"' + (op != null ? ' opacity="' + op + '"' : "") + (dash ? ' stroke-dasharray="' + dash + '"' : "") + "/>"; }
  function rng(seed){ var s = (seed * 9301 + 49297) % 233280 || 1; return function(){ s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
  var TOOTH = "M-5 -3.4 C-5.4 -6.4 -3.6 -8 -1.8 -8 C-.8 -8 -.4 -7.2 0 -7.2 C.4 -7.2 .8 -8 1.8 -8 C3.6 -8 5.4 -6.4 5 -3.4 C4.6 -.6 3.8 .8 3.4 3.6 C3.2 5.4 2 5.6 1.6 4 L.8 1.2 Q0 .2 -.8 1.2 L-1.6 4 C-2 5.6 -3.2 5.4 -3.4 3.6 C-3.8 .8 -4.6 -.6 -5 -3.4 Z";

  /* hours per day as a bar graph you can read: one chunky column per day on a ground line, faint rules behind, the
     exam day's column in the hub's ink with its flag on top. o: { w, h, days: [hours], tint, exam } ->
     { svg (inner), tops: [[x, y]], bw, base } so the page can label a column and stand Timmy on one */
  function bars(o){
    var W = o.w, H = o.h, d = o.days, n = d.length, t = o.tint, max = Math.max.apply(null, d) || 1, base = H - 16, top = 30, padL = 10, padR = 10, s = "", i;
    var slot = (W - padL - padR) / n, bw = Math.min(46, slot * .68), ex = o.exam == null ? n - 1 : o.exam, tops = [];
    for (i = 1; i <= 3; i++) s += L("M" + padL + " " + f(base - (base - top) * i / 3) + " H" + (W - padR), 1.2, INK, .14, "2 5");
    for (i = 0; i < n; i++){
      var x = padL + slot * i + (slot - bw) / 2, h = Math.max(5, (base - top) * d[i] / max), y = base - h, r = Math.min(5, bw / 4, h / 2), on = i === ex;
      var col = "M" + f(x) + " " + base + " V" + f(y + r) + " Q" + f(x) + " " + f(y) + " " + f(x + r) + " " + f(y) + " H" + f(x + bw - r) + " Q" + f(x + bw) + " " + f(y) + " " + f(x + bw) + " " + f(y + r) + " V" + base + " Z";
      s += '<g class="rk-bar" style="animation-delay:' + f(i * .07) + 's">' + F(col, on ? t.ink : t.mid) +
        F("M" + f(x + bw * .68) + " " + f(y + r * .4) + " H" + f(x + bw - r) + " Q" + f(x + bw) + " " + f(y) + " " + f(x + bw) + " " + f(y + r) + " V" + base + " H" + f(x + bw * .68) + " Z", on ? "#000" : t.ink, on ? .22 : .28) +
        (h > 14 ? L("M" + f(x + bw * .2) + " " + f(y + r + 3) + " V" + f(Math.min(base - 5, y + r + 3 + h * .4)), 2.2, "#fff", .6) : "") + P(col, "none", 2);
      if (on) s += '<g class="rk-flag">' + L("M" + f(x + bw / 2) + " " + f(y) + " v-24", 2.2) + P("M" + f(x + bw / 2) + " " + f(y - 23) + " l-18 5 l18 7 Z", C.red, 1.6) + "</g>";
      s += "</g>"; tops.push([x + bw / 2, y]);
    }
    s += L("M" + (padL - 4) + " " + base + " H" + (W - padR + 4), 2.4);
    return { svg: s, tops: tops, bw: bw, base: base };
  }
  /* the class as a crowd of teeth: n faces in rows, a few in the hub's caps. o: { n, w, tint } -> { svg (inner), h } */
  function crowd(o){
    var n = o.n, W = o.w, t = o.tint, z = o.size || 1.6, gx = 13.2 * z, gy = 11.6 * z, per = Math.max(6, Math.floor((W - 8) / gx)), rows = Math.ceil(n / per), r = rng(5), s = "", i;
    for (var row = 0; row < rows; row++){
      var m = Math.min(per, n - row * per), y = 10 * z + 3 + row * gy, x0 = (W - (m - 1) * gx) / 2;
      for (i = 0; i < m; i++){
        var x = x0 + i * gx + (r() - .5) * 2, yy = y + (r() - .5) * 3, k = row * per + i, g = "";
        g += P(TOOTH, C.enamel, 1) + '<circle cx="-1.9" cy="-3.6" r=".9" fill="' + INK + '"/><circle cx="1.9" cy="-3.6" r=".9" fill="' + INK + '"/>' + L("M-1.3 -1.5 q1.3 1.3 2.6 0", .7) + '<circle cx="-3.3" cy="-2" r=".9" fill="#FF8FA3" opacity=".6"/><circle cx="3.3" cy="-2" r=".9" fill="#FF8FA3" opacity=".6"/>';
        if (k % 6 === 2) g += P("M-4.6 -7.4 L0 -10.4 L4.6 -7.4 L0 -5.6 Z", t.ink, .8) + L("M3.4 -7.2 v2.6", .7, C.gold);
        if (k % 9 === 5) g += P("M-3.4 -7.4 L0 -13 L3.4 -7.4 Z", C.yellow, .8) + '<circle cx="0" cy="-13" r="1" fill="' + C.red + '"/>';
        s += '<g class="rk-face" style="animation-delay:' + f(k * .025) + 's" transform="translate(' + f(x) + " " + f(yy) + ') scale(' + z + ')">' + g + "</g>";
      }
    }
    return { svg: s, h: Math.round(10 * z + 3 + (rows - 1) * gy + 7 * z) };
  }
  return { bars: bars, crowd: crowd, TOOTH: TOOTH };
}
