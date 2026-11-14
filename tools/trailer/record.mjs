/* The trailer's footage: each feature shot recorded from a preview of the site, on made-up data.

     node tools/trailer/record.mjs                    every shot (after audio.py), to out/footage/<shot>/00001.jpg...
                                                      (30 frames a second) and out/footage/<shot>.cam.json
     node tools/trailer/record.mjs --shot notes,ask   only these
     node tools/trailer/record.mjs --sheet            also write out/footage/<shot>.jpg, a contact sheet to look at

   It starts its own preview (tools/preview/serve.js: the whole site on fixtures, production blocked), opens it in a
   scripted browser as the high-XP test account on an afternoon before the Occlusion final, and plays each shot of
   shots.mjs against the clock of out/timeline.json, so a tap lands on the word Timmy says. A drawn pointer shows
   where it taps.

   A shot is recorded a frame at a time, not in real time (Sam, on the first cut: "the scrolling in the demo looked a
   little jittery"): the page's own clock is stopped and moved on exactly 1/30 s for each frame (timers and scripted
   animation: the browser's virtual time; CSS animations and transitions: each moved on by hand), then the frame is
   taken, so every scroll, tap and animation lands evenly however long the machine takes to draw it. The one shot
   that plays sound (REALTIME below: Listen's words follow the audio, which only plays in real time) is recorded from
   the screen as it happens, on a page of its own. The screen is captured at 2560 x 1440 (a 1280 x 720 laptop window at 2), so compose.mjs's camera
   can push in on a part of the page and stay sharp. A script also says where the camera looks (K.cam): those moves
   are saved beside the frames, with their times, and compose.mjs plays them.

   Never the live site (vault/rules/preview-and-release-test.md): its boards show the class, and a scripted visit
   would write to the class's data. Three things in the preview are changed for the camera, in the browser only
   (nothing in tools/preview/ is touched):
   - its badge and dashed frame are hidden, and so are the survey and the exam check-in pop-ups (they would cover the shot);
   - its made-up classmates ("Fixture Fluoride"...) read as names from tools/trailer/names.local.json when that file
     exists: a JSON list of at least 12 leaderboard names. Sam, 2026-11-14: real leaderboard names may be shown in the
     trailer ("They arent real names"). The file is not committed (.gitignore): names stay out of the repo
     (vault/rules/learner-data-privacy.md), and without it the shots show the preview's own names;
   - Ask Timmy's canned preview reply to the trailer's question is replaced by an answer written from the hub's own
     notes (ASK in shots.mjs), cited to its paragraph, the way the live function answers. The function isn't deployed
     before the release, so this one answer is staged; keep it true to the notes. */
import { createRequire } from "node:module";
import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SHOTS, ASK, NOW, REALTIME } from "./shots.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const out = path.join(here, "out");
const require = createRequire(import.meta.url);
let pw; try { pw = require("playwright"); } catch (e) { pw = createRequire("/opt/")("playwright"); }
const arg = (k) => { const i = process.argv.indexOf(k); return i < 0 ? null : process.argv[i + 1]; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const TL = JSON.parse(fs.readFileSync(path.join(out, "timeline.json"), "utf8"));
const PORT = 4179, BASE = `http://127.0.0.1:${PORT}/`;
const ME = "Molar Bear";                        // the account on camera (the high-XP test account, renamed; nobody's board name)
const NAMES_FILE = path.join(here, "names.local.json");

/* ---------- the preview's runtime, changed for the camera ---------- */
function swap(src, from, to, what){
  if (!src.includes(from)) throw new Error("record.mjs: tools/preview/runtime/preview.js changed (" + what + "): update the patch");
  return src.replace(from, to);
}
function forCamera(src){
  const m = /var FAKE_NAMES = (\[[^\]]+\]);/.exec(src);
  if (!m) throw new Error("record.mjs: FAKE_NAMES not found in the preview runtime");
  const fake = JSON.parse(m[1]);
  if (fs.existsSync(NAMES_FILE)) {
    const names = JSON.parse(fs.readFileSync(NAMES_FILE, "utf8"));
    if (!Array.isArray(names) || names.length < fake.length) throw new Error("names.local.json needs " + fake.length + " names");
    fake.forEach((f, i) => { src = src.split(JSON.stringify(f)).join(JSON.stringify(String(names[i]))); });
  } else console.error("  (no names.local.json: the boards show the preview's made-up names)");
  src = src.split("Preview Cuspid Champion").join(ME);
  src = swap(src, "r.paragraphs.push(tail);",
    "var TA = window.__TRAILER_ASK, tp = TA && L && low.indexOf(TA.question.toLowerCase().replace(/\\?$/, '')) >= 0 ? paras.filter(function(x){ return x.text.indexOf(TA.find) === 0; })[0] : null;" +
    "if (tp) { r = { kind: 'answer', paragraphs: TA.paragraphs.map(function(t, i){ return { text: t, cites: i ? [] : [{ id: 'N1.' + tp.k, hub: hub, kind: 'notes', label: label(L) + ' notes', quote: tp.text.split(' ').slice(0, 10).join(' '), go: { v: 'notes', lec: L.id, k: tp.k } }] }; }), offer: null, go: { v: 'notes', hub: hub, lec: L.id, k: tp.k }, closest: null }; }" +
    "else r.paragraphs.push(tail);", "Ask Timmy's reply");
  return src;
}

/* in every page: the preview's chrome hidden, and a drawn pointer that follows the mouse and rings on a tap */
function inPage(ask){
  window.__TRAILER_ASK = ask;
  var css = ".shpv-frame,.shpv-pill,.shpv-panel,.survey{display:none!important}" +
    "#trl-cur{display:block!important;position:fixed;left:0;top:0;width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;background:rgba(255,255,255,.55);border:3px solid #3B2E3A;box-shadow:0 2px 6px rgba(0,0,0,.3);z-index:2147483647;pointer-events:none;opacity:0;transition:width .12s,height .12s,margin .12s,background .12s}" +
    "#trl-cur.on{opacity:1}#trl-cur.down{width:22px;height:22px;margin:-11px 0 0 -11px;background:rgba(255,217,90,.95)}" +
    ".trl-ring{position:fixed;width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;border:4px solid #FFD95A;z-index:2147483646;pointer-events:none;animation:trl-ring .5s ease-out forwards}" +
    "@keyframes trl-ring{to{transform:scale(3.2);opacity:0}}";
  var add = function(){
    if (!document.documentElement) return setTimeout(add, 5);
    var s = document.createElement("style"); s.textContent = css; document.documentElement.appendChild(s);
    var put = function(){
      if (!document.body) return setTimeout(put, 10);
      var c = document.createElement("div"); c.id = "trl-cur"; document.body.appendChild(c);
      var at = sessionStorage.getItem("trl-cur"); if (at) { at = at.split(","); c.style.transform = "translate(" + at[0] + "px," + at[1] + "px)"; if (at[2] === "1") c.classList.add("on"); }
      window.addEventListener("mousemove", function(e){ c.style.transform = "translate(" + e.clientX + "px," + e.clientY + "px)"; sessionStorage.setItem("trl-cur", e.clientX + "," + e.clientY + "," + (c.classList.contains("on") ? 1 : 0)); }, true);
      window.addEventListener("mousedown", function(e){ c.classList.add("down"); var r = document.createElement("div"); r.className = "trl-ring"; r.style.left = e.clientX + "px"; r.style.top = e.clientY + "px"; document.body.appendChild(r); setTimeout(function(){ r.remove(); }, 600); }, true);
      window.addEventListener("mouseup", function(){ setTimeout(function(){ c.classList.remove("down"); }, 120); }, true);
      window.__trlCursor = function(on){ c.classList.toggle("on", !!on); };
    };
    put();
  };
  add();
}

/* ---------- the recorder: the screen's frames with their times; a pause is a cut ---------- */
class Rec {
  constructor(page, cdp){ this.page = page; this.cdp = cdp; this.frames = []; this.on = false; this.acc = 0; this.t0 = 0; this.last = null; this.n = 0; }
  async open(dir){
    this.dir = dir; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    this.cdp.on("Page.screencastFrame", (f) => {
      this.last = f.data;
      if (this.on) this.keep(f.data);
      this.cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
    });
    await this.cdp.send("Page.startScreencast", { format: "jpeg", quality: 88, everyNthFrame: 1 });
  }
  keep(data){ const name = String(this.n++).padStart(6, "0") + ".jpg"; fs.writeFileSync(path.join(this.dir, name), Buffer.from(data, "base64")); this.frames.push({ t: this.clock(), name }); }
  clock(){ return this.acc + (this.on ? (Date.now() - this.t0) / 1000 : 0); }
  start(){ this.t0 = Date.now(); this.on = true; if (this.last) this.keep(this.last); }
  pause(){ this.acc = this.clock(); this.on = false; }
  async until(t){ while (this.clock() < t) await sleep(8); }
  async close(){
    this.pause(); await this.cdp.send("Page.stopScreencast").catch(() => {});
    const list = ["ffconcat version 1.0"];
    this.frames.forEach((f, i) => { const nx = this.frames[i + 1]; list.push("file " + f.name, "duration " + Math.max(0.001, (nx ? nx.t : this.acc) - f.t).toFixed(4)); });
    if (this.frames.length) list.push("file " + this.frames[this.frames.length - 1].name);
    fs.writeFileSync(path.join(this.dir, "frames.txt"), list.join("\n") + "\n");
    return this.acc;
  }
}

/* ---------- the same, a frame at a time: the page's clock moves 1/30 s, then the frame is taken ---------- */
const FRAME = 1000 / 30;
class StepRec {
  constructor(page, cdp){ this.page = page; this.cdp = cdp; this.stepped = true; this.on = false; this.n = 0; this.frames = []; this.freeing = null; this.closed = false; }
  async open(dir){
    this.dir = dir; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    await this.cdp.send("Animation.enable");
    await this.cdp.send("Emulation.setVirtualTimePolicy", { policy: "pause" });
    this.free();
  }
  /* move the page's clock on by ms (it stops again by itself) */
  async step(ms){
    const done = new Promise((r) => this.cdp.once("Emulation.virtualTimeBudgetExpired", r));
    await this.cdp.send("Emulation.setVirtualTimePolicy", { policy: "pauseIfNetworkFetchesPending", budget: ms });
    await Promise.race([done, sleep(5000)]);
  }
  /* off camera the clock runs with the real one, in small steps, so the page behaves as usual */
  free(){
    this.cdp.send("Animation.setPlaybackRate", { playbackRate: 1 }).catch(() => {});
    this.freeing = (async () => { let last = Date.now(); while (!this.on && !this.closed) { const now = Date.now(); await this.step(Math.max(8, Math.min(120, now - last))).catch(() => {}); last = now; await sleep(12); } })();
  }
  async start(){
    this.on = true; await this.freeing;
    /* animations all but stopped (stopped outright, the browser draws no new frame): tick() moves them on */
    await this.cdp.send("Animation.setPlaybackRate", { playbackRate: 0.001 });
  }
  pause(){ if (!this.on) return; this.on = false; this.free(); }
  clock(){ return this.n / 30; }
  /* one frame: the clock, the animations, the picture */
  async tick(){
    await this.step(FRAME);
    await this.page.evaluate((dt) => {
      document.getAnimations().forEach((a) => { if (a.playState !== "running") return; const t = a.currentTime; a.currentTime = (t == null ? 0 : +t) + dt * (a.playbackRate || 1); });
    }, FRAME).catch(() => {});
    await sleep(36);                                     // let the page draw what changed
    const shot = await this.cdp.send("Page.captureScreenshot", { format: "jpeg", quality: 90, optimizeForSpeed: true });
    fs.writeFileSync(path.join(this.dir, String(++this.n).padStart(5, "0") + ".jpg"), Buffer.from(shot.data, "base64"));
  }
  async until(t){ while (this.clock() < t - 1e-6) await this.tick(); }
  async close(){ this.on = false; this.closed = true; await this.freeing; this.frames = { length: this.n }; return this.clock(); }
}

/* ---------- what a shot's script gets ---------- */
function kit(page, rec, shot){
  const cues = TL.cues.filter((c) => c.shot === shot.id);
  const K = {
    page, rec, dur: shot.t1 - shot.t0, base: BASE,
    /* when (seconds into the shot) the nth line starts, or a word of it is said (estimated from where it sits in the line) */
    line: (n) => cues[n].t0 - shot.t0,
    word: (n, w) => { const c = cues[n], i = c.shown.indexOf(w); if (i < 0) throw new Error(`"${w}" is not in "${c.shown}"`); return c.t0 - shot.t0 + (c.t1 - c.t0) * (i / c.shown.length); },
    at: (t) => rec.until(t),
    /* on camera, waiting is frames going by */
    wait: (ms) => (rec.stepped && rec.on ? rec.until(rec.clock() + ms / 1000) : sleep(ms)),
    /* something the page takes its own time over (an element that shows after a timer): frames go by until it's done */
    live: async (p) => { if (!(rec.stepped && rec.on)) return p; let done = false; const q = Promise.resolve(p).finally(() => { done = true; }); q.catch(() => {}); while (!done) await rec.tick(); return q; },
    go: async (url, ms = 1800) => {
      await page.goto(BASE + url, { waitUntil: "load" }); await sleep(ms);
      await page.locator("[data-ska=close]:visible").click({ timeout: 400 }).catch(() => {});   // Ask Timmy's chat stays open from page to page: shut it
    },
    /* the pointer glides to the middle of an element (or to x, y) and taps */
    point: async (target, ms = 380) => {
      let x, y;
      if (Array.isArray(target)) [x, y] = target;
      else { const loc = typeof target === "string" ? page.locator(target).first() : target; const b = await K.live((async () => { await loc.scrollIntoViewIfNeeded().catch(() => {}); return loc.boundingBox(); })()); if (!b) throw new Error("nothing to point at: " + target); x = b.x + b.width / 2; y = b.y + b.height / 2; }
      await page.evaluate(() => window.__trlCursor && window.__trlCursor(true));
      const from = K.pos || [640, 420], ease = (k) => k * k * (3 - 2 * k);
      if (rec.stepped && rec.on) { const n = Math.max(1, Math.round(ms / FRAME)); for (let i = 1; i <= n; i++) { const e = ease(i / n); await page.mouse.move(from[0] + (x - from[0]) * e, from[1] + (y - from[1]) * e); await rec.tick(); } }
      else { const t0 = Date.now(); for (;;) { const k = Math.min(1, (Date.now() - t0) / ms), e = ease(k); await page.mouse.move(from[0] + (x - from[0]) * e, from[1] + (y - from[1]) * e); if (k >= 1) break; await sleep(6); } }   // by the clock: a move takes as long as it takes
      K.pos = [x, y];
    },
    tap: async (target, ms = 380) => { await K.point(target, ms); await page.mouse.down(); await K.wait(70); await page.mouse.up(); },
    /* an eased scroll of the page (or of an element) to a position, or until an element sits `top` px from the top */
    glide: async (to, ms = 800, box = null) => {
      if (rec.stepped && rec.on) {                       // on camera: one exact position a frame
        const [y0, y1] = await page.evaluate(([to, box]) => { const el = box ? document.querySelector(box) : document.scrollingElement, y0 = el.scrollTop; let y1 = to; if (typeof to !== "number") { const r = Array.prototype.filter.call(document.querySelectorAll(to.sel), (e) => e.offsetParent)[0].getBoundingClientRect(); y1 = y0 + r.top - (to.top || 0); } return [y0, Math.max(0, Math.min(y1, el.scrollHeight - el.clientHeight))]; }, [to, box]);
        const n = Math.max(1, Math.round(ms / FRAME));
        for (let i = 1; i <= n; i++) { const k = i / n, e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; await page.evaluate(([y, box]) => { (box ? document.querySelector(box) : document.scrollingElement).scrollTop = y; }, [y0 + (y1 - y0) * e, box]); await rec.tick(); }
        return;
      }
      await page.evaluate(([to, ms, box]) => new Promise((done) => {
        const el = box ? document.querySelector(box) : document.scrollingElement, y0 = el.scrollTop;
        let y1 = to; if (typeof to !== "number") { const r = Array.prototype.filter.call(document.querySelectorAll(to.sel), (e) => e.offsetParent)[0].getBoundingClientRect(); y1 = y0 + r.top - (to.top || 0); }
        const t0 = performance.now();
        (function step(){ const k = Math.min(1, (performance.now() - t0) / ms), e = k * k * (3 - 2 * k); el.scrollTop = y0 + (y1 - y0) * e; if (k < 1) requestAnimationFrame(step); else done(); })();
      }), [to, ms, box]);
    },
    type: async (text, delay = 34) => {
      if (!(rec.stepped && rec.on)) return page.keyboard.type(text, { delay });
      let owed = 0; for (const ch of text) { await page.keyboard.type(ch); owed += delay; while (owed >= FRAME) { await rec.tick(); owed -= FRAME; } }
    },
    key: (k) => page.keyboard.press(k),
    /* the right choice of the first multiple-choice card on screen (inside `scope`), from the hub's own key */
    right: async (scope = "", hub = "occlusion") => {
      const qs = JSON.parse(fs.readFileSync(path.join(root, "hubs", hub, "content", "questions.json"), "utf8"));
      const stem = await page.evaluate((scope) => {
        const all = Array.prototype.slice.call(document.querySelectorAll((scope ? scope + " " : "") + ".qc-stem"));
        for (const e of all) {
          const r = e.getBoundingClientRect(); if (!e.offsetParent || r.bottom < 0 || r.top > innerHeight) continue;
          let card = e.parentElement; while (card && !card.querySelector(".ch")) card = card.parentElement;
          if (!card || card === document.body) continue;
          document.querySelectorAll("[data-trl-card]").forEach((x) => x.removeAttribute("data-trl-card"));
          card.setAttribute("data-trl-card", ""); return e.textContent.replace(/\s+/g, " ").trim();
        }
        return null;
      }, scope);
      const q = stem && qs.find((q) => q.type === "mcq" && String(q.stem).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() === stem);
      if (!q) throw new Error("no multiple-choice question on screen that the bank knows: " + stem);
      return { q, sel: `[data-trl-card] .ch[data-i="${q.answer}"]` };
    },
    /* Where the camera looks from now on: an element (the first one showing), a box [x, y, w, h] in the window's
       pixels, "text:..." for the paragraph that starts with those words, or nothing for the whole window; o.up:
       climb to the first parent at least [w, h] big. o.pad: room around it; o.w, o.h, o.y: that much of the element, or
       where it will be (said before a scroll that brings it there); o.dur: how long the move takes (0 is a cut);
       o.max: the most it may push in; o.lead: start this much later. compose.mjs turns the box into a camera move. */
    cams: [],
    cam: async (target, o = {}) => {
      let box = null;
      if (Array.isArray(target)) box = target.slice();
      else if (target) {
        box = await page.evaluate(([sel, up]) => {
          const seen = (e) => e.getClientRects().length;
          let e;
          if (sel.indexOf("text:") === 0) { const t = sel.slice(5); e = Array.prototype.filter.call(document.querySelectorAll("p,li,h2,h3,h4,div"), (x) => seen(x) && x.textContent.trim().indexOf(t) === 0).sort((a, b) => a.textContent.length - b.textContent.length)[0]; }
          else e = Array.prototype.filter.call(document.querySelectorAll(sel), seen)[0];
          if (!e) return null;
          if (up) while (e.parentElement && (e.getBoundingClientRect().width < up[0] || e.getBoundingClientRect().height < up[1])) e = e.parentElement;
          const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height];
        }, [target, o.up || null]);
        if (!box) throw new Error("nothing to look at: " + target);
      }
      if (box) {
        if (o.w) box[2] = o.w; if (o.h) box[3] = o.h; if (o.y != null) box[1] = o.y; if (o.x != null) box[0] = o.x;
        const p = o.pad == null ? 24 : o.pad; box = [box[0] - p, box[1] - p, box[2] + 2 * p, box[3] + 2 * p].map((v) => Math.round(v));
      }
      K.cams.push({ t: +(rec.clock() + (o.lead || 0)).toFixed(3), box, dur: o.dur == null ? 0.8 : o.dur, max: o.max || null, float: !!o.float });
    },
    retake: (why) => { const e = new Error(why); e.retake = true; throw e; },
    hideCursor: () => page.evaluate(() => window.__trlCursor && window.__trlCursor(false))
  };
  return K;
}

async function main(){
  const only = arg("--shot") ? arg("--shot").split(",") : null, sheet = process.argv.includes("--sheet");
  const dirOut = path.join(out, "footage"); fs.mkdirSync(dirOut, { recursive: true });
  const server = spawn(process.execPath, [path.join(root, "tools/preview/serve.js"), "--port", String(PORT)], { cwd: root, stdio: "ignore" });
  process.on("exit", () => server.kill());
  for (let i = 0; i < 50; i++) { try { await fetch(BASE); break; } catch (e) { await sleep(200); } }

  /* a real device scale of 2 (not an emulated one), so the screen capture is 2560 x 1440 */
  const browser = await pw.chromium.launch({ args: ["--force-device-scale-factor=2", "--window-size=1280,720", "--hide-scrollbars", "--autoplay-policy=no-user-gesture-required"] });
  const ctx = await browser.newContext({ viewport: null, reducedMotion: "no-preference", colorScheme: "light" });
  await ctx.addInitScript(inPage, ASK);
  await ctx.route("**/__preview/preview.js", async (route) => { const r = await route.fetch(); await route.fulfill({ response: r, body: forCamera(await r.text()) }); });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.error("  page error:", e.message));
  let stepPage = null;                                  // the page whose clock is stepped (a clock, once stepped, stays that way)

  /* warm up: the first visit's one-time things (the rank cutscene, medal cards, tips, the survey) happen off camera */
  console.error("warming up");
  await page.goto(BASE + "?persona=high-xp&now=" + NOW, { waitUntil: "load" }); await sleep(2500);
  await page.click("text=Keep going", { timeout: 6000 }).catch(() => {});
  await sleep(1500);
  for (const u of ["hubs/occlusion/", "hubs/occlusion/#notes/instruments", "hubs/occlusion/#questions", "hubs/occlusion/#more", ""]) {
    await page.goto(BASE + u, { waitUntil: "load" }); await sleep(u === "hubs/occlusion/" ? 7000 : 2600);
    for (let i = 0; i < 4; i++) { const b = page.locator("button:has-text('Got it'):visible, .survey-x:visible").first(); if (!(await b.count())) break; await b.click({ timeout: 1500 }).catch(() => {}); await sleep(300); }
  }

  for (const shot of TL.shots) {
    const script = SHOTS[shot.id];
    if (!script || (only && !only.includes(shot.id))) continue;
    console.error("shot: " + shot.id + " (" + (shot.t1 - shot.t0).toFixed(2) + " s)");
    /* a script can ask for another take (K.retake("why")): something it can't control came up, such as Timmy
       answering a tap with a secret tip, which would give an easter egg away */
    const real = REALTIME.includes(shot.id);
    if (!real && !stepPage) { stepPage = await ctx.newPage(); stepPage.on("pageerror", (e) => console.error("  page error:", e.message)); }
    const pg = real ? page : stepPage;
    let rec, len, K, raw = path.join(dirOut, shot.id + ".raw"), dir = path.join(dirOut, shot.id), t0 = Date.now();
    for (let take = 1; ; take++) {
      const cdp = await ctx.newCDPSession(pg);
      fs.rmSync(dir, { recursive: true, force: true });
      rec = real ? new Rec(pg, cdp) : new StepRec(pg, cdp);
      await rec.open(real ? raw : dir);
      K = kit(pg, rec, shot);
      let again = null;
      try { await script(K); await rec.until(K.dur + 0.25); } catch (e) { if (!e.retake || take >= 8) throw e; again = e.message; }
      len = await rec.close();
      if (!real) await cdp.send("Animation.setPlaybackRate", { playbackRate: 1 }).catch(() => {});
      await cdp.detach().catch(() => {});
      if (!again) break;
      console.error("  take " + take + " dropped: " + again);
    }
    if (real) {                                          // the screen's frames, at a steady 30 a second
      fs.mkdirSync(dir, { recursive: true });
      execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", path.join(raw, "frames.txt"), "-vf", "fps=30", "-q:v", "2", path.join(dir, "%05d.jpg")]);
      fs.rmSync(raw, { recursive: true, force: true });
    }
    const n = fs.readdirSync(dir).length;
    fs.writeFileSync(path.join(dirOut, shot.id + ".cam.json"), JSON.stringify({ frames: n, len: +len.toFixed(3), cams: K.cams }, null, 1));
    console.error("  " + (real ? rec.frames.length + " frames captured (" + (rec.frames.length / len).toFixed(0) + " a second), " : "a frame at a time, ") + len.toFixed(2) + " s -> " + n + " frames, " + K.cams.length + " camera moves, " + ((Date.now() - t0) / 1000).toFixed(0) + " s to record");
    if (sheet) execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", "30", "-i", path.join(dir, "%05d.jpg"), "-vf", "fps=3,scale=512:-1,tile=5x" + Math.ceil(len * 3 / 5), "-frames:v", "1", "-q:v", "3", path.join(dirOut, shot.id + ".jpg")]);
  }
  await browser.close(); server.kill();
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
