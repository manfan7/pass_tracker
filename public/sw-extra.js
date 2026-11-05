// Дополнительные обработчики для service worker (подключается через
// workbox.importScripts в vite.config.js). Здесь то, что нельзя сделать
// из страницы: реакция на нажатие уведомления.
self.addEventListener('notificationclick', (event) => {
  const n = event.notification;
  n.close();
  const target = (n.data && n.data.url) || self.registration.scope;
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clients) {
        if (client.url === target || client.url.startsWith(target)) {
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    })()
  );
});
