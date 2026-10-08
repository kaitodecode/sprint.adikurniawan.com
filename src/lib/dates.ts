const pad = (n: number) => String(n).padStart(2, '0')

export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const parseISO = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const addDays = (iso: string, days: number) => {
  const d = parseISO(iso)
  d.setDate(d.getDate() + days)
  return toISO(d)
}

export const mondayOf = (d = new Date()) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7))
  return toISO(x)
}

export const monthKey = (iso: string) => iso.slice(0, 7) // YYYY-MM

/** Minggu ke-n dalam bulan (1-4) berdasarkan week_start. Hari 29-31 digabung ke W4. */
export const weekOfMonth = (iso: string) => Math.min(4, Math.ceil(parseISO(iso).getDate() / 7))

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('id-ID', opts)

export const formatDate = (iso: string) =>
  fmt({ day: 'numeric', month: 'short', year: 'numeric' }).format(parseISO(iso))

export const formatShort = (iso: string) => fmt({ day: 'numeric', month: 'short' }).format(parseISO(iso))

export const monthLabel = (key: string) =>
  fmt({ month: 'long', year: 'numeric' }).format(parseISO(`${key}-01`))
