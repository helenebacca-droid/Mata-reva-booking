const CACHE_NAME = "mata-reva-booking-v20";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./supabase-config.js",
  "./app.js",
  "./manifest.webmanifest",
  "./assets/logo-mata.jpg",
  "./assets/logo-192.png",
  "./assets/logo-512.png",
  "./assets/tarif-mata-reva.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
