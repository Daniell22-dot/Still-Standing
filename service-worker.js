// Service Worker for STILL STANDING PWA
const CACHE_NAME = 'still-standing-v1.0.0';
const DYNAMIC_CACHE = 'still-standing-dynamic-v1';

// Files to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/about.html',
    '/booking-portal.html',
    '/community.html',
    '/volunteers.html',
    '/terms-and-conditions.html',
    '/privacy-policy.html',
    '/css/style.css',
    '/css/animations.css',
    '/css/responsive.css',
    '/js/main.js',
    '/js/particles.js',
    '/js/daily-verse.js',
    '/js/dark-mode.js',
    '/images/logo.png',
    // Add more critical assets
];

// Install event - cache static assets
self.addEventListener('install', event => {
    console.log('[Service Worker] Installing...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
            .catch(err => console.error('[Service Worker] Cache failed:', err))
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('[Service Worker] Activating...');

    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => name !== CACHE_NAME && name !== DYNAMIC_CACHE)
                        .map(name => {
                            console.log('[Service Worker] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    const { request } = event;

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip API calls (we want fresh data)
    if (request.url.includes('/api/')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    // Clone and cache successful API responses
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(DYNAMIC_CACHE).then(cache => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Return cached API response if offline
                    return caches.match(request);
                })
        );
        return;
    }

    // Cache-first strategy for static assets
    event.respondWith(
        caches.match(request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    // Return cached version and update in background
                    fetch(request)
                        .then(response => {
                            if (response.ok) {
                                caches.open(CACHE_NAME).then(cache => {
                                    cache.put(request, response);
                                });
                            }
                        })
                        .catch(() => { });

                    return cachedResponse;
                }

                // Not in cache, fetch from network
                return fetch(request)
                    .then(response => {
                        // Cache successful responses
                        if (response.ok) {
                            const responseClone = response.clone();
                            caches.open(DYNAMIC_CACHE).then(cache => {
                                cache.put(request, responseClone);
                            });
                        }
                        return response;
                    })
                    .catch(err => {
                        console.error('[Service Worker] Fetch failed:', err);

                        // Return offline page for navigation requests
                        if (request.mode === 'navigate') {
                            return caches.match('/offline.html');
                        }
                    });
            })
    );
});

// Background sync for offline form submissions
self.addEventListener('sync', event => {
    if (event.tag === 'sync-forms') {
        event.waitUntil(syncFormData());
    }
});

async function syncFormData() {
    // Retrieve pending form submissions from IndexedDB
    const db = await openDB();
    const pendingForms = await db.getAll('pending-submissions');

    for (const form of pendingForms) {
        try {
            await fetch(form.url, {
                method: 'POST',
                headers: form.headers,
                body: JSON.stringify(form.data)
            });

            // Remove from pending after successful submission
            await db.delete('pending-submissions', form.id);
        } catch (error) {
            console.error('[Service Worker] Sync failed for form:', error);
        }
    }
}

// Push notifications
self.addEventListener('push', event => {
    const data = event.data ? event.data.json() : {};

    const options = {
        body: data.body || 'You have a new notification',
        icon: '/images/icon-192x192.png',
        badge: '/images/badge-72x72.png',
        vibrate: [200, 100, 200],
        data: data.url || '/',
        actions: [
            { action: 'open', title: 'View' },
            { action: 'close', title: 'Dismiss' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'STILL STANDING', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
    event.notification.close();

    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.openWindow(event.notification.data)
        );
    }
});

// Helper to open IndexedDB
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('still-standing-db', 1);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = event => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('pending-submissions')) {
                db.createObjectStore('pending-submissions', { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}
