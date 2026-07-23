import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import webpush from 'web-push'

webpush.setVapidDetails(
  'mailto:contact@finans-sync.app',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

// POST: Simpan subscription dari browser
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const subscription = await req.json()

  // Simpan ke tabel push_subscriptions di Supabase
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: user.id,
      endpoint: subscription.endpoint,
      subscription: JSON.stringify(subscription)
    }, { onConflict: 'endpoint' })

  if (error) {
    console.error('Error saving subscription:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// DELETE: Hapus subscription
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { endpoint } = await req.json()

  await supabase
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint)
    .eq('user_id', user.id)

  return NextResponse.json({ success: true })
}
