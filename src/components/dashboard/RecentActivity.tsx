import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, CheckSquare, FlaskConical, FolderKanban, Brain } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ActivityItem {
  id: string;
  type: 'task' | 'report' | 'knowledge' | 'file' | 'experiment';
  title: string;
  project_name?: string;
  date: string;
}

const icons: Record<string, React.ElementType> = {
  task: CheckSquare,
  report: FileText,
  knowledge: Brain,
  file: FolderKanban,
  experiment: FlaskConical,
};

const labels: Record<string, string> = {
  task: 'Tarefa',
  report: 'Relatório',
  knowledge: 'Conhecimento',
  file: 'Arquivo',
  experiment: 'Experimento',
};

export function RecentActivity() {
  const { user } = useAuth();

  const { data: activities, isLoading } = useQuery({
    queryKey: ['recent-activity', user?.id],
    queryFn: async () => {
      const items: ActivityItem[] = [];

      // Recent tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title, updated_at, projects(name)')
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .limit(5);

      tasks?.forEach(t => items.push({
        id: t.id,
        type: 'task',
        title: t.title,
        project_name: (t.projects as any)?.name,
        date: t.updated_at,
      }));

      // Recent reports
      const { data: reports } = await supabase
        .from('reports')
        .select('id, title, updated_at, projects(name)')
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .limit(5);

      reports?.forEach(r => items.push({
        id: r.id,
        type: 'report',
        title: r.title,
        project_name: (r.projects as any)?.name,
        date: r.updated_at,
      }));

      // Recent knowledge items
      const { data: knowledge } = await supabase
        .from('knowledge_items')
        .select('id, title, extracted_at, projects(name)')
        .is('deleted_at', null)
        .order('extracted_at', { ascending: false })
        .limit(5);

      knowledge?.forEach(k => items.push({
        id: k.id,
        type: 'knowledge',
        title: k.title,
        project_name: (k.projects as any)?.name,
        date: k.extracted_at,
      }));

      // Sort by date and take top 10
      return items
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);
    },
    enabled: !!user,
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Atividade Recente</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2 mt-1" />
                </div>
              </div>
            ))}
          </div>
        ) : !activities || activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhuma atividade recente</p>
        ) : (
          <div className="space-y-3">
            {activities.map((item) => {
              const Icon = icons[item.type] || FileText;
              return (
                <div key={`${item.type}-${item.id}`} className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full p-1.5 bg-primary/10 text-primary">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight truncate">{item.title}</p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                      <span>{labels[item.type]}</span>
                      {item.project_name && (
                        <>
                          <span>•</span>
                          <span className="truncate">{item.project_name}</span>
                        </>
                      )}
                      <span>•</span>
                      <span className="shrink-0">{formatDistanceToNow(new Date(item.date), { addSuffix: true, locale: ptBR })}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
