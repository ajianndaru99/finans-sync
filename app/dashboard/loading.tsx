export default function DashboardLoading() {
  return (
    <div className="space-y-5 animate-pulse pb-24 md:pb-4">
      {/* Hero Skeleton */}
      <div className="glass-card p-6 rounded-2xl h-44 bg-white/5 border border-white/10 flex flex-col justify-between">
        <div className="w-28 h-4 bg-white/10 rounded-lg" />
        <div className="w-48 h-10 bg-white/15 rounded-xl" />
        <div className="w-32 h-9 bg-white/10 rounded-xl" />
      </div>

      {/* Accounts Skeleton */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <div className="w-32 h-5 bg-white/10 rounded-lg" />
          <div className="w-24 h-8 bg-white/10 rounded-xl" />
        </div>
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="glass-panel-dark p-4 flex justify-between items-center h-16 bg-white/5 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10" />
                <div className="space-y-1.5">
                  <div className="w-24 h-4 bg-white/10 rounded" />
                  <div className="w-12 h-3 bg-white/5 rounded" />
                </div>
              </div>
              <div className="w-20 h-5 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Transactions Skeleton */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <div className="w-36 h-5 bg-white/10 rounded-lg" />
          <div className="w-16 h-4 bg-white/10 rounded" />
        </div>
        <div className="glass-panel p-4 space-y-3 rounded-2xl">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between items-center py-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10" />
                <div className="space-y-1.5">
                  <div className="w-36 h-4 bg-white/10 rounded" />
                  <div className="w-20 h-3 bg-white/5 rounded" />
                </div>
              </div>
              <div className="w-16 h-4 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
