import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Package, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  family: string | null;
  intended_use: string | null;
  regulatory_status: string | null;
  lifecycle_status: string;
  current_version: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

const lifecycleColors: Record<string, string> = {
  development: 'bg-primary/10 text-primary',
  active: 'bg-success/10 text-success',
  discontinued: 'bg-warning/10 text-warning',
  obsolete: 'bg-muted text-muted-foreground',
};

const lifecycleLabels: Record<string, string> = {
  development: 'Em Desenvolvimento',
  active: 'Ativo',
  discontinued: 'Descontinuado',
  obsolete: 'Obsoleto',
};

export default function ProductsCatalog() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', family: '', intended_use: '' });

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setProducts((data as unknown as Product[]) || []);
    } catch (e) {
      console.error('Error fetching products:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleCreate = async () => {
    if (!form.name.trim() || !user) return;
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: form.name.trim(),
          family: form.family.trim() || null,
          intended_use: form.intended_use.trim() || null,
          created_by: user.id,
        } as any)
        .select()
        .single();
      if (error) throw error;

      // Create timeline event
      await supabase.from('product_timeline_events').insert({
        product_id: (data as any).id,
        event_type: 'creation',
        title: `Produto "${form.name.trim()}" criado`,
        created_by: user.id,
      } as any);

      toast.success('Produto criado com sucesso!');
      setShowCreate(false);
      setForm({ name: '', family: '', intended_use: '' });
      navigate(`/products/${(data as any).id}`);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao criar produto');
    } finally {
      setCreating(false);
    }
  };

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.family?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.lifecycle_status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produtos</h1>
          <p className="text-muted-foreground">Catálogo de produtos e histórico de vida</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar produtos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Ciclo de vida" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="development">Em Desenvolvimento</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="discontinued">Descontinuado</SelectItem>
            <SelectItem value="obsolete">Obsoleto</SelectItem>
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
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle>Nenhum produto encontrado</CardTitle>
            <CardDescription>
              {search || statusFilter !== 'all' ? 'Ajuste os filtros' : 'Comece cadastrando seu primeiro produto'}
            </CardDescription>
          </CardHeader>
          {!search && statusFilter === 'all' && (
            <CardContent className="text-center">
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="mr-2 h-4 w-4" /> Criar Produto
              </Button>
            </CardContent>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => (
            <Link key={product.id} to={`/products/${product.id}`}>
              <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-semibold line-clamp-2 leading-snug">
                      {product.name}
                    </CardTitle>
                    <Badge className={`${lifecycleColors[product.lifecycle_status] || ''} shrink-0 text-xs`} variant="secondary">
                      {lifecycleLabels[product.lifecycle_status] || product.lifecycle_status}
                    </Badge>
                  </div>
                  {product.family && (
                    <Badge variant="outline" className="w-fit text-xs">{product.family}</Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  {product.intended_use && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{product.intended_use}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      v{product.current_version || '1.0'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Produto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Produto *</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Resina Vitality A2" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="family">Família</Label>
              <Input id="family" value={form.family} onChange={(e) => setForm({ ...form, family: e.target.value })} placeholder="Ex: Resinas Compostas" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="use">Uso Pretendido</Label>
              <Textarea id="use" value={form.intended_use} onChange={(e) => setForm({ ...form, intended_use: e.target.value })} placeholder="Descreva o uso pretendido do produto" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!form.name.trim() || creating}>
              {creating ? 'Criando...' : 'Criar Produto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
