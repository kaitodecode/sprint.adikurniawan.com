import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { MonthSummary, SprintMetrics } from '@/lib/metrics'
import { formatShort } from '@/lib/dates'

const ACCENT = '#1d4ed8'
const SECOND = '#94a3b8'
const pctFmt = (v: unknown) => `${Math.round(Number(v) * 100)}%`

export function MonthlyUtilChart({ month }: { month: MonthSummary }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={month.weekly.map((w) => ({ ...w, utilization: Math.round(w.utilization * 1000) / 1000 }))}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" />
        <YAxis tickFormatter={pctFmt} />
        <Tooltip formatter={(v) => [pctFmt(v), 'Utilisasi']} />
        <ReferenceLine y={1} stroke="#ef4444" strokeDasharray="4 4" />
        <Bar dataKey="utilization" fill={ACCENT} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function TrendChart({ metrics }: { metrics: SprintMetrics[] }) {
  const data = metrics.slice(-8).map((m) => ({
    label: formatShort(m.sprint.week_start),
    utilization: m.utilization,
    completion: m.completion,
  }))
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" />
        <YAxis tickFormatter={pctFmt} />
        <Tooltip formatter={(v) => pctFmt(v)} />
        <Legend />
        <Line type="monotone" dataKey="utilization" name="Utilisasi" stroke={ACCENT} strokeWidth={2} connectNulls />
        <Line type="monotone" dataKey="completion" name="Completion" stroke={SECOND} strokeWidth={2} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function TagHoursChart({ month }: { month: MonthSummary }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, month.byTag.length * 40 + 40)}>
      <BarChart data={month.byTag} layout="vertical" margin={{ left: 16 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" />
        <YAxis type="category" dataKey="tag" width={90} />
        <Tooltip formatter={(v) => [`${Math.round(Number(v) * 10) / 10} jam`, 'Aktual']} />
        <Bar dataKey="hours" fill={ACCENT} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
