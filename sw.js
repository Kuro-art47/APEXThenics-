const CACHE_NAME = "apexthenics-v1";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json"
];

// Install the service worker and cache essential app files.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

// Activate the service worker and remove old APEXthenics caches.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) =>
            name.startsWith("apexthenics-") &&
            name !== CACHE_NAME
          )
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

// Serve cached files when offline; otherwise try the network.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestURL = new URL(event.request.url);

  if (requestURL.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === "basic"
          ) {
            const responseCopy = networkResponse.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseCopy);
            });
          }

          return networkResponse;
        })
        .catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match("./index.html");
          }

          return new Response("You are offline.", {
            status: 503,
            headers: {
              "Content-Type": "text/plain"
            }
          });
        })
    })
  );
});
