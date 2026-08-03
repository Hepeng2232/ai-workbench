// Service Worker - 赴昕工作台 PWA
const CACHE_NAME = 'workbench-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './icon.svg'
];

// Install - cache assets
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS).catch(function() {
        // If any asset fails, still install
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch - cache-first for assets, network-first for HTML
self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      const networkFetch = fetch(e.request).then(function(response) {
        // Cache successful responses
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, clone).catch(function() {});
          });
        }
        return response;
      }).catch(function() {
        // Offline fallback
        return cached || caches.match('./index.html');
      });
      
      // Return cache immediately if available, otherwise wait for network
      return cached || networkFetch;
    })
  );
});
