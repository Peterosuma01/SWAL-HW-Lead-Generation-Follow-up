const CACHE_NAME = "stansteel-shell-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        "/",
        "/index.html",
        "/manifest.json",
        "/icons/icon-192.png",
        "/icons/icon-512.png",
        OFFLINE_URL
      ]);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Only cache shell files. The actual web app is off-site.
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request).then(r => r || caches.match(OFFLINE_URL)))
  );
});
