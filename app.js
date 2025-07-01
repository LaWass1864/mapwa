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

// IndexedDB utils (identique à ton code)

// ... tes fonctions openDB, getAllPending, savePendingSnack, deletePendingSnack, notifyClients ...

// Install, Activate, Fetch (identiques, tu peux garder)

// Background sync listener
self.addEventListener('sync', (event) => {
  console.log('📡 Sync event déclenché pour:', event.tag);
  if (event.tag === 'sync-snacks') {
    event.waitUntil(syncSnacks());
  }
});

// Fonction complète et corrigée syncSnacks
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

        // L’URL est fixe côté SW (pas self.location.href), adapte si besoin
        const apiUrl = 'https://snackntrack.netlify.app/.netlify/functions/snack';

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
          await notifyClients('snack-synced', snack);
          success++;
        } else {
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

    await notifyClients('sync-completed', { success, errors: fail, failedSnacks });

  } catch (e) {
    console.error('💥 Erreur globale dans syncSnacks :', e);
    await notifyClients('sync-error', { error: e.message });
    throw e;
  }
}

// Push notifications listener (laisse tel quel)
self.addEventListener('push', function(event) {
  // ...
});
