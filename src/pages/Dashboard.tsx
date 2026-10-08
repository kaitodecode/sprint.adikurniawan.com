import { Activity, CheckCircle2, Clock, Target } from 'lucide-react'
import { useData } from '@/lib/data'
import { allMetrics } from '@/lib/metrics'
import { useMonth } from '@/components/MonthSelect'
import { MonthlyUtilChart, TagHoursChart, TrendChart } from '@/components/Charts'
import { Kpi } from '@/components/Kpi'
import { EmptyState, PageHeader, utilTone } from '@/components/common'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { monthLabel } from '@/lib/dates'
import { hours, pct } from '@/lib/utils'
import { BarChart3 } from 'lucide-react'

export default function Dashboard() {
  const { sprints, tasks } = useData()
  const { summary, select } = useMonth()

  if (!summary)
    return (
      <>
        <PageHeader title="Dashboard" description="Ringkasan utilisasi dan performa sprint." />
        <EmptyState icon={<BarChart3 className="size-8" />} title="Belum ada data sprint">
          Buat sprint pertamamu di menu Planning, lalu catat jam aktual di Board agar grafik terisi.
        </EmptyState>
      </>
    )

  return (
    <>
      <PageHeader title="Dashboard" description={`Performa sprint · ${monthLabel(summary.key)}`} actions={select} />
      <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Utilisasi" icon={Activity} value={pct(summary.utilization)} valueClass={utilTone(summary.utilization)} hint={`${hours(summary.actual)} dari ${hours(summary.capacity)}`} />
        <Kpi label="Completion" icon={CheckCircle2} value={pct(summary.completion)} hint="Estimasi selesai ÷ terencana" />
        <Kpi label="Akurasi estimasi" icon={Target} value={pct(summary.accuracy)} hint="100% = estimasi tepat" />
        <Kpi label="Carry-over" icon={Clock} value={String(summary.carryOver)} hint="Task pindah ke sprint berikutnya" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Utilitas bulanan (W1–W4)</CardTitle>
            <CardDescription>Jam aktual ÷ kapasitas per minggu. Garis merah = 100%. Minggu ke-5 digabung ke W4.</CardDescription>
          </CardHeader>
          <CardContent>
            <MonthlyUtilChart month={summary} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tren utilisasi &amp; completion</CardTitle>
            <CardDescription>8 sprint terakhir.</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart metrics={allMetrics(sprints, tasks)} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Jam per tag/klien</CardTitle>
            <CardDescription>Jam aktual bulan {monthLabel(summary.key)}.</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.byTag.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Belum ada jam aktual bulan ini.</p>
            ) : (
              <TagHoursChart month={summary} />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
