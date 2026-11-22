/* ============ THE HUB ENGINE, part: Timmy (widget/hub-timmy.js) ============
   One of the engine's four files (widget/hub.js is the core and says how they fit together). This one holds what the
   engine asks of Timmy Tooth (widget/pet.js, window.shPet): a line for him to say, his HP, his cheer or flinch on the
   bar at each answer, and the pet-adopt badges from the rank profile (so linked devices count his health from the same
   day); and Timmy's place, the page in More
   (widget/place.js draws it, fetched the first time that page is opened). Timmy Time, the podcast's page, is in the
   core (More).
   And Ask Timmy (vault/tasks/2026-11-12-redesign-ask-timmy.md, part 2): the chat is widget/ask.js (window.shAsk), loaded
   with the shared widget; this part mounts it with what it needs from the engine (where the student is in the notes, the
   links, the saved state for "What should I study tonight?", whether the hub is archived) and opens it from a question
   card's "Ask Timmy" (widget/hub-bank.js puts the button there once the question is answered).

   And Timmy's shop (vault/tasks/2026-11-06-redesign-timmy-shop.md, session 2): its page in More (widget/shop.js draws
   it, fetched the first time that page is opened), the balance on the Shop tile, and the rare costume of the day: on
   about one day in twelve with no holiday or fall weeks a costume turns up at the shop, Timmy says so once, and it waits
   on the shop's Spotted shelf (record_costume_sighting). All of it only once the database has the game layer.

   The names it takes from the core are listed first; what the other files call from here is put on HX at the end.
   ============ */
(window.SH_HUB_PARTS = window.SH_HUB_PARTS || {}).timmy = function(HX){
  "use strict";
  /* from the core (widget/hub.js), under the names they have there */
  var reduced = HX.reduced, $ = HX.$, C = HX.C, HUB = HX.HUB, WIDGET = HX.WIDGET, STATE = HX.STATE, ls = HX.ls, docEl = HX.docEl,
    loadScript = HX.loadScript, whenWidget = HX.whenWidget;

  /* ---------- Timmy (widget/pet.js, window.shPet): what the engine asks of him. Everyone has Timmy on the redesign's
     pages (vault/tasks/2026-11-12-redesign-ask-timmy.md, part 4): widget/v3.js loads him for everyone, with no adoption ---------- */
  function say(t, move){ try { if (window.shPet && window.shPet.say) window.shPet.say(t, move, 5000); } catch (e) {} }
  function petHp(){ try { return window.shPet && window.shPet.hp ? window.shPet.hp() : null; } catch (e) { return null; } }
  /* he cheers a right answer and flinches at a miss */
  var reactT = 0;
  function timmyReact(right){
    var tim = $(".shpet-home .shpet-btn");
    if (tim && !reduced) { clearTimeout(reactT); tim.classList.remove("hx-cheer", "hx-flinch"); void tim.offsetWidth; tim.classList.add(right ? "hx-cheer" : "hx-flinch"); reactT = setTimeout(function(){ tim.classList.remove("hx-cheer", "hx-flinch"); }, 1500); }
  }
  /* the day he was first met on another device comes in the rank profile as a pet-adopt badge: the earliest day wins */
  function petFromBadges(b){
    if (!b.some(function(x){ return String(x).split(":")[0] === "pet-adopt"; })) return;
    whenWidget("shPet", function(P){ if (P && P.syncBadges) P.syncBadges(b); });
  }

  /* ---------- Timmy's place (redesign phase 4, part C): its page in More. The card, and the full view from it, are
     widget/place.js (window.shPlace), with the kit of drawings it fetches; none of it loads with the page. What Timmy
     owns and where it stands come in the page's bootstrap once the database has the game layer (migration_v54);
     without it the place shows the defaults with your rank and medals. Everyone has Timmy, so everyone has a place. ---------- */
  function morePlace(body){
    var shut = function(){ if (body.isConnected) body.innerHTML = '<p class="note">Timmy’s place couldn’t be opened just now. Try again in a moment.</p>'; };
    loadScript(WIDGET + "place.js").then(function(){
      whenWidget("shSupabase", function(sb){
        var go = function(){
          var P = window.shPlace, boot = window.shBootstrap;
          if (!body.isConnected || HX.view !== "more") return;
          if (!P) { shut(); return; }
          var draw = function(d){
            if (!body.isConnected) return;
            P.setup({ sb: sb, visitor: ls("sh_visitor_id"), shop: d && d.shop, profile: HX.RANK.p });
            body.innerHTML = '<div class="place-card"></div><p class="note">Tap the picture to step in. Timmy hops over to what you tap, and his health shows in how he moves.</p>' +
              (d && d.shop ? '<p><button type="button" class="btn" data-place-coll>Your collections</button></p>' : "") +
              '<section class="hx-now" aria-labelledby="hxNowH" hidden></section>';
            P.card(body.firstChild, { onFail: shut });
            moreNow(body.querySelector(".hx-now"), sb);
            /* Collections (migration_v75): the place opens on it, and closing it comes back here */
            var cb = body.querySelector("[data-place-coll]");
            if (cb) cb.addEventListener("click", function(){ P.open({ collections: true, onClose: function(){ if (cb.isConnected) cb.focus(); } }); });
          };
          if (boot && boot.ready && boot.ready.then) boot.ready.then(draw, function(){ draw(null); }); else draw(boot && boot.data);
        };
        /* his drawing is widget/pet.js's: it is on the page a moment after the widget */
        if (window.shPet) go(); else { if (window.shLoadPet) window.shLoadPet(); whenWidget("shPet", function(){ go(); }); }
      });
    }, shut);
  }

  /* ---------- visiting from a hub's boards (the inbox's "Visiting from a hub's boards", 2026-11-19): a board row's visit
     key (the _v2 boards' `visit`, 24 hex characters; get_arcade_leaderboard_v2 for a hub's arcade) opens that person's
     place, as a row on the dashboard's boards does (widget/dash.js, visit()): get_place, then shPlace.open({ place }), the
     name in the title, no HP and no Customize. The day's first visit pays (claim_visit_v2, the same "sh_visit_paid" day
     the dashboard keeps). window.shVisitPlace(key, { onClose }) answers true once the place is open, false when it couldn't
     be (the row then says so), null while another visit is on its way; a hub's arcade (content/arcade.js) calls it. Only the name, the slots, the rank and the
     medals are kept, as text and numbers. ---------- */
  var VISIT_RE = /^[0-9a-f]{24}$/, visiting = false, NOW = [];
  function placeOf(d){
    if (!d || typeof d !== "object" || Array.isArray(d)) return null;
    var eq = {}, e = d.equipped && typeof d.equipped === "object" ? d.equipped : {}, rk = d.rank && typeof d.rank === "object" ? d.rank : null;
    Object.keys(e).forEach(function(k){ if (typeof e[k] === "string" && /^[a-z0-9-]{1,40}$/.test(k)) eq[k] = e[k]; });
    return { name: String(d.name == null ? "" : d.name), equipped: eq, flair: typeof d.flair === "string" ? d.flair : "",
      rank: rk ? { journey: +rk.journey || 0, tier: +rk.tier || 0, level: +rk.level || 1 } : null };
  }
  function visitPlace(key, opt){
    opt = opt || {};
    if (visiting) return Promise.resolve(null);              // a second tap while the first is on its way: nothing to say
    if (!VISIT_RE.test(key || "")) return Promise.resolve(false);
    visiting = true;
    var sb = window.shSupabase;
    if (!sb) { visiting = false; return Promise.resolve(false); }
    var place = sb.rpc("get_place", { p_key: key }).then(function(res){ return res && !res.error ? placeOf(res.data) : null; }, function(){ return null; });
    var code = loadScript(WIDGET + "place.js").then(function(){ return true; }, function(){ return false; });
    /* his drawing is widget/pet.js's (as for your own place): wait a moment for it if it isn't on the page yet */
    var pet = window.shPet ? null : new Promise(function(ok){ if (window.shLoadPet) window.shLoadPet(); whenWidget("shPet", ok); setTimeout(ok, 4000); });
    return Promise.all([place, code, pet]).then(function(a){
      visiting = false;
      var P = window.shPlace, boot = window.shBootstrap, d = boot && boot.data;
      if (!a[0] || !a[1] || !P) return false;
      P.setup({ sb: sb, visitor: ls("sh_visitor_id"), shop: d && d.shop, profile: HX.RANK && HX.RANK.p });
      P.open({ place: a[0], onClose: opt.onClose, nav: opt.nav || null });
      visitPaid(key);
      return true;
    });
  }
  function visitPaid(key){
    var G = window.shGame, me = ls("sh_visitor_id"), w = shopOf() && shopOf().wallet, day = dayCT();
    if (!G || !G.claim || !me || !day || ls("sh_visit_paid") === day || (w && w.got && w.got.visit) || (w && w.pays && !w.pays.visit)) return;
    ls("sh_visit_paid", day);
    G.claim("claim_visit_v2", { p_visitor: me, p_key: key }, "visit").then(function(r){ if (!r || r.missing || r.ok === false) ls("sh_visit_paid", null); }, function(){ ls("sh_visit_paid", null); });
  }
  window.shVisitPlace = visitPlace;
  /* ---------- Studying now (migration_v99, the idea board's "Drip for Timmy"), under the place's card in More: the
     classmates with a hub open right now (a ping in the last 3 minutes, in any hub) who show on the boards under a name
     they chose, to visit. get_studying_now gives each one's name, visit key, rank and medals, never a hub, a time or an id,
     and how many others are studying, as a number. A row is a [data-sh-visit] button (below), with data-sh-now="row" first so a click count records "sh-now=row", never the name in its label; the place's arrows go
     through the list. Asked each time the page opens. Without the function (before the migration) nothing is drawn. ---------- */
  function moreNow(host, sb){
    if (!host || !sb) return;
    sb.rpc("get_studying_now", { p_visitor: ls("sh_visitor_id") || null }).then(function(res){
      var d = res && !res.error ? res.data : null, R = window.shRanks, esc = HX.esc;
      if (!host.isConnected || !d || typeof d !== "object" || Array.isArray(d)) return;
      NOW = (Array.isArray(d.people) ? d.people : []).filter(function(p){ return p && typeof p.name === "string" && p.name && VISIT_RE.test(p.visit || ""); }).map(function(p){
        var rk = p.rank && typeof p.rank === "object" ? p.rank : {};
        return { name: p.name, key: p.visit, rank: { journey: +rk.journey || 0, tier: Math.max(0, Math.min(6, +rk.tier || 0)), level: +rk.level || 1 }, flair: typeof p.flair === "string" ? p.flair : "" };
      });
      var others = Math.max(0, Math.floor(+d.others || 0)), more = Math.max(0, others - NOW.length);
      var mini = function(p){ try { return R ? (R.miniOf && p.rank.journey > 0 ? R.miniOf(p.rank.journey, p.rank.tier, p.rank.level) : R.mini ? R.mini(p.rank.tier, p.rank.level) : "") : ""; } catch (e) { return ""; } };
      var row = function(p){ var f = R && R.flair ? R.flair(p.flair, { who: p.name }) : "";
        return '<li><button type="button" class="hx-nowbtn" data-sh-now="row" data-sh-visit data-key="' + p.key + '" aria-label="' + esc("Visit " + p.name + "’s place") + '"><i class="hx-nowdot" aria-hidden="true"></i>' + mini(p) +
          '<span class="hx-nownm">' + esc(p.name) + '</span><span class="hx-nowgo" aria-hidden="true">Visit</span></button>' + f + "</li>"; };
      host.innerHTML = '<h2 id="hxNowH">Studying now</h2>' +
        (NOW.length ? '<p class="note">Classmates with a hub open right now, under the names they chose for the boards. Tap one to visit their Timmy.</p><ul class="hx-nowlist">' + NOW.map(row).join("") + "</ul>" +
          (more ? '<p class="note">And ' + (more === 1 ? "1 more person" : more + " more people") + " without a name on the boards.</p>" : "")
          : '<p class="note">' + (others ? (others === 1 ? "1 person is" : others + " people are") + " studying right now, none of them under a name on the boards." : "Nobody else is studying right now. Check back in a bit.") + "</p>");
      host.hidden = false;
    }, function(){});
  }
  /* the place's arrows through the list: names and ranks go to the place, the keys stay here */
  function nowNav(key){
    var keys = NOW.map(function(p){ return p.key; }), at = keys.indexOf(key), sb = window.shSupabase;
    if (at < 0 || keys.length < 2 || !sb) return null;
    return { at: at, what: "studying now", list: NOW.map(function(p){ return { name: p.name, rank: p.rank }; }),
      load: function(i){ return keys[i] ? sb.rpc("get_place", { p_key: keys[i] }).then(function(res){ var p = res && !res.error ? placeOf(res.data) : null; if (!p) throw new Error("place"); return p; }) : Promise.reject(new Error("key")); } };
  }
  /* every [data-sh-visit] button on the page (a hub's board rows) opens its data-key's place; closing gives focus back */
  document.addEventListener("click", function(e){
    var b = e.target.closest && e.target.closest("button[data-sh-visit]"); if (!b) return;
    var key = b.getAttribute("data-key") || "", row = b.closest("li") || b.parentNode, old = row && row.querySelector(".sh-visit-msg");
    if (old) old.parentNode.removeChild(old);
    b.setAttribute("aria-busy", "true");
    visitPlace(key, { nav: b.hasAttribute("data-sh-now") ? nowNav(key) : null, onClose: function(){ if (b.isConnected) try { b.focus(); } catch (x) {} } }).then(function(ok){
      b.removeAttribute("aria-busy");
      if (ok !== false || !row || !b.isConnected) return;
      var line = document.createElement("span"); line.className = "sh-visit-msg"; line.setAttribute("role", "status"); row.appendChild(line);
      setTimeout(function(){ line.textContent = "That place couldn’t be opened just now."; }, 60);
    });
  });

  /* ---------- Timmy's shop (phase 4, part B): its page in More, the balance on its tile, the costume of the day.
     widget/shop.js (window.shShop) draws the shop and fetches its art and the place's kit itself; none of it loads with
     the page. The shop is there once the page's bootstrap carries one (the game layer, migration_v54). ---------- */
  var COIN = '<path d="M6.2 17.4 C4.5 14.3 3.5 10.9 4.3 8.1 C4.9 5.9 6.5 4.4 8.4 4.5 C10 4.6 10.8 6.1 12 6.1 C13.2 6.1 14 4.6 15.6 4.5 C17.5 4.4 19.1 5.9 19.7 8.1 C20.5 10.9 19.5 14.3 17.8 17.4 Z" fill="#F2C94C" stroke="#3B2E3A" stroke-width="1.6"/><path d="M15.7 5.3 C17.4 5.5 18.6 6.7 19 8.4 C19.6 11 18.8 14.2 17.4 16.8 L14.9 16.4 C16.6 12.6 17.1 8.8 15.7 5.3 Z" fill="#C9971C"/><path d="M12 6.4 V9.6 M9.4 9 Q12 10.5 14.6 9" fill="none" stroke="#9C7414" stroke-width="1.1"/><ellipse cx="12" cy="17.5" rx="5.8" ry="2.3" fill="#8A6410" stroke="#3B2E3A" stroke-width="1.6"/><path d="M7.4 18.3 Q12 20.3 16.6 18.3 Q12 21 7.4 18.3 Z" fill="#C9971C"/><path d="M6.3 9.4 C6.5 7.8 7.2 6.8 8.1 6.3" stroke="#fff" stroke-width="1.3" fill="none" opacity=".6"/><path d="M8.6 9.6 Q9 11.2 10.6 11.6 Q9 12 8.6 13.6 Q8.2 12 6.6 11.6 Q8.2 11.2 8.6 9.6 Z" fill="#FFFFFF"/>';
  /* the Shiny Gold Crown (widget/hub-art/shop.js's coinBody(), copied here so the tile needs no request) */
  function shopCoin(px){ return '<svg class="ic" viewBox="0 0 24 24" width="' + px + '" height="' + px + '" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true" focusable="false">' + COIN + "</svg>"; }
  var SHOP = null;
  function shopOf(){ var b = window.shBootstrap, d = b && b.data; return SHOP || (d && d.shop && d.shop.wallet ? d.shop : null); }
  /* the shop is there for everyone once the page's bootstrap carries one (everyone has Timmy, so he's there to draw) */
  function hasShop(){ return !!shopOf(); }
  /* the wallet ({ earned, spent, balance }), for the Today card (hub-rewards.js), or null before the bootstrap. Without the
     shop (its bootstrap timed out, and get_my_shop hasn't answered yet), the balance the last paying reply carried
     (window.shGame.crowns(), migration_v68), so the crowns still show (2026-11-18) */
  function wallet(){
    var sh = shopOf(); if (sh && sh.wallet && typeof sh.wallet.balance === "number") return sh.wallet;
    var G = window.shGame, c = G && G.crowns ? G.crowns() : null;
    return typeof c === "number" && isFinite(c) ? { balance: c } : null;
  }
  /* the balance after a reply that paid (migration_v68: every paying reply carries it; widget/hub-rewards.js passes it on):
     the wallet takes it, its "earned in all" moves by the same, and an open shop shows it */
  function setWallet(n){
    var sh = shopOf(), w = sh && sh.wallet; if (!w || typeof n !== "number" || !isFinite(n)) return;
    if (n > w.balance) w.earned = (w.earned || 0) + (n - w.balance);
    w.balance = n;
    [].forEach.call(document.querySelectorAll("[data-shop-bal]"), function(b){ b.textContent = String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ","); });
  }
  function shopMeta(){
    var sh = shopOf(), bal = sh && sh.wallet ? sh.wallet.balance : null;
    return (ls("sh_shop_dot") === dayCT() ? "● A rare costume came in · " : "") + (bal == null ? "" : String(bal).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " gold crowns");
  }
  function dayCT(){ try { return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" }).format(new Date()); } catch (e) { return ""; } }
  /* the rare costume of the day, the same on every reload and every linked device: from the visitor id and the Central
     day, on about one day in twelve among the days with no holiday (holiday: widget/pet.js's holidayId() that day) and
     outside the fall weeks (September 22 to November 30), one of the ten (tools/figures/site/sets.mjs COSTUMES, in its order). widget/dash.js has the same function, and
     tools/release/xp.js checks both against the server's sh_season and sh_is_fall for every day of three years. */
  var COSTUMES = ["pirate", "astronaut", "detective", "chef", "captain-enamel", "wizard", "robot", "firefighter", "shark", "dragon"];
  function costumeOfDay(visitor, day, holiday){
    if (!visitor || !/^\d{4}-\d{2}-\d{2}$/.test(day || "") || holiday) return "";
    var x = +day.slice(5, 7) * 100 + +day.slice(8, 10); if (x >= 922 && x <= 1130) return "";
    var s = visitor + "|costume|" + day, h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    h = h >>> 0;
    return h % 12 === 0 ? COSTUMES[Math.floor(h / 12) % COSTUMES.length] : "";
  }
  /* the shop on its own (get_my_shop, a small read), when the page's bootstrap came back without it: on 2026-11-18 about
     one bootstrap in ten timed out in the busy minutes, and the Today card lost its crowns. It waits 8 to 20 seconds first
     (a busy minute is usually over by then, and the class's pages don't all ask at once), and asks once more a minute
     later at most. An answer's reply carries the balance anyway (wallet() above), so most people see it sooner. */
  function shopAlone(tries){
    setTimeout(function(){
      whenWidget("shSupabase", function(sb){
        var v = ls("sh_visitor_id");
        if (!sb || !v || SHOP) return;
        var again = function(){ if (tries > 1) shopAlone(tries - 1); };
        sb.rpc("get_my_shop", { p_visitor: v }).then(function(r){
          var sh = r && !r.error && r.data;
          if (!sh || !sh.wallet || typeof sh.wallet.balance !== "number") { again(); return; }
          if (SHOP) return;
          SHOP = sh;
          if (HX.view === "more" && !HX.sub) HX.go("more", true);
          HX.paintMeters();
        }, again);
      });
    }, tries > 1 ? 8000 + Math.random() * 12000 : 45000 + Math.random() * 30000);
  }
  function shopStart(){
    var boot = window.shBootstrap && window.shBootstrap.ready;
    if (!boot || !boot.then) return;
    boot.then(function(d){
      if (!d || !d.shop || !d.shop.wallet) { if (window.shGame && window.shGame.want && !window.shAutomated) shopAlone(2); return; }
      SHOP = d.shop;
      if (HX.view === "more" && !HX.sub) HX.go("more", true);
      HX.paintMeters();   // the Today card's crowns
      whenWidget("shPet", function(P){
        var sb = window.shSupabase, v = ls("sh_visitor_id"), day = dayCT(), hol = "";
        if (!P || !sb || !v || !day) return;
        try { hol = P.holidayId ? P.holidayId() : ""; } catch (e) { return; }
        var c = costumeOfDay(v, day, hol);
        if (!c || (d.shop.costumes || []).some(function(x){ return x && x.id === c; }) || ls("sh_costume_asked") === day) return;
        ls("sh_costume_asked", day);
        sb.rpc("record_costume_sighting", { p_visitor: v, p_costume: c }).then(function(r){
          var a = r && !r.error && r.data;
          if (!a || !a.ok || !a.first) return;
          try { localStorage.setItem("sh_shop_dot", day); } catch (e) {}
          window.shTrack && window.shTrack("shop:spotted");
          setTimeout(function(){ say("Something rare came in at the shop today: the " + (c === "captain-enamel" ? "Captain Enamel" : c) + " costume. It’s on the Spotted shelf."); }, 2500);
          if (HX.view === "more" && !HX.sub) HX.go("more", true);
        }, function(){});
      });
    }, function(){});
  }
  function moreShop(body){
    var shut = function(){ if (body.isConnected) body.innerHTML = '<p class="note">The shop couldn’t be opened just now. Try again in a moment.</p>'; };
    var closed = function(){ if (body.isConnected) body.innerHTML = '<p class="note">The shop isn’t open yet. It opens with the new hubs.</p>'; };
    loadScript(WIDGET + "shop.js").then(function(){
      whenWidget("shSupabase", function(sb){
        var go = function(){
          var S = window.shShop, boot = window.shBootstrap;
          if (!body.isConnected || HX.view !== "more") return;
          if (!S || !sb) { shut(); return; }
          /* the balance and the shelves ride in the page's bootstrap: a link straight to the shop waits for it */
          var draw = function(d){
            if (!body.isConnected || HX.view !== "more") return;
            if (!SHOP && d && d.shop && d.shop.wallet) SHOP = d.shop;
            if (!shopOf()) { closed(); return; }
            S.setup({ sb: sb, visitor: ls("sh_visitor_id"), shop: shopOf(), profile: HX.RANK.p, onBought: shopBought });
            body.innerHTML = '<div class="shop-host"></div>';
            S.mount(body.firstChild, { level: 2 });
          };
          if (shopOf()) draw(null); else if (boot && boot.ready && boot.ready.then) boot.ready.then(draw, closed); else closed();
        };
        if (window.shPet) go(); else { if (window.shLoadPet) window.shLoadPet(); whenWidget("shPet", function(){ go(); }); }
      });
    }, shut);
  }
  /* a purchase: a boost starts the 2x chip on the rank pill at once, with the server's end time */
  function shopBought(res){
    var G = window.shGame, cur = G && G.boost ? G.boost() : null;
    if (!res || !res.boost_until || !G || !G.setBoost) return;
    /* a medal's boost that runs longer keeps the chip; the server counts whichever ends later, too */
    if (!cur || new Date(cur.until).getTime() < new Date(res.boost_until).getTime()) G.setBoost({ mult: 2, until: res.boost_until, src: "shop" });
    HX.paintMeters();
  }
  document.addEventListener("sh:shop", function(e){ var sh = e.detail && e.detail.shop; if (sh && sh.wallet) { SHOP = sh; HX.paintMeters(); } });

  /* ---------- Ask Timmy (widget/ask.js, window.shAsk) ---------- */
  var askLoad = null, askMounted = false;
  function askReady(){
    if (!askLoad) askLoad = HX.loadScript(WIDGET + "ask.js").then(function(){ askMount(); return window.shAsk || null; });
    return askLoad;
  }
  function askMount(){
    if (askMounted || !window.shAsk) return; askMounted = true;
    window.shAsk.mount({ where: "hub", hub: HUB, name: C.name || HUB, exam: C.exam || null, about: C.about || "../../about/",
      answeredEvent: HX.EVT, section: function(){ return HX.section(); }, place: askPlace,
      lecName: function(lec){ var l = HX.LBY[lec]; return l ? HX.lecLabel(l) + " " + HX.shortTitle(l) : ""; },
      core: function(){ return HX.CORE; }, state: function(){ return STATE; },
      go: askGo, archived: askArchived, sb: function(){ return window.shSupabase || null; } });
  }
  /* the chat comes with the shared widget (the core's startWidget), not with the first screen */
  function askStart(){ askReady().catch(function(){}); }
  /* where the student is in the notes: the lecture, and (in the notes as taught) the paragraph at the top of the screen,
     counted the way exportSections and SH_GOTO count them, so it is the same address the server's quotes use */
  function askPlace(){
    if (HX.view !== "notes" || HX.sub === "guide") return null;   // the study guide is no one lecture's notes
    var lec = HX.LBY[HX.sub] ? HX.sub : STATE.ui.lec; if (!HX.LBY[lec]) return null;
    var out = { lec: lec };
    if ((STATE.ui.level || "full") !== "full") return out;
    var prose = $(".reading-prose"); if (!prose || !prose.closest("#lec-" + lec)) return out;
    var top = Math.max(0, ($("#hxBar") || {}).offsetHeight || 0, ($("#hxStrip") || {}).offsetHeight || 0) + 8;
    var els = Array.prototype.filter.call(prose.querySelectorAll("p, li, h3, h4"), function(e){ return !e.closest("[data-sh-noread]"); });
    for (var i = 0; i < els.length; i++) { if (els[i].getBoundingClientRect().bottom > top) { out.k = i; break; } }
    return out;
  }
  /* a link from the chat: the engine's own router (SH_GOTO) for the notes, review tables, cram and hints; here for the rest */
  function askGo(g){
    if (!g) return;
    if (g.v === "practice" && HX.LBY[g.lec]) { HX.bankReset(); STATE.ui.qlec = HX.lecValue([g.lec]); HX.bankSearch = ""; HX.saveState(); HX.go("questions"); return; }
    if (g.v === "drill") { HX.go("questions/drill"); return; }
    if (g.v === "home") { HX.go("home"); return; }
    if (g.v === "notes" && !HX.LBY[g.lec]) { HX.go("notes"); return; }
    if (g.v === "notes" && g.k == null) { HX.go("notes/" + g.lec); return; }
    if (window.SH_GOTO) window.SH_GOTO(g);
  }
  /* Timmy isn't on an archived hub: the admin page's override while it's in force (the copy the widget keeps), else the
     dates (10 pm on the last exam's day, as widget/v3.js's notice decides it) */
  function askArchived(){
    try { if (sessionStorage.getItem("sh_archived_seen_" + HUB)) return true; } catch (e) {}
    try {
      var c = JSON.parse(ls("sh_hub_overrides") || "null"), o = null;
      if (c && Array.isArray(c.rows)) c.rows.forEach(function(r){ if (r && r.hub === HUB && ["live", "archived", "hidden"].indexOf(r.state) > -1 && !(r.until && new Date() >= new Date(r.until))) o = r; });
      if (o) return o.state !== "live";
    } catch (e) {}
    var last = null;
    ((HX.CORE && HX.CORE.exams) || []).forEach(function(x){
      var p = String((x && x.date) || "").split("-").map(Number); if (p.length !== 3 || !p[0]) return;
      var d = new Date(p[0], p[1] - 1, p[2], x.archiveHour != null ? x.archiveHour : 22); if (!last || d > last) last = d;
    });
    return !!(last && new Date() >= last);
  }
  function askOn(){ return !askArchived(); }
  /* the card's button says who answers: Timmy when he's on this page, the hub when he isn't */
  function askLabel(){ return docEl.classList.contains("sh-pet-on") ? "Ask Timmy" : "Ask the hub"; }
  /* "Ask Timmy" on an answered question: the chat opens with the question attached and "Why is it ...?" in the box */
  function askAbout(q, right, picks){
    var short = function(t){ t = String(t || "").replace(/\s+/g, " ").trim(); return t.length > 90 ? t.slice(0, 88) + "…" : t; };
    var text = q.type === "mcq" && q.choices && q.choices[q.answer] != null ? "Why is it “" + short(q.choices[q.answer]) + "”?"
      : q.type === "multi" ? "Why are those the right ones?" : q.type === "sequence" ? "Why does it go in that order?"
      : q.type === "match" ? "Can you explain these matches?" : "Can you explain this one?";
    var ask = { qid: q.id, right: q.type === "recall" ? null : !!right, picks: q.type === "mcq" || q.type === "multi" ? (picks || []).slice() : [],
      label: String(q.stem || "").replace(/\s+/g, " ").trim(), w: q._w || 0, o: q._perm ? q._perm.join("") : "" };
    /* w: the wording on screen (widget/hub.js worded()); o: a statement item's order on screen (widget/statements.js),
       shown statement j being the item's statement o[j - 1], so Timmy numbers the statements the way the student saw them */
    askReady().then(function(A){ if (A) A.open({ from: "card", text: text, ask: ask }); else HX.toast("The chat didn't load. Try again in a moment.", "err"); },
      function(){ HX.toast("The chat didn't load. Check your connection and try again.", "err"); });
  }

  /* what the other files call from here */
  HX.say = say; HX.petHp = petHp; HX.timmyReact = timmyReact; HX.petFromBadges = petFromBadges; HX.morePlace = morePlace;
  HX.moreShop = moreShop; HX.hasShop = hasShop; HX.shopMeta = shopMeta; HX.shopCoin = shopCoin; HX.shopStart = shopStart; HX.wallet = wallet; HX.setWallet = setWallet; HX.costumeOfDay = costumeOfDay;
  HX.askStart = askStart; HX.askOn = askOn; HX.askLabel = askLabel; HX.askAbout = askAbout;
};
