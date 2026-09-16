/* ObraAcuática — service worker
   Cache-first con precache de la app completa (todo local,
   sin llamadas externas): primera visita guarda, de ahí en
   más abre instantáneo y SIN internet (PWA instalable). */
const CACHE = "obracuatica-v4.0";
const V = "?v=4.0";   // bump junto con CACHE: cambia la query = recurso nuevo, nunca colisión de versiones
const ASSETS = [
  "./", "./index.html", "./styles.css" + V,
  "./data.js" + V, "./protocols.js" + V, "./engine.js" + V,
  "./planos.js" + V, "./ilustraciones.js" + V, "./obra.js" + V,
  "./proveedores.js" + V, "./ia.js" + V, "./sec-core.js" + V, "./auth.js" + V,
  "./enterprise.js" + V, "./ui.js" + V,
  "./manifest.webmanifest", "./icon.svg", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png",
  "./img/hero.jpg" + V, "./img/arena.jpg" + V, "./img/tradicional.jpg" + V,
  "./img/prefabricada.jpg" + V, "./img/natural.jpg" + V, "./img/contenedor.jpg" + V,
  "./img/vidrio.jpg" + V, "./img/suspendida.jpg" + V, "./img/plunge.jpg" + V,
  "./img/endless.jpg" + V, "./img/spa.jpg" + V
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  // solo mismo origen (las fuentes de Google y links externos van directo a la red)
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request).then(hit => hit ||
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match("./index.html"))
    )
  );
});
