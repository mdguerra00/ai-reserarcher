import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Package, FlaskConical, Wrench, GitBranch, Clock, Edit2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const lifecycleLabels: Record<string, string> = {
  development: 'Em Desenvolvimento',
  active: 'Ativo',
  discontinued: 'Descontinuado',
  obsolete: 'Obsoleto',
};

const lifecycleColors: Record<string, string> = {
  development: 'bg-primary/10 text-primary',
  active: 'bg-success/10 text-success',
  discontinued: 'bg-warning/10 text-warning',
  obsolete: 'bg-muted text-muted-foreground',
};

const changeStatusLabels: Record<string, string> = {
  draft: 'Rascunho',
  under_review: 'Em Revisão',
  approved: 'Aprovada',
  implemented: 'Implementada',
  rejected: 'Rejeitada',
};

const devStatusLabels: Record<string, string> = {
  planning: 'Planejamento',
  design_input: 'Design Input',
  design_output: 'Design Output',
  verification: 'Verificação',
  validation: 'Validação',
  transfer: 'Transferência',
  released: 'Liberado',
  cancelled: 'Cancelado',
};

const eventTypeLabels: Record<string, string> = {
  creation: 'Criação',
  research_linked: 'Pesquisa Vinculada',
  development_milestone: 'Marco de Desenvolvimento',
  change_approved: 'Alteração Aprovada',
  change_implemented: 'Alteração Implementada',
  document_updated: 'Documento Atualizado',
  risk_reviewed: 'Risco Revisado',
  version_released: 'Versão Liberada',
};

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [developments, setDevelopments] = useState<any[]>([]);
  const [changes, setChanges] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [researches, setResearches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      try {
        const [pRes, dRes, cRes, tRes, rRes] = await Promise.all([
          supabase.from('products').select('*').eq('id', id).single(),
          supabase.from('product_developments').select('*').eq('product_id', id).is('deleted_at', null).order('created_at', { ascending: false }),
          supabase.from('product_changes').select('*').eq('product_id', id).is('deleted_at', null).order('created_at', { ascending: false }),
          supabase.from('product_timeline_events').select('*').eq('product_id', id).order('event_date', { ascending: false }),
          supabase.from('researches').select('*').eq('linked_product_id', id).is('deleted_at', null).order('created_at', { ascending: false }),
        ]);
        if (pRes.error) throw pRes.error;
        setProduct(pRes.data);
        setDevelopments((dRes.data as any) || []);
        setChanges((cRes.data as any) || []);
        setTimeline((tRes.data as any) || []);
        setResearches((rRes.data as any) || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Produto não encontrado</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/products')}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/products')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
            <Badge className={`${lifecycleColors[product.lifecycle_status] || ''} text-xs`} variant="secondary">
              {lifecycleLabels[product.lifecycle_status] || product.lifecycle_status}
            </Badge>
            <Badge variant="outline" className="text-xs">v{product.current_version || '1.0'}</Badge>
          </div>
          {product.family && <p className="text-muted-foreground">{product.family}</p>}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="gap-1.5"><Package className="h-3.5 w-3.5" />Visão Geral</TabsTrigger>
          <TabsTrigger value="origin" className="gap-1.5"><FlaskConical className="h-3.5 w-3.5" />Origem</TabsTrigger>
          <TabsTrigger value="development" className="gap-1.5"><Wrench className="h-3.5 w-3.5" />Desenvolvimento</TabsTrigger>
          <TabsTrigger value="changes" className="gap-1.5"><GitBranch className="h-3.5 w-3.5" />Alterações</TabsTrigger>
          <TabsTrigger value="timeline" className="gap-1.5"><Clock className="h-3.5 w-3.5" />Timeline</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Identificação</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div><span className="text-muted-foreground">Nome:</span> <span className="font-medium">{product.name}</span></div>
                <div><span className="text-muted-foreground">Família:</span> <span className="font-medium">{product.family || '—'}</span></div>
                <div><span className="text-muted-foreground">Versão:</span> <span className="font-medium">{product.current_version || '1.0'}</span></div>
                <div><span className="text-muted-foreground">Status Regulatório:</span> <span className="font-medium">{product.regulatory_status || 'Pendente'}</span></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Uso Pretendido</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{product.intended_use || 'Não definido'}</p>
              </CardContent>
            </Card>
            <Card className="md:col-span-2">
              <CardHeader><CardTitle className="text-base">Resumo</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{researches.length}</div>
                  <div className="text-xs text-muted-foreground">Pesquisas Vinculadas</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">{developments.length}</div>
                  <div className="text-xs text-muted-foreground">Projetos de Desenvolvimento</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">{changes.length}</div>
                  <div className="text-xs text-muted-foreground">Alterações Registradas</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Origin */}
        <TabsContent value="origin">
          <div className="space-y-4">
            <h3 className="font-semibold">Pesquisas que originaram este produto</h3>
            {researches.length === 0 ? (
              <Card className="border-dashed"><CardHeader className="text-center"><CardDescription>Nenhuma pesquisa vinculada ainda</CardDescription></CardHeader></Card>
            ) : (
              <div className="space-y-2">
                {researches.map((r: any) => (
                  <Card key={r.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate(`/researches/${r.id}`)}>
                    <CardHeader className="py-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">{r.title}</CardTitle>
                        <Badge variant="secondary" className="text-xs">{r.status}</Badge>
                      </div>
                      {r.objective && <CardDescription className="text-xs line-clamp-1">{r.objective}</CardDescription>}
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Development */}
        <TabsContent value="development">
          <div className="space-y-4">
            <h3 className="font-semibold">Projetos de Desenvolvimento</h3>
            {developments.length === 0 ? (
              <Card className="border-dashed"><CardHeader className="text-center"><CardDescription>Nenhum projeto de desenvolvimento registrado</CardDescription></CardHeader></Card>
            ) : (
              <div className="space-y-2">
                {developments.map((d: any) => (
                  <Card key={d.id}>
                    <CardHeader className="py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-sm">{d.code || 'Projeto de Desenvolvimento'}</CardTitle>
                          {d.intended_use && <CardDescription className="text-xs line-clamp-1">{d.intended_use}</CardDescription>}
                        </div>
                        <Badge variant="secondary" className="text-xs">{devStatusLabels[d.status] || d.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="py-2 grid grid-cols-4 gap-2 text-xs">
                      <div><span className="text-muted-foreground">Verificação:</span> {d.verification_status}</div>
                      <div><span className="text-muted-foreground">Validação:</span> {d.validation_status}</div>
                      <div><span className="text-muted-foreground">Transferência:</span> {d.transfer_status}</div>
                      <div><span className="text-muted-foreground">Regulatório:</span> {d.regulatory_status}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Changes */}
        <TabsContent value="changes">
          <div className="space-y-4">
            <h3 className="font-semibold">Histórico de Alterações</h3>
            {changes.length === 0 ? (
              <Card className="border-dashed"><CardHeader className="text-center"><CardDescription>Nenhuma alteração registrada</CardDescription></CardHeader></Card>
            ) : (
              <div className="space-y-2">
                {changes.map((c: any) => (
                  <Card key={c.id}>
                    <CardHeader className="py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-sm">{c.description}</CardTitle>
                          <CardDescription className="text-xs">
                            {c.version_from && c.version_to ? `${c.version_from} → ${c.version_to}` : ''} 
                            {c.reason && ` • Motivo: ${c.reason}`}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary" className="text-xs">{changeStatusLabels[c.status] || c.status}</Badge>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Timeline */}
        <TabsContent value="timeline">
          <div className="space-y-4">
            <h3 className="font-semibold">Linha do Tempo</h3>
            {timeline.length === 0 ? (
              <Card className="border-dashed"><CardHeader className="text-center"><CardDescription>Nenhum evento registrado</CardDescription></CardHeader></Card>
            ) : (
              <div className="relative ml-4 border-l-2 border-border pl-6 space-y-6">
                {timeline.map((event: any) => (
                  <div key={event.id} className="relative">
                    <div className="absolute -left-[31px] top-1 h-4 w-4 rounded-full bg-primary border-2 border-background" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{event.title}</span>
                        <Badge variant="outline" className="text-xs">{eventTypeLabels[event.event_type] || event.event_type}</Badge>
                      </div>
                      {event.description && <p className="text-xs text-muted-foreground">{event.description}</p>}
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.event_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
