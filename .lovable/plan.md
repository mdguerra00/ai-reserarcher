

# Remover Painel de Fontes e Tornar Badges Clicáveis com Navegação

## O que muda

1. **Remover o SourcesPanel** (painel direito) tanto em `Assistant.tsx` quanto em `ProjectAssistant.tsx`, junto com o botão de toggle e toda a lógica associada (`showSources`, `highlightedCitation`, `allSources`, auto-show useEffect).

2. **Tornar os badges de fonte clicáveis com navegação real** em `ChatMessage.tsx`. Cada fonte já possui `type` e `id`. A lógica de navegação será:

| `source.type` | Destino |
|---|---|
| `file` | `/projects/{project}/files` (ou abre modal do arquivo) |
| `knowledge_items` / `insight` | `/knowledge` |
| `tasks` / `task` | `/tasks` |
| `reports` / `report` | `/reports` |
| `experiment` / `measurement` | `/projects/{project}` (aba experimentos) |
| `excel_cell` | `/projects/{project}/files` |

   Como as fontes não possuem `project_id` diretamente (apenas o nome do projeto como string), a navegação irá para as páginas de listagem correspondentes. No futuro pode-se refinar para abrir o item específico.

3. **Usar `react-router-dom` `useNavigate`** no `ChatMessage` para navegar ao clicar em um badge de fonte.

## Arquivos afetados

- **`src/pages/Assistant.tsx`** — remover SourcesPanel, toggle button, estados relacionados
- **`src/components/projects/ProjectAssistant.tsx`** — idem
- **`src/components/assistant/ChatMessage.tsx`** — adicionar `useNavigate`, mapear `source.type` → rota, navegar no `onClick` dos badges de fonte
- **`src/components/assistant/SourcesPanel.tsx`** — pode ser mantido (sem uso) ou removido; não é estritamente necessário deletar

