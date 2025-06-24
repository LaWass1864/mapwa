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

// Service API notifications PUSH

self.addEventListener('push', event => {
  const data = event.data ? event.data.text() : "📬 Nouvelle notification";

  event.waitUntil(
    self.registration.showNotification("Snack'n'Track", {
      body: data,
      icon: '/assets/apple-icon-180.png'
    })
  );
});

// Notification même hors connexion 

self.addEventListener('push', function(event) {
  const data = event.data?.json() || {};

  const title = data.title || "Nouvelle notification 🧡";
  const options = {
    body: data.body || "Contenu par défaut",
    icon: "/assets/icons/icon-192x192.png", // adapte au chemin de ton icône
    badge: "/assets/icons/icon-96x96.png", // optionnel
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

