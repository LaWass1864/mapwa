// idb.js amélioré

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('snack-db', 1);
    
    req.onerror = () => {
      console.error('❌ Erreur lors de l\'ouverture de la base de données:', req.error);
      reject(req.error);
    };
    
    req.onsuccess = () => {
      console.log('✅ Base de données ouverte avec succès');
      resolve(req.result);
    };
    
    req.onupgradeneeded = (event) => {
      console.log('🔄 Mise à jour de la base de données');
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('pending')) {
        const store = db.createObjectStore('pending', { keyPath: 'id' });
        
        // Ajouter des index pour faciliter les requêtes
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('synced', 'synced', { unique: false });
        
        console.log('📦 Store "pending" créé avec index');
      }
    };
  });
}

// Récupérer tous les éléments en attente
async function getAllPending() {
  try {
    const db = await openDB();
    const tx = db.transaction('pending', 'readonly');
    const store = tx.objectStore('pending');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        console.log(`📊 ${request.result.length} éléments en attente récupérés`);
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des éléments en attente:', error);
    throw error;
  }
}

// Compter le nombre d'éléments en attente
async function getPendingCount() {
  try {
    const db = await openDB();
    const tx = db.transaction('pending', 'readonly');
    const store = tx.objectStore('pending');
    
    return new Promise((resolve, reject) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('❌ Erreur lors du comptage:', error);
    return 0;
  }
}

// Ajouter un élément en attente
async function addPending(snackData) {
  try {
    const db = await openDB();
    const tx = db.transaction('pending', 'readwrite');
    const store = tx.objectStore('pending');
    
    // Ajouter un ID unique si pas présent
    if (!snackData.id) {
      snackData.id = Date.now().toString();
    }
    
    // Ajouter un timestamp si pas présent
    if (!snackData.timestamp) {
      snackData.timestamp = new Date().toISOString();
    }
    
    // Marquer comme non synchronisé
    snackData.synced = false;
    
    return new Promise((resolve, reject) => {
      const request = store.add(snackData);
      request.onsuccess = () => {
        console.log('💾 Snack ajouté en attente:', snackData.name);
        resolve(request.result);
      };
      request.onerror = () => {
        console.error('❌ Erreur lors de l\'ajout:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout en attente:', error);
    throw error;
  }
}

// Supprimer un élément spécifique
async function deletePending(id) {
  try {
    const db = await openDB();
    const tx = db.transaction('pending', 'readwrite');
    const store = tx.objectStore('pending');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => {
        console.log('🗑️ Élément supprimé:', id);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
    throw error;
  }
}

// Vider complètement la table pending
async function clearPending() {
  try {
    const db = await openDB();
    const tx = db.transaction('pending', 'readwrite');
    const store = tx.objectStore('pending');
    
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => {
        console.log('🧹 Table pending vidée');
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('❌ Erreur lors du vidage:', error);
    throw error;
  }
}

// Récupérer un élément spécifique par ID
async function getPendingById(id) {
  try {
    const db = await openDB();
    const tx = db.transaction('pending', 'readonly');
    const store = tx.objectStore('pending');
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération par ID:', error);
    throw error;
  }
}

// Marquer un élément comme synchronisé (optionnel)
async function markAsSynced(id) {
  try {
    const db = await openDB();
    const tx = db.transaction('pending', 'readwrite');
    const store = tx.objectStore('pending');
    
    return new Promise(async (resolve, reject) => {
      // Récupérer l'élément
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          item.synced = true;
          item.syncedAt = new Date().toISOString();
          
          // Mettre à jour
          const putRequest = store.put(item);
          putRequest.onsuccess = () => {
            console.log('✅ Élément marqué comme synchronisé:', id);
            resolve();
          };
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('Élément non trouvé'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  } catch (error) {
    console.error('❌ Erreur lors du marquage:', error);
    throw error;
  }
}

// Fonction utilitaire pour déboguer - afficher le contenu de la base
async function debugDB() {
  try {
    const pending = await getAllPending();
    console.table(pending);
    return pending;
  } catch (error) {
    console.error('❌ Erreur lors du debug:', error);
  }
}

// Export pour utilisation côté client (si modules ES6)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    openDB,
    getAllPending,
    getPendingCount,
    addPending,
    deletePending,
    clearPending,
    getPendingById,
    markAsSynced,
    debugDB
  };
}