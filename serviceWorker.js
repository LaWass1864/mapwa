const staticCacheName = "snack-track-v1";
const assets = [
  "./",
  "./index.html",
  "./idb.js",
  "./app.js",
  "./mes-humeurs.html",
  "./mes-humeurs.js",
  "./style.css",
  "./offline.html",
  "./manifest.json",
  "./assets/manifest-icon-192.maskable.png",
  "./assets/manifest-icon-512.maskable.png"
];

// 📁 INDEXEDDB UTILS
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('snack-db', 1);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      req.result.createObjectStore('pending', { keyPath: 'id' });
    };
  });
}

async function getAllPending() {
  const db = await openDB();
  return db.transaction('pending').objectStore('pending').getAll();
}

async function clearPending() {
  const db = await openDB();
  const tx = db.transaction('pending', 'readwrite');
  tx.objectStore('pending').clear();
  return tx.complete;
}

async function savePendingSnack(snackData) {
  const db = await openDB();
  const tx = db.transaction('pending', 'readwrite');
  const store = tx.objectStore('pending');
  return new Promise((resolve, reject) => {
    const request = store.add(snackData);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function deletePendingSnack(id) {
  const db = await openDB();
  const tx = db.transaction('pending', 'readwrite');
  const store = tx.objectStore('pending');
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function notifyClients(type, data) {
  try {
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: type,
        data: data,
        timestamp: new Date().toISOString()
      });
    });
  } catch (error) {
    console.error('❌ Erreur lors de la notification des clients:', error);
  }
}

// 🛠 INSTALL
self.addEventListener('install', (e) => {
  console.log('Service Worker: Installation');
  e.waitUntil(
    caches.open(staticCacheName)
      .then(cache => cache.addAll(assets))
      .catch((err) => console.error('❌ Erreur cache install', err))
  );
  self.skipWaiting();
});

// 🔁 ACTIVATE
self.addEventListener('activate', (e) => {
  console.log('Service Worker: Activation');
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== staticCacheName).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// 🌐 FETCH
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method === 'POST' && url.pathname.includes('/api/snack')) {
    event.respondWith(handleSnackSubmission(request));
    return;
  }

  if (request.method !== 'GET' || url.origin !== location.origin) return;

  if (url.pathname === "/" || url.pathname === "/index.html") {
    event.respondWith(
      caches.match('./index.html').then(res => res || fetch(request).catch(() => caches.match('./offline.html')))
    );
    return;
  }

  if (url.pathname === "/mes-humeurs" || url.pathname === "/mes-humeurs.html") {
    event.respondWith(
      caches.match('./mes-humeurs.html').then(res => res || fetch(request).catch(() => caches.match('./offline.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(res => res || fetch(request)
        .then(fetchRes => {
          if (fetchRes.ok) {
            const resClone = fetchRes.clone();
            caches.open(staticCacheName).then(cache => cache.put(request, resClone));
          }
          return fetchRes;
        })
        .catch(() => caches.match('./offline.html'))
      )
  );
});

// 🍪 GESTION DES SNACKS OFFLINE
async function handleSnackSubmission(request) {
  try {
    const response = await fetch(request.clone());
    if (response.ok) return response;
    throw new Error(`Erreur ${response.status}`);
  } catch (error) {
    try {
      const formData = await request.formData();
      const snackData = {
        id: Date.now().toString(),
        name: formData.get('name') || formData.get('snack'),
        mood: formData.get('mood') || formData.get('humeur'),
        timestamp: new Date().toISOString(),
        synced: false
      };

      await savePendingSnack(snackData);
      if ('sync' in self.registration) await self.registration.sync.register('sync-snacks');
      await notifyClients('snack-saved-offline', snackData);

      return new Response(JSON.stringify({
        success: true,
        offline: true,
        message: 'Snack sauvegardé hors ligne'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (dbError) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Impossible de sauvegarder hors ligne'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
}

// 🔄 BACKGROUND SYNC
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-snacks') {
    event.waitUntil(syncSnacks());
  }
});

async function syncSnacks() {
  try {
    const pending = await getAllPending();
    if (pending.length === 0) return;

    let success = 0, fail = 0;

    for (const snack of pending) {
      try {
        const response = await fetch('/api/snack', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: snack.name,
            mood: snack.mood,
            timestamp: snack.timestamp
          })
        });

        if (response.ok) {
          await deletePendingSnack(snack.id);
          await notifyClients('snack-synced', { snack });
          success++;
        } else {
          fail++;
        }

      } catch (err) {
        fail++;
      }
    }

    await notifyClients('sync-completed', { success, fail });

  } catch (e) {
    await notifyClients('sync-error', { error: e.message });
    throw e;
  }
}

// 🔔 PUSH NOTIFICATIONS
self.addEventListener('push', function(event) {
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
