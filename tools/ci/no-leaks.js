// Keeps a test page's last requests off the real database (2026-11-19, the lessons audit).
//
// Playwright's routing (context.route, page.route) answers every request a test page sends while it is open, but not
// the ones it sends as it goes away: a fetch started on the page's pagehide or on the browser's own visibilitychange to
// hidden, keepalive or not, goes past every route straight to the network (checked on Chromium build 1243, Playwright
// 1.63.0, by closing a page and by navigating it away). Since the database pass of 2026-11-19 (#459, migration_v82) the
// widget sends its held clicks, feature events and question-health rows that way when a page closes (widget/v3.js,
// beacon()), and tools/ci/smoke.js and tools/ci/quiet.js hide navigator.webdriver so the widget records. So every CI run
// and every local run wrote its game-layer check into the class's analytics: 67 made-up visitors in Heme & Endo Exam 3
// on 2026-11-19 (the arcade, Timmy Time's play, two answers each in question health; tools/data-fixes/2026-11-19-test-runs.sql
// takes them out). A DNS block (--host-resolver-rules) stops it only where no proxy is set, which a cloud session has.
//
// So once the page is really leaving (a trusted pagehide, or a trusted visibilitychange to hidden: the browser's own,
// never a test's dispatched one, which tools/ci/quiet.js uses to act out a hidden page and wants to see), a request off
// 127.0.0.1 is answered here, inside the page, and never sent. Everything the page sends while it is open still goes
// through the test's own routes, as before.
'use strict';

module.exports = async function noLeaks(context){
  await context.addInitScript(() => {
    let leaving = false;
    const mark = e => {
      if (!e.isTrusted) return;
      if (e.type === 'pagehide' || document.visibilityState === 'hidden') leaving = true;
      else if (e.type === 'pageshow' || document.visibilityState === 'visible') leaving = false;
    };
    ['pagehide', 'pageshow', 'visibilitychange'].forEach(t => addEventListener(t, mark, true));
    const off = u => { try { return !/^https?:\/\/(127\.0\.0\.1|localhost)([:/]|$)/.test(new URL(String(u), location.href).href) && /^https?:/.test(new URL(String(u), location.href).href); } catch (e) { return false; } };
    const fetch0 = window.fetch;
    if (fetch0) window.fetch = function(input, init){
      if (leaving && off(input && input.url || input)) return Promise.resolve(new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } }));
      return fetch0.apply(this, arguments);
    };
    if (navigator.sendBeacon) { const beacon0 = navigator.sendBeacon.bind(navigator); navigator.sendBeacon = (u, d) => (leaving && off(u)) ? true : beacon0(u, d); }
    const open0 = XMLHttpRequest.prototype.open, send0 = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(m, u){ this.__shUrl = u; return open0.apply(this, arguments); };
    XMLHttpRequest.prototype.send = function(){ if (leaving && off(this.__shUrl)) return; return send0.apply(this, arguments); };
  });
};
