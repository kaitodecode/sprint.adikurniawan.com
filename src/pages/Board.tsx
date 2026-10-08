import { useData } from '@/lib/data'
import { SprintPicker, useSelectedSprint } from '@/components/SprintPicker'
import { Badge, Button, Card, Empty, Input, PageTitle } from '@/components/ui'
import { hours, num } from '@/lib/utils'
import type { Status, Task } from '@/lib/types'

const columns: { status: Status; label: string; next?: Status; prev?: Status }[] = [
  { status: 'todo', label: 'To do', next: 'doing' },
  { status: 'doing', label: 'Doing', prev: 'todo', next: 'done' },
  { status: 'done', label: 'Done', prev: 'doing' },
]

function Item({ task, col }: { task: Task; col: (typeof columns)[number] }) {
  const { updateTask } = useData()
  return (
    <Card className="space-y-2 p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium">{task.title}</p>
        {task.is_stretch && <Badge tone="amber">stretch</Badge>}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
        {task.tag && <Badge tone="blue">{task.tag}</Badge>}
        <span>est {hours(task.est_hours)}</span>
        <label className="ml-auto flex items-center gap-1">
          aktual
          <Input
            key={task.actual_hours}
            className="w-16 text-right"
            defaultValue={task.actual_hours}
            onBlur={(e) => num(e.target.value) !== task.actual_hours && updateTask(task.id, { actual_hours: num(e.target.value) })}
          />
        </label>
      </div>
      <div className="flex justify-between">
        {col.prev ? <Button size="sm" variant="outline" onClick={() => updateTask(task.id, { status: col.prev })}>←</Button> : <span />}
        {col.next ? <Button size="sm" onClick={() => updateTask(task.id, { status: col.next })}>{col.next === 'done' ? 'Selesai ✓' : 'Mulai →'}</Button> : <span />}
      </div>
    </Card>
  )
}

export default function Board() {
  const { tasks } = useData()
  const [sprint, select] = useSelectedSprint()
  const items = tasks.filter((t) => t.sprint_id === sprint?.id)

  return (
    <>
      <PageTitle actions={<SprintPicker value={sprint} onChange={select} />}>Board</PageTitle>
      {!sprint ? (
        <Empty>Belum ada sprint.</Empty>
      ) : (
        <>
          {sprint.goal && <p className="mb-4 text-sm text-slate-600">Goal: {sprint.goal}</p>}
          <div className="grid gap-4 md:grid-cols-3">
            {columns.map((c) => {
              const list = items.filter((t) => t.status === c.status)
              return (
                <section key={c.status} className="space-y-2 rounded-lg bg-slate-100 p-3">
                  <h2 className="text-sm font-medium">
                    {c.label} <span className="text-slate-500">({list.length})</span>
                  </h2>
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
