import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import LogoutButton from '@/app/components/LogoutButton'
import BiometricLock from '@/app/components/BiometricLock'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const fullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const avatarLetter = fullName.charAt(0).toUpperCase()
  const avatarUrl = user?.user_metadata?.avatar_url

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      {/* Sidebar (Desktop only) */}
      <aside className="w-64 flex-col p-6 glass-panel m-4 mr-0 rounded-2xl hidden md:flex">
        <div className="flex items-center mb-10 gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center font-bold text-white shadow-lg">
            FS
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            Ajian Family
          </h1>
        </div>

        <nav className="flex-1 space-y-2">
          <Link href="/dashboard" className="flex items-center px-4 py-3 text-sm font-medium rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-colors group">
            <span className="w-2 h-2 rounded-full bg-primary mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
            Dashboard
          </Link>
          <Link href="/dashboard/transactions" className="flex items-center px-4 py-3 text-sm font-medium rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-colors group">
            <span className="w-2 h-2 rounded-full bg-accent mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
            Portfolio
          </Link>
        </nav>

        <div className="mt-auto">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={fullName} className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-white">
                {avatarLetter}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-300 truncate">{fullName}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-y-auto overflow-x-hidden p-4 md:p-8 pb-24 md:pb-8">
        <header className="flex justify-between items-center mb-6 md:mb-8 glass-panel py-3 px-6 rounded-full sticky top-0 z-40 backdrop-blur-xl shadow-lg">
          <h2 className="text-lg font-medium text-gray-200 hidden md:block">Welcome back, <span className="text-primary font-semibold">{fullName}</span></h2>
          {/* Mobile Header */}
          <div className="md:hidden font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Ajian Family</div>
          
          <div className="flex items-center gap-4">
            <LogoutButton />
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={fullName} className="w-10 h-10 rounded-full border-2 border-white/20" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent border-2 border-white/20 flex items-center justify-center font-bold text-sm">
                {avatarLetter}
              </div>
            )}
          </div>
        </header>

        <BiometricLock>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
            {children}
          </div>
        </BiometricLock>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 glass-panel-dark rounded-2xl flex justify-around items-center p-3 z-50 border border-white/10 shadow-2xl">
        <Link href="/dashboard" className="flex flex-col items-center p-2 text-gray-400 hover:text-primary transition-colors">
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        <Link href="/dashboard/transactions" className="flex flex-col items-center p-2 text-gray-400 hover:text-accent transition-colors">
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
          <span className="text-[10px] font-medium">Portfolio</span>
        </Link>
      </nav>
    </div>
  )
}
