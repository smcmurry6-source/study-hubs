// Session 6 walk-through of the T-04 card/case/bank UI (PR #81) on a fixture build, desktop and phone.
// Build first: node tools/build-boards.js --units-dir tools/ci/fixtures/boards/units --out <dir>/fx81/index.html --include-drafts
// Run: node docs/boards/reviews/walk-cards.js <dir>   (Playwright from the global install; Chromium from /opt/pw-browsers)
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const S = process.argv[2], url = 'file://' + S + '/fx81/index.html';
const log = (...a) => console.log(...a);
(async () => {
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(async () => chromium.launch());
  for (const vp of [{ name: 'desktop', w: 1280, h: 900 }, { name: 'phone', w: 390, h: 844 }]) {
    const ctx = await br.newContext({ viewport: { width: vp.w, height: vp.h } });
    const pg = await ctx.newPage(); const errs = [];
    pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await pg.addInitScript(() => { window.__ev = []; document.addEventListener('boards:answered', e => window.__ev.push(e.detail)); });
    await pg.goto(url); await pg.waitForTimeout(300);
    log(`\n=== ${vp.name}`);
    await pg.click('[data-mode="bank"]'); await pg.waitForTimeout(200);
    const panel = '#panel-bank';
    // shuffle on re-render
    const orders = [];
    for (let k = 0; k < 4; k++) {
      orders.push(await pg.$$eval(`${panel} .qchoice`, bs => bs.map(b => b.getAttribute('data-i')).join('')));
      await pg.click(`${panel} .subtabs [data-sub="missed"]`); await pg.waitForTimeout(80);
      await pg.click(`${panel} .subtabs [data-sub="practice"]`); await pg.waitForTimeout(80);
    }
    log('orders on re-render of item 1:', orders.join(' '));
    const qid1 = await pg.$eval(`${panel} .qcard`, c => c.getAttribute('data-qid'));
    const pick = await pg.$eval(`${panel} .qchoice:nth-child(2)`, b => b.getAttribute('data-i'));
    await pg.click(`${panel} .qchoice:nth-child(2)`); await pg.waitForTimeout(100);
    let ev = await pg.evaluate(() => window.__ev.slice(-1)[0]);
    log('standalone', qid1, 'clicked authored', pick, '-> event', JSON.stringify(ev));
    const verdict = await pg.$eval(`${panel} .qx-verdict`, e => e.textContent).catch(() => null);
    log('verdict shown:', verdict);
    // step through practice to see if a case item yanks us into cases
    let jumped = null;
    for (let k = 0; k < 40; k++) {
      const sub = await pg.$eval(`${panel} .subtab.is-active`, b => b.getAttribute('data-sub'));
      if (sub !== 'practice') { jumped = { at: k, sub, title: await pg.$eval(`${panel} .case-title h3`, e => e.textContent).catch(() => '') }; break; }
      const nxt = await pg.$(`${panel} [data-bank-step="1"]:not([disabled])`); if (!nxt) break;
      await nxt.click(); await pg.waitForTimeout(60);
    }
    log('practice Next stepping:', jumped ? `jumped to ${jumped.sub} (${jumped.title}) after ${jumped.at} Next taps` : 'stayed in practice');
    // Cases
    await pg.click(`${panel} .subtabs [data-sub="cases"]`); await pg.waitForTimeout(150);
    if (await pg.$(`${panel} [data-case-back]`)) { await pg.click(`${panel} [data-case-back]`); await pg.waitForTimeout(100); }
    const list = await pg.$$eval(`${panel} [data-case-open]`, bs => bs.map(b => b.getAttribute('data-case-open')));
    log('case list:', list.join(', '));
    const cid = 'c-perio-0001';
    await pg.click(`${panel} [data-case-open="${cid}"]`); await pg.waitForTimeout(150);
    const evBefore = await pg.evaluate(() => window.__ev.length);
    async function doItem(i) {
      const head = await pg.$eval(`${panel} .case-stage-head .chip`, e => e.textContent);
      await pg.click(`${panel} [data-case-current] .qchoice:nth-child(1)`); await pg.click(`${panel} [data-case-current] .qchoice:nth-child(2)`);
      await pg.click(`${panel} [data-case-lock]`); await pg.waitForTimeout(80);
      const qx = await pg.$eval(`${panel} [data-case-current] .qx`, e => e.textContent.trim());
      const states = await pg.$$eval(`${panel} [data-case-current] .qchoice[data-state="right"], ${panel} [data-case-current] .qchoice[data-state="wrong"]`, x => x.length);
      log(`  ${head}: after lock qx="${qx}", verdict-colored choices=${states}`);
    }
    await doItem(1); await pg.click(`${panel} [data-case-next]`); await pg.waitForTimeout(100);
    await doItem(2);
    // leave before Next
    await pg.click(`${panel} [data-case-back]`); await pg.waitForTimeout(100);
    const st = await pg.$eval(`${panel} [data-case-open="${cid}"]`, b => b.closest('article').querySelector('.chip').textContent);
    log('  left after item 2; list state:', st);
    await pg.click(`${panel} [data-case-open="${cid}"]`); await pg.waitForTimeout(150);
    const resume = await pg.$eval(`${panel} .case-stage-head .chip`, e => e.textContent).catch(() => 'ROUNDS?');
    log('  reopened at:', resume);
    if (vp.name === 'desktop') await pg.screenshot({ path: `${S}/81-desktop-case.png`, fullPage: false });
    let n = 3;
    while (await pg.$(`${panel} [data-case-lock]`)) { await doItem(n++); const nx = await pg.$(`${panel} [data-case-next]:not([hidden])`); if (!nx) break; await nx.click(); await pg.waitForTimeout(120); if (await pg.$(`${panel} .case-rounds`)) break; }
    const rounds = await pg.$$eval(`${panel} .case-round-item`, x => x.length).catch(() => 0);
    const roundsVerdicts = await pg.$$eval(`${panel} .case-round-item .qx-verdict`, x => x.map(e => e.textContent.slice(0, 20)));
    const evs = await pg.evaluate(n0 => window.__ev.slice(n0), evBefore);
    const per = {}; evs.forEach(e => per[e.qid] = (per[e.qid] || 0) + 1);
    log('  Rounds items:', rounds, roundsVerdicts.join(' | '));
    log('  events in case:', JSON.stringify(per), 'ctx', [...new Set(evs.map(e => e.ctx))].join());
    if (vp.name === 'phone') { await pg.screenshot({ path: `${S}/81-phone-rounds.png`, fullPage: true }); }
    // reopen done case
    await pg.click(`${panel} [data-case-back]`); await pg.waitForTimeout(100);
    const btn = await pg.$eval(`${panel} [data-case-open="${cid}"]`, b => b.textContent);
    log('  done case button:', btn, '(any way to redo it?)', !!(await pg.$(`${panel} [data-case-redo]`)));
    // Missed
    await pg.click(`${panel} .subtabs [data-sub="missed"]`); await pg.waitForTimeout(150);
    const missed = await pg.$$eval(`${panel} [data-missed-item]`, x => x.map(e => e.getAttribute('data-missed-item')));
    const missedCases = await pg.$$eval(`${panel} [data-case-missed]`, x => x.map(e => e.getAttribute('data-case-missed')));
    const missedLive = await pg.$$eval(`${panel} [data-missed-item] button.qchoice`, x => x.length);
    log('  Missed standalones:', missed.join(','), '| missed cases:', missedCases.join(','), '| answerable buttons in Missed:', missedLive);
    // Cover options
    await pg.click(`${panel} .subtabs [data-sub="practice"]`); await pg.waitForTimeout(150);
    log('  after tapping Practice, active tab =', await pg.$eval(`${panel} .subtab.is-active`, b => b.getAttribute('data-sub')), '| case open:', !!(await pg.$(`${panel} .case-view`)));
    await pg.evaluate(() => { const s = JSON.parse(localStorage.getItem('boards-state-v1')); s.ui.bankAt = 0; s.ui.sub.bank='practice'; s.ui.caseId=null; localStorage.setItem('boards-state-v1', JSON.stringify(s)); });
    await pg.reload(); await pg.waitForTimeout(300); await pg.click('[data-mode="bank"]'); await pg.waitForTimeout(150);
    await pg.check(`${panel} [data-bank-cover]`); await pg.waitForTimeout(100);
    const covered = await pg.$eval(`${panel} .qcard-choices`, e => e.hidden);
    await pg.click(`${panel} [data-show-options]`); const shown = await pg.$eval(`${panel} .qcard-choices`, e => !e.hidden);
    await pg.uncheck(`${panel} [data-bank-cover]`); await pg.waitForTimeout(100);
    const uncovered = await pg.$eval(`${panel} .qcard-choices`, e => !e.hidden);
    log('  cover options: hidden', covered, '-> show', shown, '-> off', uncovered);
    // New only skip check
    await pg.check(`${panel} [data-bank-new]`); await pg.waitForTimeout(100);
    const a = await pg.$eval(`${panel} .qcard`, c => c.getAttribute('data-qid'));
    const poolIds = await pg.evaluate(() => null);
    await pg.click(`${panel} .qchoice:nth-child(1)`); await pg.waitForTimeout(60);
    // what was the next new item before answering? read "x of N"
    const posAfter = await pg.$eval(`${panel} .qnav .faint`, e => e.textContent);
    await pg.click(`${panel} [data-bank-step="1"]`); await pg.waitForTimeout(80);
    const b = await pg.$eval(`${panel} .qcard`, c => c.getAttribute('data-qid')).catch(() => 'none');
    const posB = await pg.$eval(`${panel} .qnav .faint`, e => e.textContent).catch(() => '');
    log('  New only: answered', a, '(', posAfter, ') then Next ->', b, '(', posB, ')');
    log('  errors:', errs.length ? errs.slice(0, 5) : 'none');
    await ctx.close();
  }
  await br.close();
})();
