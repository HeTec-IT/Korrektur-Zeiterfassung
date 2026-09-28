const CACHE_NAME = "zeitkorrektur-v2";
const CACHE_PREFIX = "zeitkorrektur-";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-192-maskable.png",
  "./icon-512-maskable.png"
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    await Promise.allSettled(ASSETS.map(async path => {
      const request = new Request(
        new URL(path, self.registration.scope),
        { cache: "reload" }
      );
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response);
    }));

    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();

    await Promise.all(
      keys
        .filter(key =>
          key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME
        )
        .map(key => caches.delete(key))
    );

    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    !url.href.startsWith(self.registration.scope)
  ) return;

  const result = (async () => {
    const cache = await caches.open(CACHE_NAME);

    try {
      const response = await fetch(request, {
        cache: "no-cache"
      });

      if (response.ok) {
        return {
          response,
          save: cache.put(request, response.clone())
            .catch(() => {})
        };
      }

      if (response.status < 500) return { response };

      const cached = await cache.match(request);
      return { response: cached || response };
    } catch {
      let cached = await cache.match(request);

      if (!cached && request.mode === "navigate") {
        cached =
          await cache.match(
            new URL("./index.html", self.registration.scope).href
          ) ||
          await cache.match(
            new URL("./", self.registration.scope).href
          );
      }

      return {
        response: cached || new Response(
          "Offline: Bitte Internetverbindung herstellen.",
          {
            status: 503,
            headers: {
              "Content-Type": "text/plain; charset=utf-8"
            }
          }
        )
      };
    }
  })();

  event.respondWith(result.then(value => value.response));
  event.waitUntil(result.then(value => value.save));
});
