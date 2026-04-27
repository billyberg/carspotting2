self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title ?? "Carspotting";
  const options = {
    body: data.body ?? "",
    icon: "/icon.svg",
    badge: "/icon.svg",
    data: { url: "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if ("focus" in client) return client.focus();
        }
        if (clients.openWindow) return clients.openWindow(url);
      }),
  );
});
