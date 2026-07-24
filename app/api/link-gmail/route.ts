import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { google } from 'googleapis'

/**
 * GET /api/link-gmail
 * 
 * Menginisiasi Google OAuth flow TERPISAH dari Supabase Auth.
 * Tujuan: mendapatkan Gmail token untuk akun sekunder tanpa mengubah sesi user.
 * 
 * Flow:
 * 1. User klik "+ Tambah Akun Gmail" di Settings
 * 2. Client redirect ke /api/link-gmail (route ini)
 * 3. Route ini generate Google OAuth URL dengan redirect_uri ke /api/link-gmail/callback
 * 4. User pilih Gmail sekunder di Google
 * 5. Google redirect ke /api/link-gmail/callback
 * 6. Callback simpan token di user_oauth_tokens dengan user_id ASLI (tidak berubah)
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Hanya user yang sudah login yang bisa menambah Gmail
  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Tentukan origin yang benar (produksi vs development)
  const forwardedHost = req.headers.get('x-forwarded-host')
  const origin = forwardedHost ? `https://${forwardedHost}` : new URL(req.url).origin
  const redirectUri = `${origin}/api/link-gmail/callback`

  const oauth2Client = new google.auth.OAuth2(
    process.env.GCP_CLIENT_ID,
    process.env.GCP_CLIENT_SECRET,
    redirectUri
  )

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',      // Wajib agar dapat refresh_token
    prompt: 'select_account consent', // Paksa tampil pemilih akun + minta ulang consent
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'email',
      'profile'
    ]
  })

  return NextResponse.redirect(authUrl)
}
