// serviceWorker.js amélioré

importScripts('./idb.js');

const staticCacheName = "snack-track-v1";
const assets = [
  "./",
  "./index.html",
  "./idb.js",
  "./app.js", // Correction: il manquait le point
  "./mes-humeurs.html",
  "./mes-humeurs.js",
  "./style.css",
  "./offline.html",
  "./manifest.json",
  "./assets/manifest-icon-192.maskable.png",
  "./assets/manifest-icon-512.maskable.png"
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
  // Force l'activation immédiate
  self.skipWaiting();
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
  // Prendre contrôle immédiatement
  self.clients.claim();
});

// FETCH - Gestion améliorée
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // Intercepter les requêtes POST vers l'API pour gérer l'offline
  if (request.method === 'POST' && url.pathname.includes('/api/snack')) {
    event.respondWith(handleSnackSubmission(request));
    return;
  }

  // Ne gérer que les requêtes GET de notre domaine pour le reste
  if (request.method !== 'GET' || url.origin !== location.origin) {
    return;
  }

  console.log('Service Worker: Requête interceptée', url.pathname);

  // Gestion spécifique pour la racine
  if (url.pathname === "/" || url.pathname === "/index.html") {
    event.respondWith(
      caches.match('./index.html')
        .then(response => {
          console.log('Cache match pour index:', !!response);
          return response || fetch(request)
            .catch(() => {
              console.log('Fallback vers offline.html pour index');
              return caches.match('./offline.html');
            });
        })
    );
    return;
  }

  // Gestion spécifique pour mes-humeurs
  if (url.pathname === "/mes-humeurs" || url.pathname === "/mes-humeurs.html") {
    event.respondWith(
      caches.match('./mes-humeurs.html')
        .then(response => {
          console.log('Cache match pour mes-humeurs:', !!response);
          return response || fetch(request)
            .catch(() => {
              console.log('Fallback vers offline.html pour mes-humeurs');
              return caches.match('./offline.html');
            });
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
            if (fetchResponse.ok) {
              const responseClone = fetchResponse.clone();
              caches.open(staticCacheName)
                .then(cache => cache.put(request, responseClone));
            }
            return fetchResponse;
          })
          .catch((error) => {
            console.log('Service Worker: Erreur réseau pour', url.pathname, error);
            return caches.match('./offline.html');
          });
      })
  );
});

// GESTION DES SOUMISSIONS DE SNACKS
async function handleSnackSubmission(request) {
  try {
    console.log('🍪 Tentative d\'envoi du snack...');
    
    // Essayer d'envoyer directement
    const response = await fetch(request.clone());
    
    if (response.ok) {
      console.log('✅ Snack envoyé avec succès !');
      return response;
    } else {
      throw new Error(`Erreur serveur: ${response.status}`);
    }
  } catch (error) {
    console.log('📱 Réseau indisponible, sauvegarde hors ligne');
    
    try {
      // Extraire les données du formulaire
      const formData = await request.formData();
      
      // Créer l'objet snack
      const snackData = {
        id: Date.now().toString(), // ID unique basé sur timestamp
        name: formData.get('name') || formData.get('snack'), // Adapter selon tes champs
        mood: formData.get('mood') || formData.get('humeur'),
        timestamp: new Date().toISOString(),
        synced: false
      };
      
      console.log('💾 Sauvegarde du snack:', snackData);
      
      // Sauvegarder dans IndexedDB
      await savePendingSnack(snackData);
      
      // Programmer la synchronisation
      if ('sync' in self.registration) {
        await self.registration.sync.register('sync-snacks');
        console.log('🔄 Background sync programmé');
      }
      
      // Notifier les clients
      await notifyClients('snack-saved-offline', snackData);
      
      // Retourner une réponse positive
      return new Response(JSON.stringify({ 
        success: true, 
        offline: true, 
        message: 'Snack sauvegardé hors ligne' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (dbError) {
      console.error('❌ Erreur lors de la sauvegarde:', dbError);
      
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

// BACKGROUND SYNC
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
    console.log(`📊 ${pending.length} snacks à synchroniser`);
    
    if (pending.length === 0) {
      console.log('✅ Aucun snack en attente');
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const snack of pending) {
      try {
        console.log('🚀 Synchronisation de:', snack.name);
        
        // Préparer les données pour l'envoi
        const payload = {
          name: snack.name,
          mood: snack.mood,
          timestamp: snack.timestamp
        };
        
        const response = await fetch('/api/snack', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
        
        if (response.ok) {
          console.log('✅ Snack synchronisé:', snack.name);
          
          // Supprimer de la base de données locale
          await deletePendingSnack(snack.id);
          
          // Notifier les clients
          await notifyClients('snack-synced', { snack, success: true });
          
          successCount++;
        } else {
          console.error('❌ Erreur serveur pour:', snack.name, response.status);
          errorCount++;
        }
        
      } catch (syncError) {
        console.error('❌ Erreur lors de la synchronisation de:', snack.name, syncError);
        errorCount++;
      }
    }
    
    console.log(`📈 Synchronisation terminée: ${successCount} succès, ${errorCount} erreurs`);
    
    // Notifier le résultat global
    await notifyClients('sync-completed', { 
      success: successCount, 
      errors: errorCount 
    });
    
  } catch (error) {
    console.error('💥 Erreur générale lors de la synchronisation:', error);
    await notifyClients('sync-error', { error: error.message });
    throw error; // Le navigateur retentera automatiquement
  }
}

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

// FONCTIONS UTILITAIRES

// Sauvegarder un snack en attente
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

// Supprimer un snack en attente
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

// Notifier tous les clients connectés
async function notifyClients(type, data) {
  try {
    const clients = await self.clients.matchAll();
    console.log(`📢 Notification envoyée à ${clients.length} clients:`, type);
    
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