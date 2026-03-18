import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  Search,
  ExternalLink,
  BookOpen,
  Link2,
  Users,
  Calendar,
  Quote,
  Loader2,
  GraduationCap,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAcademicSearch } from '@/hooks/useAcademicSearch';
import type { AcademicPaper, AcademicSearchParams } from '@/types/academic';

interface AcademicSearchPanelProps {
  projectId?: string;
  researchId?: string;
  className?: string;
}

const SOURCE_OPTIONS = [
  { value: 'crossref' as const, label: 'CrossRef' },
  { value: 'semantic_scholar' as const, label: 'Semantic Scholar' },
  { value: 'openalex' as const, label: 'OpenAlex' },
];

export function AcademicSearchPanel({ projectId, researchId, className }: AcademicSearchPanelProps) {
  const [query, setQuery] = useState('');
  const [sources, setSources] = useState<('crossref' | 'semantic_scholar' | 'openalex')[]>([
    'crossref',
    'semantic_scholar',
    'openalex',
  ]);
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [openAccessOnly, setOpenAccessOnly] = useState(false);

  const {
    searchPapers,
    searchResults,
    isSearching,
    linkPaper,
    isLinking,
  } = useAcademicSearch();

  const handleSourceToggle = (source: 'crossref' | 'semantic_scholar' | 'openalex') => {
    setSources((prev) => {
      if (prev.includes(source)) {
        if (prev.length === 1) return prev; // keep at least one
        return prev.filter((s) => s !== source);
      }
      return [...prev, source];
    });
  };

  const handleSearch = useCallback(async () => {
    if (!query.trim() || query.trim().length < 2) {
      toast.error('Digite pelo menos 2 caracteres para buscar');
      return;
    }

    const params: AcademicSearchParams = {
      query: query.trim(),
      sources,
      limit: 15,
      open_access_only: openAccessOnly,
    };
    if (yearFrom) params.year_from = parseInt(yearFrom);
    if (yearTo) params.year_to = parseInt(yearTo);

    try {
      await searchPapers(params);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao buscar artigos');
    }
  }, [query, sources, yearFrom, yearTo, openAccessOnly, searchPapers]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleLinkPaper = async (paper: AcademicPaper) => {
    if (!researchId) return;
    try {
      await linkPaper({
        paperId: paper.id,
        researchId,
        projectId,
        doi: paper.doi,
      });
      toast.success('Artigo vinculado com sucesso');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao vincular artigo');
    }
  };

  const sourceBadgeColor = (source: string) => {
    switch (source) {
      case 'crossref':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'semantic_scholar':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'openalex':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'manual':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      default:
        return '';
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <GraduationCap className="h-5 w-5" />
            Busca de Artigos Academicos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar artigos cientificos..."
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching || query.trim().length < 2}>
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Buscar</span>
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {/* Source checkboxes */}
            <div className="flex items-center gap-3">
              <Label className="text-xs text-muted-foreground">Fontes:</Label>
              {SOURCE_OPTIONS.map((src) => (
                <div key={src.value} className="flex items-center gap-1.5">
                  <Checkbox
                    id={`src-${src.value}`}
                    checked={sources.includes(src.value)}
                    onCheckedChange={() => handleSourceToggle(src.value)}
                  />
                  <Label htmlFor={`src-${src.value}`} className="text-xs cursor-pointer">
                    {src.label}
                  </Label>
                </div>
              ))}
            </div>

            {/* Year range */}
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Ano:</Label>
              <Input
                type="number"
                placeholder="De"
                className="w-20 h-8 text-xs"
                value={yearFrom}
                onChange={(e) => setYearFrom(e.target.value)}
              />
              <span className="text-xs text-muted-foreground">-</span>
              <Input
                type="number"
                placeholder="Ate"
                className="w-20 h-8 text-xs"
                value={yearTo}
                onChange={(e) => setYearTo(e.target.value)}
              />
            </div>

            {/* Open Access toggle */}
            <div className="flex items-center gap-2">
              <Switch
                id="open-access"
                checked={openAccessOnly}
                onCheckedChange={setOpenAccessOnly}
              />
              <Label htmlFor="open-access" className="text-xs cursor-pointer">
                Acesso aberto
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isSearching && (
        <div className="mt-4 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-12 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isSearching && searchResults && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">
              {searchResults.total_results} resultado(s) encontrado(s)
              {searchResults.sources_used.length > 0 && (
                <span> via {searchResults.sources_used.join(', ')}</span>
              )}
            </p>
          </div>

          {searchResults.papers.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Nenhum artigo encontrado. Tente outros termos de busca.
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-3 pr-4">
                {searchResults.papers.map((paper, idx) => (
                  <PaperCard
                    key={paper.doi || idx}
                    paper={paper}
                    onLink={researchId ? () => handleLinkPaper(paper) : undefined}
                    isLinking={isLinking}
                    sourceBadgeColor={sourceBadgeColor}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      )}

      {!isSearching && !searchResults && (
        <Card className="mt-4 border-dashed">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <p className="font-medium">Busque artigos academicos</p>
            <p className="text-sm text-muted-foreground mt-1">
              Pesquise em CrossRef, Semantic Scholar e OpenAlex simultaneamente.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// --- Paper Card Sub-component ---
interface PaperCardProps {
  paper: AcademicPaper;
  onLink?: () => void;
  isLinking: boolean;
  sourceBadgeColor: (source: string) => string;
}

function PaperCard({ paper, onLink, isLinking, sourceBadgeColor }: PaperCardProps) {
  const authorsStr =
    paper.authors.length > 3
      ? paper.authors.slice(0, 3).join(', ') + ` +${paper.authors.length - 3}`
      : paper.authors.join(', ');

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-4 space-y-2">
        {/* Title */}
        <h4 className="font-medium text-sm leading-tight">{paper.title}</h4>

        {/* Authors */}
        {paper.authors.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{authorsStr}</span>
          </div>
        )}

        {/* Abstract */}
        {paper.abstract && (
          <p className="text-xs text-muted-foreground line-clamp-3">{paper.abstract}</p>
        )}

        {/* Metadata Row */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={sourceBadgeColor(paper.source_api)}>
            {paper.source_api === 'semantic_scholar' ? 'S2' : paper.source_api}
          </Badge>

          {paper.publication_year && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {paper.publication_year}
            </span>
          )}

          {paper.journal && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground truncate max-w-[200px]">
              <BookOpen className="h-3 w-3 flex-shrink-0" />
              {paper.journal}
            </span>
          )}

          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Quote className="h-3 w-3" />
            {paper.citation_count} citacoes
          </span>

          {paper.open_access && (
            <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
              Open Access
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          {paper.doi && (
            <a
              href={`https://doi.org/${paper.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              DOI
            </a>
          )}

          {paper.pdf_url && (
            <a
              href={paper.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              PDF
            </a>
          )}

          {onLink && (
            <Button
              variant="outline"
              size="sm"
              className="ml-auto text-xs h-7"
              onClick={onLink}
              disabled={isLinking}
            >
              {isLinking ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Link2 className="h-3 w-3 mr-1" />
              )}
              Vincular
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
