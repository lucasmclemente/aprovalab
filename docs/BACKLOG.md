# BACKLOG — AprovaLab

> Backlog por sprint (proposta). Última atualização: 2026-09-21.
> Status: ⬜ a fazer · 🟡 em andamento · ✅ feito.

## Sprint 0 — Decisões & preparação
- ✅ Estratégia de questões: híbrido (geradas+curadas) · exame inicial ENEM/SISU
- ⬜ (Se usar itens oficiais) verificação jurídica do uso do ENEM
- ✅ Nome (AprovaLab) · projeto Supabase criado · repo no GitHub
- ✅ Versões da stack fixadas (Angular 22, Supabase CLI)

## Sprint 1 — Fundação ✅
- ✅ Repo (`frontend/`, `supabase/`, `docs/`, `tests/`), Angular + Material + PWA
- ✅ Supabase: Auth, `profiles`, RLS por usuário; cadastro/login do aluno
- ✅ Onboarding do perfil (série, data da prova, rotina) + home com a jornada
- ✅ Testes de isolamento (4 testes: aluno só vê/edita os próprios dados)

## Sprint 2 — Meta (dados de aprovação) ✅
- ✅ Modelo do catálogo: `institutions`, `course_offerings`, `cutoffs`, `exam_weights`, `exam_areas`
- ✅ Pipeline de ingestão **automática** (SISU 2025): 123 instituições, 6.863 ofertas, 6.850 notas de corte
- ✅ Tela "Meu curso dos sonhos": buscar curso → **nota de corte real** + salvar como meta
- ✅ Testes: isolamento das metas por aluno (catálogo público de leitura)
- ⬜ (futuro) pesos por área · mais modalidades (cotas) · validação vs. MEC oficial

## Sprint 3 — Banco de questões & Simulado
- ⬜ Modelo: `exam_areas`, `topics`, `questions`, `question_options`
- ⬜ Popular banco de questões (conforme estratégia escolhida) + curadoria se gerado por IA
- ⬜ `simulado-build` (montagem ponderada, sem vazar gabarito) e aplicação no app
- ⬜ `simulado-grade` (correção server-side) + tela de resultado

## Sprint 4 — Inteligência (diagnóstico + plano)
- ⬜ `analyze-performance` (Claude, saída estruturada) → diagnóstico por área/tópico + gap
- ⬜ `study-plan` (Claude) → plano personalizado; telas de resultado e plano
- ⬜ `question-explain` (explicação ancorada no gabarito)
- ⬜ `ai_generations` (log de uso/custo)

## Sprint 5 — Ciclo & Gamificação
- ⬜ Flashcards + repetição espaçada (SM-2): `flashcard_decks`, `flashcards`, `flashcard_reviews`
- ⬜ Gamificação: XP, streak, níveis, conquistas
- ⬜ Re-simulado periódico + **evolução** (comparar snapshots) + replanejar

## Sprint 6 — Piloto
- ⬜ Dashboard do aluno (meta, evolução, próximos passos)
- ⬜ LGPD (menores), políticas de privacidade, limites de uso de IA
- ⬜ Testes dos fluxos críticos + deploy + piloto com alunos reais

## Fase 2 (depois do MVP)
- Correção de **redação** por IA · Fuvest e vestibulares estaduais · Prouni/FIES ·
  ranking/social · painel para cursinhos (B2B2C).
