# DATABASE — Aprova (modelo inicial)

> Esboço do modelo de dados. Detalhar por sprint. Última atualização: 2026-09-21.
> Convenções: PK `uuid`; `created_at`/`updated_at`; RLS conforme `ARCHITECTURE.md §3`.

## Catálogo (público de leitura; escrita só via ingestão)

- **institutions** — id, name, sigla, uf, tipo (federal/estadual/privada)
- **courses** — id, name, area_conhecimento, grau (bacharelado/licenciatura/tecnólogo)
- **course_offerings** — id, institution_id, course_id, campus, turno, sistema
  (SISU/Fuvest/…), vagas
- **cutoffs** — id, offering_id, year, edition, modalidade (ampla/cotas…), score (nota de corte)
- **exam_weights** — id, offering_id, area, weight (peso por área para aquele curso)
- **exam_areas** — id, key (linguagens, matematica, ciencias_natureza, ciencias_humanas,
  redacao), name
- **topics** — id, area_id, name, matriz_ref (habilidade/competência de referência), parent_id
  (hierarquia)

## Banco de questões (público de leitura; gabarito protegido)

- **questions** — id, area_id, topic_id, statement, difficulty, source
  (`official`/`ai_generated`/`licensed`), source_ref (ano/prova), review_status
  (`pending`/`approved`/`rejected`), created_by
- **question_options** — id, question_id, label (A–E), text, is_correct **(⚠️ nunca enviar
  is_correct ao cliente para questão em aberto)**
- **question_stats** — question_id, times_answered, times_correct (calibração de dificuldade)

## Dados do aluno (RLS por user_id)

- **profiles** — user_id (=auth.users), name, birth_date, serie, exam_date (data alvo),
  study_hours_week
- **student_targets** — id, user_id, offering_id, priority
- **simulados** — id, user_id, type (`diagnostico`/`periodico`/`treino`), status
  (`em_andamento`/`concluido`), started_at, finished_at, est_score
- **simulado_questions** — id, simulado_id, question_id, position
- **responses** — id, user_id, simulado_id, question_id, chosen_label, is_correct, answered_at
- **performance_snapshots** — id, user_id, simulado_id, area_id/topic_id, accuracy, taken_at
- **study_plans** — id, user_id, generated_at, model_ref, summary (diagnóstico), status
- **study_plan_items** — id, plan_id, topic_id, action, priority, target_week, done
- **flashcard_decks** — id, user_id (ou público), topic_id, name
- **flashcards** — id, deck_id, front, back, source
- **flashcard_reviews** — id, user_id, flashcard_id, ease, interval, due_at, last_reviewed
  (algoritmo SM-2 de repetição espaçada)
- **gamification** — user_id, xp, level, streak_days, last_active_day
- **achievements** / **user_achievements** — conquistas

## IA / auditoria
- **ai_generations** — id, user_id (nullable), type, model_ref, input_hash, tokens_in,
  tokens_out, cost_est, created_at (monitorar custo e uso)

## Regras de integridade
- Gabarito (`is_correct`) só acessível ao servidor/Edge Function durante simulado em aberto.
- Catálogo com unicidade por (institution, course, campus, turno) e (offering, year, edition,
  modalidade).
- Índices por área/tópico em `questions`; por `user_id` nas tabelas do aluno.
