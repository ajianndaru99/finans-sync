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

      // Default to user.email, but try to fetch the actual email from the Google token
      // This is crucial for multi-email linking (where the primary user.email doesn't match the new token's email)
      let tokenEmail = user.email
      if (provider_token) {
        try {
          const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${provider_token}` }
          })
          if (userInfoRes.ok) {
            const userInfo = await userInfoRes.json()
            if (userInfo.email) {
              tokenEmail = userInfo.email
            }
          }
        } catch (e) {
          console.error('Failed to fetch userinfo for token email', e)
        }
      }

      // Upsert tokens. We use user_id + email_address as the unique key now (after the SQL migration)
      const { error: upsertError } = await supabase
        .from('user_oauth_tokens')
        .upsert({
          user_id: user.id,
          email_address: tokenEmail,
          encrypted_access_token: encrypt(provider_token || 'MISSING_PROVIDER_TOKEN'),
          encrypted_refresh_token: encrypt(provider_refresh_token || ''),
          history_id: '0'
        }, { onConflict: 'user_id,email_address' })

      if (upsertError) {
        console.error('Upsert Error:', upsertError)
      }

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
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
