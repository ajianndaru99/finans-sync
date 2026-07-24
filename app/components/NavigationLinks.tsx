'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function DesktopSidebarNav() {
  const pathname = usePathname()

  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      exact: true,
      color: 'from-emerald-500 to-teal-400',
      activeBorder: 'border-emerald-500/30',
      activeBg: 'bg-emerald-500/10 text-emerald-400',
      dotColor: 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]'
    },
    {
      name: 'Portfolio',
      href: '/dashboard/transactions',
      exact: false,
      color: 'from-blue-500 to-cyan-400',
      activeBorder: 'border-blue-500/30',
      activeBg: 'bg-blue-500/10 text-blue-400',
      dotColor: 'bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]'
    },
    {
      name: 'Integrasi',
      href: '/dashboard/settings',
      exact: false,
      color: 'from-purple-500 to-indigo-400',
      activeBorder: 'border-purple-500/30',
      activeBg: 'bg-purple-500/10 text-purple-400',
      dotColor: 'bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.8)]'
    }
  ]

  return (
    <nav className="flex-1 space-y-2">
      {navItems.map((item) => {
        const isActive = item.exact 
          ? pathname === item.href 
          : pathname.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
              isActive
                ? `${item.activeBg} border ${item.activeBorder} shadow-lg shadow-black/20`
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
            }`}
          >
            <span className={`w-2 h-2 rounded-full mr-3 transition-all duration-200 ${
              isActive ? item.dotColor : 'bg-gray-600 group-hover:bg-gray-400'
            }`} />
            <span className="font-semibold">{item.name}</span>
            {isActive && (
              <span className={`absolute right-2 w-1.5 h-5 rounded-full bg-gradient-to-b ${item.color}`} />
            )}
          </Link>
        )
      })}
    </nav>
  )
}

export function MobileBottomNav() {
  const pathname = usePathname()

  const navItems = [
    {
      name: 'Home',
      href: '/dashboard',
      exact: true,
      activeColor: 'text-emerald-400',
      activeBg: 'bg-emerald-500/15 border-emerald-500/30',
      glow: 'shadow-[0_0_12px_rgba(16,185,129,0.3)]',
      icon: (
        <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      name: 'Portfolio',
      href: '/dashboard/transactions',
      exact: false,
      activeColor: 'text-blue-400',
      activeBg: 'bg-blue-500/15 border-blue-500/30',
      glow: 'shadow-[0_0_12px_rgba(59,130,246,0.3)]',
      icon: (
        <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      name: 'Integrasi',
      href: '/dashboard/settings',
      exact: false,
      activeColor: 'text-purple-400',
      activeBg: 'bg-purple-500/15 border-purple-500/30',
      glow: 'shadow-[0_0_12px_rgba(168,85,247,0.3)]',
      icon: (
        <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ]

  return (
    <nav className="md:hidden fixed bottom-3 left-4 right-4 glass-panel-dark rounded-2xl flex justify-around items-center p-2 z-50 border border-white/10 shadow-2xl backdrop-blur-xl">
      {navItems.map((item) => {
        const isActive = item.exact 
          ? pathname === item.href 
          : pathname.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex flex-col items-center px-4 py-2 rounded-xl transition-all duration-200 ${
              isActive
                ? `${item.activeColor} ${item.activeBg} ${item.glow} border font-semibold scale-105`
                : 'text-gray-400 hover:text-gray-200 border border-transparent'
            }`}
          >
            {item.icon}
            <span className="text-[11px] leading-none mt-0.5">{item.name}</span>
            {isActive && (
              <span className="absolute -top-1 w-2.5 h-1 rounded-full bg-current shadow-[0_0_8px_currentColor]" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
