// Service worker: hiện thông báo đẩy của hệ điều hành và mở đúng trang khi bấm vào.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || "NEU Debate Club", {
      body: data.body,
      icon: "/icon-192.png",
      data: { url: data.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(
    (async () => {
      const [client] = await self.clients.matchAll({ type: "window" });
      if (!client) return self.clients.openWindow(url);
      await client.focus();
      return client.navigate(url);
    })(),
  );
});
