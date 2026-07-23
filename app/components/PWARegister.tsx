"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", async () => {
        try {
          const registration = await navigator.serviceWorker.register("/sw.js");
          console.log("Service Worker registered, scope:", registration.scope);

          // Minta izin push notification
          if ("PushManager" in window && "Notification" in window) {
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
              const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
              if (vapidKey) {
                const sub = await registration.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: urlBase64ToUint8Array(vapidKey),
                });
                // Kirim subscription ke server
                await fetch("/api/push-subscription", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(sub),
                });
                console.log("Push subscription saved.");
              }
            }
          }
        } catch (err) {
          console.log("Service Worker registration failed:", err);
        }
      });
    }
  }, []);

  return null;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
