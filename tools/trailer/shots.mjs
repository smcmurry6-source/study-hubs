/* What is on screen in each feature shot of the trailer: one script per "## n. id" of script.md, played by
   record.mjs against the timeline (K.line(n): when the shot's nth line starts; K.word(n, "word"): when a word of it
   is said; K.at(t): wait until t seconds into the shot). K.rec.pause() ... K.rec.start() is a cut: what happens
   between them isn't in the clip. K.cam(what, options) says where the camera looks from then on (an element, a box,
   or the whole window): compose.mjs pushes in on it. A shot opens on the whole window, floating and tilted, unless
   its first K.cam is a cut (dur 0). The "studio" and "close" shots have no footage: they are the drawing (compose.mjs).
   Everything shown is the preview's made-up data on the hub's own writing: no slides, no recordings. */

export const NOW = "2026-11-15T15:30";          // the afternoon before the Occlusion final: daylight at Timmy's place
const HUB = "hubs/occlusion/", LEC = "instruments";

/* What Timmy answers on camera, from hubs/occlusion/content/notes.json, lecture "instruments": every claim is from
   the paragraph that starts with `find` (its "2. Bennett angle"). The preview's canned reply stands in for the live
   function, which isn't deployed before the release, so this one answer is staged: keep it true to the notes. */
export const ASK = {
  question: "What is the Bennett angle?",
  find: "2. Bennett angle",
  paragraphs: [
    "When the jaw slides to one side, the condyle on the other side, the orbiting one, moves inward. The Bennett angle is the angle of that inward path in the horizontal plane, against a straight protrusive path. It affects how wide the central fossae of the back teeth are.",
    "Dr. Givan said it's the one feature he'd leave off an articulator: the average values are close enough."
  ]
};

/* The chapter card that wipes across before each shot: its words and its color (compose.mjs draws it). */
export const CHAPTERS = {
  dashboard: { n: "01", name: "The dashboard", tint: "#FFD95A" },
  hub: { n: "02", name: "Inside a hub", tint: "#F7A3BA" },
  notes: { n: "03", name: "Notes, three ways", tint: "#8FD0F2" },
  learn: { n: "04", name: "Learn + Flashcards", tint: "#9BE3B8" },
  ask: { n: "05", name: "Ask Timmy", tint: "#FFB86B" },
  game: { n: "06", name: "XP + Crowns\nTimmy's place", tint: "#F2C94C" },
  close: { n: "", name: "", tint: "#8A76D6" }
};
const ALL = [0, 0, 1280, 720];
/* Shots recorded from the screen in real time, not a frame at a time (record.mjs): the ones that play sound. Listen's
   words light up with the audio, and audio only plays in real time. No scrolling in these. */
export const REALTIME = ["notes"];

export const SHOTS = {
  /* "A new dashboard. Every hub is a tab, with a countdown to its exam." / "The class, studying right now." /
     "And the top three, on a stage. No pressure." / "And the idea board: post what you want next, and vote." */
  async dashboard(K){
    await K.go("", 2200);
    /* the board and the classroom draw themselves when they first come near the screen: let them, off camera */
    await K.glide({ sel: "#class", top: 90 }, 300); await K.wait(3500);
    await K.glide({ sel: "#ideas", top: 76 }, 300); await K.wait(3500);
    await K.glide(0, 200); await K.wait(600);
    await K.rec.start();
    await K.at(K.word(0, "Every hub") - 0.75); await K.cam(ALL, { pad: 0, dur: 0.7 });
    await K.at(K.word(0, "Every hub") - 0.1); await K.tap("#tab-perio", 320);
    await K.at(K.word(0, "countdown") - 0.5); await K.tap("#tab-occlusion", 320);
    await K.at(K.word(0, "countdown") - 0.05); K.hideCursor(); await K.cam(".dx-exam", { pad: 34, dur: 0.9 });
    await K.at(K.line(1) - 0.6); await K.cam("#room", { y: 141, pad: 30, dur: 0.95 }); await K.glide({ sel: "#class", top: 84 }, 850);
    await K.at(K.line(2) - 0.6); await K.cam(".dx-arena", { y: 78, h: 430, pad: 16, dur: 0.95 }); await K.glide({ sel: "#board", top: 78 }, 850);
    /* the idea board: the whole board, the pointer on "Post an idea", then in on the top idea for a vote */
    await K.at(K.line(3) - 0.75); await K.cam(ALL, { pad: 0, dur: 0.9 }); await K.glide({ sel: "#ideas", top: 76 }, 900);
    await K.at(K.word(3, "post") - 0.45); await K.point("#ideas [data-shi=new]", 420);
    await K.at(K.word(3, "and vote") - 0.75); await K.cam([64, 268, 590, 262], { dur: 0.8, max: 2.1 });
    await K.at(K.word(3, "vote") - 0.4); await K.tap("#ideas [data-shi=up] >> nth=0", 380);
    await K.wait(500); K.hideCursor();
  },

  /* "Open a hub, and Home tells you what to study next." / "Then: Notes, Questions, and More." A tab on each word. */
  async hub(K){
    await K.go(HUB, 3200);
    await K.point("a.hx-tab[href='#home']", 100); K.hideCursor();
    await K.rec.start();
    await K.at(K.word(0, "Home") - 0.6); await K.cam(ALL, { pad: 0, dur: 0.7 });
    await K.at(K.word(0, "what to study") - 0.7); await K.cam(".panel.next", { y: 150, pad: 26, dur: 0.9 }); await K.glide({ sel: ".panel.next", top: 150 }, 800);
    await K.at(K.line(1) - 0.75); await K.cam(ALL, { pad: 0, dur: 0.6 });
    await K.at(K.word(1, "Notes") - 0.34); await K.tap("a.hx-tab[href='#notes']", 300);
    await K.at(K.word(1, "Questions") - 0.34); await K.tap("a.hx-tab[href='#questions']", 300);
    await K.at(K.word(1, "More") - 0.34); await K.tap("a.hx-tab[href='#more']", 300);
  },

  /* "Every lecture reads three ways: as taught, plain English, and high yield, for the night before." /
     "Tap Listen, and the words light up as you hear them." */
  async notes(K){
    await K.go(HUB + "#notes/" + LEC, 2600);
    await K.page.click("[data-level=hy]"); await K.wait(300); await K.page.click("[data-level=full]"); await K.wait(500);
    await K.point([560, 330], 100);
    await K.cam("article.reading", { h: 430, pad: 20, dur: 0 });
    await K.rec.start();
    await K.at(K.word(0, "as taught") - 0.4); await K.tap("[data-level=full]", 340);
    await K.at(K.word(0, "plain English") - 0.36); await K.tap("[data-level=plain]", 300);
    await K.at(K.word(0, "high yield") - 0.36); await K.tap("[data-level=hy]", 300);
    await K.at(K.line(1) - 0.15); await K.tap("#sh-tts-btn", 380);
    await K.at(K.line(1) + 0.9); K.hideCursor(); await K.cam("article.reading", { y: 250, h: 330, pad: 0, dur: 1.2, max: 2.1 });
  },

  /* "Two new ways to study the Question Bank." / "Learn keeps asking until you get each one right twice." /
     "Flashcards come back just before you'd forget them." The switch, a Learn round, a cut, then a flashcard. */
  async learn(K){
    await K.go(HUB + "#questions", 2400);
    await K.point([420, 300], 100);
    await K.cam(".studyas", { w: 620, h: 300, pad: 30, dur: 0 });
    await K.rec.start();
    await K.at(K.word(0, "study") - 0.2); await K.tap("[data-qview=learn]", 300);
    await K.at(K.line(1) - 0.6); await K.tap("[data-sm=start]", 300); await K.cam(ALL, { pad: 0, dur: 0.5 });
    await K.wait(450);
    const r = await K.right(".sm");
    await K.cam("[data-trl-card]", { pad: 30, dur: 0.8, max: 1.9 });
    await K.at(K.word(1, "right twice") - 0.5); await K.tap(r.sel, 320);
    await K.at(K.line(2) - 0.5); K.rec.pause();
    await K.key("Escape"); await K.wait(700);
    await K.page.click("[data-qview=cards]"); await K.wait(500);
    await K.page.click("[data-sm=start]"); await K.wait(1100);
    await K.point("button:has-text('Flip the card')", 200);
    await K.cam(".sm", { pad: 0, dur: 0, max: 1.7 });
    await K.rec.start();
    await K.at(K.word(2, "come back") - 0.3); await K.tap("button:has-text('Flip the card')", 260);
    await K.wait(250); await K.cam("text:How well did you know", { up: [420, 90], pad: 70, dur: 0.8, max: 1.9 });
    await K.at(K.word(2, "forget") - 0.1); await K.tap("button:has-text('Good')", 320).catch(() => {});
  },

  /* "Stuck? Tap me, and ask." / "I answer from the hub's own notes, and I show you the paragraph." */
  async ask(K){
    await K.go(HUB + "#notes/" + LEC, 2600);
    await K.page.click("[data-level=full]").catch(() => {}); await K.wait(400);
    /* the chat is fetched the first time it opens: open and shut it once, off camera */
    await K.page.click(".shpet-btn"); await K.wait(500); await K.page.click(".shpet-ask"); await K.wait(1800);
    await K.page.click("[data-ska=close]"); await K.wait(4500);
    await K.point([520, 420], 100);
    await K.cam([0, 500, 340, 220], { pad: 0, dur: 0, max: 2.2 });   // his corner of the page, where he and his bubble are
    await K.rec.start();
    await K.at(0.5); await K.tap(".shpet-btn", 360);
    await K.live(K.page.locator(".shpet-ask:visible").first().waitFor({ timeout: 3000 }));
    /* what he says to a tap is drawn at random; a secret tip would give an easter egg away */
    if (/secret tip/i.test(await K.page.locator(".shpet-ask:visible").first().evaluate((b) => b.parentElement.textContent))) K.retake("Timmy answered the tap with a secret tip");
    await K.at(K.word(0, "ask") - 0.3); await K.tap(".shpet-ask", 260);
    await K.wait(360); await K.live(K.page.locator("#skaIn").click().catch(() => {}));
    await K.cam("#skaIn", { up: [330, 420], pad: 20, dur: 0.8, max: 1.9 });
    await K.type(ASK.question, 12);
    await K.wait(90); await K.tap("[data-ska=send]", 200);
    await K.at(K.word(1, "I show you") - 0.75); await K.tap(".ska-go, button:has-text('Open the notes')", 340);
    await K.wait(350); K.hideCursor(); await K.cam("text:" + ASK.find, { pad: 60, dur: 0.9, max: 1.9 });
  },

  /* "Every answer earns XP, and Shiny Gold Crowns for my shop." / "The shop is for my place: a home, a yard, and me,
     dressed how you like." / "Tap anyone on the leaderboard to visit theirs."
     Short looks, cut together: an answer, the crowns and the shop, his place and its customizer, a visit. */
  async game(K){
    await K.go(HUB + "#questions", 2400);
    await K.page.click("[data-qview=questions]"); await K.wait(500);
    await K.page.click("[data-show=unseen]"); await K.wait(800);       // a question this account hasn't tried: the full 10 XP
    await K.glide({ sel: ".qc-stem", top: 170 }, 300); await K.wait(400);
    const r = await K.right();
    await K.point([640, 250], 100);
    await K.cam("[data-trl-card]", { pad: 24, dur: 0, max: 1.8 });
    await K.rec.start();
    await K.at(0.75); await K.tap(r.sel, 380);
    await K.at(K.word(0, "Shiny") - 0.35); K.rec.pause();
    /* the crowns on the You card, then the shop. Off camera first: the shop and the place's customizer are fetched
       the first time they open, so open each once */
    K.hideCursor();
    await K.go("", 2400);
    await K.glide({ sel: "#youShop", top: 330 }, 300); await K.wait(1500);
    await K.page.click("#youShop button"); await K.wait(3200); await K.page.click("[data-shop=close]"); await K.wait(500);
    await K.glide(0, 200); await K.wait(300);
    await K.page.click("#petHome"); await K.wait(3400); await K.page.click("[data-tp=customize2]"); await K.wait(2800);
    await K.page.locator("[data-tp=done]:visible").first().click().catch(() => {}); await K.wait(400);
    await K.page.locator("[data-tp=close]:visible").first().click(); await K.wait(600);
    await K.glide({ sel: "#youShop", top: 330 }, 300); await K.wait(900);
    await K.cam("#youShop", { pad: 70, dur: 0, max: 2.2 });
    await K.point([420, 300], 100);
    await K.rec.start();
    await K.at(K.word(0, "Crowns") - 0.15); await K.tap("#youShop button", 300); await K.cam(ALL, { pad: 0, dur: 0.5 });
    await K.at(K.line(1) - 0.3); K.rec.pause();
    /* his place: the window, then the customizer */
    K.hideCursor();
    await K.page.click("[data-shop=close]"); await K.wait(500);
    await K.glide(0, 200); await K.wait(400);
    await K.page.click("#petHome"); await K.wait(3400);
    await K.cam(ALL, { pad: 0, dur: 0 });
    await K.point([900, 420], 100);
    await K.rec.start();
    await K.at(K.word(1, "a home") - 0.95); await K.tap("[data-tp=customize2]", 320);
    await K.at(K.word(1, "a home") - 0.05); await K.tap(".tpv-card:has-text('Treehouse')", 320);
    await K.at(K.word(1, "a yard") - 0.1); await K.tap("[data-tp=pick-side]", 300);
    await K.at(K.word(1, "and me") - 0.4); await K.tap("[data-tp=pick-timmy]", 300);
    await K.at(K.word(1, "dressed") - 0.45); await K.tap(".tpv-card:not(.on):visible >> nth=1", 300);
    await K.at(K.line(2) - 0.4); K.rec.pause();
    /* a classmate's place, from the leaderboard: the tap, a cut through the clouds, their place */
    K.hideCursor();
    await K.page.locator("[data-tp=done]:visible").first().click().catch(() => {}); await K.wait(400);
    await K.page.locator("[data-tp=close]:visible").first().click(); await K.wait(500);
    await K.glide({ sel: "#board", top: 78 }, 200); await K.wait(1200);
    await K.cam(".dx-arena", { y: 78, pad: 10, dur: 0 });
    await K.point([900, 330], 100);
    await K.rec.start();
    await K.at(K.line(2) - 0.05); await K.tap(K.page.locator("#board .dx-visit").first(), 340);
    await K.wait(260); await K.cam(ALL, { pad: 0, dur: 0.5 });
    await K.wait(520); K.rec.pause(); K.hideCursor();
    await K.wait(1150);
    await K.rec.start();
  }
};
