// Chessnet app worker: always loads the newest page when online,
// and keeps one saved copy to open when there is no internet.
const CACHE = "chessnet-app-v1";

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.add("/")).catch(() => {})
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  // Only handle opening the Chessnet page itself.
  // Supabase, Lichess and everything else go straight to the internet.
  if (request.mode !== "navigate" || url.origin !== self.location.origin ||
      (url.pathname !== "/" && url.pathname !== "/index.html")) return;

  event.respondWith(
    fetch(request)
      .then(response => {
        const type = response.headers.get("content-type") || "";
        if (response.ok && !response.redirected && !url.search &&
            type.includes("text/html")) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE).then(c => c.put("/", copy)));
        }
        return response;
      })
      .catch(async () =>
        (await caches.match("/")) ||
        new Response("You are offline. Check your internet and try again.",
          { headers: { "Content-Type": "text/plain" } })
      )
  );
});
