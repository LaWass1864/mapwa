// ============= REGISTRATION SW ============
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/serviceWorker.js')
    .then(reg => console.log('✅ Service Worker enregistré', reg))
    .catch(err => console.error('❌ Erreur enregistrement SW:', err));
}

// ============= LISTEN TO SW MESSAGES ============
navigator.serviceWorker.addEventListener('message', (event) => {
  console.log('📬 Message SW:', event.data);
  if (event.data?.type === 'snack-synced') {
    alert(`🎉 Snack synchronisé: ${event.data.data.name}`);
    addSnackToList(event.data.data.name, event.data.data.mood);
  }
  if (event.data?.type === 'sync-completed') {
    console.log(`✅ Synchronisation terminée: ${event.data.data.success} succès, ${event.data.data.errors} erreurs`);
  }
});

// ============= FORM SNACK ============
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#snack-form');
  const snackList = document.querySelector('#snack-list');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.querySelector('#snack-name').value.trim();
    const mood = document.querySelector('#snack-mood').value.trim();
    if (!name || !mood) return;

    try {
      const response = await fetch('/api/snack', {
        method: 'POST',
        body: new URLSearchParams({ name, mood })
      });

      if (response.ok) {
        addSnackToList(name, mood);
        form.reset();
      } else {
        alert('⚠ Erreur serveur');
      }
    } catch (err) {
      console.error('❌ Erreur réseau', err);
      alert('⚠ Erreur réseau ou hors-ligne.');
    }
  });

  function addSnackToList(name, mood) {
    const li = document.createElement('li');
    li.textContent = `${name} (${mood})`;
    snackList.appendChild(li);
  }
});

// ============= READ CSV FOR PARTICIPANTS ============
document.querySelector('#csvFile')?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const lines = event.target.result.split('\n').filter(l => l.trim());
    const participantsList = document.querySelector('#participants');
    participantsList.innerHTML = '';
    lines.forEach(line => {
      const li = document.createElement('li');
      li.textContent = line.trim();
      const btn = document.createElement('button');
      btn.textContent = '❌ Retirer';
      btn.addEventListener('click', () => {
        li.remove();
      });
      li.appendChild(btn);
      participantsList.appendChild(li);
    });
  };
  reader.readAsText(file);
});

// ============= TEST BACKGROUND SYNC ============
function testBackgroundSync() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then(reg => {
      reg.sync.register('sync-snacks').then(() => {
        console.log('✅ Background Sync forcé');
        alert('🚀 Sync enregistrée (sera déclenchée quand réseau OK)');
      }).catch(err => {
        console.error('❌ Erreur register sync:', err);
        alert('⚠ Sync non disponible');
      });
    });
  } else {
    alert('❌ Background Sync non supporté.');
  }
}
window.testBackgroundSync = testBackgroundSync;
