import Link from 'next/link'
import LogoutButton from '@/app/components/LogoutButton'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar (Glassmorphism) */}
      <aside className="w-64 flex flex-col p-6 glass-panel m-4 mr-0 rounded-2xl hidden md:flex">
        <div className="flex items-center mb-10 gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center font-bold text-white shadow-lg">
            FS
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            Finans Sync
          </h1>
        </div>

        <nav className="flex-1 space-y-2">
          <Link href="/dashboard" className="flex items-center px-4 py-3 text-sm font-medium rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-colors group">
            <span className="w-2 h-2 rounded-full bg-primary mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
            Dashboard
          </Link>
          <Link href="/dashboard/transactions" className="flex items-center px-4 py-3 text-sm font-medium rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-colors group">
            <span className="w-2 h-2 rounded-full bg-accent mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
            Transactions
          </Link>
          <Link href="/dashboard/investments" className="flex items-center px-4 py-3 text-sm font-medium rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-colors group">
            <span className="w-2 h-2 rounded-full bg-purple-500 mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
            Investments
          </Link>
        </nav>

        <div className="mt-auto">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs text-gray-400">Unified Ledger v11.0</p>
            <p className="text-xs text-gray-500 mt-1">Real-time Sync Active</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative overflow-y-auto overflow-x-hidden p-4 md:p-8">
        <header className="flex justify-between items-center mb-8 glass-panel py-3 px-6 rounded-full sticky top-0 z-10 backdrop-blur-xl">
          <h2 className="text-lg font-medium text-gray-200 hidden md:block">Welcome back, User</h2>
          {/* Mobile Menu Placeholder */}
          <div className="md:hidden font-bold text-primary">FS</div>
          
          <div className="flex items-center gap-4">
            <LogoutButton />
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border-2 border-white/20 flex items-center justify-center font-bold text-sm">
              U
            </div>
          </div>
        </header>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
          {children}
        </div>
      </main>
    </div>
  )
}
