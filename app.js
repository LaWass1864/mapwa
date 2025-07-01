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

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.querySelector('#snack-name').value.trim();
    const mood = document.querySelector('#snack-mood').value.trim();
    if (!name || !mood) return;

    // Ajoute dans LocalStorage et UI
    snacks.push({ name, mood });
    localStorage.setItem('snacks', JSON.stringify(snacks));
    addSnackToUI(name, mood);

    form.reset();
  });
});

function addSnackToUI(name, mood) {
  const li = document.createElement('li');
  li.textContent = `🍪 ${name} (${mood})`;
  snackList.appendChild(li);
}

if ('serviceWorker' in navigator && 'SyncManager' in window) {
  navigator.serviceWorker.ready.then(reg => {
    reg.sync.register('sync-snacks').then(() => {
      console.log('✅ Sync enregistrée pour les snacks');
    }).catch(err => {
      console.error('❌ Impossible de programmer la sync:', err);
    });
  });
}