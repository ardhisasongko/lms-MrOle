/* Service worker Mr Ole — sengaja minimal & aman.
   Strategi: network-first untuk SEMUA request. Cache hanya dipakai sebagai
   cadangan saat offline (navigasi terakhir & shell), tidak pernah menyajikan
   konten basi selama jaringan tersedia — situs ini sering berubah. */
const CACHE_NAME = 'mr-ole-pwa-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      try {
        const fresh = await fetch(request);
        if (request.mode === 'navigate') {
          const cache = await caches.open(CACHE_NAME);
          cache.put('/', fresh.clone());
        }
        return fresh;
      } catch (error) {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === 'navigate') {
          const shell = await caches.match('/');
          if (shell) return shell;
        }
        throw error;
      }
    })(),
  );
});
