// ReWear service worker — handles incoming web-push notifications.
// Kept minimal: no offline caching, no fetch interception. Just push.

self.addEventListener("install", (event) => {
  // Take control immediately on first install so notifications start working
  // without a refresh.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  // Each push from our server includes JSON: { title, body, url?, tag? }
  let payload = { title: "ReWear", body: "Something's up." };
  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload = { title: "ReWear", body: event.data.text() };
    }
  }

  const options = {
    body: payload.body,
    icon: "/rewear-logo.png",
    badge: "/rewear-logo.png",
    tag: payload.tag || undefined,
    data: { url: payload.url || "/" },
    // Don't notify silently — we want the user to see it.
    silent: false,
    // Vibration pattern for Android
    vibrate: [80, 40, 80],
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl =
    (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // If a ReWear tab is already open, focus it and navigate
        for (const client of clients) {
          if ("focus" in client && client.url.includes(self.location.origin)) {
            client.focus();
            if ("navigate" in client) {
              return client.navigate(targetUrl);
            }
            return;
          }
        }
        // Otherwise open a fresh tab
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
