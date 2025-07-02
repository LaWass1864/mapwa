// app.js - Version finale avec import idb.js
import { getAllSnacks, addSnack } from './idb.js';

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
      const formData = new FormData();
      formData.append('name', name);
      formData.append('mood', mood);
      
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
          // Recharger la liste après sync
          loadSnacks();
          break;
      }
    });
  }
}

// ============ CHARGEMENT DES SNACKS (FONCTION CORRIGÉE) ============
async function loadSnacks() {
  try {
    console.log('📱 Chargement des snacks...');
    
    // 1. Charger depuis IndexedDB (via idb.js)
    let localSnacks = [];
    try {
      localSnacks = await getAllSnacks();
      console.log('📦 Snacks depuis IndexedDB:', localSnacks.length);
    } catch (error) {
      console.error('❌ Erreur IndexedDB:', error);
    }
    
    // 2. Charger depuis localStorage (backup)
    const backupSnacks = JSON.parse(localStorage.getItem('snacks')) || [];
    console.log('💾 Snacks depuis localStorage:', backupSnacks.length);
    
    // 3. Essayer l'API (si en ligne)
    let apiSnacks = [];
    try {
      const response = await fetch('https://snackntrack.netlify.app/.netlify/functions/get-snacks');
      if (response.ok) {
        const data = await response.json();
        apiSnacks = data.snacks || [];
        console.log('✅ Snacks depuis API:', apiSnacks.length);
      }
    } catch (error) {
      console.log('📱 API non disponible');
    }
    
    // 4. Fusionner les sources (éviter doublons)
    const allSnacks = [...apiSnacks, ...localSnacks, ...backupSnacks];
    
    // Déduplication simple par nom + mood
    const uniqueSnacks = allSnacks.filter((snack, index, self) => 
      index === self.findIndex(s => 
        s.name === snack.name && 
        s.mood === snack.mood
      )
    );
    
    snacks = uniqueSnacks;
    console.log('🍪 Total snacks uniques:', snacks.length);
    
    // 5. Afficher dans l'UI
    snackList.innerHTML = '';
    snacks.forEach(snack => addSnackToUI(snack.name, snack.mood));
    
    // 6. Sauvegarder dans localStorage comme backup
    localStorage.setItem('snacks', JSON.stringify(snacks));
    
  } catch (error) {
    console.error('❌ Erreur loadSnacks:', error);
    // Fallback localStorage uniquement
    snacks = JSON.parse(localStorage.getItem('snacks')) || [];
    snackList.innerHTML = '';
    snacks.forEach(snack => addSnackToUI(snack.name, snack.mood));
  }
}

// ============ AFFICHAGE UI ============
function addSnackToUI(name, mood) {
  const li = document.createElement('li');
  li.textContent = `🍪 ${name} (${mood})`;
  li.className = 'snack-item';
  snackList.appendChild(li);
}

function showMessage(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
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

// ============ SAUVEGARDE PÉRIODIQUE ============
setInterval(() => {
  if (snacks.length > 0) {
    localStorage.setItem('snacks', JSON.stringify(snacks));
    console.log('💾 Backup localStorage effectué');
  }
}, 30000);