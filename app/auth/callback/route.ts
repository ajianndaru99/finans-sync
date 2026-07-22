import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

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

      // Upsert tokens regardless of whether provider_token is present yet, so we know if it reached here
      const { error: upsertError } = await supabase
        .from('user_oauth_tokens')
        .upsert({
          user_id: user.id,
          email_address: user.email,
          encrypted_access_token: provider_token || 'MISSING_PROVIDER_TOKEN',
          encrypted_refresh_token: provider_refresh_token || '',
          history_id: '0'
        }, { onConflict: 'user_id' })

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
