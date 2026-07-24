'use client'

import { useState, useEffect, useRef } from 'react'
import { enableGmailWatch } from '@/app/lib/actions/gmailActions'

// Key di sessionStorage agar Watch tidak dipanggil berulang selama 1 sesi browsing
// Gmail Watch berlaku 7 hari. Memanggil setiap page load boros dan lambat di HP.
const SYNC_STATUS_KEY = 'ajian_sync_status'
const SYNC_TIMESTAMP_KEY = 'ajian_sync_ts'
// Panggil ulang maksimal setiap 60 menit (dalam milidetik)
const SYNC_INTERVAL_MS = 60 * 60 * 1000

export default function AutoSyncManager() {
  const [status, setStatus] = useState<'idle' | 'syncing' | 'active' | 'error'>('idle')
  const hasInitialized = useRef(false)

  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true

    const initSync = async () => {
      // Cek apakah sudah sync recently (pakai sessionStorage)
      try {
        const cachedStatus = sessionStorage.getItem(SYNC_STATUS_KEY)
        const cachedTs = sessionStorage.getItem(SYNC_TIMESTAMP_KEY)
        const now = Date.now()

        if (cachedStatus === 'active' && cachedTs && (now - parseInt(cachedTs)) < SYNC_INTERVAL_MS) {
          // Sudah sync baru-baru ini, langsung tampilkan status aktif tanpa memanggil server
          setStatus('active')
          return
        }
      } catch {
        // sessionStorage tidak tersedia (private browsing tertentu), lanjutkan normal
      }

      setStatus('syncing')
      try {
        const result = await enableGmailWatch()
        if (result.error) {
          setStatus('error')
          try { sessionStorage.removeItem(SYNC_STATUS_KEY) } catch {}
        } else {
          setStatus('active')
          try {
            sessionStorage.setItem(SYNC_STATUS_KEY, 'active')
            sessionStorage.setItem(SYNC_TIMESTAMP_KEY, Date.now().toString())
          } catch {}
        }
      } catch {
        setStatus('error')
      }
    }

    // Tunda 2 detik agar tidak memblokir render awal dashboard di HP
    const timer = setTimeout(initSync, 2000)
    return () => clearTimeout(timer)
  }, [])

  if (status === 'idle') return null

  return (
    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium">
      {status === 'syncing' && (
        <>
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
          <span className="text-gray-400">Menyiapkan Sync...</span>
        </>
      )}
      {status === 'active' && (
        <>
          <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
          <span className="text-primary">Auto-Sync Aktif</span>
        </>
      )}
      {status === 'error' && (
        <>
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <span className="text-red-400">Belum Ada Email</span>
        </>
      )}
    </div>
  )
}
