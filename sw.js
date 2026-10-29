const CACHE = 'pedramgholizadeh-v2';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  // Third-party requests are passed through untouched: nothing here is allowed to
  // depend on another host, so the worker never becomes a proxy for one.
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // HTML goes to the network first so a deploy shows up on the next reload, and is
  // kept as the offline fallback for the page the visitor already opened.
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        store(request, response);
        return response;
      } catch (offline) {
        return (await caches.match(request)) || (await caches.match('./')) || Response.error();
      }
    })());
    return;
  }

  // Code and data are revalidated in the background, so an edit is live on the
  // second visit without waiting for a cache version bump.
  if (/\.(json|css|js)$/.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Images and fonts are served straight from cache once seen.
  event.respondWith(cacheFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) store(request, response);
  return response;
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const refreshed = fetch(request)
    .then((response) => {
      if (response.ok) store(request, response);
      return response;
    })
    .catch(() => cached);
  return cached || refreshed;
}

function store(request, response) {
  return caches.open(CACHE).then((cache) => cache.put(request, response.clone()));
}
