// sw.js
// Production-grade Service Worker for real Web Push Notifications and Offline PWA Support

const CACHE_NAME = 'homecell-cache-v2';
const ASSETS_TO_CACHE = [
  './',
  'index.html',
  'manifest.json',
  'favicon.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn("Service worker cache.addAll failed (benign in preview):", err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request).then(response => {
        return response || new Response("Offline backup active", { status: 200 });
      });
    })
  );
});

self.addEventListener('push', event => {
  let data = { title: 'Home.cell', body: 'New fellowship update!', url: '/' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Home.cell', body: event.data.text(), url: '/' };
    }
  }

  const options = {
    body: data.body,
    icon: '/favicon.jpg',
    badge: '/favicon.jpg',
    data: {
      url: data.url || '/'
    },
    vibrate: [100, 50, 100],
    actions: [
      { action: 'open', title: 'Open Portal' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const urlToOpen = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
