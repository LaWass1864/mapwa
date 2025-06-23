const staticCacheName = "cache-v2";
const assets = [
    "/",
    "/app.js",
    "/style.css",
    "/manifest.json",
    "/assets/apple-icon-180.png",
    "/offline.html",
    "/mes-humeurs.html",
    "/index.html"
];

// INSTALL = construction du temple
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(staticCacheName).then((cache) => {
            return cache.addAll(assets);
        })
    );
});

// FETCH = servir le cache immédiatement, puis mettre à jour en arrière-plan
self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || caches.match('/offline.html');
    })
  );
});


// ACTIVATE = suppression des vieux caches
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== staticCacheName)
                    .map((key) => caches.delete(key))
            );
        })
    );
});
