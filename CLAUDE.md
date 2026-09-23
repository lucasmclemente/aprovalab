# CLAUDE.md — AprovaLab

> Arquivo de contexto do projeto. Preencher conforme o projeto evolui.

## Visão geral
- **Nome:** AprovaLab
- **Status:** planejamento (criado em 21/09/2026) — produto novo, do zero
- **Repositório:** local em `C:\Users\lucas\aprova` (a publicar no GitHub)
- **Pivot:** sucede a experiência do projeto **Agendinha** (agenda escolar), que continua
  intacto em seu próprio repositório. A stack e o aprendizado são reaproveitados.

## Sobre o produto
Copiloto de estudos para o **vestibular** (ensino médio). Combina **dados reais** de aprovação
(notas de corte por curso/instituição) e **provas** dos principais exames (ENEM/SISU e, depois,
Fuvest) com **IA (Claude)** para: montar simulados a partir do histórico de provas, analisar o
desempenho do aluno, gerar um **plano de estudos personalizado**, medir a evolução ao longo do
tempo e **replanejar**. Inclui **gamificação** (flashcards com repetição espaçada, XP, streak).

**Momento mágico do MVP:** _o aluno escolhe curso + universidade → faz um diagnóstico →
recebe um plano personalizado e vê sua evolução._

Documentação completa em [`/docs`](docs/README.md) (começar por `PRD.md` e `DATA-STRATEGY.md`).

## Stack (herdada da Agendinha, adaptada)
- **Frontend:** Angular + TypeScript + Angular Material + SCSS + PWA (mobile-first).
- **Plataforma:** **Supabase** — PostgreSQL, Auth, RLS (por usuário — B2C), Storage,
  Edge Functions.
- **IA:** **API do Claude**, chamada **sempre no servidor** (Edge Functions) — a chave nunca
  vai ao frontend. Dados factuais (notas de corte, gabaritos) vêm do banco; a IA **analisa,
  explica, planeja e motiva** (nunca inventa nota de corte nem gabarito).
- **Pipeline de dados:** scripts de ingestão (offline) para carregar instituições, cursos,
  notas de corte e banco de questões.

## Regra de ouro (anti-alucinação)
Em preparação para vestibular, um erro factual é grave. **Nada de nota de corte, gabarito ou
estatística inventados.** Fatos vêm do banco de dados; a IA raciocina sobre o que recebe.

## Contexto do desenvolvedor
- Lucas Clemente — INEPAD Governança e Sucessão
- Perfil: leigo em programação, desenvolve com apoio de IA
- Sempre entregar código completo para evitar erros de edição parcial

## Regra de trabalho
Analisar primeiro; propor plano antes de mudanças estruturais; implementar incremental (uma
etapa por vez) com testes; documentar decisões em `docs/DECISIONS.md`; sinalizar riscos
(técnicos, legais/autorais, de custo de IA) antes de atalhos.
