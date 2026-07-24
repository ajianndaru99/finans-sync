import { createClient } from '@/utils/supabase/server'
import LogoutButton from '@/app/components/LogoutButton'
import BiometricLock from '@/app/components/BiometricLock'
import { DesktopSidebarNav, MobileBottomNav } from '@/app/components/NavigationLinks'
import RealtimeSync from '@/app/components/RealtimeSync'

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
      <RealtimeSync />

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

        <DesktopSidebarNav />

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
      <MobileBottomNav />
    </div>
  )
}
