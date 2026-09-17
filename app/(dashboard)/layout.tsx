import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: '#0079BF' }}>Propel</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
        </div>
        <nav className="space-y-2">
          <Link
            href="/board"
            className="block px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            Board
          </Link>
          <Link
            href="/dashboard"
            className="block px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            Dashboard
          </Link>
          <Link
            href="/time-log"
            className="block px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            Time Log
          </Link>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  )
}
