/* Offline support for roaming: the page, code, route and phone-size photos are
   stored on first visit; afterwards the site opens with no signal at all.
   HTML: network first (fresh when online). Everything else: cache first. */
const V = "november-noir-v2";
const CORE = ["./", "index.html", "css/style.css", "js/trip.js", "js/photos.js", "js/app.js", "data/route.geojson", "data/elev-wed.json"];
self.addEventListener("install", (e) => e.waitUntil((async () => {
  const c = await caches.open(V);
  await c.addAll(CORE);
  const ids = Object.keys((await (await fetch("js/photos.js")).text()).match(/"([a-z0-9-]+)": \{/g).reduce((o, m) => (o[m.slice(1, m.indexOf('"', 1))] = 1, o), {}));
  await Promise.allSettled(ids.map((id) => c.add(`img/${id}-960.avif`)));   // ~1.4 MB, phone size
  self.skipWaiting();
})()));
self.addEventListener("activate", (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== V) await caches.delete(k);
  self.clients.claim();
})()));
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  // live APIs handle their own offline fallback (saved in localStorage) — don't cache them here
  if (/open-meteo|e-control|tile\.openstreetmap/.test(u.host)) return;
  if (e.request.mode === "navigate") {
    e.respondWith(fetch(e.request).then((r) => { caches.open(V).then((c) => c.put("index.html", r.clone())); return r; })
      .catch(() => caches.match("index.html")));
    return;
  }
  // code + data: network first, so a redesign reaches phones that visited before
  if (u.origin === location.origin && /\.(css|js|json|geojson)$/.test(u.pathname)) {
    e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); caches.open(V).then((c) => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request)));
    return;
  }
  // photos + fonts: cache first
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => {
    if (r.ok || r.type === "opaque") { const copy = r.clone(); caches.open(V).then((c) => c.put(e.request, copy)); }
    return r;
  })));
});
