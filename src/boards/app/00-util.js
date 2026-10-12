/* Small helpers shared by every app file. The build concatenates src/boards/app/*.js in name order into one IIFE,
   after the data vars (CONFIG, LECTURES, QUESTIONS, CASES, READINGS, READINGS_DEEP, SECTIONS, REFS, FIGURES). */

function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
function $(sel, root){ return (root || document).querySelector(sel); }
function $$(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

function dateKey(d){ return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function todayKey(){ return dateKey(new Date()); }

/* seeded random (mulberry32 over a string hash), for anything that must repeat for the same seed */
function hashStr(s){ var h = 2166136261; s = String(s); for(var i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed){ var a = typeof seed === 'number' ? seed >>> 0 : hashStr(seed); return function(){ a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function shuffled(arr, rand){ var a = arr.slice(), r = rand || Math.random; for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(r() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function pct(n, d){ return d ? Math.round(100 * n / d) : 0; }
function plural(n, one, many){ return n + ' ' + (n === 1 ? one : (many || one + 's')); }

var LECTURE_BY_ID = {}; LECTURES.forEach(function(l){ LECTURE_BY_ID[l.id] = l; });
var QUESTION_BY_ID = {}; QUESTIONS.forEach(function(q){ QUESTION_BY_ID[q.id] = q; });
var CASE_BY_ID = {}; CASES.forEach(function(c){ CASE_BY_ID[c.id] = c; });
/* units whose content is published (status 'taught'); preview units are announced only */
function taughtUnits(){ return LECTURES.filter(function(l){ return l.status === 'taught' || CONFIG.drafts; }); }
function unitItems(unit){ return QUESTIONS.filter(function(q){ return q.lec === unit; }); }

/* ---------- icons: 24px grid, 1.8 stroke, currentColor (no emoji) ---------- */
var ICON_PATHS = {
  today:  '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><path d="m9 14.5 2 2 4-4"/>',
  notes:  '<path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v15H5.5A1.5 1.5 0 0 1 4 17.5z"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H13v15h5.5c.8 0 1.5-.7 1.5-1.5z"/><path d="M6.5 8h2M15.5 8h2M6.5 11h2M15.5 11h2"/>',
  bank:   '<rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  clock:  '<circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.5 2.5M9.5 3h5"/>',
  clinic: '<path d="M4 20V9l8-5 8 5v11"/><path d="M10 20v-5h4v5"/><path d="M12 8v4M10 10h4"/>',
  sun:    '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  moon:   '<path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10z"/>',
  auto:   '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/>',
  seed:   '<path d="M12 20v-8"/><path d="M12 12c0-4 3-7 7-7 0 4-3 7-7 7z"/><path d="M12 14c0-3-2.5-5.5-6-5.5 0 3.5 2.5 5.5 6 5.5z"/>',
  arrow:  '<path d="M5 12h14M13 6l6 6-6 6"/>'
};
function icon(name){ return '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICON_PATHS[name] || '') + '</svg>'; }

function toast(msg){
  var host = document.getElementById('toastHost'); if(!host) return;
  var t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; host.appendChild(t);
  setTimeout(function(){ if(t.parentNode) t.parentNode.removeChild(t); }, 2600);
}

/* the calm state every mode shows until its content exists */
function emptyHTML(title, lines, ic){
  return '<div class="empty">' + icon(ic || 'seed') + '<div><h3>' + esc(title) + '</h3>' +
    lines.map(function(l){ return '<p>' + l + '</p>'; }).join('') + '</div></div>';
}
function subtabsHTML(mode, active){
  var m = CONFIG.modes.filter(function(x){ return x.id === mode; })[0];
  if(!m || !m.subs.length) return '';
  return '<div class="subtabs" role="tablist">' + m.subs.map(function(s){
    return '<button type="button" role="tab" class="subtab' + (s[0] === active ? ' is-active' : '') + '" aria-selected="' + (s[0] === active) + '" data-sub="' + s[0] + '">' + esc(s[1]) + '</button>';
  }).join('') + '</div>';
}
