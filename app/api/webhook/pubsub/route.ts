import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GenericBankParser } from '@/app/lib/utils/bankParser'
import { google } from 'googleapis'
import { decrypt } from '@/app/lib/utils/crypto'
import { sendPushNotification } from '@/app/lib/utils/pushNotification'

export async function POST(req: NextRequest) {
  try {
    // 0. Verifikasi Secret Token
    const urlToken = req.nextUrl.searchParams.get('token')
    const expectedToken = process.env.PUBSUB_SECRET
    
    if (!expectedToken || urlToken !== expectedToken) {
      console.warn('Unauthorized Pub/Sub webhook access attempt.')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

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

    // 2. Setup OAuth2 Client dengan token terenkripsi
    const oauth2Client = new google.auth.OAuth2(
      process.env.GCP_CLIENT_ID,
      process.env.GCP_CLIENT_SECRET
    )

    const accessToken = decrypt(userData.encrypted_access_token)
    const refreshToken = decrypt(userData.encrypted_refresh_token)

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    })

    // Auto-refresh token jika expired
    oauth2Client.on('tokens', async (tokens) => {
      if (tokens.access_token) {
        const { encrypt } = await import('@/app/lib/utils/crypto')
        await dbClient
          .from('user_oauth_tokens')
          .update({ 
            encrypted_access_token: encrypt(tokens.access_token),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
        console.log('✅ Access token refreshed and saved.')
      }
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
          // Cari akun yang namanya mengandung nama bank (misal: "Bank Jago" mengandung "Jago")
          const { data: matchedAccount } = await dbClient
            .from('accounts')
            .select('id')
            .eq('user_id', userId)
            .ilike('name', `%${parsed.bank}%`)
            .limit(1)
            .maybeSingle()

          if (matchedAccount?.id) {
            accountId = matchedAccount.id
          } else {
            // Jika akun benar-benar belum ada, buat otomatis
            const { data: newAccount } = await dbClient
              .from('accounts')
              .insert({
                user_id: userId,
                name: parsed.bank,
                type: 'BANK',
                current_balance: 0
              })
              .select('id')
              .single()
              
            accountId = newAccount?.id
          }

          // Simpan integrasi agar email selanjutnya lebih cepat diproses
          if (accountId) {
            await dbClient.from('account_integrations').insert({
              account_id: accountId,
              email_address: emailAddress,
              provider: provider
            })
          }
        }

        if (!accountId) {
          console.log(`No account integration found for ${emailAddress}`)
          continue
        }

        // 7. Cek apakah ini cicilan (berdasarkan deskripsi)
        let categoryId = null;
        const lowerDesc = parsed.description.toLowerCase();
        if (parsed.type === 'DEBIT' && (lowerDesc.includes('cicilan') || lowerDesc.includes('paylater') || lowerDesc.includes('kredit') || lowerDesc.includes('tagihan'))) {
          // Cari kategori "Cicilan"
          const { data: cicilanCat } = await dbClient
            .from('categories')
            .select('id')
            .eq('user_id', userId)
            .eq('type', 'INSTALLMENT')
            .limit(1)
            .maybeSingle();

          if (cicilanCat?.id) {
            categoryId = cicilanCat.id;
          } else {
            // Buat kategori cicilan jika belum ada
            const { data: newCat } = await dbClient
              .from('categories')
              .insert({
                user_id: userId,
                name: 'Cicilan / Paylater',
                type: 'INSTALLMENT'
              })
              .select('id')
              .single();
            categoryId = newCat?.id;
          }
        }

        // 8. Insert transaksi dengan idempotency key
        const idempotencyKey = `gmail:${emailAddress}:${msgId}:0`

        const insertPayload: any = {
          user_id: userId,
          account_id: accountId,
          amount: parsed.amount,
          type: parsed.type,
          description: `[${parsed.bank}] ${parsed.description}`,
          idempotency_key: idempotencyKey
        };

        if (categoryId) {
          insertPayload.category_id = categoryId;
        }

        const { error: insertError } = await dbClient
          .from('transactions')
          .insert(insertPayload)

        if (insertError) {
          console.log('Ignored duplicate or insert error:', insertError.message)
        } else {
          console.log(`✅ Inserted: ${parsed.bank} ${parsed.type} Rp${parsed.amount}`)
          // Kirim push notification ke HP
          const isCredit = parsed.type === 'CREDIT'
          const amountFormatted = new Intl.NumberFormat('id-ID').format(parsed.amount)
          await sendPushNotification(dbClient, userId, {
            title: `${isCredit ? '💰 Uang Masuk' : '💸 Uang Keluar'} - ${parsed.bank}`,
            body: `Rp ${amountFormatted} · ${parsed.description.substring(0, 60)}`
          })
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
