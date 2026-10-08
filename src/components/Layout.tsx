import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { DataProvider, useData } from '@/lib/data'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

const links = [
  ['/', 'Dashboard'],
  ['/planning', 'Planning'],
  ['/board', 'Board'],
  ['/riwayat', 'Riwayat'],
  ['/laporan', 'Laporan'],
] as const

function Shell() {
  const { error, loading } = useData()
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <span className="font-semibold text-accent">Sprint Tracker</span>
          <nav className="flex flex-1 flex-wrap gap-1">
            {links.map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  cn('rounded-md px-3 py-1.5 text-sm', isActive ? 'bg-accent-soft font-medium text-accent' : 'text-slate-600 hover:bg-slate-100')
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()}>
            Keluar
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        {error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">Gagal memuat data: {error}. Pastikan skema SQL sudah dijalankan.</p>}
        {loading ? <p className="text-sm text-slate-500">Memuat…</p> : <Outlet />}
      </main>
    </div>
  )
}

export default function Layout() {
  const { session, ready } = useAuth()
  if (!ready) return null
  if (!session) return <Navigate to="/login" replace />
  return (
    <DataProvider>
      <Shell />
    </DataProvider>
  )
}
