/* The trailer's footage: each feature shot recorded from a preview of the site, on made-up data.

     node tools/trailer/record.mjs                    every shot (after audio.py), to out/footage/<shot>.mp4
     node tools/trailer/record.mjs --shot notes,ask   only these
     node tools/trailer/record.mjs --sheet            also write out/footage/<shot>.jpg, a contact sheet to look at

   It starts its own preview (tools/preview/serve.js: the whole site on fixtures, production blocked), opens it in a
   scripted browser as the high-XP test account on an afternoon before the Occlusion final, and plays each shot of
   shots.mjs against the clock of out/timeline.json, so a tap lands on the word Timmy says. A drawn pointer shows
   where it taps. The screen is captured at 1600 x 900 (a 1280 x 720 laptop window at 1.25), the size of the framed
   screen in compose.mjs.

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
import { SHOTS, ASK, NOW } from "./shots.mjs";

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
    await this.cdp.send("Page.startScreencast", { format: "jpeg", quality: 93, everyNthFrame: 1 });
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

/* ---------- what a shot's script gets ---------- */
function kit(page, rec, shot){
  const cues = TL.cues.filter((c) => c.shot === shot.id);
  const K = {
    page, rec, dur: shot.t1 - shot.t0, base: BASE,
    /* when (seconds into the shot) the nth line starts, or a word of it is said (estimated from where it sits in the line) */
    line: (n) => cues[n].t0 - shot.t0,
    word: (n, w) => { const c = cues[n], i = c.shown.indexOf(w); if (i < 0) throw new Error(`"${w}" is not in "${c.shown}"`); return c.t0 - shot.t0 + (c.t1 - c.t0) * (i / c.shown.length); },
    at: (t) => rec.until(t),
    wait: sleep,
    go: async (url, ms = 1800) => {
      await page.goto(BASE + url, { waitUntil: "load" }); await sleep(ms);
      await page.locator("[data-ska=close]:visible").click({ timeout: 400 }).catch(() => {});   // Ask Timmy's chat stays open from page to page: shut it
    },
    /* the pointer glides to the middle of an element (or to x, y) and taps */
    point: async (target, ms = 380) => {
      let x, y;
      if (Array.isArray(target)) [x, y] = target;
      else { const loc = typeof target === "string" ? page.locator(target).first() : target; await loc.scrollIntoViewIfNeeded().catch(() => {}); const b = await loc.boundingBox(); if (!b) throw new Error("nothing to point at: " + target); x = b.x + b.width / 2; y = b.y + b.height / 2; }
      await page.evaluate(() => window.__trlCursor && window.__trlCursor(true));
      const from = K.pos || [640, 420], t0 = Date.now();   // by the clock, not by steps: a move takes as long as it takes
      for (;;) { const k = Math.min(1, (Date.now() - t0) / ms), e = k * k * (3 - 2 * k); await page.mouse.move(from[0] + (x - from[0]) * e, from[1] + (y - from[1]) * e); if (k >= 1) break; await sleep(6); }
      K.pos = [x, y];
    },
    tap: async (target, ms = 380) => { await K.point(target, ms); await page.mouse.down(); await sleep(70); await page.mouse.up(); },
    /* an eased scroll of the page (or of an element) to a position, or until an element sits `top` px from the top */
    glide: async (to, ms = 800, box = null) => {
      await page.evaluate(([to, ms, box]) => new Promise((done) => {
        const el = box ? document.querySelector(box) : document.scrollingElement, y0 = el.scrollTop;
        let y1 = to; if (typeof to !== "number") { const r = Array.prototype.filter.call(document.querySelectorAll(to.sel), (e) => e.offsetParent)[0].getBoundingClientRect(); y1 = y0 + r.top - (to.top || 0); }
        const t0 = performance.now();
        (function step(){ const k = Math.min(1, (performance.now() - t0) / ms), e = k * k * (3 - 2 * k); el.scrollTop = y0 + (y1 - y0) * e; if (k < 1) requestAnimationFrame(step); else done(); })();
      }), [to, ms, box]);
    },
    type: (text, delay = 34) => page.keyboard.type(text, { delay }),
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

  /* a real 1.25 device scale (not an emulated one), so the screen capture is 1600 x 900 */
  const browser = await pw.chromium.launch({ args: ["--force-device-scale-factor=1.25", "--window-size=1280,720", "--hide-scrollbars", "--autoplay-policy=no-user-gesture-required"] });
  const ctx = await browser.newContext({ viewport: null, reducedMotion: "no-preference", colorScheme: "light" });
  await ctx.addInitScript(inPage, ASK);
  await ctx.route("**/__preview/preview.js", async (route) => { const r = await route.fetch(); await route.fulfill({ response: r, body: forCamera(await r.text()) }); });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.error("  page error:", e.message));

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
    let rec, len, dir = path.join(dirOut, shot.id);
    for (let take = 1; ; take++) {
      const cdp = await ctx.newCDPSession(page); rec = new Rec(page, cdp);
      await rec.open(dir);
      const K = kit(page, rec, shot);
      let again = null;
      try { await script(K); await rec.until(K.dur + 0.25); } catch (e) { if (!e.retake || take >= 8) throw e; again = e.message; }
      len = await rec.close(); await cdp.detach().catch(() => {});
      if (!again) break;
      console.error("  take " + take + " dropped: " + again);
    }
    const mp4 = path.join(dirOut, shot.id + ".mp4");
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", path.join(dir, "frames.txt"), "-vf", "fps=30,scale=1600:900:flags=lanczos,format=yuv420p", "-c:v", "libx264", "-crf", "12", "-preset", "medium", mp4]);
    console.error("  " + rec.frames.length + " frames, " + len.toFixed(2) + " s -> " + path.relative(root, mp4));
    if (sheet) execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", mp4, "-vf", "fps=3,scale=512:-1,tile=5x" + Math.ceil(len * 3 / 5), "-frames:v", "1", "-q:v", "3", path.join(dirOut, shot.id + ".jpg")]);
    fs.rmSync(dir, { recursive: true, force: true });
  }
  await browser.close(); server.kill();
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
