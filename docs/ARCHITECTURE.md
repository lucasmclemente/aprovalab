# ARCHITECTURE — Aprova

> Arquitetura do MVP. Reaproveita a fundação da Agendinha (Supabase + Angular).
> Última atualização: 2026-09-21.

## 1. Visão geral

```
┌───────────────┐   supabase-js (auth + dados)   ┌──────────────────────────────┐
│  Angular PWA  │ ─────────────────────────────▶ │           Supabase           │
│ (mobile-first)│ ◀───────────────────────────── │  Auth · PostgreSQL + RLS     │
└──────┬────────┘        chama p/ IA/lógica       │  Storage · Edge Functions    │
       │                                          │      │ (chave do Claude)     │
       ▼                                          └──────┼────────────────────────┘
┌───────────────┐   contexto (dados do banco)            │
│ Edge Functions│ ───────────────────────────────▶  [ API do Claude ]
│  (TS/Deno)    │ ◀─── saída estruturada validada ──
└───────────────┘

  [ Pipeline de ingestão (offline) ] → carrega instituições, cursos, notas de corte,
                                        banco de questões no PostgreSQL.
```

- **Frontend:** Angular PWA, `supabase-js`, mobile-first.
- **Supabase:** Postgres + Auth + **RLS por usuário** (B2C: cada aluno vê só os próprios dados)
  + Storage + Edge Functions.
- **IA:** Claude chamado **só no servidor** (Edge Functions), com a chave protegida.
- **Pipeline de dados:** scripts (Node/TS) que rodam offline para popular o catálogo e o banco
  de questões — não fazem parte do fluxo por-requisição do usuário.

## 2. Diferenças em relação à Agendinha
- **Tenancy:** aqui é **B2C** (aluno individual), não multi-escola. RLS por `user_id` na maioria
  das tabelas; dados de catálogo (instituições/cursos/notas de corte/questões) são **públicos
  de leitura** (compartilhados por todos).
- **IA no coração:** Edge Functions de IA (diagnóstico, plano, geração/curadoria).
- **Pipeline de dados:** novo componente (ingestão).

## 3. RLS (resumo)
- **Catálogo** (`institutions`, `courses`, `course_offerings`, `cutoffs`, `questions`,
  `exam_areas`, `topics`): **select** liberado a autenticados; **escrita** só via serviço
  (ingestão/admin), nunca pelo cliente.
- **Dados do aluno** (`profiles`, `student_targets`, `simulados`, `responses`, `study_plans`,
  `flashcard_reviews`, `gamification`): **select/escrita** só do próprio `user_id`.
- **Gabaritos:** cuidado — não expor o gabarito de um simulado **antes** de o aluno responder
  (a correção acontece no servidor/Edge Function; o cliente não recebe o gabarito das questões
  em aberto).

## 4. Edge Functions previstas (MVP)
- `simulado-build` — monta um simulado (seleciona questões por área/tópico/peso) sem vazar
  gabaritos.
- `simulado-grade` — corrige as respostas com o gabarito real (server-side).
- `analyze-performance` — gera diagnóstico (Claude, saída estruturada).
- `study-plan` — gera/atualiza o plano de estudos (Claude).
- `question-explain` — explica uma questão (Claude, ancorado no gabarito).
- `questions-generate` — gera itens (se Opção 2), grava como `pending_review`.
- (Fase 2) `essay-grade` — correção de redação.

## 5. Frontend (features previstas)
`auth`, `onboarding` (meta), `meta/curso`, `simulado`, `resultado`, `plano`, `flashcards`,
`evolucao`, `gamificacao`, `dashboard`.

## 6. Stack e versões
Fixar na Sprint 1 (`DECISIONS.md`). Ambiente: Node 24.x. Reutilizar o que já sabemos da
Agendinha (Angular 22, Supabase CLI). **Novo projeto Supabase** (não reaproveitar o da
Agendinha).
