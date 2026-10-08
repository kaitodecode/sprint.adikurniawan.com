import { useSearchParams } from 'react-router-dom'
import { useData } from '@/lib/data'
import { formatShort, mondayOf } from '@/lib/dates'
import { Select } from '@/components/ui'
import type { Sprint } from '@/lib/types'

/** Sprint terpilih disimpan di URL (?s=id); default: sprint berjalan, lalu yang terbaru. */
export function useSelectedSprint(): [Sprint | undefined, (id: string) => void] {
  const { sprints } = useData()
  const [params, setParams] = useSearchParams()
  const today = mondayOf()
  const fallback = sprints.find((s) => s.week_start <= today) ?? sprints[0]
  const selected = sprints.find((s) => s.id === params.get('s')) ?? fallback
  return [selected, (id) => setParams({ s: id }, { replace: true })]
}

export function SprintPicker({ value, onChange }: { value?: Sprint; onChange: (id: string) => void }) {
  const { sprints } = useData()
  if (sprints.length === 0) return null
  return (
    <Select value={value?.id ?? ''} onChange={(e) => onChange(e.target.value)}>
      {sprints.map((s) => (
        <option key={s.id} value={s.id}>
          {formatShort(s.week_start)} – {s.goal || 'tanpa goal'}
        </option>
      ))}
    </Select>
  )
}
