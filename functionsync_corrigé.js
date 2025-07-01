/**
 * Fonction de synchronisation des participants
 * --------------------------------------
 * - Lit tous les participants stockés localement (via IndexedDB) qui n'ont pas encore été envoyés.
 * - Tente de les envoyer un par un à l'API serveur via un POST JSON.
 * - Si succès : supprime localement et notifie les autres pages.
 * - Si échec : garde en local et log l'erreur.
 * - À la fin : affiche un récap et notifie le client du résultat global.
 */
async function syncSnacks() {
  console.log('🔄 Début de la synchronisation...');

  try {
    // 1️⃣ Récupère la liste des participants en attente dans IndexedDB
    const pending = await getAllPending();
    console.log(`📊 ${pending.length} participants(s) à synchroniser`);

    // Si aucun snack à synchroniser, on s'arrête là
    if (pending.length === 0) {
      console.log('✅ Aucun snack en attente');
      return;
    }

    // 2️⃣ Initialisation des compteurs et liste des échecs
    let success = 0, fail = 0;
    const failedSnacks = [];

    // 3️⃣ Parcours de chaque snack à synchroniser
    for (const snack of pending) {
      try {
        console.log('🚀 Tentative de synchro pour :', snack.name);

        // Détermination de l'URL API (par ex : http://localhost:3000/api/sync-snacks)
        const apiUrl = getApiUrl();
        console.log('🌐 URL API utilisée:', apiUrl);

        // Envoi HTTP POST des données du participants au serveur
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            name: snack.name,
            mood: snack.mood,
            timestamp: snack.timestamp
          })
        });

        console.log('📊 Réponse serveur:', response.status, response.statusText);

        if (response.ok) {
          // ✅ Si le serveur répond 2xx, on considère que c'est enregistré
          console.log('✅ Snack synchronisé :', snack.name);

          // On le supprime alors de la liste locale (IndexedDB)
          await deletePendingSnack(snack.id);

          // Et on notifie toutes les pages ouvertes (onglets) de la synchro
          await notifyClients('snack-synced', { snack });

          success++;
        } else {
          // ❌ Si le serveur répond une erreur (ex : 500, 404), on logue l'erreur
          const errorText = await response.text().catch(() => 'Erreur inconnue');
          console.error(`❌ Erreur serveur ${response.status} pour : ${snack.name}`, errorText);

          // On garde en mémoire les snacks en échec pour le rapport final
          failedSnacks.push({ snack: snack.name, error: `${response.status}: ${errorText}` });
          fail++;
        }

      } catch (err) {
        // ❌ Si erreur réseau (pas d'internet, DNS down, ou t'es dans le désert.)
        console.error(`❌ Erreur réseau pour : ${snack.name}`, err.message);

        failedSnacks.push({ snack: snack.name, error: err.message });
        fail++;
      }
    }

    // 4️⃣ Fin de boucle : affichage du bilan global
    console.log(`📈 Sync terminée : ${success} succès / ${fail} échecs`);

    // Si certains snacks n'ont pas pu être synchronisés, on le logue explicitement
    if (failedSnacks.length > 0) {
      console.log('❌ Snacks échoués:', failedSnacks);
    }

    // Notifie toutes les pages ouvertes que la synchronisation est terminée
    // en leur donnant les détails des succès et erreurs
    await notifyClients('sync-completed', { 
      success, 
      errors: fail, 
      failedSnacks: failedSnacks 
    });

  } catch (e) {
    //  Si tout plante d'un coup (ex : problème IndexedDB)
    console.error('💥 Erreur globale dans syncSnacks :', e);

    // Notifie aussi les pages ouvertes qu'il y a eu une erreur globale
    await notifyClients('sync-error', { error: e.message });

    // Relance l'erreur pour que ce soit visible plus haut si besoin
    throw e;
  }
}

// NOUVELLE FONCTION : Gestion intelligente de l'URL API
function getApiUrl() {
  const currentUrl = new URL(self.location.href);
  
  // Environnement de développement
  if (currentUrl.hostname === 'localhost' || currentUrl.hostname === '127.0.0.1') {
    return `${currentUrl.origin}/api/snack`;
  }
  
  // Environnement de production Netlify
  if (currentUrl.hostname.includes('netlify.app')) {
    return `${currentUrl.origin}/.netlify/functions/snack`;
  }
  
  // Fallback vers l'URL de production
  return 'https://snackntrack.netlify.app/.netlify/functions/snack';
}
