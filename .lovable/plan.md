

# Pipeline de Leitura Total em 3 Estágios — IMPLEMENTADO ✅

## Mudanças Implementadas

### 1. `performDeepRead` reescrito
- ✅ Removido `slice(0, 2)` → agora usa tiers: Fast=3, Standard=5, Advanced=8 arquivos
- ✅ Removido `limit(30)` nos chunks → busca TODOS os chunks por arquivo
- ✅ Removido `.substring(0, 4000)` → texto completo reconstruído (~100k chars)
- ✅ Adicionada filtragem inteligente via `intelligentDocFilter` (gemini-2.5-flash-lite)

### 2. Nova função `intelligentDocFilter`
- ✅ Modelo leve lê documento completo + pergunta do usuário
- ✅ Retorna apenas trechos relevantes (4k-12k chars por doc conforme tier)
- ✅ Fallback: se IA falhar, trunca nos primeiros N chars (safety net)

### 3. Deep read SEMPRE ativo
- ✅ Removida condicional `if (evidencePlanResult.needsDeepRead)`
- ✅ Sempre executa para todos os arquivos referenciados

### 4. Coleta agressiva de file_ids
- ✅ Nova função `collectReferencedFileIds` coleta de chunks + experimentos
- ✅ Rankeia por frequência de referência

### 5. `deepReadCriticalDocs` (IDER) atualizado
- ✅ Sem limite de chunks, sem truncamento
- ✅ Usa `intelligentDocFilter` com tier advanced (12k chars por doc, 8 arquivos)

### 6. Metadata de estágios no response
- ✅ `_deep_read: { files_read, total_read_ms, filter_ms }`
- ✅ Frontend exibe indicador: "📖 Leu 5 documentos (142k chars → 38k filtrados)"

### Tiers de Leitura

| Tier | Arquivos | Chars filtrados/doc | Total máximo |
|------|----------|-------------------|-------------|
| Fast | 3 | 4k | 12k |
| Standard | 5 | 8k | 40k |
| Advanced | 8 | 12k | 96k |
