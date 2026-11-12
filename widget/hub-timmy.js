/* ============ THE HUB ENGINE, part: Timmy (widget/hub-timmy.js) ============
   One of the engine's four files (widget/hub.js is the core and says how they fit together). This one holds what the
   engine asks of Timmy Tooth (widget/pet.js, window.shPet): a line for him to say, his HP, his cheer or flinch on the
   bar at each answer, and loading him when he was adopted on another device. Timmy Time, the podcast's page, is in the
   core (More).

   The names it takes from the core are listed first; what the other files call from here is put on HX at the end.
   ============ */
(window.SH_HUB_PARTS = window.SH_HUB_PARTS || {}).timmy = function(HX){
  "use strict";
  /* from the core (widget/hub.js), under the names they have there */
  var reduced = HX.reduced, $ = HX.$;

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

  /* what the other files call from here */
  HX.say = say; HX.petHp = petHp; HX.timmyReact = timmyReact; HX.petFromBadges = petFromBadges;
};
