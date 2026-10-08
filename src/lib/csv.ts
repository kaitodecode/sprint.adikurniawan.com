import type { MonthSummary } from './metrics'
import { monthLabel } from './dates'

const esc = (v: string | number) => {
  const s = String(v)
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const row = (cells: (string | number)[]) => cells.map(esc).join(',')
const p = (v: number | null) => (v == null ? '' : (v * 100).toFixed(1) + '%')
const r = (v: number) => Math.round(v * 100) / 100

export function sprintsCsv(m: MonthSummary) {
  const lines = [row(['Minggu', 'Goal', 'Kapasitas (jam)', 'Aktual (jam)', 'Utilisasi', 'Completion', 'Carry-over'])]
  for (const s of m.sprints) {
    lines.push(
      row([s.sprint.week_start, s.sprint.goal, s.sprint.capacity_hours, r(s.actual), p(s.utilization), p(s.completion), s.carryOver]),
    )
  }
  lines.push(row(['Total', monthLabel(m.key), r(m.capacity), r(m.actual), p(m.utilization), p(m.completion), m.carryOver]))
  return lines.join('\n')
}

export function tagsCsv(m: MonthSummary) {
  const total = m.byTag.reduce((a, b) => a + b.hours, 0)
  return [
    row(['Tag/Klien', 'Jam aktual']),
    ...m.byTag.map((t) => row([t.tag, r(t.hours)])),
    row(['Total', r(total)]),
  ].join('\n')
}

export function download(filename: string, content: BlobPart, type = 'text/csv;charset=utf-8') {
  // BOM agar Excel membaca UTF-8 dengan benar
  const blob = new Blob(type.startsWith('text/csv') ? ['﻿', content] : [content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
