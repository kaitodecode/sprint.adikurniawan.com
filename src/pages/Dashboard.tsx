import { useData } from '@/lib/data'
import { allMetrics } from '@/lib/metrics'
import { useMonth } from '@/components/MonthSelect'
import { MonthlyUtilChart, TagHoursChart, TrendChart } from '@/components/Charts'
import { Card, Empty, PageTitle } from '@/components/ui'
import { monthLabel } from '@/lib/dates'

export default function Dashboard() {
  const { sprints, tasks } = useData()
  const { summary, select } = useMonth()

  if (!summary) return (
    <>
      <PageTitle>Dashboard</PageTitle>
      <Empty>Belum ada data sprint. Mulai dari menu Planning.</Empty>
    </>
  )

  return (
    <>
      <PageTitle actions={select}>Dashboard</PageTitle>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-2 font-medium">Utilitas bulanan (W1–W4) · {monthLabel(summary.key)}</h2>
          <MonthlyUtilChart month={summary} />
          <p className="mt-1 text-xs text-slate-400">Utilisasi = jam aktual ÷ kapasitas. Minggu ke-5 digabung ke W4.</p>
        </Card>
        <Card>
          <h2 className="mb-2 font-medium">Tren utilisasi &amp; completion</h2>
          <TrendChart metrics={allMetrics(sprints, tasks)} />
        </Card>
        <Card className="lg:col-span-2">
          <h2 className="mb-2 font-medium">Jam per tag/klien · {monthLabel(summary.key)}</h2>
          {summary.byTag.length === 0 ? <p className="text-sm text-slate-500">Belum ada jam aktual bulan ini.</p> : <TagHoursChart month={summary} />}
        </Card>
      </div>
    </>
  )
}
