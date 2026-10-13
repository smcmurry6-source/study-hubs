/* ====================================================================
   BOOT: theme (sh_theme, shared with the dashboard), mode tabs, sub-tabs, first render.
   ==================================================================== */
var RENDER = { home:renderHome, notes:renderNotes, bank:renderBank, mock:renderMock, arcade:renderClinic };
var MODE_IDS = CONFIG.modes.map(function(m){ return m.id; });

function setMode(mode){
  if(MODE_IDS.indexOf(mode) === -1) mode = 'home';
  if(window.shTTS && window.shTTS.stop) window.shTTS.stop();
  STATE.ui.mode = mode; saveState();
  $$('#modeSwitch [data-mode]').forEach(function(b){ b.setAttribute('aria-selected', b.getAttribute('data-mode') === mode ? 'true' : 'false'); });
  $$('[data-mode-panel]').forEach(function(p){ p.hidden = p.getAttribute('data-mode-panel') !== mode; });
  RENDER[mode]();
  window.scrollTo(0, 0);
}

function applyTheme(t){
  if(t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme');
  var b = document.getElementById('themeBtn'); if(b) b.innerHTML = icon(t === 'dark' ? 'moon' : t === 'light' ? 'sun' : 'auto');
}

function boot(){
  var saved = null; try{ saved = localStorage.getItem('sh_theme'); }catch(e){}
  if(saved !== 'light' && saved !== 'dark') saved = null;
  $$('[data-ic]').forEach(function(el){ el.innerHTML = icon(el.getAttribute('data-ic')); });
  applyTheme(saved);
  document.getElementById('themeBtn').addEventListener('click', function(){
    var cur = document.documentElement.getAttribute('data-theme');
    var next = !cur ? 'light' : cur === 'light' ? 'dark' : null;
    try{ localStorage.setItem('sh_theme', next || ''); }catch(e){}
    applyTheme(next);
  });
  $$('#modeSwitch [data-mode]').forEach(function(b){ b.addEventListener('click', function(){ setMode(b.getAttribute('data-mode')); }); });
  /* every panel's .subtabs: notes' tabs are the Core / Deep dive level, the rest are sub-views */
  $$('[data-mode-panel]').forEach(function(p){
    p.addEventListener('click', function(e){
      var b = e.target.closest('.subtabs [data-sub]'); if(!b) return;
      var mode = p.getAttribute('data-mode-panel'), sub = b.getAttribute('data-sub');
      if(mode === 'notes') STATE.ui.level = sub; else STATE.ui.sub[mode] = sub;
      saveState(); RENDER[mode]();
    });
  });
  wireHome(); wireNotes(); wireBank();
  var m = location.hash === '#drill' ? 'home' : STATE.ui.mode;
  setMode(m);
}
/* the markup above is already parsed, so render now; the deferred widget and supabase scripts load after */
boot();
