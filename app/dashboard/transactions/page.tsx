import { getTransactions } from '@/app/lib/services/financeService'

export default async function TransactionsPage() {
  let transactions: any[] = []
  try {
    transactions = await getTransactions(50) // Fetch up to 50 for the page
  } catch (e) {
    console.error("Failed to fetch transactions")
  }

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <header className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">All Transactions</h1>
          <p className="text-gray-400 mt-1">Review your financial history across all accounts.</p>
        </div>
        <button className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium transition-colors shadow-lg shadow-primary/20">
          + New Entry
        </button>
      </header>

      <div className="glass-panel overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-gray-500 bg-white/5">
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium">Description</th>
              <th className="p-4 font-medium">Account</th>
              <th className="p-4 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">
                  No transactions found.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-white/5 transition-colors group cursor-pointer">
                  <td className="p-4 text-sm text-gray-400">
                    {new Date(tx.created_at).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td className="p-4">
                    <p className="font-medium text-gray-200 group-hover:text-primary transition-colors">
                      {tx.description || 'System Entry'}
                    </p>
                    <p className="text-xs text-gray-500">{tx.categories?.name || 'Uncategorized'}</p>
                  </td>
                  <td className="p-4 text-sm text-gray-400">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10">
                      {tx.accounts?.name || 'Unknown'}
                    </span>
                  </td>
                  <td className={`p-4 text-right font-medium ${tx.type === 'CREDIT' ? 'text-primary' : 'text-gray-200'}`}>
                    {tx.type === 'CREDIT' ? '+' : '-'}{formatIDR(Number(tx.amount))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
