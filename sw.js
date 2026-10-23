// Offline shell for the photobooth. Bump VERSION when you change files.
const VERSION = "pb-v3";
const SHELL = ["./", "./index.html", "./qrcode.js", "./brand/logo.png", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;                       // uploads and email go straight to the network
  const fonts = url.host === "fonts.googleapis.com" || url.host === "fonts.gstatic.com";
  if (url.origin !== location.origin && !fonts) return;
  if (req.mode === "navigate") {                           // network first, so new deploys land
    e.respondWith(fetch(req).then((r) => { caches.open(VERSION).then((c) => c.put("./index.html", r.clone())); return r; })
      .catch(() => caches.match("./index.html")));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => {
    const net = fetch(req).then((r) => { if (r.ok || r.type === "opaque") caches.open(VERSION).then((c) => c.put(req, r.clone())); return r; });
    return hit || net;
  }));
});