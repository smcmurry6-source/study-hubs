/* study-hubs handpiece ranks: the art, tier names and trophy definitions, shared by the hub widget
   (widget/v3.js loads this file) and the dashboard. XP and tiers are computed on the server
   (migration_v15: sh_visitor_xp, get_rank_profile, get_rank_board); this file only draws them.

   shRanks.art(tier, px, { animate }) -> inline SVG string of that tier's handpiece
   shRanks.mini(tier)                 -> small icon for next to a name on a leaderboard
   shRanks.TIERS[tier]                -> { name, at, accent }                                   */
(function(){
  "use strict";
  if (window.shRanks) return;

  var TIERS = [
    { key: "stone",   name: "Stone",       at: 0,     accent: "#6F6A63" },
    { key: "antique", name: "Antique",     at: 300,   accent: "#8A5A32" },
    { key: "bronze",  name: "Bronze",      at: 1500,  accent: "#B0672B" },
    { key: "silver",  name: "Silver",      at: 5000,  accent: "#7D8792" },
    { key: "gold",    name: "Gold",        at: 12000, accent: "#B8860B" },
    { key: "diamond", name: "Diamond",     at: 25000, accent: "#2F9FD6" },
    { key: "dark",    name: "Dark Matter", at: 50000, accent: "#7A3CFF" }
  ];
  /* each tier has three levels (I, II, III); the server computes them too (sh_step, migration_v16) */
  var ROMAN = ["I", "II", "III"];
  function rankName(t, level){ return TIERS[t].name + (level ? " " + ROMAN[Math.max(1, Math.min(3, level)) - 1] : ""); }

  var uid = 0;

  /* cylinder shading stops, top edge -> bottom edge, per material */
  var METAL = {
    bronze:  ["#4A230D", "#9A5427", "#E09A5E", "#FFE0BE", "#C47A3E", "#7A3C16", "#3A1A08", "#B8703A"],
    silver:  ["#3A4047", "#8E98A3", "#E4E9EE", "#FFFFFF", "#B6BEC7", "#6A727C", "#2E343A", "#A7B0BA"],
    gold:    ["#5A3905", "#B58309", "#F6CD55", "#FFF6CF", "#E0A92A", "#946A08", "#4A2F04", "#D9A933"],
    stone:   ["#4A4640", "#8C867C", "#BDB6AB", "#DCD6CC", "#A7A095", "#767067", "#3E3A35", "#9A9489"],
    diamond: ["#5AA9DC", "#BDEBFF", "#F4FDFF", "#FFFFFF", "#CBEFFF", "#86CDEF", "#4E9BCF", "#E0F7FF"],
    dark:    ["#020008", "#12062B", "#2A0F5C", "#5B2BC0", "#1D0A40", "#0B0320", "#010005", "#3C1A86"],
    brass:   ["#3E2A0C", "#7C5A22", "#C69A4A", "#EBD39A", "#A8813C", "#6A4B1A", "#33230A", "#9C7836"],
    iron:    ["#1E1D1C", "#4A4745", "#7C7874", "#9E9A95", "#66625E", "#3A3836", "#191817", "#5C5956"]
  };
  function cyl(id, s){
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + s[0] + '"/><stop offset=".14" stop-color="' + s[1] + '"/>' +
      '<stop offset=".3" stop-color="' + s[2] + '"/><stop offset=".38" stop-color="' + s[3] + '"/>' +
      '<stop offset=".5" stop-color="' + s[4] + '"/><stop offset=".78" stop-color="' + s[5] + '"/>' +
      '<stop offset=".93" stop-color="' + s[6] + '"/><stop offset="1" stop-color="' + s[7] + '"/></linearGradient>';
  }

  /* ---------- the shape: a contra-angle high-speed handpiece, drawn along +x, centred on y=0 ---------- */
  function modernParts(p, rich){
    var F = 'url(#' + p + 'g)', FD = 'url(#' + p + 'gd)';
    var s = '';
    // bur
    s += '<path d="M9.5 9 L12.5 9 L12.2 24 L11 28 L9.8 24 Z" fill="url(#' + p + 'bur)"/>';
    if (rich) s += '<path d="M10 13 L12 14.5 M10 16.5 L12 18 M10 20 L12 21.5" stroke="rgba(0,0,0,.35)" stroke-width=".7"/>';
    // head
    s += '<rect x="0" y="-13" width="22" height="23" rx="8" fill="' + F + '"/>';
    s += '<rect x="2" y="-14.5" width="18" height="4.5" rx="2.2" fill="' + FD + '"/>';
    // neck
    s += '<path d="M19 -7 C28 -6 38 -3 47 -1 L47 14 C38 12 28 9 19 6 Z" fill="' + F + '"/>';
    // body
    s += '<rect x="44" y="-3" width="84" height="19" rx="9.5" fill="' + F + '"/>';
    // grip rings
    for (var i = 0; i < 6; i++) s += '<rect x="' + (54 + i * 3.6) + '" y="-3" width="1.5" height="19" fill="rgba(0,0,0,.28)"/>';
    s += '<rect x="84" y="-3.5" width="3" height="20" rx="1.2" fill="' + FD + '"/>';
    // coupling + hose
    s += '<rect x="125" y="0" width="13" height="13" rx="3" fill="' + FD + '"/>';
    s += '<rect x="137" y="2" width="9" height="9" rx="2" fill="' + F + '"/>';
    return s;
  }
  function modernMask(){
    return '<rect x="0" y="-14.5" width="22" height="24.5" rx="8"/>' +
      '<path d="M19 -7 C28 -6 38 -3 47 -1 L47 14 C38 12 28 9 19 6 Z"/>' +
      '<rect x="44" y="-3.5" width="94" height="20" rx="9.5"/><rect x="137" y="2" width="9" height="9" rx="2"/>' +
      '<path d="M9.5 9 L12.5 9 L12.2 24 L11 28 L9.8 24 Z"/>';
  }

  /* ---------- the antique: a straight handpiece with a turned wooden grip and a belt pulley ---------- */
  function antiqueParts(p, rich){
    var s = '';
    s += '<path d="M-6 3.5 L6 2.4 L6 6.6 Z" fill="url(#' + p + 'iron)"/>';                      // bur
    s += '<path d="M5 0 L24 -4 L24 13 L5 9 Z" fill="url(#' + p + 'brass)"/>';                   // nose cone
    s += '<rect x="23" y="-6" width="7" height="21" rx="2" fill="url(#' + p + 'brass)"/>';        // collar
    s += '<path d="M29 -5 C50 -9 84 -9 104 -5 L104 14 C84 18 50 18 29 14 Z" fill="url(#' + p + 'wood)"/>'; // grip
    if (rich) {
      s += '<path d="M29 -5 C50 -9 84 -9 104 -5 L104 14 C84 18 50 18 29 14 Z" fill="url(#' + p + 'g)" opacity=".55" style="mix-blend-mode:multiply"/>';
      for (var i = 0; i < 3; i++) s += '<rect x="' + (40 + i * 22) + '" y="-7" width="2.4" height="23" rx="1" fill="rgba(40,20,5,.45)"/>';
    }
    s += '<rect x="103" y="-5" width="8" height="19" rx="2" fill="url(#' + p + 'brass)"/>';       // ferrule
    s += '<rect x="110" y="1" width="16" height="7" rx="2" fill="url(#' + p + 'iron)"/>';        // shaft
    // pulley wheel with spokes
    s += '<circle cx="134" cy="4.5" r="12" fill="url(#' + p + 'iron)"/>';
    s += '<circle cx="134" cy="4.5" r="8.5" fill="none" stroke="rgba(0,0,0,.45)" stroke-width="1.2"/>';
    s += '<path d="M134 -7.5 V16.5 M122 4.5 H146 M125.5 -4 L142.5 13 M142.5 -4 L125.5 13" stroke="rgba(0,0,0,.4)" stroke-width="1.3"/>';
    s += '<circle cx="134" cy="4.5" r="2.6" fill="url(#' + p + 'brass)"/>';
    if (rich) s += '<path d="M146 -6 C152 -10 158 -14 162 -20" stroke="#5a4630" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/>';
    return s;
  }
  function antiqueMask(){
    return '<path d="M-6 3.5 L6 2.4 L6 6.6 Z"/><path d="M5 0 L24 -4 L24 13 L5 9 Z"/><rect x="23" y="-6" width="7" height="21" rx="2"/>' +
      '<path d="M29 -5 C50 -9 84 -9 104 -5 L104 14 C84 18 50 18 29 14 Z"/><rect x="103" y="-5" width="8" height="19" rx="2"/>' +
      '<rect x="110" y="1" width="16" height="7" rx="2"/><circle cx="134" cy="4.5" r="12"/>';
  }

  /* ---------- textures (filters) ---------- */
  function filters(p, t, rich){
    if (!rich) return '';
    var light = '<feGaussianBlur in="SourceAlpha" stdDeviation="1.6" result="b"/>' +
      '<feSpecularLighting in="b" surfaceScale="3.2" specularConstant="1.05" specularExponent="22" lighting-color="#fff" result="sp">' +
      '<fePointLight x="10" y="-80" z="70"/></feSpecularLighting>' +
      '<feComposite in="sp" in2="SourceAlpha" operator="in" result="spi"/>';
    var f = '';
    if (t === "bronze" || t === "silver" || t === "gold") {
      f = '<filter id="' + p + 'tex" x="-5%" y="-30%" width="110%" height="160%" color-interpolation-filters="sRGB">' +
        '<feTurbulence type="fractalNoise" baseFrequency="0.012 0.9" numOctaves="2" seed="4" result="n"/>' +
        '<feColorMatrix in="n" type="matrix" values="0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 1.4 -.45" result="streak"/>' +
        '<feComposite in="streak" in2="SourceAlpha" operator="in" result="st"/>' +
        '<feBlend in="SourceGraphic" in2="st" mode="overlay" result="brushed"/>' +
        light +
        '<feComposite in="brushed" in2="spi" operator="arithmetic" k1="0" k2="1" k3="' + (t === "silver" ? ".75" : ".6") + '" k4="0"/>' +
        '</filter>';
    } else if (t === "stone") {
      f = '<filter id="' + p + 'tex" x="-8%" y="-30%" width="116%" height="160%" color-interpolation-filters="sRGB">' +
        '<feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="3" result="d"/>' +
        '<feDisplacementMap in="SourceGraphic" in2="d" scale="1.6" xChannelSelector="R" yChannelSelector="G" result="rough"/>' +
        '<feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="1" seed="7" result="g"/>' +
        '<feColorMatrix in="g" type="matrix" values="0 0 0 0 .14  0 0 0 0 .13  0 0 0 0 .12  0 0 0 16 -9.4" result="dark"/>' +
        '<feColorMatrix in="g" type="matrix" values="0 0 0 0 .9  0 0 0 0 .88  0 0 0 0 .84  0 0 0 -22 6.6" result="lite"/>' +
        '<feMerge result="spk"><feMergeNode in="dark"/><feMergeNode in="lite"/></feMerge>' +
        '<feComposite in="spk" in2="rough" operator="in" result="spki"/>' +
        '<feTurbulence type="turbulence" baseFrequency="0.06" numOctaves="4" seed="11" result="v"/>' +
        '<feColorMatrix in="v" type="matrix" values="0 0 0 0 .16  0 0 0 0 .14  0 0 0 0 .12  0 0 0 -18 3.2" result="veins"/>' +
        '<feComposite in="veins" in2="rough" operator="in" result="veini"/>' +
        '<feMerge result="stone"><feMergeNode in="rough"/><feMergeNode in="veini"/><feMergeNode in="spki"/></feMerge>' +
        '<feGaussianBlur in="rough" stdDeviation="1.4" result="rb"/>' +
        '<feDiffuseLighting in="rb" surfaceScale="2.4" diffuseConstant="1.1" lighting-color="#fff" result="dl"><feDistantLight azimuth="235" elevation="48"/></feDiffuseLighting>' +
        '<feComposite in="stone" in2="dl" operator="arithmetic" k1="1.25" k2="0" k3="0" k4=".04" result="lit"/>' +
        '<feComposite in="lit" in2="rough" operator="in"/>' +
        '</filter>';
    } else if (t === "antique") {
      f = '<filter id="' + p + 'tex" x="-8%" y="-40%" width="116%" height="180%" color-interpolation-filters="sRGB">' +
        '<feTurbulence type="fractalNoise" baseFrequency="0.01 0.42" numOctaves="3" seed="2" result="grain"/>' +
        '<feColorMatrix in="grain" type="matrix" values="0 0 0 0 .2  0 0 0 0 .1  0 0 0 0 .03  0 0 0 2.6 -1.1" result="gr"/>' +
        '<feComposite in="gr" in2="SourceAlpha" operator="in" result="gri"/>' +
        '<feBlend in="SourceGraphic" in2="gri" mode="multiply" result="aged"/>' +
        '<feTurbulence type="fractalNoise" baseFrequency="0.22" numOctaves="2" seed="15" result="rn"/>' +
        '<feColorMatrix in="rn" type="matrix" values="0 0 0 0 .42  0 0 0 0 .2  0 0 0 0 .07  0 0 0 20 -12.6" result="rust"/>' +
        '<feComposite in="rust" in2="SourceAlpha" operator="in" result="rusti"/>' +
        '<feMerge result="worn"><feMergeNode in="aged"/><feMergeNode in="rusti"/></feMerge>' +
        '<feGaussianBlur in="SourceAlpha" stdDeviation="1.4" result="b"/>' +
        '<feSpecularLighting in="b" surfaceScale="2.4" specularConstant=".55" specularExponent="12" lighting-color="#ffe7b8" result="sp"><fePointLight x="20" y="-70" z="60"/></feSpecularLighting>' +
        '<feComposite in="sp" in2="SourceAlpha" operator="in" result="spi"/>' +
        '<feComposite in="worn" in2="spi" operator="arithmetic" k1="0" k2="1" k3=".45" k4="0" result="lit"/>' +
        '<feColorMatrix in="lit" type="matrix" values=".9 .12 .03 0 0  .07 .86 .05 0 0  .05 .1 .7 0 0  0 0 0 1 0"/>' +
        '</filter>';
    } else if (t === "diamond") {
      f = '<filter id="' + p + 'tex" x="-5%" y="-30%" width="110%" height="160%" color-interpolation-filters="sRGB">' +
        light + '<feComposite in="SourceGraphic" in2="spi" operator="arithmetic" k1="0" k2="1" k3=".9" k4="0"/></filter>';
    } else if (t === "dark") {
      f = '<filter id="' + p + 'tex" x="-5%" y="-30%" width="110%" height="160%" color-interpolation-filters="sRGB">' +
        '<feTurbulence type="fractalNoise" baseFrequency="0.035 0.06" numOctaves="4" seed="21" result="neb">' +
        (rich === "anim" ? '<animate attributeName="baseFrequency" dur="18s" values="0.035 0.06;0.045 0.05;0.035 0.06" repeatCount="indefinite"/>' : '') +
        '</feTurbulence>' +
        '<feColorMatrix in="neb" type="matrix" values="1.9 0 .4 0 -.55  0 .6 .9 0 -.35  .6 .2 2.1 0 -.35  1.6 0 1 0 -.95" result="nc"/>' +
        '<feComposite in="nc" in2="SourceAlpha" operator="in" result="nci"/>' +
        '<feBlend in="nci" in2="SourceGraphic" mode="screen" result="nebula"/>' +
        light +
        '<feComposite in="nebula" in2="spi" operator="arithmetic" k1="0" k2="1" k3=".55" k4="0"/>' +
        '</filter>' +
        '<filter id="' + p + 'glow" x="-30%" y="-80%" width="160%" height="260%">' +
        '<feGaussianBlur in="SourceAlpha" stdDeviation="5"/><feColorMatrix type="matrix" values="0 0 0 0 .55  0 0 0 0 .25  0 0 0 0 1  0 0 0 .9 0"/></filter>';
    }
    return f;
  }

  /* diamond: a faceted pattern laid over the body */
  function facets(p){
    var s = '<pattern id="' + p + 'fac" patternUnits="userSpaceOnUse" width="14" height="12" patternTransform="skewX(-18)">';
    s += '<path d="M0 0 L7 6 L0 12 Z" fill="#FFFFFF" opacity=".55"/><path d="M0 0 L14 0 L7 6 Z" fill="#7CCBFA" opacity=".6"/>';
    s += '<path d="M14 0 L14 12 L7 6 Z" fill="#3E98D6" opacity=".55"/><path d="M0 12 L7 6 L14 12 Z" fill="#E6FAFF" opacity=".6"/>';
    s += '<path d="M0 0 L14 12 M14 0 L0 12" stroke="#FFFFFF" stroke-width=".35" opacity=".9"/></pattern>';
    s += '<linearGradient id="' + p + 'rb" x1="0" y1="0" x2="1" y2="0">' +
      ['#FF7AD9', '#FFD36B', '#8CFFB0', '#6BD6FF', '#B28CFF', '#FF7AD9'].map(function(c, i){ return '<stop offset="' + (i / 5) + '" stop-color="' + c + '"/>'; }).join("") + '</linearGradient>';
    return s;
  }
  function sparkle(x, y, r, d, anim){
    var star = '<path d="M0 ' + (-r) + ' L' + (r * .22) + ' ' + (-r * .22) + ' L' + r + ' 0 L' + (r * .22) + ' ' + (r * .22) + ' L0 ' + r + ' L' + (-r * .22) + ' ' + (r * .22) + ' L' + (-r) + ' 0 L' + (-r * .22) + ' ' + (-r * .22) + ' Z" fill="#fff"/>';
    return '<g transform="translate(' + x + ' ' + y + ')"><g>' + star +
      (anim ? '<animateTransform attributeName="transform" type="scale" values="0;1;0;0" keyTimes="0;.12;.3;1" dur="3.2s" begin="' + d + 's" repeatCount="indefinite"/>' : '') +
      '</g></g>';
  }

  function art(tier, px, opt){
    opt = opt || {};
    tier = Math.max(0, Math.min(6, tier | 0));
    var t = TIERS[tier].key, p = "shr" + (++uid) + "-";
    var rich = px >= 40 ? (opt.animate ? "anim" : true) : false;
    var anim = rich === "anim";
    var mat = t === "antique" ? METAL.brass : METAL[t];
    var defs = cyl(p + "g", mat) + cyl(p + "gd", mat.map(function(c){ return shade(c, -0.22); }));
    defs += cyl(p + "bur", ["#606468", "#9aa0a6", "#e6e9ec", "#ffffff", "#b9bec3", "#80858a", "#4a4e52", "#9ca1a6"]);
    if (t === "antique") {
      defs += cyl(p + "brass", METAL.brass) + cyl(p + "iron", METAL.iron) +
        cyl(p + "wood", ["#2A1406", "#5C2F12", "#8A4B22", "#B4713C", "#7A4019", "#4E260C", "#231003", "#6A3816"]);
    }
    if (t === "diamond") defs += facets(p);
    defs += filters(p, t, rich);
    defs += '<clipPath id="' + p + 'clip">' + (t === "antique" ? antiqueMask() : modernMask()) + '</clipPath>';
    defs += '<linearGradient id="' + p + 'sheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/>' +
      '<stop offset=".5" stop-color="#fff" stop-opacity="' + (t === "diamond" ? ".95" : ".75") + '"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>';

    var parts = t === "antique" ? antiqueParts(p, rich) : modernParts(p, rich);
    var body = '<g' + (rich ? ' filter="url(#' + p + 'tex)"' : '') + '>' + parts + '</g>';
    var over = '';
    if (t === "diamond") {
      over += '<g clip-path="url(#' + p + 'clip)"><rect x="-10" y="-20" width="170" height="50" fill="url(#' + p + 'fac)"/>' +
        '<rect x="-10" y="-20" width="170" height="50" fill="url(#' + p + 'rb)" opacity=".22" style="mix-blend-mode:color"/></g>';
    }
    if (t === "dark" && rich) {
      var stars = "", seed = 7;
      for (var i = 0; i < 26; i++){ seed = (seed * 9301 + 49297) % 233280; var sx = (seed / 233280) * 150 - 4; seed = (seed * 9301 + 49297) % 233280; var sy = (seed / 233280) * 34 - 15;
        stars += '<circle cx="' + sx.toFixed(1) + '" cy="' + sy.toFixed(1) + '" r="' + (i % 5 === 0 ? .9 : .45) + '" fill="#fff" opacity="' + (i % 3 ? .75 : 1) + '">' +
          (anim && i % 4 === 0 ? '<animate attributeName="opacity" values="1;.2;1" dur="' + (2 + i % 3) + 's" repeatCount="indefinite"/>' : '') + '</circle>'; }
      over += '<g clip-path="url(#' + p + 'clip)">' + stars + '</g>';
    }
    // rim light: a thin bright line along the top of the body
    if (rich && t !== "antique" && t !== "stone") over += '<path d="M50 -1.6 H122" stroke="#fff" stroke-opacity="' + (t === "dark" ? ".35" : ".55") + '" stroke-width=".8" stroke-linecap="round"/>';
    // moving glint (metals, diamond, dark matter)
    if (anim && tier >= 2) {
      over += '<g clip-path="url(#' + p + 'clip)"><rect x="-40" y="-30" width="26" height="70" fill="url(#' + p + 'sheen)" transform="skewX(-22)" opacity="' + (t === "dark" ? ".5" : ".9") + '">' +
        '<animate attributeName="x" values="-60;190;190" keyTimes="0;.35;1" dur="' + (t === "diamond" || t === "dark" ? "3.6" : "4.6") + 's" repeatCount="indefinite"/></rect></g>';
    }
    if (t === "diamond" && rich) over += sparkle(18, -12, 5, 0, anim) + sparkle(98, -2, 4, 1.1, anim) + sparkle(64, 13, 3.2, 2.2, anim);
    if (t === "dark" && rich) over += sparkle(20, -12, 4, .4, anim) + sparkle(110, 10, 3, 1.7, anim);

    var under = t === "dark" && rich ? '<g filter="url(#' + p + 'glow)" opacity=".85">' + (t === "antique" ? antiqueMask() : modernMask()) +
      (anim ? '<animate attributeName="opacity" values=".55;.95;.55" dur="3s" repeatCount="indefinite"/>' : '') + '</g>' : '';
    // shadow under the tool
    var shadow = rich ? '<ellipse cx="72" cy="27" rx="64" ry="5" fill="#000" opacity=".35"/>' : '';

    var D = DISC[t], ring = t === "antique" ? METAL.brass : mat;
    defs += cyl(p + "ring", ring.map(function(c){ return shade(c, t === "dark" ? .08 : 0); }));
    defs += '<radialGradient id="' + p + 'disc" cx=".42" cy=".36" r=".75"><stop offset="0" stop-color="' + D[0] + '"/><stop offset=".55" stop-color="' + D[1] + '"/><stop offset="1" stop-color="' + D[2] + '"/></radialGradient>';
    defs += '<radialGradient id="' + p + 'spot" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="' + D[3] + '" stop-opacity=".55"/><stop offset="1" stop-color="' + D[3] + '" stop-opacity="0"/></radialGradient>';
    var disc = '<circle cx="64" cy="64" r="60" fill="url(#' + p + 'ring)"/>' +
      '<circle cx="64" cy="64" r="60" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="1"/>' +
      '<circle cx="64" cy="64" r="' + (rich ? 53 : 50) + '" fill="url(#' + p + 'disc)"/>' +
      '<circle cx="64" cy="64" r="' + (rich ? 53 : 50) + '" fill="none" stroke="rgba(0,0,0,.5)" stroke-width="1.4"/>';
    if (rich) {
      disc += '<circle cx="64" cy="64" r="49" fill="none" stroke="' + D[3] + '" stroke-opacity=".28" stroke-width=".8" stroke-dasharray="1.2 2.4"/>' +
        '<ellipse cx="64" cy="60" rx="44" ry="30" fill="url(#' + p + 'spot)"/>';
      if (t === "dark") disc += '<g clip-path="url(#' + p + 'dclip)">' + discStars(34) + '</g>';
      defs += '<clipPath id="' + p + 'dclip"><circle cx="64" cy="64" r="53"/></clipPath>';
      // light on the ring
      disc += '<path d="M18 40 A52 52 0 0 1 56 8" stroke="#fff" stroke-opacity=".5" stroke-width="2" fill="none" stroke-linecap="round"/>';
    }
    /* level numeral: an engraved plaque on the rim (large), or a corner tag (small icons) */
    var over2 = '';
    if (opt.level) {
      var num = ROMAN[Math.max(1, Math.min(3, opt.level)) - 1];
      if (rich) {
        var pw = 14 + num.length * 8;
        disc += '<g transform="translate(64 113)"><rect x="' + (-pw / 2) + '" y="-11" width="' + pw + '" height="22" rx="6" fill="url(#' + p + 'ring)" stroke="rgba(0,0,0,.55)" stroke-width="1.2"/>' +
          '<rect x="' + (-pw / 2 + 2) + '" y="-9" width="' + (pw - 4) + '" height="18" rx="4.5" fill="' + D[2] + '" opacity=".88"/>' +
          '<text x="0" y="5.2" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="15" letter-spacing="1" fill="' + D[3] + '" stroke="rgba(0,0,0,.35)" stroke-width=".4">' + num + '</text></g>';
      }
    }
    var g = '<g clip-path="url(#' + p + 'dclip2)"><g transform="translate(' + (t === "antique" ? 22 : 19) + ' 84) rotate(-30) scale(' + (t === "antique" ? .66 : .7) + ')">' + shadow + under + body + over + '</g></g>';
    defs += '<clipPath id="' + p + 'dclip2"><circle cx="64" cy="64" r="' + (rich ? 60 : 58) + '"/></clipPath>';
    return '<svg class="sh-rank-art sh-rank-' + t + '" width="' + px + '" height="' + px + '" viewBox="0 0 128 128" role="img" aria-label="' +
      TIERS[tier].name + ' handpiece' + (opt.level ? ' ' + ROMAN[Math.max(1, Math.min(3, opt.level)) - 1] : '') + '"><defs>' + defs + '</defs>' + disc + g + over2 + '</svg>';
  }

  /* medallion interior: center, mid, edge, spotlight color */
  var DISC = {
    antique: ["#6B4A26", "#3A2511", "#1A0F05", "#F0C98A"],
    stone:   ["#5C5851", "#34312D", "#171614", "#E8E2D6"],
    bronze:  ["#5A2E14", "#2E1508", "#140802", "#FFB77A"],
    silver:  ["#46515E", "#222A33", "#0C1015", "#DDEBFA"],
    gold:    ["#5C400A", "#2D1E03", "#130C01", "#FFE08A"],
    diamond: ["#0F4A73", "#08263F", "#030E1A", "#9EE6FF"],
    dark:    ["#1C0B3D", "#090318", "#010006", "#B57BFF"]
  };
  function discStars(n){
    var s = "", seed = 3;
    for (var i = 0; i < n; i++){
      seed = (seed * 9301 + 49297) % 233280; var x = 12 + (seed / 233280) * 104;
      seed = (seed * 9301 + 49297) % 233280; var y = 12 + (seed / 233280) * 104;
      s += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (i % 6 === 0 ? .9 : .45) + '" fill="#fff" opacity="' + (i % 3 ? .55 : .9) + '"/>';
    }
    return s;
  }
  function shade(hex, amt){
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    function f(c){ return Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt))); }
    return "#" + ((1 << 24) + (f(r) << 16) + (f(g) << 8) + f(b)).toString(16).slice(1);
  }

  /* trophies: key -> label, how to earn, icon; secret ones stay "???" until earned */
  var TROPHIES = [
    { k: "answers-100",  n: "First Hundred",        d: "Answer 100 questions",                 ic: "M5 12l4 4 10-10" },
    { k: "answers-1000", n: "Thousand Club",        d: "Answer 1,000 questions",               ic: "M4 17l4-9 4 6 3-4 5 7z" },
    { k: "days-7",       n: "Full Week",            d: "Study 7 days in a row",                ic: "M4 6h16v14H4zM4 10h16M9 3v5M15 3v5" },
    { k: "days-30",      n: "Iron Routine",         d: "Study 30 days in a row",               ic: "M12 3l2.6 5.5 6 .8-4.4 4.2 1 6-5.2-2.9-5.2 2.9 1-6L3.4 9.3l6-.8z" },
    { k: "run-25",       n: "Sharp Explorer",       d: "25 right answers in a row",            ic: "M4 20L14 10M14 10l3-6 3 3-6 3" },
    { k: "run-100",      n: "Tactical",             d: "100 right answers in a row",           ic: "M12 3v6M12 15v6M3 12h6M15 12h6M12 12m-3 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0" },
    { k: "mock90",       n: "Mock Ace",             d: "90%+ on a mock exam of 20+ questions", ic: "M12 4a8 8 0 1 0 0 16 8 8 0 1 0 0-16zM12 8v4l3 2" },
    { k: "arcade-25",    n: "Arcade Regular",       d: "Play 25 arcade games",                 ic: "M6 9h12a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-2a3 3 0 0 1 3-3zM8 11v4M6 13h4M15 12h.01M17 14h.01" },
    { k: "golden",       n: "Golden Probe",         d: "Find the day's golden question first", ic: "M3 21l9-9M12 12l3-3c1-1 1-3 3-4l2-1", secret: true, clue: "One question in every hub turns gold each day. Be the first to get it right." },
    { k: "fairy",        n: "Tooth Fairy",          d: "Catch the Tooth Fairy",                ic: "M7 5c-2 0-3 1.5-3 3.5 0 2.5 1.2 3.5 1.6 5.5.4 2.5.8 5 2 5s1.5-2.4 1.8-4c.2-.8.5-1.2 1.6-1.2s1.4.4 1.6 1.2c.3 1.6.6 4 1.8 4s1.6-2.5 2-5c.4-2 1.6-3 1.6-5.5C20 6.5 19 5 17 5c-1.6 0-2.4.8-5 .8S8.6 5 7 5z", secret: true, clue: "Keep answering questions. Something small with wings is out there." },
    { k: "fairy-5",      n: "Fairy Collector",      d: "Catch the Tooth Fairy 5 times",        ic: "M12 3l2 4 4 .6-3 3 .8 4.4L12 13l-3.8 2 .8-4.4-3-3 4-.6z", secret: true, clue: "She comes back. Be quick, five times over." },
    { k: "boss",         n: "Final Blow",           d: "Land the last hit on a Plaque Boss",   ic: "M12 3c4 0 7 2.5 7 7 0 3-2 4-2 6H7c0-2-2-3-2-6 0-4.5 3-7 7-7zM9 11h.01M15 11h.01M9 20h6", secret: true, clue: "Wait until five or more classmates are online at once, then answer fast." },
    { k: "owl",          n: "Night Owl",            d: "Answer a question between 2 and 4 am", ic: "M5 4l3 3h8l3-3v9a7 7 0 0 1-14 0zM9.5 11a1.5 1.5 0 1 0 .01 0M14.5 11a1.5 1.5 0 1 0 .01 0", secret: true, clue: "Study while the rest of the class is asleep." },
    { k: "konami",       n: "Cheat Code",           d: "Enter the Konami code",                ic: "M12 4v16M12 4l-5 5M12 4l5 5", secret: true, clue: "Old-school gamers know it: ↑ ↑ ↓ ↓ ← → ← → B A. On a phone, swipe it and tap twice." },
    { k: "floss",        n: "Floss Boss",           d: "Type the magic word",                  ic: "M4 18c4-10 12-10 16 0M8 8l-2-4M16 8l2-4", secret: true, clue: "Type the one thing your hygienist always asks whether you have been doing." },
    { k: "prof",         n: "Office Hours",         d: "Get a professor to quote themselves",  ic: "M4 5h16v11H9l-5 4zM8 10h8", secret: true, clue: "Professors repeat themselves. Tap one's name, a few times, quickly." },
    { k: "rootcanal",    n: "Through the Root Canal", d: "10 misses, then 10 right in a row",  ic: "M9 4v6l-3 10M15 4v6l3 10M9 10h6", secret: true, clue: "Go all the way down, then all the way back up. Ten each way." },
    { k: "mirror",       n: "Indirect Vision",      d: "See the hub the way you see a maxillary molar", ic: "M12 4a5 5 0 1 0 0 10 5 5 0 1 0 0-10zM12 14v7M9 21h6", secret: true, clue: "Your most-used instrument shows everything backwards. Type its name." },
    { k: "fullarch",     n: "Full Arch",            d: "Fill all 32 teeth of the arch",        ic: "M4 16c0-7 3.6-11 8-11s8 4 8 11M7 15.5v-2M10 14v-2.5M14 14v-2.5M17 15.5v-2", secret: true, clue: "Every right answer grows a tooth; every miss knocks one out. Adults have how many?" },
    { k: "flosschain",   n: "Floss Chain",          d: "Floss with two classmates at once",    ic: "M3 14c3-4 6-4 9 0s6 4 9 0M6 9v2M12 7v2M18 9v2", secret: true, clue: "The magic word works better with friends. Three of you, in the same hub, within a minute." },
    { k: "cavity",       n: "Restorative",          d: "Find the week's hidden cavity",        ic: "M7 5c-2 0-3 1.5-3 3.5 0 2.5 1.2 3.5 1.6 5.5.4 2.5.8 5 2 5s1.5-2.4 1.8-4c.2-.8.5-1.2 1.6-1.2s1.4.4 1.6 1.2c.3 1.6.6 4 1.8 4s1.6-2.5 2-5c.4-2 1.6-3 1.6-5.5C20 6.5 19 5 17 5c-1.6 0-2.4.8-5 .8S8.6 5 7 5zM12 9.5h.01", secret: true, clue: "Each week a tiny dark spot hides somewhere in one hub's Lecture Notes. Only five people get to fill it." },
    { k: "holiday",      n: "Holiday Spirit",       d: "Say the season's magic word",          ic: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6", secret: true, clue: "Around a holiday the hubs dress up. Each holiday has its own magic word: type it." },
    { k: "pet-perfect",  n: "Pearly Whites",        d: "Keep your tooth buddy at full health", ic: "M12 3l1.8 4.2 4.6.4-3.5 3 1 4.4L12 12.8 8.1 15l1-4.4-3.5-3 4.6-.4z", secret: true, clue: "Got a tooth buddy on the dashboard? Get them to 100 HP." },
    { k: "pet-revive",   n: "Full Recovery",        d: "Nurse your tooth buddy from 0 HP back to 100", ic: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10zM9 11h6M12 8v6", secret: true, clue: "Even a tooth at rock bottom can come back. It takes a real treatment plan." }
  ];
  /* hub trophies (2026-10-20): earned once in each hub and shown in that hub's own section of the trophy case.
     They are the per-hub achievements the server already keeps (kind:hub badges) plus two new ones (migration_v38). */
  var HUB_TROPHIES = [
    { k: "mastery-bronze", n: "Bronze Mastery", d: "Get 50% of this hub's questions right on your latest try", ic: "M12 4a6 6 0 1 0 0 12 6 6 0 1 0 0-12zM9 15l-2 6 5-2 5 2-2-6", c: "#B0672B" },
    { k: "mastery-silver", n: "Silver Mastery", d: "Get 75% right on your latest try", ic: "M12 4a6 6 0 1 0 0 12 6 6 0 1 0 0-12zM9 15l-2 6 5-2 5 2-2-6", c: "#8E98A3" },
    { k: "mastery-gold",   n: "Gold Mastery",   d: "Get 90% right on your latest try", ic: "M12 4a6 6 0 1 0 0 12 6 6 0 1 0 0-12zM9 15l-2 6 5-2 5 2-2-6", c: "#C9971C" },
    { k: "mastery-crown",  n: "Crown",          d: "Get every question in the hub right on your latest try", ic: "M3 18l1-11 5 4 3-7 3 7 5-4 1 11z", c: "#E0A800" },
    { k: "seen-all",       n: "Seen It All",    d: "Answer every question in the hub at least once", ic: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 1 0 0-6z" },
    { k: "fullarch",       n: "Full Arch",      d: "Grow all 32 teeth of the arch in this hub", ic: "M4 16c0-7 3.6-11 8-11s8 4 8 11M7 15.5v-2M10 14v-2.5M14 14v-2.5M17 15.5v-2", secret: true, clue: "Every right answer grows a tooth; every miss knocks one out. Adults have how many?" },
    { k: "mock90",         n: "Mock Ace",       d: "90%+ on a mock exam of 20+ questions here", ic: "M12 4a8 8 0 1 0 0 16 8 8 0 1 0 0-16zM12 8v4l3 2" },
    { k: "mock-perfect",   n: "Perfect Mock",   d: "Every question right on a mock exam of 20+ questions here", ic: "M12 3l2.6 5.5 6 .8-4.4 4.2 1 6-5.2-2.9-5.2 2.9 1-6L3.4 9.3l6-.8z", c: "#E0A800" },
    { k: "boss",           n: "Final Blow",     d: "Land the last hit on a boss in this hub", ic: "M12 3c4 0 7 2.5 7 7 0 3-2 4-2 6H7c0-2-2-3-2-6 0-4.5 3-7 7-7zM9 11h.01M15 11h.01M9 20h6", secret: true, clue: "Wait until five or more classmates are online at once, then answer fast." }
  ];
  var MASTERY = [
    { k: "mastery-bronze", n: "Bronze", pct: .5 }, { k: "mastery-silver", n: "Silver", pct: .75 },
    { k: "mastery-gold", n: "Gold", pct: .9 }, { k: "mastery-crown", n: "Crown", pct: 1 }
  ];

  /* ---------- mastery flair: one medal per hub mastered, shown with your name on every leaderboard ----------
     The leaderboards return `flair` as "perio:3,msk-exam3:1" (1 bronze, 2 silver, 3 gold, 4 crown; migration_v31).
     The metal is the tier; the emblem in the middle and the ribbon colors are the hub's (HUB_MEDAL), so a Gold in
     Perio and a Gold in Occlusion look different. A board row shows one medal (this hub's, else your best) and "+N";
     tapping it opens the full set. */
  var HUB_NAMES = { "perio": "Perio", "msk-exam3": "MSK Exam 3", "gi-exam1": "GI Exam 1", "gi-exam2": "GI Exam 2",
    "hepatobiliary": "Hepatobiliary", "genetics": "Genetics", "fixed-pros": "Fixed Pros",
    "msk-exam4": "MSK Exam 4", "occlusion": "Occlusion", "pcd-exam3": "PCD Exam 3", "heme-endo-exam1": "Heme & Endo 1", "special-patient-care": "Special Patient Care" };
  function hubName(h){ return (window.SH_HUB_NAMES && window.SH_HUB_NAMES[h]) || HUB_NAMES[h] || String(h).replace(/-/g, " ").replace(/\b\w/g, function(c){ return c.toUpperCase(); }); }
  var MEDAL = {
    1: ["#5A2A0E", "#B0672B", "#F2B884", "#FFE6CC"],
    2: ["#3E4650", "#8E98A3", "#E4E9EE", "#FFFFFF"],
    3: ["#5A3905", "#B58309", "#F6CD55", "#FFF6CF"],
    4: ["#6B4A05", "#C99A12", "#FFD84A", "#FFFBE0"]
  };
  /* per hub: ribbon colors [left, right] and an emblem drawn on a 24-unit grid ("f" = filled shape, "s" = stroke,
     "l" = a dark detail line on top). Hubs without an entry get the tooth. */
  var TOOTH = [["f", "M7.2 4.6c-1.8 0-3 1.4-3 3.4 0 2.2 1.2 3.2 1.6 5 .4 2.2.8 4.6 1.8 4.6s1.4-2.2 1.6-3.6c.2-.8.6-1.2 1.8-1.2s1.6.4 1.8 1.2c.2 1.4.6 3.6 1.6 3.6s1.4-2.4 1.8-4.6c.4-1.8 1.6-2.8 1.6-5 0-2-1.2-3.4-3-3.4-1.6 0-2.4.8-4.8.8s-3-.8-4.8-.8z"]];
  var HUB_MEDAL = {
    "special-patient-care": { rib: ["#1D6B66", "#FF8A6B"], g: TOOTH },
    "heme-endo-exam1": { rib: ["#6B3FA0", "#E86A9E"], g: [["f", "M11.2 13.6C10.8 8.6 9.4 4.4 7.2 4.4 4.6 4.4 4 9 4.9 12.7c.9 3.5 3.6 5.2 5.9 3.9z"], ["f", "M12.8 13.6c.4-5 1.8-9.2 4-9.2 2.6 0 3.2 4.6 2.3 8.3-.9 3.5-3.6 5.2-5.9 3.9z"], ["f", "M10 12.4h4v3.4h-4z"]] },
    "perio":        { rib: ["#B23A5B", "#E98AA4"], g: [["s", "M4.5 19.5 13 11l2.6-2.6"], ["s", "M15.6 8.4c1.4-1.4 3-1 3.6.4l.6 2.6"], ["l", "M8.4 14.2l1.4 1.4M10.6 12l1.4 1.4"]] },
    "occlusion":    { rib: ["#2F5FA8", "#C2414B"], g: [["f", "M4 3.5h16v5.5l-2.7 3.2-2.6-3.2-2.7 3.2-2.7-3.2-2.6 3.2L4 9z"], ["f", "M4 20.5h16V15l-2.7-3.2-2.6 3.2-2.7-3.2-2.7 3.2-2.6-3.2L4 15z"]] },
    "msk-exam3":    { rib: ["#6B5B95", "#D9C79A"], g: [["s", "M8 16 16 8"], ["f", "M5.2 14.9a2.1 2.1 0 1 1 3.9 3.9 2.1 2.1 0 1 1-3.9-3.9z"], ["f", "M14.9 5.2a2.1 2.1 0 1 1 3.9 3.9 2.1 2.1 0 1 1-3.9-3.9z"]] },
    "msk-exam4":    { rib: ["#A3453A", "#E2A07E"], g: [["f", "M3.5 21v-5.6c0-3.2 2-5.4 4.6-5.6l1.8-5.6c.4-1.2 1.8-1.6 2.7-.8l1.6 1.4c.7.6.4 1.8-.5 2l-1.6.4-.7 2.8c2-1 4.8-1 6.8.4 2.4 1.7 2.8 4.8 1.5 7.2-1.2 2.2-3.8 3.4-6.6 3.4z"], ["l", "M10.2 15.2c1.2-1.4 3.6-1.8 5.4-.8"]] },
    "pcd-exam3":    { rib: ["#2D7F8C", "#E8DCC3"], g: [["f", "M8.6 15.4h6.8l-1.3 5.6H9.9z"], ["f", "M4.6 13.6V9.8c0-3.4 1.6-6.2 3.9-6.2 1.5 0 2.3 1.1 3.5 1.1s2-1.1 3.5-1.1c2.3 0 3.9 2.8 3.9 6.2v3.8z"]] },
    "fixed-pros":   { rib: ["#2D7F8C", "#E8DCC3"], g: [["f", "M2.5 7.5h19v4.6c0 1.3-.9 1.9-1.3 3.3l-.9 4c-.3 1-1.4 1-1.7 0l-.7-3.3h-9.8l-.7 3.3c-.3 1-1.4 1-1.7 0l-.9-4c-.4-1.4-1.3-2-1.3-3.3z"], ["l", "M8.8 7.8v4.6M15.2 7.8v4.6"]] },
    "gi-exam1":     { rib: ["#C46A1E", "#E8B04B"], g: [["f", "M9 2.5h3.4v4.6c0 2 1.4 2.8 3 2.4 2.4-.6 5.1.4 5.1 3.4 0 4.6-4.4 8.6-9.6 8.6-4.2 0-7.4-2.8-7.4-6.6 0-4.2 4.5-4.6 5.5-7.4z"]] },
    "gi-exam2":     { rib: ["#7A3B1F", "#6E9A3A"], g: [["f", "M2.6 9.4c0-2.6 2.4-3.6 5.4-3.6h11c2.4 0 3.1 2.2 1.8 4.2-2.6 4.2-7.8 8.8-12.6 9.2-3.6.3-5.6-5-5.6-9.8z"]] },
    "hepatobiliary":{ rib: ["#7A3B1F", "#6E9A3A"], g: [["f", "M2.6 9.4c0-2.6 2.4-3.6 5.4-3.6h11c2.4 0 3.1 2.2 1.8 4.2-2.6 4.2-7.8 8.8-12.6 9.2-3.6.3-5.6-5-5.6-9.8z"]] },
    "genetics":     { rib: ["#3A6FD8", "#E05A9C"], g: [["s", "M7 3c0 6 10 6 10 12v6"], ["s", "M17 3c0 6-10 6-10 12v6"], ["l", "M8.4 5.8h7.2M8.4 18h7.2"]] }
  };
  function hubMedal(h){ return HUB_MEDAL[h] || { rib: ["#C2414B", "#2F5FA8"], g: TOOTH }; }
  function emblem(g, ink, cx, cy, s){
    var t = 'transform="translate(' + cx + ' ' + cy + ') scale(' + s + ') translate(-12 -12)"', back = "", front = "", line = "";
    g.forEach(function(p){
      if (p[0] === "f") { back += '<path d="' + p[1] + '" fill="' + ink + '" stroke="' + ink + '" stroke-width="2.4" stroke-linejoin="round"/>'; front += '<path d="' + p[1] + '" fill="#fff"/>'; }
      else if (p[0] === "s") { back += '<path d="' + p[1] + '" fill="none" stroke="' + ink + '" stroke-width="5.2" stroke-linecap="round" stroke-linejoin="round"/>'; front += '<path d="' + p[1] + '" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>'; }
      else line += '<path d="' + p[1] + '" fill="none" stroke="' + ink + '" stroke-width="1.3" stroke-linecap="round" opacity=".8"/>';
    });
    return '<g ' + t + ' opacity=".96">' + back + front + line + '</g>';
  }
  var fuid = 0;
  /* medalSvg(lvl, px, hub): the tier's metal with the hub's emblem and ribbons; the Crown tier wears a crown on top */
  function medalSvg(lvl, px, hub){
    var p = "shfl" + (++fuid) + "-", m = MEDAL[lvl] || MEDAL[1], H = hubMedal(hub), crown = lvl >= 4;
    var cy = crown ? 10 : 8.4, r = crown ? 6.4 : 7;
    return '<svg width="' + px + '" height="' + px + '" viewBox="0 0 20 20" aria-hidden="true"><defs>' +
      '<radialGradient id="' + p + 'm" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="' + m[3] + '"/><stop offset=".45" stop-color="' + m[2] + '"/><stop offset="1" stop-color="' + m[1] + '"/></radialGradient></defs>' +
      '<path d="M6 13 L4.6 19.4 L7.2 18 L8.6 19.9 L9.6 13.8 Z" fill="' + H.rib[0] + '" stroke="rgba(0,0,0,.25)" stroke-width=".4"/>' +
      '<path d="M14 13 L15.4 19.4 L12.8 18 L11.4 19.9 L10.4 13.8 Z" fill="' + H.rib[1] + '" stroke="rgba(0,0,0,.25)" stroke-width=".4"/>' +
      '<circle cx="10" cy="' + cy + '" r="' + r + '" fill="url(#' + p + 'm)" stroke="' + m[0] + '" stroke-width="1"/>' +
      '<circle cx="10" cy="' + cy + '" r="' + (r - 1.9) + '" fill="none" stroke="' + m[0] + '" stroke-opacity=".45" stroke-width=".7"/>' +
      emblem(H.g, m[0], 10, cy, crown ? .4 : .44) +
      (crown ? '<path d="M5.6 4.6 L5.9 .9 L8 2.6 L10 .3 L12 2.6 L14.1 .9 L14.4 4.6 Z" fill="url(#' + p + 'm)" stroke="' + m[0] + '" stroke-width=".8" stroke-linejoin="round"/>' +
        '<circle cx="10" cy="3.4" r=".75" fill="#E0457B"/>' : '') + '</svg>';
  }
  function parseFlair(s){
    return String(s || "").split(",").map(function(x){ var i = x.lastIndexOf(":"); return { hub: x.slice(0, i), lvl: +x.slice(i + 1) }; })
      .filter(function(x){ return x.hub && x.lvl >= 1 && x.lvl <= 4; })
      .sort(function(a, b){ return b.lvl - a.lvl || (a.hub < b.hub ? -1 : 1); });
  }
  /* the badges list from get_rank_profile ("mastery-gold:perio", ...) -> the same flair string the boards return */
  function flairFromBadges(badges){
    var best = {};
    (badges || []).forEach(function(b){
      var parts = String(b).split(":"), i = -1;
      MASTERY.forEach(function(m, j){ if (m.k === parts[0]) i = j; });
      if (i >= 0 && parts[1]) best[parts[1]] = Math.max(best[parts[1]] || 0, i + 1);
    });
    return Object.keys(best).sort(function(a, b){ return best[b] - best[a] || (a < b ? -1 : 1); }).map(function(h){ return h + ":" + best[h]; }).join(",");
  }
  /* the hub this page belongs to (the widget's data-hub), so its own medal leads on its boards */
  function pageHub(){ var s = document.querySelector("script[data-hub]"); return s ? s.getAttribute("data-hub") : ""; }
  function flairLabel(x){ return hubName(x.hub) + ": " + MASTERY[x.lvl - 1].n + " mastery"; }
  function flairCss(){
    if (document.getElementById("sh-flair-css")) return;
    var st = document.createElement("style"); st.id = "sh-flair-css";
    st.textContent = '.sh-flair{display:inline-flex;align-items:center;gap:1px;vertical-align:-4px;margin:0 3px;white-space:nowrap;flex:none}' +
      'button.sh-flair{appearance:none;-webkit-appearance:none;background:none;border:0;padding:1px 2px;border-radius:999px;font:inherit;color:inherit;cursor:pointer;line-height:1}' +
      'button.sh-flair:hover,button.sh-flair:focus-visible{background:rgba(127,127,127,.16)}' +
      'button.sh-flair:focus-visible{outline:2px solid currentColor;outline-offset:1px}' +
      '.sh-flair-m{display:inline-flex;width:18px;height:18px;filter:drop-shadow(0 1px .5px rgba(0,0,0,.25))}' +
      '.sh-flair-m.is-crown{animation:sh-flair-glint 3.2s ease-in-out infinite}' +
      '.sh-flair-more{font-size:10.5px;font-weight:700;opacity:.7;margin-left:1px;font-variant-numeric:tabular-nums}' +
      /* the showcase (your rank card): every medal with its hub's name */
      '.sh-flair.is-list{display:flex;flex-wrap:wrap;gap:5px;white-space:normal;margin:0;vertical-align:baseline;flex:1 1 auto;min-width:0;max-width:100%}' +
      '.sh-flair-chip{display:inline-flex;align-items:center;gap:4px;padding:2px 8px 2px 3px;border-radius:999px;background:rgba(127,127,127,.13);font-size:12px;font-weight:600;line-height:1.2}' +
      '.sh-flair.is-big .sh-flair-m{width:24px;height:24px}' +
      /* the pop-up: a fixed inset:0 layer (no vh/vw, which overshoot when the text-size setting zooms <html>) */
      '.sh-flair-pop{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(10,12,16,.45);animation:sh-flair-in .16s ease-out}' +
      '.sh-flair-card{width:100%;max-width:340px;max-height:100%;overflow:auto;box-sizing:border-box;background:#1C1F26;color:#F3F1EC;border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px 16px 12px;box-shadow:0 18px 50px rgba(0,0,0,.45);font:14px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif}' +
      '.sh-flair-card h3{margin:0 0 2px;font-size:16px;font-weight:700}' +
      '.sh-flair-card p{margin:0 0 10px;font-size:12.5px;color:#B9B5AD}' +
      '.sh-flair-card ul{list-style:none;margin:0;padding:0}' +
      '.sh-flair-card li{display:flex;align-items:center;gap:12px;padding:7px 0;border-top:1px solid rgba(255,255,255,.08)}' +
      '.sh-flair-card li:first-child{border-top:0}' +
      '.sh-flair-card li .sh-flair-m{width:40px;height:40px}' +
      '.sh-flair-card li b{display:block;font-size:14px}.sh-flair-card li small{font-size:12px;color:#B9B5AD}' +
      '.sh-flair-card .sh-flair-x{display:block;margin:10px 0 0 auto;appearance:none;background:rgba(255,255,255,.1);color:inherit;border:0;border-radius:999px;padding:7px 16px;font:inherit;font-weight:600;cursor:pointer}' +
      '@keyframes sh-flair-in{from{opacity:0}to{opacity:1}}' +
      '@keyframes sh-flair-glint{0%,80%,100%{filter:drop-shadow(0 1px .5px rgba(0,0,0,.25))}88%{filter:drop-shadow(0 0 4px #FFE27A) brightness(1.15)}}' +
      '@media (prefers-reduced-motion: reduce){.sh-flair-m.is-crown,.sh-flair-pop{animation:none}}';
    (document.head || document.documentElement).appendChild(st);
    document.addEventListener("click", function(e){
      var b = e.target && e.target.closest && e.target.closest("[data-sh-flair]");
      if (b) { e.preventDefault(); e.stopPropagation(); openFlair(b.getAttribute("data-flair-list"), b.getAttribute("data-flair-who")); }
    }, true);
  }
  function openFlair(s, who){
    var list = parseFlair(s); if (!list.length) return;
    var old = document.querySelector(".sh-flair-pop"); if (old) old.remove();
    var back = document.activeElement, pop = document.createElement("div");
    pop.className = "sh-flair-pop";
    pop.innerHTML = '<div class="sh-flair-card" role="dialog" aria-modal="true" aria-label="Mastery medals">' +
      '<h3>' + (who ? esc(who) + "'s mastery" : "Mastery medals") + '</h3><p>One medal per hub: the metal is how much of that hub\'s bank was right on the latest try (Bronze 50%, Silver 75%, Gold 90%, Crown 100%).</p><ul>' +
      list.map(function(x){ return '<li><span class="sh-flair-m">' + medalSvg(x.lvl, 40, x.hub) + '</span><span><b>' + esc(hubName(x.hub)) + '</b><small>' + MASTERY[x.lvl - 1].n + ' mastery · ' + Math.round(MASTERY[x.lvl - 1].pct * 100) + '%</small></span></li>'; }).join("") +
      '</ul><button type="button" class="sh-flair-x">Close</button></div>';
    function close(){ pop.remove(); document.removeEventListener("keydown", key, true); try { if (back && back.focus) back.focus(); } catch (e) {} }
    function key(e){ if (e.key === "Escape") { e.stopPropagation(); close(); } }
    pop.addEventListener("click", function(e){ if (e.target === pop || e.target.closest(".sh-flair-x")) close(); });
    document.addEventListener("keydown", key, true);
    document.body.appendChild(pop);
    var x = pop.querySelector(".sh-flair-x"); if (x) x.focus();
    try { if (window.shTrack) window.shTrack("flair:open"); } catch (e) {}
  }
  function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function linkTrack(k){ try { if (window.shTrack) window.shTrack("link:" + k); } catch (e) {} }
  /* shRanks.flair(str, opt) -> mastery medals; empty string when there's nothing to show.
     Default (board rows): one tappable medal, this page's hub first (else the best), then "+N"; fixed small width.
     opt.list: every medal with its hub's name (the rank cards); opt.big: larger medals there.
     opt.who: whose medals, for the pop-up's title. */
  function flair(s, opt){
    opt = opt || {};
    var list = parseFlair(s); if (!list.length) return "";
    flairCss();
    if (opt.list) {
      return '<span class="sh-flair is-list' + (opt.big ? ' is-big' : '') + '">' + list.map(function(x){
        return '<span class="sh-flair-chip" title="' + esc(flairLabel(x)) + '"><span class="sh-flair-m' + (x.lvl >= 4 ? ' is-crown' : '') + '">' + medalSvg(x.lvl, opt.big ? 24 : 18, x.hub) + '</span>' + esc(hubName(x.hub)) + '</span>';
      }).join("") + '</span>';
    }
    var here = pageHub(), lead = list.filter(function(x){ return x.hub === here; })[0] || list[0];
    var label = "Mastery medals: " + list.map(flairLabel).join(" · ");
    return '<button type="button" class="sh-flair" data-sh-flair="medals" data-flair-list="' + esc(s) + '"' + (opt.who ? ' data-flair-who="' + esc(opt.who) + '"' : '') +
      ' aria-label="' + esc(label) + '" title="' + esc(label) + '"><span class="sh-flair-m' + (lead.lvl >= 4 ? ' is-crown' : '') + '">' + medalSvg(lead.lvl, 18, lead.hub) + '</span>' +
      (list.length > 1 ? '<span class="sh-flair-more">+' + (list.length - 1) + '</span>' : '') + '</button>';
  }

  /* ---------- unlockable accent colors (cosmetic; each needs that tier or higher) ---------- */
  var ACCENTS = {
    stone:   { tier: 0, L: ["#6F6A63", "#57524C", "#ECE8E2"], D: ["#B5AEA4", "#D2CCC3", "#2B2926"] },
    antique: { tier: 1, L: ["#8A5A32", "#6E4524", "#F1E4D6"], D: ["#D39A68", "#E8BD94", "#35251A"] },
    bronze:  { tier: 2, L: ["#A5602A", "#85491B", "#F3E1D0"], D: ["#E09A5E", "#F2BE8F", "#3A2415"] },
    silver:  { tier: 3, L: ["#5F6B78", "#4A5561", "#E3E7EB"], D: ["#B7C1CC", "#D6DDE4", "#262C33"] },
    gold:    { tier: 4, L: ["#A67808", "#7F5B04", "#F6EAC6"], D: ["#E8BE45", "#F5D77E", "#3A2E0E"] },
    diamond: { tier: 5, L: ["#1F8FC7", "#16719F", "#D9F0FB"], D: ["#7FD3F7", "#B3E7FC", "#10303F"] },
    dark:    { tier: 6, L: ["#6A35E0", "#5426B8", "#E7DDFB"], D: ["#A77BFF", "#C6A8FF", "#251540"] }
  };
  function ls(k, v){ try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  /* the metal itself, for filled things (primary buttons, switches, progress bars): the medallions' own gradient and
     texture filter drawn on a stretchable tile. Ink = text color on top of it. */
  var TEX_INK = {
    stone:   ["#1F1C19", "0 1px 0 rgba(255,255,255,.55)"],
    antique: ["#FFF6E6", "0 1px 1px rgba(30,15,0,.85)"],
    bronze:  ["#FFFFFF", "0 1px 1px rgba(40,15,0,.7)"],
    silver:  ["#1D242B", "0 1px 0 rgba(255,255,255,.7)"],
    gold:    ["#3A2503", "0 1px 0 rgba(255,246,207,.7)"],
    diamond: ["#0B3350", "0 1px 0 rgba(255,255,255,.8)"],
    dark:    ["#FFFFFF", "0 0 6px rgba(167,123,255,.9)"]
  };
  /* The tiles are pre-rendered to assets/tex/<key>.png by tools/make-accent-tex.js from accentSvg() below: an SVG
     filter used as a CSS background doesn't render reliably on phones (Safari), and a PNG is cheaper to paint. */
  var TEX_V = 2;
  var TEX_BASE = (function(){
    var src = (document.currentScript && document.currentScript.src) || "";
    if (!src) { var el = document.querySelector('script[src*="ranks.js"]'); src = el ? el.src : location.href; }
    try { return new URL("../assets/tex/", src).href; } catch (e) { return "assets/tex/"; }
  })();
  function accentTex(key){ return ACCENTS[key] ? TEX_BASE + key + ".png?v=" + TEX_V : ""; }
  function accentSvg(key){
    if (!ACCENTS[key]) return "";
    var p = "tx" + key, W = 240, Hh = 48, mat = key === "antique" ? METAL.brass : METAL[key];
    var defs = cyl(p + "g", mat), top = "";
    if (key === "stone") {
      // quieter than the medallion's stone: fine grain and soft mottling, no veins, so text stays readable
      defs += '<filter id="' + p + 'tex" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">' +
        '<feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" seed="3" result="m"/>' +
        '<feColorMatrix in="m" type="matrix" values="0 0 0 0 .5  0 0 0 0 .48  0 0 0 0 .45  0 0 0 .9 -.2" result="mot"/>' +
        '<feBlend in="SourceGraphic" in2="mot" mode="soft-light" result="a"/>' +
        '<feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="1" seed="7" result="g"/>' +
        '<feColorMatrix in="g" type="matrix" values="0 0 0 0 .18  0 0 0 0 .17  0 0 0 0 .16  0 0 0 14 -10.2" result="dk"/>' +
        '<feColorMatrix in="g" type="matrix" values="0 0 0 0 .95  0 0 0 0 .94  0 0 0 0 .9  0 0 0 -14 3.4" result="lt"/>' +
        '<feMerge><feMergeNode in="a"/><feMergeNode in="dk"/><feMergeNode in="lt"/></feMerge></filter>';
    } else if (key === "antique") {
      // aged brass: wood-like grain, no rust blotches
      defs += '<filter id="' + p + 'tex" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">' +
        '<feTurbulence type="fractalNoise" baseFrequency="0.008 0.35" numOctaves="3" seed="2" result="grain"/>' +
        '<feColorMatrix in="grain" type="matrix" values="0 0 0 0 .25  0 0 0 0 .13  0 0 0 0 .04  0 0 0 1.8 -.75" result="gr"/>' +
        '<feBlend in="SourceGraphic" in2="gr" mode="multiply" result="aged"/>' +
        '<feColorMatrix in="aged" type="matrix" values=".92 .1 .02 0 0  .06 .86 .04 0 0  .04 .08 .72 0 0  0 0 0 1 0"/></filter>';
    } else defs += filters(p, key, true);
    if (key === "diamond") {
      defs += facets(p);
      top = '<rect width="' + W + '" height="' + Hh + '" fill="url(#' + p + 'fac)" opacity=".7"/>' +
        '<rect width="' + W + '" height="' + Hh + '" fill="url(#' + p + 'rb)" opacity=".22"/>';
    } else if (key === "dark") {
      [[18, 10, .9], [52, 34, .6], [83, 14, 1.1], [121, 38, .7], [150, 9, .8], [178, 29, 1], [209, 16, .6], [230, 40, .8], [104, 24, .5]].forEach(function(x){
        top += '<circle cx="' + x[0] + '" cy="' + x[1] + '" r="' + x[2] + '" fill="#fff" opacity=".85"/>';
      });
    }
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + Hh + '" width="' + W + '" height="' + Hh + '" preserveAspectRatio="none"><defs>' + defs + '</defs>' +
      '<rect width="' + W + '" height="' + Hh + '" fill="url(#' + p + 'g)" filter="url(#' + p + 'tex)"/>' + top + '</svg>';
    return svg;
  }
  function applyAccent(key){
    var el = document.getElementById("sh-rank-accent"), root = document.documentElement;
    var a = ACCENTS[key], known = +(ls("sh_rank_tier") || 0);
    if (!a || known < a.tier) { if (el) el.remove(); root.removeAttribute("data-sh-accent"); return; }
    function v(c){ return "--accent:" + c[0] + ";--accent-ink:" + c[1] + ";--accent-soft:" + c[2] + ";"; }
    var tex = "--sh-tex:url('" + accentTex(key) + "');--sh-tex-ink:" + TEX_INK[key][0] + ";--sh-tex-shadow:" + TEX_INK[key][1] + ";";
    var css = 'html:root{' + v(a.L) + tex + '}@media (prefers-color-scheme: dark){html:root:not([data-theme="light"]){' + v(a.D) + '}}html:root[data-theme="dark"]{' + v(a.D) + '}';
    root.setAttribute("data-sh-accent", key);
    if (!el) { el = document.createElement("style"); el.id = "sh-rank-accent"; document.head.appendChild(el); }
    el.textContent = css;
  }

  function svgDataUri(svg){ return 'url("data:image/svg+xml,' + encodeURIComponent(svg.replace(/ class="[^"]*"/, ' xmlns="http://www.w3.org/2000/svg"')) + '")'; }
  function fmt(n){ return Math.round(n || 0).toLocaleString(); }

  /* ---------- rank-up celebrations (widget/rankup.js, fetched the first time one is needed) ----------
     track(profile) compares the rank with the last one this device saw (sh_rank_tier / sh_rank_step) and plays the
     full cutscene for a new rank (Silver -> Gold) or the smaller coin flip for a new level (Gold I -> Gold II).
     The hub widget and the dashboard both call it, so a rank-up shows on whichever page sees it first. It waits for
     a visible tab and for opt.busy() (a mock exam) to be false; Settings -> Extras -> Rank-up and trophy cards off skips it. */
  var RANKUP_SRC = (function(){
    var src = (document.currentScript && document.currentScript.src) || "";
    if (!src) { var el = document.querySelector('script[src*="ranks.js"]'); src = el ? el.src : ""; }
    try { return src ? new URL("rankup.js", src).href : ""; } catch (e) { return ""; }
  })();
  var rankUpLoading = null;
  function withRankUp(cb){
    if (window.shRankUp) { cb(window.shRankUp); return; }
    if (!RANKUP_SRC) return;
    if (!rankUpLoading) {
      rankUpLoading = [];
      var s = document.createElement("script"); s.src = RANKUP_SRC; s.async = true;
      s.onload = function(){ var q = rankUpLoading; rankUpLoading = null; if (window.shRankUp) q.forEach(function(f){ f(window.shRankUp); }); };
      s.onerror = function(){ rankUpLoading = null; };
      document.head.appendChild(s);
    }
    rankUpLoading.push(cb);
  }
  function playRankUp(kind, d, busy){
    if (document.hidden || (busy && busy())) { setTimeout(function(){ playRankUp(kind, d, busy); }, 3000); return; }
    withRankUp(function(U){ if (U[kind]) U[kind](d); });
  }
  /* trophies you earn by studying (the non-secret ones: answers, study days, runs, mock, arcade) used to land silently in
     the trophy case; track() now announces each new one with a card (widget/rankup.js). Secret ones keep their own
     moment (an egg's toast, Timmy Tooth), and hub mastery medals are announced by the hub widget (masteryCard). The
     device remembers which it has seen in sh_trophy_seen; the first look only records them. */
  var rarityOf = null;   // set by the hub widget once trophy stats load: kind -> { n, total, label }
  function trophyCard(tr){
    return { name: tr.n, desc: tr.d, eyebrow: "Trophy unlocked", ic: tr.ic, pal: "gold", rarity: function(){ return rarityOf ? rarityOf(tr.k) : null; } };
  }
  function trackTrophies(p, busy){
    var kinds = {}; (p.badges || []).forEach(function(b){ kinds[String(b).split(":")[0]] = 1; });
    var have = Object.keys(kinds).sort().join(","), seen = ls("sh_trophy_seen");
    if (have === seen) return;
    ls("sh_trophy_seen", have);
    if (seen === null || (ls("sh_pref_celebrate") || "on") === "off") return;
    var old = {}; seen.split(",").forEach(function(k){ old[k] = 1; });
    TROPHIES.forEach(function(tr){ if (!tr.secret && kinds[tr.k] && !old[tr.k]) playRankUp("trophy", trophyCard(tr), busy); });
  }
  function track(p, opt){
    if (!p) return;
    opt = opt || {};
    trackTrophies(p, opt.busy);
    var t = p.tier || 0, step = p.step != null ? p.step : t * 3, pt = ls("sh_rank_tier"), ps = ls("sh_rank_step");
    ls("sh_rank_tier", String(t)); ls("sh_rank_step", String(step));
    if (pt === null || (ls("sh_pref_celebrate") || "on") === "off") return;
    pt = +pt; ps = ps === null ? NaN : +ps;
    var from = Math.floor(ps / 3) === pt ? ps : pt * 3;   // the dashboard used to save only the tier
    var d = { from: pt, fromLevel: from % 3 + 1, to: t, level: p.level || step % 3 + 1, xp: p.xp, next_at: p.next_at, position: p.position, of: p.of };
    if (t > pt) playRankUp("tier", d, opt.busy);
    else if (t === pt && step > from) playRankUp("level", d, opt.busy);
  }
  /* try them from the console: shRanks.preview("tier", 3) (Silver -> Gold), shRanks.preview("level", 4, 2) (Gold I -> II),
     shRanks.preview("trophy", 6) (a TROPHIES index), shRanks.preview("mastery", 2) (Gold), shRanks.preview("mock", 37, 40) */
  function preview(kind, a, b){
    if (kind === "trophy") { var tr = TROPHIES[Math.max(0, Math.min(TROPHIES.length - 1, a | 0))]; withRankUp(function(U){ U.trophy(trophyCard(tr)); }); return; }
    if (kind === "mastery") { withRankUp(function(U){ U.trophy(masteryCard(Math.max(0, Math.min(3, a | 0)), pageHub())); }); return; }
    if (kind === "mock") { var tot = b || 40, c = Math.min(tot, a == null ? 34 : a | 0); withRankUp(function(U){ U.mock({ correct: c, total: tot, hub: "Preview", prev: .8,
      byLec: [{ label: "L1 · Lecture one", correct: 7, total: 8 }, { label: "L2 · Lecture two", correct: 5, total: 7 }, { label: "L3 · Lecture three", correct: 2, total: 3 }],
      missed: function(){} }); }); return; }
    a = a == null ? 3 : Math.max(0, Math.min(6, a | 0));
    var d = kind === "level" ? { from: a, to: a, level: Math.max(2, Math.min(3, b || 2)) }
      : { from: a, fromLevel: 3, to: Math.max(1, Math.min(6, b == null ? a + 1 : b | 0)), level: 1 };
    if (kind !== "level" && d.to <= d.from) d.from = d.to - 1;
    withRankUp(function(U){ U[kind === "level" ? "level" : "tier"](d); });
  }
  /* a hub mastery medal (Bronze 50% ... Crown 100%), as a trophy card */
  var MASTERY_PAL = ["bronze", "silver", "gold", "gold"];
  function masteryCard(i, hub){
    return { name: MASTERY[i].n + " mastery", eyebrow: "Hub mastery" + (hub ? " · " + hubName(hub) : ""), art: medalSvg(i + 1, 84, hub), pal: MASTERY_PAL[i],
      desc: i === 3 ? "Every question right. The crown now sits next to your name on every leaderboard." : "A " + MASTERY[i].n.toLowerCase() + " medal with this hub's emblem now shows next to your name on every leaderboard.",
      rarity: function(){ return rarityOf ? rarityOf(MASTERY[i].k) : null; } };
  }

  /* ---------- the hub widget: rank card, hub mastery, trophy case, link devices, accent unlocks ---------- */
  function mount(H){
    if (!H || window.__shRanksMounted) return;
    window.__shRanksMounted = true;
    var SB = H.supabase, esc = H.esc;
    applyAccent(ls("sh_pref_accent"));
    if (!SB) return;
    function rpc(name, args){ return SB.rpc(name, args).then(function(r){ return r && !r.error ? r.data : null; }, function(){ return null; }); }
    var profile = null, mastery = null;

    var panel = H.statsPanel();
    var sec = document.createElement("div");
    sec.className = "shstat-sec sh-rank-sec"; sec.id = "sh-rank-sec";
    sec.innerHTML = '<div class="shstat-empty">Loading your rank…</div>';
    if (panel) { var first = panel.querySelector(".shstat-sec"); panel.insertBefore(sec, first || null); }

    /* Settings: accent colors */
    var settings = document.getElementById("shstat-settingspanel");
    var accRow = document.createElement("div");
    accRow.className = "shset-row sh-accent-row";
    if (settings) { var eggsRow = settings.querySelector('[data-pref="eggs"]'); settings.insertBefore(accRow, eggsRow ? eggsRow.closest(".shset-row") : null); }
    function drawAccents(){
      var have = profile ? profile.tier : +(ls("sh_rank_tier") || 0), cur = ls("sh_pref_accent") || "default";
      accRow.innerHTML = '<label>Accent color</label><div class="sh-accent-swatches">' +
        '<button type="button" data-acc="default" aria-pressed="' + (cur === "default") + '" title="The hub\'s own color"><span class="sh-acc-dot sh-acc-default"></span>Hub</button>' +
        Object.keys(ACCENTS).map(function(k){
          var a = ACCENTS[k], locked = have < a.tier;
          return '<button type="button" data-acc="' + k + '" aria-pressed="' + (cur === k) + '"' + (locked ? ' disabled title="Unlocks at ' + TIERS[a.tier].name + '"' : '') + '>' +
            '<span class="sh-acc-dot" style="background:' + a.L[0] + ' url(\'' + accentTex(k) + '\') center/cover"></span>' + TIERS[a.tier].name + (locked ? ' <svg class="sh-acc-lock" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>' : '') + '</button>';
        }).join("") + '</div><div class="shset-hint">Unlocked by your handpiece rank. Buttons, switches and progress bars in every hub take on that metal.</div>';
    }
    accRow.addEventListener("click", function(e){
      var b = e.target.closest("[data-acc]"); if (!b || b.disabled) return;
      var k = b.getAttribute("data-acc"); ls("sh_pref_accent", k === "default" ? null : k); applyAccent(k); drawAccents();
    });
    drawAccents();

    /* the little handpiece next to your name */
    function badgeIcon(t){
      var uri = svgDataUri(art(t, 20));
      ["sh-ribbon-name", "shname-badge"].forEach(function(id){
        var el = document.getElementById(id); if (!el) return;
        el.classList.add("sh-has-rank"); el.style.setProperty("--sh-rank-img", uri); el.setAttribute("data-rank", TIERS[t].name);
        if (profile && profile.level) el.setAttribute("data-rank-lv", ROMAN[profile.level - 1]);
      });
    }

    function masteryFor(){
      var bank = ((window.SH_EXPORT || {}).questions || []).length;
      var row = (mastery || []).filter(function(r){ return r.hub === H.hub; })[0];
      var got = row ? row.latest_correct : 0, pct = bank ? got / bank : 0, lvl = -1;
      MASTERY.forEach(function(m, i){ if (bank && pct >= m.pct) lvl = i; });
      return { bank: bank, got: got, pct: pct, lvl: lvl };
    }
    /* how many people have each trophy (get_trophy_stats, migration_v32), out of everyone who has answered */
    var tstats = null, tstatsAt = 0;
    function loadTrophyStats(){
      if (Date.now() - tstatsAt < 600000) return;
      tstatsAt = Date.now();
      rpc("get_trophy_stats", {}).then(function(rows){
        if (!rows || !rows.length) { tstatsAt = 0; return; }
        tstats = {}; rows.forEach(function(r){ tstats[r.kind] = { n: r.n | 0, total: r.total | 0 }; });
        render();
      });
    }
    /* celebrations wait while a mock exam is in progress (on the mock tab with answers still open); once it is
       submitted they play, after its results card */
    function mockBusy(){
      try {
        if (!/(^|\/)mock/.test(String(H.section ? H.section() : ""))) return false;
        return !!document.querySelector("[data-mock-pick]:not([disabled]), [data-exam-choice], [data-exam-multi], [data-exam-match]");
      } catch (e) { return false; }
    }
    rarityOf = function(k){ return rarity(k); };
    function rarity(k){
      if (!tstats) return null;
      var any = null; for (var key in tstats) { any = tstats[key]; break; }
      var r = tstats[k] || { n: 0, total: any ? any.total : 0 };
      if (!r.total) return null;
      var p = r.n / r.total * 100;
      return { n: r.n, total: r.total, label: !r.n ? "nobody yet" : p < 1 ? "<1%" : Math.round(p) + "%" };
    }
    function trophyHTML(tr, earned){
      var hidden = tr.secret && !earned, rr = rarity(tr.k);
      return '<button type="button" class="sh-trophy' + (earned ? " is-earned" : "") + '" data-trophy="' + tr.k + '" title="' + esc(hidden ? "Secret: tap for a clue" : tr.d) + '">' +
        '<span class="sh-trophy-medal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
        (hidden ? '<path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14M12 17.5h.01"/>' : '<path d="' + tr.ic + '"/>') + '</svg></span>' +
        '<span class="sh-trophy-name">' + esc(hidden ? "???" : tr.n) + '</span>' +
        (rr ? '<span class="sh-trophy-pct" title="' + rr.n + ' of ' + rr.total + ' classmates have it">' + esc(rr.label) + '</span>' : '') + '</button>';
    }
    function render(){
      if (!profile) return;
      var t = profile.tier || 0, xp = profile.xp || 0, next = profile.next_at, at = profile.step_at != null ? profile.step_at : (profile.tier_at || 0);
      var lvl = profile.level || 1, step = profile.step != null ? profile.step : t * 3;
      var pct = next ? Math.max(0, Math.min(1, (xp - at) / (next - at))) : 1;
      var m = masteryFor(), badges = profile.badges || [];
      var h = '<div class="sh-rank-card sh-tier-' + TIERS[t].key + '">' +
        '<div class="sh-rank-art-wrap">' + art(t, 108, { animate: true, level: lvl }) + '</div>' +
        '<div class="sh-rank-info"><div class="sh-rank-eyebrow">Your handpiece</div>' +
        '<div class="sh-rank-name">' + rankName(t, lvl) + '</div>' +
        '<div class="sh-rank-xp"><b>' + fmt(xp) + '</b> XP' + (profile.position ? ' · #' + profile.position + ' of ' + profile.of : '') + '</div>' +
        '<div class="sh-rank-bar"><i style="width:' + (pct * 100).toFixed(1) + '%"></i></div>' +
        '<div class="sh-rank-next">' + (next ? fmt(next - xp) + ' XP to ' + rankName(Math.floor((step + 1) / 3), (step + 1) % 3 + 1) : 'The highest rank there is.') + '</div>' +
        (window.shEditName ? '<button type="button" class="sh-rank-rename">' + (window.shNameNow && window.shNameNow() ? 'Shown as ' + esc(window.shNameNow()) + ' · change' : 'Change your name') + '</button>' : '') +
        '</div></div>';
      if (m.bank) {
        h += '<div class="sh-mastery"><div class="sh-mastery-top"><span>Mastery in this hub</span><b>' + Math.round(m.pct * 100) + '%' + (m.lvl >= 0 ? ' · ' + MASTERY[m.lvl].n : '') + '</b></div>' +
          '<div class="sh-mastery-bar"><i style="width:' + (m.pct * 100).toFixed(1) + '%"></i>' +
          MASTERY.map(function(x, i){ return '<span class="sh-mastery-tick' + (m.lvl >= i ? ' is-hit' : '') + '" style="left:' + (x.pct * 100) + '%" title="' + x.n + ' at ' + Math.round(x.pct * 100) + '%"></span>'; }).join("") +
          '</div><div class="sh-mastery-note">' + fmt(m.got) + ' of ' + fmt(m.bank) + ' questions right on your latest try. Bronze 50% · Silver 75% · Gold 90% · Crown 100%. ' +
          'Each one puts a medal next to your name on every leaderboard.</div></div>';
      }
      var myFlair = flairFromBadges(badges.concat(m.lvl >= 0 ? [MASTERY[m.lvl].k + ":" + H.hub] : []));
      /* Timmy Tooth's house (widget/pet.js) hangs a pennant per mastered hub */
      if ((ls("sh_rank_flair") || "") !== myFlair) { ls("sh_rank_flair", myFlair || null); try { document.dispatchEvent(new CustomEvent("sh:rank")); } catch (e) {} }
      if (myFlair) h += '<div class="sh-flair-row"><span>Your mastery medals</span>' + flair(myFlair, { list: true, big: true }) + '</div>';
      var earned = {}; badges.forEach(function(b){ earned[b.split(":")[0]] = true; });
      h += '<div class="sh-trophies-h"><span>Trophy case</span><b>' + TROPHIES.filter(function(x){ return earned[x.k]; }).length + ' / ' + TROPHIES.length + '</b></div>' +
        '<div class="sh-trophies">' + TROPHIES.map(function(x){ return trophyHTML(x, earned[x.k]); }).join("") + '</div>' +
        '<p class="sh-trophy-detail" aria-live="polite">' + psst(earned) + '</p>' +
        hubCases(badges, m) +
        '<details class="sh-rank-how"><summary>How XP works</summary><p>10 XP the first time you get a question right, 2 for any other right answer, 1 for a miss (effort counts), and 20 for every day you study. Answer XP is capped at 600 a day, so steady studying beats cramming. Each rank has three levels (I, II, III). Ranks start at: ' +
        TIERS.map(function(x){ return x.name + ' ' + fmt(x.at); }).join(" · ") + ' XP.</p></details>' +
        '<div class="sh-link"><button type="button" class="sh-link-toggle" aria-expanded="false">Link my devices</button><div class="sh-link-body" hidden></div></div>';
      sec.innerHTML = h;
      // hub mastery tiers become trophies on the server once reached; a new one is announced, since it shows to everyone
      var fresh = -1;
      for (var i = 0; i <= m.lvl; i++) {
        var key = MASTERY[i].k;
        if (badges.indexOf(key + ":" + H.hub) < 0) {
          fresh = i; badges.push(key + ":" + H.hub);
          rpc("record_achievement", { p_visitor: H.visitor, p_kind: key, p_hub: H.hub });
        }
      }
      if (fresh >= 0) masteryToast(fresh);
      var srow = (mastery || []).filter(function(r){ return r.hub === H.hub; })[0];
      if (m.bank && srow && srow.seen >= m.bank && badges.indexOf("seen-all:" + H.hub) < 0) {
        badges.push("seen-all:" + H.hub);
        rpc("record_achievement", { p_visitor: H.visitor, p_kind: "seen-all", p_hub: H.hub });
        hubTrophyCard("seen-all");
      }
    }
    function hubTrophyCard(k){
      if (H.prefGet("sh_pref_celebrate", "on") === "off") return;
      var t = HUB_TROPHIES.filter(function(x){ return x.k === k; })[0]; if (!t) return;
      playRankUp("trophy", trophyCard({ k: t.k, n: t.n, d: t.d + " (" + hubName(H.hub) + ")", ic: t.ic }), mockBusy);
    }
    function masteryToast(i){
      if (H.prefGet("sh_pref_celebrate", "on") === "off") return;
      playRankUp("trophy", masteryCard(i, H.hub), mockBusy);
    }

    /* one section per hub in the trophy case: this hub first (open), then every other hub you've studied or earned in */
    function hubCases(badges, m){
      var byHub = {}, here = H.hub;
      badges.forEach(function(b){ var i = String(b).indexOf(":"); if (i < 0) return; var k = b.slice(0, i), hb = b.slice(i + 1);
        if (HUB_TROPHIES.some(function(t){ return t.k === k; }) || TROPHIES.some(function(t){ return t.k === k; })) (byHub[hb] = byHub[hb] || {})[k] = 1; });
      /* the current hub's mastery and coverage count right away, before the server has the badge */
      var mine = byHub[here] = byHub[here] || {};
      for (var i = 0; i <= m.lvl; i++) mine[MASTERY[i].k] = 1;
      var row = (mastery || []).filter(function(r){ return r.hub === here; })[0];
      if (m.bank && row && row.seen >= m.bank) mine["seen-all"] = 1;
      (mastery || []).forEach(function(r){ if (r.seen > 0 && /^[a-z0-9-]+$/.test(r.hub) && HUB_NAMES[r.hub]) byHub[r.hub] = byHub[r.hub] || {}; });
      var hubs = Object.keys(byHub).filter(function(hb){ return hb === here || HUB_NAMES[hb]; }).sort(function(a, b){ return (a === here ? -1 : b === here ? 1 : 0) || (a < b ? -1 : 1); });
      return '<div class="sh-trophies-h"><span>Hub trophies</span></div>' + hubs.map(function(hb){
        var got = byHub[hb], n = HUB_TROPHIES.filter(function(t){ return got[t.k]; }).length;
        var found = TROPHIES.filter(function(t){ return t.secret && got[t.k] && !HUB_TROPHIES.some(function(x){ return x.k === t.k; }); });
        return '<details class="sh-hubcase"' + (hb === here ? ' open' : '') + '><summary><span>' + esc(hubName(hb)) + (hb === here ? ' <em>this hub</em>' : '') + '</span><b>' + n + ' / ' + HUB_TROPHIES.length + '</b></summary>' +
          '<div class="sh-trophies">' + HUB_TROPHIES.map(function(t){
            var e = !!got[t.k], hidden = t.secret && !e;
            return '<button type="button" class="sh-trophy' + (e ? ' is-earned' : '') + '" data-htrophy="' + t.k + '" data-hub="' + esc(hb) + '" title="' + esc(hidden ? "Secret: tap for a clue" : t.d) + '">' +
              '<span class="sh-trophy-medal"' + (e && t.c ? ' style="color:' + t.c + '"' : '') + '><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
              (hidden ? '<path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14M12 17.5h.01"/>' : '<path d="' + t.ic + '"/>') + '</svg></span>' +
              '<span class="sh-trophy-name">' + esc(hidden ? "???" : t.n) + '</span></button>';
          }).join("") + '</div>' +
          (found.length ? '<p class="sh-hubcase-found">Secrets found here: ' + found.map(function(t){ return esc(t.n); }).join(", ") + '</p>' : '') +
          '</details>';
      }).join("");
    }
    /* a clue for one secret you haven't found yet, different on each open */
    function psst(earned){
      var left = TROPHIES.filter(function(x){ return x.secret && !earned[x.k]; });
      if (!left.length) return "You've found every secret. Tap a trophy to see what it's for.";
      var x = left[Math.floor(Math.random() * left.length)];
      return '<b>Psst.</b> ' + esc(x.clue) + ' <span class="sh-trophy-hint">Tap any trophy for more.</span>';
    }
    sec.addEventListener("click", function(e){ if (e.target.closest(".sh-rank-rename") && window.shEditName) window.shEditName(); });
    document.addEventListener("sh:name", function(){ render(); });
    sec.addEventListener("click", function(e){
      var hb = e.target.closest("[data-htrophy]"); if (!hb || !profile) return;
      var t = HUB_TROPHIES.filter(function(x){ return x.k === hb.getAttribute("data-htrophy"); })[0]; if (!t) return;
      var e2 = hb.classList.contains("is-earned"), det = hb.closest(".sh-hubcase").querySelector(".sh-hubcase-detail");
      sec.querySelectorAll("[data-htrophy], [data-trophy]").forEach(function(x){ x.classList.toggle("is-sel", x === hb); });
      if (!det) { det = document.createElement("p"); det.className = "sh-trophy-detail sh-hubcase-detail"; hb.closest(".sh-trophies").insertAdjacentElement("afterend", det); }
      det.innerHTML = e2 ? '<b>' + esc(t.n) + '.</b> ' + esc(t.d) + '. Earned in ' + esc(hubName(hb.getAttribute("data-hub"))) + '.'
        : t.secret ? '<b>Secret.</b> ' + esc(t.clue) : '<b>' + esc(t.n) + '.</b> ' + esc(t.d) + '.';
    });
    sec.addEventListener("click", function(e){
      var b = e.target.closest("[data-trophy]"); if (!b || !profile) return;
      var tr = TROPHIES.filter(function(x){ return x.k === b.getAttribute("data-trophy"); })[0]; if (!tr) return;
      var got = (profile.badges || []).some(function(k){ return k.split(":")[0] === tr.k; });
      sec.querySelectorAll("[data-trophy]").forEach(function(x){ x.classList.toggle("is-sel", x === b); });
      var rr = rarity(tr.k), share = !rr ? '' : ' <span class="sh-trophy-hint">' + (rr.n ? rr.n + ' of ' + rr.total + ' classmates (' + rr.label + ') have it.' : 'Nobody has found this one yet.') + '</span>';
      sec.querySelector(".sh-trophy-detail").innerHTML = (got ? '<b>' + esc(tr.n) + '.</b> ' + esc(tr.d) + '. Earned.'
        : tr.secret ? '<b>Secret.</b> ' + esc(tr.clue) : '<b>' + esc(tr.n) + '.</b> ' + esc(tr.d) + '.') + share;
    });

    var loading = false;
    function load(){
      if (loading) return; loading = true;
      loadTrophyStats();
      Promise.all([rpc("get_rank_profile", { p_visitor: H.visitor }), rpc("get_hub_mastery", { p_visitor: H.visitor })]).then(function(r){
        loading = false;
        if (!r[0]) { if (!profile) sec.innerHTML = '<div class="shstat-empty">Ranks load when you are online.</div>'; return; }
        profile = r[0]; mastery = r[1] || [];
        if (window.shPet && window.shPet.syncBadges) window.shPet.syncBadges(profile.badges);
        track(profile, { busy: mockBusy });
        badgeIcon(profile.tier || 0); render(); drawAccents(); applyAccent(ls("sh_pref_accent"));
        /* Full Arch is once per hub: if it's done on any device, eggs.js stops showing it here */
        if ((profile.badges || []).indexOf("fullarch:" + H.hub) >= 0) document.dispatchEvent(new CustomEvent("sh:arch-done", { detail: H.hub }));
      });
    }
    load();
    var sinceLoad = 0;
    document.addEventListener(H.answeredEvent, function(){ if (++sinceLoad >= 10) { sinceLoad = 0; setTimeout(load, 1500); } });
    document.addEventListener("click", function(e){
      if (e.target.closest && e.target.closest("#shstat-stats-pill")) setTimeout(load, 50);
    });
    document.addEventListener("sh:mock-done", function(e){
      var d = e.detail || {};
      if (d.total > 0 && !window.shAutomated) rpc("record_mock_score", { p_visitor: H.visitor, p_hub: H.hub, p_correct: d.correct | 0, p_total: d.total | 0 });
      if (d.total >= 20 && d.correct / d.total >= 0.9) rpc("record_achievement", { p_visitor: H.visitor, p_kind: "mock90", p_hub: H.hub }).then(function(){ setTimeout(load, 800); });
      if (d.total >= 20 && d.correct === d.total) rpc("record_achievement", { p_visitor: H.visitor, p_kind: "mock-perfect", p_hub: H.hub });
    });

    /* link my devices */
    sec.addEventListener("click", function(e){
      var tg = e.target.closest(".sh-link-toggle");
      var body = sec.querySelector(".sh-link-body");
      if (tg) {
        var open = body.hidden; body.hidden = !open; tg.setAttribute("aria-expanded", String(open));
        if (open) body.innerHTML = '<p>Use one rank, streak, trophy case and question progress on your phone and laptop. Questions you answer on one show up as tried on the other the next time you open that hub.</p>' +
          '<div class="sh-link-step"><b>1. On the device you use most</b><button type="button" class="sh-link-make">Get a code</button><div class="sh-link-code" aria-live="polite"></div></div>' +
          '<div class="sh-link-step"><b>2. On your other device</b><div class="sh-link-enter"><input type="text" maxlength="7" autocomplete="one-time-code" autocapitalize="characters" placeholder="Code" aria-label="Link code"><button type="button" class="sh-link-go">Link</button></div>' +
          '<div class="sh-link-msg" aria-live="polite"></div></div>';
        return;
      }
      if (e.target.closest(".sh-link-make")) {
        var out = sec.querySelector(".sh-link-code"); out.textContent = "…";
        rpc("create_link_code", { p_visitor: H.visitor }).then(function(c){
          out.innerHTML = c ? '<span class="sh-link-big">' + esc(c.slice(0, 3) + " " + c.slice(3)) + '</span><small>Enter it on your other device in the next 10 minutes.</small>' : "Couldn’t make a code. Are you online?";
          if (c) linkTrack("code");
        });
        return;
      }
      if (e.target.closest(".sh-link-go")) {
        var inp = sec.querySelector(".sh-link-enter input"), msg = sec.querySelector(".sh-link-msg");
        var code = (inp.value || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
        if (code.length !== 6) { msg.textContent = "Codes are 6 letters and numbers."; return; }
        msg.textContent = "Linking…";
        rpc("redeem_link_code", { p_code: code, p_visitor: H.visitor }).then(function(id){
          if (!id) { linkTrack("fail"); msg.textContent = "That code didn’t work. Codes last 10 minutes; make a fresh one and try again."; return; }
          if (id === H.visitor) { msg.textContent = "This device already uses that code’s account."; return; }
          linkTrack("linked");
          try { if (window.shClicks && window.shClicks.flush) window.shClicks.flush(); } catch (e) {}
          ls("sh_visitor_id", id); ls("sh_display_name", null); ls("sh_rank_tier", null); ls("sh_trophy_seen", null);
          rpc("get_display_name", { p_visitor: id }).then(function(n){
            if (n) ls("sh_display_name", n);
            msg.textContent = "Linked! Reloading…";
            setTimeout(function(){ location.reload(); }, 900);
          });
        });
      }
    });
  }

  var miniCache = {};
  window.shRanks = {
    TIERS: TIERS, TROPHIES: TROPHIES, HUB_TROPHIES: HUB_TROPHIES, MASTERY: MASTERY,
    art: art,
    mini: function(tier, level){
      tier = Math.max(0, Math.min(6, tier | 0)); level = level ? Math.max(1, Math.min(3, level | 0)) : 0;
      var k = tier + ":" + level;
      return miniCache[k] || (miniCache[k] = '<span class="sh-rank-mini" title="' + rankName(tier, level) + '">' + art(tier, 20) +
        (level ? '<b class="sh-rank-lv sh-lv-' + TIERS[tier].key + '">' + ROMAN[level - 1] + '</b>' : '') + '</span>');
    },
    flair: flair, flairFromBadges: flairFromBadges, medal: medalSvg, hubName: hubName,
    mount: mount, track: track, preview: preview,
    /* widget/fx.js: the mock exam results card (and anything else that should take turns with the rank-ups) */
    celebrate: function(kind, d){ withRankUp(function(U){ if (U[kind]) U[kind](d); }); }, applyAccent: applyAccent, accentTex: accentTex, accentSvg: accentSvg, svgDataUri: svgDataUri, rankName: rankName, ACCENTS: ACCENTS,
    tierFor: function(xp){ var t = 0; TIERS.forEach(function(x, i){ if (xp >= x.at) t = i; }); return t; },
    levelFor: function(xp){ var t = this.tierFor(xp), lo = TIERS[t].at, hi = t < 6 ? TIERS[t + 1].at : 125000; return Math.min(3, 1 + Math.floor((xp - lo) * 3 / (hi - lo))); },
    shade: shade
  };
})();
