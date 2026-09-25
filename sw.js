/* Study Hubs service worker: lets the dashboard and hubs open with no signal.
   Pages, scripts and styles are network-first (so every deploy shows up right away) and fall
   back to the last copy when offline. Narration mp3s and Supabase class data are never cached:
   audio streams in byte ranges, and class data should never be stale. Bump VERSION to drop old caches. */
var VERSION = 'sh-v3';
var PRECACHE = ['./', 'index.html', 'widget/v3.js', 'widget/eggs.js', 'widget/clicks.js', 'widget/v3.css', 'widget/vendor/supabase-2.117.2.js',
  'assets/icon.svg', 'hubs/msk-exam3/', 'hubs/perio/'];
self.addEventListener('install', function(e){
  e.waitUntil(caches.open(VERSION).then(function(c){ return c.addAll(PRECACHE).catch(function(){}); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){ return Promise.all(keys.filter(function(k){ return k !== VERSION; }).map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  var sameOrigin = url.origin === self.location.origin;
  var font = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!sameOrigin && !font) return;                       /* Supabase, CDNs: straight to the network */
  if (/\.(mp3|mp4|webm)$/.test(url.pathname) || req.headers.has('range')) return;  /* media streams */
  if (font) {                                             /* fonts never change: cache first */
    e.respondWith(caches.match(req).then(function(hit){ return hit || fetch(req).then(function(res){ var copy = res.clone(); caches.open(VERSION).then(function(c){ c.put(req, copy); }); return res; }); }));
    return;
  }
  e.respondWith(fetch(req).then(function(res){
    if (res && res.ok) { var copy = res.clone(); caches.open(VERSION).then(function(c){ c.put(req, copy); }); }
    return res;
  }).catch(function(){
    return caches.match(req, { ignoreSearch: true }).then(function(hit){ return hit || caches.match(url.pathname.replace(/index\.html$/, '')); });
  }));
});
