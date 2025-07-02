

navigator.serviceWorker.ready
  .then(reg => reg.sync.register('sync-snacks'));

//  Il attend que ton Service Worker soit prêt (installé et activé).

//  Il enregistre une tâche appelée 'sync-snacks' auprès du navigateur.

//  Le navigateur va ensuite garder ce rappel en mémoire et, dès qu’il retrouvera Internet, il dira au Service

// schema explicatif : [Page] → navigator.serviceWorker.ready → [reg] → reg.sync.register('sync-snacks') → réseau revient → SW se réveille →  envoie au serveur



self.addEventListener('sync', event => {
  if (event.tag === 'sync-snacks') {
    // Dit au navigateur : attends que ce fetch soit fini avant de couper le SW
    event.waitUntil(
      fetch('/api/snacks', { method: 'POST' })
    );
  }
});

// self.addEventListener('sync', ...) → le SW écoute les rappels programmés.

// if (event.tag === 'sync-snacks') → il vérifie quel travail il doit faire.

// event.waitUntil(...) → il garde le SW en vie jusqu’à ce que la tâche soit finie.