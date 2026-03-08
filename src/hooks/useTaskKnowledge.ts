import { supabase } from '@/integrations/supabase/client';

interface TaskKnowledgeData {
  id: string;
  title: string;
  hypothesis: string | null;
  variables_changed: string[];
  target_metrics: string[];
  success_criteria: string | null;
  procedure: string | null;
  checklist: { text: string; done: boolean }[];
  partial_results: string | null;
  conclusion: string | null;
  decision: string | null;
  external_links: string[];
  tags: string[];
}

function mapDecisionToCategory(decision: string | null): {
  category: string;
  confidence: number;
} {
  switch (decision) {
    case 'approved':
      return { category: 'result', confidence: 0.9 };
    case 'discarded':
      return { category: 'observation', confidence: 0.5 };
    case 'adjust':
    case 'repeat':
      return { category: 'recommendation', confidence: 0.6 };
    default:
      return { category: 'observation', confidence: 0.5 };
  }
}

function buildKnowledgeContent(task: TaskKnowledgeData): string {
  const decisionLabel =
    task.decision === 'approved' ? 'Aprovado' :
    task.decision === 'discarded' ? 'Descartado' :
    task.decision === 'adjust' ? 'Ajustar formulação' :
    task.decision === 'repeat' ? 'Repetir teste' :
    task.decision || 'Pendente';

  const parts: string[] = [];
  parts.push(`**Decisão:** ${decisionLabel}`);

  if (task.hypothesis) parts.push(`**Hipótese:** ${task.hypothesis}`);
  if (task.variables_changed?.length > 0) parts.push(`**Variáveis alteradas:** ${task.variables_changed.join(', ')}`);
  if (task.target_metrics?.length > 0) parts.push(`**Métricas alvo:** ${task.target_metrics.join(', ')}`);
  if (task.success_criteria) parts.push(`**Critério de sucesso:** ${task.success_criteria}`);
  if (task.procedure) parts.push(`**Procedimento:** ${task.procedure}`);

  // Checklist
  const checklistItems = Array.isArray(task.checklist) ? task.checklist : [];
  if (checklistItems.length > 0) {
    const checklistLines = checklistItems.map(
      (item: { text: string; done: boolean }) => `- [${item.done ? 'x' : ' '}] ${item.text}`
    );
    parts.push(`**Checklist:**\n${checklistLines.join('\n')}`);
  }

  if (task.partial_results) parts.push(`**Resultados:** ${task.partial_results}`);
  if (task.conclusion) parts.push(`**Conclusão:** ${task.conclusion}`);

  // External links
  if (task.external_links?.length > 0) {
    parts.push(`**Links externos:** ${task.external_links.join(', ')}`);
  }

  // Tags
  if (task.tags?.length > 0) {
    parts.push(`**Tags:** ${task.tags.join(', ')}`);
  }

  return parts.join('\n\n');
}

export async function createKnowledgeFromTask(
  task: TaskKnowledgeData,
  userId: string,
  projectId: string,
): Promise<void> {
  const title = `[Tarefa] ${task.title}`;
  const content = buildKnowledgeContent(task);
  const { category, confidence } = mapDecisionToCategory(task.decision);

  try {
    // Check if knowledge already exists for this task
    const { data: existing } = await supabase
      .from('knowledge_items')
      .select('id')
      .eq('project_id', projectId)
      .eq('title', title)
      .limit(1);

    if (existing && existing.length > 0) {
      await supabase
        .from('knowledge_items')
        .update({
          content,
          category: category as any,
          confidence,
          evidence: task.conclusion || null,
        })
        .eq('id', existing[0].id);
    } else {
      await supabase
        .from('knowledge_items')
        .insert({
          project_id: projectId,
          title,
          content,
          category: category as any,
          extracted_by: userId,
          confidence,
          human_verified: true,
          evidence: task.conclusion || null,
        });
    }
  } catch (err) {
    console.error('Erro ao criar conhecimento da tarefa:', err);
  }
}
