import { getAccounts, getTransactions } from '@/app/lib/services/financeService'
import NewEntryButton from '@/app/components/NewEntryButton'
import PortfolioAnalytics from '@/app/components/PortfolioAnalytics'

export default async function TransactionsPage() {
  let transactions: any[] = []
  let accounts: any[] = []

  try {
    // Ambil lebih banyak transaksi agar analitik tahunan bisa bekerja
    transactions = await getTransactions(1000)
    accounts = await getAccounts()
  } catch (e) {
    console.error("Failed to fetch transactions")
  }

  return (
    <div className="space-y-5 pb-4">
      {/* Tombol tambah transaksi dipindah ke atas tapi Header teks akan diatur oleh PortfolioAnalytics */}
      <div className="flex justify-end mb-4">
        <NewEntryButton accounts={accounts} />
      </div>

      <PortfolioAnalytics transactions={transactions} accounts={accounts} />
    </div>
  )
}
