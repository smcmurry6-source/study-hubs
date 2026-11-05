/* The art kit: every picture on the site, drawn in one hand (the ink plate). The rules of the hand and the contract:
   tools/art/README.md. Styles: the "art" section of widget/v3.css. Load this before v3.js on every page that draws.
   A motif returns the inner markup of a 100 x 100 drawing; shArt.svg() wraps it. Nothing here reads class data. */
(function(){
  "use strict";
  var M = {};
  var DEFS_ID = "sh-art-defs", CSS_ID = "sh-art-css";

  /* The hand's styles. The drawings keep their ink and cream in both themes, the way Timmy's sprite does, so only the
     page behind them changes; a hub's companion colors (--sh-warm, --sh-cool) give the spot and the cool fill. */
  var CSS = ':root{--art-ink:#2B2230; --art-paper:#F7F2E8; --art-spot:var(--sh-warm, #D97A2B); --art-cool:var(--sh-cool, #8A9BB8);}' +
    '.sh-art{display:inline-block; vertical-align:middle; overflow:visible; flex:none;}' +
    '.sh-art .s,.sh-art .g{fill:none; stroke:var(--art-ink); stroke-width:1.7; stroke-linecap:round; stroke-linejoin:round;}' +
    '.sh-art .g{stroke:var(--art-cool);}' +
    '.sh-art .b{fill:var(--art-paper);} .sh-art .sp{fill:var(--art-spot);} .sh-art .sp2{fill:var(--art-cool);}' +
    '.sh-art .hatch{fill:url(#sh-art-hatch);} .sh-art .eye{fill:var(--art-ink);} .sh-art .shine{fill:#fff;}' +
    /* a drawing inks itself on (pop-ups): the lines draw, then the fills appear. The kit adds is-ink only when motion is on. */
    '.sh-art.is-ink .s,.sh-art.is-ink .g{stroke-dasharray:1; stroke-dashoffset:1; animation:sh-art-ink .55s cubic-bezier(.3,.7,.2,1) forwards;}' +
    '.sh-art.is-ink .b,.sh-art.is-ink .sp,.sh-art.is-ink .sp2,.sh-art.is-ink .hatch,.sh-art.is-ink .eye,.sh-art.is-ink .shine{animation:sh-art-fill .3s ease-out .32s both;}' +
    '.sh-art.is-wiggle{animation:sh-art-wiggle .7s ease-in-out .1s 1; transform-origin:50% 90%;}' +
    '@keyframes sh-art-ink{to{stroke-dashoffset:0;}} @keyframes sh-art-fill{from{opacity:0;} to{opacity:1;}}' +
    '@keyframes sh-art-wiggle{0%,100%{transform:rotate(0);} 30%{transform:rotate(-5deg);} 60%{transform:rotate(4deg);}}' +
    '@media (prefers-reduced-motion: reduce){ .sh-art *{animation:none !important; stroke-dashoffset:0 !important;} .sh-art.is-wiggle{animation:none !important;} }';
  function css(){
    if (document.getElementById(CSS_ID)) return;
    var st = document.createElement("style"); st.id = CSS_ID; st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }
  function still(){
    try { if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return true; } catch (e) {}
    try { return localStorage.getItem("sh_pref_fx") === "off"; } catch (e) { return false; }
  }

  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  /* the shared hatch pattern, once per page (no filter on the lines: a displacement filter pulled the joints apart) */
  function defs(){
    if (document.getElementById(DEFS_ID)) return;
    var s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("id", DEFS_ID); s.setAttribute("aria-hidden", "true"); s.setAttribute("focusable", "false");
    s.setAttribute("width", "0"); s.setAttribute("height", "0"); s.style.position = "absolute";
    s.innerHTML = '<defs>' +
      '<pattern id="sh-art-hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="4" stroke="var(--art-ink, #1F201D)" stroke-width=".9" opacity=".55"/></pattern>' +
      '</defs>';
    (document.body || document.documentElement).appendChild(s);
  }

  /* register(name, fn[, meta]): fn(o) returns the inner markup of a 100 x 100 drawing; meta.w / meta.h for a wide one
     (a frieze is 300 x 60). The same name and options always give the same drawing. */
  function register(name, fn, meta){ M[name] = { fn: fn, w: (meta && meta.w) || 100, h: (meta && meta.h) || 100 }; }
  function has(name){ return Object.prototype.hasOwnProperty.call(M, name); }
  function names(){ return Object.keys(M); }

  /* shArt.svg(name, { size, title, cls, spot, cool, ink, wiggle }): size is the width in px (the height follows the
     drawing's shape); title makes it an image with a name, otherwise it's decoration; ink draws it on when motion is on;
     wiggle gives a toast its nod. */
  function svg(name, o){
    o = o || {};
    var m = M[name]; if (!m) return "";
    var size = o.size || 48, h = Math.round(size * m.h / m.w);
    var style = (o.spot ? "--art-spot:" + o.spot + ";" : "") + (o.cool ? "--art-cool:" + o.cool + ";" : "");
    var move = !still();
    css();
    if (document.body) defs(); else document.addEventListener("DOMContentLoaded", defs, { once: true });
    return '<svg class="sh-art' + (o.ink && move ? " is-ink" : "") + (o.wiggle && move ? " is-wiggle" : "") + (o.cls ? " " + esc(o.cls) : "") +
      '" data-art="' + esc(name) + '" viewBox="0 0 ' + m.w + ' ' + m.h + '" width="' + size + '" height="' + h + '"' +
      (o.title ? ' role="img" aria-label="' + esc(o.title) + '"' : ' aria-hidden="true"') + ' focusable="false"' + (style ? ' style="' + style + '"' : "") + '>' +
      (o.ink && move ? m.fn(o).replace(/<path class="(s|g)"/g, '<path class="$1" pathLength="1"') : m.fn(o)) + '</svg>';
  }

  /* ---------- helpers every motif may use ---------- */
  function face(cx, cy, w, o){
    /* Timmy's face: dot eyes with a shine, one smile, two blush marks. w = eye spacing */
    o = o || {}; var r = o.r || 3, ey = cy, lx = cx - w / 2, rx = cx + w / 2;
    var mouth = o.mood === "worried" ? 'M' + (cx - 5) + ' ' + (cy + 11) + 'c3-2 7-2 10 0' :
      o.mood === "o" ? '<circle class="s" cx="' + cx + '" cy="' + (cy + 11) + '" r="2.6"/>' :
      'M' + (cx - 8) + ' ' + (cy + 10) + 'c5 5 11 5 16 0';
    var brows = o.mood === "worried" ? '<path class="s" d="M' + (lx - 4) + ' ' + (ey - 7) + 'c2-2 5-2 7 0M' + (rx - 3) + ' ' + (ey - 7) + 'c2-2 5-2 7 0"/>' : "";
    return (o.mood === "sleep"
      ? '<path class="s" d="M' + (lx - 3) + ' ' + ey + 'c2 2 4 2 6 0M' + (rx - 3) + ' ' + ey + 'c2 2 4 2 6 0"/>'
      : '<circle class="eye" cx="' + lx + '" cy="' + ey + '" r="' + r + '"/><circle class="eye" cx="' + rx + '" cy="' + ey + '" r="' + r + '"/>' +
        '<circle class="shine" cx="' + (lx + 1.1) + '" cy="' + (ey - 1.1) + '" r="1"/><circle class="shine" cx="' + (rx + 1.1) + '" cy="' + (ey - 1.1) + '" r="1"/>') +
      brows + (mouth.charAt(0) === "<" ? mouth : '<path class="s" d="' + mouth + '"/>') +
      '<path class="sp" style="opacity:.7" d="M' + (lx - 9) + ' ' + (cy + 5) + 'c-3-1-5 1-5 3s3 3 5 2zM' + (rx + 9) + ' ' + (cy + 5) + 'c3-1 5 1 5 3s-3 3-5 2z"/>';
  }
  /* Timmy in a drawing: an ink drawing of him, decoration (Sam, 2026-11-05: a redrawn Timmy is fine as decoration; the real
     Timmy, the pet in the bottom-left corner from widget/pet.js, is never touched). A molar at translate(ox, oy) scale(k)
     with his face; mood: "o" (surprised), "worried", "sleep", or his smile. */
  function timmy(ox, oy, k, mood){
    ox = ox || 0; oy = oy || 0; k = k || 1;
    return '<g class="sh-art-timmy" transform="translate(' + ox + ' ' + oy + ') scale(' + k + ')">' + molar(0, 0, 1) + face(50, 42, 20, mood ? { mood: mood } : {}) + '</g>';
  }

  /* a lower first molar seen from the front: the crown with two cusps and two roots. ox/oy move it, k scales it */
  function molar(ox, oy, k){
    k = k || 1;
    var d = "M22 38c-3-16 6-27 17-27 6 0 9 3 11 6 2-3 5-6 11-6 11 0 20 11 17 27-1 8-4 14-4 22 0 14-4 26-10 26-5 0-7-12-8-18-1-5-3-7-6-7s-5 2-6 7c-1 6-3 18-8 18-6 0-10-12-10-26 0-8-3-14-4-22z";
    var t = 'transform="translate(' + (ox || 0) + ' ' + (oy || 0) + ') scale(' + k + ')"';
    return '<g ' + t + '><path class="b" d="' + d + '"/><path class="hatch" d="M22 38c-3-16 6-27 17-27 3 0 5 1 7 2-6 2-12 10-9 25 1 8 4 14 4 22 0 10 2 18 4 22-5-1-9-13-9-26 0-8-3-14-4-22z" style="opacity:.6"/><path class="s" d="' + d + '"/><path class="s" d="M35 24c4 3 9 3 15 0M50 24c4 3 10 3 15 0"/></g>';
  }
  function ground(y, w){ y = y || 84; w = w || 36; return '<path class="g" d="M' + (50 - w) + ' ' + y + 'h' + (2 * w) + '"/>'; }

  /* ================= the cast ================= */
  register("timmy", function(){ return timmy(0, 0, 1, "happy"); });
  register("timmy-cheer", function(){
    return timmy(0, 2, .96, "happy") +
      '<path class="sp" d="M12 20l3 6-6 1zM88 20l-3 6 6 1zM8 36l5 2-3 4zM92 36l-5 2 3 4z"/>' +
      '<path class="s" d="M16 10l2 6M84 10l-2 6M6 26l5 1M94 26l-5 1"/>';
  });
  register("timmy-think", function(){
    return timmy(-4, 4, .92, "ok") +
      '<circle class="s" cx="80" cy="30" r="2"/><circle class="s" cx="87" cy="20" r="3.2"/><path class="b" d="M92 6a7 7 0 1 1-.1 0z"/><path class="s" d="M85 13c0-4 3-7 7-7s7 3 7 7-3 7-7 7-7-3-7-7z"/>';
  });
  register("timmy-sleep", function(){ return timmy(0, 2, .96, "sleep") + '<path class="s" d="M74 20h8l-8 8h8M84 8h6l-6 6h6" style="opacity:.8"/>'; });
  register("timmy-study", function(){
    return timmy(0, -6, .92, "happy") +
      '<path class="sp2" d="M22 80c8-4 18-4 28 0 10-4 20-4 28 0v8c-8-4-18-4-28 0-10-4-20-4-28 0z"/>' +
      '<path class="s" d="M22 80c8-4 18-4 28 0 10-4 20-4 28 0v8c-8-4-18-4-28 0-10-4-20-4-28 0zM50 80v8M30 83c4-2 9-2 14-1M56 82c5-1 10-1 14 1"/>';
  });
  register("thirty-one", function(){
    var d = "M24 36c-3-14 5-24 15-24 5 0 8 2 11 5 3-3 6-5 11-5 10 0 18 10 15 24-1 7-3 12-3 19 0 12-4 22-9 22-4 0-6-10-7-15-1-4-3-6-7-6s-6 2-7 6c-1 5-3 15-7 15-5 0-9-10-9-22 0-7-2-12-3-19z";
    return '<path class="b" d="' + d + '"/><path class="s" d="' + d + '"/>' + face(50, 36, 16, { mood: "worried", r: 2.8 }) +
      '<path class="sp" d="M26 50c8 6 40 6 48 0l3 7c-10 6-44 6-54 0zM28 57l8 2-4 16c-3-1-5-2-7-4z"/>' +
      '<path class="s" d="M26 50c8 6 40 6 48 0l3 7c-10 6-44 6-54 0zM28 57l8 2-4 16"/>' +
      '<path class="s" d="M80 24c4-1 8 1 9 5M84 20l5-5" style="opacity:.8"/>';
  });
  register("rabbit", function(){
    var d = "M36 46c-2-14-8-30-2-33s12 14 14 26c2-12 8-29 14-26s0 19-2 33c10 4 16 12 16 22 0 14-12 22-26 22S24 82 24 68c0-10 6-18 12-22z";
    return '<path class="b" d="' + d + '"/><path class="hatch" d="M36 46c10 4 16 12 16 22 0 14-12 22-26 22 0-14 2-30 10-44z" style="opacity:.5"/><path class="s" d="' + d + '"/>' +
      '<path class="sp" d="M39 42c-1-8-4-18-1-19s6 9 7 17zM61 42c1-8 4-18 1-19s-6 9-7 17z" style="opacity:.6"/>' +
      '<circle class="eye" cx="41" cy="62" r="2.8"/><circle class="eye" cx="59" cy="62" r="2.8"/><circle class="shine" cx="42" cy="61" r="1"/><circle class="shine" cx="60" cy="61" r="1"/>' +
      '<path class="s" d="M47 70c2 2 4 2 6 0"/><path class="b" d="M45 72h10v8c0 2-2 3-5 3s-5-1-5-3z"/><path class="s" d="M45 72h10v8c0 2-2 3-5 3s-5-1-5-3zM50 72v11"/>' +
      '<path class="s" d="M30 66c-4 0-8 1-10 2M30 70c-4 1-7 2-9 4M70 66c4 0 8 1 10 2M70 70c4 1 7 2 9 4"/>';
  });
  register("brush", function(){
    return '<path class="sp2" d="M14 84c10-8 24-10 36-9s24 4 36 9c-12 5-24 8-36 8s-24-3-36-8z"/><path class="s" d="M14 84c10-8 24-10 36-9s24 4 36 9"/>' +
      '<path class="b" d="M44 78L46 30c0-4 8-4 8 0l2 48z"/><path class="hatch" d="M50 30l1 48h-5l1-48z" style="opacity:.4"/><path class="s" d="M44 78L46 30c0-4 8-4 8 0l2 48"/>' +
      '<path class="sp" d="M40 31c0-14 2-22 10-22s10 8 10 22z"/><path class="s" d="M40 31c0-14 2-22 10-22s10 8 10 22M42 12v18M46 9v21M50 8v22M54 9v21M58 12v18"/>' +
      '<path class="s" d="M22 76c3-6 8-6 12 0M66 78c3-5 8-5 12 0"/>';
  });

  /* ================= shared objects ================= */
  register("tools", function(){
    return '<path class="s" d="M22 80L62 34"/><path class="b" d="M70 26a10 10 0 1 1-14 14 10 10 0 0 1 14-14z"/><path class="hatch" d="M70 26a10 10 0 0 1 0 14l-7-7z" style="opacity:.5"/><path class="s" d="M70 26a10 10 0 1 1-14 14 10 10 0 0 1 14-14z"/>' +
      '<circle class="shine" cx="60" cy="30" r="2.5"/><path class="s" d="M78 80L36 32c-4-4-6-10-3-12s8 1 12 5"/><path class="sp" d="M20 84a4 4 0 1 0 6-6zM76 84a4 4 0 1 0 6-6z"/>';
  });
  register("trophy", function(){
    return '<path class="sp" d="M30 18h40v18c0 14-9 24-20 24S30 50 30 36z"/><path class="hatch" d="M30 18h12v18c0 14 4 22 8 24-11 0-20-10-20-24z" style="opacity:.5"/>' +
      '<path class="s" d="M30 18h40v18c0 14-9 24-20 24S30 50 30 36zM30 24H18c0 12 6 18 14 20M70 24h12c0 12-6 18-14 20M50 60v12M38 84c0-6 5-12 12-12s12 6 12 12z"/>' +
      molar(32, 20, .36) + '<path class="s" d="M38 84h24M34 90h32"/>';
  });
  register("flame", function(o){
    return '<path class="sp" d="M50 10c4 14 18 20 18 40 0 14-8 24-18 24S32 64 32 50c0-8 4-12 6-18 2 6 6 8 8 6 2-4-2-12 4-28z"/><path class="hatch" d="M50 10c4 14 18 20 18 40 0 14-8 24-18 24 6-6 8-14 8-24 0-14-10-20-8-40z" style="opacity:.5"/>' +
      '<path class="s" d="M50 10c4 14 18 20 18 40 0 14-8 24-18 24S32 64 32 50c0-8 4-12 6-18 2 6 6 8 8 6 2-4-2-12 4-28z"/>' +
      '<path class="shine" d="M50 48c3 6 6 10 6 16 0 5-3 8-6 8s-6-3-6-8c0-5 3-10 6-16z" style="opacity:.85"/><path class="s" d="M50 48c3 6 6 10 6 16 0 5-3 8-6 8s-6-3-6-8c0-5 3-10 6-16z"/>' + (o && o.bare ? "" : ground(84, 22));
  });
  register("handpiece", function(){
    var body = "M8 44H64L80 52A8 8 0 1 1 78 64L64 56H8Z";
    return '<g transform="rotate(-28 50 50)">' +
      '<path class="b" d="' + body + '"/>' +
      '<path class="hatch" d="M8 51H64L76 57L78 64L64 56H8Z" style="opacity:.5"/>' +
      '<path class="sp2" d="M80 52A8 8 0 1 1 78 64L82 60Z" style="opacity:.6"/>' +
      '<path class="s" d="' + body + '"/>' +
      '<path class="s" d="M12 44V56M16 44V56M64 44V56"/>' +
      '<path class="sp" d="M3 42H8V58H3Z"/><path class="s" d="M3 42H8V58H3ZM0 48H3M0 52H3"/>' +
      '<path class="b" d="M81 66H87V69H81Z"/><path class="s" d="M81 66H87V69H81ZM84 69V84M81 84H87"/>' +
      '<path class="s" d="M70 46l4 2" style="opacity:.6"/>' +
      '</g>';
  });
  register("articulator", function(){
    return '<path class="s" d="M18 30h64M18 30c-6 0-8 8-2 10M82 30c6 0 8 8 2 10"/><path class="b" d="M26 40h48l-6 18H32zM32 64h36l6 18H26z"/>' +
      '<path class="hatch" d="M26 40h10l-4 18h0zM26 82h10l4-18h-8z" style="opacity:.5"/><path class="s" d="M26 40h48l-6 18H32zM32 64h36l6 18H26z"/>' +
      '<path class="s" d="M38 46c2 3 5 3 7 0s5-3 7 0 5 3 7 0M38 72c2-3 5-3 7 0s5 3 7 0 5-3 7 0"/><path class="sp" d="M70 58h-4v6h4z" style="opacity:.8"/><path class="s" d="M50 58v6M14 86h72"/>';
  });
  register("implant", function(){
    return '<path class="b" d="M34 14c-2-6 4-8 16-8s18 2 16 8l-4 20H38z"/><path class="hatch" d="M34 14c-2-6 4-8 16-8-8 1-12 4-10 8l2 20h-4z" style="opacity:.45"/><path class="s" d="M34 14c-2-6 4-8 16-8s18 2 16 8l-4 20H38z"/>' +
      '<path class="sp2" d="M42 34h16v6H42z"/><path class="s" d="M42 34h16v6H42z"/><path class="b" d="M42 40h16l-3 44c0 3-2 6-5 6s-5-3-5-6z"/><path class="s" d="M42 40h16l-3 44c0 3-2 6-5 6s-5-3-5-6zM42 48h16M43 56h15M43 64h14M44 72h13M45 80h11"/>' +
      '<path class="s" d="M20 44c10-2 14-2 18-2M80 44c-10-2-14-2-18-2" style="opacity:.6"/>';
  });

  window.shArt = { svg: svg, defs: defs, css: css, still: still, register: register, has: has, names: names, molar: molar, face: face, ground: ground, timmy: timmy };
})();

/* ================= pop-ups, toasts and empty states ================= */
(function(){
  var A = window.shArt, molar = A.molar, face = A.face, ground = A.ground;
  /* Timmy whole, at a size: the kit sets his real sprite in (A.timmy), never a redrawing */
  function timmy(ox, oy, k, mood){ return A.timmy(ox, oy, k, mood); }
  /* number thirty-one: the second molar next door, worried, in his tiny scarf */
  function thirtyOne(ox, oy, k){
    var d = "M24 36c-3-14 5-24 15-24 5 0 8 2 11 5 3-3 6-5 11-5 10 0 18 10 15 24-1 7-3 12-3 19 0 12-4 22-9 22-4 0-6-10-7-15-1-4-3-6-7-6s-6 2-7 6c-1 5-3 15-7 15-5 0-9-10-9-22 0-7-2-12-3-19z";
    return '<g transform="translate(' + ox + ' ' + oy + ') scale(' + k + ')"><path class="b" d="' + d + '"/><path class="s" d="' + d + '"/>' + face(50, 36, 16, { mood: "worried", r: 2.8 }) +
      '<path class="sp" d="M26 50c8 6 40 6 48 0l3 7c-10 6-44 6-54 0zM28 57l8 2-4 16c-3-1-5-2-7-4z"/><path class="s" d="M26 50c8 6 40 6 48 0l3 7c-10 6-44 6-54 0zM28 57l8 2-4 16"/></g>';
  }
  /* the rabbit down the hill: head and ears */
  function rabbit(ox, oy, k){
    var d = "M36 46c-2-14-8-30-2-33s12 14 14 26c2-12 8-29 14-26s0 19-2 33c10 4 16 12 16 22 0 14-12 22-26 22S24 82 24 68c0-10 6-18 12-22z";
    return '<g transform="translate(' + ox + ' ' + oy + ') scale(' + k + ')"><path class="b" d="' + d + '"/><path class="hatch" d="M36 46c10 4 16 12 16 22 0 14-12 22-26 22 0-14 2-30 10-44z" style="opacity:.5"/><path class="s" d="' + d + '"/>' +
      '<path class="sp" d="M39 42c-1-8-4-18-1-19s6 9 7 17zM61 42c1-8 4-18 1-19s-6 9-7 17z" style="opacity:.6"/>' +
      '<circle class="eye" cx="41" cy="62" r="2.8"/><circle class="eye" cx="59" cy="62" r="2.8"/><circle class="shine" cx="42" cy="61" r="1"/><circle class="shine" cx="60" cy="61" r="1"/>' +
      '<path class="s" d="M47 70c2 2 4 2 6 0"/><path class="b" d="M45 72h10v8c0 2-2 3-5 3s-5-1-5-3z"/><path class="s" d="M45 72h10v8c0 2-2 3-5 3s-5-1-5-3zM50 72v11"/>' +
      '<path class="s" d="M30 66c-4 0-8 1-10 2M30 70c-4 1-7 2-9 4M70 66c4 0 8 1 10 2M70 70c4 1 7 2 9 4"/></g>';
  }
  /* the toothbrush by the front door, standing on its handle end; rot tilts it (degrees, about its foot at 50,78) */
  function brush(ox, oy, k, rot){
    return '<g transform="translate(' + ox + ' ' + oy + ') scale(' + k + ') rotate(' + (rot || 0) + ' 50 78)">' +
      '<path class="b" d="M44 78L46 30c0-4 8-4 8 0l2 48z"/><path class="hatch" d="M50 30l1 48h-5l1-48z" style="opacity:.4"/><path class="s" d="M44 78L46 30c0-4 8-4 8 0l2 48"/>' +
      '<path class="sp" d="M40 31c0-14 2-22 10-22s10 8 10 22z"/><path class="s" d="M40 31c0-14 2-22 10-22s10 8 10 22M42 12v18M46 9v21M50 8v22M54 9v21M58 12v18"/></g>';
  }
  /* a pencil lying from (x1,y1) to (x2,y2): body, a hatched side, the sharpened spot tip at the second point */
  function pencil(x1, y1, x2, y2){
    var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy), ux = dx / L, uy = dy / L, nx = -uy * 3, ny = ux * 3, tip = 9;
    var bx = x2 - ux * tip, by = y2 - uy * tip;
    var p = function(x, y){ return x.toFixed(1) + " " + y.toFixed(1); };
    var body = "M" + p(x1 + nx, y1 + ny) + "L" + p(bx + nx, by + ny) + "L" + p(bx - nx, by - ny) + "L" + p(x1 - nx, y1 - ny) + "z";
    var cone = "M" + p(bx + nx, by + ny) + "L" + p(x2, y2) + "L" + p(bx - nx, by - ny) + "z";
    return '<path class="b" d="' + body + '"/><path class="hatch" d="M' + p(x1, y1) + 'L' + p(bx, by) + 'L' + p(bx - nx, by - ny) + 'L' + p(x1 - nx, y1 - ny) + 'z" style="opacity:.5"/>' +
      '<path class="sp" d="' + cone + '"/><path class="s" d="' + body + 'M' + p(bx + nx, by + ny) + 'L' + p(x2, y2) + 'L' + p(bx - nx, by - ny) + '"/>';
  }

  /* 1. the achievement toast: Timmy jumps with both arms up, a rosette in one hand, sparks flying */
  A.register("toast-cheer", function(){
    return ground(92, 22) + '<path class="g" d="M30 84c2 3 2 6 0 9M70 84c-2 3-2 6 0 9"/>' +
      timmy(13, 9, .74, "o") +
      '<path class="s" d="M26 44c-6-6-10-14-9-24M74 44c6-6 9-12 10-20"/>' +
      '<circle class="sp" cx="84" cy="18" r="7"/><circle class="s" cx="84" cy="18" r="7"/><circle class="b" cx="84" cy="18" r="2.6"/><circle class="s" cx="84" cy="18" r="2.6"/>' +
      '<path class="sp" d="M80 24l-3 11 4-2 3 3z"/><path class="s" d="M80 24l-3 11 4-2 3 3z"/>' +
      '<path class="sp" d="M14 14l3-5 2 6zM48 6l3 6h-6zM62 10l5-2-1 5z"/><path class="s" d="M8 24l6-3M26 8l-3-4M40 6l-1-5"/>';
  });

  /* 2. a report answered: the rabbit, cap on, holds up an opened letter with a check on it */
  A.register("reply", function(){
    return ground(90, 34) + rabbit(2, 22, .68) +
      '<path class="sp2" d="M20 36c6-6 20-6 26 0l-2 6c-6-3-16-3-22 0z"/><path class="s" d="M20 36c6-6 20-6 26 0l-2 6c-6-3-16-3-22 0zM12 34h8" />' +
      '<path class="s" d="M50 64c6-4 10-10 12-18"/>' +
      '<path class="b" d="M56 48h34v24H56z"/><path class="hatch" d="M56 48h34L73 62z" style="opacity:.35"/><path class="s" d="M56 48h34v24H56zM56 48l17 14 17-14"/>' +
      '<path class="b" d="M60 46V22h26v24"/><path class="s" d="M60 46V22h26v24"/><path class="g" d="M66 30h14M66 36h10"/>' +
      '<circle class="sp" cx="78" cy="38" r="5.5"/><path class="s" d="M75 38l2 2 4.5-4.5"/>';
  });

  /* 3. a notice to everyone: Timmy rings a hand bell on his front step; the toothbrush by the door leans in */
  A.register("notice", function(){
    return '<path class="b" d="M12 78h60v6H12zM8 84h68v6H8z"/><path class="hatch" d="M12 78h60v6H12z" style="opacity:.35"/><path class="s" d="M12 78h60v6H12zM8 84h68v6H8z"/>' +
      timmy(7, 24, .64, "o") +
      '<path class="s" d="M58 52c6-4 10-8 12-12"/>' +
      '<path class="sp" d="M62 30c0-9 5-14 11-14s11 5 11 14l3 9H59z"/><path class="hatch" d="M62 30c0-9 5-14 11-14-5 3-6 8-6 14l-1 9h-4l3-9z" style="opacity:.45"/><path class="s" d="M62 30c0-9 5-14 11-14s11 5 11 14l3 9H59zM70 16c0-4 6-4 6 0"/>' +
      '<circle class="s" cx="73" cy="42" r="2"/><path class="s" d="M90 24c3 4 3 10 0 14M94 19c5 6 5 18 0 24"/>' +
      brush(58, 34, .62, -14) + '<path class="g" d="M84 90h10"/>';
  });

  /* 4. a quick survey: number thirty-one with a clipboard of tick boxes and a pencil; one box ticked already */
  A.register("survey", function(){
    return ground(90, 36) + thirtyOne(0, 14, .64) +
      '<path class="s" d="M48 58c4-2 8-2 12-2"/>' +
      '<path class="b" d="M56 26h32v56H56z"/><path class="s" d="M56 26h32v56H56z"/><path class="sp2" d="M66 22h12v8H66z"/><path class="s" d="M66 22h12v8H66zM69 22v-3h6v3"/>' +
      '<path class="s" d="M61 40h6v6h-6zM61 52h6v6h-6zM61 64h6v6h-6z"/><path class="g" d="M71 43h12M71 55h12M71 67h12"/>' +
      '<path class="sp" d="M60 42l3 3 6-7-1.5-1.5-4.5 5-1.5-1.5z"/>' +
      pencil(64, 90, 90, 68);
  });

  /* 5. the tour prompt: Timmy holds a compass in one hand and points the way with the other; a folded map at his feet */
  A.register("tour", function(){
    return ground(90, 36) + timmy(10, 16, .66) +
      '<path class="s" d="M26 48c-6 2-10 2-12-2M74 46c6-4 10-10 14-16"/><path class="s" d="M88 30l4-3M88 30l5 1"/>' +
      '<circle class="b" cx="14" cy="52" r="9"/><circle class="s" cx="14" cy="52" r="9"/><circle class="s" cx="14" cy="52" r="6.5"/>' +
      '<path class="sp" d="M14 46l2.5 6-2.5-1-2.5 1z"/><path class="s" d="M14 58l-2.5-6 2.5 1 2.5-1z"/>' +
      '<path class="b" d="M60 78l8-4 8 4 8-4 6 3v12l-6-3-8 4-8-4-8 4z"/><path class="s" d="M60 78l8-4 8 4 8-4 6 3v12l-6-3-8 4-8-4-8 4zM68 74v12M76 78v12M84 74v12"/>' +
      '<path class="g" d="M64 85c3-3 6-2 9-4M80 84c2-1 4-3 6-4"/><path class="sp" d="M86 80l3 3M89 80l-3 3"/>';
  });

  /* 6. the Daily Drill: a short stack of three question cards with a stopwatch resting on them */
  A.register("drill", function(){
    return ground(92, 30) +
      '<path class="b" d="M22 66l40-10 10 24-40 10z"/><path class="hatch" d="M22 66l40-10 2 4-40 10z" style="opacity:.4"/><path class="s" d="M22 66l40-10 10 24-40 10z"/>' +
      '<path class="b" d="M20 50l44-6 6 24-44 6z"/><path class="hatch" d="M20 50l44-6 1 4-44 6z" style="opacity:.4"/><path class="s" d="M20 50l44-6 6 24-44 6z"/>' +
      '<path class="b" d="M22 34h44v24H22z"/><path class="s" d="M22 34h44v24H22z"/>' +
      '<path class="s" d="M38 42c0-4 8-4 8 0 0 3-4 3-4 7"/><circle class="eye" cx="42" cy="53" r="1.6"/>' +
      '<circle class="b" cx="72" cy="28" r="14"/><circle class="s" cx="72" cy="28" r="14"/><circle class="s" cx="72" cy="28" r="10.5"/>' +
      '<path class="s" d="M68 12h8M72 12v-3M82 16l3-3"/><path class="sp" d="M72 28l6-8-4 9z"/><path class="s" d="M72 28l6-8"/><circle class="s" cx="72" cy="28" r="1.4"/>' +
      '<path class="s" d="M72 20v2M80 28h-2M72 36v-2M64 28h2"/>';
  });

  /* 7. today's drill done: Timmy hugs the finished stack, a ribbon around it, a star over his head */
  A.register("drill-done", function(){
    return ground(92, 34) + timmy(14, 8, .72) +
      '<path class="b" d="M26 62h48v24H26z"/><path class="hatch" d="M26 62h48v4H26z" style="opacity:.4"/><path class="s" d="M26 62h48v24H26zM26 70h48M26 78h48"/>' +
      '<path class="sp" d="M46 62h8v24h-8z"/><path class="s" d="M46 62h8v24h-8z"/>' +
      '<path class="sp" d="M50 58c-6-6-12-2-8 4 2 3 8 2 8-2 0 4 6 5 8 2 4-6-2-10-8-4z"/><path class="s" d="M50 58c-6-6-12-2-8 4 2 3 8 2 8-2 0 4 6 5 8 2 4-6-2-10-8-4z"/>' +
      '<path class="s" d="M24 56c-4 8-2 18 6 22M76 56c4 8 2 18-6 22"/>' +
      '<path class="sp" d="M84 8l2.6 6 6.4.6-4.8 4.4 1.4 6.4-5.6-3.4-5.6 3.4 1.4-6.4-4.8-4.4 6.4-.6z"/><path class="s" d="M84 8l2.6 6 6.4.6-4.8 4.4 1.4 6.4-5.6-3.4-5.6 3.4 1.4-6.4-4.8-4.4 6.4-.6z"/>';
  });

  /* 8. the mock results card: an exam booklet with the graded sheet sticking out, a pencil across it, a laurel sprig */
  A.register("mock", function(){
    return '<path class="b" d="M50 12h28v30H50z"/><path class="s" d="M50 12h28v30H50z"/><path class="g" d="M56 20h16M56 26h12"/>' +
      '<circle class="sp" cx="70" cy="33" r="5.5"/><path class="s" d="M67 33l2 2 4-4"/>' +
      '<path class="b" d="M20 22h50v62H20z"/><path class="hatch" d="M20 22h8v62h-8z" style="opacity:.5"/><path class="s" d="M20 22h50v62H20zM28 22v62"/>' +
      '<path class="g" d="M36 36h24M36 44h20M36 52h24M36 60h16"/>' +
      pencil(14, 92, 84, 62) +
      '<path class="s" d="M74 90c6-8 10-16 12-26"/><path class="sp" d="M78 82c-4-2-6-6-4-9 3 1 5 5 4 9zM82 72c-4-1-6-5-5-8 3 1 6 4 5 8zM80 84c4-1 8 0 9 3-3 2-7 1-9-3zM84 74c4-2 8-1 10 2-3 2-8 2-10-2z"/>';
  });

  /* 9. nothing missed yet: a clean answer sheet, not one mark on it, and Timmy peeking over its top edge, proud */
  A.register("empty-misses", function(){
    return timmy(23, 2, .55) +
      '<path class="b" d="M20 40h60v52H20z"/><path class="s" d="M20 40h60v52H20z"/>' +
      '<path class="s" d="M30 42c2 3 4 3 6 0M64 42c2 3 4 3 6 0"/>' +
      '<circle class="s" cx="30" cy="54" r="3"/><circle class="s" cx="30" cy="66" r="3"/><circle class="s" cx="30" cy="78" r="3"/>' +
      '<path class="g" d="M38 54h30M38 66h24M38 78h30"/>';
  });

  /* 10. no pinned questions: a cork board with one push pin and nothing on it; the toothbrush leans on its frame */
  A.register("empty-pins", function(){
    return ground(86, 40) +
      '<path class="b" d="M12 12h64v62H12z"/><path class="s" d="M12 12h64v62H12z"/><path class="hatch" d="M18 18h52v50H18z" style="opacity:.3"/><path class="s" d="M18 18h52v50H18z"/>' +
      '<path class="s" d="M30 34v10"/><circle class="sp" cx="30" cy="31" r="4.5"/><circle class="s" cx="30" cy="31" r="4.5"/>' +
      brush(54, 39, .6, -22);
  });

  /* 11. a fresh hub: Timmy opens a brand-new notebook to its first blank page; a sharpened pencil waits beside it */
  A.register("empty-first", function(){
    return ground(92, 36) + timmy(15, 4, .64) +
      '<path class="s" d="M26 48c-4 8-2 16 4 22M74 48c4 8 2 16-4 22"/>' +
      '<path class="sp2" d="M18 72c10-6 22-6 32 0 10-6 22-6 32 0v14c-10-6-22-6-32 0-10-6-22-6-32 0z"/>' +
      '<path class="b" d="M20 70c9-5 20-5 30 0 10-5 21-5 30 0v12c-9-5-20-5-30 0-10-5-21-5-30 0z"/><path class="s" d="M20 70c9-5 20-5 30 0 10-5 21-5 30 0v12c-9-5-20-5-30 0-10-5-21-5-30 0zM50 70v12"/>' +
      '<path class="g" d="M56 74c6-2 12-2 18-1M56 78c6-2 12-2 18-1"/>' +
      pencil(84, 60, 94, 86);
  });

  /* 12. no drill today: the cottage window at night, a crescent moon and three Z's; tomorrow is circled on the calendar leaf on the sill */
  A.register("empty-drill", function(){
    return '<path class="b" d="M22 10h56v60H22z"/><path class="s" d="M22 10h56v60H22z"/>' +
      '<path class="sp2" d="M28 16h44v48H28z"/><path class="s" d="M28 16h44v48H28zM50 16v48M28 40h44"/>' +
      '<path class="b" d="M44 24a7 7 0 1 0 0 12 5.5 5.5 0 0 1 0-12z"/><path class="s" d="M44 24a7 7 0 1 0 0 12 5.5 5.5 0 0 1 0-12z"/>' +
      '<path class="b" d="M56 32h6l-6 6h6M62 24h5l-5 5h5M66 18h4l-4 4h4" style="fill:none"/><path class="s" d="M56 32h6l-6 6h6M62 24h5l-5 5h5M66 18h4l-4 4h4"/>' +
      '<path class="b" d="M16 70h68v8H16z"/><path class="hatch" d="M16 70h68v8H16z" style="opacity:.35"/><path class="s" d="M16 70h68v8H16z"/>' +
      '<path class="b" d="M58 48h24v22H58z"/><path class="s" d="M58 48h24v22H58z"/><path class="sp2" d="M58 48h24v6H58z"/><path class="s" d="M58 48h24v6H58z"/>' +
      '<path class="s" d="M63 59h2M69 59h2M75 59h2M63 65h2M75 65h2"/><circle class="s" cx="70" cy="65" r="3.4"/><circle class="sp" cx="70" cy="65" r="2"/>' +
      ground(90, 30);
  });

  /* 13. nothing matches: Timmy peers at the ground through a magnifying glass; the rabbit's ears poke up behind the hill */
  A.register("empty-search", function(){
    return '<path class="b" d="M8 90c14-18 36-18 52-6 10 8 20 10 32 4v4H8z"/><path class="hatch" d="M52 80c6 4 12 6 18 6-6 0-12 2-18 4z" style="opacity:.4"/><path class="s" d="M8 90c14-18 36-18 52-6 10 8 20 10 32 4"/>' +
      '<path class="b" d="M72 62c-2-14-6-28-1-30s7 16 7 30zM82 60c0-14 4-28 9-28s2 16-1 30z"/><path class="s" d="M72 62c-2-14-6-28-1-30s7 16 7 30zM82 60c0-14 4-28 9-28s2 16-1 30z"/>' +
      '<path class="sp" d="M75 58c-1-10-3-20 0-22s4 12 4 22zM84 56c1-10 4-20 7-21s0 12-2 21z" style="opacity:.6"/>' +
      '<g transform="rotate(-10 40 50)">' + timmy(6, 12, .64) + '</g>' +
      '<path class="s" d="M22 50c-6 4-10 6-10 14M66 54c4 4 6 8 8 14"/>' +
      '<path class="s" d="M70 68l8 10"/><path class="sp" d="M76 76l6 7-3 2-6-7z"/><path class="s" d="M76 76l6 7-3 2-6-7z"/>' +
      '<circle class="b" cx="62" cy="60" r="11" style="opacity:.6"/><circle class="s" cx="62" cy="60" r="11"/><circle class="s" cx="62" cy="60" r="8"/><path class="s" d="M56 57c1-2 3-4 6-5" style="opacity:.6"/>';
  });
})();

/* ================= the dashboard's classes and the About page's parts (group B) ================= */
(function(){
  var A = window.shArt, molar = A.molar, face = A.face, ground = A.ground;
  /* a small Timmy: the whole character scaled down, with the line weight held at the hand's 1.7 (a scaled stroke
     would thin out), so he reads like the big one */
  function timmy(ox, oy, k, mood){
    return A.timmy(ox, oy, k, mood);
  }

  /* ---------- the seven classes (dashboard cards, 40 px) ---------- */
  A.register("class-implants", function(){
    return '<path class="b" d="M12 52h76v36H12z"/><path class="hatch" d="M16 56h68v28H16z" style="opacity:.45"/><path class="s" d="M12 52h76v36H12z"/>' +
      '<path class="sp2" d="M41 50h18l-3 32c0 3-3 5-6 5s-6-2-6-5z"/><path class="s" d="M41 50h18l-3 32c0 3-3 5-6 5s-6-2-6-5zM42 57h16M42 63h15M43 69h14M43 75h13M44 81h11"/>' +
      '<path class="sp2" d="M44 40h12l2 10H42z"/><path class="s" d="M44 40h12l2 10H42z"/>' +
      '<path class="sp" d="M28 52c6-5 38-5 44 0v4H28z"/><path class="s" d="M28 52c6-5 38-5 44 0"/>' +
      '<path class="b" d="M31 40c-3-14 4-24 12-24 4 0 6 2 7 4 1-2 3-4 7-4 8 0 15 10 12 24z"/><path class="hatch" d="M31 40c-3-14 4-24 12-24 2 0 3 0 4 1-6 2-10 10-7 23z" style="opacity:.5"/>' +
      '<path class="s" d="M31 40c-3-14 4-24 12-24 4 0 6 2 7 4 1-2 3-4 7-4 8 0 15 10 12 24zM38 28c3 2 7 2 10 0M52 28c3 2 7 2 10 0"/>';
  });
  A.register("class-spc", function(){
    return '<path class="b" d="M54 60L74 28c2-4 8-5 11-2s4 8 1 11L66 66z"/><path class="hatch" d="M60 62l20-28c2-2 4-3 6-3L66 66z" style="opacity:.45"/><path class="s" d="M54 60L74 28c2-4 8-5 11-2s4 8 1 11L66 66z"/>' +
      '<path class="sp2" d="M78 16c7-2 13 4 11 11l-2 5-12-8z"/><path class="s" d="M78 16c7-2 13 4 11 11l-2 5-12-8z"/>' +
      '<path class="b" d="M10 58h50l6 8c2 3 0 6-3 6H14c-4 0-6-2-6-5 0-4 1-9 2-9z"/><path class="hatch" d="M10 58h8v14h-4c-4 0-6-2-6-5 0-4 1-9 2-9z" style="opacity:.45"/><path class="s" d="M10 58h50l6 8c2 3 0 6-3 6H14c-4 0-6-2-6-5 0-4 1-9 2-9z"/>' +
      '<path class="sp2" d="M20 48h26c2 0 3 1 3 3v7H17v-7c0-2 1-3 3-3z"/><path class="s" d="M20 48h26c2 0 3 1 3 3v7H17v-7c0-2 1-3 3-3zM17 53h32"/>' +
      '<path class="sp" d="M62 44c-4-5 1-11 6-7 5-4 10 2 6 7l-6 6z"/><path class="s" d="M62 44c-4-5 1-11 6-7 5-4 10 2 6 7l-6 6z"/>' +
      '<path class="s" d="M40 72v10M24 86h32"/>' + ground(90, 38);
  });
  A.register("class-hemeendo", function(){
    return '<path class="s" d="M40 16h14M40 24h14M40 32h14M40 40h14M40 48h14"/>' +
      '<path class="b" d="M28 22c-9 0-13 10-13 20s4 20 13 20 12-10 12-20-3-20-12-20zM66 22c9 0 13 10 13 20s-4 20-13 20-12-10-12-20 3-20 12-20z"/>' +
      '<path class="hatch" d="M28 22c-9 0-13 10-13 20s4 20 13 20c-4-6-5-14-5-20s1-14 5-20zM66 22c9 0 13 10 13 20s-4 20-13 20c4-6 5-14 5-20s-1-14-5-20z" style="opacity:.45"/>' +
      '<path class="s" d="M28 22c-9 0-13 10-13 20s4 20 13 20 12-10 12-20-3-20-12-20zM66 22c9 0 13 10 13 20s-4 20-13 20-12-10-12-20 3-20 12-20z"/>' +
      '<path class="b" d="M40 44c3-3 11-3 14 0v8c-3-3-11-3-14 0z"/><path class="s" d="M40 44c3-3 11-3 14 0v8c-3-3-11-3-14 0z"/>' +
      '<circle class="sp" cx="76" cy="76" r="10"/><path class="s" d="M66 76a10 10 0 1 0 20 0 10 10 0 1 0-20 0zM70 76c2-2 10-2 12 0"/>' +
      '<circle class="sp" cx="54" cy="82" r="7"/><path class="s" d="M47 82a7 7 0 1 0 14 0 7 7 0 1 0-14 0zM50 82c1.5-1.5 6.5-1.5 8 0"/>';
  });
    A.register("class-gi", function(){
    return '<g transform="rotate(-42 50 52)"><path class="b" d="M8 46c-4-6 2-12 8-9 2 1 3 2 4 4h60c1-2 2-3 4-4 6-3 12 3 8 9-1 2-2 3-4 4 2 1 3 2 4 4 4 6-2 12-8 9-2-1-3-2-4-4H20c-1 2-2 3-4 4-6 3-12-3-8-9 1-2 2-3 4-4-2-1-3-2-4-4z"/>' +
      '<path class="hatch" d="M20 50h60v4H20z" style="opacity:.4"/><path class="s" d="M8 46c-4-6 2-12 8-9 2 1 3 2 4 4h60c1-2 2-3 4-4 6-3 12 3 8 9-1 2-2 3-4 4 2 1 3 2 4 4 4 6-2 12-8 9-2-1-3-2-4-4H20c-1 2-2 3-4 4-6 3-12-3-8-9 1-2 2-3 4-4-2-1-3-2-4-4z"/></g>' +
      '<path class="sp" d="M40 12h10v16H40z"/><path class="s" d="M40 12h10v16H40z"/>' +
      '<path class="b" d="M40 28c4-6 20-8 30-2 12 8 12 28 0 40-8 8-20 10-28 4-6-4-8-10-8-16 0-8 4-12 2-18-1-4-2-6 4-8z"/>' +
      '<path class="b" d="M34 54c-6 4-12 8-16 14l6 6c4-6 10-10 16-12z"/>' +
      '<path class="hatch" d="M70 26c12 8 12 28 0 40-8 8-20 10-28 4 10 2 20-2 26-10 8-10 8-24 2-34z" style="opacity:.45"/>' +
      '<path class="s" d="M40 28c4-6 20-8 30-2 12 8 12 28 0 40-8 8-20 10-28 4-6-4-8-10-8-16M34 54c-6 4-12 8-16 14l6 6c4-6 10-10 16-12M52 36c0 8 0 16-4 22M62 34c2 8 1 16-4 24"/>';
  });
  A.register("class-fixedpros", function(){
    return '<path class="b" d="M38 66h24l-3 18c-1 4-4 6-9 6s-8-2-9-6z"/><path class="hatch" d="M38 66h8l-1 18c0 3 1 5 3 6-5 0-8-2-9-6z" style="opacity:.45"/><path class="s" d="M38 66h24l-3 18c-1 4-4 6-9 6s-8-2-9-6z"/>' +
      '<path class="b" d="M40 50c0-3 4-5 10-5s10 2 10 5l3 16H37z"/><path class="s" d="M40 50c0-3 4-5 10-5s10 2 10 5l3 16H37z"/>' +
      '<path class="sp" d="M12 66c10-3 66-3 76 0v5H12z"/><path class="s" d="M12 66c10-3 66-3 76 0"/>' +
      '<path class="sp" d="M34 64c-4-1-6 2-5 5 1 2 4 2 6 0zM66 64c4-1 6 2 5 5-1 2-4 2-6 0z"/><path class="s" d="M34 64c-4-1-6 2-5 5 1 2 4 2 6 0zM66 64c4-1 6 2 5 5-1 2-4 2-6 0z"/>' +
      '<path class="b" d="M30 40c-3-14 5-26 13-26 4 0 6 2 7 4 1-2 3-4 7-4 8 0 16 12 13 26z"/><path class="hatch" d="M30 40c-3-14 5-26 13-26 2 0 3 0 4 1-6 3-10 12-7 25z" style="opacity:.5"/>' +
      '<path class="s" d="M30 40c-3-14 5-26 13-26 4 0 6 2 7 4 1-2 3-4 7-4 8 0 16 12 13 26zM38 26c3 2 7 2 10 0M52 26c3 2 7 2 10 0"/>';
  });
  A.register("class-occlusion", function(){
    return '<path class="b" d="M20 14h60v20l-6 10-6-10-6 10-6-10-6 10-6-10-6 10-6-10-6 10-6-10z"/><path class="sp2" d="M20 14h60v10H20z"/><path class="hatch" d="M20 24h8l6 10-6 10-2-4z" style="opacity:.4"/>' +
      '<path class="s" d="M20 14h60v20l-6 10-6-10-6 10-6-10-6 10-6-10-6 10-6-10-6 10-6-10zM20 24h60"/>' +
      '<path class="b" d="M20 86h60V66l-6-10-6 10-6-10-6 10-6-10-6 10-6-10-6 10-6-10-6 10z"/><path class="sp2" d="M20 76h60v10H20z"/>' +
      '<path class="s" d="M20 86h60V66l-6-10-6 10-6-10-6 10-6-10-6 10-6-10-6 10-6-10-6 10zM20 76h60"/>' +
      '<path class="sp" d="M10 47h80v6H10z"/><path class="s" d="M10 47h80v6H10z"/>';
  });
  A.register("class-perio", function(){
    return '<path class="b" d="M38 44h24l-4 36c-1 5-4 8-8 8s-7-3-8-8z"/><path class="hatch" d="M38 44h8l-1 36c0 4 1 7 3 8-5 0-8-3-9-8z" style="opacity:.45"/><path class="s" d="M38 44h24l-4 36c-1 5-4 8-8 8s-7-3-8-8z"/>' +
      '<path class="b" d="M34 44c-2-14 4-28 12-30 2-1 6-1 8 0 8 2 14 16 12 30z"/><path class="hatch" d="M34 44c-2-14 4-28 12-30-5 6-8 18-6 30z" style="opacity:.5"/><path class="s" d="M34 44c-2-14 4-28 12-30 2-1 6-1 8 0 8 2 14 16 12 30zM44 20c2 2 10 2 12 0"/>' +
      '<path class="sp" d="M10 50c10-5 20-7 28-7l2 12c-10 0-20 2-30 6zM90 50c-10-5-20-7-28-7l-2 12c10 0 20 2 30 6z"/><path class="s" d="M10 50c10-5 20-7 28-7M90 50c-10-5-20-7-28-7M40 55c-10 0-20 2-30 6M60 55c10 0 20 2 30 6"/>' +
      '<path class="g" d="M10 68h26M64 68h26"/>' +
      '<path class="sp2" d="M60 56l20-36c1-2 4-3 6-2s3 4 2 6L68 60z"/><path class="s" d="M60 56l20-36c1-2 4-3 6-2s3 4 2 6L68 60zM70 40l6 3M74 33l6 3M78 26l6 3"/>';
  });

  /* ---------- the About page's parts (section headers, 64 px) ---------- */
    A.register("about-dashboard", function(){
    return '<path class="b" d="M70 8h22v18H70z"/><path class="hatch" d="M72 10h18v14H72z" style="opacity:.35"/><path class="s" d="M70 8h22v18H70zM81 8v18M70 17h22"/>' +
      '<path class="g" d="M6 82h88"/>' +
      '<g transform="rotate(-16 44 56)"><path class="b" d="M32 34h22v34H32z"/><path class="s" d="M32 34h22v34H32zM36 42h14M36 48h10"/></g>' +
      '<g transform="rotate(12 68 56)"><path class="b" d="M58 34h22v34H58z"/><path class="s" d="M58 34h22v34H58zM62 42h14M62 48h10"/></g>' +
      '<path class="b" d="M44 30h22v36H44z"/><path class="hatch" d="M44 30h4v36h-4z" style="opacity:.4"/><path class="s" d="M44 30h22v36H44zM50 40h12M50 46h12M50 52h8"/>' +
      '<path class="b" d="M28 62h56v20H28z"/><path class="hatch" d="M28 62h56v4H28z" style="opacity:.45"/><path class="s" d="M28 62h56v20H28z"/>' +
      '<path class="sp2" d="M8 60h16v20c0 2-1 2-3 2H11c-2 0-3 0-3-2z"/><path class="s" d="M8 60h16v20c0 2-1 2-3 2H11c-2 0-3 0-3-2zM24 64c4 0 6 2 6 5s-2 5-6 5M12 54c2-2 0-4 2-6M18 54c2-2 0-4 2-6"/>';
  });
  A.register("about-widget", function(){
    return '<path class="b" d="M26 54l-6-20c0-2 1-3 3-3h54c2 0 3 1 3 3l-6 20z"/><path class="hatch" d="M26 54l-6-20c0-2 1-3 3-3h6l4 23z" style="opacity:.4"/><path class="s" d="M26 54l-6-20c0-2 1-3 3-3h54c2 0 3 1 3 3l-6 20"/>' +
      '<path class="b" d="M30 50a9 9 0 1 1 18 0 9 9 0 0 1-18 0z"/><path class="s" d="M30 50a9 9 0 1 1 18 0 9 9 0 0 1-18 0zM46 56l8 8"/><circle class="shine" cx="36" cy="47" r="2"/>' +
      '<path class="b" d="M54 52a9 9 0 1 1 18 0 9 9 0 0 1-18 0z"/><path class="s" d="M54 52a9 9 0 1 1 18 0 9 9 0 0 1-18 0zM63 52v-6M63 52l4 3M60 40h6M63 40v3M70 44l3-3"/>' +
      '<path class="sp" d="M74 22l8 4-12 24-8-4z"/><path class="s" d="M74 22l8 4-12 24-8-4zM62 46l-2 8 6-4"/>' +
      '<path class="sp2" d="M20 56h60v28c0 2-1 3-3 3H23c-2 0-3-1-3-3z"/><path class="s" d="M20 56h60v28c0 2-1 3-3 3H23c-2 0-3-1-3-3zM40 56v-6c0-2 1-3 3-3h14c2 0 3 1 3 3v6M20 66h60"/>' + ground(92, 36);
  });
  A.register("about-modes", function(){
    return '<path class="b" d="M46 22h8v64h-8z"/><path class="hatch" d="M46 22h3v64h-3z" style="opacity:.45"/><path class="s" d="M46 22h8v64h-8z"/><circle class="b" cx="50" cy="18" r="4"/><path class="s" d="M46 18a4 4 0 1 0 8 0 4 4 0 1 0-8 0z"/>' +
      '<path class="sp" d="M46 26H18l-6 5 6 5h28z"/><path class="s" d="M46 26H18l-6 5 6 5h28"/>' +
      '<path class="b" d="M54 40h28l6 5-6 5H54z"/><path class="s" d="M54 40h28l6 5-6 5H54"/>' +
      '<path class="b" d="M46 54H24l-6 5 6 5h22z"/><path class="s" d="M46 54H24l-6 5 6 5h22"/>' +
      '<path class="b" d="M54 68h22l6 5-6 5H54z"/><path class="s" d="M54 68h22l6 5-6 5H54"/>' + ground(90, 30);
  });
  A.register("about-arcade", function(){
    return '<path class="b" d="M40 10h48v78H40z"/><path class="hatch" d="M80 10h8v78h-8z" style="opacity:.4"/><path class="s" d="M40 10h48v78H40z"/>' +
      '<path class="sp2" d="M40 10h48v10H40z"/><path class="s" d="M40 20h48"/>' +
      '<path class="sp2" d="M46 26h36v24H46z"/><path class="s" d="M46 26h36v24H46z"/>' +
      '<path class="sp" d="M60 32l6 4-4 6 4 2-8 6 2-6-4-2z"/>' +
      '<path class="b" d="M30 58h58v8H30z"/><path class="s" d="M30 58h58v8H30zM40 58V50"/>' +
      '<path class="s" d="M42 58V46"/><circle class="sp" cx="42" cy="44" r="4"/><path class="s" d="M38 44a4 4 0 1 0 8 0 4 4 0 1 0-8 0zM56 62h4M64 62h4"/>' +
      '<path class="b" d="M8 72h24v16H8z"/><path class="hatch" d="M8 72h24v3H8z" style="opacity:.45"/><path class="s" d="M8 72h24v16H8z"/>' +
      timmy(4, 44, .34, "o") + '<path class="s" d="M28 58c4-4 8-8 14-10"/>' + ground(92, 44);
  });
    A.register("about-progress", function(){
    return '<path class="sp" d="M40 6h8l6 28-8 2zM60 6h-8l-6 28 8 2z"/><path class="hatch" d="M40 6h3l9 28-4 2z" style="opacity:.4"/><path class="s" d="M40 6h8l6 28-8 2zM60 6h-8l-6 28 8 2z"/>' +
      '<path class="b" d="M50 34a12 12 0 1 1 0 24 12 12 0 0 1 0-24z"/><path class="hatch" d="M50 34a12 12 0 0 0 0 24c-6-4-8-8-8-12s2-8 8-12z" style="opacity:.4"/><path class="s" d="M50 34a12 12 0 1 1 0 24 12 12 0 0 1 0-24z"/>' +
      '<path class="sp2" d="M46 36h8v22c0 2-1 3-3 3h-2c-2 0-3-1-3-3z"/><path class="s" d="M46 36h8v22c0 2-1 3-3 3h-2c-2 0-3-1-3-3zM47 44h6M47 50h6M50 61v6M50 67l-4 2M50 67l4 2"/>' +
      '<path class="s" d="M24 88c-10-10-10-30-2-42M76 88c10-10 10-30 2-42"/>' +
      '<path class="b" d="M20 56c-4 0-7-3-7-7 4 0 7 3 7 7zM18 68c-4 1-8-1-9-5 4-1 8 1 9 5zM22 80c-4 2-8 1-10-3 4-2 8-1 10 3zM80 56c4 0 7-3 7-7-4 0-7 3-7 7zM82 68c4 1 8-1 9-5-4-1-8 1-9 5zM78 80c4 2 8 1 10-3-4-2-8-1-10 3z"/>' +
      '<path class="s" d="M20 56c-4 0-7-3-7-7 4 0 7 3 7 7zM18 68c-4 1-8-1-9-5 4-1 8 1 9 5zM22 80c-4 2-8 1-10-3 4-2 8-1 10 3zM80 56c4 0 7-3 7-7-4 0-7 3-7 7zM82 68c4 1 8-1 9-5-4-1-8 1-9 5zM78 80c4 2 8 1 10-3-4-2-8-1-10 3z"/>';
  });
  A.register("about-timmy", function(){
    return '<path class="b" d="M2 94c20-18 50-24 96-14v14H2z"/><path class="hatch" d="M2 94c20-18 50-24 96-14v4C54 76 24 82 2 94z" style="opacity:.4"/><path class="s" d="M2 94c20-18 50-24 96-14"/>' +
      '<path class="b" d="M34 46h52v34H34z"/><path class="hatch" d="M34 46h6v34h-6z" style="opacity:.4"/><path class="s" d="M34 46h52v34H34z"/>' +
      '<path class="sp2" d="M28 46L60 18l32 28z"/><path class="hatch" d="M28 46L60 18l6 5-26 23z" style="opacity:.45"/><path class="s" d="M28 46L60 18l32 28z"/>' +
      '<path class="b" d="M74 24h8v12l-8-7z"/><path class="s" d="M74 24h8v12M80 20c-2-3 2-5 0-8"/>' +
      '<path class="sp2" d="M40 54h10v10H40z"/><path class="s" d="M40 54h10v10H40zM45 54v10M40 59h10"/>' +
      '<path class="hatch" d="M54 56h16v24H54z" style="opacity:.6"/><path class="s" d="M54 56h16v24"/>' +
      '<path class="sp" d="M54 56l-8 4v24l8-4z"/><path class="s" d="M54 56l-8 4v24l8-4z"/>' +
      timmy(53, 55, .26, "") + '<path class="s" d="M68 64c3-3 5-6 6-10"/>' +
      '<path class="b" d="M78 58h4v24h-4z"/><path class="s" d="M78 58h4v24h-4z"/><path class="sp" d="M76 50h8v9h-8z"/><path class="s" d="M76 50h8v9h-8zM78 50v9M82 50v9"/>';
  });
  A.register("about-eggs", function(){
    return '<path class="s" d="M24 52c4-18 48-18 52 0"/>' +
      '<path class="sp" d="M30 22l16 26-4 2-16-24c-2-2 2-6 4-4z"/><path class="s" d="M30 22l16 26-4 2-16-24c-2-2 2-6 4-4z"/>' +
      '<path class="s" d="M70 48L62 28"/><path class="sp" d="M62 28l-3-8 6 4 6-4-3 8 4 4h-7l-6 2 2-6z"/><path class="s" d="M62 28l-3-8 6 4 6-4-3 8 4 4h-7l-6 2 2-6z"/>' +
      '<path class="b" d="M40 50c0-8 5-14 10-14s10 6 10 14z"/><path class="s" d="M40 50c0-8 5-14 10-14s10 6 10 14"/>' +
      '<path class="b" d="M16 52h68l-6 32H22z"/><path class="hatch" d="M16 52h68l-6 32H22z" style="opacity:.3"/><path class="s" d="M16 52h68l-6 32H22zM20 62h60M22 72h56M34 52l2 32M50 52v32M66 52l-2 32"/>' +
      '<path class="b" d="M4 84l4-6 4 4 4-6 4 6 4-4 4 6v8H4z"/><path class="s" d="M4 84l4-6 4 4 4-6 4 6 4-4 4 6v8H4z"/>' + timmy(6, 66, .17, "o") + ground(94, 44);
  });
  A.register("about-seasons", function(){
    return timmy(10, 6, .8, "") +
      '<path class="sp" d="M26 58c12 7 36 7 48 0l2 7c-14 7-38 7-52 0z"/><path class="hatch" d="M26 58c12 7 36 7 48 0l2 7c-14 7-38 7-52 0z" style="opacity:.3"/><path class="s" d="M26 58c12 7 36 7 48 0l2 7c-14 7-38 7-52 0z"/>' +
      '<path class="sp" d="M70 62l8 1-2 16c-3 0-5-1-7-3z"/><path class="s" d="M70 62l8 1-2 16c-3 0-5-1-7-3zM72 66l4 1"/>' +
      '<path class="b" d="M6 26c6-10 16-10 20 0-4 10-14 10-20 0z"/><path class="hatch" d="M6 26c6-10 16-10 20 0-6 0-12 0-20 0z" style="opacity:.4"/><path class="s" d="M6 26c6-10 16-10 20 0-4 10-14 10-20 0zM8 26h16M26 26l6 4"/>' +
      '<path class="s" d="M86 18v20M76 28h20M79 21l14 14M93 21L79 35M86 20l-3 3M86 20l3 3M86 36l-3-3M86 36l3-3M78 28l3-3M78 28l3 3M94 28l-3-3M94 28l-3 3"/>';
  });
  A.register("about-trophies", function(){
    return '<path class="b" d="M8 64h84v8H8z"/><path class="hatch" d="M8 68h84v4H8z" style="opacity:.5"/><path class="s" d="M8 64h84v8H8zM16 72l-4 10M84 72l4 10"/>' +
      '<path class="b" d="M18 30h20v14c0 8-4 14-10 14s-10-6-10-14z"/><path class="hatch" d="M18 30h6v14c0 8 2 13 5 14-7 0-11-6-11-14z" style="opacity:.45"/><path class="s" d="M18 30h20v14c0 8-4 14-10 14s-10-6-10-14zM18 34h-6c0 7 3 10 7 11M38 34h6c0 7-3 10-7 11M28 58v6M22 64h12"/>' +
      '<path class="sp" d="M42 24h24v18c0 8-5 16-12 16s-12-8-12-16z"/><path class="hatch" d="M42 24h7v18c0 8 2 14 5 16-7 0-12-8-12-16z" style="opacity:.4"/><path class="s" d="M42 24h24v18c0 8-5 16-12 16s-12-8-12-16zM42 28h-8c0 9 4 14 9 15M66 28h8c0 9-4 14-9 15M54 58v6M46 64h16M50 20h8l-4-6z"/>' +
      '<path class="b" d="M70 44h22c0 10-5 16-11 16s-11-6-11-16z"/><path class="hatch" d="M70 44h6c0 10 2 15 5 16-6 0-11-6-11-16z" style="opacity:.45"/><path class="s" d="M70 44h22c0 10-5 16-11 16s-11-6-11-16zM81 60v4M74 64h14"/>' +
      '<path class="sp2" d="M40 78h20v12H40z"/><path class="s" d="M40 78h20v12H40z"/>' + timmy(42, 77, .16, "") ;
  });
})();

/* Group C of the art kit: the four hub Home friezes (300 x 60) and the answer-feedback marks. Same hand as widget/art.js
   (tools/art/README.md). A frieze is a still life of the course's things on a bench, one in spot color, Timmy small at
   the right end. Merged into art.js by the main session. */
(function(){
  var A = window.shArt;

  /* a path scaled by k and moved by (ox, oy) without a transform, so the line keeps the hand's one weight
     (only M/m, c, s, l, h, v, z are used in the kit's paths) */
  function scaled(d, ox, oy, k){
    var out = "", cmd = "", abs = false, i = 0;
    var tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+/g);
    var nums = [];
    function flush(){
      if (!cmd) return;
      var s = cmd, j;
      if (cmd === "h") { for (j = 0; j < nums.length; j++) s += (j ? " " : "") + r1(nums[j] * k); }
      else if (cmd === "v") { for (j = 0; j < nums.length; j++) s += (j ? " " : "") + r1(nums[j] * k); }
      else if (cmd === "H") { for (j = 0; j < nums.length; j++) s += (j ? " " : "") + r1(nums[j] * k + ox); }
      else if (cmd === "V") { for (j = 0; j < nums.length; j++) s += (j ? " " : "") + r1(nums[j] * k + oy); }
      else { for (j = 0; j < nums.length; j++) s += (j ? " " : "") + r1(nums[j] * k + (abs ? (j % 2 ? oy : ox) : 0)); }
      out += s; nums = [];
    }
    function r1(n){ return String(Math.round(n * 10) / 10); }
    for (; i < tokens.length; i++) {
      var t = tokens[i];
      if (/[a-zA-Z]/.test(t)) { flush(); cmd = t; abs = t === t.toUpperCase() && t !== "z" && t !== "Z"; if (t === "z" || t === "Z") { out += t; cmd = ""; } }
      else nums.push(parseFloat(t));
    }
    flush();
    return out;
  }
  var MOLAR = "M22 38c-3-16 6-27 17-27 6 0 9 3 11 6 2-3 5-6 11-6 11 0 20 11 17 27-1 8-4 14-4 22 0 14-4 26-10 26-5 0-7-12-8-18-1-5-3-7-6-7s-5 2-6 7c-1 6-3 18-8 18-6 0-10-12-10-26 0-8-3-14-4-22z";
  var MOLAR_HATCH = "M22 38c-3-16 6-27 17-27 3 0 5 1 7 2-6 2-12 10-9 25 1 8 4 14 4 22 0 10 2 18 4 22-5-1-9-13-9-26 0-8-3-14-4-22z";
  var MOLAR_CUSPS = "M35 24c4 3 9 3 15 0M50 24c4 3 10 3 15 0";
  /* a small Timmy for a frieze: the molar at scale k (k .5 is 28 wide, 40 tall, feet on oy + 45) and his face */
  function tim(ox, oy, k, mood){ return A.timmy(ox, oy, k, mood); }
  function bench(){ return '<path class="g" d="M6 52h288"/>'; }
  function arc(cx, cy, r, a1, a2){
    var p = function(a){ a = a * Math.PI / 180; return (cx + r * Math.cos(a)).toFixed(1) + " " + (cy + r * Math.sin(a)).toFixed(1); };
    return "M" + p(a1) + "A" + r + " " + r + " 0 " + (a2 - a1 > 180 ? 1 : 0) + " 1 " + p(a2);
  }

  /* ---------- Occlusion: the articulator bench ---------- */
  A.register("band-occlusion", function(){
    return bench() +
      /* a semi-adjustable articulator, side view: lower member, condylar post and hinge, upper member, incisal pin, two mounted casts */
      '<path class="b" d="M12 50v-5h44v5z"/><path class="hatch" d="M12 50v-5h10v5z" style="opacity:.5"/><path class="s" d="M12 50v-5h44v5z"/>' +
      '<path class="b" d="M50 45V20h6v25z"/><path class="s" d="M50 45V20h6v25z"/>' +
      '<path class="b" d="M12 20v-5h44v5z"/><path class="s" d="M12 20v-5h44v5zM56 17a3.5 3.5 0 1 0 0 .1"/>' +
      '<path class="s" d="M17 20v24M13 44h8"/>' +
      '<path class="b" d="M24 20h24l-2 11H26z"/><path class="hatch" d="M24 20h7l-2 11h-3z" style="opacity:.5"/><path class="s" d="M24 20h24l-2 11H26zM28 28c3 3 6 3 9 0s6 3 9 0"/>' +
      '<path class="b" d="M26 34h20l2 11H24z"/><path class="hatch" d="M26 34h6l-3 11h-5z" style="opacity:.5"/><path class="s" d="M26 34h20l2 11H24zM28 36c3-3 6-3 9 0s6-3 9 0"/>' +
      /* a facebow from above: the bow, ear pieces, the bite fork rising from the front */
      '<path class="b" d="M66 48c0-17 10-28 24-28s24 11 24 28h-4c0-14-8-24-20-24S70 34 70 48z"/><path class="hatch" d="M66 48c0-17 10-28 24-28-10 2-20 10-20 28z" style="opacity:.5"/><path class="s" d="M66 48c0-17 10-28 24-28s24 11 24 28h-4c0-14-8-24-20-24S70 34 70 48z"/><circle class="b" cx="68" cy="48" r="3"/><circle class="s" cx="68" cy="48" r="3"/><circle class="b" cx="112" cy="48" r="3"/><circle class="s" cx="112" cy="48" r="3"/>' +
      '<circle class="sp2" cx="90" cy="22" r="3"/><circle class="s" cx="90" cy="22" r="3"/><path class="s" d="M90 25v9"/><path class="b" d="M80 44c0-7 4-10 10-10s10 3 10 10h-4c0-4-2-6-6-6s-6 2-6 6z"/><path class="s" d="M80 44c0-7 4-10 10-10s10 3 10 10h-4c0-4-2-6-6-6s-6 2-6 6z"/>' +
      /* a folded strip of articulating paper (the spot) */
      '<path class="sp" d="M118 50l7-15h28l-7 15z"/><path class="hatch" d="M118 50l7-15h4l-7 15z" style="opacity:.5"/><path class="b" d="M146 42l7-7-2 9c-2-1-4-1-5-2z"/>' +
      '<path class="s" d="M118 50l7-15h28l-7 15zM146 42l7-7-2 9M124 46h20M127 41h20"/>' +
      /* a wax bite record, a horseshoe with the teeth pressed in */
      '<path class="b" d="M160 48V34c3 3 6-3 9 0s6-3 9 0 6-3 9 0 6-3 9 0v14c-3-3-6 3-9 0s-6 3-9 0-6 3-9 0-6 3-9 0z"/><path class="hatch" d="M160 48V34c3 3 6-3 9 0v14c-3-3-6 3-9 0z" style="opacity:.5"/>' +
      '<path class="s" d="M160 48V34c3 3 6-3 9 0s6-3 9 0 6-3 9 0 6-3 9 0v14c-3-3-6 3-9 0s-6 3-9 0-6 3-9 0-6 3-9 0zM160 48l-1 3h38l-1-3"/>' +
      /* the TMJ: the condyle under the fossa and the eminence, on its neck */
      '<path class="b" d="M207 33c-2 5-2 11 3 13 8 3 20 3 27 1 3-1 3-5 3-19l-3-1c-2 4-5 4-8-1-2 3-3 6-5 8-5-1-11-1-17-1z"/><path class="hatch" d="M237 28c0 14 0 18-3 19-3 1-8 1-12 1 6-1 10-2 12-4 1-3 1-10 1-15z" style="opacity:.5"/>' +
      '<path class="s" d="M207 33c-2 5-2 11 3 13 8 3 20 3 27 1 3-1 3-5 3-19l-3-1c-2 4-5 4-8-1-2 3-3 6-5 8-5-1-11-1-17-1zM210 33c2-3 4-3 6 0M216 33c2-3 4-3 6 0"/>' +
      '<circle class="b" cx="240" cy="25" r="3.5"/><circle class="s" cx="240" cy="25" r="3.5"/><path class="s" d="M233 19c2-5 12-5 14 0"/>' +
      /* Timmy with a plain bite stick */
      tim(256, 5, .5) + '<path class="b" d="M286 44l6-18c1-3 5-2 4 1l-6 18c-1 3-5 2-4-1z"/><path class="s" d="M286 44l6-18c1-3 5-2 4 1l-6 18c-1 3-5 2-4-1z"/>';
  }, { w: 300, h: 60 });

  /* ---------- Periodontology: the perio tray ---------- */
  A.register("band-perio", function(){
    return bench() +
      /* a periodontal probe: the handle, the shank, the tip with its bands */
      '<path class="b" d="M9 47l22-18c1.5-1.2 3.6.8 2.6 2.4L13 50c-1.6 1.2-3.8-.8-3-2.6z"/><path class="hatch" d="M9 47l22-18c.6-.5 1.4-.4 2 .1L12 49c-.6.2-1.4-.2-2-.9z" style="opacity:.5"/>' +
      '<path class="s" d="M9 47l22-18c1.5-1.2 3.6.8 2.6 2.4L13 50c-1.6 1.2-3.8-.8-3-2.6zM33 30l6-3M39 27l9-11M41 25l1.4 1M43 22.5l1.4 1M45 20l1.4 1M47 17.5l1.4 1"/>' +
      /* a typodont: three crowns in the gum */
      '<path class="sp2" d="M58 50V36c0-3 2-5 5-5h32c3 0 5 2 5 5v14z"/><path class="s" d="M58 50V36c0-3 2-5 5-5h32c3 0 5 2 5 5v14"/>' +
      '<path class="b" d="M61 34c0-8 2-12 6-12s6 4 6 12c-2 1-4 1-6 1s-4 0-6-1zM73 33c0-8 2-12 6-12s6 4 6 12c-2 1-4 1-6 1s-4 0-6-1zM85 34c0-8 2-12 6-12s6 4 6 12c-2 1-4 1-6 1s-4 0-6-1z"/>' +
      '<path class="s" d="M61 34c0-8 2-12 6-12s6 4 6 12M73 33c0-8 2-12 6-12s6 4 6 12M85 34c0-8 2-12 6-12s6 4 6 12M59 36c3-3 5-3 8-1 3-2 5-2 8 0 3-2 5-2 8 0 3-2 5-2 8 0 2-2 4-2 7 1M64 27c2 2 4 2 6 0M76 26c2 2 4 2 6 0M88 27c2 2 4 2 6 0"/>' +
      /* disclosing tablets (the spot): the bottle and two tablets beside it */
      '<path class="sp" d="M112 50V29c0-2 1-3 3-3h14c2 0 3 1 3 3v21z"/><path class="hatch" d="M112 50V29c0-2 1-3 3-3h3c-2 0-3 1-3 3v21z" style="opacity:.6"/>' +
      '<path class="b" d="M115 35h14v8h-14zM117 26v-5h10v5z"/><path class="s" d="M112 50V29c0-2 1-3 3-3h14c2 0 3 1 3 3v21M115 35h14v8h-14zM117 26v-5h10v5M118 38h8M118 41h5"/>' +
      '<circle class="sp" cx="138" cy="47" r="3"/><circle class="sp" cx="145" cy="45" r="3"/><circle class="s" cx="138" cy="47" r="3"/><circle class="s" cx="145" cy="45" r="3"/>' +
      /* a floss spool with the thread out */
      '<circle class="b" cx="168" cy="39" r="11"/><path class="hatch" d="M168 28a11 11 0 0 0 0 22z" style="opacity:.5"/><circle class="s" cx="168" cy="39" r="11"/><circle class="s" cx="168" cy="39" r="3"/>' +
      '<path class="s" d="M177 33c5-5 9-7 14-8"/>' +
      /* a scaler and a curette crossed */
      '<path class="b" d="M196 50l34-26c2-1 4 1 3 3l-34 26c-2 1-4-1-3-3z"/><path class="s" d="M196 50l34-26c2-1 4 1 3 3l-34 26c-2 1-4-1-3-3zM232 25l7-5 3 2"/>' +
      '<path class="b" d="M240 50l-34-26c-2-1-4 1-3 3l34 26c2 1 4-1 3-3z"/><path class="s" d="M240 50l-34-26c-2-1-4 1-3 3l34 26c2 1 4-1 3-3zM204 25l-7-5c-2 1-2 3-1 5"/>' +
      /* Timmy */
      tim(258, 5, .5);
  }, { w: 300, h: 60 });

  /* ---------- PCD Implants: the implant bench ---------- */
  A.register("band-pcd-implants-exam1", function(){
    return bench() +
      /* an implant in a bone block, a collar above the bone */
      '<path class="b" d="M10 50V30c0-3 2-5 5-5h26c3 0 5 2 5 5v20z"/><path class="hatch" d="M10 50V30c0-3 2-5 5-5h5c-3 0-5 2-5 5v20zM36 25h5c3 0 5 2 5 5v20h-5V30c0-3-2-5-5-5z" style="opacity:.55"/>' +
      '<path class="s" d="M10 50V30c0-3 2-5 5-5h26c3 0 5 2 5 5v20"/>' +
      '<path class="b" d="M22 25h12l-2 18c0 2-1 3-4 3s-4-1-4-3z"/><path class="s" d="M22 25h12l-2 18c0 2-1 3-4 3s-4-1-4-3zM22.5 29h11M23 33h10M23.5 37h9M24 41h8"/>' +
      '<path class="sp2" d="M24 25v-5h8v5z"/><path class="s" d="M24 25v-5h8v5"/>' +
      /* a surgical guide: a clear stent over three crowns, a guide sleeve on the middle one */
      '<path class="sp2" d="M56 50V40c0-2 2-4 4-4h44c2 0 4 2 4 4v10z"/><path class="s" d="M56 50V40c0-2 2-4 4-4h44c2 0 4 2 4 4v10"/>' +
      '<path class="b" d="M60 38c0-7 2-10 7-10s7 3 7 10zM75 38c0-7 2-10 7-10s7 3 7 10zM90 38c0-7 2-10 7-10s7 3 7 10z"/>' +
      '<path class="s" d="M60 38c0-7 2-10 7-10s7 3 7 10M75 38c0-7 2-10 7-10s7 3 7 10M90 38c0-7 2-10 7-10s7 3 7 10"/>' +
      '<path class="s" d="M57 36c0-6 3-11 10-11 2 0 3 1 5 1 2-2 5-3 10-3s8 1 10 3c2 0 3-1 5-1 7 0 10 5 10 11"/>' +
      '<path class="b" d="M78 20h8v8h-8z"/><path class="hatch" d="M78 20h3v8h-3z" style="opacity:.5"/><path class="s" d="M78 20h8v8h-8zM82 16v4"/>' +
      /* a torque wrench: the handle with its scale, the ratchet head */
      '<path class="b" d="M114 48l34-22c2-1 4 1 3 3l-34 22c-2 1-4-1-3-3z"/><path class="hatch" d="M114 48l34-22c.6-.4 1.4-.3 2 .2L116 49c-.6.2-1.4-.1-2-1z" style="opacity:.45"/>' +
      '<path class="s" d="M114 48l34-22c2-1 4 1 3 3l-34 22c-2 1-4-1-3-3zM124 43l1 1.6M129 40l1 1.6M134 37l1 1.6M139 34l1 1.6"/>' +
      '<circle class="b" cx="152" cy="25" r="5.5"/><circle class="s" cx="152" cy="25" r="5.5"/><path class="s" d="M152 22.6l2.1 1.2v2.4l-2.1 1.2-2.1-1.2v-2.4zM147 28l-26 17"/>' +
      /* a CBCT slice framed like a small film: the ridge in cross-section, the planned implant, the canal */
      '<path class="sp2" d="M164 50V16h38v34z"/><path class="s" d="M164 50V16h38v34"/>' +
      '<path class="b" d="M170 48c0-14 6-21 13-21s13 7 13 21z"/><path class="s" d="M170 48c0-14 6-21 13-21s13 7 13 21M180 31h6l-1 13h-4zM191 40a2.2 2.2 0 1 0 0 .1"/>' +
      /* an abutment (the spot) between its implant platform and a crown */
      '<path class="b" d="M226 38h10l-1 9c0 2-2 3-4 3s-4-1-4-3z"/><path class="s" d="M226 38h10l-1 9c0 2-2 3-4 3s-4-1-4-3zM226.5 41h9M227 44h8M227.5 47h7"/>' +
      '<path class="sp" d="M225 38l2-8h8l2 8z"/><path class="s" d="M225 38l2-8h8l2 8z"/>' +
      '<path class="b" d="M217 30c-2-8 3-14 14-14s16 6 14 14c-4 2-9 3-14 3s-10-1-14-3z"/><path class="hatch" d="M217 30c-2-8 3-14 14-14-5 2-8 7-8 14-2 0-4-1-6-2z" style="opacity:.5"/>' +
      '<path class="s" d="M217 30c-2-8 3-14 14-14s16 6 14 14c-4 2-9 3-14 3s-10-1-14-3zM222 23c3 3 6 3 9 0s6 3 9 0"/>' +
      /* Timmy, the one with a ligament */
      tim(258, 5, .5);
  }, { w: 300, h: 60 });

  /* ---------- Special Patient Care: the calm room ---------- */
  A.register("band-special-patient-care", function(){
    return bench() +
      /* a reclined dental chair: headrest, back, seat and footrest on a base, a folded blanket (the spot) on the seat */
      '<path class="b" d="M8 30c0-4 4-6 8-5l12 3h30l8-6c2-1 4 0 4 2l-6 9H30l-4 6H14c-4 0-6-2-6-5z"/><path class="hatch" d="M8 30c0-4 4-6 8-5l4 1-4 13h-2c-4 0-6-2-6-5z" style="opacity:.5"/>' +
      '<path class="s" d="M8 30c0-4 4-6 8-5l12 3h30l8-6c2-1 4 0 4 2l-6 9H30l-4 6H14c-4 0-6-2-6-5zM34 39v11M24 50h20"/>' +
      '<path class="sp" d="M38 28h18v-4H38zM40 24h14v-4H40z"/><path class="s" d="M38 28h18v-4H38zM40 24h14v-4H40zM56 28c3-1 4-4 2-6"/>' +
      /* a visual schedule: a strip of three picture cards on a holder */
      '<path class="b" d="M76 50V26h46v24z"/><path class="s" d="M76 50V26h46v24M76 32h46"/>' +
      '<path class="b" d="M80 46V36h10v10zM94 46V36h10v10zM108 46V36h10v10z"/><path class="hatch" d="M80 46V36h3v10z" style="opacity:.5"/>' +
      '<path class="s" d="M80 46V36h10v10zM94 46V36h10v10zM108 46V36h10v10zM85 29v0M99 29v0M113 29v0"/>' +
      '<circle class="eye" cx="85" cy="29" r="1.2"/><circle class="eye" cx="99" cy="29" r="1.2"/><circle class="eye" cx="113" cy="29" r="1.2"/>' +
      /* sunglasses and ear defenders */
      '<circle class="sp2" cx="138" cy="43" r="6"/><circle class="sp2" cx="154" cy="43" r="6"/><path class="hatch" d="M138 37a6 6 0 0 0 0 12z" style="opacity:.5"/>' +
      '<circle class="s" cx="138" cy="43" r="6"/><circle class="s" cx="154" cy="43" r="6"/><path class="s" d="M144 42h4M132 41l-6-4M160 41l6-4"/>' +
      '<path class="s" d="M172 46c0-11 6-17 14-17s14 6 14 17"/><path class="b" d="M169 42h6v9h-6zM197 42h6v9h-6z"/><path class="hatch" d="M169 42h2v9h-2zM197 42h2v9h-2z" style="opacity:.5"/><path class="s" d="M169 42h6v9h-6zM197 42h6v9h-6z"/>' +
      /* a mouth prop with its safety cord */
      '<path class="b" d="M212 50l6-16c1-2 4-2 5 0l6 16z"/><path class="hatch" d="M212 50l6-16c.5-1 1.5-1.5 2.5-1.5l-4 17.5z" style="opacity:.5"/>' +
      '<path class="s" d="M212 50l6-16c1-2 4-2 5 0l6 16M224 36c3-4 7-5 11-3"/>' +
      /* a small calendar with one day circled */
      '<path class="b" d="M232 50V28h20v22z"/><path class="sp2" d="M232 33v-5h20v5z"/><path class="s" d="M232 50V28h20v22M232 33h20M236 28v-3M248 28v-3"/>' +
      '<circle class="eye" cx="236" cy="38" r="1"/><circle class="eye" cx="242" cy="38" r="1"/><circle class="eye" cx="248" cy="38" r="1"/><circle class="eye" cx="236" cy="44" r="1"/><circle class="eye" cx="248" cy="44" r="1"/>' +
      '<circle class="s" cx="242" cy="44" r="3"/><circle class="eye" cx="242" cy="44" r="1"/>' +
      /* Timmy */
      tim(258, 5, .5);
  }, { w: 300, h: 60 });

  /* ---------- the feedback marks (100 x 100) ---------- */
  /* a right answer: six pen flicks out from the center and three spot dots between them */
  A.register("spark", function(){
    var s = "", i, a, p1, p2, c;
    for (i = 0; i < 6; i++) {
      a = (-90 + i * 60) * Math.PI / 180;
      p1 = [50 + 16 * Math.cos(a), 50 + 16 * Math.sin(a)]; p2 = [50 + 36 * Math.cos(a), 50 + 36 * Math.sin(a)];
      c = [50 + 27 * Math.cos(a + .12), 50 + 27 * Math.sin(a + .12)];
      s += "M" + p1[0].toFixed(1) + " " + p1[1].toFixed(1) + "Q" + c[0].toFixed(1) + " " + c[1].toFixed(1) + " " + p2[0].toFixed(1) + " " + p2[1].toFixed(1);
    }
    var dots = "";
    for (i = 0; i < 3; i++) {
      a = (-60 + i * 120) * Math.PI / 180;
      dots += '<circle class="sp" cx="' + (50 + 40 * Math.cos(a)).toFixed(1) + '" cy="' + (50 + 40 * Math.sin(a)).toFixed(1) + '" r="3.5"/>';
    }
    return '<path class="s" d="' + s + '"/>' + dots;
  });

  /* a lecture answered all right: an inked rubber stamp, two broken rings, a small molar and a check across it */
  A.register("stamp", function(){
    var rings = arc(50, 50, 42, -80, 60) + arc(50, 50, 42, 72, 180) + arc(50, 50, 42, 192, 268) +
      arc(50, 50, 35, -70, 40) + arc(50, 50, 35, 52, 200) + arc(50, 50, 35, 214, 282);
    var dots = "", i, a;
    for (i = 0; i < 8; i++) { a = (i * 45 + 22) * Math.PI / 180; dots += '<circle class="eye" cx="' + (50 + 38.5 * Math.cos(a)).toFixed(1) + '" cy="' + (50 + 38.5 * Math.sin(a)).toFixed(1) + '" r="1.1"/>'; }
    return '<g transform="rotate(-12 50 50)"><path class="s" d="' + rings + '"/>' + dots +
      '<path class="b" d="' + scaled(MOLAR, 29, 27, .42) + '"/><path class="hatch" d="' + scaled(MOLAR_HATCH, 29, 27, .42) + '" style="opacity:.6"/>' +
      '<path class="s" d="' + scaled(MOLAR, 29, 27, .42) + '"/><path class="s" d="' + scaled(MOLAR_CUSPS, 29, 27, .42) + '"/>' +
      '<path class="sp" d="M26 56l7-7 12 12 24-27 7 6-31 34z"/><path class="s" d="M26 56l7-7 12 12 24-27 7 6-31 34z"/></g>';
  });
})();
