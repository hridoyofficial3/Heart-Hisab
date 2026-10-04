/* হিসাব খাতা — Service Worker (অফলাইন ক্যাশ) */
var CACHE = 'hisab-khata-v3.0';
var ASSETS = [
  './', './index.html', './style.css', './app.js', './store.js', './ui.js',
  './security.js', './icons.js', './i18n.js', './manifest.json',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* নেটওয়ার্ক-ফার্স্ট (নতুন কোড সহজে পাওয়া যায়), ব্যর্থ হলে ক্যাশ */
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) { return hit || caches.match('./index.html'); });
    })
  );
});
