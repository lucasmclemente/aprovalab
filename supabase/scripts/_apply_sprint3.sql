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

-- =====================================================================
-- 20261005150100_seed_questions
-- Banco inicial de questões CURADAS (origem: 'curated'). Questões objetivas,
-- claramente corretas, cobrindo as 4 áreas objetivas do ENEM.
-- O banco será expandido por IA (geração + curadoria) nas próximas etapas.
-- Idempotente (ON CONFLICT por code / por (question_id, label)).
-- =====================================================================

insert into public.questions (code, area_key, topic, difficulty, statement, source) values
  ('MAT-001', 'matematica', 'Porcentagem', 'facil', 'Quanto é 15% de 300?', 'curated'),
  ('MAT-002', 'matematica', 'Porcentagem', 'facil', 'Um produto que custa R$ 80,00 recebe um desconto de 25%. Qual é o preço final?', 'curated'),
  ('MAT-003', 'matematica', 'Geometria', 'facil', 'Qual é a área de um retângulo de base 8 cm e altura 5 cm?', 'curated'),
  ('LIN-001', 'linguagens', 'Semântica', 'facil', 'A conjunção "mas" expressa, tipicamente, ideia de:', 'curated'),
  ('LIN-002', 'linguagens', 'Semântica', 'medio', 'Qual é o antônimo (palavra de sentido oposto) de "efêmero"?', 'curated'),
  ('LIN-003', 'linguagens', 'Norma-padrão', 'medio', 'Assinale a frase escrita de acordo com a norma-padrão da língua portuguesa.', 'curated'),
  ('HUM-001', 'humanas', 'História do Brasil', 'facil', 'Em que ano foi proclamada a República no Brasil?', 'curated'),
  ('HUM-002', 'humanas', 'História do Brasil', 'facil', 'A Lei Áurea, que aboliu a escravidão no Brasil, foi assinada em que ano?', 'curated'),
  ('HUM-003', 'humanas', 'Geografia', 'facil', 'Qual é a capital federal do Brasil?', 'curated'),
  ('NAT-001', 'natureza', 'Química', 'facil', 'A molécula de água (H2O) é formada por quais elementos químicos?', 'curated'),
  ('NAT-002', 'natureza', 'Física', 'facil', 'No Sistema Internacional de Unidades, qual é a unidade de força?', 'curated'),
  ('NAT-003', 'natureza', 'Biologia', 'facil', 'Como se chama o processo pelo qual as plantas produzem seu próprio alimento utilizando a luz solar?', 'curated')
on conflict (code) do nothing;

insert into public.question_options (question_id, label, text, is_correct)
select q.id, v.label, v.text, v.is_correct
from public.questions q
join (values
  ('MAT-001','A','30',false),('MAT-001','B','45',true),('MAT-001','C','15',false),('MAT-001','D','50',false),('MAT-001','E','4,5',false),
  ('MAT-002','A','R$ 55,00',false),('MAT-002','B','R$ 60,00',true),('MAT-002','C','R$ 65,00',false),('MAT-002','D','R$ 20,00',false),('MAT-002','E','R$ 75,00',false),
  ('MAT-003','A','13 cm²',false),('MAT-003','B','26 cm²',false),('MAT-003','C','40 cm²',true),('MAT-003','D','80 cm²',false),('MAT-003','E','20 cm²',false),
  ('LIN-001','A','adição',false),('LIN-001','B','oposição',true),('LIN-001','C','conclusão',false),('LIN-001','D','causa',false),('LIN-001','E','tempo',false),
  ('LIN-002','A','passageiro',false),('LIN-002','B','breve',false),('LIN-002','C','duradouro',true),('LIN-002','D','fugaz',false),('LIN-002','E','raro',false),
  ('LIN-003','A','Faz dois anos que não o vejo.',true),('LIN-003','B','Fazem dois anos que não o vejo.',false),('LIN-003','C','Houveram muitos problemas.',false),('LIN-003','D','Entre eu e você não há segredos.',false),('LIN-003','E','Nós vai ao cinema hoje.',false),
  ('HUM-001','A','1822',false),('HUM-001','B','1888',false),('HUM-001','C','1889',true),('HUM-001','D','1891',false),('HUM-001','E','1930',false),
  ('HUM-002','A','1850',false),('HUM-002','B','1871',false),('HUM-002','C','1888',true),('HUM-002','D','1889',false),('HUM-002','E','1822',false),
  ('HUM-003','A','Rio de Janeiro',false),('HUM-003','B','São Paulo',false),('HUM-003','C','Brasília',true),('HUM-003','D','Goiânia',false),('HUM-003','E','Salvador',false),
  ('NAT-001','A','Hidrogênio e oxigênio',true),('NAT-001','B','Carbono e oxigênio',false),('NAT-001','C','Hidrogênio e carbono',false),('NAT-001','D','Nitrogênio e oxigênio',false),('NAT-001','E','Oxigênio e hélio',false),
  ('NAT-002','A','Joule',false),('NAT-002','B','Watt',false),('NAT-002','C','Newton',true),('NAT-002','D','Pascal',false),('NAT-002','E','Volt',false),
  ('NAT-003','A','Respiração',false),('NAT-003','B','Fotossíntese',true),('NAT-003','C','Transpiração',false),('NAT-003','D','Digestão',false),('NAT-003','E','Fermentação',false)
) as v(code, label, text, is_correct) on q.code = v.code
on conflict (question_id, label) do nothing;
