import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { google } from 'googleapis'
import { encrypt } from '@/app/lib/utils/crypto'

/**
 * GET /api/link-gmail/callback
 * 
 * Menerima code dari Google OAuth, menukar dengan token, lalu menyimpan
 * di user_oauth_tokens dengan user_id ASLI (sesi Supabase tidak berubah).
 * 
 * KUNCI: Karena kita TIDAK memanggil exchangeCodeForSession, sesi Supabase
 * tetap milik user yang sudah login (User A). Kita bisa simpan token Gmail
 * sekunder (gmail-b) dengan user_id = User A.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const oauthError = searchParams.get('error')

  const forwardedHost = req.headers.get('x-forwarded-host')
  const origin = forwardedHost ? `https://${forwardedHost}` : new URL(req.url).origin
  const redirectUri = `${origin}/api/link-gmail/callback`

  // User membatalkan di Google
  if (oauthError === 'access_denied') {
    return NextResponse.redirect(`${origin}/dashboard/settings?link_error=dibatalkan`)
  }

  if (!code) {
    console.error('[link-gmail/callback] Tidak ada code dari Google')
    return NextResponse.redirect(`${origin}/dashboard/settings?link_error=tidak_ada_code`)
  }

  // Baca sesi Supabase yang MASIH AKTIF (user asli, tidak berubah!)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Sesi expired, perlu login ulang
    return NextResponse.redirect(`${origin}/login`)
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GCP_CLIENT_ID,
    process.env.GCP_CLIENT_SECRET,
    redirectUri
  )

  try {
    // Tukar code dengan token Google (ini murni Google API, tidak melalui Supabase)
    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.access_token) {
      console.error('[link-gmail/callback] Google tidak mengembalikan access_token')
      return NextResponse.redirect(`${origin}/dashboard/settings?link_error=token_kosong`)
    }

    // Ambil email akun Gmail yang baru saja di-link
    oauth2Client.setCredentials(tokens)
    const oauth2Api = google.oauth2({ version: 'v2', auth: oauth2Client })
    const { data: googleUser } = await oauth2Api.userinfo.get()
    const emailAddress = googleUser.email

    if (!emailAddress) {
      console.error('[link-gmail/callback] Tidak dapat membaca email dari Google')
      return NextResponse.redirect(`${origin}/dashboard/settings?link_error=email_tidak_ada`)
    }

    // Simpan token Gmail sekunder dengan user_id ASLI (bukan user Gmail sekunder!)
    // Ini adalah inti dari multi-akun: semua token di bawah satu user Supabase
    const { error: upsertError } = await supabase
      .from('user_oauth_tokens')
      .upsert({
        user_id: user.id,
        email_address: emailAddress,
        encrypted_access_token: encrypt(tokens.access_token),
        encrypted_refresh_token: encrypt(tokens.refresh_token || ''),
        history_id: '0'
      }, { onConflict: 'user_id,email_address' })

    if (upsertError) {
      console.error('[link-gmail/callback] Gagal menyimpan token:', upsertError.message)
      // Kemungkinan tabel belum ada atau constraint salah
      return NextResponse.redirect(
        `${origin}/dashboard/settings?link_error=gagal_simpan&detail=${encodeURIComponent(upsertError.message)}`
      )
    }

    console.log(`[link-gmail/callback] ✅ Berhasil: ${emailAddress} → user ${user.id}`)
    return NextResponse.redirect(
      `${origin}/dashboard/settings?linked=${encodeURIComponent(emailAddress)}`
    )

  } catch (err: any) {
    console.error('[link-gmail/callback] Error:', err.message)
    return NextResponse.redirect(
      `${origin}/dashboard/settings?link_error=gagal&detail=${encodeURIComponent(err.message)}`
    )
  }
}
