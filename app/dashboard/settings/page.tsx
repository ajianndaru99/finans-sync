import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import LinkAccountButton from '@/app/components/LinkAccountButton'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ linked?: string; link_error?: string; detail?: string }>
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const params = await searchParams

  // Fetch all linked emails
  const { data: linkedAccounts, error: fetchError } = await supabase
    .from('user_oauth_tokens')
    .select('email_address, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl">
        <h2 className="text-xl font-bold text-white mb-2">Integrasi Email (Bank &amp; E-Wallet)</h2>
        <p className="text-gray-400 text-sm mb-6">
          Sambungkan beberapa akun Gmail agar sistem dapat membaca notifikasi mutasi dari berbagai bank dan dompet digital (Gopay, OVO, dll) secara terpusat.
        </p>

        {/* Pesan sukses setelah link berhasil */}
        {params.linked && (
          <div className="mb-4 p-3 bg-green-500/15 border border-green-500/30 text-green-400 rounded-xl text-sm flex items-center gap-2">
            <span>✅</span>
            <span>
              <strong>{decodeURIComponent(params.linked)}</strong> berhasil disambungkan!
              Klik &quot;Aktifkan Sinkronisasi&quot; di dashboard untuk mulai sinkronisasi.
            </span>
          </div>
        )}

        {/* Pesan error */}
        {params.link_error && (
          <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 text-red-400 rounded-xl text-sm">
            <p className="font-semibold mb-1">
              ⚠️ {params.link_error === 'dibatalkan'
                ? 'Ditolak atau dibatalkan di Google.'
                : params.link_error === 'gagal_simpan'
                ? 'Gagal menyimpan ke database. Apakah migration SQL sudah dijalankan?'
                : `Terjadi kesalahan: ${params.link_error}`}
            </p>
            {params.detail && (
              <p className="text-xs text-red-300 mt-1 font-mono break-all">{decodeURIComponent(params.detail)}</p>
            )}
          </div>
        )}

        {/* Error fetch tabel */}
        {fetchError && (
          <div className="mb-4 p-3 bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 rounded-xl text-sm">
            ⚠️ Tabel <code>user_oauth_tokens</code> belum ada. Jalankan <strong>migration_multi_account.sql</strong> di Supabase Dashboard terlebih dahulu.
          </div>
        )}

        <div className="space-y-3 mb-6">
          {linkedAccounts && linkedAccounts.length > 0 ? (
            linkedAccounts.map((acc, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg">
                    📧
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{acc.email_address}</p>
                    <p className="text-xs text-gray-500">
                      Terhubung sejak {new Date(acc.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                {i === 0 && (
                  <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold bg-primary/20 text-primary rounded-full">
                    Utama
                  </span>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm italic py-2">
              Belum ada email yang terhubung. Tambahkan Gmail pertama Anda di bawah.
            </p>
          )}
        </div>

        <LinkAccountButton />
        
        <div className="mt-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs leading-relaxed">
          <strong>Catatan Keamanan:</strong> Akses ini hanya mode &quot;Read-Only&quot;. Kami hanya membaca notifikasi mutasi dari bank resmi. Kami tidak dapat mengubah, membalas, atau menghapus email Anda.
        </div>

        {/* Instruksi GCP Console */}
        <div className="mt-4 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs leading-relaxed space-y-1">
          <p className="font-bold text-purple-200">⚙️ Setup Satu Kali (Wajib di Google Cloud Console):</p>
          <p>Tambahkan URI berikut ke <strong>Authorized redirect URIs</strong> di GCP Console → Credentials → OAuth 2.0 Client:</p>
          <code className="block mt-1 p-2 bg-black/30 rounded text-purple-100 break-all select-all">
            https://finans-sync.vercel.app/api/link-gmail/callback
          </code>
        </div>
      </div>
    </div>
  )
}
