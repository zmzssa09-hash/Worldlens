// WorldLens 서비스 워커: 앱처럼 설치 + 인터넷이 끊겼을 때 마지막으로 본 화면 보여 주기
// 원칙: 항상 인터넷에서 새 것을 먼저 받음(뉴스가 낡아 보이면 안 되니까). 받기에 실패했을 때만 저장해 둔 것을 씀
const CACHE = 'worldlens-v1';
const SHELL = ['/', '/event', '/archive', '/about', '/styles.css', '/app.js', '/i18n.js', '/i18n-extra.js', '/about-content.js', '/policy-content.js', '/icon-192.png'];

self.addEventListener('install', (ev) => {
  ev.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (ev) => {
  ev.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (ev) => {
  const req = ev.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return; // 글꼴 등 바깥 파일은 브라우저에 맡김
  ev.respondWith((async () => {
    try {
      const res = await fetch(req, { cache: 'no-cache' });
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {}); }
      return res;
    } catch {
      const c = await caches.open(CACHE);
      return (await c.match(req)) || (await c.match(req, { ignoreSearch: true })) || (req.mode === 'navigate' && (await c.match('/'))) || Response.error();
    }
  })());
});
