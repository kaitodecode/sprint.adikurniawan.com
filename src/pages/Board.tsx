import { useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowLeft, ArrowRight, Check, GripVertical, KanbanSquare } from 'lucide-react'
import { toast } from 'sonner'
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
const statuses = columns.map((c) => c.status)
type Cols = Record<Status, string[]>

const buildCols = (items: Task[]): Cols => {
  const sorted = [...items].sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at))
  return {
    todo: sorted.filter((t) => t.status === 'todo').map((t) => t.id),
    doing: sorted.filter((t) => t.status === 'doing').map((t) => t.id),
    done: sorted.filter((t) => t.status === 'done').map((t) => t.id),
  }
}
const findCol = (cols: Cols, id: string): Status | undefined =>
  (statuses as string[]).includes(id) ? (id as Status) : statuses.find((s) => cols[s].includes(id))

function Body({ task, col, handle }: { task: Task; col: (typeof columns)[number]; handle?: React.HTMLAttributes<HTMLElement> }) {
  const { updateTask } = useData()
  const over = task.actual_hours > task.est_hours && task.est_hours > 0
  return (
    <>
      <div className="flex items-start gap-1.5">
        <button
          type="button"
          aria-label="Seret task"
          className="-ml-1 mt-0.5 cursor-grab touch-none rounded p-0.5 text-muted-foreground hover:bg-muted active:cursor-grabbing"
          {...handle}
        >
          <GripVertical className="size-4" />
        </button>
        <p className="flex-1 text-sm font-medium leading-snug">{task.title}</p>
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
        {col.prev ? <Button size="sm" variant="outline" aria-label="Mundur" onClick={() => updateTask(task.id, { status: col.prev })}><ArrowLeft /></Button> : <span />}
        {col.next && (
          <Button size="sm" onClick={() => updateTask(task.id, { status: col.next })}>
            {col.next === 'done' ? <><Check />Selesai</> : <>Mulai<ArrowRight /></>}
          </Button>
        )}
      </div>
    </>
  )
}

function SortableItem({ task, col }: { task: Task; col: (typeof columns)[number] }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  return (
    <Card
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn('gap-3 p-3', isDragging && 'opacity-40')}
    >
      <Body task={task} col={col} handle={{ ...attributes, ...listeners }} />
    </Card>
  )
}

function Column({ col, ids, byId }: { col: (typeof columns)[number]; ids: string[]; byId: Map<string, Task> }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.status })
  return (
    <section className={cn('flex min-h-48 flex-col gap-3 rounded-xl bg-muted/60 p-3 transition-colors', isOver && 'bg-accent')}>
      <h2 className="flex items-center gap-2 text-sm font-medium">
        <span className={cn('size-2 rounded-full', col.dot)} />
        {col.label}
        <Badge variant="outline">{ids.length}</Badge>
      </h2>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="flex flex-1 flex-col gap-3">
          {ids.map((id) => {
            const t = byId.get(id)
            return t ? <SortableItem key={id} task={t} col={col} /> : null
          })}
          {ids.length === 0 && (
            <p className="flex flex-1 items-center justify-center rounded-lg border border-dashed py-6 text-xs text-muted-foreground">
              Letakkan task di sini
            </p>
          )}
        </div>
      </SortableContext>
    </section>
  )
}

export default function Board() {
  const { tasks, moveTasks } = useData()
  const [sprint, select] = useSelectedSprint()
  const items = useMemo(() => tasks.filter((t) => t.sprint_id === sprint?.id), [tasks, sprint?.id])
  const byId = useMemo(() => new Map(items.map((t) => [t.id, t])), [items])
  const [cols, setCols] = useState<Cols>(() => buildCols(items))
  const [activeId, setActiveId] = useState<string | null>(null)

  // Sinkron dari data server, kecuali sedang menyeret.
  useEffect(() => {
    if (!activeId) setCols(buildCols(items))
  }, [items, activeId])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id))

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return
    const a = String(active.id)
    const o = String(over.id)
    setCols((prev) => {
      const from = findCol(prev, a)
      const to = findCol(prev, o)
      if (!from || !to || from === to) return prev
      const overIdx = prev[to].indexOf(o)
      const isBelow = over.rect && active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height / 2
      const at = overIdx < 0 ? prev[to].length : overIdx + (isBelow ? 1 : 0)
      return {
        ...prev,
        [from]: prev[from].filter((id) => id !== a),
        [to]: [...prev[to].slice(0, at), a, ...prev[to].slice(at)],
      }
    })
  }

  const onDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveId(null)
    const a = String(active.id)
    let next = cols
    if (over) {
      const from = findCol(cols, a)
      const to = findCol(cols, String(over.id))
      if (from && to && from === to) {
        const oldIdx = cols[from].indexOf(a)
        const newIdx = cols[to].indexOf(String(over.id))
        if (newIdx >= 0 && oldIdx !== newIdx) next = { ...cols, [from]: arrayMove(cols[from], oldIdx, newIdx) }
      }
    }
    setCols(next)
    const updates = statuses.flatMap((s) =>
      next[s].flatMap((id, i) => {
        const t = byId.get(id)
        if (!t || (t.status === s && t.position === i)) return []
        return [{ id, patch: { status: s, position: i } as Partial<Task> }]
      }),
    )
    try {
      await moveTasks(updates)
    } catch (err) {
      toast.error(`Gagal menyimpan: ${(err as Error).message}`)
    }
  }

  const doneCount = cols.done.length
  const progress = items.length ? (doneCount / items.length) * 100 : 0
  const active = activeId ? byId.get(activeId) : undefined
  const activeCol = active ? columns.find((c) => c.status === findCol(cols, active.id)) : undefined

  return (
    <>
      <PageHeader
        title="Board"
        description={sprint?.goal ? `Goal: ${sprint.goal}` : 'Seret task antar kolom untuk mengubah status, atau urutkan di dalam kolom.'}
        actions={<SprintPicker value={sprint} onChange={select} />}
      />
      {!sprint ? (
        <EmptyState icon={<KanbanSquare className="size-8" />} title="Belum ada sprint">
          Buat sprint di menu Planning terlebih dahulu.
        </EmptyState>
      ) : (
        <>
          <div className="mb-3 flex items-center gap-3 text-sm">
            <Progress value={progress} className="h-2 max-w-xs" />
            <span className="text-muted-foreground">{doneCount} dari {items.length} task selesai</span>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
            <div className="grid items-stretch gap-3 md:grid-cols-3">
              {columns.map((c) => <Column key={c.status} col={c} ids={cols[c.status]} byId={byId} />)}
            </div>
            <DragOverlay>
              {active && activeCol ? (
                <Card className="gap-3 rotate-2 p-3 shadow-xl ring-2 ring-primary/40">
                  <Body task={active} col={activeCol} />
                </Card>
              ) : null}
            </DragOverlay>
          </DndContext>
        </>
      )}
    </>
  )
}
