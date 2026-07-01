const CACHE_NAME = "mata-reva-booking-v21";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=21",
  "./supabase-config.js",
  "./app.js?v=21",
  "./manifest.webmanifest",
  "./assets/logo-mata.jpg",
  "./assets/logo-192.png",
  "./assets/logo-512.png",
  "./assets/tarif-mata-reva.jpg"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
