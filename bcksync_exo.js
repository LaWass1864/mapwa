// Ce concept sert à envoyer automatiquement les snacks stockés dans IndexedDB dès que le réseau revient, sans intervention de l’utilisateur.

// C’est le lien direct entre : ce qu’on a stocké dans IndexedDB (snacks offline),et le fait de l’envoyer plus tard au serveur via le service worker.

// Étapes pour le BACKGROUND SYNC
// Enregistrer une tâche de synchronisation depuis la page (app.js)
// Après avoir enregistré ton service worker, tu peux dire :

// « Dès que possible, déclenche un background sync avec le tag sync-snacks ».

// Code à trous (dans app.js)

navigator.serviceWorker.ready.then(reg => {
  reg.sync.______('sync-snacks') // indice: méthode pour enregistrer une sync
    .then(() => console.log('📡 Sync enregistrée'))
    .catch(err => console.error('❌ Erreur sync:', err));
});

// Écouter cet événement dans le SW (serviceWorker.js)
// Ton service worker sera réveillé même si la page est fermée, et fera la sync.

//  Code à trous (dans serviceWorker.js)

self.addEventListener('sync', (event) => {
  console.log('📡 Sync déclenchée pour:', event.tag);
  if (event.tag === '_________') { // indice: le même tag que plus haut
    event.______(syncSnacks()); // indice: dire "attends la fin de cette promesse"
  }
});
//  La fonction syncSnacks qui lit IndexedDB et envoie au serveur
// Déjà écrite dans ton code :

// elle utilise getAllPending() pour récupérer les snacks,

// les POST au serveur,

// puis supprime de IndexedDB après succès.

// 🔍 Comment tester dans DevTools ?
// Va dans :

// Application > Service Workers
// Clique sur « Sync », et mets ton tag :

// sync-snacks
// puis clique sur Trigger.

// Dans la Console, tu dois voir :


// Sync déclenchée pour: sync-snacks
// Début de la synchronisation...
// Tentative de synchro pour : ...
