

# Diagnóstico: O Pipeline Atual NÃO Lê os Documentos Completos

## Limitações Reais do Código Atual

Analisando o `rag-answer/index.ts`, as restrições são severas:

| Parâmetro | Pipeline Padrão | IDER Mode |
|---|---|---|
| Arquivos lidos | **2** (`fileIds.slice(0, 2)`) | **3** (`criticalDocs.slice(0, 3)`) |
| Chunks por arquivo | **30** | **30** |
| Texto por arquivo | **4.000 chars** (truncado) | **12.000 chars** (truncado) |
| Quando ativa | **Condicional** (`needsDeepRead`) | Sempre no IDER |

Um artigo científico típico tem ~30.000-50.000 caracteres. Ou seja, mesmo no melhor caso (IDER), a IA lê **~25% de 3 documentos**. No modo padrão, lê **~10% de 2 documentos** — e só quando o plano de evidência decide que precisa.

O resto da resposta vem de **fragmentos de ~300-500 chars** (chunks) sem contexto completo.

---

## Proposta: Pipeline de Leitura Total em 3 Estágios

### Estágio 1 — Retrieval & Mapeamento (sem mudança conceitual)
- Busca híbrida recupera chunks + experimentos
- **Novo**: Coletar TODOS os `source_id` (file_ids) únicos dos chunks recuperados
- Rankear por frequência: arquivo citado 5x > arquivo citado 1x

### Estágio 2 — Leitura Completa + Filtragem Inteligente (mudança principal)

**2a. Leitura completa**: Para os top N arquivos referenciados:
- Buscar TODOS os chunks do arquivo (sem `limit 30`)
- Reconstruir o texto completo (sem truncamento em 4k)
- Limite prático: ~100k chars por arquivo (artigos longos)

**2b. Filtragem inteligente por IA** (novo): Um modelo leve (`gemini-2.5-flash-lite`) recebe:
- O documento completo reconstruído
- A pergunta do usuário
- Instrução: "Extraia APENAS os trechos relevantes para responder esta pergunta. Mantenha números, tabelas, conclusões e contexto necessário. Máximo 8.000 chars por documento."

Isso é fundamentalmente diferente de truncar cegamente — a IA lê o documento inteiro e **decide o que importa**.

**2c. Limites escaláveis por tier**:

| Tier | Arquivos lidos | Chars filtrados por doc | Total máximo |
|---|---|---|---|
| Fast | 3 | 4k | 12k |
| Standard | 5 | 8k | 40k |
| Advanced/IDER | 8 | 12k | 96k |

### Estágio 3 — Síntese Final (modelo avançado)
- Recebe: contexto filtrado inteligentemente + chunks originais + experimentos + métricas
- O modelo de síntese agora tem contexto **curado e completo**, não fragmentos cegos

---

## Mudanças Técnicas

### `supabase/functions/rag-answer/index.ts`

1. **`performDeepRead` reescrito**:
   - Remover `slice(0, 2)` e `limit(30)` e `.substring(0, 4000)`
   - Buscar todos os chunks por arquivo sem limite
   - Reconstruir texto completo

2. **Nova função `intelligentDocFilter`**:
   - Chamada ao modelo leve com documento completo + pergunta
   - Retorna trechos curados (~4-12k chars por doc dependendo do tier)
   - Fallback: se o modelo falhar, truncar nos primeiros N chars (comportamento atual como safety net)

3. **Deep read SEMPRE ativo**:
   - Remover condicional `if (evidencePlanResult.needsDeepRead)`
   - Sempre executar para os top N arquivos referenciados

4. **Coleta agressiva de file_ids**:
   - De chunks: `source_id`
   - De experimentos: arquivo de origem
   - De knowledge_items: `file_id` se existir
   - Rankear por frequência + score

5. **Metadata de estágios no response**:
   - `stages: { retrieval_ms, deep_read_ms, filter_ms, synthesis_ms }`
   - `files_read: [{ name, total_chars, filtered_chars }]`

### `src/components/assistant/ChatMessage.tsx`
- Indicador visual opcional: "📖 Leu 5 documentos (142k chars → 38k filtrados)"

### `src/hooks/useAssistantChat.ts`
- Passar metadata de estágios para o componente

---

## Impacto

- **Qualidade**: A IA de síntese recebe contexto curado por outra IA que leu o documento inteiro — não fragmentos truncados cegamente
- **Latência**: +3-6s (leitura completa + filtragem). Aceitável para respostas de qualidade.
- **Custo**: +1 chamada ao flash-lite por arquivo lido (~5 chamadas por consulta)
- **Segurança**: O filtro inteligente nunca inventa dados — apenas seleciona trechos do documento real

