const publicKey = "BMnwOXoysNEVu4sUTTkE6edap3ZElP6613NP_6pTKihCLt7b53HxJYpETGzww0XXIAM1mvUqLZ_gKQcjlm_PO-4"; // remplace par la clé publique

if ('serviceWorker' in navigator && 'PushManager' in window) {
  navigator.serviceWorker.ready.then(registration => {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        }).then(subscription => {
          console.log("📬 Abonné aux push :", JSON.stringify(subscription));
          // Tu peux copier ce JSON et le coller dans un simulateur de push
        });
      }
    });
  });
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}
