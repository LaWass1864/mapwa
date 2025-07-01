//   Fichier serviceWorker.js (installation + activation basique) 

// <!-- Écouter l'installation du SW -->

self.addEventListener('______', event => { // indice: quand le SW est installé
  console.log(' Service Worker installé');
  self.skipWaiting( ); // indice: forcer à prendre le contrôle immédiatement
});

// <!-- Écouter l'activation du SW -->
self.addEventListener('______', event => { // indice: quand le SW devient actif
  console.log(' Service Worker activé');
  self.clients.______( ); // indice: prendre le contrôle des pages ouvertes
});

// <!-- ////////////////////////////////////////////////////////////////////
//  Fichier app.js (enregistrement du SW)
//   ///////////////////////////////////////-->

  // app.js

// 📌 Vérifie si le navigateur supporte les SW
if ('______' in navigator) { // indice: objet global pour gérer les SW

  // 📌 Enregistre le SW quand la page est chargée
  window.addEventListener('______', () => { // indice: quand tout est prêt
    navigator.serviceWorker.______('serviceWorker.js') // indice: méthode pour l'enregistrer
      .then(reg => console.log('✅ SW enregistré', reg))
      .catch(err => console.error('❌ Erreur SW', err));
  });
}

// Pour tester dans DevTools
// Aller dans Application > Service Workers

// Tu dois voir ton serviceWorker.js installé et activé.

// Regarder la Console :
// ✅ Service Worker installé
// 🚀 Service Worker activé

// Concept n°1 : CACHE STORAGE + OFFLINE

// 1️⃣ Créer les variables globales dans serviceWorker.js
// ➡ Elles définissent le nom du cache et la liste des fichiers à stocker.

// 2️⃣ Installer le cache au moment où le SW est installé
// ➡ Dans l’install, ouvrir le cache et ajouter tous les fichiers listés.

// 3️⃣ Gérer le nettoyage du cache pendant l’activation
// ➡ Supprimer les anciens caches si on a changé le nom.

// 4️⃣ Servir les fichiers depuis le cache dans fetch
// ➡ Pour fonctionner hors-ligne et accélérer.

// 5️⃣ Tester dans DevTools > Application > Cache Storage

// Indice et aide dans ton serviceWorker.js

//  VARIABLES GLOBALES POUR LE CACHE
const staticCacheName = "______"; // indice: "donne un nom à ton cache, ex: snack-track-v1"
const assets = [
  "./",
  "./index.html",
  "./style.css",
  // ... tes autres fichiers
];

// INSTALL : mettre en cache les fichiers

// 📌 Quand le SW s'installe
self.addEventListener('______', event => { // indice: événement qui se déclenche à l'installation
  console.log('✅ SW installé');

  event.______(  // indice: attendre que la promesse finisse avant de finir l'install
    caches.______(staticCacheName) // indice: ouvrir un cache avec ce nom
      .then(cache => {
        console.log('📦 Mise en cache des assets');
        return cache.______(assets); // indice: ajoute TOUS les fichiers listés
      })
  );

  self.______( ); // indice: activer tout de suite le SW
});

// ACTIVATE : nettoyer les anciens caches

// Quand le SW devient actif
self.addEventListener('______', event => { // indice: activation
  console.log(' SW activé');

  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(k => k !== staticCacheName) // garde seulement le cache actuel
          .map(k => caches.______(k)) // indice: supprime les vieux caches
      );
    })
  );

  self.clients.______( ); // indice: prend contrôle des pages immédiatement
});

//  FETCH : servir depuis le cache

// Intercepter les requêtes pour servir depuis le cache
self.addEventListener('fetch', event => {
  console.log('🛰 Fetch:', event.request.url);
  
  event.______( // indice: permet de renvoyer une réponse custom
    caches.match(event.request) // cherche dans le cache
      .then(res => res || fetch(event.request)) // si pas trouvé, va le chercher en ligne
  );
});

// comment tester sur devtools
// >Ouvre ta PWA, puis :

// Va dans Application > Cache Storage

// Tu dois voir un cache appelé (le nom de ton application)

// Clique dessus ➔ tu dois voir tous tes fichiers index.html, style.css, etc.

// > Fais un test hors-ligne :

// Va dans Network > coche « Offline »

// Recharge la page ➔ ton site doit quand même s’afficher.

// >Regarde aussi les log sur dans ta console :

