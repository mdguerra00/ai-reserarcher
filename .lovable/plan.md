

# Criar Entidades: Produto, Pesquisa, Projeto de Produto e Alteração de Produto

## Resumo

Criar as 4 entidades centrais do sistema de gestão de ciclo de vida de produto (ISO 13485), com tabelas no banco, páginas no frontend e navegação reorganizada.

## Fase 1 — Banco de Dados (6 tabelas + enums)

### Enums novos
- `product_lifecycle_status`: development, active, discontinued, obsolete
- `research_status`: draft, in_progress, concluded, promoted
- `knowledge_destination`: archived, continue_research, escalate_product_dev, escalate_product_change, escalate_capa, escalate_process_change
- `product_dev_status`: planning, design_input, design_output, verification, validation, transfer, released, cancelled
- `product_change_status`: draft, under_review, approved, implemented, rejected
- `change_origin`: research, capa, complaint, supplier, process, regulatory, other
- `timeline_event_type`: creation, research_linked, development_milestone, change_approved, change_implemented, document_updated, risk_reviewed, version_released

### Tabelas

**`products`** — Entidade central
- id, name, family, intended_use, regulatory_status (text), lifecycle_status (enum), current_version (text), created_by, created_at, updated_at, deleted_at

**`researches`** — Trilha de conhecimento
- id, project_id (FK projects, opcional), title, objective, hypothesis, motivation, responsible_id, method, results, conclusions, learnings, keywords (text[]), future_application, knowledge_destination (enum), status (enum), linked_product_id (FK products, opcional), created_by, created_at, updated_at, deleted_at

**`product_developments`** — Projeto de Novo Produto
- id, product_id (FK products), project_id (FK projects, opcional), code, intended_use, design_inputs (text), design_outputs (text), risk_summary (text), verification_status (text), validation_status (text), transfer_status (text), regulatory_status (text), status (enum), created_by, created_at, updated_at, deleted_at

**`product_changes`** — Alteração de Produto Vigente
- id, product_id (FK products), project_id (FK projects, opcional), version_from, version_to, description, reason, origin (enum), technical_impact, regulatory_impact, risk_impact, process_impact, needs_verification (bool), needs_validation (bool), affected_documents (text[]), implementation_date, approved_by, approved_at, status (enum), created_by, created_at, updated_at, deleted_at

**`product_timeline_events`** — Timeline unificada
- id, product_id (FK products), event_type (enum), title, description, event_date, source_type (text), source_id (uuid), created_by, created_at

**`research_links`** — Vínculos pesquisa ↔ produto/dev/alteração
- id, research_id (FK researches), target_type (text: product/product_development/product_change), target_id (uuid), link_type (text: originated/related/evidence), created_by, created_at

### RLS Policies
- Todas as tabelas seguem o padrão existente: acesso via `is_project_member` para entidades com `project_id`, e para `products` (sem project_id direto) via membership nos product_developments/changes associados ou role admin.
- Products: qualquer authenticated pode ver; researchers podem criar/atualizar; managers podem deletar.
- Researches/developments/changes: herdam acesso via project_id.
- Timeline/links: leitura por authenticated, escrita por researchers.

## Fase 2 — Frontend

### Navegação (AppSidebar.tsx)
Reorganizar em 3 grupos:
- **Principal**: Dashboard, Assistente IA
- **Produto**: Produtos (`/products`), Pesquisas (`/researches`), Tarefas, Relatórios
- **Recursos**: Arquivos, Base de Conhecimento

### Novas Rotas (App.tsx)
- `/products` — Catálogo de produtos
- `/products/:id` — Detalhe do produto com abas (Visão Geral, Origem, Desenvolvimento, Alterações, Timeline)
- `/researches` — Lista de pesquisas
- `/researches/new` — Nova pesquisa
- `/researches/:id` — Detalhe da pesquisa com "Destino do conhecimento"

### Novas Páginas
1. **Products.tsx** — Listagem com filtros (família, status lifecycle, busca)
2. **ProductDetail.tsx** — Página-mãe com abas:
   - Visão Geral (identificação, status, versão)
   - Origem (pesquisas + projeto de dev vinculados)
   - Desenvolvimento (design inputs/outputs, V&V)
   - Alterações (lista cronológica)
   - Timeline (eventos ordenados)
3. **Researches.tsx** — Listagem com filtros (status, destino, projeto)
4. **ResearchDetail.tsx** — Detalhe com formulário completo + botão "Promover para..."

### Componentes principais
- `ProductCard.tsx` — Card para listagem
- `ResearchCard.tsx` — Card para listagem
- `ProductTimeline.tsx` — Timeline visual do produto
- `PromoteResearchModal.tsx` — Modal "Promover para" (Novo Produto / Alteração / CAPA)
- `ProductChangeForm.tsx` — Formulário de alteração de produto
- `ProductDevForm.tsx` — Formulário de projeto de desenvolvimento

## Impacto no existente
- Nenhuma tabela existente é alterada ou removida
- A entidade `projects` continua funcionando normalmente (pesquisas e developments podem referenciar projetos para herdar membros/tarefas/arquivos)
- Sidebar é expandido, não substituído

## Ordem de implementação
1. Migration: criar enums + tabelas + RLS
2. Páginas de listagem (Products, Researches)
3. Páginas de detalhe (ProductDetail, ResearchDetail)
4. Formulários de criação/edição
5. Timeline do produto
6. Modal "Promover para" na pesquisa

