// Backup semua tabel ke backups/<tanggal>/*.json lewat REST API Supabase.
// Butuh SUPABASE_URL dan SUPABASE_SERVICE_KEY (service role, jangan dipakai di frontend).
import { mkdir, writeFile } from 'node:fs/promises'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_KEY
if (!url || !key) {
  console.error('SUPABASE_URL dan SUPABASE_SERVICE_KEY wajib diisi')
  process.exit(1)
}

const dir = `backups/${new Date().toISOString().slice(0, 10)}`
await mkdir(dir, { recursive: true })

for (const table of ['sprints', 'tasks', 'share_tokens']) {
  const res = await fetch(`${url}/rest/v1/${table}?select=*`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  if (!res.ok) throw new Error(`${table}: ${res.status} ${await res.text()}`)
  const rows = await res.json()
  await writeFile(`${dir}/${table}.json`, JSON.stringify(rows, null, 2))
  console.log(`${table}: ${rows.length} baris`)
}
