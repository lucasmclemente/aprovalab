# DATA-STRATEGY — AprovaLab

> Como obtemos, organizamos e usamos os dados. É a base do produto **e** o maior risco.
> Última atualização: 2026-09-21. **Vários itens precisam de decisão sua** (ver §5).

## 1. Dois ativos de dados distintos

| Ativo | Natureza | Risco | Uso |
|---|---|---|---|
| **A. Dados de resultado/meta** (notas de corte, concorrência, pesos) | Público (INEP, MEC/SISU, Fuvest) | Baixo | Mostrar a meta e o "gap" |
| **B. Banco de questões** (itens de prova) | Direito autoral | **Alto** | Montar simulados e flashcards |

Tratamos os dois com estratégias diferentes.

## 2. Ativo A — Dados de resultado/meta (público)

**Fontes:**
- **INEP** — microdados do ENEM (resultados, participantes) e sinopses estatísticas. Arquivos
  grandes (CSV); baixados e processados **offline**.
- **MEC / SISU** — **notas de corte** por curso/instituição/modalidade e vagas (parciais e
  finais de cada edição). Publicadas a cada processo seletivo.
- **Fuvest / outros** (Fase 2) — notas de corte, pesos e concorrência por carreira.

**Como usamos:**
- Pipeline de ingestão (scripts) → normaliza → tabelas: `institutions`, `courses`,
  `course_offerings`, `cutoffs` (nota de corte por oferta × ano × modalidade), `exam_weights`.
- O aluno consulta a meta; o "gap" é calculado comparando o desempenho do simulado (convertido
  para uma estimativa de nota) com a nota de corte.
- **Atualização:** anual/sazonal (a cada edição do SISU/ENEM).

> **MVP enxuto:** não precisamos dos microdados completos (milhões de linhas) para começar —
> precisamos de **notas de corte + pesos + catálogo de cursos**. Microdados detalhados podem
> vir depois para benchmarks.

## 3. Ativo B — Banco de questões (o ponto sensível)

Aqui está o principal risco jurídico. As questões de prova têm **direito autoral** (do INEP, no
caso do ENEM; das bancas/universidades nos demais). Precisamos de uma estratégia de conteúdo
**consciente e defensável**. Três abordagens:

### Opção 1 — Provas oficiais liberadas (ex.: ENEM)
O INEP divulga publicamente as provas anteriores e os gabaritos. Estruturaríamos os itens
(enunciado, alternativas, gabarito) com metadados (ano, área, habilidade da matriz, tópico,
dificuldade).
- ✅ Fidelidade máxima ao exame real; ótimo para diagnóstico.
- ⚠️ **Titularidade é do INEP.** "Divulgado publicamente" **não** é o mesmo que "livre para uso
  comercial". Uso comercial exige avaliar os **termos de uso do INEP** e, possivelmente,
  **atribuição** e restrição aos itens oficialmente liberados. **Requer verificação jurídica.**

### Opção 2 — Questões originais geradas por IA (Claude), curadas
Gerar itens **no estilo/matriz** do ENEM, revisados por curadoria antes de entrar no banco.
- ✅ Escala infinita; **sem risco autoral**; controlamos dificuldade e tópico.
- ⚠️ Qualidade é crítica: um item ruim ou com gabarito ambíguo é pior que nenhum. Exige
  **processo de curadoria** (revisão humana/IA cruzada) e marcação de origem.

### Opção 3 — Licenciar um banco de terceiros
Fechar parceria/licença com um cursinho ou editora que já tenha banco de questões.
- ✅ Qualidade e legalidade resolvidas.
- ⚠️ Custo/negociação; dependência de parceiro.

### Recomendação (a confirmar com você)
**Híbrido, começando pela Opção 2 para o MVP:**
1. **MVP:** banco de **questões originais geradas e curadas** (matriz do ENEM), rotuladas por
   área/tópico/dificuldade. Evita o risco autoral enquanto validamos o produto.
2. **Paralelo:** avaliar juridicamente o uso de **itens oficiais liberados** do ENEM (Opção 1)
   para elevar a fidelidade do diagnóstico — só entram se o uso for claramente permitido.
3. **Evolução:** considerar **licenciar** um banco (Opção 3) quando escalar.

> Assim o produto anda sem depender de uma questão jurídica em aberto, e a fidelidade cresce à
> medida que resolvemos direitos.

## 4. Qualidade das questões geradas (se Opção 2)
- Geração por IA com **matriz de referência** (área → habilidade → tópico → dificuldade).
- **Curadoria em duas camadas:** (a) verificação automática (unicidade da resposta, sem
  ambiguidade, plausibilidade dos distratores) + (b) revisão humana amostral.
- Cada item guarda: `source = 'ai_generated'`, versão do prompt/modelo, status de curadoria.
- **Calibração de dificuldade** com o uso real (quantos % acertam) — ajusta o rótulo ao longo
  do tempo.

## 5. Decisões que dependem de você
1. **Estratégia de questões** (Opção 1 / 2 / 3 / híbrido). Recomendo **híbrido começando pela 2**.
   *Impacto: define o MVP e o risco jurídico.*
2. **Verificação jurídica** do uso de provas oficiais (ENEM) — vale consultar um advogado antes
   de usar itens oficiais comercialmente.
3. **Exame inicial:** confirmo **ENEM/SISU**?
4. **Fonte das notas de corte:** coleta automática dos portais oficiais vs. carga manual inicial.

## 6. Governança de dados
- Dados brutos baixados ficam em `data/raw/` (fora do git — são grandes).
- Scripts de ingestão versionados; cada carga registra fonte, data e versão.
- Dados pessoais do aluno sob LGPD (ver `SECURITY`/`DECISIONS`). Menores de idade → atenção
  redobrada a consentimento.
