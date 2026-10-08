-- Urutan task di dalam kolom board (drag & drop). Jalankan sekali di SQL Editor
-- jika schema.sql versi lama sudah pernah dijalankan.
alter table tasks add column if not exists position double precision not null default 0;
