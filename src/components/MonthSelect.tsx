import { useState } from 'react'
import { useData } from '@/lib/data'
import { availableMonths, monthSummary } from '@/lib/metrics'
import { monthKey, monthLabel, mondayOf } from '@/lib/dates'
import { Select } from '@/components/ui'

export function useMonth() {
  const { sprints, tasks } = useData()
  const months = availableMonths(sprints)
  const current = monthKey(mondayOf())
  const [picked, setPicked] = useState<string>()
  const key = picked ?? (months.includes(current) ? current : months[0])
  const summary = key ? monthSummary(key, sprints, tasks) : undefined

  const select = months.length > 0 && (
    <Select value={key} onChange={(e) => setPicked(e.target.value)} aria-label="Bulan">
      {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
    </Select>
  )
  return { summary, select }
}
