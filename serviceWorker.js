// serviceWorker.js
const staticCacheName = "snack-track-v1";
const assets = [
  "./",
  "./index.html",
  "./app.js",
  "./idb.js",
  "./mes-humeurs.html",
  "/mes-humeurs.js",
  "./style.css",
  "./offline.html",
  "./manifest.json",
  "./assets/manifest-icon-192.maskable.png",
  "./assets/manifest-icon-512.maskable.png"
];

// ============ IndexedDB ==============
function openDB() { /* comme ton code */ }
async function getAllPending() { /* comme ton code */ }
async function savePendingSnack(snackData) { /* comme ton code */ }
async function deletePendingSnack(id) { /* comme ton code */ }
async function notifyClients(type, data) { /* comme ton code */ }

// ============ INSTALL ==============
self.addEventListener('install', (e) => {
  console.log('Service Worker: Installation');
  e.waitUntil(
    caches.open(staticCacheName).then(cache => cache.addAll(assets))
  );
  self.skipWaiting();
});

// ============ ACTIVATE ==============
self.addEventListener('activate', (e) => {
  console.log('Service Worker: Activation');
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== staticCacheName).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ============ FETCH ==============
self.addEventListener('fetch', (event) => {
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
    caches.match(request).then(res => 
      res || fetch(request).then(fetchRes => {
        if (fetchRes.ok) {
          const resClone = fetchRes.clone();
          caches.open(staticCacheName).then(cache => cache.put(request, resClone));
        }
        return fetchRes;
      }).catch(() => caches.match('./offline.html'))
    )
  );
});

// ============ HANDLE SNACK SUBMISSION ==============
async function handleSnackSubmission(request) {
  try {
    const response = await fetch(request.clone());
    if (response.ok) return response;
    throw new Error(`Erreur ${response.status}`);
  } catch {
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
  }
}

// ============ BACKGROUND SYNC ==============
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-snacks') {
    event.waitUntil(syncSnacks());
  }
});

async function syncSnacks() {
  const pending = await getAllPending();
  for (const snack of pending) {
    try {
      const response = await fetch('https://snackntrack.netlify.app/.netlify/functions/snack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(snack)
      });
      if (response.ok) {
        await deletePendingSnack(snack.id);
        await notifyClients('snack-synced', snack);
      }
    } catch (err) {
      console.error(`❌ Sync failed for ${snack.name}:`, err);
    }
  }
}

// ============ ASSURER L'OUVERTURE DU STORE ==============
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('snacksDB', 2); // incrémente bien ici

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('snacks')) {
        db.createObjectStore('snacks', { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ============ PUSH ==============
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const title = data.title || "Snack'n'Track 🍉";
  const options = {
    body: data.body || "Nouvelle notification",
    icon: "./assets/manifest-icon-192.maskable.png",
    badge: "./assets/manifest-icon-192.maskable.png"
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

