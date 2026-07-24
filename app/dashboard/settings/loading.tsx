export default function SettingsLoading() {
  return (
    <div className="space-y-4 animate-pulse pb-6">
      <div className="glass-panel p-5 rounded-2xl space-y-4">
        <div className="space-y-2">
          <div className="w-36 h-6 bg-white/10 rounded-lg" />
          <div className="w-full h-4 bg-white/5 rounded" />
        </div>

        <div className="space-y-2.5 my-6">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3.5 bg-white/5 border border-white/5 rounded-xl h-16">
              <div className="w-9 h-9 rounded-full bg-white/10" />
              <div className="flex-1 space-y-1.5">
                <div className="w-44 h-4 bg-white/10 rounded" />
                <div className="w-24 h-3 bg-white/5 rounded" />
              </div>
            </div>
          ))}
        </div>

        <div className="w-full h-12 bg-purple-500/20 rounded-xl" />
        <div className="w-full h-12 bg-blue-500/10 rounded-xl" />
      </div>
    </div>
  )
}
