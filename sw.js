// Сервис-воркер: сохраняет файлы игры на устройстве, чтобы она запускалась без интернета.
// После изменения файлов игры увеличьте VERSION — тогда у игроков скачается новая версия.

const VERSION = 'glowrun-v2';
const SHELL = [
  './',
  'index.html',
  'style.css',
  'manifest.json',
  'assets/icon-192.png',
  'assets/icon-512.png',
  'src/main.js',
  'src/config.js',
  'src/maze.js',
  'src/entities.js',
  'src/game.js',
  'src/render.js',
  'src/fx.js',
  'src/input.js',
  'src/audio.js',
  'src/ui.js',
  'src/storage.js',
  'src/worlds/index.js',
  'src/worlds/common.js',
  'src/worlds/cyber.js',
  'src/worlds/deep.js',
  'src/worlds/forest.js',
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))),
  );
  self.clients.claim();
});

// Сначала отдаём сохранённую копию (быстро и без интернета), а в фоне обновляем её.
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const own = url.origin === self.location.origin;
  const fonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!own && !fonts) return;

  event.respondWith(
    caches.open(VERSION).then(async cache => {
      const cached = await cache.match(req, { ignoreSearch: own });
      const fresh = fetch(req)
        .then(res => {
          if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || fresh;
    }),
  );
});
