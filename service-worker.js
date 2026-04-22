// Service Worker for STILL STANDING PWA
const CACHE_NAME = 'still-standing-v1.0.0';
const DYNAMIC_CACHE = 'still-standing-dynamic-v1';

// Files to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/about.html',
    '/offline.html',
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

    // Skip cross-origin requests (e.g., analytics, third-party APIs)
     if (requestUrl.origin !== location.origin && 
        !requestUrl.hostname.includes('cdnjs.cloudflare.com') &&
        !requestUrl.hostname.includes('fonts.googleapis.com')) {
        return;
    }


    // Handle html requests with network-first strategy
     if (event.request.headers.get('accept').includes('text/html')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Cache the fetched page
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // Return offline page if network fails
                    return caches.match(OFFLINE_URL);
                })
        );
        return;
    }
    

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

// Push notification event
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push received:', event);
    
    let data = {
        title: 'STILL STANDING',
        body: 'You have a new notification',
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/badge-72x72.png',
        tag: 'notification',
        url: '/'
    };
    
    if (event.data) {
        try {
            data = JSON.parse(event.data.text());
        } catch (e) {
            data.body = event.data.text();
        }
    }
    
    const options = {
        body: data.body,
        icon: data.icon,
        badge: data.badge,
        vibrate: [200, 100, 200],
        tag: data.tag,
        data: {
            url: data.url,
            dateOfArrival: Date.now()
        },
        actions: [
            {
                action: 'open',
                title: 'Open',
                icon: '/assets/icons/open-icon.png'
            },
            {
                action: 'dismiss',
                title: 'Dismiss',
                icon: '/assets/icons/close-icon.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification click:', event);
    
    event.notification.close();
    
    if (event.action === 'dismiss') {
        return;
    }
    
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then((windowClients) => {
            // Check if there is already a window/tab open with the target URL
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, open a new window/tab
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});


// Background sync event
self.addEventListener('sync', (event) => {
    console.log('[Service Worker] Background sync:', event);
    
    if (event.tag === 'sync-journal-entries') {
        event.waitUntil(syncJournalEntries());
    }
});

async function syncJournalEntries() {
    // Implementation for syncing offline journal entries
    console.log('Syncing journal entries...');
    
    // Open IndexedDB
    const db = await openIndexedDB();
    const tx = db.transaction('pendingEntries', 'readonly');
    const store = tx.objectStore('pendingEntries');
    const entries = await store.getAll();
    
    // Send each entry to server
    for (const entry of entries) {
        try {
            const response = await fetch('/api/journal/sync', {
                method: 'POST',
                body: JSON.stringify(entry),
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                // Remove synced entry
                const deleteTx = db.transaction('pendingEntries', 'readwrite');
                deleteTx.objectStore('pendingEntries').delete(entry.id);
            }
        } catch (error) {
            console.error('Sync failed for entry:', entry.id, error);
        }
    }
}

function openIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('StillStanding-DB', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('pendingEntries')) {
                db.createObjectStore('pendingEntries', { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}