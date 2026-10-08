import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CircleCheck, CircleDashed, Loader, Rocket } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress as Bar } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { ThemeToggle } from '@/components/ThemeToggle'
import { formatDate } from '@/lib/dates'
import { toneClass } from '@/components/common'
import type { PublicProgress, Status } from '@/lib/types'

const labels: Record<Status, { text: string; tone: keyof typeof toneClass; icon: typeof CircleCheck }> = {
  todo: { text: 'Direncanakan', tone: 'blue', icon: CircleDashed },
  doing: { text: 'Dikerjakan', tone: 'amber', icon: Loader },
  done: { text: 'Selesai', tone: 'green', icon: CircleCheck },
}

export default function Progress() {
  const { token } = useParams()
  const [data, setData] = useState<PublicProgress | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    void supabase.rpc('public_progress', { p_token: token ?? null }).then(({ data, error }) => {
      if (error) setError(error.message)
      else if ((data as PublicProgress).error) setError('Tautan tidak valid.')
      else setData(data as PublicProgress)
    })
  }, [token])

  return (
    <div className="min-h-screen bg-muted/40 p-4 py-8">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Rocket className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold leading-tight">Progress pekerjaan</h1>
            {data?.sprint && <p className="text-sm text-muted-foreground">Sprint minggu {formatDate(data.sprint.week_start)}</p>}
          </div>
          <ThemeToggle className="ml-auto" />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {!data && !error && <Skeleton className="h-64" />}
        {data && !data.sprint && <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Belum ada sprint berjalan.</CardContent></Card>}
        {data?.sprint && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-baseline justify-between">
                  Selesai <span className="text-2xl text-primary">{data.percent}%</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Bar value={data.percent} className="h-3" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Daftar task</CardTitle>
                <CardDescription>{data.tasks.length} task ditampilkan.</CardDescription>
              </CardHeader>
              <CardContent>
                {data.tasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada task publik.</p>
                ) : (
                  <ul className="divide-y">
                    {data.tasks.map((t, i) => {
                      const l = labels[t.status]
                      return (
                        <li key={i} className="flex items-center gap-3 py-2.5 text-sm">
                          <l.icon className="size-4 shrink-0 text-muted-foreground" />
                          <span className="flex-1">{t.title}</span>
                          {t.tag && <Badge variant="secondary">{t.tag}</Badge>}
                          <Badge className={toneClass[l.tone]}>{l.text}</Badge>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
