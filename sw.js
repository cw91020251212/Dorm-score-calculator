/* Dorm Score Calculator — service worker
 * 目的：滿足 PWA 安裝條件（Chrome/Edge/Android 需要 SW），
 * 順便令離線都用得。策略：network-first + cache fallback。
 */
const CACHE = 'dorm-score-v4';
const CORE = [
  './',
  './index.html',
  './assets/manifest.webmanifest',
  './assets/favicon.ico',
  './assets/icon-32.png',
  './assets/icon-192.png',
  './assets/icon-256.png',
  './assets/icon-512.png',
  './assets/apple-touch-icon.png',
  './assets/og-preview.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(CORE).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  // 只處理同源請求，避免影響 CDN / Google Fonts / Font Awesome
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        // 有效回應先 clone 落 cache
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then((c) => c || caches.match('./index.html')))
  );
});
