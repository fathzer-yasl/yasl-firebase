// Service worker: makes the app installable and caches static assets for
// faster loads and offline shell display. Authentication and Firestore
// still require connectivity.
const CACHE = 'yasl-v1';

// Runtime configuration must always be fetched fresh
// (it is mounted as a volume at container startup in Docker)
const NETWORK_ONLY = ['config/firebaseConfig.js'];

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (NETWORK_ONLY.some(p => url.pathname.endsWith(p))) return;

  // Navigations: network first, fall back to the cached shell when offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(c => c.put('/', copy));
          return response;
        })
        .catch(() => caches.match('/'))
    );
    return;
  }

  // Other static assets (hashed JS/CSS, icons): stale-while-revalidate
  event.respondWith(
    caches.match(request).then(cached => {
      const fetched = fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(c => c.put(request, copy));
        }
        return response;
      });
      return cached || fetched.catch(() => cached);
    })
  );
});
