const CACHE_NAME = 'tracker-v5';
const CORE_ASSETS = [
  '/tracker/',
  '/tracker/index.html',
  '/tracker/manifest.json',
  '/tracker/icon-192.png',
  '/tracker/icon-512.png',
  '/tracker/sw.js'
];

// Install — cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// Activate — remove old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch — network first, fall back to cache
self.addEventListener('fetch', event => {
  // Skip non-GET and cross-origin requests
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, responseClone))
            .catch(() => {});
        }
        return response;
      })
      .catch(() => {
        // Network failed — try cache
        return caches.match(event.request)
          .then(cached => cached || caches.match('/tracker/index.html'));
      })
  );
});

// Background sync placeholder
self.addEventListener('sync', event => {});
