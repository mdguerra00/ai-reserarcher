import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FolderKanban,
  CheckSquare,
  FileText,
  Clock,
  Plus,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';
import { RecentActivity } from '@/components/dashboard/RecentActivity';

const isActiveProjectStatus = (status: string) => !['completed', 'archived'].includes(status);

export default function Dashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: loading } = useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async () => {
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, status')
        .is('deleted_at', null);

      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, status, assigned_to, project_id')
        .is('deleted_at', null);

      const totalProjects = projects?.length || 0;
      const activeProjectsByStatus = projects?.filter((p) => isActiveProjectStatus(p.status)).length || 0;
      const activeProjectsFromMyTasks = new Set(
        (tasks || [])
          .filter((t) => t.assigned_to === user!.id && t.project_id)
          .map((t) => t.project_id)
      ).size;
      const activeProjects = Math.max(activeProjectsByStatus, activeProjectsFromMyTasks);
      const totalTasks = tasks?.length || 0;
      const pendingTasks = tasks?.filter(t => t.status === 'todo' || t.status === 'in_progress').length || 0;
      const myTasks = tasks?.filter(t => t.assigned_to === user!.id && (t.status === 'todo' || t.status === 'in_progress')).length || 0;

      // Tasks by project for chart
      const projectMap = new Map<string, { name: string; total: number; done: number }>();
      projects?.forEach(p => projectMap.set(p.id, { name: p.name.length > 15 ? p.name.slice(0, 15) + '…' : p.name, total: 0, done: 0 }));
      tasks?.forEach(t => {
        const proj = projectMap.get(t.project_id);
        if (proj) {
          proj.total++;
          if (t.status === 'done') proj.done++;
        }
      });
      const tasksByProject = Array.from(projectMap.values()).filter(p => p.total > 0);

      // Tasks by status for pie chart
      const statusCounts: Record<string, number> = {};
      tasks?.forEach(t => { statusCounts[t.status] = (statusCounts[t.status] || 0) + 1; });
      const tasksByStatus = [
        { name: 'A Fazer', value: (statusCounts['todo'] || 0) + (statusCounts['backlog'] || 0), color: 'hsl(var(--primary))' },
        { name: 'Em Andamento', value: statusCounts['in_progress'] || 0, color: 'hsl(var(--warning))' },
        { name: 'Bloqueado', value: statusCounts['blocked'] || 0, color: 'hsl(var(--destructive))' },
        { name: 'Revisão', value: statusCounts['review'] || 0, color: 'hsl(38, 70%, 60%)' },
        { name: 'Concluído', value: statusCounts['done'] || 0, color: 'hsl(var(--success))' },
      ];

      return {
        totalProjects,
        activeProjects,
        totalTasks,
        pendingTasks,
        myTasks,
        tasksByProject,
        tasksByStatus,
      };
    },
    enabled: !!user,
  });

  const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'Usuário';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Olá, {userName}! 👋
          </h1>
          <p className="text-muted-foreground">
            Aqui está um resumo do seu dia na Smart Dent.
          </p>
        </div>
        <Button asChild>
          <Link to="/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            Novo Projeto
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projetos Ativos</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-20" /> : (
              <>
                <div className="text-2xl font-bold">{stats?.activeProjects}</div>
                <p className="text-xs text-muted-foreground">de {stats?.totalProjects} projetos</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Minhas Tarefas</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-20" /> : (
              <>
                <div className="text-2xl font-bold">{stats?.myTasks}</div>
                <p className="text-xs text-muted-foreground">pendentes para você</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-20" /> : (
              <>
                <div className="text-2xl font-bold">{stats?.pendingTasks}</div>
                <p className="text-xs text-muted-foreground">de {stats?.totalTasks} tarefas</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-20" /> : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.totalTasks
                    ? Math.round(((stats.totalTasks - stats.pendingTasks) / stats.totalTasks) * 100)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">tarefas concluídas</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {stats && (
        <DashboardCharts
          tasksByProject={stats.tasksByProject}
          tasksByStatus={stats.tasksByStatus}
        />
      )}

      {/* Activity + Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>

        <div className="space-y-4">
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <FolderKanban className="h-4 w-4 text-primary" />
                Projetos
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Button variant="outline" className="w-full" size="sm" asChild>
                <Link to="/projects">
                  Ver Projetos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <CheckSquare className="h-4 w-4 text-primary" />
                Tarefas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Button variant="outline" className="w-full" size="sm" asChild>
                <Link to="/tasks">
                  Ver Tarefas
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-primary" />
                Relatórios
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Button variant="outline" className="w-full" size="sm" asChild>
                <Link to="/reports">
                  Ver Relatórios
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Welcome Card for new users */}
      {stats && stats.totalProjects === 0 && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Comece sua jornada! 🚀</CardTitle>
            <CardDescription>
              Você ainda não tem projetos. Crie seu primeiro projeto de P&D para começar a gerenciar suas pesquisas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/projects/new">
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Projeto
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
