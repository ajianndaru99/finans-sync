import { getAccounts, getTransactions } from '@/app/lib/services/financeService'
import PortfolioAnalytics from '@/app/components/PortfolioAnalytics'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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
    <div className="space-y-5 pb-24 md:pb-4">
      <PortfolioAnalytics transactions={transactions} accounts={accounts} />
    </div>
  )
}
