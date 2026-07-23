'use client'

import { useState, useEffect } from 'react'
import { enableGmailWatch } from '@/app/lib/actions/gmailActions'

export default function AutoSyncManager() {
  const [status, setStatus] = useState<'syncing' | 'active' | 'error'>('syncing')

  useEffect(() => {
    // Jalankan secara diam-diam (silent) saat komponen di-mount
    const initSync = async () => {
      try {
        const result = await enableGmailWatch()
        if (result.error) {
          setStatus('error')
        } else {
          setStatus('active')
        }
      } catch (e) {
        setStatus('error')
      }
    }
    
    initSync()
  }, [])

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
          <span className="text-red-400">Sync Gagal</span>
        </>
      )}
    </div>
  )
}
