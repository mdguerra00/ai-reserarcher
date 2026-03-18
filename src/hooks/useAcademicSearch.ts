import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type {
  AcademicPaper,
  AcademicPaperLink,
  AcademicSearchParams,
  AcademicSearchResult,
} from '@/types/academic';

export function useAcademicSearch() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const searchMutation = useMutation<AcademicSearchResult, Error, AcademicSearchParams>({
    mutationFn: async (params) => {
      const { data, error } = await supabase.functions.invoke('search-academic', {
        body: params,
      });
      if (error) throw new Error(error.message || 'Erro ao buscar artigos');
      const result = data as AcademicSearchResult;

      // If papers don't have DB IDs (old edge function), resolve them by DOI
      const papersNeedIds = result.papers.some((p) => !p.id);
      if (papersNeedIds) {
        const dois = result.papers.map((p) => p.doi).filter(Boolean) as string[];
        if (dois.length > 0) {
          const { data: dbPapers } = await supabase
            .from('academic_papers')
            .select('*')
            .in('doi', dois);
          if (dbPapers) {
            const doiMap = new Map(dbPapers.map((p: any) => [p.doi, p]));
            result.papers = result.papers.map((p) => {
              if (p.id) return p;
              const dbPaper = p.doi ? doiMap.get(p.doi) : null;
              return dbPaper ? { ...p, ...dbPaper } : p;
            });
          }
        }
      }

      return result;
    },
  });

  const linkPaperMutation = useMutation<
    AcademicPaperLink,
    Error,
    { paperId: string; researchId: string; projectId?: string; notes?: string; doi?: string | null }
  >({
    mutationFn: async ({ paperId, researchId, projectId, notes, doi }) => {
      let resolvedPaperId = paperId;

      // If paperId doesn't look like a UUID, try to resolve by DOI
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(paperId) && doi) {
        const { data: dbPaper } = await supabase
          .from('academic_papers')
          .select('id')
          .eq('doi', doi)
          .single();
        if (dbPaper) {
          resolvedPaperId = dbPaper.id;
        } else {
          throw new Error('Artigo nao encontrado no banco de dados');
        }
      }

      const { data, error } = await supabase
        .from('academic_paper_links')
        .insert({
          paper_id: resolvedPaperId,
          research_id: researchId,
          project_id: projectId || null,
          linked_by: user?.id,
          notes: notes || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as AcademicPaperLink;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['linked-papers', variables.researchId],
      });
    },
  });

  const addManualPaperMutation = useMutation<
    AcademicPaper,
    Error,
    { paper: Omit<AcademicPaper, 'id' | 'created_at' | 'updated_at'>; researchId: string; projectId?: string }
  >({
    mutationFn: async ({ paper, researchId, projectId }) => {
      // Insert paper
      const { data: savedPaper, error: paperError } = await supabase
        .from('academic_papers')
        .insert({
          doi: paper.doi || null,
          title: paper.title,
          authors: paper.authors,
          abstract: paper.abstract || null,
          publication_year: paper.publication_year || null,
          journal: paper.journal || null,
          citation_count: paper.citation_count || 0,
          source_api: 'manual',
          api_data: {},
          pdf_url: paper.pdf_url || null,
          open_access: paper.open_access || false,
        })
        .select()
        .single();
      if (paperError) throw paperError;

      // Link to research
      const { error: linkError } = await supabase
        .from('academic_paper_links')
        .insert({
          paper_id: savedPaper.id,
          research_id: researchId,
          project_id: projectId || null,
          linked_by: user?.id,
        });
      if (linkError) throw linkError;

      return savedPaper as AcademicPaper;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['linked-papers', variables.researchId],
      });
    },
  });

  const unlinkPaperMutation = useMutation<void, Error, { linkId: string; researchId: string }>({
    mutationFn: async ({ linkId }) => {
      const { error } = await supabase
        .from('academic_paper_links')
        .delete()
        .eq('id', linkId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['linked-papers', variables.researchId],
      });
    },
  });

  const useLinkedPapers = (researchId: string | undefined) =>
    useQuery<AcademicPaperLink[]>({
      queryKey: ['linked-papers', researchId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('academic_paper_links')
          .select('*, paper:academic_papers(*)')
          .eq('research_id', researchId!)
          .order('created_at', { ascending: false });
        if (error) throw error;
        return (data || []).map((row: any) => ({
          ...row,
          paper: row.paper || undefined,
        })) as AcademicPaperLink[];
      },
      enabled: !!researchId && !!user,
    });

  return {
    searchPapers: searchMutation.mutateAsync,
    searchResults: searchMutation.data,
    isSearching: searchMutation.isPending,
    searchError: searchMutation.error,
    resetSearch: searchMutation.reset,
    linkPaper: linkPaperMutation.mutateAsync,
    isLinking: linkPaperMutation.isPending,
    unlinkPaper: unlinkPaperMutation.mutateAsync,
    isUnlinking: unlinkPaperMutation.isPending,
    addManualPaper: addManualPaperMutation.mutateAsync,
    isAddingManual: addManualPaperMutation.isPending,
    useLinkedPapers,
  };
}
