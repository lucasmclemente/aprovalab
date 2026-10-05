-- =====================================================================
-- 20261005130000_catalog
-- Catálogo público (SISU): instituições, ofertas de curso, notas de corte,
-- pesos por área. Leitura liberada a autenticados; escrita só via service
-- role (ingestão) — não há política de escrita para o cliente.
-- Idempotente.
-- =====================================================================

create extension if not exists pg_trgm;

-- ---------- áreas do exame (ENEM) ----------
create table if not exists public.exam_areas (
  id       uuid primary key default gen_random_uuid(),
  key      text not null unique,
  name     text not null,
  position int not null default 0
);
insert into public.exam_areas (key, name, position) values
  ('linguagens', 'Linguagens, Códigos e suas Tecnologias', 1),
  ('humanas', 'Ciências Humanas e suas Tecnologias', 2),
  ('natureza', 'Ciências da Natureza e suas Tecnologias', 3),
  ('matematica', 'Matemática e suas Tecnologias', 4),
  ('redacao', 'Redação', 5)
on conflict (key) do nothing;

-- ---------- instituições ----------
create table if not exists public.institutions (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  sigla      text,
  uf         text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists institutions_name_trgm on public.institutions using gin (name gin_trgm_ops);

-- ---------- ofertas de curso (curso × instituição × edição) ----------
create table if not exists public.course_offerings (
  id             uuid primary key default gen_random_uuid(),
  sisu_id        text not null,   -- id do curso no SISU (por edição)
  year           int not null,
  institution_id uuid references public.institutions(id) on delete cascade,
  course_name    text not null,
  degree         text,            -- Bacharelado / Licenciatura / Tecnólogo
  shift          text,            -- Integral / Matutino / Vespertino / Noturno
  campus         text,
  city           text,
  uf             text,
  vagas          int,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (sisu_id, year)
);
create index if not exists offerings_course_trgm on public.course_offerings using gin (course_name gin_trgm_ops);
create index if not exists offerings_institution_idx on public.course_offerings (institution_id);
create index if not exists offerings_year_idx on public.course_offerings (year);

-- ---------- notas de corte (por oferta × modalidade × edição) ----------
create table if not exists public.cutoffs (
  id          uuid primary key default gen_random_uuid(),
  offering_id uuid not null references public.course_offerings(id) on delete cascade,
  year        int not null,
  modalidade  text not null,
  score       numeric,
  vagas       int,
  created_at  timestamptz not null default now(),
  unique (offering_id, modalidade, year)
);
create index if not exists cutoffs_offering_idx on public.cutoffs (offering_id);

-- ---------- pesos por área (por oferta) ----------
create table if not exists public.exam_weights (
  id          uuid primary key default gen_random_uuid(),
  offering_id uuid not null references public.course_offerings(id) on delete cascade,
  area_key    text not null,
  weight      numeric,
  min_score   numeric,
  unique (offering_id, area_key)
);

-- =====================================================================
-- RLS: catálogo é PÚBLICO de leitura (autenticados); escrita só service role
-- =====================================================================
alter table public.exam_areas       enable row level security;
alter table public.institutions     enable row level security;
alter table public.course_offerings enable row level security;
alter table public.cutoffs          enable row level security;
alter table public.exam_weights     enable row level security;

drop policy if exists exam_areas_read on public.exam_areas;
create policy exam_areas_read on public.exam_areas for select to authenticated using (true);

drop policy if exists institutions_read on public.institutions;
create policy institutions_read on public.institutions for select to authenticated using (true);

drop policy if exists offerings_read on public.course_offerings;
create policy offerings_read on public.course_offerings for select to authenticated using (true);

drop policy if exists cutoffs_read on public.cutoffs;
create policy cutoffs_read on public.cutoffs for select to authenticated using (true);

drop policy if exists weights_read on public.exam_weights;
create policy weights_read on public.exam_weights for select to authenticated using (true);
-- (sem políticas de INSERT/UPDATE/DELETE: o cliente não escreve; a ingestão usa a service key)
