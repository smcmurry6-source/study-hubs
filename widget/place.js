/* ============ TIMMY'S PLACE (widget/place.js, window.shPlace): redesign phase 4, part C ============
   The house card redrawn as a scene you build. Only the redesign's pages load this file, and only on first use (the new
   dashboard when its "you" card is first touched, a new hub from More, Timmy's place): never with a page, and the live
   hubs and the live dashboard keep widget/pet.js's house card until the release. From widget/pet.js it reads shPet.hp(),
   art() and holidayId(), and it tells shPet.setOutfit() when the outfit slot changes, so Timmy on the bar and the
   dashboard's card wears it at once (everyone has Timmy, vault/tasks/2026-11-12-redesign-ask-timmy.md, part 4).

   The drawings are a kit, widget/hub-art/place.js (window.SH_PLACE, built from tools/figures/site/place.mjs), fetched
   here the first time a place is drawn; each seasonal set and the rank sets are a file of their own
   (widget/hub-art/place/<set>.js), fetched only when a piece of that set stands at the place or is in the drawer.

   What it shows:
     - the card (shPlace.card): the place as a picture with Timmy at the door; tapping it opens the full view;
     - the full view (shPlace.open): Timmy hops between spots on the ground, waves, talks from a bubble over his head,
       and looks, moves and behaves as his HP says (the kit's HEALTH table); tapping things plays their eggs; the medal
       board opens the big view of every hub's medal;
     - the customizer: what stands where, from what you own, saved at once through equip_item.

   The server is migration_v54 (vault/reference/game-server.md): get_my_shop's inventory, locked and equipped, and
   equip_item(visitor, slot, item) with its thirteen slots (outfit, home, scene, the five yard spots yard-left,
   yard-front, yard-corner, yard-side, yard-right, and windows, porch, chimney, flag, paint). The bowling lane is wide:
   it always stands in the side yard and takes the front corner too. On a database without the game layer the place
   shows the defaults with your rank and medals, and the customizer isn't offered.

   The customizer's "Get more in the shop" fetches Timmy's shop (widget/shop.js, part B) and opens it over the place.

   Every button carries a fixed data-tp value, so click counts (widget/clicks.js) never pick up anyone's words.
   ============ */
(function(){
  "use strict";
  if (window.shPlace) return;
  var W = window, D = document, me = D.currentScript;
  var BASE = me && me.src ? me.src.replace(/[^\/]*(\?.*)?$/, "") : "widget/";
  var reduced = false; try { reduced = matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  function ls(k){ try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v){ try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function $(s, r){ return (r || D).querySelector(s); }
  function $$(s, r){ return [].slice.call((r || D).querySelectorAll(s)); }
  function copy(o){ var c = {}; Object.keys(o || {}).forEach(function(k){ c[k] = o[k]; }); return c; }
  function track(k){ try { if (W.shTrack) W.shTrack(k); } catch (e) {} }
  function lowerFirst(t){ t = String(t || ""); return /^[A-Z]([a-z]| )/.test(t) && !/^Timmy/.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t; }
  function cardName(n){ n = String(n || "").replace(/^(The|A|An) /, ""); return n.charAt(0).toUpperCase() + n.slice(1); }
  function keyed(el, fn){ el.addEventListener("keydown", function(e){ if (e.key === "Enter" || e.key === " "){ e.preventDefault(); e.stopPropagation(); fn(); } }); }

  /* ---------- loading: the kit, the stylesheet and a set's file, each once and only when first needed ---------- */
  var memo = {}, TP = null, KEYS = null;
  function script(src){
    return memo[src] || (memo[src] = new Promise(function(res, rej){ var s = D.createElement("script"); s.src = src; s.async = true; s.onload = function(){ res(); }; s.onerror = function(){ delete memo[src]; rej(new Error(src)); }; D.head.appendChild(s); }));
  }
  function css(){ if (memo.css) return; memo.css = 1; var l = D.createElement("link"); l.rel = "stylesheet"; l.href = BASE + "place.css"; D.head.appendChild(l); }
  function kit(){
    css();
    if (TP) return Promise.resolve(TP);
    return script(BASE + "hub-art/place.js").then(function(){ TP = W.SH_PLACE; if (!TP || !TP.addPack) { TP = null; throw new Error("no kit"); } return TP; });
  }
  /* the rank sets' pieces are the set "rank" in the kit's list, and their file is ranks.js */
  function packOf(id){ var s = id && TP.setOf(id); return s === "rank" ? "ranks" : s; }
  function needPacks(ids){
    var want = {}; (ids || []).forEach(function(id){ var k = packOf(id); if (k && !TP.hasPack(k)) want[k] = 1; });
    var list = Object.keys(want); if (!list.length) return Promise.resolve();
    return Promise.all(list.map(function(k){ return script(BASE + "hub-art/place/" + k + ".js").then(null, function(){}); })).then(function(){ KEYS = null; });
  }
  /* the kit's own key for a shop id ("sunglasses-lei" is its "sunnies"); a set's piece has one name for both */
  function keys(){
    if (KEYS) return KEYS;
    KEYS = { home: {}, scene: {}, yard: {}, outfit: {} };
    [["home", TP.HOMES], ["scene", TP.SCENES], ["yard", TP.YARD], ["outfit", TP.OUTFITS]].forEach(function(p){ p[1].forEach(function(x){ if (x.id) KEYS[p[0]][x.id] = x.k; }); });
    return KEYS;
  }
  function key(kind, id){ return id ? keys()[kind][id] || "" : ""; }
  function byK(list, k){ for (var i = 0; i < list.length; i++) if (list[i].k === k) return list[i]; return null; }

  /* ---------- what the place knows: whose it is, what's owned, what stands where, the rank and the medals ---------- */
  var S = { sb: null, visitor: null, game: false, eq: {}, own: {}, locked: [], profile: null, flair: null, tints: null, asked: false };
  var YARD_SLOTS = ["left", "front", "corner", "side", "right"], UPS = ["windows", "porch", "chimney", "flag"];
  function takeShop(sh){
    if (!sh || typeof sh !== "object" || !sh.inventory) return false;
    S.game = true; S.eq = copy(sh.equipped); S.own = {}; (sh.inventory || []).forEach(function(x){ if (x && x.id) S.own[x.id] = x.how || "bought"; });
    S.locked = (sh.locked || []).filter(function(x){ return x && x.id; });
    return true;
  }
  function setup(o){
    o = o || {};
    if (o.sb) S.sb = o.sb;
    if (o.visitor) S.visitor = o.visitor;
    if (o.profile) S.profile = o.profile;
    if (o.flair != null) S.flair = o.flair;
    if (o.tints) S.tints = o.tints;
    if (o.shop) takeShop(o.shop);
    return api;
  }
  /* today's shop for this visitor, for what's owned and where it stands (another device may have moved things) */
  function readShop(){
    if (!S.sb || !S.visitor || (S.asked && !S.game)) return Promise.resolve(S.game);
    S.asked = true;
    return S.sb.rpc("get_my_shop", { p_visitor: S.visitor }).then(function(r){ if (r && !r.error) takeShop(r.data); return S.game; }, function(){ return S.game; });
  }
  D.addEventListener("sh:rank-profile", function(e){ var d = e.detail || {}; if (d.profile) { S.profile = d.profile; repaint(); } });

  /* the model a view draws: yours, or someone's you are visiting (get_place: the place, the rank and the medals, and
     never their HP, so a visited Timmy is always drawn well) */
  function mine(){ return { eq: S.eq, profile: S.profile, flair: S.flair != null ? S.flair : ls("sh_rank_flair"), visiting: false, name: "" }; }
  function theirs(p){ return { eq: copy(p.equipped), profile: p.rank || null, flair: p.flair || "", visiting: true, name: String(p.name || "") }; }
  /* the rank the place shows: the journey (0 the Handpiece, 1 the ModuPro, 2 the Loupes), its tier and level. Past the
     Handpiece the pedestal carries the ModuPro and, in the loupes journey, Timmy wears loupes (Sam's yes to the contact
     sheet, 2026-11-12) */
  function rankOf(m){
    var p = m.profile;
    if (!p) return { journey: 0, tier: m.visiting ? 0 : Math.max(0, Math.min(6, +(ls("sh_rank_tier") || 0))), level: 1 };
    var j = Math.max(0, Math.min(2, p.journey | 0)), t = Math.max(0, Math.min(6, p.tier | 0)), lv = Math.max(1, Math.min(3, p.level | 0 || 1));
    return { journey: j, tier: t, level: lv };
  }
  function flairOf(m){
    var tints = S.tints || (W.SH_DASH_ART && W.SH_DASH_ART.tints) || {}, own = W.SH_HUB_ART_HUB, here = W.SH_HUB && W.SH_HUB.id;
    return String(m.flair || "").split(",").map(function(x){ var i = x.lastIndexOf(":"); return { hub: x.slice(0, i), lvl: +x.slice(i + 1) }; })
      .filter(function(x){ return x.hub && x.lvl >= 1 && x.lvl <= 4; })
      .map(function(x){ var t = tints[x.hub] || (own && here === x.hub && own.tint) || null; if (t && (t.ink || t.mid)) x.tint = t.ink || t.mid; return x; });
  }
  var HOLIDAYS = ["halloween", "thanksgiving", "winter", "newyear", "valentine", "dentist", "stpatrick", "easter"];
  function holiday(){ var h = ""; try { h = W.shPet && W.shPet.holidayId ? W.shPet.holidayId() : ""; } catch (e) {} return HOLIDAYS.indexOf(h) >= 0 ? h : ""; }
  /* the long seasons at the place, by the Central day (YYYY-MM-DD): spring March 20 to May 31, summer June 1 to
     September 21, fall September 22 to November 30, and none from December to March 19. The same days the server puts
     those seasons' sets on sale (sh_shop_seasons in migration_v54; tools/release/xp.js checks every day of three
     years). Timmy's own holidays stay widget/pet.js's holidayId(), which the server's sh_season follows. */
  function seasonOn(day){ var p = String(day).split("-"), x = +p[1] * 100 + +p[2]; return x >= 320 && x <= 531 ? "spring" : x >= 601 && x <= 921 ? "summer" : x >= 922 && x <= 1130 ? "fall" : ""; }
  function centralDay(){ try { return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" }).format(new Date()); } catch (e) { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); } }
  function night(){ var h = new Date().getHours(); return h < 7 || h >= 19; }
  function hpOf(m){ var hp = null; if (!m.visiting) { try { hp = W.shPet && W.shPet.hp ? W.shPet.hp() : null; } catch (e) {} } return typeof hp === "number" ? Math.max(0, Math.min(100, Math.round(hp))) : 82; }

  /* what the kit is asked to draw */
  function optsOf(m, extra){
    var e = m.eq || {}, r = rankOf(m), s = seasonOn(centralDay());
    var o = { home: key("home", e.home) || "cottage", scene: key("scene", e.scene) || "hill", yard: {}, up: {}, paint: e.paint ? String(e.paint).replace(/^paint-/, "") : "cream",
      tier: r.tier, level: r.level, journey: r.journey, flair: flairOf(m), holiday: holiday(), season: s === "summer" ? "" : s, night: night() };
    YARD_SLOTS.forEach(function(k){ var y = key("yard", e["yard-" + k]); if (y) o.yard[k] = y; });
    var lane = o.yard.side && (byK(TP.YARD, o.yard.side) || {}).wide; if (lane) delete o.yard.corner;
    UPS.forEach(function(u){ if (e[u]) o.up[u] = true; });
    if (!byK(TP.PAINTS, o.paint)) o.paint = "cream";
    if (extra) Object.keys(extra).forEach(function(k){ o[k] = extra[k]; });
    return o;
  }
  /* Timmy, as widget/pet.js draws him at this HP, in what he has on at his place, and nothing when nothing is on (Sam,
     2026-11-12: "if someone doesnt have a costume applied, they are naked. What you put wins"): never a holiday's
     outfit. In the loupes journey he wears his loupes, in the rank's material. */
  function timmySvg(m){
    var P = W.shPet; if (!P || !P.art) return "";
    var k = key("outfit", (m.eq || {}).outfit), r = rankOf(m), svg = "";
    try { svg = P.art({ hp: hpOf(m), hat: "" }, 100); } catch (e) { return ""; }
    return TP.dress(svg, k, r.journey === 2 ? { loupes: r.tier } : null);
  }
  /* Timmy inside a scene: his drawing at 36 wide, its feet (pet.js's shadow, y 226) on the spot */
  function timmyG(m){
    var svg = timmySvg(m); if (!svg) return "";
    var H = TP.healthFor(hpOf(m));
    var star = function(x, y, k, d){ return '<path class="tp-twinkle" style="animation-delay:' + d + 's" transform="translate(' + x + " " + y + ") scale(" + k + ')" d="M0 -3 L.8 -.8 L3 0 L.8 .8 L0 3 L-.8 .8 L-3 0 L-.8 -.8 Z" fill="#FFE27A" stroke="#3B2E3A" stroke-width=".35"/>'; };
    return '<g class="tp-tface"><g class="tp-tmood">' + '<svg x="-18" y="-46.1" width="36" height="47.2" viewBox="0 -30 200 262" overflow="visible">' + svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "") + "</svg></g>" +
      (H.k === "sparkling" ? star(-17, -38, 1, 0) + star(17, -28, .8, .7) + star(-19, -14, .7, 1.3) + star(15, -44, .6, 1.9) : "") + "</g>";
  }
  function sceneAlt(m){
    var o = optsOf(m), h = byK(TP.HOMES, o.home), sc = byK(TP.SCENES, o.scene), items = YARD_SLOTS.map(function(k){ return o.yard[k] ? lowerFirst(byK(TP.YARD, o.yard[k]).n) : ""; }).filter(Boolean);
    return (m.visiting && m.name ? m.name + "’s place: " : "Timmy’s place: ") + lowerFirst(h.n) + ", " + lowerFirst(sc.n) + (items.length ? ", with " + items.join(", ") : "");
  }
  function equippedIds(m){ var e = m.eq || {}; return Object.keys(e).map(function(k){ return e[k]; }); }
  function ready(m){ return kit().then(function(){ return needPacks(equippedIds(m || mine())); }); }
  function img(svg, alt, cls){
    if (!/xmlns=/.test(svg)) svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
    return '<img' + (cls ? ' class="' + cls + '"' : "") + ' src="data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg) + '" alt="' + esc(alt || "") + '" decoding="async">';
  }

  /* ---------- the card: the place as a picture, Timmy at the door. A still of it is kept on the device
     (sh_place_still), so a page can show the place at once and fetch this file and the kit only on first use ---------- */
  var CARDS = [], STILL = "sh_place_still";
  /* the card's drawing, and where the top of Timmy's head is in it (percent across and down), for a page that hangs
     its own bubble over him (the dashboard's "you" card) */
  function cardArt(m){
    var o = optsOf(m, { viewBox: TP.CARD }); var g = timmyG(m); if (g) o.timmy = { g: g, at: "door" };
    var r = TP.render(o), d = r.spots && r.spots.door, c = TP.CARD;
    return { svg: r.svg, at: d ? [Math.round((d[0] - c[0]) / c[2] * 1000) / 10, Math.round((d[1] - ((m.eq || {}).outfit ? 60 : 50) - c[1]) / c[3] * 1000) / 10] : null };
  }
  function card(host, opt){
    opt = opt || {};
    var c = { host: host, opt: opt };
    var btn = $(".tpc", host);
    if (!btn) { host.innerHTML = '<button type="button" class="tpc" data-tp="open" aria-label="Timmy’s place. Open it"></button>'; btn = host.firstChild; }
    if (!btn.__tp) { btn.__tp = 1; btn.addEventListener("click", function(){ open(); }); }
    c.paint = function(){
      return ready().then(function(){
        if (!host.isConnected) return;
        var m = mine(), art = cardArt(m), svg = art.svg, moving = !reduced && !opt.still;
        /* with its caption showing, the button is named by what's in it (the picture's description, then the caption);
           as a bare picture it carries the description itself */
        btn.innerHTML = img(moving ? svg.replace(/(<svg[^>]*>)/, function(t){ return t + "<style>" + TP.CSS.replace(/\.tp-still[^\n]*/, "") + "</style>"; }) : svg, opt.label === false ? "" : sceneAlt(m) + ". Open it.") +
          (opt.label === false ? "" : '<span class="tpc-foot"><b>Timmy’s place</b><span>' + esc(cardName(byK(TP.HOMES, optsOf(m).home).n)) + " · " + esc(lowerFirst(byK(TP.SCENES, optsOf(m).scene).n)) + "</span></span>");
        if (opt.label === false) btn.setAttribute("aria-label", sceneAlt(m) + ". Open it"); else btn.removeAttribute("aria-label");
        btn.classList.add("is-live");
        if (svg.length < 240000) { lsSet(STILL, /xmlns=/.test(svg) ? svg : svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"')); lsSet(STILL + "_at", art.at ? art.at.join(",") : null); }
        if (opt.onDraw) opt.onDraw(btn, art.at);
      }, function(){ if (opt.onFail) opt.onFail(); });
    };
    CARDS = CARDS.filter(function(x){ return x.host !== host && x.host.isConnected; }); CARDS.push(c);
    c.paint();
    return c;
  }
  var repaintT = 0;
  function repaint(){ clearTimeout(repaintT); repaintT = setTimeout(function(){ CARDS = CARDS.filter(function(x){ return x.host.isConnected; }); CARDS.forEach(function(x){ x.paint(); }); if (V && !V.m.visiting) build(); }, 60); }
  D.addEventListener("sh:rank", repaint);

  /* ---------- the full view ---------- */
  /* the stage's own rules, inside its shadow root with the kit's: the tap areas, the bubble over Timmy's head, his wave,
     and how he stands at each health level (as on the design page) */
  var STAGE_CSS = [
    ":host{display:block}.tp-box{position:relative;line-height:0}.tp-box>svg.tp-scene{display:block;width:100%;height:auto;user-select:none;-webkit-user-select:none}",
    ".tp-egg{outline:none}.tp-egg:focus-visible{filter:drop-shadow(0 0 2px #fff) drop-shadow(0 0 2px #fff)}.tp-timmy{cursor:pointer}",
    ".tp-hit{position:absolute;inset:0;width:100%;height:100%}.tp-hitarea{fill:transparent;stroke:transparent;stroke-width:2;cursor:pointer;outline:none;transition:fill .15s}",
    ".tp-hitarea:hover,.tp-hitarea:focus-visible{fill:rgba(255,255,255,.2);stroke:#fff;stroke-dasharray:4 4}.tp-hitarea.on{stroke:#fff;stroke-width:2.6;stroke-dasharray:5 4;fill:rgba(255,255,255,.16)}",
    ".tp-hithome.on,.tp-hithome:hover,.tp-hithome:focus-visible{fill:rgba(255,255,255,.08)}",
    /* the speech bubble comes from Timmy: it sits over his head, its tail points at him, and it follows him as he hops */
    ".tp-bubble{position:absolute;left:0;top:0;width:max-content;max-width:min(72%,300px);transform:translateY(5px) scale(.96);transform-origin:var(--tail,50%) 100%;background:#fff;color:#3B2E3A;border:2px solid #3B2E3A;border-radius:14px;",
    "padding:6px 11px;font:inherit;font-size:13.5px;font-weight:650;line-height:1.35;opacity:0;transition:opacity .18s,transform .18s;pointer-events:none;text-align:center;z-index:2}",
    ".tp-bubble.on{opacity:1;transform:none}",
    ".tp-bubble::before,.tp-bubble::after{content:'';position:absolute;left:var(--tail,50%);top:100%;transform:translateX(-50%);border-left:7px solid transparent;border-right:7px solid transparent;border-top:9px solid #3B2E3A}",
    ".tp-bubble::after{border-left-width:5px;border-right-width:5px;border-top:7px solid #fff;margin-top:-.5px}",
    ".tp-bubble.below{transform-origin:var(--tail,50%) 0}.tp-bubble.below::before,.tp-bubble.below::after{top:auto;bottom:100%;border-top:0;border-bottom:9px solid #3B2E3A}.tp-bubble.below::after{border-bottom:7px solid #fff;margin:0 0 -.5px}.tp-bubble.small{font-size:12px;padding:5px 9px;max-width:min(66%,220px)}",
    ".tp-burstpos{position:absolute;width:26%;aspect-ratio:1;transform:translate(-50%,-50%);pointer-events:none;line-height:0}",
    /* Timmy waves with his right arm (the same move as the pet's do-wave) */
    ".tp-timmy .shpet-arm-r{transform-box:fill-box;transform-origin:0% 40%}.tp-timmy.do-wave .shpet-arm-r{animation:tp-wave .38s ease-in-out var(--wn,6) alternate}@keyframes tp-wave{from{transform:rotate(0)}to{transform:rotate(var(--wa,-58deg))}}",
    /* how he stands follows his health: a bounce at his best, a droop and sway when he hurts, a shiver at his worst */
    ".tp-tmood{transform-box:fill-box;transform-origin:50% 100%}",
    ".tp-timmy.hl-bounce .tp-tmood{animation:tp-hl-bounce 1.1s ease-in-out infinite}@keyframes tp-hl-bounce{0%,100%{transform:translateY(0) scale(1,1)}50%{transform:translateY(-1.7px) scale(.985,1.025)}}",
    ".tp-timmy.hl-droop .tp-tmood{animation:tp-hl-droop 3.6s ease-in-out infinite}@keyframes tp-hl-droop{0%,100%{transform:rotate(-2.4deg) scale(1,.962)}50%{transform:rotate(2.4deg) scale(1.012,.948)}}",
    ".tp-timmy.hl-shiver .tp-tmood{animation:tp-hl-shiver 2.2s linear infinite}@keyframes tp-hl-shiver{0%,56%,100%{transform:translateX(0) scale(1.01,.935)}60%,68%,76%,84%,92%{transform:translateX(-.55px) scale(1.01,.935)}64%,72%,80%,88%,96%{transform:translateX(.55px) scale(1.01,.935)}}",
    ".tp-still .tp-tmood{animation:none!important}.tp-still .tp-timmy.hl-droop .tp-tmood{transform:scale(1,.96)}.tp-still .tp-timmy.hl-shiver .tp-tmood{transform:scale(1.01,.935)}",
    "@media (prefers-reduced-motion: reduce){.tp-bubble{transition:none}.tp-timmy.do-wave .shpet-arm-r,.tp-tmood{animation:none!important}}"
  ].join("\n");
  var V = null;                        // the open view
  var X_SVG = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
  function isStill(){ return reduced; }
  function HL(){ return TP.healthFor(hpOf(V.m)); }
  function hpLine(t){ return String(t || "").replace("{hp}", hpOf(V.m)); }
  function canChange(){ return !!(V && !V.m.visiting && S.game && S.sb && S.visitor); }

  /* ---------- a visit is a trip through the clouds: the one Sam approved on the design page (2026-11-10, round 3: "a cloud
     transition of soft separate clouds (not two curtains closing)", then "the individual clouds should be less harsh so it
     comes together more seamlessly"), ported from clouds() in tools/preview/design/design.js with its shapes and timings.
     Separate soft clouds drift in from every side and pile up over the whole screen with "Off to <name>'s place" and their
     rank, the place opens behind them, and they scatter outward again; then a burst goes up over their home. The design
     page's whoosh isn't here (the place has no sounds). None with reduced motion. ---------- */
  var CLOUD_SHAPES = [
    [[30, 62, 22], [58, 44, 30], [92, 50, 26], [118, 66, 18], [74, 70, 26], [48, 74, 18], [100, 76, 16]],
    [[26, 60, 18], [50, 48, 26], [82, 40, 28], [112, 54, 24], [92, 72, 22], [60, 74, 22], [34, 74, 14]],
    [[34, 56, 24], [66, 42, 26], [98, 46, 30], [122, 68, 16], [84, 72, 24], [52, 72, 20]]
  ];
  /* soft clouds: no ink outline, a pale underside and a faint halo, so a pile of them melts into one sky */
  function cloudSvg(k){
    var c = CLOUD_SHAPES[k % CLOUD_SHAPES.length], ring = function(grow, dy){ return c.map(function(q){ return '<circle cx="' + q[0] + '" cy="' + (q[1] + dy) + '" r="' + (q[2] + grow) + '"/>'; }).join(""); };
    return '<svg viewBox="-12 -8 168 128" aria-hidden="true" focusable="false"><g fill="#B9AEDA" opacity=".16">' + ring(9, 8) + '</g><g fill="#FFFFFF" opacity=".55">' + ring(6, 0) + '</g><g fill="#E0D8EF">' + ring(0, 5) + '</g><g fill="#FFFFFF">' + ring(0, 0) + "</g>" +
      '<g fill="none" stroke="#E4DDF1" stroke-width="4" stroke-linecap="round">' + c.slice(1, 4).map(function(q){ return '<path d="M' + (q[0] - q[2] * .5).toFixed(1) + " " + (q[1] + q[2] * .52).toFixed(1) + " q" + (q[2] * .5).toFixed(1) + " " + (q[2] * .3).toFixed(1) + " " + (q[2] * 1.02).toFixed(1) + ' 0"/>'; }).join("") + "</g></svg>";
  }
  /* the clouds roll in over the page (the window stays hidden until they cover it, is-trip) and the window shows behind them at 800 ms */
  function tripIn(dlg, m){
    var vw = W.innerWidth, vh = W.innerHeight, cols = vw > vh ? 4 : 3, rows = vw > vh ? 3 : 4, size = Math.max(vw / cols, vh / rows) * 2.05, far = Math.max(vw, vh) * .9, html = "", n = 0;
    for (var r = 0; r < rows; r++) for (var q = 0; q < cols; q++, n++) {
      var jx = ((n * 37) % 11 - 5) / 60, jy = ((n * 53) % 9 - 4) / 60, x = (q + .5) / cols + jx, y = (r + .5) / rows + jy;
      var dx = x - .5, dy = (y - .5) * .8, len = Math.sqrt(dx * dx + dy * dy);
      if (len < .12) { var a = n * 2.4; dx = Math.cos(a); dy = Math.sin(a) + .4; len = Math.sqrt(dx * dx + dy * dy); }
      html += '<span class="tpv-cloud" style="--x:' + (x * 100).toFixed(1) + "%;--y:" + (y * 100).toFixed(1) + "%;--s:" + Math.round(size * (.86 + ((n * 29) % 7) / 22)) + "px;--dx:" + Math.round(dx / len * far) + "px;--dy:" + Math.round(dy / len * far) +
        "px;--r:" + (((n * 17) % 9) - 4) * 3 + "deg;--d:" + ((n * 7) % cols * 45 + (n % 3) * 35) + "ms;--d2:" + ((n * 5) % 4) * 45 + 'ms">' + cloudSvg(n) + "</span>";
    }
    var R = W.shRanks, rk = rankOf(m), em = "";
    try { if (R) em = rk.journey > 0 && R.artOf ? R.artOf(rk.journey, rk.tier, 72, { level: rk.level }) : R.art(rk.tier, 72, { level: rk.level }); } catch (e) { em = ""; }
    var c = D.createElement("div"); c.className = "tpv-clouds"; c.setAttribute("aria-hidden", "true");
    c.innerHTML = '<i class="tpv-clfill"></i>' + html + '<div class="tpv-clmsg">' + (em ? '<span class="tpv-clhp">' + em + "</span>" : "") + "<b>" + esc("Off to " + m.name + "’s place") + "</b></div>";
    dlg.appendChild(c); void c.offsetWidth; c.classList.add("in");
    dlg._tripAt = Date.now();
    setTimeout(function(){ dlg.classList.remove("is-trip"); }, 800);
  }
  /* once the place is drawn, and not before 1.4 s (the design page's timing), the clouds scatter */
  function tripOut(dlg){
    var c = $(".tpv-clouds", dlg); if (!c) return;
    setTimeout(function(){
      if (!c.isConnected) return;
      dlg.classList.remove("is-trip"); c.classList.remove("in"); c.classList.add("out");
      setTimeout(function(){ if (V && V.dlg === dlg && V.o) burstAt("home", V.o); }, 550);
      setTimeout(function(){ tripGone(dlg); }, 950);
    }, Math.max(0, 1400 - (Date.now() - (dlg._tripAt || 0))));
  }
  function tripGone(dlg){ var c = $(".tpv-clouds", dlg); if (c && c.parentNode) c.parentNode.removeChild(c); dlg.classList.remove("is-trip"); }
  function open(o){
    o = o || {};
    if (V) return;
    css();
    var dlg = D.createElement("dialog");
    dlg.className = "tpv" + (o.place ? " is-visit" + (reduced ? "" : " is-trip") : ""); dlg.setAttribute("aria-labelledby", "tpvT");
    dlg.innerHTML = '<div class="tpv-in"><header class="tpv-top"><div class="tpv-title">' + (o.place ? '<p class="tpv-kick" aria-hidden="true">Welcome to</p>' : "") + '<h2 id="tpvT">Timmy’s place</h2><p class="tpv-sub"></p></div>' +
      '<div class="tpv-acts"><span class="tpv-seg" role="group" aria-label="What to do here" hidden><button type="button" data-tp="play" aria-pressed="true">Visit</button><button type="button" data-tp="customize" aria-pressed="false">Customize</button></span>' +
      '<button type="button" class="tpv-x" data-tp="close" aria-label="Close Timmy’s place">' + X_SVG + "</button></div></header>" +
      '<div class="tpv-body"><div class="tpv-stagewrap"><div class="tpv-stage"></div><p class="tpv-wait" role="status">Opening the door…</p>' +
      '<button type="button" class="tpv-chip tpv-zoom" data-tp="zoom" aria-pressed="true" hidden>Close-up</button></div><div class="tpv-side"></div></div><div class="tpv-over" hidden></div></div>';
    D.body.appendChild(dlg);
    V = { dlg: dlg, m: o.place ? theirs(o.place) : mine(), mode: "play", pick: /^(home|scene|timmy|left|front|corner|side|right)$/.test(o.pick || "") ? o.pick : "home", wide: false, src: {}, at: "door", pos: null, dir: 1, busy: false, next: null, raf: 0, camRaf: 0, cam: null, bub: null,
      lastTap: 0, wander: 0, visible: true, back: D.activeElement, onClose: o.onClose || null };
    dlg.addEventListener("close", shut);
    dlg.addEventListener("cancel", function(e){ if (!$(".tpv-over", dlg).hidden) { e.preventDefault(); overClose(); } });
    dlg.addEventListener("click", function(e){ if (e.target === dlg) close(); });
    $('[data-tp="close"]', dlg).addEventListener("click", close);
    $('[data-tp="play"]', dlg).addEventListener("click", function(){ setMode("play"); });
    $('[data-tp="customize"]', dlg).addEventListener("click", function(){ setMode("customize"); });
    $('[data-tp="zoom"]', dlg).addEventListener("click", function(){ V.wide = !V.wide; build(); });
    try { dlg.showModal(); } catch (e) { dlg.setAttribute("open", ""); }
    D.documentElement.classList.add("tpv-open");
    if (o.place && !reduced) tripIn(dlg, V.m);
    track(V.m.visiting ? "place:visit" : "place:open");   /* a visit is counted, never whose (visiting: widget/dash.js) */
    var first = V.m.visiting ? Promise.resolve() : readShop();
    first.then(function(){ if (V && !V.m.visiting) V.m = mine(); return ready(V && V.m); }).then(function(){
      if (!V) return;
      $(".tpv-wait", dlg).hidden = true;
      build({ hello: true });
      if (o.customize && canChange()) setMode("customize");
      tripOut(dlg);
    }, function(){ if (V) { tripGone(dlg); var w = $(".tpv-wait", dlg); w.hidden = false; w.textContent = "Timmy’s place couldn’t be opened just now. Try again in a moment."; } });
    return api;
  }
  function close(){ if (V) { try { V.dlg.close(); } catch (e) { shut(); } } }
  function shut(){
    if (!V) return;
    var v = V; V = null;
    cancelAnimationFrame(v.raf); cancelAnimationFrame(v.camRaf); clearInterval(v.wander); clearTimeout(v.sayT); clearTimeout(v.waveT); clearTimeout(v.mt);
    if (v.io) v.io.disconnect();
    if (W.shBowl && W.shBowl.showing()) W.shBowl.close();
    if (v.dlg.parentNode) v.dlg.parentNode.removeChild(v.dlg);
    D.documentElement.classList.remove("tpv-open");
    try { if (v.back && v.back.isConnected && v.back.focus) v.back.focus(); } catch (e) {}
    if (v.onClose) v.onClose();
  }
  function setMode(mode){
    if (!V || (mode === "customize" && !canChange())) return;
    V.mode = mode;
    if (mode !== "customize") { build(); return; }
    /* the drawer shows everything owned, and the rank pieces still to earn: fetch those sets' drawings first */
    V.loading = true; build();
    needPacks(Object.keys(S.own).concat(S.locked.map(function(x){ return x.id; }))).then(function(){ if (V) { V.loading = false; build(); } });
  }

  /* the camera: in Customize the view moves in on what's being changed (the home, a yard spot, Timmy), and back out for
     the scene, for Visit and when Close-up is off. One viewBox, eased, shared by the picture and its tap areas */
  function crop(pts, pad){
    var xs = [], ys = [];
    pts.forEach(function(p){ var q = TP.project(p[0], p[1], p[2]); xs.push(q[0]); ys.push(q[1]); });
    var x0 = Math.min.apply(null, xs) - pad, y0 = Math.min.apply(null, ys) - pad, x1 = Math.max.apply(null, xs) + pad, y1 = Math.max.apply(null, ys) + pad;
    return [Math.round(x0), Math.round(y0), Math.round(x1 - x0), Math.round(y1 - y0)];
  }
  function cube(x0, y0, x1, y1, z){ return [[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0], [x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]]; }
  function camFor(o){
    var B = TP.VIEWBOX, c, frac;
    if (V.mode !== "customize" || V.wide || V.pick === "scene" || !V.layout) return B.slice();
    if (V.pick === "home") { c = crop(cube(1.2, 1.6, 10, 10.6, 11.6), 6); frac = .74; }
    else if (V.pick === "timmy") { var sp = V.layout.spots[V.at] || V.layout.spots.door, q = TP.project(sp[0], sp[1], sp[2] || 0); c = [q[0] - 22, q[1] - 62, 44, 70]; frac = .46; }
    else { var it = byK(TP.YARD, o.yard[V.pick] || ""), s = TP.SLOT_AT[V.pick]; c = crop(cube(s.x - .6, s.y - .6, s.x + TP.S + .6, s.y + (it && it.wide ? 7.5 : TP.S) + .6, 3.4), 8); frac = .58; }
    var w = Math.min(B[2], Math.max(c[2] * 1.2, c[3] * 1.2 * B[2] / B[3], B[2] * frac)), h = w * B[3] / B[2];
    return [Math.max(B[0], Math.min(B[0] + B[2] - w, c[0] + c[2] / 2 - w / 2)), Math.max(B[1], Math.min(B[1] + B[3] - h, c[1] + c[3] / 2 - h / 2)), w, h];
  }
  function camTo(svgs, to, now){
    cancelAnimationFrame(V.camRaf); V.camGoal = to;
    var from = V.cam || TP.VIEWBOX.slice(), set = function(v){ if (!V) return; V.cam = v; svgs.forEach(function(n){ n.setAttribute("viewBox", v.map(function(x){ return x.toFixed(2); }).join(" ")); }); bubbleAt(); };
    if (now || from.join() === to.join()) { set(to.slice()); return; }
    set(from); var t0 = performance.now();
    var step = function(t){ if (!V) return; var u = Math.min(1, (t - t0) / 560), e = 1 - Math.pow(1 - u, 3); set(from.map(function(a, i){ return a + (to[i] - a) * e; })); if (u < 1) V.camRaf = requestAnimationFrame(step); };
    V.camRaf = requestAnimationFrame(step);
  }

  /* draw the stage (the scene inline, in a shadow root so the kit's CSS stays with it) and the panel beside it */
  function build(opt){
    if (!V || !TP) return;
    opt = opt || {};
    var dlg = V.dlg, host = $(".tpv-stage", dlg), m = V.m, custom = V.mode === "customize" && canChange();
    if (!custom) V.mode = "play";
    if (!host.shadowRoot) host.attachShadow({ mode: "open" });
    var sr = host.shadowRoot, still = isStill(), o = optsOf(m, { marks: custom && V.pick !== "timmy" && V.pick !== "home" && V.pick !== "scene" }), L = TP.layout(o), vb = TP.VIEWBOX;
    cancelAnimationFrame(V.raf); V.busy = false; V.next = null; V.bub = null;
    if (!L.spots[V.at]) V.at = "door";
    var H = HL(); if (H.stay) V.at = "door";
    var g = timmyG(m); if (g) o.timmy = { g: g, at: V.at };
    var r = TP.render(o), home = byK(TP.HOMES, o.home), sc = byK(TP.SCENES, o.scene);
    var hits = !custom ? "" : '<svg class="tp-hit" viewBox="' + vb.join(" ") + '" aria-label="Spots you can change">' +
      Object.keys(r.slots).map(function(k){ var it = o.yard[k], name = byK(TP.SLOTS, k).n;
        return '<path class="tp-hitarea' + (V.pick === k ? " on" : "") + '" data-pick="' + k + '" d="' + r.slots[k] + '" tabindex="0" role="button" aria-label="' + esc(name + ": " + (it ? byK(TP.YARD, it).n : "empty") + ". Change it") + '"/>'; }).join("") +
      '<path class="tp-hitarea tp-hithome' + (V.pick === "home" ? " on" : "") + '" data-pick="home" d="' + r.homeHit + '" tabindex="0" role="button" aria-label="' + esc(home.n + ". Change it") + '"/></svg>';
    host.classList.toggle("is-night", !!(o.night || sc.alwaysNight));
    sr.innerHTML = "<style>" + TP.CSS + "\n" + STAGE_CSS + "</style>" + '<div class="tp-box' + (still ? " tp-still" : "") + '">' +
      r.svg.replace(' aria-hidden="true" focusable="false"', ' role="group" aria-label="' + esc(sceneAlt(m)) + '"') + hits + '<div class="tp-bubble" role="status" aria-live="polite"></div></div>';
    V.sr = sr; V.layout = L; V.o = o; V.depth = $(".tp-depth", sr); V.tg = $(".tp-timmy", sr); V.tw = V.tg && V.tg.parentNode; V.face = V.tg && $(".tp-tface", V.tg);
    V.pos = L.spots[V.at].slice(); setTimmy(V.pos, 0, 1, 1);
    camTo($$("svg.tp-scene, svg.tp-hit", sr), camFor(o), still || opt.hello);
    if (V.tg) {
      V.tg.setAttribute("role", "button"); V.tg.setAttribute("tabindex", "0"); V.tg.setAttribute("data-tp", "timmy");
      V.tg.setAttribute("aria-label", m.visiting ? "Timmy. Tap him and he waves" : "Timmy, " + H.n.toLowerCase() + ", " + hpOf(m) + " HP. Tap him and he waves");
      if (H.idle) V.tg.classList.add("hl-" + H.idle);
      V.tg.addEventListener("click", function(e){ e.stopPropagation(); tapTimmy(); }); keyed(V.tg, tapTimmy);
    }
    $$(".tp-egg", sr).forEach(function(n){
      var k = n.dataset.egg, e = TP.EGGS[k] || TP.EGGS.home;
      if (custom) return;                      // in Customize a tap picks a spot; the eggs are for Visit
      n.setAttribute("role", "button"); n.setAttribute("tabindex", "0"); n.setAttribute("data-tp", "egg"); n.setAttribute("aria-label", e.n + ": " + e.does);
      n.addEventListener("click", function(ev){ ev.stopPropagation(); playEgg(n); });
      keyed(n, function(){ playEgg(n); });
    });
    $$(".tp-hitarea", sr).forEach(function(p){
      var go = function(){ V.pick = p.dataset.pick; build(); var n = V && V.sr && $('.tp-hitarea[data-pick="' + V.pick + '"]', V.sr); if (n) n.focus(); };
      p.addEventListener("click", function(e){ e.stopPropagation(); go(); }); keyed(p, go);
    });
    /* the top bar and the panel */
    $(".tpv-sub", dlg).textContent = cardName(home.n) + " · " + lowerFirst(sc.n);
    $("#tpvT", dlg).textContent = m.visiting && m.name ? m.name + "’s place" : "Timmy’s place";
    var seg = $(".tpv-seg", dlg); seg.hidden = !canChange();
    $('[data-tp="play"]', dlg).setAttribute("aria-pressed", String(!custom)); $('[data-tp="customize"]', dlg).setAttribute("aria-pressed", String(custom));
    var zb = $(".tpv-zoom", dlg); zb.hidden = !custom || V.pick === "scene"; zb.setAttribute("aria-pressed", String(!V.wide));
    dlg.classList.toggle("is-custom", custom);
    side(o);
    if (opt.burst && !still) burstAt(opt.burst, o);
    if (opt.burst && opt.burst !== "home" && L.spots[opt.burst]) setTimeout(function(){ if (V) goTo(opt.burst); }, still ? 0 : 450);
    if (opt.say) say(opt.say);
    else if (opt.hello && !custom) say(m.visiting ? "Hi! Welcome. Have a look around." : hpLine(H.hello[0]));
    wanderOn();
  }

  /* ---------- Timmy on the stage: the bubble, the hops, the wave, the flip, the wandering (the reference is the design
     page's stage, tools/preview/design/design.js) ---------- */
  function say(text){
    var b = V && V.sr && $(".tp-bubble", V.sr); if (!b || !text) return;
    b.textContent = text; b.classList.toggle("small", b.parentNode.clientWidth < 440); V.bub = { el: b, w: b.offsetWidth, h: b.offsetHeight }; bubbleAt();
    b.classList.add("on"); clearTimeout(V.sayT); V.sayT = setTimeout(function(){ b.classList.remove("on"); if (V) V.bub = null; }, Math.max(3200, Math.min(7000, text.length * 62)));
  }
  /* the bubble sits over Timmy's head (under him when there's no room above), kept inside the picture, its tail on him */
  function bubbleAt(){
    var u = V && V.bub; if (!u || !V.pos) return;
    var box = u.el.parentNode, Wd = box.clientWidth, Ht = box.clientHeight, vb = V.cam || TP.VIEWBOX, q = TP.project(V.pos[0], V.pos[1], V.pos[2] || 0);
    var x = (q[0] - vb[0]) / vb[2] * Wd, head = (q[1] - ((V.m.eq || {}).outfit ? 60 : 50) - vb[1]) / vb[3] * Ht, feet = (q[1] + 4 - vb[1]) / vb[3] * Ht;
    var left = Math.max(6, Math.min(Wd - u.w - 6, x - u.w / 2)), below = head - u.h - 11 < 4, top = below ? feet + 11 : head - u.h - 11;
    u.el.style.left = left.toFixed(1) + "px"; u.el.style.top = top.toFixed(1) + "px"; u.el.style.setProperty("--tail", Math.max(16, Math.min(u.w - 16, x - left)).toFixed(1) + "px"); u.el.classList.toggle("below", below);
  }
  function rankName(m){
    var p = m.profile, R = W.shRanks, r = rankOf(m);
    try { if (p && R && R.nameOf && p.journey > 0) return R.nameOf(p); if (R && R.rankName) return R.rankName(r.tier, r.level); } catch (e) {}
    return ["Stone", "Antique", "Bronze", "Silver", "Gold", "Diamond", "Dark Matter"][r.tier] + " " + ["I", "II", "III"][r.level - 1];
  }
  function rankLine(){
    var r = rankOf(V.m), who = V.m.visiting ? "Their rank, " : "Your rank, ";
    if (r.journey === 1) return who + rankName(V.m) + ". The handpiece is finished, and the ModuPro is on the pedestal now.";
    if (r.journey === 2) return who + rankName(V.m) + ". The handpiece and the ModuPro are finished, and the loupes are on me.";
    return who + rankName(V.m) + (r.level < 3 ? ". One more step at the next level." : r.tier < 6 ? ". The next rank changes what it's made of." : ". Made of Dark Matter, and it glows.");
  }
  function masteryLine(){
    var fl = flairOf(V.m), n = [0, 0, 0, 0, 0]; fl.forEach(function(x){ n[x.lvl]++; });
    var parts = [[4, "Crown"], [3, "Gold"], [2, "Silver"], [1, "Bronze"]].filter(function(q){ return n[q[0]]; }).map(function(q){ return n[q[0]] + " " + q[1]; });
    return fl.length + (fl.length === 1 ? " hub" : " hubs") + " mastered: " + (parts.length > 1 ? parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1] : parts[0]) + ".";
  }
  /* the bowling lane plays one of the bowling egg's eight clips inside the view (widget/bowling.js, fetched on the first
     tap); with the eggs off or in Focus mode it keeps its own small surprise (the mint and "Strike! Well, close.") */
  function eggsOff(){ return ls("sh_pref_eggs") === "off" || ls("sh_pref_focus") === "on"; }
  function playLane(fallback){
    script(BASE + "bowling.js").then(function(){
      var B = W.shBowl, host = V && $(".tpv-stagewrap", V.dlg);
      if (!B || !host) { if (V) say(fallback); return; }
      B.play(B.random(), { host: host, say: say }).then(function(shown){ if (!shown && V) say(fallback); });
    }, function(){ if (V) say(fallback); });
  }
  function playEgg(n){
    var k = n.dataset.egg, e = TP.EGGS[k] || {};
    n.classList.remove("tp-on"); void n.getBoundingClientRect(); n.classList.add("tp-on");
    clearTimeout(n._t); n._t = setTimeout(function(){ n.classList.remove("tp-on"); }, 2600);
    var H = HL(), line = k === "statue" ? rankLine() : k === "mastery" ? masteryLine() : e.say;
    if (H.stay && k !== "mastery" && k !== "statue") { V.rested = !V.rested; line = V.rested ? H.rest : line; }
    if (k === "lane" && !eggsOff()) playLane(line); else say(line);
    V.lastTap = Date.now();
    if (k === "mastery") { clearTimeout(V.mt); V.mt = setTimeout(function(){ if (V) openMastery(); }, isStill() ? 0 : 650); }
    if (isStill()) return;
    var target = spotFor(n);
    if (H.stay) { lookAt(target); return; }
    if (target) goTo(target); else hopInPlace();
  }
  /* he turns to face a spot without leaving his own */
  function lookAt(spot){
    var sp = V.layout && V.layout.spots[spot]; if (!sp || !V.pos || V.busy) return;
    var a = TP.project(V.pos[0], V.pos[1], 0), b = TP.project(sp[0], sp[1], 0);
    if (Math.abs(b[0] - a[0]) > .5) { V.dir = b[0] < a[0] ? -1 : 1; setTimmy(V.pos, 0, 1, 1); }
  }
  /* where Timmy goes to see a thing: its yard spot, the door for the home and what's by it, else the nearest spot when
     it stands on the ground in the yard; things in the sky or far off, he hops where he is */
  function spotFor(n){
    var it = n.closest(".tp-item"), k = n.dataset.egg, sp = V.layout.spots;
    if (it && sp[it.dataset.slot]) return it.dataset.slot;
    if (k === "home" || k === "statue" || k === "brush" || k === "mastery") return sp.deck && Math.random() < .4 ? "deck" : "door";
    var b; try { b = n.getBBox(); } catch (x) { return null; }
    var q = TP.unproject(b.x + b.width / 2, b.y + b.height);
    if (!(q[0] > -2 && q[1] > -2 && q[0] < 16.5 && q[1] < 16.5)) return null;
    var best = null, bd = 1e9; Object.keys(sp).forEach(function(s){ var p = sp[s], d = (p[0] - q[0]) * (p[0] - q[0]) + (p[1] - q[1]) * (p[1] - q[1]); if (d < bd) { bd = d; best = s; } });
    return best;
  }
  function setTimmy(p, arc, kx, ky){
    if (!V || !V.tg) return;
    var q = TP.project(p[0], p[1], p[2] || 0);
    V.tg.setAttribute("transform", "translate(" + q[0].toFixed(1) + " " + (q[1] - arc).toFixed(1) + ")");
    V.face.setAttribute("transform", "scale(" + (V.dir * kx).toFixed(3) + " " + ky.toFixed(3) + ")");
    /* drawn in the scene's depth order: in front of what's behind him, behind what's in front */
    var z = p[0] + p[1] + .3, c = V.depth.firstChild;
    while (c && (c === V.tw || +c.getAttribute("data-z") <= z)) c = c.nextSibling;
    if (c !== V.tw.nextSibling) V.depth.insertBefore(V.tw, c);
    if (V.bub) { var keep = V.pos; V.pos = p; bubbleAt(); V.pos = keep; }
  }
  function lerp(a, b, t){ return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, (a[2] || 0) + ((b[2] || 0) - (a[2] || 0)) * t]; }
  function goTo(spot){
    if (!V || !V.layout || !V.layout.spots[spot]) return;
    if (HL().stay && spot !== "door") { lookAt(spot); return; }
    if (isStill()) { V.at = spot; V.pos = V.layout.spots[spot].slice(); setTimmy(V.pos, 0, 1, 1); return; }
    if (V.busy) { V.next = spot; return; }
    if (spot === V.at) { hopInPlace(); return; }
    var path = TP.route(V.o, V.at, spot); V.at = spot;
    hops(path);
  }
  function hops(path, plain){
    var list = [], H = HL(), stride = 1.15 * H.stride, soft = Math.min(1, H.hop + .25);
    for (var i = 1; i < path.length; i++){
      var a = path[i - 1], b = path[i], dz = (b[2] || 0) - (a[2] || 0), d = Math.sqrt((b[0] - a[0]) * (b[0] - a[0]) + (b[1] - a[1]) * (b[1] - a[1]) + dz * dz * 1.4);
      var n = Math.max(1, Math.ceil(d / stride));
      for (var j = 0; j < n; j++) list.push([lerp(a, b, j / n), lerp(a, b, (j + 1) / n), Math.abs(dz) > .3]);
    }
    if (!list.length) return;
    V.busy = true;
    var hi = 0, t0 = performance.now(), AIR = 260 * H.pace, LAND = 90 * Math.max(1, H.pace * .8) + (H.hop < .5 ? 40 : 0), cheer = H.cheer && !plain;
    var start = function(h){ var p = TP.project(h[0][0], h[0][1], h[0][2]), q = TP.project(h[1][0], h[1][1], h[1][2]); if (Math.abs(q[0] - p[0]) > .5) V.dir = q[0] < p[0] ? -1 : 1; };
    start(list[0]);
    var v = V;
    var frame = function(now){
      if (V !== v || !V.tg) { v.busy = false; return; }
      var h = list[hi], t = now - t0;
      /* a hop; with no hop left in him (hop 0) it's a limp: he dips and leans into each short step */
      if (t < AIR) { var u = t / AIR, e = u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2, w = Math.sin(Math.PI * u);
        if (H.hop > 0) setTimmy(lerp(h[0], h[1], e), w * (h[2] ? 3 : 6) * H.hop, 1 - .04 * w * soft, 1 + .07 * w * soft);
        else setTimmy(lerp(h[0], h[1], e), 0, 1 + .05 * w, 1 - .07 * w); }
      else if (t < AIR + LAND) { var s = Math.sin(Math.PI * (t - AIR) / LAND); setTimmy(h[1], 0, 1 + .1 * s * soft, 1 - .13 * s * soft); }
      else {
        hi++; t0 = now;
        if (hi >= list.length) { V.busy = false; V.pos = h[1]; setTimmy(h[1], 0, 1, 1); if (V.next) { var nx = V.next; V.next = null; goTo(nx); } else if (cheer) hopInPlace(); return; }
        start(list[hi]);
      }
      V.raf = requestAnimationFrame(frame);
    };
    V.raf = requestAnimationFrame(frame);
  }
  function hopInPlace(){ if (isStill() || !V || V.busy || !V.pos || HL().hop <= 0) return; hops([V.pos, V.pos.slice(0, 2).concat([(V.pos[2] || 0) + .01]), V.pos], true); }
  /* Timmy waves hello when he's tapped (and now and then by himself); tap him again while he's waving and he flips */
  function wave(quiet){
    if (!V || !V.tg) return;
    var H = HL();
    if (quiet !== true) say(V.m.visiting ? "Hi! Thanks for stopping by." : hpLine(H.hello[(V.waveN = (V.waveN || 0) + 1) % H.hello.length]));
    if (isStill()) return;
    V.tg.style.setProperty("--wn", H.wave[0]); V.tg.style.setProperty("--wa", -H.wave[1] + "deg");
    V.tg.classList.remove("do-wave"); void V.tg.getBoundingClientRect(); V.tg.classList.add("do-wave"); V.waveAt = Date.now(); V.waveFor = H.wave[0] * 380 + 120;
    var tg = V.tg; clearTimeout(V.waveT); V.waveT = setTimeout(function(){ tg.classList.remove("do-wave"); }, V.waveFor);
  }
  /* a second tap while he waves: a flip when he's well; when he isn't, he says why not (and manages a small hop if he can) */
  function tapTimmy(){
    if (!V) return;
    V.lastTap = Date.now();
    var H = HL(), again = Date.now() - (V.waveAt || 0) < Math.max(1400, V.waveFor || 2400) && !isStill();
    if (!again) { wave(); return; }
    V.waveAt = 0; if (V.tg) V.tg.classList.remove("do-wave");
    if (H.flip) flip(); else { say(hpLine(H.tired)); hopInPlace(); }
  }
  function flip(quiet){
    if (!V) return;
    if (quiet !== true) say(TP.EGGS.timmy.say);
    if (isStill() || V.busy || !V.pos) return;
    var twice = HL().k === "sparkling", v = V;
    V.busy = true; var t0 = performance.now(), dur = twice ? 860 : 620, p = V.pos;
    var frame = function(now){
      if (V !== v || !V.tg) { v.busy = false; return; }
      var u = Math.min(1, (now - t0) / dur);
      setTimmy(p, Math.sin(Math.PI * u) * (twice ? 22 : 16), Math.cos(u * Math.PI * (twice ? 4 : 2)), 1);
      if (u < 1) V.raf = requestAnimationFrame(frame); else { setTimmy(p, 0, 1, 1); V.busy = false; }
    };
    V.raf = requestAnimationFrame(frame);
  }
  /* while it's on screen and nobody's tapping, he does something now and then: how often he wanders off, how far, and
     what he does instead all follow his health */
  function wanderOn(){
    if (!V || V.wander) return;
    var v = V;
    v.wander = setInterval(function(){
      if (V !== v || isStill() || V.mode !== "play" || V.busy || D.hidden || !$(".tpv-over", V.dlg).hidden || Date.now() - V.lastTap < 6000 || !V.layout) return;
      var H = HL(), sp = V.layout.spots;
      if (H.stay) return;
      if (Math.random() > H.roam) {
        if (H.idle === "bounce") { if (Math.random() < .4) flip(true); else if (Math.random() < .5) hopInPlace(); else wave(true); }
        else if (H.wave[0] >= 4 && Math.random() < .55) wave(true);
        return;
      }
      var ks = Object.keys(sp).filter(function(k){ return k !== V.at; });
      if (H.near) { var d = sp.door; ks = ks.filter(function(k){ var q = sp[k]; return k === "door" || k === "deck" || Math.sqrt((q[0] - d[0]) * (q[0] - d[0]) + (q[1] - d[1]) * (q[1] - d[1])) < 4.2; }); }
      if (ks.length) goTo(ks[Math.floor(Math.random() * ks.length)]);
    }, 5200);
  }
  /* a new piece lands with its rarity's burst */
  function burstAt(where, o){
    var it = where === "home" ? null : o.yard[where], x = it ? byK(TP.YARD, it) : byK(TP.HOMES, o.home), r = x && x.rarity || "Common", vb = V.camGoal || TP.VIEWBOX, q;
    if (where === "home") q = TP.project(5.5, 5.5, 4);
    else { var s = TP.SLOT_AT[where]; if (!s) return; q = TP.project(s.x + TP.S / 2, s.y + (x && x.wide ? 3.75 : TP.S / 2), 1); }
    var box = V.sr && $(".tp-box", V.sr); if (!box) return;
    box.insertAdjacentHTML("beforeend", '<div class="tp-burstpos" style="width:' + (26 * TP.VIEWBOX[2] / vb[2]).toFixed(1) + "%;left:" + ((q[0] - vb[0]) / vb[2] * 100).toFixed(2) + "%;top:" + ((q[1] - vb[1]) / vb[3] * 100).toFixed(2) + '%">' + TP.burst(r) + "</div>");
    var sr = V.sr; setTimeout(function(){ var b = $(".tp-burstpos", sr); if (b) b.remove(); }, 1700);
  }

  /* ---------- the medal board's big view: every hub's own mastery medal, at full size (widget/ranks.js draws them, the
     same medals that pop up when one is earned) ---------- */
  function openMastery(){
    var R = W.shRanks, list = flairOf(V.m).sort(function(a, b){ return b.lvl - a.lvl; }), n = [0, 0, 0, 0, 0]; list.forEach(function(x){ n[x.lvl]++; });
    var medal = function(x, px){ try { return R && R.medal ? R.medal(x.lvl, px, x.hub) : ""; } catch (e) { return ""; } };
    var name = function(h){ try { return R && R.hubName ? R.hubName(h) : h; } catch (e) { return h; } };
    var chips = [4, 3, 2, 1].filter(function(l){ return n[l]; }).map(function(l){ return '<span class="tpv-mchip"><b>' + n[l] + "</b> " + TP.MEDALS[l] + "</span>"; }).join("");
    overOpen('<div class="tpv-mhead"><h3 id="tpvO">' + (V.m.visiting ? "Hub mastery" : "Your hub mastery") + "</h3><p>" +
      (list.length ? list.length + (list.length === 1 ? " hub" : " hubs") + " mastered" : V.m.visiting ? "No hubs mastered yet" : "No hubs mastered yet: your first medal hangs here") + "</p></div>" +
      (chips ? '<p class="tpv-mchips">' + chips + "</p>" : "") +
      (list.length ? '<ul class="tpv-mgrid">' + list.map(function(x, i){ return '<li class="tpv-mcard lvl-' + x.lvl + '" style="--i:' + i + '">' + medal(x, 72) + "<b>" + esc(name(x.hub)) + '</b><span>' + TP.MEDALS[x.lvl] + "</span></li>"; }).join("") + "</ul>" : "") +
      '<p class="tpv-note">These are the medals each hub gives, the same ones that pop up when one is earned. The board by the house hangs the best twenty.</p>');
  }
  function overOpen(html){
    var ov = $(".tpv-over", V.dlg);
    ov.innerHTML = '<div class="tpv-overin" role="dialog" aria-modal="true" aria-labelledby="tpvO"><button type="button" class="tpv-x tpv-ox" data-tp="over-close" aria-label="Back to the place">' + X_SVG + "</button>" + html + "</div>";
    ov.hidden = false; V.overBack = D.activeElement && V.dlg.contains(D.activeElement) ? D.activeElement : null;
    var x = $(".tpv-ox", ov); x.addEventListener("click", overClose); x.focus();
    ov.onclick = function(e){ if (e.target === ov) overClose(); };
  }
  function overClose(){
    if (!V) return;
    var ov = $(".tpv-over", V.dlg); ov.hidden = true; ov.innerHTML = "";
    var b = V.overBack || $('[data-tp="close"]', V.dlg); try { b.focus(); } catch (e) {}
  }

  /* ---------- saving: each change shows at once and goes to equip_item; the calls go one after another, in order ---------- */
  function isWide(id){ var k = key("yard", id), y = k && byK(TP.YARD, k); return !!(y && y.wide); }
  /* what equip_item does to the map, done here first so the change shows at once */
  function applied(eq, slot, id){
    var e = copy(eq), sl = slot;
    if (!id) { delete e[slot]; return e; }
    if (slot.indexOf("yard-") === 0) {
      if (isWide(id)) { sl = "yard-side"; delete e["yard-corner"]; }
      else if (slot === "yard-corner" && e["yard-side"] && isWide(e["yard-side"])) delete e["yard-side"];
      Object.keys(e).forEach(function(k){ if (e[k] === id && k !== sl && k.indexOf("yard-") === 0) delete e[k]; });
    }
    e[sl] = id; return e;
  }
  /* Timmy everywhere else (widget/pet.js: the bar, the dashboard's card) wears what's in the outfit slot here: tell him
     at once when it changes, with the piece's drawing and lines from the kit, so he needs no file of his own for it */
  function barFollow(){
    var P = W.shPet; if (!P || !P.setOutfit || !TP) return;
    var id = (S.eq || {}).outfit || "", k = key("outfit", id), o = k ? byK(TP.OUTFITS, k) : null, parts = k && TP.outfitParts ? TP.outfitParts(k) : null;
    if (parts && o && o.say) parts.say = o.say;
    try { P.setOutfit(id, parts); } catch (e) {}
  }
  var chain = Promise.resolve(), pending = 0;
  function equip(slot, id, fx){
    if (!canChange()) return;
    S.eq = applied(S.eq, slot, id || null); V.m = mine();
    track("place:equip:" + slot);
    if (slot === "outfit") needPacks([id]).then(barFollow, barFollow);
    if (fx !== false) { needPacks([id]).then(function(){ if (V) build(fx || {}); repaintCards(); }); }
    pending++;
    chain = chain.then(function(){ return S.sb.rpc("equip_item", { p_visitor: S.visitor, p_slot: slot, p_item: id || null }); }).then(function(r){ pending--; return r; }, function(){ pending--; return null; }).then(function(r){
      var d = r && r.data;
      if (!r || r.error || !d || !d.ok) throw new Error("refused");
      if (!pending && JSON.stringify(sorted(d.equipped || {})) !== JSON.stringify(sorted(S.eq))) { S.eq = copy(d.equipped); if (V && !V.m.visiting) { V.m = mine(); build(); } repaintCards(); if (slot === "outfit") needPacks(equippedIds({ eq: S.eq })).then(barFollow, barFollow); }
    }).then(null, function(){
      /* it didn't save: show what the server has, and say so */
      return S.sb.rpc("get_my_shop", { p_visitor: S.visitor }).then(function(r){ if (r && !r.error) takeShop(r.data); }, function(){}).then(function(){
        if (slot === "outfit") needPacks(equippedIds({ eq: S.eq })).then(barFollow, barFollow);
        if (V && !V.m.visiting) { V.m = mine(); needPacks(equippedIds(V.m)).then(function(){ if (V) build({ say: "That didn’t save, so I put it back." }); }); }
        repaintCards();
      });
    });
  }
  function sorted(o){ var c = {}; Object.keys(o).sort().forEach(function(k){ c[k] = o[k]; }); return c; }
  function repaintCards(){ CARDS = CARDS.filter(function(x){ return x.host.isConnected; }); CARDS.forEach(function(x){ x.paint(); }); }

  /* ---------- the panel beside the stage: Visit (his health, the medals) or Customize (the dock and the drawer) ---------- */
  var DOCK_N = { right: "Back", side: "Side", left: "Path, left", front: "Path, right", corner: "Front" };
  var DRAWER = { home: ["Homes", "The cottage is every Timmy’s first home."], scene: ["Scenes", "Where the whole place stands."], timmy: ["Timmy’s wardrobe", "Pick an outfit off the rail."] };
  var RANKS = ["", "Antique", "Bronze", "Silver", "Gold", "Diamond", "Dark Matter"];
  var THUMBS = {};
  function thumb(kind, k, o){
    var id = kind + ":" + k + ":" + JSON.stringify(o || {});
    if (!THUMBS[id]) {
      if (kind === "outfit") { var t = ""; try { t = W.shPet && W.shPet.art ? W.shPet.art({ hp: 85, hat: "" }, 100) : ""; } catch (e) {} THUMBS[id] = t ? img(TP.dress(t, k), "") : ""; }
      else THUMBS[id] = img(TP.thumb(kind, k, o), "");
    }
    return THUMBS[id];
  }
  /* a visit's panel: their rank as the boards draw it (the handpiece, or the journey's object), its name in gold, and
     each hub medal they've earned, the way a marquee bills the star. Only what get_place gives: no HP, no XP, no dates */
  function guestCard(el, m){
    var R = W.shRanks, r = rankOf(m), fl = flairOf(m).sort(function(a, b){ return b.lvl - a.lvl; }), big = "";
    try { if (R) big = r.journey > 0 && R.artOf ? R.artOf(r.journey, r.tier, 112, { level: r.level, animate: !reduced }) : R.art(r.tier, 112, { level: r.level, animate: !reduced }); } catch (e) { big = ""; }
    var medal = function(x){ try { return R && R.medal ? R.medal(x.lvl, 44, x.hub) : ""; } catch (e) { return ""; } };
    var hub = function(h){ try { return R && R.hubName ? R.hubName(h) : h; } catch (e) { return h; } };
    el.innerHTML = '<div class="tpv-guest">' +
      '<div class="tpv-gplate"><div class="tpv-grank" aria-hidden="true">' + big + '</div><p class="tpv-gk">Rank</p><p class="tpv-gr">' + esc(rankName(m)) + "</p></div>" +
      '<div class="tpv-gmedals"><p class="tpv-gk">Hub mastery</p>' + (fl.length
        ? '<ul class="tpv-gml">' + fl.slice(0, 8).map(function(x){ var n = hub(x.hub); return '<li title="' + esc(n) + '"><span aria-hidden="true">' + medal(x) + '</span><span class="tpv-gmn">' + esc(n) + "</span></li>"; }).join("") + "</ul>" +
          '<div class="tpv-row"><button type="button" class="tpv-btn tpv-gold" data-tp="mastery">See the medals</button></div>'
        : '<p class="tpv-gnone">No hub medals yet</p>') + "</div>" +
      '<p class="tpv-gtip">Tap Timmy and he waves. The sun, the house and the things in the yard each do something too.</p></div>';
    var mb = $('[data-tp="mastery"]', el); if (mb) mb.addEventListener("click", openMastery);
  }
  function rarTag(r){ return '<i class="tpv-rar r-' + String(r || "free").toLowerCase() + '">' + esc(r || "Default") + "</i>"; }
  function owned(x){ return !x.id || !!S.own[x.id]; }
  function howTag(x){ var how = x.id ? S.own[x.id] : ""; return how === "gift" ? "A gift" : how === "rank" ? (x.rankName || "Rank") + " rank" : ""; }
  function side(o){
    var el = $(".tpv-side", V.dlg), m = V.m, H = HL();
    if (V.mode !== "customize" && m.visiting) { guestCard(el, m); return; }
    if (V.mode !== "customize") {
      var fl = flairOf(m), r = rankOf(m);
      el.innerHTML = '<div class="tpv-visit">' +
        (m.visiting ? '<p class="tpv-lede">You’re visiting. Tap Timmy and the things around the place.</p>'
          : '<p class="tpv-hp"><b>' + esc(H.n) + '</b><span class="num">' + hpOf(m) + ' HP</span></p><p class="tpv-note">' + esc(H.does) + ".</p>") +
        '<dl class="tpv-facts"><div><dt>Rank</dt><dd>' + esc(rankName(m)) + "</dd></div><div><dt>Hub medals</dt><dd>" + (fl.length ? fl.length + " on the board" : "None yet") + "</dd></div></dl>" +
        '<div class="tpv-row">' + (fl.length ? '<button type="button" class="tpv-btn" data-tp="mastery">See the medals</button>' : "") +
        (canChange() ? '<button type="button" class="tpv-btn tpv-primary" data-tp="customize2">Customize</button>' : "") + "</div>" +
        (m.visiting ? "" : '<p class="tpv-note">Tap Timmy and he waves; tap him again while he’s waving. The sun, the house and the things in the yard each do something too.</p>') + "</div>";
      void r;
      var mb = $('[data-tp="mastery"]', el); if (mb) mb.addEventListener("click", openMastery);
      var cb = $('[data-tp="customize2"]', el); if (cb) cb.addEventListener("click", function(){ setMode("customize"); });
      return;
    }
    if (V.loading) { el.innerHTML = '<p class="tpv-note" role="status">Getting Timmy’s things out…</p>'; return; }
    var pick = V.pick, h = byK(TP.HOMES, o.home), lane = !!(o.yard.side && byK(TP.YARD, o.yard.side).wide), e = S.eq;
    if (pick === "corner" && lane) pick = V.pick = "side";
    /* the dock: what's in every spot right now, as pictures */
    var tile = function(k, label, pic, full, small){ return '<button type="button" class="tpv-tile' + (small ? " is-slot" : "") + (pick === k ? " on" : "") + (pic ? "" : " is-empty") + '" data-tp="pick-' + k + '" data-pick="' + k + '" aria-pressed="' + (pick === k) + '" aria-label="' + esc(full) + '"><span class="tpv-tpic">' +
      (pic || '<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><path d="M10 4v12M4 10h12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>') + "</span><span>" + esc(label) + "</span></button>"; };
    var curOut = byK(TP.OUTFITS, key("outfit", e.outfit)), sc = byK(TP.SCENES, o.scene);
    var dock = '<div class="tpv-dock" role="group" aria-label="What to change"><div class="tpv-dmain">' +
      tile("home", "Home", thumb("home", o.home, { scene: o.scene }), "Home: " + h.n) + tile("scene", "Scene", thumb("scene", o.scene), "Scene: " + sc.n) + tile("timmy", "Timmy", thumb("outfit", curOut ? curOut.k : ""), "Timmy: " + (curOut ? curOut.n : "no outfit")) + "</div>" +
      '<div class="tpv-dyard"><span class="tpv-dlab">The yard</span>' + TP.SLOTS.filter(function(q){ return !(q.k === "corner" && lane); }).map(function(q){ var it = byK(TP.YARD, o.yard[q.k] || "");
        return tile(q.k, DOCK_N[q.k] || q.n, it ? thumb("yard", it.k, { scene: o.scene }) : "", q.n + ": " + (it ? it.n : "empty"), true); }).join("") + "</div></div>";
    /* the drawer: one kind of thing, what you own of it, in up to three tabs (the classics, the seasonal sets, the rank rewards) */
    var kind = pick === "home" || pick === "scene" ? pick : pick === "timmy" ? "outfit" : "yard", sl = kind === "yard" ? byK(TP.SLOTS, pick) : null;
    var all = kind === "home" ? TP.HOMES : kind === "scene" ? TP.SCENES : kind === "outfit" ? TP.OUTFITS : TP.YARD.filter(function(y){ return !y.wide || pick === "side" || pick === "corner"; });
    var curK = kind === "home" ? o.home : kind === "scene" ? o.scene : kind === "outfit" ? (curOut ? curOut.k : "") : o.yard[pick] || "";
    var mineOf = all.filter(owned), cur = byK(all, curK);
    var lockedOf = S.locked.filter(function(x){ return x.kind === kind; }).map(function(x){ var q = byK(all, key(kind, x.id)) || { k: x.id, n: (TP.setInfo(x.id) || {}).n || x.name, rarity: "" }; return { x: q, tier: x.rank_tier }; });
    var groups = [["classic", "Classics", mineOf.filter(function(x){ return !x.set; })], ["sets", "Seasonal", mineOf.filter(function(x){ return x.set && x.set !== "rank"; })], ["rank", "Rank", mineOf.filter(function(x){ return x.set === "rank"; })]]
      .filter(function(g){ return g[2].length || g[0] === "classic" || (g[0] === "rank" && lockedOf.length); });
    var src = V.src[kind]; if (!src || V.srcFor !== pick + ":" + curK) src = cur && cur.set && cur.set !== "rank" ? "sets" : cur && cur.set === "rank" ? "rank" : src || "classic";
    if (!groups.some(function(g){ return g[0] === src; })) src = groups[0][0];
    V.src[kind] = src; V.srcFor = pick + ":" + curK;
    var tabs = groups.length < 2 ? "" : '<div class="tpv-seg tpv-tabs" role="group" aria-label="Which pieces">' + groups.map(function(g){ return '<button type="button" data-tp="src-' + g[0] + '" data-src="' + g[0] + '" aria-pressed="' + (g[0] === src) + '">' + g[1] + ' <span class="num">' + (g[2].length + (g[0] === "rank" ? lockedOf.length : 0)) + "</span></button>"; }).join("") + "</div>";
    var pic = function(x){ return kind === "outfit" ? thumb("outfit", x.k) : kind === "scene" ? thumb("scene", x.k) : thumb(kind, x.k, { scene: o.scene }); };
    var cardOf = function(x, on, tag){ return '<button type="button" class="tpv-card' + (on ? " on" : "") + '" data-tp="piece" data-item="' + esc(x.id || "") + '" aria-pressed="' + !!on + '"><span class="tpv-cpic">' + pic(x) + '</span><span class="tpv-cname">' + esc(cardName(x.n)) + "</span>" + (tag || rarTag(x.rarity)) + (howTag(x) ? '<span class="tpv-how">' + esc(howTag(x)) + "</span>" : "") + "</button>"; };
    var lockCard = function(q){ return '<span class="tpv-card is-locked"><span class="tpv-cpic">' + (byK(all, q.x.k) ? pic(q.x) : "") + '</span><span class="tpv-cname">' + esc(cardName(q.x.n)) + '</span><span class="tpv-how">Reach ' + esc(RANKS[q.tier] || "the next rank") + "</span></span>"; };
    var shown = (groups.filter(function(g){ return g[0] === src; })[0] || groups[0])[2], cards;
    if (src === "sets") cards = (TP.SETS ? TP.SETS.seasons : []).map(function(se){ var got = shown.filter(function(x){ return x.set === se.k; }); return got.length ? '<h4 class="tpv-seth">' + esc(se.n) + '</h4><div class="tpv-cards">' + got.map(function(x){ return cardOf(x, x.k === curK); }).join("") + "</div>" : ""; }).join("");
    else cards = '<div class="tpv-cards">' +
      (src === "classic" && kind === "outfit" ? '<button type="button" class="tpv-card' + (curK ? "" : " on") + '" data-tp="piece" data-item="" aria-pressed="' + !curK + '"><span class="tpv-cpic">' + thumb("outfit", "") + '</span><span class="tpv-cname">Just Timmy</span>' + rarTag("") + "</button>" : "") +
      shown.map(function(x){ return cardOf(x, x.k === curK); }).join("") + (src === "rank" ? lockedOf.map(lockCard).join("") : "") + "</div>" +
      (src === "rank" ? '<p class="tpv-note">Rank pieces are earned, never sold: an outfit and a yard piece at every full rank-up.</p>' : "");
    var head = sl ? [sl.n, cur ? "Here now: " + lowerFirst(cur.n) + "." : "Nothing here yet. Pick something for it."]
      : [DRAWER[pick][0], pick === "timmy" ? (cur ? "Wearing " + lowerFirst(cur.n) + "." : DRAWER.timmy[1]) : (cur ? "Now: " + lowerFirst(cur.n) + ". " : "") + DRAWER[pick][1]];
    var body = '<div class="tpv-dhead"><div><h3>' + esc(head[0]) + "</h3><p>" + esc(head[1]) + "</p></div>" + (sl && cur ? '<button type="button" class="tpv-btn" data-tp="clear" data-item="">Clear this spot</button>' : "") + "</div>" + tabs + '<div class="tpv-dcards">' + cards + "</div>";
    if (kind === "home") {
      var ups = TP.UPGRADES.filter(function(u){ return h.ups.indexOf(u.k) >= 0 && S.own[u.id]; }), paints = h.ups.indexOf("paint") < 0 ? [] : TP.PAINTS.filter(function(p){ return !p.id || S.own[p.id]; });
      if (ups.length) body += '<div class="tpv-extra"><h4>Upgrades for ' + esc(lowerFirst(h.n)) + '</h4><div class="tpv-opts">' + ups.map(function(u){
        var on = !!o.up[u.k], ownName = h.upn && h.upn[u.k], same = cardName(ownName).toLowerCase() === cardName(u.n).toLowerCase();
        return '<button type="button" class="tpv-upg' + (on ? " on" : "") + '" aria-pressed="' + on + '" data-tp="up-' + u.k + '" data-up="' + u.k + '"><b>' + esc(cardName(u.n)) + "</b>" + (same || !ownName ? "" : "<small>" + esc(ownName) + "</small>") + "</button>"; }).join("") + "</div></div>";
      if (paints.length > 1) body += '<div class="tpv-extra"><h4>' + esc(h.upn && h.upn.paint || "Paint") + '</h4><div class="tpv-opts tpv-paints">' + paints.map(function(p){ var bold = /mushroom|castle|lighthouse/.test(o.home) || !!h.set, c = h.set && p.k === "cream" ? "#F4EFE6" : bold ? p.bold : p.c, nm = bold ? p.boldName : p.n;
        return '<button type="button" class="tpv-swatch' + (o.paint === p.k ? " on" : "") + '" data-tp="paint" data-paint="' + p.k + '" aria-pressed="' + (o.paint === p.k) + '" aria-label="' + esc(nm) + '" title="' + esc(nm) + '" style="--sw:' + c + '"></button>'; }).join("") + "</div></div>";
    }
    if (kind === "yard" && (pick === "side" || pick === "corner") && mineOf.some(function(y){ return y.wide; })) body += '<p class="tpv-note">The bowling lane is long: it takes the side yard and the front corner together.</p>';
    body += '<div class="tpv-row tpv-foot"><button type="button" class="tpv-btn" data-tp="surprise">Surprise me</button><button type="button" class="tpv-btn" data-tp="shop">Get more in the shop</button></div>';
    var keep = $(".tpv-dcards", el), top = keep && V.kept === kind + src ? keep.scrollTop : 0; V.kept = kind + src;
    el.innerHTML = dock + '<div class="tpv-drawer d-' + kind + '">' + body + "</div>";
    if (top) $(".tpv-dcards", el).scrollTop = top;
    $$("[data-src]", el).forEach(function(b){ b.addEventListener("click", function(){ V.src[kind] = b.dataset.src; V.srcFor = pick + ":" + curK; side(o); var n = $('[data-src="' + b.dataset.src + '"]', el); if (n) n.focus(); }); });
    $$("[data-pick]", el).forEach(function(b){ b.addEventListener("click", function(){ V.pick = b.dataset.pick; build(); var n = V && $('.tpv-tile[data-pick="' + V.pick + '"]', V.dlg); if (n) n.focus({ preventScroll: true }); }); });
    $$("[data-item]", el).forEach(function(b){ b.addEventListener("click", function(){
      var id = b.dataset.item || null, x = id ? byK(all, key(kind, id)) : null;
      if (kind === "home") { if ((e.home || null) === id) return; equip("home", id, { burst: "home", say: (x ? x.n : "The cottage") + ". Home sweet home." }); }
      else if (kind === "scene") { if ((e.scene || null) === id) return; equip("scene", id, { say: (x ? x.n : "The hill") + ". Let’s look around." }); }
      else if (kind === "outfit") { if ((e.outfit || null) === id) return; equip("outfit", id, { say: x && x.say && x.say[0] ? x.say[0] : x ? "How do I look?" : "Back to just me." }); if (!isStill()) setTimeout(function(){ if (V) flip(true); }, 400); }
      else {
        var slot = x && x.wide ? "side" : pick; if (x && x.wide) V.pick = "side";
        if ((e["yard-" + slot] || null) === id) return;
        equip("yard-" + slot, id, id ? { burst: slot, say: "New: " + lowerFirst(x.n) + "." } : {});
      }
    }); });
    $$("[data-up]", el).forEach(function(b){ b.addEventListener("click", function(){ var u = byK(TP.UPGRADES, b.dataset.up), on = !e[u.k]; equip(u.k, on ? u.id : null, on ? { burst: "home" } : {}); }); });
    $$("[data-paint]", el).forEach(function(b){ b.addEventListener("click", function(){ var p = byK(TP.PAINTS, b.dataset.paint); equip("paint", p.id || null, {}); }); });
    var su = $('[data-tp="surprise"]', el); if (su) su.addEventListener("click", surprise);
    var sh = $('[data-tp="shop"]', el); if (sh) sh.addEventListener("click", toShop);
  }
  /* Timmy's shop (widget/shop.js, phase 4 part B), fetched the first time it's wanted; it opens over the place, and what
     you buy there is handed back here (setup({ shop }) and repaint()) */
  /* the shop takes the screen; closing it comes back here, on the same tab (unless a purchase's "Put it on" or "Place it"
     already opened the place on that piece's tab) */
  function toShop(){
    script(BASE + "shop.js").then(function(){
      if (!W.shShop) return;
      var pick = V ? V.pick : "home";
      W.shShop.setup({ sb: S.sb, visitor: S.visitor, profile: S.profile || undefined });
      close();
      W.shShop.open({ onClose: function(){ if (!V) open({ customize: true, pick: pick }); } });
    }, function(){ say("The shop didn’t open just now. Try again in a moment."); });
  }
  /* Surprise me: a whole new place, from what you own */
  function surprise(){
    if (!canChange()) return;
    var any = function(l){ return l[Math.floor(Math.random() * l.length)]; }, own = function(l){ return l.filter(function(x){ return x.id && S.own[x.id]; }); };
    var homes = own(TP.HOMES).map(function(x){ return x.id; }).concat([null]), scenes = own(TP.SCENES).map(function(x){ return x.id; }).concat([null]), outs = own(TP.OUTFITS).map(function(x){ return x.id; }).concat([null]);
    var yard = own(TP.YARD).filter(function(y){ return !y.wide; }).map(function(y){ return y.id; }), want = { home: any(homes), scene: any(scenes), outfit: any(outs) };
    YARD_SLOTS.forEach(function(k){ var pickIt = yard.length && Math.random() < .72 ? yard.splice(Math.floor(Math.random() * yard.length), 1)[0] : null; want["yard-" + k] = pickIt; });
    var todo = Object.keys(want).filter(function(sl){ return (S.eq[sl] || null) !== want[sl]; });
    if (!todo.length) { say("I like it the way it is."); return; }
    todo.forEach(function(sl){ equip(sl, want[sl], false); });
    var was = V.wide; V.wide = true;
    needPacks(equippedIds(V.m)).then(function(){ if (!V) return; build({ burst: "home", say: "A whole new look! What do you think?" }); V.wide = was; repaintCards(); if (!isStill()) setTimeout(function(){ if (V) flip(true); }, 500); });
  }

  var api = W.shPlace = { setup: setup, card: card, open: open, close: close, ready: ready, repaint: repaint, seasonOn: seasonOn, STILL: STILL,
    /* for the tests: what stands where, and whether the customizer can be used */
    state: function(){ return { game: S.game, equipped: copy(S.eq), owned: Object.keys(S.own).length, locked: S.locked.length, open: !!V, mode: V ? V.mode : "", at: V ? V.at : "" }; } };
})();
