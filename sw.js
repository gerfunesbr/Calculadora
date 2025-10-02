const CACHE_NAME = 'calc-adubacao-v1';
const APP_PREFIX = '/Calculadora';

const urlsToCache = [
  `${APP_PREFIX}/`,
  `${APP_PREFIX}/index.html`,
  `${APP_PREFIX}/manifest.json`,
  `${APP_PREFIX}/sw.js`,
  `${APP_PREFIX}/icons/icon-72x72.png`,
  `${APP_PREFIX}/icons/icon-192x192.png`,
  'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  // Só processa requisições do mesmo origin
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Retorna do cache se encontrou
          if (response) {
            return response;
          }
          
          // Clona a requisição porque ela só pode ser usada uma vez
          const fetchRequest = event.request.clone();
          
          return fetch(fetchRequest).then(
            (response) => {
              // Checa se é uma resposta válida
              if(!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              // Clona a resposta porque ela só pode ser usada uma vez
              const responseToCache = response.clone();
              
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
              
              return response;
            }
          );
        })
    );
  }
});
