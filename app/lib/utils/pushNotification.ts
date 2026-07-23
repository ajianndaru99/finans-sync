// Utility: Kirim push notification ke semua device user
// Dipanggil dari webhook setelah insert transaksi berhasil
import webpush from 'web-push'
import { SupabaseClient } from '@supabase/supabase-js'

webpush.setVapidDetails(
  'mailto:contact@finans-sync.app',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function sendPushNotification(
  dbClient: SupabaseClient,
  userId: string,
  payload: {
    title: string
    body: string
    icon?: string
  }
) {
  try {
    const { data: subscriptions } = await dbClient
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userId)

    if (!subscriptions || subscriptions.length === 0) return

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: 'finans-sync-transaction',
      renotify: true,
      data: { url: '/dashboard' }
    })

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(JSON.parse(sub.subscription), notificationPayload)
      )
    )

    // Bersihkan subscription yang sudah expired/invalid
    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      if (result.status === 'rejected' && result.reason?.statusCode === 410) {
        const sub = JSON.parse(subscriptions[i].subscription)
        await dbClient
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', sub.endpoint)
      }
    }
  } catch (err) {
    console.error('Push notification error:', err)
  }
}
