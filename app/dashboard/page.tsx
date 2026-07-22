import { getAccounts, getTransactions } from '@/app/lib/services/financeService'
import Link from 'next/link'
import AddAccountModal from '@/app/components/AddAccountModal'
import AddTransactionModal from '@/app/components/AddTransactionModal'
import EnableSyncButton from '@/app/components/EnableSyncButton'

export default async function DashboardPage() {
  // Mock fallback if DB is not fully seeded or connected
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

  // Format currency
  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="space-y-8">
      {!isConnected && (
        <div className="p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          ⚠️ Unable to connect to Supabase. Check your .env.local configuration.
        </div>
      )}

      {/* Hero Widget: Total Net Worth */}
      <section className="glass-card p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-32 bg-primary/10 rounded-full blur-[100px] -mr-16 -mt-16 pointer-events-none"></div>
        <div className="flex justify-between items-start relative z-10">
          <div>
            <p className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">Total Net Worth</p>
            <h2 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-100 to-gray-400">
              {formatIDR(netWorth)}
            </h2>
          </div>
          <EnableSyncButton />
        </div>
        <div className="mt-8 flex gap-4 relative z-10">
          <AddTransactionModal accounts={accounts} />
          <button className="px-6 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium transition-colors">
            View Report
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Accounts List Widget */}
        <section className="lg:col-span-1 space-y-4">
          <div className="flex justify-between items-end">
            <h3 className="text-xl font-semibold">Your Accounts</h3>
            <AddAccountModal />
          </div>
          <div className="space-y-3">
            {accounts.length === 0 && (
              <div className="text-gray-500 text-sm py-4">No accounts found.</div>
            )}
            {accounts.map(acc => (
              <div key={acc.id} className="glass-panel p-4 flex justify-between items-center group cursor-pointer hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${acc.type === 'BANK' ? 'bg-accent/20 text-accent' : 'bg-purple-500/20 text-purple-400'}`}>
                    {acc.type === 'BANK' ? '🏦' : '📱'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-200">{acc.name}</p>
                    <p className="text-xs text-gray-500">{acc.type}</p>
                  </div>
                </div>
                <p className="font-semibold text-gray-300">{formatIDR(Number(acc.current_balance))}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Transactions Widget */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-end">
            <h3 className="text-xl font-semibold">Recent Activity</h3>
            <Link href="/dashboard/transactions" className="text-sm text-primary hover:text-primary-hover transition-colors">
              View All &rarr;
            </Link>
          </div>
          
          <div className="glass-panel overflow-hidden">
            <div className="divide-y divide-white/5">
              {transactions.length === 0 && (
                <div className="text-gray-500 text-sm p-6 text-center">No transactions yet.</div>
              )}
              {transactions.map(tx => (
                <div key={tx.id} className="p-5 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 ${tx.type === 'CREDIT' ? 'text-primary' : 'text-red-400'}`}>
                      {tx.type === 'CREDIT' ? '↓' : '↑'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-200">{tx.description || 'Transfer'}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(tx.created_at).toLocaleDateString('id-ID')} • {tx.accounts?.name || 'Unknown Account'}
                      </p>
                    </div>
                  </div>
                  <div className={`font-semibold ${tx.type === 'CREDIT' ? 'text-primary' : 'text-gray-300'}`}>
                    {tx.type === 'CREDIT' ? '+' : '-'}{formatIDR(Number(tx.amount))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
