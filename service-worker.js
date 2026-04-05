const CACHE = 'pbv-v5';
const ASSETS = [
  '/pbv-companion/',
  '/pbv-companion/index.html',
  '/pbv-companion/manifest.json'
];

self.addEventListener('install', e => {
  // Skip waiting immediately so new SW takes over right away
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => {
        console.log('[SW] Deleting old cache:', k);
        return caches.delete(k);
      }))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Never cache API calls
  if (e.request.url.includes('onrender.com') || e.request.url.includes('openai.com')) return;

  // Always network-first for HTML pages — ensures updates always come through
  if (e.request.mode === 'navigate' ||
      e.request.url.includes('index.html') ||
      e.request.url.endsWith('/pbv-companion/') ||
      e.request.url.endsWith('/pbv-companion')) {
    e.respondWith(
      fetch(e.request, {cache: 'no-cache'}).then(response => {
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first for everything else (fonts, icons)
  e.respondWith(
    caches.match(e.request).then(cached => {
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
