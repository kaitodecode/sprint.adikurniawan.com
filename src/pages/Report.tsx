import { useState, type FormEvent } from 'react'
import { useData } from '@/lib/data'
import { useMonth } from '@/components/MonthSelect'
import { Kpi } from '@/components/Kpi'
import { MonthlyUtilChart } from '@/components/Charts'
import { Button, Card, Empty, Input, PageTitle } from '@/components/ui'
import { download, sprintsCsv, tagsCsv } from '@/lib/csv'
import { formatDate, monthLabel } from '@/lib/dates'
import { hours, pct } from '@/lib/utils'
import { Trash2 } from 'lucide-react'

function ShareLinks() {
  const { tokens, tasks, createToken, deleteToken } = useData()
  const [tag, setTag] = useState('')
  const known = [...new Set(tasks.map((t) => t.tag).filter(Boolean))]
  const add = async (e: FormEvent) => {
    e.preventDefault()
    if (!tag.trim()) return
    await createToken(crypto.randomUUID().replace(/-/g, '').slice(0, 16), tag.trim())
    setTag('')
  }
  return (
    <Card className="mt-6">
      <h2 className="mb-1 font-medium">Tautan progres publik</h2>
      <p className="mb-3 text-sm text-slate-500">
        <code>/progress</code> menampilkan semua task publik. Buat token untuk membatasi ke satu tag/klien.
      </p>
      <ul className="divide-y divide-slate-100 text-sm">
        {tokens.map((t) => {
          const url = `${location.origin}/progress/${t.token}`
          return (
            <li key={t.token} className="flex items-center gap-2 py-2">
              <span className="w-28 shrink-0 font-medium">{t.tag}</span>
              <code className="min-w-0 flex-1 truncate text-xs">{url}</code>
              <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(url)}>Salin</Button>
              <Button size="icon" variant="ghost" aria-label="Hapus" onClick={() => deleteToken(t.token)}><Trash2 size={14} /></Button>
            </li>
          )
        })}
      </ul>
      <form onSubmit={add} className="mt-3 flex gap-2">
        <Input list="share-tags" className="w-48" placeholder="Tag/klien" value={tag} onChange={(e) => setTag(e.target.value)} />
        <datalist id="share-tags">{known.map((t) => <option key={t} value={t} />)}</datalist>
        <Button>Buat token</Button>
      </form>
    </Card>
  )
}

export default function Report() {
  const { summary, select } = useMonth()
  const [busy, setBusy] = useState(false)
  const [name, setName] = useState(() => localStorage.getItem('report-name') ?? '')

  if (!summary) return (
    <>
      <PageTitle>Laporan bulanan</PageTitle>
      <Empty>Belum ada data sprint.</Empty>
    </>
  )

  const pdf = async () => {
    setBusy(true)
    try {
      localStorage.setItem('report-name', name)
      const [{ pdf }, { MonthlyReport }] = await Promise.all([import('@react-pdf/renderer'), import('@/pdf/MonthlyReport')])
      const blob = await pdf(<MonthlyReport month={summary} name={name || 'Sprint Tracker'} />).toBlob()
      download(`laporan-${summary.key}.pdf`, blob, 'application/pdf')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageTitle actions={select}>Laporan bulanan</PageTitle>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Utilisasi" value={pct(summary.utilization)} hint={`${hours(summary.actual)} dari ${hours(summary.capacity)}`} />
        <Kpi label="Completion" value={pct(summary.completion)} />
        <Kpi label="Akurasi estimasi" value={pct(summary.accuracy)} />
        <Kpi label="Carry-over" value={String(summary.carryOver)} />
      </div>
      <Card className="mb-4">
        <h2 className="mb-2 font-medium">Utilitas bulanan (W1–W4)</h2>
        <MonthlyUtilChart month={summary} />
      </Card>
      <Card className="mb-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-slate-500">
            <tr><th className="py-1">Minggu</th><th>Goal</th><th className="text-right">Kapasitas</th><th className="text-right">Aktual</th><th className="text-right">Utilisasi</th></tr>
          </thead>
          <tbody>
            {summary.sprints.map((m) => (
              <tr key={m.sprint.id} className="border-t border-slate-100">
                <td className="py-1.5">{formatDate(m.sprint.week_start)}</td>
                <td>{m.sprint.goal || '–'}</td>
                <td className="text-right">{hours(m.sprint.capacity_hours)}</td>
                <td className="text-right">{hours(m.actual)}</td>
                <td className="text-right">{pct(m.utilization)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card className="flex flex-wrap items-end gap-3">
        <label className="space-y-1 text-xs font-medium text-slate-600">
          Nama di header PDF
          <Input className="w-56" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama Anda / bisnis" />
        </label>
        <Button variant="outline" onClick={() => download(`sprint-${summary.key}.csv`, sprintsCsv(summary))}>CSV sprint</Button>
        <Button variant="outline" onClick={() => download(`jam-per-tag-${summary.key}.csv`, tagsCsv(summary))}>CSV jam per tag</Button>
        <Button onClick={pdf} disabled={busy}>{busy ? 'Membuat PDF…' : `PDF ${monthLabel(summary.key)}`}</Button>
      </Card>
      <ShareLinks />
    </>
  )
}
