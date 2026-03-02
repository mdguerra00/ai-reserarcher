
-- Allow NULL project_id for global indexing jobs
ALTER TABLE public.indexing_jobs ALTER COLUMN project_id DROP NOT NULL;

-- Add RLS policies for global indexing jobs
CREATE POLICY "Users can view global indexing jobs"
ON public.indexing_jobs FOR SELECT
USING (project_id IS NULL AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can create global indexing jobs"
ON public.indexing_jobs FOR INSERT
WITH CHECK (project_id IS NULL AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update global indexing jobs"
ON public.indexing_jobs FOR UPDATE
USING (project_id IS NULL AND auth.uid() IS NOT NULL);
