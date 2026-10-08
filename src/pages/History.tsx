import { Fragment, useState } from 'react'
import { ChevronDown, ChevronRight, History as HistoryIcon, Repeat } from 'lucide-react'
import { toast } from 'sonner'
import { useData } from '@/lib/data'
import { allMetrics, type SprintMetrics } from '@/lib/metrics'
import { EmptyState, Field, PageHeader, utilTone } from '@/components/common'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { formatDate } from '@/lib/dates'
import { cn, pct } from '@/lib/utils'

function Retro({ m }: { m: SprintMetrics }) {
  const { updateSprint, carryOver } = useData()
  const s = m.sprint
  const field = (key: 'retro_done' | 'retro_blocked' | 'retro_change', label: string) => (
    <Field label={label}>
      <Textarea
        rows={3}
        defaultValue={s[key]}
        onBlur={(e) => e.target.value !== s[key] && updateSprint(s.id, { [key]: e.target.value })}
      />
    </Field>
  )
  const open = m.tasks.filter((t) => t.status !== 'done' && !t.carried_over).length
  return (
    <div className="space-y-4 bg-muted/40 p-4">
      <div className="grid gap-3 md:grid-cols-3">
        {field('retro_done', 'Apa yang selesai?')}
        {field('retro_blocked', 'Apa yang menghambat?')}
        {field('retro_change', 'Apa yang diubah?')}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          disabled={open === 0}
          onClick={async () => toast.success(`${await carryOver(s.id)} task dipindah ke sprint berikutnya`)}
        >
          <Repeat />
          Carry-over {open} task belum selesai
        </Button>
        <span className="text-xs text-muted-foreground">Task disalin ke sprint minggu berikutnya; metrik sprint ini tetap utuh.</span>
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
      <PageHeader title="Riwayat sprint" description="Metrik tiap sprint dan catatan retro. Klik baris untuk membuka retro." />
      {rows.length === 0 ? (
        <EmptyState icon={<HistoryIcon className="size-8" />} title="Belum ada sprint">
          Riwayat akan muncul setelah kamu membuat sprint.
        </EmptyState>
      ) : (
        <Card className="overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-8" />
                <TableHead>Minggu</TableHead>
                <TableHead>Goal</TableHead>
                <TableHead className="text-right">Utilisasi</TableHead>
                <TableHead className="text-right">Completion</TableHead>
                <TableHead className="text-right">Akurasi estimasi</TableHead>
                <TableHead className="text-right">Carry-over</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((m) => {
                const isOpen = open === m.sprint.id
                return (
                  <Fragment key={m.sprint.id}>
                    <TableRow className="cursor-pointer" onClick={() => setOpen(isOpen ? null : m.sprint.id)}>
                      <TableCell>{isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}</TableCell>
                      <TableCell className="whitespace-nowrap font-medium">{formatDate(m.sprint.week_start)}</TableCell>
                      <TableCell className="max-w-64 truncate text-muted-foreground">{m.sprint.goal || '–'}</TableCell>
                      <TableCell className={cn('text-right font-medium', utilTone(m.utilization))}>{pct(m.utilization)}</TableCell>
                      <TableCell className="text-right">{pct(m.completion)}</TableCell>
                      <TableCell className="text-right">{pct(m.accuracy)}</TableCell>
                      <TableCell className="text-right">{m.carryOver}</TableCell>
                    </TableRow>
                    {isOpen && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={7} className="p-0">
                          <Retro m={m} />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}
      <ul className="mt-4 space-y-1 text-xs text-muted-foreground">
        <li><b>Utilisasi</b> = jam aktual ÷ kapasitas. <b>Completion</b> = estimasi task selesai ÷ terencana (tanpa stretch).</li>
        <li><b>Akurasi estimasi</b> = jam aktual ÷ estimasi pada task selesai; di atas 100% berarti estimasi terlalu rendah.</li>
      </ul>
    </>
  )
}
