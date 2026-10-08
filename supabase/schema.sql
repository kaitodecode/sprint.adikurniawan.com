-- Sprint Tracker Solo — skema Supabase. Jalankan di SQL Editor.
-- Setelah itu: Authentication > Providers > Email > matikan "Allow new users to sign up",
-- lalu buat satu user secara manual lewat Authentication > Users.

create table if not exists sprints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  week_start date not null,
  goal text not null default '',
  capacity_hours numeric not null default 20 check (capacity_hours >= 0),
  retro_done text not null default '',
  retro_blocked text not null default '',
  retro_change text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  sprint_id uuid references sprints on delete set null, -- null = backlog
  title text not null,
  tag text not null default '',
  est_hours numeric not null default 1 check (est_hours >= 0),
  actual_hours numeric not null default 0 check (actual_hours >= 0),
  status text not null default 'todo' check (status in ('todo','doing','done')),
  is_stretch boolean not null default false,
  is_public boolean not null default false,
  done_at timestamptz,
  carried_over boolean not null default false, -- true di task asal yang disalin ke sprint berikutnya
  carried_from uuid references tasks on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists tasks_sprint_idx on tasks (sprint_id);

-- Token opsional untuk /progress/<token>: memfilter task publik ke satu tag/klien.
create table if not exists share_tokens (
  token text primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  tag text not null
);

create or replace view backlog with (security_invoker = true) as
  select * from tasks where sprint_id is null;

alter table sprints enable row level security;
alter table tasks enable row level security;
alter table share_tokens enable row level security;

create policy "owner sprints" on sprints for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "owner tasks" on tasks for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "owner tokens" on share_tokens for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Akses publik hanya lewat fungsi ini: hanya task is_public = true, tanpa jam/kapasitas.
create or replace function public_progress(p_token text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tag text;
  v_sprint sprints%rowtype;
  v_total numeric;
  v_done numeric;
begin
  if p_token is not null then
    select tag into v_tag from share_tokens where token = p_token;
    if not found then
      return jsonb_build_object('error', 'token tidak valid');
    end if;
  end if;

  select * into v_sprint from sprints
    where week_start <= current_date order by week_start desc limit 1;
  if not found then
    return jsonb_build_object('sprint', null, 'percent', 0, 'tasks', '[]'::jsonb);
  end if;

  select coalesce(sum(est_hours), 0), coalesce(sum(est_hours) filter (where status = 'done'), 0)
    into v_total, v_done
    from tasks
    where sprint_id = v_sprint.id and not is_stretch and (v_tag is null or tag = v_tag);

  return jsonb_build_object(
    'sprint', jsonb_build_object('week_start', v_sprint.week_start),
    'percent', case when v_total = 0 then 0 else round(v_done / v_total * 100) end,
    'tasks', coalesce((
      select jsonb_agg(jsonb_build_object('title', t.title, 'tag', t.tag, 'status', t.status) order by t.created_at)
      from tasks t
      where t.sprint_id = v_sprint.id and t.is_public and (v_tag is null or t.tag = v_tag)
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public_progress(text) from public;
grant execute on function public_progress(text) to anon, authenticated;
