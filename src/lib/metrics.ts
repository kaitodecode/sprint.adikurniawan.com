import type { Sprint, Task } from './types'
import { monthKey, weekOfMonth } from './dates'

export interface SprintMetrics {
  sprint: Sprint
  tasks: Task[]
  actual: number
  planned: number
  utilization: number | null // jam aktual / kapasitas
  completion: number | null // estimasi selesai / estimasi terencana (tanpa stretch)
  accuracy: number | null // jam aktual / estimasi (task selesai)
  carryOver: number
}

const ratio = (a: number, b: number) => (b > 0 ? a / b : null)
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

export function sprintMetrics(sprint: Sprint, allTasks: Task[]): SprintMetrics {
  const tasks = allTasks.filter((t) => t.sprint_id === sprint.id)
  const core = tasks.filter((t) => !t.is_stretch)
  const done = tasks.filter((t) => t.status === 'done')
  const doneCore = core.filter((t) => t.status === 'done')
  const actual = sum(tasks.map((t) => t.actual_hours))
  const planned = sum(core.map((t) => t.est_hours))
  return {
    sprint,
    tasks,
    actual,
    planned,
    utilization: ratio(actual, sprint.capacity_hours),
    completion: ratio(sum(doneCore.map((t) => t.est_hours)), planned),
    accuracy: ratio(sum(done.map((t) => t.actual_hours)), sum(done.map((t) => t.est_hours))),
    carryOver: tasks.filter((t) => t.carried_over).length,
  }
}

export const allMetrics = (sprints: Sprint[], tasks: Task[]) =>
  [...sprints]
    .sort((a, b) => a.week_start.localeCompare(b.week_start))
    .map((s) => sprintMetrics(s, tasks))

export interface MonthSummary {
  key: string
  sprints: SprintMetrics[]
  capacity: number
  actual: number
  utilization: number | null
  completion: number | null
  accuracy: number | null
  carryOver: number
  weekly: { label: string; utilization: number }[] // W1-W4
  byTag: { tag: string; hours: number }[]
}

export function monthSummary(key: string, sprints: Sprint[], tasks: Task[]): MonthSummary {
  const ms = allMetrics(sprints.filter((s) => monthKey(s.week_start) === key), tasks)
  const monthTasks = ms.flatMap((m) => m.tasks)
  const capacity = sum(ms.map((m) => m.sprint.capacity_hours))
  const actual = sum(ms.map((m) => m.actual))
  const planned = sum(ms.map((m) => m.planned))
  const doneCore = sum(monthTasks.filter((t) => !t.is_stretch && t.status === 'done').map((t) => t.est_hours))
  const done = monthTasks.filter((t) => t.status === 'done')

  const weekly = [1, 2, 3, 4].map((w) => {
    const inWeek = ms.filter((m) => weekOfMonth(m.sprint.week_start) === w)
    const cap = sum(inWeek.map((m) => m.sprint.capacity_hours))
    return { label: `W${w}`, utilization: cap > 0 ? sum(inWeek.map((m) => m.actual)) / cap : 0 }
  })

  const tags = new Map<string, number>()
  for (const t of monthTasks) {
    if (t.actual_hours <= 0) continue
    const tag = t.tag.trim() || '(tanpa tag)'
    tags.set(tag, (tags.get(tag) ?? 0) + t.actual_hours)
  }

  return {
    key,
    sprints: ms,
    capacity,
    actual,
    utilization: ratio(actual, capacity),
    completion: ratio(doneCore, planned),
    accuracy: ratio(sum(done.map((t) => t.actual_hours)), sum(done.map((t) => t.est_hours))),
    carryOver: sum(ms.map((m) => m.carryOver)),
    weekly,
    byTag: [...tags].map(([tag, h]) => ({ tag, hours: h })).sort((a, b) => b.hours - a.hours),
  }
}

export function availableMonths(sprints: Sprint[]) {
  const keys = new Set(sprints.map((s) => monthKey(s.week_start)))
  return [...keys].sort().reverse()
}
