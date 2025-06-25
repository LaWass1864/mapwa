// Vérifie que le navigateur supporte les service workers.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/serviceWorker.js')
    .then(reg => {
      console.log('✅ Service Worker enregistré', reg);

      if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
          console.log("📢 Permission notification :", permission);
        });
      }

      // 🔄 Rechargement si update
      reg.onupdatefound = () => {
        const newWorker = reg.installing;
        newWorker.onstatechange = () => {
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              const updateDiv = document.createElement('div');
              updateDiv.innerHTML = `
                <div style="background:#f77f00; color:white; padding:1rem; text-align:center;">
                  🔄 Nouvelle version disponible.
                  <button style="margin-left:1rem;" onclick="window.location.reload()">Mettre à jour</button>
                </div>
              `;
              document.body.prepend(updateDiv);
            }
          }
        };
      };

      // 📨 Écouter les messages du service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, data } = event.data;
        
        switch (type) {
          case 'snack-saved-offline':
            console.log('📴 Snack sauvegardé offline:', data);
            showOfflineMessage();
            break;
          case 'snack-synced':
            console.log('🔄 Snack synchronisé:', data);
            break;
          case 'sync-completed':
            console.log('✅ Synchronisation terminée:', data);
            hideOfflineMessage();
            break;
        }
      });
    })
    .catch(err => console.error('❌ Erreur Service Worker :', err));
}

// === VARIABLES GLOBALES ===
const form = document.getElementById('snack-form');
const snackList = document.getElementById('snack-list');
const nameInput = document.getElementById('snack-name');
const moodInput = document.getElementById('snack-mood');

function generateId() {
  return Date.now().toString();
}

function createSnackElement(snack) {
  const li = document.createElement('li');
  li.textContent = `🍪 ${snack.name} – humeur : ${snack.mood}`;
  li.style.cursor = 'pointer';
  li.title = 'Clique pour supprimer';
  li.dataset.id = snack.id;

  // Ajouter indicateur offline si nécessaire
  if (snack.offline) {
    li.style.opacity = '0.7';
    li.title += ' (en attente de synchronisation)';
  }

  li.addEventListener('click', () => {
    if (confirm('Supprimer ce snack ?')) {
      const snacks = JSON.parse(localStorage.getItem('snacks')) || [];
      const updatedSnacks = snacks.filter(s => s.id !== snack.id);
      localStorage.setItem('snacks', JSON.stringify(updatedSnacks));
      refreshSnackList();
    }
  });

  return li;
}

function refreshSnackList() {
  snackList.innerHTML = '';
  const snacks = JSON.parse(localStorage.getItem('snacks')) || [];
  snacks.forEach(snack => {
    const li = createSnackElement(snack);
    snackList.appendChild(li);
  });
}

function showOfflineMessage() {
  let offlineDiv = document.getElementById('offline-message');
  if (!offlineDiv) {
    offlineDiv = document.createElement('div');
    offlineDiv.id = 'offline-message';
    offlineDiv.innerHTML = `
      <div style="background:#ff6b6b; color:white; padding:0.5rem; text-align:center; font-size:0.9rem;">
        📴 Mode hors ligne - Les données seront synchronisées automatiquement
      </div>
    `;
    document.body.prepend(offlineDiv);
  }
}

function hideOfflineMessage() {
  const offlineDiv = document.getElementById('offline-message');
  if (offlineDiv) {
    offlineDiv.remove();
  }
}

// Chargement initial
refreshSnackList();

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  const mood = moodInput.value.trim();
  if (!name || !mood) return;

  const newSnack = { 
    id: generateId(), 
    name, 
    mood,
    timestamp: new Date().toISOString()
  };

  // Affiche immédiatement dans la liste + localStorage
  const snacks = JSON.parse(localStorage.getItem('snacks')) || [];
  snacks.push(newSnack);
  localStorage.setItem('snacks', JSON.stringify(snacks));
  refreshSnackList();
  form.reset();
  afficherNotificationSnackAjoute(name);

  // ⚠️ CORRECTION: Utiliser FormData pour correspondre au service worker
  const formData = new FormData();
  formData.append('name', name);
  formData.append('mood', mood);

  try {
    const response = await fetch('/api/snack', {
      method: 'POST',
      body: formData  // ✅ FormData au lieu de JSON
    });

    if (response.ok) {
      console.log("✅ Snack envoyé en ligne !");
    } else {
      throw new Error(`Erreur ${response.status}`);
    }
  } catch (err) {
    console.warn("❌ Erreur réseau, gestion par le service worker");
    // Le service worker va automatiquement gérer l'offline
  }
});

function readCSV() {
  const fileInput = document.getElementById('csvFile');
  const ul = document.getElementById('participants');

  if (!fileInput?.files?.length) return alert("Aucun fichier sélectionné");

  const reader = new FileReader();
  reader.onload = function (e) {
    const lignes = e.target.result.split('\n');
    ul.innerHTML = '';
    lignes.forEach(ligne => {
      const [nom, humeur] = ligne.split(',');
      if (nom && humeur) {
        const li = document.createElement('li');
        li.textContent = `👤 ${nom.trim()} – humeur : ${humeur.trim()}`;
        ul.appendChild(li);
      }
    });
  };
  reader.readAsText(fileInput.files[0]);
}

function afficherNotificationSnackAjoute(nomSnack) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification("Snack ajouté 🥳", {
      body: `Tu as ajouté "${nomSnack}" !`,
      icon: "/assets/manifest-icon-192.maskable.png"
    });
  }
}

// Ajoute ça dans ton app.js en local
console.log('🧪 Mode DEBUG activé');
window.DEBUG_MODE = true;

// Utilise les fonctions de test que j'ai données
await testBackgroundSync.showPending();
await testBackgroundSync.simulateOffline(3000);

function testBackgroundSync() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then(reg => {
      reg.sync.register('sync-snacks')
        .then(() => console.log('✅ Test manuel de background sync enregistré'))
        .catch(err => console.error('❌ Erreur lors du test de background sync :', err));
    });
  } else {
    console.warn('⛔ Background Sync non supporté par ce navigateur');
  }
}