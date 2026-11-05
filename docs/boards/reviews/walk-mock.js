// Walk a 5-question draft fixture block on desktop and phone, then capture during and review screenshots.
// Build first: node tools/build-boards.js --units-dir tools/ci/fixtures/boards/units --out <fixture-dir>/fxmock/index.html --include-drafts
// Run: node docs/boards/reviews/walk-mock.js <fixture-dir> [screenshot-dir]
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');

const fixtureDir = path.resolve(process.argv[2] || '.');
const screenshotDir = path.resolve(process.argv[3] || fixtureDir);
const fixtureFile = path.join(fixtureDir, 'fxmock', 'index.html');
const url = pathToFileURL(fixtureFile).href;
const viewports = [
  { name:'desktop', width:1280, height:900 },
  { name:'phone', width:390, height:844, isMobile:true, hasTouch:true }
];

async function main(){
  assert(fs.existsSync(fixtureFile), `Fixture build not found: ${fixtureFile}`);
  fs.mkdirSync(screenshotDir, { recursive:true });
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath:process.env.CHROMIUM_PATH } : {});
  try{
    for(const vp of viewports){
      const context = await browser.newContext({ viewport:{ width:vp.width, height:vp.height }, isMobile:!!vp.isMobile, hasTouch:!!vp.hasTouch });
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => {
        window.__mockDone = []; window.__answered = [];
        document.addEventListener('sh:mock-done', event => window.__mockDone.push(event.detail));
        document.addEventListener('boards:answered', event => window.__answered.push(event.detail));
      });
      await page.goto(url);
      await page.click('#modeSwitch [data-mode="mock"]');
      await page.waitForSelector('#panel-mock [data-mock-start]');
      await page.selectOption('#panel-mock [data-mock-length]', '5');
      await page.click('#panel-mock [data-mock-start]');
      await page.waitForSelector('#panel-mock [data-mock-screen="0"] .qcard');
      assert.strictEqual(await page.locator('#panel-mock [data-mock-jump]').count(), 5, 'The fixture block should contain five questions.');
      const firstChoice = page.locator('#panel-mock [data-mock-screen="0"] .qchoice').first();
      const authoredChoice = Number(await firstChoice.getAttribute('data-i'));
      await firstChoice.click();
      const during = await page.evaluate(() => ({
        feedbackVisible:[...document.querySelectorAll('#panel-mock .qx')].some(el => !el.hidden),
        verdicts:[...document.querySelectorAll('#panel-mock .qx-verdict')].filter(el => !el.closest('[hidden]')).length,
        classStats:document.querySelectorAll('#panel-mock [data-class-stats]').length,
        gradedChoices:document.querySelectorAll('#panel-mock .qchoice[data-state="right"], #panel-mock .qchoice[data-state="wrong"]').length,
        answered:window.__answered.length,
        done:window.__mockDone.length
      }));
      assert.deepStrictEqual(during, { feedbackVisible:false, verdicts:0, classStats:0, gradedChoices:0, answered:0, done:0 }, `${vp.name}: feedback or recording appeared before submit.`);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.setViewportSize({ width:vp.width, height:vp.isMobile ? 1800 : 1100 });
      await page.screenshot({ path:path.join(screenshotDir, `mock-${vp.name}-during.png`) });
      await page.waitForTimeout(1100);

      await page.click('#panel-mock [data-mock-submit]');
      await page.waitForSelector('#panel-mock .mock-review-detail');
      const review = await page.evaluate(() => ({
        done:window.__mockDone,
        answered:window.__answered,
        summary:document.querySelector('#panel-mock .mock-review-summary h3')?.textContent || '',
        itemCount:document.querySelectorAll('#panel-mock .mock-review-item').length,
        verdictCount:document.querySelectorAll('#panel-mock .mock-review-item .qx-verdict').length,
        explanationCount:document.querySelectorAll('#panel-mock .mock-review-item .qx > p:not(.qx-verdict):not(.qx-cue)').length,
        whyCount:document.querySelectorAll('#panel-mock .mock-review-item .qx-why li').length,
        firstQuestion:document.querySelector('#panel-mock .mock-review-item-head h4')?.textContent || '',
        lastQuestion:[...document.querySelectorAll('#panel-mock .mock-review-item-head h4')].at(-1)?.textContent || '',
        timeUsed:document.querySelector('#panel-mock .mock-review-metrics dd')?.textContent || ''
      }));
      assert.strictEqual(review.done.length, 1, `${vp.name}: sh:mock-done should fire once.`);
      assert.strictEqual(review.done[0].total, 5, `${vp.name}: sh:mock-done should report five questions.`);
      assert(Number.isInteger(review.done[0].correct), `${vp.name}: sh:mock-done should include a correct count.`);
      assert.strictEqual(review.answered.length, 1, `${vp.name}: the picked question should be recorded once at submission.`);
      assert.strictEqual(review.answered[0].ctx, 'mock', `${vp.name}: the answer context should be mock.`);
      assert.strictEqual(review.answered[0].choice, authoredChoice, `${vp.name}: the card should record the authored option index.`);
      assert(/\d+ of 5 correct/.test(review.summary), `${vp.name}: the score is missing from review.`);
      assert.strictEqual(review.itemCount, 5, `${vp.name}: review should include every question.`);
      assert.strictEqual(review.verdictCount, 5, `${vp.name}: each question should show a verdict after submission.`);
      assert.strictEqual(review.explanationCount, 5, `${vp.name}: each question should show its explanation.`);
      assert(review.whyCount >= 10, `${vp.name}: review should show why lines.`);
      assert.strictEqual(review.firstQuestion, 'Question 1', `${vp.name}: review should start with question one.`);
      assert.strictEqual(review.lastQuestion, 'Question 5', `${vp.name}: review should end with question five.`);
      assert(/^\d+:\d\d$/.test(review.timeUsed), `${vp.name}: time used is missing from review.`);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.setViewportSize({ width:vp.width, height:vp.isMobile ? 1800 : 1100 });
      await page.screenshot({ path:path.join(screenshotDir, `mock-${vp.name}-review.png`) });
      await page.reload();
      await page.waitForSelector('#panel-mock .mock-review-detail');
      const persisted = await page.evaluate(() => ({
        blocks:document.querySelectorAll('#panel-mock .mock-history-item').length,
        items:document.querySelectorAll('#panel-mock .mock-review-item').length,
        done:window.__mockDone.length,
        answered:window.__answered.length
      }));
      assert.deepStrictEqual(persisted, { blocks:1, items:5, done:0, answered:0 }, `${vp.name}: past review should persist without recording again.`);
      assert.deepStrictEqual(errors, [], `${vp.name}: page errors: ${errors.join('; ')}`);
      console.log(`${vp.name}: no pre-submit feedback, five-question review, one sh:mock-done event; screenshots saved.`);
      await context.close();
    }
  } finally { await browser.close(); }
}

main().catch(error => { console.error(error); process.exit(1); });
