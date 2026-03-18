import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, Search, Sparkles, Filter, LayoutGrid, List, FileText, FlaskConical, Zap, Loader2, Globe, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { KnowledgeCard, KnowledgeItem, KnowledgeCategory } from '@/components/knowledge/KnowledgeCard';
import { DocumentCard, DocumentItem } from '@/components/knowledge/DocumentCard';
import { ExperimentCard, ExperimentItem } from '@/components/knowledge/ExperimentCard';
import { KnowledgeFilters, EntryTypeFilter, ValidationFilter } from '@/components/knowledge/KnowledgeFilters';
import { KnowledgeDetailModal } from '@/components/knowledge/KnowledgeDetailModal';
import { DocumentDetailModal } from '@/components/knowledge/DocumentDetailModal';
import { ExperimentDetailModal } from '@/components/knowledge/ExperimentDetailModal';
import { FactsList } from '@/components/knowledge/FactsList';
import { ExtractionStatus } from '@/components/knowledge/ExtractionStatus';
import { GlobalFileUploadModal } from '@/components/knowledge/GlobalFileUploadModal';
import { AcademicSearchPanel } from '@/components/knowledge/AcademicSearchPanel';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';

type UnifiedEntry =
  | { entry_type: 'document'; data: DocumentItem }
  | { entry_type: 'insight'; data: KnowledgeItem }
  | { entry_type: 'experiment'; data: ExperimentItem };

export default function Knowledge() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<KnowledgeCategory[]>([]);
  const [minConfidence, setMinConfidence] = useState(0);
  const [selectedInsight, setSelectedInsight] = useState<KnowledgeItem | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null);
  const [selectedExperiment, setSelectedExperiment] = useState<ExperimentItem | null>(null);
  const [insightDetailOpen, setInsightDetailOpen] = useState(false);
  const [documentDetailOpen, setDocumentDetailOpen] = useState(false);
  const [experimentDetailOpen, setExperimentDetailOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [entryType, setEntryType] = useState<EntryTypeFilter>('all');
  const [validationFilter, setValidationFilter] = useState<ValidationFilter>('all');
  const [runningCorrelation, setRunningCorrelation] = useState(false);
  const [runningTrends, setRunningTrends] = useState(false);
  const [globalUploadOpen, setGlobalUploadOpen] = useState(false);

  const handleRunCorrelation = async () => {
    if (!projects || projects.length === 0) {
      toast.error('Nenhum projeto disponível');
      return;
    }

    // If a project is selected, correlate only that one; otherwise correlate ALL projects
    const projectIds = selectedProject ? [selectedProject] : projects.map(p => p.id);

    setRunningCorrelation(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Não autenticado');

      let totalPatterns = 0, totalContradictions = 0, totalGaps = 0;

      // Run correlation for each project
      const results = await Promise.all(
        projectIds.map(async (pid) => {
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/correlate-metrics`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ project_id: pid }),
            }
          );
          const data = await response.json();
          if (!response.ok) console.warn(`Correlation failed for project ${pid}:`, data.error);
          return data;
        })
      );

      for (const data of results) {
        totalPatterns += data.patterns || 0;
        totalContradictions += data.contradictions || 0;
        totalGaps += data.gaps || 0;
      }

      toast.success(
        `Análise concluída: ${totalPatterns} padrões, ${totalContradictions} contradições, ${totalGaps} lacunas`,
        { duration: 5000 }
      );
      refetchInsights();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao executar análise');
    } finally {
      setRunningCorrelation(false);
    }
  };

  const handleRunTrends = async () => {
    if (!selectedProject && (!projects || projects.length === 0)) {
      toast.error('Nenhum projeto disponível');
      return;
    }
    const projectId = selectedProject || projects?.[0]?.id;
    if (!projectId) return;

    setRunningTrends(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Não autenticado');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-metric-trends`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ project_id: projectId }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro');

      toast.success(
        `Análise concluída: ${data.trends_detected} tendências detectadas, ${data.insights_created} insights criados`,
        { duration: 5000 }
      );
      refetchInsights();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao analisar tendências');
    } finally {
      setRunningTrends(false);
    }
  };

  const { data: projects } = useQuery({
    queryKey: ['user-projects', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_members')
        .select('project_id, projects(id, name)')
        .eq('user_id', user!.id);
      if (error) throw error;
      return data.map((m) => m.projects).filter(Boolean) as { id: string; name: string }[];
    },
    enabled: !!user,
  });

  const { data: knowledgeItems, isLoading: loadingInsights, refetch: refetchInsights } = useQuery({
    queryKey: ['knowledge-items', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_items')
        .select(`*, projects(name), project_files(name)`)
        .is('deleted_at', null)
        .order('extracted_at', { ascending: false });
      if (error) throw error;
      return data as KnowledgeItem[];
    },
    enabled: !!user,
  });

  const { data: documents, isLoading: loadingDocuments, refetch: refetchDocuments } = useQuery({
    queryKey: ['all-documents', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_files')
        .select(`id, name, mime_type, size_bytes, project_id, created_at, storage_path, projects(name)`)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const docsWithInsights = await Promise.all(
        (data || []).map(async (doc) => {
          const { count } = await supabase
            .from('knowledge_items')
            .select('*', { count: 'exact', head: true })
            .eq('source_file_id', doc.id)
            .is('deleted_at', null);
          return { ...doc, insights_count: count || 0 } as DocumentItem;
        })
      );
      return docsWithInsights;
    },
    enabled: !!user,
  });

  // Fetch experiments
  const { data: experiments, isLoading: loadingExperiments } = useQuery({
    queryKey: ['experiments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('experiments')
        .select(`id, project_id, source_file_id, title, objective, summary, source_type, is_qualitative, created_at, projects(name), project_files(name)`)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Count measurements per experiment
      const withCounts = await Promise.all(
        (data || []).map(async (exp) => {
          const { count: mCount } = await supabase
            .from('measurements')
            .select('*', { count: 'exact', head: true })
            .eq('experiment_id', exp.id);
          const { count: cCount } = await supabase
            .from('experiment_conditions')
            .select('*', { count: 'exact', head: true })
            .eq('experiment_id', exp.id);
          return {
            ...exp,
            measurements_count: mCount || 0,
            conditions_count: cCount || 0,
          } as ExperimentItem;
        })
      );
      return withCounts;
    },
    enabled: !!user,
  });

  const isLoading = loadingInsights || loadingDocuments || loadingExperiments;

  const filteredEntries = useMemo(() => {
    const entries: UnifiedEntry[] = [];

    if (entryType === 'all' || entryType === 'documents') {
      (documents || []).forEach((doc) => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          if (!doc.name.toLowerCase().includes(q) && !doc.projects?.name?.toLowerCase().includes(q)) return;
        }
        if (selectedProject === '__global__' && doc.project_id !== null) return;
        if (selectedProject && selectedProject !== '__global__' && doc.project_id !== selectedProject) return;
        entries.push({ entry_type: 'document', data: doc });
      });
    }

    if (entryType === 'all' || entryType === 'insights') {
      (knowledgeItems || []).forEach((item) => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          if (!item.title.toLowerCase().includes(q) && !item.content.toLowerCase().includes(q) && !item.evidence?.toLowerCase().includes(q)) return;
        }
        if (selectedProject === '__global__' && item.project_id !== null) return;
        if (selectedProject && selectedProject !== '__global__' && item.project_id !== selectedProject) return;
        if (selectedCategories.length > 0 && !selectedCategories.includes(item.category)) return;
        if (item.confidence < minConfidence) return;
        if (validationFilter === 'pending' && item.validated_by) return;
        if (validationFilter === 'validated' && !item.validated_by) return;
        entries.push({ entry_type: 'insight', data: item });
      });
    }

    if (entryType === 'all' || entryType === 'experiments') {
      (experiments || []).forEach((exp) => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          if (!exp.title.toLowerCase().includes(q) && !exp.objective?.toLowerCase().includes(q) && !exp.summary?.toLowerCase().includes(q)) return;
        }
        if (selectedProject === '__global__') return;
        if (selectedProject && selectedProject !== '__global__' && exp.project_id !== selectedProject) return;
        entries.push({ entry_type: 'experiment', data: exp });
      });
    }

    return entries.sort((a, b) => {
      const dateA = a.entry_type === 'document' ? a.data.created_at : a.entry_type === 'insight' ? a.data.extracted_at : a.data.created_at;
      const dateB = b.entry_type === 'document' ? b.data.created_at : b.entry_type === 'insight' ? b.data.extracted_at : b.data.created_at;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [documents, knowledgeItems, experiments, searchQuery, selectedProject, selectedCategories, minConfidence, entryType, validationFilter]);

  const handleCategoryToggle = (category: KnowledgeCategory) => {
    setSelectedCategories((prev) => prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]);
  };

  const handleClearFilters = () => {
    setSelectedProject(null);
    setSelectedCategories([]);
    setMinConfidence(0);
    setEntryType('all');
    setValidationFilter('all');
  };

  const handleInsightClick = (item: KnowledgeItem) => { setSelectedInsight(item); setInsightDetailOpen(true); };
  const handleDocumentClick = (doc: DocumentItem) => { setSelectedDocument(doc); setDocumentDetailOpen(true); };
  const handleExperimentClick = (exp: ExperimentItem) => { setSelectedExperiment(exp); setExperimentDetailOpen(true); };

  const handleViewFile = (item: KnowledgeItem) => {
    if (item.source_file_id && item.project_id) navigate(`/projects/${item.project_id}?tab=files&file=${item.source_file_id}`);
  };
  const handleViewProject = (doc: DocumentItem) => { if (doc.project_id) navigate(`/projects/${doc.project_id}?tab=files&file=${doc.id}`); };
  const handleViewExperimentFile = (exp: ExperimentItem) => {
    if (exp.source_file_id && exp.project_id) navigate(`/projects/${exp.project_id}?tab=files&file=${exp.source_file_id}`);
  };

  const stats = useMemo(() => {
    const totalDocuments = documents?.length || 0;
    const totalInsights = knowledgeItems?.length || 0;
    const totalExperiments = experiments?.length || 0;
    const validated = knowledgeItems?.filter(i => i.validated_by).length || 0;
    const totalMeasurements = experiments?.reduce((sum, e) => sum + (e.measurements_count || 0), 0) || 0;
    return { totalDocuments, totalInsights, totalExperiments, validated, totalMeasurements };
  }, [documents, knowledgeItems, experiments]);

  const hasActiveFilters = selectedProject || selectedCategories.length > 0 || minConfidence > 0 || entryType !== 'all' || validationFilter !== 'all';

  const filterProps = {
    projects: projects || [],
    selectedProject,
    onProjectChange: setSelectedProject,
    selectedCategories,
    onCategoryToggle: handleCategoryToggle,
    minConfidence,
    onConfidenceChange: setMinConfidence,
    onClearFilters: handleClearFilters,
    entryType,
    onEntryTypeChange: setEntryType,
    validationFilter,
    onValidationFilterChange: setValidationFilter,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Base de Conhecimento</h1>
          <p className="text-muted-foreground">
            {stats.totalDocuments + stats.totalInsights + stats.totalExperiments > 0
              ? `${stats.totalDocuments} docs • ${stats.totalInsights} insights • ${stats.totalExperiments} experimentos • ${stats.totalMeasurements} medições`
              : 'Documentos, insights e experimentos extraídos via IA'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => setGlobalUploadOpen(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Arquivo Global
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunCorrelation}
            disabled={runningCorrelation || runningTrends}
          >
            {runningCorrelation ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
            {runningCorrelation ? 'Analisando...' : 'Correlacionar Métricas'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunTrends}
            disabled={runningTrends || runningCorrelation}
          >
            {runningTrends ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            {runningTrends ? 'Analisando...' : 'Tendências Estatísticas'}
          </Button>
          <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('grid')}>
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('list')}>
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Facts Section */}
      {(entryType === 'all' || entryType === 'facts') && (
        <FactsList projects={projects || []} />
      )}

      {/* Academic Search Section */}
      {entryType === 'academic' && (
        <AcademicSearchPanel
          projectId={selectedProject && selectedProject !== '__global__' ? selectedProject : undefined}
        />
      )}

      {entryType !== 'facts' && entryType !== 'academic' && (
      <>
      <ExtractionStatus />

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar documentos, insights e experimentos..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="sm:hidden">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {hasActiveFilters && <span className="ml-2 h-2 w-2 rounded-full bg-primary" />}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
              <SheetDescription>Refine sua busca na base de conhecimento</SheetDescription>
            </SheetHeader>
            <div className="mt-4"><KnowledgeFilters {...filterProps} /></div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex gap-6">
        <div className="hidden lg:block w-64 flex-shrink-0">
          <KnowledgeFilters {...filterProps} />
        </div>

        <div className="flex-1">
          {isLoading ? (
            <div className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 xl:grid-cols-3' : 'space-y-4'}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}><CardHeader className="pb-2"><Skeleton className="h-5 w-3/4" /></CardHeader><CardContent><Skeleton className="h-16 w-full" /><div className="flex gap-2 mt-3"><Skeleton className="h-5 w-20" /><Skeleton className="h-5 w-16" /></div></CardContent></Card>
              ))}
            </div>
          ) : filteredEntries.length === 0 ? (
            <Card className="border-dashed">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  {entryType === 'documents' ? <FileText className="h-6 w-6 text-primary" /> :
                   entryType === 'experiments' ? <FlaskConical className="h-6 w-6 text-primary" /> :
                   <Brain className="h-6 w-6 text-primary" />}
                </div>
                <CardTitle>
                  {(documents?.length || 0) + (knowledgeItems?.length || 0) + (experiments?.length || 0) > 0 ? 'Nenhum resultado encontrado' : 'Base de conhecimento vazia'}
                </CardTitle>
                <CardDescription className="max-w-md mx-auto">
                  {(documents?.length || 0) + (knowledgeItems?.length || 0) > 0 ? 'Tente ajustar os filtros ou termo de busca.' : 'Quando você fizer upload de documentos, eles aparecerão aqui com insights e experimentos extraídos pela IA.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4" /><span>Powered by Lovable AI</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 xl:grid-cols-3' : 'space-y-4'}>
              {filteredEntries.map((entry) => {
                if (entry.entry_type === 'document') {
                  const isGlobal = !entry.data.project_id;
                  return <DocumentCard key={`doc-${entry.data.id}`} item={entry.data} onClick={() => handleDocumentClick(entry.data)} onViewProject={isGlobal ? undefined : () => handleViewProject(entry.data)} />;
                } else if (entry.entry_type === 'experiment') {
                  return <ExperimentCard key={`exp-${entry.data.id}`} item={entry.data} onClick={() => handleExperimentClick(entry.data)} onViewFile={() => handleViewExperimentFile(entry.data)} />;
                } else {
                  return <KnowledgeCard key={`insight-${entry.data.id}`} item={entry.data} onClick={() => handleInsightClick(entry.data)} onViewFile={() => handleViewFile(entry.data)} />;
                }
              })}
            </div>
          )}
        </div>
      </div>

      <KnowledgeDetailModal item={selectedInsight} open={insightDetailOpen} onOpenChange={setInsightDetailOpen} onUpdate={refetchInsights} />
      <DocumentDetailModal item={selectedDocument} open={documentDetailOpen} onOpenChange={setDocumentDetailOpen} />
      <ExperimentDetailModal item={selectedExperiment} open={experimentDetailOpen} onOpenChange={setExperimentDetailOpen} />
      <GlobalFileUploadModal open={globalUploadOpen} onOpenChange={setGlobalUploadOpen} onSuccess={() => refetchDocuments()} />
      </>
      )}
    </div>
  );
}
