
-- Create a function that triggers on task_comments INSERT
-- and creates notifications for all project members who can see the task (except the author)
CREATE OR REPLACE FUNCTION public.notify_task_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task RECORD;
  v_author_name TEXT;
  v_member RECORD;
BEGIN
  -- Get the task info
  SELECT t.id, t.title, t.project_id
  INTO v_task
  FROM public.tasks t
  WHERE t.id = NEW.task_id AND t.deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Get the comment author name
  SELECT COALESCE(p.full_name, p.email) INTO v_author_name
  FROM public.profiles p
  WHERE p.id = NEW.created_by;

  -- Insert notification for every project member except the comment author
  INSERT INTO public.notifications (user_id, project_id, type, title, message, link)
  SELECT
    pm.user_id,
    v_task.project_id,
    'task_comment',
    'Nova mensagem em tarefa',
    v_author_name || ' comentou em "' || LEFT(v_task.title, 60) || '": ' || LEFT(NEW.content, 100),
    '/projects/' || v_task.project_id || '?tab=tasks&task=' || v_task.id
  FROM public.project_members pm
  WHERE pm.project_id = v_task.project_id
    AND pm.user_id != NEW.created_by;

  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS trg_notify_task_comment ON public.task_comments;
CREATE TRIGGER trg_notify_task_comment
  AFTER INSERT ON public.task_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_task_comment();
