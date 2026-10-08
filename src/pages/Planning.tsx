import { useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, ListPlus, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useData } from '@/lib/data'
import { SprintPicker, useSelectedSprint } from '@/components/SprintPicker'
import { EmptyState, Field, PageHeader } from '@/components/common'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { addDays, formatDate, mondayOf } from '@/lib/dates'
import { cn, hours, num, pct } from '@/lib/utils'
import type { Task } from '@/lib/types'

function NewSprintDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const { sprints, createSprint } = useData()
  const latest = sprints[0]
  const [week, setWeek] = useState(latest ? addDays(latest.week_start, 7) : mondayOf())
  const [goal, setGoal] = useState('')
  const [cap, setCap] = useState(String(latest?.capacity_hours ?? 20))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const s = await createSprint({ week_start: week, goal, capacity_hours: num(cap) })
      toast.success('Sprint dibuat')
      onCreated(s.id)
      onClose()
    } catch (x) {
      toast.error((x as Error).message)
    }
  }
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sprint baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Mulai minggu">
            <Input type="date" required value={week} onChange={(e) => setWeek(e.target.value)} />
          </Field>
          <Field label="Goal">
            <Input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Apa yang ingin dicapai minggu ini?" />
          </Field>
          <Field label="Kapasitas (jam)">
            <Input inputMode="decimal" value={cap} onChange={(e) => setCap(e.target.value)} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Batal</Button>
            <Button>Buat sprint</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function TaskRow({ task, action }: { task: Task; action?: React.ReactNode }) {
  const { updateTask, deleteTask } = useData()
  return (
    <li className="flex flex-wrap items-center gap-2 py-2.5 text-sm">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {task.title}
          {task.carried_from && <span className="ml-1.5 text-xs font-normal text-muted-foreground" title="Carry-over">↻ carry-over</span>}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {task.tag && <Badge variant="secondary">{task.tag}</Badge>}
          <label className="flex items-center gap-1.5">
            <Checkbox checked={task.is_stretch} onCheckedChange={(c) => updateTask(task.id, { is_stretch: c === true })} />
            stretch
          </label>
          <label className="flex items-center gap-1.5">
            <Checkbox checked={task.is_public} onCheckedChange={(c) => updateTask(task.id, { is_public: c === true })} />
            publik
          </label>
        </div>
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Input
          key={task.est_hours}
          className="h-8 w-16 text-right"
          aria-label="Estimasi jam"
          defaultValue={task.est_hours}
          onBlur={(e) => num(e.target.value) !== task.est_hours && updateTask(task.id, { est_hours: num(e.target.value) })}
        />
        jam
      </div>
      {action}
      <Button variant="ghost" size="icon" className="size-8" aria-label="Hapus" onClick={() => confirm(`Hapus "${task.title}"?`) && deleteTask(task.id)}>
        <Trash2 className="size-4" />
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
  const listId = `tags-${sprintId ?? 'backlog'}`

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    await createTask({ title: title.trim(), tag: tag.trim(), est_hours: num(est), sprint_id: sprintId })
    setTitle('')
  }
  return (
    <form onSubmit={submit} className="mt-4 flex flex-wrap gap-2 border-t pt-4">
      <Input className="min-w-40 flex-1" placeholder="Judul task baru" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Input className="w-32" list={listId} placeholder="Tag/klien" value={tag} onChange={(e) => setTag(e.target.value)} />
      <datalist id={listId}>{tagsKnown.map((t) => <option key={t} value={t} />)}</datalist>
      <Input className="w-16" aria-label="Estimasi jam" value={est} onChange={(e) => setEst(e.target.value)} />
      <Button><Plus />Tambah</Button>
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
  const stretch = sprintTasks.filter((t) => t.is_stretch).reduce((a, t) => a + t.est_hours, 0)
  const ratio = sprint && sprint.capacity_hours > 0 ? planned / sprint.capacity_hours : null
  const over = ratio != null && ratio > 1

  return (
    <>
      <PageHeader
        title="Planning"
        description="Tentukan goal dan kapasitas, lalu tarik task dari backlog sampai muat."
        actions={
          <>
            <SprintPicker value={sprint} onChange={select} />
            <Button onClick={() => setDialog(true)}><ListPlus />Sprint baru</Button>
          </>
        }
      />
      <NewSprintDialog open={dialog} onClose={() => setDialog(false)} onCreated={select} />

      {!sprint ? (
        <EmptyState icon={<ListPlus className="size-8" />} title="Belum ada sprint">
          Buat sprint pertama untuk mulai merencanakan.
        </EmptyState>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sprint {formatDate(sprint.week_start)}</CardTitle>
                <CardDescription>Estimasi vs kapasitas dihitung tanpa task stretch.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="Goal">
                  <Input key={sprint.id + 'g'} defaultValue={sprint.goal} onBlur={(e) => e.target.value !== sprint.goal && updateSprint(sprint.id, { goal: e.target.value })} />
                </Field>
                <Field label="Kapasitas (jam)">
                  <Input
                    key={sprint.id + 'c'}
                    className="w-28"
                    defaultValue={sprint.capacity_hours}
                    onBlur={(e) => num(e.target.value) !== sprint.capacity_hours && updateSprint(sprint.id, { capacity_hours: num(e.target.value) })}
                  />
                </Field>
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between text-sm">
                    <span>
                      <span className="font-semibold">{hours(planned)}</span> dari {hours(sprint.capacity_hours)}
                      {stretch > 0 && <span className="text-muted-foreground"> · +{hours(stretch)} stretch</span>}
                    </span>
                    <span className={cn('text-lg font-semibold', over ? 'text-destructive' : 'text-primary')}>{pct(ratio)}</span>
                  </div>
                  <Progress value={Math.min(ratio ?? 0, 1) * 100} className={cn('h-2.5', over && '[&>div]:bg-destructive')} />
                  <p className="text-xs text-muted-foreground">
                    {over ? '' : ratio != null && `Sisa kapasitas ${hours(sprint.capacity_hours - planned)}.`}
                  </p>
                </div>
                {over && (
                  <Alert variant="destructive">
                    <AlertTitle>Overcommit</AlertTitle>
                    <AlertDescription>
                      Estimasi melebihi kapasitas {hours(planned - sprint.capacity_hours)}. Kurangi task atau jadikan stretch.
                    </AlertDescription>
                  </Alert>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  onClick={() => confirm('Hapus sprint ini? Task-nya kembali ke backlog.') && deleteSprint(sprint.id)}
                >
                  <Trash2 />Hapus sprint
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Task sprint <Badge variant="outline">{sprintTasks.length}</Badge></CardTitle>
              </CardHeader>
              <CardContent>
                {sprintTasks.length === 0 ? (
                  <p className="py-3 text-sm text-muted-foreground">Tarik task dari backlog atau tambah baru di bawah.</p>
                ) : (
                  <ul className="divide-y">
                    {sprintTasks.map((t) => (
                      <TaskRow key={t.id} task={t} action={<Button variant="outline" size="sm" onClick={() => updateTask(t.id, { sprint_id: null })}><ArrowLeft />Backlog</Button>} />
                    ))}
                  </ul>
                )}
                <AddTask sprintId={sprint.id} />
              </CardContent>
            </Card>
          </div>

          <Card className="self-start">
            <CardHeader>
              <CardTitle>Backlog <Badge variant="outline">{backlog.length}</Badge></CardTitle>
              <CardDescription>Task yang belum masuk sprint.</CardDescription>
            </CardHeader>
            <CardContent>
              {backlog.length === 0 ? (
                <p className="py-3 text-sm text-muted-foreground">Backlog kosong.</p>
              ) : (
                <ul className="divide-y">
                  {backlog.map((t) => (
                    <TaskRow key={t.id} task={t} action={<Button size="sm" onClick={() => updateTask(t.id, { sprint_id: sprint.id })}>Tarik<ArrowRight /></Button>} />
                  ))}
                </ul>
              )}
              <AddTask sprintId={null} />
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
