import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search,
  CheckSquare,
  Calendar,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal';
import { TaskEditModal } from '@/components/tasks/TaskEditModal';

type Task = Tables<'tasks'> & {
  projects: { name: string } | null;
};

const statusColors: Record<string, string> = {
  backlog: 'bg-muted text-muted-foreground',
  todo: 'bg-muted text-muted-foreground',
  in_progress: 'bg-primary/10 text-primary',
  blocked: 'bg-destructive/10 text-destructive',
  review: 'bg-warning/10 text-warning',
  done: 'bg-success/10 text-success',
};

const statusLabels: Record<string, string> = {
  backlog: 'Backlog',
  todo: 'A Fazer',
  in_progress: 'Em Andamento',
  blocked: 'Bloqueado',
  review: 'Revisão',
  done: 'Concluído',
};

const priorityColors: Record<string, string> = {
  low: 'text-muted-foreground',
  medium: 'text-foreground',
  high: 'text-warning',
  urgent: 'text-destructive',
};

export default function Tasks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchTasks = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('tasks')
        .select('*, projects(name)')
        .is('deleted_at', null)
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user]);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setDetailOpen(true);
  };

  const handleTaskUpdate = () => {
    fetchTasks();
  };

  const handleEditClick = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    setEditTask(task);
    setEditOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    setDeleteTask(task);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTask || !user) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ deleted_at: new Date().toISOString(), deleted_by: user.id })
        .eq('id', deleteTask.id);

      if (error) throw error;

      toast({
        title: 'Tarefa excluída',
        description: 'A tarefa foi removida com sucesso.',
      });

      fetchTasks();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: error.message || 'Tente novamente.',
      });
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
      setDeleteTask(null);
    }
  };

  const ITEMS_PER_PAGE = 15;
  const [currentPage, setCurrentPage] = useState(1);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.description?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tasks, search, statusFilter]);

  const totalPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE);
  const paginatedTasks = filteredTasks.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tarefas</h1>
        <p className="text-muted-foreground">
Acompanhe as tarefas atribuídas a você
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar tarefas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="backlog">Backlog</SelectItem>
            <SelectItem value="todo">A Fazer</SelectItem>
            <SelectItem value="in_progress">Em Andamento</SelectItem>
            <SelectItem value="blocked">Bloqueado</SelectItem>
            <SelectItem value="review">Revisão</SelectItem>
            <SelectItem value="done">Concluído</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="py-4">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <CheckSquare className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle>Nenhuma tarefa encontrada</CardTitle>
            <CardDescription>
              {search || statusFilter !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'As tarefas dos projetos aparecerão aqui'}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <Card 
              key={task.id} 
              className="hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => handleTaskClick(task)}
            >
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className={`w-1 h-10 rounded-full ${priorityColors[task.priority]}`} 
                       style={{ backgroundColor: 'currentColor', opacity: 0.5 }} />
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      {task.projects?.name && (
                        <span>{task.projects.name}</span>
                      )}
                      {task.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(task.due_date).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusColors[task.status]} variant="secondary">
                    {statusLabels[task.status]}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => handleEditClick(e, task)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => handleDeleteClick(e, task)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          projectId={selectedTask.project_id}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          onUpdate={handleTaskUpdate}
        />
      )}

      {/* Task Edit Modal */}
      {editTask && (
        <TaskEditModal
          task={editTask}
          projectId={editTask.project_id}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSuccess={handleTaskUpdate}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tarefa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a tarefa "{deleteTask?.title}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
