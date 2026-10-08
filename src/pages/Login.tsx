import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { configured, supabase } from '@/lib/supabase'
import { Button, Card, Input, Label } from '@/components/ui'

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
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm space-y-4">
        <h1 className="text-lg font-semibold">Sprint Tracker Solo</h1>
        {!configured && (
          <p className="rounded bg-amber-50 p-2 text-xs text-amber-800">
            VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY belum diisi (lihat .env.example).
          </p>
        )}
        <form onSubmit={submit} className="space-y-3">
          <Label>
            Email
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Label>
          <Label>
            Password
            <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </Label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button className="w-full" disabled={busy}>
            Masuk
          </Button>
        </form>
      </Card>
    </div>
  )
}
