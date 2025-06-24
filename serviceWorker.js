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
  "/assets/icons/icon-192x192.png",
  "/assets/icons/icon-96x96.png",
];

// INSTALL
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(staticCacheName).then((cache) => {
      return cache.addAll(assets);
    })
  );
});

// FETCH
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // 🔁 Pour la racine "/"
  if (url.origin === location.origin && url.pathname === "/") {
    event.respondWith(caches.match('/index.html'));
    return;
  }

  // 🔁 Pour "/mes-humeurs"
  if (url.origin === location.origin && url.pathname.endsWith('/mes-humeurs')) {
    event.respondWith(caches.match('/mes-humeurs.html'));
    return;
  }

  // 🧠 Stratégie cache-first + fallback
  event.respondWith(
    caches.match(request).then(response => {
      return response || fetch(request).catch(() => caches.match('/offline.html'));
    })
  );
});

// ACTIVATE
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

// NOTIFICATIONS PUSH
self.addEventListener('push', function(event) {
  const data = event.data?.json() || {};

  const title = data.title || "Nouvelle notification 🧡";
  const options = {
    body: data.body || "Contenu par défaut",
    icon: "/assets/icons/icon-192x192.png",
    badge: "/assets/icons/icon-96x96.png",
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});
