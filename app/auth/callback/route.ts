import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { encrypt } from '@/app/lib/utils/crypto'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()

    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      // Save Google tokens for offline webhook usage
      const { provider_token, provider_refresh_token, user } = data.session

      // Jika provider_token tidak ada, OAuth flow tidak berjalan dengan benar.
      // Ini bisa terjadi jika alur bukan dari signInWithOAuth (misal: magic link).
      // Kita lewati penyimpanan token agar tidak menyimpan token tidak valid.
      if (!provider_token) {
        console.warn('[callback] provider_token tidak tersedia. Mungkin bukan alur OAuth Google. Melewati penyimpanan token.')
      } else {
        // Ambil email dari Google userinfo API untuk akurasi (penting untuk multi-akun:
        // user.email mungkin email akun utama, bukan akun Gmail yang baru saja dipilih)
        let tokenEmail = user.email ?? ''
        try {
          const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${provider_token}` }
          })
          if (userInfoRes.ok) {
            const userInfo = await userInfoRes.json()
            if (userInfo.email) tokenEmail = userInfo.email
          }
        } catch (e) {
          console.error('[callback] Gagal fetch Google userinfo:', e)
        }

        if (!tokenEmail) {
          console.error('[callback] Tidak dapat menentukan email untuk token. Melewati upsert.')
        } else {
          // Upsert dengan composite key (user_id, email_address)
          // Ini memungkinkan satu user memiliki BANYAK baris (satu per Gmail)
          const { error: upsertError } = await supabase
            .from('user_oauth_tokens')
            .upsert({
              user_id: user.id,
              email_address: tokenEmail,
              encrypted_access_token: encrypt(provider_token),
              encrypted_refresh_token: encrypt(provider_refresh_token || ''),
              history_id: '0'
            }, { onConflict: 'user_id,email_address' })

          if (upsertError) {
            console.error('[callback] Upsert Error:', upsertError.message, upsertError.details)
          } else {
            console.log(`[callback] Token tersimpan untuk: ${tokenEmail}`)
          }
        }
      }

      // Redirect ke halaman yang diminta atau dashboard
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`)
}
