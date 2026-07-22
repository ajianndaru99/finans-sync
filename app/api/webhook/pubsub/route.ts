import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GenericBankParser } from '@/app/lib/utils/bankParser'
import { google } from 'googleapis'

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()

    // Extract Base64 encoded message from Pub/Sub
    if (!payload.message || !payload.message.data) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const decodedData = Buffer.from(payload.message.data, 'base64').toString('utf-8')
    const notification = JSON.parse(decodedData)

    const emailAddress = notification.emailAddress
    const newHistoryId = notification.historyId

    // Gunakan Service Role Key untuk bypass RLS pada background job / webhook
    const dbClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Ambil data user & token dari database
    const { data: userRecords, error: userError } = await dbClient
      .from('user_oauth_tokens')
      .select('*')
      .eq('email_address', emailAddress)

    if (userError || !userRecords || userRecords.length === 0) {
      return NextResponse.json({ status: 'ignored' }, { status: 200 })
    }

    const userData = userRecords[0]
    const oldHistoryId = userData.history_id
    const userId = userData.user_id

    // 2. Setup OAuth2 Client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GCP_CLIENT_ID,
      process.env.GCP_CLIENT_SECRET
    )

    oauth2Client.setCredentials({
      access_token: userData.encrypted_access_token,
      refresh_token: userData.encrypted_refresh_token
    })

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

    // 3. Ambil daftar pesan baru dari Gmail History
    const newMessages: string[] = []
    try {
      const historyResp = await gmail.users.history.list({
        userId: 'me',
        startHistoryId: oldHistoryId,
      })

      if (historyResp.data.history) {
        for (const h of historyResp.data.history) {
          if (h.messagesAdded) {
            for (const m of h.messagesAdded) {
              if (m.message && m.message.id) newMessages.push(m.message.id)
            }
          }
        }
      }
    } catch (historyError: any) {
      console.error('Gmail History Error:', historyError.message)
      return NextResponse.json({ error: 'Gmail history fetch failed' }, { status: 500 })
    }

    const parser = new GenericBankParser()

    // 4. Proses setiap pesan baru
    for (const msgId of newMessages) {
      try {
        // Baca konten email asli dari Gmail API
        const msgResp = await gmail.users.messages.get({
          userId: 'me',
          id: msgId,
          format: 'full'
        })

        // Ekstrak email pengirim dari header
        const headers = msgResp.data.payload?.headers || []
        const fromHeader = headers.find((h: any) => h.name?.toLowerCase() === 'from')
        const senderEmail = fromHeader?.value || ''

        // Ekstrak HTML/text body dari payload secara rekursif
        const extractBody = (part: any): string => {
          if (!part) return ''
          if (part.mimeType === 'text/html' && part.body?.data) {
            return Buffer.from(part.body.data, 'base64').toString('utf-8')
          }
          if (part.mimeType === 'text/plain' && part.body?.data) {
            return Buffer.from(part.body.data, 'base64').toString('utf-8')
          }
          if (part.parts) {
            for (const subPart of part.parts) {
              const result = extractBody(subPart)
              if (result) return result
            }
          }
          return ''
        }

        const htmlBody = extractBody(msgResp.data.payload)

        if (!htmlBody) {
          console.log(`Skipping message ${msgId}: no body found`)
          continue
        }

        // 5. Parse menggunakan parser bank sungguhan
        let parsed
        try {
          parsed = parser.parse(htmlBody, senderEmail)
        } catch (parseErr: any) {
          console.log(`Skipping message ${msgId}: ${parseErr.message}`)
          continue // Bukan email notifikasi bank, lewati
        }

        const provider = `GMAIL_${parsed.bank.toUpperCase()}`

        // 6. Cari akun yang terhubung (dengan fallback ke akun apapun)
        const { data: accountsData } = await dbClient
          .from('account_integrations')
          .select('account_id')
          .eq('email_address', emailAddress)
          .eq('provider', provider)
          .maybeSingle()

        let accountId = accountsData?.account_id

        if (!accountId) {
          // Fallback: gunakan akun pertama yang terhubung dengan email ini
          const { data: anyAccount } = await dbClient
            .from('account_integrations')
            .select('account_id')
            .eq('email_address', emailAddress)
            .limit(1)
            .maybeSingle()
          accountId = anyAccount?.account_id
        }

        if (!accountId) {
          console.log(`No account integration found for ${emailAddress}`)
          continue
        }

        // 7. Insert transaksi dengan idempotency key
        const idempotencyKey = `gmail:${emailAddress}:${msgId}:0`

        const { error: insertError } = await dbClient
          .from('transactions')
          .insert({
            user_id: userId,
            account_id: accountId,
            amount: parsed.amount,
            type: parsed.type,
            description: `[${parsed.bank}] ${parsed.description}`,
            idempotency_key: idempotencyKey
          })

        if (insertError) {
          console.log('Ignored duplicate or insert error:', insertError.message)
        } else {
          console.log(`✅ Inserted: ${parsed.bank} ${parsed.type} Rp${parsed.amount}`)
        }

      } catch (e: any) {
        console.log('Error processing message:', e.message)
      }
    }

    // 8. Update history ID secara atomik
    if (newHistoryId && newHistoryId !== oldHistoryId) {
      await dbClient
        .from('user_oauth_tokens')
        .update({ history_id: newHistoryId })
        .eq('user_id', userId)
        .eq('history_id', oldHistoryId)
    }

    return NextResponse.json({ status: 'success', processed: newMessages.length })
  } catch (error: any) {
    console.error('Webhook Error:', error.message)
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
  }
}
