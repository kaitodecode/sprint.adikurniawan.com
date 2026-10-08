import { useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { useData } from '@/lib/data'
import { SprintPicker, useSelectedSprint } from '@/components/SprintPicker'
import { Badge, Button, Card, Dialog, Empty, Input, Label, PageTitle } from '@/components/ui'
import { addDays, formatDate, mondayOf } from '@/lib/dates'
import { cn, hours, num, pct } from '@/lib/utils'
import type { Task } from '@/lib/types'

function NewSprintDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const { sprints, createSprint } = useData()
  const latest = sprints[0]
  const [week, setWeek] = useState(latest ? addDays(latest.week_start, 7) : mondayOf())
  const [goal, setGoal] = useState('')
  const [cap, setCap] = useState(String(latest?.capacity_hours ?? 20))
  const [err, setErr] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const s = await createSprint({ week_start: week, goal, capacity_hours: num(cap) })
      onCreated(s.id)
      onClose()
    } catch (x) {
      setErr((x as Error).message)
    }
  }
  return (
    <Dialog open={open} onClose={onClose} title="Sprint baru">
      <form onSubmit={submit} className="space-y-3">
        <Label>
          Mulai minggu
          <Input type="date" required value={week} onChange={(e) => setWeek(e.target.value)} />
        </Label>
        <Label>
          Goal
          <Input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Apa yang ingin dicapai minggu ini?" />
        </Label>
        <Label>
          Kapasitas (jam)
          <Input inputMode="decimal" value={cap} onChange={(e) => setCap(e.target.value)} />
        </Label>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Batal</Button>
          <Button>Buat</Button>
        </div>
      </form>
    </Dialog>
  )
}

function TaskRow({ task, action }: { task: Task; action?: React.ReactNode }) {
  const { updateTask, deleteTask } = useData()
  return (
    <li className="flex flex-wrap items-center gap-2 py-2 text-sm">
      <span className="min-w-0 flex-1 truncate">
        {task.title}
        {task.carried_from && <span className="ml-1 text-xs text-slate-400">↻</span>}
      </span>
      {task.tag && <Badge tone="blue">{task.tag}</Badge>}
      <Input
        key={task.est_hours}
        className="w-16 text-right"
        aria-label="Estimasi jam"
        defaultValue={task.est_hours}
        onBlur={(e) => num(e.target.value) !== task.est_hours && updateTask(task.id, { est_hours: num(e.target.value) })}
      />
      <label className="flex items-center gap-1 text-xs text-slate-600">
        <input type="checkbox" checked={task.is_stretch} onChange={(e) => updateTask(task.id, { is_stretch: e.target.checked })} />
        stretch
      </label>
      <label className="flex items-center gap-1 text-xs text-slate-600">
        <input type="checkbox" checked={task.is_public} onChange={(e) => updateTask(task.id, { is_public: e.target.checked })} />
        publik
      </label>
      {action}
      <Button variant="ghost" size="icon" aria-label="Hapus" onClick={() => confirm(`Hapus "${task.title}"?`) && deleteTask(task.id)}>
        <Trash2 size={14} />
      </Button>
    </li>
  )
}

function AddTask({ sprintId }: { sprintId: string | null }) {
  const { createTask, tasks } = useData()
  const [title, setTitle] = useState('')
  const [tag, setTag] = useState('')
  const [est, setEst] = useState('1')
  const tagsKnown = [...new Set(tasks.map((t) => t.tag).filter(Boolean))]

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    await createTask({ title: title.trim(), tag: tag.trim(), est_hours: num(est), sprint_id: sprintId })
    setTitle('')
  }
  return (
    <form onSubmit={submit} className="mt-3 flex flex-wrap gap-2">
      <Input className="min-w-40 flex-1" placeholder="Judul task" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Input className="w-32" list="tags" placeholder="Tag/klien" value={tag} onChange={(e) => setTag(e.target.value)} />
      <datalist id="tags">{tagsKnown.map((t) => <option key={t} value={t} />)}</datalist>
      <Input className="w-16" aria-label="Estimasi jam" value={est} onChange={(e) => setEst(e.target.value)} />
      <Button>Tambah</Button>
    </form>
  )
}

export default function Planning() {
  const { tasks, updateSprint, deleteSprint, updateTask } = useData()
  const [sprint, select] = useSelectedSprint()
  const [dialog, setDialog] = useState(false)

  const sprintTasks = tasks.filter((t) => t.sprint_id === sprint?.id)
  const backlog = tasks.filter((t) => t.sprint_id === null)
  const planned = sprintTasks.filter((t) => !t.is_stretch).reduce((a, t) => a + t.est_hours, 0)
  const ratio = sprint && sprint.capacity_hours > 0 ? planned / sprint.capacity_hours : null
  const over = ratio != null && ratio > 1

  return (
    <>
      <PageTitle
        actions={
          <>
            <SprintPicker value={sprint} onChange={select} />
            <Button onClick={() => setDialog(true)}>Sprint baru</Button>
          </>
        }
      >
        Planning
      </PageTitle>
      <NewSprintDialog open={dialog} onClose={() => setDialog(false)} onCreated={select} />

      {!sprint ? (
        <Empty>Belum ada sprint. Buat sprint pertama untuk mulai merencanakan.</Empty>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <Card className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-medium">Sprint {formatDate(sprint.week_start)}</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => confirm('Hapus sprint ini? Task-nya kembali ke backlog.') && deleteSprint(sprint.id)}
                >
                  Hapus sprint
                </Button>
              </div>
              <Label>
                Goal
                <Input key={sprint.id + 'g'} defaultValue={sprint.goal} onBlur={(e) => e.target.value !== sprint.goal && updateSprint(sprint.id, { goal: e.target.value })} />
              </Label>
              <Label>
                Kapasitas (jam)
                <Input
                  key={sprint.id + 'c'}
                  className="w-28"
                  defaultValue={sprint.capacity_hours}
                  onBlur={(e) => num(e.target.value) !== sprint.capacity_hours && updateSprint(sprint.id, { capacity_hours: num(e.target.value) })}
                />
              </Label>
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span>
                    Estimasi {hours(planned)} / kapasitas {hours(sprint.capacity_hours)}
                  </span>
                  <span className={cn('font-medium', over && 'text-red-600')}>{pct(ratio)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className={cn('h-full', over ? 'bg-red-500' : 'bg-accent')} style={{ width: `${Math.min(ratio ?? 0, 1) * 100}%` }} />
                </div>
                {over && (
                  <p className="mt-2 rounded bg-red-50 p-2 text-sm text-red-700">
                    Overcommit: estimasi melebihi kapasitas {hours(planned - sprint.capacity_hours)}. Kurangi task atau jadikan stretch.
                  </p>
                )}
              </div>
            </Card>

            <Card>
              <h2 className="mb-1 font-medium">Task sprint ({sprintTasks.length})</h2>
              {sprintTasks.length === 0 ? (
                <p className="py-3 text-sm text-slate-500">Tarik task dari backlog atau tambah baru.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {sprintTasks.map((t) => (
                    <TaskRow key={t.id} task={t} action={<Button variant="outline" size="sm" onClick={() => updateTask(t.id, { sprint_id: null })}>← Backlog</Button>} />
                  ))}
                </ul>
              )}
              <AddTask sprintId={sprint.id} />
            </Card>
          </div>

          <Card>
            <h2 className="mb-1 font-medium">Backlog ({backlog.length})</h2>
            {backlog.length === 0 ? (
              <p className="py-3 text-sm text-slate-500">Backlog kosong.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {backlog.map((t) => (
                  <TaskRow key={t.id} task={t} action={<Button size="sm" onClick={() => updateTask(t.id, { sprint_id: sprint.id })}>Tarik →</Button>} />
                ))}
              </ul>
            )}
            <AddTask sprintId={null} />
          </Card>
        </div>
      )}
    </>
  )
}
