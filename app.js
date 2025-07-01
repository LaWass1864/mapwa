// app.js - Version corrigée pour IndexedDB
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/serviceWorker.js')
    .then(reg => console.log('✅ SW enregistré', reg))
    .catch(err => console.error('❌ SW non enregistré:', err));
}

// Variables globales
const snackList = document.querySelector('#snack-list');
let snacks = [];

// Charger les snacks au démarrage
document.addEventListener('DOMContentLoaded', async () => {
  await loadSnacks();
  setupForm();
  setupServiceWorkerListener();
});

// ============ GESTION DU FORMULAIRE ============
function setupForm() {
  const form = document.querySelector('#snack-form');
  
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.querySelector('#snack-name').value.trim();
    const mood = document.querySelector('#snack-mood').value.trim();
    
    if (!name || !mood) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    console.log('📝 Envoi du snack:', { name, mood });
    
    try {
      // Créer FormData pour l'envoi
      const formData = new FormData();
      formData.append('name', name);
      formData.append('mood', mood);
      
      // Envoyer vers l'API (intercepté par le SW si hors ligne)
      const response = await fetch('/api/snack', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      console.log('✅ Réponse:', result);
      
      if (result.offline) {
        showMessage('📱 Snack sauvegardé hors ligne !', 'warning');
      } else {
        showMessage('✅ Snack ajouté avec succès !', 'success');
        // Ajouter à la liste locale immédiatement
        addSnackToUI(name, mood);
      }
      
      form.reset();
      
    } catch (error) {
      console.error('❌ Erreur soumission:', error);
      showMessage('❌ Erreur lors de l\'ajout', 'error');
    }
  });
}

// ============ ÉCOUTER LES MESSAGES DU SERVICE WORKER ============
function setupServiceWorkerListener() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, data } = event.data;
      
      console.log('📱 Message du SW:', type, data);
      
      switch (type) {
        case 'snack-saved-offline':
          console.log('📱 Snack sauvegardé hors ligne:', data);
          addSnackToUI(data.name, data.mood);
          showMessage(`📱 ${data.name} sauvegardé hors ligne`, 'warning');
          break;
          
        case 'snack-synced':
          console.log('🔄 Snack synchronisé:', data);
          showMessage(`🔄 ${data.name} synchronisé !`, 'success');
          break;
      }
    });
  }
}

// ============ CHARGEMENT DES SNACKS ============
async function loadSnacks() {
  try {
    // Essayer de charger depuis l'API
    const response = await fetch('https://snackntrack.netlify.app/.netlify/functions/get-snacks');
    
    if (response.ok) {
      const data = await response.json();
      snacks = data.snacks || [];
      console.log('✅ Snacks chargés depuis l\'API:', snacks.length);
    } else {
      throw new Error('API non disponible');
    }
  } catch (error) {
    console.log('📱 API non disponible, chargement depuis localStorage');
    // Fallback sur localStorage
    snacks = JSON.parse(localStorage.getItem('snacks')) || [];
  }
  
  // Afficher les snacks
  snacks.forEach(snack => addSnackToUI(snack.name, snack.mood));
}

// ============ AFFICHAGE UI ============
function addSnackToUI(name, mood) {
  const li = document.createElement('li');
  li.textContent = `🍪 ${name} (${mood})`;
  li.className = 'snack-item';
  snackList.appendChild(li);
}

function showMessage(message, type = 'info') {
  // Créer un élément de notification
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  // Styles basiques
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 6px;
    color: white;
    font-weight: bold;
    z-index: 1000;
    ${type === 'success' ? 'background: #4CAF50;' : ''}
    ${type === 'warning' ? 'background: #FF9800;' : ''}
    ${type === 'error' ? 'background: #f44336;' : ''}
  `;
  
  document.body.appendChild(notification);
  
  // Supprimer après 3 secondes
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// ============ BOUTON TEST SYNC ============
document.addEventListener('DOMContentLoaded', () => {
  const syncButton = document.querySelector('[data-action="sync"]');
  
  syncButton?.addEventListener('click', async () => {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-snacks');
        console.log('🔄 Background sync déclenché manuellement');
        showMessage('🔄 Synchronisation déclenchée', 'info');
      } catch (error) {
        console.error('❌ Erreur sync:', error);
        showMessage('❌ Erreur de synchronisation', 'error');
      }
    } else {
      showMessage('❌ Background Sync non supporté', 'error');
    }
  });
});

// ============ SAUVEGARDE DE SECOURS ============
// Sauvegarder périodiquement dans localStorage comme backup
function backupToLocalStorage() {
  localStorage.setItem('snacks', JSON.stringify(snacks));
}

// Sauvegarder toutes les 30 secondes
setInterval(backupToLocalStorage, 30000);

