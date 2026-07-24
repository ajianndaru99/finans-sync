// ================================================================
// Service Worker - Ajian Family Finance
// Strategi: Stale-While-Revalidate untuk performa HP yang optimal
// Versi cache dinaikkan setiap ada perubahan signifikan
// ================================================================

const CACHE_VERSION = 'v20'
const STATIC_CACHE = `ajian-static-${CACHE_VERSION}`
const DYNAMIC_CACHE = `ajian-dynamic-${CACHE_VERSION}`
const ALL_CACHES = [STATIC_CACHE, DYNAMIC_CACHE]

// Asset statis yang di-precache saat install (wajib ada offline)
const PRECACHE_URLS = [
  '/',
  '/manifest.json?v=20',
  '/icon-192x192.png?v=20',
  '/icon-512x512.png?v=20',
]

// ─────────────────────────────────────────────────────────────
// INSTALL: Precache asset statis
// ─────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[SW] Precache partial failure:', err)
      })
    })
  )
  self.skipWaiting()
})

// ─────────────────────────────────────────────────────────────
// ACTIVATE: Hapus SELURUH cache lama secara agresif
// ─────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((k) => {
          if (!ALL_CACHES.includes(k)) {
            console.log('[SW] Menghapus cache lama:', k)
            return caches.delete(k)
          }
        })
      )
    )
  )
  self.clients.claim()
})

// ─────────────────────────────────────────────────────────────
// FETCH: Strategi caching berdasarkan tipe request
// ─────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Hanya tangani GET
  if (request.method !== 'GET') return

  // Jangan cache: API calls, Supabase, Google APIs, auth routes
  const skipPatterns = [
    '/api/',
    'supabase.co',
    'googleapis.com',
    '/auth/',
    '__nextjs',
    '_next/data',
    'hot-update',
  ]
  if (skipPatterns.some((p) => request.url.includes(p))) return

  // _next/static: Cache First (asset statis JS/CSS tidak berubah, hash di URL)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone))
          }
          return response
        })
      })
    )
    return
  }

  // Halaman HTML & navigasi: Network-First (Dapatkan data SEGAR dari database!)
  // Hanya gunakan cache jika perangkat dalam keadaan OFFLINE (tanpa sinyal).
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(() => caches.match(request)) // Fallback ke cache HANYA jika offline
    )
    return
  }

  // Resource lain (fonts, icons): Cache First dengan fallback network
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone))
        }
        return response
      }).catch(() => cached)
    })
  )
})

// ─────────────────────────────────────────────────────────────
// PUSH NOTIFICATION: Tampilkan notifikasi transaksi
// ─────────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return

  let data
  try {
    data = event.data.json()
  } catch {
    data = { title: 'Ajian Family', body: event.data.text() }
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Ajian Family', {
      body: data.body || '',
      icon: data.icon || '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: data.tag || 'ajian-transaction',
      renotify: true,
      // Vibrate: pola singkat-panjang-singkat untuk transaksi
      vibrate: [100, 50, 100],
      // Tampilkan timestamp di notifikasi
      timestamp: Date.now(),
      data: {
        url: data.data?.url || '/dashboard',
        ...data.data,
      },
    })
  )
})

// ─────────────────────────────────────────────────────────────
// NOTIFICATION CLICK: Buka dashboard saat notifikasi diklik
// ─────────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Fokus tab yang sudah buka aplikasi
        for (const client of clientList) {
          if (client.url.includes(targetUrl) && 'focus' in client) {
            return client.focus()
          }
        }
        // Jika tidak ada tab aktif, buka tab baru
        if (clients.openWindow) {
          return clients.openWindow(targetUrl)
        }
      })
  )
})

// ─────────────────────────────────────────────────────────────
// PUSH SUBSCRIPTION CHANGE: Handle rotasi kunci VAPID otomatis
// ─────────────────────────────────────────────────────────────
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager
      .subscribe({ userVisibleOnly: true })
      .then((subscription) => {
        return fetch('/api/push-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription),
        })
      })
      .catch((err) => console.warn('[SW] pushsubscriptionchange failed:', err))
  )
})
