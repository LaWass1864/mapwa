import webpush from 'web-push';

// Mets ici ta nouvelle paire
const vapidKeys = {
  publicKey: 'BJySxU8n_iPsuJdFPUEjlaNr6lk3SAWAtjTq84OiD2xu5P2L8jTz1i05EMRMUqGnVX-5t2cBk4eZ1GxmqDWcoXA',
  privateKey: 'yzHj4YTADCdlqT7EGa9nLFOIeMcDqhjZJUK7CfbzMsM'
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
