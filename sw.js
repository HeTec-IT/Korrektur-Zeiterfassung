// HeTec 2026.09.28-3: Online-Betrieb, keine zwischengespeicherten Formulare.
const VERSION = '2026.09.28-3';
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('zeitkorrektur-')).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if(request.method !== 'GET' || url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  event.respondWith(fetch(request, {cache:'no-store'}).catch(() => {
    if(request.mode !== 'navigate') return new Response('Internetverbindung erforderlich.', {status:503});
    return new Response('<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Keine Verbindung</title><body style="font:18px system-ui;padding:30px"><h1>Keine Internetverbindung</h1><p>Bitte Verbindung herstellen und diese Seite erneut laden. Das Formular benötigt eine Internetverbindung.</p><button onclick="location.reload()">Erneut versuchen</button></body></html>', {status:503,headers:{'Content-Type':'text/html; charset=utf-8'}});
  }));
});
