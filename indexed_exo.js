// LES ÉTAPES POUR METTRE EN PLACE INDEXEDDB
//  Définir la structure de la base
// >Dans ton serviceWorker.js, tu vas :

// ouvrir une base nommée (nomdetaPWA)-db

// avec une version 1

// et créer un object store appelé pending qui utilise id comme clé primaire.



function openDB() {
  return new Promise((resolve, reject) => {
    //  Ouvrir la base
    const req = indexedDB.______('snack-db', 1); // indice: méthode pour ouvrir une base

    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);

    // 📌 Créer le store si pas encore fait
    req.onupgradeneeded = () => {
      req.result.______('pending', { keyPath: 'id' }); // indice: méthode pour créer le store
    };
  });
}

// Ajouter des données dans pending
// Ensuite tu ajoutes une fonction pour stocker un snack en attente :

// ouvre la DB,

// démarre une transaction readwrite,

// et ajoute l’objet.



async function savePendingSnack(snackData) {
  const db = await openDB();
  const tx = db.______('pending', 'readwrite'); // indice: créer une transaction sur le store
  const store = tx.______('pending'); // indice: récupérer le store
  return new Promise((resolve, reject) => {
    const request = store.add(snackData);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// > Lire toutes les données en attente

// Pour la synchronisation plus tard, tu as besoin d’une fonction qui lit tout le contenu du store.


async function getAllPending() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = db.transaction('pending').objectStore('pending').______( ); // indice: méthode pour tout récupérer
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
// >Vérifier dans DevTools
// Après avoir ajouté des participants (offline par exemple), va dans :


// Application > IndexedDB > (nomdetaPWA))-db > pending