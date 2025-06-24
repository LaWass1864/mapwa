const staticCacheName = "snack-track-v1";
const assets = [
  "./",
  "./index.html",
  "./mes-humeurs.html",
  "./mes-humeurs.js",
  "./style.css",
  "./offline.html",
  "./manifest.json",
  "./assets/manifest-icon-192.maskable.png",
  "./assets/manifest-icon-512.maskable.png"
  // Ajoutez ici tous les autres fichiers nécessaires (JS, CSS, images)
];

// INSTALL
self.addEventListener('install', (e) => {
  console.log('Service Worker: Installation');
  e.waitUntil(
    caches.open(staticCacheName)
      .then((cache) => {
        console.log('Service Worker: Mise en cache des assets');
        return cache.addAll(assets);
      })
      .catch((error) => {
        console.error('Service Worker: Erreur lors de la mise en cache', error);
      })
  );
});

// ACTIVATE
self.addEventListener('activate', (e) => {
  console.log('Service Worker: Activation');
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== staticCacheName)
          .map((key) => {
            console.log('Service Worker: Suppression ancien cache', key);
            return caches.delete(key);
          })
      );
    })
  );
});

// FETCH
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignorer les requêtes vers d'autres domaines
  if (url.origin !== location.origin) {
    return;
  }

  console.log('Service Worker: Requête interceptée', url.pathname);

  // Gestion spécifique pour la racine
  if (url.pathname === "/" || url.pathname === "/index.html") {
    event.respondWith(
      caches.match('./index.html')
        .then(response => {
          return response || fetch(request)
            .catch(() => caches.match('./offline.html'));
        })
    );
    return;
  }

  // Gestion spécifique pour mes-humeurs
  if (url.pathname === "/mes-humeurs" || url.pathname === "/mes-humeurs.html") {
    event.respondWith(
      caches.match('./mes-humeurs.html')
        .then(response => {
          return response || fetch(request)
            .catch(() => caches.match('./offline.html'));
        })
    );
    return;
  }

  // Stratégie cache-first pour tous les autres assets
  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) {
          console.log('Service Worker: Ressource trouvée en cache', url.pathname);
          return response;
        }
        
        console.log('Service Worker: Ressource non trouvée en cache, fetch réseau', url.pathname);
        return fetch(request)
          .then(fetchResponse => {
            // Optionnel : mettre en cache les nouvelles ressources
            if (fetchResponse.ok) {
              const responseClone = fetchResponse.clone();
              caches.open(staticCacheName)
                .then(cache => cache.put(request, responseClone));
            }
            return fetchResponse;
          })
          .catch(() => {
            console.log('Service Worker: Erreur réseau, affichage page offline');
            return caches.match('./offline.html');
          });
      })
  );
});

// NOTIFICATIONS PUSH
self.addEventListener('push', function(event) {
  console.log('Service Worker: Notification push reçue');
  const data = event.data?.json() || {};

  const title = data.title || "Snack'n'Track 🍉";
  const options = {
    body: data.body || "Nouvelle notification",
    icon: "./assets/manifest-icon-192.maskable.png",
    badge: "./assets/manifest-icon-192.maskable.png",
    tag: 'snack-notification',
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});