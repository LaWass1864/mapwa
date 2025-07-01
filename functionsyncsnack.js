async function syncParticipants() {
  console.log('📡 Début de la synchronisation...');

  // 1️⃣ Lire la liste des participants en attente
  const pending = await ____________; // indice: fonction qui lit IndexedDB
  console.log(`📊 ${pending.length} participant(s) à synchroniser`);

  let success = 0;
  let fail = 0;

  // 2️⃣ Boucle principale
  for (const participant of pending) {
    try {
      console.log(`🚀 Envoi de ${participant._____}`); // indice: propriété du participant à afficher

      const response = await fetch(__________, { // indice: URL de votre API
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: participant._____,     // indice: nom du participant
          email: participant._____,    // indice: email ou autre champ
          timestamp: participant._____ // indice: date ou identifiant temporel
        })
      });

      if (response.ok) {
        console.log(`✅ Participant synchronisé : ${participant._____}`);

        await ____________(participant.id); // indice: supprime de IndexedDB
        await ____________('participant-synced', { participant }); // indice: notifie les clients
        success++;
      } else {
        console.error(`❌ Erreur serveur ${response.status} pour ${participant._____}`);
        fail++;
      }

    } catch (err) {
      console.error(`❌ Erreur réseau pour ${participant._____}: ${err.message}`);
      fail++;
    }
  }

  // 3️⃣ Bilan final
  console.log(`✅ ${success} participants synchronisés, ❌ ${fail} échecs`);
}


// app.js :

if ('serviceWorker' in navigator && 'SyncManager' in window) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/serviceWorker.js')
      .then(reg => {
        console.log('✅ SW enregistré');

        // ➡ Ici on enregistre la tâche de background sync
        return reg.sync.register('sync-participants');
      })
      .then(() => {
        console.log('📡 Background Sync enregistré pour "sync-participants"');
      })
      .catch(err => console.error('❌ Erreur SW ou Sync', err));
  });
}