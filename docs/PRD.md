# PRD — AprovaLab (Copiloto do Vestibular)

> Product Requirements Document. Fonte da verdade dos requisitos. Última atualização: 2026-09-21.
> Nome do produto: **AprovaLab**.

## 1. Visão

Uma plataforma que usa **dados reais de aprovação** e **IA (Claude)** para guiar o vestibulando:
mostra a **meta concreta** (curso/universidade e o que é preciso para entrar), diagnostica o
**nível atual** com simulados baseados no histórico de provas, e entrega um **plano de estudos
personalizado** que **evolui** com o aluno. Gamificado para manter o engajamento.

### Problema
O vestibulando vive três dores:
1. **Falta de norte:** não sabe quão longe está do curso que quer.
2. **Excesso de conteúdo:** não sabe **o que priorizar** com o tempo que tem.
3. **Falta de constância:** estuda sem feedback de evolução e desanima.

### Hipótese central do MVP
> Se o aluno vir **a distância exata** entre onde está e a nota de corte do seu curso, e receber
> um **plano personalizado** que se ajusta conforme ele evolui, ele estuda com mais foco,
> constância e confiança — e melhora o desempenho real.

### Momento mágico
**Escolher curso → diagnóstico → plano personalizado → ver a evolução.**

> ⚠️ Não é um cursinho com videoaulas. É um **copiloto**: diagnóstico, direção e acompanhamento.

## 2. Objetivos e métricas (proxies para o piloto)

| Objetivo | Métrica |
|---|---|
| Entregar clareza de meta | % de alunos que definem curso-alvo e veem o "gap" |
| Diagnóstico útil | % que completa o simulado diagnóstico |
| Personalização percebida | % que ativa o plano de estudos gerado |
| Constância | alunos ativos por semana (WAU) · streak médio |
| Evolução real | variação de acerto por área entre simulados |

## 3. Personas

- **Aluno do 3º ano / vestibulando** (principal): quer um curso concorrido, ansioso, com tempo
  limitado, estuda pelo celular.
- **Autodidata / "segunda tentativa"** (secundária): já fez ENEM, quer subir a nota.
- (Futuro) **Responsáveis**: acompanham evolução. **Cursinhos/professores** (B2B2C).

## 4. Jornada do aluno (MVP)

1. **Cadastro** e perfil (ano/série, tempo até a prova, rotina de estudo).
2. **Escolha da meta:** curso(s) + universidade(s) alvo → o sistema mostra **nota de corte**
   (SISU/Fuvest), **concorrência** e **pesos por área** daquele curso.
3. **Diagnóstico:** simulado inicial montado por área/tópico, ponderado como o exame-alvo.
4. **Resultado + análise (IA):** desempenho por área/tópico, **pontos fortes/fracos**, e o
   **gap** até a nota de corte.
5. **Plano de estudos (IA):** o que focar, em que ordem, metas semanais realistas.
6. **Ciclo de estudo:** flashcards (repetição espaçada) e micro-simulados sobre os pontos fracos.
7. **Re-simulado periódico:** mede evolução → a IA **replaneja** a estratégia.
8. **Gamificação:** XP, níveis, streak e conquistas ao longo de todo o ciclo.

## 5. Escopo do MVP

**Exame inicial: ENEM/SISU** (maior público, dados mais abertos). Fuvest e outros vêm depois.

### Módulos do MVP
1. Conta e perfil do aluno
2. **Catálogo de metas:** instituições, cursos, notas de corte (SISU) + tela da meta
3. **Banco de questões** por área/tópico (ver `DATA-STRATEGY.md`)
4. **Simulado:** montagem, aplicação, correção
5. **Análise de desempenho + Plano de estudos (IA)**
6. **Flashcards** com repetição espaçada
7. **Evolução:** re-simulado + comparação ao longo do tempo
8. **Gamificação:** XP, streak, conquistas
9. **Dashboard** do aluno

## 6. Requisitos funcionais (núcleo)

### Meta (RF-MT)
- **RF-MT-01** Buscar curso + instituição e ver **nota de corte** histórica (por ano/modalidade).
- **RF-MT-02** Ver **pesos por área** e concorrência do curso-alvo.
- **RF-MT-03** Definir 1+ metas com prioridade; calcular o **gap** vs. desempenho atual.

### Simulado (RF-SM)
- **RF-SM-01** Montar simulado a partir do banco de questões, ponderado por área como o exame.
- **RF-SM-02** Aplicar (tempo, navegação por questões) e **corrigir** com gabarito real.
- **RF-SM-03** Guardar respostas por questão/tópico para análise.
- **RF-SM-04** Suportar **diagnóstico** (inicial) e **re-simulados** periódicos.

### Análise & Plano (RF-IA)
- **RF-IA-01** Gerar diagnóstico por área/tópico (forte/fraco) a partir das respostas.
- **RF-IA-02** Gerar **plano de estudos** personalizado (foco, sequência, metas semanais).
- **RF-IA-03** Ao re-simular, comparar com o histórico e **ajustar** o plano.
- **RF-IA-04** Explicar questões (por que a alternativa correta é correta) — ancorado no gabarito.

### Flashcards & Gamificação (RF-GM)
- **RF-GM-01** Baralhos de flashcards por tópico; revisão com **repetição espaçada** (SM-2).
- **RF-GM-02** XP por atividade, **streak** diário, níveis e conquistas.

## 7. Requisitos não-funcionais
- **RNF-01 Confiabilidade factual:** zero fatos inventados (ver `AI-STRATEGY.md`).
- **RNF-02 Mobile-first / PWA:** rápido no celular; estudo em qualquer lugar.
- **RNF-03 Privacidade (LGPD):** dados de menores de idade; ver `DECISIONS.md §Riscos`.
- **RNF-04 Custo de IA sob controle:** caching, modelos adequados por tarefa.
- **RNF-05 Segurança:** chave da IA e chaves de serviço só no servidor.

## 8. Fora do MVP (mas arquitetura preparada)
- **Correção de redação por IA** (alto valor — forte candidato à Fase 2).
- Videoaulas / conteúdo didático próprio.
- Fuvest e vestibulares estaduais; Prouni/FIES; ranking social; app nativo; painel para
  cursinhos (B2B2C).

## 9. Riscos (resumo — detalhe em `DECISIONS.md`)
- **Direito autoral das questões** (o mais sensível) — ver `DATA-STRATEGY.md`.
- Qualidade das questões (se geradas por IA) exige curadoria.
- Custo de IA em escala.
- Escopo grande → manter MVP enxuto.

## 10. Modelo de negócio (a decidir — não bloqueia o MVP)
Hipótese: **freemium** (diagnóstico + plano básico grátis; simulados ilimitados, flashcards
avançados e análises profundas no plano pago). Decidir depois; ver `DECISIONS.md`.

## 11. Concorrência (referência, não copiar)
Existem apps de questões (ex.: bancos de questões e simulados) e plataformas de cursinho. Nosso
diferencial: **meta concreta + diagnóstico + plano de IA que evolui** — menos "banco de
exercícios", mais "copiloto que te guia até o curso".

## 12. Nome do produto
**AprovaLab** (definido em 2026-09-21). Verificar registro de marca e domínio antes do
lançamento comercial.
