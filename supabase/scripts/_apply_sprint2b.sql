-- =====================================================================
-- 20261005140000_student_targets
-- Metas do aluno: cursos/universidades que ele pretende concorrer.
-- RLS por usuário. Idempotente.
-- =====================================================================

create table if not exists public.student_targets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  offering_id uuid not null references public.course_offerings(id) on delete cascade,
  priority    int not null default 1,
  created_at  timestamptz not null default now(),
  unique (user_id, offering_id)
);
create index if not exists student_targets_user_idx on public.student_targets (user_id);

alter table public.student_targets enable row level security;

drop policy if exists student_targets_all_own on public.student_targets;
create policy student_targets_all_own on public.student_targets
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
