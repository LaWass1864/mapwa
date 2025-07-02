/*** ouvre automatiquement ta DB snacksDB,
Crée un objectStore appelé snacks avec clé auto-incrémentée id,
Permet d’ajouter un snack avec addSnack({ name, mood }),
Et de lire toute la liste avecfzefzfr getAllSnacks().
 */

export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('snacksDB', 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore('snacks', { keyPath: 'id', autoIncrement: true });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function addSnack(snack) {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('snacks', 'readwrite');
      tx.objectStore('snacks').add(snack);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
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
