import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanCard } from './KanbanCard';
import type { BoardColumn, KanbanTask } from './KanbanBoard';
import { Badge } from '@/components/ui/badge';

interface MemberInfo {
  user_id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

interface KanbanColumnProps {
  column: BoardColumn;
  tasks: KanbanTask[];
  members: MemberInfo[];
  onTaskClick: (task: KanbanTask) => void;
  unreadTaskIds?: Set<string>;
}

export function KanbanColumn({ column, tasks, members, onTaskClick, unreadTaskIds }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  const taskIds = tasks.map(t => t.id);
  const isAtLimit = column.wip_limit ? tasks.length >= column.wip_limit : false;

  return (
    <div className="flex-shrink-0 w-[280px]">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: column.color || 'hsl(var(--muted-foreground))' }}
          />
          <h3 className="text-sm font-semibold text-foreground">{column.name}</h3>
          <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5 min-w-[20px] justify-center">
            {tasks.length}
          </Badge>
        </div>
        {column.wip_limit && (
          <span className={`text-xs ${isAtLimit ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
            máx {column.wip_limit}
          </span>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={`
          min-h-[200px] rounded-lg p-2 space-y-2 transition-colors
          ${isOver ? 'bg-primary/5 ring-2 ring-primary/20' : 'bg-muted/40'}
        `}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <KanbanCard
              key={task.id}
              task={task}
              members={members}
              onClick={() => onTaskClick(task)}
              hasUnreadComments={unreadTaskIds?.has(task.id)}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
            Arraste tarefas aqui
          </div>
        )}
      </div>
    </div>
  );
}
