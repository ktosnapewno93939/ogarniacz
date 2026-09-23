/* Service worker: apka dziala bez internetu, ale poprawki widac od razu.
   Strategia: najpierw siec, cache jako zapas. Wazne przy testowaniu na goraco —
   inaczej telefon pokazywalby stara wersje az do wyczyszczenia danych. */
const CACHE = 'ogarniacz-v3';
const PLIKI = ['./', './index.html', './styles.css', './app.js', './parser.js', './push.js', './manifest.json', './icon.png'];

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

/* ---------- prawdziwe powiadomienia (web push) ----------
   Serwer budzi telefon o umowionej minucie, nawet gdy apka jest zamknieta. */
self.addEventListener('push', e => {
  let dane = { tytul: 'Ogarniacz', tresc: '' };
  try { if (e.data) dane = Object.assign(dane, e.data.json()); } catch (err) {}
  e.waitUntil(
    self.registration.showNotification(dane.tytul, {
      body: dane.tresc,
      icon: './icon.png',
      badge: './icon.png',
      tag: dane.znacznik || 'ogarniacz',
      renotify: true,
      data: { url: './' }
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(lista => {
      for (const k of lista){ if ('focus' in k) return k.focus(); }
      if (self.clients.openWindow) return self.clients.openWindow('./');
    })
  );
});
