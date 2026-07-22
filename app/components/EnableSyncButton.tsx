'use client'

import { useState } from 'react'
import { enableGmailWatch } from '@/app/lib/actions/gmailActions'

export default function EnableSyncButton() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleEnable = async () => {
    setLoading(true)
    setMessage('')
    try {
      const result = await enableGmailWatch()
      if (result.error) {
        setMessage(result.error)
      } else {
        setMessage('Auto-Sync enabled successfully!')
      }
    } catch (e: any) {
      setMessage(e.message || 'Error connecting to Google')
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-3">
      <button 
        onClick={handleEnable}
        disabled={loading}
        className="px-6 py-2.5 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 font-medium transition-colors disabled:opacity-50"
      >
        {loading ? 'Connecting...' : 'Enable Auto-Sync'}
      </button>
      {message && <span className="text-sm text-gray-400">{message}</span>}
    </div>
  )
}
