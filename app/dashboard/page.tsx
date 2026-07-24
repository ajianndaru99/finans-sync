import { getAccounts, getTransactions } from '@/app/lib/services/financeService'
import Link from 'next/link'
import AddAccountModal from '@/app/components/AddAccountModal'
import NewEntryButton from '@/app/components/NewEntryButton'
import AutoSyncManager from '@/app/components/AutoSyncManager'
import TransactionList from '@/app/components/TransactionList'
import AccountList from '@/app/components/AccountList'

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
    <div className="space-y-5 pb-24 md:pb-4">
      {!isConnected && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          ⚠️ Tidak dapat terhubung ke Supabase. Periksa konfigurasi .env.local Anda.
        </div>
      )}

      {/* Hero: Total Net Worth */}
      <section className="glass-card p-5 md:p-8 relative overflow-hidden rounded-2xl">
        <div className="absolute top-0 right-0 p-32 bg-primary/10 rounded-full blur-[100px] -mr-16 -mt-16 pointer-events-none"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 gap-4">
          <div className="min-w-0 w-full flex items-center justify-between md:justify-start md:gap-4 mb-2">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Net Worth</p>
            <div className="md:hidden">
              <AutoSyncManager />
            </div>
          </div>
          <div className="min-w-0 w-full flex justify-between items-center">
            <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-100 to-gray-400 truncate">
              {formatIDR(netWorth)}
            </h2>
            <div className="hidden md:block">
              <AutoSyncManager />
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3 relative z-10">
          <NewEntryButton accounts={accounts} />
        </div>
      </section>

      {/* Accounts */}
      <section className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-base font-semibold text-gray-200">Your Accounts</h3>
          <AddAccountModal />
        </div>
        <AccountList accounts={accounts} />
      </section>

      {/* Recent Activity */}
      <section className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-base font-semibold text-gray-200">Recent Activity</h3>
          <Link href="/dashboard/transactions" className="text-xs text-primary hover:text-primary-hover transition-colors font-medium">
            View All →
          </Link>
        </div>

        <div className="glass-panel overflow-hidden p-2">
          <TransactionList transactions={transactions} accounts={accounts} showTypeFilter={true} />
        </div>
      </section>
    </div>
  )
}
