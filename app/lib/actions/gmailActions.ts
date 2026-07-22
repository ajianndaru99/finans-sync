'use server'

import { createClient } from '@/utils/supabase/server'
import { google } from 'googleapis'

export async function enableGmailWatch() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  // Ambil token dari database
  const { data: tokens, error: dbError } = await supabase
    .from('user_oauth_tokens')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (dbError || !tokens?.encrypted_access_token) {
    return { error: 'Belum menghubungkan akun Google (Token tidak ditemukan). Silakan login ulang via Google.' }
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GCP_CLIENT_ID,
      process.env.GCP_CLIENT_SECRET
    )

    oauth2Client.setCredentials({
      access_token: tokens.encrypted_access_token,
      refresh_token: tokens.encrypted_refresh_token
    })

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

    // Memanggil Watch API untuk mengirim notifikasi ke Pub/Sub
    const res = await gmail.users.watch({
      userId: 'me',
      requestBody: {
        labelIds: ['INBOX'], // pantau inbox
        topicName: `projects/${process.env.GCP_PROJECT_ID}/topics/${process.env.GCP_PUBSUB_TOPIC}`, // Misal: projects/finans-sync-123/topics/gmail-updates
      }
    })

    // Simpan historyId baru
    if (res.data.historyId) {
      await supabase
        .from('user_oauth_tokens')
        .update({ history_id: res.data.historyId })
        .eq('user_id', user.id)
    }

    return { success: true, historyId: res.data.historyId }
  } catch (error: any) {
    console.error('Gmail Watch Error:', error)
    return { error: error.message || 'Gagal terhubung ke Google. Pastikan GCP Client ID & Secret sudah diset di Vercel.' }
  }
}
