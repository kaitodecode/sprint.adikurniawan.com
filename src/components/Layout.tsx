import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { CalendarCheck, ExternalLink, FileText, History, KanbanSquare, LayoutDashboard, ListChecks, LogOut, Rocket } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { DataProvider, useData } from '@/lib/data'
import { supabase } from '@/lib/supabase'
import { sprintMetrics } from '@/lib/metrics'
import { formatShort, mondayOf } from '@/lib/dates'
import { hours, pct } from '@/lib/utils'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Toaster } from '@/components/ui/sonner'

const work = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/planning', label: 'Planning', icon: ListChecks },
  { to: '/board', label: 'Board', icon: KanbanSquare },
] as const
const review = [
  { to: '/riwayat', label: 'Riwayat sprint', icon: History },
  { to: '/laporan', label: 'Laporan bulanan', icon: FileText },
] as const
const titles: Record<string, string> = Object.fromEntries([...work, ...review].map((l) => [l.to, l.label]))

function CurrentSprint() {
  const { sprints, tasks } = useData()
  const today = mondayOf()
  const s = sprints.find((x) => x.week_start <= today)
  if (!s) return null
  const m = sprintMetrics(s, tasks)
  const planned = m.tasks.filter((t) => !t.is_stretch).reduce((a, t) => a + t.est_hours, 0)
  const done = m.tasks.filter((t) => !t.is_stretch && t.status === 'done').length
  const total = m.tasks.filter((t) => !t.is_stretch).length
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Sprint berjalan</SidebarGroupLabel>
      <SidebarGroupContent className="space-y-2 rounded-lg border bg-muted/40 p-3 text-xs">
        <div className="flex items-center gap-1.5 font-medium">
          <CalendarCheck className="size-3.5 text-primary" />
          Minggu {formatShort(s.week_start)}
        </div>
        {s.goal && <p className="line-clamp-2 text-muted-foreground">{s.goal}</p>}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span>Jam terpakai</span>
            <span className="font-medium">
              {hours(m.actual)} / {hours(s.capacity_hours)}
            </span>
          </div>
          <Progress value={Math.min((m.utilization ?? 0) * 100, 100)} className="h-1.5" />
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>
            Task selesai {done}/{total}
          </span>
          <span>Est. {hours(planned)}</span>
        </div>
        <div className="text-muted-foreground">Utilisasi {pct(m.utilization)}</div>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

function NavGroup({ label, items }: { label: string; items: readonly { to: string; label: string; icon: typeof History }[] }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((l) => (
            <SidebarMenuItem key={l.to}>
              <NavLink to={l.to} end={l.to === '/'}>
                {({ isActive }) => (
                  <SidebarMenuButton asChild isActive={isActive} tooltip={l.label}>
                    <span>
                      <l.icon />
                      <span>{l.label}</span>
                    </span>
                  </SidebarMenuButton>
                )}
              </NavLink>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

function Shell() {
  const { error, loading } = useData()
  const { session } = useAuth()
  const { pathname } = useLocation()
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link to="/">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Rocket className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate font-semibold">Sprint Tracker</span>
                    <span className="truncate text-xs text-muted-foreground">Solo</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavGroup label="Kerja" items={work} />
          <NavGroup label="Tinjauan" items={review} />
          <div className="group-data-[collapsible=icon]:hidden">
            <CurrentSprint />
          </div>
          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Halaman publik">
                    <a href="/progress" target="_blank" rel="noreferrer">
                      <ExternalLink />
                      <span>Halaman publik</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center gap-2 px-2 py-1 group-data-[collapsible=icon]:hidden">
            <div className="min-w-0 flex-1 text-xs">
              <p className="truncate font-medium">{session?.user.email}</p>
              <p className="text-muted-foreground">Masuk</p>
            </div>
            <Button variant="ghost" size="icon" className="size-8" aria-label="Keluar" onClick={() => supabase.auth.signOut()}>
              <LogOut />
            </Button>
          </div>
          <SidebarMenu className="hidden group-data-[collapsible=icon]:flex">
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Keluar" onClick={() => supabase.auth.signOut()}>
                <LogOut />
                <span>Keluar</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b bg-background px-3">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="text-sm font-medium">{titles[pathname] ?? 'Sprint Tracker'}</span>
          <ThemeToggle className="ml-auto" />
        </header>
        <main className="w-full flex-1 p-3 md:p-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Gagal memuat data</AlertTitle>
              <AlertDescription>{error}. Pastikan skema SQL sudah dijalankan.</AlertDescription>
            </Alert>
          )}
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <div className="grid gap-4 md:grid-cols-4">
                {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
              </div>
              <Skeleton className="h-64" />
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </SidebarInset>
      <Toaster richColors position="bottom-right" />
    </SidebarProvider>
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
