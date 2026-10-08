import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Rocket } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { configured, supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Field } from '@/components/common'

export default function Login() {
  const { session } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (session) return <Navigate to="/" replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setError(error?.message ?? '')
    setBusy(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Rocket className="size-5" />
          </div>
          <CardTitle>Sprint Tracker Solo</CardTitle>
          <CardDescription>Masuk untuk merencanakan dan memantau sprint mingguanmu.</CardDescription>
        </CardHeader>
        <CardContent>
          {!configured && (
            <Alert className="mb-4">
              <AlertDescription>
                VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY belum terbaca saat build. Isi sebagai build variable lalu build ulang (lihat .env.example).
              </AlertDescription>
            </Alert>
          )}
          <form onSubmit={submit} className="space-y-4">
            <Field label="Email">
              <Input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Password">
              <Input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" disabled={busy}>
              {busy ? 'Masuk…' : 'Masuk'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
