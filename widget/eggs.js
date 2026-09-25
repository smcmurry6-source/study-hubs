/* study-hubs easter eggs. Loaded by widget/v3.js, which hands over window.shEggHooks.
   Everything here is optional fun: it switches off with Settings → Surprises, never shows
   during a mock exam, and every network call is best-effort.

   - Golden Probe: one taught question per hub per day is secretly golden; first right answer claims it
   - Tooth Fairy: rare flutter across the screen after an answer; tap to catch (collectors board in Stats)
   - Plaque Boss: with 5+ classmates online, correct answers chip away at a shared boss
   - Luck wall: the evening before and the morning of an exam, send classmates luck
   - Professor soundboard: tap a professor's name 5 times for one of their exam-hint quotes
   - Night Owl (answering 2-4 am), Through the Root Canal (10 wrong, then 10 right)
   - Konami code → 8-bit mode (keyboard, or on a phone: swipe up up down down left right left right, tap tap);
     type "floss" for a dancing tooth */
(function(){
  "use strict";
  var H = window.shEggHooks;
  if (!H || window.__shEggs) return;
  window.__shEggs = true;

  var SB = H.supabase, HUB = H.hub, VISITOR = H.visitor;
  var esc = H.esc;
  function on(){ return H.prefGet("sh_pref_eggs", "on") !== "off"; }
  function inMock(){ try { return /(^|\/)mock/.test(String(H.section() || "")); } catch (e) { return false; } }
  function ok(){ return on() && !inMock(); }
  function ls(k, v){ try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function rpc(name, args){
    if (!SB) return Promise.resolve(null);
    return SB.rpc(name, args).then(function(r){ return r && !r.error ? r.data : null; }, function(){ return null; });
  }
  function exp(){ return window.SH_EXPORT || {}; }
  /* the class is in Birmingham; days roll over on Central time, same as the server */
  function centralParts(){
    var f = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" });
    var p = {}; f.formatToParts(new Date()).forEach(function(x){ p[x.type] = x.value; });
    return { day: p.year + "-" + p.month + "-" + p.day, hour: +p.hour };
  }
  function hash(s){ var h = 2166136261; for (var i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  var IC = {
    probe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21l9-9"/><path d="M12 12l3-3c1-1 1-3 3-4l2-1"/><path d="M14 16l1.5 1.5M16 14l1.5 1.5M18 12l1.5 1.5"/></svg>',
    tooth: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M7 3c-2.5 0-4 2-4 4.5 0 3 1.5 4.5 2 7 .5 3 1 6.5 2.5 6.5s1.8-3 2.2-5c.2-1 .6-1.5 2.3-1.5s2.1.5 2.3 1.5c.4 2 .7 5 2.2 5s2-3.5 2.5-6.5c.5-2.5 2-4 2-7C21 5 19.5 3 17 3c-2 0-3 1-5 1S9 3 7 3z"/></svg>',
    wing: '<svg viewBox="0 0 48 40"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path class="egg-wl" d="M18 16C10 4 1 6 2 14c1 6 9 7 16 4"/><path class="egg-wr" d="M30 16C38 4 47 6 46 14c-1 6-9 7-16 4"/><path fill="var(--egg-fairy-fill,#fff)" d="M17 9c-2 0-3.5 1.5-3.5 3.5 0 2 1 3 1.4 4.8.4 2.2.7 4.7 1.8 4.7s1.3-2.2 1.6-3.6c.1-.7.4-1.1 1.7-1.1s1.6.4 1.7 1.1c.3 1.4.5 3.6 1.6 3.6s1.4-2.5 1.8-4.7c.4-1.8 1.4-2.8 1.4-4.8C30 10.5 28.5 9 26.5 9c-1.5 0-2.2.7-3.6.7S18.5 9 17 9z" transform="translate(2 8)"/></g><g fill="currentColor"><circle cx="8" cy="30" r="1"/><circle cx="41" cy="33" r="1.2"/><circle cx="24" cy="4" r="1"/></g></svg>',
    blob: '<svg viewBox="0 0 40 40"><path fill="currentColor" d="M20 4c6 0 8 4 12 5s5 6 4 10 2 8-2 12-9 2-14 4-9-1-12-5-4-8-3-12 2-9 6-11 5-3 9-3z"/><circle cx="14" cy="17" r="3" fill="var(--egg-boss-eye,#fff)"/><circle cx="26" cy="17" r="3" fill="var(--egg-boss-eye,#fff)"/><circle cx="14.6" cy="17.6" r="1.4"/><circle cx="26.6" cy="17.6" r="1.4"/><path d="M13 27c3-2.5 11-2.5 14 0" stroke="var(--egg-boss-eye,#fff)" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
    clover: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 11c-1.5-3-5.5-3.5-5.5-.5S10 13 12 11zM12 11c3-1.5 3.5-5.5.5-5.5S10 9 12 11zM12 11c1.5 3 5.5 3.5 5.5.5S14 9 12 11zM12 11c-3 1.5-3.5 5.5-.5 5.5S14 13 12 11z"/><path d="M12 11c0 4 1 7 3 10" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>',
    owl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M5 4l3 3h8l3-3v9a7 7 0 0 1-14 0z"/><circle cx="9.5" cy="11" r="2"/><circle cx="14.5" cy="11" r="2"/><path d="M11 14.5l1 1.2 1-1.2"/></svg>',
    quote: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 18v-5c0-4 2-7 6-8l.7 1.6C8.3 7.6 7.5 9.3 7.5 11H10v7zm10 0v-5c0-4 2-7 6-8l.7 1.6c-2.4 1-3.2 2.7-3.2 4.4H20v7z"/></svg>',
    root: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3c-2.5 0-4 2-4 4.5 0 3 1.5 4.5 2 7 .5 3 1 6.5 2.5 6.5s1.8-3 2.2-5c.2-1 .6-1.5 2.3-1.5s2.1.5 2.3 1.5c.4 2 .7 5 2.2 5s2-3.5 2.5-6.5c.5-2.5 2-4 2-7C21 5 19.5 3 17 3c-2 0-3 1-5 1S9 3 7 3z"/><path d="M9.5 8.5l1 8M14.5 8.5l-1 8"/></svg>'
  };

  /* ---------- a toast that stays long enough to read, and a floating bubble ---------- */
  function toast(html, ms, cls){
    var t = document.createElement("div");
    t.className = "sh-egg sh-egg-toast" + (cls ? " " + cls : "");
    t.setAttribute("role", "status");
    t.innerHTML = html;
    document.body.appendChild(t);
    requestAnimationFrame(function(){ t.classList.add("is-shown"); });
    var kill = function(){ t.classList.remove("is-shown"); setTimeout(function(){ t.remove(); }, 350); };
    t.addEventListener("click", kill);
    setTimeout(kill, ms || 4200);
    return t;
  }
  function row(icon, title, sub){
    return '<span class="sh-egg-ic">' + icon + '</span><span><b>' + title + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</span>';
  }

  /* ================= Golden Probe ================= */
  function goldenQid(){
    var ex = exp(), taught = {};
    (ex.lectures || []).forEach(function(l){ if (!l.status || l.status === "taught") taught[l.id] = 1; });
    var qs = (ex.questions || []).filter(function(q){ return taught[q.lec]; });
    if (!qs.length) return null;
    return qs[hash(HUB + "|" + centralParts().day) % qs.length].id;
  }
  function checkGolden(qid){
    var day = centralParts().day;
    if (qid !== goldenQid() || ls("sh_egg_golden_" + HUB) === day) return;
    ls("sh_egg_golden_" + HUB, day);
    rpc("claim_golden_probe", { p_hub: HUB, p_visitor: VISITOR, p_qid: qid }).then(function(won){
      if (won === true) {
        H.confetti(); setTimeout(H.confetti, 450);
        toast(row(IC.probe, "You found today's Golden Probe!", "First in the class to answer it right. Your name is on the dashboard until midnight."), 7000, "is-gold");
        H.send({ t: "golden", name: H.name() });
      } else if (won === false) {
        rpc("get_golden_today", {}).then(function(rows){
          var r = (rows || []).filter(function(x){ return x.hub === HUB; })[0];
          toast(row(IC.probe, "That was today's Golden Probe", r ? esc(r.display_name) + " got to it first." : "Someone got to it first."), 5000, "is-gold");
        });
      }
    });
  }

  /* ================= Tooth Fairy ================= */
  function maybeFairy(){
    if (Math.random() >= 1 / 400) return;
    var last = +(ls("sh_egg_fairy_t") || 0);
    if (Date.now() - last < 10 * 60 * 1000) return;
    ls("sh_egg_fairy_t", String(Date.now()));
    var f = document.createElement("button");
    f.type = "button";
    f.className = "sh-egg sh-egg-fairy";
    f.setAttribute("aria-label", "Catch the Tooth Fairy");
    f.style.top = (18 + Math.random() * 45) + "vh";
    f.innerHTML = IC.wing;
    document.body.appendChild(f);
    var gone = setTimeout(function(){ f.remove(); }, 7600);
    f.addEventListener("click", function(){
      clearTimeout(gone);
      f.classList.add("is-caught");
      setTimeout(function(){ f.remove(); }, 500);
      rpc("record_fairy", { p_hub: HUB, p_visitor: VISITOR }).then(function(n){
        toast(row(IC.tooth, "You caught the Tooth Fairy!", n ? "That's " + n + " caught so far. Collectors are listed under Stats." : "She'll be back."), 5000);
      });
    });
  }

  /* ================= Plaque Boss ================= */
  var BOSS_HP = 40, boss = null, bossHidden = false, lastHitSend = 0;
  function bossId(){ var c = centralParts(); return HUB + "|" + c.day + "|" + Math.floor(c.hour / 2); }
  function bossDown(id){ return ls("sh_egg_boss_down") === id; }
  function spawnBoss(hp){
    var id = bossId();
    if (boss && boss.id === id) return;
    if (bossDown(id)) return;
    if (boss) boss.el.remove();
    var el = document.createElement("div");
    el.className = "sh-egg sh-egg-boss";
    el.innerHTML = '<span class="sh-egg-boss-face">' + IC.blob + '</span>' +
      '<span class="sh-egg-boss-body"><b>Plaque Boss</b><small>Every correct answer from anyone in the hub hits it</small>' +
      '<span class="sh-egg-boss-bar"><i></i></span></span>' +
      '<button type="button" class="sh-egg-x" aria-label="Hide the boss">×</button>';
    document.body.appendChild(el);
    el.querySelector(".sh-egg-x").addEventListener("click", function(){ bossHidden = true; el.classList.remove("is-shown"); });
    boss = { id: id, hp: Math.min(BOSS_HP, hp || BOSS_HP), el: el };
    drawBoss();
    requestAnimationFrame(function(){ if (!bossHidden && ok()) el.classList.add("is-shown"); });
  }
  function drawBoss(){
    if (!boss) return;
    boss.el.querySelector(".sh-egg-boss-bar i").style.width = (100 * boss.hp / BOSS_HP) + "%";
    boss.el.querySelector("small").textContent = boss.hp + " / " + BOSS_HP + " HP · every correct answer from anyone here hits it";
    boss.el.classList.toggle("is-shown", !bossHidden && ok());
  }
  function defeatBoss(by){
    if (!boss) return;
    ls("sh_egg_boss_down", boss.id);
    var el = boss.el; boss = null;
    el.classList.add("is-dead");
    setTimeout(function(){ el.remove(); }, 900);
    if (!on()) return;
    H.confetti(); setTimeout(H.confetti, 350); setTimeout(H.confetti, 700);
    toast(row(IC.blob, "Plaque Boss defeated!", "Final blow: " + esc(by || "someone") + ". Nice teamwork."), 6000, "is-gold");
  }
  function hitBoss(){
    if (!boss || boss.id !== bossId()) return;
    boss.hp = Math.max(0, boss.hp - 1);
    boss.el.classList.remove("is-hit"); void boss.el.offsetWidth; boss.el.classList.add("is-hit");
    drawBoss();
    if (boss.hp === 0) {
      var me = H.name();
      H.send({ t: "boss-down", id: boss.id, by: me });
      rpc("record_achievement", { p_visitor: VISITOR, p_kind: "boss", p_hub: HUB });
      defeatBoss(me);
    } else if (Date.now() - lastHitSend > 600) {
      lastHitSend = Date.now();
      H.send({ t: "hit", id: boss.id, hp: boss.hp });
    }
  }
  setInterval(function(){
    if (boss && boss.id !== bossId()) { boss.el.remove(); boss = null; }
    if (!boss && on() && H.online() >= 5) spawnBoss();
    drawBoss();
  }, 15000);

  /* ================= Luck wall (evening before + morning of an exam) ================= */
  function luckExam(){
    var c = centralParts();
    var tomorrow = new Date(c.day + "T12:00:00Z"); tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    var tmr = tomorrow.toISOString().slice(0, 10);
    var hit = null;
    (exp().exams || []).forEach(function(x){
      if (x.date === c.day && c.hour >= 5 && c.hour < 13) hit = { label: x.label, when: "today" };
      else if (x.date === tmr && c.hour >= 17) hit = { label: x.label, when: "tomorrow" };
    });
    return hit;
  }
  var luckEl = null, luckGot = 0, lastLuckSend = 0, luckQueue = 0;
  function showLuckWall(){
    var ex = luckExam();
    if (!ex || !ok() || ls("sh_egg_luck_hide") === centralParts().day) { if (luckEl) luckEl.classList.remove("is-shown"); return; }
    if (!luckEl) {
      luckEl = document.createElement("div");
      luckEl.className = "sh-egg sh-egg-luck";
      document.body.appendChild(luckEl);
      luckEl.addEventListener("click", function(e){
        if (e.target.closest(".sh-egg-x")) { ls("sh_egg_luck_hide", centralParts().day); luckEl.classList.remove("is-shown"); return; }
        if (!e.target.closest(".sh-egg-luck-send")) return;
        if (Date.now() - lastLuckSend < 20000) { floatLuck("You", true); return; }
        lastLuckSend = Date.now();
        H.send({ t: "luck", name: H.name() });
        floatLuck("You", true);
      });
    }
    luckEl.innerHTML = '<span class="sh-egg-ic">' + IC.clover + '</span><span><b>' + esc(ex.label) + ' ' + ex.when + '</b>' +
      '<small>' + (luckGot ? luckGot + " good-luck wish" + (luckGot === 1 ? "" : "es") + " from classmates so far" : "Send the class some luck") + '</small></span>' +
      '<button type="button" class="sh-egg-luck-send">Send luck</button><button type="button" class="sh-egg-x" aria-label="Hide for today">×</button>';
    requestAnimationFrame(function(){ luckEl.classList.add("is-shown"); });
  }
  function floatLuck(name, mine){
    if (!ok() || luckQueue > 5) return;
    luckQueue++;
    setTimeout(function(){
      luckQueue--;
      var b = document.createElement("div");
      b.className = "sh-egg sh-egg-luckfloat";
      b.style.left = (12 + Math.random() * 70) + "vw";
      b.innerHTML = IC.clover + '<span>' + (mine ? "Luck sent!" : esc(name) + " sends luck") + '</span>';
      document.body.appendChild(b);
      setTimeout(function(){ b.remove(); }, 4200);
    }, luckQueue * 700);
  }
  setTimeout(showLuckWall, 1500);
  setInterval(showLuckWall, 60000);

  /* ================= broadcasts from classmates ================= */
  document.addEventListener("sh:egg", function(e){
    var d = e.detail || {};
    if (d.t === "hit" && d.id === bossId()) {
      if (!boss) spawnBoss(d.hp);
      if (boss && typeof d.hp === "number" && d.hp < boss.hp) { boss.hp = Math.max(0, d.hp); drawBoss(); }
      if (boss && boss.hp === 0) defeatBoss("a classmate");
    } else if (d.t === "boss-down" && d.id === bossId()) {
      if (!boss) { ls("sh_egg_boss_down", d.id); return; }
      defeatBoss(String(d.by || "a classmate").slice(0, 40));
    } else if (d.t === "luck") {
      luckGot++;
      floatLuck(String(d.name || "A classmate").slice(0, 40));
      if (luckEl) showLuckWall();
    } else if (d.t === "golden" && ok()) {
      toast(row(IC.probe, esc(String(d.name || "A classmate").slice(0, 40)) + " just found today's Golden Probe", "One question here is golden each day. Tomorrow it could be you."), 5000, "is-gold");
    }
  });

  /* ================= answer-driven eggs ================= */
  var wrongRun = 0, rightAfter = 0;
  document.addEventListener(H.answeredEvent, function(e){
    var d = (e && e.detail) || {};
    if (!ok()) return;
    var correct = !!d.correct;
    if (correct) { checkGolden(String(d.qid || "")); hitBoss(); if (sh8bit) blip(); }
    /* Through the Root Canal: 10 misses in a row, then 10 right in a row */
    if (!correct) { if (rightAfter) { wrongRun = 0; rightAfter = 0; } wrongRun++; }
    else if (wrongRun >= 10) {
      rightAfter++;
      if (rightAfter === 10) {
        wrongRun = 0; rightAfter = 0;
        H.confetti();
        rpc("record_achievement", { p_visitor: VISITOR, p_kind: "rootcanal", p_hub: HUB });
        toast(row(IC.root, "Through the Root Canal", "Ten misses, then ten straight right. That's the whole procedure."), 6000, "is-gold");
      }
    } else wrongRun = 0;
    /* Night Owl: once a night, 2-4 am local */
    var h = new Date().getHours();
    if (h >= 2 && h < 4) {
      var night = new Date().toDateString();
      if (ls("sh_egg_owl") !== night) {
        ls("sh_egg_owl", night);
        rpc("record_achievement", { p_visitor: VISITOR, p_kind: "owl", p_hub: HUB });
        toast(row(IC.owl, "Night Owl", "Studying at " + new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) + ". Respect. Now go to sleep."), 6000);
      }
    }
    maybeFairy();
  });

  /* ================= Professor soundboard: tap a name 5 times ================= */
  var profTaps = { who: "", n: 0, t: 0 };
  document.addEventListener("click", function(e){
    if (!ok()) return;
    var lecs = exp().lectures || [];
    if (!lecs.length) return;
    var el = e.target, who = null;
    for (var i = 0; i < 3 && el && el !== document.body && !who; i++, el = el.parentElement) {
      var txt = (el.textContent || "").trim();
      if (txt.length > 70) break;
      lecs.forEach(function(l){ if (!who && l.who && txt.indexOf(l.who) === 0) who = l.who; });
    }
    if (!who) return;
    var now = Date.now();
    if (profTaps.who !== who || now - profTaps.t > 2500) profTaps = { who: who, n: 0, t: now };
    profTaps.n++; profTaps.t = now;
    if (profTaps.n < 5) return;
    profTaps.n = 0;
    var ids = {}; lecs.forEach(function(l){ if (l.who === who) ids[l.id] = 1; });
    var pool = (exp().hints || []).filter(function(x){ return ids[x.lec] && x.quote; });
    if (!pool.length) return;
    var q = pool[Math.floor(Math.random() * pool.length)].quote.replace(/\s+/g, " ").trim();
    if (q.length > 240) q = q.slice(0, 240).replace(/\s+\S*$/, "") + "…";
    toast('<span class="sh-egg-ic">' + IC.quote + '</span><span><span class="sh-egg-quote">' + esc(q) + '</span><small>— ' + esc(who) + '</small></span>', 9000, "is-quote");
  }, true);

  /* ================= keyboard: Konami → 8-bit, "floss" → dancing tooth ================= */
  var KONAMI = "ArrowUp ArrowUp ArrowDown ArrowDown ArrowLeft ArrowRight ArrowLeft ArrowRight b a";
  var keys = [], sh8bit = false, audioCtx = null;
  document.addEventListener("keydown", function(e){
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    keys.push(e.key.length === 1 ? e.key.toLowerCase() : e.key);
    if (keys.length > 10) keys.shift();
    if (!on()) return;
    if (keys.join(" ") === KONAMI) { keys = []; toggle8bit(); }
    else if (keys.slice(-5).join("") === "floss") { keys = []; if (!inMock()) floss(); }
  });
  /* phones: the same code as swipes (up up down down left right left right) then two taps;
     each gesture must follow the last within 1.5 s, so ordinary scrolling never completes it */
  var swipes = [], touch0 = null, lastGesture = 0, SWIPE_CODE = "U U D D L R L R T T";
  document.addEventListener("touchstart", function(e){
    if (e.touches.length !== 1) { touch0 = null; return; }
    touch0 = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });
  document.addEventListener("touchend", function(e){
    if (!touch0 || !on()) return;
    var t = e.changedTouches[0], dx = t.clientX - touch0.x, dy = t.clientY - touch0.y, g;
    touch0 = null;
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12) g = "T";
    else if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) g = dx < 0 ? "L" : "R";
    else if (Math.abs(dy) > 40 && Math.abs(dy) > Math.abs(dx) * 1.5) g = dy < 0 ? "U" : "D";
    else return;
    var now = Date.now();
    if (now - lastGesture > 1500) swipes = [];
    lastGesture = now;
    swipes.push(g);
    if (swipes.length > 10) swipes.shift();
    if (swipes.join(" ") === SWIPE_CODE) { swipes = []; toggle8bit(); }
  }, { passive: true });
  function toggle8bit(){
    sh8bit = !sh8bit;
    if (sh8bit && !document.getElementById("sh-egg-8bit-font")) {
      var l = document.createElement("link");
      l.id = "sh-egg-8bit-font"; l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=VT323&display=swap";
      document.head.appendChild(l);
    }
    document.documentElement.classList.toggle("sh-8bit", sh8bit);
    toast(row(IC.tooth, sh8bit ? "8-bit mode" : "Back to 2026", sh8bit ? "Correct answers go blip. Do the code again to leave." : ""), 3200);
    if (sh8bit) blip(true);
  }
  function blip(up){
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      var o = audioCtx.createOscillator(), g = audioCtx.createGain(), t0 = audioCtx.currentTime;
      o.type = "square";
      o.frequency.setValueAtTime(up ? 523 : 880, t0);
      o.frequency.setValueAtTime(up ? 784 : 1320, t0 + 0.07);
      g.gain.setValueAtTime(0.06, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18);
      o.connect(g); g.connect(audioCtx.destination); o.start(t0); o.stop(t0 + 0.2);
    } catch (e) {}
  }
  function floss(){
    if (document.querySelector(".sh-egg-floss")) return;
    var d = document.createElement("div");
    d.className = "sh-egg sh-egg-floss";
    d.setAttribute("aria-hidden", "true");
    d.innerHTML = '<svg viewBox="0 0 80 90"><g class="egg-fl-arms" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M18 40l-12 10"/><path d="M62 40l12 10"/></g>' +
      '<path class="egg-fl-string" d="M4 52C30 70 50 70 76 52" fill="none" stroke="var(--egg-floss,#3ecf7e)" stroke-width="2"/>' +
      '<g class="egg-fl-body"><path fill="var(--egg-fairy-fill,#fff)" stroke="currentColor" stroke-width="3" stroke-linejoin="round" d="M26 12c-7 0-11 5-11 12 0 8 4 12 5 19 1 8 3 17 7 17s5-8 6-13c.5-3 1.5-4 7-4s6.5 1 7 4c1 5 2 13 6 13s6-9 7-17c1-7 5-11 5-19 0-7-4-12-11-12-5 0-8 2-14 2s-9-2-14-2z"/>' +
      '<circle cx="32" cy="30" r="2.6" fill="currentColor"/><circle cx="48" cy="30" r="2.6" fill="currentColor"/><path d="M33 38c4 4 10 4 14 0" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></g></svg>';
    document.body.appendChild(d);
    setTimeout(function(){ d.remove(); }, 4600);
  }

  /* ================= Stats panel: today's Golden Probe + Tooth Fairy collectors ================= */
  var boardAt = 0;
  document.addEventListener("click", function(){
    setTimeout(function(){
      var p = H.statsPanel();
      if (!p || !p.classList.contains("is-open") || !on()) return;
      var box = p.querySelector(".sh-egg-board");
      if (box && Date.now() - boardAt < 30000) return;
      boardAt = Date.now();
      if (!box) { box = document.createElement("div"); box.className = "sh-egg-board"; p.appendChild(box); }
      Promise.all([rpc("get_golden_today", {}), rpc("get_fairy_board", { p_limit: 5 })]).then(function(r){
        var g = (r[0] || []).filter(function(x){ return x.hub === HUB; })[0];
        var fairies = r[1] || [];
        box.innerHTML = '<div class="sh-egg-board-h">' + IC.probe + '<span>Golden Probe</span></div>' +
          '<p>' + (g ? "Today's was found by <b>" + esc(g.display_name) + "</b>. A new one hides here tomorrow."
                    : "One question in this hub is golden today. The first classmate to answer it right claims it.") + '</p>' +
          (fairies.length ? '<div class="sh-egg-board-h">' + IC.tooth + '<span>Tooth Fairy collectors</span></div><ol>' +
            fairies.map(function(f){ return '<li><span>' + esc(f.display_name) + '</span><b>' + f.catches + '</b></li>'; }).join("") + '</ol>' : "");
      });
    }, 60);
  });
})();
