import { useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface BoardColumn {
  id: string;
  name: string;
  status_key: string;
  position: number;
  color: string | null;
  wip_limit: number | null;
  is_done_column: boolean;
  is_blocked_column: boolean;
}

export interface KanbanTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigned_to: string | null;
  due_date: string | null;
  tags: string[];
  column_id: string | null;
  column_order: number;
  blocked_reason: string | null;
  created_at: string;
  completed_at: string | null;
  hypothesis: string | null;
  variables_changed: string[];
  target_metrics: string[];
  success_criteria: string | null;
  procedure: string | null;
  checklist: any[];
  conclusion: string | null;
  decision: string | null;
  partial_results: string | null;
  external_links: string[];
  updated_at: string;
  project_id: string;
}

interface MemberInfo {
  user_id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

interface KanbanBoardProps {
  columns: BoardColumn[];
  tasks: KanbanTask[];
  members: MemberInfo[];
  onTaskClick: (task: KanbanTask) => void;
  onTasksChange: () => void;
  onBlockedReasonRequired: (taskId: string, targetColumnId: string) => void;
}

export function KanbanBoard({
  columns,
  tasks,
  members,
  onTaskClick,
  onTasksChange,
  onBlockedReasonRequired,
}: KanbanBoardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const sortedColumns = useMemo(
    () => [...columns].sort((a, b) => a.position - b.position),
    [columns]
  );

  const tasksByColumn = useMemo(() => {
    const map: Record<string, KanbanTask[]> = {};
    for (const col of sortedColumns) {
      map[col.id] = [];
    }
    for (const task of tasks) {
      const colId = task.column_id;
      if (colId && map[colId]) {
        map[colId].push(task);
      } else {
        // Fallback: match by status_key
        const matchCol = sortedColumns.find(c => c.status_key === task.status);
        if (matchCol) {
          map[matchCol.id] = map[matchCol.id] || [];
          map[matchCol.id].push(task);
        }
      }
    }
    // Sort each column's tasks
    for (const colId in map) {
      map[colId].sort((a, b) => (a.column_order || 0) - (b.column_order || 0));
    }
    return map;
  }, [tasks, sortedColumns]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    if (task) setActiveTask(task);
  }, [tasks]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over || !user) return;

    const taskId = active.id as string;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Determine target column
    let targetColumnId: string;
    const overColumn = sortedColumns.find(c => c.id === over.id);
    if (overColumn) {
      targetColumnId = overColumn.id;
    } else {
      // Dropped on a task - find which column that task is in
      const overTask = tasks.find(t => t.id === over.id);
      if (!overTask) return;
      targetColumnId = overTask.column_id || '';
      if (!targetColumnId) {
        const matchCol = sortedColumns.find(c => c.status_key === overTask.status);
        if (matchCol) targetColumnId = matchCol.id;
      }
    }

    if (!targetColumnId) return;

    const targetColumn = sortedColumns.find(c => c.id === targetColumnId);
    if (!targetColumn) return;

    // Check if moving to blocked column
    if (targetColumn.is_blocked_column && task.column_id !== targetColumnId) {
      onBlockedReasonRequired(taskId, targetColumnId);
      return;
    }

    // Check WIP limit
    if (targetColumn.wip_limit) {
      const currentCount = (tasksByColumn[targetColumnId] || []).length;
      const isMovingWithin = task.column_id === targetColumnId;
      if (!isMovingWithin && currentCount >= targetColumn.wip_limit) {
        toast({
          variant: 'destructive',
          title: 'Limite WIP atingido',
          description: `A coluna "${targetColumn.name}" já possui ${targetColumn.wip_limit} tarefas.`,
        });
        return;
      }
    }

    // Calculate new order
    const targetTasks = tasksByColumn[targetColumnId] || [];
    const newOrder = targetTasks.length;

    try {
      const updateData: Record<string, any> = {
        column_id: targetColumnId,
        column_order: newOrder,
        status: targetColumn.status_key,
      };

      if (targetColumn.is_done_column) {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;

      // Auto-generate knowledge when moving to done column
      if (targetColumn.is_done_column && task.column_id !== targetColumnId) {
        try {
          // Fetch full task data for knowledge generation
          const { data: fullTask } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', taskId)
            .single();

          if (fullTask) {
            const { createKnowledgeFromTask } = await import('@/hooks/useTaskKnowledge');
            await createKnowledgeFromTask({
              id: fullTask.id,
              title: fullTask.title,
              hypothesis: fullTask.hypothesis,
              variables_changed: fullTask.variables_changed || [],
              target_metrics: fullTask.target_metrics || [],
              success_criteria: fullTask.success_criteria,
              procedure: fullTask.procedure,
              checklist: Array.isArray(fullTask.checklist) ? fullTask.checklist as { text: string; done: boolean }[] : [],
              partial_results: fullTask.partial_results,
              conclusion: fullTask.conclusion,
              decision: fullTask.decision,
              external_links: fullTask.external_links || [],
              tags: fullTask.tags || [],
            }, user.id, fullTask.project_id);
          }
        } catch (knowledgeErr) {
          console.error('Erro ao gerar conhecimento:', knowledgeErr);
        }
      }

      // Log activity
      if (task.column_id !== targetColumnId) {
        const oldCol = sortedColumns.find(c => c.id === task.column_id);
        await supabase.from('task_activity_log').insert({
          task_id: taskId,
          user_id: user.id,
          action: 'status_change',
          field_changed: 'status',
          old_value: oldCol?.name || task.status,
          new_value: targetColumn.name,
        });
      }

      onTasksChange();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao mover tarefa',
        description: error.message,
      });
    }
  }, [tasks, sortedColumns, tasksByColumn, user, onTasksChange, onBlockedReasonRequired, toast]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    // Optional: could add visual feedback
  }, []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin min-h-[60vh]">
        {sortedColumns.map(column => {
          const columnTasks = tasksByColumn[column.id] || [];
          return (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={columnTasks}
              members={members}
              onTaskClick={onTaskClick}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activeTask ? (
          <KanbanCard
            task={activeTask}
            members={members}
            onClick={() => {}}
            isDragOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
