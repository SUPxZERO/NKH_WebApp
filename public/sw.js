// Service Worker for NKH Restaurant Management System
// Provides offline functionality and caching for PWA capabilities

const CACHE_NAME = 'nkh-restaurant-v1';
const STATIC_CACHE = 'nkh-static-v1';
const DYNAMIC_CACHE = 'nkh-dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/build/assets/app.css',
  '/build/assets/app.js',
  '/favicon.ico',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/manifest.json'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/menu/,
  /\/api\/categories/,
  /\/api\/customer\/profile/,
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  
  // Use a resilient caching strategy: fetch assets individually and only cache those
  // that return a successful response. This prevents `cache.addAll` from rejecting
  // the install step if any single asset is missing (common in dev environments).
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    console.log('[SW] Caching static assets (resilient)');

    for (const asset of STATIC_ASSETS) {
      try {
        // Try to fetch the asset from network first. Use no-store to avoid Vite dev cache issues.
        const res = await fetch(asset, { cache: 'no-store' });
        if (!res || !res.ok) {
          console.warn('[SW] Asset fetch failed, skipping:', asset, res && res.status);
          continue;
        }
        await cache.put(asset, res.clone());
        console.log('[SW] Cached:', asset);
      } catch (err) {
        console.warn('[SW] Error caching asset, skipping:', asset, err);
      }
    }

    await self.skipWaiting();
  })());
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Handle static assets
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
    return;
  }

  // Handle navigation requests (SPA routing)
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  // Default: network first, cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE)
            .then((cache) => cache.put(request, responseClone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Handle API requests - cache-first for read-only endpoints
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const shouldCache = API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
  // Always include credentials for API requests so session cookies are sent
  const req = new Request(request, { credentials: 'include', cache: 'no-store' });

  if (shouldCache) {
    // Cache-first strategy for menu, categories, etc.
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Serve from cache, update in background
      fetch(req)
        .then((response) => {
          if (response.ok) {
            caches.open(DYNAMIC_CACHE)
              .then((cache) => cache.put(request, response.clone()));
          }
        })
        .catch(() => {});
      
      return cachedResponse;
    }
  }

  // Network-first for other API requests
  try {
    const response = await fetch(req);
    if (response.ok && shouldCache) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback for API requests
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'You are currently offline. Some features may not be available.' 
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle static assets - cache-first
async function handleStaticAsset(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Asset not available offline', { status: 503 });
  }
}

// Handle navigation requests - serve app shell
async function handleNavigation(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    // Serve cached app shell for offline navigation
    const cachedResponse = await caches.match('/');
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

// Check if request is for a static asset
function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/build/') || 
         url.pathname.includes('.css') || 
         url.pathname.includes('.js') ||
         url.pathname.includes('.ico') ||
         url.pathname.includes('.png') ||
         url.pathname.includes('.jpg') ||
         url.pathname.includes('.svg');
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'order-sync') {
    event.waitUntil(syncFailedOrders());
  }
});

// Sync failed orders when back online
async function syncFailedOrders() {
  try {
    // Get failed orders from IndexedDB or localStorage
    // Retry sending them to the server
    console.log('[SW] Syncing failed orders...');
  } catch (error) {
    console.error('[SW] Failed to sync orders:', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: data.data,
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data;
  if (data && data.url) {
    event.waitUntil(
      clients.openWindow(data.url)
    );
  }
});
