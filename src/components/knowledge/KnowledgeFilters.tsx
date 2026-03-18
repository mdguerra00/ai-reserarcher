import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  FlaskConical, 
  Gauge, 
  Target, 
  BookOpen, 
  Lightbulb,
  TrendingUp,
  Link2,
  AlertTriangle,
  Scale,
  Zap,
  X,
  FileText,
  Brain,
  Layers,
  CheckCircle2,
  Clock,
  CircleDashed,
  Globe,
  GraduationCap,
} from 'lucide-react';
import { KnowledgeCategory } from './KnowledgeCard';

export type EntryTypeFilter = 'all' | 'documents' | 'insights' | 'experiments' | 'facts' | 'academic';
export type ValidationFilter = 'all' | 'pending' | 'validated';

interface Project {
  id: string;
  name: string;
}

interface KnowledgeFiltersProps {
  projects: Project[];
  selectedProject: string | null;
  onProjectChange: (projectId: string | null) => void;
  selectedCategories: KnowledgeCategory[];
  onCategoryToggle: (category: KnowledgeCategory) => void;
  minConfidence: number;
  onConfidenceChange: (value: number) => void;
  onClearFilters: () => void;
  entryType: EntryTypeFilter;
  onEntryTypeChange: (type: EntryTypeFilter) => void;
  validationFilter: ValidationFilter;
  onValidationFilterChange: (filter: ValidationFilter) => void;
}

// Analytical categories (primary)
const analyticalCategories: { value: KnowledgeCategory; label: string; icon: typeof FlaskConical }[] = [
  { value: 'finding', label: 'Descoberta', icon: TrendingUp },
  { value: 'correlation', label: 'Correlação', icon: Link2 },
  { value: 'anomaly', label: 'Anomalia', icon: AlertTriangle },
  { value: 'benchmark', label: 'Benchmark', icon: Scale },
  { value: 'recommendation', label: 'Recomendação', icon: Zap },
  { value: 'cross_reference', label: 'Ref. Cruzada', icon: Link2 },
  { value: 'pattern', label: 'Padrão', icon: TrendingUp },
  { value: 'contradiction', label: 'Contradição', icon: AlertTriangle },
  { value: 'gap', label: 'Lacuna', icon: CircleDashed },
];

// Legacy categories (secondary)
const legacyCategories: { value: KnowledgeCategory; label: string; icon: typeof FlaskConical }[] = [
  { value: 'compound', label: 'Composto', icon: FlaskConical },
  { value: 'parameter', label: 'Parâmetro', icon: Gauge },
  { value: 'result', label: 'Resultado', icon: Target },
  { value: 'method', label: 'Metodologia', icon: BookOpen },
  { value: 'observation', label: 'Observação', icon: Lightbulb },
];

export function KnowledgeFilters({
  projects,
  selectedProject,
  onProjectChange,
  selectedCategories,
  onCategoryToggle,
  minConfidence,
  onConfidenceChange,
  onClearFilters,
  entryType,
  onEntryTypeChange,
  validationFilter,
  onValidationFilterChange,
}: KnowledgeFiltersProps) {
  const hasActiveFilters = selectedProject || selectedCategories.length > 0 || minConfidence > 0 || entryType !== 'all' || validationFilter !== 'all';

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">Filtros</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <X className="h-3 w-3 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {/* Entry Type Filter */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Tipo de Entrada</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={entryType === 'all' ? 'default' : 'outline'}
            size="sm"
            className="text-xs"
            onClick={() => onEntryTypeChange('all')}
          >
            <Layers className="h-3 w-3 mr-1" />
            Todos
          </Button>
          <Button
            variant={entryType === 'documents' ? 'default' : 'outline'}
            size="sm"
            className="text-xs"
            onClick={() => onEntryTypeChange('documents')}
          >
            <FileText className="h-3 w-3 mr-1" />
            Documentos
          </Button>
          <Button
            variant={entryType === 'insights' ? 'default' : 'outline'}
            size="sm"
            className="text-xs"
            onClick={() => onEntryTypeChange('insights')}
          >
            <Brain className="h-3 w-3 mr-1" />
            Insights
          </Button>
          <Button
            variant={entryType === 'experiments' ? 'default' : 'outline'}
            size="sm"
            className="text-xs"
            onClick={() => onEntryTypeChange('experiments')}
          >
            <FlaskConical className="h-3 w-3 mr-1" />
            Experimentos
          </Button>
          <Button
            variant={entryType === 'facts' ? 'default' : 'outline'}
            size="sm"
            className="text-xs"
            onClick={() => onEntryTypeChange('facts')}
          >
            <BookOpen className="h-3 w-3 mr-1" />
            Fatos
          </Button>
          <Button
            variant={entryType === 'academic' ? 'default' : 'outline'}
            size="sm"
            className="text-xs"
            onClick={() => onEntryTypeChange('academic')}
          >
            <GraduationCap className="h-3 w-3 mr-1" />
            Artigos
          </Button>
        </div>
      </div>

      <Separator />

      {/* Project Filter */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Projeto</Label>
        <Select
          value={selectedProject || 'all'}
          onValueChange={(value) => onProjectChange(value === 'all' ? null : value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Todos os projetos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os projetos</SelectItem>
            <SelectItem value="__global__">
              <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> Global (sem projeto)</span>
            </SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Validation Filter - Only show when insights are visible */}
      {entryType !== 'documents' && (
        <>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Status de Validação</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={validationFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                className="text-xs"
                onClick={() => onValidationFilterChange('all')}
              >
                <CircleDashed className="h-3 w-3 mr-1" />
                Todos
              </Button>
              <Button
                variant={validationFilter === 'pending' ? 'default' : 'outline'}
                size="sm"
                className="text-xs"
                onClick={() => onValidationFilterChange('pending')}
              >
                <Clock className="h-3 w-3 mr-1" />
                Pendentes
              </Button>
              <Button
                variant={validationFilter === 'validated' ? 'default' : 'outline'}
                size="sm"
                className="text-xs"
                onClick={() => onValidationFilterChange('validated')}
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Validados
              </Button>
            </div>
          </div>

          <Separator />

          {/* Analytical Categories (Primary) */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Análises</Label>
            <div className="flex flex-wrap gap-2">
              {analyticalCategories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategories.includes(cat.value);
                return (
                  <Button
                    key={cat.value}
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs"
                    onClick={() => onCategoryToggle(cat.value)}
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {cat.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Legacy Categories (Secondary) */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Categorias Básicas</Label>
            <div className="flex flex-wrap gap-2">
              {legacyCategories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategories.includes(cat.value);
                return (
                  <Button
                    key={cat.value}
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs"
                    onClick={() => onCategoryToggle(cat.value)}
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {cat.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Confidence Filter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Confiança mínima</Label>
              <span className="text-xs font-medium">{Math.round(minConfidence * 100)}%</span>
            </div>
            <Slider
              value={[minConfidence]}
              onValueChange={([value]) => onConfidenceChange(value)}
              min={0}
              max={1}
              step={0.1}
              className="w-full"
            />
          </div>
        </>
      )}
    </div>
  );
}
