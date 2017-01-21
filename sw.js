'use strict';

// This file has been heavily inspired by Jeremy Keith's work: https://adactio.com/journal/9775

const staticCacheName = 'static';
const version = 'v1::';

const updateStaticCache = () => {
  return caches.open(version + staticCacheName)
    .then(cache => {
      // Do not wait for these
      cache.addAll([
        '/css/img/loader.gif',
        '/about/'
      ]);

      // But please, do wait for these
      return cache.addAll([
        '/js/indieconfig.js',
        '/js/webaction.js',
        '/css/style.css',
        '/avatar.jpg',
        '/offline/',
        '/'
      ]);
    });
};

// It's install time! Hurry, lets get everything in order so we can start the party? Right? Go!
self.addEventListener('install', event => {
  event.waitUntil(updateStaticCache());
});

// Omg – it's party time! This is going to be so unbelievable fun. Lets take another look in the mirror and get going!
self.addEventListener('activate', event => {
  event.waitUntil(
    // Fetch all existing keys
    caches.keys()
      .then(keys => Promise.all(
        // Filter out all old caches – and then remove them
        keys
          .filter(key => !key.startsWith(version))
          .map(key => caches.delete(key))
      ))
  );
});

// It's time for the dance floor. Everyone is watching. Now is no time for failure. Lets do it! Dance moves: 💃
self.addEventListener('fetch', event => {
  const request = event.request;

  // Ignore non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // For HTML requests, try the network first, fall back to the cache, finally the offline page
  if (request.headers.get('Accept').indexOf('text/html') !== -1) {
    event.respondWith(
      fetch(request)
        // TODO: Stash the response in a cache
        .catch(() =>
          caches.match(request)
            .then(response => response || caches.match('/offline/'))
        )
    );
    return;
  }

  // For non-HTML requests, look in the cache first, fall back to the network
  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) { return response; }

        return fetch(request)
          // TODO: Stash the response in a cache
          .catch(err => {
            // If the request is for an image, show an offline placeholder
            if (request.headers.get('Accept').indexOf('image') !== -1) {
              return new Response('<svg role="img" aria-labelledby="offline-title" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><title id="offline-title">Offline</title><g fill="none" fill-rule="evenodd"><path fill="#D8D8D8" d="M0 0h400v300H0z"/><text fill="#9B9B9B" font-family="Helvetica Neue,Arial,Helvetica,sans-serif" font-size="72" font-weight="bold"><tspan x="93" y="172">offline</tspan></text></g></svg>', {headers: {'Content-Type': 'image/svg+xml'}});
            }
            throw err;
          });
      })
  );
});