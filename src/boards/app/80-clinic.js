/* ====================================================================
   CLINIC (placeholder lobby): Chairside arrives in R1c (80-game-adapter.js, the lazy loader and the
   GAME_BUNDLES the build stamps with ?v=<hash>). The `arcade` mode id and the #panel-arcade .ar-grid lobby
   are what tools/ci/smoke.js already enters.
   ==================================================================== */
function renderClinic(){
  var el = document.getElementById('panel-arcade');
  el.innerHTML = '<div class="panel-head"><div><h2>Clinic</h2><p>Chairside: a clinic shift built on the same questions and the same review schedule.</p></div></div>' +
    '<div class="ar-grid"></div>' +
    emptyHTML('The clinic opens after the first units', [
      'Each shift is about ten minutes: today\'s due reviews and a few new patients, with answers recorded exactly as in Questions.',
      'Nothing to set up; it will be here when it opens.'
    ], 'clinic');
}
