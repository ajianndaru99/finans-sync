"use client"

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function LinkAccountButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleLink = async () => {
    setIsLoading(true)
    setErrorMsg('')
    const supabase = createClient()
    
    try {
      const { data, error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/gmail.readonly email profile',
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/settings`
        }
      })
      if (error) throw error
    } catch (e: any) {
      console.error(e)
      setErrorMsg(e.message || 'Gagal menambahkan akun Google')
      setIsLoading(false)
    }
  }

  return (
    <div>
      <button 
        onClick={handleLink}
        disabled={isLoading}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-purple-500/20 active:scale-95"
      >
        {isLoading ? 'Mengalihkan...' : '+ Tambah Akun Gmail'}
      </button>
      {errorMsg && <p className="text-red-400 text-xs mt-2">{errorMsg}</p>}
    </div>
  )
}
