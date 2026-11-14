/* What is on screen in each feature shot of the trailer: one script per "## n. id" of script.md, played by
   record.mjs against the timeline (K.line(n): when the shot's nth line starts; K.word(n, "word"): when a word of it
   is said; K.at(t): wait until t seconds into the shot). K.rec.pause() ... K.rec.start() is a cut: what happens
   between them isn't in the clip. The "studio" and "close" shots have no footage: they are the drawing (compose.mjs).
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

export const SHOTS = {
  /* "A new dashboard. Every hub, with a countdown to its exam." / "The class, studying right now." /
     "And the top three, on a stage. No pressure." */
  async dashboard(K){
    await K.go("", 2200);
    /* the board and the classroom draw themselves when they first come near the screen: let them, off camera */
    await K.glide({ sel: "#class", top: 90 }, 300); await K.wait(3500);
    await K.glide(0, 200); await K.wait(600);
    K.rec.start();
    await K.at(K.word(0, "Every hub") - 0.1); await K.tap("#tab-perio");
    await K.at(K.word(0, "countdown") + 0.5); await K.tap("#tab-occlusion");
    await K.at(K.line(1) - 0.45); K.hideCursor(); await K.glide({ sel: "#class", top: 84 }, 850);
    await K.at(K.line(2) - 0.5); await K.glide({ sel: "#board", top: 78 }, 900);
  },

  /* "Inside a hub: Home, Notes, Questions, and More." A tab on each word. */
  async hub(K){
    await K.go(HUB, 3200);
    await K.point("a.hx-tab[href='#home']", 100);
    K.rec.start();
    await K.at(K.word(0, "Notes") - 0.34); await K.tap("a.hx-tab[href='#notes']", 300);
    await K.at(K.word(0, "Questions") - 0.34); await K.tap("a.hx-tab[href='#questions']", 300);
    await K.at(K.word(0, "More") - 0.34); await K.tap("a.hx-tab[href='#more']", 300);
  },

  /* "Every lecture reads three ways: as taught, plain English, and high yield, for the night before." /
     "Tap Listen, and the words light up as you hear them." */
  async notes(K){
    await K.go(HUB + "#notes/" + LEC, 2600);
    await K.page.click("[data-level=hy]"); await K.wait(300); await K.page.click("[data-level=full]"); await K.wait(500);
    await K.point([560, 330], 100);
    K.rec.start();
    await K.at(K.word(0, "as taught") - 0.4); await K.tap("[data-level=full]", 340);
    await K.at(K.word(0, "plain English") - 0.36); await K.tap("[data-level=plain]", 300);
    await K.at(K.word(0, "high yield") - 0.36); await K.tap("[data-level=hy]", 300);
    await K.at(K.line(1) - 0.15); await K.tap("#sh-tts-btn", 380);
    await K.at(K.line(1) + 1.1); K.hideCursor();
  },

  /* "Two new ways to study the Question Bank: Learn, and Flashcards." Learn first, a cut, then a flashcard. */
  async learn(K){
    await K.go(HUB + "#questions", 2400);
    await K.point([420, 300], 100);
    K.rec.start();
    await K.at(0.15); await K.tap("[data-qview=learn]", 260);
    await K.at(0.7); await K.tap("[data-sm=start]", 280);
    await K.wait(380);
    const r = await K.right(".sm");
    await K.at(1.45); await K.tap(r.sel, 300);
    await K.at(K.word(0, "Flashcards") - 0.75); K.rec.pause();
    await K.key("Escape"); await K.wait(700);
    await K.page.click("[data-qview=cards]"); await K.wait(500);
    await K.page.click("[data-sm=start]"); await K.wait(1100);
    await K.point("button:has-text('Flip the card')", 200);
    K.rec.start();
    await K.at(K.word(0, "Flashcards") + 0.15); await K.tap("button:has-text('Flip the card')", 200);
  },

  /* "Stuck? Tap me, and ask." / "I answer from the hub's own notes, and I show you the paragraph." */
  async ask(K){
    await K.go(HUB + "#notes/" + LEC, 2600);
    await K.page.click("[data-level=full]").catch(() => {}); await K.wait(400);
    /* the chat is fetched the first time it opens: open and shut it once, off camera */
    await K.page.click(".shpet-btn"); await K.wait(500); await K.page.click(".shpet-ask"); await K.wait(1800);
    await K.page.click("[data-ska=close]"); await K.wait(4500);
    await K.point([520, 420], 100);
    K.rec.start();
    await K.at(0.12); await K.tap(".shpet-btn", 360);
    await K.page.locator(".shpet-ask:visible").first().waitFor({ timeout: 3000 });
    /* what he says to a tap is drawn at random; a secret tip would give an easter egg away */
    if (/secret tip/i.test(await K.page.locator(".shpet-ask:visible").first().evaluate((b) => b.parentElement.textContent))) K.retake("Timmy answered the tap with a secret tip");
    await K.tap(".shpet-ask", 260);
    await K.wait(360); await K.page.locator("#skaIn").click().catch(() => {});
    await K.type(ASK.question, 12);
    await K.wait(90); await K.tap("[data-ska=send]", 200);
    await K.at(K.word(1, "I show you") - 0.75); await K.tap(".ska-go, button:has-text('Open the notes')", 340);
    await K.wait(400); K.hideCursor();
  },

  /* "Every answer earns XP, and Shiny Gold Crowns for my shop." / "I have a place now, too. Come visit."
     Four short looks, cut together: an answer, the shop, his place, a classmate's place. */
  async game(K){
    await K.go(HUB + "#questions", 2400);
    await K.page.click("[data-qview=questions]"); await K.wait(500);
    await K.page.click("[data-show=unseen]"); await K.wait(800);       // a question this account hasn't tried: the full 10 XP
    await K.glide({ sel: ".qc-stem", top: 210 }, 300); await K.wait(400);
    const r = await K.right();
    await K.point([640, 250], 100);
    K.rec.start();
    await K.at(0.5); await K.tap(r.sel, 380);
    await K.at(K.word(0, "Shiny") - 0.45); K.rec.pause();
    await K.go("", 2400);
    await K.page.click("#youShop button"); await K.wait(2200); K.hideCursor();
    K.rec.start();
    await K.at(K.line(1) - 0.35); K.rec.pause();
    await K.page.click("[data-shop=close]"); await K.wait(500);
    await K.page.click("#petHome"); await K.wait(3200);
    K.rec.start();
    await K.at(K.word(1, "Come visit") - 0.2); K.rec.pause();
    await K.page.click("[data-tp=close]"); await K.wait(500);
    await K.glide({ sel: "#board", top: 78 }, 200); await K.wait(1200);
    await K.page.locator("#board .dx-visit").first().click(); await K.wait(2600);
    K.rec.start();
  }
};
