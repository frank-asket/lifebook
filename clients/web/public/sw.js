const CACHE_NAME = "lifebook-sanctuary-pwa-v2";
const DEVOTIONAL_CACHE_NAME = "lifebook-devotional-tracks-v1";

const PRECACHE_URLS = [
  "/dashboard",
  "/progress",
  "/living-word",
  "/voice",
  "/",
  "/manifest.webmanifest",
  "/icon.svg",
  "/apple-touch-icon.png",
  "/pwa-192x192.png",
  "/pwa-512x512.png",
  "/pwa-maskable-512x512.png",
  "/lifebook-logo.png",
  "/logol.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          fetch(url, { credentials: "same-origin" })
            .then((res) => {
              if (res && res.status === 200) {
                return cache.put(url, res);
              }
            })
            .catch(() => {})
        )
      );
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME && k !== DEVOTIONAL_CACHE_NAME)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Allow client pages to push the 7 daily Scripture devotional tracks into offline cache
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CACHE_DEVOTIONAL_TRACKS") {
    const payload = JSON.stringify({
      cachedAt: new Date().toISOString(),
      tracks: event.data.tracks || {},
    });
    event.waitUntil(
      caches.open(DEVOTIONAL_CACHE_NAME).then((cache) =>
        cache.put(
          new Request("/offline-devotional-tracks.json"),
          new Response(payload, {
            headers: { "Content-Type": "application/json" },
          })
        )
      )
    );
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Serve cached offline devotional tracks JSON
  if (url.pathname === "/offline-devotional-tracks.json") {
    event.respondWith(
      caches.open(DEVOTIONAL_CACHE_NAME).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        return new Response(JSON.stringify({ tracks: {} }), {
          headers: { "Content-Type": "application/json" },
        });
      })
    );
    return;
  }

  // Static assets: CacheFirst
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".woff2")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((c) => c.put(request, clone));
            }
            return response;
          })
          .catch(() => cached || Response.error());
      })
    );
    return;
  }

  // Page navigations & API GETs: NetworkFirst with Offline Cache Fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === "navigate") {
          const dashboardFallback = await caches.match("/dashboard");
          if (dashboardFallback) return dashboardFallback;
          const rootFallback = await caches.match("/");
          if (rootFallback) return rootFallback;
        }
        return new Response(
          JSON.stringify({
            offline: true,
            message: "LifeBook Offline Sanctuary — using cached devotional state.",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      })
  );
});
