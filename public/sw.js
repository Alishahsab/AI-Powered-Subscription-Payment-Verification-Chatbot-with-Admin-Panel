// Keeps the customer app's files on the device so a signed-in customer can open the chat without internet.
// Pages always come from the network first, so a new version goes live straight away; the saved copy is
// only used when there is no connection. Data (Supabase) and API requests are never touched.
const CACHE = "premium-store-app-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function saveCopy(request, response) {
  if (response.ok) {
    const copy = response.clone();
    caches.open(CACHE).then((cache) => cache.put(request, copy));
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  // Built files never change under the same name, so the saved copy is safe to use first.
  if (url.pathname.startsWith("/_next/static/") || /\.(png|jpg|jpeg|svg|ico|webp|woff2?)$/.test(url.pathname)) {
    event.respondWith(caches.match(request).then((saved) => saved || fetch(request).then((response) => saveCopy(request, response))));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => saveCopy(request, response))
        .catch(() => caches.match(request).then((saved) => saved || caches.match("/")))
    );
  }
});
