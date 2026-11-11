/* Gym Buddy service worker — precaches everything so the app works offline.
   Bump VERSION whenever any app file or image changes. */
const VERSION = 'gym-buddy-v5';
const FILES = ['./', 'index.html', 'app.js', 'styles.css', 'manifest.json', 'fonts/oswald.woff2',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png',
'images/air-bike.png',
  'images/band-lateral-walk.png',
  'images/bench-press.png',
  'images/bird-dog.png',
  'images/bridge-march.png',
  'images/bulgarian-split-squat.png',
  'images/cat-cow.png',
  'images/childs-pose.png',
  'images/clamshell.png',
  'images/curved-treadmill.png',
  'images/dead-bug.png',
  'images/easy-walk.png',
  'images/face-pull.png',
  'images/figure-4-stretch.png',
  'images/glute-bridge.png',
  'images/goblet-squat.png',
  'images/half-kneeling-press.png',
  'images/hip-flexor-overhead.png',
  'images/hip-flexor-stretch.png',
  'images/hip-thrust.png',
  'images/nerve-glide.png',
  'images/one-arm-row.png',
  'images/pallof-press.png',
  'images/plank.png',
  'images/quad-stretch.png',
  'images/rdl.png',
  'images/rower.png',
  'images/side-plank.png',
  'images/single-leg-bridge.png',
  'images/step-up.png',
  'images/suitcase-carry.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(FILES.map(f => c.add(new Request(f, { cache: 'reload' }))))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(r => {
    if (r && r.ok && new URL(e.request.url).origin === location.origin) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); }
    return r;
  }).catch(() => e.request.mode === 'navigate' ? caches.match('index.html') : undefined)));
});
