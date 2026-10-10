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

const precacheStaticAssets = async () => {
  const cache = await caches.open(CACHE_NAME);
  await Promise.all(
    STATIC_PRECACHE.map(async (url) => {
      try {
        await cache.add(url);
      } catch {
        // Continue even if an optional asset fails
      }
    })
  );
};

const cleanupStaleCaches = async () => {
  const keys = await caches.keys();
  await Promise.all(
    keys.map((key) => {
      if (key.startsWith("cim-life-") && key !== CACHE_NAME) {
        return caches.delete(key);
      }
      return Promise.resolve();
    })
  );
};

const handleNavigationRequest = async (request) => {
  try {
    return await fetch(request);
  } catch {
    const fallbackResponse = await caches.match("/index.html");
    if (fallbackResponse) {
      return fallbackResponse;
    }
    return fetch(request);
  }
};

const handleStaticAssetRequest = (event, request) => {
  event.respondWith(
    (async () => {
      const cachedResponse = await caches.match(request);
      const cacheWritePromise = (async () => {
        try {
          const networkResponse = await fetch(request);
          if (networkResponse?.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          return cachedResponse;
        }
      })();

      event.waitUntil(cacheWritePromise);
      return cachedResponse || cacheWritePromise;
    })()
  );
};

// Install event: cache minimal shell
self.addEventListener("install", (event) => {
  event.waitUntil(precacheStaticAssets());
  self.skipWaiting();
});

// Activate event: clean up stale caches
self.addEventListener("activate", (event) => {
  event.waitUntil(cleanupStaleCaches());
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

  // Strictly only intercept same-origin requests to prevent third-party interference
  if (url.origin !== self.location.origin) {
    return;
  }

  // Bypass API and proxy routes
  if (url.pathname.startsWith("/ncu/")) {
    return;
  }

  // Navigation requests: network first, fallback to cached index.html
  if (request.mode === "navigate") {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Same-origin static assets: stale-while-revalidate
  handleStaticAssetRequest(event, request);
});
