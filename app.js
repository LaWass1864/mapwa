// ============= REGISTRATION SW ============
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/serviceWorker.js')
    .then(reg => console.log('✅ Service Worker enregistré', reg))
    .catch(err => console.error('❌ Erreur enregistrement SW:', err));
}

// ============= LISTEN TO SW MESSAGES ============
navigator.serviceWorker.addEventListener('message', (event) => {
  console.log('📬 Message reçu du SW:', event.data);
  if (event.data?.type === 'snack-synced') {
    alert(`🎉 Snack synchronisé: ${event.data.data.name}`);
  }
  if (event.data?.type === 'sync-completed') {
    console.log(`✅ Synchronisation terminée: ${event.data.data.success} succès, ${event.data.data.errors} erreurs`);
  }
});

// ============= FORM HANDLING ============
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#snackForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = {
        name: formData.get('name'),
        mood: formData.get('mood')
      };

      try {
        const response = await fetch('/api/snack', {
          method: 'POST',
          body: new URLSearchParams(data)
        });

        if (response.ok) {
          alert('✅ Snack soumis avec succès!');
        } else {
          console.error('❌ Problème serveur', await response.text());
          alert('⚠ Erreur lors de l’envoi du snack.');
        }
      } catch (err) {
        console.error('❌ Erreur réseau', err);
        alert('⚠ Erreur réseau ou hors-ligne.');
      }
    });
  }
});

// ============= CSV FILE HANDLING (EXPERIMENTAL) ============
document.querySelector('#csvInput')?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    const content = event.target.result;
    console.log('📄 Contenu CSV:', content);
    alert('Fichier CSV chargé. Voir console pour le contenu.');
  };
  reader.readAsText(file);
});

// ============= LOCAL NOTIFICATIONS ============
document.querySelector('#notifyBtn')?.addEventListener('click', async () => {
  if (!('Notification' in window)) {
    alert("🙅 Notifications non supportées par ce navigateur.");
    return;
  }

  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }

  if (permission === 'granted') {
    new Notification("Snack'n'Track 🍉", {
      body: "Ceci est une notification locale.",
      icon: "./assets/manifest-icon-192.maskable.png"
    });
  } else {
    alert("⚠ Notifications refusées.");
  }
});
