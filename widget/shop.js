/* ============ TIMMY'S SHOP (widget/shop.js, window.shShop): redesign phase 4, part B ============
   Where Shiny Gold Crowns are spent: outfits and costumes for Timmy, homes, scenes, yard pieces and upgrades for his
   place, snacks that put HP back on his bar, and double-XP boosts. Only the redesign's pages load this file, and only on
   first use (a new hub's More, the new dashboard's Shop button, the place's "Get more in the shop"): never with a page.
   It fetches its stylesheet (widget/shop.css), the shop's art (widget/hub-art/shop.js, window.SH_SHOP_ART) and the
   place's kit (widget/place.js, window.shPlace, which fetches widget/hub-art/place.js and each set's file) itself.

   shShop.setup({ sb, visitor, shop, profile, onBought })   shop: get_my_shop's answer (the bootstrap's `shop`)
   shShop.mount(el, { level })   draws the shop into el (a hub's More page; level is its shelves' heading level)
   shShop.open()                 the shop as a dialog (the dashboard, the place)
   shShop.balance()              the balance as the server last said it, or null
   After every read and purchase it fires "sh:shop" on document with { shop } (the "you" card and More listen).

   The server is migration_v54 (vault/reference/game-server.md, "Shiny Gold Crowns and the shop"): get_my_shop's
   shelves (daily, weekly, season, throwback, spotted, always), its wallet, inventory, costumes, snacks_today and boost;
   buy_item(visitor, item, request), idempotent on the request id, which is made once when an item's sheet opens and
   sent again on every tap and retry of that purchase, so a double tap buys once. The balance is never worked out here:
   it is the server's (the bootstrap, get_my_shop, buy_item's reply).

   Every button carries a fixed data-shop name first, so click counts (widget/clicks.js) never pick up an item's name;
   names from the catalog are always drawn as text. Feature events: shop:open, shop:buy:<kind> (never the item).
   ============ */
(function(){
  "use strict";
  if (window.shShop) return;
  var W = window, D = document, me = D.currentScript;
  var BASE = me && me.src ? me.src.replace(/[^\/]*(\?.*)?$/, "") : "widget/";
  var reduced = false; try { reduced = matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  function ls(k, v){ try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function $(s, r){ return (r || D).querySelector(s); }
  function $$(s, r){ return [].slice.call((r || D).querySelectorAll(s)); }
  function track(k){ try { if (W.shTrack) W.shTrack(k); } catch (e) {} }
  function num(n){ return String(Math.round(+n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  function cap(t){ t = String(t || ""); return t.charAt(0).toUpperCase() + t.slice(1); }
  function cardName(n){ n = String(n || "").replace(/^(The|A|An) /, ""); return cap(n); }
  function lowerFirst(t){ t = String(t || ""); return /^(The|A|An) /.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t; }
  function sentence(t){ t = String(t || "").replace(/^(Free|Default|Common|Uncommon|Rare|Epic|Legendary): /, "").replace(/\.$/, ""); return cap(t); }

  /* ---------- loading: the stylesheet, the shop's art and the place's kit, each once and only when first needed ---------- */
  var memo = {}, SA = null, TP = null;
  function script(src){
    return memo[src] || (memo[src] = new Promise(function(res, rej){ var s = D.createElement("script"); s.src = src; s.async = true; s.onload = function(){ res(); }; s.onerror = function(){ delete memo[src]; rej(new Error(src)); }; D.head.appendChild(s); }));
  }
  function css(){ if (memo.css) return; memo.css = 1; var l = D.createElement("link"); l.rel = "stylesheet"; l.href = BASE + "shop.css"; D.head.appendChild(l); }
  function art(){ return SA ? Promise.resolve(SA) : script(BASE + "hub-art/shop.js").then(function(){ SA = W.SH_SHOP_ART || null; if (!SA) throw new Error("no shop art"); return SA; }); }
  function kit(){
    return (W.shPlace ? Promise.resolve() : script(BASE + "place.js")).then(function(){
      if (!W.shPlace) throw new Error("no place");
      return W.shPlace.ready();
    }).then(function(){ TP = W.SH_PLACE || null; if (!TP) throw new Error("no kit"); return TP; });
  }
  /* the sets' own files, for the seasonal pieces on today's shelves (the place loads them the same way, once each) */
  function packs(ids){
    var eq = {}; (ids || []).forEach(function(id, i){ if (id && TP.setOf(id)) eq["x" + i] = id; });
    return Object.keys(eq).length ? W.shPlace.ready({ eq: eq }).then(null, function(){}) : Promise.resolve();
  }
  function ready(){ css(); return Promise.all([art(), kit()]); }

  /* ---------- what the shop knows ---------- */
  var S = { sb: null, visitor: null, shop: null, profile: null, onBought: null, roots: [], tick: 0 };
  var SPOTS = ["pirate", "astronaut", "detective", "chef", "captain-enamel"];
  function take(sh){
    if (!sh || typeof sh !== "object" || !Array.isArray(sh.items) || !sh.wallet) return false;
    S.shop = sh;
    try { D.dispatchEvent(new CustomEvent("sh:shop", { detail: { shop: sh } })); } catch (e) {}
    return true;
  }
  function setup(o){
    o = o || {};
    if (o.sb) S.sb = o.sb;
    if (o.visitor) S.visitor = o.visitor;
    if (o.profile) S.profile = o.profile;
    if (typeof o.onBought === "function") S.onBought = o.onBought;
    if (o.shop) take(o.shop);
    return api;
  }
  function balance(){ return S.shop && S.shop.wallet && typeof S.shop.wallet.balance === "number" ? S.shop.wallet.balance : null; }
  /* the shop as the server has it now (another device may have bought something; a new day has new shelves) */
  function read(){
    if (!S.sb || !S.visitor) return Promise.resolve(!!S.shop);
    return S.sb.rpc("get_my_shop", { p_visitor: S.visitor }).then(function(r){ if (r && !r.error) take(r.data); return !!S.shop; }, function(){ return !!S.shop; });
  }
  function canBuy(){ return !!(S.sb && S.visitor && S.shop && S.shop.wallet); }

  /* ---------- Central time: the shop changes at midnight there, the weekly shelf on Monday ---------- */
  function central(){
    var p = {};
    try { new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "short", hourCycle: "h23" })
      .formatToParts(new Date()).forEach(function(x){ p[x.type] = x.value; }); } catch (e) { var d = new Date(); return { day: "", h: d.getHours(), m: d.getMinutes(), wd: d.getDay() || 7 }; }
    return { day: p.year + "-" + p.month + "-" + p.day, h: +p.hour % 24, m: +p.minute, wd: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(p.weekday) + 1 };
  }
  function untilMidnight(){ var c = central(), left = 24 * 60 - (c.h * 60 + c.m), h = Math.floor(left / 60), m = left % 60; return h ? h + " h " + m + " min" : m + " min"; }
  function daysLeft(){ var n = 8 - (central().wd || 1); return n <= 1 ? "Last day" : n + " days left"; }

  /* ---------- the pieces: what each item is in the kit, its picture and its words ---------- */
  var KIND_N = { home: "Home", scene: "Scene", yard: "Yard piece", upgrade: "For the house", outfit: "Outfit for Timmy", costume: "Rare costume", snack: "Snack for Timmy", boost: "XP boost" };
  function byId(list, id){ for (var i = 0; i < (list || []).length; i++) if (list[i].id === id) return list[i]; return null; }
  function piece(it){
    var k = it.kind;
    if (k === "snack" || k === "boost") return byId(SA.ITEMS, it.id);
    if (k === "outfit" || k === "costume") return byId(TP.OUTFITS, it.id);
    if (k === "home") return byId(TP.HOMES, it.id);
    if (k === "scene") return byId(TP.SCENES, it.id);
    if (k === "yard") return byId(TP.YARD, it.id);
    if (k === "upgrade") return byId(TP.UPGRADES, it.id) || byId(TP.PAINTS, it.id);
    return null;
  }
  function rarityOf(it){ return cap(String(it.rarity || "common").toLowerCase()); }
  function seasonOf(it){ var k = it.season || (TP.setOf(it.id) !== "rank" ? TP.setOf(it.id) : ""); return k && TP.SETS ? TP.SETS.seasons.filter(function(q){ return q.k === k; })[0] || null : null; }
  /* a set's piece stands in its own set's scene; anything else on the hill */
  function sceneFor(it){ var se = seasonOf(it), sc = se ? TP.SCENES.filter(function(q){ return q.set === se.k; })[0] : null; return sc ? sc.k : "hill"; }
  function img(svg, alt, cls){
    if (!svg) return "";
    if (!/xmlns=/.test(svg)) svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
    return '<img' + (cls ? ' class="' + cls + '"' : "") + ' src="data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg) + '" alt="' + esc(alt || "") + '" decoding="async">';
  }
  /* Timmy, as widget/pet.js draws him, in an outfit (no outfit: just him) */
  function timmy(outfitKey, hp){
    var P = W.shPet, s = "";
    try { s = P && P.art ? P.art({ hp: hp || 95, hat: "", mood: "happy" }, 200) : ""; } catch (e) { s = ""; }
    return s && outfitKey ? TP.dress(s, outfitKey) : s;
  }
  var PICS = {};
  function pic(it){
    if (PICS[it.id] != null) return PICS[it.id];
    var x = piece(it), k = it.kind, svg = "";
    try {
      if (k === "snack" || k === "boost") svg = SA.thumb(it.id);
      else if (!x) svg = "";
      else if (k === "outfit" || k === "costume") svg = timmy(x.k);
      else if (k === "scene") svg = TP.thumb("scene", x.k);
      else if (k === "home" || k === "yard") svg = TP.thumb(k, x.k, { scene: sceneFor(it) });
      else if (k === "upgrade") svg = x.c ? TP.thumb("home", "cottage", { paint: x.k }) : TP.thumb("home", "cottage", { up: (function(){ var u = {}; u[x.k] = true; return u; })() });
    } catch (e) { svg = ""; }
    return (PICS[it.id] = svg);
  }
  function words(it){
    var x = piece(it), n = it.name || (x && x.n) || it.id;
    return { name: cardName(n), note: sentence(x && x.note || ""), say: x && x.say && x.say[0] || "", kind: KIND_N[it.kind] || "" };
  }
  /* The card's frame from the shop's art, and the storefront's two layers. Each is a still, with the moving one over
     it (.tsh-live) unless motion is off: an image that moves inside is drawn again whole on every frame, and a shelf
     has dozens. So the shop moves for a few seconds when it opens, when a scroll ends and under a mouse, and rests
     otherwise (shopLife; shop.css takes the moving ones away under .is-rest). 2026-11-14, Sam: "scrolling and things
     are kind of sluggish and jittery". */
  var FRAMES = {};
  function moving(s, re){ return s.replace(/(<svg[^>]*>)/, "$1<style>" + SA.CSS.split("\n").filter(function(l){ return re.test(l); }).join("\n") + "</style>"); }
  function frame(r){
    if (!FRAMES[r]) {
      var s = SA.frame(r);
      FRAMES[r] = img(s, "", "tsh-rframe") + (reduced || !/ts-r-/.test(s) ? "" : img(moving(s, /ts-r-|@keyframes ts-spin|prefers-reduced/), "", "tsh-rframe tsh-live"));
    }
    return FRAMES[r];
  }
  function store(layer){
    var key = "store-" + layer;
    if (!FRAMES[key]) {
      var s = SA.store(layer);
      FRAMES[key] = img(s, "", "tsh-frontart") + (reduced || !/ts-s-/.test(s) ? "" : img(moving(s, /ts-s-|@keyframes ts-spin|@keyframes ts-r-tw|prefers-reduced/), "", "tsh-frontart tsh-live"));
    }
    return FRAMES[key];
  }
  function shopLife(dlg){
    var t = 0, st = 0, scrolling = false;
    function rest(){ clearTimeout(t); t = 0; dlg.classList.add("is-rest"); }
    function wake(){ if (scrolling) return; clearTimeout(t); dlg.classList.remove("is-rest"); t = setTimeout(rest, 6000); }
    dlg.addEventListener("scroll", function(){
      if (!scrolling) { scrolling = true; rest(); }
      clearTimeout(st); st = setTimeout(function(){ scrolling = false; wake(); }, 260);
    }, { capture: true, passive: true });
    dlg.addEventListener("mousemove", function(){ if (!t) wake(); }, { passive: true });
    wake();
  }
  function coin(cls){ return img('<svg viewBox="0 0 24 24">' + SA.coinBody(false) + "</svg>", "", cls || "tsh-coin"); }
  function rarTag(r){ return '<i class="tsh-rar r-' + r + '">' + esc(r) + "</i>"; }
  var IC = {
    clock: '<svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true"><circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 5.8V10l2.8 1.9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    glass: '<svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true"><path d="M5 2.5h10M5 17.5h10M6.2 2.5c0 4 3.8 5 3.8 7.5s-3.8 3.5-3.8 7.5M13.8 2.5c0 4-3.8 5-3.8 7.5s3.8 3.5 3.8 7.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><path d="M7.6 16.5c.6-1.9 4.2-1.9 4.8 0Z" fill="currentColor"/></svg>',
    check: '<svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><path d="M4.5 10.5l3.7 3.7L15.5 6.5" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    x: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>'
  };
  function rays(){ var s = ""; for (var a = 0; a < 12; a++) s += '<path d="M0 0L-13 -120L13 -120Z" transform="rotate(' + a * 30 + ')"/>'; return '<svg class="tsh-irays" viewBox="-100 -100 200 200" aria-hidden="true"><g>' + s + "</g></svg>"; }
  function rarVars(r){ var R = (SA.RARITIES || []).filter(function(q){ return q.k === r; })[0] || SA.RARITIES[0]; return "--sr-fill:" + R.fill + ";--sr-edge:" + R.edge + ";--sr-deep:" + R.deep + ";--sr-ink:" + R.ink; }

  /* ---------- an item's one state on its card: Buy, Yours, N more to go, Bought today, He's full ---------- */
  function consumable(it){ return it.kind === "snack" || it.kind === "boost"; }
  function hpNow(){ try { var h = W.shPet && W.shPet.hp ? W.shPet.hp() : null; return typeof h === "number" ? h : null; } catch (e) { return null; } }
  function stateOf(it){
    var sh = S.shop || {}, bal = balance();
    if (!consumable(it) && it.owned) return { k: "owned", t: "Yours" };
    if (it.kind === "snack" && (sh.snacks_today || []).indexOf(it.id) >= 0) return { k: "today", t: "Bought today" };
    if (it.kind === "snack" && hpNow() >= 100) return { k: "full", t: "He’s full" };
    if (bal !== null && it.price > bal) return { k: "short", t: num(it.price - bal) + " more to go" };
    return { k: "buy", t: "" };
  }
  function does(it){ return it.kind === "snack" ? "+" + (it.hp || 0) + " HP" : it.kind === "boost" ? (it.boost_mult || 2) + "x XP · " + Math.round((it.boost_minutes || 60) / 60) + " h" : ""; }
  /* a card's own words are its name (name, rarity, price, what it does, its state), read in that order; the parts sit
     where the design puts them by position, not by their order here */
  function card(it, shelf){
    var r = rarityOf(it), w = words(it), st = stateOf(it), d = does(it), sep = '<span class="sr">, </span>';
    return '<button type="button" class="tsh-card r-' + r + " s-" + st.k + '" data-shop="item" data-item="' + esc(it.id) + '" data-shelf="' + shelf + '">' + frame(r) +
      '<span class="tsh-rthumb k-' + it.kind + '">' + img(pic(it), "") + "</span>" +
      '<span class="tsh-rtext"><span class="tsh-rname">' + esc(w.name) + "</span>" + sep + '<span class="tsh-rmeta">' + rarTag(r) + "</span></span>" +
      (st.k === "owned" ? "" : sep + '<span class="tsh-rprice"><span class="tsh-price">' + coin() + '<b class="num">' + num(it.price) + '</b><span class="sr"> gold crowns</span></span></span>') +
      (d ? sep + '<span class="tsh-does">' + esc(d) + "</span>" : "") +
      (shelf === "throwback" ? sep + '<span class="tsh-stamp">' + IC.glass + "<b>Today only</b></span>" : "") +
      (st.t ? sep + '<span class="tsh-state s-' + st.k + '">' + (st.k === "owned" ? IC.check : "") + esc(st.t) + "</span>" : "") + "</button>";
  }
  /* a rare costume nobody has spotted yet: its shape only */
  function unseen(x){
    var s = timmy(x.k);
    return '<span class="tsh-card tsh-static tsh-unseen r-Common" role="img" aria-label="A rare costume you haven’t spotted yet">' + frame("Common") + '<span class="tsh-rthumb k-costume">' + img(s, "") + '</span><span class="tsh-rtext"><span class="tsh-rname">Not spotted yet</span></span></span>';
  }

  /* ---------- the page: the storefront, today's showcase, the shelves ---------- */
  var RANK = ["common", "uncommon", "rare", "epic", "legendary"];
  function showcase(items){
    return items.filter(function(it){ return !consumable(it) && !it.owned && it.shelf !== "always"; })
      .sort(function(p, q){ return (RANK.indexOf(String(q.rarity).toLowerCase()) * 1e6 + q.price) - (RANK.indexOf(String(p.rarity).toLowerCase()) * 1e6 + p.price); })[0] || null;
  }
  function whenOf(shelf){
    return shelf === "daily" ? "In the shop until midnight" : shelf === "weekly" ? (daysLeft() === "Last day" ? "Last day in the shop" : "In the shop for " + daysLeft().replace(" left", " more")) : shelf === "season" ? "Limited time"
      : shelf === "throwback" ? "Back for today only" : shelf === "spotted" ? "It waits here until you buy it" : "";
  }
  function head(o, lvl, title, when, ic, note, live){
    return "<header><h" + lvl + ' class="tsh-tagsign">' + esc(title) + "</h" + lvl + '><span class="tsh-when"' + (live ? ' data-when="' + live + '"' : "") + ">" + ic + "<span>" + esc(when) + "</span></span>" + (note ? '<p class="tsh-note">' + esc(note) + "</p>" : "") + "</header>";
  }
  function shelf(k, lvl, title, when, ic, note, html, n, live){
    return '<section class="tsh-shelf tsh-shelf-' + k + '">' + head(null, lvl, title, when, ic, note, live) + '<div class="tsh-rcards tsh-plank" style="--n:' + n + '">' + html + "</div></section>";
  }
  function seasonPoster(se){
    var of = function(list){ return list.filter(function(x){ return x.set === se.k; }); };
    var homes = of(TP.HOMES), scenes = of(TP.SCENES), outs = of(TP.OUTFITS), yard = {};
    if (!homes.length || !scenes.length) return "";
    of(TP.YARD).filter(function(y){ return !y.wide; }).slice(0, 3).forEach(function(y, i){ yard[["left", "front", "right"][i]] = y.k; });
    var t = timmy((outs.slice(-1)[0] || {}).k), g = t ? '<g class="tp-tface"><g class="tp-tmood"><svg x="-18" y="-46.1" width="36" height="47.2" viewBox="0 -30 200 262" overflow="visible">' + t.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "") + "</svg></g></g>" : "";
    var o = { home: homes[0].k, scene: scenes[0].k, yard: yard, up: {}, paint: "cream", tier: 0, level: 1, journey: 0, flair: [], night: false, viewBox: TP.CARD };
    if (g) o.timmy = { g: g, at: "door" };
    var svg = ""; try { svg = TP.render(o).svg; } catch (e) { return ""; }
    if (reduced) svg = svg.replace(/(<svg[^>]*>)/, "$1<style>*{animation:none!important}</style>");
    else svg = svg.replace(/(<svg[^>]*>)/, function(m){ return m + "<style>" + TP.CSS.replace(/\.tp-still[^\n]*/, "") + "</style>"; });
    return '<div class="tsh-poster">' + img(svg, "The whole " + se.n + " set at Timmy’s place") + "</div>";
  }
  function page(root, o){
    var sh = S.shop, lvl = o.level || 2, items = sh.items || [], bal = balance();
    var on = function(s){ return items.filter(function(it){ return it.shelf === s; }); };
    var stripes = ""; for (var i = 0; i < 40; i++) stripes += "<i></i>";
    var keeper = timmy("bow-tie");
    var w = sh.wallet || {};
    var html = '<div class="tsh-store' + (reduced ? " tsh-still" : "") + '"><div class="tsh-awning" aria-hidden="true">' + stripes + "</div>" +
      '<div class="tsh-front"><span class="tsh-frontlayer" aria-hidden="true">' + store("back") + "</span>" + (keeper ? '<span class="tsh-keeper" aria-hidden="true">' + img(keeper, "") + "</span>" : "") +
        '<span class="tsh-frontlayer" aria-hidden="true">' + store("front") + "</span>" +
        '<div class="tsh-sign"><i class="tsh-nail a"></i><i class="tsh-nail b"></i>' + (o.title ? "<h" + (lvl - 1) + ' class="tsh-signh" id="' + o.title + '">' : "<b>") + coin() + "Timmy’s Shop" + (o.title ? "</h" + (lvl - 1) + ">" : "</b>") + "<span>Tap anything for a closer look.</span></div>" +
        '<span class="tsh-wallet"><span class="sr">Your balance: </span>' + coin() + '<span><b class="num" data-shop-bal>' + (bal === null ? "–" : num(bal)) + "</b><small>Shiny Gold Crowns</small></span></span></div>" +
      '<div class="tsh-earnrow"><button type="button" class="tsh-earnbtn" data-shop="earn" aria-expanded="false">How you earn gold crowns</button>' +
        '<div class="tsh-earn" hidden><ul><li><b>1</b> for every 10 XP you earn (a boost’s extra XP doesn’t count)</li><li><b>25</b> for each trophy</li><li><b>50</b> for each mastery medal</li><li><b>20</b> for each rank-up</li></ul>' +
        '<p class="tsh-note">So far: ' + num(w.earned) + " earned" + (w.spent ? ", " + num(w.spent) + " spent" : "") + ". Spending never lowers your XP or your rank.</p></div></div>";
    /* the showcase: the rarest piece on sale you don't own yet (the dearest among those), large, on its stand */
    var star = showcase(items);
    if (star) {
      var r = rarityOf(star), ws = words(star), se = seasonOf(star);
      html += '<section class="tsh-show r-' + r + '" style="' + rarVars(r) + '"><div class="tsh-showcase" aria-hidden="true">' + rays() +
        '<span class="tsh-showpiece k-' + star.kind + '">' + img(pic(star), "") + '</span><span class="tsh-showstand">' + img(SA.stand(r), "") + "</span>" +
        '<i class="tsh-showtw a"></i><i class="tsh-showtw b"></i><i class="tsh-showtw c"></i></div>' +
        '<div class="tsh-showinfo"><h' + lvl + ' class="tsh-showkick">Today’s showcase</h' + lvl + '><p class="tsh-showname">' + esc(ws.name) + "</p>" +
        '<p class="tsh-itags">' + rarTag(r) + "<span>" + esc(ws.kind) + (se ? " · " + esc(se.n) + " set" : "") + "</span></p>" + (ws.note ? '<p class="tsh-showdesc">' + esc(ws.note) + ".</p>" : "") +
        '<div class="tsh-showbuy"><span class="tsh-big">' + coin() + '<b class="num">' + num(star.price) + '</b></span><button type="button" class="tsh-buy" data-shop="showcase" data-item="' + esc(star.id) + '" data-shelf="' + esc(star.shelf) + '">Take a closer look</button></div>' +
        '<p class="tsh-showwhen">' + IC.clock + esc(whenOf(star.shelf)) + "</p></div></section>";
    }
    var cards = function(list, k){ return list.map(function(it){ return card(it, k); }).join(""); };
    var today = on("daily"), week = on("weekly"), back = on("throwback");
    if (today.length) html += shelf("today", lvl, "Today’s picks", "New in " + untilMidnight(), IC.clock, "Four pieces, the same for everyone, new at midnight (Central time).", cards(today, "daily"), today.length, "day");
    /* side by side on a throwback day; a shelf on its own keeps Today's card size rather than stretching three across */
    var pair = week.length && back.length, wide = function(n){ return pair ? n : Math.max(n, 4); };
    if (week.length || back.length) html += '<div class="tsh-aisle' + (pair ? " a11" : "") + '">' +
      (week.length ? shelf("week", lvl, "This week", daysLeft(), IC.clock, "Three bigger pieces, new every Monday.", cards(week, "weekly"), wide(week.length), "week") : "") +
      (back.length ? shelf("back", lvl, "Back for today", "Gone at midnight", IC.glass, "A throwback day: pieces from a season that has passed, at their usual price.", cards(back, "throwback"), wide(back.length)) : "") + "</div>";
    (sh.seasons || []).forEach(function(k){
      var list = items.filter(function(it){ return it.shelf === "season" && it.season === k; }), se = TP.SETS ? TP.SETS.seasons.filter(function(q){ return q.k === k; })[0] : null;
      if (!list.length) return;
      html += '<section class="tsh-shelf tsh-shelf-season">' + head(null, lvl, se ? se.n : cap(k), "Limited time", IC.clock, "This season’s set, on sale only while the season lasts." + (list.every(function(it){ return it.gift; }) ? " It’s a gift: everyone already has it." : "")) +
        '<div class="tsh-seasonbody">' + (se ? seasonPoster(se) : "") + '<div class="tsh-rcards tsh-plank" style="--n:' + Math.min(4, list.length) + '">' + cards(list, "season") + "</div></div></section>";
    });
    /* rare costumes: the ones that turned up wait here until bought; one you bought shows as yours; the rest are shapes */
    var log = {}; (sh.costumes || []).forEach(function(c){ if (c && c.id) log[c.id] = c.day || 1; });
    var owned = {}; (sh.inventory || []).forEach(function(x){ if (x && x.id) owned[x.id] = 1; });
    var spotted = TP.OUTFITS.filter(function(x){ return x.costume && x.id; }).sort(function(a, b){ return SPOTS.indexOf(a.id) - SPOTS.indexOf(b.id); }), seen = 0;
    var spotHtml = spotted.map(function(x){
      if (!log[x.id] && !owned[x.id]) return unseen(x);
      seen++;
      var it = items.filter(function(q){ return q.id === x.id; })[0] || { id: x.id, name: cardName(x.n), kind: "costume", rarity: String(x.rarity || "epic").toLowerCase(), price: x.price, shelf: "spotted", owned: !!owned[x.id] };
      return card(it, "spotted");
    }).join("");
    html += shelf("spotted", lvl, "Spotted", seen + " of " + spotted.length + " so far", IC.glass, "Rare costumes turn up at the shop now and then, and Timmy tells you when one does. One that turned up waits here until you buy it.", spotHtml, spotted.length);
    var always = on("always");
    if (always.length) html += shelf("always", lvl, "Always here", "Never sells out", IC.check, "Snacks put health back on Timmy’s bar, one of each a day. A boost doubles your XP from the moment you buy it; a second one adds its time.", cards(always, "always"), always.length);
    html += '<p class="tsh-note tsh-storefoot">Rank sets are never on a shelf: you earn them. What you buy is yours on every device you link.</p></div>';
    root.innerHTML = html;
    wire(root);
  }
  function wire(root){
    $$('[data-shop="item"], [data-shop="showcase"]', root).forEach(function(b){ b.addEventListener("click", function(){ var it = find(b.getAttribute("data-item")); if (it) sheet(it); }); });
    var eb = $('[data-shop="earn"]', root);
    if (eb) eb.addEventListener("click", function(){ var p = eb.nextElementSibling, o = p.hidden; p.hidden = !o; eb.setAttribute("aria-expanded", String(o)); });
  }
  function find(id){
    var it = (S.shop.items || []).filter(function(q){ return q.id === id; })[0];
    if (it) return it;
    /* a spotted costume you own is drawn from the kit: its sheet says it's yours */
    var x = TP && byId(TP.OUTFITS, id);
    return x && x.costume ? { id: id, name: cardName(x.n), kind: "costume", rarity: String(x.rarity).toLowerCase(), price: x.price, shelf: "spotted", owned: true } : null;
  }
  /* every page this shop is drawn on, drawn again (after a purchase, a read, a new minute) */
  function redraw(){
    S.roots = S.roots.filter(function(x){ return x.el.isConnected; });
    S.roots.forEach(function(x){ var y = W.scrollY; page(x.el, x.o); if (Math.abs(W.scrollY - y) > 2) W.scrollTo(0, y); });
  }
  function clock(){
    clearInterval(S.tick);
    S.tick = setInterval(function(){
      S.roots = S.roots.filter(function(x){ return x.el.isConnected; });
      if (!S.roots.length) { clearInterval(S.tick); return; }
      if (S.shop && S.shop.day && central().day && String(S.shop.day).slice(0, 10) !== central().day) { read().then(redraw); return; }
      $$("[data-when=day] > span").forEach(function(s){ s.textContent = "New in " + untilMidnight(); });
      $$("[data-when=week] > span").forEach(function(s){ s.textContent = daysLeft(); });
    }, 30000);
  }

  /* draw the shop into a page (a hub's More): the cached shop at once, then the server's */
  function mount(el, o){
    o = o || {};
    if (!el) return Promise.resolve(false);
    if (!el.innerHTML) el.innerHTML = '<p class="tsh-note" role="status">Opening the shop…</p>';
    ls("sh_shop_dot", null); track("shop:open");
    return ready().then(function(){ return S.shop ? null : read(); }).then(function(){
      if (!S.shop) throw new Error("no shop");
      return packs((S.shop.items || []).map(function(it){ return it.id; }));
    }).then(function(){
      if (!el.isConnected) return false;
      var ent = { el: el, o: o }; S.roots = S.roots.filter(function(x){ return x.el !== el && x.el.isConnected; }); S.roots.push(ent);
      page(el, o); clock();
      /* then what the server has now (drawn again only if it differs) */
      var was = JSON.stringify(S.shop);
      read().then(function(){ return packs((S.shop.items || []).map(function(it){ return it.id; })); }).then(function(){ if (el.isConnected && JSON.stringify(S.shop) !== was) page(el, o); });
      try { D.dispatchEvent(new CustomEvent("sh:shop", { detail: { shop: S.shop, opened: true } })); } catch (e) {}
      return true;
    }, function(){ if (el.isConnected) el.innerHTML = '<p class="tsh-note">The shop couldn’t be opened just now. Try again in a moment.</p>'; return false; });
  }
  /* the shop as a dialog of its own (the dashboard's Shop button, the place's "Get more in the shop") */
  var DLG = null;
  function open(o){
    o = o || {};
    if (DLG) return api;
    css();
    var dlg = D.createElement("dialog"); dlg.className = "tsh-dlg"; dlg.setAttribute("aria-labelledby", "tshT");
    dlg.innerHTML = '<div class="tsh-dlgin"><button type="button" class="tsh-x" data-shop="close" aria-label="Close the shop">' + IC.x + '</button><div class="tsh-dlgbody"><h2 class="sr" id="tshT">Timmy’s Shop</h2><p class="tsh-note" role="status">Opening the shop…</p></div></div>';
    D.body.appendChild(dlg); DLG = { dlg: dlg, back: D.activeElement, onClose: o.onClose || null };
    var shut = function(){ if (!DLG) return; var d = DLG; DLG = null; if (d.dlg.parentNode) d.dlg.parentNode.removeChild(d.dlg); D.documentElement.classList.remove("tsh-open"); try { if (d.back && d.back.isConnected) d.back.focus(); } catch (e) {} if (d.onClose) try { d.onClose(); } catch (e) {} };
    dlg.addEventListener("close", shut);
    dlg.addEventListener("click", function(e){ if (e.target === dlg) close(); });
    $('[data-shop="close"]', dlg).addEventListener("click", close);
    try { dlg.showModal(); } catch (e) { dlg.setAttribute("open", ""); }
    D.documentElement.classList.add("tsh-open");
    shopLife(dlg);
    mount($(".tsh-dlgbody", dlg), { level: 3, title: "tshT" });
    return api;
  }
  function close(){ if (DLG) { try { DLG.dlg.close(); } catch (e) {} } }

  /* ---------- an item's sheet: the piece large, what it is, its price against your balance, and Buy ---------- */
  var SH = null;
  function rid(){ var s = ""; try { var a = new Uint8Array(12); crypto.getRandomValues(a); for (var i = 0; i < a.length; i++) s += (a[i] % 36).toString(36); } catch (e) { s = Math.random().toString(36).slice(2, 14); } return "shop-" + Date.now().toString(36) + "-" + s; }
  function sheet(it){
    if (SH) closeSheet();
    var dlg = D.createElement("dialog"); dlg.className = "tsh-sheet"; dlg.setAttribute("aria-labelledby", "tshI");
    D.body.appendChild(dlg);
    SH = { dlg: dlg, it: it, rid: rid(), busy: false, done: false, back: D.activeElement };
    dlg.addEventListener("close", function(){ var s = SH; if (s && s.dlg === dlg) SH = null; if (dlg.parentNode) dlg.parentNode.removeChild(dlg); try { if (s && s.back && s.back.isConnected) s.back.focus(); } catch (e) {} });
    dlg.addEventListener("click", function(e){ if (e.target === dlg) closeSheet(); });
    drawSheet();
    try { dlg.showModal(); } catch (e) { dlg.setAttribute("open", ""); }
  }
  function closeSheet(){ if (SH) { try { SH.dlg.close(); } catch (e) {} } }
  function drawSheet(msg){
    if (!SH) return;
    var it = SH.it, r = rarityOf(it), w = words(it), se = seasonOf(it), st = stateOf(it), bal = balance(), d = does(it), done = SH.done;
    var kind = w.kind + (se ? " · " + se.n + " set" : "") + (it.shelf === "throwback" ? " · Back for today" : "");
    var buy;
    if (done) buy = doneHtml(it);
    else if (st.k === "owned") buy = '<p class="tsh-iown">' + IC.check + (it.gift ? "Yours: everyone has this set." : "Yours. It’s in your things at Timmy’s place for good.") + "</p>" + placeBtn(it);
    else {
      var after = bal === null ? null : bal - it.price, why = st.k === "today" ? "Timmy already had one of these today. One of each snack a day." : st.k === "full" ? "He’s full: Timmy is at 100 HP. Save it for a day he needs it." : "";
      buy = '<div class="tsh-iprice"><span class="tsh-big">' + coin() + '<b class="num">' + num(it.price) + '</b><span class="sr"> gold crowns</span></span>' +
        '<span class="tsh-ihave">' + (bal === null ? "" : "You have " + num(bal) + (after >= 0 ? ". After: " + num(after) + "." : ".")) + "</span>" +
        (st.k === "short" ? '<span class="tsh-ibar" aria-hidden="true"><i style="width:' + Math.max(3, Math.min(100, Math.round(bal / it.price * 100))) + '%"></i></span><span class="tsh-ishort">' + esc(st.t) + ". Keep studying: every 10 XP is one more.</span>" : "") + "</div>" +
        '<p class="tsh-msg" role="status" aria-live="polite">' + esc(msg || why) + "</p>" +
        '<div class="tsh-iacts"><button type="button" class="tsh-buy" data-shop="confirm"' + (st.k === "buy" && canBuy() ? "" : " disabled") + ">" + (SH.busy ? "Buying…" : "Buy for " + num(it.price)) + '</button><button type="button" class="tsh-ghost" data-shop="cancel">Not now</button></div>';
    }
    SH.dlg.className = "tsh-sheet";
    SH.dlg.innerHTML = '<div class="tsh-item r-' + r + (done ? " is-done" : "") + '" style="' + rarVars(r) + '"><button type="button" class="tsh-x tsh-ix" data-shop="close-item" aria-label="Back to the shop">' + IC.x + "</button>" +
      '<div class="tsh-icase">' + rays() + '<i class="tsh-icorner a"></i><i class="tsh-icorner b"></i><div class="tsh-ipiece k-' + it.kind + '">' + (it.kind === "outfit" || it.kind === "costume" ? '<span class="tsh-ipod" aria-hidden="true"></span>' : "") +
        img(pic(it), it.kind === "outfit" ? "Timmy in the " + w.name.toLowerCase() : it.kind === "costume" ? "Timmy as " + lowerFirst((piece(it) || {}).n || w.name) : w.name) + "</div>" + (d ? '<span class="tsh-ido">' + esc(d) + "</span>" : "") + "</div>" +
      '<div class="tsh-iinfo"><p class="tsh-ikind">' + esc(kind) + '</p><h2 id="tshI">' + esc(w.name) + '</h2><p class="tsh-itags">' + rarTag(r) + "</p>" +
        (w.note ? '<p class="tsh-idesc">' + esc(w.note) + ".</p>" : "") +
        (it.kind === "costume" && w.say ? '<p class="tsh-isay"><q>' + esc(w.say) + "</q></p>" : "") +
        '<div class="tsh-ibuy">' + buy + "</div></div></div>";
    $$('[data-shop="close-item"], [data-shop="cancel"], [data-shop="back"]', SH.dlg).forEach(function(b){ b.addEventListener("click", closeSheet); });
    var cb = $('[data-shop="confirm"]', SH.dlg); if (cb) cb.addEventListener("click", confirm);
    var pb = $('[data-shop="place"], [data-shop="wear"]', SH.dlg); if (pb) pb.addEventListener("click", toPlace);
    var f = $('[data-shop="confirm"]:not([disabled])', SH.dlg) || $('[data-shop="place"], [data-shop="wear"]', SH.dlg) || $('[data-shop="close-item"]', SH.dlg);
    try { f.focus({ preventScroll: true }); } catch (e) {}
  }
  function placeable(it){ return ["outfit", "costume", "home", "scene", "yard", "upgrade"].indexOf(it.kind) >= 0 && W.shPlace && S.shop; }
  function placeBtn(it){ return placeable(it) ? '<div class="tsh-iacts"><button type="button" class="tsh-buy" data-shop="' + (it.kind === "outfit" || it.kind === "costume" ? "wear" : "place") + '">' + (it.kind === "outfit" || it.kind === "costume" ? "Put it on" : "Place it") + '</button><button type="button" class="tsh-ghost" data-shop="back">Back to the shop</button></div>' : ""; }
  function doneHtml(it){
    var R = SH.res || {}, line;
    if (it.kind === "snack") line = "Timmy ate it. +" + (R.hp || it.hp || 0) + " HP.";
    else if (it.kind === "boost") line = "Double XP is on" + (R.boost_until ? " until " + new Date(R.boost_until).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "") + ".";
    else line = "It’s yours! It stays in your things at Timmy’s place for good.";
    return '<p class="tsh-iown is-new" role="status">' + IC.check + esc(line) + "</p>" +
      '<p class="tsh-ihave">You have ' + num(balance()) + " gold crowns left.</p>" +
      (placeable(it) ? placeBtn(it) : '<div class="tsh-iacts"><button type="button" class="tsh-buy" data-shop="back">Back to the shop</button></div>');
  }
  /* "Put it on" / "Place it": the customizer opens on the piece's own tab (a yard piece on the first empty spot) */
  function toPlace(){
    var it = SH && SH.it, eq = (S.shop && S.shop.equipped) || {}, pick = "home";
    if (it && (it.kind === "outfit" || it.kind === "costume")) pick = "timmy";
    else if (it && it.kind === "scene") pick = "scene";
    else if (it && it.kind === "yard") pick = (piece(it) || {}).wide ? "side" : ["front", "left", "right", "side", "corner"].filter(function(k){ return !eq["yard-" + k]; })[0] || "front";
    closeSheet();
    var P = W.shPlace; if (!P) return;
    P.setup({ sb: S.sb, visitor: S.visitor, shop: S.shop, profile: S.profile || undefined });
    if (DLG) close();
    P.open({ customize: true, pick: pick });
  }
  /* what each refusal means, in plain words; nothing changes after one */
  function refusal(d){
    var e = d && d.error;
    return e === "balance" ? "You need " + num((d.price || SH.it.price) - (d.balance || 0)) + " more gold crowns for this one."
      : e === "owned" ? "You already have this one. It’s in your things at Timmy’s place."
      : e === "today" ? "Timmy already had one of these today. One of each snack a day."
      : e === "not-today" ? "This one has left the shelf. The shop changes at midnight."
      : e === "rank" ? "This one is earned, never sold: it comes with a rank."
      : e === "unknown" ? "This one isn’t in the shop anymore."
      : e === "dup" ? "That didn’t go through. Try once more."
      : "Something about that didn’t look right, so nothing was bought.";
  }
  function confirm(){
    if (!SH || SH.busy || SH.done || !canBuy()) return;
    var s = SH, it = s.it; s.busy = true;
    var b = $('[data-shop="confirm"]', s.dlg); if (b) { b.disabled = true; b.textContent = "Buying…"; }
    S.sb.rpc("buy_item", { p_visitor: S.visitor, p_item: it.id, p_request: s.rid }).then(function(r){
      if (SH !== s) return;
      s.busy = false;
      if (!r || r.error || !r.data || typeof r.data !== "object") { drawSheet("That didn’t go through, and nothing was charged. Check your connection and try again."); return; }
      var d = r.data;
      if (!d.ok) { if (d.error === "dup") s.rid = rid(); drawSheet(refusal(d)); return; }
      bought(s, d);
    }, function(){ if (SH !== s) return; s.busy = false; drawSheet("That didn’t go through, and nothing was charged. Check your connection and try again."); });
  }
  function bought(s, d){
    var it = s.it, sh = S.shop;
    s.done = true; s.res = d;
    if (typeof d.balance === "number" && sh.wallet) { sh.wallet.balance = d.balance; if (!d.repeat) sh.wallet.spent = (sh.wallet.spent || 0) + (d.price || it.price); }
    if (consumable(it)) { if (it.kind === "snack" && (sh.snacks_today || (sh.snacks_today = [])).indexOf(it.id) < 0) sh.snacks_today.push(it.id); if (it.kind === "boost" && d.boost_until) sh.boost = { mult: it.boost_mult || 2, until: d.boost_until, src: "shop" }; }
    else { (sh.items || []).forEach(function(q){ if (q.id === it.id) q.owned = true; }); if (!(sh.inventory || []).some(function(x){ return x.id === it.id; })) (sh.inventory = sh.inventory || []).push({ id: it.id, at: new Date().toISOString(), how: "bought" }); it.owned = true; }
    if (!d.repeat) track("shop:buy:" + it.kind);
    var after = function(){
      if (SH === s) drawSheet();
      redraw();
      /* the shop as the server has it now, handed to the place */
      read().then(function(){
        if (W.shPlace) { W.shPlace.setup({ sb: S.sb, visitor: S.visitor, shop: S.shop }); W.shPlace.repaint(); }
        redraw();
      });
      if (it.kind === "snack") heal(it, d);
      if (S.onBought) try { S.onBought(d, { id: it.id, kind: it.kind }); } catch (e) {}
    };
    fx(s, rarityOf(it), after);
  }
  var EAT = { apple: "Crunch! An apple a day.", "cheese-cube": "Cheese! Good for my enamel.", floss: "Ahh, between every contact.", "fluoride-rinse": "Swish, don’t swallow. I feel stronger already." };
  function heal(it, d){
    var P = W.shPet; if (!P) return;
    try { P.refresh(true); } catch (e) {}
    setTimeout(function(){
      try { if (P.say) P.say((EAT[it.id] || "Thanks for the snack!") + " +" + (d.hp || it.hp || 0) + " HP.", "do-hop", 5000); } catch (e) {}
      if (W.shPlace) W.shPlace.repaint();
      redraw();
    }, 900);
  }
  /* buying: coins fly into the piece, it pops, and the rarity sets how big the party is (still under reduced motion) */
  var FX = { Common: { n: 10, rings: 0, t: 900, pal: ["#8A847E", "#C9C2BA", "#FFD23F"] }, Uncommon: { n: 16, rings: 1, t: 1050, pal: ["#1C6E52", "#7FD6AE", "#FFD23F", "#FFFFFF"] },
    Rare: { n: 24, rings: 2, t: 1250, word: "Rare!", flash: 1, pal: ["#1C5C88", "#7CC4F2", "#FFD23F", "#FFFFFF"] }, Epic: { n: 38, rings: 3, t: 1550, word: "Epic!", flash: 1, spin: 1, pal: ["#4E3492", "#B79BFF", "#FF8BD0", "#FFD23F", "#FFFFFF"] },
    Legendary: { n: 70, rings: 3, t: 2300, word: "Legendary!", flash: 2, spin: 1, charge: 750, pal: ["#F2C230", "#FFE27A", "#FF8B7B", "#7CC4F2", "#B79BFF", "#FFFFFF"] } };
  function fx(s, r, done){
    var box = $(".tsh-item", s.dlg), cs = $(".tsh-icase", s.dlg);
    if (reduced || !box || !cs) { done(); return; }
    var f = FX[r] || FX.Common, wait = f.charge || 0, html = "", i;
    for (i = 0; i < 5; i++) html += '<span class="tsh-fxcoin" style="--i:' + i + ";--sx:" + (60 + i * 26) + "px;--sy:" + (150 - (i % 2) * 30) + 'px">' + coin("") + "</span>";
    cs.insertAdjacentHTML("beforeend", '<div class="tsh-fx" aria-hidden="true">' + html + "</div>");
    if (wait) box.classList.add("is-charging");
    setTimeout(function(){
      if (SH !== s) { done(); return; }
      var layer = $(".tsh-fx", cs), far = Math.max(cs.clientWidth, cs.clientHeight) * (r === "Legendary" ? .95 : r === "Epic" ? .8 : .6), out = "";
      for (i = 0; i < f.rings; i++) out += '<i class="tsh-fxring" style="--t:' + i * 130 + 'ms"></i>';
      for (i = 0; i < f.n; i++) { var a = (i / f.n) * Math.PI * 2 + (i % 3) * .21, dist = far * (.45 + ((i * 37) % 11) / 20), st = i % 4 === 0 && f.rings > 1;
        out += '<i class="tsh-fxbit' + (st ? " is-star" : i % 3 === 1 ? " is-bar" : "") + '" style="--x:' + Math.round(Math.cos(a) * dist) + "px;--y:" + Math.round(Math.sin(a) * dist * .8) + "px;--r:" + ((i * 71) % 360 - 180) + "deg;--c:" + f.pal[i % f.pal.length] + ";--t:" + (i % 5) * 28 + "ms;--s:" + (7 + (i * 13) % 8) + 'px"></i>'; }
      if (layer) layer.innerHTML = (f.flash ? '<i class="tsh-fxflash"></i>' : "") + out + '<div class="tsh-iburst">' + (TP.burst ? TP.burst(r) : "") + "</div>" + (f.word ? '<b class="tsh-fxword">' + f.word + "</b>" : "");
      box.classList.remove("is-charging"); box.classList.add("is-bought"); if (f.spin) box.classList.add("is-spin"); if (f.flash > 1) box.classList.add("is-gold");
      setTimeout(done, f.t);
    }, 430 + wait);
  }

  var api = W.shShop = { setup: setup, mount: mount, open: open, close: close, balance: balance, read: read, ready: ready,
    /* for the tests: what the shop has now */
    state: function(){ var sh = S.shop || {}; return { balance: balance(), items: (sh.items || []).length, owned: (sh.inventory || []).length, sheet: SH ? { item: SH.it.id, rid: SH.rid, done: SH.done, busy: SH.busy } : null, open: !!DLG, mounted: S.roots.length }; } };
})();
