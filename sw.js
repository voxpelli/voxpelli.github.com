// Service worker — inspired by Jeremy Keith: https://adactio.com/journal/9775

const SW_VERSION = '__BUILD_VERSION__';

const CACHE_NAME = `static-${SW_VERSION}`;

/**
 * Pre-cache essential pages during install.
 *
 * @returns {Promise<void>}
 */
async function updateStaticCache () {
  const cache = await caches.open(CACHE_NAME);

  // Non-blocking: cache in background
  cache.addAll([
    '/about/',
  ]);

  // Blocking: wait for these before completing install
  await cache.addAll([
    '/avatar.jpg',
    '/offline/',
    '/',
  ]);
}

// Install: pre-cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(updateStaticCache());
});

// Activate: remove old caches from previous versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    ))
  );
});

// Fetch: network-first for HTML, cache-first for other assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests
  if (request.method !== 'GET') { return; }

  // Ignore requests from other hosts
  if (url.hostname !== self.location.hostname) { return; }

  const accept = request.headers.get('Accept') ?? '';

  // HTML: try network first, fall back to cache, then offline page
  if (accept.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .catch(() =>
          caches.match(request)
            .then((response) => response || caches.match('/offline/'))
        )
    );
    return;
  }

  // Non-HTML: try cache first, fall back to network
  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) { return response; }

        return fetch(request)
          .catch((err) => {
            // For image requests, return an offline placeholder SVG
            if (accept.includes('image')) {
              return new Response('<svg role="img" aria-labelledby="offline-title" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><title id="offline-title">Offline</title><g fill="none" fill-rule="evenodd"><path fill="#D8D8D8" d="M0 0h400v300H0z"/><text fill="#9B9B9B" font-family="Helvetica Neue,Arial,Helvetica,sans-serif" font-size="72" font-weight="bold"><tspan x="93" y="172">offline</tspan></text></g></svg>', { headers: { 'Content-Type': 'image/svg+xml' } });
            }
            throw err;
          });
      })
  );
});
