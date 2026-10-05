-- =====================================================================
-- 20261005150000_simulado
-- Banco de questões + simulado diagnóstico + correção server-side (RPC).
-- Gabarito nunca é exposto ao cliente: questions/question_options não têm
-- política de SELECT; o acesso é só via funções SECURITY DEFINER.
-- Idempotente.
-- =====================================================================

-- ---------- questões ----------
create table if not exists public.questions (
  id          uuid primary key default gen_random_uuid(),
  code        text unique,                 -- chave estável para seed idempotente
  area_key    text not null references public.exam_areas(key),
  topic       text,
  difficulty  text check (difficulty in ('facil', 'medio', 'dificil')),
  statement   text not null,
  source      text not null default 'curated' check (source in ('curated', 'ai_generated', 'official')),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists questions_area_idx on public.questions (area_key, active);

create table if not exists public.question_options (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  label       text not null,
  text        text not null,
  is_correct  boolean not null default false,
  unique (question_id, label)
);

-- ---------- simulados ----------
create table if not exists public.simulados (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null default 'diagnostico' check (type in ('diagnostico', 'treino', 'periodico')),
  status      text not null default 'em_andamento' check (status in ('em_andamento', 'concluido')),
  score       numeric,
  started_at  timestamptz not null default now(),
  finished_at timestamptz
);
create index if not exists simulados_user_idx on public.simulados (user_id, started_at);

create table if not exists public.simulado_questions (
  id          uuid primary key default gen_random_uuid(),
  simulado_id uuid not null references public.simulados(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  position    int not null,
  unique (simulado_id, question_id)
);

create table if not exists public.responses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  simulado_id uuid not null references public.simulados(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  chosen_label text,
  is_correct  boolean,
  answered_at timestamptz not null default now(),
  unique (simulado_id, question_id)
);

-- =====================================================================
-- RLS
-- =====================================================================
alter table public.questions          enable row level security;
alter table public.question_options   enable row level security;
alter table public.simulados          enable row level security;
alter table public.simulado_questions enable row level security;
alter table public.responses          enable row level security;

-- questions / question_options: SEM política de SELECT (cliente não lê direto;
-- acesso apenas via RPC SECURITY DEFINER, que omite o gabarito).

-- simulados: o aluno vê os próprios (criação/correção via RPC)
drop policy if exists simulados_select_own on public.simulados;
create policy simulados_select_own on public.simulados
  for select to authenticated using (user_id = auth.uid());

-- responses: o aluno vê as próprias (escrita via RPC)
drop policy if exists responses_select_own on public.responses;
create policy responses_select_own on public.responses
  for select to authenticated using (user_id = auth.uid());

-- =====================================================================
-- RPCs (SECURITY DEFINER) — correção server-side, sem vazar gabarito
-- =====================================================================

-- Inicia um simulado diagnóstico: 2 questões por área objetiva (até 8).
create or replace function public.start_diagnostic()
returns uuid language plpgsql security definer set search_path = public as $$
declare v_sim uuid; v_area record; v_q record; v_pos int := 0;
begin
  insert into public.simulados (user_id, type, status)
    values (auth.uid(), 'diagnostico', 'em_andamento') returning id into v_sim;
  for v_area in select key from public.exam_areas where key <> 'redacao' order by position loop
    for v_q in (select id from public.questions
                where area_key = v_area.key and active order by random() limit 2) loop
      v_pos := v_pos + 1;
      insert into public.simulado_questions (simulado_id, question_id, position)
        values (v_sim, v_q.id, v_pos);
    end loop;
  end loop;
  return v_sim;
end;
$$;

-- Retorna as questões do simulado SEM o gabarito.
create or replace function public.get_simulado(p_simulado uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_owner uuid; v_result jsonb;
begin
  select user_id into v_owner from public.simulados where id = p_simulado;
  if v_owner is null or v_owner <> auth.uid() then raise exception 'nao autorizado'; end if;
  select jsonb_agg(row_to_json(x) order by x.position) into v_result from (
    select sq.position, que.id as question_id, que.area_key, que.topic, que.statement,
      (select jsonb_agg(jsonb_build_object('label', o.label, 'text', o.text) order by o.label)
         from public.question_options o where o.question_id = que.id) as options
    from public.simulado_questions sq
    join public.questions que on que.id = sq.question_id
    where sq.simulado_id = p_simulado
  ) x;
  return coalesce(v_result, '[]'::jsonb);
end;
$$;

-- Corrige o simulado e devolve o resultado (nota + acurácia por área).
create or replace function public.submit_simulado(p_simulado uuid, p_answers jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_owner uuid; v_ans jsonb; v_qid uuid; v_label text; v_correct boolean;
  v_total int; v_right int; v_areas jsonb; v_score numeric;
begin
  select user_id into v_owner from public.simulados where id = p_simulado;
  if v_owner is null or v_owner <> auth.uid() then raise exception 'nao autorizado'; end if;

  for v_ans in select value from jsonb_array_elements(p_answers) loop
    v_qid := (v_ans ->> 'question_id')::uuid;
    v_label := v_ans ->> 'label';
    select exists(select 1 from public.question_options o
      where o.question_id = v_qid and o.label = v_label and o.is_correct) into v_correct;
    insert into public.responses (user_id, simulado_id, question_id, chosen_label, is_correct)
      values (auth.uid(), p_simulado, v_qid, v_label, v_correct)
    on conflict (simulado_id, question_id)
      do update set chosen_label = excluded.chosen_label, is_correct = excluded.is_correct, answered_at = now();
  end loop;

  select count(*) into v_total from public.simulado_questions where simulado_id = p_simulado;
  select count(*) into v_right from public.responses where simulado_id = p_simulado and is_correct;
  v_score := case when v_total > 0 then round(100.0 * v_right / v_total, 1) else 0 end;

  update public.simulados set status = 'concluido', finished_at = now(), score = v_score
    where id = p_simulado;

  select jsonb_object_agg(area_key, acc) into v_areas from (
    select que.area_key,
      round(100.0 * sum(case when r.is_correct then 1 else 0 end) / count(*), 0) as acc
    from public.responses r join public.questions que on que.id = r.question_id
    where r.simulado_id = p_simulado group by que.area_key
  ) t;

  return jsonb_build_object('total', v_total, 'correct', v_right, 'score', v_score,
    'by_area', coalesce(v_areas, '{}'::jsonb));
end;
$$;

grant execute on function public.start_diagnostic() to authenticated;
grant execute on function public.get_simulado(uuid) to authenticated;
grant execute on function public.submit_simulado(uuid, jsonb) to authenticated;
