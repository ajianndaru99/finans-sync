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
      // Gunakan signInWithOAuth dengan prompt: 'select_account' agar Google
      // menampilkan pemilih akun. Ini PASTI mengembalikan provider_token & 
      // provider_refresh_token yang valid di callback — berbeda dengan linkIdentity
      // yang tidak mengembalikan token untuk penggunaan offline (webhook).
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/gmail.readonly email profile',
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            // Paksa tampil pemilih akun Google (tidak auto-select)
            prompt: 'select_account consent',
            // Wajib untuk mendapatkan refresh_token setiap kali
            access_type: 'offline',
          },
        }
      })
      if (error) throw error
      // Redirect akan terjadi otomatis oleh Supabase
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
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        {isLoading ? 'Mengalihkan ke Google...' : '+ Tambah Akun Gmail'}
      </button>
      {errorMsg && <p className="text-red-400 text-xs mt-2">{errorMsg}</p>}
      <p className="text-gray-500 text-xs mt-2 leading-relaxed">
        Anda akan diarahkan ke Google untuk memilih akun Gmail. Setelah selesai, Anda akan kembali ke halaman ini secara otomatis.
      </p>
    </div>
  )
}
