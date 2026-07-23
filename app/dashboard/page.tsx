import { getAccounts, getTransactions } from '@/app/lib/services/financeService'
import Link from 'next/link'
import AddAccountModal from '@/app/components/AddAccountModal'
import AddTransactionModal from '@/app/components/AddTransactionModal'
import EnableSyncButton from '@/app/components/EnableSyncButton'

export default async function DashboardPage() {
  let accounts: any[] = []
  let transactions: any[] = []
  let netWorth = 0
  let isConnected = true

  try {
    accounts = await getAccounts()
    transactions = await getTransactions(5)
    netWorth = accounts.reduce((acc, curr) => acc + Number(curr.current_balance), 0)
  } catch (e) {
    console.warn("Database connection issue. Showing empty state.")
    isConnected = false
  }

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="space-y-5 pb-4">
      {!isConnected && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          ⚠️ Tidak dapat terhubung ke Supabase. Periksa konfigurasi .env.local Anda.
        </div>
      )}

      {/* Hero: Total Net Worth */}
      <section className="glass-card p-5 md:p-8 relative overflow-hidden rounded-2xl">
        <div className="absolute top-0 right-0 p-32 bg-primary/10 rounded-full blur-[100px] -mr-16 -mt-16 pointer-events-none"></div>
        <div className="flex justify-between items-start relative z-10 gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Total Net Worth</p>
            <h2 className="text-2xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-100 to-gray-400 truncate">
              {formatIDR(netWorth)}
            </h2>
          </div>
          <div className="shrink-0">
            <EnableSyncButton />
          </div>
        </div>
        <div className="mt-5 flex gap-3 relative z-10">
          <AddTransactionModal accounts={accounts} />
          <button className="px-4 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-colors">
            View Report
          </button>
        </div>
      </section>

      {/* Accounts */}
      <section className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-base font-semibold text-gray-200">Your Accounts</h3>
          <AddAccountModal />
        </div>
        {accounts.length === 0 && (
          <div className="text-gray-500 text-sm py-3 px-1">No accounts found.</div>
        )}
        <div className="space-y-2">
          {accounts.map(acc => (
            <div key={acc.id} className="glass-panel-dark p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                  acc.type === 'BANK' ? 'bg-accent/20 text-accent' : 'bg-purple-500/20 text-purple-400'
                }`}>
                  {acc.type === 'BANK' ? '🏦' : '📱'}
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-100">{acc.name}</p>
                  <p className="text-xs text-gray-500">{acc.type}</p>
                </div>
              </div>
              <p className={`font-bold text-sm tabular-nums ${Number(acc.current_balance) >= 0 ? 'text-gray-200' : 'text-red-400'}`}>
                {formatIDR(Number(acc.current_balance))}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-base font-semibold text-gray-200">Recent Activity</h3>
          <Link href="/dashboard/transactions" className="text-xs text-primary hover:text-primary-hover transition-colors font-medium">
            View All →
          </Link>
        </div>

        <div className="glass-panel overflow-hidden">
          <div className="divide-y divide-white/5">
            {transactions.length === 0 && (
              <div className="text-gray-500 text-sm p-6 text-center">No transactions yet.</div>
            )}
            {transactions.map(tx => (
              <div key={tx.id} className="p-4 flex items-center justify-between gap-3 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-sm bg-white/5 border border-white/10 ${tx.type === 'CREDIT' ? 'text-primary' : 'text-red-400'}`}>
                    {tx.type === 'CREDIT' ? '↓' : '↑'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-200 truncate max-w-[180px]">{tx.description || 'Transfer'}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {new Date(tx.created_at).toLocaleDateString('id-ID')} • {tx.accounts?.name || 'Unknown'}
                    </p>
                  </div>
                </div>
                <div className={`text-sm font-bold tabular-nums shrink-0 ${tx.type === 'CREDIT' ? 'text-primary' : 'text-gray-300'}`}>
                  {tx.type === 'CREDIT' ? '+' : '-'}{formatIDR(Number(tx.amount))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
