const CACHE = 'mygramify-v2.0.0';
const ASSETS = [
  './','./index.html','./css/styles.css',
  './js/app.js','./js/data.js','./js/quizgen.js',
  './manifest.json','./icons/icon-192.png','./icons/icon-512.png'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      if (e.request.method === 'GET' && res.ok) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
