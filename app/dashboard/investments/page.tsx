import { getInvestments } from '@/app/lib/services/financeService'

export default async function InvestmentsPage() {
  let investments: any[] = []
  try {
    investments = await getInvestments()
  } catch (e) {
    console.error("Failed to fetch investments")
  }

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 4 }).format(num)
  }

  const totalInvestmentValue = investments.reduce((acc, inv) => acc + (Number(inv.total_units) * Number(inv.average_buy_price)), 0)

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Investment Portfolio</h1>
          <p className="text-gray-400 mt-1">Immutable assets ledger with WACB calculation.</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Total Estimated Value</p>
          <h2 className="text-3xl font-bold text-primary">{formatIDR(totalInvestmentValue)}</h2>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {investments.length === 0 ? (
          <div className="col-span-full p-12 text-center text-gray-500 glass-panel">
            <p>No investment assets found.</p>
            <button className="mt-4 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              Add First Asset
            </button>
          </div>
        ) : (
          investments.map(inv => {
            const totalValue = Number(inv.total_units) * Number(inv.average_buy_price)
            return (
              <div key={inv.id} className="glass-card p-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-white/10 flex items-center justify-center text-2xl">
                      📈
                    </div>
                    <span className="px-2.5 py-1 text-xs font-medium bg-white/5 border border-white/10 rounded-full text-gray-400">
                      {inv.asset_type || 'Asset'}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-100 mb-1">{inv.asset_name}</h3>
                  
                  <div className="space-y-2 mt-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Units</span>
                      <span className="font-medium text-gray-200">{formatNumber(Number(inv.total_units))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Avg. Buy Price</span>
                      <span className="font-medium text-gray-200">{formatIDR(Number(inv.average_buy_price))}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-end">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Total Cost Base</p>
                    <p className="font-semibold text-primary">{formatIDR(totalValue)}</p>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
