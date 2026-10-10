/**
 * NCUIM CIM-Life Service Worker
 * Provides offline caching for core static assets and enables PWA installability.
 */

const CACHE_NAME = "cim-life-v1";

const STATIC_PRECACHE = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

// Install event: cache minimal shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_PRECACHE).catch(() => {
        // Continue even if some optional asset fails
      });
    })
  );
  self.skipWaiting();
});

// Activate event: clean up stale caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return Promise.resolve();
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event: network-first for navigation, stale-while-revalidate for same-origin static assets
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Ignore non-GET requests
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // Bypass API calls, external APIs, and dev server proxies
  if (
    url.pathname.startsWith("/ncu/") ||
    url.hostname.includes("workers.dev") ||
    url.hostname.includes("ncu.edu.tw") ||
    url.hostname.includes("google.com") ||
    url.hostname.includes("shields.io") ||
    url.hostname.includes("hits.sh") ||
    url.hostname.includes("sonarcloud.io")
  ) {
    return;
  }

  // Navigation requests: network first, fallback to cached index.html
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match("/index.html").then((res) => {
          return res || fetch(request);
        });
      })
    );
    return;
  }

  // Same-origin static assets: stale-while-revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
  }
});
