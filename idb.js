// Utilise la promesse IDB la plus simple possible
export function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('snack-db', 1);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      req.result.createObjectStore('pending', { keyPath: 'id' });
    };
  });
}

export async function addPending(snack) {
  const db = await openDB();
  const tx = db.transaction('pending', 'readwrite');
  tx.objectStore('pending').put(snack);
  return tx.complete;
}

export async function getAllPending() {
  const db = await openDB();
  return db.transaction('pending').objectStore('pending').getAll();
}

export async function clearPending() {
  const db = await openDB();
  const tx = db.transaction('pending', 'readwrite');
  tx.objectStore('pending').clear();
  return tx.complete;
}
