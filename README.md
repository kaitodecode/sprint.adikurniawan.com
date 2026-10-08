# Sprint Tracker Solo

SPA React + Vite + Tailwind yang memakai Supabase (Postgres, Auth, RLS) langsung dari browser. Lihat rencana lengkap di dokumen *Rencana Sprint Tracker Solo*.

## Setup
1. Buat project Supabase, jalankan `supabase/schema.sql` di SQL Editor.
2. Authentication → Providers → Email: matikan **Allow new users to sign up**, lalu buat satu user lewat Authentication → Users.
3. `cp .env.example .env` dan isi `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
4. `npm install && npm run dev`.

## Halaman
- Privat: Dashboard (`/`), Planning, Board, Riwayat, Laporan (CSV + PDF).
- Publik: `/progress` dan `/progress/<token>` (token dibuat di halaman Laporan). Data publik hanya lewat fungsi `public_progress` (hanya task `is_public`, tanpa jam/kapasitas).

## Definisi metrik
- Utilisasi = jam aktual ÷ kapasitas; Completion = estimasi task selesai ÷ estimasi terencana (task stretch tidak dihitung); Akurasi estimasi = jam aktual ÷ estimasi pada task selesai.
- Carry-over: tombol di Riwayat → Retro menyalin task belum selesai ke sprint berikutnya; task asal ditandai `carried_over` sehingga metrik sprint lama tetap utuh.
- Minggu ke-5 dalam satu bulan digabung ke W4 (jawaban untuk pertanyaan terbuka; ubah di `weekOfMonth`, `src/lib/dates.ts`).

## Migrasi
Jika `schema.sql` lama sudah dijalankan, jalankan `supabase/migrations/002_task_position.sql` (kolom `position` untuk urutan kartu di Board).

## Deploy
Hosting statis (`npm run build` → `dist/`). SPA fallback sudah disiapkan: `vercel.json` (Vercel), `netlify.toml` (Netlify), dan `wrangler.jsonc` (Cloudflare Workers/Pages; `_redirects` sengaja tidak dipakai karena memicu error "infinite loop"). Set kedua env `VITE_*` di dashboard hosting.

## Backup
`.github/workflows/backup.yml` menjalankan `scripts/backup.mjs` tiap minggu dan menyimpan JSON sebagai artifact (90 hari). Set secret repo `SUPABASE_URL` dan `SUPABASE_SERVICE_KEY`.
