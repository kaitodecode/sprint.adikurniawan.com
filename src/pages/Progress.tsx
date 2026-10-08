import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui'
import { formatDate } from '@/lib/dates'
import type { PublicProgress, Status } from '@/lib/types'

const labels: Record<Status, [string, 'slate' | 'amber' | 'green']> = {
  todo: ['Direncanakan', 'slate'],
  doing: ['Dikerjakan', 'amber'],
  done: ['Selesai', 'green'],
}

export default function Progress() {
  const { token } = useParams()
  const [data, setData] = useState<PublicProgress | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    void supabase.rpc('public_progress', { p_token: token ?? null }).then(({ data, error }) => {
      if (error) setError(error.message)
      else if ((data as PublicProgress).error) setError('Tautan tidak valid.')
      else setData(data as PublicProgress)
    })
  }, [token])

  return (
    <div className="mx-auto max-w-2xl p-4 py-10">
      <h1 className="text-2xl font-semibold">Progress</h1>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {!data && !error && <p className="mt-4 text-sm text-slate-500">Memuat…</p>}
      {data && !data.sprint && <p className="mt-4 text-sm text-slate-500">Belum ada sprint berjalan.</p>}
      {data?.sprint && (
        <>
          <p className="text-sm text-slate-500">Sprint minggu {formatDate(data.sprint.week_start)}</p>
          <div className="mt-6">
            <div className="mb-1 flex justify-between text-sm font-medium">
              <span>Selesai</span>
              <span>{data.percent}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full bg-accent" style={{ width: `${data.percent}%` }} />
            </div>
          </div>
          <ul className="mt-6 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
            {data.tasks.length === 0 && <li className="p-4 text-sm text-slate-500">Belum ada task publik.</li>}
            {data.tasks.map((t, i) => (
              <li key={i} className="flex items-center gap-2 p-3 text-sm">
                <span className="flex-1">{t.title}</span>
                {t.tag && <Badge tone="blue">{t.tag}</Badge>}
                <Badge tone={labels[t.status][1]}>{labels[t.status][0]}</Badge>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
