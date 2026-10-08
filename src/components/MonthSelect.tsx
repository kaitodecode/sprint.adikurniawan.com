import { useState } from 'react'
import { useData } from '@/lib/data'
import { availableMonths, monthSummary } from '@/lib/metrics'
import { monthKey, monthLabel, mondayOf } from '@/lib/dates'
import { Pick } from '@/components/common'

export function useMonth() {
  const { sprints, tasks } = useData()
  const months = availableMonths(sprints)
  const current = monthKey(mondayOf())
  const [picked, setPicked] = useState<string>()
  const key = picked ?? (months.includes(current) ? current : months[0])
  const summary = key ? monthSummary(key, sprints, tasks) : undefined

  const select = months.length > 0 && (
    <Pick value={key} onChange={setPicked} options={months.map((m) => ({ value: m, label: monthLabel(m) }))} />
  )
  return { summary, select }
}
