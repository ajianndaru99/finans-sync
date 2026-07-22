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

    let topicName = process.env.GCP_PUBSUB_TOPIC || ''
    if (!topicName.startsWith('projects/')) {
      topicName = `projects/${process.env.GCP_PROJECT_ID}/topics/${topicName}`
    }
    
    // Memanggil Watch API untuk mengirim notifikasi ke Pub/Sub
    const res = await gmail.users.watch({
      userId: 'me',
      requestBody: {
        labelIds: ['INBOX'], // pantau inbox
        topicName: topicName,
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
    let errorTopicName = process.env.GCP_PUBSUB_TOPIC || ''
    if (!errorTopicName.startsWith('projects/')) {
      errorTopicName = `projects/${process.env.GCP_PROJECT_ID}/topics/${errorTopicName}`
    }
    return { error: `${error.message} (Dikirim: ${errorTopicName}). Cek spasi ekstra di Env Vars.` }
  }
}
