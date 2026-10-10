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
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(STATIC_PRECACHE);
  } catch {
    // Continue even if an asset fails to cache initially
  }
};

const cleanupStaleCaches = async () => {
  const keys = await caches.keys();
  await Promise.all(
    keys.map((key) => {
      if (key !== CACHE_NAME) {
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

const handleStaticAssetRequest = async (request) => {
  const cachedResponse = await caches.match(request);
  const fetchPromise = (async () => {
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

  return cachedResponse || fetchPromise;
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
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Same-origin static assets: stale-while-revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(handleStaticAssetRequest(request));
  }
});
