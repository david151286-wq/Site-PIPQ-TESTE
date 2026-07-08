/* ==================================================================
   SERVICE WORKER — PIPQ
   Estratégia: "cache-first com atualização em segundo plano".
   - Tudo que é essencial (páginas, JSON da Bíblia e do Hinário) é
     baixado e guardado já na instalação, então o app funciona
     offline desde a primeira visita completa.
   Sempre que você atualizar algum conteúdo (ex.: trocar a Bíblia
   ou o hinário), aumente o número da versão abaixo — isso força o
   navegador a buscar tudo de novo e atualizar o cache.
   ================================================================== */

const CACHE_VERSION = 'pipq-cache-v1';

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './style.css',
  './biblia.html',
  './cantico.html',
  './igreja.html',
  './contribua.html',
  './eventos.html',
  './oracao.html',
  './noticias.html',
  './pastoreio.html',
  './mensagens.html',
  './agenda.html',
  './boletim.html',
  './lives.html',
  './devocional.html',
  './notificacoes.html',
  './configuracoes.html',
  './perfil.html',
  './biblia-ara.json',
  './biblia-naa.json',
  './biblia-acf.json',
  './novo-cantico.json',
  './assets/logo-fundo.jpeg',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache =>
      // adicionamos um por um e ignoramos os que ainda não existirem
      // na pasta, para a instalação não falhar por causa de 1 arquivo
      Promise.all(
        CORE_ASSETS.map(url =>
          cache.add(url).catch(() => {/* arquivo ainda não existe — tudo bem */})
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      const networkFetch = fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then(cache => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached); // sem internet: usa o que já está em cache

      return cached || networkFetch;
    })
  );
});
