import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import LinkAccountButton from '@/app/components/LinkAccountButton'

export default async function SettingsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch all linked emails
  const { data: linkedAccounts } = await supabase
    .from('user_oauth_tokens')
    .select('email_address, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl">
        <h2 className="text-xl font-bold text-white mb-2">Integrasi Email (Bank & E-Wallet)</h2>
        <p className="text-gray-400 text-sm mb-6">
          Sambungkan beberapa akun Gmail Anda agar sistem dapat membaca notifikasi mutasi dari berbagai bank dan dompet digital (Gopay, OVO, dll) secara terpusat.
        </p>

        <div className="space-y-4 mb-6">
          {linkedAccounts && linkedAccounts.length > 0 ? (
            linkedAccounts.map((acc, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    📧
                  </div>
                  <div>
                    <p className="text-white font-medium">{acc.email_address}</p>
                    <p className="text-xs text-gray-500">
                      Terhubung sejak {new Date(acc.created_at).toLocaleDateString('id-ID')}
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
            <p className="text-gray-500 text-sm italic">Belum ada email yang terhubung.</p>
          )}
        </div>

        <LinkAccountButton />
        
        <div className="mt-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs leading-relaxed">
          <strong>Catatan Keamanan:</strong> Akses ini hanya mode "Read-Only". Kami hanya mencari notifikasi masuk dari bank resmi. Kami tidak dapat mengubah, membalas, atau menghapus email Anda.
        </div>
      </div>
    </div>
  )
}
