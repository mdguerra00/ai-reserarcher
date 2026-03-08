import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ArrowLeft, Save, ArrowUpRight, FlaskConical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const statusLabels: Record<string, string> = {
  draft: 'Rascunho',
  in_progress: 'Em Andamento',
  concluded: 'Concluída',
  promoted: 'Promovida',
};

const destinationLabels: Record<string, string> = {
  archived: 'Arquivar como conhecimento técnico',
  continue_research: 'Continuar como nova pesquisa',
  escalate_product_dev: 'Promover para Projeto de Novo Produto',
  escalate_product_change: 'Promover para Alteração de Produto Vigente',
  escalate_capa: 'Promover para CAPA / Investigação',
  escalate_process_change: 'Promover para Mudança de Processo',
};

export default function ResearchDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [research, setResearch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPromote, setShowPromote] = useState(false);
  const [form, setForm] = useState<any>({});
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      try {
        const [rRes, pRes] = await Promise.all([
          supabase.from('researches').select('*').eq('id', id).single(),
          supabase.from('products').select('id, name').is('deleted_at', null).order('name'),
        ]);
        if (rRes.error) throw rRes.error;
        setResearch(rRes.data);
        setForm(rRes.data);
        setProducts((pRes.data as any) || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('researches')
        .update({
          title: form.title,
          objective: form.objective || null,
          hypothesis: form.hypothesis || null,
          motivation: form.motivation || null,
          method: form.method || null,
          results: form.results || null,
          conclusions: form.conclusions || null,
          learnings: form.learnings || null,
          future_application: form.future_application || null,
          status: form.status,
          knowledge_destination: form.knowledge_destination || null,
          linked_product_id: form.linked_product_id || null,
          keywords: form.keywords || [],
        } as any)
        .eq('id', id);
      if (error) throw error;
      toast.success('Pesquisa salva!');
      setResearch({ ...research, ...form });
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handlePromote = async (destination: string) => {
    if (!id || !user) return;
    try {
      // Update research status and destination
      await supabase.from('researches').update({
        status: 'promoted',
        knowledge_destination: destination,
      } as any).eq('id', id);

      if (destination === 'escalate_product_dev') {
        // Create a product development (user needs to pick product)
        toast.success('Pesquisa promovida para Projeto de Novo Produto! Crie o projeto de desenvolvimento na página do Produto.');
      } else if (destination === 'escalate_product_change') {
        toast.success('Pesquisa promovida para Alteração de Produto! Crie a alteração na página do Produto.');
      } else {
        toast.success('Destino do conhecimento atualizado!');
      }

      setForm({ ...form, status: 'promoted', knowledge_destination: destination });
      setResearch({ ...research, status: 'promoted', knowledge_destination: destination });
      setShowPromote(false);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao promover');
    }
  };

  const updateField = (field: string, value: any) => setForm({ ...form, [field]: value });

  if (loading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-96 w-full" /></div>;
  }

  if (!research) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Pesquisa não encontrada</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/researches')}>Voltar</Button>
      </div>
    );
  }

  const isEditable = form.status !== 'promoted';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/researches')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <FlaskConical className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">{research.title}</h1>
            <Badge variant="secondary" className="text-xs">{statusLabels[form.status] || form.status}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {form.status === 'concluded' && (
            <Button variant="outline" onClick={() => setShowPromote(true)}>
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Promover para...
            </Button>
          )}
          {isEditable && (
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Informações Básicas</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={form.title || ''} onChange={(e) => updateField('title', e.target.value)} disabled={!isEditable} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => updateField('status', v)} disabled={!isEditable}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="concluded">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Produto Vinculado (opcional)</Label>
                <Select value={form.linked_product_id || 'none'} onValueChange={(v) => updateField('linked_product_id', v === 'none' ? null : v)} disabled={!isEditable}>
                  <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {products.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Palavras-chave</Label>
                <Input
                  value={(form.keywords || []).join(', ')}
                  onChange={(e) => updateField('keywords', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))}
                  placeholder="fotoiniciador, TPO-L, cura"
                  disabled={!isEditable}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Hipótese e Método</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Objetivo</Label>
                <Textarea value={form.objective || ''} onChange={(e) => updateField('objective', e.target.value)} disabled={!isEditable} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Hipótese</Label>
                <Textarea value={form.hypothesis || ''} onChange={(e) => updateField('hypothesis', e.target.value)} disabled={!isEditable} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Motivação</Label>
                <Textarea value={form.motivation || ''} onChange={(e) => updateField('motivation', e.target.value)} disabled={!isEditable} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Método</Label>
                <Textarea value={form.method || ''} onChange={(e) => updateField('method', e.target.value)} disabled={!isEditable} rows={3} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Resultados e Conclusões</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Resultados</Label>
                <Textarea value={form.results || ''} onChange={(e) => updateField('results', e.target.value)} disabled={!isEditable} rows={4} />
              </div>
              <div className="space-y-2">
                <Label>Conclusões</Label>
                <Textarea value={form.conclusions || ''} onChange={(e) => updateField('conclusions', e.target.value)} disabled={!isEditable} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Aprendizados</Label>
                <Textarea value={form.learnings || ''} onChange={(e) => updateField('learnings', e.target.value)} disabled={!isEditable} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Possibilidade de Aplicação Futura</Label>
                <Textarea value={form.future_application || ''} onChange={(e) => updateField('future_application', e.target.value)} disabled={!isEditable} rows={2} />
              </div>
            </CardContent>
          </Card>

          {form.knowledge_destination && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-base">Destino do Conhecimento</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="text-sm">
                  <ArrowUpRight className="mr-1 h-3 w-3" />
                  {destinationLabels[form.knowledge_destination] || form.knowledge_destination}
                </Badge>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Promote Modal */}
      <Dialog open={showPromote} onOpenChange={setShowPromote}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Destino do Conhecimento</DialogTitle>
            <DialogDescription>Para onde esta pesquisa deve ser direcionada?</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {Object.entries(destinationLabels).map(([key, label]) => (
              <Button
                key={key}
                variant="outline"
                className="w-full justify-start h-auto py-3 text-left"
                onClick={() => handlePromote(key)}
              >
                <ArrowUpRight className="mr-2 h-4 w-4 shrink-0 text-primary" />
                {label}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
