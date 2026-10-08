export type Status = 'todo' | 'doing' | 'done'

export interface Sprint {
  id: string
  week_start: string // YYYY-MM-DD
  goal: string
  capacity_hours: number
  retro_done: string
  retro_blocked: string
  retro_change: string
}

export interface Task {
  id: string
  sprint_id: string | null
  title: string
  tag: string
  est_hours: number
  actual_hours: number
  status: Status
  is_stretch: boolean
  is_public: boolean
  done_at: string | null
  position: number
  carried_over: boolean
  carried_from: string | null
  created_at: string
}

export interface ShareToken {
  token: string
  tag: string
}

export interface PublicProgress {
  error?: string
  sprint: { week_start: string } | null
  percent: number
  tasks: { title: string; tag: string; status: Status }[]
}
