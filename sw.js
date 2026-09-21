/* 携帯塵劫記 Service Worker
   本体（index.html）は通信できるときは常に最新を取りに行き、圏外のときだけ保存分を使う。
   アイコン等は保存分を先に使う。
   ※ アイコンや manifest を差し替えたときは CACHE の番号を一つ上げること。 */
const CACHE = 'jinkouki-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-192.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon.svg',
  './icons/favicon.ico'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== location.origin) return;

  /* 本体：まず通信、だめなら保存分 */
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html').then(m => m || caches.match('./')))
    );
    return;
  }

  /* アイコン等：まず保存分、無ければ通信して保存 */
  e.respondWith(
    caches.match(req).then(m => m || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }))
  );
});
