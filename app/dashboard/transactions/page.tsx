import { getAccounts, getTransactions } from '@/app/lib/services/financeService'
import NewEntryButton from '@/app/components/NewEntryButton'
import TransactionList from '@/app/components/TransactionList'

export default async function TransactionsPage() {
  let transactions: any[] = []
  let accounts: any[] = []

  try {
    transactions = await getTransactions(50)
    accounts = await getAccounts()
  } catch (e) {
    console.error("Failed to fetch transactions")
  }

  return (
    <div className="space-y-5 pb-4">
      {/* Header */}
      <div className="flex justify-between items-center gap-3">
        <div className="min-w-0">
          <h1 className="text-xl md:text-3xl font-bold text-gray-100">Transactions</h1>
          <p className="text-gray-400 text-xs mt-0.5 hidden md:block">Riwayat semua transaksi keuangan Anda</p>
        </div>
        <NewEntryButton accounts={accounts} />
      </div>

      {/* Transaction List (Client Component with Edit Modal) */}
      <TransactionList transactions={transactions} accounts={accounts} />
    </div>
  )
}
