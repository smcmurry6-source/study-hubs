/* study-hubs: the hub widget of the handpiece ranks (shRanks.mount): the rank card, hub mastery and the trophy case in
   Stats, the accent colors in Settings, Link my devices, the mastery and hub-trophy cards. It draws with widget/ranks.js's
   art and lists (shRanks, and the kit it hands over in shRanks._hub), so it runs after that file. widget/v3.js loads it
   on a hub only (from hub-rest.bundle.js on the engine, by name on an old single-file hub): the dashboard never mounts it,
   and it was 12 KB of the dashboard's page budget while it rode in rest.bundle.js (2026-11-19). */
(function(){
  "use strict";
  var R = window.shRanks, K = R && R._hub;
  if (!K || R.mount) return;
  var NEW = K.NEW, TS = K.TS, ls = K.ls, ROMAN = K.ROMAN, RETIRED = K.RETIRED, HUB_NAMES = K.HUB_NAMES,
    playRankUp = K.playRankUp, trophyCard = K.trophyCard, masteryCard = K.masteryCard,
    TIERS = R.TIERS, TROPHIES = R.TROPHIES, HUB_TROPHIES = R.HUB_TROPHIES, MASTERY = R.MASTERY, ACCENTS = R.ACCENTS,
    art = R.art, artOf = R.artOf, nameOf = R.nameOf, rankName = R.rankName, isV2 = R.isV2, legacy = R.legacy,
    needJourneyArt = R.needJourneyArt, track = R.track, trophyStats = R.trophyStats, hubName = R.hubName,
    flair = R.flair, flairFromBadges = R.flairFromBadges, applyAccent = R.applyAccent, accentTex = R.accentTex, svgDataUri = R.svgDataUri;
  function fmt(n){ return Math.round(n || 0).toLocaleString(); }
  function linkTrack(k){ try { if (window.shTrack) window.shTrack("link:" + k); } catch (e) {} }

  function mount(H){
    if (!H || window.__shRanksMounted) return;
    window.__shRanksMounted = true;
    var SB = H.supabase, esc = H.esc;
    if (NEW && SB) TS.sb = SB;
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
      var ex = window.SH_EXPORT || {}, bank = (ex.questions || []).length, off = 0;
      /* a hub may keep review-only questions out of its mastery (Heme & Endo Exam 2's Exam 1 Refresher, Sam 2026-11-06):
         SH_EXPORT.uncounted() returns { n: how many, right: how many of them you have right on your latest try }. The
         server's count includes them, so they come off both sides. */
      if (typeof ex.uncounted === "function") { try { var u = ex.uncounted() || {}; bank = Math.max(0, bank - (u.n | 0)); off = u.right | 0; } catch (e) {} }
      var row = (mastery || []).filter(function(r){ return r.hub === H.hub; })[0];
      var got = row ? Math.max(0, Math.min(bank, row.latest_correct - off)) : 0, pct = bank ? got / bank : 0, lvl = -1;
      MASTERY.forEach(function(m, i){ if (bank && pct >= m.pct) lvl = i; });
      return { bank: bank, got: got, pct: pct, lvl: lvl };
    }
    /* how many people have each trophy (get_trophy_stats, migration_v32), out of everyone who has answered */
    var tstats = null, tstatsAt = 0;
    function loadTrophyStats(){
      if (Date.now() - tstatsAt < 600000) return;
      tstatsAt = Date.now();
      /* the redesign's pages share one read with the case and the cards (with the journeys, once migration_v54 is in) */
      if (NEW) { TS.sb = SB; trophyStats(function(d){ if (!d) { tstatsAt = 0; return; } tstats = d; render(); }); return; }
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
    K.setRarity(function(k){ return rarity(k); });
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
      /* a v2 profile (the redesign's pages on the game layer): the card shows the journey's own rank, 63 steps long,
         while the rest of this panel keeps reading the Handpiece's view above */
      var V = isV2(ownRaw) ? ownRaw : null, vj = V ? Math.max(0, Math.min(2, V.journey | 0)) : 0, vn = V ? (V.step | 0) + 1 : 0;
      if (V) { next = V.next_at; at = V.step_at != null ? V.step_at : at; }
      var pct = next ? Math.max(0, Math.min(1, (xp - at) / (next - at))) : 1;
      var nextName = !next ? "" : V ? nameOf({ journey: Math.floor(vn / 21), tier: Math.floor(vn % 21 / 3), level: vn % 3 + 1 }) : rankName(Math.floor((step + 1) / 3), (step + 1) % 3 + 1);
      var m = masteryFor(), badges = profile.badges || [];
      var h = '<div class="sh-rank-card sh-tier-' + TIERS[t].key + '">' +
        '<div class="sh-rank-art-wrap">' + (vj ? artOf(vj, V.tier | 0, 108, { animate: true, level: V.level || 1 }) : art(t, 108, { animate: true, level: lvl })) + '</div>' +
        '<div class="sh-rank-info"><div class="sh-rank-eyebrow">' + (vj === 1 ? "Your ModuPro" : vj === 2 ? "Your loupes" : "Your handpiece") + '</div>' +
        '<div class="sh-rank-name">' + (vj ? esc(nameOf(V)) : rankName(t, lvl)) + '</div>' +
        '<div class="sh-rank-xp"><b>' + fmt(xp) + '</b> XP' + (profile.position ? ' · #' + profile.position + ' of ' + profile.of : '') + '</div>' +
        '<div class="sh-rank-bar"><i style="width:' + (pct * 100).toFixed(1) + '%"></i></div>' +
        '<div class="sh-rank-next">' + (next ? fmt(next - xp) + ' XP to ' + nextName : 'The highest rank there is.') + '</div>' +
        (window.shEditName ? '<div class="sh-rank-namerow"><button type="button" class="sh-rank-rename">' + (window.shNameNow && window.shNameNow() ? 'Shown as ' + esc(window.shNameNow()) + ' · change' : 'Change your name') + '</button>' +
          /* Link my devices beside the name, as everywhere a name is changed (widget/v3.js opens widget/linkask.js's card) */
          '<button type="button" class="sh-rank-linkbtn" data-sh-link="rank">Link my devices</button></div>' : '') +
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
      if (NEW) TROPHIES.forEach(function(x){ if (x.device && ls(x.device)) earned[x.k] = true; });
      h += '<div class="sh-trophies-h"><span>Trophy case</span><b>' + TROPHIES.filter(function(x){ return earned[x.k]; }).length + ' / ' + TROPHIES.length + '</b></div>' +
        '<div class="sh-trophies">' + TROPHIES.map(function(x){ return trophyHTML(x, earned[x.k]); }).join("") +
          RETIRED.filter(function(x){ return earned[x.k]; }).map(function(x){ return trophyHTML({ k: x.k, n: x.n + " (retired)", d: x.d, ic: x.ic }, true); }).join("") + '</div>' +
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
      if (NEW) trophyStats();
      playRankUp("trophy", trophyCard({ k: t.k, n: t.n, d: t.d + " (" + hubName(H.hub) + ")", ic: t.ic }), mockBusy);
    }
    function masteryToast(i){
      if (H.prefGet("sh_pref_celebrate", "on") === "off") return;
      if (NEW) trophyStats();
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

    var loading = false, ownRaw = null;
    /* your own rank and mastery: the badge by your name, the rank-up, level-up, trophy and mastery cards, and the
       medals recorded in render(). Cheap per-visitor reads since migration_v53's XP cache, so they still come on load
       (in the page bootstrap) and every 10 answers (Sam, 2026-11-06). The class-wide trophy rarity waits for Stats. */
    function applyOwn(p, m){
      var raw = p; p = legacy(p);   // a v2 profile (the redesign): this panel, the accents and Timmy's house read the Handpiece's rank
      profile = p; mastery = m || []; ownRaw = raw;
      if (raw.journey > 0 && !window.SH_JOURNEY_ART) needJourneyArt(function(K){ if (K) render(); });
      /* the redesigned hubs' rank pill (widget/hub-rewards.js) listens; nothing on the live pages does */
      try { document.dispatchEvent(new CustomEvent("sh:rank-profile", { detail: { profile: raw, mastery: masteryFor(), rows: m } })); } catch (e) {}
      if (window.shPet && window.shPet.syncBadges) window.shPet.syncBadges(profile.badges);
      track(raw, { busy: mockBusy, seen: function(j){ if (!window.shAutomated) rpc("mark_dark_unlock_seen", { p_visitor: H.visitor, p_journey: j }); },
        claim: window.shAutomated ? null : function(fn, args){ return rpc(fn, Object.assign({ p_visitor: H.visitor }, args)); } });
      badgeIcon(profile.tier || 0); render(); drawAccents(); applyAccent(ls("sh_pref_accent"));
    }
    function loadOwn(){
      if (loading) return; loading = true;
      /* the redesign's pages read the game layer's profile (H.live, set by widget/v3.js: the page wants it and hasn't
         found it missing; H.v2 on an older cached v3.js). Until 2026-11-19 it waited for H.v2, which is true only once the
         bootstrap or an answer's reply has come back, so with the bootstrap timed out in a busy minute the page read the
         old profile: no double-XP chip until the first answer's reply, and from 50,000 XP no climb to the ModuPro (past
         it, the Handpiece's Dark Matter in place of the journey's rank) until the tenth answer */
      var v2 = H.live ? H.live() : H.v2 && H.v2();
      Promise.all([rpc(v2 ? "get_rank_profile_v2" : "get_rank_profile", { p_visitor: H.visitor }), rpc("get_hub_mastery", { p_visitor: H.visitor })]).then(function(r){
        loading = false;
        if (!r[0]) { if (!profile) sec.innerHTML = '<div class="shstat-empty">Ranks load when you are online.</div>'; return; }
        applyOwn(r[0], r[1]);
      });
    }
    function load(){ loadTrophyStats(); loadOwn(); }
    /* On load: your own rank and mastery from the page bootstrap (one request for the whole widget); the old
       separate reads only while migration_v53 isn't applied or the bootstrap failed. The class-wide trophy rarity
       (get_trophy_stats) stays lazy: it loads when Stats opens. */
    function panelOpen(){ return !!(panel && panel.classList.contains("is-open")); }
    var boot = H.bootstrap || (window.shBootstrap && window.shBootstrap.ready) || null;
    if (boot && typeof boot.then === "function") {
      boot.then(function(data){
        if (data && data.rank && typeof data.rank === "object") applyOwn(data.rank, Array.isArray(data.mastery) ? data.mastery : []);
        else loadOwn();
      }, loadOwn);
    } else loadOwn();
    var sinceLoad = 0;
    document.addEventListener(H.answeredEvent, function(){
      if (++sinceLoad >= 10) {
        sinceLoad = 0;
        /* on the game layer widget/v3.js may already know them (shRankLocal, 2026-11-19): no read */
        setTimeout(function(){ var t = !panelOpen() && window.shRankLocal && window.shRankLocal(ownRaw, mastery); if (t) applyOwn(t[0], t[1]); else (panelOpen() ? load : loadOwn)(); }, 1500);
      }
    });
    /* the game layer (the redesign): the server's answer carries your new total, so a rank-up, a hand-off or a Dark
       Matter unlock plays on the answer that earned it instead of up to ten answers later */
    document.addEventListener("sh:answer-paid", function(e){
      var r = e.detail && e.detail.res;
      if (r && typeof r.total === "number" && ownRaw && ownRaw.next_at != null && r.total >= ownRaw.next_at) { sinceLoad = 0; setTimeout(loadOwn, 900); }
    });
    document.addEventListener("click", function(e){
      if (e.target.closest && e.target.closest("#shstat-stats-pill")) setTimeout(function(){ if (panelOpen()) load(); }, 50);
    });
    document.addEventListener("sh:mock-done", function(e){
      var d = e.detail || {};
      /* d.session: the game layer's server saved the score itself when the mock's session finished (xp_session_finish) */
      if (d.total > 0 && !window.shAutomated && !d.session) rpc("record_mock_score", { p_visitor: H.visitor, p_hub: H.hub, p_correct: d.correct | 0, p_total: d.total | 0 });
      if (d.total >= 20 && d.correct / d.total >= 0.9) rpc("record_achievement", { p_visitor: H.visitor, p_kind: "mock90", p_hub: H.hub }).then(function(){ setTimeout(panelOpen() ? load : loadOwn, 800); });
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

  R.mount = mount;
})();
