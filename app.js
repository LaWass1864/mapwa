if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/serviceWorker.js')
    .then(reg => console.log('✅ SW enregistré', reg))
    .catch(err => console.error('❌ SW non enregistré:', err));
}

// Récupération localStorage pour snacks
const snackList = document.querySelector('#snack-list');
let snacks = JSON.parse(localStorage.getItem('snacks')) || [];
snacks.forEach(snack => addSnackToUI(snack.name, snack.mood));

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#snack-form');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.querySelector('#snack-name').value.trim();
    const mood = document.querySelector('#snack-mood').value.trim();
    if (!name || !mood) return;

    // On ajoute direct à l’UI + localStorage
    snacks.push({ name, mood });
    localStorage.setItem('snacks', JSON.stringify(snacks));
    addSnackToUI(name, mood);

    try {
      const response = await fetch('/api/snack', {
        method: 'POST',
        body: new URLSearchParams({ name, mood })
      });
      if (!response.ok) {
        console.warn('⚠ Serveur hors ligne ou erreur');
      }
    } catch {
      console.warn('🌐 Offline, le SW gérera via IndexedDB + Sync');
    }

    form.reset();
  });
});

function addSnackToUI(name, mood) {
  const li = document.createElement('li');
  li.textContent = `🍪 ${name} (${mood})`;
  snackList.appendChild(li);
}

// Réagir aux messages SW (pour syncs)
navigator.serviceWorker.addEventListener('message', (event) => {
  console.log('📬 SW message:', event.data);
  if (event.data?.type === 'snack-synced') {
    snacks.push({ name: event.data.data.name, mood: event.data.data.mood });
    localStorage.setItem('snacks', JSON.stringify(snacks));
    addSnackToUI(event.data.data.name, event.data.data.mood);
  }
});

// ==================== Test Background Sync manuel
function testBackgroundSync() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then(reg => {
      reg.sync.register('sync-snacks').then(() => {
        console.log('✅ Sync forcée enregistrée');
        alert('🚀 Sync enregistrée (sera faite dès réseau dispo)');
      }).catch(err => {
        console.error('❌ Impossible de déclencher la sync:', err);
      });
    });
  } else {
    alert('⚠ SyncManager non supporté');
  }
}
window.testBackgroundSync = testBackgroundSync;

// ==================== Test Notification locale
function notifyMe() {
  if (!('Notification' in window)) return alert('🙅 Notifications non supportées.');
  Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      new Notification("Snack'n'Track 🍪", {
        body: "Ceci est une notif locale test",
        icon: "./assets/manifest-icon-192.maskable.png"
      });
    }
  });
}
window.notifyMe = notifyMe;
