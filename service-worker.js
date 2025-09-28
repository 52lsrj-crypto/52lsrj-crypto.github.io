/* Simple image + static cache (stale-while-revalidate) for demo external images */
const CACHE_VERSION = "v1.0.0";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const RUNTIME_IMAGES = `images-${CACHE_VERSION}`;

const CORE_ASSETS = [
  "/", // GitHub Pages 可能以根路径提供
  "/index.html",
  "/styles.css",
  "/main.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => ![STATIC_CACHE, RUNTIME_IMAGES].includes(k))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  // 对图片采用 stale-while-revalidate（含外链）
  if (request.destination === "image") {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_IMAGES));
    return;
  }

  // 对核心静态资源采用 cache-first
  const url = new URL(request.url);
  const isCore = CORE_ASSETS.includes(url.pathname);
  if (isCore) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 其他 GET 走网络优先，失败回退缓存
  event.respondWith(
    fetch(request)
      .then((resp) => {
        const respClone = resp.clone();
        caches.open(STATIC_CACHE).then((c) => c.put(request, respClone)).catch(() => {});
        return resp;
      })
      .catch(async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(request, { ignoreVary: true });
        if (cached) return cached;
        return new Response("Offline", { status: 503, statusText: "Offline" });
      })
  );
});

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request, { ignoreVary: true });
  const networkPromise = fetch(request)
    .then((resp) => {
      cache.put(request, resp.clone()).catch(() => {});
      return resp;
    })
    .catch(() => null);

  return cached || (await networkPromise) || fetch(request);
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request, { ignoreVary: true });
  if (cached) return cached;
  const resp = await fetch(request);
  cache.put(request, resp.clone()).catch(() => {});
  return resp;
}