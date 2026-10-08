import { useState, type FormEvent } from 'react'
import { Activity, CheckCircle2, Clock, Copy, Download, FileSpreadsheet, FileText, Link2, Target, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useData } from '@/lib/data'
import { useMonth } from '@/components/MonthSelect'
import { Kpi } from '@/components/Kpi'
import { MonthlyUtilChart } from '@/components/Charts'
import { EmptyState, Field, PageHeader, utilTone } from '@/components/common'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { download, sprintsCsv, tagsCsv } from '@/lib/csv'
import { formatDate, monthLabel } from '@/lib/dates'
import { hours, pct } from '@/lib/utils'

function ShareLinks() {
  const { tokens, tasks, createToken, deleteToken } = useData()
  const [tag, setTag] = useState('')
  const known = [...new Set(tasks.map((t) => t.tag).filter(Boolean))]
  const add = async (e: FormEvent) => {
    e.preventDefault()
    if (!tag.trim()) return
    await createToken(crypto.randomUUID().replace(/-/g, '').slice(0, 16), tag.trim())
    setTag('')
    toast.success('Token dibuat')
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Link2 className="size-4" />Tautan progres publik</CardTitle>
        <CardDescription>
          <code>/progress</code> menampilkan semua task publik. Buat token untuk membatasi ke satu tag/klien; jam dan kapasitas tidak pernah ditampilkan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {tokens.length > 0 && (
          <ul className="divide-y rounded-lg border text-sm">
            {tokens.map((t) => {
              const url = `${location.origin}/progress/${t.token}`
              return (
                <li key={t.token} className="flex items-center gap-2 p-2.5">
                  <span className="w-28 shrink-0 font-medium">{t.tag}</span>
                  <code className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{url}</code>
                  <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(url).then(() => toast.success('Tautan disalin'))}><Copy />Salin</Button>
                  <Button size="icon" variant="ghost" className="size-8" aria-label="Hapus" onClick={() => deleteToken(t.token)}><Trash2 className="size-4" /></Button>
                </li>
              )
            })}
          </ul>
        )}
        <form onSubmit={add} className="flex gap-2">
          <Input list="share-tags" className="w-56" placeholder="Tag/klien" value={tag} onChange={(e) => setTag(e.target.value)} />
          <datalist id="share-tags">{known.map((t) => <option key={t} value={t} />)}</datalist>
          <Button>Buat token</Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default function Report() {
  const { summary, select } = useMonth()
  const [busy, setBusy] = useState(false)
  const [name, setName] = useState(() => localStorage.getItem('report-name') ?? '')

  if (!summary)
    return (
      <>
        <PageHeader title="Laporan bulanan" />
        <EmptyState icon={<FileText className="size-8" />} title="Belum ada data sprint">
          Laporan dibuat dari sprint yang sudah ada.
        </EmptyState>
      </>
    )

  const pdf = async () => {
    setBusy(true)
    try {
      localStorage.setItem('report-name', name)
      const [{ pdf }, { MonthlyReport }] = await Promise.all([import('@react-pdf/renderer'), import('@/pdf/MonthlyReport')])
      const blob = await pdf(<MonthlyReport month={summary} name={name || 'Sprint Tracker'} />).toBlob()
      download(`laporan-${summary.key}.pdf`, blob, 'application/pdf')
      toast.success('PDF diunduh')
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title="Laporan bulanan" description={`Ringkasan dan export · ${monthLabel(summary.key)}`} actions={select} />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Utilisasi" icon={Activity} value={pct(summary.utilization)} valueClass={utilTone(summary.utilization)} hint={`${hours(summary.actual)} dari ${hours(summary.capacity)}`} />
        <Kpi label="Completion" icon={CheckCircle2} value={pct(summary.completion)} />
        <Kpi label="Akurasi estimasi" icon={Target} value={pct(summary.accuracy)} />
        <Kpi label="Carry-over" icon={Clock} value={String(summary.carryOver)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Utilitas bulanan (W1–W4)</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyUtilChart month={summary} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Export</CardTitle>
            <CardDescription>PDF untuk dibagikan ke klien, CSV untuk olah data atau dasar invoice.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Nama di header PDF">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama Anda / bisnis" />
            </Field>
            <Button className="w-full" onClick={pdf} disabled={busy}>
              <Download />{busy ? 'Membuat PDF…' : 'Unduh PDF'}
            </Button>
            <Button className="w-full" variant="outline" onClick={() => download(`sprint-${summary.key}.csv`, sprintsCsv(summary))}>
              <FileSpreadsheet />CSV sprint
            </Button>
            <Button className="w-full" variant="outline" onClick={() => download(`jam-per-tag-${summary.key}.csv`, tagsCsv(summary))}>
              <FileSpreadsheet />CSV jam per tag
            </Button>
          </CardContent>
        </Card>

        <Card className="overflow-hidden py-0 lg:col-span-3">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Minggu</TableHead>
                <TableHead>Goal</TableHead>
                <TableHead className="text-right">Kapasitas</TableHead>
                <TableHead className="text-right">Aktual</TableHead>
                <TableHead className="text-right">Utilisasi</TableHead>
                <TableHead className="text-right">Completion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.sprints.map((m) => (
                <TableRow key={m.sprint.id}>
                  <TableCell className="font-medium">{formatDate(m.sprint.week_start)}</TableCell>
                  <TableCell className="text-muted-foreground">{m.sprint.goal || '–'}</TableCell>
                  <TableCell className="text-right">{hours(m.sprint.capacity_hours)}</TableCell>
                  <TableCell className="text-right">{hours(m.actual)}</TableCell>
                  <TableCell className="text-right">{pct(m.utilization)}</TableCell>
                  <TableCell className="text-right">{pct(m.completion)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/30 font-medium hover:bg-muted/30">
                <TableCell colSpan={2}>Total</TableCell>
                <TableCell className="text-right">{hours(summary.capacity)}</TableCell>
                <TableCell className="text-right">{hours(summary.actual)}</TableCell>
                <TableCell className="text-right">{pct(summary.utilization)}</TableCell>
                <TableCell className="text-right">{pct(summary.completion)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Card>

        <div className="lg:col-span-3">
          <ShareLinks />
        </div>
      </div>
    </>
  )
}
