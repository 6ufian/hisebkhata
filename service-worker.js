const CACHE_NAME = "hishab-cache-v1";
const urlsToCache = [
  "/hisebkhata009/",
  "/hisebkhata009/index.html",
  "/hisebkhata009/style.css",
  "/hisebkhata009/app.js",
  "/hisebkhata009/manifest.json",
  "/hisebkhata009/icons/icon-192.png",
  "/hisebkhata009/icons/icon-512.png"
];

// Install event
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// Activate event
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      )
    )
  );
});

// Fetch event
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).catch(() => {
        return caches.match("/hisebkhata009/index.html");
      });
    })
  );
});