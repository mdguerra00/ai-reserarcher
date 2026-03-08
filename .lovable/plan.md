

# Melhorar Geração de Conhecimento a partir de Tarefas Concluídas

## Situação Atual
Já existe `createKnowledgeFromTask()` no `TaskDetailDrawer.tsx`, mas ela só dispara ao clicar "Salvar" manualmente nos campos de P&D de uma tarefa já concluída. Limitações:

1. **Não dispara ao arrastar para "Concluído"** — o `KanbanBoard` move a tarefa mas não gera conhecimento
2. **Exige conclusão E decisão preenchidas** — se o usuário concluir sem preencher esses campos, nada é gerado
3. **Conteúdo limitado** — não inclui procedimento nem checklist

## Plano

### 1. Gerar conhecimento automaticamente ao mover para coluna "Done"
No `KanbanBoard.tsx`, após o update bem-sucedido de uma tarefa para a coluna `is_done_column`, buscar os dados completos da tarefa e criar/atualizar o item de conhecimento — mesmo que conclusão/decisão ainda estejam vazios (nesse caso, gera um item parcial com os dados disponíveis).

### 2. Enriquecer o conteúdo do conhecimento gerado
Atualizar `buildKnowledgeContent()` para incluir:
- **Procedimento** (campo `procedure`)
- **Checklist** com itens marcados/desmarcados
- **Links externos**
- **Tags da tarefa**

### 3. Categorização inteligente por decisão
Ao invés de sempre usar `category: 'conclusion'`, mapear:
- `approved` → `"result"` (confidence 0.9)
- `discarded` → `"observation"` (confidence 0.5)
- `adjust`/`repeat` → `"recommendation"` (confidence 0.6)
- Sem decisão → `"observation"` (confidence 0.5)

### 4. Extrair lógica para hook reutilizável
Criar `src/hooks/useTaskKnowledge.ts` com a função `createKnowledgeFromTask(task, userId, projectId)` para ser chamada tanto do `TaskDetailDrawer` quanto do `KanbanBoard`, evitando duplicação de código.

## Arquivos Afetados
- **Criar**: `src/hooks/useTaskKnowledge.ts` — hook com lógica de geração
- **Editar**: `src/components/tasks/KanbanBoard.tsx` — chamar hook ao mover para done
- **Editar**: `src/components/tasks/TaskDetailDrawer.tsx` — usar hook compartilhado, remover lógica duplicada

