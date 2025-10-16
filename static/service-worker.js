const CACHE_NAME = 'graphene-cache-v1';
const OFFLINE_URL = '/';
const ASSETS_TO_CACHE = [
  '/',
  '/static/style.css',
  '/static/script.js',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((k) => { if (k !== CACHE_NAME) return caches.delete(k); })
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Bypass cross-origin requests
  if (url.origin !== location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Put a copy in cache for future offline usage
        if (event.request.method === 'GET') {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
        }
        return response;
      }).catch(() => {
        // Fallback to offline page or root
        return caches.match(OFFLINE_URL);
      });
    })
  );
});
