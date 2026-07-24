// Basic Service Worker for OrderMint POS PWA
const CACHE_NAME = 'ordermint-pos-v2'; // Bumped version to force update
const OFFLINE_URL = '/offline.html';

const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only intercept GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // 🚀 CRITICAL: NEVER intercept API calls, B2B routes, localhost/dev server, Socket.IO, port 5002, or cross-origin requests
  // This prevents network errors and "Failed to convert value to Response" errors
  if (
    self.location.hostname === 'localhost' ||
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('b2b') ||
    url.pathname.includes('socket.io') ||
    url.pathname.includes('capacitor.js') ||
    url.pathname.includes('cordova.js') ||
    url.pathname.includes('cordova_plugins.js') ||
    url.pathname.startsWith('/plugins/') ||
    url.port === '5002' ||
    url.hostname !== self.location.hostname
  ) {
    return; // Let the browser handle these normally
  }

  // Basic fetch strategy: Network first, fallback to cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/');
      })
    );
    return;
  }

  // Assets and other requests
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch((err) => {
        console.warn('[Service Worker] Fetch failed for:', event.request.url, err);
        return new Response('Network error occurred', { status: 408 });
      });
    })
  );
});
