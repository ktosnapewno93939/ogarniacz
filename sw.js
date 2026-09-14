/* Service worker: apka dziala bez internetu, ale poprawki widac od razu.
   Strategia: najpierw siec, cache jako zapas. Wazne przy testowaniu na goraco —
   inaczej telefon pokazywalby stara wersje az do wyczyszczenia danych. */
const CACHE = 'ogarniacz-v2';
const PLIKI = ['./', './index.html', './styles.css', './app.js', './parser.js', './manifest.json', './icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PLIKI).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;

  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const kopia = res.clone();
          caches.open(CACHE).then(c => c.put(req, kopia)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then(hit => hit || caches.match('./index.html'))
      )
  );
});

/* Strona moze poprosic o natychmiastowe przejscie na nowa wersje. */
self.addEventListener('message', e => {
  if (e.data === 'odswiez') self.skipWaiting();
});
