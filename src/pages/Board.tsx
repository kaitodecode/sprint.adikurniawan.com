import { ArrowLeft, ArrowRight, Check, KanbanSquare } from 'lucide-react'
import { useData } from '@/lib/data'
import { SprintPicker, useSelectedSprint } from '@/components/SprintPicker'
import { EmptyState, PageHeader } from '@/components/common'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { cn, hours, num } from '@/lib/utils'
import type { Status, Task } from '@/lib/types'

const columns: { status: Status; label: string; dot: string; next?: Status; prev?: Status }[] = [
  { status: 'todo', label: 'To do', dot: 'bg-slate-400', next: 'doing' },
  { status: 'doing', label: 'Doing', dot: 'bg-amber-500', prev: 'todo', next: 'done' },
  { status: 'done', label: 'Done', dot: 'bg-emerald-500', prev: 'doing' },
]

function Item({ task, col }: { task: Task; col: (typeof columns)[number] }) {
  const { updateTask } = useData()
  const over = task.actual_hours > task.est_hours && task.est_hours > 0
  return (
    <Card className="gap-3 p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug">{task.title}</p>
        {task.is_stretch && <Badge variant="outline" className="shrink-0">stretch</Badge>}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {task.tag && <Badge variant="secondary">{task.tag}</Badge>}
        <span>est {hours(task.est_hours)}</span>
        <label className="ml-auto flex items-center gap-1.5">
          aktual
          <Input
            key={task.actual_hours}
            className={cn('h-7 w-16 text-right', over && 'border-amber-400')}
            defaultValue={task.actual_hours}
            onBlur={(e) => num(e.target.value) !== task.actual_hours && updateTask(task.id, { actual_hours: num(e.target.value) })}
          />
        </label>
      </div>
      <div className="flex justify-between">
        {col.prev ? <Button size="sm" variant="outline" onClick={() => updateTask(task.id, { status: col.prev })}><ArrowLeft /></Button> : <span />}
        {col.next && (
          <Button size="sm" onClick={() => updateTask(task.id, { status: col.next })}>
            {col.next === 'done' ? <><Check />Selesai</> : <>Mulai<ArrowRight /></>}
          </Button>
        )}
      </div>
    </Card>
  )
}

export default function Board() {
  const { tasks } = useData()
  const [sprint, select] = useSelectedSprint()
  const items = tasks.filter((t) => t.sprint_id === sprint?.id)
  const doneCount = items.filter((t) => t.status === 'done').length
  const progress = items.length ? (doneCount / items.length) * 100 : 0

  return (
    <>
      <PageHeader
        title="Board"
        description={sprint?.goal ? `Goal: ${sprint.goal}` : 'Geser task antar kolom dan catat jam aktual.'}
        actions={<SprintPicker value={sprint} onChange={select} />}
      />
      {!sprint ? (
        <EmptyState icon={<KanbanSquare className="size-8" />} title="Belum ada sprint">
          Buat sprint di menu Planning terlebih dahulu.
        </EmptyState>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-3 text-sm">
            <Progress value={progress} className="h-2 max-w-xs" />
            <span className="text-muted-foreground">{doneCount} dari {items.length} task selesai</span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {columns.map((c) => {
              const list = items.filter((t) => t.status === c.status)
              return (
                <section key={c.status} className="space-y-3 rounded-xl bg-muted/60 p-3">
                  <h2 className="flex items-center gap-2 text-sm font-medium">
                    <span className={cn('size-2 rounded-full', c.dot)} />
                    {c.label}
                    <Badge variant="outline">{list.length}</Badge>
                  </h2>
                  {list.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">Kosong</p>}
                  {list.map((t) => <Item key={t.id} task={t} col={c} />)}
                </section>
              )
            })}
          </div>
        </>
      )}
    </>
  )
}
