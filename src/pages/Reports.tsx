import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Plus, Search, FileEdit, Send, Eye, CheckCircle, Archive, FolderOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type ReportStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'archived';

interface Report {
  id: string;
  title: string;
  summary: string | null;
  status: ReportStatus;
  created_at: string;
  updated_at: string;
  project_id: string;
  projects: {
    id: string;
    name: string;
  } | null;
}

const statusConfig: Record<ReportStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: React.ElementType }> = {
  draft: { label: 'Rascunho', variant: 'secondary', icon: FileEdit },
  submitted: { label: 'Enviado', variant: 'default', icon: Send },
  under_review: { label: 'Em Revisão', variant: 'outline', icon: Eye },
  approved: { label: 'Aprovado', variant: 'default', icon: CheckCircle },
  archived: { label: 'Arquivado', variant: 'secondary', icon: Archive },
};

export default function Reports() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [projectSelectorOpen, setProjectSelectorOpen] = useState(false);

  // Fetch all reports from projects where user is a member
  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ['all-reports', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('reports')
        .select('id, title, summary, status, created_at, updated_at, project_id, projects(id, name)')
        .is('deleted_at', null)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as Report[];
    },
    enabled: !!user?.id,
  });

  // Fetch user's projects for the "New Report" flow
  const { data: userProjects } = useQuery({
    queryKey: ['user-projects-for-reports', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('project_members')
        .select('project_id, projects(id, name)')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data?.map(pm => pm.projects).filter(Boolean) as { id: string; name: string }[];
    },
    enabled: !!user?.id,
  });

  const handleNewReport = () => {
    if (!userProjects || userProjects.length === 0) {
      // No projects - can't create report
      return;
    }
    
    if (userProjects.length === 1) {
      // Single project - go directly
      navigate(`/projects/${userProjects[0].id}?tab=reports&newReport=true`);
    } else {
      // Multiple projects - show selector
      setProjectSelectorOpen(true);
    }
  };

  const handleSelectProject = (projectId: string) => {
    setProjectSelectorOpen(false);
    navigate(`/projects/${projectId}?tab=reports&newReport=true`);
  };

  const handleOpenReport = (report: Report) => {
    navigate(`/projects/${report.project_id}?tab=reports&report=${report.id}`);
  };

  const ITEMS_PER_PAGE = 15;
  const [currentPage, setCurrentPage] = useState(1);

  const filteredReports = useMemo(() => {
    return reports?.filter(report =>
      report.title.toLowerCase().includes(search.toLowerCase()) ||
      report.summary?.toLowerCase().includes(search.toLowerCase()) ||
      report.projects?.name.toLowerCase().includes(search.toLowerCase())
    ) || [];
  }, [reports, search]);

  const totalPages = Math.ceil(filteredReports.length / ITEMS_PER_PAGE);
  const paginatedReports = filteredReports.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [search]);

  if (reportsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasProjects = userProjects && userProjects.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">
            Documentação de resultados e conclusões
          </p>
        </div>
        <Button onClick={handleNewReport} disabled={!hasProjects}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Relatório
        </Button>
      </div>

      {/* Reports List or Empty State */}
      {reports && reports.length > 0 ? (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Todos os Relatórios</CardTitle>
                <CardDescription>
                  {reports.length} relatório{reports.length !== 1 ? 's' : ''} encontrado{reports.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar relatórios..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredReports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum relatório encontrado para "{search}"
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReports.map((report) => {
                  const StatusIcon = statusConfig[report.status]?.icon || FileText;
                  return (
                    <div
                      key={report.id}
                      className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleOpenReport(report)}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium truncate">{report.title}</h3>
                          <Badge variant={statusConfig[report.status]?.variant || 'secondary'}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {statusConfig[report.status]?.label || report.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FolderOpen className="h-3 w-3" />
                          <span className="truncate">{report.projects?.name || 'Projeto desconhecido'}</span>
                          <span>•</span>
                          <span>
                            {format(new Date(report.updated_at), "dd 'de' MMM", { locale: ptBR })}
                          </span>
                        </div>
                        {report.summary && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                            {report.summary}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle>Nenhum relatório ainda</CardTitle>
            <CardDescription>
              {hasProjects 
                ? 'Documente os resultados dos seus projetos de P&D criando relatórios detalhados'
                : 'Você precisa fazer parte de um projeto para criar relatórios'
              }
            </CardDescription>
          </CardHeader>
          {hasProjects && (
            <CardContent className="text-center">
              <Button onClick={handleNewReport}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Relatório
              </Button>
            </CardContent>
          )}
        </Card>
      )}

      {/* Project Selector Dialog */}
      <Dialog open={projectSelectorOpen} onOpenChange={setProjectSelectorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecionar Projeto</DialogTitle>
            <DialogDescription>
              Escolha o projeto onde deseja criar o relatório
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            {userProjects?.map((project) => (
              <Button
                key={project.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleSelectProject(project.id)}
              >
                <FolderOpen className="mr-2 h-4 w-4" />
                {project.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
