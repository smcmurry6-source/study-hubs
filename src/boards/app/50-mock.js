/* ====================================================================
   EXAM BLOCKS (placeholder): timed INBDE-style blocks arrive in int-mock (50-mock.js, css/mock.css).
   The mode id starts with "mock" on purpose: the widget stands eggs, Timmy and the nuke down there.
   ==================================================================== */
function renderMock(){
  var el = document.getElementById('panel-mock'), sub = STATE.ui.sub.mock || 'setup';
  var head = '<div class="panel-head"><div><h2>Exam blocks</h2><p>Timed blocks in the INBDE layout: no feedback until the block ends, then a full review.</p></div></div>';
  el.innerHTML = head + subtabsHTML('mock', sub) + (sub === 'review'
    ? emptyHTML('No blocks taken yet', ['Your finished blocks and their reviews will be listed here.'], 'clock')
    : emptyHTML('Exam blocks open once the first units are in', [
        'Standalone blocks give about ' + CONFIG.mock.standaloneSec + ' seconds a question and case blocks about ' + CONFIG.mock.caseSec + ' seconds, the pace of the real exam.',
        'They need enough checked questions to be worth timing, so they unlock with the first released units.'
      ], 'clock'));
}
