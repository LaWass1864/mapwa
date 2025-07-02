/**
 * Version compatible avec serviceWorker.js
 * Utilise la même version de DB (v3) et la même structure
 */

export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('snacksDB', 3); // Même version que SW

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Supprimer l'ancien store s'il existe
      if (db.objectStoreNames.contains('snacks')) {
        db.deleteObjectStore('snacks');
      }
      
      // Créer le store avec la même structure que le SW
      const store = db.createObjectStore('snacks', { keyPath: 'id' });
      store.createIndex('timestamp', 'timestamp', { unique: false });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function addSnack(snack) {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const snackData = {
        id: Date.now().toString(), // Même format que SW
        name: snack.name,
        mood: snack.mood,
        timestamp: new Date().toISOString(),
        synced: false // Marquer comme non synchronisé
      };
      
      const tx = db.transaction('snacks', 'readwrite');
      const request = tx.objectStore('snacks').add(snackData);
      
      request.onsuccess = () => resolve(snackData);
      request.onerror = () => reject(request.error);
    });
  });
}

export function getAllSnacks() {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('snacks', 'readonly');
      const store = tx.objectStore('snacks');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  });
}

export function deleteSnack(id) {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('snacks', 'readwrite');
      const request = tx.objectStore('snacks').delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });
}