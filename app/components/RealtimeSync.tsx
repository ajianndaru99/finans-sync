'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function RealtimeSync() {
  const router = useRouter()

  useEffect(() => {
    // 1. Auto-refresh saat tab browser dibuka kembali di HP (visibilitychange)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        router.refresh()
      }
    }

    // 2. Auto-refresh saat window fokus
    const handleFocus = () => {
      router.refresh()
    }

    window.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    // 3. Supabase Realtime Listener (untuk transaksi & akun baru dari PubSub Webhook)
    const supabase = createClient()
    
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        () => {
          console.log('[RealtimeSync] Transaksi berubah, memperbarui tampilan...')
          router.refresh()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'accounts' },
        () => {
          console.log('[RealtimeSync] Akun berubah, memperbarui tampilan...')
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      supabase.removeChannel(channel)
    }
  }, [router])

  return null
}
