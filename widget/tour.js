/* study-hubs guided tours: one for the dashboard, one for the inside of a hub.
   Loaded by index.html (the dashboard) and by widget/v3.js in every hub.

   The first time someone opens the dashboard, and separately the first time they open any hub, a card asks whether they
   want the tour ("Show me around" / "No thanks"). Either answer is remembered (sh_tour on the dashboard, sh_tour_hub for
   the hubs: "done" | "skipped" | "no") so it never asks again there, and a Tour button starts it any time: #tourBtn in
   the dashboard's top bar; in a hub, .sh-ribbon-tour in the top bar and "Take the tour" in the widget menu (v3.js).

   A step puts a spotlight on a real part of the page; a step with no part is a plain card. A step can first do
   something (switch a hub to Review, open Lecture Notes, open the launcher menu) and then find its part; steps whose
   part isn't on the page for this visitor are left out. A hub tour puts the hub back on the mode and tab it started on.

   shTour.mount({ where: "hub", hub })   // v3.js: hub steps, and ask once
   shTour.start()                        // run it now (the Tour buttons)
   shTour.maybePrompt()                  // ask once (the dashboard calls this itself)
   shTour.whenIdle(fn)                   // run fn once neither the question nor the tour is on screen (other pop-ups wait) */
(function(){
  "use strict";
  if (window.shTour) return;

  var WHERE = "dashboard", HUB = null;
  function key(){ return WHERE === "hub" ? "sh_tour_hub" : "sh_tour"; }
  function ls(k, v){ try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function track(what){ if (window.shTrack) window.shTrack((WHERE === "hub" ? "tour-hub:" : "tour:") + what); }
  var reduced = false;
  try { reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  /* colors and fonts come from the page's own tokens: the dashboard's (--surface, --ink-2, --serif) or a hub's
     (--surface, --ink-soft, --font-display), with fallbacks */
  var CSS = [
    ".sh-tour, .sh-tour-toast{--sht-bg:var(--surface,#fff); --sht-bg2:var(--surface-2, var(--bg,#F3F6F8)); --sht-ink:var(--ink,#15202A);",
    "  --sht-ink2:var(--ink-soft, var(--ink-2,#3E4C57)); --sht-ink3:var(--ink-faint, var(--ink-3,#6B7A86)); --sht-line:var(--line,#D3DADF);",
    "  --sht-font:var(--font-body, var(--sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif)); --sht-display:var(--font-display, var(--serif, Georgia, serif));}",
    ".sh-tour-block{position:fixed; inset:0; z-index:20000; background:transparent;}",
    ".sh-tour-block.is-dim{background:rgba(8,14,18,.55);}",
    /* one dim layer with a rounded hole cut where the spotlight is (a huge box-shadow doesn't paint on every page, and
       four panels around the spot left seams and square corners when zoomed in) */
    ".sh-tour-dim{position:fixed; inset:0; z-index:20000; background:rgba(8,14,18,.55); pointer-events:none; transition:clip-path .3s ease;}",
    ".sh-tour-dim[hidden]{display:none;}",
    "html.sh-tour-follow .sh-tour-dim, html.sh-tour-follow .sh-tour-spot, html.sh-tour-follow .sh-tour{transition:none;}",   /* while the page scrolls: stick to the part, don't trail it */
    "html.sh-touring .survey, html.sh-touring .sh-reply{visibility:hidden;}",     /* an open survey or reply card steps aside */
    ".sh-tour-spot{position:fixed; z-index:20001; border-radius:14px; pointer-events:none; box-shadow:0 0 0 2px var(--focus, var(--accent,#2F6FD6));",
    "  transition:left .3s ease, top .3s ease, width .3s ease, height .3s ease, opacity .2s;}",
    ".sh-tour-spot[hidden]{display:block; opacity:0;}",
    ".sh-tour{position:fixed; z-index:20002; box-sizing:border-box; width:min(380px, calc(100vw - 32px)); background:var(--sht-bg); color:var(--sht-ink); font-family:var(--sht-font);",
    "  border:1px solid var(--sht-line); border-radius:16px; box-shadow:0 2px 4px rgba(0,0,0,.08), 0 24px 48px -16px rgba(0,0,0,.5); padding:20px 20px 16px; text-align:left;",
    "  max-height:calc(100vh - 32px); max-height:calc(100dvh - 32px); overflow:auto; transition:left .3s ease, top .3s ease, opacity .2s;}",
    ".sh-tour *{box-sizing:border-box;}",
    ".sh-tour.is-center{left:50% !important; top:50% !important; transform:translate(-50%,-50%); width:min(440px, calc(100vw - 32px));}",
    ".sh-tour-x{position:absolute; top:10px; right:10px; width:32px; height:32px; border:0; border-radius:50%; background:transparent; color:var(--sht-ink3); font-size:22px; line-height:1; cursor:pointer; padding:0;}",
    ".sh-tour-x:hover{background:var(--sht-bg2); color:var(--sht-ink);}",
    ".sh-tour-eyebrow{font-size:12px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:var(--sht-ink3);}",
    ".sh-tour h3{font-family:var(--sht-display); font-weight:400; font-size:25px; line-height:1.15; margin:4px 32px 8px 0; color:var(--sht-ink); letter-spacing:0; text-transform:none;}",
    ".sh-tour-body{font-size:14.5px; line-height:1.5; color:var(--sht-ink2);}",
    ".sh-tour-body p{margin:0 0 8px;} .sh-tour-body b{color:var(--sht-ink);}",
    ".sh-tour-body ul{margin:4px 0 8px; padding-left:18px;} .sh-tour-body li{margin:0 0 5px;}",
    ".sh-tour-bar{height:3px; border-radius:3px; background:var(--sht-line); margin:12px 0 0; overflow:hidden;}",
    ".sh-tour-bar i{display:block; height:100%; background:var(--sht-ink); border-radius:3px; transition:width .3s ease;}",
    ".sh-tour-foot{display:flex; align-items:center; gap:8px; margin:14px -20px -16px; padding:8px 20px 16px; position:sticky; bottom:-16px; background:var(--sht-bg);}",   /* stays in view when a long card scrolls */
    ".sh-tour-skip{margin-right:auto; font:inherit; font-size:13.5px; border:0; background:none; color:var(--sht-ink3); cursor:pointer; text-decoration:underline; text-underline-offset:3px; padding:6px 2px;}",
    ".sh-tour-btn{display:inline-flex; align-items:center; justify-content:center; font:inherit; font-size:14px; font-weight:600; line-height:1.2; padding:9px 16px; border-radius:999px;",
    "  border:1px solid var(--sht-line); background:transparent; color:var(--sht-ink); cursor:pointer; text-decoration:none; white-space:nowrap;}",
    ".sh-tour-btn:hover{background:var(--sht-bg2);}",
    ".sh-tour-btn.is-primary{background:var(--sht-ink); border-color:var(--sht-ink); color:var(--sht-bg);}",
    ".sh-tour-btn.is-primary:hover{opacity:.9;}",
    ".sh-tour-toast{position:absolute; z-index:10003; width:min(280px, calc(100vw - 32px)); background:var(--sht-ink); color:var(--sht-bg); font-family:var(--sht-font); border-radius:12px;",
    "  padding:10px 14px; font-size:14px; line-height:1.4; box-shadow:0 12px 30px -12px rgba(0,0,0,.5); opacity:0; transform:translateY(-4px); transition:opacity .25s, transform .25s;}",
    ".sh-tour-toast.is-shown{opacity:1; transform:none;}",
    ".sh-tour-toast::before{content:''; position:absolute; top:-6px; right:var(--arrow,20px); width:12px; height:12px; background:inherit; transform:rotate(45deg); border-radius:2px;}",
    ".sh-tour-toast.is-below::before{top:auto; bottom:-6px;}",
    "@media (max-width:640px){",
    "  .sh-tour:not(.is-center){left:8px !important; right:8px; top:auto !important; bottom:calc(8px + env(safe-area-inset-bottom, 0px)); width:auto; max-height:52vh; padding:16px 16px 14px;}",
    "  .sh-tour.is-top:not(.is-center){top:calc(8px + env(safe-area-inset-top, 0px)) !important; bottom:auto; max-height:46vh;}",    /* the part is low on the screen (the phone bar) */
    "  .sh-tour h3{font-size:22px;} .sh-tour-body{font-size:14px;}",
    "  .sh-tour:not(.is-center) .sh-tour-foot{margin:10px -16px -14px; padding:8px 16px 14px; bottom:-14px;}",
    "}",
    /* short screens (a laptop zoomed to 200% or more, a phone on its side): smaller type so the card isn't all scrollbar */
    "@media (max-height:560px){",
    "  .sh-tour{padding:14px 16px 12px;} .sh-tour h3{font-size:19px; margin:2px 32px 6px 0;} .sh-tour-body{font-size:13.5px; line-height:1.45;}",
    "  .sh-tour-eyebrow{font-size:11px;} .sh-tour-bar{margin-top:8px;} .sh-tour-x{top:6px; right:6px;}",
    "  .sh-tour-foot, .sh-tour:not(.is-center) .sh-tour-foot{margin:8px -16px -12px; padding:6px 16px 12px; bottom:-12px;}",
    "  .sh-tour-btn{padding:7px 13px; font-size:13.5px;}",
    "}",
    "@media (prefers-reduced-motion: reduce){ .sh-tour, .sh-tour-spot, .sh-tour-dim, .sh-tour-bar i, .sh-tour-toast{transition:none;} }"
  ].join("\n");

  function visible(el){
    if (!el || el.closest("[hidden]")) return false;
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }
  function $(sel){ return document.querySelector(sel); }
  function $$(sel){ return [].slice.call(document.querySelectorAll(sel)); }
  function txt(el){ return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }
  function timmyOn(){ return (ls("sh_pref_pet") || "on") !== "off"; }
  function phone(){ return window.innerWidth <= 640; }
  /* fixed or sticky parts (the hub's top bar, the launcher) don't need the page scrolled to them */
  function pinned(el){
    for (var e = el; e && e !== document.body; e = e.parentElement) {
      var p = getComputedStyle(e).position; if (p === "fixed" || p === "sticky") return true;
    }
    return false;
  }

  /* ---------- the dashboard's steps (top bar, then top to bottom; what's inside a hub is the hub's own tour) ---------- */
  function dashSteps(){
    var S = [];
    S.push({ title: "Welcome to Study Hubs",
      body: "<p>This tour shows you everything on this page. It takes about a minute, and each hub has its own tour inside it.</p>" +
        "<p>Use <b>Next</b> and <b>Back</b> (or the arrow keys). You can leave any time, and start it again from the <b>Tour</b> button at the top.</p>" });
    S.push({ el: ".live-pill", title: "Studying now",
      body: "<p>The green dot counts classmates who have a hub open right now, live.</p>" });
    S.push({ el: "#inboxBtn", title: "Inbox",
      body: "<p>Report a mistake or send a suggestion from any hub, and the reply lands here once it's dealt with. Notices to the whole class and the occasional short survey come here too.</p><p>A number on it means something new.</p>" });
    S.push({ el: "#setBtn", title: "Settings",
      body: "<p>Font, text size, background sounds (rain, ocean, coffee shop, lo-fi, piano), accent colors you unlock by rank, surprises on or off, Timmy Tooth, nuke alerts and your name.</p><p>Set them once here and they apply in every hub.</p>" });
    S.push({ el: "#themeBtn", title: "Light or dark",
      body: "<p>Switch between light, dark, or whatever your device uses.</p>" });
    S.push({ el: "#aboutBtn", title: "About the hubs",
      body: "<p>The full manual: every feature, all the arcade games, all 24 trophies, and, if you tick <b>Show spoilers</b>, how to find every easter egg.</p>" });
    S.push({ el: "#greeting", title: "Your name",
      body: "<p>Everyone starts with a random class name like “Gleaming Molar”. It's the name classmates see on the leaderboards.</p><p>Tap <b>Pick your name</b> to choose your own, or keep the random one to stay anonymous.</p>" });
    S.push({ el: "#meRank", title: "Your handpiece rank",
      body: "<p>You earn XP in every hub: <b>10</b> for a new question right, <b>2</b> for a repeat, <b>1</b> for trying, and <b>20</b> for each day you study.</p>" +
        "<p>XP moves you up seven handpiece ranks, from Stone to Dark Matter, each with levels I, II and III. Each rank unlocks its metal as an accent in Settings.</p>" });
    if (timmyOn()) {
      if (visible($("#petHome"))) S.push({ el: "#petHome", title: "Timmy Tooth's house",
        body: "<p>Your tooth buddy. His health comes from your answers in every hub: study and he stays healthy; skip days and he picks up plaque, then a cavity. He can't die.</p>" +
          "<p>Tap him for a joke, <b>Checkup</b> for his chart, and <b>Secret tip</b> for hints about the easter eggs. Settings turns him off.</p>" });
      else S.push({ el: ".shpet-perch", title: "Meet Timmy Tooth",
        body: "<p>The little tooth sitting on your name is Timmy, an optional tooth buddy. Tap him after the tour to meet him.</p>" +
          "<p>His health comes from how much you study, he tells jokes, and he drops hints about the easter eggs. Don't want him? Settings turns him off.</p>" });
    }
    S.push({ el: "#hero", title: "Your next exam",
      body: "<p>A countdown to the next exam, with <b>Start studying</b> and <b>Daily drill</b> buttons. Other exams in the next two weeks are listed underneath.</p>" +
        "<p>Beside it: your progress in that hub and your last two weeks of study days, with your streak and accuracy. The day before an exam, you can send classmates luck here.</p>" });
    S.push({ el: "#hubs", title: "The hubs",
      body: "<p>One card per exam, grouped by class: what it covers, its modes, your progress, and a Daily drill row. <b>Open</b> takes you in.</p>" +
        "<p>After the exam, a <b>Check in</b> button asks how it went; your answers shape the next hubs. A hub archives itself the night of its last exam.</p>" });
    S.push({ el: function(){ var h = $("#pulseHead"); return h && h.closest("section"); }, title: "The class",
      body: "<p>Live boards for everyone using the hubs: handpiece ranks, study streaks, right answers in a row, the busiest study hours, and arcade high scores.</p>" +
        "<p>Medals next to a name show which hubs that person has mastered.</p>" });
    S.push({ el: "#recaps", title: "Hub recaps",
      body: "<p>After an exam, a recap of how the class used that hub: hours studied, accuracy, the hardest question and more. <b>Save image</b> keeps one.</p>" });
    S.push({ el: "#changelog", title: "What's new",
      body: "<p>Every update to the hubs, newest first. Updates go live at this same link, so bookmark this page rather than a single hub.</p>" });

    S.push({ title: "Trophies and surprises",
      body: "<p>There are 24 trophies to earn, plus 9 in every hub, and many of them are secret. The hubs also hide easter eggs, a daily Golden Probe question, and bosses the whole class fights together when five or more of you are online.</p>" +
        "<p>Timmy's <b>Secret tip</b> gives hints. Rather study in peace? <b>Settings → Extras</b> turns them off, one at a time or all at once.</p>" });
    /* what's inside a hub is the hub's own tour, on the real buttons; this one only points there */
    S.push({ el: function(){ var b = $("#hubs a.btn-primary[data-hub]"); return visible(b) ? b : $("#hubs"); }, title: "Inside a hub",
      body: "<p>The first time you open a hub, it offers its own tour: a spotlight on the real buttons for the notes and narration, the question bank, mock exam, daily drill, Review, Arcade and search.</p>" +
        "<p>Take it again any time from the hub's <b>Tour</b> button, or <b>Take the tour</b> under <b>More</b> on a phone.</p>" });
    S.push({ el: "#tourBtn", title: "That's the tour", last: true, about: "about/",
      body: "<p>Start it again any time from this <b>Tour</b> button. For every detail, open <b>About</b>.</p><p>Happy studying!</p>" });
    return S;
  }

  /* ---------- a hub's steps: its top bar, then Compendium tab by tab, Review, Arcade, the launcher ---------- */
  var SUB_INFO = [
    [/course home|home/i, "quick links, your countdown and progress, and the course map"],
    [/lecture notes|notes/i, "every lecture in full, to read or listen to"],
    [/question bank|bank/i, "every question, filtered by lecture, type or source"],
    [/mock/i, "a timed, exam-length practice test, scored by lecture"],
    [/weak/i, "the questions you missed and the ones due for review"],
    [/recall|flash/i, "hide-and-reveal flashcards"],
    [/cram/i, "the whole course on one page, for the night before"],
    [/hint/i, "what the professors said would be tested, in their own words"]
  ];
  function subtabs(){ return $$("#panel-compendium .subtabs button, #compendium-subnav button"); }
  function subtab(re){ return subtabs().filter(function(b){ return re.test(txt(b)); })[0]; }
  function modeTab(m){ return $('#modeSwitch [data-mode="' + m + '"]'); }
  function isOn(b){ return b && (b.getAttribute("aria-selected") === "true" || b.getAttribute("aria-pressed") === "true" || /(^|\s)(is-active|active|is-on|on)(\s|$)/.test(b.className)); }
  function press(b){ if (b && !isOn(b)) b.click(); }
  function launcherOpen(open){
    var root = $("#shstat-root"); if (!root) return;
    if (!open) { if (window.shCloseWidgetPanels) window.shCloseWidgetPanels(); return; }
    if (phone()) { var more = $("#shstat-more-pill"); if (more && !root.classList.contains("is-more-open")) more.click(); }
    else { var l = $("#shstat-launch"); if (l && !root.classList.contains("is-menu-open")) l.click(); }
  }
  function hubTitle(){
    var t = txt($(".hub-title h1")) || txt($(".hub-title")) || document.title;
    return t.replace(/\s*\bhub\b\s*$/i, "") || "this hub";
  }
  function hubSteps(){
    var S = [], name = hubTitle();
    S.push({ title: "Welcome to " + name,
      body: "<p>This tour shows you where everything in this hub is, with a spotlight on the real buttons. It takes about two minutes, and it'll switch tabs for you along the way, then bring you back.</p>" +
        "<p>Every hub works the same way, so you only need it once. Start it again any time from " + (phone() ? "<b>Take the tour</b> under <b>More</b>" : "the <b>Tour</b> button") + ".</p>" });
    S.push({ el: "#modeSwitch", title: "Three modes",
      body: "<ul><li><b>Compendium</b>: notes, questions, the mock exam and the rest of the course.</li>" +
        "<li><b>Review</b>: every reference table, searchable, with a switch to hide the answers and quiz yourself.</li>" +
        "<li><b>Arcade</b>: games built on the material, with class high scores.</li></ul>" });
    S.push({ el: "#countdownPill", title: "Exam countdown",
      body: "<p>Days to the exam. It glows the day before and pulses on exam day.</p>" });
    S.push({ el: "#sh-ribbon-name", title: "Your name and rank",
      body: "<p>The name classmates see on the leaderboards, with your handpiece rank. Tap it to pick your own name.</p>" });
    S.push({ el: ".sh-ribbon-inbox[data-sh-inbox]", title: "Inbox",
      body: "<p>Replies to anything you report or suggest, notices to the class, and the occasional survey. A dot means something new.</p>" });
    S.push({ before: function(){ press(modeTab("compendium")); }, el: "[data-sh-podcast] > *", title: "Timmy Time",
      body: "<p>A podcast review of the whole exam, hosted by Timmy Tooth: every lecture in the order the exam weighs them, what the professors said to know, and a lightning round at the end. It keeps playing while you switch tabs.</p>" });
    S.push({ before: function(){ press(modeTab("compendium")); }, el: "#panel-compendium .quick-start", title: "Quick start",
      body: "<p>One tap to the questions you haven't tried, today's Daily drill, or the next lecture's notes.</p>" });
    S.push({ el: "#examCard", title: "Exam details",
      body: "<p>When and where the exam is, how many questions and what kind, and tips from the professor. Tap the header to fold it away.</p>" });
    S.push({ before: function(){ press(modeTab("compendium")); }, el: function(){ var b = subtabs()[0]; return b && b.parentElement; }, title: "The Compendium tabs",
      body: function(){
        var items = subtabs().map(function(b){
          var label = txt(b).replace(/\s*\(\d+\)$/, ""), info = SUB_INFO.filter(function(x){ return x[0].test(label); })[0];
          return "<li><b>" + label + "</b>" + (info ? ": " + info[1] : "") + "</li>";
        });
        return "<ul>" + items.join("") + "</ul>";
      } });
    S.push({ before: function(){ press(modeTab("compendium")); press(subtab(/notes/i)); }, wait: 450,
      el: function(){ var b = $$(".sh-tts-btn").filter(visible)[0]; return b && (b.closest(".sh-tts-row, .reading-tools, .notes-tools") || b.parentElement); }, title: "Lecture Notes",
      body: function(){
        var lv = $$("button").filter(function(b){ return visible(b) && /plain english/i.test(txt(b)); }).length;
        var mm = $$("button, summary").filter(function(b){ return visible(b) && /mind map/i.test(txt(b)); }).length;
        return "<ul><li><b>Listen</b>: recorded narration of the lecture, with speed control. It remembers where you stopped, and a small player follows you as you scroll.</li>" +
          (lv ? "<li><b>As taught / Plain English</b>: the professor's wording or a plain rewrite, each with its own narration.</li>" : "") +
          (mm ? "<li><b>Show mind map</b>: the lecture's outline as a branching tree.</li>" : "") + "</ul>";
      } });
    S.push({ el: function(){ var p = $$(".reading-prose p, .reading-prose li").filter(visible)[0]; return p; }, title: "Highlighter",
      body: "<p>Select any text in the notes and tap <b>Highlight</b>, in yellow, green, blue, pink or orange. Tap a highlight to recolor or remove it. Highlights stay on this device.</p>" +
        "<p>Some lectures also have drawn diagrams right next to the paragraph they explain, and a few you can play with.</p>" });
    S.push({ before: function(){ press(modeTab("compendium")); press(subtab(/question bank|bank/i)); }, wait: 450,
      el: function(){ return $$("#panel-compendium .qcard").filter(visible)[0]; }, title: "The Question Bank",
      body: "<p>Answer and you see right away whether you got it, the explanation, <b>why each choice</b> is right or wrong, and what percent of the class got it right.</p>" +
        "<p>Spot a mistake? The <b>Report</b> button on every question sends it in, and you get a reply in your Inbox when it's fixed. Filters at the top narrow it by lecture, type or source.</p>" });
    S.push({ before: function(){ press(modeTab("review")); }, wait: 450, el: "#panel-review", title: "Review",
      body: "<p>Every reference table for the course in one place: comparisons, drug cards, processes, look-alikes side by side. Search it, or switch on <b>hide answers</b> to quiz yourself.</p>" });
    S.push({ before: function(){ press(modeTab("arcade")); }, wait: 450, el: function(){ return $("#panel-arcade .ar-grid") || $("#panel-arcade"); }, title: "Arcade",
      body: "<p>Six games built on this hub's material, each with a class high-score board: a quiz board, an escape room, fill-in-the-blank and more. The ones that use the question bank count toward your stats and XP, and you can replay just the questions you missed.</p>" });
    S.push({ before: function(){ restore(); launcherOpen(true); }, wait: 350,
      el: function(){ return phone() ? $("#shstat-root .shm-group") : $("#shstat-menu"); }, title: phone() ? "More" : "Study tools",
      body: "<ul><li><b>Search</b> finds any word in the notes, review tables, hints and questions, and jumps right to it.</li>" +
        "<li><b>Daily drill</b>: 10, 20 or 30 questions a day from what's due, what you missed and what the class finds hard.</li>" +
        "<li><b>Class stats</b>: your mastery, the trophy case, today's Golden Probe, and <b>Link my devices</b> so your phone and laptop count as one you.</li>" +
        "<li><b>Settings</b>: font, text size, background sounds, accent, surprises, Timmy Tooth.</li>" +
        "<li><b>Suggest something</b> or <b>Report an issue</b>: replies come to your Inbox.</li></ul>" });
    if (phone()) S.push({ before: function(){ launcherOpen(false); }, wait: 250, el: "#shstat-menu", title: "The bottom bar",
      body: "<p><b>Search</b>, today's <b>Drill</b>, <b>Stats</b>, and <b>More</b> for everything else. It's on every hub page.</p>" });
    S.push({ before: function(){ launcherOpen(false); }, el: ".shpet-home", title: "Timmy Tooth",
      body: "<p>Your tooth buddy keeps you company in the corner. Right answers heal him; skipped days give him plaque and worse. Tap him for a joke. He hides during mock exams.</p>" });
    S.push({ before: function(){ launcherOpen(false); }, el: "#sh-ribbon-back", title: "Back to all hubs",
      body: "<p>The arrow takes you to the dashboard: every hub, your rank, the class boards and what's new.</p>" });
    S.push({ before: function(){ launcherOpen(false); }, last: true, title: "That's the tour",
      el: function(){ var b = $(".sh-ribbon-tour"); return visible(b) ? b : null; },
      body: function(){
        return "<p>Start it again any time from " + (visible($(".sh-ribbon-tour")) ? "this <b>Tour</b> button, or " : "") +
          "<b>Take the tour</b> in the " + (phone() ? "<b>More</b> menu" : "menu in the bottom-right corner") + ".</p>" +
          "<p>Easter eggs, trophies and secrets are hiding too. Timmy's tips and the trophy case in <b>Class stats</b> have clues. Good luck!</p>";
      } });
    return S;
  }

  /* where a hub tour started, so it can put things back */
  var home = null;
  function remember(){
    if (WHERE !== "hub") return;
    home = { mode: $$("#modeSwitch [data-mode]").filter(isOn)[0] || null, sub: subtabs().filter(isOn)[0] || null, y: window.pageYOffset };
  }
  function restore(){
    if (!home) return;
    press(home.mode);
    if (home.sub && document.contains(home.sub)) press(home.sub);
    else if (home.sub) { var again = subtab(new RegExp("^" + txt(home.sub).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$")); press(again); }
  }

  /* ---------- whenIdle: other pop-ups wait for the question and the tour ---------- */
  var busy = false, waiting = [];
  function idle(wait){ busy = false; var w = waiting; waiting = []; w.forEach(function(fn){ setTimeout(fn, wait || 600); }); }
  function whenIdle(fn){ if (busy) waiting.push(fn); else fn(); }

  function ensureCss(){
    if (document.getElementById("sh-tour-css")) return;
    var st = document.createElement("style"); st.id = "sh-tour-css"; st.textContent = CSS; document.head.appendChild(st);
  }

  /* ---------- the tour ---------- */
  var T = null;
  function resolve(s){ var el = typeof s.el === "function" ? s.el() : $(s.el); return visible(el) ? el : null; }
  function start(){
    if (T) return;
    ensureCss(); busy = true; remember();
    document.documentElement.classList.add("sh-touring");
    /* steps that don't change the page can be checked now; the others are checked when reached */
    var list = (WHERE === "hub" ? hubSteps() : dashSteps()).filter(function(s){
      if (!s.el || s.before || WHERE === "hub") return true;       /* a hub changes under the tour: check each part on arrival */
      s.node = resolve(s); return !!s.node || s.last;
    });
    var back = document.activeElement;
    var block = document.createElement("div"); block.className = "sh-tour-block is-dim";
    var dim = document.createElement("div"); dim.className = "sh-tour-dim"; dim.hidden = true; document.body.appendChild(dim);
    var spot = document.createElement("div"); spot.className = "sh-tour-spot"; spot.hidden = true;
    var card = document.createElement("section"); card.className = "sh-tour";
    card.setAttribute("role", "dialog"); card.setAttribute("aria-modal", "true"); card.setAttribute("aria-labelledby", "shTourH");
    document.body.appendChild(block); document.body.appendChild(spot); document.body.appendChild(card);
    T = { list: list, i: 0, block: block, dim: dim, spot: spot, card: card, back: back, raf: 0, seq: 0 };
    track("start");

    function onMove(){
      var h = document.documentElement; h.classList.add("sh-tour-follow");
      clearTimeout(T && T.follow); if (T) T.follow = setTimeout(function(){ h.classList.remove("sh-tour-follow"); }, 160);
      if (T && !T.raf) T.raf = requestAnimationFrame(function(){ if (T) { T.raf = 0; place(); } });
    }
    T.onMove = onMove;
    window.addEventListener("scroll", onMove, { passive: true });
    window.addEventListener("resize", onMove);
    card.addEventListener("click", function(e){
      var b = e.target.closest("[data-act]"); if (!b) return;
      var a = b.getAttribute("data-act");
      if (a === "next") go(T.i + 1, 1);
      else if (a === "back") go(T.i - 1, -1);
      else if (a === "about") { finish("done"); }
      else finish(T.i === T.list.length - 1 ? "done" : "skipped");
    });
    card.addEventListener("keydown", trapTab);
    document.addEventListener("keydown", onKey, true);
    go(0, 1);
  }
  function onKey(e){
    if (!T) return;
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); finish(T.i === T.list.length - 1 ? "done" : "skipped"); }
    else if (e.key === "ArrowRight" && !/INPUT|TEXTAREA/.test(e.target.tagName)) { e.preventDefault(); e.stopPropagation(); go(T.i + 1, 1); }
    else if (e.key === "ArrowLeft" && !/INPUT|TEXTAREA/.test(e.target.tagName)) { e.preventDefault(); e.stopPropagation(); go(T.i - 1, -1); }
  }
  function trapTab(e){
    if (e.key !== "Tab") return;
    var f = [].slice.call(e.currentTarget.querySelectorAll("button, a[href]"));
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  /* run a step's action after this click has finished bubbling (the widget closes its menu on any outside click),
     give the page a moment to redraw, then find its part; a part that isn't there drops the step */
  function go(i, dir){
    if (!T) return;
    if (i >= T.list.length) { finish("done"); return; }
    if (i < 0) return;
    var s = T.list[i], seq = ++T.seq;
    if (!s.before && WHERE !== "hub") { show(i, dir); return; }
    setTimeout(function(){
      if (!T || seq !== T.seq) return;
      try { if (s.before) s.before(); } catch (e) {}
      setTimeout(function(){
        if (!T || seq !== T.seq) return;
        if (s.el) s.node = resolve(s);
        if (s.el && !s.node && !s.last) { T.list.splice(i, 1); go(dir < 0 ? i - 1 : i, dir); return; }
        show(i, dir);
      }, s.wait || 120);
    }, 0);
  }
  function show(i){
    T.i = i;
    var s = T.list[i], n = T.list.length, last = i === n - 1;
    var body = typeof s.body === "function" ? s.body() : s.body;
    T.card.innerHTML = '<button type="button" class="sh-tour-x" data-act="close" aria-label="End the tour">×</button>' +
      '<div class="sh-tour-eyebrow">' + (s.eyebrow ? s.eyebrow + " · " : "Tour · ") + (i + 1) + " of " + n + '</div>' +
      '<h3 id="shTourH">' + s.title + '</h3><div class="sh-tour-body" aria-live="polite">' + body + '</div>' +
      '<div class="sh-tour-bar" aria-hidden="true"><i style="width:' + Math.round((i + 1) / n * 100) + '%"></i></div>' +
      '<div class="sh-tour-foot">' + (last ? '<span class="sh-tour-skip" aria-hidden="true" style="visibility:hidden">.</span>' : '<button type="button" class="sh-tour-skip" data-act="close">End tour</button>') +
      (i ? '<button type="button" class="sh-tour-btn" data-act="back">Back</button>' : '') +
      (last && s.about ? '<a class="sh-tour-btn" href="' + s.about + '" data-act="about">Open About</a>' : '') +
      '<button type="button" class="sh-tour-btn is-primary" data-act="next">' + (last ? "Done" : i ? "Next" : "Let's go") + '</button></div>';
    T.card.scrollTop = 0;
    if (s.node && !pinned(s.node)) {
      var r = s.node.getBoundingClientRect();
      var y = Math.max(0, r.top + window.pageYOffset - (phone() ? 64 : 96));
      window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
    }
    place();
    var nx = T.card.querySelector('[data-act="next"]');
    try { nx.focus({ preventScroll: true }); } catch (e) { nx.focus(); }
  }
  function place(){
    var s = T.list[T.i], card = T.card, spot = T.spot;
    var vw = window.innerWidth, vh = window.innerHeight;
    if (!s || !s.node || !document.contains(s.node)) {
      spot.hidden = true; T.block.classList.add("is-dim"); T.dim.hidden = true;
      card.classList.add("is-center"); card.classList.remove("is-top"); card.style.left = card.style.top = card.style.maxHeight = "";
      return;
    }
    T.block.classList.remove("is-dim"); card.classList.remove("is-center");
    var r = s.node.getBoundingClientRect(), pad = 8;
    var top = Math.max(r.top - pad, 6), bottom = Math.min(r.bottom + pad, vh - 6);
    var left = Math.max(r.left - pad, 6), right = Math.min(r.right + pad, vw - 6);
    spot.hidden = false;
    spot.style.left = left + "px"; spot.style.top = top + "px";
    spot.style.width = Math.max(0, right - left) + "px"; spot.style.height = Math.max(0, bottom - top) + "px";
    T.dim.hidden = false; hole(T.dim, vw, vh, left, top, right, bottom);
    if (vw <= 640) {      /* phones: docked by CSS, away from the part; a short screen lets it use more of the height */
      var low = (top + bottom) / 2 > vh * .5;
      card.classList.toggle("is-top", low);
      card.style.maxHeight = vh < 560 ? Math.round(Math.max(low ? top : vh - bottom, vh * .6) - 16) + "px" : "";
      return;
    }
    card.style.maxHeight = "";
    var cw = card.offsetWidth, ch = card.offsetHeight, gap = 14, y, x = Math.min(Math.max(16, r.left), vw - cw - 16);
    if (vh - bottom >= ch + gap + 16) y = bottom + gap;
    else if (top >= ch + gap + 16) y = top - gap - ch;
    else { y = vh - ch - 16; x = r.left > vw / 2 ? 16 : vw - cw - 16; }     /* no room either side: a bottom corner, over the part */
    card.style.left = x + "px"; card.style.top = Math.max(16, y) + "px";
  }
  /* the whole screen minus a rounded rectangle the shape of the spotlight ring (evenodd: the inner path is the hole) */
  function hole(el, vw, vh, l, t, r, b){
    var k = Math.max(0, Math.min(14, (r - l) / 2, (b - t) / 2)), f = function(n){ return Math.round(n * 10) / 10; };
    var a = " A" + k + " " + k + " 0 0 1 ";
    el.style.clipPath = 'path(evenodd, "M0 0H' + vw + "V" + vh + 'H0Z M' + f(l + k) + " " + f(t) + "H" + f(r - k) + a + f(r) + " " + f(t + k) +
      "V" + f(b - k) + a + f(r - k) + " " + f(b) + "H" + f(l + k) + a + f(l) + " " + f(b - k) + "V" + f(t + k) + a + f(l + k) + " " + f(t) + 'Z")';
  }
  function finish(how){
    if (!T) return;
    var t = T; T = null;
    track(how === "done" ? "done" : "quit@" + (t.i + 1));
    if (how === "done" || !ls(key())) ls(key(), how);
    window.removeEventListener("scroll", t.onMove); window.removeEventListener("resize", t.onMove);
    document.removeEventListener("keydown", onKey, true);
    if (t.raf) cancelAnimationFrame(t.raf);
    t.block.remove(); t.spot.remove(); t.card.remove(); t.dim.remove();
    document.documentElement.classList.remove("sh-touring", "sh-tour-follow"); clearTimeout(t.follow);
    if (WHERE === "hub") {
      launcherOpen(false); restore();
      if (home) { var y = home.y; setTimeout(function(){ window.scrollTo({ top: y, behavior: "auto" }); }, 60); }
    }
    var tb = $("#tourBtn") || $(".sh-ribbon-tour");
    try { (visible(tb) ? tb : t.back).focus({ preventScroll: true }); } catch (e) {}
    idle();
  }

  /* ---------- the first-visit question ---------- */
  function maybePrompt(){
    if (ls(key()) || T || $(".sh-tour")) return;
    if (!testStorage()) return;      /* no storage: it would ask on every visit */
    ensureCss(); busy = true;
    var hub = WHERE === "hub";
    var returning = !!(ls("sh_visitor_id") || ls("sh_rank_tier"));
    var block = document.createElement("div"); block.className = "sh-tour-block is-dim";
    var card = document.createElement("section"); card.className = "sh-tour is-center";
    card.setAttribute("role", "dialog"); card.setAttribute("aria-modal", "true"); card.setAttribute("aria-labelledby", "shTourAskH");
    card.innerHTML = '<div class="sh-tour-eyebrow">' + (hub ? "New: a tour of the hub" : returning ? "New: a quick tour" : "Welcome") + '</div>' +
      '<h3 id="shTourAskH">' + (hub ? "Want a quick tour of this hub?" : "Want a quick tour?") + '</h3><div class="sh-tour-body">' +
      (hub ? "<p>Lecture Notes you can listen to and highlight, a question bank that explains every choice, mock exams, review tables, games, search, a daily drill and more. Most people miss half of it.</p>" +
             "<p>A two-minute tour puts a spotlight on each one. Every hub works the same way, so you only need it once. You can always take it later from " + (phone() ? "<b>Take the tour</b> under <b>More</b>" : "the <b>Tour</b> button") + ".</p>"
           : (returning ? "<p>There's more in the hubs than most people find: daily drills, narration, a highlighter, spaced review, linked devices, trophies and more.</p>"
                        : "<p>The hubs pack in a lot: notes you can listen to, question banks, mock exams, daily drills, games and class leaderboards.</p>") +
             "<p>A two-minute tour shows you where everything is. You can always take it later from the <b>Tour</b> button at the top.</p>") + "</div>" +
      '<div class="sh-tour-foot"><span style="margin-right:auto"></span><button type="button" class="sh-tour-btn" data-act="no">No thanks</button>' +
      '<button type="button" class="sh-tour-btn is-primary" data-act="yes">Show me around</button></div>';
    document.body.appendChild(block); document.body.appendChild(card);
    track("prompt");
    function close(yes){
      block.remove(); card.remove(); document.removeEventListener("keydown", esc, true);
      if (yes) { busy = false; start(); return; }
      ls(key(), "no"); track("decline"); pointAtButton(); idle(5000);   /* after the note under the Tour button fades */
    }
    function esc(e){ if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(false); } }
    document.addEventListener("keydown", esc, true);
    card.addEventListener("keydown", trapTab);
    card.addEventListener("click", function(e){ var b = e.target.closest("[data-act]"); if (b) close(b.getAttribute("data-act") === "yes"); });
    setTimeout(function(){ var y = card.querySelector('[data-act="yes"]'); try { y.focus({ preventScroll: true }); } catch (e) {} }, 30);
  }
  function testStorage(){ try { localStorage.setItem("sh_tour_t", "1"); localStorage.removeItem("sh_tour_t"); return true; } catch (e) { return false; } }
  /* after "No thanks": a small note at the Tour button (or, on a hub phone, the More button that holds it) */
  function pointAtButton(){
    var b = [$("#tourBtn"), $(".sh-ribbon-tour"), phone() ? $("#shstat-more-pill") : $("#shstat-launch")].filter(visible)[0];
    if (!b) return;
    var r = b.getBoundingClientRect(), t = document.createElement("div"), below = r.top < window.innerHeight / 2;
    t.className = "sh-tour-toast" + (below ? "" : " is-below"); t.setAttribute("role", "status");
    t.textContent = b.id === "shstat-more-pill" ? "No problem. The tour is under More whenever you want it."
      : b.id === "shstat-launch" ? "No problem. The tour is in this menu whenever you want it."
      : "No problem. The tour is right here whenever you want it.";
    document.body.appendChild(t);
    var w = t.offsetWidth, h = t.offsetHeight, x = Math.min(Math.max(16, r.left + r.width / 2 - w + 26), window.innerWidth - w - 16);
    t.style.left = x + "px";
    t.style.top = (below ? r.bottom + window.pageYOffset + 10 : r.top + window.pageYOffset - h - 10) + "px";
    t.style.setProperty("--arrow", Math.max(10, Math.min(w - 22, r.left + r.width / 2 - x - 6)) + "px");
    requestAnimationFrame(function(){ t.classList.add("is-shown"); });
    setTimeout(function(){ t.classList.remove("is-shown"); setTimeout(function(){ t.remove(); }, 300); }, 4500);
  }

  /* ---------- in a hub (v3.js): ask once, unless the page opened somewhere specific or the hub is archived ---------- */
  function mount(opt){
    WHERE = opt.where || "hub"; HUB = opt.hub || null;
    if (WHERE !== "hub" || ls(key())) return;
    if (location.hash && location.hash.length > 1) return;                 /* #drill, #timmy, a search jump: not now */
    var archived = ((window.SH_EXPORT && window.SH_EXPORT.exams) || []).every(function(x){
      var p = String((x && x.date) || "").split("-").map(Number);
      return p.length === 3 && p[0] && new Date() >= new Date(p[0], p[1] - 1, p[2], 22);
    }) && ((window.SH_EXPORT && window.SH_EXPORT.exams) || []).length > 0;
    if (archived) return;
    setTimeout(function(){
      var sec = "";
      try { sec = (opt.section && opt.section()) || ""; } catch (e) {}
      if (/mock/i.test(sec) || $(".sh-archived") || visible($(".sh-drill")) || document.body.classList.contains("sh-more-open")) return;
      maybePrompt();
    }, 2200);
  }

  window.shTour = { start: start, maybePrompt: maybePrompt, whenIdle: whenIdle, mount: mount };
})();
