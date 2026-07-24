export default function TransactionsLoading() {
  return (
    <div className="space-y-4 animate-pulse pb-24 md:pb-6">
      {/* Portfolio Header Shimmer */}
      <div className="glass-card p-6 rounded-2xl h-36 bg-white/5 border border-white/10 flex flex-col justify-between">
        <div className="w-32 h-4 bg-white/10 rounded" />
        <div className="w-56 h-9 bg-white/15 rounded-xl" />
      </div>

      {/* Filter Tabs Shimmer */}
      <div className="flex gap-2 py-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="w-20 h-9 bg-white/5 rounded-xl border border-white/5" />
        ))}
      </div>

      {/* Transactions List Shimmer */}
      <div className="glass-panel p-4 space-y-3 rounded-2xl">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-none">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10" />
              <div className="space-y-2">
                <div className="w-40 h-4 bg-white/10 rounded" />
                <div className="w-24 h-3 bg-white/5 rounded" />
              </div>
            </div>
            <div className="w-20 h-5 bg-white/10 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
