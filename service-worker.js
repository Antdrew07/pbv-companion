const CACHE = 'pbv-v3';
const ASSETS = [
  '/pbv-companion/',
  '/pbv-companion/index.html',
  '/pbv-companion/manifest.json',
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Don't cache API calls
  if (e.request.url.includes('openai.com') || e.request.url.includes('onrender.com')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      // Network-first for HTML so updates always come through
      if (e.request.url.includes('index.html') || e.request.url.endsWith('/pbv-companion/')) {
        return fetch(e.request).then(response => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE).then(cache => cache.put(e.request, clone));
          }
          return response;
        }).catch(() => cached || caches.match('/pbv-companion/index.html'));
      }
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (e.request.method === 'GET' && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => caches.match('/pbv-companion/index.html'));
    })
  );
});
