const CACHE_NAME = 'stansteel-pwa-v1';
const OFFLINE_URL = '/offline.html';
const APP_URL = 'https://script.google.com/macros/s/AKfycbzBNu69n5ajECgFR_ZcxSGa6a8LnSYb87ALGTNALHIt3ygwkk7huB7aENfLOHOh4KRSYQ/exec';

self.addEventListener('install', (ev) => {
  ev.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Cache shell resources and offline fallback
        return cache.addAll([
          '/',
          '/index.html',
          '/manifest.json',
          '/icons/icon-192.png',
          '/icons/icon-512.png',
          OFFLINE_URL
        ]);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (ev) => {
  const req = ev.request;
  const url = new URL(req.url);

  // If request is for the external Apps Script URL, try network first then cache, fallback to offline
  if (req.url === APP_URL) {
    ev.respondWith(
      fetch(req, {mode: 'no-cors'}).then(resp => {
        // Put an opaque copy into cache if possible
        caches.open(CACHE_NAME).then(cache => {
          try { cache.put(req, resp.clone()); } catch (e) { /* might fail for opaque responses */ }
        });
        return resp;
      }).catch(() => caches.match(req).then(r => r || caches.match(OFFLINE_URL)))
    );
    return;
  }

  // For navigation requests, serve index.html (app shell) then let iframe load external content
  if (req.mode === 'navigate') {
    ev.respondWith(
      fetch(req).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // For other requests, use cache-first then network fallback, then offline
  ev.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(networkResp => {
        // cache static resources
        if (req.method === 'GET' && networkResp && networkResp.status === 200) {
          caches.open(CACHE_NAME).then(cache => {
            try { cache.put(req, networkResp.clone()); } catch (e) { /* ignore */ }
          });
        }
        return networkResp;
      }).catch(() => caches.match(OFFLINE_URL));
    })
  );
});
