import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, FlaskConical, ArrowUpRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Research {
  id: string;
  title: string;
  objective: string | null;
  hypothesis: string | null;
  status: string;
  knowledge_destination: string | null;
  keywords: string[];
  project_id: string | null;
  linked_product_id: string | null;
  created_by: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  in_progress: 'bg-primary/10 text-primary',
  concluded: 'bg-success/10 text-success',
  promoted: 'bg-accent text-accent-foreground',
};

const statusLabels: Record<string, string> = {
  draft: 'Rascunho',
  in_progress: 'Em Andamento',
  concluded: 'Concluída',
  promoted: 'Promovida',
};

const destinationLabels: Record<string, string> = {
  archived: 'Arquivada',
  continue_research: 'Continuar Pesquisa',
  escalate_product_dev: 'Novo Produto',
  escalate_product_change: 'Alteração de Produto',
  escalate_capa: 'CAPA',
  escalate_process_change: 'Mudança de Processo',
};

export default function Researches() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [researches, setResearches] = useState<Research[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', objective: '', hypothesis: '' });

  const fetchResearches = async () => {
    try {
      const { data, error } = await supabase
        .from('researches')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setResearches((data as unknown as Research[]) || []);
    } catch (e) {
      console.error('Error fetching researches:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchResearches(); }, []);

  const handleCreate = async () => {
    if (!form.title.trim() || !user) return;
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('researches')
        .insert({
          title: form.title.trim(),
          objective: form.objective.trim() || null,
          hypothesis: form.hypothesis.trim() || null,
          created_by: user.id,
        } as any)
        .select()
        .single();
      if (error) throw error;
      toast.success('Pesquisa criada!');
      setShowCreate(false);
      setForm({ title: '', objective: '', hypothesis: '' });
      navigate(`/researches/${(data as any).id}`);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao criar pesquisa');
    } finally {
      setCreating(false);
    }
  };

  const filtered = researches.filter((r) => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.objective?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pesquisas</h1>
          <p className="text-muted-foreground">Trilha de geração de conhecimento técnico</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Pesquisa
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar pesquisas..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
            <SelectItem value="in_progress">Em Andamento</SelectItem>
            <SelectItem value="concluded">Concluída</SelectItem>
            <SelectItem value="promoted">Promovida</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardHeader><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /></CardHeader></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <FlaskConical className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle>Nenhuma pesquisa encontrada</CardTitle>
            <CardDescription>
              {search || statusFilter !== 'all' ? 'Ajuste os filtros' : 'Comece registrando sua primeira pesquisa'}
            </CardDescription>
          </CardHeader>
          {!search && statusFilter === 'all' && (
            <CardContent className="text-center">
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="mr-2 h-4 w-4" /> Nova Pesquisa
              </Button>
            </CardContent>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((research) => (
            <Card
              key={research.id}
              className="h-full hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => navigate(`/researches/${research.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base font-semibold line-clamp-2 leading-snug">
                    {research.title}
                  </CardTitle>
                  <Badge className={`${statusColors[research.status] || ''} shrink-0 text-xs`} variant="secondary">
                    {statusLabels[research.status] || research.status}
                  </Badge>
                </div>
                {research.knowledge_destination && (
                  <Badge variant="outline" className="w-fit text-xs gap-1">
                    <ArrowUpRight className="h-3 w-3" />
                    {destinationLabels[research.knowledge_destination] || research.knowledge_destination}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                {research.objective && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{research.objective}</p>
                )}
                {research.keywords?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {research.keywords.slice(0, 3).map((kw, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{kw}</Badge>
                    ))}
                    {research.keywords.length > 3 && (
                      <Badge variant="secondary" className="text-xs">+{research.keywords.length - 3}</Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Pesquisa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Estudo de novo fotoiniciador" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="objective">Objetivo</Label>
              <Textarea id="objective" value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} placeholder="Qual o objetivo da pesquisa?" rows={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hypothesis">Hipótese</Label>
              <Textarea id="hypothesis" value={form.hypothesis} onChange={(e) => setForm({ ...form, hypothesis: e.target.value })} placeholder="Hipótese a ser testada" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!form.title.trim() || creating}>
              {creating ? 'Criando...' : 'Criar Pesquisa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
