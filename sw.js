const CACHE_NAME = 'calc-adubacao-v2';
const APP_PREFIX = '/Calculadora';

// URLs para cache (atualizado)
const urlsToCache = [
  `${APP_PREFIX}/`,
  `${APP_PREFIX}/index.html`,
  `${APP_PREFIX}/manifest.json`,
  `${APP_PREFIX}/sw.js`,
  `${APP_PREFIX}/icons/icon-72x72.png`,
  `${APP_PREFIX}/icons/icon-96x96.png`,
  `${APP_PREFIX}/icons/icon-128x128.png`,
  `${APP_PREFIX}/icons/icon-144x144.png`,
  `${APP_PREFIX}/icons/icon-152x152.png`,
  `${APP_PREFIX}/icons/icon-192x192.png`,
  `${APP_PREFIX}/icons/icon-384x384.png`,
  `${APP_PREFIX}/icons/icon-512x512.png`,
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.min.js'
];

self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cacheando recursos offline');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Instalação completa');
        return self.skipWaiting(); // Ativa imediatamente
      })
      .catch((error) => {
        console.error('Service Worker: Erro na instalação:', error);
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Ativando...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Ativação completa');
      return self.clients.claim(); // Toma controle de todas as abas
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Ignora requisições não-GET
  if (event.request.method !== 'GET') return;

  // Para requisições da mesma origem ou do Chart.js
  if (event.request.url.startsWith(self.location.origin) || 
      event.request.url.includes('cdn.jsdelivr.net/npm/chart.js')) {
    
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          // Retorna do cache se disponível
          if (cachedResponse) {
            console.log('Service Worker: Servindo do cache:', event.request.url);
            return cachedResponse;
          }

          // Se não está no cache, busca na rede
          return fetch(event.request)
            .then((networkResponse) => {
              // Verifica se a resposta é válida
              if (!networkResponse || networkResponse.status !== 200 || 
                  networkResponse.type !== 'basic') {
                return networkResponse;
              }

              // Clona a resposta e adiciona ao cache
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                  console.log('Service Worker: Cache atualizado:', event.request.url);
                });

              return networkResponse;
            })
            .catch((error) => {
              console.error('Service Worker: Erro no fetch:', error);
              // Poderia retornar uma página offline customizada aqui
              // return caches.match('/offline.html');
            });
        })
    );
  }
});

// Ouvinte para mensagens da aplicação
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});