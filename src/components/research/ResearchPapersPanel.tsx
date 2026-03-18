import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Search,
  ExternalLink,
  BookOpen,
  Link2,
  Unlink,
  Users,
  Calendar,
  Quote,
  Loader2,
  GraduationCap,
  Trash2,
  Plus,
  FilePlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAcademicSearch } from '@/hooks/useAcademicSearch';
import type { AcademicPaper, AcademicPaperLink, AcademicSearchParams } from '@/types/academic';

interface ResearchPapersPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  researchId: string;
  projectId?: string;
}

const SOURCE_OPTIONS = [
  { value: 'crossref' as const, label: 'CrossRef' },
  { value: 'semantic_scholar' as const, label: 'Semantic Scholar' },
  { value: 'openalex' as const, label: 'OpenAlex' },
];

export function ResearchPapersPanel({ open, onOpenChange, researchId, projectId }: ResearchPapersPanelProps) {
  const {
    searchPapers,
    searchResults,
    isSearching,
    resetSearch,
    linkPaper,
    isLinking,
    unlinkPaper,
    isUnlinking,
    addManualPaper,
    isAddingManual,
    useLinkedPapers,
  } = useAcademicSearch();

  const { data: linkedPapers, isLoading: loadingLinked } = useLinkedPapers(researchId);

  const [query, setQuery] = useState('');
  const [sources, setSources] = useState<('crossref' | 'semantic_scholar' | 'openalex')[]>([
    'crossref', 'semantic_scholar', 'openalex',
  ]);
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [openAccessOnly, setOpenAccessOnly] = useState(false);
  const [activeTab, setActiveTab] = useState('linked');

  // Manual entry form state
  const [manualTitle, setManualTitle] = useState('');
  const [manualAuthors, setManualAuthors] = useState('');
  const [manualDoi, setManualDoi] = useState('');
  const [manualYear, setManualYear] = useState('');
  const [manualJournal, setManualJournal] = useState('');
  const [manualAbstract, setManualAbstract] = useState('');
  const [manualPdfUrl, setManualPdfUrl] = useState('');

  const handleSourceToggle = (source: 'crossref' | 'semantic_scholar' | 'openalex') => {
    setSources((prev) => {
      if (prev.includes(source)) {
        if (prev.length === 1) return prev;
        return prev.filter((s) => s !== source);
      }
      return [...prev, source];
    });
  };

  const handleSearch = async () => {
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
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleLinkPaper = async (paper: AcademicPaper) => {
    try {
      await linkPaper({ paperId: paper.id, researchId, projectId, doi: paper.doi });
      toast.success('Artigo vinculado!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao vincular');
    }
  };

  const handleUnlinkPaper = async (link: AcademicPaperLink) => {
    try {
      await unlinkPaper({ linkId: link.id, researchId });
      toast.success('Artigo desvinculado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao desvincular');
    }
  };

  const handleAddManual = async () => {
    if (!manualTitle.trim()) {
      toast.error('O titulo e obrigatorio');
      return;
    }
    try {
      await addManualPaper({
        paper: {
          doi: manualDoi.trim() || null,
          title: manualTitle.trim(),
          authors: manualAuthors.split(',').map((a) => a.trim()).filter(Boolean),
          abstract: manualAbstract.trim() || null,
          publication_year: manualYear ? parseInt(manualYear) : null,
          journal: manualJournal.trim() || null,
          citation_count: 0,
          source_api: 'manual',
          api_data: {},
          pdf_url: manualPdfUrl.trim() || null,
          open_access: false,
        },
        researchId,
        projectId,
      });
      toast.success('Artigo adicionado e vinculado!');
      // Reset form
      setManualTitle('');
      setManualAuthors('');
      setManualDoi('');
      setManualYear('');
      setManualJournal('');
      setManualAbstract('');
      setManualPdfUrl('');
      setActiveTab('linked');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao adicionar artigo');
    }
  };

  const isAlreadyLinked = (paperId: string) =>
    linkedPapers?.some((lp) => lp.paper_id === paperId) ?? false;

  const sourceBadgeColor = (source: string) => {
    switch (source) {
      case 'crossref': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'semantic_scholar': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'openalex': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'manual': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      default: return '';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl lg:max-w-2xl overflow-hidden flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Artigos Academicos
          </SheetTitle>
          <SheetDescription>
            Gerencie os artigos vinculados a esta pesquisa
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 mt-4">
          <TabsList className="w-full">
            <TabsTrigger value="linked" className="flex-1">
              <BookOpen className="h-4 w-4 mr-2" />
              Vinculados {linkedPapers?.length ? `(${linkedPapers.length})` : ''}
            </TabsTrigger>
            <TabsTrigger value="search" className="flex-1">
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex-1">
              <FilePlus className="h-4 w-4 mr-2" />
              Manual
            </TabsTrigger>
          </TabsList>

          {/* Linked Papers Tab */}
          <TabsContent value="linked" className="flex-1 min-h-0">
            {loadingLinked ? (
              <div className="space-y-3 mt-2">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="pt-4 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-20" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !linkedPapers?.length ? (
              <Card className="mt-2 border-dashed">
                <CardContent className="pt-6 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <p className="font-medium text-sm">Nenhum artigo vinculado</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use a aba "Buscar Novos" para encontrar e vincular artigos.
                  </p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => setActiveTab('search')}>
                    <Search className="h-3 w-3 mr-1" />
                    Buscar artigos
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[calc(100vh-220px)] mt-2">
                <div className="space-y-3 pr-4">
                  {linkedPapers.map((link) => (
                    <LinkedPaperCard
                      key={link.id}
                      link={link}
                      onUnlink={() => handleUnlinkPaper(link)}
                      isUnlinking={isUnlinking}
                      sourceBadgeColor={sourceBadgeColor}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          {/* Search Tab */}
          <TabsContent value="search" className="flex-1 min-h-0">
            <div className="space-y-3 mt-2">
              {/* Search Input */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar artigos..."
                    className="pl-9"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>
                <Button onClick={handleSearch} disabled={isSearching || query.trim().length < 2} size="sm">
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>

              {/* Compact Filters */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-2">
                  {SOURCE_OPTIONS.map((src) => (
                    <div key={src.value} className="flex items-center gap-1">
                      <Checkbox
                        id={`panel-src-${src.value}`}
                        checked={sources.includes(src.value)}
                        onCheckedChange={() => handleSourceToggle(src.value)}
                        className="h-3.5 w-3.5"
                      />
                      <Label htmlFor={`panel-src-${src.value}`} className="text-xs cursor-pointer">
                        {src.label}
                      </Label>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <Input type="number" placeholder="De" className="w-16 h-7 text-xs" value={yearFrom} onChange={(e) => setYearFrom(e.target.value)} />
                  <span className="text-muted-foreground">-</span>
                  <Input type="number" placeholder="Ate" className="w-16 h-7 text-xs" value={yearTo} onChange={(e) => setYearTo(e.target.value)} />
                </div>
                <div className="flex items-center gap-1">
                  <Switch id="panel-oa" checked={openAccessOnly} onCheckedChange={setOpenAccessOnly} className="scale-75" />
                  <Label htmlFor="panel-oa" className="text-xs cursor-pointer">OA</Label>
                </div>
              </div>

              {/* Search Results */}
              {isSearching && (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}><CardContent className="pt-3 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </CardContent></Card>
                  ))}
                </div>
              )}

              {!isSearching && searchResults && (
                <>
                  <p className="text-xs text-muted-foreground">
                    {searchResults.total_results} resultado(s) via {searchResults.sources_used.join(', ')}
                  </p>
                  {searchResults.papers.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="pt-4 text-center text-sm text-muted-foreground">
                        Nenhum artigo encontrado.
                      </CardContent>
                    </Card>
                  ) : (
                    <ScrollArea className="h-[calc(100vh-340px)]">
                      <div className="space-y-2 pr-4">
                        {searchResults.papers.map((paper, idx) => (
                          <SearchResultCard
                            key={paper.doi || idx}
                            paper={paper}
                            alreadyLinked={isAlreadyLinked(paper.id)}
                            onLink={() => handleLinkPaper(paper)}
                            isLinking={isLinking}
                            sourceBadgeColor={sourceBadgeColor}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </>
              )}

              {!isSearching && !searchResults && (
                <Card className="border-dashed">
                  <CardContent className="pt-6 text-center">
                    <GraduationCap className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">
                      Pesquise em CrossRef, Semantic Scholar e OpenAlex.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Manual Entry Tab */}
          <TabsContent value="manual" className="flex-1 min-h-0">
            <ScrollArea className="h-[calc(100vh-220px)] mt-2">
              <div className="space-y-3 pr-4">
                <p className="text-xs text-muted-foreground">
                  Adicione manualmente artigos que voce obteve via acesso institucional ou outras fontes.
                </p>

                <div className="space-y-2">
                  <div>
                    <Label htmlFor="manual-title" className="text-xs">Titulo *</Label>
                    <Input id="manual-title" placeholder="Titulo do artigo" value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)} className="h-8 text-sm" />
                  </div>

                  <div>
                    <Label htmlFor="manual-authors" className="text-xs">Autores (separados por virgula)</Label>
                    <Input id="manual-authors" placeholder="Autor 1, Autor 2, Autor 3" value={manualAuthors}
                      onChange={(e) => setManualAuthors(e.target.value)} className="h-8 text-sm" />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="manual-doi" className="text-xs">DOI</Label>
                      <Input id="manual-doi" placeholder="10.1234/exemplo" value={manualDoi}
                        onChange={(e) => setManualDoi(e.target.value)} className="h-8 text-sm" />
                    </div>
                    <div>
                      <Label htmlFor="manual-year" className="text-xs">Ano</Label>
                      <Input id="manual-year" type="number" placeholder="2024" value={manualYear}
                        onChange={(e) => setManualYear(e.target.value)} className="h-8 text-sm" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="manual-journal" className="text-xs">Revista / Journal</Label>
                    <Input id="manual-journal" placeholder="Nome da revista" value={manualJournal}
                      onChange={(e) => setManualJournal(e.target.value)} className="h-8 text-sm" />
                  </div>

                  <div>
                    <Label htmlFor="manual-pdf" className="text-xs">URL do PDF</Label>
                    <Input id="manual-pdf" placeholder="https://..." value={manualPdfUrl}
                      onChange={(e) => setManualPdfUrl(e.target.value)} className="h-8 text-sm" />
                  </div>

                  <div>
                    <Label htmlFor="manual-abstract" className="text-xs">Resumo / Abstract</Label>
                    <Textarea id="manual-abstract" placeholder="Resumo do artigo..." value={manualAbstract}
                      onChange={(e) => setManualAbstract(e.target.value)} className="text-sm min-h-[80px]" />
                  </div>

                  <Button onClick={handleAddManual} disabled={isAddingManual || !manualTitle.trim()} className="w-full">
                    {isAddingManual ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    Adicionar e Vincular
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

// --- Linked Paper Card ---
function LinkedPaperCard({
  link,
  onUnlink,
  isUnlinking,
  sourceBadgeColor,
}: {
  link: AcademicPaperLink;
  onUnlink: () => void;
  isUnlinking: boolean;
  sourceBadgeColor: (s: string) => string;
}) {
  const paper = link.paper;
  if (!paper) return null;

  const authorsStr =
    paper.authors.length > 3
      ? paper.authors.slice(0, 3).join(', ') + ` +${paper.authors.length - 3}`
      : paper.authors.join(', ');

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-4 space-y-2">
        <h4 className="font-medium text-sm leading-tight">{paper.title}</h4>

        {paper.authors.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{authorsStr}</span>
          </div>
        )}

        {paper.abstract && (
          <p className="text-xs text-muted-foreground line-clamp-2">{paper.abstract}</p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={sourceBadgeColor(paper.source_api)}>
            {paper.source_api === 'semantic_scholar' ? 'S2' : paper.source_api}
          </Badge>
          {paper.publication_year && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" /> {paper.publication_year}
            </span>
          )}
          {paper.journal && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground truncate max-w-[180px]">
              <BookOpen className="h-3 w-3 flex-shrink-0" /> {paper.journal}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Quote className="h-3 w-3" /> {paper.citation_count}
          </span>
          {paper.open_access && (
            <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
              OA
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 pt-1">
          {paper.doi && (
            <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
              <ExternalLink className="h-3 w-3" /> DOI
            </a>
          )}
          {paper.pdf_url && (
            <a href={paper.pdf_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
              <ExternalLink className="h-3 w-3" /> PDF
            </a>
          )}
          <Button variant="ghost" size="sm" className="ml-auto text-xs h-7 text-destructive hover:text-destructive"
            onClick={onUnlink} disabled={isUnlinking}>
            {isUnlinking ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Trash2 className="h-3 w-3 mr-1" />}
            Desvincular
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Search Result Card ---
function SearchResultCard({
  paper,
  alreadyLinked,
  onLink,
  isLinking,
  sourceBadgeColor,
}: {
  paper: AcademicPaper;
  alreadyLinked: boolean;
  onLink: () => void;
  isLinking: boolean;
  sourceBadgeColor: (s: string) => string;
}) {
  const authorsStr =
    paper.authors.length > 3
      ? paper.authors.slice(0, 3).join(', ') + ` +${paper.authors.length - 3}`
      : paper.authors.join(', ');

  return (
    <Card className={`transition-shadow ${alreadyLinked ? 'opacity-60 border-primary/30' : 'hover:shadow-md'}`}>
      <CardContent className="pt-3 space-y-1.5">
        <h4 className="font-medium text-xs leading-tight">{paper.title}</h4>

        {paper.authors.length > 0 && (
          <p className="text-xs text-muted-foreground truncate">{authorsStr}</p>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className={`text-[10px] ${sourceBadgeColor(paper.source_api)}`}>
            {paper.source_api === 'semantic_scholar' ? 'S2' : paper.source_api}
          </Badge>
          {paper.publication_year && (
            <span className="text-[10px] text-muted-foreground">{paper.publication_year}</span>
          )}
          <span className="text-[10px] text-muted-foreground">{paper.citation_count} cit.</span>
          {paper.open_access && (
            <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">OA</Badge>
          )}
        </div>

        <div className="flex items-center gap-2 pt-0.5">
          {paper.doi && (
            <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline">
              <ExternalLink className="h-2.5 w-2.5" /> DOI
            </a>
          )}
          {paper.pdf_url && (
            <a href={paper.pdf_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline">
              <ExternalLink className="h-2.5 w-2.5" /> PDF
            </a>
          )}
          {alreadyLinked ? (
            <Badge variant="secondary" className="ml-auto text-xs">
              <Link2 className="h-3 w-3 mr-1" /> Vinculado
            </Badge>
          ) : (
            <Button variant="outline" size="sm" className="ml-auto text-xs h-6 px-2"
              onClick={onLink} disabled={isLinking}>
              {isLinking ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Link2 className="h-3 w-3 mr-1" />}
              Vincular
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
