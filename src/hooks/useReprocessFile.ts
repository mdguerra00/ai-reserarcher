import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useReprocessFile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fileId, projectId, force = false }: { fileId: string; projectId: string; force?: boolean }) => {
      if (!user) throw new Error('Não autenticado');

      // Get file info for hash
      const { data: file, error: fileError } = await supabase
        .from('project_files')
        .select('storage_path')
        .eq('id', fileId)
        .single();

      if (fileError || !file) throw new Error('Arquivo não encontrado');

      // Create new extraction job (use null for global files)
      const effectiveProjectId = projectId || null;
      const { data: job, error: jobError } = await supabase
        .from('extraction_jobs')
        .insert({
          file_id: fileId,
          project_id: effectiveProjectId,
          created_by: user.id,
          file_hash: `reprocess_${Date.now()}`,
          status: 'pending',
        })
        .select('id')
        .single();

      if (jobError || !job) throw new Error('Erro ao criar job de extração');

      // Call edge function
      const { data: { session } } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('extract-knowledge', {
        body: { file_id: fileId, job_id: job.id, force },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao reprocessar');
      }

      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['file-extraction'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-items'] });
      queryClient.invalidateQueries({ queryKey: ['pending-extractions'] });
      toast.success(`Reprocessamento concluído: ${data?.insights_count || 0} insights extraídos`);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao reprocessar: ${error.message}`);
    },
  });
}
