// Service Worker for Convención ADISTEM 2026
// Handles background web push notifications and offline fallback

const CACHE_NAME = 'adistem-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Web Push Notification Event (fires even if browser is closed / phone in standby)
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { body: event.data.text() };
    }
  }

  const title = data.title || 'Convención ADISTEM 2026';
  const options = {
    body: data.body || 'Nuevo aviso importante de la coordinación del evento.',
    icon: data.icon || '/assets/Logo_convencion_reducido.png',
    badge: '/assets/Logo_convencion_reducido.png',
    tag: data.tag || `adistem-notice-${Date.now()}`,
    data: {
      url: data.url || '/?tab=comms',
      id: data.id || Date.now()
    },
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: true
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Click on notification opens the app and focuses the notices tab
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing tab if open
      for (const client of windowClients) {
        if ('focus' in client) {
          if (client.url.includes(targetUrl) || targetUrl === '/') {
            return client.focus();
          }
        }
      }
      // If no tab is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
