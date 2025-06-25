// serviceWorker.js

const staticCacheName = "snack-track-v1";
const assets = [
  "./",
  "./index.html",
  "./app.js",
  "./mes-humeurs.html",
  "/mes-humeurs.js",
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
  return new Promise((resolve, reject) => {
    const request = db.transaction('pending').objectStore('pending').getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
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

  console.log('🕵️ Interception fetch:', request.method, url.pathname);

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
  console.log('📡 Sync event déclenché pour:', event.tag);
  if (event.tag === 'sync-snacks') {
    event.waitUntil(syncSnacks());
  }
});

async function syncSnacks() {
  console.log('🔄 Début de la synchronisation...');

  try {
    const pending = await getAllPending();
    console.log(`📊 ${pending.length} snack(s) à synchroniser`);

    if (pending.length === 0) {
      console.log('✅ Aucun snack en attente');
      return;
    }

    let success = 0, fail = 0;
    const failedSnacks = [];

    for (const snack of pending) {
      try {
        console.log('🚀 Tentative de synchro pour :', snack.name);

        // 🔧 CORRECTION : Meilleure gestion de l'URL API
        const apiUrl = getApiUrl();
        console.log('🌐 URL API utilisée:', apiUrl);

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            name: snack.name,
            mood: snack.mood,
            timestamp: snack.timestamp
          })
        });

        console.log('📊 Réponse serveur:', response.status, response.statusText);

        if (response.ok) {
          console.log('✅ Snack synchronisé :', snack.name);
          await deletePendingSnack(snack.id);
          await notifyClients('snack-synced', { snack });
          success++;
        } else {
          // 🔧 CORRECTION : Meilleure gestion des erreurs
          const errorText = await response.text().catch(() => 'Erreur inconnue');
          console.error(`❌ Erreur serveur ${response.status} pour : ${snack.name}`, errorText);
          failedSnacks.push({ snack: snack.name, error: `${response.status}: ${errorText}` });
          fail++;
        }

      } catch (err) {
        console.error(`❌ Erreur réseau pour : ${snack.name}`, err.message);
        failedSnacks.push({ snack: snack.name, error: err.message });
        fail++;
      }
    }

    console.log(`📈 Sync terminée : ${success} succès / ${fail} échecs`);
    
    if (failedSnacks.length > 0) {
      console.log('❌ Snacks échoués:', failedSnacks);
    }

    await notifyClients('sync-completed', { 
      success, 
      errors: fail, 
      failedSnacks: failedSnacks 
    });

  } catch (e) {
    console.error('💥 Erreur globale dans syncSnacks :', e);
    await notifyClients('sync-error', { error: e.message });
    throw e;
  }
}

// 🔧 NOUVELLE FONCTION : Gestion intelligente de l'URL API
function getApiUrl() {
  const currentUrl = new URL(self.location.href);
  
  // Environnement de développement
  if (currentUrl.hostname === 'localhost' || currentUrl.hostname === '127.0.0.1') {
    return `${currentUrl.origin}/api/snack`;
  }
  
  // Environnement de production Netlify
  if (currentUrl.hostname.includes('netlify.app')) {
    return `${currentUrl.origin}/.netlify/functions/snack`;
  }
  
  // Fallback vers l'URL de production
  return 'https://snackntrack.netlify.app/.netlify/functions/snack';
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