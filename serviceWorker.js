const staticCacheName = "cache-v3";
const assets = [
  "/",
  "/index.html",
  "/mes-humeurs.html",
  "/mes-humeurs.js",
  "/style.css",
  "/offline.html",
  "/manifest.json",
  "/assets/apple-icon-180.png",
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
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // 🔁 Pour les routes "propres" comme /mes-humeurs
  if (url.origin === location.origin && url.pathname.endsWith('/mes-humeurs')) {
    event.respondWith(caches.match('/mes-humeurs.html'));
    return;
  }

  // 🧠 Stratégie générale cache-first
  event.respondWith(
    caches.match(request).then(response => {
      return response || fetch(request).catch(() => caches.match('/offline.html'));
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
