# AI-STRATEGY — AprovaLab

> Como a IA (Claude) é usada, com segurança e custo sob controle. Última atualização: 2026-09-21.

## 1. Princípio central: fatos do banco, raciocínio da IA

Vestibular é **alto risco**: um aluno não pode receber uma nota de corte inventada nem um
gabarito errado. Portanto:

- **Fatos** (notas de corte, pesos, gabaritos, estatísticas) → **sempre do banco de dados**.
- **IA** → **analisa, explica, planeja e motiva** sobre os dados que recebe no contexto.
- A IA **nunca** afirma um fato factual (nota, gabarito) que não esteja no contexto fornecido.

> Regra prática: se é um número que decide o futuro do aluno, ele vem de uma tabela — não do
> modelo.

## 2. Casos de uso do Claude (MVP)

| Caso | Entrada | Saída | Observação |
|---|---|---|---|
| **Diagnóstico de desempenho** | respostas do simulado por área/tópico + meta | forças/fraquezas + gap | saída **estruturada** (JSON) |
| **Plano de estudos** | diagnóstico + tempo até a prova + rotina | plano com foco/sequência/metas | estruturado, revisável |
| **Replanejamento** | histórico de simulados | ajuste do plano | compara evolução |
| **Explicação de questão** | item + **gabarito real** | explicação do raciocínio | ancorado no gabarito |
| **Geração de flashcards** | tópico | frente/verso | alto volume → modelo barato |
| **Geração de questões** (se Opção 2 do `DATA-STRATEGY`) | matriz (área/tópico/dificuldade) | item + gabarito + distratores | **passa por curadoria** |

**Fase 2 (forte candidato):** **correção de redação** nas 5 competências do ENEM, com feedback.

## 3. Onde a IA roda
- **Sempre no servidor** (Supabase **Edge Functions**). A **chave da API do Claude nunca vai
  ao frontend.**
- O frontend chama a Edge Function; a função monta o contexto (dados do banco), chama o Claude,
  valida a saída e grava o resultado.

## 4. Saída estruturada e validação
- Tarefas de análise/plano usam **saída estruturada** (JSON com schema), validada antes de
  salvar (ex.: `zod` na Edge Function).
- Se a saída não bater com o schema, **não** exibimos — reprocessa ou cai num fallback seguro.
- Explicações de questão só são geradas **com o gabarito no contexto**; a IA explica, não decide
  a resposta.

## 5. Escolha de modelos (a fixar na implementação)
Usaremos a família **Claude** mais recente (Claude 5 / Haiku 4.5). Diretriz por tarefa:
- **Raciocínio pesado** (diagnóstico, plano, geração de questões): modelo **mais capaz**.
- **Alto volume / barato** (flashcards, dicas curtas, tags): modelo **rápido/econômico** (Haiku).

> Os **IDs de modelo, preços e parâmetros exatos** serão definidos na implementação consultando
> a skill `claude-api` (fonte da verdade), não de memória.

## 6. Custo sob controle (é um risco real)
- **Cache de contexto** (prompt caching) para partes repetidas (matriz, instruções).
- **Modelo certo para a tarefa** (não usar o mais caro para gerar flashcard).
- **Batch** quando possível (geração de itens/flashcards em lote).
- **Limites por usuário/plano** (freemium) para conter abuso.
- **Log de uso e custo** por chamada (tabela `ai_generations`) para monitorar.

## 7. Segurança e privacidade
- Não enviar ao modelo dados pessoais sensíveis desnecessários do aluno.
- Registrar apenas o essencial das gerações (para auditoria/custo), sem PII evitável.
- Conteúdo gerado é **de apoio ao estudo**, com aviso de que pode conter imprecisões e não
  substitui a prova oficial.

## 8. Qualidade e confiança
- Itens gerados por IA passam por **curadoria** antes de valer para diagnóstico (ver
  `DATA-STRATEGY §4`).
- Mostrar ao aluno a **origem** do conteúdo (oficial vs. gerado) quando relevante.
- Coletar feedback ("essa questão tem problema?") para melhorar o banco.
