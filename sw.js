/* Service worker minimal – cache static pentru offline de bază */
const CACHE = "msk-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./css/app.css",
  "./manifest.json",
  "./js/config.js",
  "./js/storage.js",
  "./js/scores.js",
  "./js/triage.js",
  "./js/doctor.js",
  "./js/consult.js",
  "./js/kineto.js",
  "./js/followup.js",
  "./js/homecare.js",
  "./js/demo.js",
  "./js/app.js"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request).catch(() => caches.match("./index.html")))
  );
});
