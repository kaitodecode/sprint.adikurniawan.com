import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export const pct = (v: number | null, digits = 0) =>
  v == null ? '–' : `${(v * 100).toFixed(digits)}%`

export const hours = (v: number) => `${Math.round(v * 10) / 10}j`

export const num = (v: string | number) => {
  const n = typeof v === 'number' ? v : parseFloat(v.replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? n : 0
}
