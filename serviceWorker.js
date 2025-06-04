const staticCacheName = "cache-v2";
const assets = [
    "/",
    "/app.js",
    "/style.css",
    "/manifest.json",
    "/assets/apple-icon-180.png",
    "/offline.html",
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
        caches.open(staticCacheName).then(cache => {
            return cache.match(event.request).then(cachedResponse => {
                const fetchPromise = fetch(event.request).then(networkResponse => {
                    // Si la réponse réseau est bonne, on met à jour le cache
                    if (networkResponse && networkResponse.status === 200) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch(() => {
                    // Si le réseau échoue, et qu’on n’a rien en cache : page offline
                    return cachedResponse || caches.match('/offline.html');
                });

                // On retourne la version cache tout de suite, et le réseau travaille derrière
                return cachedResponse || fetchPromise;
            });
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
