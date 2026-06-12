// Service worker TicTime - cache hors-ligne
const CACHE_NAME = 'tictime-v5';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './conventions.json',
  './icon-192.png',
  './icon-512.png'
];
// CDN mis en cache (bibliothèques + polices)
const CDN_HOSTS = ['cdn.jsdelivr.net', 'cdnjs.cloudflare.com', 'www.gstatic.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];
// API Firebase : toujours en réseau, jamais en cache
const NETWORK_ONLY = ['firestore.googleapis.com', 'identitytoolkit.googleapis.com', 'securetoken.googleapis.com', 'www.googleapis.com', 'apis.google.com'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((c) => c.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (NETWORK_ONLY.some((h) => url.hostname === h || url.hostname.endsWith('.' + h))) return;
  // Pages HTML : réseau d'abord (mises à jour immédiates), cache en secours hors-ligne
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request, { cache: 'no-cache' }).then((resp) => {
        const clone = resp.clone();
        caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
        return resp;
      }).catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
    );
    return;
  }
  const cacheable = url.origin === self.location.origin || CDN_HOSTS.includes(url.hostname);
  if (!cacheable) return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fromNetwork = fetch(e.request).then((resp) => {
        if (resp && (resp.status === 200 || resp.type === 'opaque')) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => cached);
      // Cache d'abord (rapide, hors-ligne), réseau en arrière-plan pour rafraîchir
      return cached || fromNetwork;
    })
  );
});
