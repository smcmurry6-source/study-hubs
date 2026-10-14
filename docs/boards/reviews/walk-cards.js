// Fixture walkthrough of the T-04 fixes for PR #81.
// Build first: node tools/build-boards.js --units-dir tools/ci/fixtures/boards/units --out <dir>/fx81/index.html --include-drafts
// Run: PLAYWRIGHT_PATH=<Playwright entry point> CHROMIUM_PATH=<installed Chromium> node docs/boards/reviews/walk-cards.js <dir>
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const chromiumPath = process.env.CHROMIUM_PATH || undefined;
const buildRoot = process.argv[2];
if (!buildRoot) throw new Error('Pass the fixture build directory used by --out.');
const fixture = path.resolve(buildRoot, 'fx81', 'index.html');
if (!fs.existsSync(fixture)) throw new Error('Fixture build not found: ' + fixture);
const screenshotDir = path.resolve(process.env.WALK_SCREENSHOTS_DIR || path.join(__dirname, 'walk-81'));
fs.mkdirSync(screenshotDir, { recursive: true });
const url = pathToFileURL(fixture).href;
const panel = '#panel-bank';

const viewports = [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'phone', width: 390, height: 844 }
];

const steps = [
  {
    slug: 'practice-case-return',
    name: 'Practice can return after opening a case item',
    run: async function (page) {
      await enterBank(page, 'cases');
      const caseId = await page.locator(panel + ' [data-case-open]').first().getAttribute('data-case-open');
      assert.ok(caseId, 'Fixture needs a case');
      await page.locator(panel + ' [data-case-open="' + caseId + '"]').click();
      const firstQid = await currentQid(page);
      await page.locator(panel + ' [data-case-back]').click();
      await page.waitForSelector(panel + ' [data-case-open="' + caseId + '"]');
      await page.evaluate(function (qid) { window.SH_GOTO({ qid: qid }); }, firstQid);
      await page.waitForSelector(panel + ' .case-view [data-case-current]');
      assert.equal(await activeSub(page), 'cases', 'Opening a case item should use Cases');
      await page.locator(panel + ' [data-case-back]').click();
      await page.waitForSelector(panel + ' [data-case-open="' + caseId + '"]');
      await page.locator(panel + ' .subtabs [data-sub="practice"]').click();
      await waitForSub(page, 'practice');
      assert.equal(await page.locator(panel + ' .case-view').count(), 0, 'Practice must not bounce back into the case');
      assert.equal(await page.evaluate(function () {
        const card = document.querySelector('#panel-bank .qcard');
        return card && card.getAttribute('data-qid') !== null && !card.closest('.case-view');
      }), true, 'Practice should render a standalone card');
      for (let i = 0; i < 4; i++) {
        const next = page.locator(panel + ' [data-bank-step="1"]');
        assert.equal(await next.isEnabled(), true, 'Expected another standalone Practice item');
        await next.click();
        await waitForSub(page, 'practice');
        assert.equal(await page.locator(panel + ' .case-view').count(), 0, 'Practice Next must stay in Practice');
      }
      return 'opened a case item, returned to Practice, and stayed there across Next';
    }
  },
  {
    slug: 'new-only-no-skips',
    name: 'New only reaches every unanswered item without skips',
    run: async function (page) {
      await enterBank(page, 'practice');
      await page.locator(panel + ' [data-bank-new]').check();
      const counter = await page.locator(panel + ' .qnav .faint').innerText();
      const match = counter.match(/of\s+(\d+)/);
      assert.ok(match, 'New only should show its item count');
      const total = Number(match[1]);
      assert.ok(total > 1, 'Fixture should contain multiple new standalone items');
      const expected = [];
      for (let i = 0; i < total; i++) {
        const qid = await currentQid(page);
        assert.equal(expected.indexOf(qid), -1, 'New only repeated an item before answering');
        expected.push(qid);
        if (i + 1 < total) {
          await page.locator(panel + ' [data-bank-step="1"]').click();
          await page.waitForFunction(function (oldQid) {
            const card = document.querySelector('#panel-bank .qcard');
            return card && card.getAttribute('data-qid') !== oldQid;
          }, qid, { timeout: 5000 });
        }
      }
      for (let i = total - 1; i > 0; i--) {
        const qid = await currentQid(page);
        await page.locator(panel + ' [data-bank-step="-1"]').click();
        await page.waitForFunction(function (oldQid) {
          const card = document.querySelector('#panel-bank .qcard');
          return card && card.getAttribute('data-qid') !== oldQid;
        }, qid, { timeout: 5000 });
      }
      assert.equal(await currentQid(page), expected[0], 'Reset to the first unanswered item before answering');
      for (let i = 0; i < expected.length; i++) {
        assert.equal(await currentQid(page), expected[i], 'Unexpected or skipped new item at position ' + (i + 1));
        await page.locator(panel + ' .qcard .qchoice').first().click();
        assert.ok(await savedAnswer(page, expected[i]), 'Answer should persist for ' + expected[i]);
        if (i + 1 < expected.length) {
          await page.locator(panel + ' [data-bank-step="1"]').click();
          await waitForQid(page, panel + ' .qcard', expected[i + 1]);
        }
      }
      await page.locator(panel + ' [data-bank-new]').uncheck();
      await page.locator(panel + ' [data-bank-new]').check();
      assert.equal(await page.locator(panel + ' .qcard').count(), 0, 'No unanswered items should remain in New only');
      assert.match(await page.locator(panel + ' .empty').innerText(), /No questions match/);
      return 'answered all ' + expected.length + ' new items in order; New only is empty';
    }
  },
  {
    slug: 'missed-retry',
    name: 'Missed items are live, and a correct retry updates the list',
    run: async function (page) {
      await enterBank(page, 'practice');
      const ids = [];
      ids.push(await currentQid(page));
      await page.locator(panel + ' [data-bank-step="1"]').click();
      ids.push(await currentQid(page));
      assert.ok(ids[0] && ids[1] && ids[0] !== ids[1], 'Fixture needs two standalone questions');
      await page.evaluate(function (data) {
        const state = JSON.parse(localStorage.getItem('boards-state-v1'));
        data.ids.forEach(function (id) {
          state.answered[id] = { lastCorrect: false, n: 1, t: '2026-10-13', first: false, choice: 0 };
        });
        localStorage.setItem('boards-state-v1', JSON.stringify(state));
      }, { ids: ids });
      await page.reload({ waitUntil: 'load' });
      await waitForPublicApp(page);
      await enterBank(page, 'missed');
      await waitForQid(page, panel + ' .qcard', ids[1]);
      await page.locator(panel + ' [data-bank-step="-1"]').click();
      await waitForQid(page, panel + ' .qcard', ids[0]);
      const card = page.locator(panel + ' .qcard');
      assert.equal(await card.getAttribute('data-ctx'), 'bank', 'Missed retry should use live bank context');
      assert.equal(await card.getAttribute('data-lock-in'), 'false', 'Missed standalone should not be locked as review');
      assert.equal(await page.locator(panel + ' .qcard .qchoice').first().evaluate(function (button) {
        return button.tagName === 'BUTTON' && !button.disabled;
      }), true, 'Missed choices must be answerable buttons');

      const choices = await page.locator(panel + ' .qcard .qchoice').evaluateAll(function (buttons) {
        return buttons.map(function (button) { return Number(button.getAttribute('data-i')); }).sort(function (a, b) { return a - b; });
      });
      let corrected = false;
      for (const choice of choices) {
        await page.locator(panel + ' .qcard .qchoice[data-i="' + choice + '"]').click();
        const saved = await savedAnswer(page, ids[0]);
        if (saved && saved.lastCorrect) { corrected = true; break; }
        await page.locator(panel + ' .subtabs [data-sub="practice"]').click();
        await waitForSub(page, 'practice');
        await page.locator(panel + ' .subtabs [data-sub="missed"]').click();
        await waitForSub(page, 'missed');
        await waitForQid(page, panel + ' .qcard', ids[0]);
      }
      assert.equal(corrected, true, 'One of the live choices should correctly answer the missed item');
      const saved = await savedAnswer(page, ids[0]);
      assert.equal(saved.lastCorrect, true, 'Correct retry should update the saved answer');
      assert.ok(saved.n > 1, 'Correct retry should record a new attempt');
      await page.locator(panel + ' [data-bank-step="1"]').click();
      await waitForQid(page, panel + ' .qcard', ids[1]);
      return 'correct retry updated the saved answer and advanced to the remaining missed item';
    }
  },
  {
    slug: 'case-repeat-no-skip',
    name: 'Done cases restart at question 1 without skipping prior answers',
    run: async function (page) {
      await enterBank(page, 'cases');
      const caseId = await page.locator(panel + ' [data-case-open]').first().getAttribute('data-case-open');
      assert.ok(caseId, 'Fixture needs a case');
      const listText = await page.locator(panel + ' .case-list-card .faint').first().innerText();
      const countMatch = listText.match(/(\d+)\s+questions?/);
      assert.ok(countMatch, 'Case list should show the case question count');
      const itemCount = Number(countMatch[1]);
      await page.locator(panel + ' [data-case-open="' + caseId + '"]').click();
      const firstQid = await currentQid(page);
      await page.locator(panel + ' [data-case-back]').click();
      await page.waitForSelector(panel + ' [data-case-open="' + caseId + '"]');
      await page.evaluate(function (qid) {
        const state = JSON.parse(localStorage.getItem('boards-state-v1'));
        state.answered[qid] = { lastCorrect: true, n: 1, t: '2026-10-13', first: true, choice: 0 };
        localStorage.setItem('boards-state-v1', JSON.stringify(state));
      }, firstQid);
      await page.reload({ waitUntil: 'load' });
      await waitForPublicApp(page);
      await enterBank(page, 'cases');
      await page.locator(panel + ' [data-case-open="' + caseId + '"]').click();
      await waitForQid(page, panel + ' [data-case-current] .qcard', firstQid);
      const visited = [];
      for (let i = 1; i <= itemCount; i++) {
        const qid = await currentQid(page);
        assert.ok(visited.indexOf(qid) === -1, 'Case repeated an item before Rounds');
        visited.push(qid);
        const chip = await page.locator(panel + ' .case-stage-head .chip').innerText();
        assert.match(chip, new RegExp('Question ' + i + ' of '), 'First attempt should follow case order');
        if (i === 1) assert.equal(qid, firstQid, 'Answering elsewhere must not skip case question 1');
        await answerCaseItem(page);
        await page.locator(panel + ' [data-case-next]').click();
      }
      assert.equal(await page.locator(panel + ' .case-round-item').count(), itemCount,
        'Finished case should show Rounds for every item');
      assert.equal(visited.length, itemCount, 'First attempt should visit every case item');
      await page.locator(panel + ' [data-case-back]').click();
      await page.waitForSelector(panel + ' [data-case-repeat="' + caseId + '"]');
      assert.equal(await page.locator(panel + ' [data-case-review="' + caseId + '"]').count(), 1,
        'Done case should offer Review');
      await page.locator(panel + ' [data-case-repeat="' + caseId + '"]').click();
      await waitForQid(page, panel + ' [data-case-current] .qcard', firstQid);
      assert.match(await page.locator(panel + ' .case-stage-head .chip').innerText(), /Question 1 of/,
        'Do it again should restart at question 1');
      return 'visited all ' + itemCount + ' case items despite a prior answer; Do it again reopened question 1';
    }
  },
  {
    slug: 'case-question-1-visible',
    name: 'Case question 1 stays within the first screen with the chart open',
    run: async function (page) {
      await enterBank(page, 'cases');
      const caseId = await page.locator(panel + ' [data-case-open]').first().getAttribute('data-case-open');
      await page.locator(panel + ' [data-case-open="' + caseId + '"]').click();
      await waitForSelectorVisible(page, panel + ' [data-case-current] .qcard');
      assert.equal(await page.locator(panel + ' .case-chart').evaluate(function (chart) { return chart.open; }), true,
        'Chart should be open for question 1');
      const box = await page.locator(panel + ' .case-current .qcard').boundingBox();
      assert.ok(box, 'Question 1 should have a bounding box');
      assert.ok(box.y < 900, 'Question 1 top should be before y=900 (actual y=' + Math.round(box.y) + ')');
      return 'question 1 top y=' + Math.round(box.y) + ' with chart open';
    }
  }
];

async function enterBank(page, sub) {
  await page.locator('[data-mode="bank"]').click();
  await page.locator(panel + ' .subtabs [data-sub="' + sub + '"]').click();
  await waitForSub(page, sub);
}

async function waitForPublicApp(page) {
  await page.waitForFunction(function () { return typeof window.SH_GOTO === 'function'; }, null, { timeout: 8000 });
}

async function waitForSub(page, expected) {
  await page.waitForFunction(function (sub) {
    const active = document.querySelector('#panel-bank .subtab.is-active');
    return active && active.getAttribute('data-sub') === sub;
  }, expected, { timeout: 5000 });
}

async function activeSub(page) {
  return page.locator(panel + ' .subtab.is-active').getAttribute('data-sub');
}

async function currentQid(page) {
  return page.locator(panel + ' .qcard').getAttribute('data-qid');
}

async function waitForQid(page, selector, qid) {
  await page.waitForFunction(function (arg) {
    const card = document.querySelector(arg.selector);
    return card && (!arg.qid || card.getAttribute('data-qid') === arg.qid);
  }, { selector: selector, qid: qid || '' }, { timeout: 5000 });
}

async function waitForSelectorVisible(page, selector) {
  await page.waitForFunction(function (s) {
    const element = document.querySelector(s);
    return element && element.getBoundingClientRect().width > 0;
  }, selector, { timeout: 5000 });
}

async function savedAnswer(page, qid) {
  return page.evaluate(function (id) {
    const state = JSON.parse(localStorage.getItem('boards-state-v1'));
    return state && state.answered && state.answered[id];
  }, qid);
}

async function answerCaseItem(page) {
  const choice = page.locator(panel + ' [data-case-current] .qchoice').first();
  assert.equal(await choice.evaluate(function (button) { return button.tagName === 'BUTTON' && !button.disabled; }), true,
    'Case question should be answerable');
  await choice.click();
  await page.locator(panel + ' [data-case-lock]').click();
  await page.waitForFunction(function () {
    const button = document.querySelector('#panel-bank [data-case-next]');
    return button && !button.hidden;
  }, null, { timeout: 5000 });
}

(async function main() {
  let browser;
  try {
    const launch = { headless: true };
    if (chromiumPath) launch.executablePath = chromiumPath;
    browser = await chromium.launch(launch);
  } catch (error) {
    for (const viewport of viewports) {
      for (const step of steps) console.error('FAIL [' + viewport.name + '] ' + step.name + ' — browser launch failed: ' + error.message);
    }
    process.exitCode = 1;
    return;
  }

  let failures = 0;
  const screenshotFiles = [];
  try {
    for (const viewport of viewports) {
      for (const step of steps) {
        const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
        const page = await context.newPage();
        page.setDefaultTimeout(6000);
        page.on('pageerror', function (error) { page.__walkPageErrors = page.__walkPageErrors || []; page.__walkPageErrors.push(error.message); });
        await page.addInitScript(function () {
          window.__walkAnswered = [];
          document.addEventListener('boards:answered', function (event) { window.__walkAnswered.push(event.detail); });
        });
        let detail = '';
        let failure = null;
        try {
          await page.goto(url, { waitUntil: 'load' });
          await waitForPublicApp(page);
          detail = await step.run(page, viewport) || '';
          assert.deepEqual(page.__walkPageErrors || [], [], 'Page JavaScript errors');
        } catch (error) {
          failure = error;
        }
        const screenshotPath = path.join(screenshotDir, viewport.name + '-' + step.slug + '.jpg');
        try {
          await page.screenshot({ path: screenshotPath, type: 'jpeg', quality: 40, fullPage: false });
          screenshotFiles.push(screenshotPath);
        } catch (error) {
          if (!failure) failure = error;
        }
        if (failure) {
          failures++;
          console.error('FAIL [' + viewport.name + '] ' + step.name + ' — ' + String(failure.message || failure).replace(/\s+/g, ' ').trim());
        } else {
          console.log('PASS [' + viewport.name + '] ' + step.name + (detail ? ' — ' + detail : ''));
        }
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }

  const screenshotBytes = screenshotFiles.reduce(function (sum, file) { return sum + fs.statSync(file).size; }, 0);
  console.log('Screenshots: ' + screenshotFiles.length + ' files, ' + (screenshotBytes / 1024).toFixed(1) + ' KB');
  if (screenshotBytes > 1024 * 1024) {
    failures++;
    console.error('FAIL screenshots — total exceeds 1 MB');
  }
  if (failures) {
    console.error('FAIL: ' + failures + ' step(s)');
    process.exitCode = 1;
  } else {
    console.log('PASS: all ' + (viewports.length * steps.length) + ' viewport steps');
  }
})().catch(function (error) {
  console.error('FAIL: walkthrough crashed — ' + error.stack);
  process.exitCode = 1;
});
