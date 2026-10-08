import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from './supabase'
import { addDays } from './dates'
import type { ShareToken, Sprint, Task } from './types'

interface DataCtx {
  sprints: Sprint[]
  tasks: Task[]
  tokens: ShareToken[]
  loading: boolean
  error: string | null
  reload: () => Promise<void>
  createSprint: (s: Partial<Sprint> & { week_start: string }) => Promise<Sprint>
  updateSprint: (id: string, patch: Partial<Sprint>) => Promise<void>
  deleteSprint: (id: string) => Promise<void>
  createTask: (t: Partial<Task> & { title: string }) => Promise<void>
  updateTask: (id: string, patch: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  moveTasks: (updates: { id: string; patch: Partial<Task> }[]) => Promise<void>
  carryOver: (sprintId: string) => Promise<number>
  createToken: (token: string, tag: string) => Promise<void>
  deleteToken: (token: string) => Promise<void>
}

const Ctx = createContext<DataCtx | null>(null)

export const useData = () => {
  const c = useContext(Ctx)
  if (!c) throw new Error('useData di luar DataProvider')
  return c
}

const check = (error: { message: string } | null) => {
  if (error) throw new Error(error.message)
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [tokens, setTokens] = useState<ShareToken[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const [s, t, k] = await Promise.all([
      supabase.from('sprints').select('*').order('week_start', { ascending: false }),
      supabase.from('tasks').select('*').order('position').order('created_at'),
      supabase.from('share_tokens').select('token, tag'),
    ])
    const err = s.error ?? t.error ?? k.error
    if (err) setError(err.message)
    else setError(null)
    setSprints((s.data ?? []) as Sprint[])
    setTasks((t.data ?? []) as Task[])
    setTokens((k.data ?? []) as ShareToken[])
    setLoading(false)
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const run = async (fn: () => PromiseLike<{ error: { message: string } | null }>) => {
    check((await fn()).error)
    await reload()
  }

  const value: DataCtx = {
    sprints,
    tasks,
    tokens,
    loading,
    error,
    reload,
    async createSprint(s) {
      const { data, error } = await supabase.from('sprints').insert(s).select().single()
      check(error)
      await reload()
      return data as Sprint
    },
    updateSprint: (id, patch) => run(() => supabase.from('sprints').update(patch).eq('id', id)),
    deleteSprint: (id) => run(() => supabase.from('sprints').delete().eq('id', id)),
    createTask: (t) => run(() => supabase.from('tasks').insert(t)),
    updateTask(id, patch) {
      const next = { ...patch }
      if (patch.status) next.done_at = patch.status === 'done' ? new Date().toISOString() : null
      return run(() => supabase.from('tasks').update(next).eq('id', id))
    },
    /** Pindah/urutkan banyak task sekaligus; UI diperbarui dulu (optimistic), lalu disimpan. */
    async moveTasks(updates) {
      if (updates.length === 0) return
      const prep = updates.map((u) => ({
        id: u.id,
        patch: u.patch.status ? { ...u.patch, done_at: u.patch.status === 'done' ? new Date().toISOString() : null } : u.patch,
      }))
      setTasks((prev) => prev.map((t) => {
        const u = prep.find((x) => x.id === t.id)
        return u ? { ...t, ...u.patch } : t
      }))
      const results = await Promise.all(prep.map((u) => supabase.from('tasks').update(u.patch).eq('id', u.id)))
      await reload()
      const failed = results.find((r) => r.error)
      if (failed?.error) throw new Error(failed.error.message)
    },
    deleteTask: (id) => run(() => supabase.from('tasks').delete().eq('id', id)),
    /** Salin task yang belum selesai ke sprint berikutnya; task asal ditandai carried_over. */
    async carryOver(sprintId) {
      const from = sprints.find((s) => s.id === sprintId)
      if (!from) return 0
      const open = tasks.filter((t) => t.sprint_id === sprintId && t.status !== 'done' && !t.carried_over)
      if (open.length === 0) return 0
      const nextStart = addDays(from.week_start, 7)
      let next = sprints.find((s) => s.week_start === nextStart)
      if (!next) next = await value.createSprint({ week_start: nextStart, capacity_hours: from.capacity_hours })
      const copies = open.map((t) => ({
        sprint_id: next!.id,
        title: t.title,
        tag: t.tag,
        est_hours: Math.max(t.est_hours - t.actual_hours, 0) || t.est_hours,
        is_stretch: t.is_stretch,
        is_public: t.is_public,
        carried_from: t.id,
      }))
      check((await supabase.from('tasks').insert(copies)).error)
      await run(() =>
        supabase.from('tasks').update({ carried_over: true }).in('id', open.map((t) => t.id)),
      )
      return open.length
    },
    createToken: (token, tag) => run(() => supabase.from('share_tokens').insert({ token, tag })),
    deleteToken: (token) => run(() => supabase.from('share_tokens').delete().eq('token', token)),
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
