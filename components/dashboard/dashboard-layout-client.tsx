'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Kanban, LayoutDashboard, Clock, Menu, X, User } from 'lucide-react'
import { LogoutButton } from '@/components/auth/logout-button'
import { TimerTicker } from '@/components/timer/timer-ticker'

interface DashboardLayoutClientProps {
  userEmail: string
  children: React.ReactNode
}

const NAV_ITEMS = [
  { href: '/board', label: 'Board', icon: Kanban },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/time-log', label: 'Time Log', icon: Clock },
]

export function DashboardLayoutClient({
  userEmail,
  children,
}: DashboardLayoutClientProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Mobile Top Header (screens < 768px) */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shrink-0 sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-[#0079BF]">
            Propel
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle profile menu"
          >
            <User className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Mobile Profile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-xs animate-in fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Profile & Settings Drawer */}
      <div
        className={`md:hidden fixed inset-y-0 right-0 z-50 w-72 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 p-5 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Account
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px] mt-0.5">
                {userEmail}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-1 rounded-md text-gray-400 hover:text-gray-700"
              aria-label="Close drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-6 space-y-3 text-xs text-gray-500">
            <p className="font-medium text-gray-700 dark:text-gray-300">Quick shortcuts</p>
            <div className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
                >
                  <item.icon className="h-4 w-4 text-[#0079BF]" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
          <LogoutButton />
        </div>
      </div>

      {/* Desktop Sidebar (visible on md 768px+) */}
      <aside className="hidden md:flex w-64 flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-5 shrink-0">
        <div className="mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <h1 className="text-2xl font-bold tracking-tight text-[#0079BF]">
            Propel
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
            {userEmail}
          </p>
        </div>

        <nav className="space-y-1 flex-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-[#0079BF] dark:text-blue-400 font-semibold shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content Area (extra pb-20 on mobile to leave space for bottom nav) */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 overflow-y-auto">
        {children}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar (screens < 768px) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 dark:bg-gray-900/95 border-t border-gray-200 dark:border-gray-800 flex items-center justify-around py-2 px-2 z-30 backdrop-blur-md shadow-lg"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[11px] font-medium transition-colors ${
                isActive
                  ? 'text-[#0079BF] dark:text-blue-400 font-semibold'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4 mb-0.5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Global Timer Floating Widget (raised above bottom nav on mobile) */}
      <TimerTicker />
    </div>
  )
}
