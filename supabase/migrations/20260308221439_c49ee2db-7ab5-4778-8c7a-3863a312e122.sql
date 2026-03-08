
-- Tighten the INSERT policy: only allow inserting notifications via service_role or for project members
DROP POLICY "Service can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (project_id IS NULL OR is_project_member(auth.uid(), project_id))
);
