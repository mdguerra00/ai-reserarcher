import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, AlertTriangle, Lock } from 'lucide-react';
import type { KanbanTask } from './KanbanBoard';

interface MemberInfo {
  user_id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

const priorityConfig: Record<string, { color: string; label: string }> = {
  low: { color: 'bg-muted text-muted-foreground', label: 'Baixa' },
  medium: { color: 'bg-primary/10 text-primary', label: 'Média' },
  high: { color: 'bg-warning/10 text-warning', label: 'Alta' },
  urgent: { color: 'bg-destructive/10 text-destructive', label: 'Urgente' },
};

interface KanbanCardProps {
  task: KanbanTask;
  members: MemberInfo[];
  onClick: () => void;
  isDragOverlay?: boolean;
}

export function KanbanCard({ task, members, onClick, isDragOverlay }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const assignee = members.find(m => m.user_id === task.assigned_to);
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
  const isBlocked = task.status === 'blocked';
  const isDone = task.status === 'done';
  const priority = priorityConfig[task.priority] || priorityConfig.medium;

  // Decision-based coloring for completed tasks
  const getDecisionStyle = () => {
    if (!isDone || !task.decision) return '';
    switch (task.decision) {
      case 'approved':
        return 'border-green-500/50 bg-green-500/10';
      case 'discarded':
        return 'border-red-500/50 bg-red-500/10';
      default:
        return 'border-yellow-500/50 bg-yellow-500/10';
    }
  };

  const getInitials = (name?: string | null, email?: string) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    return email?.charAt(0).toUpperCase() ?? '?';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`
        rounded-lg border bg-card p-3 cursor-grab active:cursor-grabbing
        hover:border-primary/40 transition-all shadow-sm hover:shadow-md
        ${isDragging ? 'opacity-30' : ''}
        ${isDragOverlay ? 'shadow-lg rotate-2 scale-105' : ''}
        ${isBlocked ? 'border-destructive/30 bg-destructive/5' : ''}
        ${isOverdue && !isDone ? 'border-warning/30' : ''}
        ${getDecisionStyle()}
      `}
    >
      {/* Priority + Blocked indicator */}
      <div className="flex items-center justify-between mb-2">
        <Badge className={`${priority.color} text-[10px] px-1.5 py-0 h-4`} variant="secondary">
          {priority.label}
        </Badge>
        <div className="flex items-center gap-1">
          {isBlocked && <Lock className="h-3 w-3 text-destructive" />}
          {isOverdue && <AlertTriangle className="h-3 w-3 text-warning" />}
        </div>
      </div>

      {/* Title */}
      <p className="text-sm font-medium line-clamp-2 mb-2">{task.title}</p>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.slice(0, 3).map((tag, i) => (
            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground">
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="text-[10px] text-muted-foreground">+{task.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer: due date + assignee */}
      <div className="flex items-center justify-between mt-1">
        {task.due_date ? (
          <span className={`flex items-center gap-1 text-[11px] ${isOverdue ? 'text-warning font-medium' : 'text-muted-foreground'}`}>
            <Calendar className="h-3 w-3" />
            {new Date(task.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
          </span>
        ) : (
          <span />
        )}

        {assignee && (
          <Avatar className="h-5 w-5">
            <AvatarImage src={assignee.avatar_url || undefined} />
            <AvatarFallback className="text-[8px]">
              {getInitials(assignee.full_name, assignee.email)}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
}
