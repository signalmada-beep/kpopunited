// ========== public/service-worker.js ==========
const CACHE_NAME = 'kpop-united-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo1.png',
  '/logo.png',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Cache ouvert');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Cache supprimé:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - retourner la réponse
        if (response) {
          return response;
        }

        // Cloner la requête
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          // Vérifier si la réponse est valide
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Cloner la réponse
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
  );
});