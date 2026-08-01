self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (err) {
    data = { title: 'Forjanova', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'Forjanova';
  const options = {
    body: data.body || '',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: data.data || {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const solicitudId = event.notification.data?.solicitud_id;
  const targetPath = solicitudId ? `/?solicitud=${solicitudId}` : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsList) => {
      for (const client of clientsList) {
        if ('focus' in client) {
          client.navigate(targetPath).catch(() => {});
          return client.focus();
        }
      }
      return clients.openWindow(targetPath);
    })
  );
});
