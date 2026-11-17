// Caderno EF — service worker: funciona sem internet.
const VERSAO = 'caderno-ef-v5';
// Bibliotecas externas guardadas logo à instalação, para funcionar sem internet desde o primeiro dia.
const LIBS = ['https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js'];
const BASE = ['./', './index.html', './manifest.webmanifest', './icons/icon-192-v2.png', './icons/icon-512-v2.png', './icons/apple-touch-icon-v2.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(BASE).then(() => Promise.all(LIBS.map(u => c.add(new Request(u, {mode: 'no-cors'})).catch(() => {})))).then(() => self.skipWaiting())));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // Página: tenta a rede primeiro (para receber atualizações), senão usa a cópia guardada.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(VERSAO).then(ca => ca.put('./index.html', c)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // Resto (ícones, tipos de letra, biblioteca do Excel): cópia guardada primeiro.
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r && (r.ok || r.type === 'opaque')) { const c = r.clone(); caches.open(VERSAO).then(ca => ca.put(req, c)); }
    return r;
  })));
});
// Lembretes: tocar na notificação abre (ou traz para a frente) o caderno.
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type: 'window', includeUncontrolled: true}).then(cs => {
    const c = cs.find(x => 'focus' in x); return c ? c.focus() : self.clients.openWindow('./');
  }));
});
