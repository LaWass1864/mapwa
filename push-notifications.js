import webpush from 'web-push';

// Mets ici ta nouvelle paire
const vapidKeys = {
  publicKey: 'BMnwOXoysNEVu4sUTTkE6edap3ZElP6613NP_6pTKihCLt7b53HxJYpETGzww0XXIAM1mvUqLZ_gKQcjlm_PO-4',
  privateKey: 'p3GhiaGJT4ZzrOqpQVuVi32VDgCYx0an3fXnhYg38xs'
};

webpush.setVapidDetails(
  'mailto:wassilaamoura8@gmail.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Mets ici le dernier subscription JSON affiché dans ta console
const subscription = {
  endpoint: "...",
  expirationTime: null,
  keys: {
    p256dh: "...",
    auth: "..."
  }
};

const payload = JSON.stringify({
  title: "Snack'n'Track 🍪",
  body: "🚀 Ta notif push fonctionne avec ta nouvelle clé VAPID"
});

webpush.sendNotification(subscription, payload)
  .then(res => console.log('✅ Notification envoyée', res.statusCode))
  .catch(err => console.error('❌ Erreur envoi push', err));
