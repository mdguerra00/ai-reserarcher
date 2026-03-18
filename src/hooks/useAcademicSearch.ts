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
      return data as AcademicSearchResult;
    },
  });

  const linkPaperMutation = useMutation<
    AcademicPaperLink,
    Error,
    { paperId: string; researchId: string; projectId?: string; notes?: string }
  >({
    mutationFn: async ({ paperId, researchId, projectId, notes }) => {
      const { data, error } = await supabase
        .from('academic_paper_links')
        .insert({
          paper_id: paperId,
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
    useLinkedPapers,
  };
}
