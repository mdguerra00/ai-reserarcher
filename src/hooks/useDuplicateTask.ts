import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface DuplicatableTask {
  title: string;
  description?: string | null;
  project_id: string;
  priority: string;
  assigned_to?: string | null;
  due_date?: string | null;
  tags?: string[];
  hypothesis?: string | null;
  variables_changed?: string[];
  target_metrics?: string[];
  success_criteria?: string | null;
  procedure?: string | null;
  checklist?: any;
  external_links?: string[];
}

export function useDuplicateTask(onSuccess?: () => void) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [duplicating, setDuplicating] = useState(false);

  const duplicateTask = async (task: DuplicatableTask) => {
    if (!user) return;
    setDuplicating(true);
    try {
      const { error } = await supabase.from('tasks').insert({
        title: `${task.title} (cópia)`,
        description: task.description || null,
        project_id: task.project_id,
        priority: task.priority as any,
        assigned_to: task.assigned_to || null,
        due_date: task.due_date || null,
        tags: task.tags || [],
        status: 'backlog' as any,
        hypothesis: task.hypothesis || null,
        variables_changed: task.variables_changed || [],
        target_metrics: task.target_metrics || [],
        success_criteria: task.success_criteria || null,
        procedure: task.procedure || null,
        checklist: task.checklist || [],
        external_links: task.external_links || [],
        created_by: user.id,
      });

      if (error) throw error;

      toast({
        title: 'Tarefa duplicada',
        description: `"${task.title} (cópia)" criada no Backlog.`,
      });

      onSuccess?.();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao duplicar',
        description: err.message || 'Tente novamente.',
      });
    } finally {
      setDuplicating(false);
    }
  };

  return { duplicateTask, duplicating };
}
