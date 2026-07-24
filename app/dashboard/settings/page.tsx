import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import LinkAccountButton from '@/app/components/LinkAccountButton'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ linked?: string; link_error?: string; detail?: string }>
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams

  // Gunakan service role untuk membaca user_oauth_tokens.
  // Ini AMAN karena kita sudah verifikasi user.id dari Supabase Auth di atas.
  // Bypass RLS diperlukan karena policy SELECT mungkin belum terkonfigurasi
  // dengan benar di semua lingkungan (migration partial, dll).
  const dbClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let linkedAccounts: { email_address: string; created_at?: string }[] | null = null
  let fetchError: any = null

  // Coba query dengan created_at
  const res = await dbClient
    .from('user_oauth_tokens')
    .select('email_address, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (res.error && res.error.message?.includes('created_at')) {
    // Fallback jika kolom created_at belum dibuat di tabel Supabase
    const fallbackRes = await dbClient
      .from('user_oauth_tokens')
      .select('email_address')
      .eq('user_id', user.id)
    linkedAccounts = fallbackRes.data
    fetchError = fallbackRes.error
  } else {
    linkedAccounts = res.data
    fetchError = res.error
  }

  return (
    <div className="space-y-4 pb-6">

      {/* ── Notifikasi sukses / error dari redirect ── */}
      {params.linked && (
        <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/25 rounded-2xl">
          <span className="text-xl mt-0.5">✅</span>
          <div>
            <p className="text-green-400 font-semibold text-sm">Gmail berhasil disambungkan!</p>
            <p className="text-green-300/70 text-xs mt-0.5 break-all">{decodeURIComponent(params.linked)}</p>
          </div>
        </div>
      )}

      {params.link_error && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/25 rounded-2xl">
          <span className="text-xl mt-0.5">⚠️</span>
          <div>
            <p className="text-red-400 font-semibold text-sm">
              {params.link_error === 'dibatalkan'
                ? 'Dibatalkan di Google'
                : params.link_error === 'gagal_simpan'
                ? 'Gagal simpan — pastikan migration SQL sudah dijalankan'
                : 'Gagal menghubungkan Gmail'}
            </p>
            {params.detail && (
              <p className="text-red-300/60 text-xs mt-1 break-all font-mono">
                {decodeURIComponent(params.detail)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Card utama ── */}
      <div className="glass-panel p-5">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-white">Integrasi Gmail</h2>
          <p className="text-gray-400 text-xs mt-1 leading-relaxed">
            Hubungkan Gmail untuk membaca notifikasi mutasi dari bank &amp; e-wallet secara otomatis.
          </p>
        </div>

        {/* ── Error tabel atau database ── */}
        {fetchError && (
          <div className="mb-4 flex flex-col gap-1 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400 text-xs">
            <div className="flex items-center gap-2 font-semibold">
              <span>⚠️</span>
              <span>Gagal membaca data integrasi Gmail</span>
            </div>
            <p className="text-yellow-300/80 font-mono text-[11px] break-all mt-1">
              Error: {fetchError.message} {fetchError.details ? `(${fetchError.details})` : ''}
            </p>
            {fetchError.code === '42P01' && (
              <p className="mt-1 text-[11px]">
                (Tabel <code>user_oauth_tokens</code> belum ada di database Supabase. Silakan jalankan <strong>migration_multi_account.sql</strong> di SQL Editor Supabase.)
              </p>
            )}
          </div>
        )}

        {/* ── Daftar Gmail terhubung ── */}
        <div className="space-y-2 mb-5">
          {linkedAccounts && linkedAccounts.length > 0 ? (
            linkedAccounts.map((acc, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3.5 bg-white/5 border border-white/8 rounded-xl"
              >
                {/* Avatar huruf */}
                <div className="w-9 h-9 flex-shrink-0 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 border border-white/10 flex items-center justify-center text-sm font-bold text-white/70">
                  {acc.email_address.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-medium truncate">{acc.email_address}</p>
                  <p className="text-gray-500 text-[11px]">
                    {i === 0 ? '🔑 Utama · ' : ''}
                    {acc.created_at
                      ? `Sejak ${new Date(acc.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}`
                      : 'Terhubung'}
                  </p>
                </div>
                {/* Indikator aktif */}
                <div className="w-2 h-2 flex-shrink-0 rounded-full bg-primary shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
              </div>
            ))
          ) : (
            !fetchError && (
              <p className="text-gray-500 text-sm text-center py-4 italic">
                Belum ada Gmail terhubung
              </p>
            )
          )}
        </div>

        {/* ── Tombol tambah ── */}
        <LinkAccountButton />

        {/* ── Catatan keamanan (compact) ── */}
        <div className="mt-4 flex items-start gap-2 p-3 bg-blue-500/8 border border-blue-500/15 rounded-xl">
          <span className="text-sm mt-0.5">🔒</span>
          <p className="text-blue-400/80 text-[11px] leading-relaxed">
            Hanya mode <strong>Read-Only</strong>. Kami hanya membaca notifikasi mutasi dari bank resmi — tidak bisa mengubah, membalas, atau menghapus email Anda.
          </p>
        </div>
      </div>

    </div>
  )
}
