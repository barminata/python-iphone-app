const CACHE_NAME = "learn-python-mobile-v2";

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./src/data/lessons.ts",
  "./src/utils/storage.ts",
  "./src/components/code-editor.tsx",
  "./src/components/assignment-card.tsx",
  "./src/main.tsx",
  "./src/styles.css",
  "./icons/icon.svg",
  "./icons/apple-touch-icon.svg",
  "https://cdn.tailwindcss.com?plugins=typography",
  "https://unpkg.com/react@18/umd/react.development.js",
  "https://unpkg.com/react-dom@18/umd/react-dom.development.js",
  "https://unpkg.com/@babel/standalone/babel.min.js",
  "https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt.min.js",
  "https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt-stdlib.js",
  "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => caches.match("./index.html"));
    }),
  );
});
