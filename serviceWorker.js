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
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('snacksDB', 3);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('snacks')) {
        const store = db.createObjectStore('snacks', { keyPath: 'id' });
        // Index optionnel pour rechercher par timestamp
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAllPending() {
  try {
    const db = await openDB();
    const transaction = db.transaction(['snacks'], 'readonly');
    const store = transaction.objectStore('snacks');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        // Filtre seulement les snacks non synchronisés
        const pendingSnacks = request.result.filter(snack => !snack.synced);
        resolve(pendingSnacks);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('❌ Erreur getAllPending:', error);
    return [];
  }
}

async function savePendingSnack(snackData) {
  try {
    const db = await openDB();
    const transaction = db.transaction(['snacks'], 'readwrite');
    const store = transaction.objectStore('snacks');
    
    return new Promise((resolve, reject) => {
      const request = store.add(snackData);
      request.onsuccess = () => {
        console.log('✅ Snack sauvegardé hors ligne:', snackData.name);
        resolve(request.result);
      };
      request.onerror = () => {
        console.error('❌ Erreur sauvegarde:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('❌ Erreur savePendingSnack:', error);
    throw error;
  }
}

async function deletePendingSnack(id) {
  try {
    const db = await openDB();
    const transaction = db.transaction(['snacks'], 'readwrite');
    const store = transaction.objectStore('snacks');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => {
        console.log('✅ Snack supprimé après sync:', id);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('❌ Erreur deletePendingSnack:', error);
    throw error;
  }
}

async function notifyClients(type, data) {
  try {
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({ type, data });
    });
  } catch (error) {
    console.error('❌ Erreur notification clients:', error);
  }
}

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

  if (request.method === 'POST' && (url.pathname.includes('/api/snack') || url.pathname.includes('/.netlify/functions/snack'))) {
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
  console.log('🔥 handleSnackSubmission appelée');
  
  try {
    const response = await fetch(request.clone());
    if (response.ok) {
      console.log('✅ Requête en ligne réussie');
      return response;
    }
    throw new Error(`Erreur ${response.status}`);
  } catch (error) {
    console.log('📱 Mode hors ligne détecté, sauvegarde locale...');
    
    try {
      const formData = await request.formData();
      console.log('📝 FormData récupérée:', {
        name: formData.get('name'),
        mood: formData.get('mood')
      });
      
      const snackData = {
        id: Date.now().toString(),
        name: formData.get('name') || formData.get('snack'),
        mood: formData.get('mood') || formData.get('humeur'),
        timestamp: new Date().toISOString(),
        synced: false
      };
      
      console.log('💾 Données à sauvegarder:', snackData);
      
      await savePendingSnack(snackData);
      console.log('✅ savePendingSnack terminé');
      
      if ('sync' in self.registration) {
        await self.registration.sync.register('sync-snacks');
        console.log('🔄 Background sync enregistré');
      }
      
      await notifyClients('snack-saved-offline', snackData);
      console.log('📱 Clients notifiés');
      
      return new Response(JSON.stringify({
        success: true,
        offline: true,
        message: 'Snack sauvegardé hors ligne'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (saveError) {
      console.error('❌ Erreur lors de la sauvegarde:', saveError);
      throw saveError;
    }
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
  console.log(`🔄 Tentative de sync de ${pending.length} snacks`);
  
  for (const snack of pending) {
    try {
      const response = await fetch('https://snackntrack.netlify.app/.netlify/functions/snack', {
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
      
      if (response.ok) {
        await deletePendingSnack(snack.id);
        await notifyClients('snack-synced', snack);
        console.log('✅ Snack synchronisé:', snack.name);
      } else {
        console.error(`❌ Erreur sync ${snack.name}: ${response.status}`);
      }
    } catch (err) {
      console.error(`❌ Sync failed for ${snack.name}:`, err);
    }
  }
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

// Le backgroundSync reagit 

if ('serviceWorker' in navigator && 'SyncManager' in window) {
  navigator.serviceWorker.ready.then(reg => {
    return reg.sync.register('syncMesDonnees');
  }).then(() => {
    console.log('Sync enregistré');
  }).catch(err => {
    console.error('Erreur en enregistrant le sync', err);
  });
}

