// Service Worker for Home.cell Push Notifications

const CACHE_NAME = 'home-cell-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/pages.js'
];

// Install Event - Cache assets
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Caching assets');
            return cache.addAll(ASSETS_TO_CACHE).catch(() => {
                console.log('Some assets failed to cache (normal for CDN resources)');
            });
        })
    );
    self.skipWaiting();
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch Event - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip cross-origin requests
    if (url.origin !== location.origin) {
        return;
    }

    event.respondWith(
        fetch(request)
            .then((response) => {
                // Cache successful responses
                if (response.ok) {
                    const cache = caches.open(CACHE_NAME);
                    cache.then((c) => c.put(request, response.clone()));
                }
                return response;
            })
            .catch(() => {
                // Fallback to cache
                return caches.match(request).then((response) => {
                    return response || new Response('Offline - Content not available', {
                        status: 503,
                        statusText: 'Service Unavailable',
                        headers: new Headers({
                            'Content-Type': 'text/plain'
                        })
                    });
                });
            })
    );
});

// Push Event - Handle push notifications
self.addEventListener('push', (event) => {
    console.log('Push notification received:', event);
    
    const data = event.data ? event.data.json() : {
        title: 'Home.cell',
        body: 'You have a new message',
        icon: '/icon.png'
    };

    const options = {
        body: data.body || 'New notification',
        icon: data.icon || '/icon.png',
        badge: data.badge || '/badge.png',
        tag: 'home-cell',
        requireInteraction: data.requireInteraction || false,
        data: data.data || {},
        actions: [
            {
                action: 'open',
                title: 'Open',
                icon: '/open-icon.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/close-icon.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Home.cell', options)
    );
});

// Notification Click Event
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event);
    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Check if app window already exists
            for (let client of clientList) {
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }

            // Open new window if none exists
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});

// Notification Close Event
self.addEventListener('notificationclose', (event) => {
    console.log('Notification closed:', event);
});

// Message Event - Handle messages from app
self.addEventListener('message', (event) => {
    console.log('Service Worker received message:', event.data);
    
    if (event.data && event.data.type === 'INIT') {
        console.log('Service Worker initialized for userId:', event.data.userId);
        // Store user ID if needed
    }
});

// Periodic Sync Event - Sync data in background
self.addEventListener('sync', (event) => {
    console.log('Background sync triggered:', event.tag);
    
    if (event.tag === 'sync-notifications') {
        event.waitUntil(
            fetch('/api/sync-notifications')
                .then(response => response.json())
                .then(data => {
                    console.log('Notifications synced:', data);
                })
                .catch(error => {
                    console.error('Sync error:', error);
                })
        );
    }
});
