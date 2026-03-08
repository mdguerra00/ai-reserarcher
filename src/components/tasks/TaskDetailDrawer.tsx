import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Calendar,
  User,
  MessageSquare,
  FlaskConical,
  Play,
  BarChart3,
  CheckCircle2,
  History,
  Plus,
  X,
  Save,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { TaskComments } from './TaskComments';
import { TaskActivityLog } from './TaskActivityLog';

interface TaskData {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigned_to: string | null;
  due_date: string | null;
  tags: string[];
  blocked_reason: string | null;
  completed_at: string | null;
  hypothesis: string | null;
  variables_changed: string[];
  target_metrics: string[];
  success_criteria: string | null;
  procedure: string | null;
  checklist: any[];
  conclusion: string | null;
  decision: string | null;
  partial_results: string | null;
  external_links: string[];
  created_at: string;
  updated_at: string;
  project_id: string;
}

interface MemberInfo {
  user_id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

interface TaskDetailDrawerProps {
  task: TaskData | null;
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
  members: MemberInfo[];
}

const statusLabels: Record<string, string> = {
  backlog: 'Backlog',
  todo: 'A Fazer',
  in_progress: 'Em Andamento',
  blocked: 'Bloqueado',
  review: 'Revisão',
  done: 'Concluído',
};

const priorityLabels: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
};

const priorityColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-primary/10 text-primary',
  high: 'bg-warning/10 text-warning',
  urgent: 'bg-destructive/10 text-destructive',
};

const decisionOptions = [
  { value: 'approved', label: '✅ Aprovado' },
  { value: 'adjust', label: '🔧 Ajustar formulação' },
  { value: 'repeat', label: '🔄 Repetir teste' },
  { value: 'discarded', label: '❌ Descartado' },
];

export function TaskDetailDrawer({
  task,
  projectId,
  open,
  onOpenChange,
  onUpdate,
  members,
}: TaskDetailDrawerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  
  // R&D fields
  const [hypothesis, setHypothesis] = useState('');
  const [variablesChanged, setVariablesChanged] = useState<string[]>([]);
  const [targetMetrics, setTargetMetrics] = useState<string[]>([]);
  const [successCriteria, setSuccessCriteria] = useState('');
  const [procedure, setProcedure] = useState('');
  const [checklist, setChecklist] = useState<{ text: string; done: boolean }[]>([]);
  const [partialResults, setPartialResults] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [decision, setDecision] = useState('');
  const [externalLinks, setExternalLinks] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [newVariable, setNewVariable] = useState('');
  const [newMetric, setNewMetric] = useState('');
  const [newLink, setNewLink] = useState('');
  const [newCheckItem, setNewCheckItem] = useState('');

  useEffect(() => {
    if (task && open) {
      setEditTitle(task.title);
      setHypothesis(task.hypothesis || '');
      setVariablesChanged(task.variables_changed || []);
      setTargetMetrics(task.target_metrics || []);
      setSuccessCriteria(task.success_criteria || '');
      setProcedure(task.procedure || '');
      setChecklist(Array.isArray(task.checklist) ? task.checklist : []);
      setPartialResults(task.partial_results || '');
      setConclusion(task.conclusion || '');
      setDecision(task.decision || '');
      setExternalLinks(task.external_links || []);
    }
  }, [task, open]);

  if (!task) return null;

  const assignee = members.find(m => m.user_id === task.assigned_to);
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

  const getInitials = (name?: string | null, email?: string) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    return email?.charAt(0).toUpperCase() ?? '?';
  };

  const handleFieldUpdate = async (field: string, value: any) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ [field]: value })
        .eq('id', task.id);
      if (error) throw error;

      // Send notification when assigning a task to someone else
      if (field === 'assigned_to' && value && value !== user.id) {
        await supabase.from('notifications').insert({
          user_id: value,
          project_id: task.project_id,
          type: 'task_assigned',
          title: 'Nova tarefa atribuída',
          message: `Você foi designado para: "${task.title}"`,
          link: `/projects/${task.project_id}?tab=tasks`,
        });
      }

      onUpdate();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro', description: err.message });
    }
  };

  const handleSaveRnD = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: editTitle,
          hypothesis,
          variables_changed: variablesChanged,
          target_metrics: targetMetrics,
          success_criteria: successCriteria,
          procedure,
          checklist,
          partial_results: partialResults,
          conclusion,
          decision: decision || null,
          external_links: externalLinks,
        })
        .eq('id', task.id);
      if (error) throw error;

      // Auto-create knowledge item when task is done
      if (task.status === 'done') {
        const { createKnowledgeFromTask } = await import('@/hooks/useTaskKnowledge');
        await createKnowledgeFromTask({
          id: task.id,
          title: editTitle,
          hypothesis,
          variables_changed: variablesChanged,
          target_metrics: targetMetrics,
          success_criteria: successCriteria,
          procedure,
          checklist,
          partial_results: partialResults,
          conclusion,
          decision: decision || null,
          external_links: externalLinks,
          tags: task.tags || [],
        }, user.id, projectId);
      }

      toast({ title: 'Salvo', description: 'Dados atualizados com sucesso.' });
      onUpdate();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: err.message });
    } finally {
      setSaving(false);
    }
  };


  const addArrayItem = (arr: string[], setArr: (v: string[]) => void, value: string, setInput: (v: string) => void) => {
    if (value.trim()) {
      setArr([...arr, value.trim()]);
      setInput('');
    }
  };

  const removeArrayItem = (arr: string[], setArr: (v: string[]) => void, index: number) => {
    setArr(arr.filter((_, i) => i !== index));
  };

  const renderArrayField = (label: string, items: string[], setItems: (v: string[]) => void, newValue: string, setNewValue: (v: string) => void, placeholder: string) => (
    <div>
      <label className="text-sm font-medium text-muted-foreground mb-1 block">{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {items.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-1 pr-1 rounded-md border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
            {item}
            <button onClick={() => removeArrayItem(items, setItems, i)} className="hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={newValue}
          onChange={e => setNewValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addArrayItem(items, setItems, newValue, setNewValue); } }}
          className="h-8 text-sm"
        />
        <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => addArrayItem(items, setItems, newValue, setNewValue)}>
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[600px] overflow-y-auto p-0">
        {/* Header */}
        <div className="p-6 pb-4 border-b">
          <SheetHeader className="mb-4">
            <div className="flex items-start gap-2">
              <Input
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onBlur={() => { if (editTitle !== task.title) handleFieldUpdate('title', editTitle); }}
                className="text-lg font-semibold border-none p-0 h-auto focus-visible:ring-0 shadow-none"
              />
            </div>
            {task.description && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">{task.description}</p>
            )}
          </SheetHeader>

          {/* Meta info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Status</label>
              <Select value={task.status} onValueChange={v => handleFieldUpdate('status', v)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Prioridade</label>
              <Select value={task.priority} onValueChange={v => handleFieldUpdate('priority', v)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(priorityLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Responsável</label>
              <Select value={task.assigned_to || '__none__'} onValueChange={v => handleFieldUpdate('assigned_to', v === '__none__' ? null : v)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Não atribuído</SelectItem>
                  {members.map(m => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {m.full_name || m.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Prazo</label>
              <Input
                type="date"
                value={task.due_date || ''}
                onChange={e => handleFieldUpdate('due_date', e.target.value || null)}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="mt-3">
            <div className="flex flex-wrap gap-1 mb-1">
              {(task.tags || []).map((tag, i) => (
                <Badge key={i} variant="outline" className="text-xs gap-1 pr-1">
                  {tag}
                  <button onClick={async () => {
                    const newTags = (task.tags || []).filter((_, idx) => idx !== i);
                    await handleFieldUpdate('tags', newTags);
                  }}>
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-1">
              <Input
                placeholder="Nova tag..."
                value={newTag}
                onChange={e => { e.stopPropagation(); setNewTag(e.target.value); }}
                onKeyDown={async e => {
                  e.stopPropagation();
                  if (e.key === 'Enter' && newTag.trim()) {
                    e.preventDefault();
                    await handleFieldUpdate('tags', [...(task.tags || []), newTag.trim()]);
                    setNewTag('');
                  }
                }}
                onFocus={e => e.stopPropagation()}
                className="h-7 text-xs"
              />
            </div>
          </div>

          {isOverdue && (
            <div className="flex items-center gap-2 mt-3 text-warning text-xs font-medium">
              <AlertTriangle className="h-3.5 w-3.5" />
              Tarefa atrasada
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="planning" className="p-4">
          <TabsList className="grid w-full grid-cols-6 h-9">
            <TabsTrigger value="planning" className="text-xs gap-1 px-1">
              <FlaskConical className="h-3 w-3" />
              <span className="hidden sm:inline">Plano</span>
            </TabsTrigger>
            <TabsTrigger value="execution" className="text-xs gap-1 px-1">
              <Play className="h-3 w-3" />
              <span className="hidden sm:inline">Execução</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="text-xs gap-1 px-1">
              <BarChart3 className="h-3 w-3" />
              <span className="hidden sm:inline">Resultado</span>
            </TabsTrigger>
            <TabsTrigger value="conclusion" className="text-xs gap-1 px-1">
              <CheckCircle2 className="h-3 w-3" />
              <span className="hidden sm:inline">Conclusão</span>
            </TabsTrigger>
            <TabsTrigger value="comments" className="text-xs gap-1 px-1">
              <MessageSquare className="h-3 w-3" />
              <span className="hidden sm:inline">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs gap-1 px-1">
              <History className="h-3 w-3" />
              <span className="hidden sm:inline">Log</span>
            </TabsTrigger>
          </TabsList>

          {/* Planning */}
          <TabsContent value="planning" className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Hipótese</label>
              <Textarea
                value={hypothesis}
                onChange={e => setHypothesis(e.target.value)}
                placeholder="Se alterarmos X, esperamos que Y..."
                className="resize-none text-sm"
                rows={3}
              />
            </div>
            {renderArrayField("Variáveis alteradas", variablesChanged, setVariablesChanged, newVariable, setNewVariable, "Ex: concentração UDMA")}
            {renderArrayField("Métricas alvo", targetMetrics, setTargetMetrics, newMetric, setNewMetric, "Ex: resistência flexural")}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Critério de sucesso</label>
              <Textarea
                value={successCriteria}
                onChange={e => setSuccessCriteria(e.target.value)}
                placeholder="A formulação é aprovada se..."
                className="resize-none text-sm"
                rows={2}
              />
            </div>
            <Button onClick={handleSaveRnD} disabled={saving} size="sm" className="w-full">
              {saving ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Save className="mr-2 h-3 w-3" />}
              Salvar Planejamento
            </Button>
          </TabsContent>

          {/* Execution */}
          <TabsContent value="execution" className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Procedimento executado</label>
              <Textarea
                value={procedure}
                onChange={e => setProcedure(e.target.value)}
                placeholder="Descreva o procedimento realizado..."
                className="resize-none text-sm"
                rows={4}
              />
            </div>

            {/* Checklist */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Checklist</label>
              <div className="space-y-2">
                {checklist.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Checkbox
                      checked={item.done}
                      onCheckedChange={checked => {
                        const updated = [...checklist];
                        updated[i] = { ...updated[i], done: !!checked };
                        setChecklist(updated);
                      }}
                    />
                    <span className={`text-sm flex-1 ${item.done ? 'line-through text-muted-foreground' : ''}`}>
                      {item.text}
                    </span>
                    <button onClick={() => setChecklist(checklist.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Novo item..."
                  value={newCheckItem}
                  onChange={e => { e.stopPropagation(); setNewCheckItem(e.target.value); }}
                  onKeyDown={e => {
                    e.stopPropagation();
                    if (e.key === 'Enter' && newCheckItem.trim()) {
                      e.preventDefault();
                      setChecklist([...checklist, { text: newCheckItem.trim(), done: false }]);
                      setNewCheckItem('');
                    }
                  }}
                  onFocus={e => e.stopPropagation()}
                  className="h-8 text-sm"
                />
                <Button size="sm" variant="outline" className="h-8" onClick={() => {
                  if (newCheckItem.trim()) {
                    setChecklist([...checklist, { text: newCheckItem.trim(), done: false }]);
                    setNewCheckItem('');
                  }
                }}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* External links */}
            {renderArrayField("Links externos", externalLinks, setExternalLinks, newLink, setNewLink, "https://...")}

            <Button onClick={handleSaveRnD} disabled={saving} size="sm" className="w-full">
              {saving ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Save className="mr-2 h-3 w-3" />}
              Salvar Execução
            </Button>
          </TabsContent>

          {/* Results */}
          <TabsContent value="results" className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Resultados parciais</label>
              <Textarea
                value={partialResults}
                onChange={e => setPartialResults(e.target.value)}
                placeholder="Descreva os resultados obtidos..."
                className="resize-none text-sm"
                rows={6}
              />
            </div>
            <Button onClick={handleSaveRnD} disabled={saving} size="sm" className="w-full">
              {saving ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Save className="mr-2 h-3 w-3" />}
              Salvar Resultados
            </Button>
          </TabsContent>

          {/* Conclusion */}
          <TabsContent value="conclusion" className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Conclusão técnica</label>
              <Textarea
                value={conclusion}
                onChange={e => setConclusion(e.target.value)}
                placeholder="Resumo das conclusões..."
                className="resize-none text-sm"
                rows={4}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Decisão</label>
              <Select value={decision || '__none__'} onValueChange={v => setDecision(v === '__none__' ? '' : v)}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Selecionar decisão..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sem decisão</SelectItem>
                  {decisionOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSaveRnD} disabled={saving} size="sm" className="w-full">
              {saving ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Save className="mr-2 h-3 w-3" />}
              Salvar Conclusão
            </Button>
          </TabsContent>

          {/* Comments */}
          <TabsContent value="comments" className="mt-4">
            <TaskComments taskId={task.id} />
          </TabsContent>

          {/* History */}
          <TabsContent value="history" className="mt-4">
            <TaskActivityLog taskId={task.id} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
