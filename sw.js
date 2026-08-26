// =========================================================
// SERVICE WORKER - RENMCYCF (ASARI SaaS)
// Versión: 2.1.0 (Actualizado - Exclusión de Panel)
// =========================================================

const CACHE_NAME = 'renmcycf-cache-v2.1'; // <-- Aumentamos la versión para forzar la purga
const urlsToCache = [
  '/',
  '/index.renmcycf.html',
  '/legajo.renmcycf.html', // <-- Actualizado al nombre correcto
  '/validador.renmcycf.html',
  '/logo-192.png',
  '/logo-512.png',
  '/manifest.json',
  
  // CDN Externos (Librerías estructurales)
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://unpkg.com/aos@2.3.1/dist/aos.css',
  'https://unpkg.com/aos@2.3.1/dist/aos.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.js',
  
  // Fuentes
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Montserrat:wght@700;800;900&family=JetBrains+Mono:wght@400;700&display=swap'
];

// 1. INSTALACIÓN: Cachear recursos críticos
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierta v2.1');
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. ACTIVACIÓN: Limpiar cachés viejas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Borrando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. ESTRATEGIA DE RED: Escudo para el Panel y Stale-While-Revalidate
self.addEventListener('fetch', event => {
  // ESCUDO 1: Ignorar el Panel de Administración por completo (Nunca Cachear)
  if (event.request.url.includes('panel-renmcycf.html')) {
    return; // Pasa de largo hacia el servidor
  }

  // ESCUDO 2: Ignorar peticiones a Supabase (PostgREST/Storage)
  if (event.request.url.includes('supabase.co')) {
    return; 
  }

  // Ignorar POST, PUT, DELETE (solo cacheamos GET)
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Si la red responde bien, guardamos una copia fresca en caché
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Si falla la red (Modo Offline), busca en el caché
        return caches.match(event.request);
      })
  );
});
