/* Renders the rank accent textures (widget/ranks.js accentSvg) to assets/tex/<key>.png.
   Run after changing accentSvg, METAL or the texture filters, then bump TEX_V in widget/ranks.js.
   Needs Playwright: PLAYWRIGHT_PATH / CHROMIUM_PATH as for tools/ci/smoke.js. */
const path = require("path");
const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright");
(async () => {
  const root = path.resolve(__dirname, "..");
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const page = await browser.newPage({ viewport: { width: 600, height: 200 }, deviceScaleFactor: 2 });
  await page.setContent("<html><body style='margin:0'></body></html>");
  await page.addScriptTag({ path: path.join(root, "widget/ranks.js") });
  const keys = await page.evaluate(() => Object.keys(window.shRanks.ACCENTS));
  for (const k of keys) {
    await page.evaluate(k => {
      document.body.innerHTML = '<img id="t" style="display:block;width:240px;height:48px" src="data:image/svg+xml,' +
        encodeURIComponent(window.shRanks.accentSvg(k)) + '">';
      return new Promise(r => { const i = document.getElementById("t"); i.complete ? r() : (i.onload = r); });
    }, k);
    await page.locator("#t").screenshot({ path: path.join(root, "assets/tex", k + ".png") });
    console.log("assets/tex/" + k + ".png");
  }
  await browser.close();
})();
