import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import type { MonthSummary, SprintMetrics } from '@/lib/metrics'
import { formatShort } from '@/lib/dates'

const pctFmt = (v: unknown) => `${Math.round(Number(v) * 100)}%`
const row = (cfg: ChartConfig, fmt: (v: unknown) => string) => (v: unknown, name: unknown) => (
  <div className="flex w-full justify-between gap-4">
    <span className="text-muted-foreground">{cfg[String(name)]?.label ?? String(name)}</span>
    <span className="font-mono font-medium">{fmt(v)}</span>
  </div>
)
const round = (v: number | null) => (v == null ? null : Math.round(v * 1000) / 1000)

const utilCfg = { utilization: { label: 'Utilisasi', color: 'var(--chart-1)' } } satisfies ChartConfig
const trendCfg = {
  utilization: { label: 'Utilisasi', color: 'var(--chart-1)' },
  completion: { label: 'Completion', color: 'var(--chart-3)' },
} satisfies ChartConfig
const hoursCfg = { hours: { label: 'Jam aktual', color: 'var(--chart-1)' } } satisfies ChartConfig

export function MonthlyUtilChart({ month }: { month: MonthSummary }) {
  return (
    <ChartContainer config={utilCfg} className="h-[240px] w-full">
      <BarChart data={month.weekly.map((w) => ({ ...w, utilization: round(w.utilization) }))}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} />
        <YAxis tickFormatter={pctFmt} tickLine={false} axisLine={false} width={44} />
        <ChartTooltip content={<ChartTooltipContent formatter={row(utilCfg, pctFmt)} />} />
        <ReferenceLine y={1} stroke="var(--destructive)" strokeDasharray="4 4" />
        <Bar dataKey="utilization" fill="var(--color-utilization)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}

export function TrendChart({ metrics }: { metrics: SprintMetrics[] }) {
  const data = metrics.slice(-8).map((m) => ({
    label: formatShort(m.sprint.week_start),
    utilization: round(m.utilization),
    completion: round(m.completion),
  }))
  return (
    <ChartContainer config={trendCfg} className="h-[240px] w-full">
      <LineChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} />
        <YAxis tickFormatter={pctFmt} tickLine={false} axisLine={false} width={44} />
        <ChartTooltip content={<ChartTooltipContent formatter={row(trendCfg, pctFmt)} />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line dataKey="utilization" type="monotone" stroke="var(--color-utilization)" strokeWidth={2} dot connectNulls />
        <Line dataKey="completion" type="monotone" stroke="var(--color-completion)" strokeWidth={2} dot connectNulls />
      </LineChart>
    </ChartContainer>
  )
}

export function TagHoursChart({ month }: { month: MonthSummary }) {
  const data = month.byTag.map((t) => ({ ...t, hours: Math.round(t.hours * 10) / 10 }))
  return (
    <ChartContainer config={hoursCfg} className="w-full" style={{ height: Math.max(160, data.length * 44 + 40) }}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="tag" width={96} tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent formatter={row(hoursCfg, (v) => `${v} jam`)} />} />
        <Bar dataKey="hours" fill="var(--color-hours)" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
