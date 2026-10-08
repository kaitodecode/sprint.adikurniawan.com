import { Fragment, useState } from 'react'
import { useData } from '@/lib/data'
import { allMetrics, type SprintMetrics } from '@/lib/metrics'
import { Button, Card, Empty, PageTitle, Textarea, Label } from '@/components/ui'
import { formatDate } from '@/lib/dates'
import { pct } from '@/lib/utils'

function Retro({ m }: { m: SprintMetrics }) {
  const { updateSprint, carryOver } = useData()
  const s = m.sprint
  const [msg, setMsg] = useState('')
  const field = (key: 'retro_done' | 'retro_blocked' | 'retro_change', label: string) => (
    <Label>
      {label}
      <Textarea defaultValue={s[key]} onBlur={(e) => e.target.value !== s[key] && updateSprint(s.id, { [key]: e.target.value })} />
    </Label>
  )
  const open = m.tasks.filter((t) => t.status !== 'done' && !t.carried_over).length
  return (
    <div className="space-y-3 bg-slate-50 p-4">
      <div className="grid gap-3 md:grid-cols-3">
        {field('retro_done', 'Apa yang selesai?')}
        {field('retro_blocked', 'Apa yang menghambat?')}
        {field('retro_change', 'Apa yang diubah?')}
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          disabled={open === 0}
          onClick={async () => setMsg(`${await carryOver(s.id)} task dipindah ke sprint berikutnya.`)}
        >
          Carry-over {open} task belum selesai
        </Button>
        {msg && <span className="text-sm text-green-700">{msg}</span>}
      </div>
    </div>
  )
}

export default function History() {
  const { sprints, tasks } = useData()
  const [open, setOpen] = useState<string | null>(null)
  const rows = allMetrics(sprints, tasks).reverse()

  return (
    <>
      <PageTitle>Riwayat sprint</PageTitle>
      {rows.length === 0 ? (
        <Empty>Belum ada sprint.</Empty>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left text-xs text-slate-600">
              <tr>
                <th className="p-3">Minggu</th>
                <th className="p-3">Goal</th>
                <th className="p-3 text-right">Utilisasi</th>
                <th className="p-3 text-right">Completion</th>
                <th className="p-3 text-right">Akurasi estimasi</th>
                <th className="p-3 text-right">Carry-over</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <Fragment key={m.sprint.id}>
                  <tr className="border-t border-slate-100">
                    <td className="p-3 whitespace-nowrap">{formatDate(m.sprint.week_start)}</td>
                    <td className="p-3">{m.sprint.goal || '–'}</td>
                    <td className="p-3 text-right">{pct(m.utilization)}</td>
                    <td className="p-3 text-right">{pct(m.completion)}</td>
                    <td className="p-3 text-right">{pct(m.accuracy)}</td>
                    <td className="p-3 text-right">{m.carryOver}</td>
                    <td className="p-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setOpen(open === m.sprint.id ? null : m.sprint.id)}>
                        Retro
                      </Button>
                    </td>
                  </tr>
                  {open === m.sprint.id && (
                    <tr>
                      <td colSpan={7} className="p-0"><Retro m={m} /></td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      <p className="mt-3 text-xs text-slate-500">
        Akurasi estimasi: 100% = tepat; &gt;100% berarti estimasi terlalu rendah. Completion tidak menghitung task stretch.
      </p>
    </>
  )
}
