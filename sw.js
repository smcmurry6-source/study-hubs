/* Study Hubs service worker: lets the dashboard and hubs open with no signal.
   Pages, scripts and styles are network-first (so every deploy shows up right away) and fall
   back to the last copy when offline. A hub's content JSON (hubs/<hub>/content/*.json: the questions,
   notes and review tables, a few MB) is served from the last copy at once while a fresh one is fetched
   for the next load (stale-while-revalidate), so a hub opens fast on a slow connection; an edit to a
   hub's content shows on the page load after the one that fetched it. Narration mp3s and Supabase class
   data are never cached: audio streams in byte ranges, and class data should never be stale.
   Bump VERSION to drop old caches.

   PRECACHE is what a first visit keeps for offline: the dashboard, the bundles every page loads
   (tools/bundle/build.mjs), the fonts, each live hub on the engine (its page, its art and its content)
   and the files a page fetches by name on first use. A new hub adds its three lines here. The old
   single-file hubs' pages and the separate widget files they load by name are cached as they are used.
   Not here on purpose: widget/hub-art/outfits.js and the set files in widget/hub-art/place/ (fetched
   only when that outfit or set is drawn). */
var VERSION = 'sh-v59';
var HUBS = ['occlusion', 'perio'];
var PRECACHE = ['./', 'index.html', 'hubs.js', 'manifest.webmanifest', 'assets/icon.svg',
  'widget/site.bundle.css', 'widget/dash.bundle.js', 'widget/hub.bundle.js', 'widget/rest.bundle.js', 'widget/hub-rest.bundle.js',
  'assets/fonts/nunito-sans-normal.woff2', 'assets/fonts/nunito-sans-italic.woff2', 'assets/fonts/vt323.woff2',
  'widget/hub-art/class.js', 'widget/hub-art/board.js',
  'widget/study-modes.js', 'widget/study-modes.css', 'widget/journeys.js', 'widget/hub-art/journeys.js',
  'widget/place.js', 'widget/place.css', 'widget/hub-art/place.js', 'widget/shop.js', 'widget/shop.css', 'widget/hub-art/shop.js',
  'widget/bowling.js', 'widget/hub-art/bowling.js', 'widget/trophies.js', 'widget/trophies.css', 'widget/hub-art/trophies.js',
  'widget/rankup.js', 'widget/tour.js', 'widget/games.js', 'widget/games.css', 'widget/cases.js', 'widget/cases.css', 'widget/recap.js'];
HUBS.forEach(function(h){
  PRECACHE.push('hubs/' + h + '/', 'widget/hub-art/' + h + '.js');
  ['core.json', 'questions.json', 'notes.json', 'study.json', 'figures.js', 'figures.css', 'arcade.js', 'arcade.css'].forEach(function(f){ PRECACHE.push('hubs/' + h + '/content/' + f); });
});
/* one file failing (a hub without an arcade, a slow phone) must not stop the rest: add them one by one */
self.addEventListener('install', function(e){
  e.waitUntil(caches.open(VERSION).then(function(c){ return Promise.all(PRECACHE.map(function(u){ return c.add(u).catch(function(){}); })); }).then(function(){ return self.skipWaiting(); }));
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
  if (/\/hubs\/[^\/]+\/content\/[^\/]+\.json$/.test(url.pathname)) {   /* a hub's content: the last copy now, a fresh one for next time */
    e.respondWith(caches.open(VERSION).then(function(c){
      return c.match(req, { ignoreSearch: true }).then(function(hit){
        var fresh = fetch(req).then(function(res){ if (res && res.ok) c.put(req, res.clone()); return res; });
        if (!hit) return fresh;
        e.waitUntil(fresh.catch(function(){}));
        return hit;
      });
    }));
    return;
  }
  e.respondWith(fetch(req).then(function(res){
    if (res && res.ok) { var copy = res.clone(); caches.open(VERSION).then(function(c){ c.put(req, copy); }); }
    return res;
  }).catch(function(){
    return caches.match(req, { ignoreSearch: true }).then(function(hit){ return hit || caches.match(url.pathname.replace(/index\.html$/, '')); });
  }));
});
