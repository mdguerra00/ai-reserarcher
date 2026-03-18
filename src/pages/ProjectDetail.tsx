import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ArrowLeft,
  Calendar,
  Users,
  CheckSquare,
  FileText,
  FolderOpen,
  Settings,
  Plus,
  Bot,
  LayoutGrid,
  List,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { TaskFormModal } from '@/components/tasks/TaskFormModal';
import { KanbanBoard, BoardColumn, KanbanTask } from '@/components/tasks/KanbanBoard';
import { TaskDetailDrawer } from '@/components/tasks/TaskDetailDrawer';
import { BlockedReasonModal } from '@/components/tasks/BlockedReasonModal';
import { useToast } from '@/hooks/use-toast';
import { InviteMemberModal } from '@/components/projects/InviteMemberModal';
import { ProjectFilesList } from '@/components/files/ProjectFilesList';
import { ReportsList } from '@/components/reports/ReportsList';
import { ReindexProjectButton } from '@/components/projects/ReindexProjectButton';
import { IndexingStatus } from '@/components/projects/IndexingStatus';
import { ProjectAssistant } from '@/components/projects/ProjectAssistant';
import { ProjectSettingsModal } from '@/components/projects/ProjectSettingsModal';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';

type Project = Tables<'projects'>;

interface MemberWithProfile {
  id: string;
  user_id: string;
  role_in_project: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

const statusColors: Record<string, string> = {
  planning: 'bg-muted text-muted-foreground',
  in_progress: 'bg-primary/10 text-primary',
  review: 'bg-warning/10 text-warning',
  completed: 'bg-success/10 text-success',
  archived: 'bg-muted text-muted-foreground',
};

const statusLabels: Record<string, string> = {
  planning: 'Planejamento',
  in_progress: 'Em Andamento',
  review: 'Revisão',
  completed: 'Concluído',
  archived: 'Arquivado',
};

const roleLabels: Record<string, string> = {
  owner: 'Proprietário',
  manager: 'Gerente',
  researcher: 'Pesquisador',
  viewer: 'Visualizador',
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, markAsRead } = useNotifications();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [columns, setColumns] = useState<BoardColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [taskView, setTaskView] = useState<'board' | 'list'>('board');

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);

  // Blocked reason modal
  const [blockedModalOpen, setBlockedModalOpen] = useState(false);
  const [pendingBlockedTaskId, setPendingBlockedTaskId] = useState<string | null>(null);
  const [pendingBlockedColumnId, setPendingBlockedColumnId] = useState<string | null>(null);

  // Tab control
  const [activeTab, setActiveTab] = useState('tasks');
  const [initialFileId, setInitialFileId] = useState<string | null>(null);

  // Compute set of task IDs with unread comment notifications
  const unreadTaskIds = useMemo(() => {
    const ids = new Set<string>();
    for (const n of notifications) {
      if (n.type === 'task_comment' && !n.read && n.link) {
        const match = n.link.match(/task=([a-f0-9-]+)/);
        if (match) ids.add(match[1]);
      }
    }
    return ids;
  }, [notifications]);

  const isOwner = userRole === 'owner';

  useEffect(() => {
    const tab = searchParams.get('tab');
    const taskId = searchParams.get('task');
    const fileId = searchParams.get('file');

    if (tab === 'files') {
      setActiveTab('files');
      if (fileId) setInitialFileId(fileId);
    }

    if (taskId && tasks.length > 0) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        setSelectedTask(task);
        setIsTaskDetailOpen(true);
      }
    }

    if (taskId || fileId || tab) {
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, tasks, setSearchParams]);

  const fetchProject = async () => {
    if (!id) return;
    try {
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      // Fetch members
      const { data: membersData } = await supabase
        .from('project_members')
        .select('id, user_id, role_in_project')
        .eq('project_id', id);

      if (membersData && membersData.length > 0) {
        const userIds = membersData.map(m => m.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url')
          .in('id', userIds);

        const membersWithProfiles: MemberWithProfile[] = membersData.map(member => {
          const profile = profiles?.find(p => p.id === member.user_id);
          return {
            id: member.id,
            user_id: member.user_id,
            role_in_project: member.role_in_project,
            full_name: profile?.full_name || null,
            email: profile?.email || '',
            avatar_url: profile?.avatar_url || null,
          };
        });

        setMembers(membersWithProfiles);
        const currentUserMembership = membersData.find(m => m.user_id === user?.id);
        setUserRole(currentUserMembership?.role_in_project || null);
      } else {
        setMembers([]);
        setUserRole(null);
      }

      // Fetch board columns
      await fetchColumns();
      await fetchTasks();
    } catch (error) {
      console.error('Error fetching project:', error);
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchColumns = async () => {
    if (!id) return;
    const { data } = await supabase
      .from('project_board_columns')
      .select('*')
      .eq('project_id', id)
      .order('position');

    if (data && data.length > 0) {
      setColumns(data as BoardColumn[]);
    } else {
      // Create default columns
      const { error } = await supabase.rpc('create_default_board_columns', { p_project_id: id });
      if (!error) {
        const { data: newCols } = await supabase
          .from('project_board_columns')
          .select('*')
          .eq('project_id', id)
          .order('position');
        if (newCols) setColumns(newCols as BoardColumn[]);
      }
    }
  };

  const fetchTasks = async () => {
    if (!id) return;
    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', id)
      .is('deleted_at', null)
      .order('column_order', { ascending: true });

    if (tasksData) {
      const mapped = tasksData.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        assigned_to: t.assigned_to,
        due_date: t.due_date,
        tags: t.tags || [],
        column_id: t.column_id,
        column_order: t.column_order || 0,
        blocked_reason: t.blocked_reason,
        created_at: t.created_at,
        completed_at: t.completed_at,
        hypothesis: t.hypothesis,
        variables_changed: t.variables_changed || [],
        target_metrics: t.target_metrics || [],
        success_criteria: t.success_criteria,
        procedure: t.procedure,
        checklist: Array.isArray(t.checklist) ? t.checklist : [],
        conclusion: t.conclusion,
        decision: t.decision,
        partial_results: t.partial_results,
        external_links: t.external_links || [],
        updated_at: t.updated_at,
        project_id: t.project_id,
      }));
      setTasks(mapped);
      // Update selectedTask if it's currently open so the drawer reflects saved data
      setSelectedTask(prev => {
        if (!prev) return prev;
        const updated = mapped.find(t => t.id === prev.id);
        return updated || prev;
      });
    }
  };

  useEffect(() => {
    if (user) fetchProject();
  }, [id, user]);

  const refreshTasks = useCallback(() => {
    fetchTasks();
  }, [id]);

  const refreshMembers = async () => {
    if (!id) return;
    const { data: membersData } = await supabase
      .from('project_members')
      .select('id, user_id, role_in_project')
      .eq('project_id', id);

    if (membersData && membersData.length > 0) {
      const userIds = membersData.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', userIds);

      setMembers(membersData.map(member => {
        const profile = profiles?.find(p => p.id === member.user_id);
        return {
          id: member.id,
          user_id: member.user_id,
          role_in_project: member.role_in_project,
          full_name: profile?.full_name || null,
          email: profile?.email || '',
          avatar_url: profile?.avatar_url || null,
        };
      }));
    }
  };

  const handleTaskClick = (task: KanbanTask) => {
    setSelectedTask(task);
    setIsTaskDetailOpen(true);
  };

  const handleBlockedReasonRequired = (taskId: string, columnId: string) => {
    setPendingBlockedTaskId(taskId);
    setPendingBlockedColumnId(columnId);
    setBlockedModalOpen(true);
  };

  const handleBlockedConfirm = async (reason: string) => {
    if (!pendingBlockedTaskId || !pendingBlockedColumnId || !user) return;
    const col = columns.find(c => c.id === pendingBlockedColumnId);
    if (!col) return;

    const { error } = await supabase
      .from('tasks')
      .update({
        column_id: pendingBlockedColumnId,
        status: col.status_key as any,
        blocked_reason: reason,
      })
      .eq('id', pendingBlockedTaskId);

    if (!error) {
      await supabase.from('task_activity_log').insert({
        task_id: pendingBlockedTaskId,
        user_id: user.id,
        action: 'blocked',
        field_changed: 'status',
        old_value: 'anterior',
        new_value: `Bloqueado: ${reason}`,
      });
      refreshTasks();
    }
    setPendingBlockedTaskId(null);
    setPendingBlockedColumnId(null);
  };

  const getInitials = (name?: string | null, email?: string) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    return email?.charAt(0).toUpperCase() ?? '?';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Projeto não encontrado</p>
        <Button asChild className="mt-4">
          <Link to="/projects">Voltar para Projetos</Link>
        </Button>
      </div>
    );
  }

  // Full task data for drawer
  const getFullTaskData = (task: KanbanTask) => {
    return {
      ...task,
      project_id: task.project_id || id!,
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/projects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
              <Badge className={statusColors[project.status]} variant="secondary">
                {statusLabels[project.status]}
              </Badge>
            </div>
            {project.category && (
              <Badge variant="outline" className="mt-2">{project.category}</Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <IndexingStatus projectId={project.id} />
          <ReindexProjectButton projectId={project.id} projectName={project.name} />
          <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </Button>
        </div>
      </div>

      {/* Project Info */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Sobre o Projeto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.description && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Descrição</h4>
                <p className="text-sm">{project.description}</p>
              </div>
            )}
            {project.objectives && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Objetivos</h4>
                <p className="text-sm">{project.objectives}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-4 pt-2">
              {project.start_date && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Início: {new Date(project.start_date).toLocaleDateString('pt-BR')}
                </div>
              )}
              {project.end_date && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Término: {new Date(project.end_date).toLocaleDateString('pt-BR')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Equipe
              </span>
              <Button variant="ghost" size="sm" onClick={() => setIsInviteModalOpen(true)}>
                <Plus className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">Nenhum membro ainda</p>
              ) : (
                members.map(member => (
                  <div key={member.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(member.full_name, member.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.full_name || member.email}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {roleLabels[member.role_in_project] || member.role_in_project}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks" className="gap-2">
            <CheckSquare className="h-4 w-4" />
            Tarefas
          </TabsTrigger>
          <TabsTrigger value="files" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            Arquivos
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <FileText className="h-4 w-4" />
            Relatórios
          </TabsTrigger>
          <TabsTrigger value="assistant" className="gap-2">
            <Bot className="h-4 w-4" />
            Assistente IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          {/* Task toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                {tasks.length} tarefa{tasks.length !== 1 ? 's' : ''}
              </p>
              <div className="flex items-center border rounded-md">
                <Button
                  variant={taskView === 'board' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 px-2 rounded-r-none"
                  onClick={() => setTaskView('board')}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant={taskView === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 px-2 rounded-l-none"
                  onClick={() => setTaskView('list')}
                >
                  <List className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <Button size="sm" onClick={() => setIsTaskModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Tarefa
            </Button>
          </div>

          {taskView === 'board' ? (
            <KanbanBoard
              columns={columns}
              tasks={tasks}
              members={members}
              onTaskClick={handleTaskClick}
              onTasksChange={refreshTasks}
              onBlockedReasonRequired={handleBlockedReasonRequired}
              unreadTaskIds={unreadTaskIds}
            />
          ) : (
            /* List view (simplified) */
            tasks.length === 0 ? (
              <Card className="border-dashed">
                <CardHeader className="text-center">
                  <CardTitle className="text-base">Nenhuma tarefa</CardTitle>
                  <CardDescription>Crie a primeira tarefa para este projeto</CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <div className="space-y-2">
                {tasks.map(task => (
                  <Card
                    key={task.id}
                    className="hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => handleTaskClick(task)}
                  >
                    <CardContent className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <CheckSquare className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{task.title}</p>
                          {task.due_date && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Calendar className="h-3 w-3" />
                              {new Date(task.due_date).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {statusLabels[task.status] || task.status}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          )}
        </TabsContent>

        <TabsContent value="files">
          <ProjectFilesList
            projectId={id!}
            initialFileId={initialFileId}
            onFileOpened={() => setInitialFileId(null)}
          />
        </TabsContent>

        <TabsContent value="reports">
          <ReportsList projectId={id!} />
        </TabsContent>

        <TabsContent value="assistant">
          <ProjectAssistant projectId={id!} projectName={project.name} />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <TaskFormModal
        projectId={id!}
        open={isTaskModalOpen}
        onOpenChange={setIsTaskModalOpen}
        onSuccess={refreshTasks}
      />

      <TaskDetailDrawer
        task={selectedTask ? getFullTaskData(selectedTask) : null}
        projectId={id!}
        open={isTaskDetailOpen}
        onOpenChange={setIsTaskDetailOpen}
        onUpdate={() => { refreshTasks(); }}
        members={members}
      />

      <InviteMemberModal
        projectId={id!}
        open={isInviteModalOpen}
        onOpenChange={setIsInviteModalOpen}
        onSuccess={refreshMembers}
      />

      <BlockedReasonModal
        open={blockedModalOpen}
        onOpenChange={setBlockedModalOpen}
        onConfirm={handleBlockedConfirm}
      />

      {project && (
        <ProjectSettingsModal
          projectId={id!}
          projectName={project.name}
          project={project}
          isOwner={isOwner}
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
          onDeleted={() => navigate('/projects')}
          onUpdated={fetchProject}
        />
      )}
    </div>
  );
}
