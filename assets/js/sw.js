const CACHE_NAME = 'renmcycf-wallet-v1';

// Archivos básicos a guardar en el teléfono
const urlsToCache = [
    './wallet.renmcycf.html',
    './campus.renmcycf.html'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(urlsToCache);
        })
    );
    self.skipWaiting();
});

// Activación y limpieza de cachés antiguos (cuando actualices la app)
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

// Estrategia Fetch: "Red primero, luego caché" (Ideal para apps en tiempo real)
self.addEventListener('fetch', (event) => {
    // Ignorar las peticiones a Supabase para que los datos siempre estén en vivo
    if (event.request.url.includes('supabase.co')) {
        return;
    }

    event.respondWith(
        fetch(event.request).catch(() => {
            // Si el usuario se queda sin internet, mostramos la versión guardada en el celular
            return caches.match(event.request);
        })
    );
});
