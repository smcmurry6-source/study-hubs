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
   names from the catalog are always drawn as text. Feature events: shop:open, shop:buy:<kind> (never the item),
   shop:box:<rarity> (a mystery box opened: the rarity it gave, never the piece).

   The mystery box (migration_v99, the idea board's "Drip for Timmy"): a piece of the everyday shop you don't own yet,
   at random, for crowns; three a Central day. get_mystery_box says its price, the day's limit and the odds for you
   (asked when the shop opens and after each box); open_mystery_box rolls on the server, idempotent on the request id the
   way buy_item is. Before the migration (the functions missing) the box isn't drawn.
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
  var SPOTS = ["pirate", "astronaut", "detective", "chef", "captain-enamel", "wizard", "robot", "firefighter", "shark", "dragon"];
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
  /* the mystery box's rules and odds for you (get_mystery_box); a database without the function hides the box for good */
  function missing(r){ var e = r && r.error; return !!e && (e.code === "PGRST202" || e.code === "42883" || r.status === 404 || /could not find the function|does not exist/i.test(e.message || "")); }
  function boxRead(){
    if (!S.sb || !S.visitor || S.boxGone) return Promise.resolve(S.box);
    return S.sb.rpc("get_mystery_box", { p_visitor: S.visitor }).then(function(r){
      if (missing(r)) { S.boxGone = true; S.box = null; }
      else if (r && !r.error && r.data && typeof r.data.price === "number" && Array.isArray(r.data.odds)) S.box = r.data;
      return S.box;
    }, function(){ return S.box; });
  }

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
  /* a year-round collection's piece (sets.mjs COLLECTIONS: in the everyday rotation, never limited) */
  function collOf(it){ var k = TP.collOf ? TP.collOf(it.id) : ""; return k && TP.SETS && TP.SETS.collections ? TP.SETS.collections.filter(function(q){ return q.k === k; })[0] || null : null; }
  /* "· Halloween set" or "· Dino valley collection" after a piece's kind */
  function setTag(it){ var se = seasonOf(it), co = se ? null : collOf(it); return se ? " · " + se.n + " set" : co ? " · " + co.n + " collection" : ""; }
  /* a set's or a collection's piece stands in its own scene; anything else on the hill */
  function sceneFor(it){ var se = seasonOf(it), co = se ? null : collOf(it), k = se ? se.k : co ? co.k : "", sc = k ? TP.SCENES.filter(function(q){ return q.set === k; })[0] : null; return sc ? sc.k : "hill"; }
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
  /* The card's frame from the shop's art, the storefront's two layers and the mystery box are drawn in the page, and
     they move all the time, scrolling included (Sam, 2026-11-22: "I also hate that animations pause"). Until then each
     was a still with a moving image over it that moved for 6 s at a time and hid while the shop scrolled (2026-11-14):
     an image that moves inside is drawn again whole on every frame, while a drawing in the page draws again only what
     moves (on a slowed phone the shelves' moving frames took about half the main thread as images and a quarter drawn
     in the page, and almost nothing on the raster threads). Their rules are the shop art's own (SA.CSS, put in the page
     once: every one of them is a ts- class). A drawing off the screen stops (watch(), .is-away in shop.css), which nobody
     sees. With reduced motion they are stills, as before. */
  var FRAMES = {}, ARTCSS = false;
  function artCss(){
    if (ARTCSS) return; ARTCSS = true;
    var st = D.createElement("style"); st.setAttribute("data-shop-art", ""); st.textContent = SA.CSS; D.head.appendChild(st);
  }
  /* an image that moves inside: the item sheet's mystery box, the one piece on its screen */
  function moving(s, re){ return s.replace(/(<svg[^>]*>)/, "$1<style>" + SA.CSS.split("\n").filter(function(l){ return re.test(l); }).join("\n") + "</style>"); }
  function live(s, cls){ artCss(); return '<span class="tsh-inl' + (cls ? " " + cls : "") + '" aria-hidden="true">' + s + "</span>"; }
  function frame(r){
    if (!FRAMES[r]) { var s = SA.frame(r); FRAMES[r] = reduced || !/ts-r-/.test(s) ? img(s, "", "tsh-rframe") : live(s, "tsh-rframe"); }
    return FRAMES[r];
  }
  function store(layer){
    var key = "store-" + layer;
    if (!FRAMES[key]) { var s = SA.store(layer); FRAMES[key] = reduced || !/ts-s-/.test(s) ? img(s, "", "tsh-frontart") : live(s, "tsh-frontart"); }
    return FRAMES[key];
  }
  /* a drawing in the page moves while it is on the screen or close to it, and stops off it (each root has its own
     watcher: the shop can be drawn in a hub's More and in its own window) */
  function watch(root){
    if (!W.IntersectionObserver) return;
    if (root.__tshIO) root.__tshIO.disconnect();
    var io = root.__tshIO = new IntersectionObserver(function(es){
      es.forEach(function(e){ if (e.target.classList.contains("is-away") === e.isIntersecting) e.target.classList.toggle("is-away", !e.isIntersecting); });
    }, { rootMargin: "160px 0px" });
    $$(".tsh-inl", root).forEach(function(x){ io.observe(x); });
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
  /* how crowns are earned: studying pays 5 for 10 XP, and every prize (migration_v68) pays as many crowns as XP. The
     amounts are the server's (the wallet's pays, sh_prizes()), or the page's copy of them (shGame.prizes) */
  function earnList(w){
    var G = window.shGame, P = w.pays || (G && G.prizes) || null;
    var li = function(n, what){ return "<li><b>" + n + "</b> " + what + "</li>"; };
    var html = li("5", "for every 10 XP you earn studying (a boost’s extra XP doesn’t count)") + li("100", "for every hour you spend in a hub");
    if (P) {
      var top = function(list){ return list && list.length ? num(list[list.length - 1][1]) : ""; };
      html += li("+ the XP", "on top for every bonus: a bonus pays as many crowns as XP") +
        li(num(P.ring), "a question, up to " + num(P.ring * 50) + ", for filling your daily ring") +
        li(num(P.boss), "split by your share of the damage, for bringing down a Plaque Boss") +
        li(num(P.notes), "for reading a lecture’s notes to the end (scrolling straight down doesn’t count)") +
        li(num(P.visit), "once a day for visiting a classmate’s Timmy") +
        li(num(P.game), "for your first arcade game of the day, " + num(P.pb) + " for a personal best and " + num(P.top) + " for a new high score") +
        li(num(P.trophy), "for each new trophy, and " + num((P.medal || [])[0]) + " to " + num((P.medal || []).slice(-1)[0]) + " for a mastery medal") +
        li((P.streak ? num(P.streak[0][1]) + " to " + top(P.streak) : ""), "for study streaks of 3 to 100 days") +
        li((P.row ? num(P.row[0][1]) + " to " + top(P.row) : ""), "for 10, 25 and 50 right in a row") +
        li(num(P.report), "when a report you sent gets fixed") +
        li(num(P.name), "for picking your leaderboard name") +
        li(num(P.nuke), "for launching a nuke, and " + num(P.alltime) + " for breaking the all-time streak record");
    }
    return html + li("25", "for each trophy you hold, 50 for each mastery medal and 20 for each rank-up");
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
        '<div class="tsh-earn" hidden><ul>' + earnList(w) + "</ul>" +
        '<p class="tsh-note">So far: ' + num(w.earned) + " earned" + (w.spent ? ", " + num(w.spent) + " spent" : "") + ". Spending never lowers your XP or your rank.</p></div></div>";
    /* the showcase: the rarest piece on sale you don't own yet (the dearest among those), large, on its stand */
    var star = showcase(items);
    if (star) {
      var r = rarityOf(star), ws = words(star), se = seasonOf(star);
      html += '<section class="tsh-show r-' + r + '" style="' + rarVars(r) + '"><div class="tsh-showcase" aria-hidden="true">' + rays() +
        '<span class="tsh-showpiece k-' + star.kind + '">' + img(pic(star), "") + '</span><span class="tsh-showstand">' + img(SA.stand(r), "") + "</span>" +
        '<i class="tsh-showtw a"></i><i class="tsh-showtw b"></i><i class="tsh-showtw c"></i></div>' +
        '<div class="tsh-showinfo"><h' + lvl + ' class="tsh-showkick">Today’s showcase</h' + lvl + '><p class="tsh-showname">' + esc(ws.name) + "</p>" +
        '<p class="tsh-itags">' + rarTag(r) + "<span>" + esc(ws.kind) + esc(setTag(star)) + "</span></p>" + (ws.note ? '<p class="tsh-showdesc">' + esc(ws.note) + ".</p>" : "") +
        '<div class="tsh-showbuy"><span class="tsh-big">' + coin() + '<b class="num">' + num(star.price) + '</b></span><button type="button" class="tsh-buy" data-shop="showcase" data-item="' + esc(star.id) + '" data-shelf="' + esc(star.shelf) + '">Take a closer look</button></div>' +
        '<p class="tsh-showwhen">' + IC.clock + esc(whenOf(star.shelf)) + "</p></div></section>";
    }
    if (S.box) html += boxSection(lvl);
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
    if (always.length) html += shelf("always", lvl, "Always here", "Never sells out", IC.check, "Snacks put health back on Timmy’s bar, one of each a day. A boost doubles your XP from the moment you buy it; bought while double XP is already on, it adds its time on the end.", cards(always, "always"), always.length);
    html += '<p class="tsh-note tsh-storefoot">Rank sets are never on a shelf: you earn them. What you buy is yours on every device you link.</p></div>';
    root.innerHTML = html;
    wire(root);
    watch(root);
  }
  function wire(root){
    $$('[data-shop="item"], [data-shop="showcase"]', root).forEach(function(b){ b.addEventListener("click", function(){ var it = find(b.getAttribute("data-item")); if (it) sheet(it); }); });
    var bb = $('[data-shop="box"]', root); if (bb) bb.addEventListener("click", boxSheet);
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
      if (S.shop && S.shop.day && central().day && String(S.shop.day).slice(0, 10) !== central().day) { Promise.all([read(), boxRead()]).then(redraw); return; }
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
      var was = JSON.stringify([S.shop, S.box]);
      Promise.all([read(), boxRead()]).then(function(){ return packs((S.shop.items || []).map(function(it){ return it.id; })); }).then(function(){ if (el.isConnected && JSON.stringify([S.shop, S.box]) !== was) page(el, o); });
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
    mount($(".tsh-dlgbody", dlg), { level: 3, title: "tshT" });
    return api;
  }
  function close(){ if (DLG) { try { DLG.dlg.close(); } catch (e) {} } }

  /* ---------- an item's sheet: the piece large, what it is, its price against your balance, and Buy ---------- */
  var SH = null;
  function rid(){ var s = ""; try { var a = new Uint8Array(12); crypto.getRandomValues(a); for (var i = 0; i < a.length; i++) s += (a[i] % 36).toString(36); } catch (e) { s = Math.random().toString(36).slice(2, 14); } return "shop-" + Date.now().toString(36) + "-" + s; }
  function sheet(it, box){
    if (SH) closeSheet();
    var dlg = D.createElement("dialog"); dlg.className = "tsh-sheet"; dlg.setAttribute("aria-labelledby", "tshI");
    D.body.appendChild(dlg);
    SH = { dlg: dlg, it: it, box: !!box, rid: rid(), busy: false, done: false, back: D.activeElement };
    dlg.addEventListener("close", function(){ var s = SH; if (s && s.dlg === dlg) SH = null; if (dlg.parentNode) dlg.parentNode.removeChild(dlg); try { if (s && s.back && s.back.isConnected) s.back.focus(); } catch (e) {} });
    dlg.addEventListener("click", function(e){ if (e.target === dlg) closeSheet(); });
    drawSheet();
    try { dlg.showModal(); } catch (e) { dlg.setAttribute("open", ""); }
    /* opening a dialog scrolls its focused button into view: on a phone, Buy is stuck to the sheet's foot, so the sheet
       would open scrolled past the piece */
    var ib = $(".tsh-item", dlg); if (ib) ib.scrollTop = 0;
  }
  function closeSheet(){ if (SH) { try { SH.dlg.close(); } catch (e) {} } }
  /* a boost bought while double XP is on (a medal's 24 hours or another boost) waits its turn: the server adds its time on the
     end (migration_v62), so the sheet says when it will start and stop */
  function boostWait(it){
    var g = W.shGame && W.shGame.boost ? W.shGame.boost() : null, b = S.shop && S.shop.boost, now = Date.now(), end = 0;
    [g, b].forEach(function(x){ var t = x && x.until ? new Date(x.until).getTime() : 0; if (t > end) end = t; });
    if (!(end > now)) return "";
    return "Double XP is already on until " + clock(end) + ", so this one starts then and runs to " + clock(end + (it.boost_minutes || 60) * 60000) + ".";
  }
  function clock(ms){
    var d = new Date(ms), t = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }), n = new Date();
    if (d.toDateString() === n.toDateString()) return t;
    n.setDate(n.getDate() + 1);
    return (d.toDateString() === n.toDateString() ? "tomorrow at " : d.toLocaleDateString([], { weekday: "long" }) + " at ") + t;
  }
  function drawSheet(msg){
    if (!SH) return;
    if (SH.box) { drawBox(msg); return; }
    var it = SH.it, r = rarityOf(it), w = words(it), se = seasonOf(it), st = stateOf(it), bal = balance(), d = does(it), done = SH.done;
    var kind = w.kind + setTag(it) + (it.shelf === "throwback" ? " · Back for today" : SH.fromBox ? " · From the mystery box" : "");
    var buy;
    if (done) buy = doneHtml(it);
    else if (st.k === "owned") buy = '<p class="tsh-iown">' + IC.check + (it.gift ? "Yours: everyone has this set." : "Yours. It’s in your things at Timmy’s place for good.") + "</p>" + placeBtn(it);
    else {
      var after = bal === null ? null : bal - it.price, why = st.k === "today" ? "Timmy already had one of these today. One of each snack a day." : st.k === "full" ? "He’s full: Timmy is at 100 HP. Save it for a day he needs it." : it.kind === "boost" ? boostWait(it) : "";
      buy = '<div class="tsh-iprice"><span class="tsh-big">' + coin() + '<b class="num">' + num(it.price) + '</b><span class="sr"> gold crowns</span></span>' +
        '<span class="tsh-ihave">' + (bal === null ? "" : "You have " + num(bal) + (after >= 0 ? ". After: " + num(after) + "." : ".")) + "</span>" +
        (st.k === "short" ? '<span class="tsh-ibar" aria-hidden="true"><i style="width:' + Math.max(3, Math.min(100, Math.round(bal / it.price * 100))) + '%"></i></span><span class="tsh-ishort">' + esc(st.t) + ". Keep studying: every 10 XP is one more.</span>" : "") + "</div>" +
        '<p class="tsh-msg' + (!msg && why && it.kind === "boost" ? " is-note" : "") + '" role="status" aria-live="polite">' + esc(msg || why) + "</p>" +
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
    var ab = $('[data-shop="box-again"]', SH.dlg); if (ab) ab.addEventListener("click", boxAgain);
    var f = $('[data-shop="confirm"]:not([disabled])', SH.dlg) || $('[data-shop="place"], [data-shop="wear"]', SH.dlg) || $('[data-shop="close-item"]', SH.dlg);
    try { f.focus({ preventScroll: true }); } catch (e) {}
  }
  function placeable(it){ return ["outfit", "costume", "home", "scene", "yard", "upgrade"].indexOf(it.kind) >= 0 && W.shPlace && S.shop; }
  function placeBtn(it){ return placeable(it) ? '<div class="tsh-iacts"><button type="button" class="tsh-buy" data-shop="' + (it.kind === "outfit" || it.kind === "costume" ? "wear" : "place") + '">' + (it.kind === "outfit" || it.kind === "costume" ? "Put it on" : "Place it") + '</button><button type="button" class="tsh-ghost" data-shop="back">Back to the shop</button></div>' : ""; }
  function doneHtml(it){
    var R = SH.res || {}, line;
    if (it.kind === "snack") line = "Timmy ate it. +" + (R.hp || it.hp || 0) + " HP.";
    else if (it.kind === "boost") line = "Double XP is on" + (R.boost_until ? " until " + new Date(R.boost_until).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "") + ".";
    else if (SH.fromBox) line = "It’s yours! New out of the box, and in your things at Timmy’s place for good.";
    else line = "It’s yours! It stays in your things at Timmy’s place for good.";
    var won = SH.won && SH.won.length ? SH.won : null, B = S.box, again = SH.fromBox && B && B.left_today > 0 && B.left > 0 && !(balance() < B.price);
    return '<p class="tsh-iown is-new" role="status">' + IC.check + esc(line) + "</p>" +
      (won ? '<p class="tsh-icoll" role="status"><b>' + esc(won.join(" and ")) + (won.length > 1 ? " collections" : "") + " finished!</b> Bonus: +" + num(SH.wonXp) + " XP and " + num(SH.wonXp) + " crowns</p>" : "") +
      '<p class="tsh-ihave">You have ' + num(balance()) + " gold crowns left.</p>" +
      (placeable(it) ? placeBtn(it) : '<div class="tsh-iacts"><button type="button" class="tsh-buy" data-shop="back">Back to the shop</button></div>') +
      (again ? '<button type="button" class="tsh-ghost tsh-again" data-shop="box-again">Open another box · ' + B.left_today + " left today</button>" : "");
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
        /* after the read, so the balance the bonus leaves is the last word */
        if (!consumable(it) && !d.repeat && inColl(it)) collCheck(s);
      });
      if (it.kind === "snack") heal(it, d);
      if (S.onBought) try { S.onBought(d, { id: it.id, kind: it.kind }); } catch (e) {}
    };
    fx(s, rarityOf(it), after);
  }
  /* a piece of a collection (a season's set, a year-round collection, a rare costume) may finish it: the place asks the
     server, which pays 1,000 XP and 1,000 crowns once (migration_v75), and the sheet says so */
  function inColl(it){ var k = TP && TP.setOf ? TP.setOf(it.id) : ""; return it.kind === "costume" || !!it.season || (!!k && k !== "rank"); }
  function collCheck(s){
    var P = W.shPlace; if (!P || !P.claimCollections) return;
    P.claimCollections({ sb: S.sb, visitor: S.visitor }).then(function(d){
      if (!d || !(d.xp > 0) || !Array.isArray(d.won) || !d.won.length) return;
      s.won = d.won.map(function(k){ return (P.collName && P.collName(k)) || k; }); s.wonXp = d.xp;
      if (typeof d.crowns === "number" && S.shop && S.shop.wallet) S.shop.wallet.balance = d.crowns;
      track("shop:collection");
      if (SH === s) drawSheet();
      redraw();
    });
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
  /* ---------- the mystery box: on the page under the showcase, its sheet with the odds, and the opening ---------- */
  var BOXRE = /ts-b-|ts-box|@keyframes ts-r-tw|prefers-reduced/;
  function boxArt(open, cls, still){ var s = SA.box(!!open); return img(reduced || still ? s : moving(s, BOXRE), "", cls); }
  function pct(c){ var p = (+c || 0) * 100; return (p >= 10 || p === 0 ? Math.round(p) : Math.round(p * 10) / 10) + "%"; }
  function boxState(){
    var B = S.box || {}, bal = balance();
    if (!(B.left > 0)) return { k: "empty", t: "You have every piece it could give" };
    if (!(B.left_today > 0)) return { k: "today", t: "That’s today’s " + (B.per_day || 3) + ". More at midnight" };
    if (bal !== null && B.price > bal) return { k: "short", t: num(B.price - bal) + " more to go" };
    return { k: "buy", t: (B.left_today) + " of " + (B.per_day || 3) + " left today" };
  }
  function boxSection(lvl){
    var B = S.box, st = boxState();
    var odds = (B.odds || []).map(function(o){ var r = cap(o.rarity); return '<li class="' + (o.chance ? "" : "is-none") + '">' + rarTag(r) + "<span>" + (o.chance ? pct(o.chance) : "none left") + "</span></li>"; }).join("");
    return '<section class="tsh-mbox"><div class="tsh-mbart" aria-hidden="true">' + (reduced ? boxArt(false, "", true) : live(SA.box(false), "")) + "</div>" +
      '<div class="tsh-mbinfo"><h' + lvl + ' class="tsh-tagsign">Mystery box</h' + lvl + ">" +
        '<p class="tsh-mbdesc">A piece from the everyday shop you don’t have yet, at random. Never a seasonal piece, a rare costume or a rank piece.</p>' +
        '<ul class="tsh-mbodds" aria-label="The odds for you">' + odds + "</ul>" +
        '<div class="tsh-mbbuy"><span class="tsh-big">' + coin() + '<b class="num">' + num(B.price) + '</b><span class="sr"> gold crowns</span></span><button type="button" class="tsh-buy" data-shop="box">See the odds</button>' +
        '<span class="tsh-mbleft s-' + st.k + '">' + (st.k === "empty" ? IC.check : IC.clock) + esc(st.t) + "</span></div></div></section>";
  }
  function boxSheet(){ if (S.box) sheet(null, true); }
  function drawBox(msg){
    var B = S.box || {}, st = boxState(), bal = balance(), after = bal === null ? null : bal - B.price, busy = SH.busy;
    var rows = (B.odds || []).map(function(o){ var r = cap(o.rarity); return '<tr class="' + (o.chance ? "" : "is-none") + '"><td>' + rarTag(r) + "</td><td>" + (o.chance ? pct(o.chance) : "–") + "</td><td>" + (o.of ? num(o.left) + " of " + num(o.of) : "–") + "</td></tr>"; }).join("");
    var buy;
    if (st.k === "empty") buy = '<p class="tsh-iown">' + IC.check + "You already have every piece the box could give: all " + num(B.of) + " of them. Nothing to open!</p>" +
      '<div class="tsh-iacts"><button type="button" class="tsh-buy" data-shop="back">Back to the shop</button></div>';
    else buy = '<div class="tsh-iprice"><span class="tsh-big">' + coin() + '<b class="num">' + num(B.price) + '</b><span class="sr"> gold crowns</span></span>' +
        '<span class="tsh-ihave">' + (bal === null ? "" : "You have " + num(bal) + (after >= 0 ? ". After: " + num(after) + "." : ".")) + "</span>" +
        (st.k === "short" ? '<span class="tsh-ibar" aria-hidden="true"><i style="width:' + Math.max(3, Math.min(100, Math.round(bal / B.price * 100))) + '%"></i></span><span class="tsh-ishort">' + esc(st.t) + ". Keep studying: every 10 XP is one more.</span>" : "") + "</div>" +
      '<p class="tsh-msg' + (!msg && st.k === "today" ? " is-note" : "") + '" role="status" aria-live="polite">' + esc(msg || (st.k === "today" ? "That’s today’s " + (B.per_day || 3) + " boxes. The box is back at midnight (Central time)." : "")) + "</p>" +
      '<div class="tsh-iacts"><button type="button" class="tsh-buy" data-shop="box-open"' + (st.k === "buy" && canBuy() && !busy ? "" : " disabled") + ">" + (busy ? "Opening…" : "Open for " + num(B.price)) + '</button><button type="button" class="tsh-ghost" data-shop="cancel">Not now</button></div>';
    SH.dlg.className = "tsh-sheet";
    SH.dlg.innerHTML = '<div class="tsh-item tsh-boxsheet r-Epic" style="' + rarVars("Epic") + '"><button type="button" class="tsh-x tsh-ix" data-shop="close-item" aria-label="Back to the shop">' + IC.x + "</button>" +
      '<div class="tsh-icase">' + rays() + '<i class="tsh-icorner a"></i><i class="tsh-icorner b"></i><div class="tsh-ipiece k-box' + (busy && !reduced ? " is-shake" : "") + '">' + boxArt(false, "") + "</div>" +
        '<span class="tsh-ido">' + (B.left_today > 0 ? B.left_today + " of " + (B.per_day || 3) + " left today" : "Back at midnight") + "</span></div>" +
      '<div class="tsh-iinfo"><p class="tsh-ikind">From the everyday shop</p><h2 id="tshI">Mystery box</h2>' +
        '<p class="tsh-idesc">Inside is one piece you don’t have yet: an outfit, a home, a scene, a yard piece or something for the house. Never a seasonal piece, a rare costume or a rank piece, and never one you already own. Up to ' + (B.per_day || 3) + " a day.</p>" +
        '<table class="tsh-odds"><caption>The odds for you</caption><thead><tr><th scope="col">Rarity</th><th scope="col">Chance</th><th scope="col">Left for you</th></tr></thead><tbody>' + rows + "</tbody></table>" +
        '<p class="tsh-note tsh-oddsnote">Everyone gets the same odds. When you own every piece of a rarity, its chance is shared out over the rest.</p>' +
        '<div class="tsh-ibuy">' + buy + "</div></div></div>";
    $$('[data-shop="close-item"], [data-shop="cancel"], [data-shop="back"]', SH.dlg).forEach(function(b){ b.addEventListener("click", closeSheet); });
    var ob = $('[data-shop="box-open"]', SH.dlg); if (ob) ob.addEventListener("click", openBox);
    var f = $('[data-shop="box-open"]:not([disabled])', SH.dlg) || $('[data-shop="cancel"], [data-shop="back"]', SH.dlg) || $('[data-shop="close-item"]', SH.dlg);
    try { f.focus({ preventScroll: true }); } catch (e) {}
  }
  function boxRefusal(d){
    var e = d && d.error, B = S.box || {};
    return e === "today" ? "That’s today’s " + (d.per_day || B.per_day || 3) + " boxes. The box is back at midnight (Central time)."
      : e === "empty" ? "You have every piece the box could give, so nothing was charged."
      : e === "balance" ? "You need " + num((d.price || B.price) - (d.balance || 0)) + " more gold crowns for a box."
      : e === "dup" ? "That didn’t go through. Try once more."
      : "Something about that didn’t look right, so nothing was charged.";
  }
  /* what a refusal tells us about the box now */
  function boxNoted(d){
    var B = S.box; if (!B || !d) return;
    if (d.error === "today") B.left_today = 0;
    if (d.error === "empty") B.left = 0;
    if (d.error === "balance" && typeof d.balance === "number" && S.shop && S.shop.wallet) S.shop.wallet.balance = d.balance;
  }
  var FAIL = "That didn’t go through, and nothing was charged. Check your connection and try again.";
  /* Open: the box shakes while the server rolls (at least most of a second, so it reads as a shake), then its lid flies
     off, and the piece comes out with its rarity's party (fx) */
  function openBox(){
    if (!SH || !SH.box || SH.busy || SH.done || !canBuy() || boxState().k !== "buy") return;
    var s = SH, t0 = Date.now(); s.busy = true;
    var b = $('[data-shop="box-open"]', s.dlg); if (b) { b.disabled = true; b.textContent = "Opening…"; }
    var pc = $(".tsh-ipiece", s.dlg); if (pc && !reduced) pc.classList.add("is-shake");
    /* a phone may have scrolled down to the odds: back up to the box, so the opening is seen */
    var ib = $(".tsh-item", s.dlg); if (ib && ib.scrollTop) try { ib.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" }); } catch (e) { ib.scrollTop = 0; }
    var land = function(r){
      var d = r && !r.error && r.data && typeof r.data === "object" ? r.data : null;
      if (SH !== s) { if (d && d.ok) { Promise.all([read(), boxRead()]).then(redraw); } return; }
      s.busy = false;
      if (!d) { drawSheet(FAIL); return; }
      if (!d.ok) { if (d.error === "dup") s.rid = rid(); boxNoted(d); drawSheet(boxRefusal(d)); redraw(); return; }
      boxWon(s, d);
    };
    S.sb.rpc("open_mystery_box", { p_visitor: S.visitor, p_request: s.rid }).then(function(r){
      setTimeout(function(){ land(r); }, reduced ? 0 : Math.max(0, 800 - (Date.now() - t0)));
    }, function(){ land(null); });
  }
  function boxWon(s, d){
    var sh = S.shop, B = S.box, it = (sh.items || []).filter(function(q){ return q.id === d.item; })[0];
    var won = { id: d.item, name: d.name || (it && it.name) || d.item, kind: d.kind || (it && it.kind), rarity: d.rarity || (it && it.rarity), price: it ? it.price : 0, shelf: "box", owned: true };
    if (typeof d.balance === "number" && sh.wallet) { sh.wallet.balance = d.balance; if (!d.repeat) sh.wallet.spent = (sh.wallet.spent || 0) + (d.price || (B && B.price) || 0); }
    (sh.items || []).forEach(function(q){ if (q.id === d.item) q.owned = true; });
    if (!(sh.inventory || []).some(function(x){ return x.id === d.item; })) (sh.inventory = sh.inventory || []).push({ id: d.item, at: new Date().toISOString(), how: "bought" });
    if (B) { ["today", "left_today", "left"].forEach(function(k){ if (typeof d[k] === "number") B[k] = d[k]; }); if (typeof d.balance === "number") B.balance = d.balance; }
    if (!d.repeat) track("shop:box:" + String(won.rarity || "common").toLowerCase());
    var after = function(){
      redraw();
      Promise.all([read(), boxRead()]).then(function(){
        if (W.shPlace) { W.shPlace.setup({ sb: S.sb, visitor: S.visitor, shop: S.shop }); W.shPlace.repaint(); }
        if (SH === s) drawSheet();
        redraw();
        if (!d.repeat && inColl(won)) collCheck(s);
      });
      if (S.onBought) try { S.onBought(d, { id: won.id, kind: won.kind, box: true }); } catch (e) {}
    };
    var reveal = function(){
      if (SH !== s) { after(); return; }
      s.box = false; s.fromBox = true; s.it = won; s.res = d; s.done = true;
      drawSheet();
      fx(s, rarityOf(won), after, true);
    };
    packs([won.id]).then(function(){
      if (SH !== s || reduced) { reveal(); return; }
      var pc = $(".tsh-ipiece", s.dlg);
      if (pc) { pc.classList.remove("is-shake"); pc.classList.add("is-open"); pc.innerHTML = boxArt(true, ""); }
      setTimeout(reveal, 720);
    });
  }
  /* "Open another box": the same sheet, a new request id */
  function boxAgain(){
    if (!SH || SH.busy) return;
    SH.box = true; SH.done = false; SH.fromBox = false; SH.it = null; SH.res = null; SH.won = null; SH.rid = rid();
    drawSheet();
  }
  /* buying: coins fly into the piece, it pops, and the rarity sets how big the party is (still under reduced motion) */
  var FX = { Common: { n: 10, rings: 0, t: 900, pal: ["#8A847E", "#C9C2BA", "#FFD23F"] }, Uncommon: { n: 16, rings: 1, t: 1050, pal: ["#1C6E52", "#7FD6AE", "#FFD23F", "#FFFFFF"] },
    Rare: { n: 24, rings: 2, t: 1250, word: "Rare!", flash: 1, pal: ["#1C5C88", "#7CC4F2", "#FFD23F", "#FFFFFF"] }, Epic: { n: 38, rings: 3, t: 1550, word: "Epic!", flash: 1, spin: 1, pal: ["#4E3492", "#B79BFF", "#FF8BD0", "#FFD23F", "#FFFFFF"] },
    Legendary: { n: 70, rings: 3, t: 2300, word: "Legendary!", flash: 2, spin: 1, charge: 750, pal: ["#F2C230", "#FFE27A", "#FF8B7B", "#7CC4F2", "#B79BFF", "#FFFFFF"] } };
  function fx(s, r, done, quick){
    var box = $(".tsh-item", s.dlg), cs = $(".tsh-icase", s.dlg);
    if (reduced || !box || !cs) { done(); return; }
    var f = FX[r] || FX.Common, wait = f.charge || 0, html = "", i;
    /* out of the mystery box: no coins fly in (they went into the box), the party starts at once */
    for (i = 0; i < (quick ? 0 : 5); i++) html += '<span class="tsh-fxcoin" style="--i:' + i + ";--sx:" + (60 + i * 26) + "px;--sy:" + (150 - (i % 2) * 30) + 'px">' + coin("") + "</span>";
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
    }, (quick ? 60 : 430) + wait);
  }

  var api = W.shShop = { setup: setup, mount: mount, open: open, close: close, balance: balance, read: read, ready: ready,
    /* for the tests: what the shop has now */
    state: function(){ var sh = S.shop || {}; return { balance: balance(), items: (sh.items || []).length, owned: (sh.inventory || []).length, sheet: SH ? { item: SH.it ? SH.it.id : null, box: !!SH.box, rid: SH.rid, done: SH.done, busy: SH.busy } : null, open: !!DLG, mounted: S.roots.length, box: S.box }; } };
})();
