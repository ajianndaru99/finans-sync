"use client";

import { useEffect } from "react";

// Konversi VAPID public key dari Base64URL ke Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Simpan subscription ke server
async function saveSubscription(subscription: PushSubscription) {
  const res = await fetch("/api/push-subscription", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Gagal menyimpan subscription");
  }
}

// Setup push notification setelah SW aktif
async function setupPushNotification(registration: ServiceWorkerRegistration) {
  if (!("PushManager" in window) || !("Notification" in window)) return;

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) {
    console.warn("[PWA] NEXT_PUBLIC_VAPID_PUBLIC_KEY tidak disetel.");
    return;
  }

  // Cek jika sudah berlangganan (jangan minta izin berulang)
  const existingSub = await registration.pushManager.getSubscription();
  if (existingSub) {
    // Sudah subscribe, pastikan server tahu (upsert idempoten)
    await saveSubscription(existingSub).catch(() => {});
    return;
  }

  // Minta izin hanya jika belum pernah
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.log("[PWA] Izin notifikasi ditolak.");
    return;
  }

  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });
    await saveSubscription(subscription);
    console.log("[PWA] Push subscription berhasil disimpan.");
  } catch (err) {
    console.warn("[PWA] Gagal subscribe push:", err);
  }
}

export default function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Gunakan requestIdleCallback jika tersedia (prioritas rendah = tidak blokir UI HP)
    // Fallback ke setTimeout 3 detik agar render dashboard selesai dulu
    const register = async () => {
      try {
        // Daftarkan SW — versi di query string memastikan SW baru terinstall saat ada update
        const registration = await navigator.serviceWorker.register("/sw.js?v=4");
        console.log("[PWA] Service Worker registered, scope:", registration.scope);

        // Tunggu SW aktif sebelum setup push notification
        if (registration.installing) {
          registration.installing.addEventListener("statechange", async (e) => {
            const sw = e.target as ServiceWorker;
            if (sw.state === "activated") {
              await setupPushNotification(registration);
            }
          });
        } else if (registration.active) {
          await setupPushNotification(registration);
        }
      } catch (err) {
        console.warn("[PWA] Service Worker registration failed:", err);
      }
    };

    // Defer: jalankan saat browser idle atau setelah 3 detik
    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(register, { timeout: 3000 });
    } else {
      const timer = setTimeout(register, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  return null;
}
