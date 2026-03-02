import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  Download,
  ExternalLink,
  Brain,
  Calendar,
  FolderOpen,
  HardDrive,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useReprocessFile } from '@/hooks/useReprocessFile';
import { DocumentItem } from './DocumentCard';
import { KnowledgeItem, KnowledgeCategory } from './KnowledgeCard';

interface DocumentDetailModalProps {
  item: DocumentItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const mimeTypeConfig: Record<string, { icon: typeof FileText; label: string; color: string }> = {
  'application/pdf': { icon: FileText, label: 'PDF', color: 'text-red-500 bg-red-50' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: FileSpreadsheet, label: 'Excel', color: 'text-green-600 bg-green-50' },
  'application/vnd.ms-excel': { icon: FileSpreadsheet, label: 'Excel', color: 'text-green-600 bg-green-50' },
  'text/csv': { icon: FileSpreadsheet, label: 'CSV', color: 'text-green-500 bg-green-50' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: FileText, label: 'Word', color: 'text-blue-600 bg-blue-50' },
  'application/msword': { icon: FileText, label: 'Word', color: 'text-blue-600 bg-blue-50' },
  'image/png': { icon: FileImage, label: 'Imagem', color: 'text-purple-500 bg-purple-50' },
  'image/jpeg': { icon: FileImage, label: 'Imagem', color: 'text-purple-500 bg-purple-50' },
  'image/jpg': { icon: FileImage, label: 'Imagem', color: 'text-purple-500 bg-purple-50' },
  'text/plain': { icon: FileText, label: 'Texto', color: 'text-gray-500 bg-gray-50' },
};

function getFileConfig(mimeType: string | null) {
  if (!mimeType) return { icon: File, label: 'Arquivo', color: 'text-muted-foreground bg-muted' };
  return mimeTypeConfig[mimeType] || { icon: File, label: 'Arquivo', color: 'text-muted-foreground bg-muted' };
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return 'Tamanho desconhecido';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const categoryLabels: Record<KnowledgeCategory, string> = {
  finding: 'Descoberta',
  correlation: 'Correlação',
  anomaly: 'Anomalia',
  benchmark: 'Benchmark',
  recommendation: 'Recomendação',
  compound: 'Composto',
  parameter: 'Parâmetro',
  result: 'Resultado',
  method: 'Metodologia',
  observation: 'Observação',
  cross_reference: 'Ref. Cruzada',
  pattern: 'Padrão',
  contradiction: 'Contradição',
  gap: 'Lacuna',
};

export function DocumentDetailModal({ item, open, onOpenChange }: DocumentDetailModalProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [insights, setInsights] = useState<KnowledgeItem[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const reprocessFile = useReprocessFile();
  useEffect(() => {
    if (open && item) {
      fetchInsights();
    }
  }, [open, item]);

  const fetchInsights = async () => {
    if (!item) return;
    
    setLoadingInsights(true);
    try {
      const { data, error } = await supabase
        .from('knowledge_items')
        .select('*')
        .eq('source_file_id', item.id)
        .is('deleted_at', null)
        .order('confidence', { ascending: false });

      if (error) throw error;
      setInsights(data as KnowledgeItem[]);
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleDownload = async () => {
    if (!item) return;
    
    setDownloading(true);
    try {
      const { data, error } = await supabase.storage
        .from('project-files')
        .download(item.storage_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Download concluído',
        description: `${item.name} foi baixado com sucesso`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro no download',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleReprocess = () => {
    if (!item) return;
    reprocessFile.mutate(
      { fileId: item.id, projectId: item.project_id || '', force: true },
      {
        onSuccess: () => {
          fetchInsights();
        },
      }
    );
  };

  const handleViewProject = () => {
    if (item) {
      navigate(`/projects/${item.project_id}?tab=files&file=${item.id}`);
      onOpenChange(false);
    }
  };

  if (!item) return null;

  const config = getFileConfig(item.mime_type);
  const Icon = config.icon;
  const projectName = item.projects?.name || 'Projeto';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${config.color}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg break-words pr-8">
                {item.name}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <FolderOpen className="h-3 w-3" />
                {projectName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 pr-4">
            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Tipo</p>
                <Badge variant="outline">{config.label}</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Tamanho</p>
                <div className="flex items-center gap-1 text-sm">
                  <HardDrive className="h-3 w-3" />
                  {formatFileSize(item.size_bytes)}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Data de Upload</p>
                <div className="flex items-center gap-1 text-sm">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(item.created_at), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Insights Extraídos</p>
                <div className="flex items-center gap-1 text-sm">
                  <Brain className="h-3 w-3" />
                  {insights.length} insight{insights.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            <Separator />

            {/* Insights from this document */}
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                Insights deste documento
                {insights.length === 0 && !loadingInsights && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleReprocess}
                    disabled={reprocessFile.isPending}
                    className="ml-auto"
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${reprocessFile.isPending ? 'animate-spin' : ''}`} />
                    {reprocessFile.isPending ? 'Processando...' : 'Processar'}
                  </Button>
                )}
              </h3>
              
              {loadingInsights ? (
                <div className="space-y-2">
                  {[1, 2].map(i => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : insights.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-6 text-center">
                    <Brain className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Nenhum insight foi extraído deste documento ainda.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {insights.map((insight) => (
                    <Card key={insight.id} className="hover:bg-muted/50 transition-colors">
                      <CardHeader className="py-3 px-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <CardTitle className="text-sm font-medium">
                              {insight.title}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {insight.content}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="secondary" className="text-xs">
                              {categoryLabels[insight.category]}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {Math.round(insight.confidence * 100)}%
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-between gap-2 pt-4 border-t">
          <div className="flex gap-2">
            {item.project_id && (
              <Button variant="outline" onClick={handleViewProject}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver no Projeto
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleReprocess}
              disabled={reprocessFile.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${reprocessFile.isPending ? 'animate-spin' : ''}`} />
              {reprocessFile.isPending ? 'Processando...' : 'Reprocessar'}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button onClick={handleDownload} disabled={downloading}>
              <Download className="h-4 w-4 mr-2" />
              {downloading ? 'Baixando...' : 'Download'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
