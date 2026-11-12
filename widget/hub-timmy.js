/* ============ THE HUB ENGINE, part: Timmy (widget/hub-timmy.js) ============
   One of the engine's four files (widget/hub.js is the core and says how they fit together). This one holds what the
   engine asks of Timmy Tooth (widget/pet.js, window.shPet): a line for him to say, his HP, his cheer or flinch on the
   bar at each answer, and loading him when he was adopted on another device; and Timmy's place, the page in More
   (widget/place.js draws it, fetched the first time that page is opened). Timmy Time, the podcast's page, is in the
   core (More).

   The names it takes from the core are listed first; what the other files call from here is put on HX at the end.
   ============ */
(window.SH_HUB_PARTS = window.SH_HUB_PARTS || {}).timmy = function(HX){
  "use strict";
  /* from the core (widget/hub.js), under the names they have there */
  var reduced = HX.reduced, $ = HX.$, ls = HX.ls, WIDGET = HX.WIDGET, loadScript = HX.loadScript, whenWidget = HX.whenWidget;

  /* ---------- Timmy (widget/pet.js, window.shPet): what the engine asks of him. He is on the bar once adopted ---------- */
  function say(t, move){ try { if (window.shPet && window.shPet.say) window.shPet.say(t, move, 5000); } catch (e) {} }
  function petHp(){ try { return window.shPet && window.shPet.hp ? window.shPet.hp() : null; } catch (e) { return null; } }
  /* he cheers a right answer and flinches at a miss */
  var reactT = 0;
  function timmyReact(right){
    var tim = $(".shpet-home .shpet-btn");
    if (tim && !reduced) { clearTimeout(reactT); tim.classList.remove("hx-cheer", "hx-flinch"); void tim.offsetWidth; tim.classList.add(right ? "hx-cheer" : "hx-flinch"); reactT = setTimeout(function(){ tim.classList.remove("hx-cheer", "hx-flinch"); }, 1500); }
  }
  /* Timmy loads only once he's adopted (widget/v3.js): adopted on another device shows up in the rank profile as a badge */
  function petFromBadges(b){
    if (!window.shPet && window.shLoadPet && b.some(function(x){ return String(x).split(":")[0] === "pet-adopt"; }))
      window.shLoadPet(function(){ if (window.shPet && window.shPet.syncBadges) window.shPet.syncBadges(b); });
  }

  /* ---------- Timmy's place (redesign phase 4, part C): its page in More. The card, and the full view from it, are
     widget/place.js (window.shPlace), with the kit of drawings it fetches; none of it loads with the page. What Timmy
     owns and where it stands come in the page's bootstrap once the database has the game layer (migration_v54);
     without it the place shows the defaults with your rank and medals. He has a place once he's adopted. ---------- */
  function hasTimmy(){ return !!ls("sh_pet_born"); }
  function morePlace(body){
    var shut = function(){ if (body.isConnected) body.innerHTML = '<p class="note">Timmy’s place couldn’t be opened just now. Try again in a moment.</p>'; };
    if (!hasTimmy()) { body.innerHTML = '<p class="note">Timmy hasn’t moved in yet. Adopt him on the dashboard and his place opens here.</p>'; return; }
    loadScript(WIDGET + "place.js").then(function(){
      whenWidget("shSupabase", function(sb){
        var go = function(){
          var P = window.shPlace, boot = window.shBootstrap;
          if (!body.isConnected || HX.view !== "more") return;
          if (!P) { shut(); return; }
          var draw = function(d){
            if (!body.isConnected) return;
            P.setup({ sb: sb, visitor: ls("sh_visitor_id"), shop: d && d.shop, profile: HX.RANK.p });
            body.innerHTML = '<div class="place-card"></div><p class="note">Tap the picture to step in. Timmy hops over to what you tap, and his health shows in how he moves.</p>';
            P.card(body.firstChild, { onFail: shut });
          };
          if (boot && boot.ready && boot.ready.then) boot.ready.then(draw, function(){ draw(null); }); else draw(boot && boot.data);
        };
        /* his drawing is widget/pet.js's: it is on the page once he's adopted, a moment after the widget */
        if (window.shPet) go(); else { if (window.shLoadPet) window.shLoadPet(); whenWidget("shPet", function(){ go(); }); }
      });
    }, shut);
  }

  /* what the other files call from here */
  HX.say = say; HX.petHp = petHp; HX.timmyReact = timmyReact; HX.petFromBadges = petFromBadges; HX.hasTimmy = hasTimmy; HX.morePlace = morePlace;
};
