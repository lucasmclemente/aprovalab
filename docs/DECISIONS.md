# DECISIONS — Aprova (registro de decisões e riscos)

> Última atualização: 2026-09-21.

## Decisões aceitas
- **D-001** Pivot a partir da Agendinha, em **repositório novo** (Agendinha preservada).
- **D-002** Reaproveitar a stack: **Supabase + Angular (PWA)**; IA via **API do Claude no
  servidor** (Edge Functions), chave nunca no frontend.
- **D-003** **Anti-alucinação:** fatos (notas de corte, gabaritos) vêm do banco; a IA só analisa/
  explica/planeja sobre o contexto dado.
- **D-004** Tenancy **B2C** (RLS por `user_id`); catálogo é público de leitura.
- **D-005 — Estratégia de questões: HÍBRIDO começando por geradas + curadas** (2026-09-21).
  MVP usa itens **originais gerados pela IA e revisados** (matriz do ENEM), sem risco autoral;
  em paralelo, avaliar juridicamente o uso de **provas oficiais do ENEM** para elevar a
  fidelidade; licenciar banco de terceiros fica como evolução.
- **D-006 — Exame inicial: ENEM/SISU** (2026-09-21). Fuvest e outros na Fase 2.

## Decisões pendentes (precisam de você)
- **P-003 — Verificação jurídica** do uso de provas oficiais (ENEM) para uso comercial
  (necessária apenas quando formos incluir itens oficiais; não bloqueia o MVP).
- **P-004 — Nome do produto** (opções no `PRD §12`).
- **P-005 — Fonte das notas de corte:** coleta automática dos portais vs. carga manual inicial.
- **P-006 — Modelo de negócio** (freemium?) — não bloqueia o MVP, mas orienta limites de IA.
- **P-007 — Redação por IA:** MVP ou Fase 2 (recomendo **Fase 2**).

## Riscos
| # | Risco | Tipo | Impacto | Mitigação |
|---|---|---|---|---|
| R-01 | Direito autoral das questões | Legal | **Crítico** | Estratégia de conteúdo consciente (P-001); começar por itens gerados/curados; verificação jurídica p/ oficiais |
| R-02 | IA alucinar fato de alto risco | Produto | Crítico | Fatos só do banco; saída estruturada validada; explicações ancoradas no gabarito |
| R-03 | Qualidade das questões geradas | Produto | Alto | Curadoria em 2 camadas; calibração pelo uso; feedback do aluno |
| R-04 | Custo de IA em escala | Financeiro | Alto | Modelo certo por tarefa; cache; batch; limites por plano; log de custo |
| R-05 | Escopo grande | Produto | Médio | MVP enxuto (ENEM/SISU); Fase 2 clara |
| R-06 | Atualização anual dos dados (SISU/ENEM) | Operacional | Médio | Pipeline de ingestão versionado e repetível |
| R-07 | LGPD (menores de idade) | Legal/Privacidade | Alto | Consentimento; minimização; sem PII desnecessária à IA |
| R-08 | Diagnóstico fraco com banco pequeno | Produto | Médio | Garantir cobertura mínima por área/tópico antes do piloto |

## Log
- **2026-09-21** — Criado o planejamento inicial (`PRD`, `DATA-STRATEGY`, `AI-STRATEGY`,
  `ARCHITECTURE`, `DATABASE`, `BACKLOG`, `DECISIONS`). Nova base do produto de vestibular, em
  repositório próprio. Nenhuma implementação iniciada; aguardando decisões P-001..P-005.
